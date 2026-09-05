import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { quakeWaves, strataColumn } from "@ui/geo";
import { benchStage } from "@ui/labware";
import {
  badge, caption, clamp01, glow, hexA, isDarkTheme, pulse, sphere, vignette,
} from "@ui/scene";

/**
 * Peel the Planet: Reading the Rock Shells — Grade 6, Unit A4.1: the geosphere.
 *
 * Nobody has drilled past 12 km, so everything below that is read off waves,
 * never off a photograph. This sim traces real seismic rays: a 2-D radial
 * velocity model (crust through inner core) refracts every P and S ray by
 * Snell's law at each shell boundary, exactly the way a light ray bends
 * through a stack of glass with different indices. Fire a quake and the rays
 * bend on their own; the P shadow band (no direct P) and the S shadow (no S
 * at all beyond the core) are not painted on — they are the angles the ray
 * sweep genuinely fails to reach, discovered the same way seismologists
 * discovered the liquid outer core in 1906.
 *
 * The honesty rule: switching the core-state hypothesis rebuilds the velocity
 * model and re-traces every ray. A solid-core Earth really does deliver S
 * waves everywhere; a coreless uniform-rock Earth really does erase the
 * shadow and slow every arrival down. The "hypothesis check" badge compares
 * the CURRENT hypothesis's station pattern against what the real (liquid-core)
 * model predicts for the same stations — it is a measurement, not a lookup of
 * which option is selected.
 */

/* ------------------------------------------------------------------ *
 * World constants — the real, referenced numbers this model is built from
 * ------------------------------------------------------------------ */

const R_KM = 6371;               // spec: Earth radius
const MOHO_KM = 35;
const LITHO_KM = 100;
const TRANS_LO_KM = 410;
const TRANS_HI_KM = 660;
const CMB_KM = 2891;             // core-mantle boundary
const ICB_KM = 5150;             // inner core boundary

/**
 * P and S velocity breakpoints, km/s, simplified from real reference models
 * (PREM/IASP91-like). Two consecutive rows at the same depth encode a genuine
 * discontinuity (Moho, 410, 660, CMB, ICB) — a sharp jump, not a typo. The
 * liquid-core column is NaN through the outer core: shear waves cannot cross
 * it, full stop. The solid-hypothesis column keeps a normal Vp/Vs ratio there
 * instead, which is exactly the "what if it were solid rock" counterfactual.
 */
const VELOCITY_BREAKS: readonly [number, number, number, number][] = [
  [0, 5.8, 3.36, 3.36],
  [20, 6.5, 3.75, 3.75],
  [35, 8.04, 4.47, 4.47],
  [120, 8.05, 4.48, 4.48],
  [210, 8.30, 4.52, 4.52],
  [410, 9.03, 5.08, 5.08],
  [660, 10.20, 5.95, 5.95],
  [760, 10.79, 5.96, 5.96],
  [1000, 11.15, 6.20, 6.20],
  [1500, 12.00, 6.55, 6.55],
  [2000, 12.70, 6.90, 6.90],
  [2500, 13.20, 7.10, 7.10],
  [2700, 13.45, 7.20, 7.20],
  [CMB_KM, 13.71, 7.26, 7.26],
  [CMB_KM, 8.00, NaN, 7.30],
  [3200, 8.05, NaN, 7.7],
  [3800, 8.60, NaN, 8.5],
  [4500, 9.60, NaN, 9.3],
  [ICB_KM, 10.30, NaN, 9.8],
  [ICB_KM, 11.03, 3.55, 9.8],
  [R_KM, 11.26, 3.67, 10.2],
];

/** Density, kg/m^3, simplified PREM-like breakpoints — used for g(r) and p(r). */
const DENSITY_BREAKS: readonly [number, number][] = [
  [0, 2700], [MOHO_KM, 2900], [MOHO_KM, 3320], [210, 3450],
  [TRANS_LO_KM, 3990], [TRANS_HI_KM, 4380], [1000, 4600], [2000, 5100],
  [CMB_KM, 5570], [CMB_KM, 9900], [3500, 10700], [4500, 11700],
  [ICB_KM, 12140], [ICB_KM, 12760], [R_KM, 13090],
];

/** Approximate geotherm, degrees C. Real core temperature carries genuine
 *  scientific uncertainty of hundreds of degrees; this curve is anchored at
 *  the spec's own figure (about 5,200 C in the inner core). */
const TEMP_BREAKS: readonly [number, number][] = [
  [0, 15], [MOHO_KM, 550], [100, 1100], [210, 1400], [TRANS_LO_KM, 1500],
  [TRANS_HI_KM, 1900], [1000, 2200], [2000, 2600], [CMB_KM, 3700],
  [CMB_KM, 4000], [3500, 4400], [4500, 5000], [ICB_KM, 5400], [R_KM, 5200],
];

const G_CONST = 6.6743e-11; // gravitational constant, SI

const SHELLS_PER_TRACE = 240;   // ray-tracer radial resolution
const SWEEP_RAYS = 2200;        // takeoff angles swept per wave for the science —
                                 // fine enough that a real shadow (tens of degrees
                                 // wide) is never confused with the few-degree gaps
                                 // that finite angular sampling leaves near the
                                 // epicentre and the antipode even when every ray
                                 // genuinely returns to the surface.
const DRAW_RAYS = 30;           // rays actually stored with a full path to render
const ARRIVAL_TOL_DEG = 1.0;    // how close a station must sit to a swept ray
const MIN_SHADOW_WIDTH_DEG = 8; // narrower gaps are sampling noise, not a real shadow
const MAX_STATIONS = 24;

/** Depth a real drill has ever reached (Kola Superdeep), for the honesty line. */
const DEEPEST_DRILL_KM = 12.262;

type CoreHypothesis = "liquid" | "solid" | "uniform";
type WaveSelect = "P" | "S" | "both" | "surface";

/** Linear interpolation through a breakpoint table; NaN rows pass through. */
function lerpTable(table: readonly (readonly [number, number])[], depthKm: number): number {
  const n = table.length;
  if (depthKm <= table[0][0]) return table[0][1];
  for (let i = 0; i < n - 1; i++) {
    const [d0, v0] = table[i], [d1, v1] = table[i + 1];
    if (depthKm >= d0 && depthKm <= d1) {
      const t = d1 === d0 ? 0 : (depthKm - d0) / (d1 - d0);
      return v0 + (v1 - v0) * t;
    }
  }
  return table[n - 1][1];
}

