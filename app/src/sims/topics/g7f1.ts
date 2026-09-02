import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit F · Topic F1 — Types of natural hazard.
 *
 * Five simulations, one per subtopic:
 *
 *   F1.1  g7f1-what-drives-it      geologic hazards            (sort)
 *   F1.2  g7f1-river-in-the-sky    weather-driven hazards      (process)
 *   F1.3  g7f1-across-the-pacific  tsunamis as a linked hazard (trace)
 *   F1.4  g7f1-the-golden-state    California's hazard profile (explore)
 *   F1.5  g7f1-how-far-how-long    a hazard's reach and length (investigate)
 *
 * Two relationships carry the arithmetic of the whole unit. Earthquake energy
 * is 10^(1.5M + 4.8) joules, so one step of magnitude is 31.6 times the energy.
 * A tsunami runs at the square root of g times the water depth, which is why
 * it crosses an ocean at the speed of an airliner and arrives walking pace.
 */

/* ---------------------------------------------------------------- *
 * F1.1 — Geologic hazards
 * ---------------------------------------------------------------- */

const WHAT_DRIVES_IT: ArchetypeSpec = {
  id: "g7f1-what-drives-it",
  title: "What Drives It?",
  tagline: "Six geologic hazards. Each one is a different way for the ground to let go.",
  kind: "sort",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Group geologic hazards by the process that drives them, not by how much damage they do.",
    "Use the magnitude-energy relation to compare the size of two earthquakes.",
  ],
  misconceptions: [
    "All geologic hazards come from earthquakes",
    "A magnitude 8 is twice as big as a magnitude 4",
  ],
  categories: [
    { id: "fault", name: "Fault slip", hint: "stored strain released along a break" },
    { id: "magma", name: "Magma on the move", hint: "molten rock reaching the surface" },
    { id: "slope", name: "Slope failure", hint: "gravity pulling a hillside down" },
  ],
  specimens: [
    {
      id: "loma", name: "Loma Prieta, 1989: fifteen seconds of shaking", category: "fault",
      because:
        "Magnitude 6.9 on a strand of the San Andreas system, 18 km down. E = 10^(1.5M + 4.8) puts "
        + "1.4 x 10^15 J into the ground, about 340 kilotonnes of TNT, in roughly 15 seconds.",
      art: { art: "landform", which: "quake" },
    },
    {
      id: "fence", name: "A fence offset 6.4 m at Point Reyes, 1906", category: "fault",
      because:
        "Elastic rebound. The crust bent past the fault for decades, then 477 km of the San Andreas "
        + "snapped in the M7.9 rupture and carried one half of the fence 6.4 m north of the other.",
      art: { art: "landform", which: "transform" },
    },
    {
      id: "sthelens", name: "Mount St Helens, 18 May 1980", category: "magma",
      because:
        "Magma pushed the north flank out by more than a metre a day until it slid away and "
        + "uncorked the pressure. The summit fell from 2 950 m to 2 549 m in minutes.",
      art: { art: "landform", which: "volcano" },
    },
    {
      id: "kilauea", name: "Kilauea's lower East Rift Zone, 2018", category: "magma",
      because:
        "Magma travelled 40 km down a rift and opened 24 fissures. Fissure 8 fountained about 80 m "
        + "high for three months and around 0.8 km3 of lava buried more than 700 homes.",
      art: { art: "landform", which: "rift" },
    },
    {
      id: "oso", name: "The Oso landslide, 22 March 2014", category: "slope",
      because:
        "About 7.6 million m3 of saturated glacial till crossed a kilometre of valley in roughly a "
        + "minute. The trigger was rain, close to twice the normal amount for the three weeks before.",
      art: { art: "landform", which: "terrain" },
    },
    {
      id: "conchita", name: "La Conchita, California, 10 January 2005", category: "slope",
      because:
        "Weak marine sediment, soaked by two weeks of near-record rain, sent about 200 000 m3 of "
        + "bluff onto the town. The same slope had already failed in 1995, on the same rain trigger.",
      art: { art: "landform", which: "sedimentary" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F1.2 — Weather-driven hazards
 * ---------------------------------------------------------------- */

const RIVER_IN_THE_SKY: ArchetypeSpec = {
  id: "g7f1-river-in-the-sky",
  title: "A River in the Sky",
  tagline: "Follow one atmospheric river from the warm Pacific to a flooded Central Valley.",
  kind: "process",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Describe how an atmospheric river moves water vapour and where it drops it.",
    "Explain why the same storm can be a water supply and a flood hazard.",
  ],
  misconceptions: [
    "Floods only happen where it is raining hardest",
    "California's drought and California's floods are unrelated problems",
  ],
  specimens: [
    { id: "vapour", name: "Water vapour, the cargo", art: { art: "molecule", formula: "H2O" } },
  ],
  stages: [
    {
      name: "Over the ocean", at: 0,
      caption: "A band 400 km wide carries vapour past 750 kg per metre per second: an AR3.",
    },
    {
      name: "Landfall", at: 0.25,
      caption: "Atmospheric rivers deliver 30 to 50 per cent of California's yearly precipitation.",
    },
    {
      name: "Up the Sierra", at: 0.5,
      caption: "Lifted 3 000 m, the air cools about 6 degrees per km and drops what it cannot hold.",
    },
    {
      name: "Into the rivers", at: 0.75,
      caption: "Nine storms in three weeks in 2023 put roughly 120 km3 of water on the state.",
    },
    {
      name: "The flood", at: 1,
      caption: "The ARkStorm scenario floods a quarter of the buildings: 725 billion dollars lost.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F1.3 — Tsunamis as a linked hazard
 * ---------------------------------------------------------------- */

const ACROSS_THE_PACIFIC: ArchetypeSpec = {
  id: "g7f1-across-the-pacific",
  title: "Across the Pacific in Ten Hours",
  tagline: "One rupture off Japan, one wrecked harbour in California, and 7 200 km in between.",
  kind: "trace",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Explain how a seafloor earthquake becomes a wave that crosses an ocean.",
    "Use wave speed equals the square root of g times depth to predict arrival time.",
  ],
  misconceptions: [
    "A tsunami is a tall wall of water all the way across the ocean",
    "You are safe from a tsunami if the earthquake was somewhere else",
  ],
  stages: [
    { name: "Rupture", at: 0, caption: "M9.0 off Tohoku, 11 March 2011. The seafloor lifts several metres." },
    { name: "Open ocean", at: 0.25, caption: "0.5 m high, 200 km long, 740 km/h. A ship rides over it unaware." },
    { name: "Shoaling", at: 0.5, caption: "In 10 m of water the wave slows to 36 km/h and piles up behind itself." },
    { name: "Crescent City", at: 0.75, caption: "2.47 m surge after 9 hours 40 minutes. Sixteen boats destroyed." },
    { name: "The ledger", at: 1, caption: "One quake, four hazards: shaking, tsunami, fire and reactor failure." },
  ],
  route: [
    {
      at: [0.09, 0.66], name: "The Japan Trench",
      note: "The Pacific plate dives beneath Japan at about 8 cm a year. On 11 March 2011 a patch "
        + "500 km long let go, slipping up to 50 m near the trench and lifting the seafloor with it.",
    },
    {
      at: [0.26, 0.34], name: "The water column responds",
      note: "Lift 4 km of ocean by 5 m and you have raised a mound holding an enormous store of "
        + "potential energy. It cannot stay a mound, so it spreads outward as a wave.",
    },
    {
      at: [0.44, 0.62], name: "Deep-ocean crossing",
      note: "Speed is the square root of g times depth. In 4 300 m of water that is 205 m/s, about "
        + "740 km/h, the cruising speed of an airliner. The crest is only half a metre high.",
    },
    {
      at: [0.6, 0.3], name: "The DART buoy",
      note: "A pressure sensor on the seabed detects a 1 cm change and reports through a surface "
        + "buoy. That measurement is what turns a model forecast into a warning with a real number.",
    },
    {
      at: [0.76, 0.58], name: "Shoaling at the shelf",
      note: "In 10 m of water speed drops to 9.9 m/s. Energy has to go somewhere, so height rises: "
        + "by Green's law the amplitude grows as depth to the power minus one quarter, here 4.5 times.",
    },
    {
      at: [0.91, 0.36], name: "Crescent City harbour",
      note: "The harbour's shape rings like a bell at tsunami periods, so it is hit harder than its "
        + "neighbours. The 2011 waves reached 2.47 m and did about 20 million dollars of damage.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F1.4 — California's own hazard profile
 * ---------------------------------------------------------------- */

const THE_GOLDEN_STATE: ArchetypeSpec = {
  id: "g7f1-the-golden-state",
  title: "One State, Six Hazards",
  tagline: "Click each marked place. California collects hazards the way other states collect one.",
  kind: "explore",
  subject: "engineering",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-ESS3-2"] },
  learningGoals: [
    "Name the main hazards a Californian community plans for and say what drives each.",
    "Explain that hazard depends on where you are, not only on what is possible.",
  ],
  misconceptions: [
    "Earthquakes are the only hazard California has to plan for",
    "A hazard that has not happened in a lifetime is not a hazard",
  ],
  specimens: [
    {
      id: "state", name: "The hazard map",
      art: { art: "landform", which: "terrain" },
      parts: [
        {
          id: "cascadia", name: "Cascadia, off the north coast", at: [-0.62, -0.5],
          note: "The last full rupture was 26 January 1700, magnitude about 9.0, recorded in Japan "
            + "as a tsunami with no earthquake. Ruptures average roughly 500 years apart.",
        },
        {
          id: "sanandreas", name: "The southern San Andreas", at: [0.5, 0.34],
          note: "Last full rupture 1857, the M7.9 Fort Tejon earthquake. Trench digs at Wrightwood "
            + "give an average of about 105 years between ruptures, so the strain has been building "
            + "for well over 160.",
        },
        {
          id: "hayward", name: "The Hayward fault", at: [-0.5, 0.1],
          note: "Last major rupture 1868, average recurrence near 150 years, and it creeps about "
            + "5 mm a year in between. The HayWired M7.0 scenario projects 800 deaths and 82 billion "
            + "dollars of damage.",
        },
        {
          id: "longvalley", name: "Long Valley Caldera", at: [0.34, -0.44],
          note: "The Bishop Tuff eruption 767 000 years ago emptied about 600 km3 of magma. The "
            + "floor rose some 25 cm through the 1980s and 1990s, so it is monitored continuously.",
        },
        {
          id: "delta", name: "The Sacramento delta", at: [-0.2, -0.16],
          note: "In 1861 and 1862 the Central Valley became a lake roughly 480 km long. Sacramento "
            + "sat under 3 m of water, and today about half a million people live behind those levees.",
        },
        {
          id: "wildfire", name: "The wildland edge", at: [0.24, 0.6],
          note: "Santa Ana and Diablo winds gust past 100 km/h with humidity under 10 per cent. "
            + "The Camp Fire of 8 November 2018 destroyed 18 804 buildings and killed 85 people.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * F1.5 — A hazard's reach and duration
 * ---------------------------------------------------------------- */

const HOW_FAR_HOW_LONG: ArchetypeSpec = {
  id: "g7f1-how-far-how-long",
  title: "How Far, and How Long?",
  tagline: "Shaking dies away with distance. Move the seismometer and watch the numbers fall.",
  kind: "investigate",
  subject: "engineering",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-ESS3-2"], ccssMath: ["6.RP.A.3"] },
  learningGoals: [
    "Predict ground acceleration at a site from the magnitude and the distance to the fault.",
    "Explain why a larger earthquake shakes for longer as well as harder.",
  ],
  misconceptions: [
    "Every place feels the same shaking in one earthquake",
    "Magnitude and the shaking you feel are the same thing",
  ],
  specimens: [
    { id: "seismo", name: "The seismometer: a magnet hanging in a coil",
      art: { art: "apparatus", which: "magnet" } },
  ],
  variables: [
    { key: "magnitude", label: "Moment magnitude", min: 5, max: 7.7, step: 0.1, default: 6.7 },
    { key: "distance", label: "Distance to the fault (km)", min: 1, max: 200, step: 1, default: 20 },
  ],
  /*
   * Peak ground acceleration from Joyner and Boore (1981), the classic
   * California attenuation relation:
   *
   *   log10 A = -1.02 + 0.249 M - log10 r - 0.00255 r,  r = sqrt(d^2 + 7.3^2)
   *
   * with A in g and the fit valid for 5.0 <= M <= 7.7. Intensity comes from
   * Wald and others (1999), MMI = 3.66 log10(PGA in cm/s2) - 1.66, which holds
   * between MMI V and VIII, so it is clipped to the I to XII scale outside it.
   *
   * How long the fault itself moves comes from the circular crack model. The
   * seismic moment is exactly 10^(1.5M + 9.1) N m, and for a stress drop of
   * 3 MPa the rupture radius is a = (7 M0 / 16 dsigma)^(1/3). Rupture runs
   * outward at about 2.7 km/s, so a M7 tears for roughly seven seconds while a
   * M5 is over in half a second. The ground goes on ringing for longer.
   */
  measure: (v) => {
    const pga = (m: number, d: number) => {
      const r = Math.sqrt(d * d + 7.3 * 7.3);
      return Math.pow(10, -1.02 + 0.249 * m - Math.log10(r) - 0.00255 * r);
    };
    const pgaG = pga(v.magnitude, v.distance);
    const mmiRaw = 3.66 * Math.log10(pgaG * 980.665) - 1.66;
    const momentNm = Math.pow(10, 1.5 * v.magnitude + 9.1);
    const radiusM = Math.cbrt((7 * momentNm) / (16 * 3.0e6));
    // The furthest ring that still feels it, taken as 0.001 g, scanned in 5 km
    // steps so the answer is the same every time it is asked for.
    let feltRadiusKm = 0;
    for (let d = 5; d <= 600; d += 5) if (pga(v.magnitude, d) >= 0.001) feltRadiusKm = d;
    return {
      pgaG,
      mmi: Math.max(1, Math.min(12, mmiRaw)),
      energyJ: Math.pow(10, 1.5 * v.magnitude + 4.8),
      ruptureRadiusKm: radiusM / 1000,
      ruptureDurationS: radiusM / 1000 / 2.7,
      feltRadiusKm,
      sWaveArrivalS: v.distance / 3.5,
    };
  },
  plot: {
    x: "distance", y: "pgaG",
    xLabel: "Distance to the fault (km)", yLabel: "Peak ground acceleration (g)",
  },
};

export const g7f1WhatDrivesIt = buildSim(WHAT_DRIVES_IT);
export const g7f1RiverInTheSky = buildSim(RIVER_IN_THE_SKY);
export const g7f1AcrossThePacific = buildSim(ACROSS_THE_PACIFIC);
export const g7f1TheGoldenState = buildSim(THE_GOLDEN_STATE);
export const g7f1HowFarHowLong = buildSim(HOW_FAR_HOW_LONG);
