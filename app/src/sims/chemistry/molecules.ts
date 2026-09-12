import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import type { Rng } from "@engine/rng";
import { q } from "@engine/units";
import { roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, lifted, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Molecule Builder — Grades 4-12.
 *
 * Atoms go in; a molecule comes out, or does not. Two hydrogens and one oxygen
 * snap into water. Two hydrogens and *two* oxygens snap into hydrogen peroxide,
 * which is a completely different substance — and that one-character difference
 * between H₂O and H₂O₂ is the thing a formula is for.
 *
 * The exhibit along the bottom of the stage never goes away: 2 H₂O drawn as two
 * separate molecules beside H₂O₂ drawn as one, with the atoms counted under
 * each. A coefficient multiplies whole molecules; a subscript counts atoms
 * inside one. Students who never separate those two ideas cannot balance an
 * equation, and this is where that separation is made.
 *
 * ── Where the numbers come from ────────────────────────────────────────────
 * Bond lengths and bond angles are the measured gas-phase values in picometres
 * and degrees (O–H 95.8 pm and 104.5° in water; C=O 116 pm in carbon dioxide;
 * Na–Cl 282 pm in rock salt). Van der Waals radii drive the space-filling view,
 * covalent radii the ball-and-stick view, both from the standard tables.
 * Molecules that are genuinely three-dimensional — methane's tetrahedron,
 * ammonia's pyramid, glucose's chair-shaped ring — are drawn flat, which is
 * what a printed textbook does too, and the stage says so.
 */

/* ------------------------------------------------------------------ *
 * Reading a chemical formula
 * ------------------------------------------------------------------ */

/**
 * Turn a written formula into a count of every atom in it, obeying the two
 * rules that trip students up: a coefficient at the front multiplies
 * everything, and a subscript applies only to the symbol (or bracket) it
 * follows. "2H2O" is 4 hydrogen and 2 oxygen. "3Mg(NO3)2" is 3 magnesium,
 * 6 nitrogen and 18 oxygen.
 */
export function parseFormula(text: string): Record<string, number> {
  let i = 0;
  const src = text.replace(/\s+/g, "");

  const readInt = (): number => {
    let digits = "";
    while (i < src.length && src[i] >= "0" && src[i] <= "9") digits += src[i++];
    return digits ? parseInt(digits, 10) : 1;
  };

  const readGroup = (depth: number): Record<string, number> => {
    const out: Record<string, number> = {};
    while (i < src.length) {
      const c = src[i];
      if (c === ")") {
        if (depth === 0) break;
        i++;
        const n = readInt();
        for (const k of Object.keys(out)) out[k] *= n;
        return out;
      }
      if (c === "(") {
        i++;
        const inner = readGroup(depth + 1);
        for (const [k, v] of Object.entries(inner)) out[k] = (out[k] ?? 0) + v;
        continue;
      }
      if (c >= "A" && c <= "Z") {
        let symbol = src[i++];
        while (i < src.length && src[i] >= "a" && src[i] <= "z") symbol += src[i++];
        const n = readInt();
        out[symbol] = (out[symbol] ?? 0) + n;
        continue;
      }
      // Anything else (a stray dot, a charge sign) is skipped rather than
      // silently miscounted.
      i++;
    }
    return out;
  };

  const coefficient = readInt();
  const counts = readGroup(0);
  if (coefficient !== 1) for (const k of Object.keys(counts)) counts[k] *= coefficient;
  return counts;
}

/** Total number of atoms a written formula stands for. */
export function totalAtoms(text: string): number {
  return Object.values(parseFormula(text)).reduce((a, b) => a + b, 0);
}

/* ------------------------------------------------------------------ *
 * Atoms
 * ------------------------------------------------------------------ */

export type Elem = "H" | "C" | "N" | "O" | "Na" | "Cl" | "Ar";

interface AtomKind {
  /** Covalent radius, pm — sets the ball in a ball-and-stick model. */
  covalent: number;
  /** Van der Waals radius, pm — the real size a space-filling model shows. */
  vdw: number;
  name: string;
}

export const ATOMS: Record<Elem, AtomKind> = {
  H: { covalent: 31, vdw: 120, name: "hydrogen" },
  C: { covalent: 76, vdw: 170, name: "carbon" },
  N: { covalent: 71, vdw: 155, name: "nitrogen" },
  O: { covalent: 66, vdw: 152, name: "oxygen" },
  Na: { covalent: 166, vdw: 227, name: "sodium" },
  Cl: { covalent: 102, vdw: 175, name: "chlorine" },
  Ar: { covalent: 106, vdw: 188, name: "argon" },
};

/**
 * Atom colours follow the CPK convention every chemistry book uses — oxygen
 * red, nitrogen blue, chlorine green, carbon dark, hydrogen pale — but each one
 * is taken from the platform's semantic palette rather than invented, so the
 * scheme still tracks the theme.
 */
function atomColor(el: Elem, theme: RenderContext<State>["theme"]): string {
  switch (el) {
    case "O": return theme.sci["force"];
    case "N": return theme.sci["velocity"];
    case "C": return theme.ink;
    case "H": return theme.inkSoft;
    case "Na": return theme.sci["field"];
    case "Cl": return theme.sci["producer"];
    default: return theme.sci["time"];
  }
}

/* ------------------------------------------------------------------ *
 * Molecules
 * ------------------------------------------------------------------ */

interface Atom { el: Elem; x: number; y: number }
/** Bond as [atom index, atom index, order]. */
type Bond = [number, number, number];

export interface Molecule {
  formula: string;
  name: string;
  /** Formula split for drawing: symbol and its subscript. */
  parts: { el: string; n: number }[];
  atoms: Atom[];
  bonds: Bond[];
  /** One kind of atom only, or more than one. */
  kind: "element" | "compound";
  /** Something true about the molecule worth saying out loud. */
  note: string;
  /** Radius that comfortably contains it, pm. */
  extent: number;
}

const DEG = Math.PI / 180;

function build(
  formula: string, name: string, parts: { el: string; n: number }[],
  atoms: Atom[], bonds: Bond[], note: string,
): Molecule {
  const kinds = new Set(atoms.map((a) => a.el));
  let extent = 60;
  for (const a of atoms) extent = Math.max(extent, Math.hypot(a.x, a.y) + ATOMS[a.el].vdw * 0.8);
  return {
    formula, name, parts, atoms, bonds,
    kind: kinds.size === 1 ? "element" : "compound",
    note, extent,
  };
}

/**
 * Glucose, drawn as the flat hexagon a textbook draws: the five carbons and
 * one oxygen of the pyranose ring, each carbon carrying its –OH and –H, and
 * the sixth carbon hanging off C5 as –CH₂OH. The real ring is puckered into a
 * chair, and the stage says so; the atom count — 6 C, 12 H, 6 O — is exact.
 */
function glucose(): Molecule {
  const R = 154;         // C–C bond length, and so the ring's circumradius
  const CO = 143;        // C–O single bond
  const CH = 109;        // C–H bond
  const OH = 96;         // O–H bond
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const push = (el: Elem, x: number, y: number) => atoms.push({ el, x, y }) - 1;

  // Ring: O at the top, then five carbons clockwise.
  const ringAngles = [90, 30, -30, -90, -150, 150].map((d) => d * DEG);
  const ring: number[] = [];
  ring.push(push("O", Math.cos(ringAngles[0]) * R, Math.sin(ringAngles[0]) * R));
  for (let k = 1; k < 6; k++) {
    ring.push(push("C", Math.cos(ringAngles[k]) * R, Math.sin(ringAngles[k]) * R));
  }
  for (let k = 0; k < 6; k++) bonds.push([ring[k], ring[(k + 1) % 6], 1]);

  // Each ring carbon carries one –OH and one –H, splayed either side of the
  // radius so nothing lands on top of anything else.
  const carbons = [1, 2, 3, 4];   // C1..C4 take an –OH
  for (const k of carbons) {
    const a = ringAngles[k];
    const ox = Math.cos(a + 16 * DEG) * (R + CO);
    const oy = Math.sin(a + 16 * DEG) * (R + CO);
    const oi = push("O", ox, oy);
    bonds.push([ring[k], oi, 1]);
    const hi = push("H", Math.cos(a + 16 * DEG) * (R + CO + OH), Math.sin(a + 16 * DEG) * (R + CO + OH));
    bonds.push([oi, hi, 1]);
    const chI = push("H", Math.cos(a - 26 * DEG) * (R + CH), Math.sin(a - 26 * DEG) * (R + CH));
    bonds.push([ring[k], chI, 1]);
  }

  // C5 carries one H and the –CH₂OH arm.
  const a5 = ringAngles[5];
  bonds.push([ring[5], push("H", Math.cos(a5 - 30 * DEG) * (R + CH), Math.sin(a5 - 30 * DEG) * (R + CH)), 1]);
  const c6x = Math.cos(a5 + 18 * DEG) * (R + R);
  const c6y = Math.sin(a5 + 18 * DEG) * (R + R);
  const c6 = push("C", c6x, c6y);
  bonds.push([ring[5], c6, 1]);
  const armDir = Math.atan2(c6y, c6x);
  const o6 = push("O", c6x + Math.cos(armDir) * CO, c6y + Math.sin(armDir) * CO);
  bonds.push([c6, o6, 1]);
  bonds.push([o6, push("H", c6x + Math.cos(armDir) * (CO + OH), c6y + Math.sin(armDir) * (CO + OH)), 1]);
  bonds.push([c6, push("H", c6x + Math.cos(armDir + 100 * DEG) * CH, c6y + Math.sin(armDir + 100 * DEG) * CH), 1]);
  bonds.push([c6, push("H", c6x + Math.cos(armDir - 100 * DEG) * CH, c6y + Math.sin(armDir - 100 * DEG) * CH), 1]);

  return build(
    "C6H12O6", "Glucose",
    [{ el: "C", n: 6 }, { el: "H", n: 12 }, { el: "O", n: 6 }],
    atoms, bonds,
    "Drawn flat; the real ring is puckered into a chair.",
  );
}

/** Every molecule this kit can assemble, keyed by its atom tally. */
export const MOLECULES: Molecule[] = [
  build("H2", "Hydrogen", [{ el: "H", n: 2 }],
    [{ el: "H", x: -37, y: 0 }, { el: "H", x: 37, y: 0 }], [[0, 1, 1]],
    "The lightest molecule there is. Bond length 74 pm."),
  build("O2", "Oxygen", [{ el: "O", n: 2 }],
    [{ el: "O", x: -60.5, y: 0 }, { el: "O", x: 60.5, y: 0 }], [[0, 1, 2]],
    "A double bond, and one fifth of the air you breathe."),
  build("O3", "Ozone", [{ el: "O", n: 3 }],
    [
      { el: "O", x: 0, y: 42 },
      { el: "O", x: -108.9, y: -25 },
      { el: "O", x: 108.9, y: -25 },
    ], [[0, 1, 1], [0, 2, 1]],
    "Same element as O₂, one atom more — and it shields you from ultraviolet."),
  build("N2", "Nitrogen", [{ el: "N", n: 2 }],
    [{ el: "N", x: -55, y: 0 }, { el: "N", x: 55, y: 0 }], [[0, 1, 3]],
    "A triple bond, which is why nitrogen is so hard to react."),
  build("H2O", "Water", [{ el: "H", n: 2 }, { el: "O", n: 1 }],
    [
      { el: "O", x: 0, y: 20 },
      { el: "H", x: -75.8, y: -38.6 },
      { el: "H", x: 75.8, y: -38.6 },
    ], [[0, 1, 1], [0, 2, 1]],
    "Bent by 104.5°, which is why water is the strange, sticky liquid it is."),
  build("H2O2", "Hydrogen peroxide", [{ el: "H", n: 2 }, { el: "O", n: 2 }],
    [
      { el: "O", x: -73.7, y: 0 },
      { el: "O", x: 73.7, y: 0 },
      { el: "H", x: -110, y: 88 },
      { el: "H", x: 110, y: -88 },
    ], [[0, 1, 1], [0, 2, 1], [1, 3, 1]],
    "One extra oxygen turns water into bleach. The real molecule is twisted."),
  build("CO", "Carbon monoxide", [{ el: "C", n: 1 }, { el: "O", n: 1 }],
    [{ el: "C", x: -56.4, y: 0 }, { el: "O", x: 56.4, y: 0 }], [[0, 1, 3]],
    "One oxygen short of CO₂, and lethal because of it."),
  build("CO2", "Carbon dioxide", [{ el: "C", n: 1 }, { el: "O", n: 2 }],
    [
      { el: "C", x: 0, y: 0 },
      { el: "O", x: -116, y: 0 },
      { el: "O", x: 116, y: 0 },
    ], [[0, 1, 2], [0, 2, 2]],
    "Perfectly straight, 180°, with two double bonds."),
  build("CH4", "Methane", [{ el: "C", n: 1 }, { el: "H", n: 4 }],
    [
      { el: "C", x: 0, y: 0 },
      { el: "H", x: 0, y: 109 },
      { el: "H", x: 0, y: -109 },
      { el: "H", x: -109, y: 0 },
      { el: "H", x: 109, y: 0 },
    ], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    "Drawn flat; the real shape is a tetrahedron with 109.5° angles."),
  build("NH3", "Ammonia", [{ el: "N", n: 1 }, { el: "H", n: 3 }],
    [
      { el: "N", x: 0, y: 25 },
      { el: "H", x: 0, y: 126.7 },
      { el: "H", x: -88, y: -26 },
      { el: "H", x: 88, y: -26 },
    ], [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
    "Drawn flat; the real molecule is a pyramid with a lone pair on top."),
  build("C2H4", "Ethene", [{ el: "C", n: 2 }, { el: "H", n: 4 }],
    [
      { el: "C", x: -66.5, y: 0 },
      { el: "C", x: 66.5, y: 0 },
      { el: "H", x: -122.6, y: 92.3 },
      { el: "H", x: -122.6, y: -92.3 },
      { el: "H", x: 122.6, y: 92.3 },
      { el: "H", x: 122.6, y: -92.3 },
    ], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]],
    "A double bond between the carbons, and the whole molecule is flat."),
  build("C2H6", "Ethane", [{ el: "C", n: 2 }, { el: "H", n: 6 }],
    [
      { el: "C", x: -77, y: 0 },
      { el: "C", x: 77, y: 0 },
      { el: "H", x: -130, y: 95 },
      { el: "H", x: -130, y: -95 },
      { el: "H", x: -186, y: 0 },
      { el: "H", x: 130, y: 95 },
      { el: "H", x: 130, y: -95 },
      { el: "H", x: 186, y: 0 },
    ], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]],
    "Two carbons joined by a single bond — the second-simplest fuel there is."),
  build("CH4O", "Methanol", [{ el: "C", n: 1 }, { el: "H", n: 4 }, { el: "O", n: 1 }],
    [
      { el: "C", x: -71.5, y: 0 },
      { el: "O", x: 71.5, y: 0 },
      { el: "H", x: -107.9, y: 102.7 },
      { el: "H", x: -107.9, y: -102.7 },
      { el: "H", x: -180.5, y: 0 },
      { el: "H", x: 102.1, y: 91 },
    ], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1]],
    "Methane with one hydrogen swapped for an –OH. That swap makes it a liquid."),
  glucose(),
];

