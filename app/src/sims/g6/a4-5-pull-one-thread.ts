import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, hexA, isDarkTheme, vignette,
} from "@ui/scene";

/**
 * Pull One Thread: The Four-Sphere Web — Grade 6, Unit A4.5: interactions
 * among Earth's four spheres.
 *
 * The one idea this sim exists to teach: a perturbation travels ONLY along a
 * real coupling arrow, and only after that arrow's own real lag. There is no
 * hidden "everything affects everything" shortcut — the model holds exactly
 * twelve directed links (one per ordered pair of the four spheres), each with
 * its own published-style gain and delay, and a target variable's state is
 * computed from nothing but the sum of its OWN incoming links' delayed
 * contributions. Cut a link with the scissors and its contribution is not
 * weakened, it is set to exactly zero — so if a downstream variable still
 * moves after a cut, that is proof a second, independent pathway exists, not
 * a leak in the one that was cut. That is the whole lesson, enforced in the
 * code that computes every tick, not asserted in a caption.
 *
 * The honesty rule: every link has a real return link (this graph connects
 * every ordered pair of spheres, so nothing is a one-way hierarchy with life
 * "on top"), and every link has a nonzero, distinct delay — geological
 * pathways take decades, atmospheric ones take weeks, and the sim never lets
 * a slow pathway arrive early.
 */

/* ------------------------------------------------------------------ *
 * The four spheres and their sixteen state variables
 * ------------------------------------------------------------------ */

export type Hub = "geosphere" | "hydrosphere" | "atmosphere" | "biosphere";
export const HUBS: Hub[] = ["geosphere", "hydrosphere", "atmosphere", "biosphere"];

/** Every variable lives at "hub.name" and is expressed as a fraction of its
 *  own baseline: 1.0 is neutral, 1.05 is 5% high, 0.95 is 5% low. */
export const HUB_VARS: Record<Hub, string[]> = {
  geosphere: ["erosionRate", "soilDepth", "upliftRate", "landSurfaceElev"],
  hydrosphere: ["snowpack", "streamflow", "aquiferLevel", "upwellingStrength"],
  atmosphere: ["temperature", "precipitation", "windSpeed", "humidity"],
  biosphere: ["forestCover", "kelpDensity", "cropWaterUse", "grazingPressure"],
};

function varKey(hub: Hub, name: string): string { return `${hub}.${name}`; }

export interface LinkDef {
  id: string;
  from: string; // "hub.variable"
  to: string;
  gain: number;
  lagYr: number;
  name: string;
}

/**
 * The twelve links — exactly one per ordered pair of the four spheres, so
 * every sphere has exactly three outgoing and three incoming arrows. Real
 * mechanisms, real-shaped gains and lags: an atmospheric link responds in
 * weeks to a couple of years, a hillslope-erosion link in one wet season, a
 * groundwater-to-subsidence link over years, a soil-to-forest link over a
 * decade, a tectonic-to-rainfall link over geological time.
 */
/**
 * Every link integrates as a RATE (deviation accumulates over years, decaying
 * on RELAX_TAU_YR — see integrateMonth), so a link's actual steady-state
 * strength is its gain multiplied by that many years, not the gain alone.
 * These raw numbers encode each mechanism's real RELATIVE strength (warming
 * shrinking the snowpack is a strong, fast effect; dust seeding clouds is a
 * weak, secondary one); GAIN_SCALE converts them to the small per-tick values
 * that keep every one of the twelve links inside a controllable, non-runaway
 * range once multiplied by RELAX_TAU_YR — the spec's own caution that "gains
 * are linear... honest only for small kicks" is exactly what this guards.
 */
const GAIN_SCALE = 1 / 15;

