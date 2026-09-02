import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit E · Topic E2 — Atmospheric and ocean circulation.
 *
 * Six simulations, one per subtopic:
 *
 *   E2.1  g6e2-slanting-sunlight   convection from unequal heating   (investigate)
 *   E2.2  g6e2-three-cells         circulation cells and winds       (explore)
 *   E2.3  g6e2-the-long-throw      an introductory Coriolis effect   (investigate)
 *   E2.4  g6e2-around-the-gyre     surface ocean currents            (trace)
 *   E2.5  g6e2-what-makes-it-sink  temperature, salinity, density    (investigate)
 *   E2.6  g6e2-moving-the-surplus  heat redistribution, combined     (process)
 *
 * Three real constants carry the topic: the solar constant, 1361 W per square
 * metre; the Earth's rotation rate, 7.292e-5 radians per second; and the
 * coefficients of the linearised seawater equation of state. Everything a
 * student reads off a panel here follows from one of the three.
 */

/* E2.1 — Convection cells from unequal heating. */
const SLANTING_SUNLIGHT: ArchetypeSpec = {
  id: "g6e2-slanting-sunlight",
  title: "Slanting Sunlight",
  tagline: "The same beam, spread over more ground. Slide north and watch it thin out.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Explain why a beam of sunlight delivers less energy per square metre at high latitude.",
    "Connect unequal heating to the rising and sinking air of a convection cell.",
  ],
  misconceptions: ["The poles are cold because they are farther from the Sun"],
  specimens: [{ id: "globe", name: "Earth at equinox", art: { art: "planet", color: "#3f7fbf", atmosphere: "#cfe3f5" } }],
  variables: [
    { key: "latitude", label: "Latitude (degrees)", min: 0, max: 85, step: 1, default: 0 },
    { key: "albedo", label: "Fraction reflected by the surface", min: 0.05, max: 0.9, step: 0.01, default: 0.15 },
  ],
  // Lambert's cosine law at equinox noon, with the Sun over the equator.
  // Sunlight arrives at the top of the atmosphere at 1361 W per square metre,
  // and a beam striking at latitude phi is spread over 1/cos(phi) times more
  // ground. At the equator that is the full 1361; at 60 degrees, 681; at 80
  // degrees, 236. The pole is not farther from the Sun by any amount that
  // matters: it is the angle, and only the angle.
  measure: (v) => {
    const c = Math.cos((v.latitude * Math.PI) / 180);
    const flux = 1361 * c;
    return {
      noonSunlightWm2: flux,
      groundSpreadFactor: 1 / c,
      absorbedWm2: flux * (1 - v.albedo),
    };
  },
  plot: { x: "latitude", y: "noonSunlightWm2", xLabel: "Latitude (degrees)", yLabel: "Sunlight arriving (W per square metre)" },
  /*
   * The globe answers the slider by turning until you are looking down on the
   * latitude you chose, so the beam that struck the equator head-on is now
   * arriving edge-on. Its colour is what that ground actually absorbs: about
   * 1 160 W per square metre at the equator under a dark surface, glaring
   * orange, falling through blue to the near-white of a polar cap, where a
   * hundred watts arrives and most of that reflects straight back off the snow.
   */
  drive: ({ v, f }) => ({
    tilt: 0.22 + (v.latitude * Math.PI) / 180 * 0.85,
    color: f.absorbedWm2 >= 900 ? "#e8a04a"
      : f.absorbedWm2 >= 600 ? "#d8bd63"
      : f.absorbedWm2 >= 300 ? "#4f92c8"
      : f.absorbedWm2 >= 120 ? "#95bfdc"
      : "#e4eff8",
  }),
};

