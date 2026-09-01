import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B5 — Body systems working together.
 *
 * Six simulations, one per subtopic. A pair of systems only visibly cooperates
 * when you change something and watch both answer, so three of these are
 * `investigate` simulations with real physiology behind them: an oral glucose
 * curve, a day's water balance, and the resting-to-hard-exercise response.
 * The gas handover is a `process` because it is a sequence of pressures, the
 * catch of a ball is a `trace` because a command travels, and B5.6 closes the
 * topic as an `assemble`: one muscle cell, and everything six systems must
 * deliver to it.
 */

/* ---------------------------------------------------------------- *
 * B5.1 — Digestion and circulation together
 * ---------------------------------------------------------------- */

const MEAL_TO_BLOOD: ArchetypeSpec = {
  id: "g6b5-meal-to-blood",
  title: "How Fast Does Bread Reach Your Blood?",
  tagline: "Eat a measured meal, then watch the sugar in the blood rise and fall.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Explain that digestion loads glucose into the blood and circulation delivers it.",
    "Read a blood glucose curve and say when the meal reached the cells.",
  ],
  misconceptions: [
    "Food gives you energy the moment you swallow it",
    "The digestive system delivers food to the cells by itself",
  ],
  specimens: [
    { id: "sample", name: "Blood sample", art: { art: "glassware", which: "testTube", level: 0.6, color: "#b03a3a" } },
  ],
  variables: [
    { key: "minutes", label: "Time since the meal", unit: "min", min: 0, max: 180, step: 5, default: 30 },
    { key: "carbs", label: "Carbohydrate eaten", unit: "g", min: 0, max: 100, step: 5, default: 75 },
  ],
  /*
   * A standard glucose tolerance curve. Fasting blood glucose is 5.0 mmol/L; a
   * 75 g carbohydrate load peaks near 7.8 mmol/L about 30 minutes after the
   * meal and is back under 7.8 by two hours. The shape t/30 * exp(1 - t/30)
   * peaks at exactly t = 30 min with a value of 1, which sets that peak.
   */
  measure: (v) => {
    const shape = (v.minutes / 30) * Math.exp(1 - v.minutes / 30);
    const bloodGlucose = 5.0 + 2.8 * (v.carbs / 75) * shape;
    return {
      bloodGlucose,
      aboveFasting: bloodGlucose - 5.0,
      milligramsPerDl: bloodGlucose * 18,
    };
  },
  plot: {
    x: "minutes", y: "bloodGlucose",
    xLabel: "Minutes since the meal", yLabel: "Blood glucose (mmol/L)",
  },
};

/* ---------------------------------------------------------------- *
 * B5.2 — Circulation and respiration together
 * ---------------------------------------------------------------- */

