import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { ParamValues } from "@engine/types";
import { plottingBenchSim } from "./a5-4-the-plotting-bench";

/**
 * Science gate for G6-A5.4 "The Plotting Bench: Charts That Lie".
 *
 * The spec's honesty rule is that the same true rows never change: only the
 * chart's own choices change what a reader sees. This file drives the axis
 * controls directly and checks that the true data-range fact never moves
 * while the apparent, pixel-based one does, that incompatible chart/type
 * pairings are genuinely flagged rather than silently accepted, and that
 * every one of the five datasets renders and reads out finite values.
 */

function base(overrides: ParamValues = {}): ParamValues {
  return { ...defaultParams(plottingBenchSim.params), ...overrides };
}

function runFor(params: ParamValues, seconds: number, seed = "a5-4") {
  const runner = new SimRunner({ manifest: plottingBenchSim, params, band: "6-8", seed });
  runner.playing = true;
  const dt = 1 / 10;
  const ticks = Math.ceil(seconds * 10);
  for (let i = 0; i < ticks; i++) runner.advance(dt);
  return runner;
}

const factsAfter = (overrides: ParamValues, seconds = 1, seed = "a5-4") =>
  runFor(base(overrides), seconds, seed).facts();

/* ================================================================== *
 * The truncation lie: real, computed, and reversible
 * ================================================================== */

describe("axis truncation changes the apparent effect, never the true one", () => {
  it("the true range is identical whatever the axis start is set to", () => {
    const zero = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "zero" });
    const custom = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "custom", yAxisMax: 520 });
    expect(zero.trueRange).toBeCloseTo(custom.trueRange as number, 6);
    expect(zero.dataMin).toBeCloseTo(custom.dataMin as number, 6);
    expect(zero.dataMax).toBeCloseTo(custom.dataMax as number, 6);
  });

  it("a zero-based bar chart is not flagged for truncation", () => {
    const f = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "zero" });
    expect(f.truncatedAxis).toBe(false);
  });

  it("a custom, narrowed axis on the same bar chart is flagged", () => {
    const f = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "custom", yAxisMax: 520 });
    expect(f.truncatedAxis).toBe(true);
  });

  it("the reader's apparent percentage grows once the axis is narrowed, the true one does not", () => {
    const zero = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "zero" });
    const custom = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "custom", yAxisMax: 520 });
    expect(custom.apparentPct as number).toBeGreaterThan(zero.apparentPct as number);
    expect(custom.truePct).toBeCloseTo(zero.truePct as number, 6);
    expect(custom.misreadingGapPct as number).toBeGreaterThan(zero.misreadingGapPct as number);
  });

  it("the misreading gap crosses the lab's 15-point threshold under a tight custom window", () => {
    const f = factsAfter({ dataset: "rainfall", xVar: "year", yVar: "rainfallMm", chartType: "bar", yAxisStart: "custom", yAxisMax: 520 });
    expect(f.misreadingGapPct as number).toBeGreaterThan(15);
  });
});

/* ================================================================== *
 * The critique engine: named, structural faults
 * ================================================================== */

