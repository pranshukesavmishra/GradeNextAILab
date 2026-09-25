import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";
import { MS_LABS, msTeaching } from "./msLabs";
import { CURRICULA } from "./index";

/**
 * The Grades 6–8 Smart Lab catalogue (msLabs.ts) and the engine (smartlab/)
 * describe the same labs twice. This loads the engine's own lab sources — the
 * core and every sims-g*.js file its index.html loads, in load order — into a
 * bare VM, reads what registered, and fails the moment the two disagree. Then it
 * runs each lab's own apparatus on the numbers its problems and notes promise.
 *
 * A Grades 6–8 lab file must therefore load without a DOM: drawing code may use
 * the page, registration and the model may not.
 */

const SMARTLAB = fileURLToPath(new URL("../../../smartlab", import.meta.url));

interface Def {
  id: string; grade?: number; unit?: string; topics?: string[]; name: string; subject: string;
  params: Record<string, unknown>;
  controls: { items: { key: string; options?: { value: string; label: string; teaches?: string[] }[] }[] }[];
  problems?: { params?: Record<string, unknown>; measure: (S: { p: Record<string, unknown> }) => number }[];
}
interface Engine { __REG: Def[]; InsightLab: { models: Record<string, Record<string, (...a: never[]) => unknown>> } }

function loadEngine(): Engine {
  const html = readFileSync(join(SMARTLAB, "index.html"), "utf8");
  const files = [...html.matchAll(/src="(sims-g\d[a-z]-\d+\.js)"/g)].map((m) => m[1]);
  const ctx: Record<string, unknown> = {
    console, Math, Float64Array, Uint8Array, Array, Object, JSON, Number, String, isFinite,
    Infinity, NaN, Date, Error, performance: { now: () => Date.now() },
  };
  ctx.window = ctx;
  ctx.devicePixelRatio = 1;
  vm.createContext(ctx);
  for (const f of ["lab-core.js", ...files]) {
    vm.runInContext(readFileSync(join(SMARTLAB, f), "utf8"), ctx, { filename: f });
  }
  return ctx as unknown as Engine;
}

const engine = loadEngine();
const defs = (engine.__REG ?? []).filter((d) => typeof d.grade === "number");
const setupsOf = (d: Def) => d.controls.flatMap((g) => g.items).find((i) => i.key === "setup")?.options ?? [];

describe("Grades 6–8 catalogue matches the Smart Lab engine", () => {
  it("finds the Grades 6–8 labs the engine registers", () => {
    expect(defs.length).toBeGreaterThanOrEqual(1);
  });

  it("lists exactly the engine's Grades 6–8 labs, in load order", () => {
    expect(MS_LABS.map((l) => l.id)).toEqual(defs.map((d) => d.id));
  });

  for (const lab of MS_LABS) {
    it(`${lab.id}: grade, unit, topics, subject and name agree`, () => {
      const d = defs.find((x) => x.id === lab.id)!;
      expect(d.grade).toBe(lab.grade);
      expect(d.unit).toBe(`${lab.grade}${lab.unit}`);
      expect(d.topics).toEqual(lab.topics);
      expect(d.subject).toBe(lab.subject);
      expect(d.name).toBe(lab.name);
    });

    it(`${lab.id}: every set-up, its label and what it teaches agree`, () => {
      const d = defs.find((x) => x.id === lab.id)!;
      expect(setupsOf(d).map((o) => ({ value: o.value, label: o.label, teaches: o.teaches ?? [] })))
        .toEqual(lab.setups.map((s) => ({ value: s.value, label: s.label, teaches: s.teaches })));
    });
  }
});

describe("Grades 6–8 labs run every set-up without a page", () => {
  for (const d of defs) {
    for (const o of setupsOf(d)) {
      it(`${d.id}/${o.value}: sets up, steps and reports finite numbers`, () => {
        const run = d as unknown as { setup: (S: unknown) => void; step: (S: unknown, dt: number) => void;
          readouts: (S: unknown) => { label: string; value: string }[]; equation?: (S: unknown) => string };
        const S = { p: Object.assign({}, d.params, { setup: o.value }), t: 0, cam: null };
        run.setup(S);
        for (let k = 0; k < 20; k++) run.step(S, 0.05);
        const ro = run.readouts(S);
        expect(ro.length).toBeGreaterThan(0);
        for (const r of ro) expect(String(r.value), r.label).not.toMatch(/NaN|Infinity|undefined/);
        if (run.equation) expect(run.equation(S)).not.toMatch(/NaN|undefined/);
      });
    }
  }
});

