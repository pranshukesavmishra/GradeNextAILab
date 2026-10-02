import { describe, expect, it } from "vitest";
import { engine } from "./engine";

type P = Record<string, unknown>;
type Fn = (...a: never[]) => unknown;

describe("6D-1 The Water Cycle Machine — the models", () => {
  const M = engine.InsightLab.models["g6d-water-cycle"] as unknown as Record<string, Fn> & {
    es: (T: number) => number; rhoSat: (T: number) => number; dewOf: (e: number) => number;
    bottle: (p: P) => { mL: Record<string, number>; freshPct: number; rise: number };
    residence: (k: string) => number;
    chamberRun: (p: P, s: number) => { Tw: number; drip: number; fog: number; evap: number; salt: number; dishM: number; mv: number };
    ponding: (p: P, i: number) => { tp: number; Fp: number };
    trayRun: (p: P, mins: number) => { run: number; rain: number; F: number };
    dropV: (D: number) => number;
    leafOf: (p: P) => { E: number; open: number };
    worldStart: () => Record<string, number>;
    worldStep: (W: Record<string, number>, o: P, y: number) => Record<string, number>;
    worldRates: (W: Record<string, number>, o: P) => Record<string, number>;
    lakeOf: (p: P) => { tauDye: number; tauWater: number };
    W0: Record<string, number>;
  };
  const base = { power: 40, dish: 15, room: 20, roomRH: 50, lid: "ice", lidT: 0, fan: 0, salt: 0 };
  const rain = { soil: "loam", cover: "bare", wet: 30, rate: 40, dur: 30, slope: 5, rough: 8 };
  const leaf = { plant: "sunflower", vas: "none", lamp: true, lampD: 30, airT: 25, rh: 50, wind: 0.3, area: 150, bore: 0.75, bag: false };

  it("puts Gleick's inventory in a litre: 965 mL of ocean, 25.3 mL fresh, 9.7 days in the air", () => {
    const B = M.bottle({ bottleL: 1, view: "all", melt: 0 });
    expect(B.mL.ocean).toBeCloseTo(965.4, 1);
    expect(B.freshPct).toBeCloseTo(2.53, 2);
    expect(M.residence("air") * 365.25).toBeCloseTo(9.7, 1);
    expect(M.residence("ocean")).toBeGreaterThan(3200);
    expect(M.bottle({ bottleL: 1, view: "all", melt: 100 }).rise).toBeCloseTo(65.64, 2);
  });

  it("gets the vapour physics right: 2.34 kPa and 17.3 g/m³ at 20 °C, 101.3 kPa at 100 °C, dew point 9.3 °C at 50 %", () => {
    expect(M.es(20) / 1000).toBeCloseTo(2.34, 2);
    expect(M.es(100) / 1000).toBeCloseTo(101.3, 1);
    expect(M.rhoSat(20)).toBeCloseTo(17.3, 1);
    expect(M.dewOf(0.5 * M.es(20))).toBeCloseTo(9.3, 1);
  });

  it("makes rain in a box only when the lid is below the dew point, and distils salt water", () => {
    const cold = M.chamberRun(base, 3600), warm = M.chamberRun({ ...base, lidT: 22 }, 3600);
    expect(cold.drip).toBeGreaterThan(5);
    expect(warm.drip).toBe(0);
    expect(cold.fog).toBeGreaterThan(0);
    const sea = M.chamberRun({ ...base, salt: 35 }, 3600);
    expect(sea.salt / sea.dishM * 1000).toBeGreaterThan(35);            // the dish gets saltier; what drips is fresh
    const off = M.chamberRun({ ...base, power: 0, lid: "open" }, 7200);
    expect(off.Tw).toBeLessThan(20);                                     // evaporation cools the water below the room
  });

  it("reproduces Chow, Maidment & Mays Example 4.4.1: silty clay ponds after 0.39 h at 1 cm/h and 0.042 h at 3 cm/h", () => {
    const p = { soil: "siltyClay", cover: "bare", wet: 40, slope: 5, rough: 8 };
    expect(M.ponding(p, 10).tp / 60).toBeCloseTo(0.39, 2);
    expect(M.ponding(p, 10).Fp).toBeCloseTo(3.9, 1);
    expect(M.ponding(p, 30).tp / 60).toBeCloseTo(0.042, 3);
  });

  it("orders runoff sand < loam < clay < pavement, and grass and dry soil take more in", () => {
    const run = (o: P) => M.trayRun({ ...rain, ...o }, 60).run;
    expect(run({ soil: "sand" })).toBe(0);
    expect(run({ soil: "loam" })).toBeLessThan(run({ soil: "clay" }));
    expect(run({ soil: "clay" })).toBeLessThan(run({ soil: "paved" }));
    expect(run({ soil: "paved" })).toBeGreaterThan(19.5);
    expect(run({ cover: "grass" })).toBeLessThan(run({}));
    expect(run({ wet: 0 })).toBeLessThan(run({ wet: 90 }));
    expect(M.dropV(2)).toBeCloseTo(6.55, 1);                             // Atlas: a 2 mm drop falls at 6.5 m/s
  });

  it("closes stomata in the dark and in jelly, more for a bean's underside than its top", () => {
    const E = (o: P) => M.leafOf({ ...leaf, ...o }).E;
    expect(E({ lamp: false })).toBeLessThan(0.3 * E({}));
    expect(E({ plant: "bean", vas: "lower" })).toBeLessThan(E({ plant: "bean", vas: "upper" }));
    expect(E({ rh: 90 })).toBeLessThan(E({ rh: 20 }));
    expect(E({}) * 1000).toBeGreaterThan(1);
    expect(E({}) * 1000).toBeLessThan(8);                                // a leaf transpires a few mmol/m²/s
  });

  it("balances the world's water on Trenberth's fluxes, and stops it with either driver off", () => {
    const W = M.worldStart(), o = { sun: 1, grav: 1, plants: 1 };
    M.worldStep(W, o, 50);
    expect(W.air).toBeCloseTo(12.9, 1);
    expect(W.soil).toBeCloseTo(16.5, 1);
    expect(M.worldRates(M.W0, o).energy).toBeCloseTo(74.4, 0);
    const dark = M.worldStart(); M.worldStep(dark, { sun: 0, grav: 1, plants: 1 }, 1);
    expect(dark.air).toBeLessThan(0.01);
    expect(M.worldRates(dark, { sun: 0, grav: 1, plants: 1 }).river).toBeGreaterThan(30);   // rivers still run a year later
    const floating = M.worldStart(); M.worldStep(floating, { sun: 1, grav: 0, plants: 1 }, 1);
    expect(floating.air).toBeGreaterThan(400);
  });

  it("flushes dye from a lake in its published retention time: Erie 2.6 yr, Superior 191 yr", () => {
    expect(M.lakeOf({ lake: "erie", inflow: 100, closed: false }).tauDye).toBeCloseTo(2.6, 6);
    expect(M.lakeOf({ lake: "superior", inflow: 100, closed: false }).tauDye).toBeCloseTo(191, 6);
    expect(M.lakeOf({ lake: "superior", inflow: 100, closed: false }).tauWater).toBeLessThan(191);
    expect(M.lakeOf({ lake: "erie", inflow: 100, closed: true }).tauDye).toBe(Infinity);
  });
});

