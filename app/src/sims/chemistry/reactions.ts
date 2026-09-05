import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { CONSTANTS, q } from "@engine/units";
import { camera, roundRect } from "@ui/draw";
import {
  badge, caption, contactShadow, groundPlane, hexA, isDarkTheme, lifted, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Reaction Rates & Collisions — Grades 7-12.
 *
 * Hydrogen and iodine molecules bounce around a box:  H₂ + I₂ → 2 HI.
 * A collision only becomes a reaction if two things are true at once — the
 * molecules hit hard enough to clear the activation barrier, and they hit
 * pointing the right way round.
 *
 * Nothing here is a rate equation. Every molecule carries a real velocity drawn
 * from a Maxwell-Boltzmann distribution at the temperature you set, and each
 * collision is tested against the barrier individually. The famous Arrhenius
 * factor e^(−Ea/RT) is never computed to decide anything — it *emerges*,
 * because that is exactly the fraction of collisions whose energy along the
 * line of centres exceeds Ea. Turn the temperature up and the reaction speeds
 * up because more collisions clear the barrier, which is the whole point.
 *
 * Confronts the belief that a catalyst "gives energy" to the reaction, and that
 * heating works by making molecules "want" to react.
 */

/* ------------------------------------------------------------------ *
 * Model constants
 * ------------------------------------------------------------------ */

/** Gas constant in kJ/(mol·K) — every energy in this file is kJ per mole. */
const R_KJ = CONSTANTS.R / 1000;

/**
 * Velocities are stored so that ½v² is the molecule's kinetic energy in kJ/mol.
 * Positions advance at MOTION times that, purely so the animation runs at a
 * watchable speed; every energy test uses the unscaled velocity, so the
 * physics is untouched.
 */
const MOTION = 6;

/** Base box, in model length units, at container size 1. */
const BASE_W = 22;
const BASE_H = 15;
/** The largest box the stage has to fit, used to fix the drawing scale. */
const MAX_SIZE = 2;

const R_A = 0.34;   // H₂
const R_B = 0.46;   // I₂
const R_C = 0.40;   // HI

/** A collision only reacts if it lands within this angle of H₂'s reactive end. */
const STERIC_HALF_ANGLE = Math.PI / 3;   // ±60°, so about one collision in three

/** Enthalpy change of H₂ + I₂ → 2 HI, kJ per mole of reaction (exothermic). */
const DELTA_H = -53;

/** A catalyst offers a different route with a lower barrier. */
const CATALYST_FACTOR = 0.55;

const KIND_A = 1;
const KIND_B = 2;
const KIND_C = 3;

interface State {
  n: number;
  x: number[]; y: number[];
  vx: number[]; vy: number[];
  /** Orientation of the reactive end, and how fast the molecule tumbles. */
  th: number[]; w: number[];
  kind: number[];
  boxW: number; boxH: number;
  countA: number; countB: number; countC: number;
  maxProduct: number;
  /** Smoothed product molecules per second. */
  rate: number;
  /** Measured temperature, K, from ⟨½mv²⟩ = k_B T in two dimensions. */
  tKin: number;
  collisions: number;
  successful: number;
  elapsed: number;
  maxSetTemp: number;
}

function activationEnergy(params: ParamValues): number {
  // Stored in J/mol so the shell can show it in kJ; the model works in kJ/mol.
  const ea = (params.activationEnergy as number) / 1000;
  return (params.catalyst as boolean) ? ea * CATALYST_FACTOR : ea;
}

function boxFor(params: ParamValues): { w: number; h: number } {
  const s = Math.sqrt(params.containerSize as number);
  return { w: BASE_W * s, h: BASE_H * s };
}

function seed(params: ParamValues, rng: Rng): State {
  const n = Math.round(params.particles as number);
  const { w, h } = boxFor(params);
  const t = params.temperature as number;

  const x: number[] = new Array(n);
  const y: number[] = new Array(n);
  const vx: number[] = new Array(n);
  const vy: number[] = new Array(n);
  const th: number[] = new Array(n);
  const wRot: number[] = new Array(n);
  const kind: number[] = new Array(n);

  // Equal amounts of the two reactants, laid out on a loose grid so nothing
  // starts overlapping.
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * (w / h))));
  const rows = Math.ceil(n / cols);
  let countA = 0, countB = 0;

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i - r * cols;
    x[i] = ((c + 0.5) / cols) * (w - 1.6) + 0.8;
    y[i] = ((r + 0.5) / rows) * (h - 1.6) + 0.8;
    // Maxwell-Boltzmann in two dimensions: each velocity component is normal
    // with variance RT, which makes the speed Rayleigh-distributed.
    const sigma = Math.sqrt(R_KJ * t);
    vx[i] = rng.normal(0, sigma);
    vy[i] = rng.normal(0, sigma);
    th[i] = rng.range(0, Math.PI * 2);
    wRot[i] = rng.range(-3, 3);
    if (i % 2 === 0) { kind[i] = KIND_A; countA++; } else { kind[i] = KIND_B; countB++; }
  }

  return {
    n, x, y, vx, vy, th, w: wRot, kind,
    boxW: w, boxH: h,
    countA, countB, countC: 0,
    maxProduct: 2 * Math.min(countA, countB),
    rate: 0, tKin: t, collisions: 0, successful: 0,
    elapsed: 0, maxSetTemp: t,
  };
}

