import type { Subject } from "@engine/types";

/**
 * The California Integrated Science curriculum, as taught.
 *
 * The catalog answers "what simulations exist?". This answers the question a
 * teacher actually asks: "I am teaching Grade 7, Unit B, topic B3 on Monday —
 * what do I open?" Units run in teaching order, topics within a unit run in
 * teaching order, and every simulation is attached to the subtopic it serves.
 */

export interface Subtopic {
  /** Curriculum code, e.g. "B3.2". */
  code: string;
  title: string;
  /** Simulation ids that teach this subtopic, best first. */
  sims?: string[];
}

export interface Topic {
  /** Curriculum code, e.g. "B3". */
  code: string;
  title: string;
  subtopics: Subtopic[];
  /** NGSS performance expectations this topic is aligned to. */
  standards?: string[];
}

export interface Unit {
  /** Unit letter, e.g. "B". */
  code: string;
  title: string;
  subject: Subject;
  topics: Topic[];
}

export interface GradeCurriculum {
  grade: number;
  title: string;
  /** Short description shown at the top of the grade's library page. */
  summary: string;
  units: Unit[];
}

/* ------------------------------------------------------------------ *
 * Derived counts and lookups
 * ------------------------------------------------------------------ */

export function countTopics(g: GradeCurriculum): number {
  return g.units.reduce((n, u) => n + u.topics.length, 0);
}

export function countSubtopics(g: GradeCurriculum): number {
  return g.units.reduce(
    (n, u) => n + u.topics.reduce((m, t) => m + t.subtopics.length, 0), 0,
  );
}

/** Every simulation id referenced anywhere in a grade, in teaching order. */
export function simsInGrade(g: GradeCurriculum): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of g.units) {
    for (const t of u.topics) {
      for (const s of t.subtopics) {
        for (const id of s.sims ?? []) {
          if (!seen.has(id)) { seen.add(id); out.push(id); }
        }
      }
    }
  }
  return out;
}

/** How many subtopics in a unit have at least one simulation attached. */
export function unitCoverage(u: Unit): { covered: number; total: number } {
  let covered = 0, total = 0;
  for (const t of u.topics) {
    for (const s of t.subtopics) {
      total++;
      if (s.sims?.length) covered++;
    }
  }
  return { covered, total };
}

export function gradeCoverage(g: GradeCurriculum): { covered: number; total: number } {
  return g.units.reduce(
    (acc, u) => {
      const c = unitCoverage(u);
      return { covered: acc.covered + c.covered, total: acc.total + c.total };
    },
    { covered: 0, total: 0 },
  );
}

/** All standards referenced by a grade, deduplicated and sorted. */
export function standardsInGrade(g: GradeCurriculum): string[] {
  const set = new Set<string>();
  for (const u of g.units) for (const t of u.topics) for (const s of t.standards ?? []) set.add(s);
  return [...set].sort();
}
