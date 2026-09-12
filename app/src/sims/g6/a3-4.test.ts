import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { flattenedSierraSim } from "./a3-4-the-model-that-flattened-the-sierra";

/**
 * Science gate for G6-A3.4 "The Model That Flattened the Sierra".
 *
 * A coarse grid or a missing terrain card genuinely erases the crest from
 * the moisture budget; the rain-shadow ratio only appears once terrain,
 * lift and resolution are all present; the compute budget is a hard gate
 * that refuses a run rather than quietly truncating it; and the rain-snow
 * phase card is what makes the model's storm call track a specific real
 * storm's own, unusual freezing level.
 */

const DEG = Math.PI / 180;

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(flattenedSierraSim.params), ...overrides };
}

function fresh(params: ParamValues, seed = "g6a3-4"): SimRunner {
  const runner = new SimRunner({ manifest: flattenedSierraSim, params, band: "6-8", seed });
  runner.playing = true;
  return runner;
}

function factsAfter(params: ParamValues, engineSeconds = 0.2): Record<string, number | boolean | string> {
  const runner = fresh(params);
  runner.advance(engineSeconds);
  return runner.facts();
}

/* ================================================================== *
 * A coarse grid, or no terrain card, erases the crest
 * ================================================================== */

describe("a flattened Sierra gives every station the same rain", () => {
  it("no terrain, no lift: Blue Canyon and Reno read identically", () => {
    const f = factsAfter(base({
      cellSize: 200000, processTerrainDetail: false, processOrographicLift: false, processRainSnowPhase: false,
    }));
    expect(Math.abs((f.precip_blueCanyon as number) - (f.precip_reno as number))).toBeLessThan(0.5);
    expect(f.meanAbsError as number).toBeGreaterThan(300);
  });

  it("turning the terrain-detail card off flattens resolution to zero even at a fine grid", () => {
    const f = factsAfter(base({ cellSize: 1000, processTerrainDetail: false }));
    expect(f.resolutionFactor).toBe(0);
  });

  it("a fine grid with the terrain card on resolves the crest almost completely", () => {
    const f = factsAfter(base({ cellSize: 4000 }));
    expect(f.resolutionFactor as number).toBeGreaterThan(0.9);
  });
});

/* ================================================================== *
 * The rain shadow only appears with terrain, lift, and resolution together
 * ================================================================== */

describe("the rain-shadow ratio is a real, earned number", () => {
  it("resolved terrain with lift gives a ratio near the real value of about 8", () => {
    const f = factsAfter(base({ cellSize: 4000 }));
    expect(f.rainShadowRatio as number).toBeGreaterThan(6);
    expect(f.rainShadowRatio as number).toBeLessThan(10);
  });

  it("without orographic lift, the ratio collapses toward 1 even with fine terrain", () => {
    const f = factsAfter(base({ cellSize: 4000, processOrographicLift: false }));
    expect(f.rainShadowRatio as number).toBeLessThan(1.2);
  });

  it("a crosswind reduces the lift effect and narrows the ratio", () => {
    const aligned = factsAfter(base({ cellSize: 4000, windDirection: 270 * DEG }));
    const skewed = factsAfter(base({ cellSize: 4000, windDirection: 180 * DEG }));
    expect(skewed.rainShadowRatio as number).toBeLessThan(aligned.rainShadowRatio as number);
  });
});

/* ================================================================== *
 * More processes shrink the error, never to exactly zero
 * ================================================================== */

describe("more processes shrink the mean absolute error, never to zero", () => {
  it("all seven cards beats the core three, at the same fine resolution", () => {
    const three = factsAfter(base({ cellSize: 4000 }));
    const seven = factsAfter(base({
      cellSize: 4000, computeBudget: 200,
      processValleyEvaporation: true, processCloudMicrophysics: true,
      processCanopyInterception: true, processWindDrift: true,
    }));
    expect(seven.overBudget).toBe(false);
    expect(seven.meanAbsError as number).toBeLessThan(three.meanAbsError as number);
    expect(seven.meanAbsError as number).toBeGreaterThan(0.5);
  });
});

/* ================================================================== *
 * The compute budget refuses a run outright, it does not truncate quietly
 * ================================================================== */

