import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit E · Topic E1 — The Earth-Sun-Moon system.
 *
 * Five simulations, one per subtopic:
 *
 *   E1.1  g8e1-new-to-full        the lunar cycle              (investigate)
 *   E1.2  g8e1-ball-and-lamp      modelling lunar phases       (assemble)
 *   E1.3  g8e1-two-shadows        solar and lunar eclipses     (compare)
 *   E1.4  g8e1-five-degrees-out   why not an eclipse a month   (process)
 *   E1.5  g8e1-tide-gauge         tides                        (investigate)
 *
 * Every number here is the real one: the synodic month is 29.530588 days, the
 * Sun and Moon really do subtend 0.533 and 0.518 degrees, Earth's umbra at the
 * Moon really is 0.70 degrees across the radius, and the Moon's orbit really
 * is tilted 5.145 degrees, which is the whole reason eclipses are rare.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed the run's elapsed time but not its progress, and at the
 * default Speed of 0.6 the engine advances progress by 0.096 every second. So
 * this is exactly the rail's position, and the apparatus moves through the
 * process in step with the captions underneath it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/** Blend two hex colours; k = 0 gives a, k = 1 gives b. */
function mix(a: string, b: string, k: number): string {
  const c = k < 0 ? 0 : k > 1 ? 1 : k;
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const hx = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hx(ch(a, 0) + (ch(b, 0) - ch(a, 0)) * c)}${
    hx(ch(a, 1) + (ch(b, 1) - ch(a, 1)) * c)}${
    hx(ch(a, 2) + (ch(b, 2) - ch(a, 2)) * c)}`;
}

/**
 * Round to `n` steps.
 *
 * A driven colour is part of the 3D subject's cache key, so a colour that
 * changes on every frame would build a new lit sphere every frame. Twelve
 * steps is more than the eye separates and costs twelve cached subjects.
 */
const stepped = (x: number, n: number) => Math.round(x * n) / n;

/* ---------------------------------------------------------------- *
 * E1.1 — The lunar cycle
 * ---------------------------------------------------------------- */

const NEW_TO_FULL: ArchetypeSpec = {
  id: "g8e1-new-to-full",
  title: "New to Full in 14.8 Days",
  tagline: "Swing the Moon round from the Sun and watch how much of the lit half you can see.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Explain that half the Moon is always lit, and the phase is how much of that half faces Earth.",
    "Connect the angle between Sun, Earth and Moon to the phase and to the time the Moon rises.",
  ],
  misconceptions: [
    "The phases are Earth's shadow falling on the Moon",
    "The Moon has a permanently dark half that never sees the Sun",
  ],
  specimens: [{
    id: "moon", name: "The Moon in its orbit",
    art: { art: "planet", color: "#c9c4b8" },
  }],
  variables: [
    {
      key: "elongation", label: "Angle Sun-Earth-Moon", unit: "degrees",
      min: 0, max: 180, step: 5, default: 90,
    },
  ],
  /*
   * The lit fraction of a sphere seen at elongation e is (1 - cos e) / 2 —
   * exactly zero at new moon, exactly a half at either quarter, exactly one at
   * full. The Moon covers 360 degrees of elongation in one synodic month of
   * 29.530588 days, so the angle and the date of the month are the same fact.
   * It rises 24 / 29.530588 = 0.813 hours — about 49 minutes — later each day,
   * which is why the new Moon rises at dawn and the full Moon at sunset.
   */
  measure: (v) => {
    const rad = (v.elongation * Math.PI) / 180;
    const day = (29.530588 * v.elongation) / 360;
    return {
      illuminatedPercent: ((1 - Math.cos(rad)) / 2) * 100,
      dayOfTheMonth: day,
      moonriseClockHour: (6 + 0.812723 * day) % 24,
      nightsUntilFull: 14.765294 - day,
      degreesPerDay: 12.1907,
    };
  },
  plot: {
    x: "elongation", y: "illuminatedPercent",
    xLabel: "Angle Sun-Earth-Moon (degrees)", yLabel: "Lit face we can see (%)",
  },
  /*
   * The Moon actually goes round. Its position on the ellipse is the angle
   * set — new moon out towards the Sun on the right, full moon opposite on the
   * left — and the disc is drawn at the brightness of the lit fraction we can
   * see from here, black at new and full silver at full. Nothing about the
   * Moon itself changes: only where it is standing.
   */
  drive: ({ v, f }) => {
    const a = (v.elongation * Math.PI) / 180;
    return {
      offset: [Math.cos(a) * 0.8, -Math.sin(a) * 0.46],
      color: mix("#31303a", "#efe9d6", stepped(f.illuminatedPercent / 100, 12)),
      rate: 0.5,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E1.2 — Modelling lunar phases
 * ---------------------------------------------------------------- */

const BALL_AND_LAMP: ArchetypeSpec = {
  id: "g8e1-ball-and-lamp",
  title: "A Ball, a Lamp and Your Head",
  tagline: "Build the classroom model that puts every phase on a polystyrene ball.",
  kind: "assemble",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Set up a physical model of the Sun, Earth and Moon and use it to produce every phase.",
    "Explain which part of the model stands for which part of the real system.",
  ],
  misconceptions: [
    "A model has to be the right size to be any use",
    "You would see an eclipse at every turn of the ball",
  ],
  specimens: [{
    id: "ball",
    name: "The ball on its stick — the Moon",
    art: { art: "planet", color: "#d6d1c4" },
    parts: [
      { id: "lamp", name: "The lamp is the Sun", at: [-0.74, -0.3],
        note: "One bare bulb, no shade, at head height across the room. Sunlight arrives from one direction only, and that is the whole point: half the ball is lit and half is dark, always." },
      { id: "head", name: "Your head is the Earth", at: [0.76, 0.16],
        note: "You stand in the middle. Whatever you can see of the lit half of the ball is the phase — so the phase is about where you are standing, not about any shadow." },
      { id: "hold", name: "Hold the ball just above your shadow", at: [0.02, -0.72],
        note: "Lift it about 20 degrees above the line to the lamp. The real Moon's orbit is tilted 5.145 degrees, so it usually passes above or below your head's shadow rather than through it." },
      { id: "turn", name: "Turn slowly to your left", at: [0.66, -0.5],
        note: "One full turn is one synodic month, 29.530588 days. The ball never changes; only your view of it does, and that is the entire lunar cycle." },
      { id: "new", name: "Ball toward the lamp: new moon", at: [-0.6, 0.44],
        note: "The lit half faces away from you and you see 0 per cent of it. In the sky the new Moon is only 0 to 5 degrees from the Sun, which is why you cannot see it at all." },
      { id: "full", name: "Ball away from the lamp: full moon", at: [0.5, 0.6],
        note: "The lit half faces you and you see 100 per cent of it. The full Moon rises as the Sun sets, 12 hours after the new Moon rose, because it sits 180 degrees round the sky." },
    ],
  }],
  /*
   * Model or not, the ball must behave like the Moon: it turns slowly, taking
   * about the same time to spin once as to go once round, so the same face is
   * always toward the observer. That is why the model works at all.
   */
  drive: ({ t }) => ({ rate: 0.35, tilt: 0.2 + 0.05 * Math.sin(t * 0.5) }),
};

/* ---------------------------------------------------------------- *
 * E1.3 — Solar and lunar eclipses
 * ---------------------------------------------------------------- */

/**
 * The area two overlapping discs share, in the same units as their radii
 * squared. Standard circle-circle intersection: the sum of the two circular
 * segments, less the kite between the intersection points.
 */
function discOverlap(a: number, b: number, d: number): number {
  if (d >= a + b) return 0;
  if (d <= Math.abs(a - b)) return Math.PI * Math.min(a, b) * Math.min(a, b);
  const a2 = a * a, b2 = b * b, d2 = d * d;
  return a2 * Math.acos((d2 + a2 - b2) / (2 * d * a))
    + b2 * Math.acos((d2 + b2 - a2) / (2 * d * b))
    - 0.5 * Math.sqrt((-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b));
}

const TWO_SHADOWS: ArchetypeSpec = {
  id: "g8e1-two-shadows",
  title: "Two Shadows, Two Eclipses",
  tagline: "Slide the Moon off the line and watch both eclipses switch off together.",
  kind: "compare",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Distinguish a solar eclipse (Moon's shadow on Earth) from a lunar eclipse (Earth's shadow on the Moon).",
    "Explain why both need the three bodies within about half a degree of a straight line.",
  ],
  misconceptions: [
    "A lunar eclipse is the Moon passing in front of the Sun",
    "An eclipse can happen at any phase of the Moon",
  ],
  variables: [
    {
      key: "offsetDeg", label: "How far off the straight line the Moon sits", unit: "degrees",
      min: 0, max: 2, step: 0.05, default: 0.3,
    },
  ],
  /*
   * Real angular sizes, all measured from Earth. The Sun's disc is 0.533
   * degrees across, so its radius is 0.2665; the Moon at its mean distance of
   * 384 400 km is 0.518 across, radius 0.2590 — very slightly the smaller,
   * which is why a dead-central eclipse at mean distance is annular and leaves
   * 5.5 per cent of the Sun showing as a ring. Earth's umbra where the Moon
   * crosses it has an angular radius of about 0.70 degrees, some 2.7 times the
   * Moon's own, so a lunar eclipse is total over a much wider band of
   * alignment than a solar one — and lasts more than an hour rather than
   * minutes.
   */
  measure: (v) => {
    const sunR = 0.2665, moonR = 0.2590, umbraR = 0.70;
    const s = v.offsetDeg;
    const covered = discOverlap(sunR, moonR, s) / (Math.PI * sunR * sunR);
    return {
      sunCoveredPercent: covered * 100,
      lunarUmbralMagnitude: Math.max(0, (umbraR + moonR - s) / (2 * moonR)),
      sunAngularDiameterDeg: 2 * sunR,
      moonAngularDiameterDeg: 2 * moonR,
      solarEclipseLimitDeg: sunR + moonR,
      lunarEclipseLimitDeg: umbraR + moonR,
    };
  },
  specimens: [
    {
      id: "solar", name: "New moon: the Moon's shadow falls on Earth",
      because: "A solar eclipse. The Moon is 400 times smaller than the Sun and 400 times nearer, so the two discs are almost exactly the same size and the cover is nearly perfect. Its shadow is only about 100 km wide where it lands.",
      art: { art: "planet", color: "#ffd45e", atmosphere: "#ffefb0" },
    },
    {
      id: "lunar", name: "Full moon: Earth's shadow falls on the Moon",
      because: "A lunar eclipse. Earth's umbra is 2.7 times wider than the Moon, so the Moon sits inside it for over an hour and turns copper — the only sunlight reaching it has been bent through every sunrise and sunset on Earth at once.",
      art: { art: "planet", color: "#d5d0c4" },
    },
  ],
  /*
   * Both pictures answer the same slider. The left disc is the Sun, and it
   * darkens by exactly the fraction of its area the Moon covers, so at perfect
   * alignment 94 per cent of it goes out. The right disc is the Moon, and it
   * goes copper as it sinks into Earth's umbra. Slide past 0.53 degrees and
   * the solar eclipse stops; past 0.96 and the lunar eclipse stops too — which
   * is exactly how narrow the window is.
   */
  drive: ({ f, index }) => index === 0
    ? { color: mix("#ffd45e", "#221d29", stepped(f.sunCoveredPercent / 100, 12)) }
    : { color: mix("#d5d0c4", "#8c3a1c", stepped(Math.min(1, f.lunarUmbralMagnitude), 12)) },
};

/* ---------------------------------------------------------------- *
 * E1.4 — Why an eclipse does not happen every month
 * ---------------------------------------------------------------- */

const FIVE_DEGREES_OUT: ArchetypeSpec = {
  id: "g8e1-five-degrees-out",
  title: "Five Degrees Out of Line",
  tagline: "Follow the Moon for six months and see how rarely it is on the line at the right moment.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Explain that the Moon's orbit is tilted 5.145 degrees to Earth's orbit around the Sun.",
    "Explain why eclipses come in seasons about 173 days apart rather than once a month.",
  ],
  misconceptions: [
    "There should be a solar eclipse at every new moon",
    "The Moon orbits in exactly the same plane as Earth",
  ],
  specimens: [{ id: "moon", name: "The Moon on its tilted orbit", art: { art: "planet", color: "#cec9bd" } }],
  stages: [
    { name: "New moon, high", at: 0,
      caption: "New moon, but the Moon is 4.6 degrees north of the line. Its shadow passes 30 000 km above the north pole and misses Earth completely." },
    { name: "Full moon, low", at: 0.25,
      caption: "Two weeks on, full moon 4.9 degrees south. It sails under Earth's umbra with room to spare. No eclipse either way." },
    { name: "Nearing a node", at: 0.5,
      caption: "The Moon crosses Earth's orbital plane twice a month, at the two nodes. Month by month the syzygies creep closer to one of them." },
    { name: "Eclipse season", at: 0.75,
      caption: "New moon within 0.53 degrees of the node: the shadow lands. Eclipse seasons open about every 173.3 days and last around 34 days." },
    { name: "Past it again", at: 1,
      caption: "The nodes drift westward, one full circuit in 18.6 years, and the alignment is lost until the next season comes round." },
  ],
  /*
   * The real two-clock problem, run at 173.3 days per pass of the rail. The
   * Moon returns to the same node every 27.2122 days (the draconic month) but
   * to the same phase every 29.5306 (the synodic month), so a new moon lands
   * on a node only when the two clocks agree. Height on the stage is the
   * Moon's ecliptic latitude, the full 5.145 degrees of tilt; sideways is its
   * phase. It goes copper only in the few frames where it is both on the line
   * and at a syzygy — which is exactly how rare eclipses are.
   */
  drive: ({ t }) => {
    const days = railPhase(t) * 173.3;
    const lat = 5.145 * Math.sin((2 * Math.PI * days) / 27.2122);
    const phase = (2 * Math.PI * days) / 29.530588;
    const nearLine = Math.max(0, 1 - Math.abs(lat) / 0.95);
    const atSyzygy = Math.abs(Math.cos(phase));
    return {
      offset: [Math.cos(phase) * 0.82, (-lat / 5.145) * 0.5],
      color: mix("#cec9bd", "#8c3a1c", stepped(nearLine * atSyzygy, 8)),
      rate: 0.6,
    };
  },
};

/* ---------------------------------------------------------------- *
 * E1.5 — Tides
 * ---------------------------------------------------------------- */

const TIDE_GAUGE: ArchetypeSpec = {
  id: "g8e1-tide-gauge",
  title: "Six Hours and Thirteen Minutes",
  tagline: "Watch a tide gauge at Dover drain from high water to low, and find what sets the range.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS1-1"] },
  learningGoals: [
    "Explain that the Moon raises two tidal bulges, so most coasts get two high tides every 24 h 50 min.",
    "Explain why the tidal range swings between spring and neap over the 14.77-day half-month.",
  ],
  misconceptions: [
    "There is one high tide a day, on the side facing the Moon",
    "Spring tides happen in the spring",
  ],
  specimens: [{
    id: "gauge", name: "The float in the stilling well",
    art: { art: "glassware", which: "testTube", level: 0.8, color: "#2e7f96" },
  }],
  variables: [
    {
      key: "hours", label: "Hours since high water", unit: "h",
      min: 0, max: 6.2103, step: 0.05, default: 0,
    },
    {
      key: "moonAge", label: "Days since the new moon", unit: "days",
      min: 0, max: 14.7653, step: 0.25, default: 0,
    },
  ],
  /*
   * Two real tidal constituents. M2, the principal lunar semidiurnal tide, has
   * a period of 12.4206 hours — half a lunar day — so high water to low water
   * takes 6.2103 hours and the whole pattern slips 50 minutes later each day.
   * S2, the solar one, runs at exactly 12 hours, and the two drift in and out
   * of step over 14.765 days: in step at new and full moon (spring tides), out
   * of step at the quarters (neap). Dover's mean spring range is 6.0 m and its
   * mean neap range 3.2 m, about mean sea level at 3.7 m above chart datum,
   * which is what these amplitudes reproduce.
   */
  measure: (v) => {
    const amplitude = 2.3 + 0.7 * Math.cos((2 * Math.PI * v.moonAge) / 14.765294);
    return {
      heightM: 3.7 + amplitude * Math.cos((2 * Math.PI * v.hours) / 12.4206),
      rangeM: 2 * amplitude,
      tidalPeriodHours: 12.4206,
      minutesLaterEachDay: 50.47,
      sunPullShareOfMoons: 0.46,
    };
  },
  plot: {
    x: "hours", y: "heightM",
    xLabel: "Hours since high water", yLabel: "Sea level (m above chart datum)",
  },
  /*
   * The gauge is the readout. Its float sits at the real sea level, from 6.7 m
   * at a spring high water down to 0.7 m at a spring low, and the tube is
   * scaled to that whole 6 m swing. Move the second control to the first
   * quarter and the same six hours only move the float half as far: that is
   * the difference between a spring tide and a neap.
   */
  drive: ({ f }) => ({
    level: Math.max(0.03, Math.min(0.97, (f.heightM - 0.4) / 6.6)),
    color: "#2e7f96",
  }),
};

export const g8e1NewToFull = buildSim(NEW_TO_FULL);
export const g8e1BallAndLamp = buildSim(BALL_AND_LAMP);
export const g8e1TwoShadows = buildSim(TWO_SHADOWS);
export const g8e1FiveDegreesOut = buildSim(FIVE_DEGREES_OUT);
export const g8e1TideGauge = buildSim(TIDE_GAUGE);
