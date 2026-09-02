import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit B · Topic B4 — Energy conservation across a system.
 *
 * Five simulations, one per subtopic:
 *
 *   B4.1  g8b4-close-the-box        energy is conserved              (assemble)
 *   B4.2  g8b4-water-to-wall-socket tracking through many steps      (trace)
 *   B4.3  g8b4-spread-not-gone      dissipation as spreading out     (explore)
 *   B4.4  g8b4-bounce-after-bounce  conservation and a bouncing ball (investigate)
 *   B4.5  g8b4-does-it-add-up       conservation as a check          (sort)
 *
 * Conservation only ever balances if the boundary is drawn wide enough, so the
 * topic opens by drawing one. A 2.5 kg trolley launched at 2.0 m/s carries
 * exactly 5.00 J, and rolling resistance of 1.23 N takes it back over the
 * 4.08 m it travels. The hydro plant then does the same accounting at
 * 49 megawatts, and the bouncing ball does it with a coefficient of
 * restitution. g is 9.81 N/kg throughout.
 *
 * Conservation is a counting argument, and counting arguments are dull until
 * something visibly runs out. So the bike coasts to a stop where the joules
 * ran out, the tennis ball runs its whole bouncing sequence with each hop e
 * squared as high as the last — at e = 0.2 it is on the floor within a second
 * and stays there — and in B4.5 the six advertised claims are drawn exactly as
 * advertised, so the ball really does climb higher each bounce. Deciding
 * whether what you are watching can be true is the point of the exercise.
 */

/** A 0-1 sawtooth that runs once every `period` seconds. */
function cycle(t: number, period: number): number {
  const p = (t / period) % 1;
  return p < 0 ? p + 1 : p;
}

/* ---------------------------------------------------------------- *
 * B4.1 — Energy is conserved
 * ---------------------------------------------------------------- */