/* E2.2 — Circulation cells and prevailing winds. */
const THREE_CELLS: ArchetypeSpec = {
  id: "g6e2-three-cells",
  title: "Three Cells in Each Hemisphere",
  tagline: "Pick apart the loops of air that decide where rainforests and deserts go.",
  kind: "explore",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Name the Hadley, Ferrel and polar cells and say where air rises and sinks in each.",
    "Link the prevailing wind belts to the surface branches of the cells.",
  ],
  misconceptions: ["Warm air rising at the equator travels all the way to the pole in one loop"],
  specimens: [
    {
      id: "globe", name: "Circulation of the atmosphere", art: { art: "planet", color: "#3f7fbf", atmosphere: "#cfe3f5" },
      parts: [
        { id: "itcz", name: "The doldrums, 0 degrees", at: [0.01, 0.0],
          note: "Air heated hardest here rises, cools and rains: the wettest belt on the planet, and a belt sailors dreaded because the surface wind almost stops." },
        { id: "hadley", name: "Hadley cell, 0 to 30 degrees", at: [0.28, -0.12],
          note: "The rising equatorial air runs poleward high up, cools, and comes down near 30 degrees. It cannot reach the pole: the Earth turns beneath it and it is deflected into a loop about 3 000 km across." },
        { id: "highs", name: "Subtropical highs, near 30 degrees", at: [-0.29, -0.19],
          note: "Sinking air warms as it is compressed, so its clouds evaporate. Every great hot desert on Earth sits under one of these, in both hemispheres." },
        { id: "trades", name: "The trade winds", at: [0.2, 0.16],
          note: "The surface branch of the Hadley cell, running back to the equator and bent west by the Earth's spin: northeast trades in the north, southeast in the south." },
        { id: "ferrel", name: "Ferrel cell and the westerlies", at: [0.26, -0.29],
          note: "Between 30 and 60 degrees the surface wind blows from the west, which is why weather in London and Chicago arrives from that side and why an eastbound flight is quicker." },
        { id: "front", name: "The polar front, near 60 degrees", at: [-0.16, -0.34],
          note: "Warm westerlies meet cold polar air and the warm air is forced up. Rain, and one storm after another: this is the birthplace of mid-latitude weather." },
        { id: "polarcell", name: "Polar cell and easterlies", at: [0.06, -0.38],
          note: "Cold dense air sinks over the pole and creeps out along the surface, bent to give easterly winds. The smallest and weakest of the three loops." },
      ],
    },
  ],
};

/* E2.3 — An introductory Coriolis effect. */
const THE_LONG_THROW: ArchetypeSpec = {
  id: "g6e2-the-long-throw",
  title: "The Long Throw",
  tagline: "Aim due north and hold the course. The ground turns underneath you anyway.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Describe how the Earth's rotation deflects anything moving freely over its surface.",
    "Predict how the deflection changes with latitude, speed and time of travel.",
  ],
  misconceptions: ["The Coriolis effect is a force that pushes on the air"],
  specimens: [{ id: "globe", name: "The turning Earth", art: { art: "planet", color: "#3f7fbf", atmosphere: "#cfe3f5" } }],
  variables: [
    { key: "latitude", label: "Latitude (degrees north)", min: 0, max: 80, step: 1, default: 45 },
    { key: "speed", label: "Speed over the ground (m/s)", min: 10, max: 300, step: 5, default: 100 },
    { key: "minutes", label: "Time in flight (minutes)", min: 1, max: 90, step: 1, default: 60 },
  ],
  // The Coriolis parameter f = 2 * omega * sin(latitude), with the Earth's
  // rotation rate omega = 7.292e-5 rad/s. At 45 degrees f is 1.03e-4 per
  // second, so something moving at 100 m/s is pushed sideways at 10.3 mm per
  // second squared and slides 67 km off course in an hour: to the right in the
  // northern hemisphere, to the left in the southern. At the equator sin(0) is
  // zero and the deflection vanishes, which is why hurricanes never form
  // within a few degrees of it. The half-f-v-t-squared form is the standard
  // first-order approximation and holds while the flight is short compared
  // with 1/f, about 2.7 hours at this latitude.
  measure: (v) => {
    const f = 2 * 7.292e-5 * Math.sin((v.latitude * Math.PI) / 180);
    const t = v.minutes * 60;
    const drift = 0.5 * f * v.speed * t * t;
    return {
      sidewaysPushMms2: f * v.speed * 1000,
      sidewaysDriftKm: drift / 1000,
      driftAngleDegrees: (Math.atan2(drift, v.speed * t) * 180) / Math.PI,
    };
  },
  plot: { x: "latitude", y: "sidewaysDriftKm", xLabel: "Latitude (degrees)", yLabel: "Sideways drift (km)" },
  /*
   * Nothing pushes the parcel: the ground turns out from under it. So the
   * globe is what moves here. It slides west by the distance the throw ends up
   * off course — 67 km in an hour at 45 degrees, and not a metre at the equator
   * — while turning about the local vertical at 2 omega sin(latitude), which is
   * zero on the equator and fastest over the pole. Set the latitude to 0 and
   * the globe sits still: that is why hurricanes never form there.
   */
  drive: ({ v, f, t }) => {
    const spinRate = Math.sin((v.latitude * Math.PI) / 180);
    return {
      offset: [-Math.min(0.95, f.sidewaysDriftKm / 120), 0],
      tilt: 0.2 + (v.latitude * Math.PI) / 180 * 0.9,
      spin: 0.68 + t * spinRate * 0.8,
    };
  },
};

