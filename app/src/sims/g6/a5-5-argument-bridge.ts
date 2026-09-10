import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { badge, caption, clamp01, glow, hexA, isDarkTheme, particleField, softShadow, vignette, type Particle } from "@ui/scene";

/**
 * Argument Bridge: The Delta Fish Kill — Grade 6, Unit A5.5: evidence only
 * counts if it is about the thing being claimed, and reasoning is what
 * carries the weight.
 *
 * Underneath the argument mechanic sits one real, fixed ecosystem history:
 * nitrate from a farm outfall drives an algae mat's growth over fourteen
 * days, the mat's own photosynthesis-by-day and respiration-by-night makes
 * the dissolved-oxygen swing more violent the thicker it gets, and a fixed
 * fish population dies off exactly when — and only when — oxygen has stayed
 * below 2 mg/L for more than three continuous hours, precomputed once from
 * that timeline the same way a real event is history, not a live rerun.
 * Every evidence card's relevance is a computed function of what it actually
 * measures, when, and where: a true oxygen reading taken at noon, or a true
 * nitrate reading taken nowhere near the fish, is a thin plank not because
 * the rules say so but because changing that number would not have changed
 * the death toll. The bridge and its cart make that thinness physical.
 */

/* ------------------------------------------------------------------ *
 * The real ecosystem history — fixed, computed once, never re-rolled
 * ------------------------------------------------------------------ */

const DAY_MIN = -14, DAY_MAX = 2;
const POP0 = 400;
const DEATH_O2 = 2.0;      // spec: mg/L
const DEATH_HOURS = 3;     // spec: continuous hours below that line
const BOTTOM_DEPTH_M = 3.0;

const MAT_START = 0.18, MAT_MAX = 0.88;
const SAFE_O2 = 7.0;

function o2Saturation(tempC: number): number {
  return 14.62 - 0.3808 * tempC + 0.00527 * tempC * tempC;
}

/** Algae mat cover, 0-1: logistic growth on nitrate loading, then collapse. */
function matCoverFrac(day: number): number {
  if (day <= 0) {
    const t = (day - DAY_MIN) / (0 - DAY_MIN);
    return MAT_START + (MAT_MAX - MAT_START) / (1 + Math.exp(-10 * (t - 0.62)));
  }
  return MAT_MAX * Math.exp(-day * 0.9);
}

/**
 * Farm outfall nitrate, mg/L: rising over the two weeks, driving the mat, and
 * genuinely diluting with distance downstream from the outfall (site 0 m).
 */
function nitrateMgL(day: number, siteM = 0): number {
  const atOutfall = 0.15 + 2.3 / (1 + Math.exp(-0.9 * (day + 5)));
  const baseline = 0.12;
  return baseline + (atOutfall - baseline) * Math.exp(-siteM / 200);
}

/** Water temperature, degrees C: a mild two-week warming trend. */
function waterTempC(day: number): number {
  return 20 + 0.35 * day;
}

/** Salinity, psu: flat and fresh throughout — no tidal intrusion occurred. */
function salinityPsu(_day: number): number {
  return 0.4;
}

/**
 * Dissolved oxygen, mg/L: diurnal swing that gets worse as the mat thickens.
 * The mat itself hugs the north bank near the outfall (site 0 m), so its
 * effect on the diurnal swing genuinely fades with distance from there.
 */
function trueOxygen(day: number, hour: number, depthM: number, siteM = 0): number {
  const matLocal = matCoverFrac(day) * clamp01(1 - siteM / 400);
  const sat = o2Saturation(waterTempC(day));
  const diel = Math.cos((2 * Math.PI * (hour - 16)) / 24); // +1 at 16:00, -1 near 04:00
  const swing = matLocal * 6.5;
  const base = sat - matLocal * 1.5;
  const depthPenalty = depthM * 0.6;
  return Math.max(0.2, base + swing * diel - depthPenalty);
}

interface DayRecord { day: number; crashHours: number; mortalityFrac: number; deaths: number; survivors: number }

function buildMortalityTimeline(): DayRecord[] {
  const out: DayRecord[] = [];
  let survivors = POP0;
  for (let day = DAY_MIN; day <= DAY_MAX; day++) {
    let streak = 0, worst = 0;
    for (let h = 0; h < 24; h++) {
      const o2 = trueOxygen(day, h, BOTTOM_DEPTH_M);
      streak = o2 < DEATH_O2 ? streak + 1 : 0;
      if (h <= 9) worst = Math.max(worst, streak); // the dawn-adjacent window
    }
    const crashHours = Math.max(0, worst - DEATH_HOURS);
    const mortalityFrac = clamp01(crashHours * 0.09);
    const deaths = Math.min(survivors, Math.round(survivors * mortalityFrac));
    survivors -= deaths;
    out.push({ day, crashHours, mortalityFrac, deaths, survivors });
  }
  return out;
}

