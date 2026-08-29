import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex } from "@ui/draw";
import { badge, caption, glow, hexA, isDarkTheme, material, sky, vignette } from "@ui/scene";

/**
 * Radiometric Dating — Grades 7-12.
 *
 * Every atom in this simulation decays on its own, at random, with the real
 * probability its isotope has. Nobody tells the population to halve: it halves
 * because that is what a constant per-atom decay chance does to a large enough
 * crowd. That is the whole idea of a half-life, and it is the reason a rock can
 * carry a clock inside it.
 *
 * The half-lives, the parent-daughter pairs and the sample ages are all real:
 * carbon-14 at 5,730 years, potassium-40 at 1.25 billion, uranium-238 at 4.468
 * billion; the ash bed at the dinosaur extinction at 66.04 million years; the
 * Acasta Gneiss at 4.03 billion; a meteorite at 4.567 billion, which is where
 * the 4.6-billion-year age of the Earth comes from in the first place.
 *
 * The sim also refuses to lie about what a clock can do. Point carbon-14 at a
 * meteorite and every parent atom is long gone; point uranium-238 at a campfire
 * and not one atom has decayed. Choosing the right clock is half the science.
 */

/* ------------------------------------------------------------------ *
 * Real isotope systems
 * ------------------------------------------------------------------ */

export interface Isotope {
  key: string;
  parent: string;
  daughter: string;
  /** Half-life in years. */
  halfLifeYr: number;
  useful: string;
}

export const ISOTOPES: Record<string, Isotope> = {
  c14: {
    key: "c14", parent: "Carbon-14", daughter: "Nitrogen-14", halfLifeYr: 5730,
    useful: "Once-living material younger than about 50,000 years",
  },
  u235: {
    key: "u235", parent: "Uranium-235", daughter: "Lead-207", halfLifeYr: 7.04e8,
    useful: "Zircon crystals in granite, from a million to billions of years",
  },
  k40: {
    key: "k40", parent: "Potassium-40", daughter: "Argon-40", halfLifeYr: 1.25e9,
    useful: "Volcanic ash and lava older than about 100,000 years",
  },
  u238: {
    key: "u238", parent: "Uranium-238", daughter: "Lead-206", halfLifeYr: 4.468e9,
    useful: "The oldest rocks on Earth, and meteorites",
  },
  rb87: {
    key: "rb87", parent: "Rubidium-87", daughter: "Strontium-87", halfLifeYr: 4.88e10,
    useful: "Whole ancient rock bodies, where other clocks have run down",
  },
};

/* ------------------------------------------------------------------ *
 * Real samples
 * ------------------------------------------------------------------ */

export interface Sample {
  key: string;
  label: string;
  /** The age the sample really is, in years. */
  trueAgeYr: number;
  /** The clock a geochronologist would actually reach for. */
  best: string;
  context: string;
  /** Relative age evidence sitting around the sample. */
  below: string;
  above: string;
}

export const SAMPLES: Record<string, Sample> = {
  hearth: {
    key: "hearth", label: "Charcoal from a campfire", trueAgeYr: 12000, best: "c14",
    context: "buried in the floor of a cave",
    below: "older cave floor with no charcoal",
    above: "younger sand blown in over the top",
  },
  ash: {
    key: "ash", label: "Ash at the dinosaur extinction", trueAgeYr: 66.04e6, best: "k40",
    context: "a volcanic ash bed pressed between two very different fossil beds",
    below: "rock full of dinosaur bones",
    above: "rock with no dinosaurs at all",
  },
  granite: {
    key: "granite", label: "Sierra Nevada granite", trueAgeYr: 100e6, best: "u235",
    context: "zircon crystals from a batholith under Yosemite",
    below: "older rock the granite pushed into",
    above: "younger sediment lying on the eroded granite",
  },
  acasta: {
    key: "acasta", label: "Acasta Gneiss — the oldest known rock", trueAgeYr: 4.03e9, best: "u238",
    context: "an outcrop in the Northwest Territories of Canada",
    below: "nothing older has ever been found",
    above: "every other rock on Earth",
  },
  meteorite: {
    key: "meteorite", label: "A meteorite from the asteroid belt", trueAgeYr: 4.567e9, best: "u238",
    context: "a chondrite that has never been melted or reworked",
    below: "material left over from building the planets",
    above: "the entire history of the solar system",
  },
};

