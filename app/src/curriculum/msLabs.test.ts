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

    it(`${lab.id}: it teaches at least one subtopic of every topic it claims`, () => {
      for (const t of unit!.topics.filter((x) => lab.topics.includes(x.code))) {
        const mine = t.subtopics.filter((s) => lab.setups.some((u) => u.teaches.includes(s.code)));
        expect(mine.length, `${lab.id} claims ${t.code} but teaches none of it`).toBeGreaterThan(0);
      }
    });
  }

  /* A topic can be served by more than one lab (A4: Earth's Four Spheres and One Event, Four Spheres).
     Together, the labs that claim a topic must teach every one of its subtopics. */
  const claimed = new Map<string, typeof MS_LABS>();
  for (const lab of MS_LABS) for (const t of lab.topics) {
    const k = `${lab.grade}|${lab.unit}|${t}`;
    claimed.set(k, [...(claimed.get(k) ?? []), lab]);
  }
  for (const [k, labs] of claimed) {
    const [grade, unitCode, topic] = k.split("|");
    it(`grade ${grade} topic ${topic}: every subtopic is taught by a set-up of a lab that claims it (${labs.map((l) => l.id).join(", ")})`, () => {
      const unit = CURRICULA.find((c) => c.grade === Number(grade))!.units.find((u) => u.code === unitCode)!;
      const t = unit.topics.find((x) => x.code === topic)!;
      for (const s of t.subtopics) {
        // Through the same lookup the Library page uses, so the page finds a lab for every subtopic.
        expect(msTeaching(Number(grade), s.code).some((m) => labs.includes(m.lab)), `${s.code} ${s.title}`).toBe(true);
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

/* ------------------------------------------------------------------ *
 * 6A-4 One Event, Four Spheres: each event's chain reproduces the real event it is checked against
 * ------------------------------------------------------------------ */
describe("6A-4 One Event, Four Spheres — the models", () => {
  type Row = { t: number; T: number; sl: number; dR: number };
  const M = engine.InsightLab.models["g6a-one-event"] as unknown as {
    eruptionRun: (o: Record<string, unknown>) => Row[]; peakOf: (r: Row[], k: string) => Row; stratFrac: (km: number) => number;
    ERUPTIONS: { name: string; so2: number; lat: number; cool: [number, number] }[];
    stormTide: (o: Record<string, unknown>) => { best: { eta: number } };
    hurricaneRun: (o: Record<string, unknown>) => { V: number; atCoast: number; rain: number; cat: number };
    HURRICANES: { name: string; Pc: number; Rmax: number; U: number; shelf: string; obs: [number, number] }[];
    mpi: (sst: number) => number; ffdi: (T: number, RH: number, V: number, DF: number) => number; dangerOf: (F: number) => string;
    headRos: (p: Record<string, unknown>, wind: number, tanUp: number) => number; byram: (r: number) => number; crownThreshold: () => number;
    scsRunoff: (P: number, CN: number) => number; et0Month: (m: number, dT: number) => number;
    droughtRun: (o: Record<string, unknown>) => { sub: number; head: number; crop: number }[];
    fireOf: (S: unknown) => unknown; burnedHa: (F: unknown, h: number) => number; BASE: () => Record<string, unknown>;
  };

  it("cools the world about 0.4 °C after Pinatubo, in the measured 0.3–0.5 °C, with a sea-level dip of about 5 mm", () => {
    const r = M.eruptionRun({ so2: 17, lat: 15, plume: 34, years: 6 });
    const pk = M.peakOf(r, "T");
    expect(-pk.T).toBeGreaterThan(0.3);
    expect(-pk.T).toBeLessThan(0.5);
    expect(pk.t).toBeGreaterThan(0.8);
    expect(pk.t).toBeLessThan(3);
    const sl = M.peakOf(r, "sl").sl;
    expect(sl).toBeLessThan(-3);
    expect(sl).toBeGreaterThan(-8);
  });

  it("slows the rise of CO₂ by about 1 ppm in the year after Pinatubo, as Mauna Loa saw", () => {
    const r = M.eruptionRun({ so2: 17, lat: 15, plume: 34, years: 3 });
    const y = r.filter((q) => q.t >= 0.5 && q.t < 1.5), ppm = y.reduce((s, q) => s + q.dR, 0) / y.length / 2.124;
    expect(ppm).toBeLessThan(-0.6);
    expect(ppm).toBeGreaterThan(-1.5);
  });

  it("does nothing to the world when the column stays below the stratosphere", () => {
    expect(M.stratFrac(12)).toBe(0);
    const r = M.eruptionRun({ so2: 30, lat: 15, plume: 12, years: 3 });
    expect(Math.abs(M.peakOf(r, "T").T)).toBeLessThan(1e-9);
  });

  it("puts the Agung and Pinatubo eruptions inside their measured cooling", () => {
    for (const e of M.ERUPTIONS.filter((x) => /Agung|Pinatubo/.test(x.name))) {
      const c = -M.peakOf(M.eruptionRun({ so2: e.so2, lat: e.lat, plume: 30, years: 5 }), "T").T;
      expect(c, e.name).toBeGreaterThan(e.cool[0]);
      expect(c, e.name).toBeLessThan(e.cool[1]);
    }
  });

  it("ranks four real storm tides as measured and lands within 15 % of their high-water marks", () => {
    const res = M.HURRICANES.map((h) => {
      const V = Math.pow(1010 - h.Pc, 0.644) * 6.7 / 1.944;
      return { h, eta: M.stormTide({ Pc: h.Pc, Rmax: h.Rmax, U: h.U, V, shelf: h.shelf }).best.eta };
    });
    for (const { h, eta } of res) {
      expect(eta, h.name).toBeGreaterThan(h.obs[0] * 0.85);
      expect(eta, h.name).toBeLessThan(h.obs[1] * 1.15);
    }
    const byName = Object.fromEntries(res.map((r) => [r.h.name.split(" ")[0], r.eta]));
    expect(byName.Katrina).toBeGreaterThan(byName.Camille);   // the bigger, weaker storm pushed the higher tide
    expect(byName.Camille).toBeGreaterThan(byName.Ike);
    expect(byName.Ike).toBeGreaterThan(byName.Andrew);
  });

  it("follows DeMaria and Kaplan's intensity ceiling and drops Harvey-sized rain on a stalled storm", () => {
    expect(M.mpi(28)).toBeCloseTo(67.0, 0);
    expect(M.hurricaneRun({ sst: 25, rmax: 40, speed: 5, shelf: "wide" }).cat).toBe(0);
    const harvey = M.hurricaneRun({ sst: 29.5, rmax: 40, speed: 1, shelf: "wide" }).rain;
    expect(harvey).toBeGreaterThan(1100);
    expect(harvey).toBeLessThan(1700);
  });

  it("calls Black Saturday's weather catastrophic, and lets a windy fire climb into the crowns", () => {
    expect(M.ffdi(46.4, 6, 45, 10)).toBeGreaterThan(100);
    expect(M.dangerOf(M.ffdi(46.4, 6, 45, 10))).toBe("catastrophic");
    const p = { temp: 35, rh: 15, dry: 9 };
    expect(M.byram(M.headRos(p, 30, 0))).toBeGreaterThan(M.crownThreshold());
    expect(M.byram(M.headRos(p, 0, 0))).toBeLessThan(M.crownThreshold());
  });

  it("gives the slope factor Rothermel and McArthur agree on: about ×4 up a 20° slope", () => {
    const p = { temp: 35, rh: 15, dry: 9 };
    const ratio = M.headRos(p, 0, Math.tan(20 * Math.PI / 180)) / M.headRos(p, 0, 0);
    expect(ratio).toBeGreaterThan(3.3);
    expect(ratio).toBeLessThan(4.3);
    expect(Math.abs(ratio - Math.exp(0.069 * 20)) / Math.exp(0.069 * 20)).toBeLessThan(0.12);
  });

  it("runs off exactly what the NRCS TR-55 table says (76.2 mm on curve number 80 → 31.75 mm, 1.25 in)", () => {
    expect(M.scsRunoff(76.2, 80)).toBeCloseTo(31.75, 2);
    expect(M.scsRunoff(50, 85) / Math.max(1e-9, M.scsRunoff(50, 55))).toBeGreaterThan(20);
  });

  it("burns more with wind than in calm, and spreads the fire only where the weather lets it", () => {
    const base = Object.assign({}, M.BASE(), { setup: "wildfire" });
    const windy = M.burnedHa(M.fireOf({ p: base }), 6), calm = M.burnedHa(M.fireOf({ p: Object.assign({}, base, { wind: 0 }) }), 6);
    expect(windy).toBeGreaterThan(20 * calm);
  });

  it("puts Fresno's yearly evaporation demand near the CIMIS figure, and sinks the land for good when a drought is pumped through", () => {
    let e0 = 0; for (let m = 0; m < 12; m++) e0 += M.et0Month(m, 0);
    expect(e0).toBeGreaterThan(1350);
    expect(e0).toBeLessThan(1600);
    const pumped = M.droughtRun({ rain: 55, warm: 1, years: 4, pump: true }), dry = M.droughtRun({ rain: 55, warm: 1, years: 4, pump: false });
    const last = pumped[pumped.length - 1];
    expect(last.sub).toBeGreaterThan(1.2);
    expect(last.sub).toBeLessThan(2.4);
    expect(dry[dry.length - 1].sub).toBe(0);
    expect(Math.min(...dry.map((r) => r.crop))).toBeLessThan(0.7);
  });
});

/* ------------------------------------------------------------------ *
 * 6A-5 The Measurement Bench: each safety rule and each measurement is computed, and checked
 * ------------------------------------------------------------------ */
describe("6A-5 The Measurement Bench — the models", () => {
  type Mat = { k: number; rho: number; c: number };
  type Touch = { peak: number; dose: number; burn: number | null; pain: number | null };
  type Target = { mat: Mat; L: number; fixed: boolean };
  const M = engine.InsightLab.models["g6a-measurement-bench"] as unknown as {
    MAT: Record<string, Mat>; eff: (m: Mat) => number; burnTime: (T: number) => number;
    touch: (tg: Target, T: number, protection: string, hold: number) => Touch; targetOf: (p: Record<string, unknown>) => Target;
    thresholdT: (tg: Target, protection: string, hold: number) => number;
    thermalRun: (p: Record<string, unknown>) => { t: number; Tp: number; Tb: number }[];
    QTH: (n: number) => number;
    dilute: (o: Record<string, unknown>) => { peak: number; peakBulk: number; above: number; final: number };
    measure: (p: Record<string, unknown>) => { r: number; dr: number; rel: number; cands: string[] };
    fallTime: (ball: string, h: number) => number;
    trialsOf: (o: Record<string, unknown>) => { t: number; out: { watch: number; gate: number }[] };
    stats: (a: number[]) => { mean: number; sd: number };
    fit: (P: number[][], origin: boolean) => { a: number; b: number };
    outlierOf: (P: number[][], origin: boolean) => { i: number; z: number } | null;
    DATASETS: Record<string, { rows: number[][] }>; BASE: () => Record<string, unknown>;
  };
  const glassWater = () => M.targetOf({ target: "beaker", beaker: "glass", contents: "water" });

  it("finds the contact temperature the effusivities give: glass at 90 °C puts skin at 64.5 °C", () => {
    const thick = { mat: M.MAT.glass, L: 0.02, fixed: true };
    const cf = (M.eff(M.MAT.glass) * 90 + M.eff(M.MAT.skin) * 33) / (M.eff(M.MAT.glass) + M.eff(M.MAT.skin));
    expect(cf).toBeCloseTo(64.5, 1);
    expect(Math.abs(M.touch(thick, 90, "bare", 0.5).peak - cf)).toBeLessThan(0.3);
  });

  it("reproduces Moritz and Henriques's table: 5 s at 60 °C, 1 s at 68.3 °C, nothing below 44 °C", () => {
    expect(M.burnTime(60)).toBeCloseTo(5, 6);
    expect(M.burnTime(68.3)).toBeCloseTo(1, 6);
    expect(M.burnTime(43.9)).toBe(Infinity);
  });

  it("puts bare steel's one-second limit where its contact with skin reaches the table's 1 s temperature (68.3 °C)", () => {
    // ISO 13732-1's limits mark the first sign of a burn (bare metal 65–70 °C for 1 s); the lab's burn is the scald
    // table's burn through the skin, a few degrees later. The chain is what is checked: effusivities, then the table.
    const steel = { mat: M.MAT.steel, L: 0.01, fixed: true }, es = M.eff(M.MAT.steel), ek = M.eff(M.MAT.skin);
    const T = M.thresholdT(steel, "bare", 1), Tc = (es * T + ek * 33) / (es + ek);
    expect(Math.abs(Tc - 68.3)).toBeLessThan(0.5);
    expect(T).toBeGreaterThan(70);
    expect(T).toBeLessThan(76);
  });

  it("burns in a blink on steel, in seconds on glass, not at all through a heat mitt or with tongs", () => {
    const steel = M.targetOf({ target: "beaker", beaker: "steel", contents: "water" });
    expect(M.touch(steel, 90, "bare", 2).burn!).toBeLessThan(0.1);
    const g = M.touch(glassWater(), 90, "bare", 5);
    expect(g.burn!).toBeGreaterThan(1);
    expect(g.burn!).toBeLessThan(4);
    expect(M.touch(glassWater(), 100, "heat", 30).burn).toBeNull();
    expect(M.touch(glassWater(), 100, "tongs", 30).peak).toBe(33);
  });

  it("holds water at 100 °C at most, lets an empty beaker go past it, and keeps the plate hot long after switching off", () => {
    const w = M.thermalRun({ ...M.BASE(), set: 350 }), e = M.thermalRun({ ...M.BASE(), set: 300, contents: "empty" });
    expect(Math.max(...w.map((r) => r.Tb))).toBeLessThanOrEqual(100);
    expect(Math.max(...e.map((r) => r.Tb))).toBeGreaterThan(130);
    const r35 = w.find((r) => r.t >= 35)!;                            // 20 minutes after switching off
    expect(r35.Tp).toBeGreaterThan(60);
  });

  it("releases Thomsen's heat: 74.73 kJ per mol of acid at infinite dilution, 26.7 kJ with one water", () => {
    expect(M.QTH(1e9)).toBeCloseTo(74.73, 2);
    expect(M.QTH(1)).toBeCloseTo(26.7, 1);
  });

  it("warms acid poured into water to about 70 °C, but boils water poured into acid — even slowly, in ice", () => {
    const base = { acidV: 20, waterV: 100, strength: 98, rate: 1, bath: "air" };
    const a2w = M.dilute({ ...base, order: "acid-into-water" }), w2a = M.dilute({ ...base, order: "water-into-acid" });
    expect(a2w.peak).toBeGreaterThan(65);
    expect(a2w.peak).toBeLessThan(76);
    expect(a2w.above).toBe(0);
    expect(w2a.peakBulk).toBeGreaterThan(130);
    const cold = M.dilute({ ...base, order: "water-into-acid", rate: 0.2, bath: "ice" });
    expect(cold.peakBulk).toBeLessThan(100);
    expect(cold.above).toBeGreaterThan(0);
    const weak = M.dilute({ ...base, order: "water-into-acid", strength: 40 });
    expect(weak.above).toBe(0);
  });

  it("tells gold from fool's gold at once, but pyrite from hematite only with the overflow can", () => {
    const B = M.BASE();
    expect(M.measure({ ...B, specimen: "B", size: "small", cyl: 25 }).cands).toEqual(["gold"]);
    expect(M.measure({ ...B, specimen: "A", size: "medium", cyl: 100 }).cands).toEqual(expect.arrayContaining(["pyrite", "hematite"]));
    const over = { ...B, size: "large", method: "overflow", catchCyl: 25 };
    expect(M.measure({ ...over, specimen: "A" }).cands).toEqual(["pyrite"]);
    expect(M.measure({ ...over, specimen: "C" }).cands).toEqual(["hematite"]);
    expect(M.measure({ ...over, specimen: "C" }).rel).toBeLessThan(0.02);
  });

  it("lets a forgotten tare and a high eye mislead the overflow measurement", () => {
    const over = { ...M.BASE(), specimen: "A", size: "large", method: "overflow", catchCyl: 25 };
    expect(M.measure({ ...over, tared: false }).cands).toEqual(["magnetite"]);
    expect(M.measure({ ...over, eye: 3 }).cands).not.toContain("pyrite");
  });

  it("times a fall exactly: 0.4517 s for 1 m, and g from the gates within 0.1 %", () => {
    const t = M.fallTime("steel", 1);
    let x = 0, v = 0, tn = 0;                                        // an independent step-by-step integration
    const m = 0.0642, A = Math.PI * 0.0125 ** 2, Vb = (Math.PI * 0.025 ** 3) / 6, g1 = 9.81 * (1 - (1.2 * Vb) / m);
    while (x < 1) { const a = g1 - (0.5 * 1.2 * 0.47 * A * v * v) / m; v += a * 1e-5; x += v * 1e-5; tn += 1e-5; }
    expect(Math.abs(t - tn)).toBeLessThan(1e-4);
    expect(t).toBeCloseTo(0.4517, 4);
    expect(Math.abs(2 / (t * t) - 9.81) / 9.81).toBeLessThan(0.001);
    expect(2 / M.fallTime("pingpong", 1) ** 2).toBeLessThan(9.4);
  });

  it("finds a stopwatch about 0.19 s short when you react to a partner — however many drops are averaged", () => {
    const P = M.trialsOf({ ball: "steel", h: 1, n: 30, who: "partner", set: 1 }), S2 = M.trialsOf({ ball: "steel", h: 1, n: 30, who: "self", set: 1 });
    const short = P.t - M.stats(P.out.map((q) => q.watch)).mean;
    expect(short).toBeGreaterThan(0.15);
    expect(short).toBeLessThan(0.23);
    expect(Math.abs(P.t - M.stats(S2.out.map((q) => q.watch)).mean)).toBeLessThan(0.03);
    expect(M.stats(P.out.map((q) => q.gate)).sd).toBeLessThan(0.0002);
  });

  it("finds the misread piece, the density as the slope, g from time² against height, and the lying axis", () => {
    const mass = M.DATASETS.mass.rows, out = M.outlierOf(mass, true)!;
    expect(out.i).toBe(3);
    expect(M.fit(mass.filter((_, i) => i !== 3), true).b).toBeCloseTo(5.03, 1);
    const sq = M.DATASETS.fall.rows.map(([h, t]) => [h, t * t]);
    expect(Math.abs(2 / M.fit(sq, true).b - 9.81) / 9.81).toBeLessThan(0.002);
    const a = M.fallTime("steel", 1), b = M.fallTime("pingpong", 1);
    expect(b / a).toBeLessThan(1.04);
    expect((b - 0.445) / (a - 0.445)).toBeGreaterThan(2);
  });
});

/* ------------------------------------------------------------------ *
 * 6A-6 The Fair Test: the paper helicopter, the class's data, the plans
 * ------------------------------------------------------------------ */
describe("6A-6 The Fair Test — the models", () => {
  type D = { L: number; w: number; clips: number; paper: string; colour: string; extra: number };
  const M = engine.InsightLab.models["g6a-fair-test"] as unknown as {
    heli: (d: D) => { m: number; vt: number; flutter: number; A: number; Cr: number };
    flight: (d: D, H: number, k?: number, up?: number) => { t: number; v: number };
    drops: (d: D, H: number, n: number, seed: number) => { t: number; gate: number; watch: number }[];
    stats: (a: number[]) => { mean: number; sd: number };
    designsOf: (p: Record<string, unknown>) => { A: D; B: D };
    judge: (claim: string, ev: string) => { verdict: string };
    BASE_D: D; BASE: () => Record<string, unknown>;
  };
  const d = (o: Partial<D>) => ({ ...M.BASE_D, ...o });

  it("falls at about a metre a second, as paper helicopters do, and at the closed form √(2mg ÷ ρCA)", () => {
    const h = M.heli(M.BASE_D);
    expect(h.vt).toBeGreaterThan(0.8);
    expect(h.vt).toBeLessThan(1.5);
    expect(h.vt).toBeCloseTo(Math.sqrt((2 * h.m * 9.81) / (1.2 * h.Cr * h.A)), 6);
    expect(Math.abs(M.flight(M.BASE_D, 20).v - h.vt) / h.vt).toBeLessThan(0.01);   // a long fall settles at it
  });

  it("falls faster when heavier (as √m) and slower with longer blades, until they flutter", () => {
    const t = (o: Partial<D>) => M.flight(d(o), 3).t;
    expect(t({ clips: 0 })).toBeGreaterThan(t({ clips: 1 }));
    expect(t({ clips: 1 })).toBeGreaterThan(t({ clips: 3 }));
    expect(t({ L: 9 })).toBeGreaterThan(t({ L: 6 }));
    expect(t({ L: 14 })).toBeLessThan(t({ L: 10.5 }));
    expect(M.heli(d({ L: 14 })).flutter).toBeGreaterThan(0.5);
    expect(M.heli(d({ L: 8 })).flutter).toBe(0);
  });

  it("makes longer blades from the same paper heavier — the confound the fair test flags", () => {
    const { A, B } = M.designsOf({ ...M.BASE(), vary: "length", aL: 7, bL: 10, balance: false });
    expect((M.heli(B).m - M.heli(A).m) * 1000).toBeCloseTo(0.144, 3);
    const bal = M.designsOf({ ...M.BASE(), vary: "length", aL: 7, bL: 10, balance: true });
    expect(M.heli(bal.A).m).toBeCloseTo(M.heli(bal.B).m, 9);
  });

  it("scatters each drop by a few percent, and lets colour change nothing", () => {
    const ds = M.drops(M.BASE_D, 3, 40, 1).map((q) => q.gate), st = M.stats(ds);
    expect(st.sd / st.mean).toBeGreaterThan(0.02);
    expect(st.sd / st.mean).toBeLessThan(0.06);
    expect(M.flight(d({ colour: "red" }), 3).t).toBe(M.flight(M.BASE_D, 3).t);
  });

  it("judges the class's claims: overstated, supported, not supported, contradicted, no evidence — and all 24 rows unfair", () => {
    expect(M.judge("longer", "alike").verdict).toBe("overstated");
    expect(M.judge("heavier", "alike").verdict).toBe("supported");
    expect(M.judge("red", "alike").verdict).toBe("not supported");
    expect(M.judge("card", "alike").verdict).toBe("contradicted");
    expect(M.judge("wider", "alike").verdict).toBe("no evidence");
    expect(M.judge("longer", "all").verdict).toBe("unfair comparison");
    expect(M.judge("heavier", "few").verdict).toBe("too little evidence");
  });
});

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
