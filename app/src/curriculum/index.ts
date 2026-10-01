import type { GradeCurriculum } from "./types";
import { GRADE_6 } from "./grade6";
import { GRADE_7 } from "./grade7";
import { GRADE_8 } from "./grade8";

export * from "./types";
export { GRADE_6, GRADE_7, GRADE_8 };

/** Grades with a full curriculum encoded, in teaching order. */
export const CURRICULA: GradeCurriculum[] = [GRADE_6, GRADE_7, GRADE_8];

export function curriculumFor(grade: number): GradeCurriculum | undefined {
  return CURRICULA.find((c) => c.grade === grade);
}

/** Where a simulation sits in the curriculum, for the "taught in" backlink. */
export interface Placement {
  grade: number;
  unitCode: string;
  unitTitle: string;
  topicCode: string;
  topicTitle: string;
  subtopicCode: string;
  subtopicTitle: string;
}

export function placementsOf(simId: string): Placement[] {
  const out: Placement[] = [];
  for (const c of CURRICULA) {
    for (const u of c.units) {
      for (const t of u.topics) {
        for (const s of t.subtopics) {
          if (s.sims?.includes(simId)) {
            out.push({
              grade: c.grade,
              unitCode: u.code, unitTitle: u.title,
              topicCode: t.code, topicTitle: t.title,
              subtopicCode: s.code, subtopicTitle: s.title,
            });
          }
        }
      }
    }
  }
  return out;
}

/** Every simulation id the curriculum expects to exist. */
export function allReferencedSimIds(): string[] {
  const set = new Set<string>();
  for (const c of CURRICULA) {
    for (const u of c.units) for (const t of u.topics) for (const s of t.subtopics) {
      for (const id of s.sims ?? []) set.add(id);
    }
  }
  return [...set].sort();
}