const BY_TALLY = new Map<string, Molecule>();
function tallyKey(counts: Partial<Record<Elem, number>>): string {
  return (["C", "H", "N", "O"] as Elem[]).map((el) => `${el}${counts[el] ?? 0}`).join("");
}
for (const m of MOLECULES) {
  const counts = parseFormula(m.formula) as Partial<Record<Elem, number>>;
  BY_TALLY.set(tallyKey(counts), m);
}

/** The molecule these atom counts make, if they make one at all. */
export function moleculeFor(c: number, h: number, n: number, o: number): Molecule | null {
  return BY_TALLY.get(tallyKey({ C: c, H: h, N: n, O: o })) ?? null;
}

/**
 * IUPAC standard atomic weights, u. Wider than the kit needs, because the
 * conservation-of-mass simulation weighs its reactions with the same table.
 */
export const ATOMIC_MASS: Record<string, number> = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Mg: 24.305,
  S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546,
  Zn: 65.38, Ar: 39.95,
};

/** Molar mass of a written formula, g/mol. */
export function molarMass(formula: string): number {
  let sum = 0;
  for (const [el, n] of Object.entries(parseFormula(formula))) {
    sum += (ATOMIC_MASS[el] ?? 0) * n;
  }
  return sum;
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

const MIX_N = 44;
const BOX_W = 1000;   // mixture box, in the same picometre-ish units as molecules
const BOX_H = 620;

interface State {
  /** What is currently on the bench, so a change can restart the snap. */
  key: string;
  /** 0 while the atoms are still flying in, 1 once the molecule is together. */
  assembly: number;
  spin: number;
  mx: number[]; my: number[]; mvx: number[]; mvy: number[];
  /** 0 = N₂, 1 = O₂, 2 = Ar, in the proportions of real dry air. */
  mkind: number[];
}

function benchKey(params: ParamValues): string {
  return [
    params.system, params.carbon, params.hydrogen, params.nitrogen, params.oxygen,
  ].join("/");
}

function seedMixture(rng: Rng): Pick<State, "mx" | "my" | "mvx" | "mvy" | "mkind"> {
  const mx: number[] = [], my: number[] = [], mvx: number[] = [], mvy: number[] = [], mkind: number[] = [];
  for (let i = 0; i < MIX_N; i++) {
    mx.push(rng.range(60, BOX_W - 60));
    my.push(rng.range(60, BOX_H - 60));
    const a = rng.range(0, Math.PI * 2);
    const speed = rng.range(90, 150);
    mvx.push(Math.cos(a) * speed);
    mvy.push(Math.sin(a) * speed);
    // 34 nitrogen, 9 oxygen, 1 argon out of 44 — dry air to the nearest whole
    // molecule (78.1% N₂, 20.9% O₂, 0.93% Ar).
    mkind.push(i < 34 ? 0 : i < 43 ? 1 : 2);
  }
  return { mx, my, mvx, mvy, mkind };
}

/** A repeatable scatter position for an atom before it snaps into place. */
function scatterAngle(key: string, index: number): number {
  let h = 2166136261 >>> 0;
  const text = `${key}#${index}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ((h >>> 0) / 4294967296) * Math.PI * 2;
}

const model: SimModel<State> = {
  init(params, ctx) {
    return { key: benchKey(params), assembly: 1, spin: 0, ...seedMixture(ctx.rng) };
  },

  applyParams(state, params) {
    const key = benchKey(params);
    // Changing the recipe throws the molecule apart so it can snap together again.
    return key === state.key ? state : { ...state, key, assembly: 0 };
  },

  step(state, dt, params) {
    const assembly = Math.min(1, state.assembly + dt / 0.8);
    const spin = state.spin + dt;
    if (params.system !== "mixture") return { ...state, assembly, spin };

    const mx = state.mx.slice(), my = state.my.slice();
    const mvx = state.mvx.slice(), mvy = state.mvy.slice();
    for (let i = 0; i < MIX_N; i++) {
      mx[i] += mvx[i] * dt;
      my[i] += mvy[i] * dt;
      if (mx[i] < 40) { mx[i] = 40; mvx[i] = Math.abs(mvx[i]); }
      if (mx[i] > BOX_W - 40) { mx[i] = BOX_W - 40; mvx[i] = -Math.abs(mvx[i]); }
      if (my[i] < 40) { my[i] = 40; mvy[i] = Math.abs(mvy[i]); }
      if (my[i] > BOX_H - 40) { my[i] = BOX_H - 40; mvy[i] = -Math.abs(mvy[i]); }
    }
    return { ...state, assembly, spin, mx, my, mvx, mvy };
  },

  readouts(_state, params) {
    const view = describe(params);
    return [
      {
        key: "molecules", label: "Molecules (the coefficient)", quantity: q(view.coefficient, "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "atomsPer", label: "Atoms in one molecule", quantity: q(view.atomsPerMolecule, "count"),
        semantic: "distance", graphable: true,
      },
      {
        key: "atomsTotal", label: "Atoms altogether", quantity: q(view.totalAtoms, "count"),
        semantic: "energy-total", graphable: true,
      },
      {
        key: "hydrogen", label: "Hydrogen atoms", quantity: q(view.totals.H ?? 0, "count"),
        semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "oxygen", label: "Oxygen atoms", quantity: q(view.totals.O ?? 0, "count"),
        semantic: "force", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "carbon", label: "Carbon atoms", quantity: q(view.totals.C ?? 0, "count"),
        semantic: "mass", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "molarMass", label: "Mass of one mole", quantity: q(view.molarMass, "count"),
        semantic: "mass", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(state, params) {
    const view = describe(params);
    return {
      system: params.system as string,
      formula: view.displayFormula,
      name: view.name,
      recognized: view.molecule !== null,
      classification: view.classification,
      coefficient: view.coefficient,
      atomsPerMolecule: view.atomsPerMolecule,
      totalAtoms: view.totalAtoms,
      hydrogen: view.totals.H ?? 0,
      oxygen: view.totals.O ?? 0,
      carbon: view.totals.C ?? 0,
      nitrogen: view.totals.N ?? 0,
      molarMass: view.molarMass,
      assembled: state.assembly >= 1,
      view: params.view as string,
    };
  },
};

/* ------------------------------------------------------------------ *
 * What is on the bench right now
 * ------------------------------------------------------------------ */

export interface BenchView {
  molecule: Molecule | null;
  coefficient: number;
  /** Counts inside one molecule — the subscripts. */
  per: Record<string, number>;
  /** Counts across every copy — coefficient × subscript. */
  totals: Record<string, number>;
  atomsPerMolecule: number;
  totalAtoms: number;
  molarMass: number;
  displayFormula: string;
  name: string;
  classification: "element" | "compound" | "mixture" | "loose atoms";
}

export function describe(params: ParamValues): BenchView {
  const system = params.system as string;
  const coefficient = Math.max(1, Math.round(params.coefficient as number));

  if (system === "lattice") {
    const per = parseFormula("NaCl");
    return {
      molecule: null, coefficient: 1, per, totals: per,
      atomsPerMolecule: 2, totalAtoms: 2, molarMass: molarMass("NaCl"),
      displayFormula: "NaCl", name: "Sodium chloride", classification: "compound",
    };
  }
  if (system === "mixture") {
    const totals = { N: 68, O: 18, Ar: 1 };
    return {
      molecule: null, coefficient: 1, per: totals, totals,
      atomsPerMolecule: 0, totalAtoms: 87, molarMass: 0,
      displayFormula: "N₂ + O₂ + Ar", name: "Air", classification: "mixture",
    };
  }

  const c = Math.round(params.carbon as number);
  const h = Math.round(params.hydrogen as number);
  const n = Math.round(params.nitrogen as number);
  const o = Math.round(params.oxygen as number);
  const molecule = moleculeFor(c, h, n, o);
  const per: Record<string, number> = {};
  if (c) per.C = c;
  if (h) per.H = h;
  if (n) per.N = n;
  if (o) per.O = o;
  const totals: Record<string, number> = {};
  for (const [el, v] of Object.entries(per)) totals[el] = v * coefficient;
  const atomsPerMolecule = c + h + n + o;

  return {
    molecule,
    coefficient,
    per,
    totals,
    atomsPerMolecule,
    totalAtoms: atomsPerMolecule * coefficient,
    molarMass: molecule ? molarMass(molecule.formula) * coefficient : 0,
    displayFormula: molecule
      ? `${coefficient > 1 ? coefficient : ""}${molecule.formula}`
      : atomsPerMolecule === 0 ? "nothing" : "no molecule",
    name: molecule ? molecule.name : atomsPerMolecule === 0 ? "An empty bench" : "Not a molecule in this kit",
    classification: molecule ? molecule.kind : atomsPerMolecule === 0 ? "loose atoms" : "loose atoms",
  };
}

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const HEADER_H = 50;
const STRIP_H = 132;
const PANEL_W = 196;

function formulaWidth(
  ctx: CanvasRenderingContext2D, size: number, coefficient: number, parts: { el: string; n: number }[],
): number {
  let w = 0;
  ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
  if (coefficient > 1) w += ctx.measureText(String(coefficient)).width + size * 0.08;
  for (const p of parts) {
    w += ctx.measureText(p.el).width;
    if (p.n > 1) {
      ctx.font = `800 ${size * 0.62}px "Bricolage Grotesque", system-ui, sans-serif`;
      w += ctx.measureText(String(p.n)).width;
      ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    }
  }
  return w;
}

/**
 * A chemical formula drawn the way it is written: the coefficient full size at
 * the front, subscripts small and dropped. Drawing them differently is the
 * point — a student who sees them rendered identically will read them
 * identically.
 */
function drawFormula(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  coefficient: number, parts: { el: string; n: number }[],
  color: string, subColor: string,
) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let cx = x;
  if (coefficient > 1) {
    ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = subColor;
    ctx.fillText(String(coefficient), cx, y);
    cx += ctx.measureText(String(coefficient)).width + size * 0.08;
  }
  for (const p of parts) {
    ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(p.el, cx, y);
    cx += ctx.measureText(p.el).width;
    if (p.n > 1) {
      ctx.font = `800 ${size * 0.62}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = subColor;
      ctx.fillText(String(p.n), cx, y + size * 0.2);
      cx += ctx.measureText(String(p.n)).width;
    }
  }
  ctx.restore();
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function drawMolecule(
  rc: RenderContext<State>, m: Molecule, cx: number, cy: number, scale: number,
  spaceFilling: boolean, assembly: number, phase: number, key: string,
) {
  const { ctx, theme } = rc;
  const tilt = Math.sin(phase * 0.7) * 0.10;
  const bob = Math.sin(phase * 0.9) * 2.5;
  const ease = smoothstep(assembly);
  const cos = Math.cos(tilt), sin = Math.sin(tilt);

  const px: number[] = new Array(m.atoms.length);
  const py: number[] = new Array(m.atoms.length);
  for (let i = 0; i < m.atoms.length; i++) {
    const a = m.atoms[i];
    // y is up in the molecule's own frame and down on the canvas.
    const tx = cx + (a.x * cos - a.y * sin) * scale;
    const ty = cy - (a.x * sin + a.y * cos) * scale + bob;
    if (ease >= 1) { px[i] = tx; py[i] = ty; continue; }
    const ang = scatterAngle(key, i);
    const fly = m.extent * 2.6 * scale;
    px[i] = tx + Math.cos(ang) * fly * (1 - ease);
    py[i] = ty + Math.sin(ang) * fly * (1 - ease);
  }

  /* ---- bonds appear only once the atoms have arrived ---- */
  const bondAlpha = smoothstep((ease - 0.55) / 0.45);
  if (!spaceFilling && bondAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = bondAlpha;
    ctx.lineCap = "round";
    for (const [i, j, order] of m.bonds) {
      const dx = px[j] - px[i], dy = py[j] - py[i];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const w = Math.max(2, 22 * scale);
      const gap = order > 1 ? Math.max(2.2, w * 0.75) : 0;
      for (let k = 0; k < order; k++) {
        const off = (k - (order - 1) / 2) * gap;
        ctx.strokeStyle = hexA(theme.inkSoft, 0.85);
        ctx.lineWidth = order > 1 ? Math.max(1.6, w * 0.45) : w;
        ctx.beginPath();
        ctx.moveTo(px[i] + nx * off, py[i] + ny * off);
        ctx.lineTo(px[j] + nx * off, py[j] + ny * off);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---- atoms, biggest first so small ones sit in front ---- */
  const order = m.atoms.map((_, i) => i);
  order.sort((a, b) => ATOMS[m.atoms[b].el].vdw - ATOMS[m.atoms[a].el].vdw);
  for (const i of order) {
    const el = m.atoms[i].el;
    const r = spaceFilling
      ? Math.max(4, ATOMS[el].vdw * scale)
      : Math.max(3.5, ATOMS[el].covalent * scale * 1.5);
    sphere(ctx, px[i], py[i], r, atomColor(el, theme), { glow: ease < 1 ? 0.4 : 0 });
    if (r > 11) {
      ctx.save();
      ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.8)" : "rgba(255,255,255,0.88)";
      ctx.font = `700 ${Math.min(15, r * 0.95)}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el, px[i], py[i]);
      ctx.restore();
    }
  }

  // A brief flash the moment the molecule finishes snapping together.
  if (ease > 0.9 && ease < 1) glow(ctx, cx, cy, m.extent * scale * 1.4, theme.accent, 0.5 * (1 - ease) * 10);
}

/** Atoms the kit cannot bond into anything, left drifting on the bench. */
function looseMolecule(per: Record<string, number>): Molecule {
  const atoms: Atom[] = [];
  const els: Elem[] = [];
  for (const [el, n] of Object.entries(per)) {
    for (let k = 0; k < n; k++) els.push(el as Elem);
  }
  const R = 60 + els.length * 24;
  els.forEach((el, i) => {
    const a = (i / Math.max(1, els.length)) * Math.PI * 2;
    atoms.push({ el, x: Math.cos(a) * R, y: Math.sin(a) * R });
  });
  return build("?", "Not a molecule", [], atoms, [], "These atoms do not bond into anything in this kit.");
}

/**
 * Rock salt. There is no NaCl molecule anywhere in this picture: every sodium
 * ion is surrounded by six chlorides and every chloride by six sodiums, and the
 * formula is the ratio that repeats, not a particle you could pick up.
 */
function drawLattice(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params, band } = rc;
  const spaceFilling = params.view === "space";
  const cols = 7, rows = 5;
  const pitch = Math.min(w / (cols + 1.4), h / (rows + 1.4));
  const x0 = x + (w - (cols - 1) * pitch) / 2;
  const y0 = y + (h - (rows - 1) * pitch) / 2;
  // Real ionic radii: Na⁺ 102 pm, Cl⁻ 181 pm, 282 pm apart in rock salt.
  const rNa = pitch * (spaceFilling ? 0.36 : 0.22);
  const rCl = pitch * (spaceFilling ? 0.64 : 0.34);

  /* ---- a second plane behind, so the crystal has depth ---- */
  ctx.save();
  ctx.globalAlpha = 0.32;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const isNa = (r + c) % 2 === 1;
      sphere(
        ctx, x0 + (c + 0.5) * pitch - pitch * 0.24, y0 + (r + 0.5) * pitch - pitch * 0.24,
        isNa ? rNa : rCl, atomColor(isNa ? "Na" : "Cl", theme),
      );
    }
  }
  ctx.restore();

  if (!spaceFilling) {
    ctx.save();
    ctx.strokeStyle = hexA(theme.inkSoft, 0.45);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      ctx.moveTo(x0, y0 + r * pitch);
      ctx.lineTo(x0 + (cols - 1) * pitch, y0 + r * pitch);
    }
    for (let c = 0; c < cols; c++) {
      ctx.moveTo(x0 + c * pitch, y0);
      ctx.lineTo(x0 + c * pitch, y0 + (rows - 1) * pitch);
    }
    ctx.stroke();
    ctx.restore();
  }

  let na = 0, cl = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isNa = (r + c) % 2 === 0;
      if (isNa) na++; else cl++;
      const cxp = x0 + c * pitch, cyp = y0 + r * pitch;
      sphere(ctx, cxp, cyp, isNa ? rNa : rCl, atomColor(isNa ? "Na" : "Cl", theme));
      const rr = isNa ? rNa : rCl;
      if (rr > 12 && band !== "3-5") {
        ctx.save();
        ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.85)" : "rgba(255,255,255,0.9)";
        ctx.font = `700 ${Math.min(13, rr * 0.8)}px "Bricolage Grotesque", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isNa ? "Na⁺" : "Cl⁻", cxp, cyp);
        ctx.restore();
      }
    }
  }

  badge(ctx, x + w / 2, y + h - 14, `${na} Na⁺  :  ${cl} Cl⁻`, theme, {
    align: "center", color: theme.accent, sub: "a 1 : 1 ratio, not a molecule",
  });
}

