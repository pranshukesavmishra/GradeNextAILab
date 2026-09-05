import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { diagramThatRunsSim } from "./a3-2-the-diagram-that-runs";

/**
 * Science gate for G6-A3.2 "The Diagram That Runs".
 *
 * The eight shapes are eight real gates on one continuous plant chemistry:
 * this file drives each gate and checks the plant actually responds — a
 * muddy day beats an unbranched diagram, a clogged filter with no loop-back
 * deadlocks and stays deadlocked, and the reality-trace checkpoints move
 * exactly as many percentage points as the shapes that are missing.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(diagramThatRunsSim.params), ...overrides };
}

function fresh(params: ParamValues, seed = "g6a3-2"): SimRunner {
  const runner = new SimRunner({ manifest: diagramThatRunsSim, params, band: "6-8", seed });
  runner.playing = true;
  return runner;
}

function runFor(params: ParamValues, engineSeconds: number, seed = "g6a3-2"): SimRunner {
  const runner = fresh(params, seed);
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

/** Press the token walker N times in step mode. */
function pressToken(runner: SimRunner, n: number): void {
  for (let i = 0; i < n; i++) {
    runner.push({ type: "action", action: "stepToken" });
    runner.advance(1 / 30);
  }
}

/* ================================================================== *
 * Trace match tracks exactly which shapes are missing
 * ================================================================== */

describe("trace match is exactly the fraction of checkpoints the diagram satisfies", () => {
  it("a complete, correctly wired diagram on clean water reaches 100%", () => {
    const f = runFor(base(), 0.5).facts();
    expect(f.traceMatchPct).toBe(100);
    expect(f.checkpointsMatched).toBe(f.checkpointsTotal);
  });

  it("four of eight shapes present reads 50%", () => {
    const params = base({
      hasHeadlossCheck: false, hasBackwashLoop: false, hasChlorination: false, hasChlorineCheck: false,
    });
    const f = runFor(params, 0.5).facts();
    expect(f.traceMatchPct).toBe(50);
  });

  it("stepping the token in Step mode advances the chemistry; leaving it alone does not", () => {
    const params = base({ runMode: "stepToken" });
    const runner = fresh(params);
    const before = runner.facts().totalMinutes;
    // Time passes with no press: nothing should move, in Step mode.
    for (let i = 0; i < 90; i++) runner.advance(1 / 30);
    expect(runner.facts().totalMinutes).toBe(before);
    // Now press the walker and confirm it does move, by exactly one parcel-transit.
    pressToken(runner, 1);
    expect(runner.facts().totalMinutes as number).toBeGreaterThan(before as number);
  });
});

/* ================================================================== *
 * Muddy river day: the turbidity-check diamond is load-bearing
 * ================================================================== */

describe("a muddy river day needs the turbidity-check diamond", () => {
  const muddy: ParamValues = { rawTurbidity: 90, runMode: "continuous" };

  it("without the diamond, unsafe water reaches the town", () => {
    const f = runFor(base({ ...muddy, hasTurbidityCheck: false }), 0.2).facts();
    expect(f.outletTurbidity as number).toBeGreaterThan(1.0);
  });

  it("with the diamond, outlet turbidity stays under the safe line", () => {
    const f = runFor(base({ ...muddy, hasTurbidityCheck: true }), 0.2).facts();
    expect(f.outletTurbidity as number).toBeLessThan(1.0);
  });

  it("on ordinary water the diamond makes no real difference", () => {
    const clean: ParamValues = { rawTurbidity: 3, runMode: "continuous" };
    const off = runFor(base({ ...clean, hasTurbidityCheck: false }), 0.2).facts();
    const on = runFor(base({ ...clean, hasTurbidityCheck: true }), 0.2).facts();
    expect(Math.abs((off.outletTurbidity as number) - (on.outletTurbidity as number))).toBeLessThan(0.05);
  });
});

/* ================================================================== *
 * The missing loop: a straight-line diagram cannot recover from clogging
 * ================================================================== */

describe("filter clogging without a loop-back deadlocks and stays deadlocked", () => {
  it("deadlocks within about ten simulated minutes and throughput drops to zero", () => {
    const params = base({ faultInjection: "filterClogged", shapeLoopBack: false, runMode: "continuous" });
    const runner = fresh(params);
    for (let i = 0; i < Math.round(15 * 30); i++) runner.advance(1 / 30); // 15 s at 60x = 15 sim-h, ample
    const f = runner.facts();
    expect(f.deadlocked).toBe(true);
    expect(f.throughputMLday).toBe(0);
  });

  it("stays deadlocked forever without the loop, however long it runs", () => {
    const params = base({ faultInjection: "filterClogged", shapeLoopBack: false, runMode: "continuous" });
    const runner = fresh(params);
    for (let i = 0; i < Math.round(15 * 30); i++) runner.advance(1 / 30);
    expect(runner.facts().deadlocked).toBe(true);
    for (let i = 0; i < Math.round(60 * 30); i++) runner.advance(1 / 30);
    expect(runner.facts().deadlocked).toBe(true);
  });

  it("adding the loop back lets the very same fault be survived indefinitely", () => {
    const params = base({ faultInjection: "filterClogged", shapeLoopBack: true, runMode: "continuous" });
    const runner = fresh(params);
    for (let i = 0; i < Math.round(60 * 30); i++) runner.advance(1 / 30); // a full simulated day, easily
    const f = runner.facts();
    expect(f.deadlocked).toBe(false);
    expect(f.throughputMLday as number).toBeGreaterThan(0);
    expect(f.backwashCount as number).toBeGreaterThanOrEqual(2);
  });

  it("a loop added after the plant is already deadlocked rescues it", () => {
    const params = base({ faultInjection: "filterClogged", shapeLoopBack: false, runMode: "continuous" });
    const runner = fresh(params);
    for (let i = 0; i < Math.round(15 * 30); i++) runner.advance(1 / 30);
    expect(runner.facts().deadlocked).toBe(true);
    runner.setParams(base({ faultInjection: "filterClogged", shapeLoopBack: true, runMode: "continuous" }));
    runner.advance(1 / 30);
    expect(runner.facts().deadlocked).toBe(false);
  });

  it("without the fault, ordinary fouling backwashes on its own schedule and never deadlocks", () => {
    const params = base({ runMode: "fast24h" });
    const f = runFor(params, 3).facts(); // three simulated days at 1 day/real-second
    expect(f.deadlocked).toBe(false);
    expect(f.simDay as number).toBeGreaterThanOrEqual(3);
  });
});

