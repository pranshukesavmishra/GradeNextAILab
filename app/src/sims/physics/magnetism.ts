import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow } from "@ui/draw";
import {
  badge, caption, contactShadow, glow, groundPlane, hexA, isDarkTheme, material, sky, sphere,
  vignette,
} from "@ui/scene";

/**
 * Magnetism — Grade 8, Unit C3.
 *
 * Three benches in one simulation, because magnetism only makes sense when the
 * permanent magnet, the electromagnet and the compass are the same phenomenon:
 *
 *   poles         two bar magnets, iron filings, and a force that dies away
 *                 far faster than gravity or electricity ever does
 *   electromagnet a coil the student winds and powers, measured in paperclips
 *   earth         a compass sitting in a 50 µT planet-sized field, and how
 *                 easily one small magnet in the room overrides it
 *
 * Every number is the real one: B = µ₀·N·I / L inside a solenaid-shaped coil,
 * the axial dipole field µ₀m / 2πr³ outside a bar magnet, and Earth's field at
 * about 50 µT with a horizontal part near 25 µT at mid-latitudes.
 *
 * Serves C3.1 poles, C3.2 magnetic materials, C3.3 current makes magnetism,
 * C3.4 building an electromagnet, C3.5 Earth's field, and C1.4 attraction and
 * repulsion.
 */

/** Magnetic constant, N/A². (The 2019 SI value differs in the 10th digit.) */
export const MU0 = 4 * Math.PI * 1e-7;

/** Earth's total field is 25-65 µT; this is a typical mid-latitude value. */
export const EARTH_FIELD = 50e-6;
/** A compass needle is horizontal, so only this part of the field turns it. */
export const EARTH_HORIZONTAL = 25e-6;

/** Bench geometry: pointer pixels convert to metres with one fixed scale. */
export const ANCHOR_PX = 96;
export const M_PER_PX = 0.0006;
export const R_MIN = 0.03;
export const R_MAX = 0.4;

/** Relative permeability of the core a student can drop into the coil. */
export const CORE_MU: Record<string, number> = {
  // Copper is a metal and conducts beautifully — and does nothing at all here.
  air: 1, copper: 1, iron: 200,
};

/** Field inside a long coil: B = µ₀ · µr · N · I / L. */
export function solenoidField(turns: number, current: number, length: number, mu = 1): number {
  return (MU0 * mu * turns * current) / Math.max(length, 1e-4);
}

/** Field on the axis of a bar magnet, treated as a dipole: B = µ₀m / 2πr³. */
export function dipoleAxialField(moment: number, r: number): number {
  const rr = Math.max(r, 1e-4);
  return (MU0 * moment) / (2 * Math.PI * rr * rr * rr);
}

/**
 * Force between two bar magnets end to end: F = 3µ₀m₁m₂ / 2πr⁴.
 *
 * The 1/r⁴ is the point of the whole scene — magnetic force dies away far
 * faster than the 1/r² of gravity or electric charge, which is exactly why a
 * fridge magnet does nothing until it is almost touching.
 */
export function dipoleForce(m1: number, m2: number, r: number): number {
  const rr = Math.max(r, 1e-4);
  return (3 * MU0 * m1 * m2) / (2 * Math.PI * rr * rr * rr * rr);
}

/**
 * Paperclips a pole face can hold. Estimated from the magnetic pressure
 * B²/2µ₀ over a small contact patch, with a 1 g clip. A teaching estimate,
 * kept deliberately conservative — it is a measurement students compare
 * against each other, not a specification.
 */
export function clipsLifted(field: number): number {
  const contactArea = 2e-6;         // m², roughly the tip of a paperclip
  const clipWeight = 0.001 * 9.80665; // N, one gram
  return Math.floor(((field * field * contactArea) / (2 * MU0)) / clipWeight);
}

/** Where a compass needle points, in degrees clockwise from geographic north. */
export function compassBearing(magnetField: number, declinationDeg: number, flipped: boolean): number {
  // Earth's horizontal field points to magnetic north, offset from geographic
  // north by the declination. The bar magnet sits due east of the compass and
  // adds a field along the east-west line.
  const dec = (declinationDeg * Math.PI) / 180;
  const north = EARTH_HORIZONTAL * Math.cos(dec);
  const east = EARTH_HORIZONTAL * Math.sin(dec) + (flipped ? 1 : -1) * magnetField;
  return (Math.atan2(east, north) * 180) / Math.PI;
}

interface State {
  /** Separation of the two magnets, or compass to magnet, m. Dragged. */
  r: number;
  dragging: boolean;
  /** Compass needle angle and rate, degrees — a real needle swings and settles. */
  needle: number;
  needleRate: number;
  /** Animation phase for the current dots running round the coil. */
  flow: number;
  t: number;
}

