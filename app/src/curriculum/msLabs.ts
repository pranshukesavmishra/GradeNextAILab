/** One experiment a Smart Lab lab can be set up to run. */
export interface MsSetup {
  /** The engine's set-up value: smartlab/index.html#<lab>/<value> opens it. */
  value: string;
  label: string;
  /** Curriculum subtopic codes this set-up teaches, e.g. "A1.3". */
  teaches: string[];
}

/** A Grades 6–8 lab on the Smart Lab engine, as the GradeNext catalogue sees it. */
export interface MsLab {
  /** The engine's own id. */
  id: string;
  grade: 6 | 7 | 8;
  /** Unit letter within the grade ("A"); the engine writes it with the grade ("6A"). */
  unit: string;
  /** The topics of the unit this lab serves, e.g. ["A1", "A2"]. */
  topics: string[];
  subject: "engineering" | "earth" | "physics" | "chemistry" | "biology";
  name: string;
  setups: MsSetup[];
}

/**
 * The Grades 6–8 Smart Lab experiments, built unit by unit (docs/BATCH_PLAN.md).
 *
 * These run on the Smart Lab engine in the repository-root smartlab/ folder. A
 * lab serves one or two topics of a unit on one apparatus, and each of its
 * set-ups is a different experiment on it; `teaches` says which subtopics a
 * set-up teaches, so the Course Library can put every subtopic one click from
 * the experiment that teaches it.
 *
 * msLabs.test.ts loads the engine's lab sources and fails the moment this list
 * and the engine disagree — ids, grades, units, topics, names, set-ups or what
 * each set-up teaches — and checks that the labs claiming a topic teach every
 * subtopic of it between them, each teaching at least one. A topic may be
 * served by several labs: A4 has Earth's Four Spheres and One Event, Four
 * Spheres, which both teach A4.5 and A4.6.
 */
export const MS_LABS: MsLab[] = [
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
];

/** A set-up that teaches a subtopic, with the lab it belongs to. */
export interface MsTeaching { lab: MsLab; setup: MsSetup }

/** Every Smart Lab set-up that teaches a subtopic of a grade, in catalogue order. */
export function msTeaching(grade: number, code: string): MsTeaching[] {
  const out: MsTeaching[] = [];
  for (const lab of MS_LABS) {
    if (lab.grade !== grade) continue;
    for (const setup of lab.setups) if (setup.teaches.includes(code)) out.push({ lab, setup });
  }
  return out;
}

export function msLab(id: string): MsLab | undefined {
  return MS_LABS.find((l) => l.id === id);
}

/** Relative to the page, so it resolves under /GradeNextAILab/ on Pages and / in dev. */
export function msLabUrl(lab: MsLab, setup: string | undefined, embed: boolean): string {
  return `smartlab/index.html?grade=${lab.grade}${embed ? "&embed=1" : ""}#${encodeURIComponent(lab.id)}` +
    (setup ? `/${encodeURIComponent(setup)}` : "");
}
