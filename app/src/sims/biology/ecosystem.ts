import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import {
  badge, caption, groundPlane, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Ecosystem Simulator — Grades 3-12.
 *
 * Grass, rabbits and foxes on a wrap-around meadow. Nothing about the boom and
 * bust is scripted: every rabbit grazes the cell it is standing on, spends
 * energy to stay alive, and breeds when it has enough left over; every fox
 * hunts whatever rabbit happens to be within a body length. The famous
 * predator-prey oscillation falls out of those three rules alone, which is the
 * whole point — a student who sees the cycle *emerge* stops believing that
 * "nature is balanced" is a rule someone imposed on it.
 *
 * Time is measured in years. One model tick is about half a month, which is
 * short enough that a rabbit's energy budget looks continuous and long enough
 * that a century of ecology runs in under a minute.
 */

/* ------------------------------------------------------------------ *
 * World constants — per-year biological rates
 * ------------------------------------------------------------------ */

const GRID_W = 26;
const GRID_H = 18;
const CELLS = GRID_W * GRID_H;

/** Hard caps keep the frame budget honest on a low-end Chromebook. */
const MAX_RABBITS = 260;
const MAX_FOXES = 110;

const HISTORY_MAX = 260;
const SAMPLE_YEARS = 0.5;

const RABBIT_SPEED = 9;          // cells per year
const FOX_SPEED = 12;            // foxes range further than rabbits
const TURN_JITTER = 2.6;         // radians per sqrt(year) of heading wander
/** Seed left in a stripped cell: without it, bare ground could never recover. */
const GRASS_SEED = 0.06;

/**
 * Grazing is a fraction of the grass under the animal, not a fixed bite, so a
 * bare cell yields nothing and a lush cell yields a lot. That single choice is
 * what gives the prey a food-limited carrying capacity.
 */
const INGEST = 14;               // grazing rate constant, per year
const ENERGY_PER_GRASS = 5;

const RABBIT_METABOLISM = 12;    // energy per year just to stay alive
const RABBIT_REPRO_ENERGY = 10;
const RABBIT_MAX_ENERGY = 18;
const RABBIT_START_ENERGY = 11;

const CATCH_RADIUS = 1.15;       // cells
const CATCH_RATE = 3.3;          // per year, per rabbit inside the radius
const RABBIT_ENERGY_VALUE = 10;  // energy a fox gains from one rabbit

const FOX_METABOLISM = 14;
const FOX_REPRO_ENERGY = 26;
const FOX_MAX_ENERGY = 40;
const FOX_START_ENERGY = 24;

/** Mid-run events fire once, far enough in that a cycle is already visible. */
const EVENT_YEAR = 30;
const DROUGHT_YEARS = 12;
const DROUGHT_FACTOR = 0.18;
const PREDATOR_DROP = 12;

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Agent {
  x: number;      // cells, [0, GRID_W)
  y: number;      // cells, [0, GRID_H)
  dir: number;    // radians
  energy: number;
  age: number;    // years
}

interface State {
  /** Grass biomass per cell, 0 (bare) to 1 (lush). */
  grass: number[];
  rabbits: Agent[];
  foxes: Agent[];
  year: number;
  /** Down-sampled series for the on-stage population graph. */
  histYear: number[];
  histGrass: number[];
  histRabbits: number[];
  histFoxes: number[];
  sampleClock: number;
  eventFired: boolean;
  droughtUntil: number;
  /** Year each species died out, or -1 while it survives. */
  rabbitsLostYear: number;
  foxesLostYear: number;
  peakRabbits: number;
  peakFoxes: number;
  /** Rabbits eaten and rabbits starved, so labs can separate the two. */
  eaten: number;
  starved: number;
}

function spawn(rng: Rng, energy: number): Agent {
  return {
    x: rng.range(0, GRID_W),
    y: rng.range(0, GRID_H),
    dir: rng.range(0, Math.PI * 2),
    energy,
    age: 0,
  };
}

function buildWorld(params: ParamValues, rng: Rng): State {
  const grass = new Array<number>(CELLS);
  // Start close to lush but not uniform, so grazing patterns show up early.
  for (let i = 0; i < CELLS; i++) grass[i] = rng.range(0.55, 1);

  const nRabbits = Math.min(MAX_RABBITS, Math.round(params.rabbits0 as number));
  const nFoxes = Math.min(MAX_FOXES, Math.round(params.foxes0 as number));
  const rabbits: Agent[] = [];
  for (let i = 0; i < nRabbits; i++) rabbits.push(spawn(rng, RABBIT_START_ENERGY));
  const foxes: Agent[] = [];
  for (let i = 0; i < nFoxes; i++) foxes.push(spawn(rng, FOX_START_ENERGY));

  return {
    grass,
    rabbits,
    foxes,
    year: 0,
    histYear: [0],
    histGrass: [meanGrass(grass)],
    histRabbits: [rabbits.length],
    histFoxes: [foxes.length],
    sampleClock: 0,
    eventFired: false,
    droughtUntil: -1,
    rabbitsLostYear: rabbits.length > 0 ? -1 : 0,
    foxesLostYear: foxes.length > 0 ? -1 : 0,
    peakRabbits: rabbits.length,
    peakFoxes: foxes.length,
    eaten: 0,
    starved: 0,
  };
}

function meanGrass(grass: number[]): number {
  let sum = 0;
  for (let i = 0; i < grass.length; i++) sum += grass[i];
  return sum / grass.length;
}

/** Wrap a coordinate onto the torus so no animal is trapped at an edge. */
function wrap(v: number, span: number): number {
  let out = v % span;
  if (out < 0) out += span;
  return out;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildWorld(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    // Changing a *starting* population is a request for a new world; changing a
    // rate is a request to steer the world already running.
    if (params.rabbits0 !== prev.rabbits0 || params.foxes0 !== prev.foxes0) {
      return buildWorld(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rng = ctx.rng;
    const year = state.year + dt;

    /* --- mid-run events ------------------------------------------- */
    let eventFired = state.eventFired;
    let droughtUntil = state.droughtUntil;
    let foxes = state.foxes;
    const event = params.event as string;
    if (!eventFired && year >= EVENT_YEAR && event !== "none") {
      eventFired = true;
      if (event === "drought") {
        droughtUntil = year + DROUGHT_YEARS;
      } else if (event === "predator") {
        foxes = foxes.slice();
        for (let i = 0; i < PREDATOR_DROP && foxes.length < MAX_FOXES; i++) {
          foxes.push(spawn(rng, FOX_START_ENERGY));
        }
      }
    }
    const inDrought = year < droughtUntil;

    /* --- grass regrows -------------------------------------------- */
    // Logistic recovery: a partly grazed cell regrows fastest, a stripped cell
    // only creeps back from seed, and a full cell stops. That seed term is what
    // lets an overgrazed meadow stay bare long enough to starve the rabbits.
    // Drought scales the whole rate down.
    const regrow = (params.grassRegrowth as number) * (inDrought ? DROUGHT_FACTOR : 1);
    const grass = state.grass.slice();
    const k = regrow * dt;
    for (let i = 0; i < CELLS; i++) {
      const g = grass[i];
      grass[i] = g + k * (g + GRASS_SEED) * (1 - g);
    }

    /* --- rabbits: wander, graze, burn energy, breed ---------------- */
    const rabbitBirth = params.rabbitBirth as number;
    const biteFraction = 1 - Math.exp(-INGEST * dt);
    const turn = TURN_JITTER * Math.sqrt(dt);
    const rabbitStep = RABBIT_SPEED * dt;
    const nextRabbits: Agent[] = [];
    let starved = state.starved;

    for (let i = 0; i < state.rabbits.length; i++) {
      const r = state.rabbits[i];
      const dir = r.dir + rng.normal(0, turn);
      const x = wrap(r.x + Math.cos(dir) * rabbitStep, GRID_W);
      const y = wrap(r.y + Math.sin(dir) * rabbitStep, GRID_H);

      const cell = Math.floor(y) * GRID_W + Math.floor(x);
      const bite = grass[cell] * biteFraction;
      grass[cell] -= bite;

      let energy = r.energy + bite * ENERGY_PER_GRASS - RABBIT_METABOLISM * dt;
      if (energy <= 0) {
        starved++;
        continue;
      }
      if (energy > RABBIT_MAX_ENERGY) energy = RABBIT_MAX_ENERGY;
      const age = r.age + dt;

      if (
        energy >= RABBIT_REPRO_ENERGY &&
        nextRabbits.length + 1 < MAX_RABBITS &&
        rng.chance(rabbitBirth * dt)
      ) {
        // A litter costs the parent half of everything it has saved.
        energy *= 0.5;
        nextRabbits.push({ x, y, dir: rng.range(0, Math.PI * 2), energy, age: 0 });
      }
      nextRabbits.push({ x, y, dir, energy, age });
    }

    /* --- foxes: hunt, burn energy, breed --------------------------- */
    const foxBirth = params.foxBirth as number;
    const foxStep = FOX_SPEED * dt;
    const catchProb = CATCH_RATE * dt;
    const r2 = CATCH_RADIUS * CATCH_RADIUS;
    const nextFoxes: Agent[] = [];
    // Marking rather than splicing keeps the prey array stable while hunting.
    const takenBy = new Uint8Array(nextRabbits.length);
    let eaten = state.eaten;

    for (let i = 0; i < foxes.length; i++) {
      const f = foxes[i];
      const dir = f.dir + rng.normal(0, turn);
      const x = wrap(f.x + Math.cos(dir) * foxStep, GRID_W);
      const y = wrap(f.y + Math.sin(dir) * foxStep, GRID_H);

      let energy = f.energy - FOX_METABOLISM * dt;
      // One kill per tick at most: a fox that lands in a crowd still eats once.
      for (let j = 0; j < nextRabbits.length; j++) {
        if (takenBy[j]) continue;
        const p = nextRabbits[j];
        let dx = Math.abs(p.x - x);
        let dy = Math.abs(p.y - y);
        // Shortest separation across the wrap-around edges.
        if (dx > GRID_W / 2) dx = GRID_W - dx;
        if (dy > GRID_H / 2) dy = GRID_H - dy;
        if (dx * dx + dy * dy > r2) continue;
        if (!rng.chance(catchProb)) continue;
        takenBy[j] = 1;
        eaten++;
        energy += RABBIT_ENERGY_VALUE;
        break;
      }

      if (energy <= 0) continue;
      if (energy > FOX_MAX_ENERGY) energy = FOX_MAX_ENERGY;
      const age = f.age + dt;

      if (
        energy >= FOX_REPRO_ENERGY &&
        nextFoxes.length + 1 < MAX_FOXES &&
        rng.chance(foxBirth * dt)
      ) {
        energy *= 0.5;
        nextFoxes.push({ x, y, dir: rng.range(0, Math.PI * 2), energy, age: 0 });
      }
      nextFoxes.push({ x, y, dir, energy, age });
    }

    const survivors: Agent[] = [];
    for (let j = 0; j < nextRabbits.length; j++) {
      if (!takenBy[j]) survivors.push(nextRabbits[j]);
    }

    /* --- bookkeeping ---------------------------------------------- */
    let histYear = state.histYear;
    let histGrass = state.histGrass;
    let histRabbits = state.histRabbits;
    let histFoxes = state.histFoxes;
    let sampleClock = state.sampleClock + dt;
    if (sampleClock >= SAMPLE_YEARS) {
      sampleClock -= SAMPLE_YEARS;
      const drop = histYear.length >= HISTORY_MAX ? 1 : 0;
      histYear = histYear.slice(drop);
      histGrass = histGrass.slice(drop);
      histRabbits = histRabbits.slice(drop);
      histFoxes = histFoxes.slice(drop);
      histYear.push(year);
      histGrass.push(meanGrass(grass));
      histRabbits.push(survivors.length);
      histFoxes.push(nextFoxes.length);
    }

    return {
      grass,
      rabbits: survivors,
      foxes: nextFoxes,
      year,
      histYear,
      histGrass,
      histRabbits,
      histFoxes,
      sampleClock,
      eventFired,
      droughtUntil,
      rabbitsLostYear:
        state.rabbitsLostYear >= 0 ? state.rabbitsLostYear : survivors.length === 0 ? year : -1,
      foxesLostYear:
        state.foxesLostYear >= 0 ? state.foxesLostYear : nextFoxes.length === 0 ? year : -1,
      peakRabbits: Math.max(state.peakRabbits, survivors.length),
      peakFoxes: Math.max(state.peakFoxes, nextFoxes.length),
      eaten,
      starved,
    };
  },

  readouts(state) {
    const grass = meanGrass(state.grass);
    return [
      {
        key: "grass", label: "Grass", quantity: q(grass, "percent"), unit: "%",
        semantic: "producer", graphable: true,
      },
      {
        key: "rabbits", label: "Rabbits", quantity: q(state.rabbits.length, "population"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "foxes", label: "Foxes", quantity: q(state.foxes.length, "population"),
        semantic: "secondary-consumer", graphable: true,
      },
      {
        key: "year", label: "Years", quantity: q(state.year, "count"),
        semantic: "time", graphable: false,
      },
      {
        key: "eaten", label: "Rabbits eaten", quantity: q(state.eaten, "count"),
        semantic: "secondary-consumer", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "starved", label: "Rabbits starved", quantity: q(state.starved, "count"),
        semantic: "primary-consumer", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state) {
    const alive =
      (state.rabbits.length > 0 ? 1 : 0) + (state.foxes.length > 0 ? 1 : 0) +
      (meanGrass(state.grass) > 0.02 ? 1 : 0);
    return {
      year: state.year,
      rabbits: state.rabbits.length,
      foxes: state.foxes.length,
      grass: meanGrass(state.grass),
      peakRabbits: state.peakRabbits,
      peakFoxes: state.peakFoxes,
      speciesAlive: alive,
      allAlive: alive === 3,
      rabbitsLostYear: state.rabbitsLostYear,
      foxesLostYear: state.foxesLostYear,
      eaten: state.eaten,
      starved: state.starved,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Mix two theme colours into a hex, so the result can feed the scene kit. */
function blend(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const ca = a.replace("#", "");
  const cb = b.replace("#", "");
  let out = "#";
  for (let i = 0; i < 3; i++) {
    const va = parseInt(ca.slice(i * 2, i * 2 + 2), 16) || 0;
    const vb = parseInt(cb.slice(i * 2, i * 2 + 2), 16) || 0;
    out += Math.round(va + (vb - va) * k).toString(16).padStart(2, "0");
  }
  return out;
}

/** A stable pseudo-random value per cell — no allocation, no rng in render. */
function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A cheap flat contact shadow. Hundreds of animals cannot each afford a gradient. */
function footShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.ellipse(x + r * 0.18, y + r * 0.55, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The population graph is the payoff, so it gets a third of the stage. */
function drawGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, band } = rc;
  const n = state.histYear.length;
  const dark = isDarkTheme(theme);

  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.72)" : "rgba(255,255,255,0.8)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (n < 2) return;

  let maxPop = 10;
  for (let i = 0; i < n; i++) {
    if (state.histRabbits[i] > maxPop) maxPop = state.histRabbits[i];
    if (state.histFoxes[i] > maxPop) maxPop = state.histFoxes[i];
  }
  maxPop *= 1.12;

  const t0 = state.histYear[0];
  const t1 = Math.max(state.histYear[n - 1], t0 + 1);
  const px = (i: number) => x + ((state.histYear[i] - t0) / (t1 - t0)) * w;

  // Grass fills as an area — it is the ground everything else stands on.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let i = 0; i < n; i++) {
    ctx.lineTo(px(i), y + h - Math.min(state.histGrass[i], 1) * (h - 4) - 2);
  }
  ctx.lineTo(px(n - 1), y + h);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, hexA(theme.sci["producer"], 0.42));
  fill.addColorStop(1, hexA(theme.sci["producer"], 0.08));
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  const series: [number[], string, number][] = [
    [state.histGrass, theme.sci["producer"], 1],
    [state.histRabbits, theme.sci["primary-consumer"], maxPop],
    [state.histFoxes, theme.sci["secondary-consumer"], maxPop],
  ];

  ctx.save();
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [data, color, scale] of series) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const py = y + h - (Math.min(data[i], scale) / scale) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(px(i), py);
      else ctx.lineTo(px(i), py);
    }
    ctx.stroke();
    // A dot on the live end, so "now" is never ambiguous.
    const last = y + h - (Math.min(data[n - 1], scale) / scale) * (h - 4) - 2;
    sphere(ctx, px(n - 1), last, 3.2, color, { rim: false });
  }
  ctx.restore();

  if (band !== "K-2") {
    caption(ctx, x + w - 8, y + 12, `${Math.round(t0)}–${Math.round(t1)} yr`, theme, {
      align: "right", size: 10, color: theme.inkSoft, weight: 500,
    });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;
  const dark = isDarkTheme(theme);

  const showGraph = overlays.graph !== false;
  const graphH = showGraph ? Math.round(height * 0.27) : 0;
  const fieldH = height - graphH - (showGraph ? 8 : 0);

  // A shallow band of sky above the meadow: the horizon is what turns a grid
  // of coloured squares into a place with a far side.
  const horizonY = Math.round(fieldH * 0.14);
  const cellW = width / GRID_W;
  const cellH = (fieldH - horizonY) / GRID_H;

  const producer = theme.sci["producer"];
  const drought = state.year < state.droughtUntil;

  /* --- sky and horizon -------------------------------------------- */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, fieldH);
  ctx.clip();
  sky(ctx, width, fieldH, theme, drought ? "dusk" : "day", horizonY + 8);

  // A treeline on the skyline, drawn from the producer colour so it belongs.
  ctx.fillStyle = blend(producer, theme.ink, dark ? 0.45 : 0.35);
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  for (let i = 0; i <= 34; i++) {
    const tx = (i / 34) * width;
    const th = 5 + hash(i, 3) * 13;
    ctx.lineTo(tx, horizonY + 2 - th);
    ctx.lineTo(tx + width / 68, horizonY + 2);
  }
  ctx.lineTo(width, horizonY + 2);
  ctx.closePath();
  ctx.fill();

  /* --- the meadow --------------------------------------------------- */
  groundPlane(ctx, horizonY, 0, width, fieldH, theme, "soil");

  // Grass biomass per cell, over bare soil. Opacity carries the biomass, so a
  // grazed patch really does read as bare earth.
  ctx.fillStyle = producer;
  for (let gy = 0; gy < GRID_H; gy++) {
    // Cells further away sit closer to the horizon and are drawn slightly darker.
    for (let gx = 0; gx < GRID_W; gx++) {
      const g = state.grass[gy * GRID_W + gx];
      if (g <= 0.02) continue;
      ctx.globalAlpha = 0.14 + 0.82 * g;
      ctx.fillRect(gx * cellW, fieldH - (gy + 1) * cellH, cellW + 0.6, cellH + 0.6);
    }
  }
  ctx.globalAlpha = 1;

  // Blades on the lush cells, batched into one path so the cost stays flat.
  ctx.strokeStyle = blend(producer, theme.surface, dark ? 0.15 : 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const idx = gy * GRID_W + gx;
      if (state.grass[idx] < 0.55) continue;
      const bx = gx * cellW + hash(idx, 1) * cellW;
      const by = fieldH - (gy + 0.5) * cellH;
      const bh = 3 + hash(idx, 2) * cellH * 0.5;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (hash(idx, 4) - 0.5) * 3, by - bh);
    }
  }
  ctx.stroke();

  // Depth: the far end of the meadow sits in haze.
  const haze = ctx.createLinearGradient(0, horizonY, 0, horizonY + fieldH * 0.3);
  haze.addColorStop(0, hexA(theme.surface, dark ? 0.28 : 0.45));
  haze.addColorStop(1, hexA(theme.surface, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizonY, width, fieldH * 0.3);

  if (drought) {
    ctx.fillStyle = hexA(theme.sci["hot"], 0.16);
    ctx.fillRect(0, horizonY, width, fieldH - horizonY);
  }
  ctx.restore();

  /* --- animals ---------------------------------------------------- */
  const rRadius = band === "K-2" ? 6 : 4.4;
  const fRadius = band === "K-2" ? 8 : 6.4;
  const rabbitColor = theme.sci["primary-consumer"];
  const foxColor = theme.sci["secondary-consumer"];
  const toY = (y: number) => fieldH - y * cellH;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let i = 0; i < state.rabbits.length; i++) {
    const a = state.rabbits[i];
    footShadow(ctx, a.x * cellW, toY(a.y), rRadius);
  }
  for (let i = 0; i < state.foxes.length; i++) {
    const a = state.foxes[i];
    footShadow(ctx, a.x * cellW, toY(a.y), fRadius);
  }
  ctx.restore();

  // Ears first, so they sit behind the body and read as attached to it.
  ctx.save();
  ctx.strokeStyle = blend(rabbitColor, theme.ink, 0.25);
  ctx.lineWidth = Math.max(1.4, rRadius * 0.34);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < state.rabbits.length; i++) {
    const a = state.rabbits[i];
    const ax = a.x * cellW, ay = toY(a.y);
    const ex = Math.cos(a.dir), ey = -Math.sin(a.dir);
    ctx.moveTo(ax + ex * rRadius * 0.3 - ey * rRadius * 0.35, ay + ey * rRadius * 0.3 + ex * rRadius * 0.35);
    ctx.lineTo(ax + ex * rRadius * 1.5 - ey * rRadius * 0.5, ay + ey * rRadius * 1.5 + ex * rRadius * 0.5);
    ctx.moveTo(ax + ex * rRadius * 0.3 + ey * rRadius * 0.35, ay + ey * rRadius * 0.3 - ex * rRadius * 0.35);
    ctx.lineTo(ax + ex * rRadius * 1.5 + ey * rRadius * 0.5, ay + ey * rRadius * 1.5 - ex * rRadius * 0.5);
  }
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < state.rabbits.length; i++) {
    const a = state.rabbits[i];
    sphere(ctx, a.x * cellW, toY(a.y), rRadius, rabbitColor, { rim: false });
  }

  // Foxes get a brush tail, which is the only cue needed to tell them apart.
  ctx.save();
  ctx.strokeStyle = blend(foxColor, theme.ink, 0.2);
  ctx.lineWidth = Math.max(2, fRadius * 0.45);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < state.foxes.length; i++) {
    const a = state.foxes[i];
    const ax = a.x * cellW, ay = toY(a.y);
    const ex = Math.cos(a.dir), ey = -Math.sin(a.dir);
    ctx.moveTo(ax - ex * fRadius * 0.6, ay - ey * fRadius * 0.6);
    ctx.lineTo(ax - ex * fRadius * 1.9, ay - ey * fRadius * 1.9);
  }
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < state.foxes.length; i++) {
    const a = state.foxes[i];
    const fx = a.x * cellW;
    const fy = toY(a.y);
    if (overlays.hunting && band !== "K-2") {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = foxColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(fx, fy, CATCH_RADIUS * cellW, CATCH_RADIUS * cellH, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    sphere(ctx, fx, fy, fRadius, foxColor, { rim: false });
    // Snout, pointing where it is heading.
    sphere(
      ctx, fx + Math.cos(a.dir) * fRadius * 0.85, fy - Math.sin(a.dir) * fRadius * 0.85,
      fRadius * 0.45, blend(foxColor, theme.surface, 0.2), { rim: false },
    );
  }

  /* --- state banners ---------------------------------------------- */
  if (drought) {
    badge(ctx, width / 2, 20, "Drought", theme, { align: "center", color: theme.sci["hot"] });
  }
  if (band !== "K-2") {
    badge(ctx, 10, 20, `Year ${Math.floor(state.year)}`, theme, { color: theme.accent });
    badge(ctx, width - 10, 20, `${state.rabbits.length}`, theme, {
      align: "right", color: theme.sci["primary-consumer"], sub: "rabbits",
    });
    badge(ctx, width - 92, 20, `${state.foxes.length}`, theme, {
      align: "right", color: theme.sci["secondary-consumer"], sub: "foxes",
    });
  }
  if (state.rabbits.length === 0) {
    caption(ctx, width / 2, fieldH / 2, "No rabbits left", theme, {
      align: "center", color: theme.sci["primary-consumer"], size: 17, weight: 800,
    });
  }

  vignette(ctx, width, fieldH, 0.16);

  if (showGraph) drawGraph(rc, 0, fieldH + 8, width, graphH - 8);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const ecosystemSim: SimManifest<State> = {
  id: "bio.ecosystem",
  title: "Ecosystem Simulator",
  tagline: "Let grass, rabbits and foxes loose, then watch the populations chase each other.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: {
    ngss: ["3-LS4-4", "5-LS2-1", "MS-LS2-1", "MS-LS2-4", "HS-LS2-6"],
  },
  learningGoals: [
    "Trace energy from producers to primary and secondary consumers.",
    "Explain why predator and prey numbers rise and fall out of step.",
    "Predict what removing a predator does to the plants at the bottom of the food chain.",
  ],
  misconceptions: [
    "Removing predators is always good for the prey",
    "Ecosystems sit at a fixed balance rather than cycling",
    "Populations grow forever if there is enough food",
  ],
  interactionHint: "Press play and watch the graph at the bottom for a few dozen years.",
  tickRate: 24,
  timeScale: 2,
  params: {
    rabbits0: {
      type: "number", label: "Starting rabbits", kind: "population",
      min: 0, max: 150, step: 5, default: 60,
      hideValueBands: ["K-2"],
      help: "Changing this starts a brand new meadow.",
    },
    foxes0: {
      type: "number", label: "Starting foxes", kind: "population",
      min: 0, max: 45, step: 1, default: 20,
      help: "Set this to zero to find out what predators are actually doing.",
    },
    grassRegrowth: {
      type: "number", label: "Grass regrowth", kind: "ratio",
      min: 0.4, max: 4, step: 0.1, default: 2.4,
      bands: ["3-5", "6-8", "9-12"],
      help: "How fast a grazed patch grows back, per year.",
    },
    rabbitBirth: {
      type: "number", label: "Rabbit birth rate", kind: "ratio",
      min: 0.2, max: 3, step: 0.1, default: 1.5,
      bands: ["6-8", "9-12"],
      help: "Chances per year that a well-fed rabbit has a litter.",
    },
    foxBirth: {
      type: "number", label: "Fox birth rate", kind: "ratio",
      min: 0.1, max: 2, step: 0.1, default: 0.9,
      bands: ["6-8", "9-12"],
    },
    event: {
      type: "option", label: "Event at year 30",
      options: [
        { value: "none", label: "Nothing" },
        { value: "drought", label: "Drought" },
        { value: "predator", label: "More foxes arrive" },
      ],
      default: "none",
      bands: ["3-5", "6-8", "9-12"],
      help: "A shock partway through, so you can see how the system recovers.",
    },
  },
  overlays: [
    { key: "graph", label: "Population graph", default: true },
    { key: "hunting", label: "Fox hunting range", default: false, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "remove-foxes",
      title: "What happens if you remove the foxes?",
      question: "If we take the predators away, do the rabbits do better or worse?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS2-4"],
      setup: { rabbits0: 60, foxes0: 20, grassRegrowth: 2.4, rabbitBirth: 1.5, foxBirth: 0.9, event: "none" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit to an answer before you run anything.",
          predict: {
            prompt: "You delete every fox. What happens to the rabbits over the next 50 years?",
            options: [
              "Rabbits stay high forever",
              "Rabbits boom, eat the grass down, then crash",
              "Rabbits die out immediately",
            ],
            correct: 1,
            reveal:
              "Without foxes the rabbits are limited only by grass. They overshoot the food supply, strip the meadow, and then starve back down.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Run the meadow as it is",
          instruction: "Play to about year 40. Record grass, rabbits and foxes a few times.",
          requireData: 4,
          hints: [
            "Speed the clock up — the cycle takes decades.",
            "Look at the graph: the fox line follows the rabbit line, a little behind.",
          ],
        },
        {
          id: "no-foxes",
          phase: "setup",
          title: "Delete the foxes",
          instruction: "Set starting foxes to 0. That restarts the meadow.",
          check: {
            describe: "Starting foxes is 0",
            test: (v) => (v.params.foxes0 as number) === 0,
          },
        },
        {
          id: "boom",
          phase: "measure",
          title: "Run it again",
          instruction: "Play past year 40 and record what grass and rabbits do.",
          requireData: 8,
          hints: [
            "Watch the grass line, not just the rabbit line.",
            "The rabbit peak comes first; the crash comes after the grass runs out.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say what foxes were doing for the grass.",
          write: {
            prompt: "Were the foxes good or bad for the rabbits in the long run? Use your data.",
            placeholder: "Without foxes the rabbits ... which meant the grass ...",
          },
        },
      ],
    },
    {
      id: "find-balance",
      title: "Find a balance that survives 50 years",
      question: "Which settings let grass, rabbits and foxes all still be here in 50 years?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-LS2-1", "HS-LS2-6"],
      setup: { rabbits0: 30, foxes0: 25, grassRegrowth: 0.8, rabbitBirth: 1.5, foxBirth: 1.4, event: "none" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "These settings are unstable. What fails first?",
          predict: {
            prompt: "Grass grows slowly and there are lots of hungry foxes. What collapses first?",
            options: ["The grass", "The rabbits", "The foxes"],
            correct: 1,
            reveal:
              "Rabbits go first: slow grass starves them from below while the foxes eat them from above. The foxes then follow them down.",
          },
        },
        {
          id: "watch-collapse",
          phase: "measure",
          title: "Watch it fail",
          instruction: "Run to year 50 and record what is left.",
          requireData: 3,
        },
        {
          id: "tune",
          phase: "setup",
          title: "Fix it",
          instruction: "Change the sliders until all three are alive at year 50.",
          check: {
            describe: "Year 50 reached with grass, rabbits and foxes all present",
            test: (v) => (v.facts.year as number) >= 50 && v.facts.allAlive === true,
          },
          hints: [
            "Faster grass regrowth feeds more rabbits.",
            "Too many foxes eat the rabbits faster than they can breed.",
            "Aim for a wobble, not a flat line — real ecosystems cycle.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Describe what a surviving meadow needs.",
          write: {
            prompt: "What has to be true about grass, rabbits and foxes for all three to last?",
            placeholder: "Each level needs ... compared with the level below it, because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "century",
      title: "A hundred good years",
      brief: "Keep grass, rabbits and foxes all alive for 100 years.",
      bands: ["6-8", "9-12"],
      setup: { rabbits0: 60, foxes0: 20, grassRegrowth: 2.4, rabbitBirth: 1.5, foxBirth: 0.9, event: "none" },
      goal: {
        describe: "Year 100 with all three still present",
        test: (v) => (v.facts.year as number) >= 100 && v.facts.allAlive === true,
      },
      stars: {
        two: {
          describe: "Survive 100 years with a drought partway through",
          test: (v) =>
            (v.facts.year as number) >= 100 && v.facts.allAlive === true &&
            v.params.event === "drought",
        },
        three: {
          describe: "Survive a drought and never drop below 5 foxes",
          test: (v) =>
            (v.facts.year as number) >= 100 && v.facts.allAlive === true &&
            v.params.event === "drought" && (v.facts.foxes as number) >= 5,
        },
      },
      hints: [
        "Small populations die out by bad luck. Give yourself numbers to spare.",
        "Grass regrowth is the ceiling on everything above it.",
      ],
    },
    {
      id: "rabbit-plague",
      title: "Rabbit plague",
      brief: "Get more than 150 rabbits alive at once — then see how long it lasts.",
      bands: ["3-5", "6-8"],
      setup: { rabbits0: 40, foxes0: 0, grassRegrowth: 3.6, rabbitBirth: 2.4, foxBirth: 0.9, event: "none" },
      goal: {
        describe: "Peak rabbit population above 150",
        test: (v) => (v.facts.peakRabbits as number) > 150,
      },
      stars: {
        two: {
          describe: "Still above 150 rabbits at year 40",
          test: (v) => (v.facts.year as number) >= 40 && (v.facts.rabbits as number) > 150,
        },
      },
      hints: ["Rabbits need grass faster than they eat it.", "Foxes make this much harder."],
    },
  ],
};
