import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit B · Topic B2 — Potential energy in a system.
 *
 * Five simulations, one per subtopic:
 *
 *   B2.1  g8b2-lift-it-and-hold      gravitational potential energy   (investigate)
 *   B2.2  g8b2-stretch-and-store     elastic potential energy         (investigate)
 *   B2.3  g8b2-whose-energy-is-it    a property of the system         (sort)
 *   B2.4  g8b2-ten-centimetres-more  arrangement changing             (process)
 *   B2.5  g8b2-swing-and-trade       potential and kinetic trading    (trace)
 *
 * Two stores, two equations: m g h for a mass and the Earth held apart, and
 * half k x squared for a spring held out of shape. Both are properties of an
 * arrangement, never of a lone object, and the pendulum at the end shows the
 * two of them handing a fixed 10.34 J back and forth. g is 9.81 N/kg
 * throughout.
 */

/* ---------------------------------------------------------------- *
 * B2.1 — Gravitational potential energy
 * ---------------------------------------------------------------- */

const LIFT_IT_AND_HOLD: ArchetypeSpec = {
  id: "g8b2-lift-it-and-hold",
  title: "Lift It, and Hold It There",
  tagline: "Clamp a mass up the stand. Every metre costs the same, and you can get all of it back.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Calculate gravitational potential energy as m g h.",
    "Explain that the store belongs to the object and the Earth together, not to the object alone.",
  ],
  misconceptions: [
    "A heavy object stores more energy however high it is",
    "Potential energy is something inside the object itself",
  ],
  specimens: [
    { id: "stand", name: "Mass clamped up a laboratory stand",
      art: { art: "apparatus", which: "stand" } },
  ],
  variables: [
    { key: "height", label: "Height above the bench (m)", min: 0, max: 12, step: 0.1, default: 2.5 },
    { key: "mass", label: "Mass hanging from the clamp (kg)", min: 0.1, max: 20, step: 0.1, default: 1.2 },
  ],
  // E = m g h. The energy for every extra metre is exactly the weight m g,
  // which is why the graph is a straight line through the origin: 1.2 kg
  // weighs 11.77 N, so each metre of lift costs 11.77 J and 2.5 m stores
  // 29.43 J. Cut the string and all of it becomes kinetic energy, arriving at
  // root(2 g h) — 7.00 m/s from 2.5 m, whatever the mass.
  measure: (v) => ({
    storedEnergyJ: v.mass * 9.81 * v.height,
    weightN: v.mass * 9.81,
    energyPerMetreJ: v.mass * 9.81,
    landingSpeedMs: Math.sqrt(2 * 9.81 * v.height),
    fallTimeS: Math.sqrt((2 * v.height) / 9.81),
  }),
  plot: {
    x: "height", y: "storedEnergyJ",
    xLabel: "Height above the bench (m)", yLabel: "Stored energy (J)",
  },
  /*
   * The stand is the ruler. It grows with the height slider so the clamp
   * really is further off the bench, and the drop keeps the foot of the stand
   * planted while the top of it rises: without that compensation the whole
   * thing would grow about its middle and sink into the bench as it got
   * taller.
   */
  drive: ({ v }) => {
    const s = 0.65 + (v.height / 12) * 0.55;
    return { scale: s, offset: [0, -1.2 * (s - 1)], spin: 0.5 };
  },
};

/* ---------------------------------------------------------------- *
 * B2.2 — Elastic potential energy
 * ---------------------------------------------------------------- */

const STRETCH_AND_STORE: ArchetypeSpec = {
  id: "g8b2-stretch-and-store",
  title: "Stretch It and Store It",
  tagline: "The first centimetre is nearly free. The tenth one is not.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Calculate elastic potential energy as half k x squared.",
    "Explain why stretching a spring twice as far stores four times the energy.",
  ],
  misconceptions: [
    "Stretching twice as far stores twice the energy",
    "A stiff spring always stores more energy than a soft one",
  ],
  specimens: [
    { id: "spring", name: "Steel spring on a horizontal bench",
      art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "extension", label: "Extension (m)", min: 0, max: 0.4, step: 0.005, default: 0.15 },
    { key: "stiffness", label: "Spring constant k (N/m)", min: 20, max: 400, step: 5, default: 120 },
  ],
  // E = half k x squared, which is the triangular area under the force-extension
  // line F = k x. A 120 N/m spring pulled 0.15 m pulls back with 18 N and holds
  // 1.35 J. Fire a 50 g ball with it and root(2 E / m) gives 7.35 m/s, or
  // E / (m g) = 2.75 m straight up.
  measure: (v) => {
    const e = 0.5 * v.stiffness * v.extension * v.extension;
    return {
      storedEnergyJ: e,
      pullForceN: v.stiffness * v.extension,
      launchSpeedMs: Math.sqrt((2 * e) / 0.05),
      launchHeightM: e / (0.05 * 9.81),
    };
  },
  plot: {
    x: "extension", y: "storedEnergyJ",
    xLabel: "Extension (m)", yLabel: "Stored energy (J)",
  },
  /*
   * The spring is drawn along the extension: at its natural length it sits
   * short and tight, and at 0.4 m it is drawn half as long again. It is held
   * nearly side-on so the stretch happens across the screen where the eye can
   * measure it, and it stops turning once it is stretched, the way a spring
   * held under tension does.
   */
  drive: ({ v }) => ({
    scale: 0.78 + v.extension * 1.7,
    spin: 0.12,
    tilt: 0.2,
  }),
};

