import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, GradeBand, ParamValues } from "@engine/types";
import { CONSTANTS } from "@engine/units";

import { circuitsSim, solveCircuit } from "./circuits";
import { energySkateSim } from "./energy-skate";
import { forcesSim } from "./forces";
import { opticsSim, solveOptics } from "./optics";
import { pendulumSim, smallAnglePeriod } from "./pendulum";
import { wavesSim, waveSpeed } from "./waves";

/**
 * Golden physics for the six mechanics, electricity, waves and optics sims.
 *
 * Every test here compares the running model against a closed-form solution
 * with the expected number written out, because the failure mode that matters
 * is not a crash — it is a simulation that runs beautifully and teaches
 * something false.
 */

const SIMS: AnySim[] = [
  circuitsSim, pendulumSim, wavesSim, energySkateSim, forcesSim, opticsSim,
];

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
 * so the render functions can be exercised under Node. A drawing bug — a bad
 * helper arity, an undefined colour, a NaN coordinate — surfaces here instead
 * of as a blank stage in a classroom.
 */
function stubContext(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  // The scene kit shades every surface with a gradient, so a fake canvas has
  // to hand one back. Its stops are checked too: an undefined colour in a
  // gradient is exactly as invisible on a real canvas as an undefined fill.
  const gradient = {
    addColorStop(offset: number, color: string) {
      if (!Number.isFinite(offset)) throw new Error("addColorStop offset is not finite");
      if (typeof color !== "string" || color.length === 0) {
        throw new Error("addColorStop received a non-colour");
      }
    },
  };
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop === "measureText") return () => ({ width: 24 });
      if (prop === "canvas") return { width: 900, height: 520 };
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        // A NaN coordinate silently draws nothing on a real canvas, which is
        // the hardest kind of rendering bug to find. Fail loudly instead.
        for (const arg of args) {
          if (typeof arg === "number" && !Number.isFinite(arg)) {
            throw new Error(`${prop} received a non-finite argument`);
          }
        }
        if (prop === "createLinearGradient" || prop === "createRadialGradient") return gradient;
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

