import type { ParamValues, Readout, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { disc, label, roundRect } from "@ui/draw";

/**
 * Probability Arcade — Grades 3-12.
 *
 * Flip, roll and spin thousands of times and watch the experimental bars settle
 * onto the theoretical line. The law of large numbers is not stated here; it is
 * made visible, together with the fact that it says nothing at all about any
 * individual trial.
 *
 * Every draw comes from ctx.rng, so a run is exactly reproducible from its seed
 * — a teacher can replay a student's "impossible" streak and see it happen again.
 */

export type Device = "coin" | "die" | "spinner" | "dice2";

/** Outcome labels and exact theoretical probabilities for a device. */
export function distribution(device: Device, sectors: number): { labels: string[]; theory: number[] } {
  switch (device) {
    case "coin":
      return { labels: ["H", "T"], theory: [1 / 2, 1 / 2] };
    case "die":
      return { labels: ["1", "2", "3", "4", "5", "6"], theory: Array(6).fill(1 / 6) };
    case "spinner": {
      const s = Math.max(2, Math.min(8, Math.round(sectors)));
      return {
        labels: Array.from({ length: s }, (_, i) => String(i + 1)),
        theory: Array(s).fill(1 / s),
      };
    }
    case "dice2": {
      // Ways to make each sum from 2 to 12, out of 36 equally likely pairs.
      const ways = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      return {
        labels: ways.map((_, i) => String(i + 2)),
        theory: ways.map((w) => w / 36),
      };
    }
  }
}

/** One trial, returning the index of the outcome. The only source of chance. */
export function drawOutcome(device: Device, sectors: number, rng: Rng): number {
  switch (device) {
    case "coin": return rng.int(0, 1);
    case "die": return rng.int(0, 5);
    case "spinner": return rng.int(0, Math.max(2, Math.min(8, Math.round(sectors))) - 1);
    case "dice2": return rng.int(1, 6) + rng.int(1, 6) - 2;
  }
}

/** Largest gap between an experimental and a theoretical probability. */
export function maxDeviation(counts: readonly number[], theory: readonly number[], total: number): number {
  let worst = 0;
  for (let i = 0; i < theory.length; i++) {
    const p = total > 0 ? counts[i] / total : 0;
    worst = Math.max(worst, Math.abs(p - theory[i]));
  }
  return worst;
}

/** Pearson's χ² against the theoretical distribution — a 9-12 readout. */
function chiSquare(counts: readonly number[], theory: readonly number[], total: number): number {
  if (total === 0) return 0;
  let sum = 0;
  for (let i = 0; i < theory.length; i++) {
    const expected = theory[i] * total;
    if (expected <= 0) continue;
    const d = counts[i] - expected;
    sum += (d * d) / expected;
  }
  return sum;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

interface State {
  device: Device;
  sectors: number;
  counts: number[];
  total: number;
  /** Trials queued but not yet run, so a 10,000 burst never blocks a frame. */
  pending: number;
  lastOutcome: number;
  /** Sim-seconds since the last automatic batch. */
  sinceBatch: number;
  /** Sampling schedule for the convergence trace. */
  nextSample: number;
  curve: { n: number; dev: number }[];
}

/** Hard cap on work per model tick while running — the 60 fps guarantee. */
const MAX_PER_TICK = 400;
/**
 * A paused tap gets one tick to work with, so it drains a whole batch at once.
 * Ten thousand draws is well under a millisecond; spreading them would leave
 * the batch stuck in the queue with no further ticks coming.
 */
const PAUSED_BURST = 12000;
/** Sim-seconds between automatic batches while the run is playing. */
const AUTO_INTERVAL = 0.35;
const MAX_CURVE = 260;

function fresh(device: Device, sectors: number): State {
  const { theory } = distribution(device, sectors);
  return {
    device,
    sectors,
    counts: Array(theory.length).fill(0),
    total: 0,
    pending: 0,
    lastOutcome: -1,
    sinceBatch: AUTO_INTERVAL,
    nextSample: 1,
    curve: [],
  };
}

function batchSize(params: ParamValues): number {
  const n = Number(params.batch);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const model: SimModel<State> = {
  init(params) {
    return fresh(params.device as Device, params.sectors as number);
  },

  applyParams(state, params) {
    const device = params.device as Device;
    const sectors = params.sectors as number;
    // Changing the device changes what the outcomes mean, so old counts
    // would be a lie. Changing the batch size does not.
    if (device !== state.device || (device === "spinner" && sectors !== state.sectors)) {
      return fresh(device, sectors);
    }
    return state;
  },

  step(state, dt, params, ctx, inputs) {
    let pending = state.pending;
    const size = batchSize(params);

    // A tap on the stage runs one batch immediately, even while paused.
    for (const input of inputs) {
      if (input.type === "pointerdown") pending += size;
      if (input.type === "action" && input.action === "launch") pending += size;
      if (input.type === "action" && input.action === "clear") return fresh(state.device, state.sectors);
    }

    // While playing, queue a fresh batch on a steady beat.
    let sinceBatch = state.sinceBatch + dt;
    if (dt > 0 && sinceBatch >= AUTO_INTERVAL) {
      sinceBatch = 0;
      pending += size;
    }

    if (pending <= 0) return { ...state, pending, sinceBatch };

    const { theory } = distribution(state.device, state.sectors);
    const run = Math.min(pending, dt === 0 ? PAUSED_BURST : MAX_PER_TICK);
    const counts = state.counts.slice();
    let last = state.lastOutcome;
    for (let i = 0; i < run; i++) {
      last = drawOutcome(state.device, state.sectors, ctx.rng);
      counts[last] += 1;
    }
    const total = state.total + run;

    // Sample the convergence trace on a geometric schedule: the interesting
    // part of the law of large numbers happens on a log scale.
    let curve = state.curve;
    let nextSample = state.nextSample;
    if (total >= nextSample) {
      curve = curve.length >= MAX_CURVE ? curve.slice(1) : curve.slice();
      curve.push({ n: total, dev: maxDeviation(counts, theory, total) });
      nextSample = Math.max(total + 1, Math.ceil(total * 1.18));
    }

    return {
      ...state,
      counts, total, curve, nextSample,
      pending: pending - run,
      lastOutcome: last,
      sinceBatch,
    };
  },

  readouts(state) {
    const { labels, theory } = distribution(state.device, state.sectors);
    const total = state.total;
    const out: Readout[] = [
      { key: "trials", label: "Trials", quantity: q(total, "count"), semantic: "time", graphable: true },
    ];
    for (let i = 0; i < labels.length; i++) {
      out.push({
        key: `p${i}`,
        label: `P(${labels[i]}) so far`,
        quantity: q(total > 0 ? state.counts[i] / total : 0, "percent"),
        unit: "%", semantic: "velocity", graphable: i < 6,
      });
    }
    if (labels.length <= 6) {
      for (let i = 0; i < labels.length; i++) {
        out.push({
          key: `t${i}`, label: `Theoretical P(${labels[i]})`,
          quantity: q(theory[i], "percent"), unit: "%", semantic: "field",
          bands: ["9-12"],
        });
      }
    } else {
      // Too many outcomes to list; the peak is the one worth naming.
      let best = 0;
      for (let i = 1; i < theory.length; i++) if (theory[i] > theory[best]) best = i;
      out.push({
        key: "theoPeak", label: `Theoretical P(${labels[best]})`,
        quantity: q(theory[best], "percent"), unit: "%", semantic: "field",
      });
      out.push({
        key: "pPeak", label: `P(${labels[best]}) so far`,
        quantity: q(total > 0 ? state.counts[best] / total : 0, "percent"),
        unit: "%", semantic: "velocity", graphable: true,
      });
    }
    out.push({
      key: "maxDeviation", label: "Biggest gap from theory",
      quantity: q(maxDeviation(state.counts, theory, total), "percent"),
      unit: "%", semantic: "acceleration", graphable: true,
    });
    out.push({
      key: "chiSquare", label: "χ² against theory",
      quantity: q(chiSquare(state.counts, theory, total), "ratio"),
      semantic: "mass", graphable: true, bands: ["9-12"],
    });
    return out;
  },

  facts(state) {
    const { labels, theory } = distribution(state.device, state.sectors);
    const dev = maxDeviation(state.counts, theory, state.total);
    let most = 0;
    for (let i = 1; i < state.counts.length; i++) if (state.counts[i] > state.counts[most]) most = i;
    return {
      device: state.device,
      trials: state.total,
      maxDeviation: dev,
      converged: state.total >= 500 && dev <= 0.01,
      mostCommon: labels[most] ?? "",
      firstCount: state.counts[0] ?? 0,
      peakCount: state.counts[most] ?? 0,
      outcomes: labels.length,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]],
};

function drawDie(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, face: number,
  theme: RenderContext<State>["theme"],
) {
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, size, size, size * 0.18);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  if (face < 1 || face > 6) return;
  for (const [px, py] of PIPS[face]) {
    disc(ctx, x + px * size, y + py * size, size * 0.075, theme.ink);
  }
}

function drawDevice(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  state: State, theme: RenderContext<State>["theme"],
) {
  const { labels } = distribution(state.device, state.sectors);
  const last = state.lastOutcome;

  if (state.device === "coin") {
    disc(ctx, cx, cy, r, theme.surfaceAlt, { stroke: theme.line, lineWidth: 2 });
    if (last >= 0) {
      disc(ctx, cx, cy, r * 0.82, theme.accent, {});
      ctx.save();
      ctx.font = `700 ${Math.round(r)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.surface;
      ctx.fillText(labels[last], cx, cy + 1);
      ctx.restore();
    }
    return;
  }

  if (state.device === "die") {
    drawDie(ctx, cx - r * 0.8, cy - r * 0.8, r * 1.6, last + 1, theme);
    return;
  }

  if (state.device === "dice2") {
    // The sum is what is counted, but the pair is what explains it.
    const s = r * 0.95;
    const sum = last + 2;
    const a = Math.max(1, Math.min(6, Math.ceil(sum / 2)));
    const b = sum - a;
    drawDie(ctx, cx - s - 5, cy - s / 2, s, last >= 0 ? a : 0, theme);
    drawDie(ctx, cx + 5, cy - s / 2, s, last >= 0 && b >= 1 && b <= 6 ? b : 0, theme);
    return;
  }

  // Spinner.
  const n = labels.length;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i === last ? theme.accent : theme.surfaceAlt;
    ctx.fill();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const mid = (a0 + a1) / 2;
    ctx.fillStyle = i === last ? theme.surface : theme.inkSoft;
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[i], cx + Math.cos(mid) * r * 0.66, cy + Math.sin(mid) * r * 0.66);
  }
  // Fixed pointer at the top: the wheel result, not an animated spin.
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 2);
  ctx.lineTo(cx - 7, cy - r - 15);
  ctx.lineTo(cx + 7, cy - r - 15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;
  const { labels, theory } = distribution(state.device, state.sectors);
  const total = state.total;
  const showCurve = overlays.convergence && band !== "3-5";

  const deviceW = Math.min(170, width * 0.24);
  const deviceR = Math.min(deviceW * 0.34, 46);
  drawDevice(ctx, deviceW / 2, 74, deviceR, state, theme);
  label(ctx, total === 0 ? "tap to run" : `${total.toLocaleString()} trials`,
    deviceW / 2, 74 + deviceR + 24, theme, { align: "center", size: 12, color: theme.inkSoft });
  if (state.pending > 0) {
    label(ctx, `${state.pending.toLocaleString()} queued`, deviceW / 2, 74 + deviceR + 42, theme,
      { align: "center", size: 11, color: theme.sci["acceleration"] });
  }

  const left = deviceW + 14;
  const right = width - 16;
  const chartW = Math.max(40, right - left);
  const chartTop = 46;
  const chartBottom = showCurve ? height * 0.62 : height - 34;
  const chartH = Math.max(40, chartBottom - chartTop);

  // Scale so the tallest of experiment and theory fills the panel.
  let peak = 0;
  for (let i = 0; i < theory.length; i++) {
    peak = Math.max(peak, theory[i], total > 0 ? state.counts[i] / total : 0);
  }
  const yMax = Math.max(0.1, peak * 1.18);

  const n = labels.length;
  const slot = chartW / n;
  const barW = Math.min(slot * 0.68, 56);

  // Baseline.
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left, chartBottom);
  ctx.lineTo(right, chartBottom);
  ctx.stroke();
  ctx.restore();

  // Experimental bars.
  for (let i = 0; i < n; i++) {
    const p = total > 0 ? state.counts[i] / total : 0;
    const h = (p / yMax) * chartH;
    const x = left + slot * i + (slot - barW) / 2;
    ctx.save();
    ctx.fillStyle = theme.accent;
    roundRect(ctx, x, chartBottom - h, barW, Math.max(0, h), 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(labels[i], left + slot * i + slot / 2, chartBottom + 5);
    if (band !== "3-5" && total > 0) {
      ctx.fillStyle = theme.ink;
      ctx.textBaseline = "bottom";
      ctx.fillText(`${(p * 100).toFixed(1)}%`, left + slot * i + slot / 2, chartBottom - h - 4);
    }
    ctx.restore();
  }

  // Theoretical overlay: the line the bars are chasing.
  ctx.save();
  ctx.strokeStyle = theme.sci["field"];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const y = chartBottom - (theory[i] / yMax) * chartH;
    const x0 = left + slot * i + (slot - barW) / 2 - 3;
    const x1 = x0 + barW + 6;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i < n - 1; i++) {
    ctx.moveTo(left + slot * i + slot / 2, chartBottom - (theory[i] / yMax) * chartH);
    ctx.lineTo(left + slot * (i + 1) + slot / 2, chartBottom - (theory[i + 1] / yMax) * chartH);
  }
  ctx.stroke();
  ctx.restore();

  label(ctx, "theoretical", right, chartTop - 14, theme, {
    align: "right", size: 11, color: theme.sci["field"],
  });
  label(ctx, "experimental", right - 92, chartTop - 14, theme, {
    align: "right", size: 11, color: theme.accent,
  });

  // Convergence trace: the biggest gap from theory, against trials, log scale.
  if (showCurve && state.curve.length > 1) {
    const cTop = height * 0.68;
    const cBottom = height - 30;
    const cH = cBottom - cTop;
    const maxN = Math.max(10, state.curve[state.curve.length - 1].n);
    const logMax = Math.log10(maxN);
    const devMax = Math.max(0.05, ...state.curve.map((p) => p.dev));
    const px = (nn: number) => left + (Math.log10(Math.max(1, nn)) / Math.max(0.3, logMax)) * chartW;
    const py = (d: number) => cBottom - (d / devMax) * cH;

    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, cBottom);
    ctx.lineTo(right, cBottom);
    ctx.stroke();

    // The 1% target line the challenge asks for.
    if (devMax >= 0.01) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = theme.sci["energy-kinetic"];
      ctx.beginPath();
      ctx.moveTo(left, py(0.01));
      ctx.lineTo(right, py(0.01));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = theme.sci["acceleration"];
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    state.curve.forEach((p, i) => {
      const x = px(p.n);
      const y = py(p.dev);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    label(ctx, "biggest gap shrinks as trials grow", left + 4, cTop - 2, theme, {
      size: 11, color: theme.inkSoft,
    });
    if (devMax >= 0.01) {
      label(ctx, "1%", right, py(0.01), theme, {
        align: "right", size: 10, color: theme.sci["energy-kinetic"],
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const probabilitySim: SimManifest<State> = {
  id: "math.probability",
  title: "Probability Arcade",
  tagline: "Flip, roll and spin thousands of times, and watch chance settle onto the numbers theory predicted.",
  subject: "math",
  bands: ["3-5", "6-8", "9-12"],
  grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: {
    ccssMath: [
      "7.SP.C.5", "7.SP.C.6", "7.SP.C.7", "7.SP.C.8",
      "HSS.MD.A.1", "HSS.MD.A.3", "HSS.IC.A.2",
    ],
  },
  learningGoals: [
    "Predict a theoretical probability by counting equally likely outcomes.",
    "Explain why experimental results match theory more closely as trials increase.",
    "Explain why a sum of 7 is the most likely two-dice result.",
  ],
  misconceptions: [
    "After several heads a tail is 'due'",
    "A small sample should already match the theoretical probability",
    "Every two-dice sum from 2 to 12 is equally likely",
  ],
  interactionHint: "Tap the stage to run a batch, or press play to keep running.",
  params: {
    device: {
      type: "option", label: "Device",
      options: [
        { value: "coin", label: "Coin" },
        { value: "die", label: "One die" },
        { value: "spinner", label: "Spinner" },
        { value: "dice2", label: "Two dice (sum)" },
      ],
      default: "coin",
    },
    batch: {
      type: "option", label: "Trials per run",
      options: [
        { value: "1", label: "1" },
        { value: "100", label: "100" },
        { value: "10000", label: "10,000" },
      ],
      default: "1",
      help: "Big batches are queued and run a few hundred at a time, so nothing stutters.",
    },
    sectors: {
      type: "number", label: "Spinner sectors", kind: "count",
      min: 2, max: 8, step: 1, default: 4,
      help: "Only used by the spinner. Every sector is the same size.",
    },
  },
  overlays: [
    { key: "convergence", label: "Convergence trace", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "experimental-vs-theoretical",
      title: "Does experimental match theoretical?",
      question: "How many flips does it take before the results look like the theory?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["7.SP.C.6"],
      setup: { device: "coin", batch: "1", sectors: 4 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before flipping anything.",
          predict: {
            prompt: "You flip a fair coin 10 times. How many heads will you get?",
            options: ["Exactly 5", "Somewhere from 3 to 7", "Always more than 5", "Exactly 10"],
            correct: 1,
            reveal: "Exactly 5 happens less than a quarter of the time. Ten flips is far too few to look like the theory.",
          },
        },
        {
          id: "ten",
          phase: "measure",
          title: "Flip ten times",
          instruction: "Tap the stage ten times. Record how many heads.",
          check: {
            describe: "At least 10 trials run",
            test: (v) => (v.facts.trials as number) >= 10,
          },
          hints: ["Each tap runs one flip while the batch size is 1."],
        },
        {
          id: "thousand",
          phase: "measure",
          title: "Now do a thousand",
          instruction: "Set trials per run to 100 and press play. Stop past 1000 trials.",
          check: {
            describe: "At least 1000 trials run",
            test: (v) => (v.facts.trials as number) >= 1000,
          },
          hints: ["Watch the biggest-gap readout as the count climbs."],
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Record both gaps",
          instruction: "Record the biggest gap at 10 trials and again past 1000.",
          requireData: 2,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say what changed",
          instruction: "Write what more trials did, and what they did not do.",
          write: {
            prompt: "What happened to the gap as trials grew? Did any single flip become more predictable?",
            placeholder: "With more flips the gap ... but each flip is still ...",
          },
        },
      ],
    },
    {
      id: "why-seven",
      title: "Two dice: why is 7 most common?",
      question: "Every face is equally likely, so why is a sum of 7 not?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["7.SP.C.8"],
      setup: { device: "dice2", batch: "100", sectors: 4 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to a shape",
          instruction: "Two fair dice are added. Predict the shape of the bars before running anything.",
          predict: {
            prompt: "Rolling two dice and adding them, which shape will the bars make?",
            options: ["Flat — all sums equally likely", "A hill peaking at 7", "Rising towards 12", "Two peaks"],
            correct: 1,
            reveal: "A hill peaking at 7. There are six ways to make 7 but only one way to make 2 or 12.",
          },
        },
        {
          id: "run",
          phase: "measure",
          title: "Roll ten thousand times",
          instruction: "Set trials per run to 10,000 and press play until the shape is clear.",
          check: {
            describe: "At least 10,000 rolls",
            test: (v) => (v.facts.trials as number) >= 10000,
          },
        },
        {
          id: "count",
          phase: "analyze",
          title: "Count the ways",
          instruction: "There are 36 pairs. List every pair that adds to 7, then every pair that adds to 2.",
          write: {
            prompt: "How many of the 36 pairs give 7? How many give 2?",
            placeholder: "Sum 7 comes from ... pairs. Sum 2 comes from ... pairs.",
          },
          hints: ["1+6, 2+5, 3+4 — and each one also happens the other way round."],
        },
        {
          id: "check-theory",
          phase: "analyze",
          title: "Compare with the line",
          instruction: "The theoretical bar for 7 is 6/36, about 16.7%. Check your experimental bar against it.",
          check: {
            describe: "Experimental distribution within 2% of theory",
            test: (v) => (v.readouts.maxDeviation as number) <= 0.02,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the hill",
          instruction: "Write why a sum of 7 beats a sum of 2 even though every face is equally likely.",
          write: {
            prompt: "Why is 7 the most likely sum?",
            placeholder: "Each pair is equally likely, but ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "within-one-percent",
      title: "Close the gap",
      brief: "Run until every experimental probability is within 1% of theory.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { device: "die", batch: "100", sectors: 4 },
      goal: {
        describe: "Biggest gap under 1% with at least 500 trials",
        test: (v) => (v.facts.trials as number) >= 500 && (v.facts.maxDeviation as number) <= 0.01,
      },
      stars: {
        two: {
          describe: "Under 0.5% with at least 2000 trials",
          test: (v) => (v.facts.trials as number) >= 2000 && (v.facts.maxDeviation as number) <= 0.005,
        },
        three: {
          describe: "Under 0.2% with at least 20,000 trials",
          test: (v) => (v.facts.trials as number) >= 20000 && (v.facts.maxDeviation as number) <= 0.002,
        },
      },
      hints: [
        "Small batches will get there eventually — big batches get there sooner.",
        "The gap shrinks roughly like one over the square root of the number of trials.",
      ],
    },
    {
      id: "spinner-shape",
      title: "Predict the spinner",
      brief: "Set a spinner with 5 sectors and run until the bars sit on the theoretical line.",
      bands: ["6-8", "9-12"],
      setup: { device: "spinner", sectors: 5, batch: "100" },
      goal: {
        describe: "A 5-sector spinner within 1% of theory",
        test: (v) =>
          v.facts.device === "spinner" && (v.facts.outcomes as number) === 5 &&
          (v.facts.trials as number) >= 1000 && (v.facts.maxDeviation as number) <= 0.01,
      },
      hints: ["Every sector is the same size, so each theoretical probability is 1/5 = 20%."],
    },
  ],
};
