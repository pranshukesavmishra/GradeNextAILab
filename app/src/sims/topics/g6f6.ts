import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit F · Topic F6 — Minimizing human impact.
 *
 * Five simulations, one per subtopic:
 *
 *   F6.1  g6f6-how-we-watch        monitoring and indicators           (explore)
 *   F6.2  g6f6-cause-or-harm       mitigation and adaptation           (sort)
 *   F6.3  g6f6-a-problem-worth-solving  criteria and constraints       (assemble)
 *   F6.4  g6f6-what-matters-most   comparing and scoring alternatives  (investigate)
 *   F6.5  g6f6-fact-or-judgement   technical claims versus values      (sort)
 *
 * F6.4 is the engineering heart of the unit. The three options carry their
 * real life-cycle carbon, real cost and real land use; the student sets the
 * weights, and the winner changes. That is the honest lesson of MS-ETS1-2:
 * the arithmetic is objective and the weighting is not, which is exactly what
 * F6.5 then asks them to separate.
 */

/* ---------------------------------------------------------------- *
 * F6.1 — Monitoring and indicators
 * ---------------------------------------------------------------- */

const HOW_WE_WATCH: ArchetypeSpec = {
  id: "g6f6-how-we-watch",
  title: "How We Watch the Planet",
  tagline: "Six instruments, none of which can be checked by looking out of the window.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-3", "MS-ESS3-5"] },
  learningGoals: [
    "Name the main indicators used to monitor the climate and say what each measures.",
    "Explain what makes a good indicator: measured the same way for decades, sensitive to the thing you care about, and checked by more than one team.",
  ],
  misconceptions: [
    "Monitoring is just reading thermometers",
    "A single year's measurement tells you whether something is working",
  ],
  specimens: [
    {
      id: "system",
      name: "The observing system",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
      parts: [
        {
          id: "maunaloa", name: "Mauna Loa CO2", at: [0.0, -0.56],
          note: "Continuous since March 1958, 3,400 metres up a Pacific volcano chosen because the air there is thoroughly mixed. Flask samples from around 40 other stations agree with it, which is how you know it is not measuring Hawaii.",
        },
        {
          id: "argo", name: "Argo floats", at: [-0.46, -0.34],
          note: "About 3,900 floats drifting worldwide, diving to 2,000 metres and surfacing every ten days. Ocean heat content is the steadiest indicator there is, because more than 90 per cent of the extra energy ends up in the sea.",
        },
        {
          id: "altimeter", name: "Satellite altimeters", at: [0.46, -0.34],
          note: "From TOPEX in 1992 through Jason to Sentinel-6, radar measures the height of the sea surface from 1,336 km up. Global mean sea level now comes out to better than half a millimetre per year.",
        },
        {
          id: "grace", name: "GRACE gravity satellites", at: [-0.52, 0.06],
          note: "Two satellites 220 km apart, measuring the distance between themselves to about a micrometre. Ice sheets are literally weighed by their pull: Greenland is losing roughly 270 gigatonnes a year, Antarctica about 150.",
        },
        {
          id: "seaice", name: "Passive microwave sea ice", at: [0.52, 0.06],
          note: "Ice and open water emit microwaves differently, so satellites map the ice through cloud and polar night. The same instruments have run since 1979: September Arctic extent is down 12.2 per cent per decade.",
        },
        {
          id: "ceres", name: "CERES energy budget", at: [0.0, 0.52],
          note: "Measures the sunlight coming in and the infrared going out at the top of the atmosphere. The gap is about 0.9 W/m2, and that single number is the most direct statement that the planet is still gaining heat.",
        },
      ],
    },
  ],
};

export const g6f6HowWeWatch = buildSim(HOW_WE_WATCH);

/* ---------------------------------------------------------------- *
 * F6.2 — Mitigation and adaptation
 * ---------------------------------------------------------------- */

