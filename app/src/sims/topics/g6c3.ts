import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit C · Topic C3 — Thermal energy transfer.
 *
 * Six simulations, one per subtopic:
 *
 *   C3.1  g6c3-which-way          energy flows hot to cold      (sort)
 *   C3.2  g6c3-along-the-rod      conduction                    (investigate)
 *   C3.3  g6c3-warm-air-rises     convection                    (investigate)
 *   C3.4  g6c3-across-the-gap     radiation                     (investigate)
 *   C3.5  g6c3-metal-feels-colder conductors and insulators     (compare)
 *   C3.6  g6c3-meeting-in-middle  thermal equilibrium           (process)
 *
 * One investigation per mode of transfer, each on its real law: Fourier's
 * conduction law with measured conductivities, the ideal gas density that
 * drives a convection plume, and the Stefan-Boltzmann fourth-power law for
 * radiation. C3.6 closes the topic by letting two bodies meet in the middle,
 * at the temperature energy conservation demands.
 */

/* C3.1 — Energy flows hot to cold. */
const WHICH_WAY: ArchetypeSpec = {
  id: "g6c3-which-way",
  title: "Which Way Does the Energy Go?",
  tagline: "There is no such thing as cold moving in. Only energy moving out.",
  kind: "sort",
  subject: "physics",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "State that thermal energy always flows from hotter to cooler.",
    "Describe a cooling object as one that is losing energy, not gaining cold.",
  ],
  misconceptions: ["Cold flows into an object and makes it colder"],
  categories: [
    { id: "gains", name: "Energy flows in", hint: "the object is cooler than its surroundings" },
    { id: "loses", name: "Energy flows out", hint: "the object is warmer than its surroundings" },
  ],
  specimens: [
    { id: "icecube", name: "Ice cube in a glass of lemonade", category: "gains",
      because: "The ice is colder, so energy flows from the drink into the ice. That is what melts it, and what cools the drink.",
      art: { art: "sphere", color: "#dfeaf5", radius: 0.4 } },
    { id: "tea", name: "Mug of tea on the table", category: "loses",
      because: "At 70 degrees in a 21 degree room, it loses energy every second until it matches the room.",
      art: { art: "glassware", which: "beaker", level: 0.6 } },
    { id: "rail", name: "Your hands on a cold metal rail", category: "loses",
      because: "Your hands are the hotter object, so energy leaves them. It feels like cold arriving, but nothing is arriving.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "can", name: "Can taken out of the fridge", category: "gains",
      because: "At 5 degrees in a warm room, energy flows into it. Water from the air condenses on it as it warms.",
      art: { art: "apparatus", which: "battery" } },
    { id: "soup", name: "Vacuum flask of hot soup", category: "loses",
      because: "Still hotter than the room, so energy still leaves. The flask slows the flow right down but cannot stop it.",
      art: { art: "glassware", which: "flask", level: 0.7 } },
    { id: "peas", name: "Frozen peas on the worktop", category: "gains",
      because: "At -18 degrees they are the coldest thing in the kitchen, so energy flows in from the air and they thaw.",
      art: { art: "sphere", color: "#8fae6b", radius: 0.42 } },
  ],
};

/* C3.2 — Conduction. */
const ALONG_THE_ROD: ArchetypeSpec = {
  id: "g6c3-along-the-rod",
  title: "Along the Rod",
  tagline: "Same rod, same flame, five materials. Watch the numbers separate.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "Describe conduction as energy passed along by vibrating particles.",
    "Compare materials using measured thermal conductivity.",
  ],
  misconceptions: ["All solids conduct heat at about the same rate"],
  specimens: [{ id: "rod", name: "Rod, 1 cm2 cross-section", art: { art: "apparatus", which: "magnet" } }],
  variables: [
    { key: "deltaT", label: "Temperature difference along the rod (degrees C)", min: 5, max: 95, step: 1, default: 60 },
    { key: "lengthCm", label: "Rod length (cm)", min: 2, max: 50, step: 1, default: 20 },
  ],
  // Fourier's law, Q/t = k A dT / L, with a 1 cm2 cross-section. The
  // conductivities are the measured ones in W per metre per kelvin: copper
  // 400, aluminium 237, glass 1.0, wood 0.15, still air 0.026.
  measure: (v) => {
    const area = 1e-4, length = v.lengthCm / 100;
    const flow = (k: number) => (k * area * v.deltaT) / length;
    return {
      copperW: flow(400),
      aluminiumW: flow(237),
      glassW: flow(1),
      woodW: flow(0.15),
      stillAirW: flow(0.026),
    };
  },
  plot: { x: "deltaT", y: "copperW", xLabel: "Temperature difference (degrees C)", yLabel: "Energy per second through copper (W)" },
};

/* C3.3 — Convection. */
const WARM_AIR_RISES: ArchetypeSpec = {
  id: "g6c3-warm-air-rises",
  title: "Why Warm Air Rises",
  tagline: "Heat the air and it thins. Thinner air floats, and the room stirs itself.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "Explain convection as movement of the fluid itself, driven by density.",
    "Predict how much lighter air becomes when it is heated.",
  ],
  misconceptions: ["Heat itself rises, whatever the material"],
  specimens: [{ id: "tank", name: "Convection tank", art: { art: "glassware", which: "beaker", level: 0.55, bubbles: 4 } }],
  variables: [
    { key: "airTempC", label: "Temperature of the heated air (degrees C)", min: 21, max: 200, step: 1, default: 60 },
  ],
  // Air density from the gas law, rho = P / (R T), with P = 101 325 Pa and
  // R = 287 J/kg K for air. Room air at 20 degrees is 1.204 kg/m3, the
  // standard value. The plume speed is the Boussinesq estimate for a parcel
  // rising one metre: v = root(2 g H dT / T).
  measure: (v) => {
    const roomDensity = 101325 / (287 * 293.15);
    const hotDensity = 101325 / (287 * (v.airTempC + 273.15));
    return {
      hotAirDensity: hotDensity,
      roomAirDensity: roomDensity,
      buoyancyNPerM3: (roomDensity - hotDensity) * 9.81,
      plumeSpeedMs: Math.sqrt((2 * 9.81 * 1 * (v.airTempC - 20)) / 293.15),
    };
  },
  plot: { x: "airTempC", y: "plumeSpeedMs", xLabel: "Air temperature (degrees C)", yLabel: "Rising speed after 1 m (m/s)" },
};

