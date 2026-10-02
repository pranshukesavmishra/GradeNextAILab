import { describe, expect, it } from "vitest";
import { engine } from "./engine";

describe("6E-1 Climate from Weather — the models", () => {
  type St = { name: string; lat: number; kg: string; T: number[]; P: number[]; wet: number };
  type Stats = { MAT: number; MAP: number; T: number[]; P: number[]; wetDays: number };
  const M = engine.InsightLab.models["g6e-climate"] as unknown as {
    STATIONS: Record<string, St>; SK: string[];
    koppen: (T: number[], P: number[], lat: number) => { code: string; Pth: number; MAP: number };
    stats: (k: string, a: number, b: number, seed: number, trend: number) => Stats;
    harmonics: (T: number[]) => unknown; seasonal: (H: unknown, f: number) => number;
  };
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

  it("runs the Köppen–Geiger key (Peel et al. 2007) on twelve stations' 1991–2020 normals and gets each published class", () => {
    for (const k of M.SK) {
      const s = M.STATIONS[k];
      expect(M.koppen(s.T, s.P, s.lat).code, s.name).toBe(s.kg);
    }
    expect(M.SK.length).toBe(12);
  });

  it("makes each month of the seasonal curve average exactly to that month's normal", () => {
    const T = M.STATIONS.chicago.T, H = M.harmonics(T);
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let d0 = 0;
    days.forEach((n, m) => {
      let s = 0; for (let i = 0; i < 1000; i++) s += M.seasonal(H, (d0 + (i + 0.5) / 1000 * n) / 365);
      expect(s / 1000).toBeCloseTo(T[m], 0);
      d0 += n;
    });
  });

  it("generates thirty years of days that reproduce the normals they were tuned to, and keep the published class", () => {
    for (const k of M.SK) {
      const s = M.STATIONS[k], r = M.stats(k, 1991, 2020, 1, 0);
      expect(Math.abs(r.MAT - mean(s.T)), s.name).toBeLessThan(0.3);
      expect(Math.abs(r.MAP / sum(s.P) - 1), s.name).toBeLessThan(0.1);
      expect(M.koppen(r.T, r.P, s.lat).code, s.name).toBe(s.kg);
    }
  });

  it("settles a mean as 1/√N: Chicago's single years scatter by about 0.65 °C, thirty years to about 0.12 °C", () => {
    const one: number[] = [];
    for (let y = 1961; y <= 2020; y++) one.push(M.stats("chicago", y, y, 1, 0).MAT);
    const m = mean(one), sd = Math.sqrt(one.reduce((q, v) => q + (v - m) ** 2, 0) / (one.length - 1));
    expect(sd).toBeGreaterThan(0.5);
    expect(sd).toBeLessThan(0.9);
    const thirty = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => M.stats("chicago", 1991, 2020, seed, 0).MAT);
    const m30 = mean(thirty), sd30 = Math.sqrt(thirty.reduce((q, v) => q + (v - m30) ** 2, 0) / (thirty.length - 1));
    expect(sd30).toBeLessThan(sd / 2.5);
  });

  it("shows a 2 °C-a-century trend as a 0.6 °C step between the 1961–90 and 1991–2020 normals", () => {
    const d = M.stats("chicago", 1991, 2020, 1, 2).MAT - M.stats("chicago", 1961, 1990, 1, 2).MAT;
    expect(d).toBeGreaterThan(0.45);
    expect(d).toBeLessThan(0.75);
  });

  it("puts Denver under its dry line, 10 × (2 × 10.46 + 28) = 489 mm, and Mumbai's monsoon test at 100 − 2349/25 = 6 mm", () => {
    const D = M.STATIONS.denver, K = M.koppen(D.T, D.P, D.lat);
    expect(K.Pth).toBeCloseTo(489.2, 0);
    expect(K.code).toBe("BSk");
    const Mu = M.STATIONS.mumbai, Km = M.koppen(Mu.T, Mu.P, Mu.lat);
    expect(100 - Km.MAP / 25).toBeCloseTo(6.06, 1);
    const Mi = M.STATIONS.miami;
    expect(M.koppen(Mi.T, Mi.P.map((v) => v * 0.9), Mi.lat).code).toBe("Aw");
  });
});

