import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, mixHex } from "@ui/draw";
import { clampStand } from "@ui/labware";
import { callout, depthWash } from "@ui/organic";
import {
  badge, gradient, gridPaper, hexA, isDarkTheme, metal, plastic, softShadow,
  sphere, vignette,
} from "@ui/scene";

/**
 * Wave Machine — Grades 1-12.
 *
 * A real string, solved as the 1D wave equation y_tt = c²·y_xx - γ·y_t with a
 * driven left end and a choice of far-end boundary. Nothing about the pattern
 * is drawn from a formula: reflections, standing waves and resonance all emerge
 * from the string itself, so the wavelength a student measures is a genuine
 * measurement of the simulation rather than a restatement of its inputs.
 *
 * Confronts the belief that the string travels along with the wave, and that
 * shaking harder makes the wave arrive sooner.
 */

/** String length, m. */
const LENGTH = 10;
/** Number of nodes on the string. Enough for a clean curve, cheap to draw. */
const N = 201;
const DX = LENGTH / (N - 1);

interface State {
  /** Displacement of each node, m. */
  y: number[];
  /** Displacement one step earlier — the wave equation needs both. */
  yPrev: number[];
  /** Decayed running maximum of |y|, the visible envelope. */
  env: number[];
  t: number;
  /** Wavelength measured from the string's own zero crossings, m. */
  lambda: number;
}

/* ------------------------------------------------------------------ *
 * Physics
 * ------------------------------------------------------------------ */

/** Wave speed on a string, c = √(tension / linear density). */
export function waveSpeed(params: ParamValues): number {
  const tension = Math.max(0.01, params.tension as number);
  const density = Math.max(0.01, params.density as number);
  return Math.sqrt(tension / density);
}

function zeroString(): number[] {
  return new Array<number>(N).fill(0);
}

/**
 * Measure the wavelength the way a student would: find where the string
 * crosses the axis and double the average gap between crossings. Works for a
 * travelling wave (crossings every λ/2) and for a standing wave (nodes every
 * λ/2) without knowing which one it is looking at.
 */
function measureWavelength(y: number[], fallback: number): number {
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(y[i]));
  // Too flat to read: keep the previous measurement rather than inventing one.
  if (peak < 1e-4) return fallback;

  let first = -1, last = -1, count = 0;
  for (let i = 1; i < N; i++) {
    if (y[i - 1] === 0 || y[i - 1] * y[i] >= 0) continue;
    const frac = y[i - 1] / (y[i - 1] - y[i]);
    const x = (i - 1 + frac) * DX;
    if (first < 0) first = x;
    last = x;
    count++;
  }
  if (count < 2) return fallback;
  return (2 * (last - first)) / (count - 1);
}

