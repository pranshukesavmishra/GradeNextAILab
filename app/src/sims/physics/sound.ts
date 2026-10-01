import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, disc, roundRect } from "@ui/draw";
import {
  badge, caption, comet, glow, hexA, material, sky, sphere, starfield, vignette,
} from "@ui/scene";

/**
 * Sound — Grade 8, Unit D4.
 *
 * A corridor of real medium between a loudspeaker and a wall. The top of the
 * stage is the room, where a single click runs down to the wall and comes back
 * so the echo can be timed. The middle is the same medium seen close up, where
 * the particles bunch into compressions and spread into rarefactions. The
 * bottom is the graph of that same motion, drawn underneath and lined up with
 * it, because the wave a student draws in a book and the wave in the air are
 * the same thing and almost nobody believes it the first time.
 *
 * Speeds are real: 331.3 + 0.606·T m/s in air, 1481 m/s in water, about
 * 5000 m/s along a steel rail, and nothing at all in vacuum.
 *
 * Serves D4.1-D4.5 and D1.4.
 */

/** Threshold of hearing, the reference pressure for the decibel scale. */
export const P_REF = 20e-6;
/** Human hearing runs from 20 Hz to 20 kHz. */
export const HEARING_MIN = 20;
export const HEARING_MAX = 20000;
/** Cycles of the wave drawn per second of simulated time. */
const DISPLAY_HZ = 2.5;

export interface Medium {
  key: string;
  label: string;
  /** Speed of sound, m/s. Air is computed from temperature instead. */
  speed: number;
  semantic: "gas" | "liquid" | "solid";
  note: string;
}

export const MEDIA: Medium[] = [
  { key: "air", label: "Air", speed: 343, semantic: "gas", note: "343 m/s at 20 °C — and it changes with temperature." },
  { key: "water", label: "Water", speed: 1481, semantic: "liquid", note: "1481 m/s: four times faster than air, which is why whales can call so far." },
  { key: "steel", label: "Steel rail", speed: 5000, semantic: "solid", note: "About 5000 m/s along a rail. Tightly packed particles pass the push on fast." },
  { key: "vacuum", label: "Vacuum", speed: 0, semantic: "gas", note: "No particles at all, so there is nothing to squeeze. Silence." },
];

export function mediumOf(key: string): Medium {
  return MEDIA.find((m) => m.key === key) ?? MEDIA[0];
}

/**
 * Speed of sound in dry air: v = 331.3 + 0.606·T with T in °C. The textbook
 * linear fit, good to a fraction of a percent over ordinary temperatures.
 */
export function airSpeed(kelvin: number): number {
  return 331.3 + 0.606 * (kelvin - 273.15);
}

export function soundSpeed(mediumKey: string, kelvin: number): number {
  const medium = mediumOf(mediumKey);
  return medium.key === "air" ? airSpeed(kelvin) : medium.speed;
}

/** Sound pressure level: L = 20·log₁₀(p / 20 µPa). */
export function decibels(pressure: number): number {
  return pressure <= 0 ? 0 : 20 * Math.log10(pressure / P_REF);
}

/** Pressure amplitude, in pascals, for a level in decibels. */
export function pressureAt(db: number): number {
  return P_REF * Math.pow(10, db / 20);
}

/** Time for a click to reach a wall and come back: t = 2d / v. */
export function echoTime(distance: number, speed: number): number {
  return speed > 0 ? (2 * distance) / speed : Infinity;
}

export function audible(frequency: number, mediumKey: string, db: number): boolean {
  return mediumOf(mediumKey).key !== "vacuum"
    && frequency >= HEARING_MIN && frequency <= HEARING_MAX && db > 0;
}

interface Pulse {
  /** Distance from the speaker, m. */
  x: number;
  /** +1 running out, −1 coming back. */
  dir: number;
  /** Seconds since it left the speaker. */
  age: number;
  /** Positions it has been through, m, for the trail. */
  trail: number[];
}

