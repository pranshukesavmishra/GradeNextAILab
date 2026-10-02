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

describe("6B-3 Levels of Organization — the models", () => {
  type P = Record<string, unknown>;
  type Shape = { A: number; V: number; D: number; tube: number; t95: number };
  type Run = { fails: Record<string, number>; T0: number };
  const M = engine.InsightLab.models["g6b-levels"] as unknown as {
    CELLS_70: number; cellsIn: (kg: number) => number; ANIMALS: Record<string, { kg: number; rbc: number }>;
    rbcShape: (s: number) => Shape; loaded: (sh: Shape, t: number) => number;
    oneCell: (L: number, d: number, my: boolean) => number; chainTime: (L: number, d: number, my: boolean, c: number) => number;
    rootArea: (len: number, den: number) => { base: number; total: number };
    peakForce: (p: P) => number; fMax: (p: P) => number; tewl: (n: number, rh: number, T: number) => number;
    utsOf: (d: boolean) => number; strainOf: (s: number, d: boolean) => number;
    barrier: (pH: number, L: number, J: number) => { pHs: number; surfH: number };
    mealRun: (bite: number, waves: number, muscle: number, seed: number) => { t50: number; left4h: number };
    bodyRun: (p: P) => Run; firstFail: (R: Run) => string | null; BASE: () => P;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });

  it("counts 3.72 × 10¹³ cells in a 70 kg adult (Bianconi 2013); a mouse has as many per kilogram, not bigger ones", () => {
    expect(M.CELLS_70 / 3.72e13).toBeCloseTo(1, 9);
    expect(M.cellsIn(0.025) / 1e9).toBeCloseTo(13.29, 1);
    expect(M.ANIMALS.elephant.rbc / M.ANIMALS.mouse.rbc).toBeLessThan(1.5);
    expect(M.ANIMALS.goat.rbc).toBeLessThan(M.ANIMALS.cat.rbc);
  });

  it("builds the Evans–Fung red cell: 7.82 µm, 94 fL, 134 µm²; it folds through a 3.0 µm tube, a sphere of the same volume needs 5.64 µm", () => {
    const d = M.rbcShape(0), s = M.rbcShape(1);
    expect(d.D).toBeCloseTo(7.82, 2); expect(d.V).toBeCloseTo(94.1, 0); expect(d.A).toBeCloseTo(134.1, 0);
    expect(d.tube).toBeGreaterThan(2.8); expect(d.tube).toBeLessThan(3.1);       // Canham & Burton 1968: about 2.8–3 µm
    expect(s.tube).toBeCloseTo(Math.cbrt((6 * d.V) / Math.PI), 2);
    expect(s.A).toBeCloseTo(4 * Math.PI * (s.tube / 2) ** 2, 0);
  });

  it("loads the disc about four times faster than the sphere; in a 0.25 s exercise transit the sphere falls short", () => {
    const d = M.rbcShape(0), s = M.rbcShape(1);
    expect(s.t95 / d.t95).toBeGreaterThan(3.5); expect(s.t95 / d.t95).toBeLessThan(4.5);
    expect(M.loaded(d, 0.25)).toBeGreaterThan(0.98); expect(M.loaded(s, 0.25)).toBeLessThan(0.82);
  });

  it("carries a signal 1 m in 16.7 ms along one myelinated 10 µm axon; a chain of 100 µm cells takes 5 s", () => {
    expect(M.oneCell(1, 10, true) * 1000).toBeCloseTo(16.67, 2);
    expect(M.chainTime(1, 10, true, 100)).toBeCloseTo(5.0162, 3);
  });

  it("root hairs multiply 1 cm of root's surface several times; none, none added", () => {
    const r = M.rootArea(0.7, 100);
    expect(r.base).toBeCloseTo(2 * Math.PI * 0.25 * 10, 6);
    expect(r.total / r.base).toBeGreaterThan(3); expect(M.rootArea(0, 0).total).toBeCloseTo(r.base, 9);
  });

  it("muscle: a twitch is ¼ of tetanus; slow fibres fuse by 50 Hz, fast ones need ~100; force = 22.5 N/cm² × area", () => {
    expect(M.peakForce(p({ freq: 0.5 })) / M.fMax(p({}))).toBeCloseTo(0.25, 2);
    expect(M.peakForce(p({ freq: 50, ftype: "slow" })) / M.fMax(p({}))).toBeGreaterThan(0.95);
    expect(M.peakForce(p({ freq: 50, ftype: "fast" })) / M.fMax(p({}))).toBeLessThan(0.8);
    expect(M.fMax(p({ lcsa: Math.log10(5), volt: 10 }))).toBeCloseTo(112.5, 0);
    expect(M.fMax(p({ volt: 2 }))).toBeLessThan(0.1 * M.fMax(p({ volt: 8 })));
  });

  it("skin: about 8 g/m²/h through intact skin, rising steeply as tape strips the layers off", () => {
    expect(M.tewl(0, 40, 22)).toBeCloseTo(8, 0);
    expect(M.tewl(20, 40, 22)).toBeGreaterThan(2.5 * M.tewl(0, 40, 22));
    expect(M.tewl(0, 90, 22)).toBeLessThan(M.tewl(0, 40, 22));
  });

  it("tendon: breaks at 100 MPa — an Achilles of 65 mm² at 6.5 kN; collagenase weakens it", () => {
    expect(M.utsOf(false) * 65).toBe(6500);
    expect(M.utsOf(true)).toBeLessThan(M.utsOf(false));
    expect(M.strainOf(18, false)).toBeCloseTo(0.03, 3);
  });

  it("stomach: the gel keeps the lining near pH 7 at lumen pH 2; aspirin's thinner gel lets acid reach it at 1.5", () => {
    expect(M.barrier(2, 150, 3).pHs).toBeGreaterThan(7);
    expect(M.barrier(2, 0, 3).pHs).toBeCloseTo(2, 6);
    expect(M.barrier(1.5, 82.5, 1.05).surfH).toBeGreaterThan(5);
    const meal = M.mealRun(8, 3, 1, 7), weak = M.mealRun(8, 3, 0.25, 7);
    expect(meal.t50).toBeGreaterThan(45); expect(meal.t50).toBeLessThan(90);     // solids: t½ about an hour
    expect(meal.left4h).toBeLessThan(0.1); expect(weak.left4h).toBeGreaterThan(0.1);   // > 10 % at 4 h: gastroparesis
  });

  it("the whole body: heart 10 s, breath 2.9 min (10 after pure O₂), liver ~1 h, gut ~3 days, kidneys ~6 days", () => {
    const at = (o: P) => { const R = M.bodyRun(p(o)), f = M.firstFail(R); return f ? R.fails[f] : Infinity; };
    expect(at({ organ: "heart" })).toBeCloseTo(9.8, 0);
    expect(at({ organ: "lungs" }) / 60).toBeCloseTo(2.9, 1);
    expect(at({ organ: "lungs", pure: true }) / 60).toBeGreaterThan(9);
    expect(at({ organ: "liver" }) / 3600).toBeLessThan(2);
    expect(at({ organ: "gut" }) / 86400).toBeCloseTo(2.8, 0);
    expect(at({ organ: "kidneys" }) / 86400).toBeGreaterThan(5);
    expect(at({ organ: "none" })).toBe(Infinity);
    expect(at({ organ: "skin" })).toBe(Infinity);
    expect(at({ organ: "skin", act: "run", airT: 25 }) / 60).toBeLessThan(45);
  });
});

