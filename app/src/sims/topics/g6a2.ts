import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit A · Topic A2 — Boundaries, inputs and outputs.
 *
 * Five simulations, one per subtopic:
 *
 *   A2.1  g6a2-where-does-it-end   drawing a system's boundary   (sort)
 *   A2.2  g6a2-sealed-or-open      open vs closed systems        (compare)
 *   A2.3  g6a2-in-out-and-left     inputs and outputs            (investigate)
 *   A2.4  g6a2-follow-the-lunch    tracing matter and energy     (trace)
 *   A2.5  g6a2-draw-the-boundary   choosing a boundary           (assemble)
 *
 * The boundary is the hard idea here: it is a line a scientist chooses, not a
 * line nature draws. Every simulation names the system out loud first, because
 * an input is only an input once you have said what it is an input to.
 */

/* A2.1 — Drawing a system's boundary. */
const WHERE_DOES_IT_END: ArchetypeSpec = {
  id: "g6a2-where-does-it-end",
  title: "Where Does the System End?",
  tagline: "The system is the salty water in the beaker. Sort what is inside it.",
  kind: "sort",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "State the boundary of a system before describing it.",
    "Decide whether a given thing is inside the system or in its surroundings.",
  ],
  misconceptions: ["The boundary of a system is fixed by nature rather than chosen"],
  categories: [
    { id: "inside", name: "Inside the system", hint: "part of the salty water itself" },
    { id: "outside", name: "In the surroundings", hint: "outside the line, though it may still cross it" },
  ],
  specimens: [
    { id: "water", name: "The water in the beaker", category: "inside",
      because: "The system was defined as the liquid, so the water is the system.",
      art: { art: "glassware", which: "beaker", level: 0.55 } },
    { id: "salt", name: "The salt dissolved in it", category: "inside",
      because: "Dissolved salt is spread through the liquid, so it sits inside the boundary.",
      art: { art: "sphere", color: "#f2f4f7", radius: 0.3 } },
    { id: "bulb", name: "The thermometer bulb dipped in the liquid", category: "inside",
      because: "It is surrounded by the liquid, and it reads the system's own temperature.",
      art: { art: "glassware", which: "testTube", level: 0.3 } },
    { id: "flame", name: "The burner flame under the beaker", category: "outside",
      because: "The flame is in the surroundings. Its energy crosses the boundary as an input.",
      art: { art: "apparatus", which: "burner" } },
    { id: "bench", name: "The stand the beaker rests on", category: "outside",
      because: "It touches the system but is not part of it. Touching is not the same as belonging.",
      art: { art: "apparatus", which: "stand" } },
    { id: "air", name: "The room air above the liquid", category: "outside",
      because: "Outside the line, and it receives steam as an output from the system.",
      art: { art: "sphere", color: "#b9cfe3", radius: 0.52, glow: 0.6 } },
  ],
};

/* A2.2 — Open vs closed systems. */
const SEALED_OR_OPEN: ArchetypeSpec = {
  id: "g6a2-sealed-or-open",
  title: "Sealed or Open?",
  tagline: "Two little worlds. One lets matter cross, one does not.",
  kind: "compare",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Distinguish an open system from a closed one by what crosses the boundary.",
    "Explain that a closed system still exchanges energy with its surroundings.",
  ],
  misconceptions: ["A closed system lets nothing at all in or out"],
  specimens: [
    { id: "sealed", name: "Sealed bottle garden (closed to matter)",
      because: "Light and heat pass through the glass, but not one gram of matter enters or leaves. Some have lived sealed for over 50 years.",
      art: { art: "glassware", which: "flask", level: 0.35 } },
    { id: "pond", name: "Open pond (open to both)",
      because: "Rain, leaves, insects, gases and heat all cross the edge, so matter and energy both move in and out.",
      art: { art: "glassware", which: "beaker", level: 0.6, bubbles: 2 } },
  ],
};

/* A2.3 — Inputs and outputs. */
const IN_OUT: ArchetypeSpec = {
  id: "g6a2-in-out-and-left",
  title: "In, Out, and What Is Left",
  tagline: "Open the tap, open the drain, and watch the store rise or fall.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-1"] },
  learningGoals: [
    "Predict how the amount stored in a system changes from its inputs and outputs.",
    "Recognise a steady state as inflow matching outflow.",
  ],
  misconceptions: ["If something is flowing in, the amount inside must be rising"],
  specimens: [{ id: "tank", name: "Water tank", art: { art: "glassware", which: "beaker", level: 0.5 } }],
  variables: [
    { key: "inflow", label: "Water in (litres per minute)", min: 0, max: 20, step: 0.5, default: 8 },
    { key: "outflow", label: "Water out (litres per minute)", min: 0, max: 20, step: 0.5, default: 5 },
    { key: "minutes", label: "Time (minutes)", min: 0, max: 60, step: 1, default: 10 },
  ],
  // A tank of floor area 0.5 m2 starting with 200 L. One litre spread over
  // 5 000 cm2 is 0.2 cm deep, so depth in centimetres is volume / 5.
  measure: (v) => {
    const netFlow = v.inflow - v.outflow;
    const volume = Math.max(0, 200 + netFlow * v.minutes);
    return { netFlow, volumeLitres: volume, depthCm: volume / 5 };
  },
  plot: { x: "inflow", y: "volumeLitres", xLabel: "Water in (L/min)", yLabel: "Water stored (L)" },
};