describe("Grades 6–8 labs cover the curriculum they claim", () => {
  for (const lab of MS_LABS) {
    const grade = CURRICULA.find((c) => c.grade === lab.grade)!;
    const unit = grade.units.find((u) => u.code === lab.unit);

    it(`${lab.id}: its unit exists and every code it teaches is a subtopic of a topic it claims`, () => {
      expect(unit, `unit ${lab.unit} of grade ${lab.grade}`).toBeDefined();
      const claimed = unit!.topics.filter((t) => lab.topics.includes(t.code));
      expect(claimed.map((t) => t.code)).toEqual(lab.topics);
      const codes = new Set(claimed.flatMap((t) => t.subtopics.map((s) => s.code)));
      for (const s of lab.setups) {
        expect(s.teaches.length, `${s.value} teaches nothing`).toBeGreaterThan(0);
        for (const c of s.teaches) expect(codes.has(c), `${s.value} teaches ${c}`).toBe(true);
      }
    });

    it(`${lab.id}: every subtopic of every topic it claims is taught by one of its set-ups`, () => {
      for (const t of unit!.topics.filter((x) => lab.topics.includes(x.code))) {
        for (const s of t.subtopics) {
          expect(msTeaching(lab.grade, s.code).some((m) => m.lab.id === lab.id), `${s.code} ${s.title}`).toBe(true);
        }
      }
    });
  }
});

/* ------------------------------------------------------------------ *
 * 6A-1 The Living Tank: the model keeps the promises its text makes
 * ------------------------------------------------------------------ */
describe("6A-1 The Living Tank — the model", () => {
  const M = engine.InsightLab.models["g6a-living-tank"] as unknown as {
    o2sat: (T: number) => number; freeNH3frac: (pH: number, T: number) => number;
    kHco2: (T: number) => number; BASE: () => Record<string, unknown>;
    blindOrder: (p: Record<string, unknown>, noise: number, stems?: unknown[]) => number;
  };
  const def = defs.find((d) => d.id === "g6a-living-tank")!;
  const measure = (k: number) => {
    const pr = def.problems![k];
    return pr.measure({ p: Object.assign({}, def.params, pr.params ?? {}) });
  };

  it("holds as much O₂ as Benson–Krause says fresh water can", () => {
    expect(M.o2sat(20)).toBeCloseTo(9.09, 1);
    expect(M.o2sat(25)).toBeCloseTo(8.26, 1);
    expect(M.o2sat(30)).toBeCloseTo(7.54, 1);
  });

  it("puts about half a per cent of the ammonia in the toxic free form at pH 7, 25 °C (Emerson)", () => {
    expect(M.freeNH3frac(7, 25) * 100).toBeCloseTo(0.56, 1);
  });

  it("dissolves about 0.6 mg/L of CO₂ from 420 ppm air at 25 °C (Weiss)", () => {
    expect(M.kHco2(25) * 420e-6 * 44009).toBeGreaterThan(0.55);
    expect(M.kHco2(25) * 420e-6 * 44009).toBeLessThan(0.7);
  });

  it("leaves the fish gasping by 07:00 after a power cut on a hot night", () => {
    const o2 = measure(0);
    expect(o2).toBeGreaterThan(1.3);
    expect(o2).toBeLessThan(2.5);
  });

  it("builds ammonia to a test-kit 0.5 mg/L within a few days of rinsing the media in tap water", () => {
    const h = measure(1);
    expect(h).toBeGreaterThan(18);
    expect(h).toBeLessThan(72);
  });

  it("keeps every milligram of carbon inside the sealed sphere for 30 days", () => {
    expect(Math.abs(measure(2) - 52.171)).toBeLessThan(5e-4);
  });

  it("gives one neon at 25 °C about 0.18 mg of O₂ an hour, as the boundary problem's working says", () => {
    const pr = def.problems![3];
    const S: Record<string, unknown> & { p: Record<string, unknown> } = { p: Object.assign({}, def.params, pr.params ?? {}), t: 0, cam: null };
    (def as unknown as { setup: (S: unknown) => void }).setup(S);
    expect(pr.measure(S)).toBeGreaterThan(0.16);
    expect(pr.measure(S)).toBeLessThan(0.20);
  });

  it("orders the shoal when turning is small and loses it when turning is large", () => {
    const p = Object.assign({}, M.BASE(), { setup: "shoal" });
    const calm = M.blindOrder(p, 0, []), mid = M.blindOrder(p, 3, []), wild = M.blindOrder(p, 4, []);
    expect(calm).toBeGreaterThan(0.9);
    expect(mid).toBeGreaterThan(0.35);
    expect(mid).toBeLessThan(0.8);
    expect(wild).toBeLessThan(0.45);
  });
});

