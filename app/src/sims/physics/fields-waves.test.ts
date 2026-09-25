import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, GradeBand, ParamValues } from "@engine/types";
import { CONSTANTS } from "@engine/units";

import { BREAKDOWN_FIELD, breakdownCharge, coulombForce, electricForceSim } from "./electric-force";
import {
  CORE_MU, EARTH_FIELD, EARTH_HORIZONTAL, MU0, clipsLifted, compassBearing, dipoleAxialField,
  dipoleForce, magnetismSim, solenoidField,
} from "./magnetism";
import {
  WORLDS, fallTime, gravitationalForce, gravitySim, jumpHeight, surfaceGravity, worldOf,
} from "./gravity";
import {
  RIPPLE_SPEED, fieldAt, fieldUnit, fieldsSim, sourceStrength,
} from "./fields";
import type { Source } from "./fields";
import {
  HEARING_MAX, HEARING_MIN, MEDIA, P_REF, airSpeed, audible, decibels, echoTime, mediumOf,
  pressureAt, soundSim, soundSpeed,
} from "./sound";
import {
  BANDS, IONIZING_EV, bandOf, emSpectrumSim, frequencyOf, photonEnergy, photonEnergyEV,
  visibleColor,
} from "./em-spectrum";

/**
 * Golden values for the Grade 8 fields-and-waves batch.
 *
 * Each of these sims makes a quantitative claim on screen — a force, a field
 * strength, a speed of sound, a photon energy, a bit error rate — and a
 * student has no way to catch it if the claim is wrong. So every claim is
 * checked here against a number physics already knows, written out.
 */

