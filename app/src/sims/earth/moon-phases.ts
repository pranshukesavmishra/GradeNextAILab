import type { RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import { badge, glow, hexA, sky, sphere, starfield, vignette } from "@ui/scene";

/**
 * Moon Phases & Eclipses — Grades 1-10.
 *
 * Two views of the same instant, side by side: the Sun-Earth-Moon system from
 * above, and the Moon as it actually looks from the ground. Seeing both at once
 * is what finally kills the belief that the phases are Earth's shadow — the
 * shadow is drawn, it is right there, and it plainly misses the Moon almost
 * every month.
 *
 * The geometry is real. Positions come from the standard mean elements of the
 * Sun and Moon, so the synodic month works out to 29.53 days, the nodes regress
 * over 18.6 years, and eclipse seasons arrive twice a year on their own. The
 * illuminated fraction is computed from the actual Sun-Earth-Moon angle, not
 * looked up from a table of eight pictures.
 */

const DEG = Math.PI / 180;
const DAY = 86400;
export const SYNODIC_MONTH = 29.530588;

/** Inclination of the Moon's orbit to the ecliptic, in degrees. */
const MOON_INCLINATION = 5.145;

/**
 * Half-widths of the eclipse windows in ecliptic latitude. A solar eclipse is
 * visible somewhere on Earth out to about 1.4° because the Moon is close enough
 * for parallax to matter; the umbral lunar limit is tighter.
 */
const SOLAR_BETA_LIMIT = 1.45 * DEG;
const LUNAR_BETA_LIMIT = 1.0 * DEG;

export interface MoonGeometry {
  /** Ecliptic longitude of the Sun as seen from Earth, radians. */
  sunLon: number;
  /** True ecliptic longitude of the Moon, radians. */
  moonLon: number;
  /** Ecliptic latitude of the Moon, radians — zero means eclipse country. */
  beta: number;
  /** Longitude difference Moon − Sun, radians in [0, 2π). */
  elongation: number;
  /** True Sun-Earth-Moon angle, radians. This is what sets the phase. */
  separation: number;
  /** Fraction of the Moon's disc that is lit, 0 (new) to 1 (full). */
  illuminated: number;
  /** Position within the 29.53-day cycle, in days. */
  cycleDay: number;
}

/**
 * Sun and Moon positions from mean orbital elements, with the day counted from
 * J2000.0. Exported so tests can check the phase geometry directly.
 */
export function moonGeometry(day: number, inclinationDeg = MOON_INCLINATION): MoonGeometry {
  const sunLonDeg = 280.46 + 0.9856474 * day;
  const moonMeanLonDeg = 218.316 + 13.176396 * day;
  const nodeLonDeg = 125.045 - 0.052954 * day;

  const inc = inclinationDeg * DEG;
  // Argument of latitude: how far the Moon is past its ascending node.
  const u = (moonMeanLonDeg - nodeLonDeg) * DEG;
  const beta = Math.asin(Math.sin(inc) * Math.sin(u));
  // Project the orbital angle back onto the ecliptic to get true longitude.
  const moonLon = nodeLonDeg * DEG + Math.atan2(Math.sin(u) * Math.cos(inc), Math.cos(u));

  const sunLon = sunLonDeg * DEG;
  let elongation = (moonLon - sunLon) % (2 * Math.PI);
  if (elongation < 0) elongation += 2 * Math.PI;

  // The true angle at Earth between Sun and Moon, allowing for the tilt.
  const separation = Math.acos(
    Math.max(-1, Math.min(1, Math.cos(beta) * Math.cos(elongation))),
  );
  const illuminated = (1 - Math.cos(separation)) / 2;

  return {
    sunLon,
    moonLon,
    beta,
    elongation,
    separation,
    illuminated,
    cycleDay: (elongation / (2 * Math.PI)) * SYNODIC_MONTH,
  };
}

const PHASE_NAMES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Third Quarter", "Waning Crescent",
];

