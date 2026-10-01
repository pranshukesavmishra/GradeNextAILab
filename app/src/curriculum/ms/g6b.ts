import type { MsLab } from "../msLabs";

/** Grade 6 Unit B labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6B: MsLab[] = [
  {
    id: "g6b-microscope", grade: 6, unit: "B", topics: ["B1"], subject: "biology",
    name: "The Microscope — Discovering Cells",
    setups: [
      { value: "hooke", label: "Hooke's cork and Leeuwenhoek's animalcules", teaches: ["B1.2"] },
      { value: "theory", label: "Every cell from a cell", teaches: ["B1.1"] },
      { value: "living", label: "Alive or not?", teaches: ["B1.3"] },
      { value: "unicellular", label: "One cell that does everything", teaches: ["B1.4"] },
      { value: "multicellular", label: "From one cell to many", teaches: ["B1.5"] },
      { value: "scale", label: "How small is small?", teaches: ["B1.6"] },
    ],
  },
  {
    id: "g6b-inside-cell", grade: 6, unit: "B", topics: ["B2"], subject: "biology",
    name: "Inside the Cell — Membranes, Walls and Organelles",
    setups: [
      { value: "membrane", label: "What gets through a membrane?", teaches: ["B2.1"] },
      { value: "wall", label: "What a wall is for", teaches: ["B2.2"] },
      { value: "nucleus", label: "Whose cap? The nucleus decides", teaches: ["B2.3"] },
      { value: "mito", label: "Cells that breathe", teaches: ["B2.4"] },
      { value: "chloro", label: "Where light makes food", teaches: ["B2.5"] },
      { value: "size", label: "Why cells are small", teaches: ["B2.6"] },
    ],
  },
];
