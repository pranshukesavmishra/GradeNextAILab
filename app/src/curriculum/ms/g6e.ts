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
  {
    id: "g6e-generation", grade: 6, unit: "E", topics: ["E3"], subject: "biology",
    name: "Making the Next Generation",
    setups: [
      { value: "courtship", label: "Long tails and choosy females", teaches: ["E3.1"] },
      { value: "care", label: "How many eggs?", teaches: ["E3.2"] },
      { value: "flower", label: "Take a flower apart", teaches: ["E3.3"] },
      { value: "pollinate", label: "Bees in a meadow", teaches: ["E3.4"] },
      { value: "seeds", label: "How far do seeds go?", teaches: ["E3.5"] },
    ],
  },
  {
    id: "g6e-nurture", grade: 6, unit: "E", topics: ["E4"], subject: "biology",
    name: "Nature and Nurture Growth Chambers",
    setups: [
      { value: "environment", label: "What a plant needs", teaches: ["E4.1"] },
      { value: "test", label: "Test one factor fairly", teaches: ["E4.2"] },
      { value: "genes", label: "Same chamber, different seeds", teaches: ["E4.3"] },
      { value: "compare", label: "Every seed in every chamber", teaches: ["E4.4"] },
      { value: "separate", label: "Genes or environment? A 2 × 2", teaches: ["E4.5"] },
      { value: "coat", label: "The Himalayan rabbit", teaches: ["E4.3", "E4.5"] },
      { value: "hydrangea", label: "Blue or pink hydrangeas", teaches: ["E4.1", "E4.4"] },
    ],
  },
  {
    id: "g6e-heredity", grade: 6, unit: "E", topics: ["E5", "E6"], subject: "biology",
    name: "The Heredity Lab",
    setups: [
      { value: "sexual", label: "Meiosis and fertilisation", teaches: ["E5.1", "E6.3"] },
      { value: "resemble", label: "A pod of brothers and sisters", teaches: ["E5.2", "E6.2"] },
      { value: "asexual", label: "Strawberry runners: clones", teaches: ["E5.3", "E5.4", "E6.4"] },
      { value: "compare", label: "Sex against clones in a lake", teaches: ["E5.5"] },
      { value: "genes", label: "From plant to gene to DNA", teaches: ["E6.1"] },
      { value: "diagrams", label: "Inheritance diagrams", teaches: ["E6.5"] },
      { value: "punnett", label: "Punnett squares", teaches: ["E6.6"] },
    ],
  },
];
