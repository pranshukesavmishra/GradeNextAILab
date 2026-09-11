import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { argumentBridgeSim } from "./a5-5-argument-bridge";

/**
 * Science gate for G6-A5.5 "Argument Bridge: The Delta Fish Kill".
 *
 * The spec's honesty rule, and the founder's law that this experiment exists
 * to teach exactly one idea: a claim is only as strong as evidence that
 * actually bears on it, and "bears on it" is a computed fact, never an
 * authored weight. Every relevance score here comes from a genuine
 * counterfactual — force this one reading to a safe value and recompute the
 * whole fixed mortality history — so this file checks the computation
 * itself: readings that would have changed the outcome score high, readings
 * that would not score at or near zero, and a claim naming no mechanism (or
 * the wrong one) is structurally capped no matter how much true evidence
 * piles onto it.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(argumentBridgeSim.params), ...overrides };
}

function runFor(params: ParamValues, seconds = 1, seed = "a5-5") {
  const runner = new SimRunner({ manifest: argumentBridgeSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 10;
  const ticks = Math.ceil(seconds * 10);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds = 1, seed = "a5-5") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * The fixed ecosystem history is a real, causal timeline
 * ================================================================== */

describe("the fish kill is a real, computed history, not a scripted event", () => {
  it("no deaths occur before the mat has had time to grow", () => {
    const f = factsAfter({ timelineDay: -10 });
    expect(f.survivors).toBe(400);
  });

  it("deaths accumulate only after the mat approaches its maximum", () => {
    const early = factsAfter({ timelineDay: -5 });
    const late = factsAfter({ timelineDay: 0 });
    expect(early.survivors).toBe(400);
    expect(late.survivors as number).toBeLessThan(400);
    expect(late.matCoverPct as number).toBeGreaterThan(early.matCoverPct as number);
  });

  it("the population never recovers once fish are lost", () => {
    const before = factsAfter({ timelineDay: -1 });
    const after = factsAfter({ timelineDay: 2 });
    expect(after.survivors as number).toBeLessThanOrEqual(before.survivors as number);
  });

  it("a dawn reading in the crash window sits below the death threshold", () => {
    const f = factsAfter({ timelineDay: -1, timelineHour: 4, sampleDepthM: 3.0 });
    expect(f.oxygenNow as number).toBeLessThan(2.0);
  });

  it("a noon reading the same day sits comfortably above it", () => {
    const f = factsAfter({ timelineDay: -1, timelineHour: 16, sampleDepthM: 3.0 });
    expect(f.oxygenNow as number).toBeGreaterThan(6);
  });
});

/* ================================================================== *
 * The fit meter is computed sensitivity, never a scripted weight
 * ================================================================== */

describe("relevance is a real counterfactual: would this reading have changed the outcome", () => {
  it("a dawn reading that genuinely caught the crash scores well above zero", () => {
    const f = factsAfter({ claim: "lowOxygenDawn" });
    expect(f.oxygenDawnRelevance as number).toBeGreaterThan(15);
  });

  it("a noon reading that shows nothing wrong scores at zero", () => {
    const f = factsAfter({ claim: "lowOxygenDawn" });
    expect(f.oxygenNoonRelevance).toBe(0);
  });

  it("two independent good readings are worth more together than either alone", () => {
    const one = factsAfter({ claim: "lowOxygenDawn", evidenceOxygenDawn: true });
    const two = factsAfter({ claim: "lowOxygenDawn", evidenceOxygenDawn: true, evidenceOxygenDawn2: true });
    expect(two.argumentStrength as number).toBeGreaterThan(one.argumentStrength as number);
  });

  it("the wrong quantity for a claim's mechanism scores near zero regardless of the claim being true", () => {
    const f = factsAfter({ claim: "lowOxygenDawn" });
    expect(f.nitrateOutfallRelevance as number).toBeLessThan(10);
    expect(f.tempNoonRelevance as number).toBeLessThan(10);
  });

  it("the identical nitrate reading scores meaningfully higher under the claim it actually matches", () => {
    const wrongClaim = factsAfter({ claim: "lowOxygenDawn" });
    const rightClaim = factsAfter({ claim: "fertiliser" });
    expect(rightClaim.nitrateOutfallRelevance as number).toBeGreaterThan(wrongClaim.nitrateOutfallRelevance as number);
  });

  it("algae eat fish has no computed pathway to be sensitive to: every card scores near zero", () => {
    const f = factsAfter({ claim: "algaeEatFish" });
    expect(f.oxygenDawnRelevance as number).toBeLessThanOrEqual(5);
    expect(f.nitrateOutfallRelevance as number).toBeLessThanOrEqual(5);
  });
});

