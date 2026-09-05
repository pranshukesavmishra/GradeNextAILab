import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { readItRightSim } from "./a5-3-read-it-right";

/**
 * Science gate for G6-A5.3 "Read It Right: The Metrology Bench".
 *
 * The spec's honesty rule is that every instrument is mechanical, not a
 * lookup: the balance is a real torque sum a student must zero, the cylinder
 * distorts by a genuine parallax projection, and the caliper's only lesson is
 * resolution. The checker must fail a reading for the wrong unit outright, for
 * too many or too few claimed digits, and for sitting outside half a division
 * — and must never accept a bare, unit-less, pre-formatted number.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(readItRightSim.params), ...overrides };
}

function runFor(params: ParamValues, seconds: number, seed = "a5-3") {
  const runner = new SimRunner({ manifest: readItRightSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.ceil(seconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "a5-3") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * The balance: a real torque sum, not a lookup
 * ================================================================== */

describe("the triple-beam balance settles only when riders match the true load", () => {
  it("with no trim and no tilt, matching the pebble's true mass settles the beam", () => {
    const f = factsAfter({ instrument: "balance", specimen: "pebble", riderMiddle: 0.02, riderFront: 0.00432 }, 6);
    expect(f.settled).toBe(true);
    expect(Math.abs(f.errorG as number)).toBeLessThan(0.01);
  });

  it("riders left at zero never settle against a real specimen", () => {
    const f = factsAfter({ instrument: "balance", specimen: "pebble" }, 6);
    expect(f.settled).toBe(false);
  });

  it("a positive zero-trim biases every reading high by exactly the trim", () => {
    const untrimmed = factsAfter({ instrument: "balance", specimen: "cube", riderRear: 0, riderMiddle: 0.02, riderFront: 0.0016 }, 6);
    const trimmed = factsAfter({ instrument: "balance", specimen: "cube", zeroTrim: 0.00035, riderRear: 0, riderMiddle: 0.02, riderFront: 0.0016 + 0.00035 }, 6);
    expect(untrimmed.settled).toBe(true);
    expect(trimmed.settled).toBe(true);
    expect(trimmed.targetG as number).toBeCloseTo((untrimmed.targetG as number) + 0.35, 6);
  });

  it("bench tilt biases the target proportionally, and zero tilt does not", () => {
    const level = factsAfter({ instrument: "balance", specimen: "cube", benchTilt: 0 }, 1);
    const tilted = factsAfter({ instrument: "balance", specimen: "cube", benchTilt: 0.0349 }, 1);
    expect(tilted.targetG as number).toBeGreaterThan(level.targetG as number);
  });
});

/* ================================================================== *
 * The digital balance: tare and drift are real, separate mechanisms
 * ================================================================== */

describe("the digital balance needs a tare, and drifts with tilt", () => {
  it("the checker always targets the true mass, tare and tilt notwithstanding", () => {
    const tared = factsAfter({ instrument: "digitalBalance", specimen: "cube", digitalTared: true, benchTilt: 0.0349 }, 1);
    expect((tared.trueValueSI as number) * 1000).toBeCloseTo(21.60, 6);
  });

  it("untared, an uncounted mass sits on the apparent display, not the true value", () => {
    const tared = factsAfter({ instrument: "digitalBalance", specimen: "cube", digitalTared: true }, 1);
    const untared = factsAfter({ instrument: "digitalBalance", specimen: "cube", digitalTared: false }, 1);
    expect((untared.apparentDigitalMassG as number) - (tared.apparentDigitalMassG as number)).toBeCloseTo(0.44, 6);
    expect(untared.trueValueSI).toBeCloseTo(tared.trueValueSI as number, 9);
  });

  it("tilt drifts the apparent digital display by about 0.02 g at full tilt", () => {
    const level = factsAfter({ instrument: "digitalBalance", specimen: "cube", benchTilt: 0 }, 1);
    const tilted = factsAfter({ instrument: "digitalBalance", specimen: "cube", benchTilt: 0.0349 }, 1);
    expect((tilted.apparentDigitalMassG as number) - (level.apparentDigitalMassG as number)).toBeCloseTo(0.02, 2);
  });

  it("a student who copies the untared display instead of the true mass fails the check", () => {
    const f = factsAfter({
      instrument: "digitalBalance", specimen: "cube", digitalTared: false,
      studentValue: 22.04, studentUnit: "g", studentDecimals: 2,
    }, 1);
    expect(f.apparentDigitalMassG as number).toBeCloseTo(22.04, 2);
    expect(f.passed).toBe(false);
  });
});

