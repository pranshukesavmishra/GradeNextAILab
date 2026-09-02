import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit D · Topic D2 — The atmosphere.
 *
 * Five simulations, one per subtopic:
 *
 *   D2.1  g6d2-what-air-is-made-of    composition of the atmosphere  (sort)
 *   D2.2  g6d2-five-floors-up         layers of the atmosphere       (explore)
 *   D2.3  g6d2-ten-tonnes-above       air pressure                   (investigate)
 *   D2.4  g6d2-pick-two-get-the-third pressure, temperature, density (investigate)
 *   D2.5  g6d2-why-warm-air-rises     why warm air rises             (process)
 *
 * The two investigations share one atmosphere: the International Standard
 * Atmosphere, 101.325 kPa and 15 degrees at sea level, falling 6.5 degrees per
 * kilometre. Its pressure curve gives half of sea level at 5.5 km and its
 * density at the surface is 1.225 kg per cubic metre — the numbers printed in
 * the back of every textbook, computed here rather than quoted.
 */

/* D2.1 — Composition of the atmosphere. */
const WHAT_AIR_IS_MADE_OF: ArchetypeSpec = {
  id: "g6d2-what-air-is-made-of",
  title: "What Air Is Made Of",
  tagline: "Two gases are nearly all of it. The ones that matter most are the leftovers.",
  kind: "sort",
  subject: "earth",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "State the fractions of nitrogen, oxygen and argon in dry air.",
    "Explain why gases present in parts per million can still control weather and climate.",
  ],
  misconceptions: [
    "Air is mostly oxygen",
    "A gas present in tiny amounts cannot have a large effect",
  ],
  categories: [
    { id: "bulk", name: "Nearly all of the air", hint: "more than one per cent of every breath" },
    { id: "trace", name: "A steady trace", hint: "a tiny fraction, but the same fraction everywhere" },
    { id: "variable", name: "The one that changes", hint: "different from place to place and hour to hour" },
  ],
  specimens: [
    { id: "n2", name: "Nitrogen", category: "bulk",
      because: "78.08 per cent of dry air. Four molecules in every five you breathe in come straight back out unused, because the triple bond holding N2 together is one of the strongest in chemistry.",
      art: { art: "molecule", formula: "N2" } },
    { id: "o2", name: "Oxygen", category: "bulk",
      because: "20.95 per cent. You breathe in 21 per cent and breathe out about 16, so one breath takes only a quarter of the oxygen that was in it.",
      art: { art: "molecule", formula: "O2" } },
    { id: "ar", name: "Argon", category: "trace",
      because: "0.93 per cent, just under one hundredth. Almost every atom of it was made by potassium-40 decaying inside rock. It reacts with nothing, which is why welders shield their work with it.",
      art: { art: "atom", protons: 18, neutrons: 22, electrons: 18 } },
    { id: "co2", name: "Carbon dioxide", category: "trace",
      because: "About 0.042 per cent: 421 molecules in every million, up from 280 before 1800. Four molecules in ten thousand, and they absorb enough infrared to set the planet's temperature.",
      art: { art: "molecule", formula: "CO2" } },
    { id: "ch4", name: "Methane", category: "trace",
      because: "1.9 parts per million, about two molecules in a million. Over 20 years, one molecule of it traps roughly 80 times as much heat as one molecule of carbon dioxide.",
      art: { art: "molecule", formula: "CH4" } },
    { id: "h2o", name: "Water vapour", category: "variable",
      because: "From almost nothing over Antarctica to 4 per cent over a tropical ocean. It is the only part of the air that condenses at everyday temperatures, and that is the whole reason there is weather.",
      art: { art: "molecule", formula: "H2O" } },
  ],
};

