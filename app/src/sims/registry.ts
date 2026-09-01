import type { AnySim, GradeBand, Subject } from "@engine/types";
import {
  g6a1SystemOrHeap, g6a1NestedParts, g6a1PartsInStep, g6a1OnlyTogether, g6a1ScaleLadder,
} from "./topics/g6a1";
import {
  g6a2WhereDoesItEnd, g6a2SealedOrOpen, g6a2InOutAndLeft, g6a2FollowTheLunch, g6a2DrawTheBoundary,
} from "./topics/g6a2";
import {
  g6a3WhyAModel, g6a3BoxesAndArrows, g6a3TouchItOrRunIt, g6a3NotJustSmaller, g6a3BuildThePond,
} from "./topics/g6a3";
import {
  g6a4InsideTheGeosphere, g6a4WhereIsTheWater, g6a4ThinnerAndThinner, g6a4ThinGreenFilm, g6a4OneMoleculeFour, g6a4EruptionModel,
} from "./topics/g6a4";
import {
  g6a5BeforeYouLight, g6a5VariableRoles, g6a5ReadItProperly, g6a5SwingAndGraph, g6a5ClaimEvidence, g6a5TwoThingsChanged,
} from "./topics/g6a5";
import {
  g6b1CellTheory, g6b1FirstLook, g6b1OneOrMany, g6b1LivingTest, g6b1HowSmall,
} from "./topics/g6b1";
import {
  g6b2Membrane, g6b2CellWall, g6b2Nucleus, g6b2Mitochondria, g6b2Chloroplasts, g6b2BuildACell,
} from "./topics/g6b2";
import {
  g6b3Hierarchy, g6b3SpecialisedCell, g6b3TissuePull, g6b3BuildAnOrgan, g6b3WhichSystem, g6b3DownTheLevels,
} from "./topics/g6b3";
import {
  g6b4Digestive, g6b4Excretory, g6b4Circulatory, g6b4Respiratory, g6b4Muscular, g6b4NerveCell,
} from "./topics/g6b4";
import {
  g6b5MealToBlood, g6b5GasHandover, g6b5CatchABall, g6b5WaterBalance, g6b5Exercise, g6b5WhatACellNeeds,
} from "./topics/g6b5";
import {
  g6b6Receptors, g6b6SignalPath, g6b6CostOfChoosing, g6b6ReflexVsVoluntary, g6b6Memory, g6b6CloseTheLoop,
} from "./topics/g6b6";
import {
  g6c1MovingOrStored, g6c1TwiceTheSpeed, g6c1LiftedAndReady, g6c1ArmToLight, g6c1NothingIsLost, g6c1WhereItEndsUp,
} from "./topics/g6c1";
import {
  g6c2CutItAgain, g6c2HowASmell, g6c2SolidLiquidGas, g6c2HowFast, g6c2SparkAndBath, g6c2InsideAThermo,
} from "./topics/g6c2";
import {
  g6c3WhichWay, g6c3AlongTheRod, g6c3WarmAirRises, g6c3AcrossTheGap, g6c3MetalFeelsColder, g6c3MeetingInMiddle,
} from "./topics/g6c3";
import {
  g6c4WhichMaterial, g6c4HowMuchMatter, g6c4FairTestRig, g6c4MinuteByMinute, g6c4TwoDataSets, g6c4DoesItFollow,
} from "./topics/g6c4";
import {
  g6c5WhatBlocksHeat, g6c5CriteriaOrLimit, g6c5BuildTheCup, g6c5TestTheCup, g6c5TwoDesigns, g6c5OneChange,
} from "./topics/g6c5";
import { circuitsSim } from "./physics/circuits";
import { collisionsSim } from "./physics/collisions";
import { electricForceSim } from "./physics/electric-force";
import { emSpectrumSim } from "./physics/em-spectrum";
import { energySkateSim } from "./physics/energy-skate";
import { fieldsSim } from "./physics/fields";
import { forcesSim } from "./physics/forces";
import { gravitySim } from "./physics/gravity";
import { heatTransferSim } from "./physics/heat-transfer";
import { kineticEnergySim } from "./physics/kinetic-energy";
import { magnetismSim } from "./physics/magnetism";
import { motionGraphsSim } from "./physics/motion-graphs";
import { opticsSim } from "./physics/optics";
import { pendulumSim } from "./physics/pendulum";
import { projectileSim } from "./physics/projectile";
import { soundSim } from "./physics/sound";
import { wavesSim } from "./physics/waves";
import { buildAtomSim } from "./chemistry/build-atom";
import { conservationSim } from "./chemistry/conservation";
import { gasLawsSim } from "./chemistry/gas-laws";
import { heatingCurveSim } from "./chemistry/heating-curve";
import { moleculesSim } from "./chemistry/molecules";
import { periodicTableSim } from "./chemistry/periodic-table";
import { phLabSim } from "./chemistry/ph-lab";
import { reactionsSim } from "./chemistry/reactions";
import { statesOfMatterSim } from "./chemistry/states-of-matter";
import { artificialSelectionSim } from "./biology/artificial-selection";
import { bodySystemsSim } from "./biology/body-systems";
import { carbonCycleSim } from "./biology/carbon-cycle";
import { cellSim } from "./biology/cell";
import { ecosystemSim } from "./biology/ecosystem";
import { foodWebSim } from "./biology/food-web";
import { fossilRecordSim } from "./biology/fossil-record";
import { hereditySim } from "./biology/heredity";
import { homologySim } from "./biology/homology";
import { humanImpactSim } from "./biology/human-impact";
import { mutationsSim } from "./biology/mutations";
import { naturalSelectionSim } from "./biology/natural-selection";
import { neuronSim } from "./biology/neuron";
import { photosynthesisSim } from "./biology/photosynthesis";
import { pollinationSim } from "./biology/pollination";
import { symbiosisSim } from "./biology/symbiosis";
import { atmosphereSim } from "./earth/atmosphere";
import { circulationSim } from "./earth/circulation";
import { erosionSim } from "./earth/erosion";
import { frontsSim } from "./earth/fronts";
import { moonPhasesSim } from "./earth/moon-phases";
import { plateTectonicsSim } from "./earth/plate-tectonics";
import { radiometricSim } from "./earth/radiometric";
import { rockCycleSim } from "./earth/rock-cycle";
import { seasonsSim } from "./earth/seasons";
import { spheresSim } from "./earth/spheres";
import { strataSim } from "./earth/strata";
import { unequalHeatingSim } from "./earth/unequal-heating";
import { waterCycleSim } from "./earth/water-cycle";
import { weatherSim } from "./earth/weather";
import { derivativesSim } from "./math/derivatives";
import { fractionsSim } from "./math/fractions";
import { functionGrapherSim } from "./math/function-grapher";
import { probabilitySim } from "./math/probability";
import { unitCircleSim } from "./math/unit-circle";

