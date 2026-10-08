import type { MsLab } from "../msLabs";

/** Grade 7 Unit A labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_7A: MsLab[] = [
  {
    id: "g7a-particle-detective", grade: 7, unit: "A", topics: ["A1"], subject: "chemistry",
    name: "The Particle Detective — Evidence That Matter Is Made of Particles",
    setups: [
      { value: "review", label: "Particles on the move", teaches: ["A1.1"] },
      { value: "sharper", label: "50 mL + 50 mL = ?", teaches: ["A1.2"] },
      { value: "evidence", label: "Perrin: counting the uncountable", teaches: ["A1.3"] },
      { value: "atoms", label: "Pulling water apart", teaches: ["A1.4"] },
      { value: "scale", label: "Measuring a molecule with a ruler", teaches: ["A1.5"] },
    ],
  },
];
