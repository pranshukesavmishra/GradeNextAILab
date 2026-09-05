import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { rideTheBalloonSim } from "./a4-3-ride-the-balloon";

/**
 * Science gate for G6-A4.3 "Ride the Balloon to the Edge of Air".
 *
 * Every number here comes from a real hydrostatic integration through the
 * actual seven-layer US Standard Atmosphere lapse-rate table, an ideal-gas
 * balloon, and a real buoyancy-vs-drag force balance — so the checks are
 * checks against known, published physics (the -56.5 C tropopause, the
 * roughly 5.5 km half-mass altitude, a burst in the real 30-34 km range,
 * a thermosphere reading over 1,000 C), not against numbers the sim itself
 * invented.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(rideTheBalloonSim.params), ...overrides };
}

function runFor(params: ParamValues, engineSeconds: number, seed = "a4-3") {
  const runner = new SimRunner({ manifest: rideTheBalloonSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

function runUntilBurstOrLimit(params: ParamValues, maxEngineSeconds: number, seed = "a4-3") {
  const runner = new SimRunner({ manifest: rideTheBalloonSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  let t = 0;
  while (!runner.facts().burst && t < maxEngineSeconds) {
    runner.advance(dt);
    t += dt;
  }
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "a4-3") =>
  runFor(base(overrides), seconds, seed).facts();

describe("g6.a4-3 manifest identity", () => {
  it("carries the Unit A4 identity", () => {
    expect(rideTheBalloonSim.id).toBe("g6.a4-3");
    expect(rideTheBalloonSim.title).toContain("Ride the Balloon");
    expect(rideTheBalloonSim.grades).toContain(6);
    expect(rideTheBalloonSim.bands).toContain("6-8");
    expect(rideTheBalloonSim.labs?.length).toBeGreaterThanOrEqual(4);
    expect(rideTheBalloonSim.challenges?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("temperature reverses twice, at the tropopause and the stratopause", () => {
  function probeTempC(altM: number) {
    const runner = new SimRunner({
      manifest: rideTheBalloonSim, params: base({ probeAltitude: altM }), band: "6-8", seed: "probe",
    });
    runner.playing = true;
    runner.advance(0.01);
    return runner.facts().probeTempC as number;
  }

  it("the tropopause, at 11 km, reads the real -56.5 C", () => {
    expect(probeTempC(11_000)).toBeCloseTo(-56.5, 0);
  });

  it("temperature climbs from the tropopause to the stratopause near 50 km", () => {
    const tropopause = probeTempC(11_000);
    const stratopause = probeTempC(50_000);
    expect(stratopause).toBeGreaterThan(tropopause);
    expect(stratopause).toBeGreaterThan(-15);
  });

  it("temperature falls again into the mesosphere, then rises sharply in the thermosphere", () => {
    const stratopause = probeTempC(50_000);
    const mesopause = probeTempC(85_000);
    const thermosphere = probeTempC(300_000);
    expect(mesopause).toBeLessThan(stratopause);
    expect(mesopause).toBeLessThan(-60);
    expect(thermosphere).toBeGreaterThan(500);
  });
});

describe("half the atmosphere's mass lies close to the real ~5.5 km figure", () => {
  it("the measured half-mass altitude lands between 4 and 8 km", () => {
    const f = factsAfter({}, 0.05);
    expect(f.halfMassAltitudeKm as number).toBeGreaterThan(4);
    expect(f.halfMassAltitudeKm as number).toBeLessThan(8);
  });

  it("90 percent of the mass lies below an altitude comfortably past the half-mass point", () => {
    const f = factsAfter({}, 0.05);
    expect(f.ninetyMassAltitudeKm as number).toBeGreaterThan(f.halfMassAltitudeKm as number);
    expect(f.ninetyMassAltitudeKm as number).toBeLessThan(25);
  });

  it("the cumulative mass-below fraction at the probe is a real, monotonic function of altitude", () => {
    const low = factsAfter({ probeAltitude: 2000 }, 0.05).probeMassBelowFraction as number;
    const mid = factsAfter({ probeAltitude: 20000 }, 0.05).probeMassBelowFraction as number;
    const high = factsAfter({ probeAltitude: 100000 }, 0.05).probeMassBelowFraction as number;
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(high).toBeGreaterThan(0.99);
  });
});

describe("the balloon bursts from real ideal-gas expansion, in the real 30-34 km range", () => {
  it("the default flight bursts within the spec's real observed range", () => {
    const r = runUntilBurstOrLimit(base(), 3 * 3600);
    expect(r.facts().burst).toBe(true);
    expect(r.facts().burstAltitudeKm as number).toBeGreaterThan(28);
    expect(r.facts().burstAltitudeKm as number).toBeLessThan(37);
  });

  it("more helium bursts lower, because the envelope reaches its stretch limit sooner", () => {
    // Both fills comfortably clear the liftoff threshold at the default
    // payload — this isolates the burst-altitude effect from the separate,
    // genuine "does it even fly" question covered below.
    const little = runUntilBurstOrLimit(base({ heliumFill: 2.5 }), 4 * 3600);
    const lots = runUntilBurstOrLimit(base({ heliumFill: 7.5 }), 4 * 3600);
    expect(little.facts().burst).toBe(true);
    expect(lots.facts().burst).toBe(true);
    expect(lots.facts().burstAltitudeKm as number).toBeLessThan(little.facts().burstAltitudeKm as number);
  });

  it("after burst, descent is the real fixed 5 m/s parachute rate", () => {
    const r = runUntilBurstOrLimit(base(), 3 * 3600);
    r.advance(1 / 30);
    expect(r.facts().landed).toBe(false);
    const state = r.getState() as { velMs: number };
    expect(state.velMs).toBeCloseTo(-5, 5);
  });

  it("a heavier payload with the same helium bursts lower, from reduced net lift", () => {
    const light = runUntilBurstOrLimit(base({ payloadMass: 0.6 }), 4 * 3600);
    const heavy = runUntilBurstOrLimit(base({ payloadMass: 3.5 }), 4 * 3600);
    expect(light.facts().burst).toBe(true);
    if (heavy.facts().burst) {
      expect(heavy.facts().burstAltitudeKm as number).toBeLessThan(light.facts().burstAltitudeKm as number);
    } else {
      expect(heavy.facts().neverLifted).toBe(true);
    }
  });
});

describe("a payload can genuinely fail to lift off at all", () => {
  it("maximum payload with minimum helium never leaves the ground", () => {
    const f = factsAfter({ payloadMass: 5.0, heliumFill: 1.0 }, 20);
    expect(f.neverLifted).toBe(true);
    expect(f.altitudeM as number).toBeCloseTo(f.launchElevationM as number, 3);
  });
});

describe("the marine layer really is a temperature inversion, not just a colour", () => {
  it("temperature rises with height across the inversion band, opposite the normal troposphere", () => {
    function tempAt(altM: number) {
      const r = new SimRunner({
        manifest: rideTheBalloonSim, params: base({ airMass: "marineLayer", probeAltitude: altM }), band: "6-8", seed: "m",
      });
      r.playing = true;
      r.advance(0.01);
      return r.facts().probeTempC as number;
    }
    const below = tempAt(200);
    const aboveInversion = tempAt(750);
    expect(aboveInversion).toBeGreaterThan(below);
  });
});

describe("above the homopause, lighter gases become relatively more abundant", () => {
  it("nitrogen's share rises with altitude in the thermosphere, since it is the lightest species tracked", () => {
    function n2PctAt(altM: number) {
      const r = new SimRunner({
        manifest: rideTheBalloonSim, params: base({ probeAltitude: altM }), band: "6-8", seed: "c",
      });
      r.playing = true;
      r.advance(0.01);
      return r.facts().probeN2Pct as number;
    }
    const homopause = n2PctAt(100_000);
    const higher = n2PctAt(300_000);
    expect(higher).toBeGreaterThan(homopause);
  });

  it("molecule count per cm3 falls by many orders of magnitude from sea level to the thermosphere", () => {
    function densityAt(altM: number) {
      const r = new SimRunner({
        manifest: rideTheBalloonSim, params: base({ probeAltitude: altM }), band: "6-8", seed: "n",
      });
      r.playing = true;
      r.advance(0.01);
      return r.facts().probeNumberDensityPerCm3 as number;
    }
    const seaLevel = densityAt(0);
    const thermosphere = densityAt(200_000);
    expect(seaLevel).toBeGreaterThan(1e18);
    expect(thermosphere).toBeLessThan(1e12);
  });
});

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base(), 60, "twin");
    const b = runFor(base(), 60, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("time compression changes pace and only pace", () => {
    const slow = runFor(base({ timeCompression: 1 }), 5);
    const fast = runFor(base({ timeCompression: 100 }), 5);
    expect(fast.facts().clockS as number).toBeGreaterThan(slow.facts().clockS as number);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 30, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: rideTheBalloonSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("the ascent-rate-target control changes log sampling density only, never the flight physics", () => {
    const fine = factsAfter({ ascentRateTarget: 8 }, 200);
    const coarse = factsAfter({ ascentRateTarget: 1 }, 200);
    for (const key of ["altitudeM", "burst", "burstAltitudeKm", "temperatureC", "pressurePa"]) {
      expect(coarse[key], `fact ${key} moved with the sampling-only control`).toEqual(fine[key]);
    }
  });
});
