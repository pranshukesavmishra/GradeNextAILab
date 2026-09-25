import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, contactShadow, groundPlane, hexA, isDarkTheme, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Heredity & Variation — Grades 4-10.
 *
 * Mendel's monohybrid cross, run as an actual experiment rather than drawn as
 * a diagram. Two parent pea plants are crossed; every offspring receives one
 * allele from each parent, chosen at random; and the Punnett square on screen
 * fills in *from those offspring* — each new plant lands in the cell it came
 * from. The 3:1 phenotype ratio and the 1:2:1 genotype ratio are therefore
 * results the student watches converge, not rules they are told.
 *
 * Beside the cross, the same mother is also reproducing asexually. Her clones
 * are genetically identical to her and to each other, generation after
 * generation, which is the whole of E5.2/E5.4 in one side-by-side view.
 *
 * The traits and the F2 counts are Mendel's own, from the 1866 paper
 * "Versuche über Pflanzen-Hybriden": 705:224 purple to white flowers,
 * 6022:2001 yellow to green seeds, 787:277 tall to dwarf plants.
 */

/* ------------------------------------------------------------------ *
 * Genetics
 * ------------------------------------------------------------------ */

/** One copy of the gene. 1 is the dominant allele, 0 the recessive one. */
export type Allele = 0 | 1;

/** A diploid genotype: the allele from the mother and the one from the father. */
export interface Genotype {
  m: Allele;
  f: Allele;
}

export interface TraitDef {
  key: string;
  /** What the gene controls, in student language. */
  name: string;
  /** The single letter Mendel's notation uses for this gene. */
  symbol: string;
  dominant: string;
  recessive: string;
  /** Mendel's own F2 counts for this trait, from the 1866 paper. */
  mendelDominant: number;
  mendelRecessive: number;
}

export const TRAITS: Record<string, TraitDef> = {
  flower: {
    key: "flower", name: "Flower colour", symbol: "P",
    dominant: "purple", recessive: "white",
    mendelDominant: 705, mendelRecessive: 224,
  },
  seed: {
    key: "seed", name: "Seed colour", symbol: "Y",
    dominant: "yellow", recessive: "green",
    mendelDominant: 6022, mendelRecessive: 2001,
  },
  height: {
    key: "height", name: "Plant height", symbol: "T",
    dominant: "tall", recessive: "dwarf",
    mendelDominant: 787, mendelRecessive: 277,
  },
};

/** "PP" | "Pp" | "pp" as the student picks it, decoded into two alleles. */
export function parseGenotype(code: string): [Allele, Allele] {
  if (code === "AA") return [1, 1];
  if (code === "aa") return [0, 0];
  return [1, 0]; // "Aa" — heterozygous
}

/** Genotype class: 0 = homozygous recessive, 1 = heterozygous, 2 = homozygous dominant. */
export function genotypeClass(g: Genotype): 0 | 1 | 2 {
  return (g.m + g.f) as 0 | 1 | 2;
}

/** Dominance: one dominant allele is enough to show the dominant phenotype. */
export function showsDominant(g: Genotype): boolean {
  return g.m === 1 || g.f === 1;
}

export function genotypeText(g: Genotype, trait: TraitDef): string {
  const up = trait.symbol.toUpperCase();
  const low = trait.symbol.toLowerCase();
  // Convention: the dominant allele is always written first.
  if (g.m === 1 && g.f === 1) return up + up;
  if (g.m === 0 && g.f === 0) return low + low;
  return up + low;
}

export interface PunnettResult {
  /** The four cells, in reading order: mother slot 0/1 × father slot 0/1. */
  cells: Genotype[];
  /** Expected counts out of 4 for [homozygous recessive, heterozygous, homozygous dominant]. */
  genotypeRatio: [number, number, number];
  /** Expected [dominant, recessive] phenotypes out of 4. */
  phenotypeRatio: [number, number];
}

/**
 * The Punnett square for a cross, worked out exactly.
 *
 * This is the theory the simulation's random offspring converge on, and the
 * sim never uses it to *generate* an offspring — it is only the prediction.
 */