/* ================================================================== *
 * The cylinder: a genuine parallax projection
 * ================================================================== */

describe("the cylinder's apparent reading is a real geometric projection", () => {
  it("level with the meniscus, apparent equals true exactly", () => {
    const f = factsAfter({ instrument: "cylinder", liquidVolume: 45e-6, eyeLevel: 0 }, 1);
    expect(f.parallaxErrorMl as number).toBeCloseTo(0, 9);
  });

  it("from above, the same true volume reads higher — the spec's 45-reads-47 case", () => {
    const f = factsAfter({ instrument: "cylinder", liquidVolume: 45e-6, eyeLevel: 0.10 }, 1);
    expect(f.trueVolumeMl as number).toBeCloseTo(45, 6);
    expect(f.apparentVolumeMl as number).toBeCloseTo(47, 6);
  });

  it("from below, it reads lower by the same mechanism, mirrored", () => {
    const f = factsAfter({ instrument: "cylinder", liquidVolume: 45e-6, eyeLevel: -0.10 }, 1);
    expect(f.apparentVolumeMl as number).toBeCloseTo(43, 6);
  });

  it("submerging the specimen adds exactly its true volume by displacement", () => {
    const dry = factsAfter({ instrument: "cylinder", specimen: "cube", liquidVolume: 40e-6, objectSubmerged: false, eyeLevel: 0 }, 1);
    const wet = factsAfter({ instrument: "cylinder", specimen: "cube", liquidVolume: 40e-6, objectSubmerged: true, eyeLevel: 0 }, 1);
    expect((wet.trueVolumeMl as number) - (dry.trueVolumeMl as number)).toBeCloseTo(8.0, 6); // the cube's true 8.000 cm3
  });
});

/* ================================================================== *
 * The caliper and the rule: resolution vs a real zero error
 * ================================================================== */

describe("the caliper reads the true width; the worn rule does not", () => {
  it("the caliper's true reading is exact, whatever the specimen", () => {
    const f = factsAfter({ instrument: "caliper", specimen: "bolt" }, 1);
    expect(f.trueValueSI as number).toBeCloseTo(0.01185, 6);
  });

  it("the checker always wants the true width, whichever rule is on the bench", () => {
    const steel = factsAfter({ instrument: "rule", specimen: "bolt", ruleType: "steel" }, 1);
    const plastic = factsAfter({ instrument: "rule", specimen: "bolt", ruleType: "plastic" }, 1);
    expect((steel.trueValueSI as number) * 1000).toBeCloseTo(11.85, 6);
    expect(plastic.trueValueSI).toBeCloseTo(steel.trueValueSI as number, 9);
  });

  it("but the plastic rule's own zero mark reads apparently short by its worn offset", () => {
    const steel = factsAfter({ instrument: "rule", specimen: "bolt", ruleType: "steel" }, 1);
    const plastic = factsAfter({ instrument: "rule", specimen: "bolt", ruleType: "plastic" }, 1);
    expect(steel.apparentRuleMm).toBeCloseTo(11.85, 6);
    expect(((steel.apparentRuleMm as number) - (plastic.apparentRuleMm as number))).toBeCloseTo(2.0, 6);
  });

  it("trusting the plastic rule's own zero mark instead of the true width fails the check", () => {
    const f = factsAfter({
      instrument: "rule", specimen: "bolt", ruleType: "plastic",
      studentValue: 9.9, studentUnit: "mm", studentDecimals: 1,
    }, 1);
    expect(f.apparentRuleMm as number).toBeCloseTo(9.85, 1);
    expect(f.passed).toBe(false);
  });
});

