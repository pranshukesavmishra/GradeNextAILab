import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { camera, disc, label, roundRect } from "@ui/draw";

/**
 * Build an Atom — Grades 6-12.
 *
 * Add and remove protons, neutrons and electrons and watch what each one
 * actually controls. Change a neutron and you get a different isotope of the
 * same element. Change an electron and you get an ion. Change a proton and you
 * get a different element entirely — that is the only particle that does.
 *
 * The element name, the mass number, the charge, the shell filling and the
 * stability are all derived from the three counts. Stability comes from the
 * real table of stable nuclides for the first twenty elements, so ¹⁴C really is
 * marked unstable and ¹³C really is not.
 */

/* ------------------------------------------------------------------ *
 * Chemistry data
 * ------------------------------------------------------------------ */

interface Element {
  symbol: string;
  name: string;
  /** Neutron numbers with a stable nucleus. */
  stable: number[];
  /** Neutron number of the most abundant isotope on Earth. */
  common: number;
}

/** The first twenty elements, with their real stable isotopes. */
export const ELEMENTS: Record<number, Element> = {
  1: { symbol: "H", name: "Hydrogen", stable: [0, 1], common: 0 },
  2: { symbol: "He", name: "Helium", stable: [1, 2], common: 2 },
  3: { symbol: "Li", name: "Lithium", stable: [3, 4], common: 4 },
  4: { symbol: "Be", name: "Beryllium", stable: [5], common: 5 },
  5: { symbol: "B", name: "Boron", stable: [5, 6], common: 6 },
  6: { symbol: "C", name: "Carbon", stable: [6, 7], common: 6 },
  7: { symbol: "N", name: "Nitrogen", stable: [7, 8], common: 7 },
  8: { symbol: "O", name: "Oxygen", stable: [8, 9, 10], common: 8 },
  9: { symbol: "F", name: "Fluorine", stable: [10], common: 10 },
  10: { symbol: "Ne", name: "Neon", stable: [10, 11, 12], common: 10 },
  11: { symbol: "Na", name: "Sodium", stable: [12], common: 12 },
  12: { symbol: "Mg", name: "Magnesium", stable: [12, 13, 14], common: 12 },
  13: { symbol: "Al", name: "Aluminium", stable: [14], common: 14 },
  14: { symbol: "Si", name: "Silicon", stable: [14, 15, 16], common: 14 },
  15: { symbol: "P", name: "Phosphorus", stable: [16], common: 16 },
  16: { symbol: "S", name: "Sulfur", stable: [16, 17, 18, 20], common: 16 },
  17: { symbol: "Cl", name: "Chlorine", stable: [18, 20], common: 18 },
  18: { symbol: "Ar", name: "Argon", stable: [18, 20, 22], common: 22 },
  19: { symbol: "K", name: "Potassium", stable: [20, 22], common: 20 },
  20: { symbol: "Ca", name: "Calcium", stable: [20, 22, 23, 24, 26, 28], common: 20 },
};

/** Bohr shell capacities: 2, then 8, 8, and 2 — enough for the first twenty. */
const SHELLS = [2, 8, 8, 2];

/** The element a nucleus with this many protons *is*. Nothing else decides it. */
export function elementFor(protons: number): Element | undefined {
  return ELEMENTS[protons];
}

/** True when this exact combination of protons and neutrons is a stable nuclide. */
export function isStableNuclide(protons: number, neutrons: number): boolean {
  const el = ELEMENTS[protons];
  return el ? el.stable.includes(neutrons) : false;
}

/** How the electrons fill the shells, innermost first. */
export function shellFilling(electrons: number): number[] {
  const out: number[] = [];
  let left = electrons;
  for (const cap of SHELLS) {
    const here = Math.min(cap, Math.max(0, left));
    out.push(here);
    left -= here;
  }
  return out;
}

const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";

function toScript(n: number, table: string): string {
  return String(n).split("").map((d) => table[Number(d)]).join("");
}

/** Isotope notation, e.g. ¹⁴₆C for carbon-14. */
export function isotopeNotation(protons: number, neutrons: number): string {
  const el = ELEMENTS[protons];
  if (!el) return "—";
  return `${toScript(protons + neutrons, SUPER)}${toScript(protons, SUB)}${el.symbol}`;
}

