import { describe, expect, it } from "vitest";
import { engine } from "./engine";

type P = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...a: any[]) => any;

describe("6F-1 Earth's Energy Balance — the models", () => {
  const M = engine.InsightLab.models["g6f-energy-balance"] as unknown as Record<string, Fn> & { EG0: () => number };
  const today: P = { S0: 1361, cloud: 0.67, ice: 0.06, land: "today", co2: 280, air: "today", wv: true, mix: 70 };

  it("reproduces CERES's planet: albedo 0.29, clear-sky 0.15, cloud effect −48 in sunlight and +28 in heat", () => {
    const f = M.fluxes(today, 287);
    expect(f.A.ap).toBeCloseTo(0.29, 2);
    expect(f.A.clr).toBeCloseTo(0.15, 2);
    expect(f.asr).toBeGreaterThan(239);
    expect(f.asr).toBeLessThan(244);
    expect(f.cloudSW).toBeGreaterThan(-50);
    expect(f.cloudSW).toBeLessThan(-45);
    expect(f.cloudLW).toBeGreaterThan(26);
    expect(f.cloudLW).toBeLessThan(30);
  });

  it("gives the textbook 255 K (−18 °C) for a planet with no infrared absorbers, and 33 K of greenhouse warming", () => {
    const Tn = M.budgetEq({ ...today, air: "none" });
    expect(Tn).toBeGreaterThan(254);
    expect(Tn).toBeLessThan(256.5);
    expect(M.budgetEq(today) - Tn).toBeGreaterThan(30);
    expect(M.budgetEq(today) - Tn).toBeLessThan(34);
  });

  it("warms 1.1–1.2 K for doubled CO₂ without feedbacks (3.71 ÷ 3.22) and within AR6's likely 2.5–4 K with them", () => {
    const base = { transport: true, ice: true, wv: true, clouds: true, sun: 100, co2: 280 };
    expect(M.ecsOf({ ...base, ice: false, wv: false, clouds: false })).toBeCloseTo(3.708 / 3.22, 2);
    const ecs = M.ecsOf(base);
    expect(ecs).toBeGreaterThan(2.5);
    expect(ecs).toBeLessThan(4);
    const b = M.ebmBase(true);
    expect(b.mean).toBeGreaterThan(13);
    expect(b.mean).toBeLessThan(15);
  });

  it("freezes into a snowball as the Sun dims and needs more sunlight to thaw (hysteresis)", () => {
    const H = M.hysteresis({ transport: true, ice: true, wv: true, clouds: true, sun: 100, co2: 280 });
    expect(H.snowAt).toBeLessThan(H.thawAt);
    expect(H.snowAt).toBeGreaterThan(80);
    expect(H.snowAt).toBeLessThan(100);
  });

  it("follows Tyndall (1861): nitrogen stops nothing, N₂O about twice CO₂ at an inch of mercury, glass blocks the heat", () => {
    const at = (gas: string, win = "salt") => M.tube({ gas, p: 1 / 29.92, len: 1.2, src: 100, win });
    expect(at("N2").frac).toBe(0);
    const r = at("N2O").frac / at("CO2").frac;
    expect(r).toBeGreaterThan(1.75);
    expect(r).toBeLessThan(2.05);
    expect(at("CO2", "glass").reach).toBeLessThan(0.005);
  });

  it("gives methane a GWP-100 of 27.0 from its forcing per ppb and its 11.8-year lifetime (AR6)", () => {
    expect(M.gwpOf("CH4", 100)).toBeCloseTo(27.0, 0);
  });

  it("shows the jar measures stopped convection: Wood's glass box ≈ 55 °C in sunlight, lid matters far more than CO₂", () => {
    const sun = { src: "sun" };
    const wood = M.jarRun(sun, { gas: "air", lid: true, wall: "glass" }, 1800).a - 273.15;
    expect(wood).toBeGreaterThan(52);
    expect(wood).toBeLessThan(58);
    const lamp = { src: "lamp", dist: 0.3, watts: 150 };
    const r = (gas: string, lid: boolean) => M.jarRun(lamp, { gas, lid, wall: "glass" }, 1800).a - 293.15;
    expect(r("air", true) - r("air", false)).toBeGreaterThan(3 * (r("co2", true) - r("air", true)));
  });

  it("runs 1750–2023 to the record: CO₂ ≈ 410 ppm in 2019, N₂O ≈ 332 ppb, human warming 2010–2019 = 1.07 °C (AR6)", () => {
    const o = { fossil: true, cement: true, farming: true, clearing: true, haze: true, other: true, sun: true, volcano: true, wobble: false, seed: 1, ecs: 3, gamma: 0.73, aer: 1.1 };
    const R = M.causesRun(o), r19 = R.rows.find((r: { y: number }) => r.y === 2019);
    expect(r19.C / 410).toBeGreaterThan(0.98);
    expect(r19.C / 410).toBeLessThan(1.03);
    expect(r19.N).toBeCloseTo(332, -1);
    expect(r19.M / 1866).toBeGreaterThan(0.97);
    const hum = ["co2Fossil", "co2Cement", "co2Land", "ch4", "n2o", "other", "aerosol", "albedo"].reduce((s, k) => s + M.meanYears(R.rows, R.per[k], 2010, 2019), 0);
    expect(hum).toBeCloseTo(1.07, 1);
    const nat = M.causesRun({ ...o, fossil: false, cement: false, farming: false, clearing: false, haze: false, other: false });
    expect(Math.abs(M.meanYears(nat.rows, nat.T, 2011, 2020))).toBeLessThan(0.15);
  });

  it("keeps about a fifth of a CO₂ pulse in the air after 1,000 years and peaks its warming about a decade after", () => {
    expect(M.irf(1000)).toBeGreaterThan(0.2);
    expect(M.irf(1000)).toBeLessThan(0.25);
    const R = M.kickRun({ kick: "pulse", gtc: 1000, ecs: 3 });
    expect(R.peakT).toBeGreaterThan(5);
    expect(R.peakT).toBeLessThan(20);
    const V = M.kickRun({ kick: "volcano", aod: 0.15, ecs: 3 });
    expect(V.peak).toBeLessThan(-0.2);
    expect(Math.abs(M.kickAt(V, 20)[1])).toBeLessThan(0.05);
  });
});