describe("6B-4 The Body Systems Bench — the models", () => {
  type P = Record<string, unknown>;
  type Kid = { at: (m: number) => { V: number; Uosm: number; urine: number; adh: number } };
  const M = engine.InsightLab.models["g6b-systems-bench"] as unknown as {
    amyRun: (p: P) => { end: number }; amyRate: (p: P, S: number, a: number) => number;
    kidneyRun: (p: P) => Kid; sgOf: (o: number) => number; KID: { GFR: number };
    cardiacOut: (p: P) => number; meanP: (p: P) => number; pulseP: (p: P) => number; branchFlow: (p: P, n?: number) => number;
    poiseuilleRatio: (p: P) => number; eta: (h: number) => number;
    boyle: (p: P, pull: number) => { vb: number; dP: number; dV: number };
    armForces: (p: P) => { bic: number; tri: number; load: number };
    trialsOf: (p: P) => { t: number; d: number; caught: boolean }[]; tOfD: (d: number) => number; BASE: () => P;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });

  it("amylase: Q10 = 2 halves the rate 10 °C colder; it clears starch fastest near 40 °C and never at 60 °C or in stomach acid", () => {
    expect(M.amyRate(p({ temp: 27 }), 1, 1) / M.amyRate(p({ temp: 37 }), 1, 1)).toBeCloseTo(0.5, 6);
    const end = (o: P) => M.amyRun(p(o)).end;
    expect(end({ temp: 37 })).toBeLessThan(end({ temp: 20 }));
    expect(end({ temp: 45 })).toBeLessThan(end({ temp: 37 }));
    expect(end({ temp: 60 })).toBe(Infinity); expect(end({ temp: 5 })).toBe(Infinity);
    expect(end({ pH: 2 })).toBe(Infinity); expect(end({ boiled: true })).toBe(Infinity);
  });

  it("kidneys: 125 mL/min is 180 L a day; a litre of water brings ~12 mL/min of dilute urine, saline barely any; no ADH, ~17 L a day", () => {
    expect(M.KID.GFR * 1440 / 1000).toBe(180);
    const w = M.kidneyRun(p({ kind: "water" })), s = M.kidneyRun(p({ kind: "saline" }));
    let peak = 0; for (let m = 0; m <= 240; m += 1) peak = Math.max(peak, w.at(m).V);
    expect(peak).toBeGreaterThan(10); expect(peak).toBeLessThan(14);
    expect(w.at(180).urine / s.at(180).urine).toBeGreaterThan(3.5);
    expect(w.at(90).Uosm).toBeLessThan(100);
    expect(M.kidneyRun(p({ kind: "none", adh: "none" })).at(200).V * 1.44).toBeCloseTo(17.3, 0);
    expect(M.sgOf(1000)).toBeCloseTo(1.026, 3);
  });

  it("circulation: 70 × 70 mL ≈ 4.9 L/min at 93 mmHg, 120/73; halving the width is 16× the resistance; flow halves near 80 %", () => {
    expect(M.cardiacOut(p({}))).toBeCloseTo(4.9, 6);
    expect(M.meanP(p({}))).toBeCloseTo(93, 6);
    expect(M.pulseP(p({}))).toBeCloseTo(46.7, 1);
    expect(M.poiseuilleRatio(p({ narrow: 50 }))).toBeCloseTo(16, 6);
    const f = (n: number) => M.branchFlow(p({}), n) / M.branchFlow(p({}), 0);
    expect(f(0.5)).toBeGreaterThan(0.95); expect(f(0.8)).toBeGreaterThan(0.4); expect(f(0.8)).toBeLessThan(0.5); expect(f(0.9)).toBeLessThan(0.1);
    expect(M.eta(0.45)).toBeCloseTo(4.34, 2);
    const ex = p({ hr: 150, sv: 100 });
    expect(M.meanP(ex)).toBeGreaterThan(100); expect(M.meanP(ex)).toBeLessThan(120);     // exercise: resistance falls, pressure rises gently
    expect(M.branchFlow(ex, 0.7) / M.branchFlow(ex, 0)).toBeLessThan(0.65);               // the same plaque bites harder in exercise
  });

  it("bell jar: Boyle's law; a hole stops the lungs filling; a real chest takes ~370 mL for 1.5 cm of diaphragm", () => {
    const B = M.boyle(p({}), 3);
    expect(101325 * 2.0 / (2.0 + B.dV - B.vb)).toBeCloseTo(101325 + B.dP, 3);
    expect(B.vb).toBeGreaterThan(0.2);
    expect(M.boyle(p({ hole: true }), 3).vb).toBe(0);
    expect(M.boyle(p({ model: "chest" }), 1.5).vb).toBeCloseTo(0.37, 2);
    expect(M.boyle(p({ model: "chest", comp: "stiff" }), 1.5).vb).toBeLessThan(M.boyle(p({ model: "chest" }), 1.5).vb);
  });

  it("forearm lever: 5 kg at 90° takes ~490 N of biceps; pushing down works the triceps instead", () => {
    const A = M.armForces(p({}));
    expect(A.bic).toBeCloseTo(488.7, 0); expect(A.tri).toBe(0);
    const Pu = M.armForces(p({ mode: "push" }));
    expect(Pu.bic).toBe(0); expect(Pu.tri).toBeGreaterThan(500);
  });

  it("ruler drop: t = √(2d/g) — 19.6 cm is 0.200 s; a 30 cm ruler times up to 0.247 s; texting drops it", () => {
    expect(M.tOfD(0.196)).toBeCloseTo(0.2, 3);
    expect(M.tOfD(0.3)).toBeCloseTo(0.247, 3);
    const T = M.trialsOf(p({})), D = M.trialsOf(p({ distract: true }));
    T.forEach((t) => expect(t.d).toBeCloseTo(0.5 * 9.81 * t.t * t.t, 9));
    expect(D.filter((t) => !t.caught).length).toBeGreaterThan(T.filter((t) => !t.caught).length);
  });
});

