import type { MsLab } from "../msLabs";

/** Grade 6 Unit E labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6E: MsLab[] = [
  {
    id: "g6e-climate", grade: 6, unit: "E", topics: ["E1"], subject: "earth",
    name: "Climate from Weather",
    setups: [
      { value: "weathervsclimate", label: "One day, or thirty years?", teaches: ["E1.1"] },
      { value: "build", label: "Build a climate from daily records", teaches: ["E1.2"] },
      { value: "graphs", label: "Read two climographs", teaches: ["E1.3"] },
      { value: "maps", label: "Read a climate map", teaches: ["E1.4"] },
      { value: "zones", label: "Sort the world into climate zones", teaches: ["E1.5"] },
    ],
  },
];
