import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import {
  oneSparkSixtyYearsSim, ZONE_COUNT, computeZones, computeIgnitionZone,
  fuelLoadTHa, lastArrivalHours, SEVERITY_WEIGHT, SPHERES,
} from "./a4-6-one-spark-sixty-years";

/**
 * Science gate for G6-A4.6 "One Spark, Sixty Years: A Sierra Watershed".
 *
 * Tests the spec's actual claim: one Earth-system event drives four sphere
 * responses on four different real timescales, and the worst hit does not
 * have to arrive first. Every check below reads that claim off the live
 * model (zone-by-zone fire spread, storm-driven erosion, succession) rather
 * than asserting a scripted narrative — if the underlying formulas ever stop
 * producing that pattern, these tests are meant to catch it.
 */

const HOURS_PER_YEAR = 365 * 24;
const MAX_HOURS = 60 * HOURS_PER_YEAR;
const LOG_MAX = Math.log10(MAX_HOURS + 1);

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(oneSparkSixtyYearsSim.params), ...overrides };
}

function newRunner(params: ParamValues, seed = "gate"): SimRunner {
  return new SimRunner({ manifest: oneSparkSixtyYearsSim, params, band: "6-8", seed });
}

/** Jump the scrubber directly to a target hour, the same way a drag does. */
function scrubTo(runner: SimRunner, hoursTarget: number): void {
  const pos = Math.min(1, Math.log10(Math.max(0, hoursTarget) + 1) / LOG_MAX);
  runner.setParams({ ...runner.params, timelinePos: pos });
}

function factsAt(params: ParamValues, hoursTarget: number, seed = "gate"): Record<string, number | boolean | string> {
  const runner = newRunner(params, seed);
  scrubTo(runner, hoursTarget);
  return runner.facts();
}

/* ================================================================== *
 * Watershed structure
 * ================================================================== */

describe("the watershed is twelve real zones from reservoir to ridge", () => {
  it("has exactly twelve zones", () => {
    expect(ZONE_COUNT).toBe(12);
    expect(computeZones(base())).toHaveLength(12);
  });

  it("elevation rises monotonically from the reservoir zone to the ridge zone", () => {
    const zones = computeZones(base());
    for (let i = 1; i < zones.length; i++) expect(zones[i].elevM).toBeGreaterThan(zones[i - 1].elevM);
    expect(zones[0].elevM).toBeCloseTo(1400, 0);
    expect(zones[zones.length - 1].elevM).toBeCloseTo(2600, 0);
  });

  it("the ignition point maps to the nearest zone, low at 1,400m and high at 2,600m", () => {
    expect(computeIgnitionZone(base({ ignitionElevation: 1400 }))).toBe(0);
    expect(computeIgnitionZone(base({ ignitionElevation: 2600 }))).toBe(11);
  });

  it("fuel load rises with years since fire, from about 8 t/ha toward about 90 t/ha at ninety years", () => {
    expect(fuelLoadTHa(2)).toBeLessThan(20);
    expect(fuelLoadTHa(90)).toBeGreaterThan(85);
    expect(fuelLoadTHa(90)).toBeLessThan(95);
    expect(fuelLoadTHa(120)).toBeGreaterThanOrEqual(fuelLoadTHa(90)); // monotonic, saturating
  });
});

/* ================================================================== *
 * S1: The baseline fire — four spheres, four different clocks
 * ================================================================== */

