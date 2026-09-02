import type { Readout, RenderContext, SimInput, SimManifest, SimModel, ThemeColors } from "./types";
import { q } from "./units";
import {
  facts, initState, overlaysOf, paramsOf,
  type ArchetypeSpec, type ArchetypeState, type Art, type DriveResult, type Specimen,
} from "./archetype";
import {
  bacterium, bokeh, callout, chloroplast, golgi, membrane,
  mitochondrion, nucleus, organelleDot, reticulum, specimenJar, virus,
} from "@ui/labware-bridge";
import {
  barMagnet, battery, beaker, bulb, burner, cart, clampStand, flask, spring, testTube,
} from "@ui/labware";
import { arcGauge, beginLabels, glow, hexA, isDarkTheme, vignette } from "@ui/scene";
import { guarded } from "@ui/ctxGuard";
import { planet } from "@ui/space";
import { boneOrJoint, humanFigure, neuron, organ, vessel } from "@ui/anatomy";
import type { JointKind, OrganKind, VesselKind } from "@ui/anatomy";
import { creature, habitat, plant } from "@ui/fauna";
import type { CreatureKind, HabitatKind, PlantKind } from "@ui/fauna";
import {
  plateSection, quakeWaves, rockSample, seafloorStripes, strataColumn, terrain, volcano,
} from "@ui/geo";
import type { PlateBoundary } from "@ui/geo";

/**
 * A default sedimentary sequence, for a `landform` specimen that asks for
 * strata without naming the beds. Youngest at the top, as in the field.
 */
const DEFAULT_STRATA = [
  { name: "Sandstone", color: "#d9b06a", thicknessFrac: 1.1, fossils: 2 },
  { name: "Shale", color: "#6b6f7d", thicknessFrac: 0.8, fossils: 3 },
  { name: "Limestone", color: "#cfc6b0", thicknessFrac: 1.0, fossils: 4 },
  { name: "Conglomerate", color: "#9c7a5c", thicknessFrac: 0.7 },
  { name: "Basalt", color: "#3b3a44", thicknessFrac: 1.2 },
];

/** A ridge-and-valley profile, for a `landform` specimen that just says land. */
const RIDGE_PROFILE = [0.28, 0.42, 0.66, 0.55, 0.78, 0.62, 0.4, 0.5, 0.34];
import { can3D, draw3D, moleculeGeometry } from "@ui/render3d";
import type { Subject3D } from "@ui/render3d";

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

/* ------------------------------------------------------------------ *
 * The 3D pass
 *
 * Specimens that have real geometry behind them are drawn as geometry: lit,
 * shaded, occluding themselves, turning slowly so a student can see they are
 * solid. Everything else — apparatus, landforms, bodies — stays on the 2D kit,
 * which for those subjects is already the better drawing.
 *
 * The stage is composited in two passes. The first lays out the scene and
 * registers where each 3D specimen goes; the WebGL layer is then blitted over
 * it; the second pass redraws the frame's flat furniture — bins, trays,
 * captions, leaders, readouts — on top, so text stays crisp and never ends up
 * buried under a specimen.
 * ------------------------------------------------------------------ */

/**
 * The studio sweep the whole catalogue stands on.
 *
 * A flat fill is paper, and a subject on paper is a diagram. A sweep — a
 * seamless backdrop curving down into a floor, lit from one side — is what a
 * photographer puts behind a product, and it is the cheapest thing that makes
 * a rendered subject look photographed. The horizon sits below the middle so
 * the subject has room above it, the light pool is centred on where the
 * subject will be, and the floor keeps a sheen so a contact shadow has
 * something to fall on.
 *
 * It stays light in the light theme on purpose: captions, leaders and readouts
 * are drawn in dark ink over the top of it, and a dramatic dark backdrop would
 * cost more in legibility than it gains in atmosphere.
 */
