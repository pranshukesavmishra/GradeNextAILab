import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, roundRect } from "@ui/draw";
import {
  badge, caption, contactShadow, glow, groundPlane, hexA, isDarkTheme, material, sky, sphere,
  vignette,
} from "@ui/scene";

/**
 * Electric Force — Grade 8, Unit C2.
 *
 * Two charged spheres on a bench. Drag one along the metre rule and watch the
 * force on BOTH of them change together: same size, opposite direction, every
 * time. The numbers are Coulomb's law with the real constant, so a student who
 * records force against distance and plots F against 1/r² gets a straight line
 * out of their own measurements rather than out of a formula we told them.
 *
 * The second scenario is a thunderstorm: charge piles up on the cloud base
 * until the field at the ground reaches the breakdown strength of air,
 * 3 × 10⁶ V/m, and the air conducts. Static electricity at the scale of a sky.
 *
 * Serves C2.1 charge, C2.2 asking questions of data, C2.3 distance,
 * C2.4 charge magnitude, C2.5 static electricity and lightning, and C1.4
 * attraction and repulsion.
 */

/* ------------------------------------------------------------------ *
 * Geometry of the bench
 *
 * Pointer events arrive from the shell in canvas pixels, and the model is
 * never told how big the canvas is, so the bench is laid out in pixels and
 * converted to metres by one fixed scale. That keeps the metre rule the
 * student drags along and the separation the model computes in exact
 * agreement at any stage size.
 * ------------------------------------------------------------------ */

/** Sphere A sits this many pixels in from the left edge, at every stage size. */
export const ANCHOR_PX = 92;
/** Real metres per screen pixel along the bench. */
export const M_PER_PX = 0.0025;
export const R_MIN = 0.05;
export const R_MAX = 1.6;

/** Air breaks down and conducts at about 3 MV/m — the lightning threshold. */
export const BREAKDOWN_FIELD = 3.0e6;

/** Coulomb's law for two point charges, in newtons. */
export function coulombForce(q1: number, q2: number, r: number): number {
  const rr = Math.max(r, 1e-6);
  return (CONSTANTS.k_e * Math.abs(q1 * q2)) / (rr * rr);
}

/** Field of a point charge at distance r, in newtons per coulomb. */
export function pointField(charge: number, r: number): number {
  const rr = Math.max(r, 1e-6);
  return (CONSTANTS.k_e * Math.abs(charge)) / (rr * rr);
}

/** Charge the cloud must hold before the air below it breaks down, in C. */
export function breakdownCharge(height: number): number {
  return (BREAKDOWN_FIELD * height * height) / CONSTANTS.k_e;
}

interface State {
  /** Separation of the two spheres, m. Dragged, not typed. */
  r: number;
  dragging: boolean;
  /** Storm: charge on the cloud base, C. */
  cloudQ: number;
  /** Storm: 1 at the instant of a strike, decaying to 0. */
  flash: number;
  strikes: number;
  /** Horizontal wobble of the last bolt, in pixels, top to bottom. */
  bolt: number[];
  /** Charge moved by the last strike, C. */
  lastBoltCharge: number;
  t: number;
}

/** Microcoulombs are the working unit on the bench; the model stores coulombs. */
const MICRO = 1e-6;

function chargesOf(params: Record<string, number | boolean | string>) {
  return {
    qA: (params.chargeA as number) * MICRO,
    qB: (params.chargeB as number) * MICRO,
  };
}

