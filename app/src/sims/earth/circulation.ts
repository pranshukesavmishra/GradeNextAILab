import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, caption, comet, glow, hexA, sky, sphere, starfield, vignette,
} from "@ui/scene";

/**
 * Global Circulation — Grades 6-12.
 *
 * Three views of one machine: the atmosphere's convection cells, the Coriolis
 * effect that bends everything moving across a spinning planet, and the ocean
 * gyres that come out of the two together.
 *
 * The Coriolis view is the one that settles the argument. A parcel is launched
 * and integrated properly: the Coriolis acceleration turns its velocity vector
 * at the rate f = 2Ω sin φ without ever changing its speed, because a fictitious
 * force perpendicular to motion can do no work. Alongside it runs a second
 * parcel with the planet's rotation set to zero, which goes perfectly straight.
 * Two paths, one difference, and the difference is the rotation. Turn the
 * rotation slider back to Earth and the first parcel curves right in the
 * northern hemisphere and left in the southern, every time, and the size of the
 * bend is right: at 45° the inertial period is 2π/f = 16.9 hours and the
 * inertial circle for a 20 m/s parcel has a radius of 194 km.
 *
 * The ocean panel uses a fit to the UNESCO equation of state that is good to
 * about 0.2 kg/m³ from 0 to 30 °C, so a student who looks up the density of
 * 35-psu seawater at 25 °C will find the 1023.3 the sim shows.
 */

const DEG = Math.PI / 180;
/** Earth's rotation rate, rad/s. */
export const OMEGA = 7.2921e-5;
/** Earth's radius, m. */
const R_EARTH = CONSTANTS.earthRadius;

/* ------------------------------------------------------------------ *
 * Coriolis
 * ------------------------------------------------------------------ */

/** The Coriolis parameter f = 2Ω sin φ. Zero at the equator, sign flips across it. */
export function coriolisParameter(latitude: number, rotationScale = 1): number {
  return 2 * OMEGA * rotationScale * Math.sin(latitude);
}

/** Radius of the circle a freely moving parcel would trace, m. */
export function inertialRadius(speed: number, latitude: number, rotationScale = 1): number {
  const f = Math.abs(coriolisParameter(latitude, rotationScale));
  return f > 1e-12 ? speed / f : Infinity;
}

/** Time to go once round that circle, s. Twelve hours divided by sin φ. */
export function inertialPeriod(latitude: number, rotationScale = 1): number {
  const f = Math.abs(coriolisParameter(latitude, rotationScale));
  return f > 1e-12 ? (2 * Math.PI) / f : Infinity;
}

interface Parcel {
  lat: number;   // rad
  lon: number;   // rad
  vx: number;    // m/s eastward
  vy: number;    // m/s northward
}

/**
 * One step of a free parcel on a rotating sphere. The Coriolis acceleration is
 * perpendicular to the velocity, so it rotates the velocity vector and never
 * changes the speed — which is why a parcel curves instead of slowing.
 */
function advance(p: Parcel, dt: number, rotationScale: number): Parcel {
  const f = coriolisParameter(p.lat, rotationScale);
  const vx = p.vx + f * p.vy * dt;
  const vy = p.vy - f * p.vx * dt;
  const lat = p.lat + (vy * dt) / R_EARTH;
  const cosLat = Math.max(0.08, Math.cos(lat));
  const lon = p.lon + (vx * dt) / (R_EARTH * cosLat);
  return { lat, lon, vx, vy };
}

/**
 * How far the real parcel has ended up to the right of where it would have
 * been with no rotation, in metres. Right is measured from the launch bearing,
 * so the sign is positive for a northern-hemisphere deflection either way round.
 */
export function rightwardOffset(real: Parcel, ghost: Parcel, bearing: number): number {
  const east = R_EARTH * Math.cos(ghost.lat) * (real.lon - ghost.lon);
  const north = R_EARTH * (real.lat - ghost.lat);
  return east * Math.cos(bearing) - north * Math.sin(bearing);
}

/* ------------------------------------------------------------------ *
 * Cells and wind belts
 * ------------------------------------------------------------------ */

export interface Cell {
  name: string;
  /** Latitude range in degrees, in the northern hemisphere. */
  from: number;
  to: number;
  /** Where air goes up and where it comes down, degrees. */
  risesAt: number;
  sinksAt: number;
  note: string;
}

export const CELLS: Cell[] = [
  {
    name: "Hadley", from: 0, to: 30, risesAt: 0, sinksAt: 30,
    note: "Driven directly by the Sun: hottest air rises at the equator.",
  },
  {
    name: "Ferrel", from: 30, to: 60, risesAt: 60, sinksAt: 30,
    note: "Turned by the two cells either side of it, so it runs backwards.",
  },
  {
    name: "Polar", from: 60, to: 90, risesAt: 60, sinksAt: 90,
    note: "Cold dense air sinks at the pole and creeps outward along the ground.",
  },
];

export interface WindBelt {
  name: string;
  from: number;
  to: number;
  /** Direction the surface wind comes from, degrees, in the north. */
  fromDeg: number;
}

export const BELTS: WindBelt[] = [
  { name: "Northeast trades", from: 0, to: 30, fromDeg: 45 },
  { name: "Westerlies", from: 30, to: 60, fromDeg: 225 },
  { name: "Polar easterlies", from: 60, to: 90, fromDeg: 45 },
];

