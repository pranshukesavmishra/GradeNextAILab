import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex } from "@ui/draw";
import {
  badge, caption, comet, glow, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Rock Cycle — Grades 6-12.
 *
 * The rock cycle is usually taught as a circle of arrows on a poster, which is
 * exactly the wrong shape: it hides the fact that the arrows are *places* with
 * temperatures and pressures a student can check. Here the cycle is a
 * cross-section of real crust, and the student carries one sample through it.
 *
 * Every transition has a real threshold behind it:
 *   · a continental geotherm of 25 °C per kilometre and a lithostatic gradient
 *     of 26.5 MPa per kilometre (ρ = 2700 kg/m³), so depth *is* temperature and
 *     pressure and the student can read all three off the same sample;
 *   · lithification once buried past ~1.5 km;
 *   · metamorphism from about 200 °C — the temperature at which shale really
 *     does become slate — up to the solidus;
 *   · melting at 700 °C for continental (felsic) rock and 1100 °C for basalt,
 *     which is why a subducting slab melts and a continent mostly does not;
 *   · crystal size set by cooling rate, so a granite and a rhyolite of exactly
 *     the same chemistry are told apart by their grains alone.
 *
 * And it names the two engines: sunlight drives everything at the surface,
 * Earth's internal heat drives everything below it.
 */

/* ------------------------------------------------------------------ *
 * Real rock data
 * ------------------------------------------------------------------ */

export type Material = "sediment" | "sedimentary" | "metamorphic" | "igneous" | "magma";

export interface RockFacts {
  name: string;
  material: Material;
  /** Mean grain or crystal size, mm. Zero means glassy — no grains at all. */
  grainMm: number;
  /** Bulk density, g/cm³, from standard rock property tables. */
  density: number;
  layered: boolean;
  foliated: boolean;
  crystalline: boolean;
  /** Fossils survive only in sedimentary rock; heat and melting erase them. */
  fossils: boolean;
  /** Felsic rock melts near 700 °C; mafic rock needs about 1100 °C. */
  felsic: boolean;
  /** What this rock breaks down into at the surface. */
  weathersTo: SedimentKind;
  note: string;
}

export type SedimentKind = "sand" | "mud" | "carbonate" | "gravel";

export const ROCKS: Record<string, RockFacts> = {
  granite: {
    name: "Granite", material: "igneous", grainMm: 5, density: 2.65,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Cooled slowly deep underground, so its crystals grew big enough to see.",
  },
  gabbro: {
    name: "Gabbro", material: "igneous", grainMm: 4, density: 3.0,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: false,
    weathersTo: "mud",
    note: "Granite's dark, dense twin: same slow cooling, ocean-floor chemistry.",
  },
  basalt: {
    name: "Basalt", material: "igneous", grainMm: 0.3, density: 3.0,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: false,
    weathersTo: "mud",
    note: "Lava chilled at the surface. Crystals too small to see without a lens.",
  },
  rhyolite: {
    name: "Rhyolite", material: "igneous", grainMm: 0.2, density: 2.5,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Granite's chemistry, erupted instead of buried, so the crystals stayed tiny.",
  },
  obsidian: {
    name: "Obsidian", material: "igneous", grainMm: 0, density: 2.4,
    layered: false, foliated: false, crystalline: false, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Quenched so fast that no crystals formed at all — volcanic glass.",
  },
  sandstone: {
    name: "Sandstone", material: "sedimentary", grainMm: 0.5, density: 2.3,
    layered: true, foliated: false, crystalline: false, fossils: true, felsic: true,
    weathersTo: "sand",
    note: "Sand grains cemented together. Rub it and grains come off in your hand.",
  },
  shale: {
    name: "Shale", material: "sedimentary", grainMm: 0.01, density: 2.4,
    layered: true, foliated: false, crystalline: false, fossils: true, felsic: true,
    weathersTo: "mud",
    note: "Mud squeezed flat. Splits into sheets along its bedding.",
  },
  limestone: {
    name: "Limestone", material: "sedimentary", grainMm: 0.1, density: 2.6,
    layered: true, foliated: false, crystalline: false, fossils: true, felsic: false,
    weathersTo: "carbonate",
    note: "Built from shells and coral. Fizzes in acid, and often full of fossils.",
  },
  conglomerate: {
    name: "Conglomerate", material: "sedimentary", grainMm: 8, density: 2.4,
    layered: true, foliated: false, crystalline: false, fossils: true, felsic: true,
    weathersTo: "gravel",
    note: "Rounded pebbles glued together — the rounding proves a river carried them.",
  },
  slate: {
    name: "Slate", material: "metamorphic", grainMm: 0.02, density: 2.75,
    layered: false, foliated: true, crystalline: true, fossils: false, felsic: true,
    weathersTo: "mud",
    note: "Shale at 200-400 °C. Its minerals lined up under pressure, so it splits flat.",
  },
  schist: {
    name: "Schist", material: "metamorphic", grainMm: 1.5, density: 2.7,
    layered: false, foliated: true, crystalline: true, fossils: false, felsic: true,
    weathersTo: "mud",
    note: "Hotter than slate: the flat minerals grew big enough to glitter.",
  },
  gneiss: {
    name: "Gneiss", material: "metamorphic", grainMm: 3, density: 2.7,
    layered: false, foliated: true, crystalline: true, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Near melting. Light and dark minerals separated into bands.",
  },
  marble: {
    name: "Marble", material: "metamorphic", grainMm: 2, density: 2.7,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: false,
    weathersTo: "carbonate",
    note: "Limestone recrystallized. The fossils are gone — the crystals grew through them.",
  },
  quartzite: {
    name: "Quartzite", material: "metamorphic", grainMm: 0.8, density: 2.65,
    layered: false, foliated: false, crystalline: true, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Sandstone welded shut. It breaks through the grains, not around them.",
  },
  amphibolite: {
    name: "Amphibolite", material: "metamorphic", grainMm: 1.2, density: 3.0,
    layered: false, foliated: true, crystalline: true, fossils: false, felsic: false,
    weathersTo: "mud",
    note: "Basalt cooked at depth. Dark, dense, and lined up under pressure.",
  },
  magma: {
    name: "Magma", material: "magma", grainMm: 0, density: 2.6,
    layered: false, foliated: false, crystalline: false, fossils: false, felsic: true,
    weathersTo: "sand",
    note: "Molten rock. Nothing about the old rock survives except its chemistry.",
  },
  sediment: {
    name: "Loose sediment", material: "sediment", grainMm: 0.5, density: 1.6,
    layered: true, foliated: false, crystalline: false, fossils: true, felsic: true,
    weathersTo: "sand",
    note: "Broken rock, not yet rock again. Pour it and it flows.",
  },
};

/** Metamorphic product of a rock, by grade. Real protolith relationships. */
function metamorphOf(key: string, tempC: number): string {
  const felsicSequence = tempC < 400 ? "slate" : tempC < 620 ? "schist" : "gneiss";
  switch (key) {
    case "limestone": case "marble": return "marble";
    case "sandstone": case "quartzite": return "quartzite";
    case "basalt": case "gabbro": case "amphibolite": return "amphibolite";
    case "shale": case "slate": case "schist": case "gneiss": return felsicSequence;
    // Granite has no flat minerals to start with, but at high grade it bands.
    case "granite": case "rhyolite": case "obsidian": return tempC < 500 ? "schist" : "gneiss";
    default: return felsicSequence;
  }
}

/** What a sediment lithifies into. */
function lithifyOf(kind: SedimentKind): string {
  switch (kind) {
    case "sand": return "sandstone";
    case "mud": return "shale";
    case "carbonate": return "limestone";
    case "gravel": return "conglomerate";
  }
}

/** Igneous rock from a melt, decided by how fast it cooled. */
function crystallizeOf(felsic: boolean, coolingKmDepth: number, quenched: boolean): string {
  if (quenched) return felsic ? "obsidian" : "basalt";
  if (coolingKmDepth >= 3) return felsic ? "granite" : "gabbro";
  return felsic ? "rhyolite" : "basalt";
}

/* ------------------------------------------------------------------ *
 * The crust as a place: stations with real depths
 * ------------------------------------------------------------------ */

export interface Station {
  key: string;
  label: string;
  /** Horizontal position across the cross-section, 0 (left) to 1 (right). */
  x: number;
  depthKm: number;
  /** Which engine does the work here. */
  energy: "Sun" | "Earth's internal heat";
  caption: string;
}

export const STATIONS: Record<string, Station> = {
  surface: {
    key: "surface", label: "Weathering & erosion", x: 0.12, depthKm: 0,
    energy: "Sun",
    caption: "Rain, frost and rivers break rock into sediment",
  },
  basin: {
    key: "basin", label: "Burial & cementing", x: 0.38, depthKm: 3,
    energy: "Sun",
    caption: "Sediment settles, is buried, and is glued into rock",
  },
  deep: {
    key: "deep", label: "Heat & pressure", x: 0.60, depthKm: 22,
    energy: "Earth's internal heat",
    caption: "Solid rock recrystallizes without ever melting",
  },
  melt: {
    key: "melt", label: "Melting", x: 0.80, depthKm: 48,
    energy: "Earth's internal heat",
    caption: "Past the solidus, the rock becomes magma",
  },
  pluton: {
    key: "pluton", label: "Slow cooling underground", x: 0.62, depthKm: 8,
    energy: "Earth's internal heat",
    caption: "Magma stalls and crystals grow large",
  },
  erupt: {
    key: "erupt", label: "Eruption & fast cooling", x: 0.26, depthKm: 0,
    energy: "Earth's internal heat",
    caption: "Lava chills in air or water — tiny crystals, or none",
  },
};

/** Continental geotherm: 25 °C per km below a 15 °C surface. */
export function temperatureAt(depthKm: number): number {
  return 15 + 25 * depthKm;
}

/** Lithostatic pressure: ρ g h with ρ = 2700 kg/m³, in megapascals. */
export function pressureAt(depthKm: number): number {
  return (2700 * 9.80665 * depthKm * 1000) / 1e6;
}

/** Melting point of the rock, °C. Felsic crust melts far cooler than basalt. */
export function solidusOf(felsic: boolean): number {
  return felsic ? 700 : 1100;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface HistoryEntry {
  process: string;
  rock: string;
  energy: string;
  myr: number;
}

interface State {
  rockKey: string;
  sedimentKind: SedimentKind;
  /** True while the melt remembers it came from continental crust. */
  meltFelsic: boolean;
  x: number;
  depthKm: number;
  myr: number;
  /** 0-1 progress of whatever process the current station runs. */
  progress: number;
  transitions: number;
  cycles: number;
  /** Every rock class visited since the last full lap, for cycle counting. */
  seen: string[];
  history: HistoryEntry[];
  /** Sparkles rising off the sample while it changes, purely for the eye. */
  spark: number;
  lastProcess: string;
  sunSteps: number;
  internalSteps: number;
  trail: { x: number; z: number }[];
}

const MAX_TRAIL = 260;

function stationOf(params: Record<string, number | boolean | string>): Station {
  return STATIONS[params.destination as string] ?? STATIONS.surface;
}

function rockOf(state: State): RockFacts {
  return ROCKS[state.rockKey] ?? ROCKS.granite;
}

function initial(params: Record<string, number | boolean | string>): State {
  const key = params.startRock as string;
  const rock = ROCKS[key] ?? ROCKS.granite;
  return {
    rockKey: key in ROCKS ? key : "granite",
    sedimentKind: rock.weathersTo,
    meltFelsic: rock.felsic,
    x: STATIONS.surface.x,
    depthKm: 0,
    myr: 0,
    progress: 0,
    transitions: 0,
    cycles: 0,
    seen: [rock.material],
    history: [],
    spark: 0,
    lastProcess: "resting at the surface",
    sunSteps: 0,
    internalSteps: 0,
    trail: [],
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return initial(params);
  },

  applyParams(state, params, prev) {
    // A new starting rock is a new experiment; a new destination is not.
    if (params.startRock !== prev.startRock) return initial(params);
    if (params.destination !== prev.destination) return { ...state, progress: 0 };
    return state;
  },

  step(state, dt, params, ctx) {
    if (dt <= 0) return state;
    const rate = params.rate as number;               // million years per second
    const myr = state.myr + rate * dt;
    const target = stationOf(params);
    const rock = rockOf(state);

    /* --- travel toward the station ------------------------------- */
    // 2 km per million years of vertical transport: fast for real tectonics,
    // slow enough that the student watches the journey rather than a jump cut.
    const travel = 2.2 * rate * dt;
    let depthKm = state.depthKm;
    const dz = target.depthKm - depthKm;
    depthKm += Math.sign(dz) * Math.min(Math.abs(dz), travel);
    const dx = target.x - state.x;
    const x = state.x + Math.sign(dx) * Math.min(Math.abs(dx), travel * 0.012);
    const arrived = Math.abs(target.depthKm - depthKm) < 0.35 && Math.abs(target.x - x) < 0.01;

    const tempC = temperatureAt(depthKm);

    /* --- run the station's process ------------------------------- */
    let rockKey = state.rockKey;
    let sedimentKind = state.sedimentKind;
    let meltFelsic = state.meltFelsic;
    let progress = state.progress;
    let transitions = state.transitions;
    let seen = state.seen;
    let history = state.history;
    let spark = Math.max(0, state.spark - dt * 1.6);
    let lastProcess = state.lastProcess;
    let sunSteps = state.sunSteps;
    let internalSteps = state.internalSteps;

    // Weathering is measurably faster on soft rock and in wet climates; this
    // multiplier is a teaching simplification, flagged as such.
    const durability = rock.material === "sediment" ? 0.4 : rock.grainMm > 2 ? 1.4 : 1;

    if (arrived) {
      if (target.energy === "Sun") sunSteps++; else internalSteps++;
      const solidus = solidusOf(rock.material === "magma" ? meltFelsic : rock.felsic);

      if (target.key === "surface" && rock.material !== "magma") {
        lastProcess = "weathering and erosion";
        if (rock.material === "sediment") {
          progress = 0;
        } else {
          progress += (dt * rate) / (3.5 * durability);
          if (progress >= 1) {
            sedimentKind = rock.weathersTo;
            rockKey = "sediment";
            progress = 0;
            transitions++;
            spark = 1;
          }
        }
      } else if (target.key === "basin") {
        if (rock.material !== "sediment") {
          lastProcess = "buried in the basin";
        } else {
          lastProcess = "compaction and cementing";
          progress += (dt * rate) / 4;
          if (progress >= 1 && depthKm >= 1.5 && tempC < 200) {
            rockKey = lithifyOf(sedimentKind);
            progress = 0;
            transitions++;
            spark = 1;
          }
        }
      } else if (target.key === "deep") {
        if (tempC >= 200 && tempC < solidus && rock.material !== "magma") {
          lastProcess = "metamorphism — solid-state recrystallizing";
          progress += (dt * rate) / 5;
          if (progress >= 1) {
            const next = metamorphOf(rockKey, tempC);
            if (next !== rockKey) { transitions++; spark = 1; }
            rockKey = next;
            progress = 0;
          }
        } else {
          lastProcess = "too cool to change";
        }
      } else if (target.key === "melt") {
        if (rock.material === "magma") {
          lastProcess = "molten";
          progress = 1;
        } else if (tempC >= solidus) {
          lastProcess = "melting";
          progress += (dt * rate) / 3;
          if (progress >= 1) {
            meltFelsic = rock.felsic;
            rockKey = "magma";
            progress = 0;
            transitions++;
            spark = 1;
          }
        } else {
          // Basalt at 48 km is still 100 °C short of its solidus: the honest
          // answer to "why doesn't the whole crust melt?".
          lastProcess = `still ${Math.round(solidus - tempC)} °C below melting`;
          progress = Math.min(0.95, tempC / solidus);
        }
      } else if (target.key === "pluton" || target.key === "erupt") {
        if (rock.material !== "magma") {
          lastProcess = target.key === "erupt" ? "carried up in the volcano" : "resting in the pluton";
        } else {
          const quenched = target.key === "erupt" && (params.quench as boolean);
          lastProcess = target.key === "pluton" ? "slow cooling — big crystals" : "fast cooling — tiny crystals";
          progress += (dt * rate) / (target.key === "pluton" ? 6 : 1.2);
          if (progress >= 1) {
            rockKey = crystallizeOf(meltFelsic, target.depthKm, quenched);
            progress = 0;
            transitions++;
            spark = 1;
          }
        }
      }
    } else {
      lastProcess = dz > 0 ? "being buried" : dz < 0 ? "being uplifted" : "travelling";
    }

    /* --- bookkeeping: history, laps ------------------------------- */
    if (rockKey !== state.rockKey) {
      const entry: HistoryEntry = {
        process: lastProcess,
        rock: (ROCKS[rockKey] ?? ROCKS.granite).name,
        energy: target.energy,
        myr,
      };
      history = [...state.history, entry].slice(-10);
      const cls = (ROCKS[rockKey] ?? ROCKS.granite).material;
      seen = seen.includes(cls) ? seen : [...seen, cls];
    }
    let cycles = state.cycles;
    if (seen.includes("igneous") && seen.includes("sedimentary") && seen.includes("metamorphic")) {
      cycles++;
      seen = [(ROCKS[rockKey] ?? ROCKS.granite).material];
    }

    // A little wander so the trail reads as a path, not a ruled line.
    const jitter = ctx.messiness > 0 ? ctx.rng.normal(0, 0.0007 * ctx.messiness) : 0;
    const trail = state.trail.length >= MAX_TRAIL ? state.trail.slice(1) : state.trail.slice();
    trail.push({ x: x + jitter, z: depthKm });

    return {
      rockKey, sedimentKind, meltFelsic,
      x, depthKm, myr, progress,
      transitions, cycles, seen, history,
      spark, lastProcess, sunSteps, internalSteps, trail,
    };
  },

  readouts(state, params) {
    const rock = rockOf(state);
    const station = stationOf(params);
    return [
      {
        key: "depth", label: "Depth", quantity: q(state.depthKm * 1000, "length"), unit: "km",
        semantic: "distance", graphable: true,
      },
      {
        key: "temperature", label: "Temperature",
        quantity: q(temperatureAt(state.depthKm) + 273.15, "temperature"), unit: "°C",
        semantic: "hot", graphable: true,
      },
      {
        // Megapascals are the unit every geology text uses for crustal
        // pressure; kilopascals would put six digits in front of a 7th grader.
        key: "pressure", label: "Pressure (MPa)",
        quantity: q(pressureAt(state.depthKm), "ratio"),
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "grain", label: "Grain size", quantity: q(rock.grainMm / 1000, "length"), unit: "mm",
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "density", label: "Density", quantity: q(rock.density * 1000, "density"), unit: "g/cm³",
        semantic: "mass", graphable: false, bands: ["9-12"],
      },
      {
        key: "changes", label: "Changes so far", quantity: q(state.transitions, "count"),
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "time", label: "Time in the cycle",
        quantity: q(state.myr * 1e6 * 31557600, "time"), unit: "yr",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "solidus", label: "This rock melts at",
        quantity: q(solidusOf(rock.material === "magma" ? state.meltFelsic : rock.felsic) + 273.15, "temperature"),
        unit: "°C", semantic: "energy-thermal", graphable: false, bands: ["9-12"],
      },
      {
        key: "stationDepth", label: "Station depth",
        quantity: q(station.depthKm * 1000, "length"), unit: "km",
        semantic: "distance", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const rock = rockOf(state);
    const station = stationOf(params);
    const tempC = temperatureAt(state.depthKm);
    return {
      rockKey: state.rockKey,
      rockName: rock.name,
      material: rock.material,
      isIgneous: rock.material === "igneous",
      isSedimentary: rock.material === "sedimentary",
      isMetamorphic: rock.material === "metamorphic",
      isMagma: rock.material === "magma",
      isSediment: rock.material === "sediment",
      depthKm: state.depthKm,
      tempC,
      pressureMPa: pressureAt(state.depthKm),
      solidusC: solidusOf(rock.material === "magma" ? state.meltFelsic : rock.felsic),
      grainMm: rock.grainMm,
      densityGCm3: rock.density,
      layered: rock.layered,
      foliated: rock.foliated,
      crystalline: rock.crystalline,
      fossils: rock.fossils,
      glassy: rock.material === "igneous" && rock.grainMm === 0,
      transitions: state.transitions,
      cycles: state.cycles,
      classesSeen: state.seen.length,
      station: station.key,
      stationLabel: station.label,
      process: state.lastProcess,
      energySource: station.energy,
      sunDriven: station.energy === "Sun",
      internalDriven: station.energy === "Earth's internal heat",
      sunSteps: state.sunSteps,
      internalSteps: state.internalSteps,
      myr: state.myr,
      progress: state.progress,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/** Colour for a rock class. Earth sims share this mapping. */
function classColor(m: Material, theme: RenderContext<State>["theme"]): string {
  switch (m) {
    case "magma": return theme.sci["hot"];
    case "igneous": return theme.sci["energy-thermal"];
    case "sedimentary": return theme.sci["decomposer"];
    case "metamorphic": return theme.sci["field"];
    case "sediment": return theme.sci["gas"];
  }
}

const DEEPEST_KM = 60;

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const rock = rockOf(state);
  const station = stationOf(params);
  const skyH = height * 0.20;
  const toY = (km: number) => skyH + (km / DEEPEST_KM) * (height - skyH);
  const toX = (f: number) => f * width;

  /* --- sky, sun, and the surface -------------------------------- */
  sky(ctx, width, skyH + 6, theme, "day", skyH);
  const sunX = width * 0.13;
  const sunY = skyH * 0.42;
  glow(ctx, sunX, sunY, skyH * 0.9, theme.sci["light"], 0.5);
  sphere(ctx, sunX, sunY, Math.max(9, skyH * 0.20), theme.sci["light"], { glow: 0.7 });

  /* --- the crust, as a graded column ---------------------------- */
  const crustTop = classColor("sedimentary", theme);
  const crustDeep = theme.sci["hot"];
  const g = ctx.createLinearGradient(0, skyH, 0, height);
  g.addColorStop(0, mixHex(crustTop, "#000000", 0.35));
  g.addColorStop(0.35, mixHex(theme.sci["mass"], "#000000", 0.25));
  g.addColorStop(1, mixHex(crustDeep, "#000000", 0.15));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, skyH, width, height - skyH);
  ctx.restore();

  /* --- the sea over the basin ----------------------------------- */
  const seaX0 = toX(0.31);
  const seaX1 = toX(0.50);
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = theme.sci["liquid"];
  ctx.beginPath();
  ctx.moveTo(seaX0, skyH);
  ctx.lineTo(seaX1, skyH);
  ctx.lineTo(seaX1, toY(1.6));
  ctx.lineTo(seaX0, toY(1.6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* --- the volcano ----------------------------------------------- */
  const volX = toX(STATIONS.erupt.x);
  ctx.save();
  ctx.fillStyle = mixHex(theme.sci["mass"], "#000000", 0.35);
  ctx.beginPath();
  ctx.moveTo(volX - width * 0.075, skyH);
  ctx.lineTo(volX, skyH - Math.min(52, skyH * 0.8));
  ctx.lineTo(volX + width * 0.075, skyH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (rock.material === "magma" && station.key === "erupt") {
    glow(ctx, volX, skyH - Math.min(52, skyH * 0.8), 34, theme.sci["hot"], 0.75);
  }

  /* --- the magma chamber ----------------------------------------- */
  const chamberX = toX(STATIONS.melt.x);
  const chamberY = toY(STATIONS.melt.depthKm);
  ctx.save();
  ctx.globalAlpha = 0.85;
  const cg = ctx.createRadialGradient(chamberX, chamberY, 4, chamberX, chamberY, width * 0.14);
  cg.addColorStop(0, theme.sci["hot"]);
  cg.addColorStop(1, hexA(theme.sci["hot"], 0));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(chamberX, chamberY, width * 0.13, (height - skyH) * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The pipe from the chamber to the volcano — the route magma actually takes.
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["hot"], 0.55);
  ctx.lineWidth = 5;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(chamberX, chamberY);
  ctx.quadraticCurveTo(toX(0.5), toY(14), volX, skyH - 6);
  ctx.stroke();
  ctx.restore();

  /* --- depth / temperature scale --------------------------------- */
  if (band !== "K-2") {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.3);
    ctx.lineWidth = 1;
    for (let km = 10; km <= DEEPEST_KM; km += 10) {
      const y = toY(km);
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      caption(ctx, 6, y - 8, `${km} km · ${Math.round(temperatureAt(km))} °C`, theme, {
        size: 10, color: theme.inkSoft,
      });
    }
    ctx.restore();
  }

  /* --- the stations ---------------------------------------------- */
  for (const s of Object.values(STATIONS)) {
    const sx = toX(s.x);
    const sy = toY(s.depthKm);
    const active = s.key === station.key;
    ctx.save();
    ctx.strokeStyle = active ? theme.accent : hexA(theme.inkSoft, 0.5);
    ctx.lineWidth = active ? 2.5 : 1.2;
    ctx.setLineDash(active ? [] : [3, 3]);
    ctx.beginPath();
    ctx.arc(sx, sy, active ? 30 : 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2" && (active || band === "9-12")) {
      caption(ctx, sx, sy + (s.depthKm > 40 ? -42 : 44), s.label, theme, {
        align: "center", size: active ? 12 : 10,
        color: active ? theme.ink : theme.inkSoft,
        weight: active ? 700 : 600,
      });
    }
  }

  /* --- the energy that drives it all ----------------------------- */
  if (overlays.energy !== false) {
    // Sunlight into the surface, internal heat out of the deep.
    for (let i = 0; i < 4; i++) {
      const x0 = sunX + 18 + i * 22;
      arrow(ctx, x0, sunY + 12, x0 + 10, skyH - 6, theme.sci["light"], { width: 1.6, head: 7 });
    }
    caption(ctx, sunX, skyH - 14, "Sun drives the surface", theme, {
      align: "center", size: 11, color: theme.sci["light"], weight: 700,
    });
    for (let i = 0; i < 5; i++) {
      const x0 = width * (0.48 + i * 0.11);
      arrow(ctx, x0, height - 6, x0, height - 44, theme.sci["hot"], { width: 1.8, head: 8 });
    }
    caption(ctx, width * 0.72, height - 52, "Earth's internal heat drives the deep", theme, {
      align: "center", size: 11, color: theme.sci["hot"], weight: 700,
    });
  }

  /* --- the sample's path ----------------------------------------- */
  if (overlays.path !== false && state.trail.length > 1) {
    comet(
      ctx,
      state.trail.map((p) => ({ x: toX(p.x), y: toY(p.z) })),
      theme.accent, 3,
    );
  }

  /* --- the sample ------------------------------------------------- */
  const px = toX(state.x);
  const py = toY(state.depthKm);
  const color = classColor(rock.material, theme);
  const r = band === "K-2" ? 20 : 15;
  if (rock.material === "magma" || state.spark > 0) {
    glow(ctx, px, py, r * (2.4 + state.spark), theme.sci["hot"], 0.5 + 0.3 * state.spark);
  }
  sphere(ctx, px, py, r, color, { glow: rock.material === "magma" ? 0.8 : 0.2 });

  // Texture on the sample itself: bedding lines, foliation, or crystal facets.
  ctx.save();
  ctx.strokeStyle = hexA("#ffffff", 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (rock.layered) {
    for (let i = -2; i <= 2; i++) {
      const y = py + i * (r / 3);
      const half = Math.sqrt(Math.max(0, r * r - (y - py) ** 2));
      ctx.moveTo(px - half, y);
      ctx.lineTo(px + half, y);
    }
  } else if (rock.foliated) {
    for (let i = -2; i <= 2; i++) {
      const off = i * (r / 3);
      ctx.moveTo(px - r * 0.8 + off, py + r * 0.8);
      ctx.lineTo(px + r * 0.8 + off, py - r * 0.8);
    }
  } else if (rock.crystalline) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * r * 0.85, py + Math.sin(a) * r * 0.85);
    }
  }
  ctx.stroke();
  ctx.restore();

  /* --- live numbers beside the sample ---------------------------- */
  if (band !== "K-2" && overlays.conditions !== false) {
    badge(ctx, px, py - r - 18, `${Math.round(temperatureAt(state.depthKm))} °C`, theme, {
      align: "center", color: theme.sci["hot"],
      sub: `${Math.round(pressureAt(state.depthKm))} MPa`,
    });
  }
  const mystery = params.mystery as boolean;
  caption(ctx, px, py + r + 18, mystery ? "Unknown sample" : rock.name, theme, {
    align: "center", size: 14, weight: 800,
    color: mystery ? theme.inkSoft : color,
  });

  /* --- the evidence card: what you could see with a hand lens ---- */
  if (overlays.evidence !== false && band !== "K-2") {
    const lines = [
      `grain size  ${rock.grainMm === 0 ? "none — glassy" : `${rock.grainMm} mm`}`,
      `layers      ${rock.layered ? "yes — flat beds" : "no"}`,
      `crystals    ${rock.crystalline ? (rock.foliated ? "yes, lined up" : "yes, interlocking") : "no"}`,
      `fossils     ${rock.fossils ? "possible" : "none survive"}`,
      `density     ${rock.density.toFixed(2)} g/cm³`,
    ];
    const cw = Math.min(238, width * 0.36);
    const chH = 18 * lines.length + 30;
    const cx = width - cw - 10;
    const cy = 10;
    ctx.save();
    ctx.globalAlpha = 0.92;
    material(ctx, cx, cy, cw, chH, theme.surfaceAlt, 8);
    ctx.restore();
    caption(ctx, cx + 10, cy + 15, "Evidence", theme, { size: 12, weight: 800 });
    ctx.save();
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.textBaseline = "middle";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx + 10, cy + 36 + i * 18);
    }
    ctx.restore();
  }

  /* --- what is happening right now -------------------------------- */
  if (band !== "K-2") {
    caption(ctx, 10, height - 14, `${state.lastProcess}  ·  ${station.caption}`, theme, {
      size: 12, color: theme.ink,
    });
    caption(
      ctx, width - 10, skyH - 8,
      `${state.myr.toFixed(1)} Myr · ${state.transitions} changes · ${state.cycles} full cycles`,
      theme, { align: "right", size: 11, color: theme.inkSoft },
    );
  }

  // A progress ring around the sample, so "how far through" is never a mystery.
  if (state.progress > 0.01) {
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(px, py, r + 7, -Math.PI / 2, -Math.PI / 2 + state.progress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const rockCycleSim: SimManifest<State> = {
  id: "earth.rock-cycle",
  title: "The Rock Cycle",
  tagline: "Take one rock down into the crust, melt it, cool it, break it up, and bury it again.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-ESS2-1", "MS-ESS2-2", "HS-ESS2-1"] },
  learningGoals: [
    "Name the process that turns each rock class into each other class.",
    "Identify a rock sample as igneous, sedimentary or metamorphic from its grains, layers and fossils.",
    "Explain why the same magma makes granite underground and rhyolite at the surface.",
    "Say which parts of the cycle the Sun powers and which parts Earth's internal heat powers.",
  ],
  misconceptions: [
    "The rock cycle always runs in one fixed order",
    "Rocks have to melt before they can become a different rock",
    "Metamorphic rock is melted rock",
    "Rocks never change once they have formed",
    "All the energy in the rock cycle comes from inside the Earth",
  ],
  interactionHint: "Pick a starting rock, then send it to a station and press play.",
  tickRate: 60,
  params: {
    startRock: {
      type: "option", label: "Starting sample",
      options: [
        { value: "granite", label: "Granite" },
        { value: "basalt", label: "Basalt" },
        { value: "sandstone", label: "Sandstone" },
        { value: "limestone", label: "Limestone" },
        { value: "shale", label: "Shale" },
        { value: "marble", label: "Marble" },
        { value: "slate", label: "Slate" },
        { value: "gneiss", label: "Gneiss" },
      ],
      default: "granite",
      help: "Changing this starts over with a fresh sample.",
    },
    destination: {
      type: "option", label: "Send the sample to",
      options: [
        { value: "surface", label: "The surface — weathering" },
        { value: "basin", label: "The basin — burial" },
        { value: "deep", label: "22 km down — heat & pressure" },
        { value: "melt", label: "48 km down — melting" },
        { value: "pluton", label: "A pluton — slow cooling" },
        { value: "erupt", label: "The volcano — fast cooling" },
      ],
      default: "surface",
    },
    rate: {
      type: "number", label: "Speed (million years per second)", kind: "ratio",
      min: 0.5, max: 20, step: 0.5, default: 4,
      help: "Real rock cycles take tens of millions of years. This is the fast-forward button.",
    },
    quench: {
      type: "boolean", label: "Erupt into water", default: false,
      bands: ["6-8", "9-12"],
      help: "Lava chilled in water has no time to grow crystals at all — it becomes glass.",
    },
    mystery: {
      type: "boolean", label: "Hide the rock's name", default: false,
      bands: ["6-8", "9-12"],
      help: "Turn this on and identify the sample from the evidence card alone.",
    },
  },
  overlays: [
    { key: "energy", label: "Energy sources", default: true },
    { key: "conditions", label: "Temperature & pressure", default: true, bands: ["6-8", "9-12"] },
    { key: "evidence", label: "Evidence card", default: true, bands: ["6-8", "9-12"] },
    { key: "path", label: "Path travelled", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "same-magma-two-rocks",
      title: "One magma, two very different rocks",
      question: "Granite and rhyolite have the same chemistry. Why do they look nothing alike?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-1"],
      setup: { startRock: "granite", destination: "melt", rate: 6, quench: false, mystery: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The same melt cools in two places. Commit to an answer before you run it.",
          predict: {
            prompt: "Magma cooling 8 km underground versus lava cooling in open air. What differs?",
            options: [
              "The underground one has much bigger crystals",
              "The surface one has much bigger crystals",
              "They come out identical — same magma, same rock",
              "The underground one has fossils in it",
            ],
            correct: 0,
            reveal:
              "Underground, the surrounding rock is a blanket: cooling takes thousands of years and crystals grow to millimetres. At the surface the heat escapes in days, so crystals stay microscopic. Same chemistry, different grain size — granite versus rhyolite.",
          },
        },
        {
          id: "melt",
          phase: "setup",
          title: "Melt the granite",
          instruction: "Send the sample to 48 km and run until it becomes magma.",
          check: { describe: "The sample is magma", test: (v) => v.facts.isMagma === true },
          hints: [
            "Watch the temperature readout climb as the sample sinks.",
            "Granite melts at about 700 °C, which the geotherm reaches near 27 km.",
          ],
        },
        {
          id: "pluton",
          phase: "measure",
          title: "Cool it slowly, underground",
          instruction: "Send the magma to the pluton. Record the grain size when it crystallizes.",
          requireData: 1,
          check: {
            describe: "The sample is granite again",
            test: (v) => v.facts.rockKey === "granite",
          },
        },
        {
          id: "erupt",
          phase: "measure",
          title: "Now melt it again and erupt it",
          instruction: "Back to 48 km, then to the volcano. Record the grain size again.",
          requireData: 2,
          check: {
            describe: "The sample cooled fast at the surface",
            test: (v) => v.facts.rockKey === "rhyolite" || v.facts.rockKey === "obsidian",
          },
          hints: ["Turn on 'Erupt into water' to remove even the last chance to crystallize."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Connect cooling rate to grain size in one sentence.",
          write: {
            prompt: "How can you tell from a rock alone whether it cooled underground or at the surface?",
            placeholder: "Big crystals mean ... because ...",
          },
        },
      ],
    },
    {
      id: "identify-the-unknown",
      title: "Identify the unknown sample",
      question: "Can you name a rock's class from evidence alone, without being told?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-1"],
      setup: { startRock: "limestone", destination: "surface", rate: 3, mystery: true, quench: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Read the evidence card",
          instruction: "The name is hidden. Layers, small grains, possible fossils, 2.6 g/cm³.",
          predict: {
            prompt: "Flat layers, no interlocking crystals, and fossils are possible. Which class is it?",
            options: ["Igneous", "Sedimentary", "Metamorphic"],
            correct: 1,
            reveal:
              "Fossils and flat beds mean the grains settled out of water and were cemented — that is a sedimentary rock. Heat would have destroyed the fossils and grown crystals instead.",
          },
        },
        {
          id: "cook-it",
          phase: "measure",
          title: "Cook it and watch the evidence change",
          instruction: "Send the sample to 22 km. Record the grain size before and after.",
          requireData: 2,
          check: {
            describe: "The sample has become metamorphic",
            test: (v) => v.facts.isMetamorphic === true,
          },
          hints: [
            "Metamorphism needs about 200 °C — that is roughly 8 km down.",
            "Watch the fossils line on the evidence card.",
          ],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "What changed, and what did not?",
          instruction: "Compare the two evidence cards you recorded.",
          write: {
            prompt: "Which pieces of evidence changed when the rock was heated, and which stayed?",
            placeholder: "The crystals ... the fossils ... the density ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write an identification key",
          instruction: "Three questions that would sort any sample into a class.",
          write: {
            prompt: "Write three yes/no questions that identify a rock's class.",
            placeholder: "1. Does it have flat layers or fossils? ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "full-lap",
      title: "Complete one full rock cycle",
      brief: "Take one sample through all three rock classes.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { startRock: "granite", destination: "surface", rate: 8 },
      goal: {
        describe: "The sample has been igneous, sedimentary and metamorphic",
        test: (v) => (v.facts.cycles as number) >= 1,
      },
      stars: {
        two: {
          describe: "Do it in under 120 million years",
          test: (v) => (v.facts.cycles as number) >= 1 && (v.facts.myr as number) <= 120,
        },
        three: {
          describe: "Do it in under 80 million years",
          test: (v) => (v.facts.cycles as number) >= 1 && (v.facts.myr as number) <= 80,
        },
      },
      hints: [
        "Weather it to sediment first — that is the fastest route into sedimentary rock.",
        "You never have to melt anything to reach metamorphic rock. Heat and pressure are enough.",
      ],
    },
    {
      id: "make-marble",
      title: "Make marble",
      brief: "Turn a sample into marble without ever melting it.",
      bands: ["6-8", "9-12"],
      setup: { startRock: "limestone", destination: "surface", rate: 6 },
      goal: {
        describe: "The sample is marble and has never been magma",
        test: (v) => v.facts.rockKey === "marble",
      },
      stars: {
        two: {
          describe: "Reach marble having made limestone yourself first",
          test: (v) => v.facts.rockKey === "marble" && (v.facts.transitions as number) >= 3,
        },
      },
      hints: [
        "Marble only ever comes from limestone. Which sediment makes limestone?",
        "Shells and coral make carbonate sediment. Where does sediment turn into rock?",
      ],
    },
  ],
};