const TIMELINE = buildMortalityTimeline();
function recordFor(day: number): DayRecord {
  const clamped = Math.max(DAY_MIN, Math.min(DAY_MAX, Math.round(day)));
  return TIMELINE[clamped - DAY_MIN];
}
function totalDeaths(): number {
  return POP0 - TIMELINE[TIMELINE.length - 1].survivors;
}
function firstCrashDay(): number {
  const hit = TIMELINE.find((r) => r.deaths > 0);
  return hit ? hit.day : DAY_MAX + 1;
}

/**
 * The same mortality rule, recomputed with ONE specific reading forced to a
 * safe/neutral value — the counterfactual a relevance score is actually
 * measuring. This is what lets the fit meter be computed, not scripted: a
 * card is relevant exactly as much as changing its own number would have
 * changed the death toll, nothing more and nothing less.
 *
 *   - an oxygen card neutralises only its own hour, on its own day —
 *     unless that hour was inside the crash streak, nothing changes;
 *   - a nitrate or algae card neutralises that one day's mat contribution
 *     to the oxygen budget — a single day's worth of a fourteen-day,
 *     cumulative process, so on its own it moves very little;
 *   - a temperature card neutralises that one day's saturation offset,
 *     which this model makes a small, secondary effect.
 */
function perturbedTotalDeaths(quantity: Quantity, day: number, hour: number): number {
  let survivors = POP0;
  for (let d = DAY_MIN; d <= DAY_MAX; d++) {
    let streak = 0, worst = 0;
    for (let h = 0; h < 24; h++) {
      const hits = d === day && (quantity !== "oxygen" || h === hour);
      let o2: number;
      if (hits && quantity === "oxygen") {
        o2 = SAFE_O2;
      } else if (hits && (quantity === "nitrate" || quantity === "algae")) {
        const matFactor = MAT_START; // that day's mat contribution neutralised
        const sat = o2Saturation(waterTempC(d));
        const diel = Math.cos((2 * Math.PI * (h - 16)) / 24);
        o2 = Math.max(0.2, sat - matFactor * 1.5 + matFactor * 6.5 * diel - BOTTOM_DEPTH_M * 0.6);
      } else if (hits && quantity === "temperature") {
        const matFactor = matCoverFrac(d);
        const sat = o2Saturation(20); // that day's temperature offset neutralised
        const diel = Math.cos((2 * Math.PI * (h - 16)) / 24);
        o2 = Math.max(0.2, sat - matFactor * 1.5 + matFactor * 6.5 * diel - BOTTOM_DEPTH_M * 0.6);
      } else {
        o2 = trueOxygen(d, h, BOTTOM_DEPTH_M);
      }
      streak = o2 < DEATH_O2 ? streak + 1 : 0;
      if (h <= 9) worst = Math.max(worst, streak);
    }
    const crashHours = Math.max(0, worst - DEATH_HOURS);
    const mortalityFrac = clamp01(crashHours * 0.09);
    const deaths = Math.min(survivors, Math.round(survivors * mortalityFrac));
    survivors -= deaths;
  }
  return POP0 - survivors;
}

/* ------------------------------------------------------------------ *
 * Evidence cards — fixed canonical samples, each genuinely drawn from the
 * history above at its own place, depth and hour
 * ------------------------------------------------------------------ */

type Quantity = "oxygen" | "nitrate" | "temperature" | "algae" | "salinity";
type ClaimId = "vague" | "lowOxygenDawn" | "fertiliser" | "tooHot" | "algaeEatFish";

interface CardDef { key: string; quantity: Quantity; day: number; hour: number; depthM: number; label: string }

const CARD_DEFS: CardDef[] = [
  { key: "oxygenDawn", quantity: "oxygen", day: -1, hour: 5, depthM: 2.5, label: "O2 before dawn, under the mat" },
  { key: "oxygenDawn2", quantity: "oxygen", day: -2, hour: 4, depthM: 2.5, label: "O2 before dawn, a second night" },
  { key: "oxygenNoon", quantity: "oxygen", day: -1, hour: 16, depthM: 0.5, label: "O2 at noon, surface" },
  { key: "nitrateOutfall", quantity: "nitrate", day: -1, hour: 12, depthM: 0.5, label: "Nitrate at the outfall, noon" },
  { key: "tempNoon", quantity: "temperature", day: -1, hour: 12, depthM: 0.5, label: "Temperature at noon" },
  { key: "algaeCover", quantity: "algae", day: -1, hour: 12, depthM: 0, label: "Algae mat cover" },
  { key: "salinity", quantity: "salinity", day: -1, hour: 12, depthM: 0.5, label: "Salinity" },
];