/** Which cell a latitude sits in. */
export function cellAt(latitudeDeg: number): Cell {
  const a = Math.abs(latitudeDeg);
  return CELLS.find((c) => a < c.to) ?? CELLS[CELLS.length - 1];
}

/** The prevailing surface wind at a latitude, named as a forecaster would. */
export function beltAt(latitudeDeg: number): WindBelt {
  const a = Math.abs(latitudeDeg);
  const belt = BELTS.find((b) => a < b.to) ?? BELTS[BELTS.length - 1];
  if (latitudeDeg >= 0) return belt;
  // In the south the deflection is the other way, so the trades come from the
  // south-east and the polar easterlies from the south-east too.
  const mirrored = belt.fromDeg === 45 ? 135 : 315;
  const name = belt.name.replace("Northeast", "Southeast");
  return { ...belt, name, fromDeg: mirrored };
}

/** Rising branches make rain belts; sinking branches make deserts. */
export function surfaceClimate(latitudeDeg: number): string {
  const a = Math.abs(latitudeDeg);
  if (a < 8) return "Rain belt — the ITCZ, where rainforests are";
  if (a < 22) return "Trade wind zone, drying as you go poleward";
  if (a < 38) return "Subtropical high — sinking air, and most of the world's deserts";
  if (a < 68) return "Westerly storm track — depressions and fronts";
  return "Polar high — cold, dry, sinking air";
}

/* ------------------------------------------------------------------ *
 * Ocean
 * ------------------------------------------------------------------ */

/**
 * Density of seawater at the surface, kg/m³.
 *
 * A polynomial fit to the UNESCO equation of state, good to about 0.2 kg/m³
 * for 0-30 °C and 30-40 psu, which is all a Grade 6 student needs and is
 * accurate enough that the numbers match an oceanography table.
 */
export function seawaterDensity(tempC: number, salinityPsu: number): number {
  return 1000 + 0.805 * salinityPsu - 0.0708 * tempC - 0.0049 * tempC * tempC;
}

/** Density of the deep water that fills most of the world ocean, kg/m³. */
export const DEEP_WATER_DENSITY = seawaterDensity(2, 34.9);

export interface Current {
  name: string;
  warm: boolean;
  speedMs: number;
  /** Schematic basin coordinates: x is a longitude-like axis, y is latitude. */
  path: [number, number][];
}

/**
 * A schematic ocean basin rather than a real map, so the pattern is not lost in
 * the coastline. The current names and speeds are real, and the structure —
 * fast narrow warm currents on the western side, slow broad cold ones on the
 * eastern side — is the real structure of every ocean gyre on the planet.
 */
export const CURRENTS: Current[] = [
  { name: "North Equatorial", warm: true, speedMs: 0.30, path: [[62, 10], [40, 11], [20, 13]] },
  { name: "Gulf Stream / Kuroshio", warm: true, speedMs: 2.0, path: [[20, 13], [14, 26], [20, 42]] },
  { name: "North Atlantic / Pacific Drift", warm: true, speedMs: 0.30, path: [[20, 42], [42, 46], [60, 42]] },
  { name: "California / Canary Current", warm: false, speedMs: 0.15, path: [[60, 42], [64, 26], [62, 10]] },
  { name: "South Equatorial", warm: true, speedMs: 0.30, path: [[62, -10], [40, -11], [20, -13]] },
  { name: "Brazil / East Australian", warm: true, speedMs: 1.0, path: [[20, -13], [14, -26], [20, -42]] },
  { name: "Antarctic Circumpolar", warm: false, speedMs: 0.15, path: [[20, -42], [42, -46], [60, -42]] },
  { name: "Humboldt / Benguela", warm: false, speedMs: 0.20, path: [[60, -42], [64, -26], [62, -10]] },
];

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** Simulated seconds since the launch. */
  t: number;
  real: Parcel;
  ghost: Parcel;
  path: { lat: number; lon: number }[];
  ghostPath: { lat: number; lon: number }[];
  deflectionM: number;
  maxDeflectionM: number;
  launches: number;
  /** Phase used to animate the circulating cells and currents. */
  flow: number;
}

type Params = Record<string, number | boolean | string>;

const MAX_PATH = 420;

function launchParcel(params: Params): Parcel {
  const lat = params.launchLatitude as number;
  const bearing = params.launchBearing as number;
  const speed = params.launchSpeed as number;
  return {
    lat, lon: 0,
    vx: speed * Math.sin(bearing),
    vy: speed * Math.cos(bearing),
  };
}