describe("S1: the baseline fire — four spheres peak at four different moments", () => {
  const s1 = base();

  it("the fire itself fully spreads within about a day, not instantly and not never", () => {
    const zones = computeZones(s1);
    const last = lastArrivalHours(zones);
    expect(last).toBeGreaterThan(1);
    expect(last).toBeLessThan(48);
  });

  it("atmosphere and biosphere peak at the fire itself; geosphere and hydrosphere peak months later, at the storm", () => {
    const f = factsAt(s1, MAX_HOURS);
    expect(f.atmospherePeakHours as number).toBeLessThan(48);
    expect(f.biospherePeakHours as number).toBeLessThan(48);
    expect(f.geospherePeakHours as number).toBeGreaterThan(48);
    expect(f.hydrospherePeakHours as number).toBeGreaterThan(48);
  });

  it("the four peak moments span real, distinct separation — not a single instant", () => {
    const f = factsAt(s1, MAX_HOURS);
    const peaks = SPHERES.map((s) => f[`${s}PeakHours`] as number);
    const spreadHours = Math.max(...peaks) - Math.min(...peaks);
    expect(spreadHours).toBeGreaterThan(24 * 30); // at least a month apart, start to end
  });

  it("the atmosphere clears fastest: recovered well inside three weeks", () => {
    const f = factsAt(s1, MAX_HOURS);
    expect(f.atmosphereRecoveryHours as number).toBeLessThan(24 * 21);
  });

  it("the biosphere is still elevated at year sixty; the atmosphere is not", () => {
    const f = factsAt(s1, MAX_HOURS);
    expect(f.biosphereStillElevatedAtYear60).toBe(true);
    expect(f.atmosphereStillElevatedAtYear60).toBe(false);
  });

  it("scrubbing the timeline backward and forward reaches the same reading at the same hour (pure function, no hidden path-dependence)", () => {
    const forward = factsAt(s1, 24 * 200);
    const runner = newRunner(s1);
    scrubTo(runner, MAX_HOURS);
    scrubTo(runner, 24 * 200); // jump back
    const backward = runner.facts();
    expect(backward.geosphereIndex).toBeCloseTo(forward.geosphereIndex as number, 6);
    expect(backward.hydrosphereIndex).toBeCloseTo(forward.hydrosphereIndex as number, 6);
  });
});

/* ================================================================== *
 * S2: The winter after — the storm, not the fire, does the worst damage
 * ================================================================== */

describe("S2: a bigger first-winter storm makes the geosphere and hydrosphere hit worse, not different in kind", () => {
  it("both S1 and S2 have their geosphere and hydrosphere peak at the storm, months after the fire", () => {
    const f1 = factsAt(base(), MAX_HOURS);
    const f2 = factsAt(base({ stormIntensity: 140 }), MAX_HOURS);
    for (const f of [f1, f2]) {
      expect(f.geospherePeakHours as number).toBeGreaterThan(24 * 60);
      expect(f.hydrospherePeakHours as number).toBeGreaterThan(24 * 60);
    }
  });

  it("140mm does strictly more geosphere and hydrosphere damage than 60mm", () => {
    const f1 = factsAt(base(), MAX_HOURS);
    const f2 = factsAt(base({ stormIntensity: 140 }), MAX_HOURS);
    expect(f2.geospherePeakValue as number).toBeGreaterThan(f1.geospherePeakValue as number);
    expect(f2.hydrospherePeakValue as number).toBeGreaterThan(f1.hydrospherePeakValue as number);
    expect(f2.sedimentYieldPeakTHaYr as number).toBeGreaterThan(f1.sedimentYieldPeakTHaYr as number);
  });

  it("a storm below the debris-flow threshold triggers no debris flow at all", () => {
    const f = factsAt(base({ stormIntensity: 10 }), MAX_HOURS); // well under 24mm/h even at peak fraction
    expect(f.debrisTriggered).toBe(false);
    expect(f.sedimentYieldPeakTHaYr as number).toBe(0);
  });
});

/* ================================================================== *
 * S3: Prepared ground — a real treatment, not a relabelled default
 * ================================================================== */

