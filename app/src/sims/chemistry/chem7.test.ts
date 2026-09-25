import { describe, expect, it } from "vitest";
import { MOLECULES, parseFormula } from "./molecules";
import { ELEMENTS, elementByZ } from "./periodic-table";

describe("molecule structures", () => {
  it("glucose has the right atoms", () => {
    const g = MOLECULES.find((m) => m.formula === "C6H12O6");
    expect(g).toBeDefined();
    const tally: Record<string, number> = {};
    for (const a of g!.atoms) tally[a.el] = (tally[a.el] ?? 0) + 1;
    expect(tally).toEqual({ C: 6, H: 12, O: 6 });
    // Glucose is drawn as the pyranose ring, which is what glucose actually is
    // in solution (over 99% of it). The ring closes through O5, so it carries
    // one more bond than the open-chain aldehyde form's 23.
    expect(g!.bonds.length).toBe(24);
  });
  it("every molecule's drawn atoms match its formula", () => {
    for (const m of MOLECULES) {
      const tally: Record<string, number> = {};
      for (const a of m.atoms) tally[a.el] = (tally[a.el] ?? 0) + 1;
      expect(tally, m.formula).toEqual(parseFormula(m.formula));
    }
  });
  it("parses coefficients and brackets", () => {
    expect(parseFormula("2H2O")).toEqual({ H: 4, O: 2 });
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("3Mg(NO3)2")).toEqual({ Mg: 3, N: 6, O: 18 });
  });
  it("has real element data", () => {
    expect(elementByZ(26)!.symbol).toBe("Fe");
    expect(ELEMENTS.length).toBeGreaterThan(40);
  });
});