/** Dry air: the molecules are mixed, not joined. */
function drawMixture(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, params } = rc;
  const spaceFilling = params.view === "space";
  const sx = w / BOX_W, sy = h / BOX_H;
  const s = Math.min(sx, sy);
  const ox = x + (w - BOX_W * s) / 2;
  const oy = y + (h - BOX_H * s) / 2;

  ctx.save();
  ctx.fillStyle = hexA(theme.sci["gas"], 0.07);
  roundRect(ctx, ox, oy, BOX_W * s, BOX_H * s, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const half = (spaceFilling ? 62 : 46) * s;
  for (let i = 0; i < MIX_N; i++) {
    const kind = state.mkind[i];
    const el: Elem = kind === 0 ? "N" : kind === 1 ? "O" : "Ar";
    const r = Math.max(2.5, (spaceFilling ? ATOMS[el].vdw : ATOMS[el].covalent * 1.5) * s * 0.62);
    const cxp = ox + state.mx[i] * s;
    const cyp = oy + state.my[i] * s;
    if (kind === 2) {
      sphere(ctx, cxp, cyp, r, atomColor(el, theme));
      continue;
    }
    // Diatomic: two atoms joined, tumbling as one.
    const a = state.spin * (0.6 + kind * 0.5) + i;
    const dx = Math.cos(a) * half * 0.5, dy = Math.sin(a) * half * 0.5;
    if (!spaceFilling) {
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.7);
      ctx.lineWidth = Math.max(1.4, r * 0.55);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cxp - dx, cyp - dy);
      ctx.lineTo(cxp + dx, cyp + dy);
      ctx.stroke();
      ctx.restore();
    }
    sphere(ctx, cxp - dx, cyp - dy, r, atomColor(el, theme));
    sphere(ctx, cxp + dx, cyp + dy, r, atomColor(el, theme));
  }

  const legend: [string, Elem, string][] = [
    ["N₂  78%", "N", "nitrogen"],
    ["O₂  21%", "O", "oxygen"],
    ["Ar  0.9%", "Ar", "argon"],
  ];
  let lx = ox + 12;
  for (const [text, el] of legend) {
    sphere(ctx, lx + 5, oy + BOX_H * s - 14, 5, atomColor(el, theme));
    caption(ctx, lx + 14, oy + BOX_H * s - 14, text, theme, { size: 10, color: theme.inkSoft });
    lx += 78;
  }
}

