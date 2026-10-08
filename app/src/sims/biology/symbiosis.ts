import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import type { SkyMood } from "@ui/scene";
import {
  badge, caption, glow, groundPlane, hexA, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Living Together — Grades 6-10.
 *
 * Eight real pairs of organisms, from a coral reef to the inside of a cow, and
 * the same question for each: what does living together actually do to the
 * numbers? Every pair runs twice at once — once with its partner and once
 * without — so the plus, the zero and the minus are read off two population
 * curves rather than memorised from a table. A commensal partner's two curves
 * lie exactly on top of each other, and that is the definition made visible.
 *
 * The interaction is a logistic model in which each species' carrying capacity
 * depends on how abundant its partner is:
 *
 *     dN/dt = r·N·(1 − N / K_eff),   K_eff = K · (alone + b · s)
 *
 * where s is the partner's saturating abundance, `alone` is how much of its
 * capacity a species keeps with no partner at all, and b is the sign of the
 * relationship. A tapeworm has alone ≈ 0.02, so no host means no tapeworms.
 *
 * The conditions switch is the point of D4.4: an oxpecker that eats ticks is a
 * mutualist, but when ticks are scarce it feeds on open wounds and the very
 * same relationship turns parasitic. The sign is not a property of a species.
 *
 * Grade 7 Unit D, topic D4.
 */

/* ------------------------------------------------------------------ *
 * The pairs
 * ------------------------------------------------------------------ */

export interface Partner {
  name: string;
  /** Drawing kind. */
  kind: string;
  /** Carrying capacity with a full complement of partners. */
  K: number;
  /** Intrinsic growth rate, per year. */
  r: number;
  /** Share of capacity kept with no partner at all. 1 means fine alone. */
  alone: number;
  /** What the partner does to this species' capacity: + helps, − harms. */
  b: number;
  /** The same coefficient once the condition changes. */
  bStressed: number;
  /** Semantic palette key, or "accent" for the dependent partner. */
  tone: string;
}

export interface PairSpec {
  key: string;
  title: string;
  ecosystem: string;
  mood: SkyMood;
  ground: "grass" | "soil" | "rock" | "lab" | "water";
  a: Partner;
  b: Partner;
  /** What "change the conditions" means for this pair. */
  stress: string;
  note: string;
}

/**
 * Every coefficient below encodes a real, documented relationship. The
 * oxpecker case follows Weeks' 2000 removal experiments, which found the birds
 * feeding on wounds when ticks were scarce; the mycorrhiza case follows the
 * long-known result that fertilising soil turns the fungus from a partner into
 * a cost, because the plant no longer needs the phosphorus it is paying for.
 */
export const PAIRS: PairSpec[] = [
  {
    key: "clownfish", title: "Clownfish and sea anemone", ecosystem: "Coral reef",
    mood: "underwater", ground: "rock",
    a: { name: "Clownfish", kind: "clownfish", K: 120, r: 1.1, alone: 0.12, b: 0.9, bStressed: 0.45, tone: "accent" },
    b: { name: "Sea anemone", kind: "anemone", K: 40, r: 0.5, alone: 0.7, b: 0.35, bStressed: 0.15, tone: "secondary-consumer" },
    stress: "The reef bleaches",
    note: "The fish shelters in stinging tentacles nothing else will touch; the anemone gets cleaned, fed and defended.",
  },
  {
    key: "bee", title: "Bee and flower", ecosystem: "Meadow",
    mood: "day", ground: "grass",
    a: { name: "Bee", kind: "bee", K: 300, r: 1.4, alone: 0.15, b: 0.9, bStressed: 0.35, tone: "primary-consumer" },
    b: { name: "Wildflower", kind: "flower", K: 500, r: 0.9, alone: 0.45, b: 0.6, bStressed: 0.25, tone: "producer" },
    stress: "Pesticide drifts across the field",
    note: "The bee is paid in nectar for carrying pollen. Both sides gain, in different currencies.",
  },
  {
    key: "oxpecker", title: "Oxpecker and buffalo", ecosystem: "African savanna",
    mood: "day", ground: "grass",
    a: { name: "Oxpecker", kind: "oxpecker", K: 60, r: 1.0, alone: 0.08, b: 0.95, bStressed: 0.95, tone: "accent" },
    b: { name: "Buffalo", kind: "buffalo", K: 90, r: 0.35, alone: 1, b: 0.22, bStressed: -0.3, tone: "primary-consumer" },
    stress: "Ticks become scarce",
    note: "Eating ticks off a buffalo helps it. With no ticks to eat, the same bird opens wounds and drinks blood.",
  },
  {
    key: "mycorrhiza", title: "Fungus and pine root", ecosystem: "Forest soil",
    mood: "microscope", ground: "soil",
    a: { name: "Mycorrhizal fungus", kind: "fungus", K: 80, r: 1.2, alone: 0.1, b: 0.9, bStressed: 0.9, tone: "decomposer" },
    b: { name: "Pine tree", kind: "pine", K: 45, r: 0.28, alone: 1, b: 0.45, bStressed: -0.18, tone: "producer" },
    stress: "The soil is fertilised",
    note: "The fungus trades phosphorus for sugar. Fertilise the soil and the tree is paying for something it no longer needs.",
  },
  {
    key: "barnacle", title: "Barnacle and whale", ecosystem: "Open ocean",
    mood: "underwater", ground: "water",
    a: { name: "Barnacle", kind: "barnacle", K: 400, r: 1.3, alone: 0.15, b: 0.85, bStressed: 0.85, tone: "accent" },
    b: { name: "Grey whale", kind: "whale", K: 25, r: 0.12, alone: 1, b: 0, bStressed: -0.12, tone: "secondary-consumer" },
    stress: "The whale carries a huge load",
    note: "A free ride through plankton-rich water. The whale neither gains nor loses — until the load gets heavy.",
  },
  {
    key: "egret", title: "Cattle egret and buffalo", ecosystem: "Grassland",
    mood: "day", ground: "grass",
    a: { name: "Cattle egret", kind: "egret", K: 70, r: 1.0, alone: 0.45, b: 0.55, bStressed: 0.55, tone: "accent" },
    b: { name: "Buffalo", kind: "buffalo", K: 90, r: 0.35, alone: 1, b: 0, bStressed: 0.12, tone: "primary-consumer" },
    stress: "The egrets start taking ticks too",
    note: "Grazing buffalo flush insects out of the grass. The egret eats them; the buffalo does not notice.",
  },
  {
    key: "tapeworm", title: "Tapeworm and its host", ecosystem: "Inside a gut",
    mood: "indoor", ground: "lab",
    a: { name: "Tapeworm", kind: "tapeworm", K: 30, r: 1.6, alone: 0.02, b: 0.98, bStressed: 0.98, tone: "accent" },
    b: { name: "Cattle host", kind: "cow", K: 60, r: 0.3, alone: 1, b: -0.35, bStressed: -0.1, tone: "primary-consumer" },
    stress: "The host is very well fed",
    note: "The worm has no gut of its own and absorbs food already digested by the host. The host pays for both of them.",
  },
  {
    key: "mistletoe", title: "Mistletoe and oak", ecosystem: "Woodland",
    mood: "day", ground: "grass",
    a: { name: "Mistletoe", kind: "mistletoe", K: 50, r: 0.8, alone: 0.03, b: 0.95, bStressed: 0.95, tone: "accent" },
    b: { name: "Oak tree", kind: "pine", K: 40, r: 0.15, alone: 1, b: -0.28, bStressed: -0.5, tone: "producer" },
    stress: "A drought sets in",
    note: "Mistletoe roots straight into the branch and takes the tree's water and minerals.",
  },
];

export function pairFor(key: string): PairSpec {
  return PAIRS.find((p) => p.key === key) ?? PAIRS[0];
}

/** Half-saturation: the partner abundance at which half the effect is felt. */
const HALF_SAT = 0.4;

export function saturate(fractionOfK: number): number {
  const x = Math.max(0, fractionOfK);
  return x / (HALF_SAT + x);
}

/** The coefficient in force, given the condition and the strength dial. */
export function coefficient(p: Partner, stressed: boolean, strength: number): number {
  return (stressed ? p.bStressed : p.b) * strength;
}

/** Capacity of one partner given how abundant the other is. */
export function capacity(p: Partner, partnerFraction: number, stressed: boolean, strength: number): number {
  const eff = p.alone + coefficient(p, stressed, strength) * saturate(partnerFraction);
  // A capacity can be squeezed towards nothing but never below it.
  return p.K * Math.max(0.01, eff);
}

export type Sign = "+" | "0" | "−";

export function signOf(effect: number): Sign {
  if (effect > 0.02) return "+";
  if (effect < -0.02) return "−";
  return "0";
}

export function relationshipName(a: Sign, b: Sign): string {
  if (a === "+" && b === "+") return "Mutualism";
  if ((a === "+" && b === "0") || (a === "0" && b === "+")) return "Commensalism";
  if ((a === "+" && b === "−") || (a === "−" && b === "+")) return "Parasitism";
  if (a === "−" && b === "−") return "Competition";
  if (a === "0" && b === "0") return "No effect";
  return "One-sided harm";
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  t: number;
  /** Populations living together. */
  a: number;
  b: number;
  /** The control: the same species with no partner at all. */
  aAlone: number;
  bAlone: number;
  histT: number[];
  histA: number[];
  histB: number[];
  histAAlone: number[];
  histBAlone: number[];
  sampleClock: number;
  peakA: number;
  peakB: number;
}

const HISTORY_MAX = 220;
const SAMPLE_YEARS = 0.4;

function startState(params: ParamValues): State {
  const pair = pairFor(params.pair as string);
  const f = params.startFraction as number;
  const a = pair.a.K * f;
  const b = pair.b.K * f;
  return {
    t: 0,
    a, b, aAlone: a, bAlone: b,
    histT: [0], histA: [a], histB: [b], histAAlone: [a], histBAlone: [b],
    sampleClock: 0,
    peakA: a, peakB: b,
  };
}

const model: SimModel<State> = {
  init(params) {
    return startState(params);
  },

  applyParams(state, params, prev) {
    // A different pair or a different starting size is a different experiment.
    if (params.pair !== prev.pair || params.startFraction !== prev.startFraction) {
      return startState(params);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const pair = pairFor(params.pair as string);
    const stressed = params.condition === "stressed";
    const strength = params.strength as number;

    // Logistic growth toward a capacity that depends on the partner.
    const grow = (n: number, p: Partner, kEff: number) => {
      const next = n + p.r * n * (1 - n / Math.max(1e-6, kEff)) * dt;
      return Math.max(0, next);
    };

    const kA = capacity(pair.a, state.b / pair.b.K, stressed, strength);
    const kB = capacity(pair.b, state.a / pair.a.K, stressed, strength);
    const a = grow(state.a, pair.a, kA);
    const b = grow(state.b, pair.b, kB);

    // The control run: exactly the same species with the partner absent.
    const kAAlone = capacity(pair.a, 0, stressed, strength);
    const kBAlone = capacity(pair.b, 0, stressed, strength);
    const aAlone = grow(state.aAlone, pair.a, kAAlone);
    const bAlone = grow(state.bAlone, pair.b, kBAlone);

    const t = state.t + dt;
    let histT = state.histT;
    let histA = state.histA;
    let histB = state.histB;
    let histAAlone = state.histAAlone;
    let histBAlone = state.histBAlone;
    let sampleClock = state.sampleClock + dt;
    if (sampleClock >= SAMPLE_YEARS) {
      sampleClock -= SAMPLE_YEARS;
      const drop = histT.length >= HISTORY_MAX ? 1 : 0;
      histT = histT.slice(drop);
      histA = histA.slice(drop);
      histB = histB.slice(drop);
      histAAlone = histAAlone.slice(drop);
      histBAlone = histBAlone.slice(drop);
      histT.push(t);
      histA.push(a);
      histB.push(b);
      histAAlone.push(aAlone);
      histBAlone.push(bAlone);
    }
    void ctx;

    return {
      t, a, b, aAlone, bAlone,
      histT, histA, histB, histAAlone, histBAlone, sampleClock,
      peakA: Math.max(state.peakA, a),
      peakB: Math.max(state.peakB, b),
    };
  },

  readouts(state, params) {
    const pair = pairFor(params.pair as string);
    return [
      {
        key: "a", label: `${pair.a.name}, together`, quantity: q(state.a, "population"),
        semantic: pair.a.tone === "accent" ? "primary-consumer" : pair.a.tone, graphable: true,
      },
      {
        key: "aAlone", label: `${pair.a.name}, alone`, quantity: q(state.aAlone, "population"),
        semantic: "mass", graphable: true,
      },
      {
        key: "b", label: `${pair.b.name}, together`, quantity: q(state.b, "population"),
        semantic: pair.b.tone === "accent" ? "secondary-consumer" : pair.b.tone, graphable: true,
      },
      {
        key: "bAlone", label: `${pair.b.name}, alone`, quantity: q(state.bAlone, "population"),
        semantic: "mass", graphable: true,
      },
      {
        key: "effectA", label: `Effect on the ${pair.a.name.toLowerCase()}`,
        quantity: q(effect(state.a, state.aAlone), "percent"), unit: "%",
        semantic: "energy-total", graphable: true,
      },
      {
        key: "effectB", label: `Effect on the ${pair.b.name.toLowerCase()}`,
        quantity: q(effect(state.b, state.bAlone), "percent"), unit: "%",
        semantic: "energy-total", graphable: true,
      },
      {
        key: "years", label: "Years", quantity: q(state.t, "count"),
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const pair = pairFor(params.pair as string);
    const stressed = params.condition === "stressed";
    const strength = params.strength as number;
    const eA = effect(state.a, state.aAlone);
    const eB = effect(state.b, state.bAlone);
    const sA = signOf(eA);
    const sB = signOf(eB);
    return {
      pair: pair.key,
      title: pair.title,
      ecosystem: pair.ecosystem,
      condition: stressed ? "stressed" : "normal",
      nameA: pair.a.name,
      nameB: pair.b.name,
      popA: state.a,
      popB: state.b,
      popAAlone: state.aAlone,
      popBAlone: state.bAlone,
      effectA: eA,
      effectB: eB,
      signA: sA,
      signB: sB,
      relationship: relationshipName(sA, sB),
      coefA: coefficient(pair.a, stressed, strength),
      coefB: coefficient(pair.b, stressed, strength),
      capacityA: capacity(pair.a, state.b / pair.b.K, stressed, strength),
      capacityB: capacity(pair.b, state.a / pair.a.K, stressed, strength),
      capacityAAlone: capacity(pair.a, 0, stressed, strength),
      capacityBAlone: capacity(pair.b, 0, stressed, strength),
      years: state.t,
      settled: state.t > 40,
      flipped: signOf(pair.b.b * strength) !== signOf(pair.b.bStressed * strength),
    };
  },
};

/** Relative change caused by having the partner around. */
function effect(together: number, alone: number): number {
  if (alone <= 1e-9) return together > 1e-9 ? 10 : 0;
  return together / alone - 1;
}

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function toneColor(tone: string, theme: RenderContext<State>["theme"]): string {
  return tone === "accent" ? theme.accent : theme.sci[tone];
}

function signColor(s: Sign, theme: RenderContext<State>["theme"]): string {
  if (s === "+") return theme.accent;
  if (s === "−") return theme.sci["hot"];
  return theme.inkSoft;
}

/** One organism, drawn as itself. Compact, but never a coloured circle. */
function drawOrganism(
  rc: RenderContext<State>, kind: string, x: number, y: number, r: number, color: string,
) {
  const { ctx, state } = rc;
  const sway = Math.sin(state.t * 1.4 + x * 0.05);
  ctx.save();
  switch (kind) {
    case "clownfish": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.62, sway * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r * 1.7, y - r * 0.5);
      ctx.lineTo(x - r * 1.7, y + r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mixHex(color, "#ffffff", 0.85);
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(x + i * r * 0.5 - r * 0.07, y - r * 0.55, r * 0.14, r * 1.1);
      }
      ctx.fillStyle = mixHex(color, "#000000", 0.7);
      ctx.beginPath();
      ctx.arc(x + r * 0.62, y - r * 0.16, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "anemone": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI + (i / 10) * Math.PI;
        const wob = Math.sin(state.t * 1.8 + i) * 0.18;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a + wob) * r * 0.7, y + Math.sin(a + wob) * r * 0.7,
          x + Math.cos(a + wob * 2) * r * 1.3, y + Math.sin(a + wob * 2) * r * 1.3,
        );
      }
      ctx.stroke();
      sphere(ctx, x, y + r * 0.25, r * 0.5, mixHex(color, "#000000", 0.2));
      break;
    }
    case "bee": {
      sphere(ctx, x, y, r * 0.55, color, { rim: false });
      ctx.fillStyle = mixHex(color, "#000000", 0.65);
      for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * r * 0.28 - r * 0.06, y - r * 0.5, r * 0.12, r);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.2, y - r * 0.6 + sway * r * 0.15, r * 0.5, r * 0.22, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "flower": {
      ctx.strokeStyle = mixHex(color, "#000000", 0.35);
      ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(x, y + r * 2.2);
      ctx.quadraticCurveTo(x + sway * r * 0.2, y + r, x, y);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        sphere(ctx, x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68, r * 0.4, color, { rim: false });
      }
      sphere(ctx, x, y, r * 0.36, mixHex(color, "#ffffff", 0.6), { rim: false });
      break;
    }
    case "oxpecker":
    case "egret": {
      const long = kind === "egret" ? 1.35 : 1;
      sphere(ctx, x, y, r * 0.55, color, { rim: false });
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.2, y - r * 0.15);
      ctx.quadraticCurveTo(x - r * 1.5, y - r * 0.8, x - r * 1.3, y + r * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = mixHex(color, "#000000", 0.35);
      ctx.lineWidth = Math.max(1.6, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(x + r * 0.45, y - r * 0.2);
      ctx.lineTo(x + r * (0.5 + 0.7 * long), y - r * 0.1);
      ctx.stroke();
      break;
    }
    case "buffalo":
    case "cow": {
      sphere(ctx, x, y, r * 0.85, color);
      sphere(ctx, x - r * 0.95, y - r * 0.2, r * 0.45, color, { rim: false });
      ctx.strokeStyle = mixHex(color, "#ffffff", 0.4);
      ctx.lineWidth = Math.max(2.4, r * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 1.1, y - r * 0.55);
      ctx.quadraticCurveTo(x - r * 1.5, y - r * 0.9, x - r * 1.2, y - r * 1.05);
      ctx.moveTo(x - r * 0.72, y - r * 0.55);
      ctx.quadraticCurveTo(x - r * 0.35, y - r * 0.95, x - r * 0.6, y - r * 1.1);
      ctx.stroke();
      ctx.strokeStyle = mixHex(color, "#000000", 0.35);
      ctx.lineWidth = Math.max(2.4, r * 0.18);
      ctx.beginPath();
      for (let i = -1; i <= 1; i += 2) {
        ctx.moveTo(x + i * r * 0.45, y + r * 0.6);
        ctx.lineTo(x + i * r * 0.5, y + r * 1.35);
      }
      ctx.stroke();
      break;
    }
    case "whale": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.7, r * 0.62, sway * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + r * 1.5, y);
      ctx.lineTo(x + r * 2.4, y - r * 0.7);
      ctx.lineTo(x + r * 2.4, y + r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mixHex(color, "#000000", 0.4);
      ctx.beginPath();
      ctx.arc(x - r * 1.35, y - r * 0.12, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "barnacle": {
      ctx.fillStyle = color;
      for (let i = -1; i <= 1; i++) {
        const bx = x + i * r * 0.85;
        ctx.beginPath();
        ctx.moveTo(bx - r * 0.45, y + r * 0.4);
        ctx.lineTo(bx - r * 0.22, y - r * 0.4);
        ctx.lineTo(bx + r * 0.22, y - r * 0.4);
        ctx.lineTo(bx + r * 0.45, y + r * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "fungus": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.4, r * 0.1);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8,
          x + Math.cos(a + 0.4) * r * 1.6, y + Math.sin(a + 0.4) * r * 1.6,
        );
      }
      ctx.stroke();
      break;
    }
    case "pine": {
      ctx.fillStyle = mixHex(color, "#000000", 0.55);
      ctx.fillRect(x - r * 0.12, y, r * 0.24, r * 1.5);
      ctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        const w = r * (1.1 - i * 0.24);
        const yy = y - i * r * 0.55;
        ctx.beginPath();
        ctx.moveTo(x, yy - r * 0.9);
        ctx.lineTo(x - w, yy + r * 0.15);
        ctx.lineTo(x + w, yy + r * 0.15);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "mistletoe": {
      ctx.strokeStyle = mixHex(color, "#000000", 0.3);
      ctx.lineWidth = Math.max(1.6, r * 0.12);
      ctx.beginPath();
      for (let i = -1; i <= 1; i += 2) {
        ctx.moveTo(x, y + r * 0.6);
        ctx.lineTo(x + i * r * 0.6, y - r * 0.4);
      }
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = i * 1.257;
        sphere(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.55, r * 0.3, color, { rim: false });
      }
      break;
    }
    default: {
      // The tapeworm: a long ribbon of repeating segments.
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, r * 0.4);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 1.8, y);
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        ctx.lineTo(x - r * 1.8 + u * r * 3.6, y + Math.sin(u * 7 + state.t * 1.5) * r * 0.35);
      }
      ctx.stroke();
      sphere(ctx, x - r * 1.8, y, r * 0.32, mixHex(color, "#000000", 0.25), { rim: false });
      break;
    }
  }
  ctx.restore();
}

