import { describe, expect, it } from "vitest";
import { engine } from "./engine";

type F = (...a: never[]) => unknown;
const model = (id: string) => engine.InsightLab.models[id] as unknown as Record<string, F & ((...a: unknown[]) => number)> & Record<string, unknown>;

describe("7A-1 The Particle Detective — the models", () => {
  const M = model("g7a-particle-detective") as unknown as {
    eta: (T: number, w?: number) => number; Dink: (T: number) => number; inkRadius: (t: number, m: number, T: number) => number;
    Dfuller: (T: number, p: number) => number; vbar: (T: number, M: number) => number; jarHalfTime: (T: number, p: number) => number;
    mixOf: (pair: string, a: number, b: number) => { V: number; m: number; rho: number }; rhoEW: (w: number) => number;
    Dgrain: (T: number, r: number, w: number) => number; perrinTracks: (...a: number[]) => number[]; meanSq: (a: number[]) => number;
    avogadroFromTracks: (...a: number[]) => number; scaleHeight: (T: number, r: number) => number;
    settleCounts: (...a: number[]) => number[]; avogadroFromCounts: (c: number[], T: number, r: number) => { H: number; NA: number };
    current: (V: number, c: number) => number; gasVol: (mol: number, T: number) => number; molarVol: (T: number) => number; kappa: (c: number) => number;
    monoThick: (k: string) => number; film: (p: Record<string, unknown>) => { d: number; h: number; A: number };
  };

  it("has water's viscosity from Cheng (2008): 1.005 mPa·s at 20 °C, 0.356 at 80 °C; 50 % glycerol 6.0", () => {
    expect(M.eta(20) * 1000).toBeCloseTo(1.005, 3);
    expect(M.eta(80) * 1000).toBeCloseTo(0.356, 3);
    expect(M.eta(20, 0.5) * 1000).toBeCloseTo(6.0, 1);
  });

  it("spreads permanganate with D = 1.632 × 10⁻⁹ m²/s at 25 °C, 3.4 times faster at 80 °C than at 20 °C", () => {
    expect(M.Dink(25)).toBeCloseTo(1.632e-9, 12);
    expect(M.Dink(80) / M.Dink(20)).toBeCloseTo(3.40, 2);
    // the visible cloud grows, then fades
    expect(M.inkRadius(3600, 5e-6, 20)).toBeGreaterThan(M.inkRadius(600, 5e-6, 20));
    expect(M.inkRadius(200 * 86400, 5e-6, 20)).toBe(0);
  });

  it("gives bromine in air D = 0.091 cm²/s (Fuller) and a mean speed of 197 m/s; halving the air halves the time", () => {
    expect(M.Dfuller(20, 1) * 1e4).toBeCloseTo(0.0911, 4);
    expect(M.vbar(20, 0.159808)).toBeCloseTo(197.1, 1);
    const t1 = M.jarHalfTime(20, 1), t2 = M.jarHalfTime(20, 0.5);
    expect(t1 / 60).toBeGreaterThan(14); expect(t1 / 60).toBeLessThan(17);
    expect(t2 / t1).toBeCloseTo(0.5, 2);
    expect(M.jarHalfTime(20, 1e-5)).toBeLessThan(0.05);
  });

  it("mixes 50 mL ethanol and 50 mL water into 96.5 mL (CRC densities), keeping the mass; water + water stays 100", () => {
    const m = M.mixOf("ethanol", 50, 50);
    expect(m.V).toBeCloseTo(96.47, 1);
    expect(m.m).toBeCloseTo(50 * 0.78934 + 50 * 0.9982, 6);
    expect(M.rhoEW(0.5)).toBeCloseTo(0.91384, 5);
    expect(M.mixOf("water", 50, 50).V).toBe(100);
    expect(M.mixOf("beads", 60, 30).V).toBeCloseTo(67.2, 6);
  });

  it("recovers Avogadro's number from Perrin's grains both ways: tracks and settling", () => {
    const d = M.perrinTracks(4097, 40, 40, 30, 17, 0.367, 0);
    const NA = M.avogadroFromTracks(M.meanSq(d), 30, 17, 0.367, 0);
    expect(Math.abs(NA / 6.02214076e23 - 1)).toBeLessThan(0.06);
    expect(M.scaleHeight(17, 0.212) * 1e6 * Math.LN2).toBeCloseTo(36.3, 0);
    const c = M.settleCounts(3, 17, 0.212, 40, 30);
    expect(Math.abs(M.avogadroFromCounts(c, 17, 0.212).NA / 6.02214076e23 - 1)).toBeLessThan(0.08);
  });

  it("splits water by Faraday's law: 12 V on 0.5 M sodium sulfate gives 0.117 A and 9.0 mL of H₂ in 10 minutes", () => {
    expect(M.kappa(0.5)).toBeCloseTo(6.5, 1);
    const I = M.current(12, 0.5);
    expect(I).toBeCloseTo(0.1174, 4);
    expect(M.gasVol((I * 600) / (2 * 96485.33212), 20)).toBeCloseTo(9.0, 1);
    expect(M.current(1.5, 0.5)).toBe(0);
    expect(M.current(20, 0)).toBeLessThan(1e-6);
    expect(M.molarVol(20)).toBeCloseTo(24.62, 1);
  });

  it("measures an oleic acid molecule: a monolayer 1.14 nm thick; 1 drop of 1:1000 covers 175 cm²", () => {
    expect(M.monoThick("oleic") * 1e9).toBeCloseTo(1.14, 2);
    const f = M.film({ oil: "oleic", ldil: 3, drops: 1, dpm: 50, tray: "tray" });
    expect(f.A * 1e4).toBeCloseTo(175.6, 0);
    expect(f.d * 100).toBeCloseTo(14.95, 1);
  });
});