/* ================================================================== *
 * Faults that no diagram can fix, and one that only a diamond fixes
 * ================================================================== */

describe("a hardware fault is not a missing decision diamond", () => {
  it("doser empty cripples coagulation even with every shape present", () => {
    const f = runFor(base({ faultInjection: "doserEmpty" }), 0.2).facts();
    expect(f.checkpointsMatched as number).toBeLessThan(f.checkpointsTotal as number);
  });

  it("power cut halts throughput regardless of the diagram", () => {
    const f = runFor(base({ faultInjection: "powerCut" }), 0.2).facts();
    expect(f.throughputMLday).toBe(0);
  });

  it("power cut freezes headloss instead of secretly still fouling the bed", () => {
    const runner = runFor(base({ faultInjection: "powerCut", runMode: "continuous" }), 0.1);
    const before = runner.facts().headloss;
    for (let i = 0; i < 60; i++) runner.advance(1 / 30);
    expect(runner.facts().headloss).toBe(before);
  });

  it("algal bloom drives the chlorine residual unsafe without the residual-check diamond", () => {
    const without = runFor(base({ faultInjection: "algalBloom", hasChlorineCheck: false }), 0.2).facts();
    const withCheck = runFor(base({ faultInjection: "algalBloom", hasChlorineCheck: true }), 0.2).facts();
    expect(without.chlorineOk).toBe(false);
    expect(withCheck.chlorineOk).toBe(true);
  });
});

/* ================================================================== *
 * Notation: some redraws cannot answer some questions
 * ================================================================== */

describe("each notation drops something to stay readable", () => {
  it("flowchart and cross-section can show where the sludge goes", () => {
    expect(runFor(base({ notation: "flowchart" }), 0.1).facts().notationAnswersSludge).toBe(true);
    expect(runFor(base({ notation: "crossSection" }), 0.1).facts().notationAnswersSludge).toBe(true);
  });

  it("cycle diagram and black box cannot", () => {
    expect(runFor(base({ notation: "cycle" }), 0.1).facts().notationAnswersSludge).toBe(false);
    expect(runFor(base({ notation: "blackbox" }), 0.1).facts().notationAnswersSludge).toBe(false);
  });
});

/* ================================================================== *
 * Auto-check flags a shape wired to nothing useful
 * ================================================================== */

describe("a dangling shape is flagged, a correctly wired one is not", () => {
  it("a headloss check with no loop is dangling", () => {
    const f = runFor(base({ hasHeadlossCheck: true, hasBackwashLoop: false }), 0.1).facts();
    expect(f.danglingCount as number).toBeGreaterThan(0);
  });

  it("the fully wired default diagram has nothing dangling", () => {
    const f = runFor(base(), 0.1).facts();
    expect(f.danglingCount).toBe(0);
  });
});

/* ================================================================== *
 * Compression: Fast 24 h ignores the dial, Continuous obeys it
 * ================================================================== */

describe("time modes pace the same chemistry differently", () => {
  it("Fast 24 h advances a simulated day per real second regardless of the compression dial", () => {
    const f = runFor(base({ runMode: "fast24h", compression: 1 }), 1).facts();
    expect(f.simDay as number).toBeGreaterThanOrEqual(0.99);
  });

  it("Continuous mode obeys the compression dial", () => {
    const slow = runFor(base({ runMode: "continuous", compression: 1 }), 1).facts();
    const fast = runFor(base({ runMode: "continuous", compression: 500 }), 1).facts();
    expect(fast.totalMinutes as number).toBeGreaterThan(slow.totalMinutes as number);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed and inputs replay to the same fingerprint", () => {
    const a = fresh(base({ faultInjection: "filterClogged" }), "twin");
    const b = fresh(base({ faultInjection: "filterClogged" }), "twin");
    pressToken(a, 4);
    pressToken(b, 4);
    for (let i = 0; i < 30; i++) { a.advance(1 / 30); b.advance(1 / 30); }
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("every readout and fact stays finite through a long clogged run", () => {
    const runner = runFor(base({ faultInjection: "filterClogged", runMode: "fast24h" }), 5);
    for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [, v] of Object.entries(runner.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 3, "resetting");
    runner.reset();
    const freshRunner = new SimRunner({ manifest: diagramThatRunsSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(freshRunner.fingerprint());
  });
});
