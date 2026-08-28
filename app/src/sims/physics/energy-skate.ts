import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, camera, disc, energyBars, label } from "@ui/draw";

/**
 * Energy Skate Park — Grades 4-12.
 *
 * A skater on a rigid track, solved properly as a bead on a wire: the motion is
 * integrated along the arc length of the real track, the normal force is
 * computed from the local curvature, and the skater leaves the track the moment
 * that force would have to pull instead of push. Friction turns mechanical
 * energy into thermal energy at exactly the rate the friction force does work,
 * so the three energy bars always add up to the same total.
 *
 * Confronts the belief that energy "disappears" when something slows down, and
 * that a heavier skater goes faster down the same hill.
 */

/* ------------------------------------------------------------------ *
 * Tracks
 * ------------------------------------------------------------------ */

interface Track {
  x: number[];
  y: number[];
  /** Cumulative arc length at each point, m. */
  s: number[];
  /** Tangent angle at each point, rad, unwrapped so a loop keeps climbing. */
  th: number[];
  /** Curvature dθ/ds at each point, 1/m. Positive where the track cups upward. */
  k: number[];
  length: number;
  /** Index range to search when placing the skater at a starting height. */
  searchLimit: number;
  /** Arc-length span of the vertical loop, or null on the other tracks. */
  loop: [number, number] | null;
}

/** Height of the function-shaped tracks, m. */
function trackHeight(name: string, x: number): number {
  const u = (x - 12) / 12;
  if (name === "hill") return 10 * u ** 6 + 6 * Math.exp(-(((x - 12) / 3) ** 2));
  if (name === "doubleDip") return 10 * u * u + 3.5 * Math.exp(-(((x - 12) / 2.2) ** 2));
  return 10 * u * u; // valley
}

const LOOP_R = 2.2;
const LOOP_CX = 10.6;
/** Horizontal offset over one turn, so the loop's ends do not sit on top of each other. */
const LOOP_DRIFT = 1.6;

function rawPoints(name: string): { pts: { x: number; y: number }[]; searchLimit: number; loopIdx: [number, number] | null } {
  if (name !== "loop") {
    const pts: { x: number; y: number }[] = [];
    const n = 500;
    for (let i = 0; i < n; i++) {
      const x = (24 * i) / (n - 1);
      pts.push({ x, y: trackHeight(name, x) });
    }
    const searchLimit = name === "hill" ? 130 : name === "doubleDip" ? 160 : 250;
    return { pts, searchLimit, loopIdx: null };
  }

  const pts: { x: number; y: number }[] = [];
  // Entry ramp: a cosine, so it meets the flat with zero slope.
  const nA = 140;
  for (let i = 0; i < nA; i++) {
    const x = (8 * i) / nA;
    pts.push({ x, y: 5 * (1 + Math.cos((Math.PI * x) / 8)) });
  }
  // Flat run-up to the loop.
  const nB = 30;
  for (let i = 0; i < nB; i++) pts.push({ x: 8 + (2.6 * i) / nB, y: 0 });
  const loopStart = pts.length;
  // The vertical loop.
  const nC = 200;
  for (let i = 0; i <= nC; i++) {
    const phi = (2 * Math.PI * i) / nC;
    pts.push({
      x: LOOP_CX + LOOP_R * Math.sin(phi) + (LOOP_DRIFT * phi) / (2 * Math.PI),
      y: LOOP_R - LOOP_R * Math.cos(phi),
    });
  }
  const loopEnd = pts.length - 1;
  // Flat out-run, then the catch ramp.
  const nD = 90;
  for (let i = 1; i <= nD; i++) pts.push({ x: 12.2 + (7.8 * i) / nD, y: 0 });
  const nE = 70;
  for (let i = 1; i <= nE; i++) {
    const x = 20 + (4 * i) / nE;
    pts.push({ x, y: 10 * ((x - 20) / 4) ** 2 });
  }
  return { pts, searchLimit: nA, loopIdx: [loopStart, loopEnd] };
}