function freshState(params: Params, launches: number, flow: number): State {
  const p = launchParcel(params);
  return {
    t: 0, real: p, ghost: { ...p },
    path: [{ lat: p.lat, lon: p.lon }],
    ghostPath: [{ lat: p.lat, lon: p.lon }],
    deflectionM: 0, maxDeflectionM: 0,
    launches, flow,
  };
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params, 0, 0);
  },

  applyParams(state, params, prev) {
    if (
      params.launchLatitude !== prev.launchLatitude ||
      params.launchBearing !== prev.launchBearing ||
      params.launchSpeed !== prev.launchSpeed ||
      params.rotation !== prev.rotation
    ) {
      return freshState(params, state.launches, state.flow);
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown" || (input.type === "action" && input.action === "launch")) {
        s = freshState(params, s.launches + 1, s.flow);
      }
    }
    if (dt <= 0) return s;

    // One real second stands for one simulated hour, which is the timescale
    // Coriolis works on: the inertial period at 45° is 16.9 hours.
    const simDt = dt * (params.speed as number) * 3600;
    const rotation = params.rotation as number;
    const bearing = params.launchBearing as number;

    let real = s.real;
    let ghost = s.ghost;
    // A few substeps keep the turning accurate even at high playback speed.
    const sub = 6;
    for (let i = 0; i < sub; i++) {
      real = advance(real, simDt / sub, rotation);
      ghost = advance(ghost, simDt / sub, 0);
    }

    // Relaunch once the parcel has run out of map or gone over a pole.
    const done = Math.abs(real.lat) > 82 * DEG || Math.abs(ghost.lat) > 82 * DEG ||
      Math.abs(real.lon) > 150 * DEG || s.t > 260_000;
    if (done) return freshState(params, s.launches + 1, s.flow + dt);

    const path = s.path.length >= MAX_PATH ? s.path.slice(1) : s.path.slice();
    path.push({ lat: real.lat, lon: real.lon });
    const ghostPath = s.ghostPath.length >= MAX_PATH ? s.ghostPath.slice(1) : s.ghostPath.slice();
    ghostPath.push({ lat: ghost.lat, lon: ghost.lon });

    const deflectionM = rightwardOffset(real, ghost, bearing);

    return {
      t: s.t + simDt,
      real, ghost, path, ghostPath,
      deflectionM,
      maxDeflectionM: Math.abs(deflectionM) > Math.abs(s.maxDeflectionM) ? deflectionM : s.maxDeflectionM,
      launches: s.launches,
      flow: s.flow + dt,
    };
  },

  readouts(state, params) {
    const lat = params.launchLatitude as number;
    const rotation = params.rotation as number;
    const speed = params.launchSpeed as number;
    const nowLat = state.real.lat;
    return [
      {
        key: "deflection", label: "Deflection to the right",
        quantity: q(state.deflectionM, "length"), unit: "km",
        semantic: "acceleration", graphable: true,
      },
      {
        key: "latitude", label: "Parcel latitude", quantity: q(nowLat, "angle"), unit: "°",
        semantic: "distance", graphable: true,
      },
      {
        key: "coriolis", label: "Coriolis parameter f (×10⁻⁴ s⁻¹)",
        quantity: q(coriolisParameter(nowLat, rotation) * 1e4, "ratio"),
        semantic: "field", graphable: true, bands: ["9-12"],
      },
      {
        key: "inertialRadius", label: "Inertial circle radius",
        quantity: q(Math.min(4e7, inertialRadius(speed, lat, rotation)), "length"), unit: "km",
        semantic: "distance", graphable: false, bands: ["9-12"],
      },
      {
        key: "inertialPeriod", label: "Inertial period",
        quantity: q(Math.min(1e7, inertialPeriod(lat, rotation)), "time"), unit: "h",
        semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "density", label: "Seawater density",
        quantity: q(seawaterDensity(params.waterTemp as number, params.salinity as number), "density"),
        unit: "kg/m³", semantic: "mass", graphable: true,
      },
      {
        key: "elapsed", label: "Time since launch", quantity: q(state.t, "time"), unit: "h",
        semantic: "time", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const lat = params.launchLatitude as number;
    const rotation = params.rotation as number;
    const speed = params.launchSpeed as number;
    const temp = params.waterTemp as number;
    const salt = params.salinity as number;
    const density = seawaterDensity(temp, salt);
    return {
      view: params.view as string,
      rotationScale: rotation,
      rotationOff: rotation === 0,
      launchLatitudeDeg: lat / DEG,
      parcelLatitudeDeg: state.real.lat / DEG,
      coriolisParameter: coriolisParameter(lat, rotation),
      coriolisAt45: coriolisParameter(45 * DEG, 1),
      deflectionKm: state.deflectionM / 1000,
      maxDeflectionKm: state.maxDeflectionM / 1000,
      deflectsRight: state.deflectionM > 0,
      // Where f ~ 0 (equator, or rotation off) there is no inertial circle at
      // all — the parcel runs straight. The boolean carries that physics; the
      // numbers are clamped to the same caps the readouts use so they stay
      // finite for display and lab checks.
      inertialCircleExists: Number.isFinite(inertialRadius(speed, lat, rotation)),
      inertialRadiusKm: Math.min(4e7, inertialRadius(speed, lat, rotation)) / 1000,
      inertialPeriodHours: Math.min(1e7, inertialPeriod(lat, rotation)) / 3600,
      speedKept: Math.hypot(state.real.vx, state.real.vy),
      launchSpeed: speed,
      elapsedHours: state.t / 3600,
      launches: state.launches,
      cell: cellAt(lat / DEG).name,
      risesAtDeg: cellAt(lat / DEG).risesAt,
      sinksAtDeg: cellAt(lat / DEG).sinksAt,
      prevailingWind: beltAt(lat / DEG).name,
      windFromDeg: beltAt(lat / DEG).fromDeg,
      surfaceClimate: surfaceClimate(lat / DEG),
      waterTempC: temp,
      salinityPsu: salt,
      seawaterDensity: density,
      deepWaterDensity: DEEP_WATER_DENSITY,
      sinks: density >= DEEP_WATER_DENSITY,
      westernBoundarySpeed: CURRENTS[1].speedMs,
      easternBoundarySpeed: CURRENTS[3].speedMs,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View — shared map frame
 * ------------------------------------------------------------------ */

interface MapFrame {
  x: number; y: number; w: number; h: number;
  toX: (lonDeg: number) => number;
  toY: (latDeg: number) => number;
}

function mapFrame(x: number, y: number, w: number, h: number, lon0 = -70, lon1 = 130): MapFrame {
  return {
    x, y, w, h,
    toX: (lon) => x + ((lon - lon0) / (lon1 - lon0)) * w,
    toY: (lat) => y + ((85 - lat) / 170) * h,
  };
}

function drawGraticule(rc: RenderContext<State>, F: MapFrame) {
  const { ctx, theme } = rc;
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const yy = F.toY(lat);
    ctx.beginPath();
    ctx.moveTo(F.x, yy);
    ctx.lineTo(F.x + F.w, yy);
    ctx.stroke();
  }
  for (let lon = -60; lon <= 120; lon += 30) {
    const xx = F.toX(lon);
    ctx.beginPath();
    ctx.moveTo(xx, F.y);
    ctx.lineTo(xx, F.y + F.h);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["hot"], 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(F.x, F.toY(0));
  ctx.lineTo(F.x + F.w, F.toY(0));
  ctx.stroke();
  ctx.restore();
  caption(rc.ctx, F.x + 6, F.toY(0) - 8, "equator", theme, { size: 10, color: theme.sci["hot"] });

  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const lat of [-60, -30, 30, 60]) {
    ctx.fillText(`${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`, F.x + 4, F.toY(lat) - 7);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * View — the Coriolis comparison
 * ------------------------------------------------------------------ */

function drawCoriolis(rc: RenderContext<State>, F: MapFrame) {
  const { ctx, state, params, theme, band } = rc;
  const rotation = params.rotation as number;

  ctx.save();
  const g = ctx.createLinearGradient(0, F.y, 0, F.y + F.h);
  g.addColorStop(0, hexA(theme.sci["cold"], 0.35));
  g.addColorStop(0.5, hexA(theme.sci["liquid"], 0.35));
  g.addColorStop(1, hexA(theme.sci["cold"], 0.35));
  ctx.fillStyle = g;
  ctx.fillRect(F.x, F.y, F.w, F.h);
  ctx.restore();
  drawGraticule(rc, F);

  /* --- which way the planet is turning ------------------------------ */
  const spinY = F.y + 16;
  if (rotation > 0) {
    const sx = F.x + F.w * 0.5 + Math.sin(rc.time * 0.7) * 12;
    arrow(ctx, sx - 40, spinY, sx + 40, spinY, hexA(theme.sci["velocity"], 0.8), { width: 2.4 });
    caption(ctx, F.x + F.w * 0.5, spinY - 12,
      `Earth spinning ×${rotation.toFixed(1)} — one turn a day`, theme,
      { align: "center", size: 10, color: theme.sci["velocity"] });
  } else {
    caption(ctx, F.x + F.w * 0.5, spinY, "Rotation OFF", theme, {
      align: "center", size: 13, color: theme.sci["cold"], weight: 800,
    });
  }

  /* --- the two paths ------------------------------------------------ */
  const toPt = (p: { lat: number; lon: number }) => ({
    x: F.toX(p.lon / DEG), y: F.toY(p.lat / DEG),
  });

  if (state.ghostPath.length > 1) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.85);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    state.ghostPath.forEach((p, i) => {
      const q2 = toPt(p);
      if (i === 0) ctx.moveTo(q2.x, q2.y); else ctx.lineTo(q2.x, q2.y);
    });
    ctx.stroke();
    ctx.restore();
  }
  if (state.path.length > 1) {
    comet(ctx, state.path.map(toPt), theme.accent, 4);
  }

  const gp = toPt(state.ghost);
  sphere(ctx, gp.x, gp.y, 6, theme.inkSoft, { rim: true });
  const rp = toPt(state.real);
  glow(ctx, rp.x, rp.y, 22, theme.accent, 0.6);
  sphere(ctx, rp.x, rp.y, 8, theme.accent, { glow: 0.5 });

  // The gap between them, drawn as a measured distance.
  if (Math.abs(state.deflectionM) > 20_000) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["acceleration"], 0.9);
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(gp.x, gp.y);
    ctx.lineTo(rp.x, rp.y);
    ctx.stroke();
    ctx.restore();
    if (band !== "3-5") {
      badge(ctx, (gp.x + rp.x) / 2, (gp.y + rp.y) / 2 - 16,
        `${Math.abs(state.deflectionM / 1000).toFixed(0)} km`, rc.theme,
        { align: "center", color: theme.sci["acceleration"],
          sub: state.deflectionM > 0 ? "to the right" : "to the left" });
    }
  }

  caption(ctx, F.x + 8, F.y + F.h - 26, "dashed: the same launch with no rotation", theme, {
    size: 10, color: theme.inkSoft,
  });
  caption(ctx, F.x + 8, F.y + F.h - 12,
    rotation === 0
      ? "No rotation, so no deflection — the parcel goes perfectly straight."
      : `Northern hemisphere: bends right. Southern: bends left. f = 2Ω sin φ.`,
    theme, { size: 10, color: theme.accent });
}

/* ------------------------------------------------------------------ *
 * View — the three-cell atmosphere
 * ------------------------------------------------------------------ */

function drawCells(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, band, state, params } = rc;
  const groundY = y + h * 0.82;
  const topY = y + h * 0.16;
  const toX = (latDeg: number) => x + ((latDeg + 90) / 180) * w;
  const selected = (params.launchLatitude as number) / DEG;

  sky(ctx, x + w, y + h, theme, "day", groundY);

  /* --- sunlight along the top: the reason any of it happens --------- */
  for (let latDeg = -85; latDeg <= 85; latDeg += 10) {
    const strength = Math.max(0, Math.cos(latDeg * DEG));
    const px = toX(latDeg);
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["light"], 0.25 + 0.6 * strength);
    ctx.lineWidth = 1 + 3 * strength;
    ctx.beginPath();
    ctx.moveTo(px, y + 4);
    ctx.lineTo(px, topY - 6);
    ctx.stroke();
    ctx.restore();
  }
  caption(ctx, x + w / 2, y + 12, "sunlight: strongest at the equator, weakest at the poles", theme, {
    align: "center", size: 10, color: theme.sci["light"],
  });

  /* --- the six cells ------------------------------------------------ */
  const drawCell = (from: number, to: number, risesAt: number, sinksAt: number, name: string) => {
    const x0 = toX(Math.min(from, to));
    const x1 = toX(Math.max(from, to));
    const cx = (x0 + x1) / 2;
    const ry = (groundY - topY) / 2;
    const cy = (groundY + topY) / 2;
    const rx = (x1 - x0) / 2;
    // Increasing the ellipse angle carries a parcel up the left-hand side, so
    // the sense is positive whenever the rising branch is the left-hand edge.
    const sense = toX(risesAt) < toX(sinksAt) ? 1 : -1;

    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["velocity"], 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.86, ry * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Parcels going round, so the cell is a circulation and not an oval.
    for (let i = 0; i < 5; i++) {
      const a = ((state.flow * 0.5 + i / 5) % 1) * Math.PI * 2 * sense;
      const px = cx + Math.cos(a) * rx * 0.86;
      const py = cy + Math.sin(a) * ry * 0.8;
      sphere(ctx, px, py, 3.4, theme.sci["gas"], { rim: false });
    }
    if (band !== "3-5") {
      caption(ctx, cx, cy, name, theme, {
        align: "center", size: 10, color: theme.inkSoft, weight: 700,
      });
    }
  };

  for (const c of CELLS) {
    drawCell(c.from, c.to, c.risesAt, c.sinksAt, c.name);
    drawCell(-c.from, -c.to, -c.risesAt, -c.sinksAt, c.name);
  }

  /* --- rising and sinking branches, named where they matter --------- */
  const branch = (latDeg: number, up: boolean, text: string, color: string) => {
    const px = toX(latDeg);
    if (up) arrow(ctx, px, groundY - 4, px, topY + 6, color, { width: 3 });
    else arrow(ctx, px, topY + 6, px, groundY - 4, color, { width: 3 });
    if (band !== "3-5") {
      caption(ctx, px, up ? topY - 8 : groundY + 14, text, theme, {
        align: "center", size: 9, color,
      });
    }
  };
  branch(0, true, "ITCZ · rainforest", theme.sci["liquid"]);
  branch(30, false, "desert belt", theme.sci["hot"]);
  branch(-30, false, "desert belt", theme.sci["hot"]);
  branch(60, true, "storm track", theme.sci["liquid"]);
  branch(-60, true, "storm track", theme.sci["liquid"]);

  /* --- the ground, and the prevailing wind belts on it -------------- */
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["solid"], 0.85);
  ctx.fillRect(x, groundY, w, y + h - groundY);
  ctx.restore();

  for (const b of BELTS) {
    for (const sign of [1, -1]) {
      const belt = beltAt(sign * (b.from + b.to) / 2);
      const cx = toX((sign * (b.from + b.to)) / 2);
      // A surface wind arrow pointing the way the air actually travels.
      const eastward = belt.fromDeg > 180 ? 1 : -1;
      arrow(ctx, cx - eastward * 26, groundY + 14, cx + eastward * 26, groundY + 14,
        theme.sci["velocity"], { width: 2.2 });
      if (band === "9-12") {
        caption(ctx, cx, groundY + 30, belt.name, theme, {
          align: "center", size: 8, color: theme.inkSoft,
        });
      }
    }
  }

  /* --- the latitude the student has selected ------------------------ */
  const sx = toX(selected);
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(sx, topY - 10);
  ctx.lineTo(sx, y + h);
  ctx.stroke();
  ctx.restore();
  if (band !== "3-5") {
    badge(ctx, sx, topY - 22, `${selected.toFixed(0)}°`, rc.theme, {
      align: "center", color: theme.accent, sub: cellAt(selected).name + " cell",
    });
    caption(ctx, x + 8, y + h - 8, surfaceClimate(selected), theme, {
      size: 10, color: theme.accent,
    });
  }

  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  for (const latDeg of [-90, -60, -30, 0, 30, 60, 90]) {
    ctx.fillText(`${latDeg}°`, toX(latDeg), y + h - 2);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * View — ocean gyres and density
 * ------------------------------------------------------------------ */

function drawOcean(rc: RenderContext<State>, F: MapFrame) {
  const { ctx, theme, state, band } = rc;

  ctx.save();
  ctx.fillStyle = hexA(theme.sci["liquid"], 0.35);
  ctx.fillRect(F.x, F.y, F.w, F.h);
  ctx.restore();
  drawGraticule(rc, F);

  // Continents either side of the basin, so "western boundary" means something.
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["solid"], 0.85);
  ctx.fillRect(F.toX(-70), F.y, F.toX(8) - F.toX(-70), F.h);
  ctx.fillRect(F.toX(70), F.y, F.toX(130) - F.toX(70), F.h);
  ctx.restore();
  caption(ctx, F.toX(-30), F.y + 16, "land", theme, { align: "center", size: 10, color: theme.inkSoft });
  caption(ctx, F.toX(100), F.y + 16, "land", theme, { align: "center", size: 10, color: theme.inkSoft });

  for (const c of CURRENTS) {
    const color = c.warm ? theme.sci["hot"] : theme.sci["cold"];
    const pts = c.path.map(([lon, lat]) => ({ x: F.toX(lon), y: F.toY(lat) }));
    ctx.save();
    ctx.strokeStyle = hexA(color, 0.85);
    ctx.lineWidth = 1.5 + Math.min(6, c.speedMs * 2.6);
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
    ctx.restore();

    // Drifters moving at a speed proportional to the real current speed.
    for (let i = 0; i < 3; i++) {
      const f = ((state.flow * 0.12 * (0.4 + c.speedMs) + i / 3) % 1) * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(f));
      const frac = f - k;
      const px = pts[k].x + (pts[k + 1].x - pts[k].x) * frac;
      const py = pts[k].y + (pts[k + 1].y - pts[k].y) * frac;
      sphere(ctx, px, py, 4, color, { rim: false });
    }
    if (band !== "3-5") {
      const mid = pts[Math.floor(pts.length / 2)];
      caption(ctx, mid.x, mid.y - 10, `${c.name} ${c.speedMs} m/s`, theme, {
        align: "center", size: 8, color: theme.inkSoft,
      });
    }
  }

  caption(ctx, F.x + F.w / 2, F.y + F.h - 26,
    "Every gyre turns clockwise north of the equator and anticlockwise south of it", theme,
    { align: "center", size: 10, color: theme.accent });
  caption(ctx, F.x + F.w / 2, F.y + F.h - 12,
    `Western currents run ${(CURRENTS[1].speedMs / CURRENTS[3].speedMs).toFixed(0)}× faster than eastern ones`,
    theme, { align: "center", size: 10, color: theme.inkSoft });
}