function run(sim: AnySim, overrides: ParamValues, seconds: number, band: GradeBand = "9-12") {
  const params = { ...defaultParams(sim.params), ...overrides };
  const runner = new SimRunner({ manifest: sim, params, band, seed: "test" });
  runner.playing = true;
  for (let t = 0; t < seconds; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}

/* ------------------------------------------------------------------ *
 * Circuits — Ohm's law and the series/parallel rules
 * ------------------------------------------------------------------ */

describe("circuits", () => {
  const base = defaultParams(circuitsSim.params);

  it("obeys V = I × R for a single bulb", () => {
    // 12 V across 6 Ω is exactly 2 A, dissipating exactly 24 W.
    const s = solveCircuit({ ...base, voltage: 12, bulbResistance: 6, topology: "single", resistor: 0 });
    expect(s.current).toBeCloseTo(2, 12);
    expect(s.totalR).toBeCloseTo(6, 12);
    expect(s.power).toBeCloseTo(24, 12);
    expect(s.emf).toBeCloseTo(s.current * s.totalR, 12);
  });

  it("doubles the current when the voltage doubles", () => {
    const low = solveCircuit({ ...base, voltage: 3, bulbResistance: 6, topology: "single" });
    const high = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "single" });
    expect(high.current / low.current).toBeCloseTo(2, 12);
  });

  it("adds resistances in series and halves them in parallel", () => {
    const series = solveCircuit({ ...base, voltage: 12, bulbResistance: 6, topology: "series", bulbCount: 2 });
    const parallel = solveCircuit({ ...base, voltage: 12, bulbResistance: 6, topology: "parallel", bulbCount: 2 });
    expect(series.totalR).toBeCloseTo(12, 12);   // 6 + 6
    expect(parallel.totalR).toBeCloseTo(3, 12);  // (6 × 6) / (6 + 6)
    expect(series.current).toBeCloseTo(1, 12);
    expect(parallel.current).toBeCloseTo(4, 12);
  });

  it("gives three parallel bulbs one third of the total resistance", () => {
    const s = solveCircuit({ ...base, voltage: 9, bulbResistance: 12, topology: "parallel", bulbCount: 3 });
    expect(s.totalR).toBeCloseTo(4, 12);
    expect(s.current).toBeCloseTo(2.25, 12);
    expect(s.bulbCurrent).toBeCloseTo(0.75, 12); // each branch takes a third
    expect(s.bulbVoltage).toBeCloseTo(9, 12);    // full battery voltage each
  });

  it("dims every bulb as more are added in series — the sim's core lesson", () => {
    const one = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "single" });
    const two = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "series", bulbCount: 2 });
    const three = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "series", bulbCount: 3 });
    expect(two.bulbPower / one.bulbPower).toBeCloseTo(0.25, 10);  // half the current, half the voltage
    expect(three.bulbPower / one.bulbPower).toBeCloseTo(1 / 9, 10);
  });

  it("leaves parallel bulbs at full brightness however many there are", () => {
    const two = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "parallel", bulbCount: 2 });
    const three = solveCircuit({ ...base, voltage: 6, bulbResistance: 6, topology: "parallel", bulbCount: 3 });
    expect(two.bulbPower).toBeCloseTo(three.bulbPower, 12);
    expect(three.bulbPower).toBeCloseTo(6, 12); // 6 V across 6 Ω = 6 W
  });

  it("splits the voltage correctly across an added series resistor", () => {
    // 12 V, 6 Ω bulb + 6 Ω resistor: 1 A, and exactly half the volts each.
    const s = solveCircuit({ ...base, voltage: 12, bulbResistance: 6, resistor: 6, topology: "single" });
    expect(s.current).toBeCloseTo(1, 12);
    expect(s.bulbVoltage).toBeCloseTo(6, 12);
  });

  it("carries no current at all with the switch open", () => {
    const s = solveCircuit({ ...base, voltage: 12, switchClosed: false });
    expect(s.current).toBe(0);
    expect(s.power).toBe(0);
    expect(s.brightness).toBe(0);
  });

  it("accumulates energy at the rate P × t", () => {
    const runner = run(circuitsSim, { voltage: 12, bulbResistance: 6, topology: "single", resistor: 0 }, 2);
    // 12 V × 2 A = 24 W, so after two seconds the battery has delivered 48 J.
    expect(runner.readoutValues().energy).toBeCloseTo(24 * runner.time, 6);
    expect(runner.readoutValues().energy).toBeGreaterThan(47.5);
    expect(runner.readoutValues().energy).toBeLessThan(49);
  });
});

/* ------------------------------------------------------------------ *
 * Pendulum — T = 2π√(L/g), and where that formula stops being true
 * ------------------------------------------------------------------ */

