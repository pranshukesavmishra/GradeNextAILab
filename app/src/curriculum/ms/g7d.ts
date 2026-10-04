import type { MsLab } from "../msLabs";

/** Grade 7 Unit D labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_7D: MsLab[] = [
  {
    id: "g7d-populations", grade: 7, unit: "D", topics: ["D1"], subject: "biology",
    name: "Populations and Limits",
    setups: [
      { value: "limits", label: "What runs out first? Duckweed in a jar", teaches: ["D1.1"] },
      { value: "capacity", label: "Carrying capacity: Gause’s Paramecium", teaches: ["D1.2", "D1.4"] },
      { value: "data", label: "Reading real counts", teaches: ["D1.3"] },
      { value: "scarcity", label: "St Matthew Island: boom and crash", teaches: ["D1.4"] },
      { value: "competition", label: "Two species, one food", teaches: ["D1.5"] },
    ],
  },
];