const CAUSE_OR_HARM: ArchetypeSpec = {
  id: "g6f6-cause-or-harm",
  title: "Fix the Cause, or Fix the Harm?",
  tagline: "Six real projects. Some change what goes into the air, some change what it does to us, and two do both.",
  kind: "sort",
  subject: "engineering",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS3-3", "MS-ETS1-1"] },
  learningGoals: [
    "Distinguish mitigation, which reduces emissions, from adaptation, which reduces harm.",
    "Recognise that some measures do both, and that adaptation does not remove the need for mitigation.",
  ],
  misconceptions: [
    "Adapting well means we no longer need to cut emissions",
    "Any environmental project counts as fighting climate change",
  ],
  categories: [
    { id: "mitigation", name: "Mitigation", hint: "less greenhouse gas goes into the air" },
    { id: "adaptation", name: "Adaptation", hint: "the same climate does less damage" },
    { id: "both", name: "Both at once", hint: "cuts emissions and reduces harm" },
  ],
  specimens: [
    {
      id: "wind", name: "Replacing a coal plant with onshore wind", category: "mitigation",
      because: "Coal releases about 820 grams of CO2-equivalent per kilowatt-hour over its whole life cycle and onshore wind about 11. A 700 MW coal plant running at 60 per cent makes 3.7 TWh a year and 3.0 million tonnes of CO2; wind makes the same electricity for about 40,000 tonnes.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "insulation", name: "Insulating a house", category: "mitigation",
      because: "Cutting a home's heating demand from 12,000 to 7,000 kilowatt-hours saves 5,000 kWh of gas a year. At 0.183 kg of CO2 per kilowatt-hour that is about 915 kg a year, every year, from doing nothing but keeping the heat in.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "seawall", name: "Building a flood barrier", category: "adaptation",
      because: "It does not lower the sea by a millimetre; it changes what the sea can do to the town. The Thames Barrier has been closed against flooding more than 200 times since 1982, and the closures have grown far more frequent.",
      art: { art: "habitat", which: "ocean" },
    },
    {
      id: "wheat", name: "Breeding a drought-tolerant wheat", category: "adaptation",
      because: "Not one gram of emissions is avoided. What changes is how much of the harvest survives when the rain fails, which is the difference between a bad year and a famine.",
      art: { art: "flora", which: "grass" },
    },
    {
      id: "mangrove", name: "Restoring a mangrove forest", category: "both",
      because: "Mangroves hold three to five times more carbon per hectare than tropical forest, most of it in the mud beneath them, and a 100 metre belt takes between 13 and 66 per cent out of the height of an incoming wave.",
      art: { art: "flora", which: "shrub" },
    },
    {
      id: "streettrees", name: "Planting street trees in a city", category: "both",
      because: "A tree stores carbon while it grows, and the shade under it can be ten degrees cooler at pavement level on a hot afternoon. Cities are already several degrees warmer than the countryside around them.",
      art: { art: "flora", which: "tree" },
    },
  ],
};

export const g6f6CauseOrHarm = buildSim(CAUSE_OR_HARM);

/* ---------------------------------------------------------------- *
 * F6.3 — Defining the problem, criteria and constraints
 * ---------------------------------------------------------------- */

const A_PROBLEM_WORTH_SOLVING: ArchetypeSpec = {
  id: "g6f6-a-problem-worth-solving",
  title: "Before You Design Anything",
  tagline: "A real school, a real gas bill. Assemble the problem statement before anyone suggests a solution.",
  kind: "assemble",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1", "MS-ESS3-3"] },
  learningGoals: [
    "State a design problem as a need, with criteria for success and constraints on the solution.",
    "Tell a criterion, which says how good is good enough, from a constraint, which says what you may not do.",
    "Decide in advance how the result will be measured.",
  ],
  misconceptions: [
    "The problem statement is where you say which solution to build",
    "Criteria and constraints are the same thing",
    "You can judge whether it worked by asking whether people liked it",
  ],
  specimens: [
    {
      id: "boiler",
      name: "The school boiler, and the problem around it",
      art: { art: "apparatus", which: "burner" },
      parts: [
        {
          id: "need", name: "The need, with no solution in it", at: [0.0, -0.56],
          note: "Our school burns 240,000 kilowatt-hours of gas a year for heating, which is about 44 tonnes of CO2. We want to cut that. Notice what is missing: install solar panels is an answer wearing a problem's clothes, and it closes off every other option before anyone has looked.",
        },
        {
          id: "crit1", name: "Criterion: how much, by when", at: [-0.46, -0.32],
          note: "Cut heating emissions by at least half within three years, read straight off the gas meter. A criterion has a number and a deadline, or it cannot be failed.",
        },
        {
          id: "crit2", name: "Criterion: what must not get worse", at: [0.46, -0.32],
          note: "Every classroom stays between 18 and 24 degrees during term. Without this, the cheapest way to hit the first criterion is to turn the heating off.",
        },
        {
          id: "cons1", name: "Constraint: money", at: [-0.52, 0.08],
          note: "No more than 60,000 pounds of capital, because that is what the trust has. A constraint is not a preference; a design that breaks it is not a design.",
        },
        {
          id: "cons2", name: "Constraint: the building itself", at: [0.52, 0.08],
          note: "Solid brick walls with no cavity to fill, and the building is listed, so external cladding is not permitted. Physical and legal limits are constraints just as firmly as money is.",
        },
        {
          id: "cons3", name: "Constraint: time and disruption", at: [-0.30, 0.48],
          note: "All work in the six-week summer holiday. This rules out several otherwise good answers, which is exactly what a constraint is for.",
        },
        {
          id: "measure", name: "How you will know", at: [0.30, 0.48],
          note: "Meter readings plus loggers in three classrooms, compared against heating degree days so that a mild winter cannot be mistaken for a successful project. Decide this before you start, or you will be arguing about it afterwards.",
        },
      ],
    },
  ],
};

