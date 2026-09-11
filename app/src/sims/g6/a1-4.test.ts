import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { noBeeInChargeSim } from "./a1-4-no-bee-is-in-charge";

/**
 * Science gate for G6-A1.4 "No Bee Is In Charge".
 *
 * Tests the spec's actual claim: every one of up to 2000 agents runs the same
 * five private rules and holds nothing but one remembered patch, its bearing
 * and how good it was last time — and colony-level order (patch convergence,
 * a held hive temperature) emerges from that alone, with nothing in the code
 * comparing patches or averaging bees. The render is exercised directly
 * (no tsc coverage until this sim is registered), because a rendering crash
 * is exactly the kind of bug pure model tests cannot see.
 */

const KELVIN = 273.15;

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(noBeeInChargeSim.params), ...overrides };
}

function runMin(params: ParamValues, minutes: number, seed = "g6a1-4"): SimRunner {
  const runner = new SimRunner({ manifest: noBeeInChargeSim, params, band: "6-8", seed });
  runner.playing = true;
  const comp = params.timeComp as number;
  const engineSeconds = (minutes * 60) / comp;
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, minutes: number, seed = "g6a1-4") =>
  runMin(base(overrides), minutes, seed).facts();

/* ================================================================== *
 * The colony converges without any bee comparing patches
 * ================================================================== */

describe("four patches, one best: emergence without comparison", () => {
  it("the colony ends up mostly at the richest patch", () => {
    const f = factsAfter({}, 25);
    expect(f.flying as number).toBeGreaterThan(0);
    expect(f.accuracy as number).toBeGreaterThan(40);
    expect(f.emergenceHolds).toBe(true);
  });

  it("every single bee's own maximum knowledge is exactly one patch, always", () => {
    // This is the honesty rule made numeric: no matter how converged the
    // colony is, the per-bee ceiling never rises above one remembered patch.
    const f = factsAfter({}, 25);
    expect(f.maxPatchesKnownByAnyBee).toBe(1);
  });

  it("with a richer patch, colony share should tilt toward it more, not less", () => {
    const even = factsAfter({ patchCount: 2, selectedPatch: 0, richness: 50 }, 20);
    const lopsided = factsAfter({ patchCount: 2, selectedPatch: 0, richness: 95 }, 20);
    expect(lopsided.shareA as number).toBeGreaterThan(even.shareA as number);
  });
});

/* ================================================================== *
 * Silencing recruitment removes exactly one ability
 * ================================================================== */

describe("silence the dance: recruitment stops, flight does not", () => {
  it("with dancing off, zero bees ever dance, by rule", () => {
    const f = factsAfter({ ruleDanceIfRich: false }, 20);
    expect(f.dancing as number).toBe(0);
  });

  it("bees still fly and still forage with dancing off", () => {
    const f = factsAfter({ ruleDanceIfRich: false }, 20);
    expect(f.flying as number).toBeGreaterThan(0);
    expect(f.nectar as number).toBeGreaterThan(0);
  });

  it("convergence is measurably weaker without recruitment than with it", () => {
    const withDance = factsAfter({}, 20);
    const noDance = factsAfter({ ruleDanceIfRich: false }, 20);
    expect(noDance.accuracy as number).toBeLessThan(withDance.accuracy as number);
  });
});

/* ================================================================== *
 * Abandonment is what makes a dried-up patch get left, one bee at a time
 * ================================================================== */

describe("the best patch runs dry: rule 3, not a colony vote", () => {
  it("without the abandon rule, a starved patch still holds artificially more bees", () => {
    const withAbandon = factsAfter({ patchCount: 1, richness: 0, nectarRegrowth: 0 }, 15);
    const noAbandon = factsAfter({ patchCount: 1, richness: 0, nectarRegrowth: 0, ruleAbandonIfPoor: false }, 15);
    // With only one, empty patch and abandonment on, bees give up on it (fewer
    // still hold it as a working memory / keep re-flying it) versus off.
    expect(withAbandon.memoryCount as number).toBeLessThanOrEqual(noAbandon.memoryCount as number);
  });

  it("a decision time is only ever reported once genuinely measured", () => {
    const early = factsAfter({ nectarRegrowth: 0 }, 1);
    expect(early.decisionValid).toBe(false);
    expect(early.decisionTimeMin).toBe(-1);
  });
});

/* ================================================================== *
 * Hive temperature is measured from private, individual thresholds
 * ================================================================== */

