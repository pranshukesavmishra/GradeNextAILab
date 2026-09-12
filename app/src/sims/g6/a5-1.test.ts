import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { benchThatBitesSim } from "./a5-1-the-bench-that-bites";

/**
 * Science gate for G6-A5.1 "The Bench That Bites".
 *
 * The spec's honesty rule is that nothing here is random punishment: every
 * incident is a deterministic function of PPE, reagent, pour height, plate
 * temperature and layout. This file drives each of those controls and checks
 * the response actually follows the physics — a splash radius that grows with
 * pour height, PPE that blocks some channels entirely and only ever reduces
 * others, an ignition that needs all three of its conditions at once, and an
 * earthquake that only breaks glassware started near the edge.
 */

const K = 273.15;

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(benchThatBitesSim.params), ...overrides };
}

function runFor(params: ParamValues, seconds: number, seed = "a5-1") {
  const runner = new SimRunner({ manifest: benchThatBitesSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 30;
  const ticks = Math.round(seconds * 30);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds: number, seed = "a5-1") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * The pour: real ballistics, not a scripted outcome
 * ================================================================== */

describe("the pour's splash radius comes from real free-fall physics", () => {
  it("a higher pour produces a strictly larger splash radius", () => {
    const low = factsAfter({ pourHeight: 0.01 }, 1);
    const mid = factsAfter({ pourHeight: 0.05 }, 1);
    const high = factsAfter({ pourHeight: 0.25 }, 1);
    expect(low.sprayRadiusCm as number).toBeLessThan(mid.sprayRadiusCm as number);
    expect(mid.sprayRadiusCm as number).toBeLessThan(high.sprayRadiusCm as number);
  });

  it("a 25 cm pour genuinely reaches the face; a 5 cm pour does not", () => {
    const gentle = factsAfter({ reagent: "hcl", pourHeight: 0.05, ppeGoggles: false }, 1);
    const high = factsAfter({ reagent: "hcl", pourHeight: 0.25, ppeGoggles: false }, 1);
    expect(gentle.pourEye).toBe(false);
    expect(high.pourEye).toBe(true);
  });
});

/* ================================================================== *
 * PPE as a filter, exactly as strong as the spec claims
 * ================================================================== */

describe("PPE blocks eyes and torso entirely, but gloves only ever reduce", () => {
  it("goggles fully zero the eye channel even at a splashing pour height", () => {
    const bare = factsAfter({ reagent: "hcl", pourHeight: 0.25, ppeGoggles: false }, 1);
    const goggled = factsAfter({ reagent: "hcl", pourHeight: 0.25, ppeGoggles: true }, 1);
    expect(bare.pourEye).toBe(true);
    expect(goggled.pourEye).toBe(false);
  });

  it("an apron fully zeros the torso channel", () => {
    const bare = factsAfter({ reagent: "hcl", pourHeight: 0.15, ppeApron: false }, 1);
    const aproned = factsAfter({ reagent: "hcl", pourHeight: 0.15, ppeApron: true }, 1);
    expect(bare.pourTorso).toBe(true);
    expect(aproned.pourTorso).toBe(false);
  });

  it("gloves reduce chemical hand contact but never erase it", () => {
    const bare = factsAfter({ reagent: "cuso4", pourHeight: 0.05, ppeGloves: false }, 1);
    const gloved = factsAfter({ reagent: "cuso4", pourHeight: 0.05, ppeGloves: true }, 1);
    expect(bare.pourSkin).toBe(true);
    expect(gloved.pourSkin).toBe(true); // still registers — reduced, not gone
  });

  it("a fully suited pour still logs exactly one incident, on skin", () => {
    const f = factsAfter(
      { ppeGoggles: true, ppeApron: true, ppeGloves: true, reagent: "cuso4", pourHeight: 0.05, reachPath: "around" },
      1,
    );
    expect(f.incidents).toBe(1);
    expect(f.eyeExp).toBe(0);
    expect(f.skinExp).toBe(1);
  });

  it("water can never cause a chemical incident, however it is poured", () => {
    const f = factsAfter({ reagent: "water", pourHeight: 0.30, ppeGoggles: false, ppeApron: false, ppeGloves: false }, 1);
    expect(f.pourEye).toBe(false);
    expect(f.pourTorso).toBe(false);
    expect(f.pourSkin).toBe(false);
  });
});

/* ================================================================== *
 * Heat: gloves stop helping past 120 degrees C
 * ================================================================== */

describe("reaching across the hot plate is a real thermal contact", () => {
  it("going around the front avoids the reach event's contact entirely", () => {
    const f = factsAfter({ reachPath: "around", hotPlateSet: 300 + K }, 15);
    expect(f.reached).toBe(true);
    expect(f.reachSeverity).toBe(0);
  });

  it("reaching across a hot enough plate causes a real burn severity", () => {
    const f = factsAfter({ reachPath: "across", hotPlateSet: 300 + K }, 15);
    expect(f.reached).toBe(true);
    expect(f.reachSeverity as number).toBeGreaterThan(0);
    expect(f.skinExp as number).toBeGreaterThanOrEqual(1);
  });

  it("above 120 C gloves make no measurable difference to the burn", () => {
    // Room 22C, tau 25s, reach fires at t=10s: a 350C setpoint clears 120C by then.
    const bare = factsAfter({ reachPath: "across", hotPlateSet: 350 + K, ppeGloves: false }, 12);
    const gloved = factsAfter({ reachPath: "across", hotPlateSet: 350 + K, ppeGloves: true }, 12);
    expect(bare.hotPlateC as number).toBeGreaterThan(120);
    expect(gloved.reachSeverity).toBeCloseTo(bare.reachSeverity as number, 6);
  });

  it("below the cutoff, gloves do measurably cut the burn", () => {
    // At t=10s toward a 200C setpoint the plate sits at about 81C: over the
    // touch threshold, but still under the 120C cutoff where gloves stop helping.
    const bare = factsAfter({ reachPath: "across", hotPlateSet: 200 + K, ppeGloves: false }, 12);
    const gloved = factsAfter({ reachPath: "across", hotPlateSet: 200 + K, ppeGloves: true }, 12);
    expect(bare.hotPlateC as number).toBeLessThan(120);
    expect(gloved.reachSeverity as number).toBeLessThan(bare.reachSeverity as number);
    expect(gloved.reachSeverity as number).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Ignition: three independent conditions, never fewer
 * ================================================================== */

describe("ignition needs vapour, heat and a pathway all at once", () => {
  const s3: ParamValues = { reagent: "ethanol", hotPlateSet: 300 + K, sash: 0.55, reachPath: "across", clutter: 4 };

  it("the S3 preset ignites within two minutes", () => {
    const f = factsAfter(s3, 120);
    expect(f.fire).toBe(true);
    expect(f.igniteAtS as number).toBeGreaterThan(0);
  });

  it("closing the sash alone removes it — vapour never builds past the room", () => {
    const f = factsAfter({ ...s3, sash: 0.40 }, 150);
    expect(f.fire).toBe(false);
    expect(f.vapor as number).toBeLessThan(0.1);
  });

  it("at the default sash, ethanol and a hot plate alone never ignite", () => {
    const f = factsAfter({ reagent: "ethanol", hotPlateSet: 300 + K, reachPath: "across", clutter: 4 }, 150);
    expect(f.fire).toBe(false);
  });

  it("without any pathway (around the front, low clutter), it still never ignites", () => {
    const f = factsAfter({ ...s3, reachPath: "around", clutter: 1 }, 150);
    expect(f.fire).toBe(false);
  });

  it("clutter alone can supply the pathway even when the reach path is safe", () => {
    const f = factsAfter({ ...s3, reachPath: "around", clutter: 4 }, 150);
    expect(f.fire).toBe(true);
  });

  it("a non-flammable reagent never ignites no matter the plate or sash", () => {
    const f = factsAfter({ reagent: "hcl", hotPlateSet: 350 + K, sash: 0.60, reachPath: "across", clutter: 6 }, 150);
    expect(f.fire).toBe(false);
  });
});

/* ================================================================== *
 * PPE compliance is computed from reagent and heat only
 * ================================================================== */

describe("PPE compliance is a measured comparison, not a checkbox", () => {
  it("bare-eyed with a corrosive reagent is non-compliant", () => {
    const f = factsAfter({ reagent: "hcl", ppeGoggles: false, ppeApron: true, ppeClosedShoes: true }, 1);
    expect(f.ppeCompliant).toBe(false);
  });

  it("full suiting against a corrosive, hot bench is compliant", () => {
    const f = factsAfter(
      { reagent: "hcl", hotPlateSet: 200 + K, ppeGoggles: true, ppeApron: true, ppeGloves: true, ppeClosedShoes: true },
      1,
    );
    expect(f.ppeCompliant).toBe(true);
  });

  it("plain water at room-safe heat requires no gloves or apron to be compliant", () => {
    const f = factsAfter({ reagent: "water", hotPlateSet: 25 + K, ppeGoggles: true, ppeClosedShoes: true }, 1);
    expect(f.ppeCompliant).toBe(true);
  });
});

/* ================================================================== *
 * Response margin: a real comparison of time available vs time needed
 * ================================================================== */

describe("response margin follows severity, not a fixed countdown", () => {
  it("a severe unblocked eye contact leaves a negative margin", () => {
    const f = factsAfter({ reagent: "hcl", pourHeight: 0.25, ppeGoggles: false, ppeApron: true }, 1);
    expect(f.hasIncidentForMargin).toBe(true);
    expect(f.reachedInTime).toBe(false);
  });

  it("a mild, mostly-gloved contact leaves a comfortable margin", () => {
    const f = factsAfter(
      { reagent: "cuso4", pourHeight: 0.05, ppeGoggles: true, ppeApron: true, ppeGloves: true, reachPath: "around" },
      1,
    );
    expect(f.reachedInTime).toBe(true);
  });
});

/* ================================================================== *
 * Earthquake: layout decides breakage, not chance
 * ================================================================== */

describe("the earthquake drill breaks glassware only where the layout risks it", () => {
  it("glassware at the edge breaks within the 6 s drill", () => {
    const f = factsAfter({ benchLayout: "edge", earthquake: true }, 7);
    expect(f.breakages as number).toBeGreaterThanOrEqual(1);
  });

  it("the standard layout survives the identical drill with zero breakages", () => {
    const f = factsAfter({ benchLayout: "standard", earthquake: true }, 7);
    expect(f.breakages).toBe(0);
  });

  it("closed shoes measurably soften the safety cost of a breakage", () => {
    const shod = factsAfter({ benchLayout: "edge", earthquake: true, ppeClosedShoes: true, reachPath: "around" }, 7);
    const bare = factsAfter({ benchLayout: "edge", earthquake: true, ppeClosedShoes: false, reachPath: "around" }, 7);
    expect(shod.breakages).toBe(bare.breakages);
    expect(shod.safety as number).toBeGreaterThan(bare.safety as number);
  });
});

/* ================================================================== *
 * Labs and challenges are actually reachable as written
 * ================================================================== */

function values(r: SimRunner): { readouts: Record<string, number>; facts: Record<string, number | boolean | string>; params: ParamValues; data: never[]; elapsed: number } {
  return { readouts: r.readoutValues(), facts: r.facts(), params: r.params, data: [], elapsed: r.time };
}

describe("every lab step's check is reachable by playing it as written", () => {
  it("suited-up: the measure step passes on its own setup", () => {
    const lab = benchThatBitesSim.labs!.find((l) => l.id === "suited-up")!;
    const r = runFor(lab.setup!, 1);
    const check = lab.steps.find((s) => s.id === "measure")!.check!;
    expect(check.test(values(r))).toBe(true);
  });

  it("bare-eyed: measure and timer steps both pass", () => {
    const lab = benchThatBitesSim.labs!.find((l) => l.id === "bare-eyed")!;
    const r = runFor(lab.setup!, 1);
    expect(lab.steps.find((s) => s.id === "measure")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "timer")!.check!.test(values(r))).toBe(true);
  });

  it("three-things-at-once: ignites, then the sash fix genuinely holds for 60s", () => {
    const lab = benchThatBitesSim.labs!.find((l) => l.id === "three-things-at-once")!;
    const r = runFor(lab.setup!, 100);
    expect(lab.steps.find((s) => s.id === "watch")!.check!.test(values(r))).toBe(true);

    // A fresh run with the sash closed from the start, held for the required window.
    const fixed = runFor({ ...lab.setup!, sash: 0.40 }, 65);
    expect(lab.steps.find((s) => s.id === "cheapest-fix")!.check!.test(values(fixed))).toBe(true);
  });

  it("three-things-at-once: the sash fix also works mid-run, closed after the drill starts", () => {
    const runner = new SimRunner({ manifest: benchThatBitesSim, params: { ...defaultParams(benchThatBitesSim.params), ...(benchThatBitesSim.labs!.find((l) => l.id === "three-things-at-once")!.setup!) }, band: "6-8", seed: "mid-fix" });
    runner.playing = true;
    const dt = 1 / 30;
    for (let i = 0; i < 20 * 30; i++) runner.advance(dt); // 20s in, still unignited
    expect(runner.facts().fire).toBe(false);
    runner.setParams({ ...runner.params, sash: 0.40 });
    for (let i = 0; i < 65 * 30; i++) runner.advance(dt);
    const lab = benchThatBitesSim.labs!.find((l) => l.id === "three-things-at-once")!;
    expect(lab.steps.find((s) => s.id === "cheapest-fix")!.check!.test(values(runner))).toBe(true);
  });

  it("shake-table-drill: breaks at the edge, then re-arms and survives once moved inboard", () => {
    const lab = benchThatBitesSim.labs!.find((l) => l.id === "shake-table-drill")!;
    const runner = new SimRunner({ manifest: benchThatBitesSim, params: { ...defaultParams(benchThatBitesSim.params), ...lab.setup! }, band: "6-8", seed: "shake" });
    runner.playing = true;
    const dt = 1 / 30;
    for (let i = 0; i < 7 * 30; i++) runner.advance(dt);
    expect(lab.steps.find((s) => s.id === "measure")!.check!.test(values(runner))).toBe(true);

    runner.setParams({ ...runner.params, benchLayout: "standard" });
    for (let i = 0; i < 7 * 30; i++) runner.advance(dt);
    expect(lab.steps.find((s) => s.id === "move-inboard")!.check!.test(values(runner))).toBe(true);
    // The re-armed drill at the safer layout must not have added a new breakage.
    expect(runner.facts().breakages).toBe(1);
  });
});

describe("every challenge's goal is reachable by the settings its hints point to", () => {
  it("dressed for the job: full PPE plus going around the front reaches zero incidents", () => {
    const ch = benchThatBitesSim.challenges!.find((c) => c.id === "dressed-for-the-job")!;
    const r = runFor({ ...ch.setup!, ppeGoggles: true, ppeGloves: true, ppeClosedShoes: true, reachPath: "around" }, 12);
    expect(ch.goal.test(values(r))).toBe(true);
    expect(ch.stars!.two!.test(values(r))).toBe(true);
  });

  it("dressed for the job: reaching across the same 200 C plate still fails it", () => {
    const ch = benchThatBitesSim.challenges!.find((c) => c.id === "dressed-for-the-job")!;
    const r = runFor({ ...ch.setup!, ppeGoggles: true, ppeGloves: true, ppeClosedShoes: true, reachPath: "across" }, 12);
    expect(ch.goal.test(values(r))).toBe(false);
  });

  it("defuse the ignition: closing the sash alone clears the two-star bar", () => {
    const ch = benchThatBitesSim.challenges!.find((c) => c.id === "defuse-the-ignition")!;
    const r = runFor({ ...ch.setup!, sash: 0.40 }, 95);
    expect(ch.goal.test(values(r))).toBe(true);
    expect(ch.stars!.two!.test(values(r))).toBe(true);
  });

  it("defuse the ignition: left alone, the preset genuinely fails the goal", () => {
    const ch = benchThatBitesSim.challenges!.find((c) => c.id === "defuse-the-ignition")!;
    const r = runFor({ ...ch.setup! }, 95);
    expect(ch.goal.test(values(r))).toBe(false);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base({ earthquake: true, reagent: "ethanol", sash: 0.55, clutter: 4 }), 60, "twin");
    const b = runFor(base({ earthquake: true, reagent: "ethanol", sash: 0.55, clutter: 4 }), 60, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ reagent: "ethanol", sash: 0.55, clutter: 4, earthquake: true });
    const runner = runFor(params, 40, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: benchThatBitesSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite through an eventful run", () => {
    const r = runFor(base({ reagent: "ethanol", sash: 0.55, clutter: 4, earthquake: true, benchLayout: "edge" }), 90);
    for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [k, v] of Object.entries(r.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), `fact ${k}`).toBe(true);
    }
  });

  it("time moves", () => {
    const r = runFor(base(), 0.6);
    expect(r.time).toBeGreaterThan(0);
  });
});
