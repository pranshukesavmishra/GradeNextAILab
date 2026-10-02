import type { MsLab } from "../msLabs";

/** Grade 6 Unit C labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6C: MsLab[] = [
  {
    id: "g6c-energy-chain", grade: 6, unit: "C", topics: ["C1"], subject: "physics",
    name: "The Energy Chain Bench — Forms, Stores and Transfers",
    setups: [
      { value: "forms", label: "One amount of energy, every form", teaches: ["C1.1"] },
      { value: "kinetic", label: "Speed, mass and ½mv²", teaches: ["C1.2"] },
      { value: "potential", label: "Height, gravity and mgh", teaches: ["C1.3"] },
      { value: "chain", label: "Sunlight to lamplight, link by link", teaches: ["C1.4", "C1.1"] },
      { value: "conserve", label: "Where did the energy go?", teaches: ["C1.5"] },
      { value: "everyday", label: "A kettle, a brake, a charger", teaches: ["C1.6", "C1.4"] },
    ],
  },
  {
    id: "g6c-particle-box", grade: 6, unit: "C", topics: ["C2"], subject: "physics",
    name: "The Particle Box — Matter, Motion and Temperature",
    setups: [
      { value: "particles", label: "Squeeze it: the space between particles", teaches: ["C2.1"] },
      { value: "brownian", label: "A bead that will not keep still", teaches: ["C2.2"] },
      { value: "phases", label: "Solid, liquid, gas: one substance", teaches: ["C2.3"] },
      { value: "temperature", label: "Two gases, one temperature", teaches: ["C2.4"] },
      { value: "total", label: "A spark against a bucket of bathwater", teaches: ["C2.5"] },
      { value: "thermometer", label: "A thermometer changes what it measures", teaches: ["C2.6"] },
    ],
  },
  {
    id: "g6c-heat-transfer", grade: 6, unit: "C", topics: ["C3"], subject: "physics",
    name: "The Heat Transfer Bench — Conduction, Convection, Radiation",
    setups: [
      { value: "direction", label: "Which way does the energy go?", teaches: ["C3.1"] },
      { value: "conduction", label: "Ingen-Housz’s rods: conduction", teaches: ["C3.2"] },
      { value: "convection", label: "A tank of water: convection", teaches: ["C3.3"] },
      { value: "radiation", label: "Leslie’s cube: radiation", teaches: ["C3.4"] },
      { value: "materials", label: "Metal feels colder: conductors and insulators", teaches: ["C3.5"] },
      { value: "equilibrium", label: "Mix them: thermal equilibrium", teaches: ["C3.6"] },
    ],
  },
  {
    id: "g6c-specific-heat", grade: 6, unit: "C", topics: ["C4"], subject: "physics",
    name: "The Specific Heat Investigation — Planning, Data and Explanation",
    setups: [
      { value: "material", label: "Same mass, same heater, two materials", teaches: ["C4.1"] },
      { value: "mass", label: "Same material, two masses", teaches: ["C4.2"] },
      { value: "plan", label: "Plan a fair test — and spoil it", teaches: ["C4.3"] },
      { value: "collect", label: "Log the data: interval, probe, resolution", teaches: ["C4.4"] },
      { value: "analyze", label: "Fit the lines, find c", teaches: ["C4.5"] },
      { value: "explain", label: "Why the sand burns and the sea does not", teaches: ["C4.6"] },
    ],
  },
];