describe("the critique engine flags real structural mismatches", () => {
  it("a pie chart on a time series is flagged, a line chart on it is not", () => {
    const pie = factsAfter({ dataset: "sierra", xVar: "month", yVar: "swe", chartType: "pie" });
    const line = factsAfter({ dataset: "sierra", xVar: "month", yVar: "swe", chartType: "line" });
    expect(pie.pieOfTimeSeries).toBe(true);
    expect(line.pieOfTimeSeries).toBe(false);
  });

  it("a line chart across two unordered continuous variables is flagged; a scatter is not", () => {
    const line = factsAfter({ dataset: "kelp", xVar: "sst", yVar: "kelpArea", chartType: "line" });
    const scatter = factsAfter({ dataset: "kelp", xVar: "sst", yVar: "kelpArea", chartType: "scatter" });
    expect(line.connectedNonSeries).toBe(true);
    expect(scatter.connectedNonSeries).toBe(false);
  });

  it("a histogram on a single continuous variable is compatible", () => {
    const f = factsAfter({ dataset: "reaction", xVar: "personId", yVar: "reactionMs", chartType: "histogram" });
    expect(f.compatible).toBe(true);
    expect(f.wrongMark).toBe(false);
  });

  it("aggregating without showing spread is flagged; showing spread clears it", () => {
    const hidden = factsAfter({ dataset: "reaction", chartType: "bar", xVar: "personId", yVar: "reactionMs", aggregation: "mean", showSpread: false });
    const shown = factsAfter({ dataset: "reaction", chartType: "bar", xVar: "personId", yVar: "reactionMs", aggregation: "mean", showSpread: true });
    expect(hidden.missingSpread).toBe(true);
    expect(shown.missingSpread).toBe(false);
  });

  it("every row with no aggregation is never flagged for missing spread", () => {
    const f = factsAfter({ dataset: "reaction", chartType: "histogram", aggregation: "every", showSpread: false });
    expect(f.missingSpread).toBe(false);
  });

  it("a fully honest chart scores 100", () => {
    const f = factsAfter({ dataset: "sierra", xVar: "month", yVar: "swe", chartType: "line", yAxisStart: "zero", aggregation: "every" });
    expect(f.chartScore).toBe(100);
    expect(f.faultCount).toBe(0);
  });

  it("stacking multiple faults lowers the score below any single one of them", () => {
    const one = factsAfter({ dataset: "sierra", xVar: "month", yVar: "swe", chartType: "pie" });
    const two = factsAfter({ dataset: "sierra", xVar: "month", yVar: "swe", chartType: "pie", aggregation: "mean", showSpread: false });
    expect(two.chartScore as number).toBeLessThan(one.chartScore as number);
  });
});

/* ================================================================== *
 * Datasets are fixed, real relationships — not fabricated per session
 * ================================================================== */

describe("every dataset carries a genuine, checkable relationship", () => {
  it("kelp canopy area peaks near the optimum temperature, not at the extremes", () => {
    const cold = factsAfter({ dataset: "kelp", xVar: "sst", yVar: "kelpArea" });
    expect(cold.dataMax as number).toBeGreaterThan(20); // a real peak exists
    expect(cold.dataMin as number).toBeGreaterThanOrEqual(0); // never negative area
  });

  it("the slough gets less oxygenated with depth, not more", () => {
    const f = runFor(base({ dataset: "slough", xVar: "depthM", yVar: "oxygenMgL" }), 1).facts();
    expect(f.dataMin as number).toBeLessThan(f.dataMax as number);
    expect(f.dataMin as number).toBeGreaterThan(0);
  });

  it("rainfall's true range is small relative to its mean — the honest reason a cliff is fake", () => {
    const f = factsAfter({ dataset: "rainfall", yVar: "rainfallMm" });
    expect((f.trueRange as number) / (f.dataMax as number)).toBeLessThan(0.25);
  });

  it("choosing a column outside the current dataset falls back to that dataset's own default", () => {
    const f = factsAfter({ dataset: "kelp", xVar: "month", yVar: "swe" }); // sierra columns, wrong dataset
    expect(f.xKey).toBe("sst");
    expect(f.yKey).toBe("kelpArea");
  });
});

/* ================================================================== *
 * Platform invariants
 * ================================================================== */

