import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit F · Topic F4 — Evaluating competing solutions.
 *
 * Five simulations, one per subtopic:
 *
 *   F4.1  g7f4-three-ways-to-win   generating more than one candidate  (sort)
 *   F4.2  g7f4-what-do-you-value   a systematic scoring process        (investigate)
 *   F4.3  g7f4-same-table-two-runs analyzing test data across designs  (compare)
 *   F4.4  g7f4-best-of-each        combining the best characteristics  (assemble)
 *   F4.5  g7f4-making-the-case     presenting a recommendation         (process)
 *
 * The same three tenders for the F3 school run through all five: a braced
 * frame, added viscous dampers, and base isolation. Their accelerations are
 * read off the ASCE 7 design spectrum and divided by the code's damping
 * coefficient B, so the ranking in F4.2 is arithmetic a student can redo.
 */

/* ---------------------------------------------------------------- *
 * F4.1 — Generating more than one candidate
 * ---------------------------------------------------------------- */

const THREE_WAYS_TO_WIN: ArchetypeSpec = {
  id: "g7f4-three-ways-to-win",
  title: "Three Ways to Beat a Shake",
  tagline: "Six real devices, three completely different ideas about how to survive.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2"] },
  learningGoals: [
    "Group earthquake-resisting devices by the strategy they use, not by how they look.",
    "Explain that several very different designs can meet the same brief.",
  ],
  misconceptions: [
    "There is one right answer to an engineering problem",
    "Stronger is the only way to survive an earthquake",
  ],
  categories: [
    { id: "strong", name: "Meet the force", hint: "carry it with more steel or concrete" },
    { id: "slow", name: "Dodge the force", hint: "lengthen the period so less arrives" },
    { id: "soak", name: "Soak it up", hint: "turn the motion into heat" },
  ],
  specimens: [
    {
      id: "tmd", name: "Taipei 101's 660 tonne pendulum", category: "soak",
      because:
        "A steel sphere 5.5 m across hangs on cables and swings a beat behind the tower, pulling "
        + "back on it and pushing oil through dampers. Peak sway falls by around 40 per cent.",
      art: { art: "sphere", color: "#b9a05e", radius: 0.58, glow: 0.22 },
    },
    {
      id: "braced", name: "A steel braced frame", category: "strong",
      because:
        "Diagonals turn bending into simple pushing and pulling along straight members, which steel "
        + "does far better. It is the cheapest of the three ideas and the stiffest.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "wall", name: "A 250 mm concrete shear wall", category: "strong",
      because:
        "The wall carries the storey's sideways force in its own plane. Its strength is proved on "
        + "150 by 300 mm cylinders crushed at 28 days, which is where 30 MPa concrete gets its name.",
      art: { art: "glassware", which: "testTube", level: 0.88, color: "#b6b2a6" },
    },
    {
      id: "isolators", name: "Lead-rubber bearings under the columns", category: "slow",
      because:
        "Rubber layers make the base soft sideways and stiff vertically, moving the period from "
        + "0.4 s to about 2.5 s. On this site the spectrum then gives 0.24 g instead of 1.0 g.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "dampers", name: "Viscous dampers between the floors", category: "soak",
      because:
        "A piston forces oil through an orifice, so the force resists speed rather than position. "
        + "Damping goes from 5 to about 20 per cent, and ASCE 7 then divides the response by 1.5.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "pendulum", name: "Friction pendulum sliders", category: "slow",
      because:
        "A steel puck slides on a dish, and the dish's radius alone sets the period: T = 2 pi root "
        + "R over g. A 1.55 m radius gives 2.5 s whatever the building on top of it weighs.",
      art: { art: "sphere", color: "#aeb6c2", radius: 0.46, glow: 0.18 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F4.2 — A systematic scoring process
 * ---------------------------------------------------------------- */

const WHAT_DO_YOU_VALUE: ArchetypeSpec = {
  id: "g7f4-what-do-you-value",
  title: "What Do You Value?",
  tagline: "Slide the weight from money to safety and watch the winning design change.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2", "MS-ETS1-3"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Score competing designs against weighted criteria and find where the ranking flips.",
    "Explain that a scoring matrix makes a judgement visible rather than removing it.",
  ],
  misconceptions: [
    "A scoring matrix gives the objectively correct answer",
    "The design that performs best always wins",
  ],
  specimens: [
    { id: "demand", name: "The shaking all three have to survive",
      art: { art: "landform", which: "quake" } },
  ],
  variables: [
    { key: "safetyWeight", label: "Weight given to safety (%)", min: 0, max: 100, step: 5, default: 50 },
    { key: "sd1", label: "Site hazard SD1 (g)", min: 0.3, max: 1, step: 0.05, default: 0.6 },
  ],
  /*
   * Three tenders for the same school, all read off the ASCE 7 design spectrum
   * with SDS = 1.0 g and the site's SD1 as the second control:
   *
   *   braced frame   T = 0.35 s, damping 5 per cent   B = 1.0
   *   added dampers  T = 0.40 s, damping 22 per cent  B = 1.54
   *   base isolated  T = 2.50 s, damping 20 per cent  B = 1.5
   *
   * B is the damping coefficient of ASCE 7 Table 17.5-1, where 5 per cent
   * gives 1.0, 20 per cent gives 1.5 and 30 per cent gives 1.7. Relative cost
   * is the tendered price with the braced frame as 1.0. Each design is scored
   * against the best performer on each criterion, so the best score is 1.
   *
   * At the default site the ranking flips at a safety weight near 42 per cent:
   * below it the braced frame wins on price, above it isolation wins on the
   * 0.16 g it puts into the classrooms against the braced frame's 1.0 g.
   */
  measure: (v) => {
    const SDS = 1.0;
    const Ts = v.sd1 / SDS, T0 = 0.2 * Ts;
    const sa = (T: number) =>
      T < T0 ? SDS * (0.4 + (0.6 * T) / T0) : T <= Ts ? SDS : v.sd1 / T;
    const aBraced = sa(0.35) / 1.0;
    const aDampers = sa(0.4) / 1.54;
    const aIsolated = sa(2.5) / 1.5;
    const cBraced = 1.0, cDampers = 1.6, cIsolated = 2.6;
    const bestA = Math.min(aBraced, aDampers, aIsolated);
    const w = v.safetyWeight / 100;
    const score = (a: number, c: number) => w * (bestA / a) + (1 - w) * (cBraced / c);
    const sBraced = score(aBraced, cBraced);
    const sIsolated = score(aIsolated, cIsolated);
    return {
      scoreBraced: sBraced,
      scoreDampers: score(aDampers, cDampers),
      scoreIsolated: sIsolated,
      isolatedMinusBraced: sIsolated - sBraced,
      accelBracedG: aBraced,
      accelDampersG: aDampers,
      accelIsolatedG: aIsolated,
      isolatorTravelMm: ((sa(2.5) * 9.81 * 6.25) / (4 * Math.PI * Math.PI) / 1.5) * 1000,
    };
  },
  plot: {
    x: "safetyWeight", y: "isolatedMinusBraced",
    xLabel: "Weight given to safety (%)", yLabel: "Isolation score minus braced-frame score",
  },
  /*
   * The scoring weight is an opinion and changes nothing on the ground, so the
   * shaking on the bench answers only to the site: raise SD1 and the wave field
   * grows and the bench moves harder. That separation is deliberate. A scoring
   * matrix cannot make an earthquake smaller.
   */
  drive: ({ v, f, t }) => {
    const amp = Math.min(0.16, f.accelBracedG * 0.13);
    return {
      scale: 0.7 + v.sd1 * 0.75,
      offset: [Math.sin(t * 7.5) * amp, Math.sin(t * 11.3) * amp * 0.4],
    };
  },
};

/* ---------------------------------------------------------------- *
 * F4.3 — Analyzing test data across designs
 * ---------------------------------------------------------------- */

const SAME_TABLE_TWO_RUNS: ArchetypeSpec = {
  id: "g7f4-same-table-two-runs",
  title: "Same Table, Two Runs",
  tagline: "Both models survived. Read the second column before you call it a draw.",
  kind: "compare",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-3"] },
  learningGoals: [
    "Compare designs on more than one measurement from the same controlled test.",
    "Explain why survival of the structure is not the only result that matters.",
  ],
  misconceptions: [
    "If both designs stayed standing, the test cannot separate them",
    "The stiffer model always does better on a shake table",
  ],
  specimens: [
    {
      id: "braced", name: "Braced frame: 2.5 times the table",
      because: "It stands. The shelves do not: 1.00 g throws loose objects.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "isolated", name: "Isolated: 0.4 times the table",
      because: "A sixth of the acceleration, paid for with 249 mm of slide.",
      art: { art: "apparatus", which: "spring" },
    },
  ],
  variables: [
    { key: "tableG", label: "Peak table acceleration (g)", min: 0.05, max: 1, step: 0.05, default: 0.4 },
  ],
  /*
   * Both models take the same table run, and both results come off the same
   * spectrum. A 5 per cent damped structure on rock amplifies the peak ground
   * acceleration by about 2.5 at short periods, the classic Newmark and Hall
   * value, and the plateau falls away as 1/T past the corner at 0.6 s.
   *
   *   braced   T = 0.35 s, 5 per cent damping    roof = 2.5 x table
   *   isolated T = 2.50 s, 20 per cent damping   roof = 2.5 x 0.24 / 1.5 = 0.4 x table
   *
   * At the 0.4 g design run that is 1.00 g against 0.16 g, and the isolators
   * travel 249 mm. Both numbers matter: the first is what the room feels, the
   * second is what the moat must allow. Past a 0.64 g table the travel exceeds
   * a 400 mm moat and the isolated model runs out of room.
   */
  measure: (v) => {
    const saShort = 2.5 * v.tableG;
    const Ts = 0.6;
    const sa = (T: number) => (T <= Ts ? saShort : (saShort * Ts) / T);
    const isolatedSa = sa(2.5) / 1.5;
    const travelMm = ((sa(2.5) * 9.81 * 6.25) / (4 * Math.PI * Math.PI) / 1.5) * 1000;
    return {
      roofBracedG: sa(0.35),
      roofIsolatedG: isolatedSa,
      isolatorTravelMm: travelMm,
      timesQuieter: sa(0.35) / isolatedSa,
      contentsThrown: sa(0.35) > 0.5 ? 1 : 0,
      moatExceeded: travelMm > 400 ? 1 : 0,
    };
  },
  /*
   * The two models are shaken side by side at their own periods: the braced
   * frame buzzes at nearly 3 Hz, the isolated one sways once every 2.5 seconds.
   * When the room passes 0.5 g the braced model leans over and stops, which is
   * the moment its contents become the hazard; when the travel passes 400 mm
   * the isolated model parks against the moat wall and stops for its own reason.
   */
  drive: ({ f, t, index }) => {
    if (index === 0) {
      const amp = Math.min(0.26, f.roofBracedG * 0.2);
      return {
        offset: [f.contentsThrown ? amp : Math.sin(t * 2 * Math.PI * 2.86) * amp, 0],
        tilt: f.contentsThrown ? 0.55 : 0.24,
        rate: f.contentsThrown ? 0 : 1,
      };
    }
    const amp = Math.min(0.4, f.isolatorTravelMm / 800);
    return {
      offset: [f.moatExceeded ? amp : Math.sin(t * 2 * Math.PI * 0.4) * amp, 0],
      rate: f.moatExceeded ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * F4.4 — Combining the best characteristics of each
 * ---------------------------------------------------------------- */

const BEST_OF_EACH: ArchetypeSpec = {
  id: "g7f4-best-of-each",
  title: "Take the Best of Each",
  tagline: "Click the six pieces of the hybrid, and see which tender each one came from.",
  kind: "assemble",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-3"] },
  learningGoals: [
    "Build a combined design from the strongest feature of each competing solution.",
    "Explain why the parts have to be checked together, not only one at a time.",
  ],
  misconceptions: [
    "You must pick one design and discard the others",
    "Combining good features always gives a better whole",
  ],
  specimens: [
    {
      id: "hybrid", name: "The hybrid school",
      art: { art: "apparatus", which: "stand" },
      parts: [
        {
          id: "bearings", name: "Bearings from tender C", at: [-0.58, 0.5],
          note: "Lead-rubber bearings under every column carry the 2.5 s period, which takes the "
            + "classroom acceleration from 1.0 g down to 0.24 g before any damping is counted.",
        },
        {
          id: "dampers", name: "Dampers from tender B", at: [0.58, 0.44],
          note: "Four viscous dampers across the moat add about 20 per cent damping. ASCE 7 then "
            + "divides the response by 1.5, cutting the bearing travel from 373 mm to 249 mm.",
        },
        {
          id: "braces", name: "Braces from tender A", at: [-0.6, -0.02],
          note: "The superstructure still needs to be stiff, or it bends above the bearings instead "
            + "of riding on them. The cheapest tender supplies exactly that, and it stays.",
        },
        {
          id: "pipes", name: "The flexible pipe loops", at: [0.6, -0.08],
          note: "Every water, gas and data line crossing the moat has to take 249 mm of movement "
            + "in any direction. A rigid pipe here would undo the whole scheme in one second.",
        },
        {
          id: "cover", name: "The moat cover", at: [-0.36, -0.5],
          note: "A 400 mm gap around a school is a hazard of its own. Sliding plates keep it flat "
            + "for wheelchairs and prams, and are the reason the accessible route survives.",
        },
        {
          id: "parapet", name: "The anchored parapet and tank", at: [0.32, -0.54],
          note: "Isolation protects what is above it, not what is bolted to it badly. The parapet "
            + "and the 20 tonne tank still need to hold at 0.6 g, which is 118 kN of sideways pull.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F4.5 — Presenting a recommendation with evidence
 * ---------------------------------------------------------------- */

const MAKING_THE_CASE: ArchetypeSpec = {
  id: "g7f4-making-the-case",
  title: "Making the Case",
  tagline: "Five slides to a school board that has to spend the money in public.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-3"] },
  learningGoals: [
    "Structure a recommendation as a claim supported by test evidence and reasoning.",
    "State the trade-off openly rather than letting a reviewer find it.",
  ],
  misconceptions: [
    "The best design speaks for itself",
    "Admitting a weakness loses the argument",
  ],
  specimens: [
    { id: "case", name: "The recommendation", art: { art: "apparatus", which: "bulb" } },
  ],
  stages: [
    {
      name: "The claim", at: 0,
      caption: "Recommend tender C: isolate the school. One sentence, no hedging.",
    },
    {
      name: "The evidence", at: 0.25,
      caption: "Roof acceleration 0.16 g against 1.00 g, from the same shake-table run.",
    },
    {
      name: "The reasoning", at: 0.5,
      caption: "A 2.5 s period draws 0.24 g from the spectrum where 0.4 s draws 1.0 g.",
    },
    {
      name: "The cost owned", at: 0.75,
      caption: "2.6 times the braced frame, and a 400 mm moat the whole way round.",
    },
    {
      name: "The decision", at: 1,
      caption: "The board votes for C: the gym has to be a shelter the night after.",
    },
  ],
};

export const g7f4ThreeWaysToWin = buildSim(THREE_WAYS_TO_WIN);
export const g7f4WhatDoYouValue = buildSim(WHAT_DO_YOU_VALUE);
export const g7f4SameTableTwoRuns = buildSim(SAME_TABLE_TWO_RUNS);
export const g7f4BestOfEach = buildSim(BEST_OF_EACH);
export const g7f4MakingTheCase = buildSim(MAKING_THE_CASE);
