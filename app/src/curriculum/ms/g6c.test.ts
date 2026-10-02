import { describe, expect, it } from "vitest";
import { engine } from "./engine";

type P = Record<string, unknown>;
type Row = Record<string, number>;

describe("6C-1 The Energy Chain Bench — the models", () => {
  const M = engine.InsightLab.models["g6c-energy-chain"] as unknown as {
    cartRun: (o: P) => { rows: Row[]; gates: { v: number; dt: number }[]; E0: number; dent: number; peaks: { z: number }[] };
    chainRun: (o: P) => { rows: { Ein: number; Ebat: number; PE: number; light: number; Q: Row }[]; overall: number };
    kettleRun: (o: P) => { t: number; ideal: number; eff: number };
    bikeRun: (o: P) => { KE0: number; Qb: number; Qa: number; Qr: number; dT: number };
    phoneRun: (o: P) => { Ein: number; Es: number; Qc: number; Qcab: number; Qb: number };
    equivalents: (E: number, m: number) => Row;
  };
  const total = (r: Row) => r.KE + r.PE + r.Esp + r.Q;

  it("launches ½kx² = 0.50 J (400 N/m, 5 cm) into a 0.5 kg cart at √(2E/m) = 1.41 m/s, less the rolling losses", () => {
    const R = M.cartRun({ kind: "flat", len: 1.8, m: 0.5, mu: 0.0004, k: 400, x0: 0.05, gates: [0.7, 1.0], flag: 0.05, tEnd: 3 });
    expect(R.E0).toBeCloseTo(0.5, 9);
    expect(R.gates[0].v).toBeGreaterThan(1.40);
    expect(R.gates[0].v).toBeLessThan(Math.sqrt(2));
  });

  it("gives v = √(2gh) at the foot of a ramp whatever the mass: 2.43 m/s from 0.30 m on Earth, 0.986 m/s on the Moon", () => {
    const run = (m: number, g: number) => {
      const o = { kind: "ramp", h: 0.3, ang: 30, flat: 1.0, m, g, mu: 0.0004 };
      const len = M.cartRun({ ...o, tEnd: 0.01 }) as unknown as { pr: { len: number } };
      return M.cartRun({ ...o, gates: [len.pr.len - 1.0 + 0.2], flag: 0.05, tEnd: 3 }).gates[0].v;
    };
    expect(run(0.5, 9.81) / Math.sqrt(2 * 9.81 * 0.3)).toBeGreaterThan(0.99);
    expect(Math.abs(run(2.0, 9.81) - run(0.5, 9.81))).toBeLessThan(0.01);
    expect(run(0.5, 1.62) / 0.986).toBeGreaterThan(0.99);
    expect(run(0.5, 1.62) / 0.986).toBeLessThan(1.0);
  });

  it("keeps the ledger KE + PE + spring + thermal equal to the start, to a part in ten thousand, in every case", () => {
    const cases: P[] = [
      { kind: "flat", len: 1.8, m: 0.5, mu: 0.004, k: 400, x0: 0.05, gates: [0.7, 1.0], flag: 0.05, clay: 1.55, tEnd: 5 },
      { kind: "valley", H: 0.45, ang: 30, m: 0.5, mu: 0.035, sail: 0.04, brake: 0, s0: 0.2, tEnd: 30 },
      { kind: "valley", H: 0.45, ang: 30, m: 1.0, mu: 0.004, sail: 0, brake: 0.6, s0: 0.2, tEnd: 30 },
    ];
    cases.forEach((o) => {
      const R = M.cartRun(o);
      R.rows.filter((_, i) => i % 50 === 0).forEach((r) => expect(Math.abs(total(r) - R.E0) / R.E0).toBeLessThan(1e-3));
    });
  });

  it("loses height every swing in the valley, faster on a rougher track", () => {
    const peaks = (mu: number) => M.cartRun({ kind: "valley", H: 0.45, ang: 30, m: 0.5, mu, s0: 0.2, tEnd: 30 }).peaks.map((q) => q.z);
    const alu = peaks(0.004), felt = peaks(0.035);
    for (let i = 1; i < 5; i++) expect(alu[i]).toBeLessThan(alu[i - 1]);
    expect(felt[0]).toBeLessThan(alu[0]);
  });

  it("multiplies the chain's efficiencies: 21 × 95 × 78 × 90 × 90 × 78 × 35 % = 3.44 %, and the ledger balances", () => {
    const C = M.chainRun({ G: 1000, tilt: 0, panel: "mono", batt: "liion", motor: "coreless", lamp: "led", m: 0.5, h: 0.5, tEnd: 90 });
    expect(C.overall).toBeCloseTo(0.21 * 0.95 * 0.78 * 0.9 * 0.9 * 0.78 * 0.35, 9);
    const r = C.rows[C.rows.length - 1], heat = Object.values(r.Q).reduce((u, v) => u + v, 0);
    expect(r.Ein).toBeCloseTo(1000 * 0.05 * 90, 0);
    expect(Math.abs(r.Ebat + r.PE + r.light + heat - r.Ein) / r.Ein).toBeLessThan(1e-3);
  });

  it("boils 1 L from 20 °C at 2 kW in about 3 minutes against mcΔT/P = 167 s", () => {
    const K = M.kettleRun({ P: 2000, V: 1, T0: 20, lid: true });
    expect(K.ideal).toBeCloseTo((4186 * 80) / 2000, 6);
    expect(K.t).toBeGreaterThan(170);
    expect(K.t).toBeLessThan(200);
    expect(K.eff).toBeGreaterThan(0.85);
  });

  it("stops an 80 kg rider from 8 m/s: 2560 J, the disc rotor about 35 K hotter", () => {
    const B = M.bikeRun({ m: 80, v0: 8, brake: "disc", decel: 4 });
    expect(B.KE0).toBe(2560);
    expect(B.Qb + B.Qa + B.Qr).toBeCloseTo(2560, 0);
    expect(B.dT).toBeGreaterThan(34);
    expect(B.dT).toBeLessThan(37);
  });

  it("charges a phone with every joule from the wall accounted for", () => {
    const R = M.phoneRun({ W: 20, cap: 15, charger: "std" });
    expect(Math.abs(R.Es + R.Qc + R.Qcab + R.Qb - R.Ein) / R.Ein).toBeLessThan(1e-9);
  });

  it("shows one joule as 1.02 m of lift for an apple, 4.47 m/s, and 2.39 mK in 100 mL of water", () => {
    const Q = M.equivalents(1, 0.1);
    expect(Q.lift).toBeCloseTo(1 / 0.981, 6);
    expect(Q.speed).toBeCloseTo(Math.sqrt(20), 6);
    expect(Q.warm).toBeCloseTo(1 / 418.6, 8);
  });
});