function valueOf(quantity: Quantity, day: number, hour: number, depthM: number): number {
  if (quantity === "oxygen") return trueOxygen(day, hour, depthM);
  if (quantity === "nitrate") return nitrateMgL(day);
  if (quantity === "temperature") return waterTempC(day);
  if (quantity === "algae") return matCoverFrac(day) * 100;
  return salinityPsu(day);
}

/**
 * Which quantity a claim's asserted mechanism runs on, in this model — a
 * structural fact about what the words mean, exactly like a chart type
 * declaring which column types it accepts. `null` names no mechanism at all.
 */
const CLAIM_MECHANISM: Record<ClaimId, Quantity | null> = {
  vague: null,
  lowOxygenDawn: "oxygen",
  fertiliser: "nitrate",
  tooHot: "temperature",
  algaeEatFish: null, // predation has no channel in this model whatsoever
};

/**
 * Relevance, 0-100: how much THIS card's own number would have changed the
 * modelled death toll — a real sensitivity, read off `perturbedTotalDeaths`,
 * never an authored weight. The claim only ever gates WHICH quantity is even
 * a candidate for its mechanism; once a card passes that gate, its score is
 * whatever the counterfactual actually says. Claim-level ceilings (a vague
 * claim, a claim whose named mechanism this model does not implement) are
 * applied once to the COMBINED argument in `argumentStrength`, never here —
 * capping each card individually let enough weak, non-zero cards multiply
 * their way past a claim's honest ceiling when many were placed at once.
 */
function relevanceForClaim(quantity: Quantity, day: number, hour: number, claim: ClaimId): number {
  if (claim === "algaeEatFish") return 5; // no predation pathway exists to be sensitive to
  const wanted = CLAIM_MECHANISM[claim];
  if (wanted && quantity !== wanted) return 3; // the wrong quantity for this claim's mechanism entirely
  if (quantity === "salinity") return 4; // never part of any claim's mortality pathway — see the rebuttal check instead

  const base = totalDeaths();
  const perturbed = perturbedTotalDeaths(quantity, day, hour);
  const sensitivity = base > 0 ? clamp01(Math.abs(base - perturbed) / base) : 0;
  return Math.round(sensitivity * 100);
}

function cardsFor(claim: ClaimId) {
  return CARD_DEFS.map((c) => {
    const value = valueOf(c.quantity, c.day, c.hour, c.depthM);
    return { ...c, value, relevance: relevanceForClaim(c.quantity, c.day, c.hour, claim) };
  });
}

/** The claim's own honest ceiling on how strong ANY combination of evidence can make it look. */
const CLAIM_CEILING: Record<ClaimId, number> = {
  vague: 42,           // names no mechanism — capped however much true evidence piles on
  fertiliser: 45,       // real upstream cause, wrong asserted mechanism (poisoning, not asphyxiation)
  tooHot: 45,           // a genuine but minor contributor, overstated as the whole cause
  algaeEatFish: 8,      // no mechanism at all
  lowOxygenDawn: 100,   // the specific, correct claim — no artificial ceiling
};

/**
 * Combined argument strength, 0-100: not an average (which a single strong
 * card and a pile of weak ones would silently dilute) but the coverage many
 * independent pieces of relevant evidence provide together — one very
 * relevant card plus a second nearly-as-relevant one covers more of the
 * question than either alone, exactly as two independent readings should.
 */
function combinedStrength(cards: { relevance: number }[], ceiling: number): number {
  if (cards.length === 0) return 0;
  const uncovered = cards.reduce((acc, c) => acc * (1 - c.relevance / 100), 1);
  return Math.min(ceiling, Math.round((1 - uncovered) * 100));
}

const LOAD_BASE = 15; // minimum combined strength a 1x cart demands

/* ------------------------------------------------------------------ *
 * State — a light animation clock; the history itself is fixed
 * ------------------------------------------------------------------ */

interface State { tSec: number }

