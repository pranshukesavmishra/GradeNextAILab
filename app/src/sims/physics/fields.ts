import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, sky, sphere, starfield, vignette,
} from "@ui/scene";

/**
 * Fields — Grade 8, Unit C5. The simulation that ties the unit together.
 *
 * Charge, mass and magnetism have each had their own bench. Here they share
 * one: place sources, walk a test probe through the space around them, and
 * watch the same idea appear three times. Something fills the space, it has a
 * size and a direction everywhere, and it is what does the pushing when
 * nothing is touching.
 *
 * Two things make it more than a picture. The probe reads a real number, so
 * the map a student builds by hand can be checked against the computed one.
 * And with the source shaking, the field at the probe is worked out from where
 * the source WAS, one travel time ago — so a disturbance takes time to cross
 * empty space and arrives carrying energy, which is C5.4 in one move.
 *
 * Serves C1.2, C1.3, C1.5 and C5.1-C5.5.
 */

export type FieldKind = "charge" | "mass" | "magnet";

/** Real metres per screen pixel. */
export const M_PER_PX = 0.01;
/** Closer than this to a source the field is not drawn: it would be off-scale. */
const SOFTEN_PX = 13;
/** How fast a disturbance crosses the stage, px/s. Slowed hugely on purpose. */
export const RIPPLE_SPEED = 250;

/**
 * Strength of a single source at distance r (metres).
 *
 *   charge   E = k·q/r²      with q = strength nanocoulombs, in N/C
 *   mass     g = G·M/r²      with M = strength billion kg, in N/kg
 *   magnet   B = µ₀·m/2πr³   with m = strength × 0.02 A·m², in tesla
 *
 * The units differ; the shape does not. That is the whole point of the unit.
 */
export function sourceStrength(kind: FieldKind, strength: number, r: number): number {
  const rr = Math.max(r, SOFTEN_PX * M_PER_PX);
  if (kind === "mass") return (CONSTANTS.G * strength * 1e9) / (rr * rr);
  if (kind === "magnet") return (4e-7 * Math.PI * strength * 0.02) / (2 * Math.PI * rr * rr * rr);
  return (CONSTANTS.k_e * strength * 1e-9) / (rr * rr);
}

export function fieldUnit(kind: FieldKind): string {
  return kind === "mass" ? "N/kg" : kind === "magnet" ? "T" : "N/C";
}

export interface Source {
  x: number;
  y: number;
  /** +1 or −1. Mass has no negative, so mass sources are always +1. */
  sign: number;
}

export interface FieldVector { fx: number; fy: number; mag: number }

/**
 * The field at a point, in pixels in and physical units out. Superposition:
 * every source contributes and the contributions add as vectors.
 */
export function fieldAt(
  sources: readonly Source[], kind: FieldKind, strength: number, x: number, y: number,
): FieldVector {
  let fx = 0, fy = 0;
  for (const s of sources) {
    const dx = (x - s.x) * M_PER_PX;
    const dy = (y - s.y) * M_PER_PX;
    const r = Math.max(Math.hypot(dx, dy), SOFTEN_PX * M_PER_PX);
    const ux = dx / r, uy = dy / r;
    const mag = sourceStrength(kind, strength, r);
    if (kind === "mass") {
      // Mass only ever pulls: every arrow points back at the source.
      fx -= mag * ux;
      fy -= mag * uy;
    } else if (kind === "magnet") {
      // A dipole lying along x, so the pattern loops from pole to pole.
      const dot = s.sign * ux;
      fx += mag * (3 * dot * ux - s.sign);
      fy += mag * (3 * dot * uy);
    } else {
      fx += s.sign * mag * ux;
      fy += s.sign * mag * uy;
    }
  }
  return { fx, fy, mag: Math.hypot(fx, fy) };
}

interface Sample { x: number; y: number; fx: number; fy: number }

interface State {
  sources: Source[];
  probe: { x: number; y: number };
  /** The map the student has built by hand. */
  samples: Sample[];
  dragging: boolean;
  /** Seconds since the source started shaking. */
  shakeT: number;
  t: number;
}

const MAX_SOURCES = 6;
const MAX_SAMPLES = 48;

