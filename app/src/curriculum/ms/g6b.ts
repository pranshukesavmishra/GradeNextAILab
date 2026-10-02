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
  {
    id: "g6b-levels", grade: 6, unit: "B", topics: ["B3"], subject: "biology",
    name: "Levels of Organization",
    setups: [
      { value: "hierarchy", label: "Zoom from a body to a molecule", teaches: ["B3.1", "B3.6"] },
      { value: "special", label: "Same genes, different jobs", teaches: ["B3.2"] },
      { value: "tissues", label: "Cells working together: tissues", teaches: ["B3.3"] },
      { value: "organs", label: "An organ: the stomach, layer by layer", teaches: ["B3.4"] },
      { value: "systems", label: "Knock one organ out", teaches: ["B3.5", "B3.6"] },
    ],
  },
  {
    id: "g6b-systems-bench", grade: 6, unit: "B", topics: ["B4"], subject: "biology",
    name: "The Body Systems Bench",
    setups: [
      { value: "digestive", label: "Digestive: amylase in a water bath", teaches: ["B4.1"] },
      { value: "excretory", label: "Excretory: drink a litre, collect the urine", teaches: ["B4.2"] },
      { value: "circulatory", label: "Circulatory: the pump and a narrowed artery", teaches: ["B4.3"] },
      { value: "respiratory", label: "Respiratory: the bell-jar lung", teaches: ["B4.4"] },
      { value: "muscular", label: "Muscular: the forearm lever", teaches: ["B4.5"] },
      { value: "nervous", label: "Nervous: the ruler-drop test", teaches: ["B4.6"] },
    ],
  },
  {
    id: "g6b-exercise", grade: 6, unit: "B", topics: ["B5"], subject: "biology",
    name: "The Body During Exercise",
    setups: [
      { value: "meal", label: "A meal: from gut to blood to muscle", teaches: ["B5.1"] },
      { value: "oxygen", label: "What makes us breathe harder?", teaches: ["B5.2"] },
      { value: "move", label: "Nerves recruit muscle fibres", teaches: ["B5.3"] },
      { value: "balance", label: "A long ride in the heat: water and the kidneys", teaches: ["B5.4"] },
      { value: "exercise", label: "Rest, ride, recover: every system", teaches: ["B5.5"] },
      { value: "break", label: "Break one system: watch the others", teaches: ["B5.6"] },
    ],
  },
];