function buildTrack(name: string): Track {
  const { pts, searchLimit, loopIdx } = rawPoints(name);
  const n = pts.length;
  const x = new Array<number>(n);
  const y = new Array<number>(n);
  const s = new Array<number>(n);
  const th = new Array<number>(n);
  const k = new Array<number>(n);

  for (let i = 0; i < n; i++) { x[i] = pts[i].x; y[i] = pts[i].y; }
  s[0] = 0;
  for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);

  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    let angle = Math.atan2(y[b] - y[a], x[b] - x[a]);
    // Unwrap so the loop's tangent angle winds continuously through 2π.
    if (i > 0) angle += 2 * Math.PI * Math.round((th[i - 1] - angle) / (2 * Math.PI));
    th[i] = angle;
  }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const ds = s[b] - s[a];
    k[i] = ds > 1e-9 ? (th[b] - th[a]) / ds : 0;
  }

  return {
    x, y, s, th, k,
    length: s[n - 1],
    searchLimit,
    loop: loopIdx ? [s[loopIdx[0]], s[loopIdx[1]]] : null,
  };
}

interface Sample { x: number; y: number; th: number; k: number }

/** Linear interpolation of the track at an arc-length position. */
function sampleTrack(track: Track, sPos: number): Sample {
  const s = track.s;
  const n = s.length;
  const target = Math.max(0, Math.min(track.length, sPos));
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid] <= target) lo = mid; else hi = mid;
  }
  const span = s[hi] - s[lo];
  const t = span > 1e-9 ? (target - s[lo]) / span : 0;
  return {
    x: track.x[lo] + (track.x[hi] - track.x[lo]) * t,
    y: track.y[lo] + (track.y[hi] - track.y[lo]) * t,
    th: track.th[lo] + (track.th[hi] - track.th[lo]) * t,
    k: track.k[lo] + (track.k[hi] - track.k[lo]) * t,
  };
}

/** Arc-length position where the track first sits at the requested height. */
function startPosition(track: Track, height: number): number {
  let best = 0;
  let bestErr = Infinity;
  for (let i = 0; i < Math.min(track.searchLimit, track.y.length); i++) {
    const err = Math.abs(track.y[i] - height);
    if (err < bestErr) { bestErr = err; best = i; }
  }
  return track.s[best];
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  track: Track;
  trackName: string;
  /** Position along the track, m of arc length. */
  s: number;
  /** Speed along the track, m/s. Signed: negative is backwards. */
  v: number;
  /** True while the skater is off the track in free flight. */
  airborne: boolean;
  /** Free-flight position and velocity, m and m/s. */
  ax: number; ay: number; avx: number; avy: number;
  /** Energy turned into heat, J. */
  thermal: number;
  /** Support force from the track, N. Negative would mean it has to pull. */
  normal: number;
  maxSpeed: number;
  /** Furthest point down the park the skater has reached, m. */
  maxX: number;
  /** Times the skater has left the track. */
  departures: number;
  loops: number;
  inLoop: boolean;
  loopClean: boolean;
}

function freshState(params: ParamValues): State {
  const name = params.track as string;
  const track = buildTrack(name);
  const s0 = startPosition(track, params.startHeight as number);
  const p = sampleTrack(track, s0);
  return {
    track, trackName: name,
    s: s0, v: 0,
    airborne: false,
    ax: p.x, ay: p.y, avx: 0, avy: 0,
    thermal: 0,
    normal: (params.mass as number) * (params.gravity as number) * Math.cos(p.th),
    maxSpeed: 0,
    maxX: p.x,
    departures: 0, loops: 0, inLoop: false, loopClean: true,
  };
}