describe("6D-2 The Atmosphere Column — the models", () => {
  const M = engine.InsightLab.models["g6d-atmosphere"] as unknown as {
    airOf: (p: P) => { x: Record<string, number>; M: number; rho: number };
    column: (p: P) => { at: (z: number) => { T: number; P: number } };
    boundaries: (C: unknown) => { z: number; T: number }[];
    baroOf: (p: P) => { P: number; h: number; len: number };
    flaskOf: (p: P) => { mAir: number; mNow: number };
    syrStart: (p: P) => { V: number; P: number };
    candleState: (p: P, t: number) => { rise: number; x: Record<string, number> };
    atmRho: (p: P, z: number) => number; atmP: (p: P, z: number) => number;
    tempToFloat: (p: P, z: number) => number; RD: number;
  };
  const std = { lat: "mid", dTs: 0, ozone: 100, sun: "average", P0: 1013.25 };

  it("gives dry air 28.97 g/mol and 1.204 kg/m³ at 20 °C, and makes damp air lighter", () => {
    const dry = M.airOf({ co2: 420, hum: 0, T: 20, press: 1013.25 });
    expect(dry.M).toBeCloseTo(28.97, 2);
    expect(dry.rho).toBeCloseTo(1.204, 3);
    expect(dry.x.O2).toBeCloseTo(0.2095, 4);
    expect(M.airOf({ co2: 420, hum: 100, T: 30, press: 1013.25 }).rho).toBeLessThan(dry.rho);
  });

  it("reproduces the U.S. Standard Atmosphere 1976: 226.32 hPa at 11 km, 54.75 at 20, 8.680 at 32, 1.109 at 47", () => {
    const C = M.column(std);
    expect(C.at(11).T).toBeCloseTo(216.65, 2);
    expect(C.at(11).P / 100).toBeCloseTo(226.32, 1);
    expect(C.at(20).P / 100).toBeCloseTo(54.75, 1);
    expect(C.at(32).P / 100).toBeCloseTo(8.680, 2);
    expect(C.at(47).P / 100).toBeCloseTo(1.109, 2);
    expect(M.boundaries(C).map((b) => +b.z.toFixed(2))).toEqual([11, 47, 84.85]);           // tropopause, stratopause, mesopause
  });

  it("loses the stratosphere without ozone and lifts the tropopause to 17 km over the tropics", () => {
    expect(M.boundaries(M.column({ ...std, ozone: 0 })).length).toBe(1);
    expect(M.boundaries(M.column({ ...std, lat: "tropics" }))[0].z).toBeCloseTo(17, 1);
  });

  it("holds up 760 mm of mercury and 10.11 m of water at sea level, a tilted tube longer but no higher", () => {
    expect(M.baroOf({ alt: 0, wx: 0, fluid: "mercury", tilt: 0 }).h * 1000).toBeCloseTo(760.0, 1);
    expect(M.baroOf({ alt: 0, wx: 0, fluid: "water", tilt: 0 }).h).toBeCloseTo(10.11, 2);
    const t = M.baroOf({ alt: 0, wx: 0, fluid: "mercury", tilt: 60 });
    expect(t.len / t.h).toBeCloseTo(2, 6);
    expect(M.flaskOf({ alt: 0, wx: 0, fluid: "mercury", tilt: 0, flask: 1000, pump: 0 }).mAir).toBeCloseTo(1.225, 3);
  });

  it("obeys Boyle and Charles: 50 mL → 72.3 mL at 70.1 kPa, → 60.2 mL at 80 °C, 122.1 kPa if clamped", () => {
    expect(M.syrStart({ v0: 50, Tb: 20, pout: 70.1, clamp: false }).V).toBeCloseTo(72.27, 1);
    expect(M.syrStart({ v0: 50, Tb: 80, pout: 101.325, clamp: false }).V).toBeCloseTo(60.23, 1);
    expect(M.syrStart({ v0: 50, Tb: 80, pout: 101.325, clamp: true }).P / 1000).toBeCloseTo(122.06, 1);
  });

  it("puts out the candle with about 16 % oxygen left, the water rising mostly as the air cools", () => {
    const end = M.candleState({ co2: 420, hum: 50, T: 20 }, 1e6);
    expect(end.x.O2).toBeGreaterThan(0.15);
    expect(end.x.O2).toBeLessThan(0.165);
    expect(end.rise).toBeGreaterThan(0.10);
    expect(end.rise).toBeLessThan(0.20);
  });

  it("lifts 781 kg with 2,800 m³ at 100 °C on a 15 °C day, and needs a hotter envelope on a hot day", () => {
    const p = { vol: 2800, mass: 600, Tg: 15 };
    expect(2800 * (M.atmRho(p, 0) - M.atmP(p, 0) / (M.RD * 373.15))).toBeCloseTo(781, 0);
    expect(M.tempToFloat(p, 0)).toBeCloseTo(76.1, 1);
    expect(M.tempToFloat({ ...p, Tg: 35 }, 0)).toBeGreaterThan(M.tempToFloat({ ...p, Tg: 5 }, 0) + 25);
  });
});