function studioSweep(
  ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors,
) {
  const dark = isDarkTheme(theme);
  const horizon = h * 0.62;
  ctx.save();

  const wall = ctx.createLinearGradient(0, 0, 0, h);
  if (dark) {
    wall.addColorStop(0, "#120c1c");
    wall.addColorStop(0.34, "#231633");
    wall.addColorStop(0.62, "#2b1c3e");
    wall.addColorStop(0.66, "#1d1329");
    wall.addColorStop(1, "#0c0813");
  } else {
    wall.addColorStop(0, "#e4d7f4");
    wall.addColorStop(0.3, "#f4ecfd");
    wall.addColorStop(0.6, "#fdfbff");
    wall.addColorStop(0.66, "#f3ebfa");
    wall.addColorStop(1, "#e0d2f0");
  }
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  // The pool of key light, centred where the subject will stand.
  const pool = ctx.createRadialGradient(
    w * 0.46, h * 0.4, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.62,
  );
  pool.addColorStop(0, hexA("#ffffff", dark ? 0.14 : 0.9));
  pool.addColorStop(0.45, hexA("#ffffff", dark ? 0.05 : 0.34));
  pool.addColorStop(1, hexA("#ffffff", 0));
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, w, h);

  // Where the backdrop meets the floor: a soft crease, never a hard line.
  const crease = ctx.createLinearGradient(0, horizon - h * 0.06, 0, horizon + h * 0.09);
  crease.addColorStop(0, hexA(theme.accent, 0));
  crease.addColorStop(0.45, hexA(theme.accent, dark ? 0.16 : 0.07));
  crease.addColorStop(1, hexA(theme.accent, 0));
  ctx.fillStyle = crease;
  ctx.fillRect(0, horizon - h * 0.06, w, h * 0.15);

  // Floor sheen: a wide, shallow reflection of the light pool, so a contact
  // shadow lands on a surface rather than on nothing.
  const sheen = ctx.createRadialGradient(
    w * 0.5, horizon + h * 0.2, 0, w * 0.5, horizon + h * 0.2, w * 0.55,
  );
  sheen.addColorStop(0, hexA("#ffffff", dark ? 0.07 : 0.5));
  sheen.addColorStop(1, hexA("#ffffff", 0));
  ctx.save();
  ctx.translate(0, horizon + h * 0.2);
  ctx.scale(1, 0.34);
  ctx.translate(0, -(horizon + h * 0.2));
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h * 2);
  ctx.restore();

  ctx.restore();
}

/** True while the current frame has a 3D layer available. */
let use3D = false;
/** Counts specimens within a frame so they do not all turn in lockstep. */
let placed3D = 0;

/** Gather the live values and ask the spec what the apparatus should look like. */
function driveOf(
  rc: RenderContext<ArchetypeState>, spec: ArchetypeSpec, sp: Specimen, index: number,
) {
  const v: Record<string, number> = {};
  for (const varr of spec.variables ?? []) {
    v[varr.key] = Number(rc.params[varr.key] ?? varr.default);
  }
  const f: Record<string, number> = {};
  if (spec.measure && spec.variables) {
    for (const [k, val] of Object.entries(spec.measure(v))) {
      if (Number.isFinite(val)) f[k] = val;
    }
  }
  try {
    return spec.drive?.({ v, f, t: rc.state.t, specimen: sp, index });
  } catch {
    return undefined;   // A bad `drive` must not stop the stage drawing.
  }
}

/** Fold the driven overrides into the art description for this frame. */
function applyDrive(art: Art, d: DriveResult): Art {
  switch (art.art) {
    case "glassware":
      return {
        ...art,
        level: d.level ?? art.level,
        color: d.color ?? art.color,
        bubbles: d.bubbles ?? art.bubbles,
        precipitate: d.precipitate ?? art.precipitate,
      };
    case "sphere":
      return { ...art, color: d.color ?? art.color, glow: d.glow ?? art.glow };
    case "planet":
      return { ...art, color: d.color ?? art.color };
    default:
      return art;
  }
}

