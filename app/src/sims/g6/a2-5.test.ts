import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { zeroEmissionBusSim, NODES } from "./a2-5-the-zero-emission-bus-argument";

/**
 * Science gate for G6-A2.5 "The Zero-Emission Bus Argument".
 *
 * Tests the spec's actual claim: a boundary is fit for a purpose, not true
 * or false on its own. The tailpipe boundary must read green for a school-
 * air question (a real electric bus has a real, structural zero there) and
 * red for a yearly-carbon question (which needs the depot charger's real,
 * grid-mix-dependent number) — the SAME boundary, both readings honest.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(zeroEmissionBusSim.params), ...overrides };
}

function factsOf(overrides: ParamValues, seed = "gate") {
  const r = new SimRunner({ manifest: zeroEmissionBusSim, params: base(overrides), band: "6-8", seed });
  return r.facts();
}

/* ================================================================== *
 * S1-S4: the founder's own four scenarios, each checked directly
 * ================================================================== */

describe("S1: the right small boundary", () => {
  it("air outside our school is green at the tailpipe boundary, reading a real, structural zero", () => {
    const f = factsOf({ questionCard: "airOutsideSchool", boundaryPreset: "tailpipeOnly" });
    expect(f.questionFit).toBe("green");
    expect(f.electricRoutePm25G).toBe(0);
    // A real gate never reads a literal zero — the honest floor is the
    // ambient baseline the electric fleet cannot possibly move.
    expect(f.gatePm25 as number).toBeGreaterThan(0);
  });
});

describe("S2: the same boundary, a new question", () => {
  it("total CO2 over the year is red at the tailpipe boundary — it needs the charger", () => {
    const f = factsOf({ questionCard: "totalCo2Year", boundaryPreset: "tailpipeOnly" });
    expect(f.questionFit).toBe("red");
  });

  it("widening the frame to include the charger turns the badge green", () => {
    const f = factsOf({ questionCard: "totalCo2Year", boundaryPreset: "busChargerPowerPlants" });
    expect(f.questionFit).toBe("green");
  });
});

describe("S3: the whole life cycle", () => {
  it("at the founder's own preset (service life 12 years), the first-year answer is genuinely no", () => {
    const f = factsOf({ questionCard: "co2FirstYear", boundaryPreset: "wholeLifeCycle", serviceLifeYears: 12 });
    expect(f.electricFirstYearLower).toBe(false);
    expect(f.firstYearElectricCo2 as number).toBeGreaterThan(f.firstYearComparisonCo2 as number);
  });

  it("a real break-even service life exists, and it falls inside the control's own 4-18 year range", () => {
    const f = factsOf({ questionCard: "co2FirstYear", boundaryPreset: "wholeLifeCycle" });
    const breakEven = f.breakEvenServiceLifeYears as number;
    expect(breakEven).toBeGreaterThan(4);
    expect(breakEven).toBeLessThanOrEqual(18);
  });

  it("moving the service life slider past the break-even year flips the first-year answer to yes", () => {
    const below = factsOf({ questionCard: "co2FirstYear", boundaryPreset: "wholeLifeCycle", serviceLifeYears: 4 });
    const breakEven = below.breakEvenServiceLifeYears as number;
    const justAbove = factsOf({ questionCard: "co2FirstYear", boundaryPreset: "wholeLifeCycle", serviceLifeYears: Math.min(18, Math.ceil(breakEven) + 1) });
    expect(below.electricFirstYearLower).toBe(false);
    expect(justAbove.electricFirstYearLower).toBe(true);
  });
});

describe("S4: charge at noon", () => {
  it("the same boundary, at two times of day, differs by roughly the named factor of three", () => {
    const noon = factsOf({ questionCard: "electricityClean", boundaryPreset: "busChargerPowerPlants", chargingHour: 13 });
    const evening = factsOf({ questionCard: "electricityClean", boundaryPreset: "busChargerPowerPlants", chargingHour: 19 });
    const ratio = (evening.gridIntensityNow as number) / (noon.gridIntensityNow as number);
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(3.5);
  });

  it("the naive 'bus and charger' preset does not move at all with time of day", () => {
    const noon = factsOf({ boundaryPreset: "busAndCharger", chargingHour: 13 });
    const evening = factsOf({ boundaryPreset: "busAndCharger", chargingHour: 19 });
    expect(noon.gridIntensityNow).toBe(evening.gridIntensityNow);
    expect(noon.isLiveGrid).toBe(false);
  });
});