/* ---------------------------------------------------------------- *
 * B2.3 — Potential energy as a property of a system
 * ---------------------------------------------------------------- */

const WHOSE_ENERGY_IS_IT: ArchetypeSpec = {
  id: "g8b2-whose-energy-is-it",
  title: "Whose Energy Is It?",
  tagline: "Six stores. Three need two objects and a gap between them. Three belong to one thing moving.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Identify potential energy as a property of an arrangement of interacting objects.",
    "Distinguish a store that depends on separation from one that depends on motion.",
  ],
  misconceptions: [
    "Potential energy is stored inside a single object",
    "A stationary object has no energy at all",
  ],
  categories: [
    { id: "system", name: "Stored in an arrangement", hint: "two objects, a force between them, and a gap you could change" },
    { id: "motion", name: "Carried by the motion", hint: "one object, moving, right now" },
  ],
  specimens: [
    { id: "clamped", name: "1.2 kg clamped 2.5 m up a stand", category: "system",
      because: "29.4 J belongs to the mass and the Earth together. Take the Earth away and the number means nothing: there is nothing to fall towards.",
      art: { art: "apparatus", which: "stand" } },
    { id: "squashed", name: "Spring squashed 8 cm, k = 200 N/m", category: "system",
      because: "0.64 J held between the two ends of the spring. Release one end and the store is gone, because the arrangement is gone.",
      art: { art: "apparatus", which: "spring" } },
    { id: "magnets", name: "Two magnets pushed north to north", category: "system",
      because: "The store lives in the gap. One magnet alone has nowhere to put it; bring the second up and the energy climbs as the gap closes.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "trolley", name: "3 kg trolley rolling at 1.5 m/s", category: "motion",
      because: "Half x 3 x 1.5 x 1.5 = 3.4 J, and it is the trolley's own. Nothing else has to be nearby for that number to be true.",
      art: { art: "apparatus", which: "cart" } },
    { id: "ball", name: "0.4 kg ball a metre from the ground at 4.4 m/s", category: "motion",
      because: "3.9 J of kinetic energy right now. It also shares a gravitational store with the Earth, but that is a separate 3.9 J and it is falling out of it.",
      art: { art: "sphere", color: "#d9663f", radius: 0.42 } },
    { id: "gas", name: "Nitrogen molecules in warm air", category: "motion",
      because: "At 20 C an N2 molecule averages about 500 m/s. Thermal energy is nothing more exotic than the kinetic energy of enormous numbers of moving particles.",
      art: { art: "molecule", formula: "N2" } },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.4 — Modeling potential energy as an arrangement changes
 * ---------------------------------------------------------------- */

const TEN_CENTIMETRES_MORE: ArchetypeSpec = {
  id: "g8b2-ten-centimetres-more",
  title: "Ten Centimetres More",
  tagline: "Pull a 150 N/m spring out in four equal steps and watch the price of each one climb.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Model how a store of potential energy changes as the arrangement of a system changes.",
    "Explain why equal changes in extension do not add equal amounts of energy.",
  ],
  misconceptions: [
    "Each equal pull adds the same energy to the spring",
    "The force needed stays the same as a spring is stretched",
  ],
  specimens: [
    { id: "spring", name: "Spring, k = 150 N/m", art: { art: "apparatus", which: "spring" } },
  ],
  variables: [
    { key: "extension", label: "How far the spring is pulled out (m)", min: 0, max: 0.4, step: 0.01, default: 0.2 },
  ],
  // The same spring the stages walk through, but under the student's hand:
  // E = half x 150 x x squared, the pull is F = 150 x, and the price of the
  // next 10 cm is half x 150 x ((x + 0.1) squared - x squared), which grows
  // every time because the force you are pulling against has grown.
  measure: (v) => ({
    storedEnergyJ: 0.5 * 150 * v.extension * v.extension,
    pullForceN: 150 * v.extension,
    nextTenCentimetresCostJ:
      0.5 * 150 * ((v.extension + 0.1) * (v.extension + 0.1) - v.extension * v.extension),
    lastTenCentimetresCostJ:
      v.extension < 0.1 ? 0.5 * 150 * v.extension * v.extension
        : 0.5 * 150 * (v.extension * v.extension - (v.extension - 0.1) * (v.extension - 0.1)),
  }),
  // The spring on the bench is drawn at the extension being discussed, so the
  // stage rail and the picture move together.
  drive: ({ v }) => ({
    scale: 0.78 + v.extension * 1.7,
    spin: 0.12,
    tilt: 0.2,
  }),
  // Half k x squared at 0.1 m intervals: 0.75, 3.00, 6.75 and 12.00 J. The
  // steps between them are 0.75, 2.25, 3.75 and 5.25 J, rising by 1.50 J each
  // time because the force you are pulling against has itself risen by 15 N.
  stages: [
    { name: "Relaxed", at: 0,
      caption: "Natural length. No pull, no store. F = 150 x 0 = 0 N and E = 0 J." },
    { name: "10 cm", at: 0.25,
      caption: "Pull 0.10 m. It resists with 15 N and now holds half x 150 x 0.10 x 0.10 = 0.75 J." },
    { name: "20 cm", at: 0.5,
      caption: "0.20 m out: 30 N and 3.00 J. That second 10 cm cost 2.25 J, three times the first." },
    { name: "30 cm", at: 0.75,
      caption: "0.30 m out: 45 N and 6.75 J. The third step cost 3.75 J, five times the first." },
    { name: "40 cm", at: 1,
      caption: "0.40 m out: 60 N and 12.00 J. Four equal pulls, but 0.75, 2.25, 3.75 then 5.25 J of energy." },
  ],
};

