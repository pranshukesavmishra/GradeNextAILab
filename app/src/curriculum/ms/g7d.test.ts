import { describe, expect, it } from "vitest";
import { engine } from "./engine";

type P = Record<string, unknown>;

describe("7D-1 Populations and Limits — the models", () => {
  const M = engine.InsightLab.models["g7d-populations"] as unknown as {
    BASE: () => P;
    lemCeil: (p: P) => { N: number; P: number; S: number };
    lemRun: (p: P, days: number) => { F: number; N: number; P: number };
    kAlone: (k: string, p: P, H?: number) => number;
    culRun: (p: P, names: string[], N0: number[], days: number, H?: number) => { N: number[] };
    rStar: (k: string, T: number) => number;
    exclusionDay: (p: P) => number;
    growthAt: (k: string, p: P, N: number, H?: number) => number;
    dataset: (p: P) => { pts: number[][] };
    bestFit: (D: { pts: number[][] }) => { K: number; r: number; rms: number };
    reinRun: (p: P, y: number) => { hist: number[][] };
    sustainable: (p: P) => number;
    SPEC: Record<string, { mu: number; m: number; h: number }>;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });
  const cul = (o: P) => p({ setup: "capacity", temp: 26, ...o });

  it("stops the duckweed at the scarcest resource (Liebig): N, P or space, whichever allows fewest", () => {
    const base = p({ nit: 2, phos: 0.5, dia: 12, vol: 1, start: 10 });
    expect(M.lemCeil(base).N).toBeCloseTo(510, 6);
    expect(M.lemRun(base, 60).F).toBeCloseTo(510, 0);
    // more phosphate changes nothing while nitrogen is short
    expect(M.lemRun(p({ nit: 2, phos: 2 }), 60).F).toBeCloseTo(510, 0);
    // plenty of both: the 10 cm jar's surface (π·5² ÷ 0.09 cm² = 873 fronds) is the ceiling
    const roomy = p({ nit: 15, phos: 2, dia: 10 });
    expect(M.lemCeil(roomy).S).toBeCloseTo(872.66, 1);
    expect(M.lemRun(roomy, 80).F / 872.66).toBeGreaterThan(0.97);
    // light and warmth set the pace, not the ceiling
    expect(M.lemRun(p({ nit: 15, phos: 2, lampH: 55 }), 40).F).toBeLessThan(M.lemRun(p({ nit: 15, phos: 2, lampH: 15 }), 40).F);
    expect(M.lemRun(p({ nit: 2, lampH: 55 }), 400).F).toBeCloseTo(510, 0);
  });

  it("grows Gause's Paramecium at his measured r and to his K: P. aurelia 1.124/day to 105, P. caudatum 0.794/day to 64", () => {
    const g = (k: string) => M.growthAt(k, cul({}), 1e-6) / 1e-6;
    expect(g("aurelia")).toBeCloseTo(1.124, 3);
    expect(g("caudatum")).toBeCloseTo(0.794, 3);
    expect(M.kAlone("aurelia", cul({}))).toBeCloseTo(105, 6);
    expect(M.kAlone("caudatum", cul({}))).toBeCloseTo(64, 6);
    expect(M.culRun(cul({}), ["aurelia"], [2], 24).N[0]).toBeCloseTo(105, 0);
  });

  it("makes K a property of the food: twice the food nearly doubles it, half the food on day 10 halves it", () => {
    expect(M.kAlone("caudatum", cul({ food: 2 })) / 64).toBeCloseTo(58.283 / 28.283, 2);
    expect(M.culRun(cul({ cut: 10 }), ["aurelia"], [2], 40).N[0]).toBeCloseTo(51.04, 1);
    // growth per day is largest part-way up: at K/2 for a logistic, at about 0.35 K here, where food runs short sooner
    const pts = Array.from({ length: 101 }, (_, i) => [i * 1.05, M.growthAt("aurelia", cul({}), i * 1.05)]);
    const top = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
    expect(top[0] / 105).toBeGreaterThan(0.3);
    expect(top[0] / 105).toBeLessThan(0.6);
  });

  it("excludes P. caudatum when it shares bacteria with P. aurelia (Gause 1934), and lets P. bursaria share when it has yeast", () => {
    expect(M.rStar("aurelia", 26)).toBeLessThan(M.rStar("caudatum", 26));
    const day = M.exclusionDay(p({ setup: "competition", pair: "ac", temp: 26 }));
    expect(day).toBeGreaterThanOrEqual(14);
    expect(day).toBeLessThanOrEqual(25);
    expect(M.exclusionDay(p({ setup: "competition", pair: "cb", settle: 0.5, temp: 26 }))).toBe(Infinity);
    const both = M.culRun(p({ setup: "competition", pair: "cb", settle: 0.5, temp: 26 }), ["caudatum", "bursaria"], [2, 2], 60).N;
    expect(both[0]).toBeGreaterThan(10);
    expect(both[1]).toBeGreaterThan(10);
  });

  it("fits Carlson's yeast as Pearl did (K ≈ 665, r ≈ 0.54 an hour) and cannot fit the reindeer crash", () => {
    const y = M.bestFit(M.dataset(p({ dset: "yeast" })));
    expect(Math.abs(y.K - 665) / 665).toBeLessThan(0.01);
    expect(Math.abs(y.r - 0.5355) / 0.5355).toBeLessThan(0.02);
    expect(y.rms).toBeLessThan(5);
    expect(M.bestFit(M.dataset(p({ dset: "reindeer" }))).rms).toBeGreaterThan(1000);
  });

  it("reproduces the St Matthew Island reindeer (Klein 1968): 29 in 1944, ≈1 350 in 1957, ≈6 000 in 1963, 42 in 1966", () => {
    const H = M.reinRun(p({ setup: "scarcity" }), 1970).hist, at = (y: number) => H.find((q) => q[0] === y)![1];
    expect(at(1944)).toBe(29);
    expect(Math.abs(at(1957) - 1350) / 1350).toBeLessThan(0.1);
    expect(Math.abs(at(1963) - 6000) / 6000).toBeLessThan(0.15);
    expect(at(1966)).toBeGreaterThan(20);
    expect(at(1966)).toBeLessThan(70);
    // the bulls starved first: almost none left to father calves
    expect(H.find((q) => q[0] === 1966)![4]).toBeLessThan(1);
    // without the hard winter the crash only comes later
    const soft = M.reinRun(p({ setup: "scarcity", snowK: 100 }), 1970).hist;
    expect(soft.find((q) => q[0] === 1970)![1]).toBeLessThan(200);
    expect(M.sustainable(p({ setup: "scarcity" }))).toBeCloseTo(358.56, 1);
  });
});
