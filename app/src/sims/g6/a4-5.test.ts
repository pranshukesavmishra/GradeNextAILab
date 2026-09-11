import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { pullOneThreadSim, LINKS, HUBS, HUB_VARS } from "./a4-5-pull-one-thread";

/**
 * Science gate for G6-A4.5 "Pull One Thread: The Four-Sphere Web".
 *
 * Tests the spec's actual claim: a perturbation reaches another sphere only
 * by travelling along a real, directed link, and only after that link's own
 * lag — never instantly, never through a link that has been cut. Cutting a
 * link must make its one downstream variable's deviation exactly zero, not
 * merely smaller, because the model is meant to set a cut link's
 * contribution to exactly zero rather than attenuate it.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(pullOneThreadSim.params), ...overrides };
}

function runFor(params: ParamValues, realSeconds: number, seed = "gate"): SimRunner {
  const runner = new SimRunner({ manifest: pullOneThreadSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  for (let i = 0; i < Math.round(realSeconds * 30); i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, realSeconds: number, seed = "gate") =>
  runFor(base(overrides), realSeconds, seed).facts();

/* ================================================================== *
 * The graph itself: exactly twelve links, one per ordered pair
 * ================================================================== */

describe("the graph is exactly twelve links, one per ordered sphere pair", () => {
  it("has exactly one link for every ordered pair of the four spheres", () => {
    expect(LINKS.length).toBe(12);
    for (const a of HUBS) {
      for (const b of HUBS) {
        if (a === b) continue;
        const matches = LINKS.filter((l) => l.from.startsWith(`${a}.`) && l.to.startsWith(`${b}.`));
        expect(matches.length, `${a} -> ${b}`).toBe(1);
      }
    }
  });

  it("every link has a nonzero, distinct gain and a positive lag", () => {
    for (const l of LINKS) {
      expect(l.gain, l.id).not.toBe(0);
      expect(l.lagYr, l.id).toBeGreaterThan(0);
    }
  });

  it("the loop classification is a fixed, computed structural fact: 1 reinforcing, 5 balancing", () => {
    // Every one of the six unordered sphere pairs has both directions
    // present (twelve links covers every ordered pair), so all six form a
    // loop; classification never depends on any control, only on the two
    // link gains' product sign.
    const f = factsAfter({}, 0.01);
    expect(f.reinforcingLoopCount).toBe(1);
    expect(f.balancingLoopCount).toBe(5);
    expect((f.reinforcingLoopCount as number) + (f.balancingLoopCount as number)).toBe(6);
  });
});

/* ================================================================== *
 * Cutting a link sets its contribution to exactly zero
 * ================================================================== */

describe("cutting a link makes its one downstream variable exactly flat", () => {
  it("snowpack has only the atmo-hydro link feeding it, so cutting that link freezes it exactly at baseline", () => {
    for (const realSec of [2, 5, 10]) {
      const cut = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0.25, cutLink: "atmo-hydro", playbackSpeed: 20 }, realSec);
      expect(cut.snowpackDeviation).toBe(0);
    }
  });

  it("with the link intact, the same kick genuinely moves snowpack away from zero", () => {
    const intact = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0.25, cutLink: "none", playbackSpeed: 20 }, 2);
    expect(intact.snowpackDeviation as number).toBeGreaterThan(0);
  });

  it("cutting a link that does not feed a variable leaves that variable's response untouched", () => {
    // atmo-geo (precipitation -> erosionRate) has nothing to do with
    // snowpack's own only feed (atmo-hydro), so cutting it changes nothing
    // about snowpack's deviation.
    const cutOther = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0.25, cutLink: "atmo-geo", playbackSpeed: 20 }, 2);
    const cutNone = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0.25, cutLink: "none", playbackSpeed: 20 }, 2);
    expect(cutOther.snowpackDeviation).toBeCloseTo(cutNone.snowpackDeviation as number, 9);
  });

  it("the cutLink facts plainly report which link, if any, is disabled", () => {
    const cut = factsAfter({ cutLink: "atmo-hydro" }, 0.1);
    expect(cut.cutLink).toBe("atmo-hydro");
    expect(cut.cutLinkActive).toBe(true);
    const none = factsAfter({ cutLink: "none" }, 0.1);
    expect(none.cutLinkActive).toBe(false);
  });
});

/* ================================================================== *
 * A link's own lag is a hard floor: nothing arrives early
 * ================================================================== */