const model: SimModel<State> = {
  init() {
    return {
      r: 0.4, dragging: false, cloudQ: 0, flash: 0, strikes: 0,
      bolt: [], lastBoltCharge: 0, t: 0,
    };
  },

  step(state, dt, params, ctx, inputs) {
    let s = state;

    // Dragging sphere B along the bench. The pointer x is a canvas pixel, and
    // the bench maps pixels to metres with one fixed scale, so the separation
    // the student reads off the rule is the separation the physics uses.
    for (const input of inputs) {
      if (input.type === "pointerdown" && input.x > ANCHOR_PX + 14) {
        s = { ...s, dragging: true, r: snapR(input.x) };
      } else if (input.type === "pointermove" && s.dragging) {
        s = { ...s, r: snapR(input.x) };
      } else if (input.type === "pointerup") {
        s = { ...s, dragging: false };
      }
    }

    const t = s.t + dt;
    if ((params.scenario as string) !== "storm") {
      return { ...s, t, flash: Math.max(0, s.flash - dt * 3) };
    }

    /* ---- thunderstorm ---- */
    const height = params.cloudHeight as number;
    const rate = params.chargeRate as number;
    let cloudQ = s.cloudQ + rate * dt;
    let flash = Math.max(0, s.flash - dt * 2.6);
    let strikes = s.strikes;
    let bolt = s.bolt;
    let lastBoltCharge = s.lastBoltCharge;

    if (cloudQ >= breakdownCharge(height)) {
      // The air conducts: the cloud dumps its charge to the ground.
      lastBoltCharge = cloudQ;
      strikes += 1;
      flash = 1;
      cloudQ = 0;
      // A deterministic zigzag, drawn from the seeded stream so a replay of
      // this storm produces the very same bolt.
      bolt = [];
      let x = 0;
      for (let i = 0; i < 9; i++) {
        x += ctx.rng.range(-14, 14);
        bolt.push(x);
      }
    }

    return { ...s, t, cloudQ, flash, strikes, bolt, lastBoltCharge };
  },

  readouts(state, params) {
    const { qA, qB } = chargesOf(params);
    const storm = (params.scenario as string) === "storm";

    if (storm) {
      const height = params.cloudHeight as number;
      const field = pointField(state.cloudQ, height);
      return [
        {
          key: "cloudCharge", label: "Charge on the cloud", quantity: q(state.cloudQ, "charge"),
          unit: "C", semantic: "charge-neg", graphable: true,
        },
        {
          key: "fieldAtGround", label: "Field at the ground (N/C)", quantity: q(field, "ratio"),
          semantic: "field", graphable: true,
        },
        {
          key: "percentToStrike", label: "Of the way to a strike",
          quantity: q(Math.min(1, field / BREAKDOWN_FIELD), "percent"),
          unit: "%", semantic: "field", graphable: true,
        },
        {
          key: "cloudHeight", label: "Cloud base height", quantity: q(height, "length"),
          unit: "m", semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
        },
        {
          key: "strikes", label: "Strikes so far", quantity: q(state.strikes, "count"),
          semantic: "energy-total", graphable: false,
        },
      ];
    }

    const force = coulombForce(qA, qB, state.r);
    return [
      {
        key: "force", label: "Force on each sphere", quantity: q(force, "force"),
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
        key: "forceTimesR2", label: "Force × (separation)²", quantity: q(force * state.r * state.r, "ratio"),
        semantic: "force", graphable: true, bands: ["9-12"],
      },
      {
        key: "fieldAtB", label: "Field from A at B (N/C)", quantity: q(pointField(qA, state.r), "ratio"),
        semantic: "field", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const { qA, qB } = chargesOf(params);
    const force = coulombForce(qA, qB, state.r);
    const height = params.cloudHeight as number;
    return {
      force,
      separation: state.r,
      invR2: 1 / (state.r * state.r),
      forceTimesR2: force * state.r * state.r,
      product: qA * qB,
      attract: qA * qB < 0,
      repel: qA * qB > 0,
      neutral: qA * qB === 0,
      cloudCharge: state.cloudQ,
      fieldAtGround: pointField(state.cloudQ, height),
      breakdownCharge: breakdownCharge(height),
      strikes: state.strikes,
      lastBoltCharge: state.lastBoltCharge,
      storm: (params.scenario as string) === "storm",
    };
  },
};

/** Separation in metres from a pointer x, snapped to the nearest centimetre. */
function snapR(pointerX: number): number {
  const raw = (pointerX - ANCHOR_PX) * M_PER_PX;
  const snapped = Math.round(raw * 100) / 100;
  return Math.min(R_MAX, Math.max(R_MIN, snapped));
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

/** Arrow length in pixels. Saturating, so a 90 N force still fits the stage. */
function forceArrowPx(force: number): number {
  return 20 + 96 * (force / (force + 0.35));
}

function chargeColor(theme: RenderContext<State>["theme"], charge: number): string {
  return charge >= 0 ? theme.sci["charge-pos"] : theme.sci["charge-neg"];
}

function renderBench(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const { qA, qB } = chargesOf(params);
  const railY = Math.round(height * 0.62);
  const benchY = railY + 34;

  sky(ctx, width, height, theme, "indoor", benchY);
  groundPlane(ctx, benchY, 0, width, height, theme, "lab");

  const ax = ANCHOR_PX;
  const bx = ANCHOR_PX + state.r / M_PER_PX;

  /* ---- the metre rule the separation is read from ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["distance"], 0.45);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax, railY + 20);
  ctx.lineTo(width, railY + 20);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let cm = 0; cm <= R_MAX * 100 + 1; cm += 5) {
    const x = ax + cm / 100 / M_PER_PX;
    if (x > width) break;
    const major = cm % 20 === 0;
    ctx.beginPath();
    ctx.moveTo(x, railY + 20);
    ctx.lineTo(x, railY + 20 + (major ? 9 : 5));
    ctx.stroke();
    if (major && cm > 0 && band !== "3-5") {
      ctx.fillStyle = theme.inkSoft;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${cm} cm`, x, railY + 32);
    }
  }
  ctx.restore();

  /* ---- field lines: the reason the force reaches across the gap ---- */
  if (overlays.fieldLines && band !== "3-5") {
    drawFieldLines(rc, ax, bx, railY, qA, qB);
  }

  /* ---- the two charged spheres ---- */
  const rA = band === "3-5" ? 22 : 18;
  const rB = rA;
  for (const [x, charge, r] of [[ax, qA, rA], [bx, qB, rB]] as const) {
    const color = chargeColor(theme, charge);
    contactShadow(ctx, x, benchY, r, benchY - railY);
    // The stand the sphere rests on, so it sits in the room rather than floating.
    material(ctx, x - 4, railY + 8, 8, benchY - railY - 8, theme.inkSoft, 2);
    if (charge !== 0) glow(ctx, x, railY, r * 2.6, color, 0.32);
    sphere(ctx, x, railY, r, charge === 0 ? theme.inkSoft : color, { glow: 0.25 });
    ctx.save();
    ctx.fillStyle = theme.surface;
    ctx.font = `700 ${r}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(charge > 0 ? "+" : charge < 0 ? "−" : "0", x, railY + 1);
    ctx.restore();
  }

  /* ---- the force pair: equal, opposite, always ---- */
  const force = coulombForce(qA, qB, state.r);
  const attract = qA * qB < 0;
  if (overlays.forces && force > 0) {
    const len = forceArrowPx(force);
    const dir = attract ? 1 : -1;
    arrow(ctx, ax, railY - rA - 8, ax + dir * len, railY - rA - 8, theme.sci["force"], {
      width: 3, label: band === "9-12" ? "F" : undefined,
    });
    arrow(ctx, bx, railY - rB - 8, bx - dir * len, railY - rB - 8, theme.sci["force"], {
      width: 3, label: band === "9-12" ? "F" : undefined,
    });
    if (band !== "3-5") {
      badge(ctx, (ax + bx) / 2, railY - rA - 40, `${formatForce(force)}`, theme, {
        align: "center", color: theme.sci["force"], sub: "on each sphere",
      });
    }
  }

  /* ---- separation, read out where it is measured ---- */
  badge(ctx, (ax + bx) / 2, railY + 20 + 46, `${(state.r * 100).toFixed(0)} cm`, theme, {
    align: "center", color: theme.sci["distance"],
  });
  caption(
    ctx, ax, railY - rA - (overlays.forces && force > 0 ? 62 : 30),
    attract ? "opposite charges: pulled together" : qA * qB > 0 ? "like charges: pushed apart" : "no charge, no force",
    theme, { size: 12, color: theme.inkSoft },
  );
  if (band !== "3-5") {
    caption(ctx, width - 12, height - 14, "drag the right-hand sphere", theme, {
      align: "right", size: 11, color: theme.inkSoft,
    });
  }

  /* ---- the inverse-square shape, as an inset the student can check ---- */
  if (overlays.graph && band !== "3-5") drawInset(rc, qA, qB);
}

function formatForce(force: number): string {
  if (force >= 1) return `${force.toFixed(2)} N`;
  if (force >= 0.001) return `${(force * 1000).toFixed(1)} mN`;
  return `${(force * 1e6).toFixed(1)} µN`;
}

/**
 * Streamlines of the two-charge field, integrated from seeds around each
 * sphere. Nothing about the pattern is drawn from a template: it comes out of
 * the same superposed 1/r² field the force readout comes from.
 */
function drawFieldLines(
  rc: RenderContext<State>, ax: number, bx: number, railY: number, qA: number, qB: number,
) {
  const { ctx, theme, width, height } = rc;
  const sources: { x: number; charge: number }[] = [{ x: ax, charge: qA }, { x: bx, charge: qB }];
  const field = (x: number, y: number) => {
    let ex = 0, ey = 0;
    for (const s of sources) {
      const dx = x - s.x, dy = y - railY;
      const d2 = Math.max(dx * dx + dy * dy, 64);
      const d = Math.sqrt(d2);
      const m = s.charge / (d2 * d);
      ex += m * dx;
      ey += m * dy;
    }
    return { ex, ey };
  };

  ctx.save();
  ctx.strokeStyle = hexA(theme.sci["field"], 0.5);
  ctx.lineWidth = 1.2;
  for (const src of sources) {
    if (src.charge === 0) continue;
    const outward = src.charge > 0 ? 1 : -1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.31;
      let x = src.x + Math.cos(a) * 20;
      let y = railY + Math.sin(a) * 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let step = 0; step < 130; step++) {
        const { ex, ey } = field(x, y);
        const mag = Math.hypot(ex, ey);
        if (!Number.isFinite(mag) || mag === 0) break;
        x += (outward * 4 * ex) / mag;
        y += (outward * 4 * ey) / mag;
        if (x < -40 || x > width + 40 || y < -40 || y > height + 40) break;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A live F–r curve in the corner: the shape the recorded data must follow. */
function drawInset(rc: RenderContext<State>, qA: number, qB: number) {
  const { ctx, state, theme, width, band } = rc;
  const w = Math.min(190, width * 0.32);
  const h = w * 0.62;
  const x0 = width - w - 14;
  const y0 = 14;
  if (w < 90) return;

  ctx.save();
  ctx.fillStyle = hexA(theme.surface, isDarkTheme(theme) ? 0.72 : 0.8);
  roundRect(ctx, x0, y0, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const fAt = (r: number) => coulombForce(qA, qB, r);
  const fMax = Math.max(fAt(R_MIN) * 0.35, 1e-9);
  const px = (r: number) => x0 + 10 + ((r - R_MIN) / (R_MAX - R_MIN)) * (w - 20);
  const py = (f: number) => y0 + h - 16 - Math.min(1, f / fMax) * (h - 28);

  ctx.save();
  ctx.strokeStyle = theme.sci["force"];
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const r = R_MIN + ((R_MAX - R_MIN) * i) / 60;
    const sx = px(r), sy = py(fAt(r));
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  // Where the student is standing on that curve right now.
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(px(state.r), py(fAt(state.r)), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  caption(ctx, x0 + 10, y0 + 12, band === "9-12" ? "F against r" : "force against distance", theme, {
    size: 11, color: theme.inkSoft,
  });
}

function renderStorm(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const cloudH = params.cloudHeight as number;
  const groundY = Math.round(height * 0.84);
  const cloudY = Math.round(height * 0.24);

  sky(ctx, width, height, theme, "dusk", groundY);
  if (state.flash > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 * state.flash;
    ctx.fillStyle = theme.sci["light"];
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  groundPlane(ctx, groundY, 0, width, height, theme, "grass");

  /* ---- the cloud, carrying its charge ---- */
  const cloudColor = theme.sci["charge-neg"];
  ctx.save();
  ctx.fillStyle = hexA(theme.inkSoft, isDarkTheme(theme) ? 0.55 : 0.7);
  for (const [cx, cy, r] of [
    [width * 0.32, cloudY, 46], [width * 0.46, cloudY - 16, 58],
    [width * 0.62, cloudY, 50], [width * 0.5, cloudY + 14, 62],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Charge markers along the cloud base: more charge, more minus signs.
  const fraction = Math.min(1, state.cloudQ / Math.max(breakdownCharge(cloudH), 1e-9));
  const marks = Math.round(fraction * 12);
  ctx.save();
  ctx.fillStyle = cloudColor;
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < marks; i++) {
    ctx.fillText("−", width * 0.3 + (i * width * 0.34) / 11, cloudY + 34);
  }
  ctx.restore();

  // The ground answers with the opposite charge — induced, and part of why the
  // field between them grows.
  ctx.save();
  ctx.fillStyle = theme.sci["charge-pos"];
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < marks; i++) {
    ctx.fillText("+", width * 0.3 + (i * width * 0.34) / 11, groundY - 12);
  }
  ctx.restore();

  /* ---- the bolt ---- */
  if (state.flash > 0.02 && state.bolt.length) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.flash * 1.5);
    ctx.strokeStyle = theme.sci["light"];
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.shadowColor = hexA(theme.sci["light"], 0.9);
    ctx.shadowBlur = 18;
    ctx.beginPath();
    const bx = width * 0.48;
    ctx.moveTo(bx, cloudY + 34);
    state.bolt.forEach((dx, i) => {
      const t = (i + 1) / state.bolt.length;
      ctx.lineTo(bx + dx, cloudY + 34 + t * (groundY - cloudY - 34));
    });
    ctx.stroke();
    ctx.restore();
    glow(ctx, bx, groundY, 90, theme.sci["light"], 0.5 * state.flash);
  }

  /* ---- the field meter: the whole physics of the scenario in one bar ---- */
  if (overlays.meter) {
    const mx = 18, my = height * 0.34, mw = 22, mh = height * 0.4;
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, 0.7);
    roundRect(ctx, mx - 4, my - 4, mw + 8, mh + 8, 6);
    ctx.fill();
    ctx.restore();
    const field = pointField(state.cloudQ, cloudH);
    const frac = Math.min(1, field / BREAKDOWN_FIELD);
    ctx.save();
    ctx.fillStyle = theme.surfaceAlt;
    roundRect(ctx, mx, my, mw, mh, 4);
    ctx.fill();
    ctx.fillStyle = theme.sci["field"];
    roundRect(ctx, mx, my + mh * (1 - frac), mw, mh * frac, 4);
    ctx.fill();
    ctx.strokeStyle = theme.sci["force"];
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx - 6, my);
    ctx.lineTo(mx + mw + 6, my);
    ctx.stroke();
    ctx.restore();
    caption(ctx, mx + mw + 10, my, "3 MV/m: air gives way", theme, { size: 11, color: theme.sci["force"] });
    badge(ctx, mx + mw / 2, my + mh + 22, `${(frac * 100).toFixed(0)}%`, theme, {
      align: "center", color: theme.sci["field"],
    });
  }

  if (band !== "3-5") {
    badge(ctx, width * 0.5, cloudY + 62, `${state.cloudQ.toFixed(1)} C`, theme, {
      align: "center", color: cloudColor, sub: "on the cloud base",
    });
    caption(ctx, width - 14, groundY + 26, `${cloudH.toFixed(0)} m to the cloud`, theme, {
      align: "right", size: 12, color: theme.inkSoft,
    });
    caption(ctx, 14, height - 14, `strikes: ${state.strikes}`, theme, {
      size: 12, color: theme.inkSoft,
    });
  }
  vignette(ctx, width, height, 0.2);
}

function render(rc: RenderContext<State>) {
  if ((rc.params.scenario as string) === "storm") {
    renderStorm(rc);
    return;
  }
  renderBench(rc);
  vignette(rc.ctx, rc.width, rc.height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const electricForceSim: SimManifest<State> = {
  id: "phys.electric-force",
  title: "Electric Force",
  tagline: "Drag one charge along the rule and watch the push on both of them change.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5", "HS-PS2-4"], ccssMath: ["8.EE.A.1", "8.F.B.5"] },
  learningGoals: [
    "Predict whether two charges attract or repel from their signs alone.",
    "Show that the two forces in the pair are always equal in size and opposite in direction.",
    "Find from your own measurements that the force falls as 1 ÷ distance².",
    "Show that doubling one charge doubles the force.",
    "Explain lightning as charge building until the field is strong enough to break down air.",
  ],
  misconceptions: [
    "The bigger charge pushes harder than the smaller one",
    "The force needs something in between to travel through",
    "Doubling the distance halves the force",
    "Lightning comes from the sky only, not from a build-up of charge",
  ],
  interactionHint: "Drag the right-hand sphere along the metre rule.",
  params: {
    scenario: {
      type: "option", label: "Scene",
      options: [
        { value: "bench", label: "Two charges on a bench" },
        { value: "storm", label: "Thunderstorm" },
      ],
      default: "bench",
    },
    chargeA: {
      type: "number", label: "Charge A (µC)", kind: "count",
      min: -6, max: 6, step: 0.5, default: 2,
      help: "Microcoulombs — millionths of a coulomb. Negative means extra electrons.",
      marks: [{ value: -2, label: "−2" }, { value: 0, label: "0" }, { value: 2, label: "+2" }],
    },
    chargeB: {
      type: "number", label: "Charge B (µC)", kind: "count",
      min: -6, max: 6, step: 0.5, default: 2,
      help: "Same sign as A pushes them apart; opposite sign pulls them together.",
      marks: [{ value: -2, label: "−2" }, { value: 0, label: "0" }, { value: 2, label: "+2" }],
    },
    cloudHeight: {
      type: "number", label: "Cloud base height", kind: "length", unit: "m",
      min: 100, max: 900, step: 10, default: 300,
      bands: ["6-8", "9-12"],
      help: "Storm clouds usually sit a few hundred metres up.",
    },
    chargeRate: {
      type: "number", label: "Charging rate (C/s)", kind: "count",
      min: 1, max: 40, step: 1, default: 14,
      bands: ["6-8", "9-12"],
      help: "How fast the rising air separates charge inside the cloud.",
    },
  },
  overlays: [
    { key: "forces", label: "Force arrows", default: true },
    { key: "fieldLines", label: "Field lines", default: true, bands: ["6-8", "9-12"] },
    { key: "graph", label: "Force–distance curve", default: true, bands: ["6-8", "9-12"] },
    { key: "meter", label: "Field meter", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "distance-law",
      title: "Twice as far — how much force?",
      question: "What happens to the electric force when you double the distance?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS2-3"],
      setup: { scenario: "bench", chargeA: 2, chargeB: 2 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Do not drag anything yet. Decide first.",
          predict: {
            prompt: "You move the spheres from 20 cm apart to 40 cm apart. The force becomes...",
            options: ["the same", "half as big", "a quarter as big", "twice as big"],
            correct: 2,
            reveal: "A quarter. The force follows 1 ÷ distance², so doubling the distance divides the force by 2 × 2 = 4.",
          },
        },
        {
          id: "twenty",
          phase: "setup",
          title: "Start at 20 cm",
          instruction: "Drag sphere B until the rule reads 20 cm, then record.",
          check: {
            describe: "The spheres are 20 cm apart",
            test: (v) => Math.abs((v.facts.separation as number) - 0.2) < 0.011,
          },
          hints: ["The separation badge sits under the metre rule."],
        },
        {
          id: "collect",
          phase: "measure",
          title: "Five distances",
          instruction: "Record the force at 20, 30, 40, 60 and 80 cm.",
          requireData: 5,
          hints: [
            "Keep both charges the same the whole time — only the distance changes.",
            "Press Record data after each new distance.",
            "Compare the 20 cm row with the 40 cm row.",
          ],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Plot it straight",
          instruction: "Set the graph's horizontal axis to 1 ÷ (separation)² and plot the force.",
          write: {
            prompt: "What shape did force against 1 ÷ distance² make, and what does that shape tell you?",
            placeholder: "The points made a ... which means force is ... to 1 ÷ distance².",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Write a rule another student could use to predict the force.",
          write: {
            prompt: "Write the rule connecting force and distance, then use it to predict the force at 1 m.",
            placeholder: "When the distance is multiplied by n, the force is ... At 1 m I predict ...",
          },
        },
      ],
    },
    {
      id: "charge-size",
      title: "Does more charge mean more force?",
      question: "What happens to the force when one charge is doubled, and when both are?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS2-3"],
      setup: { scenario: "bench", chargeA: 1, chargeB: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Both spheres carry +1 µC. Answer before testing.",
          predict: {
            prompt: "You double charge B only, keeping the distance the same. The force becomes...",
            options: ["the same", "twice as big", "four times as big"],
            correct: 1,
            reveal: "Twice as big. The force depends on the product of the charges, so doubling one doubles the product.",
          },
        },
        {
          id: "sweep",
          phase: "measure",
          title: "Grow one charge",
          instruction: "Hold the distance at 40 cm. Record with B at 1, 2, 3 and 4 µC.",
          requireData: 4,
          hints: ["Do not move the spheres — this test is about charge alone."],
        },
        {
          id: "both",
          phase: "measure",
          title: "Now double both",
          instruction: "Set A and B to 2 µC and record. Compare with 1 µC and 1 µC.",
          requireData: 5,
          check: {
            describe: "Both charges are at least 2 µC",
            test: (v) => Math.abs(v.params.chargeA as number) >= 2 && Math.abs(v.params.chargeB as number) >= 2,
          },
        },
        {
          id: "pairs",
          phase: "analyze",
          title: "Check the pair",
          instruction: "Look at the two arrows. Is the force on the small charge the same size as on the big one?",
          write: {
            prompt: "Compare the two arrows when the charges are very different. What do you notice?",
            placeholder: "Even when one charge was much bigger, the two arrows were ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State it",
          instruction: "Write how the force depends on the two charges.",
          write: {
            prompt: "Write the rule connecting the force to the two charges, and why both arrows are equal.",
            placeholder: "The force depends on ... Both arrows are equal because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "hit-a-force",
      title: "Land on 0.10 newtons",
      brief: "Make the force on each sphere as close to 0.10 N as you can, from at least 40 cm apart.",
      bands: ["6-8", "9-12"],
      setup: { scenario: "bench", chargeA: 2, chargeB: 2 },
      goal: {
        describe: "Force within 0.01 N of 0.10 N, spheres at least 40 cm apart",
        test: (v) =>
          Math.abs((v.facts.force as number) - 0.1) <= 0.01 && (v.facts.separation as number) >= 0.4,
      },
      stars: {
        two: {
          describe: "Within 0.004 N",
          test: (v) =>
            Math.abs((v.facts.force as number) - 0.1) <= 0.004 && (v.facts.separation as number) >= 0.4,
        },
        three: {
          describe: "Within 0.002 N, and at least 60 cm apart",
          test: (v) =>
            Math.abs((v.facts.force as number) - 0.1) <= 0.002 && (v.facts.separation as number) >= 0.6,
        },
      },
      hints: [
        "Force = 9 × 10⁹ × charge A × charge B ÷ distance².",
        "At 40 cm you need the charges to multiply to about 1.8 × 10⁻¹² C².",
        "Move further out and you will need bigger charges to keep the same force.",
      ],
    },
    {
      id: "storm-watch",
      title: "Three strikes from high up",
      brief: "Run a storm with the cloud at least 500 m up and get three strikes.",
      bands: ["6-8", "9-12"],
      setup: { scenario: "storm", cloudHeight: 500, chargeRate: 20 },
      goal: {
        describe: "3 strikes with the cloud base at 500 m or higher",
        test: (v) => (v.facts.strikes as number) >= 3 && (v.params.cloudHeight as number) >= 500,
      },
      stars: {
        two: {
          describe: "5 strikes from 500 m",
          test: (v) => (v.facts.strikes as number) >= 5 && (v.params.cloudHeight as number) >= 500,
        },
        three: {
          describe: "5 strikes from 700 m or higher",
          test: (v) => (v.facts.strikes as number) >= 5 && (v.params.cloudHeight as number) >= 700,
        },
      },
      hints: [
        "A higher cloud is further away, so its field at the ground is weaker.",
        "Weaker field means more charge has to pile up first — turn the charging rate up.",
      ],
    },
  ],
};
