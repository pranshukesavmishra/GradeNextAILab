import type { AnySim, GradeBand, Subject } from "@engine/types";
import {
  g6a1SystemOrHeap, g6a1NestedParts, g6a1PartsInStep, g6a1OnlyTogether, g6a1ScaleLadder,
} from "./topics/g6a1";
import {
  g6a2WhereDoesItEnd, g6a2SealedOrOpen, g6a2InOutAndLeft, g6a2FollowTheLunch,
  g6a2DrawTheBoundary,
} from "./topics/g6a2";
import {
  g6a3WhyAModel, g6a3BoxesAndArrows, g6a3TouchItOrRunIt, g6a3NotJustSmaller, g6a3BuildThePond,
} from "./topics/g6a3";
import {
  g6a4InsideTheGeosphere, g6a4WhereIsTheWater, g6a4ThinnerAndThinner, g6a4ThinGreenFilm,
  g6a4OneMoleculeFour, g6a4EruptionModel,
} from "./topics/g6a4";
import {
  g6a5BeforeYouLight, g6a5VariableRoles, g6a5ReadItProperly, g6a5SwingAndGraph,
  g6a5ClaimEvidence, g6a5TwoThingsChanged,
} from "./topics/g6a5";
import {
  g6b1CellTheory, g6b1FirstLook, g6b1OneOrMany, g6b1LivingTest, g6b1HowSmall,
} from "./topics/g6b1";
import {
  g6b2Membrane, g6b2CellWall, g6b2Nucleus, g6b2Mitochondria, g6b2Chloroplasts, g6b2BuildACell,
} from "./topics/g6b2";
import {
  g6b3Hierarchy, g6b3SpecialisedCell, g6b3TissuePull, g6b3BuildAnOrgan, g6b3WhichSystem,
  g6b3DownTheLevels,
} from "./topics/g6b3";
import {
  g6b4Digestive, g6b4Excretory, g6b4Circulatory, g6b4Respiratory, g6b4Muscular, g6b4NerveCell,
} from "./topics/g6b4";
import {
  g6b5MealToBlood, g6b5GasHandover, g6b5CatchABall, g6b5WaterBalance, g6b5Exercise,
  g6b5WhatACellNeeds,
} from "./topics/g6b5";
import {
  g6b6Receptors, g6b6SignalPath, g6b6CostOfChoosing, g6b6ReflexVsVoluntary, g6b6Memory,
  g6b6CloseTheLoop,
} from "./topics/g6b6";
import {
  g6c1MovingOrStored, g6c1TwiceTheSpeed, g6c1LiftedAndReady, g6c1ArmToLight, g6c1NothingIsLost,
  g6c1WhereItEndsUp,
} from "./topics/g6c1";
import {
  g6c2CutItAgain, g6c2HowASmell, g6c2SolidLiquidGas, g6c2HowFast, g6c2SparkAndBath,
  g6c2InsideAThermo,
} from "./topics/g6c2";
import {
  g6c3WhichWay, g6c3AlongTheRod, g6c3WarmAirRises, g6c3AcrossTheGap, g6c3MetalFeelsColder,
  g6c3MeetingInMiddle,
} from "./topics/g6c3";
import {
  g6c4WhichMaterial, g6c4HowMuchMatter, g6c4FairTestRig, g6c4MinuteByMinute, g6c4TwoDataSets,
  g6c4DoesItFollow,
} from "./topics/g6c4";
import {
  g6c5WhatBlocksHeat, g6c5CriteriaOrLimit, g6c5BuildTheCup, g6c5TestTheCup, g6c5TwoDesigns,
  g6c5OneChange,
} from "./topics/g6c5";
import {
  g6d1WhereTheWaterIs, g6d1IntoTheAirAndBack, g6d1MeadowOrCarPark, g6d1ThroughTheTree,
  g6d1SunLiftsGravityDrops, g6d1HowLongItStays,
} from "./topics/g6d1";
import {
  g6d2WhatAirIsMadeOf, g6d2FiveFloorsUp, g6d2TenTonnesAbove, g6d2PickTwoGetTheThird,
  g6d2WhyWarmAirRises,
} from "./topics/g6d2";
import {
  g6d3ThreeScalesOneBulb, g6d3AColumnOfMercury, g6d3TwoThermometersOneWet, g6d3WhatFallsAndWhy,
  g6d3FourTimesTheSpeed, g6d3BuildTheStation,
} from "./topics/g6d3";
import {
  g6d4WhereTheAirWasBorn, g6d4SinkingOrRising, g6d4TheColdFrontPasses, g6d4ARampOneInTwoHundred,
  g6d4TheEndOfALow, g6d4TrackingItAcrossTheState,
} from "./topics/g6d4";
import {
  g6d5SpreadThin, g6d5SandAndSea, g6d5SixAndAHalfPerKilometre, g6d5WhatTheGroundSendsBack,
  g6d5TheAfternoonLag,
} from "./topics/g6d5";
import {
  g6d6TwentyDegreesApart, g6d6TheGreyLid, g6d6OverTheSierra, g6d6HowDryIsDry,
  g6d6TheOceansFlywheel, g6d6OneParcelAcrossCalifornia,
} from "./topics/g6d6";
import {
  g6e1TodayOrAlways, g6e1ThirtyYears, g6e1ReadingAClimograph, g6e1BeltsOnTheMap, g6e1WhichZone,
} from "./topics/g6e1";
import {
  g6e2SlantingSunlight, g6e2ThreeCells, g6e2TheLongThrow, g6e2AroundTheGyre,
  g6e2WhatMakesItSink, g6e2MovingTheSurplus,
} from "./topics/g6e2";
import {
  g6e3SignalOrNot, g6e3HowManySurvive, g6e3InsideAGrain, g6e3AntherToSeed, g6e3HowFarCarried,
} from "./topics/g6e3";
import {
  g6e4HowMuchLight, g6e4OneThingAtATime, g6e4SamePotSameSun, g6e4ShortestStave,
  g6e4GenesOrGarden,
} from "./topics/g6e4";
import {
  g6e5HalfFromEach, g6e5EightMillion, g6e5OneParentOrTwo, g6e5CopiedLetterForLetter,
  g6e5SpeedOrVariety,
} from "./topics/g6e5";
import {
  g6e6WhatAGeneIs, g6e6TwinsAndSiblings, g6e6ThreeShuffles, g6e6AlmostPerfect,
  g6e6BuildTheCross, g6e6PunnettSquare,
} from "./topics/g6e6";
import {
  g6f1FiveSpheres, g6f1InAndOut, g6f1BlanketOfAir, g6f1LoopsBothWays, g6f1OneCarbonAtom,
} from "./topics/g6f1";
import {
  g6f2ReadingTheIce, g6f2RingsAndBands, g6f2ThermometerRecord, g6f2RisingWater,
  g6f2KeelingCurve, g6f2ManyWitnesses,
} from "./topics/g6f2";
import {
  g6f3WhichGasesTrap, g6f3BurningAndBaking, g6f3ForestToBurger, g6f3SunOrUs, g6f3HowFastIsFast,
} from "./topics/g6f3";
import {
  g6f4TwoThingsTogether, g6f4WhereYouStart, g6f4WhichCameFirst, g6f4SixFingerprints,
  g6f4TooMuchTooLittle,
} from "./topics/g6f4";
import {
  g6f5DegreeHeatingWeeks, g6f5AMonthOfFasting, g6f5CountingTheHeat, g6f5MovingNorth,
  g6f5BuiltForAColderWorld,
} from "./topics/g6f5";
import {
  g6f6HowWeWatch, g6f6CauseOrHarm, g6f6AProblemWorthSolving, g6f6WhatMattersMost,
  g6f6FactOrJudgement,
} from "./topics/g6f6";
import {
  g7a1ThreeArrangements, g7a1WhenSpheresFail, g7a1JigglingGrain, g7a1OnePieceOfWater,
  g7a1DownToTheAtom,
} from "./topics/g7a1";
import {
  g7a2ThreeParticles, g7a2ProtonsDecide, g7a2SameElement, g7a2ThroughTheFoil, g7a2ShellsToCloud,
  g7a2TwoModels,
} from "./topics/g7a2";
import {
  g7a3ReadingACell, g7a3TheSawtooth, g7a3ThreeFamilies, g7a3TheGaps, g7a3DownTheGroup,
} from "./topics/g7a3";
import {
  g7a4FixedOrFree, g7a4WhatCh4Says, g7a4TwoOrTwice, g7a4InsideBrackets, g7a4BuildAWater,
} from "./topics/g7a4";
import {
  g7a5BallsAndSticks, g7a5SwellThemUp, g7a5NoSingleMolecule, g7a5MeltingTwoWays, g7a5RightModel,
} from "./topics/g7a5";
import {
  g7b1SameMoleculeNewForm, g7b1AtomsRearranged, g7b1EasyToConfuse, g7b1BeforeAndAfter,
  g7b1PuttingItBack,
} from "./topics/g7b1";
import {
  g7b2BuildTheEvidence, g7b2MassThatLeft, g7b2TheWhitePowder, g7b2LooksCanLie,
  g7b2NameThatReaction,
} from "./topics/g7b2";
import {
  g7b3SealedAndWeighed, g7b3StopperOnStopperOff, g7b3CountBothSides, g7b3NowhereToGo,
  g7b3CouldThatBeRight,
} from "./topics/g7b3";
import {
  g7b4HowFastAreThey, g7b4HowHardToPullApart, g7b4TheFlatParts, g7b4StuckAtAHundred,
  g7b4TheOtherLiquid,
} from "./topics/g7b4";
import {
  g7b5OilToBag, g7b5RockToGirder, g7b5WhereDidItStart, g7b5TheBottleBargain, g7b5TwoShirts,
} from "./topics/g7b5";
import {
  g7b6TargetOrLimit, g7b6WarmPackColdPack, g7b6HowHotDoesItGet, g7b6HoldingTheHeat,
  g7b6TheWriteUp,
} from "./topics/g7b6";
import {
  g7c1WhatGoesIn, g7c1WhatComesOut, g7c1InsideAChloroplast, g7c1SameAtomsNewArrangement,
  g7c1CountingBubbles,
} from "./topics/g7c1";
import {
  g7c2SoilOrAir, g7c2FiveYearWillow, g7c2FiftySevenGrams, g7c2WeighingTheWood,
  g7c2ShownOrAssumed,
} from "./topics/g7c2";
import {
  g7c3HowMuchAir, g7c3ThreeTests, g7c3InsideAMitochondrion, g7c3TwoOrganelles, g7c3ALeafAllDay,
} from "./topics/g7c3";
import {
  g7c4OneSpoonful, g7c4AtomInventory, g7c4BondsCostBondsPay, g7c4FlameOrCell,
  g7c4ADifferentFuel,
} from "./topics/g7c4";
import {
  g7c5IntoTheLeaf, g7c5Eaten, g7c5BackToTheAir, g7c5WhichProcess, g7c5WhyBoth,
} from "./topics/g7c5";
import {
  g7d1RunsOutFirst, g7d1WhereItLevels, g7d1StMatthew, g7d1TheDrySummer, g7d1SameFoodBowl,
} from "./topics/g7d1";
import {
  g7d2ThreeJobs, g7d2BuildTheWeb, g7d2FiveFloors, g7d2TenthOfATenth, g7d2SilverSprings,
} from "./topics/g7d2";
import {
  g7d3OneCarbonAtom, g7d3LitterBag, g7d3FastAndSlow, g7d3BreakingN2, g7d3CyclesAndFlows,
} from "./topics/g7d3";
import {
  g7d4WolvesAndMoose, g7d4WhoGains, g7d4SameDealTwice, g7d4WhenItTurns, g7d4TenYearRhythm,
} from "./topics/g7d4";
import {
  g7d5HowLongToHeal, g7d5MusselArithmetic, g7d5WhatTookTheCod, g7d5GlacierBay, g7d5HubbardBrook,
} from "./topics/g7d5";
import {
  g7d6WhatItDoesForUs, g7d6HalfTheForest, g7d6FiveKindsOfFix, g7d6DamOrLadder,
  g7d6FourteenWolves,
} from "./topics/g7d6";
import {
  g7e1SlowCoolBigCrystals, g7e1GrainToStone, g7e1SqueezedNotMelted, g7e1NameThatRock,
  g7e1TwoEngines,
} from "./topics/g7e1";
import {
  g7e2BreakItSmaller, g7e2RainIsAnAcid, g7e2WhoMovedIt, g7e2HowFarBeforeItSettles,
  g7e2MakingSoil,
} from "./topics/g7e2";
import {
  g7e3OneMorningInMay, g7e3MillimetresAddUp, g7e3ReadTheColumn, g7e3SlowThenSudden, g7e3ZoomOut,
} from "./topics/g7e3";
import {
  g7e4PutItBackTogether, g7e4CouldItHaveSwum, g7e4StripesAndAges, g7e4MeasuredBySatellite,
  g7e4OpeningAnOcean,
} from "./topics/g7e4";
import {
  g7e5TearingAContinent, g7e5GoingUnder, g7e5StuckThenSlipping, g7e5WhyHere,
  g7e5NameTheBoundary,
} from "./topics/g7e5";
import {
  g7e6HowItGotConcentrated, g7e6PerKilogram, g7e6HowFastDoesItFlow, g7e6ATankfulOfSunlight,
  g7e6CopperUnderTheAndes,
} from "./topics/g7e6";
import {
  g7f1WhatDrivesIt, g7f1RiverInTheSky, g7f1AcrossThePacific, g7f1TheGoldenState,
  g7f1HowFarHowLong,
} from "./topics/g7f1";
import {
  g7f2TenTimesRarer, g7f2TheHundredYear, g7f2WhichZone, g7f2BeatTheSWave, g7f2DataToDecision,
} from "./topics/g7f2";
import {
  g7f3WishOrTarget, g7f3PullAndFence, g7f3WhoIsInside, g7f3SofterButWider, g7f3WritingTheBrief,
} from "./topics/g7f3";
import {
  g7f4ThreeWaysToWin, g7f4WhatDoYouValue, g7f4SameTableTwoRuns, g7f4BestOfEach,
  g7f4MakingTheCase,
} from "./topics/g7f4";
import {
  g7f5ShrinkItProperly, g7f5FindThePeak, g7f5RoundOneRoundTwo, g7f5WhatDidItCost,
  g7f5WhenToStop,
} from "./topics/g7f5";
import {
  g8a1AroundTheBlock, g8a1SizeOrArrow, g8a1SlopeIsSpeed, g8a1WhoIsMoving, g8a1WholeJourney,
} from "./topics/g8a1";
import {
  g8a2HowQuicklyChanged, g8a2SlopeAndArea, g8a2SteadyOrFading, g8a2ThirtyMetresLate,
  g8a2TwoGraphsOneCar,
} from "./topics/g8a2";
import {
  g8a3FiftyNewtonsEach, g8a3DoTheyCancel, g8a3EveryArrow, g8a3TakeFrictionAway, g8a3TheBusStops,
} from "./topics/g8a3";
import {
  g8a4ThreeKindsOfVariable, g8a4ForceOverMass, g8a4FiveRuns, g8a4WhyItCameUpShort,
  g8a4WritingItUp,
} from "./topics/g8a4";
import {
  g8a5PartnerOrNot, g8a5OneForceEach, g8a5SoNothingMoves, g8a5StretchTheStop,
  g8a5AgainstTheLimit,
} from "./topics/g8a5";
import {
  g8a6MustOrMay, g8a6LongerToCrush, g8a6WhatCouldWork, g8a6TwoNosesScored,
  g8a6TheRecommendation,
} from "./topics/g8a6";
import {
  g8b1LoadTheTrolley, g8b1RollItFaster, g8b1OneFourNine, g8b1ReadingTheCurve,
  g8b1ThirtyAndSixty,
} from "./topics/g8b1";
import {
  g8b2LiftItAndHold, g8b2StretchAndStore, g8b2WhoseEnergyIsIt, g8b2TenCentimetresMore,
  g8b2SwingAndTrade,
} from "./topics/g8b2";
import {
  g8b3TwoCartsOneClick, g8b3SteelAndClay, g8b3ThroughTheCrash, g8b3BuyYourselfAMetre,
  g8b3KeptOrConverted,
} from "./topics/g8b3";
import {
  g8b4CloseTheBox, g8b4WaterToWallSocket, g8b4SpreadNotGone, g8b4BounceAfterBounce,
  g8b4DoesItAddUp,
} from "./topics/g8b4";
import {
  g8b5BuildTheDropRig, g8b5RoundOne, g8b5WhatTheDataSaid, g8b5SafeOrSmall, g8b5TwoLayers,
} from "./topics/g8b5";
/* TEMP-G7E-VERIFY-START */
/* TEMP-G7E-VERIFY-END */
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
  g6d1WhereTheWaterIs,
  g6d1IntoTheAirAndBack,
  g6d1MeadowOrCarPark,
  g6d1ThroughTheTree,
  g6d1SunLiftsGravityDrops,
  g6d1HowLongItStays,
  g6d2WhatAirIsMadeOf,
  g6d2FiveFloorsUp,
  g6d2TenTonnesAbove,
  g6d2PickTwoGetTheThird,
  g6d2WhyWarmAirRises,
  g6d3ThreeScalesOneBulb,
  g6d3AColumnOfMercury,
  g6d3TwoThermometersOneWet,
  g6d3WhatFallsAndWhy,
  g6d3FourTimesTheSpeed,
  g6d3BuildTheStation,
  g6d4WhereTheAirWasBorn,
  g6d4SinkingOrRising,
  g6d4TheColdFrontPasses,
  g6d4ARampOneInTwoHundred,
  g6d4TheEndOfALow,
  g6d4TrackingItAcrossTheState,
  g6d5SpreadThin,
  g6d5SandAndSea,
  g6d5SixAndAHalfPerKilometre,
  g6d5WhatTheGroundSendsBack,
  g6d5TheAfternoonLag,
  g6d6TwentyDegreesApart,
  g6d6TheGreyLid,
  g6d6OverTheSierra,
  g6d6HowDryIsDry,
  g6d6TheOceansFlywheel,
  g6d6OneParcelAcrossCalifornia,
  g6e1TodayOrAlways,
  g6e1ThirtyYears,
  g6e1ReadingAClimograph,
  g6e1BeltsOnTheMap,
  g6e1WhichZone,
  g6e2SlantingSunlight,
  g6e2ThreeCells,
  g6e2TheLongThrow,
  g6e2AroundTheGyre,
  g6e2WhatMakesItSink,
  g6e2MovingTheSurplus,
  g6e3SignalOrNot,
  g6e3HowManySurvive,
  g6e3InsideAGrain,
  g6e3AntherToSeed,
  g6e3HowFarCarried,
  g6e4HowMuchLight,
  g6e4OneThingAtATime,
  g6e4SamePotSameSun,
  g6e4ShortestStave,
  g6e4GenesOrGarden,
  g6e5HalfFromEach,
  g6e5EightMillion,
  g6e5OneParentOrTwo,
  g6e5CopiedLetterForLetter,
  g6e5SpeedOrVariety,
  g6e6WhatAGeneIs,
  g6e6TwinsAndSiblings,
  g6e6ThreeShuffles,
  g6e6AlmostPerfect,
  g6e6BuildTheCross,
  g6e6PunnettSquare,
  g6f1FiveSpheres,
  g6f1InAndOut,
  g6f1BlanketOfAir,
  g6f1LoopsBothWays,
  g6f1OneCarbonAtom,
  g6f2ReadingTheIce,
  g6f2RingsAndBands,
  g6f2ThermometerRecord,
  g6f2RisingWater,
  g6f2KeelingCurve,
  g6f2ManyWitnesses,
  g6f3WhichGasesTrap,
  g6f3BurningAndBaking,
  g6f3ForestToBurger,
  g6f3SunOrUs,
  g6f3HowFastIsFast,
  g6f4TwoThingsTogether,
  g6f4WhereYouStart,
  g6f4WhichCameFirst,
  g6f4SixFingerprints,
  g6f4TooMuchTooLittle,
  g6f5DegreeHeatingWeeks,
  g6f5AMonthOfFasting,
  g6f5CountingTheHeat,
  g6f5MovingNorth,
  g6f5BuiltForAColderWorld,
  g6f6HowWeWatch,
  g6f6CauseOrHarm,
  g6f6AProblemWorthSolving,
  g6f6WhatMattersMost,
  g6f6FactOrJudgement,
  g7a1ThreeArrangements,
  g7a1WhenSpheresFail,
  g7a1JigglingGrain,
  g7a1OnePieceOfWater,
  g7a1DownToTheAtom,
  g7a2ThreeParticles,
  g7a2ProtonsDecide,
  g7a2SameElement,
  g7a2ThroughTheFoil,
  g7a2ShellsToCloud,
  g7a2TwoModels,
  g7a3ReadingACell,
  g7a3TheSawtooth,
  g7a3ThreeFamilies,
  g7a3TheGaps,
  g7a3DownTheGroup,
  g7a4FixedOrFree,
  g7a4WhatCh4Says,
  g7a4TwoOrTwice,
  g7a4InsideBrackets,
  g7a4BuildAWater,
  g7a5BallsAndSticks,
  g7a5SwellThemUp,
  g7a5NoSingleMolecule,
  g7a5MeltingTwoWays,
  g7a5RightModel,
  g7b1SameMoleculeNewForm,
  g7b1AtomsRearranged,
  g7b1EasyToConfuse,
  g7b1BeforeAndAfter,
  g7b1PuttingItBack,
  g7b2BuildTheEvidence,
  g7b2MassThatLeft,
  g7b2TheWhitePowder,
  g7b2LooksCanLie,
  g7b2NameThatReaction,
  g7b3SealedAndWeighed,
  g7b3StopperOnStopperOff,
  g7b3CountBothSides,
  g7b3NowhereToGo,
  g7b3CouldThatBeRight,
  g7b4HowFastAreThey,
  g7b4HowHardToPullApart,
  g7b4TheFlatParts,
  g7b4StuckAtAHundred,
  g7b4TheOtherLiquid,
  g7b5OilToBag,
  g7b5RockToGirder,
  g7b5WhereDidItStart,
  g7b5TheBottleBargain,
  g7b5TwoShirts,
  g7b6TargetOrLimit,
  g7b6WarmPackColdPack,
  g7b6HowHotDoesItGet,
  g7b6HoldingTheHeat,
  g7b6TheWriteUp,
  g7c1WhatGoesIn,
  g7c1WhatComesOut,
  g7c1InsideAChloroplast,
  g7c1SameAtomsNewArrangement,
  g7c1CountingBubbles,
  g7c2SoilOrAir,
  g7c2FiveYearWillow,
  g7c2FiftySevenGrams,
  g7c2WeighingTheWood,
  g7c2ShownOrAssumed,
  g7c3HowMuchAir,
  g7c3ThreeTests,
  g7c3InsideAMitochondrion,
  g7c3TwoOrganelles,
  g7c3ALeafAllDay,
  g7c4OneSpoonful,
  g7c4AtomInventory,
  g7c4BondsCostBondsPay,
  g7c4FlameOrCell,
  g7c4ADifferentFuel,
  g7c5IntoTheLeaf,
  g7c5Eaten,
  g7c5BackToTheAir,
  g7c5WhichProcess,
  g7c5WhyBoth,
  g7d1RunsOutFirst,
  g7d1WhereItLevels,
  g7d1StMatthew,
  g7d1TheDrySummer,
  g7d1SameFoodBowl,
  g7d2ThreeJobs,
  g7d2BuildTheWeb,
  g7d2FiveFloors,
  g7d2TenthOfATenth,
  g7d2SilverSprings,
  g7d3OneCarbonAtom,
  g7d3LitterBag,
  g7d3FastAndSlow,
  g7d3BreakingN2,
  g7d3CyclesAndFlows,
  g7d4WolvesAndMoose,
  g7d4WhoGains,
  g7d4SameDealTwice,
  g7d4WhenItTurns,
  g7d4TenYearRhythm,
  g7d5HowLongToHeal,
  g7d5MusselArithmetic,
  g7d5WhatTookTheCod,
  g7d5GlacierBay,
  g7d5HubbardBrook,
  g7d6WhatItDoesForUs,
  g7d6HalfTheForest,
  g7d6FiveKindsOfFix,
  g7d6DamOrLadder,
  g7d6FourteenWolves,
  g7e1SlowCoolBigCrystals,
  g7e1GrainToStone,
  g7e1SqueezedNotMelted,
  g7e1NameThatRock,
  g7e1TwoEngines,
  g7e2BreakItSmaller,
  g7e2RainIsAnAcid,
  g7e2WhoMovedIt,
  g7e2HowFarBeforeItSettles,
  g7e2MakingSoil,
  g7e3OneMorningInMay,
  g7e3MillimetresAddUp,
  g7e3ReadTheColumn,
  g7e3SlowThenSudden,
  g7e3ZoomOut,
  g7e4PutItBackTogether,
  g7e4CouldItHaveSwum,
  g7e4StripesAndAges,
  g7e4MeasuredBySatellite,
  g7e4OpeningAnOcean,
  g7e5TearingAContinent,
  g7e5GoingUnder,
  g7e5StuckThenSlipping,
  g7e5WhyHere,
  g7e5NameTheBoundary,
  g7e6HowItGotConcentrated,
  g7e6PerKilogram,
  g7e6HowFastDoesItFlow,
  g7e6ATankfulOfSunlight,
  g7e6CopperUnderTheAndes,
  g7f1WhatDrivesIt,
  g7f1RiverInTheSky,
  g7f1AcrossThePacific,
  g7f1TheGoldenState,
  g7f1HowFarHowLong,
  g7f2TenTimesRarer,
  g7f2TheHundredYear,
  g7f2WhichZone,
  g7f2BeatTheSWave,
  g7f2DataToDecision,
  g7f3WishOrTarget,
  g7f3PullAndFence,
  g7f3WhoIsInside,
  g7f3SofterButWider,
  g7f3WritingTheBrief,
  g7f4ThreeWaysToWin,
  g7f4WhatDoYouValue,
  g7f4SameTableTwoRuns,
  g7f4BestOfEach,
  g7f4MakingTheCase,
  g7f5ShrinkItProperly,
  g7f5FindThePeak,
  g7f5RoundOneRoundTwo,
  g7f5WhatDidItCost,
  g7f5WhenToStop,
  g8a1AroundTheBlock,
  g8a1SizeOrArrow,
  g8a1SlopeIsSpeed,
  g8a1WhoIsMoving,
  g8a1WholeJourney,
  g8a2HowQuicklyChanged,
  g8a2SlopeAndArea,
  g8a2SteadyOrFading,
  g8a2ThirtyMetresLate,
  g8a2TwoGraphsOneCar,
  g8a3FiftyNewtonsEach,
  g8a3DoTheyCancel,
  g8a3EveryArrow,
  g8a3TakeFrictionAway,
  g8a3TheBusStops,
  g8a4ThreeKindsOfVariable,
  g8a4ForceOverMass,
  g8a4FiveRuns,
  g8a4WhyItCameUpShort,
  g8a4WritingItUp,
  g8a5PartnerOrNot,
  g8a5OneForceEach,
  g8a5SoNothingMoves,
  g8a5StretchTheStop,
  g8a5AgainstTheLimit,
  g8a6MustOrMay,
  g8a6LongerToCrush,
  g8a6WhatCouldWork,
  g8a6TwoNosesScored,
  g8a6TheRecommendation,
  g8b1LoadTheTrolley,
  g8b1RollItFaster,
  g8b1OneFourNine,
  g8b1ReadingTheCurve,
  g8b1ThirtyAndSixty,
  g8b2LiftItAndHold,
  g8b2StretchAndStore,
  g8b2WhoseEnergyIsIt,
  g8b2TenCentimetresMore,
  g8b2SwingAndTrade,
  g8b3TwoCartsOneClick,
  g8b3SteelAndClay,
  g8b3ThroughTheCrash,
  g8b3BuyYourselfAMetre,
  g8b3KeptOrConverted,
  g8b4CloseTheBox,
  g8b4WaterToWallSocket,
  g8b4SpreadNotGone,
  g8b4BounceAfterBounce,
  g8b4DoesItAddUp,
  g8b5BuildTheDropRig,
  g8b5RoundOne,
  g8b5WhatTheDataSaid,
  g8b5SafeOrSmall,
  g8b5TwoLayers,
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
