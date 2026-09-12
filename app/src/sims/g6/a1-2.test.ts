import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { bikeInsideBikeSim } from "./a1-2-the-bike-inside-the-bike";

/**
 * Science gate for G6-A1.2 "The Bike Inside the Bike".
 *
 * Tests the spec's actual claims: the power balance really moves watts
 * through a real loss ladder to a real speed; a function-critical failure
 * (brake cable, chain, rear hub bearing) really climbs all four tree levels
 * to Bicycle-failed; a non-critical failure (shift cable, three spokes) really
 * stops at "worn" and leaves Bicycle rideable; and failure never touches a
 * branch of the tree it has no coupling to. Plus the platform invariants:
 * determinism and a clean reset. Not registered yet (the orchestrator wires
 * the registry centrally), so this file drives the manifest directly.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(bikeInsideBikeSim.params), ...overrides };
}

/** tickRate is 60 Hz and timeScale is 1, so engine seconds are sim seconds. */
function runFor(params: ParamValues, seconds: number, seed = "g6a1-2"): SimRunner {
  const runner = new SimRunner({ manifest: bikeInsideBikeSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 60;
  const ticks = Math.round(seconds * 60);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "g6a1-2") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * The power balance is real
 * ================================================================== */

describe("the power balance actually moves the bike", () => {
  it("speed settles above zero on a moderate climb and stays finite", () => {
    const f = factsAfter({}, 20);
    expect(f.speedKmh as number).toBeGreaterThan(1);
    expect(Number.isFinite(f.speedKmh as number)).toBe(true);
  });

  it("more rider power gives more speed, all else equal", () => {
    const low = factsAfter({ riderPower: 80 }, 20);
    const high = factsAfter({ riderPower: 300 }, 20);
    expect(high.speedKmh as number).toBeGreaterThan(low.speedKmh as number);
  });

  it("a steeper grade slows the same rider down", () => {
    const flat = factsAfter({ gradient: 0 }, 20);
    const steep = factsAfter({ gradient: 12 }, 20);
    expect(flat.speedKmh as number).toBeGreaterThan(steep.speedKmh as number);
  });

  it("lower tyre pressure adds rolling loss and costs speed", () => {
    const firm = factsAfter({ tyrePressure: 6.5 }, 20);
    const soft = factsAfter({ tyrePressure: 1.5 }, 20);
    expect(soft.powerTyreLossW as number).toBeGreaterThan(firm.powerTyreLossW as number);
    expect(soft.speedKmh as number).toBeLessThan(firm.speedKmh as number);
  });

  it("a poorly lubricated chain loses more power than a fresh one", () => {
    const clean = factsAfter({ lubrication: 100 }, 15);
    const dry = factsAfter({ lubrication: 0 }, 15);
    expect(dry.powerChainLossW as number).toBeGreaterThan(clean.powerChainLossW as number);
  });

  it("the loss ladder is honest bookkeeping: road power never exceeds the input", () => {
    const f = factsAfter({ riderPower: 250 }, 20);
    expect(f.powerRoadW as number).toBeLessThanOrEqual(f.powerInW as number + 1e-6);
    expect(f.powerChainLossW as number).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Function-critical failures climb all four levels
 * ================================================================== */

describe("a cut brake cable fails Braking, then Bicycle, and nothing else", () => {
  const cut: ParamValues = { severBrakeCable: true };

  it("Braking and the system fail; Drivetrain and Wheels do not", () => {
    const f = factsAfter(cut, 10);
    expect(f.brakingFailed).toBe(true);
    expect(f.systemFailed).toBe(true);
    expect(f.drivetrainFailed).toBe(false);
    expect(f.wheelsFailed).toBe(false);
    expect(f.levelsAffected as number).toBe(4);
  });

  it("stopping distance reads 'cannot stop', honestly capped, never infinite", () => {
    const f = factsAfter(cut, 5);
    expect(f.canStop).toBe(false);
    expect(Number.isFinite(f.stoppingDistanceM as number)).toBe(true);
  });

  it("a timed descent runs away instead of being secretly capped", () => {
    const f = factsAfter({ ...cut, timedDescent: true, gradient: -8 }, 60);
    expect(f.descentUncontrolled).toBe(true);
    expect((f.speedKmh as number)).toBeGreaterThan(45);
  });

  it("a healthy bike on the same descent stays controlled", () => {
    const f = factsAfter({ timedDescent: true, gradient: -8 }, 60);
    expect(f.descentUncontrolled).toBe(false);
    expect(f.speedKmh as number).toBeLessThan(50);
  });
});

describe("a severed chain fails Drivetrain, then Bicycle", () => {
  it("no power enters the drivetrain at all", () => {
    const f = factsAfter({ severChain: true, riderPower: 300 }, 10);
    expect(f.powerInW as number).toBe(0);
    expect(f.drivetrainFailed).toBe(true);
    expect(f.systemFailed).toBe(true);
    expect(f.brakingFailed).toBe(false);
    expect(f.wheelsFailed).toBe(false);
  });

  it("the bike can still coast downhill with no chain at all", () => {
    const f = factsAfter({ severChain: true, gradient: -6 }, 15);
    expect(f.speedKmh as number).toBeGreaterThan(5);
  });
});

describe("a seized rear hub bearing fails Wheels, then Bicycle, four levels down", () => {
  const seized: ParamValues = { severRearHubBearing: true, riderPower: 250, gradient: 6 };

  it("the tree fails at Wheels and System but not Drivetrain or Braking", () => {
    const f = factsAfter(seized, 20);
    expect(f.wheelsFailed).toBe(true);
    expect(f.systemFailed).toBe(true);
    expect(f.drivetrainFailed).toBe(false);
    expect(f.brakingFailed).toBe(false);
    expect(f.levelsAffected as number).toBe(4);
  });

  it("almost all the rider's power is consumed at the bearing, not the road", () => {
    const f = factsAfter(seized, 25);
    expect(f.powerBearingLossW as number).toBeGreaterThan(f.powerRoadW as number);
  });

  it("speed collapses to a crawl compared with the healthy bike", () => {
    const healthy = factsAfter({ riderPower: 250, gradient: 6 }, 25);
    const broken = factsAfter(seized, 25);
    expect(broken.speedKmh as number).toBeLessThan((healthy.speedKmh as number) * 0.3);
  });
});

/* ================================================================== *
 * Non-critical failures degrade without failing the whole bicycle
 * ================================================================== */

describe("a cut shift cable degrades Drivetrain to worn, never fails Bicycle", () => {
  it("Drivetrain is worn, not failed, and Bicycle stays rideable", () => {
    const f = factsAfter({ severShiftCable: true, gear: 6 }, 10);
    expect(f.drivetrainWorn).toBe(true);
    expect(f.drivetrainFailed).toBe(false);
    expect(f.systemFailed).toBe(false);
  });

  it("the gear used by the physics freezes at the value it held when cut", () => {
    const runner = runFor({ ...base({ gear: 6 }), severShiftCable: true }, 5);
    expect(runner.facts().gearEffective).toBe(6);
    expect(runner.facts().frozenGearActive).toBe(true);
    runner.setParams({ ...runner.params, gear: 11 });
    runner.advance(2);
    expect(runner.facts().gearEffective).toBe(6); // the shifter cannot move the cut cable
  });

  it("an intact shifter does track the live gear control", () => {
    const runner = runFor(base({ gear: 3 }), 2);
    expect(runner.facts().gearEffective).toBe(3);
    runner.setParams({ ...runner.params, gear: 9 });
    runner.advance(2);
    expect(runner.facts().gearEffective).toBe(9);
  });
});

describe("three severed spokes degrade Wheels to worn, never fail Bicycle", () => {
  it("Wheels is worn, not failed, and the system stays rideable", () => {
    const f = factsAfter({ severSpokes: true }, 10);
    expect(f.wheelsWorn).toBe(true);
    expect(f.wheelsFailed).toBe(false);
    expect(f.systemFailed).toBe(false);
  });

  it("the wobble still costs real rolling-loss watts", () => {
    const clean = factsAfter({}, 15);
    const wobbly = factsAfter({ severSpokes: true }, 15);
    expect(wobbly.powerTyreLossW as number).toBeGreaterThan(clean.powerTyreLossW as number);
  });
});

describe("a fully healthy bike reports zero levels affected", () => {
  it("no severed part, no failure anywhere", () => {
    const f = factsAfter({}, 10);
    expect(f.levelsAffected as number).toBe(0);
    expect(f.systemOk).toBe(true);
  });
});

/* ================================================================== *
 * Braking hardware is a real, graded coupling
 * ================================================================== */

describe("brake pad condition sets a real, ordered stopping distance", () => {
  it("new stops shorter than worn, worn shorter than glazed, missing cannot stop", () => {
    const goodDist = factsAfter({ brakePad: "new" }, 1).stoppingDistanceM as number;
    const wornDist = factsAfter({ brakePad: "worn" }, 1).stoppingDistanceM as number;
    const glazedDist = factsAfter({ brakePad: "glazed" }, 1).stoppingDistanceM as number;
    expect(wornDist).toBeGreaterThan(goodDist);
    expect(glazedDist).toBeGreaterThan(wornDist);
    expect(factsAfter({ brakePad: "missing" }, 1).canStop).toBe(false);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base({ severRearHubBearing: true }), 8, "twin");
    const b = runFor(base({ severRearHubBearing: true }), 8, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock actually advances", () => {
    const r = runFor(base(), 3);
    expect(r.time).toBeGreaterThan(0);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base({ gradient: -4 }), 12, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: bikeInsideBikeSim, params: base({ gradient: -4 }), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout is finite from tick zero through a long run", () => {
    const r = runFor(base({ severRearHubBearing: true, severSpokes: true }), 30);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const v of Object.values(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });
});