/**
 * The simulation registry.
 *
 * Every sim is a self-contained manifest. Adding one to this array is the only
 * wiring required: the catalog, the course library, search, standards
 * filtering, labs, and challenges all read from the manifest.
 */
export const SIMS: AnySim[] = [
  g6a1SystemOrHeap,
  g6a1NestedParts,
  g6a1PartsInStep,
  g6a1OnlyTogether,
  g6a1ScaleLadder,
  g6a2WhereDoesItEnd,
  g6a2SealedOrOpen,
  g6a2InOutAndLeft,
  g6a2FollowTheLunch,
  g6a2DrawTheBoundary,
  g6a3WhyAModel,
  g6a3BoxesAndArrows,
  g6a3TouchItOrRunIt,
  g6a3NotJustSmaller,
  g6a3BuildThePond,
  g6a4InsideTheGeosphere,
  g6a4WhereIsTheWater,
  g6a4ThinnerAndThinner,
  g6a4ThinGreenFilm,
  g6a4OneMoleculeFour,
  g6a4EruptionModel,
  g6a5BeforeYouLight,
  g6a5VariableRoles,
  g6a5ReadItProperly,
  g6a5SwingAndGraph,
  g6a5ClaimEvidence,
  g6a5TwoThingsChanged,
  g6b1CellTheory,
  g6b1FirstLook,
  g6b1OneOrMany,
  g6b1LivingTest,
  g6b1HowSmall,
  g6b2Membrane,
  g6b2CellWall,
  g6b2Nucleus,
  g6b2Mitochondria,
  g6b2Chloroplasts,
  g6b2BuildACell,
  g6b3Hierarchy,
  g6b3SpecialisedCell,
  g6b3TissuePull,
  g6b3BuildAnOrgan,
  g6b3WhichSystem,
  g6b3DownTheLevels,
  g6b4Digestive,
  g6b4Excretory,
  g6b4Circulatory,
  g6b4Respiratory,
  g6b4Muscular,
  g6b4NerveCell,
  g6b5MealToBlood,
  g6b5GasHandover,
  g6b5CatchABall,
  g6b5WaterBalance,
  g6b5Exercise,
  g6b5WhatACellNeeds,
  g6b6Receptors,
  g6b6SignalPath,
  g6b6CostOfChoosing,
  g6b6ReflexVsVoluntary,
  g6b6Memory,
  g6b6CloseTheLoop,
  g6c1MovingOrStored,
  g6c1TwiceTheSpeed,
  g6c1LiftedAndReady,
  g6c1ArmToLight,
  g6c1NothingIsLost,
  g6c1WhereItEndsUp,
  g6c2CutItAgain,
  g6c2HowASmell,
  g6c2SolidLiquidGas,
  g6c2HowFast,
  g6c2SparkAndBath,
  g6c2InsideAThermo,
  g6c3WhichWay,
  g6c3AlongTheRod,
  g6c3WarmAirRises,
  g6c3AcrossTheGap,
  g6c3MetalFeelsColder,
  g6c3MeetingInMiddle,
  g6c4WhichMaterial,
  g6c4HowMuchMatter,
  g6c4FairTestRig,
  g6c4MinuteByMinute,
  g6c4TwoDataSets,
  g6c4DoesItFollow,
  g6c5WhatBlocksHeat,
  g6c5CriteriaOrLimit,
  g6c5BuildTheCup,
  g6c5TestTheCup,
  g6c5TwoDesigns,
  g6c5OneChange,
  circuitsSim,
  collisionsSim,
  electricForceSim,
  emSpectrumSim,
  energySkateSim,
  fieldsSim,
  forcesSim,
  gravitySim,
  heatTransferSim,
  kineticEnergySim,
  magnetismSim,
  motionGraphsSim,
  opticsSim,
  pendulumSim,
  projectileSim,
  soundSim,
  wavesSim,
  buildAtomSim,
  conservationSim,
  gasLawsSim,
  heatingCurveSim,
  moleculesSim,
  periodicTableSim,
  phLabSim,
  reactionsSim,
  statesOfMatterSim,
  artificialSelectionSim,
  bodySystemsSim,
  carbonCycleSim,
  cellSim,
  ecosystemSim,
  foodWebSim,
  fossilRecordSim,
  hereditySim,
  homologySim,
  humanImpactSim,
  mutationsSim,
  naturalSelectionSim,
  neuronSim,
  photosynthesisSim,
  pollinationSim,
  symbiosisSim,
  atmosphereSim,
  circulationSim,
  erosionSim,
  frontsSim,
  moonPhasesSim,
  plateTectonicsSim,
  radiometricSim,
  rockCycleSim,
  seasonsSim,
  spheresSim,
  strataSim,
  unequalHeatingSim,
  waterCycleSim,
  weatherSim,
  derivativesSim,
  fractionsSim,
  functionGrapherSim,
  probabilitySim,
  unitCircleSim,
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
