import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, lifted, material, sky, sphere, vignette,
} from "@ui/scene";
import { ATOMIC_MASS, parseFormula } from "./molecules";

/**
 * Conservation of Mass — Grades 4-12.
 *
 * A flask of reactants sits on one pan of a beam balance; on the other pan are
 * weights set to match it exactly at the start. Then the reaction runs. With
 * the lid on, the beam never moves. Take the lid off, and the same reaction
 * that lost 44 grams of carbon dioxide sends the beam swinging — while burning
 * magnesium goes the other way, because the oxygen it takes came out of the air
 * and was never on the scale to begin with.
 *
 * Nothing is destroyed in either case, and the atom ledger beside the balance
 * proves it: every atom on the left of the equation appears on the right,
 * colour-coded, matched one for one. That is also why the reaction will not
 * run at all until the student has balanced it — an unbalanced equation
 * describes atoms appearing out of nowhere, which is not a reaction.
 *
 * ── Where the numbers come from ────────────────────────────────────────────
 * Every mass on screen is computed from IUPAC standard atomic weights and the
 * coefficients the student has set. Nothing is fudged: sodium hydrogen
 * carbonate really is 84.007 g/mol, the carbon dioxide that escapes really is
 * 44.009 g/mol, and the total on each side of a balanced equation agrees to
 * the last decimal place because it is the same set of atoms both times.
 */

type Phase = "solid" | "liquid" | "aqueous" | "gas";

interface Species {
  formula: string;
  name: string;
  phase: Phase;
}

export interface Reaction {
  id: string;
  title: string;
  /** What a student would actually see happen. */
  story: string;
  /** What the open flask does, and why. */
  openStory: string;
  reactants: Species[];
  products: Species[];
  /** The balanced coefficients, in slot order A B | C D E. Zero = unused slot. */
  correct: [number, number, number, number, number];
}

export const REACTIONS: Record<string, Reaction> = {
  soda: {
    id: "soda",
    title: "Baking soda + vinegar",
    story: "It fizzes hard, and the fizz is carbon dioxide leaving the mixture.",
    openStory: "The carbon dioxide floats away, so the balance loses exactly its mass.",
    reactants: [
      { formula: "NaHCO3", name: "Baking soda", phase: "solid" },
      { formula: "CH3COOH", name: "Vinegar", phase: "aqueous" },
    ],
    products: [
      { formula: "CH3COONa", name: "Sodium acetate", phase: "aqueous" },
      { formula: "H2O", name: "Water", phase: "liquid" },
      { formula: "CO2", name: "Carbon dioxide", phase: "gas" },
    ],
    correct: [1, 1, 1, 1, 1],
  },
  peroxide: {
    id: "peroxide",
    title: "Hydrogen peroxide breaking down",
    story: "The clear liquid froths as oxygen gas is released from it.",
    openStory: "The oxygen bubbles out of the open flask and the reading falls.",
    reactants: [
      { formula: "H2O2", name: "Hydrogen peroxide", phase: "aqueous" },
    ],
    products: [
      { formula: "H2O", name: "Water", phase: "liquid" },
      { formula: "O2", name: "Oxygen", phase: "gas" },
    ],
    correct: [2, 0, 2, 1, 0],
  },
  magnesium: {
    id: "magnesium",
    title: "Burning magnesium ribbon",
    story: "A blinding white flame leaves a little heap of white powder.",
    openStory: "The oxygen comes out of the air, so the powder weighs MORE than the ribbon did.",
    reactants: [
      { formula: "Mg", name: "Magnesium", phase: "solid" },
      { formula: "O2", name: "Oxygen from the air", phase: "gas" },
    ],
    products: [
      { formula: "MgO", name: "Magnesium oxide", phase: "solid" },
    ],
    correct: [2, 1, 2, 0, 0],
  },
  rust: {
    id: "rust",
    title: "Iron rusting",
    story: "Bright iron turns to crumbly orange-brown rust over weeks.",
    openStory: "Rust weighs more than the iron did, because oxygen from the air joined it.",
    reactants: [
      { formula: "Fe", name: "Iron", phase: "solid" },
      { formula: "O2", name: "Oxygen from the air", phase: "gas" },
    ],
    products: [
      { formula: "Fe2O3", name: "Iron(III) oxide (rust)", phase: "solid" },
    ],
    correct: [4, 3, 2, 0, 0],
  },
};

export function reactionOf(params: ParamValues): Reaction {
  return REACTIONS[params.reaction as string] ?? REACTIONS.soda;
}

/** The five coefficient slots, clipped to the slots this reaction actually has. */
export function coefficients(r: Reaction, params: ParamValues): { left: number[]; right: number[] } {
  const raw = [
    params.a as number, params.b as number,
    params.c as number, params.d as number, params.e as number,
  ].map((v) => Math.max(1, Math.round(v)));
  return {
    left: r.reactants.map((_, i) => raw[i]),
    right: r.products.map((_, i) => raw[2 + i]),
  };
}