/* ------------------------------------------------------------------ *
 * 6A-2 The Draining Tank: the apparatus obeys Torricelli, and the lab's claims hold
 * ------------------------------------------------------------------ */
describe("6A-2 The Draining Tank — the model", () => {
  type Fx = Record<string, boolean>;
  const M = engine.InsightLab.models["g6a-draining-tank"] as unknown as {
    drainTime: (dmm: number, h0: number, fx: Fx, s?: number) => number | null;
    halfTime: (dmm: number, h0: number, fx: Fx, s?: number) => number | null;
    steadyLevel: (dmm: number, q: number, fx: Fx) => number;
    towerModel: (p: Record<string, unknown>) => { dry: number | null };
    ALL: Fx; BASE: () => Record<string, unknown>;
  };
  const def = defs.find((d) => d.id === "g6a-draining-tank")!;
  const measure = (k: number) => {
    const pr = def.problems![k];
    return pr.measure({ p: Object.assign({}, def.params, pr.params ?? {}) });
  };

  it("drains a 10 cm column through a 6 mm hole from 50 cm as Torricelli says, once the jet narrows", () => {
    // exact, to empty, Cd 0.61: t = (A / (Cd·a))·√(2h₀/g) = 143.9 s; the real jet stops ~3 s before the last film
    const exact = (0.05 ** 2 / (0.61 * 0.003 ** 2)) * Math.sqrt(2 * 0.49 / 9.81);
    const t = M.drainTime(6, 0.5, { vena: true }, 1)!;
    expect(Math.abs(t - exact) / exact).toBeLessThan(0.03);
  });

  it("scales half-times with the square root of size, not with size", () => {
    const full = M.halfTime(6, 0.5, M.ALL, 1)!, quarter = M.halfTime(6, 0.125, M.ALL, 4)!;
    expect(full / quarter).toBeGreaterThan(1.85);
    expect(full / quarter).toBeLessThan(2.1);
  });

  it("lets surface tension stop the 1:10 copy before its head halves", () => {
    expect(M.halfTime(6, 0.05, M.ALL, 10)).toBeNull();
  });

  it("changes the drain time by about −39 % without the vena contracta, and not measurably without evaporation", () => {
    expect(measure(3)).toBeGreaterThan(-42);
    expect(measure(3)).toBeLessThan(-36);
    const t0 = M.drainTime(6, 0.5, M.ALL)!, t1 = M.drainTime(6, 0.5, Object.assign({}, M.ALL, { evap: false }))!;
    expect(Math.abs(t1 - t0) / t0).toBeLessThan(1e-4);
  });

  it("settles a 1.5 L/min tap on the 6 mm hole near 12 cm, as the diagram problem's working says", () => {
    expect(measure(1)).toBeGreaterThan(10.5);
    expect(measure(1)).toBeLessThan(13.5);
  });

  it("runs the town's tower dry in the model some ten hours after the pump fails, and earlier with the leaks in", () => {
    const p = M.BASE();
    const plain = M.towerModel(p).dry!, leaky = M.towerModel(Object.assign({}, p, { leakModel: true })).dry!;
    expect(plain).toBeGreaterThan(8);
    expect(plain).toBeLessThan(12);
    expect(leaky).toBeLessThan(plain);
  });

  it("finds the square-root law in the data: its residuals look like noise, the straight line's do not", () => {
    const run = (fam: string) => {
      const d = def as unknown as { setup: (S: unknown) => void; step: (S: unknown, dt: number) => void; readouts: (S: unknown) => { label: string; value: string }[] };
      const S = { p: Object.assign({}, def.params, { setup: "revise", fam }), t: 0, cam: null };
      d.setup(S);
      for (let k = 0; k < 3000; k++) d.step(S, 0.05);
      return d.readouts(S).find((r) => r.label === "Residuals")!.value;
    };
    expect(run("sqrt")).toBe("noise");
    expect(run("const")).toBe("a pattern");
  });
});

