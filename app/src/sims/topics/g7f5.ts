import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit F · Topic F5 — Iterative testing and optimization.
 *
 * Five simulations, one per subtopic:
 *
 *   F5.1  g7f5-shrink-it-properly  developing a model to generate data (investigate)
 *   F5.2  g7f5-find-the-peak       a first round of testing            (investigate)
 *   F5.3  g7f5-round-one-round-two modifying and retesting             (compare)
 *   F5.4  g7f5-what-did-it-cost    naming the trade-off in each change (sort)
 *   F5.5  g7f5-when-to-stop        converging on an optimized design   (process)
 *
 * One shake-table model runs through the whole topic: the F3 school at 1:10,
 * whose 0.665 s full-scale period becomes 0.21 s on the table, or 4.76 Hz. The
 * magnification formula in F5.2 generates every sway figure quoted in F5.3 and
 * F5.5, so the five rounds are one calculation repeated, not five stories.
 */

/* ---------------------------------------------------------------- *
 * F5.1 — Developing a model to generate data
 * ---------------------------------------------------------------- */

const SHRINK_IT_PROPERLY: ArchetypeSpec = {
  id: "g7f5-shrink-it-properly",
  title: "Shrink It Properly",
  tagline: "A tenth-size building is not shaken a tenth as fast. It is shaken 3.16 times faster.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-4"], ccssMath: ["8.EE.A.1"] },
  learningGoals: [
    "Find a building's natural period from its height and check it against the rule of thumb.",
    "Scale a test model correctly, so the data it generates says something about the real building.",
  ],
  misconceptions: [
    "A scale model behaves like the real thing if it just looks the same",
    "Every building sways at the same rate",
  ],
  specimens: [
    { id: "sdof", name: "The model: one mass, one stiffness",
      art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "storeys", label: "Storeys in the real building", min: 1, max: 12, step: 1, default: 4 },
    { key: "modelScale", label: "Model is one part in", min: 2, max: 20, step: 1, default: 10 },
  ],
  /*
   * Period from ASCE 7's approximate formula, Ta = Ct hn^x, which for a steel
   * moment frame in metres is Ct = 0.0724 and x = 0.8. A four-storey school at
   * 4 m a storey is 16 m tall and comes out at 0.665 s; the old rule of thumb,
   * one tenth of a second per storey, says 0.4 s, and the gap between them is
   * why engineers stopped using the rule of thumb.
   *
   * Model scaling is Froude similitude: gravity is the same in the laboratory
   * as on the site, so with a length scale of 1/n, time scales as 1/root n and
   * frequency as root n. A 1:10 model of a 1.50 Hz building must be driven at
   * 4.76 Hz, and its displacements are a tenth of the real ones while its
   * accelerations are exactly the same.
   */
  measure: (v) => {
    const heightM = 4 * v.storeys;
    const periodS = 0.0724 * Math.pow(heightM, 0.8);
    const modelPeriodS = periodS / Math.sqrt(v.modelScale);
    const SDS = 1.0, SD1 = 0.6, Ts = SD1 / SDS;
    const saG = periodS <= Ts ? SDS : SD1 / periodS;
    return {
      buildingHeightM: heightM,
      periodS,
      ruleOfThumbS: 0.1 * v.storeys,
      naturalFrequencyHz: 1 / periodS,
      modelHeightM: heightM / v.modelScale,
      modelPeriodS,
      modelFrequencyHz: 1 / modelPeriodS,
      tableSpeedUp: Math.sqrt(v.modelScale),
      spectralAccelG: saG,
    };
  },
  plot: {
    x: "storeys", y: "periodS",
    xLabel: "Storeys in the real building", yLabel: "Natural period (s)",
  },
};

/* ---------------------------------------------------------------- *
 * F5.2 — A first round of testing
 * ---------------------------------------------------------------- */