const CLOSE_THE_BOX: ArchetypeSpec = {
  id: "g8b4-close-the-box",
  title: "Close the Box",
  tagline: "A trolley launched with 5.00 J rolls 4.08 m and stops. Find all six places the joules went.",
  kind: "assemble",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Account for every joule in a system that starts moving and comes to rest.",
    "Explain why the total only balances once the boundary includes everything the energy reaches.",
  ],
  misconceptions: [
    "The trolley used up its energy",
    "Friction destroys energy",
  ],
  specimens: [
    {
      id: "audit", name: "2.5 kg trolley, launched at 2.00 m/s across a carpet",
      art: { art: "apparatus", which: "cart" },
      // Half x 2.5 x 2 x 2 = 5.00 J. Rolling resistance for hard wheels on
      // short carpet is about 0.05 of the weight: 0.05 x 2.5 x 9.81 = 1.23 N,
      // and 5.00 J divided by 1.23 N is 4.08 m of travel. Air drag on a
      // 0.01 m2 face at 2 m/s is half x 1.225 x 0.01 x 1 x 4 = 0.025 N, which
      // over 4.08 m is only 0.10 J. The wheels and carpet take nearly all of
      // the rest.
      parts: [
        { id: "launch", name: "The spring launcher", at: [-0.42, -0.3],
          note: "Where the 5.00 J came from. A spring holding half k x squared hands it to the trolley as half x 2.5 x 2.00 x 2.00 = 5.00 J of motion. Leave the launcher outside the box and the books start 5 J short." },
        { id: "wheels", name: "The wheels and the carpet", at: [-0.4, 0.28],
          note: "Rolling resistance of about 0.05 x 2.5 x 9.81 = 1.23 N, acting all 4.08 m. That is 5.0 J of work, so this one path takes almost the whole store, into flexing carpet fibres and rubber that end up a shade warmer." },
        { id: "bearings", name: "The axle bearings", at: [0.04, -0.38],
          note: "Dry axles rub, and the rubbing warms them. A fraction of a joule here, but a real one: run the trolley on gritty axles and the stopping distance drops by half a metre." },
        { id: "air", name: "The air it pushed aside", at: [0.42, -0.26],
          note: "Half x 1.225 x 0.01 x 1.0 x 2.00 x 2.00 = 0.025 N of drag, over 4.08 m, is 0.10 J. Two per cent of the store, and this is why slow experiments can ignore air and fast ones cannot." },
        { id: "sound", name: "The sound of the wheels", at: [0.4, 0.3],
          note: "You can hear it, so energy is leaving as pressure waves. It is well under a millijoule, and it too ends as warmth once the walls have absorbed it." },
        { id: "room", name: "The room, a few minutes later", at: [0.02, 0.4],
          note: "All 5.00 J is now warmth spread through carpet, wheels, axles and air. Weigh the room's energy before and after and nothing has changed: conserved, but no longer gathered in one place you could use." },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.2 — Tracking energy through a multi-step system
 * ---------------------------------------------------------------- */

const WATER_TO_WALL_SOCKET: ArchetypeSpec = {
  id: "g8b4-water-to-wall-socket",
  title: "From the Reservoir to the Wall Socket",
  tagline: "49 megawatts of falling water. Take a percentage off at every step and see what arrives.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Track energy through a multi-step system and apply an efficiency at each step.",
    "Explain that the energy taken off at each step is still in the system, as heat.",
  ],
  misconceptions: [
    "Energy is lost at each stage of a power station",
    "A power station creates electricity",
  ],
  // 100 m3/s of water is 100 000 kg/s. Falling 50 m that is 100 000 x 9.81 x
  // 50 = 49.05 MW of gravitational store released every second. Penstock
  // friction leaves 95 per cent (46.60 MW), a Francis turbine converts about
  // 92 per cent (42.87 MW), the generator about 98 per cent (42.01 MW), and
  // the transformer and line about 94 per cent (39.49 MW). Overall 80.5 per
  // cent, which is why hydro is the most efficient generation there is.
  route: [
    { at: [0.08, 0.22], name: "The reservoir",
      note: "Water 50 m above the turbine hall. Every cubic metre is 1 000 kg, holding 1 000 x 9.81 x 50 = 490 500 J with respect to the turbine. At 100 m3/s that is 49.05 MW arriving every second." },
    { at: [0.24, 0.4], name: "The penstock",
      note: "The pipe down the mountain. Water rubbing against steel warms the pipe by a fraction of a degree and takes about 5 per cent: 46.60 MW reaches the bottom, moving at roughly 30 m/s." },
    { at: [0.42, 0.56], name: "The turbine",
      note: "A Francis runner turns pressure and speed into rotation at about 92 per cent, so 42.87 MW of shaft power. The 3.7 MW that does not make it stirs and warms the water leaving the draft tube." },
    { at: [0.6, 0.4], name: "The generator",
      note: "Coils turning in a magnetic field, about 98 per cent efficient: 42.01 MW of electricity. The missing 0.9 MW is why generator halls need serious cooling." },
    { at: [0.78, 0.26], name: "Transformer and transmission line",
      note: "Stepped up to 400 kV to keep the current small, since heating in a line goes as current squared. About 94 per cent survives the journey: 39.49 MW." },
    { at: [0.92, 0.6], name: "The town",
      note: "39.49 MW arrives, 80.5 per cent of what the water started with, enough for roughly 33 000 homes drawing 1.2 kW each. The other 9.56 MW is not missing: it is warm pipes, warm water, warm copper and warm air." },
  ],
};

/* ---------------------------------------------------------------- *
 * B4.3 — Dissipation as spreading out, not disappearing
 * ---------------------------------------------------------------- */

const SPREAD_NOT_GONE: ArchetypeSpec = {
  id: "g8b4-spread-not-gone",
  title: "Spread Out, Not Gone",
  tagline: "Brake once from 8 m/s and 2 880 J leaves the bike. Follow it until it is too thin to use.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-5", "MS-PS3-4"] },
  learningGoals: [
    "Explain dissipation as energy spreading into more matter at a lower temperature.",
    "Show that dissipated energy is still conserved but no longer usable.",
  ],
  misconceptions: [
    "Friction destroys energy",
    "Heat that spreads out has been lost from the universe",
  ],
  specimens: [
    {
      id: "brake", name: "90 kg of bike and rider, braking from 8 m/s",
      art: { art: "apparatus", which: "cart" },
      // Half x 90 x 8 x 8 = 2 880 J. Aluminium has a specific heat capacity of
      // about 900 J per kg per K, so 2 880 J into a 0.30 kg rim raises it
      // 2880 / (0.3 x 900) = 10.7 C. Handed on to 1 kg of air at 1 005 J per
      // kg per K it is only 2.9 C, and into the whole room it is unmeasurable.
      parts: [
        { id: "start", name: "2 880 J of motion", at: [-0.42, -0.32],
          note: "Half x 90 x 8 x 8 = 2 880 J, all of it in one moving object. This is energy at its most useful: concentrated, and pointing one way." },
        { id: "pads", name: "The pads and the rim", at: [-0.4, 0.26],
          note: "Almost the whole 2 880 J arrives here in about two seconds. A 0.30 kg aluminium rim has a heat capacity of 900 J per kg per K, so it climbs 2 880 / (0.3 x 900) = 10.7 C. Hot enough to feel, and a long brake down a hill can boil a tyre's air." },
        { id: "air", name: "The air going past", at: [0.06, -0.4],
          note: "Within a minute the rim has handed its 2 880 J to the air. Spread through 1 kg of air at 1 005 J per kg per K that is 2.9 C; spread through the street it is thousandths of a degree." },
        { id: "tyres", name: "Tyres and road", at: [0.42, -0.24],
          note: "Rubber flexing against tarmac warms both. Same joules, more matter sharing them, and each kilogram of matter warms less than the last." },
        { id: "sound", name: "The squeal", at: [0.42, 0.3],
          note: "A brake squeal is a pressure wave carrying energy away in every direction. Walls and clothes absorb it, and it too ends up as a slightly warmer room." },
        { id: "count", name: "Count them again", at: [0.02, 0.42],
          note: "Still 2 880 J. Not one has been destroyed. But you cannot brake a bike back up to 8 m/s from a room that is 0.001 C warmer: dissipated energy is conserved and useless at the same time." },
      ],
    },
  ],
  /*
   * The brake is applied and the bike stops, over and over, because the joules
   * only start their journey into the rim once something is taking them. Eight
   * metres per second brought to rest in two seconds is 4 m/s2 and 8 m of road,
   * and the travel is drawn small so the labels stay beside the parts they
   * name. What matters is that the motion visibly ends: after that the 2 880 J
   * are all in the six places the labels point at.
   */
  drive: ({ t }) => {
    const tau = Math.min(cycle(t, 4) * 4, 2);
    const s = 8 * tau - 2 * tau * tau;                  // 8 m/s, -4 m/s2
    return { offset: [-0.2 + 0.4 * (s / 8), 0], spin: 0.68 };
  },
};

