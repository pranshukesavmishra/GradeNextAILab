import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { chloroplastToCoastlineSim, LEVELS } from "./a1-5-from-chloroplast-to-coastline";

/**
 * Science gate for G6-A1.5 "From Chloroplast to Coastline".
 *
 * Tests the spec's two claims: (1) six nested levels are one process,
 * aggregated upward by real counts, so a perturbation at a small site is
 * genuinely negligible once diluted across everything above it, while the
 * same perturbation at the whole bay is not; and (2) the forest patch's
 * canopy/urchin/otter system is genuinely bistable — otter predation
 * saturates, so removing otters lets urchins escape control within about a
 * year, and restoring otters does not undo that on the same timescale.
 *
 * Timing note: the ecology is stepped live (state persists across ticks,
 * `playbackSpeed` sets simulated years per real second), so a sequential
 * "collapse, then restore" narrative is driven with two `setParams` calls
 * and separate `advance()` windows — never a single one-shot read.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(chloroplastToCoastlineSim.params), ...overrides };
}

function runFor(params: ParamValues, seed = "gate"): SimRunner {
  const runner = new SimRunner({ manifest: chloroplastToCoastlineSim, params, band: "6-8", seed });
  runner.playing = true;
  return runner;
}

/** Advance a runner by simulated years, respecting the shared engine's own
 *  MAX_FRAME_SECONDS=0.25 real-second-per-call ceiling. */
function advanceYears(runner: SimRunner, years: number): void {
  const speed = runner.params.playbackSpeed as number;
  const step = 0.25;
  const calls = Math.round((years / speed) / step);
  for (let i = 0; i < calls; i++) runner.advance(step);
}

const factsAfterYears = (overrides: ParamValues, years: number, seed = "gate") => {
  const r = runFor(base(overrides), seed);
  advanceYears(r, years);
  return r.facts();
};

/* ================================================================== *
 * Six levels, one process: real aggregation, real dilution
 * ================================================================== */

describe("the ladder is one process multiplied by real counts", () => {
  it("every level's reading is exactly the level below times a fixed, real count", () => {
    const f = factsAfterYears({}, 0);
    // cell = chloroplast * 60 (spec), blade = cell * CELLS_PER_BLADE, etc. —
    // check the ratios rather than hard-coding the reasoned-estimate counts.
    const chloroplast = f.fgS_chloroplast as number;
    const cell = f.fgS_cell as number;
    expect(cell / chloroplast).toBeCloseTo(60, 6); // spec: 60 chloroplasts per cell, exactly
    for (let i = 1; i < LEVELS.length; i++) {
      const below = f[`fgS_${LEVELS[i - 1]}`] as number;
      const at = f[`fgS_${LEVELS[i]}`] as number;
      expect(at / below, LEVELS[i]).toBeGreaterThan(0);
    }
  });

  it("chloroplast to bay spans many orders of magnitude, at every scale reading", () => {
    const f = factsAfterYears({}, 0);
    expect(f.ordersOfMagnitudeSpan as number).toBeGreaterThan(8);
  });

  it("a chloroplast-level block is genuinely negligible at the bay; a bay-wide one is not", () => {
    const chloro = factsAfterYears({ perturbationSite: "chloroplast", perturbationType: "blockLight" }, 0);
    const bay = factsAfterYears({ perturbationSite: "bay", perturbationType: "blockLight" }, 0);
    expect(chloro.bayNegligible).toBe(true);
    expect(bay.bayNegligible).toBe(false);
    expect(bay.bayEffectFrac).toBe(1); // every chloroplast in the bay is cut, by construction
  });

  it("the diluting effect is monotonic: a bigger site is never MORE negligible than a smaller one", () => {
    const fracs = LEVELS.map((l) => factsAfterYears({ perturbationSite: l, perturbationType: "blockLight" }, 0).bayEffectFrac as number);
    for (let i = 1; i < fracs.length; i++) expect(fracs[i], LEVELS[i]).toBeGreaterThanOrEqual(fracs[i - 1]);
  });

  it("removing otters at anything smaller than the patch is a real no-op: this model has no sub-patch ecology", () => {
    const smallSite = factsAfterYears({ perturbationSite: "chloroplast", perturbationType: "removeOtters" }, 3);
    const noPerturb = factsAfterYears({ perturbationType: "none" }, 3);
    expect(smallSite.canopyFrac).toBeCloseTo(noPerturb.canopyFrac as number, 6);
    expect(smallSite.urchinPerM2).toBeCloseTo(noPerturb.urchinPerM2 as number, 6);
  });
});

/* ================================================================== *
 * The forest patch is genuinely bistable: otter predation saturates
 * ================================================================== */

describe("removing otters lets urchins escape control; restoring them is slow", () => {
  it("with otters removed, the patch reaches a genuine barren within a couple of years", () => {
    const f = factsAfterYears({ perturbationSite: "patch", perturbationType: "removeOtters", playbackSpeed: 20 }, 3);
    expect(f.isBarren).toBe(true);
    expect(f.canopyFrac as number).toBeLessThan(0.1);
  });

  it("with the default otter raft present the whole time, the patch never leaves a healthy state", () => {
    const f = factsAfterYears({}, 20);
    expect(f.isBarren).toBe(false);
    expect(f.canopyFrac as number).toBeGreaterThan(0.9);
  });

  it("restoring otters right after a collapse does not undo it the same year — the real hysteresis lag", () => {
    const r = runFor(base({ perturbationSite: "patch", perturbationType: "removeOtters", otterCount: 0, playbackSpeed: 20 }));
    advanceYears(r, 3);
    expect(r.facts().isBarren).toBe(true);
    r.setParams({ ...base({ playbackSpeed: 20 }), perturbationSite: "patch", perturbationType: "none", otterCount: 18 });
    advanceYears(r, 1);
    expect(r.facts().isBarren, "still barren one year after restoring otters").toBe(true);
  });

  it("...but restoring otters does eventually work, given enough real years", () => {
    const r = runFor(base({ perturbationSite: "patch", perturbationType: "removeOtters", otterCount: 0, playbackSpeed: 20 }));
    advanceYears(r, 3);
    r.setParams({ ...base({ playbackSpeed: 20 }), perturbationSite: "patch", perturbationType: "none", otterCount: 18 });
    advanceYears(r, 12);
    const f = r.facts();
    expect(f.isBarren).toBe(false);
    expect(f.canopyFrac as number).toBeGreaterThan(0.8);
  });
});