interface State {
  /** Phase of the drawn wave, in cycles. */
  phase: number;
  pulse: Pulse | null;
  /** Round-trip time of the last completed echo, s. */
  lastEcho: number;
  echoes: number;
  t: number;
}

const model: SimModel<State> = {
  init() {
    return { phase: 0, pulse: null, lastEcho: 0, echoes: 0, t: 0 };
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const speed = soundSpeed(params.medium as string, params.temperature as number);
    const wall = params.target as number;

    for (const input of inputs) {
      if (input.type === "action" && input.action === "launch") {
        s = { ...s, pulse: { x: 0, dir: 1, age: 0, trail: [0] } };
      }
    }

    let pulse = s.pulse;
    let lastEcho = s.lastEcho;
    let echoes = s.echoes;

    if (pulse && speed > 0) {
      const travel = speed * dt;
      // How much further the click has to go before it is back at the speaker.
      const remaining = pulse.dir > 0 ? (wall - pulse.x) + wall : pulse.x;
      let x: number;
      let dir = pulse.dir;
      if (pulse.dir > 0 && travel >= wall - pulse.x) {
        // Reflect off the wall, spending the rest of the step on the way back.
        x = wall - (travel - (wall - pulse.x));
        dir = -1;
      } else {
        x = pulse.x + pulse.dir * travel;
      }
      const trail = pulse.trail.length >= 90 ? pulse.trail.slice(1) : pulse.trail.slice();
      trail.push(Math.max(0, x));
      if (x <= 0) {
        // Back at the speaker. Stop the clock partway through this step rather
        // than a whole tick late, so the timing is the physics and not the
        // frame rate.
        lastEcho = pulse.age + dt * Math.min(1, remaining / Math.max(travel, 1e-12));
        echoes += 1;
        pulse = null;
      } else {
        pulse = { x, dir, age: pulse.age + dt, trail };
      }
    } else if (pulse && speed === 0) {
      // A vacuum carries nothing: the click never leaves the speaker.
      pulse = { ...pulse, age: pulse.age + dt };
    }

    return { ...s, phase: s.phase + dt * DISPLAY_HZ, pulse, lastEcho, echoes, t: s.t + dt };
  },

  readouts(state, params) {
    const speed = soundSpeed(params.medium as string, params.temperature as number);
    const f = params.frequency as number;
    const db = params.loudness as number;
    const wall = params.target as number;
    const lambda = speed > 0 ? speed / f : 0;
    return [
      {
        key: "speed", label: "Speed of sound", quantity: q(speed, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true,
      },
      {
        key: "frequency", label: "Frequency", quantity: q(f, "frequency"),
        unit: "Hz", semantic: "wave", graphable: true,
      },
      {
        key: "wavelength", label: "Wavelength", quantity: q(lambda, "length"),
        unit: "m", semantic: "wave", graphable: true,
      },
      {
        key: "period", label: "Time for one wobble", quantity: q(1 / f, "time"),
        unit: "ms", semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "loudness", label: "Loudness", quantity: q(db, "count"),
        semantic: "energy-total", graphable: true,
      },
      {
        key: "pressure", label: "Pressure swing", quantity: q(pressureAt(db), "pressure"),
        unit: "Pa", semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
      {
        key: "echo", label: "Echo time there and back",
        quantity: q(Number.isFinite(echoTime(wall, speed)) ? echoTime(wall, speed) : 0, "time"),
        unit: "s", semantic: "time", graphable: true,
      },
      {
        key: "measured", label: "Echo you timed", quantity: q(state.lastEcho, "time"),
        unit: "s", semantic: "time", graphable: true,
      },
    ];
  },

  facts(state, params) {
    const speed = soundSpeed(params.medium as string, params.temperature as number);
    const f = params.frequency as number;
    const db = params.loudness as number;
    const wall = params.target as number;
    const medium = mediumOf(params.medium as string);
    return {
      speed,
      wavelength: speed > 0 ? speed / f : 0,
      period: 1 / f,
      frequency: f,
      decibels: db,
      pressure: pressureAt(db),
      hasMedium: medium.key !== "vacuum",
      audible: audible(f, medium.key, db),
      infrasound: f < HEARING_MIN,
      ultrasound: f > HEARING_MAX,
      echoTime: Number.isFinite(echoTime(wall, speed)) ? echoTime(wall, speed) : 0,
      measuredEcho: state.lastEcho,
      echoes: state.echoes,
      pulseFlying: state.pulse !== null,
      wallDistance: wall,
      medium: medium.key,
      // The check a student can do by hand: speed = frequency × wavelength.
      fLambda: speed > 0 ? f * (speed / f) : 0,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const medium = mediumOf(params.medium as string);
  const speed = soundSpeed(medium.key, params.temperature as number);
  const f = params.frequency as number;
  const db = params.loudness as number;
  const wall = params.target as number;
  const lambda = speed > 0 ? speed / f : 0;
  const mediumColor = theme.sci[medium.semantic];

  // Three lanes: the room, the medium close up, and the graph of it.
  const roomH = Math.round(height * 0.34);
  const zoomY0 = roomH + 6;
  const zoomH = Math.round(height * 0.32);
  const graphY0 = zoomY0 + zoomH + 4;
  const graphH = height - graphY0 - 8;

  sky(ctx, width, height, theme, medium.key === "vacuum" ? "space" : "indoor");
  if (medium.key === "vacuum") starfield(ctx, width, roomH, 60, 3);

  /* ================= the room ================= */
  const roomY = Math.round(roomH * 0.56);
  const x0 = 62, x1 = width - 26;
  const toX = (metres: number) => x0 + (metres / Math.max(wall, 1e-6)) * (x1 - x0);

  // The medium itself, so "no medium" looks like something.
  if (medium.key !== "vacuum") {
    ctx.save();
    ctx.fillStyle = hexA(mediumColor, medium.key === "air" ? 0.14 : 0.26);
    ctx.fillRect(x0, roomY - 42, x1 - x0, 84);
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, roomY - 42, x1 - x0, 84);
    ctx.restore();
  }

  // Speaker.
  material(ctx, x0 - 34, roomY - 26, 30, 52, theme.inkSoft, 4);
  const cone = 1 + (audible(f, medium.key, db) ? 0.12 * Math.sin(2 * Math.PI * state.phase) : 0);
  ctx.save();
  ctx.fillStyle = hexA(theme.sci["wave"], 0.85);
  ctx.beginPath();
  ctx.ellipse(x0 - 8, roomY, 7 * cone, 17 * cone, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wall.
  material(ctx, toX(wall), roomY - 46, 14, 92, theme.sci["solid"], 3);
  caption(ctx, toX(wall) + 7, roomY + 62, `${wall.toFixed(0)} m`, theme, {
    align: "center", size: 11, color: theme.sci["distance"],
  });

  // The click, running out and back.
  if (state.pulse && speed > 0) {
    const trail = state.pulse.trail.map((m) => ({ x: toX(m), y: roomY }));
    comet(ctx, trail, theme.sci["wave"], 5);
    const px = toX(state.pulse.x);
    glow(ctx, px, roomY, 26, theme.sci["wave"], 0.6);
    ctx.save();
    ctx.strokeStyle = theme.sci["wave"];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, roomY - 34);
    ctx.lineTo(px, roomY + 34);
    ctx.stroke();
    ctx.restore();
    arrow(
      ctx, px + state.pulse.dir * 8, roomY - 46, px + state.pulse.dir * 44, roomY - 46,
      theme.sci["velocity"], { width: 2 },
    );
  } else if (state.pulse) {
    caption(ctx, x0 + 10, roomY - 52, "the click cannot leave: there is nothing to carry it", theme, {
      size: 12, color: theme.sci["force"],
    });
  }

  if (state.lastEcho > 0) {
    badge(ctx, width - 18, 26, `${(state.lastEcho * 1000).toFixed(1)} ms`, theme, {
      align: "right", color: theme.sci["time"], sub: "echo you timed",
    });
  }
  caption(ctx, 12, 20, medium.label, theme, { size: 15, color: theme.ink, weight: 800 });
  if (band !== "3-5") caption(ctx, 12, 40, medium.note, theme, { size: 11, color: theme.inkSoft });

  /* ================= the medium, close up ================= */
  if (speed > 0 && zoomH > 40) {
    // The close-up window holds three wavelengths, whatever the pitch.
    const windowM = Math.max(lambda * 3, 1e-4);
    const k = (2 * Math.PI) / lambda;

    ctx.save();
    ctx.fillStyle = hexA(mediumColor, 0.1);
    ctx.fillRect(0, zoomY0, width, zoomH);
    ctx.restore();

    // Particles are pushed ALONG the wave, not across it: that is what makes
    // sound longitudinal, and it is why they bunch into compressions.
    const cols = Math.min(96, Math.max(36, Math.round(width / 9)));
    const spacingPx = width / cols;
    const swing = spacingPx * (0.2 + 0.95 * (db / 110));
    const displace = (m: number) => swing * Math.sin(k * m - 2 * Math.PI * state.phase);
    const rows = zoomH > 90 ? 4 : 3;
    const dotR = medium.key === "air" ? 2.2 : 2.9;
    for (let i = 0; i < cols; i++) {
      const m = (i / cols) * windowM;
      const sx = i * spacingPx + displace(m);
      for (let j = 0; j < rows; j++) {
        const sy = zoomY0 + ((j + 0.5) / rows) * zoomH;
        disc(ctx, sx, sy, dotR, mediumColor);
      }
    }

    // Name the two things a student is meant to see.
    if (overlays.labels && band !== "3-5") {
      const compressionM = ((2 * Math.PI * state.phase) % (2 * Math.PI)) / k;
      for (let n = 0; n < 4; n++) {
        const m = compressionM + n * lambda;
        if (m > windowM) break;
        const sx = (m / windowM) * width;
        caption(ctx, sx, zoomY0 + 14, "squeezed", theme, {
          align: "center", size: 10, color: theme.sci["wave"],
        });
        const rx = sx + ((lambda / 2) / windowM) * width;
        if (rx < width - 30) {
          caption(ctx, rx, zoomY0 + 14, "spread out", theme, {
            align: "center", size: 10, color: theme.inkSoft,
          });
        }
      }
    }

    /* ================= the graph of the same motion ================= */
    if (graphH > 30) {
      const mid = graphY0 + graphH / 2;
      ctx.save();
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
      ctx.restore();

      const amp = Math.min(graphH * 0.38, 4 + (db / 110) * graphH * 0.36);
      ctx.save();
      ctx.strokeStyle = theme.sci["wave"];
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= width; i += 2) {
        const m = (i / width) * windowM;
        const y = mid - amp * Math.sin(k * m - 2 * Math.PI * state.phase);
        if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.restore();

      // One particle, tied to its own point on the graph: the link students miss.
      if (overlays.link) {
        const markM = windowM * 0.25;
        const markX = (markM / windowM) * width + displace(markM);
        const graphY = mid - amp * Math.sin(k * markM - 2 * Math.PI * state.phase);
        ctx.save();
        ctx.strokeStyle = hexA(theme.accent, 0.6);
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(markX, zoomY0 + zoomH / 2);
        ctx.lineTo((markM / windowM) * width, graphY);
        ctx.stroke();
        ctx.restore();
        sphere(ctx, markX, zoomY0 + zoomH / 2, 4.5, theme.accent);
        sphere(ctx, (markM / windowM) * width, graphY, 4, theme.accent);
      }

      // The wavelength, measured on the graph.
      if (overlays.ruler && band !== "3-5") {
        const lx = ((0.05 * windowM) / windowM) * width;
        const rx = lx + (lambda / windowM) * width;
        ctx.save();
        ctx.strokeStyle = theme.sci["distance"];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, graphY0 + 12);
        ctx.lineTo(rx, graphY0 + 12);
        ctx.moveTo(lx, graphY0 + 6);
        ctx.lineTo(lx, graphY0 + 18);
        ctx.moveTo(rx, graphY0 + 6);
        ctx.lineTo(rx, graphY0 + 18);
        ctx.stroke();
        ctx.restore();
        caption(ctx, (lx + rx) / 2, graphY0 + 26, formatLength(lambda), theme, {
          align: "center", size: 11, color: theme.sci["distance"],
        });
      }
    }

    if (band !== "3-5") {
      caption(ctx, 12, zoomY0 + zoomH - 8, `slowed ${(f / DISPLAY_HZ).toFixed(0)}× so you can see it`, theme, {
        size: 10, color: theme.inkSoft,
      });
    }
  } else if (zoomH > 40) {
    caption(ctx, width / 2, zoomY0 + zoomH / 2, "no particles, no sound", theme, {
      align: "center", size: 18, color: theme.inkSoft, weight: 800,
    });
  }

  /* ================= hearing range ================= */
  if (overlays.hearing && band !== "3-5" && width > 380) {
    const bw = Math.min(240, width * 0.3), bh = 8;
    const bx = width - bw - 18, by = roomH - 26;
    // A logarithmic axis from 1 Hz to 100 kHz, so 20 Hz and 20 kHz both land on it.
    const logAt = (hz: number) => Math.log10(Math.max(hz, 1)) / 5;
    ctx.save();
    ctx.fillStyle = theme.surfaceAlt;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.fillStyle = hexA(theme.sci["wave"], 0.5);
    const a = logAt(HEARING_MIN) * bw, b = logAt(HEARING_MAX) * bw;
    roundRect(ctx, bx + a, by, b - a, bh, 4);
    ctx.fill();
    ctx.fillStyle = theme.accent;
    const hx = bx + Math.min(bw, Math.max(0, logAt(f) * bw));
    roundRect(ctx, hx - 1.5, by - 4, 3, bh + 8, 1.5);
    ctx.fill();
    ctx.restore();
    caption(ctx, bx, by - 10, "20 Hz — 20 kHz: what a person can hear", theme, {
      size: 10, color: theme.inkSoft,
    });
    const state2 = f < HEARING_MIN ? "too low to hear (infrasound)"
      : f > HEARING_MAX ? "too high to hear (ultrasound)"
      : medium.key === "vacuum" ? "nothing to hear: no medium" : "you would hear this";
    caption(ctx, bx, by + 22, state2, theme, {
      size: 11, color: audible(f, medium.key, db) ? theme.sci["wave"] : theme.sci["force"],
    });
  }

  vignette(ctx, width, height, 0.12);
}

function formatLength(metres: number): string {
  if (metres >= 1) return `λ = ${metres.toFixed(2)} m`;
  if (metres >= 0.01) return `λ = ${(metres * 100).toFixed(1)} cm`;
  return `λ = ${(metres * 1000).toFixed(1)} mm`;
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const soundSim: SimManifest<State> = {
  id: "phys.sound",
  title: "Sound",
  tagline: "Squeeze the air, watch the graph draw itself, and time an echo off the wall.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS4-1", "MS-PS4-2", "4-PS4-1", "HS-PS4-1"], ccssMath: ["6.RP.A.3", "8.EE.A.4"] },
  timeScale: 0.2,
  learningGoals: [
    "Describe sound as a longitudinal wave of compressions and rarefactions.",
    "Match the squeezed-and-spread picture to the wave drawn on a graph.",
    "Connect pitch to frequency and loudness to amplitude, separately.",
    "Compare the speed of sound in air, water and steel, and explain the order.",
    "Use speed = frequency × wavelength, and time an echo to measure a distance.",
  ],
  misconceptions: [
    "Sound can travel through empty space",
    "A louder sound travels faster",
    "A higher pitch travels faster",
    "Sound moves particles along with it, all the way across the room",
    "Sound travels fastest in air because air is easiest to move through",
  ],
  interactionHint: "Press Launch to send a click and time its echo.",
  params: {
    medium: {
      type: "option", label: "What the sound travels through",
      options: MEDIA.map((m) => ({ value: m.key, label: m.label })),
      default: "air",
    },
    frequency: {
      type: "number", label: "Pitch", kind: "frequency", unit: "Hz",
      min: 20, max: 60000, step: 10, default: 440,
      marks: [
        { value: 20, label: "20 Hz" },
        { value: 440, label: "440 Hz" },
        { value: 4000, label: "4 kHz" },
        { value: 20000, label: "20 kHz" },
        { value: 45000, label: "bat" },
      ],
      help: "440 Hz is the A an orchestra tunes to. Above 20 kHz is ultrasound — a bat calls at 45 kHz.",
    },
    loudness: {
      type: "number", label: "Loudness (dB)", kind: "count",
      min: 0, max: 110, step: 1, default: 60,
      marks: [
        { value: 0, label: "silence" },
        { value: 60, label: "talking" },
        { value: 110, label: "concert" },
      ],
      help: "Decibels. Loudness is the size of the pressure swing, not the pitch.",
    },
    temperature: {
      type: "number", label: "Air temperature", kind: "temperature", unit: "°C",
      min: 253.15, max: 313.15, step: 1, default: 293.15,
      bands: ["6-8", "9-12"],
      marks: [
        { value: 273.15, label: "0 °C" },
        { value: 293.15, label: "20 °C" },
      ],
      help: "Warmer air carries sound faster. It has no effect on water or steel here.",
    },
    target: {
      type: "number", label: "Distance to the wall", kind: "length", unit: "m",
      min: 5, max: 300, step: 5, default: 100,
      help: "Press Launch to send a click, and time how long the echo takes to come back.",
    },
  },
  overlays: [
    { key: "labels", label: "Name the squeezes", default: true },
    { key: "link", label: "Link particle to graph", default: true },
    { key: "ruler", label: "Wavelength ruler", default: true, bands: ["6-8", "9-12"] },
    { key: "hearing", label: "Hearing range", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "speed-in-media",
      title: "Which carries sound fastest?",
      question: "Does sound travel fastest through a gas, a liquid or a solid?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS4-1", "MS-PS4-2"],
      setup: { medium: "air", frequency: 440, loudness: 60, temperature: 293.15, target: 100 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the order",
          instruction: "Air is easy to push through. Steel is not.",
          predict: {
            prompt: "Sound travels fastest through...",
            options: ["air, because it is thin", "water", "steel, because it is packed tight"],
            correct: 2,
            reveal: "Steel, at about 5000 m/s. Sound is a push passed from particle to particle, and tightly bound particles pass the push on almost immediately.",
          },
        },
        {
          id: "echo-air",
          phase: "measure",
          title: "Time an echo in air",
          instruction: "Set the wall to 100 m, press Launch, and record when the echo returns.",
          requireData: 1,
          check: {
            describe: "At least one echo has come back",
            test: (v) => (v.facts.echoes as number) >= 1,
          },
          hints: ["The echo time appears at the top right once the click returns."],
        },
        {
          id: "others",
          phase: "measure",
          title: "Now water and steel",
          instruction: "Repeat in water and in the steel rail, same distance. Record both.",
          requireData: 3,
          check: {
            describe: "You have run the steel rail",
            test: (v) => v.params.medium === "steel",
          },
        },
        {
          id: "vacuum",
          phase: "measure",
          title: "Try a vacuum",
          instruction: "Switch to vacuum and press Launch. Watch what happens.",
          check: {
            describe: "The medium is vacuum",
            test: (v) => v.params.medium === "vacuum",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Order them and explain",
          instruction: "Put the three media in order and say why.",
          write: {
            prompt: "Rank air, water and steel by the speed of sound, and explain the order using particles.",
            placeholder: "Fastest was ... because the particles ... In a vacuum ...",
          },
        },
      ],
    },
    {
      id: "pitch-and-loudness",
      title: "Pitch and loudness are different things",
      question: "Which control changes the wavelength, and which one changes the height of the wave?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS4-1"],
      setup: { medium: "air", frequency: 440, loudness: 40, temperature: 293.15, target: 100 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "You are about to make the sound much louder without changing the pitch.",
          predict: {
            prompt: "Turning the loudness up changes...",
            options: [
              "the wavelength",
              "the height of the wave only",
              "both the height and the wavelength",
            ],
            correct: 1,
            reveal: "Only the height. Loudness is how far the particles swing; pitch is how often they swing. Changing one does not touch the other.",
          },
        },
        {
          id: "loud",
          phase: "measure",
          title: "Change the loudness",
          instruction: "Record the wavelength at 40 dB, then at 100 dB. Same pitch.",
          requireData: 2,
        },
        {
          id: "pitch",
          phase: "measure",
          title: "Now change the pitch",
          instruction: "Back to 60 dB. Record the wavelength at 220, 440 and 880 Hz.",
          requireData: 5,
          hints: ["Look at the ruler under the graph as you change the pitch."],
        },
        {
          id: "product",
          phase: "analyze",
          title: "Multiply them",
          instruction: "For each row, multiply the frequency by the wavelength.",
          write: {
            prompt: "What did frequency × wavelength give every time, and what is that number?",
            placeholder: "Every row gave about ... which is the ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Two separate controls",
          instruction: "Say what each control changes.",
          write: {
            prompt: "Explain what pitch and loudness each change about the wave, and why doubling the pitch halves the wavelength.",
            placeholder: "Pitch changes ... Loudness changes ... Doubling the pitch ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "echo-half-second",
      title: "Half-second echo",
      brief: "Place the wall so the echo comes back in exactly half a second, in air.",
      bands: ["6-8", "9-12"],
      setup: { medium: "air", frequency: 440, loudness: 60, temperature: 293.15, target: 50 },
      goal: {
        describe: "Predicted echo time within 0.02 s of 0.5 s, in air",
        test: (v) =>
          Math.abs((v.facts.echoTime as number) - 0.5) <= 0.02 && v.params.medium === "air",
      },
      stars: {
        two: {
          describe: "Within 0.01 s",
          test: (v) =>
            Math.abs((v.facts.echoTime as number) - 0.5) <= 0.01 && v.params.medium === "air",
        },
        three: {
          describe: "Within 0.01 s, and timed for real",
          test: (v) =>
            Math.abs((v.facts.echoTime as number) - 0.5) <= 0.01 && v.params.medium === "air"
            && Math.abs((v.facts.measuredEcho as number) - 0.5) <= 0.02,
        },
      },
      hints: [
        "The click has to go there and back, so it covers twice the wall distance.",
        "In air at 20 °C, sound covers 343 m in one second.",
        "Half a second there and back is 171 m of travel — so the wall is at half of that.",
      ],
    },
    {
      id: "bat-call",
      title: "Send a bat's call",
      brief: "Set a pitch a bat can use but a person cannot hear, and keep it loud.",
      bands: ["6-8", "9-12"],
      setup: { medium: "air", frequency: 8000, loudness: 60, temperature: 293.15, target: 40 },
      goal: {
        describe: "Above 20 kHz and at least 60 dB",
        test: (v) => Boolean(v.facts.ultrasound) && (v.facts.decibels as number) >= 60,
      },
      stars: {
        two: {
          describe: "Ultrasound with a wavelength under 2 cm",
          test: (v) =>
            Boolean(v.facts.ultrasound) && (v.facts.wavelength as number) < 0.02
            && (v.facts.decibels as number) >= 60,
        },
        three: {
          describe: "Ultrasound under 2 cm, and echo-locate a wall inside 20 m",
          test: (v) =>
            Boolean(v.facts.ultrasound) && (v.facts.wavelength as number) < 0.02
            && (v.facts.wallDistance as number) <= 20 && (v.facts.echoes as number) >= 1,
        },
      },
      hints: [
        "Human hearing stops at 20 kHz. Bats call well above that.",
        "A short wavelength is what lets a bat pick out a small insect.",
      ],
    },
  ],
};