const GAS_HANDOVER: ArchetypeSpec = {
  id: "g6b5-gas-handover",
  title: "The Handover at the Air Sac",
  tagline: "Stand at an alveolus and watch two systems trade gases across one wall.",
  kind: "process",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Describe the exchange of oxygen and carbon dioxide at an alveolus.",
    "Explain that each gas moves from where there is more of it to where there is less.",
  ],
  misconceptions: [
    "The lungs push oxygen into the blood",
    "Blood leaving the lungs contains no carbon dioxide at all",
  ],
  specimens: [
    { id: "alveolus", name: "Alveolus", art: { art: "glassware", which: "flask", level: 0.18, bubbles: 0.85 } },
  ],
  stages: [
    {
      name: "Air arrives", at: 0,
      caption: "Half a litre of fresh air reaches the air sacs, with oxygen at about 13.3 kPa.",
    },
    {
      name: "Blood arrives", at: 0.2,
      caption: "Blood back from the body is low: oxygen 5.3 kPa, carbon dioxide 6.1 kPa.",
    },
    {
      name: "Gases cross", at: 0.4,
      caption: "Each gas moves down its own gradient, across a wall 0.3 micrometres thick.",
    },
    {
      name: "Blood loaded", at: 0.6,
      caption: "Haemoglobin is 98% full, and the blood's carbon dioxide has fallen to 5.3 kPa.",
    },
    {
      name: "Heart pumps", at: 0.8,
      caption: "The left side of the heart sends 5 litres a minute of this blood to the body.",
    },
    {
      name: "Breathe out", at: 1,
      caption: "The carbon dioxide leaves in the next breath: exhaled air is about 4% of it.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.3 — Nervous and muscular systems together
 * ---------------------------------------------------------------- */

const CATCH_A_BALL: ArchetypeSpec = {
  id: "g6b5-catch-a-ball",
  title: "The Command to Catch a Ball",
  tagline: "Follow one order from the eye to the hand and add up the milliseconds.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Trace a voluntary movement from sense organ to muscle.",
    "Explain that muscles only act when the nervous system tells them to.",
  ],
  misconceptions: [
    "Muscles decide to move on their own",
    "Seeing and reacting happen at the same instant",
  ],
  route: [
    {
      at: [0.09, 0.28], name: "Retina",
      note: "Light lands on the eye. The signal starts about 30 ms later.",
    },
    {
      at: [0.25, 0.48], name: "Visual cortex",
      note: "The back of the brain recognises a ball by about 70 ms.",
    },
    {
      at: [0.43, 0.26], name: "Motor cortex",
      note: "Choosing where to put the hand is the slow step: about 100 ms.",
    },
    {
      at: [0.6, 0.5], name: "Spinal cord",
      note: "The order runs down the cord at roughly 60 metres a second.",
    },
    {
      at: [0.77, 0.28], name: "Motor nerve",
      note: "About 10 ms more to reach the muscles of the arm.",
    },
    {
      at: [0.92, 0.52], name: "Biceps",
      note: "The hand closes about 250 ms after the ball came into view.",
    },
  ],
  stages: [
    { name: "See", at: 0, caption: "Nothing moves until a sense organ turns the world into a signal." },
    { name: "Recognise", at: 0.2, caption: "The brain must first work out what it is looking at." },
    { name: "Decide", at: 0.4, caption: "Deciding costs more time than the whole journey down the arm." },
    { name: "Send", at: 0.6, caption: "The order leaves the brain as a burst of impulses down the spinal cord." },
    { name: "Arrive", at: 0.8, caption: "Motor neurons carry it out to the muscle fibres they control." },
    { name: "Move", at: 1, caption: "Muscle answers nerve. Roughly a quarter of a second, start to finish." },
  ],
};

/* ---------------------------------------------------------------- *
 * B5.4 — The excretory system and internal balance
 * ---------------------------------------------------------------- */

const WATER_BALANCE: ArchetypeSpec = {
  id: "g6b5-water-balance",
  title: "Water In, Water Out",
  tagline: "Drink more, sweat more, and see how the kidney keeps the books balanced.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Explain that the kidneys adjust urine to hold the body's water steady.",
    "Predict how urine volume and colour change with drinking and sweating.",
  ],
  misconceptions: [
    "Drinking more water flushes out more waste",
    "The body loses water only as urine",
  ],
  specimens: [
    { id: "beaker", name: "A day's water", art: { art: "glassware", which: "beaker", level: 0.6 } },
  ],
  variables: [
    { key: "drink", label: "Water drunk", unit: "L/day", min: 0.5, max: 5, step: 0.1, default: 1.5 },
    { key: "sweat", label: "Extra sweat", unit: "L/day", min: 0, max: 4, step: 0.1, default: 0 },
  ],
  /*
   * The standard daily water budget for an adult. In: 1.5 L drunk, 0.7 L in
   * food, 0.3 L made by respiration = 2.5 L. Out: 1.5 L urine, 0.5 L through
   * skin, 0.4 L in breath, 0.1 L in faeces = 2.5 L. The fixed losses equal the
   * fixed gains, so urine tracks drinking minus any extra sweat. It cannot
   * fall below 0.5 L/day: the body must shed about 600 mOsm of solute and can
   * concentrate urine only to 1200 mOsm/L.
   */
  measure: (v) => {
    const wanted = v.drink - v.sweat;
    const urineLitres = Math.max(0.5, wanted);
    return {
      urineLitres,
      concentration: Math.min(1200, 600 / urineLitres),
      bodyWaterChange: wanted - urineLitres,
    };
  },
  plot: {
    x: "drink", y: "urineLitres",
    xLabel: "Water drunk (L/day)", yLabel: "Urine passed (L/day)",
  },
};

