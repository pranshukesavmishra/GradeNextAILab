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
  {
    id: "g6e-circulation", grade: 6, unit: "E", topics: ["E2"], subject: "earth",
    name: "Circulation of Air and Ocean",
    setups: [
      { value: "convection", label: "Heat one end of a tank", teaches: ["E2.1"] },
      { value: "cells", label: "Three cells and the prevailing winds", teaches: ["E2.2"] },
      { value: "coriolis", label: "A puck on a turntable", teaches: ["E2.3"] },
      { value: "currents", label: "Wind drives an ocean", teaches: ["E2.4"] },
      { value: "density", label: "Warm, cold, fresh, salty", teaches: ["E2.5"] },
      { value: "heat", label: "The planet moves its heat", teaches: ["E2.6"] },
    ],
  },
];
