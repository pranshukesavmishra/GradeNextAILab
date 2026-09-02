import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit C · Topic C1 — Energy and its forms.
 *
 * Six simulations, one per subtopic:
 *
 *   C1.1  g6c1-moving-or-stored   forms of energy               (sort)
 *   C1.2  g6c1-twice-the-speed    kinetic energy                (investigate)
 *   C1.3  g6c1-lifted-and-ready   potential energy              (investigate)
 *   C1.4  g6c1-arm-to-light       transfer and transformation   (trace)
 *   C1.5  g6c1-nothing-is-lost    conservation of energy        (process)
 *   C1.6  g6c1-where-it-ends-up   energy in everyday examples   (compare)
 *
 * The two investigations carry the arithmetic the rest of the unit leans on:
 * half m v squared and m g h, computed exactly, so a student can check any
 * reading against their own working.
 */

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed the run's elapsed time but not its progress, and at the
 * default Speed of 0.6 the engine advances progress by 0.096 every second. So
 * this is exactly the rail's position, and the apparatus moves through the
 * process in step with the captions underneath it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/* C1.1 — Forms of energy. */
const MOVING_OR_STORED: ArchetypeSpec = {
  id: "g6c1-moving-or-stored",
  title: "On the Move, or in Store?",
  tagline: "Six everyday things. Decide whether the energy is moving or waiting.",
  kind: "sort",
  subject: "physics",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Name the main forms of energy and give an example of each.",
    "Explain that thermal energy is the movement of particles.",
  ],
  misconceptions: ["Stored energy is a different substance from moving energy"],
  categories: [
    { id: "moving", name: "Energy on the move", hint: "something is actually moving now" },
    { id: "stored", name: "Energy in store", hint: "waiting, ready to be released" },
  ],
  specimens: [
    { id: "cart", name: "Cart rolling down a bench", category: "moving",
      because: "Kinetic energy. A 2 kg cart at 3 m/s carries 9 J, and you can feel every joule if you stop it with your hand.",
      art: { art: "apparatus", which: "cart" } },
    { id: "spring", name: "Stretched spring", category: "stored",
      because: "Elastic energy. Pulling a 200 N/m spring 10 cm stores 1 J, and it does nothing at all until you let go.",
      art: { art: "apparatus", which: "spring" } },
    { id: "battery", name: "Fresh AA cell", category: "stored",
      because: "Chemical energy: about 13 000 J held in the bonds inside, and it will sit in a drawer holding it for years.",
      art: { art: "apparatus", which: "battery" } },
    { id: "tea", name: "Mug of hot tea", category: "moving",
      because: "Thermal energy is movement you cannot see. 250 g of tea at 80 degrees holds about 63 000 J more than the same tea at 20, all of it in jiggling particles.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "ball", name: "Ball held above the floor", category: "stored",
      because: "Gravitational energy. A 0.5 kg ball held 2 m up stores 9.8 J, released the moment you open your fingers.",
      art: { art: "sphere", color: "#b8c0cc", radius: 0.32 } },
    { id: "sun", name: "Sunlight on your face", category: "moving",
      because: "Radiant energy crossing space at 300 000 km/s, arriving at about 1 000 W on every square metre at midday.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 } },
  ],
  /*
   * The specimen has to give the answer away before the student reads a word
   * of it: energy on the move moves, energy in store sits perfectly still.
   * A `rate` of 0 stops the specimen turning, which is the whole distinction
   * this sort is about.
   */
  drive: ({ specimen, t }) => {
    switch (specimen.id) {
      case "cart":
        return { offset: [Math.sin(t * 1.5) * 0.75, 0], rate: 1.7 };
      case "spring":
        return { scale: 1.24, rate: 0 };
      case "battery":
        return { rate: 0 };
      case "tea":
        return { level: 0.6, color: "#b5763c", bubbles: 0.5, rate: 1.2 };
      case "ball":
        return { offset: [0, -0.55], rate: 0 };
      default:
        return { scale: 1 + 0.06 * Math.sin(t * 2.4), glow: 1, rate: 2 };
    }
  },
};