export const g6f6AProblemWorthSolving = buildSim(A_PROBLEM_WORTH_SOLVING);

/* ---------------------------------------------------------------- *
 * F6.4 — Comparing and scoring alternatives
 * ---------------------------------------------------------------- */

const WHAT_MATTERS_MOST: ArchetypeSpec = {
  id: "g6f6-what-matters-most",
  title: "What Matters Most?",
  tagline: "Gas, solar and wind, with their real numbers. Move the weights and watch the winner change.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ETS1-2", "MS-ESS3-3"], ccssMath: ["6.RP.A.3", "7.RP.A.2"] },
  learningGoals: [
    "Score competing designs against several criteria at once using a weighted matrix.",
    "Show that the ranking depends on the weights, and that choosing the weights is not a measurement.",
    "Read a life-cycle emission figure and understand that it covers building the thing as well as running it.",
  ],
  misconceptions: [
    "One option is simply the best, whatever you care about",
    "Renewable electricity has no emissions at all",
    "A decision matrix removes the need for a judgement",
  ],
  specimens: [
    { id: "grid", name: "One terawatt-hour of electricity a year", art: { art: "apparatus", which: "bulb" } },
  ],
  variables: [
    { key: "carbonWeight", label: "How much carbon matters (0-10)", min: 0, max: 10, step: 1, default: 5 },
    { key: "costWeight", label: "How much cost matters (0-10)", min: 0, max: 10, step: 1, default: 5 },
    { key: "landWeight", label: "How much land matters (0-10)", min: 0, max: 10, step: 1, default: 5 },
  ],
  // Real inputs, all per unit of electricity generated.
  //
  //   life-cycle carbon (IPCC AR5 medians, gCO2e/kWh):  gas 490, solar 48, wind 11
  //   levelised cost (US dollars per MWh, 2023):         gas 70,  solar 60, wind 45
  //   site area (km2 per TWh per year):                  gas 1,   solar 15, wind 100
  //
  // Wind's site area is the whole wind farm; only about one per cent of it is
  // actually built on, and the rest stays farmland. Coal, at 820 gCO2e/kWh,
  // sets the worst case for the carbon score, 150 dollars per MWh for cost and
  // 150 km2 per TWh for land, so every score runs from 0 for the worst case up
  // to 100 for zero impact. The normalisation is a choice and is stated here
  // so that a student can change it and see what it does.
  measure: (v) => {
    const score = (value: number, worst: number) => 100 * (1 - value / worst);
    const w = v.carbonWeight + v.costWeight + v.landWeight;
    const total = w > 0 ? w : 1;
    const weighted = (carbon: number, cost: number, land: number) =>
      (score(carbon, 820) * v.carbonWeight
        + score(cost, 150) * v.costWeight
        + score(land, 150) * v.landWeight) / total;
    const gas = weighted(490, 70, 1);
    const solar = weighted(48, 60, 15);
    const wind = weighted(11, 45, 100);
    return {
      gasScore: gas,
      solarScore: solar,
      windScore: wind,
      bestScore: Math.max(gas, solar, wind),
      windMinusGas: wind - gas,
    };
  },
  plot: { x: "carbonWeight", y: "windMinusGas", xLabel: "How much carbon matters", yLabel: "Wind score minus gas score" },
  /*
   * The lamp is the terawatt-hour, and it sits wherever the weights put it:
   * left towards gas, right towards wind, by the margin between their scores.
   * Care only about cost and land and it slides hard to the gas end, because
   * a wind farm's site is a hundred square kilometres per terawatt-hour
   * against gas's one. Turn the carbon weight up and it crosses over, because
   * wind emits 11 grams of CO2-equivalent per kilowatt-hour against gas's 490.
   * Nothing about the three technologies changed while it moved. Only what the
   * person at the slider decided to care about, which is the whole subtopic.
   */
  drive: ({ f }) => ({
    offset: [Math.max(-1, Math.min(1, f.windMinusGas / 25)), 0],
    scale: 0.55 + 0.5 * (f.bestScore / 100),
    tilt: 0.24 + f.windMinusGas / 90,
  }),
};