/** Seismic velocity, km/s, at a depth under a given hypothesis. NaN = no shear. */
function velocityAt(depthKm: number, hyp: CoreHypothesis, wave: "P" | "S"): number {
  if (hyp === "uniform") return wave === "P" ? 6.0 : 6.0 / 1.73;
  const n = VELOCITY_BREAKS.length;
  if (depthKm <= VELOCITY_BREAKS[0][0]) return wave === "P" ? VELOCITY_BREAKS[0][1] : VELOCITY_BREAKS[0][2];
  for (let i = 0; i < n - 1; i++) {
    const [d0, vp0, vsL0, vsS0] = VELOCITY_BREAKS[i];
    const [d1, vp1, vsL1, vsS1] = VELOCITY_BREAKS[i + 1];
    if (depthKm >= d0 && depthKm <= d1) {
      const t = d1 === d0 ? 0 : (depthKm - d0) / (d1 - d0);
      if (wave === "P") return vp0 + (vp1 - vp0) * t;
      const a = hyp === "solid" ? vsS0 : vsL0;
      const b = hyp === "solid" ? vsS1 : vsL1;
      if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
      return a + (b - a) * t;
    }
  }
  const last = VELOCITY_BREAKS[n - 1];
  return wave === "P" ? last[1] : hyp === "solid" ? last[3] : last[2];
}

function densityAt(depthKm: number): number { return lerpTable(DENSITY_BREAKS, depthKm); }
function temperatureAt(depthKm: number): number { return lerpTable(TEMP_BREAKS, depthKm); }

/* ------------------------------------------------------------------ *
 * Depth profile: real hydrostatic integration, density -> mass -> g -> pressure
 * ------------------------------------------------------------------ */

export interface DepthProfile {
  depthKm: number[];
  densityKgM3: number[];
  gravityMs2: number[];
  pressurePa: number[];
  tempC: number[];
}

/**
 * Integrates the enclosed mass M(r) = int 4*pi*r^2*rho dr, then g(r) = G*M/r^2,
 * then p(depth) = int rho*g dz from the surface inward. Every one of these is
 * a real physical law computed from the density table above, not a fitted
 * curve: this is exactly how the ~136 GPa at the core-mantle boundary and the
 * ~364 GPa at the centre — both textbook numbers — are known at all.
 */
function buildDepthProfile(steps = 400): DepthProfile {
  const depthKm: number[] = [];
  const densityKgM3: number[] = [];
  const tempC: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * R_KM;
    depthKm.push(d);
    densityKgM3.push(densityAt(d));
    tempC.push(temperatureAt(d));
  }
  // Enclosed mass from the centre outward (index 0 = surface in the arrays
  // above, so walk backward from the core).
  const n = steps + 1;
  const rM: number[] = depthKm.map((d) => (R_KM - d) * 1000);
  const massAtR = new Array<number>(n).fill(0);
  for (let i = n - 2; i >= 0; i--) {
    // Shell between rM[i+1] (inner) and rM[i] (outer), density at midpoint.
    const rIn = rM[i + 1], rOut = rM[i];
    const rhoMid = (densityKgM3[i] + densityKgM3[i + 1]) / 2;
    const shellVol = (4 / 3) * Math.PI * (rOut ** 3 - rIn ** 3);
    massAtR[i] = massAtR[i + 1] + rhoMid * shellVol;
  }
  const gravityMs2 = rM.map((r, i) => (r > 1 ? (G_CONST * massAtR[i]) / (r * r) : 0));
  // Hydrostatic pressure: integrate rho*g from the surface (p=0) down to depth.
  const pressurePa = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dz = (depthKm[i] - depthKm[i - 1]) * 1000;
    const rhoMid = (densityKgM3[i] + densityKgM3[i - 1]) / 2;
    const gMid = (gravityMs2[i] + gravityMs2[i - 1]) / 2;
    pressurePa[i] = pressurePa[i - 1] + rhoMid * gMid * dz;
  }
  return { depthKm, densityKgM3, gravityMs2, pressurePa, tempC };
}

function sampleProfile(profile: DepthProfile, depthKm: number): {
  densityKgM3: number; gravityMs2: number; pressurePa: number; tempC: number;
} {
  const d = Math.max(0, Math.min(R_KM, depthKm));
  const n = profile.depthKm.length;
  const idx = Math.min(n - 2, Math.max(0, Math.floor((d / R_KM) * (n - 1))));
  const d0 = profile.depthKm[idx], d1 = profile.depthKm[idx + 1];
  const t = d1 === d0 ? 0 : (d - d0) / (d1 - d0);
  const at = (arr: number[]) => arr[idx] + (arr[idx + 1] - arr[idx]) * t;
  return {
    densityKgM3: at(profile.densityKgM3), gravityMs2: at(profile.gravityMs2),
    pressurePa: at(profile.pressurePa), tempC: at(profile.tempC),
  };
}

/* ------------------------------------------------------------------ *
 * The ray tracer — Snell's law through concentric shells, exactly as light
 * refracts through a stack of glass with different indices (index ~ 1/velocity)
 * ------------------------------------------------------------------ */

interface Shells { radii: number[]; vel: number[]; n: number }

function buildShells(hyp: CoreHypothesis, wave: "P" | "S", n = SHELLS_PER_TRACE): Shells {
  const radii: number[] = [];
  for (let i = 0; i <= n; i++) radii.push((i / n) * R_KM);
  const vel: number[] = [];
  for (let i = 0; i < n; i++) {
    const rMid = (radii[i] + radii[i + 1]) / 2;
    vel.push(velocityAt(R_KM - rMid, hyp, wave));
  }
  return { radii, vel, n };
}

/** Smallest positive root of |pos + t*dir| = boundary, or null if none. */
function circleHitT(rr: number, dot: number, boundary: number): number | null {
  const c = rr - boundary * boundary;
  const b = 2 * dot;
  let disc = b * b - 4 * c;
  if (disc < -1e-4) return null;
  if (disc < 0) disc = 0;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / 2, t2 = (-b + sq) / 2;
  let best: number | null = null;
  if (t1 > 1e-7) best = t1;
  if (t2 > 1e-7 && (best === null || t2 < best)) best = t2;
  return best;
}

export interface RayResult {
  arrived: boolean;
  absorbed: boolean;
  distDeg: number;
  timeS: number;
  path: [number, number][];
}

/**
 * Only down-going takeoff angles (0-90 deg from vertical) are traced. Real
 * hypocentres also radiate up-going rays that reach the closest stations
 * directly; skipping them leaves a small, honestly-narrow gap in coverage
 * within a few degrees of a deep focus, which is why `findShadow` ignores
 * anything narrower than MIN_SHADOW_WIDTH_DEG — that gap is a modelling
 * simplification, not the physical shadow the lesson is about.
 *
 * Trace one ray from the surface at `takeoffDeg` from local vertical. The
 * shell index is tracked explicitly across steps rather than re-derived from
 * position — a boundary-crossing coordinate cannot reliably say which of the
 * two adjoining shells it belongs to, so re-deriving it is the single most
 * common bug in this kind of tracer.
 */
