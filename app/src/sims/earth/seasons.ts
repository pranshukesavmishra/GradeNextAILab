import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { disc, label, roundRect } from "@ui/draw";

/**
 * Seasons & Sun Angle — Grades 1-10.
 *
 * Earth going round the Sun with a tilt the student can change, including
 * setting it to zero. That single control is the strongest demonstration in the
 * whole subject: with no tilt, every latitude gets twelve hours of daylight on
 * every day of the year and the seasons vanish, even though Earth is still
 * moving nearer to and further from the Sun.
 *
 * The distance misconception is confrontable directly. The orbit shape control
 * exaggerates the eccentricity to 0.35 — vastly more lopsided than the real
 * 0.0167 — and the seasons still follow the tilt, not the distance.
 *
 * Everything is computed: Kepler's equation gives the Earth-Sun distance and
 * the Sun's ecliptic longitude, δ = asin(sin ε · sin λ) gives the declination,
 * and the sunrise hour angle gives the length of the day.
 */

const DEG = Math.PI / 180;
const DAY = 86400;
const YEAR_DAYS = 365.2422;

/** Solar constant at 1 AU, W/m². */
const SOLAR_CONSTANT = 1361;
/** Longitude of perihelion — the direction of Earth's closest approach. */
const PERIHELION_LON = 282.94 * DEG;
/** Day of the year Earth passes perihelion (about 3 January). */
const PERIHELION_DAY = 3;

export const EARTH_OBLIQUITY = 23.44 * DEG;

const ECCENTRICITY: Record<string, number> = {
  real: 0.0167,
  circle: 0,
  extreme: 0.35,
};

export interface SunPosition {
  /** Earth-Sun distance in astronomical units. */
  distanceAU: number;
  /** Ecliptic longitude of the Sun as seen from Earth, radians. */
  lambda: number;
  /** True anomaly, radians — used only for drawing the orbit. */
  trueAnomaly: number;
}

/**
 * Solve Kepler's equation for the given day of the year. Four Newton steps are
 * plenty at any eccentricity this sim allows, and keeping it exact is what lets
 * the exaggerated orbit stay physically honest.
 */