/** Two curves per species: with a partner and without. The gap is the answer. */
function drawPanel(
  rc: RenderContext<State>, x: number, y: number, w: number, h: number,
  name: string, together: number[], alone: number[], color: string, sign: Sign, pct: number,
) {
  const { ctx, state, theme, band } = rc;
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.restore();

  const n = state.histT.length;
  if (n >= 2) {
    let maxV = 1;
    for (let i = 0; i < n; i++) {
      if (together[i] > maxV) maxV = together[i];
      if (alone[i] > maxV) maxV = alone[i];
    }
    maxV *= 1.15;
    const t0 = state.histT[0];
    const t1 = Math.max(state.histT[n - 1], t0 + 1);
    const px = (i: number) => x + 4 + ((state.histT[i] - t0) / (t1 - t0)) * (w - 8);
    const py = (v: number) => y + h - 4 - (Math.min(v, maxV) / maxV) * (h - 20);

    ctx.save();
    ctx.lineJoin = "round";
    // The control, drawn dashed and quiet.
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i === 0) ctx.moveTo(px(i), py(alone[i]));
      else ctx.lineTo(px(i), py(alone[i]));
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i === 0) ctx.moveTo(px(i), py(together[i]));
      else ctx.lineTo(px(i), py(together[i]));
    }
    ctx.stroke();
    ctx.restore();
  }

  caption(ctx, x + 8, y + 12, name, theme, { size: 10, color });
  if (band !== "3-5") {
    caption(ctx, x + w - 8, y + 12,
      `${sign} ${sign === "0" ? "no change" : `${(pct * 100).toFixed(0)}%`}`,
      theme, { align: "right", size: 11, color: signColor(sign, theme) });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const pair = pairFor(params.pair as string);
  const stressed = params.condition === "stressed";
  const eA = effect(state.a, state.aAlone);
  const eB = effect(state.b, state.bAlone);
  const sA = signOf(eA);
  const sB = signOf(eB);

  const showGraphs = overlays.graphs !== false && height > 260;
  const graphH = showGraphs ? Math.round(Math.min(150, height * 0.36)) : 0;
  const sceneH = height - graphH - (showGraphs ? 8 : 0);
  const horizon = sceneH * 0.78;

  sky(ctx, width, sceneH, theme, pair.mood, horizon);
  groundPlane(ctx, horizon, 0, width, sceneH, theme, pair.ground);

  /* --- the two partners, at a size that tracks their numbers ------ */
  const colA = toneColor(pair.a.tone, theme);
  const colB = toneColor(pair.b.tone, theme);
  const base = Math.min(width, sceneH) * 0.1;
  const rB = base * (0.75 + 0.5 * Math.min(1.4, state.b / pair.b.K));
  const rA = base * 0.62 * (0.75 + 0.5 * Math.min(1.4, state.a / pair.a.K));

  const bx = width * 0.62;
  const by = horizon - rB * 0.9;
  const ax = width * 0.32;
  const ay = horizon - sceneH * 0.28;

  drawOrganism(rc, pair.b.kind, bx, by, rB, colB);
  // Small partners cluster; big ones stand alone.
  const copies = pair.a.K > 100 ? 5 : 3;
  for (let i = 0; i < copies; i++) {
    const a = i * 2.39996;
    drawOrganism(rc, pair.a.kind,
      ax + Math.cos(a) * base * 0.9, ay + Math.sin(a) * base * 0.55, rA, colA);
  }
  glow(ctx, ax, ay, base * 2, colA, 0.12);

  /* --- the signs, live -------------------------------------------- */
  if (band !== "3-5") {
    badge(ctx, ax, ay - base * 1.5, `${sA}`, theme, {
      align: "center", color: signColor(sA, theme), sub: pair.a.name,
    });
    badge(ctx, bx, by - rB * 1.5 - 12, `${sB}`, theme, {
      align: "center", color: signColor(sB, theme), sub: pair.b.name,
    });
  } else {
    caption(ctx, ax, ay - base * 1.4, `${pair.a.name} ${sA}`, theme, {
      align: "center", size: 14, color: signColor(sA, theme),
    });
    caption(ctx, bx, by - rB * 1.5, `${pair.b.name} ${sB}`, theme, {
      align: "center", size: 14, color: signColor(sB, theme),
    });
  }

  /* --- what this relationship is called --------------------------- */
  caption(ctx, 12, 20, relationshipName(sA, sB), theme, { size: 17 });
  caption(ctx, 12, 40, `${pair.title} · ${pair.ecosystem}`, theme, {
    size: 11, color: theme.inkSoft,
  });
  if (band !== "3-5" && width > 380) {
    caption(ctx, 12, 60, `${sA} / ${sB}`, theme, { size: 12, color: theme.ink });
  }

  if (stressed) {
    label(ctx, pair.stress, width - 12, 20, theme, {
      align: "right", size: 12, color: theme.sci["hot"],
    });
  }
  if (band !== "3-5" && sceneH > 200 && width > 380) {
    ctx.save();
    ctx.font = '600 10px "Bricolage Grotesque", system-ui, sans-serif';
    const words = pair.note.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width - 24 && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    let ly = sceneH - 12 - (lines.length - 1) * 13;
    for (const l of lines.slice(0, 3)) {
      caption(ctx, 12, ly, l, theme, { size: 10, color: theme.inkSoft });
      ly += 13;
    }
  }

  /* --- the population panels: the plus and minus, measured --------- */
  if (showGraphs) {
    const gy = sceneH + 8;
    const gw = (width - 18) / 2;
    drawPanel(rc, 6, gy, gw, graphH - 8, pair.a.name, state.histA, state.histAAlone, colA, sA, eA);
    drawPanel(rc, 12 + gw, gy, gw, graphH - 8, pair.b.name, state.histB, state.histBAlone, colB, sB, eB);
    caption(ctx, width / 2, height - 4, "solid = with partner · dashed = alone", theme, {
      align: "center", size: 9, color: theme.inkSoft,
    });
  }

  vignette(ctx, width, height, 0.15);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const symbiosisSim: SimManifest<State> = {
  id: "bio.symbiosis",
  title: "Living Together",
  tagline: "Run each partnership twice — with the partner and without — and read the plus or minus off the graph.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS2-2", "MS-LS2-4", "HS-LS2-8"] },
  learningGoals: [
    "Tell mutualism, commensalism and parasitism apart from their effects, not their names.",
    "Recognise the same pattern of interaction in completely different ecosystems.",
    "Explain why a relationship's sign can change when conditions change.",
    "Use a control run to measure what a partner is actually worth.",
  ],
  misconceptions: [
    "Parasites are trying to kill their hosts",
    "Every close relationship between two species helps them both",
    "A species is a mutualist or a parasite for ever",
    "Commensalism means the two organisms ignore each other completely",
  ],
  interactionHint: "Press play and watch the solid line pull away from the dashed one.",
  tickRate: 30,
  timeScale: 2,
  params: {
    pair: {
      type: "option", label: "Pair",
      options: PAIRS.map((p) => ({ value: p.key, label: p.title })),
      default: "clownfish",
      help: "Eight real partnerships, from a coral reef to the inside of a cow.",
    },
    condition: {
      type: "option", label: "Conditions",
      options: [
        { value: "normal", label: "Normal" },
        { value: "stressed", label: "Changed conditions" },
      ],
      default: "normal",
      help: "Some relationships change sign completely when conditions do.",
    },
    startFraction: {
      type: "number", label: "Starting numbers", kind: "ratio",
      min: 0.02, max: 1, step: 0.02, default: 0.12,
      bands: ["6-8", "9-12"],
      help: "As a fraction of what the habitat can hold.",
    },
    strength: {
      type: "number", label: "Strength of the relationship", kind: "ratio",
      min: 0, max: 2, step: 0.1, default: 1,
      bands: ["6-8", "9-12"],
      marks: [{ value: 0, label: "None" }, { value: 1, label: "Real" }, { value: 2, label: "Double" }],
      help: "Turn it to zero and both species live as if the other were not there.",
    },
  },
  overlays: [
    { key: "graphs", label: "Population graphs", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "three-signs",
      title: "Plus, zero or minus?",
      question: "How can you tell mutualism, commensalism and parasitism apart with numbers?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS2-2"],
      setup: { pair: "clownfish", condition: "normal", startFraction: 0.12, strength: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "A barnacle rides on a whale. Think about what each one gets.",
          predict: {
            prompt: "What happens to the whale's numbers because of the barnacles?",
            options: ["They go up", "They stay exactly the same", "They go down a lot"],
            correct: 1,
            reveal: "Exactly the same. That is what commensalism means — and here you can see it, because the two lines lie on top of one another.",
          },
        },
        {
          id: "mutual",
          phase: "measure",
          title: "Measure a mutualism",
          instruction: "Run the clownfish and anemone to about year 40. Record both effects.",
          check: { describe: "Run past year 30", test: (v) => (v.facts.years as number) > 30 },
          requireData: 2,
        },
        {
          id: "commensal",
          phase: "measure",
          title: "Now the barnacle and whale",
          instruction: "Switch pair and run again. Watch the whale's two lines.",
          check: {
            describe: "The whale shows no effect at all",
            test: (v) => v.params.pair === "barnacle" && v.facts.signB === "0",
          },
          requireData: 4,
          hints: ["The dashed line is the control: the same species with no partner."],
        },
        {
          id: "parasite",
          phase: "measure",
          title: "And a parasite",
          instruction: "Run the tapeworm and its host. Record both effects.",
          check: {
            describe: "The host is worse off with the parasite",
            test: (v) => v.params.pair === "tapeworm" && v.facts.signB === "−",
          },
          requireData: 6,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the test",
          instruction: "Give a rule someone could use on any pair of organisms.",
          write: {
            prompt: "How would you decide what kind of relationship two species have?",
            placeholder: "Compare each species with and without ... If both ... then it is ...",
          },
        },
      ],
    },
    {
      id: "shifting",
      title: "When a friend becomes a parasite",
      question: "Can the same two species be mutualists one year and enemies the next?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS2-2", "MS-LS2-4"],
      setup: { pair: "oxpecker", condition: "normal", startFraction: 0.12, strength: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Oxpeckers pick ticks off buffalo. Then the ticks disappear.",
          predict: {
            prompt: "With no ticks left, what does the oxpecker do to the buffalo?",
            options: [
              "Nothing — it flies away and finds ticks elsewhere",
              "It keeps helping, out of habit",
              "It feeds on the buffalo's open wounds instead",
            ],
            correct: 2,
            reveal: "It opens wounds and drinks blood. The bird has not changed; the conditions have, and that is enough to flip the sign.",
          },
        },
        {
          id: "normal",
          phase: "measure",
          title: "Measure the normal case",
          instruction: "Run to year 40 and record both effects.",
          check: { describe: "Run past year 30 with normal conditions", test: (v) => (v.facts.years as number) > 30 && v.params.condition === "normal" },
          requireData: 2,
        },
        {
          id: "flip",
          phase: "measure",
          title: "Take the ticks away",
          instruction: "Switch Conditions to Changed and record what the buffalo does.",
          check: {
            describe: "The buffalo is now worse off",
            test: (v) => v.params.condition === "stressed" && v.facts.signB === "−",
          },
          requireData: 4,
          hints: ["The name at the top left changes as soon as the sign does."],
        },
        {
          id: "second",
          phase: "measure",
          title: "Find another that flips",
          instruction: "Try the fungus and pine, and the barnacle and whale.",
          requireData: 6,
          hints: ["Fertilising soil makes the fungus a cost the tree no longer needs to pay."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what a label really is",
          instruction: "Explain why 'parasite' describes a situation, not a species.",
          write: {
            prompt: "Why is it wrong to say an oxpecker simply is a mutualist?",
            placeholder: "The sign depends on ... rather than on ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-commensal",
      title: "Find the true zero",
      brief: "Show a partnership where one species is measurably unaffected.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { pair: "clownfish", condition: "normal", startFraction: 0.12, strength: 1 },
      goal: {
        describe: "One partner clearly helped, the other with no effect",
        test: (v) =>
          (v.facts.years as number) > 20 &&
          ((v.facts.signA === "+" && v.facts.signB === "0") ||
            (v.facts.signA === "0" && v.facts.signB === "+")),
      },
      stars: {
        two: {
          describe: "Both commensal pairs found and settled",
          test: (v) =>
            (v.facts.years as number) > 40 && v.facts.relationship === "Commensalism",
        },
        three: {
          describe: "A commensal pair pushed into parasitism by changing conditions",
          test: (v) =>
            (v.facts.years as number) > 40 && v.params.condition === "stressed" &&
            v.facts.signB === "−" && v.params.pair === "barnacle",
        },
      },
      hints: [
        "You are looking for two lines that lie exactly on top of each other.",
        "A grey whale does not notice a barnacle. A whole hull of them is different.",
      ],
    },
    {
      id: "make-it-matter",
      title: "The partner worth most",
      brief: "Find the species that gains most from having a partner.",
      bands: ["6-8", "9-12"],
      setup: { pair: "clownfish", condition: "normal", startFraction: 0.12, strength: 1 },
      goal: {
        describe: "A partner worth more than five times its numbers alone",
        test: (v) => (v.facts.years as number) > 25 && (v.facts.effectA as number) > 5,
      },
      stars: {
        two: {
          describe: "Worth more than ten times",
          test: (v) => (v.facts.years as number) > 25 && (v.facts.effectA as number) > 10,
        },
        three: {
          describe: "Worth more than thirty times",
          test: (v) => (v.facts.years as number) > 25 && (v.facts.effectA as number) > 30,
        },
      },
      hints: [
        "Look for the species that can barely exist on its own.",
        "A parasite with no host is not a parasite at all.",
      ],
    },
  ],
};
