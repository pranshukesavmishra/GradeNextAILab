import type { AnySim, GradeBand, Subject } from "@engine/types";
import { projectileSim } from "./physics/projectile";

/**
 * The simulation registry.
 *
 * Every sim is a self-contained manifest. Adding one to this array is the only
 * wiring required: the catalog, search, standards filtering, labs, and
 * challenges all read from the manifest.
 */
export const SIMS: AnySim[] = [
  projectileSim,
];

export function getSim(id: string): AnySim | undefined {
  return SIMS.find((s) => s.id === id);
}

export interface CatalogFilter {
  query?: string;
  subject?: Subject | "all";
  grade?: number | "all";
  band?: GradeBand | "all";
  mode?: "all" | "labs" | "challenges";
}

export function filterSims(sims: AnySim[], f: CatalogFilter): AnySim[] {
  const query = f.query?.trim().toLowerCase() ?? "";
  return sims.filter((sim) => {
    if (f.subject && f.subject !== "all" && sim.subject !== f.subject) return false;
    if (f.grade && f.grade !== "all" && !sim.grades.includes(f.grade)) return false;
    if (f.band && f.band !== "all" && !sim.bands.includes(f.band)) return false;
    if (f.mode === "labs" && !sim.labs?.length) return false;
    if (f.mode === "challenges" && !sim.challenges?.length) return false;
    if (query) {
      const haystack = [
        sim.title, sim.tagline, sim.subject,
        ...(sim.learningGoals ?? []),
        ...(sim.misconceptions ?? []),
        ...(sim.standards.ngss ?? []),
        ...(sim.standards.ccssMath ?? []),
        ...Object.values(sim.params).map((p) => p.label),
      ].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Grades that actually have at least one sim, for the grade picker. */
export function coveredGrades(sims: AnySim[]): number[] {
  const set = new Set<number>();
  for (const s of sims) for (const g of s.grades) set.add(g);
  return [...set].sort((a, b) => a - b);
}

export function subjectCounts(sims: AnySim[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sims) out[s.subject] = (out[s.subject] ?? 0) + 1;
  return out;
}

/** The band a grade number belongs to, used to default the depth selector. */
export function bandForGrade(grade: number): GradeBand {
  if (grade <= 2) return "K-2";
  if (grade <= 5) return "3-5";
  if (grade <= 8) return "6-8";
  return "9-12";
}
