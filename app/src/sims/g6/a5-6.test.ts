import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { runMyPlanSim } from "./a5-6-run-my-plan";

/**
 * Science gate for G6-A5.6 "Run My Plan: The Ecocolumn Trial".
 *
 * Tests the spec's actual claim: the procedure executor is completely
 * literal. It runs exactly the columns, interval, duration and
 * randomisation the controls specify and repairs nothing — a sampling
 * interval that is an exact multiple of 24 h genuinely, mathematically
 * hides a real daily oxygen swing (a real Nyquist-aliasing effect, not a
 * penalty rule), and an unrandomised shelf genuinely lets a real
 * lamp-and-window gradient ride along with whatever the plan is testing.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(runMyPlanSim.params), ...overrides };
}

function runFor(params: ParamValues, realSeconds: number, seed = "gate"): SimRunner {
  const runner = new SimRunner({ manifest: runMyPlanSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  for (let i = 0; i < Math.round(realSeconds * 30); i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, realSeconds: number, seed = "gate") =>
  runFor(base(overrides), realSeconds, seed).facts();

/* ================================================================== *
 * The sampling interval genuinely aliases with the real 24 h swing
 * ================================================================== */

describe("sampling interval: a real Nyquist effect, not a penalty rule", () => {
  it("an interval past 12 h cannot resolve the daily swing; 12 h or under can", () => {
    for (const interval of [3, 6, 12]) {
      expect(factsAfter({ measurementIntervalH: interval }, 1).resolvesSwing, `${interval}h`).toBe(true);
    }
    for (const interval of [13, 24, 168]) {
      expect(factsAfter({ measurementIntervalH: interval }, 1).resolvesSwing, `${interval}h`).toBe(false);
    }
  });

  it("a fine interval records essentially the whole true swing; a coarse one hides most of it", () => {
    const fine = factsAfter({ measurementIntervalH: 3, durationDays: 14 }, 130);
    const coarse = factsAfter({ measurementIntervalH: 24, durationDays: 14 }, 130);
    expect(fine.swingHiddenFraction as number).toBeLessThan(0.05);
    expect(coarse.swingHiddenFraction as number).toBeGreaterThan(0.8);
    expect(fine.trueSwing).toBeCloseTo(coarse.trueSwing as number, 1); // same underlying biology
    expect(fine.recordedSwing as number).toBeGreaterThan(coarse.recordedSwing as number);
  });

  it("168 h and 24 h alias identically: both are exact multiples of the 24 h cycle", () => {
    // The spec's own named example: sampling every 168 h always lands on
    // the same clock hour, exactly as thoroughly as sampling every 24 h.
    const a = factsAfter({ measurementIntervalH: 24, durationDays: 14 }, 130);
    const b = factsAfter({ measurementIntervalH: 168, durationDays: 14 }, 130);
    expect(b.swingHiddenFraction).toBeCloseTo(a.swingHiddenFraction as number, 2);
    expect(a.resolvesSwing).toBe(false);
    expect(b.resolvesSwing).toBe(false);
  });
});

/* ================================================================== *
 * Position is a real confound unless randomised, whatever the treatment is
 * ================================================================== */

describe("shelf position: a real gradient the plan can accidentally test instead", () => {
  it("even with no treatment declared, columns still differ, because the shelf gradient is real", () => {
    const f = factsAfter({ independentVariable: "none", columnsBuilt: 4 }, 10);
    expect(f.oxygenRangeAcrossColumns as number).toBeGreaterThan(0);
  });

  it("declaring a real treatment adds to, and is entangled with, that same gradient unless randomised", () => {
    const none = factsAfter({ independentVariable: "none", columnsBuilt: 4 }, 10);
    const treated = factsAfter({ independentVariable: "light", ivLow: 2, ivHigh: 20, columnsBuilt: 4 }, 10);
    expect(treated.oxygenRangeAcrossColumns as number).toBeGreaterThan(none.oxygenRangeAcrossColumns as number);
  });

  it("the scorecard flags an unrandomised shelf as a live, result-explaining confound only when a real treatment exists", () => {
    expect(factsAfter({ randomizePositions: false, independentVariable: "light" }, 1).gradientCouldExplainResult).toBe(true);
    expect(factsAfter({ randomizePositions: true, independentVariable: "light" }, 1).gradientCouldExplainResult).toBe(false);
    // No treatment means nothing is being falsely attributed to it, whether
    // or not positions happen to be randomised.
    expect(factsAfter({ randomizePositions: false, independentVariable: "none" }, 1).gradientCouldExplainResult).toBe(false);
  });
});

/* ================================================================== *
 * The design scorecard: seven real, independently controlled criteria
 * ================================================================== */