/** Canonical layouts, in stage pixels, kept compact so they fit any stage. */
function layout(arrangement: string): Source[] {
  switch (arrangement) {
    case "pair":
      return [{ x: 120, y: 150, sign: 1 }, { x: 270, y: 150, sign: 1 }];
    case "dipole":
      return [{ x: 120, y: 150, sign: 1 }, { x: 270, y: 150, sign: -1 }];
    case "triangle":
      return [
        { x: 120, y: 190, sign: 1 }, { x: 270, y: 190, sign: 1 }, { x: 195, y: 70, sign: -1 },
      ];
    case "single":
    default:
      return [{ x: 175, y: 150, sign: 1 }];
  }
}

const model: SimModel<State> = {
  init(params) {
    return {
      sources: layout(params.arrangement as string),
      probe: { x: 320, y: 92 },
      samples: [], dragging: false, shakeT: 0, t: 0,
    };
  },

  applyParams(state, params, prev) {
    if (params.arrangement !== prev.arrangement) {
      return { ...state, sources: layout(params.arrangement as string), samples: [] };
    }
    if (params.keepMap === false && prev.keepMap === true) {
      return { ...state, samples: [] };
    }
    if (params.fieldKind !== prev.fieldKind) {
      // A map of the electric field means nothing once the sources are masses.
      const sources = (params.fieldKind as string) === "mass"
        ? state.sources.map((s) => ({ ...s, sign: 1 }))
        : state.sources;
      return { ...state, samples: [], sources };
    }
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const kind = params.fieldKind as FieldKind;
    const strength = params.strength as number;
    const placing = (params.mode as string) === "place";

    for (const input of inputs) {
      if (input.type === "pointerdown") {
        if (placing) {
          if (s.sources.length < MAX_SOURCES) {
            const sign = kind === "mass" ? 1 : (params.polarity as string) === "negative" ? -1 : 1;
            s = { ...s, sources: [...s.sources, { x: input.x, y: input.y, sign }] };
          }
        } else {
          s = { ...s, dragging: true, probe: { x: input.x, y: input.y } };
        }
      } else if (input.type === "pointermove" && s.dragging) {
        s = { ...s, probe: { x: input.x, y: input.y } };
      } else if (input.type === "pointerup" && s.dragging) {
        // Letting go stamps the reading onto the student's own map.
        const v = fieldAt(s.sources, kind, strength, s.probe.x, s.probe.y);
        const samples = s.samples.length >= MAX_SAMPLES ? s.samples.slice(1) : s.samples.slice();
        samples.push({ x: s.probe.x, y: s.probe.y, fx: v.fx, fy: v.fy });
        s = { ...s, dragging: false, samples };
      }
    }

    const shaking = params.shake as boolean;
    return { ...s, t: s.t + dt, shakeT: shaking ? s.shakeT + dt : 0 };
  },

  readouts(state, params) {
    const kind = params.fieldKind as FieldKind;
    const strength = params.strength as number;
    const v = fieldAt(state.sources, kind, strength, state.probe.x, state.probe.y);
    const nearest = nearestDistance(state);
    const unit = fieldUnit(kind);
    return [
      {
        key: "fieldStrength", label: `Field at the probe (${unit})`, quantity: q(v.mag, "ratio"),
        semantic: "field", graphable: true,
      },
      {
        key: "distance", label: "Distance to nearest source", quantity: q(nearest, "length"),
        unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "invR2", label: "1 ÷ distance²", quantity: q(1 / Math.max(nearest * nearest, 1e-6), "ratio"),
        semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "direction", label: "Field direction",
        quantity: q(Math.atan2(-v.fy, v.fx), "angle"), unit: "°",
        semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "arrival", label: "Travel time to the probe",
        quantity: q(nearest / (RIPPLE_SPEED * M_PER_PX), "time"),
        unit: "s", semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "mapped", label: "Points you have mapped", quantity: q(state.samples.length, "count"),
        semantic: "distance", graphable: false,
      },
    ];
  },

  facts(state, params) {
    const kind = params.fieldKind as FieldKind;
    const strength = params.strength as number;
    const v = fieldAt(state.sources, kind, strength, state.probe.x, state.probe.y);
    const nearest = nearestDistance(state);
    const travel = nearest / (RIPPLE_SPEED * M_PER_PX);
    return {
      fieldStrength: v.mag,
      fieldX: v.fx,
      fieldY: v.fy,
      distance: nearest,
      sources: state.sources.length,
      mapped: state.samples.length,
      kind,
      // A field is not nothing: it has a value at points with no matter in them.
      fieldInEmptySpace: v.mag > 0,
      shaking: Boolean(params.shake),
      travelTime: travel,
      // Energy from the shaking source has reached the probe.
      disturbanceArrived: Boolean(params.shake) && state.shakeT > travel,
      probeShake: probeShake(state, params),
    };
  },
};

