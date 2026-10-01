import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Mutations — Grades 7-12.
 *
 * A mutation is a change to genetic information, so this sim starts with real
 * genetic information: the first twenty codons of the human β-globin gene
 * (HBB). The student edits a base, and the change propagates all the way down
 * the chain the cell actually uses — DNA, codons, amino acids, protein, trait.
 *
 * Three things fall out of that honestly, without being asserted:
 *
 * 1. The genetic code is redundant, so a great many single-base changes are
 *    silent. The sim surveys every possible single-base substitution of the
 *    real sequence and reports the measured silent fraction.
 * 2. Most mutations land outside protein-coding DNA entirely — only about 1.5%
 *    of the human genome codes for protein — so most have no effect on any
 *    protein at all. That, not codon redundancy alone, is why most mutations
 *    are neutral.
 * 3. Whether a mutation is beneficial or harmful is a fact about the
 *    environment, not about the DNA. The default edit is the real sickle-cell
 *    mutation, HBB codon 7 GAG→GTG (β6 Glu→Val), which causes sickle-cell
 *    disease in homozygotes and protects heterozygotes against malaria. The
 *    population panel runs selection on that allele with and without malaria.
 *
 * Fitness values for the sickle-cell balanced polymorphism are the standard
 * textbook estimates for a high-malaria region: w(AA) = 0.89, w(AS) = 1.00,
 * w(SS) = 0.20, giving an equilibrium HbS frequency near 0.12, which is what
 * is observed across malarial West Africa.
 */

/* ------------------------------------------------------------------ *
 * The genetic code
 * ------------------------------------------------------------------ */

const BASES = ["T", "C", "A", "G"] as const;

/**
 * NCBI translation table 1 — the standard genetic code — in its canonical
 * ordering: first base slowest, third base fastest, each cycling T, C, A, G.
 * "*" is a stop codon.
 */
const CODE_STRING = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";

export const CODON_TABLE: Record<string, string> = (() => {
  const table: Record<string, string> = {};
  let i = 0;
  for (const b1 of BASES) {
    for (const b2 of BASES) {
      for (const b3 of BASES) {
        table[b1 + b2 + b3] = CODE_STRING[i++];
      }
    }
  }
  return table;
})();

/** One-letter amino acid code to full name, for the on-stage labels. */
export const AA_NAMES: Record<string, string> = {
  A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", E: "Glu", Q: "Gln", G: "Gly",
  H: "His", I: "Ile", L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser",
  T: "Thr", W: "Trp", Y: "Tyr", V: "Val", "*": "STOP",
};

/** Side-chain chemistry, which is what decides whether a swap matters. */
export type AaClass = "nonpolar" | "polar" | "acidic" | "basic" | "stop";

const AA_CLASS: Record<string, AaClass> = {
  G: "nonpolar", A: "nonpolar", V: "nonpolar", L: "nonpolar", I: "nonpolar",
  P: "nonpolar", F: "nonpolar", M: "nonpolar", W: "nonpolar",
  S: "polar", T: "polar", C: "polar", Y: "polar", N: "polar", Q: "polar",
  D: "acidic", E: "acidic",
  K: "basic", R: "basic", H: "basic",
  "*": "stop",
};

export function aaClass(aa: string): AaClass {
  return AA_CLASS[aa] ?? "nonpolar";
}

/** Split a sequence into whole codons, dropping any trailing partial codon. */
export function codonsOf(dna: string): string[] {
  const out: string[] = [];
  for (let i = 0; i + 3 <= dna.length; i += 3) out.push(dna.slice(i, i + 3));
  return out;
}

/**
 * Translate DNA into a peptide, stopping at the first stop codon (which is
 * included in the output as "*", because a student needs to see it arrive).
 */
