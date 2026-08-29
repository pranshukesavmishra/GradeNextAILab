import type { RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, bevelRect, caption, clamp01, glass, glow, gradientFill,
  hexA, innerGlow, isDarkTheme, labelLeader, material, metal, noiseWash, particleField,
  pulse, rimLight, sky, softShadow, sphere, spriteShadowEllipse, vignette,
} from "@ui/scene";

/**
 * Grade 6 · Unit C · Topic C2 — Particles, temperature and thermal energy.
 *
 * Five simulations, one topic. Matter is grainy, the grains never stop moving,
 * how they move is what "solid, liquid, gas" actually means, temperature is
 * the average energy of that motion — and the average says nothing at all
 * about how much energy is there in total.
 *
 *   C2.1  Matter is made of particles          → Down to the Grain
 *   C2.2  Evidence for particle motion         → The Jiggle Bench
 *   C2.3  Particle movement in the three states→ Inside Solid, Liquid, Gas
 *   C2.4  Temperature as average kinetic energy→ Two Boxes, One Question
 *   C2.5  Temperature vs total thermal energy  → Mug, Bath and Thermometer
 *   C2.6  Measuring temperature                → Mug, Bath and Thermometer
 *
 * Every number a student can read off these stages is one they could check in
 * a data book: water molecules 0.28 nm across and 3.34 x 10^28 per cubic
 * metre, air molecules eleven diameters apart, nitrogen averaging 476 m/s at
 * 300 K, helium 2.65 times faster at the same temperature, the latent heat of
 * fusion of ice at 334 kJ/kg, water's specific heat capacity at 4182 J/kg/K.
 */

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

const SUP_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** Superscript rendering of an exponent, so 10^22 reads as a real power. */
function sup(n: number): string {
  const neg = n < 0;
  let out = "";
  for (const ch of String(Math.abs(Math.round(n)))) out += SUP_DIGITS[Number(ch)];
  return (neg ? "⁻" : "") + out;
}

/** Fixed-decimal formatting. Nothing on a stage is ever a raw float. */
function fx(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(dp);
}

/** Thousands separators, for counts a student is meant to feel the size of. */
function fmtInt(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Scientific notation once a number stops fitting in a head. */
function sciText(v: number, dp = 1): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -1 && e <= 4) return fmtInt(v);
  const m = v / Math.pow(10, e);
  return `${m.toFixed(dp)} × 10${sup(e)}`;
}

/** A length in the unit a scientist would actually say out loud. */
function fmtLength(m: number): string {
  const a = Math.abs(m);
  if (!Number.isFinite(m)) return "—";
  if (a >= 0.01) return `${fx(m * 100, a >= 1 ? 0 : 1)} cm`;
  if (a >= 1e-3) return `${fx(m * 1e3, 1)} mm`;
  if (a >= 1e-6) return `${fx(m * 1e6, a >= 1e-5 ? 0 : 1)} µm`;
  return `${fx(m * 1e9, a >= 1e-8 ? 1 : 2)} nm`;
}

/** Energy, stepped up through kJ and MJ so the digits stay readable. */

const KELVIN = 273.15;


/** A temperature on whichever scale the student has the instrument set to. */

/** A translucent card for on-stage instruments, panels and legends. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  theme: ThemeColors, accent: string, alpha = 0.9,
) {
  const dark = isDarkTheme(theme);
  softShadow(ctx, () => {
    ctx.fillStyle = hexA(dark ? "#0d131c" : "#ffffff", alpha);
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
  }, { blur: 14, dy: 5, alpha: dark ? 0.45 : 0.16 });
  ctx.save();
  ctx.strokeStyle = hexA(accent, 0.32);
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8.5);
  ctx.stroke();
  ctx.restore();
}

/** The cold-to-hot ramp every one of these five stages colours motion with. */

/** A round number near a target, for scale bars and axis ticks. */
function niceStep(target: number): number {
  const e = Math.floor(Math.log10(target));
  const base = Math.pow(10, e);
  const m = target / base;
  const pick = m >= 5 ? 5 : m >= 2 ? 2 : 1;
  return pick * base;
}

/* ================================================================== *
 * C2.1 — Down to the Grain
 *
 * A powers-of-ten magnifier. One dial takes the view from a centimetre of
 * ordinary matter down to a tenth of a nanometre, and somewhere on the way the
 * smooth stuff falls apart into grains that are always there and never still.
 *
 * The scale ladder down the left carries the two numbers that make the whole
 * argument land: the human eye stops resolving detail at about 0.1 mm, and the
 * best school light microscope stops at about 200 nm — a thousand times too
 * coarse to ever show a molecule. Particles are not something you can be shown;
 * they are something you have to infer.
 * ================================================================== */

