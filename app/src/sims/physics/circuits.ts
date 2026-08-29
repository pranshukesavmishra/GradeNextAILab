import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { camera, mixHex } from "@ui/draw";
import {
  badge, caption, glow, hexA, lifted, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Circuit Builder — Grades 2-12.
 *
 * A battery, up to three bulbs, an optional resistor and a switch. The student
 * picks the topology and watches charge move: the dots thin out past every
 * junction in a parallel circuit, and every bulb in a series circuit dims as
 * another is added.
 *
 * Confronts the two dominant circuit misconceptions: that current is "used up"
 * by the first bulb it meets, and that a battery supplies a fixed current
 * rather than a fixed voltage.
 */

/* ------------------------------------------------------------------ *
 * The solver
 *
 * Three bulbs in one of three topologies does not need nodal analysis: every
 * case reduces to one equivalent resistance plus a divider, which is exactly
 * the algebra a student is being asked to learn.
 * ------------------------------------------------------------------ */

export interface CircuitSolution {
  /** Number of bulbs actually in the circuit. */
  n: number;
  closed: boolean;
  /** Battery EMF, V. */
  emf: number;
  /** One bulb's resistance, Ω. */
  bulbR: number;
  /** Extra series resistor, Ω. */
  extraR: number;
  /** Total circuit resistance, Ω. */
  totalR: number;
  /** Current out of the battery, A. */
  current: number;
  /** Current through one bulb, A. */
  bulbCurrent: number;
  /** Voltage across one bulb, V. */
  bulbVoltage: number;
  /** Power in one bulb, W. */
  bulbPower: number;
  /** Total power delivered by the battery, W. */
  power: number;
  /** Bulb power relative to a "normal glow" of 6 W. */
  brightness: number;
}

/** A bulb dissipating this much power is drawn at full brightness. */
const FULL_GLOW_WATTS = 6;

export function solveCircuit(params: ParamValues): CircuitSolution {
  const topology = params.topology as string;
  const emf = params.voltage as number;
  const bulbR = Math.max(0.1, params.bulbResistance as number);
  const extraR = Math.max(0, params.resistor as number);
  const closed = params.switchClosed as boolean;
  const n = topology === "single" ? 1 : Math.round(params.bulbCount as number);

  // Equivalent resistance of the bulb network.
  const networkR = topology === "parallel" ? bulbR / n : bulbR * n;
  const totalR = networkR + extraR;

  const current = closed && totalR > 0 ? emf / totalR : 0;
  // In series every bulb carries the whole current; in parallel each branch
  // carries an equal share of it, because the branches are identical.
  const bulbCurrent = topology === "parallel" ? current / n : current;
  const bulbVoltage = bulbCurrent * bulbR;
  const bulbPower = bulbCurrent * bulbCurrent * bulbR;

  return {
    n, closed, emf, bulbR, extraR, totalR, current,
    bulbCurrent, bulbVoltage, bulbPower,
    power: emf * current,
    brightness: bulbPower / FULL_GLOW_WATTS,
  };
}

/* ------------------------------------------------------------------ *
 * Layout — shared by the renderer and the charge-flow animation
 * ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

interface Wire {
  pts: Pt[];
  /** This wire's current as a fraction of the battery current. */
  frac: number;
}

interface Layout {
  wires: Wire[];
  bulbs: Pt[];
  battery: Pt;
  switchAt: Pt;
  resistorAt: Pt;
}

// World box the circuit is drawn in. Fixed, so the schematic never jumps
// around as the student changes the topology.
const W = 100;
const H = 58;
const LEFT = 14, RIGHT = 86, TOP = 44, BOTTOM = 12;
const BAT_TOP = 34, BAT_BOTTOM = 24;

