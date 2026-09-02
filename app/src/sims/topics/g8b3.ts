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
 *
 * Collisions are the one thing in physics nobody has trouble picturing, so the
 * pictures do the work. The trolley crosses the second half of its run at
 * visibly half the speed of the first half, which is what sharing 2.0 kg m/s
 * between 2.0 kg looks like. The steel bearing comes back up to nine tenths of
 * its drop and the clay does not come back at all. The sled crushes through
 * the distance it is given and lies flat when that distance is too short.
 */

/** A 0-1 sawtooth that runs once every `period` seconds. */
function cycle(t: number, period: number): number {
  const p = (t / period) % 1;
  return p < 0 ? p + 1 : p;
}

/**
 * One bounce of a ball, as a height above the floor in specimen widths.
 *
 * The drop is a parabola and so is the rebound, and the rebound reaches e
 * squared of the drop because e is a ratio of speeds while height goes as
 * speed squared. A ball with e = 0.95 comes back to 90 per cent of where it
 * started; one with e = 0.14, which is what modelling clay measures, comes
 * back two per cent and is, to the eye, simply lying there.
 */
function hop(k: number, amplitude: number, e: number): number {
  if (k < 0.4) {
    const u = k / 0.4;
    return amplitude * (1 - u * u);                     // falling
  }
  const u = (k - 0.4) / 0.6;
  return amplitude * e * e * 4 * u * (1 - u);           // the rebound
}

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
  /*
   * The run is the proof. Trolley A covers the first 2.0 m at 2.0 m/s, taking
   * one second; from the click onwards the pair covers ground at 1.00 m/s,
   * because 2.0 kg m/s of momentum shared between 2.0 kg can be nothing else.
   * The second half of the journey is visibly half as quick as the first, and
   * that halving of the speed is a quartering of the energy per kilogram —
   * which, with twice the mass now moving, comes out as exactly half the
   * kinetic energy. Watching it is worth more than being told it.
   */
  drive: ({ t }) => {
    const k = cycle(t, 6) * 6;
    // 2.0 m at 2.0 m/s, then the joined pair at 1.00 m/s, on 4.5 m of bench.
    const s = k < 1 ? 2 * k : Math.min(4.5, 2 + (k - 1));
    return { offset: [-0.5 + s / 4.5, 0], spin: 0.68 };
  },
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
  /*
   * Both balls are dropped from the height set and drawn on the same scale, so
   * the drop itself answers the slider: 0.2 m is a short fumble and 3.0 m fills
   * the panel. What happens next is the whole lesson. The steel bearing gets
   * the bounciness the control is set to and comes back to h e squared. The
   * clay is fixed at the e = 0.14 it actually measures, so it comes back two
   * per cent, which is a ball lying on the floor; and it stays a few per cent
   * smaller once it has landed, because the energy that did not come back went
   * into a shape that is not going to un-squash itself.
   */
  drive: ({ v, t, index }) => {
    const e = index === 0 ? v.restitution : 0.14;
    const k = cycle(t, 2.8);
    const amplitude = 0.9 * Math.min(1, v.dropHeight / 3);
    const height = hop(k, amplitude, e);
    // Squashed at the floor, and for the clay it stays squashed.
    const landed = k > 0.4;
    const squash = index === 1 && landed ? 0.9 : 1 - 0.08 * Math.max(0, 1 - height * 8);
    return { offset: [0, 0.45 - height], scale: squash };
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
  /*
   * The sled runs the last 3 m in at the speed set and then crushes through
   * exactly the distance the control allows, taking the real 2 d / v seconds
   * to do it. At 0.60 m and 14 m/s that is 86 ms and 16.6 g, which a belted
   * adult survives; drag the crush down to 0.05 m and the same 6 860 J is
   * spent in 7 ms at 200 g, and the sled folds flat. Nothing has been added to
   * or taken from the energy at any point on that slider. Only the distance
   * over which it is spent has changed, and that is the entire trick.
   */
  drive: ({ v, f, t }) => {
    const approach = 3 / v.speed;
    const stop = (2 * v.crush) / v.speed;
    const k = cycle(t, 3) * 3;
    let at: number;
    if (k < approach) at = (k / approach) * 0.6;
    else {
      const u = Math.min(stop, k - approach);
      const s = v.speed * u - (v.speed / (2 * stop)) * u * u;
      at = 0.6 + Math.min(0.38, s / 3.2);
    }
    // 30 g is about as much as a belted adult takes without lasting injury.
    return {
      offset: [-0.55 + 1.15 * at, 0],
      tilt: 0.24 + 0.9 * Math.min(1, Math.max(0, f.gForce / 30 - 1)),
      spin: 0.68,
    };
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
  /*
   * The evidence for this sort is what the thing does after it lands, so that
   * is what is drawn. The superball comes back to four fifths of its drop and
   * the bearings to nine tenths; nitrogen molecules never slow down at all,
   * because there is nowhere for the energy to go. The putty lands, stays and
   * is permanently flatter for it; the wagons couple and leave at half the
   * speed that arrived; and the test tube reaches the floor, stops dead, tips
   * over and empties, which is roughly as converted as a collision gets.
   */
  drive: ({ t, specimen }) => {
    const k = cycle(t, 2.6);
    switch (specimen.id) {
      // Motion mostly survives: it comes back up nearly as far as it fell.
      case "superball": return { offset: [0, 0.42 - hop(k, 0.72, 0.89)] };
      case "bearings": return { offset: [0, 0.42 - hop(k, 0.72, 0.95)] };
      case "molecules":
        return { offset: [0.24 * Math.sin(t * 2.3), 0.2 * Math.sin(t * 3.1 + 1.1)] };
      // Motion mostly converted: it arrives and it does not leave again.
      case "putty":
        return { offset: [0, 0.42 - hop(k, 0.72, 0.03)], scale: k > 0.4 ? 0.88 : 1 };
      case "wagons": {
        const s = k < 0.35 ? (k / 0.35) * 0.4 : 0.4 + (k - 0.35) * 0.3;
        return { offset: [-0.3 + Math.min(0.6, s), 0], spin: 0.68 };
      }
      default: {
        const down = hop(k, 0.72, 0);
        return {
          offset: [0, 0.42 - down],
          tilt: k > 0.4 ? 1.2 : 0.24,
          level: k > 0.4 ? 0 : 0.35,
        };
      }
    }
  },
};

export const g8b3TwoCartsOneClick = buildSim(TWO_CARTS_ONE_CLICK);
export const g8b3SteelAndClay = buildSim(STEEL_AND_CLAY);
export const g8b3ThroughTheCrash = buildSim(THROUGH_THE_CRASH);
export const g8b3BuyYourselfAMetre = buildSim(BUY_YOURSELF_A_METRE);
export const g8b3KeptOrConverted = buildSim(KEPT_OR_CONVERTED);
