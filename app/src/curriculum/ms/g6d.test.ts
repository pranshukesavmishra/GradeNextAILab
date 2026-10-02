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

describe("6D-3 The Weather Station — the models", () => {
  const M = engine.InsightLab.models["g6d-weather-station"] as unknown as {
    es: (T: number) => number; dewOf: (e: number) => number;
    weather: (p: P, t: number) => { T: number; Td: number; Psl: number; u10: number; dir: number; R: number; S: number };
    radErr: (p: P, w: P, u: number) => number;
    wetBulb: (T: number, Td: number, P: number, A: number) => number;
    fromBulbs: (T: number, Tw: number, P: number) => { rh: number; Td: number };
    PSY: { whirled: number; still: number };
    stationP: (P: number, z: number, T: number) => number; toSeaLevel: (P: number, z: number, T: number) => number;
    catchEff: (p: P, u: number, snow: boolean) => number;
    cupRPM: (u: number) => number; beaufort: (u: number) => number; windAt: (u: number, z: number, z0: number) => number;
    stationStart: (p: P) => { tips: number; rain: number; caught: number };
    stationStep: (St: unknown, p: P, h: number) => { tips: number; rain: number; caught: number };
    TF: number;
  };

  it("reads 13.8 °C on a whirled wet bulb at 20 °C and 50 %, and a still one reads high", () => {
    const Td = M.dewOf(0.5 * M.es(20));
    expect(M.wetBulb(20, Td, 101325, M.PSY.whirled)).toBeCloseTo(13.8, 1);
    expect(M.wetBulb(20, Td, 101325, M.PSY.still)).toBeGreaterThan(M.wetBulb(20, Td, 101325, M.PSY.whirled) + 0.8);
    expect(M.fromBulbs(20, 14, 101325).rh).toBeCloseTo(51.2, 1);
  });

  it("puts a sunlit thermometer 3.5 °C high, a screened one within a few tenths, and less in wind", () => {
    const sun = { sensor: "glass", expose: "sun" }, scr = { sensor: "glass", expose: "screen" };
    expect(M.radErr(sun, { S: 800 }, 1)).toBeCloseTo(3.52, 2);
    expect(M.radErr(scr, { S: 800 }, 1)).toBeLessThan(0.3);
    expect(M.radErr(sun, { S: 800 }, 6)).toBeLessThan(M.radErr(sun, { S: 800 }, 1));
    expect(M.radErr({ sensor: "black", expose: "sun" }, { S: 800 }, 1)).toBeGreaterThan(10);
  });

  it("reduces Denver's 840 hPa to 1,013 hPa at sea level", () => {
    expect(M.toSeaLevel(840, 1609, 15)).toBeCloseTo(1013.1, 0);
    expect(M.toSeaLevel(M.stationP(1020, 2000, 10), 2000, 10)).toBeCloseTo(1020, 6);
  });

  it("drops the pressure into the front, veers the wind and rains, then clears colder and drier", () => {
    const p = { pattern: "front" }, before = M.weather(p, M.TF - 12), at = M.weather(p, M.TF - 0.5), after = M.weather(p, M.TF + 12);
    expect(at.Psl).toBeLessThan(before.Psl);
    expect(after.Psl).toBeGreaterThan(at.Psl + 8);
    expect(at.R).toBeGreaterThan(5);
    expect(after.dir).toBeGreaterThan(270);
    expect(before.dir).toBeLessThan(240);
    expect(after.Td).toBeLessThan(before.Td - 5);
  });

  it("catches 40 % of snow at 3 m/s unshielded (WMO), a few per cent less rain, and counts 0.2 mm tips", () => {
    expect(100 * M.catchEff({ rim: 10, site: "grass", shield: false }, 3, true)).toBeCloseTo(39.9, 1);
    expect(M.catchEff({ rim: 10, site: "grass", shield: false }, 3, false)).toBeGreaterThan(0.95);
    const p = { pattern: "front", sensor: "glass", expose: "screen", alt: 0, whirl: true, rim: 0.5, site: "grass", shield: false, t0: 0, mast: 10 };
    const St = M.stationStart(p); M.stationStep(St, p, 96);
    expect(St.tips).toBe(Math.floor(St.caught / 0.2));
    expect(St.caught).toBeLessThan(St.rain);
  });

  it("turns the cups at 254 rpm in 5 m/s, gives Beaufort 5 for 10 m/s, and slows the wind near rough ground", () => {
    expect(M.cupRPM(5)).toBeCloseTo(254.5, 0);
    expect(M.cupRPM(0.2)).toBe(0);
    expect(M.beaufort(10)).toBe(5);
    expect(M.windAt(10, 2, 0.03)).toBeCloseTo(7.23, 2);
    expect(M.windAt(10, 2, 1.5)).toBeLessThan(M.windAt(10, 2, 0.03));
  });
});