/* ------------------------------------------------------------------ *
 * 6A-3 Earth's Four Spheres: each sphere's published model gives the numbers the lab teaches
 * ------------------------------------------------------------------ */
describe("6A-3 Earth's Four Spheres — the models", () => {
  type Arr = { t: number; amp: number; b: string };
  type Row = { y: number; ppm: number; cumE: number; cumOcean: number; cumLand: number; air: number };
  const M = engine.InsightLab.models["g6a-four-spheres"] as unknown as {
    stationArrivals: (p: Record<string, unknown>, land: number) => { P: Arr[]; S: Arr[] };
    shadowsOf: (p: Record<string, unknown>) => { P: [number, number][]; S: [number, number][] };
    interior: () => { mass: number; gSurf: number; P: (r: number) => number };
    residence: (k: string) => number; riseByVolume: (f: number) => number; SLE_ALL: number; WATER_TOTAL: number;
    ballsOf: (melt: number) => { k: string; d: number }[]; expected: (from: string, t: number) => number[];
    heightWhereP: (site: string, frac: number) => number; tropopause: (site: string) => [number, number];
    burstOf: (site: string, type: number, D0: number) => { z: number } | null;
    npp: (T: number, P: number) => number; limitOf: (T: number, P: number) => string;
    carbonRun: (o: Record<string, unknown>, y1: number) => Row[]; CO2_OBS: [number, number][];
    BASE: () => Record<string, unknown>;
  };
  const def = defs.find((d) => d.id === "g6a-four-spheres")!;
  const measure = (k: number) => {
    const pr = def.problems![k];
    return pr.measure({ p: Object.assign({}, def.params, pr.params ?? {}) });
  };
  const real = { outer: "liquid", inner: "solid" };
  const first = (a: Arr[]) => a.length ? a[0].t / 60 : null;

  it("times P and S waves through PREM as seismograms do (P at 60° ≈ 10 min 4 s, S ≈ 18 min 16 s)", () => {
    const A = M.stationArrivals(real, 60);
    expect(first(A.P)!).toBeGreaterThan(9.95);
    expect(first(A.P)!).toBeLessThan(10.25);
    expect(first(A.S)!).toBeGreaterThan(18.0);
    expect(first(A.S)!).toBeLessThan(18.6);
  });

  it("casts an S-wave shadow from about 103° and a P shadow from about 98°, from the layers alone", () => {
    const sh = M.shadowsOf(real);
    expect(sh.S[0][0]).toBeGreaterThan(101);
    expect(sh.S[0][0]).toBeLessThan(105);
    expect(sh.S[0][1]).toBe(180);
    expect(sh.P[0][0]).toBeGreaterThan(97);
    expect(sh.P[0][0]).toBeLessThan(101);
    // faint waves through the solid inner core come up inside the P shadow (Lehmann, 1936)
    expect(sh.P[0][1]).toBeLessThan(125);
    const noInner = M.shadowsOf({ outer: "liquid", inner: "liquid" });
    expect(noInner.P[0][1]).toBeGreaterThan(140);
  });

  it("has no shadow at all when the core is made solid", () => {
    const sh = M.shadowsOf({ outer: "solid", inner: "solid" });
    expect(sh.S.length).toBe(0);
    expect(sh.P.length).toBe(0);
    expect(measure(1)).toBeGreaterThan(29.5);
    expect(measure(1)).toBeLessThan(31.5);
  });

  it("weighs the Earth and finds the pressure at its centre from PREM's densities", () => {
    const I = M.interior();
    expect(Math.abs(I.mass - 5.972e24) / 5.972e24).toBeLessThan(0.002);
    expect(I.gSurf).toBeCloseTo(9.82, 1);
    expect(I.P(0) / 1e9).toBeGreaterThan(355);
    expect(I.P(0) / 1e9).toBeLessThan(372);
  });

  it("holds 1.386 billion km³ of water, keeps it about 9.7 days in the air and 3,200 years in the ocean", () => {
    expect(Math.abs(M.WATER_TOTAL * 1000 - 1.386e9) / 1.386e9).toBeLessThan(0.002);
    expect(M.residence("air") * 365.25).toBeGreaterThan(9);
    expect(M.residence("air") * 365.25).toBeLessThan(10.5);
    expect(M.residence("ocean")).toBeGreaterThan(3000);
    expect(M.residence("ocean")).toBeLessThan(3500);
  });

  it("draws the USGS balls: all the water 1,385 km across, liquid fresh water 273 km, lakes and rivers 56 km", () => {
    const b = Object.fromEntries(M.ballsOf(0).map((x) => [x.k, x.d]));
    expect(Math.abs(b.all - 1385)).toBeLessThan(5);
    expect(Math.abs(b.liquid - 273)).toBeLessThan(2);
    expect(Math.abs(b.surface - 56.2)).toBeLessThan(1);
  });

  it("raises the sea 65–70 m if all the land ice melts, matching the ice sheets' published sea-level equivalents", () => {
    expect(M.riseByVolume(1)).toBeGreaterThan(65);
    expect(M.riseByVolume(1)).toBeLessThan(70);
    expect(Math.abs(M.riseByVolume(1) - M.SLE_ALL) / M.SLE_ALL).toBeLessThan(0.03);
  });

  it("spreads tagged water, in the long run, as the water itself is spread", () => {
    const p = M.expected("air", 1e5);
    expect(p[0]).toBeGreaterThan(0.95);             // the ocean holds 96.6 %
    const sum = p.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("halves the air's pressure near 5.5 km and puts the tropopause where each climate has it", () => {
    expect(M.heightWhereP("mid", 0.5)).toBeGreaterThan(5.3);
    expect(M.heightWhereP("mid", 0.5)).toBeLessThan(5.7);
    expect(M.tropopause("mid")[0]).toBe(11);
    expect(M.tropopause("tropics")[0]).toBe(17);
    expect(M.tropopause("polar")[0]).toBe(9);
  });

  it("bursts a 600 g balloon near 30 km, and leaves an underfilled 1200 g balloon on the ground", () => {
    expect(measure(3)).toBeGreaterThan(27);
    expect(measure(3)).toBeLessThan(32);
    expect(M.burstOf("mid", 1200, 1.3)).toBeNull();
  });

  it("limits the desert by water and the tundra by warmth (the Miami model)", () => {
    expect(M.limitOf(25.1, 60)).toBe("water");
    expect(M.limitOf(-11.2, 115)).toBe("warmth");
    expect(M.npp(27.6, 2300)).toBeGreaterThan(2200);
    expect(measure(4)).toBeGreaterThan(380);
    expect(measure(4)).toBeLessThan(410);
  });

  it("follows the Mauna Loa record to within 5 ppm, with about 42 % of the emissions staying in the air", () => {
    const r = M.carbonRun({ fossil: "hold", clearing: true, ocean: true, plants: true }, 2100);
    const at = (y: number) => r.find((q) => q.y === y)!;
    for (const [y, c] of M.CO2_OBS) if (y >= 1959) expect(Math.abs(at(y).ppm - c), String(y)).toBeLessThan(5.5);
    const a = at(1850), b = at(2022), E = b.cumE - a.cumE;
    expect((b.air - a.air) / E).toBeGreaterThan(0.38);
    expect((b.air - a.air) / E).toBeLessThan(0.46);
    // the ocean's and the land's uptake in 2013–2022, against the Global Carbon Budget (2.8 ± 0.4, 3.3 ± 0.8 GtC a year)
    const oc = (at(2022).cumOcean - at(2012).cumOcean) / 10, ld = (at(2022).cumLand - at(2012).cumLand) / 10;
    expect(oc).toBeGreaterThan(2.4); expect(oc).toBeLessThan(3.4);
    expect(ld).toBeGreaterThan(2.0); expect(ld).toBeLessThan(4.1);
  });

  it("lets CO₂ fall after emissions stop, and rise far higher without the ocean", () => {
    expect(measure(5)).toBeLessThan(400);
    const noSea = M.carbonRun({ fossil: "hold", clearing: true, ocean: false, plants: true }, 2023);
    expect(noSea.find((q) => q.y === 2023)!.ppm).toBeGreaterThan(470);
  });
});