describe("6B-5 The Body During Exercise — the models", () => {
  type P = Record<string, unknown>;
  type Row = { HR: number; SV: number; CO: number; vo2: number; vmax: number; VE: number; paco2: number; pao2: number; sat: number; L: number; temp: number; water: number; flow: Record<string, number> };
  type Proto = { T: (p: P) => number; power: (p: P) => (t: number) => number; gas: (p: P) => (t: number) => string };
  const M = engine.InsightLab.models["g6b-exercise"] as unknown as {
    bodyRun: (p: P, power: (t: number) => number, gas: (t: number) => string, T: number, dt: number) => Row[];
    PROTO: Record<string, Proto>; mealRun: (p: P) => { peak: { G: number; m: number }; g2h: number; at: (m: number) => { G: number } };
    endurance: (p: P, f: number) => number; holdRun: (p: P, T: number, dt: number) => { out: { n: number; emg: number; F: number }[] }; BASE: () => P;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });
  const run = (o: P, dt = 1) => { const q = p(o), pr = M.PROTO[q.setup as string]; return M.bodyRun(q, pr.power(q), pr.gas(q), pr.T(q), dt); };

  it("riding: O₂ rises ~11.8 mL/min per W; heart rate = output ÷ stroke volume; breathing holds CO₂ at 40", () => {
    const R = run({ setup: "exercise", power: 120, ride: 6 }), r = R[15 + 350];
    expect(r.vo2).toBeCloseTo(0.216 + 0.0118 * 120, 2);
    expect(r.HR).toBeCloseTo((r.CO * 1000) / r.SV, 6);
    expect(r.HR).toBeGreaterThan(140); expect(r.HR).toBeLessThan(165);
    expect(r.paco2).toBeCloseTo(40, 0); expect(r.sat).toBeGreaterThan(0.95);
    expect(r.flow.muscle).toBeGreaterThan(4 * R[5].flow.muscle);
    expect(r.flow.gut).toBeLessThan(R[5].flow.gut);
  });

  it("training raises stroke volume and VO₂max, so the same ride costs fewer beats", () => {
    const u = run({ setup: "exercise", power: 100 })[300], t = run({ setup: "exercise", power: 100, fit: "trained" })[300];
    expect(t.HR).toBeLessThan(u.HR - 20); expect(t.vmax).toBeGreaterThan(u.vmax);
  });

  it("breathing follows CO₂: 5 % CO₂ nearly quadruples it; 12 % O₂ barely raises it though SpO₂ falls to ~75 %", () => {
    const c = run({ setup: "oxygen", gas: "co2", power: 0 }), h = run({ setup: "oxygen", gas: "hypox", power: 0 });
    expect(c[290].VE / c[10].VE).toBeGreaterThan(3.3);
    expect(h[290].VE / h[10].VE).toBeLessThan(1.4); expect(h[290].sat).toBeLessThan(0.8);
  });

  it("a 75 g glucose drink: peak ~9, back under 7.8 by 2 h when healthy; type 2 at or above 11.1 (WHO)", () => {
    const n = M.mealRun(p({ setup: "meal" })), t2 = M.mealRun(p({ setup: "meal", diab: "type2" }));
    expect(n.peak.G).toBeGreaterThan(7.5); expect(n.peak.G).toBeLessThan(10); expect(n.g2h).toBeLessThan(7.8);
    expect(t2.g2h).toBeGreaterThanOrEqual(11.1);
    expect(M.mealRun(p({ setup: "meal", food: "pasta" })).peak.G).toBeLessThan(n.peak.G);
    expect(M.mealRun(p({ setup: "meal", carbs: 10 })).at(240).G).toBeCloseTo(5, 1);
  });

  it("motor units: Rohmert's endurance — 50 % held about a minute, 15 % for many minutes; EMG grows as units tire", () => {
    const q = p({ setup: "move" });
    expect(M.endurance(q, 50)).toBeGreaterThan(45); expect(M.endurance(q, 50)).toBeLessThan(90);
    expect(M.endurance(q, 15)).toBeGreaterThan(300);
    const H = M.holdRun(p({ setup: "move", force: 30 }), 60, 0.5).out;
    expect(H[120].emg).toBeGreaterThan(H[0].emg); expect(H[120].n).toBeGreaterThanOrEqual(H[0].n);
    expect(H[120].F).toBeCloseTo(30, 0);
  });

  it("broken systems are covered by the others: anaemia raises heart rate and lactate, asthma lets CO₂ rise", () => {
    const h = run({ setup: "break", fault: "anaemia", power: 0 + 100 }), healthy = run({ setup: "exercise", power: 100 });
    expect(h[300].HR).toBeGreaterThan(healthy[300].HR + 20); expect(h[300].L).toBeGreaterThan(2);
    expect(run({ setup: "break", fault: "asthma", power: 100 })[300].paco2).toBeGreaterThan(45);
  });

  it("two hours in the heat: water lost, the heart drifts up, drinking softens it", () => {
    const dry = run({ setup: "balance", airT: 32, power: 80, drink: 0, hours: 2 }, 10), wet = run({ setup: "balance", airT: 32, power: 80, drink: 0.8, hours: 2 }, 10);
    expect(dry[719].water).toBeGreaterThan(0.8); expect(dry[719].HR).toBeGreaterThan(dry[60].HR);
    expect(wet[719].HR).toBeLessThan(dry[719].HR);
  });
});