function layoutFor(sol: CircuitSolution, topology: string): Layout {
  const battery = { x: LEFT, y: (BAT_TOP + BAT_BOTTOM) / 2 };

  if (topology === "parallel") {
    const n = sol.n;
    // The last branch *is* the right-hand wire, so no dead stub is drawn.
    const xs = n === 2 ? [52, RIGHT] : [40, 63, RIGHT];
    const branchXs = xs.slice(0, n);
    const bulbs = branchXs.map((x) => ({ x, y: (TOP + BOTTOM) / 2 }));

    const wires: Wire[] = [
      { pts: [{ x: LEFT, y: BAT_TOP }, { x: LEFT, y: TOP }], frac: 1 },
      { pts: [{ x: LEFT, y: TOP }, { x: branchXs[0], y: TOP }], frac: 1 },
    ];
    // Along the top rail the current drops by one share at every junction —
    // the single most useful thing this animation shows.
    for (let i = 0; i < branchXs.length - 1; i++) {
      wires.push({
        pts: [{ x: branchXs[i], y: TOP }, { x: branchXs[i + 1], y: TOP }],
        frac: (n - i - 1) / n,
      });
    }
    for (const x of branchXs) {
      wires.push({ pts: [{ x, y: TOP }, { x, y: BOTTOM }], frac: 1 / n });
    }
    for (let i = branchXs.length - 1; i > 0; i--) {
      wires.push({
        pts: [{ x: branchXs[i], y: BOTTOM }, { x: branchXs[i - 1], y: BOTTOM }],
        frac: (n - i) / n,
      });
    }
    wires.push({ pts: [{ x: branchXs[0], y: BOTTOM }, { x: LEFT, y: BOTTOM }], frac: 1 });
    wires.push({ pts: [{ x: LEFT, y: BOTTOM }, { x: LEFT, y: BAT_BOTTOM }], frac: 1 });

    return {
      wires, bulbs, battery,
      switchAt: { x: (LEFT + branchXs[0]) / 2, y: BOTTOM },
      resistorAt: { x: (LEFT + branchXs[0]) / 2, y: TOP },
    };
  }

  // Single bulb or a series chain: one loop, one current everywhere.
  const n = sol.n;
  const span = RIGHT - LEFT;
  const bulbs: Pt[] = [];
  for (let i = 0; i < n; i++) {
    bulbs.push({ x: LEFT + (span * (i + 1)) / (n + 1), y: TOP });
  }
  const wires: Wire[] = [{
    pts: [
      { x: LEFT, y: BAT_TOP }, { x: LEFT, y: TOP }, { x: RIGHT, y: TOP },
      { x: RIGHT, y: BOTTOM }, { x: LEFT, y: BOTTOM }, { x: LEFT, y: BAT_BOTTOM },
    ],
    frac: 1,
  }];
  return {
    wires, bulbs, battery,
    switchAt: { x: (LEFT + RIGHT) / 2, y: BOTTOM },
    resistorAt: { x: RIGHT, y: (TOP + BOTTOM) / 2 },
  };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  /** Charge that has left the battery, C. Drives the dot animation. */
  charge: number;
  /** Smoothed brightness per bulb, so filaments warm and cool visibly. */
  glow: number[];
  /** Energy delivered by the battery so far, J. */
  energy: number;
}

/** Filament thermal time constant, s. Real bulbs do not switch instantly. */
const GLOW_TAU = 0.09;
/** Dots never move faster than this many amps' worth, so they stay countable. */
const MAX_VISUAL_AMPS = 8;