export function punnett(mother: [Allele, Allele], father: [Allele, Allele]): PunnettResult {
  const cells: Genotype[] = [];
  for (let mi = 0; mi < 2; mi++) {
    for (let fi = 0; fi < 2; fi++) {
      cells.push({ m: mother[mi], f: father[fi] });
    }
  }
  const genotypeRatio: [number, number, number] = [0, 0, 0];
  let dominant = 0;
  for (const c of cells) {
    genotypeRatio[genotypeClass(c)] += 1;
    if (showsDominant(c)) dominant += 1;
  }
  return { cells, genotypeRatio, phenotypeRatio: [dominant, 4 - dominant] };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Kid {
  /** Which of the mother's two alleles this offspring received (slot 0 or 1). */
  ms: 0 | 1;
  /** Which of the father's two alleles it received. */
  fs: 0 | 1;
  g: Genotype;
  /** 0..1 growth animation. */
  age: number;
  wobble: number;
  /** True while this offspring belongs to the newest litter of siblings. */
  fresh: boolean;
}

interface State {
  mother: [Allele, Allele];
  father: [Allele, Allele];
  /** Rolling window of offspring on the bed; the tallies below are cumulative. */
  sexual: Kid[];
  asexual: Kid[];
  /** Cumulative tallies per Punnett cell, in the same reading order. */
  cells: number[];
  /** Cumulative genotype counts: [homozygous recessive, heterozygous, homozygous dominant]. */
  geno: [number, number, number];
  cloneGeno: [number, number, number];
  totalSexual: number;
  totalAsexual: number;
  spawnClock: number;
  litters: number;
  /** Running record of (offspring so far, fraction showing the dominant trait). */
  histN: number[];
  histFrac: number[];
}

const MAX_SHOWN = 48;
/** Siblings born together, so sibling-to-sibling variation is visible at once. */
const LITTER = 8;
const HISTORY_MAX = 150;
const GROW_SECONDS = 0.55;

function emptyState(params: ParamValues): State {
  return {
    mother: parseGenotype(params.mother as string),
    father: parseGenotype(params.father as string),
    sexual: [],
    asexual: [],
    cells: [0, 0, 0, 0],
    geno: [0, 0, 0],
    cloneGeno: [0, 0, 0],
    totalSexual: 0,
    totalAsexual: 0,
    spawnClock: 0,
    litters: 0,
    histN: [],
    histFrac: [],
  };
}

function dominantFraction(geno: [number, number, number]): number {
  const total = geno[0] + geno[1] + geno[2];
  return total > 0 ? (geno[1] + geno[2]) / total : 0;
}

/** How many different genotypes have actually appeared in a tally. */
function distinctGenotypes(geno: [number, number, number]): number {
  return geno.reduce((n, c) => n + (c > 0 ? 1 : 0), 0);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return emptyState(params);
  },

  applyParams(state, params, prev) {
    // A new cross is a new experiment: the tallies must not carry over.
    if (
      params.mother !== prev.mother || params.father !== prev.father ||
      params.trait !== prev.trait || params.mode !== prev.mode
    ) {
      return emptyState(params);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const mode = params.mode as string;
    const rate = params.litterRate as number;
    const interval = LITTER / Math.max(rate, 0.5);

    let spawnClock = state.spawnClock + dt;
    let sexual = state.sexual;
    let asexual = state.asexual;
    let cells = state.cells;
    let geno = state.geno;
    let cloneGeno = state.cloneGeno;
    let totalSexual = state.totalSexual;
    let totalAsexual = state.totalAsexual;
    let litters = state.litters;
    let histN = state.histN;
    let histFrac = state.histFrac;

    // Age everyone already on the bed.
    const grow = dt / GROW_SECONDS;
    if (sexual.length) sexual = sexual.map((k) => (k.age >= 1 ? k : { ...k, age: Math.min(1, k.age + grow) }));
    if (asexual.length) asexual = asexual.map((k) => (k.age >= 1 ? k : { ...k, age: Math.min(1, k.age + grow) }));

    let bornThisTick = false;
    // Cap catch-up so a fast-forward frame cannot spawn thousands at once.
    let budget = 6;
    while (spawnClock >= interval && budget-- > 0) {
      spawnClock -= interval;
      litters += 1;
      bornThisTick = true;

      if (mode !== "asexual") {
        const nextCells = cells.slice();
        const nextGeno: [number, number, number] = [geno[0], geno[1], geno[2]];
        const born: Kid[] = [];
        for (let i = 0; i < LITTER; i++) {
          // Meiosis: each parent passes one of its two copies, at random.
          const ms = (ctx.rng.next() < 0.5 ? 0 : 1) as 0 | 1;
          const fs = (ctx.rng.next() < 0.5 ? 0 : 1) as 0 | 1;
          const g: Genotype = { m: state.mother[ms], f: state.father[fs] };
          nextCells[ms * 2 + fs] += 1;
          nextGeno[genotypeClass(g)] += 1;
          born.push({ ms, fs, g, age: 0, wobble: ctx.rng.range(-1, 1), fresh: true });
        }
        cells = nextCells;
        geno = nextGeno;
        totalSexual += LITTER;
        const stale = sexual.map((k) => (k.fresh ? { ...k, fresh: false } : k));
        sexual = [...stale, ...born].slice(-MAX_SHOWN);
      }

      if (mode !== "sexual") {
        // Asexual reproduction copies the mother's genome whole: no meiosis,
        // no second parent, no reshuffling. Every clone is her genotype.
        const g: Genotype = { m: state.mother[0], f: state.mother[1] };
        const nextClone: [number, number, number] = [cloneGeno[0], cloneGeno[1], cloneGeno[2]];
        const born: Kid[] = [];
        for (let i = 0; i < LITTER; i++) {
          nextClone[genotypeClass(g)] += 1;
          born.push({ ms: 0, fs: 1, g, age: 0, wobble: ctx.rng.range(-1, 1), fresh: true });
        }
        cloneGeno = nextClone;
        totalAsexual += LITTER;
        const stale = asexual.map((k) => (k.fresh ? { ...k, fresh: false } : k));
        asexual = [...stale, ...born].slice(-MAX_SHOWN);
      }
    }
    if (budget <= 0) spawnClock = 0;

    if (bornThisTick && totalSexual > 0) {
      const drop = histN.length >= HISTORY_MAX ? 1 : 0;
      histN = histN.slice(drop);
      histFrac = histFrac.slice(drop);
      histN.push(totalSexual);
      histFrac.push(dominantFraction(geno));
    }

    return {
      ...state,
      sexual, asexual, cells, geno, cloneGeno,
      totalSexual, totalAsexual, spawnClock, litters, histN, histFrac,
    };
  },

  readouts(state) {
    const total = Math.max(state.totalSexual, 1);
    const dom = dominantFraction(state.geno);
    const cloneTotal = Math.max(state.totalAsexual, 1);
    return [
      {
        key: "offspring", label: "Offspring", quantity: q(state.totalSexual, "count"),
        semantic: "producer", graphable: true,
      },
      {
        key: "dominantPercent", label: "Showing dominant trait", quantity: q(dom, "percent"),
        unit: "%", semantic: "field", graphable: true,
      },
      {
        key: "recessivePercent", label: "Showing recessive trait",
        quantity: q(state.totalSexual > 0 ? 1 - dom : 0, "percent"),
        unit: "%", semantic: "mass", graphable: true,
      },
      {
        key: "homDomPercent", label: "Two dominant alleles",
        quantity: q(state.geno[2] / total, "percent"), unit: "%",
        semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "hetPercent", label: "One of each",
        quantity: q(state.geno[1] / total, "percent"), unit: "%",
        semantic: "primary-consumer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "homRecPercent", label: "Two recessive alleles",
        quantity: q(state.geno[0] / total, "percent"), unit: "%",
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "clonesIdentical", label: "Clones alike",
        quantity: q(state.totalAsexual > 0 ? state.cloneGeno[genotypeClass({ m: state.mother[0], f: state.mother[1] })] / cloneTotal : 0, "percent"),
        unit: "%", semantic: "producer", graphable: false, bands: ["3-5", "6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const trait = TRAITS[params.trait as string] ?? TRAITS.flower;
    const total = state.totalSexual;
    const expected = punnett(state.mother, state.father);
    const dom = dominantFraction(state.geno);
    return {
      trait: trait.key,
      offspring: total,
      clones: state.totalAsexual,
      litters: state.litters,
      dominantFraction: dom,
      recessiveFraction: total > 0 ? 1 - dom : 0,
      homDomFraction: total > 0 ? state.geno[2] / total : 0,
      hetFraction: total > 0 ? state.geno[1] / total : 0,
      homRecFraction: total > 0 ? state.geno[0] / total : 0,
      // What the Punnett square predicts, independent of what was rolled.
      expectedDominantFraction: expected.phenotypeRatio[0] / 4,
      expectedHetFraction: expected.genotypeRatio[1] / 4,
      sexualDistinctGenotypes: distinctGenotypes(state.geno),
      asexualDistinctGenotypes: distinctGenotypes(state.cloneGeno),
      asexualIdentical: distinctGenotypes(state.cloneGeno) <= 1,
      cell0: state.cells[0], cell1: state.cells[1],
      cell2: state.cells[2], cell3: state.cells[3],
      motherGenotype: genotypeText({ m: state.mother[0], f: state.mother[1] }, trait),
      fatherGenotype: genotypeText({ m: state.father[0], f: state.father[1] }, trait),
      mendelRatio: trait.mendelDominant / trait.mendelRecessive,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * Colour carries the phenotype and nothing else: one hue for the dominant
 * form of the trait, one for the recessive form, held fixed everywhere on the
 * stage so a plant, a Punnett cell and a ratio bar all agree.
 */
function phenotypeColors(trait: TraitDef, theme: RenderContext<State>["theme"]): [string, string] {
  if (trait.key === "seed") return [theme.sci["light"], theme.sci["producer"]];
  if (trait.key === "height") return [theme.sci["producer"], theme.sci["primary-consumer"]];
  return [theme.sci["field"], theme.sci["mass"]];
}

function drawPlant(
  rc: RenderContext<State>, x: number, baseY: number, scale: number,
  g: Genotype, trait: TraitDef, colors: [string, string], opts: { fresh?: boolean; wobble?: number } = {},
) {
  const { ctx, theme, time } = rc;
  const dom = showsDominant(g);
  const color = dom ? colors[0] : colors[1];
  // Height is itself a phenotype for Mendel's stem-length gene.
  const tall = trait.key !== "height" || dom;
  const stemH = (tall ? 34 : 17) * scale;
  const sway = Math.sin(time * 1.4 + (opts.wobble ?? 0) * 3) * 1.6 * scale;
  const headX = x + sway;
  const headY = baseY - stemH;

  contactShadow(ctx, x, baseY, 5 * scale, 0);

  ctx.save();
  ctx.strokeStyle = theme.sci["producer"];
  ctx.lineWidth = Math.max(1.2, 2.2 * scale);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + sway * 0.5, baseY - stemH * 0.55, headX, headY);
  ctx.stroke();
  // Two leaves, so a seedling reads as a plant rather than a pin.
  ctx.fillStyle = hexA(theme.sci["producer"], 0.85);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      x + side * 5 * scale, baseY - stemH * 0.45, 5.5 * scale, 2.6 * scale,
      side * 0.5, 0, Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  const r = 5.5 * scale;
  sphere(ctx, headX, headY, r, color, { glow: opts.fresh ? 0.5 : 0 });
  if (opts.fresh) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(headX, headY, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParent(
  rc: RenderContext<State>, x: number, baseY: number,
  alleles: [Allele, Allele], trait: TraitDef, colors: [string, string], tag: string,
) {
  const { ctx, theme, band } = rc;
  const g: Genotype = { m: alleles[0], f: alleles[1] };
  drawPlant(rc, x, baseY, 1.7, g, trait, colors);
  const tall = trait.key !== "height" || showsDominant(g);
  const headY = baseY - (tall ? 34 : 17) * 1.7;
  if (band !== "K-2") {
    badge(ctx, x, headY - 22, genotypeText(g, trait), theme, {
      align: "center", color: showsDominant(g) ? colors[0] : colors[1], sub: tag,
    });
  }
}

/** The 2×2 square, filling in from the offspring that actually landed in it. */
function drawPunnett(
  rc: RenderContext<State>, x: number, y: number, size: number,
  trait: TraitDef, colors: [string, string],
) {
  const { ctx, state, theme, band } = rc;
  const cell = size / 2;
  const up = trait.symbol.toUpperCase();
  const low = trait.symbol.toLowerCase();
  const letter = (a: Allele) => (a === 1 ? up : low);
  const total = Math.max(1, state.cells.reduce((s, c) => s + c, 0));

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.72 : 0.86);
  roundRect(ctx, x - 2, y - 2, size + 4, size + 4, 6);
  ctx.fill();
  ctx.restore();

  for (let mi = 0; mi < 2; mi++) {
    for (let fi = 0; fi < 2; fi++) {
      const idx = mi * 2 + fi;
      const cx = x + mi * cell;
      const cy = y + fi * cell;
      const g: Genotype = { m: state.mother[mi], f: state.father[fi] };
      const share = state.cells[idx] / total;
      const color = showsDominant(g) ? colors[0] : colors[1];

      // The cell fills from the bottom in proportion to how many offspring
      // actually came out of it — the square is a tally, not a decoration.
      ctx.save();
      ctx.fillStyle = hexA(color, 0.28);
      const fillH = cell * Math.min(1, share * 2.2);
      ctx.fillRect(cx + 1, cy + cell - fillH - 1, cell - 2, fillH);
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
      ctx.restore();

      caption(ctx, cx + cell / 2, cy + cell * 0.38, letter(g.m) + letter(g.f), theme, {
        align: "center", size: Math.min(15, cell * 0.42), color, weight: 800,
      });
      if (band !== "K-2" && band !== "3-5") {
        caption(ctx, cx + cell / 2, cy + cell * 0.72, String(state.cells[idx]), theme, {
          align: "center", size: Math.min(11, cell * 0.3), color: theme.inkSoft,
        });
      }
    }
  }

  // Headers: the mother's two gametes across the top, the father's down the side.
  for (let mi = 0; mi < 2; mi++) {
    caption(ctx, x + mi * cell + cell / 2, y - 10, letter(state.mother[mi]), theme, {
      align: "center", size: 12, color: theme.inkSoft, weight: 700,
    });
  }
  for (let fi = 0; fi < 2; fi++) {
    caption(ctx, x - 9, y + fi * cell + cell / 2, letter(state.father[fi]), theme, {
      align: "center", size: 12, color: theme.inkSoft, weight: 700,
    });
  }
}

/** Ratio bar with the theoretical target marked, so convergence is visible. */
function drawRatioBar(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  parts: { value: number; color: string }[], targets: number[],
) {
  const { ctx, theme } = rc;
  const total = parts.reduce((s, p) => s + p.value, 0);
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.18);
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.restore();

  if (total > 0) {
    let cx = x;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.clip();
    for (const p of parts) {
      const bw = (p.value / total) * w;
      ctx.fillStyle = p.color;
      ctx.fillRect(cx, y, Math.max(0, bw - 1), h);
      cx += bw;
    }
    ctx.restore();
  }

  // Where the theory says the boundaries should end up.
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  for (const t of targets) {
    ctx.beginPath();
    ctx.moveTo(x + t * w, y - 3);
    ctx.lineTo(x + t * w, y + h + 3);
    ctx.stroke();
  }
  ctx.restore();
}

/** Dominant-fraction against offspring count: the law of large numbers, live. */
function drawConvergence(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number, target: number, color: string,
) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.55 : 0.7);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const ty = y + h - target * h;
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.55);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, ty);
  ctx.lineTo(x + w, ty);
  ctx.stroke();
  ctx.restore();

  const n = state.histN.length;
  if (n >= 2) {
    const nMax = Math.max(state.histN[n - 1], 1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x + (state.histN[i] / nMax) * w;
      const py = y + h - state.histFrac[i] * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  caption(ctx, x + 4, y + 9, `${Math.round(target * 100)}%`, theme, {
    size: 10, color: theme.inkSoft,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const trait = TRAITS[params.trait as string] ?? TRAITS.flower;
  const colors = phenotypeColors(trait, theme);
  const mode = params.mode as string;
  const compare = mode === "compare";

  const groundY = Math.round(height * 0.9);
  sky(ctx, width, height, theme, "day", groundY);
  groundPlane(ctx, groundY, 0, width, height, theme, "soil");

  // Two beds when comparing, one wide bed otherwise.
  const gap = compare ? 10 : 0;
  const leftW = compare ? Math.round((width - gap) * 0.62) : width;
  const rightX = leftW + gap;
  const rightW = width - rightX;

  const showLeft = mode !== "asexual";
  const showRight = mode !== "sexual";
  const parentY = Math.round(height * 0.30);
  const bedTop = parentY + 16;
  const bedBottom = groundY - 6;

  /* ---- the sexual cross ------------------------------------------- */
  if (showLeft) {
    const panelW = compare ? leftW : width;
    caption(ctx, 10, 14, "Two parents · sexual", theme, { size: 12, color: theme.inkSoft });

    const mx = panelW * (band === "K-2" ? 0.22 : 0.17);
    const fx = panelW * (band === "K-2" ? 0.5 : 0.4);
    drawParent(rc, mx, parentY, state.mother, trait, colors, "mother");
    drawParent(rc, fx, parentY, state.father, trait, colors, "father");

    // The inheritance diagram: alleles flow down from each parent to the litter.
    const joinX = (mx + fx) / 2;
    const joinY = parentY + 10;
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(mx, parentY + 2);
    ctx.lineTo(joinX, joinY);
    ctx.moveTo(fx, parentY + 2);
    ctx.lineTo(joinX, joinY);
    ctx.moveTo(joinX, joinY);
    ctx.lineTo(joinX, bedTop);
    ctx.stroke();
    ctx.restore();

    if (overlays.punnett && band !== "K-2") {
      const size = Math.min(88, panelW * 0.3, height * 0.28);
      drawPunnett(rc, panelW - size - 14, 26, size, trait, colors);
      caption(ctx, panelW - size / 2 - 14, 18, "Punnett square", theme, {
        align: "center", size: 10, color: theme.inkSoft,
      });
    }

    // The offspring bed. Newest litter at the front, so siblings sit together.
    const cols = Math.max(4, Math.floor(panelW / 34));
    const rows = Math.max(2, Math.floor((bedBottom - bedTop) / 30));
    const shown = state.sexual.slice(-(cols * rows));
    const cellW = panelW / (cols + 1);
    const cellH = (bedBottom - bedTop) / rows;
    for (let i = 0; i < shown.length; i++) {
      const k = shown[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = cellW * (col + 1) + k.wobble * 3;
      const py = bedTop + cellH * (row + 0.9);
      const scale = (0.35 + 0.45 * Math.min(1, cellH / 30)) * (0.4 + 0.6 * k.age);
      drawPlant(rc, px, py, scale, k.g, trait, colors, { fresh: k.fresh, wobble: k.wobble });
      if (overlays.genotypes && band === "9-12" && cellW > 26) {
        caption(ctx, px, py + 7, genotypeText(k.g, trait), theme, {
          align: "center", size: 8, color: theme.inkSoft,
        });
      }
    }
  }

  /* ---- the asexual clones ----------------------------------------- */
  if (showRight) {
    const x0 = compare ? rightX : 0;
    const panelW = compare ? rightW : width;
    if (compare) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 - gap / 2, 6);
      ctx.lineTo(x0 - gap / 2, groundY);
      ctx.stroke();
      ctx.restore();
    }
    caption(ctx, x0 + 8, 14, "One parent · asexual", theme, { size: 12, color: theme.inkSoft });

    const cx = x0 + panelW * 0.5;
    drawParent(rc, cx, parentY, state.mother, trait, colors, "mother");

    const cols = Math.max(3, Math.floor(panelW / 30));
    const rows = Math.max(2, Math.floor((bedBottom - bedTop) / 30));
    const shown = state.asexual.slice(-(cols * rows));
    const cellW = panelW / (cols + 1);
    const cellH = (bedBottom - bedTop) / rows;
    for (let i = 0; i < shown.length; i++) {
      const k = shown[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = x0 + cellW * (col + 1) + k.wobble * 2;
      const py = bedTop + cellH * (row + 0.9);
      const scale = (0.35 + 0.45 * Math.min(1, cellH / 30)) * (0.4 + 0.6 * k.age);
      drawPlant(rc, px, py, scale, k.g, trait, colors, { fresh: k.fresh, wobble: k.wobble });
    }
    if (state.totalAsexual > 0 && band !== "K-2") {
      caption(ctx, x0 + panelW / 2, bedTop - 4, "every one identical", theme, {
        align: "center", size: 11, color: theme.inkSoft,
      });
    }
  }

  /* ---- ratio bars and convergence ---------------------------------- */
  if (overlays.ratios && band !== "K-2" && state.totalSexual > 0) {
    const barW = Math.min(width - 20, 300);
    const barX = 10;
    const barY = groundY + 6;
    const barH = Math.max(6, Math.min(10, height - groundY - 14));
    const dom = dominantFraction(state.geno);
    drawRatioBar(
      rc, barX, barY, barW, barH,
      [
        { value: dom, color: colors[0] },
        { value: 1 - dom, color: colors[1] },
      ],
      [0.75],
    );
    caption(
      ctx, barX + barW + 8, barY + barH / 2,
      `${Math.round(dom * 100)} : ${Math.round((1 - dom) * 100)}   (target 75:25)`,
      theme, { size: 10, color: theme.inkSoft },
    );
  }

  if (overlays.convergence && band !== "K-2" && band !== "3-5" && state.histN.length > 1) {
    const w = Math.min(120, width * 0.24);
    const h = Math.min(56, height * 0.18);
    drawConvergence(rc, width - w - 10, groundY - h - 8, w, h, 0.75, colors[0]);
    caption(ctx, width - w - 10, groundY - h - 14, "dominant share vs offspring", theme, {
      size: 9, color: theme.inkSoft,
    });
  }

  /* ---- Mendel's own counts as the external reference ---------------- */
  if (overlays.mendel && band !== "K-2" && band !== "3-5") {
    const ratio = trait.mendelDominant / trait.mendelRecessive;
    caption(
      ctx, 10, height - 6,
      `Mendel counted ${trait.mendelDominant}:${trait.mendelRecessive} = ${ratio.toFixed(2)}:1`,
      theme, { size: 10, color: theme.inkSoft },
    );
  }

  if (state.totalSexual > 0 && band !== "K-2") {
    material(ctx, width - 96, 6, 88, 18, theme.surfaceAlt, 5);
    caption(ctx, width - 52, 15, `${state.totalSexual} offspring`, theme, {
      align: "center", size: 11, color: theme.ink,
    });
  }

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = mixHex(theme.surface, theme.ink, 0.06);
  ctx.fillRect(0, groundY, width, 1);
  ctx.restore();

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const GENOTYPE_OPTIONS = [
  { value: "AA", label: "Two dominant (PP)" },
  { value: "Aa", label: "One of each (Pp)" },
  { value: "aa", label: "Two recessive (pp)" },
];

export const hereditySim: SimManifest<State> = {
  id: "bio.heredity",
  title: "Heredity & Variation",
  tagline: "Cross two pea plants, watch the offspring appear, and see the Punnett square fill itself in.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS3-1", "MS-LS3-2", "MS-LS1-4", "HS-LS3-3"] },
  learningGoals: [
    "Explain that offspring get one copy of each gene from each parent.",
    "Predict the offspring of a cross with a Punnett square, and check it against real counts.",
    "Explain why siblings differ but clones do not.",
  ],
  misconceptions: [
    "Offspring are a blend of their parents",
    "A recessive trait disappears if neither parent shows it",
    "Every child of the same parents inherits the same genes",
    "Asexual offspring are just very similar, not identical",
  ],
  interactionHint: "Press play. Each new plant lands in the Punnett cell it came from.",
  tickRate: 60,
  params: {
    trait: {
      type: "option", label: "Trait",
      options: [
        { value: "flower", label: "Flower colour (purple / white)" },
        { value: "seed", label: "Seed colour (yellow / green)" },
        { value: "height", label: "Plant height (tall / dwarf)" },
      ],
      default: "flower",
      help: "All three are genes Mendel actually bred peas for.",
    },
    mother: {
      type: "option", label: "Mother's genes", options: GENOTYPE_OPTIONS, default: "Aa",
      help: "She passes one of her two copies to each offspring.",
    },
    father: {
      type: "option", label: "Father's genes", options: GENOTYPE_OPTIONS, default: "Aa",
    },
    mode: {
      type: "option", label: "Show",
      options: [
        { value: "compare", label: "Both, side by side" },
        { value: "sexual", label: "Sexual only" },
        { value: "asexual", label: "Asexual only" },
      ],
      default: "compare",
      help: "Side by side is the comparison: one bed varies, the other cannot.",
    },
    litterRate: {
      type: "number", label: "Offspring per second", kind: "count",
      min: 2, max: 40, step: 2, default: 20,
      bands: ["6-8", "9-12"],
      help: "Faster means a bigger sample, and a ratio that settles down sooner.",
    },
  },
  overlays: [
    { key: "punnett", label: "Punnett square", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "ratios", label: "Ratio bar", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "convergence", label: "Convergence graph", default: true, bands: ["6-8", "9-12"] },
    { key: "mendel", label: "Mendel's own counts", default: true, bands: ["6-8", "9-12"] },
    { key: "genotypes", label: "Genotype labels", default: false, bands: ["9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "three-to-one",
      title: "Where does 3:1 come from?",
      question: "Two purple-flowered parents, each carrying a hidden white allele. What do their offspring look like?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS3-2"],
      setup: { trait: "flower", mother: "Aa", father: "Aa", mode: "sexual", litterRate: 20 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Both parents are purple and carry one white allele. Commit before running.",
          predict: {
            prompt: "Out of every 100 offspring, roughly how many will be white?",
            options: ["None", "About 25", "About 50", "All of them"],
            correct: 1,
            reveal:
              "About 25 in 100. A white plant needs a recessive allele from both parents, and each parent passes it half the time: one half times one half is one quarter.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Breed 400 offspring",
          instruction: "Run until at least 400 offspring have appeared. Record as you go.",
          requireData: 4,
          check: {
            describe: "At least 400 offspring",
            test: (v) => (v.facts.offspring as number) >= 400,
          },
          hints: [
            "The ratio bounces around at first. Small samples always do.",
            "Watch the convergence graph settle towards the dashed 75% line.",
          ],
        },
        {
          id: "genotypes",
          phase: "analyze",
          title: "Look underneath the colour",
          instruction: "Three purple plants in four look the same. Are their genes the same?",
          check: {
            describe: "Both parents carry one of each allele",
            test: (v) => v.params.mother === "Aa" && v.params.father === "Aa",
          },
          write: {
            prompt: "Of the purple offspring, what fraction carry a hidden white allele?",
            placeholder: "Out of the three purple plants in four, ...",
          },
          hints: ["The Punnett square has four cells. Count how many purple cells contain a small p."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the ratio",
          instruction: "Write the rule that produces 3:1 from parents who both look purple.",
          write: {
            prompt: "Why do two purple parents produce white offspring, and why one in four?",
            placeholder: "Each parent has two copies of the gene, and ...",
          },
        },
      ],
    },
    {
      id: "clones-vs-siblings",
      title: "Why are clones identical and siblings not?",
      question: "The same mother reproduces two ways at once. Which offspring vary?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS3-2"],
      setup: { trait: "flower", mother: "Aa", father: "Aa", mode: "compare", litterRate: 20 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One mother. Left bed: she breeds with a father. Right bed: she clones herself.",
          predict: {
            prompt: "After 200 offspring in each bed, what will you see?",
            options: [
              "Both beds will be mixed",
              "Left mixed, right all identical",
              "Left all identical, right mixed",
              "Both beds all identical",
            ],
            correct: 1,
            reveal:
              "Sexual offspring get a fresh combination of two parents' alleles every time, so they vary. A clone is a copy of one parent's whole genome, so there is nothing to reshuffle.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run both beds",
          instruction: "Play until each bed has at least 200 plants.",
          check: {
            describe: "200 offspring in each bed",
            test: (v) => (v.facts.offspring as number) >= 200 && (v.facts.clones as number) >= 200,
          },
          requireData: 3,
        },
        {
          id: "count",
          phase: "analyze",
          title: "Count the kinds",
          instruction: "How many different genotypes turned up in each bed?",
          check: {
            describe: "The clone bed shows exactly one genotype",
            test: (v) => v.facts.asexualIdentical === true,
          },
          hints: ["The clone bed can only ever contain the mother's own genotype."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say which strategy wins",
          instruction: "Each strategy has a cost. Say when each one is better.",
          write: {
            prompt: "When is variation an advantage, and when is being an identical copy an advantage?",
            placeholder: "If the environment changes, ... but if it stays the same, ...",
          },
          hints: ["Think back to what happened to a population with no variation left in Natural Selection."],
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hide-a-trait",
      title: "Hide the white flowers",
      brief: "Choose parents so that no offspring at all show the recessive trait.",
      bands: ["6-8", "9-12"],
      setup: { trait: "flower", mother: "Aa", father: "Aa", mode: "sexual", litterRate: 20 },
      goal: {
        describe: "200 offspring, none showing the recessive trait",
        test: (v) => (v.facts.offspring as number) >= 200 && (v.facts.recessiveFraction as number) === 0,
      },
      stars: {
        two: {
          describe: "Do it while at least one parent still carries the recessive allele",
          test: (v) =>
            (v.facts.offspring as number) >= 200 && (v.facts.recessiveFraction as number) === 0 &&
            (v.params.mother === "Aa" || v.params.father === "Aa"),
        },
        three: {
          describe: "Do it with half the offspring still carrying the hidden allele",
          test: (v) =>
            (v.facts.offspring as number) >= 200 && (v.facts.recessiveFraction as number) === 0 &&
            (v.facts.hetFraction as number) >= 0.4,
        },
      },
      hints: [
        "A recessive trait only shows when an offspring gets that allele twice.",
        "One parent with two dominant alleles is enough to mask it in every offspring.",
      ],
    },
    {
      id: "half-and-half",
      title: "Fifty-fifty",
      brief: "Find a cross where half the offspring show each form of the trait.",
      bands: ["6-8", "9-12"],
      setup: { trait: "seed", mother: "Aa", father: "aa", mode: "sexual", litterRate: 20 },
      goal: {
        describe: "300 offspring, split between 45% and 55% dominant",
        test: (v) =>
          (v.facts.offspring as number) >= 300 &&
          (v.facts.dominantFraction as number) >= 0.45 && (v.facts.dominantFraction as number) <= 0.55,
      },
      stars: {
        two: {
          describe: "Hold the split within 48-52% over 600 offspring",
          test: (v) =>
            (v.facts.offspring as number) >= 600 &&
            (v.facts.dominantFraction as number) >= 0.48 && (v.facts.dominantFraction as number) <= 0.52,
        },
      },
      hints: [
        "This cross is called a test cross, and breeders still use it.",
        "One parent must be able to pass only the recessive allele.",
      ],
    },
  ],
};
