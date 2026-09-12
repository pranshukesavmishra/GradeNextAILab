import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { label, mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, groundPlane, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Build a Food Web — Grades 5-10.
 *
 * Thirteen organisms in a meadow, and no arrows until the student draws them.
 * Every link has to be a feeding relationship that really exists, so a wrong
 * guess is refused with a reason rather than quietly accepted.
 *
 * The energy pyramid is not a picture bolted on the side: it is computed from
 * the web the student built. Ten per cent of the energy at one level reaches
 * the next, so 10 000 kcal/m²/yr of plants becomes 1 000, then 100 — and the
 * top of the web gets less than that, because a fox nothing eats is a dead end
 * whose energy goes to the decomposers instead. That shortfall is real ecology
 * and the sim shows it rather than rounding it away.
 *
 * Grade 7 Unit D, topics D2 (food webs, trophic levels, energy pyramids) and
 * D3.2 (decomposers closing the loop).
 */

/* ------------------------------------------------------------------ *
 * The organisms
 * ------------------------------------------------------------------ */

export type Role = "producer" | "consumer" | "decomposer";

export interface Species {
  id: string;
  name: string;
  role: Role;
  /** Trophic level: 1 producer, 2 herbivore, 3 carnivore, 4 top carnivore. */
  level: number;
  /** Everything this organism really eats. */
  eats: string[];
  /** Layout: horizontal slot within its level, 0..1. */
  slot: number;
  /** Annual energy a single individual needs, kcal — used for "how many fit". */
  kcalPerYear: number;
}

/**
 * A temperate meadow with an oak at its edge. Every feeding link below is a
 * real one, and each consumer eats only from the level immediately beneath it,
 * which is what lets the pyramid be read cleanly.
 */
export const SPECIES: Species[] = [
  { id: "grass", name: "Grass", role: "producer", level: 1, eats: [], slot: 0.28, kcalPerYear: 0 },
  { id: "oak", name: "Oak tree", role: "producer", level: 1, eats: [], slot: 0.74, kcalPerYear: 0 },

  { id: "grasshopper", name: "Grasshopper", role: "consumer", level: 2, eats: ["grass"], slot: 0.13, kcalPerYear: 3 },
  { id: "rabbit", name: "Rabbit", role: "consumer", level: 2, eats: ["grass"], slot: 0.38, kcalPerYear: 110000 },
  { id: "mouse", name: "Field mouse", role: "consumer", level: 2, eats: ["grass", "oak"], slot: 0.62, kcalPerYear: 6000 },
  { id: "caterpillar", name: "Caterpillar", role: "consumer", level: 2, eats: ["oak"], slot: 0.87, kcalPerYear: 2 },

  { id: "frog", name: "Frog", role: "consumer", level: 3, eats: ["grasshopper"], slot: 0.13, kcalPerYear: 1800 },
  { id: "bluetit", name: "Blue tit", role: "consumer", level: 3, eats: ["caterpillar", "grasshopper"], slot: 0.38, kcalPerYear: 5500 },
  { id: "snake", name: "Grass snake", role: "consumer", level: 3, eats: ["mouse"], slot: 0.62, kcalPerYear: 4000 },
  { id: "fox", name: "Fox", role: "consumer", level: 3, eats: ["rabbit", "mouse"], slot: 0.87, kcalPerYear: 250000 },

  { id: "hawk", name: "Hawk", role: "consumer", level: 4, eats: ["snake", "bluetit", "frog"], slot: 0.5, kcalPerYear: 91000 },

  { id: "fungi", name: "Fungi", role: "decomposer", level: 0, eats: [], slot: 0.25, kcalPerYear: 0 },
  { id: "worms", name: "Earthworms", role: "decomposer", level: 0, eats: [], slot: 0.72, kcalPerYear: 0 },
];

export const INDEX: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  SPECIES.forEach((s, i) => { out[s.id] = i; });
  return out;
})();

/** Every feeding link that really exists, as [preyIndex, predatorIndex]. */
export const TRUE_LINKS: [number, number][] = (() => {
  const out: [number, number][] = [];
  SPECIES.forEach((s, i) => {
    for (const preyId of s.eats) out.push([INDEX[preyId], i]);
  });
  return out;
})();

/** A single chain through the web, for the "chains are not webs" contrast. */
const CHAIN_LINKS: [number, number][] = [
  [INDEX.grass, INDEX.grasshopper],
  [INDEX.grasshopper, INDEX.frog],
  [INDEX.frog, INDEX.hawk],
];

/* ------------------------------------------------------------------ *
 * Energy accounting
 * ------------------------------------------------------------------ */

/**
 * Of the energy that is not passed to the next level, most is respired away as
 * heat and the rest becomes dead matter for the decomposers. Odum's Silver
 * Springs study put producer respiration near 58% of gross production, so 65%
 * respired across the board is a defensible round figure.
 */
export const RESPIRED_SHARE = 0.65;
/** Without decomposers, nutrients stay locked in dead matter and production falls. */
const NO_DECOMPOSER_FACTOR = 0.35;

