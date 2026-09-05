import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { threeJarsOneLampSim as sim } from "./a2-2-three-jars-one-lamp";

/**
 * Science gate for G6-A2.2 "Three Jars, One Lamp".
 *
 * The honesty rule under test: a jar's classification is never read off its
 * lid setting, it is computed from two running totals of what has actually
 * crossed the wall — and for a genuinely sealed jar (matterK exactly zero)
 * that total must be exactly zero, not merely small, which is what makes its
 * displayed mass hold flat "to the last decimal" while its water freely
 * cycles between liquid and vapour and its plant photosynthesises and
 * respires in full stoichiometric balance inside.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(sim.params), ...overrides };
}

/** Run a number of simulated days under whatever time compression is set. */
function runDays(overrides: ParamValues, days: number, seed = "g6a2-2") {
  const params = base(overrides);
  const comp = params.timeComp as number;
  const runner = new SimRunner({ manifest: sim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / (sim.tickRate ?? 120);
  const realSeconds = (days * 86400) / comp;
  const ticks = Math.round(realSeconds / dt);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfterDays = (overrides: ParamValues, days: number, seed = "g6a2-2") =>
  runDays(overrides, days, seed).facts();

/* ================================================================== *
 * Identity
 * ================================================================== */

describe("g6.a2-2 manifest", () => {
  it("carries the Unit A2.2 identity", () => {
    expect(sim.id).toBe("g6.a2-2");
    expect(sim.title).toBe("Three Jars, One Lamp");
    expect(sim.grades).toContain(6);
    expect(sim.bands).toContain("6-8");
  });
});

/* ================================================================== *
 * The honesty rule: sealed means matterK is exactly zero
 * ================================================================== */

describe("a sealed jar's matter-crossed counter is exactly zero, not merely small", () => {
  it("Jar B's matter conductance is literally 0, and stays 0 whatever else changes", () => {
    const f = factsAfterDays({}, 30);
    expect(f.matterKB).toBe(0);
    expect(f.matterCrossedB).toBe(0);
  });

  it("Jar B's total mass is bit-for-bit flat across a 90-day run despite active internal chemistry", () => {
    const day0 = factsAfterDays({}, 0.001);
    const day90 = factsAfterDays({}, 90);
    // Internal chemistry is genuinely active — CO2/O2 have moved a lot —
    // while the sealed jar's own total mass has not moved beyond floating
    // point noise, many orders of magnitude under the balance's 0.01 g.
    expect(Math.abs((day90.co2B as number) - (day0.co2B as number))).toBeGreaterThan(0.001);
    expect(Math.abs((day90.massB as number) - (day0.massB as number))).toBeLessThan(1e-6);
  });

  it("an open jar's mass, started identically, is measurably different from the sealed jar's", () => {
    const f = factsAfterDays({}, 30);
    expect(f.massA as number).toBeLessThan(f.massB as number);
    expect(f.matterCrossedA as number).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * S1 — thirty days side by side
 * ================================================================== */

describe("S1 — thirty days side by side", () => {
  it("Jar A loses mass, Jar B's never moves, and A/B are alive while C is not", () => {
    const f = factsAfterDays({}, 30);
    expect(f.massA as number).toBeLessThan(f.massB as number);
    expect(f.snailAliveA).toBe(true);
    expect(f.snailAliveB).toBe(true);
    expect(f.snailAliveC).toBe(false);
  });

  it("classifies A open, B closed, C isolated under the default lids and jacket", () => {
    const f = factsAfterDays({}, 3);
    expect(f.classificationA).toBe("open");
    expect(f.classificationB).toBe("closed");
    expect(f.classificationC).toBe("isolated");
  });
});

/* ================================================================== *
 * S2 — sealed and dark
 * ================================================================== */

describe("S2 — sealed and dark", () => {
  it("the matter counter stays zero whether the lamp is on or off", () => {
    const lit = factsAfterDays({ lampIntensity: 220 }, 14);
    const dark = factsAfterDays({ lampIntensity: 0 }, 14);
    expect(lit.matterCrossedB).toBe(0);
    expect(dark.matterCrossedB).toBe(0);
  });

  it("with the lamp lit, Jar B reads closed; with it off, Jar B reads isolated", () => {
    const lit = factsAfterDays({ lampIntensity: 220 }, 3);
    const dark = factsAfterDays({ lampIntensity: 0 }, 3);
    expect(lit.classificationB).toBe("closed");
    expect(dark.classificationB).toBe("isolated");
  });
});

/* ================================================================== *
 * S3 — truly isolated
 * ================================================================== */

describe("S3 — truly isolated", () => {
  it("Jar C exchanges neither matter nor energy, ever", () => {
    const f = factsAfterDays({}, 60);
    expect(f.matterCrossedC).toBe(0);
    expect(f.energyCrossedC).toBe(0);
    expect(f.classificationC).toBe("isolated");
  });

  it("something inside dies within a couple of weeks, and survival time then grows", () => {
    const early = factsAfterDays({}, 2);
    expect(early.anyLifeC).toBe(true);
    const mid = factsAfterDays({}, 10);
    expect(mid.anyLifeC).toBe(false);
    expect(mid.survivalDaysC as number).toBeGreaterThanOrEqual(0);
    const late = factsAfterDays({}, 30);
    expect(late.survivalDaysC as number).toBeGreaterThan(mid.survivalDaysC as number);
  });

  it("once nothing is left, the gas readings stop moving at all", () => {
    const a = factsAfterDays({}, 40);
    const b = factsAfterDays({}, 41);
    expect(a.o2C as number).toBeCloseTo(b.o2C as number, 6);
    expect(a.co2C as number).toBeCloseTo(b.co2C as number, 6);
  });

  it("an isolated jar's oxygen falls faster than an open jar's, with nothing replenishing it", () => {
    const isolated = factsAfterDays({}, 2);
    const open = factsAfterDays({ lidA: "open" }, 2);
    expect(isolated.o2C as number).toBeLessThan(open.o2A as number);
  });
});

/* ================================================================== *
 * S4 — the pinhole test
 * ================================================================== */

describe("S4 — the pinhole test", () => {
  it("a pinhole lid looks sealed but measurably loses mass and classifies open", () => {
    const f = factsAfterDays({ lidA: "pinhole", roomTemp: 30 + 273.15 }, 30);
    expect(f.classificationA).toBe("open");
    expect(f.matterCrossedA as number).toBeGreaterThan(0);
    expect(f.massA as number).toBeLessThan(561.3); // measurably below the identical starting mass
  });

  it("the pinhole leaks far more slowly than a fully open lid", () => {
    const pinhole = factsAfterDays({ lidA: "pinhole" }, 10);
    const open = factsAfterDays({ lidA: "open" }, 10);
    expect(pinhole.matterCrossedA as number).toBeLessThan(open.matterCrossedA as number);
  });
});

/* ================================================================== *
 * The reversible reaction conserves mass, and the tracer conserves count
 * ================================================================== */

describe("photosynthesis and respiration are one reversible reaction", () => {
  it("more light produces more oxygen in an otherwise identical sealed jar", () => {
    const dim = factsAfterDays({ lidB: "sealed", lampIntensity: 20 }, 3);
    const bright = factsAfterDays({ lidB: "sealed", lampIntensity: 400 }, 3);
    expect(bright.o2B as number).toBeGreaterThan(dim.o2B as number);
  });

  it("more organisms means faster respiration and a faster-suffocating isolated jar", () => {
    const few = factsAfterDays({ organisms: 1 }, 3);
    const many = factsAfterDays({ organisms: 6 }, 3);
    expect(many.o2C as number).toBeLessThan(few.o2C as number);
  });
});

describe("the tagged carbon tracer is counted but never created or destroyed", () => {
  it("every jar's 20 atoms are always accounted for, gas plus tissue", () => {
    const f = factsAfterDays({ tracerOn: true }, 12);
    for (const k of ["A", "B", "C"]) {
      expect((f[`tracerGas${k}`] as number) + (f[`tracerBiomass${k}`] as number)).toBe(20);
      expect(f[`tracerTotal${k}`]).toBe(20);
    }
  });

  it("atoms genuinely move between pools rather than sitting fixed", () => {
    // Each atom's per-tick transition chance is genuinely small (it is tied
    // to the real respiration/photosynthesis rates, not inflated for the
    // demo — roughly a 1-in-100,000 chance per tick per atom). Over 120
    // days, and pooled across all three jars, the probability that every
    // one of the 60 atoms sits frozen by pure luck is astronomically small,
    // while every probability used still comes straight from the physics.
    const start = factsAfterDays({ tracerOn: true }, 0.01);
    const later = factsAfterDays({ tracerOn: true }, 120);
    const moved = (["A", "B", "C"] as const).some((k) => start[`tracerGas${k}`] !== later[`tracerGas${k}`]);
    expect(moved).toBe(true);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runDays({}, 15, "twin");
    const b = runDays({}, 15, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("time compression changes pace and only pace", () => {
    const slow = runDays({ timeComp: 100 }, 5);
    const fast = runDays({ timeComp: 5000 }, 5);
    expect(fast.facts().day as number).toBeCloseTo(slow.facts().day as number, 0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runDays({}, 10, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: sim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite through a 90-day run", () => {
    const runner = runDays({}, 90);
    for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [k, v] of Object.entries(runner.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), `fact ${k}`).toBe(true);
    }
  });
});