describe("pendulum", () => {
  it("matches 2π√(L/g) at small amplitude", () => {
    // L = 1 m, g = 9.80665 → T = 2.0064 s.
    const expected = smallAnglePeriod(1, CONSTANTS.g);
    expect(expected).toBeCloseTo(2.0064, 3);
    const runner = run(pendulumSim, { length: 1, gravity: CONSTANTS.g, startAngle: 0.0873, damping: 0 }, 8);
    expect(runner.facts().period as number).toBeCloseTo(expected, 2);
  });

  it("quadruples the length to double the period", () => {
    const short = run(pendulumSim, { length: 0.5, startAngle: 0.0873, damping: 0 }, 8);
    const long = run(pendulumSim, { length: 2, startAngle: 0.0873, damping: 0 }, 12);
    const ratio = (long.facts().period as number) / (short.facts().period as number);
    expect(ratio).toBeCloseTo(2, 2);
  });

  it("is completely unaffected by mass — the misconception this sim targets", () => {
    const light = run(pendulumSim, { length: 1, mass: 0.1, startAngle: 0.5236, damping: 0 }, 8);
    const heavy = run(pendulumSim, { length: 1, mass: 5, startAngle: 0.5236, damping: 0 }, 8);
    expect(light.facts().period as number).toBeCloseTo(heavy.facts().period as number, 9);
  });

  it("swings slower on the Moon by a factor of √(g_earth/g_moon)", () => {
    const earth = run(pendulumSim, { length: 1, gravity: 9.80665, startAngle: 0.0873, damping: 0 }, 8);
    const moon = run(pendulumSim, { length: 1, gravity: 1.62, startAngle: 0.0873, damping: 0 }, 16);
    const ratio = (moon.facts().period as number) / (earth.facts().period as number);
    expect(ratio).toBeCloseTo(Math.sqrt(9.80665 / 1.62), 1);
  });

  it("takes about 18% longer at 90°, where the small-angle formula fails", () => {
    // The exact period is T0 · (2/π)·K(sin²(θ0/2)); at θ0 = 90° that is 1.1803.
    const runner = run(pendulumSim, { length: 1, gravity: CONSTANTS.g, startAngle: Math.PI / 2, damping: 0 }, 10);
    const ratio = (runner.facts().period as number) / smallAnglePeriod(1, CONSTANTS.g);
    expect(ratio).toBeGreaterThan(1.17);
    expect(ratio).toBeLessThan(1.19);
  });

  it("conserves energy with no damping", () => {
    const runner = run(pendulumSim, { length: 1, mass: 2, startAngle: 1, damping: 0 }, 12);
    const r = runner.readoutValues();
    const m = 2, L = 1, g = CONSTANTS.g;
    const expectedTotal = m * g * L * (1 - Math.cos(1)); // released from rest at 1 rad
    expect(r.total).toBeCloseTo(expectedTotal, 4);
  });

  it("loses energy once damping is switched on", () => {
    const runner = run(pendulumSim, { length: 1, mass: 1, startAngle: 1, damping: 0.6 }, 12);
    const start = CONSTANTS.g * (1 - Math.cos(1));
    expect(runner.readoutValues().total).toBeLessThan(start * 0.5);
  });

  it("reproduces g from the measured period", () => {
    const runner = run(pendulumSim, { length: 1.5, gravity: CONSTANTS.g, startAngle: 0.0873, damping: 0 }, 12);
    expect(runner.facts().gEstimate as number).toBeCloseTo(CONSTANTS.g, 1);
  });
});

/* ------------------------------------------------------------------ *
 * Waves — v = f λ, and the standing-wave condition
 * ------------------------------------------------------------------ */

describe("waves", () => {
  it("computes wave speed as √(tension / mass per metre)", () => {
    expect(waveSpeed({ tension: 6.4, density: 0.4 })).toBeCloseTo(4, 12);
    expect(waveSpeed({ tension: 25.6, density: 0.4 })).toBeCloseTo(8, 12);
    expect(waveSpeed({ tension: 1.6, density: 0.4 })).toBeCloseTo(2, 12);
  });

  it("measures a wavelength that satisfies v = f λ", () => {
    // c = 4 m/s at 0.5 Hz gives λ = 8 m on a 10 m string.
    const runner = run(wavesSim, {
      amplitude: 0.15, frequency: 0.5, tension: 6.4, density: 0.4,
      damping: 0.5, boundary: "open", twoSources: false,
    }, 12);
    const r = runner.readoutValues();
    expect(r.speed).toBeCloseTo(4, 9);
    expect(r.wavelength).toBeCloseTo(8, 0);
    expect(r.fLambda).toBeCloseTo(r.speed, 0);
  });

  it("halves the wavelength when the frequency doubles", () => {
    const slow = run(wavesSim, {
      amplitude: 0.15, frequency: 0.4, tension: 6.4, density: 0.4,
      damping: 0.5, boundary: "open", twoSources: false,
    }, 12);
    const fast = run(wavesSim, {
      amplitude: 0.15, frequency: 0.8, tension: 6.4, density: 0.4,
      damping: 0.5, boundary: "open", twoSources: false,
    }, 12);
    const ratio = slow.readoutValues().wavelength / fast.readoutValues().wavelength;
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2.2);
  });

  it("keeps the speed fixed when the frequency changes, and only then", () => {
    const a = run(wavesSim, { frequency: 0.3, tension: 6.4, density: 0.4, boundary: "open" }, 6);
    const b = run(wavesSim, { frequency: 1.2, tension: 6.4, density: 0.4, boundary: "open" }, 6);
    const c = run(wavesSim, { frequency: 0.3, tension: 25.6, density: 0.4, boundary: "open" }, 6);
    expect(a.readoutValues().speed).toBeCloseTo(b.readoutValues().speed, 9);
    expect(c.readoutValues().speed).toBeCloseTo(2 * a.readoutValues().speed, 9);
  });

  it("builds a three-antinode standing wave at the third harmonic", () => {
    // Fixed end, c = 4 m/s, L = 10 m. The nth mode sits at f = n·c/(2L),
    // so three humps means 3 × 4 / 20 = 0.6 Hz.
    const runner = run(wavesSim, {
      amplitude: 0.06, frequency: 0.6, tension: 6.4, density: 0.4,
      damping: 0.06, boundary: "fixed", twoSources: false,
    }, 45);
    const facts = runner.facts();
    expect(facts.antinodes as number).toBe(3);
    expect(facts.standing).toBe(true);
    expect(runner.readoutValues().wavelength).toBeCloseTo(20 / 3, 0);
  });

  it("resonates far harder on resonance than off it", () => {
    const on = run(wavesSim, {
      amplitude: 0.06, frequency: 0.6, tension: 6.4, density: 0.4,
      damping: 0.06, boundary: "fixed", twoSources: false,
    }, 40);
    const off = run(wavesSim, {
      amplitude: 0.06, frequency: 0.5, tension: 6.4, density: 0.4,
      damping: 0.06, boundary: "fixed", twoSources: false,
    }, 40);
    expect(on.facts().amplitude as number).toBeGreaterThan(1.5 * (off.facts().amplitude as number));
  });

  it("stays bounded at the fastest wave speed the student can dial in", () => {
    const runner = run(wavesSim, {
      amplitude: 0.4, frequency: 3, tension: 25.6, density: 0.1,
      damping: 0, boundary: "fixed", twoSources: true,
    }, 20);
    for (const r of runner.readouts()) {
      expect(Number.isFinite(r.quantity.value), `${r.key} blew up`).toBe(true);
    }
    expect(runner.facts().amplitude as number).toBeLessThan(50);
  });
});

