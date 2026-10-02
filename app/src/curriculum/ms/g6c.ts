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
];
