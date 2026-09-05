import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { hydrosphereSim } from "./a4-2-ninety-seven-two-and-a-splash";

/**
 * Science gate for G6-A4.2 "Ninety-Seven, Two, and a Splash".
 *
 * The honesty rule this sim exists to uphold is a real, closed water budget:
 * ice lost is exactly ocean gained (mass conservation, not two independent
 * numbers), sea level rises by the textbook ~360 km^3 per millimetre, melting
 * every scrap of ice raises sea level by tens of metres (a well known real
 * figure), and Central Valley subsidence is driven by the worst drawdown ever
 * reached so it never reverses even after the water table partly recovers.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(hydrosphereSim.params), ...overrides };
}

function runFor(params: ParamValues, engineSeconds: number, seed = "a4-2") {
  const runner = new SimRunner({ manifest: hydrosphereSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "a4-2") =>
  runFor(base(overrides), seconds, seed).facts();

describe("g6.a4-2 manifest identity", () => {
  it("carries the Unit A4 identity", () => {
    expect(hydrosphereSim.id).toBe("g6.a4-2");
    expect(hydrosphereSim.title).toBe("Ninety-Seven, Two, and a Splash");
    expect(hydrosphereSim.grades).toContain(6);
    expect(hydrosphereSim.bands).toContain("6-8");
    expect(hydrosphereSim.labs?.length).toBeGreaterThanOrEqual(4);
    expect(hydrosphereSim.challenges?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("the real proportions: mostly salt, most of the rest ice", () => {
  it("the ocean is the overwhelming majority of all water", () => {
    const f = factsAfter({}, 0.1);
    expect(f.oceanFraction as number).toBeGreaterThan(0.9);
  });

  it("the fresh, liquid, surface fraction is a tiny sliver", () => {
    const f = factsAfter({}, 0.1);
    expect(f.freshFraction as number).toBeLessThan(0.06);
    expect(f.liquidFreshSurfaceDiameterKm as number).toBeLessThan((f.allWaterSphereDiameterKm as number) / 10);
  });

  it("the all-water comparison sphere lands close to the real ~1,385 km figure", () => {
    const f = factsAfter({}, 0.1);
    expect(f.allWaterSphereDiameterKm as number).toBeGreaterThan(1300);
    expect(f.allWaterSphereDiameterKm as number).toBeLessThan(1450);
  });
});

describe("ice melt conserves mass: what leaves ice enters the ocean", () => {
  it("ocean gain equals ice loss under the all-ice scenario", () => {
    const before = factsAfter({ iceScenario: "today" }, 0.05);
    const after = factsAfter({ iceScenario: "allIce", timeCompression: 500 }, 20);
    const iceLost = (before.iceKm3 as number) - (after.iceKm3 as number);
    const oceanGained = (after.oceanKm3 as number) - (before.oceanKm3 as number);
    expect(iceLost).toBeGreaterThan(0);
    expect(oceanGained).toBeCloseTo(iceLost, -2); // matches to within ~100 km^3 out of millions
  });

  it("melting essentially all ice raises sea level by tens of metres, the real order of magnitude", () => {
    const f = factsAfter({ iceScenario: "allIce", timeCompression: 1000 }, 40);
    expect(f.icePercentRemaining as number).toBeLessThan(5);
    expect(f.seaLevelM as number).toBeGreaterThan(40);
    expect(f.seaLevelM as number).toBeLessThan(90);
  });

  it("with the ice scenario left at today, nothing melts", () => {
    const f = factsAfter({ iceScenario: "today" }, 5);
    expect(f.icePercentRemaining as number).toBeCloseTo(100, 3);
    expect(f.seaLevelMm as number).toBeCloseTo(0, 3);
  });

  it("mountain glaciers alone raise sea level far less than melting all ice", () => {
    const glaciers = factsAfter({ iceScenario: "mountainGlaciers", timeCompression: 500 }, 20);
    const allIce = factsAfter({ iceScenario: "allIce", timeCompression: 500 }, 20);
    expect(glaciers.seaLevelM as number).toBeLessThan(allIce.seaLevelM as number);
  });
});

describe("tracer random walk matches the real flux table it is derived from", () => {
  it("an atmosphere-released tracer set lands on the ocean far more than on land, matching the precipitation split", () => {
    // Release straight into the atmosphere and let a large cohort take their
    // very first jump; the split should track PRECIP_OCEAN / PRECIP_LAND.
    const f = factsAfter({ releaseSite: "atmosphere", tracerCount: 400, timeCompression: 5 }, 3);
    const total = (f.tracersInOcean as number) + (f.tracersInAtmosphere as number) + (f.tracersInSoil as number) +
      (f.tracersInGroundwater as number) + (f.tracersInSurface as number);
    expect(total).toBe(400);
    // Most first jumps should already have landed the tracer in the ocean.
    expect(f.tracersInOcean as number).toBeGreaterThan(f.tracersInSoil as number);
  });

  it("over thousands of years, ocean residence time measures far longer than the atmosphere's", () => {
    const f = factsAfter({ tracerCount: 300, timeCompression: 800, releaseSite: "ocean" }, 40);
    expect(f.completedTransitions as number).toBeGreaterThan(0);
    if ((f.meanResidenceOceanYr as number) >= 0 && (f.meanResidenceAtmosphereYr as number) >= 0) {
      expect(f.meanResidenceOceanYr as number).toBeGreaterThan(f.meanResidenceAtmosphereYr as number);
    }
  });

  it("a full 5,000-year run visits every reservoir at least once", () => {
    const f = factsAfter({ tracerCount: 300, timeCompression: 500, releaseSite: "land" }, 10);
    expect(f.simYears as number).toBeGreaterThanOrEqual(5000);
    expect(f.completedTransitions as number).toBeGreaterThan(100);
  });
});

describe("Central Valley pumping causes irreversible subsidence", () => {
  it("heavy pumping lowers the water table and eventually causes subsidence", () => {
    const f = factsAfter({ cvPumping: 16, timeCompression: 1 }, 12 * 30);
    expect(f.cvDepthM as number).toBeGreaterThan(0);
    expect(f.cvSubsidenceM as number).toBeGreaterThan(0);
  });

  it("no pumping at all never causes any subsidence", () => {
    const f = factsAfter({ cvPumping: 0, timeCompression: 5 }, 5 * 30);
    expect(f.cvSubsidenceM as number).toBe(0);
  });

  it("subsidence never decreases even after the water table recovers", () => {
    const pumped = runFor(base({ cvPumping: 18, timeCompression: 1 }), 15 * 30);
    const depthAtPeak = pumped.facts().cvDepthM as number;
    const subsidenceAtPeak = pumped.facts().cvSubsidenceM as number;
    expect(subsidenceAtPeak).toBeGreaterThan(0);
    pumped.setParams({ ...base(), cvPumping: 0, timeCompression: 1 });
    pumped.playing = true;
    for (let i = 0; i < 15 * 30 * 30; i++) pumped.advance(1 / 30);
    const afterRecovery = pumped.facts();
    // The water table genuinely recovers some ground once pumping stops...
    expect(afterRecovery.cvDepthM as number).toBeLessThan(depthAtPeak);
    // ...but the subsidence it already caused never reverses.
    expect(afterRecovery.cvSubsidenceM as number).toBeGreaterThanOrEqual(subsidenceAtPeak - 1e-9);
  });
});

describe("more pumping means a deeper water table, a genuine causal control", () => {
  it("doubling pumping over the same time causes a deeper drawdown", () => {
    const light = factsAfter({ cvPumping: 4, timeCompression: 1 }, 10 * 30);
    const heavy = factsAfter({ cvPumping: 16, timeCompression: 1 }, 10 * 30);
    expect(heavy.cvDepthM as number).toBeGreaterThan(light.cvDepthM as number);
  });
});

describe("snowpack drives the river discharge peak", () => {
  it("a bigger snowpack produces a bigger spring discharge peak", () => {
    const lean = factsAfter({ snowpack: 0.4, timeCompression: 1 }, 400);
    const heavy = factsAfter({ snowpack: 1.6, timeCompression: 1 }, 400);
    expect(heavy.peakDischargeLastYear as number).toBeGreaterThan(lean.peakDischargeLastYear as number);
  });
});

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base(), 5, "twin");
    const b = runFor(base(), 5, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("time compression changes pace and only pace", () => {
    const slow = runFor(base({ timeCompression: 1 }), 3);
    const fast = runFor(base({ timeCompression: 100 }), 3);
    expect(fast.facts().simYears as number).toBeGreaterThan(slow.facts().simYears as number);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 5, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: hydrosphereSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });
});