/* E2.4 — Surface ocean currents. */
const AROUND_THE_GYRE: ArchetypeSpec = {
  id: "g6e2-around-the-gyre",
  title: "Around the Gyre",
  tagline: "Drop a drifting buoy off Morocco and follow it all the way back.",
  kind: "trace",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Trace a closed loop of surface ocean current and name its four legs.",
    "Explain how prevailing winds and the Earth's rotation together make a gyre turn.",
  ],
  misconceptions: ["Ocean currents are driven by the water pouring out of rivers"],
  specimens: [{ id: "buoy", name: "Drifting buoy 4402", art: { art: "sphere", color: "#f0b84a", radius: 0.32 } }],
  variables: [
    { key: "years", label: "Years since release", min: 0, max: 12, step: 0.1, default: 0 },
    { key: "drift", label: "Mean speed of the current (m/s)", min: 0.1, max: 0.8, step: 0.05, default: 0.3 },
  ],
  /*
   * The six legs of the ring add to about 24 000 km, so at the 0.3 m/s a
   * satellite-tracked drifter averages a full circuit takes 8.0e7 seconds, or
   * 2.5 years. The same arithmetic gives the leg the route describes: 6 500 km
   * of North Equatorial Current at 0.4 m/s is 1.6e7 seconds, about six months.
   * The temperature is the water the buoy is sitting in, leg by leg: 18 degrees
   * in the Canary Current, 28 in the Caribbean, 26 leaving Cape Hatteras, 14 by
   * the time the drift has handed its heat to the air over Europe.
   */
  measure: (v) => {
    const circuitYears = 24e6 / (v.drift * 3.156e7);
    const laps = v.years / circuitYears;
    const legTemp = [18, 26, 28, 27, 26, 14, 18];
    return {
      circuitYears,
      lapsCompleted: laps,
      kilometresTravelled: (v.drift * v.years * 3.156e7) / 1000,
      seaTemperatureC: legTemp[Math.min(6, Math.floor((laps % 1) * 7))],
    };
  },
  /*
   * The buoy is where the years have put it. It rides the ring clockwise —
   * south down the African coast, west across the tropics, north up the
   * American seaboard, east again with the drift — and takes the colour of the
   * water it is in, so you watch it heat up crossing the tropics and give that
   * heat away on the way back to Europe. Two and a half years to a lap.
   */
  drive: ({ f }) => {
    const a = 2 * Math.PI * (f.lapsCompleted % 1);
    return {
      offset: [Math.cos(a) * 1.55, 0.15 + Math.sin(a) * 0.8],
      color: f.seaTemperatureC >= 27 ? "#e8654a"
        : f.seaTemperatureC >= 24 ? "#e8994a"
        : f.seaTemperatureC >= 17 ? "#4fae9a"
        : "#5f9fd0",
      glow: (f.seaTemperatureC - 10) / 22,
    };
  },
  stages: [
    { name: "Wind", at: 0, caption: "The trades push the surface water west near the equator, the westerlies push it east near 50 degrees." },
    { name: "Turning", at: 0.25, caption: "The Earth's spin bends every moving parcel to the right, so the two pushes close into one clockwise ring." },
    { name: "Squeezed", at: 0.5, caption: "The ring is lopsided: the return flow is crammed against the American coast and races." },
    { name: "Heat delivered", at: 0.75, caption: "The warm western edge carries about one petawatt of heat north and hands it to the air over Europe." },
    { name: "Round again", at: 1, caption: "One circuit takes a few years. What cannot escape the middle of the ring stays there for decades." },
  ],
  route: [
    { at: [0.78, 0.34], name: "Canary Current, off Morocco",
      note: "Cool water sliding south down the African coast at roughly 0.3 m/s, pushed along by the northeast trade winds. Upwelling here makes it one of the richest fishing grounds in the Atlantic." },
    { at: [0.72, 0.62], name: "North Equatorial Current",
      note: "Near 15 degrees north the flow turns west and crosses about 6 500 km of open ocean at roughly 0.4 m/s. That is a journey of about six months." },
    { at: [0.34, 0.72], name: "Into the Caribbean",
      note: "The current piles warm water against Central America. Surface temperature here is about 28 degrees, and the sea surface in the western Atlantic stands measurably higher than in the east." },
    { at: [0.19, 0.56], name: "The Florida Straits",
      note: "Everything must leave through a gap about 80 km wide, so the flow speeds up to nearly 2 m/s and carries about 30 million cubic metres a second: roughly twenty-five times every river on Earth combined." },
    { at: [0.23, 0.33], name: "Gulf Stream, off Cape Hatteras",
      note: "Water leaves the Gulf at about 26 degrees and turns northeast into the open Atlantic. The stream is only about 100 km wide here and its edge is sharp enough to see from orbit." },
    { at: [0.5, 0.22], name: "North Atlantic Drift",
      note: "The stream broadens, slows and cools, and the westerlies carry its warmth ashore. Goose Bay in Labrador shares a latitude with northern England and averages about -17 degrees in January; London averages about 5." },
    { at: [0.75, 0.29], name: "Back to Iberia",
      note: "The loop closes and the buoy starts round again. Floating plastic that drifts into the calm middle does not: it collects there as the North Atlantic garbage patch." },
  ],
};

