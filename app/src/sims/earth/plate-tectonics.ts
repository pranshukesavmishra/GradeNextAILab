import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { arrow } from "@ui/draw";
import { badge, caption, glow, hexA, isDarkTheme, sky, sphere, vignette } from "@ui/scene";

/**
 * Plate Tectonics — Grades 6-12.
 *
 * A cross-section through a plate boundary the student defines: which way the
 * plates move, how fast, and what each one is made of. Nothing about the
 * landscape is drawn in advance. Mountains come out of Airy isostasy on
 * thickened crust; mid-ocean ridges come out of the half-space cooling law
 * (depth grows with the square root of the crust's age); trenches, volcanic
 * arcs and the dipping Wadati-Benioff earthquake zone come out of the fact
 * that oceanic crust is dense enough to sink and continental crust is not.
 *
 * That last fact is the whole answer to "why are the biggest mountains where
 * they are": two continents cannot get rid of each other, so the crust has
 * nowhere to go but up.
 */

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

const N = 160;
const X_MIN = -600;   // km
const X_MAX = 600;
const DX = (X_MAX - X_MIN) / N;

const OCEANIC = 0;
const CONTINENTAL = 1;

/** Airy isostasy: how much of a crustal root floats above the reference. */
const RHO_MANTLE = 3300;
const RHO_CONTINENT = 2750;
const ISO_FACTOR = 1 - RHO_CONTINENT / RHO_MANTLE;      // 0.1667
const NORMAL_CONTINENT_KM = 35;
/** Chosen so ordinary continental crust sits 0.3 km above sea level. */
const ISO_OFFSET = NORMAL_CONTINENT_KM * ISO_FACTOR - 0.3;

/** Half-space cooling: ocean depth grows with the square root of crustal age. */
const RIDGE_DEPTH_KM = 2.6;
const SUBSIDENCE_KM_PER_SQRT_MYR = 0.35;
const ABYSS_LIMIT_KM = 5.9;
const OLD_SEAFLOOR_MYR = 60;

const MAX_THICKNESS = 70;      // km — crustal roots cannot grow without limit
const MAX_TRENCH_KM = 5;
const COLLISION_SIGMA = 120;   // km
const RIFT_SIGMA = 90;
const TRENCH_SIGMA = 35;
const ARC_SIGMA = 40;
const ARC_DISTANCE = 160;      // km inboard of the trench, where the slab melts
const SLAB_DIP = 45 * (Math.PI / 180);

const MAX_QUAKES = 30;

/** Gaussian with unit area, so a rate spread over it conserves crust. */
function gaussian(x: number, sigma: number): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
}