const FIND_THE_PEAK: ArchetypeSpec = {
  id: "g7f5-find-the-peak",
  title: "Find the Peak",
  tagline: "Sweep the table slowly upward. At one frequency the model goes ten times further.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-4"], ccssMath: ["8.F.B.5"] },
  learningGoals: [
    "Generate data by sweeping a test through a range and finding the response peak.",
    "Explain why damping matters far more at resonance than anywhere else.",
  ],
  misconceptions: [
    "Shaking a model harder is the only way to test it",
    "Damping makes a building safer at every frequency",
  ],
  specimens: [
    { id: "table", name: "The shake table, 5 mm each way",
      art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "driveHz", label: "Table frequency (Hz)", min: 0.2, max: 9, step: 0.1, default: 4.8 },
    { key: "damping", label: "Damping of the model (%)", min: 2, max: 40, step: 1, default: 5 },
  ],
  /*
   * The 1:10 model from F5.1 has a natural frequency of 4.76 Hz. Driving it at
   * frequency f gives a frequency ratio r = f / 4.76 and the standard steady
   * state magnification of a damped single-degree-of-freedom system:
   *
   *   DMF = 1 / sqrt((1 - r^2)^2 + (2 z r)^2)
   *
   * At resonance the (1 - r^2) term vanishes and DMF becomes 1/(2z), so 5 per
   * cent damping magnifies the table's 5 mm into 50 mm of sway while 20 per
   * cent damping allows only 12.5 mm. Away from resonance the curve is almost
   * flat, which is why an equal amount of damping bought elsewhere is wasted.
   */
  measure: (v) => {
    const natural = 4.76;
    const r = v.driveHz / natural;
    const z = v.damping / 100;
    const dmf = 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2));
    return {
      frequencyRatio: r,
      magnification: dmf,
      roofSwayMm: 5 * dmf,
      magnificationAtResonance: 1 / (2 * z),
      phaseLagDegrees: (Math.atan2(2 * z * r, 1 - r * r) * 180) / Math.PI,
      naturalFrequencyHz: natural,
    };
  },
  plot: {
    x: "driveHz", y: "magnification",
    xLabel: "Table frequency (Hz)", yLabel: "Sway divided by table movement",
  },
};

/* ---------------------------------------------------------------- *
 * F5.3 — Modifying and retesting
 * ---------------------------------------------------------------- */