/* E2.5 — Temperature, salinity and density in ocean water. */
const WHAT_MAKES_IT_SINK: ArchetypeSpec = {
  id: "g6e2-what-makes-it-sink",
  title: "What Makes Sea Water Sink",
  tagline: "Chill it, or salt it. Either one and the parcel goes down.",
  kind: "investigate",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Predict the density of sea water from its temperature and its salinity.",
    "Explain why cold, salty water sinks and drives circulation in the deep ocean.",
  ],
  misconceptions: ["Only temperature decides whether water sinks"],
  specimens: [{ id: "parcel", name: "One cubic metre of sea water", art: { art: "glassware", which: "beaker", level: 0.7, color: "#3f9ad8" } }],
  variables: [
    { key: "temperature", label: "Temperature (degrees)", min: -2, max: 30, step: 0.5, default: 10 },
    { key: "salinity", label: "Salinity (grams of salt per kilogram)", min: 0, max: 40, step: 0.5, default: 35 },
  ],
  // The linearised equation of state for sea water, taken about a reference
  // parcel at 10 degrees and 35 g/kg, where the density is 1027 kg per cubic
  // metre: rho = 1027 * (1 - alpha * (T - 10) + beta * (S - 35)), with the
  // thermal expansion coefficient alpha = 1.7e-4 per degree and the haline
  // contraction coefficient beta = 7.6e-4 per gram per kilogram. So cooling a
  // cubic metre by 10 degrees adds about 1.7 kg to it, and adding one gram of
  // salt per kilogram adds about 0.8 kg. Real sea water expands faster as it
  // warms, so this straight-line version drifts by about a kilogram at the
  // warm end of the slider; near the reference point it is good to a tenth.
  // The freezing point falls by 0.054 degrees for every gram of salt per
  // kilogram, which puts ordinary sea water at -1.9 degrees.
  measure: (v) => {
    const density = 1027 * (1 - 1.7e-4 * (v.temperature - 10) + 7.6e-4 * (v.salinity - 35));
    return {
      densityKgM3: density,
      heavierThanTheSurfaceKg: density - 1027,
      freezingPointC: -0.054 * v.salinity,
    };
  },
  plot: { x: "temperature", y: "densityKgM3", xLabel: "Temperature (degrees)", yLabel: "Density (kg per cubic metre)" },
  /*
   * The beaker is a column of ocean and the parcel finds its own level in it.
   * Heavier than the 1 027 kg of the surface and it settles to a thin, dark
   * layer at the bottom; lighter and it floats high and pale. The salt it
   * carries shows as suspended solid. Take it below its freezing point — which
   * the salt itself has pushed down to -1.9 degrees for ordinary sea water —
   * and it turns to ice: white, still, and about three per cent wider, because
   * water expands roughly nine per cent by volume when it freezes.
   */
  drive: ({ v, f }) => {
    const frozen = v.temperature <= f.freezingPointC;
    const heavy = Math.max(-1, Math.min(1, f.heavierThanTheSurfaceKg / 10));
    return {
      level: 0.5 - heavy * 0.32,
      scale: frozen ? 1.03 : 1,
      rate: frozen ? 0 : 1,
      precipitate: (v.salinity / 40) * 0.8,
      bubbles: frozen ? 0 : Math.max(0, -heavy) * 0.6,
      color: frozen ? "#eaf4fb"
        : heavy > 0.45 ? "#15406e"
        : heavy > 0.1 ? "#2b6da4"
        : heavy > -0.15 ? "#3f9ad8"
        : "#93d3ea",
    };
  },
};