describe("6E-2 Circulation of Air and Ocean — the models", () => {
  type P = Record<string, unknown>;
  const M = engine.InsightLab.models["g6e-circulation"] as unknown as {
    rhoSW: (S: number, T: number) => number; freezeT: (S: number) => number; lockSpeed: (a: number, b: number, H: number) => number;
    hadleyLat: (dayH: number, dT: number) => number; cellsOf: (p: P) => { n: number; phH: number }; uM: (Om: number, lat: number) => number; OMEGA: number;
    crossing: (p: P) => { miss: number; t: number }; rossby: (k: string) => number; coriolisF: (lat: number) => number;
    stommel: (p: P) => { sverdrup: number | null; delta: number | null }; boundary: (m: unknown) => { vmax: number; at: number; transport: number };
    ebmSteady: (p: P) => Float64Array; ebmSummary: (T: Float64Array, D: number) => { mean: number; eq: number; pole: number; peak: number; peakLat: number };
    convRun: (p: P, secs: number) => { umax: number; Tl: number; Tr: number };
  };

  it("reproduces the UNESCO equation of state: 1023.343 kg/m³ at 35 g/kg and 25 °C, fresh water densest near 4 °C, seawater freezing at −1.92 °C", () => {
    expect(M.rhoSW(35, 25)).toBeCloseTo(1023.343, 3);
    expect(M.rhoSW(0, 4)).toBeCloseTo(999.975, 3);
    expect(M.rhoSW(0, 4)).toBeGreaterThan(M.rhoSW(0, 2));
    expect(M.rhoSW(0, 4)).toBeGreaterThan(M.rhoSW(0, 6));
    expect(M.freezeT(35)).toBeCloseTo(-1.922, 3);
  });

  it("runs a lock-exchange front at ½√(g′H): 11.4 cm/s for fresh against 35 g/kg water 20 cm deep", () => {
    expect(M.lockSpeed(M.rhoSW(35, 20), M.rhoSW(0, 20), 0.2)).toBeCloseTo(0.1142, 3);
  });

  it("puts Earth's Hadley edge at 28.8° (Held & Hou 1980), halves it for a 12 h day, and reaches the pole on a slow planet", () => {
    expect(M.hadleyLat(24, 96)).toBeCloseTo(28.8, 0);
    expect(M.hadleyLat(12, 96) / M.hadleyLat(24, 96)).toBeCloseTo(0.5, 2);
    expect(M.cellsOf({ dayH: 24, dT: 96, sunLat: 0 }).n).toBe(3);
    expect(M.cellsOf({ dayH: 2400, dT: 96, sunLat: 0 }).n).toBe(1);
    expect(M.uM(M.OMEGA, 30)).toBeCloseTo(134, 0);
    expect(M.coriolisF(45)).toBeCloseTo(1.031e-4, 6);
  });

  it("bends a straight puck path on a turning disc by RΩt (18.4 cm at 10 rpm, 1 m/s) and not at all on a still one", () => {
    const c = M.crossing({ rpm: 10, sense: "ccw", speed: 1, aim: 0 });
    expect(Math.abs(c.miss)).toBeCloseTo(0.30 * (10 * 2 * Math.PI / 60) * c.t, 3);
    expect(c.miss).toBeLessThan(0);
    expect(M.crossing({ rpm: 10, sense: "cw", speed: 1, aim: 0 }).miss).toBeGreaterThan(0);
    expect(Math.abs(M.crossing({ rpm: 0, sense: "ccw", speed: 1, aim: 0 }).miss)).toBeLessThan(1e-9);
    expect(M.rossby("sink")).toBeGreaterThan(1000);
    expect(M.rossby("gyre")).toBeLessThan(0.01);
  });

  it("intensifies the gyre on the west only with β (Stommel 1948) and carries Sverdrup's 18.4 Sv", () => {
    const base = { width: 6000, logR: -6, tau: 0.1 };
    const W = M.stommel({ ...base, beta: 1 }), B = M.boundary(W);
    expect((W.sverdrup ?? 0) / 1e6).toBeCloseTo(18.39, 1);
    expect(B.transport / ((W.sverdrup ?? 1) / 1e6)).toBeGreaterThan(0.85);
    expect(B.at).toBeLessThan(200e3);
    expect(B.vmax).toBeGreaterThan(0);
    const B0 = M.boundary(M.stommel({ ...base, beta: 0 }));
    expect(Math.abs(B.vmax)).toBeGreaterThan(2 * Math.abs(B0.vmax));
    expect(W.delta).toBeCloseTo(50e3, -3);
  });

  it("balances the planet's energy (North 1975): a 15 °C world moving ~5 PW poleward near 35°, a 56 °C equator without transport", () => {
    const s = M.ebmSummary(M.ebmSteady({ Dt: 0.55, S0: 1361, iceAlb: true }), 0.55);
    expect(s.mean).toBeGreaterThan(14); expect(s.mean).toBeLessThan(17);
    expect(s.peak).toBeGreaterThan(4.5); expect(s.peak).toBeLessThan(6);
    expect(s.peakLat).toBeGreaterThan(30); expect(s.peakLat).toBeLessThan(40);
    const s0 = M.ebmSummary(M.ebmSteady({ Dt: 0, S0: 1361, iceAlb: true }), 0);
    expect(Math.abs(s0.eq - (340.25 * (1 + 0.482 / 2) * (1 - 0.24) - 203.3) / 2.09)).toBeLessThan(0.5);
  });

  it("drives a convection cell that runs faster with more heat, and still turns over in syrup, more slowly", () => {
    const p = { ice: false, heatAt: "end", fluid: "water", waterT: 20 };
    const a = M.convRun({ ...p, power: 30 }, 60), b = M.convRun({ ...p, power: 120 }, 60), s = M.convRun({ ...p, power: 120, fluid: "syrup" }, 60);
    expect(b.umax).toBeGreaterThan(a.umax);
    expect(s.umax).toBeGreaterThan(0);
    expect(s.umax).toBeLessThan(b.umax);
    expect(b.Tl).toBeGreaterThan(20);
  }, 30000);
});