function nearestDistance(state: State): number {
  let best = Infinity;
  for (const s of state.sources) {
    best = Math.min(best, Math.hypot(state.probe.x - s.x, state.probe.y - s.y) * M_PER_PX);
  }
  return Number.isFinite(best) ? Math.max(best, SOFTEN_PX * M_PER_PX) : 0;
}

/**
 * How much the probe is being shaken right now.
 *
 * The field at the probe is worked out from where the source was one travel
 * time ago, so nothing reaches the probe until the disturbance has crossed the
 * gap — and when it does, the probe starts moving. That is energy carried
 * across empty space with no medium in between.
 */
function probeShake(state: State, params: Record<string, number | boolean | string>): number {
  if (!params.shake) return 0;
  const travel = nearestDistance(state) / (RIPPLE_SPEED * M_PER_PX);
  if (state.shakeT <= travel) return 0;
  const retarded = state.shakeT - travel;
  // The far field of a shaken source falls off more slowly than the static
  // one, which is why a radio signal still reaches you across a city.
  const reach = Math.max(nearestDistance(state), 0.1);
  return Math.sin(2 * Math.PI * 0.55 * retarded) / reach;
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function sourceColor(rc: RenderContext<State>, kind: FieldKind, sign: number): string {
  const { theme } = rc;
  if (kind === "mass") return theme.sci["mass"];
  return sign > 0 ? theme.sci["charge-pos"] : theme.sci["charge-neg"];
}

/** A readable number for a field that might be 1e-7 T or 3000 N/C. */
export function formatField(value: number, kind: FieldKind): string {
  const unit = fieldUnit(kind);
  if (kind === "magnet") return `${(value * 1e6).toFixed(2)} µT`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} k${unit}`;
  if (value >= 1) return `${value.toFixed(2)} ${unit}`;
  return `${(value * 1000).toFixed(2)} m${unit}`;
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const kind = params.fieldKind as FieldKind;
  const strength = params.strength as number;
  const shaking = params.shake as boolean;

  sky(ctx, width, height, theme, "space");
  starfield(ctx, width, height, 70, 5);

  // Where each source is right now: shaking moves it up and down.
  const shown = state.sources.map((s, i) => ({
    ...s,
    y: shaking && i === 0 ? s.y + Math.sin(2 * Math.PI * 0.55 * state.shakeT) * 13 : s.y,
  }));

  /* ---- the computed field, filling the space ---- */
  if (overlays.map) {
    const spacing = width < 500 ? 40 : 46;
    let peak = 1e-30;
    const cells: { x: number; y: number; v: FieldVector }[] = [];
    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        const v = fieldAt(shown, kind, strength, x, y);
        peak = Math.max(peak, v.mag);
        cells.push({ x, y, v });
      }
    }
    ctx.save();
    for (const cell of cells) {
      if (cell.v.mag <= 0) continue;
      // Arrows are scaled by the cube root of the field so a 1/r² fall-off
      // stays legible right across the stage instead of collapsing to dots.
      const t = Math.cbrt(cell.v.mag / peak);
      const len = 6 + t * (spacing * 0.42);
      const ux = cell.v.fx / cell.v.mag, uy = cell.v.fy / cell.v.mag;
      ctx.globalAlpha = 0.25 + 0.55 * t;
      arrow(
        ctx, cell.x - ux * len * 0.5, cell.y + uy * len * 0.5,
        cell.x + ux * len * 0.5, cell.y - uy * len * 0.5,
        theme.sci["field"], { width: 1.4, head: 5 },
      );
    }
    ctx.restore();
  }

  /* ---- the ripples: a change in the field, crossing empty space ---- */
  if (shaking && overlays.ripples && shown.length) {
    const src = shown[0];
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["wave"], 0.55);
    ctx.lineWidth = 1.8;
    for (let n = 0; n < 6; n++) {
      const born = state.shakeT - n / 0.55;
      if (born <= 0) continue;
      const r = born * RIPPLE_SPEED;
      if (r > Math.hypot(width, height)) continue;
      ctx.globalAlpha = 0.55 * Math.max(0, 1 - r / Math.hypot(width, height));
      ctx.beginPath();
      ctx.arc(src.x, src.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- the student's own map ---- */
  if (overlays.samples) {
    ctx.save();
    for (const sample of state.samples) {
      const mag = Math.hypot(sample.fx, sample.fy);
      if (mag <= 0) continue;
      const len = 26;
      const ux = sample.fx / mag, uy = sample.fy / mag;
      arrow(
        ctx, sample.x, sample.y, sample.x + ux * len, sample.y - uy * len,
        theme.accent, { width: 2, head: 7 },
      );
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(sample.x, sample.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the sources ---- */
  for (const s of shown) {
    const color = sourceColor(rc, kind, s.sign);
    glow(ctx, s.x, s.y, 34, color, 0.4);
    sphere(ctx, s.x, s.y, 15, color, { glow: 0.3 });
    ctx.save();
    ctx.fillStyle = theme.surface;
    ctx.font = "700 15px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(kind === "mass" ? "M" : kind === "magnet" ? (s.sign > 0 ? "N" : "S") : s.sign > 0 ? "+" : "−", s.x, s.y + 1);
    ctx.restore();
  }

  /* ---- the probe ---- */
  const v = fieldAt(shown, kind, strength, state.probe.x, state.probe.y);
  const shake = probeShake(state, params);
  const px = state.probe.x;
  const py = state.probe.y + shake * 26;
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.moveTo(px - 15, py);
  ctx.lineTo(px + 15, py);
  ctx.moveTo(px, py - 15);
  ctx.lineTo(px, py + 15);
  ctx.stroke();
  ctx.restore();
  if (v.mag > 0) {
    // Length is judged against the field 40 px from a source, so the arrow
    // says "strong" or "weak" without ever running off the stage.
    const reference = Math.max(1e-30, sourceStrength(kind, strength, 40 * M_PER_PX));
    const len = 24 + 36 * Math.cbrt(Math.min(1, v.mag / reference));
    arrow(ctx, px, py, px + (v.fx / v.mag) * len, py - (v.fy / v.mag) * len, theme.sci["field"], {
      width: 3, head: 10,
    });
  }
  badge(ctx, px, py - 34, formatField(v.mag, kind), theme, {
    align: "center", color: theme.sci["field"], sub: "at the probe",
  });

  /* ---- the fall-off, as a curve the probe walks along ---- */
  if (overlays.inset && band !== "3-5") drawInset(rc, kind, strength);

  /* ---- words ---- */
  const kindWord = kind === "mass" ? "gravitational" : kind === "magnet" ? "magnetic" : "electric";
  caption(ctx, 14, 22, `${kindWord} field`, theme, { size: 15, color: theme.ink, weight: 800 });
  caption(
    ctx, 14, 42,
    (params.mode as string) === "place" ? "tap the empty space to add a source" : "drag the probe; let go to stamp a reading",
    theme, { size: 11, color: theme.inkSoft },
  );
  if (kind === "mass" && band !== "3-5") {
    caption(ctx, 14, 62, "every arrow points inward: mass has no opposite", theme, {
      size: 11, color: theme.inkSoft,
    });
  }
  if (shaking && band !== "3-5") {
    const travel = nearestDistance(state) / (RIPPLE_SPEED * M_PER_PX);
    caption(
      ctx, 14, height - 16,
      state.shakeT > travel
        ? `the shake reached the probe after ${travel.toFixed(2)} s — energy crossed empty space`
        : `the shake is on its way: ${travel.toFixed(2)} s to reach the probe`,
      theme, { size: 12, color: theme.sci["wave"] },
    );
  }
  vignette(ctx, width, height, 0.2);
}

/** Field strength against distance, with the probe's own reading marked. */
function drawInset(rc: RenderContext<State>, kind: FieldKind, strength: number) {
  const { ctx, state, theme, width } = rc;
  const w = Math.min(190, width * 0.3);
  const h = w * 0.6;
  if (w < 100) return;
  const x0 = width - w - 14, y0 = 14;

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.7 : 0.82);
  roundRect(ctx, x0, y0, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const rMin = 0.15, rMax = 4;
  const fMax = sourceStrength(kind, strength, rMin);
  const px = (r: number) => x0 + 12 + ((r - rMin) / (rMax - rMin)) * (w - 24);
  const py = (f: number) => y0 + h - 14 - Math.min(1, f / fMax) * (h - 30);

  ctx.save();
  ctx.strokeStyle = theme.sci["field"];
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const r = rMin + ((rMax - rMin) * i) / 60;
    const sx = px(r), sy = py(sourceStrength(kind, strength, r));
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  const here = Math.min(rMax, Math.max(rMin, nearestDistance(state)));
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(px(here), py(sourceStrength(kind, strength, here)), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  caption(ctx, x0 + 12, y0 + 12, "field against distance", theme, { size: 10, color: theme.inkSoft });
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const fieldsSim: SimManifest<State> = {
  id: "phys.fields",
  title: "Fields",
  tagline: "Place a source, walk a probe around it, and map the something that fills the space.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS2-5", "MS-PS2-3", "HS-PS2-4", "HS-PS3-5"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Describe a field as something with a size and a direction at every point in space.",
    "Map a field by measuring it at many points, and compare that map with the computed one.",
    "Show that fields add: two sources make one combined field, with places where it cancels.",
    "Recognise the same 1 ÷ distance² pattern in electric and gravitational fields.",
    "Explain how a change in a field carries energy across empty space, taking time to arrive.",
  ],
  misconceptions: [
    "A force needs contact, or something in between, to act",
    "The field is only there when something is in it to feel it",
    "Nothing can travel through empty space",
    "A change in the field is felt everywhere instantly",
    "Gravitational fields can point away from a mass",
  ],
  interactionHint: "Drag the probe around, then let go to stamp a reading.",
  params: {
    fieldKind: {
      type: "option", label: "Kind of field",
      options: [
        { value: "charge", label: "Electric (charges)" },
        { value: "mass", label: "Gravitational (masses)" },
        { value: "magnet", label: "Magnetic (poles)" },
      ],
      default: "charge",
      help: "The units change. The shape of the map does not.",
    },
    arrangement: {
      type: "option", label: "Starting arrangement",
      options: [
        { value: "single", label: "One source" },
        { value: "pair", label: "Two the same" },
        { value: "dipole", label: "One of each" },
        { value: "triangle", label: "Three sources" },
      ],
      default: "single",
    },
    mode: {
      type: "option", label: "Tapping the stage",
      options: [
        { value: "probe", label: "Moves the probe" },
        { value: "place", label: "Adds a source" },
      ],
      default: "probe",
    },
    polarity: {
      type: "option", label: "New source is",
      options: [
        { value: "positive", label: "Positive / north" },
        { value: "negative", label: "Negative / south" },
      ],
      default: "positive",
      bands: ["6-8", "9-12"],
      help: "Mass has no negative, so gravitational sources are always positive.",
    },
    strength: {
      type: "number", label: "Source strength", kind: "count",
      min: 1, max: 50, step: 1, default: 10,
      help: "Nanocoulombs of charge, billions of kilograms of mass, or a magnet's moment.",
    },
    shake: {
      type: "boolean", label: "Shake the first source", default: false,
      help: "The change in the field spreads outward and takes time to arrive.",
    },
    keepMap: {
      type: "boolean", label: "Keep my map", default: true,
      help: "Switch this off to wipe the arrows you have stamped.",
    },
  },
  overlays: [
    { key: "map", label: "Computed field map", default: false },
    { key: "samples", label: "My mapped points", default: true },
    { key: "ripples", label: "Ripples", default: true },
    { key: "inset", label: "Field–distance curve", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "map-a-field",
      title: "Map a field by hand",
      question: "What is actually there in the space around a charge?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-5"],
      setup: { fieldKind: "charge", arrangement: "single", mode: "probe", strength: 10, shake: false, keepMap: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the map",
          instruction: "One positive source sits in empty space.",
          predict: {
            prompt: "If you measure at a point twice as far from the source, the field will be...",
            options: ["twice as strong", "half as strong", "a quarter as strong", "the same"],
            correct: 2,
            reveal: "A quarter. The electric field follows 1 ÷ distance², the same shape as the force it would put on a charge placed there.",
          },
        },
        {
          id: "stamp",
          phase: "measure",
          title: "Stamp twelve points",
          instruction: "Drag the probe somewhere and let go. Do that all around the source.",
          check: {
            describe: "At least 12 points mapped",
            test: (v) => (v.facts.mapped as number) >= 12,
          },
          hints: [
            "Go all the way round, not just along one line.",
            "Include points close in and points far out.",
          ],
        },
        {
          id: "record",
          phase: "measure",
          title: "Record four distances",
          instruction: "Park the probe at four distances and record the field each time.",
          requireData: 4,
        },
        {
          id: "reveal",
          phase: "analyze",
          title: "Compare with the computed map",
          instruction: "Turn on the computed field map overlay. Does yours agree?",
          write: {
            prompt: "Where did your arrows match the computed map, and where were they different?",
            placeholder: "My arrows matched ... but near the source ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what a field is",
          instruction: "Write a definition using what you measured.",
          write: {
            prompt: "What is a field, and what is there at a point where you measured one but nothing is sitting?",
            placeholder: "A field is ... Even with nothing there, the space has ...",
          },
        },
      ],
    },
    {
      id: "energy-across-space",
      title: "Sending energy across nothing",
      question: "If you shake a source, when does the far-away probe find out?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-5", "MS-PS4-2"],
      setup: { fieldKind: "charge", arrangement: "single", mode: "probe", strength: 20, shake: false, keepMap: true },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "You are about to shake the source up and down.",
          predict: {
            prompt: "A probe two metres away starts moving...",
            options: [
              "at the very same instant",
              "after a short delay, once the change gets there",
              "never — there is nothing in between to carry it",
            ],
            correct: 1,
            reveal: "After a delay. The change in the field travels outward at a fixed speed — in reality the speed of light — and carries energy with it. That is how sunlight crosses 150 million km of vacuum.",
          },
        },
        {
          id: "near",
          phase: "measure",
          title: "Probe near, then far",
          instruction: "Switch the shaking on. Put the probe close, then far, and record both.",
          requireData: 2,
          check: {
            describe: "The source is shaking",
            test: (v) => v.params.shake === true,
          },
        },
        {
          id: "timing",
          phase: "analyze",
          title: "Compare the travel times",
          instruction: "Read the travel time at two distances. What is the pattern?",
          write: {
            prompt: "How did the travel time change when you doubled the distance?",
            placeholder: "At twice the distance the travel time was ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain sunlight",
          instruction: "Space between the Sun and Earth is nearly empty.",
          write: {
            prompt: "Use the field idea to explain how energy from the Sun reaches Earth across empty space.",
            placeholder: "The Sun's field ... the change spreads ... which is why sunlight takes 8 minutes ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-the-null",
      title: "Find the dead spot",
      brief: "Two identical sources make one place where the field cancels completely. Park the probe there.",
      bands: ["6-8", "9-12"],
      setup: { fieldKind: "charge", arrangement: "pair", mode: "probe", strength: 10, shake: false },
      goal: {
        describe: "Field at the probe below 5 N/C",
        test: (v) => (v.facts.fieldStrength as number) < 5 && (v.facts.sources as number) >= 2,
      },
      stars: {
        two: {
          describe: "Below 1 N/C",
          test: (v) => (v.facts.fieldStrength as number) < 1 && (v.facts.sources as number) >= 2,
        },
        three: {
          describe: "Below 0.2 N/C",
          test: (v) => (v.facts.fieldStrength as number) < 0.2 && (v.facts.sources as number) >= 2,
        },
      },
      hints: [
        "The two sources push the probe in opposite directions somewhere between them.",
        "Try exactly halfway. Then nudge until the arrow disappears.",
      ],
    },
    {
      id: "map-it-well",
      title: "A map worth keeping",
      brief: "Stamp twenty readings around a pair of opposite sources.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { fieldKind: "charge", arrangement: "dipole", mode: "probe", strength: 10, keepMap: true },
      goal: {
        describe: "20 points mapped",
        test: (v) => (v.facts.mapped as number) >= 20,
      },
      stars: {
        two: {
          describe: "30 points mapped",
          test: (v) => (v.facts.mapped as number) >= 30,
        },
        three: {
          describe: "40 points mapped",
          test: (v) => (v.facts.mapped as number) >= 40,
        },
      },
      hints: [
        "Drag the probe, let go, drag again. Each release leaves an arrow.",
        "Cover the space all round, not just the line between the two sources.",
      ],
    },
  ],
};
