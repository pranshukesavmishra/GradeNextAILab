import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { disc, label, roundRect } from "@ui/draw";

/**
 * Natural Selection — Grades 6-12.
 *
 * A population of bunnies carrying one of two fur alleles, living somewhere
 * that either hides them or shows them up. Nothing selects the "right" allele:
 * a predator simply finds a poorly camouflaged bunny more often, that bunny is
 * more likely to die before it breeds, and the frequency of its allele in the
 * next generation is lower as a result. Allele frequency is therefore an
 * *output* of the sim, never an input.
 *
 * The model is haploid — each bunny carries one copy of the fur gene and
 * passes it to its offspring, with a small chance of mutation. That keeps
 * "allele frequency" and "percentage with that fur" the same number, which is
 * the right simplification before Hardy-Weinberg is introduced.
 */

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

const LIGHT = 1;
const DARK = 0;

/** Hard cap: 400 bunnies is the most the stage can show and the frame afford. */
const MAX_BUNNIES = 400;

/** Seconds of simulated time in one generation. */
const GEN_SECONDS = 1.2;

/** Predation hazard per second for a completely exposed bunny. */
const PREDATION_BASE = 1.2;
/** Starvation hazard per second when the population sits at the food limit. */
const CROWDING_BASE = 0.5;
/** Mean offspring per surviving bunny, per generation. */
const OFFSPRING = 1.1;

const HOP_SPEED = 0.055;   // field widths per second
const TURN_JITTER = 3.2;

const HISTORY_MAX = 120;
const MARKS_MAX = 24;
/** Generation at which a melting climate flips snow to grass. */
const MELT_GENERATION = 25;

/**
 * How well each allele hides in each place. These are the only numbers in the
 * sim that encode "which fur is better", and they are properties of the
 * *environment*, not of the gene — swap the environment and they swap over.
 */