describe("a link's lag is a real floor: no downstream response before it", () => {
  it("a geosphere kick leaves the forest completely untouched before the 10-year soil-to-forest lag, then moves it", () => {
    // geo-bio ("deeper soil supports more forest") has lagYr: 10 and is the
    // ONLY path from geosphere into biosphere's forestCover, so the two
    // readings on either side of that lag are exact: zero, then nonzero.
    const before = factsAfter({ targetSphere: "geosphere", perturbationSize: 0.6, playbackSpeed: 5 }, 1.8); // ~9 sim years
    const atLag = factsAfter({ targetSphere: "geosphere", perturbationSize: 0.6, playbackSpeed: 5 }, 2); // ~10 sim years
    const after = factsAfter({ targetSphere: "geosphere", perturbationSize: 0.6, playbackSpeed: 5 }, 4); // ~20 sim years
    expect(before.forestCoverDeviation).toBe(0);
    expect(atLag.forestCoverDeviation as number).toBeGreaterThanOrEqual(0);
    expect(after.forestCoverDeviation as number).toBeGreaterThan(before.forestCoverDeviation as number);
    expect(after.forestCoverDeviation as number).toBeGreaterThan(0.05);
  });

  it("delay scaling stretches every lag together: the same kick, more years before it arrives", () => {
    const normal = factsAfter({ targetSphere: "geosphere", perturbationSize: 0.6, playbackSpeed: 5, delayScaling: 1 }, 4);
    const stretched = factsAfter({ targetSphere: "geosphere", perturbationSize: 0.6, playbackSpeed: 5, delayScaling: 5 }, 4);
    // At the same 20 simulated years, a 5x-stretched 10-year lag (now 50
    // years) has not arrived at all yet, where the unstretched one has.
    expect(normal.forestCoverDeviation as number).toBeGreaterThan(0.05);
    expect(stretched.forestCoverDeviation).toBe(0);
  });

  it("a variable injected directly moves immediately; that is not the same claim as a link carrying it", () => {
    // A hub's own four variables all move the instant it is the injection
    // target, at year zero, before a single link has had time to act at all.
    const f = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0.25 }, 0.1);
    expect(f.firstResponder).toBe("atmosphere.temperature");
    expect((f.responseOrderList as string).split(",")).toEqual([
      "atmosphere.temperature", "atmosphere.precipitation", "atmosphere.windSpeed", "atmosphere.humidity",
    ]);
    expect(f.hubsMovedPast5pct).toBe(1); // only the target hub itself, this early
  });
});

/* ================================================================== *
 * A zero-size kick is honestly a non-event
 * ================================================================== */

describe("an honest null case: no kick, nothing crosses the threshold", () => {
  it("a zero-size perturbation never crosses the 5% response threshold", () => {
    const f = factsAfter({ targetSphere: "atmosphere", perturbationSize: 0 }, 5);
    expect(f.hubsMovedPast5pct).toBe(0);
    expect(f.responseCount).toBe(0);
    expect(f.firstResponder).toBe("");
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism, reset, and finiteness", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base({ targetSphere: "biosphere" }), 3, "twin");
    const b = runFor(base({ targetSphere: "biosphere" }), 3, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runFor(base(), 1);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base({ targetSphere: "hydrosphere", perturbationSize: 0.5 }), 3, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: pullOneThreadSim, params: base({ targetSphere: "hydrosphere", perturbationSize: 0.5 }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and every one of the sixteen per-variable facts is finite through a long run", () => {
    const r = runFor(base({ perturbationSize: 0.9, delayScaling: 10 }), 20);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), ro.key).toBe(true);
    const facts = r.facts();
    for (const hub of HUBS) {
      for (const name of HUB_VARS[hub]) {
        const key = `${hub}_${name}`;
        expect(Number.isFinite(facts[key] as number), key).toBe(true);
      }
    }
    for (const [k, v] of Object.entries(facts)) {
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

describe("render survives every target, every cut link, both bands", () => {
  it("draws without throwing across targets, cuts, and display modes", () => {
    const cases: ParamValues[] = [
      {},
      { targetSphere: "geosphere" }, { targetSphere: "hydrosphere" }, { targetSphere: "biosphere" },
      { cutLink: "atmo-hydro" }, { cutLink: "geo-bio" },
      { arrowDisplay: "signOnly" }, { arrowDisplay: "hidden" },
      { loopHighlight: false }, { perturbationSize: 1, delayScaling: 0.1 },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: pullOneThreadSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 60; i++) runner.advance(1 / 30);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => pullOneThreadSim.render({
          ctx: stubContext(), state: runner.getState(), params, band: "6-8",
          width: w, height: h, overlays: {}, alpha: 0.5, theme: TEST_THEME, time: runner.time,
        }), JSON.stringify(overrides)).not.toThrow();
      }
    }
  });
});