/* ------------------------------------------------------------------ *
 * Energy Skate Park — conservation, and v = √(2gh)
 * ------------------------------------------------------------------ */

describe("energy skate park", () => {
  it("reaches √(2gh) at the bottom of a frictionless valley", () => {
    const runner = run(energySkateSim, {
      track: "valley", startHeight: 8, mass: 60, friction: 0, gravity: CONSTANTS.g,
    }, 6);
    // Dropping 8 m gives √(2 × 9.80665 × 8) = 12.53 m/s.
    const expected = Math.sqrt(2 * CONSTANTS.g * 8);
    expect(expected).toBeCloseTo(12.53, 2);
    expect(runner.facts().maxSpeed as number).toBeCloseTo(expected, 1);
  });

  it("conserves total energy with no friction", () => {
    const params = { ...defaultParams(energySkateSim.params), track: "valley", startHeight: 8, friction: 0 };
    const runner = new SimRunner({ manifest: energySkateSim, params, band: "9-12", seed: "t" });
    const initial = runner.facts().total as number;
    runner.playing = true;
    for (let t = 0; t < 20; t += 1 / 60) runner.advance(1 / 60);
    const final = runner.facts().total as number;
    expect(Math.abs(final - initial) / initial).toBeLessThan(0.01);
  });

  it("gives the same speed whatever the mass — the misconception this sim targets", () => {
    const light = run(energySkateSim, { track: "valley", startHeight: 8, mass: 20, friction: 0 }, 6);
    const heavy = run(energySkateSim, { track: "valley", startHeight: 8, mass: 100, friction: 0 }, 6);
    expect(light.facts().maxSpeed as number).toBeCloseTo(heavy.facts().maxSpeed as number, 6);
  });

  it("returns to the same height on the far side with no friction", () => {
    const runner = run(energySkateSim, { track: "valley", startHeight: 8, friction: 0 }, 40);
    const facts = runner.facts();
    // Height never exceeds where it started, and mechanical energy is intact.
    expect(facts.height as number).toBeLessThanOrEqual(8.1);
    expect(facts.thermal as number).toBeCloseTo(0, 6);
  });

  it("moves the missing energy into the thermal bar when friction is on", () => {
    const params = { ...defaultParams(energySkateSim.params), track: "valley", startHeight: 8, friction: 0.15 };
    const runner = new SimRunner({ manifest: energySkateSim, params, band: "9-12", seed: "t" });
    const initial = runner.facts().total as number;
    runner.playing = true;
    for (let t = 0; t < 40; t += 1 / 60) runner.advance(1 / 60);
    const facts = runner.facts();
    expect(facts.thermal as number).toBeGreaterThan(0);
    expect(facts.mechanical as number).toBeLessThan(initial);
    // Nothing is destroyed: the three bars still add to the starting total.
    expect(Math.abs((facts.total as number) - initial) / initial).toBeLessThan(0.002);
  });

  it("completes the loop from exactly 2.5 loop radii, and fails just below", () => {
    // v_top² ≥ gR is the condition for staying on the inside at the top, which
    // needs a drop of 2.5R above the bottom of the loop. Here R = 2.2 m, so the
    // threshold is 5.5 m — and the model reproduces it to the nearest 0.5 m.
    const over = run(energySkateSim, { track: "loop", startHeight: 5.5, friction: 0 }, 12);
    const under = run(energySkateSim, { track: "loop", startHeight: 5, friction: 0 }, 12);
    expect(over.facts().loops as number).toBeGreaterThanOrEqual(1);
    expect(over.facts().departures as number).toBe(0);
    expect(under.facts().loops as number).toBe(0);
    expect(under.facts().departures as number).toBeGreaterThan(0);
  });

  it("needs a higher drop to loop once friction is on", () => {
    const clean = run(energySkateSim, { track: "loop", startHeight: 6, friction: 0 }, 12);
    const rough = run(energySkateSim, { track: "loop", startHeight: 6, friction: 0.02 }, 12);
    expect(clean.facts().loops as number).toBe(1);
    expect(rough.facts().loops as number).toBe(0);
  });

  it("cannot climb a hill taller than it started from", () => {
    const short = run(energySkateSim, { track: "hill", startHeight: 5, friction: 0 }, 20);
    const tall = run(energySkateSim, { track: "hill", startHeight: 9, friction: 0 }, 20);
    expect(short.facts().maxX as number).toBeLessThan(12);   // turned back at the 6 m crest
    expect(tall.facts().maxX as number).toBeGreaterThan(15); // cleared it
  });
});

