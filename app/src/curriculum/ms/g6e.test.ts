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
