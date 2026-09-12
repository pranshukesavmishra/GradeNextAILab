import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { followOneDropSim, residenceSecondsOf, NODES } from "./a2-4-follow-one-drop-follow-one-joule";

/**
 * Science gate for G6-A2.4 "Follow One Drop, Follow One Joule".
 *
 * Tests the spec's actual claim: matter cycles and energy does not, and that
 * difference is built into the routing tables themselves (an energy tracer's
 * lookup refuses to find an outgoing edge at a terminal node, unconditionally)
 * rather than into how far the numbers happen to run down. Also tests that
 * residence time is a genuine, live consequence of stock/outflow — never a
 * hand-typed table — by driving the controls that set each node's outflow and
 * checking the affected nodes move while the unaffected ones do not.
 *
 * Because several stocks (snowpack, hilltop tank, the bay) have residence
 * times measured in months to years, tests that need a tracer to travel far
 * use `timeComp` at its own maximum (a legitimate slider value) and enough
 * real seconds to cover it — verified empirically to be both fast (tens of
 * milliseconds) and reliable across many seeds before being fixed here.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(followOneDropSim.params), ...overrides };
}

/** MAX_FRAME_SECONDS in the shared engine is 0.25s; advancing in exactly that
 *  increment gets the most simulated time per call. */
function runFar(params: ParamValues, realSeconds: number, seed = "gate"): SimRunner {
  const runner = new SimRunner({ manifest: followOneDropSim, params, band: "6-8", seed });
  runner.playing = true;
  const step = 0.25;
  const calls = Math.round(realSeconds / step);
  for (let i = 0; i < calls; i++) runner.advance(step);
  return runner;
}

const factsAfter = (overrides: ParamValues, realSeconds: number, seed = "gate") =>
  runFar(base(overrides), realSeconds, seed).facts();

/* ================================================================== *
 * Matter cycles, energy does not — the honesty rule itself
 * ================================================================== */

describe("water can complete the loop, energy structurally cannot", () => {
  it("a water tracer released at the snowpack eventually closes the loop", () => {
    // 200 independent tracers so the loop-closing event (a long chain of
    // multi-month to multi-year residence draws) is reached quickly and
    // reliably; the claim under test is that it can happen at all, not how
    // long any one particular tracer takes.
    for (const seed of ["gate", "seedB", "seedC", "seedD"]) {
      const f = factsAfter({ numberOfTracers: 200, timeComp: 100000 }, 300, seed);
      expect(f.anyWaterLoopClosed, `seed ${seed}`).toBe(true);
      expect(f.hasWaterTracers).toBe(true);
    }
  });

  it("an energy tracer never closes the loop, however long it runs", () => {
    for (const seed of ["gate", "seedB"]) {
      const f = factsAfter({ tracerType: "energy", numberOfTracers: 200, timeComp: 100000 }, 300, seed);
      expect(f.anyEnergyEverLooped).toBe(false);
      expect(f.tracer0Loop).toBe("neverPossible");
    }
  });

  it("an energy tracer released straight into a terminal node still goes inactive", () => {
    // Not "arrives via a hop" (already covered by the loop test above) but
    // released directly at the bay, so the model has to notice terminality
    // by waiting out the bay's own (multi-year) residence and then finding
    // no outgoing edge, rather than by processing an arrival. The bay's
    // stock is enormous, so this alone needs a long, maxed-out run.
    for (const seed of ["gate", "seedB", "seedD"]) {
      const f = factsAfter({ tracerType: "energy", releasePoint: "bay", timeComp: 100000 }, 8000, seed);
      expect(f.tracer0Node, seed).toBe("bay");
      expect(f.tracer0Active, seed).toBe(false);
    }
  });

  it("energy sheds value at every ordinary stop, then the pump uniquely adds it back", () => {
    for (const seed of ["gate", "seedB", "seedD"]) {
      // Released just past the intake works, four ordinary loss nodes
      // (barScreen, flocculation, sandFilter, chlorineContact) run before
      // the pump; verified to reliably land exactly on hilltopTank — the
      // node immediately after the pump — within 5 real seconds.
      const f = factsAfter({ tracerType: "energy", releasePoint: "treatmentPlant", timeComp: 100000 }, 5, seed);
      const atPump = f.tracer0ValueAt_pumpStation as number;
      expect(atPump, seed).toBeGreaterThan(0);
      expect(atPump, seed).toBeLessThan(1); // four real losses already shed value
      expect(f.tracer0Node, seed).toBe("hilltopTank");
      expect(f.tracer0Value as number, seed).toBeGreaterThan(atPump); // the pump's own gain
    }
  });

  it("a water tracer's own routing table includes the edge home, an energy tracer's does not", () => {
    // Release right at the cloud, one hop from home for water. A water
    // tracer must be able to leave (the loop-closer edge exists); an energy
    // tracer released at the same node is already terminal and cannot.
    const water = factsAfter({ tracerType: "water", releasePoint: "cloud", numberOfTracers: 50 }, 30);
    expect(water.anyWaterLoopClosed).toBe(true);
    for (const seed of ["gate", "seedB", "seedD"]) {
      const energy = factsAfter({ tracerType: "energy", releasePoint: "cloud" }, 400, seed);
      expect(energy.tracer0Node, seed).toBe("cloud");
      expect(energy.tracer0Active, seed).toBe(false);
    }
  });
});

/* ================================================================== *
 * The pump is a real, visible boost — the one place value goes up
 * ================================================================== */