export function sunPosition(dayOfYear: number, eccentricity: number): SunPosition {
  const e = eccentricity;
  const M = (2 * Math.PI * (dayOfYear - PERIHELION_DAY)) / YEAR_DAYS;
  let E = M;
  for (let i = 0; i < 4; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const distanceAU = 1 - e * Math.cos(E);
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  return { distanceAU, trueAnomaly, lambda: trueAnomaly + PERIHELION_LON };
}

/**
 * Solar declination: the latitude where the Sun is straight overhead.
 * δ = asin(sin ε · sin λ), which is exact for a circular-sky model and gives
 * exactly ±ε at the solstices.
 */
export function solarDeclination(dayOfYear: number, tilt: number, eccentricity = ECCENTRICITY.real): number {
  const { lambda } = sunPosition(dayOfYear, eccentricity);
  return Math.asin(Math.sin(tilt) * Math.sin(lambda));
}

/** The sunrise hour angle, radians. π means the Sun never sets. */
export function sunriseHourAngle(latitude: number, declination: number): number {
  const cosH = -Math.tan(latitude) * Math.tan(declination);
  if (cosH <= -1) return Math.PI;     // midnight sun
  if (cosH >= 1) return 0;            // polar night
  return Math.acos(cosH);
}

/** Hours of daylight at a latitude on a day with the given declination. */
export function daylightHours(latitude: number, declination: number): number {
  return (24 * sunriseHourAngle(latitude, declination)) / Math.PI;
}

/** Solar altitude at local noon, radians. Negative means the Sun stays down. */
export function noonAltitude(latitude: number, declination: number): number {
  return Math.PI / 2 - Math.abs(latitude - declination);
}

/**
 * Daily mean insolation at the top of the atmosphere, W/m². The standard
 * expression: distance matters through the inverse-square term, and tilt
 * matters through both the day length and the angle.
 */
export function dailyInsolation(
  latitude: number, declination: number, distanceAU: number,
): number {
  const H = sunriseHourAngle(latitude, declination);
  const factor = 1 / (distanceAU * distanceAU);
  return (SOLAR_CONSTANT / Math.PI) * factor * (
    H * Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.sin(H)
  );
}

const SEASONS_NORTH = ["Spring", "Summer", "Autumn", "Winter"];

/** Astronomical season, by the Sun's ecliptic longitude and the hemisphere. */
export function seasonName(lambda: number, latitude: number): string {
  let f = (lambda / (2 * Math.PI)) % 1;
  if (f < 0) f += 1;
  let index = Math.floor(f * 4) % 4;
  if (latitude < 0) index = (index + 2) % 4;
  return SEASONS_NORTH[index];
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  /** Days animated since the run started. */
  elapsed: number;
  minDaylight: number;
  maxDaylight: number;
  sawMidnightSun: boolean;
  sawPolarNight: boolean;
}

type Params = Record<string, number | boolean | string>;

function dayOf(state: State, params: Params): number {
  const day = (params.startDay as number) / DAY + state.elapsed;
  return ((day % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
}

interface Snapshot {
  day: number;
  lambda: number;
  distanceAU: number;
  declination: number;
  daylight: number;
  altitude: number;
  noonIntensity: number;
  insolation: number;
}

function snapshot(state: State, params: Params): Snapshot {
  const day = dayOf(state, params);
  const e = ECCENTRICITY[params.orbitShape as string] ?? ECCENTRICITY.real;
  const tilt = params.tilt as number;
  const latitude = params.latitude as number;
  const sun = sunPosition(day, e);
  const declination = Math.asin(Math.sin(tilt) * Math.sin(sun.lambda));
  const altitude = noonAltitude(latitude, declination);
  return {
    day,
    lambda: sun.lambda,
    distanceAU: sun.distanceAU,
    declination,
    daylight: daylightHours(latitude, declination),
    altitude,
    noonIntensity: altitude > 0
      ? (SOLAR_CONSTANT * Math.sin(altitude)) / (sun.distanceAU * sun.distanceAU)
      : 0,
    insolation: dailyInsolation(latitude, declination, sun.distanceAU),
  };
}

const model: SimModel<State> = {
  init() {
    return {
      elapsed: 0,
      minDaylight: 24,
      maxDaylight: 0,
      sawMidnightSun: false,
      sawPolarNight: false,
    };
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const elapsed = state.elapsed + (params.rate as number) * dt;
    const next: State = { ...state, elapsed };
    const s = snapshot(next, params);
    return {
      elapsed,
      minDaylight: Math.min(state.minDaylight, s.daylight),
      maxDaylight: Math.max(state.maxDaylight, s.daylight),
      sawMidnightSun: state.sawMidnightSun || s.daylight >= 23.9,
      sawPolarNight: state.sawPolarNight || s.daylight <= 0.1,
    };
  },

  readouts(state, params) {
    const s = snapshot(state, params);
    return [
      {
        key: "day", label: "Day of the year", quantity: q(s.day * DAY, "time"), unit: "d",
        semantic: "time", graphable: true,
      },
      {
        key: "daylight", label: "Hours of daylight", quantity: q(s.daylight * 3600, "time"), unit: "h",
        semantic: "light", graphable: true,
      },
      {
        key: "sunAngle", label: "Sun height at noon", quantity: q(Math.max(0, s.altitude), "angle"), unit: "°",
        semantic: "light", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "declination", label: "Sun overhead at latitude", quantity: q(s.declination, "angle"), unit: "°",
        semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "distance", label: "Distance to the Sun", quantity: q(s.distanceAU * CONSTANTS.au, "length"), unit: "au",
        semantic: "distance", graphable: true, bands: ["3-5", "6-8", "9-12"],
      },
      {
        key: "noonIntensity", label: "Noon sunlight (W/m²)", quantity: q(s.noonIntensity, "ratio"),
        semantic: "light", graphable: true, bands: ["9-12"],
      },
      {
        key: "insolation", label: "Daily sunlight (W/m²)", quantity: q(s.insolation, "ratio"),
        semantic: "energy-total", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const s = snapshot(state, params);
    const latitude = params.latitude as number;
    return {
      day: s.day,
      daysElapsed: state.elapsed,
      season: seasonName(s.lambda, latitude),
      daylightHours: s.daylight,
      sunAltitudeDeg: s.altitude / DEG,
      declinationDeg: s.declination / DEG,
      distanceAU: s.distanceAU,
      noonIntensity: s.noonIntensity,
      insolation: s.insolation,
      tiltDeg: (params.tilt as number) / DEG,
      latitudeDeg: latitude / DEG,
      midnightSun: s.daylight >= 23.9,
      polarNight: s.daylight <= 0.1,
      daylightSwing: Math.max(0, state.maxDaylight - state.minDaylight),
      sawMidnightSun: state.sawMidnightSun,
      sawPolarNight: state.sawPolarNight,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const ORBIT_SQUASH = 0.42;   // oblique view, so the orbit reads as a loop

/** The orbit, the Sun, and Earth with an axis that never changes direction. */
function drawOrbit(rc: RenderContext<State>, s: Snapshot, x: number, y: number, w: number, h: number) {
  const { ctx, params, theme, band, overlays } = rc;
  const e = ECCENTRICITY[params.orbitShape as string] ?? ECCENTRICITY.real;
  const tilt = params.tilt as number;

  const cx = x + w * 0.5;
  const cy = y + h * 0.5;
  const R = Math.min(w * 0.36, h * 0.68);

  const place = (lambda: number, distanceAU: number) => {
    const theta = lambda + Math.PI / 2;
    return [
      cx + Math.cos(theta) * R * distanceAU,
      cy - Math.sin(theta) * R * distanceAU * ORBIT_SQUASH,
    ] as const;
  };

  /* --- the orbit itself, sampled from the real ellipse ------------- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 180; i++) {
    const d = (i / 180) * YEAR_DAYS;
    const sp = sunPosition(d, e);
    const [px, py] = place(sp.lambda, sp.distanceAU);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  /* --- Sun --------------------------------------------------------- */
  disc(ctx, cx, cy, band === "K-2" ? 22 : 17, theme.sci["light"]);

  /* --- season markers ---------------------------------------------- */
  if (band === "6-8" || band === "9-12") {
    const marks: [number, string][] = [
      [0, "Mar"], [Math.PI / 2, "Jun"], [Math.PI, "Sep"], [(3 * Math.PI) / 2, "Dec"],
    ];
    for (const [lam, name] of marks) {
      const [px, py] = place(lam, 1);
      label(ctx, name, px, py - 16, theme, {
        align: "center", size: 10, color: theme.inkSoft, plate: false,
      });
    }
  }

  /* --- Earth, with the axis fixed in space -------------------------- */
  const [ex, ey] = place(s.lambda, s.distanceAU);
  const earthR = band === "K-2" ? 20 : 16;

  ctx.save();
  ctx.strokeStyle = theme.sci["light"];
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();

  disc(ctx, ex, ey, earthR, theme.sci["liquid"], { stroke: theme.line, lineWidth: 1 });

  // The axis leans by the tilt and always points the same way — that constancy
  // is the entire cause of the seasons, so it is drawn, not described.
  const axX = Math.sin(tilt) * (earthR + 10);
  const axY = Math.cos(tilt) * (earthR + 10);
  ctx.save();
  ctx.strokeStyle = theme.sci["mass"];
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ex - axX, ey + axY);
  ctx.lineTo(ex + axX, ey - axY);
  ctx.stroke();
  ctx.restore();

  // Latitude marker on the globe.
  const latitude = params.latitude as number;
  if (overlays.latitudeMark !== false) {
    const lx = ex + Math.sin(tilt) * 0 + Math.cos(tilt) * 0;
    const ly = ey - Math.sin(latitude) * earthR * Math.cos(tilt);
    disc(ctx, lx, ly, 3.5, theme.sci["acceleration"]);
  }

  if (band !== "K-2") {
    label(ctx, `${s.distanceAU.toFixed(3)} AU`, ex, ey + earthR + 16, theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }
}

/**
 * Parallel sunlight striking the ground at the noon angle. The same beam
 * spreads over a wider patch when the Sun is low, which is why winter is cold
 * even though the Sun is exactly as bright.
 */
function drawSunAngle(rc: RenderContext<State>, s: Snapshot, x: number, y: number, w: number, h: number) {
  const { ctx, theme, band } = rc;
  const groundY = y + h - 26;
  const alt = Math.max(0, s.altitude);

  ctx.save();
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 12, groundY);
  ctx.lineTo(x + w - 12, groundY);
  ctx.stroke();
  ctx.restore();

  if (s.altitude <= 0) {
    label(ctx, "The Sun never rises today", x + w / 2, groundY - 24, theme, {
      align: "center", size: 12, color: theme.sci["cold"],
    });
    return;
  }

  // A beam of fixed width, hitting the ground at the noon altitude.
  const beamWidth = Math.min(46, w * 0.22);
  const footprint = beamWidth / Math.max(0.08, Math.sin(alt));
  const hitX = x + w * 0.45;
  const ux = Math.cos(alt);
  const uy = Math.sin(alt);
  const length = Math.min(h * 0.9, 200);

  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = theme.sci["light"];
  ctx.beginPath();
  ctx.moveTo(hitX, groundY);
  ctx.lineTo(hitX + ux * length - uy * beamWidth, groundY - uy * length - ux * beamWidth);
  ctx.lineTo(hitX + ux * length, groundY - uy * length);
  ctx.lineTo(hitX + Math.min(footprint, w * 0.5), groundY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // The patch of ground the beam has to cover.
  ctx.save();
  ctx.strokeStyle = theme.sci["hot"];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hitX, groundY + 2);
  ctx.lineTo(hitX + Math.min(footprint, w * 0.5), groundY + 2);
  ctx.stroke();
  ctx.restore();

  if (band !== "K-2") {
    label(ctx, `${(alt / DEG).toFixed(0)}° at noon`, x + 12, y + 16, theme, {
      size: 11, color: theme.inkSoft, plate: false,
    });
  }
}

/** Daylight hours across the whole year at the chosen latitude. */
function drawDaylightCurve(rc: RenderContext<State>, s: Snapshot, x: number, y: number, w: number, h: number) {
  const { ctx, params, theme } = rc;
  const e = ECCENTRICITY[params.orbitShape as string] ?? ECCENTRICITY.real;
  const tilt = params.tilt as number;
  const latitude = params.latitude as number;

  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.restore();

  // The 12-hour line: with no tilt the curve sits exactly on it, all year.
  const midY = y + h * 0.5;
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, midY);
  ctx.lineTo(x + w, midY);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.sci["light"];
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 90; i++) {
    const d = (i / 90) * YEAR_DAYS;
    const dec = solarDeclination(d, tilt, e);
    const hours = daylightHours(latitude, dec);
    const px = x + (i / 90) * w;
    const py = y + h - (hours / 24) * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  const markX = x + (s.day / YEAR_DAYS) * w;
  const markY = y + h - (s.daylight / 24) * h;
  disc(ctx, markX, markY, 4, theme.sci["acceleration"]);
  label(ctx, `${s.daylight.toFixed(1)} h`, x + w - 6, y + 11, theme, {
    align: "right", size: 10, color: theme.inkSoft,
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band, overlays } = rc;
  const s = snapshot(state, params);

  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const simple = band === "K-2";
  const orbitW = simple ? width : width * 0.54;

  drawOrbit(rc, s, 0, 0, orbitW, height);

  if (!simple) {
    const rightX = orbitW;
    const rightW = width - orbitW;
    const showCurve = overlays.daylightCurve !== false;
    const curveH = showCurve ? Math.round(height * 0.34) : 0;
    drawSunAngle(rc, s, rightX, 0, rightW, height - curveH - 8);
    if (showCurve) {
      drawDaylightCurve(rc, s, rightX + 8, height - curveH, rightW - 16, curveH - 8);
    }

    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.beginPath();
    ctx.moveTo(orbitW, 10);
    ctx.lineTo(orbitW, height - 10);
    ctx.stroke();
    ctx.restore();

    const facts = model.facts?.(state, params) ?? {};
    label(
      ctx,
      `Day ${Math.round(s.day)}  ·  ${facts.season}  ·  ${s.daylight.toFixed(1)} h of daylight`,
      8, 16, theme, { size: 11, color: theme.inkSoft },
    );
    if ((params.tilt as number) < 0.5 * DEG) {
      label(ctx, "No tilt — no seasons", 8, 36, theme, {
        size: 11, color: theme.sci["cold"],
      });
    }
  } else {
    label(ctx, `${s.daylight.toFixed(0)} hours of sunshine`, width / 2, height - 20, theme, {
      align: "center", size: 16,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const seasonsSim: SimManifest<State> = {
  id: "earth.seasons",
  title: "Seasons & Sun Angle",
  tagline: "Tilt the Earth, pick a latitude, and find out what really makes summer summer.",
  subject: "earth",
  bands: ["K-2", "3-5", "6-8", "9-12"],
  grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  standards: {
    ngss: ["1-ESS1-2", "5-ESS1-2", "MS-ESS1-1", "HS-ESS1-4"],
  },
  learningGoals: [
    "Explain the seasons in terms of the tilt of Earth's axis, not its distance from the Sun.",
    "Predict day length and noon sun angle for any latitude and any day.",
    "Explain why the poles get midnight sun and polar night.",
  ],
  misconceptions: [
    "Summer happens when Earth is closer to the Sun",
    "The tilt changes through the year",
    "Both hemispheres have summer at the same time",
    "The Sun is directly overhead at noon everywhere",
  ],
  interactionHint: "Press play to run a year, then drag the tilt down to zero.",
  tickRate: 60,
  timeScale: 1,
  params: {
    tilt: {
      type: "number", label: "Axis tilt", kind: "angle", unit: "°",
      min: 0, max: 45 * DEG, step: 0.5 * DEG, default: EARTH_OBLIQUITY,
      marks: [
        { value: 0, label: "None" },
        { value: EARTH_OBLIQUITY, label: "Earth" },
        { value: 45 * DEG, label: "Extreme" },
      ],
      help: "Set this to zero and the seasons disappear completely. Try it.",
    },
    latitude: {
      type: "number", label: "Latitude", kind: "angle", unit: "°",
      min: -90 * DEG, max: 90 * DEG, step: DEG, default: 40 * DEG,
      marks: [
        { value: 0, label: "Equator" },
        { value: 23.44 * DEG, label: "Tropic" },
        { value: 66.56 * DEG, label: "Arctic Circle" },
        { value: 90 * DEG, label: "North Pole" },
      ],
      help: "Where on Earth you are standing. Negative is the southern hemisphere.",
    },
    rate: {
      type: "number", label: "Days per second", kind: "ratio",
      min: 0, max: 60, step: 1, default: 12,
      help: "Set this to 0 and use the Day slider to step through by hand.",
    },
    startDay: {
      type: "number", label: "Day", kind: "time", unit: "d",
      min: 0, max: 365 * DAY, step: 0.5 * DAY, default: 0,
      hideValueBands: ["K-2"],
    },
    orbitShape: {
      type: "option", label: "Orbit shape",
      options: [
        { value: "real", label: "Real Earth" },
        { value: "circle", label: "Perfect circle" },
        { value: "extreme", label: "Very stretched" },
      ],
      default: "real",
      bands: ["3-5", "6-8", "9-12"],
      help: "Test the distance idea: stretch the orbit and see whether the seasons follow it.",
    },
  },
  overlays: [
    { key: "daylightCurve", label: "Daylight through the year", default: true, bands: ["3-5", "6-8", "9-12"] },
    { key: "latitudeMark", label: "Your latitude", default: true, bands: ["3-5", "6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "what-causes-seasons",
      title: "What causes the seasons?",
      question: "Is summer warm because Earth is closer to the Sun, or because of the tilt?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 25,
      standards: ["MS-ESS1-1"],
      setup: { tilt: EARTH_OBLIQUITY, latitude: 40 * DEG, rate: 12, startDay: 0, orbitShape: "real" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you test anything.",
          predict: {
            prompt: "Why is it warmer in summer?",
            options: [
              "Earth is closer to the Sun in summer",
              "The Sun burns hotter in summer",
              "Our half of Earth is tilted toward the Sun, so sunlight arrives more steeply",
            ],
            correct: 2,
            reveal:
              "It is the tilt. Earth is actually closest to the Sun in early January, in the middle of the northern winter.",
          },
        },
        {
          id: "test-distance",
          phase: "measure",
          title: "Test the distance idea",
          instruction: "Set the orbit to Very stretched and run a year. Record distance and daylight.",
          check: {
            describe: "Orbit set to Very stretched",
            test: (v) => v.params.orbitShape === "extreme",
          },
          requireData: 4,
          hints: [
            "The distance now swings enormously. Do the daylight hours follow it?",
            "Check which day of the year Earth is closest.",
          ],
        },
        {
          id: "test-tilt",
          phase: "setup",
          title: "Now test the tilt",
          instruction: "Put the orbit back to Real Earth and set the tilt to zero.",
          check: {
            describe: "Tilt at zero on the real orbit",
            test: (v) => (v.params.tilt as number) < 0.01 && v.params.orbitShape === "real",
          },
        },
        {
          id: "observe-flat",
          phase: "measure",
          title: "Run a year with no tilt",
          instruction: "Record the daylight hours on four different days.",
          requireData: 8,
          hints: ["Look at the daylight curve. What shape is it now?"],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say which one actually causes the seasons, using your data.",
          write: {
            prompt: "Which changed the seasons — the distance or the tilt? How do you know?",
            placeholder: "When I stretched the orbit ... but when I set the tilt to zero ...",
          },
        },
      ],
    },
    {
      id: "poles-vs-equator",
      title: "Compare the poles with the equator",
      question: "How different is a year at the equator from a year at the pole?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-ESS1-1", "HS-ESS1-4"],
      setup: { tilt: EARTH_OBLIQUITY, latitude: 0, rate: 12, startDay: 0, orbitShape: "real" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Answer before you move the latitude slider.",
          predict: {
            prompt: "How much does day length change over a year at the equator?",
            options: [
              "From 24 hours to 0 hours",
              "From about 14 hours to about 10 hours",
              "Hardly at all — about 12 hours every day",
            ],
            correct: 2,
            reveal:
              "Almost not at all. The equator is equally tilted toward and away from the Sun, so it gets roughly twelve hours of daylight all year round.",
          },
        },
        {
          id: "equator",
          phase: "measure",
          title: "A year at the equator",
          instruction: "Run a full year at latitude 0 and record the daylight four times.",
          requireData: 4,
        },
        {
          id: "pole",
          phase: "measure",
          title: "A year at the North Pole",
          instruction: "Set the latitude to 90° and run a year. Record four more.",
          check: {
            describe: "Latitude at or above 85°",
            test: (v) => (v.params.latitude as number) >= 85 * DEG,
          },
          requireData: 8,
          hints: ["Use the Arctic and Pole marks under the latitude slider."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say why the two places are so different.",
          write: {
            prompt: "Why does the pole get six months of daylight while the equator never does?",
            placeholder: "At the pole the axis ... so the Sun ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "midnight-sun",
      title: "Midnight sun",
      brief: "Find a place above the Arctic Circle and a day when the Sun never sets.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { tilt: EARTH_OBLIQUITY, latitude: 55 * DEG, rate: 0, startDay: 0, orbitShape: "real" },
      goal: {
        describe: "Latitude above 66.5° with 24 hours of daylight",
        test: (v) =>
          (v.params.latitude as number) >= 66.56 * DEG && (v.facts.daylightHours as number) >= 23.9,
      },
      stars: {
        two: {
          describe: "Do it at exactly the Arctic Circle, within one degree",
          test: (v) =>
            (v.params.latitude as number) >= 66.56 * DEG &&
            (v.params.latitude as number) <= 67.56 * DEG &&
            (v.facts.daylightHours as number) >= 23.9,
        },
        three: {
          describe: "Also find a polar night at the same place",
          test: (v) =>
            (v.params.latitude as number) >= 66.56 * DEG &&
            Boolean(v.facts.sawMidnightSun) && Boolean(v.facts.sawPolarNight),
        },
      },
      hints: [
        "The Arctic Circle is at 66.5°, which is 90° minus the tilt.",
        "Set Days per second to 0 and scrub the Day slider toward late June.",
      ],
    },
    {
      id: "no-seasons",
      title: "Build a world without seasons",
      brief: "Find a setting where the daylight barely changes all year — anywhere on the planet.",
      bands: ["6-8", "9-12"],
      setup: { tilt: EARTH_OBLIQUITY, latitude: 55 * DEG, rate: 24, startDay: 0, orbitShape: "extreme" },
      goal: {
        describe: "A full year run with less than 1 hour of change in day length at latitude 45° or higher",
        test: (v) =>
          (v.facts.daysElapsed as number) >= 365 &&
          Math.abs(v.params.latitude as number) >= 45 * DEG &&
          (v.facts.daylightSwing as number) < 1,
      },
      hints: [
        "The orbit shape is a decoy. Try the other slider.",
        "The tilt is what makes one hemisphere lean toward the Sun.",
      ],
    },
  ],
};
