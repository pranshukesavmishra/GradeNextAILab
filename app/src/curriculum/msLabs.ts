import { LABS_6A } from "./ms/g6a";
import { LABS_6B } from "./ms/g6b";
import { LABS_6C } from "./ms/g6c";
import { LABS_6D } from "./ms/g6d";
import { LABS_6E } from "./ms/g6e";
import { LABS_6F } from "./ms/g6f";
import { LABS_7A } from "./ms/g7a";
import { LABS_7B } from "./ms/g7b";
import { LABS_7C } from "./ms/g7c";
import { LABS_7D } from "./ms/g7d";
import { LABS_7E } from "./ms/g7e";
import { LABS_7F } from "./ms/g7f";
import { LABS_8A } from "./ms/g8a";
import { LABS_8B } from "./ms/g8b";
import { LABS_8C } from "./ms/g8c";
import { LABS_8D } from "./ms/g8d";
import { LABS_8E } from "./ms/g8e";
import { LABS_8F } from "./ms/g8f";

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
  ...LABS_6A,
  ...LABS_6B,
  ...LABS_6C,
  ...LABS_6D,
  ...LABS_6E,
  ...LABS_6F,
  ...LABS_7A,
  ...LABS_7B,
  ...LABS_7C,
  ...LABS_7D,
  ...LABS_7E,
  ...LABS_7F,
  ...LABS_8A,
  ...LABS_8B,
  ...LABS_8C,
  ...LABS_8D,
  ...LABS_8E,
  ...LABS_8F,
]

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
