import { describe, expect, it } from "vitest";
import { Rng } from "./rng";
import { SimRunner } from "./loop";
import { CONSTANTS, convert, format, formatValue, propagateProduct, q, toSI } from "./units";
import { projectileSim } from "@sims/physics/projectile";
import { defaultParams } from "./types";

/**
 * These tests protect the two properties everything else depends on:
 * the physics is right, and the same inputs always produce the same run.
 * A silent error in either would teach students something false.
 */

describe("Rng", () => {
  it("is reproducible for a given seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = new Rng(1).next();
    const b = new Rng(2).next();
    expect(a).not.toBe(b);
  });

  it("stays inside [0, 1)", () => {
    const rng = new Rng("bounds");
    for (let i = 0; i < 2000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("forks into independent but reproducible streams", () => {
    const parent = new Rng("world");
    const forkA = parent.fork("rabbits").next();
    const forkB = new Rng("world").fork("rabbits").next();
    const other = new Rng("world").fork("foxes").next();
    expect(forkA).toBe(forkB);
    expect(forkA).not.toBe(other);
  });

  it("restores an exact stream position", () => {
    const rng = new Rng(7);
    rng.next(); rng.next();
    const snap = rng.snapshot();
    const expected = rng.next();
    const restored = Rng.restore(snap);
    expect(restored.next()).toBe(expected);
  });
});

describe("units", () => {
  it("round-trips SI to display and back", () => {
    expect(convert(1, "length", "cm")).toBeCloseTo(100, 10);
    expect(toSI(100, "length", "cm")).toBeCloseTo(1, 10);
    expect(convert(1, "time", "min")).toBeCloseTo(1 / 60, 10);
  });

  it("handles temperature offsets", () => {
    expect(convert(273.15, "temperature", "°C")).toBeCloseTo(0, 6);
    expect(toSI(100, "temperature", "°C")).toBeCloseTo(373.15, 6);
    expect(convert(273.15, "temperature", "°F")).toBeCloseTo(32, 4);
  });

  it("formats to the requested significant figures", () => {
    expect(formatValue(3.14159, 3)).toBe("3.14");
    expect(formatValue(1234.5, 2)).toBe("1235");
    expect(formatValue(0, 3)).toBe("0");
  });

  it("shows uncertainty when asked", () => {
    const withU = q(9.81, "acceleration", 0.05);
    expect(format(withU, { unitId: "m/s²", sigFigs: 3, showUncertainty: true })).toContain("±");
    expect(format(withU, { unitId: "m/s²", sigFigs: 3 })).not.toContain("±");
  });

  it("propagates relative uncertainty through a product", () => {
    // 10% and nothing → 10% of the result.
    const a = q(10, "length", 1);
    const b = q(2, "length");
    const result = propagateProduct(20, "area", a, b);
    expect(result.uncertainty).toBeCloseTo(2, 6);
  });
});

/* ------------------------------------------------------------------ *
 * Golden physics: verified against closed-form solutions
 * ------------------------------------------------------------------ */

function runProjectile(overrides: Record<string, number | boolean | string>, seconds: number) {
  const params = { ...defaultParams(projectileSim.params), ...overrides };
  const runner = new SimRunner({ manifest: projectileSim, params, band: "9-12", seed: "test" });
  runner.playing = true;
  runner.push({ type: "action", action: "launch" });
  // Advance in small real-time slices so the fixed-step loop runs normally.
  for (let t = 0; t < seconds; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}

describe("projectile physics", () => {
  it("matches the analytic range for a 45° launch on flat ground", () => {
    const speed = 20;
    const angle = Math.PI / 4;
    const g = CONSTANTS.g;
    const expected = (speed * speed * Math.sin(2 * angle)) / g; // 40.789 m
    const runner = runProjectile({ speed, angle, gravity: g, height: 0, drag: false }, 4);
    const facts = runner.facts();
    expect(facts.landed).toBe(true);
    expect(facts.range as number).toBeCloseTo(expected, 0);
    expect(expected).toBeCloseTo(40.789, 2);
  });

  it("matches the analytic peak height", () => {
    const speed = 20;
    const angle = Math.PI / 3;
    const g = CONSTANTS.g;
    const vy = speed * Math.sin(angle);
    const expectedPeak = (vy * vy) / (2 * g); // 15.3 m
    const runner = runProjectile({ speed, angle, gravity: g, height: 0, drag: false }, 4);
    expect(runner.facts().peak as number).toBeCloseTo(expectedPeak, 0);
  });

  it("matches the analytic flight time", () => {
    const speed = 15;
    const angle = Math.PI / 4;
    const g = CONSTANTS.g;
    const expectedTime = (2 * speed * Math.sin(angle)) / g;
    const runner = runProjectile({ speed, angle, gravity: g, height: 0, drag: false }, 5);
    expect(runner.facts().flightTime as number).toBeCloseTo(expectedTime, 1);
  });

  it("gives the same range for complementary angles (30° and 60°)", () => {
    const a = runProjectile({ speed: 18, angle: Math.PI / 6, drag: false }, 4);
    const b = runProjectile({ speed: 18, angle: Math.PI / 3, drag: false }, 4);
    expect(a.facts().range as number).toBeCloseTo(b.facts().range as number, 0);
  });

  it("is unaffected by mass when air resistance is off — the misconception this sim targets", () => {
    const light = runProjectile({ speed: 18, angle: Math.PI / 4, mass: 0.5, drag: false }, 4);
    const heavy = runProjectile({ speed: 18, angle: Math.PI / 4, mass: 20, drag: false }, 4);
    expect(light.facts().range as number).toBeCloseTo(heavy.facts().range as number, 6);
  });

  it("does become mass-dependent once air resistance is on", () => {
    const light = runProjectile({ speed: 18, angle: Math.PI / 4, mass: 0.5, drag: true }, 4);
    const heavy = runProjectile({ speed: 18, angle: Math.PI / 4, mass: 20, drag: true }, 4);
    expect(heavy.facts().range as number).toBeGreaterThan(light.facts().range as number);
  });

  it("travels about six times further under Moon gravity", () => {
    const earth = runProjectile({ speed: 15, angle: Math.PI / 4, gravity: 9.80665, drag: false }, 4);
    const moon = runProjectile({ speed: 15, angle: Math.PI / 4, gravity: 1.62, drag: false }, 20);
    const ratio = (moon.facts().range as number) / (earth.facts().range as number);
    expect(ratio).toBeGreaterThan(5.5);
    expect(ratio).toBeLessThan(6.5);
  });
});

describe("determinism", () => {
  it("produces an identical fingerprint for identical inputs", () => {
    const a = runProjectile({ speed: 17, angle: 0.7 }, 2);
    const b = runProjectile({ speed: 17, angle: 0.7 }, 2);
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("is unaffected by the size of the real-time steps", () => {
    const params = { ...defaultParams(projectileSim.params), speed: 17, angle: 0.7 };
    const smooth = new SimRunner({ manifest: projectileSim, params, band: "9-12", seed: "s" });
    const choppy = new SimRunner({ manifest: projectileSim, params, band: "9-12", seed: "s" });
    smooth.playing = true;
    choppy.playing = true;
    smooth.push({ type: "action", action: "launch" });
    choppy.push({ type: "action", action: "launch" });

    // 60 fps versus a stuttering 12 fps: the model must land in the same place.
    for (let i = 0; i < 120; i++) smooth.advance(1 / 60);
    for (let i = 0; i < 24; i++) choppy.advance(1 / 12);

    expect(smooth.ticks).toBe(choppy.ticks);
    expect(smooth.fingerprint()).toBe(choppy.fingerprint());
  });

  it("reset returns the run to its starting state", () => {
    const runner = runProjectile({ speed: 20, angle: 0.6 }, 2);
    const before = runner.ticks;
    runner.reset();
    expect(runner.ticks).toBe(0);
    expect(runner.time).toBe(0);
    expect(before).toBeGreaterThan(0);
  });
});

describe("sim manifest integrity", () => {
  it("exposes readouts with finite values from the first frame", () => {
    const params = defaultParams(projectileSim.params);
    const runner = new SimRunner({ manifest: projectileSim, params, band: "9-12" });
    for (const r of runner.readouts()) {
      expect(Number.isFinite(r.quantity.value), `${r.key} should be finite`).toBe(true);
    }
  });

  it("declares every lab and challenge against bands the sim supports", () => {
    for (const lab of projectileSim.labs ?? []) {
      for (const band of lab.bands) expect(projectileSim.bands).toContain(band);
    }
    for (const ch of projectileSim.challenges ?? []) {
      for (const band of ch.bands) expect(projectileSim.bands).toContain(band);
    }
  });

  it("keeps every default parameter inside its own range", () => {
    for (const [key, spec] of Object.entries(projectileSim.params)) {
      if (spec.type === "number") {
        expect(spec.default, `${key} default below min`).toBeGreaterThanOrEqual(spec.min);
        expect(spec.default, `${key} default above max`).toBeLessThanOrEqual(spec.max);
      }
    }
  });
});

/**
 * The clock.
 *
 * Every simulation in the catalogue once sat frozen at zero seconds because a
 * single negative delta — a first animation frame carrying a timestamp from
 * before the loop was set up — drove the fixed-step accumulator about twenty
 * seconds negative, and it never climbed back to one tick. Nothing else caught
 * it: the types were fine, the unit tests were green, and a still screenshot
 * of a frozen simulation looks exactly like a still screenshot of a running
 * one. These are the tests that would have.
 */
describe("SimRunner clock", () => {
  const fresh = () => {
    const params = defaultParams(projectileSim.params);
    const r = new SimRunner({ manifest: projectileSim, params, band: "9-12", seed: "clock" });
    r.playing = true;
    return r;
  };

  it("advances on an ordinary frame", () => {
    const r = fresh();
    expect(r.advance(1 / 60)).toBe(true);
    expect(r.time).toBeGreaterThan(0);
  });

  it("survives a negative delta and keeps running afterwards", () => {
    const r = fresh();
    r.advance(-22.4);            // a frame timestamp older than the loop
    expect(r.time).toBe(0);      // no time travel
    r.advance(1 / 60);
    expect(r.time).toBeGreaterThan(0);
    expect(r.ticks).toBeGreaterThan(0);
  });

  it("survives a run of negative deltas", () => {
    const r = fresh();
    for (let i = 0; i < 40; i++) r.advance(-1);
    for (let i = 0; i < 4; i++) r.advance(1 / 60);
    expect(r.ticks).toBeGreaterThan(0);
  });

  it("clamps a huge catch-up delta rather than spiralling", () => {
    const r = fresh();
    r.advance(600);
    // A stalled tab returning must not run ten minutes of physics in one frame.
    expect(r.time).toBeLessThanOrEqual(0.26);
  });

  it("does not advance while paused, and resumes cleanly", () => {
    const r = fresh();
    r.playing = false;
    r.advance(1);
    expect(r.time).toBe(0);
    r.playing = true;
    r.advance(1 / 60);
    expect(r.time).toBeGreaterThan(0);
  });
});