describe("the pump station adds real energy, visibly", () => {
  it("more pump power leaves a bigger value just downstream of the pump", () => {
    for (const seed of ["gate", "seedB", "seedD"]) {
      const low = factsAfter({ tracerType: "energy", pumpPower: 0, timeComp: 100000 }, 300, seed);
      const high = factsAfter({ tracerType: "energy", pumpPower: 2500, timeComp: 100000 }, 300, seed);
      // Same seed => identical random draws for routing and timing (pump
      // power affects value only), so both land at the same node.
      expect(high.tracer0Node, `seed ${seed}`).toBe(low.tracer0Node);
      expect(high.tracer0Value as number, `seed ${seed}`).toBeGreaterThan(low.tracer0Value as number);
    }
  });
});

/* ================================================================== *
 * Residence time is a live computation: stock / that node's own outflow
 * ================================================================== */

describe("residence time is computed, never a hand-typed table", () => {
  it("faster snowmelt shortens residence at every bulk-flow node upstream, not downstream", () => {
    const slow = base({ snowmeltRate: 5 });
    const fast = base({ snowmeltRate: 120 });
    expect(residenceSecondsOf("snowpack", fast)).toBeLessThan(residenceSecondsOf("snowpack", slow));
    expect(residenceSecondsOf("reservoir", fast)).toBeLessThan(residenceSecondsOf("reservoir", slow));
    // Downstream of the school, snowmelt rate does not set the outflow at all.
    expect(residenceSecondsOf("hilltopTank", fast)).toBeCloseTo(residenceSecondsOf("hilltopTank", slow), 6);
  });

  it("school demand moves the school-side nodes and leaves the snowmelt side untouched", () => {
    const low = base({ schoolDemand: 1 });
    const high = base({ schoolDemand: 60 });
    expect(residenceSecondsOf("hilltopTank", high)).toBeLessThan(residenceSecondsOf("hilltopTank", low));
    expect(residenceSecondsOf("school", high)).toBeLessThan(residenceSecondsOf("school", low));
    expect(residenceSecondsOf("snowpack", high)).toBeCloseTo(residenceSecondsOf("snowpack", low), 6);
  });

  it("a bigger stock genuinely means a longer wait only relative to its own outflow", () => {
    // The spec's own misconception to defeat: a bigger stock does not
    // automatically mean a longer residence if its outflow is bigger too.
    // The reservoir (4e8 m3) and snowpack (5e8 m3) share the same outflow
    // (snowmelt rate), so the smaller stock has the shorter residence.
    const p = base();
    expect(residenceSecondsOf("reservoir", p)).toBeLessThan(residenceSecondsOf("snowpack", p));
  });

  it("the aqueduct leak opens a real branch to the soil and collapses its residence time", () => {
    const sealed = residenceSecondsOf("soil", base({ aqueductLeak: 0 }));
    const leaking = residenceSecondsOf("soil", base({ aqueductLeak: 0.25 }));
    expect(leaking).toBeLessThan(sealed);
    expect(Number.isFinite(sealed)).toBe(true);
    expect(Number.isFinite(leaking)).toBe(true);
  });

  it("every one of the 18 nodes has a finite, positive residence time at defaults", () => {
    const p = base();
    for (const n of NODES) {
      const r = residenceSecondsOf(n.id, p);
      expect(Number.isFinite(r), n.id).toBe(true);
      expect(r, n.id).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== *
 * Both kinds at once, and the platform invariants
 * ================================================================== */

describe("both tracer kinds together, and finite facts throughout", () => {
  it("releasing both kinds together tracks each independently", () => {
    const f = factsAfter({ tracerType: "both", numberOfTracers: 5 }, 5);
    expect(f.hasWaterTracers).toBe(true);
    // tracerCount = numberOfTracers per kind, so "both" doubles it.
    expect(f.tracerCount).toBe(10);
  });

  it("every readout and numeric fact stays finite through a long, many-tracer run", () => {
    const r = runFar(base({ numberOfTracers: 200, tracerType: "both", timeComp: 100000 }), 200);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), ro.key).toBe(true);
    for (const [k, v] of Object.entries(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), k).toBe(true);
    }
  });
});

/* ================================================================== *
 * Render is exercised directly — no tsc coverage until registration
 * ================================================================== */

/** A canvas stub that throws on the classic invisible bugs: NaN coordinates,
 *  undefined colours, bad gradient stops — mirrors the exemplar's pattern. */
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

describe("render survives every view, every release point, both bands", () => {
  it("draws without throwing across tracer kinds, release points, and toggles", () => {
    const cases: ParamValues[] = [
      {},
      { tracerType: "energy" }, { tracerType: "both" },
      { releasePoint: "reservoir" }, { releasePoint: "treatmentPlant" },
      { releasePoint: "schoolFountain" }, { releasePoint: "sewer" }, { releasePoint: "bay" },
      { numberOfTracers: 200 },
      { showResidenceTimes: true }, { energyQualityShading: false },
      { aqueductLeak: 0.25, pumpPower: 0 },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: followOneDropSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 20; i++) runner.advance(0.25);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => followOneDropSim.render({
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
    const a = runFar(base({ numberOfTracers: 10 }), 8, "twin");
    const b = runFar(base({ numberOfTracers: 10 }), 8, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runFar(base(), 1);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFar(base({ snowmeltRate: 60 }), 4, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: followOneDropSim, params: base({ snowmeltRate: 60 }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });
});