describe("the design scorecard never repairs a plan, only reports it", () => {
  it("each criterion flips on exactly its own control and nothing else", () => {
    expect(factsAfter({ independentVariable: "none" }, 1).testableQuestion).toBe(false);
    expect(factsAfter({ independentVariable: "light" }, 1).testableQuestion).toBe(true);

    expect(factsAfter({ controlledVariablesStated: false }, 1).controlledVariablesOk).toBe(false);
    expect(factsAfter({ controlledVariablesStated: true }, 1).controlledVariablesOk).toBe(true);

    expect(factsAfter({ columnsBuilt: 1 }, 1).replicatesOk).toBe(false);
    expect(factsAfter({ columnsBuilt: 3 }, 1).replicatesOk).toBe(true);

    expect(factsAfter({ instrumentPrecision: "ruler" }, 1).instrumentOk).toBe(false);
    expect(factsAfter({ instrumentPrecision: "doProbe" }, 1).instrumentOk).toBe(true);

    expect(factsAfter({ durationDays: 3 }, 1).durationOk).toBe(false);
    expect(factsAfter({ durationDays: 14 }, 1).durationOk).toBe(true);

    expect(factsAfter({ randomizePositions: false }, 1).positionRandomisedOk).toBe(false);
    expect(factsAfter({ randomizePositions: true }, 1).positionRandomisedOk).toBe(true);
  });

  it("the default plan is deliberately imperfect: the sim decides what the shelf actually tests", () => {
    const f = factsAfter({}, 1);
    expect(f.conclusionSupported).toBe(false);
    expect((f.failingCriteria as string).length).toBeGreaterThan(0);
    expect(f.designScorePct as number).toBeLessThan(100);
  });

  it("a plan that satisfies every criterion scores a genuine 100%, with nothing left failing", () => {
    const f = factsAfter({
      independentVariable: "light", controlledVariablesStated: true, columnsBuilt: 4,
      instrumentPrecision: "doProbe", measurementIntervalH: 6, durationDays: 14, randomizePositions: true,
    }, 1);
    expect(f.designScorePct).toBe(100);
    expect(f.failingCriteria).toBe("");
    expect(f.conclusionSupported).toBe(true);
  });
});

/* ================================================================== *
 * The biology underneath is unaffected by the plan's own quality
 * ================================================================== */

describe("the biology runs the same regardless of how well the plan can see it", () => {
  it("radish height grows over time toward, but never past, its physical maximum", () => {
    const early = factsAfter({}, 1);
    const mid = factsAfter({}, 50);
    const late = factsAfter({}, 130);
    expect(mid.meanHeight as number).toBeGreaterThan(early.meanHeight as number);
    expect(late.meanHeight as number).toBeGreaterThan(mid.meanHeight as number);
    expect(late.meanHeight as number).toBeLessThan(120); // RADISH_MAX_MM; facts() reports raw mm
  });

  it("time compression changes only the pace, never the biology at a given simulated day", () => {
    const slow = factsAfter({ timeCompression: 500 }, 50 * (10000 / 500));
    const fast = factsAfter({ timeCompression: 50000 }, 50 * (10000 / 50000));
    expect(slow.day as number).toBeCloseTo(fast.day as number, 1);
    expect(slow.meanHeight as number).toBeCloseTo(fast.meanHeight as number, 4);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism, reset, and finiteness", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base({ independentVariable: "water" }), 8, "twin");
    const b = runFor(base({ independentVariable: "water" }), 8, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runFor(base(), 1);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base({ columnsBuilt: 6 }), 5, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: runMyPlanSim, params: base({ columnsBuilt: 6 }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and numeric fact stays finite through a long run at max columns", () => {
    const r = runFor(base({ columnsBuilt: 12, durationDays: 60 }), 130);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), ro.key).toBe(true);
    for (const [k, v] of Object.entries(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), k).toBe(true);
    }
  });
});

/* ================================================================== *
 * Render is exercised directly — no tsc coverage until registration
 * ================================================================== */

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

describe("render survives every column count, every treatment, both bands", () => {
  it("draws without throwing across column counts, treatments, and toggles", () => {
    const cases: ParamValues[] = [
      {},
      { columnsBuilt: 1 }, { columnsBuilt: 12 },
      { independentVariable: "water" }, { independentVariable: "litter" }, { independentVariable: "snails" },
      { randomizePositions: true },
      { instrumentPrecision: "thermometer" }, { instrumentPrecision: "balance" },
      { measurementIntervalH: 168, durationDays: 60 },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: runMyPlanSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 60; i++) runner.advance(1 / 30);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => runMyPlanSim.render({
          ctx: stubContext(), state: runner.getState(), params, band: "6-8",
          width: w, height: h, overlays: {}, alpha: 0.5, theme: TEST_THEME, time: runner.time,
        }), JSON.stringify(overrides)).not.toThrow();
      }
    }
  });
});