const model: SimModel<State> = {
  init() {
    return { tSec: 0 };
  },
  step(state, dt) {
    if (dt <= 0) return state;
    return { tSec: state.tSec + dt };
  },
  readouts(_state, params) {
    const claim = params.claim as ClaimId;
    const day = params.timelineDay as number;
    const hour = params.timelineHour as number;
    const depth = params.sampleDepthM as number;
    const site = params.sampleSiteM as number;
    const rec = recordFor(day);
    return [
      { key: "oxygenNow", label: "Oxygen at sample point (mg/L)", quantity: q(trueOxygen(day, hour, depth, site), "ratio"), semantic: "cold", graphable: true },
      { key: "nitrateNow", label: "Nitrate (mg/L)", quantity: q(nitrateMgL(day, site), "ratio"), semantic: "acid", graphable: true },
      { key: "tempNow", label: "Temperature", unit: "°C", quantity: q(waterTempC(day) + 273.15, "temperature"), semantic: "hot", graphable: true },
      { key: "matCover", label: "Algae mat cover", quantity: q(matCoverFrac(day), "percent"), semantic: "producer", graphable: true },
      { key: "survivors", label: "Fish surviving", quantity: q(rec.survivors, "population"), semantic: "primary-consumer", graphable: true },
      { key: "claimStrength", label: "Claim strength", quantity: q(claimStrength(params) / 100, "percent"), semantic: "neutral" },
    ];
  },
  facts(_state, params) {
    const claim = params.claim as ClaimId;
    const day = params.timelineDay as number;
    const hour = params.timelineHour as number;
    const depth = params.sampleDepthM as number;
    const site = params.sampleSiteM as number;
    const cards = cardsFor(claim);
    const placed = cards.filter((c) => params[`evidence${cap(c.key)}`] === true);
    const argumentStrength = combinedStrength(placed, CLAIM_CEILING[claim]);
    const required = LOAD_BASE * (0.5 + 0.5 * (params.challengeWeight as number));
    const rebuttalNeeds = params.rebuttalBot === true;
    const hasSalinity = placed.some((c) => c.key === "salinity");
    const rebuttalOk = !rebuttalNeeds || hasSalinity;
    const crosses = placed.length > 0 && argumentStrength >= required && rebuttalOk;
    const weakest = placed.length ? placed.reduce((a, b) => (a.relevance < b.relevance ? a : b)) : null;
    const rec = recordFor(day);
    return {
      claim,
      oxygenNow: trueOxygen(day, hour, depth, site),
      nitrateNow: nitrateMgL(day, site),
      tempNow: waterTempC(day),
      matCoverPct: matCoverFrac(day) * 100,
      salinityNow: salinityPsu(day),
      survivors: rec.survivors,
      deathsSoFar: POP0 - rec.survivors,
      totalDeaths: totalDeaths(),
      firstCrashDay: firstCrashDay(),
      crashHoursToday: rec.crashHours,
      cardCount: placed.length,
      argumentStrength,
      requiredStrength: required,
      rebuttalNeeds,
      rebuttalOk,
      loadTestPass: crosses,
      weakestCard: weakest ? weakest.key : "",
      weakestRelevance: weakest ? weakest.relevance : 0,
      claimStrength: claimStrength(params),
      hasOxygenDawn: params.evidenceOxygenDawn === true,
      hasOxygenDawn2: params.evidenceOxygenDawn2 === true,
      hasOxygenNoon: params.evidenceOxygenNoon === true,
      hasNitrateOutfall: params.evidenceNitrateOutfall === true,
      hasTempNoon: params.evidenceTempNoon === true,
      hasAlgaeCover: params.evidenceAlgaeCover === true,
      hasSalinity,
      oxygenDawnRelevance: cards.find((c) => c.key === "oxygenDawn")!.relevance,
      oxygenNoonRelevance: cards.find((c) => c.key === "oxygenNoon")!.relevance,
      nitrateOutfallRelevance: cards.find((c) => c.key === "nitrateOutfall")!.relevance,
      tempNoonRelevance: cards.find((c) => c.key === "tempNoon")!.relevance,
    };
  },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function claimStrength(params: ParamValues): number {
  const claim = params.claim as ClaimId;
  const cards = cardsFor(claim);
  const placed = cards.filter((c) => params[`evidence${cap(c.key)}`] === true);
  if (!placed.length) return 0;
  const strength = combinedStrength(placed, CLAIM_CEILING[claim]);
  const rebuttalPenalty = params.rebuttalBot === true && !placed.some((c) => c.key === "salinity") ? 0.6 : 1.0;
  return Math.round(strength * rebuttalPenalty);
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp: number): string {
  return Number.isFinite(v) ? v.toFixed(dp) : "--";
}

function render(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height, time } = rc;
  const dark = isDarkTheme(theme);
  ctx.fillStyle = dark ? "#101820" : "#dce7e2";
  ctx.fillRect(0, 0, width, height);

  const topH = height * 0.44;
  const claim = params.claim as ClaimId;
  const day = params.timelineDay as number;
  const rec = recordFor(day);
  const mat = matCoverFrac(day);

  /* --- the slough --------------------------------------------------- */
  const water = ctx.createLinearGradient(0, 0, 0, topH);
  water.addColorStop(0, dark ? "#233a2f" : "#4f7d63");
  water.addColorStop(1, dark ? "#0e1a15" : "#2c4a3a");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, width, topH);
  ctx.fillStyle = hexA("#3e6b32", 0.25 + 0.55 * mat);
  ctx.fillRect(0, 0, width, topH * 0.5);
  caption(ctx, 10, 16, `day ${day >= 0 ? "+" : ""}${day}  ·  mat ${(mat * 100).toFixed(0)}%`, theme, { size: 11, weight: 700, color: "#fff" });

  const aliveFrac = rec.survivors / POP0;
  const fish: Particle[] = [];
  const n = Math.round(60 * aliveFrac);
  for (let i = 0; i < n; i++) {
    fish.push({
      x: ((i * 53 + time * 12) % (width - 20)) + 10,
      y: topH * (0.3 + 0.5 * ((i * 0.37) % 1)) + Math.sin(time + i) * 4,
      r: 2.2, a: 0.85,
    });
  }
  particleField(ctx, fish, "#cfe8d8", { alpha: 0.9 });
  if (aliveFrac < 1) {
    const dead: Particle[] = [];
    for (let i = 0; i < Math.round(24 * (1 - aliveFrac)); i++) {
      dead.push({ x: ((i * 71) % (width - 20)) + 10, y: topH * 0.12 + (i % 5) * 3, r: 2, a: 0.7 });
    }
    particleField(ctx, dead, "#c9c9b8", { alpha: 0.7 });
  }
  badge(ctx, width - 12, 18, `${rec.survivors}/${POP0}`, theme, { align: "right", color: theme.sci["primary-consumer"], sub: "fish alive" });

  /* --- the bridge ----------------------------------------------------- */
  const bY = topH + (height - topH) * 0.72;
  const pierL = width * 0.1, pierR = width * 0.9;
  ctx.fillStyle = dark ? "#3a3f47" : "#8a8f97";
  ctx.fillRect(pierL - 12, bY, 12, height - bY);
  ctx.fillRect(pierR, bY, 12, height - bY);
  caption(ctx, pierL - 6, bY - 10, "evidence", theme, { align: "center", size: 10, color: theme.inkSoft });
  caption(ctx, pierR + 6, bY - 10, "claim", theme, { align: "center", size: 10, color: theme.inkSoft });

  const cards = cardsFor(claim);
  const placed = cards.filter((c) => params[`evidence${cap(c.key)}`] === true);
  const spanW = pierR - pierL;
  const plankW = placed.length ? spanW / placed.length : spanW;
  placed.forEach((c, i) => {
    const px = pierL + i * plankW;
    const thick = 3 + (c.relevance / 100) * 14;
    ctx.fillStyle = hexA(theme.sci[c.relevance >= 50 ? "producer" : "hot"], 0.85);
    roundRect(ctx, px + 4, bY - thick, plankW - 8, thick, 3);
    ctx.fill();
    caption(ctx, px + plankW / 2, bY - thick - 8, `${c.relevance}%`, theme, { align: "center", size: 9, color: theme.inkSoft });
  });
  if (placed.length === 0) {
    ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pierL, bY);
    ctx.lineTo(pierR, bY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const argumentStrength = combinedStrength(placed, CLAIM_CEILING[claim]);
  const required = LOAD_BASE * (0.5 + 0.5 * (params.challengeWeight as number));
  const rebuttalOk = params.rebuttalBot !== true || placed.some((c) => c.key === "salinity");
  const crosses = placed.length > 0 && argumentStrength >= required && rebuttalOk;
  const cartT = clamp01((Math.sin(time * 0.6) + 1) / 2);
  const crossFrac = crosses ? cartT : Math.min(cartT, 0.45);
  const cartX = pierL + spanW * crossFrac;
  const cartY = crosses || crossFrac < 0.44 ? bY - 10 : bY + 14;
  softShadow(ctx, () => {
    ctx.fillStyle = "#b23b2e";
    roundRect(ctx, cartX - 10, cartY - 8, 20, 12, 3);
    ctx.fill();
  }, { blur: 6, dy: 3, alpha: 0.3 });
  if (!crosses && crossFrac >= 0.4) glow(ctx, cartX, cartY, 16, hexA("#b23b2e", 0.5));

  badge(ctx, width / 2, bY + 30, crosses ? "ARGUMENT HOLDS" : "BRIDGE COLLAPSES", theme, {
    align: "center", color: crosses ? theme.sci["neutral"] : theme.sci["hot"],
  });
  badge(ctx, 12, height - 14, `strength ${argumentStrength.toFixed(0)} / needs ${required.toFixed(0)}`, theme, { color: theme.inkSoft });
  if (params.rebuttalBot === true && !rebuttalOk) {
    badge(ctx, width - 12, height - 14, "rebuttal: a salty tide?", theme, { align: "right", color: theme.sci["hot"] });
  }

  if (params.revealCauseChain === true) {
    caption(ctx, width / 2, topH - 12, "true chain: nitrate -> mat growth -> dawn O2 crash -> fish kill", theme, {
      align: "center", size: 10, color: "#fff", weight: 700,
    });
  }

  vignette(ctx, width, height, 0.1);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  claim: "vague", sampleSiteM: 50, sampleDepthM: 0.5, timelineDay: 0, timelineHour: 5,
  evidenceOxygenDawn: false, evidenceOxygenDawn2: false, evidenceOxygenNoon: false, evidenceNitrateOutfall: false,
  evidenceTempNoon: false, evidenceAlgaeCover: false, evidenceSalinity: false,
  challengeWeight: 2, rebuttalBot: true, revealCauseChain: false,
};