/* C1.2 — Kinetic energy. */
const TWICE_THE_SPEED: ArchetypeSpec = {
  id: "g6c1-twice-the-speed",
  title: "Twice the Speed, Four Times the Energy",
  tagline: "Ride faster and the energy climbs far quicker than the speedometer.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-1"] },
  learningGoals: [
    "Calculate kinetic energy from mass and speed.",
    "Explain why doubling speed quadruples the energy that must be removed to stop.",
  ],
  misconceptions: ["Going twice as fast means twice the energy"],
  specimens: [{ id: "rider", name: "Rider and bicycle", art: { art: "apparatus", which: "cart" } }],
  variables: [
    { key: "mass", label: "Mass of rider and bicycle (kg)", min: 20, max: 120, step: 1, default: 80 },
    { key: "speed", label: "Speed (m/s)", min: 0, max: 20, step: 0.5, default: 8 },
  ],
  // Half m v squared, and the braking distance that follows from it at a
  // steady 6 m/s2, which is what good bicycle brakes give on dry tarmac.
  measure: (v) => ({
    kineticEnergyJ: 0.5 * v.mass * v.speed * v.speed,
    speedKmh: v.speed * 3.6,
    brakingDistanceM: (v.speed * v.speed) / 12,
  }),
  plot: { x: "speed", y: "kineticEnergyJ", xLabel: "Speed (m/s)", yLabel: "Kinetic energy (J)" },
  /*
   * The cart is the speedometer. It runs the bench at the speed set, so 20 m/s
   * crosses four times as often as 5 m/s and 0 m/s does not move at all.
   * Mass is a volume, so the drawn width is its cube root: 120 kg is only 1.8
   * times as wide as 20 kg, not six times. The lean is the stop that is
   * coming — 33 m of braking at 20 m/s against 2 m at 5.
   */
  drive: ({ v, f, t }) => ({
    offset: [Math.sin(t * v.speed * 0.09) * 0.85, 0],
    scale: Math.cbrt(v.mass / 80),
    tilt: 0.24 + Math.min(0.5, f.brakingDistanceM / 70),
    rate: 0.3 + v.speed / 8,
  }),
};

/* C1.3 — Potential energy. */
const LIFTED_AND_READY: ArchetypeSpec = {
  id: "g6c1-lifted-and-ready",
  title: "Lifted, and Ready to Fall",
  tagline: "Every metre you lift something, you put energy into it. Let go and you get it back.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-2"] },
  learningGoals: [
    "Calculate gravitational potential energy from mass, height and g.",
    "Predict the landing speed of a dropped object from its stored energy.",
  ],
  misconceptions: ["A heavier object always falls faster"],
  specimens: [{ id: "mass", name: "The lifted mass", art: { art: "sphere", color: "#b8c0cc", radius: 0.4 } }],
  variables: [
    { key: "mass", label: "Mass (kg)", min: 0.1, max: 20, step: 0.1, default: 2 },
    { key: "height", label: "Height above the floor (m)", min: 0, max: 20, step: 0.1, default: 5 },
  ],
  // E = m g h with g = 9.81 N/kg. All of it becomes kinetic energy on the way
  // down, so the landing speed is root(2 g h) and does not depend on the mass.
  measure: (v) => ({
    storedEnergyJ: v.mass * 9.81 * v.height,
    landingSpeedMs: Math.sqrt(2 * 9.81 * v.height),
    fallTimeS: Math.sqrt((2 * v.height) / 9.81),
  }),
  plot: { x: "height", y: "storedEnergyJ", xLabel: "Height (m)", yLabel: "Stored energy (J)" },
  /*
   * Lifting it is the experiment, so the mass is drawn where you have lifted
   * it to. Steel of twice the mass is only 1.26 times as wide, so the size
   * follows the cube root; the top of the range is clipped at 1.9 so a 20 kg
   * block still fits on the bench. On the floor it stores nothing at all, and
   * goes the dull grey of a thing that is not about to do anything.
   */
  drive: ({ v, f }) => ({
    offset: [0, -(v.height / 20) * 1.15],
    scale: Math.min(1.9, Math.cbrt(v.mass / 2)),
    color: v.height < 0.05 ? "#8d94a3" : undefined,
    glow: Math.min(1, f.storedEnergyJ / 2000),
    rate: v.height < 0.05 ? 0 : 1,
  }),
};

/*
 * C1.4 — Energy transfer and transformation.
 *
 * The useful power left at each place on the route, and the colour of the form
 * the energy is in there: chemical, mechanical, electrical, electrical, light,
 * heat.
 */
const CHAIN_WATTS = [300, 75, 52, 50, 2.5, 2.5];
const CHAIN_COLORS = ["#7fbf52", "#e8b23c", "#4a63f0", "#4a63f0", "#fff2c4", "#c9564a"];

