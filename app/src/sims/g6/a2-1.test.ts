import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import {
  EDGES, NODES, classify, whereYouDrawTheLineSim as sim,
} from "./a2-1-where-you-draw-the-line";

/**
 * Science gate for G6-A2.1 "Where You Draw the Line".
 *
 * The spec's honesty rule, made structural: `classify()` decides a role from
 * node membership alone, and every edge's `rate()` reads the hour and the
 * params alone — the two functions never call each other, so a boundary
 * drag cannot alter a flow's rate even in principle. These tests drive that
 * claim directly (same hour, same params, different boundary → identical
 * rates, different roles), then check the three named scenarios (the
 * compost flow, the solar array, the wider boundary), the network's fixed
 * shape (14 nodes, 26 edges), a genuine mass-conservation check on the
 * trash bin, determinism and a clean reset.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(sim.params), ...overrides };
}

function runFor(params: ParamValues, engineSeconds: number, seed = "g6a2-1") {
  const runner = new SimRunner({ manifest: sim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / (sim.tickRate ?? 120);
  const ticks = Math.round(engineSeconds / dt);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAt = (overrides: ParamValues, seconds = 0.1) => runFor(base(overrides), seconds).facts();

/* ================================================================== *
 * Identity and shape
 * ================================================================== */

describe("g6.a2-1 manifest", () => {
  it("carries the Unit A2.1 identity", () => {
    expect(sim.id).toBe("g6.a2-1");
    expect(sim.title).toBe("Where You Draw the Line");
    expect(sim.grades).toContain(6);
    expect(sim.bands).toContain("6-8");
  });

  it("is a 14-node, 26-edge network, per the spec", () => {
    expect(NODES.length).toBe(14);
    expect(EDGES.length).toBe(26);
    // No dangling endpoints: every edge names two real nodes.
    const ids = new Set(NODES.map((n) => n.id));
    for (const e of EDGES) {
      expect(ids.has(e.from), `edge ${e.id} has an unknown 'from'`).toBe(true);
      expect(ids.has(e.to), `edge ${e.id} has an unknown 'to'`).toBe(true);
    }
  });
});

/* ================================================================== *
 * The law: the boundary reclassifies, it never touches a rate
 * ================================================================== */

describe("moving the boundary changes classification, never a rate", () => {
  it("every edge's rate is bit-identical across every preset, same hour and params", () => {
    const presets = ["campus", "cafeteria", "buildings", "campusPlusBuses"];
    const rateSets = presets.map((boundaryPreset) => factsAt({ boundaryPreset, timeOfDay: 12 * 3600 }));
    for (const e of EDGES) {
      const values = rateSets.map((f) => f[`rate_${e.id}`] as number);
      for (let i = 1; i < values.length; i++) {
        expect(values[i], `edge ${e.id} rate changed between presets`).toBeCloseTo(values[0], 9);
      }
    }
  });

  it("but roles genuinely differ between presets — the boundary is not decorative", () => {
    const campus = factsAt({ boundaryPreset: "campus" });
    const cafeteria = factsAt({ boundaryPreset: "cafeteria" });
    let changed = 0;
    for (const e of EDGES) if (campus[`role_${e.id}`] !== cafeteria[`role_${e.id}`]) changed++;
    expect(changed).toBeGreaterThan(0);
  });

  it("classify() depends only on node membership, never on the edge's rate", () => {
    // A direct unit check on the exported classifier: swapping which node is
    // "inside" flips the role even though the edge object (and its rate
    // function) is untouched.
    const edge = EDGES[0];
    expect(classify(edge, new Set([edge.from, edge.to]))).toBe("internal");
    expect(classify(edge, new Set([edge.to]))).toBe("input");
    expect(classify(edge, new Set([edge.from]))).toBe("output");
    expect(classify(edge, new Set())).toBe("outside");
  });
});

/* ================================================================== *
 * The four scenarios
 * ================================================================== */

describe("S1 — the whole campus", () => {
  it("classifies every one of the 26 edges into inputs, outputs or internal", () => {
    const f = factsAt({ boundaryPreset: "campus" });
    expect((f.inputsCount as number) + (f.outputsCount as number) + (f.internalCount as number)).toBe(26);
    expect(f.outsideCount).toBe(0);
    expect(f.internalCount as number).toBeGreaterThan(0);
    expect(f.inputsCount as number).toBeGreaterThan(0);
    expect(f.outputsCount as number).toBeGreaterThan(0);
  });
});