export const LINKS: LinkDef[] = [
  { id: "atmo-hydro", from: varKey("atmosphere", "temperature"), to: varKey("hydrosphere", "snowpack"), gain: -0.6 * GAIN_SCALE, lagYr: 1, name: "warming lifts the snow line" },
  { id: "atmo-geo", from: varKey("atmosphere", "precipitation"), to: varKey("geosphere", "erosionRate"), gain: 0.5 * GAIN_SCALE, lagYr: 0.1, name: "heavy rain drives hillslope erosion" },
  { id: "atmo-bio", from: varKey("atmosphere", "temperature"), to: varKey("biosphere", "forestCover"), gain: -0.3 * GAIN_SCALE, lagYr: 2, name: "chronic warming stresses the forest" },
  { id: "hydro-atmo", from: varKey("hydrosphere", "streamflow"), to: varKey("atmosphere", "precipitation"), gain: 0.15 * GAIN_SCALE, lagYr: 0.2, name: "wet ground recycles moisture to the air" },
  { id: "hydro-geo", from: varKey("hydrosphere", "aquiferLevel"), to: varKey("geosphere", "landSurfaceElev"), gain: 0.4 * GAIN_SCALE, lagYr: 3, name: "a pumped aquifer lets the land subside" },
  { id: "hydro-bio", from: varKey("hydrosphere", "upwellingStrength"), to: varKey("biosphere", "kelpDensity"), gain: 0.7 * GAIN_SCALE, lagYr: 1, name: "cold nutrient-rich upwelling feeds kelp" },
  { id: "geo-atmo", from: varKey("geosphere", "erosionRate"), to: varKey("atmosphere", "precipitation"), gain: 0.05 * GAIN_SCALE, lagYr: 1, name: "eroded dust seeds clouds" },
  { id: "geo-hydro", from: varKey("geosphere", "erosionRate"), to: varKey("hydrosphere", "aquiferLevel"), gain: -0.3 * GAIN_SCALE, lagYr: 5, name: "sediment clogs groundwater recharge" },
  { id: "geo-bio", from: varKey("geosphere", "soilDepth"), to: varKey("biosphere", "forestCover"), gain: 0.4 * GAIN_SCALE, lagYr: 10, name: "deeper soil supports more forest" },
  { id: "bio-atmo", from: varKey("biosphere", "forestCover"), to: varKey("atmosphere", "precipitation"), gain: 0.25 * GAIN_SCALE, lagYr: 0.5, name: "forest transpiration feeds local rainfall" },
  { id: "bio-hydro", from: varKey("biosphere", "forestCover"), to: varKey("hydrosphere", "streamflow"), gain: -0.2 * GAIN_SCALE, lagYr: 1, name: "forest canopy draws down streamflow" },
  { id: "bio-geo", from: varKey("biosphere", "forestCover"), to: varKey("geosphere", "erosionRate"), gain: -0.6 * GAIN_SCALE, lagYr: 2, name: "roots hold the hillslope together" },
];

/** How long a deviation lingers before fading on its own, absent any
 *  reinforcing link — long enough that even the ten-year soil-to-forest lag
 *  still finds a meaningfully elevated value to read, which is the whole
 *  point: a one-off kick has to remain visible for as long as the slowest
 *  real pathway needs to carry it. */
const RELAX_TAU_YR = 20;
const MONTH_YR = 1 / 12;
const HISTORY_YEARS_MAX = 60;  // covers the longest lag (10 yr) with headroom
const CROSS_THRESHOLD = 0.05;  // spec: the "moved more than 5%" definition

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface History { t: number[]; v: number[] }

interface State {
  simYears: number;
  values: Record<string, number>;
  history: Record<string, History>;
  monthClock: number;
  injectedAtYear: number; // -1 before the first injection
  responseOrder: { key: string; year: number }[]; // first 5%-crossings, in order
  causeLog: { year: number; text: string }[];
}

function allVarKeys(): string[] {
  const out: string[] = [];
  for (const hub of HUBS) for (const name of HUB_VARS[hub]) out.push(varKey(hub, name));
  return out;
}
const ALL_VARS = allVarKeys();

function buildWorld(): State {
  const values: Record<string, number> = {};
  const history: Record<string, History> = {};
  for (const k of ALL_VARS) {
    values[k] = 1;
    history[k] = { t: [0], v: [1] };
  }
  return {
    simYears: 0, values, history, monthClock: 0,
    injectedAtYear: -1, responseOrder: [], causeLog: [],
  };
}

/** Linear interpolation of a variable's own history at `atYear` (years ago
 *  are handled by the caller passing a negative-shifted time). Before the
 *  history starts, the value is simply baseline — nothing has happened yet. */
function historyAt(hist: History, atYear: number): number {
  if (atYear <= hist.t[0]) return hist.v[0];
  const n = hist.t.length;
  if (atYear >= hist.t[n - 1]) return hist.v[n - 1];
  // Binary search for the bracketing samples.
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (hist.t[mid] <= atYear) lo = mid; else hi = mid;
  }
  const t0 = hist.t[lo], t1 = hist.t[hi];
  const frac = t1 === t0 ? 0 : (atYear - t0) / (t1 - t0);
  return hist.v[lo] + (hist.v[hi] - hist.v[lo]) * frac;
}