export interface WebSolution {
  /** Energy arriving at each species, kcal/m²/yr, before its own population scales it. */
  flow: number[];
  /** Energy standing at each level, kcal/m²/yr. */
  levelEnergy: number[];
  /** Dead matter reaching the decomposers, kcal/m²/yr. */
  detritus: number;
  /** Energy lost as heat through respiration, kcal/m²/yr. */
  respired: number;
  /** Predation pressure on each species. */
  predation: number[];
}

/**
 * Solve the whole web in one upward pass. Because every consumer eats only
 * from the level below, one pass in level order is exact.
 */
export function solveWeb(
  links: [number, number][], alive: boolean[], pop: number[],
  sunEnergy: number, efficiency: number,
): WebSolution {
  const n = SPECIES.length;
  const flow = new Array<number>(n).fill(0);

  const decomposersAlive = SPECIES.filter((s, i) => s.role === "decomposer" && alive[i]).length;
  const decomposerHealth = decomposersAlive / SPECIES.filter((s) => s.role === "decomposer").length;
  const nutrient = NO_DECOMPOSER_FACTOR + (1 - NO_DECOMPOSER_FACTOR) * decomposerHealth;

  // Heavy grazing knocks the plants back — the bottom of a trophic cascade.
  let herbLoad = 0;
  let herbCount = 0;
  for (let i = 0; i < n; i++) {
    if (SPECIES[i].level === 2 && alive[i]) { herbLoad += pop[i]; herbCount++; }
  }
  const meanHerb = herbCount > 0 ? herbLoad / herbCount : 1;
  const grazing = 1 / (1 + 0.6 * Math.max(0, meanHerb - 1));

  const producers = SPECIES.filter((s, i) => s.role === "producer" && alive[i]).length;
  for (let i = 0; i < n; i++) {
    if (SPECIES[i].role === "producer" && alive[i]) {
      flow[i] = (sunEnergy / Math.max(1, producers)) * nutrient * grazing;
    }
  }

  // How many living, linked predators share each prey.
  const sharers = new Array<number>(n).fill(0);
  for (const [prey, pred] of links) {
    if (alive[prey] && alive[pred]) sharers[prey]++;
  }

  for (let level = 2; level <= 4; level++) {
    for (const [prey, pred] of links) {
      if (SPECIES[pred].level !== level) continue;
      if (!alive[prey] || !alive[pred]) continue;
      const available = flow[prey] * Math.max(0, pop[prey]);
      flow[pred] += (available * efficiency) / Math.max(1, sharers[prey]);
    }
  }

  const levelEnergy = [0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const lv = SPECIES[i].level;
    if (lv >= 1 && lv <= 4 && alive[i]) levelEnergy[lv] += flow[i] * Math.max(0, pop[i]);
  }

  // Whatever a level does not pass upward is respired or becomes dead matter.
  let notPassed = 0;
  for (let lv = 1; lv <= 4; lv++) notPassed += levelEnergy[lv] - (levelEnergy[lv + 1] ?? 0);
  const detritus = notPassed * (1 - RESPIRED_SHARE);
  const respired = notPassed * RESPIRED_SHARE;

  const predation = new Array<number>(n).fill(0);
  for (const [prey, pred] of links) {
    if (alive[prey] && alive[pred]) predation[prey] += Math.max(0, pop[pred]);
  }

  return { flow, levelEnergy, detritus, respired, predation };
}

/** Odum's 1957 measurements at Silver Springs, Florida, in kcal/m²/yr. */
export const SILVER_SPRINGS = {
  producers: 20810,
  herbivores: 3368,
  carnivores: 383,
  topCarnivores: 21,
};

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  t: number;
  links: [number, number][];
  alive: boolean[];
  /** Population relative to an untouched web, where 1 is normal. */
  pop: number[];
  /** Energy each species receives when the whole web is intact. */
  need: number[];
  basePredation: number[];
  message: string;
  goodLinks: number;
  badLinks: number;
  minPop: number;
  collapsed: number;
}

/** Populations chase their supported level with a couple of years of lag. */
const POP_TAU = 2.5;

function presetLinks(preset: string): [number, number][] {
  if (preset === "empty") return [];
  if (preset === "chain") return CHAIN_LINKS.map((l) => [l[0], l[1]] as [number, number]);
  return TRUE_LINKS.map((l) => [l[0], l[1]] as [number, number]);
}

function aliveFrom(remove: string): boolean[] {
  return SPECIES.map((s) => s.id !== remove);
}

function buildState(params: ParamValues): State {
  const n = SPECIES.length;
  const links = presetLinks(params.preset as string);
  const alive = aliveFrom(params.remove as string);
  const ones = new Array<number>(n).fill(1);

  // The baseline is always the complete web, so "normal" means the same thing
  // however much the student has knocked out.
  const base = solveWeb(TRUE_LINKS, SPECIES.map(() => true), ones,
    params.sunEnergy as number, params.efficiency as number);

  return {
    t: 0,
    links,
    alive,
    pop: SPECIES.map((_, i) => (alive[i] ? 1 : 0)),
    need: base.flow.slice(),
    basePredation: base.predation.slice(),
    message: "",
    goodLinks: 0,
    badLinks: 0,
    minPop: 1,
    collapsed: 0,
  };
}