describe("S3: prepared ground (thin fuel + prescribed burn) measurably lowers severity, sediment, and geosphere damage", () => {
  it("a prescribed burn caps the effective fuel load even if years-since-fire is set high", () => {
    const treated = computeZones(base({ yearsSinceFire: 90, postFireAction: "prescribedBurn" }));
    const untreated = computeZones(base({ yearsSinceFire: 90, postFireAction: "none" }));
    const avgWeight = (zs: typeof treated) => zs.reduce((s, z) => s + SEVERITY_WEIGHT[z.severity], 0) / zs.length;
    expect(avgWeight(treated)).toBeLessThan(avgWeight(untreated));
  });

  it("S3's geosphere peak is measurably lower than the untreated baseline", () => {
    const untreated = factsAt(base(), MAX_HOURS);
    const s3 = factsAt(base({ yearsSinceFire: 8, postFireAction: "prescribedBurn" }), MAX_HOURS);
    expect(s3.geospherePeakValue as number).toBeLessThan(untreated.geospherePeakValue as number);
  });

  it("S3 leaves the biosphere closer to recovered by year sixty than the untreated baseline", () => {
    const untreated = factsAt(base(), MAX_HOURS);
    const s3 = factsAt(base({ yearsSinceFire: 8, postFireAction: "prescribedBurn" }), MAX_HOURS);
    expect(s3.biosphereIndex as number).toBeLessThan(untreated.biosphereIndex as number);
  });
});

/* ================================================================== *
 * S4: A different event entirely — the atmospheric river
 * ================================================================== */

describe("S4: the atmospheric river is a genuinely different signature, not a reskinned fire", () => {
  const s4 = base({ event: "atmosphericRiver", stormIntensity: 150 });

  it("hydrosphere is the dominant, fastest-hit sphere — unlike the wildfire's atmosphere/biosphere-first order", () => {
    const f = factsAt(s4, 24 * 10);
    expect(f.worstHitSphere).toBe("hydrosphere");
    expect(f.hydrospherePeakHours as number).toBeLessThan(f.geospherePeakHours as number);
  });

  it("every sphere is fully recovered well before year sixty — unlike the wildfire's biosphere", () => {
    const f = factsAt(s4, MAX_HOURS);
    for (const s of SPHERES) expect(f[`${s}StillElevatedAtYear60`]).toBe(false);
  });

  it("the atmosphere is barely touched by a rain event, unlike the wildfire's smoke spike", () => {
    const fWildfire = factsAt(base(), 24 * 2);
    const fRiver = factsAt(s4, 24 * 2);
    expect(fRiver.atmosphereIndex as number).toBeLessThan(fWildfire.atmosphereIndex as number);
  });

  it("wildfire-only controls (ignition, wind, fuel moisture, years since fire) are correctly flagged inert", () => {
    const f = factsAt(s4, 0);
    expect(f.wildfireControlsActive).toBe(false);
  });
});

/* ================================================================== *
 * Post-fire actions: five real, distinct, independently verifiable effects
 * ================================================================== */

describe("post-fire actions each do something real and distinct", () => {
  it("mulch treatment reduces sediment yield relative to no treatment, same fire", () => {
    const none = factsAt(base({ postFireAction: "none" }), MAX_HOURS);
    const mulch = factsAt(base({ postFireAction: "mulch" }), MAX_HOURS);
    expect(mulch.sedimentYieldPeakTHaYr as number).toBeLessThan(none.sedimentYieldPeakTHaYr as number);
  });

  it("salvage logging adds a little sediment risk rather than none", () => {
    const none = factsAt(base({ postFireAction: "none" }), MAX_HOURS);
    const salvage = factsAt(base({ postFireAction: "salvage" }), MAX_HOURS);
    expect(salvage.sedimentYieldPeakTHaYr as number).toBeGreaterThan(none.sedimentYieldPeakTHaYr as number);
  });

  it("replanting regains carbon faster than natural regeneration, same elapsed time", () => {
    const none = factsAt(base({ postFireAction: "none" }), 20 * HOURS_PER_YEAR);
    const replant = factsAt(base({ postFireAction: "replant" }), 20 * HOURS_PER_YEAR);
    expect(replant.carbonRegained as number).toBeGreaterThan(none.carbonRegained as number);
  });

  it("the live sediment multiplier readout matches the action actually selected", () => {
    expect(factsAt(base({ postFireAction: "mulch" }), 0).postFireSedimentMultiplier).toBeLessThan(1);
    expect(factsAt(base({ postFireAction: "salvage" }), 0).postFireSedimentMultiplier).toBeGreaterThan(1);
    expect(factsAt(base({ postFireAction: "none" }), 0).postFireSedimentMultiplier).toBe(1);
  });
});