export const g6f6WhatMattersMost = buildSim(WHAT_MATTERS_MOST);

/* ---------------------------------------------------------------- *
 * F6.5 — Technical claims versus value judgements
 * ---------------------------------------------------------------- */

const FACT_OR_JUDGEMENT: ArchetypeSpec = {
  id: "g6f6-fact-or-judgement",
  title: "Which of These Could You Measure?",
  tagline: "Six sentences from the same town meeting. Some are settled with an instrument, some never can be.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ETS1-1", "MS-ESS3-3"] },
  learningGoals: [
    "Separate a technical claim, which evidence can settle, from a value judgement, which it cannot.",
    "Notice sentences that carry both at once, and take them apart.",
    "Accept that a value judgement is a legitimate part of a decision, not a mistake to be removed.",
  ],
  misconceptions: [
    "Science can decide what a community ought to do",
    "A value judgement is just an opinion and can be ignored",
    "If people disagree about a policy, they must disagree about the facts",
  ],
  categories: [
    { id: "technical", name: "Measurable", hint: "an instrument or a record could settle it" },
    { id: "value", name: "A judgement about what matters", hint: "no measurement could settle it" },
    { id: "mixed", name: "Both at once", hint: "a testable claim with a value inside it" },
  ],
  specimens: [
    {
      id: "windco2", name: "Onshore wind releases about 11 g of CO2 per kilowatt-hour over its lifetime", category: "technical",
      because: "A life-cycle assessment counts the steel, the concrete, the transport, the maintenance and the decommissioning. Every step can be audited, and independent studies land close to the same figure.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "wallhomes", name: "This barrier would protect 400 homes from a 1-in-200-year flood", category: "technical",
      because: "It follows from the height of the wall, the tide gauge record and the flood map. If it is wrong, it is wrong in a way that can be checked and corrected.",
      art: { art: "habitat", which: "ocean" },
    },
    {
      id: "view", name: "The turbines would spoil the view from the ridge", category: "value",
      because: "There is no instrument that reads spoiled. It is still a real objection and belongs in the decision; it simply cannot be settled by measuring anything.",
      art: { art: "habitat", which: "meadow" },
    },
    {
      id: "money", name: "The money should go to the school rather than the barrier", category: "value",
      because: "Both costs can be measured to the penny and both benefits can be estimated. Which of them the town owes more to is a choice about what matters, and no amount of data decides it.",
      art: { art: "sphere", color: "#c2a86a", radius: 0.46 },
    },
    {
      id: "nuclear", name: "Nuclear is the safest option", category: "mixed",
      because: "The measurable part: about 0.03 deaths per terawatt-hour against coal's 24.6. The value part: which harms count as safety, how far into the future you count them, and how you weigh a rare large accident against steady everyday harm.",
      art: { art: "atom", protons: 92, neutrons: 143, electrons: 92 },
    },
    {
      id: "future", name: "Cutting emissions now is worth the inconvenience, for people alive in 2100", category: "mixed",
      because: "Whether the cuts leave people in 2100 better off is a question models can address. How much we owe people who are not born yet is not, and that is the half that decides the argument.",
      art: { art: "planet", color: "#2f6ea8", atmosphere: "#a8d4f0" },
    },
  ],
};

export const g6f6FactOrJudgement = buildSim(FACT_OR_JUDGEMENT);