function radiusOf(kind: number): number {
  return kind === KIND_A ? R_A : kind === KIND_B ? R_B : R_C;
}

/** Signed angle difference wrapped into (−π, π]. */
function wrapAngle(a: number): number {
  let d = a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

const model: SimModel<State> = {
  init(params, ctx) {
    return seed(params, ctx.rng);
  },

  applyParams(state, params, prev, ctx) {
    if (params.particles !== prev.particles) return seed(params, ctx.rng);
    if (params.containerSize !== prev.containerSize) {
      // Squeeze or stretch the box and everything inside it: the molecules are
      // unchanged, there is simply more or less room, so collisions get more or
      // less frequent. That is what "concentration" means here.
      const { w, h } = boxFor(params);
      const fx = w / state.boxW;
      const fy = h / state.boxH;
      const x = state.x.slice();
      const y = state.y.slice();
      for (let i = 0; i < state.n; i++) { x[i] *= fx; y[i] *= fy; }
      return { ...state, x, y, boxW: w, boxH: h };
    }
    return state;
  },

  step(state, dt, params) {
    const n = state.n;
    if (n === 0 || dt <= 0) return state;

    const tTarget = params.temperature as number;
    const ea = activationEnergy(params);
    const boxW = state.boxW;
    const boxH = state.boxH;

    const x = state.x.slice();
    const y = state.y.slice();
    const vx = state.vx.slice();
    const vy = state.vy.slice();
    const th = state.th.slice();
    const kind = state.kind.slice();

    /* ---- thermostat: the box sits in a bath at the chosen temperature ---- */
    let sumV2 = 0;
    for (let i = 0; i < n; i++) sumV2 += vx[i] * vx[i] + vy[i] * vy[i];
    const tNow = sumV2 / (2 * n) / R_KJ;
    const ratio = tNow > 1e-9 ? tTarget / tNow : 4;
    const lambda = Math.max(0.9, Math.min(1.12, Math.sqrt(Math.max(0, 1 + (dt / 0.6) * (ratio - 1)))));
    for (let i = 0; i < n; i++) { vx[i] *= lambda; vy[i] *= lambda; }

    /* ---- move, tumble, bounce off the walls ---- */
    const h = dt * MOTION;
    for (let i = 0; i < n; i++) {
      const r = radiusOf(kind[i]);
      x[i] += vx[i] * h;
      y[i] += vy[i] * h;
      th[i] += state.w[i] * dt;
      if (x[i] < r) { x[i] = r; vx[i] = Math.abs(vx[i]); }
      else if (x[i] > boxW - r) { x[i] = boxW - r; vx[i] = -Math.abs(vx[i]); }
      if (y[i] < r) { y[i] = r; vy[i] = Math.abs(vy[i]); }
      else if (y[i] > boxH - r) { y[i] = boxH - r; vy[i] = -Math.abs(vy[i]); }
    }

    /* ---- collisions ---- */
    let collisions = state.collisions;
    let successful = state.successful;
    let countA = state.countA, countB = state.countB, countC = state.countC;

    for (let i = 0; i < n - 1; i++) {
      const ri = radiusOf(kind[i]);
      for (let j = i + 1; j < n; j++) {
        const contact = ri + radiusOf(kind[j]);
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const d2 = dx * dx + dy * dy;
        if (d2 >= contact * contact || d2 < 1e-12) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const vn = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
        if (vn > 0) continue;   // already separating
        collisions++;

        // Energy along the line of centres, ½μv², with μ = m/2 for equal masses.
        const eColl = 0.25 * vn * vn;
        const isPair =
          (kind[i] === KIND_A && kind[j] === KIND_B) || (kind[i] === KIND_B && kind[j] === KIND_A);

        if (isPair && eColl >= ea) {
          // Orientation test: the hydrogen molecule has to be presenting its
          // reactive end to the iodine, not its side.
          const hIdx = kind[i] === KIND_A ? i : j;
          const approach = hIdx === i ? Math.atan2(ny, nx) : Math.atan2(-ny, -nx);
          if (Math.abs(wrapAngle(approach - th[hIdx])) <= STERIC_HALF_ANGLE) {
            kind[i] = KIND_C;
            kind[j] = KIND_C;
            countA--; countB--; countC += 2;
            successful++;
          }
        }

        // Elastic bounce: equal masses simply swap their normal components.
        vx[i] += vn * nx; vy[i] += vn * ny;
        vx[j] -= vn * nx; vy[j] -= vn * ny;
        const push = (contact - d) * 0.5;
        x[i] -= nx * push; y[i] -= ny * push;
        x[j] += nx * push; y[j] += ny * push;
      }
    }

    /* ---- measurements ---- */
    let v2 = 0;
    for (let i = 0; i < n; i++) v2 += vx[i] * vx[i] + vy[i] * vy[i];
    const tKin = v2 / (2 * n) / R_KJ;

    const made = countC - state.countC;
    const blend = 1 - Math.exp(-dt / 0.8);
    const rate = state.rate + (made / dt - state.rate) * blend;

    return {
      ...state,
      x, y, vx, vy, th, kind,
      countA, countB, countC,
      collisions, successful,
      rate, tKin,
      elapsed: state.elapsed + dt,
      maxSetTemp: Math.max(state.maxSetTemp, tTarget),
    };
  },

  readouts(state, params) {
    const ea = activationEnergy(params);
    const t = params.temperature as number;
    const area = state.boxW * state.boxH;
    return [
      {
        key: "reactantA", label: "H₂ left", quantity: q(state.countA, "count"),
        semantic: "energy-potential", graphable: true,
      },
      {
        key: "reactantB", label: "I₂ left", quantity: q(state.countB, "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "product", label: "HI made", quantity: q(state.countC, "count"),
        semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "rate", label: "Reaction rate (HI per second)", quantity: q(state.rate, "count"),
        semantic: "acceleration", graphable: true,
      },
      {
        key: "percent", label: "Reaction complete",
        quantity: q(state.maxProduct > 0 ? state.countC / state.maxProduct : 0, "percent"),
        unit: "%", semantic: "energy-kinetic", graphable: true,
      },
      {
        key: "temperature", label: "Temperature", quantity: q(state.tKin, "temperature"),
        unit: "K", semantic: "hot", graphable: true,
      },
      {
        key: "concentration", label: "Molecules per unit area", quantity: q(state.n / area, "ratio"),
        semantic: "mass", graphable: true, bands: ["9-12"],
      },
      {
        key: "fraction", label: "Collisions with enough energy",
        quantity: q(Math.exp(-ea / (R_KJ * t)), "percent"), unit: "%",
        semantic: "energy-thermal", graphable: true, bands: ["9-12"],
      },
      {
        key: "ea", label: "Activation energy in use", quantity: q(ea * 1000, "energy"),
        unit: "kJ", semantic: "energy-potential", graphable: false, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    return {
      percentComplete: state.maxProduct > 0 ? state.countC / state.maxProduct : 0,
      product: state.countC,
      rate: state.rate,
      elapsed: state.elapsed,
      maxTemperature: state.maxSetTemp,
      catalyst: params.catalyst as boolean,
      collisions: state.collisions,
      successful: state.successful,
      successRate: state.collisions > 0 ? state.successful / state.collisions : 0,
      activationEnergy: activationEnergy(params) * 1000,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * Colour carries meaning, not identity: the reactants are drawn in the stored
 * chemical energy colour and the product in the released-energy colour, which
 * is the same pairing used by the barrier diagram beside them. The two
 * reactants are told apart by size and shape, which also works for students who
 * cannot separate the hues.
 */
const WORLD_W = 35;
const WORLD_H = 18;

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
 * A molecule as two bonded atoms with volume: a stick between two lit spheres.
 * `heat` (0..1) adds a halo, so the fast molecules — the ones that actually
 * clear the barrier — are the ones that look energetic.
 */
function drawMolecule(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, kind: number, angle: number,
  scale: number, theme: RenderContext<State>["theme"], heat = 0,
) {
  const dx = Math.cos(angle);
  const dy = -Math.sin(angle);
  const spec = kind === KIND_A
    ? { r1: 0.21, r2: 0.21, sep: 0.17, c: theme.sci["energy-potential"] }
    : kind === KIND_B
      ? { r1: 0.31, r2: 0.31, sep: 0.25, c: theme.sci["mass"] }
      : { r1: 0.3, r2: 0.19, sep: 0.23, c: theme.sci["energy-kinetic"] };

  const ax = cx - dx * spec.sep * scale, ay = cy - dy * spec.sep * scale;
  const bx = cx + dx * spec.sep * scale, by = cy + dy * spec.sep * scale;

  ctx.save();
  ctx.strokeStyle = hexA(spec.c, 0.85);
  ctx.lineWidth = Math.max(1.5, spec.r2 * scale * 0.9);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();

  const glow = heat > 0.6 ? (heat - 0.6) * 1.6 : 0;
  sphere(ctx, ax, ay, spec.r1 * scale, spec.c, { glow });
  sphere(ctx, bx, by, spec.r2 * scale, spec.c, { glow });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const cam = camera({ x0: -0.4, y0: -0.8, x1: WORLD_W + 0.4, y1: WORLD_H + 0.5, width, height });
  const px = (x: number) => cam.toScreenX(x);
  const py = (y: number) => cam.toScreenY(y);
  const scale = cam.scale;
  const dark = isDarkTheme(theme);

  const ea = activationEnergy(params);
  const eaBare = (params.activationEnergy as number) / 1000;
  const t = params.temperature as number;
  const rt = R_KJ * t;
  const glass = theme.sci["solid"];

  /* ---- the bench the vessel is clamped to ---- */
  sky(ctx, width, height, theme, "indoor");
  const benchY = py(0.05);
  groundPlane(ctx, benchY, 0, px(22.2), height, theme, "lab");

  /* ---- the reaction vessel ---- */
  // The drawing scale is pinned to the largest possible container, so shrinking
  // the box really does crowd the molecules together on screen.
  const maxW = BASE_W * Math.sqrt(MAX_SIZE);
  const region = { x: 0.4, y: 1.0, w: 21.2, h: 16.4 };
  const inner = Math.min(region.w / maxW, region.h / (BASE_H * Math.sqrt(MAX_SIZE)));
  const bw = state.boxW * inner;
  const bh = state.boxH * inner;
  const bx = region.x + (region.w - bw) / 2;
  const by = region.y + (region.h - bh) / 2;

  const vl = px(bx), vr = px(bx + bw), vt = py(by + bh), vb = py(by);
  const wall = Math.max(3, scale * 0.18);

  contactShadow(ctx, (vl + vr) / 2, benchY + 1, (vr - vl) * 0.32, 0);

  // The gas inside, tinted by how hot the bath is holding it.
  const heatFrac = Math.min(1, Math.max(0, (t - 300) / 700));
  const gasTint = blend(theme.sci["cold"], theme.sci["hot"], heatFrac);
  ctx.save();
  const fill = ctx.createLinearGradient(0, vt, 0, vb);
  fill.addColorStop(0, hexA(gasTint, dark ? 0.1 : 0.06));
  fill.addColorStop(1, hexA(gasTint, dark ? 0.24 : 0.16));
  ctx.fillStyle = fill;
  roundRect(ctx, vl, vt, vr - vl, vb - vt, 6);
  ctx.fill();
  ctx.restore();

  const mScale = inner * scale;
  const vRef = 2.4 * Math.sqrt(R_KJ * t);
  for (let i = 0; i < state.n; i++) {
    const speed = Math.hypot(state.vx[i], state.vy[i]);
    drawMolecule(
      ctx,
      px(bx + state.x[i] * inner),
      py(by + state.y[i] * inner),
      state.kind[i], state.th[i], mScale, theme,
      Math.min(1, speed / vRef),
    );
  }

  // The glass, over the contents, so the molecules read as being inside it.
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, vl, vt, vr - vl, vb - vt, 6);
  ctx.strokeStyle = hexA(glass, 0.45);
  ctx.lineWidth = wall;
  ctx.stroke();
  ctx.strokeStyle = hexA(glass, 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const sheen = ctx.createLinearGradient(vl, vt, vl + (vr - vl) * 0.35, vb);
  sheen.addColorStop(0, "rgba(255,255,255,0.15)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.moveTo(vl + wall, vt + wall);
  ctx.lineTo(vl + (vr - vl) * 0.22, vt + wall);
  ctx.lineTo(vl + wall, vb - wall);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  caption(ctx, px(region.x), py(region.y + region.h + 0.55), "H₂ + I₂ → 2 HI", theme, {
    size: band === "3-5" ? 17 : 16,
  });
  const pct = state.maxProduct > 0 ? (state.countC / state.maxProduct) * 100 : 0;
  badge(ctx, px(region.x + region.w), py(region.y + region.h + 0.55), `${pct.toFixed(0)}%`, theme, {
    align: "right", color: theme.sci["energy-kinetic"], sub: "complete",
  });

  /* ---- legend ---- */
  const legendY = 0.42;
  const items: [number, string][] = [[KIND_A, "H₂"], [KIND_B, "I₂"], [KIND_C, "HI"]];
  for (let k = 0; k < items.length; k++) {
    const lx = region.x + 0.8 + k * 3.4;
    drawMolecule(ctx, px(lx), py(legendY), items[k][0], 0, mScale, theme);
    caption(ctx, px(lx + 0.75), py(legendY), items[k][1], theme, { size: 12, color: theme.inkSoft });
  }
  badge(ctx, px(region.x + region.w), py(legendY), `${t.toFixed(0)} K`, theme, {
    align: "right", color: gasTint,
  });

  /* ---- activation-energy diagram ---- */
  const gx = 22.6, gw = WORLD_W - gx - 0.4;
  const gy = 9.6, gh = 7.4;
  const eTop = 38, eBottom = -70;
  const eToY = (e: number) => gy + ((e - eBottom) / (eTop - eBottom)) * gh;

  const panel = (x0: number, y0: number, w0: number, h0: number) => {
    ctx.save();
    ctx.fillStyle = hexA(theme.surface, dark ? 0.44 : 0.66);
    roundRect(ctx, px(x0), py(y0 + h0), w0 * scale, h0 * scale, 7);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.line, 0.9);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };
  panel(gx, gy, gw, gh);

  const path = (barrier: number, colour: string, dashed: boolean) => {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = dashed ? 2 : 3;
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    const STEPS = 60;
    for (let i = 0; i <= STEPS; i++) {
      const xi = i / STEPS;
      let e: number;
      if (xi <= 0.5) e = (barrier * (1 - Math.cos((Math.PI * xi) / 0.5))) / 2;
      else e = DELTA_H + ((barrier - DELTA_H) * (1 + Math.cos((Math.PI * (xi - 0.5)) / 0.5))) / 2;
      const sx = px(gx + 0.4 + xi * (gw - 0.8));
      const sy = py(eToY(e));
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  };

  // The uncatalysed route is always shown, so the catalyst's shortcut is visible.
  if (params.catalyst) path(eaBare, theme.inkSoft, true);
  lifted(ctx, 8, 2, () => path(ea, theme.sci["energy-potential"], false), 0.3);

  ctx.save();
  ctx.strokeStyle = theme.sci["energy-thermal"];
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px(gx + 0.3), py(eToY(ea)));
  ctx.lineTo(px(gx + gw - 0.3), py(eToY(ea)));
  ctx.stroke();
  ctx.restore();
  caption(ctx, px(gx + 0.5), py(eToY(ea) + 0.55), `Ea ${ea.toFixed(0)} kJ/mol`, theme, {
    size: 11, color: theme.sci["energy-thermal"],
  });
  if (band === "9-12") {
    caption(ctx, px(gx + gw - 0.4), py(eToY(DELTA_H) + 0.6), `ΔH ${DELTA_H} kJ/mol`, theme, {
      align: "right", size: 10, color: theme.sci["energy-kinetic"],
    });
  }
  caption(ctx, px(gx), py(gy + gh + 0.55), "Energy along the reaction", theme, { size: 12 });

  /* ---- how many collisions carry enough energy ---- */
  if (overlays.distribution && band === "9-12") {
    const dy0 = 1.2, dh = 6.6;
    const eMax = 45;
    panel(gx, dy0, gw, dh);

    const dxAt = (e: number) => gx + 0.3 + (e / eMax) * (gw - 0.6);
    const peak = 1 / rt;
    const dyAt = (f: number) => dy0 + 0.3 + (f / peak) * (dh - 0.9);

    // Shade the tail beyond the barrier: those are the collisions that react.
    ctx.save();
    const tail = ctx.createLinearGradient(0, py(dy0 + dh), 0, py(dy0));
    tail.addColorStop(0, hexA(theme.sci["energy-thermal"], 0.55));
    tail.addColorStop(1, hexA(theme.sci["energy-thermal"], 0.12));
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(px(dxAt(ea)), py(dy0 + 0.3));
    for (let e = ea; e <= eMax; e += eMax / 90) {
      ctx.lineTo(px(dxAt(e)), py(dyAt(Math.exp(-e / rt) / rt)));
    }
    ctx.lineTo(px(dxAt(eMax)), py(dy0 + 0.3));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = theme.sci["hot"];
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const e = (i / 90) * eMax;
      const sx = px(dxAt(e));
      const sy = py(dyAt(Math.exp(-e / rt) / rt));
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = theme.sci["energy-potential"];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(dxAt(ea)), py(dy0 + 0.3));
    ctx.lineTo(px(dxAt(ea)), py(dy0 + dh - 0.3));
    ctx.stroke();
    ctx.restore();

    caption(
      ctx, px(gx + gw - 0.3), py(dy0 + dh - 0.6),
      `${(Math.exp(-ea / rt) * 100).toFixed(1)}% of collisions clear Ea`, theme,
      { align: "right", size: 11, color: theme.sci["energy-thermal"] },
    );
    caption(ctx, px(gx), py(dy0 + dh + 0.55), "Collision energies at this temperature", theme, { size: 12 });
  }

  vignette(ctx, width, height, 0.14);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const reactionsSim: SimManifest<State> = {
  id: "chem.reactions",
  title: "Reaction Rates & Collisions",
  tagline: "Make hydrogen and iodine react — then find out which of the four dials actually makes it go faster.",
  subject: "chemistry",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS1-2", "HS-PS1-5", "HS-PS1-6"] },
  learningGoals: [
    "Explain that a reaction needs collisions that are both hard enough and aimed right.",
    "Predict how temperature, concentration and a catalyst change the reaction rate.",
    "Read an energy profile: reactants, activation energy, activated complex, products.",
    "Explain that a catalyst lowers the barrier rather than supplying energy.",
    "Relate the fraction of successful collisions to e^(−Ea/RT).",
  ],
  misconceptions: [
    "A catalyst gives the reaction extra energy",
    "A catalyst is used up in the reaction",
    "Every collision between reactants produces a product",
    "Heating makes molecules more likely to want to react",
  ],
  tickRate: 60,
  interactionHint: "Press play, then change one dial at a time and watch the rate.",
  params: {
    temperature: {
      type: "number", label: "Temperature", kind: "temperature", unit: "K",
      min: 250, max: 900, step: 5, default: 500,
      help: "Sets the spread of molecular speeds. Hotter means a bigger share of collisions clear the barrier.",
    },
    particles: {
      type: "number", label: "Number of molecules", kind: "count",
      min: 20, max: 140, step: 2, default: 80,
      help: "Half start as H₂ and half as I₂.",
    },
    containerSize: {
      type: "number", label: "Container size", kind: "ratio",
      min: 0.5, max: 2, step: 0.05, default: 1,
      help: "A smaller container packs the same molecules closer together — higher concentration.",
    },
    catalyst: {
      type: "boolean", label: "Catalyst", default: false,
      help: "Opens a different route to the same products, over a lower barrier. It is not used up.",
    },
    activationEnergy: {
      type: "number", label: "Activation energy (per mole)", kind: "energy", unit: "kJ",
      min: 5000, max: 30000, step: 1000, default: 12000,
      bands: ["9-12"],
      help: "Real reactions have barriers of 50-200 kJ/mol. This one is smaller so the reaction runs in seconds instead of centuries.",
    },
  },
  overlays: [
    { key: "distribution", label: "Collision energy spread", default: true, bands: ["9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "what-speeds-up",
      title: "What speeds up a reaction?",
      question: "Which of these actually makes the reaction go faster — and which just looks like it does?",
      bands: ["6-8", "9-12"],
      minutes: 30,
      standards: ["MS-PS1-2", "HS-PS1-5"],
      setup: {
        temperature: 400, particles: 80, containerSize: 1, catalyst: false, activationEnergy: 12000,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you test anything.",
          predict: {
            prompt: "Which change will speed the reaction up the most?",
            options: [
              "Doubling the temperature",
              "Halving the container size",
              "Turning the catalyst on",
              "They all do exactly the same thing",
            ],
            correct: 0,
            reveal: "Temperature wins, because it changes the *fraction* of collisions that clear the barrier — and that fraction is exponential. Concentration and a catalyst help too, just not as steeply.",
          },
        },
        {
          id: "baseline",
          phase: "measure",
          title: "Get a baseline",
          instruction: "Run it at 400 K with the catalyst off. Record the rate.",
          requireData: 1,
          check: {
            describe: "400 K, no catalyst",
            test: (v) => (v.params.temperature as number) === 400 && v.params.catalyst === false,
          },
        },
        {
          id: "temperature",
          phase: "measure",
          title: "Change only the temperature",
          instruction: "Reset, raise the temperature to 800 K, change nothing else, and record.",
          requireData: 3,
          check: {
            describe: "Temperature at or above 800 K",
            test: (v) => (v.params.temperature as number) >= 800,
          },
          hints: [
            "Press Reset first so you are counting from zero again.",
            "A fair test changes one thing at a time.",
          ],
        },
        {
          id: "concentration",
          phase: "measure",
          title: "Now only the concentration",
          instruction: "Reset, go back to 400 K, shrink the container to 0.5, and record.",
          requireData: 5,
          check: {
            describe: "Back at 400 K in a small container",
            test: (v) =>
              (v.params.temperature as number) === 400 && (v.params.containerSize as number) <= 0.6,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Rank them",
          instruction: "Put your three rates in order and say why the winner wins.",
          write: {
            prompt: "Rank temperature and concentration by how much they sped the reaction up. Why is one so much stronger?",
            placeholder: "Concentration changes how OFTEN molecules meet. Temperature changes ...",
          },
        },
      ],
    },
    {
      id: "catalyst",
      title: "How does a catalyst work?",
      question: "A catalyst makes reactions faster — but where does the extra speed come from?",
      bands: ["9-12"],
      minutes: 25,
      standards: ["HS-PS1-5"],
      setup: {
        temperature: 400, particles: 80, containerSize: 1, catalyst: false, activationEnergy: 20000,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before switching the catalyst on.",
          predict: {
            prompt: "What does a catalyst do?",
            options: [
              "Gives the molecules extra energy",
              "Raises the temperature of the mixture",
              "Opens a route with a lower activation energy",
              "Is used up making more product",
            ],
            correct: 2,
            reveal: "A catalyst never adds energy. It offers a different path over a lower barrier, so a much bigger share of the same collisions is now hard enough. Watch the temperature readout — it does not move.",
          },
        },
        {
          id: "slow",
          phase: "measure",
          title: "Watch the slow version",
          instruction: "With Ea at 20 kJ/mol and no catalyst, record the rate and the temperature.",
          requireData: 2,
          check: { describe: "Catalyst is off", test: (v) => v.params.catalyst === false },
        },
        {
          id: "fast",
          phase: "measure",
          title: "Switch the catalyst on",
          instruction: "Reset, turn the catalyst on, change nothing else, and record again.",
          requireData: 4,
          check: { describe: "Catalyst is on", test: (v) => v.params.catalyst === true },
          hints: ["Keep an eye on the Temperature readout while you do it."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Check the temperature",
          instruction: "Compare the temperature with and without the catalyst.",
          write: {
            prompt: "Did the catalyst change the temperature? So where did the extra speed come from?",
            placeholder: "The temperature stayed at ... so the catalyst must have ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it with the diagram",
          instruction: "Use the energy profile to explain what the catalyst changed.",
          write: {
            prompt: "Draw or describe the two routes on the energy diagram. Which parts moved, and which stayed put?",
            placeholder: "The reactants and products stayed at ... but the peak ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "cold-and-fast",
      title: "Fast without the heat",
      brief: "Finish the reaction in under 45 seconds without ever going above 550 K.",
      bands: ["6-8", "9-12"],
      setup: {
        temperature: 500, particles: 80, containerSize: 1, catalyst: false, activationEnergy: 12000,
      },
      goal: {
        describe: "90% complete within 45 s, never above 550 K",
        test: (v) =>
          (v.facts.percentComplete as number) >= 0.9 &&
          (v.facts.elapsed as number) <= 45 &&
          (v.facts.maxTemperature as number) <= 550,
      },
      stars: {
        two: {
          describe: "Fully complete within 45 s under 550 K",
          test: (v) =>
            (v.facts.percentComplete as number) >= 0.99 &&
            (v.facts.elapsed as number) <= 45 &&
            (v.facts.maxTemperature as number) <= 550,
        },
        three: {
          describe: "Fully complete within 25 s under 550 K",
          test: (v) =>
            (v.facts.percentComplete as number) >= 0.99 &&
            (v.facts.elapsed as number) <= 25 &&
            (v.facts.maxTemperature as number) <= 550,
        },
      },
      hints: [
        "Heat is off the table, so you have two dials left.",
        "The catalyst lowers the barrier without touching the temperature.",
        "Crowding the molecules into a smaller container makes them meet more often.",
      ],
    },
    {
      id: "slow-it-down",
      title: "Stall it",
      brief: "Keep the reaction under 10% complete for a full minute, without turning the temperature below 350 K.",
      bands: ["9-12"],
      setup: {
        temperature: 500, particles: 80, containerSize: 1, catalyst: false, activationEnergy: 12000,
      },
      goal: {
        describe: "After 60 s, still under 10% complete and never below 350 K",
        test: (v) =>
          (v.facts.elapsed as number) >= 60 &&
          (v.facts.percentComplete as number) < 0.1 &&
          (v.params.temperature as number) >= 350,
      },
      hints: [
        "A bigger container means the same molecules meet far less often.",
        "A higher barrier cuts the successful fraction exponentially.",
      ],
    },
  ],
};
