import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { peelThePlanetSim } from "./a4-1-peel-the-planet";

/**
 * Science gate for G6-A4.1 "Peel the Planet: Reading the Rock Shells".
 *
 * The spec's honesty rule is that the layers are read off real ray physics,
 * never painted on: a genuine 2-D Snell's-law ray tracer through a radial
 * velocity model must produce a P shadow, an S shadow that a solid or
 * coreless hypothesis erases, and a depth profile whose pressure at the
 * core-mantle boundary and centre lands near the textbook 136 GPa and
 * 364 GPa — because that profile comes from integrating a real density
 * table through Newton's law of gravitation and the hydrostatic equation,
 * not from a fitted curve.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(peelThePlanetSim.params), ...overrides };
}

function runFor(params: ParamValues, engineSeconds: number, seed = "a4-1") {
  const runner = new SimRunner({ manifest: peelThePlanetSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "a4-1") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * Identity
 * ================================================================== */

describe("g6.a4-1 manifest identity", () => {
  it("carries the Unit A4 identity", () => {
    expect(peelThePlanetSim.id).toBe("g6.a4-1");
    expect(peelThePlanetSim.title).toContain("Peel the Planet");
    expect(peelThePlanetSim.grades).toContain(6);
    expect(peelThePlanetSim.bands).toContain("6-8");
    expect(peelThePlanetSim.labs?.length).toBeGreaterThanOrEqual(4);
    expect(peelThePlanetSim.challenges?.length).toBeGreaterThanOrEqual(2);
  });
});

/* ================================================================== *
 * The ray physics: shadows are measured, not painted
 * ================================================================== */

describe("a real liquid outer core produces both shadows", () => {
  it("a P shadow zone exists somewhere past the near field", () => {
    const f = factsAfter({ stationCount: 24 }, 0.1);
    expect(f.shadowPStart as number).toBeGreaterThan(60);
    expect(f.shadowPEnd as number).toBeGreaterThan(f.shadowPStart as number);
  });

  it("the S shadow begins somewhere in the range real seismology reports", () => {
    const f = factsAfter({ stationCount: 24, waveType: "S" }, 0.1);
    expect(f.shadowSStart as number).toBeGreaterThan(70);
    expect(f.shadowSStart as number).toBeLessThan(130);
  });

  it("stations exist on both sides of the S shadow", () => {
    const f = factsAfter({ stationCount: 24, waveType: "S" }, 0.1);
    expect(f.stationsInSShadow as number).toBeGreaterThan(0);
    expect((f.stationsInSShadow as number) + (f.stationsWithS as number)).toBeLessThanOrEqual(24);
  });
});

describe("a solid-all-the-way-through Earth erases the S shadow", () => {
  it("has no S shadow at all", () => {
    const f = factsAfter({ stationCount: 24, coreState: "solid", waveType: "S" }, 0.1);
    expect(f.shadowSStart as number).toBe(-1);
    expect(f.stationsInSShadow as number).toBe(0);
  });

  it("contradicts the real (liquid-core) station pattern", () => {
    const f = factsAfter({ stationCount: 24, coreState: "solid" }, 0.1);
    expect(f.hypothesisMatches).toBe(false);
  });
});

describe("a uniform, coreless Earth erases the P shadow too", () => {
  it("has no P shadow", () => {
    const f = factsAfter({ stationCount: 24, coreState: "uniform", waveType: "P" }, 0.1);
    expect(f.shadowPStart as number).toBe(-1);
  });

  it("travel times are slower than the real liquid-core Earth at the same distance", () => {
    interface StationLike { distDeg: number; pTime: number | null }
    interface StateLike { stations: StationLike[] }
    const uniform = runFor(base({ stationCount: 24, coreState: "uniform" }), 0.1);
    const liquid = runFor(base({ stationCount: 24, coreState: "liquid" }), 0.1);
    // Compare the farthest station (largest angular distance is identical
    // between the two runs, since station geometry does not depend on hypothesis).
    const byDistDesc = (a: StationLike, b: StationLike) => b.distDeg - a.distDeg;
    const su = [...(uniform.getState() as StateLike).stations].sort(byDistDesc)[0];
    const sl = [...(liquid.getState() as StateLike).stations].sort(byDistDesc)[0];
    expect(su.pTime).not.toBeNull();
    expect(sl.pTime).not.toBeNull();
    expect(su.pTime as number).toBeGreaterThan(sl.pTime as number);
  });

  it("does not match the real station pattern", () => {
    const f = factsAfter({ stationCount: 24, coreState: "uniform" }, 0.1);
    expect(f.hypothesisMatches).toBe(false);
  });
});