export const argumentBridgeSim: SimManifest<State> = {
  id: "g6.a5-5",
  title: "Argument Bridge: The Delta Fish Kill",
  tagline: "Pick a claim, load real evidence onto the bridge, and watch the cart find out whether your reasoning actually carries the weight.",
  subject: "biology",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-LS2-4"] },
  learningGoals: [
    "Distinguish a testable, specific claim from a vague one that no evidence can properly support.",
    "Compute relevance as how much a measurement would have changed the outcome, not merely whether it is true.",
    "Explain why the right claim can still fail to be a strong argument if its evidence is measured at the wrong time or place.",
  ],
  misconceptions: [
    "Evidence means any true fact you collected",
    "A correct conclusion excuses weak support for it",
    "A claim naming the right general area (\"something in the water\") is good enough",
    "A rebuttal only matters if it turns out to be right",
  ],
  interactionHint: "Sample the slough at different hours and depths, then place only the readings that actually speak to your claim.",
  tickRate: 10,
  timeScale: 1,
  params: {
    claim: {
      type: "option", label: "Claim",
      options: [
        { value: "vague", label: "Something in the water killed the fish" },
        { value: "lowOxygenDawn", label: "Low dissolved oxygen before dawn killed the fish" },
        { value: "fertiliser", label: "Fertiliser from the farm poisoned the fish" },
        { value: "tooHot", label: "The water got too hot for fish" },
        { value: "algaeEatFish", label: "Algae eat fish" },
      ],
      default: "vague",
      help: "Which card rises onto the claim pier — and how every evidence card is scored.",
    },
    sampleSiteM: { type: "number", label: "Sampling site", kind: "length", unit: "m", min: 0, max: 400, step: 5, default: 50, help: "Position along the 400 m reach for a free exploratory reading." },
    sampleDepthM: { type: "number", label: "Sample depth", kind: "length", unit: "m", min: 0, max: 3.5, step: 0.1, default: 0.5, help: "Oxygen is stratified — the bottom reads worst." },
    timelineDay: { type: "number", label: "Timeline: day", kind: "count", min: -14, max: 2, step: 1, default: 0, help: "Day 0 is the kill." },
    timelineHour: { type: "number", label: "Timeline: hour", kind: "count", min: 0, max: 23, step: 1, default: 5, help: "The oxygen crash sits between about 02:00 and 07:00." },
    evidenceOxygenDawn: { type: "boolean", label: "Card: O2 before dawn, under the mat", default: false },
    evidenceOxygenDawn2: { type: "boolean", label: "Card: O2 before dawn, a second night", default: false, help: "A second night's dawn reading — independent evidence covers more of the question than repeating the same one." },
    evidenceOxygenNoon: { type: "boolean", label: "Card: O2 at noon, surface", default: false },
    evidenceNitrateOutfall: { type: "boolean", label: "Card: nitrate at the outfall", default: false },
    evidenceTempNoon: { type: "boolean", label: "Card: temperature at noon", default: false },
    evidenceAlgaeCover: { type: "boolean", label: "Card: algae mat cover", default: false },
    evidenceSalinity: { type: "boolean", label: "Card: salinity", default: false, help: "The one reading that rules out a salty tide." },
    challengeWeight: { type: "number", label: "Challenge weight", kind: "ratio", min: 1, max: 5, step: 1, default: 2, help: "Ballast on the load-test cart — how strong the argument must be." },
    rebuttalBot: { type: "boolean", label: "Rebuttal bot", default: true, help: "Argues the strongest alternative the data still allows." },
    revealCauseChain: { type: "boolean", label: "Reveal true cause chain", default: false },
  },
  overlays: [],
  model,
  render,
  labs: [
    {
      id: "the-vague-claim",
      title: "The vague claim",
      question: "What is missing from a claim like this, and how would you make it testable?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, claim: "vague", evidenceOxygenDawn: true, evidenceNitrateOutfall: true, evidenceTempNoon: true, challengeWeight: 2, rebuttalBot: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Three real cards are already on the bridge, under the vaguest possible claim.",
          predict: {
            prompt: "Will three true, relevant-sounding readings be enough to hold up 'something in the water'?",
            options: ["Yes — three real readings are plenty", "No — a claim that names no mechanism caps every card's relevance"],
            correct: 1,
            reveal: "No. However true the readings are, a claim that names no mechanism cannot be strongly supported by anything — relevance is capped low across the board.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the load test",
          instruction: "Watch the bridge under the current weight.",
          requireData: 1,
          check: { describe: "The bridge is recorded as failing under the vague claim", test: (v) => v.facts.loadTestPass === false && v.facts.claim === "vague" },
        },
        {
          id: "specific",
          phase: "measure",
          title: "Make it specific",
          instruction: "Switch the claim to 'Low dissolved oxygen before dawn killed the fish', keep the same three cards.",
          check: {
            describe: "Same cards, specific claim — the average relevance changes",
            test: (v) => v.params.claim === "lowOxygenDawn" && v.facts.cardCount === 3,
          },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare argument strength",
          instruction: "Note the argument strength readout for the vague claim versus the specific one.",
          check: { describe: "Argument strength is being tracked", test: (v) => typeof v.facts.argumentStrength === "number" },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Fix the claim",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "What exactly is missing from 'something in the water killed the fish', and how would you rewrite it to be testable?",
            placeholder: "It is missing ...; a testable version would be ...",
          },
        },
      ],
    },
    {
      id: "right-answer-wrong-evidence",
      title: "Right answer, wrong evidence",
      question: "Your claim matches the true cause. Why does the bridge still collapse?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, claim: "lowOxygenDawn", evidenceNitrateOutfall: true, evidenceTempNoon: true, challengeWeight: 2, rebuttalBot: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the collapse",
          instruction: "The claim is correct. The two cards on it are a nitrate reading and a temperature reading, both at noon.",
          predict: {
            prompt: "Will the correct claim be enough to make these two cards strong evidence for it?",
            options: ["Yes — the claim is right, so any related reading should count", "No — neither card is actually an oxygen reading, let alone one from before dawn"],
            correct: 1,
            reveal: "No. Relevance is about the specific reading, not the general topic — a noon nitrate value and a noon temperature value do not show a dawn oxygen crash, whatever the claim says.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Watch it fail",
          instruction: "Run the load test on the correct claim with the wrong evidence.",
          requireData: 1,
          check: { describe: "Fails despite the correct claim", test: (v) => v.facts.loadTestPass === false && v.facts.claim === "lowOxygenDawn" },
        },
        {
          id: "check-relevance",
          phase: "analyze",
          title: "Read the relevance scores",
          instruction: "Check both cards' individual relevance to this specific claim.",
          check: {
            describe: "Both misplaced cards score low relevance",
            test: (v) => (v.facts.nitrateOutfallRelevance as number) < 20 && (v.facts.tempNoonRelevance as number) < 20,
          },
        },
        {
          id: "fix",
          phase: "measure",
          title: "Add the real evidence",
          instruction: "Add the O2-before-dawn card and re-run.",
          check: { describe: "With the dawn oxygen card added, the bridge now holds", test: (v) => v.params.evidenceOxygenDawn === true && v.facts.loadTestPass === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the collapse",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Your claim matched the simulator's own true cause. Why did the bridge still collapse before you added the dawn oxygen card?",
            placeholder: "The bridge collapsed because the cards on it were about ..., not about ...",
          },
        },
      ],
    },
    {
      id: "before-dawn-under-the-mat",
      title: "Before dawn, under the mat",
      question: "What can that one number support that a noon sample could not?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, claim: "lowOxygenDawn", timelineDay: -1, timelineHour: 5, sampleDepthM: 2.5, rebuttalBot: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the reading",
          instruction: "Day -1, 05:00, 2.5 m deep — right in the crash window.",
          predict: {
            prompt: "Will this reading sit above or below the 2 mg/L death line?",
            options: ["Above it — comfortably safe", "Below it — right in the danger zone"],
            correct: 1,
            reveal: "Below it. This is exactly the place, depth and hour the nightly crash is worst.",
          },
        },
        {
          id: "sample",
          phase: "measure",
          title: "Take the reading",
          instruction: "Record the oxygen readout at this exact sample point.",
          requireData: 1,
          check: { describe: "The live oxygen reading is below the death threshold", test: (v) => (v.facts.oxygenNow as number) < 2.0 },
        },
        {
          id: "add-card",
          phase: "measure",
          title: "Place it on the bridge",
          instruction: "Add the O2-before-dawn evidence card.",
          check: { describe: "Dawn oxygen card placed, genuinely relevant to this claim", test: (v) => v.params.evidenceOxygenDawn === true && (v.facts.oxygenDawnRelevance as number) > 20 },
        },
        {
          id: "compare-noon",
          phase: "analyze",
          title: "Compare to noon",
          instruction: "Move the timeline to hour 16 at the same day and depth and compare.",
          check: {
            describe: "At 16:00, oxygen sits well above the death line",
            test: (v) => v.params.timelineHour === 16 && (v.facts.oxygenNow as number) > 4,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what one number buys you",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "What can this one dawn, under-the-mat oxygen number support that a sample taken at noon could not?",
            placeholder: "This number can support ... because ...",
          },
        },
      ],
    },
    {
      id: "the-opposing-scientist",
      title: "The opposing scientist",
      question: "Which single extra measurement removes the salty-tide alternative, and why?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-LS2-4"],
      setup: { ...BASE_SETUP, claim: "lowOxygenDawn", evidenceOxygenDawn: true, challengeWeight: 2, rebuttalBot: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the rebuttal",
          instruction: "The dawn oxygen card is on the bridge, strong enough on its own — but the rebuttal bot is active.",
          predict: {
            prompt: "Will the correct oxygen evidence alone survive the rebuttal?",
            options: ["Yes — it is the true cause", "No — the rebuttal specifically demands ruling out a separate alternative"],
            correct: 1,
            reveal: "No. A rebuttal is not defeated by more of the same evidence — it takes a measurement that speaks directly to the alternative explanation.",
          },
        },
        {
          id: "watch-fail",
          phase: "measure",
          title: "Watch it fail the rebuttal",
          instruction: "Run the load test as currently set up.",
          requireData: 1,
          check: { describe: "Fails specifically on the rebuttal, not on relevance", test: (v) => v.facts.rebuttalOk === false && v.facts.loadTestPass === false },
        },
        {
          id: "add-salinity",
          phase: "measure",
          title: "Add the salinity card",
          instruction: "Add the salinity evidence card and re-run.",
          check: { describe: "Salinity card added, rebuttal now satisfied", test: (v) => v.params.evidenceSalinity === true && v.facts.rebuttalOk === true },
        },
        {
          id: "cross",
          phase: "analyze",
          title: "Confirm it crosses",
          instruction: "Confirm the bridge now holds even at 5x weight.",
          check: { describe: "Load test passes at challenge weight 5", test: (v) => v.params.challengeWeight === 5 && v.facts.loadTestPass === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the measurement",
          instruction: "Answer the scenario's exact question.",
          write: {
            prompt: "Which single extra measurement removes the salty-tide alternative, and why does that specific one do it?",
            placeholder: "Salinity, because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "build-the-strongest-case",
      title: "Build the strongest case",
      brief: "Choose the correct claim and load exactly the evidence that survives a 5x rebuttal-armed load test.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, challengeWeight: 5, rebuttalBot: true },
      goal: {
        describe: "Load test passes at challenge weight 5 with the rebuttal bot on",
        test: (v) => v.facts.loadTestPass === true && v.params.challengeWeight === 5 && v.facts.rebuttalNeeds === true,
      },
      hints: [
        "Only one of the five claims names the mechanism this model actually runs.",
        "The dawn, under-the-mat oxygen card is the single most relevant piece of evidence available.",
        "The rebuttal is never defeated by more of the same kind of evidence.",
      ],
    },
    {
      id: "every-claim-has-a-ceiling",
      title: "Every claim has a ceiling",
      brief: "Show that the vague claim and the 'algae eat fish' claim can never clear even a 1x load test, however much true evidence you pile on.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, challengeWeight: 1, rebuttalBot: false },
      goal: {
        describe: "Both claims fail a 1x load test with every card placed",
        test: (v) => {
          const allOn = { evidenceOxygenDawn: true, evidenceOxygenNoon: true, evidenceNitrateOutfall: true, evidenceTempNoon: true, evidenceAlgaeCover: true, evidenceSalinity: true };
          const allSet = Object.entries(allOn).every(([k, val]) => v.params[k] === val);
          return allSet && (v.params.claim === "vague" || v.params.claim === "algaeEatFish") && v.facts.loadTestPass === false;
        },
      },
      hints: ["Turn on every evidence card at once and watch the argument strength still fall short."],
    },
  ],
};
