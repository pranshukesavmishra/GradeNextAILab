import { describe, expect, it } from "vitest";
import { engine } from "./engine";

describe("6B-1 The Microscope — the models", () => {
  type P = Record<string, unknown>;
  const M = engine.InsightLab.models["g6b-microscope"] as unknown as {
    optics: (p: P) => { r: number; M: number; field: number; empty: boolean; bright: number; useful: number[]; noOil: boolean };
    corkCells: (seed: number) => unknown[];
    corkCount: (s: { cells: unknown[] }, cx: number, cy: number, len: number) => { n: number; perInch: number; perCu: number };
    rootCells: (seed: number) => unknown[];
    rootCount: (s: { cells: unknown[] }, F: number[][], fov: number) => { tally: Record<string, number>; N: number };
    rootEstimate: (t: Record<string, number>, N: number, T: number) => { T: number; mitosis: number };
    fieldsOf: (n: number, fov: number) => number[][];
    cycleHours: (T: number) => number;
    PHASE_FRAC: Record<string, number>;
    diffusion: (d: number, T: number) => number;
    viscosity: (T: number) => number;
    yeastRate: (T: number, sugar: number) => number;
    yeastDeath: (T: number) => number;
    evapRate: (R: number, rh: number, T: number) => number;
    cvPeriod: (org: string, pct: number) => number;
    osmOf: (pct: number) => number;
    fvPH: (age: number) => number;
    sinkSpeed: (c: string) => number;
    COLONY: Record<string, { N: number; R: number; germ: number; swim: number }>;
    HOOKE: { perInch: number; perSqInch: number; perCuInch: number };
    BASE: () => P;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });

  it("resolves 1.22λ ÷ (NA objective + NA condenser): 0.57 µm at 40×/0.65 with the iris at 0.52, never much below 0.2 µm", () => {
    expect(M.optics(p({ obj: 40, cond: 0.52 })).r).toBeCloseTo(0.5735, 3);
    expect(M.optics(p({ obj: 100, cond: 0.9 })).r).toBeCloseTo((1.22 * 0.55) / 2.15, 4);
    const blue = M.optics(p({ obj: 100, cond: 0.9, filter: "blue" })).r;
    expect(blue).toBeGreaterThan(0.2);
    expect(blue).toBeLessThan(0.26);
    // closing the iris costs resolution: Pleurosigma's 0.65 µm rows are lost
    expect(M.optics(p({ obj: 40, cond: 0.2 })).r).toBeGreaterThan(0.65);
  });

  it("shrinks the field as the objective's power grows (18 mm ÷ 40 = 0.45 mm) and multiplies the powers", () => {
    [4, 10, 40, 100].forEach((o) => expect(M.optics(p({ obj: o })).field).toBeCloseTo(18000 / o, 6));
    expect(M.optics(p({ obj: 40, eye: 15 })).M).toBe(600);
  });

  it("calls magnification past 1000 × NA empty: a 10×/0.25 zoomed to 1600×", () => {
    const O = M.optics(p({ obj: 10, cond: 0.2, zoom: 16 }));
    expect(O.M).toBe(1600);
    expect(O.useful[1]).toBeCloseTo(250, 6);
    expect(O.empty).toBe(true);
    expect(M.optics(p({ obj: 40, cond: 0.45 })).empty).toBe(false);
  });

  it("dims the image as the power grows, and blurs the 100× used without its oil", () => {
    expect(M.optics(p({ obj: 100, cond: 0.9, lamp: 0.5 })).bright).toBeLessThan(M.optics(p({ obj: 10, cond: 0.18, lamp: 0.5 })).bright);
    const dry = M.optics(p({ obj: 100, cond: 0.9, oil: false })), oiled = M.optics(p({ obj: 100, cond: 0.9, oil: true }));
    expect(dry.noOil).toBe(true);
    expect(dry.r).toBeGreaterThan(2.5 * oiled.r);
  });

  it("counts cork as Hooke did: about 1,080 cells an inch, 1,259,712,000 in a cubic inch", () => {
    const cells = M.corkCells(1), h = ((25400 / 1080) * Math.sqrt(3)) / 2;
    [0, 3, -5].forEach((row) => {
      const C = M.corkCount({ cells }, 0, row * h, 1500);
      expect(C.perInch / 1080).toBeGreaterThan(0.95);
      expect(C.perInch / 1080).toBeLessThan(1.05);
    });
    expect(M.HOOKE.perSqInch).toBe(1080 ** 2);
    expect(M.HOOKE.perCuInch).toBe(1259712000);
  });

  it("finds how long mitosis takes from a root-tip count: the share dividing × the cycle, within the count's uncertainty", () => {
    expect(M.cycleHours(20)).toBe(20);
    expect(M.cycleHours(30)).toBeCloseTo(10, 6);
    const cells = M.rootCells(1), fov = 450;
    const R = M.rootCount({ cells }, M.fieldsOf(8, fov), fov), E = M.rootEstimate(R.tally, R.N, 20);
    const truth = (1 - M.PHASE_FRAC.I) * 20, f = 1 - R.tally.I / R.N, se = Math.sqrt((f * (1 - f)) / R.N) * 20;
    expect(R.N).toBeGreaterThan(2000);
    expect(Math.abs(E.mitosis - truth)).toBeLessThan(2.5 * se);
  });

  it("jiggles a 1 µm speck by Stokes–Einstein: D = 0.43 µm²/s at 20 °C, 2.6 µm in 4 s, faster when warm", () => {
    expect(M.viscosity(20)).toBeCloseTo(1.002e-3, 5);
    expect(M.diffusion(1, 20)).toBeCloseTo(0.4287, 3);
    expect(Math.sqrt(4 * M.diffusion(1, 20) * 4)).toBeCloseTo(2.62, 2);
    expect(M.diffusion(1, 40) / M.diffusion(1, 20)).toBeGreaterThan(1.6);
  });

  it("buds yeast every 1.5 h at 32 °C with sugar, not at all without it or past 45 °C, and kills it past 50 °C", () => {
    const td = Math.LN2 / M.yeastRate(32, 20);
    expect(td).toBeGreaterThan(1.5);
    expect(td).toBeLessThan(1.55);
    expect(M.yeastRate(30, 0)).toBe(0);
    expect(M.yeastRate(46, 20)).toBe(0);
    expect(M.yeastDeath(40)).toBe(0);
    expect(M.yeastDeath(60)).toBeGreaterThan(0.1);
  });

  it("dries a drop of brine only while the air is drier than 75 % — and takes water in, dissolving the salt, when it is damper", () => {
    expect(M.evapRate(0.56, 45, 25)).toBeGreaterThan(0);
    expect(M.evapRate(0.56, 80, 25)).toBeLessThan(0);
    const minutes = 88e-6 / M.evapRate(0.56, 45, 25) / 60;
    expect(minutes).toBeGreaterThan(2);
    expect(minutes).toBeLessThan(15);
  });

  it("bails a Paramecium out every 10 s in pond water, every 22 s at 0.1 % salt, and not at all past about 0.19 %", () => {
    expect(M.cvPeriod("paramecium", 0)).toBeCloseTo(10, 6);
    expect(M.cvPeriod("paramecium", 0.1)).toBeCloseTo(21.7, 1);
    expect(M.cvPeriod("paramecium", 0.2)).toBe(Infinity);
    expect(M.osmOf(0.185)).toBeCloseTo(64, 0);
  });

  it("turns a Congo-red food vacuole to about pH 3 in five minutes, and back as digestion ends", () => {
    expect(M.fvPH(0)).toBe(7);
    expect(M.fvPH(300)).toBeLessThan(3.2);
    expect(M.fvPH(1200)).toBeGreaterThan(6);
  });

  it("sinks Volvox fastest of the colonies (Stokes: as R²), yet every colony swims faster than it would sink", () => {
    Object.keys(M.COLONY).forEach((k) => expect(M.COLONY[k].swim).toBeGreaterThan(M.sinkSpeed(k)));
    Object.keys(M.COLONY).filter((k) => k !== "volvox").forEach((k) => expect(M.sinkSpeed("volvox")).toBeGreaterThan(M.sinkSpeed(k)));
    expect(M.COLONY.volvox.germ).toBeLessThan(0.01);
    expect(M.COLONY.gonium.germ).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * 6B-2 Inside the Cell: each model keeps the promises its text makes
 * ------------------------------------------------------------------ */
describe("6B-2 Inside the Cell — the models", () => {
  type P = Record<string, unknown>;
  type Bag = { V: number; Vmax: number; P: number; c0: unknown };
  type Piece = { caps: { day: number; f: number }[]; alive: boolean; kind?: string };
  const M = engine.InsightLab.models["g6b-inside-cell"] as unknown as {
    bagRun: (p: P, minutes: number) => Bag; massPct: (B: Bag) => number; cIn: (B: Bag, k: string) => number; cOut: (B: Bag, k: string) => number;
    PCT_PLAS50: number; pctLysed50: () => number; fracPlas: (s: number) => number; fracBurstProto: (s: number) => number; fracLysed: (s: number) => number;
    walled: (pi: number, po: number) => { v: number; P: number; plas: boolean }; piOut: (s: number) => number; rbcV: (s: number, V0?: number) => number;
    acetRun: (op: string, nuc: string, age: string, days: number, recut: boolean, stalk?: string) => Piece[];
    respRate: (kind: string, T: number) => number; reading: (kind: string, m: number, T: number, koh: boolean, t: number) => { O2: number; read: number }; drift: (t: number, T: number) => number;
    Iat: (d: number) => number; bubbles: (d: number, c: number, T: number, col: string) => number; compensation: (c: number, T: number, col: string) => number; heatUp: (d: number, shield: boolean) => number;
    absorb: (nm: number) => number; spotOnRibbon: (x: number) => number; leafStarch: (o: P) => number; iodineBlue: (s: number) => number;
    pinkFrac: (L: number, x: number) => number; KF: number; Rmax: (q: number, shape: string) => number; coreOf: (shape: string, a: number, q: number) => number;
    o2At: (shape: string, a: number, q: number, u: number) => number; shapeOf: (shape: string, R: number) => { a: number; len: number; vol: number };
    BASE: () => P;
  };
  const bag = (o: P, min: number) => M.bagRun(Object.assign({}, M.BASE(), o), min);

  it("a sucrose bag in water gains what classes measure: about 4 % in 30 minutes for every 0.2 M", () => {
    const got = [0.2, 0.4, 0.6, 0.8, 1.0].map((c) => M.massPct(bag({ fill: "sucrose", cIn: c, bath: "water", temp: 20 }, 30)));
    [3, 7, 11, 15, 18].forEach((want, i) => expect(Math.abs(got[i] - want)).toBeLessThan(2.5));
    for (let i = 1; i < got.length; i++) expect(got[i]).toBeGreaterThan(got[i - 1]);
    expect(M.massPct(bag({ fill: "water", bath: "sucrose", cOut: 0.5, temp: 20 }, 30))).toBeLessThan(-5);
    expect(Math.abs(M.massPct(bag({ fill: "sucrose", cIn: 0.5, bath: "sucrose", cOut: 0.5, temp: 20 }, 30)))).toBeLessThan(0.5);
  });

  it("the tubing fills tight and stops: 1 M sucrose after 4 hours presses at its full volume", () => {
    const B = bag({ fill: "sucrose", cIn: 1, bath: "water", temp: 20 }, 240);
    expect(B.V).toBeLessThanOrEqual(B.Vmax * 1.01);
    expect(B.P).toBeGreaterThan(0);
  });

  it("osmosis moves water, not salt: salt leaks out and the bag hardly gains; sucrose stays and it does", () => {
    const salt = bag({ fill: "salt", cIn: 0.5, bath: "water", temp: 20 }, 60), suc = bag({ fill: "sucrose", cIn: 0.5, bath: "water", temp: 20 }, 60);
    expect(M.cIn(salt, "salt") / 0.5).toBeLessThan(0.15);
    expect(Math.abs(M.massPct(salt))).toBeLessThan(2);
    expect(M.massPct(suc)).toBeGreaterThan(12);
  });

  it("starch stays in, iodine gets in, glucose gets out — and faster when warm", () => {
    const B = bag({ fill: "starch", cIn: 0.555, bath: "iodine", temp: 20 }, 10), W = bag({ fill: "starch", cIn: 0.555, bath: "iodine", temp: 40 }, 10);
    expect(M.cOut(B, "starch")).toBe(0);
    expect(M.cIn(B, "iodine") * 1000).toBeGreaterThan(0.5);
    expect(M.cOut(B, "glucose")).toBeGreaterThan(0);
    expect(M.cOut(W, "glucose") / M.cOut(B, "glucose")).toBeGreaterThan(1.3);
  });

  it("red onion cells plasmolyse half-way at 1.1 % salt, and stay firm below", () => {
    expect(M.PCT_PLAS50).toBeGreaterThan(1.05); expect(M.PCT_PLAS50).toBeLessThan(1.15);
    expect(M.fracPlas(0.9)).toBeLessThan(0.05); expect(M.fracPlas(1.5)).toBeGreaterThan(0.95);
    const w = M.walled(0.85, M.piOut(0));
    expect(w.P).toBeGreaterThan(0.7); expect(w.P).toBeLessThan(0.85); expect(w.v).toBeLessThan(1.12);
  });

  it("without its wall the same protoplast bursts in weak salt; with it, never", () => {
    expect(M.fracBurstProto(0)).toBeCloseTo(1, 9);
    expect(M.fracBurstProto(0.9)).toBeLessThan(0.1);
    expect(M.walled(0.85, M.piOut(0.01)).v).toBeLessThan(1.12);
  });

  it("red cells: 90 fL in 0.9 % salt, half burst near 0.43 % (the osmotic fragility test)", () => {
    expect(M.rbcV(0.9)).toBeGreaterThan(89); expect(M.rbcV(0.9)).toBeLessThan(92);
    const h = M.pctLysed50();
    expect(h).toBeGreaterThan(0.4); expect(h).toBeLessThan(0.45);
    expect(M.fracLysed(0.3)).toBeGreaterThan(0.95); expect(M.fracLysed(0.6)).toBeLessThan(0.03);
    expect(M.rbcV(3)).toBeLessThan(0.85 * 90);
  });

  it("Hämmerling: a stalk alone makes one cap; the base makes cap after cap; a graft's caps turn to the nucleus's kind", () => {
    const decap = M.acetRun("decap", "med", "mature", 100, true)[0];
    expect(decap.caps.length).toBeGreaterThanOrEqual(5); decap.caps.forEach((c) => expect(c.f).toBe(0));
    const [cap, stalk, base] = M.acetRun("pieces", "med", "mature", 100, true);
    expect(cap.alive).toBe(false); expect(stalk.caps.length).toBe(1); expect(stalk.alive).toBe(false);
    expect(base.caps.length).toBeGreaterThanOrEqual(4);
    expect(M.acetRun("pieces", "med", "young", 100, true)[1].caps.length).toBe(0);
    const g = M.acetRun("graft", "cren", "mature", 100, true)[0].caps.map((c) => c.f);
    expect(g[0]).toBeGreaterThan(0.35); expect(g[0]).toBeLessThan(0.5);
    expect(g[1]).toBeGreaterThan(0.75); expect(g[2]).toBeGreaterThan(0.9);
    expect(M.acetRun("graft", "cren", "mature", 100, false)[0].caps.length).toBe(1);
    const two = M.acetRun("two", "med", "mature", 100, true, "med")[0].caps;
    expect(Math.abs(two[two.length - 1].f - 0.5)).toBeLessThan(0.05);
  });

  it("the respirometer: 10 g of peas take 0.16 mL in 20 min at 22 °C; Q10 2.1; dead peas none; no KOH, no movement", () => {
    const r = M.reading("peas", 10, 22, true, 1200), d = M.drift(1200, 22);
    expect(Math.abs(r.read - d - 0.16)).toBeLessThan(0.02);
    expect(M.respRate("peas", 32) / M.respRate("peas", 22)).toBeCloseTo(2.1, 5);
    expect(M.respRate("dry", 22) / M.respRate("peas", 22)).toBeCloseTo(0.02, 5);
    expect(M.respRate("boiled", 22)).toBe(0);
    expect(Math.abs(M.reading("peas", 10, 22, false, 1200).read - d)).toBeLessThan(1e-9);
    expect(M.reading("maggots", 3, 22, false, 1200).read - d).toBeCloseTo(0.2 * M.reading("maggots", 3, 22, true, 1200).O2, 9);
    expect(M.respRate("peas", 45)).toBe(0);
  });

  it("Elodea: light falls as 1/d², bubbles stop past the compensation point, green and no CO₂ slow it", () => {
    expect(M.Iat(20)).toBeCloseTo(150, 6);
    expect(M.bubbles(30, 0.2, 20, "white")).toBeLessThan(M.bubbles(15, 0.2, 20, "white"));
    const c = M.compensation(0.2, 20, "white");
    expect(c).toBeGreaterThan(50); expect(c).toBeLessThan(80);
    expect(M.bubbles(c + 2, 0.2, 20, "white")).toBe(0);
    expect(M.bubbles(20, 0.2, 20, "green")).toBeLessThan(0.5 * M.bubbles(20, 0.2, 20, "white"));
    expect(M.bubbles(15, 0, 20, "white")).toBeLessThan(0.2 * M.bubbles(15, 0.2, 20, "white"));
    expect(M.heatUp(10, false)).toBeCloseTo(4, 6); expect(M.heatUp(10, true)).toBeCloseTo(0.4, 6);
  });

  it("Engelmann: the alga absorbs blue and red, passes green; a spot makes oxygen only on the ribbon", () => {
    expect(M.absorb(450)).toBeGreaterThan(0.8); expect(M.absorb(675)).toBeGreaterThan(0.8); expect(M.absorb(550)).toBeLessThan(0.35);
    expect(M.spotOnRibbon(0)).toBeGreaterThan(0.15);
    expect(M.spotOnRibbon(27.5)).toBeLessThan(0.05);
  });

  it("the leaf: starch only where green and lit, if the old starch was used up first", () => {
    const blue = (o: P) => M.iodineBlue(M.leafStarch(Object.assign({ hours: 6, destarch: true }, o)));
    expect(blue({ green: true, lit: true })).toBeGreaterThan(0.9);
    expect(blue({ green: true, lit: false })).toBe(0);
    expect(blue({ green: false, lit: true })).toBe(0);
    expect(blue({ green: true, lit: false, destarch: false })).toBeGreaterThan(0.8);
  });

  it("agar cubes: 78 % of a 10 mm cube in 10 min; 4.2 h to the middle of a 20 mm one", () => {
    expect(M.pinkFrac(10, 2)).toBeCloseTo(0.784, 3);
    expect(Math.pow(10 / M.KF, 2) / 3600).toBeCloseTo(4.1667, 3);
  });

  it("a busy cell starves past about 106 µm; flat or thin shapes hold the same volume and more reach", () => {
    expect(M.Rmax(0.3, "sphere")).toBeCloseTo(105.8, 1);
    expect(M.Rmax(0.3, "flat")).toBeCloseTo(61.1, 1);
    expect(M.Rmax(0.3, "thread")).toBeCloseTo(86.4, 1);
    expect(M.coreOf("sphere", 200, 0.3)).toBeGreaterThan(120); expect(M.coreOf("sphere", 200, 0.3)).toBeLessThan(140);
    expect(M.o2At("sphere", 200, 0.3, 0)).toBeCloseTo(1, 6); expect(M.o2At("sphere", 200, 0.3, 1)).toBe(0);
    expect(M.o2At("sphere", 90, 0.3, 1)).toBeGreaterThan(0);
    expect(M.coreOf("sphere", 700, 1.5e-4)).toBe(0);
    const R = 150, V = (4 / 3) * Math.PI * R ** 3;
    for (const sh of ["flat", "thread"]) expect(M.shapeOf(sh, R).vol / V).toBeCloseTo(1, 6);
    const f = M.shapeOf("flat", R), t = M.shapeOf("thread", R);
    expect(Math.PI * (5 * f.a) ** 2 * 2 * f.a / V).toBeCloseTo(1, 6);
    expect(Math.PI * t.a ** 2 * 40 * t.a / V).toBeCloseTo(1, 6);
    expect(M.coreOf("flat", f.a, 0.3)).toBeLessThan(M.coreOf("sphere", R, 0.3));
  });
});