/* ------------------------------------------------------------------ *
 * Forces — F = ma, and the static/kinetic friction split
 * ------------------------------------------------------------------ */

describe("forces", () => {
  it("accelerates at exactly F_net / m", () => {
    const runner = run(forcesSim, {
      appliedForce: 100, pushing: true, mass: 20, surface: "custom",
      friction: 0, gravity: CONSTANTS.g,
    }, 1);
    // No friction: 100 N on 20 kg is exactly 5 m/s².
    expect(runner.readoutValues().acceleration).toBeCloseTo(5, 9);
    expect(runner.readoutValues().velocity).toBeCloseTo(5, 1);
  });

  it("halves the acceleration when the mass doubles", () => {
    const light = run(forcesSim, {
      appliedForce: 100, mass: 20, surface: "custom", friction: 0, gravity: CONSTANTS.g,
    }, 1);
    const heavy = run(forcesSim, {
      appliedForce: 100, mass: 40, surface: "custom", friction: 0, gravity: CONSTANTS.g,
    }, 1);
    expect(light.readoutValues().acceleration / heavy.readoutValues().acceleration).toBeCloseTo(2, 9);
  });

  it("subtracts kinetic friction from the push", () => {
    // 100 N push, 20 kg on wood (μk = 0.3): friction is 0.3 × 20 × 9.80665 = 58.84 N.
    const runner = run(forcesSim, {
      appliedForce: 100, mass: 20, surface: "wood", gravity: CONSTANTS.g,
    }, 1);
    const r = runner.readoutValues();
    expect(r.friction).toBeCloseTo(-58.84, 1);
    expect(r.net).toBeCloseTo(41.16, 1);
    expect(r.acceleration).toBeCloseTo(41.16 / 20, 2);
  });

  it("refuses to move below the static friction limit", () => {
    // Carpet: μs = 0.78, so a 20 kg box needs more than 153 N to break free.
    const stuck = run(forcesSim, { appliedForce: 120, mass: 20, surface: "carpet" }, 3);
    expect(stuck.facts().hasMoved).toBe(false);
    expect(stuck.readoutValues().velocity).toBe(0);
    expect(stuck.readoutValues().net).toBeCloseTo(0, 9);

    const free = run(forcesSim, { appliedForce: 165, mass: 20, surface: "carpet" }, 3);
    expect(free.facts().hasMoved).toBe(true);
  });

  it("matches the static limit μs·m·g exactly", () => {
    const runner = run(forcesSim, { mass: 20, surface: "carpet", gravity: CONSTANTS.g }, 0.2);
    expect(runner.facts().staticLimit as number).toBeCloseTo(0.78 * 20 * CONSTANTS.g, 6);
  });

  it("keeps moving after the push stops — motion needs no force", () => {
    const params = {
      ...defaultParams(forcesSim.params),
      appliedForce: 200, pushing: true, mass: 20, surface: "custom", friction: 0,
    };
    const runner = new SimRunner({ manifest: forcesSim, params, band: "9-12", seed: "t" });
    runner.playing = true;
    for (let t = 0; t < 1; t += 1 / 60) runner.advance(1 / 60);
    const speed = runner.readoutValues().velocity;
    runner.setParams({ ...params, pushing: false });
    for (let t = 0; t < 3; t += 1 / 60) runner.advance(1 / 60);
    expect(runner.readoutValues().velocity).toBeCloseTo(speed, 6);
    expect(runner.readoutValues().acceleration).toBeCloseTo(0, 9);
  });

  it("stops in the distance v²/(2 μk g) once the push is released", () => {
    const params = {
      ...defaultParams(forcesSim.params),
      appliedForce: 300, pushing: true, mass: 20, surface: "wood", gravity: CONSTANTS.g, targetX: 20,
    };
    const runner = new SimRunner({ manifest: forcesSim, params, band: "9-12", seed: "t" });
    runner.playing = true;
    for (let t = 0; t < 1; t += 1 / 60) runner.advance(1 / 60);
    const v0 = runner.readoutValues().velocity;
    const x0 = runner.readoutValues().position;
    runner.setParams({ ...params, pushing: false });
    for (let t = 0; t < 10; t += 1 / 60) runner.advance(1 / 60);
    // Kinetic energy is eaten by friction over exactly v²/(2 μk g) metres.
    const expected = (v0 * v0) / (2 * 0.3 * CONSTANTS.g);
    expect(runner.readoutValues().position - x0).toBeCloseTo(expected, 0);
    expect(runner.facts().stopped).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Optics — the thin-lens equation
 * ------------------------------------------------------------------ */

describe("optics", () => {
  const base = defaultParams(opticsSim.params);

  it("satisfies 1/f = 1/do + 1/di for a converging lens", () => {
    // f = 0.5 m, do = 1.5 m → di = 0.75 m, m = -0.5.
    const s = solveOptics({ ...base, element: "converging", focalLength: 0.5, objectDistance: 1.5 });
    expect(s.dImage).toBeCloseTo(0.75, 12);
    expect(1 / s.dObject + 1 / s.dImage).toBeCloseTo(1 / s.f, 12);
    expect(s.magnification).toBeCloseTo(-0.5, 12);
    expect(s.real).toBe(true);
    expect(s.upright).toBe(false);
  });

  it("puts the image at 2f when the object is at 2f", () => {
    const s = solveOptics({ ...base, element: "converging", focalLength: 0.4, objectDistance: 0.8 });
    expect(s.dImage).toBeCloseTo(0.8, 12);
    expect(s.magnification).toBeCloseTo(-1, 12);
  });

  it("gives an upright virtual image inside the focal length", () => {
    // f = 0.5, do = 0.25 → di = -0.5 (virtual), m = +2.
    const s = solveOptics({ ...base, element: "converging", focalLength: 0.5, objectDistance: 0.25 });
    expect(s.dImage).toBeCloseTo(-0.5, 12);
    expect(s.magnification).toBeCloseTo(2, 12);
    expect(s.real).toBe(false);
    expect(s.upright).toBe(true);
  });

  it("makes a diverging lens always give a smaller, upright, virtual image", () => {
    for (const dObj of [0.2, 0.5, 1, 2, 2.5]) {
      const s = solveOptics({ ...base, element: "diverging", focalLength: 0.5, objectDistance: dObj });
      expect(s.real).toBe(false);
      expect(s.upright).toBe(true);
      expect(Math.abs(s.magnification)).toBeLessThan(1);
      expect(1 / s.dObject + 1 / s.dImage).toBeCloseTo(1 / s.f, 10);
    }
  });

  it("treats a concave mirror like a converging lens and a convex one like a diverging lens", () => {
    const mirror = solveOptics({ ...base, element: "concave", focalLength: 0.5, objectDistance: 1.5 });
    const lens = solveOptics({ ...base, element: "converging", focalLength: 0.5, objectDistance: 1.5 });
    expect(mirror.dImage).toBeCloseTo(lens.dImage, 12);
    expect(mirror.mirror).toBe(true);

    const convex = solveOptics({ ...base, element: "convex", focalLength: 0.5, objectDistance: 1.5 });
    expect(convex.real).toBe(false);
    expect(convex.upright).toBe(true);
  });

  it("solves the double-size challenge at do = 1.5 f", () => {
    const s = solveOptics({ ...base, element: "converging", focalLength: 0.5, objectDistance: 0.75 });
    expect(Math.abs(s.magnification)).toBeCloseTo(2, 10);
    expect(s.real).toBe(true);
  });

  it("forms no image when the object sits at the focal point", () => {
    const s = solveOptics({ ...base, element: "converging", focalLength: 0.5, objectDistance: 0.5 });
    expect(s.atFocus).toBe(true);
    expect(Number.isFinite(s.dImage)).toBe(true);
    expect(s.real).toBe(false);
  });

  it("scales the image height by the magnification", () => {
    const s = solveOptics({
      ...base, element: "converging", focalLength: 0.5, objectDistance: 1.5, objectHeight: 0.3,
    });
    expect(s.imageHeight).toBeCloseTo(-0.15, 12);
  });
});

/* ------------------------------------------------------------------ *
 * Contract checks that apply to every physics sim
 * ------------------------------------------------------------------ */

describe("physics sim manifests", () => {
  it.each(SIMS.map((s) => [s.id, s] as const))("%s exposes finite readouts from the first frame", (_id, sim) => {
    for (const band of sim.bands) {
      const runner = new SimRunner({ manifest: sim, params: defaultParams(sim.params), band });
      for (const r of runner.readouts()) {
        expect(Number.isFinite(r.quantity.value), `${r.key} at ${band}`).toBe(true);
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s stays finite after a long run", (_id, sim) => {
    const runner = run(sim, {}, 25);
    for (const r of runner.readouts()) {
      expect(Number.isFinite(r.quantity.value), `${r.key}`).toBe(true);
    }
    for (const [key, value] of Object.entries(runner.facts())) {
      if (typeof value === "number") {
        expect(Number.isFinite(value) || value === Number.POSITIVE_INFINITY, key).toBe(true);
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s keeps defaults inside their own range", (_id, sim) => {
    for (const [key, spec] of Object.entries(sim.params)) {
      if (spec.type === "number") {
        expect(spec.default, `${key} below min`).toBeGreaterThanOrEqual(spec.min);
        expect(spec.default, `${key} above max`).toBeLessThanOrEqual(spec.max);
        expect(spec.max, `${key} has an empty range`).toBeGreaterThan(spec.min);
      }
      if (spec.type === "option") {
        expect(spec.options.map((o) => o.value), `${key} default not an option`).toContain(spec.default);
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s declares labs and challenges on supported bands", (_id, sim) => {
    for (const lab of sim.labs ?? []) {
      expect(lab.bands.length, `${lab.id} has no bands`).toBeGreaterThan(0);
      for (const band of lab.bands) expect(sim.bands).toContain(band);
      // Every lab must open with a prediction: it is the highest-value move.
      expect(lab.steps[0].predict, `${lab.id} does not open with a prediction`).toBeDefined();
      for (const step of lab.steps) {
        if (step.predict) {
          expect(step.predict.correct).toBeGreaterThanOrEqual(0);
          expect(step.predict.correct).toBeLessThan(step.predict.options.length);
        }
      }
      for (const key of Object.keys(lab.setup ?? {})) {
        expect(Object.keys(sim.params), `${lab.id} sets unknown param ${key}`).toContain(key);
      }
    }
    expect(sim.challenges?.length ?? 0, `${sim.id} has no challenges`).toBeGreaterThan(0);
    for (const ch of sim.challenges ?? []) {
      for (const band of ch.bands) expect(sim.bands).toContain(band);
      for (const key of Object.keys(ch.setup ?? {})) {
        expect(Object.keys(sim.params), `${ch.id} sets unknown param ${key}`).toContain(key);
      }
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s runs identically for identical inputs", (_id, sim) => {
    const a = run(sim, {}, 3);
    const b = run(sim, {}, 3);
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s is independent of the real-time frame rate", (_id, sim) => {
    const params = defaultParams(sim.params);
    const smooth = new SimRunner({ manifest: sim, params, band: "9-12", seed: "s" });
    const choppy = new SimRunner({ manifest: sim, params, band: "9-12", seed: "s" });
    smooth.playing = true;
    choppy.playing = true;
    for (let i = 0; i < 120; i++) smooth.advance(1 / 60);
    for (let i = 0; i < 24; i++) choppy.advance(1 / 12);
    expect(smooth.ticks).toBe(choppy.ticks);
    expect(smooth.fingerprint()).toBe(choppy.fingerprint());
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s draws every option at every band", (_id, sim) => {
    // One run per option value, so a topology or a track shape that only some
    // students ever select is still exercised.
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
        for (let i = 0; i < 120; i++) runner.advance(1 / 60);
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

  it("survives the singular configurations", () => {
    // Each of these is a genuine edge of the physics rather than a random
    // combination: no current, no image, the extreme ends of every slider.
    const cases: [AnySim, ParamValues][] = [
      [circuitsSim, { voltage: 0, switchClosed: false }],
      [circuitsSim, { voltage: 12, bulbResistance: 2, topology: "parallel", bulbCount: 3, resistor: 0 }],
      [opticsSim, { element: "converging", objectDistance: 0.5, focalLength: 0.5 }],
      [opticsSim, { element: "diverging", objectDistance: 0.1, focalLength: 1.2, objectHeight: 0.6 }],
      [opticsSim, { element: "concave", objectDistance: 2.5, focalLength: 0.15 }],
      [pendulumSim, { length: 0.2, startAngle: 2.618, damping: 1.5, mass: 0.1, gravity: 25 }],
      [wavesSim, { amplitude: 0.02, frequency: 0.1, tension: 0.4, density: 1.6, boundary: "free" }],
      [energySkateSim, { track: "loop", startHeight: 1, friction: 0.4, mass: 100 }],
      [forcesSim, { appliedForce: -300, mass: 5, surface: "ice", targetX: 5 }],
      [forcesSim, { appliedForce: 0, pushing: false, mass: 100, surface: "carpet" }],
    ];
    for (const [sim, overrides] of cases) {
      const params = { ...defaultParams(sim.params), ...overrides };
      const runner = new SimRunner({ manifest: sim, params, band: "9-12", seed: "edge" });
      runner.playing = true;
      for (let i = 0; i < 240; i++) runner.advance(1 / 60);
      for (const r of runner.readouts()) {
        expect(Number.isFinite(r.quantity.value), `${sim.id}.${r.key}`).toBe(true);
      }
      const overlays: Record<string, boolean> = {};
      for (const o of sim.overlays ?? []) overlays[o.key] = true;
      expect(() => sim.render({
        ctx: stubContext(), state: runner.getState(), params, band: "9-12",
        width: 900, height: 520, overlays, alpha: 1, theme: TEST_THEME, time: runner.time,
      }), sim.id).not.toThrow();
    }
  });

  it.each(SIMS.map((s) => [s.id, s] as const))("%s targets named misconceptions", (_id, sim) => {
    expect(sim.misconceptions?.length ?? 0).toBeGreaterThan(0);
    expect(sim.learningGoals.length).toBeGreaterThan(1);
    expect(sim.labs?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
