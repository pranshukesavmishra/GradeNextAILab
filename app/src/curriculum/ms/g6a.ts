import type { MsLab } from "../msLabs";

/** Grade 6 Unit A labs, in lab order (docs/BATCH_PLAN.md). One file per unit so units can be built in parallel. */
export const LABS_6A: MsLab[] = [
  {
    id: "g6a-living-tank", grade: 6, unit: "A", topics: ["A1", "A2"], subject: "engineering",
    name: "The Living Tank — Parts, Boundaries and Flows",
    setups: [
      { value: "unplug", label: "Unplug a part", teaches: ["A1.1", "A1.3"] },
      { value: "zoom", label: "Systems inside systems", teaches: ["A1.2", "A1.5"] },
      { value: "shoal", label: "No fish in charge", teaches: ["A1.4"] },
      { value: "boundary", label: "Draw the boundary", teaches: ["A2.1", "A2.5"] },
      { value: "sealed", label: "Open, closed, sealed", teaches: ["A2.2"] },
      { value: "trace", label: "Follow an atom and a joule", teaches: ["A2.3", "A2.4"] },
    ],
  },
  {
    id: "g6a-draining-tank", grade: 6, unit: "A", topics: ["A3"], subject: "engineering",
    name: "The Draining Tank — Building, Testing and Revising a Model",
    setups: [
      { value: "why", label: "Why build a model?", teaches: ["A3.1"] },
      { value: "diagram", label: "Diagram, flowchart, equation", teaches: ["A3.2"] },
      { value: "scale", label: "Physical and digital models", teaches: ["A3.3"] },
      { value: "leaves", label: "What a model leaves out", teaches: ["A3.4"] },
      { value: "revise", label: "Build, test and revise", teaches: ["A3.5"] },
    ],
  },
  {
    id: "g6a-four-spheres", grade: 6, unit: "A", topics: ["A4"], subject: "earth",
    name: "Earth’s Four Spheres — Rock, Water, Air and Life",
    setups: [
      { value: "geo", label: "Find the core without digging", teaches: ["A4.1"] },
      { value: "hydro", label: "Where the water is, and how long it stays", teaches: ["A4.2"] },
      { value: "atmo", label: "Climb through the air", teaches: ["A4.3"] },
      { value: "bio", label: "What limits life here?", teaches: ["A4.4"] },
      { value: "links", label: "Carbon through the four spheres", teaches: ["A4.5", "A4.6"] },
    ],
  },
  {
    id: "g6a-one-event", grade: 6, unit: "A", topics: ["A4"], subject: "earth",
    name: "One Event, Four Spheres — Eruption, Hurricane, Wildfire, Drought",
    setups: [
      { value: "eruption", label: "A volcano erupts", teaches: ["A4.5", "A4.6"] },
      { value: "hurricane", label: "A hurricane comes ashore", teaches: ["A4.5", "A4.6"] },
      { value: "wildfire", label: "A wildfire, and the rain after it", teaches: ["A4.5", "A4.6"] },
      { value: "drought", label: "A drought in a farming valley", teaches: ["A4.5", "A4.6"] },
    ],
  },
  {
    id: "g6a-measurement-bench", grade: 6, unit: "A", topics: ["A5"], subject: "engineering",
    name: "The Measurement Bench — Safety, SI Units and Honest Numbers",
    setups: [
      { value: "hot", label: "Hot glass looks like cold glass", teaches: ["A5.1"] },
      { value: "acid", label: "Acid into water — never water into acid", teaches: ["A5.1"] },
      { value: "density", label: "Weigh it, measure it, name it", teaches: ["A5.3"] },
      { value: "timing", label: "Stopwatch against light gates", teaches: ["A5.3", "A5.4"] },
      { value: "graph", label: "From the table to the graph", teaches: ["A5.4"] },
    ],
  },
  {
    id: "g6a-fair-test", grade: 6, unit: "A", topics: ["A5"], subject: "engineering",
    name: "The Fair Test — Variables, Evidence and Investigation Design",
    setups: [
      { value: "fair", label: "A fair test: change one thing", teaches: ["A5.2"] },
      { value: "trials", label: "How many drops tell them apart?", teaches: ["A5.2", "A5.4"] },
      { value: "cer", label: "Claim, evidence, reasoning", teaches: ["A5.5"] },
      { value: "design", label: "Plan it, check it, run it", teaches: ["A5.6"] },
    ],
  },
];
