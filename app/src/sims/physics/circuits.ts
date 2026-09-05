import type {
  ParamValues, RenderContext, SimManifest, SimModel, ThemeColors,
} from "@engine/types";
import { q } from "@engine/units";
import { battery, bulb } from "@ui/labware";
import { bokeh, callout, depthWash } from "@ui/organic";
import {
  arcGauge, badge, caption, dashFlow, glow, hexA, isDarkTheme, material,
  metal, plastic, pulse, softShadow, sphere, vignette,
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
/** Bulb envelope radius, world units. */
const R_BULB = 3.3;

/**
 * A panel meter: machined bezel, a dial face under glass, a tick ring and a
 * swinging needle. A needle that sweeps is read at a glance from across a
 * room; a number has to be focused on.
 */
function analogMeter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  frac: number, value: string, name: string,
  color: string, theme: ThemeColors, wobble: number,
) {
  const f = Math.max(0, Math.min(1, frac));
  ctx.save();

  // Bezel
  softShadow(ctx, () => {
    metal(ctx, cx - r, cy - r, r * 2, r * 2, theme.sci["mass"], { radius: r, angle: 125 });
  }, { blur: r * 0.5, dy: r * 0.16, alpha: 0.38 });

  // Dial face
  const face = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.4, r * 0.06, cx, cy, r * 0.9);
  face.addColorStop(0, hexA(theme.surface, 1));
  face.addColorStop(0.72, hexA(theme.surface, 0.94));
  face.addColorStop(1, hexA(theme.surfaceAlt, 1));
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.87, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.ink, 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();

  arcGauge(ctx, cx, cy, r * 0.78, f, color, theme, undefined, {
    width: r * 0.1, start: 152, sweep: 236, ticks: 11,
  });

  // Needle — a tapered blade with a counterweight tail, wobbling a little
  // while current is flowing, the way a real moving-coil movement does.
  const a = ((152 + 236 * f) * Math.PI) / 180 + wobble;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.055);
  ctx.lineTo(r * 0.66, 0);
  ctx.lineTo(-r * 0.2, r * 0.055);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = hexA(theme.ink, 0.35);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
  sphere(ctx, cx, cy, r * 0.13, theme.sci["mass"]);

  // Glass over the face: one bright sweep across the upper left.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.87, 0, Math.PI * 2);
  ctx.clip();
  const sheen = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.2, cy + r * 0.5);
  sheen.addColorStop(0, hexA(theme.surface, 0.75));
  sheen.addColorStop(0.5, hexA(theme.surface, 0.05));
  sheen.addColorStop(1, hexA(theme.surface, 0));
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  caption(ctx, cx, cy - r * 0.44, name, theme, {
    align: "center", size: Math.max(9, r * 0.2), color: theme.inkSoft, weight: 700,
  });
  caption(ctx, cx, cy + r * 0.55, value, theme, {
    align: "center", size: Math.max(11, r * 0.27), color: theme.ink, weight: 800,
  });
  ctx.restore();
}

/**
 * A lamp module: an opaque mounting plate with two terminal screws, and a
 * filament bulb screwed into it. The plate is what lets a bulb sit in the
 * middle of a wire run without the wire appearing to pass through the glass.
 */
