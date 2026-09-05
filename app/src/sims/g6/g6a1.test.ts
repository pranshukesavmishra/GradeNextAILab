import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { getSim } from "../registry";
import { unplugAquariumSim } from "./a1-1-unplug-the-aquarium";

/**
 * Science gate for G6-A1.1 "Unplug the Aquarium".
 *
 * The spec's honesty rule is testable, so it is tested: nitrification really
 * converts nitrogen down the chain, unplugging the pump really starves the
 * colony and the failure really reaches the fish, and the loose-parts tray
 * really is a heap — driving its controls changes nothing measurable, because
 * every coupling coefficient is genuinely zero. Plus the platform invariants:
 * determinism and a clean reset.
 */

const K = 273.15;      // heater setpoint is stored in kelvin
const HOUR_S = 3600;   // light hours are stored in SI seconds

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(unplugAquariumSim.params), ...overrides };
}

/** Run for a stretch of engine time in exact single ticks (tickRate 30). */
function runFor(params: ParamValues, engineSeconds: number, seed = "g6a1") {
  const runner = new SimRunner({ manifest: unplugAquariumSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.round(engineSeconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

/** Run a number of simulated days under whatever compression is set. */
function runDays(overrides: ParamValues, days: number, seed = "g6a1") {
  const params = base(overrides);
  const comp = params.timeComp as number;
  return runFor(params, (days * 86400) / comp, seed);
}

const factsAfterDays = (overrides: ParamValues, days: number, seed = "g6a1") =>
  runDays(overrides, days, seed).facts();

/* ================================================================== *
 * Wiring
 * ================================================================== */

describe("g6.a1-1 is registered", () => {
  it("is reachable through the registry with the Unit A identity", () => {
    const sim = getSim("g6.a1-1");
    expect(sim).toBeDefined();
    expect(sim?.title).toBe("Unplug the Aquarium");
    expect(sim?.grades).toContain(6);
    expect(sim?.bands).toContain("6-8");
  });
});

/* ================================================================== *
 * The nitrogen chain
 * ================================================================== */

describe("nitrification converts, it does not hide", () => {
  it("a mature colony holds ammonia down while nitrate accumulates", () => {
    // Plants and water changes off, so nothing but bacteria can move nitrogen.
    const f = factsAfterDays({ timeComp: 5000, plants: 0, waterChange: 0 }, 3);
    expect(f.ammoniaPeak as number).toBeLessThan(0.25);
    expect(f.ammonia as number).toBeLessThan(0.25);
    // Fish made about 0.65 mg/L/day of nitrogen; it must come out as nitrate.
    expect(f.nitrate as number).toBeGreaterThan(6);
  });

  it("with no media the same tank cannot convert: ammonia climbs instead", () => {
    const none = factsAfterDays({ timeComp: 5000, plants: 0, waterChange: 0, media: "none" }, 3);
    const mature = factsAfterDays({ timeComp: 5000, plants: 0, waterChange: 0 }, 3);
    expect(none.ammonia as number).toBeGreaterThan(1);
    expect(none.nitrate as number).toBeLessThan(5.6); // stuck near the residual 5
    expect(mature.nitrate as number).toBeGreaterThan(none.nitrate as number);
  });

  it("new tank syndrome: the spike rises, the colony grows, the spike falls", () => {
    const setup: ParamValues = { timeComp: 5000, media: "sterile", fishStocked: 12, feeding: 3.0 };
    const early = factsAfterDays(setup, 2);
    // The filter has been running from minute one, yet ammonia spikes —
    // plumbing without workers.
    expect(early.ammonia as number).toBeGreaterThan(0.5);
    expect(early.colonyA as number).toBeLessThan(0.1);

    const late = factsAfterDays(setup, 14);
    expect(late.ammoniaPeak as number).toBeGreaterThan(0.5);
    expect(late.ammonia as number).toBeLessThan(0.25);       // fallen back under the line
    expect(late.colonyA as number).toBeGreaterThan(0.1);     // 5x the seeded trace
    expect(late.nitrate as number).toBeGreaterThan(8);       // the nitrogen ended up here
    // The classic sequence: the nitrite hump lives between the other two.
    const mid = factsAfterDays(setup, 5);
    expect(mid.nitrite as number).toBeGreaterThan(0.3);
    expect(late.nitrite as number).toBeLessThan(mid.nitrite as number);
  });

  it("plants are the part that removes nitrate", () => {
    const bare = factsAfterDays({ timeComp: 5000, feeding: 4, plants: 0, waterChange: 0 }, 14);
    const planted = factsAfterDays({ timeComp: 5000, feeding: 4, plants: 10, waterChange: 0 }, 14);
    expect(planted.nitrate as number).toBeLessThan((bare.nitrate as number) * 0.7);
  });

  it("the weekly water change dilutes what it should, when it should", () => {
    const setup: ParamValues = { timeComp: 5000, media: "none", feeding: 3, plants: 0 };
    const kept = factsAfterDays({ ...setup, waterChange: 0 }, 8);
    const changed = factsAfterDays({ ...setup, waterChange: 0.5 }, 8);
    expect(kept.waterChanges as number).toBe(1);
    expect(changed.waterChanges as number).toBe(1);
    expect(changed.ammonia as number).toBeLessThan(kept.ammonia as number);
  });
});

/* ================================================================== *
 * The failure cascade
 * ================================================================== */

describe("unplugging the pump starves the colony and reaches the fish", () => {
  const unplugged: ParamValues = { pumpPlugged: false, timeComp: 1000 };

  it("ammonia crosses 0.25 mg/L within a day, at a recorded hour", () => {
    const f = runDays(unplugged, 2).facts();
    expect(f.ammoniaCrossHour as number).toBeGreaterThanOrEqual(0);
    expect(f.ammoniaCrossHour as number).toBeLessThan(24);
  });

  it("the colony dies back without flow, instead of filtering by magic", () => {
    const f = runDays(unplugged, 2).facts();
    expect(f.colonyA as number).toBeLessThan(0.5); // from 1.0 at the start
  });

  it("the still surface lets oxygen sag", () => {
    const f = runDays(unplugged, 2).facts();
    expect(f.oxygen as number).toBeLessThan(7);
    const pumped = runDays({ timeComp: 1000 }, 2).facts();
    expect(pumped.oxygen as number).toBeGreaterThan(f.oxygen as number);
  });

  it("fish visibly stress, then the first loss arrives with a named cause", () => {
    const twoDays = runDays(unplugged, 2).facts();
    expect(twoDays.firstStressHour as number).toBeGreaterThanOrEqual(0);
    expect(twoDays.meanHealth as number).toBeLessThan(90);

    const fiveDays = factsAfterDays({ pumpPlugged: false, timeComp: 5000 }, 5);
    expect(fiveDays.firstDeathHour as number).toBeGreaterThanOrEqual(0);
    expect(
      (fiveDays.deathsAmmonia as number) + (fiveDays.deathsOxygen as number),
    ).toBeGreaterThanOrEqual(1);
    expect(fiveDays.systemOk).toBe(false);
  });

  it("a control tank with the pump plugged in loses nothing", () => {
    const f = factsAfterDays({ timeComp: 5000 }, 5);
    expect(f.ammoniaPeak as number).toBeLessThan(0.25);
    expect(f.fishDead as number).toBe(0);
    expect(f.systemOk).toBe(true);
  });
});

/* ================================================================== *
 * Heat and light are real couplings too
 * ================================================================== */

describe("heater and light behave like apparatus, not decoration", () => {
  it("unplugged, the water relaxes to the 19 degree room", () => {
    const f = factsAfterDays({ timeComp: 5000, heaterPlugged: false }, 1);
    expect(f.temperatureC as number).toBeLessThan(19.5);
    expect(f.temperatureC as number).toBeGreaterThan(18.5);
  });

  it("the thermostat holds the setpoint it is given", () => {
    const cool = factsAfterDays({ timeComp: 5000, heaterSet: 22 + K }, 1);
    const warm = factsAfterDays({ timeComp: 5000, heaterSet: 30 + K }, 1);
    expect(Math.abs((cool.temperatureC as number) - 22)).toBeLessThan(1);
    expect(Math.abs((warm.temperatureC as number) - 30)).toBeLessThan(1);
  });

  it("light drives plant oxygen", () => {
    const dark = factsAfterDays({ timeComp: 5000, plants: 10, lightHours: 0 }, 2);
    const lit = factsAfterDays({ timeComp: 5000, plants: 10, lightHours: 12 * HOUR_S }, 2);
    // Day 2 at 08:00 falls inside a 12 h window, so the lit tank is pearling.
    expect(lit.lightOn).toBe(true);
    expect(dark.lightOn).toBe(false);
    expect((lit.oxygen as number) - (dark.oxygen as number)).toBeGreaterThan(0.05);
  });
});

/* ================================================================== *
 * The heap
 * ================================================================== */

describe("loose parts: every coupling coefficient is genuinely zero", () => {
  const tray: ParamValues = {
    timeComp: 5000, looseParts: true, pumpPlugged: false, heaterPlugged: false,
    lightPlugged: false, media: "none", fishStocked: 0, plants: 0,
  };

  it("a week on the tray produces nothing measurable at all", () => {
    const f = factsAfterDays(tray, 7);
    expect(f.day as number).toBeGreaterThanOrEqual(7);
    expect(f.activeFlows as number).toBe(0);
    expect(f.ammonia as number).toBe(0);
    expect(f.nitrite as number).toBe(0);
    expect(f.nitrate as number).toBe(0);
    expect(f.temperatureC as number).toBe(19);
    expect(f.loose).toBe(true);
    expect(f.systemOk).toBe(false);
  });

  it("driving any control changes nothing while the parts are uncoupled", () => {
    // Same tray, controls slammed to opposite ends. If any coupling were
    // merely small instead of zero, some readout would drift apart.
    const lo = runDays({ ...tray, fishStocked: 6, feeding: 0, heaterSet: 18 + K, lightHours: 0 }, 2);
    const hi = runDays({
      ...tray, fishStocked: 6, feeding: 4, heaterSet: 30 + K, lightHours: 16 * HOUR_S,
    }, 2);
    expect(hi.readoutValues()).toEqual(lo.readoutValues());
    const fl = lo.facts(), fh = hi.facts();
    for (const key of ["ammonia", "oxygen", "temperatureC", "meanHealth", "colony", "activeFlows"]) {
      expect(fh[key], `fact ${key} moved in the tray`).toEqual(fl[key]);
    }
  });

  it("the identical parts assembled become a working system", () => {
    const f = factsAfterDays({ timeComp: 5000 }, 1);
    expect(f.activeFlows as number).toBeGreaterThanOrEqual(8);
    expect(f.partsOk).toBe(true);
    expect(f.connectedOk).toBe(true);
    expect(f.systemOk).toBe(true);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base(), 30, "twin");
    const b = runFor(base(), 30, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("time compression changes pace and only pace", () => {
    const slow = runFor(base({ timeComp: 100 }), 30);
    const fast = runFor(base({ timeComp: 1000 }), 30);
    expect(fast.facts().day as number).toBeGreaterThan(slow.facts().day as number);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 20, "resetting");
    runner.reset();
    const fresh = new SimRunner({
      manifest: unplugAquariumSim, params: base(), band: "6-8", seed: "resetting",
    });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });
});
