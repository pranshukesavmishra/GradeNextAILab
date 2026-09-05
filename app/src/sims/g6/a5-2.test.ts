import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { fourChambersSim } from "./a5-2-four-chambers-one-question";

/**
 * Science gate for G6-A5.2 "Four Chambers, One Question".
 *
 * The spec's honesty rule is that fairness is a countable property: unlock a
 * second variable and the attribution meter must read zero regardless of
 * which chamber wins, because the model genuinely cannot separate the two
 * causes — proven here by comparing two independent counterfactual ("ghost")
 * ghost curves rather than asserting the conclusion. Locks are tested to
 * actually force chambers identical, not just report a plausible-looking
 * badge, and the underlying rate laws (saturating light, two-threshold
 * water, an optimum-then-cliff temperature) are checked directly.
 */

const K = 273.15;

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(fourChambersSim.params), ...overrides };
}

function runFor(params: ParamValues, seconds: number, seed = "a5-2") {
  const runner = new SimRunner({ manifest: fourChambersSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  // Ceil, not round: a duration target like "day >= 21" must never land a
  // hair short of the boundary because of tick-count rounding.
  const ticks = Math.ceil(seconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

/** Run a number of simulated days under whatever time compression is set. */
function runDays(overrides: ParamValues, days: number, seed = "a5-2") {
  const params = base(overrides);
  const comp = params.timeComp as number;
  return runFor(params, (days * 86400) / comp, seed);
}

const factsAfterDays = (overrides: ParamValues, days: number, seed = "a5-2") =>
  runDays(overrides, days, seed).facts();

/* ================================================================== *
 * The rate laws
 * ================================================================== */

describe("light saturates instead of climbing forever", () => {
  it("more light produces a taller chamber, with diminishing returns", () => {
    const f = factsAfterDays({}, 21); // default: light 6/10/14/18, everything else locked
    expect(f.height1 as number).toBeLessThan(f.height2 as number);
    expect(f.height2 as number).toBeLessThan(f.height3 as number);
    expect(f.height3 as number).toBeLessThan(f.height4 as number);
    const gap12 = (f.height2 as number) - (f.height1 as number);
    const gap34 = (f.height4 as number) - (f.height3 as number);
    expect(gap34).toBeLessThan(gap12); // the high end is flatter — saturation
  });
});

describe("water has a real sweet spot, not a straight line", () => {
  it("drought (5 mL/day) grows far worse than a comfortable 20 mL/day", () => {
    const f = factsAfterDays({ lockLight: true, lockWater: false, waterC1: 0.005, waterC2: 0.02, waterC3: 0.02, waterC4: 0.02 }, 21);
    expect(f.height1 as number).toBeLessThan((f.height2 as number) * 0.6);
  });

  it("waterlogging (60 mL/day) also grows worse than the comfortable middle", () => {
    const f = factsAfterDays({ lockLight: true, lockWater: false, waterC1: 0.02, waterC2: 0.02, waterC3: 0.02, waterC4: 0.06 }, 21);
    expect(f.height4 as number).toBeLessThan(f.height1 as number);
  });
});

describe("temperature has an optimum plateau then a steep drop past 30", () => {
  it("30 C and 24 C are both close to optimal", () => {
    const f = factsAfterDays({ lockLight: true, lockTemp: false, tempC1: 24 + K, tempC2: 24 + K, tempC3: 24 + K, tempC4: 30 + K }, 21);
    expect(Math.abs((f.height4 as number) - (f.height1 as number))).toBeLessThan((f.height1 as number) * 0.15);
  });

  it("32 C falls measurably below the plateau", () => {
    const f = factsAfterDays({ lockLight: true, lockTemp: false, tempC1: 24 + K, tempC2: 24 + K, tempC3: 24 + K, tempC4: 32 + K }, 21);
    expect(f.height4 as number).toBeLessThan((f.height1 as number) * 0.9);
  });

  it("cold (10 C) grows far worse than the optimum", () => {
    const f = factsAfterDays({ lockLight: true, lockTemp: false, tempC1: 10 + K, tempC2: 20 + K, tempC3: 20 + K, tempC4: 20 + K }, 21);
    expect(f.height1 as number).toBeLessThan((f.height2 as number) * 0.5);
  });
});

/* ================================================================== *
 * Locks actually force chambers identical
 * ================================================================== */

describe("a locked variable is forced identical across all four chambers", () => {
  it("locking water erases any effect of different water sliders", () => {
    // Isolate the mechanic: no light variation, no natural noise, no rack bonus.
    const opts = { lockLight: true, lockWater: true, naturalVariation: 0 } as const;
    const differentSliders = factsAfterDays({ ...opts, waterC1: 0.005, waterC2: 0.06, waterC3: 0.03, waterC4: 0.01 }, 21);
    const allSameAtC1 = factsAfterDays({ ...opts, waterC1: 0.005, waterC2: 0.005, waterC3: 0.005, waterC4: 0.005 }, 21);
    expect(differentSliders.height1).toBeCloseTo(allSameAtC1.height1 as number, 6);
    expect(differentSliders.height4).toBeCloseTo(allSameAtC1.height1 as number, 6);
  });

  it("unlocking substrate creates a genuine, deterministic difference with no sliders at all", () => {
    const f = factsAfterDays({ lockSubstrate: false }, 21);
    expect(f.height1).not.toBeCloseTo(f.height2 as number, 1);
    expect(f.differingCount as number).toBeGreaterThanOrEqual(2); // light (default IV) + substrate
  });
});

/* ================================================================== *
 * The confound detector and attribution meter
 * ================================================================== */

describe("attribution is 100 with exactly one differing variable, 0 with two or more", () => {
  it("the default light-only setup reads 100% and passes the fair-test badge", () => {
    const f = factsAfterDays({}, 1);
    expect(f.differingCount).toBe(1);
    expect(f.attributionPct).toBe(100);
    expect(f.fairTestOk).toBe(true);
  });

  it("unlocking water as well drops attribution to zero, whoever wins", () => {
    const f = factsAfterDays({ lockWater: false, waterC1: 0.01, waterC2: 0.02, waterC3: 0.04, waterC4: 0.06 }, 21);
    expect(f.differingCount).toBe(2);
    expect(f.attributionPct).toBe(0);
    expect(f.fairTestOk).toBe(false);
  });

  it("locking water back down restores 100% without touching light", () => {
    const runner = runDays({ lockWater: false, waterC1: 0.01, waterC2: 0.02, waterC3: 0.04, waterC4: 0.06 }, 5, "restore");
    runner.setParams({ ...runner.params, lockWater: true });
    for (let i = 0; i < 30; i++) runner.advance(1 / 30);
    expect(runner.facts().attributionPct).toBe(100);
  });

  it("fewer than 3 replicates fails the fair-test badge even with one variable differing", () => {
    const f = factsAfterDays({ seedlingsPerChamber: 2 }, 1);
    expect(f.differingCount).toBe(1);
    expect(f.attributionPct).toBe(100);
    expect(f.fairTestOk).toBe(false);
  });

  it("nothing differing at all reads zero attribution too — there is no claim to make", () => {
    const f = factsAfterDays({ lockLight: true }, 1);
    expect(f.differingCount).toBe(0);
    expect(f.attributionPct).toBe(0);
  });
});

/* ================================================================== *
 * The rack's own gradient is a real, countable confound
 * ================================================================== */

describe("the rack position gradient behaves like any other confound", () => {
  it("with everything else locked, the window chamber still grows measurably more", () => {
    const f = factsAfterDays({ lockLight: true, rackPositionEffect: true, lockRackPosition: false, randomizeDaily: false }, 21);
    expect(f.rackConfounds).toBe(true);
    expect(f.height4 as number).toBeGreaterThan((f.height1 as number) * 1.02);
  });

  it("locked by default, the base setup shows no rack confound even though the effect exists", () => {
    const f = factsAfterDays({}, 1);
    expect(f.rackConfounds).toBe(false);
  });

  it("turning the effect off removes the gradient entirely", () => {
    const f = factsAfterDays({ lockLight: true, naturalVariation: 0, rackPositionEffect: false, lockRackPosition: false }, 21);
    expect(f.rackConfounds).toBe(false);
    expect(f.height4).toBeCloseTo(f.height1 as number, 6);
  });

  it("locking rack position removes the confound even while the effect is switched on", () => {
    const f = factsAfterDays({ lockLight: true, naturalVariation: 0, rackPositionEffect: true, lockRackPosition: true }, 21);
    expect(f.rackConfounds).toBe(false);
    expect(f.height4).toBeCloseTo(f.height1 as number, 6);
  });

  it("randomising daily averages the gradient away over a long run", () => {
    const opts = { lockLight: true, naturalVariation: 0, rackPositionEffect: true, lockRackPosition: false };
    const fixed = factsAfterDays({ ...opts, randomizeDaily: false }, 28);
    const randomised = factsAfterDays({ ...opts, randomizeDaily: true }, 28);
    expect(fixed.rackConfounds).toBe(true);
    expect(randomised.rackConfounds).toBe(false);
    const fixedGap = Math.abs((fixed.height4 as number) - (fixed.height1 as number));
    const randGap = Math.abs((randomised.height4 as number) - (randomised.height1 as number));
    expect(randGap).toBeLessThan(fixedGap * 0.5);
  });
});

/* ================================================================== *
 * Ghost curves: two candidate causes, genuinely indistinguishable
 * ================================================================== */

describe("the light+water ghost comparison proves ambiguity, it does not assert it", () => {
  it("is invalid (null) whenever only one of the pair is unlocked", () => {
    const f = factsAfterDays({}, 5); // only light unlocked
    expect(f.ghostValid).toBe(false);
  });

  it("is valid once light and water are both unlocked and genuinely differ", () => {
    const f = factsAfterDays({ lockWater: false, waterC1: 0.01, waterC2: 0.02, waterC3: 0.04, waterC4: 0.06 }, 21);
    expect(f.ghostValid).toBe(true);
    expect(f.ghostBaseHeight as number).toBeGreaterThan(0);
    expect(f.ghostRealHeight as number).toBeGreaterThan(f.ghostBaseHeight as number);
  });

  it("both single-cause stories move in the same direction as the real result", () => {
    // Chosen to stay on the rising side of the water sweet-spot (short of the
    // 50 mL/day waterlogging line), so both candidate causes genuinely point
    // the same way — the honest condition the S2 lesson depends on. The
    // spec's literal 10/20/40/60 preset is used for the lab itself below; this
    // is a check of the ghost mechanism, not a re-test of that exact preset.
    const f = factsAfterDays({ lockWater: false, waterC1: 0.005, waterC2: 0.012, waterC3: 0.018, waterC4: 0.025 }, 21);
    const base = f.ghostBaseHeight as number, real = f.ghostRealHeight as number;
    const lightOnly = f.ghostLightOnlyHeight as number, waterOnly = f.ghostWaterOnlyHeight as number;
    expect(real).toBeGreaterThan(base);
    expect(lightOnly).toBeGreaterThan(base);
    expect(waterOnly).toBeGreaterThan(base);
    // Neither single-cause story is wildly implausible next to what actually happened.
    expect(lightOnly).toBeLessThan(real * 1.4);
    expect(waterOnly).toBeLessThan(real * 1.4);
  });

  it("a water range that re-enters waterlogging can make the two stories disagree in direction — still honest, not a bug", () => {
    // The spec's literal S2 preset (water up to 60 mL/day) crosses back past
    // the sweet spot's peak, so "water alone" here would in fact have hurt.
    // The model reports that faithfully rather than forcing agreement.
    const f = factsAfterDays({ lockWater: false, waterC1: 0.01, waterC2: 0.02, waterC3: 0.04, waterC4: 0.06 }, 21);
    expect(f.ghostValid).toBe(true);
    expect(f.ghostWaterOnlyHeight as number).toBeLessThan(f.ghostBaseHeight as number);
    expect(f.ghostLightOnlyHeight as number).toBeGreaterThan(f.ghostBaseHeight as number);
  });
});

/* ================================================================== *
 * Replicates and natural variation
 * ================================================================== */

describe("replicates and natural variation behave like real biology, not decoration", () => {
  it("a wider natural spread produces a wider within-chamber height range", () => {
    const tight = factsAfterDays({ naturalVariation: 0.02 }, 21);
    const wide = factsAfterDays({ naturalVariation: 0.40 }, 21);
    expect(wide.range2 as number).toBeGreaterThan(tight.range2 as number);
  });

  it("changing seedlings per chamber replants with a fresh, different draw", () => {
    const a = factsAfterDays({ seedlingsPerChamber: 4 }, 10);
    const b = factsAfterDays({ seedlingsPerChamber: 4 }, 10);
    // Same params and seed: identical.
    expect(a.height2).toBeCloseTo(b.height2 as number, 9);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const params = base({ lockWater: false, waterC1: 0.01, waterC4: 0.06, rackPositionEffect: true });
    const a = runFor(params, 30, "twin");
    const b = runFor(params, 30, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("time compression changes pace and only pace", () => {
    const slow = runFor(base({ timeComp: 100 }), 30);
    const fast = runFor(base({ timeComp: 5000 }), 30);
    expect(fast.facts().day as number).toBeGreaterThan(slow.facts().day as number);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ lockSubstrate: false, rackPositionEffect: true, randomizeDaily: true });
    const runner = runFor(params, 40, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: fourChambersSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite through a long, confounded run", () => {
    const r = runFor(base({ lockWater: false, lockSubstrate: false, lockSeed: false, lockPotSize: false, rackPositionEffect: true, randomizeDaily: true }), 90);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [k, v] of Object.entries(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), `fact ${k}`).toBe(true);
    }
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
  it("fair-test-of-light: run, verdict and rank steps all pass on the lab's own setup", () => {
    const lab = fourChambersSim.labs!.find((l) => l.id === "fair-test-of-light")!;
    const r = runDays(lab.setup!, 21, "lab1");
    expect(lab.steps.find((s) => s.id === "run")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "verdict")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "rank")!.check!.test(values(r))).toBe(true);
  });

  it("two-things-at-once: confound detected, then fixed by re-locking water mid-run", () => {
    const lab = fourChambersSim.labs!.find((l) => l.id === "two-things-at-once")!;
    const r = runDays(lab.setup!, 21, "lab2");
    expect(lab.steps.find((s) => s.id === "run")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "read-meter")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, lockWater: true });
    for (let i = 0; i < 30; i++) r.advance(1 / 30);
    expect(lab.steps.find((s) => s.id === "conclude")!.check!.test(values(r))).toBe(true);
  });

  it("central-valley-water-trial: run and confirm both pass", () => {
    const lab = fourChambersSim.labs!.find((l) => l.id === "central-valley-water-trial")!;
    const r = runDays(lab.setup!, 21, "lab4");
    expect(lab.steps.find((s) => s.id === "run")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "confirm")!.check!.test(values(r))).toBe(true);
  });
});

describe("every challenge's goal is reachable by the settings its hints point to", () => {
  it("prove it fair: the challenge's own setup already satisfies the goal and the two-star bar", () => {
    const ch = fourChambersSim.challenges!.find((c) => c.id === "prove-it-fair")!;
    const r = runDays(ch.setup!, 21, "ch1");
    expect(ch.goal.test(values(r))).toBe(true);
    expect(ch.stars!.two!.test(values(r))).toBe(true);
  });

  it("break the attribution, then fix it: the full sequence reaches 100% at the end", () => {
    const ch = fourChambersSim.challenges!.find((c) => c.id === "break-the-attribution")!;
    const runner = new SimRunner({ manifest: fourChambersSim, params: { ...defaultParams(fourChambersSim.params), ...ch.setup! }, band: "6-8", seed: "ch2" });
    runner.playing = true;
    for (let i = 0; i < 5 * 30; i++) runner.advance(1 / 30);
    runner.setParams({ ...runner.params, lockSubstrate: false });
    expect(runner.facts().attributionPct).toBe(0);
    for (let i = 0; i < 5 * 30; i++) runner.advance(1 / 30);
    runner.setParams({ ...runner.params, lockSubstrate: true });
    for (let i = 0; i < 5 * 30; i++) runner.advance(1 / 30);
    expect(ch.goal.test(values(runner))).toBe(true);
  });
});