/* ================================================================== *
 * The thermometer: a real lag, and it reads air unless immersed
 * ================================================================== */

describe("the thermometer takes real time to respond, and reads air unless immersed", () => {
  it("unimmersed, it settles on room air, not the specimen", () => {
    const f = factsAfter({ instrument: "thermometer", thermometerImmersed: false }, 90);
    expect(f.thermoC as number).toBeCloseTo(19.8, 1);
  });

  it("immersed, it settles on the specimen's true temperature instead", () => {
    const f = factsAfter({ instrument: "thermometer", thermometerImmersed: true }, 90);
    expect(f.thermoC as number).toBeCloseTo(21.4, 1);
  });

  it("early in the run it has not gotten there yet — the lag is real", () => {
    const early = factsAfter({ instrument: "thermometer", thermometerImmersed: true }, 2);
    const late = factsAfter({ instrument: "thermometer", thermometerImmersed: true }, 90);
    expect(Math.abs((early.thermoC as number) - 21.4)).toBeGreaterThan(Math.abs((late.thermoC as number) - 21.4));
  });
});

/* ================================================================== *
 * The checker: wrong unit fails outright; digits are counted, not guessed
 * ================================================================== */

describe("the reading checker enforces tolerance, unit kind and digit count together", () => {
  it("a perfect mass reading in grams, at the right precision, passes", () => {
    const f = factsAfter({ instrument: "balance", specimen: "cube", studentValue: 21.60, studentUnit: "g", studentDecimals: 2 }, 1);
    expect(f.passed).toBe(true);
  });

  it("the identical number in the wrong unit kind fails outright", () => {
    const f = factsAfter({ instrument: "balance", specimen: "cube", studentValue: 21.60, studentUnit: "mm", studentDecimals: 2 }, 1);
    expect(f.correctUnitKind).toBe(false);
    expect(f.passed).toBe(false);
  });

  it("a correctly converted unit still passes tolerance", () => {
    const f = factsAfter({ instrument: "balance", specimen: "cube", studentValue: 0.02160, studentUnit: "kg", studentDecimals: 2 }, 1);
    expect(f.withinTolerance).toBe(true);
    expect(f.correctUnitKind).toBe(true);
  });

  it("too many digits fails the significant-figures check even though the value is exact", () => {
    const f = factsAfter({ instrument: "balance", specimen: "cube", studentValue: 21.6000, studentUnit: "g", studentDecimals: 4 }, 1);
    expect(f.withinTolerance).toBe(true);
    expect(f.correctDecimals).toBe(false);
    expect(f.passed).toBe(false);
  });

  it("a value outside half the smallest division fails tolerance", () => {
    const f = factsAfter({ instrument: "balance", specimen: "cube", studentValue: 22.5, studentUnit: "g", studentDecimals: 2 }, 1);
    expect(f.withinTolerance).toBe(false);
    expect(f.passed).toBe(false);
  });

  it("the 250 mL cylinder's coarse division demands whole millilitres, not decimals", () => {
    const wholeNumber = factsAfter({ instrument: "cylinder", cylinderSize: "250", liquidVolume: 120e-6, eyeLevel: 0, studentValue: 120, studentUnit: "mL", studentDecimals: 0 }, 1);
    const oneDecimal = factsAfter({ instrument: "cylinder", cylinderSize: "250", liquidVolume: 120e-6, eyeLevel: 0, studentValue: 120.0, studentUnit: "mL", studentDecimals: 1 }, 1);
    expect(wholeNumber.passed).toBe(true);
    expect(oneDecimal.passed).toBe(false);
  });

  it("the 10 mL cylinder's fine division demands two decimals", () => {
    const f = factsAfter({ instrument: "cylinder", cylinderSize: "10", liquidVolume: 6.20e-6, eyeLevel: 0, studentValue: 6.20, studentUnit: "mL", studentDecimals: 2 }, 1);
    expect(f.passed).toBe(true);
  });
});

