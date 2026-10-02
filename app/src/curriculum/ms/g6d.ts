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
  {
    id: "g6d-atmosphere", grade: 6, unit: "D", topics: ["D2"], subject: "earth",
    name: "The Atmosphere Column",
    setups: [
      { value: "composition", label: "Take a sample of air apart", teaches: ["D2.1"] },
      { value: "layers", label: "A rocket through the layers", teaches: ["D2.2"] },
      { value: "pressure", label: "The weight of the air: Torricelli’s barometer", teaches: ["D2.3"] },
      { value: "ptrho", label: "Squeeze, heat, seal: a syringe of gas", teaches: ["D2.4"] },
      { value: "rise", label: "Will the balloon fly?", teaches: ["D2.5"] },
    ],
  },
  {
    id: "g6d-weather-station", grade: 6, unit: "D", topics: ["D3"], subject: "earth",
    name: "The Weather Station",
    setups: [
      { value: "temperature", label: "The thermometer: in the screen or in the sun?", teaches: ["D3.1"] },
      { value: "barometer", label: "The aneroid barometer and the falling glass", teaches: ["D3.2"] },
      { value: "humidity", label: "Wet and dry bulbs: the psychrometer", teaches: ["D3.3"] },
      { value: "precipitation", label: "Rain gauges, and the rain they miss", teaches: ["D3.4"] },
      { value: "wind", label: "Cups and a vane", teaches: ["D3.5"] },
      { value: "station", label: "Four days at the station", teaches: ["D3.6"] },
    ],
  },
  {
    id: "g6d-fronts", grade: 6, unit: "D", topics: ["D4"], subject: "earth",
    name: "Air Masses and Fronts",
    setups: [
      { value: "masses", label: "Air masses on the move", teaches: ["D4.1"] },
      { value: "highs", label: "Highs, lows and the wind between", teaches: ["D4.2"] },
      { value: "cold", label: "A cold front, in section", teaches: ["D4.3"] },
      { value: "warm", label: "A warm front, in section", teaches: ["D4.4"] },
      { value: "occluded", label: "Occluded and stationary fronts", teaches: ["D4.5"] },
      { value: "track", label: "Track a front from three stations", teaches: ["D4.6"] },
    ],
  },
];
