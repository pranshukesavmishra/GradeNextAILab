import type { AnySim, GradeBand, Subject } from "@engine/types";

/* TEMP-G7E-VERIFY-START */
/* TEMP-G7E-VERIFY-END */
import { collisionsSim } from "./physics/collisions";
import { emSpectrumSim } from "./physics/em-spectrum";
import { heatTransferSim } from "./physics/heat-transfer";
import { kineticEnergySim } from "./physics/kinetic-energy";
import { motionGraphsSim } from "./physics/motion-graphs";
import { opticsSim } from "./physics/optics";
import { pendulumSim } from "./physics/pendulum";
import { soundSim } from "./physics/sound";
import { wavesSim } from "./physics/waves";
import { buildAtomSim } from "./chemistry/build-atom";
import { conservationSim } from "./chemistry/conservation";
import { gasLawsSim } from "./chemistry/gas-laws";
import { heatingCurveSim } from "./chemistry/heating-curve";
import { moleculesSim } from "./chemistry/molecules";
import { phLabSim } from "./chemistry/ph-lab";
import { reactionsSim } from "./chemistry/reactions";
import { statesOfMatterSim } from "./chemistry/states-of-matter";
import { artificialSelectionSim } from "./biology/artificial-selection";
import { bodySystemsSim } from "./biology/body-systems";
import { carbonCycleSim } from "./biology/carbon-cycle";
import { cellSim } from "./biology/cell";
import { ecosystemSim } from "./biology/ecosystem";
import { hereditySim } from "./biology/heredity";
import { mutationsSim } from "./biology/mutations";
import { naturalSelectionSim } from "./biology/natural-selection";
import { symbiosisSim } from "./biology/symbiosis";
import { erosionSim } from "./earth/erosion";
import { frontsSim } from "./earth/fronts";
import { moonPhasesSim } from "./earth/moon-phases";
import { plateTectonicsSim } from "./earth/plate-tectonics";
import { radiometricSim } from "./earth/radiometric";
import { rockCycleSim } from "./earth/rock-cycle";
import { seasonsSim } from "./earth/seasons";
import { spheresSim } from "./earth/spheres";
import { unequalHeatingSim } from "./earth/unequal-heating";
import { waterCycleSim } from "./earth/water-cycle";
import { weatherSim } from "./earth/weather";
import { unplugAquariumSim } from "./g6/a1-1-unplug-the-aquarium";



/**
 * The simulation registry.
 *
 * Every sim is a self-contained manifest. Adding one to this array is the only
 * wiring required: the catalog, the course library, search, standards
 * filtering, labs, and challenges all read from the manifest.
 */
export const SIMS: AnySim[] = [

  collisionsSim,
  emSpectrumSim,
  heatTransferSim,
  kineticEnergySim,
  motionGraphsSim,
  opticsSim,
  pendulumSim,
  soundSim,
  wavesSim,
  buildAtomSim,
  conservationSim,
  gasLawsSim,
  heatingCurveSim,
  moleculesSim,
  phLabSim,
  reactionsSim,
  statesOfMatterSim,
  artificialSelectionSim,
  bodySystemsSim,
  carbonCycleSim,
  cellSim,
  ecosystemSim,
  hereditySim,
  mutationsSim,
  naturalSelectionSim,
  symbiosisSim,
  erosionSim,
  frontsSim,
  moonPhasesSim,
  plateTectonicsSim,
  radiometricSim,
  rockCycleSim,
  seasonsSim,
  spheresSim,
  unequalHeatingSim,
  waterCycleSim,
  weatherSim,
  // Grade 6 · Unit A rebuild — one dedicated experiment per subtopic.
  unplugAquariumSim,
/* TEMP-G7E-VERIFY-START */
/* TEMP-G7E-VERIFY-END */
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
