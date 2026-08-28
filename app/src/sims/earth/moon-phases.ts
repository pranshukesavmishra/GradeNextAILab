import type { RenderContext, SimManifest, SimModel, ThemeColors } from "@engine/types";
import { q } from "@engine/units";
import { disc, label, roundRect } from "@ui/draw";

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

/**
 * A disc lit from one side. `illum` is the fraction lit and `sunAngle` is the
 * screen direction the light comes from; the terminator is the correct
 * half-ellipse, so a gibbous moon bulges the right way and a crescent does not.
 */
function phaseDisc(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  illum: number, sunAngle: number, lit: string, dark: string,
) {
  const t = 2 * Math.max(0, Math.min(1, illum)) - 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sunAngle);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(
    0, 0, Math.max(0.01, Math.abs(t) * r), r, 0,
    Math.PI / 2, -Math.PI / 2,
    t < 0,
  );
  ctx.closePath();
  ctx.fillStyle = lit;
  ctx.fill();
  ctx.restore();
}

/** Earth's shadow, drawn whether or not anything is in it. That is the point. */
function shadowCone(
  ctx: CanvasRenderingContext2D, x: number, y: number, angle: number,
  bodyR: number, length: number, theme: ThemeColors,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const grad = ctx.createLinearGradient(0, 0, length, 0);
  grad.addColorStop(0, theme.inkSoft);
  grad.addColorStop(1, theme.surface);
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -bodyR);
  ctx.lineTo(length, -bodyR * 0.25);
  ctx.lineTo(length, bodyR * 0.25);
  ctx.lineTo(0, bodyR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpaceView(
  rc: RenderContext<State>, geo: MoonGeometry, x: number, y: number, w: number, h: number,
) {
  const { ctx, theme, band, overlays } = rc;
  const cx = x + w * 0.58;
  const cy = y + h * 0.5;
  const orbitR = Math.min(w * 0.34, h * 0.36);
  const earthR = band === "K-2" ? 16 : 13;
  const moonR = band === "K-2" ? 9 : 7;

  /* --- sunlight arriving from the left --------------------------- */
  const lightColor = theme.sci["light"];
  ctx.save();
  ctx.strokeStyle = lightColor;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const ry = y + h * (0.2 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(x + 6, ry);
    ctx.lineTo(x + w * 0.2, ry);
    ctx.stroke();
  }
  ctx.restore();
  disc(ctx, x + 2, cy, Math.min(h * 0.3, 46), lightColor, { alpha: 0.9 });
  label(ctx, "Sun", x + 26, cy, theme, { size: 11, color: theme.inkSoft, plate: false });

  /* --- orbit --------------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* --- Earth, its shadow, and the observer ------------------------- */
  shadowCone(ctx, cx, cy, 0, earthR, orbitR * 1.7, theme);
  phaseDisc(ctx, cx, cy, earthR, 0.5, Math.PI, theme.sci["liquid"], theme.sci["mass"]);
  if (band !== "K-2") {
    label(ctx, "Earth", cx, cy + earthR + 12, theme, {
      align: "center", size: 11, color: theme.inkSoft, plate: false,
    });
  }

  /* --- Moon ---------------------------------------------------------- */
  // Elongation maps straight onto the picture: a new moon sits between Earth
  // and the Sun, a full moon on the far side.
  // Screen angle π points at the Sun, so the Moon sits at π + elongation.
  const mx = cx - Math.cos(geo.elongation) * orbitR;
  const my = cy - Math.sin(geo.elongation) * orbitR;
  shadowCone(ctx, mx, my, 0, moonR, orbitR * 0.9, theme);
  // The Moon's lit half always faces the Sun, which is off to the left.
  phaseDisc(ctx, mx, my, moonR, 0.5, Math.PI, theme.sci["light"], theme.sci["mass"]);
  if (band !== "K-2") {
    label(ctx, "Moon", mx, my - moonR - 12, theme, {
      align: "center", size: 11, color: theme.inkSoft, plate: false,
    });
  }

  /* --- the 5° tilt, shown edge-on ----------------------------------- */
  if (overlays.tilt && band !== "K-2" && band !== "3-5") {
    const sy = y + h - 26;
    const halfW = w * 0.4;
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5 - halfW, sy);
    ctx.lineTo(x + w * 0.5 + halfW, sy);
    ctx.stroke();

    ctx.strokeStyle = theme.sci["distance"];
    ctx.lineWidth = 1.5;
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
    disc(ctx, x + w * 0.5, sy - (geo.beta / (6 * DEG)) * 16, 4, theme.sci["light"]);
    label(ctx, "Moon's tilted path", x + w * 0.5 - halfW, sy - 26, theme, {
      size: 10, color: theme.inkSoft, plate: false,
    });
  }
}

