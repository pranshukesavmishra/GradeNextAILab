import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit B · Topic B3 — Energy transfer in a collision.
 *
 * Five simulations, one per subtopic:
 *
 *   B3.1  g8b3-two-carts-one-click   energy converted, not lost      (process)
 *   B3.2  g8b3-steel-and-clay        elastic against inelastic       (compare)
 *   B3.3  g8b3-through-the-crash     tracing energy through a crash  (trace)
 *   B3.4  g8b3-buy-yourself-a-metre  safety design                   (investigate)
 *   B3.5  g8b3-kept-or-converted     comparing two collisions        (sort)
 *
 * The one idea underneath all five: a collision cannot destroy energy, only
 * move it somewhere less useful. The sticking trolleys lose exactly half their
 * kinetic energy and every joule of it is accounted for; the crumple zone
 * turns the same energy into a survivable force by spending it over a longer
 * distance, because work is force times distance and nothing else.
 */

/* ---------------------------------------------------------------- *
 * B3.1 — Energy converted, not lost
 * ---------------------------------------------------------------- */

const TWO_CARTS_ONE_CLICK: ArchetypeSpec = {
  id: "g8b3-two-carts-one-click",
  title: "Two Carts, One Click",
  tagline: "One trolley rolls in with 2.00 J. Two roll away with 1.00 J. Find the rest.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2", "MS-PS3-5"] },
  learningGoals: [
    "Account for the kinetic energy missing after two objects collide and stick together.",
    "Explain that energy converted in a collision has not been destroyed.",
  ],
  misconceptions: [
    "Energy is destroyed in a collision",
    "Momentum and kinetic energy are the same thing",
  ],
  specimens: [
    { id: "carts", name: "Two 1.0 kg trolleys with hook and loop pads",
      art: { art: "apparatus", which: "cart" } },
  ],
  // A 1.0 kg trolley at 2.0 m/s meets a stationary 1.0 kg trolley and they
  // stick. Momentum must survive: 2.0 kg m/s shared by 2.0 kg is 1.0 m/s.
  // Kinetic energy need not: 2.00 J goes in and half x 2.0 x 1.0 x 1.0 = 1.00 J
  // comes out. Exactly half of it has been converted, every time, for any
  // equal pair that sticks.
  stages: [
    { name: "Rolling in", at: 0,
      caption: "Trolley A at 2.0 m/s: momentum 2.0 kg m/s, kinetic energy half x 1 x 2 x 2 = 2.00 J. Trolley B is still." },
    { name: "Contact", at: 0.25,
      caption: "The pads meet. Thousands of tiny hooks start bending and catching. The push is equal and opposite on both trolleys." },
    { name: "Locked together", at: 0.5,
      caption: "2.0 kg m/s of momentum now carried by 2.0 kg, so both move at 1.00 m/s. Kinetic energy is now half x 2 x 1 x 1 = 1.00 J." },
    { name: "The missing joule", at: 0.75,
      caption: "1.00 J has gone into bending hooks, a click of sound and a slightly warmer pair of pads. Nothing was destroyed." },
    { name: "The books balance", at: 1,
      caption: "1.00 J still moving plus 1.00 J spread into the pads, the air and the bench. Total 2.00 J, exactly what arrived." },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.2 — Elastic and inelastic collisions
 * ---------------------------------------------------------------- */

const STEEL_AND_CLAY: ArchetypeSpec = {
  id: "g8b3-steel-and-clay",
  title: "Steel and Clay",
  tagline: "Two balls, the same drop, the same 0.49 J. One comes back; one stays on the floor.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Distinguish an elastic collision from an inelastic one by what happens to kinetic energy.",
    "Use rebound height to work out how much energy a collision kept.",
  ],
  misconceptions: [
    "An elastic collision is one where something stretches",
    "The clay ball lost its energy, and the steel ball did not use any",
  ],
  specimens: [
    {
      id: "steel", name: "50 g steel bearing on a steel anvil",
      because: "Dropped 1.00 m it arrives with 0.4905 J. It springs back to about 0.90 m, so it kept roughly 90 per cent: the steel deformed and then pushed back out again. Nearly elastic.",
      art: { art: "sphere", color: "#b3bac6", radius: 0.4 },
    },
    {
      id: "clay", name: "50 g ball of modelling clay",
      because: "The same 0.4905 J arrives and about 2 per cent comes back, a centimetre of hop at most. The clay stayed squashed, and the rest of the energy is in its new shape and its warmth. Inelastic.",
      art: { art: "sphere", color: "#a9764f", radius: 0.46 },
    },
  ],
  variables: [
    { key: "dropHeight", label: "Drop height (m)", min: 0.2, max: 3, step: 0.05, default: 1 },
    { key: "restitution", label: "Bounciness, e (rebound speed / impact speed)", min: 0.05, max: 0.98, step: 0.01, default: 0.95 },
  ],
  // A 50 g ball dropped h metres arrives with m g h joules. The coefficient of
  // restitution e is a ratio of speeds, so the energy ratio is e squared and
  // the rebound height is h e squared: 0.95 gives 0.90 m from 1.00 m and keeps
  // 90.3 per cent, while clay at about 0.14 keeps 2 per cent.
  measure: (v) => {
    const arrive = 0.05 * 9.81 * v.dropHeight;
    const kept = arrive * v.restitution * v.restitution;
    return {
      impactEnergyJ: arrive,
      impactSpeedMs: Math.sqrt(2 * 9.81 * v.dropHeight),
      reboundHeightM: v.dropHeight * v.restitution * v.restitution,
      energyKeptJ: kept,
      energyConvertedJ: arrive - kept,
      percentKept: v.restitution * v.restitution * 100,
    };
  },
};

