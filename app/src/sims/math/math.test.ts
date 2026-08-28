import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, GradeBand, ParamValues } from "@engine/types";

import {
  addFractions, compareFractions, equivalent, fracValue, gcd, lcm,
  mulFractions, operate, reduce, subFractions, fractionsSim,
} from "./fractions";
import {
  curveError, equationText, evaluate, features, functionGrapherSim, mysteryCurve,
} from "./function-grapher";
import type { Coeffs, Family } from "./function-grapher";
import { distribution, drawOutcome, maxDeviation, probabilitySim } from "./probability";
import { EXACT, angleGap, degreesOf, exactAt, safeTan, unitCircleSim } from "./unit-circle";
import { CRITICAL, DF_LABEL, FN_LABEL, df, derivativesSim, f, secantSlope } from "./derivatives";
import type { Fn } from "./derivatives";
import { Rng } from "@engine/rng";

/**
 * These tests exist because a mathematics simulation that is subtly wrong
 * teaches something false with complete confidence. Every claim the sims make
 * on screen — an exact sum, a vertex, a probability, an exact trig value, a
 * derivative — is checked here against the closed form, written out by hand.
 */

const MATH_SIMS: AnySim[] = [
  fractionsSim, functionGrapherSim, probabilitySim, unitCircleSim, derivativesSim,
];

/**
 * A canvas context that records nothing and refuses nothing, so the render
 * functions can be exercised in Node. Drawing bugs — a missing helper, a bad
 * arity, an undefined colour key — surface here rather than in a classroom.
 */