/* ================================================================== *
 * Claim-level ceilings apply to the combined argument, not per card
 * ================================================================== */

describe("a claim's own ceiling bounds the combined argument, however much evidence piles on", () => {
  it("the vague claim caps out well below the correct claim's own reach", () => {
    const allCards: ParamValues = {
      evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceOxygenNoon: true,
      evidenceNitrateOutfall: true, evidenceTempNoon: true, evidenceAlgaeCover: true, evidenceSalinity: true,
    };
    const vague = factsAfter({ claim: "vague", ...allCards });
    const correct = factsAfter({ claim: "lowOxygenDawn", ...allCards });
    expect(vague.argumentStrength as number).toBeLessThanOrEqual(42);
    expect(correct.argumentStrength as number).toBeGreaterThan(vague.argumentStrength as number);
  });

  it("piling every card onto the vague claim still cannot clear the hardest load test", () => {
    const f = factsAfter({
      claim: "vague", challengeWeight: 5, rebuttalBot: false,
      evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceOxygenNoon: true,
      evidenceNitrateOutfall: true, evidenceTempNoon: true, evidenceAlgaeCover: true, evidenceSalinity: true,
    });
    expect(f.loadTestPass).toBe(false);
  });

  it("the correct, specific claim can clear the hardest load test with strong evidence", () => {
    const f = factsAfter({
      claim: "lowOxygenDawn", challengeWeight: 5, rebuttalBot: true,
      evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceSalinity: true,
    });
    expect(f.loadTestPass).toBe(true);
  });
});

/* ================================================================== *
 * The rebuttal is a separate gate, not more of the same evidence
 * ================================================================== */

describe("the rebuttal is defeated only by evidence that speaks to it", () => {
  it("strong, correct evidence alone does not satisfy an active rebuttal", () => {
    const f = factsAfter({ claim: "lowOxygenDawn", evidenceOxygenDawn: true, evidenceOxygenDawn2: true, rebuttalBot: true });
    expect(f.rebuttalOk).toBe(false);
  });

  it("adding the salinity card, and only that, satisfies it", () => {
    const f = factsAfter({ claim: "lowOxygenDawn", evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceSalinity: true, rebuttalBot: true });
    expect(f.rebuttalOk).toBe(true);
  });

  it("with the rebuttal off, the same evidence never needed it", () => {
    const f = factsAfter({ claim: "lowOxygenDawn", evidenceOxygenDawn: true, rebuttalBot: false });
    expect(f.rebuttalOk).toBe(true);
  });
});

/* ================================================================== *
 * The live sampling controls (site, depth, timeline) are all causal
 * ================================================================== */