/** Density from temperature and salinity — the driver of the deep circulation. */
function drawDensity(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params, band } = rc;
  const temp = params.waterTemp as number;
  const salt = params.salinity as number;
  const density = seawaterDensity(temp, salt);

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.9);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 8, y + 12, "Temperature, salt and density", theme, { size: 10, weight: 700 });

  // A T-S diagram with density contours: the standard oceanographer's plot.
  const padL = 30, padB = 20, padT = 22, padR = 10;
  const pw = w - padL - padR, ph = h - padT - padB;
  const tx = (t: number) => x + padL + ((t + 2) / 32) * pw;
  const sy = (s: number) => y + padT + ph - ((s - 30) / 10) * ph;

  for (let d = 1020; d <= 1032; d += 2) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["mass"], 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let t = -2; t <= 30; t += 1) {
      // Invert the fit for salinity at this density.
      const s = (d - 1000 + 0.0708 * t + 0.0049 * t * t) / 0.805;
      if (s < 30 || s > 40) continue;
      ctx.lineTo(tx(t), sy(s));
    }
    ctx.stroke();
    ctx.restore();
  }

  const px = tx(temp), py = sy(salt);
  const sinks = density >= DEEP_WATER_DENSITY;
  glow(ctx, px, py, 18, sinks ? theme.sci["cold"] : theme.sci["hot"], 0.5);
  sphere(ctx, px, py, 7, sinks ? theme.sci["cold"] : theme.sci["hot"], { glow: 0.4 });

  ctx.save();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("−2 °C", tx(-2) + 8, y + h - 6);
  ctx.fillText("30 °C", tx(30) - 8, y + h - 6);
  ctx.textAlign = "right";
  ctx.fillText("40", x + padL - 3, sy(40) + 4);
  ctx.fillText("30", x + padL - 3, sy(30));
  ctx.restore();
  caption(ctx, x + 6, y + h - 6, "salinity (psu)", theme, { size: 8, color: theme.inkSoft });

  if (band !== "3-5") {
    badge(ctx, x + w - 8, y + 14, `${density.toFixed(1)} kg/m³`, rc.theme, {
      align: "right", color: sinks ? theme.sci["cold"] : theme.sci["hot"],
      sub: sinks ? "dense enough to sink" : "floats on the deep water",
    });
  }
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, theme, width, height, params, band } = rc;
  const view = params.view as string;

  sky(ctx, width, height, theme, "indoor");
  starfield(ctx, width, height * 0.2, 30, 5);

  if (view === "atmosphere") {
    drawCells(rc, 0, 0, width, height);
    caption(ctx, 10, 30, "Three cells in each hemisphere, driven by unequal heating", theme, {
      size: 12, weight: 700,
    });
  } else if (view === "ocean") {
    const wide = width > 560 && height > 300;
    const mapH = wide ? Math.round(height * 0.62) : height;
    const F = mapFrame(6, 6, width - 12, mapH - 12);
    drawOcean(rc, F);
    if (wide) drawDensity(rc, 6, mapH, width - 12, height - mapH - 6);
    caption(ctx, 12, 22, "Surface currents in an ocean basin", theme, { size: 12, weight: 700 });
  } else {
    const F = mapFrame(6, 6, width - 12, height - 12);
    drawCoriolis(rc, F);
    caption(ctx, 12, 22, "Same launch, twice: with rotation and without", theme, {
      size: 12, weight: 700,
    });
  }

  if (band === "9-12" && view === "coriolis") {
    const lat = params.launchLatitude as number;
    const rot = params.rotation as number;
    caption(ctx, width - 10, height - 10,
      `f = ${(coriolisParameter(lat, rot) * 1e4).toFixed(2)} ×10⁻⁴ s⁻¹  ·  inertial period ${(inertialPeriod(lat, rot) / 3600).toFixed(1)} h`,
      theme, { align: "right", size: 10, color: theme.inkSoft });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const circulationSim: SimManifest<State> = {
  id: "earth.circulation",
  title: "Global Circulation",
  tagline: "Launch a parcel across a spinning Earth, then switch the spin off and compare.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11],
  standards: { ngss: ["MS-ESS2-6", "HS-ESS2-4"] },
  learningGoals: [
    "Explain how unequal heating sets up convection cells in the atmosphere.",
    "Name the Hadley, Ferrel and Polar cells and the wind belt each produces.",
    "Show that the Coriolis effect deflects moving air to the right in the north and left in the south, and vanishes without rotation.",
    "Describe the pattern of surface ocean currents and how temperature and salt set water density.",
  ],
  misconceptions: [
    "The Coriolis effect is a force that pushes things sideways",
    "Coriolis makes water spin down a drain",
    "The Coriolis effect makes things speed up or slow down",
    "Winds blow directly from hot places to cold places",
    "Salty water is dense, so salinity matters more than temperature everywhere",
  ],
  interactionHint: "In the Coriolis view, press Launch, then set Rotation to zero and launch again.",
  tickRate: 60,
  params: {
    view: {
      type: "option", label: "View",
      options: [
        { value: "coriolis", label: "Coriolis: spin on or off" },
        { value: "atmosphere", label: "Circulation cells" },
        { value: "ocean", label: "Ocean currents" },
      ],
      default: "coriolis",
    },
    rotation: {
      type: "number", label: "Earth's rotation", kind: "ratio",
      min: 0, max: 2, step: 0.1, default: 1,
      marks: [{ value: 0, label: "Stopped" }, { value: 1, label: "Earth" }, { value: 2, label: "Double" }],
      help: "Set this to zero and the parcel goes perfectly straight. That is the experiment.",
    },
    launchLatitude: {
      type: "number", label: "Launch latitude", kind: "angle", unit: "°",
      min: -60 * DEG, max: 60 * DEG, step: DEG, default: 0,
      marks: [
        { value: -30 * DEG, label: "30°S" },
        { value: 0, label: "Equator" },
        { value: 30 * DEG, label: "30°N" },
      ],
    },
    launchBearing: {
      type: "number", label: "Launch direction", kind: "angle", unit: "°",
      min: 0, max: 2 * Math.PI, step: 5 * DEG, default: 0,
      marks: [
        { value: 0, label: "North" },
        { value: Math.PI / 2, label: "East" },
        { value: Math.PI, label: "South" },
      ],
      bands: ["6-8", "9-12"],
    },
    launchSpeed: {
      type: "number", label: "Parcel speed", kind: "velocity", unit: "m/s",
      min: 5, max: 60, step: 1, default: 20,
      bands: ["6-8", "9-12"],
    },
    target: {
      type: "number", label: "Target latitude", kind: "angle", unit: "°",
      min: -60 * DEG, max: 60 * DEG, step: DEG, default: 40 * DEG,
      bands: ["6-8", "9-12"],
      help: "Aim for this latitude and see what the rotation does to your aim.",
    },
    waterTemp: {
      type: "number", label: "Water temperature", kind: "temperature", unit: "°C",
      min: -2, max: 30, step: 0.5, default: 18,
    },
    salinity: {
      type: "number", label: "Salinity (psu)", kind: "ratio",
      min: 30, max: 40, step: 0.1, default: 35,
      help: "Practical salinity units — grams of salt per kilogram of seawater.",
    },
    speed: {
      type: "number", label: "Hours per second", kind: "ratio",
      min: 0.25, max: 4, step: 0.25, default: 1,
    },
  },
  overlays: [
    { key: "ghost", label: "Show the no-rotation path", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "switch-off-the-spin",
      title: "Switch the spin off",
      question: "Does a parcel of air really curve, or does it only look that way?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS2-6"],
      setup: { view: "coriolis", rotation: 1, launchLatitude: 0, launchBearing: 0, launchSpeed: 20, target: 40 * DEG, waterTemp: 18, salinity: 35, speed: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you launch anything.",
          predict: {
            prompt: "A parcel of air is launched due north from the equator. Where does it end up?",
            options: [
              "Straight north of where it started",
              "East of where it should be",
              "West of where it should be",
            ],
            correct: 1,
            reveal:
              "East. As it moves north the Coriolis parameter grows and steadily turns the parcel to its right, which for a northward launch means eastward.",
          },
        },
        {
          id: "launch",
          phase: "measure",
          title: "Launch it",
          instruction: "Press Launch and record the deflection as the parcel travels.",
          requireData: 4,
          check: {
            describe: "Deflected more than 200 km to the right",
            test: (v) => (v.facts.deflectionKm as number) > 200,
          },
        },
        {
          id: "stop-the-spin",
          phase: "measure",
          title: "Now stop the planet",
          instruction: "Set Rotation to zero and launch again. Record the deflection.",
          check: {
            describe: "Rotation off, and no deflection at all",
            test: (v) =>
              (v.params.rotation as number) === 0 && Math.abs(v.facts.deflectionKm as number) < 1,
          },
          requireData: 6,
          hints: ["With no spin, the solid line lands exactly on the dashed one."],
        },
        {
          id: "south",
          phase: "measure",
          title: "Try the southern hemisphere",
          instruction: "Put rotation back to 1 and launch from 30° south.",
          check: {
            describe: "Launched from the southern hemisphere",
            test: (v) =>
              (v.params.rotation as number) > 0.5 && (v.params.launchLatitude as number) < -10 * DEG,
          },
          requireData: 9,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say what causes the bend, and why it is not a real push.",
          write: {
            prompt: "Why does the parcel curve, and why does the curve disappear without rotation?",
            placeholder: "Nothing pushes the parcel sideways. What happens is that the ground underneath ...",
          },
        },
      ],
    },
    {
      id: "why-deserts-at-30",
      title: "Why the deserts sit at 30°",
      question: "Why is there a ring of deserts right round the world at about 30° north and south?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-6"],
      setup: { view: "atmosphere", rotation: 1, launchLatitude: 30 * DEG, launchBearing: 0, launchSpeed: 20, target: 40 * DEG, waterTemp: 18, salinity: 35, speed: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "The Sahara, the Mojave, the Atacama and the Australian desert are all near 30°.",
          predict: {
            prompt: "What is the air doing at 30° latitude?",
            options: ["Rising and cooling", "Sinking and warming", "Standing still"],
            correct: 1,
            reveal:
              "Sinking. Air that rose at the equator and lost its water there comes back down at 30°, warming as it descends, so it can hold even more water rather than dropping any.",
          },
        },
        {
          id: "equator",
          phase: "measure",
          title: "Look at the equator",
          instruction: "Set the latitude to 0 and read the surface climate label.",
          check: {
            describe: "Latitude within 5° of the equator",
            test: (v) => Math.abs(v.params.launchLatitude as number) < 5 * DEG,
          },
          requireData: 1,
        },
        {
          id: "thirty",
          phase: "measure",
          title: "Now go to 30°",
          instruction: "Move to 30° and read it again. Which way do the arrows point?",
          check: {
            describe: "Latitude between 25° and 35°",
            test: (v) =>
              Math.abs(v.params.launchLatitude as number) >= 25 * DEG &&
              Math.abs(v.params.launchLatitude as number) <= 35 * DEG,
          },
          requireData: 2,
        },
        {
          id: "sixty",
          phase: "measure",
          title: "And at 60°",
          instruction: "Go to 60°. Rising or sinking? What kind of weather does that give?",
          check: {
            describe: "Latitude beyond 55°",
            test: (v) => Math.abs(v.params.launchLatitude as number) >= 55 * DEG,
          },
          requireData: 3,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the pattern",
          instruction: "Connect the Hadley cell to the map of the world's deserts.",
          write: {
            prompt: "Explain why deserts form at 30° while rainforests form at the equator.",
            placeholder: "Air rises at the equator, so ... By the time it sinks at 30° it has ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "no-deflection",
      title: "Make the bend vanish",
      brief: "Find a way to send a parcel 1500 km with essentially no sideways deflection.",
      bands: ["6-8", "9-12"],
      setup: { view: "coriolis", rotation: 1, launchLatitude: 30 * DEG, launchBearing: 0, launchSpeed: 30, target: 40 * DEG, waterTemp: 18, salinity: 35, speed: 2 },
      goal: {
        describe: "Under 5 km of deflection after four hours of travel",
        test: (v) =>
          (v.facts.elapsedHours as number) > 4 && Math.abs(v.facts.deflectionKm as number) < 5,
      },
      stars: {
        two: {
          describe: "Do it with Earth still spinning",
          test: (v) =>
            (v.facts.elapsedHours as number) > 4 &&
            Math.abs(v.facts.deflectionKm as number) < 5 &&
            (v.params.rotation as number) > 0.5,
        },
      },
      hints: [
        "One way is to stop the planet. There is another way.",
        "f = 2Ω sin φ. What latitude makes sin φ zero?",
      ],
    },
    {
      id: "make-it-sink",
      title: "Make the water sink",
      brief: "Find water dense enough to sink below the deep ocean, using temperature and salt.",
      bands: ["6-8", "9-12"],
      setup: { view: "ocean", rotation: 1, launchLatitude: 0, launchBearing: 0, launchSpeed: 20, target: 40 * DEG, waterTemp: 20, salinity: 34, speed: 1 },
      goal: {
        describe: "Denser than the deep water at 1027.9 kg/m³",
        test: (v) => Boolean(v.facts.sinks),
      },
      stars: {
        two: {
          describe: "Do it with salinity no higher than 35 psu",
          test: (v) => Boolean(v.facts.sinks) && (v.params.salinity as number) <= 35,
        },
        three: {
          describe: "Do it with salinity at or below 34.5 psu — the way the North Atlantic does",
          test: (v) => Boolean(v.facts.sinks) && (v.params.salinity as number) <= 34.5,
        },
      },
      hints: [
        "Cold water is denser than warm water, and salt makes it denser still.",
        "The deep ocean is filled with water that was about 2 °C when it sank.",
      ],
    },
  ],
};