/* A2.4 — Tracing matter and energy through a system. */
const FOLLOW_LUNCH: ArchetypeSpec = {
  id: "g6a2-follow-the-lunch",
  title: "Follow the Lunch",
  tagline: "One cheese sandwich, tracked in and out of one person.",
  kind: "trace",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Trace matter and energy from an input, through a system, to its outputs.",
    "Account for energy that leaves a system as heat.",
  ],
  misconceptions: ["Energy is used up inside a system rather than passed on"],
  stages: [
    { name: "Input", at: 0, caption: "About 1 400 kJ of chemical energy crosses the boundary as food." },
    { name: "Broken down", at: 0.25, caption: "Digestion cuts starch and fat into molecules small enough to absorb." },
    { name: "Released", at: 0.5, caption: "Respiration in the cells releases the energy the food was holding." },
    { name: "Useful work", at: 0.75, caption: "About a quarter drives muscles. The rest is already heat." },
    { name: "Outputs", at: 1, caption: "Heat, carbon dioxide, water and waste all cross back out." },
  ],
  route: [
    { at: [0.12, 0.3], name: "Mouth and stomach",
      note: "Input: a cheese sandwich, about 1 400 kJ of chemical energy and 130 g of matter." },
    { at: [0.3, 0.5], name: "Small intestine",
      note: "Glucose, amino acids and fats cross the gut wall into the blood. Fibre passes straight through." },
    { at: [0.5, 0.28], name: "Muscle cell",
      note: "Mitochondria release the stored energy using oxygen taken in through the lungs." },
    { at: [0.68, 0.52], name: "Movement",
      note: "About 25 per cent becomes useful work. A person walking uses roughly 300 J every second." },
    { at: [0.84, 0.3], name: "Heat to the room",
      note: "The other 75 per cent leaves as heat. A resting person warms a room at about 100 W." },
    { at: [0.9, 0.62], name: "Carbon dioxide and water",
      note: "Matter leaves too: carbon breathed out as CO2, water in breath and urine. Nothing vanishes." },
  ],
};

/* A2.5 — Choosing a boundary for a purpose. */
const DRAW_BOUNDARY: ArchetypeSpec = {
  id: "g6a2-draw-the-boundary",
  title: "Draw the Boundary",
  tagline: "Question: where does a kettle's energy go? Choose what must be inside.",
  kind: "assemble",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1"] },
  learningGoals: [
    "Choose a system boundary that suits the question being asked.",
    "Explain why a boundary drawn too tightly loses part of the answer.",
  ],
  misconceptions: ["There is one correct boundary for any system"],
  specimens: [
    {
      id: "kettle", name: "Boiling kettle", art: { art: "glassware", which: "flask", level: 0.5, bubbles: 4 },
      parts: [
        { id: "water", name: "The water", at: [0, 0.1],
          note: "Must be inside. Heating 1.0 kg of water from 20 to 100 degrees takes 335 kJ, and that is most of the answer." },
        { id: "element", name: "The heating element", at: [-0.3, 0.3],
          note: "Must be inside. It is where electrical energy becomes thermal energy: 2 200 J every second in a 2.2 kW kettle." },
        { id: "body", name: "The metal body", at: [0.32, 0.24],
          note: "Include it. About 0.5 kg of steel warms up too, soaking up roughly 20 kJ that never reaches your tea." },
        { id: "steam", name: "The escaping steam", at: [0.05, -0.42],
          note: "Include it or the sums will not balance. Every gram of steam carries away 2 260 J." },
        { id: "room", name: "The room air", at: [-0.4, -0.24],
          note: "Leave it outside, but mark it as where the outputs go. Widen the boundary to the room and the heat is no longer lost, merely moved." },
        { id: "mains", name: "The mains supply", at: [0.4, -0.34],
          note: "Leave it outside. It is the input crossing the boundary. Including the power station would answer a different question." },
      ],
    },
  ],
};

export const g6a2WhereDoesItEnd = buildSim(WHERE_DOES_IT_END);
export const g6a2SealedOrOpen = buildSim(SEALED_OR_OPEN);
export const g6a2InOutAndLeft = buildSim(IN_OUT);
export const g6a2FollowTheLunch = buildSim(FOLLOW_LUNCH);
export const g6a2DrawTheBoundary = buildSim(DRAW_BOUNDARY);
