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
];