export function translate(dna: string): string[] {
  const out: string[] = [];
  for (const codon of codonsOf(dna)) {
    const aa = CODON_TABLE[codon];
    if (!aa) break;
    out.push(aa);
    if (aa === "*") break;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The gene
 * ------------------------------------------------------------------ */

/**
 * The first twenty codons of the human β-globin coding sequence (HBB).
 * Translates to M V H L T P E E K S A V T A L W G K V N.
 */
export const HBB =
  "ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAAC";

/** Base index (0-based) of the sickle-cell substitution: HBB codon 7, GAG→GTG. */
export const SICKLE_INDEX = 19;
export const SICKLE_BASE = "T";

export type MutationType = "none" | "substitution" | "insertion" | "deletion";

/** Apply one edit to a sequence. Positions are 0-based base indices. */
export function applyMutation(
  dna: string, type: MutationType, index: number, base: string,
): string {
  const i = Math.max(0, Math.min(dna.length - 1, Math.round(index)));
  if (type === "substitution") return dna.slice(0, i) + base + dna.slice(i + 1);
  if (type === "insertion") return dna.slice(0, i) + base + dna.slice(i);
  if (type === "deletion") return dna.slice(0, i) + dna.slice(i + 1);
  return dna;
}

export type MutationClass = "none" | "silent" | "missense" | "nonsense" | "frameshift";

export interface MutationOutcome {
  cls: MutationClass;
  /** 1-based codon number of the first amino acid that changed, or 0. */
  firstChanged: number;
  /** How many amino acids differ between the two proteins. */
  changed: number;
  /** True when the protein is cut short. */
  truncated: boolean;
  original: string[];
  mutated: string[];
}

/**
 * Compare the protein a gene made before and after an edit.
 *
 * A frameshift is decided by the length change, not by the peptide, because
 * that is what actually happened to the reading frame: every codon downstream
 * of an insertion or deletion is read out of register.
 */
export function classifyMutation(
  originalDna: string, mutatedDna: string, type: MutationType,
): MutationOutcome {
  const original = translate(originalDna);
  const mutated = translate(mutatedDna);
  let changed = 0;
  let firstChanged = 0;
  const n = Math.max(original.length, mutated.length);
  for (let i = 0; i < n; i++) {
    if (original[i] !== mutated[i]) {
      changed++;
      if (firstChanged === 0) firstChanged = i + 1;
    }
  }
  const truncated = mutated.includes("*") && !original.includes("*");
  const shift = (mutatedDna.length - originalDna.length) % 3 !== 0;

  let cls: MutationClass = "none";
  if (type !== "none") {
    if (shift) cls = "frameshift";
    else if (changed === 0) cls = "silent";
    else if (truncated) cls = "nonsense";
    else cls = "missense";
  }

  return { cls, firstChanged, changed, truncated, original, mutated };
}

/** Neutral, harmful or beneficial — and beneficial only ever in a context. */
export type Effect = "neutral" | "harmful" | "beneficial";

/**
 * The effect of a coding change on the organism.
 *
 * Silent changes are neutral. A missense change that keeps the side chain in
 * the same chemical class is treated as near-neutral, because the folded
 * protein usually tolerates it. A change of chemical class, a premature stop,
 * or a frameshift is harmful. Nothing is beneficial except in an environment
 * that makes it so — here, the sickle allele under malaria.
 */
export function effectOf(outcome: MutationOutcome, sickle: boolean, malaria: boolean): Effect {
  if (sickle && malaria) return "beneficial";
  if (outcome.cls === "none" || outcome.cls === "silent") return "neutral";
  if (outcome.cls === "frameshift" || outcome.cls === "nonsense") return "harmful";
  const a = outcome.original[outcome.firstChanged - 1];
  const b = outcome.mutated[outcome.firstChanged - 1];
  if (a && b && aaClass(a) === aaClass(b)) return "neutral";
  return "harmful";
}

/** Every possible single-base substitution of a sequence, classified. */
export function surveySubstitutions(dna: string): {
  total: number; silent: number; missense: number; nonsense: number;
} {
  let total = 0, silent = 0, missense = 0, nonsense = 0;
  for (let i = 0; i < dna.length; i++) {
    for (const base of BASES) {
      if (base === dna[i]) continue;
      total++;
      const out = classifyMutation(dna, applyMutation(dna, "substitution", i, base), "substitution");
      if (out.cls === "silent") silent++;
      else if (out.cls === "nonsense") nonsense++;
      else missense++;
    }
  }
  return { total, silent, missense, nonsense };
}

/* ------------------------------------------------------------------ *
 * Population genetics of the sickle allele
 * ------------------------------------------------------------------ */

/** Relative fitness of each genotype, with and without malaria. */
export function fitness(malaria: boolean): [number, number, number] {
  // [AA, AS, SS]. Sickle-cell disease is severe either way; malaria is what
  // makes carrying one copy an advantage.
  return malaria ? [0.89, 1.0, 0.2] : [1.0, 1.0, 0.2];
}

/** One generation of selection at a single locus with two alleles. */
export function selectOneGeneration(qFreq: number, w: [number, number, number]): number {
  const p = 1 - qFreq;
  const wBar = p * p * w[0] + 2 * p * qFreq * w[1] + qFreq * qFreq * w[2];
  if (wBar <= 0) return qFreq;
  return (qFreq * qFreq * w[2] + p * qFreq * w[1]) / wBar;
}

/**
 * The balanced-polymorphism equilibrium: with heterozygote advantage the
 * allele settles at q* = s_AA / (s_AA + s_SS), where s is 1 − w.
 */
export function equilibriumQ(w: [number, number, number]): number {
  const sAA = w[1] - w[0];
  const sSS = w[1] - w[2];
  if (sAA <= 0 || sSS <= 0) return 0;
  return sAA / (sAA + sSS);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** Mutations tried in the random survey, and where they landed. */
  tried: number;
  inCoding: number;
  silent: number;
  missense: number;
  nonsense: number;
  neutral: number;
  harmful: number;
  beneficial: number;
  /** Recent strike positions on the genome bar, 0..1, for the animation. */
  strikes: { x: number; coding: boolean; age: number }[];
  surveyClock: number;
  /** HbS allele frequency and its history. */
  qFreq: number;
  generation: number;
  genClock: number;
  history: number[];
  /** Free-running clock for the helix animation. */
  phase: number;
}

const HISTORY_MAX = 160;
const STRIKE_MAX = 26;
const GEN_SECONDS = 0.45;

function initialState(params: Record<string, number | boolean | string>): State {
  return {
    tried: 0, inCoding: 0, silent: 0, missense: 0, nonsense: 0,
    neutral: 0, harmful: 0, beneficial: 0,
    strikes: [],
    surveyClock: 0,
    qFreq: (params.startFrequency as number) ?? 0.02,
    generation: 0,
    genClock: 0,
    history: [(params.startFrequency as number) ?? 0.02],
    phase: 0,
  };
}

function mutatedSequence(params: Record<string, number | boolean | string>): string {
  const type = params.mutationType as MutationType;
  const index = (params.position as number) - 1;
  return applyMutation(HBB, type, index, params.newBase as string);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return initialState(params);
  },

  applyParams(state, params, prev) {
    if (params.startFrequency !== prev.startFrequency || params.environment !== prev.environment) {
      return { ...initialState(params), phase: state.phase };
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rate = params.surveyRate as number;
    const coding = (params.codingPercent as number) / 100;
    const malaria = params.environment === "malaria";

    let {
      tried, inCoding, silent, missense, nonsense, neutral, harmful, beneficial,
      surveyClock, qFreq, generation, genClock,
    } = state;
    let strikes = state.strikes;
    let history = state.history;

    /* --- survey: throw random mutations at a genome ------------------ */
    surveyClock += dt * rate;
    let budget = 400;
    let newStrikes: { x: number; coding: boolean; age: number }[] | null = null;
    while (surveyClock >= 1 && budget-- > 0) {
      surveyClock -= 1;
      tried++;
      const hitsCoding = ctx.rng.next() < coding;
      const x = ctx.rng.next();
      if (!newStrikes) newStrikes = strikes.slice();
      newStrikes.push({ x, coding: hitsCoding, age: 0 });
      if (!hitsCoding) {
        // Outside a gene there is no protein to change. (Some non-coding DNA
        // is regulatory, so this is a lower bound on "has an effect".)
        neutral++;
        continue;
      }
      inCoding++;
      const i = ctx.rng.int(0, HBB.length - 1);
      // Draw uniformly from the three bases that are not already there.
      const alternatives = BASES.filter((b) => b !== HBB[i]);
      const base: string = alternatives[ctx.rng.int(0, alternatives.length - 1)];
      const out = classifyMutation(HBB, applyMutation(HBB, "substitution", i, base), "substitution");
      if (out.cls === "silent") silent++;
      else if (out.cls === "nonsense") nonsense++;
      else missense++;
      const isSickle = i === SICKLE_INDEX && base === SICKLE_BASE;
      const eff = effectOf(out, isSickle, malaria);
      if (eff === "neutral") neutral++;
      else if (eff === "beneficial") beneficial++;
      else harmful++;
    }
    if (budget <= 0) surveyClock = 0;

    const source = newStrikes ?? strikes;
    if (source.length) {
      const kept: typeof source = [];
      for (const s of source) {
        const age = s.age + dt;
        if (age < 1.4) kept.push({ x: s.x, coding: s.coding, age });
      }
      strikes = kept.length > STRIKE_MAX ? kept.slice(kept.length - STRIKE_MAX) : kept;
    }

    /* --- selection on the sickle allele ------------------------------ */
    genClock += dt;
    const w = fitness(malaria);
    let genBudget = 40;
    while (genClock >= GEN_SECONDS && genBudget-- > 0) {
      genClock -= GEN_SECONDS;
      generation++;
      // Mutation keeps feeding a trickle of new HbS alleles in, which is why
      // the allele never quite reaches zero even where it is selected against.
      const mu = params.mutationRate as number;
      qFreq = Math.min(1, selectOneGeneration(qFreq, w) * (1 - mu) + mu);
      const drop = history.length >= HISTORY_MAX ? 1 : 0;
      history = history.slice(drop);
      history.push(qFreq);
    }

    return {
      tried, inCoding, silent, missense, nonsense, neutral, harmful, beneficial,
      strikes, surveyClock, qFreq, generation, genClock, history,
      phase: state.phase + dt,
    };
  },

  readouts(state, params) {
    const mutant = mutatedSequence(params);
    const out = classifyMutation(HBB, mutant, params.mutationType as MutationType);
    const tried = Math.max(state.tried, 1);
    const codingHits = Math.max(state.inCoding, 1);
    return [
      {
        key: "aminoAcidsChanged", label: "Amino acids changed",
        quantity: q(out.changed, "count"), semantic: "mass", graphable: false,
      },
      {
        key: "proteinLength", label: "Protein length",
        quantity: q(out.mutated.filter((a) => a !== "*").length, "count"),
        semantic: "distance", graphable: false,
      },
      {
        key: "neutralPercent", label: "Mutations with no effect",
        quantity: q(state.tried > 0 ? state.neutral / tried : 0, "percent"), unit: "%",
        semantic: "neutral", graphable: true,
      },
      {
        key: "harmfulPercent", label: "Harmful mutations",
        quantity: q(state.tried > 0 ? state.harmful / tried : 0, "percent"), unit: "%",
        semantic: "acid", graphable: true,
      },
      {
        key: "silentInCoding", label: "Silent, inside the gene",
        quantity: q(state.inCoding > 0 ? state.silent / codingHits : 0, "percent"), unit: "%",
        semantic: "base", graphable: true, bands: ["9-12"],
      },
      {
        key: "sickleFrequency", label: "Sickle allele",
        quantity: q(state.qFreq, "percent"), unit: "%",
        semantic: "acid", graphable: true,
      },
      {
        key: "generation", label: "Generation", quantity: q(state.generation, "count"),
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const mutant = mutatedSequence(params);
    const type = params.mutationType as MutationType;
    const out = classifyMutation(HBB, mutant, type);
    const malaria = params.environment === "malaria";
    const isSickle =
      type === "substitution" &&
      (params.position as number) - 1 === SICKLE_INDEX &&
      params.newBase === SICKLE_BASE;
    const tried = Math.max(state.tried, 1);
    const w = fitness(malaria);
    return {
      originalProtein: out.original.join(""),
      mutantProtein: out.mutated.join(""),
      mutationClass: out.cls,
      aminoAcidsChanged: out.changed,
      firstChangedCodon: out.firstChanged,
      proteinLength: out.mutated.filter((a) => a !== "*").length,
      isSickle,
      effect: effectOf(out, isSickle, malaria),
      mutationsTried: state.tried,
      neutralFraction: state.tried > 0 ? state.neutral / tried : 0,
      harmfulFraction: state.tried > 0 ? state.harmful / tried : 0,
      beneficialFraction: state.tried > 0 ? state.beneficial / tried : 0,
      codingHits: state.inCoding,
      silentFractionInCoding: state.inCoding > 0 ? state.silent / state.inCoding : 0,
      sickleFrequency: state.qFreq,
      equilibriumFrequency: equilibriumQ(w),
      generation: state.generation,
      malaria,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Fixed identity colours for the four bases; A-T warm, G-C cool. */
function baseColor(b: string, theme: RenderContext<State>["theme"]): string {
  if (b === "A") return theme.sci["hot"];
  if (b === "T") return theme.sci["cold"];
  if (b === "G") return theme.sci["base"];
  return theme.sci["acid"];
}

/** Amino acid colour is its side-chain chemistry — the thing that matters. */
function aaColor(aa: string, theme: RenderContext<State>["theme"]): string {
  switch (aaClass(aa)) {
    case "acidic": return theme.sci["acid"];
    case "basic": return theme.sci["base"];
    case "polar": return theme.sci["liquid"];
    case "stop": return theme.sci["force"];
    default: return theme.sci["mass"];
  }
}

function drawStrand(
  rc: RenderContext<State>, x: number, y: number, w: number, dna: string,
  markIndex: number, markKind: MutationType,
) {
  const { ctx, state, theme, band } = rc;
  const step = w / dna.length;
  const showLetters = step >= 9 && band !== "3-5";
  const h = 15;

  // The paired strand below, so DNA reads as a double helix, not a barcode.
  const twist = Math.sin(state.phase * 0.8) * 1.5;
  for (let i = 0; i < dna.length; i++) {
    const bx = x + i * step;
    const color = baseColor(dna[i], theme);
    const wobble = Math.sin(state.phase * 1.6 + i * 0.5) * 0.8;
    ctx.save();
    ctx.fillStyle = hexA(color, 0.9);
    ctx.fillRect(bx + 0.5, y + wobble, Math.max(1.2, step - 1), h);
    ctx.globalAlpha = 0.32;
    ctx.fillRect(bx + 0.5, y + h + 3 + twist - wobble, Math.max(1.2, step - 1), h * 0.55);
    ctx.restore();
    if (showLetters) {
      caption(ctx, bx + step / 2, y + h / 2 + wobble, dna[i], theme, {
        align: "center", size: Math.min(10, step * 0.9), color: theme.surface, weight: 800,
      });
    }
  }

  if (markKind !== "none" && markIndex >= 0 && markIndex < dna.length) {
    const bx = x + markIndex * step;
    glow(ctx, bx + step / 2, y + h / 2, Math.max(12, step * 3), theme.accent, 0.55);
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 0.5, y - 2.5, Math.max(3, step) + 1, h + 5);
    ctx.restore();
  }
}

function drawProtein(
  rc: RenderContext<State>, x: number, y: number, w: number,
  peptide: string[], compare: string[] | null, label: string,
) {
  const { ctx, theme, band } = rc;
  const n = Math.max(peptide.length, 1);
  const step = Math.min(w / Math.max(n, 20), 26);
  const r = Math.max(3, Math.min(8, step * 0.42));

  caption(ctx, x, y - r - 7, label, theme, { size: 10, color: theme.inkSoft });

  // The backbone first, so the beads sit on a chain.
  if (peptide.length > 1) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + step / 2, y);
    ctx.lineTo(x + step * (peptide.length - 0.5), y);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < peptide.length; i++) {
    const cx = x + step * (i + 0.5);
    const changed = compare !== null && compare[i] !== peptide[i];
    sphere(ctx, cx, y, r, aaColor(peptide[i], theme), { glow: changed ? 0.8 : 0 });
    if (changed) {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, y, r + 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (step >= 13 && band !== "3-5") {
      caption(ctx, cx, y + r + 7, peptide[i], theme, {
        align: "center", size: 9, color: changed ? theme.accent : theme.inkSoft, weight: changed ? 800 : 600,
      });
    }
  }
}

/** The genome bar: a sliver of coding DNA in a long stretch of everything else. */
function drawGenome(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const coding = (params.codingPercent as number) / 100;

  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.22);
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  // The coding part, drawn to scale — at the real 1.5% it is a hairline.
  ctx.fillStyle = theme.sci["producer"];
  ctx.fillRect(x + w * 0.5 - (w * coding) / 2, y, Math.max(1.5, w * coding), h);
  ctx.restore();

  for (const s of state.strikes) {
    const t = 1 - s.age / 1.4;
    const sx = x + s.x * w;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t);
    ctx.strokeStyle = s.coding ? theme.sci["acid"] : theme.sci["neutral"];
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, y - 5 - (1 - t) * 6);
    ctx.lineTo(sx, y + h + 5);
    ctx.stroke();
    ctx.restore();
  }

  caption(ctx, x, y - 7, `genome — ${(coding * 100).toFixed(1)}% codes for protein`, theme, {
    size: 9, color: theme.inkSoft,
  });
}

function drawTally(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const total = Math.max(state.tried, 1);
  const parts: [number, string, string][] = [
    [state.neutral / total, theme.sci["neutral"], "no effect"],
    [state.harmful / total, theme.sci["acid"], "harmful"],
    [state.beneficial / total, theme.sci["light"], "beneficial"],
  ];
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, 0.18);
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.clip();
  let cx = x;
  for (const [frac, color] of parts) {
    const bw = frac * w;
    ctx.fillStyle = color;
    ctx.fillRect(cx, y, Math.max(0, bw), h);
    cx += bw;
  }
  ctx.restore();

  if (state.tried > 0) {
    caption(
      ctx, x, y + h + 10,
      `${state.tried} mutations · ${Math.round((state.neutral / total) * 100)}% no effect · ` +
      `${state.beneficial} beneficial`,
      theme, { size: 10, color: theme.inkSoft },
    );
  }
}

function drawAlleleGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const malaria = params.environment === "malaria";
  const eq = equilibriumQ(fitness(malaria));
  const scale = 0.35; // the graph tops out at 35%, where the action is

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.55 : 0.72);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (eq > 0) {
    const ey = y + h - (eq / scale) * h;
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.5);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, ey);
    ctx.lineTo(x + w, ey);
    ctx.stroke();
    ctx.restore();
    caption(ctx, x + w - 4, ey - 7, `balance ${(eq * 100).toFixed(0)}%`, theme, {
      align: "right", size: 9, color: theme.inkSoft,
    });
  }

  const n = state.history.length;
  if (n >= 2) {
    ctx.save();
    ctx.strokeStyle = theme.sci["acid"];
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x + (i / (n - 1)) * w;
      const py = y + h - Math.min(1, state.history[i] / scale) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  caption(ctx, x + 4, y + 9, malaria ? "with malaria" : "no malaria", theme, {
    size: 10, color: theme.inkSoft,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height, overlays, band } = rc;
  const type = params.mutationType as MutationType;
  const markIndex = (params.position as number) - 1;
  const mutant = mutatedSequence(params);
  const out = classifyMutation(HBB, mutant, type);

  sky(ctx, width, height, theme, "microscope");

  const pad = 12;
  const w = width - pad * 2;
  let y = 24;

  caption(ctx, pad, 13, "Human β-globin gene (HBB) — first 20 codons", theme, {
    size: 11, color: theme.inkSoft,
  });

  /* --- the original strand ----------------------------------------- */
  drawStrand(rc, pad, y, w, HBB, -1, "none");
  caption(ctx, width - pad, y + 8, "original", theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });
  y += 38;

  /* --- the mutated strand ------------------------------------------ */
  drawStrand(rc, pad, y, w, mutant, type === "none" ? -1 : markIndex, type);
  y += 34;

  /* --- proteins ----------------------------------------------------- */
  if (overlays.protein !== false) {
    y += 14;
    drawProtein(rc, pad, y, w, out.original, null, "protein before");
    y += 34;
    drawProtein(rc, pad, y, w, out.mutated, out.original, "protein after");
    y += 26;
  }

  /* --- verdict ------------------------------------------------------ */
  const malaria = params.environment === "malaria";
  const isSickle = type === "substitution" && markIndex === SICKLE_INDEX && params.newBase === SICKLE_BASE;
  const eff = effectOf(out, isSickle, malaria);
  const verdictColor =
    eff === "beneficial" ? theme.sci["light"] : eff === "harmful" ? theme.sci["acid"] : theme.sci["neutral"];
  const clsText: Record<MutationClass, string> = {
    none: "no change", silent: "silent — same protein", missense: "missense — one amino acid swapped",
    nonsense: "nonsense — protein cut short", frameshift: "frameshift — everything after it is scrambled",
  };
  if (band !== "3-5") {
    material(ctx, pad, y, Math.min(w, 320), 22, theme.surfaceAlt, 5);
    caption(ctx, pad + 8, y + 11, clsText[out.cls], theme, { size: 11, color: verdictColor, weight: 700 });
  }
  if (isSickle) {
    badge(ctx, Math.min(width - pad, pad + 340), y + 11, "HbS", theme, {
      align: "right", color: theme.sci["acid"], sub: "sickle-cell allele",
    });
  }
  y += 32;

  /* --- survey and population --------------------------------------- */
  const bottom = height - 8;
  const remaining = bottom - y;
  if (remaining > 60) {
    const half = (w - 14) / 2;
    if (overlays.survey !== false) {
      drawGenome(rc, pad, y + 10, half, 10);
      drawTally(rc, pad, y + 32, half, 9);
    }
    if (overlays.population !== false && band !== "3-5") {
      drawAlleleGraph(rc, pad + half + 14, y + 4, half, Math.min(54, remaining - 8));
      caption(ctx, pad + half + 14, y - 2, "sickle allele over generations", theme, {
        size: 9, color: theme.inkSoft,
      });
    }
  }

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const mutationsSim: SimManifest<State> = {
  id: "bio.mutations",
  title: "Mutations",
  tagline: "Change one letter of a real human gene and follow it all the way to the protein.",
  subject: "biology",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-LS3-1", "MS-LS4-4", "HS-LS3-2", "HS-LS1-1"] },
  learningGoals: [
    "Explain that a mutation is a change to the information in DNA.",
    "Use the genetic code to work out what a change does to a protein.",
    "Explain why most mutations have no effect, and why a few have a huge one.",
    "Explain that whether a mutation helps depends on the environment.",
  ],
  misconceptions: [
    "Every mutation is harmful",
    "Mutations happen because an organism needs them",
    "A mutation always changes the protein",
    "Beneficial and harmful are properties of the DNA itself",
  ],
  interactionHint: "Slide the position to 20 and set the new base to T — that is sickle cell.",
  tickRate: 60,
  params: {
    mutationType: {
      type: "option", label: "What happens to the DNA",
      options: [
        { value: "none", label: "Nothing (original gene)" },
        { value: "substitution", label: "Swap one base" },
        { value: "insertion", label: "Add one base" },
        { value: "deletion", label: "Remove one base" },
      ],
      default: "substitution",
      help: "Adding or removing a base shifts every codon after it.",
    },
    position: {
      type: "number", label: "Base position", kind: "count",
      min: 1, max: 60, step: 1, default: 20,
      marks: [
        { value: 9, label: "silent" },
        { value: 20, label: "sickle" },
        { value: 46, label: "stop" },
      ],
    },
    newBase: {
      type: "option", label: "New base",
      options: [
        { value: "A", label: "A" }, { value: "C", label: "C" },
        { value: "G", label: "G" }, { value: "T", label: "T" },
      ],
      default: "T",
    },
    environment: {
      type: "option", label: "Where they live",
      options: [
        { value: "none", label: "No malaria" },
        { value: "malaria", label: "Malaria present" },
      ],
      default: "malaria",
      help: "The same allele, two different environments, two different verdicts.",
    },
    codingPercent: {
      type: "number", label: "DNA that codes for protein", kind: "percent", unit: "%",
      min: 0.5, max: 100, step: 0.5, default: 1.5,
      bands: ["6-8", "9-12"],
      marks: [{ value: 1.5, label: "human" }, { value: 88, label: "E. coli" }],
      help: "About 1.5% of the human genome codes for protein. Most mutations miss.",
    },
    surveyRate: {
      type: "number", label: "Mutations tested per second", kind: "count",
      min: 20, max: 600, step: 20, default: 200,
      bands: ["9-12"],
    },
    startFrequency: {
      type: "number", label: "Starting sickle allele", kind: "percent", unit: "%",
      min: 0, max: 0.5, step: 0.01, default: 0.02,
      bands: ["9-12"],
    },
    mutationRate: {
      type: "number", label: "New mutations per generation", kind: "ratio",
      min: 0, max: 0.002, step: 0.0001, default: 0.0001,
      bands: ["9-12"],
      help: "The trickle of brand new variation that selection then acts on.",
    },
  },
  overlays: [
    { key: "protein", label: "Protein chain", default: true },
    { key: "survey", label: "Genome survey", default: true },
    { key: "population", label: "Allele frequency", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "silent-and-shattering",
      title: "Which changes matter?",
      question: "Three single-letter changes to the same gene. Why do they have such different effects?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS3-1"],
      setup: {
        mutationType: "substitution", position: 9, newBase: "C",
        environment: "malaria", codingPercent: 1.5, surveyRate: 200,
        startFrequency: 0.02, mutationRate: 0.0001,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You are about to change exactly one letter, three different times.",
          predict: {
            prompt: "How many of the three changes do you think will change the protein?",
            options: ["None", "One", "Two", "All three"],
            correct: 2,
            reveal:
              "Two. Position 9 swaps CAT for CAC, and both spell histidine — the code is redundant. Position 20 swaps one amino acid. Removing a base shifts the reading frame and wrecks everything after it.",
          },
        },
        {
          id: "silent",
          phase: "measure",
          title: "The silent one",
          instruction: "Set position 9, new base C. Compare the two protein chains.",
          check: {
            describe: "A silent mutation is on screen",
            test: (v) => v.facts.mutationClass === "silent",
          },
          hints: ["Look at codon 3. CAT and CAC are different DNA and the same amino acid."],
        },
        {
          id: "missense",
          phase: "measure",
          title: "The famous one",
          instruction: "Now position 20, new base T. One bead in the chain changes colour.",
          check: {
            describe: "The sickle-cell mutation is on screen",
            test: (v) => v.facts.isSickle === true,
          },
          hints: [
            "Glutamic acid is acidic; valine is not. Swapping them changes the surface of the protein.",
            "That single swap is what makes red blood cells sickle.",
          ],
        },
        {
          id: "frameshift",
          phase: "measure",
          title: "The catastrophic one",
          instruction: "Set the change to Remove one base, anywhere near the start.",
          check: {
            describe: "A frameshift is on screen",
            test: (v) => v.facts.mutationClass === "frameshift",
          },
          requireData: 3,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "One letter each time. Say why the effects differ so much.",
          write: {
            prompt: "Why can one change do nothing at all while another ruins the whole protein?",
            placeholder: "The code reads three letters at a time, so ...",
          },
        },
      ],
    },
    {
      id: "most-are-neutral",
      title: "Are most mutations harmful?",
      question: "Throw thousands of random mutations at a genome. What fraction actually do anything?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS3-1", "MS-LS4-4"],
      setup: {
        mutationType: "none", position: 20, newBase: "T",
        environment: "malaria", codingPercent: 1.5, surveyRate: 300,
        startFrequency: 0.02, mutationRate: 0.0001,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Random mutations, scattered across a human genome.",
          predict: {
            prompt: "Out of 1000 random mutations, roughly how many change a protein at all?",
            options: ["About 15", "About 250", "About 750", "All 1000"],
            correct: 0,
            reveal:
              "About 15. Only around 1.5% of human DNA codes for protein, so almost every mutation lands somewhere that makes no protein at all.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the survey",
          instruction: "Play until at least 2000 mutations have been tested. Record as you go.",
          requireData: 3,
          check: {
            describe: "2000 mutations tested",
            test: (v) => (v.facts.mutationsTried as number) >= 2000,
          },
        },
        {
          id: "inside",
          phase: "analyze",
          title: "Now aim inside the gene",
          instruction: "Set the coding percentage to 100 so every mutation lands in the gene.",
          check: {
            describe: "Every mutation lands in coding DNA",
            test: (v) => (v.params.codingPercent as number) >= 99,
          },
          hints: [
            "Even inside a gene, about a quarter of single-base swaps change nothing.",
            "That quarter is the redundancy built into the genetic code.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Two reasons",
          instruction: "Write both reasons most mutations are neutral.",
          write: {
            prompt: "Give the two separate reasons a mutation often has no effect.",
            placeholder: "Most mutations land ... and even inside a gene ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "break-it",
      title: "Break the protein",
      brief: "Find a single-base swap that cuts the protein short.",
      bands: ["6-8", "9-12"],
      setup: { mutationType: "substitution", position: 30, newBase: "A" },
      goal: {
        describe: "A nonsense mutation, with the protein cut short",
        test: (v) => v.facts.mutationClass === "nonsense",
      },
      stars: {
        two: {
          describe: "Cut it short within the first ten amino acids",
          test: (v) =>
            v.facts.mutationClass === "nonsense" && (v.facts.proteinLength as number) <= 10,
        },
        three: {
          describe: "Cut it to five amino acids or fewer",
          test: (v) =>
            v.facts.mutationClass === "nonsense" && (v.facts.proteinLength as number) <= 5,
        },
      },
      hints: [
        "There are only three stop codons: TAA, TAG and TGA.",
        "Look for a codon that is already one letter away from one of them.",
      ],
    },
    {
      id: "flip-the-verdict",
      title: "Same mutation, opposite verdict",
      brief: "Make the sickle allele rise, then make the very same allele fall.",
      bands: ["9-12"],
      setup: {
        mutationType: "substitution", position: 20, newBase: "T",
        environment: "malaria", startFrequency: 0.02, mutationRate: 0.0001,
      },
      goal: {
        describe: "The sickle allele settles above 8% under malaria",
        test: (v) => v.facts.malaria === true && (v.facts.sickleFrequency as number) >= 0.08,
      },
      stars: {
        two: {
          describe: "Reach the balance point within 5% of the predicted equilibrium",
          test: (v) =>
            v.facts.malaria === true &&
            Math.abs((v.facts.sickleFrequency as number) - (v.facts.equilibriumFrequency as number)) < 0.05,
        },
        three: {
          describe: "Then remove malaria and drive it back below 2%",
          test: (v) => v.facts.malaria === false && (v.facts.sickleFrequency as number) < 0.02,
        },
      },
      hints: [
        "Carrying one copy protects against malaria. Carrying two causes sickle-cell disease.",
        "Take malaria away and the only thing left is the cost.",
      ],
    },
  ],
};