function traceRay(shells: Shells, takeoffDeg: number, focusDepthKm: number, keepPath: boolean): RayResult {
  const { radii, vel, n } = shells;
  let pos: [number, number] = [0, R_KM - focusDepthKm];
  let shellK = n - 1;
  for (let i = 0; i < n; i++) if (radii[i] <= pos[1] + 1e-9 && pos[1] <= radii[i + 1] + 1e-9) shellK = i;
  const theta = (takeoffDeg * Math.PI) / 180;
  let dir: [number, number] = [Math.sin(theta), -Math.cos(theta)];
  let t = 0;
  const path: [number, number][] = keepPath ? [[pos[0], pos[1]]] : [];
  const maxSteps = 3 * n + 20;
  for (let steps = 0; steps < maxSteps; steps++) {
    const v = vel[shellK];
    if (Number.isNaN(v)) return { arrived: false, absorbed: true, distDeg: 0, timeS: 0, path };
    const rr = pos[0] * pos[0] + pos[1] * pos[1];
    const dot = pos[0] * dir[0] + pos[1] * dir[1];
    const tIn = shellK > 0 ? circleHitT(rr, dot, radii[shellK]) : null;
    const tOut = circleHitT(rr, dot, radii[shellK + 1]);
    let tStep: number, goingOutward: boolean;
    if (tIn !== null && (tOut === null || tIn <= tOut)) { tStep = tIn; goingOutward = false; }
    else if (tOut !== null) { tStep = tOut; goingOutward = true; }
    else return { arrived: false, absorbed: false, distDeg: 0, timeS: 0, path };

    pos = [pos[0] + dir[0] * tStep, pos[1] + dir[1] * tStep];
    t += tStep / v;
    if (keepPath) path.push([pos[0], pos[1]]);

    if (goingOutward && shellK === n - 1) {
      const distDeg = Math.abs((Math.atan2(pos[0], pos[1]) * 180) / Math.PI);
      return { arrived: true, absorbed: false, distDeg, timeS: t, path };
    }
    const nextShellK = goingOutward ? shellK + 1 : shellK - 1;
    if (nextShellK < 0) return { arrived: false, absorbed: false, distDeg: 0, timeS: 0, path };
    const v2 = vel[nextShellK];
    if (Number.isNaN(v2)) return { arrived: false, absorbed: true, distDeg: 0, timeS: 0, path };

    const newR = Math.hypot(pos[0], pos[1]);
    const radial: [number, number] = [pos[0] / newR, pos[1] / newR];
    const N: [number, number] = goingOutward ? [-radial[0], -radial[1]] : radial;
    const eta = v2 / v;
    let cosI = -(dir[0] * N[0] + dir[1] * N[1]);
    cosI = Math.max(0, Math.min(1, cosI));
    const sin2T = eta * eta * (1 - cosI * cosI);
    if (sin2T > 1) {
      // Total internal reflection: this is a ray's smooth turning point,
      // discretised — it cannot enter the faster shell, so it bends back.
      const dotDN = dir[0] * N[0] + dir[1] * N[1];
      dir = [dir[0] - 2 * dotDN * N[0], dir[1] - 2 * dotDN * N[1]];
    } else {
      const cosT = Math.sqrt(1 - sin2T);
      const nd: [number, number] = [
        eta * dir[0] + (eta * cosI - cosT) * N[0],
        eta * dir[1] + (eta * cosI - cosT) * N[1],
      ];
      const m = Math.hypot(nd[0], nd[1]) || 1;
      dir = [nd[0] / m, nd[1] / m];
      shellK = nextShellK;
    }
  }
  return { arrived: false, absorbed: false, distDeg: 0, timeS: 0, path };
}

export interface SweepHit { distDeg: number; timeS: number }

/** Sweep takeoff angles 0..90 and keep every ray that makes it back to the surface. */
function sweepRays(hyp: CoreHypothesis, wave: "P" | "S", focusDepthKm: number, count = SWEEP_RAYS): SweepHit[] {
  const shells = buildShells(hyp, wave);
  const out: SweepHit[] = [];
  for (let i = 1; i < count; i++) {
    const deg = (i / count) * 89.9;
    const r = traceRay(shells, deg, focusDepthKm, false);
    if (r.arrived) out.push({ distDeg: r.distDeg, timeS: r.timeS });
  }
  return out;
}

/** First arrival at an angular distance, or null if the sweep never lands there. */
function firstArrivalAt(sweep: readonly SweepHit[], distDeg: number, tol = ARRIVAL_TOL_DEG): number | null {
  let best: number | null = null;
  for (const hit of sweep) {
    if (Math.abs(hit.distDeg - distDeg) <= tol) {
      if (best === null || hit.timeS < best) best = hit.timeS;
    }
  }
  return best;
}

/**
 * Widest gap in sweep coverage, in whole degrees, from a fine occupancy scan.
 *
 * Bins 0 and 1 sit right on the epicentre itself — a degenerate point where a
 * finite sweep of takeoff angles can never quite graze close enough to leave
 * a ray there, real shadow or not — so they are excluded from consideration.
 * The far end (near 180, the antipode) is not excluded: a genuine S shadow
 * really does run all the way to the antipode, and that is a fact worth
 * keeping. A genuine shadow (the kind a liquid core produces) is tens of
 * degrees wide; anything narrower than MIN_SHADOW_WIDTH_DEG is exactly the
 * few-degree gap that finite angular sampling leaves even where every ray
 * truly does return to the surface, so it is not reported as a shadow.
 */
function findShadow(sweep: readonly SweepHit[]): { startDeg: number; endDeg: number } | null {
  const bins = new Array<boolean>(181).fill(false);
  for (const hit of sweep) {
    const b = Math.round(hit.distDeg);
    if (b >= 0 && b <= 180) bins[b] = true;
  }
  let bestStart = -1, bestLen = 0, curStart = -1;
  for (let i = 2; i <= 180; i++) {
    if (!bins[i]) { if (curStart < 0) curStart = i; }
    else if (curStart >= 0) {
      if (i - curStart > bestLen) { bestLen = i - curStart; bestStart = curStart; }
      curStart = -1;
    }
  }
  if (curStart >= 0 && 181 - curStart > bestLen) { bestLen = 181 - curStart; bestStart = curStart; }
  if (bestLen < MIN_SHADOW_WIDTH_DEG) return null;
  return { startDeg: bestStart, endDeg: bestStart + bestLen - 1 };
}

/** Real-shaped attenuation: geometric spreading times anelastic loss, scaled
 *  by the quake's size. Bigger quakes read further — a genuine, if simplified,
 *  reason a distant station can miss an arrival that a nearer one catches. */
function amplitudeAt(distDeg: number, magnitude: number): number {
  const geom = 1 / (2 + distDeg);
  const anelastic = Math.exp(-distDeg / 140);
  return 10 ** (magnitude - 6) * geom * anelastic;
}
const DETECT_FLOOR = 0.01;

/* ------------------------------------------------------------------ *
 * California drill sites — real, simplified rock sequences
 * ------------------------------------------------------------------ */

interface DrillUnit { name: string; color: string; topM: number; baseM: number }
interface DrillSite { label: string; units: DrillUnit[] }