/** Age of the Earth from meteorite dating, in years. Rounded, this is 4.6 billion. */
export const EARTH_AGE_YR = 4.54e9;
/** Age of the solar system itself, from calcium-aluminium inclusions. */
export const SOLAR_SYSTEM_AGE_YR = 4.567e9;

/* ------------------------------------------------------------------ *
 * The decay law
 * ------------------------------------------------------------------ */

/** Fraction of parent atoms still present after t half-lives. */
export function survivingFraction(halfLives: number): number {
  return Math.pow(2, -halfLives);
}

/**
 * The age a sample's parent-to-daughter ratio implies.
 *
 *   N = N0 · 2^(−t/T)   and   D = N0 − N,   so   t = T · log2(1 + D/N).
 *
 * This is the equation a geochronologist actually solves, and it needs no
 * knowledge of how much parent there was to begin with — only the ratio now.
 */
export function ageFromRatio(parents: number, daughters: number, halfLifeYr: number): number {
  if (parents <= 0) return Infinity;
  return halfLifeYr * Math.log2(1 + daughters / parents);
}

/** How many half-lives a sample's true age amounts to, for this clock. */
export function halfLivesFor(sample: Sample, isotope: Isotope): number {
  return sample.trueAgeYr / isotope.halfLifeYr;
}

/**
 * Whether this clock can actually date this sample. Too few half-lives and no
 * daughter atom has appeared; too many and no parent atom is left. Real
 * laboratories quote roughly this window.
 */