function magnetMoment(params: Record<string, number | boolean | string>): number {
  return params.magnetStrength as number;
}

/** Field the bar magnet contributes where the compass sits. */
function magnetFieldAtCompass(state: State, params: Record<string, number | boolean | string>): number {
  return dipoleAxialField(magnetMoment(params), state.r);
}

function coilField(params: Record<string, number | boolean | string>): number {
  const mu = CORE_MU[params.core as string] ?? 1;
  return solenoidField(params.turns as number, params.current as number, params.coilLength as number, mu);
}

const model: SimModel<State> = {
  init(params) {
    const start = (params.scene as string) === "earth" ? 0.18 : 0.08;
    return { r: start, dragging: false, needle: 0, needleRate: 0, flow: 0, t: 0 };
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      if (input.type === "pointerdown" && input.x > ANCHOR_PX + 14) {
        s = { ...s, dragging: true, r: snapR(input.x) };
      } else if (input.type === "pointermove" && s.dragging) {
        s = { ...s, r: snapR(input.x) };
      } else if (input.type === "pointerup") {
        s = { ...s, dragging: false };
      }
    }

    // The needle: a torsional oscillator settling onto the field direction.
    // Damped, so it swings a little and stops, the way a real compass does.
    const target = compassBearing(
      magnetFieldAtCompass(s, params), params.declination as number, params.flipMagnet as boolean,
    );
    let delta = target - s.needle;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const rate = s.needleRate + (60 * delta - 9 * s.needleRate) * dt;
    let needle = s.needle + rate * dt;
    while (needle > 180) needle -= 360;
    while (needle < -180) needle += 360;

    const current = params.current as number;
    return {
      ...s,
      needle, needleRate: rate,
      flow: (s.flow + dt * current * 0.9) % 1,
      t: s.t + dt,
    };
  },

  readouts(state, params) {
    const scene = params.scene as string;

    if (scene === "electromagnet") {
      const b = coilField(params);
      return [
        {
          key: "coilField", label: "Field inside the coil", quantity: q(b, "magneticField"),
          unit: "mT", semantic: "field", graphable: true,
        },
        {
          key: "current", label: "Current", quantity: q(params.current as number, "current"),
          unit: "A", semantic: "current", graphable: true,
        },
        {
          key: "turns", label: "Turns of wire", quantity: q(params.turns as number, "count"),
          semantic: "current", graphable: true,
        },
        {
          key: "ampTurns", label: "Turns × current", quantity: q((params.turns as number) * (params.current as number), "count"),
          semantic: "current", graphable: true, bands: ["6-8", "9-12"],
        },
        {
          key: "clips", label: "Paperclips held", quantity: q(clipsLifted(b), "count"),
          semantic: "mass", graphable: true,
        },
      ];
    }

    if (scene === "earth") {
      const magnet = magnetFieldAtCompass(state, params);
      return [
        {
          key: "bearing", label: "Compass bearing", quantity: q((state.needle * Math.PI) / 180, "angle"),
          unit: "°", semantic: "field", graphable: true,
        },
        {
          key: "magnetField", label: "Field from the bar magnet", quantity: q(magnet, "magneticField"),
          unit: "mT", semantic: "field", graphable: true,
        },
        {
          key: "earthField", label: "Earth's field", quantity: q(EARTH_FIELD, "magneticField"),
          unit: "mT", semantic: "field", graphable: false,
        },
        {
          key: "distance", label: "Magnet distance", quantity: q(state.r, "length"),
          unit: "m", semantic: "distance", graphable: true,
        },
        {
          key: "ratio", label: "Magnet field ÷ Earth's field", quantity: q(magnet / EARTH_HORIZONTAL, "ratio"),
          semantic: "field", graphable: true, bands: ["6-8", "9-12"],
        },
      ];
    }

    const m = magnetMoment(params);
    const force = dipoleForce(m, m, state.r);
    return [
      {
        key: "force", label: "Force on each magnet", quantity: q(force, "force"),
        unit: "N", semantic: "force", graphable: true,
      },
      {
        key: "separation", label: "Gap between the magnets", quantity: q(state.r, "length"),
        unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "fieldAtGap", label: "Field at the other magnet", quantity: q(dipoleAxialField(m, state.r), "magneticField"),
        unit: "mT", semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "invR4", label: "1 ÷ (gap)⁴", quantity: q(1 / Math.pow(state.r, 4), "ratio"),
        semantic: "distance", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const scene = params.scene as string;
    const m = magnetMoment(params);
    const b = coilField(params);
    const magnetAtCompass = magnetFieldAtCompass(state, params);
    // North faces north on both: they repel. Flip one and they attract.
    const repel = (params.flipMagnet as boolean) === false;
    return {
      scene,
      separation: state.r,
      force: dipoleForce(m, m, state.r),
      fieldAtGap: dipoleAxialField(m, state.r),
      repel,
      attract: !repel,
      coilField: b,
      clips: clipsLifted(b),
      coreFactor: CORE_MU[params.core as string] ?? 1,
      ampTurns: (params.turns as number) * (params.current as number),
      bearing: state.needle,
      settledBearing: compassBearing(magnetAtCompass, params.declination as number, params.flipMagnet as boolean),
      deflection: Math.abs(
        compassBearing(magnetAtCompass, params.declination as number, params.flipMagnet as boolean)
        - (params.declination as number),
      ),
      magnetFieldAtCompass: magnetAtCompass,
      earthField: EARTH_FIELD,
      earthHorizontal: EARTH_HORIZONTAL,
    };
  },
};

function snapR(pointerX: number): number {
  const raw = (pointerX - ANCHOR_PX) * M_PER_PX;
  const snapped = Math.round(raw * 200) / 200;   // nearest half-centimetre
  return Math.min(R_MAX, Math.max(R_MIN, snapped));
}

/* ------------------------------------------------------------------ *
 * Render
 *
 * A magnet's north pole is drawn in the positive-charge colour and its south
 * in the negative-charge colour, on purpose: the point of Unit C is that
 * charge, magnetism and gravity are one idea, and the colours carry that
 * across the three simulations rather than inventing a fourth vocabulary.
 * ------------------------------------------------------------------ */

/** Field of a bar magnet lying along x, evaluated in screen pixels. */
function barField(px: number, py: number, cx: number, cy: number, moment: number, flipped: boolean) {
  const mx = flipped ? -moment : moment;
  const dx = px - cx, dy = py - cy;
  const r2 = Math.max(dx * dx + dy * dy, 100);
  const r = Math.sqrt(r2);
  const ux = dx / r, uy = dy / r;
  const dot = mx * ux;
  // Dipole field, in arbitrary units: 3(m·r̂)r̂ − m, falling as 1/r³.
  return { bx: (3 * dot * ux - mx) / (r2 * r), by: (3 * dot * uy) / (r2 * r) };
}

function drawBarMagnet(
  rc: RenderContext<State>, cx: number, cy: number, w: number, h: number, flipped: boolean,
) {
  const { ctx, theme } = rc;
  const north = theme.sci["charge-pos"];
  const south = theme.sci["charge-neg"];
  const left = flipped ? north : south;
  const right = flipped ? south : north;
  material(ctx, cx - w / 2, cy - h / 2, w / 2, h, left, 3);
  material(ctx, cx, cy - h / 2, w / 2, h, right, 3);
  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.font = `700 ${Math.min(15, h * 0.6)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(flipped ? "N" : "S", cx - w / 4, cy);
  ctx.fillText(flipped ? "S" : "N", cx + w / 4, cy);
  ctx.restore();
}

/** Iron filings: short strokes lying along the field, on a jittered lattice. */
function drawFilings(
  rc: RenderContext<State>,
  fieldAt: (x: number, y: number) => { bx: number; by: number },
) {
  const { ctx, theme, width, height } = rc;
  const spacing = width < 500 ? 26 : 21;
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.55);
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i * spacing < width + spacing; i++) {
    for (let j = 0; j * spacing < height + spacing; j++) {
      // A fixed hash, not a random draw: the filings must not swim about.
      const jitter = ((i * 73856093) ^ (j * 19349663)) % 1000;
      const x = i * spacing + (jitter % 11) - 5;
      const y = j * spacing + ((jitter / 11) % 11) - 5;
      const { bx, by } = fieldAt(x, y);
      const mag = Math.hypot(bx, by);
      if (!Number.isFinite(mag) || mag === 0) continue;
      const len = 4 + 4 * Math.min(1, mag * 4e6);
      ctx.globalAlpha = 0.2 + 0.55 * Math.min(1, mag * 6e6);
      ctx.beginPath();
      ctx.moveTo(x - (bx / mag) * len, y - (by / mag) * len);
      ctx.lineTo(x + (bx / mag) * len, y + (by / mag) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFieldLines(
  rc: RenderContext<State>,
  seeds: { x: number; y: number; dir: number }[],
  fieldAt: (x: number, y: number) => { bx: number; by: number },
) {
  const { ctx, theme, width, height } = rc;
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["field"], 0.65);
  ctx.lineWidth = 1.3;
  for (const seed of seeds) {
    let x = seed.x, y = seed.y;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 200; step++) {
      const { bx, by } = fieldAt(x, y);
      const mag = Math.hypot(bx, by);
      if (!Number.isFinite(mag) || mag === 0) break;
      x += (seed.dir * 4 * bx) / mag;
      y += (seed.dir * 4 * by) / mag;
      if (x < -60 || x > width + 60 || y < -60 || y > height + 60) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function renderPoles(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const benchY = Math.round(height * 0.74);
  const railY = Math.round(height * 0.5);
  const moment = magnetMoment(params);
  const flipped = params.flipMagnet as boolean;

  sky(ctx, width, height, theme, "indoor", benchY);
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  const ax = ANCHOR_PX;
  const bx = ANCHOR_PX + state.r / M_PER_PX;
  const magW = Math.min(84, Math.max(48, width * 0.09));
  const magH = 26;

  const fieldAt = (x: number, y: number) => {
    const a = barField(x, y, ax, railY, moment, false);
    const b = barField(x, y, bx, railY, moment, flipped);
    return { bx: a.bx + b.bx, by: a.by + b.by };
  };

  if (overlays.filings) drawFilings(rc, fieldAt);
  if (overlays.fieldLines) {
    const seeds: { x: number; y: number; dir: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI;
      seeds.push({ x: ax + magW / 2 + 6 + Math.cos(a) * 8, y: railY + Math.sin(a) * 14, dir: 1 });
      seeds.push({ x: ax - magW / 2 - 6 - Math.cos(a) * 8, y: railY + Math.sin(a) * 14, dir: -1 });
    }
    drawFieldLines(rc, seeds, fieldAt);
  }

  for (const [x, flip] of [[ax, false], [bx, flipped]] as const) {
    contactShadow(ctx, x, benchY, magW / 2, benchY - railY);
    drawBarMagnet(rc, x, railY, magW, magH, flip);
  }

  /* ---- the force pair ---- */
  const force = dipoleForce(moment, moment, state.r);
  if (overlays.forces) {
    const len = 18 + 90 * (force / (force + 0.25));
    const dir = flipped ? 1 : -1;   // flipped = unlike poles facing = pulled in
    arrow(ctx, ax, railY - magH, ax + dir * len, railY - magH, theme.sci["force"], { width: 3 });
    arrow(ctx, bx, railY - magH, bx - dir * len, railY - magH, theme.sci["force"], { width: 3 });
    badge(ctx, (ax + bx) / 2, railY - magH - 34, formatForce(force), theme, {
      align: "center", color: theme.sci["force"], sub: "on each magnet",
    });
  }

  badge(ctx, (ax + bx) / 2, benchY - 18, `${(state.r * 100).toFixed(1)} cm`, theme, {
    align: "center", color: theme.sci["distance"],
  });
  caption(ctx, 14, 22, flipped ? "unlike poles face: they pull together" : "like poles face: they push apart", theme, {
    size: 13, color: theme.ink,
  });
  if (band === "9-12") {
    caption(ctx, 14, 42, "F ∝ 1 ÷ gap⁴ — magnetism dies away fast", theme, {
      size: 11, color: theme.inkSoft,
    });
  }
  caption(ctx, width - 12, height - 12, "drag the right magnet", theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });
}

function formatForce(force: number): string {
  if (force >= 1) return `${force.toFixed(2)} N`;
  if (force >= 0.001) return `${(force * 1000).toFixed(1)} mN`;
  return `${(force * 1e6).toFixed(1)} µN`;
}

function renderElectromagnet(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const benchY = Math.round(height * 0.8);
  const cy = Math.round(height * 0.44);
  const turns = params.turns as number;
  const current = params.current as number;
  const core = params.core as string;
  const b = coilField(params);
  const clips = clipsLifted(b);

  sky(ctx, width, height, theme, "indoor", benchY);
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  const coilX0 = Math.round(width * 0.26);
  const coilX1 = Math.round(width * 0.68);
  const coilW = coilX1 - coilX0;
  const coreH = 30;

  /* ---- field through and around the coil ---- */
  if (overlays.fieldLines) {
    const fieldAt = (x: number, y: number) =>
      barField(x, y, (coilX0 + coilX1) / 2, cy, Math.max(0.02, b * 400), false);
    const seeds: { x: number; y: number; dir: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI;
      seeds.push({ x: coilX1 + 10 + Math.cos(a) * 6, y: cy + Math.sin(a) * 12, dir: 1 });
      seeds.push({ x: coilX0 - 10 - Math.cos(a) * 6, y: cy + Math.sin(a) * 12, dir: -1 });
    }
    if (b > 0) drawFieldLines(rc, seeds, fieldAt);
  }

  /* ---- the core ---- */
  const coreColor = core === "iron" ? theme.sci["mass"] : core === "copper" ? theme.sci["current"] : theme.inkSoft;
  if (core === "air") {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(coilX0 - 20, cy - coreH / 2, coilW + 40, coreH);
    ctx.restore();
  } else {
    material(ctx, coilX0 - 20, cy - coreH / 2, coilW + 40, coreH, coreColor, 4);
  }

  /* ---- the winding: more turns, more loops on screen ---- */
  const drawn = Math.max(3, Math.min(18, Math.round(turns / 12)));
  ctx.save();
  ctx.strokeStyle = theme.sci["current"];
  ctx.lineWidth = 3;
  for (let i = 0; i < drawn; i++) {
    const x = coilX0 + ((i + 0.5) / drawn) * coilW;
    ctx.beginPath();
    ctx.ellipse(x, cy, 6, coreH * 0.78, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  /* ---- current, as dots that actually move ---- */
  if (current > 0 && overlays.current) {
    ctx.save();
    ctx.fillStyle = theme.sci["current"];
    for (let i = 0; i < 14; i++) {
      const t = (i / 14 + state.flow) % 1;
      const x = coilX0 - 20 + t * (coilW + 40);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x, cy - coreH * 0.78, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- battery ---- */
  const batX = coilX0 - 78;
  material(ctx, batX, cy - 16, 40, 32, theme.sci["energy-potential"], 4);
  ctx.save();
  ctx.strokeStyle = theme.sci["current"];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(batX + 40, cy - 10);
  ctx.lineTo(coilX0 - 20, cy - 10);
  ctx.moveTo(batX + 40, cy + 10);
  ctx.lineTo(coilX0 - 20, cy + 10);
  ctx.stroke();
  ctx.restore();
  if (band !== "3-5") {
    caption(ctx, batX + 20, cy + 30, `${current.toFixed(1)} A`, theme, {
      align: "center", size: 12, color: theme.sci["current"],
    });
  }

  /* ---- paperclips hanging off the pole face ---- */
  const clipX = coilX1 + 30;
  const shown = Math.min(clips, 24);
  ctx.save();
  ctx.strokeStyle = theme.sci["mass"];
  ctx.lineWidth = 2;
  for (let i = 0; i < shown; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = clipX + col * 13;
    const y = cy + 16 + row * 15;
    if (y > benchY - 6) break;
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (b > 0) glow(ctx, coilX1 + 6, cy, 40, theme.sci["field"], 0.35);

  badge(ctx, (coilX0 + coilX1) / 2, cy - coreH - 26, `${(b * 1000).toFixed(2)} mT`, theme, {
    align: "center", color: theme.sci["field"], sub: "inside the coil",
  });
  badge(ctx, clipX + 24, benchY - 20, `${clips}`, theme, {
    align: "center", color: theme.sci["mass"], sub: "paperclips",
  });
  caption(ctx, 14, 22, `${turns} turns  ·  ${core === "air" ? "no core" : `${core} core`}`, theme, {
    size: 13, color: theme.ink,
  });
  if (core === "copper" && band !== "3-5") {
    caption(ctx, 14, 42, "copper is a metal, but not a magnetic one", theme, {
      size: 11, color: theme.inkSoft,
    });
  }
  if (band === "9-12") {
    caption(ctx, 14, height - 16, "B = µ₀ × turns × current ÷ length", theme, {
      size: 11, color: theme.inkSoft,
    });
  }
}

function renderEarth(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const cx = ANCHOR_PX;
  const cy = Math.round(height * 0.52);
  const magnetX = ANCHOR_PX + state.r / M_PER_PX;
  const decl = params.declination as number;
  const flipped = params.flipMagnet as boolean;

  sky(ctx, width, height, theme, "indoor");

  /* ---- a small globe, so the field has somewhere to come from ---- */
  if (overlays.globe) {
    const gx = width - 92, gy = 78, gr = Math.min(52, width * 0.09);
    if (gr > 22) {
      sphere(ctx, gx, gy, gr, theme.sci["liquid"], { glow: 0.1 });
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["field"], 0.6);
      ctx.lineWidth = 1.2;
      for (const k of [0.45, 0.75, 1.05]) {
        ctx.beginPath();
        ctx.ellipse(gx, gy, gr * k * 1.5, gr * k, (11.5 * Math.PI) / 180, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      caption(ctx, gx, gy + gr + 18, "Earth: a bar magnet, tilted", theme, {
        align: "center", size: 11, color: theme.inkSoft,
      });
    }
  }

  /* ---- the compass ---- */
  const cr = Math.min(56, Math.max(30, height * 0.16));
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.55 : 0.85);
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = theme.inkSoft;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [labelText, ang] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const) {
    const a = ((ang - 90) * Math.PI) / 180;
    ctx.fillText(labelText, cx + Math.cos(a) * (cr - 10), cy + Math.sin(a) * (cr - 10));
  }
  ctx.restore();

  // Geographic north, then the needle on top of it.
  arrow(ctx, cx, cy + cr - 4, cx, cy - cr + 4, hexA(theme.inkSoft, 0.4), { width: 1.2, dashed: true });
  const a = ((state.needle - 90) * Math.PI) / 180;
  ctx.save();
  ctx.strokeStyle = theme.sci["charge-pos"];
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (cr - 8), cy + Math.sin(a) * (cr - 8));
  ctx.stroke();
  ctx.strokeStyle = theme.sci["charge-neg"];
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - Math.cos(a) * (cr - 8), cy - Math.sin(a) * (cr - 8));
  ctx.stroke();
  ctx.restore();
  sphere(ctx, cx, cy, 4, theme.inkSoft);

  /* ---- the bar magnet the student slides in from the east ---- */
  const magW = Math.min(78, Math.max(46, width * 0.085));
  drawBarMagnet(rc, magnetX, cy, magW, 24, !flipped);
  if (overlays.filings) {
    drawFilings(rc, (x, y) => barField(x, y, magnetX, cy, magnetMoment(params), !flipped));
  }

  const magnetB = magnetFieldAtCompass(state, params);
  badge(ctx, (cx + magnetX) / 2, cy + cr + 26, `${(state.r * 100).toFixed(1)} cm`, theme, {
    align: "center", color: theme.sci["distance"],
  });
  badge(ctx, magnetX, cy - 40, `${(magnetB * 1e6).toFixed(0)} µT`, theme, {
    align: "center", color: theme.sci["field"], sub: "at the compass",
  });
  caption(ctx, 14, 22, `Earth's field here: 50 µT  ·  ${EARTH_HORIZONTAL * 1e6} µT of it horizontal`, theme, {
    size: 12, color: theme.ink,
  });
  if (band !== "3-5") {
    caption(ctx, 14, 42, `magnetic north is ${decl.toFixed(0)}° east of true north`, theme, {
      size: 11, color: theme.inkSoft,
    });
    badge(ctx, cx, cy + cr + 54, `${state.needle.toFixed(0)}°`, theme, {
      align: "center", color: theme.sci["field"], sub: "bearing",
    });
  }
  caption(ctx, width - 12, height - 12, "drag the magnet closer", theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });
}