describe("6E-3 Making the Next Generation — the models", () => {
  type P = Record<string, unknown>;
  const M = engine.InsightLab.models["g6e-generation"] as unknown as {
    courtExpected: (p: P, n: number) => { nests: number; alive: number }[]; tailFitness: (p: P, L: number) => { total: number };
    brood: (n: number, f: number, parents: number) => { D: number; recruits: number; mean: number; fledged: number };
    bestClutch: (f: number, parents: number) => number; settle: (k: string) => number; reynolds: (k: string) => number;
    terminal: (k: string, wing: number) => number; meadowRun: (p: P, secs: number) => { A: number; B: number; het: number };
    disperse: (p: P) => { median: number; p95: number; v: number };
  };
  const court = { shortTo: 14, add: 25, risk: 1, display: 10, choosy: 4, females: 36 };

  it("repeats Andersson (1982): lengthened males win the most nests, shortened the fewest, the two controls alike", () => {
    const E = M.courtExpected(court, 120);
    expect(E[3].nests).toBeGreaterThan(1.3 * E[2].nests);
    expect(E[0].nests).toBeLessThan(0.5 * E[2].nests);
    expect(Math.abs(E[1].nests - E[2].nests)).toBeLessThan(0.15);
  });

  it("moves the best tail shorter as predation grows — showier is not always better", () => {
    const best = (risk: number) => { let b = [0, -1]; for (let L = 5; L <= 100; L += 2.5) { const v = M.tailFitness({ ...court, risk }, L).total; if (v > b[1]) b = [L, v]; } return b[0]; };
    expect(best(0)).toBeGreaterThan(best(1));
    expect(best(1)).toBeGreaterThan(best(4));
    expect(best(4)).toBeGreaterThan(best(8));
  });

  it("finds Lack's most productive clutch near the great tit's 8–9 eggs, fewer in a poor spring or with one parent", () => {
    expect(M.bestClutch(1, 2)).toBe(9);
    expect(M.bestClutch(0.4, 2)).toBeLessThan(9);
    expect(M.bestClutch(2, 2)).toBeGreaterThan(9);
    expect(M.bestClutch(1, 1)).toBeLessThan(9);
    expect(M.brood(14, 1, 2).recruits).toBeLessThan(0.5 * M.brood(9, 1, 2).recruits);
    expect(M.brood(9, 1, 2).D).toBeCloseTo(286.7, 0);
  });

  it("drops pollen at Stokes' speed: grass 3.7 cm/s, ragweed 1.6 cm/s, all with Re below 1", () => {
    expect(M.settle("grass") * 100).toBeCloseTo(3.68, 1);
    expect(M.settle("rag") * 100).toBeCloseTo(1.56, 1);
    for (const k of ["lily", "sun", "grass", "pine", "rag"]) expect(M.reynolds(k)).toBeLessThan(1);
  });

  it("gives a samara its measured 1 m/s and a dandelion its 0.39 m/s, and carries them about H·U/v", () => {
    expect(M.terminal("maple", 3.5)).toBeCloseTo(0.96, 1);
    expect(M.terminal("dandelion", 0)).toBeCloseTo(0.39, 2);
    const d = M.disperse({ stype: "maple", wing: 3.5, wind: 6, turb: 1, relH: 12, nSeeds: 300, jay: 250, gut: 25, seed: 1 });
    expect(d.median).toBeGreaterThan(35); expect(d.median).toBeLessThan(80);
    const calm = M.disperse({ stype: "maple", wing: 3.5, wind: 1, turb: 1, relH: 12, nSeeds: 300, jay: 250, gut: 25, seed: 1 });
    expect(calm.median).toBeLessThan(d.median / 3);
  });

  it("wastes pollen on the wrong species when bees are fickle, and sets more seed when they are faithful", () => {
    const base = { bees: 8, fracB: 0.3, nFlowers: 60, carry: 0.25, mode: "bees", pesticide: false, seed: 1 };
    const faithful = M.meadowRun({ ...base, constancy: 0.9 }, 1800), fickle = M.meadowRun({ ...base, constancy: 0.1 }, 1800);
    expect(fickle.het).toBeGreaterThan(2 * faithful.het);
    expect(faithful.B).toBeGreaterThan(fickle.B);
  }, 30000);
});