function columnX(i: number): number {
  return X_MIN + (i + 0.5) * DX;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface Quake {
  x: number;       // km
  depth: number;   // km
  magnitude: number;
  age: number;     // Myr since it happened, for fading
}

interface State {
  myr: number;
  thickness: number[];   // km, only meaningful for continental columns
  age: number[];         // Myr since the seafloor formed
  kind: number[];        // OCEANIC | CONTINENTAL
  volcano: number[];     // km of volcanic pile added
  trench: number[];      // km of trench depression
  /** Half-width of new seafloor created at a spreading centre, km. */
  spreadHalf: number;
  rifted: boolean;
  stress: number;
  threshold: number;
  quakes: Quake[];
  quakeCount: number;
  biggestQuake: number;
  eruptions: number;
  /** Highest ground at the start, so "elevation change" means something. */
  startMaxElevation: number;
  offsetKm: number;      // transform slip accumulated
}

type Params = Record<string, number | boolean | string>;

interface Setting {
  boundary: string;
  left: number;
  right: number;
  /** true when one plate is dense enough to sink under the other. */
  subducting: boolean;
  /** −1 when the left plate goes down, +1 when the right one does, 0 for neither. */
  subSign: number;
  collision: boolean;
  spreading: boolean;
  label: string;
}

function settingOf(params: Params, rifted: boolean): Setting {
  const boundary = params.boundary as string;
  const left = (params.leftPlate as string) === "continental" ? CONTINENTAL : OCEANIC;
  const right = (params.rightPlate as string) === "continental" ? CONTINENTAL : OCEANIC;

  if (boundary === "convergent") {
    if (left === CONTINENTAL && right === CONTINENTAL) {
      return {
        boundary, left, right, subducting: false, subSign: 0,
        collision: true, spreading: false, label: "Continental collision",
      };
    }
    // Oceanic crust is the denser one, so it is always the plate that sinks.
    const subSign = left === OCEANIC ? -1 : 1;
    return {
      boundary, left, right, subducting: true, subSign,
      collision: false, spreading: false,
      label: left === OCEANIC && right === OCEANIC ? "Ocean-ocean subduction" : "Subduction zone",
    };
  }
  if (boundary === "divergent") {
    const oceanFloor = (left === OCEANIC && right === OCEANIC) || rifted;
    return {
      boundary, left, right, subducting: false, subSign: 0,
      collision: false, spreading: oceanFloor,
      label: oceanFloor ? "Mid-ocean ridge" : "Continental rift",
    };
  }
  return {
    boundary, left, right, subducting: false, subSign: 0,
    collision: false, spreading: false, label: "Transform fault",
  };
}

function buildTerrain(params: Params): State {
  const thickness = new Array<number>(N);
  const age = new Array<number>(N);
  const kind = new Array<number>(N);
  const volcano = new Array<number>(N).fill(0);
  const trench = new Array<number>(N).fill(0);
  const leftKind = (params.leftPlate as string) === "continental" ? CONTINENTAL : OCEANIC;
  const rightKind = (params.rightPlate as string) === "continental" ? CONTINENTAL : OCEANIC;

  for (let i = 0; i < N; i++) {
    const isLeft = columnX(i) < 0;
    kind[i] = isLeft ? leftKind : rightKind;
    thickness[i] = kind[i] === CONTINENTAL ? NORMAL_CONTINENT_KM : 7;
    age[i] = kind[i] === CONTINENTAL ? 0 : OLD_SEAFLOOR_MYR;
  }

  const state: State = {
    myr: 0,
    thickness, age, kind, volcano, trench,
    spreadHalf: 0,
    rifted: false,
    stress: 0,
    threshold: 1,
    quakes: [],
    quakeCount: 0,
    biggestQuake: 0,
    eruptions: 0,
    startMaxElevation: 0,
    offsetKm: 0,
  };
  state.startMaxElevation = maxElevation(state);
  return state;
}

/** Ground height above sea level, in km, for one column. */
export function elevationOf(state: State, i: number): number {
  let base: number;
  if (state.kind[i] === CONTINENTAL) {
    // Airy isostasy: a thicker crustal root floats higher.
    base = state.thickness[i] * ISO_FACTOR - ISO_OFFSET;
  } else {
    // Half-space cooling: young seafloor is hot, buoyant and shallow.
    const depth = Math.min(
      ABYSS_LIMIT_KM,
      RIDGE_DEPTH_KM + SUBSIDENCE_KM_PER_SQRT_MYR * Math.sqrt(Math.max(0, state.age[i])),
    );
    base = -depth;
  }
  return base + state.volcano[i] - state.trench[i];
}

function maxElevation(state: State): number {
  let best = -Infinity;
  for (let i = 0; i < N; i++) {
    const e = elevationOf(state, i);
    if (e > best) best = e;
  }
  return best;
}

function minElevation(state: State): number {
  let worst = Infinity;
  for (let i = 0; i < N; i++) {
    const e = elevationOf(state, i);
    if (e < worst) worst = e;
  }
  return worst;
}

/** Crustal thickness at the boundary itself — the number that builds mountains. */
function boundaryThickness(state: State): number {
  return state.thickness[N / 2];
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/** Seismic coupling: how much strain a boundary stores before it lets go. */
function couplingOf(s: Setting): number {
  if (s.subducting) return 1;
  if (s.collision) return 0.85;
  if (s.boundary === "transform") return 0.75;
  return 0.3;
}

/** The largest earthquake a boundary of this kind can actually produce. */
function magnitudeRange(s: Setting): [number, number] {
  if (s.subducting) return [6, 9.2];
  if (s.collision) return [5.5, 8.2];
  if (s.boundary === "transform") return [5.2, 8];
  return [3.8, 6];
}

const model: SimModel<State> = {
  init(params) {
    return buildTerrain(params);
  },

  applyParams(state, params, prev) {
    // A different boundary is a different experiment, so it starts fresh.
    if (
      params.boundary !== prev.boundary ||
      params.leftPlate !== prev.leftPlate ||
      params.rightPlate !== prev.rightPlate
    ) {
      return buildTerrain(params);
    }
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rng = ctx.rng;
    const myr = state.myr + dt;
    // The slider is in centimetres per year, which is exactly km per million
    // years divided by ten — the coincidence every geology class enjoys.
    const v = (params.speed as number) * 10;

    const setting = settingOf(params, state.rifted);
    const thickness = state.thickness.slice();
    const age = state.age.slice();
    const kind = state.kind.slice();
    const volcano = state.volcano.slice();
    const trench = state.trench.slice();
    let spreadHalf = state.spreadHalf;
    let rifted = state.rifted;
    let eruptions = state.eruptions;

    // Seafloor everywhere gets older, which is why it gets deeper.
    for (let i = 0; i < N; i++) {
      if (kind[i] === OCEANIC) age[i] += dt;
    }

    if (setting.collision) {
      /* --- two continents: nothing subducts, so the crust piles up --- */
      const shortening = v * NORMAL_CONTINENT_KM * 0.2;
      for (let i = 0; i < N; i++) {
        const g = gaussian(columnX(i), COLLISION_SIGMA);
        thickness[i] = Math.min(MAX_THICKNESS, thickness[i] + shortening * g * dt);
      }
    } else if (setting.subducting) {
      /* --- one plate sinks: trench, arc, and a thickened upper plate -- */
      const trenchX = setting.subSign * 40;
      const arcX = -setting.subSign * ARC_DISTANCE;
      const overrideKind = setting.subSign < 0 ? setting.right : setting.left;
      const arcCap = overrideKind === CONTINENTAL ? 4.5 : 7.5;

      const trenchRate = v * 0.9;
      const arcRate = v * 1.1;
      for (let i = 0; i < N; i++) {
        const x = columnX(i);
        trench[i] = Math.min(
          MAX_TRENCH_KM,
          trench[i] + trenchRate * gaussian(x - trenchX, TRENCH_SIGMA) * dt,
        );
        volcano[i] = Math.min(
          arcCap,
          volcano[i] + arcRate * gaussian(x - arcX, ARC_SIGMA) * dt,
        );
        if (overrideKind === CONTINENTAL) {
          const g = gaussian(x - arcX, COLLISION_SIGMA);
          thickness[i] = Math.min(
            MAX_THICKNESS,
            thickness[i] + v * NORMAL_CONTINENT_KM * 0.06 * g * dt,
          );
        }
      }
      if (rng.chance(Math.min(0.9, v * 0.004) * dt)) eruptions++;
    } else if (setting.boundary === "divergent") {
      if (setting.spreading) {
        /* --- a spreading centre makes brand new seafloor ------------- */
        spreadHalf += (v / 2) * dt;
        for (let i = 0; i < N; i++) {
          if (Math.abs(columnX(i)) <= spreadHalf) {
            if (kind[i] !== OCEANIC || volcano[i] !== 0) {
              kind[i] = OCEANIC;
              volcano[i] = 0;
              trench[i] = 0;
            }
            // Age counted from the ridge outward: distance divided by speed.
            age[i] = v > 0 ? Math.abs(columnX(i)) / (v / 2) : age[i];
            thickness[i] = 7;
          }
        }
      } else {
        /* --- a continent being pulled apart thins from below --------- */
        const thinning = v * NORMAL_CONTINENT_KM * 0.22;
        for (let i = 0; i < N; i++) {
          const x = columnX(i);
          thickness[i] = Math.max(6, thickness[i] - thinning * gaussian(x, RIFT_SIGMA) * dt);
          // Rift shoulders rise as the middle drops away.
          const shoulder = gaussian(Math.abs(x) - RIFT_SIGMA * 2.2, RIFT_SIGMA * 0.8);
          thickness[i] = Math.min(
            MAX_THICKNESS,
            thickness[i] + thinning * 0.18 * shoulder * dt,
          );
        }
        // Once the crust is thin enough, the sea gets in and spreading starts.
        if (thickness[N / 2] <= 16) rifted = true;
      }
    }

    /* --- earthquakes: strain builds, then the fault lets go --------- */
    let stress = state.stress + (v / 60) * couplingOf(setting) * dt;
    let threshold = state.threshold;
    let quakes = state.quakes;
    let quakeCount = state.quakeCount;
    let biggestQuake = state.biggestQuake;
    let fired: Quake | null = null;

    if (stress >= threshold) {
      const [minMag, maxMag] = magnitudeRange(setting);
      const magnitude = minMag + (maxMag - minMag) * Math.pow(rng.next(), 1.7);
      let x: number;
      let depth: number;
      if (setting.subducting) {
        // The Wadati-Benioff zone: quakes get deeper the further they are from
        // the trench, because they trace the sinking slab.
        depth = 5 + rng.next() * 295;
        x = setting.subSign * 40 - setting.subSign * (depth / Math.tan(SLAB_DIP));
      } else if (setting.collision) {
        depth = 3 + rng.next() * 55;
        x = rng.range(-160, 160);
      } else {
        depth = 2 + rng.next() * 14;
        x = rng.range(-40, 40);
      }
      fired = { x, depth, magnitude, age: 0 };
      stress = 0;
      threshold = 0.55 + rng.next() * 0.9;
      quakeCount++;
      if (magnitude > biggestQuake) biggestQuake = magnitude;
    }

    if (fired || quakes.length > 0) {
      const kept: Quake[] = [];
      for (let i = 0; i < quakes.length; i++) {
        const nextAge = quakes[i].age + dt;
        if (nextAge < 3) kept.push({ ...quakes[i], age: nextAge });
      }
      if (fired) kept.push(fired);
      quakes = kept.length > MAX_QUAKES ? kept.slice(kept.length - MAX_QUAKES) : kept;
    }

    return {
      myr,
      thickness, age, kind, volcano, trench,
      spreadHalf, rifted,
      stress, threshold,
      quakes, quakeCount, biggestQuake,
      eruptions,
      startMaxElevation: state.startMaxElevation,
      offsetKm: setting.boundary === "transform" ? state.offsetKm + v * dt : state.offsetKm,
    };
  },

  readouts(state, params) {
    const top = maxElevation(state);
    const bottom = minElevation(state);
    return [
      {
        key: "maxElevation", label: "Highest ground", quantity: q(top * 1000, "length"), unit: "km",
        semantic: "distance", graphable: true,
      },
      {
        key: "deepest", label: "Deepest point", quantity: q(bottom * 1000, "length"), unit: "km",
        semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "uplift", label: "Elevation change",
        quantity: q((top - state.startMaxElevation) * 1000, "length"), unit: "km",
        semantic: "velocity", graphable: true,
      },
      {
        key: "crustThickness", label: "Crust thickness at the boundary",
        quantity: q(boundaryThickness(state) * 1000, "length"), unit: "km",
        semantic: "mass", graphable: true, bands: ["9-12"],
      },
      {
        key: "rate", label: "Plate speed (cm/yr)", quantity: q(params.speed as number, "ratio"),
        semantic: "velocity", graphable: false,
      },
      {
        key: "earthquakes", label: "Earthquakes", quantity: q(state.quakeCount, "count"),
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "biggest", label: "Biggest magnitude", quantity: q(state.biggestQuake, "ratio"),
        semantic: "energy-kinetic", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "years", label: "Time", quantity: q(state.myr * 1e6 * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const setting = settingOf(params, state.rifted);
    const top = maxElevation(state);
    return {
      boundaryType: setting.label,
      boundary: setting.boundary,
      subducting: setting.subducting,
      collision: setting.collision,
      spreading: setting.spreading,
      rifted: state.rifted,
      myr: state.myr,
      years: state.myr * 1e6,
      maxElevationM: top * 1000,
      minElevationM: minElevation(state) * 1000,
      upliftM: (top - state.startMaxElevation) * 1000,
      crustThicknessKm: boundaryThickness(state),
      convergenceRate: params.speed as number,
      earthquakes: state.quakeCount,
      biggestQuake: state.biggestQuake,
      eruptions: state.eruptions,
      offsetKm: state.offsetKm,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * Two vertical scales in one picture: the top of the frame holds the
 * topography (−12 to +9 km, heavily exaggerated) and the rest holds the
 * lithosphere down to 320 km. That is the standard textbook convention and it
 * is the only way both a mountain and a slab fit on one screen.
 */
function makeScale(height: number) {
  const splitY = height * 0.42;
  const topKm = 9;
  const bottomKm = -12;
  const deepKm = 320;
  return (elevKm: number): number => {
    if (elevKm >= bottomKm) {
      return splitY - ((elevKm - bottomKm) / (topKm - bottomKm)) * (splitY - 6);
    }
    const depth = -elevKm - -bottomKm; // km below the split
    return splitY + (depth / (deepKm - -bottomKm)) * (height - splitY - 4);
  };
}

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

/**
 * One rock layer, traced along the whole section between two depths below the
 * surface. Layers are what make a cross-section read as geology rather than as
 * a bar chart of elevations.
 */
function layerPath(
  ctx: CanvasRenderingContext2D, state: State,
  toX: (km: number) => number, toY: (km: number) => number,
  fromFrac: number, toFrac: number,
) {
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const e = elevationOf(state, i);
    const thick = state.kind[i] === CONTINENTAL ? state.thickness[i] : 7;
    const x = toX(columnX(i));
    const yTop = toY(e - thick * fromFrac);
    if (i === 0) ctx.moveTo(x, yTop); else ctx.lineTo(x, yTop);
  }
  for (let i = N - 1; i >= 0; i--) {
    const e = elevationOf(state, i);
    const thick = state.kind[i] === CONTINENTAL ? state.thickness[i] : 7;
    ctx.lineTo(toX(columnX(i)), toY(e - thick * toFrac));
  }
  ctx.closePath();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const setting = settingOf(params, state.rifted);
  const toY = makeScale(height);
  const toX = (km: number) => ((km - X_MIN) / (X_MAX - X_MIN)) * width;
  const dark = isDarkTheme(theme);

  const seaY = toY(0);
  const hot = theme.sci["hot"];
  const thermal = theme.sci["energy-thermal"];
  const rock = theme.sci["mass"];
  const granite = theme.sci["solid"];
  const sediment = theme.sci["decomposer"];
  const water = theme.sci["liquid"];

  /* --- sky above the section --------------------------------------- */
  sky(ctx, width, height, theme, "day", seaY);

  /* --- mantle: hotter with depth, and it looks it ------------------- */
  const mantleTop = toY(-12);
  ctx.save();
  const mantle = ctx.createLinearGradient(0, mantleTop, 0, height);
  mantle.addColorStop(0, blend(rock, theme.ink, dark ? 0.55 : 0.3));
  mantle.addColorStop(0.35, blend(thermal, theme.ink, dark ? 0.45 : 0.25));
  mantle.addColorStop(0.72, blend(hot, theme.ink, dark ? 0.2 : 0.05));
  mantle.addColorStop(1, hot);
  ctx.fillStyle = mantle;
  ctx.fillRect(0, mantleTop, width, height - mantleTop);
  ctx.restore();

  // Convection: slow cells drawn as faint hot arcs, so the mantle is a fluid.
  ctx.save();
  ctx.strokeStyle = hexA(hot, 0.22);
  ctx.lineWidth = 2;
  for (let c = 0; c < 4; c++) {
    const cx = width * (0.14 + c * 0.24);
    const cyc = mantleTop + (height - mantleTop) * 0.6;
    ctx.beginPath();
    ctx.ellipse(cx, cyc, width * 0.1, (height - mantleTop) * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  // The deep glow: the heat engine that drives everything above it.
  glow(ctx, width * 0.5, height + 20, width * 0.8, hot, 0.35);

  /* --- crust, in layers -------------------------------------------- */
  // Lower crust.
  ctx.save();
  layerPath(ctx, state, toX, toY, 0.42, 1);
  const lower = ctx.createLinearGradient(0, toY(6), 0, toY(-60));
  lower.addColorStop(0, blend(granite, theme.ink, 0.45));
  lower.addColorStop(1, blend(rock, theme.ink, 0.5));
  ctx.fillStyle = lower;
  ctx.fill();
  ctx.restore();

  // Upper crust.
  ctx.save();
  layerPath(ctx, state, toX, toY, 0.1, 0.42);
  const upper = ctx.createLinearGradient(0, toY(9), 0, toY(-40));
  upper.addColorStop(0, blend(granite, theme.surface, 0.12));
  upper.addColorStop(1, blend(granite, theme.ink, 0.3));
  ctx.fillStyle = upper;
  ctx.fill();
  ctx.restore();

  // Sediment cap.
  ctx.save();
  layerPath(ctx, state, toX, toY, 0, 0.1);
  ctx.fillStyle = blend(sediment, theme.surface, dark ? 0.05 : 0.2);
  ctx.fill();
  ctx.restore();

  // Oceanic columns are basalt, not granite: darker, denser, thinner.
  ctx.save();
  ctx.fillStyle = hexA(blend(rock, theme.ink, 0.62), 0.85);
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    if (state.kind[i] === CONTINENTAL) continue;
    const e = elevationOf(state, i);
    const x = toX(columnX(i));
    ctx.rect(x, toY(e), width / N + 1, Math.max(2, toY(e - 7) - toY(e)));
  }
  ctx.fill();
  ctx.restore();

  // Volcanic piles glow where they are still being built.
  ctx.save();
  for (let i = 0; i < N; i += 2) {
    if (state.volcano[i] < 0.25) continue;
    const e = elevationOf(state, i);
    glow(ctx, toX(columnX(i)), toY(e), 10 + state.volcano[i] * 6, hot,
      Math.min(0.5, 0.12 + state.volcano[i] * 0.08));
  }
  ctx.restore();

  // A crisp ground line on top of the layers.
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, dark ? 0.5 : 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const x = toX(columnX(i));
    const y = toY(elevationOf(state, i));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  /* --- ocean, poured over the low ground --------------------------- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  for (let i = 0; i < N; i++) {
    const e = elevationOf(state, i);
    ctx.lineTo(toX(columnX(i)), toY(Math.min(0, e)));
  }
  ctx.lineTo(width, seaY);
  ctx.closePath();
  const sea = ctx.createLinearGradient(0, seaY, 0, toY(-11));
  sea.addColorStop(0, hexA(water, 0.55));
  sea.addColorStop(1, hexA(blend(water, theme.ink, 0.55), 0.9));
  ctx.fillStyle = sea;
  ctx.fill();
  ctx.restore();

  // The sea surface itself, with a lit edge.
  ctx.save();
  ctx.strokeStyle = hexA(blend(water, theme.surface, 0.5), 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  for (let i = 0; i <= 40; i++) {
    ctx.lineTo((i / 40) * width, seaY + Math.sin(i * 0.9 + state.myr * 0.6) * 1.2);
  }
  ctx.stroke();
  ctx.restore();

  /* --- the sinking slab -------------------------------------------- */
  if (setting.subducting) {
    const startX = setting.subSign * 40;
    const dir = -setting.subSign;
    const endX = startX + dir * (320 / Math.tan(SLAB_DIP));
    const sx0 = toX(startX), sy0 = toY(-7);
    const sx1 = toX(endX), sy1 = toY(-320);

    // A melt fringe on the upper face of the slab: where the arc's magma is born.
    ctx.save();
    ctx.strokeStyle = hexA(hot, 0.45);
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx0, sy0);
    ctx.lineTo(sx1, sy1);
    ctx.stroke();
    // The cold, dense slab itself.
    const slab = ctx.createLinearGradient(sx0, sy0, sx1, sy1);
    slab.addColorStop(0, blend(rock, theme.ink, 0.35));
    slab.addColorStop(1, blend(rock, theme.ink, 0.68));
    ctx.strokeStyle = slab;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(sx0, sy0);
    ctx.lineTo(sx1, sy1);
    ctx.stroke();
    ctx.restore();

    // Melt rising off the slab feeds the volcanic arc.
    const arcX = -setting.subSign * ARC_DISTANCE;
    ctx.save();
    ctx.strokeStyle = hexA(hot, 0.85);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(toX(arcX + dir * 60), toY(-110));
    ctx.quadraticCurveTo(toX(arcX + dir * 20), toY(-50), toX(arcX), toY(2));
    ctx.stroke();
    ctx.restore();
    glow(ctx, toX(arcX + dir * 60), toY(-110), 44, hot, 0.55);
    glow(ctx, toX(arcX), toY(0), 30, hot, 0.5);
  }

  /* --- magma at a spreading centre ---------------------------------- */
  if (setting.spreading || setting.boundary === "divergent") {
    const rx = toX(0);
    glow(ctx, rx, toY(-24), 70, hot, 0.6);
    ctx.save();
    ctx.fillStyle = hexA(hot, 0.8);
    ctx.beginPath();
    ctx.ellipse(rx, toY(-18), width * 0.035, Math.abs(toY(-30) - toY(-6)) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // A dyke feeding the surface.
    ctx.save();
    ctx.strokeStyle = hexA(hot, 0.7);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rx, toY(-18));
    ctx.lineTo(rx, toY(elevationOf(state, N / 2)));
    ctx.stroke();
    ctx.restore();
  }

  /* --- earthquakes -------------------------------------------------- */
  if (overlays.quakes !== false) {
    for (let i = 0; i < state.quakes.length; i++) {
      const qk = state.quakes[i];
      const fade = Math.max(0, 1 - qk.age / 3);
      const r = 2.5 + (qk.magnitude - 3) * 1.8;
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.7 * fade;
      sphere(ctx, toX(qk.x), toY(-qk.depth), r, theme.sci["energy-kinetic"], { glow: 0.9 });
      ctx.restore();
    }
  }

  /* --- plate motion ------------------------------------------------- */
  if (overlays.motion !== false && (params.speed as number) > 0) {
    const arrowY = 24;
    const len = 34 + (params.speed as number) * 3;
    const c = theme.sci["velocity"];
    if (setting.boundary === "convergent") {
      arrow(ctx, width * 0.2, arrowY, width * 0.2 + len, arrowY, c);
      arrow(ctx, width * 0.8, arrowY, width * 0.8 - len, arrowY, c);
    } else if (setting.boundary === "divergent") {
      arrow(ctx, width * 0.42, arrowY, width * 0.42 - len, arrowY, c);
      arrow(ctx, width * 0.58, arrowY, width * 0.58 + len, arrowY, c);
    } else {
      arrow(ctx, width * 0.3, arrowY, width * 0.3 + len, arrowY, c);
      arrow(ctx, width * 0.7, arrowY + 16, width * 0.7 - len, arrowY + 16, c);
    }
  }

  /* --- sea level and labels ------------------------------------------ */
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.7);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  ctx.lineTo(width, seaY);
  ctx.stroke();
  ctx.restore();

  if (band !== "K-2") {
    const top = maxElevation(state);
    caption(ctx, 10, height - 16, setting.label, theme, { size: 13 });
    caption(
      ctx, width - 10, height - 16,
      `${state.myr.toFixed(1)} Myr   ·   highest ${(top * 1000).toFixed(0)} m   ·   ${state.quakeCount} quakes`,
      theme, { align: "right", size: 11, color: theme.inkSoft, weight: 500 },
    );
    caption(ctx, 10, toY(-320) - 12, "mantle", theme, {
      size: 10, color: hexA(theme.surface, 0.75), weight: 600,
    });
    badge(ctx, width - 10, 24, `${(maxElevation(state) * 1000).toFixed(0)} m`, theme, {
      align: "right", color: theme.sci["distance"], sub: "highest ground",
    });
  }

  vignette(ctx, width, height, 0.2);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

import { q } from "@engine/units";

export const plateTectonicsSim: SimManifest<State> = {
  id: "earth.plate-tectonics",
  title: "Plate Tectonics",
  tagline: "Push two plates together, pull them apart, or slide them past each other, and see what the ground does.",
  subject: "earth",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9, 10, 11, 12],
  standards: {
    ngss: ["MS-ESS2-1", "MS-ESS2-2", "MS-ESS2-3", "HS-ESS2-1", "HS-ESS1-5"],
  },
  learningGoals: [
    "Predict the landforms produced by each type of plate boundary.",
    "Explain why oceanic crust subducts and continental crust does not.",
    "Connect earthquake depth and volcano position to the geometry of a sinking slab.",
  ],
  misconceptions: [
    "All mountains form the same way",
    "Earthquakes happen randomly all over the planet",
    "Continents float on top of the ocean floor",
    "Plates move fast enough to notice",
  ],
  interactionHint: "Pick a boundary type and two plate materials, then press play.",
  tickRate: 30,
  timeScale: 1,
  params: {
    boundary: {
      type: "option", label: "How the plates move",
      options: [
        { value: "convergent", label: "Towards each other" },
        { value: "divergent", label: "Apart" },
        { value: "transform", label: "Sliding past" },
      ],
      default: "convergent",
      help: "Changing this starts a fresh cross-section.",
    },
    leftPlate: {
      type: "option", label: "Left plate",
      options: [
        { value: "oceanic", label: "Oceanic" },
        { value: "continental", label: "Continental" },
      ],
      default: "oceanic",
      help: "Oceanic crust is thinner and denser, so it is the one that sinks.",
    },
    rightPlate: {
      type: "option", label: "Right plate",
      options: [
        { value: "oceanic", label: "Oceanic" },
        { value: "continental", label: "Continental" },
      ],
      default: "continental",
    },
    speed: {
      type: "number", label: "Plate speed (cm per year)", kind: "ratio",
      min: 0, max: 15, step: 0.5, default: 5,
      marks: [
        { value: 2, label: "Atlantic" },
        { value: 5, label: "India" },
        { value: 10, label: "Pacific" },
      ],
      help: "Real plates move a few centimetres a year — about as fast as fingernails grow.",
    },
  },
  overlays: [
    { key: "quakes", label: "Earthquakes", default: true },
    { key: "motion", label: "Plate motion arrows", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "where-plates-meet",
      title: "What happens where plates meet?",
      question: "Each kind of boundary makes a different landscape. Which one makes which?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-ESS2-1", "MS-ESS2-2"],
      setup: { boundary: "convergent", leftPlate: "oceanic", rightPlate: "continental", speed: 5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "An ocean plate is pushing into a continent. Commit to an answer.",
          predict: {
            prompt: "What forms where an oceanic plate meets a continental plate?",
            options: [
              "The continent slides underneath and a valley forms",
              "The ocean plate sinks, making a deep trench and a line of volcanoes",
              "They both crumple equally into one big mountain",
              "Nothing much happens",
            ],
            correct: 1,
            reveal:
              "Oceanic crust is denser, so it sinks. That makes a deep trench at the edge and a chain of volcanoes about 150 km inland, where the sinking slab starts to melt.",
          },
        },
        {
          id: "subduction",
          phase: "measure",
          title: "Run the subduction zone",
          instruction: "Play for about 20 million years. Record the deepest point and the highest ground.",
          requireData: 3,
          check: {
            describe: "At least 15 million years run",
            test: (v) => (v.facts.myr as number) >= 15,
          },
          hints: ["Watch where the earthquake dots go. They trace the sinking slab."],
        },
        {
          id: "divergent",
          phase: "measure",
          title: "Now pull them apart",
          instruction: "Set both plates to Oceanic and the motion to Apart. Run it and record.",
          check: {
            describe: "A spreading mid-ocean ridge",
            test: (v) => v.facts.spreading === true,
          },
          requireData: 6,
          hints: ["New seafloor is made at the middle. Notice it gets deeper as it gets older."],
        },
        {
          id: "transform",
          phase: "measure",
          title: "Now slide them past each other",
          instruction: "Set the motion to Sliding past and run it. Record what happens to the height.",
          check: {
            describe: "A transform fault",
            test: (v) => v.params.boundary === "transform",
          },
          requireData: 8,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the three rules",
          instruction: "One sentence per boundary type.",
          write: {
            prompt: "What does each of the three boundary types build or destroy?",
            placeholder: "Towards each other: ... Apart: ... Sliding past: ...",
          },
        },
      ],
    },
    {
      id: "biggest-mountains",
      title: "Why do the biggest mountains form where they do?",
      question: "Why is the Himalaya so much taller than the Andes?",
      bands: ["9-12"],
      minutes: 25,
      standards: ["HS-ESS2-1"],
      setup: { boundary: "convergent", leftPlate: "oceanic", rightPlate: "continental", speed: 5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Both are convergent boundaries at similar speeds.",
          predict: {
            prompt: "Why does a continent-continent collision build higher mountains than a subduction zone?",
            options: [
              "The plates move much faster there",
              "Neither plate can sink, so all the crust has to go upward",
              "Continental rock is lighter, so it floats higher on its own",
              "There are more volcanoes",
            ],
            correct: 1,
            reveal:
              "Neither continent is dense enough to subduct. The crust has nowhere to go but up and down — it thickens, and a thicker root floats higher, exactly like a bigger iceberg.",
          },
        },
        {
          id: "ocean-continent",
          phase: "measure",
          title: "Measure a subduction zone",
          instruction: "Run 30 million years of ocean-continent convergence. Record the highest ground.",
          check: {
            describe: "30 million years of ocean-continent convergence",
            test: (v) => (v.facts.myr as number) >= 30 && v.facts.subducting === true,
          },
          requireData: 2,
        },
        {
          id: "continent-continent",
          phase: "measure",
          title: "Now collide two continents",
          instruction: "Set both plates to Continental and run 30 million years again.",
          check: {
            describe: "30 million years of continental collision",
            test: (v) => (v.facts.myr as number) >= 30 && v.facts.collision === true,
          },
          requireData: 4,
          hints: ["Watch the crust thickness readout as well as the height."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Use crust thickness in your answer.",
          write: {
            prompt: "Why does thicker crust stand higher, and why can only a collision make it that thick?",
            placeholder: "Crust floats on the mantle, so ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "build-a-range",
      title: "Build a mountain range",
      brief: "Get the highest ground above 5,000 metres.",
      bands: ["6-8", "9-12"],
      setup: { boundary: "convergent", leftPlate: "oceanic", rightPlate: "oceanic", speed: 5 },
      goal: {
        describe: "Highest ground above 5,000 m",
        test: (v) => (v.facts.maxElevationM as number) >= 5000,
      },
      stars: {
        two: {
          describe: "Above 5,000 m within 40 million years",
          test: (v) => (v.facts.maxElevationM as number) >= 5000 && (v.facts.myr as number) <= 40,
        },
        three: {
          describe: "Above 6,000 m within 40 million years",
          test: (v) => (v.facts.maxElevationM as number) >= 6000 && (v.facts.myr as number) <= 40,
        },
      },
      hints: [
        "Volcanoes only get you so far. Thick crust gets you much further.",
        "Which pair of plates cannot get rid of each other?",
      ],
    },
    {
      id: "open-an-ocean",
      title: "Open a new ocean",
      brief: "Split a continent apart until seafloor spreading takes over.",
      bands: ["9-12"],
      setup: { boundary: "divergent", leftPlate: "continental", rightPlate: "continental", speed: 5 },
      goal: {
        describe: "The rift has become a spreading ridge",
        test: (v) => v.facts.rifted === true,
      },
      stars: {
        two: {
          describe: "Do it and then make 200 km of new seafloor",
          test: (v) => v.facts.rifted === true && (v.facts.minElevationM as number) <= -3000,
        },
      },
      hints: [
        "The crust has to thin to about 16 km before the sea can get in.",
        "Faster stretching thins it sooner.",
      ],
    },
  ],
};