const ARM_TO_LIGHT: ArchetypeSpec = {
  id: "g6c1-arm-to-light",
  title: "From Your Arm to the Light",
  tagline: "Turn a crank and follow the energy to the bulb, losing some at every step.",
  kind: "trace",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Follow a single quantity of energy through a chain of transfers.",
    "Explain that energy is not destroyed at each step, only spread out as heat.",
  ],
  misconceptions: ["Energy is used up as it passes through a machine"],
  specimens: [{ id: "joule", name: "The energy on its way", art: { art: "sphere", color: "#7fbf52" } }],
  stages: [
    { name: "Food", at: 0, caption: "Chemical energy in, about 300 J every second." },
    { name: "Crank", at: 0.25, caption: "A quarter of it turns the handle. The rest already warms you." },
    { name: "Generator", at: 0.5, caption: "Motion becomes electricity, with about 70 per cent getting through." },
    { name: "Lamp", at: 0.75, caption: "Electricity becomes light, and a great deal of heat." },
    { name: "Room", at: 1, caption: "Every joule ends up as warmth in the room. Nothing has vanished." },
  ],
  route: [
    { at: [0.1, 0.34], name: "Your muscles",
      note: "Chemical energy from food, burned at about 300 W. Muscle is roughly 25 per cent efficient, so about 75 W reaches the handle." },
    { at: [0.28, 0.6], name: "The crank",
      note: "75 W of mechanical energy. Turn faster and you feel the load rise: the generator is pushing back." },
    { at: [0.46, 0.3], name: "The generator",
      note: "A coil turning in a magnetic field. About 70 per cent gets through, so roughly 52 W of electrical energy leaves. The rest heats the coil." },
    { at: [0.62, 0.58], name: "The wires",
      note: "A couple of watts warm the wire itself. About 50 W arrives at the lamp." },
    { at: [0.78, 0.3], name: "Filament bulb",
      note: "Only about 5 per cent leaves as visible light: 2.5 W. The other 47 W is infrared and heat. An LED would give 15 W of light from the same 50." },
    { at: [0.9, 0.6], name: "The room",
      note: "Walls absorb the light and warm slightly. Add it all up and the full 300 W has become heat: transferred and spread out, never destroyed." },
  ],
  /*
   * The packet being followed is drawn at the size of the useful power still
   * in it: 300 W of food, 75 W at the handle, 52 W out of the generator, 50 W
   * at the lamp, 2.5 W of light. Energy is a volume, so the width is the cube
   * root of that — the packet leaves the lamp a fifth as wide as it arrived at
   * your muscles, which is what five per cent efficiency looks like. It also
   * takes the colour of the form it is in at each step.
   */
  drive: ({ t }) => {
    const p = railPhase(t) * (CHAIN_WATTS.length - 1);
    const i = Math.min(CHAIN_WATTS.length - 2, Math.floor(p));
    const k = p - i;
    const watts = CHAIN_WATTS[i] + (CHAIN_WATTS[i + 1] - CHAIN_WATTS[i]) * k;
    return {
      scale: Math.cbrt(watts / 300) * 1.25,
      color: CHAIN_COLORS[k < 0.5 ? i : i + 1],
      glow: Math.min(1, watts / 60),
      rate: 0.3 + watts / 150,
    };
  },
};