/* ---------------------------------------------------------------- *
 * B2.5 — Potential and kinetic energy trading off
 * ---------------------------------------------------------------- */

const SWING_AND_TRADE: ArchetypeSpec = {
  id: "g8b2-swing-and-trade",
  title: "Swing, and Trade",
  tagline: "A 2 kg bob on a 1.8 m string. Follow 10.34 J from one end of the swing to the other.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2", "MS-PS3-5"] },
  learningGoals: [
    "Track potential and kinetic energy trading off through a swing while the total holds steady.",
    "Predict the speed at the lowest point from the height the bob was released from.",
  ],
  misconceptions: [
    "The pendulum gains energy as it speeds up",
    "The bob is pushed downwards by something as it swings",
  ],
  // A 1.8 m pendulum released at 45 degrees drops 1.8 x (1 - cos 45) = 0.527 m,
  // so a 2 kg bob starts with 2 x 9.81 x 0.527 = 10.34 J of store and nothing
  // else. At the bottom all of it is motion, at root(2 g h) = 3.22 m/s. The
  // small-angle period is 2 pi root(L / g) = 2.69 s.
  route: [
    { at: [0.1, 0.2], name: "Released at 45 degrees",
      note: "The bob is 0.527 m above its lowest point. Store 10.34 J, motion 0 J, speed 0 m/s. Nothing is pushing it: it is simply let go." },
    { at: [0.26, 0.4], name: "Passing 30 degrees",
      note: "It has fallen 0.286 m of that 0.527 m. Store 4.73 J, motion 5.61 J, speed 2.37 m/s. The two readings still add to 10.34." },
    { at: [0.38, 0.55], name: "Passing 22.5 degrees",
      note: "Store 2.69 J, motion 7.66 J, speed 2.77 m/s. Three quarters of the way down in height, but already three quarters of the way to full speed squared." },
    { at: [0.5, 0.66], name: "The lowest point",
      note: "Store 0 J, motion 10.34 J, speed 3.22 m/s. This is root(2 x 9.81 x 0.527), and the 2 kg cancels out of it completely." },
    { at: [0.66, 0.5], name: "Climbing the far side",
      note: "The trade runs backwards. At 30 degrees on this side the readings are the same 4.73 J and 5.61 J as on the way down." },
    { at: [0.88, 0.2], name: "Almost 45 degrees again",
      note: "It stops just short of where it began. The few millijoules missing each swing are in the air it pushed aside and the warmth of the pivot, and they never come back." },
  ],
};

export const g8b2LiftItAndHold = buildSim(LIFT_IT_AND_HOLD);
export const g8b2StretchAndStore = buildSim(STRETCH_AND_STORE);
export const g8b2WhoseEnergyIsIt = buildSim(WHOSE_ENERGY_IS_IT);
export const g8b2TenCentimetresMore = buildSim(TEN_CENTIMETRES_MORE);
export const g8b2SwingAndTrade = buildSim(SWING_AND_TRADE);
