import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { disc, label, roundRect } from "@ui/draw";

/**
 * Photosynthesis Lab — Grades 5-12.
 *
 * A sprig of pondweed in a beaker, a lamp, a thermometer and a dissolved-CO₂
 * supply. The oxygen bubble rate is never read from a table: it is computed
 * from a saturating light response, a Michaelis-Menten CO₂ response, and an
 * enzyme temperature curve, combined by Blackman's law of limiting factors —
 * the *slowest* of the supply terms sets the ceiling, so turning up a factor
 * that is already in surplus does nothing at all. That plateau is the concept
 * the whole sim exists to make visible.
 *
 * Respiration runs the whole time and is subtracted, so a compensation point
 * falls out for free: below about 6% light the plant consumes oxygen faster
 * than it makes it and the bubbles stop.
 */

/* ------------------------------------------------------------------ *
 * Physiology
 * ------------------------------------------------------------------ */

/** Bubbles per minute when every factor is saturating. */
const P_MAX = 120;
/** Light level giving half the maximum rate, as a fraction of full sun. */
const K_LIGHT = 0.25;
/** CO₂ concentration giving half the maximum rate, in ppm. */
const K_CO2 = 350;
/** Respiration in bubble-equivalents per minute at 20 °C. */
const R_BASE = 14;

/** Micromoles of O₂ in one bubble (a bubble is roughly one cubic millimetre). */
const UMOL_PER_BUBBLE = 0.04;
/** Grams of glucose per micromole of O₂: 1 glucose per 6 O₂, at 180 g/mol. */
const GLUCOSE_G_PER_UMOL_O2 = (180 / 6) * 1e-6;

/**
 * Chlorophyll absorbs blue and red strongly and reflects green, which is why
 * leaves look green. A green lamp is therefore nearly useless to the plant —
 * the single most surprising result in this sim.
 */
const COLOR_EFFICIENCY: Record<string, number> = {
  white: 1,
  blue: 0.93,
  red: 0.85,
  green: 0.18,
};

/** Enzyme rate roughly doubles per 10 K (Q10 = 2) until proteins denature. */
function q10Rise(tempK: number): number {
  return Math.pow(2, (tempK - 293.15) / 10);
}

/** Denaturation: a soft cliff centred near 33 °C. */
function denature(tempK: number): number {
  return 1 / (1 + Math.exp((tempK - 306.15) / 2));
}

/** Normaliser so the temperature term peaks at exactly 1 (near 29-30 °C). */
const TEMP_PEAK = (() => {
  let best = 0;
  for (let t = 273.15; t <= 323.15; t += 0.05) {
    const v = q10Rise(t) * denature(t);
    if (v > best) best = v;
  }
  return best;
})();

export interface RateBreakdown {
  lightTerm: number;
  co2Term: number;
  tempTerm: number;
  /** Gross photosynthesis, bubbles per minute. */
  gross: number;
  /** Respiration, bubbles per minute. */
  respiration: number;
  /** Net oxygen output, bubbles per minute. Negative below compensation. */
  net: number;
  limiting: "light" | "co2" | "temperature";
  tooHot: boolean;
}

/**
 * The whole model, exported so tests can check the plateau directly rather
 * than inferring it from pixels.
 */