describe("6C-2 The Particle Box — the models", () => {
  const M = engine.InsightLab.models["g6c-particle-box"] as unknown as {
    mdNew: (o: P) => unknown; mdStep: (m: unknown, dt: number, o?: P) => void; energy: (m: unknown) => number;
    tempOf: (m: unknown, k?: number) => number; coordination: (m: unknown) => number;
    syringeOf: (p: P, t: number) => { V: number; dV: number; P: number };
    Dof: (d: number, T: number, liq: string) => number;
    beadTracks: (d: number, T: number, liq: string, n: number, f: number, s: number) => Float64Array[];
    perrin: (d: number, T: number, liq: string, tr: Float64Array[], lag: number) => number;
    iceRun: (o: P) => { melt: number; Q: number };
    thermoRun: (o: P) => { eq: number };
    vrms3: (m: number, T: number) => number;
  };

  it("conserves energy in the bare molecular dynamics (velocity Verlet, no bath) to 0.5 %", () => {
    const m = M.mdNew({ N: 100, W: 16, H: 16, T: 0.6, seed: 3, jitter: 0.1 }), E0 = M.energy(m);
    for (let i = 0; i < 1500; i++) M.mdStep(m, 0.004);
    expect(Math.abs((M.energy(m) - E0) / E0)).toBeLessThan(5e-3);
  });

  it("holds the heat bath's temperature and packs a cold crystal tighter than a hot fluid", () => {
    const run = (T: number) => { const m = M.mdNew({ N: 120, W: 24, H: 28, T, seed: 5, andersen: 2, gravity: 0.004, jitter: 0.04 }); for (let i = 0; i < 1200; i++) M.mdStep(m, 0.005); return m; };
    const cold = run(0.3), hot = run(1.5);
    expect(M.tempOf(cold)).toBeGreaterThan(0.25);
    expect(M.tempOf(cold)).toBeLessThan(0.35);
    expect(M.coordination(cold)).toBeGreaterThan(4.8);
    expect(M.coordination(hot)).toBeLessThan(M.coordination(cold) - 1.5);
  });

  it("squeezes 40 mL of air to 25.3 mL under 4 kg (Boyle) and 40 mL of water by only 1.08 µL (K = 2.2 GPa)", () => {
    expect(M.syringeOf({ fill: "air", V0: 40, load: 4, Tc: 20 }, 1e9).V).toBeCloseTo(25.30, 1);
    expect(M.syringeOf({ fill: "water", V0: 40, load: 4, Tc: 20 }, 1e9).dV * 1000).toBeCloseTo(1.08, 2);
  });

  it("gives a 1 µm bead in water D = kT/6πηr = 0.429 µm²/s, and Perrin's count within 5 % of 6.022 × 10²³", () => {
    expect(M.Dof(1, 20, "water") * 1e12).toBeCloseTo(0.4286, 3);
    const NA = M.perrin(1, 20, "water", M.beadTracks(1, 20, "water", 300, 600, 5), 300);
    expect(Math.abs(NA / 6.022e23 - 1)).toBeLessThan(0.05);
  });

  it("melts 219 g of ice with a 250 g mug of tea at 70 °C, and gives xenon 239 m/s to helium's 1368 at 300 K", () => {
    expect(M.iceRun({ obj: "tea", T: 70, logm: Math.log10(0.25), ice: 1 }).melt * 1000).toBeCloseTo(219.3, 0);
    expect(M.vrms3(4.0, 300)).toBeCloseTo(1368, -1);
    expect(M.vrms3(131.29, 300)).toBeCloseTo(239, 0);
  });

  it("settles a 20 °C glass thermometer in a 1 mL drop at 80 °C at 66.6 °C", () => {
    expect(M.thermoRun({ th: "glass", V: 1, Ts: 80, Tp0: 20, surf: "water", epsSet: 0.95 }).eq).toBeCloseTo(66.63, 1);
  });
});