/* ================================================================== *
 * Sphere-focus toggles and carbon ledger
 * ================================================================== */

describe("sphere-focus toggles genuinely remove a sphere's readout, and the carbon ledger never lets regained exceed released", () => {
  it("turning off a sphere's focus removes its readout entirely", () => {
    const runner = newRunner(base({ showBiosphere: false }));
    const keys = runner.readouts().map((r) => r.key);
    expect(keys).not.toContain("biosphereIndex");
    expect(keys).toContain("geosphereIndex");
  });

  it("carbon regained never exceeds carbon released, at any point in the run", () => {
    const s1 = base();
    for (const yr of [0.5, 3, 15, 40, 60]) {
      const f = factsAt(s1, yr * HOURS_PER_YEAR);
      expect(f.carbonRegained as number).toBeLessThanOrEqual((f.carbonReleased as number) + 1e-6);
    }
  });

  it("carbon released climbs as the fire spreads, from just the ignition zone to the full watershed", () => {
    const atIgnition = factsAt(base(), 0);
    const afterFullSpread = factsAt(base(), 24 * 2);
    expect(atIgnition.carbonReleased as number).toBeGreaterThan(0); // the ignition zone itself has just burned
    expect(afterFullSpread.carbonReleased as number).toBeGreaterThan(atIgnition.carbonReleased as number);
  });
});

/* ================================================================== *
 * Engine contract: finite, deterministic, resettable — same bar as every
 * other registered sim, verified directly here in addition to the shared
 * acceptance gate.
 * ================================================================== */

describe("engine contract", () => {
  it("every readout stays finite across a full scrub from hour zero to year sixty, both events", () => {
    for (const event of ["sierraWildfire", "atmosphericRiver"] as const) {
      const runner = newRunner(base({ event, stormIntensity: 150 }));
      for (const h of [0, 1, 6, 24, 24 * 21, 24 * 120, 24 * 365, MAX_HOURS / 2, MAX_HOURS]) {
        scrubTo(runner, h);
        for (const r of runner.readouts()) expect(Number.isFinite(r.quantity.value), `${event} @ ${h}h: ${r.key}`).toBe(true);
        for (const [k, v] of Object.entries(runner.facts())) {
          if (typeof v === "number") expect(Number.isFinite(v), `${event} @ ${h}h: fact ${k}`).toBe(true);
        }
      }
    }
  });

  it("is deterministic: two runners with the same seed and params reach identical facts", () => {
    const a = newRunner(base(), "same-seed");
    const b = newRunner(base(), "same-seed");
    scrubTo(a, 24 * 130);
    scrubTo(b, 24 * 130);
    expect(a.facts()).toEqual(b.facts());
  });

  it("reset() re-derives state from current params: scrub to year sixty, dial the control back to hour zero, reset lands at hour zero", () => {
    const runner = newRunner(base());
    scrubTo(runner, MAX_HOURS);
    runner.setParams({ ...runner.params, timelinePos: 0 });
    runner.reset();
    expect(runner.facts().timelineHours).toBe(0);
  });

  it("advancing with playback speed moves the clock forward without a scrub", () => {
    const runner = newRunner(base({ playbackSpeed: 10 }));
    runner.playing = true;
    for (let i = 0; i < 60; i++) runner.advance(1 / 30);
    expect(runner.facts().timelineHours as number).toBeGreaterThan(0);
  });
});