/* ================================================================== *
 * Density: a derived quantity, computed, never asserted
 * ================================================================== */

describe("density is computed from real mass and volume, not looked up", () => {
  it("the aluminium cube's true density lands near 2700 kg/m3", () => {
    const f = factsAfter({ specimen: "cube" }, 1);
    expect(f.densitySI as number).toBeCloseTo(2700, -1);
  });

  it("different specimens carry different, genuinely computed densities", () => {
    const cube = factsAfter({ specimen: "cube" }, 1);
    const nut = factsAfter({ specimen: "nut" }, 1);
    const block = factsAfter({ specimen: "block" }, 1);
    expect(nut.densitySI as number).toBeGreaterThan(cube.densitySI as number); // brass > aluminium
    expect(block.densitySI as number).toBeLessThan(cube.densitySI as number); // wood floats
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const params = base({ instrument: "thermometer", thermometerImmersed: true });
    const a = runFor(params, 30, "twin");
    const b = runFor(params, 30, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ instrument: "balance", riderMiddle: 0.02, riderFront: 0.004 });
    const runner = runFor(params, 20, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: readItRightSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite across every instrument and specimen", () => {
    const instruments = ["balance", "digitalBalance", "cylinder", "caliper", "rule", "thermometer", "stopwatch"];
    const specimens = ["pebble", "bolt", "cube", "block", "nut", "water"];
    for (const instrument of instruments) {
      for (const specimen of specimens) {
        const r = runFor(base({ instrument, specimen }), 5, `${instrument}-${specimen}`);
        for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), `${instrument}/${specimen} readout ${ro.key}`).toBe(true);
        for (const [k, v] of Object.entries(r.facts())) {
          if (typeof v === "number") expect(Number.isFinite(v), `${instrument}/${specimen} fact ${k}`).toBe(true);
        }
      }
    }
  });

  it("an invalid unit string never produces NaN facts", () => {
    const f = factsAfter({ studentUnit: "not-a-unit" as unknown as string }, 1);
    expect(f.studentValid).toBe(false);
    expect(Number.isFinite(f.studentSI as number)).toBe(false); // NaN by design, but never surfaced as a readout
  });

  it("time moves", () => {
    const r = runFor(base(), 0.6);
    expect(r.time).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Labs and challenges are actually reachable as written
 * ================================================================== */

function values(r: SimRunner) {
  return { readouts: r.readoutValues(), facts: r.facts(), params: r.params, data: [] as never[], elapsed: r.time };
}

describe("every lab step's check is reachable by playing it as written", () => {
  it("zero-first: weigh biased, zero it, and the error shrinks within one division", () => {
    const lab = readItRightSim.labs!.find((l) => l.id === "zero-first")!;
    const runner = new SimRunner({ manifest: readItRightSim, params: { ...defaultParams(readItRightSim.params), ...lab.setup! }, band: "6-8", seed: "z1" });
    runner.playing = true;
    runner.setParams({ ...runner.params, riderMiddle: 0.02, riderFront: 0.00432 + 0.00035 });
    for (let i = 0; i < 6 * 30; i++) runner.advance(1 / 30);
    expect(lab.steps.find((s) => s.id === "weigh-biased")!.check!.test(values(runner))).toBe(true);

    runner.setParams({ ...runner.params, zeroTrim: 0, riderFront: 0.00432 });
    for (let i = 0; i < 6 * 30; i++) runner.advance(1 / 30);
    expect(lab.steps.find((s) => s.id === "zero-it")!.check!.test(values(runner))).toBe(true);
    expect(lab.steps.find((s) => s.id === "compare")!.check!.test(values(runner))).toBe(true);
  });

  it("meniscus-and-eye: all three eye positions pass their steps", () => {
    const lab = readItRightSim.labs!.find((l) => l.id === "meniscus-and-eye")!;
    const above = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, eyeLevel: 0.10 }, 1, "m1");
    expect(lab.steps.find((s) => s.id === "above")!.check!.test(values(above))).toBe(true);
    const level = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, eyeLevel: 0 }, 1, "m2");
    expect(lab.steps.find((s) => s.id === "level")!.check!.test(values(level))).toBe(true);
    const below = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, eyeLevel: -0.10 }, 1, "m3");
    expect(lab.steps.find((s) => s.id === "below")!.check!.test(values(below))).toBe(true);
  });

  it("rule-against-caliper: correctly-dp'd readings pass on both instruments", () => {
    const lab = readItRightSim.labs!.find((l) => l.id === "rule-against-caliper")!;
    const ruleRun = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, studentValue: 11.9, studentUnit: "mm", studentDecimals: 1 }, 1, "r1");
    expect(lab.steps.find((s) => s.id === "measure-rule")!.check!.test(values(ruleRun))).toBe(true);
    const caliperRun = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, instrument: "caliper", studentValue: 11.85, studentUnit: "mm", studentDecimals: 2 }, 1, "r2");
    expect(lab.steps.find((s) => s.id === "measure-caliper")!.check!.test(values(caliperRun))).toBe(true);
  });

  it("density-twice-over: mass, displaced volume and the computed density all check out", () => {
    const lab = readItRightSim.labs!.find((l) => l.id === "density-twice-over")!;
    const massRun = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, riderMiddle: 0.02, riderFront: 0.0016 }, 6, "d1");
    expect(lab.steps.find((s) => s.id === "mass")!.check!.test(values(massRun))).toBe(true);
    const volRun = runFor({ ...defaultParams(readItRightSim.params), ...lab.setup!, instrument: "cylinder", liquidVolume: 40e-6, objectSubmerged: true }, 1, "d2");
    expect(lab.steps.find((s) => s.id === "volume")!.check!.test(values(volRun))).toBe(true);
    expect(lab.steps.find((s) => s.id === "compute")!.check!.test(values(volRun))).toBe(true);
  });
});

