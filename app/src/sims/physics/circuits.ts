import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { camera, disc, label, roundRect } from "@ui/draw";

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
  const cam = camera({ x0: 0, y0: 0, x1: W, y1: H, width, height, square: true });
  const s = cam.scale;
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);

  // ---- Wires -------------------------------------------------------
  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = Math.max(2, s * 0.5);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const w of lay.wires) {
    ctx.beginPath();
    ctx.moveTo(X(w.pts[0].x), Y(w.pts[0].y));
    for (let i = 1; i < w.pts.length; i++) ctx.lineTo(X(w.pts[i].x), Y(w.pts[i].y));
    ctx.stroke();
  }
  ctx.restore();

  // ---- Charge flow --------------------------------------------------
  // Dots are spaced evenly and move at a speed proportional to the current in
  // the wire they are on, so a parallel branch visibly runs at half rate.
  if (overlays.charges && sol.closed && sol.current > 1e-4) {
    const dotR = Math.max(2, s * 0.32);
    for (const w of lay.wires) {
      if (w.frac <= 1e-6) continue;
      const L = polylineLength(w.pts);
      const offset = ((state.charge * w.frac * UNITS_PER_COULOMB) % DOT_SPACING + DOT_SPACING) % DOT_SPACING;
      for (let d = offset; d < L; d += DOT_SPACING) {
        const p = pointAt(w.pts, d);
        disc(ctx, X(p.x), Y(p.y), dotR, theme.sci["current"]);
      }
    }
  }

  // ---- Battery ------------------------------------------------------
  {
    const bx = X(lay.battery.x);
    ctx.save();
    ctx.lineCap = "butt";
    // Long plate = positive terminal; short plate = negative. Standard symbol.
    ctx.strokeStyle = theme.sci["charge-pos"];
    ctx.lineWidth = Math.max(3, s * 0.5);
    ctx.beginPath();
    ctx.moveTo(bx - s * 5, Y(BAT_TOP));
    ctx.lineTo(bx + s * 5, Y(BAT_TOP));
    ctx.stroke();
    ctx.strokeStyle = theme.sci["charge-neg"];
    ctx.beginPath();
    ctx.moveTo(bx - s * 2.6, Y(BAT_BOTTOM));
    ctx.lineTo(bx + s * 2.6, Y(BAT_BOTTOM));
    ctx.stroke();
    ctx.restore();
    if (band !== "K-2") {
      label(ctx, `${sol.emf.toFixed(1)} V`, bx - s * 7, Y((BAT_TOP + BAT_BOTTOM) / 2), theme, {
        align: "right", color: theme.sci["charge-pos"],
      });
    }
  }

  // ---- Switch -------------------------------------------------------
  {
    const sx = X(lay.switchAt.x);
    const sy = Y(lay.switchAt.y);
    const armLen = s * 7;
    ctx.save();
    // Erase the wire under the gap so an open switch really looks open.
    ctx.strokeStyle = theme.surface;
    ctx.lineWidth = Math.max(3, s * 0.8);
    ctx.beginPath();
    ctx.moveTo(sx - armLen * 0.6, sy);
    ctx.lineTo(sx + armLen * 0.6, sy);
    ctx.stroke();
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = Math.max(2, s * 0.4);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - armLen * 0.6, sy);
    if (sol.closed) ctx.lineTo(sx + armLen * 0.6, sy);
    else ctx.lineTo(sx + armLen * 0.3, sy - armLen * 0.7);
    ctx.stroke();
    ctx.restore();
    disc(ctx, sx - armLen * 0.6, sy, Math.max(2, s * 0.35), theme.ink);
    disc(ctx, sx + armLen * 0.6, sy, Math.max(2, s * 0.35), theme.ink);
  }

  // ---- Extra resistor ------------------------------------------------
  if (sol.extraR > 0) {
    const rx = X(lay.resistorAt.x);
    const ry = Y(lay.resistorAt.y);
    const vertical = topology !== "parallel";
    const w = s * 4, h = s * 9;
    ctx.save();
    ctx.fillStyle = theme.surface;
    ctx.strokeStyle = theme.sci["field"];
    ctx.lineWidth = 2;
    if (vertical) roundRect(ctx, rx - w / 2, ry - h / 2, w, h, 3);
    else roundRect(ctx, rx - h / 2, ry - w / 2, h, w, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (band === "9-12") {
      label(ctx, `${sol.extraR.toFixed(1)} Ω`, rx + (vertical ? -s * 5 : 0), ry + (vertical ? 0 : -s * 5), theme, {
        align: vertical ? "right" : "center", color: theme.sci["field"],
      });
    }
  }

  // ---- Bulbs ---------------------------------------------------------
  const glowColor = theme.sci["light"];
  for (let i = 0; i < lay.bulbs.length; i++) {
    const b = lay.bulbs[i];
    const bx = X(b.x), by = Y(b.y);
    const g = Math.max(0, Math.min(2, state.glow[i] ?? 0));
    const r = s * 3.4;

    // Halo: concentric translucent discs. Cheap, and reads as light.
    if (g > 0.02) {
      for (let k = 5; k >= 1; k--) {
        disc(ctx, bx, by, r * (1 + k * 0.55), glowColor, { alpha: Math.min(0.5, g * 0.09) });
      }
    }

    // Envelope
    disc(ctx, bx, by, r, theme.surface, { stroke: theme.inkSoft, lineWidth: 2 });
    if (g > 0.02) disc(ctx, bx, by, r * 0.92, glowColor, { alpha: Math.min(0.9, g * 0.75) });

    // Filament
    ctx.save();
    ctx.strokeStyle = g > 0.35 ? theme.surface : theme.inkSoft;
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
    ctx.restore();

    // Base contacts
    ctx.save();
    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = Math.max(2, s * 0.3);
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.7, by + r * 0.72);
    ctx.lineTo(bx + r * 0.7, by + r * 0.72);
    ctx.stroke();
    ctx.restore();

    if (band === "6-8" || band === "9-12") {
      label(ctx, `${sol.bulbPower.toFixed(1)} W`, bx, by + r * 2.6, theme, {
        align: "center", color: theme.sci["energy-thermal"], size: 11,
      });
    }
  }

  // ---- Meters --------------------------------------------------------
  if (overlays.meters && band !== "K-2") {
    const lines: string[] = [];
    lines.push(`I = ${sol.current.toFixed(2)} A`);
    if (band !== "3-5") lines.push(`R = ${sol.totalR.toFixed(1)} Ω`);
    if (band !== "3-5") lines.push(`P = ${sol.power.toFixed(1)} W`);
    if (band === "9-12") lines.push(`V = I × R = ${(sol.current * sol.totalR).toFixed(2)} V`);
    let ly = Y(H - 3);
    for (const line of lines) {
      label(ctx, line, X(3), ly, theme, { align: "left", color: theme.ink, size: 12 });
      ly += 18;
    }
  }

  if (!sol.closed) {
    label(ctx, "Switch open — no current", X(W / 2), Y(H - 3), theme, {
      align: "center", color: theme.inkSoft,
    });
  }
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