/** Every atom on one side of the equation, counted. */
export function tally(species: Species[], coefs: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  species.forEach((s, i) => {
    for (const [el, n] of Object.entries(parseFormula(s.formula))) {
      out[el] = (out[el] ?? 0) + n * (coefs[i] ?? 0);
    }
  });
  return out;
}

export function molarMassOf(formula: string): number {
  let sum = 0;
  for (const [el, n] of Object.entries(parseFormula(formula))) sum += (ATOMIC_MASS[el] ?? 0) * n;
  return sum;
}

/** Grams of a whole side of the equation, optionally only what a balance sees. */
function sideMass(species: Species[], coefs: number[], weighable: (s: Species) => boolean): number {
  let sum = 0;
  species.forEach((s, i) => {
    if (weighable(s)) sum += molarMassOf(s.formula) * (coefs[i] ?? 0);
  });
  return sum;
}

const everything = () => true;
const notAGas = (s: Species) => s.phase !== "gas";

export interface Ledger {
  elements: string[];
  left: Record<string, number>;
  right: Record<string, number>;
  balanced: boolean;
  /** First element that does not match, for the message on the stage. */
  offender: string;
  /** True when no whole number smaller than these would also balance. */
  lowestTerms: boolean;
  massLeft: number;
  massRight: number;
  measuredBefore: number;
  measuredAfter: number;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function ledgerFor(r: Reaction, params: ParamValues): Ledger {
  const { left: cl, right: cr } = coefficients(r, params);
  const left = tally(r.reactants, cl);
  const right = tally(r.products, cr);
  const elements = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  let offender = "";
  for (const el of elements) {
    if ((left[el] ?? 0) !== (right[el] ?? 0)) { offender = el; break; }
  }
  const all = [...cl, ...cr];
  const common = all.reduce((g, v) => gcd(g, v), 0);
  const lidOn = Boolean(params.lid);
  const weighable = lidOn ? everything : notAGas;
  return {
    elements,
    left,
    right,
    balanced: offender === "",
    offender,
    lowestTerms: common <= 1,
    massLeft: sideMass(r.reactants, cl, everything),
    massRight: sideMass(r.products, cr, everything),
    measuredBefore: sideMass(r.reactants, cl, weighable),
    measuredAfter: sideMass(r.products, cr, weighable),
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** How far the reaction has run, 0 to 1. */
  progress: number;
  /** Beam angle, radians. Positive tips the flask side down. */
  angle: number;
  angularVelocity: number;
  t: number;
}

/** Seconds the reaction takes to run to completion once it is balanced. */
const REACTION_TIME = 4;
/** Beam tilt at a 10% mass change, radians — a real beam is this sensitive. */
const TILT_PER_FRACTION = 1.6;
const MAX_TILT = 0.2;

const model: SimModel<State> = {
  init() {
    return { progress: 0, angle: 0, angularVelocity: 0, t: 0 };
  },

  applyParams(state, params, prev) {
    // Rewriting the equation or opening the lid restarts the experiment: a
    // half-finished reaction under new coefficients would be a fiction.
    const changed = ["reaction", "a", "b", "c", "d", "e", "lid"]
      .some((k) => params[k] !== prev[k]);
    return changed ? { ...state, progress: 0 } : state;
  },

  step(state, dt, params) {
    const r = reactionOf(params);
    const led = ledgerFor(r, params);

    // An unbalanced equation is not a reaction that can happen, so it does not.
    const progress = led.balanced
      ? Math.min(1, state.progress + dt / REACTION_TIME)
      : 0;

    const now = led.measuredBefore + (led.measuredAfter - led.measuredBefore) * progress;
    const reference = led.measuredBefore;
    const fraction = reference > 0 ? (now - reference) / reference : 0;
    const target = Math.max(-MAX_TILT, Math.min(MAX_TILT, fraction * TILT_PER_FRACTION));

    // A damped spring, so the beam swings and settles the way a real one does.
    const stiffness = 34;
    const damping = 7.5;
    const accel = (target - state.angle) * stiffness - state.angularVelocity * damping;
    const angularVelocity = state.angularVelocity + accel * dt;
    const angle = state.angle + angularVelocity * dt;

    return { progress, angle, angularVelocity, t: state.t + dt };
  },

  readouts(state, params) {
    const r = reactionOf(params);
    const led = ledgerFor(r, params);
    const now = led.measuredBefore + (led.measuredAfter - led.measuredBefore) * state.progress;
    const leftAtoms = Object.values(led.left).reduce((a, b) => a + b, 0);
    const rightAtoms = Object.values(led.right).reduce((a, b) => a + b, 0);
    return [
      {
        key: "massNow", label: "Balance reading", quantity: q(now / 1000, "mass"),
        unit: "g", semantic: "mass", graphable: true,
      },
      {
        key: "massStart", label: "Reading at the start", quantity: q(led.measuredBefore / 1000, "mass"),
        unit: "g", semantic: "mass", graphable: true,
      },
      {
        key: "massChange", label: "Change in reading",
        quantity: q((now - led.measuredBefore) / 1000, "mass"),
        unit: "g", semantic: "force", graphable: true,
      },
      {
        key: "atomsLeft", label: "Atoms in the reactants", quantity: q(leftAtoms, "count"),
        semantic: "charge-pos", graphable: true,
      },
      {
        key: "atomsRight", label: "Atoms in the products", quantity: q(rightAtoms, "count"),
        semantic: "charge-neg", graphable: true,
      },
      {
        key: "totalLeft", label: "Total mass of reactants", quantity: q(led.massLeft / 1000, "mass"),
        unit: "g", semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "totalRight", label: "Total mass of products", quantity: q(led.massRight / 1000, "mass"),
        unit: "g", semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "progress", label: "Reaction complete", quantity: q(state.progress, "percent"),
        unit: "%", semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const r = reactionOf(params);
    const led = ledgerFor(r, params);
    const now = led.measuredBefore + (led.measuredAfter - led.measuredBefore) * state.progress;
    return {
      reaction: r.id,
      balanced: led.balanced,
      lowestTerms: led.lowestTerms,
      offender: led.offender,
      lidOn: Boolean(params.lid),
      progress: state.progress,
      complete: state.progress >= 1,
      massLeft: led.massLeft,
      massRight: led.massRight,
      massConserved: Math.abs(led.massLeft - led.massRight) < 1e-9,
      measuredBefore: led.measuredBefore,
      measuredAfter: led.measuredAfter,
      reading: now,
      readingChange: now - led.measuredBefore,
      atomsLeft: Object.values(led.left).reduce((a, b) => a + b, 0),
      atomsRight: Object.values(led.right).reduce((a, b) => a + b, 0),
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const HEADER_H = 78;
const FOOT_H = 64;
const LEDGER_W = 292;

function elementColor(el: string, theme: RenderContext<State>["theme"]): string {
  switch (el) {
    case "O": return theme.sci["force"];
    case "H": return theme.inkSoft;
    case "C": return theme.ink;
    case "Na": return theme.sci["field"];
    case "Mg": return theme.sci["acceleration"];
    case "Fe": return theme.sci["current"];
    default: return theme.sci["mass"];
  }
}

/** Split a formula into symbol/subscript pairs for drawing. */
function formulaParts(formula: string): { el: string; n: number }[] {
  const parts: { el: string; n: number }[] = [];
  let i = 0;
  while (i < formula.length) {
    const c = formula[i];
    if (c >= "A" && c <= "Z") {
      let symbol = formula[i++];
      while (i < formula.length && formula[i] >= "a" && formula[i] <= "z") symbol += formula[i++];
      let digits = "";
      while (i < formula.length && formula[i] >= "0" && formula[i] <= "9") digits += formula[i++];
      parts.push({ el: symbol, n: digits ? parseInt(digits, 10) : 1 });
    } else {
      i++;
    }
  }
  return parts;
}

function speciesWidth(
  ctx: CanvasRenderingContext2D, size: number, coef: number, parts: { el: string; n: number }[],
): number {
  ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  let w = coef > 1 ? ctx.measureText(String(coef)).width + size * 0.14 : 0;
  for (const p of parts) {
    w += ctx.measureText(p.el).width;
    if (p.n > 1) {
      ctx.font = `800 ${size * 0.62}px "Bricolage Grotesque", system-ui, sans-serif`;
      w += ctx.measureText(String(p.n)).width;
      ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    }
  }
  return w;
}

function drawSpecies(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  coef: number, parts: { el: string; n: number }[],
  ink: string, coefColor: string,
): number {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let cx = x;
  if (coef > 1) {
    ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = coefColor;
    ctx.fillText(String(coef), cx, y);
    cx += ctx.measureText(String(coef)).width + size * 0.14;
  }
  for (const p of parts) {
    ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(p.el, cx, y);
    cx += ctx.measureText(p.el).width;
    if (p.n > 1) {
      ctx.font = `800 ${size * 0.62}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = hexA(ink, 0.75);
      ctx.fillText(String(p.n), cx, y + size * 0.2);
      cx += ctx.measureText(String(p.n)).width;
    }
  }
  ctx.restore();
  return cx - x;
}

const SLOT_LETTERS = ["A", "B", "C", "D", "E"];

function drawEquation(rc: RenderContext<State>, x: number, y: number, maxW: number) {
  const { ctx, theme, params } = rc;
  const r = reactionOf(params);
  const { left: cl, right: cr } = coefficients(r, params);
  const led = ledgerFor(r, params);
  const items: { coef: number; parts: { el: string; n: number }[]; slot: number }[] = [
    ...r.reactants.map((s, i) => ({ coef: cl[i], parts: formulaParts(s.formula), slot: i })),
    ...r.products.map((s, i) => ({ coef: cr[i], parts: formulaParts(s.formula), slot: 2 + i })),
  ];
  const split = r.reactants.length;

  let size = 22;
  const measure = (s: number) => {
    ctx.font = `800 ${s}px "Bricolage Grotesque", system-ui, sans-serif`;
    const glue = ctx.measureText(" + ").width;
    const arrow = ctx.measureText("  →  ").width;
    return items.reduce((sum, it) => sum + speciesWidth(ctx, s, it.coef, it.parts), 0)
      + glue * (items.length - 2) + arrow;
  };
  while (size > 11 && measure(size) > maxW) size -= 1.5;

  let cx = x;
  items.forEach((it, i) => {
    if (i === split) {
      ctx.save();
      ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = theme.accent;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("  →  ", cx, y);
      cx += ctx.measureText("  →  ").width;
      ctx.restore();
    } else if (i > 0) {
      ctx.save();
      ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = theme.inkSoft;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(" + ", cx, y);
      cx += ctx.measureText(" + ").width;
      ctx.restore();
    }
    const coefColor = led.balanced ? theme.sci["energy-kinetic"] : theme.sci["acceleration"];
    const w = drawSpecies(ctx, cx, y, size, it.coef, it.parts, theme.ink, coefColor);
    caption(ctx, cx + w / 2, y - size - 4, SLOT_LETTERS[it.slot], theme, {
      align: "center", size: 9, color: theme.inkSoft, weight: 700,
    });
    cx += w;
  });

  const verdict = led.balanced
    ? led.lowestTerms ? "Balanced" : "Balanced — but the numbers could be smaller"
    : `Not balanced yet: the ${led.offender} atoms do not match`;
  caption(ctx, x, y + 22, verdict, theme, {
    size: 12, weight: 700,
    color: led.balanced ? theme.sci["energy-kinetic"] : theme.sci["force"],
  });
}

/** A molecule as a little cluster of coloured atoms, one dot per atom. */
function drawGlyph(
  rc: RenderContext<State>, formula: string, cx: number, cy: number, r: number, alpha: number,
) {
  if (alpha <= 0.02) return;
  const { ctx, theme } = rc;
  const atoms: string[] = [];
  for (const [el, n] of Object.entries(parseFormula(formula))) {
    for (let k = 0; k < n; k++) atoms.push(el);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  if (atoms.length === 1) {
    sphere(ctx, cx, cy, r, elementColor(atoms[0], theme));
  } else {
    const ring = r * 0.62;
    atoms.forEach((el, i) => {
      const a = (i / atoms.length) * Math.PI * 2 - Math.PI / 2;
      sphere(ctx, cx + Math.cos(a) * ring, cy + Math.sin(a) * ring, r * 0.5, elementColor(el, theme));
    });
  }
  ctx.restore();
}

function drawBalance(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, params, band } = rc;
  const r = reactionOf(params);
  const led = ledgerFor(r, params);
  const { left: cl, right: cr } = coefficients(r, params);
  const lidOn = Boolean(params.lid);

  const cxp = x + w / 2;
  const pivotY = y + h * 0.30;
  const arm = Math.min(w * 0.34, 190);
  const hang = Math.min(h * 0.34, 128);
  const angle = state.angle;

  /* ---- the stand ---- */
  const baseY = y + h - 8;
  material(ctx, cxp - 46, baseY - 10, 92, 10, theme.inkSoft, 4);
  material(ctx, cxp - 7, pivotY, 14, baseY - 10 - pivotY, theme.inkSoft, 3);

  /* ---- the beam ---- */
  const lx = cxp - Math.cos(angle) * arm;
  const ly = pivotY + Math.sin(angle) * arm;
  const rx = cxp + Math.cos(angle) * arm;
  const ry = pivotY - Math.sin(angle) * arm;
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, cxp, pivotY, 9, theme.accent);

  /* ---- hangers ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.9);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + hang);
  ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + hang);
  ctx.stroke();
  ctx.restore();

  const panW = Math.min(w * 0.30, 150);
  for (const px of [lx, rx]) {
    const py = px === lx ? ly + hang : ry + hang;
    material(ctx, px - panW / 2, py, panW, 7, theme.inkSoft, 3);
  }

  /* ---- the flask, and the reaction inside it ---- */
  const flaskBase = ly + hang;
  const fw = Math.min(panW * 0.86, 124);
  const fh = Math.min(hang * 1.05, 120);
  const neckW = fw * 0.26;
  const neckTop = flaskBase - fh;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lx - neckW / 2, neckTop);
  ctx.lineTo(lx - neckW / 2, neckTop + fh * 0.30);
  ctx.lineTo(lx - fw / 2, flaskBase - 4);
  ctx.quadraticCurveTo(lx - fw / 2, flaskBase, lx - fw / 2 + 6, flaskBase);
  ctx.lineTo(lx + fw / 2 - 6, flaskBase);
  ctx.quadraticCurveTo(lx + fw / 2, flaskBase, lx + fw / 2, flaskBase - 4);
  ctx.lineTo(lx + neckW / 2, neckTop + fh * 0.30);
  ctx.lineTo(lx + neckW / 2, neckTop);
  ctx.closePath();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.12);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.85);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Molecules: reactants fade out, products fade in, in the same flask.
  const glyphR = Math.max(5, fw * 0.10);
  const slots: { x: number; y: number }[] = [];
  const rows = 3, cols = 4;
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const halfWidth = (neckW / 2) + (fw / 2 - neckW / 2) * (0.35 + 0.65 * t);
    for (let col = 0; col < cols; col++) {
      const u = col / (cols - 1);
      slots.push({
        x: lx + (u - 0.5) * 2 * (halfWidth - glyphR - 2),
        y: flaskBase - 12 - (rows - 1 - row) * (fh * 0.22),
      });
    }
  }
  let slot = 0;
  const place = (formula: string, count: number, alpha: number) => {
    const drawn = Math.min(count, 4);
    for (let k = 0; k < drawn && slot < slots.length; k++, slot++) {
      const s = slots[slot];
      const bob = Math.sin(state.t * 1.6 + slot) * 2;
      drawGlyph(rc, formula, s.x, s.y + bob, glyphR, alpha);
    }
  };
  r.reactants.forEach((s, i) => place(s.formula, cl[i], 1 - state.progress));
  slot = 0;
  r.products.forEach((s, i) => place(s.formula, cr[i], state.progress));

  /* ---- the lid, or the gas going through the gap where it was ---- */
  if (lidOn) {
    material(ctx, lx - neckW / 2 - 4, neckTop - 7, neckW + 8, 8, theme.sci["mass"], 3);
    caption(ctx, lx, neckTop - 14, "sealed", theme, {
      align: "center", size: 10, color: theme.inkSoft, weight: 700,
    });
  } else if (led.balanced) {
    // Anything gaseous crosses the neck: out if it is made, in if it is used.
    const gasOut = r.products.some((s) => s.phase === "gas");
    const gasIn = r.reactants.some((s) => s.phase === "gas");
    const moving = state.progress > 0.01 && state.progress < 1;
    const flow = gasOut ? 1 : gasIn ? -1 : 0;
    if (flow !== 0) {
      const formula = flow > 0
        ? (r.products.find((s) => s.phase === "gas")?.formula ?? "CO2")
        : (r.reactants.find((s) => s.phase === "gas")?.formula ?? "O2");
      const rise = Math.min(70, h * 0.22);
      for (let i = 0; i < 9; i++) {
        const phase = ((state.t * 0.55 + i / 9) % 1);
        const travel = flow > 0 ? phase : 1 - phase;
        const gy = neckTop - 6 - travel * rise;
        const gx = lx + Math.sin(phase * 6 + i) * 9;
        const fade = (moving || state.progress >= 1 ? 1 : 0) * (1 - Math.abs(travel - 0.5) * 1.2);
        drawGlyph(rc, formula, gx, gy, glyphR * 0.72, Math.max(0, fade) * 0.9);
      }
      caption(ctx, lx, neckTop - rise - 12, flow > 0 ? `${formula} leaving` : `${formula} joining from the air`, theme, {
        align: "center", size: 10, weight: 700,
        color: flow > 0 ? theme.sci["gas"] : theme.sci["energy-kinetic"],
      });
    }
    caption(ctx, lx, neckTop - 14, "open", theme, {
      align: "center", size: 10, color: theme.sci["gas"], weight: 700,
    });
  }

  /* ---- the reference weights, set to match the start ---- */
  const wBase = ry + hang;
  const blocks = 3;
  for (let i = 0; i < blocks; i++) {
    const bw = panW * (0.62 - i * 0.13);
    material(ctx, rx - bw / 2, wBase - 13 * (i + 1), bw, 12, theme.sci["mass"], 3);
  }
  badge(ctx, rx, wBase + 20, `${led.measuredBefore.toFixed(2)} g`, theme, {
    align: "center", color: theme.sci["mass"], sub: "set at the start",
  });

  /* ---- what the beam is saying ---- */
  const now = led.measuredBefore + (led.measuredAfter - led.measuredBefore) * state.progress;
  badge(ctx, lx, flaskBase + 26, `${now.toFixed(2)} g`, theme, {
    align: "center", color: theme.accent, sub: "in the flask",
  });
  if (led.balanced && state.progress > 0.1) {
    glow(ctx, lx, flaskBase - fh * 0.4, fw * 0.7, theme.accent, 0.10 + 0.10 * Math.sin(state.t * 3));
  }
  if (band !== "3-5") {
    caption(ctx, x + 6, y + 14, r.story, theme, { size: 11, color: theme.inkSoft });
  }
}

/**
 * The atom ledger. Every atom on the left of the equation is drawn as a dot,
 * and so is every atom on the right; matching rows sit either side of one line
 * so a mismatch shows up as an overhang rather than as a number to be read.
 */
function drawLedger(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params } = rc;
  const r = reactionOf(params);
  const led = ledgerFor(r, params);

  lifted(ctx, 12, 4, () => {
    ctx.fillStyle = theme.surface;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
  }, 0.18);
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 12, y + 18, "Every atom, counted", theme, { size: 12, weight: 800 });
  caption(ctx, x + 12, y + 34, "reactants", theme, { size: 9, color: theme.inkSoft });
  caption(ctx, x + w - 12, y + 34, "products", theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });

  const mid = x + w / 2;
  ctx.save();
  ctx.strokeStyle = hexA(theme.accent, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mid, y + 40);
  ctx.lineTo(mid, y + h - 34);
  ctx.stroke();
  ctx.restore();

  const rowH = Math.min(30, (h - 82) / Math.max(1, led.elements.length));
  const dotR = Math.max(3, Math.min(6, rowH * 0.22));
  let ry = y + 52;
  for (const el of led.elements) {
    const nl = led.left[el] ?? 0;
    const nr = led.right[el] ?? 0;
    const color = elementColor(el, theme);
    const ok = nl === nr;

    caption(ctx, mid, ry - rowH * 0.36, el, theme, {
      align: "center", size: 10, color: theme.inkSoft, weight: 700,
    });

    const step = dotR * 2.3;
    const capacity = Math.max(1, Math.floor((w / 2 - 34) / step));
    for (let i = 0; i < Math.min(nl, capacity); i++) {
      sphere(ctx, mid - 14 - i * step, ry, dotR, color);
    }
    for (let i = 0; i < Math.min(nr, capacity); i++) {
      sphere(ctx, mid + 14 + i * step, ry, dotR, color);
    }
    caption(ctx, x + 10, ry, String(nl), theme, {
      size: 11, weight: 800, color: ok ? theme.ink : theme.sci["force"],
    });
    caption(ctx, x + w - 10, ry, String(nr), theme, {
      align: "right", size: 11, weight: 800, color: ok ? theme.ink : theme.sci["force"],
    });
    if (!ok) {
      caption(ctx, mid, ry + rowH * 0.34, `${nl > nr ? nl - nr : nr - nl} unaccounted for`, theme, {
        align: "center", size: 9, color: theme.sci["force"], weight: 700,
      });
    }
    ry += rowH;
  }

  caption(
    ctx, x + w / 2, y + h - 16,
    led.balanced
      ? "Nothing made, nothing lost — the same atoms, rearranged."
      : "Atoms cannot appear or vanish. Fix the coefficients.",
    theme,
    {
      align: "center", size: 10, weight: 700,
      color: led.balanced ? theme.sci["energy-kinetic"] : theme.sci["force"],
    },
  );
}

function drawFoot(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, state, theme, params } = rc;
  const r = reactionOf(params);
  const led = ledgerFor(r, params);
  const lidOn = Boolean(params.lid);
  const now = led.measuredBefore + (led.measuredAfter - led.measuredBefore) * state.progress;
  const change = now - led.measuredBefore;

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.85);
  roundRect(ctx, x, y, w, FOOT_H - 10, 10);
  ctx.fill();
  ctx.restore();

  const cells: [string, string, string][] = [
    ["At the start", `${led.measuredBefore.toFixed(2)} g`, "mass"],
    ["Now", `${now.toFixed(2)} g`, "mass"],
    [
      "Change",
      `${change >= 0 ? "+" : ""}${change.toFixed(2)} g`,
      Math.abs(change) < 0.005 ? "energy-kinetic" : "force",
    ],
  ];
  const cw = Math.min(150, w / 4);
  cells.forEach(([label, value, sci], i) => {
    const cx = x + 14 + i * cw;
    caption(ctx, cx, y + 16, label, theme, { size: 10, color: theme.inkSoft });
    caption(ctx, cx, y + 36, value, theme, { size: 17, weight: 800, color: theme.sci[sci] });
  });

  const message = !led.balanced
    ? "Balance the equation and the reaction will run."
    : lidOn
      ? "Sealed: nothing can get in or out, so the reading never moves."
      : r.openStory;
  const tx = x + 14 + 3 * cw + 10;
  if (tx < x + w - 60) {
    caption(ctx, tx, y + 26, message, theme, { size: 11, weight: 600 });
    if (led.balanced && !lidOn) {
      caption(ctx, tx, y + 42, "The atoms are still all there — some of them are just no longer on the scale.", theme, {
        size: 10, color: theme.inkSoft,
      });
    }
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, theme, width, height, overlays } = rc;

  sky(ctx, width, height, theme, "indoor");

  drawEquation(rc, 14, 34, width - 28);

  const showLedger = overlays.ledger && width >= 660;
  const showFoot = height >= 380;
  const areaX = 12;
  const areaY = HEADER_H;
  const areaW = width - areaX * 2 - (showLedger ? LEDGER_W + 12 : 0);
  const areaH = height - areaY - (showFoot ? FOOT_H : 10);

  if (areaW > 120 && areaH > 120) drawBalance(rc, areaX, areaY, areaW, areaH);
  if (showLedger && areaH > 120) drawLedger(rc, width - LEDGER_W - 12, areaY, LEDGER_W, areaH);
  if (showFoot) drawFoot(rc, 12, height - FOOT_H + 2, width - 24);

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const conservationSim: SimManifest<State> = {
  id: "chem.conservation",
  title: "Conservation of Mass",
  tagline: "Seal the flask and the balance never moves. Open it, and find out where the missing grams went.",
  subject: "chemistry",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11],
  standards: { ngss: ["5-PS1-2", "MS-PS1-5", "HS-PS1-7"] },
  learningGoals: [
    "Show that the total mass is the same before and after a reaction in a closed container.",
    "Explain why an open container can appear to gain or lose mass.",
    "Count the atoms on each side of an equation and match them one for one.",
    "Balance an equation by choosing coefficients.",
  ],
  misconceptions: [
    "Mass is destroyed when something burns or fizzes away",
    "Gases weigh nothing",
    "Rust adds nothing to the iron — it just changes it",
    "You can balance an equation by changing the subscripts",
  ],
  tickRate: 60,
  interactionHint: "Set the coefficients until every atom matches, then watch the flask.",
  params: {
    reaction: {
      type: "option", label: "Reaction",
      options: [
        { value: "soda", label: "Baking soda" },
        { value: "peroxide", label: "Peroxide" },
        { value: "magnesium", label: "Magnesium" },
        { value: "rust", label: "Rust" },
      ],
      default: "soda",
    },
    lid: {
      type: "boolean", label: "Lid on the flask", default: true,
      help: "Sealed, nothing can get in or out. Open, gases can.",
    },
    a: {
      type: "number", label: "Coefficient A", kind: "count",
      min: 1, max: 6, step: 1, default: 1,
      help: "The number in front of the first reactant. Only the letters shown on the equation matter.",
    },
    b: {
      type: "number", label: "Coefficient B", kind: "count",
      min: 1, max: 6, step: 1, default: 1,
    },
    c: {
      type: "number", label: "Coefficient C", kind: "count",
      min: 1, max: 6, step: 1, default: 1,
    },
    d: {
      type: "number", label: "Coefficient D", kind: "count",
      min: 1, max: 6, step: 1, default: 1,
      bands: ["6-8", "9-12"],
    },
    e: {
      type: "number", label: "Coefficient E", kind: "count",
      min: 1, max: 6, step: 1, default: 1,
      bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "ledger", label: "Atom ledger", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "closed-and-open",
      title: "Where did the mass go?",
      question: "Does a reaction lose mass when it fizzes away?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["5-PS1-2", "MS-PS1-5"],
      setup: { reaction: "soda", lid: true, a: 1, b: 1, c: 1, d: 1, e: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you run it",
          instruction: "Baking soda and vinegar fizz hard in a sealed flask on a balance.",
          predict: {
            prompt: "With the lid sealed, the reading on the balance will…",
            options: ["go down", "stay exactly the same", "go up", "go down then back up"],
            correct: 1,
            reveal: "It does not move. The gas is still inside, so every atom is still on the scale — 144.06 g before, 144.06 g after.",
          },
        },
        {
          id: "closed",
          phase: "measure",
          title: "Run it sealed",
          instruction: "Press play and watch the balance until the reaction finishes. Record it.",
          requireData: 1,
          check: {
            describe: "The sealed reaction has finished",
            test: (v) => Boolean(v.facts.lidOn) && Boolean(v.facts.complete),
          },
        },
        {
          id: "open",
          phase: "measure",
          title: "Now take the lid off",
          instruction: "Turn off Lid on the flask and run it again. Record the new reading.",
          requireData: 2,
          check: {
            describe: "The open reaction has finished",
            test: (v) => !v.facts.lidOn && Boolean(v.facts.complete),
          },
          hints: ["Watch the neck of the flask as it runs."],
        },
        {
          id: "magnesium",
          phase: "measure",
          title: "Try one that goes the other way",
          instruction: "Switch to Magnesium, leave the lid off, balance it and run it.",
          check: {
            describe: "Magnesium burns in the open, balanced",
            test: (v) =>
              v.facts.reaction === "magnesium" && !v.facts.lidOn
              && Boolean(v.facts.balanced) && Boolean(v.facts.complete),
          },
          hints: [
            "2 Mg + O₂ → 2 MgO. Coefficients A, B and C.",
            "The ash weighs more than the ribbon. Where could the extra come from?",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain both results",
          instruction: "One reading fell, one rose, and no atoms were made or lost in either.",
          write: {
            prompt: "Why did the open flask lose mass in one reaction and gain it in the other?",
            placeholder: "In the fizzing reaction the gas ... In the burning reaction the oxygen ...",
          },
        },
      ],
    },
    {
      id: "balance-it",
      title: "Balance the equation",
      question: "How do you make the atoms on both sides match?",
      bands: ["6-8", "9-12"],
      minutes: 22,
      standards: ["MS-PS1-5"],
      setup: { reaction: "peroxide", lid: true, a: 1, b: 1, c: 1, d: 1, e: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "H₂O₂ → H₂O + O₂ has 2 oxygen on the left and 3 on the right.",
          predict: {
            prompt: "To fix it you should…",
            options: [
              "change H₂O₂ to H₂O₃",
              "put numbers in front of the formulas",
              "add another oxygen atom to the right",
              "cross out the extra oxygen",
            ],
            correct: 1,
            reveal: "Only coefficients may change. Changing a subscript would turn the substance into something else — H₂O₃ is not water, and it is not peroxide either.",
          },
        },
        {
          id: "fix",
          phase: "setup",
          title: "Balance the peroxide",
          instruction: "Change coefficients A, C and D until every row of the ledger matches.",
          check: {
            describe: "The peroxide equation is balanced",
            test: (v) => v.facts.reaction === "peroxide" && Boolean(v.facts.balanced),
          },
          hints: [
            "Try doubling the peroxide first, and see what that does to the hydrogen.",
            "2 H₂O₂ gives you 4 H and 4 O to place on the right.",
          ],
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it and record",
          instruction: "Now that it balances, the reaction can run. Record the masses.",
          requireData: 2,
        },
        {
          id: "harder",
          phase: "setup",
          title: "Now a harder one",
          instruction: "Switch to Rust and balance 4 Fe + 3 O₂ → 2 Fe₂O₃ yourself.",
          check: {
            describe: "The rust equation is balanced",
            test: (v) => v.facts.reaction === "rust" && Boolean(v.facts.balanced),
          },
          hints: [
            "Each Fe₂O₃ needs 2 iron and 3 oxygen atoms.",
            "Oxygen only arrives in pairs, so the right-hand oxygen total must be even.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say why it has to balance",
          instruction: "Connect the atom counts to the mass on the balance.",
          write: {
            prompt: "Why does a balanced equation guarantee the mass is the same on both sides?",
            placeholder: "If the same atoms are there before and after, then ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "balance-rust",
      title: "Balance the rust",
      brief: "4 Fe + 3 O₂ → 2 Fe₂O₃. Find those numbers without being told them.",
      bands: ["6-8", "9-12"],
      setup: { reaction: "rust", lid: true, a: 1, b: 1, c: 1, d: 1, e: 1 },
      goal: {
        describe: "The rust equation balances",
        test: (v) => v.facts.reaction === "rust" && Boolean(v.facts.balanced),
      },
      stars: {
        two: {
          describe: "Balanced with the smallest whole numbers that work",
          test: (v) =>
            v.facts.reaction === "rust" && Boolean(v.facts.balanced) && Boolean(v.facts.lowestTerms),
        },
        three: {
          describe: "Run the balanced reaction all the way through",
          test: (v) =>
            v.facts.reaction === "rust" && Boolean(v.facts.balanced)
            && Boolean(v.facts.lowestTerms) && Boolean(v.facts.complete),
        },
      },
      hints: [
        "Start from the product: every Fe₂O₃ needs 2 iron and 3 oxygen.",
        "Oxygen arrives two at a time, so the total oxygen on the right must be even.",
        "Two Fe₂O₃ need 4 iron and 6 oxygen — and 6 oxygen is 3 O₂.",
      ],
    },
    {
      id: "gain-mass",
      title: "Make the balance go up",
      brief: "Find a reaction that makes an open flask weigh MORE at the end than at the start.",
      bands: ["6-8", "9-12"],
      setup: { reaction: "soda", lid: false, a: 1, b: 1, c: 1, d: 1, e: 1 },
      goal: {
        describe: "An open, balanced reaction whose reading rises",
        test: (v) =>
          !v.facts.lidOn && Boolean(v.facts.balanced) && (v.facts.readingChange as number) > 0.5,
      },
      stars: {
        two: {
          describe: "Run it all the way and gain more than 20 g",
          test: (v) =>
            !v.facts.lidOn && Boolean(v.facts.balanced) && Boolean(v.facts.complete)
            && (v.facts.readingChange as number) > 20,
        },
        three: {
          describe: "Gain more than 90 g in one open reaction",
          test: (v) =>
            !v.facts.lidOn && Boolean(v.facts.balanced) && Boolean(v.facts.complete)
            && (v.facts.readingChange as number) > 90,
        },
      },
      hints: [
        "Which of these reactions takes something out of the air rather than releasing it?",
        "Burning magnesium and rusting iron both pull oxygen in.",
        "Rust uses three whole O₂ molecules — that is a lot of extra mass.",
      ],
    },
  ],
};