/* ---------------------------------------------------------------- *
 * B4.4 — Applying conservation to a bouncing ball
 * ---------------------------------------------------------------- */

const BOUNCE_AFTER_BOUNCE: ArchetypeSpec = {
  id: "g8b4-bounce-after-bounce",
  title: "Bounce After Bounce",
  tagline: "Set the bounciness and read the next height, the joules kept, and the joules turned to heat.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Predict rebound height from a coefficient of restitution and check it against m g h.",
    "Account for the energy a ball does not get back after each bounce.",
  ],
  misconceptions: [
    "A ball loses energy because gravity gets stronger each bounce",
    "A ball that stops bouncing has run out of energy",
  ],
  specimens: [
    { id: "ball", name: "60 g tennis ball", art: { art: "sphere", color: "#cbe04a", radius: 0.44 } },
  ],
  variables: [
    { key: "restitution", label: "Bounciness, e (rebound speed / impact speed)", min: 0.2, max: 0.95, step: 0.01, default: 0.75 },
    { key: "dropHeight", label: "Drop height (m)", min: 0.2, max: 3, step: 0.05, default: 1.5 },
  ],
  // A 60 g ball dropped 1.50 m arrives with 0.06 x 9.81 x 1.50 = 0.883 J at
  // root(2 g h) = 5.43 m/s. e is a ratio of speeds, so energies go as e
  // squared and heights follow: 1.50 x 0.75 x 0.75 = 0.844 m, keeping 56.25
  // per cent and turning 0.386 J into warm rubber, warm floor and the sound of
  // the bounce. Heights shrink geometrically, so the count of bounces before
  // it is under 0.10 m is ln(0.10 / h) / (2 ln e).
  measure: (v) => {
    const e2 = v.restitution * v.restitution;
    const before = 0.06 * 9.81 * v.dropHeight;
    return {
      impactSpeedMs: Math.sqrt(2 * 9.81 * v.dropHeight),
      energyBeforeJ: before,
      reboundHeightM: v.dropHeight * e2,
      energyKeptJ: before * e2,
      energyToHeatJ: before * (1 - e2),
      percentKept: e2 * 100,
      bouncesBelowTenCm: Math.max(0, Math.log(0.1 / v.dropHeight) / (2 * Math.log(v.restitution))),
    };
  },
  plot: {
    x: "restitution", y: "reboundHeightM",
    xLabel: "Bounciness, e", yLabel: "Rebound height (m)",
  },
  /*
   * The whole sequence, not one bounce. Each hop reaches e squared of the last
   * one's height and lasts e times as long, which is what root(2 h / g) does
   * when h is multiplied by e squared, so the bounces crowd together exactly
   * the way a real ball's do. At e = 0.95 the ball is still going at the end
   * of a nine-second window; at e = 0.2 it is finished inside a second and
   * then lies on the floor for the other eight, which is the whole answer to
   * "where did its energy go" put in front of the student rather than told to
   * them. It never comes back on its own, because nothing is going to hand
   * warm rubber and a warm floor back as motion.
   */
  drive: ({ v, t }) => {
    const e = v.restitution;
    let k = cycle(t, 9) * 9;
    let amp = 0.9 * Math.min(1, v.dropHeight / 3);
    let dur = 0.9;                                      // the first drop
    let height = 0;
    for (let i = 0; i < 12 && k >= 0; i++) {
      if (k < dur) {
        const u = k / dur;
        height = i === 0 ? amp * (1 - u * u) : amp * 4 * u * (1 - u);
        break;
      }
      k -= dur;
      amp *= e * e;
      dur *= e;
    }
    return { offset: [0, 0.45 - height] };
  },
};