/* C1.5 — Conservation of energy, introduced. */
const NOTHING_IS_LOST: ArchetypeSpec = {
  id: "g6c1-nothing-is-lost",
  title: "Nothing Is Lost",
  tagline: "Drop into a half-pipe and count the joules at every point.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Show that stored and kinetic energy trade off while the total stays the same.",
    "Account for the energy that friction moves out of the system.",
  ],
  misconceptions: ["Energy disappears when a moving object slows down"],
  specimens: [{ id: "board", name: "Skateboarder, 60 kg", art: { art: "apparatus", which: "cart" } }],
  stages: [
    { name: "At the top", at: 0,
      caption: "3.0 m up, not moving. Stored 1 766 J, kinetic 0 J, total 1 766 J." },
    { name: "Halfway down", at: 0.25,
      caption: "1.5 m up, moving at 5.4 m/s. Stored 883 J, kinetic 883 J, total unchanged." },
    { name: "At the bottom", at: 0.5,
      caption: "Ground level at 7.7 m/s. Stored 0 J, kinetic 1 766 J. Every joule has changed form, none has gone." },
    { name: "Up the far side", at: 0.75,
      caption: "Rises to 2.55 m, not 3.0. Friction and air moved 265 J out as heat, so 1 501 J is left." },
    { name: "At rest", at: 1,
      caption: "After many passes the skater stops. All 1 766 J is now warmth in the ramp, the wheels and the air." },
  ],
  /*
   * The skater actually rides the half-pipe. Height goes as the square of the
   * horizontal position, which is the shape of the pipe, and the amplitude
   * decays because friction and air take 265 J out of 1 766 J on every pass —
   * so the last pass reaches a fraction of the first, and by the end of the
   * rail the cart is sitting still at the bottom with all of it gone to heat.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const s = Math.sin(u * Math.PI * 6);
    const amp = 1 - 0.85 * u;
    return {
      offset: [s * amp, -s * s * amp * amp * 0.9],
      tilt: 0.24 - s * amp * 0.45,
      rate: amp,
    };
  },
};

/* C1.6 — Tracking energy through everyday examples. */
const WHERE_IT_ENDS_UP: ArchetypeSpec = {
  id: "g6c1-where-it-ends-up",
  title: "Where Does It All End Up?",
  tagline: "Two lamps, the same brightness, one seventh of the energy.",
  kind: "compare",
  subject: "physics",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS3-5"] },
  learningGoals: [
    "Compare the useful and wasted output of two devices doing the same job.",
    "Explain that wasted energy is not destroyed but spread out as heat.",
  ],
  misconceptions: ["An efficient device produces no waste heat"],
  variables: [
    { key: "lumensWanted", label: "Light wanted (lumens)", min: 200, max: 1600, step: 50, default: 800 },
    { key: "hoursPerDay", label: "Hours lit each day", min: 1, max: 12, step: 0.5, default: 4 },
  ],
  /*
   * Luminous efficacy, measured: a tungsten filament manages about 14 lumens
   * per watt and a domestic LED about 100. So the 800 lumens of a standard
   * 60 W bulb costs 57 W one way and 8 W the other. Of the filament's power
   * about 95 per cent leaves as heat rather than light, against 65 per cent
   * for the LED, and a kilowatt-hour is a thousand watt-hours.
   */
  measure: (v) => {
    const filamentW = v.lumensWanted / 14;
    const ledW = v.lumensWanted / 100;
    return {
      filamentWatts: filamentW,
      ledWatts: ledW,
      filamentWasteHeatW: filamentW * 0.95,
      ledWasteHeatW: ledW * 0.65,
      timesMoreEnergy: filamentW / ledW,
      savedPerYearKWh: ((filamentW - ledW) * v.hoursPerDay * 365) / 1000,
    };
  },
  specimens: [
    { id: "filament", name: "Filament lamp: 57 W for 800 lumens",
      because: "About 5 per cent leaves as visible light, near 2.8 W. The other 54 W leaves as infrared and heat: the bulb is really a small heater that glows.",
      art: { art: "apparatus", which: "bulb" } },
    { id: "led", name: "LED lamp: 8 W for the same 800 lumens",
      because: "About 35 per cent leaves as visible light, near 2.8 W again. Same light, one seventh of the energy, and only 5 W of heat.",
      art: { art: "sphere", color: "#f4f0d8", radius: 0.4, glow: 1 } },
  ],
  /*
   * Both lamps are drawn at the size of the energy they eat. Power is a
   * volume here, so the width is its cube root: seven times the energy is not
   * seven times as wide but 1.9 times, which is what a factor of seven in a
   * volume actually looks like. The filament also shakes, because 54 of its
   * 57 watts are heat it cannot get rid of; the LED sits still on 5.
   */
  drive: ({ f, index, t }) => index === 0
    ? {
        scale: Math.cbrt(f.filamentWatts / 20),
        offset: [0, 0.012 * Math.sin(t * 21)],
        tilt: 0.24 + 0.05 * Math.sin(t * 6),
        glow: Math.min(1, f.filamentWatts / 60),
        color: "#ffae3a",
        rate: 1.6,
      }
    : {
        scale: Math.cbrt(f.ledWatts / 20),
        glow: Math.min(1, f.ledWatts / 12),
        rate: 0.5,
      },
};

export const g6c1MovingOrStored = buildSim(MOVING_OR_STORED);
export const g6c1TwiceTheSpeed = buildSim(TWICE_THE_SPEED);
export const g6c1LiftedAndReady = buildSim(LIFTED_AND_READY);
export const g6c1ArmToLight = buildSim(ARM_TO_LIGHT);
export const g6c1NothingIsLost = buildSim(NOTHING_IS_LOST);
export const g6c1WhereItEndsUp = buildSim(WHERE_IT_ENDS_UP);