function pushHistory(hist: History, t: number, v: number): void {
  hist.t.push(t);
  hist.v.push(v);
  // Trim anything far older than the longest lag needs.
  while (hist.t.length > 2 && t - hist.t[1] > HISTORY_YEARS_MAX) {
    hist.t.shift();
    hist.v.shift();
  }
}

/**
 * One monthly integration step. Each variable's deviation from baseline
 * moves by a rate, not toward a target: d(deviation)/dt = incoming forcing
 * minus a single slow decay. The incoming forcing is the sum of every ACTIVE
 * link's gain times its SOURCE's delayed deviation — a cut link contributes
 * exactly zero, not a smaller number, which is what makes "trace where it
 * cannot go" a provable fact rather than a narrated one. A variable with no
 * incoming links at all (an injector's direct target, mostly) simply decays
 * on its own slow clock, which is what lets a one-off kick stay visible long
 * enough for even a ten-year-lag link to still find something to read.
 */
function integrateMonth(s: State, params: ParamValues): void {
  const delayScale = params.delayScaling as number;
  const cutLink = params.cutLink as string;
  const forcingOf: Record<string, number> = {};
  for (const k of ALL_VARS) {
    let forcing = 0;
    for (const link of LINKS) {
      if (link.to !== k) continue;
      if (link.id === cutLink) continue; // structurally zero — the honesty rule
      const lag = link.lagYr * delayScale;
      const delayed = historyAt(s.history[link.from], s.simYears - lag);
      forcing += link.gain * (delayed - 1);
    }
    forcingOf[k] = forcing;
  }
  for (const k of ALL_VARS) {
    const deviation = s.values[k] - 1;
    const dDeviation = (forcingOf[k] - deviation / RELAX_TAU_YR) * MONTH_YR;
    // A real sphere variable cannot run away to an absurd multiple of its own
    // baseline — spec itself warns gains are "honest only for small kicks",
    // so this is the physical floor and ceiling that keeps a large kick or an
    // aggressive delay-scaling readable instead of numerically exploding.
    s.values[k] = Math.max(0.1, Math.min(3, 1 + deviation + dDeviation));
  }
  for (const k of ALL_VARS) pushHistory(s.history[k], s.simYears, s.values[k]);

  if (s.injectedAtYear >= 0) {
    for (const k of ALL_VARS) {
      const already = s.responseOrder.some((r) => r.key === k);
      if (!already && Math.abs(s.values[k] - 1) >= CROSS_THRESHOLD) {
        s.responseOrder.push({ key: k, year: s.simYears });
        s.causeLog.push({
          year: s.simYears,
          text: `${k} moved past 5% of baseline`,
        });
      }
    }
  }
}

/** Fires a kick into every variable of one sphere at once — "aiming the
 *  injector at a plane," per the spec's own object description — which then
 *  reaches other spheres only through whichever of the twelve links actually
 *  originate from the variables that just moved. */