/** Ion notation, e.g. Ca²⁺ or Cl⁻. */
export function ionNotation(protons: number, electrons: number): string {
  const el = ELEMENTS[protons];
  if (!el) return "—";
  const charge = protons - electrons;
  if (charge === 0) return el.symbol;
  const magnitude = Math.abs(charge) === 1 ? "" : toScript(Math.abs(charge), SUPER);
  return `${el.symbol}${magnitude}${charge > 0 ? "⁺" : "⁻"}`;
}

/* ------------------------------------------------------------------ *
 * State — only the animation needs to evolve
 * ------------------------------------------------------------------ */

interface State {
  t: number;
  shellPhase: number[];
}

const SHELL_SPEED = [0.85, -0.55, 0.38, -0.28];

const model: SimModel<State> = {
  init() {
    return { t: 0, shellPhase: [0, 1.1, 2.3, 0.6] };
  },

  step(state, dt) {
    const shellPhase = state.shellPhase.slice();
    for (let i = 0; i < shellPhase.length; i++) {
      shellPhase[i] = (shellPhase[i] + SHELL_SPEED[i] * dt) % (Math.PI * 2);
    }
    return { t: state.t + dt, shellPhase };
  },

  readouts(_state, params) {
    const p = Math.round(params.protons as number);
    const n = Math.round(params.neutrons as number);
    const e = Math.round(params.electrons as number);
    return [
      { key: "protons", label: "Protons", quantity: q(p, "count"), semantic: "charge-pos", graphable: true },
      { key: "neutrons", label: "Neutrons", quantity: q(n, "count"), semantic: "mass", graphable: true },
      { key: "electrons", label: "Electrons", quantity: q(e, "count"), semantic: "charge-neg", graphable: true },
      {
        key: "atomicNumber", label: "Atomic number (Z)", quantity: q(p, "count"),
        semantic: "charge-pos", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "massNumber", label: "Mass number (A)", quantity: q(p + n, "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "charge", label: "Net charge", quantity: q((p - e) * CONSTANTS.e, "charge"), unit: "e",
        semantic: p - e >= 0 ? "charge-pos" : "charge-neg", graphable: true,
      },
    ];
  },

  facts(_state, params) {
    const p = Math.round(params.protons as number);
    const n = Math.round(params.neutrons as number);
    const e = Math.round(params.electrons as number);
    const el = elementFor(p);
    return {
      element: el?.symbol ?? "none",
      elementName: el?.name ?? "No element",
      protons: p,
      neutrons: n,
      electrons: e,
      massNumber: p + n,
      charge: p - e,
      isNeutral: p === e && p > 0,
      isIon: p !== e && p > 0,
      isStable: isStableNuclide(p, n),
      isCommonIsotope: el ? n === el.common : false,
      isIsotope: el ? n !== el.common : false,
      notation: el ? isotopeNotation(p, n) : "—",
      ion: el ? ionNotation(p, e) : "—",
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

const WORLD_W = 31;
const WORLD_H = 19;
const CENTRE_X = 10.5;
const CENTRE_Y = 11.0;
const SHELL_R = [2.9, 4.5, 6.1, 7.7];

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const cam = camera({ x0: -0.5, y0: -0.5, x1: WORLD_W + 0.5, y1: WORLD_H + 0.5, width, height });
  const px = (x: number) => cam.toScreenX(x);
  const py = (y: number) => cam.toScreenY(y);
  const scale = cam.scale;

  const p = Math.round(params.protons as number);
  const nCount = Math.round(params.neutrons as number);
  const e = Math.round(params.electrons as number);
  const el = elementFor(p);
  const charge = p - e;
  const stable = isStableNuclide(p, nCount);
  const filling = shellFilling(e);

  /* ---- electron shells ---- */
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  for (let k = 0; k < SHELLS.length; k++) {
    if (filling[k] === 0 && (k === 0 || filling[k - 1] === 0)) continue;
    ctx.setLineDash(filling[k] === SHELLS[k] ? [] : [5, 4]);
    ctx.beginPath();
    ctx.arc(px(CENTRE_X), py(CENTRE_Y), SHELL_R[k] * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  /* ---- nucleus ---- */
  const total = p + nCount;
  const nucleonR = Math.max(2, 0.27 * scale);
  let placed = 0;
  for (let k = 0; k < total; k++) {
    // Golden-angle packing gives an even, non-crystalline cluster at any count.
    const rr = 0.3 * Math.sqrt(k);
    const angle = k * 2.39996323;
    const wob = 0.055;
    const nx = CENTRE_X + rr * Math.cos(angle) + wob * Math.sin(state.t * 2.1 + k);
    const ny = CENTRE_Y + rr * Math.sin(angle) + wob * Math.cos(state.t * 2.6 + k * 1.7);
    // Interleave protons and neutrons so the nucleus reads as a mixture.
    const isProton = placed * total < (k + 1) * p;
    if (isProton) placed++;
    disc(
      ctx, px(nx), py(ny), nucleonR,
      isProton ? theme.sci["charge-pos"] : theme.sci["mass"],
      { stroke: theme.surface, lineWidth: 1 },
    );
  }
  if (total === 0) {
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px(CENTRE_X), py(CENTRE_Y), 0.9 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, "Add a proton to start", px(CENTRE_X), py(CENTRE_Y - 1.7), theme, {
      align: "center", size: 12, color: theme.inkSoft,
    });
  }

  /* ---- electrons ---- */
  const electronR = Math.max(2, 0.2 * scale);
  for (let k = 0; k < SHELLS.length; k++) {
    const count = filling[k];
    for (let i = 0; i < count; i++) {
      const a = state.shellPhase[k] + (i / count) * Math.PI * 2;
      disc(
        ctx,
        px(CENTRE_X + SHELL_R[k] * Math.cos(a)),
        py(CENTRE_Y + SHELL_R[k] * Math.sin(a)),
        electronR, theme.sci["charge-neg"], { stroke: theme.surface, lineWidth: 1.5 },
      );
    }
  }

  /* ---- element card ---- */
  const cx = 19.6, cw = WORLD_W - cx - 0.4, cy = 9.4, ch = 9.2;
  ctx.save();
  ctx.fillStyle = theme.surfaceAlt;
  roundRect(ctx, px(cx), py(cy + ch), cw * scale, ch * scale, 8);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = el ? theme.ink : theme.inkSoft;
  ctx.font = `700 ${Math.max(28, scale * 2.6)}px system-ui, sans-serif`;
  ctx.fillText(el ? ionNotation(p, e) : "?", px(cx + cw / 2), py(cy + ch - 2.3));
  ctx.font = `600 ${Math.max(13, scale * 0.9)}px system-ui, sans-serif`;
  ctx.fillStyle = theme.inkSoft;
  ctx.fillText(el ? el.name : "No element yet", px(cx + cw / 2), py(cy + ch - 4.0));
  ctx.restore();

  if (el) {
    label(ctx, isotopeNotation(p, nCount), px(cx + cw / 2), py(cy + ch - 5.3), theme, {
      align: "center", size: Math.max(14, scale * 1.0),
    });
    const chargeText =
      charge === 0 ? "Neutral atom" : charge > 0 ? `Positive ion, ${charge}+` : `Negative ion, ${-charge}−`;
    label(ctx, chargeText, px(cx + cw / 2), py(cy + ch - 6.6), theme, {
      align: "center", size: 12,
      color: charge === 0 ? theme.sci["neutral"] : charge > 0 ? theme.sci["charge-pos"] : theme.sci["charge-neg"],
    });
    label(
      ctx, stable ? "Stable nucleus" : "Unstable — radioactive",
      px(cx + cw / 2), py(cy + ch - 7.8), theme,
      { align: "center", size: 12, color: stable ? theme.sci["energy-kinetic"] : theme.sci["force"] },
    );
    if (band === "9-12") {
      label(ctx, `Z = ${p}   A = ${p + nCount}`, px(cx + cw / 2), py(cy + 0.6), theme, {
        align: "center", size: 11, color: theme.inkSoft,
      });
    }
  }

  /* ---- key ---- */
  const keyY = 8.0;
  const keys: [string, string][] = [
    ["charge-pos", `${p} proton${p === 1 ? "" : "s"}`],
    ["mass", `${nCount} neutron${nCount === 1 ? "" : "s"}`],
    ["charge-neg", `${e} electron${e === 1 ? "" : "s"}`],
  ];
  for (let i = 0; i < keys.length; i++) {
    const kx = 1.2 + i * 6.4;
    disc(ctx, px(kx), py(keyY), Math.max(3, 0.24 * scale), theme.sci[keys[i][0]]);
    label(ctx, keys[i][1], px(kx + 0.6), py(keyY), theme, { size: 12, plate: false, color: theme.inkSoft });
  }

  /* ---- shell filling readout ---- */
  if (band !== "3-5" && e > 0) {
    const text = filling.filter((c, i) => c > 0 || (i > 0 && filling[i - 1] > 0)).join(" · ");
    label(ctx, `Shells: ${text}`, px(1.2), py(6.6), theme, { size: 12, color: theme.sci["charge-neg"] });
  }

  /* ---- the first twenty elements ---- */
  if (overlays.periodic) {
    const stripY = 2.4, cellW = (WORLD_W - 1.6) / 20, cellH = 2.4;
    for (let z = 1; z <= 20; z++) {
      const sx = 0.8 + (z - 1) * cellW;
      const here = z === p;
      ctx.save();
      ctx.fillStyle = here ? theme.accent : theme.surfaceAlt;
      roundRect(ctx, px(sx), py(stripY + cellH), cellW * scale - 2, cellH * scale, 3);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = here ? theme.surface : theme.inkSoft;
      ctx.font = `${here ? 700 : 500} ${Math.max(9, scale * 0.62)}px system-ui, sans-serif`;
      ctx.fillText(ELEMENTS[z].symbol, px(sx + cellW / 2) - 1, py(stripY + cellH / 2 + 0.28));
      ctx.font = `${Math.max(7, scale * 0.44)}px system-ui, sans-serif`;
      ctx.fillText(String(z), px(sx + cellW / 2) - 1, py(stripY + cellH / 2 - 0.55));
      ctx.restore();
    }
    label(ctx, "The first twenty elements — the proton count picks the box", px(0.8), py(1.2), theme, {
      size: 11, color: theme.inkSoft,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const buildAtomSim: SimManifest<State> = {
  id: "chem.build-atom",
  title: "Build an Atom",
  tagline: "Add protons, neutrons and electrons one at a time, and find out which one decides what element you have made.",
  subject: "chemistry",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS1-1", "HS-PS1-1", "HS-PS1-8"] },
  learningGoals: [
    "Identify an element from its proton count alone.",
    "Work out mass number, net charge and isotope notation from the three particle counts.",
    "Explain the difference between an isotope and an ion.",
    "Fill electron shells in the 2-8-8 pattern and connect a full outer shell to unreactive elements.",
    "Explain why changing electrons never changes which element you have.",
  ],
  misconceptions: [
    "Adding a neutron makes a different element",
    "An ion is a different element from its atom",
    "The atomic mass is the number of protons",
    "Electrons sit still in fixed places",
    "Every combination of protons and neutrons is stable",
  ],
  tickRate: 60,
  interactionHint: "Use the steppers to add or remove each kind of particle.",
  params: {
    protons: {
      type: "number", label: "Protons", kind: "count",
      min: 0, max: 20, step: 1, default: 6,
      help: "The only particle that decides which element you have.",
    },
    neutrons: {
      type: "number", label: "Neutrons", kind: "count",
      min: 0, max: 28, step: 1, default: 6,
      help: "Changes the mass and the stability, never the element.",
    },
    electrons: {
      type: "number", label: "Electrons", kind: "count",
      min: 0, max: 20, step: 1, default: 6,
      help: "Changes the charge, never the element.",
    },
  },
  overlays: [
    { key: "periodic", label: "First twenty elements", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "what-makes-an-element",
      title: "What makes an element?",
      question: "Which particle decides whether you have carbon or nitrogen?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS1-1"],
      setup: { protons: 6, neutrons: 6, electrons: 6 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Commit before you change anything.",
          predict: {
            prompt: "Which particle decides which element an atom is?",
            options: ["Protons", "Neutrons", "Electrons", "All three together"],
            correct: 0,
            reveal: "Only the proton count. Change the neutrons and you get an isotope; change the electrons and you get an ion. Both are still the same element.",
          },
        },
        {
          id: "neutrons",
          phase: "measure",
          title: "Change a neutron",
          instruction: "Set neutrons to 8, leaving the protons alone. Is it still carbon?",
          check: {
            describe: "Six protons and eight neutrons",
            test: (v) => v.facts.protons === 6 && v.facts.neutrons === 8,
          },
          hints: ["Watch the element card. Which part of it changed?"],
        },
        {
          id: "electrons",
          phase: "measure",
          title: "Now change an electron",
          instruction: "Take one electron away. Is it still carbon?",
          check: {
            describe: "Six protons and five electrons",
            test: (v) => v.facts.protons === 6 && v.facts.electrons === 5,
          },
        },
        {
          id: "protons",
          phase: "measure",
          title: "Now add a proton",
          instruction: "Add one proton. Watch the element card carefully.",
          check: {
            describe: "The element is now nitrogen",
            test: (v) => v.facts.element === "N",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write a rule someone else could use.",
          write: {
            prompt: "Which particle decides the element, and what do the other two change instead?",
            placeholder: "The element is decided by ... Neutrons change ... Electrons change ...",
          },
        },
      ],
    },
    {
      id: "ion-isotope",
      title: "Make an ion, make an isotope",
      question: "What is the difference between an isotope and an ion?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["HS-PS1-1", "HS-PS1-8"],
      setup: { protons: 8, neutrons: 8, electrons: 8 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Oxygen-16 has 8 protons, 8 neutrons and 8 electrons.",
          predict: {
            prompt: "If you add two electrons to it, what have you made?",
            options: [
              "Neon",
              "An oxide ion, O²⁻",
              "Oxygen-18",
              "A radioactive atom",
            ],
            correct: 1,
            reveal: "Two extra electrons give a charge of 2−. The proton count is untouched, so it is still oxygen — the oxide ion, O²⁻.",
          },
        },
        {
          id: "isotope",
          phase: "setup",
          title: "Make an isotope",
          instruction: "Build oxygen-18: same element, two extra neutrons, still neutral.",
          check: {
            describe: "8 protons, 10 neutrons, 8 electrons",
            test: (v) => v.facts.protons === 8 && v.facts.neutrons === 10 && v.facts.electrons === 8,
          },
          hints: ["The mass number A is protons plus neutrons. You want A = 18."],
        },
        {
          id: "ion",
          phase: "setup",
          title: "Now make an ion",
          instruction: "Go back to 8 neutrons and add two electrons to make O²⁻.",
          check: {
            describe: "A negative oxygen ion with charge 2−",
            test: (v) => v.facts.element === "O" && v.facts.charge === -2,
          },
        },
        {
          id: "unstable",
          phase: "analyze",
          title: "Break the nucleus",
          instruction: "Keep 8 protons and add neutrons until the nucleus is no longer stable.",
          check: {
            describe: "Oxygen with an unstable nucleus",
            test: (v) => v.facts.element === "O" && v.facts.isStable === false,
          },
          hints: ["Oxygen is stable with 8, 9 or 10 neutrons. Go past that."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Say the difference",
          instruction: "Explain isotope versus ion in your own words.",
          write: {
            prompt: "What changes to make an isotope? What changes to make an ion? What stays the same in both?",
            placeholder: "An isotope has different ... An ion has different ... Both keep the same ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "chloride",
      title: "Build a chloride ion",
      brief: "Make a stable Cl⁻ ion — the thing that makes salt water salty.",
      bands: ["6-8", "9-12"],
      setup: { protons: 6, neutrons: 6, electrons: 6 },
      goal: {
        describe: "A stable chlorine nucleus carrying a 1− charge",
        test: (v) => v.facts.element === "Cl" && v.facts.charge === -1 && v.facts.isStable === true,
      },
      stars: {
        two: {
          describe: "The ion also has a full outer shell",
          test: (v) =>
            v.facts.element === "Cl" && v.facts.charge === -1 && v.facts.isStable === true &&
            v.facts.electrons === 18,
        },
        three: {
          describe: "It is chlorine-35, the common isotope",
          test: (v) =>
            v.facts.element === "Cl" && v.facts.charge === -1 && v.facts.isStable === true &&
            v.facts.massNumber === 35,
        },
      },
      hints: [
        "Chlorine is element 17 — check the strip along the bottom.",
        "A 1− charge means one more electron than protons.",
        "Chlorine is stable with 18 or 20 neutrons. Chlorine-35 is the common one.",
      ],
    },
    {
      id: "carbon-14",
      title: "Make carbon-14",
      brief: "Build the radioactive carbon isotope archaeologists use to date bones.",
      bands: ["9-12"],
      setup: { protons: 6, neutrons: 6, electrons: 6 },
      goal: {
        describe: "Carbon with mass number 14, neutral, and unstable",
        test: (v) =>
          v.facts.element === "C" && v.facts.massNumber === 14 &&
          v.facts.charge === 0 && v.facts.isStable === false,
      },
      hints: [
        "Carbon always has 6 protons — that is what makes it carbon.",
        "Mass number 14 means protons plus neutrons is 14.",
        "Carbon is stable with 6 or 7 neutrons, which is why carbon-14 decays.",
      ],
    },
  ],
};
