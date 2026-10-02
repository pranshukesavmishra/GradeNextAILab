import type { RenderContext, SimContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  caption, contactShadow, glow, groundPlane, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Pollination & Seed Dispersal — Grades 4-10.
 *
 * Three things a flower is for, in the order a plant does them: the parts, the
 * transfer, and the journey.
 *
 * The flower view is a labelled cross-section with its anthers actually
 * shedding pollen. The pollinator view is a meadow with bees in it; each bee
 * picks up pollen from the anthers it lands on and leaves some on the next
 * stigma, so cross-pollination is something that happens rather than something
 * asserted — set the number of bees to zero and the flowers simply are not
 * pollinated. The dispersal view launches real seeds.
 *
 * Wind dispersal is the textbook model and it is honest arithmetic: a seed
 * falling at its terminal velocity from height h in a wind of speed u travels
 * a distance d = h·u / v_terminal. The terminal velocities are measured
 * values — a dandelion's plumed seed falls at about 0.30 m/s, a pine seed at
 * about 0.60, a maple samara at about 0.95 — which is why the same wind
 * carries a dandelion three times as far as a samara.
 *
 * The water, animal and explosive seeds are drawn with the distances actually
 * recorded for them rather than from a physical model, and the sim says so.
 */

/* ------------------------------------------------------------------ *
 * Flower anatomy
 * ------------------------------------------------------------------ */

export interface FlowerPart {
  key: string;
  name: string;
  job: string;
}

export const FLOWER_PARTS: FlowerPart[] = [
  { key: "anther", name: "Anther", job: "makes pollen" },
  { key: "filament", name: "Filament", job: "holds the anther up" },
  { key: "stigma", name: "Stigma", job: "catches pollen" },
  { key: "style", name: "Style", job: "the tube pollen grows down" },
  { key: "ovary", name: "Ovary", job: "holds the ovules; becomes the fruit" },
  { key: "ovule", name: "Ovule", job: "becomes the seed once fertilised" },
  { key: "petal", name: "Petal", job: "attracts pollinators" },
  { key: "sepal", name: "Sepal", job: "protected the bud" },
  { key: "nectary", name: "Nectary", job: "pays the pollinator" },
];

/* ------------------------------------------------------------------ *
 * Seeds
 * ------------------------------------------------------------------ */

export type DispersalMode = "wind" | "water" | "animal" | "explosive";

export interface SeedDef {
  key: string;
  name: string;
  mode: DispersalMode;
  /** Measured terminal velocity in still air, m/s. Wind seeds only. */
  vTerminal: number;
  /** Typical recorded travel distance, metres. */
  typical: number;
  /** Longest recorded journey, metres. */
  record: number;
  note: string;
}

export const SEEDS: SeedDef[] = [
  {
    key: "dandelion", name: "Dandelion", mode: "wind", vTerminal: 0.30,
    typical: 2, record: 100000,
    note: "a parachute of 100 bristles; most land within metres, a few cross a country",
  },
  {
    key: "pine", name: "Pine seed", mode: "wind", vTerminal: 0.60,
    typical: 30, record: 1000, note: "one papery wing, so it spins as it falls",
  },
  {
    key: "maple", name: "Maple samara", mode: "wind", vTerminal: 0.95,
    typical: 30, record: 200, note: "autorotates like a helicopter blade",
  },
  {
    key: "coconut", name: "Coconut", mode: "water", vTerminal: 0,
    typical: 100000, record: 4500000,
    note: "floats, stays alive at sea for months, and lands on a new island",
  },
  {
    key: "burr", name: "Burdock burr", mode: "animal", vTerminal: 0,
    typical: 1000, record: 20000, note: "hooks into fur; the inspiration for Velcro",
  },
  {
    key: "impatiens", name: "Touch-me-not", mode: "explosive", vTerminal: 0,
    typical: 2, record: 5, note: "the ripe pod coils up and flicks its seeds away",
  },
];

export function seedByKey(key: string): SeedDef {
  return SEEDS.find((s) => s.key === key) ?? SEEDS[0];
}

/**
 * How far a wind-dispersed seed travels: it drifts sideways at the wind speed
 * for exactly as long as it takes to fall, and it falls at its terminal
 * velocity. d = (h / v_terminal) × u.
 */
export function windDistance(heightM: number, windMs: number, vTerminal: number): number {
  if (vTerminal <= 0) return 0;
  return (heightM / vTerminal) * windMs;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Bee {
  x: number; y: number;
  tx: number; ty: number;
  target: number;
  /** Which flower this bee's pollen load came from, or -1 for none. */
  carrying: number;
  wait: number;
  phase: number;
}

interface Flower {
  x: number; y: number;
  /** Which flower's pollen reached this stigma, or -1 for none. */
  pollenFrom: number;
  visits: number;
  sway: number;
}

interface Grain {
  x: number; y: number; vx: number; vy: number; age: number;
}

interface Seed {
  /** Metres from the parent plant, and metres above the ground. */
  d: number; h: number;
  spin: number;
  landed: boolean;
  distance: number;
}

interface State {
  t: number;
  flowers: Flower[];
  bees: Bee[];
  grains: Grain[];
  crossPollinated: number;
  selfPollinated: number;
  visits: number;
  seeds: Seed[];
  landings: number[];
  releaseClock: number;
  released: number;
}

const MAX_GRAINS = 90;
const MAX_SEEDS = 40;
const MAX_LANDINGS = 120;

function buildMeadow(params: Record<string, number | boolean | string>, ctx: SimContext): State {
  const n = Math.round(params.flowerCount as number);
  const flowers: Flower[] = [];
  for (let i = 0; i < n; i++) {
    flowers.push({
      x: 0.08 + 0.84 * ((i + 0.5) / n) + ctx.rng.range(-0.03, 0.03),
      y: 0.32 + ctx.rng.range(0, 0.34),
      pollenFrom: -1,
      visits: 0,
      sway: ctx.rng.range(0, Math.PI * 2),
    });
  }
  const bees: Bee[] = [];
  const nb = Math.round(params.bees as number);
  for (let i = 0; i < nb; i++) {
    const target = flowers.length ? ctx.rng.int(0, flowers.length - 1) : 0;
    bees.push({
      x: ctx.rng.next(), y: ctx.rng.range(0.1, 0.6),
      tx: flowers[target]?.x ?? 0.5, ty: flowers[target]?.y ?? 0.5,
      target, carrying: -1, wait: 0, phase: ctx.rng.range(0, 6.28),
    });
  }
  return {
    t: 0, flowers, bees, grains: [],
    crossPollinated: 0, selfPollinated: 0, visits: 0,
    seeds: [], landings: [], releaseClock: 0, released: 0,
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const BEE_SPEED = 0.42;   // stage widths per second
const HOVER_SECONDS = 0.35;

const model: SimModel<State> = {
  init(params, ctx) {
    return buildMeadow(params, ctx);
  },

  applyParams(state, params, prev, ctx) {
    if (params.flowerCount !== prev.flowerCount || params.bees !== prev.bees || params.view !== prev.view) {
      return buildMeadow(params, ctx);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const view = params.view as string;
    const t = state.t + dt;

    /* --- pollen puffing off the anthers ---------------------------- */
    let grains = state.grains;
    if (view !== "dispersal") {
      const kept: Grain[] = [];
      for (const g of grains) {
        const age = g.age + dt;
        if (age > 2.4) continue;
        kept.push({
          x: g.x + g.vx * dt, y: g.y + g.vy * dt,
          vx: g.vx * 0.985, vy: g.vy * 0.985 + 0.02 * dt, age,
        });
      }
      grains = kept;
      if (grains.length < MAX_GRAINS && ctx.rng.next() < dt * 8) {
        const f = state.flowers.length ? state.flowers[ctx.rng.int(0, state.flowers.length - 1)] : null;
        const ox = view === "flower" ? 0.5 : (f?.x ?? 0.5);
        const oy = view === "flower" ? 0.45 : (f?.y ?? 0.5);
        grains = grains.concat({
          x: ox + ctx.rng.range(-0.03, 0.03),
          y: oy + ctx.rng.range(-0.02, 0.02),
          vx: ctx.rng.range(-0.03, 0.05), vy: ctx.rng.range(-0.02, 0.02), age: 0,
        });
      }
    }

    /* --- bees working the meadow ------------------------------------ */
    let flowers = state.flowers;
    let bees = state.bees;
    let crossPollinated = state.crossPollinated;
    let selfPollinated = state.selfPollinated;
    let visits = state.visits;

    if (view === "pollinator" && bees.length && flowers.length) {
      const nextFlowers = flowers.slice();
      const nextBees: Bee[] = [];
      for (const b of bees) {
        let { x, y, target, carrying, wait } = b;
        const f = nextFlowers[Math.min(target, nextFlowers.length - 1)];
        const dx = f.x - x;
        const dy = f.y - y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.02) {
          wait += dt;
          if (wait >= HOVER_SECONDS) {
            visits++;
            const idx = nextFlowers.indexOf(f);
            // Pollen already on the bee lands on this stigma.
            if (f.pollenFrom < 0 && carrying >= 0) {
              if (carrying === idx) selfPollinated++;
              else crossPollinated++;
              nextFlowers[idx] = { ...f, pollenFrom: carrying, visits: f.visits + 1 };
            } else {
              nextFlowers[idx] = { ...f, visits: f.visits + 1 };
            }
            // ...and this flower's anthers load the bee for the next trip.
            carrying = idx;
            wait = 0;
            target = ctx.rng.int(0, nextFlowers.length - 1);
          }
        } else {
          const step = Math.min(dist, BEE_SPEED * dt);
          x += (dx / dist) * step;
          y += (dy / dist) * step;
        }
        nextBees.push({
          x, y, tx: f.x, ty: f.y, target, carrying, wait, phase: b.phase + dt * 26,
        });
      }
      flowers = nextFlowers;
      bees = nextBees;
    }

    /* --- seeds on their journey -------------------------------------- */
    let seeds = state.seeds;
    let landings = state.landings;
    let releaseClock = state.releaseClock;
    let released = state.released;

    if (view === "dispersal") {
      const seed = seedByKey(params.seedType as string);
      const h0 = params.releaseHeight as number;
      const wind = params.windSpeed as number;

      releaseClock += dt;
      if (releaseClock >= 0.5 && seeds.length < MAX_SEEDS) {
        releaseClock = 0;
        released++;
        seeds = seeds.concat({ d: 0, h: h0, spin: ctx.rng.range(0, 6.28), landed: false, distance: 0 });
      }

      const next: Seed[] = [];
      const newLandings: number[] = [];
      for (const s of seeds) {
        if (s.landed) {
          if (s.d < (params.releaseHeight as number) * 400) next.push(s);
          continue;
        }
        let h = s.h;
        let d = s.d;
        if (seed.mode === "wind") {
          // Falling at terminal velocity, drifting at the speed of the wind.
          h -= seed.vTerminal * dt;
          d += wind * dt;
        } else {
          // Not a free fall: these seeds travel by boat, fur or catapult, so
          // the sim animates them towards their measured distance.
          const target = seed.typical * (0.4 + 1.6 * ((s.spin % 1) + 0.001));
          d += (target - d) * Math.min(1, dt * 0.7);
          h = Math.max(0, h - dt * 0.4);
        }
        if (h <= 0) {
          const landed = { ...s, h: 0, d, landed: true, distance: d };
          next.push(landed);
          newLandings.push(d);
        } else {
          next.push({ ...s, h, d, spin: s.spin + dt * 6 });
        }
      }
      seeds = next.length > MAX_SEEDS ? next.slice(next.length - MAX_SEEDS) : next;
      if (newLandings.length) {
        landings = landings.concat(newLandings);
        if (landings.length > MAX_LANDINGS) landings = landings.slice(landings.length - MAX_LANDINGS);
      }
    }

    return {
      t, flowers, bees, grains,
      crossPollinated, selfPollinated, visits,
      seeds, landings, releaseClock, released,
    };
  },

  readouts(state, params) {
    const seed = seedByKey(params.seedType as string);
    const pollinated = state.flowers.filter((f) => f.pollenFrom >= 0).length;
    const total = Math.max(state.flowers.length, 1);
    const mean = state.landings.length
      ? state.landings.reduce((s, d) => s + d, 0) / state.landings.length : 0;
    return [
      {
        key: "pollinated", label: "Flowers pollinated",
        quantity: q(pollinated / total, "percent"), unit: "%",
        semantic: "producer", graphable: true,
      },
      {
        key: "visits", label: "Flower visits", quantity: q(state.visits, "count"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "crossPollinated", label: "Cross-pollinated",
        quantity: q(state.crossPollinated, "count"),
        semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "selfPollinated", label: "Self-pollinated",
        quantity: q(state.selfPollinated, "count"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "meanDistance", label: "Mean landing distance",
        quantity: q(mean, "length"), unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "predictedDistance", label: "Predicted distance",
        quantity: q(
          windDistance(params.releaseHeight as number, params.windSpeed as number, seed.vTerminal),
          "length",
        ),
        unit: "m", semantic: "velocity", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "fallSpeed", label: "Falling speed", quantity: q(seed.vTerminal, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const seed = seedByKey(params.seedType as string);
    const pollinated = state.flowers.filter((f) => f.pollenFrom >= 0).length;
    const total = Math.max(state.flowers.length, 1);
    const landed = state.landings;
    const mean = landed.length ? landed.reduce((s, d) => s + d, 0) / landed.length : 0;
    return {
      view: params.view as string,
      flowers: state.flowers.length,
      pollinatedCount: pollinated,
      pollinatedFraction: pollinated / total,
      allPollinated: pollinated === state.flowers.length && state.flowers.length > 0,
      crossPollinated: state.crossPollinated,
      selfPollinated: state.selfPollinated,
      visits: state.visits,
      bees: state.bees.length,
      seedType: seed.key,
      dispersalMode: seed.mode,
      terminalVelocity: seed.vTerminal,
      predictedDistance: windDistance(
        params.releaseHeight as number, params.windSpeed as number, seed.vTerminal,
      ),
      seedsLanded: landed.length,
      meanDistance: mean,
      maxDistance: landed.length ? Math.max(...landed) : 0,
      recordDistance: seed.record,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** A labelled cross-section of one flower. */
function renderFlower(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band } = rc;
  const cx = width * 0.42;
  const baseY = height * 0.86;
  const scale = Math.min(width / 520, height / 380) * 1.5;
  const highlight = params.part as string;
  const lit = (k: string) => highlight === "all" || highlight === k;
  const alpha = (k: string) => (lit(k) ? 1 : 0.25);

  const petal = theme.sci["field"];
  const green = theme.sci["producer"];
  const gold = theme.sci["light"];

  const S = (v: number) => v * scale;

  /* stem and receptacle */
  ctx.save();
  ctx.globalAlpha = alpha("sepal");
  ctx.strokeStyle = green;
  ctx.lineWidth = S(7);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.lineTo(cx, baseY - S(60));
  ctx.stroke();
  ctx.restore();

  /* petals, five of them, behind everything else */
  ctx.save();
  ctx.globalAlpha = alpha("petal");
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.62;
    const px = cx + Math.cos(a) * S(46);
    const py = baseY - S(66) + Math.sin(a) * S(30);
    const g = ctx.createRadialGradient(px, py, S(2), px, py, S(34));
    g.addColorStop(0, mixHex(petal, "#ffffff", 0.55));
    g.addColorStop(1, petal);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, S(32), S(15), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* sepals */
  ctx.save();
  ctx.globalAlpha = alpha("sepal");
  ctx.fillStyle = green;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * S(20), baseY - S(52), S(16), S(6), s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* ovary with ovules inside, then style and stigma */
  ctx.save();
  ctx.globalAlpha = alpha("ovary");
  const og = ctx.createRadialGradient(cx - S(5), baseY - S(76), S(2), cx, baseY - S(70), S(20));
  og.addColorStop(0, mixHex(green, "#ffffff", 0.5));
  og.addColorStop(1, mixHex(green, "#000000", 0.2));
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - S(70), S(17), S(13), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha("ovule");
  for (let i = 0; i < 4; i++) {
    sphere(ctx, cx - S(8) + i * S(5.5), baseY - S(70), S(3), theme.sci["primary-consumer"]);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha("style");
  ctx.strokeStyle = mixHex(green, "#ffffff", 0.25);
  ctx.lineWidth = S(4);
  ctx.beginPath();
  ctx.moveTo(cx, baseY - S(82));
  ctx.lineTo(cx, baseY - S(132));
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha("stigma");
  sphere(ctx, cx, baseY - S(136), S(7), theme.sci["acid"], { glow: 0.4 });
  ctx.restore();

  /* stamens: filament plus anther, shedding pollen */
  ctx.save();
  ctx.globalAlpha = alpha("filament");
  ctx.strokeStyle = mixHex(gold, "#ffffff", 0.2);
  ctx.lineWidth = S(2.4);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.26;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - S(80));
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * S(24), baseY - S(104),
      cx + Math.cos(a) * S(38), baseY - S(118),
    );
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha("anther");
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.26;
    const ax = cx + Math.cos(a) * S(38);
    const ay = baseY - S(118);
    glow(ctx, ax, ay, S(12), gold, 0.4);
    sphere(ctx, ax, ay, S(6), gold);
  }
  ctx.restore();

  /* nectary at the base of the ovary */
  ctx.save();
  ctx.globalAlpha = alpha("nectary");
  sphere(ctx, cx + S(14), baseY - S(58), S(4.5), theme.sci["acceleration"]);
  ctx.restore();

  /* pollen actually leaving the anthers */
  for (const g of state.grains) {
    const gx = cx + (g.x - 0.5) * width * 0.5;
    const gy = baseY - S(118) + (g.y - 0.45) * height * 0.5;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - g.age / 2.4) * 0.9;
    sphere(ctx, gx, gy, S(2.2), gold);
    ctx.restore();
  }

  /* labels with leader lines */
  if (band !== "3-5") {
    const labels: [string, number, number][] = [
      ["anther", cx + S(50), baseY - S(126)],
      ["stigma", cx - S(46), baseY - S(146)],
      ["style", cx - S(40), baseY - S(108)],
      ["ovary", cx - S(52), baseY - S(70)],
      ["ovule", cx + S(46), baseY - S(70)],
      ["petal", cx + S(74), baseY - S(90)],
      ["sepal", cx - S(52), baseY - S(46)],
      ["nectary", cx + S(46), baseY - S(48)],
    ];
    for (const [key, lx, ly] of labels) {
      const part = FLOWER_PARTS.find((p) => p.key === key);
      if (!part) continue;
      ctx.save();
      ctx.globalAlpha = lit(key) ? 1 : 0.3;
      ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(cx + (lx > cx ? S(20) : -S(20)), ly);
      ctx.stroke();
      caption(ctx, lx, ly, part.name, theme, {
        align: lx > cx ? "left" : "right", size: 11,
        color: lit(key) ? theme.ink : theme.inkSoft, weight: 700,
      });
      if (lit(key) && highlight !== "all") {
        caption(ctx, lx, ly + 12, part.job, theme, {
          align: lx > cx ? "left" : "right", size: 9, color: theme.accent,
        });
      }
      ctx.restore();
    }
  }

  caption(ctx, 12, 16, "Inside a flower", theme, { size: 13, color: theme.ink, weight: 800 });
  caption(ctx, 12, 31, "stamen = filament + anther · carpel = stigma + style + ovary", theme, {
    size: 10, color: theme.inkSoft,
  });
}

function drawBee(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number, theme: RenderContext<State>["theme"]) {
  const wing = Math.sin(phase) * 0.5 + 0.5;
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.55);
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.8, r * 1.1, r * 0.42 * (0.4 + wing), -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + r * 0.5, y - r * 0.8, r * 1.1, r * 0.42 * (0.4 + wing), 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  sphere(ctx, x, y, r, theme.sci["primary-consumer"]);
  ctx.save();
  ctx.fillStyle = hexA(theme.ink, 0.75);
  ctx.fillRect(x - r * 0.55, y - r * 0.8, r * 0.35, r * 1.6);
  ctx.fillRect(x + r * 0.2, y - r * 0.8, r * 0.35, r * 1.6);
  ctx.restore();
}

function renderPollinator(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, band } = rc;
  const groundY = height * 0.92;
  groundPlane(ctx, groundY, 0, width, height, theme, "grass");

  const gold = theme.sci["light"];
  for (let i = 0; i < state.flowers.length; i++) {
    const f = state.flowers[i];
    const fx = f.x * width;
    const fy = groundY - f.y * height * 0.72;
    const sway = Math.sin(state.t * 1.3 + f.sway) * 3;

    ctx.save();
    ctx.strokeStyle = theme.sci["producer"];
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, groundY);
    ctx.quadraticCurveTo(fx + sway * 0.5, (groundY + fy) / 2, fx + sway, fy);
    ctx.stroke();
    ctx.restore();

    const r = band === "3-5" ? 13 : 10;
    const done = f.pollenFrom >= 0;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + state.t * 0.15;
      sphere(ctx, fx + sway + Math.cos(a) * r, fy + Math.sin(a) * r * 0.8, r * 0.62, theme.sci["field"]);
    }
    sphere(ctx, fx + sway, fy, r * 0.5, done ? theme.sci["acid"] : gold, { glow: done ? 0.7 : 0.25 });
    if (done) {
      // A pollinated flower starts making a fruit.
      sphere(ctx, fx + sway, fy + r * 1.5, r * 0.4, theme.sci["producer"]);
    }
  }

  for (const g of state.grains) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - g.age / 2.4) * 0.8;
    sphere(ctx, g.x * width, groundY - g.y * height * 0.72, 2, gold);
    ctx.restore();
  }

  for (const b of state.bees) {
    const bx = b.x * width;
    const by = groundY - b.y * height * 0.72;
    contactShadow(ctx, bx, groundY, 5, groundY - by);
    drawBee(ctx, bx, by, band === "3-5" ? 7 : 5.5, b.phase, theme);
    if (b.carrying >= 0) {
      glow(ctx, bx, by + 4, 8, theme.sci["light"], 0.5);
    }
  }

  const pollinated = state.flowers.filter((f) => f.pollenFrom >= 0).length;
  caption(ctx, 12, 16, "A bee working the meadow", theme, { size: 13, color: theme.ink, weight: 800 });
  caption(
    ctx, 12, 31,
    `${pollinated} of ${state.flowers.length} pollinated · ${state.visits} visits · ` +
    `${state.crossPollinated} crossed`,
    theme, { size: 11, color: theme.inkSoft },
  );
  if (state.bees.length === 0) {
    caption(ctx, width / 2, height * 0.45, "No pollinators. No pollination.", theme, {
      align: "center", size: 16, color: theme.sci["force"], weight: 800,
    });
  }
  if (band !== "3-5") {
    caption(
      ctx, width - 12, height - 10,
      "About 75% of the world's leading food crops depend on animal pollinators",
      theme, { align: "right", size: 9, color: theme.inkSoft },
    );
  }
}

function renderDispersal(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const seed = seedByKey(params.seedType as string);
  const h0 = params.releaseHeight as number;
  const wind = params.windSpeed as number;
  const predicted = windDistance(h0, wind, seed.vTerminal);

  const groundY = height * 0.78;
  groundPlane(ctx, groundY, 0, width, height, theme, seed.mode === "water" ? "water" : "grass");

  // Frame the stage around the journey that will actually happen.
  const far = Math.max(predicted * 1.3, seed.typical * 1.4, 6, ...state.landings.map((d) => d * 1.15));
  const toX = (d: number) => 40 + (d / far) * (width - 60);
  const toY = (h: number) => groundY - (h / Math.max(h0 * 1.25, 1)) * (groundY - 34);

  /* the parent plant */
  ctx.save();
  ctx.strokeStyle = theme.sci["producer"];
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(toX(0), groundY);
  ctx.lineTo(toX(0), toY(h0));
  ctx.stroke();
  ctx.restore();
  sphere(ctx, toX(0), toY(h0), 8, theme.sci["light"], { glow: 0.35 });

  /* wind streaks, so the air is visible */
  if (seed.mode === "wind" && wind > 0.1) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["cold"], 0.35);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) {
      const wy = 30 + ((i * 37 + state.t * wind * 28) % (groundY - 40));
      const wx = ((i * 91 + state.t * wind * 70) % (width + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 22 + wind * 3, wy);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* the seeds */
  for (const s of state.seeds) {
    const sx = toX(s.d);
    const sy = toY(s.h);
    if (sx > width + 20) continue;
    contactShadow(ctx, sx, groundY, 5, groundY - sy);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(s.spin);
    if (seed.key === "dandelion") {
      ctx.strokeStyle = hexA(theme.ink, 0.55);
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.stroke();
      }
      ctx.restore();
      sphere(ctx, sx, sy, 2.4, theme.sci["decomposer"]);
      continue;
    }
    if (seed.mode === "wind") {
      ctx.fillStyle = hexA(theme.sci["decomposer"], 0.9);
      ctx.beginPath();
      ctx.ellipse(4, 0, 8, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = theme.sci["decomposer"];
      ctx.beginPath();
      ctx.arc(0, 0, seed.key === "coconut" ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (seed.key === "burr") {
        ctx.strokeStyle = theme.sci["decomposer"];
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
          ctx.lineTo(Math.cos(a) * 7.5, Math.sin(a) * 7.5);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    sphere(ctx, sx, sy, 2.6, theme.sci["decomposer"]);
  }

  /* the ruler along the ground */
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.4);
  ctx.lineWidth = 1;
  const tickStep = far > 400 ? 100 : far > 120 ? 25 : far > 40 ? 10 : far > 12 ? 2 : 1;
  for (let d = 0; d <= far; d += tickStep) {
    const tx = toX(d);
    ctx.beginPath();
    ctx.moveTo(tx, groundY);
    ctx.lineTo(tx, groundY + 6);
    ctx.stroke();
    if (band !== "3-5") {
      caption(ctx, tx, groundY + 14, `${d}`, theme, { align: "center", size: 8, color: theme.inkSoft });
    }
  }
  ctx.restore();
  caption(ctx, width - 12, groundY + 14, "metres", theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });

  /* where seeds have landed */
  if (overlays.landings !== false) {
    for (const d of state.landings) {
      const lx = toX(d);
      if (lx > width) continue;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = theme.sci["decomposer"];
      ctx.beginPath();
      ctx.arc(lx, groundY + 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* prediction and result */
  if (seed.mode === "wind") {
    const px = toX(predicted);
    if (px < width) {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 30);
      ctx.lineTo(px, groundY);
      ctx.stroke();
      ctx.restore();
      caption(ctx, px, 24, `predicted ${predicted.toFixed(1)} m`, theme, {
        align: "center", size: 10, color: theme.accent, weight: 700,
      });
    }
  }

  caption(ctx, 12, 16, `${seed.name} — ${seed.mode} dispersal`, theme, {
    size: 13, color: theme.ink, weight: 800,
  });
  if (band !== "3-5") {
    caption(ctx, 12, 31, seed.note, theme, { size: 10, color: theme.inkSoft });
    const rec = seed.record >= 1000 ? `${(seed.record / 1000).toFixed(0)} km` : `${seed.record} m`;
    caption(ctx, 12, height - 8, `furthest ever recorded: ${rec}`, theme, {
      size: 10, color: theme.sci["field"],
    });
  }

  if (seed.mode === "wind" && band !== "3-5") {
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.6 : 0.78);
    roundRect(ctx, width - 186, 40, 176, 40, 6);
    ctx.fill();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    caption(ctx, width - 178, 54, "distance = height × wind ÷ fall speed", theme, {
      size: 10, color: theme.inkSoft,
    });
    caption(
      ctx, width - 178, 70,
      `${h0.toFixed(1)} × ${wind.toFixed(1)} ÷ ${seed.vTerminal.toFixed(2)} = ${predicted.toFixed(1)} m`,
      theme, { size: 11, color: theme.ink, weight: 700 },
    );
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height } = rc;
  const view = params.view as string;
  sky(ctx, width, height, theme, view === "flower" ? "indoor" : "day", height * 0.8);

  if (view === "pollinator") renderPollinator(rc);
  else if (view === "dispersal") renderDispersal(rc);
  else renderFlower(rc);

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const pollinationSim: SimManifest<State> = {
  id: "bio.pollination",
  title: "Pollination & Seed Dispersal",
  tagline: "Take a flower apart, send a bee round the meadow, then launch the seeds.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10],
  standards: { ngss: ["MS-LS1-4", "MS-LS2-2", "MS-LS1-5"] },
  learningGoals: [
    "Name the parts of a flower and say what each one does.",
    "Explain how pollen gets from an anther to a stigma, and why that matters.",
    "Compare seed dispersal strategies and predict which travels furthest.",
    "Use a rule — height times wind divided by fall speed — to predict a distance.",
  ],
  misconceptions: [
    "Pollination and fertilisation are the same event",
    "Flowers are colourful for our benefit",
    "Seeds just fall where they are made",
    "A heavy seed and a light seed drift the same distance in wind",
  ],
  interactionHint: "Switch to the meadow view and set the number of bees to zero.",
  tickRate: 60,
  params: {
    view: {
      type: "option", label: "View",
      options: [
        { value: "flower", label: "Inside a flower" },
        { value: "pollinator", label: "Bees in the meadow" },
        { value: "dispersal", label: "Seeds on the move" },
      ],
      default: "flower",
    },
    part: {
      type: "option", label: "Highlight a part",
      options: [
        { value: "all", label: "Everything" },
        { value: "anther", label: "Anther" },
        { value: "stigma", label: "Stigma" },
        { value: "style", label: "Style" },
        { value: "ovary", label: "Ovary" },
        { value: "ovule", label: "Ovule" },
        { value: "petal", label: "Petal" },
        { value: "nectary", label: "Nectary" },
      ],
      default: "all",
    },
    bees: {
      type: "number", label: "Pollinators", kind: "population",
      min: 0, max: 8, step: 1, default: 3,
      help: "Set it to zero and see what a meadow with no insects produces.",
    },
    flowerCount: {
      type: "number", label: "Flowers", kind: "population",
      min: 3, max: 14, step: 1, default: 8,
      bands: ["6-8", "9-12"],
    },
    seedType: {
      type: "option", label: "Seed",
      options: [
        { value: "dandelion", label: "Dandelion (wind)" },
        { value: "pine", label: "Pine seed (wind)" },
        { value: "maple", label: "Maple samara (wind)" },
        { value: "coconut", label: "Coconut (water)" },
        { value: "burr", label: "Burdock burr (animal)" },
        { value: "impatiens", label: "Touch-me-not (explosive)" },
      ],
      default: "dandelion",
    },
    windSpeed: {
      type: "number", label: "Wind speed", kind: "velocity", unit: "m/s",
      min: 0, max: 12, step: 0.5, default: 3,
      marks: [{ value: 0, label: "still" }, { value: 3, label: "breeze" }, { value: 10, label: "gale" }],
    },
    releaseHeight: {
      type: "number", label: "Release height", kind: "length", unit: "m",
      min: 0.3, max: 20, step: 0.1, default: 1.5,
      marks: [{ value: 0.3, label: "dandelion" }, { value: 20, label: "treetop" }],
    },
  },
  overlays: [
    { key: "landings", label: "Where seeds landed", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "no-bees",
      title: "What happens to a meadow with no bees?",
      question: "Flowers cannot walk. So how does pollen get from one flower to another?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS2-2"],
      setup: { view: "pollinator", bees: 3, flowerCount: 8, part: "all" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You are about to remove every pollinator from the meadow.",
          predict: {
            prompt: "With no insects at all, what happens to these flowers?",
            options: [
              "Nothing changes — the wind does the job",
              "Almost none get pollinated, so almost no seeds form",
              "They pollinate themselves just as well",
            ],
            correct: 1,
            reveal:
              "These flowers are built for insects: bright petals, nectar, sticky pollen. Roughly 75% of the world's leading food crops depend on animal pollinators.",
          },
        },
        {
          id: "with",
          phase: "measure",
          title: "Watch the bees work",
          instruction: "Run with three bees until most of the meadow is pollinated. Record as you go.",
          requireData: 3,
          check: {
            describe: "More than half the flowers pollinated",
            test: (v) => (v.facts.pollinatedFraction as number) > 0.5,
          },
        },
        {
          id: "without",
          phase: "measure",
          title: "Now take the bees away",
          instruction: "Set Pollinators to 0 and run again from the start.",
          check: {
            describe: "No pollinators in the meadow",
            test: (v) => (v.facts.bees as number) === 0,
          },
          hints: ["Changing the number of bees starts the meadow fresh."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the deal",
          instruction: "The bee is not helping the flower out of kindness. Say what each one gets.",
          write: {
            prompt: "What does the bee get, and what does the flower get?",
            placeholder: "The bee comes for ... and while it is there ...",
          },
        },
      ],
    },
    {
      id: "how-far",
      title: "Which seed travels furthest?",
      question: "A dandelion seed and a maple samara, released from the same height in the same wind.",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-4"],
      setup: { view: "dispersal", seedType: "dandelion", windSpeed: 3, releaseHeight: 1.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "A dandelion seed falls at 0.30 m/s; a maple samara falls at 0.95 m/s.",
          predict: {
            prompt: "In the same wind from the same height, the dandelion travels...",
            options: [
              "The same distance — the wind is the same",
              "About three times as far",
              "About three times less far",
            ],
            correct: 1,
            reveal:
              "About three times as far. It stays in the air three times as long, and the wind pushes it the whole time. Distance is height × wind ÷ fall speed.",
          },
        },
        {
          id: "dandelion",
          phase: "measure",
          title: "Launch dandelion seeds",
          instruction: "Run at 3 m/s wind and 1.5 m height. Record the mean landing distance.",
          requireData: 2,
          check: {
            describe: "At least 6 dandelion seeds have landed",
            test: (v) => v.facts.seedType === "dandelion" && (v.facts.seedsLanded as number) >= 6,
          },
        },
        {
          id: "maple",
          phase: "measure",
          title: "Now the samara",
          instruction: "Switch to the maple samara, keeping wind and height the same. Record again.",
          requireData: 4,
          check: {
            describe: "At least 6 samaras have landed",
            test: (v) => v.facts.seedType === "maple" && (v.facts.seedsLanded as number) >= 6,
          },
          hints: ["Keep the wind and the height fixed. Only the seed may change."],
        },
        {
          id: "height",
          phase: "analyze",
          title: "Try a treetop",
          instruction: "Raise the release height to 20 m. What does that do to the distance?",
          check: {
            describe: "Released from at least 15 m",
            test: (v) => (v.params.releaseHeight as number) >= 15,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "State the rule for how far a wind-blown seed travels.",
          write: {
            prompt: "Write a rule connecting height, wind speed and fall speed to distance.",
            placeholder: "A seed travels further when ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "pollinate-all",
      title: "Fill the meadow",
      brief: "Get every flower pollinated, and at least three of them by pollen from another plant.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { view: "pollinator", bees: 2, flowerCount: 8 },
      goal: {
        describe: "Every flower pollinated",
        test: (v) => v.facts.allPollinated === true,
      },
      stars: {
        two: {
          describe: "With at least 5 cross-pollinations",
          test: (v) => v.facts.allPollinated === true && (v.facts.crossPollinated as number) >= 5,
        },
        three: {
          describe: "In under 60 flower visits",
          test: (v) =>
            v.facts.allPollinated === true && (v.facts.crossPollinated as number) >= 5 &&
            (v.facts.visits as number) < 60,
        },
      },
      hints: [
        "More bees means more visits per second.",
        "A bee has to visit one flower before it has any pollen to deliver to the next.",
      ],
    },
    {
      id: "long-haul",
      title: "Send a seed 100 metres",
      brief: "Choose the seed, the height and the wind to land a seed beyond 100 m.",
      bands: ["6-8", "9-12"],
      setup: { view: "dispersal", seedType: "maple", windSpeed: 3, releaseHeight: 2 },
      goal: {
        describe: "A landing beyond 100 m",
        test: (v) => (v.facts.maxDistance as number) >= 100,
      },
      stars: {
        two: {
          describe: "Beyond 300 m",
          test: (v) => (v.facts.maxDistance as number) >= 300,
        },
        three: {
          describe: "Beyond 300 m in a wind of 6 m/s or less",
          test: (v) =>
            (v.facts.maxDistance as number) >= 300 && (v.params.windSpeed as number) <= 6,
        },
      },
      hints: [
        "Distance is height × wind ÷ fall speed. Which of those three can you make most extreme?",
        "The slowest-falling seed on the list is the dandelion, at 0.30 m/s.",
      ],
    },
  ],
};