/* ---------------------------------------------------------------- *
 * B3.3 — Tracing energy through a crash
 * ---------------------------------------------------------------- */

const THROUGH_THE_CRASH: ArchetypeSpec = {
  id: "g8b3-through-the-crash",
  title: "Through the Crash",
  tagline: "137 200 J arrive at a wall in a tenth of a second. Follow them to the last joule.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2", "MS-PS3-5"] },
  learningGoals: [
    "Follow the kinetic energy of a vehicle through the parts that absorb it.",
    "Explain how a restraint reduces the force on a person by lengthening the stopping distance.",
  ],
  misconceptions: [
    "A stiff car is a safe car",
    "A seatbelt works by holding you still",
  ],
  // A 1400 kg car at 14 m/s (about 50 km/h) carries half x 1400 x 14 x 14 =
  // 137 200 J. Crushing the front 0.60 m needs an average 137 200 / 0.60 =
  // 229 kN and slows the cabin at 14 x 14 / (2 x 0.60) = 163 m/s2, or 16.6 g.
  // A belted 70 kg driver carries 6 860 J of that total and rides down over
  // about 0.75 m of crush plus belt stretch and airbag: 9.1 kN and 13.3 g.
  // Unbelted, the same person meets the dashboard after 0.06 m: 114 kN, 166 g.
  route: [
    { at: [0.08, 0.66], name: "The car, one metre out",
      note: "1400 kg at 14 m/s. Half x 1400 x 14 x 14 = 137 200 J of kinetic energy, and about 0.1 s in which to get rid of all of it." },
    { at: [0.24, 0.5], name: "Bumper and crash box",
      note: "The first few centimetres. Thin steel tubes fold like a concertina at a designed force, taking the low-speed knocks that would otherwise bend the chassis." },
    { at: [0.4, 0.34], name: "The crumple zone",
      note: "0.60 m of engine bay folding. Work = force x distance, so 137 200 J over 0.60 m is an average 229 000 N, and the cabin slows at 16.6 g. Make the car stiffer and that distance shrinks: the force rises to match." },
    { at: [0.56, 0.5], name: "The seatbelt",
      note: "The driver is 70 kg of the load and carries 6 860 J. The belt starts that person slowing with the car instead of continuing at 14 m/s across the cabin." },
    { at: [0.72, 0.34], name: "The airbag",
      note: "It adds the last 0.15 m of ride-down. Over 0.75 m in total the driver needs 6 860 / 0.75 = 9 100 N, about 13 g. Without a belt the stop happens in 0.06 m against the dash: 114 000 N and 166 g." },
    { at: [0.9, 0.62], name: "Heat, sound and bent metal",
      note: "Every one of the 137 200 J is now in torn steel, warm crumple zones, the bang you heard and the wall. Not one joule was destroyed, and none of it can be gathered back." },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.4 — Safety design and energy conversion
 * ---------------------------------------------------------------- */

const BUY_YOURSELF_A_METRE: ArchetypeSpec = {
  id: "g8b3-buy-yourself-a-metre",
  title: "Buy Yourself a Metre",
  tagline: "You cannot change the joules. You can change how far you spread them.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Use work = force x distance to show why a longer crush distance means a smaller force.",
    "Design a change to a collision that reduces the force without changing the energy.",
  ],
  misconceptions: [
    "Padding removes energy from a crash",
    "A stronger, stiffer structure protects people better",
  ],
  specimens: [
    { id: "sled", name: "70 kg crash-test sled", art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "crush", label: "Crush distance available (m)", min: 0.05, max: 1.2, step: 0.05, default: 0.6 },
    { key: "speed", label: "Impact speed (m/s)", min: 2, max: 20, step: 0.5, default: 14 },
  ],
  // 70 kg at 14 m/s is 6 860 J. Spread over 0.60 m that is 6 860 / 0.60 =
  // 11 433 N and v squared / 2 d = 163 m/s2, which is 16.6 g. Halve the
  // distance and both double; the energy itself never moves. The stop lasts
  // 2 d / v, which at these numbers is 86 ms.
  measure: (v) => {
    const ke = 0.5 * 70 * v.speed * v.speed;
    return {
      kineticEnergyJ: ke,
      averageForceN: ke / v.crush,
      decelerationMs2: (v.speed * v.speed) / (2 * v.crush),
      gForce: (v.speed * v.speed) / (2 * v.crush * 9.81),
      stopTimeMs: ((2 * v.crush) / v.speed) * 1000,
    };
  },
  plot: {
    x: "crush", y: "gForce",
    xLabel: "Crush distance (m)", yLabel: "Deceleration (g)",
  },
};