describe("6C-3 The Heat Transfer Bench — the models", () => {
  const M = engine.InsightLab.models["g6c-heat-transfer"] as unknown as {
    MAT: Record<string, { k: number }>; ROD: { dip: number }; RODS: string[];
    blocksRun: (o: P) => { rows: { TA: number; TB: number; q: number }[]; Tmix: number };
    rodsRun: (o: P) => Record<string, { frames: { x: number }[]; xSteady: number }>;
    tankNew: (o: P) => { T: Float64Array; heat: number }; tankStep: (K: unknown, dt: number) => void;
    tankStats: (K: unknown) => { top: number; bot: number; umax: number };
    leslie: (o: P) => { mV: number; M: number };
    contactT: (a: unknown, TA: number, b: unknown, TB: number) => number;
    iceBlock: (o: P) => { tMelt: number | null };
    mixRun: (o: P) => { Tideal: number; rows: { TH: number; TC: number; lostH: number; gainC: number; toRoom: number }[] };
  };

  it("sends heat from hot to cold whichever block is which, and meets at ΣmcT/Σmc = 59.0 °C", () => {
    const a = M.blocksRun({ mA: 0.5, TA: 80, matA: "alu", mB: 0.5, TB: 10, matB: "copper", contact: "paste" });
    const b = M.blocksRun({ mA: 0.5, TA: 10, matA: "alu", mB: 0.5, TB: 80, matB: "copper", contact: "paste" });
    expect(a.Tmix).toBeCloseTo(58.98, 2);
    a.rows.forEach((r) => expect(Math.sign(r.q) === Math.sign(r.TA - r.TB) || Math.abs(r.q) < 1e-9).toBe(true));
    expect(b.rows[1].q).toBeLessThan(0);
  });

  it("reproduces Ingen-Housz: the rods' melted lengths in the order of k, copper/steel lengths² near the k ratio 25", () => {
    const R = M.rodsRun({ Tb: 95, d: 6, h: 10, Tw: 58, tEnd: 1800 }), len = (k: string) => R[k].frames[R[k].frames.length - 1].x - M.ROD.dip;
    const order = ["copper", "alu", "brass", "iron", "steel", "glass", "wood"];
    for (let i = 1; i < order.length; i++) expect(len(order[i])).toBeLessThan(len(order[i - 1]));
    expect((R.copper.xSteady - M.ROD.dip) * 100).toBeCloseTo(16.7, 1);
    const ratio = (len("copper") / len("steel")) ** 2;
    expect(ratio / (401 / 16)).toBeGreaterThan(0.95);
    expect(ratio / (401 / 16)).toBeLessThan(1.15);
  });

  it("turns the tank over when heated from below, and stratifies it when heated from the top", { timeout: 30000 }, () => {
    const run = (pos: string) => { const K = M.tankNew({ liq: "water", P: 30, pos }); for (let i = 0; i < 800; i++) M.tankStep(K, 0.1); return M.tankStats(K); };
    const low = run("left"), top = run("top");
    expect(low.umax).toBeGreaterThan(2 * top.umax);
    expect(top.top - top.bot).toBeGreaterThan(0.3);
  });

  it("gives Leslie's cube at 90 °C the readings in the ratio of ε: black 5.73 mV, white 5.49, polished 0.30", () => {
    const r = (f: string) => M.leslie({ Tw: 90, face: f, d: 0.1 }).mV;
    expect(r("black")).toBeCloseTo(5.727, 2);
    expect(r("white") / r("black")).toBeCloseTo(0.91 / 0.95, 6);
    expect(r("shiny")).toBeCloseTo(0.301, 2);
  });

  it("lowers skin to 20.6 °C on aluminium and 30.2 °C on wood, and melts ice far faster on aluminium than acrylic", () => {
    expect(M.contactT(M.MAT.skin, 33, M.MAT.alu, 20)).toBeCloseTo(20.6, 1);
    expect(M.contactT(M.MAT.skin, 33, M.MAT.wood, 20)).toBeCloseTo(30.2, 1);
    const a = M.iceBlock({ mat: "alu", Troom: 20, tEnd: 3000 }).tMelt as number, b = M.iceBlock({ mat: "acrylic", Troom: 20, tEnd: 3000 }).tMelt as number;
    expect(a).toBeGreaterThan(60); expect(a).toBeLessThan(150);
    expect(b / a).toBeGreaterThan(10);
  });

  it("mixes 100 g at 80 °C with 100 g at 20 °C to 50.2 °C, and balances the ledger: lost = gained + leaked", () => {
    const X = M.mixRun({ mH: 0.1, TH: 80, add: "cold", mC: 0.1, TC: 20, cup: "foam" }), e = X.rows[X.rows.length - 1];
    expect(X.Tideal).toBeCloseTo(50.21, 2);
    expect(Math.abs(e.lostH - e.gainC - e.toRoom)).toBeLessThan(1e-6 * e.lostH);
  });
});