describe("every challenge's goal is reachable by the settings its hints point to", () => {
  it("in tolerance every time: a settled, correctly-entered nut reading passes both stars", () => {
    const ch = readItRightSim.challenges!.find((c) => c.id === "in-tolerance-every-time")!;
    const r = runFor(
      { ...defaultParams(readItRightSim.params), ...ch.setup!, riderRear: 0, riderMiddle: 0.03, riderFront: 0.0057, studentValue: 35.70, studentUnit: "g", studentDecimals: 2 },
      6, "ch1",
    );
    expect(ch.goal.test(values(r))).toBe(true);
    expect(ch.stars!.two!.test(values(r))).toBe(true);
  });

  it("beat the parallax: entering the true volume (not the apparent one) passes", () => {
    const ch = readItRightSim.challenges!.find((c) => c.id === "beat-the-parallax")!;
    const r = runFor({ ...defaultParams(readItRightSim.params), ...ch.setup!, studentValue: 6.20, studentUnit: "mL", studentDecimals: 2 }, 1, "ch2");
    expect(ch.goal.test(values(r))).toBe(true);
  });

  it("beat the parallax: entering the apparent (uncorrected) reading fails it", () => {
    const ch = readItRightSim.challenges!.find((c) => c.id === "beat-the-parallax")!;
    const apparentMl = (runFor({ ...defaultParams(readItRightSim.params), ...ch.setup! }, 1, "ch3").facts().apparentVolumeMl as number);
    const r = runFor({ ...defaultParams(readItRightSim.params), ...ch.setup!, studentValue: Number(apparentMl.toFixed(2)), studentUnit: "mL", studentDecimals: 2 }, 1, "ch4");
    expect(ch.goal.test(values(r))).toBe(false);
  });
});