export function clockUsable(sample: Sample, isotope: Isotope): boolean {
  const n = halfLivesFor(sample, isotope);
  return n >= 0.01 && n <= 10;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

const MAX_HALF_LIVES = 6;

interface State {
  /** Elapsed time in half-lives of the selected isotope. */
  t: number;
  /** For each atom, the time it decayed, or -1 while it is still a parent. */
  decayTime: number[];
  parents: number;
  /** Measured points, taken from the student's own crowd of atoms. */
  curve: { t: number; fraction: number }[];
  /** The reading captured when the clock passed the sample's true age. */
  sampleParents: number;
  sampleDaughters: number;
  /** Atoms that decayed in the last instant, for the flash. */
  recent: number;
  finished: boolean;
}

type Params = Record<string, number | boolean | string>;

function isotopeOf(params: Params): Isotope {
  return ISOTOPES[params.isotope as string] ?? ISOTOPES.c14;
}

function sampleOf(params: Params): Sample {
  return SAMPLES[params.sample as string] ?? SAMPLES.hearth;
}

function makeState(params: Params): State {
  const n = Math.round(params.atoms as number);
  return {
    t: 0,
    decayTime: new Array<number>(n).fill(-1),
    parents: n,
    curve: [{ t: 0, fraction: 1 }],
    sampleParents: -1,
    sampleDaughters: -1,
    recent: 0,
    finished: false,
  };
}

const model: SimModel<State> = {
  init(params) {
    return makeState(params);
  },

  applyParams(state, params, prev) {
    if (
      params.atoms !== prev.atoms
      || params.isotope !== prev.isotope
      || params.sample !== prev.sample
    ) {
      return makeState(params);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0 || state.finished) return state;
    const speed = params.speed as number;                 // half-lives per second
    const dtHL = Math.min(dt * speed, 0.05);
    const t = Math.min(MAX_HALF_LIVES, state.t + dtHL);

    /* --- every surviving atom takes its own chance ---------------- */
    // Probability of decaying within dtHL half-lives: 1 − 2^(−dtHL). No atom
    // knows what any other is doing; the exponential law is what emerges.
    const p = 1 - Math.pow(2, -dtHL);
    const decayTime = state.decayTime.slice();
    let parents = state.parents;
    let recent = 0;
    for (let i = 0; i < decayTime.length; i++) {
      if (decayTime[i] >= 0) continue;
      if (ctx.rng.next() < p) {
        decayTime[i] = t;
        parents--;
        recent++;
      }
    }

    const fraction = decayTime.length > 0 ? parents / decayTime.length : 0;
    const curve = state.curve.length > 400 || t - state.curve[state.curve.length - 1].t > 0.02
      ? [...state.curve, { t, fraction }].slice(-400)
      : state.curve;

    /* --- capture the reading when the clock reaches the sample's age */
    let sampleParents = state.sampleParents;
    let sampleDaughters = state.sampleDaughters;
    const isotope = isotopeOf(params);
    const sample = sampleOf(params);
    const targetHL = halfLivesFor(sample, isotope);
    if (sampleParents < 0 && t >= targetHL) {
      sampleParents = parents;
      sampleDaughters = decayTime.length - parents;
    }

    return {
      t, decayTime, parents, curve,
      sampleParents, sampleDaughters,
      recent,
      finished: t >= MAX_HALF_LIVES,
    };
  },

  readouts(state, params) {
    const isotope = isotopeOf(params);
    const total = state.decayTime.length;
    const daughters = total - state.parents;
    const fraction = total > 0 ? state.parents / total : 0;
    const measured = ageFromRatio(state.sampleParents, state.sampleDaughters, isotope.halfLifeYr);
    return [
      {
        key: "parents", label: `${isotope.parent} atoms left`,
        quantity: q(state.parents, "count"),
        semantic: "charge-neg", graphable: true,
      },
      {
        key: "daughters", label: `${isotope.daughter} atoms made`,
        quantity: q(daughters, "count"),
        semantic: "charge-pos", graphable: true,
      },
      {
        key: "fraction", label: "Fraction of parent left", quantity: q(fraction, "ratio"),
        semantic: "distance", graphable: true,
      },
      {
        key: "halfLives", label: "Half-lives elapsed", quantity: q(state.t, "ratio"),
        semantic: "time", graphable: true,
      },
      {
        key: "elapsed", label: "Years elapsed",
        quantity: q(state.t * isotope.halfLifeYr * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false,
      },
      {
        key: "predicted", label: "Fraction the law predicts",
        quantity: q(survivingFraction(state.t), "ratio"),
        semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "measuredAge", label: "Age this sample measures",
        quantity: q(Number.isFinite(measured) ? measured * 31557600 : 0, "time"), unit: "yr",
        semantic: "acceleration", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "halfLife", label: "Half-life of this isotope",
        quantity: q(isotope.halfLifeYr * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const isotope = isotopeOf(params);
    const sample = sampleOf(params);
    const total = state.decayTime.length;
    const daughters = total - state.parents;
    const fraction = total > 0 ? state.parents / total : 0;
    const measured = ageFromRatio(state.sampleParents, state.sampleDaughters, isotope.halfLifeYr);
    const hasReading = state.sampleParents >= 0;
    return {
      isotope: isotope.key,
      isotopeParent: isotope.parent,
      isotopeDaughter: isotope.daughter,
      halfLifeYr: isotope.halfLifeYr,
      sample: sample.key,
      sampleLabel: sample.label,
      trueAgeYr: sample.trueAgeYr,
      totalAtoms: total,
      parents: state.parents,
      daughters,
      fraction,
      halfLivesElapsed: state.t,
      predictedFraction: survivingFraction(state.t),
      // How far the student's own crowd of atoms strays from the smooth law.
      deviation: Math.abs(fraction - survivingFraction(state.t)),
      sampleHalfLives: halfLivesFor(sample, isotope),
      clockUsable: clockUsable(sample, isotope),
      bestClock: sample.best,
      usingBestClock: isotope.key === sample.best,
      hasReading,
      measuredAgeYr: hasReading && Number.isFinite(measured) ? measured : -1,
      // Percentage error of the student's measurement against the true age.
      measuredErrorPercent: hasReading && Number.isFinite(measured)
        ? (100 * Math.abs(measured - sample.trueAgeYr)) / sample.trueAgeYr : -1,
      // Relative dating: the ash bed's absolute age brackets its neighbours.
      olderThanYr: sample.trueAgeYr,
      youngerThanYr: sample.trueAgeYr,
      earthAgeYr: EARTH_AGE_YR,
      solarSystemAgeYr: SOLAR_SYSTEM_AGE_YR,
      finished: state.finished,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const isotope = isotopeOf(params);
  const sample = sampleOf(params);
  const dark = isDarkTheme(theme);
  const total = state.decayTime.length;
  const daughters = total - state.parents;

  sky(ctx, width, height, theme, "indoor");

  const parentColor = theme.sci["charge-neg"];
  const daughterColor = theme.sci["charge-pos"];

  const leftW = band === "K-2" ? width : Math.max(200, width * 0.42);
  const pad = 10;

  /* ---- the sample in its geological context --------------------- */
  const stratW = band === "K-2" || width < 520 ? 0 : Math.min(74, leftW * 0.24);
  if (stratW > 0 && overlays.context !== false) {
    const sx = pad;
    const sy = 34;
    const sh = height - sy - 16;
    const beds: [string, number, string][] = [
      [sample.above, 0.36, theme.sci["gas"]],
      ["the sample", 0.2, theme.sci["hot"]],
      [sample.below, 0.44, theme.sci["mass"]],
    ];
    let by = sy;
    for (const [name, frac, color] of beds) {
      const bh = sh * frac;
      ctx.save();
      const g = ctx.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, mixHex(color, "#ffffff", 0.2));
      g.addColorStop(1, mixHex(color, "#000000", 0.25));
      ctx.fillStyle = g;
      ctx.fillRect(sx, by, stratW, bh);
      ctx.strokeStyle = hexA(theme.ink, 0.3);
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, by, stratW, bh);
      ctx.restore();
      // A wrapped, tiny label; the field note below carries the full text.
      caption(ctx, sx + stratW / 2, by + bh / 2, name.split(" ").slice(0, 2).join(" "), theme, {
        align: "center", size: 9, color: theme.surface, weight: 700,
      });
      by += bh;
    }
    caption(ctx, sx, sy - 8, "younger", theme, { size: 9, color: theme.inkSoft });
    caption(ctx, sx, sy + sh + 9, "older", theme, { size: 9, color: theme.inkSoft });
  }

  /* ---- the crowd of atoms ---------------------------------------- */
  const ax0 = pad + (stratW > 0 ? stratW + 12 : 0);
  const ax1 = leftW - pad;
  const ay0 = 46;
  const ay1 = height - 58;
  const cols = Math.max(1, Math.ceil(Math.sqrt((total * (ax1 - ax0)) / Math.max(1, ay1 - ay0))));
  const rows = Math.max(1, Math.ceil(total / cols));
  const cell = Math.min((ax1 - ax0) / cols, (ay1 - ay0) / rows);
  const r = Math.max(1.1, cell * 0.34);

  ctx.save();
  material(ctx, ax0 - 6, ay0 - 10, ax1 - ax0 + 12, ay1 - ay0 + 20, theme.surfaceAlt, 8);
  ctx.restore();

  // Batched: one path per species keeps a thousand atoms cheap to draw.
  const drawGroup = (wantDecayed: boolean, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < total; i++) {
      const decayed = state.decayTime[i] >= 0;
      if (decayed !== wantDecayed) continue;
      const cx = ax0 + (i % cols) * cell + cell / 2;
      const cy = ay0 + Math.floor(i / cols) * cell + cell / 2;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  };
  drawGroup(false, parentColor);
  drawGroup(true, daughterColor);

  // Atoms that went in the last moment get a flash, so decay is visibly random.
  if (overlays.flash !== false) {
    for (let i = 0; i < total; i++) {
      const dtSince = state.t - state.decayTime[i];
      if (state.decayTime[i] < 0 || dtSince > 0.035) continue;
      const cx = ax0 + (i % cols) * cell + cell / 2;
      const cy = ay0 + Math.floor(i / cols) * cell + cell / 2;
      glow(ctx, cx, cy, Math.max(6, r * 5), theme.sci["light"], 0.75);
    }
  }

  caption(ctx, ax0, ay0 - 20, `${state.parents} ${isotope.parent}`, theme, {
    size: 12, color: parentColor, weight: 700,
  });
  caption(ctx, ax1, ay0 - 20, `${daughters} ${isotope.daughter}`, theme, {
    align: "right", size: 12, color: daughterColor, weight: 700,
  });

  /* ---- the decay curve, built from the student's own atoms -------- */
  if (band !== "K-2") {
    const gx0 = leftW + 12;
    const gx1 = width - 14;
    const gy0 = 54;
    const gy1 = height - 46;
    const toGX = (t: number) => gx0 + (t / MAX_HALF_LIVES) * (gx1 - gx0);
    const toGY = (f: number) => gy1 - f * (gy1 - gy0);

    ctx.save();
    material(ctx, gx0 - 8, gy0 - 26, gx1 - gx0 + 16, gy1 - gy0 + 46, theme.surfaceAlt, 8);
    ctx.restore();

    // Halving guides — the visual definition of a half-life.
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    for (let k = 1; k <= 4; k++) {
      const f = Math.pow(0.5, k);
      ctx.beginPath();
      ctx.moveTo(gx0, toGY(f));
      ctx.lineTo(toGX(k), toGY(f));
      ctx.lineTo(toGX(k), gy1);
      ctx.stroke();
    }
    ctx.restore();
    for (let k = 1; k <= 4; k++) {
      caption(ctx, gx0 + 3, toGY(Math.pow(0.5, k)) - 8, `1/${Math.pow(2, k)}`, theme, {
        size: 9, color: theme.inkSoft,
      });
    }

    // Axes.
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.5);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx0, gy1);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k <= MAX_HALF_LIVES; k++) {
      caption(ctx, toGX(k), gy1 + 12, String(k), theme, {
        align: "center", size: 10, color: theme.inkSoft,
      });
    }
    caption(ctx, (gx0 + gx1) / 2, gy1 + 27, "half-lives elapsed", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });

    // The law: a smooth exponential, drawn as the thing to be tested.
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["energy-total"], 0.85);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let px = 0; px <= 120; px++) {
      const t = (px / 120) * MAX_HALF_LIVES;
      const x = toGX(t);
      const y = toGY(survivingFraction(t));
      if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // The measurement: the student's own atoms, which wobble around it.
    if (state.curve.length > 1) {
      ctx.save();
      ctx.strokeStyle = parentColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < state.curve.length; i++) {
        const pt = state.curve[i];
        const x = toGX(pt.t);
        const y = toGY(pt.fraction);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Where this sample sits on the curve — or the fact that it does not.
    const targetHL = halfLivesFor(sample, isotope);
    if (targetHL <= MAX_HALF_LIVES && targetHL >= 0.004) {
      const mx = toGX(targetHL);
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, gy0);
      ctx.lineTo(mx, gy1);
      ctx.stroke();
      ctx.restore();
      caption(ctx, mx + 5, gy0 + 8, "this sample", theme, {
        size: 10, color: theme.accent, weight: 700,
      });
    } else {
      caption(ctx, (gx0 + gx1) / 2, gy0 + 16,
        targetHL < 0.004
          ? `far too young for ${isotope.parent} — no daughter atoms yet`
          : `far too old for ${isotope.parent} — every parent atom is gone`,
        theme, { align: "center", size: 11, color: theme.sci["force"], weight: 700 });
    }

    caption(ctx, gx0, gy0 - 12,
      `${isotope.parent} → ${isotope.daughter}   ·   half-life ${formatYears(isotope.halfLifeYr)}`,
      theme, { size: 11, color: theme.inkSoft });
  }

  /* ---- the answer -------------------------------------------------- */
  const measured = ageFromRatio(state.sampleParents, state.sampleDaughters, isotope.halfLifeYr);
  if (band !== "K-2") {
    const yb = height - 26;
    if (state.sampleParents >= 0 && Number.isFinite(measured)) {
      badge(ctx, pad, yb, formatYears(measured), theme, {
        color: theme.accent, sub: "age this ratio gives",
      });
      badge(ctx, pad + 168, yb, formatYears(sample.trueAgeYr), theme, {
        color: theme.inkSoft, sub: "the sample's real age",
      });
    } else {
      caption(ctx, pad, yb, "keep running — the clock has not reached this sample's age yet",
        theme, { size: 11, color: theme.inkSoft });
    }
  }
  caption(ctx, pad, 18, `${sample.label} — ${sample.context}`, theme, { size: 12 });
  if (band !== "K-2") {
    caption(ctx, width - 12, 18,
      `${state.t.toFixed(2)} half-lives  ·  ${formatYears(state.t * isotope.halfLifeYr)}`,
      theme, { align: "right", size: 11, color: dark ? theme.inkSoft : theme.inkSoft });
  }

  vignette(ctx, width, height, 0.12);
}

