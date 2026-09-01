import type { Readout, RenderContext, SimInput, SimManifest, SimModel } from "./types";
import { q } from "./units";
import {
  facts, initState, overlaysOf, paramsOf,
  type ArchetypeSpec, type ArchetypeState, type Specimen,
} from "./archetype";
import {
  bacterium, bokeh, callout, chloroplast, depthWash, golgi, membrane,
  mitochondrion, nucleus, organelleDot, reticulum, specimenJar, virus,
} from "@ui/labware-bridge";
import {
  barMagnet, battery, beaker, bulb, burner, cart, clampStand, flask, spring, testTube,
} from "@ui/labware";
import { arcGauge, beginLabels, glow, hexA, isDarkTheme, vignette } from "@ui/scene";

/**
 * The archetype renderer.
 *
 * One drawing path, shared by every simulation built from a spec. Because it
 * is written once it can afford to be careful — real specular highlights,
 * contact shadows, callouts on leader lines, a composed layout — and every
 * simulation in the catalogue inherits that care rather than re-deriving it.
 */

const PAD = 28;

/**
 * The living palette.
 *
 * Semantic science tokens carry meaning for physics quantities and are
 * deliberately muted so they never shout over a diagram. Biology needs the
 * opposite: a cell should look alive and inviting, in the brand's violet
 * family, with enough saturation to hold a student's eye. These are the
 * colours specimens are drawn in.
 */
const BIO = {
  cytoplasm: "#8e5bc4",
  nucleus: "#5c2a86",
  mito: "#e0708a",
  er: "#7b6be0",
  golgi: "#4aa3d8",
  chloro: "#3fae62",
  vesicle: "#43b6e8",
  microbe: "#9a4fc9",
} as const;

/**
 * Last rendered canvas size per simulation.
 *
 * Pointer input arrives in CSS pixels, but hit tests are far clearer written
 * against a 0-1 stage. Only the renderer knows the canvas size, so it records
 * it here and the model normalises against it. Keyed by simulation id, since
 * several may be alive at once.
 */
const stageSize = new Map<string, { w: number; h: number }>();