const model: SimModel<State> = {
  init(params) {
    const sol = solveCircuit(params);
    return {
      charge: 0,
      glow: Array.from({ length: sol.n }, () => 0),
      energy: 0,
    };
  },

  applyParams(state, params) {
    const sol = solveCircuit(params);
    if (state.glow.length === sol.n) return state;
    // Keep the warmth of the bulbs that survive a topology change.
    const glow = Array.from({ length: sol.n }, (_, i) => state.glow[i] ?? 0);
    return { ...state, glow };
  },

  step(state, dt, params) {
    const sol = solveCircuit(params);
    const k = Math.min(1, dt / GLOW_TAU);
    const glow = state.glow.map((g) => g + (sol.brightness - g) * k);
    return {
      charge: state.charge + Math.min(sol.current, MAX_VISUAL_AMPS) * dt,
      glow,
      energy: state.energy + sol.power * dt,
    };
  },

  readouts(state, params) {
    const s = solveCircuit(params);
    return [
      {
        key: "voltage", label: "Battery voltage", quantity: q(s.emf, "voltage"),
        unit: "V", semantic: "charge-pos", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "current", label: "Current", quantity: q(s.current, "current"),
        unit: "A", semantic: "current", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "resistance", label: "Total resistance", quantity: q(s.totalR, "resistance"),
        unit: "Ω", semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "power", label: "Power from battery", quantity: q(s.power, "power"),
        unit: "W", semantic: "energy-total", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "bulbVoltage", label: "Voltage across one bulb", quantity: q(s.bulbVoltage, "voltage"),
        unit: "V", semantic: "charge-pos", graphable: true, bands: ["9-12"],
      },
      {
        key: "bulbCurrent", label: "Current in one bulb", quantity: q(s.bulbCurrent, "current"),
        unit: "A", semantic: "current", graphable: true, bands: ["9-12"],
      },
      {
        key: "bulbPower", label: "Power in one bulb", quantity: q(s.bulbPower, "power"),
        unit: "W", semantic: "energy-thermal", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "brightness", label: "Brightness", quantity: q(s.brightness, "ratio"),
        semantic: "light", graphable: true,
      },
      {
        key: "energy", label: "Energy used", quantity: q(state.energy, "energy"),
        unit: "J", semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(_state, params) {
    const s = solveCircuit(params);
    return {
      bulbs: s.n,
      topology: params.topology as string,
      lit: s.brightness > 0.05,
      // Identical branches make every bulb identical, so a single brightness
      // describes them all; the spread exists for future uneven networks.
      brightness: s.brightness,
      allEqual: true,
      current: s.current,
      totalR: s.totalR,
      ratio: s.current > 1e-9 ? s.emf / s.current : 0,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function polylineLength(pts: Pt[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}

function pointAt(pts: Pt[], d: number): Pt {
  let rem = d;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (rem <= seg) {
      const t = seg > 0 ? rem / seg : 0;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
    rem -= seg;
  }
  return pts[pts.length - 1];
}

/** World units between charge dots. */
const DOT_SPACING = 6;
/** World units travelled per coulomb — sets the visual speed of current. */
const UNITS_PER_COULOMB = 14;

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const sol = solveCircuit(params);
  const topology = params.topology as string;
  const lay = layoutFor(sol, topology);
  // Cropped close to the components — just enough margin for glow and labels —
  // so the circuit fills the bench instead of sitting in an empty page.
  const MX = W * 0.04, MY = H * 0.017;
  const cam = camera({ x0: MX, y0: MY, x1: W - MX, y1: H - MY, width, height, square: true });
  const s = cam.scale;
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);

  // ---- The bench ----------------------------------------------------
  sky(ctx, width, height, theme, "indoor");
  const boardL = X(W * 0.05), boardR = X(W * 0.95);
  const boardT = Y(H * 0.948), boardB = Y(H * 0.052);
  lifted(ctx, 26, 9, () => {
    material(ctx, boardL, boardT, boardR - boardL, boardB - boardT, theme.surfaceAlt, 12);
  }, 0.3);
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.1);
  ctx.lineWidth = 1;
  ctx.strokeRect(boardL + 7, boardT + 7, boardR - boardL - 14, boardB - boardT - 14);
  ctx.restore();
  for (const [cx, cy] of [
    [boardL + 14, boardT + 14], [boardR - 14, boardT + 14],
    [boardL + 14, boardB - 14], [boardR - 14, boardB - 14],
  ] as [number, number][]) {
    sphere(ctx, cx, cy, 4, theme.inkSoft);
  }

  // ---- Wires -------------------------------------------------------
  // Three passes turn a hairline into a conductor: a dark casing, a lit core,
  // and a thin specular spine along the top of the metal.
  const wirePasses: [number, string][] = [
    [Math.max(4, s * 0.92), hexA(theme.ink, 0.3)],
    [Math.max(2.5, s * 0.6), theme.inkSoft],
    [Math.max(1, s * 0.16), hexA(theme.surface, 0.5)],
  ];
  for (const [lw, color] of wirePasses) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const w of lay.wires) {
      ctx.beginPath();
      ctx.moveTo(X(w.pts[0].x), Y(w.pts[0].y));
      for (let i = 1; i < w.pts.length; i++) ctx.lineTo(X(w.pts[i].x), Y(w.pts[i].y));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Charge flow --------------------------------------------------
  // Carriers are spaced evenly and move at a speed proportional to the current
  // in the wire they are on, so a parallel branch visibly runs at half rate.
  // Each one carries its own light, and the whole stream brightens with I.
  if (overlays.charges && sol.closed && sol.current > 1e-4) {
    const dotR = Math.max(2.2, s * 0.34);
    const heat = Math.max(0, Math.min(1, sol.current / 3));
    for (const w of lay.wires) {
      if (w.frac <= 1e-6) continue;
      const L = polylineLength(w.pts);
      const offset = ((state.charge * w.frac * UNITS_PER_COULOMB) % DOT_SPACING + DOT_SPACING) % DOT_SPACING;
      for (let d = offset; d < L; d += DOT_SPACING) {
        const p = pointAt(w.pts, d);
        const cx = X(p.x), cy = Y(p.y);
        glow(ctx, cx, cy, dotR * (2.4 + heat * 2.6), theme.sci["current"], 0.16 + heat * 0.24);
        sphere(ctx, cx, cy, dotR, theme.sci["current"], { rim: false });
      }
    }
  }

  // ---- Battery ------------------------------------------------------
  {
    const bx = X(lay.battery.x);
    const topY = Y(BAT_TOP), botY = Y(BAT_BOTTOM);
    // A cell with a case and a terminal, not two plates floating on a wire.
    material(ctx, bx - s * 5.6, topY - s * 1.4, s * 11.2, botY - topY + s * 2.8,
      theme.surfaceAlt, s * 1.2);
    material(ctx, bx - s * 1.7, topY - s * 3.2, s * 3.4, s * 2, theme.sci["charge-pos"], s * 0.5);
    ctx.save();
    ctx.lineCap = "butt";
    // Long plate = positive terminal; short plate = negative. Standard symbol.
    ctx.strokeStyle = theme.sci["charge-pos"];
    ctx.lineWidth = Math.max(3, s * 0.5);
    ctx.beginPath();
    ctx.moveTo(bx - s * 5, topY);
    ctx.lineTo(bx + s * 5, topY);
    ctx.stroke();
    ctx.strokeStyle = theme.sci["charge-neg"];
    ctx.beginPath();
    ctx.moveTo(bx - s * 2.6, botY);
    ctx.lineTo(bx + s * 2.6, botY);
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2") {
      caption(ctx, bx + s * 6.4, topY + s * 1.4, "+", theme, {
        color: theme.sci["charge-pos"], size: Math.max(12, s * 1.9), weight: 800,
      });
      caption(ctx, bx + s * 6.4, botY - s * 1.4, "−", theme, {
        color: theme.sci["charge-neg"], size: Math.max(12, s * 1.9), weight: 800,
      });
      badge(ctx, bx, botY + s * 4.6, `${sol.emf.toFixed(1)} V`, theme, {
        align: "center", color: theme.sci["charge-pos"],
      });
    }
  }

  // ---- Switch -------------------------------------------------------
  {
    const sx = X(lay.switchAt.x);
    const sy = Y(lay.switchAt.y);
    const armLen = s * 7;
    // A mounting block hides the wire under the gap, so an open switch really
    // does break the circuit rather than merely covering it up.
    material(ctx, sx - armLen * 0.9, sy - s * 1.7, armLen * 1.8, s * 3.4,
      theme.surfaceAlt, s * 0.6);
    const x0 = sx - armLen * 0.6, y0 = sy;
    const x1 = sol.closed ? sx + armLen * 0.6 : sx + armLen * 0.3;
    const y1 = sol.closed ? sy : sy - armLen * 0.7;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = hexA(theme.ink, 0.35);
    ctx.lineWidth = Math.max(3.5, s * 0.62);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = Math.max(2, s * 0.4);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = hexA(theme.surface, 0.6);
    ctx.lineWidth = Math.max(0.8, s * 0.12);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
    sphere(ctx, x0, y0, Math.max(2.5, s * 0.42), theme.ink);
    sphere(ctx, sx + armLen * 0.6, sy, Math.max(2.5, s * 0.42), theme.ink);
  }

  // ---- Extra resistor ------------------------------------------------
  if (sol.extraR > 0) {
    const rx = X(lay.resistorAt.x);
    const ry = Y(lay.resistorAt.y);
    const vertical = topology !== "parallel";
    const bw = s * 4.6, bh = s * 10;
    ctx.save();
    ctx.translate(rx, ry);
    if (!vertical) ctx.rotate(Math.PI / 2);
    material(ctx, -bw / 2, -bh / 2, bw, bh, theme.sci["decomposer"], s * 0.9);
    // Colour bands, the way a real resistor announces its value.
    const bands = [theme.sci["field"], theme.sci["charge-pos"], theme.sci["charge-neg"]];
    for (let i = 0; i < bands.length; i++) {
      material(ctx, -bw / 2, -bh * 0.3 + i * bh * 0.22, bw, bh * 0.1, bands[i], 0);
    }
    ctx.restore();
    if (band === "9-12") {
      badge(ctx, rx + (vertical ? -s * 5.5 : 0), ry + (vertical ? 0 : -s * 6), `${sol.extraR.toFixed(1)} Ω`, theme, {
        align: vertical ? "right" : "center", color: theme.sci["field"],
      });
    }
  }

  // ---- Bulbs ---------------------------------------------------------
  const lightColor = theme.sci["light"];
  for (let i = 0; i < lay.bulbs.length; i++) {
    const b = lay.bulbs[i];
    const bx = X(b.x), by = Y(b.y);
    const gv = Math.max(0, Math.min(2, state.glow[i] ?? 0));
    const gn = Math.min(1, gv);
    const r = s * 3.6;

    // Screw base, drawn first so the envelope seats into it.
    material(ctx, bx - r * 0.5, by + r * 0.52, r, r * 0.9, theme.inkSoft, r * 0.16);
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k <= 3; k++) {
      const ty = by + r * 0.52 + (r * 0.9 * k) / 4;
      ctx.moveTo(bx - r * 0.5, ty);
      ctx.lineTo(bx + r * 0.5, ty);
    }
    ctx.stroke();
    ctx.restore();

    // The light it actually throws: both the radius and the strength ride the
    // current, so a dim bulb and a bright one are different at a glance.
    if (gv > 0.02) {
      glow(ctx, bx, by, r * (1.8 + 3 * gn), lightColor, Math.min(0.7, 0.1 + 0.55 * gn));
    }

    // Glass envelope, warming from cold glass to white hot.
    ctx.save();
    const env = ctx.createRadialGradient(bx - r * 0.32, by - r * 0.36, r * 0.1, bx, by, r);
    env.addColorStop(0, hexA(lightColor, 0.2 + 0.8 * gn));
    env.addColorStop(0.6, hexA(lightColor, 0.1 + 0.72 * gn));
    env.addColorStop(1, hexA(theme.surface, 0.5));
    ctx.fillStyle = env;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.8);
    ctx.lineWidth = Math.max(1.2, s * 0.2);
    ctx.stroke();
    ctx.strokeStyle = hexA(theme.surface, 0.75);
    ctx.lineWidth = Math.max(1, s * 0.16);
    ctx.beginPath();
    ctx.arc(bx, by, r * 0.72, Math.PI * 1.06, Math.PI * 1.44);
    ctx.stroke();
    ctx.restore();

    // Filament
    ctx.save();
    ctx.strokeStyle = mixHex(theme.inkSoft, lightColor, gn);
    ctx.lineWidth = Math.max(1.5, s * 0.22);
    ctx.lineJoin = "round";
    ctx.beginPath();
    const fw = r * 0.55, fh = r * 0.5;
    ctx.moveTo(bx - fw, by + fh);
    for (let k = 0; k < 4; k++) {
      ctx.lineTo(bx - fw + (fw * 2 * (k + 0.5)) / 4, by + (k % 2 === 0 ? -fh : fh));
    }
    ctx.lineTo(bx + fw, by + fh);
    ctx.stroke();
    if (gn > 0.15) {
      // White-hot core once it is really carrying current.
      ctx.strokeStyle = hexA(theme.surface, Math.min(0.9, gn));
      ctx.lineWidth = Math.max(0.8, s * 0.1);
      ctx.stroke();
    }
    ctx.restore();

    if (band === "6-8" || band === "9-12") {
      badge(ctx, bx, by + r * 2.9, `${sol.bulbPower.toFixed(1)} W`, theme, {
        align: "center", color: theme.sci["energy-thermal"],
      });
    }
  }

  // ---- Meters --------------------------------------------------------
  if (overlays.meters && band !== "K-2") {
    const meterX = X(W * 0.07);
    badge(ctx, meterX, Y(H * 0.914), `I = ${sol.current.toFixed(2)} A`, theme, {
      color: theme.sci["current"],
    });
    let ly = Y(H * 0.914) + 26;
    if (band !== "3-5") {
      caption(ctx, meterX, ly, `R = ${sol.totalR.toFixed(1)} Ω`, theme, {
        size: 12, color: theme.sci["field"],
      });
      ly += 19;
      caption(ctx, meterX, ly, `P = ${sol.power.toFixed(1)} W`, theme, {
        size: 12, color: theme.sci["energy-total"],
      });
      ly += 19;
    }
    if (band === "9-12") {
      caption(ctx, meterX, ly, `V = I × R = ${(sol.current * sol.totalR).toFixed(2)} V`, theme, {
        size: 12, color: theme.inkSoft,
      });
    }
  }

  if (band !== "K-2") {
    const name = topology === "parallel" ? "parallel" : topology === "series" ? "series" : "single loop";
    caption(ctx, X(W / 2), Y(H * 0.914), name, theme, {
      align: "center", size: 13, color: theme.inkSoft,
    });
  }

  if (!sol.closed) {
    caption(ctx, X(W / 2), Y(H * 0.103), "Switch open — no current", theme, {
      align: "center", color: theme.inkSoft, size: 14,
    });
  }

  vignette(ctx, width, height, 0.16);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const circuitsSim: SimManifest<State> = {
  id: "phys.circuits",
  title: "Circuit Builder",
  tagline: "Wire up bulbs, open the switch, and watch what the charge actually does.",
  subject: "physics",
  bands: ["K-2", "3-5", "6-8", "9-12"],
  grades: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["4-PS3-2", "MS-PS3-5", "HS-PS3-5"], ccssMath: ["8.F.B.4", "HSA.CED.A.2"] },
  learningGoals: [
    "Predict how current changes when voltage or resistance changes.",
    "Explain why bulbs in series dim as you add more, and bulbs in parallel do not.",
    "Use V = I × R to work out any one of the three from the other two.",
  ],
  misconceptions: [
    "Current is used up by the first bulb it reaches",
    "A battery supplies a fixed current no matter what is connected",
    "Adding a second bulb in parallel makes both bulbs dimmer",
    "Current flows out of both battery terminals and meets in the bulb",
  ],
  interactionHint: "Change the voltage and watch the dots speed up.",
  params: {
    voltage: {
      type: "number", label: "Battery voltage", kind: "voltage", unit: "V",
      min: 0, max: 12, step: 0.5, default: 6,
      hideValueBands: ["K-2"],
      marks: [
        { value: 1.5, label: "AA cell" },
        { value: 6, label: "Lantern" },
        { value: 9, label: "9 V" },
      ],
      help: "How hard the battery pushes charge around the loop.",
    },
    topology: {
      type: "option", label: "Wiring",
      options: [
        { value: "single", label: "One bulb" },
        { value: "series", label: "Series" },
        { value: "parallel", label: "Parallel" },
      ],
      default: "single",
      bands: ["3-5", "6-8", "9-12"],
      help: "Series = one path for the charge. Parallel = a separate path per bulb.",
    },
    bulbCount: {
      type: "number", label: "How many bulbs", kind: "count",
      min: 2, max: 3, step: 1, default: 2,
      bands: ["3-5", "6-8", "9-12"],
      help: "Only used when the wiring is series or parallel.",
    },
    bulbResistance: {
      type: "number", label: "Bulb resistance", kind: "resistance", unit: "Ω",
      min: 2, max: 20, step: 0.5, default: 6,
      bands: ["6-8", "9-12"],
      help: "How much each bulb resists the flow of charge.",
    },
    resistor: {
      type: "number", label: "Extra resistor", kind: "resistance", unit: "Ω",
      min: 0, max: 20, step: 0.5, default: 0,
      bands: ["9-12"],
      help: "An extra resistor in series with everything else. Set 0 to remove it.",
    },
    switchClosed: {
      type: "boolean", label: "Switch closed", default: true,
      help: "Open the switch and the loop is broken, so nothing flows anywhere.",
    },
  },
  overlays: [
    { key: "charges", label: "Moving charge", default: true },
    { key: "meters", label: "Meter readings", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "ohms-law",
      title: "Discover Ohm's law",
      question: "What happens to the current when you turn the battery voltage up?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS3-5", "HS-PS3-5"],
      setup: {
        voltage: 2, topology: "single", bulbCount: 2,
        bulbResistance: 6, resistor: 0, switchClosed: true,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Make a prediction",
          instruction: "Commit before you touch the slider.",
          predict: {
            prompt: "You double the battery voltage while the bulb stays the same. The current will...",
            options: ["stay the same", "double", "go up a little", "halve"],
            correct: 1,
            reveal: "It doubles. With resistance fixed, current is proportional to voltage: I = V / R.",
          },
        },
        {
          id: "sweep",
          phase: "measure",
          title: "Record six voltages",
          instruction: "Set the voltage to 2, 4, 6, 8, 10 and 12 V. Record after each.",
          requireData: 6,
          hints: [
            "Keep the bulb resistance fixed at 6 Ω the whole time.",
            "Press Record data after every voltage change.",
            "Watch the dots: their speed is the current.",
          ],
        },
        {
          id: "ratio",
          phase: "analyze",
          title: "Divide voltage by current",
          instruction: "For each row work out voltage ÷ current. What do you get every time?",
          write: {
            prompt: "What is voltage ÷ current for each row, and what does that number match?",
            placeholder: "Every row gave about ... which is the same as ...",
          },
          hints: ["Compare your answer with the bulb resistance you set."],
        },
        {
          id: "resist",
          phase: "measure",
          title: "Now change the resistance",
          instruction: "Hold 12 V and set the bulb to 20 Ω. What happens to the current?",
          check: {
            describe: "Bulb resistance is 15 Ω or more",
            test: (v) => (v.params.bulbResistance as number) >= 15,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the rule",
          instruction: "Write one equation linking voltage, current and resistance.",
          write: {
            prompt: "Write the rule you found, and use it to predict the current at 7 V through 14 Ω.",
            placeholder: "My rule is ... so at 7 V through 14 Ω the current would be ...",
          },
        },
      ],
    },
    {
      id: "series-parallel",
      title: "Series vs parallel brightness",
      question: "Two bulbs, one battery. Does it matter how you wire them?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["4-PS3-2", "MS-PS3-5"],
      setup: {
        voltage: 6, topology: "single", bulbCount: 2,
        bulbResistance: 6, resistor: 0, switchClosed: true,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "One bulb is glowing now. Add a second bulb in series.",
          predict: {
            prompt: "Adding a second bulb in series will make the first bulb...",
            options: ["brighter", "dimmer", "exactly the same"],
            correct: 1,
            reveal: "Dimmer. Two bulbs in series double the resistance, so the current halves and each bulb gets only half the voltage.",
          },
        },
        {
          id: "one",
          phase: "measure",
          title: "Measure one bulb",
          instruction: "With one bulb, record the current and brightness.",
          requireData: 1,
          check: {
            describe: "Wiring is set to one bulb",
            test: (v) => v.params.topology === "single",
          },
        },
        {
          id: "series",
          phase: "measure",
          title: "Two in series",
          instruction: "Switch to series with 2 bulbs. Record again.",
          requireData: 2,
          check: {
            describe: "Two bulbs in series",
            test: (v) => v.params.topology === "series" && (v.params.bulbCount as number) === 2,
          },
          hints: ["Look at the dots. Are they moving faster or slower than before?"],
        },
        {
          id: "parallel",
          phase: "measure",
          title: "Two in parallel",
          instruction: "Now switch to parallel with 2 bulbs and record.",
          requireData: 3,
          check: {
            describe: "Two bulbs in parallel",
            test: (v) => v.params.topology === "parallel" && (v.params.bulbCount as number) === 2,
          },
          hints: [
            "Each parallel bulb has its own path back to the battery.",
            "Compare the brightness of one parallel bulb with the single bulb you started with.",
          ],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the difference",
          instruction: "Why does parallel keep each bulb bright, but series does not?",
          write: {
            prompt: "Explain the brightness difference using voltage and current.",
            placeholder: "In series each bulb only gets ... but in parallel every bulb gets ...",
          },
          hints: ["Think about how much of the battery's voltage each bulb receives."],
        },
      ],
    },
  ],
  challenges: [
    {
      id: "three-equal",
      title: "Three bulbs, full brightness",
      brief: "Light three bulbs at once, all equally bright, all at full glow.",
      bands: ["3-5", "6-8", "9-12"],
      setup: {
        voltage: 6, topology: "series", bulbCount: 3,
        bulbResistance: 6, resistor: 0, switchClosed: true,
      },
      goal: {
        describe: "Three bulbs lit, each at full brightness or more",
        test: (v) => (v.facts.bulbs as number) === 3 && (v.facts.brightness as number) >= 0.95,
      },
      stars: {
        two: {
          describe: "Three bulbs each brighter than full glow",
          test: (v) => (v.facts.bulbs as number) === 3 && (v.facts.brightness as number) >= 1.2,
        },
        three: {
          describe: "Three bulbs at full brightness on 7 V or less",
          test: (v) =>
            (v.facts.bulbs as number) === 3 &&
            (v.facts.brightness as number) >= 1.0 &&
            (v.params.voltage as number) <= 7,
        },
      },
      hints: [
        "In series the three bulbs share the battery voltage. Is that enough for any of them?",
        "In parallel every bulb gets the full battery voltage.",
        "Full glow needs 6 W in a bulb. With 6 Ω that takes 6 V across it.",
      ],
    },
    {
      id: "two-amps",
      title: "Build a 2 amp circuit",
      brief: "Get the current to exactly 2.00 A using voltage and resistance.",
      bands: ["6-8", "9-12"],
      setup: {
        voltage: 6, topology: "single", bulbCount: 2,
        bulbResistance: 6, resistor: 0, switchClosed: true,
      },
      goal: {
        describe: "Current within 0.1 A of 2 A",
        test: (v) => Math.abs((v.facts.current as number) - 2) <= 0.1,
      },
      stars: {
        two: {
          describe: "Current within 0.02 A of 2 A",
          test: (v) => Math.abs((v.facts.current as number) - 2) <= 0.02,
        },
        three: {
          describe: "Exactly 2 A with total resistance above 4 Ω",
          test: (v) =>
            Math.abs((v.facts.current as number) - 2) <= 0.02 && (v.facts.totalR as number) > 4,
        },
      },
      hints: [
        "You need V ÷ R to equal 2.",
        "Try picking the resistance first, then work out the voltage it needs.",
        "10 V through 5 Ω gives 2 A. So does 12 V through 6 Ω.",
      ],
    },
  ],
};