function byFormula(formula: string): Molecule {
  const m = MOLECULES.find((x) => x.formula === formula);
  if (!m) throw new Error(`molecule ${formula} is missing from the kit`);
  return m;
}
const WATER = byFormula("H2O");
const PEROXIDE = byFormula("H2O2");

function drawCountPanel(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, band } = rc;
  const view = describe(rc.params);

  lifted(ctx, 12, 4, () => {
    ctx.fillStyle = theme.surface;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
  }, 0.18);
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 12, y + 18, "Counting the atoms", theme, { size: 12, weight: 800 });

  let ry = y + 40;
  const rows = Object.entries(view.per);
  if (rows.length === 0) {
    caption(ctx, x + 12, ry, "Add some atoms to begin.", theme, { size: 11, color: theme.inkSoft });
    return;
  }

  if (rc.params.system === "molecules") {
    caption(ctx, x + 12, ry, "molecules × subscript = atoms", theme, { size: 9, color: theme.inkSoft });
    ry += 16;
  }
  for (const [el, n] of rows) {
    if (ry > y + h - 40) break;
    sphere(ctx, x + 17, ry, 6, atomColor(el as Elem, theme));
    caption(ctx, x + 30, ry, el, theme, { size: 12, weight: 700 });
    const total = view.totals[el] ?? n;
    const text = rc.params.system === "molecules"
      ? `${view.coefficient} × ${n} = ${total}`
      : `${total}`;
    caption(ctx, x + w - 12, ry, text, theme, {
      align: "right", size: 12, weight: 700, color: theme.ink,
    });
    ry += 22;
  }

  ry += 6;
  ctx.save();
  ctx.strokeStyle = hexA(theme.line, 1);
  ctx.beginPath();
  ctx.moveTo(x + 12, ry - 10);
  ctx.lineTo(x + w - 12, ry - 10);
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 12, ry, "Atoms altogether", theme, { size: 11, color: theme.inkSoft });
  caption(ctx, x + w - 12, ry, String(view.totalAtoms), theme, {
    align: "right", size: 14, weight: 800, color: theme.accent,
  });
  ry += 22;

  if (band === "9-12" && view.molarMass > 0 && ry < y + h - 12) {
    caption(ctx, x + 12, ry, "Mass of one mole", theme, { size: 11, color: theme.inkSoft });
    caption(ctx, x + w - 12, ry, `${view.molarMass.toFixed(2)} g`, theme, {
      align: "right", size: 12, weight: 700,
    });
  }
}