describe("6D-4 Air Masses and Fronts — the models", () => {
  const M = engine.InsightLab.models["g6d-fronts"] as unknown as {
    airStart: (p: P) => { T: number; Td: number; snow: number; lake: number };
    airStep: (A: unknown, p: P, d: number) => { T: number; Td: number; snow: number; lake: number };
    geostrophic: (dP: number, dn: number, lat: number) => number;
    windAt: (p: P, x: number, y: number) => { u: number; v: number; ug: number; vg: number };
    divAt: (p: P, x: number, y: number) => number;
    margules: (p: P) => number; LCL: (T: number, Td: number) => number;
    frontOf: (p: P) => { slope: number; lift: number; R: number; hours: number; unstable: boolean };
    arrival: (p: P, k: number) => number;
  };
  const run = (o: P) => { const p = { speed: 10, ...o }, A = M.airStart(p); M.airStep(A, p, 10); return A; };

  it("grows lake-effect snow from winter cP air over the Great Lakes, but not in summer", () => {
    const w = run({ path: "lakes", season: "winter" }), s = run({ path: "lakes", season: "summer" });
    expect(w.lake).toBeGreaterThanOrEqual(13);
    expect(w.snow).toBeGreaterThan(10);
    expect(s.snow).toBe(0);
  });

  it("turns Gulf air to fog going north in winter, and wrings Pacific air dry over the Rockies", () => {
    const mt = run({ path: "mtnorth", season: "winter" });
    expect(mt.T - mt.Td).toBeLessThan(0.5);
    const mp = run({ path: "mprockies", season: "winter" });
    expect(mp.Td).toBeLessThan(-8);
  });

  it("gives a 10.8 m/s geostrophic wind for 4 hPa per 300 km at 45° N", () => {
    expect(M.geostrophic(4, 300, 45)).toBeCloseTo(10.77, 2);
  });

  it("spins air anticlockwise and inward round a northern low, the other way in the south, and lifts it there", () => {
    const base = { lx: -600, ly: 0, hx: 700, hy: 0, low: 990, high: 1030, lat: 45, surface: "land" };
    const n = M.windAt({ ...base, hemi: "north" }, -600, 300), s = M.windAt({ ...base, hemi: "south" }, -600, 300);
    expect(n.u).toBeLessThan(0);                                         // north of a northern low the wind blows west
    expect(s.u).toBeGreaterThan(0);
    expect(n.v).toBeLessThan(0);                                         // and in toward the low
    expect(M.divAt({ ...base, hemi: "north" }, -450, 0)).toBeLessThan(0);
    expect(M.divAt({ ...base, hemi: "north" }, 700, 0)).toBeGreaterThan(0);
  });

  it("slopes a cold front 1:117 by Margules and lifts warm air faster than a warm front's 1:189", () => {
    const cold = { setup: "cold", Tw: 18, Tdw: 15, Tc: 4, shear: 40, fspeed: 12, lapse: 7.5 }, warm = { setup: "warm", Tw: 16, Tdw: 13, Tc: 2, shear: 25, fspeed: 7, lapse: 4.5 };
    expect(1 / M.margules(cold)).toBeCloseTo(117.2, 0);
    expect(1 / M.margules(warm)).toBeCloseTo(188.6, 0);
    const C = M.frontOf(cold), Wf = M.frontOf(warm);
    expect(C.lift).toBeGreaterThan(2 * Wf.lift);
    expect(C.R).toBeGreaterThan(Wf.R);
    expect(Wf.hours).toBeGreaterThan(5 * C.hours);
    expect(M.LCL(18, 15)).toBe(375);
  });

  it("times the front between stations: 300 km in 7.5 h is 40 km/h", () => {
    const p = { x0: -200, trackSpeed: 40, spacing: 300 };
    expect(M.arrival(p, 2) - M.arrival(p, 1)).toBeCloseTo(7.5, 6);
  });
});