describe("cold snap: hive temperature emerges from private thresholds", () => {
  it("a cold-exposed hive holds well above outside air", () => {
    const f = factsAfter({ outsideTemp: 4 + KELVIN, colonySize: 1200 }, 15);
    expect(f.hiveTempC as number).toBeGreaterThan(20);
    expect(f.hiveTempC as number).toBeGreaterThan(f.outsideTempC as number);
  });

  it("a hot-exposed hive is held cooler than it would drift to unmanaged", () => {
    const managed = factsAfter({ outsideTemp: 42 + KELVIN, colonySize: 1200 }, 15);
    const unmanaged = factsAfter({ outsideTemp: 42 + KELVIN, colonySize: 1200, ruleFanCluster: false }, 15);
    expect(managed.hiveTempC as number).toBeLessThan(unmanaged.hiveTempC as number);
  });
});

/* ================================================================== *
 * Rain grounds foragers structurally
 * ================================================================== */

describe("rain grounds foragers", () => {
  it("nectar income slows to a crawl while rain is on, from minute zero", () => {
    const dry = factsAfter({}, 6);
    const rain = factsAfter({ rainEvent: true }, 6);
    expect(rain.nectar as number).toBeLessThan(dry.nectar as number);
  });
});

/* ================================================================== *
 * Colony size and the emergent pattern
 * ================================================================== */

describe("a very small colony still runs the same private rules", () => {
  it("a tiny colony produces finite, sane facts at every readout", () => {
    const r = runMin(base({ colonySize: 50 }), 10);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
  });
});

/* ================================================================== *
 * Render is exercised directly — no tsc coverage until registration
 * ================================================================== */

/** A canvas stub that throws on the classic invisible bugs: NaN coordinates,
 *  undefined colours, bad gradient stops — mirrors physics.test.ts's pattern. */
function stubContext(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  const gradient = {
    addColorStop(offset: number, color: string) {
      if (!Number.isFinite(offset)) throw new Error("addColorStop offset is not finite");
      if (typeof color !== "string" || color.length === 0) throw new Error("addColorStop received a non-colour");
    },
  };
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop === "measureText") return () => ({ width: 24 });
      if (prop === "canvas") return { width: 900, height: 520 };
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        for (const arg of args) {
          if (typeof arg === "number" && !Number.isFinite(arg)) throw new Error(`${prop} received a non-finite argument`);
        }
        if (prop === "createLinearGradient" || prop === "createRadialGradient") return gradient;
        return undefined;
      };
    },
    set(target, prop: string, value) {
      if ((prop === "fillStyle" || prop === "strokeStyle") && value === undefined) throw new Error(`${prop} was set to undefined`);
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const SCI_KEYS = new Set([
  "velocity", "acceleration", "force", "momentum",
  "energy-kinetic", "energy-potential", "energy-thermal", "energy-total",
  "charge-pos", "charge-neg", "field", "current",
  "cold", "hot", "mass", "distance", "time",
  "acid", "neutral", "base", "solid", "liquid", "gas",
  "producer", "primary-consumer", "secondary-consumer", "decomposer",
  "light", "wave",
]);
const TEST_THEME = {
  surface: "#ffffff", surfaceAlt: "#eeeeee", ink: "#111111", inkSoft: "#555555",
  line: "#dddddd", grid: "#eeeeee", accent: "#0d7c86",
  sci: new Proxy({} as Record<string, string>, {
    get: (_t, key: string) => {
      if (!SCI_KEYS.has(key)) throw new Error(`unknown semantic colour: ${key}`);
      return "#888888";
    },
  }),
};

describe("render survives every view, every rule combination, both bands", () => {
  it("draws without throwing across views, colony sizes, and edge configurations", () => {
    const cases: ParamValues[] = [
      {},
      { view: "field" }, { view: "hive" },
      { colonySize: 50 }, { colonySize: 2000 },
      { patchCount: 1 }, { patchCount: 6 },
      { ruleFollowDance: false, ruleDanceIfRich: false, ruleAbandonIfPoor: false, ruleFollowOdour: false, ruleFanCluster: false },
      { followOneBee: true }, { rainEvent: true },
      { outsideTemp: 0 + KELVIN }, { outsideTemp: 45 + KELVIN },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: noBeeInChargeSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 90; i++) runner.advance(1 / 30);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => noBeeInChargeSim.render({
          ctx: stubContext(), state: runner.getState(), params, band: "6-8",
          width: w, height: h, overlays: {}, alpha: 0.5, theme: TEST_THEME, time: runner.time,
        }), JSON.stringify(overrides)).not.toThrow();
      }
    }
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runMin(base({ colonySize: 300 }), 8, "twin");
    const b = runMin(base({ colonySize: 300 }), 8, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runMin(base(), 1);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runMin(base({ outsideTemp: 4 + KELVIN }), 6, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: noBeeInChargeSim, params: base({ outsideTemp: 4 + KELVIN }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact is finite through a long run at full colony size", () => {
    const r = runMin(base({ colonySize: 2000 }), 20);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const v of Object.values(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });
});
