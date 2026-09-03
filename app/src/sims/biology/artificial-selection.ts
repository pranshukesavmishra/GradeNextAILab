import type { ParamValues, RenderContext, SimContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  caption, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Artificial Selection — Grades 4-12.
 *
 * The same three ingredients as natural selection — variation, heredity,
 * differential reproduction — with the student holding the third one. You
 * decide which individuals breed; nothing else changes; the population moves.
 *
 * The genetics is the standard quantitative model. Each individual carries a
 * breeding value (the part it can pass on) and an environmental deviation (the
 * part it cannot), so heritability is h² = Va / (Va + Ve) and the response to
 * one generation of selection is the breeder's equation, R = h² S. Set
 * heritability to zero and selection does nothing at all, however hard you
 * push — which is the single most important thing in the topic.
 *
 * The three cases are real domestications, with their real starting and
 * finishing values:
 *  · teosinte → maize: ears about 2.5 cm with 6-12 kernels became 18 cm ears
 *    with hundreds; begun in the Balsas valley of Mexico about 9,000 years ago.
 *  · grey wolf → dog: a 35 kg wild ancestor became breeds from 2 kg to 70 kg,
 *    over at least 15,000 years.
 *  · wild mustard → six vegetables: Brassica oleracea, one species, selected
 *    for leaves (kale), flower buds (broccoli) or stem (kohlrabi).
 */

/* ------------------------------------------------------------------ *
 * The cases
 * ------------------------------------------------------------------ */

export interface TraitDef {
  name: string;
  unit: string;
  /** Wild starting mean and standard deviation, in the trait's own unit. */
  start: number;
  sd: number;
  /** What humans actually bred it to, and what that variety is called. */
  target: number;
  targetName: string;
}

export interface BreedCase {
  key: string;
  wild: string;
  bred: string;
  years: number;
  shape: "cob" | "dog" | "plant";
  traits: [TraitDef, TraitDef, TraitDef];
}

export const CASES: Record<string, BreedCase> = {
  maize: {
    key: "maize", wild: "Teosinte", bred: "Maize", years: 9000, shape: "cob",
    traits: [
      { name: "Ear length", unit: "cm", start: 2.5, sd: 0.6, target: 18, targetName: "modern maize" },
      { name: "Kernels per ear", unit: "", start: 8, sd: 2.2, target: 600, targetName: "modern maize" },
      { name: "Kernel softness", unit: "", start: 2, sd: 0.8, target: 9, targetName: "edible kernels" },
    ],
  },
  dog: {
    key: "dog", wild: "Grey wolf", bred: "Dog breeds", years: 15000, shape: "dog",
    traits: [
      { name: "Body mass", unit: "kg", start: 35, sd: 5, target: 70, targetName: "Great Dane" },
      { name: "Coat length", unit: "cm", start: 5, sd: 1.2, target: 20, targetName: "Komondor" },
      { name: "Leg length", unit: "cm", start: 55, sd: 6, target: 90, targetName: "Irish wolfhound" },
    ],
  },
  mustard: {
    key: "mustard", wild: "Wild mustard", bred: "Six vegetables", years: 2500, shape: "plant",
    traits: [
      { name: "Leaf length", unit: "cm", start: 12, sd: 3, target: 40, targetName: "kale" },
      { name: "Flower bud cluster", unit: "g", start: 5, sd: 1.5, target: 300, targetName: "broccoli" },
      { name: "Stem width", unit: "cm", start: 1.5, sd: 0.4, target: 10, targetName: "kohlrabi" },
    ],
  },
};

export const TRAIT_KEYS = ["t0", "t1", "t2"] as const;

export function traitIndex(key: string): number {
  const i = TRAIT_KEYS.indexOf(key as "t0");
  return i < 0 ? 0 : i;
}

/* ------------------------------------------------------------------ *
 * Quantitative genetics
 * ------------------------------------------------------------------ */

interface Individual {
  /** Breeding values: the heritable part of each trait, as a deviation. */
  a: number[];
  /** Environmental deviations: real, visible, and not passed on. */
  e: number[];
  x: number;
  y: number;
}

/** What you can actually see and measure: genes plus environment. */
export function phenotype(ind: Individual, caseDef: BreedCase, t: number): number {
  return caseDef.traits[t].start + ind.a[t] + ind.e[t];
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

interface State {
  pop: Individual[];
  generation: number;
  genClock: number;
  /** Founding population mean for each trait. */
  startMean: number[];
  /** Selected-trait mean each generation, for the plot. */
  hist: number[];
  /** The last generation's selection differential and realised response. */
  lastS: number;
  lastR: number;
  cumS: number;
  cumR: number;
  /** Fades after each round of breeding. */
  flash: number;
}

const HISTORY_MAX = 200;
const GEN_SECONDS = 1.0;

function founding(params: ParamValues, ctx: SimContext): State {
  const caseDef = CASES[params.case as string] ?? CASES.maize;
  const n = Math.round(params.popSize as number);
  const h2 = params.heritability as number;
  const pop: Individual[] = [];
  for (let i = 0; i < n; i++) {
    pop.push(newIndividual(caseDef, h2, ctx.rng));
  }
  const start = caseDef.traits.map((_, t) => mean(pop.map((p) => phenotype(p, caseDef, t))));
  return {
    pop, generation: 0, genClock: 0,
    startMean: start,
    hist: [start[traitIndex(params.selectFor as string)]],
    lastS: 0, lastR: 0, cumS: 0, cumR: 0, flash: 0,
  };
}

/**
 * A founding individual. Total phenotypic variance is the trait's own sd; the
 * split between heritable and environmental parts is what h² controls.
 */
function newIndividual(caseDef: BreedCase, h2: number, rng: Rng): Individual {
  const a: number[] = [];
  const e: number[] = [];
  for (const tr of caseDef.traits) {
    const va = h2 * tr.sd * tr.sd;
    const ve = (1 - h2) * tr.sd * tr.sd;
    a.push(rng.normal(0, Math.sqrt(va)));
    e.push(rng.normal(0, Math.sqrt(ve)));
  }
  return { a, e, x: rng.next(), y: rng.next() };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/**
 * The live breeding cut: who would breed if the generation turned over right
 * now. This is the boundary the histogram draws — the phenotype of the worst
 * individual inside the cut, and how much better than average the chosen
 * parents currently are.
 */
function selectionCut(state: State, params: ParamValues): { cutoff: number; nextS: number } {
  const caseDef = CASES[params.case as string] ?? CASES.maize;
  const t = traitIndex(params.selectFor as string);
  const bigger = params.direction !== "smaller";
  const values = state.pop.map((p) => phenotype(p, caseDef, t));
  if (!values.length) return { cutoff: caseDef.traits[t].start, nextS: 0 };
  const sorted = values.slice().sort((a, b) => (bigger ? b - a : a - b));
  const nKeep = Math.max(2, Math.min(sorted.length, Math.round(sorted.length * (params.keep as number))));
  return { cutoff: sorted[nKeep - 1], nextS: mean(sorted.slice(0, nKeep)) - mean(sorted) };
}

const model: SimModel<State> = {
  init(params, ctx) {
    return founding(params, ctx);
  },

  applyParams(state, params, prev, ctx) {
    // A different species, a different heritability or a different population
    // size is a different experiment. Changing who you breed is not.
    if (
      params.case !== prev.case || params.popSize !== prev.popSize ||
      params.heritability !== prev.heritability
    ) {
      return founding(params, ctx);
    }
    if (params.selectFor !== prev.selectFor) {
      const caseDef = CASES[params.case as string] ?? CASES.maize;
      const t = traitIndex(params.selectFor as string);
      return {
        ...state,
        hist: [mean(state.pop.map((p) => phenotype(p, caseDef, t)))],
        lastS: 0, lastR: 0, cumS: 0, cumR: 0,
      };
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const caseDef = CASES[params.case as string] ?? CASES.maize;
    const t = traitIndex(params.selectFor as string);
    const keep = params.keep as number;
    const bigger = params.direction !== "smaller";
    const h2 = params.heritability as number;
    const n = state.pop.length;

    let genClock = state.genClock + dt;
    let flash = Math.max(0, state.flash - dt * 2.2);
    if (genClock < GEN_SECONDS || n === 0) {
      return { ...state, genClock, flash };
    }
    genClock -= GEN_SECONDS;

    /* --- who breeds? ------------------------------------------------- */
    const scored = state.pop.map((ind, i) => ({ i, p: phenotype(ind, caseDef, t) }));
    scored.sort((p, r) => (bigger ? r.p - p.p : p.p - r.p));
    const nKeep = Math.max(2, Math.round(n * keep));
    const chosen = scored.slice(0, nKeep);

    const popMean = mean(scored.map((s) => s.p));
    const selMean = mean(chosen.map((s) => s.p));
    // The selection differential: how much better than average the parents are.
    const S = selMean - popMean;

    /* --- breed the next generation ----------------------------------- */
    const next: Individual[] = [];
    const parents = chosen.map((c) => state.pop[c.i]);
    for (let k = 0; k < n; k++) {
      const m = parents[ctx.rng.int(0, parents.length - 1)];
      const f = parents[ctx.rng.int(0, parents.length - 1)];
      const a: number[] = [];
      const e: number[] = [];
      for (let ti = 0; ti < caseDef.traits.length; ti++) {
        const sd = caseDef.traits[ti].sd;
        const va = h2 * sd * sd;
        const ve = (1 - h2) * sd * sd;
        // Mendelian sampling: an offspring is the midpoint of its parents
        // plus a fresh half-variance draw, which is what keeps variation alive.
        a.push((m.a[ti] + f.a[ti]) / 2 + ctx.rng.normal(0, Math.sqrt(va / 2)));
        // Environment is redrawn every generation and inherited by nobody.
        e.push(ctx.rng.normal(0, Math.sqrt(ve)));
      }
      next.push({ a, e, x: ctx.rng.next(), y: ctx.rng.next() });
    }

    const newMean = mean(next.map((p) => phenotype(p, caseDef, t)));
    const R = newMean - popMean;

    const drop = state.hist.length >= HISTORY_MAX ? 1 : 0;
    const hist = state.hist.slice(drop).concat(newMean);

    return {
      pop: next,
      generation: state.generation + 1,
      genClock,
      startMean: state.startMean,
      hist,
      lastS: S,
      lastR: R,
      cumS: state.cumS + S,
      cumR: state.cumR + R,
      flash: 1,
    };
  },

  readouts(state, params) {
    const caseDef = CASES[params.case as string] ?? CASES.maize;
    const t = traitIndex(params.selectFor as string);
    const tr = caseDef.traits[t];
    const values = state.pop.map((p) => phenotype(p, caseDef, t));
    const m = mean(values);
    const other = (t + 1) % 3;
    return [
      {
        // Trait units differ between cases (cm, kg, grams), so the value is
        // carried dimensionless and the unit is named in the label.
        key: "meanTrait", label: `Mean ${tr.name.toLowerCase()}${tr.unit ? ` (${tr.unit})` : ""}`,
        quantity: q(m, "count"), semantic: "distance", graphable: true,
      },
      {
        key: "generation", label: "Generation", quantity: q(state.generation, "count"),
        semantic: "time", graphable: false,
      },
      {
        key: "changeSoFar", label: "Change since the wild form",
        quantity: q(m - state.startMean[t], "count"),
        semantic: "velocity", graphable: true,
      },
      {
        key: "cutoff", label: `Breeding cutoff${tr.unit ? ` (${tr.unit})` : ""}`,
        quantity: q(selectionCut(state, params).cutoff, "count"),
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "selectionDifferential", label: "How much better the parents were",
        quantity: q(state.lastS, "count"), semantic: "force", graphable: true,
        bands: ["6-8", "9-12"],
      },
      {
        key: "response", label: "How much the offspring moved",
        quantity: q(state.lastR, "count"), semantic: "acceleration", graphable: true,
        bands: ["6-8", "9-12"],
      },
      {
        key: "unselectedDrift", label: `Mean ${caseDef.traits[other].name.toLowerCase()}`,
        quantity: q(mean(state.pop.map((p) => phenotype(p, caseDef, other))), "count"),
        semantic: "mass", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const caseDef = CASES[params.case as string] ?? CASES.maize;
    const t = traitIndex(params.selectFor as string);
    const tr = caseDef.traits[t];
    const h2 = params.heritability as number;
    const values = state.pop.map((p) => phenotype(p, caseDef, t));
    const m = mean(values);
    const other = (t + 1) % 3;
    const otherMean = mean(state.pop.map((p) => phenotype(p, caseDef, other)));
    const cut = selectionCut(state, params);
    return {
      case: caseDef.key,
      traitName: tr.name,
      generation: state.generation,
      meanTrait: m,
      startMean: state.startMean[t],
      change: m - state.startMean[t],
      unselectedChange: otherMean - state.startMean[other],
      breedingCutoff: cut.cutoff,
      nextSelectionDifferential: cut.nextS,
      selectionDifferential: state.lastS,
      response: state.lastR,
      predictedResponse: h2 * state.lastS,
      cumulativeS: state.cumS,
      cumulativeR: state.cumR,
      // What the breeder's equation says the next generation's mean will be.
      predictedNextMean: m + h2 * state.lastS,
      realisedHeritability: Math.abs(state.cumS) > 1e-6 ? state.cumR / state.cumS : 0,
      target: tr.target,
      targetName: tr.targetName,
      fractionOfTarget: (m - state.startMean[t]) / Math.max(1e-9, tr.target - state.startMean[t]),
      reachedTarget: m >= tr.target,
      populationSize: state.pop.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function drawCob(
  ctx: CanvasRenderingContext2D, x: number, y: number, len: number, kernels: number, color: string,
) {
  const w = Math.max(3, len * 0.28);
  ctx.save();
  const g = ctx.createLinearGradient(x - w, y, x + w, y);
  g.addColorStop(0, mixHex(color, "#000000", 0.25));
  g.addColorStop(0.4, mixHex(color, "#ffffff", 0.3));
  g.addColorStop(1, mixHex(color, "#000000", 0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, w, len / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Kernel rows, so "more kernels" is something you can see and count.
  ctx.fillStyle = hexA(mixHex(color, "#000000", 0.45), 0.55);
  const rows = Math.max(2, Math.min(9, Math.round(Math.sqrt(kernels))));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 3; c++) {
      const ky = y - len / 2 + ((r + 0.5) / rows) * len;
      const kx = x - w * 0.55 + (c / 2) * w * 1.1;
      ctx.beginPath();
      ctx.arc(kx, ky, Math.max(0.6, w * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawDog(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const body = Math.max(4, size);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y - body * 0.5, body * 0.85, body * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  sphere(ctx, x - body * 0.85, y - body * 0.8, body * 0.35, color);
  ctx.strokeStyle = mixHex(color, "#000000", 0.3);
  ctx.lineWidth = Math.max(1, body * 0.14);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const s of [-0.5, 0.5]) {
    ctx.moveTo(x + s * body * 0.55, y - body * 0.3);
    ctx.lineTo(x + s * body * 0.55, y);
  }
  ctx.moveTo(x + body * 0.8, y - body * 0.6);
  ctx.lineTo(x + body * 1.3, y - body * 1.0);
  ctx.stroke();
  ctx.restore();
}

function drawMustard(
  ctx: CanvasRenderingContext2D, x: number, y: number, h: number,
  leaf: number, bud: number, stem: number, green: string, budColor: string,
) {
  ctx.save();
  ctx.strokeStyle = mixHex(green, "#000000", 0.25);
  ctx.lineWidth = Math.max(1.4, stem);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.stroke();
  ctx.fillStyle = hexA(green, 0.9);
  for (let i = 0; i < 3; i++) {
    const ly = y - h * (0.2 + i * 0.24);
    const side = i % 2 === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.ellipse(x + side * leaf * 0.5, ly, leaf * 0.6, leaf * 0.26, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (bud > 0.5) {
    sphere(ctx, x, y - h - bud * 0.4, bud * 0.6, budColor);
  }
  ctx.restore();
}

function drawHistogram(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  values: number[], threshold: number, bigger: boolean, targetValue: number,
) {
  const { ctx, theme } = rc;
  if (!values.length) return;
  const lo = Math.min(...values, targetValue * 0.05);
  const hi = Math.max(...values, threshold, targetValue * 0.35);
  const span = Math.max(1e-6, hi - lo);
  const bins = 22;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const b = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / span) * bins)));
    counts[b]++;
  }
  const maxCount = Math.max(1, ...counts);

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.5 : 0.7);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const bw = w / bins;
  for (let b = 0; b < bins; b++) {
    const v = lo + ((b + 0.5) / bins) * span;
    const chosen = bigger ? v >= threshold : v <= threshold;
    const bh = (counts[b] / maxCount) * (h - 8);
    ctx.save();
    ctx.fillStyle = chosen ? theme.accent : hexA(theme.inkSoft, 0.55);
    ctx.fillRect(x + b * bw + 0.5, y + h - 4 - bh, bw - 1, bh);
    ctx.restore();
  }

  const tx = x + ((threshold - lo) / span) * w;
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(tx, y + 2);
  ctx.lineTo(tx, y + h - 2);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + 5, y + 9, "who gets to breed →", theme, { size: 9, color: theme.accent });
}

function drawProgress(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  hist: number[], start: number, target: number, targetName: string,
) {
  const { ctx, theme } = rc;
  const hi = Math.max(target * 1.05, ...hist, start * 1.1);
  const lo = Math.min(start * 0.9, ...hist);
  const span = Math.max(1e-6, hi - lo);

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.5 : 0.7);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const ty = y + h - ((target - lo) / span) * h;
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["light"], 0.95);
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, ty);
  ctx.lineTo(x + w, ty);
  ctx.stroke();
  ctx.restore();
  caption(ctx, x + w - 4, ty - 7, targetName, theme, {
    align: "right", size: 9, color: theme.sci["light"],
  });

  if (hist.length > 1) {
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < hist.length; i++) {
      const px = x + (i / (hist.length - 1)) * w;
      const py = y + h - ((hist[i] - lo) / span) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const caseDef = CASES[params.case as string] ?? CASES.maize;
  const t = traitIndex(params.selectFor as string);
  const tr = caseDef.traits[t];
  const bigger = params.direction !== "smaller";
  const values = state.pop.map((p) => phenotype(p, caseDef, t));
  const m = values.length ? mean(values) : tr.start;

  const groundY = Math.round(height * 0.66);
  sky(ctx, width, height, theme, caseDef.shape === "dog" ? "dusk" : "day", groundY);
  groundPlane(ctx, groundY, 0, width, height, theme, caseDef.shape === "dog" ? "rock" : "soil");

  /* --- the population, drawn as what it is --------------------------- */
  const sorted = values
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (bigger ? b.v - a.v : a.v - b.v));
  const nKeep = Math.max(2, Math.round(state.pop.length * (params.keep as number)));
  const threshold = sorted.length ? sorted[Math.min(nKeep, sorted.length) - 1].v : tr.start;
  const chosen = new Set(sorted.slice(0, nKeep).map((s) => s.i));

  const cols = Math.max(6, Math.floor(width / 34));
  const shown = Math.min(state.pop.length, cols * 2);
  const scale = Math.min(width / (cols + 1), 40);
  for (let k = 0; k < shown; k++) {
    const ind = state.pop[k];
    const v = values[k];
    const col = k % cols;
    const row = Math.floor(k / cols);
    const px = scale * (col + 0.7) + (ind.x - 0.5) * 4;
    const py = groundY - row * (height * 0.14) - 6;
    const picked = chosen.has(k);
    const norm = Math.max(0.12, Math.min(2.4, v / Math.max(tr.start, 1e-6)));

    contactShadow(ctx, px, py, 6 * norm, 0);
    if (picked) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.accent, 0.85);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py + 2, 12 * Math.min(1.5, norm), 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const color = picked ? theme.sci["producer"] : theme.sci["decomposer"];
    if (caseDef.shape === "cob") {
      drawCob(ctx, px, py - 14 * norm, 26 * norm, phenotype(ind, caseDef, 1), color);
    } else if (caseDef.shape === "dog") {
      drawDog(ctx, px, py, 13 * Math.cbrt(norm), color);
    } else {
      drawMustard(
        ctx, px, py, 26 * Math.min(1.6, norm),
        phenotype(ind, caseDef, 0) * 0.55, phenotype(ind, caseDef, 1) * 0.5,
        phenotype(ind, caseDef, 2), color, theme.sci["primary-consumer"],
      );
    }
  }

  /* --- who you are and what you are doing ---------------------------- */
  caption(ctx, 12, 16, `${caseDef.wild} → ${caseDef.bred}`, theme, {
    size: 13, color: theme.ink, weight: 800,
  });
  caption(ctx, 12, 31, `breeding for ${bigger ? "larger" : "smaller"} ${tr.name.toLowerCase()}`, theme, {
    size: 11, color: theme.accent,
  });

  material(ctx, width - 132, 8, 124, band === "3-5" ? 26 : 40, theme.surfaceAlt, 6);
  caption(ctx, width - 70, 21, `${m.toFixed(1)}${tr.unit ? " " + tr.unit : ""}`, theme, {
    align: "center", size: 15, color: theme.ink, weight: 800,
  });
  if (band !== "3-5") {
    caption(ctx, width - 70, 38, `generation ${state.generation}`, theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }

  if (state.flash > 0) {
    caption(ctx, width / 2, groundY - 4, "bred", theme, {
      align: "center", size: 11, color: hexA(theme.accent, state.flash),
    });
  }

  /* --- the two graphs ------------------------------------------------ */
  const panelY = groundY + 10;
  const panelH = height - panelY - 22;
  if (panelH > 34) {
    const half = (width - 30) / 2;
    if (overlays.histogram !== false) {
      drawHistogram(rc, 12, panelY, half, panelH, values, threshold, bigger, tr.target);
      caption(ctx, 12, height - 8, `${tr.name} spread in this generation`, theme, {
        size: 9, color: theme.inkSoft,
      });
    }
    if (overlays.progress !== false) {
      drawProgress(rc, 18 + half, panelY, half, panelH, state.hist, state.startMean[t], tr.target, tr.targetName);
      caption(
        ctx, 18 + half, height - 8,
        band === "3-5"
          ? "mean, generation by generation"
          : `mean per generation · real change took about ${caseDef.years.toLocaleString()} years`,
        theme, { size: 9, color: theme.inkSoft },
      );
    }
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const artificialSelectionSim: SimManifest<State> = {
  id: "bio.artificial-selection",
  title: "Artificial Selection",
  tagline: "Choose which plants or animals get to breed, and watch the whole population follow you.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-LS4-5", "MS-LS4-6", "MS-LS3-2", "HS-LS4-4"] },
  learningGoals: [
    "Explain that a breeder changes a population by choosing parents, not by changing individuals.",
    "Predict next generation's mean using the response to selection.",
    "Explain why selection does nothing when a difference is not inherited.",
    "Connect selective breeding to natural selection: same mechanism, different selector.",
  ],
  misconceptions: [
    "Breeders create new traits rather than concentrating existing ones",
    "An individual changes during its life to suit the breeder",
    "Selection works on any difference, inherited or not",
    "Artificial selection is a different process from natural selection",
  ],
  interactionHint: "The circled individuals are the ones you are breeding. Press play.",
  tickRate: 60,
  params: {
    case: {
      type: "option", label: "What are you breeding",
      options: [
        { value: "maize", label: "Teosinte → maize" },
        { value: "dog", label: "Wolf → dog" },
        { value: "mustard", label: "Wild mustard → vegetables" },
      ],
      default: "maize",
      help: "Three real domestications, with their real starting and finishing sizes.",
    },
    selectFor: {
      type: "option", label: "Select for",
      options: [
        { value: "t0", label: "Ear length · body mass · leaves" },
        { value: "t1", label: "Kernel count · coat · flower buds" },
        { value: "t2", label: "Kernel softness · legs · stem" },
      ],
      default: "t0",
      help: "Only the trait you pick responds. Watch what the others do.",
    },
    direction: {
      type: "option", label: "Breed for",
      options: [
        { value: "bigger", label: "More / larger" },
        { value: "smaller", label: "Less / smaller" },
      ],
      default: "bigger",
    },
    keep: {
      type: "number", label: "Fraction allowed to breed", kind: "percent", unit: "%",
      min: 0.05, max: 1, step: 0.05, default: 0.2,
      help: "Breed only the very best and the population moves fastest — until variation runs out.",
    },
    heritability: {
      type: "number", label: "How much is inherited", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.5,
      marks: [{ value: 0, label: "none" }, { value: 0.5, label: "half" }, { value: 1, label: "all" }],
      help: "Set this to zero and no amount of selecting will move the population.",
    },
    popSize: {
      type: "number", label: "Population size", kind: "population",
      min: 20, max: 200, step: 10, default: 60,
      bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "histogram", label: "Trait spread", default: true },
    { key: "progress", label: "Progress towards the real variety", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "make-maize",
      title: "Turn teosinte into maize",
      question: "A wild grass has ears 2.5 cm long. How do you get to a modern corn cob?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS4-5"],
      setup: {
        case: "maize", selectFor: "t0", direction: "bigger",
        keep: 0.2, heritability: 0.5, popSize: 60,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You will breed only the longest-eared fifth of each generation.",
          predict: {
            prompt: "What happens to the ears of plants you did NOT breed from?",
            options: [
              "They grow longer too, to keep up",
              "Nothing — they simply leave no offspring",
              "They shrink",
            ],
            correct: 1,
            reveal:
              "Nothing happens to them. No individual plant changes at all. The population changes because only some plants become parents.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Breed twenty generations",
          instruction: "Play until generation 20 and record the mean ear length as you go.",
          requireData: 4,
          check: {
            describe: "Reached generation 20",
            test: (v) => (v.facts.generation as number) >= 20,
          },
          hints: ["The histogram shows which plants are inside the breeding cut."],
        },
        {
          id: "others",
          phase: "analyze",
          title: "Check a trait you never selected",
          instruction: "Look at the trait you did not choose. Has it moved?",
          write: {
            prompt: "What happened to the trait you never selected for, and why?",
            placeholder: "It stayed about the same because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the mechanism",
          instruction: "Say what actually changed between generation 1 and generation 20.",
          write: {
            prompt: "Nothing grew longer during its life. So why is the population different?",
            placeholder: "Each generation, the parents were ...",
          },
        },
      ],
    },
    {
      id: "heritability",
      title: "When does selection stop working?",
      question: "You breed the very best every time and nothing happens. What went wrong?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS3-2", "MS-LS4-5"],
      setup: {
        case: "mustard", selectFor: "t0", direction: "bigger",
        keep: 0.1, heritability: 0.5, popSize: 60,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Some of the difference between plants is genes; some is just soil and water.",
          predict: {
            prompt: "If none of the difference between plants is inherited, what happens when you breed the biggest?",
            options: [
              "The population still grows, just slower",
              "Nothing at all — the mean stays put",
              "The population shrinks",
            ],
            correct: 1,
            reveal:
              "Nothing. Selecting a plant that is large only because it got the best patch of soil passes nothing on to its offspring.",
          },
        },
        {
          id: "half",
          phase: "measure",
          title: "Run with half inherited",
          instruction: "Leave heritability at 0.5 and breed for 15 generations. Record the change.",
          requireData: 3,
          check: {
            describe: "15 generations with heritability 0.5",
            test: (v) => (v.facts.generation as number) >= 15 && (v.params.heritability as number) > 0.3,
          },
        },
        {
          id: "zero",
          phase: "measure",
          title: "Now set heritability to zero",
          instruction: "Set it to 0 and breed the biggest tenth for another 15 generations.",
          check: {
            describe: "Heritability is zero",
            test: (v) => (v.params.heritability as number) === 0,
          },
          requireData: 5,
          hints: ["Watch the mean line. Does the choice you are making change anything?"],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the requirement",
          instruction: "Write what a difference must be before selection can act on it.",
          write: {
            prompt: "What has to be true of a difference before breeding for it can change a population?",
            placeholder: "Selection can only work if the difference ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "reach-broccoli",
      title: "Grow broccoli",
      brief: "Breed wild mustard for its flower buds until you reach a broccoli head.",
      bands: ["6-8", "9-12"],
      setup: {
        case: "mustard", selectFor: "t1", direction: "bigger",
        keep: 0.2, heritability: 0.5, popSize: 60,
      },
      goal: {
        describe: "Flower bud cluster three times the wild size",
        test: (v) => (v.facts.change as number) >= 10,
      },
      stars: {
        two: {
          describe: "Get there in 25 generations or fewer",
          test: (v) => (v.facts.change as number) >= 10 && (v.facts.generation as number) <= 25,
        },
        three: {
          describe: "In 15 generations or fewer",
          test: (v) => (v.facts.change as number) >= 10 && (v.facts.generation as number) <= 15,
        },
      },
      hints: [
        "A tighter breeding fraction moves the population faster each generation.",
        "Broccoli, kale, cabbage and kohlrabi are all the same species, bred for different parts.",
      ],
    },
    {
      id: "tiny-dog",
      title: "Breed a small dog",
      brief: "Start from a 35 kg wolf and breed the population down below 20 kg.",
      bands: ["3-5", "6-8", "9-12"],
      setup: {
        case: "dog", selectFor: "t0", direction: "smaller",
        keep: 0.2, heritability: 0.5, popSize: 60,
      },
      goal: {
        describe: "Mean body mass under 20 kg",
        test: (v) => (v.facts.meanTrait as number) <= 20,
      },
      stars: {
        two: {
          describe: "Under 20 kg within 20 generations",
          test: (v) => (v.facts.meanTrait as number) <= 20 && (v.facts.generation as number) <= 20,
        },
        three: {
          describe: "Under 12 kg within 30 generations",
          test: (v) => (v.facts.meanTrait as number) <= 12 && (v.facts.generation as number) <= 30,
        },
      },
      hints: [
        "Every dog alive is descended from grey wolves.",
        "Breeding for smaller works exactly like breeding for larger, in the other direction.",
      ],
    },
  ],
};
