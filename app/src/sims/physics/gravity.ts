import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, caption, comet, contactShadow, glow, groundPlane, hexA, material, sky, sphere, starfield,
  vignette,
} from "@ui/scene";

/**
 * Gravity — Grade 8, Unit C4.
 *
 * Two scenes, one law. On the bench two ordinary masses pull on each other
 * with a force of a few ten-millionths of a newton — and if nothing else
 * touches them they really do drift together, which the time-lapse lets a
 * student watch. On a world, the same law gives the local g from that world's
 * own mass and radius, so the bathroom scale changes while the kilograms on
 * the label do not.
 *
 * Serves C4.1 gravity is always attractive, C4.2 mass and distance,
 * C4.3 why everyday gravity goes unnoticed, C4.4 mass versus weight, and
 * C4.5 applying the argument to new cases.
 */

/** Bench geometry: pointer pixels convert to metres with one fixed scale. */
export const ANCHOR_PX = 110;
export const M_PER_PX = 0.025;
export const R_MAX = 16;

/** Everything on the bench is about as dense as water, so sizes look right. */
const DENSITY = 1000;

/** Newton's law of universal gravitation, in newtons. Always attractive. */
export function gravitationalForce(m1: number, m2: number, r: number): number {
  const rr = Math.max(r, 1e-6);
  return (CONSTANTS.G * m1 * m2) / (rr * rr);
}

/** Radius of a sphere of this mass at the density of water, m. */
export function bodyRadius(mass: number): number {
  return Math.cbrt((3 * Math.max(mass, 1e-6)) / (4 * Math.PI * DENSITY));
}

/**
 * Time for two masses released from rest at r0 to fall together to rf.
 *
 *   t = √(r0³ / 2µ) · [ arccos√(rf/r0) + √( (rf/r0)(1 − rf/r0) ) ],  µ = G(m1+m2)
 *
 * the standard radial-infall solution. At rf = 0 it reduces to the familiar
 * (π/2)√(r0³/2µ).
 */
export function fallTime(r0: number, rf: number, m1: number, m2: number): number {
  const mu = CONSTANTS.G * (m1 + m2);
  if (mu <= 0 || r0 <= rf) return 0;
  const x = Math.min(1, Math.max(0, rf / r0));
  return Math.sqrt((r0 * r0 * r0) / (2 * mu)) * (Math.acos(Math.sqrt(x)) + Math.sqrt(x * (1 - x)));
}

/** Surface gravity from a world's own mass and radius: g = GM/r². */
export function surfaceGravity(mass: number, radius: number): number {
  return (CONSTANTS.G * mass) / (radius * radius);
}

export interface World {
  key: string;
  label: string;
  mass: number;     // kg
  radius: number;   // m, distance from the centre to where you stand
  ground: "grass" | "rock" | "soil" | "water" | "lab";
  mood: "day" | "space" | "dusk";
  /** True where you are in free fall, so a scale reads zero. */
  freeFall?: boolean;
  note: string;
}

/** Real masses and radii. Every g in this sim is computed, never typed in. */
export const WORLDS: World[] = [
  { key: "moon", label: "The Moon", mass: 7.342e22, radius: 1.7374e6, ground: "rock", mood: "space", note: "No air, and one sixth of Earth's pull." },
  { key: "mars", label: "Mars", mass: 6.417e23, radius: 3.3895e6, ground: "soil", mood: "dusk", note: "Thin atmosphere, about a third of Earth's pull." },
  { key: "earth", label: "Earth", mass: CONSTANTS.earthMass, radius: CONSTANTS.earthRadius, ground: "grass", mood: "day", note: "Where every bathroom scale was calibrated." },
  { key: "jupiter", label: "Jupiter", mass: 1.8982e27, radius: 7.1492e7, ground: "water", mood: "dusk", note: "No solid surface: this is the cloud tops." },
  { key: "sun", label: "The Sun", mass: CONSTANTS.sunMass, radius: 6.957e8, ground: "rock", mood: "space", note: "A star's surface. You would weigh 28 times more." },
  { key: "ceres", label: "Ceres", mass: 9.3835e20, radius: 4.73e5, ground: "rock", mood: "space", note: "The biggest asteroid. You could jump very high." },
  { key: "iss", label: "The space station", mass: CONSTANTS.earthMass, radius: CONSTANTS.earthRadius + 4.2e5, ground: "lab", mood: "space", freeFall: true, note: "420 km up: gravity is still strong, but everything falls together." },
];