function normalise(specId: string, x: number, y: number) {
  const s = stageSize.get(specId);
  if (!s || !s.w || !s.h) return null;
  return { nx: x / s.w, ny: y / s.h };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

function makeModel(spec: ArchetypeSpec): SimModel<ArchetypeState> {
  return {
    init: () => initState(spec),

    step(state, dt, params, _ctx, inputs) {
      const s = { ...state, t: state.t + dt, flash: Math.max(0, state.flash - dt * 2.2) };
      for (const input of inputs) handleInput(spec, s, input);
      if ((spec.kind === "process" || spec.kind === "trace") && s.playing) {
        const rate = Number(params.rate ?? 0.6);
        s.progress = (s.progress + dt * 0.16 * rate) % 1;
      }
      return s;
    },

    readouts(state, params) {
      const f = facts(spec, state, params);
      const out: Readout[] = [];
      for (const [key, value] of Object.entries(f)) {
        if (typeof value !== "number") continue;
        out.push({
          key, label: readoutLabel(key),
          quantity: q(value, "count"), graphable: true,
        });
      }
      return out;
    },

    facts: (state, params) => facts(spec, state, params),
  };
}

function handleInput(spec: ArchetypeSpec, s: ArchetypeState, input: SimInput) {
  if (input.type !== "pointerdown") return;
  const n = normalise(spec.id, input.x, input.y);
  if (!n) return;
  const { nx, ny } = n;

  if (spec.kind === "sort" && spec.categories && spec.specimens) {
    // The bins run along the bottom; a click lands the current specimen.
    const bin = binAt(spec, nx, ny);
    if (!bin) return;
    const cur = spec.specimens[s.index % spec.specimens.length];
    const right = cur.category === bin;
    s.placed = { ...s.placed, [cur.id]: bin };
    s.attempted++;
    s.lastRight = right;
    s.flash = 1;
    if (right) {
      s.correct++;
      s.streak++;
      s.best = Math.max(s.best, s.streak);
    } else s.streak = 0;
    s.index++;
    return;
  }

  if ((spec.kind === "explore" || spec.kind === "assemble") && spec.specimens?.[0]?.parts) {
    // Nearest labelled part wins the click.
    const parts = spec.specimens[0].parts!;
    let best = "", bestD = Infinity;
    // Part positions are stored relative to the specimen centre, so compare in
    // the same space the renderer places them in.
    for (const p of parts) {
      const d = Math.hypot((0.44 + p.at[0] * 0.3) - nx, (0.5 + p.at[1] * 0.3) - ny);
      if (d < bestD) { bestD = d; best = p.id; }
    }
    if (bestD < 0.22) {
      s.selected = best;
      if (spec.kind === "assemble" && !s.built.includes(best)) s.built = [...s.built, best];
      s.flash = 1;
    }
  }
}

/** Which sorting bin a normalised click falls in, if any. */
function binAt(spec: ArchetypeSpec, x: number, y: number): string | null {
  if (!spec.categories || y < 0.74) return null;
  const n = spec.categories.length;
  const i = Math.floor(x * n);
  return spec.categories[Math.max(0, Math.min(n - 1, i))]?.id ?? null;
}

/* ------------------------------------------------------------------ *
 * Specimen art
 * ------------------------------------------------------------------ */

function drawSpecimen(
  rc: RenderContext<ArchetypeState>, sp: Specimen,
  x: number, y: number, size: number,
) {
  const { ctx, theme, state } = rc;
  const t = state.t;
  const a = sp.art;
  const accent = theme.accent;

  // Contact shadow under the specimen so it sits on the surface.
  ctx.save();
  ctx.globalAlpha = 0.22;
  const sg = ctx.createRadialGradient(x, y + size * 0.86, 0, x, y + size * 0.86, size * 0.72);
  sg.addColorStop(0, "rgba(0,0,0,0.8)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.86, size * 0.72, size * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  switch (a.art) {
    case "cell": {
      membrane(ctx, x, y, size, BIO.cytoplasm, { t, wobble: 0.02, scatter: 0.95 });
      nucleus(ctx, x - size * 0.08, y - size * 0.05, size * 0.34, BIO.nucleus, t);
      for (let i = 0; i < 3; i++) {
        const ang = t * 0.12 + i * 2.1;
        mitochondrion(
          ctx, x + Math.cos(ang) * size * 0.55, y + Math.sin(ang) * size * 0.5,
          size * 0.4, size * 0.18, ang, BIO.mito,
        );
      }
      reticulum(ctx, x + size * 0.34, y + size * 0.3, size * 0.5, size * 0.26,
        BIO.er, { studded: true, angle: -0.25 });
      golgi(ctx, x - size * 0.46, y + size * 0.36, size * 0.34, size * 0.22, BIO.golgi, 0.15);
      if (a.plant) {
        for (let i = 0; i < 4; i++) {
          const ang = -t * 0.1 + i * 1.6;
          chloroplast(ctx, x + Math.cos(ang) * size * 0.62, y + Math.sin(ang) * size * 0.58,
            size * 0.26, size * 0.15, ang, BIO.chloro);
        }
      }
      for (let i = 0; i < 9; i++) {
        const ang = i * 0.79 + t * 0.05;
        const rr = size * (0.3 + 0.55 * ((i * 7) % 10) / 10);
        organelleDot(ctx, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, size * 0.045, BIO.vesicle);
      }
      break;
    }
    case "organelle": {
      const c = BIO.mito;
      if (a.which === "nucleus") nucleus(ctx, x, y, size, BIO.nucleus, t);
      else if (a.which === "mitochondrion") mitochondrion(ctx, x, y, size * 1.9, size * 0.9, 0.18, c);
      else if (a.which === "reticulum") reticulum(ctx, x, y, size * 2, size * 1.1, BIO.er, { studded: true });
      else if (a.which === "chloroplast") chloroplast(ctx, x, y, size * 1.9, size, 0.16, BIO.chloro);
      else if (a.which === "golgi") golgi(ctx, x, y, size * 1.7, size * 1.1, BIO.golgi);
      else organelleDot(ctx, x, y, size * 0.5, BIO.vesicle);
      break;
    }
    case "microbe":
      if (a.which === "virus") virus(ctx, x, y, size * 0.7, BIO.microbe, t);
      else bacterium(ctx, x, y, size * 1.7, size * 0.62, 0.1, BIO.microbe, t);
      break;
    case "glassware": {
      const liq = a.level !== undefined
        ? { level: a.level, color: a.color ?? theme.sci["liquid"] ?? accent,
            bubbles: a.bubbles ?? 0, precipitate: a.precipitate ?? 0, t }
        : undefined;
      const w = size * 1.3, h = size * 1.8;
      if (a.which === "beaker") beaker(ctx, x - w / 2, y - h / 2, w, h, theme, liq);
      else if (a.which === "flask") flask(ctx, x - w / 2, y - h / 2, w, h, theme, liq);
      else testTube(ctx, x - w * 0.28, y - h / 2, w * 0.56, h, theme, liq);
      break;
    }
    case "apparatus": {
      const w = size * 1.5;
      if (a.which === "spring") spring(ctx, x - w / 2, y, x + w / 2, y, 8, size * 0.28, theme.inkSoft);
      else if (a.which === "cart") cart(ctx, x, y + size * 0.8, w, size, theme.accent, t * 3);
      else if (a.which === "stand") clampStand(ctx, x, y + size, size * 1.7, size * 0.8);
      else if (a.which === "bulb") bulb(ctx, x, y, size * 0.62, 0.5 + 0.5 * Math.sin(t * 2), theme);
      else if (a.which === "battery") battery(ctx, x - w * 0.4, y - size * 0.3, w * 0.8, size * 0.6, theme);
      else if (a.which === "magnet") barMagnet(ctx, x, y, w, size * 0.5, 0, theme);
      else burner(ctx, x, y + size * 0.9, size, 0.7, t);
      break;
    }
    case "sphere":
      organelleDot(ctx, x, y, (a.radius ?? 0.5) * size, a.color ?? accent);
      if (a.glow) glow(ctx, x, y, size * (a.glow + 0.6), a.color ?? accent, 0.5);
      break;
    default: {
      // Fallback: a lit disc so a spec is never invisible while being written.
      organelleDot(ctx, x, y, size * 0.5, accent);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function makeRender(spec: ArchetypeSpec) {
  return (rc: RenderContext<ArchetypeState>) => {
    const { ctx, width, height, theme, state, overlays, params, band } = rc;
    const dark = isDarkTheme(theme);
    stageSize.set(spec.id, { w: width, h: height });

    beginLabels(ctx);
    depthWash(ctx, width, height, theme);
    bokeh(ctx, width, height, theme.accent, 7, 11);

    switch (spec.kind) {
      case "sort": renderSort(rc, spec); break;
      case "explore":
      case "assemble": renderExplore(rc, spec); break;
      case "investigate": renderInvestigate(rc, spec); break;
      case "process":
      case "trace": renderProcess(rc, spec); break;
      case "compare": renderCompare(rc, spec); break;
    }

    // A correct or wrong answer flashes the whole stage briefly, so feedback
    // is felt rather than read.
    if (state.flash > 0.01) {
      ctx.save();
      ctx.globalAlpha = state.flash * 0.16;
      ctx.fillStyle = state.lastRight
        ? (theme.sci["energy-kinetic"] ?? "#2f8f57")
        : (theme.sci["force"] ?? "#c9403f");
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    vignette(ctx, width, height, dark ? 0.24 : 0.12);
    void overlays; void params; void band;
  };
}

function renderSort(rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec) {
  const { ctx, width, height, theme, state, overlays } = rc;
  const specimens = spec.specimens ?? [];
  const cats = spec.categories ?? [];
  if (!specimens.length || !cats.length) return;
  const cur = specimens[state.index % specimens.length];

  // The specimen, presented large in a jar so it reads as "under examination".
  const binTop = height * 0.7;
  const jh = Math.min(binTop - PAD * 2.2, height * 0.6);
  const jw = Math.min(width * 0.42, jh * 0.86);
  specimenJar(ctx, width / 2 - jw / 2, PAD * 1.5, jw, jh, theme,
    `SPECIMEN ${(state.index % specimens.length) + 1}`,
    (cx, cy, cw, ch) =>
      drawSpecimen(rc, cur, cx + cw / 2, cy + ch * 0.5, Math.min(cw, ch) * 0.5));

  if (overlays.labels) {
    callout(ctx, width / 2 + jw * 0.34, PAD * 1.5 + jh * 0.42,
      width - PAD, height * 0.26, cur.name, theme, { side: "left" });
  }

  // Bins
  const binH = height * 0.22, binY = height - binH - PAD * 0.7;
  cats.forEach((c, i) => {
    const bw = (width - PAD * 2) / cats.length - 10;
    const bx = PAD + i * ((width - PAD * 2) / cats.length) + 5;
    ctx.save();
    ctx.fillStyle = hexA(theme.accent, 0.1);
    ctx.strokeStyle = hexA(theme.accent, 0.55);
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    roundRect(ctx, bx, binY, bw, binH, 14);
    ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.ink;
    ctx.font = '700 16px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.name, bx + bw / 2, binY + binH * 0.4);
    if (c.hint && overlays.hints) {
      ctx.font = '500 12px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText(c.hint, bx + bw / 2, binY + binH * 0.68);
    }
    ctx.restore();
  });

  // Score
  ctx.save();
  ctx.font = '600 13px ui-monospace, monospace';
  ctx.fillStyle = theme.inkSoft;
  ctx.textAlign = "left";
  ctx.fillText(`${state.correct} / ${state.attempted} correct`, PAD, PAD);
  ctx.fillText(`streak ${state.streak}  ·  best ${state.best}`, PAD, PAD + 18);
  ctx.restore();
}

function renderExplore(rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec) {
  const { ctx, width, height, theme, state, overlays } = rc;
  const sp = spec.specimens?.[0];
  if (!sp) return;
  const cx = width * 0.44, cy = height * 0.5;
  const size = Math.min(width * 0.46, height * 0.78) * 0.5;

  drawSpecimen(rc, sp, cx, cy, size);

  if (overlays.labels && sp.parts) {
    sp.parts.forEach((p, i) => {
      const px = cx + p.at[0] * size * 2;
      const py = cy + p.at[1] * size * 2;
      const right = p.at[0] >= 0;
      const lx = right ? width - PAD : PAD;
      const ly = height * 0.2 + i * ((height * 0.62) / Math.max(1, sp.parts!.length - 1));
      const on = state.selected === p.id;
      callout(ctx, px, py, lx, ly, p.name, theme, {
        side: right ? "left" : "right",
        ...(on ? { sub: p.note } : {}),
        accent: on ? theme.accent : theme.inkSoft,
      });
    });
  }

  if (spec.kind === "assemble") {
    ctx.save();
    ctx.font = '600 13px ui-monospace, monospace';
    ctx.fillStyle = theme.inkSoft;
    ctx.fillText(`built ${state.built.length} / ${sp.parts?.length ?? 0}`, PAD, PAD);
    ctx.restore();
  }
}

function renderInvestigate(rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec) {
  const { ctx, width, height, theme, params, state } = rc;
  const sp = spec.specimens?.[0];
  const half = width * 0.5;

  if (sp) drawSpecimen(rc, sp, half * 0.5, height * 0.5, Math.min(half * 0.8, height * 0.66) * 0.5);

  if (!spec.measure || !spec.plot || !spec.variables) return;
  const v: Record<string, number> = {};
  for (const varr of spec.variables) v[varr.key] = Number(params[varr.key] ?? varr.default);
  const m = spec.measure(v);

  // A live gauge of the headline measurement, beside the apparatus.
  const gy = height * 0.24;
  arcGauge(ctx, half * 0.5, gy, Math.min(half, height) * 0.1,
    clamp01(m[spec.plot.y] / (Math.abs(m[spec.plot.y]) + 40)), theme.accent, theme);

  // The plot: sweep the x variable across its range and draw the true curve.
  const px = half + PAD, py = height * 0.18;
  const pw = width - px - PAD, ph = height * 0.64;
  const xv = spec.variables.find((a) => a.key === spec.plot!.x);
  if (!xv) return;
  const pts: { x: number; y: number }[] = [];
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 60; i++) {
    const xx = xv.min + ((xv.max - xv.min) * i) / 60;
    const yy = spec.measure({ ...v, [xv.key]: xx })[spec.plot.y];
    pts.push({ x: xx, y: yy });
    lo = Math.min(lo, yy); hi = Math.max(hi, yy);
  }
  if (hi - lo < 1e-9) { hi = lo + 1; }

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.7);
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 1);
  ctx.lineWidth = 1;
  ctx.stroke();

  const sx = (x: number) => px + 34 + ((x - xv.min) / (xv.max - xv.min)) * (pw - 48);
  const sy = (y: number) => py + ph - 30 - ((y - lo) / (hi - lo)) * (ph - 48);

  ctx.strokeStyle = hexA(theme.grid, 1);
  for (let i = 0; i <= 4; i++) {
    const yy = py + 18 + ((ph - 48) * i) / 4;
    ctx.beginPath(); ctx.moveTo(px + 34, yy); ctx.lineTo(px + pw - 14, yy); ctx.stroke();
  }

  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Recorded samples sit on the curve as the student collects them.
  for (const s of state.samples) {
    organelleDot(ctx, sx(s.x), sy(s.y), 4, theme.sci["velocity"] ?? theme.accent);
  }
  // The live point.
  organelleDot(ctx, sx(v[xv.key]), sy(m[spec.plot.y]), 6, theme.sci["force"] ?? theme.accent);

  ctx.fillStyle = theme.inkSoft;
  ctx.font = '600 12px "Source Sans 3", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(spec.plot.xLabel, px + pw / 2, py + ph - 8);
  ctx.save();
  ctx.translate(px + 14, py + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(spec.plot.yLabel, 0, 0);
  ctx.restore();
  ctx.restore();
}

function renderProcess(rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec) {
  const { ctx, width, height, theme, state, overlays } = rc;
  const stages = spec.stages ?? [];
  const sp = spec.specimens?.[0];
  if (sp) drawSpecimen(rc, sp, width * 0.5, height * 0.4, Math.min(width * 0.5, height * 0.62) * 0.5);

  if (spec.kind === "trace" && spec.route?.length) {
    // The travelling marker and its path through named places.
    const r = spec.route;
    ctx.save();
    ctx.strokeStyle = hexA(theme.accent, 0.45);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    r.forEach((p, i) => {
      const x = p.at[0] * width, y = p.at[1] * height;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const f = state.progress * (r.length - 1);
    const i0 = Math.floor(f), i1 = Math.min(r.length - 1, i0 + 1), k = f - i0;
    const mx = (r[i0].at[0] + (r[i1].at[0] - r[i0].at[0]) * k) * width;
    const my = (r[i0].at[1] + (r[i1].at[1] - r[i0].at[1]) * k) * height;
    r.forEach((p) => {
      organelleDot(ctx, p.at[0] * width, p.at[1] * height, 7, theme.inkSoft);
    });
    glow(ctx, mx, my, 26, theme.accent, 0.6);
    organelleDot(ctx, mx, my, 10, theme.accent);
    if (overlays.labels) {
      callout(ctx, mx, my, width * 0.82, height * 0.16, r[i1].name, theme,
        { side: "left", sub: r[i1].note });
    }
  }

  // Stage rail along the bottom.
  if (stages.length) {
    const railY = height - 54;
    const x0 = PAD + 10, x1 = width - PAD - 10;
    ctx.save();
    ctx.strokeStyle = hexA(theme.line, 1);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, railY); ctx.lineTo(x1, railY); ctx.stroke();
    ctx.strokeStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(x0, railY);
    ctx.lineTo(x0 + (x1 - x0) * state.progress, railY);
    ctx.stroke();

    stages.forEach((st, i) => {
      const x = x0 + (x1 - x0) * st.at;
      const active = Math.abs(state.progress - st.at) < 0.5 / stages.length;
      organelleDot(ctx, x, railY, active ? 9 : 6, active ? theme.accent : theme.inkSoft);
      ctx.fillStyle = active ? theme.ink : theme.inkSoft;
      ctx.font = `${active ? 700 : 500} 12px "Source Sans 3", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(st.name, x, railY + 24);
      void i;
    });

    const cur = stages.reduce((a, b) =>
      Math.abs(b.at - state.progress) < Math.abs(a.at - state.progress) ? b : a);
    ctx.fillStyle = theme.ink;
    ctx.font = '600 15px "Source Sans 3", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(cur.caption, width / 2, height - 96);
    ctx.restore();
  }
}

function renderCompare(rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec) {
  const { ctx, width, height, theme, params } = rc;
  const sps = spec.specimens ?? [];
  const showB = params.showB !== false && sps.length > 1;
  const cols = showB ? 2 : 1;
  const size = Math.min(width / (cols * 2.1), height * 0.34);

  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 1);
  if (showB) {
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.12);
    ctx.lineTo(width / 2, height * 0.82);
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  for (let i = 0; i < cols; i++) {
    const sp = sps[i];
    if (!sp) continue;
    const cx = width * (cols === 1 ? 0.5 : i === 0 ? 0.27 : 0.73);
    drawSpecimen(rc, sp, cx, height * 0.46, size);
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.font = '700 17px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(sp.name, cx, height * 0.86);
    if (sp.because) {
      ctx.font = '500 13px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText(sp.because, cx, height * 0.9);
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * Factory
 * ------------------------------------------------------------------ */

/** Turn a content spec into a full simulation manifest. */
export function buildSim(spec: ArchetypeSpec): SimManifest<ArchetypeState> {
  return {
    id: spec.id,
    title: spec.title,
    tagline: spec.tagline,
    subject: spec.subject,
    bands: spec.bands,
    grades: spec.grades,
    standards: spec.standards,
    learningGoals: spec.learningGoals,
    ...(spec.misconceptions ? { misconceptions: spec.misconceptions } : {}),
    params: paramsOf(spec),
    overlays: overlaysOf(spec),
    model: makeModel(spec),
    render: makeRender(spec),
    ...(spec.labs ? { labs: spec.labs } : {}),
    ...(spec.challenges ? { challenges: spec.challenges } : {}),
  };
}

/** Turn a fact key into a human label: "bubbleRate" -> "Bubble rate". */
function readoutLabel(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function roundRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clamp01(v: number) { return Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0; }