export function photosynthesisRate(params: ParamValues): RateBreakdown {
  const light = params.light as number;
  const co2 = params.co2 as number;
  const tempK = params.temperature as number;
  const efficiency = COLOR_EFFICIENCY[params.lightColor as string] ?? 1;

  const effectiveLight = light * efficiency;
  const lightTerm = effectiveLight / (effectiveLight + K_LIGHT);
  const co2Term = co2 / (co2 + K_CO2);
  const rise = q10Rise(tempK);
  const denat = denature(tempK);
  const tempTerm = (rise * denat) / TEMP_PEAK;

  // Law of limiting factors: the supply terms do not multiply, the smallest
  // one caps the rate. Temperature scales whatever supply allows.
  const gross = P_MAX * Math.min(lightTerm, co2Term) * tempTerm;
  const respiration = R_BASE * rise * denat;

  // The limiting factor is whichever term sits furthest from saturation —
  // the one where a change would actually move the rate.
  let limiting: RateBreakdown["limiting"] = "light";
  let lowest = lightTerm;
  if (co2Term < lowest) { limiting = "co2"; lowest = co2Term; }
  if (tempTerm < lowest) { limiting = "temperature"; lowest = tempTerm; }

  return {
    lightTerm, co2Term, tempTerm,
    gross, respiration,
    net: gross - respiration,
    limiting,
    tooHot: tempK > 306.15,
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Bubble {
  x: number;   // 0..1 across the beaker
  y: number;   // 0..1 up the beaker, from the stem
  r: number;   // relative radius
  phase: number;
}

const MAX_BUBBLES = 120;
const BUBBLE_RISE = 0.16;   // beaker heights per simulated second

interface State {
  bubbles: Bubble[];
  spawnDebt: number;
  /** Bubbles that have reached the collecting tube. */
  collected: number;
  /** Net oxygen actually released, in micromoles. */
  oxygenUmol: number;
  elapsed: number;
  maxNet: number;
}

const model: SimModel<State> = {
  init() {
    return {
      bubbles: [],
      spawnDebt: 0,
      collected: 0,
      oxygenUmol: 0,
      elapsed: 0,
      maxNet: 0,
    };
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rate = photosynthesisRate(params);
    const perSecond = Math.max(0, rate.net) / 60;

    /* --- release bubbles at the computed rate ---------------------- */
    let spawnDebt = state.spawnDebt + perSecond * dt;
    const bubbles: Bubble[] = [];
    let collected = state.collected;

    for (let i = 0; i < state.bubbles.length; i++) {
      const b = state.bubbles[i];
      const y = b.y + BUBBLE_RISE * dt * (0.75 + b.r);
      if (y >= 1) {
        collected++;
        continue;
      }
      bubbles.push({ x: b.x, y, r: b.r, phase: b.phase + dt * 2.4 });
    }
    while (spawnDebt >= 1 && bubbles.length < MAX_BUBBLES) {
      spawnDebt -= 1;
      bubbles.push({
        x: 0.42 + ctx.rng.range(-0.05, 0.05),
        y: 0,
        r: ctx.rng.range(0.5, 1),
        phase: ctx.rng.range(0, Math.PI * 2),
      });
    }
    if (spawnDebt > 4) spawnDebt = 4; // never build a backlog while capped

    return {
      bubbles,
      spawnDebt,
      collected,
      // Net oxygen is signed: a plant below its compensation point runs backwards.
      oxygenUmol: state.oxygenUmol + (rate.net / 60) * dt * UMOL_PER_BUBBLE,
      elapsed: state.elapsed + dt,
      maxNet: Math.max(state.maxNet, rate.net),
    };
  },

  readouts(state, params) {
    const rate = photosynthesisRate(params);
    const glucoseGrams = Math.max(0, state.oxygenUmol) * GLUCOSE_G_PER_UMOL_O2;
    return [
      {
        key: "bubbleRate", label: "Bubbles per minute",
        quantity: q(Math.max(0, rate.net), "count"),
        semantic: "gas", graphable: true,
      },
      {
        key: "collected", label: "Bubbles collected", quantity: q(state.collected, "count"),
        semantic: "gas", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "oxygen", label: "Oxygen made", quantity: q(state.oxygenUmol, "count"),
        semantic: "gas", graphable: true, bands: ["9-12"],
      },
      {
        key: "glucose", label: "Glucose made", quantity: q(glucoseGrams / 1000, "mass"), unit: "g",
        semantic: "energy-potential", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "gross", label: "Photosynthesis rate", quantity: q(rate.gross, "count"),
        semantic: "producer", graphable: true, bands: ["9-12"],
      },
      {
        key: "respiration", label: "Respiration rate", quantity: q(rate.respiration, "count"),
        semantic: "energy-thermal", graphable: true, bands: ["9-12"],
      },
      {
        key: "elapsed", label: "Time", quantity: q(state.elapsed, "time"), unit: "min",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const rate = photosynthesisRate(params);
    return {
      limitingFactor: rate.limiting,
      bubbleRate: Math.max(0, rate.net),
      netRate: rate.net,
      grossRate: rate.gross,
      respirationRate: rate.respiration,
      lightTerm: rate.lightTerm,
      co2Term: rate.co2Term,
      tempTerm: rate.tempTerm,
      tooHot: rate.tooHot,
      collected: state.collected,
      oxygenUmol: state.oxygenUmol,
      elapsedMinutes: state.elapsed / 60,
      maxNet: state.maxNet,
      belowCompensation: rate.net <= 0,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const FACTOR_LABEL: Record<string, string> = {
  light: "Light",
  co2: "CO₂",
  temperature: "Temperature",
};

/** Three bars: the shortest one is the ceiling on everything else. */
function drawFactorBars(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, params, theme } = rc;
  const rate = photosynthesisRate(params);
  const bars: [string, number, string][] = [
    ["Light", rate.lightTerm, theme.sci["light"]],
    ["CO₂", rate.co2Term, theme.sci["gas"]],
    ["Temp", rate.tempTerm, theme.sci["hot"]],
  ];
  const barW = (w - 16) / 3;

  ctx.save();
  for (let i = 0; i < bars.length; i++) {
    const [name, value, color] = bars[i];
    const bx = x + i * (barW + 8);
    const bh = Math.max(2, value * (h - 18));

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = color;
    roundRect(ctx, bx, y, barW, h - 18, 4);
    ctx.fill();

    ctx.globalAlpha = 1;
    roundRect(ctx, bx, y + (h - 18) - bh, barW, bh, 4);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(name, bx + barW / 2, y + h - 15);
  }
  ctx.restore();

  // Mark the limiting bar: the whole point is that it, and only it, matters.
  const index = rate.limiting === "light" ? 0 : rate.limiting === "co2" ? 1 : 2;
  const mx = x + index * (barW + 8) + barW / 2;
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y + (h - 18) * (1 - Math.min(rate.lightTerm, rate.co2Term, rate.tempTerm)));
  ctx.lineTo(x + w - 16, y + (h - 18) * (1 - Math.min(rate.lightTerm, rate.co2Term, rate.tempTerm)));
  ctx.stroke();
  ctx.restore();
  label(ctx, "limiting", mx, y + h - 4, rc.theme, {
    align: "center", size: 10, color: theme.ink,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const rate = photosynthesisRate(params);

  const panelW = overlays.factors !== false && band !== "K-2" ? Math.min(190, width * 0.3) : 0;
  const stageW = width - panelW;

  /* --- lamp -------------------------------------------------------- */
  const lightLevel = params.light as number;
  const lampX = stageW * 0.11;
  const lampY = height * 0.34;
  const lampColor = theme.sci["light"];
  disc(ctx, lampX, lampY, 15, lampColor, { alpha: 0.25 + 0.75 * lightLevel });
  ctx.save();
  ctx.strokeStyle = lampColor;
  ctx.globalAlpha = 0.2 + 0.7 * lightLevel;
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    const a = (i * Math.PI) / 14;
    ctx.beginPath();
    ctx.moveTo(lampX + Math.cos(a) * 20, lampY + Math.sin(a) * 20);
    ctx.lineTo(lampX + Math.cos(a) * (stageW * 0.2), lampY + Math.sin(a) * (stageW * 0.2));
    ctx.stroke();
  }
  ctx.restore();

  /* --- beaker of water --------------------------------------------- */
  const bx = stageW * 0.32;
  const by = height * 0.1;
  const bw = stageW * 0.5;
  const bh = height * 0.82;

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = theme.sci["liquid"];
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.stroke();
  ctx.restore();

  /* --- pondweed ----------------------------------------------------- */
  const stemX = bx + bw * 0.42;
  const producer = theme.sci["producer"];
  ctx.save();
  ctx.strokeStyle = producer;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(stemX, by + bh - 6);
  ctx.lineTo(stemX, by + bh * 0.34);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const ly = by + bh - 16 - i * (bh * 0.1);
    const side = i % 2 === 0 ? 1 : -1;
    ctx.save();
    ctx.fillStyle = producer;
    ctx.beginPath();
    ctx.ellipse(stemX + side * 15, ly, 15, 6, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* --- bubbles ------------------------------------------------------ */
  const gas = theme.sci["gas"];
  const topY = by + bh * 0.3;
  for (let i = 0; i < state.bubbles.length; i++) {
    const b = state.bubbles[i];
    const py = by + bh * 0.34 - b.y * (bh * 0.34 - 8);
    const px = bx + bw * b.x + Math.sin(b.phase) * 4;
    disc(ctx, px, py, 2 + b.r * 3, gas, { alpha: 0.85 });
  }

  /* --- collecting tube ---------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  roundRect(ctx, stemX - 16, by + 4, 32, topY - by, 6);
  ctx.stroke();
  const fill = Math.min(1, state.collected / 400);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = gas;
  roundRect(ctx, stemX - 14, by + 6, 28, Math.max(0, fill * (topY - by - 4)), 5);
  ctx.fill();
  ctx.restore();

  /* --- readable state ------------------------------------------------ */
  if (band !== "K-2") {
    const shown = Math.max(0, rate.net);
    label(ctx, `${shown.toFixed(0)} bubbles/min`, bx + bw / 2, height - 12, theme, {
      align: "center", size: 13, color: theme.sci["gas"],
    });
  }
  if (rate.net <= 0) {
    label(ctx, "No bubbles — respiration wins", bx + bw / 2, by + bh * 0.5, theme, {
      align: "center", size: 12, color: theme.sci["energy-thermal"],
    });
  }
  if (rate.tooHot && band !== "K-2") {
    label(ctx, "Too hot", bx + bw - 8, by + 16, theme, {
      align: "right", size: 11, color: theme.sci["hot"],
    });
  }

  /* --- limiting factor panel ------------------------------------------ */
  if (panelW > 0) {
    const px = stageW + 8;
    const pw = panelW - 16;
    label(ctx, "What is holding it back?", px, 16, theme, {
      size: 11, color: theme.inkSoft, plate: false,
    });
    drawFactorBars(rc, px, 30, pw, height * 0.45);
    label(ctx, FACTOR_LABEL[rate.limiting], px, height * 0.45 + 52, theme, {
      size: 13, color: theme.ink,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const photosynthesisSim: SimManifest<State> = {
  id: "bio.photosynthesis",
  title: "Photosynthesis Lab",
  tagline: "Change the light, the CO₂ and the temperature, and find out which one the plant is actually waiting for.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: {
    ngss: ["5-LS1-1", "MS-LS1-6", "HS-LS1-5"],
  },
  learningGoals: [
    "Identify what a plant takes in to make food, and what it gives out.",
    "Explain why turning up one factor sometimes changes nothing at all.",
    "Find the limiting factor for a given set of conditions.",
  ],
  misconceptions: [
    "Plants get their food from the soil",
    "More of any factor always means more photosynthesis",
    "Plants only respire at night",
  ],
  interactionHint: "Slide the light up and watch the bubbles. Then try the CO₂.",
  tickRate: 30,
  timeScale: 6,
  params: {
    light: {
      type: "number", label: "Light intensity", kind: "percent", unit: "%",
      min: 0, max: 1, step: 0.01, default: 0.6,
      hideValueBands: ["K-2"],
      help: "How bright the lamp is, as a share of full sunlight.",
    },
    co2: {
      type: "number", label: "CO₂ level (ppm)", kind: "ratio",
      min: 0, max: 1600, step: 50, default: 400,
      marks: [
        { value: 400, label: "Air" },
        { value: 1000, label: "Greenhouse" },
      ],
      help: "Dissolved carbon dioxide, in parts per million. Outdoor air is about 400.",
    },
    temperature: {
      type: "number", label: "Water temperature", kind: "temperature", unit: "°C",
      min: 278.15, max: 318.15, step: 1, default: 293.15,
      bands: ["3-5", "6-8", "9-12"],
      marks: [
        { value: 293.15, label: "20 °C" },
        { value: 303.15, label: "30 °C" },
      ],
      help: "Enzymes speed up as it warms, then break above about 35 °C.",
    },
    lightColor: {
      type: "option", label: "Lamp colour",
      options: [
        { value: "white", label: "White" },
        { value: "blue", label: "Blue" },
        { value: "red", label: "Red" },
        { value: "green", label: "Green" },
      ],
      default: "white",
      bands: ["6-8", "9-12"],
      help: "Leaves look green because they reflect green light instead of using it.",
    },
  },
  overlays: [
    { key: "factors", label: "Limiting factor bars", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "what-plants-need",
      title: "What does a plant need to make food?",
      question: "Which things does the pondweed actually need to make oxygen?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["5-LS1-1", "MS-LS1-6"],
      setup: { light: 0.6, co2: 400, temperature: 293.15, lightColor: "white" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you touch a slider.",
          predict: {
            prompt: "You turn the lamp all the way off. What happens to the bubbles?",
            options: [
              "They keep coming at the same rate",
              "They stop completely",
              "They come out twice as fast",
            ],
            correct: 1,
            reveal:
              "They stop. Without light there is no photosynthesis at all — and the plant keeps respiring, so it is actually using oxygen up.",
          },
        },
        {
          id: "dark",
          phase: "measure",
          title: "Turn the light off",
          instruction: "Set light to 0 and watch. Record the bubble rate.",
          check: {
            describe: "Light off and no bubbles",
            test: (v) => (v.params.light as number) === 0 && (v.facts.bubbleRate as number) === 0,
          },
        },
        {
          id: "light-series",
          phase: "measure",
          title: "Turn the light up in steps",
          instruction: "Try 20%, 40%, 60%, 80% and 100%. Record the rate each time.",
          requireData: 5,
          hints: [
            "Change only the light. CO₂ and temperature stay where they are.",
            "Notice the steps get smaller near the top. Something else is taking over.",
          ],
        },
        {
          id: "co2-series",
          phase: "measure",
          title: "Now try the CO₂",
          instruction: "Keep the light at 100% and raise the CO₂ instead. Record three rates.",
          requireData: 8,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the recipe",
          instruction: "List what goes in and what comes out.",
          write: {
            prompt: "What does the pondweed take in, and what does it give out?",
            placeholder: "The plant needs ... and ... and it gives out ...",
          },
        },
      ],
    },
    {
      id: "limiting-factor",
      title: "Find the limiting factor",
      question: "Why does turning the light up sometimes do nothing at all?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-LS1-6", "HS-LS1-5"],
      setup: { light: 0.3, co2: 800, temperature: 293.15, lightColor: "white" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "CO₂ is already very high. The light is low.",
          predict: {
            prompt: "You double the CO₂ again without touching the light. What happens to the rate?",
            options: [
              "It roughly doubles",
              "It rises a little",
              "It barely changes at all",
            ],
            correct: 2,
            reveal:
              "Barely anything. The light is the limiting factor here, and adding more of a factor that is already in surplus cannot speed the reaction up.",
          },
        },
        {
          id: "confirm-light",
          phase: "measure",
          title: "Confirm what is limiting",
          instruction: "Check the bars. Get the sim to say light is limiting, then record.",
          check: {
            describe: "Light is the limiting factor",
            test: (v) => v.facts.limitingFactor === "light",
          },
          requireData: 2,
        },
        {
          id: "swap",
          phase: "analyze",
          title: "Make CO₂ the limiting factor instead",
          instruction: "Change the sliders until CO₂ is what is holding the plant back.",
          check: {
            describe: "CO₂ is the limiting factor",
            test: (v) => v.facts.limitingFactor === "co2",
          },
          hints: [
            "A factor becomes limiting when it is the one furthest from saturating.",
            "Turn the light up, or turn the CO₂ down. Either works.",
          ],
        },
        {
          id: "temp",
          phase: "analyze",
          title: "Now make temperature limiting",
          instruction: "Find a temperature that holds the rate back even with plenty of light and CO₂.",
          check: {
            describe: "Temperature is the limiting factor",
            test: (v) => v.facts.limitingFactor === "temperature",
          },
          hints: [
            "Cold slows enzymes down.",
            "So does too much heat — for a different reason.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write a rule about limiting factors.",
          write: {
            prompt: "When does adding more light speed a plant up, and when does it do nothing?",
            placeholder: "Light only speeds the plant up when ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "greenhouse-budget",
      title: "Greenhouse on a budget",
      brief: "Get the highest bubble rate you can without going above 400 ppm of CO₂.",
      bands: ["6-8", "9-12"],
      setup: { light: 0.3, co2: 400, temperature: 288.15, lightColor: "white" },
      goal: {
        describe: "At least 30 bubbles per minute with CO₂ at or below 400 ppm",
        test: (v) => (v.params.co2 as number) <= 400 && (v.facts.bubbleRate as number) >= 30,
      },
      stars: {
        two: {
          describe: "Reach 36 bubbles per minute at or below 400 ppm",
          test: (v) => (v.params.co2 as number) <= 400 && (v.facts.bubbleRate as number) >= 36,
        },
        three: {
          describe: "Reach 40 bubbles per minute at or below 400 ppm",
          test: (v) => (v.params.co2 as number) <= 400 && (v.facts.bubbleRate as number) >= 40,
        },
      },
      hints: [
        "With CO₂ pinned, only two dials are left.",
        "Warmer is faster — right up until the enzymes start to fall apart.",
      ],
    },
    {
      id: "compensation-point",
      title: "Find the balance point",
      brief: "Dim the lamp until the plant makes oxygen exactly as fast as it uses it.",
      bands: ["9-12"],
      setup: { light: 0.6, co2: 400, temperature: 293.15, lightColor: "white" },
      goal: {
        describe: "Net rate within 1 bubble per minute of zero, with the lamp still on",
        test: (v) =>
          (v.params.light as number) > 0 && Math.abs(v.facts.netRate as number) <= 1,
      },
      stars: {
        two: {
          describe: "Within 0.4 bubbles per minute of zero",
          test: (v) =>
            (v.params.light as number) > 0 && Math.abs(v.facts.netRate as number) <= 0.4,
        },
      },
      hints: [
        "This is the compensation point: photosynthesis equals respiration.",
        "Respiration never stops, so the plant is always spending something.",
      ],
    },
  ],
};