function drawEarthView(
  rc: RenderContext<State>, geo: MoonGeometry, x: number, y: number, w: number, h: number,
) {
  const { ctx, theme, band, state, params } = rc;

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 8);
  ctx.fill();
  ctx.restore();

  const cx = x + w * 0.5;
  const cy = y + h * 0.46;
  const r = Math.min(w * 0.3, h * 0.3);

  // Waxing moons are lit on the right; waning moons on the left.
  const waxing = geo.elongation < Math.PI;
  phaseDisc(ctx, cx, cy, r, geo.illuminated, waxing ? 0 : Math.PI,
    theme.sci["light"], theme.sci["mass"]);

  const facts = model.facts?.(state, params) ?? {};
  const name = String(facts.phase ?? "");
  label(ctx, name, cx, cy + r + 22, theme, {
    align: "center", size: band === "K-2" ? 16 : 14,
  });
  if (band !== "K-2") {
    label(ctx, `${Math.round(geo.illuminated * 100)}% lit`, cx, cy + r + 42, theme, {
      align: "center", size: 12, color: theme.inkSoft,
    });
  }
  label(ctx, "What you see from Earth", cx, y + 20, theme, {
    align: "center", size: 11, color: theme.inkSoft, plate: false,
  });

  if (facts.solarEclipseNow) {
    label(ctx, "Solar eclipse!", cx, y + h - 22, theme, {
      align: "center", size: 13, color: theme.sci["light"],
    });
  } else if (facts.lunarEclipseNow) {
    label(ctx, "Lunar eclipse!", cx, y + h - 22, theme, {
      align: "center", size: 13, color: theme.sci["acceleration"],
    });
  }
}

/** A strip of the eclipses logged so far, with the day each one happened. */
function drawEclipseLog(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.restore();

  if (state.eclipses.length === 0) {
    label(ctx, "No eclipses logged yet", x + 8, y + h / 2, theme, {
      size: 10, color: theme.inkSoft, plate: false,
    });
    return;
  }

  const first = state.eclipses[0].day;
  const last = state.eclipses[state.eclipses.length - 1].day;
  const span = Math.max(last - first, 30);
  for (let i = 0; i < state.eclipses.length; i++) {
    const e = state.eclipses[i];
    const px = x + 10 + ((e.day - first) / span) * (w - 20);
    disc(ctx, px, y + h / 2, 3 + e.depth * 3,
      e.solar ? theme.sci["light"] : theme.sci["acceleration"]);
  }
  label(ctx, `${state.solarCount} solar · ${state.lunarCount} lunar`, x + w - 8, y + h / 2, theme, {
    align: "right", size: 10, color: theme.inkSoft, plate: false,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const geo = moonGeometry(currentDay(state, params), inclinationOf(params));

  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const logH = overlays.log !== false && band !== "K-2" ? 26 : 0;
  const bodyH = height - logH - (logH ? 8 : 0);
  const splitX = width * 0.56;

  drawSpaceView(rc, geo, 0, 0, splitX, bodyH);
  drawEarthView(rc, geo, splitX, 0, width - splitX, bodyH);

  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX, 10);
  ctx.lineTo(splitX, bodyH - 10);
  ctx.stroke();
  ctx.restore();

  if (band !== "K-2") {
    label(
      ctx,
      `Day ${currentDay(state, params).toFixed(1)}   ·   cycle day ${geo.cycleDay.toFixed(1)}`,
      8, 16, theme, { size: 11, color: theme.inkSoft },
    );
  }
  if (logH) drawEclipseLog(rc, 0, bodyH + 8, width, logH - 4);
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
