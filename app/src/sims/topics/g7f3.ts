import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit F · Topic F3 — Defining a mitigation problem.
 *
 * Five simulations, one per subtopic:
 *
 *   F3.1  g7f3-wish-or-target      from vague want to measurable target (sort)
 *   F3.2  g7f3-pull-and-fence      criteria versus constraints          (compare)
 *   F3.3  g7f3-who-is-inside       who the solution must protect        (explore)
 *   F3.4  g7f3-softer-but-wider    trade-offs already in the statement  (investigate)
 *   F3.5  g7f3-writing-the-brief   defining a real mitigation problem   (process)
 *
 * One building runs through the topic: a four-storey California school on
 * stiff soil where the design spectrum gives SDS = 1.0 g and SD1 = 0.6 g. Every
 * number here is computed from that spectrum, so the drift limit in F3.1, the
 * criterion in F3.2 and the isolator travel in F3.4 all agree with each other.
 */

/* ---------------------------------------------------------------- *
 * F3.1 — From a vague want to a measurable target
 * ---------------------------------------------------------------- */

const WISH_OR_TARGET: ArchetypeSpec = {
  id: "g7f3-wish-or-target",
  title: "Wish, or Target?",
  tagline: "Six lines from a real school retrofit brief. Only three can ever be checked.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Tell a vague want apart from a criterion that can be measured and tested.",
    "Rewrite a want as a target by naming a quantity, a limit and a test.",
  ],
  misconceptions: [
    "Saying a design should be safe is enough to define the problem",
    "Numbers can be added to the brief later, once the design is drawn",
  ],
  categories: [
    { id: "wish", name: "A wish", hint: "nobody can tell whether you met it" },
    { id: "target", name: "A measurable target", hint: "a quantity, a limit and a test" },
  ],
  specimens: [
    {
      id: "lights", name: "Make the emergency lighting better.", category: "wish",
      because:
        "Better than what? There is no quantity here and no way to fail. The fire code already "
        + "knows how to say it: a level of light, for a length of time, with the mains cut.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "lights2",
      name: "Corridor lights must run 90 minutes on battery at one footcandle.", category: "target",
      because:
        "A quantity (one footcandle), a limit (90 minutes) and a test (cut the mains and time it). "
        + "This is the same sentence as the wish above, with the arguing taken out.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "tank", name: "Stop the roof water tank falling over.", category: "wish",
      because:
        "How hard a shake must it survive? Without that, one engineer designs for a gale and "
        + "another for a magnitude 7, and both can claim they met the brief.",
      art: { art: "glassware", which: "beaker", level: 0.7, color: "#3f86c8" },
    },
    {
      id: "tank2",
      name: "The 20 000 litre tank stays upright and connected at 0.6 g sideways.", category: "target",
      because:
        "20 000 litres is 20 tonnes, so 0.6 g is a sideways push of about 118 kN. Now the straps "
        + "and anchors can be sized, and a calculation can be checked by someone else.",
      art: { art: "glassware", which: "flask", level: 0.62, color: "#3f86c8" },
    },
    {
      id: "safe", name: "Make the building safe in an earthquake.", category: "wish",
      because:
        "Safe for whom, in what size of earthquake, and standing or repairable afterwards? Every "
        + "one of those is a different building at a different price.",
      art: { art: "apparatus", which: "stand" },
    },
    {
      id: "drift",
      name: "No storey leans more than 1.5 per cent of its height in the design quake.",
      category: "target",
      because:
        "That is the ASCE 7 limit for a school, which counts as Risk Category III. On a 4 m storey "
        + "it allows 60 mm of lean, and a computer model or a shake table can check it.",
      art: { art: "apparatus", which: "spring" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F3.2 — Criteria versus constraints
 * ---------------------------------------------------------------- */

const PULL_AND_FENCE: ArchetypeSpec = {
  id: "g7f3-pull-and-fence",
  title: "One Pulls, One Fences",
  tagline: "A criterion says which design is better. A constraint says which are allowed at all.",
  kind: "compare",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Distinguish a criterion, which ranks designs, from a constraint, which excludes them.",
    "Explain why a design that scores best on every criterion can still be rejected.",
  ],
  misconceptions: [
    "Criteria and constraints are two words for the same list",
    "The best design is the one that scores highest, whatever the limits say",
  ],
  specimens: [
    {
      id: "criterion", name: "Criterion: how far each storey leans",
      because: "A scale. Less is better, all the way down, and it freezes past 60 mm.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "constraint", name: "Constraint: the budget",
      because: "A fence. Under the line or out of the running, however good.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#4aa06a" },
    },
  ],
  variables: [
    { key: "lean", label: "Lean allowed per storey (mm)", min: 20, max: 120, step: 5, default: 60 },
  ],
  /*
   * One slider, two completely different responses, which is the whole point.
   *
   * A school is Risk Category III, so ASCE 7 allows 1.5 per cent of the storey
   * height: 60 mm on a 4 m storey. Halving the lean needs roughly double the
   * lateral stiffness, and in a braced frame stiffness runs with the area of
   * steel in the braces, so the bracing cost is taken as inversely proportional
   * to the lean and indexed to 1.0 at the 60 mm design. The budget is 1.6 of
   * those units, which fences the design off below 37.5 mm.
   */
  measure: (v) => ({
    leanMm: v.lean,
    driftPercent: (v.lean / 4000) * 100,
    costIndex: 60 / v.lean,
    budgetIndex: 1.6,
    meetsDriftLimit: v.lean <= 60 ? 1 : 0,
    withinBudget: 60 / v.lean <= 1.6 ? 1 : 0,
    allowedDesign: v.lean <= 60 && 60 / v.lean <= 1.6 ? 1 : 0,
  }),
  /*
   * The spring is the criterion: it leans further as the number grows, and it
   * stops dead once the design breaks the code limit. The beaker is the
   * constraint: it fills with the cost and goes red at the brim, because a
   * constraint has no better and worse, only inside and outside.
   */
  drive: ({ f, index }) => {
    if (index === 0) {
      return {
        offset: [f.leanMm / 500, 0],
        scale: 0.75 + f.leanMm / 240,
        rate: f.meetsDriftLimit ? 1 : 0,
      };
    }
    const over = f.costIndex > f.budgetIndex;
    return {
      level: Math.min(0.97, (f.costIndex / f.budgetIndex) * 0.62),
      color: over ? "#c0392b" : "#4aa06a",
      bubbles: over ? 0.9 : 0,
    };
  },
};

/* ---------------------------------------------------------------- *
 * F3.3 — Who the solution must protect
 * ---------------------------------------------------------------- */

const WHO_IS_INSIDE: ArchetypeSpec = {
  id: "g7f3-who-is-inside",
  title: "Who Is Inside When It Shakes?",
  tagline: "Click round the building. The brief has to answer to every one of these people.",
  kind: "explore",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Identify the people a mitigation design has to protect, including those outside the building.",
    "Explain how naming the users changes the requirements the design must meet.",
  ],
  misconceptions: [
    "A building only has to protect the people who own it",
    "If the structure survives, the design has done its job",
  ],
  specimens: [
    {
      id: "school", name: "The four-storey school",
      art: { art: "apparatus", which: "stand" },
      parts: [
        {
          id: "students", name: "950 students, 08:00 to 15:00", at: [-0.58, -0.44],
          note: "The Long Beach earthquake of 10 March 1933 wrecked around 230 school buildings. It "
            + "struck at 5.54 in the evening, after the children had gone. California passed the "
            + "Field Act a month later, and no Field Act school has since collapsed on its pupils.",
        },
        {
          id: "wheelchair", name: "The student who uses a wheelchair", at: [0.58, -0.46],
          note: "Stairs are the escape route for everyone else and a trap for her. The brief has to "
            + "keep an accessible route usable after the shaking, or provide an area of refuge with "
            + "two-way communication to the fire crew.",
        },
        {
          id: "custodian", name: "The custodian, alone at 23:00", at: [-0.62, 0.06],
          note: "The building is occupied about eighteen hours a day, not seven. A design that only "
            + "protects during lessons protects for a third of the time the hazard is present.",
        },
        {
          id: "parapet", name: "The neighbours under the parapet", at: [0.62, 0.14],
          note: "Unreinforced masonry parapets fall outward, onto the pavement, not into the "
            + "building. California's 1986 URM law made cities in the highest seismic zone inventory "
            + "them, and about 25 000 buildings were listed.",
        },
        {
          id: "shelter", name: "The town, three days later", at: [-0.36, 0.56],
          note: "School gyms are designated shelters. That turns a want into a requirement: the "
            + "water, the power and the kitchen have to survive as well as the walls.",
        },
        {
          id: "future", name: "The children not yet born", at: [0.3, 0.58],
          note: "The design basis is the shaking a site has a 2 per cent chance of exceeding in 50 "
            + "years. Half the pupils who will meet that earthquake in this building have not "
            + "started school yet.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F3.4 — Trade-offs already visible in the problem statement
 * ---------------------------------------------------------------- */

const SOFTER_BUT_WIDER: ArchetypeSpec = {
  id: "g7f3-softer-but-wider",
  title: "Softer, but Wider",
  tagline: "Put the school on bearings and the forces fall. Everything it must be allowed to move rises.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-1"], ccssMath: ["7.RP.A.2"] },
  learningGoals: [
    "Read a design response spectrum and find the force on a building from its period.",
    "Show that reducing earthquake force by lengthening the period costs sideways room.",
  ],
  misconceptions: [
    "A stiffer building is always a safer building",
    "A trade-off is a failure of design rather than a feature of the problem",
  ],
  specimens: [
    { id: "isolated", name: "The school on bearings: a mass free to roll",
      art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "period", label: "Period on its bearings (s)", min: 0.4, max: 4, step: 0.1, default: 2.5 },
    { key: "mass", label: "Mass of the school (tonnes)", min: 200, max: 4000, step: 50, default: 1200 },
  ],
  /*
   * The ASCE 7 design response spectrum for a stiff California site, taking
   * SDS = 1.0 g and SD1 = 0.6 g, so the corner period Ts = SD1/SDS = 0.6 s:
   *
   *   T < T0 = 0.2 Ts   Sa = SDS (0.4 + 0.6 T / T0)
   *   T0 <= T <= Ts     Sa = SDS
   *   T > Ts            Sa = SD1 / T
   *
   * A fixed-base four-storey school sits near 0.4 s and takes the full 1.0 g.
   * Slide it onto bearings with a 2.5 s period and Sa falls to 0.6/2.5 =
   * 0.24 g: the same building, a quarter of the force. The price is written
   * into the same equation, because spectral displacement is Sa g T^2 / 4 pi^2,
   * which at 2.5 s is 0.37 m of sideways travel that the moat has to allow.
   * San Francisco City Hall sits on more than 500 such bearings.
   */
  measure: (v) => {
    const SDS = 1.0, SD1 = 0.6;
    const Ts = SD1 / SDS, T0 = 0.2 * Ts;
    const sa = (T: number) =>
      T < T0 ? SDS * (0.4 + (0.6 * T) / T0) : T <= Ts ? SDS : SD1 / T;
    const saG = sa(v.period);
    const displacementM = (saG * 9.81 * v.period * v.period) / (4 * Math.PI * Math.PI);
    return {
      spectralAccelG: saG,
      baseShearKN: saG * v.mass * 9.81,
      displacementMm: displacementM * 1000,
      moatWidthMm: displacementM * 1200,
      forceComparedToFixedBase: saG / sa(0.4),
      weightKN: v.mass * 9.81,
    };
  },
  plot: {
    x: "period", y: "displacementMm",
    xLabel: "Period on its bearings (s)", yLabel: "Sideways travel to allow (mm)",
  },
  /*
   * The school rides on the bench at its own period, and it slides exactly as
   * far as the spectrum says: a stiff 0.4 s building shivers a few millimetres,
   * a 2.5 s isolated one swings 373 mm at a lazy once every two and a half
   * seconds. Take it past a 500 mm moat and it parks hard against the wall and
   * stops, because a moat that is too narrow is not isolation at all.
   */
  drive: ({ v, f, t }) => {
    const amp = Math.min(0.5, f.displacementMm / 800);
    const hitsMoat = f.displacementMm > 500;
    const w = (2 * Math.PI) / v.period;
    return {
      offset: [hitsMoat ? amp : Math.sin(t * w) * amp, 0],
      rate: hitsMoat ? 0 : 1,
    };
  },
};

/* ---------------------------------------------------------------- *
 * F3.5 — Defining a real mitigation problem
 * ---------------------------------------------------------------- */

const WRITING_THE_BRIEF: ArchetypeSpec = {
  id: "g7f3-writing-the-brief",
  title: "Writing the Levee Brief",
  tagline: "Turn 'Sacramento floods' into a sentence an engineer can be held to.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Build a mitigation problem statement from a hazard, a target, the users and the limits.",
    "Explain why the brief has to state the size of event the design is meant to survive.",
  ],
  misconceptions: [
    "The problem is obvious, so it does not need writing down",
    "A levee either works or it does not, with no size of flood attached",
  ],
  specimens: [
    { id: "river", name: "Two rivers meeting behind one levee",
      art: { art: "glassware", which: "flask", level: 0.6, color: "#3b7fbd" } },
  ],
  stages: [
    {
      name: "The complaint", at: 0,
      caption: "Sacramento floods. Half a million people live behind these levees.",
    },
    {
      name: "The number", at: 0.25,
      caption: "State law asks urban Central Valley for protection against the 1-in-200 flood.",
    },
    {
      name: "The users", at: 0.5,
      caption: "Homes, two hospitals and the state capitol sit below the level the river reaches.",
    },
    {
      name: "The limits", at: 0.75,
      caption: "No land the city does not own, one dry season of work, the wharf stays open.",
    },
    {
      name: "The brief", at: 1,
      caption: "Hold the 1-in-200 flood: a 14 per cent chance of being tested within 30 years.",
    },
  ],
};

export const g7f3WishOrTarget = buildSim(WISH_OR_TARGET);
export const g7f3PullAndFence = buildSim(PULL_AND_FENCE);
export const g7f3WhoIsInside = buildSim(WHO_IS_INSIDE);
export const g7f3SofterButWider = buildSim(SOFTER_BUT_WIDER);
export const g7f3WritingTheBrief = buildSim(WRITING_THE_BRIEF);