function lampModule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, brightness: number,
  vertical: boolean, theme: ThemeColors,
) {
  const pw = vertical ? r * 2.5 : r * 2.9;
  const ph = vertical ? r * 3.1 : r * 2.7;
  softShadow(ctx, () => {
    plastic(ctx, x - pw / 2, y - ph / 2, pw, ph, theme.surfaceAlt, {
      radius: r * 0.3, gloss: 0.4,
    });
  }, { blur: r * 0.5, dy: r * 0.18, alpha: 0.34 });
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.16);
  ctx.lineWidth = 1;
  ctx.strokeRect(x - pw / 2 + 4, y - ph / 2 + 4, pw - 8, ph - 8);
  ctx.restore();

  // Terminal screws where the wire meets the plate.
  const tx = vertical ? 0 : pw / 2 - r * 0.22;
  const ty = vertical ? ph / 2 - r * 0.22 : 0;
  for (const sgn of [-1, 1]) {
    const sx = x + tx * sgn, sy = y + ty * sgn;
    sphere(ctx, sx, sy, r * 0.2, theme.sci["mass"]);
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.12, sy);
    ctx.lineTo(sx + r * 0.12, sy);
    ctx.stroke();
    ctx.restore();
  }

  const b = Math.max(0, Math.min(1, brightness));
  // The module's own glow is deliberately under-driven and a tighter halo is
  // laid over it: a lamp that throws light without washing out the bench.
  bulb(ctx, x, y - r * 0.16, r, b * 0.5, theme);
  if (b > 0.02) {
    glow(ctx, x, y - r * 0.16, r * 2.4, theme.sci["light"], 0.3 * b);
    glow(ctx, x, y - r * 0.16, r * 0.95, theme.sci["light"], 0.5 * b);
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const sol = solveCircuit(params);
  const topology = params.topology as string;
  const parallel = topology === "parallel";
  const lay = layoutFor(sol, topology);
  const dark = isDarkTheme(theme);
  const t = rc.time;

  /* ---- Stage: the whole canvas is one instrument panel --------------- */
  // The loop sits on the upper board; the lower band is an instrument shelf,
  // which is where the meters live on a real bench.
  const padL = width * 0.068;
  const padR = width * 0.055;
  const padT = height * 0.16;
  const padB = Math.max(120, Math.min(height * 0.29, 176));
  const availW = Math.max(40, width - padL - padR);
  const availH = Math.max(40, height - padT - padB);
  const s = Math.min(availW / (RIGHT - LEFT), availH / (TOP - BOTTOM));
  const midX = padL + availW / 2;
  const midY = padT + availH / 2;
  const X = (x: number) => midX + (x - (LEFT + RIGHT) / 2) * s;
  const Y = (y: number) => midY - (y - (TOP + BOTTOM) / 2) * s;

  depthWash(ctx, width, height, theme);
  bokeh(ctx, width, height, theme.accent, 15, 41);

  // The mounting board: a big laminated panel with a perforation grid, screwed
  // down at the corners. It is the bench, and it fills the stage.
  const bIn = Math.max(8, width * 0.016);
  const bx0 = bIn, by0 = bIn;
  const bw = width - bIn * 2, bh = height - bIn * 2;
  softShadow(ctx, () => {
    plastic(ctx, bx0, by0, bw, bh, theme.surfaceAlt, { radius: 16, gloss: 0.3 });
  }, { blur: 40, dy: 16, alpha: 0.4 });
  ctx.save();
  ctx.beginPath();
  const step = Math.max(16, s * 2.1);
  for (let px = bx0 + step; px < bx0 + bw - step * 0.4; px += step) {
    for (let py = by0 + step; py < by0 + bh - step * 0.4; py += step) {
      ctx.moveTo(px + 1.5, py);
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    }
  }
  ctx.fillStyle = hexA(theme.ink, dark ? 0.2 : 0.07);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.12);
  ctx.lineWidth = 1;
  ctx.strokeRect(bx0 + 10, by0 + 10, bw - 20, bh - 20);
  ctx.restore();
  for (const [sx, sy] of [
    [bx0 + 22, by0 + 22], [bx0 + bw - 22, by0 + 22],
    [bx0 + 22, by0 + bh - 22], [bx0 + bw - 22, by0 + bh - 22],
  ] as [number, number][]) {
    sphere(ctx, sx, sy, 6, theme.sci["mass"]);
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx - 3.4, sy - 3.4);
    ctx.lineTo(sx + 3.4, sy + 3.4);
    ctx.stroke();
    ctx.restore();
  }

  /* ---- Wires -------------------------------------------------------- */
  // Screen-space copies, built once and reused by the wire passes, the solder
  // joints and the charge animation.
  const runs = lay.wires.map((w) => ({
    frac: w.frac,
    pts: w.pts.map((p) => ({ x: X(p.x), y: Y(p.y) })),
  }));
  const strokeRun = (pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };
  // Four passes turn a hairline into a cable: a soft shadow on the bench, a
  // dark sheath, the coloured insulation, and a specular spine along the top.
  const passes: [number, string][] = [
    [Math.max(8, s * 1.15), hexA(theme.ink, 0.14)],
    [Math.max(6.4, s * 0.92), hexA(theme.ink, dark ? 0.85 : 0.7)],
    [Math.max(4.4, s * 0.64), theme.sci["mass"]],
    [Math.max(1.2, s * 0.14), hexA(theme.surface, dark ? 0.5 : 0.85)],
  ];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let p = 0; p < passes.length; p++) {
    const [lw, color] = passes[p];
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    if (p === 3) ctx.translate(0, -Math.max(1, s * 0.16));
    for (const r of runs) strokeRun(r.pts);
  }
  ctx.restore();

  // Solder joints at every corner, so the run reads as jointed metal.
  const seen = new Set<string>();
  for (const r of runs) {
    for (const p of r.pts) {
      const key = `${Math.round(p.x)},${Math.round(p.y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sphere(ctx, p.x, p.y, Math.max(3.2, s * 0.42), theme.sci["mass"]);
      glow(ctx, p.x - s * 0.12, p.y - s * 0.14, Math.max(2, s * 0.2), theme.surface, 0.45);
    }
  }

  /* ---- Charge flow --------------------------------------------------- */
  // Carriers are spaced evenly and move at a speed proportional to the current
  // in the wire they are on, so a parallel branch visibly runs at half rate.
  if (overlays.charges && sol.closed && sol.current > 1e-4) {
    const heat = Math.max(0, Math.min(1, sol.current / 3));
    const dotR = Math.max(2.6, s * 0.28);
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (r.frac <= 1e-6) continue;
      dashFlow(ctx, r.pts, theme.sci["current"],
        state.charge * r.frac * UNITS_PER_COULOMB * s, {
          width: Math.max(2, s * 0.26), dash: s * 0.9, gap: s * 1.5,
          alpha: 0.35 + heat * 0.3, glow: s * 0.5,
        });
      const L = polylineLength(lay.wires[i].pts);
      const off = ((state.charge * r.frac * UNITS_PER_COULOMB) % DOT_SPACING + DOT_SPACING) % DOT_SPACING;
      for (let d = off; d < L; d += DOT_SPACING) {
        const p = pointAt(lay.wires[i].pts, d);
        const px = X(p.x), py = Y(p.y);
        glow(ctx, px, py, dotR * (2.6 + heat * 2.4), theme.sci["current"], 0.2 + heat * 0.3);
        sphere(ctx, px, py, dotR, theme.sci["current"], { rim: false });
      }
    }
  }

  /* ---- Battery ------------------------------------------------------- */
  {
    const bx = X(lay.battery.x);
    const byMid = Y((BAT_TOP + BAT_BOTTOM) / 2);
    const cellL = (BAT_TOP - BAT_BOTTOM) * s;
    const cellW = s * 5.4;
    // A cradle the cell sits in, then the cell itself standing on end so its
    // + terminal meets the top rail exactly where the schematic says it does.
    softShadow(ctx, () => {
      plastic(ctx, bx - cellW * 0.86, byMid - cellL * 0.6, cellW * 1.72, cellL * 1.2,
        theme.surfaceAlt, { radius: s * 0.5, gloss: 0.35 });
    }, { blur: s * 1.6, dy: s * 0.4, alpha: 0.35 });
    for (const sgn of [-1, 1]) {
      metal(ctx, bx - cellW * 0.78, byMid + sgn * cellL * 0.33 - s * 0.35,
        cellW * 1.56, s * 0.7, theme.sci["mass"], { radius: s * 0.2 });
    }
    ctx.save();
    ctx.translate(bx, byMid);
    ctx.rotate(-Math.PI / 2);
    battery(ctx, -cellL / 2, -cellW / 2, cellL, cellW, theme);
    ctx.restore();
    // Terminal caps that bridge cell to rail.
    for (const [ty, col] of [
      [Y(BAT_TOP), theme.sci["charge-pos"]], [Y(BAT_BOTTOM), theme.sci["charge-neg"]],
    ] as [number, string][]) {
      sphere(ctx, bx, ty, Math.max(4, s * 0.5), col);
    }
  }

  /* ---- Switch -------------------------------------------------------- */
  {
    const sx = X(lay.switchAt.x);
    const sy = Y(lay.switchAt.y);
    const arm = s * 7.2;
    softShadow(ctx, () => {
      plastic(ctx, sx - arm * 1.02, sy - s * 2.4, arm * 2.04, s * 4.4,
        theme.surfaceAlt, { radius: s * 0.5, gloss: 0.35 });
    }, { blur: s * 1.4, dy: s * 0.4, alpha: 0.32 });
    const x0 = sx - arm * 0.62, x1 = sx + arm * 0.62;
    // Brass posts
    for (const px of [x0, x1]) {
      metal(ctx, px - s * 0.6, sy - s * 1.5, s * 1.2, s * 2.4, theme.sci["current"],
        { radius: s * 0.3 });
      sphere(ctx, px, sy - s * 1.5, s * 0.6, theme.sci["current"]);
    }
    // The blade pivots on the left post. Open, it stands up and the gap is
    // unmistakable; closed, it lies across both posts.
    const ang = sol.closed ? 0 : -0.72;
    ctx.save();
    ctx.translate(x0, sy - s * 1.5);
    ctx.rotate(ang);
    const bladeL = arm * 1.24;
    metal(ctx, -s * 0.5, -s * 0.55, bladeL + s * 0.5, s * 1.1, theme.sci["mass"],
      { radius: s * 0.3, angle: 100 });
    ctx.fillStyle = hexA(theme.surface, 0.6);
    ctx.fillRect(0, -s * 0.34, bladeL, s * 0.18);
    ctx.restore();
    // Insulated handle on the free end of the blade.
    const hx = x0 + Math.cos(ang) * arm * 1.24;
    const hy = sy - s * 1.5 + Math.sin(ang) * arm * 1.24;
    sphere(ctx, hx, hy, s * 1.05, theme.sci["charge-pos"]);
    sphere(ctx, x0, sy - s * 1.5, s * 0.44, theme.surfaceAlt);
    // A contact spark when a heavy current is being carried.
    if (sol.closed && sol.current > 2.5) {
      const f = pulse(t, 7) * pulse(t, 2.3);
      glow(ctx, x1, sy - s * 1.5, s * (1.2 + f * 1.6), theme.sci["current"], 0.25 + f * 0.4);
    }
  }

  /* ---- Series resistor ----------------------------------------------- */
  if (sol.extraR > 0) {
    const rx = X(lay.resistorAt.x);
    const ry = Y(lay.resistorAt.y);
    const vertical = !parallel;
    const bwid = s * 3.4, bhgt = s * 9.4;
    ctx.save();
    ctx.translate(rx, ry);
    if (!vertical) ctx.rotate(Math.PI / 2);
    // Axial leads out of both ends
    metal(ctx, -s * 0.28, -bhgt * 0.78, s * 0.56, bhgt * 1.56, theme.sci["mass"],
      { radius: s * 0.2 });
    softShadow(ctx, () => {
      plastic(ctx, -bwid / 2, -bhgt / 2, bwid, bhgt, theme.sci["decomposer"],
        { radius: bwid * 0.42, gloss: 0.5 });
    }, { blur: s * 1.2, dy: s * 0.3, alpha: 0.35 });
    const bands = [theme.sci["field"], theme.sci["charge-pos"], theme.sci["charge-neg"], theme.sci["current"]];
    for (let i = 0; i < bands.length; i++) {
      material(ctx, -bwid / 2, -bhgt * 0.32 + i * bhgt * 0.17, bwid, bhgt * 0.09, bands[i], 0);
    }
    ctx.restore();
  }

  /* ---- Lamps ---------------------------------------------------------- */
  const rBulb = R_BULB * s;
  for (let i = 0; i < lay.bulbs.length; i++) {
    const b = lay.bulbs[i];
    const bx = X(b.x), by = Y(b.y);
    // Before the clock has run there is no smoothed value yet, so show the
    // steady state rather than a dead filament.
    const raw = state.energy > 0 ? (state.glow[i] ?? 0) : sol.brightness;
    const gv = Math.max(0, Math.min(1.4, raw));
    lampModule(ctx, bx, by, rBulb, gv, parallel, theme);
  }

  /* ---- Callouts ------------------------------------------------------- */
  // Names live on leader lines in the calm middle of the loop, never on a part.
  if (band !== "K-2") {
    const firstBulb = lay.bulbs[0];
    const slots: { x: number; y: number }[] = parallel
      ? [{ x: LEFT + 5, y: 33 }, { x: LEFT + 5, y: 24 }, { x: LEFT + 5, y: 16 }]
      : [{ x: 20, y: 25 }, { x: 42, y: 34 }, { x: 60, y: 18 }];
    callout(ctx, X(lay.battery.x) + s * 2.4, Y((BAT_TOP + BAT_BOTTOM) / 2),
      X(slots[0].x), Y(slots[0].y), "Cell", theme,
      { sub: `${sol.emf.toFixed(1)} V supply`, side: "right", accent: theme.sci["charge-pos"] });
    callout(ctx,
      X(firstBulb.x) - (parallel ? rBulb * 1.35 : 0), Y(firstBulb.y) + (parallel ? 0 : rBulb * 1.45),
      X(slots[1].x), Y(slots[1].y), "Lamp", theme,
      { sub: `${sol.bulbPower.toFixed(1)} W each`, side: "right", accent: theme.sci["energy-thermal"] });
    if (band !== "3-5") {
      callout(ctx, X(lay.switchAt.x), Y(lay.switchAt.y) - s * 2.6,
        X(slots[2].x), Y(slots[2].y), sol.closed ? "Switch closed" : "Switch open", theme, {
          sub: sol.closed
            ? `${sol.n} lamp${sol.n > 1 ? "s" : ""} · ${parallel ? "parallel" : sol.n > 1 ? "series" : "one loop"}`
            : "circuit broken",
          side: "right",
          accent: sol.closed ? theme.sci["field"] : theme.inkSoft,
        });
    }
  }

  /* ---- Instrument shelf ------------------------------------------------ */
  {
    const shelfTop = height - padB + height * 0.012;
    const shelfH = height - bIn - 18 - shelfTop;
    const shelfL = bx0 + 20, shelfW = bw - 40;
    softShadow(ctx, () => {
      metal(ctx, shelfL, shelfTop, shelfW, shelfH, theme.sci["mass"],
        { radius: 12, angle: 90, polish: 0.55 });
    }, { blur: 22, dy: 8, alpha: 0.36 });
    ctx.save();
    ctx.strokeStyle = hexA(theme.surface, 0.28);
    ctx.lineWidth = 1;
    ctx.strokeRect(shelfL + 6, shelfTop + 6, shelfW - 12, shelfH - 12);
    ctx.restore();

    const cym = shelfTop + shelfH / 2;
    const r = Math.max(28, Math.min(shelfH * 0.4, 62));
    if (overlays.meters && band !== "K-2") {
      const iMax = Math.max(0.5, sol.emf / Math.max(0.5, sol.bulbR * 0.34));
      const gauges: [number, string, string, string][] = [
        [sol.current / iMax, `${sol.current.toFixed(2)} A`, "CURRENT", theme.sci["current"]],
        [sol.emf / 12, `${sol.emf.toFixed(1)} V`, "VOLTAGE", theme.sci["charge-pos"]],
      ];
      if (band === "6-8" || band === "9-12") {
        gauges.push([sol.power / 30, `${sol.power.toFixed(1)} W`, "POWER", theme.sci["energy-total"]]);
      }
      for (let i = 0; i < gauges.length; i++) {
        const gx = shelfL + r * 1.5 + i * r * 2.5;
        const wob = i === 0 && sol.current > 0.01
          ? Math.sin(t * 9.1) * 0.011 + Math.sin(t * 3.7) * 0.007
          : 0;
        analogMeter(ctx, gx, cym, r, gauges[i][0], gauges[i][1], gauges[i][2],
          gauges[i][3], theme, wob);
      }
    }

    // Engraved nameplate on the right of the shelf.
    const plateL = shelfL + r * (band === "6-8" || band === "9-12" ? 7.1 : 4.6);
    const plateW = shelfW - (plateL - shelfL) - 22;
    if (plateW > 150) {
      plastic(ctx, plateL, cym - shelfH * 0.32, plateW, shelfH * 0.64,
        theme.surfaceAlt, { radius: 8, gloss: 0.3 });
      const lx = plateL + 20;
      caption(ctx, lx, cym - shelfH * 0.14,
        parallel ? "PARALLEL NETWORK" : sol.n > 1 ? "SERIES CHAIN" : "SINGLE LOOP", theme,
        { size: 13, color: theme.inkSoft, weight: 800 });
      const chips: [string, string][] = [
        [`R = ${sol.totalR.toFixed(1)} Ω`, theme.sci["field"]],
        [`P = ${sol.power.toFixed(1)} W`, theme.sci["energy-total"]],
      ];
      if (band === "9-12") chips.push([`E = ${state.energy.toFixed(0)} J`, theme.sci["energy-thermal"]]);
      let cxp = lx;
      for (const [txt, col] of chips) {
        badge(ctx, cxp, cym + shelfH * 0.14, txt, theme, { color: col });
        ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        cxp += ctx.measureText(txt).width + 28;
      }
      // A brightness bar on the right of the plate: the quantity the student
      // is actually watching, read straight off the lamp.
      const barW = Math.min(plateW * 0.42, 210);
      const barX = plateL + plateW - barW - 20;
      if (barW > 90) {
        caption(ctx, barX, cym - shelfH * 0.16,
          sol.closed ? "LAMP BRIGHTNESS" : "NO CURRENT", theme,
          { size: 12, weight: 800, color: sol.closed ? theme.inkSoft : theme.sci["charge-pos"] });
        const bY = cym + shelfH * 0.06, bH = Math.max(10, shelfH * 0.16);
        material(ctx, barX, bY, barW, bH, theme.grid, bH / 2);
        const f = Math.max(0, Math.min(1, sol.brightness));
        if (f > 0.01) {
          material(ctx, barX, bY, Math.max(bH, barW * f), bH, theme.sci["light"], bH / 2);
          glow(ctx, barX + barW * f, bY + bH / 2, bH * 1.6, theme.sci["light"], 0.4);
        }
        for (let i = 1; i < 4; i++) {
          ctx.save();
          ctx.strokeStyle = hexA(theme.ink, 0.25);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(barX + (barW * i) / 4, bY);
          ctx.lineTo(barX + (barW * i) / 4, bY + bH);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  vignette(ctx, width, height, 0.2);
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