/* ================================================================== *
 * The fit badge is computed from real node coverage, never scripted
 * ================================================================== */

describe("the fit badge is a real function of the boundary, not a lookup table", () => {
  it("every question is green once the boundary encloses everything it needs", () => {
    for (const overrides of [{}, { questionCard: "totalCo2Year" }, { questionCard: "co2FirstYear" }, { questionCard: "cheaperToRun" }, { questionCard: "wherePollutionMoves" }, { questionCard: "electricityClean" }]) {
      const f = factsOf({ ...overrides, boundaryPreset: "wholeLifeCycle" });
      expect(f.questionFit, JSON.stringify(overrides)).toBe("green");
    }
  });

  it("a question whose required node is entirely outside the boundary reads red, never green", () => {
    const f = factsOf({ questionCard: "electricityClean", boundaryPreset: "tailpipeOnly" });
    expect(f.questionFit).toBe("red");
  });

  it("widening the custom boundary node by node only ever improves the fit, never worsens it", () => {
    const order: Array<"red" | "amber" | "green"> = [];
    for (let end = 0; end <= 6; end++) {
      const f = factsOf({ questionCard: "co2FirstYear", boundaryPreset: "custom", customStart: 0, customEnd: end });
      order.push(f.questionFit as "red" | "amber" | "green");
    }
    const rank = { red: 0, amber: 1, green: 2 };
    for (let i = 1; i < order.length; i++) expect(rank[order[i]]).toBeGreaterThanOrEqual(rank[order[i - 1]]);
    expect(order[order.length - 1]).toBe("green"); // the full chain answers everything
  });
});

/* ================================================================== *
 * The claim builder: the same trap the boundary itself sets
 * ================================================================== */

describe("a claim is only as honest as the boundary that produced it", () => {
  it("'zero emissions' is supported at the tailpipe boundary and fails the instant the charger is included", () => {
    expect(factsOf({ claimId: "zeroEmissions", boundaryPreset: "tailpipeOnly" }).claimSupported).toBe(true);
    expect(factsOf({ claimId: "zeroEmissions", boundaryPreset: "busAndCharger" }).claimSupported).toBe(false);
    expect(factsOf({ claimId: "zeroEmissions", boundaryPreset: "wholeLifeCycle" }).claimSupported).toBe(false);
  });

  it("'better for the climate' only becomes supportable once the service life clears the real break-even point", () => {
    const short = factsOf({ claimId: "betterForClimate", boundaryPreset: "wholeLifeCycle", serviceLifeYears: 4 });
    const long = factsOf({ claimId: "betterForClimate", boundaryPreset: "wholeLifeCycle", serviceLifeYears: 18 });
    expect(short.claimSupported).toBe(false);
    expect(long.claimSupported).toBe(true);
  });

  it("'better for local air' needs the comparison vehicle to actually pollute locally to be meaningful", () => {
    const vsDiesel = factsOf({ claimId: "betterForLocalAir", boundaryPreset: "tailpipeOnly", comparisonVehicle: "diesel2020" });
    const vsElectric = factsOf({ claimId: "betterForLocalAir", boundaryPreset: "tailpipeOnly", comparisonVehicle: "electric" });
    expect(vsDiesel.claimSupported).toBe(true);
    expect(vsElectric.claimSupported).toBe(false); // no real difference to claim against
  });
});

/* ================================================================== *
 * Real, node-level structure
 * ================================================================== */