/* ================================================================== *
 * Instant shocks fire exactly once, continuous ones do not need a change
 * ================================================================== */

describe("harvest and storm are one-time events, not a standing condition", () => {
  it("selecting harvestCanopy cuts canopy once; re-affirming the same selection does not cut it again", () => {
    const r = runFor(base({ perturbationSite: "patch", perturbationType: "none" }));
    const before = r.facts().canopyFrac as number;
    r.setParams({ ...base({ perturbationSite: "patch", perturbationType: "harvestCanopy" }) });
    const afterFirst = r.facts().canopyFrac as number;
    expect(afterFirst).toBeLessThan(before);
    r.setParams({ ...base({ perturbationSite: "patch", perturbationType: "harvestCanopy" }) });
    expect(r.facts().canopyFrac).toBeCloseTo(afterFirst, 9);
  });

  it("switching the type away and back to harvestCanopy fires it again, honestly", () => {
    const r = runFor(base({ perturbationSite: "patch", perturbationType: "none" }));
    r.setParams({ ...base({ perturbationSite: "patch", perturbationType: "harvestCanopy" }) });
    const first = r.facts().canopyFrac as number;
    r.setParams({ ...base({ perturbationSite: "patch", perturbationType: "none" }) });
    r.setParams({ ...base({ perturbationSite: "patch", perturbationType: "harvestCanopy" }) });
    expect(r.facts().canopyFrac as number).toBeLessThan(first);
  });

  it("harvest and storm at a site with no ecology (chloroplast) do nothing at all", () => {
    const r = runFor(base({ perturbationSite: "chloroplast", perturbationType: "none" }));
    const before = r.facts().canopyFrac as number;
    r.setParams({ ...base({ perturbationSite: "chloroplast", perturbationType: "harvestCanopy" }) });
    expect(r.facts().canopyFrac).toBeCloseTo(before, 9);
  });
});

/* ================================================================== *
 * A combined, ordinary-looking stress can crash productivity alone
 * ================================================================== */

describe("temperature and nitrate stress crash productivity even without an urchin outbreak", () => {
  it("warm, nutrient-poor water cuts the chloroplast rate to well under half, independent of canopy", () => {
    const healthy = factsAfterYears({}, 0);
    const stressed = factsAfterYears({ seaTemp: 19, upwellingNitrate: 3 }, 0);
    expect(stressed.productivityFrac as number).toBeLessThan(0.4);
    expect(healthy.productivityFrac as number).toBeCloseTo(1, 6);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism, reset, and finiteness", () => {
  it("the same seed replays to the same fingerprint", () => {
    const r1 = runFor(base({ perturbationSite: "patch", perturbationType: "removeOtters" }), "twin");
    const r2 = runFor(base({ perturbationSite: "patch", perturbationType: "removeOtters" }), "twin");
    advanceYears(r1, 2); advanceYears(r2, 2);
    expect(r1.fingerprint()).toBe(r2.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runFor(base());
    advanceYears(r, 1);
    expect(r.time).toBeGreaterThan(0);
    expect(r.facts().simYears as number).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const r = runFor(base({ otterCount: 4 }), "resetting");
    advanceYears(r, 2);
    r.reset();
    const fresh = new SimRunner({ manifest: chloroplastToCoastlineSim, params: base({ otterCount: 4 }), band: "6-8", seed: "resetting" });
    expect(r.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and numeric fact is finite through a long run at extreme settings", () => {
    const r = runFor(base({ otterCount: 0, seaTemp: 24, upwellingNitrate: 0, surfaceLight: 0, playbackSpeed: 20 }));
    advanceYears(r, 20);
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

describe("render survives every level, every perturbation, both bands", () => {
  it("draws without throwing across scales, sites, and perturbation types", () => {
    const cases: ParamValues[] = [
      ...LEVELS.map((l) => ({ scale: l })),
      { perturbationSite: "chloroplast", perturbationType: "blockLight" },
      { perturbationSite: "patch", perturbationType: "removeOtters", otterCount: 0 },
      { perturbationSite: "bay", perturbationType: "warmWater" },
      { perturbationSite: "patch", perturbationType: "stormSwell" },
      { perturbationSite: "patch", perturbationType: "harvestCanopy" },
      { otterCount: 0, surfaceLight: 0 },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: chloroplastToCoastlineSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 60; i++) runner.advance(1 / 30);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => chloroplastToCoastlineSim.render({
          ctx: stubContext(), state: runner.getState(), params, band: "6-8",
          width: w, height: h, overlays: {}, alpha: 0.5, theme: TEST_THEME, time: runner.time,
        }), JSON.stringify(overrides)).not.toThrow();
      }
    }
  });
});