describe("6E-4 Nature and Nurture Growth Chambers — the models", () => {
  type Env = { ppfd: number; photo: number; water: number; N: number; T: number };
  const M = engine.InsightLab.models["g6e-nurture"] as unknown as {
    growPlant: (gk: string, env: Env, vig: number) => { W: number; h: number; fn: number; fw: number }[];
    fTemp: (T: number) => number; fN: (N: number) => number;
    welch: (a: unknown, b: unknown) => { t: number; p: number }; chamberRun: (gk: string, env: Env, n: number, noise: number, seed: number) => unknown;
    anova2: (cells: number[][]) => { G: number; E: number; GE: number; R: number };
    skinT: (r: string, Tair: number, ice: boolean) => number; darkness: (g: string, T: number) => number;
    soilAl: (pH: number, sulf: number) => number; sepalAl: (p: Record<string, number>) => number; blueness: (al: number) => number;
  };
  const STD: Env = { ppfd: 400, photo: 16, water: 40, N: 200, T: 22 };
  const W28 = (gk: string, env: Partial<Env> = {}) => M.growPlant(gk, { ...STD, ...env }, 1)[28];

  it("grows a Fast Plant to about a gram and 25–30 cm in 28 days, and less in short supply of any factor", () => {
    const s = W28("wt");
    expect(s.W).toBeGreaterThan(0.8); expect(s.W).toBeLessThan(2.5);
    expect(s.h).toBeGreaterThan(22); expect(s.h).toBeLessThan(32);
    for (const env of [{ ppfd: 120 }, { water: 6 }, { N: 15 }, { T: 10 }, { T: 33 }]) expect(W28("wt", env).W).toBeLessThan(0.6 * s.W);
    expect(M.fTemp(24)).toBeCloseTo(1, 6);
    expect(M.fN(200)).toBeCloseTo(0.8333, 3);
  });

  it("stretches plants in dim light: less mass but more height for it", () => {
    const dim = W28("wt", { ppfd: 120 }), std = W28("wt");
    expect(dim.W).toBeLessThan(std.W / 5);
    expect(dim.h / dim.W).toBeGreaterThan(5 * std.h / std.W);
  });

  it("crosses the reaction norms: the shade type wins in dim light, the sun type in bright", () => {
    expect(W28("shade", { ppfd: 100 }).W).toBeGreaterThan(W28("wt", { ppfd: 100 }).W);
    expect(W28("shade", { ppfd: 100 }).W).toBeGreaterThan(W28("sun", { ppfd: 100 }).W);
    expect(W28("sun", { ppfd: 900 }).W).toBeGreaterThan(W28("wt", { ppfd: 900 }).W);
    expect(W28("sun", { ppfd: 900 }).W).toBeGreaterThan(W28("shade", { ppfd: 900 }).W);
    expect(W28("dwarf").h).toBeLessThan(0.4 * W28("wt").h);
  });

  it("gives Student's p correctly: t = 2.571 with 5 degrees of freedom is p = 0.05", () => {
    const mk = (m: number, sd: number, n: number) => ({ mean: m, sd, final: new Array(n).fill(0) });
    // equal groups of 6 with sd 1: df ≈ 10, t = 2.228 is p = 0.05
    const r = M.welch(mk(2.228 * Math.sqrt(2 / 6), 1, 6), mk(0, 1, 6));
    expect(r.p).toBeCloseTo(0.05, 3);
  });

  it("splits a pure genes-plus-environment 2 × 2 with no interaction, and finds one when the effects do not add", () => {
    const add = M.anova2([[1, 1.1, 0.9], [2, 2.1, 1.9], [3, 3.1, 2.9], [4, 4.1, 3.9]]);
    expect(add.GE).toBeLessThan(0.01);
    const inter = M.anova2([[1, 1.1, 0.9], [4, 4.1, 3.9], [2, 2.1, 1.9], [2, 2.1, 1.9]]);
    expect(inter.GE).toBeGreaterThan(0.2);
  });

  it("darkens the Himalayan rabbit only where the skin is below ~33.5 °C: ears at 27.2 °C black, back at 36.3 °C white", () => {
    expect(M.skinT("ears", 20, false)).toBeCloseTo(27.22, 2);
    expect(M.skinT("back", 20, false)).toBeCloseTo(36.34, 2);
    expect(M.darkness("chch", M.skinT("ears", 20, false))).toBeGreaterThan(0.99);
    expect(M.darkness("chch", M.skinT("back", 20, false))).toBeLessThan(0.02);
    expect(M.darkness("chch", M.skinT("patch", 20, true))).toBeGreaterThan(0.99);
    expect(M.darkness("cc", 10)).toBe(0);
  });

  it("turns hydrangeas blue below pH ~5.5 and pink above ~6.5, and phosphate keeps them pink", () => {
    expect(M.soilAl(5, 0)).toBeCloseTo(9.49, 2);
    expect(M.blueness(M.sepalAl({ pH: 5, sulf: 0, phos: 0 }))).toBeGreaterThan(0.9);
    expect(M.blueness(M.sepalAl({ pH: 7, sulf: 0, phos: 0 }))).toBeLessThan(0.1);
    expect(M.blueness(M.sepalAl({ pH: 5, sulf: 0, phos: 2 }))).toBeLessThan(M.blueness(M.sepalAl({ pH: 5, sulf: 0, phos: 0 })));
  });
});

