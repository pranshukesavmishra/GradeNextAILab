import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { camera, mixHex, roundRect } from "@ui/draw";
import {
  caption, glow, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Human Impact — Grades 7-12.
 *
 * Total impact is population multiplied by what each person uses. Two
 * independent numbers, and the thing they produce is their product — so the
 * stage draws it as an area. Population is the width, consumption per person
 * is the height, and the rectangle they make is the impact. Double either side
 * and the area doubles; double both and it quadruples, which is the whole of
 * F6.1 and F6.2 in one picture.
 *
 * Drawn across the same two axes is the set of combinations Earth can actually
 * supply: a hyperbola, because many people using little and few people using a
 * lot can both fit inside one planet. Everything above that curve is overshoot.
 *
 * The history track is real data. Population is the UN series; per-person
 * emissions are Global Carbon Project fossil CO₂ divided by that population,
 * so the product the sim draws reproduces the real global total — about 6 Gt
 * in 1950 and 37 Gt in 2022. Projections to 2100 are the UN medium variant,
 * peaking near 10.3 billion in the 2080s.
 *
 * Biodiversity uses the species-area relationship, S/S₀ = (A/A₀)^z with
 * z = 0.25: the standard ecological result that losing 90% of a habitat costs
 * roughly 44% of its species.
 */

/* ------------------------------------------------------------------ *
 * Real data
 * ------------------------------------------------------------------ */

export interface YearRow {
  year: number;
  /** World population, billions. */
  pop: number;
  /** Fossil CO₂ per person, tonnes per year. */
  perCapita: number;
  projected?: boolean;
}

/**
 * Population: UN World Population Prospects and the HYDE historical series.
 * Per-person emissions: Global Carbon Project totals divided by that
 * population — so pop × perCapita is the real world total for that year.
 */
export const HISTORY: YearRow[] = [
  { year: 1800, pop: 0.99, perCapita: 0.03 },
  { year: 1850, pop: 1.26, perCapita: 0.16 },
  { year: 1900, pop: 1.65, perCapita: 1.18 },
  { year: 1927, pop: 2.00, perCapita: 1.90 },
  { year: 1950, pop: 2.54, perCapita: 2.36 },
  { year: 1960, pop: 3.03, perCapita: 3.10 },
  { year: 1970, pop: 3.70, perCapita: 4.03 },
  { year: 1980, pop: 4.46, perCapita: 4.33 },
  { year: 1990, pop: 5.32, perCapita: 4.27 },
  { year: 2000, pop: 6.15, perCapita: 4.15 },
  { year: 2010, pop: 6.99, perCapita: 4.75 },
  { year: 2022, pop: 7.95, perCapita: 4.67 },
  { year: 2024, pop: 8.16, perCapita: 4.60 },
  { year: 2050, pop: 9.70, perCapita: 4.20, projected: true },
  { year: 2080, pop: 10.30, perCapita: 3.40, projected: true },
  { year: 2100, pop: 10.20, perCapita: 2.60, projected: true },
];

/** Per-person fossil CO₂ in 2022, tonnes per year, for comparison. */
export const COUNTRIES: { name: string; perCapita: number }[] = [
  { name: "United States", perCapita: 14.9 },
  { name: "China", perCapita: 8.0 },
  { name: "European Union", perCapita: 6.2 },
  { name: "World average", perCapita: 4.7 },
  { name: "India", perCapita: 2.0 },
  { name: "Nigeria", perCapita: 0.6 },
];

/**
 * What one Earth can supply, expressed on these axes.
 *
 * Global biocapacity is about 12.2 billion global hectares. A tonne of fossil
 * CO₂ takes roughly 0.55 global hectares of biocapacity to absorb, so the
 * sustainable combinations satisfy pop × perCapita ≈ 22 (billions × tonnes).
 */
export const EARTH_BUDGET = 12.2 / 0.553;

/** Total habitable land, billions of hectares, and land farmed per person. */
const HABITABLE_HA = 10.4;
const FARM_HA_PER_PERSON = 0.6;

/** Species-area exponent. The standard value for continental habitat. */
export const SPECIES_AREA_Z = 0.25;

/** Fraction of species expected to persist on a fraction of the habitat. */
export function speciesRemaining(habitatFraction: number): number {
  return Math.pow(Math.max(0, Math.min(1, habitatFraction)), SPECIES_AREA_Z);
}

function interpolate(year: number): YearRow {
  if (year <= HISTORY[0].year) return HISTORY[0];
  const last = HISTORY[HISTORY.length - 1];
  if (year >= last.year) return last;
  for (let i = 1; i < HISTORY.length; i++) {
    const b = HISTORY[i];
    if (year <= b.year) {
      const a = HISTORY[i - 1];
      const f = (year - a.year) / (b.year - a.year);
      return {
        year,
        pop: a.pop + (b.pop - a.pop) * f,
        perCapita: a.perCapita + (b.perCapita - a.perCapita) * f,
        projected: b.projected,
      };
    }
  }
  return last;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  year: number;
  /** The (population, per-person) path already travelled, for the trace. */
  trackPop: number[];
  trackA: number[];
  cumulativeGt: number;
}

const TRACK_MAX = 320;

function initialState(params: Record<string, number | boolean | string>): State {
  return {
    year: params.startYear as number,
    trackPop: [],
    trackA: [],
    cumulativeGt: 0,
  };
}

/** The two multipliers actually in force, whichever mode the sim is in. */
function multipliers(state: State, params: Record<string, number | boolean | string>) {
  const history = params.mode === "history";
  const row = interpolate(state.year);
  const pop = history ? row.pop : (params.population as number);
  const perCapita = history ? row.perCapita : (params.perCapita as number);
  const efficiency = params.efficiency as number;
  return { pop, perCapita, efficiency, impact: pop * perCapita * efficiency, row };
}

function habitatOf(pop: number, efficiency: number, protect: number): number {
  // Farmland is the dominant claim on habitat. Better technology feeds the
  // same people from less land; protection takes land off the table entirely.
  const farmed = (pop * FARM_HA_PER_PERSON * efficiency) / HABITABLE_HA;
  const free = Math.max(0, 1 - protect);
  return Math.max(protect, 1 - Math.min(free, farmed));
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return initialState(params);
  },

  applyParams(state, params, prev) {
    if (params.startYear !== prev.startYear || params.mode !== prev.mode) {
      return initialState(params);
    }
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const history = params.mode === "history";
    const m = multipliers(state, params);

    let year = state.year;
    if (history) {
      year = Math.min(2100, state.year + (params.yearsPerSecond as number) * dt);
    }

    // Track the path through the population-consumption plane.
    let trackPop = state.trackPop;
    let trackA = state.trackA;
    const lastP = trackPop.length ? trackPop[trackPop.length - 1] : NaN;
    const lastA = trackA.length ? trackA[trackA.length - 1] : NaN;
    if (Math.abs(m.pop - lastP) > 0.005 || Math.abs(m.perCapita - lastA) > 0.005 || !trackPop.length) {
      const drop = trackPop.length >= TRACK_MAX ? 1 : 0;
      trackPop = trackPop.slice(drop).concat(m.pop);
      trackA = trackA.slice(drop).concat(m.perCapita);
    }

    // Gigatonnes of CO2 released while the clock has been running.
    const years = history ? (params.yearsPerSecond as number) * dt : dt;
    const cumulativeGt = state.cumulativeGt + m.impact * years;

    return { year, trackPop, trackA, cumulativeGt };
  },

  readouts(state, params) {
    const m = multipliers(state, params);
    const habitat = habitatOf(m.pop, m.efficiency, params.protectLand as number);
    const species = speciesRemaining(habitat);
    return [
      {
        key: "population", label: "World population", quantity: q(m.pop, "count"),
        semantic: "primary-consumer", graphable: true,
      },
      {
        key: "perCapita", label: "Tonnes of CO₂ each", quantity: q(m.perCapita, "count"),
        semantic: "hot", graphable: true,
      },
      {
        key: "impact", label: "Total impact (Gt CO₂ a year)", quantity: q(m.impact, "count"),
        semantic: "secondary-consumer", graphable: true,
      },
      {
        key: "earths", label: "Earths needed", quantity: q(m.impact / EARTH_BUDGET, "count"),
        semantic: "force", graphable: true,
      },
      {
        key: "habitat", label: "Wild habitat left", quantity: q(habitat, "percent"), unit: "%",
        semantic: "producer", graphable: true,
      },
      {
        key: "species", label: "Species expected to survive",
        quantity: q(species, "percent"), unit: "%",
        semantic: "producer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        // What protection guarantees: even if farmland swallowed every free
        // hectare, the protected fraction alone sustains this share of species.
        key: "speciesFloor", label: "Species secured by protection",
        quantity: q(speciesRemaining(params.protectLand as number), "percent"), unit: "%",
        semantic: "producer", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        // Explore mode has no clock: it reports the present day.
        key: "year", label: "Year",
        quantity: q(params.mode === "history" ? state.year : 2024, "count"),
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const m = multipliers(state, params);
    const habitat = habitatOf(m.pop, m.efficiency, params.protectLand as number);
    const species = speciesRemaining(habitat);
    return {
      year: state.year,
      population: m.pop,
      perCapita: m.perCapita,
      efficiency: m.efficiency,
      // The identity the whole sim is about.
      impact: m.impact,
      earthsNeeded: m.impact / EARTH_BUDGET,
      overshoot: m.impact > EARTH_BUDGET,
      sustainablePerCapita: EARTH_BUDGET / Math.max(m.pop, 1e-9),
      habitatFraction: habitat,
      speciesFraction: species,
      speciesLostPercent: (1 - species) * 100,
      protectedFraction: params.protectLand as number,
      speciesFloorFraction: speciesRemaining(params.protectLand as number),
      cumulativeGt: state.cumulativeGt,
      projected: Boolean(m.row.projected),
      mode: params.mode as string,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const POP_MAX = 12;
const PER_CAPITA_MAX = 16;

/** A row of little figures along the population axis. */
function drawCrowd(
  ctx: CanvasRenderingContext2D, x0: number, y: number, x1: number, color: string,
) {
  const w = x1 - x0;
  const n = Math.max(1, Math.min(46, Math.round(w / 9)));
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const px = x0 + ((i + 0.5) / n) * w;
    ctx.beginPath();
    ctx.arc(px, y - 7, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 1.6, y - 5, 3.2, 5);
  }
  ctx.restore();
}

function drawEarth(
  rc: RenderContext<State>, x: number, y: number, r: number, habitat: number, earths: number,
) {
  const { ctx, theme, time } = rc;
  glow(ctx, x, y, r * 1.6, theme.sci["cold"], 0.28);
  sphere(ctx, x, y, r, theme.sci["cold"]);

  // Land, with the wild fraction still green and the rest converted.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const spin = (time * 0.25) % 1;
  for (let i = 0; i < 4; i++) {
    const cx = x + (((i / 4 + spin) % 1) * 2 - 1) * r * 1.6;
    const rr = r * (0.42 + 0.12 * i);
    ctx.fillStyle = hexA(mixHex(theme.sci["producer"], theme.sci["decomposer"], 1 - habitat), 0.92);
    ctx.beginPath();
    ctx.ellipse(cx, y + (i - 1.5) * r * 0.4, rr, rr * 0.42, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // How many of these planets the current impact would need.
  const whole = Math.min(6, Math.max(1, Math.ceil(earths)));
  for (let i = 1; i < whole; i++) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, earths - i) * 0.7;
    sphere(ctx, x + i * r * 0.85, y + r * 0.7, r * 0.36, theme.sci["force"]);
    ctx.restore();
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const m = multipliers(state, params);
  const habitat = habitatOf(m.pop, m.efficiency, params.protectLand as number);
  const species = speciesRemaining(habitat);
  const earths = m.impact / EARTH_BUDGET;

  sky(ctx, width, height, theme, "indoor");

  const rightW = width < 460 ? 0 : Math.min(190, width * 0.28);
  const plotW = width - rightW - 24;
  const padL = 46;
  const padB = 40;
  const plotH = height - 46 - padB;
  const cam = camera({
    x0: 0, y0: 0, x1: POP_MAX, y1: PER_CAPITA_MAX,
    width: plotW - padL, height: plotH, square: false,
  });
  const ox = padL;
  const oy = 40;
  const sx = (p: number) => ox + cam.toScreenX(p);
  const sy = (a: number) => oy + cam.toScreenY(a);

  /* --- axes ---------------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(0));
  ctx.lineTo(sx(POP_MAX), sy(0));
  ctx.moveTo(sx(0), sy(0));
  ctx.lineTo(sx(0), sy(PER_CAPITA_MAX));
  ctx.stroke();
  ctx.restore();

  /* --- the impact rectangle: this is the multiplication --------------- */
  const rx = sx(0);
  const ry = sy(m.perCapita);
  const rw = sx(m.pop) - rx;
  const rh = sy(0) - ry;
  ctx.save();
  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, hexA(theme.sci["secondary-consumer"], 0.5));
  grad.addColorStop(1, hexA(theme.sci["secondary-consumer"], 0.22));
  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = theme.sci["secondary-consumer"];
  ctx.lineWidth = 2;
  ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
  ctx.restore();

  /* --- the one-Earth curve: every combination the planet can supply --- */
  if (overlays.budget !== false) {
    ctx.save();
    ctx.strokeStyle = theme.sci["producer"];
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    let started = false;
    for (let p = 0.4; p <= POP_MAX; p += 0.1) {
      const a = EARTH_BUDGET / p;
      if (a > PER_CAPITA_MAX) continue;
      const px = sx(p), py = sy(a);
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    caption(ctx, sx(POP_MAX) - 4, sy(EARTH_BUDGET / POP_MAX) - 10, "one Earth", theme, {
      align: "right", size: 10, color: theme.sci["producer"], weight: 700,
    });
  }

  /* --- the real historical track -------------------------------------- */
  if (overlays.track !== false && state.trackPop.length > 1) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.85);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < state.trackPop.length; i++) {
      const px = sx(state.trackPop[i]);
      const py = sy(Math.min(state.trackA[i], PER_CAPITA_MAX));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  sphere(ctx, sx(m.pop), sy(Math.min(m.perCapita, PER_CAPITA_MAX)), 6, theme.accent, { glow: 0.6 });

  /* --- crowd and consumption ladder ----------------------------------- */
  drawCrowd(ctx, rx, sy(0) + 16, sx(m.pop), theme.sci["primary-consumer"]);
  ctx.save();
  ctx.fillStyle = theme.sci["hot"];
  const steps = Math.max(1, Math.min(14, Math.round(m.perCapita)));
  for (let i = 0; i < steps; i++) {
    const yy = sy(0) - ((i + 0.5) / steps) * rh;
    ctx.fillRect(ox - 16, yy - 2, 9, 4);
  }
  ctx.restore();

  /* --- axis labels ---------------------------------------------------- */
  caption(ctx, sx(POP_MAX / 2), sy(0) + 32, "people (billions)", theme, {
    align: "center", size: 10, color: theme.inkSoft,
  });
  ctx.save();
  ctx.translate(12, sy(PER_CAPITA_MAX / 2));
  ctx.rotate(-Math.PI / 2);
  caption(ctx, 0, 0, "tonnes of CO₂ each", theme, { align: "center", size: 10, color: theme.inkSoft });
  ctx.restore();

  for (const p of [4, 8, 12]) {
    caption(ctx, sx(p), sy(0) + 12, String(p), theme, { align: "center", size: 9, color: theme.inkSoft });
  }
  for (const a of [4, 8, 12, 16]) {
    caption(ctx, ox - 22, sy(a), String(a), theme, { align: "right", size: 9, color: theme.inkSoft });
  }

  /* --- the headline number -------------------------------------------- */
  caption(
    ctx, ox, 18,
    `${m.pop.toFixed(2)} billion × ${m.perCapita.toFixed(1)} t  =  ${m.impact.toFixed(1)} Gt CO₂ a year`,
    theme, { size: 13, color: theme.ink, weight: 800 },
  );
  if (params.mode === "history") {
    caption(ctx, ox, 32, `${Math.round(state.year)}${m.row.projected ? "  (projected)" : ""}`, theme, {
      size: 11, color: m.row.projected ? theme.sci["field"] : theme.inkSoft,
    });
  } else if (band !== "3-5") {
    caption(ctx, ox, 32, "change either side of the rectangle and watch the area", theme, {
      size: 10, color: theme.inkSoft,
    });
  }

  /* --- the planet panel ------------------------------------------------ */
  if (rightW > 0) {
    const px = width - rightW / 2 - 8;
    drawEarth(rc, px, 86, Math.min(46, rightW * 0.3), habitat, earths);
    material(ctx, width - rightW - 4, 148, rightW, 84, theme.surfaceAlt, 7);

    caption(ctx, px, 162, `${earths.toFixed(2)} Earths`, theme, {
      align: "center", size: 15,
      color: earths > 1 ? theme.sci["force"] : theme.sci["producer"], weight: 800,
    });

    const barW = rightW - 24;
    const barX = width - rightW + 8;
    for (const [i, row] of ([
      ["wild habitat", habitat, theme.sci["producer"]],
      ["species surviving", species, theme.sci["primary-consumer"]],
    ] as [string, number, string][]).entries()) {
      const by = 182 + i * 24;
      ctx.save();
      ctx.fillStyle = hexA(theme.inkSoft, 0.22);
      roundRect(ctx, barX, by, barW, 8, 4);
      ctx.fill();
      ctx.fillStyle = row[2];
      roundRect(ctx, barX, by, barW * Math.max(0, Math.min(1, row[1])), 8, 4);
      ctx.fill();
      ctx.restore();
      caption(ctx, barX, by - 6, `${row[0]}  ${Math.round(row[1] * 100)}%`, theme, {
        size: 9, color: theme.inkSoft,
      });
    }

    if (overlays.countries && band !== "3-5" && height > 300) {
      caption(ctx, barX, 246, "tonnes each, 2022", theme, { size: 9, color: theme.inkSoft });
      for (let i = 0; i < COUNTRIES.length; i++) {
        const c = COUNTRIES[i];
        const cy = 260 + i * 13;
        if (cy > height - 8) break;
        ctx.save();
        ctx.fillStyle = hexA(theme.sci["hot"], 0.75);
        ctx.fillRect(barX, cy - 4, (c.perCapita / 16) * barW, 6);
        ctx.restore();
        caption(ctx, barX + barW, cy, `${c.name} ${c.perCapita}`, theme, {
          align: "right", size: 8, color: theme.inkSoft,
        });
      }
    }
  }

  if (earths > 1) {
    caption(
      ctx, ox, height - 8,
      `above the line — using ${earths.toFixed(2)} planets' worth of Earth every year`,
      theme, { size: 10, color: theme.sci["force"], weight: 700 },
    );
  } else {
    caption(ctx, ox, height - 8, "inside what one planet can supply", theme, {
      size: 10, color: theme.sci["producer"], weight: 700,
    });
  }

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const humanImpactSim: SimManifest<State> = {
  id: "bio.human-impact",
  title: "Human Impact",
  tagline: "Population times consumption makes a rectangle. Change either side and watch the area.",
  subject: "biology",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-ESS3-4", "MS-ESS3-3", "MS-LS2-5", "HS-ESS3-3"] },
  learningGoals: [
    "Explain that total impact is population multiplied by per-person consumption.",
    "Show that changing either multiplier changes the total, and changing both compounds.",
    "Use real population and emissions data to argue about impact.",
    "Compare management options and name the trade-off each one carries.",
  ],
  misconceptions: [
    "Impact depends only on how many people there are",
    "Everyone on Earth has roughly the same impact",
    "Technology alone can solve it without changing anything else",
    "Protecting a small reserve saves most of the species",
  ],
  interactionHint: "Slide Population and Consumption separately, then both at once.",
  tickRate: 60,
  params: {
    mode: {
      type: "option", label: "Mode",
      options: [
        { value: "explore", label: "Set the two numbers yourself" },
        { value: "history", label: "Play the real record, 1800-2100" },
      ],
      default: "explore",
    },
    population: {
      type: "number", label: "Population", kind: "count",
      min: 0.5, max: 12, step: 0.1, default: 8.0,
      marks: [
        { value: 1, label: "1800" },
        { value: 2.5, label: "1950" },
        { value: 8, label: "today" },
        { value: 10.3, label: "2080s" },
      ],
      help: "Billions of people. The width of the rectangle.",
    },
    perCapita: {
      type: "number", label: "Consumption each", kind: "count",
      min: 0.1, max: 16, step: 0.1, default: 4.7,
      marks: [
        { value: 0.6, label: "Nigeria" },
        { value: 2, label: "India" },
        { value: 4.7, label: "world" },
        { value: 14.9, label: "USA" },
      ],
      help: "Tonnes of CO₂ per person per year. The height of the rectangle.",
    },
    efficiency: {
      type: "number", label: "Impact per unit used", kind: "ratio",
      min: 0.2, max: 1.5, step: 0.05, default: 1,
      bands: ["6-8", "9-12"],
      help: "Cleaner technology lowers this. It does not lower how much people use.",
    },
    protectLand: {
      type: "number", label: "Habitat protected", kind: "percent", unit: "%",
      min: 0, max: 0.5, step: 0.05, default: 0,
      bands: ["6-8", "9-12"],
      marks: [{ value: 0.3, label: "30x30 target" }],
      help: "Land set aside for wildlife. It has to come out of farmland.",
    },
    yearsPerSecond: {
      type: "number", label: "Years per second", kind: "count",
      min: 2, max: 40, step: 2, default: 12,
      bands: ["6-8", "9-12"],
    },
    startYear: {
      type: "number", label: "Start year", kind: "count",
      min: 1800, max: 2050, step: 10, default: 1800,
      bands: ["9-12"],
    },
  },
  overlays: [
    { key: "budget", label: "What one Earth supplies", default: true },
    { key: "track", label: "Path travelled", default: true },
    { key: "countries", label: "Country comparison", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "two-multipliers",
      title: "Which matters more: how many, or how much?",
      question: "Impact is population times consumption. What happens when you change each one?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS3-4"],
      setup: {
        mode: "explore", population: 4, perCapita: 4, efficiency: 1,
        protectLand: 0, yearsPerSecond: 12, startYear: 1800,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Start at 4 billion people using 4 tonnes each.",
          predict: {
            prompt: "If you double the population AND double what each person uses, the impact becomes...",
            options: ["Twice as big", "Three times as big", "Four times as big"],
            correct: 2,
            reveal:
              "Four times. The two numbers multiply, so doubling both sides of the rectangle quadruples its area.",
          },
        },
        {
          id: "double-pop",
          phase: "measure",
          title: "Double the population only",
          instruction: "Set population to 8 and leave consumption at 4. Record the impact.",
          requireData: 1,
          check: {
            describe: "8 billion people, 4 tonnes each",
            test: (v) => Math.abs((v.facts.population as number) - 8) < 0.2 &&
              Math.abs((v.facts.perCapita as number) - 4) < 0.2,
          },
        },
        {
          id: "double-both",
          phase: "measure",
          title: "Now double consumption too",
          instruction: "Leave population at 8 and raise consumption to 8. Record it again.",
          requireData: 3,
          check: {
            describe: "Impact above 60 Gt",
            test: (v) => (v.facts.impact as number) >= 60,
          },
          hints: ["Compare the area of the rectangle now with the area you started with."],
        },
        {
          id: "budget",
          phase: "analyze",
          title: "Get back under one Earth",
          instruction: "Find any combination that sits on or below the dashed curve.",
          check: {
            describe: "Inside what one Earth supplies",
            test: (v) => (v.facts.earthsNeeded as number) <= 1,
          },
          hints: [
            "There is more than one answer: many people using little, or fewer using more.",
            "That is what makes this an argument about fairness, not only about arithmetic.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say why arguing about only one of the two numbers misses the point.",
          write: {
            prompt: "Someone says the problem is only the number of people. What would you say back?",
            placeholder: "Impact is the product of two numbers, so ...",
          },
        },
      ],
    },
    {
      id: "biodiversity-cost",
      title: "What does habitat loss cost in species?",
      question: "If half the wild habitat is farmed, how many species are lost?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS2-5", "MS-ESS3-3"],
      setup: {
        mode: "explore", population: 8, perCapita: 4.7, efficiency: 1,
        protectLand: 0, yearsPerSecond: 12, startYear: 1800,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Ecologists find that species number depends on habitat area.",
          predict: {
            prompt: "If a habitat is cut to one tenth of its area, roughly what share of its species survive?",
            options: ["About 10%", "About 30%", "About 56%", "About 90%"],
            correct: 2,
            reveal:
              "About 56%. The species-area relationship says species scale as area to the power 0.25, so a tenfold cut in area costs a little under half the species — bad, but not proportional.",
          },
        },
        {
          id: "squeeze",
          phase: "measure",
          title: "Squeeze the habitat",
          instruction: "Raise the population until the wild habitat drops below 30%.",
          check: {
            describe: "Wild habitat under 30%",
            test: (v) => (v.facts.habitatFraction as number) < 0.3,
          },
          requireData: 3,
        },
        {
          id: "options",
          phase: "analyze",
          title: "Try the two fixes",
          instruction: "Now try better technology, and then protecting land. Which helps more?",
          check: {
            describe: "At least 30% of land protected",
            test: (v) => (v.params.protectLand as number) >= 0.3,
          },
          hints: [
            "Protected land is land that cannot be farmed. Somebody gives something up.",
            "Higher yields free land — unless the freed land is farmed too.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Weigh the trade-offs",
          instruction: "Recommend one option and name what it costs.",
          write: {
            prompt: "Which management option would you choose, and what does it cost whom?",
            placeholder: "I would choose ... because ... but it means ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "one-planet",
      title: "One planet living",
      brief: "Get back inside one Earth with 10 billion people alive.",
      bands: ["6-8", "9-12"],
      setup: {
        mode: "explore", population: 10, perCapita: 4.7, efficiency: 1,
        protectLand: 0, yearsPerSecond: 12, startYear: 1800,
      },
      goal: {
        describe: "10 billion people, at or below one Earth",
        test: (v) => (v.facts.population as number) >= 10 && (v.facts.earthsNeeded as number) <= 1,
      },
      stars: {
        two: {
          describe: "And keep more than half the wild habitat",
          test: (v) =>
            (v.facts.population as number) >= 10 && (v.facts.earthsNeeded as number) <= 1 &&
            (v.facts.habitatFraction as number) >= 0.5,
        },
        three: {
          describe: "And keep 90% of species",
          test: (v) =>
            (v.facts.population as number) >= 10 && (v.facts.earthsNeeded as number) <= 1 &&
            (v.facts.speciesFraction as number) >= 0.9,
        },
      },
      hints: [
        "With 10 billion people, one Earth allows about 2.2 tonnes each.",
        "Cleaner technology lowers the impact of each tonne used — it is a third multiplier.",
      ],
    },
    {
      id: "find-the-crossing",
      title: "When did we cross the line?",
      brief: "Play the real record and stop in the decade humanity first needed more than one Earth.",
      bands: ["9-12"],
      setup: {
        mode: "history", population: 8, perCapita: 4.7, efficiency: 1,
        protectLand: 0, yearsPerSecond: 8, startYear: 1800,
      },
      goal: {
        describe: "Stopped between 1965 and 1985, just over one Earth",
        test: (v) =>
          (v.facts.year as number) >= 1965 && (v.facts.year as number) <= 1985 &&
          (v.facts.earthsNeeded as number) > 1,
      },
      hints: [
        "Watch the track cross the dashed one-Earth curve.",
        "Global Footprint Network puts the crossing at about 1970.",
      ],
    },
  ],
};
