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

/**
 * Where the stage rail has got to, rebuilt from the clock.
 *
 * `drive` is handed elapsed time but not progress, and at the default Speed of
 * 0.6 the engine advances progress by 0.096 a second, so this is the rail's
 * own position and the apparatus moves in step with the caption under it.
 */
const railPhase = (t: number) => (t * 0.096) % 1;

/**
 * Blackbody colour, the sequence a smith reads by eye.
 *
 * Steel is black below about 500 degrees, dull red at 600, orange at 1 000 and
 * yellow-white beyond 1 300. Anything drawn hot in this topic uses this, so a
 * temperature always looks the same wherever it appears.
 */
const glowColor = (c: number) =>
  c < 480 ? "#6f6a78" : c < 700 ? "#b8422b" : c < 950 ? "#e0722c" : c < 1250 ? "#ff9f3d" : "#ffe6a8";

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
  /*
   * Which way the energy is going is the question, so the specimen shows it:
   * anything warmer than the room is drifting upward on its own rising air and
   * glowing, anything colder is settling and dull. Nothing "gains cold" — the
   * ice cube shrinks and the peas soften because energy is arriving.
   */
  drive: ({ specimen, t }) => {
    const breathe = Math.sin(t * 1.1);
    switch (specimen.id) {
      case "icecube":
        return { scale: 0.95 - 0.12 * railPhase(t), color: "#cfe0ef", rate: 0.25 };
      case "peas":
        return { offset: [0, 0.05 * breathe], scale: 1.02, rate: 0.3 };
      case "can":
        return { offset: [0, 0.04 * breathe], rate: 0.25, glow: 0 };
      case "tea":
        return { level: 0.6, color: "#b5763c", bubbles: 0.35, glow: 0.45, rate: 1.3 };
      case "soup":
        return { level: 0.7, color: "#c98a3d", bubbles: 0.12, glow: 0.3, rate: 0.9 };
      default:
        return { offset: [0, -0.05 * breathe], glow: 0.3, rate: 1.1 };
    }
  },
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
  specimens: [{ id: "rod", name: "Copper rod, 1 cm2 cross-section", art: { art: "sphere", color: "#c87f3a", radius: 0.42 } }],
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
  /*
   * The far end of the rod is the readout. Fourier's law makes the flow
   * proportional to the temperature difference and inversely proportional to
   * the length, so a short rod across a large difference runs hot enough to
   * glow and a long one across a small difference stays black. The colour is
   * the blackbody sequence: 5 degrees over 50 cm gives 0.04 W and nothing to
   * see, 95 degrees over 2 cm gives 19 W and the far end is orange.
   */
  drive: ({ v, f, t }) => {
    const endTempC = 20 + (v.deltaT * 40) / v.lengthCm;
    return {
      color: glowColor(endTempC),
      glow: Math.min(1, f.copperW / 12),
      scale: 0.8 + 4 / v.lengthCm,
      offset: [0.02 * Math.sin(t * 3 + f.copperW), 0],
      rate: 0.2 + Math.min(3, f.copperW / 4),
    };
  },
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
  /*
   * The tank is the experiment. Heating air at constant pressure makes it
   * expand — a cubic metre at 200 degrees holds 0.746 kg where the same volume
   * of room air holds 1.204 — and the drawn size follows the cube root of that
   * expansion, so 200 degrees is 1.17 times as wide, not 1.6. The plume speed
   * sets how hard it boils and how fast the whole thing turns: 0.6 m/s at 30
   * degrees, 3.5 m/s at 200.
   */
  drive: ({ v, f }) => ({
    scale: Math.cbrt(f.roomAirDensity / f.hotAirDensity),
    level: 0.55,
    bubbles: Math.min(1, f.plumeSpeedMs / 3),
    color: v.airTempC > 120 ? "#e0722c" : v.airTempC > 60 ? "#d8964a" : "#7fa8d8",
    glow: Math.min(1, (v.airTempC - 21) / 180),
    rate: 0.2 + f.plumeSpeedMs,
  }),
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
  /*
   * The plate is the lamp. Stefan-Boltzmann makes the radiated power go as the
   * fourth power of absolute temperature, so the halo grows far faster than
   * the slider does: 20 degrees gives 0 W net, 300 gives 2.3 kW and 800 gives
   * 33 kW. Polishing the plate down to an emissivity of 0.05 puts nearly all
   * of that out without changing its temperature by a degree — the plate stays
   * the same colour and stops shining, which is the point of the second
   * control.
   */
  drive: ({ v, f }) => ({
    color: glowColor(v.surfaceTempC),
    glow: Math.min(1, f.netW / 12000),
    scale: 0.85 + Math.min(0.5, f.netW / 30000),
    rate: 0.2 + Math.min(4, f.netW / 4000),
  }),
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
  variables: [
    { key: "contactSeconds", label: "How long you hold it (s)", min: 0, max: 20, step: 0.5, default: 5 },
    { key: "roomTempC", label: "Temperature of the room and both spoons (degrees C)", min: 0, max: 30, step: 1, default: 21 },
  ],
  /*
   * Both objects sit at exactly the same temperature, so what the skin reports
   * is the rate energy leaves it. Contact between skin at 33 degrees and a
   * semi-infinite solid gives a flow that falls as one over the square root of
   * time, with root(k rho c) — the thermal effusivity — setting its size:
   * about 8 000 SI units for steel and 380 for wood, a factor of 21. Over five
   * seconds on a square centimetre of finger that is roughly 5 J against
   * 0.25 J. Skin starts calling it painful somewhere past about 8 J.
   */
  measure: (v) => {
    const drive = Math.max(0, 33 - v.roomTempC);
    const area = 0.0001;
    const joules = (e: number) => (2 * e * drive * area * Math.sqrt(v.contactSeconds)) / Math.sqrt(Math.PI);
    const steelJ = joules(8000), woodJ = joules(380);
    return {
      energyLostToSteelJ: steelJ,
      energyLostToWoodJ: woodJ,
      steelTakesThisManyTimesMore: 8000 / 380,
      skinCoolingOnSteelC: steelJ / (0.001 * 3500),
      skinCoolingOnWoodC: woodJ / (0.001 * 3500),
    };
  },
  specimens: [
    { id: "steel", name: "Steel spoon at 21 degrees",
      because: "Steel conducts at about 50 W/m K, so it draws energy out of your finger roughly 35 times faster than wood. Your skin reports the flow and calls it cold.",
      art: { art: "apparatus", which: "magnet" } },
    { id: "wood", name: "Wooden spoon at 21 degrees",
      because: "Wood conducts at about 0.15 W/m K, some 300 times worse. Little energy leaves your finger, so the same 21 degrees feels comfortable.",
      art: { art: "sphere", color: "#a9793f", radius: 0.44 } },
  ],
  /*
   * Neither object changes temperature, because neither object is changing
   * temperature — that is the whole lesson. What changes is the halo of energy
   * being pulled out of the finger, which is twenty-one times larger on the
   * steel, and the shiver: past about 8 J the skin reports pain and the steel
   * side starts shaking. Both go dead still when the room reaches skin
   * temperature and there is nothing left to flow.
   */
  drive: ({ f, index, t }) => {
    const j = index === 0 ? f.energyLostToSteelJ : f.energyLostToWoodJ;
    const hurts = j > 8;
    return {
      glow: Math.min(1, j / 6),
      color: index === 0 ? (hurts ? "#4a70c8" : "#9aa3b4") : undefined,
      scale: index === 0 ? 1 : 0.95,
      offset: hurts ? [0.02 * Math.sin(t * 26), 0] : [0, 0],
      rate: 0.15 + Math.min(3, j / 2),
    };
  },
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
  /*
   * The beaker follows the real cooling curve. Newton's law of cooling drives
   * the gap between the two bodies down exponentially, so the iron falls from
   * 200 degrees fast and then slowly, and the water climbs from 20 to 29.2 and
   * no further. The water is drawn at its own temperature — it barely changes
   * colour, because 837 J warms it one degree against 44.9 J for the iron —
   * while the steam and the bubbling die away as the gap closes. At the end
   * both are at one temperature and nothing is moving: equilibrium is not a
   * pause, it is the end of the flow.
   */
  drive: ({ t }) => {
    const u = railPhase(t);
    const gap = Math.exp(-u * 3.4);
    const waterC = 29.2 - 9.2 * gap;
    return {
      level: 0.6,
      color: waterC > 28 ? "#a86a4a" : waterC > 24 ? "#8f7f8a" : "#6f8fbe",
      bubbles: gap * 0.9,
      glow: gap * 0.7,
      rate: 0.15 + gap * 2.6,
    };
  },
};

export const g6c3WhichWay = buildSim(WHICH_WAY);
export const g6c3AlongTheRod = buildSim(ALONG_THE_ROD);
export const g6c3WarmAirRises = buildSim(WARM_AIR_RISES);
export const g6c3AcrossTheGap = buildSim(ACROSS_THE_GAP);
export const g6c3MetalFeelsColder = buildSim(METAL_FEELS_COLDER);
export const g6c3MeetingInMiddle = buildSim(MEETING_IN_MIDDLE);