const model: SimModel<State> = {
  init(params) {
    return buildState(params);
  },

  applyParams(state, params, prev) {
    let s = state;
    if (params.preset !== prev.preset) {
      s = { ...s, links: presetLinks(params.preset as string), message: "" };
    }
    if (params.remove !== prev.remove) {
      const alive = aliveFrom(params.remove as string);
      s = {
        ...s, alive,
        pop: s.pop.map((p, i) => (alive[i] ? p : 0)),
        message: params.remove === "none"
          ? ""
          : `${SPECIES[INDEX[params.remove as string]].name} removed — watch what follows.`,
        minPop: 1, collapsed: 0,
      };
    }
    if (params.sunEnergy !== prev.sunEnergy || params.efficiency !== prev.efficiency) {
      const ones = new Array<number>(SPECIES.length).fill(1);
      const base = solveWeb(TRUE_LINKS, SPECIES.map(() => true), ones,
        params.sunEnergy as number, params.efficiency as number);
      s = { ...s, need: base.flow.slice(), basePredation: base.predation.slice() };
    }
    return s;
  },

  step(state, dt, params, ctx, inputs) {
    let s = state;

    /* --- the student wiring the web -------------------------------- */
    for (const input of inputs) {
      if (input.type !== "pointerdown") continue;
      const preyId = params.prey as string;
      const predId = params.predator as string;
      const prey = INDEX[preyId];
      const pred = INDEX[predId];
      if (prey === undefined || pred === undefined) continue;
      const preySpec = SPECIES[prey];
      const predSpec = SPECIES[pred];

      if (prey === pred) {
        s = { ...s, message: "Nothing in this meadow eats itself." };
      } else if (s.links.some((l) => l[0] === prey && l[1] === pred)) {
        s = { ...s, message: `You already drew ${predSpec.name} eats ${preySpec.name}.` };
      } else if (predSpec.role === "decomposer") {
        s = {
          ...s, badLinks: s.badLinks + 1,
          message: "Decomposers do not hunt. They break down whatever has already died — every level feeds them.",
        };
      } else if (predSpec.eats.includes(preyId)) {
        s = {
          ...s,
          links: [...s.links, [prey, pred] as [number, number]],
          goodLinks: s.goodLinks + 1,
          message: `${predSpec.name} eats ${preySpec.name}. Arrow drawn.`,
        };
      } else {
        const why = preySpec.level >= predSpec.level
          ? `${preySpec.name} is not below ${predSpec.name} in this web.`
          : `${predSpec.name} does not eat ${preySpec.name}.`;
        s = { ...s, badLinks: s.badLinks + 1, message: why };
      }
    }

    if (dt <= 0) return s;
    void ctx;

    /* --- populations follow the energy ----------------------------- */
    const sun = params.sunEnergy as number;
    const eff = params.efficiency as number;
    const web = solveWeb(s.links, s.alive, s.pop, sun, eff);
    const k = 1 - Math.exp(-dt / POP_TAU);

    const pop = s.pop.slice();
    let minPop = 1;
    let collapsed = 0;
    for (let i = 0; i < SPECIES.length; i++) {
      if (!s.alive[i]) { pop[i] = 0; continue; }
      if (SPECIES[i].role === "decomposer") { pop[i] = 1; continue; }
      const supported = s.need[i] > 0 ? web.flow[i] / s.need[i] : 1;
      // Losing your predators is a release, and the prey overshoot before the
      // plants below them are grazed back down. That is a trophic cascade.
      const relief = (s.basePredation[i] + 0.5) / (web.predation[i] + 0.5);
      const target = Math.max(0, Math.min(3, supported * Math.min(2.4, relief)));
      pop[i] = pop[i] + (target - pop[i]) * k;
      if (pop[i] < minPop) minPop = pop[i];
      if (pop[i] < 0.4) collapsed++;
    }

    return {
      ...s,
      t: s.t + dt,
      pop,
      minPop: Math.min(s.minPop, minPop),
      collapsed,
    };
  },

  readouts(state, params) {
    const web = solveWeb(state.links, state.alive, state.pop,
      params.sunEnergy as number, params.efficiency as number);
    const e = web.levelEnergy;
    return [
      {
        key: "producers", label: "Producers (kcal/m²/yr)", quantity: q(e[1], "count"),
        semantic: "producer", graphable: true,
      },
      {
        key: "herbivores", label: "Plant eaters (kcal/m²/yr)", quantity: q(e[2], "count"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "carnivores", label: "Meat eaters (kcal/m²/yr)", quantity: q(e[3], "count"),
        semantic: "secondary-consumer", graphable: true,
      },
      {
        key: "topCarnivores", label: "Top predator (kcal/m²/yr)", quantity: q(e[4], "count"),
        semantic: "secondary-consumer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "transfer", label: "Energy passed on", quantity: q(params.efficiency as number, "percent"),
        unit: "%", semantic: "energy-total", graphable: false,
      },
      {
        key: "detritus", label: "To the decomposers (kcal/m²/yr)",
        quantity: q(web.detritus, "count"), semantic: "decomposer", graphable: true,
        bands: ["6-8", "9-12"],
      },
      {
        key: "links", label: "Feeding links drawn", quantity: q(state.links.length, "count"),
        semantic: "mass", graphable: false,
      },
      {
        key: "collapsed", label: "Species in trouble", quantity: q(state.collapsed, "count"),
        semantic: "hot", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const sun = params.sunEnergy as number;
    const eff = params.efficiency as number;
    const web = solveWeb(state.links, state.alive, state.pop, sun, eff);
    const full = solveWeb(TRUE_LINKS, SPECIES.map(() => true),
      new Array<number>(SPECIES.length).fill(1), sun, eff);
    const e = web.levelEnergy;
    const f = full.levelEnergy;
    const out: Record<string, number | boolean | string> = {
      links: state.links.length,
      trueLinks: TRUE_LINKS.length,
      complete: state.links.length === TRUE_LINKS.length,
      goodLinks: state.goodLinks,
      badLinks: state.badLinks,
      removed: params.remove as string,
      message: state.message,
      efficiency: eff,
      sunEnergy: sun,
      level1: e[1], level2: e[2], level3: e[3], level4: e[4],
      fullLevel1: f[1], fullLevel2: f[2], fullLevel3: f[3], fullLevel4: f[4],
      transfer12: f[1] > 0 ? f[2] / f[1] : 0,
      transfer23: f[2] > 0 ? f[3] / f[2] : 0,
      transfer34: f[3] > 0 ? f[4] / f[3] : 0,
      detritus: web.detritus,
      respired: web.respired,
      fullDetritus: full.detritus,
      fullRespired: full.respired,
      energyAccounted: full.detritus + full.respired + f[4],
      collapsed: state.collapsed,
      minPop: state.minPop,
      elapsed: state.t,
    };
    for (let i = 0; i < SPECIES.length; i++) out[`pop_${SPECIES[i].id}`] = state.pop[i];
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function speciesColor(s: Species, theme: RenderContext<State>["theme"]): string {
  if (s.role === "decomposer") return theme.sci["decomposer"];
  if (s.level === 1) return theme.sci["producer"];
  if (s.level === 2) return theme.sci["primary-consumer"];
  return theme.sci["secondary-consumer"];
}

interface Layout { x: number; y: number; r: number }

function layout(rc: RenderContext<State>, webW: number, webH: number): Layout[] {
  const out: Layout[] = [];
  const top = webH * 0.1;
  const groundY = webH * 0.8;
  for (let i = 0; i < SPECIES.length; i++) {
    const s = SPECIES[i];
    const pop = rc.state.pop[i];
    if (s.role === "decomposer") {
      out.push({ x: webW * (0.18 + s.slot * 0.6), y: webH * 0.92, r: 11 });
      continue;
    }
    // Level sets the height: producers on the ground, the hawk in the sky.
    const y = groundY - ((s.level - 1) / 3) * (groundY - top);
    out.push({
      x: webW * (0.09 + s.slot * 0.82),
      y,
      r: 10 + 9 * Math.min(1.4, Math.max(0.15, pop)),
    });
  }
  return out;
}

/** One organism, drawn as itself rather than as a labelled dot. */
function drawCreature(
  rc: RenderContext<State>, id: string, x: number, y: number, r: number,
  color: string, faded: boolean,
) {
  const { ctx } = rc;
  ctx.save();
  if (faded) ctx.globalAlpha = 0.28;
  switch (id) {
    case "grass": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.6, r * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = -3; i <= 3; i++) {
        ctx.moveTo(x + i * r * 0.24, y + r);
        ctx.quadraticCurveTo(x + i * r * 0.32, y, x + i * r * 0.5 + r * 0.2, y - r * 0.9);
      }
      ctx.stroke();
      break;
    }
    case "oak": {
      ctx.strokeStyle = mixHex(color, "#000000", 0.5);
      ctx.lineWidth = Math.max(2, r * 0.24);
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x, y - r * 0.2);
      ctx.stroke();
      sphere(ctx, x, y - r * 0.6, r * 0.95, color);
      sphere(ctx, x - r * 0.6, y - r * 0.2, r * 0.6, color);
      sphere(ctx, x + r * 0.6, y - r * 0.25, r * 0.55, color);
      break;
    }
    case "grasshopper":
    case "caterpillar": {
      sphere(ctx, x, y, r * 0.6, color, { rim: false });
      ctx.strokeStyle = mixHex(color, "#000000", 0.4);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(x - r * 0.4 + i * r * 0.4, y + r * 0.3);
        ctx.lineTo(x - r * 0.6 + i * r * 0.4, y + r * 0.9);
      }
      ctx.stroke();
      sphere(ctx, x + r * 0.55, y - r * 0.15, r * 0.35, color, { rim: false });
      break;
    }
    case "rabbit": {
      sphere(ctx, x, y, r * 0.78, color);
      sphere(ctx, x + r * 0.7, y - r * 0.35, r * 0.42, color, { rim: false });
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + r * 0.7, y - r * 0.65);
      ctx.lineTo(x + r * 0.55, y - r * 1.35);
      ctx.moveTo(x + r * 0.85, y - r * 0.65);
      ctx.lineTo(x + r * 0.95, y - r * 1.3);
      ctx.stroke();
      break;
    }
    case "mouse": {
      sphere(ctx, x, y, r * 0.66, color);
      sphere(ctx, x - r * 0.6, y - r * 0.2, r * 0.36, color, { rim: false });
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.2, r * 0.1);
      ctx.beginPath();
      ctx.moveTo(x + r * 0.6, y + r * 0.1);
      ctx.quadraticCurveTo(x + r * 1.4, y + r * 0.3, x + r * 1.2, y - r * 0.5);
      ctx.stroke();
      break;
    }
    case "frog": {
      sphere(ctx, x, y, r * 0.8, color);
      sphere(ctx, x - r * 0.35, y - r * 0.55, r * 0.24, mixHex(color, "#ffffff", 0.6), { rim: false });
      sphere(ctx, x + r * 0.35, y - r * 0.55, r * 0.24, mixHex(color, "#ffffff", 0.6), { rim: false });
      break;
    }
    case "bluetit":
    case "hawk": {
      const scale = id === "hawk" ? 1.15 : 0.9;
      sphere(ctx, x, y, r * 0.66 * scale, color);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.2);
      ctx.quadraticCurveTo(x - r * 1.6 * scale, y - r * 0.9, x - r * 1.5 * scale, y + r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.3, y - r * 0.2);
      ctx.quadraticCurveTo(x + r * 1.6 * scale, y - r * 0.9, x + r * 1.5 * scale, y + r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mixHex(color, "#000000", 0.4);
      ctx.beginPath();
      ctx.moveTo(x + r * 0.6 * scale, y - r * 0.35);
      ctx.lineTo(x + r * 1.05 * scale, y - r * 0.2);
      ctx.lineTo(x + r * 0.6 * scale, y - r * 0.05);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "snake": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.6, r * 0.34);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 1.2, y + r * 0.3);
      ctx.bezierCurveTo(x - r * 0.3, y - r * 0.9, x + r * 0.3, y + r * 0.9, x + r * 1.2, y - r * 0.3);
      ctx.stroke();
      sphere(ctx, x + r * 1.2, y - r * 0.3, r * 0.3, color, { rim: false });
      break;
    }
    case "fox": {
      sphere(ctx, x, y, r * 0.72, color);
      sphere(ctx, x + r * 0.75, y - r * 0.25, r * 0.4, color, { rim: false });
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.55, y - r * 0.55);
      ctx.lineTo(x + r * 0.72, y - r * 1.15);
      ctx.lineTo(x + r * 0.92, y - r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.4, r * 0.3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y + r * 0.1);
      ctx.quadraticCurveTo(x - r * 1.5, y - r * 0.2, x - r * 1.3, y - r * 0.8);
      ctx.stroke();
      break;
    }
    case "fungi": {
      ctx.fillStyle = color;
      for (let i = -1; i <= 1; i++) {
        const fx = x + i * r * 0.85;
        ctx.beginPath();
        ctx.ellipse(fx, y - r * 0.2, r * 0.42, r * 0.28, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(fx - r * 0.1, y - r * 0.2, r * 0.2, r * 0.5);
      }
      break;
    }
    default: {
      // Earthworms and anything unnamed.
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.4, r * 0.3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.7, x + r * 0.2, y);
      ctx.quadraticCurveTo(x + r * 0.7, y + r * 0.7, x + r * 1.2, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWeb(rc: RenderContext<State>, webW: number, webH: number) {
  const { ctx, state, params, theme, band } = rc;
  const pos = layout(rc, webW, webH);
  const groundY = webH * 0.86;

  sky(ctx, webW, webH, theme, "day", groundY);
  groundPlane(ctx, groundY, 0, webW, webH, theme, "grass");

  /* --- feeding arrows --------------------------------------------- */
  ctx.save();
  ctx.lineCap = "round";
  for (const [prey, pred] of state.links) {
    const a = pos[prey];
    const b = pos[pred];
    const gone = !state.alive[prey] || !state.alive[pred];
    const strength = Math.min(1, Math.max(0.08, (state.pop[prey] + state.pop[pred]) / 2));
    ctx.strokeStyle = hexA(theme.sci["energy-total"], gone ? 0.1 : 0.2 + 0.45 * strength);
    ctx.lineWidth = gone ? 1 : 1.2 + 2.4 * strength;
    // Curved so parallel links stay separable.
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.09;
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.09;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.stroke();

    if (!gone) {
      // An arrowhead pointing at the eater: energy flows that way.
      const dx = b.x - mx;
      const dy = b.y - my;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const hx = b.x - ux * (b.r + 3);
      const hy = b.y - uy * (b.r + 3);
      ctx.fillStyle = hexA(theme.sci["energy-total"], 0.75);
      ctx.beginPath();
      ctx.moveTo(hx + ux * 7, hy + uy * 7);
      ctx.lineTo(hx - uy * 4, hy + ux * 4);
      ctx.lineTo(hx + uy * 4, hy - ux * 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  /* --- the organisms ------------------------------------------------ */
  for (let i = 0; i < SPECIES.length; i++) {
    const s = SPECIES[i];
    const p = pos[i];
    const dead = !state.alive[i];
    const struggling = state.alive[i] && state.pop[i] < 0.4;
    drawCreature(rc, s.id, p.x, p.y, p.r, speciesColor(s, theme), dead);

    if (dead) {
      ctx.save();
      ctx.strokeStyle = theme.sci["hot"];
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(p.x - p.r, p.y - p.r);
      ctx.lineTo(p.x + p.r, p.y + p.r);
      ctx.moveTo(p.x + p.r, p.y - p.r);
      ctx.lineTo(p.x - p.r, p.y + p.r);
      ctx.stroke();
      ctx.restore();
    }
    if (band !== "3-5" || s.role !== "decomposer") {
      caption(ctx, p.x, p.y + p.r + 11, s.name, theme, {
        align: "center", size: 10,
        color: dead ? theme.sci["hot"] : struggling ? theme.sci["hot"] : theme.ink,
      });
    }
    if (struggling && band !== "3-5") {
      caption(ctx, p.x, p.y - p.r - 9, `${Math.round(state.pop[i] * 100)}%`, theme, {
        align: "center", size: 9, color: theme.sci["hot"],
      });
    } else if (state.alive[i] && state.pop[i] > 1.35 && band !== "3-5") {
      caption(ctx, p.x, p.y - p.r - 9, `${Math.round(state.pop[i] * 100)}%`, theme, {
        align: "center", size: 9, color: theme.sci["primary-consumer"],
      });
    }
  }

  /* --- level bands so trophic level is readable at a glance --------- */
  if (band !== "3-5") {
    const names = ["Producers", "Plant eaters", "Meat eaters", "Top predator"];
    const top = webH * 0.1;
    for (let lv = 1; lv <= 4; lv++) {
      const y = webH * 0.8 - ((lv - 1) / 3) * (webH * 0.8 - top);
      caption(ctx, 6, y - 22, names[lv - 1], theme, { size: 9, color: theme.inkSoft });
    }
  }

  if (state.message) {
    label(ctx, state.message, webW / 2, 16, theme, {
      align: "center", size: 11, color: theme.accent,
    });
  }
  void params;
}

/** The energy pyramid, computed from the web rather than drawn from memory. */
function drawPyramid(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme, band } = rc;
  const web = solveWeb(state.links, state.alive, state.pop,
    params.sunEnergy as number, params.efficiency as number);
  const real = params.pyramidData === "silverSprings";
  const e = real
    ? [0, SILVER_SPRINGS.producers, SILVER_SPRINGS.herbivores, SILVER_SPRINGS.carnivores, SILVER_SPRINGS.topCarnivores]
    : web.levelEnergy;

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.restore();

  caption(ctx, x + 10, y + 16, real ? "Silver Springs, Florida" : "Energy pyramid", theme, { size: 12 });
  caption(ctx, x + 10, y + 31, real ? "measured by H.T. Odum, 1957" : "kcal per square metre per year", theme, {
    size: 9, color: theme.inkSoft,
  });

  const colors = [
    theme.sci["producer"], theme.sci["primary-consumer"],
    theme.sci["secondary-consumer"], theme.sci["secondary-consumer"],
  ];
  const top = y + 44;
  const bandH = Math.max(18, (h - 96) / 4);
  const maxE = Math.max(1, e[1]);

  for (let lv = 4; lv >= 1; lv--) {
    const row = 4 - lv;
    const by = top + row * (bandH + 6);
    // Width is a log measure: a linear pyramid would make level 4 invisible.
    const frac = e[lv] > 0 ? Math.max(0.06, Math.log10(1 + e[lv]) / Math.log10(1 + maxE)) : 0.03;
    const bw = (w - 24) * frac;
    const bx = x + 12 + ((w - 24) - bw) / 2;
    ctx.save();
    ctx.globalAlpha = lv === 4 ? 1 : 0.92;
    const g = ctx.createLinearGradient(0, by, 0, by + bandH);
    g.addColorStop(0, mixHex(colors[lv - 1], "#ffffff", 0.35));
    g.addColorStop(1, mixHex(colors[lv - 1], "#000000", 0.2));
    ctx.fillStyle = g;
    roundRect(ctx, bx, by, Math.max(6, bw), bandH, 4);
    ctx.fill();
    ctx.restore();
    caption(ctx, x + w - 12, by + bandH / 2, `${e[lv] >= 100 ? Math.round(e[lv]) : e[lv].toFixed(1)}`, theme, {
      align: "right", size: 11, color: theme.ink,
    });

    // The transfer between this level and the one below it — the 10% rule.
    if (lv >= 2 && band !== "3-5") {
      const below = e[lv - 1];
      const pct = below > 0 ? (e[lv] / below) * 100 : 0;
      caption(ctx, x + 12, by + bandH + 3, `${pct.toFixed(1)}% gets through`, theme, {
        size: 9, color: theme.sci["energy-total"],
      });
    }
  }

  const footY = top + 4 * (bandH + 6) + 12;
  if (footY < y + h - 26 && band !== "3-5") {
    caption(ctx, x + 10, footY, "Where the rest goes", theme, { size: 10, color: theme.inkSoft });
    caption(ctx, x + 10, footY + 16,
      `${Math.round(web.respired)} lost as heat`, theme,
      { size: 10, color: theme.sci["energy-thermal"] });
    caption(ctx, x + 10, footY + 31,
      `${Math.round(web.detritus)} to the decomposers`, theme,
      { size: 10, color: theme.sci["decomposer"] });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const showPyramid = overlays.pyramid !== false && width > 460;
  const pyW = showPyramid ? Math.min(230, width * 0.34) : 0;
  const webW = width - pyW;

  drawWeb(rc, webW, height);
  if (showPyramid) drawPyramid(rc, webW + 6, 8, pyW - 12, height - 16);

  /* --- what the removal did ---------------------------------------- */
  const removed = params.remove as string;
  if (removed !== "none" && band !== "3-5") {
    const boomed: string[] = [];
    const crashed: string[] = [];
    for (let i = 0; i < SPECIES.length; i++) {
      if (!state.alive[i] || SPECIES[i].role === "decomposer") continue;
      if (state.pop[i] > 1.3) boomed.push(SPECIES[i].name);
      if (state.pop[i] < 0.55) crashed.push(SPECIES[i].name);
    }
    const parts: string[] = [];
    if (crashed.length) parts.push(`down: ${crashed.slice(0, 3).join(", ")}`);
    if (boomed.length) parts.push(`up: ${boomed.slice(0, 3).join(", ")}`);
    if (parts.length) {
      label(ctx, parts.join("   ·   "), 8, height - 12, theme, {
        size: 11, color: theme.sci["hot"],
      });
    }
  }

  if (band !== "3-5") {
    badge(ctx, webW - 10, height - 24, `${state.links.length}/${TRUE_LINKS.length}`, theme, {
      align: "right", color: theme.accent, sub: "links drawn",
    });
  }
  if (isDarkTheme(theme)) vignette(ctx, width, height, 0.12);
  else vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const SPECIES_OPTIONS = SPECIES.map((s) => ({ value: s.id, label: s.name }));

export const foodWebSim: SimManifest<State> = {
  id: "bio.food-web",
  title: "Build a Food Web",
  tagline: "Wire the meadow together, then take one species out and watch the whole web answer.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS2-3", "MS-LS2-4", "HS-LS2-4"] },
  learningGoals: [
    "Sort organisms into producers, consumers and decomposers.",
    "Draw a food web and explain why it is not just a chain.",
    "Use the ten per cent rule to say how much energy reaches each level.",
    "Predict the knock-on effects of removing one species.",
  ],
  misconceptions: [
    "Energy is recycled around a food web the way matter is",
    "Removing a predator is good for everything below it",
    "A food chain and a food web are the same thing",
    "Decomposers are just another kind of predator",
  ],
  interactionHint: "Pick an eater and something it eats, then click the stage to draw the arrow.",
  tickRate: 30,
  timeScale: 2,
  params: {
    preset: {
      type: "option", label: "Starting web",
      options: [
        { value: "full", label: "The whole web" },
        { value: "chain", label: "One food chain" },
        { value: "empty", label: "Empty — build it yourself" },
      ],
      default: "full",
    },
    predator: {
      type: "option", label: "Eater", options: SPECIES_OPTIONS, default: "rabbit",
      help: "Then click the stage to draw the arrow.",
    },
    prey: {
      type: "option", label: "Eaten", options: SPECIES_OPTIONS, default: "grass",
    },
    remove: {
      type: "option", label: "Remove a species",
      options: [{ value: "none", label: "Nobody" }, ...SPECIES_OPTIONS],
      default: "none",
      help: "Take one out and watch the web rearrange itself.",
    },
    efficiency: {
      type: "number", label: "Energy passed to the next level", kind: "percent",
      min: 0.02, max: 0.25, step: 0.01, default: 0.1,
      bands: ["6-8", "9-12"],
      marks: [
        { value: 0.02, label: "2% ocean" },
        { value: 0.1, label: "10% rule" },
        { value: 0.16, label: "16% Silver Springs" },
      ],
      help: "The rest is burned for living or ends up as dead matter.",
    },
    sunEnergy: {
      type: "number", label: "Plant production", kind: "count",
      min: 1000, max: 25000, step: 500, default: 10000,
      bands: ["6-8", "9-12"],
      marks: [
        { value: 2700, label: "Grassland" },
        { value: 10000, label: "Textbook" },
        { value: 20810, label: "Silver Springs" },
      ],
      help: "Kilocalories captured per square metre per year.",
    },
    pyramidData: {
      type: "option", label: "Pyramid shows",
      options: [
        { value: "model", label: "This meadow" },
        { value: "silverSprings", label: "Real data: Silver Springs" },
      ],
      default: "model",
      bands: ["6-8", "9-12"],
      help: "H.T. Odum measured a whole Florida spring in 1957. Compare his numbers with yours.",
    },
  },
  overlays: [
    { key: "pyramid", label: "Energy pyramid", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "ten-percent",
      title: "Where does the energy go?",
      question: "If the plants capture 10 000 kcal, how much reaches the hawk?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS2-3"],
      setup: { preset: "full", remove: "none", efficiency: 0.1, sunEnergy: 10000, pyramidData: "model" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The plants capture 10 000 kcal per square metre each year.",
          predict: {
            prompt: "Roughly how much of that reaches the top predator, four levels up?",
            options: ["About 2 500", "About 1 000", "About 100", "About 10 or less"],
            correct: 3,
            reveal: "About ten, or less. Each step keeps only a tenth, so four levels up you are down to a thousandth.",
          },
        },
        {
          id: "read",
          phase: "measure",
          title: "Read the pyramid",
          instruction: "Record the energy at all four levels.",
          requireData: 3,
          hints: ["The percentage under each band is the fraction that got through."],
        },
        {
          id: "efficiency",
          phase: "measure",
          title: "Change the efficiency",
          instruction: "Try 2% and then 20%. Record the top level each time.",
          check: { describe: "Efficiency moved away from 10%", test: (v) => Math.abs((v.params.efficiency as number) - 0.1) > 0.02 },
          requireData: 6,
          hints: ["Ocean food chains transfer nearer 2%. That is why they are short."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Why is the top so small?",
          instruction: "Look at where the missing 90% goes at each step.",
          write: {
            prompt: "Name the two places the missing energy goes, and say which is bigger.",
            placeholder: "Most of it is ... and the rest becomes ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain a rule of nature",
          instruction: "Use your numbers to explain why food chains are short.",
          write: {
            prompt: "Why is there no animal that eats hawks?",
            placeholder: "By the fifth level there would only be ... kcal, which is not enough to ...",
          },
        },
      ],
    },
    {
      id: "cascade",
      title: "Pull one thread",
      question: "Take one species out. Which others feel it, and in which direction?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS2-4"],
      setup: { preset: "full", remove: "none", efficiency: 0.1, sunEnergy: 10000, pyramidData: "model" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You are about to remove every fox from the meadow.",
          predict: {
            prompt: "What happens to the grass?",
            options: [
              "Nothing — foxes do not eat grass",
              "More grass, because foxes trample it",
              "Less grass, because rabbits and mice boom",
            ],
            correct: 2,
            reveal: "Less grass. With no fox, the rabbits and mice multiply and graze the meadow down. A predator three steps away still reaches the plants.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Record the healthy meadow",
          instruction: "Play until the numbers settle, then record.",
          requireData: 2,
        },
        {
          id: "remove-fox",
          phase: "measure",
          title: "Remove the fox",
          instruction: "Set Remove a species to Fox. Play on and record twice.",
          check: { describe: "The fox is gone", test: (v) => v.params.remove === "fox" },
          requireData: 4,
          hints: ["Watch the rabbit and mouse percentages first, then the grass."],
        },
        {
          id: "remove-grass",
          phase: "measure",
          title: "Now remove the grass",
          instruction: "Put the fox back and remove the grass instead. Record.",
          check: {
            describe: "Grass removed and species are in trouble",
            test: (v) => v.params.remove === "grass" && (v.facts.collapsed as number) >= 3,
          },
          requireData: 6,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Compare the two shocks",
          instruction: "Which removal hurt more species, and why?",
          write: {
            prompt: "Why does removing a producer do more damage than removing a predator?",
            placeholder: "Everything in the web depends on ... but only some things depend on ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "wire-it-up",
      title: "Draw the whole web",
      brief: "Start from an empty meadow and find every real feeding link.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { preset: "empty", remove: "none", predator: "rabbit", prey: "grass" },
      goal: {
        describe: "All 14 real feeding links drawn",
        test: (v) => v.facts.complete === true,
      },
      stars: {
        two: {
          describe: "The whole web with no more than three wrong guesses",
          test: (v) => v.facts.complete === true && (v.facts.badLinks as number) <= 3,
        },
        three: {
          describe: "The whole web with no wrong guesses at all",
          test: (v) => v.facts.complete === true && (v.facts.badLinks as number) === 0,
        },
      },
      hints: [
        "Choose the eater and the eaten, then click the stage.",
        "Work upward: producers first, then everything that eats them.",
        "A blue tit takes caterpillars off the oak — and grasshoppers too.",
      ],
    },
    {
      id: "keep-the-hawk",
      title: "Keep the hawk fed",
      brief: "Remove a species without letting the hawk fall below half its numbers.",
      bands: ["6-8", "9-12"],
      setup: { preset: "full", remove: "caterpillar", efficiency: 0.1, sunEnergy: 10000 },
      goal: {
        describe: "One species removed and the hawk still above 50%",
        test: (v) => v.params.remove !== "none" && (v.facts.pop_hawk as number) > 0.5,
      },
      stars: {
        two: {
          describe: "Removed a species and the hawk is still above 80%",
          test: (v) => v.params.remove !== "none" && (v.facts.pop_hawk as number) > 0.8,
        },
        three: {
          describe: "Above 80% with nothing else in the web below half",
          test: (v) =>
            v.params.remove !== "none" && (v.facts.pop_hawk as number) > 0.8 &&
            (v.facts.collapsed as number) === 0,
        },
      },
      hints: [
        "The hawk has three different prey. Take out the one it depends on least.",
        "A web with many links survives a loss that would break a chain.",
      ],
    },
  ],
};