describe("S2 — just the cafeteria", () => {
  it("the compost flow is internal at the whole campus and an output at the cafeteria alone", () => {
    const campus = factsAt({ boundaryPreset: "campus", composting: true });
    const cafeteria = factsAt({ boundaryPreset: "cafeteria", composting: true });
    expect(campus.role_wasteCompost).toBe("internal");
    expect(cafeteria.role_wasteCompost).toBe("output");
  });

  it("shrinking to one building leaves nothing internal", () => {
    const f = factsAt({ boundaryPreset: "cafeteria" });
    expect(f.internalCount).toBe(0);
  });
});

describe("S3 — solar left outside", () => {
  it("solar power to the buildings is internal under the campus boundary", () => {
    const f = factsAt({ boundaryPreset: "campus", solarOutput: 42000 });
    expect(f.role_elecSolarClass).toBe("internal");
    expect(f.role_elecSolarCafe).toBe("internal");
  });

  it("the same panel's power becomes an input once 'buildings only' excludes its roof", () => {
    const f = factsAt({ boundaryPreset: "buildings", solarOutput: 42000 });
    expect(f.role_elecSolarClass).toBe("input");
    expect(f.role_elecSolarCafe).toBe("input");
  });
});

describe("S4 — draw it wide", () => {
  it("folding in the homes and the supplier lowers the total crossing count", () => {
    const campus = factsAt({ boundaryPreset: "campus" });
    const wide = factsAt({ boundaryPreset: "campusPlusBuses" });
    const campusCrossing = (campus.inputsCount as number) + (campus.outputsCount as number);
    const wideCrossing = (wide.inputsCount as number) + (wide.outputsCount as number);
    expect(wideCrossing).toBeLessThan(campusCrossing);
  });

  it("the food truck and a bus flow both become internal", () => {
    const f = factsAt({ boundaryPreset: "campusPlusBuses" });
    expect(f.role_foodTruck).toBe("internal");
    expect(f.role_peopleBusIn).toBe("internal");
  });
});

/* ================================================================== *
 * Custom boundary: clicking a node
 * ================================================================== */

describe("the custom boundary responds to clicking a node", () => {
  it("clicking the off-site water main folds it inside — even a utility connection can become internal", () => {
    const runner = new SimRunner({
      manifest: sim, params: base({ boundaryPreset: "custom" }), band: "6-8", seed: "click",
    });
    runner.playing = true;
    // A fresh custom boundary starts as a copy of "whole campus": every
    // on-site node in, every external node — including the water main —
    // out. So washrooms is already inside, and water-to-washrooms crosses.
    const before = runner.facts();
    expect(before.role_waterWash).toBe("input");

    const waterMain = NODES.find((n) => n.id === "waterMain")!;
    runner.push({ type: "pointerdown", x: waterMain.x, y: waterMain.y, id: 1 });
    runner.advance(1 / 30);
    const afterAdd = runner.facts();
    expect(afterAdd.insideCount).toBeGreaterThan(before.insideCount as number);
    // Activity #5's answer, made concrete: fold the source itself inside and
    // the same flow, moving the same way, reads as purely internal.
    expect(afterAdd.role_waterWash).toBe("internal");

    // Clicking an already-included node toggles it back out.
    const washrooms = NODES.find((n) => n.id === "washrooms")!;
    runner.push({ type: "pointerdown", x: washrooms.x, y: washrooms.y, id: 1 });
    runner.advance(1 / 30);
    const afterRemove = runner.facts();
    expect(afterRemove.role_waterWash).toBe("output");
  });
});

/* ================================================================== *
 * Reclassification is counted honestly
 * ================================================================== */

describe("reclassified-by-last-move counts exactly the edges that flipped", () => {
  it("matches an independent count computed from classify() directly", () => {
    const runner = new SimRunner({
      manifest: sim, params: base({ boundaryPreset: "campus" }), band: "6-8", seed: "reclass",
    });
    runner.playing = true;
    runner.advance(1 / 30); // settle prevRoles under "campus"

    const campusInside = new Set(NODES.filter((n) => !n.external).map((n) => n.id));
    const cafeteriaInside = new Set(["cafeteria" as const]);
    let expected = 0;
    for (const e of EDGES) if (classify(e, campusInside) !== classify(e, cafeteriaInside)) expected++;

    runner.setParams({ ...runner.params, boundaryPreset: "cafeteria" });
    runner.advance(1 / 30);
    expect(runner.facts().reclassifiedCount).toBe(expected);

    // And it settles back to zero on the very next tick, once nothing else moves.
    runner.advance(1 / 30);
    expect(runner.facts().reclassifiedCount).toBe(0);
  });
});