/** Position and speed of the skater whether it is on the track or flying. */
function skaterAt(state: State): { x: number; y: number; vx: number; vy: number; speed: number } {
  if (state.airborne) {
    return {
      x: state.ax, y: state.ay, vx: state.avx, vy: state.avy,
      speed: Math.hypot(state.avx, state.avy),
    };
  }
  const p = sampleTrack(state.track, state.s);
  return {
    x: p.x, y: p.y,
    vx: state.v * Math.cos(p.th), vy: state.v * Math.sin(p.th),
    speed: Math.abs(state.v),
  };
}

const model: SimModel<State> = {
  init(params) {
    return freshState(params);
  },

  applyParams(state, params, prev) {
    // A new track or a new drop height is a new experiment. Mass, friction and
    // gravity are deliberately live, so a student can switch friction on
    // mid-run and watch the thermal bar start growing.
    if (params.track !== prev.track || params.startHeight !== prev.startHeight) {
      return freshState(params);
    }
    return state;
  },

  step(state, dt, params) {
    const g = params.gravity as number;
    const m = params.mass as number;
    const mu = params.friction as number;
    const track = state.track;

    /* ---- Free flight ------------------------------------------------ */
    if (state.airborne) {
      const avx = state.avx;
      const avy = state.avy - g * dt;
      const ax = state.ax + avx * dt;
      const ay = state.ay + avy * dt;

      // Land when the skater crosses back through the track surface.
      let bestI = 0, bestD2 = Infinity;
      for (let i = 0; i < track.x.length; i++) {
        const d2 = (track.x[i] - ax) ** 2 + (track.y[i] - ay) ** 2;
        if (d2 < bestD2) { bestD2 = d2; bestI = i; }
      }
      const th = track.th[bestI];
      const nx = -Math.sin(th), ny = Math.cos(th);
      const side = (ax - track.x[bestI]) * nx + (ay - track.y[bestI]) * ny;

      if (side <= 0 && Math.sqrt(bestD2) < 1.2) {
        const vT = avx * Math.cos(th) + avy * Math.sin(th);
        const vN = avx * nx + avy * ny;
        // The component into the track is absorbed by the landing, exactly the
        // way a real landing thumps. That energy is not lost, it is heat.
        return {
          ...state,
          airborne: false,
          s: track.s[bestI],
          v: vT,
          ax: track.x[bestI], ay: track.y[bestI], avx: 0, avy: 0,
          thermal: state.thermal + 0.5 * m * vN * vN,
          normal: 0,
          maxSpeed: Math.max(state.maxSpeed, Math.abs(vT)),
          maxX: Math.max(state.maxX, track.x[bestI]),
        };
      }
      return {
        ...state, ax, ay, avx, avy, normal: 0,
        maxSpeed: Math.max(state.maxSpeed, Math.hypot(avx, avy)),
        maxX: Math.max(state.maxX, ax),
      };
    }

    /* ---- On the track ------------------------------------------------ */
    const p = sampleTrack(track, state.s);
    // Newton along the normal: m·v²·κ = N - m·g·cos θ.
    const normal = m * (state.v * state.v * p.k + g * Math.cos(p.th));

    if (normal < 0) {
      // The track would have to pull the skater down to keep it on. It cannot,
      // so the skater flies off along the tangent.
      return {
        ...state,
        airborne: true,
        ax: p.x, ay: p.y,
        avx: state.v * Math.cos(p.th), avy: state.v * Math.sin(p.th),
        normal: 0,
        departures: state.departures + 1,
        loopClean: false,
      };
    }

    const aTangential = -g * Math.sin(p.th);
    const frictionAccel = (mu * Math.abs(normal)) / m;
    let v = state.v;

    if (Math.abs(v) < 1e-4) {
      // At rest: friction holds the skater unless gravity can overcome it.
      if (Math.abs(aTangential) <= frictionAccel) v = 0;
      else v += (aTangential - Math.sign(aTangential) * frictionAccel) * dt;
    } else {
      const after = v + (aTangential - Math.sign(v) * frictionAccel) * dt;
      // Friction can stop the skater, never reverse it.
      v = after * v < 0 && Math.abs(aTangential) <= frictionAccel ? 0 : after;
    }

    let s = state.s + v * dt;
    let thermal = state.thermal + mu * Math.abs(normal) * Math.abs(v) * dt;

    // The ends of the track are walls. Whatever kinetic energy is left there
    // becomes heat, so the energy books still balance.
    if (s < 0) { thermal += 0.5 * m * v * v; s = 0; v = 0; }
    if (s > track.length) { thermal += 0.5 * m * v * v; s = track.length; v = 0; }

    // Loop bookkeeping.
    let { inLoop, loopClean, loops } = state;
    if (track.loop) {
      const [ls, le] = track.loop;
      if (!inLoop && state.s < ls && s >= ls) { inLoop = true; loopClean = true; }
      else if (inLoop && s < ls) { inLoop = false; }
      else if (inLoop && s >= le) {
        inLoop = false;
        if (loopClean) loops += 1;
      }
    }

    return {
      ...state, s, v, thermal, normal, inLoop, loopClean, loops,
      maxSpeed: Math.max(state.maxSpeed, Math.abs(v)),
      maxX: Math.max(state.maxX, sampleTrack(track, s).x),
    };
  },

  readouts(state, params) {
    const m = params.mass as number;
    const g = params.gravity as number;
    const p = skaterAt(state);
    const ke = 0.5 * m * p.speed * p.speed;
    const pe = m * g * p.y;

    return [
      {
        key: "height", label: "Height", quantity: q(p.y, "length"),
        unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "speed", label: "Speed", quantity: q(p.speed, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true,
      },
      {
        key: "ke", label: "Kinetic energy", quantity: q(ke, "energy"),
        unit: "J", semantic: "energy-kinetic", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "pe", label: "Potential energy", quantity: q(pe, "energy"),
        unit: "J", semantic: "energy-potential", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "thermal", label: "Thermal energy", quantity: q(state.thermal, "energy"),
        unit: "J", semantic: "energy-thermal", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "total", label: "Total energy", quantity: q(ke + pe + state.thermal, "energy"),
        unit: "J", semantic: "energy-total", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "normal", label: "Track push", quantity: q(state.normal, "force"),
        unit: "N", semantic: "force", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const m = params.mass as number;
    const g = params.gravity as number;
    const p = skaterAt(state);
    const ke = 0.5 * m * p.speed * p.speed;
    const pe = m * g * p.y;
    return {
      height: p.y,
      speed: p.speed,
      ke, pe,
      thermal: state.thermal,
      total: ke + pe + state.thermal,
      mechanical: ke + pe,
      maxSpeed: state.maxSpeed,
      maxX: state.maxX,
      airborne: state.airborne,
      departures: state.departures,
      onTrack: state.departures === 0,
      loops: state.loops,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const m = params.mass as number;
  const g = params.gravity as number;
  const track = state.track;

  // Square camera: a loop must actually look like a circle.
  const cam = camera({ x0: -1, y0: -1.4, x1: 25, y1: 12, width, height, square: true });
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);

  // ---- Reference height line ------------------------------------------
  if (overlays.heightLine && band !== "K-2") {
    const p0 = skaterAt(state);
    ctx.save();
    ctx.strokeStyle = theme.sci["energy-potential"];
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(-1), Y(p0.y));
    ctx.lineTo(X(25), Y(p0.y));
    ctx.stroke();
    ctx.restore();
    label(ctx, `${p0.y.toFixed(1)} m`, X(24.6), Y(p0.y), theme, {
      align: "right", color: theme.sci["energy-potential"], size: 11,
    });
  }

  // ---- Ground reference -------------------------------------------------
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(-1), Y(0));
  ctx.lineTo(X(25), Y(0));
  ctx.stroke();
  ctx.restore();

  // ---- The track ---------------------------------------------------------
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(X(track.x[0]), Y(track.y[0]));
  for (let i = 1; i < track.x.length; i++) ctx.lineTo(X(track.x[i]), Y(track.y[i]));
  ctx.stroke();
  ctx.restore();

  // ---- The skater ---------------------------------------------------------
  const p = skaterAt(state);
  const sx = X(p.x), sy = Y(p.y);
  const bodyR = band === "K-2" ? 13 : 10;
  disc(ctx, sx, sy - bodyR * 0.9, bodyR, theme.accent, { stroke: theme.surface, lineWidth: 2 });
  disc(ctx, sx, sy - bodyR * 2.3, bodyR * 0.55, theme.accent, { stroke: theme.surface, lineWidth: 2 });

  // ---- Vectors -------------------------------------------------------------
  if (overlays.vectors && band !== "K-2" && p.speed > 0.2) {
    const scale = Math.min(6, 70 / Math.max(4, p.speed));
    arrow(ctx, sx, sy - bodyR, sx + p.vx * scale, sy - bodyR - p.vy * scale, theme.sci["velocity"], {
      label: band === "9-12" ? "v" : undefined,
    });
  }
  if (overlays.forces && band === "9-12" && !state.airborne) {
    const pt = sampleTrack(track, state.s);
    const nx = -Math.sin(pt.th), ny = Math.cos(pt.th);
    const fScale = 40 / Math.max(200, Math.abs(state.normal));
    arrow(ctx, sx, sy, sx + nx * state.normal * fScale, sy - ny * state.normal * fScale,
      theme.sci["force"], { label: "N" });
    arrow(ctx, sx, sy, sx, sy + 34, theme.sci["force"], { width: 1.8, dashed: true, label: "mg" });
  }

  // ---- Energy bars ----------------------------------------------------------
  if (overlays.energy) {
    const ke = 0.5 * m * p.speed * p.speed;
    const pe = m * g * p.y;
    const barW = Math.min(300, width * 0.42);
    const bx = 16, by = 16, bh = band === "K-2" ? 22 : 18;
    energyBars(ctx, bx, by, barW, bh, [
      { label: "KE", value: ke, color: theme.sci["energy-kinetic"] },
      { label: "PE", value: pe, color: theme.sci["energy-potential"] },
      { label: "Heat", value: state.thermal, color: theme.sci["energy-thermal"] },
    ], theme);

    if (band !== "K-2") {
      const legend: [string, string, number][] = [
        ["motion", theme.sci["energy-kinetic"], ke],
        ["height", theme.sci["energy-potential"], pe],
        ["heat", theme.sci["energy-thermal"], state.thermal],
      ];
      let lx = bx;
      for (const [name, color, value] of legend) {
        const text = band === "3-5" ? name : `${name} ${Math.round(value)} J`;
        label(ctx, text, lx, by + bh + 14, theme, { color, size: 11 });
        lx += band === "3-5" ? 62 : 96;
      }
      if (band === "6-8" || band === "9-12") {
        label(ctx, `total ${Math.round(ke + pe + state.thermal)} J`, bx, by + bh + 34, theme, {
          color: theme.sci["energy-total"], size: 11,
        });
      }
    }
  }

  // ---- Status --------------------------------------------------------------
  if (state.airborne && band !== "K-2") {
    label(ctx, "Off the track!", sx, sy - bodyR * 4, theme, {
      align: "center", color: theme.sci["acceleration"],
    });
  }
  if (track.loop && state.loops > 0 && band !== "K-2") {
    label(ctx, `Loops completed: ${state.loops}`, X(24.6), Y(11.2), theme, {
      align: "right", color: theme.accent, size: 11,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const energySkateSim: SimManifest<State> = {
  id: "phys.energy-skate",
  title: "Energy Skate Park",
  tagline: "Drop the skater in, watch the energy bars trade places, and find where it all goes.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["4-PS3-1", "MS-PS3-1", "MS-PS3-5", "HS-PS3-1", "HS-PS3-2"], ccssMath: ["HSA.CED.A.2"] },
  learningGoals: [
    "Describe how kinetic and potential energy trade off along a track.",
    "Show that the total energy stays the same, even when friction is on.",
    "Explain where the energy goes when a skater slows to a stop.",
    "Work out how fast a skater must be to stay on the inside of a loop.",
  ],
  misconceptions: [
    "Energy disappears when something slows down",
    "A heavier skater goes faster down the same hill",
    "The skater needs a push to get over a hill lower than the start",
    "Speed at the bottom depends on how steep the slope is",
  ],
  interactionHint: "Press play and watch the coloured bars swap.",
  params: {
    track: {
      type: "option", label: "Track",
      options: [
        { value: "valley", label: "Valley" },
        { value: "hill", label: "Hill" },
        { value: "doubleDip", label: "Double dip" },
        { value: "loop", label: "Loop" },
      ],
      default: "valley",
    },
    startHeight: {
      type: "number", label: "Drop height", kind: "length", unit: "m",
      min: 1, max: 9.5, step: 0.5, default: 8,
      help: "How high up the track the skater starts, at rest.",
    },
    mass: {
      type: "number", label: "Skater mass", kind: "mass", unit: "kg",
      min: 20, max: 100, step: 5, default: 60,
      bands: ["3-5", "6-8", "9-12"],
      help: "Try a heavy skater and a light one from the same height.",
    },
    friction: {
      type: "number", label: "Friction", kind: "ratio",
      min: 0, max: 0.4, step: 0.02, default: 0,
      help: "Turn it up and watch the heat bar grow as the others shrink.",
    },
    gravity: {
      type: "number", label: "Gravity", kind: "acceleration", unit: "m/s²",
      min: 1.6, max: 25, step: 0.01, default: CONSTANTS.g,
      bands: ["6-8", "9-12"],
      marks: [
        { value: 1.62, label: "Moon" },
        { value: 3.72, label: "Mars" },
        { value: 9.81, label: "Earth" },
        { value: 24.79, label: "Jupiter" },
      ],
    },
  },
  overlays: [
    { key: "energy", label: "Energy bars", default: true },
    { key: "vectors", label: "Speed arrow", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "forces", label: "Force arrows", default: false, bands: ["9-12"] },
    { key: "heightLine", label: "Height line", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "conserved",
      title: "Where is energy conserved?",
      question: "The skater speeds up and slows down. Is anything staying the same?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS3-5", "HS-PS3-1"],
      setup: { track: "valley", startHeight: 8, mass: 60, friction: 0, gravity: CONSTANTS.g },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the other side",
          instruction: "The skater is dropped from 8 m with friction off.",
          predict: {
            prompt: "How high will the skater get on the far side of the valley?",
            options: ["a bit lower than 8 m", "exactly 8 m", "higher than 8 m", "it depends on the mass"],
            correct: 1,
            reveal: "Exactly 8 m. With no friction, every joule of height energy comes back as height energy on the far side — and the mass cancels out completely.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Record the two ends and the middle",
          instruction: "Record at the top, at the bottom, and at the far top.",
          requireData: 3,
          hints: [
            "Use the slow-motion speed control to catch the exact bottom.",
            "Watch which bar shrinks as the other grows.",
          ],
        },
        {
          id: "mass",
          phase: "measure",
          title: "Change the mass",
          instruction: "Set the mass to 100 kg from the same height. Record the top speed.",
          requireData: 4,
          check: {
            describe: "Skater mass is 90 kg or more",
            test: (v) => (v.params.mass as number) >= 90,
          },
          hints: ["Compare the biggest speed, not the biggest energy."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Add the bars up",
          instruction: "For each recorded row, add kinetic and potential energy together.",
          write: {
            prompt: "What happens to kinetic + potential energy as the skater moves?",
            placeholder: "Kinetic energy went ... potential went ... but the total ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the law",
          instruction: "Write what is conserved, and what mass does and does not change.",
          write: {
            prompt: "What quantity stays constant here, and why does mass not change the speed?",
            placeholder: "The total ... stays the same. Mass does not change the speed because ...",
          },
        },
      ],
    },
    {
      id: "friction-heat",
      title: "Where does the energy go with friction?",
      question: "The skater grinds to a halt. Has the energy been destroyed?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS3-5", "HS-PS3-2"],
      setup: { track: "valley", startHeight: 8, mass: 60, friction: 0.1, gravity: CONSTANTS.g },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the ending",
          instruction: "Friction is on. Let it run for a while.",
          predict: {
            prompt: "Once the skater has stopped moving completely, the total energy will be...",
            options: ["zero — it is all gone", "the same as at the start", "half of the start value"],
            correct: 1,
            reveal: "The same. Every joule that left the motion and height bars is sitting in the thermal bar. Energy is not used up, it is moved.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Let it settle",
          instruction: "Run until the skater barely moves. Record three times along the way.",
          requireData: 3,
          hints: ["Use fast-forward. The thermal bar only ever grows."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the totals",
          instruction: "Compare the total energy in your first row and your last row.",
          check: {
            describe: "Friction is switched on",
            test: (v) => (v.params.friction as number) > 0,
          },
        },
        {
          id: "off",
          phase: "measure",
          title: "Now turn friction off",
          instruction: "Reset, set friction to zero and run again. Does it ever stop?",
          check: {
            describe: "Friction is set to zero",
            test: (v) => (v.params.friction as number) === 0,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say where the energy went and how you know it is still there.",
          write: {
            prompt: "Where does the energy go when friction slows the skater, and how does the sim show it?",
            placeholder: "The energy moves into ... I know because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "clean-loop",
      title: "Complete the loop",
      brief: "Get all the way round the loop without ever leaving the track.",
      bands: ["6-8", "9-12"],
      setup: { track: "loop", startHeight: 4, mass: 60, friction: 0, gravity: CONSTANTS.g },
      goal: {
        describe: "One full loop without leaving the track",
        test: (v) => (v.facts.loops as number) >= 1,
      },
      stars: {
        two: {
          describe: "A clean loop starting from 7 m or lower",
          test: (v) => (v.facts.loops as number) >= 1 && (v.params.startHeight as number) <= 7,
        },
        three: {
          describe: "A clean loop starting from 6 m or lower",
          test: (v) => (v.facts.loops as number) >= 1 && (v.params.startHeight as number) <= 6,
        },
      },
      hints: [
        "At the top of the loop the track can only push inwards — downwards. Gravity has to do the rest.",
        "The skater needs enough speed at the top that gravity alone can bend its path around the loop.",
        "That works out as a drop height of at least two and a half loop radii above the loop's bottom.",
        "The loop radius is 2.2 m, so the magic height is 5.5 m — and friction pushes it higher.",
      ],
    },
    {
      id: "clear-the-hill",
      title: "Just clear the hill",
      brief: "Get the skater over the middle hill and no further than the far wall.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { track: "hill", startHeight: 5, mass: 60, friction: 0, gravity: CONSTANTS.g },
      goal: {
        describe: "The skater gets over the crest and down the far side",
        test: (v) => v.params.track === "hill" && (v.facts.maxX as number) >= 15,
      },
      stars: {
        two: {
          describe: "Over the hill with friction switched on",
          test: (v) =>
            v.params.track === "hill" &&
            (v.facts.maxX as number) >= 15 &&
            (v.params.friction as number) > 0,
        },
        three: {
          describe: "Over the hill with friction on, starting below 7 m",
          test: (v) =>
            v.params.track === "hill" &&
            (v.facts.maxX as number) >= 15 &&
            (v.params.friction as number) > 0 &&
            (v.params.startHeight as number) <= 7,
        },
      },
      hints: [
        "The hill is 6 m tall. Where does the skater have to start?",
        "Friction takes a slice of the energy on the way, so aim a little higher.",
        "Height energy at the start has to cover the hill's height plus whatever friction takes.",
      ],
    },
  ],
};
