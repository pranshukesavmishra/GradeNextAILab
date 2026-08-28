import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, GradeBand, ParamValues } from "@engine/types";
import { CONSTANTS } from "@engine/units";

import { BREAKDOWN_FIELD, breakdownCharge, coulombForce, electricForceSim } from "./electric-force";

/**
 * Golden values for the Grade 8 fields-and-waves batch.
 *
 * Each of these sims makes a quantitative claim on screen — a force, a field
 * strength, a speed of sound, a photon energy, a bit error rate — and a
 * student has no way to catch it if the claim is wrong. So every claim is
 * checked here against a number physics already knows, written out.
 */

const SIMS: AnySim[] = [electricForceSim];

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

const TEST_THEME = {
  surface: "#ffffff", surfaceAlt: "#eeeeee", ink: "#111111", inkSoft: "#555555",
  line: "#dddddd", grid: "#eeeeee", accent: "#0d7c86",
  sci: new Proxy({} as Record<string, string>, {
    get: (_t, key: string) => {
      // Reaching for a colour outside the palette is a bug, not a fallback.
      if (!SCI_KEYS.has(key)) throw new Error(`unknown semantic colour: ${key}`);
      return "#888888";
    },
  }),
};

/**
 * A canvas context that accepts everything and remembers what it was set to,
 * so render functions can be exercised under Node. A NaN coordinate draws
 * nothing on a real canvas, which is the hardest rendering bug to find, so it
 * throws here instead.
 */
