import type { MsLab } from "../msLabs";

/** Grade 6 Unit F labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6F: MsLab[] = [
  {
    id: "g6f-energy-balance", grade: 6, unit: "F", topics: ["F1", "F3"], subject: "earth",
    name: "Earth’s Energy Balance — Sunlight In, Heat Out",
    setups: [
      { value: "budget", label: "Energy in, energy out", teaches: ["F1.1", "F1.2"] },
      { value: "tyndall", label: "Tyndall’s tube: which gases stop heat?", teaches: ["F3.1", "F1.3"] },
      { value: "jars", label: "The jar demonstration — and Wood’s test", teaches: ["F1.3"] },
      { value: "feedback", label: "Ice, vapour and clouds: feedbacks", teaches: ["F1.4", "F1.5"] },
      { value: "causes", label: "What warmed the world since 1850?", teaches: ["F3.2", "F3.3", "F3.4"] },
      { value: "timescales", label: "Fast changes and slow ones", teaches: ["F3.5"] },
    ],
  },
];