describe("6C-4 The Specific Heat Investigation — the models", () => {
  const M = engine.InsightLab.models["g6c-specific-heat"] as unknown as {
    MATS: Record<string, { c: number }>;
    sampleRun: (o: P) => { truth: { t: number; T: number }[]; reads: { t: number; T: number }[]; Ccont: number };
    analyse: (R: unknown, o: P, w: P) => { raw: number; corr: number };
    traysRun: (o: P) => { rows: { sand5: number; water: number }[] };
    beachDay: (o: P) => { sandSwing: number; seaSwing: number };
  };
  const at = (rows: { t: number; T: number }[], t: number) => rows.filter((r) => r.t <= t + 1e-9).pop() as { T: number };

  it("warms 500 g of water by 7.07 K and 500 g of sunflower oil by 14.8 K with 15 kJ (50 W × 300 s)", () => {
    const o = (mat: string) => ({ mat, m: 0.5, P: 50, tOn: 300, tEnd: 600, cont: "foam", stir: true });
    expect(at(M.sampleRun(o("water")).truth, 300).T - 20).toBeCloseTo(7.07, 1);
    expect(at(M.sampleRun(o("oil")).truth, 300).T - 20).toBeCloseTo(14.8, 1);
  });

  it("recovers the book c of every material within 1.5 % with the cooling-line correction, and overestimates it without", () => {
    ["water", "oil", "alu", "copper", "sand"].forEach((mat) => ["foam", "glass"].forEach((cont) => {
      const o = { mat, m: 0.5, P: 50, tOn: 300, tEnd: 600, cont, stir: true, probe: "digital", dts: 10 };
      const A = M.analyse(M.sampleRun(o), o, { t1: 60, t2: 300 }), book = M.MATS[mat].c;
      expect(Math.abs(A.corr / book - 1)).toBeLessThan(0.015);
      expect(A.raw).toBeGreaterThan(book);
    }));
  });

  it("keeps a lamp-heated sand tray far hotter near its surface than a water tray, and swings a beach 30× more than the sea", () => {
    const r = M.traysRun({ I: 600, depth: 0.03, tEnd: 900 }).rows.pop() as { sand5: number; water: number };
    expect(r.sand5 - 20).toBeGreaterThan(3 * (r.water - 20));
    const B = M.beachDay({ S: 900, mix: 5 });
    expect(B.sandSwing).toBeGreaterThan(25);
    expect(B.sandSwing / B.seaSwing).toBeGreaterThan(20);
  });
});
