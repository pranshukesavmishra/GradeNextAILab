import type { MsLab } from "../msLabs";

/** Grade 6 Unit D labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6D: MsLab[] = [
  {
    id: "g6d-water-cycle", grade: 6, unit: "D", topics: ["D1"], subject: "earth",
    name: "The Water Cycle Machine",
    setups: [
      { value: "reservoirs", label: "All the water on Earth, in one bottle", teaches: ["D1.1"] },
      { value: "evaporate", label: "Rain in a box: evaporation and condensation", teaches: ["D1.2"] },
      { value: "rain", label: "The rainfall simulator: soak in or run off?", teaches: ["D1.3"] },
      { value: "transpire", label: "The potometer: how fast a plant drinks", teaches: ["D1.4"] },
      { value: "drivers", label: "Switch off the Sun, then gravity", teaches: ["D1.5", "D1.6"] },
      { value: "residence", label: "Dye a lake: how long does water stay?", teaches: ["D1.6"] },
    ],
  },
];