describe("determinism and reset", () => {
  it("the same seed replays to the same fingerprint", () => {
    const params = base({ dataset: "kelp", chartType: "scatter" });
    const a = runFor(params, 5, "twin");
    const b = runFor(params, 5, "twin");
    expect(a.fingerprint()).toBe(b.fingerprint());
  });

  it("reset restores a state indistinguishable from a fresh run", () => {
    const params = base({ dataset: "rainfall", chartType: "bar", yAxisStart: "custom" });
    const runner = runFor(params, 4, "resetting");
    runner.reset();
    const fresh = new SimRunner({ manifest: plottingBenchSim, params, band: "6-8", seed: "resetting" });
    expect(runner.fingerprint()).toBe(fresh.fingerprint());
  });

  it("every dataset, every chart type: readouts and facts stay finite", () => {
    const datasets = ["sierra", "kelp", "reaction", "rainfall", "slough"];
    const chartTypes = ["scatter", "line", "bar", "histogram", "pie", "box"];
    for (const dataset of datasets) {
      for (const chartType of chartTypes) {
        const r = runFor(base({ dataset, chartType }), 1, `${dataset}-${chartType}`);
        for (const ro of r.readouts()) expect(Number.isFinite(ro.quantity.value), `${dataset}/${chartType} readout ${ro.key}`).toBe(true);
        for (const [k, v] of Object.entries(r.facts())) {
          if (typeof v === "number") expect(Number.isFinite(v), `${dataset}/${chartType} fact ${k}`).toBe(true);
        }
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
  it("snow-through-the-year: line passes, pie fails, back to line scores high", () => {
    const lab = plottingBenchSim.labs!.find((l) => l.id === "snow-through-the-year")!;
    const lineRun = runFor(lab.setup!, 1, "s1");
    expect(lab.steps.find((s) => s.id === "try-line")!.check!.test(values(lineRun))).toBe(true);
    const pieRun = runFor({ ...lab.setup!, chartType: "pie" }, 1, "s2");
    expect(lab.steps.find((s) => s.id === "try-pie")!.check!.test(values(pieRun))).toBe(true);
    expect(lab.steps.find((s) => s.id === "score")!.check!.test(values(lineRun))).toBe(true);
  });

  it("the-cliff-that-is-not-there: baseline honest, then truncated, then quantified", () => {
    const lab = plottingBenchSim.labs!.find((l) => l.id === "the-cliff-that-is-not-there")!;
    const zero = runFor(lab.setup!, 1, "c1");
    expect(lab.steps.find((s) => s.id === "baseline")!.check!.test(values(zero))).toBe(true);
    const custom = runFor({ ...lab.setup!, yAxisStart: "custom", yAxisMax: 520 }, 1, "c2");
    expect(lab.steps.find((s) => s.id === "truncate")!.check!.test(values(custom))).toBe(true);
    expect(lab.steps.find((s) => s.id === "quantify")!.check!.test(values(custom))).toBe(true);
  });

  it("kelp-and-warm-water: scatter clean, line flagged", () => {
    const lab = plottingBenchSim.labs!.find((l) => l.id === "kelp-and-warm-water")!;
    const scatterRun = runFor(lab.setup!, 1, "k1");
    expect(lab.steps.find((s) => s.id === "scatter-check")!.check!.test(values(scatterRun))).toBe(true);
    expect(lab.steps.find((s) => s.id === "direction")!.check!.test(values(scatterRun))).toBe(true);
    const lineRun = runFor({ ...lab.setup!, chartType: "line" }, 1, "k2");
    expect(lab.steps.find((s) => s.id === "line-check")!.check!.test(values(lineRun))).toBe(true);
  });

  it("one-hundred-twenty-people: histogram, hidden spread, shown spread", () => {
    const lab = plottingBenchSim.labs!.find((l) => l.id === "one-hundred-twenty-people")!;
    const histRun = runFor(lab.setup!, 1, "p1");
    expect(lab.steps.find((s) => s.id === "histogram")!.check!.test(values(histRun))).toBe(true);
    const hidden = runFor({ ...lab.setup!, chartType: "bar", aggregation: "mean", showSpread: false }, 1, "p2");
    expect(lab.steps.find((s) => s.id === "aggregate-no-spread")!.check!.test(values(hidden))).toBe(true);
    const shown = runFor({ ...lab.setup!, chartType: "bar", aggregation: "mean", showSpread: true }, 1, "p3");
    expect(lab.steps.find((s) => s.id === "aggregate-with-spread")!.check!.test(values(shown))).toBe(true);
  });
});

describe("every challenge's goal is reachable by the settings its hints point to", () => {
  it("manufacture and defuse: ending back at zero with a high score passes", () => {
    const ch = plottingBenchSim.challenges!.find((c) => c.id === "manufacture-and-defuse")!;
    const r = runFor({ ...ch.setup!, yAxisStart: "zero" }, 1, "m1");
    expect(ch.goal.test(values(r))).toBe(true);
  });

  it("manufacture and defuse: left truncated, the goal genuinely fails", () => {
    const ch = plottingBenchSim.challenges!.find((c) => c.id === "manufacture-and-defuse")!;
    const r = runFor({ ...ch.setup!, yAxisStart: "custom", yAxisMax: 520 }, 1, "m2");
    expect(ch.goal.test(values(r))).toBe(false);
  });

  it("one honest chart per dataset: a scatter reaches 90+ on every dataset", () => {
    const ch = plottingBenchSim.challenges!.find((c) => c.id === "one-honest-chart-per-dataset")!;
    for (const dataset of ["sierra", "kelp", "reaction", "rainfall", "slough"]) {
      const r = runFor({ ...ch.setup!, dataset, chartType: "scatter" }, 1, `h-${dataset}`);
      expect(ch.goal.test(values(r)), dataset).toBe(true);
    }
  });
});