/* ---------------------------------------------------------------- *
 * B5.5 — Case study: the body during exercise
 * ---------------------------------------------------------------- */

const EXERCISE: ArchetypeSpec = {
  id: "g6b5-exercise",
  title: "The Body Turns Up the Dial",
  tagline: "Raise the work rate from sitting to sprinting and watch four systems answer.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "Describe how heart rate, breathing rate and oxygen use change with exercise.",
    "Explain that the systems change together because muscle cells need more oxygen.",
  ],
  misconceptions: [
    "You breathe harder during exercise because your lungs get tired",
    "The heart beats faster to cool the body down",
  ],
  specimens: [
    { id: "heart", name: "Heart at work", art: { art: "sphere", color: "#c0392b", radius: 0.55, glow: 0.5 } },
  ],
  variables: [
    { key: "work", label: "Work rate", unit: "W", min: 0, max: 250, step: 10, default: 0 },
  ],
  /*
   * Standard exercise physiology for a fit young adult on a cycle ergometer.
   * At rest: heart 70 beats/min, 14 breaths/min, 0.25 L of oxygen a minute,
   * 5 L of blood a minute, 6 L of air a minute. At 250 W of hard work: 170
   * beats/min, 45 breaths/min, 3.0 L of oxygen, 20 L of blood, 100 L of air.
   * Each response is close enough to linear in work rate over this range to
   * be worth checking against a textbook table.
   */
  measure: (v) => ({
    heartRate: 70 + 0.4 * v.work,
    breathingRate: 14 + 0.124 * v.work,
    oxygenUse: 0.25 + 0.011 * v.work,
    cardiacOutput: 5 + 0.06 * v.work,
    ventilation: 6 + 0.376 * v.work,
  }),
  plot: {
    x: "work", y: "heartRate",
    xLabel: "Work rate (W)", yLabel: "Heart rate (beats/min)",
  },
};

/* ---------------------------------------------------------------- *
 * B5.6 — Interactions among body systems, generalized
 * ---------------------------------------------------------------- */

const WHAT_A_CELL_NEEDS: ArchetypeSpec = {
  id: "g6b5-what-a-cell-needs",
  title: "What One Muscle Cell Needs",
  tagline: "Supply a single working cell, and count the systems it takes to do it.",
  kind: "assemble",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-3"] },
  learningGoals: [
    "List what a working cell must receive and what it must have taken away.",
    "Name the organ system responsible for each delivery and each removal.",
  ],
  misconceptions: [
    "One system can keep a cell alive on its own",
    "Waste removal is a separate matter from staying alive",
  ],
  specimens: [
    {
      id: "fibre", name: "A muscle cell mid-contraction", art: { art: "cell" },
      parts: [
        {
          id: "oxygen", name: "Oxygen in", at: [0, -0.46],
          note: "From the respiratory system. Without it, 2 ATP per glucose, not 30.",
        },
        {
          id: "glucose", name: "Glucose in", at: [-0.4, -0.2],
          note: "From the digestive system, at about 5 mmol per litre of blood.",
        },
        {
          id: "blood", name: "Blood supply", at: [0.4, -0.24],
          note: "The circulatory system brings both and clears what is left.",
        },
        {
          id: "signal", name: "Nerve signal", at: [-0.44, 0.2],
          note: "The nervous system decides when. No signal, no movement.",
        },
        {
          id: "co2", name: "Carbon dioxide out", at: [0.35, 0.3],
          note: "Carried away in the blood and breathed out at the lungs.",
        },
        {
          id: "urea", name: "Waste and water out", at: [-0.1, 0.44],
          note: "The excretory system takes urea and spare water away.",
        },
        {
          id: "heat", name: "Heat out", at: [0.26, -0.4],
          note: "Muscle is about 25% efficient, so the rest leaves as heat.",
        },
      ],
    },
  ],
};

export const g6b5MealToBlood = buildSim(MEAL_TO_BLOOD);
export const g6b5GasHandover = buildSim(GAS_HANDOVER);
export const g6b5CatchABall = buildSim(CATCH_A_BALL);
export const g6b5WaterBalance = buildSim(WATER_BALANCE);
export const g6b5Exercise = buildSim(EXERCISE);
export const g6b5WhatACellNeeds = buildSim(WHAT_A_CELL_NEEDS);