const SIMS: AnySim[] = [
  electricForceSim, magnetismSim, gravitySim, fieldsSim, soundSim, emSpectrumSim,
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
 * Magnetism
 * ================================================================== */

describe("magnetism: fields with the real magnetic constant", () => {
  it("uses µ₀ = 4π × 10⁻⁷", () => {
    expect(MU0).toBeCloseTo(1.25663706e-6, 12);
  });

  it("puts 2.36 mT inside a 100-turn, 8 cm coil carrying 1.5 A", () => {
    // B = µ₀NI/L = 1.2566e-6 × 100 × 1.5 / 0.08 = 2.356e-3 T
    expect(solenoidField(100, 1.5, 0.08)).toBeCloseTo(2.3562e-3, 6);
  });

  it("follows turns × current, and cannot tell which one you doubled", () => {
    const base = solenoidField(50, 1, 0.08);
    expect(solenoidField(100, 1, 0.08)).toBeCloseTo(2 * base, 12);
    expect(solenoidField(50, 2, 0.08)).toBeCloseTo(2 * base, 12);
    expect(solenoidField(100, 2, 0.08)).toBeCloseTo(4 * base, 12);
    // Spreading the same turns over twice the length halves the field.
    expect(solenoidField(50, 1, 0.16)).toBeCloseTo(base / 2, 12);
  });

  it("switches the magnetism off with the current", () => {
    expect(solenoidField(400, 0, 0.08, 200)).toBe(0);
    expect(clipsLifted(0)).toBe(0);
  });

  it("makes iron a huge difference and copper none at all", () => {
    expect(CORE_MU.iron).toBe(200);
    expect(CORE_MU.copper).toBe(1);
    expect(solenoidField(100, 1.5, 0.08, CORE_MU.iron))
      .toBeCloseTo(200 * solenoidField(100, 1.5, 0.08), 9);
    expect(solenoidField(100, 1.5, 0.08, CORE_MU.copper))
      .toBeCloseTo(solenoidField(100, 1.5, 0.08, CORE_MU.air), 12);
  });

  it("puts 100 µT on the axis of a 0.5 A·m² magnet at 10 cm", () => {
    // B = µ₀m / 2πr³ = 1.2566e-6 × 0.5 / (2π × 1e-3) = 1.0e-4 T
    expect(dipoleAxialField(0.5, 0.1)).toBeCloseTo(1.0e-4, 8);
    // 1/r³: eight times weaker at twice the distance.
    expect(dipoleAxialField(0.5, 0.1) / dipoleAxialField(0.5, 0.2)).toBeCloseTo(8, 10);
  });

  it("kills the force between two magnets as 1 ÷ gap⁴", () => {
    const near = dipoleForce(0.5, 0.5, 0.05);
    expect(near / dipoleForce(0.5, 0.5, 0.1)).toBeCloseTo(16, 10);
    expect(near / dipoleForce(0.5, 0.5, 0.15)).toBeCloseTo(81, 10);
    // Far faster than the 1/r² of gravity or charge — the point of the lab.
    expect(near / dipoleForce(0.5, 0.5, 0.1)).toBeGreaterThan(4);
  });

  it("reports one force for the pair", () => {
    const f = factsOf(magnetismSim, { scene: "poles", magnetStrength: 0.5 }, 1);
    expect(f.force as number).toBeCloseTo(dipoleForce(0.5, 0.5, f.separation as number), 12);
    expect(f.repel).toBe(true);
    expect(factsOf(magnetismSim, { scene: "poles", flipMagnet: true }, 1).attract).toBe(true);
  });

  it("keeps Earth's field inside the real 25-65 µT range", () => {
    expect(EARTH_FIELD).toBeCloseTo(50e-6, 12);
    expect(EARTH_FIELD).toBeGreaterThan(25e-6);
    expect(EARTH_FIELD).toBeLessThan(65e-6);
    expect(EARTH_HORIZONTAL).toBeLessThan(EARTH_FIELD);
  });

  it("points the compass at magnetic north, not true north", () => {
    expect(compassBearing(0, 13, false)).toBeCloseTo(13, 10);
    expect(compassBearing(0, 0, false)).toBeCloseTo(0, 10);
  });

  it("swings the needle 45° when the bar magnet matches Earth's horizontal field", () => {
    expect(compassBearing(EARTH_HORIZONTAL, 0, false)).toBeCloseTo(-45, 10);
    expect(compassBearing(EARTH_HORIZONTAL, 0, true)).toBeCloseTo(45, 10);
    // Ten times Earth's field and the needle has all but forgotten the planet.
    expect(Math.abs(compassBearing(10 * EARTH_HORIZONTAL, 0, false))).toBeGreaterThan(84);
  });

  it("settles the needle onto the field direction", () => {
    const runner = run(magnetismSim, { scene: "earth", magnetStrength: 0.5, declination: 13 }, 6);
    const f = runner.facts();
    expect(f.bearing as number).toBeCloseTo(f.settledBearing as number, 1);
  });

  it("beats Earth's field with one small magnet close in", () => {
    const runner = run(magnetismSim, { scene: "earth", magnetStrength: 0.5 }, 0.2);
    dragTo(runner, 96 + 0.08 / 0.0006);         // 8 cm from the compass
    for (let i = 0; i < 400; i++) runner.advance(1 / 60);
    const f = runner.facts();
    expect(f.separation as number).toBeCloseTo(0.08, 6);
    expect(f.magnetFieldAtCompass as number).toBeGreaterThan(EARTH_HORIZONTAL);
    expect(f.deflection as number).toBeGreaterThan(45);
  });
});

/* ================================================================== *
 * Gravity
 * ================================================================== */

describe("gravity: Newton's law, and the same 1/r² as charge", () => {
  it("uses the measured value of G", () => {
    expect(CONSTANTS.G).toBeCloseTo(6.674e-11, 14);
  });

  it("puts two 60 kg people 1 m apart at 0.24 µN", () => {
    // F = 6.6743e-11 × 3600 / 1 = 2.403e-7 N — about the weight of a speck of dust.
    expect(gravitationalForce(60, 60, 1)).toBeCloseTo(2.4027e-7, 11);
  });

  it("quarters the pull at twice the distance and doubles it at twice the mass", () => {
    const base = gravitationalForce(60, 60, 2);
    expect(base / gravitationalForce(60, 60, 4)).toBeCloseTo(4, 10);
    expect(base / gravitationalForce(60, 60, 6)).toBeCloseTo(9, 10);
    expect(gravitationalForce(120, 60, 2) / base).toBeCloseTo(2, 10);
    expect(gravitationalForce(120, 120, 2) / base).toBeCloseTo(4, 10);
  });

  it("keeps F × r² constant, exactly as the electric force does", () => {
    const products = [0.5, 1, 2.5, 7, 16].map((r) => gravitationalForce(60, 900, r) * r * r);
    for (const p of products) expect(p).toBeCloseTo(products[0], 20);
  });

  it("makes everyday gravity nine orders of magnitude below a person's weight", () => {
    const f = factsOf(gravitySim, { scene: "pair", massA: 60, massB: 60 }, 1);
    expect(f.force as number).toBeLessThan(1e-6);
    expect(f.timesSmallerThanWeight as number).toBeGreaterThan(1e8);
    expect(f.attractive).toBe(true);
  });

  it("derives every world's gravity from its own mass and radius", () => {
    // Textbook surface gravities, none of them typed into the sim.
    const expected: Record<string, number> = {
      moon: 1.62, mars: 3.73, earth: 9.82, jupiter: 24.79, sun: 274, ceres: 0.28,
    };
    for (const [key, g] of Object.entries(expected)) {
      const w = worldOf(key);
      expect(surfaceGravity(w.mass, w.radius), key).toBeCloseTo(g, g > 100 ? -0.5 : 1);
    }
  });

  it("makes the Moon about one sixth of Earth", () => {
    const moon = surfaceGravity(worldOf("moon").mass, worldOf("moon").radius);
    const earth = surfaceGravity(worldOf("earth").mass, worldOf("earth").radius);
    expect(earth / moon).toBeCloseTo(6.05, 1);
  });

  it("keeps mass fixed while the scale reading changes from world to world", () => {
    const readings = WORLDS.filter((w) => !w.freeFall).map((w) => {
      const f = factsOf(gravitySim, { scene: "world", world: w.key, bodyMass: 50 }, 1);
      expect(f.mass).toBe(50);                       // the label never changes
      expect(f.weight as number).toBeCloseTo(50 * (f.gravity as number), 6);
      return f.scaleKg as number;
    });
    // Earth is the only place the Earth-calibrated scale tells the truth.
    const earth = factsOf(gravitySim, { scene: "world", world: "earth", bodyMass: 50 }, 1);
    expect(earth.scaleKg as number).toBeCloseTo(50, 0);
    expect(new Set(readings.map((r) => Math.round(r))).size).toBeGreaterThan(4);
  });

  it("keeps gravity strong on the space station while the scale reads zero", () => {
    const f = factsOf(gravitySim, { scene: "world", world: "iss", bodyMass: 50 }, 1);
    // 420 km up, g is still 8.6 m/s²: 88% of the value on the ground.
    expect(f.gravity as number).toBeCloseTo(8.65, 1);
    expect((f.gravity as number) / 9.80665).toBeGreaterThan(0.85);
    expect(f.weight).toBe(0);
    expect(f.scaleKg).toBe(0);
    expect(f.freeFall).toBe(true);
  });

  it("sends a 20 cm Earth jump 1.2 m up on the Moon", () => {
    const gMoon = surfaceGravity(worldOf("moon").mass, worldOf("moon").radius);
    expect(jumpHeight(9.80665)).toBeCloseTo(0.2, 6);
    expect(jumpHeight(gMoon)).toBeCloseTo(1.21, 1);
  });

  it("drops two 60 kg masses together in the time the closed form predicts", () => {
    // Released from 4 m, two 60 kg spheres of water density meet after ~27 h.
    const analytic = fallTime(4, 0.4867, 60, 60);
    expect(analytic / 3600).toBeCloseTo(27, 0);

    const runner = run(gravitySim, { scene: "pair", massA: 60, massB: 60, release: true }, 0.1);
    // Long enough for the time-lapse to carry them all the way in.
    for (let i = 0; i < 20000 && !runner.facts().touching; i++) runner.advance(1 / 60);
    const f = runner.facts();
    expect(f.touching).toBe(true);
    // The integration has to agree with the analytic infall to within 2%.
    const predicted = fallTime(4, f.contactGap as number, 60, 60) / 3600;
    expect(Math.abs((f.elapsedHours as number) - predicted) / predicted).toBeLessThan(0.02);
  });

  it("brings heavier masses together sooner from the same start", () => {
    expect(fallTime(4, 0.5, 20000, 20000)).toBeLessThan(fallTime(4, 0.5, 60, 60));
    // Four times the total mass halves the fall time.
    expect(fallTime(4, 0, 60, 60) / fallTime(4, 0, 240, 240)).toBeCloseTo(2, 6);
  });
});

/* ================================================================== *
 * Fields — the unifying sim
 * ================================================================== */

describe("fields: one shape, three kinds of source", () => {
  it("gives an electric source the same 1/r² as Coulomb's law", () => {
    // 10 nC at half a metre: E = 8.988e9 × 1e-8 / 0.25 = 359.5 N/C
    expect(sourceStrength("charge", 10, 0.5)).toBeCloseTo(359.5, 1);
    expect(sourceStrength("charge", 10, 0.5) / sourceStrength("charge", 10, 1)).toBeCloseTo(4, 10);
    expect(sourceStrength("charge", 10, 1) / sourceStrength("charge", 10, 3)).toBeCloseTo(9, 10);
  });

  it("gives a mass source the same 1/r², in N/kg", () => {
    // 10 billion kg at half a metre: g = 6.674e-11 × 1e10 / 0.25 = 2.67 N/kg
    expect(sourceStrength("mass", 10, 0.5)).toBeCloseTo(2.6697, 3);
    expect(sourceStrength("mass", 7, 1) / sourceStrength("mass", 7, 2)).toBeCloseTo(4, 10);
    expect(fieldUnit("mass")).toBe("N/kg");
    expect(fieldUnit("charge")).toBe("N/C");
  });

  it("gives a magnetic dipole 1/r³ instead", () => {
    expect(sourceStrength("magnet", 10, 0.5) / sourceStrength("magnet", 10, 1)).toBeCloseTo(8, 10);
  });

  it("doubles with the strength, for every kind", () => {
    for (const kind of ["charge", "mass", "magnet"] as const) {
      expect(sourceStrength(kind, 20, 0.7) / sourceStrength(kind, 10, 0.7), kind).toBeCloseTo(2, 10);
    }
  });

  it("adds two fields as vectors, and cancels them exactly halfway", () => {
    const pair: Source[] = [{ x: 100, y: 100, sign: 1 }, { x: 300, y: 100, sign: 1 }];
    const middle = fieldAt(pair, "charge", 10, 200, 100);
    expect(middle.mag).toBeLessThan(1e-9);
    // Off the midline it does not cancel, and it points away from the pair.
    const above = fieldAt(pair, "charge", 10, 200, 40);
    expect(above.mag).toBeGreaterThan(0);
    expect(above.fy).toBeLessThan(0);
  });

  it("never cancels between opposite sources — it is strongest there", () => {
    const dipole: Source[] = [{ x: 100, y: 100, sign: 1 }, { x: 300, y: 100, sign: -1 }];
    const middle = fieldAt(dipole, "charge", 10, 200, 100);
    const single = fieldAt([dipole[0]], "charge", 10, 200, 100);
    expect(middle.mag).toBeCloseTo(2 * single.mag, 6);
    expect(middle.fx).toBeGreaterThan(0);       // + towards −
  });

  it("points every gravitational arrow back at the mass", () => {
    const one: Source[] = [{ x: 200, y: 200, sign: 1 }];
    for (const [x, y] of [[400, 200], [0, 200], [200, 0], [340, 340]] as const) {
      const v = fieldAt(one, "mass", 10, x, y);
      // The arrow at a point must lean back toward the source, never away.
      const towardX = 200 - x, towardY = 200 - y;
      expect(v.fx * towardX + v.fy * towardY, `${x},${y}`).toBeGreaterThan(0);
    }
  });

  it("has a value at points with nothing in them", () => {
    const f = factsOf(fieldsSim, { fieldKind: "charge", arrangement: "single" }, 1);
    expect(f.fieldInEmptySpace).toBe(true);
    expect(f.fieldStrength as number).toBeGreaterThan(0);
  });

  it("stamps a reading onto the map when the probe is let go", () => {
    const runner = run(fieldsSim, { fieldKind: "charge", arrangement: "single", mode: "probe" }, 0.2);
    expect(runner.facts().mapped).toBe(0);
    dragTo(runner, 300, 120);
    dragTo(runner, 240, 200);
    expect(runner.facts().mapped).toBe(2);
  });

  it("adds a source where the student taps in place mode", () => {
    const runner = run(fieldsSim, { arrangement: "single", mode: "place", polarity: "negative" }, 0.2);
    expect(runner.facts().sources).toBe(1);
    dragTo(runner, 260, 210);
    expect(runner.facts().sources).toBe(2);
  });

  it("takes time for a shake to cross the space, and no time at all when still", () => {
    const still = factsOf(fieldsSim, { arrangement: "single", shake: false }, 3);
    expect(still.disturbanceArrived).toBe(false);
    expect(still.probeShake).toBe(0);

    const travel = factsOf(fieldsSim, { arrangement: "single", shake: true }, 0.2)
      .travelTime as number;
    // Default probe sits about 1.5 m from the source, and the ripple crosses
    // the stage at 250 px/s, so the delay is real and measurable.
    expect(travel).toBeGreaterThan(0.1);
    expect(factsOf(fieldsSim, { arrangement: "single", shake: true }, travel * 0.5).disturbanceArrived)
      .toBe(false);
    expect(factsOf(fieldsSim, { arrangement: "single", shake: true }, travel * 3).disturbanceArrived)
      .toBe(true);
    expect(RIPPLE_SPEED).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Sound
 * ================================================================== */

describe("sound: real speeds in real media", () => {
  it("puts sound in air at 343 m/s at room temperature", () => {
    // v = 331.3 + 0.606 T, so 20 °C gives 343.4 m/s and 0 °C gives 331.3 m/s.
    expect(airSpeed(293.15)).toBeCloseTo(343.4, 1);
    expect(airSpeed(273.15)).toBeCloseTo(331.3, 6);
    expect(soundSpeed("air", 293.15)).toBeCloseTo(343.4, 1);
  });

  it("uses textbook speeds for water and steel, and none for vacuum", () => {
    expect(soundSpeed("water", 293.15)).toBe(1481);
    expect(soundSpeed("steel", 293.15)).toBe(5000);
    expect(soundSpeed("vacuum", 293.15)).toBe(0);
    // Gas slower than liquid slower than solid — the order is the lesson.
    expect(soundSpeed("air", 293.15)).toBeLessThan(soundSpeed("water", 293.15));
    expect(soundSpeed("water", 293.15)).toBeLessThan(soundSpeed("steel", 293.15));
    expect(mediumOf("water").semantic).toBe("liquid");
    expect(MEDIA).toHaveLength(4);
  });

  it("keeps speed = frequency × wavelength in every medium", () => {
    for (const medium of ["air", "water", "steel"]) {
      for (const frequency of [20, 440, 4000, 20000]) {
        const f = factsOf(soundSim, { medium, frequency }, 1);
        expect((f.frequency as number) * (f.wavelength as number), `${medium} ${frequency}`)
          .toBeCloseTo(f.speed as number, 9);
      }
    }
  });

  it("gives concert A a 78 cm wavelength in air", () => {
    const f = factsOf(soundSim, { medium: "air", frequency: 440, temperature: 293.15 }, 1);
    expect(f.wavelength as number).toBeCloseTo(0.7805, 3);
    // Double the pitch, half the wavelength — the speed does not move.
    const octave = factsOf(soundSim, { medium: "air", frequency: 880, temperature: 293.15 }, 1);
    expect(octave.wavelength as number).toBeCloseTo((f.wavelength as number) / 2, 6);
    expect(octave.speed as number).toBeCloseTo(f.speed as number, 9);
  });

  it("leaves the speed alone when the sound gets louder", () => {
    const quiet = factsOf(soundSim, { loudness: 20 }, 1);
    const loud = factsOf(soundSim, { loudness: 110 }, 1);
    expect(loud.speed as number).toBeCloseTo(quiet.speed as number, 12);
    expect(loud.wavelength as number).toBeCloseTo(quiet.wavelength as number, 12);
    expect(loud.pressure as number).toBeGreaterThan((quiet.pressure as number) * 100);
  });

  it("anchors the decibel scale on the threshold of hearing", () => {
    expect(P_REF).toBe(20e-6);
    expect(decibels(P_REF)).toBeCloseTo(0, 12);
    // The standard calibration point: 1 pascal is 94 dB.
    expect(decibels(1)).toBeCloseTo(93.98, 2);
    expect(pressureAt(94)).toBeCloseTo(1.0024, 3);
    expect(decibels(pressureAt(60))).toBeCloseTo(60, 9);
  });

  it("hears between 20 Hz and 20 kHz, and nothing in a vacuum", () => {
    expect(HEARING_MIN).toBe(20);
    expect(HEARING_MAX).toBe(20000);
    expect(audible(440, "air", 60)).toBe(true);
    expect(audible(19, "air", 60)).toBe(false);
    expect(audible(21000, "air", 60)).toBe(false);
    expect(audible(440, "vacuum", 60)).toBe(false);
    const edge = factsOf(soundSim, { frequency: 20000 }, 1);
    expect(edge.audible).toBe(true);
    expect(edge.ultrasound).toBe(false);
    const bat = factsOf(soundSim, { frequency: 45000 }, 1);
    expect(bat.ultrasound).toBe(true);
    expect(bat.audible).toBe(false);
    // A bat's 45 kHz call has an 8 mm wavelength: small enough to find a moth.
    expect(bat.wavelength as number).toBeCloseTo(0.00763, 4);
    expect(factsOf(soundSim, { frequency: 20 }, 1).infrasound).toBe(false);
  });

  it("carries nothing at all through a vacuum", () => {
    const f = factsOf(soundSim, { medium: "vacuum" }, 2);
    expect(f.hasMedium).toBe(false);
    expect(f.speed).toBe(0);
    expect(f.wavelength).toBe(0);
    expect(f.audible).toBe(false);
    expect(f.echoTime).toBe(0);
  });

  it("times an echo at 2d/v, and never lets the click leave in a vacuum", () => {
    expect(echoTime(100, 343.4)).toBeCloseTo(0.5824, 4);
    expect(echoTime(171.7, 343.4)).toBeCloseTo(1, 6);

    const runner = run(soundSim, { medium: "air", target: 100, temperature: 293.15 }, 0.1);
    runner.push({ type: "action", action: "launch" });
    // timeScale slows the stage; 6 real seconds is well over one round trip.
    for (let i = 0; i < 600; i++) runner.advance(1 / 60);
    const f = runner.facts();
    expect(f.echoes as number).toBeGreaterThanOrEqual(1);
    expect(f.measuredEcho as number).toBeCloseTo(f.echoTime as number, 4);
    expect(f.measuredEcho as number).toBeCloseTo(0.5824, 3);

    const dead = run(soundSim, { medium: "vacuum", target: 100 }, 0.1);
    dead.push({ type: "action", action: "launch" });
    for (let i = 0; i < 600; i++) dead.advance(1 / 60);
    expect(dead.facts().echoes).toBe(0);
    expect(dead.facts().pulseFlying).toBe(true);
  });

  it("comes back sooner through steel than through air", () => {
    const timings = ["air", "water", "steel"].map(
      (medium) => factsOf(soundSim, { medium, target: 100 }, 1).echoTime as number,
    );
    expect(timings[0]).toBeGreaterThan(timings[1]);
    expect(timings[1]).toBeGreaterThan(timings[2]);
    // Steel is roughly fifteen times faster than air.
    expect(timings[0] / timings[2]).toBeCloseTo(14.6, 0);
  });

  it("speeds sound up as the air warms", () => {
    const cold = factsOf(soundSim, { medium: "air", temperature: 253.15 }, 1).speed as number;
    const warm = factsOf(soundSim, { medium: "air", temperature: 313.15 }, 1).speed as number;
    expect(warm - cold).toBeCloseTo(0.606 * 60, 6);
    expect(cold).toBeCloseTo(319.2, 1);
  });
});

/* ================================================================== *
 * The electromagnetic spectrum
 * ================================================================== */

describe("em spectrum: one speed, and energy that climbs with frequency", () => {
  it("uses the defined speed of light and the defined Planck constant", () => {
    expect(CONSTANTS.c).toBe(299792458);
    expect(CONSTANTS.h).toBe(6.62607015e-34);
  });

  it("keeps f × λ at exactly c, in every band", () => {
    for (const lambda of [1e3, 1, 0.12, 1e-5, 5.5e-7, 1e-7, 1e-10, 1e-12]) {
      expect(frequencyOf(lambda) * lambda, `${lambda} m`).toBeCloseTo(CONSTANTS.c, 0);
    }
    // Twelve orders of magnitude apart, still identical to the last digit.
    const radio = factsOf(emSpectrumSim, { logWavelength: 2 }, 1);
    const gamma = factsOf(emSpectrumSim, { logWavelength: -12 }, 1);
    expect(radio.speed).toBe(CONSTANTS.c);
    expect(gamma.speed).toBe(CONSTANTS.c);
    expect(radio.fLambda as number).toBeCloseTo(gamma.fLambda as number, 0);
  });

  it("puts green light at 545 THz and 2.25 eV", () => {
    // 550 nm: f = c/λ = 5.451e14 Hz, E = hf = 3.612e-19 J = 2.254 eV
    expect(frequencyOf(5.5e-7)).toBeCloseTo(5.4508e14, -10);
    expect(photonEnergy(5.5e-7)).toBeCloseTo(3.6122e-19, 22);
    expect(photonEnergyEV(5.5e-7)).toBeCloseTo(2.2544, 3);
  });

  it("reproduces the E(eV) = 1240 / λ(nm) shortcut a student is given", () => {
    for (const nm of [100, 400, 550, 700, 1000]) {
      expect(photonEnergyEV(nm * 1e-9) * nm, `${nm} nm`).toBeCloseTo(1239.84, 1);
    }
  });

  it("raises photon energy with frequency, without ever raising the speed", () => {
    const energies = [1e2, 1e-2, 1e-5, 5.5e-7, 1e-7, 1e-9, 1e-12].map(photonEnergyEV);
    for (let i = 1; i < energies.length; i++) {
      expect(energies[i]).toBeGreaterThan(energies[i - 1]);
    }
    // A gamma photon carries some fourteen orders of magnitude more than radio.
    expect(energies[energies.length - 1] / energies[0]).toBeGreaterThan(1e13);
  });

  it("sorts real wavelengths into the right bands", () => {
    expect(bandOf(3).key).toBe("radio");            // an FM broadcast
    expect(bandOf(0.122).key).toBe("microwave");    // a microwave oven at 2.45 GHz
    expect(bandOf(9.4e-7).key).toBe("infrared");    // a TV remote
    expect(bandOf(5.5e-7).key).toBe("visible");
    expect(bandOf(1e-7).key).toBe("ultraviolet");
    expect(bandOf(1e-10).key).toBe("xray");
    expect(bandOf(1e-12).key).toBe("gamma");
    expect(BANDS.every((b) => b.use.length > 0)).toBe(true);
  });

  it("leaves visible light a sliver of the whole spectrum", () => {
    const visible = BANDS.find((b) => b.key === "visible")!;
    expect(visible.min).toBeCloseTo(3.8e-7, 9);
    expect(visible.max).toBeCloseTo(7e-7, 9);
    const decades = Math.log10(visible.max / visible.min);
    expect(decades).toBeLessThan(0.3);
    // Against the seventeen powers of ten the ruler covers.
    expect(decades / 17).toBeLessThan(0.02);
  });

  it("puts the ionizing edge at about 124 nm, in the ultraviolet", () => {
    // 1240/124 is 10.0 eV: the boundary itself, so a hair either side of it
    // decides whether a photon can knock an electron loose.
    expect(photonEnergyEV(124e-9)).toBeCloseTo(IONIZING_EV, 1);
    expect(factsOf(emSpectrumSim, { logWavelength: Math.log10(120e-9) }, 1).ionizing).toBe(true);
    expect(factsOf(emSpectrumSim, { logWavelength: Math.log10(130e-9) }, 1).ionizing).toBe(false);
    expect(factsOf(emSpectrumSim, { logWavelength: Math.log10(5.5e-7) }, 1).ionizing).toBe(false);
    expect(bandOf(124e-9).key).toBe("ultraviolet");
  });

  it("gives visible wavelengths the colour they actually look", () => {
    expect(visibleColor(660)).toMatch(/^rgb\(2[0-9][0-9], 0, 0\)$/);   // deep red
    const blue = visibleColor(450);
    expect(blue).toMatch(/^rgb\(0, /);
    expect(blue.endsWith("255)")).toBe(true);
    // Nothing to see outside the band: the eye simply does not respond.
    expect(visibleColor(300)).toBe("rgb(0, 0, 0)");
    expect(visibleColor(900)).toBe("rgb(0, 0, 0)");
  });

  it("names the band and a real use for wherever the slider is", () => {
    const f = factsOf(emSpectrumSim, { logWavelength: Math.log10(0.122) }, 1);
    expect(f.bandLabel).toBe("Microwave");
    expect(String(f.use).length).toBeGreaterThan(8);
    expect(f.frequency as number).toBeCloseTo(2.457e9, -7);
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