describe("every sampling control genuinely changes what the skiff reads", () => {
  it("nitrate dilutes with distance from the outfall", () => {
    const near = factsAfter({ sampleSiteM: 0, timelineDay: -1 });
    const far = factsAfter({ sampleSiteM: 400, timelineDay: -1 });
    expect(near.nitrateNow as number).toBeGreaterThan(far.nitrateNow as number);
  });

  it("depth matters: oxygen is stratified, worse at the bottom", () => {
    const surface = factsAfter({ sampleDepthM: 0.2, timelineDay: -1, timelineHour: 5 });
    const bottom = factsAfter({ sampleDepthM: 3.4, timelineDay: -1, timelineHour: 5 });
    expect(bottom.oxygenNow as number).toBeLessThan(surface.oxygenNow as number);
  });

  it("the timeline hour drives the diurnal oxygen swing", () => {
    const dawn = factsAfter({ timelineDay: -1, timelineHour: 4 });
    const afternoon = factsAfter({ timelineDay: -1, timelineHour: 16 });
    expect(afternoon.oxygenNow as number).toBeGreaterThan(dawn.oxygenNow as number);
  });

  it("far enough from the outfall, the mat's effect on oxygen genuinely fades", () => {
    const underMat = factsAfter({ sampleSiteM: 0, timelineDay: -1, timelineHour: 4 });
    const openWater = factsAfter({ sampleSiteM: 400, timelineDay: -1, timelineHour: 4 });
    expect(openWater.oxygenNow as number).toBeGreaterThan(underMat.oxygenNow as number);
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const params = base({ claim: "lowOxygenDawn", evidenceOxygenDawn: true });
    const a = runFor(params, 5, "twin");
    const b = runFor(params, 5, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ claim: "fertiliser", evidenceNitrateOutfall: true });
    const runner = runFor(params, 4, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: argumentBridgeSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every readout and fact stays finite across every claim", () => {
    for (const claim of ["vague", "lowOxygenDawn", "fertiliser", "tooHot", "algaeEatFish"]) {
      const r = runFor(base({ claim, evidenceOxygenDawn: true, evidenceSalinity: true }), 2, claim);
      for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), `${claim} readout ${ro.key}`).toBe(true);
      for (const [k, v] of Object.entries(r.facts())) {
        if (typeof v === "number") expect(Number.isFinite(v), `${claim} fact ${k}`).toBe(true);
      }
    }
  });

  it("time moves", () => {
    const r = runFor(base(), 0.6);
    expect(r.time).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Labs and challenges are actually reachable as written
 * ================================================================== */

function values(r: SimRunner) {
  return { readouts: r.readoutValues(), facts: r.facts(), params: r.params, data: [] as never[], elapsed: r.time };
}

describe("every lab step's check is reachable by playing it as written", () => {
  it("the-vague-claim: fails vague, specific claim recorded, concludes", () => {
    const lab = argumentBridgeSim.labs!.find((l) => l.id === "the-vague-claim")!;
    const r = runFor(lab.setup!, 1, "l1");
    expect(lab.steps.find((s) => s.id === "run")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, claim: "lowOxygenDawn" });
    expect(lab.steps.find((s) => s.id === "specific")!.check!.test(values(r))).toBe(true);
  });

  it("right-answer-wrong-evidence: fails on wrong cards, passes once the dawn card is added", () => {
    const lab = argumentBridgeSim.labs!.find((l) => l.id === "right-answer-wrong-evidence")!;
    const r = runFor(lab.setup!, 1, "l2");
    expect(lab.steps.find((s) => s.id === "run")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "check-relevance")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, evidenceOxygenDawn: true });
    expect(lab.steps.find((s) => s.id === "fix")!.check!.test(values(r))).toBe(true);
  });

  it("before-dawn-under-the-mat: reading below threshold, card relevant, noon comparison clean", () => {
    const lab = argumentBridgeSim.labs!.find((l) => l.id === "before-dawn-under-the-mat")!;
    const r = runFor(lab.setup!, 1, "l3");
    expect(lab.steps.find((s) => s.id === "sample")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, evidenceOxygenDawn: true });
    expect(lab.steps.find((s) => s.id === "add-card")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, timelineHour: 16 });
    expect(lab.steps.find((s) => s.id === "compare-noon")!.check!.test(values(r))).toBe(true);
  });

  it("the-opposing-scientist: fails the rebuttal, then holds once salinity is added", () => {
    const lab = argumentBridgeSim.labs!.find((l) => l.id === "the-opposing-scientist")!;
    const r = runFor(lab.setup!, 1, "l4");
    expect(lab.steps.find((s) => s.id === "watch-fail")!.check!.test(values(r))).toBe(true);
    r.setParams({ ...r.params, evidenceSalinity: true });
    expect(lab.steps.find((s) => s.id === "add-salinity")!.check!.test(values(r))).toBe(true);
    expect(lab.steps.find((s) => s.id === "cross")!.check!.test(values(r))).toBe(true);
  });
});

describe("every challenge's goal is reachable by the settings its hints point to", () => {
  it("build the strongest case: two dawn cards plus salinity clears the hardest bar", () => {
    const ch = argumentBridgeSim.challenges!.find((c) => c.id === "build-the-strongest-case")!;
    const r = runFor({ ...ch.setup!, claim: "lowOxygenDawn", evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceSalinity: true }, 1, "ch1");
    expect(ch.goal.test(values(r))).toBe(true);
  });

  it("build the strongest case: one dawn card without salinity fails it", () => {
    const ch = argumentBridgeSim.challenges!.find((c) => c.id === "build-the-strongest-case")!;
    const r = runFor({ ...ch.setup!, claim: "lowOxygenDawn", evidenceOxygenDawn: true }, 1, "ch2");
    expect(ch.goal.test(values(r))).toBe(false);
  });

  it("every claim has a ceiling: both vague and algae-eat-fish fail loaded with everything", () => {
    const ch = argumentBridgeSim.challenges!.find((c) => c.id === "every-claim-has-a-ceiling")!;
    for (const claim of ["vague", "algaeEatFish"]) {
      const r = runFor({
        ...ch.setup!, claim,
        evidenceOxygenDawn: true, evidenceOxygenDawn2: true, evidenceOxygenNoon: true,
        evidenceNitrateOutfall: true, evidenceTempNoon: true, evidenceAlgaeCover: true, evidenceSalinity: true,
      }, 1, `ch3-${claim}`);
      expect(ch.goal.test(values(r)), claim).toBe(true);
    }
  });
});