const DRILL_SITES: Record<string, DrillSite> = {
  centralValley: {
    label: "Central Valley",
    units: [
      { name: "alluvium", color: "#c9a96b", topM: 0, baseM: 600 },
      { name: "marine sediment", color: "#8d8f76", topM: 600, baseM: 2000 },
      { name: "granodiorite basement", color: "#a8a2ad", topM: 2000, baseM: 3000 },
    ],
  },
  sierraCrest: {
    label: "Sierra crest",
    units: [
      { name: "thin regolith", color: "#c9a96b", topM: 0, baseM: 5 },
      { name: "granodiorite (Sierra batholith)", color: "#a8a2ad", topM: 5, baseM: 3000 },
    ],
  },
  coastRanges: {
    label: "Coast Ranges",
    units: [
      { name: "thin soil", color: "#8b6f4e", topM: 0, baseM: 10 },
      { name: "Franciscan melange", color: "#5f6b57", topM: 10, baseM: 3000 },
    ],
  },
  mojave: {
    label: "Mojave",
    units: [
      { name: "desert alluvium", color: "#d8c08a", topM: 0, baseM: 50 },
      { name: "Mojave basement", color: "#9a8f7a", topM: 50, baseM: 3000 },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Station {
  angleDeg: number;   // position around the rim, 0 = top, clockwise
  distDeg: number;    // angular distance from the epicentre
  pTime: number | null; sTime: number | null; surfTime: number | null;
  pAmp: number; sAmp: number;
}

interface State {
  clockS: number;        // seconds since the current quake fired
  cycleS: number;        // duration of one fire-to-refire cycle
  quakeCount: number;
  epicenterAngleDeg: number;
  stations: Station[];
  sweepP: SweepHit[];
  sweepS: SweepHit[];
  shadowP: { startDeg: number; endDeg: number } | null;
  shadowS: { startDeg: number; endDeg: number } | null;
  refShadowS: { startDeg: number; endDeg: number } | null; // under the true liquid hypothesis
  /** Per-station "does the real, liquid-core Earth deliver S here", cached
   *  once so the hypothesis-check badge never re-runs a 2000-ray sweep per
   *  station per frame. */
  refSPattern: boolean[];
  drawRays: { wave: "P" | "S"; path: [number, number][] }[];
  profile: DepthProfile;
}

function stationAngles(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push((360 * i) / count);
  return out;
}

function angularDistance(a: number, epicenter: number): number {
  let d = Math.abs(a - epicenter) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function focusDepthKmOf(params: ParamValues): number {
  return (params.focusDepth as number) / 1000;
}

function coreStateOf(params: ParamValues): CoreHypothesis {
  return params.coreState as CoreHypothesis;
}

function waveSelectOf(params: ParamValues): WaveSelect {
  return params.waveType as WaveSelect;
}

/** Rebuilds every derived quantity: the ray sweeps, the shadows, the station
 *  arrivals and a handful of rays kept whole for the render. This is the
 *  expensive step, so it runs only on init and on a relevant param change —
 *  never once per tick. */
function rebuildEvent(params: ParamValues, epicenterAngleDeg: number): {
  sweepP: SweepHit[]; sweepS: SweepHit[];
  shadowP: State["shadowP"]; shadowS: State["shadowS"]; refShadowS: State["refShadowS"];
  refSPattern: boolean[];
  stations: Station[]; drawRays: State["drawRays"];
} {
  const hyp = coreStateOf(params);
  const focusKm = focusDepthKmOf(params);
  const wave = waveSelectOf(params);
  const wantP = wave === "P" || wave === "both";
  const wantS = wave === "S" || wave === "both";

  const sweepP = wantP ? sweepRays(hyp, "P", focusKm) : [];
  const sweepS = wantS ? sweepRays(hyp, "S", focusKm) : [];
  const shadowP = wantP ? findShadow(sweepP) : null;
  const shadowS = wantS ? findShadow(sweepS) : null;
  // The reference pattern always uses the real, liquid-core Earth, regardless
  // of what the student has dialled in — that is what the hypothesis check
  // measures itself against. Computed once here and cached per station, never
  // re-swept per station per call.
  const refSweepS = hyp === "liquid" && wantS ? sweepS : sweepRays("liquid", "S", focusKm);
  const refShadowS = findShadow(refSweepS);

  const magnitude = params.magnitude as number;
  const count = Math.round(params.stationCount as number);
  const angles = stationAngles(count);
  const refSPattern = angles.map((angleDeg) => {
    const distDeg = angularDistance(angleDeg, epicenterAngleDeg);
    return firstArrivalAt(refSweepS, distDeg) !== null;
  });
  const stations: Station[] = angles.map((angleDeg) => {
    const distDeg = angularDistance(angleDeg, epicenterAngleDeg);
    const pTime = wantP ? firstArrivalAt(sweepP, distDeg) : null;
    const sTime = wantS ? firstArrivalAt(sweepS, distDeg) : null;
    const surfTime = wave === "surface" ? (distDeg * Math.PI * R_KM) / 180 / 3.5 : null;
    return {
      angleDeg, distDeg, pTime, sTime, surfTime,
      pAmp: amplitudeAt(distDeg, magnitude), sAmp: amplitudeAt(distDeg, magnitude) * 1.6,
    };
  });

  const drawRays: State["drawRays"] = [];
  if (wantP) {
    const shellsP = buildShells(hyp, "P");
    for (let i = 1; i < DRAW_RAYS; i++) {
      const deg = (i / DRAW_RAYS) * 89.5;
      const r = traceRay(shellsP, deg, focusKm, true);
      if (r.arrived) drawRays.push({ wave: "P", path: r.path });
    }
  }
  if (wantS) {
    const shellsS = buildShells(hyp, "S");
    for (let i = 1; i < DRAW_RAYS; i++) {
      const deg = (i / DRAW_RAYS) * 89.5;
      const r = traceRay(shellsS, deg, focusKm, true);
      if (r.arrived) drawRays.push({ wave: "S", path: r.path });
    }
  }

  return { sweepP, sweepS, shadowP, shadowS, refShadowS, refSPattern, stations, drawRays };
}

function cycleDurationOf(state: Pick<State, "sweepP" | "sweepS">, params: ParamValues): number {
  let maxT = 60;
  for (const h of state.sweepP) if (h.timeS > maxT) maxT = h.timeS;
  for (const h of state.sweepS) if (h.timeS > maxT) maxT = h.timeS;
  if (waveSelectOf(params) === "surface") maxT = Math.max(maxT, (Math.PI * R_KM) / 3.5);
  return maxT + 60; // a one-minute pause between quakes
}

function buildWorld(params: ParamValues): State {
  const profile = buildDepthProfile();
  const epicenterAngleDeg = 12; // "Parkfield" — a fixed, named starting site
  const ev = rebuildEvent(params, epicenterAngleDeg);
  const s: State = {
    clockS: 0, cycleS: 60, quakeCount: 0, epicenterAngleDeg,
    profile, ...ev,
  };
  s.cycleS = cycleDurationOf(s, params);
  return s;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return buildWorld(params);
  },

  applyParams(state, params, prev) {
    const eventKeys: (keyof ParamValues)[] = ["coreState", "focusDepth", "waveType", "stationCount", "magnitude"];
    const changed = eventKeys.some((k) => params[k] !== prev[k]);
    if (!changed) return state;
    const ev = rebuildEvent(params, state.epicenterAngleDeg);
    const s: State = { ...state, ...ev, clockS: 0, quakeCount: 0 };
    s.cycleS = cycleDurationOf(s, params);
    return s;
  },

  step(state, dt, params, _ctx, inputs) {
    if (dt <= 0 && inputs.length === 0) return state;
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown") {
        // Drag the epicentre to a new point on the rim: recompute every
        // station's angular distance and re-fire, same physics, new geometry.
        const angleDeg = ((Math.atan2(input.x, -input.y) * 180) / Math.PI + 360) % 360;
        const ev = rebuildEvent(params, angleDeg);
        s = { ...s, epicenterAngleDeg: angleDeg, ...ev, clockS: 0, quakeCount: s.quakeCount };
        s.cycleS = cycleDurationOf(s, params);
      }
    }
    if (dt <= 0) return s;
    const speed = params.playbackSpeed as number;
    let clockS = s.clockS + dt * speed;
    let quakeCount = s.quakeCount;
    if (clockS >= s.cycleS) {
      clockS -= s.cycleS;
      quakeCount += 1;
    }
    return { ...s, clockS, quakeCount };
  },

  readouts(state, params) {
    const peelKm = (params.peelDepth as number) / 1000;
    const sample = sampleProfile(state.profile, peelKm);
    return [
      {
        key: "clock", label: "Time since quake", quantity: q(state.clockS, "time"), semantic: "time",
      },
      {
        key: "peelDensity", label: "Density at peel depth", unit: "g/cm³",
        quantity: q(sample.densityKgM3 / 1000, "density"), semantic: "mass", graphable: true,
      },
      {
        key: "peelTemp", label: "Temperature at peel depth", unit: "°C",
        quantity: q(sample.tempC + 273.15, "temperature"), semantic: "hot", graphable: true,
      },
      {
        key: "peelPressure", label: "Pressure at peel depth (GPa)",
        quantity: q(sample.pressurePa / 1e9, "ratio"), semantic: "force", graphable: true,
      },
      {
        key: "quakes", label: "Quakes fired", quantity: q(state.quakeCount, "count"), semantic: "field",
      },
    ];
  },

  facts(state, params) {
    const reached = (t: number | null) => t !== null && t <= state.clockS;
    let stationsWithP = 0, stationsWithS = 0, stationsInPShadow = 0, stationsInSShadow = 0;
    let firstP: number | null = null, firstS: number | null = null;
    for (const st of state.stations) {
      if (st.pTime !== null) { if (firstP === null || st.pTime < firstP) firstP = st.pTime; }
      if (st.sTime !== null) { if (firstS === null || st.sTime < firstS) firstS = st.sTime; }
      if (reached(st.pTime) && st.pAmp > DETECT_FLOOR) stationsWithP++;
      else if (st.pTime === null) stationsInPShadow++;
      if (reached(st.sTime) && st.sAmp > DETECT_FLOOR) stationsWithS++;
      else if (st.sTime === null) stationsInSShadow++;
    }
    // The hypothesis check: does the CURRENT hypothesis's S coverage at these
    // exact stations match the cached real, liquid-core pattern computed once
    // in rebuildEvent?
    let hypothesisMatches = true;
    for (let i = 0; i < state.stations.length; i++) {
      const real = state.refSPattern[i];
      const current = state.stations[i].sTime !== null;
      if (real !== current) { hypothesisMatches = false; break; }
    }
    const peelKm = (params.peelDepth as number) / 1000;
    const sample = sampleProfile(state.profile, peelKm);
    const site = DRILL_SITES[params.drillSite as string];
    const bedrockUnit = site.units[site.units.length - 1];
    const stillInCrustAt10km = peelKm <= MOHO_KM ? true : false; // for the drill question at any site
    return {
      clockS: state.clockS,
      cycleS: state.cycleS,
      quakeCount: state.quakeCount,
      coreState: coreStateOf(params),
      stationCount: state.stations.length,
      stationsWithP,
      stationsWithS,
      stationsInPShadow,
      stationsInSShadow,
      shadowPStart: state.shadowP?.startDeg ?? -1,
      shadowPEnd: state.shadowP?.endDeg ?? -1,
      shadowSStart: state.shadowS?.startDeg ?? -1,
      shadowSEnd: state.shadowS?.endDeg ?? -1,
      firstPArrivalS: firstP ?? -1,
      firstSArrivalS: firstS ?? -1,
      hypothesisMatches,
      peelDepthKm: peelKm,
      peelDensityGcm3: sample.densityKgM3 / 1000,
      peelTempC: sample.tempC,
      peelPressureGPa: sample.pressurePa / 1e9,
      peelGravityMs2: sample.gravityMs2,
      drillSite: params.drillSite as string,
      drillBedrockDepthM: bedrockUnit.topM,
      drillDeepestDrillKm: DEEPEST_DRILL_KM,
      stillInCrustAt10km,
      epicenterAngleDeg: state.epicenterAngleDeg,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

const LAYER_COLOR: Record<string, string> = {
  crust: "#d8c48a",
  litho: "#8a8f4a",
  asth: "#a9926f",
  trans: "#b98a52",
  lower: "#a05a2c",
  outer: "#e8752c",
  inner: "#fff3d0",
};

function layerAt(depthKm: number): string {
  if (depthKm < MOHO_KM) return "crust";
  if (depthKm < LITHO_KM) return "litho";
  if (depthKm < TRANS_LO_KM) return "asth";
  if (depthKm < TRANS_HI_KM) return "trans";
  if (depthKm < CMB_KM) return "lower";
  if (depthKm < ICB_KM) return "outer";
  return "inner";
}

function drawGlobeCutaway(rc: RenderContext<State>, cx: number, cy: number, R: number) {
  const { ctx, state, params, theme, time } = rc;
  const dark = isDarkTheme(theme);
  const peelKm = (params.peelDepth as number) / 1000;
  const peelR = R * (1 - peelKm / R_KM);

  // Concentric shells, outside-in, each a filled ring.
  const bandsKm = [0, MOHO_KM, LITHO_KM, TRANS_LO_KM, TRANS_HI_KM, CMB_KM, ICB_KM, R_KM];
  for (let i = bandsKm.length - 1; i > 0; i--) {
    const outerKm = bandsKm[i], innerKm = bandsKm[i - 1];
    const layer = layerAt((outerKm + innerKm) / 2 - 0.01 <= 0 ? 0.01 : (outerKm + innerKm) / 2);
    const outerR = R * (1 - innerKm / R_KM); // shallower depth -> larger radius
    ctx.beginPath();
    ctx.fillStyle = LAYER_COLOR[layer];
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
  }
  // Peel: strip back a wedge to expose the layer sitting at the peel depth.
  if (peelKm > 5) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 1.02, -0.55, 0.75);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = isDarkTheme(theme) ? "#0b0f16" : "#e9edf1";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
    ctx.fill();
    const layer = layerAt(peelKm);
    ctx.beginPath();
    ctx.fillStyle = LAYER_COLOR[layer];
    ctx.arc(cx, cy, peelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.accent, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, peelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Boundary rings, thin and labelled, matching the spec's contour lines.
  ctx.save();
  ctx.strokeStyle = hexA(dark ? "#ffffff" : "#1a1a1a", 0.25);
  ctx.lineWidth = 1;
  for (const km of [MOHO_KM, TRANS_LO_KM, TRANS_HI_KM, CMB_KM, ICB_KM]) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * (1 - km / R_KM), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Rays: the field the student actually measures with.
  for (const ray of state.drawRays) {
    ctx.beginPath();
    for (let i = 0; i < ray.path.length; i++) {
      const [x, y] = ray.path[i];
      const px = cx + (x / R_KM) * R, py = cy - (y / R_KM) * R;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = hexA(ray.wave === "P" ? "#f4c542" : "#c25fe0", 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // The Earth's outer limb, drawn last so the peel wedge reads as a cut, not
  // an edge artefact.
  ctx.strokeStyle = hexA(theme.ink, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Stations around the rim.
  for (const st of state.stations) {
    const a = (st.angleDeg * Math.PI) / 180;
    const px = cx + Math.sin(a) * R * 1.06, py = cy - Math.cos(a) * R * 1.06;
    const gotP = st.pTime !== null && st.pTime <= state.clockS && st.pAmp > DETECT_FLOOR;
    const gotS = st.sTime !== null && st.sTime <= state.clockS && st.sAmp > DETECT_FLOOR;
    const color = gotS ? "#c25fe0" : gotP ? "#f4c542" : theme.inkSoft;
    sphere(ctx, px, py, 3.4, color, { rim: false });
    if ((gotP && st.pTime !== null && state.clockS - st.pTime < 6) ||
        (gotS && st.sTime !== null && state.clockS - st.sTime < 6)) {
      glow(ctx, px, py, 8, hexA(color, 0.5));
    }
  }

  // Shadow bands, drawn just outside the rim.
  const drawShadow = (band: { startDeg: number; endDeg: number } | null, color: string, off: number) => {
    if (!band) return;
    ctx.save();
    ctx.strokeStyle = hexA(color, 0.55);
    ctx.lineWidth = 4;
    const a0 = ((state.epicenterAngleDeg + band.startDeg) * Math.PI) / 180 - Math.PI / 2;
    const a1 = ((state.epicenterAngleDeg + band.endDeg) * Math.PI) / 180 - Math.PI / 2;
    const a2 = ((state.epicenterAngleDeg - band.startDeg) * Math.PI) / 180 - Math.PI / 2;
    const a3 = ((state.epicenterAngleDeg - band.endDeg) * Math.PI) / 180 - Math.PI / 2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.1 + off, a0, a1); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.1 + off, a3, a2); ctx.stroke();
    ctx.restore();
  };
  drawShadow(state.shadowP, "#f4c542", 0);
  drawShadow(state.shadowS, "#c25fe0", 6);

  // The epicentre, pulsing.
  const ea = (state.epicenterAngleDeg * Math.PI) / 180;
  const ex = cx + Math.sin(ea) * R, ey = cy - Math.cos(ea) * R;
  quakeWaves(ctx, ex, ey, R * 0.5, (state.clockS / 8) % 100 + time * 0.001, theme);
  ctx.beginPath();
  ctx.fillStyle = "#ff5a3c";
  ctx.arc(ex, ey, 4 + pulse(time, 2) * 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawDepthProfile(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "DEPTH PROFILE", theme, { size: 10, weight: 800, color: theme.inkSoft });

  const n = state.profile.depthKm.length;
  const plotX = x + 8, plotY = y + 22, plotW = w - 16, plotH = h - 32;
  const series: [number[], string][] = [
    [state.profile.tempC.map((t) => t / 6000), "#e0553f"],
    [state.profile.pressurePa.map((p) => p / 3.7e11), "#4a8fd6"],
    [state.profile.densityKgM3.map((d) => d / 13500), "#7a9a4a"],
  ];
  for (const [vals, color] of series) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = plotX + (i / (n - 1)) * plotW;
      const py = plotY + plotH - clamp01(vals[i]) * plotH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const peelKm = (params.peelDepth as number) / 1000;
  const cursorX = plotX + (peelKm / R_KM) * plotW;
  ctx.strokeStyle = hexA(theme.accent, 0.8);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cursorX, plotY);
  ctx.lineTo(cursorX, plotY + plotH);
  ctx.stroke();
  ctx.setLineDash([]);
  caption(ctx, x + w - 8, y + 14, "T / P / rho vs depth", theme, { align: "right", size: 9, color: theme.inkSoft });
  ctx.restore();
}

const MONO = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";

function drawStationTable(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const dark = isDarkTheme(theme);
  ctx.save();
  ctx.fillStyle = dark ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "ARRIVALS (deg -> s)", theme, { size: 10, weight: 800, color: theme.inkSoft });
  ctx.font = MONO;
  ctx.textBaseline = "middle";
  const rows = [...state.stations].sort((a, b) => a.distDeg - b.distDeg).slice(0, Math.floor((h - 22) / 12));
  rows.forEach((st, i) => {
    const ty = y + 26 + i * 12;
    const p = st.pTime !== null ? st.pTime.toFixed(0) : "--";
    const s = st.sTime !== null ? st.sTime.toFixed(0) : "--";
    ctx.fillStyle = theme.ink;
    ctx.fillText(`${st.distDeg.toFixed(0).padStart(3)} deg   P ${p.padStart(4)}   S ${s.padStart(4)}`, x + 8, ty);
  });
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const showTable = overlays.table !== false;
  const showProfile = overlays.profile !== false;
  benchStage(ctx, width, height, theme);

  const sideW = Math.min(220, width * 0.26);
  const globeR = Math.min((width - sideW * 2 - 40) / 2, height * 0.34);
  const cx = (width - sideW * 2) / 2 + sideW - 8;
  const cy = height * 0.46;
  drawGlobeCutaway(rc, cx, cy, globeR);

  if (showProfile) drawDepthProfile(rc, width - sideW, 12, sideW - 8, height * 0.4);
  if (showTable) drawStationTable(rc, 8, 12, sideW - 8, height * 0.4);

  // Drill core, bottom strip.
  const site = DRILL_SITES[params.drillSite as string];
  const layers = site.units.map((u) => ({
    name: u.name, color: u.color, thicknessFrac: u.baseM - u.topM,
  }));
  strataColumn(ctx, 16, height - 108, 120, 96, layers, { labels: false });
  caption(ctx, 16, height - 112, `${site.label} core`, theme, { size: 10, weight: 700, color: theme.inkSoft });

  const hyp = params.coreState as string;
  const label = hyp === "liquid" ? "Liquid outer core" : hyp === "solid" ? "Solid all the way through" : "Uniform rock, no core";
  badge(ctx, 12, 20, label, theme, { color: theme.accent });
  const wave = params.waveType as string;
  badge(ctx, width / 2, 20, `wave: ${wave}`, theme, { align: "center", color: theme.sci["field"] });

  let matches = true;
  for (let i = 0; i < state.stations.length; i++) {
    if (state.refSPattern[i] !== (state.stations[i].sTime !== null)) { matches = false; break; }
  }
  badge(ctx, width - 12, 20, matches ? "MATCHES REAL DATA" : "CONTRADICTS REAL DATA", theme, {
    align: "right", color: matches ? theme.sci["neutral"] : theme.sci["hot"],
  });

  if (state.shadowS) {
    badge(ctx, width / 2, 44, `S shadow begins near ${state.shadowS.startDeg} deg`, theme, {
      align: "center", color: theme.sci["field"],
    });
  }
  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const KM = 1000; // param depths are stored in metres

const BASE_SETUP: ParamValues = {
  peelDepth: 0, focusDepth: 8 * KM, magnitude: 6.5, waveType: "both",
  stationCount: 12, coreState: "liquid", drillSite: "centralValley",
  exaggeration: 20, playbackSpeed: 1,
};

export const peelThePlanetSim: SimManifest<State> = {
  id: "g6.a4-1",
  title: "Peel the Planet: Reading the Rock Shells",
  tagline: "Fire real seismic rays through Earth's layers and read the interior from where the waves do and do not arrive.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Explain that Earth's internal layers are known from how seismic waves travel, not from direct observation.",
    "Use a P-wave and an S-wave shadow zone as evidence for a liquid outer core.",
    "Read a wrong hypothesis's predictions against real station data to reject it.",
  ],
  misconceptions: [
    "The layers of the Earth were seen by digging or drilling",
    "The whole interior of the Earth is molten",
    "A hotter layer must glow visibly if you could see it",
    "Seismic waves travel in straight lines regardless of what they pass through",
  ],
  interactionHint: "Drag the epicentre around the rim, then watch which stations the rays do and do not reach.",
  tickRate: 30,
  timeScale: 1,
  params: {
    peelDepth: {
      type: "number", label: "Peel depth", kind: "length", unit: "km",
      min: 0, max: R_KM * KM, step: 25 * KM, default: 0,
      help: "Strips the shells back on one wedge to expose the layer at this depth.",
    },
    focusDepth: {
      type: "number", label: "Earthquake focus depth", kind: "length", unit: "km",
      min: 0, max: 700 * KM, step: 10 * KM, default: 8 * KM,
      help: "How deep under Parkfield the rupture starts.",
    },
    magnitude: {
      type: "number", label: "Magnitude", kind: "ratio",
      min: 4.0, max: 8.5, step: 0.1, default: 6.5,
      help: "Bigger quakes read at stations farther away.",
    },
    waveType: {
      type: "option", label: "Wave type",
      options: [
        { value: "P", label: "P only" },
        { value: "S", label: "S only" },
        { value: "both", label: "P and S" },
        { value: "surface", label: "Surface waves" },
      ],
      default: "both",
      help: "Which ray bundles are traced. Surface waves hug the crust and reach everywhere.",
    },
    stationCount: {
      type: "number", label: "Seismograph stations", kind: "count",
      min: 4, max: MAX_STATIONS, step: 1, default: 12,
      help: "More stations resolve the shadow zone's edge more sharply.",
    },
    coreState: {
      type: "option", label: "Core-state hypothesis",
      options: [
        { value: "liquid", label: "Liquid outer core" },
        { value: "solid", label: "Solid all the way through" },
        { value: "uniform", label: "Uniform rock, no core" },
      ],
      default: "liquid",
      help: "Rebuilds the velocity model the rays actually travel through.",
    },
    drillSite: {
      type: "option", label: "Drill site",
      options: [
        { value: "centralValley", label: "Central Valley" },
        { value: "sierraCrest", label: "Sierra crest" },
        { value: "coastRanges", label: "Coast Ranges" },
        { value: "mojave", label: "Mojave" },
      ],
      default: "centralValley",
      help: "Where the drill core column is taken from.",
    },
    exaggeration: {
      type: "number", label: "Drill core exaggeration", kind: "ratio",
      min: 1, max: 50, step: 1, default: 20,
      help: "Vertical stretch of the drill-core column only.",
    },
    playbackSpeed: {
      type: "number", label: "Playback speed", kind: "ratio",
      min: 0.25, max: 20, step: 0.25, default: 1,
      marks: [{ value: 1, label: "1x" }, { value: 20, label: "20x" }],
      help: "How fast simulated wave-travel seconds pass.",
    },
  },
  overlays: [
    { key: "table", label: "Arrival table", default: true },
    { key: "profile", label: "Depth profile", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "twelve-drums",
      title: "One quake, twelve drums",
      question: "Which stations record both waves, which record only P, and where are they on the globe?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-1"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Twelve stations ring the globe. A magnitude 6.5 quake is about to fire.",
          predict: {
            prompt: "Will every station record both a P and an S arrival?",
            options: [
              "Yes, waves reach everywhere eventually",
              "No — some stations sit in a shadow with no S arrival at all",
              "No — only the closest station records anything",
            ],
            correct: 1,
            reveal:
              "No. Past a certain angle, the ray sweep genuinely never returns an S arrival there — the liquid outer core cannot carry a shear wave, so no station beyond that angle ever records one.",
          },
        },
        {
          id: "wait",
          phase: "measure",
          title: "Let the quake run",
          instruction: "Run until the quake cycle completes and record how many stations show each wave.",
          requireData: 1,
          check: { describe: "At least one quake cycle completed", test: (v) => (v.facts.quakeCount as number) >= 1 },
          hints: ["The clock readout counts seconds since the quake fired."],
        },
        {
          id: "shadow",
          phase: "measure",
          title: "Find the gap",
          instruction: "Record how many stations sit in the S shadow.",
          check: {
            describe: "Some stations show no S arrival",
            test: (v) => (v.facts.stationsInSShadow as number) >= 1,
          },
        },
        {
          id: "raise",
          phase: "analyze",
          title: "More stations",
          instruction: "Raise the station count to 24 and compare the shadow's edge.",
          check: {
            describe: "24 stations placed, shadow edge still measurable",
            test: (v) => (v.params.stationCount as number) >= 24 && (v.facts.shadowSStart as number) >= 0,
          },
          hints: ["More stations sharpen the edge; they do not move it."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the evidence",
          instruction: "Say what the missing S arrivals prove about the deep Earth.",
          write: {
            prompt: "A whole band of stations records no S wave at all. What does that prove about the outer core?",
            placeholder: "Since S waves cannot ...",
          },
        },
      ],
    },
    {
      id: "find-the-shadow",
      title: "Find the shadow",
      question: "What angle does the silent zone begin at, and what does that silence prove?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-1"],
      setup: { ...BASE_SETUP, stationCount: 24, waveType: "S", magnitude: 7.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the edge",
          instruction: "Only S waves are traced this time, from 24 stations.",
          predict: {
            prompt: "Roughly where does the S shadow begin?",
            options: ["Right next to the epicentre, under 30 degrees", "Somewhere around 90-110 degrees", "It never begins — S reaches every station"],
            correct: 1,
            reveal: "Somewhere around 90-110 degrees in this model — the exact figure depends on the velocity structure, but a real, wide band with no S arrival appears past roughly a hundred degrees.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Measure it",
          instruction: "Run a cycle and record the measured shadow start angle.",
          requireData: 1,
          check: { describe: "Shadow start angle measured", test: (v) => (v.facts.shadowSStart as number) >= 0 },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare hypotheses",
          instruction: "Switch the core-state hypothesis to solid and watch the shadow.",
          check: {
            describe: "Under a solid core, the S shadow is gone",
            test: (v) => v.params.coreState === "solid" && (v.facts.shadowSStart as number) === -1,
          },
          hints: ["A solid core carries shear waves everywhere — no gap to find."],
        },
        {
          id: "restore",
          phase: "measure",
          title: "Back to reality",
          instruction: "Return the hypothesis to liquid and confirm the shadow reappears.",
          check: {
            describe: "Liquid core restored, shadow measurable again",
            test: (v) => v.params.coreState === "liquid" && (v.facts.shadowSStart as number) >= 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "What the silence proves",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "What does a band of silent stations prove that a band of quiet-but-present stations would not?",
            placeholder: "A weak signal could still be a wave that arrived; total silence means ...",
          },
        },
      ],
    },
    {
      id: "wrong-earth",
      title: "A wrong Earth",
      question: "Which stations now record S waves, and how does that clash with the real record?",
      bands: ["6-8"],
      minutes: 18,
      standards: ["MS-ESS2-1"],
      setup: { ...BASE_SETUP, coreState: "solid", stationCount: 24 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the drums",
          instruction: "The hypothesis is now a solid Earth all the way through.",
          predict: {
            prompt: "What will the hypothesis-check badge say once the quake runs?",
            options: ["MATCHES REAL DATA", "CONTRADICTS REAL DATA", "It depends on magnitude"],
            correct: 1,
            reveal:
              "CONTRADICTS REAL DATA. A solid Earth delivers S waves at every station, including the ones that, in the real liquid-core Earth, would sit in total silence.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run it",
          instruction: "Run a cycle and check the hypothesis badge.",
          requireData: 1,
          check: { describe: "Hypothesis measured against real data", test: (v) => v.facts.quakeCount as number >= 1 },
        },
        {
          id: "contradict",
          phase: "analyze",
          title: "Catch the contradiction",
          instruction: "Confirm the badge reads a mismatch.",
          check: { describe: "Hypothesis does not match reality", test: (v) => v.facts.hypothesisMatches === false },
        },
        {
          id: "fixit",
          phase: "measure",
          title: "Fix the hypothesis",
          instruction: "Switch back to a liquid outer core and confirm the match returns.",
          check: { describe: "Liquid core matches real data", test: (v) => v.params.coreState === "liquid" && v.facts.hypothesisMatches === true },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Reject the wrong Earth",
          instruction: "Write the one observation that rules the solid-Earth hypothesis out.",
          write: {
            prompt: "Name the single station-level observation that a solid Earth cannot explain.",
            placeholder: "Real stations past about 100 degrees never record S, but a solid Earth predicts ...",
          },
        },
      ],
    },
    {
      id: "drill-california",
      title: "Drill California",
      question: "How deep is bedrock at each site, and after ten kilometres, which shell are you still inside?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-1"],
      setup: { ...BASE_SETUP, peelDepth: 0 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict bedrock depth",
          instruction: "Compare a Central Valley site with a Sierra crest site before drilling either.",
          predict: {
            prompt: "Which site reaches solid bedrock first?",
            options: ["Central Valley — thick sediment fills the basin", "Sierra crest — granite is already at the surface", "They are the same depth"],
            correct: 1,
            reveal: "Sierra crest. The valley is a sediment-filled basin over a kilometre deep before the granodiorite basement even starts; the range crest already IS the granite.",
          },
        },
        {
          id: "valley",
          phase: "measure",
          title: "Drill the valley",
          instruction: "Select Central Valley and record the bedrock depth.",
          requireData: 1,
          check: { describe: "Central Valley bedrock depth recorded", test: (v) => v.params.drillSite === "centralValley" && (v.facts.drillBedrockDepthM as number) > 0 },
        },
        {
          id: "crest",
          phase: "measure",
          title: "Drill the crest",
          instruction: "Switch to Sierra crest and record its bedrock depth.",
          requireData: 2,
          check: { describe: "Sierra crest bedrock depth recorded, shallower than the valley", test: (v) => v.params.drillSite === "sierraCrest" && (v.facts.drillBedrockDepthM as number) < 100 },
        },
        {
          id: "peel",
          phase: "analyze",
          title: "Peel to 10 km",
          instruction: "Set peel depth to 10 km and check which shell you are still inside.",
          check: {
            describe: "At 10 km depth, still inside the crust",
            test: (v) => (v.facts.peelDepthKm as number) >= 9 && v.facts.stillInCrustAt10km === true,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "The honesty line",
          instruction: "Compare 10 km with the deepest hole ever drilled.",
          write: {
            prompt: "The deepest real borehole reached about 12.3 km, still inside the crust. What does that mean for how we know about the mantle and core?",
            placeholder: "Since nobody has ever drilled past the crust, everything deeper is known by ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "prove-the-shadow",
      title: "Prove the shadow with the fewest stations",
      brief: "Find the smallest number of stations that still measures a real S shadow zone.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, waveType: "S" },
      goal: {
        describe: "A shadow is measured with 8 or fewer stations",
        test: (v) => (v.params.stationCount as number) <= 8 && (v.facts.shadowSStart as number) >= 0,
      },
      stars: {
        two: {
          describe: "With 6 or fewer stations",
          test: (v) => (v.params.stationCount as number) <= 6 && (v.facts.shadowSStart as number) >= 0,
        },
        three: {
          describe: "With exactly 4 stations",
          test: (v) => (v.params.stationCount as number) <= 4 && (v.facts.shadowSStart as number) >= 0,
        },
      },
      hints: ["A shadow needs at least one station inside it and one outside it to show up as a gap."],
    },
    {
      id: "catch-the-liar",
      title: "Catch the wrong Earth",
      brief: "Using the uniform-rock hypothesis, find a station whose reading alone rules it out.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, coreState: "uniform", stationCount: 24 },
      goal: {
        describe: "Hypothesis measured and shown to contradict real data",
        test: (v) => v.facts.hypothesisMatches === false && (v.facts.quakeCount as number) >= 1,
      },
      hints: ["A coreless Earth never produces a shadow at all — that absence is itself the evidence."],
    },
  ],
};