/** Map a piece of `Art` onto a 3D subject, or null to keep the 2D drawing. */
function subject3DFor(a: Art, theme: { accent: string }): Subject3D | null {
  switch (a.art) {
    case "cell": return { kind: "cell", plant: a.plant };
    case "organelle": return { kind: "organelle", which: a.which };
    case "microbe": return { kind: "microbe", which: a.which };
    case "glassware":
      return {
        kind: "glassware", which: a.which, level: a.level, color: a.color,
        // The 2D kit reads a fraction as an intensity; the 3D builder wants a
        // count, so the same spec means the same thing in both.
        bubbles: a.bubbles === undefined ? 0 : a.bubbles <= 1 ? a.bubbles * 26 : a.bubbles,
      };
    case "sphere": return { kind: "sphere", color: a.color ?? theme.accent };
    case "molecule": return { kind: "molecule", formula: a.formula };
    case "atom": return { kind: "atom", protons: a.protons, neutrons: a.neutrons, electrons: a.electrons };
    case "dna": return { kind: "dna" };
    case "planet": return { kind: "planet", color: a.color, rings: a.rings, atmosphere: a.atmosphere };
    case "apparatus": return { kind: "apparatus", which: a.which };
    default: return null;
  }
}

function drawSpecimen(
  rc: RenderContext<ArchetypeState>, sp: Specimen,
  x0: number, y0: number, size0: number, spec?: ArchetypeSpec, index = 0,
) {
  const { ctx, theme, state } = rc;
  const t = state.t;
  const accent = theme.accent;

  // Ask the specification how the picture should answer the controls. Without
  // this the apparatus is a photograph standing next to a calculator: the
  // sliders move, the readouts change, and the thing on the bench does not.
  const d = spec?.drive ? driveOf(rc, spec, sp, index) : undefined;
  const a = d ? applyDrive(sp.art, d) : sp.art;
  const size = size0 * (d?.scale ?? 1);
  const x = x0 + (d?.offset ? d.offset[0] * size0 : 0);
  const y = y0 + (d?.offset ? d.offset[1] * size0 : 0);

  // Does this specimen have real geometry behind it? Cells, organelles,
  // microbes, glassware and spheres do. Apparatus, landforms and bodies stay
  // on the 2D kit, which for those subjects is the better drawing.
  const sub3d = use3D ? subject3DFor(a, theme) : null;

  if (sub3d) {
    // The specimen well.
    //
    // A saturated subject on a pale ground looks bleached — the eye judges
    // colour against what surrounds it, and pale lavender surrounds everything
    // here. Photographers solve this with a sweep: the subject sits in its own
    // pool of deeper tone and its colour and rim light immediately read as
    // vivid. The pool is local to the subject, so captions and leaders outside
    // it keep the light ground they need to stay legible.
    ctx.save();
    const wr = size * 1.4;
    const deep = theme.sci["cell"] ?? theme.accent;
    const well = ctx.createRadialGradient(x, y + size * 0.1, size * 0.2, x, y + size * 0.1, wr);
    well.addColorStop(0, hexA(deep, isDarkTheme(theme) ? 0.32 : 0.2));
    well.addColorStop(0.55, hexA(deep, isDarkTheme(theme) ? 0.18 : 0.09));
    well.addColorStop(1, hexA(deep, 0));
    ctx.fillStyle = well;
    ctx.beginPath();
    ctx.arc(x, y + size * 0.1, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Contact shadow. A shadow wider than its subject and evenly grey reads as a
  // smudge and makes the subject look pasted on; a real one is tight, darkest
  // directly beneath, and carries the colour of the surface it falls on.
  const sy = y + size * (sub3d ? 1.0 : 0.86);
  const sw = size * (sub3d ? 0.46 : 0.72);
  const shadowInk = sub3d ? (theme.sci["cell"] ?? theme.ink) : theme.inkSoft;
  ctx.save();
  ctx.globalAlpha = sub3d ? 0.4 : 0.22;
  const sg = ctx.createRadialGradient(x, sy, 0, x, sy, sw);
  sg.addColorStop(0, hexA(shadowInk, 0.9));
  sg.addColorStop(0.4, hexA(shadowInk, 0.34));
  sg.addColorStop(1, hexA(shadowInk, 0));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(x, sy, sw, sw * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (sub3d) {
    // Each specimen turns at its own phase, so a tray of eight reads as eight
    // separate objects rather than one object stamped eight times.
    const phase = placed3D++ * 1.7;
    const drawn = draw3D(ctx, sub3d, x, y, size * 2.4, t, theme, {
      themeKey: isDarkTheme(theme) ? "dark" : "light",
      reflect: true,
      // A standing three-quarter yaw, so a subject is never caught exactly
      // face-on, where a box looks like a rectangle and a cart looks flat.
      spin: d?.spin ?? (0.68 + t * (d?.rate ?? 1) * 0.22 + phase),
      // Tipped so the eye is a little above the subject, the angle a specimen
      // is naturally held at for examination.
      tilt: d?.tilt ?? (0.24 + Math.sin(t * 0.21 + phase) * 0.06),
    });
    // If the 3D draw failed for any reason, fall through to the 2D artwork
    // rather than leaving an empty stage.
    if (drawn) return;
  }

  // Every art routine runs inside the guard: one unbalanced `save()` in one of
  // them would otherwise leave a clip behind and blank everything drawn after
  // it, with the symptom appearing nowhere near the cause.
  guarded(ctx, `art:${a.art}`, () => {
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
    case "molecule": {
      // Ball and stick, at the real bond angles. A molecule drawn with the
      // wrong shape teaches the wrong chemistry: water is bent at 104.5° and
      // that bend is the reason water does almost everything it does.
      const g = moleculeGeometry(a.formula);
      const CPK: Record<string, { c: string; r: number }> = {
        H: { c: "#f2f2f6", r: 0.28 }, C: { c: "#4a4a58", r: 0.42 },
        N: { c: "#4a63f0", r: 0.4 }, O: { c: "#e0483f", r: 0.38 },
        S: { c: "#e6c53c", r: 0.5 }, P: { c: "#ff8f2e", r: 0.5 },
        Na: { c: "#ab5cf2", r: 0.6 }, Cl: { c: "#4fd04f", r: 0.5 },
      };
      const k = size * 0.62;
      const rot = t * 0.4;
      const at = (i: number) => {
        const [px, py, pz] = g.atoms[i].pos;
        const cx = px * Math.cos(rot) + pz * Math.sin(rot);
        return { x: x + cx * k, y: y - py * k, z: -px * Math.sin(rot) + pz * Math.cos(rot) };
      };
      for (const [i, j] of g.bonds) {
        const p = at(i), q2 = at(j);
        ctx.strokeStyle = hexA(theme.inkSoft, 0.75);
        ctx.lineWidth = size * 0.13;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
        ctx.strokeStyle = hexA("#ffffff", 0.4);
        ctx.lineWidth = size * 0.05;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      }
      // Painter's algorithm: far atoms first, so the front ones overlap them.
      const order = g.atoms.map((_, i) => i).sort((p, q2) => at(p).z - at(q2).z);
      for (const i of order) {
        const spec = CPK[g.atoms[i].el] ?? { c: accent, r: 0.4 };
        const pos = at(i);
        organelleDot(ctx, pos.x, pos.y, spec.r * k * 0.62, spec.c);
      }
      break;
    }
    case "atom": {
      // Shell model: a packed nucleus with electrons running real orbits.
      const shells = [2, 8, 8, 18];
      let left = a.electrons;
      const nucR = size * 0.3;
      for (let i = 0; i < 12 && i < a.protons + a.neutrons; i++) {
        const ang = i * 2.399, rr = nucR * 0.5 * Math.sqrt(i / 4);
        organelleDot(
          ctx, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, nucR * 0.34,
          i < a.protons ? "#e0455a" : "#8a92a8",
        );
      }
      for (let sIdx = 0; sIdx < shells.length && left > 0; sIdx++) {
        const n = Math.min(left, shells[sIdx]);
        left -= n;
        const rr = size * (0.55 + sIdx * 0.28);
        ctx.strokeStyle = hexA(theme.inkSoft, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * 0.42, sIdx * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        for (let e = 0; e < n; e++) {
          const ang = t * (1.4 - sIdx * 0.25) + (e / n) * Math.PI * 2;
          const ex = Math.cos(ang) * rr, ey = Math.sin(ang) * rr * 0.42;
          const ca = Math.cos(sIdx * 0.7), sa = Math.sin(sIdx * 0.7);
          organelleDot(ctx, x + ex * ca - ey * sa, y + ex * sa + ey * ca, size * 0.07, "#5fd8ff");
        }
      }
      break;
    }
    case "dna": {
      // Two antiparallel strands with base pairs between them.
      const h = size * 1.9, w = size * 0.55;
      for (let i = 0; i <= 40; i++) {
        const p = i / 40;
        const ang = p * Math.PI * 6 + t * 0.7;
        const ax = x + Math.cos(ang) * w, bx = x - Math.cos(ang) * w;
        const yy = y - h / 2 + p * h;
        if (i % 3 === 0) {
          ctx.strokeStyle = hexA(i % 6 === 0 ? "#4aa3d8" : "#e0708a", 0.85);
          ctx.lineWidth = size * 0.055;
          ctx.beginPath(); ctx.moveTo(ax, yy); ctx.lineTo(bx, yy); ctx.stroke();
        }
        organelleDot(ctx, ax, yy, size * 0.055, Math.sin(ang) > 0 ? "#c98bff" : "#7b4bb0");
        organelleDot(ctx, bx, yy, size * 0.055, Math.sin(ang) > 0 ? "#7b4bb0" : "#c98bff");
      }
      break;
    }
    case "planet":
      planet(ctx, x, y, size * 0.85, a.color, t * 0.2, { t });
      break;
    case "body": {
      // Body parts come from the anatomy kit, which draws real proportions and
      // real structure. A student meeting a heart should meet a heart.
      const w = a.which;
      const beat = 0.5 + 0.5 * Math.sin(t * 2.2);
      if (w === "figure" || w === "body") {
        humanFigure(ctx, x, y - size, size * 2.2, theme);
      } else if (w === "neuron") {
        neuron(ctx, x, y, size * 1.8, theme, { signal: (t * 0.4) % 1, target: true });
      } else if (w === "artery" || w === "vein" || w === "capillary" || w === "vessel") {
        vessel(
          ctx,
          [{ x: x - size * 1.2, y }, { x: x - size * 0.4, y: y - size * 0.2 },
           { x: x + size * 0.4, y: y + size * 0.18 }, { x: x + size * 1.2, y }],
          size * 0.34, (w === "vessel" ? "artery" : w) as VesselKind, theme,
          { flow: (t * 0.35) % 1, branches: 2, cells: 7 },
        );
      } else if (w === "elbow" || w === "knee" || w === "spine" || w === "bone" || w === "joint") {
        boneOrJoint(ctx, x, y, size * 1.7,
          (w === "bone" || w === "joint" ? "elbow" : w) as JointKind, theme);
      } else {
        organ(ctx, x, y, size * 1.5, w as OrganKind, theme, { pulse: beat });
      }
      break;
    }
    case "landform": {
      const w = a.which;
      const half = size * 1.25;
      if (w === "volcano") {
        volcano(ctx, x, y + size * 0.9, half * 2, size * 1.7, 0.6, t, theme);
      } else if (w === "strata" || w === "layers" || w === "column") {
        strataColumn(ctx, x - half, y - size, half * 2, size * 2, DEFAULT_STRATA, { seed: 17 });
      } else if (w === "divergent" || w === "convergent-oc" || w === "convergent-cc" || w === "transform") {
        plateSection(ctx, x - half, y - size * 0.8, half * 2, size * 1.6, w as PlateBoundary, t, theme);
      } else if (w === "plates" || w === "subduction") {
        plateSection(ctx, x - half, y - size * 0.8, half * 2, size * 1.6, "convergent-oc", t, theme);
      } else if (w === "rift") {
        plateSection(ctx, x - half, y - size * 0.8, half * 2, size * 1.6, "divergent", t, theme);
      } else if (w === "seafloor") {
        seafloorStripes(ctx, x - half, y - size * 0.6, half * 2, size * 1.2, t, theme);
      } else if (w === "quake" || w === "waves") {
        quakeWaves(ctx, x, y, size * 1.3, t, theme);
      } else if (w === "igneous" || w === "sedimentary" || w === "metamorphic") {
        rockSample(ctx, x, y, size * 0.95, w, theme);
      } else {
        terrain(ctx, x - half, y - size * 0.7, half * 2, size * 1.4, RIDGE_PROFILE, { theme, seed: 5 });
      }
      break;
    }
    case "creature":
      creature(ctx, x, y, size * 1.5, a.which as CreatureKind, a.facing ?? 1, theme,
        { motion: (t * 0.6) % 1 });
      break;
    case "flora":
      plant(ctx, x, y + size * 0.7, size * 1.7, a.which as PlantKind, theme,
        { health: 1, sway: (t * 0.25) % 1 });
      break;
    case "habitat":
      habitat(ctx, x - size * 1.4, y - size, size * 2.8, size * 2, a.which as HabitatKind, theme, t);
      break;
    default: {
      // Fallback: a lit disc so a spec is never invisible while being written.
      organelleDot(ctx, x, y, size * 0.5, accent);
    }
  }
  });
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function makeRender(spec: ArchetypeSpec) {
  return (rc: RenderContext<ArchetypeState>) => {
    const { ctx, width, height, theme, state, overlays, params, band } = rc;
    const dark = isDarkTheme(theme);
    stageSize.set(spec.id, { w: width, h: height });

    studioSweep(ctx, width, height, theme);
    bokeh(ctx, width, height, theme.accent, 7, 11);

    // 3D is on when the browser has WebGL at all. `draw3D` composites each
    // subject at the point the 2D drawing would have happened, so the layering
    // the renderers already establish keeps working untouched.
    use3D = can3D();
    placed3D = 0;

    beginLabels(ctx);
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
      drawSpecimen(rc, cur, cx + cw / 2, cy + ch * 0.5, Math.min(cw, ch) * 0.5, spec,
        state.index % specimens.length));

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

  drawSpecimen(rc, sp, cx, cy, size, spec, 0);

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

  if (sp) drawSpecimen(rc, sp, half * 0.5, height * 0.5, Math.min(half * 0.8, height * 0.66) * 0.5, spec, 0);

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
  if (sp) drawSpecimen(rc, sp, width * 0.5, height * 0.4, Math.min(width * 0.5, height * 0.62) * 0.5, spec, 0);

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

/**
 * Draw centred text, wrapped to a width, and return the height it used.
 *
 * A single `fillText` with a sentence in it does not stop at the edge of its
 * column: in a two-panel comparison the two captions run into each other and
 * the result is two sentences printed on top of one another, which is
 * unreadable in a way that looks like a rendering fault rather than a layout
 * one. Everything that prints a sentence goes through here.
 */
function wrappedText(
  ctx: CanvasRenderingContext2D, text: string,
  cx: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4,
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  let truncated = false;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) { truncated = true; line = ""; break; }
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  // Say that something was cut. A sentence that simply stops mid-clause looks
  // like a bug; an ellipsis looks like an editor's decision.
  if (truncated && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last} …`).width > maxWidth) {
      last = last.replace(/\s*\S+$/, "");
    }
    lines[lines.length - 1] = `${last} …`;
  }
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
  return lines.length * lineHeight;
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
    drawSpecimen(rc, sp, cx, height * 0.46, size, spec, i);
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.font = '700 17px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.textAlign = "center";
    // Each caption stays inside its own column, with a gutter between them.
    const colW = (cols === 1 ? width * 0.7 : width / 2) - PAD * 2;
    let ty = height * 0.86;
    ty += wrappedText(ctx, sp.name, cx, ty, colW, 20, 2);
    if (sp.because) {
      ctx.font = '500 13px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = theme.inkSoft;
      wrappedText(ctx, sp.because, cx, ty + 2, colW, 16, 3);
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