/* ---------------------------------------------------------------- *
 * B3.5 — Comparing energy conversion across two collisions
 * ---------------------------------------------------------------- */

const KEPT_OR_CONVERTED: ArchetypeSpec = {
  id: "g8b3-kept-or-converted",
  title: "Kept, or Converted?",
  tagline: "Six collisions. In three of them the motion mostly survives. In three it mostly does not.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Compare collisions by how much kinetic energy survives as motion.",
    "Use evidence such as rebound height, sound and permanent shape change to judge a collision.",
  ],
  misconceptions: [
    "Any collision with a bounce is perfectly elastic",
    "A quiet collision converts as much energy as a loud one",
  ],
  categories: [
    { id: "kept", name: "Motion mostly survives", hint: "it bounces back nearly as fast as it arrived" },
    { id: "converted", name: "Motion mostly converted", hint: "shape changed, heat, a loud noise, no bounce" },
  ],
  specimens: [
    { id: "superball", name: "Rubber superball on concrete", category: "kept",
      because: "Dropped 1.00 m it comes back to roughly 0.80 m, so about 80 per cent of the energy is still motion. The rubber squashes and un-squashes rather than staying squashed.",
      art: { art: "sphere", color: "#e0563f", radius: 0.4 } },
    { id: "bearings", name: "Two steel bearings clicking together", category: "kept",
      because: "Hardened steel returns close to 95 per cent of the impact speed, so about 90 per cent of the kinetic energy survives. What you hear is the missing few per cent.",
      art: { art: "sphere", color: "#b3bac6", radius: 0.38 } },
    { id: "molecules", name: "Two nitrogen molecules meeting in air", category: "kept",
      because: "Perfectly elastic, as far as anyone can measure. There is nowhere for the energy to hide: molecules have no dents and no warmth of their own to gain.",
      art: { art: "molecule", formula: "N2" } },
    { id: "putty", name: "Ball of putty hitting the floor", category: "converted",
      because: "No rebound at all. Every joule went into the permanent change of shape and the warmth that came with it; the putty is measurably, if slightly, warmer.",
      art: { art: "sphere", color: "#a9764f", radius: 0.46 } },
    { id: "wagons", name: "Two equal railway wagons coupling", category: "converted",
      because: "Momentum forces them to share the speed, so they leave at half of what arrived and exactly half the kinetic energy is converted, into the couplers, the buffers and one loud clang.",
      art: { art: "apparatus", which: "cart" } },
    { id: "tube", name: "Test tube dropped on a tiled floor", category: "converted",
      because: "The glass cannot spring back, so the energy goes into breaking bonds along new surfaces, into flying fragments and into the crack you heard. None of it comes back up.",
      art: { art: "glassware", which: "testTube", level: 0.35, color: "#8fc7dd" } },
  ],
};

export const g8b3TwoCartsOneClick = buildSim(TWO_CARTS_ONE_CLICK);
export const g8b3SteelAndClay = buildSim(STEEL_AND_CLAY);
export const g8b3ThroughTheCrash = buildSim(THROUGH_THE_CRASH);
export const g8b3BuyYourselfAMetre = buildSim(BUY_YOURSELF_A_METRE);
export const g8b3KeptOrConverted = buildSim(KEPT_OR_CONVERTED);