function stubContext(): CanvasRenderingContext2D {
  const target: Record<string, unknown> = {};
  return new Proxy(target, {
    get(store, prop: string) {
      if (prop === "measureText") return () => ({ width: 24 });
      if (prop === "canvas") return { width: 900, height: 520 };
      if (prop in store) return store[prop];
      return () => undefined;
    },
    set(store, prop: string, value) {
      // Colours must always resolve to something drawable, never undefined.
      if ((prop === "fillStyle" || prop === "strokeStyle") && value === undefined) {
        throw new Error(`${prop} was set to undefined`);
      }
      store[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const TEST_THEME = {
  surface: "#ffffff", surfaceAlt: "#eeeeee", ink: "#111111", inkSoft: "#555555",
  line: "#dddddd", grid: "#eeeeee", accent: "#0d7c86",
  sci: new Proxy({} as Record<string, string>, {
    get: (_t, key: string) => {
      // An unknown semantic key is a bug: the palette is a fixed vocabulary.
      if (!SCI_KEYS.has(key)) throw new Error(`unknown semantic colour: ${key}`);
      return "#888888";
    },
  }),
};

/** The semantic palette, exactly as the theme layer publishes it. */
const SCI_KEYS = new Set([
  "velocity", "acceleration", "force", "momentum",
  "energy-kinetic", "energy-potential", "energy-thermal", "energy-total",
  "charge-pos", "charge-neg", "field", "current",
  "cold", "hot", "mass", "distance", "time",
  "acid", "neutral", "base", "solid", "liquid", "gas",
  "producer", "primary-consumer", "secondary-consumer", "decomposer",
  "light", "wave",
]);

function run(sim: AnySim, overrides: ParamValues, seconds: number, band: GradeBand = "9-12", seed = "test") {
  const params = { ...defaultParams(sim.params), ...overrides };
  const runner = new SimRunner({ manifest: sim, params, band, seed });
  runner.playing = true;
  for (let t = 0; t < seconds; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}

/* ------------------------------------------------------------------ *
 * Fractions: exact rational arithmetic
 * ------------------------------------------------------------------ */

describe("fraction arithmetic", () => {
  it("computes a real greatest common divisor", () => {
    expect(gcd(6, 8)).toBe(2);
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(3, 5)).toBe(15);
  });

  it("reduces 6/8 to 3/4", () => {
    expect(reduce({ n: 6, d: 8 })).toEqual({ n: 3, d: 4 });
    expect(reduce({ n: 12, d: 18 })).toEqual({ n: 2, d: 3 });
    expect(reduce({ n: 5, d: 10 })).toEqual({ n: 1, d: 2 });
    expect(reduce({ n: 0, d: 7 })).toEqual({ n: 0, d: 1 });
  });

  it("adds 1/2 + 1/3 to exactly 5/6", () => {
    expect(addFractions({ n: 1, d: 2 }, { n: 1, d: 3 })).toEqual({ n: 5, d: 6 });
  });

  it("adds and simplifies in one step: 1/4 + 1/4 = 1/2", () => {
    expect(addFractions({ n: 1, d: 4 }, { n: 1, d: 4 })).toEqual({ n: 1, d: 2 });
    expect(addFractions({ n: 2, d: 3 }, { n: 1, d: 3 })).toEqual({ n: 1, d: 1 });
  });

  it("subtracts, including past zero", () => {
    expect(subFractions({ n: 3, d: 4 }, { n: 1, d: 2 })).toEqual({ n: 1, d: 4 });
    expect(subFractions({ n: 1, d: 3 }, { n: 1, d: 2 })).toEqual({ n: -1, d: 6 });
  });

  it("multiplies without needing a common denominator", () => {
    expect(mulFractions({ n: 2, d: 3 }, { n: 3, d: 4 })).toEqual({ n: 1, d: 2 });
    expect(mulFractions({ n: 1, d: 2 }, { n: 1, d: 3 })).toEqual({ n: 1, d: 6 });
  });

  it("recognises equivalence exactly, not by decimal comparison", () => {
    expect(equivalent({ n: 1, d: 3 }, { n: 333, d: 999 })).toBe(true);
    expect(equivalent({ n: 3, d: 6 }, { n: 1, d: 2 })).toBe(true);
    expect(equivalent({ n: 2, d: 3 }, { n: 3, d: 4 })).toBe(false);
  });

  it("compares fractions without floating point", () => {
    expect(compareFractions({ n: 1, d: 2 }, { n: 1, d: 3 })).toBe(1);
    // The misconception this sim targets: a bigger denominator is not bigger.
    expect(compareFractions({ n: 1, d: 8 }, { n: 1, d: 3 })).toBe(-1);
    expect(compareFractions({ n: 2, d: 4 }, { n: 1, d: 2 })).toBe(0);
  });

  it("drives the model to the same answers the helpers give", () => {
    const runner = run(fractionsSim, { n1: 1, d1: 2, n2: 1, d2: 3, op: "add" }, 0.2, "6-8");
    const facts = runner.facts();
    expect(facts.resultTop).toBe(5);
    expect(facts.resultBottom).toBe(6);
    expect(facts.lcd).toBe(6);
    expect(facts.rawTop).toBe(5);
    expect(facts.rawBottom).toBe(6);
    expect(runner.readoutValues().result).toBeCloseTo(5 / 6, 12);
  });

  it("shows the unreduced form alongside lowest terms", () => {
    const runner = run(fractionsSim, { n1: 2, d1: 4, n2: 2, d2: 4, op: "add" }, 0.2, "6-8");
    const facts = runner.facts();
    // 2/4 + 2/4 = 8/16 before simplifying, and exactly 1 after.
    expect(facts.rawTop).toBe(16);
    expect(facts.rawBottom).toBe(16);
    expect(facts.resultTop).toBe(1);
    expect(facts.resultBottom).toBe(1);
    expect(facts.needsSimplifying).toBe(true);
  });

  it("flags equivalence in the model", () => {
    const same = run(fractionsSim, { n1: 3, d1: 6, n2: 1, d2: 2, op: "compare" }, 0.2, "3-5");
    expect(same.facts().equal).toBe(true);
    expect(same.facts().differentLooking).toBe(true);
    const diff = run(fractionsSim, { n1: 2, d1: 5, n2: 1, d2: 2, op: "compare" }, 0.2, "3-5");
    expect(diff.facts().equal).toBe(false);
  });

  it("picks the larger fraction when comparing", () => {
    expect(operate({ n: 1, d: 8 }, { n: 1, d: 3 }, "compare")).toEqual({ n: 1, d: 3 });
    expect(fracValue({ n: 3, d: 4 })).toBeCloseTo(0.75, 12);
  });
});

/* ------------------------------------------------------------------ *
 * Function grapher: features in closed form
 * ------------------------------------------------------------------ */

describe("function features", () => {
  it("puts the quadratic vertex at (h, k)", () => {
    const f1 = features("quadratic", { a: 1, b: 1, h: 2, k: -3 });
    expect(f1.vertex).toEqual({ x: 2, y: -3 });
    const f2 = features("quadratic", { a: -2, b: 0.5, h: -1.5, k: 4 });
    expect(f2.vertex).toEqual({ x: -1.5, y: 4 });
  });

  it("finds the quadratic roots of y = (x − 2)² − 4 at 0 and 4", () => {
    const feat = features("quadratic", { a: 1, b: 1, h: 2, k: -4 });
    expect(feat.roots).toHaveLength(2);
    expect(feat.roots[0]).toBeCloseTo(0, 12);
    expect(feat.roots[1]).toBeCloseTo(4, 12);
    // Verified against the graph itself.
    for (const r of feat.roots) {
      expect(evaluate("quadratic", { a: 1, b: 1, h: 2, k: -4 }, r)).toBeCloseTo(0, 10);
    }
  });

  it("gives one repeated root when the vertex sits on the axis", () => {
    expect(features("quadratic", { a: 3, b: 1, h: 1, k: 0 }).roots).toEqual([1]);
  });

  it("gives no roots when the parabola never reaches the axis", () => {
    expect(features("quadratic", { a: 1, b: 1, h: 0, k: 2 }).roots).toHaveLength(0);
  });

  it("computes the quadratic y-intercept a·b²h² + k", () => {
    const c = { a: 2, b: 1, h: 3, k: -1 };
    expect(features("quadratic", c).yIntercept).toBeCloseTo(2 * 9 - 1, 10);
  });

  it("reads the linear slope as a·b and the root as h − k/(ab)", () => {
    const c = { a: 2, b: 1.5, h: 1, k: -3 };
    const feat = features("linear", c);
    expect(feat.slope).toBeCloseTo(3, 12);
    expect(feat.roots[0]).toBeCloseTo(1 + 3 / 3, 12);
    expect(evaluate("linear", c, feat.roots[0])).toBeCloseTo(0, 10);
  });

  it("reports amplitude and period for the sine family", () => {
    const feat = features("sine", { a: 2, b: 2, h: 0, k: 0 });
    expect(feat.amplitude).toBeCloseTo(2, 12);
    expect(feat.period).toBeCloseTo(Math.PI, 12);
    // sin(2x) is zero at every multiple of π/2 inside [−8, 8].
    for (const r of feat.roots) {
      expect(Math.abs(evaluate("sine", { a: 2, b: 2, h: 0, k: 0 }, r))).toBeLessThan(1e-9);
    }
    expect(feat.roots.length).toBe(11);
  });

  it("reports the exponential asymptote and its single root", () => {
    const c = { a: 1, b: 1, h: 0, k: -8 };
    const feat = features("exponential", c);
    expect(feat.asymptote).toBe(-8);
    expect(feat.roots).toHaveLength(1);
    expect(feat.roots[0]).toBeCloseTo(3, 12); // 2³ = 8
    expect(features("exponential", { a: 1, b: 1, h: 0, k: 2 }).roots).toHaveLength(0);
  });

  it("puts the absolute-value vertex at (h, k) with symmetric roots", () => {
    const feat = features("abs", { a: 1, b: 1, h: 1, k: -2 });
    expect(feat.vertex).toEqual({ x: 1, y: -2 });
    expect(feat.roots.map((r) => Math.round(r * 1e9) / 1e9)).toEqual([-1, 3]);
  });

  it("evaluates every family through the same standard form", () => {
    expect(evaluate("linear", { a: 2, b: 1, h: 1, k: 3 }, 4)).toBeCloseTo(9, 12);
    expect(evaluate("quadratic", { a: -1, b: 1, h: 2, k: 4 }, 2)).toBeCloseTo(4, 12);
    expect(evaluate("exponential", { a: 1, b: 1, h: 0, k: 0 }, 3)).toBeCloseTo(8, 12);
    expect(evaluate("sine", { a: 1, b: 1, h: 0, k: 0 }, Math.PI / 2)).toBeCloseTo(1, 12);
    expect(evaluate("abs", { a: 1, b: 1, h: 0, k: 0 }, -5)).toBeCloseTo(5, 12);
  });

  it("writes the equation the way a student would", () => {
    expect(equationText("quadratic", { a: 1, b: 1, h: 0, k: 0 })).toBe("y = x²");
    expect(equationText("quadratic", { a: -1, b: 1, h: 2, k: 4 })).toBe("y = −(x − 2)² + 4");
    expect(equationText("linear", { a: 3, b: 1, h: 0, k: -2 })).toBe("y = 3x − 2");
    expect(equationText("sine", { a: 2, b: 3, h: 0, k: 0 })).toBe("y = 2sin(3x)");
    expect(equationText("abs", { a: 1, b: 1, h: -2, k: 0 })).toBe("y = |x + 2|");
    expect(equationText("abs", { a: -2, b: 2, h: 1, k: 3 })).toBe("y = −2|2(x − 1)| + 3");
    expect(equationText("exponential", { a: 1, b: 1, h: 2, k: -3 })).toBe("y = 2^(x − 2) − 3");
    // Real minus signs throughout, never hyphens.
    expect(equationText("linear", { a: -0.5, b: 1, h: 0, k: 0 })).toBe("y = −0.5x");
    expect(equationText("quadratic", { a: 0, b: 1, h: 0, k: 5 })).toBe("y = 5");
  });

  it("scores an exact match at zero and a mismatch above it", () => {
    const target = mysteryCurve("quadratic", "1") as Coeffs;
    expect(target).toEqual({ a: -1, b: 1, h: 2, k: 4 });
    expect(curveError("quadratic", target, target)).toBe(0);
    expect(curveError("quadratic", { a: 1, b: 1, h: 0, k: 0 }, target)).toBeGreaterThan(1);
    expect(mysteryCurve("quadratic", "off")).toBeNull();
  });

  it("surfaces the same features through the model", () => {
    const runner = run(functionGrapherSim, {
      family: "quadratic", a: 1, b: 1, h: 2, k: -4, mystery: "off",
    }, 0.2);
    const facts = runner.facts();
    expect(facts.vertexX).toBeCloseTo(2, 12);
    expect(facts.vertexY).toBeCloseTo(-4, 12);
    expect(facts.rootCount).toBe(2);
    expect(facts.firstRoot).toBeCloseTo(0, 12);
  });
});

/* ------------------------------------------------------------------ *
 * Probability: exact theory, and convergence towards it
 * ------------------------------------------------------------------ */

describe("probability theory", () => {
  it("gives every device a distribution summing to exactly 1", () => {
    for (const device of ["coin", "die", "spinner", "dice2"] as const) {
      const { labels, theory } = distribution(device, 5);
      expect(labels).toHaveLength(theory.length);
      expect(theory.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 12);
    }
  });

  it("peaks the two-dice sum at 7 with probability 6/36", () => {
    const { labels, theory } = distribution("dice2", 4);
    expect(labels).toEqual(["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
    const seven = labels.indexOf("7");
    expect(theory[seven]).toBeCloseTo(6 / 36, 12);
    expect(theory[labels.indexOf("2")]).toBeCloseTo(1 / 36, 12);
    expect(theory[labels.indexOf("12")]).toBeCloseTo(1 / 36, 12);
    // And 7 really is the unique maximum.
    for (let i = 0; i < theory.length; i++) {
      if (i !== seven) expect(theory[i]).toBeLessThan(theory[seven]);
    }
  });

  it("makes the spinner fair for any sector count", () => {
    for (let s = 2; s <= 8; s++) {
      const { theory } = distribution("spinner", s);
      expect(theory).toHaveLength(s);
      for (const p of theory) expect(p).toBeCloseTo(1 / s, 12);
    }
  });

  it("draws outcomes only inside the valid range", () => {
    const rng = new Rng("draws");
    for (let i = 0; i < 3000; i++) {
      expect(drawOutcome("coin", 4, rng)).toBeGreaterThanOrEqual(0);
      expect(drawOutcome("die", 4, rng)).toBeLessThanOrEqual(5);
      const sum = drawOutcome("dice2", 4, rng);
      expect(sum).toBeGreaterThanOrEqual(0);
      expect(sum).toBeLessThanOrEqual(10);
      expect(drawOutcome("spinner", 5, rng)).toBeLessThanOrEqual(4);
    }
  });

  it("measures the biggest gap from theory", () => {
    expect(maxDeviation([50, 50], [0.5, 0.5], 100)).toBeCloseTo(0, 12);
    expect(maxDeviation([60, 40], [0.5, 0.5], 100)).toBeCloseTo(0.1, 12);
    // No data means maximally uninformed, not perfectly matched.
    expect(maxDeviation([0, 0], [0.5, 0.5], 0)).toBeCloseTo(0.5, 12);
  });

  it("converges towards theory as the number of trials grows", () => {
    const short = run(probabilitySim, { device: "die", batch: "100" }, 0.6, "9-12", "converge");
    const long = run(probabilitySim, { device: "die", batch: "10000" }, 8, "9-12", "converge");
    const shortTrials = short.facts().trials as number;
    const longTrials = long.facts().trials as number;
    expect(shortTrials).toBeGreaterThan(0);
    expect(longTrials).toBeGreaterThan(shortTrials * 20);
    expect(long.facts().maxDeviation as number).toBeLessThan(0.01);
    expect(long.facts().maxDeviation as number).toBeLessThan(short.facts().maxDeviation as number);
  });

  it("lands the experimental two-dice distribution on the theoretical one", () => {
    const runner = run(probabilitySim, { device: "dice2", batch: "10000" }, 12, "9-12", "dice");
    const facts = runner.facts();
    expect(facts.trials as number).toBeGreaterThan(100000);
    expect(facts.mostCommon).toBe("7");
    expect(facts.maxDeviation as number).toBeLessThan(0.005);
    const values = runner.readoutValues();
    expect(values.pPeak).toBeCloseTo(6 / 36, 2);
    expect(values.theoPeak).toBeCloseTo(6 / 36, 12);
  });

  it("gets a fair coin near one half over many flips", () => {
    const runner = run(probabilitySim, { device: "coin", batch: "10000" }, 8, "9-12", "coin");
    expect(runner.readoutValues().p0).toBeCloseTo(0.5, 2);
  });

  it("clears the counts when the device changes but not when the batch does", () => {
    const params = { ...defaultParams(probabilitySim.params), device: "coin", batch: "100" };
    const runner = new SimRunner({ manifest: probabilitySim, params, band: "6-8", seed: "reset" });
    runner.playing = true;
    for (let i = 0; i < 120; i++) runner.advance(1 / 60);
    expect(runner.facts().trials as number).toBeGreaterThan(0);

    runner.setParams({ ...params, batch: "1" });
    expect(runner.facts().trials as number).toBeGreaterThan(0);

    runner.setParams({ ...params, device: "die" });
    expect(runner.facts().trials).toBe(0);
    expect(runner.facts().outcomes).toBe(6);
  });

  it("produces an identical fingerprint for an identical seed", () => {
    const a = run(probabilitySim, { device: "dice2", batch: "100" }, 3, "9-12", "seed-a");
    const b = run(probabilitySim, { device: "dice2", batch: "100" }, 3, "9-12", "seed-a");
    expect(a.fingerprint()).toBe(b.fingerprint());
    const c = run(probabilitySim, { device: "dice2", batch: "100" }, 3, "9-12", "seed-b");
    expect(c.fingerprint()).not.toBe(a.fingerprint());
  });
});

/* ------------------------------------------------------------------ *
 * Unit circle: exact values at the special angles
 * ------------------------------------------------------------------ */

describe("unit circle", () => {
  const cases: { deg: number; sin: number; cos: number }[] = [
    { deg: 0, sin: 0, cos: 1 },
    { deg: 30, sin: 0.5, cos: Math.sqrt(3) / 2 },
    { deg: 45, sin: Math.sqrt(2) / 2, cos: Math.sqrt(2) / 2 },
    { deg: 60, sin: Math.sqrt(3) / 2, cos: 0.5 },
    { deg: 90, sin: 1, cos: 0 },
    { deg: 180, sin: 0, cos: -1 },
    { deg: 270, sin: -1, cos: 0 },
  ];

  it("matches sine and cosine at 0, 30, 45, 60 and 90 degrees", () => {
    for (const c of cases) {
      const rad = (c.deg * Math.PI) / 180;
      expect(Math.sin(rad)).toBeCloseTo(c.sin, 12);
      expect(Math.cos(rad)).toBeCloseTo(c.cos, 12);
    }
  });

  it("labels those angles with the exact values a student must know", () => {
    expect(EXACT[30]).toEqual({ sin: "1/2", cos: "√3/2", tan: "√3/3" });
    expect(EXACT[45]).toEqual({ sin: "√2/2", cos: "√2/2", tan: "1" });
    expect(EXACT[60]).toEqual({ sin: "√3/2", cos: "1/2", tan: "√3" });
    expect(EXACT[90].tan).toBe("undefined");
    expect(EXACT[270].tan).toBe("undefined");
  });

  it("keeps every exact label consistent with the computed value", () => {
    const numeric: Record<string, number> = {
      "0": 0, "1": 1, "−1": -1, "1/2": 0.5, "−1/2": -0.5,
      "√2/2": Math.SQRT2 / 2, "−√2/2": -Math.SQRT2 / 2,
      "√3/2": Math.sqrt(3) / 2, "−√3/2": -Math.sqrt(3) / 2,
      "√3": Math.sqrt(3), "−√3": -Math.sqrt(3),
      "√3/3": Math.sqrt(3) / 3, "−√3/3": -Math.sqrt(3) / 3,
    };
    for (const [degText, exact] of Object.entries(EXACT)) {
      const rad = (Number(degText) * Math.PI) / 180;
      expect(numeric[exact.sin], `sin at ${degText}°`).toBeCloseTo(Math.sin(rad), 10);
      expect(numeric[exact.cos], `cos at ${degText}°`).toBeCloseTo(Math.cos(rad), 10);
      if (exact.tan !== "undefined") {
        expect(numeric[exact.tan], `tan at ${degText}°`).toBeCloseTo(Math.tan(rad), 8);
      } else {
        expect(Math.abs(Math.cos(rad))).toBeLessThan(1e-9);
      }
    }
  });

  it("recognises a special angle and rejects one in between", () => {
    expect(exactAt(Math.PI / 6)?.deg).toBe(30);
    expect(exactAt(Math.PI / 4)?.radians).toBe("π/4");
    expect(exactAt((37 * Math.PI) / 180)).toBeNull();
  });

  it("keeps tangent finite even where it is undefined", () => {
    expect(safeTan(Math.PI / 4)).toBeCloseTo(1, 10);
    expect(safeTan(Math.PI / 3)).toBeCloseTo(Math.sqrt(3), 10);
    expect(Number.isFinite(safeTan(Math.PI / 2))).toBe(true);
    expect(Math.abs(safeTan(Math.PI / 2))).toBeGreaterThan(1e5);
  });

  it("wraps degrees and measures the shortest gap between angles", () => {
    expect(degreesOf(Math.PI)).toBeCloseTo(180, 6);
    expect(degreesOf(3 * Math.PI)).toBeCloseTo(180, 6);
    expect(Math.abs(angleGap(359, 1))).toBeCloseTo(2, 6);
    expect(Math.abs(angleGap(10, 350))).toBeCloseTo(20, 6);
  });

  it("snaps the model onto special angles and reports both units", () => {
    const runner = run(unitCircleSim, { angle: (31 * Math.PI) / 180, spin: 0, snap: true }, 0.1);
    const facts = runner.facts();
    expect(facts.angleDeg as number).toBeCloseTo(30, 6);
    expect(facts.sin as number).toBeCloseTo(0.5, 10);
    expect(facts.isSpecial).toBe(true);
    const values = runner.readoutValues();
    expect(values.angleRad).toBeCloseTo(Math.PI / 6, 10);
    expect(values.cos).toBeCloseTo(Math.sqrt(3) / 2, 10);
  });

  it("walks the point around the circle when it spins", () => {
    const runner = run(unitCircleSim, { angle: 0, spin: 1, snap: false }, 2);
    expect(runner.facts().angleDeg as number).toBeGreaterThan(90);
  });
});

/* ------------------------------------------------------------------ *
 * Derivatives: the secant converges on the analytic tangent
 * ------------------------------------------------------------------ */

describe("derivatives", () => {
  it("differentiates x² to 2x at several points", () => {
    for (const x of [-2, -0.5, 0, 1, 2.5, 3]) {
      expect(df("square", x)).toBeCloseTo(2 * x, 12);
    }
  });

  it("differentiates every family symbolically", () => {
    for (const x of [-2, -1, -0.25, 0, 0.75, 2]) {
      expect(df("cubic", x)).toBeCloseTo(x * x - 1, 12);
      expect(df("sine", x)).toBeCloseTo(Math.cos(x), 12);
      expect(df("exp", x)).toBeCloseTo(Math.exp(x), 12);
    }
  });

  it("has the secant slope approach the analytic derivative as h shrinks", () => {
    const fns: Fn[] = ["square", "cubic", "sine", "exp"];
    for (const fn of fns) {
      for (const x of [-1.5, -0.4, 0.9, 2]) {
        const exact = df(fn, x);
        let previous = Number.POSITIVE_INFINITY;
        for (const h of [1, 0.1, 0.01, 0.001, 0.0001]) {
          const err = Math.abs(secantSlope(fn, x, h) - exact);
          expect(err).toBeLessThan(previous);
          previous = err;
        }
        expect(previous).toBeLessThan(1e-3);
      }
    }
  });

  it("gets the same limit approaching from the left", () => {
    for (const fn of ["square", "cubic", "sine", "exp"] as Fn[]) {
      const left = secantSlope(fn, 1, -1e-6);
      const right = secantSlope(fn, 1, 1e-6);
      expect(left).toBeCloseTo(df(fn, 1), 4);
      expect(right).toBeCloseTo(df(fn, 1), 4);
    }
  });

  it("gives x² a secant slope of exactly 2x + h", () => {
    expect(secantSlope("square", 1, 1)).toBeCloseTo(3, 12);
    expect(secantSlope("square", 1, 0.1)).toBeCloseTo(2.1, 12);
    expect(secantSlope("square", 3, 0.5)).toBeCloseTo(6.5, 12);
  });

  it("lists the critical points and they really are flat", () => {
    expect(CRITICAL.square).toEqual([0]);
    expect(CRITICAL.cubic).toEqual([-1, 1]);
    expect(CRITICAL.exp).toEqual([]);
    for (const [fn, xs] of Object.entries(CRITICAL) as [Fn, number[]][]) {
      for (const x of xs) expect(Math.abs(df(fn, x))).toBeLessThan(1e-12);
    }
  });

  it("evaluates the functions the labels advertise", () => {
    expect(FN_LABEL.cubic).toBe("f(x) = x³/3 − x");
    expect(DF_LABEL.cubic).toBe("f ′(x) = x² − 1");
    expect(f("cubic", 3)).toBeCloseTo(9 - 3, 12);
    expect(f("square", -4)).toBeCloseTo(16, 12);
    expect(f("exp", 0)).toBeCloseTo(1, 12);
    expect(f("sine", Math.PI / 2)).toBeCloseTo(1, 12);
  });

  it("reports an exact tangent and a shrinking error through the model", () => {
    // Zero seconds: the point stays exactly where it was placed, so the
    // numbers below are the ones a paused student would read off the screen.
    const coarse = run(derivativesSim, { fn: "square", x0: 1, hExp: 0 }, 0);
    const fine = run(derivativesSim, { fn: "square", x0: 1, hExp: -4 }, 0);
    expect(coarse.readoutValues().tangent).toBeCloseTo(2, 12);
    expect(coarse.readoutValues().secant).toBeCloseTo(3, 10);
    expect(fine.readoutValues().secant).toBeCloseTo(2, 3);
    expect(fine.facts().error as number).toBeLessThan(coarse.facts().error as number);
  });

  it("finds both flat points of x³/3 − x when the point sweeps", () => {
    const runner = run(derivativesSim, { fn: "cubic", x0: -3, hExp: -2 }, 14);
    const facts = runner.facts();
    expect(facts.zerosExpected).toBe(2);
    expect(facts.allZerosFound).toBe(true);
    expect(facts.sweptSpan as number).toBeGreaterThan(5.5);
  });
});

/* ------------------------------------------------------------------ *
 * Manifest integrity, shared by all five
 * ------------------------------------------------------------------ */

describe("math sim manifests", () => {
  it("registers five distinct mathematics ids", () => {
    const ids = MATH_SIMS.map((s) => s.id);
    expect(ids).toEqual([
      "math.fractions", "math.functions", "math.probability",
      "math.unit-circle", "math.derivatives",
    ]);
    expect(new Set(ids).size).toBe(5);
    for (const sim of MATH_SIMS) expect(sim.subject).toBe("math");
  });

  it("exposes finite readouts from the first frame at every band", () => {
    for (const sim of MATH_SIMS) {
      for (const band of sim.bands) {
        const runner = new SimRunner({
          manifest: sim, params: defaultParams(sim.params), band,
        });
        for (const r of runner.readouts()) {
          expect(Number.isFinite(r.quantity.value), `${sim.id}/${band}/${r.key}`).toBe(true);
        }
      }
    }
  });

  it("keeps readouts finite after running, for every option value", () => {
    for (const sim of MATH_SIMS) {
      for (const [key, spec] of Object.entries(sim.params)) {
        if (spec.type !== "option") continue;
        for (const option of spec.options) {
          const runner = run(sim, { [key]: option.value }, 1.5);
          for (const r of runner.readouts()) {
            expect(
              Number.isFinite(r.quantity.value),
              `${sim.id} ${key}=${option.value} ${r.key}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("keeps every default parameter inside its own range", () => {
    for (const sim of MATH_SIMS) {
      for (const [key, spec] of Object.entries(sim.params)) {
        if (spec.type === "number") {
          expect(spec.default, `${sim.id}.${key} below min`).toBeGreaterThanOrEqual(spec.min);
          expect(spec.default, `${sim.id}.${key} above max`).toBeLessThanOrEqual(spec.max);
          for (const mark of spec.marks ?? []) {
            expect(mark.value, `${sim.id}.${key} mark out of range`).toBeGreaterThanOrEqual(spec.min);
            expect(mark.value).toBeLessThanOrEqual(spec.max);
          }
        }
        if (spec.type === "option") {
          expect(spec.options.map((o) => o.value)).toContain(spec.default);
        }
      }
    }
  });

  it("opens every lab with a prediction and declares supported bands", () => {
    for (const sim of MATH_SIMS) {
      expect(sim.labs?.length, `${sim.id} labs`).toBeGreaterThanOrEqual(2);
      expect(sim.challenges?.length, `${sim.id} challenges`).toBeGreaterThanOrEqual(1);
      for (const lab of sim.labs ?? []) {
        expect(lab.steps[0].predict, `${lab.id} must open with a prediction`).toBeDefined();
        const predict = lab.steps[0].predict!;
        expect(predict.correct).toBeGreaterThanOrEqual(0);
        expect(predict.correct).toBeLessThan(predict.options.length);
        for (const band of lab.bands) expect(sim.bands).toContain(band);
      }
      for (const ch of sim.challenges ?? []) {
        for (const band of ch.bands) expect(sim.bands).toContain(band);
      }
    }
  });

  it("only sets parameters that exist in lab and challenge setups", () => {
    for (const sim of MATH_SIMS) {
      const keys = Object.keys(sim.params);
      for (const lab of sim.labs ?? []) {
        for (const key of Object.keys(lab.setup ?? {})) {
          expect(keys, `${sim.id}/${lab.id} sets unknown ${key}`).toContain(key);
        }
      }
      for (const ch of sim.challenges ?? []) {
        for (const key of Object.keys(ch.setup ?? {})) {
          expect(keys, `${sim.id}/${ch.id} sets unknown ${key}`).toContain(key);
        }
      }
    }
  });

  it("draws without throwing, at every band and every option value", () => {
    for (const sim of MATH_SIMS) {
      const combos: ParamValues[] = [{}];
      for (const [key, spec] of Object.entries(sim.params)) {
        if (spec.type !== "option") continue;
        for (const option of spec.options) combos.push({ [key]: option.value });
      }
      for (const overrides of combos) {
        for (const band of sim.bands) {
          const params = { ...defaultParams(sim.params), ...overrides };
          const runner = new SimRunner({ manifest: sim, params, band, seed: "draw" });
          runner.playing = true;
          for (let i = 0; i < 90; i++) runner.advance(1 / 60);
          const overlays: Record<string, boolean> = {};
          for (const o of sim.overlays ?? []) overlays[o.key] = o.default;
          // Both a wide stage and a cramped one: layouts must survive either.
          for (const [w, h] of [[900, 520], [320, 240]]) {
            expect(() => sim.render({
              ctx: stubContext(), state: runner.getState(), params, band,
              width: w, height: h, overlays, alpha: 0.5, theme: TEST_THEME, time: runner.time,
            })).not.toThrow();
          }
        }
      }
    }
  });

  it("names only families the grapher actually implements", () => {
    const families = (functionGrapherSim.params.family as { options: { value: string }[] }).options;
    for (const opt of families) {
      const feat = features(opt.value as Family, { a: 1, b: 1, h: 0, k: 0 });
      expect(Number.isFinite(feat.yIntercept)).toBe(true);
    }
  });
});