/* D2.2 — Layers of the atmosphere. */
const FIVE_FLOORS_UP: ArchetypeSpec = {
  id: "g6d2-five-floors-up",
  title: "Five Floors Up",
  tagline: "Climb through the atmosphere and the temperature falls, rises, falls and rises again.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-ESS2-6"] },
  learningGoals: [
    "Name the layers of the atmosphere in order and give the height of each boundary.",
    "Explain that each boundary is a place where the temperature stops falling and starts rising, or the reverse.",
  ],
  misconceptions: [
    "The atmosphere just gets steadily colder all the way to space",
    "Space begins right above the clouds",
  ],
  specimens: [
    {
      id: "earth", name: "Earth and its air",
      art: { art: "planet", color: "#2f6fa8", atmosphere: "#9ec8e8" },
      parts: [
        { id: "troposphere", name: "Troposphere", at: [-0.10, -0.50],
          note: "Ground to about 12 km, and 18 km over the equator. Temperature falls 6.5 degrees for every kilometre you climb. It holds three quarters of the atmosphere's mass and nearly all of its water, so every cloud and every storm happens in here." },
        { id: "tropopause", name: "Tropopause", at: [0.34, -0.44],
          note: "The lid, at about -57 degrees. Temperature stops falling, so rising air stops rising: thunderstorm tops spread sideways into anvils against it. The jet streams run along it at more than 100 km/h." },
        { id: "stratosphere", name: "Stratosphere", at: [0.50, -0.14],
          note: "12 to 50 km, and the temperature rises with height here, because ozone between 20 and 30 km soaks up ultraviolet light. Warm air lying on cold air will not overturn, so the air is calm and dry. Airliners cruise in the bottom of it, near 11 km." },
        { id: "mesosphere", name: "Mesosphere", at: [0.44, 0.22],
          note: "50 to 85 km. Temperature falls again, to about -90 degrees at the top: the coldest place anywhere in the atmosphere. Meteors burn up here. The air is thin, but at 20 km/s even this much air is enough to melt rock." },
        { id: "thermosphere", name: "Thermosphere", at: [-0.46, -0.18],
          note: "85 to roughly 600 km. Sunlight drives single molecules past 1 000 degrees, yet there are so few of them that a thermometer hanging here would read far below freezing: temperature is speed, heat is speed times number. The aurora glows in this layer and the space station orbits at 400 km." },
        { id: "exosphere", name: "Exosphere", at: [-0.46, 0.24],
          note: "From about 600 km out to 10 000 km, where it fades into space with no sharp edge. Atoms travel hundreds of kilometres between collisions, and the fastest hydrogen atoms are moving quicker than 11.2 km/s, so they leave Earth for good." },
      ],
    },
  ],
};

/* D2.3 — Air pressure. */
const TEN_TONNES_ABOVE: ArchetypeSpec = {
  id: "g6d2-ten-tonnes-above",
  title: "Ten Tonnes on Every Square Metre",
  tagline: "Air has weight, and all of it above you is pressing down right now.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-PS2-2"] },
  learningGoals: [
    "Explain air pressure as the weight of the air above a surface.",
    "Predict how pressure falls with altitude and what that does to the boiling point of water.",
  ],
  misconceptions: [
    "Air has no weight",
    "Air pressure pushes only downwards",
  ],
  specimens: [{ id: "column", name: "The air above one square metre", art: { art: "apparatus", which: "stand" } }],
  variables: [
    { key: "altitudeM", label: "Altitude (m)", min: 0, max: 9000, step: 50, default: 0 },
    { key: "contactAreaCm2", label: "Area being pressed on (cm2)", min: 10, max: 2000, step: 10, default: 200 },
  ],
  // The International Standard Atmosphere below the tropopause:
  // P = 101.325 (1 - 2.25577e-5 h)^5.25588 kPa. It gives 89.87 kPa at 1 km and
  // half of sea level at 5.5 km, matching the printed tables. The mass of air
  // above a square metre is simply P/g, which is 10 332 kg at sea level. The
  // boiling point comes from the Antoine equation for water,
  // log10(P in mmHg) = 8.07131 - 1730.63/(233.426 + T), inverted: it returns
  // 100.0 degrees at 760 mmHg and about 82 degrees at 5 500 m.
  measure: (v) => {
    const kPa = 101.325 * Math.pow(1 - 2.25577e-5 * v.altitudeM, 5.25588);
    const pa = kPa * 1000;
    const mmHg = pa / 133.322;
    return {
      pressureKPa: kPa,
      pressureHPa: kPa * 10,
      percentOfSeaLevelPressure: (kPa / 101.325) * 100,
      forceOnThatAreaN: pa * (v.contactAreaCm2 / 10000),
      airMassAboveOneSquareMetreKg: pa / 9.80665,
      waterBoilsAtC: 1730.63 / (8.07131 - Math.log10(mmHg)) - 233.426,
    };
  },
  plot: {
    x: "altitudeM", y: "pressureKPa",
    xLabel: "Altitude (m)", yLabel: "Air pressure (kPa)",
  },
};

