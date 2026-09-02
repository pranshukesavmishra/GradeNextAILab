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
    { id: "sample", name: "The blood glucose reading", art: { art: "glassware", which: "testTube", level: 0.6, color: "#b03a3a" } },
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
  /*
   * The tube is the reading, filled from 4 mmol/L at the bottom to 10 at the
   * brim, so it stands at 0.17 when the blood is fasting and climbs to 0.63 at
   * the 7.8 mmol/L mark. That mark matters: 7.8 two hours after a 75 g load is
   * the line between a normal result and impaired glucose tolerance, so the
   * tube turns amber above it and red above 11.1, where the diagnosis changes
   * again. Leave the slider at 0 or run it out to 180 minutes and the reading
   * is the same 5.0 both times, which is exactly what a healthy answer looks
   * like — the interesting part is the half hour in between.
   */
  drive: ({ f }) => ({
    level: Math.max(0.02, Math.min(1, (f.bloodGlucose - 4) / 6)),
    color: f.bloodGlucose >= 11.1 ? "#e0483f" : f.bloodGlucose >= 7.8 ? "#d89a3c" : "#b03a3a",
    bubbles: 0,
  }),
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
  /*
   * The air sac fills and empties at 14 breaths a minute, the resting rate, so
   * the level rises and falls the whole way through — nothing here is still.
   * What changes across the run is the blood on the other side of the wall: it
   * arrives dark, with oxygen at 5.3 kPa, and leaves bright at 98 per cent
   * saturation, so the colour swings once and only once, at the moment the
   * gases actually cross.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const breath = 0.5 + 0.5 * Math.sin(t * 1.47);
    const stage = Math.min(4, Math.floor(p * 5));
    return {
      level: 0.12 + 0.16 * breath,
      color: ["#6a86b8", "#6a86b8", "#9a6a8a", "#c04a48", "#d4463a"][stage],
      bubbles: p > 0.3 && p < 0.7 ? 0.9 : 0.3,
    };
  },
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
  specimens: [
    { id: "ball", name: "The ball, still coming", art: { art: "sphere", color: "#e08a2c", radius: 0.5 } },
  ],
  /*
   * The ball does not wait for the nervous system, and that is the point of the
   * subtopic. It keeps coming through every stage — larger as it nears, because
   * a thing twice as close looks twice as wide — and only in the last stage,
   * about 250 ms after it came into view, does the hand close on it. A ball
   * thrown at 10 m/s covers two and a half metres in that quarter second.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const caught = p > 0.9;
    return {
      scale: caught ? 1.5 : 0.35 + p * 1.25,
      offset: [0.5 - p * 0.5, -0.15 + p * 0.15],
      spin: t * (caught ? 0 : 2.2),
      rate: caught ? 0 : 1,
    };
  },
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
  /*
   * A day's urine in one beaker, drawn against a 5 litre scale, and coloured
   * the way urine really is coloured: pale when it is dilute, deep amber when
   * the kidney has squeezed it down. The colour is set from the concentration
   * the model computes, so the two always agree. At 1 200 mOsm/L the beaker
   * goes dark and stops falling — that is the hard floor of about half a litre
   * a day, the least water the body can shed 600 mOsm of solute in, and no
   * amount of extra sweating will get it lower.
   */
  drive: ({ f }) => {
    const shade = Math.max(0, Math.min(4, Math.round((f.concentration - 100) / 275)));
    return {
      level: Math.min(1, f.urineLitres / 5),
      color: ["#f2ecc0", "#eede8a", "#e6c95e", "#d8a63c", "#b87a24"][shade],
      bubbles: 0,
    };
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
  /*
   * The heart beats at the rate the panel prints — 70 a minute sitting still,
   * 170 at 250 W — so the pulse you watch is the reading. It also fills more.
   * Stroke volume is cardiac output divided by heart rate, which is 71 mL at
   * rest and 118 mL flat out, and a chamber holding 1.66 times the volume is
   * the cube root of that, 1.18 times, across: the heart works harder in two
   * separate ways at once, and both of them are on the picture.
   */
  drive: ({ f, t }) => {
    const strokeMl = (f.cardiacOutput * 1000) / f.heartRate;
    const beat = Math.max(0, Math.sin((t * f.heartRate * Math.PI) / 30));
    return {
      scale: Math.cbrt(strokeMl / 71) * (1 - 0.12 * beat * beat),
      color: ["#8c2a22", "#a8332a", "#c0392b", "#d4463a", "#e8574a"][
        Math.max(0, Math.min(4, Math.round((f.heartRate - 70) / 25)))
      ],
      spin: 0.68 + t * 0.2,
    };
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