function camouflage(env: string, allele: number): number {
  if (env === "snow") return allele === LIGHT ? 0.92 : 0.1;
  if (env === "grass") return allele === LIGHT ? 0.12 : 0.88;
  return 0.5; // patchy ground hides both equally
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Bunny {
  x: number;      // 0..1 across the field
  y: number;      // 0..1 up the field
  dir: number;
  allele: number; // LIGHT | DARK
}

interface Mark {
  x: number;
  y: number;
  age: number;
}

interface State {
  bunnies: Bunny[];
  generation: number;
  genClock: number;
  melted: boolean;
  /** Fade-out markers where a bunny was just caught. */
  marks: Mark[];
  histGen: number[];
  histLight: number[];
  histPop: number[];
  caughtLight: number;
  caughtDark: number;
  starved: number;
  peakLightFraction: number;
}

function newBunny(rng: Rng, allele: number): Bunny {
  return { x: rng.next(), y: rng.next(), dir: rng.range(0, Math.PI * 2), allele };
}

function buildPopulation(params: ParamValues, rng: Rng): State {
  const n = Math.min(MAX_BUNNIES, Math.round(params.startCount as number));
  const lightShare = params.startLight as number;
  const bunnies: Bunny[] = [];
  for (let i = 0; i < n; i++) {
    bunnies.push(newBunny(rng, rng.chance(lightShare) ? LIGHT : DARK));
  }
  const light = bunnies.reduce((s, b) => s + b.allele, 0);
  const frac = n > 0 ? light / n : 0;
  return {
    bunnies,
    generation: 0,
    genClock: 0,
    melted: false,
    marks: [],
    histGen: [0],
    histLight: [frac],
    histPop: [n],
    caughtLight: 0,
    caughtDark: 0,
    starved: 0,
    peakLightFraction: frac,
  };
}

/** The environment actually in force, once a melting climate is accounted for. */
function activeEnvironment(state: State, params: ParamValues): string {
  const env = params.environment as string;
  if (state.melted && env === "snow") return "grass";
  return env;
}

function lightFraction(bunnies: Bunny[]): number {
  if (bunnies.length === 0) return 0;
  let light = 0;
  for (let i = 0; i < bunnies.length; i++) light += bunnies[i].allele;
  return light / bunnies.length;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    return buildPopulation(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    // Restart only when the founding population itself is redefined. Changing
    // the environment or the predators mid-run is the whole point of the sim.
    if (params.startCount !== prev.startCount || params.startLight !== prev.startLight) {
      return buildPopulation(params, ctx.rng);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rng = ctx.rng;
    const env = activeEnvironment(state, params);
    const predation = params.predation as number;
    const food = params.foodSupply as number;

    /* --- move, then live or die ----------------------------------- */
    const crowding = CROWDING_BASE * Math.pow(state.bunnies.length / Math.max(food, 1), 2);
    const hop = HOP_SPEED * dt;
    const turn = TURN_JITTER * Math.sqrt(dt);
    const survivors: Bunny[] = [];
    let marks = state.marks;
    let caughtLight = state.caughtLight;
    let caughtDark = state.caughtDark;
    let starved = state.starved;
    let newMarks: Mark[] | null = null;

    for (let i = 0; i < state.bunnies.length; i++) {
      const b = state.bunnies[i];
      const dir = b.dir + rng.normal(0, turn);
      let x = b.x + Math.cos(dir) * hop;
      let y = b.y + Math.sin(dir) * hop;
      // Bounce off the fence rather than wrapping — the field is a meadow.
      if (x < 0) x = -x;
      if (x > 1) x = 2 - x;
      if (y < 0) y = -y;
      if (y > 1) y = 2 - y;

      const exposure = 1 - camouflage(env, b.allele);
      const predHazard = PREDATION_BASE * predation * exposure;
      if (rng.chance(predHazard * dt)) {
        if (b.allele === LIGHT) caughtLight++; else caughtDark++;
        if (!newMarks) newMarks = marks.slice();
        newMarks.push({ x, y, age: 0 });
        continue;
      }
      if (rng.chance(crowding * dt)) {
        starved++;
        continue;
      }
      survivors.push({ x, y, dir, allele: b.allele });
    }

    /* --- fade the catch markers ----------------------------------- */
    const source = newMarks ?? marks;
    if (source.length > 0) {
      const kept: Mark[] = [];
      for (let i = 0; i < source.length; i++) {
        const age = source[i].age + dt;
        if (age < 0.6) kept.push({ x: source[i].x, y: source[i].y, age });
      }
      marks = kept.length > MARKS_MAX ? kept.slice(kept.length - MARKS_MAX) : kept;
    } else {
      marks = source;
    }

    /* --- breed at the generation boundary -------------------------- */
    let generation = state.generation;
    let genClock = state.genClock + dt;
    let melted = state.melted;
    let histGen = state.histGen;
    let histLight = state.histLight;
    let histPop = state.histPop;
    let population = survivors;

    if (genClock >= GEN_SECONDS) {
      genClock -= GEN_SECONDS;
      generation += 1;

      const mutation = params.mutationRate as number;
      const whole = Math.floor(OFFSPRING);
      const extra = OFFSPRING - whole;
      const next = survivors.slice();
      for (let i = 0; i < survivors.length && next.length < MAX_BUNNIES; i++) {
        const parent = survivors[i];
        let litter = whole;
        if (rng.chance(extra)) litter += 1;
        for (let k = 0; k < litter && next.length < MAX_BUNNIES; k++) {
          // Offspring inherit the parent's allele; mutation flips it rarely.
          const allele = rng.chance(mutation) ? 1 - parent.allele : parent.allele;
          next.push({
            x: parent.x, y: parent.y, dir: rng.range(0, Math.PI * 2), allele,
          });
        }
      }
      population = next;

      if ((params.snowMelts as boolean) && !melted && generation >= MELT_GENERATION) {
        melted = true;
      }

      const drop = histGen.length >= HISTORY_MAX ? 1 : 0;
      histGen = histGen.slice(drop);
      histLight = histLight.slice(drop);
      histPop = histPop.slice(drop);
      histGen.push(generation);
      histLight.push(lightFraction(population));
      histPop.push(population.length);
    }

    const frac = lightFraction(population);
    return {
      bunnies: population,
      generation,
      genClock,
      melted,
      marks,
      histGen,
      histLight,
      histPop,
      caughtLight,
      caughtDark,
      starved,
      peakLightFraction: Math.max(state.peakLightFraction, frac),
    };
  },

  readouts(state) {
    const n = state.bunnies.length;
    const light = lightFraction(state.bunnies);
    return [
      {
        key: "population", label: "Bunnies", quantity: q(n, "population"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "lightPercent", label: "Light fur", quantity: q(light, "percent"), unit: "%",
        semantic: "cold", graphable: true,
      },
      {
        key: "darkPercent", label: "Dark fur", quantity: q(n > 0 ? 1 - light : 0, "percent"), unit: "%",
        semantic: "decomposer", graphable: true,
      },
      {
        key: "generation", label: "Generation", quantity: q(state.generation, "count"),
        semantic: "time", graphable: false,
      },
      {
        key: "caughtLight", label: "Light bunnies caught", quantity: q(state.caughtLight, "count"),
        semantic: "cold", graphable: false, bands: ["9-12"],
      },
      {
        key: "caughtDark", label: "Dark bunnies caught", quantity: q(state.caughtDark, "count"),
        semantic: "decomposer", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const n = state.bunnies.length;
    const light = lightFraction(state.bunnies);
    return {
      generation: state.generation,
      population: n,
      lightFraction: light,
      darkFraction: n > 0 ? 1 - light : 0,
      peakLightFraction: state.peakLightFraction,
      extinct: n === 0,
      environment: activeEnvironment(state, params),
      caughtLight: state.caughtLight,
      caughtDark: state.caughtDark,
      starved: state.starved,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Ground tint for the place the bunnies are actually living in. */
function groundColor(env: string, theme: RenderContext<State>["theme"]): [string, number] {
  if (env === "snow") return [theme.sci["cold"], 0.14];
  if (env === "grass") return [theme.sci["producer"], 0.42];
  return [theme.sci["producer"], 0.24];
}

function drawHistory(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const n = state.histGen.length;

  ctx.save();
  ctx.fillStyle = theme.sci["decomposer"];
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.restore();

  if (n >= 2) {
    // A stacked band: the light share fills from the top, the dark share is
    // whatever is left, so the crossover is impossible to miss.
    const g0 = state.histGen[0];
    const g1 = Math.max(state.histGen[n - 1], g0 + 1);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < n; i++) {
      const px = x + ((state.histGen[i] - g0) / (g1 - g0)) * w;
      ctx.lineTo(px, y + state.histLight[i] * h);
    }
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fillStyle = theme.sci["cold"];
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5);
  ctx.stroke();
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const env = activeEnvironment(state, params);

  const showHistory = overlays.history !== false && band !== "K-2";
  const histH = showHistory ? Math.round(height * 0.2) : 0;
  const fieldH = height - histH - (showHistory ? 8 : 0);

  /* --- ground ----------------------------------------------------- */
  const [groundHex, groundAlpha] = groundColor(env, theme);
  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, width, fieldH);
  ctx.globalAlpha = groundAlpha;
  ctx.fillStyle = groundHex;
  ctx.fillRect(0, 0, width, fieldH);
  ctx.restore();

  /* --- catch markers ---------------------------------------------- */
  for (let i = 0; i < state.marks.length; i++) {
    const m = state.marks[i];
    const t = 1 - m.age / 0.6;
    disc(ctx, m.x * width, fieldH - m.y * fieldH, 6 + 14 * (1 - t), theme.sci["secondary-consumer"], {
      alpha: 0.45 * t,
    });
  }

  /* --- bunnies ----------------------------------------------------- */
  const lightFur = theme.sci["cold"];
  const darkFur = theme.sci["decomposer"];
  const r = band === "K-2" ? 7 : state.bunnies.length > 220 ? 3.5 : 5;
  for (let i = 0; i < state.bunnies.length; i++) {
    const b = state.bunnies[i];
    disc(ctx, b.x * width, fieldH - b.y * fieldH, r, b.allele === LIGHT ? lightFur : darkFur);
  }

  /* --- legend and status ------------------------------------------- */
  const frac = lightFraction(state.bunnies);
  disc(ctx, 16, 16, 6, lightFur);
  label(ctx, "light fur", 26, 16, theme, { size: 11, color: theme.inkSoft, plate: false });
  disc(ctx, 96, 16, 6, darkFur);
  label(ctx, "dark fur", 106, 16, theme, { size: 11, color: theme.inkSoft, plate: false });

  if (band !== "K-2") {
    label(
      ctx,
      `Generation ${state.generation}   ${state.bunnies.length} bunnies   ${Math.round(frac * 100)}% light`,
      width - 8, 16, theme, { align: "right", size: 12, color: theme.inkSoft },
    );
  }
  if (state.melted) {
    label(ctx, "The snow melted", width / 2, fieldH - 16, theme, {
      align: "center", size: 12, color: theme.sci["hot"],
    });
  }
  if (state.bunnies.length === 0) {
    label(ctx, "The population died out", width / 2, fieldH / 2, theme, {
      align: "center", size: 15, color: theme.sci["secondary-consumer"],
    });
  }

  if (showHistory) drawHistory(rc, 0, fieldH + 8, width, histH - 8);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const naturalSelectionSim: SimManifest<State> = {
  id: "bio.natural-selection",
  title: "Natural Selection",
  tagline: "Set the ground, set the predators, and watch which fur colour is left after twenty generations.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: {
    ngss: ["MS-LS4-4", "MS-LS4-6", "HS-LS4-2", "HS-LS4-3", "HS-LS4-4"],
  },
  learningGoals: [
    "Explain how differences that already exist become common through survival, not effort.",
    "Predict which trait spreads when the environment changes.",
    "Describe where new variation comes from, and why mutation alone is slow.",
  ],
  misconceptions: [
    "Individual animals change their own fur to fit in",
    "Animals evolve because they need to",
    "Natural selection creates the trait it favours",
  ],
  interactionHint: "Press play. Watch which colour keeps disappearing.",
  tickRate: 60,
  timeScale: 1,
  params: {
    environment: {
      type: "option", label: "Where they live",
      options: [
        { value: "snow", label: "Snow" },
        { value: "grass", label: "Grass" },
        { value: "patchy", label: "Patchy ground" },
      ],
      default: "snow",
      help: "Change this while it is running and watch the population turn around.",
    },
    predation: {
      type: "number", label: "Predators", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.6,
      hideValueBands: ["K-2", "3-5"],
      help: "Turn this to zero and nothing is selected — the alleles just drift.",
    },
    foodSupply: {
      type: "number", label: "Food supply", kind: "population",
      min: 20, max: 320, step: 10, default: 120,
      bands: ["3-5", "6-8", "9-12"],
      help: "How many bunnies this meadow can feed.",
    },
    mutationRate: {
      type: "number", label: "Mutation rate", kind: "ratio",
      min: 0, max: 0.1, step: 0.005, default: 0.01,
      bands: ["6-8", "9-12"],
      help: "Chance that a baby's fur gene copies wrongly.",
    },
    startCount: {
      type: "number", label: "Starting bunnies", kind: "population",
      min: 10, max: 120, step: 5, default: 40,
      bands: ["6-8", "9-12"],
    },
    startLight: {
      type: "number", label: "Light fur at the start", kind: "percent", unit: "%",
      min: 0, max: 1, step: 0.05, default: 0.5,
      bands: ["6-8", "9-12"],
      help: "Changing this founds a brand new population.",
    },
    snowMelts: {
      type: "boolean", label: "Snow melts at generation 25", default: false,
      bands: ["6-8", "9-12"],
      help: "A warming climate turns the snow field into grass partway through.",
    },
  },
  overlays: [
    { key: "history", label: "Allele history", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "snow-fur",
      title: "Which fur colour survives on snow?",
      question: "On a snow field with hunting predators, which fur colour takes over?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS4-4"],
      setup: {
        environment: "snow", predation: 0.6, foodSupply: 120,
        mutationRate: 0.01, startCount: 40, startLight: 0.5, snowMelts: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Half the bunnies are light, half are dark. Commit before you run it.",
          predict: {
            prompt: "After 20 generations on snow, what will the population look like?",
            options: [
              "Still about half and half",
              "Almost all light fur",
              "Almost all dark fur",
              "The dark bunnies will turn light",
            ],
            correct: 1,
            reveal:
              "Almost all light. No bunny changes colour — the dark ones are simply seen and caught more often, so they leave fewer babies.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run 20 generations",
          instruction: "Play until generation 20. Record the percentages a few times on the way.",
          requireData: 4,
          check: {
            describe: "Reached generation 20",
            test: (v) => (v.facts.generation as number) >= 20,
          },
          hints: [
            "Speed the clock up if it feels slow.",
            "Watch the band at the bottom: it is the light share, generation by generation.",
          ],
        },
        {
          id: "no-predators",
          phase: "analyze",
          title: "Now remove the predators",
          instruction: "Set Predators to 0 and run 20 more generations.",
          check: {
            describe: "Predators set to zero",
            test: (v) => (v.params.predation as number) === 0,
          },
          hints: ["With nothing hunting them, is either colour better?"],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say what actually changed, and what did not.",
          write: {
            prompt: "Did any bunny change colour? Then why did the population change colour?",
            placeholder: "No individual bunny changed, but ...",
          },
        },
      ],
    },
    {
      id: "environment-change",
      title: "What happens when the environment changes?",
      question: "A population that is nearly all light fur suddenly lives on grass. What happens?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS4-6", "HS-LS4-4"],
      setup: {
        environment: "snow", predation: 0.7, foodSupply: 140,
        mutationRate: 0.01, startCount: 40, startLight: 0.5, snowMelts: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You will run to nearly all light fur, then switch the ground to grass.",
          predict: {
            prompt: "After the switch, what happens over the next 20 generations?",
            options: [
              "Nothing — light fur is now fixed forever",
              "Dark fur comes back and takes over",
              "Every bunny dies",
            ],
            correct: 1,
            reveal:
              "Dark fur comes back, but only from the few dark bunnies and mutations still around. If variation had been wiped out completely, the population would have been stuck.",
          },
        },
        {
          id: "fix-light",
          phase: "measure",
          title: "Drive light fur up",
          instruction: "Run on snow until light fur is above 85%.",
          check: {
            describe: "Light fur above 85%",
            test: (v) => (v.facts.lightFraction as number) >= 0.85,
          },
        },
        {
          id: "switch",
          phase: "setup",
          title: "Melt the snow",
          instruction: "Change the ground to Grass and keep running.",
          check: {
            describe: "Living on grass",
            test: (v) => v.facts.environment === "grass",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Watch it reverse",
          instruction: "Run until dark fur is back above half. Record as you go.",
          requireData: 4,
          hints: [
            "Where do the dark bunnies come from if there were almost none left?",
            "Try turning the mutation rate up and repeating.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say why variation matters for surviving change.",
          write: {
            prompt: "Why is a population with only one fur colour in danger when its world changes?",
            placeholder: "If every bunny is the same, then when the ground changes ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "light-fixation",
      title: "Snow rabbit",
      brief: "Get light fur above 90% of the population without letting the bunnies die out.",
      bands: ["6-8", "9-12"],
      setup: {
        environment: "grass", predation: 0.4, foodSupply: 120,
        mutationRate: 0.01, startCount: 40, startLight: 0.5, snowMelts: false,
      },
      goal: {
        describe: "Light fur above 90% with at least 20 bunnies alive",
        test: (v) => (v.facts.lightFraction as number) >= 0.9 && (v.facts.population as number) >= 20,
      },
      stars: {
        two: {
          describe: "Do it within 20 generations",
          test: (v) =>
            (v.facts.lightFraction as number) >= 0.9 && (v.facts.population as number) >= 20 &&
            (v.facts.generation as number) <= 20,
        },
        three: {
          describe: "Do it within 10 generations and keep 40 bunnies alive",
          test: (v) =>
            (v.facts.lightFraction as number) >= 0.9 && (v.facts.population as number) >= 40 &&
            (v.facts.generation as number) <= 10,
        },
      },
      hints: [
        "The ground decides which colour hides. Predators decide how fast.",
        "Strong predators select faster, but they can also wipe out the whole meadow.",
      ],
    },
    {
      id: "survive-the-melt",
      title: "Survive the melt",
      brief: "Turn the melting snow on and still have 30 bunnies at generation 45.",
      bands: ["9-12"],
      setup: {
        environment: "snow", predation: 0.7, foodSupply: 160,
        mutationRate: 0.02, startCount: 50, startLight: 0.5, snowMelts: true,
      },
      goal: {
        describe: "Generation 45 with at least 30 bunnies and the snow gone",
        test: (v) =>
          (v.facts.generation as number) >= 45 && (v.facts.population as number) >= 30 &&
          v.facts.environment === "grass",
      },
      hints: [
        "A population that loses all its dark alleles before the melt has nothing to work with.",
        "Mutation is the only source of brand new variation.",
      ],
    },
  ],
};