const model: SimModel<State> = {
  init() {
    return { y: zeroString(), yPrev: zeroString(), env: zeroString(), t: 0, lambda: 0 };
  },

  step(state, dt, params) {
    const c = waveSpeed(params);
    const amp = params.amplitude as number;
    const freq = params.frequency as number;
    const gamma = params.damping as number;
    const boundary = params.boundary as string;
    const twoSources = params.twoSources as boolean;

    // Sub-step so the Courant number stays comfortably below 1 at every wave
    // speed the student can dial in. Below 1 the scheme is stable; above it the
    // string explodes.
    const sub = Math.max(1, Math.ceil((c * dt) / (0.6 * DX)));
    const h = dt / sub;
    const C2 = ((c * h) / DX) ** 2;
    const damp = (gamma * h) / 2;

    let cur = state.y;
    let prev = state.yPrev;
    let t = state.t;

    for (let s = 0; s < sub; s++) {
      t += h;
      const next = new Array<number>(N);
      for (let i = 1; i < N - 1; i++) {
        const lap = cur[i + 1] - 2 * cur[i] + cur[i - 1];
        next[i] = (2 * cur[i] - prev[i] * (1 - damp) + C2 * lap) / (1 + damp);
      }
      // Left end: the driver.
      next[0] = amp * Math.sin(2 * Math.PI * freq * t);
      // Right end.
      if (twoSources) {
        next[N - 1] = amp * Math.sin(2 * Math.PI * freq * t);
      } else if (boundary === "fixed") {
        next[N - 1] = 0;
      } else if (boundary === "free") {
        // Zero slope: the end rides up and down freely.
        next[N - 1] = next[N - 2];
      } else {
        // First-order absorbing boundary: the wave leaves and never returns.
        const K = (c * h - DX) / (c * h + DX);
        next[N - 1] = cur[N - 2] + K * (next[N - 2] - cur[N - 1]);
      }
      prev = cur;
      cur = next;
    }

    // Envelope: a running maximum that fades over about one and a half cycles,
    // so it tracks the pattern instead of remembering the whole run.
    const tau = Math.max(1, 1.5 / Math.max(0.05, freq));
    const decay = Math.exp(-dt / tau);
    const env = new Array<number>(N);
    for (let i = 0; i < N; i++) env[i] = Math.max(Math.abs(cur[i]), state.env[i] * decay);

    return { y: cur, yPrev: prev, env, t, lambda: measureWavelength(cur, state.lambda) };
  },

  readouts(state, params) {
    const c = waveSpeed(params);
    const f = params.frequency as number;
    const mid = state.y[Math.floor(N / 2)];
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, state.env[i]);

    return [
      {
        key: "frequency", label: "Frequency", quantity: q(f, "frequency"),
        unit: "Hz", semantic: "wave", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "period", label: "Period", quantity: q(f > 0 ? 1 / f : 0, "time"),
        unit: "s", semantic: "time", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "wavelength", label: "Wavelength", quantity: q(state.lambda, "length"),
        unit: "m", semantic: "wave", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "speed", label: "Wave speed", quantity: q(c, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "fLambda", label: "Frequency × wavelength", quantity: q(f * state.lambda, "velocity"),
        unit: "m/s", semantic: "velocity", graphable: true, bands: ["9-12"],
      },
      {
        key: "biggest", label: "Biggest wiggle", quantity: q(peak, "length"),
        unit: "m", semantic: "wave", graphable: true,
      },
      {
        key: "middle", label: "Height at the middle", quantity: q(mid, "length"),
        unit: "m", semantic: "wave", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const c = waveSpeed(params);
    const f = params.frequency as number;
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, state.env[i]);

    // Antinodes are the humps of the envelope; nodes are the dips between them.
    let antinodes = 0;
    let deepestNode = 1;
    if (peak > 1e-3) {
      for (let i = 1; i < N - 1; i++) {
        if (state.env[i] > state.env[i - 1] && state.env[i] >= state.env[i + 1] && state.env[i] > 0.45 * peak) {
          antinodes++;
        }
      }
      let lastMax = -1;
      for (let i = 1; i < N - 1; i++) {
        if (state.env[i] > state.env[i - 1] && state.env[i] >= state.env[i + 1] && state.env[i] > 0.45 * peak) {
          if (lastMax >= 0) {
            let dip = peak;
            for (let k = lastMax; k <= i; k++) dip = Math.min(dip, state.env[k]);
            deepestNode = Math.min(deepestNode, dip / peak);
          }
          lastMax = i;
        }
      }
    }

    return {
      antinodes,
      // A true standing wave has near-motionless nodes between its antinodes.
      standing: antinodes >= 2 && deepestNode < 0.25 && state.t > 6,
      nodeDepth: deepestNode,
      amplitude: peak,
      speed: c,
      lambdaError: Math.abs(f * state.lambda - c),
      settled: state.t > 6,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const amp = params.amplitude as number;
  const boundary = params.boundary as string;
  const twoSources = params.twoSources as boolean;
  const dark = isDarkTheme(theme);

  // Frame tall enough for whatever the string is actually doing, but no taller:
  // a shake this big should look this big, not sit in a wide empty band.
  let envPeak = 0;
  for (let i = 0; i < N; i++) envPeak = Math.max(envPeak, state.env[i]);
  const yMax = Math.max(0.22, amp * 1.9, envPeak * 1.3);

  /* ---- Stage ---------------------------------------------------------- */
  const padX = Math.max(46, width * 0.07);
  const benchY = height * 0.9;
  const boardT = height * 0.075;
  const boardB = height * 0.775;
  const axisY = (boardT + boardB) / 2;
  const sx = (width - padX * 2) / LENGTH;
  const sy = ((boardB - boardT) / 2) / yMax;
  const X = (x: number) => padX + x * sx;
  const Y = (y: number) => axisY - y * sy;

  /* ---- Room and backdrop board ----------------------------------------- */
  depthWash(ctx, width, height, theme);
  // The measuring board the string is stretched in front of. Its scale is the
  // reason a wavelength can be read straight off the apparatus.
  const bL = padX - 26, bR = width - padX + 26;
  softShadow(ctx, () => {
    plastic(ctx, bL, boardT - 22, bR - bL, boardB - boardT + 44, theme.surfaceAlt,
      { radius: 12, gloss: 0.28 });
  }, { blur: 34, dy: 14, alpha: 0.34 });
  ctx.save();
  ctx.beginPath();
  ctx.rect(bL + 6, boardT - 16, bR - bL - 12, boardB - boardT + 32);
  ctx.clip();
  gridPaper(ctx, width, height, theme, { step: sx * 0.5, major: 2, alpha: dark ? 0.5 : 0.75, originX: padX, originY: axisY });
  ctx.restore();
  // Metre marks along the foot of the board.
  ctx.save();
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let m = 0; m <= LENGTH; m++) {
    const px = X(m);
    ctx.strokeStyle = hexA(theme.ink, m % 2 === 0 ? 0.42 : 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, boardB + 4);
    ctx.lineTo(px, boardB + (m % 2 === 0 ? 13 : 8));
    ctx.stroke();
    if (m % 2 === 0) {
      ctx.fillStyle = hexA(theme.ink, 0.5);
      ctx.fillText(`${m} m`, px, boardB + 15);
    }
  }
  ctx.restore();

  // The bench and the two stands the whole rig is clamped to.
  ctx.save();
  ctx.fillStyle = gradient(ctx, 0, benchY - 6, width, height - benchY + 6, [
    hexA(theme.inkSoft, 0.5), hexA(theme.ink, 0.6),
  ], 90);
  ctx.fillRect(0, benchY - 6, width, height - benchY + 6);
  ctx.restore();
  const standH = benchY - (axisY - (boardB - boardT) * 0.5) + 10;
  clampStand(ctx, padX - 30, benchY, standH, Math.max(26, width * 0.03));
  clampStand(ctx, width - padX + 30, benchY, standH, Math.max(26, width * 0.03));

  /* ---- Rest axis -------------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.3);
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(X(0), axisY);
  ctx.lineTo(X(LENGTH), axisY);
  ctx.stroke();
  ctx.restore();

  /* ---- Envelope --------------------------------------------------------- */
  if (overlays.envelope && band !== "K-2") {
    ctx.save();
    // Filled, so the region the string sweeps reads as a volume of air rather
    // than two stray dotted lines.
    ctx.fillStyle = hexA(theme.sci["wave"], 0.12);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const px = X(i * DX), py = Y(state.env[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(X(i * DX), Y(-state.env[i]));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexA(theme.sci["wave"], 0.45);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const px = X(i * DX), py = Y(sign * state.env[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- The rope --------------------------------------------------------- */
  // A rope has a diameter. Six passes give it a cast shadow on the board, a
  // dark underside, a body, a lit upper shoulder and a travelling specular
  // highlight — the difference between a rope and a plotted line.
  const ropeW = Math.max(11, Math.min(20, height * 0.032));
  const ropePath = (dy: number) => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const px = X(i * DX), py = Y(state.y[i]) + dy;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  };
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Shadow thrown on the board behind
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = ropeW * 0.9;
  ctx.shadowOffsetY = ropeW * 0.8;
  ctx.shadowOffsetX = ropeW * 0.35;
  ctx.strokeStyle = hexA(theme.ink, 0.5);
  ctx.lineWidth = ropeW;
  ropePath(0);
  ctx.stroke();
  ctx.restore();

  const passes: [number, string, number][] = [
    [ropeW, mixHex(theme.sci["wave"], theme.ink, 0.55), ropeW * 0.06],
    [ropeW * 0.86, theme.sci["wave"], 0],
    [ropeW * 0.46, mixHex(theme.sci["wave"], theme.surface, 0.32), -ropeW * 0.2],
    [ropeW * 0.17, hexA(theme.surface, dark ? 0.5 : 0.85), -ropeW * 0.3],
  ];
  for (const [lw, color, dy] of passes) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ropePath(dy);
    ctx.stroke();
  }

  // A specular glint running along the rope at the wave speed: the cue that
  // says "this is a round, taut, moving thing".
  {
    const c = waveSpeed(params);
    const head = ((state.t * c + LENGTH * 0.3) % LENGTH + LENGTH) % LENGTH;
    const span = LENGTH * 0.16;
    ctx.lineWidth = ropeW * 0.2;
    for (let i = 1; i < N; i++) {
      const xm = ((i - 0.5) * DX - head + LENGTH * 1.5) % LENGTH - LENGTH * 0.5;
      const d = Math.abs(xm);
      if (d > span) continue;
      ctx.globalAlpha = Math.cos((d / span) * Math.PI * 0.5) ** 2 * 0.85;
      ctx.strokeStyle = hexA(theme.surface, 1);
      ctx.beginPath();
      ctx.moveTo(X((i - 1) * DX), Y(state.y[i - 1]) - ropeW * 0.3);
      ctx.lineTo(X(i * DX), Y(state.y[i]) - ropeW * 0.3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  /* ---- Marker beads ------------------------------------------------------ */
  // Every twentieth node, each on its own vertical rail, so it is obvious the
  // string only moves up and down while the wave moves sideways.
  if (overlays.beads) {
    const beadR = ropeW * 0.44;
    for (let i = 10; i < N - 1; i += 20) {
      const bx = X(i * DX);
      const e = Math.max(state.env[i], 0.02);
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["momentum"], 0.3);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, Y(e));
      ctx.lineTo(bx, Y(-e));
      ctx.stroke();
      ctx.restore();
      sphere(ctx, bx, Y(state.y[i]), beadR, theme.sci["momentum"]);
    }
  }

  /* ---- Nodes ------------------------------------------------------------- */
  if (overlays.nodes && band !== "K-2") {
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, state.env[i]);
    if (peak > 1e-3) {
      for (let i = 2; i < N - 2; i++) {
        const isMin = state.env[i] <= state.env[i - 1] && state.env[i] < state.env[i + 1];
        if (isMin && state.env[i] < 0.2 * peak) {
          ctx.save();
          ctx.fillStyle = hexA(theme.surface, 0.94);
          ctx.strokeStyle = theme.sci["wave"];
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(X(i * DX), axisY, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ---- Driver ------------------------------------------------------------ */
  const driverW = Math.max(30, width * 0.032);
  {
    const dx = X(0);
    const dy = Y(state.y[0]);
    // A vibration generator on the stand, with a shaft that visibly drives
    // the end of the string up and down.
    softShadow(ctx, () => {
      metal(ctx, dx - driverW * 1.9, dy - driverW * 0.6, driverW * 1.5, driverW * 1.2,
        theme.sci["mass"], { radius: 4, angle: 90 });
    }, { blur: 14, dy: 5, alpha: 0.4 });
    metal(ctx, dx - driverW * 0.55, dy - driverW * 0.16, driverW * 0.62, driverW * 0.32,
      theme.sci["mass"], { radius: 2, angle: 0 });
    sphere(ctx, dx, dy, ropeW * 0.72, theme.sci["force"]);
    // Throw markers showing how far the shaft travels.
    if (band !== "K-2") {
      ctx.save();
      ctx.strokeStyle = hexA(theme.sci["force"], 0.45);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(dx - driverW * 0.9, Y(amp));
      ctx.lineTo(dx + driverW * 0.5, Y(amp));
      ctx.moveTo(dx - driverW * 0.9, Y(-amp));
      ctx.lineTo(dx + driverW * 0.5, Y(-amp));
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---- Far end ----------------------------------------------------------- */
  {
    const ex = X(LENGTH);
    const clampH = Math.max(38, (boardB - boardT) * 0.22);
    if (twoSources) {
      softShadow(ctx, () => {
        metal(ctx, ex + driverW * 0.4, Y(state.y[N - 1]) - driverW * 0.6, driverW * 1.5,
          driverW * 1.2, theme.sci["mass"], { radius: 4, angle: 90 });
      }, { blur: 14, dy: 5, alpha: 0.4 });
      sphere(ctx, ex, Y(state.y[N - 1]), ropeW * 0.72, theme.sci["force"]);
    } else if (boundary === "fixed") {
      // A solid clamp the string is tied to: it cannot move, so the wave flips.
      softShadow(ctx, () => {
        metal(ctx, ex - 4, axisY - clampH, driverW * 0.7, clampH * 2, theme.sci["mass"],
          { radius: 3, angle: 0 });
      }, { blur: 12, dy: 4, alpha: 0.4 });
      ctx.save();
      ctx.strokeStyle = hexA(theme.ink, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let yy = -clampH; yy <= clampH; yy += 10) {
        ctx.moveTo(ex + driverW * 0.7 - 4, axisY + yy);
        ctx.lineTo(ex + driverW * 1.15 - 4, axisY + yy - 10);
      }
      ctx.stroke();
      ctx.restore();
      sphere(ctx, ex, axisY, ropeW * 0.7, theme.sci["mass"]);
    } else if (boundary === "free") {
      // A ring on a frictionless pole: the end is free to move.
      metal(ctx, ex - 5, axisY - clampH, 10, clampH * 2, theme.sci["mass"], { radius: 3, angle: 0 });
      ctx.save();
      ctx.strokeStyle = theme.sci["mass"];
      ctx.fillStyle = hexA(theme.surface, 0.9);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(ex, Y(state.y[N - 1]), ropeW * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // A sand damper: the wave runs in and never comes back.
      ctx.save();
      ctx.fillStyle = hexA(theme.sci["mass"], 0.35);
      ctx.beginPath();
      ctx.moveTo(ex - driverW * 0.7, axisY + clampH);
      ctx.lineTo(ex, axisY - clampH * 0.5);
      ctx.lineTo(ex + driverW * 0.7, axisY + clampH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- Measurement markers ------------------------------------------------ */
  // Wavelength and amplitude are called out on the artwork the way they are
  // marked up on a lab sheet: a bracket on the thing, a pill off to the side.
  if (band !== "K-2") {
    const markCol = theme.sci["distance"];
    if (overlays.ruler && state.lambda > 0.2 && state.lambda < LENGTH * 1.2) {
      const rulerY = Y(yMax * 0.86);
      const x0 = 0.5;
      const x1 = Math.min(LENGTH, x0 + state.lambda);
      ctx.save();
      ctx.strokeStyle = markCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const x of [x0, x1]) {
        ctx.moveTo(X(x), rulerY - 10);
        ctx.lineTo(X(x), rulerY + 10);
      }
      ctx.stroke();
      ctx.restore();
      arrow(ctx, X(x0), rulerY, X(x1), rulerY, markCol, { width: 2, head: 9 });
      arrow(ctx, X(x1), rulerY, X(x0), rulerY, markCol, { width: 2, head: 9 });
      callout(ctx, X((x0 + x1) / 2), rulerY, X((x0 + x1) / 2) + 30, boardT - 6,
        "Wavelength", theme, { sub: `λ = ${state.lambda.toFixed(2)} m`, side: "right", accent: markCol });
    }
    // Amplitude, bracketed at the fattest part of the envelope.
    if (envPeak > 0.01) {
      let bi = 0;
      for (let i = 0; i < N; i++) if (state.env[i] > state.env[bi]) bi = i;
      const ax = X(bi * DX);
      const aCol = theme.sci["momentum"];
      ctx.save();
      ctx.strokeStyle = hexA(aCol, 0.75);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ax - 26, Y(state.env[bi]));
      ctx.lineTo(ax + 26, Y(state.env[bi]));
      ctx.moveTo(ax - 26, axisY);
      ctx.lineTo(ax + 26, axisY);
      ctx.stroke();
      ctx.restore();
      arrow(ctx, ax, axisY, ax, Y(state.env[bi]), aCol, { width: 2, head: 9 });
      arrow(ctx, ax, Y(state.env[bi]), ax, axisY, aCol, { width: 2, head: 9 });
      const side = ax > width * 0.55 ? "left" : "right";
      callout(ctx, ax, (axisY + Y(state.env[bi])) / 2,
        ax + (side === "right" ? 40 : -40), boardB + 4,
        "Amplitude", theme, { sub: `${state.env[bi].toFixed(2)} m`, side, accent: aCol });
    }
    if (!twoSources) {
      callout(ctx, X(LENGTH), axisY + Math.max(38, (boardB - boardT) * 0.22),
        width - padX - 40, boardB + 4,
        boundary === "fixed" ? "Tied down" : boundary === "free" ? "Free to slide" : "Wave escapes",
        theme, {
          sub: boundary === "fixed" ? "reflects flipped" : boundary === "free" ? "reflects upright" : "absorbed",
          side: "left", accent: theme.sci["mass"],
        });
    }
  }

  /* ---- Numbers ------------------------------------------------------------ */
  if (band === "6-8" || band === "9-12") {
    const c = waveSpeed(params);
    const f = params.frequency as number;
    badge(ctx, 16, 24, `v = ${c.toFixed(2)} m/s`, theme, { color: theme.sci["velocity"] });
    badge(ctx, 16, 52, `f = ${f.toFixed(2)} Hz`, theme, { color: theme.sci["wave"] });
    if (band === "9-12") {
      badge(ctx, 16, 80, `f λ = ${(f * state.lambda).toFixed(2)} m/s`, theme, { color: theme.inkSoft });
    }
  }

  vignette(ctx, width, height, 0.18);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const wavesSim: SimManifest<State> = {
  id: "phys.waves",
  title: "Wave Machine",
  tagline: "Shake the string, bounce the wave off the wall, and trap it into standing still.",
  subject: "physics",
  bands: ["K-2", "3-5", "6-8", "9-12"],
  grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["1-PS4-1", "4-PS4-1", "MS-PS4-1", "HS-PS4-1"], ccssMath: ["8.F.B.5", "HSF.TF.B.5"] },
  learningGoals: [
    "Describe a wave with amplitude, wavelength, frequency and speed.",
    "Show that wave speed is set by the string, not by how hard you shake it.",
    "Use v = f × λ, and explain why wavelength shrinks when frequency rises.",
    "Explain how a reflected wave and the wave still arriving make a standing wave.",
  ],
  misconceptions: [
    "The string travels along with the wave",
    "Shaking harder makes the wave travel faster",
    "Frequency and wavelength can be changed independently on the same string",
    "A standing wave is not moving at all",
  ],
  interactionHint: "Press play, then turn the frequency up slowly.",
  params: {
    amplitude: {
      type: "number", label: "How big a shake", kind: "length", unit: "m",
      min: 0.02, max: 0.4, step: 0.01, default: 0.15,
      hideValueBands: ["K-2"],
      help: "How far the driver moves the end of the string.",
    },
    frequency: {
      type: "number", label: "How fast a shake", kind: "frequency", unit: "Hz",
      min: 0.1, max: 3, step: 0.05, default: 0.6,
      hideValueBands: ["K-2"],
      help: "Shakes per second. This sets the wavelength — the speed will not budge.",
    },
    tension: {
      type: "number", label: "String tightness", kind: "force", unit: "N",
      min: 0.4, max: 25.6, step: 0.2, default: 6.4,
      bands: ["3-5", "6-8", "9-12"],
      hideValueBands: ["3-5"],
      marks: [
        { value: 1.6, label: "2 m/s" },
        { value: 6.4, label: "4 m/s" },
        { value: 14.4, label: "6 m/s" },
      ],
      help: "Tighter string, faster wave: v = √(tension ÷ mass per metre).",
    },
    density: {
      type: "number", label: "Mass per metre", kind: "ratio",
      min: 0.1, max: 1.6, step: 0.05, default: 0.4,
      bands: ["9-12"],
      help: "Heavier string, slower wave. Measured in kg per metre.",
    },
    damping: {
      type: "number", label: "Energy loss", kind: "ratio",
      min: 0.05, max: 1.5, step: 0.05, default: 0.2,
      bands: ["6-8", "9-12"],
      help: "Turn this down to let a standing wave build up strongly.",
    },
    boundary: {
      type: "option", label: "Far end",
      options: [
        { value: "fixed", label: "Tied down" },
        { value: "free", label: "Free to slide" },
        { value: "open", label: "Wave escapes" },
      ],
      default: "fixed",
      bands: ["3-5", "6-8", "9-12"],
      help: "A tied end flips the wave over as it bounces. A free end does not.",
    },
    twoSources: {
      type: "boolean", label: "Shake both ends", default: false,
      bands: ["6-8", "9-12"],
      help: "Two drivers, one string. Watch the two waves add together.",
    },
  },
  overlays: [
    { key: "beads", label: "Marker beads", default: true },
    { key: "envelope", label: "Envelope", default: true, bands: ["6-8", "9-12"] },
    { key: "nodes", label: "Mark the nodes", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "ruler", label: "Wavelength ruler", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "wave-speed-rule",
      title: "Find the wave speed rule",
      question: "What actually decides how fast a wave runs down the string?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS4-1", "HS-PS4-1"],
      setup: {
        amplitude: 0.15, frequency: 0.4, tension: 6.4, density: 0.4,
        damping: 0.4, boundary: "open", twoSources: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict before you shake",
          instruction: "The far end is open, so waves leave and never bounce back.",
          predict: {
            prompt: "You shake the string twice as fast. The wave will travel down the string...",
            options: ["twice as fast", "at the same speed", "half as fast"],
            correct: 1,
            reveal: "Same speed. The string decides the speed; your hand only decides the wavelength. Doubling the frequency halves the wavelength instead.",
          },
        },
        {
          id: "freq",
          phase: "measure",
          title: "Change the frequency",
          instruction: "Record the wavelength at 0.3, 0.6, 0.9 and 1.2 Hz.",
          requireData: 4,
          hints: [
            "Read the wavelength off the ruler above the string.",
            "Multiply frequency by wavelength for each row. What do you notice?",
          ],
        },
        {
          id: "tension",
          phase: "measure",
          title: "Now tighten the string",
          instruction: "Keep the frequency fixed. Raise the tightness and record twice more.",
          requireData: 6,
          check: {
            describe: "String tightness is above 14 N",
            test: (v) => (v.params.tension as number) > 14,
          },
          hints: ["Tightening the string is the only thing here that changes the speed."],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Multiply them out",
          instruction: "Work out frequency × wavelength for every row you recorded.",
          write: {
            prompt: "What does frequency × wavelength equal in each row, and what does it match?",
            placeholder: "For every row f × λ came out as ... which is the same as ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write the rule and say what sets the speed.",
          write: {
            prompt: "Write the relationship between speed, frequency and wavelength, and say what controls each.",
            placeholder: "v = ... The string controls ... and my hand controls ...",
          },
        },
      ],
    },
    {
      id: "standing-wave",
      title: "Make a standing wave",
      question: "How can a wave that is moving look like it is standing still?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS4-1", "HS-PS4-1"],
      setup: {
        amplitude: 0.08, frequency: 0.2, tension: 6.4, density: 0.4,
        damping: 0.2, boundary: "fixed", twoSources: false,
      },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the pattern",
          instruction: "The far end is tied down, so every wave bounces back.",
          predict: {
            prompt: "At certain special frequencies the string will...",
            options: [
              "go completely flat",
              "form a pattern with points that never move",
              "shake the same at every frequency",
            ],
            correct: 1,
            reveal: "At a resonance the outgoing and reflected waves line up. Where they always cancel you get a node that never moves; halfway between you get an antinode swinging hard.",
          },
        },
        {
          id: "hunt",
          phase: "measure",
          title: "Hunt for a resonance",
          instruction: "Creep the frequency up from 0.1 Hz. Record when the string goes wild.",
          requireData: 3,
          hints: [
            "Turn the energy loss down so the pattern has time to build.",
            "Resonances on this 10 m string sit at 0.2, 0.4, 0.6, 0.8 Hz when the speed is 4 m/s.",
            "Count the humps. Each resonance adds one.",
          ],
        },
        {
          id: "count",
          phase: "analyze",
          title: "Count nodes and humps",
          instruction: "At your strongest resonance, count the still points and the humps.",
          check: {
            describe: "A standing wave with at least two humps is on the string",
            test: (v) => Boolean(v.facts.standing) && (v.facts.antinodes as number) >= 2,
          },
        },
        {
          id: "half",
          phase: "analyze",
          title: "Compare with the wavelength",
          instruction: "Measure the gap between two neighbouring still points.",
          write: {
            prompt: "How does the gap between two nodes compare with the wavelength?",
            placeholder: "The nodes are ... apart, which is ... of a wavelength.",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the still points",
          instruction: "Why does part of the string never move?",
          write: {
            prompt: "Explain what happens at a node, using both waves.",
            placeholder: "At a node the wave going right and the wave coming back always ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "three-antinodes",
      title: "Three humps exactly",
      brief: "Set up a standing wave with exactly three humps on the string.",
      bands: ["6-8", "9-12"],
      setup: {
        amplitude: 0.08, frequency: 0.25, tension: 6.4, density: 0.4,
        damping: 0.2, boundary: "fixed", twoSources: false,
      },
      goal: {
        describe: "A standing wave with exactly 3 antinodes",
        test: (v) => Boolean(v.facts.standing) && (v.facts.antinodes as number) === 3,
      },
      stars: {
        two: {
          describe: "Three humps with very deep nodes",
          test: (v) =>
            Boolean(v.facts.standing) &&
            (v.facts.antinodes as number) === 3 &&
            (v.facts.nodeDepth as number) < 0.12,
        },
        three: {
          describe: "Three humps, deep nodes, swinging past 0.25 m",
          test: (v) =>
            Boolean(v.facts.standing) &&
            (v.facts.antinodes as number) === 3 &&
            (v.facts.nodeDepth as number) < 0.12 &&
            (v.facts.amplitude as number) > 0.25,
        },
      },
      hints: [
        "Three humps means three half-wavelengths fit in the 10 m string.",
        "So the wavelength you need is 10 ÷ 1.5, about 6.7 m.",
        "Frequency = speed ÷ wavelength. At 4 m/s that is 0.6 Hz.",
        "Lower the energy loss to let the humps grow tall.",
      ],
    },
    {
      id: "double-speed",
      title: "Double the speed",
      brief: "Make the wave travel at 8 m/s without touching the frequency.",
      bands: ["9-12"],
      setup: {
        amplitude: 0.12, frequency: 0.5, tension: 6.4, density: 0.4,
        damping: 0.4, boundary: "open", twoSources: false,
      },
      goal: {
        describe: "Wave speed within 0.2 m/s of 8 m/s",
        test: (v) => Math.abs((v.facts.speed as number) - 8) <= 0.2,
      },
      stars: {
        two: {
          describe: "Within 0.05 m/s of 8 m/s",
          test: (v) => Math.abs((v.facts.speed as number) - 8) <= 0.05,
        },
        three: {
          describe: "8 m/s using a string of at least 0.3 kg per metre",
          test: (v) =>
            Math.abs((v.facts.speed as number) - 8) <= 0.05 && (v.params.density as number) >= 0.3,
        },
      },
      hints: [
        "Speed is √(tension ÷ mass per metre).",
        "To double the speed you need four times the tension.",
      ],
    },
  ],
};