export function worldOf(key: string): World {
  return WORLDS.find((w) => w.key === key) ?? WORLDS[2];
}

interface State {
  /** Separation between the two centres, m. */
  r: number;
  /** Closing speed, m/s. Only non-zero once released. */
  closing: number;
  dragging: boolean;
  /** Seconds of gravity-time elapsed since release. */
  elapsed: number;
  touching: boolean;
  /** Trail of past separations, for the time-lapse approach. */
  trail: number[];
  t: number;
}

/** Time-lapse factor while the masses are released. */
export const LAPSE = 1200;

function massesOf(params: Record<string, number | boolean | string>) {
  return { m1: params.massA as number, m2: params.massB as number };
}

function contactGap(params: Record<string, number | boolean | string>): number {
  const { m1, m2 } = massesOf(params);
  return bodyRadius(m1) + bodyRadius(m2);
}

const model: SimModel<State> = {
  init(params) {
    return {
      r: Math.max(4, contactGap(params) * 1.6), closing: 0, dragging: false,
      elapsed: 0, touching: false, trail: [], t: 0,
    };
  },

  applyParams(state, params, prev) {
    // Re-arm the drop whenever the student changes the setup, and never let a
    // mass change leave the two spheres overlapping.
    const gap = contactGap(params);
    const changed = params.massA !== prev.massA || params.massB !== prev.massB
      || params.release !== prev.release;
    const r = Math.max(state.r, gap);
    if (!changed) return state.r === r ? state : { ...state, r };
    return { ...state, r: Math.max(r, gap * 1.05), closing: 0, elapsed: 0, touching: false, trail: [] };
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    const gap = contactGap(params);

    for (const input of inputs) {
      if (input.type === "pointerdown" && input.x > ANCHOR_PX + 14) {
        s = { ...s, dragging: true, r: snapR(input.x, gap), closing: 0, elapsed: 0, touching: false, trail: [] };
      } else if (input.type === "pointermove" && s.dragging) {
        s = { ...s, r: snapR(input.x, gap), closing: 0, elapsed: 0, touching: false, trail: [] };
      } else if (input.type === "pointerup") {
        s = { ...s, dragging: false };
      }
    }

    const t = s.t + dt;
    const released = (params.release as boolean) && (params.scene as string) === "pair";
    if (!released || s.touching || s.dragging) return { ...s, t };

    /* ---- let them fall together, sped up enormously ---- */
    const { m1, m2 } = massesOf(params);
    const mu = CONSTANTS.G * (m1 + m2);
    const lapsed = dt * LAPSE;
    // Sub-stepped: the acceleration climbs steeply in the last moments, and a
    // single Euler step there would arrive early.
    const sub = 24;
    const h = lapsed / sub;
    let r = s.r;
    let v = s.closing;
    let elapsed = s.elapsed;
    let touching = false;
    for (let i = 0; i < sub; i++) {
      v += (mu / (r * r)) * h;
      r -= v * h;
      elapsed += h;
      if (r <= gap) { r = gap; touching = true; break; }
    }

    const trail = s.trail.length >= 240 ? s.trail.slice(1) : s.trail.slice();
    trail.push(r);
    return { ...s, r, closing: v, elapsed, touching, trail, t };
  },

  readouts(state, params) {
    const scene = params.scene as string;

    if (scene === "world") {
      const world = worldOf(params.world as string);
      const g = surfaceGravity(world.mass, world.radius);
      const mass = params.bodyMass as number;
      const weight = world.freeFall ? 0 : mass * g;
      return [
        {
          key: "mass", label: "Your mass", quantity: q(mass, "mass"),
          unit: "kg", semantic: "mass", graphable: true,
        },
        {
          key: "weight", label: "Your weight here", quantity: q(weight, "force"),
          unit: "N", semantic: "force", graphable: true,
        },
        {
          key: "scaleKg", label: "What the scale reads (kg)", quantity: q(weight / CONSTANTS.g, "mass"),
          unit: "kg", semantic: "force", graphable: true,
        },
        {
          key: "gravity", label: "Strength of gravity", quantity: q(g, "acceleration"),
          unit: "m/s²", semantic: "acceleration", graphable: true,
        },
        {
          key: "jump", label: "How high you could jump", quantity: q(jumpHeight(g, world.freeFall), "length"),
          unit: "m", semantic: "distance", graphable: true, bands: ["3-5", "6-8"],
        },
        {
          key: "weightRatio", label: "Weight ÷ your Earth weight", quantity: q(g / CONSTANTS.g, "ratio"),
          semantic: "force", graphable: true, bands: ["6-8", "9-12"],
        },
      ];
    }

    const { m1, m2 } = massesOf(params);
    const force = gravitationalForce(m1, m2, state.r);
    return [
      {
        key: "force", label: "Pull on each mass", quantity: q(force, "force"),
        unit: "N", semantic: "force", graphable: true,
      },
      {
        key: "separation", label: "Separation", quantity: q(state.r, "length"),
        unit: "m", semantic: "distance", graphable: true,
      },
      {
        key: "invR2", label: "1 ÷ (separation)²", quantity: q(1 / (state.r * state.r), "ratio"),
        semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "weightRatio", label: "This pull ÷ their Earth weight",
        quantity: q(force / (m1 * CONSTANTS.g), "ratio"),
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "driftHours", label: "Hours to drift together",
        quantity: q(fallTime(state.r, contactGap(params), m1, m2) / 3600, "count"),
        semantic: "time", graphable: true,
      },
      {
        key: "elapsedHours", label: "Hours since release", quantity: q(state.elapsed / 3600, "count"),
        semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const { m1, m2 } = massesOf(params);
    const world = worldOf(params.world as string);
    const g = surfaceGravity(world.mass, world.radius);
    const mass = params.bodyMass as number;
    const weight = world.freeFall ? 0 : mass * g;
    const force = gravitationalForce(m1, m2, state.r);
    return {
      scene: params.scene as string,
      force,
      separation: state.r,
      invR2: 1 / (state.r * state.r),
      forceTimesR2: force * state.r * state.r,
      attractive: true,
      timesSmallerThanWeight: (m1 * CONSTANTS.g) / Math.max(force, 1e-30),
      driftHours: fallTime(state.r, contactGap(params), m1, m2) / 3600,
      elapsedHours: state.elapsed / 3600,
      touching: state.touching,
      contactGap: contactGap(params),
      world: world.key,
      gravity: g,
      mass,
      weight,
      scaleKg: weight / CONSTANTS.g,
      weightRatio: world.freeFall ? 0 : g / CONSTANTS.g,
      jumpHeight: jumpHeight(g, world.freeFall),
      freeFall: Boolean(world.freeFall),
    };
  },
};

/**
 * A jump that clears 20 cm on Earth, taken to another world.
 * In free fall there is nothing to bring you back down, so the height is
 * capped rather than infinite — readouts have to stay finite.
 */
export function jumpHeight(g: number, freeFall?: boolean): number {
  if (freeFall) return 999;
  const takeoff = Math.sqrt(2 * CONSTANTS.g * 0.2);   // m/s, about 2 m/s
  return (takeoff * takeoff) / (2 * g);
}

function snapR(pointerX: number, gap: number): number {
  const raw = (pointerX - ANCHOR_PX) * M_PER_PX;
  const snapped = Math.round(raw * 10) / 10;
  return Math.min(R_MAX, Math.max(gap, snapped));
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

/** Newtons, in a form a Grade 8 student can actually read. */
export function formatForce(force: number): string {
  if (force >= 1000) return `${(force / 1000).toFixed(1)} kN`;
  if (force >= 1) return `${force.toFixed(1)} N`;
  if (force >= 1e-3) return `${(force * 1e3).toFixed(2)} mN`;
  if (force >= 1e-6) return `${(force * 1e6).toFixed(2)} µN`;
  return `${(force * 1e9).toFixed(2)} nN`;
}

function renderPair(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const { m1, m2 } = massesOf(params);
  const railY = Math.round(height * 0.52);

  sky(ctx, width, height, theme, "space");
  starfield(ctx, width, height, 110, 7);

  const ax = ANCHOR_PX;
  const bx = ANCHOR_PX + state.r / M_PER_PX;
  // Screen radius from the real radius, floored so a 10 kg mass is still visible.
  const pr = (mass: number) => Math.max(11, Math.min(46, bodyRadius(mass) / M_PER_PX));
  const rA = pr(m1), rB = pr(m2);

  /* ---- the approach, if they have been let go ---- */
  if (state.trail.length > 2 && overlays.trail) {
    comet(
      ctx,
      state.trail.map((r, i) => ({
        x: ANCHOR_PX + r / M_PER_PX,
        y: railY + (i - state.trail.length) * 0.02,
      })),
      theme.sci["velocity"], 2.5,
    );
  }

  /* ---- ruler along the line joining them ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["distance"], 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax, railY + 62);
  ctx.lineTo(Math.min(width, ANCHOR_PX + R_MAX / M_PER_PX), railY + 62);
  ctx.stroke();
  for (let m = 0; m <= R_MAX; m += 1) {
    const x = ANCHOR_PX + m / M_PER_PX;
    if (x > width) break;
    ctx.beginPath();
    ctx.moveTo(x, railY + 62);
    ctx.lineTo(x, railY + 62 + (m % 5 === 0 ? 8 : 4));
    ctx.stroke();
  }
  ctx.restore();

  for (const [x, mass, r] of [[ax, m1, rA], [bx, m2, rB]] as const) {
    glow(ctx, x, railY, r * 2.2, theme.sci["mass"], 0.18);
    sphere(ctx, x, railY, r, theme.sci["mass"], { glow: 0.15 });
    if (band !== "3-5") {
      badge(ctx, x, railY + r + 22, `${mass >= 1000 ? `${(mass / 1000).toFixed(1)} t` : `${mass.toFixed(0)} kg`}`, theme, {
        align: "center", color: theme.sci["mass"],
      });
    }
  }

  /* ---- the pair of forces: always inward, always equal ---- */
  const force = gravitationalForce(m1, m2, state.r);
  if (overlays.forces) {
    const len = 16 + 84 * (force / (force + 4e-7));
    arrow(ctx, ax + rA + 6, railY, ax + rA + 6 + len, railY, theme.sci["force"], { width: 3 });
    arrow(ctx, bx - rB - 6, railY, bx - rB - 6 - len, railY, theme.sci["force"], { width: 3 });
    badge(ctx, (ax + bx) / 2, railY - Math.max(rA, rB) - 26, formatForce(force), theme, {
      align: "center", color: theme.sci["force"], sub: "on each, pulling inward",
    });
  }

  badge(ctx, (ax + bx) / 2, railY + 92, `${state.r.toFixed(1)} m`, theme, {
    align: "center", color: theme.sci["distance"],
  });

  /* ---- why you never notice it ---- */
  if (overlays.compare && band !== "3-5") {
    const ratio = (m1 * CONSTANTS.g) / Math.max(force, 1e-30);
    caption(ctx, 16, 24, "Gravity only ever pulls. There is no negative mass.", theme, {
      size: 12, color: theme.ink,
    });
    caption(
      ctx, 16, 44,
      `This pull is ${ratio > 1e6 ? `${(ratio / 1e6).toFixed(0)} million` : ratio.toFixed(0)} times smaller than the left mass's weight on Earth.`,
      theme, { size: 11, color: theme.inkSoft },
    );
  }

  /* ---- the time-lapse ---- */
  const drift = fallTime(state.r, contactGap(params), m1, m2) / 3600;
  if (params.release as boolean) {
    badge(ctx, width - 16, 28, `${(state.elapsed / 3600).toFixed(2)} h`, theme, {
      align: "right", color: theme.sci["time"], sub: `time-lapse ×${LAPSE}`,
    });
    if (state.touching) {
      caption(ctx, (ax + bx) / 2, railY - Math.max(rA, rB) - 54, "they met", theme, {
        align: "center", size: 18, color: theme.sci["energy-kinetic"], weight: 800,
      });
    }
  } else if (band !== "3-5") {
    badge(ctx, width - 16, 28, `${drift.toFixed(1)} h`, theme, {
      align: "right", color: theme.sci["time"], sub: "to drift together",
    });
  }
  caption(ctx, width - 12, height - 12, "drag the right mass", theme, {
    align: "right", size: 11, color: theme.inkSoft,
  });
}

function renderWorld(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height, overlays, band } = rc;
  const world = worldOf(params.world as string);
  const g = surfaceGravity(world.mass, world.radius);
  const mass = params.bodyMass as number;
  const weight = world.freeFall ? 0 : mass * g;
  const groundY = Math.round(height * 0.78);

  sky(ctx, width, height, theme, world.mood, groundY);
  if (world.mood === "space") starfield(ctx, width, groundY, 80, 11);
  groundPlane(ctx, groundY, 0, width, height, theme, world.ground);

  /* ---- the scale, and someone standing on it ---- */
  const cx = Math.round(width * 0.36);
  const scaleW = 96, scaleH = 26;
  const float = world.freeFall ? 26 : 0;
  const feetY = groundY - scaleH - float;

  contactShadow(ctx, cx, groundY, 34, float + 4);
  material(ctx, cx - scaleW / 2, groundY - scaleH, scaleW, scaleH, theme.inkSoft, 5);
  // The display on the scale: the whole mass-versus-weight argument in one box.
  ctx.save();
  ctx.fillStyle = hexA(theme.surface, 0.9);
  roundRect(ctx, cx - 34, groundY - scaleH + 5, 68, 16, 3);
  ctx.fill();
  ctx.fillStyle = theme.sci["force"];
  ctx.font = "700 12px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${(weight / CONSTANTS.g).toFixed(1)} kg`, cx, groundY - scaleH + 13);
  ctx.restore();

  // A figure: head, body, legs. Simple, but it stands somewhere real.
  const bodyH = 62;
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, feetY - 16);
  ctx.lineTo(cx - 9, feetY);
  ctx.moveTo(cx, feetY - 16);
  ctx.lineTo(cx + 9, feetY);
  ctx.moveTo(cx, feetY - 16);
  ctx.lineTo(cx, feetY - bodyH + 14);
  ctx.moveTo(cx - 13, feetY - bodyH + 30);
  ctx.lineTo(cx + 13, feetY - bodyH + 30);
  ctx.stroke();
  ctx.restore();
  sphere(ctx, cx, feetY - bodyH + 6, 11, theme.sci["mass"]);

  /* ---- the weight arrow: it is the force, so it uses the force colour ---- */
  if (overlays.forces && !world.freeFall) {
    const len = 20 + 96 * (g / (g + 12));
    arrow(ctx, cx + 46, feetY - 40, cx + 46, feetY - 40 + len, theme.sci["force"], {
      width: 3.5, label: band === "9-12" ? "W = mg" : undefined,
    });
    badge(ctx, cx + 46, feetY - 54, `${weight.toFixed(0)} N`, theme, {
      align: "center", color: theme.sci["force"], sub: "weight",
    });
  }
  if (world.freeFall) {
    caption(ctx, cx, feetY - bodyH - 26, "falling — the scale reads zero", theme, {
      align: "center", size: 13, color: theme.sci["velocity"],
    });
  }

  badge(ctx, cx - 96, feetY - bodyH + 6, `${mass.toFixed(0)} kg`, theme, {
    align: "center", color: theme.sci["mass"], sub: "mass: unchanged",
  });

  /* ---- how this world compares, computed from its own mass and radius ---- */
  if (overlays.compare) {
    const x0 = Math.round(width * 0.63);
    const w = width - x0 - 18;
    if (w > 110) {
      const rowH = Math.min(22, (groundY - 60) / WORLDS.length);
      caption(ctx, x0, 26, "strength of gravity (m/s²)", theme, { size: 11, color: theme.inkSoft });
      const gMax = Math.max(...WORLDS.map((wd) => surfaceGravity(wd.mass, wd.radius)));
      WORLDS.forEach((wd, i) => {
        const gg = surfaceGravity(wd.mass, wd.radius);
        const y = 40 + i * rowH;
        const barW = Math.max(2, (Math.sqrt(gg / gMax)) * (w - 66));
        ctx.save();
        ctx.fillStyle = wd.key === world.key ? theme.sci["acceleration"] : hexA(theme.inkSoft, 0.35);
        roundRect(ctx, x0 + 60, y - 6, barW, 11, 3);
        ctx.fill();
        ctx.fillStyle = wd.key === world.key ? theme.ink : theme.inkSoft;
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(wd.label, x0 + 55, y);
        ctx.textAlign = "left";
        ctx.fillText(gg.toFixed(2), x0 + 64 + barW, y);
        ctx.restore();
      });
    }
  }

  caption(ctx, 16, 24, world.label, theme, { size: 16, color: theme.ink, weight: 800 });
  caption(ctx, 16, 44, world.note, theme, { size: 11, color: theme.inkSoft });
  if (band === "9-12") {
    caption(ctx, 16, groundY + 26, `g = G × ${world.mass.toExponential(2)} kg ÷ (${world.radius.toExponential(2)} m)² = ${g.toFixed(2)} m/s²`, theme, {
      size: 11, color: theme.inkSoft,
    });
  }
}

function render(rc: RenderContext<State>) {
  if ((rc.params.scene as string) === "world") renderWorld(rc);
  else renderPair(rc);
  vignette(rc.ctx, rc.width, rc.height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const gravitySim: SimManifest<State> = {
  id: "phys.gravity",
  title: "Gravity",
  tagline: "Measure the pull between two everyday objects, then take your bathroom scale to the Moon.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS2-4", "MS-ESS1-2", "HS-PS2-4"], ccssMath: ["8.EE.A.3", "8.EE.A.4"] },
  learningGoals: [
    "State that gravity pulls between every pair of masses, and only ever pulls.",
    "Predict how the pull changes when a mass doubles or the distance doubles.",
    "Explain why the gravity between two everyday objects goes unnoticed.",
    "Tell mass from weight, and say which one changes on another world.",
    "Work out the strength of gravity on a world from its mass and radius.",
  ],
  misconceptions: [
    "Gravity can push as well as pull",
    "Only very large objects have gravity",
    "Your mass changes on the Moon",
    "There is no gravity in space",
    "Astronauts float because they have escaped Earth's gravity",
  ],
  interactionHint: "Drag the right-hand mass, then switch the time-lapse on.",
  params: {
    scene: {
      type: "option", label: "Scene",
      options: [
        { value: "pair", label: "Two masses in space" },
        { value: "world", label: "Weigh yourself on a world" },
      ],
      default: "pair",
    },
    massA: {
      type: "number", label: "Left mass", kind: "mass", unit: "kg",
      min: 10, max: 20000, step: 10, default: 60,
      marks: [
        { value: 60, label: "person" },
        { value: 1500, label: "car" },
        { value: 20000, label: "lorry" },
      ],
    },
    massB: {
      type: "number", label: "Right mass", kind: "mass", unit: "kg",
      min: 10, max: 20000, step: 10, default: 60,
      marks: [
        { value: 60, label: "person" },
        { value: 1500, label: "car" },
        { value: 20000, label: "lorry" },
      ],
    },
    release: {
      type: "boolean", label: "Let them go (time-lapse)", default: false,
      help: `Nothing else touches them, and time runs ${LAPSE} times faster so you can watch.`,
    },
    world: {
      type: "option", label: "World",
      options: WORLDS.map((w) => ({ value: w.key, label: w.label })),
      default: "earth",
    },
    bodyMass: {
      type: "number", label: "Your mass", kind: "mass", unit: "kg",
      min: 20, max: 120, step: 1, default: 50,
      help: "This is the number on the label. It does not change anywhere in the universe.",
    },
  },
  overlays: [
    { key: "forces", label: "Force arrows", default: true },
    { key: "compare", label: "Comparison", default: true },
    { key: "trail", label: "Drift trail", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "mass-and-distance",
      title: "What controls the pull?",
      question: "How does the pull between two masses change with mass and with distance?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-4"],
      setup: { scene: "pair", massA: 60, massB: 60, release: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict",
          instruction: "Two 60 kg masses are pulling on each other.",
          predict: {
            prompt: "You move them twice as far apart. The pull becomes...",
            options: ["half as big", "a quarter as big", "the same", "twice as big"],
            correct: 1,
            reveal: "A quarter. Gravity follows 1 ÷ distance², exactly like the electric force does.",
          },
        },
        {
          id: "distance",
          phase: "measure",
          title: "Four distances",
          instruction: "Record the pull at 2, 4, 6 and 8 m.",
          requireData: 4,
          hints: ["Drag the right mass. The ruler under it reads metres."],
        },
        {
          id: "mass",
          phase: "measure",
          title: "Now change a mass",
          instruction: "Hold 4 m and record with the right mass at 60 kg, then 1500 kg.",
          requireData: 6,
          check: {
            describe: "The right mass is at least 1000 kg",
            test: (v) => (v.params.massB as number) >= 1000,
          },
        },
        {
          id: "notice",
          phase: "analyze",
          title: "Why has nobody noticed?",
          instruction: "Compare the pull with the weight of one of the masses on Earth.",
          write: {
            prompt: "How many times smaller is the pull between the two masses than their weight? Why does that matter?",
            placeholder: "The pull was about ... times smaller, so ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the law",
          instruction: "Write how the pull depends on both masses and the distance.",
          write: {
            prompt: "Write the rule for gravity between two masses, and say why it is never a push.",
            placeholder: "The pull gets bigger when ... and smaller when ... It never pushes because ...",
          },
        },
      ],
    },
    {
      id: "mass-vs-weight",
      title: "Mass or weight — which one travels?",
      question: "You take yourself and a bathroom scale to the Moon. What changes?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-4"],
      setup: { scene: "world", world: "earth", bodyMass: 50 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "You weigh yourself on Earth, then on the Moon.",
          predict: {
            prompt: "On the Moon, compared with Earth, your mass and your weight are...",
            options: [
              "both six times smaller",
              "mass the same, weight six times smaller",
              "mass six times smaller, weight the same",
            ],
            correct: 1,
            reveal: "Your mass is how much of you there is, and it travels with you. Weight is the pull on that mass, and the Moon pulls with about one sixth of Earth's strength.",
          },
        },
        {
          id: "tour",
          phase: "measure",
          title: "Take the scale on tour",
          instruction: "Record the reading on Earth, the Moon, Mars and Jupiter.",
          requireData: 4,
          hints: ["Watch the kilogram label beside you as you switch worlds."],
        },
        {
          id: "iss",
          phase: "setup",
          title: "Now the space station",
          instruction: "Switch to the space station and look at the strength of gravity there.",
          check: {
            describe: "You are on the space station",
            test: (v) => v.params.world === "iss",
          },
          hints: ["Gravity 420 km up is still about 89% of what it is on the ground."],
        },
        {
          id: "explain",
          phase: "analyze",
          title: "So why do they float?",
          instruction: "The scale reads zero, but gravity is nearly as strong as on the ground.",
          write: {
            prompt: "If gravity is still strong up there, why does an astronaut float?",
            placeholder: "The astronaut, the station and the scale are all ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say it in your own words",
          instruction: "Define mass and weight so somebody else could tell them apart.",
          write: {
            prompt: "Write definitions of mass and weight, and say which one a bathroom scale really measures.",
            placeholder: "Mass is ... Weight is ... A bathroom scale actually measures ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "high-jump",
      title: "Jump a metre",
      brief: "Find a world where your ordinary jump clears one metre.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { scene: "world", world: "earth", bodyMass: 50 },
      goal: {
        describe: "Jump height above 1 m",
        test: (v) => (v.facts.jumpHeight as number) >= 1 && v.params.world !== "iss",
      },
      stars: {
        two: {
          describe: "Jump height above 2 m",
          test: (v) => (v.facts.jumpHeight as number) >= 2 && v.params.world !== "iss",
        },
        three: {
          describe: "Jump height above 6 m",
          test: (v) => (v.facts.jumpHeight as number) >= 6 && v.params.world !== "iss",
        },
      },
      hints: [
        "Your jump goes higher where gravity is weaker.",
        "Weak gravity means a small mass, a big radius, or both.",
      ],
    },
    {
      id: "meet-in-an-hour",
      title: "Meet within the hour",
      brief: "Start the two masses at least 4 m apart and have them drift together in under an hour.",
      bands: ["6-8", "9-12"],
      setup: { scene: "pair", massA: 60, massB: 60, release: false },
      goal: {
        describe: "Drift time under 1 hour from a start of 4 m or more",
        test: (v) => (v.facts.driftHours as number) < 1 && (v.facts.separation as number) >= 4,
      },
      stars: {
        two: {
          describe: "Under 45 minutes from 4 m or more",
          test: (v) => (v.facts.driftHours as number) < 0.75 && (v.facts.separation as number) >= 4,
        },
        three: {
          describe: "Under 45 minutes from 6 m or more",
          test: (v) => (v.facts.driftHours as number) < 0.75 && (v.facts.separation as number) >= 6,
        },
      },
      hints: [
        "The pull is feeble, so the only way to hurry it up is more mass.",
        "Both masses count: the drift time depends on their total.",
        "Switch the time-lapse on to watch it actually happen.",
      ],
    },
  ],
};