/**
 * The permanent exhibit. Left: the coefficient 2, which makes two whole,
 * separate water molecules. Right: the subscript 2, which adds one oxygen
 * *inside* a single molecule and produces a different substance entirely.
 * Same two characters, same two symbols, completely different meaning.
 */
function drawContrastStrip(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, theme, params, state } = rc;
  const spaceFilling = params.view === "space";
  const half = (w - 10) / 2;
  const built = describe(params);
  const isTwoWater = built.molecule === WATER && built.coefficient === 2;
  const isPeroxide = built.molecule === PEROXIDE;

  caption(
    ctx, x, y - 6,
    "A coefficient multiplies whole molecules. A subscript counts atoms inside one.",
    theme, { size: 11, color: theme.inkSoft, weight: 600 },
  );

  const panels: [number, string, Molecule, number, string, boolean][] = [
    [x, "2H2O", WATER, 2, "two molecules · 4 H · 2 O · 6 atoms", isTwoWater],
    [x + half + 10, "H2O2", PEROXIDE, 1, "one molecule · 2 H · 2 O · 4 atoms", isPeroxide],
  ];

  for (const [px0, , mol, copies, sub, active] of panels) {
    ctx.save();
    ctx.fillStyle = hexA(active ? theme.accent : theme.surfaceAlt, active ? 0.16 : 0.7);
    roundRect(ctx, px0, y, half, h, 10);
    ctx.fill();
    ctx.strokeStyle = active ? theme.accent : hexA(theme.line, 1);
    ctx.lineWidth = active ? 2 : 1;
    roundRect(ctx, px0, y, half, h, 10);
    ctx.stroke();
    ctx.restore();

    drawFormula(
      ctx, px0 + 12, y + 26, 20,
      copies, mol.parts.map((p) => ({ el: p.el, n: p.n })),
      theme.ink, copies > 1 ? theme.sci["acceleration"] : theme.sci["field"],
    );
    caption(ctx, px0 + 12, y + h - 14, sub, theme, { size: 10, color: theme.inkSoft });
    if (active) {
      caption(ctx, px0 + half - 12, y + 20, "you built this", theme, {
        align: "right", size: 10, color: theme.accent, weight: 700,
      });
    }

    const boxY = y + 32;
    const boxH = h - 52;
    const scale = Math.min(half / (copies * 2.6), boxH / 2.2) / mol.extent;
    for (let k = 0; k < copies; k++) {
      const cx = px0 + (half * (k + 0.5)) / copies;
      drawMolecule(
        rc, mol, cx, boxY + boxH / 2, scale, spaceFilling, 1,
        state.spin + k * 1.7, `contrast${copies}`,
      );
      if (copies > 1) {
        ctx.save();
        ctx.strokeStyle = hexA(theme.sci["acceleration"], 0.6);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, boxY + boxH / 2, Math.min(half / (copies * 2.1), boxH * 0.44), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function drawChips(rc: RenderContext<State>, rightX: number, y: number) {
  const { ctx, theme } = rc;
  const view = describe(rc.params);
  const chips: [string, string][] = [
    ["Element", "producer"],
    ["Compound", "base"],
    ["Mixture", "gas"],
  ];
  ctx.save();
  ctx.font = "700 11px system-ui, sans-serif";
  let cw = 0;
  const widths = chips.map(([t]) => {
    const w = ctx.measureText(t).width + 18;
    cw += w + 6;
    return w;
  });
  ctx.restore();
  let cx = rightX - cw + 6;
  chips.forEach(([text, sci], i) => {
    const on = view.classification.toLowerCase() === text.toLowerCase();
    const color = theme.sci[sci];
    ctx.save();
    ctx.fillStyle = on ? hexA(color, 0.9) : hexA(theme.inkSoft, 0.1);
    roundRect(ctx, cx, y, widths[i], 22, 11);
    ctx.fill();
    if (on) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.fillStyle = on ? (isDarkTheme(theme) ? "#0b1017" : "#ffffff") : theme.inkSoft;
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx + widths[i] / 2, y + 11);
    ctx.restore();
    cx += widths[i] + 6;
  });
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const view = describe(params);
  const system = params.system as string;
  const spaceFilling = params.view === "space";

  sky(ctx, width, height, theme, "indoor");

  /* ---- header: the formula, written properly ---- */
  const parts = view.molecule
    ? view.molecule.parts
    : Object.entries(view.per).map(([el, n]) => ({ el, n }));
  if (system === "mixture") {
    caption(ctx, 14, 34, "N₂  +  O₂  +  Ar", theme, { size: 26, weight: 800 });
  } else if (parts.length > 0) {
    drawFormula(
      ctx, 14, 36, 26, view.coefficient, parts,
      theme.ink, view.coefficient > 1 ? theme.sci["acceleration"] : theme.sci["field"],
    );
  } else {
    caption(ctx, 14, 30, "An empty bench", theme, { size: 20, weight: 800, color: theme.inkSoft });
  }
  const fw = parts.length > 0 ? formulaWidth(ctx, 26, view.coefficient, parts) : 120;
  caption(ctx, 24 + fw, 32, view.name, theme, { size: 14, weight: 700, color: theme.inkSoft });
  if (width > 520) drawChips(rc, width - 14, 12);

  /* ---- the bench ---- */
  const showStrip = overlays.contrast && height >= 420 && width >= 460 && system === "molecules";
  const showPanel = overlays.counts && width >= 640;
  const areaX = 12;
  const areaY = HEADER_H;
  const areaW = width - areaX * 2 - (showPanel ? PANEL_W + 12 : 0);
  const areaH = height - areaY - (showStrip ? STRIP_H + 10 : 14);

  if (areaW > 80 && areaH > 80) {
    if (system === "lattice") {
      drawLattice(rc, areaX, areaY, areaW, areaH);
    } else if (system === "mixture") {
      drawMixture(rc, areaX, areaY, areaW, areaH);
    } else if (view.molecule || view.atomsPerMolecule > 0) {
      const mol = view.molecule ?? looseMolecule(view.per);
      const copies = view.molecule ? view.coefficient : 1;
      const cols = copies === 4 ? 2 : copies;
      const rows = copies === 4 ? 2 : 1;
      const cellW = areaW / cols;
      const cellH = areaH / rows;
      const scale = (Math.min(cellW, cellH) * 0.40) / mol.extent;
      for (let k = 0; k < copies; k++) {
        const col = k % cols;
        const row = Math.floor(k / cols);
        const cx = areaX + cellW * (col + 0.5);
        const cy = areaY + cellH * (row + 0.5);
        drawMolecule(rc, mol, cx, cy, scale, spaceFilling, state.assembly, state.spin + k * 1.7, state.key);
        if (copies > 1) {
          ctx.save();
          ctx.strokeStyle = hexA(theme.sci["acceleration"], 0.45);
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          caption(ctx, cx, cy + Math.min(cellW, cellH) * 0.42 + 12, `molecule ${k + 1}`, theme, {
            align: "center", size: 10, color: theme.sci["acceleration"], weight: 700,
          });
        }
      }
      if (!view.molecule) {
        caption(ctx, areaX + areaW / 2, areaY + areaH - 34, "These atoms do not make a molecule in this kit.", theme, {
          align: "center", size: 13, weight: 700, color: theme.sci["force"],
        });
        caption(ctx, areaX + areaW / 2, areaY + areaH - 16, "Try 2 hydrogen and 1 oxygen.", theme, {
          align: "center", size: 11, color: theme.inkSoft,
        });
      }
    } else {
      caption(ctx, areaX + areaW / 2, areaY + areaH / 2, "Add atoms with the sliders.", theme, {
        align: "center", size: 15, color: theme.inkSoft,
      });
    }

    /* ---- what the model is, and what it hides ---- */
    const note = system === "lattice"
      ? "One giant lattice. There is no single NaCl particle to point at."
      : system === "mixture"
        ? "Mixed, not joined — each molecule keeps its own identity."
        : view.molecule?.note ?? "";
    if (note && band !== "3-5") {
      caption(ctx, areaX + 4, areaY + areaH - 4, note, theme, { size: 11, color: theme.inkSoft });
    }
    if (system === "molecules" && view.molecule && band !== "3-5") {
      caption(ctx, areaX + areaW - 4, areaY + 12, spaceFilling
        ? "Space-filling: the room the atoms really take up"
        : "Ball-and-stick: the bonds, drawn to be seen", theme, {
        align: "right", size: 10, color: theme.inkSoft,
      });
    }
  }

  if (showPanel) drawCountPanel(rc, width - PANEL_W - 12, areaY, PANEL_W, areaH);
  if (showStrip) drawContrastStrip(rc, 12, height - STRIP_H - 2, width - 24, STRIP_H - 12);

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const moleculesSim: SimManifest<State> = {
  id: "chem.molecules",
  title: "Molecule Builder",
  tagline: "Snap atoms together, read the formula that comes out, and find out what a little 2 changes.",
  subject: "chemistry",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["5-PS1-1", "MS-PS1-1", "HS-PS1-1"] },
  learningGoals: [
    "Read a chemical formula and say exactly how many of each atom it names.",
    "Tell a coefficient from a subscript, and say what each one changes.",
    "Classify a substance as an element, a compound or a mixture.",
    "Choose between a ball-and-stick model, a space-filling model and a lattice.",
  ],
  misconceptions: [
    "2H₂O and H₂O₂ mean the same thing",
    "A subscript multiplies the whole formula",
    "Every compound is made of molecules",
    "A mixture and a compound are the same because both contain two substances",
    "The balls in a model are what atoms look like",
  ],
  tickRate: 60,
  interactionHint: "Add atoms with the sliders. When they make a real molecule, they snap together.",
  params: {
    system: {
      type: "option", label: "What to build",
      options: [
        { value: "molecules", label: "Molecules" },
        { value: "lattice", label: "Salt crystal" },
        { value: "mixture", label: "Air" },
      ],
      default: "molecules",
      help: "Salt is a lattice with no molecules at all, and air is a mixture that is not bonded at all.",
    },
    hydrogen: {
      type: "number", label: "Hydrogen atoms", kind: "count",
      min: 0, max: 12, step: 1, default: 2,
    },
    oxygen: {
      type: "number", label: "Oxygen atoms", kind: "count",
      min: 0, max: 6, step: 1, default: 1,
    },
    carbon: {
      type: "number", label: "Carbon atoms", kind: "count",
      min: 0, max: 6, step: 1, default: 0,
      bands: ["3-5", "6-8", "9-12"],
    },
    nitrogen: {
      type: "number", label: "Nitrogen atoms", kind: "count",
      min: 0, max: 3, step: 1, default: 0,
      bands: ["6-8", "9-12"],
    },
    coefficient: {
      type: "number", label: "How many molecules (coefficient)", kind: "count",
      min: 1, max: 4, step: 1, default: 1,
      bands: ["6-8", "9-12"],
      help: "The big number in front. It copies the whole molecule; it never changes what one molecule is.",
    },
    view: {
      type: "option", label: "Model",
      options: [
        { value: "ball", label: "Ball-and-stick" },
        { value: "space", label: "Space-filling" },
      ],
      default: "ball",
      help: "Ball-and-stick shows the bonds. Space-filling shows the room the atoms really take up.",
    },
  },
  overlays: [
    { key: "counts", label: "Atom count", default: true },
    { key: "contrast", label: "2H₂O vs H₂O₂", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "coefficient-vs-subscript",
      title: "What does the little 2 do?",
      question: "Is 2H₂O the same as H₂O₂?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS1-1"],
      setup: { system: "molecules", hydrogen: 2, oxygen: 1, carbon: 0, nitrogen: 0, coefficient: 1, view: "ball" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit before you build",
          instruction: "Two formulas, both with a 2 and both with H and O.",
          predict: {
            prompt: "2H₂O and H₂O₂ are…",
            options: [
              "the same substance written two ways",
              "both water, one just has more of it",
              "different substances with different numbers of atoms",
              "the same number of atoms arranged differently",
            ],
            correct: 2,
            reveal: "2H₂O is two water molecules — 4 hydrogen and 2 oxygen. H₂O₂ is one molecule of hydrogen peroxide — 2 hydrogen and 2 oxygen. Different substances, different atom counts. Peroxide bleaches hair; water does not.",
          },
        },
        {
          id: "one-water",
          phase: "measure",
          title: "Build one water",
          instruction: "Set hydrogen to 2 and oxygen to 1. Record the atom counts.",
          requireData: 1,
          check: {
            describe: "Water is on the bench",
            test: (v) => v.facts.formula === "H2O",
          },
        },
        {
          id: "two-waters",
          phase: "measure",
          title: "Now put a 2 in front",
          instruction: "Set the coefficient to 2. Count the molecules on the stage, then record.",
          requireData: 2,
          check: {
            describe: "Two water molecules",
            test: (v) => v.facts.formula === "2H2O" && v.facts.totalAtoms === 6,
          },
          hints: ["The dashed rings show you where one molecule ends and the next begins."],
        },
        {
          id: "peroxide",
          phase: "measure",
          title: "Now build peroxide instead",
          instruction: "Set the coefficient back to 1 and oxygen to 2. Record it.",
          requireData: 3,
          check: {
            describe: "Hydrogen peroxide is on the bench",
            test: (v) => v.facts.formula === "H2O2",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write down what a coefficient does and what a subscript does.",
          write: {
            prompt: "What does the number in front change, and what does the small number below change?",
            placeholder: "A coefficient ... A subscript ...",
          },
        },
      ],
    },
    {
      id: "element-compound-mixture",
      title: "Element, compound or mixture?",
      question: "What is the difference between oxygen, water and air?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 18,
      standards: ["5-PS1-1", "MS-PS1-1"],
      setup: { system: "molecules", hydrogen: 0, oxygen: 2, carbon: 0, nitrogen: 0, coefficient: 1, view: "space" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Air contains oxygen. Water contains oxygen too.",
          predict: {
            prompt: "Which one could you separate with no chemical reaction at all?",
            options: ["Oxygen gas", "Water", "Air", "None of them"],
            correct: 2,
            reveal: "Air is a mixture: cool it down and the nitrogen, oxygen and argon each turn liquid at their own temperature, and out they come. Water is a compound — to separate it you have to break bonds.",
          },
        },
        {
          id: "element",
          phase: "measure",
          title: "Build an element",
          instruction: "Two oxygen atoms and nothing else. Which chip lights up?",
          check: {
            describe: "An element is on the bench",
            test: (v) => v.facts.classification === "element",
          },
        },
        {
          id: "compound",
          phase: "measure",
          title: "Build a compound",
          instruction: "Add 2 hydrogen and take oxygen down to 1.",
          check: {
            describe: "A compound is on the bench",
            test: (v) => v.facts.classification === "compound",
          },
        },
        {
          id: "mixture",
          phase: "measure",
          title: "Now look at air",
          instruction: "Switch What to build to Air. Watch what the molecules do — and do not do.",
          check: {
            describe: "Air is on the stage",
            test: (v) => v.facts.classification === "mixture",
          },
          hints: ["Nothing in air is bonded to anything else. That is the whole difference."],
        },
        {
          id: "salt",
          phase: "analyze",
          title: "And the odd one out",
          instruction: "Switch to Salt crystal. Try to find a single NaCl molecule in it.",
          check: {
            describe: "The salt lattice is on the stage",
            test: (v) => v.facts.system === "lattice",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Sort them out",
          instruction: "Explain how you would tell each kind apart.",
          write: {
            prompt: "How can you tell an element, a compound and a mixture apart?",
            placeholder: "An element has ... A compound has ... A mixture is ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "build-glucose",
      title: "Build the sugar",
      brief: "Glucose is C₆H₁₂O₆. Assemble it from atoms — all 24 of them.",
      bands: ["6-8", "9-12"],
      setup: { system: "molecules", carbon: 1, hydrogen: 4, oxygen: 0, nitrogen: 0, coefficient: 1, view: "ball" },
      goal: {
        describe: "Glucose is assembled",
        test: (v) => v.facts.formula === "C6H12O6",
      },
      stars: {
        two: {
          describe: "Glucose, fully snapped together",
          test: (v) => v.facts.formula === "C6H12O6" && Boolean(v.facts.assembled),
        },
        three: {
          describe: "Glucose seen as a space-filling model",
          test: (v) =>
            v.facts.formula === "C6H12O6" && Boolean(v.facts.assembled) && v.facts.view === "space",
        },
      },
      hints: [
        "Read the formula straight off: six carbon, twelve hydrogen, six oxygen.",
        "Every slider has to be at its number at the same time — nothing snaps until they all match.",
        "24 atoms in one molecule. Check the count panel as you go.",
      ],
    },
    {
      id: "twelve-hydrogens",
      title: "Twelve hydrogen atoms, three ways",
      brief: "Get exactly 12 hydrogen atoms onto the bench using a coefficient, not just subscripts.",
      bands: ["6-8", "9-12"],
      setup: { system: "molecules", carbon: 0, hydrogen: 3, oxygen: 0, nitrogen: 1, coefficient: 1, view: "ball" },
      goal: {
        describe: "Exactly 12 hydrogen atoms in a real molecule",
        test: (v) => v.facts.hydrogen === 12 && Boolean(v.facts.recognized),
      },
      stars: {
        two: {
          describe: "Reach 12 with more than one molecule",
          test: (v) =>
            v.facts.hydrogen === 12 && Boolean(v.facts.recognized) && (v.facts.coefficient as number) > 1,
        },
        three: {
          describe: "Reach 12 using four copies of one molecule",
          test: (v) =>
            v.facts.hydrogen === 12 && Boolean(v.facts.recognized) && v.facts.coefficient === 4,
        },
      },
      hints: [
        "4 × 3 = 12. Which molecule has three hydrogens in it?",
        "Ammonia is NH₃. What does a coefficient of 4 do to that?",
        "3 × NH₃ gives 9 hydrogens; 4 × NH₃ gives 12.",
      ],
    },
  ],
};
