import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, label } from "@ui/draw";
import {
  badge, caption, comet, glow, groundPlane, hexA, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Earth's Four Spheres — Grades 5-10.
 *
 * Earth is not four separate subjects that happen to share a planet. Set off a
 * volcano, a wildfire, a flood or an algal bloom and the consequences walk from
 * sphere to sphere in a definite order, carrying matter one step and energy the
 * next. This sim makes a student trace that order themselves.
 *
 * The second idea is the harder one and the reason Unit A exists at all: where
 * you draw the boundary decides what counts as an input and what counts as an
 * output. The very same volcanic ash is an *output* of the mountainside and an
 * internal transfer of the planet. Nothing about the ash changed — the boundary
 * did. Drawn at the planet, Earth turns out to be very nearly closed to matter
 * (about 40,000 tonnes of meteoritic dust a year against a planet of
 * 5.97 × 10²⁴ kg) and wide open to energy (340 W/m² in, 239 W/m² back out).
 *
 * Energy-budget values are the standard global annual means (Trenberth et al.);
 * the ~0.9 W/m² that does not balance is Earth's measured energy imbalance.
 */

/* ------------------------------------------------------------------ *
 * Science constants
 * ------------------------------------------------------------------ */

/** Global annual mean shortwave arriving at the top of the atmosphere, W/m². */
export const SOLAR_IN = 340.2;
/** Reflected straight back to space by clouds, air and the surface, W/m². */
export const REFLECTED = 99.9;
/** Longwave radiation leaving the top of the atmosphere, W/m². */
export const OUTGOING_IR = 239.4;
/** Meteoritic and cosmic dust swept up by Earth each year, kg. */
export const METEORITE_KG_PER_YEAR = 4.0e7;
/** Earth's mass, kg. */
export const EARTH_MASS = 5.9722e24;

export type SphereName = "geosphere" | "hydrosphere" | "atmosphere" | "biosphere";

export const SPHERE_LABEL: Record<SphereName, string> = {
  geosphere: "Geosphere",
  hydrosphere: "Hydrosphere",
  atmosphere: "Atmosphere",
  biosphere: "Biosphere",
};

/** Semantic colour for each sphere: rock is solid, water liquid, air gas, life a producer. */
const SPHERE_SEMANTIC: Record<SphereName, string> = {
  geosphere: "solid",
  hydrosphere: "liquid",
  atmosphere: "gas",
  biosphere: "producer",
};

/** How far a transfer reaches — the smallest boundary that still contains it. */
export type Scale = "site" | "region" | "planet";

const SCALE_ORDER: Record<Scale, number> = { site: 0, region: 1, planet: 2 };

export interface Transfer {
  from: SphereName;
  to: SphereName;
  /** What crosses the boundary between the two spheres. */
  carrier: "matter" | "energy";
  /** Short label drawn on the arrow. */
  what: string;
  /** One sentence a student reads while the arrow is live. */
  detail: string;
  scale: Scale;
}

export interface EarthEvent {
  key: string;
  label: string;
  /** Where it happens, named on the stage. */
  place: string;
  steps: Transfer[];
}

/* ------------------------------------------------------------------ *
 * The four cascades
 * ------------------------------------------------------------------ */

export const EVENTS: Record<string, EarthEvent> = {
  volcano: {
    key: "volcano",
    label: "Volcanic eruption",
    place: "Mount Shasta, California",
    steps: [
      {
        from: "geosphere", to: "atmosphere", carrier: "matter", scale: "planet",
        what: "ash · CO₂ · SO₂",
        detail: "Magma rises and erupts, throwing rock dust and gas into the air.",
      },
      {
        from: "geosphere", to: "atmosphere", carrier: "energy", scale: "region",
        what: "heat from magma",
        detail: "Magma at about 1100 °C dumps thermal energy straight into the air.",
      },
      {
        from: "atmosphere", to: "geosphere", carrier: "matter", scale: "region",
        what: "ash fall",
        detail: "Ash settles back out and blankets the ground in new mineral matter.",
      },
      {
        from: "atmosphere", to: "hydrosphere", carrier: "matter", scale: "planet",
        what: "sulfate aerosol",
        detail: "SO₂ turns into tiny droplets that spread right around the planet.",
      },
      {
        from: "atmosphere", to: "biosphere", carrier: "energy", scale: "planet",
        what: "less sunlight",
        detail: "Those droplets reflect sunlight. Pinatubo in 1991 cooled Earth about 0.5 °C.",
      },
      {
        from: "hydrosphere", to: "biosphere", carrier: "matter", scale: "region",
        what: "iron and ash nutrients",
        detail: "Ash fertilises the ocean surface and plankton bloom on it.",
      },
      {
        from: "geosphere", to: "biosphere", carrier: "matter", scale: "site",
        what: "new soil",
        detail: "Weathered ash becomes some of the most fertile soil on Earth.",
      },
    ],
  },

  wildfire: {
    key: "wildfire",
    label: "Wildfire",
    place: "Sierra Nevada foothills",
    steps: [
      {
        from: "biosphere", to: "atmosphere", carrier: "energy", scale: "site",
        what: "stored chemical energy",
        detail: "Energy locked in wood by photosynthesis is released as heat and light.",
      },
      {
        from: "biosphere", to: "atmosphere", carrier: "matter", scale: "planet",
        what: "CO₂ · smoke particles",
        detail: "Carbon that was living tissue an hour ago is now gas in the air.",
      },
      {
        from: "atmosphere", to: "biosphere", carrier: "energy", scale: "region",
        what: "smoke shades the ground",
        detail: "Thick smoke cuts the sunlight reaching plants downwind for days.",
      },
      {
        from: "biosphere", to: "geosphere", carrier: "matter", scale: "site",
        what: "ash and charcoal",
        detail: "Ash falls onto the soil and seals its surface against water.",
      },
      {
        from: "geosphere", to: "hydrosphere", carrier: "matter", scale: "region",
        what: "eroded soil",
        detail: "The first storm runs off bare ground, carrying soil into the creek.",
      },
      {
        from: "hydrosphere", to: "biosphere", carrier: "matter", scale: "region",
        what: "sediment in streams",
        detail: "Mud smothers gravel beds where fish lay their eggs.",
      },
      {
        from: "geosphere", to: "biosphere", carrier: "energy", scale: "site",
        what: "heat opens cones",
        detail: "Some pine cones only open in fire heat, so the forest starts again.",
      },
    ],
  },

  flood: {
    key: "flood",
    label: "Atmospheric river flood",
    place: "Central Valley, California",
    steps: [
      {
        from: "hydrosphere", to: "atmosphere", carrier: "matter", scale: "planet",
        what: "water vapour",
        detail: "A warm Pacific evaporates, loading a narrow river of air with vapour.",
      },
      {
        from: "atmosphere", to: "hydrosphere", carrier: "energy", scale: "planet",
        what: "latent heat released",
        detail: "Condensing vapour gives back the energy it took to evaporate.",
      },
      {
        from: "atmosphere", to: "geosphere", carrier: "matter", scale: "region",
        what: "heavy rain",
        detail: "Rain lands on ground already soaked, so almost none soaks in.",
      },
      {
        from: "geosphere", to: "hydrosphere", carrier: "matter", scale: "region",
        what: "runoff and sediment",
        detail: "Water strips soil off hillsides and carries it into the rivers.",
      },
      {
        from: "hydrosphere", to: "biosphere", carrier: "matter", scale: "region",
        what: "flooded habitat",
        detail: "The floodplain drowns, and fish move onto land that was dry.",
      },
      {
        from: "hydrosphere", to: "geosphere", carrier: "matter", scale: "region",
        what: "new floodplain soil",
        detail: "As the flood slows it drops its load, building fresh farmland.",
      },
      {
        from: "biosphere", to: "hydrosphere", carrier: "energy", scale: "site",
        what: "plants slow the flow",
        detail: "Roots and stems take energy out of the water and hold the bank.",
      },
    ],
  },

  bloom: {
    key: "bloom",
    label: "Algal bloom",
    place: "A farmed watershed and its bay",
    steps: [
      {
        from: "geosphere", to: "hydrosphere", carrier: "matter", scale: "region",
        what: "nitrogen · phosphorus",
        detail: "Fertiliser washes off fields and runs downhill into the bay.",
      },
      {
        from: "atmosphere", to: "biosphere", carrier: "energy", scale: "planet",
        what: "sunlight",
        detail: "Sunlight plus those nutrients is everything algae need to multiply.",
      },
      {
        from: "hydrosphere", to: "biosphere", carrier: "matter", scale: "site",
        what: "nutrients taken up",
        detail: "Algae take up the nutrients and cover the surface in days.",
      },
      {
        from: "biosphere", to: "hydrosphere", carrier: "matter", scale: "site",
        what: "dead algae sink",
        detail: "The bloom dies and sinks, and bacteria start decomposing it.",
      },
      {
        from: "hydrosphere", to: "biosphere", carrier: "matter", scale: "site",
        what: "oxygen used up",
        detail: "Decomposers strip the oxygen out of the water: a dead zone.",
      },
      {
        from: "biosphere", to: "atmosphere", carrier: "matter", scale: "planet",
        what: "CO₂ from decay",
        detail: "Carbon the algae fixed last week goes back to the air as CO₂.",
      },
      {
        from: "biosphere", to: "geosphere", carrier: "matter", scale: "site",
        what: "organic mud",
        detail: "What is left settles into the sediment on the floor of the bay.",
      },
    ],
  },
};

export const EVENT_KEYS = ["volcano", "wildfire", "flood", "bloom"] as const;

/* ------------------------------------------------------------------ *
 * Boundary logic — the heart of Unit A
 * ------------------------------------------------------------------ */

export type BoundaryKey = "site" | "region" | "planet";

export const BOUNDARY_LABEL: Record<BoundaryKey, string> = {
  site: "Just the site",
  region: "The whole region",
  planet: "The whole planet",
};

/**
 * Does this transfer cross the chosen boundary? A transfer that reaches
 * further than the boundary does — ash lofted around the world when you only
 * drew a box round the mountain — is an output of the system you defined.
 */
export function crossesBoundary(transfer: Transfer, boundary: BoundaryKey): boolean {
  return SCALE_ORDER[transfer.scale] > SCALE_ORDER[boundary];
}

/** Earth at planet scale is open to energy and, to a very good approximation, closed to matter. */
export function matterClosed(boundary: BoundaryKey): boolean {
  return boundary === "planet";
}

/** Fraction of Earth's mass arriving from space each year — the size of "very nearly closed". */
export function meteoriteMassFraction(): number {
  return METEORITE_KG_PER_YEAR / EARTH_MASS;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** Seconds since the event was triggered. */
  t: number;
  /** How many transfers have fired. */
  fired: number;
  /** Spheres in the order the event first reached them. */
  order: SphereName[];
  /** 0..1 progress of the arrow currently animating. */
  pulse: number;
  /** Set once the whole cascade has played out. */
  complete: boolean;
  restarts: number;
}

type Params = Record<string, number | boolean | string>;

const STEP_SECONDS = 2.4;

function eventOf(params: Params): EarthEvent {
  return EVENTS[params.event as string] ?? EVENTS.volcano;
}

function freshState(): State {
  return { t: 0, fired: 0, order: [], pulse: 0, complete: false, restarts: 0 };
}

/** Spheres touched, in first-touch order, by the first n transfers. */
export function touchOrder(event: EarthEvent, n: number): SphereName[] {
  const seen: SphereName[] = [];
  for (let i = 0; i < Math.min(n, event.steps.length); i++) {
    for (const s of [event.steps[i].from, event.steps[i].to]) {
      if (!seen.includes(s)) seen.push(s);
    }
  }
  return seen;
}

/** Transfers among the first n that leave the chosen boundary. */
export function crossingCount(
  event: EarthEvent, n: number, boundary: BoundaryKey, carrier: "matter" | "energy",
): number {
  let count = 0;
  for (let i = 0; i < Math.min(n, event.steps.length); i++) {
    const step = event.steps[i];
    if (step.carrier === carrier && crossesBoundary(step, boundary)) count++;
  }
  return count;
}

const model: SimModel<State> = {
  init() {
    return freshState();
  },

  applyParams(state, params, prev) {
    if (params.event !== prev.event) return freshState();
    return state;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;
    for (const input of inputs) {
      const restart =
        (input.type === "action" && (input.action === "launch" || input.action === "trigger")) ||
        input.type === "pointerdown";
      if (restart) s = { ...freshState(), restarts: s.restarts + 1 };
    }
    if (dt <= 0) return s;

    const event = eventOf(params);
    const rate = params.rate as number;
    const t = s.t + dt * rate;
    const stepsDone = Math.min(event.steps.length, Math.floor(t / STEP_SECONDS));
    const pulse = Math.min(1, (t % STEP_SECONDS) / (STEP_SECONDS * 0.75));

    return {
      t,
      fired: stepsDone,
      order: touchOrder(event, stepsDone),
      pulse: stepsDone >= event.steps.length ? 1 : pulse,
      complete: stepsDone >= event.steps.length,
      restarts: s.restarts,
    };
  },

  readouts(state, params) {
    const event = eventOf(params);
    const boundary = params.boundary as BoundaryKey;
    return [
      {
        key: "steps", label: "Transfers so far", quantity: q(state.fired, "count"),
        semantic: "field", graphable: true,
      },
      {
        key: "spheres", label: "Spheres involved", quantity: q(state.order.length, "count"),
        semantic: "producer", graphable: true,
      },
      {
        key: "matterOut", label: "Matter leaving the system",
        quantity: q(crossingCount(event, state.fired, boundary, "matter"), "count"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "energyOut", label: "Energy leaving the system",
        quantity: q(crossingCount(event, state.fired, boundary, "energy"), "count"),
        semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "solarIn", label: "Sunlight in (W/m²)", quantity: q(SOLAR_IN, "ratio"),
        semantic: "light", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "irOut", label: "Heat radiated out (W/m²)", quantity: q(OUTGOING_IR, "ratio"),
        semantic: "hot", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "imbalance", label: "Energy imbalance (W/m²)",
        quantity: q(SOLAR_IN - REFLECTED - OUTGOING_IR, "ratio"),
        semantic: "energy-total", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const event = eventOf(params);
    const boundary = params.boundary as BoundaryKey;
    const order = state.order;
    return {
      event: event.key,
      boundary,
      stepsFired: state.fired,
      stepsTotal: event.steps.length,
      complete: state.complete,
      spheresTouched: order.length,
      allFourTouched: order.length === 4,
      firstSphere: order[0] ?? "",
      secondSphere: order[1] ?? "",
      orderText: order.map((s) => SPHERE_LABEL[s]).join(" → "),
      matterCrossings: crossingCount(event, state.fired, boundary, "matter"),
      energyCrossings: crossingCount(event, state.fired, boundary, "energy"),
      matterClosed: matterClosed(boundary),
      openForEnergy: true,
      solarIn: SOLAR_IN,
      reflected: REFLECTED,
      absorbed: SOLAR_IN - REFLECTED,
      outgoingIR: OUTGOING_IR,
      energyImbalance: SOLAR_IN - REFLECTED - OUTGOING_IR,
      meteoriteFraction: meteoriteMassFraction(),
      restarts: state.restarts,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

interface Anchor { x: number; y: number }

function anchors(width: number, height: number): Record<SphereName, Anchor> {
  return {
    atmosphere: { x: width * 0.5, y: height * 0.15 },
    hydrosphere: { x: width * 0.15, y: height * 0.66 },
    biosphere: { x: width * 0.85, y: height * 0.58 },
    geosphere: { x: width * 0.52, y: height * 0.9 },
  };
}

/** The landscape every event happens in: sea on the left, a volcano inland. */
function drawPlace(rc: RenderContext<State>, horizonY: number) {
  const { ctx, theme, width, height, time, params } = rc;
  const eventKey = params.event as string;

  sky(ctx, width, height, theme, eventKey === "wildfire" ? "dusk" : "day", horizonY);

  /* --- sun, the one input that never stops -------------------------- */
  const sunX = width * 0.12;
  const sunY = height * 0.13;
  glow(ctx, sunX, sunY, 62, theme.sci["light"], 0.5);
  sphere(ctx, sunX, sunY, 16, theme.sci["light"], { glow: 0.8 });

  /* --- ocean -------------------------------------------------------- */
  const shoreX = width * 0.34;
  groundPlane(ctx, horizonY, 0, shoreX, height, theme, "water");
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["liquid"], 0.55);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    const y = horizonY + 8 + i * ((height - horizonY) / 8);
    ctx.beginPath();
    for (let x = 0; x <= shoreX; x += 6) {
      const yy = y + Math.sin(x * 0.05 + time * 1.4 + i) * (1.4 + i * 0.35);
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();

  /* --- land and the mountain ---------------------------------------- */
  const peakX = width * 0.6;
  const peakY = horizonY - height * 0.3;
  ctx.save();
  const rockGrad = ctx.createLinearGradient(0, peakY, 0, height);
  rockGrad.addColorStop(0, hexA(theme.sci["solid"], 0.95));
  rockGrad.addColorStop(1, hexA(theme.sci["solid"], 0.55));
  ctx.fillStyle = rockGrad;
  ctx.beginPath();
  ctx.moveTo(shoreX - 6, horizonY + 4);
  ctx.lineTo(width * 0.46, horizonY - height * 0.05);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(width * 0.76, horizonY - height * 0.02);
  ctx.lineTo(width, horizonY + 10);
  ctx.lineTo(width, height);
  ctx.lineTo(shoreX - 6, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  groundPlane(ctx, height * 0.79, shoreX - 6, width, height, theme, "soil");

  /* --- forest: the biosphere you can point at ----------------------- */
  for (let i = 0; i < 9; i++) {
    const tx = width * (0.78 + (i % 5) * 0.045);
    const ty = horizonY + height * (0.02 + Math.floor(i / 5) * 0.09);
    const burn = eventKey === "wildfire" ? Math.min(1, rc.state.t / 6) : 0;
    const trunk = hexA(theme.sci["solid"], 0.9);
    material(ctx, tx - 1.6, ty - 4, 3.2, 12, trunk, 1);
    const leaf = burn > 0.4 ? theme.sci["hot"] : theme.sci["producer"];
    ctx.save();
    ctx.fillStyle = hexA(leaf, 0.92);
    ctx.beginPath();
    ctx.moveTo(tx, ty - 22);
    ctx.lineTo(tx + 8, ty - 3);
    ctx.lineTo(tx - 8, ty - 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Whatever the chosen event actually looks like, on top of the landscape. */
function drawEventEffect(rc: RenderContext<State>, horizonY: number) {
  const { ctx, theme, width, height, time, state, params } = rc;
  const key = params.event as string;
  const live = Math.min(1, state.t / 3);
  if (live <= 0) return;
  const peakX = width * 0.6;
  const peakY = horizonY - height * 0.3;

  if (key === "volcano") {
    glow(ctx, peakX, peakY, 40 * live, theme.sci["hot"], 0.7);
    ctx.save();
    ctx.globalAlpha = 0.42 * live;
    ctx.fillStyle = theme.sci["gas"];
    ctx.beginPath();
    ctx.moveTo(peakX - 10, peakY);
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      const y = peakY - f * (peakY - height * 0.06);
      ctx.lineTo(peakX - 10 - f * 46 + Math.sin(time * 1.6 + i) * 5, y);
    }
    for (let i = 10; i >= 0; i--) {
      const f = i / 10;
      const y = peakY - f * (peakY - height * 0.06);
      ctx.lineTo(peakX + 10 + f * 46 + Math.sin(time * 1.3 + i) * 5, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const f = ((time * 0.4 + i / 8) % 1);
      sphere(ctx, peakX + Math.sin(i * 2.1 + time) * 26, peakY - f * (peakY - height * 0.08),
        3.5, theme.sci["mass"], { rim: false });
    }
  }

  if (key === "wildfire") {
    for (let i = 0; i < 12; i++) {
      const fx = width * (0.74 + (i % 6) * 0.04);
      const fy = horizonY + height * (0.03 + Math.floor(i / 6) * 0.09);
      const flick = 1 + 0.35 * Math.sin(time * 8 + i * 1.7);
      glow(ctx, fx, fy - 6, 18 * live * flick, theme.sci["hot"], 0.7);
    }
    ctx.save();
    ctx.globalAlpha = 0.3 * live;
    ctx.fillStyle = theme.sci["gas"];
    ctx.beginPath();
    ctx.ellipse(width * 0.7, horizonY - height * 0.12, width * 0.3, height * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (key === "flood") {
    const level = horizonY + (height - horizonY) * 0.16 - live * height * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = theme.sci["liquid"];
    ctx.fillRect(0, level, width, height - level);
    ctx.restore();
    for (let i = 0; i < 26; i++) {
      const rx = ((i * 97 + time * 90) % width);
      const ry = ((i * 53 + time * 260) % (horizonY + 20));
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["liquid"], 0.55);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 9);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (key === "bloom") {
    ctx.save();
    ctx.globalAlpha = 0.45 * live;
    ctx.fillStyle = theme.sci["producer"];
    ctx.beginPath();
    for (let x = 0; x <= width * 0.34; x += 5) {
      const y = horizonY + 6 + Math.sin(x * 0.06 + time) * 3;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(width * 0.34, horizonY + 60);
    ctx.lineTo(0, horizonY + 60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** The dashed system boundary, and the arrows that cross it. */
function drawBoundary(rc: RenderContext<State>, horizonY: number) {
  const { ctx, theme, width, height, params, band } = rc;
  const boundary = params.boundary as BoundaryKey;
  const box =
    boundary === "site" ? { x: width * 0.46, y: horizonY - height * 0.36, w: width * 0.26, h: height * 0.46 }
      : boundary === "region" ? { x: width * 0.06, y: height * 0.3, w: width * 0.88, h: height * 0.66 }
        : { x: 6, y: 6, w: width - 12, h: height - 12 };

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();

  caption(ctx, box.x + 8, box.y + 12, BOUNDARY_LABEL[boundary], rc.theme, {
    size: 11, color: theme.accent, weight: 700,
  });

  if (band === "K-2") return;

  // Energy always crosses: sunlight down, infrared back up. That never changes,
  // whichever boundary the student picked.
  const inX = box.x + box.w * 0.3;
  const outX = box.x + box.w * 0.62;
  arrow(ctx, inX, box.y - 22, inX, box.y + 6, theme.sci["light"], { width: 2.4 });
  arrow(ctx, outX, box.y + 6, outX, box.y - 22, theme.sci["hot"], { width: 2.4 });
  if (band !== "3-5") {
    label(ctx, `${SOLAR_IN.toFixed(0)} W/m² in`, inX - 6, box.y - 30, rc.theme, {
      align: "right", size: 10, color: theme.sci["light"],
    });
    label(ctx, `${OUTGOING_IR.toFixed(0)} W/m² out`, outX + 6, box.y - 30, rc.theme, {
      size: 10, color: theme.sci["hot"],
    });
  }
}

/** One transfer arrow, dimmed when it is history and lit while it is happening. */
function drawTransfer(
  rc: RenderContext<State>, t: Transfer, from: Anchor, to: Anchor, live: boolean, progress: number,
) {
  const { ctx, theme, band } = rc;
  const color = t.carrier === "matter" ? theme.sci["mass"] : theme.sci["energy-thermal"];
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const start = { x: from.x + ux * 26, y: from.y + uy * 26 };
  const end = { x: to.x - ux * 26, y: to.y - uy * 26 };

  ctx.save();
  ctx.globalAlpha = live ? 1 : 0.24;
  arrow(ctx, start.x, start.y, end.x, end.y, color, {
    width: live ? 3 : 1.8,
    dashed: t.carrier === "energy",
  });
  ctx.restore();

  if (!live) return;

  // A packet of matter or energy actually travelling the arrow.
  const tail: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const f = Math.max(0, progress - i * 0.035);
    tail.unshift({ x: start.x + (end.x - start.x) * f, y: start.y + (end.y - start.y) * f });
  }
  comet(ctx, tail, color, 5);
  const px = start.x + (end.x - start.x) * progress;
  const py = start.y + (end.y - start.y) * progress;
  sphere(ctx, px, py, 6, color, { glow: 0.7 });

  if (band !== "K-2") {
    badge(ctx, (start.x + end.x) / 2, (start.y + end.y) / 2 - 16, t.what, rc.theme, {
      align: "center", color,
    });
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const event = eventOf(params);
  const horizonY = height * 0.52;

  drawPlace(rc, horizonY);
  drawEventEffect(rc, horizonY);

  const A = anchors(width, height);

  /* --- name the four spheres where they actually are ---------------- */
  if (overlays.spheres !== false) {
    for (const key of Object.keys(A) as SphereName[]) {
      const a = A[key];
      const touched = state.order.includes(key);
      const color = theme.sci[SPHERE_SEMANTIC[key]];
      ctx.save();
      ctx.globalAlpha = touched ? 0.9 : 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = touched ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (touched) glow(ctx, a.x, a.y, 34, color, 0.35);
      const order = state.order.indexOf(key);
      caption(ctx, a.x, a.y, touched ? String(order + 1) : "·", theme, {
        align: "center", size: touched ? 17 : 15, color, weight: 800,
      });
      if (band !== "K-2") {
        caption(ctx, a.x, a.y + 36, SPHERE_LABEL[key], theme, {
          align: "center", size: 11, color,
        });
      }
    }
  }

  /* --- the cascade -------------------------------------------------- */
  if (overlays.transfers !== false) {
    for (let i = 0; i < state.fired; i++) {
      const step = event.steps[i];
      const live = i === state.fired - 1 && !state.complete;
      drawTransfer(rc, step, A[step.from], A[step.to], live, live ? state.pulse : 1);
    }
    // While the cascade is complete, keep the last arrow lit so the stage is
    // never a set of grey lines with nothing happening.
    if (state.complete && event.steps.length > 0) {
      const last = event.steps[event.steps.length - 1];
      drawTransfer(rc, last, A[last.from], A[last.to], true, 1);
    }
  }

  drawBoundary(rc, horizonY);

  /* --- what just happened, in words --------------------------------- */
  const current = event.steps[Math.max(0, Math.min(state.fired - 1, event.steps.length - 1))];
  if (state.fired > 0 && band !== "K-2") {
    const boxH = 34;
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, 0.86);
    ctx.fillRect(0, height - boxH, width, boxH);
    ctx.strokeStyle = theme.line;
    ctx.beginPath();
    ctx.moveTo(0, height - boxH);
    ctx.lineTo(width, height - boxH);
    ctx.stroke();
    ctx.restore();
    caption(ctx, 10, height - boxH + 12,
      `${state.fired}. ${SPHERE_LABEL[current.from]} → ${SPHERE_LABEL[current.to]}  ·  ${current.carrier}`,
      theme, { size: 11, color: current.carrier === "matter" ? theme.sci["mass"] : theme.sci["energy-thermal"] });
    caption(ctx, 10, height - boxH + 25, current.detail, theme, { size: 11, color: theme.inkSoft });
  }

  /* --- the trace a student is being asked to build ------------------ */
  if (overlays.trace !== false && state.order.length > 0 && band !== "K-2") {
    const text = state.order.map((s) => SPHERE_LABEL[s]).join("  →  ");
    caption(ctx, width - 10, 18, text, theme, { align: "right", size: 12, weight: 700 });
  }

  caption(ctx, 10, 18, `${event.label} — ${event.place}`, theme, { size: 13, weight: 700 });
  if (state.fired === 0) {
    caption(ctx, width / 2, height * 0.42, "Press play to set the event off", theme, {
      align: "center", size: 15, color: theme.accent, weight: 700,
    });
  }

  vignette(ctx, width, height, 0.15);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const spheresSim: SimManifest<State> = {
  id: "earth.spheres",
  title: "Earth's Four Spheres",
  tagline: "Set off a volcano, a fire or a flood and trace where it goes next.",
  subject: "earth",
  bands: ["3-5", "6-8", "9-12"],
  grades: [4, 5, 6, 7, 8, 9],
  standards: { ngss: ["MS-ESS2-1", "MS-ESS3-5", "5-ESS2-1"] },
  learningGoals: [
    "Name Earth's four spheres and give an example of matter moving between two of them.",
    "Trace an event through the spheres in order, saying what carries each step.",
    "Choose a system boundary and identify the inputs and outputs it creates.",
    "Explain why Earth is open to energy but very nearly closed to matter.",
  ],
  misconceptions: [
    "The four spheres are separate places that do not touch",
    "The atmosphere is empty space, not a sphere made of matter",
    "A system's boundary is fixed by nature rather than chosen by the modeller",
    "Earth is a closed system, so nothing goes in or out",
  ],
  interactionHint: "Pick an event, press play, and watch which sphere it reaches first.",
  tickRate: 60,
  params: {
    event: {
      type: "option", label: "Event",
      options: [
        { value: "volcano", label: "Volcanic eruption" },
        { value: "wildfire", label: "Wildfire" },
        { value: "flood", label: "Atmospheric river flood" },
        { value: "bloom", label: "Algal bloom" },
      ],
      default: "volcano",
      help: "Each event starts in a different sphere. Watch which one goes first.",
    },
    boundary: {
      type: "option", label: "System boundary",
      options: [
        { value: "site", label: "Just the site" },
        { value: "region", label: "The whole region" },
        { value: "planet", label: "The whole planet" },
      ],
      default: "region",
      bands: ["6-8", "9-12"],
      help: "Move the boundary out and watch outputs turn into internal transfers.",
    },
    rate: {
      type: "number", label: "Speed", kind: "ratio",
      min: 0.25, max: 3, step: 0.25, default: 1,
      help: "How fast the event walks from one sphere to the next.",
    },
  },
  overlays: [
    { key: "spheres", label: "Sphere markers", default: true },
    { key: "transfers", label: "Transfer arrows", default: true },
    { key: "trace", label: "Order trace", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "trace-an-event",
      title: "Trace an eruption through the spheres",
      question: "When a volcano erupts, which spheres does it reach, and in what order?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-1"],
      setup: { event: "volcano", boundary: "region", rate: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit to an answer before you press play.",
          predict: {
            prompt: "How many of Earth's four spheres does one volcanic eruption reach?",
            options: ["Only the geosphere", "Two of them", "Three of them", "All four"],
            correct: 3,
            reveal:
              "All four. Rock and gas go into the air, aerosols reach the ocean, and the ash ends up as soil that plants grow in.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Run the eruption",
          instruction: "Play the whole cascade and record the count of spheres and transfers.",
          requireData: 2,
          check: {
            describe: "All four spheres have been reached",
            test: (v) => Boolean(v.facts.allFourTouched),
          },
          hints: [
            "The number in each ring is the order the event reached that sphere.",
            "Solid arrows carry matter. Dashed arrows carry energy.",
          ],
        },
        {
          id: "compare",
          phase: "measure",
          title: "Now try the wildfire",
          instruction: "Switch the event to Wildfire and run it. Which sphere starts it?",
          check: {
            describe: "The wildfire cascade has started in the biosphere",
            test: (v) => v.params.event === "wildfire" && v.facts.firstSphere === "biosphere",
          },
          requireData: 3,
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Compare the two",
          instruction: "The eruption starts in rock, the fire starts in living things. What is the same?",
          write: {
            prompt: "What did the eruption and the wildfire both do to the atmosphere?",
            placeholder: "Both events put ... into the air, which then ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Say what an event in one sphere does to the others.",
          write: {
            prompt: "Why can an event in one sphere never stay in that sphere?",
            placeholder: "The spheres are connected because ...",
          },
        },
      ],
    },
    {
      id: "draw-the-boundary",
      title: "Where you draw the line",
      question: "Does moving the system boundary change what counts as an output?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS2-1"],
      setup: { event: "volcano", boundary: "site", rate: 1.5 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you move the boundary.",
          predict: {
            prompt: "If you widen the boundary from the site to the whole planet, what happens to the outputs?",
            options: [
              "Nothing — outputs are a property of the event",
              "There are fewer outputs, because more transfers stay inside",
              "There are more outputs, because the system is bigger",
            ],
            correct: 1,
            reveal:
              "Widen the boundary and transfers that used to leave are now internal. The event did not change; your model of it did.",
          },
        },
        {
          id: "site",
          phase: "measure",
          title: "Boundary at the site",
          instruction: "Run the eruption with the boundary at the site. Record the matter leaving.",
          check: { describe: "Boundary set to the site", test: (v) => v.params.boundary === "site" },
          requireData: 2,
        },
        {
          id: "planet",
          phase: "measure",
          title: "Boundary at the planet",
          instruction: "Now set the boundary to the whole planet and run it again. Record again.",
          check: {
            describe: "Boundary at the planet with no matter leaving",
            test: (v) => v.params.boundary === "planet" && (v.readouts.matterOut ?? 0) === 0,
          },
          requireData: 4,
          hints: ["At planet scale, ash that circles the world is still inside the system."],
        },
        {
          id: "open-closed",
          phase: "analyze",
          title: "Open or closed?",
          instruction: "Energy arrows still cross the planet boundary. Matter arrows do not.",
          write: {
            prompt: "Is Earth an open or a closed system? Answer separately for matter and for energy.",
            placeholder: "For energy Earth is ... because ... For matter Earth is nearly ... because ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the choice",
          instruction: "Boundaries are chosen, not found. Say why a scientist would choose each one.",
          write: {
            prompt: "Give one question you would answer with the site boundary and one with the planet boundary.",
            placeholder: "To find out how much ash landed on the town I would use ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "all-four",
      title: "Reach all four",
      brief: "Run any event until it has touched every one of Earth's four spheres.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { event: "bloom", boundary: "region", rate: 1 },
      goal: {
        describe: "All four spheres reached",
        test: (v) => Boolean(v.facts.allFourTouched),
      },
      stars: {
        two: {
          describe: "Finish the whole cascade",
          test: (v) => Boolean(v.facts.complete),
        },
        three: {
          describe: "Finish a cascade that starts in the geosphere",
          test: (v) => Boolean(v.facts.complete) && v.facts.firstSphere === "geosphere",
        },
      },
      hints: [
        "The algal bloom starts with fertiliser washing off the land.",
        "Let it play right to the last transfer.",
      ],
    },
    {
      id: "close-the-system",
      title: "Close the system",
      brief: "Find a boundary where no matter leaves, but energy still does.",
      bands: ["6-8", "9-12"],
      setup: { event: "volcano", boundary: "site", rate: 2 },
      goal: {
        describe: "A completed cascade with zero matter crossings",
        test: (v) => Boolean(v.facts.complete) && (v.facts.matterCrossings as number) === 0,
      },
      stars: {
        two: {
          describe: "Do it at the planet boundary",
          test: (v) =>
            Boolean(v.facts.complete) && (v.facts.matterCrossings as number) === 0 &&
            Boolean(v.facts.matterClosed),
        },
      },
      hints: [
        "Only one boundary contains everything the ash does.",
        "Sunlight and infrared cross that boundary anyway — that is the point.",
      ],
    },
  ],
};