/* D2.4 — Pressure, temperature and density together. */
const PICK_TWO_GET_THE_THIRD: ArchetypeSpec = {
  id: "g6d2-pick-two-get-the-third",
  title: "Pick Two, and the Third Follows",
  tagline: "Set the pressure and the temperature of a parcel of air, and its density is no longer yours to choose.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-5", "MS-PS1-4"] },
  learningGoals: [
    "Use the gas law to find the density of air from its pressure and temperature.",
    "Explain why heating air at constant pressure must make it less dense.",
  ],
  misconceptions: [
    "Hot air and cold air weigh the same because they are both air",
    "Density is a fixed property of a substance",
  ],
  specimens: [{ id: "parcel", name: "One cubic metre of air", art: { art: "molecule", formula: "N2" } }],
  variables: [
    { key: "pressureKPa", label: "Pressure (kPa)", min: 20, max: 110, step: 0.1, default: 101.3 },
    { key: "temperatureC", label: "Temperature (degrees C)", min: -60, max: 50, step: 1, default: 15 },
  ],
  // The ideal gas law rearranged for density: rho = P M / (R T), with the mean
  // molar mass of dry air M = 0.0289644 kg/mol and R = 8.31446 J/mol K. At
  // 101.325 kPa and 15 degrees it returns 1.225 kg/m3, the standard sea-level
  // density; at 101.325 kPa and 0 degrees the molar volume comes out at
  // 22.41 litres, which is the number in the chemistry textbook. A classroom
  // here is 8 by 7 by 3 metres, so 168 cubic metres.
  measure: (v) => {
    const kelvin = v.temperatureC + 273.15;
    const pa = v.pressureKPa * 1000;
    const molesPerM3 = pa / (8.31446 * kelvin);
    return {
      densityKgPerM3: molesPerM3 * 0.0289644,
      massOfTheAirInAClassroomKg: molesPerM3 * 0.0289644 * 168,
      molesPerCubicMetre: molesPerM3,
      moleculesPerCubicCentimetre: (molesPerM3 * 6.02214076e23) / 1e6,
      litresPerMole: 1000 / molesPerM3,
    };
  },
  plot: {
    x: "temperatureC", y: "densityKgPerM3",
    xLabel: "Temperature (degrees C)", yLabel: "Density of the air (kg/m3)",
  },
};

/* D2.5 — Why warm air rises. */
const WHY_WARM_AIR_RISES: ArchetypeSpec = {
  id: "g6d2-why-warm-air-rises",
  title: "Why Warm Air Goes Up",
  tagline: "Not because heat rises. Because a warmed parcel spreads out, and then weighs less than what it displaces.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6", "MS-PS1-4"] },
  learningGoals: [
    "Explain rising warm air as buoyancy caused by a density difference.",
    "Use the dry adiabatic lapse rate to work out how a rising parcel cools itself.",
  ],
  misconceptions: [
    "Heat itself rises",
    "Rising air cools because it meets colder air higher up",
  ],
  specimens: [{ id: "burner", name: "Ground heated by the Sun", art: { art: "apparatus", which: "burner" } }],
  stages: [
    { name: "The ground heats", at: 0,
      caption: "Dark asphalt reaches 50 degrees under a 25 degree sky. Air molecules touching it are knocked to higher speeds: conduction, and only in the first few millimetres." },
    { name: "The parcel expands", at: 0.2,
      caption: "Warmed from 25 to 35 degrees with the pressure unchanged, a cubic metre must swell by 10 divided by 298, about 3.4 per cent. Same molecules, more space." },
    { name: "It weighs less than its neighbours", at: 0.4,
      caption: "1.146 kg per cubic metre against 1.184 kg outside. That leaves 0.38 N of net upward push on every cubic metre, and up it goes." },
    { name: "Rising, it cools itself", at: 0.6,
      caption: "Pressure falls with height, so the parcel expands and does work on the air around it. Adding no heat at all, it cools 9.8 degrees per kilometre: 35 degrees becomes 25.2 at 1 km." },
    { name: "Cloud, and a second wind", at: 0.8,
      caption: "Reach the dew point and water condenses, handing back 2 450 kJ for every kilogram. The cooling slows to about 5 degrees per kilometre, so the parcel stays warmer than its surroundings and climbs on. That is a cumulus tower." },
    { name: "It stops where it matches", at: 1,
      caption: "The surrounding air cools at 6.5 degrees per kilometre on average. Where parcel and surroundings agree, the push is gone and the rise ends. Cooler air slides in underneath, and the loop is convection." },
  ],
};

export const g6d2WhatAirIsMadeOf = buildSim(WHAT_AIR_IS_MADE_OF);
export const g6d2FiveFloorsUp = buildSim(FIVE_FLOORS_UP);
export const g6d2TenTonnesAbove = buildSim(TEN_TONNES_ABOVE);
export const g6d2PickTwoGetTheThird = buildSim(PICK_TWO_GET_THE_THIRD);
export const g6d2WhyWarmAirRises = buildSim(WHY_WARM_AIR_RISES);