/* C3.4 — Radiation. */
const ACROSS_THE_GAP: ArchetypeSpec = {
  id: "g6c3-across-the-gap",
  title: "Across Empty Space",
  tagline: "No particles needed. Warm the plate and the fourth power takes over.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "Explain that radiation carries energy without any material in between.",
    "Describe how radiated power rises very steeply with temperature.",
  ],
  misconceptions: ["Radiation needs air to travel through"],
  specimens: [{ id: "plate", name: "Hot plate, 0.5 m2", art: { art: "sphere", color: "#e0722c", radius: 0.44, glow: 0.9 } }],
  variables: [
    { key: "surfaceTempC", label: "Surface temperature (degrees C)", min: 20, max: 800, step: 5, default: 300 },
    { key: "emissivity", label: "Emissivity (1 = matt black, 0.05 = polished foil)", min: 0.05, max: 1, step: 0.05, default: 0.9 },
  ],
  // Stefan-Boltzmann: P = e sigma A T^4 with sigma = 5.670e-8 W/m2 K4. The net
  // loss subtracts what the plate absorbs back from a 20 degree room. Wien's
  // law gives the wavelength the emission peaks at, in micrometres.
  measure: (v) => {
    const sigma = 5.670e-8, area = 0.5;
    const tempK = v.surfaceTempC + 273.15, roomK = 293.15;
    return {
      emittedW: v.emissivity * sigma * area * Math.pow(tempK, 4),
      netW: v.emissivity * sigma * area * (Math.pow(tempK, 4) - Math.pow(roomK, 4)),
      peakWavelengthUm: 2898 / tempK,
    };
  },
  plot: { x: "surfaceTempC", y: "netW", xLabel: "Surface temperature (degrees C)", yLabel: "Net energy radiated (W)" },
};

/* C3.5 — Conductors and insulators. */
const METAL_FEELS_COLDER: ArchetypeSpec = {
  id: "g6c3-metal-feels-colder",
  title: "Why Metal Feels Colder",
  tagline: "Two handles, one drawer, exactly the same temperature. One feels freezing.",
  kind: "compare",
  subject: "physics",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-PS3-3"] },
  learningGoals: [
    "Explain the difference between a conductor and an insulator.",
    "Explain why touch measures the rate of energy flow, not temperature.",
  ],
  misconceptions: ["Metal objects are colder than wooden ones in the same room"],
  specimens: [
    { id: "steel", name: "Steel spoon at 21 degrees",
      because: "Steel conducts at about 50 W/m K, so it draws energy out of your finger roughly 35 times faster than wood. Your skin reports the flow and calls it cold.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "wood", name: "Wooden spoon at 21 degrees",
      because: "Wood conducts at about 0.15 W/m K, some 300 times worse. Little energy leaves your finger, so the same 21 degrees feels comfortable.",
      art: { art: "sphere", color: "#a9793f", radius: 0.44 } },
  ],
};

/* C3.6 — Thermal equilibrium. */
const MEETING_IN_MIDDLE: ArchetypeSpec = {
  id: "g6c3-meeting-in-middle",
  title: "Meeting in the Middle",
  tagline: "Drop hot iron into cool water and follow both temperatures until they agree.",
  kind: "process",
  subject: "physics",
  bands: ["6-8"],
  grades: [6, 7, 8],
  standards: { ngss: ["MS-PS3-4"] },
  learningGoals: [
    "Describe thermal equilibrium as the state where two bodies reach one temperature.",
    "Use energy conservation to predict the final temperature of a mixture.",
  ],
  misconceptions: ["Two objects in contact meet halfway between their temperatures"],
  specimens: [{ id: "beaker", name: "Iron in water", art: { art: "glassware", which: "beaker", level: 0.6 } }],
  stages: [
    { name: "Start", at: 0,
      caption: "100 g of iron at 200 degrees goes into 200 g of water at 20 degrees." },
    { name: "First seconds", at: 0.25,
      caption: "Iron 120, water 24.3. The iron has given up 3 592 J and the water has taken every one of them." },
    { name: "Slowing", at: 0.5,
      caption: "Iron 60, water 27.5. The gap is smaller, so the flow is slower. Nothing flows backwards." },
    { name: "Nearly there", at: 0.75,
      caption: "Iron 35, water 28.9. Note how little the water moved: it takes 837 J to warm it one degree, the iron only 44.9." },
    { name: "Equilibrium", at: 1,
      caption: "Both settle at 29.2 degrees, not 110. Equal temperatures, not equal energies: that is thermal equilibrium." },
  ],
};

export const g6c3WhichWay = buildSim(WHICH_WAY);
export const g6c3AlongTheRod = buildSim(ALONG_THE_ROD);
export const g6c3WarmAirRises = buildSim(WARM_AIR_RISES);
export const g6c3AcrossTheGap = buildSim(ACROSS_THE_GAP);
export const g6c3MetalFeelsColder = buildSim(METAL_FEELS_COLDER);
export const g6c3MeetingInMiddle = buildSim(MEETING_IN_MIDDLE);