/** Years in the units a person would actually say them in. */
function formatYears(yr: number): string {
  if (!Number.isFinite(yr)) return "—";
  if (yr >= 1e9) return `${(yr / 1e9).toFixed(2)} billion yr`;
  if (yr >= 1e6) return `${(yr / 1e6).toFixed(2)} million yr`;
  if (yr >= 1e3) return `${(yr / 1e3).toFixed(1)} thousand yr`;
  return `${yr.toFixed(0)} yr`;
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const radiometricSim: SimManifest<State> = {
  id: "earth.radiometric",
  title: "Radiometric Dating",
  tagline: "Watch atoms decay one at a time and read a rock's age straight off the leftovers.",
  subject: "earth",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-ESS1-4", "HS-ESS1-5", "HS-ESS1-6", "HS-PS1-8"] },
  learningGoals: [
    "Explain a half-life as the time for half the remaining parent atoms to decay.",
    "Use the ratio of parent to daughter atoms to calculate an age.",
    "Choose the right isotope for a sample, and say why the wrong one fails.",
    "Combine an absolute date with relative evidence from the layers around it.",
    "Say where the 4.6-billion-year age of the Earth comes from.",
  ],
  misconceptions: [
    "Half of the original atoms decay in every half-life, so it all disappears after two",
    "Decay is a scheduled process, not a random one",
    "You must know how much parent there was to begin with",
    "Carbon-14 can date rocks and dinosaurs",
    "Radiometric dates are guesses that cannot be checked",
  ],
  interactionHint: "Pick a sample and an isotope, then press play and watch the atoms go.",
  tickRate: 60,
  params: {
    sample: {
      type: "option", label: "Sample to date",
      options: [
        { value: "hearth", label: "Charcoal from a campfire — 12 thousand yr" },
        { value: "ash", label: "Ash at the dinosaur extinction" },
        { value: "granite", label: "Sierra Nevada granite" },
        { value: "acasta", label: "Acasta Gneiss — Earth's oldest rock" },
        { value: "meteorite", label: "A meteorite" },
      ],
      default: "ash",
      help: "Each sample's real age is known independently, so you can check your answer.",
    },
    isotope: {
      type: "option", label: "Clock to use",
      options: [
        { value: "c14", label: "Carbon-14 → Nitrogen-14 (5,730 yr)" },
        { value: "u235", label: "Uranium-235 → Lead-207 (704 million yr)" },
        { value: "k40", label: "Potassium-40 → Argon-40 (1.25 billion yr)" },
        { value: "u238", label: "Uranium-238 → Lead-206 (4.47 billion yr)" },
        { value: "rb87", label: "Rubidium-87 → Strontium-87 (48.8 billion yr)" },
      ],
      default: "k40",
      help: "A clock only works if its half-life is close to the age you are measuring.",
    },
    atoms: {
      type: "number", label: "Atoms in the sample", kind: "count",
      min: 40, max: 1200, step: 20, default: 400,
      help: "With few atoms the decay looks ragged. With many it snaps onto the smooth law.",
    },
    speed: {
      type: "number", label: "Half-lives per second", kind: "ratio",
      min: 0.05, max: 0.8, step: 0.05, default: 0.25,
    },
  },
  overlays: [
    { key: "context", label: "Rock layers around the sample", default: true },
    { key: "flash", label: "Flash each decay", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "what-is-a-half-life",
      title: "What exactly halves?",
      question: "After two half-lives, is the sample gone?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS1-4"],
      setup: { sample: "hearth", isotope: "c14", atoms: 800, speed: 0.25 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "800 carbon-14 atoms. One half-life is 5,730 years.",
          predict: {
            prompt: "How many parent atoms are left after two half-lives?",
            options: ["None — it has all decayed", "About 200", "About 400", "About 600"],
            correct: 1,
            reveal:
              "Each half-life halves whatever is left, not the original amount. 800 → 400 → 200. That is why the curve gets closer and closer to zero without ever arriving.",
          },
        },
        {
          id: "one",
          phase: "measure",
          title: "Run one half-life",
          instruction: "Stop at 1.0 half-lives and record the parent count.",
          requireData: 1,
          check: {
            describe: "At least one half-life has passed",
            test: (v) => (v.facts.halfLivesElapsed as number) >= 1,
          },
        },
        {
          id: "three",
          phase: "measure",
          title: "Now run to three",
          instruction: "Record the parent count at 2 and at 3 half-lives.",
          requireData: 3,
          check: {
            describe: "At least three half-lives have passed",
            test: (v) => (v.facts.halfLivesElapsed as number) >= 3,
          },
          hints: ["Halve your previous number each time and check the sim against it."],
        },
        {
          id: "randomness",
          phase: "analyze",
          title: "Now use only 40 atoms",
          instruction: "Set the sample to 40 atoms and run again. Does the curve still look smooth?",
          check: {
            describe: "A small sample of 100 atoms or fewer",
            test: (v) => (v.params.atoms as number) <= 100,
          },
          write: {
            prompt: "Why is the curve ragged with 40 atoms and smooth with 800, if each atom behaves the same way?",
            placeholder: "Each atom decays at random, so with only a few ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Define a half-life",
          instruction: "One sentence, using the word 'remaining'.",
          write: {
            prompt: "What is a half-life?",
            placeholder: "A half-life is the time it takes for ...",
          },
        },
      ],
    },
    {
      id: "right-clock",
      title: "Which clock for which rock?",
      question: "Why can carbon-14 never date a dinosaur?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["HS-ESS1-6"],
      setup: { sample: "ash", isotope: "c14", atoms: 400, speed: 0.3 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The ash bed is 66 million years old. Carbon-14's half-life is 5,730 years.",
          predict: {
            prompt: "How many half-lives of carbon-14 fit into 66 million years?",
            options: ["About 12", "About 1,200", "About 11,500", "About 5,700"],
            correct: 2,
            reveal:
              "About 11,500 half-lives. After only 40 there is less than one atom left of a mole. Carbon-14 has nothing left to measure long before a million years, which is why it can never date a dinosaur.",
          },
        },
        {
          id: "fail",
          phase: "measure",
          title: "Try it and watch it fail",
          instruction: "Run carbon-14 against the ash bed. Record what happens to the parents.",
          requireData: 1,
          check: {
            describe: "Carbon-14 is selected on the ash sample",
            test: (v) => v.params.isotope === "c14" && v.params.sample === "ash",
          },
        },
        {
          id: "succeed",
          phase: "measure",
          title: "Now use the right clock",
          instruction: "Switch to potassium-40 and run it. Record the age it measures.",
          requireData: 2,
          check: {
            describe: "A clock that can actually date this sample",
            test: (v) => v.facts.clockUsable === true && v.facts.hasReading === true,
          },
          hints: [
            "The half-life needs to be in the same ballpark as the age you want.",
            "Potassium-40's half-life is 1.25 billion years. 66 million is a small slice of that — but a measurable one.",
          ],
        },
        {
          id: "relative",
          phase: "analyze",
          title: "Use it on the layers",
          instruction: "The ash sits between dinosaur-bearing rock below and none above.",
          write: {
            prompt: "What does the ash bed's absolute date tell you about the two layers around it?",
            placeholder: "The rock below must be older than ... and the rock above ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule for choosing a clock",
          instruction: "One sentence about half-life and sample age.",
          write: {
            prompt: "How do you choose the right isotope for a sample?",
            placeholder: "The half-life has to be ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "date-the-earth",
      title: "How old is the Earth?",
      brief: "Date a meteorite to within 5% of its real age.",
      bands: ["6-8", "9-12"],
      setup: { sample: "meteorite", isotope: "u238", atoms: 800, speed: 0.2 },
      goal: {
        describe: "Measure the meteorite within 5% of 4.567 billion years",
        test: (v) =>
          v.facts.sample === "meteorite" && v.facts.hasReading === true
          && (v.facts.measuredErrorPercent as number) >= 0
          && (v.facts.measuredErrorPercent as number) <= 5,
      },
      stars: {
        two: {
          describe: "Get within 2%",
          test: (v) =>
            v.facts.sample === "meteorite" && v.facts.hasReading === true
            && (v.facts.measuredErrorPercent as number) >= 0
            && (v.facts.measuredErrorPercent as number) <= 2,
        },
        three: {
          describe: "Get within 1%, using at least 800 atoms",
          test: (v) =>
            v.facts.sample === "meteorite" && v.facts.hasReading === true
            && (v.facts.measuredErrorPercent as number) >= 0
            && (v.facts.measuredErrorPercent as number) <= 1
            && (v.facts.totalAtoms as number) >= 800,
        },
      },
      hints: [
        "More atoms means less scatter. The error shrinks roughly as one over the square root of the count.",
        "Meteorites give the age of the solar system — 4.567 billion years — and that is where 4.6 billion for the Earth comes from.",
      ],
    },
    {
      id: "pick-the-clock",
      title: "The right tool for the job",
      brief: "Date all five samples, each with a clock that actually works.",
      bands: ["6-8", "9-12"],
      setup: { sample: "hearth", isotope: "c14", atoms: 400, speed: 0.3 },
      goal: {
        describe: "A usable clock with a reading on this sample",
        test: (v) => v.facts.clockUsable === true && v.facts.hasReading === true,
      },
      stars: {
        two: {
          describe: "Use the clock a geochronologist would choose",
          test: (v) => v.facts.usingBestClock === true && v.facts.hasReading === true,
        },
        three: {
          describe: "Land within 3% of the true age with the right clock",
          test: (v) =>
            v.facts.usingBestClock === true && v.facts.hasReading === true
            && (v.facts.measuredErrorPercent as number) >= 0
            && (v.facts.measuredErrorPercent as number) <= 3,
        },
      },
      hints: [
        "If nothing decays, the clock is too slow. If nothing is left, it is too fast.",
        "A rule of thumb: the sample's age should be between about a tenth of a half-life and ten half-lives.",
      ],
    },
  ],
};