const ROUND_ONE_ROUND_TWO: ArchetypeSpec = {
  id: "g7f5-round-one-round-two",
  title: "Round One, Round Two",
  tagline: "Change one thing, run the same test again, and the comparison means something.",
  kind: "compare",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Change one variable between test rounds so the improvement can be attributed to it.",
    "Use the same measurement in both rounds to make the comparison fair.",
  ],
  misconceptions: [
    "Improving several things at once shows which one worked",
    "A retest with a different input still counts as a comparison",
  ],
  specimens: [
    {
      id: "round1", name: "Round 1: bare frame, 50 mm of sway",
      because: "At resonance, 5 per cent damping magnifies the table ten times.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "round2", name: "Round 2: one damper, 12.5 mm",
      because: "Same table, same 4.8 Hz. Damping of 20 per cent gives 2.5 times.",
      art: { art: "apparatus", which: "battery" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F5.4 — Naming the trade-off in each improvement
 * ---------------------------------------------------------------- */

const WHAT_DID_IT_COST: ArchetypeSpec = {
  id: "g7f5-what-did-it-cost",
  title: "What Did That Cost You?",
  tagline: "Every improvement is paid for. Six of them, and three different currencies.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Name what each design improvement costs, in money, in space, or in how the building is used.",
    "Explain why an improvement with no visible cost still has to be justified.",
  ],
  misconceptions: [
    "A better design has no downside",
    "Trade-offs are always about money",
  ],
  categories: [
    { id: "money", name: "Paid in money", hint: "the building works the same, it just costs more" },
    { id: "space", name: "Paid in space", hint: "floor area or ground you no longer have" },
    { id: "use", name: "Paid in use", hint: "the building is harder to live in or change" },
  ],
  specimens: [
    {
      id: "dampers", name: "Add three viscous dampers", category: "money",
      because:
        "Damping of 20 per cent instead of 5 cuts the sway from 50 mm to 12.5 mm. The dampers are "
        + "machined cylinders that need inspecting for the life of the building, and they buy back "
        + "no floor area at all.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "moat", name: "Isolate the base", category: "space",
      because:
        "A 400 mm moat right around the school, plus sliding covers at every door and a flexible "
        + "loop in every pipe. The land inside the fence has not grown, so the building shrinks.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "tmd", name: "Hang a tuned mass damper", category: "space",
      because:
        "Taipei 101 gives up several storeys near the top to a 660 tonne sphere and the room it "
        + "must swing in. Nothing else can go there, at the most valuable height in the tower.",
      art: { art: "sphere", color: "#b9a05e", radius: 0.56, glow: 0.22 },
    },
    {
      id: "walls", name: "Thicken the shear walls", category: "use",
      because:
        "Stiffer means a shorter period, and on this spectrum a shorter period means more "
        + "acceleration, not less. The building leans less and everything inside it is thrown harder.",
      art: { art: "glassware", which: "testTube", level: 0.88, color: "#b6b2a6" },
    },
    {
      id: "tank", name: "Strap the roof tank down", category: "money",
      because:
        "Two straps and four anchors hold 20 tonnes against a 118 kN sideways push at 0.6 g. It "
        + "costs less than a day of the contractor's time and takes nothing away from anyone.",
      art: { art: "glassware", which: "beaker", level: 0.72, color: "#3f86c8" },
    },
    {
      id: "shelves", name: "Bolt every bookcase to the wall", category: "use",
      because:
        "Falling furniture causes a large share of earthquake injuries indoors, so this is cheap "
        + "safety. The price is that no teacher can rearrange a room again without a drill.",
      art: { art: "apparatus", which: "stand" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F5.5 — Converging on an optimized design
 * ---------------------------------------------------------------- */

const WHEN_TO_STOP: ArchetypeSpec = {
  id: "g7f5-when-to-stop",
  title: "Knowing When to Stop",
  tagline: "Five rounds of testing. The fourth barely helps, and that is the answer.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-4"] },
  learningGoals: [
    "Track a measured result across rounds of testing and see the improvement flatten out.",
    "Decide when a design is optimized by comparing each round's gain with its cost.",
  ],
  misconceptions: [
    "Optimizing means carrying on until the problem disappears",
    "Each round of testing helps as much as the last one did",
  ],
  specimens: [
    { id: "tower", name: "The model, round by round",
      art: { art: "apparatus", which: "stand" } },
  ],
  stages: [
    {
      name: "Round 1", at: 0,
      caption: "Bare frame at resonance: ten times the table's 5 mm, so 50 mm of sway.",
    },
    {
      name: "Round 2", at: 0.25,
      caption: "One damper, 20 per cent. Sway 12.5 mm: three quarters of it gone.",
    },
    {
      name: "Round 3", at: 0.5,
      caption: "Braces move resonance to 8 Hz, off the drive frequency. Sway 7.3 mm.",
    },
    {
      name: "Round 4", at: 0.75,
      caption: "A second damper, 30 per cent damping, buys half a millimetre: 6.8 mm.",
    },
    {
      name: "Round 5", at: 1,
      caption: "A third buys 0.6 mm. Stop here: the brief asked for under 10 mm.",
    },
  ],
};

export const g7f5ShrinkItProperly = buildSim(SHRINK_IT_PROPERLY);
export const g7f5FindThePeak = buildSim(FIND_THE_PEAK);
export const g7f5RoundOneRoundTwo = buildSim(ROUND_ONE_ROUND_TWO);
export const g7f5WhatDidItCost = buildSim(WHAT_DID_IT_COST);
export const g7f5WhenToStop = buildSim(WHEN_TO_STOP);