/** The eight named phases, each owning an equal eighth of the cycle. */
export function phaseName(cycleDay: number): string {
  const f = ((cycleDay / SYNODIC_MONTH) % 1 + 1) % 1;
  const index = Math.floor(f * 8 + 0.5) % 8;
  return PHASE_NAMES[index];
}

/** Angular separation of the Moon from the exact eclipse point, in radians. */
function alignmentMiss(geo: MoonGeometry, wantFull: boolean): number {
  const target = wantFull ? Math.PI : 0;
  let dLon = geo.elongation - target;
  while (dLon > Math.PI) dLon -= 2 * Math.PI;
  while (dLon < -Math.PI) dLon += 2 * Math.PI;
  return Math.hypot(dLon * Math.cos(geo.beta), geo.beta);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface EclipseEvent {
  day: number;
  solar: boolean;
  /** How central the alignment was, 0 (grazing) to 1 (dead on). */
  depth: number;
}

const MAX_EVENTS = 40;

interface State {
  /** Days animated since the run started. */
  elapsed: number;
  /** Elongation at the previous tick, used to catch syzygy crossings. */
  prevElongation: number;
  eclipses: EclipseEvent[];
  solarCount: number;
  lunarCount: number;
}

function currentDay(state: State, params: Record<string, number | boolean | string>): number {
  return (params.startDay as number) / DAY + state.elapsed;
}

function inclinationOf(params: Record<string, number | boolean | string>): number {
  return (params.alignOrbits as boolean) ? 0 : MOON_INCLINATION;
}

const model: SimModel<State> = {
  init(params) {
    const geo = moonGeometry((params.startDay as number) / DAY, inclinationOf(params));
    return {
      elapsed: 0,
      prevElongation: geo.elongation,
      eclipses: [],
      solarCount: 0,
      lunarCount: 0,
    };
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const rate = params.rate as number; // days per simulated second
    const elapsed = state.elapsed + rate * dt;
    const inc = inclinationOf(params);
    const day = (params.startDay as number) / DAY + elapsed;
    const geo = moonGeometry(day, inc);

    let eclipses = state.eclipses;
    let solarCount = state.solarCount;
    let lunarCount = state.lunarCount;

    // Only look for eclipses while the clock is actually running forward in
    // small steps; a scrub of the day slider must not invent events.
    const stepDays = rate * dt;
    if (stepDays > 0 && stepDays < 1.5) {
      const prev = state.prevElongation;
      const now = geo.elongation;
      // New moon: the elongation wraps past zero.
      const crossedNew = now < prev - Math.PI;
      const crossedFull = prev < Math.PI && now >= Math.PI;

      if (crossedNew || crossedFull) {
        const miss = alignmentMiss(geo, crossedFull);
        const limit = crossedFull ? LUNAR_BETA_LIMIT : SOLAR_BETA_LIMIT;
        if (Math.abs(geo.beta) < limit) {
          const event: EclipseEvent = {
            day,
            solar: crossedNew,
            depth: Math.max(0, 1 - miss / limit),
          };
          eclipses = eclipses.length >= MAX_EVENTS
            ? [...eclipses.slice(1), event]
            : [...eclipses, event];
          if (crossedNew) solarCount++; else lunarCount++;
        }
      }
    }

    return { elapsed, prevElongation: geo.elongation, eclipses, solarCount, lunarCount };
  },

  readouts(state, params) {
    const geo = moonGeometry(currentDay(state, params), inclinationOf(params));
    return [
      {
        key: "cycleDay", label: "Day in the cycle", quantity: q(geo.cycleDay * DAY, "time"), unit: "d",
        semantic: "time", graphable: true,
      },
      {
        key: "illuminated", label: "Lit up", quantity: q(geo.illuminated, "percent"), unit: "%",
        semantic: "light", graphable: true,
      },
      {
        key: "elongation", label: "Sun-Earth-Moon angle", quantity: q(geo.separation, "angle"), unit: "°",
        semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "beta", label: "Moon above the Earth-Sun plane", quantity: q(geo.beta, "angle"), unit: "°",
        semantic: "distance", graphable: true, bands: ["9-12"],
      },
      {
        key: "daysElapsed", label: "Days run", quantity: q(state.elapsed * DAY, "time"), unit: "d",
        semantic: "time", graphable: false, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "eclipses", label: "Eclipses found", quantity: q(state.solarCount + state.lunarCount, "count"),
        semantic: "field", graphable: false, bands: ["3-5", "6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const day = currentDay(state, params);
    const geo = moonGeometry(day, inclinationOf(params));
    const solarMiss = alignmentMiss(geo, false);
    const lunarMiss = alignmentMiss(geo, true);
    return {
      day,
      daysElapsed: state.elapsed,
      cycleDay: geo.cycleDay,
      phase: phaseName(geo.cycleDay),
      illuminated: geo.illuminated,
      elongationDeg: (geo.elongation / DEG) % 360,
      separationDeg: geo.separation / DEG,
      betaDeg: geo.beta / DEG,
      isNew: geo.illuminated < 0.02,
      isFull: geo.illuminated > 0.98,
      solarEclipseNow: solarMiss < SOLAR_BETA_LIMIT,
      lunarEclipseNow: lunarMiss < LUNAR_BETA_LIMIT,
      eclipseCount: state.solarCount + state.lunarCount,
      solarCount: state.solarCount,
      lunarCount: state.lunarCount,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

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
 * Text over the night sky. The whole stage is space in both themes, so the
 * halo is always dark and the ink is always light — `caption` cannot assume
 * that, because most scenes are not permanently black.
 */
function spaceText(
  ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string,
  opts: { align?: CanvasTextAlign; size?: number; weight?: number } = {},
) {
  ctx.save();
  ctx.font = `${opts.weight ?? 600} ${opts.size ?? 12}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "rgba(3,7,14,0.85)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** A ball lit from a direction: highlight toward the light, shadow away from it. */
function litBody(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  color: string, sunAngle: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const hx = cx + Math.cos(sunAngle) * r * 0.42;
  const hy = cy + Math.sin(sunAngle) * r * 0.42;
  const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 1.3);
  hg.addColorStop(0, "rgba(255,255,255,0.55)");
  hg.addColorStop(0.4, "rgba(255,255,255,0.14)");
  hg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const sx = cx - Math.cos(sunAngle) * r * 0.6;
  const sy = cy - Math.sin(sunAngle) * r * 0.6;
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.6);
  sg.addColorStop(0, "rgba(0,0,0,0.55)");
  sg.addColorStop(0.55, "rgba(0,0,0,0.18)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A body lit from one side. `illum` is the fraction lit and `sunAngle` is the
 * screen direction the light comes from; the terminator is the correct
 * half-ellipse, so a gibbous moon bulges the right way and a crescent does not.
 * Both halves are shaded, so the result reads as a ball rather than a token.
 */
function phaseDisc(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  illum: number, sunAngle: number, lit: string, dark: string,
  opts: { maria?: boolean } = {},
) {
  const t = 2 * Math.max(0, Math.min(1, illum)) - 1;

  // The night side first: faintly lit by earthshine, never a flat hole.
  litBody(ctx, cx, cy, r, dark, sunAngle + Math.PI);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sunAngle);
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(
    0, 0, Math.max(0.01, Math.abs(t) * r), r, 0,
    Math.PI / 2, -Math.PI / 2,
    t < 0,
  );
  ctx.closePath();
  ctx.clip();
  ctx.rotate(-sunAngle);
  ctx.translate(-cx, -cy);
  litBody(ctx, cx, cy, r, lit, sunAngle);

  if (opts.maria) {
    // The maria: the dark seas that make the Moon look like the Moon.
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    const seas: [number, number, number][] = [
      [-0.26, -0.3, 0.3], [0.18, -0.36, 0.19], [-0.34, 0.18, 0.22],
      [0.1, 0.12, 0.26], [0.38, 0.34, 0.13], [-0.05, 0.46, 0.15],
    ];
    for (const [dx, dy, rr] of seas) {
      ctx.beginPath();
      ctx.ellipse(cx + dx * r, cy + dy * r, rr * r, rr * r * 0.82, dx, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (const [dx, dy, rr] of [[0.42, -0.12, 0.06], [-0.5, -0.1, 0.05]] as [number, number, number][]) {
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // A limb, so the ball has an edge against the black.
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Earth's shadow, drawn whether or not anything is in it. That is the point. */
function shadowCone(
  ctx: CanvasRenderingContext2D, x: number, y: number, angle: number,
  bodyR: number, length: number, _theme: ThemeColors,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Penumbra: wide, soft, and the reason partial eclipses exist.
  const pen = ctx.createLinearGradient(0, 0, length, 0);
  pen.addColorStop(0, "rgba(0,0,0,0.34)");
  pen.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pen;
  ctx.beginPath();
  ctx.moveTo(0, -bodyR);
  ctx.lineTo(length, -bodyR * 1.5);
  ctx.lineTo(length, bodyR * 1.5);
  ctx.lineTo(0, bodyR);
  ctx.closePath();
  ctx.fill();

  // Umbra: the tapering core that actually has to hit the Moon.
  const umb = ctx.createLinearGradient(0, 0, length, 0);
  umb.addColorStop(0, "rgba(0,0,0,0.72)");
  umb.addColorStop(0.75, "rgba(0,0,0,0.4)");
  umb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = umb;
  ctx.beginPath();
  ctx.moveTo(0, -bodyR);
  ctx.lineTo(length, -bodyR * 0.12);
  ctx.lineTo(length, bodyR * 0.12);
  ctx.lineTo(0, bodyR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpaceView(
  rc: RenderContext<State>, geo: MoonGeometry, x: number, y: number, w: number, h: number,
) {
  const { ctx, theme, band, overlays } = rc;
  const cx = x + w * 0.6;
  const cy = y + h * 0.5;
  const orbitR = Math.min(w * 0.36, h * 0.4);
  const earthR = band === "K-2" ? 22 : 18;
  const moonR = band === "K-2" ? 11 : 8.5;

  const lightColor = theme.sci["light"];
  const rock = theme.sci["mass"];
  const ink = theme.surface;

  /* --- the Sun, off the left edge, with light crossing the frame --- */
  const sunX = x - w * 0.06;
  const sunR = Math.min(h * 0.34, w * 0.2);
  glow(ctx, sunX, cy, sunR * 3.4, lightColor, 0.5);
  sphere(ctx, sunX, cy, sunR, lightColor, { glow: 1.1, rim: false });

  ctx.save();
  ctx.strokeStyle = hexA(lightColor, 0.45);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const ry = y + h * (0.14 + i * 0.145);
    ctx.beginPath();
    ctx.moveTo(sunX + sunR + 8, ry);
    ctx.lineTo(cx - orbitR - 16, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - orbitR - 24, ry);
    ctx.lineTo(cx - orbitR - 16, ry - 5);
    ctx.lineTo(cx - orbitR - 16, ry + 5);
    ctx.closePath();
    ctx.fillStyle = hexA(lightColor, 0.45);
    ctx.fill();
  }
  ctx.restore();
  spaceText(ctx, sunX + sunR + 12, cy - sunR * 0.7, "Sun", lightColor, { size: 12 });

  /* --- orbit --------------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = hexA(ink, 0.28);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* --- Earth, its shadow, and the observer ------------------------- */
  shadowCone(ctx, cx, cy, 0, earthR, orbitR * 1.9, theme);
  phaseDisc(ctx, cx, cy, earthR, 0.5, Math.PI, theme.sci["liquid"], blend(theme.sci["liquid"], theme.ink, 0.6));
  // A hint of land, so Earth is a world and not a blue dot.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hexA(theme.sci["producer"], 0.75);
  ctx.beginPath();
  ctx.ellipse(cx - earthR * 0.3, cy - earthR * 0.2, earthR * 0.42, earthR * 0.3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + earthR * 0.25, cy + earthR * 0.4, earthR * 0.34, earthR * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (band !== "K-2") {
    spaceText(ctx, cx, cy + earthR + 14, "Earth", ink, { align: "center", size: 12 });
  }

  /* --- Moon ---------------------------------------------------------- */
  // Elongation maps straight onto the picture: a new moon sits between Earth
  // and the Sun, a full moon on the far side.
  // Screen angle π points at the Sun, so the Moon sits at π + elongation.
  const mx = cx - Math.cos(geo.elongation) * orbitR;
  const my = cy - Math.sin(geo.elongation) * orbitR;
  shadowCone(ctx, mx, my, 0, moonR, orbitR * 1.0, theme);
  // The Moon's lit half always faces the Sun, which is off to the left.
  phaseDisc(ctx, mx, my, moonR, 0.5, Math.PI, blend(lightColor, theme.surface, 0.35),
    blend(rock, theme.ink, 0.55), { maria: true });
  if (band !== "K-2") {
    spaceText(ctx, mx, my - moonR - 14, "Moon", ink, { align: "center", size: 12 });
  }

  /* --- the 5° tilt, shown edge-on ----------------------------------- */
  if (overlays.tilt && band !== "K-2" && band !== "3-5") {
    const sy = y + h - 24;
    const halfW = w * 0.4;
    ctx.save();
    ctx.strokeStyle = hexA(ink, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5 - halfW, sy);
    ctx.lineTo(x + w * 0.5 + halfW, sy);
    ctx.stroke();

    ctx.strokeStyle = theme.sci["distance"];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const frac = i / 60;
      const bx = x + w * 0.5 - halfW + frac * halfW * 2;
      const g = moonGeometry(
        currentDay(rc.state, rc.params) - SYNODIC_MONTH / 2 + frac * SYNODIC_MONTH,
        inclinationOf(rc.params),
      );
      const by = sy - (g.beta / (6 * DEG)) * 16;
      if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
    }
    ctx.stroke();
    ctx.restore();
    sphere(ctx, x + w * 0.5, sy - (geo.beta / (6 * DEG)) * 16, 4.5, lightColor, { glow: 0.7 });
    spaceText(ctx, x + w * 0.5 - halfW, sy - 26, "Moon's tilted path", hexA(ink, 0.75), { size: 11 });
  }
}

function drawEarthView(
  rc: RenderContext<State>, geo: MoonGeometry, x: number, y: number, w: number, h: number,
) {
  const { ctx, theme, band, state, params } = rc;
  const ink = theme.surface;

  const cx = x + w * 0.5;
  const cy = y + h * 0.44;
  const r = Math.min(w * 0.34, h * 0.34);

  // A horizon at the bottom of the panel: this is a view from the ground, and
  // the ground is what makes it one.
  const horizon = y + h - 34;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 4, y + 4, w - 8, h - 8);
  ctx.clip();
  const night = ctx.createLinearGradient(0, y, 0, horizon);
  night.addColorStop(0, "rgba(255,255,255,0)");
  night.addColorStop(1, hexA(theme.sci["velocity"], 0.16));
  ctx.fillStyle = night;
  ctx.fillRect(x, y, w, horizon - y);

  // Moonlight halo, brighter the more of the Moon is lit.
  glow(ctx, cx, cy, r * (2 + geo.illuminated * 2.6), blend(theme.sci["light"], theme.surface, 0.4),
    0.1 + geo.illuminated * 0.3);

  // Waxing moons are lit on the right; waning moons on the left.
  const waxing = geo.elongation < Math.PI;
  phaseDisc(
    ctx, cx, cy, r, geo.illuminated, waxing ? 0 : Math.PI,
    blend(theme.sci["light"], theme.surface, 0.35),
    blend(theme.sci["mass"], theme.ink, 0.62),
    { maria: true },
  );

  // The ground, with a treeline, so the Moon is above something.
  ctx.fillStyle = blend(theme.sci["producer"], theme.ink, 0.78);
  ctx.beginPath();
  ctx.moveTo(x, horizon + 6);
  for (let i = 0; i <= 18; i++) {
    const tx = x + (i / 18) * w;
    const th = 4 + ((Math.sin(i * 2.3) + 1) / 2) * 12;
    ctx.lineTo(tx, horizon - th);
    ctx.lineTo(tx + w / 36, horizon);
  }
  ctx.lineTo(x + w, horizon + 6);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 0.35);
  ctx.lineWidth = 1;
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 10);
  ctx.stroke();
  ctx.restore();

  const facts = model.facts?.(state, params) ?? {};
  const name = String(facts.phase ?? "");
  spaceText(ctx, cx, horizon + 18, name, ink, {
    align: "center", size: band === "K-2" ? 17 : 15, weight: 700,
  });
  if (band !== "K-2") {
    badge(ctx, cx, y + h - 4, `${Math.round(geo.illuminated * 100)}% lit`, theme, {
      align: "center", color: theme.sci["light"],
    });
  }
  spaceText(ctx, cx, y + 20, "What you see from Earth", hexA(ink, 0.7), {
    align: "center", size: 11, weight: 500,
  });

  if (facts.solarEclipseNow) {
    badge(ctx, x + w / 2, y + 44, "Solar eclipse!", theme, {
      align: "center", color: theme.sci["light"],
    });
  } else if (facts.lunarEclipseNow) {
    badge(ctx, x + w / 2, y + 44, "Lunar eclipse!", theme, {
      align: "center", color: theme.sci["acceleration"],
    });
  }
}

/** A strip of the eclipses logged so far, with the day each one happened. */
function drawEclipseLog(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (state.eclipses.length === 0) {
    spaceText(ctx, x + 10, y + h / 2, "No eclipses logged yet", hexA(theme.surface, 0.6), {
      size: 10, weight: 500,
    });
    return;
  }

  const first = state.eclipses[0].day;
  const last = state.eclipses[state.eclipses.length - 1].day;
  const span = Math.max(last - first, 30);
  for (let i = 0; i < state.eclipses.length; i++) {
    const e = state.eclipses[i];
    const px = x + 10 + ((e.day - first) / span) * (w - 20);
    sphere(ctx, px, y + h / 2, 3 + e.depth * 3.5,
      e.solar ? theme.sci["light"] : theme.sci["acceleration"], { glow: 0.7 });
  }
  spaceText(ctx, x + w - 8, y + h / 2, `${state.solarCount} solar · ${state.lunarCount} lunar`,
    hexA(theme.surface, 0.75), { align: "right", size: 10, weight: 500 });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const geo = moonGeometry(currentDay(state, params), inclinationOf(params));

  /* ---- one night sky behind both views ---- */
  sky(ctx, width, height, theme, "space");
  starfield(ctx, width, height, 170, 4);

  const logH = overlays.log !== false && band !== "K-2" ? 26 : 0;
  const bodyH = height - logH - (logH ? 8 : 0);
  const splitX = width * 0.58;

  drawSpaceView(rc, geo, 0, 0, splitX, bodyH);
  drawEarthView(rc, geo, splitX, 0, width - splitX, bodyH);

  ctx.save();
  ctx.strokeStyle = hexA(theme.surface, 0.16);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX, 12);
  ctx.lineTo(splitX, bodyH - 12);
  ctx.stroke();
  ctx.restore();

  if (band !== "K-2") {
    badge(ctx, 10, 20, `Day ${currentDay(state, params).toFixed(1)}`, theme, {
      color: theme.accent, sub: `cycle day ${geo.cycleDay.toFixed(1)}`,
    });
  }
  if (logH) drawEclipseLog(rc, 0, bodyH + 8, width, logH - 4);

  vignette(ctx, width, height, 0.24);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const moonPhasesSim: SimManifest<State> = {
  id: "earth.moon-phases",
  title: "Moon Phases & Eclipses",
  tagline: "Watch the Moon go round from above and from the ground at the same time, and see why it changes shape.",
  subject: "earth",
  bands: ["K-2", "3-5", "6-8", "9-12"],
  grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  standards: {
    ngss: ["1-ESS1-1", "5-PS2-1", "MS-ESS1-1"],
  },
  learningGoals: [
    "Explain the phases as how much of the lit half of the Moon we can see.",
    "Show that the phases are not Earth's shadow falling on the Moon.",
    "Explain why eclipses happen only a few times a year, not every month.",
  ],
  misconceptions: [
    "The phases are Earth's shadow on the Moon",
    "The Moon is only out at night",
    "There should be an eclipse every month",
    "The Moon does not spin",
  ],
  interactionHint: "Press play and watch both pictures at once.",
  tickRate: 60,
  timeScale: 1,
  params: {
    rate: {
      type: "number", label: "Days per second", kind: "ratio",
      min: 0, max: 12, step: 0.25, default: 1.5,
      help: "Set this to 0 and use the Day slider to step through by hand.",
    },
    startDay: {
      type: "number", label: "Day", kind: "time", unit: "d",
      min: 0, max: 400 * DAY, step: 0.1 * DAY, default: 0,
      hideValueBands: ["K-2"],
      help: "Day 0 is 1 January 2000. Everything else follows from the real orbits.",
    },
    alignOrbits: {
      type: "boolean", label: "Line the orbits up", default: false,
      bands: ["3-5", "6-8", "9-12"],
      help: "Removes the Moon's 5° tilt. Now every new moon really is an eclipse.",
    },
  },
  overlays: [
    { key: "tilt", label: "Moon's tilted orbit", default: true, bands: ["6-8", "9-12"] },
    { key: "log", label: "Eclipse log", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "why-phases",
      title: "Why does the Moon change shape?",
      question: "What actually makes the Moon look like a crescent some nights and a circle on others?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS1-1"],
      setup: { rate: 1.5, startDay: 0, alignOrbits: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit to an answer before you look at the two views.",
          predict: {
            prompt: "What makes the Moon look like a crescent?",
            options: [
              "Earth's shadow covers part of it",
              "Clouds cover part of it",
              "We only see part of its lit half from where we are",
              "The Moon really changes shape",
            ],
            correct: 2,
            reveal:
              "Half the Moon is always lit by the Sun. As it goes round us we see that lit half from different sides, so we see different amounts of it. Earth's shadow is somewhere else entirely — you can see it drawn in the space view.",
          },
        },
        {
          id: "watch",
          phase: "measure",
          title: "Run one whole month",
          instruction: "Play for about 30 days. Record how lit up it is a few times.",
          requireData: 5,
          hints: [
            "Compare the two pictures at the same moment.",
            "Watch the grey shadow behind Earth. Is the Moon ever in it?",
          ],
        },
        {
          id: "full",
          phase: "setup",
          title: "Find a full moon",
          instruction: "Stop the clock and scrub the Day slider until the Moon is fully lit.",
          check: {
            describe: "The Moon is more than 98% lit",
            test: (v) => (v.facts.illuminated as number) > 0.98,
          },
          hints: ["Set Days per second to 0 first.", "Full moon happens when the Moon is opposite the Sun."],
        },
        {
          id: "new",
          phase: "setup",
          title: "Now find a new moon",
          instruction: "Scrub until almost none of it is lit.",
          check: {
            describe: "The Moon is less than 3% lit",
            test: (v) => (v.facts.illuminated as number) < 0.03,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say where the Moon has to be for each shape.",
          write: {
            prompt: "Where is the Moon when it looks full, and where is it when it looks new?",
            placeholder: "The Moon looks full when it is ... and new when it is ...",
          },
        },
      ],
    },
    {
      id: "when-eclipses",
      title: "When do eclipses happen?",
      question: "The Moon passes between us and the Sun every month. So why is there not an eclipse every month?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS1-1"],
      setup: { rate: 4, startDay: 0, alignOrbits: false },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "There is a new moon every 29.5 days. Commit to a reason.",
          predict: {
            prompt: "Why is there not a solar eclipse every single new moon?",
            options: [
              "The Moon is too small",
              "The Moon's orbit is tilted, so it usually passes above or below the Sun",
              "Eclipses only happen in summer",
              "The Moon moves too fast",
            ],
            correct: 1,
            reveal:
              "The Moon's orbit is tilted about 5°. Most new moons the Moon passes a little above or below the Sun and its shadow misses Earth completely.",
          },
        },
        {
          id: "run-year",
          phase: "measure",
          title: "Run a whole year",
          instruction: "Play until 365 days have passed. Watch the eclipse log fill up.",
          check: {
            describe: "At least 365 days run",
            test: (v) => (v.facts.daysElapsed as number) >= 365,
          },
          hints: ["Turn Days per second right up.", "There are twelve new moons but far fewer eclipses."],
        },
        {
          id: "flatten",
          phase: "analyze",
          title: "Now remove the tilt",
          instruction: "Turn on 'Line the orbits up' and run another year.",
          check: {
            describe: "The orbits are lined up",
            test: (v) => v.params.alignOrbits === true,
          },
          hints: ["Count the eclipses now. How many new moons were there in that year?"],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Write the rule for when an eclipse can happen.",
          write: {
            prompt: "What two things must both be true for a solar eclipse?",
            placeholder: "There has to be a new moon AND ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "eclipse-hunter",
      title: "Eclipse hunter",
      brief: "Run a full year and log every eclipse the geometry allows.",
      bands: ["6-8", "9-12"],
      setup: { rate: 6, startDay: 0, alignOrbits: false },
      goal: {
        describe: "365 days run with at least 3 eclipses logged",
        test: (v) => (v.facts.daysElapsed as number) >= 365 && (v.facts.eclipseCount as number) >= 3,
      },
      stars: {
        two: {
          describe: "At least 4 eclipses in the year",
          test: (v) => (v.facts.daysElapsed as number) >= 365 && (v.facts.eclipseCount as number) >= 4,
        },
        three: {
          describe: "At least one solar and one lunar eclipse, 5 in total",
          test: (v) =>
            (v.facts.daysElapsed as number) >= 365 && (v.facts.eclipseCount as number) >= 5 &&
            (v.facts.solarCount as number) >= 1 && (v.facts.lunarCount as number) >= 1,
        },
      },
      hints: [
        "Eclipses come in seasons, roughly six months apart.",
        "If you want to see far more of them, try lining the orbits up.",
      ],
    },
    {
      id: "find-first-quarter",
      title: "Half and half",
      brief: "Stop the Moon at exactly half lit.",
      bands: ["3-5", "6-8"],
      setup: { rate: 0, startDay: 0, alignOrbits: false },
      goal: {
        describe: "Between 47% and 53% lit",
        test: (v) =>
          (v.facts.illuminated as number) >= 0.47 && (v.facts.illuminated as number) <= 0.53,
      },
      stars: {
        two: {
          describe: "Between 49% and 51% lit",
          test: (v) =>
            (v.facts.illuminated as number) >= 0.49 && (v.facts.illuminated as number) <= 0.51,
        },
      },
      hints: [
        "Set Days per second to 0 and use the Day slider.",
        "Half lit means the Sun, Earth and Moon make a right angle.",
      ],
    },
  ],
};
