import type { MsLab } from "../msLabs";

/** Grade 7 Unit B labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_7B: MsLab[] = [
  {
    id: "g7b-change-detective", grade: 7, unit: "B", topics: ["B1", "B2"], subject: "chemistry",
    name: "The Change Detective — Physical Change, Chemical Change and the Evidence",
    setups: [
      { value: "physical", label: "Physical change: same substance", teaches: ["B1.1"] },
      { value: "chemical", label: "Chemical change: new substances", teaches: ["B1.2", "B2.5"] },
      { value: "signs", label: "The signs, and the instruments", teaches: ["B2.1"] },
      { value: "confusing", label: "Look-alikes side by side", teaches: ["B1.3", "B2.4"] },
      { value: "properties", label: "Properties before and after", teaches: ["B1.4", "B2.2"] },
      { value: "reversible", label: "Can you get it back?", teaches: ["B1.5"] },
      { value: "unknown", label: "Identify it, then name it", teaches: ["B2.3", "B2.5"] },
    ],
  },
];