/* E2.6 — Heat redistribution: one combined model. */
const MOVING_THE_SURPLUS: ArchetypeSpec = {
  id: "g6e2-moving-the-surplus",
  title: "Moving the Surplus",
  tagline: "The tropics take in more than they give back. Follow where the extra goes.",
  kind: "process",
  subject: "earth",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS2-6"] },
  learningGoals: [
    "Explain why the tropics run an energy surplus and the poles an energy deficit.",
    "Describe how the atmosphere and the ocean together carry that surplus poleward.",
  ],
  misconceptions: ["The tropics keep getting hotter because they receive more sunlight"],
  specimens: [{ id: "globe", name: "The whole system", art: { art: "planet", color: "#3f7fbf", atmosphere: "#cfe3f5" } }],
  variables: [
    { key: "latitude", label: "Latitude (degrees)", min: 0, max: 90, step: 1, default: 0 },
  ],
  /*
   * The zonal-mean net radiation, fitted as N = A * (cos 2phi - 1/3). The
   * one-third is not a free choice: it is what makes the surplus and the
   * deficit cancel over the whole sphere, which they must, and it puts the
   * crossing at 35.3 degrees. A = 84 W per square metre is set by the observed
   * peak transport, and it gives +56 W at the equator and -112 W at the poles.
   * Integrating that imbalance from the equator outwards gives the energy that
   * has to be carried across each latitude,
   *   F(phi) = A * 2 * pi * R^2 * (2/3) * sin(phi) * cos^2(phi),
   * which peaks at 5.5 petawatts near 35 degrees and returns to zero at the
   * pole, where there is nothing left beyond to warm.
   */
  measure: (v) => {
    const phi = (v.latitude * Math.PI) / 180;
    const s = Math.sin(phi);
    const netWm2 = 84 * (Math.cos(2 * phi) - 1 / 3);
    return {
      netWm2,
      transportPW: (84 * 2 * Math.PI * 6.371e6 * 6.371e6 * (2 / 3) * s * (1 - s * s)) / 1e15,
      surplus: netWm2 > 0 ? 1 : 0,
    };
  },
  /*
   * Turn the globe to a latitude and it takes that band's colour: the deep
   * red of a tropical surplus, the balance point near 35 degrees, and the
   * white of a polar deficit losing 112 W on every square metre. Nothing on
   * this planet is running away with the heat, which is the puzzle the stages
   * then answer.
   */
  drive: ({ v, f }) => ({
    tilt: 0.2 + (v.latitude * Math.PI) / 180 * 0.9,
    color: f.netWm2 >= 40 ? "#c9553a"
      : f.netWm2 >= 15 ? "#d98f4c"
      : f.netWm2 >= -15 ? "#c2bf94"
      : f.netWm2 >= -60 ? "#5f9fd0"
      : "#e2eef7",
  }),
  stages: [
    { name: "Surplus", at: 0,
      caption: "Between about 35 north and 35 south the Earth absorbs more sunlight than it radiates away: about 56 W on every square metre at the equator." },
    { name: "Deficit", at: 0.2,
      caption: "Poleward of 35 degrees it is the other way round, and at the poles the shortfall reaches about 110 W per square metre." },
    { name: "The puzzle", at: 0.4,
      caption: "Yet the tropics are not warming year on year and the poles are not cooling. Something carries the surplus from one to the other." },
    { name: "The air", at: 0.6,
      caption: "Hadley cells move it out of the tropics; beyond 30 degrees, mid-latitude storms do the work, and the air carries roughly three-quarters of the total there." },
    { name: "The sea", at: 0.8,
      caption: "Within about 20 degrees of the equator the ocean carries most of it: the Gulf Stream and the Kuroshio are conveyor belts of warm surface water." },
    { name: "The peak", at: 1,
      caption: "Near 35 degrees the combined transport peaks at about 5.5 petawatts, roughly 300 times all the power humanity uses. At the pole it is back to zero: there is nothing beyond it left to warm." },
  ],
};

export const g6e2SlantingSunlight = buildSim(SLANTING_SUNLIGHT);
export const g6e2ThreeCells = buildSim(THREE_CELLS);
export const g6e2TheLongThrow = buildSim(THE_LONG_THROW);
export const g6e2AroundTheGyre = buildSim(AROUND_THE_GYRE);
export const g6e2WhatMakesItSink = buildSim(WHAT_MAKES_IT_SINK);
export const g6e2MovingTheSurplus = buildSim(MOVING_THE_SURPLUS);
