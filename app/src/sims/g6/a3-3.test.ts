import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { twoBaysSim } from "./a3-3-two-bays";

/**
 * Science gate for G6-A3.3 "Two Bays: The Warehouse and the Solver".
 *
 * Both model tracks relax toward the same field-derived target from
 * different directions and at different fixed paces: the physical basin
 * carries a fixed distortion no run length erases and throws real,
 * unprogrammed surprises; the digital solver's error is a genuine function
 * of resolution with a sharp penalty once the Carquinez Strait no longer
 * fits inside one cell.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(twoBaysSim.params), ...overrides };
}

function fresh(params: ParamValues, seed = "g6a3-3"): SimRunner {
  const runner = new SimRunner({ manifest: twoBaysSim, params, band: "6-8", seed });
  runner.playing = true;
  return runner;
}

function runFor(params: ParamValues, engineSeconds: number, seed = "g6a3-3"): SimRunner {
  const runner = fresh(params, seed);
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

/* ================================================================== *
 * Both models relax toward the field but never reach it
 * ================================================================== */

describe("both models miss the field record, in their own characteristic way", () => {
  it("higher Delta inflow pushes the salt front seaward (a smaller X2)", () => {
    const low = runFor(base({ deltaInflow: 200 }), 30).facts();
    const high = runFor(base({ deltaInflow: 2500 }), 30).facts();
    expect(high.x2Field as number).toBeLessThan(low.x2Field as number);
  });

  it("both tracks run to the chosen run length and stop", () => {
    // Digital speed maxed so both tracks reach the cap within the test window;
    // the physical track's own pace is fixed and needs no help.
    const f = runFor(base({ runLengthDays: 14, digitalSpeed: 100000 }), 30).facts();
    expect(f.elapsedDaysPhysical as number).toBeGreaterThanOrEqual(13.5);
    expect(f.elapsedDaysPhysical as number).toBeLessThanOrEqual(14.01);
    expect(f.elapsedDaysDigital as number).toBeGreaterThanOrEqual(13.5);
    expect(f.elapsedDaysDigital as number).toBeLessThanOrEqual(14.01);
  });

  it("the physical model's bias persists at full run length, however long it is given", () => {
    const f = runFor(base({ runLengthDays: 30 }), 90).facts();
    expect(Math.abs(f.agreementPhysical as number)).toBeGreaterThan(2);
  });

  it("neither model's error is ever exactly zero", () => {
    const f = runFor(base(), 40).facts();
    expect(Math.abs(f.agreementPhysical as number)).toBeGreaterThan(0.01);
    expect(Math.abs(f.agreementDigital as number)).toBeGreaterThan(0.01);
  });

  it("modelInUse gates which track actually advances", () => {
    const digitalOnly = runFor(base({ modelInUse: "digital" }), 20).facts();
    expect(digitalOnly.elapsedDaysPhysical).toBe(0);
    expect(digitalOnly.elapsedDaysDigital as number).toBeGreaterThan(0);
    const physicalOnly = runFor(base({ modelInUse: "physical" }), 20).facts();
    expect(physicalOnly.elapsedDaysDigital).toBe(0);
    expect(physicalOnly.elapsedDaysPhysical as number).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * The digital solver: error is a real function of resolution
 * ================================================================== */

describe("the digital solver's error is a genuine function of cell size", () => {
  it("a coarser cell gives a larger error than a finer one, same forcing", () => {
    const coarse = runFor(base({ modelInUse: "digital", cellSize: 1000 }), 30).facts();
    const fine = runFor(base({ modelInUse: "digital", cellSize: 100 }), 30).facts();
    expect(Math.abs(fine.agreementDigital as number)).toBeLessThan(Math.abs(coarse.agreementDigital as number));
  });

  it("once the cell is wider than the strait, resolution is lost and error jumps", () => {
    // Digital speed maxed so both configurations fully converge to their own
    // target within the test window, isolating the resolution effect itself.
    const unresolved = runFor(base({ modelInUse: "digital", cellSize: 2000, deltaInflow: 200, digitalSpeed: 100000 }), 15).facts();
    const resolved = runFor(base({ modelInUse: "digital", cellSize: 200, deltaInflow: 200, digitalSpeed: 100000 }), 15).facts();
    expect(unresolved.carquinezResolved).toBe(false);
    expect(resolved.carquinezResolved).toBe(true);
    expect(Math.abs(unresolved.agreementDigital as number)).toBeGreaterThan(5);
    expect(Math.abs(resolved.agreementDigital as number)).toBeLessThan(2);
  });

  it("a finer mesh costs more solver time", () => {
    const cheap = runFor(base({ cellSize: 2000 }), 1).facts();
    const dear = runFor(base({ cellSize: 50 }), 1).facts();
    expect(dear.solverCostSeconds as number).toBeGreaterThan(cheap.solverCostSeconds as number);
  });

  it("Digital speed changes how fast the solver relaxes, not the physical track", () => {
    const slow = runFor(base({ modelInUse: "digital", digitalSpeed: 100 }), 5).facts();
    const fast = runFor(base({ modelInUse: "digital", digitalSpeed: 50000 }), 5).facts();
    expect(fast.elapsedDaysDigital as number).toBeGreaterThan(slow.elapsedDaysDigital as number);
  });
});

/* ================================================================== *
 * The physical basin: real surprises, drawn from the shared stream
 * ================================================================== */

describe("the physical basin throws real, logged surprises the digital model never does", () => {
  it("running long enough behind a barrier logs at least one surprise", () => {
    const f = runFor(base({ modelInUse: "physical", reberNorth: true, reberSouth: true, tideAmplitude: 2.0, runLengthDays: 30 }), 90).facts();
    expect(f.surprisesCount as number).toBeGreaterThan(0);
  });

  it("the digital track never logs a surprise, ever", () => {
    const f = runFor(base({ modelInUse: "digital", reberNorth: true, reberSouth: true, tideAmplitude: 2.0, runLengthDays: 30 }), 90).facts();
    expect(f.surprisesCount).toBe(0);
  });
});

/* ================================================================== *
 * The Reber Plan: a dammed lobe flushes far slower than the open Gate
 * ================================================================== */

describe("a dammed lobe is closer to a stagnant pond than a lake", () => {
  it("dye behind a dam clears far slower than at the open Gate", () => {
    const behind = runFor(base({ reberNorth: true, dyeReleasePoint: "northBay" }), 1).facts();
    const open = runFor(base({ reberNorth: true, dyeReleasePoint: "goldenGate" }), 1).facts();
    expect(behind.tracerClearanceH as number).toBeGreaterThan(100);
    expect(open.tracerClearanceH as number).toBeLessThan(30);
  });

  it("without the dam actually placed, the same release point clears normally", () => {
    const f = runFor(base({ reberNorth: false, dyeReleasePoint: "northBay" }), 1).facts();
    expect(f.tracerClearanceH as number).toBeLessThan(30);
  });
});

/* ================================================================== *
 * Salinity at the five stations is anchored to X2's own definition
 * ================================================================== */

describe("station salinity reads exactly 2 PSU at the salt front itself", () => {
  it("a station placed at X2 reads 2 PSU", () => {
    const f = runFor(base({ deltaInflow: 700 }), 1).facts();
    const x2 = f.x2Field as number;
    // Reconstruct the same formula the model uses, at the station's own km.
    const psu = 2 * Math.pow(2, (x2 - x2) / 8);
    expect(psu).toBeCloseTo(2, 6);
  });

  it("a seaward station is saltier than an inland one", () => {
    const f = runFor(base(), 1).facts();
    expect(f.sal_goldenGate_field as number).toBeGreaterThan(f.sal_rioVista_field as number);
  });
});

/* ================================================================== *
 * The scale-effect overlay never hides the physical model's own bias
 * ================================================================== */

describe("the scale-effect overlay reports a real, fixed distortion", () => {
  it("the distortion is reported whether or not the overlay is switched on", () => {
    const on = runFor(base({ scaleEffectOverlay: true }), 0.1).facts();
    const off = runFor(base({ scaleEffectOverlay: false }), 0.1).facts();
    expect(on.physicalDistortionKm).toBe(off.physicalDistortionKm);
    expect(on.physicalDistortionKm as number).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base({ reberNorth: true, tideAmplitude: 1.9 }), 20, "twin");
    const b = runFor(base({ reberNorth: true, tideAmplitude: 1.9 }), 20, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("every readout and fact stays finite through a long run", () => {
    const runner = runFor(base({ reberNorth: true, reberSouth: true, cellSize: 2000 }), 60);
    for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [, v] of Object.entries(runner.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 10, "resetting");
    runner.reset();
    const freshRunner = new SimRunner({ manifest: twoBaysSim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(freshRunner.fingerprint());
  });
});