interface ZoomSubstance {
  key: string;
  label: string;
  sub: string;
  /** Particle diameter in metres. */
  d: number;
  /** Particles per cubic metre. */
  n: number;
  /** Semantic palette key, so colour always means the same state of matter. */
  tint: string;
  phase: "solid" | "liquid" | "gas";
  /** Wander of a particle away from its site, as a fraction of the spacing. */
  jiggle: number;
  /** What the naked eye is looking at before the magnifier goes in. */
  object: string;
  fact: string;
}

const ZOOM_SUBSTANCES: Record<string, ZoomSubstance> = {
  water: {
    key: "water", label: "Water", sub: "liquid at 20 °C",
    d: 2.8e-10, n: 3.34e28, tint: "liquid", phase: "liquid", jiggle: 0.22,
    object: "a drop on a glass slide",
    fact: "A single drop of water holds about 1.7 × 10²¹ molecules.",
  },
  air: {
    key: "air", label: "Air", sub: "gas at room pressure",
    d: 3.1e-10, n: 2.5e25, tint: "gas", phase: "gas", jiggle: 0.5,
    object: "a sealed flask of air",
    fact: "Air molecules sit about eleven of their own diameters apart.",
  },
  copper: {
    key: "copper", label: "Copper", sub: "solid metal",
    d: 2.56e-10, n: 8.49e28, tint: "solid", phase: "solid", jiggle: 0.07,
    object: "a piece of bare wire",
    fact: "Copper atoms are locked in a lattice — they vibrate but never swap places.",
  },
};

/** Widest view is 1 cm; the dial runs 12.5 units per factor of ten. */
function zoomView(zoom: number): number {
  return 1e-2 * Math.pow(10, -zoom / 12.5);
}

function zoomOfView(view: number): number {
  return -12.5 * Math.log10(view / 1e-2);
}

function zoomSub(params: Record<string, number | boolean | string>): ZoomSubstance {
  return ZOOM_SUBSTANCES[String(params.substance)] ?? ZOOM_SUBSTANCES.water;
}

interface ZoomState {
  /** Eased view dial, so the magnifier glides rather than jumping. */
  zoom: number;
  t: number;
  /** Flat [dx, dy, phase] triples for the lattice sites. */
  jitter: number[];
  fact: number;
  /** Smallest view width the student has reached, for the lab checkpoints. */
  deepest: number;
}

const ZOOM_SITES = 384;