/* ================================================================== *
 * Rates genuinely respond to their controls
 * ================================================================== */

describe("rates respond to the controls that should drive them", () => {
  it("more enrolment means more classroom water and electricity demand", () => {
    const low = factsAt({ enrolment: 200, timeOfDay: 12 * 3600 });
    const high = factsAt({ enrolment: 900, timeOfDay: 12 * 3600 });
    expect(high.rate_waterWash as number).toBeGreaterThan(low.rate_waterWash as number);
    expect((high.rate_elecGridClass as number) + (high.rate_elecSolarClass as number))
      .toBeGreaterThan((low.rate_elecGridClass as number) + (low.rate_elecSolarClass as number));
  });

  it("more solar output covers more of the load from the array instead of the grid", () => {
    const dim = factsAt({ solarOutput: 0, timeOfDay: 12 * 3600 });
    const bright = factsAt({ solarOutput: 60000, timeOfDay: 12 * 3600 });
    expect(dim.rate_elecSolarClass).toBe(0);
    expect(bright.rate_elecSolarClass as number).toBeGreaterThan(0);
    expect(bright.rate_elecGridClass as number).toBeLessThan(dim.rate_elecGridClass as number);
  });

  it("irrigation drives both the field's water and the pump's electricity", () => {
    const off = factsAt({ irrigation: 0 });
    const on = factsAt({ irrigation: 40 });
    expect(on.rate_waterField as number).toBeGreaterThan(off.rate_waterField as number);
    expect(on.rate_elecGridField as number).toBeGreaterThan(off.rate_elecGridField as number);
  });

  it("the bus flows pulse at the scheduled arrival and are silent at noon", () => {
    const noon = factsAt({ timeOfDay: 12 * 3600 });
    const arrival = factsAt({ timeOfDay: (7 + 50 / 60) * 3600 });
    expect(noon.rate_peopleBusIn).toBe(0);
    expect(arrival.rate_peopleBusIn as number).toBeGreaterThan(0);
  });

  it("composting redirects scraps from the trash bin to the garden", () => {
    const composting = factsAt({ composting: true, timeOfDay: 11.75 * 3600 });
    const notComposting = factsAt({ composting: false, timeOfDay: 11.75 * 3600 });
    expect(composting.rate_wasteCompost as number).toBeGreaterThan(0);
    expect(notComposting.rate_wasteCompost).toBe(0);
    expect(notComposting.rate_wasteTrashCafe as number).toBeGreaterThan(composting.rate_wasteTrashCafe as number);
  });
});

/* ================================================================== *
 * The trash bin: a real stock, honestly conserved
 * ================================================================== */

describe("the trash bin is a genuine stock with a discrete twice-weekly haul", () => {
  it("accumulates through the week and empties in a discrete event that conserves mass", () => {
    const runner = runFor(base({ boundaryPreset: "campus" }), 5 * 90); // ~5 sim-days at 1x
    const f = runner.facts();
    expect(f.haulCount as number).toBeGreaterThanOrEqual(1);
    expect(f.binConserves).toBe(true);
  });

  it("a run with heavier trash generation piles up faster between hauls", () => {
    const light = runFor(base({ enrolment: 200, composting: true }), 1.5 * 90).facts();
    const heavy = runFor(base({ enrolment: 900, composting: false }), 1.5 * 90).facts();
    expect(heavy.trashStockKg as number).toBeGreaterThan(light.trashStockKg as number);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const a = runFor(base(), 20, "twin");
    const b = runFor(base(), 20, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("the clock genuinely advances", () => {
    const r = runFor(base(), 30);
    expect(r.facts().hour as number).not.toBe(12);
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const runner = runFor(base(), 40, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: sim, params: base(), band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite through a long run", () => {
    const runner = runFor(base(), 10 * 90);
    for (const ro of runner.readouts()) expect(Number.isFinite(ro.quantity.value)).toBe(true);
    for (const [k, v] of Object.entries(runner.facts())) {
      if (typeof v === "number") expect(Number.isFinite(v), `fact ${k}`).toBe(true);
    }
  });
});
