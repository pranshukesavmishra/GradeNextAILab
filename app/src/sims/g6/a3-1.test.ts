import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { experimentYouCannotRunSim } from "./a3-1-the-experiment-you-cannot-run";

/**
 * Science gate for G6-A3.1 "The Experiment You Cannot Run".
 *
 * Tests the spec's causal claims directly through the public manifest
 * surface (params/readouts/facts), the same discipline as the platform's own
 * acceptance gate: more processes shrinks a medium's systematic error but
 * never erases it, repeats-of-one carry no spread, reality resolves once and
 * stays frozen forever, the model's own result stays frozen too unless
 * Rewind is thrown, and different media clear different barrier lamps.
 */

const HOUR_S = 3600;

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(experimentYouCannotRunSim.params), ...overrides };
}

function fresh(params: ParamValues, seed = "g6a3-1"): SimRunner {
  const runner = new SimRunner({ manifest: experimentYouCannotRunSim, params, band: "6-8", seed });
  runner.playing = true;
  return runner;
}

/** Advance in exact single ticks (tickRate 30) for deterministic step counts. */
function runFor(params: ParamValues, engineSeconds: number, seed = "g6a3-1"): SimRunner {
  const runner = fresh(params, seed);
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

/* ================================================================== *
 * Model resolution shrinks error but never to zero
 * ================================================================== */

describe("more processes shrinks a medium's systematic error, never to zero", () => {
  it("computational: 10 processes beats 1, and both stay above the residual floor", () => {
    // compression high enough to resolve the 170-day snowpack case in one tick
    const setup: ParamValues = { caseId: "snowpack", medium: "computational", compression: 1_000_000, repeats: 10 };
    const one = runFor(base({ ...setup, processes: 1 }), 1).facts();
    const ten = runFor(base({ ...setup, processes: 10 }), 1).facts();
    expect(one.modelResolved).toBe(true);
    expect(ten.modelResolved).toBe(true);
    expect(Math.abs(ten.biasContribution as number)).toBeLessThan(Math.abs(one.biasContribution as number));
    expect(Math.abs(ten.biasContribution as number)).toBeGreaterThan(0);
  });

  it("a mathematical whiteboard cannot use more than its effective slots", () => {
    const setup: ParamValues = { caseId: "asteroid", medium: "mathematical", compression: 1_000_000, repeats: 10 };
    const three = runFor(base({ ...setup, processes: 3 }), 1).facts();
    const ten = runFor(base({ ...setup, processes: 10 }), 1).facts();
    // The whiteboard only fits so many relations: past its effective cap,
    // extra processes change nothing at all.
    expect(ten.biasContribution).toBeCloseTo(three.biasContribution as number, 6);
  });

  it("computational reaches a smaller floor than mathematical, which beats analogue", () => {
    const commonSetup: ParamValues = { caseId: "redwood", processes: 10, compression: 1_000_000, repeats: 10 };
    const comp = runFor(base({ ...commonSetup, medium: "computational" }), 1).facts();
    const math = runFor(base({ ...commonSetup, medium: "mathematical" }), 1).facts();
    const analogue = runFor(base({ ...commonSetup, medium: "analogue" }), 1).facts();
    const b = (f: Record<string, unknown>) => Math.abs(f.biasContribution as number);
    expect(b(comp)).toBeLessThan(b(math));
    expect(b(math)).toBeLessThan(b(analogue));
  });

  it("medium 'none' produces no model result at all", () => {
    const f = runFor(base({ caseId: "snowpack", medium: "none", compression: 1_000_000 }), 1).facts();
    expect(f.modelHasResult).toBe(false);
    expect(f.modelResolved).toBe(false);
    expect(f.biasContribution).toBe(0);
  });
});

/* ================================================================== *
 * Repeats: a single run has no spread, more repeats draw fresh noise
 * ================================================================== */

describe("repeat runs give a spread, a single run never does", () => {
  it("repeats = 1 has exactly zero spread", () => {
    const f = runFor(base({ caseId: "snowpack", medium: "computational", compression: 1_000_000, repeats: 1 }), 1).facts();
    expect(f.modelHasResult).toBe(true);
    expect(f.answerSpread).toBe(0);
  });

  it("repeats = 30 has a real, nonzero spread", () => {
    const f = runFor(base({ caseId: "snowpack", medium: "computational", compression: 1_000_000, repeats: 30 }), 1).facts();
    expect(f.modelHasResult).toBe(true);
    expect(f.answerSpread as number).toBeGreaterThan(0.5);
  });

  it("a medium with more per-repeat noise gives a wider spread at the same repeat count", () => {
    const setup: ParamValues = { caseId: "magma", compression: 1_000_000, repeats: 30, processes: 10 };
    const comp = runFor(base({ ...setup, medium: "computational" }), 1).facts();
    const analogue = runFor(base({ ...setup, medium: "analogue" }), 1).facts();
    expect(analogue.answerSpread as number).toBeGreaterThan(comp.answerSpread as number);
  });
});

/* ================================================================== *
 * Reality resolves once and is frozen forever after
 * ================================================================== */

describe("reality runs exactly once and is never rewound", () => {
  it("resolves within its own duration at full lab-time budget", () => {
    const params = base({ caseId: "asteroid", labBudgetH: 72 * HOUR_S }); // shortest case, cheapest to afford
    const runner = fresh(params);
    const dt = 1 / 30;
    // 120 days at 8 days/real-second is 15 real seconds; give it margin.
    for (let i = 0; i < Math.round(20 * 30); i++) runner.advance(dt);
    const f = runner.facts();
    expect(f.realityResolved).toBe(true);
    expect(Number.isFinite(f.trueOutcomeInternal as number)).toBe(true);
  });

  it("further play after resolution changes nothing about the recorded outcome", () => {
    const params = base({ caseId: "asteroid", labBudgetH: 72 * HOUR_S });
    const runner = fresh(params);
    const dt = 1 / 30;
    for (let i = 0; i < Math.round(20 * 30); i++) runner.advance(dt);
    const truthA = runner.facts().trueOutcomeInternal;
    for (let i = 0; i < Math.round(20 * 30); i++) runner.advance(dt);
    const truthB = runner.facts().trueOutcomeInternal;
    expect(truthB).toBe(truthA);
  });

  it("switching case and back never replays the same outcome as a hidden memory — it starts fresh", () => {
    // Switching case fully rebuilds the world (a different sealed vitrine);
    // the new case's own reality track starts at day zero.
    const runner = fresh(base({ caseId: "snowpack" }));
    runner.setParams(base({ caseId: "magma" }));
    const f = runner.facts();
    expect(f.caseId).toBe("magma");
    expect(f.realityDay).toBe(0);
    expect(f.realityResolved).toBe(false);
  });

  it("a small lab-time budget runs reality out of time before it resolves", () => {
    const params = base({ caseId: "snowpack", labBudgetH: 8 * HOUR_S }); // the spec's own default
    const runner = fresh(params);
    const dt = 1 / 30;
    for (let i = 0; i < Math.round(30 * 30); i++) runner.advance(dt); // 30 s is ample for the budget to bite
    const f = runner.facts();
    expect(f.realityResolved).toBe(false);
    expect(f.outOfBudget).toBe(true);
  });

  it("raising the budget lets a stalled reality track resume and finish", () => {
    const runner = fresh(base({ caseId: "snowpack", labBudgetH: 8 * HOUR_S }));
    const dt = 1 / 30;
    for (let i = 0; i < Math.round(30 * 30); i++) runner.advance(dt);
    expect(runner.facts().outOfBudget).toBe(true);
    runner.setParams(base({ caseId: "snowpack", labBudgetH: 72 * HOUR_S }));
    for (let i = 0; i < Math.round(30 * 30); i++) runner.advance(dt);
    expect(runner.facts().realityResolved).toBe(true);
  });
});

/* ================================================================== *
 * The honesty rule: the model's own frozen result needs Rewind
 * ================================================================== */

describe("the model's result is frozen after resolution unless Rewind is thrown", () => {
  const resolvedSetup: ParamValues = {
    caseId: "snowpack", medium: "computational", compression: 1_000_000, repeats: 20, processes: 4,
  };

  it("changing processes after resolution does nothing while Rewind is off", () => {
    const runner = runFor(base({ ...resolvedSetup, rewind: false }), 1);
    const before = runner.facts();
    expect(before.modelResolved).toBe(true);
    runner.setParams(base({ ...resolvedSetup, rewind: false, processes: 10 }));
    const after = runner.facts();
    expect(after.predictionMean).toBe(before.predictionMean);
    expect(after.answerSpread).toBe(before.answerSpread);
    expect(after.biasContribution).toBe(before.biasContribution);
  });

  it("changing processes after resolution takes effect once Rewind is on", () => {
    const runner = runFor(base({ ...resolvedSetup, rewind: false }), 1);
    const before = runner.facts();
    runner.setParams(base({ ...resolvedSetup, rewind: true, processes: 10 }));
    // The reset drops modelResolved; give it time to resolve again at high compression.
    runner.advance(1 / 30);
    const after = runner.facts();
    expect(after.modelResolved).toBe(true);
    expect(after.biasContribution).not.toBe(before.biasContribution);
  });

  it("reality's own lever never turns: no rewind param reaches the reality track", () => {
    const runner = fresh(base({ caseId: "asteroid", labBudgetH: 72 * HOUR_S, rewind: true }));
    const dt = 1 / 30;
    for (let i = 0; i < Math.round(20 * 30); i++) runner.advance(dt);
    const truthA = runner.facts().trueOutcomeInternal;
    runner.setParams(base({ caseId: "asteroid", labBudgetH: 72 * HOUR_S, rewind: true, processes: 9 }));
    for (let i = 0; i < Math.round(5 * 30); i++) runner.advance(dt);
    expect(runner.facts().trueOutcomeInternal).toBe(truthA);
    expect(runner.facts().realityResolved).toBe(true);
  });
});

/* ================================================================== *
 * Barriers: different media clear different lamps
 * ================================================================== */

describe("each medium removes only the barriers its own nature avoids", () => {
  it("no medium removes any barrier", () => {
    const f = runFor(base({ caseId: "magma", medium: "none" }), 0.1).facts();
    expect(f.barriersRemovedCount).toBe(0);
    expect(f.barriersRemainingCount).toBe(f.barriersTotal);
  });

  it("a scale model of the magma chamber removes big and dangerous, but not slow", () => {
    const f = runFor(base({ caseId: "magma", medium: "scale" }), 0.1).facts();
    expect(f.barriersTotal).toBe(3);
    expect(f.barriersRemovedCount).toBe(2);
    expect(f.barriersRemainingCount).toBe(1);
  });

  it("a scale model of the redwood removes nothing — it does not make the tree grow faster", () => {
    const f = runFor(base({ caseId: "redwood", medium: "scale" }), 0.1).facts();
    expect(f.barriersTotal).toBe(1);
    expect(f.barriersRemovedCount).toBe(0);
  });

  it("mathematics clears every barrier on the never-touchable asteroid", () => {
    const f = runFor(base({ caseId: "asteroid", medium: "mathematical" }), 0.1).facts();
    expect(f.barriersTotal).toBe(3);
    expect(f.barriersRemovedCount).toBe(3);
    expect(f.barriersRemainingCount).toBe(0);
  });
});

/* ================================================================== *
 * Sensors: more instruments placed genuinely tighten the reading
 * ================================================================== */

describe("more sensors placed give a less noisy reading, not just a different one", () => {
  it("with no sensor selected there is nothing to read", () => {
    const params = base({
      caseId: "snowpack", medium: "none",
      sensorSnowStake: false, sensorSatellite: false, sensorThermal: false,
      sensorSeismometer: false, sensorTelescope: false,
    });
    const f = runFor(params, 1).facts();
    expect(f.sensorAvailable).toBe(false);
    expect(f.sensorReading).toBe(0);
  });

  it("five sensors together read closer to the truth than the single default sensor, tick for tick", () => {
    const truth = (days: number) => Math.max(0, Math.min(100, (1 - days / 170) * 100));
    const oneSensor = base({
      caseId: "snowpack", medium: "none", sensorSnowStake: true, sensorSatellite: false,
      sensorThermal: false, sensorSeismometer: false, sensorTelescope: false,
    });
    const fiveSensors = base({
      caseId: "snowpack", medium: "none", sensorSnowStake: true, sensorSatellite: true,
      sensorThermal: true, sensorSeismometer: true, sensorTelescope: true,
    });
    const runOne = fresh(oneSensor, "sensors");
    const runFive = fresh(fiveSensors, "sensors");
    const dt = 1 / 30;
    let oneErr = 0, fiveErr = 0;
    for (let i = 0; i < 60; i++) {
      runOne.advance(dt);
      runFive.advance(dt);
      const fo = runOne.facts(), ff = runFive.facts();
      const t = truth(fo.realityDay as number);
      oneErr += Math.abs((fo.sensorReading as number) - t);
      fiveErr += Math.abs((ff.sensorReading as number) - t);
    }
    expect(fiveErr).toBeLessThan(oneErr);
  });
});

/* ================================================================== *
 * Cut open: the interior reading no reality sensor can ever show
 * ================================================================== */

describe("cutting the scale model open reveals what no reality sensor can", () => {
  it("interior reading appears only for scale + cut open", () => {
    const closed = runFor(base({ caseId: "magma", medium: "scale", cutOpen: false }), 0.5).facts();
    const open = runFor(base({ caseId: "magma", medium: "scale", cutOpen: true }), 0.5).facts();
    const wrongMedium = runFor(base({ caseId: "magma", medium: "computational", cutOpen: true }), 0.5).facts();
    expect(closed.interiorVisible).toBe(false);
    expect(closed.interiorReading).toBe(0);
    expect(open.interiorVisible).toBe(true);
    expect(open.interiorReading as number).toBeGreaterThan(0);
    expect(wrongMedium.interiorVisible).toBe(false);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base(), 5, "twin");
    const b = runFor(base(), 5, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("every readout and fact stays finite through a long compressed run", () => {
    const runner = runFor(base({ medium: "computational", compression: 1_000_000, repeats: 50 }), 3);
    for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [, v] of Object.entries(runner.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 4, "resetting");
    runner.reset();
    const freshRunner = new SimRunner({ manifest: experimentYouCannotRunSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(freshRunner.fingerprint());
  });
});