const zoomModel: SimModel<ZoomState> = {
  init(params, ctx) {
    const jitter: number[] = [];
    for (let i = 0; i < ZOOM_SITES; i++) {
      jitter.push(ctx.rng.range(-0.5, 0.5), ctx.rng.range(-0.5, 0.5), ctx.rng.range(0, Math.PI * 2));
    }
    const zoom = params.zoom as number;
    return { zoom, t: 0, jitter, fact: 0, deepest: zoomView(zoom) };
  },

  step(state, dt, params, _ctx, inputs) {
    let fact = state.fact;
    for (const input of inputs) {
      if (input.type === "pointerdown") fact = (fact + 1) % 3;
    }
    const target = params.zoom as number;
    const k = Math.min(1, dt * 3.4);
    const zoom = state.zoom + (target - state.zoom) * k;
    return {
      ...state,
      t: state.t + dt,
      fact,
      zoom,
      deepest: Math.min(state.deepest, zoomView(zoom)),
    };
  },

  readouts(state, params) {
    const sub = zoomSub(params);
    const view = zoomView(state.zoom);
    const spacing = Math.pow(sub.n, -1 / 3);
    return [
      {
        key: "view", label: "Width of the view", quantity: q(view, "length"), unit: "m",
        semantic: "distance", graphable: false,
      },
      {
        key: "across", label: "Particles across the view", quantity: q(view / spacing, "count"),
        graphable: false,
      },
      {
        key: "spacing", label: "Average spacing", quantity: q(spacing, "length"), unit: "m",
        semantic: "distance", graphable: false,
      },
      {
        key: "diameter", label: "Particle diameter", quantity: q(sub.d, "length"), unit: "m",
        semantic: "distance", graphable: false,
      },
      {
        key: "gapRatio", label: "Spacing ÷ diameter", quantity: q(spacing / sub.d, "ratio"),
        graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "inCube", label: "Particles in a cube this wide",
        quantity: q(sub.n * view * view * view, "count"),
        graphable: false, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const sub = zoomSub(params);
    const view = zoomView(state.zoom);
    const spacing = Math.pow(sub.n, -1 / 3);
    const across = view / spacing;
    return {
      substance: sub.key,
      across,
      spacing,
      diameter: sub.d,
      gapRatio: spacing / sub.d,
      viewWidth: view,
      deepestView: state.deepest,
      grainVisible: across <= 140,
      particlesResolved: across <= 28,
      biggerThanEye: view >= 1e-4,
    };
  },
};

/** Where lattice site (col, row) sits on screen, jiggle and all. */
function zoomSite(
  state: ZoomState, sub: ZoomSubstance,
  col: number, row: number, sp: number, x0: number, y0: number,
): { x: number; y: number } {
  const idx = (((row * 131 + col * 17) % ZOOM_SITES) + ZOOM_SITES) % ZOOM_SITES;
  const jx = state.jitter[idx * 3];
  const jy = state.jitter[idx * 3 + 1];
  const ph = state.jitter[idx * 3 + 2];
  const wob = sub.jiggle * sp;
  const sway = sub.phase === "gas" ? 0.6 : sub.phase === "liquid" ? 0.4 : 0.5;
  return {
    x: x0 + (col - 1) * sp + sp * 0.5 + jx * wob * 2 + Math.sin(state.t * 1.7 + ph) * wob * sway,
    y: y0 + (row - 1) * sp + sp * 0.5 + jy * wob * 2 + Math.cos(state.t * 2.1 + ph * 1.3) * wob * sway,
  };
}

function renderZoom(rc: RenderContext<ZoomState>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const sub = zoomSub(params);
  const dark = isDarkTheme(theme);
  const view = zoomView(state.zoom);
  const spacing = Math.pow(sub.n, -1 / 3);
  const across = view / spacing;
  const tint = theme.sci[sub.tint] ?? theme.accent;
  const t = state.t;

  /* ---------- the bench the instrument stands on ---------- */
  sky(ctx, width, height, theme, "indoor");
  gradientFill(ctx, 0, height * 0.58, width, height * 0.42,
    [hexA(theme.inkSoft, 0), hexA(theme.inkSoft, dark ? 0.2 : 0.12)], 90);
  noiseWash(ctx, 0, 0, width, height, { alpha: 0.035, seed: 12 });

  const ladderW = band === "3-5" ? 74 : 100;
  const vx0 = 12 + ladderW;
  const vy0 = 38;
  const vx1 = width - 12;
  const vy1 = height - 42;
  const vw = Math.max(80, vx1 - vx0);
  const vh = Math.max(80, vy1 - vy0);

  /* ---------- the sample, seen through the objective ---------- */
  const ppm = vw / view;
  const sp = spacing * ppm;
  const pr = Math.max(0.4, (sub.d / 2) * ppm);
  const cols = Math.floor(vw / sp) + 3;
  const rows = Math.floor(vh / sp) + 3;
  const total = Math.max(1, cols * rows);
  const mode: "resolved" | "grain" | "smooth" =
    sp >= 9 && total <= 460 ? "resolved" : total <= 90000 ? "grain" : "smooth";

  ctx.save();
  roundRect(ctx, vx0, vy0, vw, vh, 12);
  ctx.clip();

  const shallow = dark ? mixHex(tint, "#000000", 0.62) : mixHex(tint, "#ffffff", 0.6);
  const deep = dark ? mixHex(tint, "#000000", 0.8) : mixHex(tint, "#ffffff", 0.8);
  gradientFill(ctx, vx0, vy0, vw, vh, [shallow, deep], 118);

  if (mode === "smooth") {
    // Nothing resolves: a body of matter with a sheen on it and no structure.
    gradientFill(ctx, vx0, vy0, vw, vh * 0.5, [hexA("#ffffff", 0.1), hexA("#ffffff", 0)], 90);
    noiseWash(ctx, vx0, vy0, vw, vh, { alpha: 0.05, seed: 41, color: tint, size: 1.6 });
    for (let i = 0; i < 3; i++) {
      const cx = vx0 + vw * (0.25 + 0.25 * i) + Math.sin(t * 0.3 + i) * vw * 0.02;
      glow(ctx, cx, vy0 + vh * (0.3 + 0.2 * i), vw * 0.26, mixHex(tint, "#ffffff", 0.6), 0.09);
    }
  } else if (mode === "grain") {
    const cap = 3000;
    const stride = Math.max(1, Math.ceil(total / cap));
    const pts: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < total; i += stride) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const p = zoomSite(state, sub, col, row, sp, vx0, vy0);
      pts.push({ x: p.x, y: p.y, r: Math.max(0.5, pr) });
    }
    const alpha = clamp01(0.25 + (sp - 1.2) / 12);
    particleField(ctx, pts, mixHex(tint, dark ? "#ffffff" : "#000000", 0.35), {
      size: pr, alpha, buckets: 1,
    });
  } else {
    // Resolved: every particle is an object with a lit side and a shadow side.
    const bond = sub.key === "water" ? 0.96e-10 * ppm : 1.1e-10 * ppm;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const p = zoomSite(state, sub, col, row, sp, vx0, vy0);
        if (p.x < vx0 - sp || p.x > vx1 + sp || p.y < vy0 - sp || p.y > vy1 + sp) continue;
        spriteShadowEllipse(ctx, p.x + pr * 0.25, p.y + pr * 0.55, pr * 1.1, pr * 0.38, { alpha: 0.2 });
        if (sub.key === "water" && pr > 13) {
          // The two hydrogens sit at 104.5°, 0.096 nm from the oxygen.
          const spin = Math.sin(t * 0.7 + p.x * 0.01) * 0.5;
          for (const s of [-1, 1]) {
            const a = spin + (s * 104.5 * Math.PI) / 360;
            sphere(ctx, p.x + Math.cos(a) * bond, p.y - Math.sin(a) * bond, pr * 0.5,
              mixHex(tint, "#ffffff", 0.55));
          }
        } else if (sub.key === "air" && pr > 11) {
          // Air is mostly N2 and O2 — two atoms bonded, not lone spheres.
          const a = t * 0.6 + p.y * 0.02;
          sphere(ctx, p.x + Math.cos(a) * pr * 0.85, p.y + Math.sin(a) * pr * 0.85, pr * 0.85, tint);
          sphere(ctx, p.x - Math.cos(a) * pr * 0.85, p.y - Math.sin(a) * pr * 0.85, pr * 0.85, tint);
          continue;
        }
        sphere(ctx, p.x, p.y, pr, tint, { glow: sub.phase === "gas" ? 0.25 : 0 });
      }
    }
  }

  innerGlow(ctx, (c) => { roundRect(c, vx0, vy0, vw, vh, 12); },
    dark ? "#000000" : theme.inkSoft, { inset: 16, alpha: 0.16, steps: 3 });

  /* ---------- scale bar, inside the field where it belongs ---------- */
  const barTarget = niceStep(view * 0.28);
  const barPx = barTarget * ppm;
  if (barPx > 24 && barPx < vw * 0.8) {
    const bx = vx1 - barPx - 20;
    const by = vy1 - 24;
    ctx.save();
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.85)" : "rgba(20,28,38,0.8)";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 5);
    ctx.lineTo(bx, by + 5);
    ctx.moveTo(bx + barPx, by - 5);
    ctx.lineTo(bx + barPx, by + 5);
    ctx.stroke();
    ctx.restore();
    caption(ctx, bx + barPx / 2, by - 13, fmtLength(barTarget), theme, {
      align: "center", size: 11, weight: 700,
    });
  }

  ctx.restore();

  /* ---------- the objective housing ---------- */
  rimLight(ctx, (c) => { roundRect(c, vx0 + 1, vy0 + 1, vw - 2, vh - 2, 11); },
    dark ? "#9ec8e8" : "#ffffff",
    { width: 1.6, alpha: 0.5, bounds: { x: vx0, y: vy0, w: vw, h: vh } });
  bevelRect(ctx, vx0 - 3, vy0 - 3, vw + 6, vh + 6, 14, theme.inkSoft, { depth: 1, fill: false });

  /* ---------- what the eye is actually looking at ---------- */
  if (overlays.locator !== false) {
    const cw = 128, ch = 92;
    const cx = vx1 - cw - 14, cy = vy0 + 14;
    panel(ctx, cx, cy, cw, ch, theme, theme.accent, 0.92);
    caption(ctx, cx + 10, cy + 14, sub.object, theme, { size: 10, color: theme.inkSoft });
    const ox = cx + cw / 2, oy = cy + 54;
    if (sub.key === "copper") {
      metal(ctx, ox - 40, oy - 5, 80, 11, mixHex(tint, "#ffffff", 0.1), { radius: 5 });
    } else if (sub.key === "air") {
      glass(ctx, ox - 24, oy - 26, 48, 52, 10, theme, { tint: theme.sci["gas"], alpha: 0.32 });
      material(ctx, ox - 7, oy - 40, 14, 16, theme.inkSoft, 3);
    } else {
      glass(ctx, ox - 26, oy - 28, 52, 54, 5, theme, { alpha: 0.3 });
      ctx.save();
      roundRect(ctx, ox - 24, oy - 4, 48, 28, 4);
      ctx.clip();
      gradientFill(ctx, ox - 24, oy - 6, 48, 30,
        [mixHex(tint, "#ffffff", 0.35), mixHex(tint, "#000000", 0.12)], 90);
      ctx.restore();
    }
    // The box that says "this is the bit you are magnifying".
    const boxPx = Math.max(2.5, (view / 0.05) * cw);
    ctx.save();
    ctx.strokeStyle = hexA(theme.sci["hot"], 0.55 + 0.45 * pulse(t, 0.7));
    ctx.lineWidth = 1.6;
    ctx.strokeRect(ox - boxPx / 2, oy - boxPx / 2, boxPx, boxPx);
    ctx.restore();
  }

  /* ---------- the scale ladder: the instrument, not a legend ---------- */
  const tx = 24;
  metal(ctx, tx - 7, vy0, 14, vh, mixHex(theme.inkSoft, "#ffffff", 0.1),
    { radius: 7, polish: 0.8 });
  const decades: { v: number; label: string }[] = [
    { v: 1e-2, label: "1 cm" }, { v: 1e-3, label: "1 mm" }, { v: 1e-4, label: "0.1 mm" },
    { v: 1e-5, label: "10 µm" }, { v: 1e-6, label: "1 µm" }, { v: 1e-7, label: "100 nm" },
    { v: 1e-8, label: "10 nm" }, { v: 1e-9, label: "1 nm" }, { v: 1e-10, label: "0.1 nm" },
  ];
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.6);
  ctx.lineWidth = 1;
  for (const d of decades) {
    const y = vy0 + (zoomOfView(d.v) / 100) * vh;
    ctx.beginPath();
    ctx.moveTo(tx + 7, y);
    ctx.lineTo(tx + 13, y);
    ctx.stroke();
    caption(ctx, tx + 17, y, d.label, theme, { size: 9.5, color: theme.inkSoft });
  }
  ctx.restore();
  // Two limits that decide what anyone can ever see directly.
  const limits: { v: number; color: string }[] = [
    { v: 1e-4, color: theme.sci["light"] },
    { v: 2e-7, color: theme.sci["wave"] },
  ];
  for (const lim of limits) {
    const y = vy0 + (zoomOfView(lim.v) / 100) * vh;
    ctx.save();
    ctx.fillStyle = lim.color;
    ctx.beginPath();
    ctx.arc(tx, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // The travelling indicator.
  const iy = vy0 + (zoomOfView(view) / 100) * vh;
  ctx.save();
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(tx + 11, iy);
  ctx.lineTo(tx + 2, iy - 6.5);
  ctx.lineTo(tx + 2, iy + 6.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  badge(ctx, tx - 10, iy, fmtLength(view), theme, { align: "right", color: theme.accent });

  /* ---------- what is on the stage right now ---------- */
  caption(ctx, vx0, 20, `${sub.label} — ${sub.sub}`, theme, { size: 14, weight: 800 });
  const verdict = mode === "resolved"
    ? "Individual particles resolved"
    : mode === "grain"
      ? "Grain appearing at the edge of resolution"
      : view > 1e-4 ? "Looks perfectly smooth — as it does to your eye" : "Still smooth: nothing resolves yet";
  caption(ctx, vx1, 20, verdict, theme, {
    size: 11, align: "right",
    color: mode === "resolved" ? theme.sci["hot"] : theme.inkSoft,
  });

  /* ---------- labels that live in the margin, never on the artwork ---------- */
  if (overlays.labels !== false && mode === "resolved") {
    const anchorCol = Math.max(1, Math.round(cols * 0.28));
    const anchorRow = Math.max(1, Math.round(rows * 0.5));
    const a = zoomSite(state, sub, anchorCol, anchorRow, sp, vx0, vy0);
    const b = zoomSite(state, sub, anchorCol + 1, anchorRow, sp, vx0, vy0);
    labelLeader(ctx, a.x, a.y, vx0 + vw * 0.06, vy0 + vh * 0.16,
      `one ${sub.key === "copper" ? "atom" : "molecule"}`, theme, {
        color: tint, size: 11, sub: `${fmtLength(sub.d)} across`, align: "right",
      });
    labelLeader(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2, vx0 + vw * 0.06, vy0 + vh * 0.82,
      "the gap between them", theme, {
        color: theme.accent, size: 11,
        sub: `${fmtLength(spacing)} centre to centre`, align: "right",
      });
  }

  /* ---------- the numbers, beside the thing they describe ---------- */
  badge(ctx, vx1 - 14, vy1 - 58, `${across >= 1000 ? sciText(across, 1) : fmtInt(across)}`, theme, {
    align: "right", color: theme.accent, sub: "particles across",
  });
  if (band !== "3-5") {
    badge(ctx, vx1 - 14, vy1 - 24, sciText(sub.n * view * view * view, 1), theme, {
      align: "right", color: tint, sub: "particles in this cube",
    });
  }

  /* ---------- the rotating fact card ---------- */
  const cardW = Math.min(330, vw - 24);
  const cardH = 44;
  const cardX = vx0 + 12;
  const cardY = vy1 - cardH - 12;
  const facts = [
    sub.fact,
    `Your eye stops at 0.1 mm. A school microscope stops at 200 nm.`,
    `Spacing is ${fx(spacing / sub.d, 1)} times the particle's own width.`,
  ];
  panel(ctx, cardX, cardY, cardW, cardH, theme, theme.accent, 0.9);
  caption(ctx, cardX + 12, cardY + 15, facts[state.fact], theme, { size: 10.5 });
  caption(ctx, cardX + 12, cardY + 32, "tap the stage for the next fact", theme, {
    size: 9, color: theme.inkSoft,
  });

  vignette(ctx, width, height, 0.16);
}

export const g6c2ParticleZoom: SimManifest<ZoomState> = {
  id: "g6c2-particle-zoom",
  title: "Down to the Grain",
  tagline: "Turn the magnifier past every limit your eyes have and find out what water is made of.",
  subject: "physics",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8],
  standards: { ngss: ["MS-PS3-5", "MS-PS1-4"] },
  learningGoals: [
    "Describe matter as huge numbers of tiny particles with space between them.",
    "Explain why matter looks smooth even though it is grainy.",
    "Compare particle spacing in a solid, a liquid and a gas using real sizes.",
  ],
  misconceptions: [
    "Matter is continuous — you could keep cutting it forever",
    "Particles are just a drawing, not something really there",
    "There is air (or something) in the gaps between particles",
    "You could see molecules with a good school microscope",
  ],
  interactionHint: "Turn the magnifier dial, and tap the stage for another fact.",
  params: {
    substance: {
      type: "option", label: "Sample",
      options: [
        { value: "water", label: "Water (liquid)" },
        { value: "air", label: "Air (gas)" },
        { value: "copper", label: "Copper (solid)" },
      ],
      default: "water",
    },
    zoom: {
      type: "number", label: "Magnifier", kind: "count",
      min: 0, max: 100, step: 1, default: 6,
      help: "Every 12.5 steps on this dial magnifies the view ten more times.",
      marks: [
        { value: 0, label: "1 cm" },
        { value: 25, label: "0.1 mm" },
        { value: 50, label: "1 µm" },
        { value: 75, label: "10 nm" },
        { value: 100, label: "0.1 nm" },
      ],
      hideValueBands: ["3-5"],
    },
  },
  overlays: [
    { key: "labels", label: "Part labels", default: true },
    { key: "locator", label: "Where you are looking", default: true },
  ],
  model: zoomModel,
  render: renderZoom,
  labs: [
    {
      id: "smooth-or-grainy",
      title: "Is water smooth all the way down?",
      question: "If you keep magnifying a drop of water, does it stay smooth forever?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 15,
      standards: ["MS-PS3-5"],
      setup: { substance: "water", zoom: 4 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Answer before you touch the dial.",
          predict: {
            prompt: "Magnify a drop of water a hundred million times. What do you see?",
            options: [
              "Smooth water, just bigger",
              "Grains with space between them",
              "Nothing — water would vanish",
            ],
            correct: 1,
            reveal: "Water is grainy. The grains are molecules about 0.28 nm across, and there are 3.34 × 10²⁸ of them in a cubic metre.",
          },
        },
        {
          id: "find-grain",
          phase: "measure",
          title: "Magnify until the grain shows",
          instruction: "Turn the dial up until you can count individual particles.",
          check: {
            describe: "Fewer than 28 particles across the view",
            test: (v) => Boolean(v.facts.particlesResolved),
          },
          hints: [
            "Watch the ladder on the left. Grain appears somewhere below 10 nm.",
            "The verdict line in the top-right tells you when particles are resolved.",
          ],
        },
        {
          id: "record",
          phase: "measure",
          title: "Record what you can see",
          instruction: "Record the view width and the spacing at three different dial settings.",
          requireData: 3,
        },
        {
          id: "explain",
          phase: "conclude",
          title: "Explain the smoothness",
          instruction: "Water is grainy but looks smooth. Say why, using the numbers.",
          write: {
            prompt: "Why does grainy water look perfectly smooth to your eye?",
            placeholder: "My eye can only resolve about 0.1 mm, and the particles are ...",
          },
        },
      ],
    },
    {
      id: "gaps-compare",
      title: "Which has the biggest gaps?",
      question: "Solid, liquid or gas — where are the particles furthest apart?",
      bands: ["6-8", "9-12"],
      minutes: 18,
      setup: { substance: "copper", zoom: 88 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Rank them first",
          instruction: "Predict before measuring anything.",
          predict: {
            prompt: "Which sample has the biggest gaps between its particles?",
            options: ["Copper (solid)", "Water (liquid)", "Air (gas)", "They are all the same"],
            correct: 2,
            reveal: "Air wins by a mile: about 3.4 nm apart, roughly eleven molecule-widths. Copper and water are both close-packed, only a fraction apart.",
          },
        },
        {
          id: "measure",
          phase: "measure",
          title: "Measure all three",
          instruction: "Record the spacing and the spacing ÷ diameter for each sample.",
          requireData: 3,
          hints: [
            "Keep the magnifier deep enough to resolve particles in every sample.",
            "Air needs a wider view than copper, because its particles are further apart.",
          ],
        },
        {
          id: "ratio",
          phase: "analyze",
          title: "Compare the ratios",
          instruction: "Solid and liquid ratios are close to 1. What is air's ratio?",
          write: {
            prompt: "How many times bigger is the gap in air than the gap in copper?",
            placeholder: "Air spacing is about ... nm and copper is about ... nm, so ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain squashing",
          instruction: "Use the gaps to explain why a gas can be squashed and a solid cannot.",
          write: {
            prompt: "Why can you compress air in a syringe but not water or copper?",
            placeholder: "Gas particles have space to move into, while ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "resolve-the-grain",
      title: "Resolve the grain",
      brief: "Get fewer than 20 water molecules across the view.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { substance: "water", zoom: 10 },
      goal: {
        describe: "Fewer than 20 particles across, in water",
        test: (v) => v.params.substance === "water" && (v.facts.across as number) < 20,
      },
      stars: {
        two: {
          describe: "Fewer than 10 particles across",
          test: (v) => v.params.substance === "water" && (v.facts.across as number) < 10,
        },
        three: {
          describe: "Fewer than 5 particles across",
          test: (v) => v.params.substance === "water" && (v.facts.across as number) < 5,
        },
      },
      hints: ["Push the magnifier past 75 — that is where 10 nm sits on the ladder."],
    },
    {
      id: "room-in-a-gas",
      title: "Find the room in a gas",
      brief: "Show air's particles with the gaps between them clearly visible.",
      bands: ["6-8", "9-12"],
      setup: { substance: "air", zoom: 40 },
      goal: {
        describe: "Air resolved with fewer than 12 particles across",
        test: (v) => v.params.substance === "air" && (v.facts.across as number) < 12,
      },
      stars: {
        two: {
          describe: "Gap at least ten times the molecule width",
          test: (v) => v.params.substance === "air"
            && (v.facts.across as number) < 12 && (v.facts.gapRatio as number) >= 10,
        },
      },
      hints: [
        "Air particles are eleven diameters apart, so a view a few nanometres wide holds only a handful.",
      ],
    },
  ],
};
