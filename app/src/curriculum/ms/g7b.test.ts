import { describe, expect, it } from "vitest";
import { engine } from "./engine";

/* ------------------------------------------------------------------ *
 * 7B-1 The Change Detective: each model keeps the promises its text makes
 * ------------------------------------------------------------------ */
describe("7B-1 The Change Detective — the models", () => {
  type P = Record<string, unknown>;
  type Row = { t: number; T: number; gas: number; o2: number; ppt: number; cross: number; xi: number; ms: number; md: number; water: number; mass: number };
  type Run = { rows: Row[]; gasEnd: number; dTx: number; doneAt: number; limiting: string; after: { P: number; A: number; B: number } };
  const M = engine.InsightLab.models["g7b-change-detective"] as unknown as {
    chemRun: (p: P) => Run; rowAt: (rows: Row[], t: number) => Row; physRun: (p: P) => Run & { rev: number | null }; kappaNaCl: (c: number) => number;
    propRun: (p: P) => Run; revRun: (p: P) => Run & { waterMax: number }; signsOf: (p: P, r: Run) => { n: number; list: { k: string; seen: boolean }[] };
    matchScores: (p: P) => { best: string; sure: boolean }; pairOf: (p: P) => { A: { kind: string }; B: { kind: string } }; decides: (pair: string, test: string) => boolean;
    gasMassPer100: (k: string) => number; limeSol: (T: number) => number; atomCount: (k: string) => Record<string, number>;
    EV: Record<string, { at: [string, number, number, number, number, number, number][] }>; VM: number; BASE: () => P;
  };
  const p = (o: P) => ({ ...M.BASE(), ...o });

  it("collects 98.9 mL of hydrogen from 0.100 g of magnesium at 20 °C (24.05 L/mol), less the ~1 mL that stays dissolved", () => {
    expect(M.VM).toBeCloseTo(24.054, 2);
    const r = M.chemRun(p({ rxn: "mg", mMg: 0.1, conc: 1, vol: 50 }));
    expect(r.gasEnd).toBeGreaterThan(97.5); expect(r.gasEnd).toBeLessThan(98.9);
    expect(r.limiting).toBe("Mg");
    // twice the acid strength: faster, the same gas
    const r2 = M.chemRun(p({ rxn: "mg", mMg: 0.1, conc: 2, vol: 50 }));
    expect(r2.doneAt).toBeLessThan(0.7 * r.doneAt); expect(Math.abs(r2.gasEnd - r.gasEnd)).toBeLessThan(0.5);
  });

  it("warms by ΔT = nΔH / C: neutralising 25 mL each of 1 M HCl and NaOH in a flask gives +4.6 °C; baking soda in vinegar cools", () => {
    const n = M.chemRun(p({ rxn: "neut", conc: 1, vol: 25, conc2: 1, vol2: 25 }));
    expect(n.dTx).toBeCloseTo((0.025 * 55840) / (50 * 4.18 + 92), 1);
    expect(M.chemRun(p({ rxn: "soda", mSoda: 1, conc: 0.83, vol: 50 })).dTx).toBeLessThan(-0.5);
    expect(M.chemRun(p({ rxn: "cu", mFe: 1, conc: 0.5, vol: 50 })).dTx).toBeGreaterThan(5);
  });

  it("splits water 2 : 1 by Faraday's law: 0.50 A for 10 min gives 37.4 mL of hydrogen and 18.7 mL of oxygen", () => {
    const r = M.chemRun(p({ rxn: "elec", amps: 0.5 })), at = M.rowAt(r.rows, 600);
    expect(at.gas).toBeCloseTo(((0.5 * 600) / (2 * 96485)) * M.VM * 1000, 1);
    expect(at.gas / at.o2).toBeCloseTo(2, 3);
  });

  it("precipitates 1.25 g of CaCO₃ from 12.5 mmol each, and nothing at all below its solubility product (Ksp 3.36 × 10⁻⁹)", () => {
    const r = M.chemRun(p({ rxn: "ppt", conc: 0.5, vol: 25, conc2: 0.5, vol2: 25 }));
    expect(r.rows[r.rows.length - 1].ppt).toBeCloseTo(1.251, 2);
    const d = M.chemRun(p({ rxn: "ppt", conc: 0.0001, vol: 25, conc2: 0.0001, vol2: 25 }));
    expect(d.rows[d.rows.length - 1].ppt).toBe(0);
  });

  it("a dilute neutralisation shows no sign to a 1 °C thermometer — and shows on a 0.1 °C probe or with indicator", () => {
    const q = p({ setup: "signs", rxn: "neut", conc: 0.01, vol: 25, conc2: 0.01, vol2: 25 });
    expect(M.signsOf({ ...q, thermo: "glass" }, M.chemRun(q)).n).toBe(0);
    const qi = { ...q, ind: true };
    expect(M.signsOf({ ...qi, thermo: "glass" }, M.chemRun(qi)).list.find((s) => s.k === "colour")!.seen).toBe(true);
  });

  it("keeps every atom: each reaction event has the same elements before and after", () => {
    for (const k of Object.keys(M.EV)) {
      const at = M.EV[k].at;
      expect(at.every((a) => typeof a[0] === "string" && a.length === 7)).toBe(true);
      const c = M.atomCount(k); expect(Object.values(c).reduce((s, v) => s + v, 0)).toBe(at.length);
    }
  });

  it("dissolves at most 36.0 g of salt per 100 g of water, conducts as Kohlrausch says (10.7 mS/cm at 0.1 M), and gives the salt back", () => {
    const r = M.physRun(p({ setup: "physical", phys: "salt", pmass: 50, pwater: 100, stir: true }));
    expect(r.rows[r.rows.length - 1].ms).toBeCloseTo(14.0, 1);
    expect(M.kappaNaCl(0.1)).toBeGreaterThan(10.5); expect(M.kappaNaCl(0.1)).toBeLessThan(11.2);
    const back = M.physRun(p({ setup: "physical", phys: "salt", pmass: 10, pwater: 40, power: 600, undo: true }));
    expect(back.rev).not.toBeNull();
  });

  it("holds ice at 0 °C while it melts, then warms", () => {
    const r = M.physRun(p({ setup: "physical", phys: "ice", pmass: 50, power: 300 }));
    const melting = r.rows.filter((q) => (q as unknown as { f: number }).f > 0.05 && (q as unknown as { f: number }).f < 0.95);
    expect(melting.length).toBeGreaterThan(10); melting.forEach((q) => expect(q.T).toBeCloseTo(0, 6));
  });

  it("forms FeS in its fixed ratio: 7.0 g Fe + 3.2 g S → 8.77 g FeS and 1.43 g of iron left over", () => {
    const R = M.propRun(p({ setup: "properties", pmat: "fes", mA: 7, mB: 3.2, flame: "blue" }));
    expect(R.after.P).toBeCloseTo((3.2 / 32.06) * 87.91, 3);
    expect(R.after.A).toBeCloseTo(7 - (3.2 / 32.06) * 55.845, 3);
    expect(M.propRun(p({ setup: "properties", pmat: "mgo", mA: 0.24, flame: "blue" })).after.P).toBeCloseTo(0.24 * 40.3 / 24.305, 3);
  });

  it("drives 36.07 % water out of CuSO₄·5H₂O (0.902 g from 2.50 g), only part of it at 110 °C, and none comes back from egg white", () => {
    const R = M.revRun(p({ setup: "reversible", rsamp: "cuso4", rmass: 2.5, rtemp: 300, rtime: 240, back: false }));
    expect(M.rowAt(R.rows, 240).water).toBeCloseTo(2.5 * 5 * 18.015 / 249.69, 3);
    const low = M.revRun(p({ setup: "reversible", rsamp: "cuso4", rmass: 2.5, rtemp: 110, rtime: 240, back: false }));
    expect(M.rowAt(low.rows, 240).water).toBeLessThan(0.7 * 0.902);
  });

  it("limewater is less soluble hot (0.173 → 0.077 g/100 mL), and only the right tests tell look-alikes apart", () => {
    expect(M.limeSol(20)).toBeCloseTo(0.173, 3); expect(M.limeSol(100)).toBeCloseTo(0.077, 3);
    expect(M.decides("cloudy", "cool")).toBe(true); expect(M.decides("cloudy", "look")).toBe(false); expect(M.decides("green", "gas")).toBe(false);
    expect(M.pairOf(p({ pair: "bubbles" })).A.kind).toBe("physical");
  });

  it("100 mL of CO₂ weighs 183 mg; density alone misnames mystery F, more tests name it", () => {
    expect(M.gasMassPer100("CO2") * 1000).toBeCloseTo(183, 0);
    expect(M.matchScores(p({ mystery: "F", sample: 1, tLook: false, tDen: true, tMelt: false, tSol: false })).best).not.toBe("cacl2");
    const all = M.matchScores(p({ mystery: "F", sample: 1, tLook: true, tDen: true, tMelt: true, tSol: true }));
    expect(all.best).toBe("cacl2"); expect(all.sure).toBe(true);
  });
});