describe("6D-5 Unequal Heating — the models", () => {
  type Tr = { t: number; sand: number[]; water: number; E: number };
  const M = engine.InsightLab.models["g6d-unequal-heating"] as unknown as {
    dailyInsolation: (lat: number, day: number) => number; noonElev: (lat: number, day: number) => number;
    airMass: (e: number) => number; beamAtGround: (e: number) => number;
    cardTemp: (a: number, I: number, Ta: number, h: number, wet?: boolean) => number;
    traysStart: (p: P) => Tr; traysStep: (T: Tr, p: P, dt: number) => Tr; sandAt: (T: Tr, cm: number) => number;
    tempAt: (p: P, z: number) => number; freezingLevel: (p: P) => number;
    patchSteady: (s: string, I: number, Ta: number) => number;
    dayOf: (p: P, k: string) => number[][]; rangeOf: (r: number[][]) => number;
    SAND: { c: number }; WATER: { c: number };
  };
  const trays = { room: 20, lampI: 600, lampMin: 30, fan: 0, rh: 50, wetSand: false };

  it("gives 436 W/m² a day at the equinox equator, 524 at the June pole, and none at the December pole", () => {
    expect(M.dailyInsolation(0, 80)).toBeCloseTo(436, 0);
    expect(M.dailyInsolation(90, 172)).toBeCloseTo(524, 0);
    expect(M.dailyInsolation(90, 355)).toBe(0);
    expect(M.dailyInsolation(45, 172)).toBeGreaterThan(M.dailyInsolation(45, 355) * 4);
    expect(M.noonElev(0, 80)).toBeCloseTo(90, 0);
  });

  it("doubles the air at 30° sun (Kasten–Young) and cools a card that turns away from the lamp", () => {
    expect(M.airMass(30)).toBeCloseTo(1.99, 2);
    expect(M.beamAtGround(30)).toBeLessThan(M.beamAtGround(90) / 2);
    const t0 = M.cardTemp(0.05, 900, 20, 6.8), t60 = M.cardTemp(0.05, 450, 20, 6.8);
    expect(t0).toBeGreaterThan(t60 + 20);
    expect(M.cardTemp(0.8, 900, 20, 6.8)).toBeLessThan(t60);
  });

  it("heats sand's surface 16.6 °C and water 3.4 °C in 30 minutes, the heat staying near the sand's top", () => {
    const T = M.traysStep(M.traysStart(trays), trays, 1800);
    expect(T.sand[0] - 20).toBeCloseTo(16.6, 0);
    expect(T.water - 20).toBeCloseTo(3.4, 0);
    expect(M.sandAt(T, 4) - 20).toBeLessThan((T.sand[0] - 20) / 5);
    expect(M.WATER.c / M.SAND.c).toBeCloseTo(5.04, 2);
    M.traysStep(T, trays, 1800);
    expect(T.sand[0]).toBeLessThan(T.water + 5);
  });

  it("puts Kilimanjaro's summit at −13.3 °C and the freezing level at 3.85 km", () => {
    const p = { T0: 25, lapseKind: "standard" };
    expect(M.tempAt(p, 5.895)).toBeCloseTo(-13.3, 1);
    expect(M.freezingLevel(p)).toBeCloseTo(3.85, 2);
    expect(M.tempAt({ T0: 25, lapseKind: "dry" }, 1)).toBeCloseTo(15.2, 1);
  });

  it("orders the patches by albedo, with water cooled below the curve by evaporation", () => {
    const s = ["snow", "sand", "grass", "soil", "asphalt"].map(k => M.patchSteady(k, 600, 20));
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
    expect(M.patchSteady("water", 600, 20)).toBeLessThan(M.patchSteady("sand", 600, 20));
  });

  it("swings a desert 44 °C day to night, grass 23, forest 18, the ocean under 1, and cloud damps it", () => {
    const p = { lat: 35, day: 172, cloud: 1, airT: 25 };
    expect(M.rangeOf(M.dayOf(p, "desert"))).toBeCloseTo(44.6, 0);
    expect(M.rangeOf(M.dayOf(p, "grass"))).toBeGreaterThan(20);
    expect(M.rangeOf(M.dayOf(p, "forest"))).toBeLessThan(M.rangeOf(M.dayOf(p, "grass")));
    expect(M.rangeOf(M.dayOf(p, "ocean"))).toBeLessThan(1);
    expect(M.rangeOf(M.dayOf({ ...p, cloud: 7 }, "desert"))).toBeLessThan(30);
    expect(M.dayOf(p, "desert").length).toBe(96);
  });
});