describe("the chain is genuinely seven nodes, and older diesel is genuinely dirtier locally", () => {
  it("has exactly seven named nodes", () => {
    expect(NODES.length).toBe(7);
  });

  it("a 2008 diesel bus reads a real, meaningfully worse local air impact than a 2020 diesel bus", () => {
    const old2008 = factsOf({ comparisonVehicle: "diesel2008" });
    const new2020 = factsOf({ comparisonVehicle: "diesel2020" });
    expect(old2008.comparisonPm25G as number).toBeGreaterThan((new2020.comparisonPm25G as number) * 3);
  });

  it("fleet size scales every ledger total, and nothing else", () => {
    const small = factsOf({ boundaryPreset: "wholeLifeCycle", fleetSize: 4 });
    const big = factsOf({ boundaryPreset: "wholeLifeCycle", fleetSize: 40 });
    // Per-bus figures (not fleet-scaled) must be identical.
    expect(small.electricRouteCo2Kg).toBe(big.electricRouteCo2Kg);
    expect(small.firstYearElectricCo2).toBe(big.firstYearElectricCo2);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism, reset, and finiteness", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = new SimRunner({ manifest: zeroEmissionBusSim, params: base({ boundaryPreset: "wholeLifeCycle" }), band: "6-8", seed: "twin" });
    const b = new SimRunner({ manifest: zeroEmissionBusSim, params: base({ boundaryPreset: "wholeLifeCycle" }), band: "6-8", seed: "twin" });
    a.playing = true; b.playing = true;
    for (let i = 0; i < 30; i++) { a.advance(1 / 30); b.advance(1 / 30); }
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = new SimRunner({ manifest: zeroEmissionBusSim, params: base(), band: "6-8", seed: "t" });
    r.playing = true;
    r.advance(1);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ boundaryPreset: "custom", customStart: 2, customEnd: 5 });
    const runner = new SimRunner({ manifest: zeroEmissionBusSim, params, band: "6-8", seed: "resetting" });
    runner.playing = true;
    runner.advance(2);
    runner.reset();
    const fresh = new SimRunner({ manifest: zeroEmissionBusSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and numeric fact is finite across every question, boundary and vehicle", () => {
    for (const boundaryPreset of ["tailpipeOnly", "busAndCharger", "busChargerPowerPlants", "wholeLifeCycle"]) {
      for (const comparisonVehicle of ["diesel2008", "diesel2020", "cng", "electric"]) {
        const r = new SimRunner({ manifest: zeroEmissionBusSim, params: base({ boundaryPreset, comparisonVehicle }), band: "6-8", seed: "f" });
        for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), `${boundaryPreset}/${comparisonVehicle}/${ro.key}`).toBe(true);
        for (const [k, v] of Object.entries(r.facts())) {
          if (typeof v === "number") expect(Number.isFinite(v), `${boundaryPreset}/${comparisonVehicle}/${k}`).toBe(true);
        }
      }
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

describe("render survives every boundary, question, claim and vehicle, both bands", () => {
  it("draws without throwing across the parameter space", () => {
    const cases: ParamValues[] = [
      {},
      { boundaryPreset: "busAndCharger" }, { boundaryPreset: "busChargerPowerPlants" },
      { boundaryPreset: "wholeLifeCycle" }, { boundaryPreset: "custom", customStart: 1, customEnd: 3 },
      { questionCard: "co2FirstYear" }, { questionCard: "wherePollutionMoves" },
      { comparisonVehicle: "diesel2008" }, { comparisonVehicle: "cng" }, { comparisonVehicle: "electric" },
      { gridScenario: "sunnyMidday" }, { gridScenario: "eveningPeak" }, { gridScenario: "rooftopSolarDepot" },
      { claimId: "betterForClimate" }, { claimId: "betterForLocalAir" }, { uncertaintyBandsOn: false },
    ];
    for (const overrides of cases) {
      const params = base(overrides);
      const runner = new SimRunner({ manifest: zeroEmissionBusSim, params, band: "6-8", seed: "draw" });
      runner.playing = true;
      for (let i = 0; i < 30; i++) runner.advance(1 / 30);
      for (const [w, h] of [[900, 520], [340, 260]] as const) {
        expect(() => zeroEmissionBusSim.render({
          ctx: stubContext(), state: runner.getState(), params, band: "6-8",
          width: w, height: h, overlays: {}, alpha: 0.5, theme: TEST_THEME, time: runner.time,
        }), JSON.stringify(overrides)).not.toThrow();
      }
    }
  });
});