/* ---------------------------------------------------------------- *
 * B4.5 — Conservation as a check on a claim
 * ---------------------------------------------------------------- */

const DOES_IT_ADD_UP: ArchetypeSpec = {
  id: "g8b4-does-it-add-up",
  title: "Does It Add Up?",
  tagline: "Six claims from adverts and inventors. Audit each one against the energy books.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Use conservation of energy to test whether a claim about a device can be true.",
    "Separate a device that moves energy from one that would have to create it.",
  ],
  misconceptions: [
    "A machine can be more than 100 per cent efficient",
    "Any device that outputs more heat than the electricity it draws must be a fraud",
  ],
  categories: [
    { id: "passes", name: "Passes the audit", hint: "every joule out can be traced to a joule in" },
    { id: "breaks", name: "Breaks conservation", hint: "joules appear from nowhere" },
  ],
  specimens: [
    { id: "motor", name: "A magnet motor that never needs power", category: "breaks",
      because: "A magnet exerts a force, and force is not energy. Carry a magnet once around any closed loop and the work done comes to zero, so there is nothing to run on. Every version ever tested has stopped.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "led", name: "An LED lamp: 400 lumens from 4 W", category: "passes",
      because: "That is 100 lumens per watt, ordinary for a good LED. About 1.2 W leaves as light and the other 2.8 W as warmth in the heatsink. In, 4 W. Out, 4 W.",
      art: { art: "apparatus", which: "bulb" } },
    { id: "heatpump", name: "A heat pump: 1 kW in, 3 kW of heat out", category: "passes",
      because: "It does not make 3 kW. It pumps 2 kW of heat in from cold outdoor air and adds the 1 kW of electricity it used. Energy is moved, not created, so the books balance exactly.",
      art: { art: "apparatus", which: "burner" } },
    { id: "ball", name: "A ball that bounces to 1.2 m after a 1.0 m drop", category: "breaks",
      because: "Rebound needs m g h joules and only m g x 1.0 arrived. Unless something else pushed it, a moving floor or a spring underneath, the extra 20 per cent has no source.",
      art: { art: "sphere", color: "#e0563f", radius: 0.4 } },
    { id: "clock", name: "A quartz clock running two years on one AA cell", category: "passes",
      because: "An AA cell holds roughly 14 000 J. A quartz movement averages about 0.2 mW, and 14 000 J divided by 0.0002 W is 7 x 10 to the 7 seconds, a little over two years. Small draw, long life, no mystery.",
      art: { art: "apparatus", which: "battery" } },
    { id: "toy", name: "A wind-up toy that travels further on every run", category: "breaks",
      because: "One wind puts a fixed half k x squared into the spring. Friction only ever takes from that, so each run can match the last at best. Going further needs joules that were never wound in.",
      art: { art: "apparatus", which: "spring" } },
  ],
  /*
   * Each claim is drawn as its advertisement makes it, which is the only fair
   * way to audit one: the ball really does come back higher than it was
   * dropped from, and the wind-up toy really does go further on every run.
   * Neither of those can happen, and seeing it happen is what makes a student
   * ask where the extra joules came from. The three honest devices behave
   * honestly — the lamp lights, the heat pump runs, the clock ticks — and the
   * magnet motor does what every magnet motor ever built has done, which is
   * turn a little way and stop.
   */
  drive: ({ t, specimen }) => {
    const k = cycle(t, 4);
    switch (specimen.id) {
      // Claimed: runs for ever on nothing. Observed: turns, then stalls.
      case "motor":
        return { spin: 0.68 + 2.4 * (1 - Math.exp(-6 * k)) };
      // Claimed and true: energy in equals energy out, every second.
      case "led": return { offset: [0, 0], spin: 0.68 };
      case "heatpump": return { offset: [0, 0], spin: 0.68 };
      case "clock": {
        // One tick a second, which is all a 0.2 mW movement has to do.
        const tick = cycle(t, 1);
        return { offset: [0, 0.02 * Math.exp(-9 * tick)], spin: 0.68 };
      }
      // Claimed: 1.0 m down, 1.2 m up. Drawn as claimed, so the extra 20 per
      // cent of height is there on the screen with no source behind it.
      case "ball": {
        const drop = 0.5;
        const height = k < 0.4
          ? drop * (1 - (k / 0.4) * (k / 0.4))
          : drop * 1.2 * 4 * ((k - 0.4) / 0.6) * (1 - (k - 0.4) / 0.6);
        return { offset: [0, 0.42 - height] };
      }
      // Claimed: further on every run, from one winding.
      default: {
        const run = Math.floor(cycle(t, 9) * 3);        // runs one, two, three
        const u = cycle(t, 3);
        return { offset: [-0.3 + 0.2 * (run + 1) * u, 0], spin: 0.12, tilt: 0.2 };
      }
    }
  },
};

export const g8b4CloseTheBox = buildSim(CLOSE_THE_BOX);
export const g8b4WaterToWallSocket = buildSim(WATER_TO_WALL_SOCKET);
export const g8b4SpreadNotGone = buildSim(SPREAD_NOT_GONE);
export const g8b4BounceAfterBounce = buildSim(BOUNCE_AFTER_BOUNCE);
export const g8b4DoesItAddUp = buildSim(DOES_IT_ADD_UP);
