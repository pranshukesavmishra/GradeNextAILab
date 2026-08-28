import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { camera, disc, label, roundRect } from "@ui/draw";

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

/** The population graph is the payoff, so it gets a third of the stage. */
function drawGraph(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, band } = rc;
  const n = state.histYear.length;

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
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

  const series: [number[], string, number][] = [
    [state.histGrass, theme.sci["producer"], 1],
    [state.histRabbits, theme.sci["primary-consumer"], maxPop],
    [state.histFoxes, theme.sci["secondary-consumer"], maxPop],
  ];

  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  for (const [data, color, scale] of series) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const py = y + h - (Math.min(data[i], scale) / scale) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(px(i), py);
      else ctx.lineTo(px(i), py);
    }
    ctx.stroke();
  }
  ctx.restore();

  if (band !== "K-2") {
    label(ctx, `${Math.round(t0)}–${Math.round(t1)} yr`, x + w - 6, y + 11, theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;

  const showGraph = overlays.graph !== false;
  const graphH = showGraph ? Math.round(height * 0.28) : 0;
  const fieldH = height - graphH - (showGraph ? 8 : 0);

  const cam = camera({
    x0: 0, y0: 0, x1: GRID_W, y1: GRID_H,
    width, height: fieldH, square: false,
  });
  const cellW = cam.scale;
  const cellH = fieldH / GRID_H;

  /* --- the meadow ------------------------------------------------- */
  const producer = theme.sci["producer"];
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  ctx.fillRect(0, 0, width, fieldH);
  ctx.fillStyle = producer;
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const g = state.grass[gy * GRID_W + gx];
      if (g <= 0.02) continue;
      // Opacity carries biomass: grazed patches read as bare ground at a glance.
      ctx.globalAlpha = 0.12 + 0.8 * g;
      ctx.fillRect(gx * cellW, fieldH - (gy + 1) * cellH, cellW + 0.6, cellH + 0.6);
    }
  }
  ctx.restore();

  /* --- animals ---------------------------------------------------- */
  const rRadius = band === "K-2" ? 5.5 : 4;
  const fRadius = band === "K-2" ? 7.5 : 6;
  const rabbitColor = theme.sci["primary-consumer"];
  const foxColor = theme.sci["secondary-consumer"];

  for (let i = 0; i < state.rabbits.length; i++) {
    const a = state.rabbits[i];
    disc(ctx, a.x * cellW, fieldH - a.y * cellH, rRadius, rabbitColor, {
      stroke: theme.surface, lineWidth: 1,
    });
  }
  for (let i = 0; i < state.foxes.length; i++) {
    const a = state.foxes[i];
    const px = a.x * cellW;
    const py = fieldH - a.y * cellH;
    disc(ctx, px, py, fRadius, foxColor, { stroke: theme.surface, lineWidth: 1.2 });
    if (overlays.hunting && band !== "K-2") {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = foxColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, CATCH_RADIUS * cellW, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* --- state banners ---------------------------------------------- */
  if (state.year < state.droughtUntil) {
    label(ctx, "Drought", width / 2, 16, theme, {
      align: "center", color: theme.sci["hot"], size: band === "K-2" ? 16 : 13,
    });
  }
  if (band !== "K-2") {
    label(
      ctx,
      `Year ${Math.floor(state.year)}   ${state.rabbits.length} rabbits   ${state.foxes.length} foxes`,
      8, 16, theme, { size: 12, color: theme.inkSoft },
    );
  }
  if (state.rabbits.length === 0) {
    label(ctx, "No rabbits left", width / 2, fieldH / 2, theme, {
      align: "center", color: theme.sci["primary-consumer"], size: 15,
    });
  }

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