describe("the compute budget is a hard gate", () => {
  it("all seven cards at the default budget is refused", () => {
    const f = factsAfter(base({
      processValleyEvaporation: true, processCloudMicrophysics: true,
      processCanopyInterception: true, processWindDrift: true,
    }));
    expect(f.overBudget).toBe(true);
  });

  it("a refused configuration leaves the last valid solve standing, not a broken one", () => {
    const runner = fresh(base({ cellSize: 4000 })); // affordable
    const before = runner.facts();
    expect(before.overBudget).toBe(false);
    runner.setParams(base({
      cellSize: 4000, processValleyEvaporation: true, processCloudMicrophysics: true,
      processCanopyInterception: true, processWindDrift: true,
    }));
    runner.advance(0.1);
    const after = runner.facts();
    expect(after.overBudget).toBe(true);
    // The refused run changes nothing: the frozen precipitation values match
    // exactly what the last affordable configuration produced.
    expect(after.precip_blueCanyon).toBe(before.precip_blueCanyon);
    expect(after.meanAbsError).toBe(before.meanAbsError);
  });

  it("raising the budget to fit lets the same configuration finally run", () => {
    const runner = fresh(base({ cellSize: 4000 }));
    runner.setParams(base({
      cellSize: 4000, computeBudget: 100,
      processValleyEvaporation: true, processCloudMicrophysics: true,
      processCanopyInterception: true, processWindDrift: true,
    }));
    runner.advance(0.1);
    expect(runner.facts().overBudget).toBe(true);
    runner.setParams(base({
      cellSize: 4000, computeBudget: 200,
      processValleyEvaporation: true, processCloudMicrophysics: true,
      processCanopyInterception: true, processWindDrift: true,
    }));
    runner.advance(0.1);
    expect(runner.facts().overBudget).toBe(false);
  });
});

/* ================================================================== *
 * Rain-snow phase: a real storm's own freezing level, not a fixed guess
 * ================================================================== */

describe("the phase card tracks a specific storm, the naive guess does not", () => {
  it("Feb 2017 (warm aloft): the naive guess misses Donner Summit", () => {
    const f = factsAfter(base({ compareAgainst: "feb2017", processRainSnowPhase: false }));
    expect(f.phaseMismatch_donnerSummit).toBe(true);
    expect(f.phaseMismatchCount as number).toBeGreaterThanOrEqual(1);
  });

  it("Feb 2017 with the phase card and the right freezing level: no mismatches", () => {
    const f = factsAfter(base({ compareAgainst: "feb2017", processRainSnowPhase: true, freezingLevel: 2700 }));
    expect(f.phaseMismatchCount).toBe(0);
  });

  it("Dec 2021 (cold, normal) needs a different freezing level than Feb 2017 did", () => {
    const wrongLevel = factsAfter(base({ compareAgainst: "dec2021", processRainSnowPhase: true, freezingLevel: 2700 }));
    const rightLevel = factsAfter(base({ compareAgainst: "dec2021", processRainSnowPhase: true, freezingLevel: 1500 }));
    expect(rightLevel.phaseMismatchCount as number).toBeLessThan(wrongLevel.phaseMismatchCount as number);
    expect(rightLevel.phaseMismatchCount).toBe(0);
  });

  it("normals mode never reports a phase mismatch at all", () => {
    const f = factsAfter(base({ compareAgainst: "normals", processRainSnowPhase: false }));
    expect(f.phaseMismatchCount).toBe(0);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same params replay to the same fingerprint", () => {
    const a = fresh(base({ cellSize: 4000 }), "twin");
    const b = fresh(base({ cellSize: 4000 }), "twin");
    a.advance(0.5);
    b.advance(0.5);
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("every readout and fact stays finite across a range of configurations", () => {
    const configs: ParamValues[] = [
      base({ cellSize: 200000, processTerrainDetail: false }),
      base({ cellSize: 1000, computeBudget: 200, processValleyEvaporation: true, processCloudMicrophysics: true, processCanopyInterception: true, processWindDrift: true }),
      base({ compareAgainst: "feb2017" }),
      base({ compareAgainst: "dec2021", stormStrength: 100 }),
    ];
    for (const params of configs) {
      const runner = fresh(params);
      runner.advance(0.2);
      for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
      for (const [, v] of Object.entries(runner.facts())) {
        if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = fresh(base({ cellSize: 4000 }), "resetting");
    runner.advance(1);
    runner.reset();
    const freshRunner = new SimRunner({ manifest: flattenedSierraSim, params: base({ cellSize: 4000 }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(freshRunner.fingerprint());
  });
});