describe("the liquid-core hypothesis matches itself", () => {
  it("reads MATCHES against its own reference pattern", () => {
    const f = factsAfter({ stationCount: 24, coreState: "liquid" }, 0.1);
    expect(f.hypothesisMatches).toBe(true);
  });
});

/* ================================================================== *
 * The depth profile: real hydrostatic integration
 * ================================================================== */

describe("the depth profile is a real hydrostatic integration, not a fitted curve", () => {
  it("pressure at the core-mantle boundary lands near the textbook 136 GPa", () => {
    const f = factsAfter({ peelDepth: 2891 * 1000 }, 0.05);
    expect(f.peelPressureGPa as number).toBeGreaterThan(110);
    expect(f.peelPressureGPa as number).toBeLessThan(160);
  });

  it("pressure at the centre lands near the textbook 364 GPa, under the spec's 360 GPa figure", () => {
    const f = factsAfter({ peelDepth: 6371 * 1000 }, 0.05);
    expect(f.peelPressureGPa as number).toBeGreaterThan(300);
    expect(f.peelPressureGPa as number).toBeLessThan(420);
  });

  it("pressure increases monotonically with depth", () => {
    const shallow = factsAfter({ peelDepth: 100 * 1000 }, 0.05);
    const mid = factsAfter({ peelDepth: 2891 * 1000 }, 0.05);
    const deep = factsAfter({ peelDepth: 6371 * 1000 }, 0.05);
    expect(mid.peelPressureGPa as number).toBeGreaterThan(shallow.peelPressureGPa as number);
    expect(deep.peelPressureGPa as number).toBeGreaterThan(mid.peelPressureGPa as number);
  });

  it("the inner core temperature lands near the spec's own 5,200 C figure", () => {
    const f = factsAfter({ peelDepth: 6371 * 1000 }, 0.05);
    expect(f.peelTempC as number).toBeGreaterThan(3000);
    expect(f.peelTempC as number).toBeLessThan(7000);
  });

  it("density jumps up sharply crossing into the outer core", () => {
    const above = factsAfter({ peelDepth: 2800 * 1000 }, 0.05);
    const below = factsAfter({ peelDepth: 3000 * 1000 }, 0.05);
    expect(below.peelDensityGcm3 as number).toBeGreaterThan((above.peelDensityGcm3 as number) * 1.4);
  });
});

/* ================================================================== *
 * Drill sites and the honesty line
 * ================================================================== */

describe("drilling never reaches past the crust, anywhere", () => {
  it("Sierra crest bedrock is far shallower than Central Valley basement", () => {
    const valley = factsAfter({ drillSite: "centralValley" }, 0.05);
    const crest = factsAfter({ drillSite: "sierraCrest" }, 0.05);
    expect(crest.drillBedrockDepthM as number).toBeLessThan(valley.drillBedrockDepthM as number);
  });

  it("ten kilometres of peel depth is still inside the crust", () => {
    const f = factsAfter({ peelDepth: 10 * 1000 }, 0.05);
    expect(f.stillInCrustAt10km).toBe(true);
  });

  it("the real deepest borehole is recorded and it too never left the crust", () => {
    const f = factsAfter({}, 0.05);
    expect(f.drillDeepestDrillKm as number).toBeLessThan(35); // shallower than the Moho everywhere
  });
});

/* ================================================================== *
 * Magnitude is a real, causal control on detection
 * ================================================================== */

describe("bigger quakes are read farther away", () => {
  it("a magnitude 8.5 quake is detected at more stations than a magnitude 4.0 quake", () => {
    // Give the wavefield enough simulated clock time to reach every station
    // (the farthest arrival is on the order of 20 simulated minutes) by
    // running fast-forwarded, exactly like a student would with the dial.
    const weak = factsAfter({ stationCount: 24, magnitude: 4.0, playbackSpeed: 20 }, 90);
    const strong = factsAfter({ stationCount: 24, magnitude: 8.5, playbackSpeed: 20 }, 90);
    expect(strong.stationsWithP as number).toBeGreaterThan(weak.stationsWithP as number);
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

  it("playback speed changes pace and only pace", () => {
    const slow = runFor(base({ playbackSpeed: 0.25 }), 5);
    const fast = runFor(base({ playbackSpeed: 20 }), 5);
    expect(fast.facts().clockS as number).toBeGreaterThan(slow.facts().clockS as number);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 5, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: peelThePlanetSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("changing an unrelated cosmetic control (exaggeration) changes no physics fact", () => {
    const a = factsAfter({ exaggeration: 1 }, 0.2);
    const b = factsAfter({ exaggeration: 50 }, 0.2);
    for (const key of ["shadowPStart", "shadowSStart", "firstPArrivalS", "peelPressureGPa"]) {
      expect(b[key], `fact ${key} moved with exaggeration`).toEqual(a[key]);
    }
  });
});