function render(rc: RenderContext<State>) {
  const scene = rc.params.scene as string;
  if (scene === "electromagnet") renderElectromagnet(rc);
  else if (scene === "earth") renderEarth(rc);
  else renderPoles(rc);
  vignette(rc.ctx, rc.width, rc.height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const magnetismSim: SimManifest<State> = {
  id: "phys.magnetism",
  title: "Magnets and Electromagnets",
  tagline: "Push two magnets together, wind your own electromagnet, then watch a compass find north.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5", "3-PS2-3", "HS-PS2-5"], ccssMath: ["6.RP.A.3", "8.F.B.4"] },
  learningGoals: [
    "Predict attraction or repulsion from which poles face each other.",
    "Show that magnetic force falls off far faster with distance than gravity does.",
    "Build an electromagnet and find that its strength follows turns × current.",
    "Explain that only some metals are magnetic — copper and aluminium are not.",
    "Explain a compass as a small magnet lining up with Earth's own field.",
  ],
  misconceptions: [
    "All metals are magnetic",
    "A magnet's pull reaches just as far as gravity's",
    "An electromagnet stays magnetic after the current stops",
    "A compass needle is pulled by the North Star or by gravity",
    "Earth's magnetic north pole and its geographic north pole are the same place",
  ],
  interactionHint: "Drag the right-hand magnet to change the gap.",
  params: {
    scene: {
      type: "option", label: "Bench",
      options: [
        { value: "poles", label: "Two bar magnets" },
        { value: "electromagnet", label: "Build an electromagnet" },
        { value: "earth", label: "Compass and Earth" },
      ],
      default: "poles",
    },
    flipMagnet: {
      type: "boolean", label: "Flip the right magnet", default: false,
      help: "Turning it round swaps which pole faces the other magnet.",
    },
    magnetStrength: {
      type: "number", label: "Magnet strength (A·m²)", kind: "count",
      min: 0.1, max: 2, step: 0.1, default: 0.5,
      bands: ["6-8", "9-12"],
      help: "The magnetic moment. A fridge magnet is a few tenths; a neodymium disc is a few.",
    },
    turns: {
      type: "number", label: "Turns of wire", kind: "count",
      min: 10, max: 400, step: 10, default: 100,
      marks: [{ value: 50, label: "50" }, { value: 100, label: "100" }, { value: 200, label: "200" }],
    },
    current: {
      type: "number", label: "Current", kind: "current", unit: "A",
      min: 0, max: 4, step: 0.1, default: 1.5,
      help: "Switch it off and the electromagnet stops being a magnet at all.",
    },
    coilLength: {
      type: "number", label: "Coil length", kind: "length", unit: "m",
      min: 0.04, max: 0.3, step: 0.01, default: 0.08,
      bands: ["9-12"],
      help: "Spreading the same turns over a longer coil weakens the field inside.",
    },
    core: {
      type: "option", label: "Core",
      options: [
        { value: "air", label: "Nothing (air)" },
        { value: "copper", label: "Copper bar" },
        { value: "iron", label: "Iron bar" },
      ],
      default: "air",
      help: "Iron concentrates the field enormously. Copper, though a metal, does not.",
    },
    declination: {
      type: "number", label: "Magnetic declination", kind: "angle", unit: "°",
      min: -20, max: 20, step: 1, default: 13,
      bands: ["6-8", "9-12"],
      help: "How far magnetic north sits from true north where you are. About 13° east in California.",
    },
  },
  overlays: [
    { key: "fieldLines", label: "Field lines", default: true },
    { key: "filings", label: "Iron filings", default: true },
    { key: "forces", label: "Force arrows", default: true, bands: ["6-8", "9-12"] },
    { key: "current", label: "Show the current", default: true },
    { key: "globe", label: "Show Earth", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "poles-and-distance",
      title: "Poles, and how fast the pull dies",
      question: "Which poles attract, and how quickly does the force fade as the gap grows?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-3", "MS-PS2-5"],
      setup: { scene: "poles", flipMagnet: false, magnetStrength: 0.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you touch anything",
          instruction: "Two north poles are facing each other.",
          predict: {
            prompt: "You double the gap between the magnets. The force becomes...",
            options: ["half as big", "a quarter as big", "a sixteenth as big", "unchanged"],
            correct: 2,
            reveal: "A sixteenth. Two bar magnets pull on each other as 1 ÷ gap⁴, which is why a fridge magnet does nothing until it is nearly touching.",
          },
        },
        {
          id: "flip",
          phase: "setup",
          title: "Attract, then repel",
          instruction: "Flip the right magnet and watch the arrows turn round.",
          check: {
            describe: "The right magnet has been flipped",
            test: (v) => v.params.flipMagnet === true,
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Measure five gaps",
          instruction: "Record the force at gaps of 4, 5, 6, 8 and 10 cm.",
          requireData: 5,
          hints: [
            "Drag the right magnet; the gap badge sits between the two.",
            "Compare 5 cm with 10 cm. How many times bigger is the close one?",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "How many times?",
          instruction: "Divide the force at 5 cm by the force at 10 cm.",
          write: {
            prompt: "How many times stronger was the force at half the gap, and what power of distance does that mean?",
            placeholder: "Halving the gap made the force about ... times bigger, which means ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Compare with gravity",
          instruction: "Gravity and electric force both follow 1 ÷ distance².",
          write: {
            prompt: "Why can you feel Earth's gravity from thousands of kilometres up, but not a magnet from across the room?",
            placeholder: "Magnetic force falls off as ... while gravity falls off as ... so ...",
          },
        },
      ],
    },
    {
      id: "build-electromagnet",
      title: "Build a stronger electromagnet",
      question: "What actually makes an electromagnet stronger — turns, current, or the core?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-PS2-3"],
      setup: { scene: "electromagnet", turns: 50, current: 1, core: "air", coilLength: 0.08 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the winner",
          instruction: "You may double the turns, or double the current. Choose.",
          predict: {
            prompt: "Which gives the bigger field: doubling the turns, or doubling the current?",
            options: ["Doubling the turns", "Doubling the current", "They give exactly the same"],
            correct: 2,
            reveal: "Exactly the same. The field follows turns × current, so the coil cannot tell which of the two you doubled.",
          },
        },
        {
          id: "turns",
          phase: "measure",
          title: "Add turns",
          instruction: "Hold the current at 1 A. Record at 50, 100, 200 and 400 turns.",
          requireData: 4,
          hints: ["Change one thing at a time or the test proves nothing."],
        },
        {
          id: "current",
          phase: "measure",
          title: "Now raise the current",
          instruction: "Go back to 50 turns and record at 1, 2 and 4 A.",
          requireData: 7,
          check: {
            describe: "Current is at least 2 A",
            test: (v) => (v.params.current as number) >= 2,
          },
        },
        {
          id: "core",
          phase: "measure",
          title: "Drop a bar down the middle",
          instruction: "Try the copper bar, then the iron bar. Record both.",
          requireData: 9,
          check: {
            describe: "The iron core is in place",
            test: (v) => v.params.core === "iron",
          },
          hints: ["Copper is an excellent conductor. Does that make it magnetic?"],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the recipe",
          instruction: "Write instructions for the strongest electromagnet on the least current.",
          write: {
            prompt: "What controls an electromagnet's strength? Say what the iron core did and why copper did not.",
            placeholder: "The field follows ... The iron core ... but copper ...",
          },
        },
      ],
    },
    {
      id: "compass-earth",
      title: "What is the compass really pointing at?",
      question: "Is a compass pointing at the North Star, at true north, or at something else?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-5"],
      setup: { scene: "earth", magnetStrength: 0.5, declination: 13, flipMagnet: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "A bar magnet is about to be slid in from the east.",
          predict: {
            prompt: "Bring a small bar magnet within 10 cm of the compass and the needle will...",
            options: [
              "keep pointing north — Earth's field is far bigger",
              "swing right round to follow the bar magnet",
              "spin without stopping",
            ],
            correct: 1,
            reveal: "It follows the bar magnet. Earth's horizontal field is only about 25 µT, and a small bar magnet beats that easily from 10 cm away.",
          },
        },
        {
          id: "far",
          phase: "measure",
          title: "Start far away",
          instruction: "Drag the magnet out to 30 cm and record the bearing.",
          requireData: 1,
        },
        {
          id: "near",
          phase: "measure",
          title: "Bring it in",
          instruction: "Record the bearing at 20, 15, 10 and 6 cm.",
          requireData: 5,
          hints: ["Watch the µT badge above the magnet as you drag it in."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the two fields",
          instruction: "Find the distance where the magnet's field equals Earth's 25 µT.",
          check: {
            describe: "The magnet's field at the compass is bigger than Earth's horizontal field",
            test: (v) => (v.facts.magnetFieldAtCompass as number) > 25e-6,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the compass",
          instruction: "Say what the needle is doing and how weak Earth's field really is.",
          write: {
            prompt: "What is a compass needle lining up with, and what does that tell you about the strength of Earth's field?",
            placeholder: "The needle lines up with ... Earth's field is only ... so ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "twelve-clips",
      title: "Twelve paperclips on one amp",
      brief: "Hold at least 12 paperclips using no more than 1.0 A of current.",
      bands: ["6-8", "9-12"],
      setup: { scene: "electromagnet", turns: 100, current: 1, core: "air", coilLength: 0.08 },
      goal: {
        describe: "12 clips held with current at or below 1.0 A",
        test: (v) => (v.facts.clips as number) >= 12 && (v.params.current as number) <= 1.0,
      },
      stars: {
        two: {
          describe: "25 clips at or below 1.0 A",
          test: (v) => (v.facts.clips as number) >= 25 && (v.params.current as number) <= 1.0,
        },
        three: {
          describe: "25 clips at or below 0.5 A",
          test: (v) => (v.facts.clips as number) >= 25 && (v.params.current as number) <= 0.5,
        },
      },
      hints: [
        "Current is capped, so the other two ingredients have to do the work.",
        "An iron core multiplies the field by a couple of hundred.",
        "A shorter coil packs the same turns closer together.",
      ],
    },
    {
      id: "swing-the-needle",
      title: "Swing the needle 45°",
      brief: "Pull the compass needle at least 45° away from magnetic north using the bar magnet.",
      bands: ["6-8", "9-12"],
      setup: { scene: "earth", magnetStrength: 0.5, declination: 13, flipMagnet: false },
      goal: {
        describe: "Needle deflected at least 45° from magnetic north",
        test: (v) => (v.facts.deflection as number) >= 45,
      },
      stars: {
        two: {
          describe: "Deflected at least 60°",
          test: (v) => (v.facts.deflection as number) >= 60,
        },
        three: {
          describe: "Deflected at least 75°, with a magnet no stronger than 0.5 A·m²",
          test: (v) => (v.facts.deflection as number) >= 75 && (v.params.magnetStrength as number) <= 0.5,
        },
      },
      hints: [
        "45° means the magnet's field at the compass equals Earth's horizontal 25 µT.",
        "The bar magnet's field grows as 1 ÷ distance³ — closing the gap wins fast.",
      ],
    },
  ],
};