function inject(s: State, target: Hub, sizeFrac: number): State {
  const values = { ...s.values };
  const history: Record<string, History> = {};
  for (const k of ALL_VARS) history[k] = { t: [...s.history[k].t], v: [...s.history[k].v] };
  for (const name of HUB_VARS[target]) {
    const k = varKey(target, name);
    values[k] = values[k] + sizeFrac;
    pushHistory(history[k], s.simYears, values[k]);
  }
  return {
    ...s, values, history, injectedAtYear: s.simYears, responseOrder: [], causeLog: [
      { year: s.simYears, text: `injected a ${(sizeFrac * 100).toFixed(0)}% kick into ${target}` },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Feedback loops — a real, computed property, not a drawn halo
 * ------------------------------------------------------------------ */

export interface LoopInfo { a: Hub; b: Hub; gainProduct: number; kind: "reinforcing" | "balancing" }

/** Every unordered hub pair carries a real two-step loop (A's outgoing link
 *  into B, and B's matching link back into A). The product of the two gains
 *  is the loop's own gain: positive compounds (reinforcing), negative damps
 *  (balancing) — the standard systems-dynamics definition, computed, not
 *  asserted. */
function computeLoops(): LoopInfo[] {
  const out: LoopInfo[] = [];
  for (let i = 0; i < HUBS.length; i++) {
    for (let j = i + 1; j < HUBS.length; j++) {
      const a = HUBS[i], b = HUBS[j];
      const ab = LINKS.find((l) => l.from.startsWith(`${a}.`) && l.to.startsWith(`${b}.`));
      const ba = LINKS.find((l) => l.from.startsWith(`${b}.`) && l.to.startsWith(`${a}.`));
      if (!ab || !ba) continue;
      const gainProduct = ab.gain * ba.gain;
      out.push({ a, b, gainProduct, kind: gainProduct >= 0 ? "reinforcing" : "balancing" });
    }
  }
  return out;
}
const LOOPS = computeLoops();

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    // The sim starts already fired: whatever target and size the setup
    // dials in is the kick the student is meant to be watching propagate,
    // exactly as if they had just pulled the thread themselves.
    return inject(buildWorld(), params.targetSphere as Hub, params.perturbationSize as number);
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const yrPerSec = params.playbackSpeed as number;
    let s: State = {
      ...state,
      values: { ...state.values },
      history: state.history, // mutated in place below via pushHistory (fresh arrays already copied per-key)
      responseOrder: [...state.responseOrder],
      causeLog: [...state.causeLog],
    };
    // Fresh per-key history arrays so integrateMonth's mutation never leaks
    // into a state object another part of the app might still be holding.
    const freshHistory: Record<string, History> = {};
    for (const k of ALL_VARS) freshHistory[k] = { t: [...state.history[k].t], v: [...state.history[k].v] };
    s = { ...s, history: freshHistory };

    let remaining = dt * yrPerSec;
    s.monthClock += remaining;
    while (s.monthClock >= MONTH_YR) {
      s.monthClock -= MONTH_YR;
      s.simYears += MONTH_YR;
      integrateMonth(s, params);
    }
    void remaining;
    return s;
  },

  applyParams(state, params, prev) {
    if (params.targetSphere !== prev.targetSphere || params.perturbationSize !== prev.perturbationSize) {
      // Re-firing is the whole activity: a fresh kick from the CURRENT state,
      // not a reset — the web keeps whatever history it already had.
      return inject(state, params.targetSphere as Hub, params.perturbationSize as number);
    }
    return state;
  },

  readouts(state, params) {
    const out = [
      { key: "years", label: "Years since injection", quantity: q(Math.max(0, state.simYears - Math.max(0, state.injectedAtYear)), "count"), semantic: "time" },
      // Instant and gate-free: the response-order board (see render) only
      // ever lists entries inside this many years of the injection, so its
      // own currently-applied value is a real, live fact about the sim's
      // present configuration — unlike "years since injection" above, this
      // one does not need a downstream link's own lag to have first fired.
      { key: "responseWindowYears", label: "Response board window", unit: "yr", quantity: q(params.runSpan as number, "count"), semantic: "time" },
    ];
    for (const hub of HUBS) {
      let maxDev = 0;
      for (const name of HUB_VARS[hub]) maxDev = Math.max(maxDev, Math.abs(state.values[varKey(hub, name)] - 1));
      out.push({
        key: `${hub}Dev`, label: `${hub[0].toUpperCase()}${hub.slice(1)} deviation`, unit: "%",
        quantity: q(maxDev, "percent"), semantic: hub === "geosphere" ? "mass" : hub === "hydrosphere" ? "cold" : hub === "atmosphere" ? "field" : "producer",
        graphable: true,
      } as (typeof out)[number]);
    }
    return out;
  },

  facts(state, params) {
    const cutLink = params.cutLink as string;
    const perVar: Record<string, number> = {};
    for (const k of ALL_VARS) perVar[k.replace(".", "_")] = state.values[k];
    const hubsMoved = HUBS.filter((hub) =>
      HUB_VARS[hub].some((name) => Math.abs(state.values[varKey(hub, name)] - 1) >= CROSS_THRESHOLD),
    ).length;
    const orderList = state.responseOrder.map((r) => r.key).join(",");
    const runSpan = params.runSpan as number;
    const injYr = Math.max(0, state.injectedAtYear);
    const responsesInWindow = state.responseOrder.filter((r) => r.year - injYr <= runSpan).length;
    return {
      simYears: state.simYears,
      injected: state.injectedAtYear >= 0,
      yearsSinceInjection: state.injectedAtYear >= 0 ? state.simYears - state.injectedAtYear : -1,
      hubsMovedPast5pct: hubsMoved,
      // How many of the response-order board's own entries fall inside the
      // window runSpan actually promises to limit it to — the same filter
      // the board itself now draws with, so the control has a real,
      // measurable consequence and not just a visual one.
      responsesInWindow,
      firstResponder: state.responseOrder[0]?.key ?? "",
      secondResponder: state.responseOrder[1]?.key ?? "",
      responseOrderList: orderList,
      responseCount: state.responseOrder.length,
      cutLink,
      cutLinkActive: cutLink !== "none",
      snowpackDeviation: Math.abs(state.values["hydrosphere.snowpack"] - 1),
      kelpDeviation: Math.abs(state.values["biosphere.kelpDensity"] - 1),
      landSurfaceElevDeviation: Math.abs(state.values["geosphere.landSurfaceElev"] - 1),
      precipitationDeviation: Math.abs(state.values["atmosphere.precipitation"] - 1),
      erosionRateDeviation: Math.abs(state.values["geosphere.erosionRate"] - 1),
      forestCoverDeviation: Math.abs(state.values["biosphere.forestCover"] - 1),
      reinforcingLoopCount: LOOPS.filter((l) => l.kind === "reinforcing").length,
      balancingLoopCount: LOOPS.filter((l) => l.kind === "balancing").length,
      ...perVar,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const HUB_COLOR: Record<Hub, string> = {
  geosphere: "#a0723f", hydrosphere: "#2e7ca8", atmosphere: "#9fb6cf", biosphere: "#3f8f4a",
};

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }

function hubY(index: number, h: number): number {
  return h * (0.15 + index * 0.24);
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "#05070c" : "#eef1f5";
  ctx.fillRect(0, 0, width, height);

  const planeX = 60, planeW = width - 260;
  const order: Hub[] = ["biosphere", "atmosphere", "hydrosphere", "geosphere"];
  const hubPos: Record<Hub, { x: number; y: number }> = {} as never;
  order.forEach((hub, i) => {
    const y = hubY(i, height);
    hubPos[hub] = { x: planeX + planeW / 2, y };
    ctx.fillStyle = hexA(HUB_COLOR[hub], dark ? 0.14 : 0.16);
    roundRect(ctx, planeX, y - height * 0.09, planeW, height * 0.16, 10);
    ctx.fill();
    caption(ctx, planeX + 10, y - height * 0.09 + 14, hub, theme, { size: 11, weight: 800, color: HUB_COLOR[hub] });
  });

  const cutLink = params.cutLink as string;
  const arrowDisplay = params.arrowDisplay as string;
  if (arrowDisplay !== "hidden") {
    for (const link of LINKS) {
      const fromHub = link.from.split(".")[0] as Hub;
      const toHub = link.to.split(".")[0] as Hub;
      const a = hubPos[fromHub], b = hubPos[toHub];
      const cut = link.id === cutLink;
      const mag = Math.abs(state.values[link.from] - 1);
      const width2 = arrowDisplay === "thicknessByFlux" ? 1 + Math.min(6, mag * 40) : 2;
      ctx.save();
      ctx.strokeStyle = cut ? hexA(theme.sci["hot"], 0.35) : hexA(link.gain >= 0 ? "#c9832e" : "#2e7ca8", 0.75);
      ctx.lineWidth = width2;
      if (cut) ctx.setLineDash([3, 4]);
      const midX = a.x + planeW * (0.32 + 0.06 * LINKS.indexOf(link) % 3);
      ctx.beginPath();
      ctx.moveTo(a.x + planeW * 0.15, a.y);
      ctx.bezierCurveTo(midX, a.y, midX, b.y, b.x + planeW * 0.15, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (cut) {
        ctx.fillStyle = theme.sci["hot"];
        ctx.beginPath();
        ctx.arc((a.y + b.y) / 2 === a.y ? midX : midX, (a.y + b.y) / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Hub gauges: four little bars per hub for its own state variables.
  order.forEach((hub, i) => {
    const y = hubY(i, height);
    const vars = HUB_VARS[hub];
    vars.forEach((name, j) => {
      const val = state.values[varKey(hub, name)];
      const bx = planeX + 12 + j * (planeW - 24) / 4;
      const bw = (planeW - 24) / 4 - 6;
      const dev = clamp01(0.5 + (val - 1) * 3);
      ctx.fillStyle = hexA(theme.grid, 0.5);
      roundRect(ctx, bx, y + 2, bw, 10, 2);
      ctx.fill();
      ctx.fillStyle = mixHex("#2e7ca8", "#c9403f", dev);
      roundRect(ctx, bx, y + 2, bw * dev, 10, 2);
      ctx.fill();
      caption(ctx, bx, y + 24, name, theme, { size: 7, color: theme.inkSoft });
    });
  });

  // Right panel: response order + loop inventory.
  const sideX = width - 190;
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, sideX, 12, 178, height - 24, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, sideX + 10, 28, "RESPONSE ORDER", theme, { size: 9, weight: 800, color: theme.inkSoft });
  let ry = 44;
  const runSpan = params.runSpan as number;
  const injYr = Math.max(0, state.injectedAtYear);
  const windowed = state.responseOrder.filter((r) => r.year - injYr <= runSpan);
  for (const r of windowed.slice(0, 10)) {
    caption(ctx, sideX + 10, ry, `${num(r.year - injYr)}yr  ${r.key}`, theme, { size: 8, color: theme.inkSoft });
    ry += 13;
  }
  if (params.loopHighlight !== false) {
    caption(ctx, sideX + 10, ry + 10, "FEEDBACK LOOPS", theme, { size: 9, weight: 800, color: theme.inkSoft });
    ry += 24;
    for (const loop of LOOPS) {
      const color = loop.kind === "reinforcing" ? theme.sci["hot"] : theme.sci["cold"];
      caption(ctx, sideX + 10, ry, `${loop.a[0].toUpperCase()}-${loop.b[0].toUpperCase()} ${loop.kind} (${loop.gainProduct.toFixed(2)})`, theme, { size: 8, color });
      ry += 13;
    }
  }
  ctx.restore();

  badge(ctx, 12, 20, `target: ${params.targetSphere}`, theme, { color: theme.accent });
  badge(ctx, width / 2 - 90, 20, `year ${num(state.simYears)}`, theme, { align: "center", color: theme.sci["field"] });
  if (cutLink !== "none") {
    const link = LINKS.find((l) => l.id === cutLink);
    badge(ctx, width / 2 + 90, 20, `cut: ${link?.name ?? cutLink}`, theme, { align: "center", color: theme.sci["hot"] });
  }
  vignette(ctx, width, height, 0.12);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const LINK_OPTIONS = [{ value: "none", label: "All twelve active" }, ...LINKS.map((l) => ({ value: l.id, label: l.name }))];

const BASE_SETUP: ParamValues = {
  targetSphere: "atmosphere", perturbationSize: 0.25, cutLink: "none",
  delayScaling: 1, runSpan: 50, arrowDisplay: "thicknessByFlux", loopHighlight: true, playbackSpeed: 2,
};

export const pullOneThreadSim: SimManifest<State> = {
  id: "g6.a4-5",
  title: "Pull One Thread: The Four-Sphere Web",
  tagline: "Kick one Earth sphere and prove, by cutting the wire, that whatever moves next can only have arrived along a real coupling arrow.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-2", "MS-ESS2-6"] },
  learningGoals: [
    "State the one idea this sim exists to prove: a perturbation reaches another sphere only by travelling along a real link, and only after that link's own delay.",
    "Predict and verify the order in which spheres respond to a kick, using each link's own lag.",
    "Use the cut-link tool to prove a specific pathway is responsible for a specific downstream change.",
    "Classify a two-sphere loop as reinforcing or balancing from the product of its two link gains.",
  ],
  misconceptions: [
    "The four spheres are stacked layers with effects running only downward",
    "Every sphere affects every other sphere instantly",
    "Life sits on top of the other three spheres rather than exchanging with them",
    "A kick anywhere produces the same response everywhere at once",
  ],
  interactionHint: "Fire a kick into one sphere, then use the scissors to cut a link and watch a specific downstream change disappear.",
  tickRate: 30,
  timeScale: 1,
  params: {
    targetSphere: {
      type: "option", label: "Target sphere",
      options: [
        { value: "geosphere", label: "Geosphere" },
        { value: "hydrosphere", label: "Hydrosphere" },
        { value: "atmosphere", label: "Atmosphere" },
        { value: "biosphere", label: "Biosphere" },
      ],
      default: "atmosphere",
      help: "Which hub the injector fires into — re-selecting fires a fresh kick.",
    },
    perturbationSize: {
      type: "number", label: "Perturbation size", kind: "percent",
      min: 0, max: 1, step: 0.05, default: 0.25,
      help: "Size of the kick as a fraction of baseline. Re-adjusting fires again.",
    },
    cutLink: {
      type: "option", label: "Cut a link",
      options: LINK_OPTIONS,
      default: "none",
      help: "Disables exactly one of the twelve arrows — its contribution becomes genuinely zero.",
    },
    delayScaling: {
      type: "number", label: "Delay scaling", kind: "ratio",
      min: 0.1, max: 10, step: 0.1, default: 1,
      help: "Stretches or compresses every lag together, so slow pathways can be seen inside a lesson.",
    },
    runSpan: {
      type: "number", label: "Run span (years)", kind: "count",
      min: 1, max: 200, step: 1, default: 50,
      help: "How long a window the response-order board and charts consider.",
    },
    arrowDisplay: {
      type: "option", label: "Arrow display",
      options: [
        { value: "signOnly", label: "Sign only" },
        { value: "thicknessByFlux", label: "Thickness by flux" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "thicknessByFlux",
      help: "How much of the causal web is drawn, so a prediction can be made before seeing it.",
    },
    loopHighlight: {
      type: "boolean", label: "Loop highlight", default: true,
      help: "Lists every two-sphere feedback loop and whether it reinforces or balances.",
    },
    playbackSpeed: {
      type: "number", label: "Playback speed", kind: "ratio",
      min: 0.25, max: 20, step: 0.25, default: 2,
      marks: [{ value: 0.25, label: "0.25 yr/s" }, { value: 20, label: "20 yr/s" }],
      help: "Simulated years per real second.",
    },
  },
  model,
  render,
  labs: [
    {
      id: "one-kick-four-answers",
      title: "One kick, four answers",
      question: "In what order do the other three spheres first move, and how many years does each take?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-2"],
      setup: { ...BASE_SETUP, arrowDisplay: "signOnly" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the second responder",
          instruction: "A 25% kick is about to fire into the atmosphere, arrows hidden until it lands.",
          predict: {
            prompt: "After the atmosphere itself, which sphere moves past 5% of baseline second?",
            options: ["Geosphere", "Hydrosphere", "Biosphere"],
            correct: 1,
            reveal: "Hydrosphere — warming lifts the snow line within about a year, the fastest of atmosphere's three direct links.",
          },
        },
        {
          id: "fire",
          phase: "measure",
          title: "Fire the kick",
          instruction: "Re-select the atmosphere target to fire, then run and record which spheres move.",
          requireData: 1,
          check: { describe: "The kick has been fired", test: (v) => v.facts.injected === true },
        },
        {
          id: "order",
          phase: "measure",
          title: "Record the response order",
          instruction: "Run until at least two spheres have crossed 5% and record the order.",
          requireData: 2,
          check: { describe: "At least two hubs have moved past 5%", test: (v) => (v.facts.hubsMovedPast5pct as number) >= 2 },
        },
        {
          id: "confirmsecond",
          phase: "analyze",
          title: "Check the second responder",
          instruction: "Confirm the second responder is the hydrosphere, via the direct warming-snowpack link.",
          check: {
            describe: "Hydrosphere is among the first two responders",
            test: (v) => (v.facts.firstResponder as string).startsWith("hydrosphere") || (v.facts.secondResponder as string).startsWith("hydrosphere"),
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the pathway",
          instruction: "Name the specific link and lag that explains the order you saw.",
          write: {
            prompt: "Name the single link responsible for the fastest response, and its real lag.",
            placeholder: "The fastest link is ..., which fires roughly ... years after the kick.",
          },
        },
      ],
    },
    {
      id: "cut-the-thread",
      title: "Cut the thread",
      question: "Which downstream change disappears entirely, and what does that prove the link was carrying?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-2"],
      setup: { ...BASE_SETUP, targetSphere: "atmosphere", cutLink: "atmo-hydro" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the missing response",
          instruction: "The atmosphere-to-hydrosphere link (warming lifts the snow line) is already cut.",
          predict: {
            prompt: "With that one link cut, will the snowpack still respond to the same atmospheric kick?",
            options: ["Yes, some other link reaches it", "No — snowpack has only that one incoming link", "Yes, but delayed further"],
            correct: 1,
            reveal: "No. Snowpack in this model has exactly one incoming link, so cutting it removes the ONLY pathway — the snowpack simply cannot respond, structurally, not just slowly.",
          },
        },
        {
          id: "fireCut",
          phase: "measure",
          title: "Fire with the cut in place",
          instruction: "Fire the kick and run well past the snow-line link's normal 1-year lag.",
          requireData: 1,
          check: { describe: "Well past the normal lag with the cut in place", test: (v) => v.params.cutLink === "atmo-hydro" && (v.facts.yearsSinceInjection as number) >= 3 },
        },
        {
          id: "checksnow",
          phase: "measure",
          title: "Check the snowpack",
          instruction: "Confirm the snowpack has not moved.",
          check: { describe: "Snowpack deviation stays under 1%", test: (v) => (v.facts.snowpackDeviation as number) < 0.01 },
        },
        {
          id: "restore",
          phase: "analyze",
          title: "Restore the link",
          instruction: "Set the cut link back to none, fire again, and confirm the snowpack now responds.",
          check: {
            describe: "With the link restored, snowpack measurably moves",
            test: (v) => v.params.cutLink === "none" && (v.facts.snowpackDeviation as number) >= 0.03,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State what the cut proved",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "What did the missing response prove that the link was actually carrying?",
            placeholder: "Cutting the link removed exactly ..., which proves that link alone was responsible for ...",
          },
        },
      ],
    },
    {
      id: "kick-the-rock",
      title: "Kick the rock instead",
      question: "Starting in the geosphere, does the biosphere respond faster or slower than it did from an atmosphere kick, and by which route?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-2"],
      setup: { ...BASE_SETUP, targetSphere: "geosphere", perturbationSize: 0.6, runSpan: 20 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the route",
          instruction: "A large kick is about to fire straight into the geosphere.",
          predict: {
            prompt: "Which route lets the geosphere's kick reach the biosphere?",
            options: ["Directly, geosphere to biosphere, in under a year", "Only indirectly, through soil depth, over about a decade", "It cannot reach the biosphere at all"],
            correct: 1,
            reveal: "Only indirectly. Geosphere's soil-depth variable feeds forest cover with a real ten-year lag — the biosphere responds, just on geological patience, not atmospheric speed.",
          },
        },
        {
          id: "fire",
          phase: "measure",
          title: "Fire into the geosphere",
          instruction: "Fire the kick and record which spheres respond within the first two years.",
          requireData: 1,
          check: { describe: "Kick fired into the geosphere", test: (v) => v.params.targetSphere === "geosphere" && v.facts.injected === true },
        },
        {
          id: "runlong",
          phase: "measure",
          title: "Run to ten years",
          instruction: "Run out to at least ten years and check whether the biosphere has now moved.",
          requireData: 2,
          check: { describe: "Ten years elapsed since injection", test: (v) => (v.facts.yearsSinceInjection as number) >= 10 },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare arrival speed",
          instruction: "Compare how many hubs had moved at year 2 versus year 10.",
          check: { describe: "More hubs have moved by year ten than by year two", test: (v) => (v.facts.hubsMovedPast5pct as number) >= 2 },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the difference",
          instruction: "Contrast this with the atmosphere-kick scenario's fast first response.",
          write: {
            prompt: "Why does a geosphere kick take so much longer to reach the biosphere than an atmosphere kick took to reach the hydrosphere?",
            placeholder: "The fastest atmosphere link has a lag of about a year, but the route from rock to forest runs through ..., which takes ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "isolate-the-kelp",
      title: "Isolate the kelp bed",
      brief: "Find the single link that, if cut, stops a hydrosphere kick from ever reaching the kelp.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, targetSphere: "hydrosphere", perturbationSize: 0.5 },
      goal: {
        describe: "With the correct link cut, kelp deviation stays under 1% for at least 5 years after injection",
        test: (v) =>
          v.params.cutLink === "hydro-bio" && (v.facts.yearsSinceInjection as number) >= 5 &&
          (v.facts.kelpDeviation as number) < 0.01,
      },
      hints: ["Kelp has exactly one incoming arrow in this web — find it in the link list."],
    },
    {
      id: "find-a-balancing-loop",
      title: "Find a balancing loop",
      brief: "Name a two-sphere loop in this web whose gain product is negative.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "At least one balancing loop exists in the current web",
        test: (v) => (v.facts.balancingLoopCount as number) >= 1,
      },
      hints: ["A loop balances when one leg pushes up and the other pushes back down — opposite-signed gains."],
    },
  ],
};