function stubContext(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop === "measureText") return () => ({ width: 24 });
      if (prop === "canvas") return { width: 900, height: 520 };
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return (...args: unknown[]) => {
          for (const arg of args) {
            if (typeof arg === "number" && !Number.isFinite(arg)) {
              throw new Error(`${prop} received a non-finite argument`);
            }
          }
          return { addColorStop: () => undefined };
        };
      }
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        for (const arg of args) {
          if (typeof arg === "number" && !Number.isFinite(arg)) {
            throw new Error(`${prop} received a non-finite argument`);
          }
        }
        return undefined;
      };
    },
    set(target, prop: string, value) {
      if ((prop === "fillStyle" || prop === "strokeStyle") && value === undefined) {
        throw new Error(`${prop} was set to undefined`);
      }
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function run(
  sim: AnySim, overrides: ParamValues, seconds: number,
  band: GradeBand = "9-12", seed = "golden",
) {
  const params = { ...defaultParams(sim.params), ...overrides };
  const runner = new SimRunner({ manifest: sim, params, band, seed });
  runner.playing = true;
  for (let t = 0; t < seconds; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}

const factsOf = (...args: Parameters<typeof run>) => run(...args).facts();

/** Drag sphere B (or a probe) to a canvas x, the way a student would. */
function dragTo(runner: SimRunner, x: number, y = 200) {
  runner.push({ type: "pointerdown", x, y, id: 1 });
  runner.advance(1 / 60);
  runner.push({ type: "pointerup", x, y, id: 1 });
  runner.advance(1 / 60);
}

/* ================================================================== *
 * Electric force — Coulomb's law
 * ================================================================== */

describe("electric force: Coulomb's law with the real constant", () => {
  it("uses the textbook value of k", () => {
    // 1 C and 1 C, 1 m apart: F = k = 8.99 × 10⁹ N.
    expect(coulombForce(1, 1, 1)).toBeCloseTo(8.9875517873681764e9, 0);
    expect(CONSTANTS.k_e / 1e9).toBeCloseTo(8.99, 2);
  });

  it("puts two 2 µC charges 50 cm apart at 0.144 N", () => {
    // F = 8.988e9 × (2e-6)² / 0.5² = 0.14380 N
    expect(coulombForce(2e-6, 2e-6, 0.5)).toBeCloseTo(0.14380, 4);
  });

  it("quarters the force when the distance doubles", () => {
    const near = coulombForce(3e-6, 2e-6, 0.2);
    const far = coulombForce(3e-6, 2e-6, 0.4);
    expect(near / far).toBeCloseTo(4, 10);
    // And ninths it at triple the distance: the inverse-square signature.
    expect(near / coulombForce(3e-6, 2e-6, 0.6)).toBeCloseTo(9, 10);
  });

  it("keeps F × r² constant across the whole bench", () => {
    const products = [0.05, 0.1, 0.25, 0.5, 0.9, 1.6].map(
      (r) => coulombForce(2e-6, 2e-6, r) * r * r,
    );
    for (const p of products) expect(p).toBeCloseTo(products[0], 12);
  });

  it("doubles the force when either charge doubles, and quadruples for both", () => {
    const base = coulombForce(1e-6, 1e-6, 0.4);
    expect(coulombForce(2e-6, 1e-6, 0.4) / base).toBeCloseTo(2, 10);
    expect(coulombForce(1e-6, 2e-6, 0.4) / base).toBeCloseTo(2, 10);
    expect(coulombForce(2e-6, 2e-6, 0.4) / base).toBeCloseTo(4, 10);
  });

  it("reports one force for the pair, so the two arrows can never differ", () => {
    // Newton's third law is structural here: a single magnitude is drawn on
    // both spheres, so a 6 µC charge and a 0.5 µC charge feel the same force.
    const f = factsOf(electricForceSim, { chargeA: 6, chargeB: 0.5 }, 1);
    expect(f.force as number).toBeCloseTo(coulombForce(6e-6, 0.5e-6, f.separation as number), 12);
  });

  it("attracts on opposite signs and repels on like signs", () => {
    expect(factsOf(electricForceSim, { chargeA: 2, chargeB: -3 }, 1).attract).toBe(true);
    expect(factsOf(electricForceSim, { chargeA: 2, chargeB: -3 }, 1).repel).toBe(false);
    expect(factsOf(electricForceSim, { chargeA: -2, chargeB: -3 }, 1).repel).toBe(true);
    expect(factsOf(electricForceSim, { chargeA: 0, chargeB: -3 }, 1).neutral).toBe(true);
    expect(factsOf(electricForceSim, { chargeA: 0, chargeB: -3 }, 1).force).toBe(0);
  });

  it("lets a student drag to a distance and measure the force there", () => {
    const runner = run(electricForceSim, { chargeA: 2, chargeB: 2 }, 0.2);
    // 20 cm along the rule from the anchor, at 2.5 mm per pixel.
    dragTo(runner, 92 + 0.2 / 0.0025);
    const f = runner.facts();
    expect(f.separation as number).toBeCloseTo(0.2, 6);
    expect(f.force as number).toBeCloseTo(0.8988, 3);
  });
});

describe("electric force: lightning", () => {
  it("breaks air down at 3 MV/m", () => {
    expect(BREAKDOWN_FIELD).toBe(3.0e6);
  });

  it("needs about 30 coulombs under a 300 m cloud base", () => {
    // Q = E r² / k = 3e6 × 300² / 8.988e9 = 30.0 C, the right order for a real
    // stroke, which moves roughly 5-20 C.
    expect(breakdownCharge(300)).toBeCloseTo(30.04, 1);
    expect(breakdownCharge(600) / breakdownCharge(300)).toBeCloseTo(4, 10);
  });

  it("strikes once the field at the ground reaches breakdown", () => {
    const f = factsOf(electricForceSim, { scenario: "storm", cloudHeight: 300, chargeRate: 40 }, 4);
    expect(f.strikes as number).toBeGreaterThanOrEqual(1);
    expect(f.lastBoltCharge as number).toBeGreaterThan(29);
    expect(f.fieldAtGround as number).toBeLessThanOrEqual(BREAKDOWN_FIELD);
  });

  it("takes longer to strike from a higher cloud", () => {
    const low = factsOf(electricForceSim, { scenario: "storm", cloudHeight: 200, chargeRate: 20 }, 6);
    const high = factsOf(electricForceSim, { scenario: "storm", cloudHeight: 800, chargeRate: 20 }, 6);
    expect(low.strikes as number).toBeGreaterThan(high.strikes as number);
  });
});

/* ================================================================== *
 * Every sim, every band: it has to draw
 * ================================================================== */

describe("the batch as a whole", () => {
  it.each(SIMS.map((s) => [s.id, s] as const))("%s draws every option at every band", (_id, sim) => {
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
        for (let i = 0; i < 150; i++) runner.advance(1 / 60);
        for (const on of [true, false]) {
          const overlays: Record<string, boolean> = {};
          for (const o of sim.overlays ?? []) overlays[o.key] = on;
          // A wide stage and a cramped one: the layout must survive both.
          for (const [w, h] of [[900, 520], [320, 240]]) {
            expect(() => sim.render({
              ctx: stubContext(), state: runner.getState(), params, band,
              width: w, height: h, overlays, alpha: 0.5, theme: TEST_THEME, time: runner.time,
            }), `${sim.id} ${band} ${JSON.stringify(overrides)}`).not.toThrow();
          }
        }
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s keeps every readout finite", (_id, sim) => {
    for (const band of sim.bands) {
      const runner = run(sim, {}, 3, band);
      for (const r of runner.readouts()) {
        expect(Number.isFinite(r.quantity.value), `${sim.id}.${r.key} at ${band}`).toBe(true);
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s replays identically", (_id, sim) => {
    expect(run(sim, {}, 3).fingerprint()).toBe(run(sim, {}, 3).fingerprint());
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s is independent of the frame rate", (_id, sim) => {
    const params = defaultParams(sim.params);
    const smooth = new SimRunner({ manifest: sim, params, band: "6-8", seed: "s" });
    const choppy = new SimRunner({ manifest: sim, params, band: "6-8", seed: "s" });
    smooth.playing = true;
    choppy.playing = true;
    for (let i = 0; i < 120; i++) smooth.advance(1 / 60);
    for (let i = 0; i < 24; i++) choppy.advance(1 / 12);
    expect(smooth.ticks).toBe(choppy.ticks);
    expect(smooth.fingerprint()).toBe(choppy.fingerprint());
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s is wired for teaching", (_id, sim) => {
    expect(sim.learningGoals.length).toBeGreaterThan(1);
    expect(sim.misconceptions?.length ?? 0).toBeGreaterThan(0);
    expect(sim.labs?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(sim.challenges?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(sim.standards.ngss?.length ?? 0).toBeGreaterThan(0);
    // Every lab opens with a prediction, and every setup key is a real param.
    for (const lab of sim.labs ?? []) {
      expect(lab.steps[0].predict, `${lab.id} must open with a prediction`).toBeTruthy();
      for (const key of Object.keys(lab.setup ?? {})) {
        expect(Object.keys(sim.params), `${lab.id} sets unknown param ${key}`).toContain(key);
      }
    }
    for (const ch of sim.challenges ?? []) {
      for (const key of Object.keys(ch.setup ?? {})) {
        expect(Object.keys(sim.params), `${ch.id} sets unknown param ${key}`).toContain(key);
      }
    }
  });
});
