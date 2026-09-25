import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, glow, hexA, isDarkTheme, lifted, material, sky, sphere, vignette,
} from "@ui/scene";

/**
 * The Living Periodic Table — Grades 6-12.
 *
 * Mendeleev's table is not a poster to be memorised: it is a *graph* of the
 * properties of matter, and the whole point is that those properties repeat.
 * So this table is built to be recoloured. Switch the colour from "type" to
 * "atom size" and the size of an atom falls, step by step, all the way across
 * a period and then jumps back up at the start of the next one — and it does
 * that seven times over, which is exactly why the rows are called *periods*.
 * The trend chart under the table plots the same numbers so the sawtooth is
 * unmissable.
 *
 * Confronts the belief that the table is an arbitrary list, that the atomic
 * mass is what orders it, and that "reactive" means "dangerous".
 *
 * ── Where the numbers come from ────────────────────────────────────────────
 * · Atomic masses are IUPAC standard atomic weights (2021), rounded to five
 *   significant figures.
 * · Atomic radii are the calculated (Clementi 1963) radii in picometres, the
 *   set most classroom tables use, because it is the only one defined for
 *   every element here including the noble gases.
 * · Electronegativities are on the Pauling scale. Helium, neon and argon have
 *   no Pauling value at all — they form no ordinary bonds — and are stored as
 *   0, which the table draws as "—".
 * · First ionisation energies are in kJ/mol (NIST).
 * · Electron shell occupancies are the real ground-state configurations,
 *   including the two famous exceptions, chromium and copper.
 * · "Reactivity" is the one number here that is not measured: it is a teaching
 *   index computed from the measured quantities above. See `reactivity()`.
 */

export type Category =
  | "alkali" | "alkaline" | "transition" | "post-transition" | "metalloid"
  | "nonmetal" | "halogen" | "noble" | "lanthanide" | "actinide";

export interface ChemElement {
  z: number;
  symbol: string;
  name: string;
  /** Standard atomic weight, u. */
  mass: number;
  /** 1-18. Zero for the f-block, which sits outside the main grid. */
  group: number;
  period: number;
  category: Category;
  /** Physical state at 25 °C and 1 atm. */
  state: "solid" | "liquid" | "gas";
  /** Calculated atomic radius, pm. */
  radius: number;
  /** Pauling electronegativity; 0 where the scale has no value. */
  en: number;
  /** First ionisation energy, kJ/mol. */
  ie: number;
  /** Ground-state electrons per shell. */
  shells: number[];
  /** One real thing this element is used for. */
  use: string;
}

const E = (
  z: number, symbol: string, name: string, mass: number, group: number, period: number,
  category: Category, state: ChemElement["state"], radius: number, en: number, ie: number,
  shells: number[], use: string,
): ChemElement => ({ z, symbol, name, mass, group, period, category, state, radius, en, ie, shells, use });

/**
 * Periods 1-4 are complete. Beyond argon the table keeps its true shape but
 * only the elements a middle-school student actually meets are filled in; the
 * rest are drawn as empty outlines, because pretending they are not there
 * would teach the wrong shape.
 */
export const ELEMENTS: ChemElement[] = [
  E(1, "H", "Hydrogen", 1.008, 1, 1, "nonmetal", "gas", 53, 2.20, 1312, [1],
    "fuelling rocket engines and hydrogen fuel-cell buses"),
  E(2, "He", "Helium", 4.0026, 18, 1, "noble", "gas", 31, 0, 2372, [2],
    "lifting balloons and cooling the magnets inside an MRI scanner"),
  E(3, "Li", "Lithium", 6.94, 1, 2, "alkali", "solid", 167, 0.98, 520, [2, 1],
    "the rechargeable battery in every phone and laptop"),
  E(4, "Be", "Beryllium", 9.0122, 2, 2, "alkaline", "solid", 112, 1.57, 899, [2, 2],
    "stiff, feather-light windows for X-ray machines"),
  E(5, "B", "Boron", 10.81, 13, 2, "metalloid", "solid", 87, 2.04, 801, [2, 3],
    "borax in laundry powder and heat-proof borosilicate glass"),
  E(6, "C", "Carbon", 12.011, 14, 2, "nonmetal", "solid", 67, 2.55, 1086, [2, 4],
    "pencil lead, diamond, and the backbone of every living thing"),
  E(7, "N", "Nitrogen", 14.007, 15, 2, "nonmetal", "gas", 56, 3.04, 1402, [2, 5],
    "78% of the air, and liquid nitrogen for flash-freezing food"),
  E(8, "O", "Oxygen", 15.999, 16, 2, "nonmetal", "gas", 48, 3.44, 1314, [2, 6],
    "the gas you breathe and the oxygen cylinders in an ambulance"),
  E(9, "F", "Fluorine", 18.998, 17, 2, "halogen", "gas", 42, 3.98, 1681, [2, 7],
    "fluoride in toothpaste, which hardens tooth enamel"),
  E(10, "Ne", "Neon", 20.180, 18, 2, "noble", "gas", 38, 0, 2081, [2, 8],
    "the orange-red glow of a neon sign"),
  E(11, "Na", "Sodium", 22.990, 1, 3, "alkali", "solid", 190, 0.93, 496, [2, 8, 1],
    "half of table salt, and the yellow glow of street lamps"),
  E(12, "Mg", "Magnesium", 24.305, 2, 3, "alkaline", "solid", 145, 1.31, 738, [2, 8, 2],
    "the blinding white flare in fireworks, and light bike frames"),
  E(13, "Al", "Aluminium", 26.982, 13, 3, "post-transition", "solid", 118, 1.61, 578, [2, 8, 3],
    "drinks cans, kitchen foil and aircraft bodies"),
  E(14, "Si", "Silicon", 28.085, 14, 3, "metalloid", "solid", 111, 1.90, 787, [2, 8, 4],
    "the chip inside every computer and phone, and ordinary glass"),
  E(15, "P", "Phosphorus", 30.974, 15, 3, "nonmetal", "solid", 98, 2.19, 1012, [2, 8, 5],
    "the striking strip on a matchbox, and fertiliser for crops"),
  E(16, "S", "Sulfur", 32.06, 16, 3, "nonmetal", "solid", 88, 2.58, 1000, [2, 8, 6],
    "toughening the rubber in car tyres, and the smell of a struck match"),
  E(17, "Cl", "Chlorine", 35.45, 17, 3, "halogen", "gas", 79, 3.16, 1251, [2, 8, 7],
    "killing germs in swimming pools and in drinking water"),
  E(18, "Ar", "Argon", 39.95, 18, 3, "noble", "gas", 71, 0, 1521, [2, 8, 8],
    "filling double-glazed windows and shielding a welder's arc"),
  E(19, "K", "Potassium", 39.098, 1, 4, "alkali", "solid", 243, 0.82, 419, [2, 8, 8, 1],
    "fertiliser, and the potassium in a banana that your nerves run on"),
  E(20, "Ca", "Calcium", 40.078, 2, 4, "alkaline", "solid", 194, 1.00, 590, [2, 8, 8, 2],
    "your bones and teeth, chalk, and the cement in concrete"),
  E(21, "Sc", "Scandium", 44.956, 3, 4, "transition", "solid", 184, 1.36, 633, [2, 8, 9, 2],
    "extra-light frames for racing bicycles and aircraft parts"),
  E(22, "Ti", "Titanium", 47.867, 4, 4, "transition", "solid", 176, 1.54, 659, [2, 8, 10, 2],
    "hip replacements, spectacle frames and jet engines"),
  E(23, "V", "Vanadium", 50.942, 5, 4, "transition", "solid", 171, 1.63, 651, [2, 8, 11, 2],
    "making steel tough enough for spanners and springs"),
  E(24, "Cr", "Chromium", 51.996, 6, 4, "transition", "solid", 166, 1.66, 653, [2, 8, 13, 1],
    "the shiny chrome on taps and bumpers, and stainless steel"),
  E(25, "Mn", "Manganese", 54.938, 7, 4, "transition", "solid", 161, 1.55, 717, [2, 8, 13, 2],
    "hardening railway track, and the black powder in alkaline batteries"),
  E(26, "Fe", "Iron", 55.845, 8, 4, "transition", "solid", 156, 1.83, 762, [2, 8, 14, 2],
    "steel for bridges and cars, and the haemoglobin in your blood"),
  E(27, "Co", "Cobalt", 58.933, 9, 4, "transition", "solid", 152, 1.88, 760, [2, 8, 15, 2],
    "the deep blue of stained glass, and lithium battery electrodes"),
  E(28, "Ni", "Nickel", 58.693, 10, 4, "transition", "solid", 149, 1.91, 737, [2, 8, 16, 2],
    "stainless steel, coins, and rechargeable NiMH batteries"),
  E(29, "Cu", "Copper", 63.546, 11, 4, "transition", "solid", 145, 1.90, 745, [2, 8, 18, 1],
    "the wires in your walls and the pipes carrying your water"),
  E(30, "Zn", "Zinc", 65.38, 12, 4, "transition", "solid", 142, 1.65, 906, [2, 8, 18, 2],
    "galvanising steel so it cannot rust, and sun cream"),
  E(31, "Ga", "Gallium", 69.723, 13, 4, "post-transition", "solid", 136, 1.81, 579, [2, 8, 18, 3],
    "the blue LEDs in phone screens and traffic lights"),
  E(32, "Ge", "Germanium", 72.630, 14, 4, "metalloid", "solid", 125, 2.01, 762, [2, 8, 18, 4],
    "the glass core of fibre-optic cable and night-vision lenses"),
  E(33, "As", "Arsenic", 74.922, 15, 4, "metalloid", "solid", 114, 2.18, 947, [2, 8, 18, 5],
    "doping semiconductors — and, historically, a notorious poison"),
  E(34, "Se", "Selenium", 78.971, 16, 4, "nonmetal", "solid", 103, 2.55, 941, [2, 8, 18, 6],
    "anti-dandruff shampoo and the light-sensitive drum in a photocopier"),
  E(35, "Br", "Bromine", 79.904, 17, 4, "halogen", "liquid", 94, 2.96, 1140, [2, 8, 18, 7],
    "flame retardants, and the silver bromide in old photographic film"),
  E(36, "Kr", "Krypton", 83.798, 18, 4, "noble", "gas", 88, 3.00, 1351, [2, 8, 18, 8],
    "the brilliant white beam of a high-power flashlight"),
  E(47, "Ag", "Silver", 107.87, 11, 5, "transition", "solid", 165, 1.93, 731, [2, 8, 18, 18, 1],
    "electrical contacts, jewellery and antibacterial wound dressings"),
  E(50, "Sn", "Tin", 118.71, 14, 5, "post-transition", "solid", 145, 1.96, 709, [2, 8, 18, 18, 4],
    "the solder holding circuit boards together, and food-can plating"),
  E(53, "I", "Iodine", 126.90, 17, 5, "halogen", "solid", 115, 2.66, 1008, [2, 8, 18, 18, 7],
    "iodised table salt, which protects your thyroid, and antiseptic"),
  E(54, "Xe", "Xenon", 131.29, 18, 5, "noble", "gas", 108, 2.60, 1170, [2, 8, 18, 18, 8],
    "car headlamps and the ion engines that steer spacecraft"),
  E(56, "Ba", "Barium", 137.33, 2, 6, "alkaline", "solid", 253, 0.89, 503, [2, 8, 18, 18, 8, 2],
    "the barium meal that makes your gut show up on an X-ray"),
  E(78, "Pt", "Platinum", 195.08, 10, 6, "transition", "solid", 177, 2.28, 870, [2, 8, 18, 32, 17, 1],
    "the catalyst inside a car's catalytic converter"),
  E(79, "Au", "Gold", 196.97, 11, 6, "transition", "solid", 174, 2.54, 890, [2, 8, 18, 32, 18, 1],
    "jewellery, and contacts inside electronics that must never corrode"),
  E(80, "Hg", "Mercury", 200.59, 12, 6, "transition", "liquid", 171, 2.00, 1007, [2, 8, 18, 32, 18, 2],
    "old thermometers and fluorescent tubes — the only liquid metal"),
  E(82, "Pb", "Lead", 207.2, 14, 6, "post-transition", "solid", 154, 2.33, 716, [2, 8, 18, 32, 18, 4],
    "car batteries and the heavy apron the dentist puts on you"),
  E(92, "U", "Uranium", 238.03, 0, 7, "actinide", "solid", 175, 1.38, 598, [2, 8, 18, 32, 21, 9, 2],
    "the fuel rods in a nuclear power station"),
];

const BY_Z = new Map(ELEMENTS.map((e) => [e.z, e]));

export function elementByZ(z: number): ChemElement | undefined {
  return BY_Z.get(z);
}

/** The element in the set whose atomic number is nearest to z. */
export function nearestElement(z: number): ChemElement {
  let best = ELEMENTS[0];
  for (const e of ELEMENTS) {
    if (Math.abs(e.z - z) < Math.abs(best.z - z)) best = e;
  }
  return best;
}

const METAL_CATEGORIES: Category[] = [
  "alkali", "alkaline", "transition", "post-transition", "lanthanide", "actinide",
];

export function isMetal(e: ChemElement): boolean {
  return METAL_CATEGORIES.includes(e.category);
}

/** Electrons in the outermost occupied shell — what a group has in common. */
export function valenceElectrons(e: ChemElement): number {
  return e.shells[e.shells.length - 1];
}

/**
 * A 0-10 teaching index for "how eagerly does this element react", built from
 * two measured quantities rather than from opinion.
 *
 * A metal reacts by *losing* an electron, so the less energy it takes to pull
 * one off, the more reactive it is: the index runs from 400 kJ/mol (the most
 * loosely held electron in this set) down to 900 kJ/mol. A non-metal reacts by
 * *pulling* an electron in, so its index runs up the Pauling scale from 1.8 to
 * fluorine's 3.98, the highest there is. The noble gases score zero because
 * they do neither. It is an index, not a measurement — but every input to it
 * is measured, and it reproduces the orders a chemistry teacher would give:
 * K > Na > Li among the alkali metals, F > Cl > Br > I among the halogens.
 */
export function reactivity(e: ChemElement): number {
  if (e.category === "noble") return 0;
  const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  if (isMetal(e)) return 10 * clamp01((900 - e.ie) / 500);
  return 10 * clamp01((e.en - 1.8) / (3.98 - 1.8));
}

export type ColorMode = "category" | "radius" | "electronegativity" | "reactivity";

/** The value the heat map is showing, in that property's own units. */
export function propertyValue(e: ChemElement, mode: ColorMode): number {
  switch (mode) {
    case "radius": return e.radius;
    case "electronegativity": return e.en;
    case "reactivity": return reactivity(e);
    default: return e.z;
  }
}

const PROPERTY_RANGE: Record<ColorMode, [number, number, string, string]> = {
  category: [1, 92, "", ""],
  radius: [31, 253, "pm", "Atom size (radius)"],
  electronegativity: [0, 3.98, "", "Electron pull (electronegativity)"],
  reactivity: [0, 10, "", "How eagerly it reacts"],
};

/* ------------------------------------------------------------------ *
 * The unknown-element hunt
 * ------------------------------------------------------------------ */

/** Elements with a distinctive fingerprint, so the clues really do narrow it. */
const MYSTERY_POOL = [8, 11, 26, 17, 2, 29, 20, 13, 16, 19, 6, 79];
const CLUE_INTERVAL = 12; // seconds of sim time between clues
const MAX_CLUES = 6;

export function clueFor(e: ChemElement, index: number): string {
  const metalWord = e.category === "metalloid" ? "a metalloid" : isMetal(e) ? "a metal" : "a non-metal";
  switch (index) {
    case 0: return `At room temperature I am a ${e.state}.`;
    case 1: return `I am ${metalWord}.`;
    case 2: return `I live in period ${e.period} — my electrons fill ${e.shells.length} shells.`;
    case 3: return e.group > 0
      ? `I have ${valenceElectrons(e)} electron${valenceElectrons(e) === 1 ? "" : "s"} in my outer shell.`
      : "I sit in the f-block, below the main table.";
    case 4: return `One atom of me weighs about ${e.mass.toFixed(0)} u.`;
    default: return `You would find me ${e.use}.`;
  }
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  selectedZ: number;
  hoverZ: number;
  /** Screen position of the pointer, so the stage can echo it. */
  pointerX: number;
  pointerY: number;
  mysteryZ: number;
  /** Order the pool was shuffled into, so each round is a different element. */
  order: number[];
  clues: number;
  clueTimer: number;
  solved: boolean;
  /** Seconds since the selection last changed, for the highlight animation. */
  sinceSelect: number;
}

function mysteryFor(order: number[], round: number): number {
  return order[(Math.max(1, Math.round(round)) - 1) % order.length];
}

/* ------------------------------------------------------------------ *
 * Layout — fixed in stage pixels so a click can be resolved by the model
 *
 * The model is handed pointer coordinates in canvas pixels and, by design,
 * knows nothing about the size of the canvas. Anchoring the grid itself to
 * fixed pixel offsets is what lets `step` decide which cell was clicked with
 * exactly the geometry `render` drew. Everything to the right of and below the
 * grid is elastic, so a bigger stage grows the detail card and the trend chart
 * rather than leaving dead space.
 * ------------------------------------------------------------------ */

const TABLE_X = 16;
const TABLE_Y = 58;
const PITCH = 30;
const CELL = 26;
const F_GAP = 10;
const TABLE_W = 18 * PITCH;
const F_ROW_Y = TABLE_Y + 7 * PITCH + F_GAP;
const TABLE_BOTTOM = F_ROW_Y + 2 * PITCH;

/** Grid column (0-17) and row (0-8) for an element. Row 7/8 are the f-block. */
export function cellOf(e: ChemElement): { col: number; row: number } {
  if (e.category === "lanthanide") return { col: e.z - 55, row: 7 };
  if (e.category === "actinide") return { col: e.z - 87, row: 8 };
  return { col: e.group - 1, row: e.period - 1 };
}

function cellRect(col: number, row: number): { x: number; y: number } {
  const y = row < 7 ? TABLE_Y + row * PITCH : F_ROW_Y + (row - 7) * PITCH;
  return { x: TABLE_X + col * PITCH, y };
}

/** Which element sits under a stage pixel, or 0 for none. */
export function hitTest(px: number, py: number): number {
  for (const e of ELEMENTS) {
    const { col, row } = cellOf(e);
    const r = cellRect(col, row);
    if (px >= r.x && px <= r.x + CELL && py >= r.y && py <= r.y + CELL) return e.z;
  }
  return 0;
}

/** Positions the real table occupies, so the empty ones can be drawn hollow. */
function* tablePositions(): Generator<{ col: number; row: number }> {
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 18; col++) {
      if (row === 0 && col !== 0 && col !== 17) continue;
      if ((row === 1 || row === 2) && col > 1 && col < 12) continue;
      yield { col, row };
    }
  }
  for (let row = 7; row <= 8; row++) for (let col = 2; col <= 16; col++) yield { col, row };
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params, ctx) {
    // A deterministic shuffle: the same seed always poses the same puzzles.
    const order = MYSTERY_POOL.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = ctx.rng.int(0, i);
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const selected = nearestElement(params.element as number).z;
    return {
      selectedZ: selected,
      hoverZ: 0,
      pointerX: -1,
      pointerY: -1,
      mysteryZ: mysteryFor(order, params.round as number),
      order,
      clues: 1,
      clueTimer: 0,
      solved: false,
      sinceSelect: 0,
    };
  },

  applyParams(state, params, prev) {
    let s = state;
    if (params.element !== prev.element) {
      const z = nearestElement(params.element as number).z;
      if (z !== s.selectedZ) s = { ...s, selectedZ: z, sinceSelect: 0 };
    }
    if (params.round !== prev.round || params.mystery !== prev.mystery) {
      s = {
        ...s,
        mysteryZ: mysteryFor(s.order, params.round as number),
        clues: 1, clueTimer: 0, solved: false,
      };
    }
    return s;
  },

  step(state, dt, params, _ctx, inputs) {
    let s = state;

    for (const input of inputs) {
      if (input.type === "pointermove") {
        const z = hitTest(input.x, input.y);
        if (z !== s.hoverZ || input.x !== s.pointerX) {
          s = { ...s, hoverZ: z, pointerX: input.x, pointerY: input.y };
        }
      } else if (input.type === "pointerdown") {
        const z = hitTest(input.x, input.y);
        if (z > 0) s = { ...s, selectedZ: z, hoverZ: z, sinceSelect: 0 };
      }
    }

    const hunting = Boolean(params.mystery) && !s.solved;
    let clues = s.clues;
    let clueTimer = s.clueTimer;
    if (hunting) {
      clueTimer += dt;
      while (clueTimer >= CLUE_INTERVAL && clues < MAX_CLUES) {
        clueTimer -= CLUE_INTERVAL;
        clues += 1;
      }
      if (clues >= MAX_CLUES) clueTimer = 0;
    }

    const solved = s.solved || (Boolean(params.mystery) && s.selectedZ === s.mysteryZ);
    return { ...s, clues, clueTimer, solved, sinceSelect: s.sinceSelect + dt };
  },

  readouts(state) {
    const e = elementByZ(state.selectedZ) ?? ELEMENTS[0];
    return [
      {
        key: "atomicNumber", label: "Atomic number (protons)", quantity: q(e.z, "count"),
        semantic: "charge-pos", graphable: true,
      },
      {
        key: "atomicMass", label: "Atomic mass", quantity: q(e.mass, "count"),
        semantic: "mass", graphable: true,
      },
      {
        key: "group", label: "Group (column)", quantity: q(e.group, "count"),
        semantic: "distance", graphable: false,
      },
      {
        key: "period", label: "Period (row)", quantity: q(e.period, "count"),
        semantic: "distance", graphable: false,
      },
      {
        key: "valence", label: "Outer-shell electrons", quantity: q(valenceElectrons(e), "count"),
        semantic: "charge-neg", graphable: true,
      },
      {
        key: "radius", label: "Atom size (radius)", quantity: q(e.radius * 1e-12, "length"),
        unit: "nm", semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "electronegativity", label: "Electron pull (0 = forms no bonds)",
        quantity: q(e.en, "ratio"), semantic: "field", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "ionization", label: "Energy to remove one electron",
        quantity: q(e.ie, "energy"), unit: "kJ", semantic: "energy-potential",
        graphable: true, bands: ["9-12"],
      },
      {
        key: "reactivity", label: "Reactivity index", quantity: q(reactivity(e), "ratio"),
        semantic: "acid", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const e = elementByZ(state.selectedZ) ?? ELEMENTS[0];
    const m = elementByZ(state.mysteryZ) ?? ELEMENTS[0];
    return {
      symbol: e.symbol,
      name: e.name,
      atomicNumber: e.z,
      atomicMass: e.mass,
      group: e.group,
      period: e.period,
      category: e.category,
      state: e.state,
      metal: isMetal(e),
      valence: valenceElectrons(e),
      radius: e.radius,
      electronegativity: e.en,
      ionization: e.ie,
      reactivity: reactivity(e),
      colorBy: params.colorBy as string,
      hunting: Boolean(params.mystery),
      mysterySymbol: m.symbol,
      mysteryZ: m.z,
      cluesShown: state.clues,
      solved: state.solved,
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * Category colour is a classification channel, not a quantity, so it is drawn
 * from the same semantic palette rather than from invented hues: acids' red
 * for the violently reactive alkali metals, the producer green for non-metals,
 * the mass grey for the transition block.
 */
const CATEGORY_SCI: Record<Category, string> = {
  alkali: "acid",
  alkaline: "acceleration",
  transition: "mass",
  "post-transition": "solid",
  metalloid: "base",
  nonmetal: "producer",
  halogen: "current",
  noble: "field",
  lanthanide: "decomposer",
  actinide: "decomposer",
};

const CATEGORY_LABEL: Record<Category, string> = {
  alkali: "Alkali metal",
  alkaline: "Alkaline earth metal",
  transition: "Transition metal",
  "post-transition": "Post-transition metal",
  metalloid: "Metalloid",
  nonmetal: "Non-metal",
  halogen: "Halogen",
  noble: "Noble gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
};

/** The staircase every textbook draws between the metals and the non-metals. */
const STAIRCASE: [number, number][] = [
  [12, 1], [12, 2], [13, 2], [13, 4], [14, 4], [14, 5], [15, 5], [15, 7],
];

function wrapText(
  ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(trial).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) return lines;
    } else {
      line = trial;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/**
 * Blend two hex colours and return hex. The shared `mixHex` returns an
 * `rgb(...)` string, which the scene kit's own shading helpers cannot parse
 * back, and every heat-map colour here is handed to `material` and `glow`.
 */
function blendHex(a: string, b: string, t: number): string {
  const parse = (hex: string): [number, number, number] => {
    let h = hex.trim().replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  };
  const pa = parse(a), pb = parse(b);
  const k = Math.max(0, Math.min(1, t));
  const hx = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${hx(pa[0] + (pb[0] - pa[0]) * k)}${hx(pa[1] + (pb[1] - pa[1]) * k)}${hx(pa[2] + (pb[2] - pa[2]) * k)}`;
}

function cellColor(
  e: ChemElement, mode: ColorMode, theme: RenderContext<State>["theme"],
): string {
  if (mode === "category") return theme.sci[CATEGORY_SCI[e.category]];
  const [lo, hi] = PROPERTY_RANGE[mode];
  const t = (propertyValue(e, mode) - lo) / (hi - lo);
  return blendHex(theme.sci["cold"], theme.sci["hot"], Math.max(0, Math.min(1, t)));
}

function drawTable(rc: RenderContext<State>, mode: ColorMode) {
  const { ctx, state, theme, band, overlays } = rc;
  const dark = isDarkTheme(theme);

  /* ---- the shape of the table, including the elements not in this set ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.28);
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  for (const pos of tablePositions()) {
    const r = cellRect(pos.col, pos.row);
    roundRect(ctx, r.x + 0.5, r.y + 0.5, CELL - 1, CELL - 1, 4);
    ctx.stroke();
  }
  ctx.restore();

  /* ---- column and row addresses: the coordinates of the table ---- */
  if (overlays.labels) {
    ctx.save();
    ctx.font = "600 9px ui-monospace, monospace";
    ctx.fillStyle = theme.inkSoft;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let col = 0; col < 18; col++) {
      ctx.fillText(String(col + 1), TABLE_X + col * PITCH + CELL / 2, TABLE_Y - 3);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let row = 0; row < 7; row++) {
      ctx.fillText(String(row + 1), TABLE_X - 4, TABLE_Y + row * PITCH + CELL / 2);
    }
    ctx.restore();
  }

  /* ---- every element that has data ---- */
  for (const e of ELEMENTS) {
    const { col, row } = cellOf(e);
    const r = cellRect(col, row);
    const base = cellColor(e, mode, theme);
    const selected = e.z === state.selectedZ;
    const hovered = e.z === state.hoverZ && !selected;

    if (selected) {
      // A slow breath on the selected cell, so the eye keeps finding it.
      const pulse = 0.5 + 0.5 * Math.sin(rc.time * 2.4);
      glow(ctx, r.x + CELL / 2, r.y + CELL / 2, CELL * (1.1 + 0.25 * pulse), base, 0.5);
    }
    material(ctx, r.x, r.y, CELL, CELL, base, 4);

    if (selected || hovered) {
      ctx.save();
      ctx.strokeStyle = selected ? theme.ink : hexA(theme.ink, 0.55);
      ctx.lineWidth = selected ? 2.4 : 1.5;
      roundRect(ctx, r.x - 1, r.y - 1, CELL + 2, CELL + 2, 5);
      ctx.stroke();
      ctx.restore();
    }

    // Symbols must stay legible on both a pale and a saturated cell.
    const ink = mixHex(base, dark ? "#ffffff" : "#000000", 0.78);
    ctx.save();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${e.symbol.length > 1 ? 11 : 12}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillText(e.symbol, r.x + CELL / 2, r.y + CELL / 2 + (band === "9-12" ? 0 : 2));
    ctx.font = "600 7px ui-monospace, monospace";
    ctx.fillText(String(e.z), r.x + CELL / 2, r.y + 5);
    if (band === "9-12") {
      ctx.font = "600 6px ui-monospace, monospace";
      ctx.fillText(e.mass.toFixed(e.mass < 100 ? 1 : 0), r.x + CELL / 2, r.y + CELL - 4);
    }
    ctx.restore();
  }

  /* ---- metals, non-metals and the metalloids on the line between ---- */
  if (overlays.regions) {
    ctx.save();
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    STAIRCASE.forEach(([col, row], i) => {
      const x = TABLE_X + col * PITCH - 2;
      const y = TABLE_Y + row * PITCH - 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
    caption(ctx, TABLE_X + 5.5 * PITCH, TABLE_Y + 5.6 * PITCH, "METALS", rc.theme, {
      align: "center", size: 12, color: theme.inkSoft, weight: 800,
    });
    caption(ctx, TABLE_X + 16.2 * PITCH, TABLE_Y + 1.5 * PITCH, "NON-", rc.theme, {
      align: "center", size: 11, color: theme.inkSoft, weight: 800,
    });
    caption(ctx, TABLE_X + 16.2 * PITCH, TABLE_Y + 1.5 * PITCH + 12, "METALS", rc.theme, {
      align: "center", size: 11, color: theme.inkSoft, weight: 800,
    });
  }

  caption(ctx, TABLE_X + 2 * PITCH, F_ROW_Y + CELL / 2, "f-block", rc.theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });
  caption(ctx, TABLE_X + 2 * PITCH, F_ROW_Y + PITCH + CELL / 2, "actinides", rc.theme, {
    align: "right", size: 9, color: theme.inkSoft,
  });
}

function drawLegend(rc: RenderContext<State>, mode: ColorMode) {
  const { ctx, theme } = rc;
  const y = 32;
  const h = 12;
  if (mode === "category") {
    const shown: Category[] = [
      "alkali", "alkaline", "transition", "post-transition",
      "metalloid", "nonmetal", "halogen", "noble",
    ];
    let x = TABLE_X;
    ctx.save();
    ctx.font = "600 9px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    for (const cat of shown) {
      const w = ctx.measureText(CATEGORY_LABEL[cat]).width + 8;
      material(ctx, x, y, 10, 10, theme.sci[CATEGORY_SCI[cat]], 2);
      ctx.fillStyle = theme.inkSoft;
      ctx.fillText(CATEGORY_LABEL[cat], x + 14, y + 5);
      x += w + 20;
    }
    ctx.restore();
    return;
  }

  const [lo, hi, unit, title] = PROPERTY_RANGE[mode];
  const rampX = TABLE_X + 210;
  const rampW = Math.max(60, TABLE_W - 210);
  const g = ctx.createLinearGradient(rampX, 0, rampX + rampW, 0);
  g.addColorStop(0, theme.sci["cold"]);
  g.addColorStop(1, theme.sci["hot"]);
  ctx.save();
  ctx.fillStyle = g;
  roundRect(ctx, rampX, y, rampW, h, 4);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "600 9px ui-monospace, monospace";
  ctx.fillStyle = theme.inkSoft;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(`${lo}${unit}`, rampX - 6, y + h / 2);
  ctx.textAlign = "left";
  ctx.fillText(`${hi}${unit}`, rampX + rampW + 6, y + h / 2);
  ctx.restore();
  caption(ctx, TABLE_X, y + h / 2, title, theme, { size: 11, color: theme.ink, weight: 700 });
}

function drawCard(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme, overlays } = rc;
  const e = elementByZ(state.selectedZ) ?? ELEMENTS[0];
  const tint = theme.sci[CATEGORY_SCI[e.category]];

  lifted(ctx, 14, 5, () => {
    ctx.fillStyle = theme.surface;
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
  }, 0.22);
  ctx.save();
  ctx.strokeStyle = hexA(tint, 0.6);
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.restore();

  /* ---- the cell, blown up ---- */
  const tile = 78;
  material(ctx, x + 14, y + 14, tile, tile, tint, 8);
  ctx.save();
  ctx.fillStyle = mixHex(tint, isDarkTheme(theme) ? "#ffffff" : "#000000", 0.8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 34px \"Bricolage Grotesque\", system-ui, sans-serif";
  ctx.fillText(e.symbol, x + 14 + tile / 2, y + 14 + tile / 2 + 4);
  ctx.font = "600 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(String(e.z), x + 20, y + 24);
  ctx.textAlign = "right";
  ctx.fillText(e.mass.toFixed(e.mass < 100 ? 2 : 1), x + tile + 8, y + tile + 4);
  ctx.restore();

  const tx = x + 14 + tile + 12;
  caption(ctx, tx, y + 26, e.name, theme, { size: 19, weight: 800 });
  caption(ctx, tx, y + 46, CATEGORY_LABEL[e.category], theme, { size: 11, color: tint, weight: 700 });
  caption(
    ctx, tx, y + 64,
    e.group > 0 ? `Group ${e.group} · Period ${e.period}` : `f-block · Period ${e.period}`,
    theme, { size: 11, color: theme.inkSoft },
  );
  caption(ctx, tx, y + 80, `${e.state} at room temperature`, theme, {
    size: 11, color: theme.inkSoft,
  });

  /* ---- the properties the heat map is built from ---- */
  let py = y + tile + 34;
  const bars: [string, number, number, string, string][] = [
    ["Outer-shell electrons", valenceElectrons(e), 8, "", "charge-neg"],
    ["Atom size", e.radius, 253, " pm", "distance"],
    ["Electron pull", e.en, 3.98, "", "field"],
    ["Reactivity", reactivity(e), 10, "", "acid"],
  ];
  const barW = w - 28;
  for (const [name, value, max, unit, sci] of bars) {
    if (py + 22 > y + h - 20) break;
    caption(ctx, x + 14, py, name, theme, { size: 10, color: theme.inkSoft });
    caption(ctx, x + 14 + barW, py, `${value === 0 && sci === "field" ? "—" : value}${unit}`, theme, {
      align: "right", size: 10, color: theme.ink, weight: 700,
    });
    ctx.save();
    ctx.fillStyle = hexA(theme.inkSoft, 0.18);
    roundRect(ctx, x + 14, py + 7, barW, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = theme.sci[sci];
    roundRect(ctx, x + 14, py + 7, Math.max(2, (barW * value) / max), 5, 2.5);
    ctx.fill();
    ctx.restore();
    py += 24;
  }

  /* ---- what it is actually for ---- */
  if (py + 30 < y + h) {
    ctx.save();
    ctx.font = "500 11px system-ui, sans-serif";
    const lines = wrapText(ctx, `You meet it ${e.use}.`, w - 28, 3);
    ctx.restore();
    lines.forEach((line, i) => {
      caption(ctx, x + 14, py + 6 + i * 14, line, theme, { size: 11, color: theme.ink, weight: 500 });
    });
    py += lines.length * 14 + 10;
  }

  /* ---- electrons, actually going round ---- */
  if (overlays.shells && py + 60 < y + h && w > 190) {
    const cx = x + w / 2;
    const cy = Math.min(y + h - 34, py + 34);
    const maxR = Math.min((y + h - 6) - cy, (w - 24) / 2);
    glow(ctx, cx, cy, maxR * 0.5, theme.sci["charge-pos"], 0.35);
    sphere(ctx, cx, cy, Math.max(3, maxR * 0.13), theme.sci["charge-pos"]);
    for (let s = 0; s < e.shells.length; s++) {
      const rr = maxR * ((s + 1) / e.shells.length) * 0.92;
      ctx.save();
      ctx.strokeStyle = hexA(theme.inkSoft, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      const n = e.shells[s];
      // Outer shells sweep more slowly, and every shell turns the same way.
      const speed = 0.55 / (s + 1);
      const drawn = Math.min(n, 18);
      for (let k = 0; k < drawn; k++) {
        const a = rc.time * speed + (k / drawn) * Math.PI * 2;
        sphere(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.6, theme.sci["charge-neg"]);
      }
    }
    caption(ctx, x + w - 14, cy + maxR, e.shells.join(" · "), theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
  }
}

/**
 * The whole argument of the periodic table in one picture: a property plotted
 * against atomic number, falling across each row and jumping back at the start
 * of the next. The rows are called periods because this is what they do.
 */
function drawTrend(rc: RenderContext<State>, x: number, y: number, w: number, h: number, mode: ColorMode) {
  const { ctx, state, theme } = rc;
  const run = ELEMENTS.filter((e) => e.z <= 36);
  const readValue = (e: ChemElement) => (mode === "category" ? valenceElectrons(e) : propertyValue(e, mode));
  const [lo, hi] = mode === "category" ? [0, 8] : PROPERTY_RANGE[mode];
  const title = mode === "category"
    ? "Electrons in the outer shell — the pattern that makes the columns"
    : `${PROPERTY_RANGE[mode][3]} across the first 36 elements`;

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.75);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 12, y + 15, title, theme, { size: 11, weight: 700 });

  const plotX = x + 34;
  const plotY = y + 28;
  const plotW = w - 46;
  const plotH = h - 44;
  if (plotW < 60 || plotH < 30) return;
  const sx = (z: number) => plotX + ((z - 1) / 35) * plotW;
  const sy = (v: number) => plotY + plotH - ((v - lo) / (hi - lo)) * plotH;

  /* ---- one band per period, so the repeat is impossible to miss ---- */
  const periods: [number, number, number][] = [[1, 1, 2], [2, 3, 10], [3, 11, 18], [4, 19, 36]];
  ctx.save();
  for (const [p, z0, z1] of periods) {
    if (p % 2 === 0) {
      ctx.fillStyle = hexA(theme.inkSoft, 0.07);
      ctx.fillRect(sx(z0) - PITCH / 12, plotY, sx(z1) - sx(z0) + PITCH / 6, plotH);
    }
    ctx.fillStyle = theme.inkSoft;
    ctx.font = "600 9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`period ${p}`, (sx(z0) + sx(z1)) / 2, plotY + plotH + 12);
  }
  ctx.restore();

  /* ---- axis ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();
  ctx.font = "600 9px ui-monospace, monospace";
  ctx.fillStyle = theme.inkSoft;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(String(hi), plotX - 4, plotY);
  ctx.fillText(String(lo), plotX - 4, plotY + plotH);
  ctx.restore();

  /* ---- the trace ---- */
  ctx.save();
  ctx.strokeStyle = hexA(theme.ink, 0.35);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  run.forEach((e, i) => {
    const px = sx(e.z), py = sy(readValue(e));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();

  for (const e of run) {
    const selected = e.z === state.selectedZ;
    sphere(ctx, sx(e.z), sy(readValue(e)), selected ? 5.5 : 3, cellColor(e, mode, theme), {
      glow: selected ? 0.9 : 0,
    });
  }

  const sel = elementByZ(state.selectedZ);
  if (sel && sel.z <= 36) {
    const px = sx(sel.z);
    ctx.save();
    ctx.strokeStyle = hexA(theme.ink, 0.4);
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, plotY);
    ctx.lineTo(px, plotY + plotH);
    ctx.stroke();
    ctx.restore();
    const v = readValue(sel);
    badge(ctx, px, Math.max(plotY + 10, sy(v) - 16), `${sel.symbol}  ${v}`, theme, {
      align: "center", color: cellColor(sel, mode, theme),
    });
  } else if (sel) {
    caption(ctx, x + w - 12, y + 15, `${sel.symbol} sits beyond this chart`, theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
  }
}

function drawMystery(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  const m = elementByZ(state.mysteryZ) ?? ELEMENTS[0];
  const accent = state.solved ? theme.sci["energy-kinetic"] : theme.sci["acceleration"];

  ctx.save();
  ctx.fillStyle = hexA(theme.surfaceAlt, 0.9);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hexA(accent, 0.7);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  caption(ctx, x + 12, y + 16, state.solved ? "Solved!" : "Who am I?", theme, {
    size: 13, weight: 800, color: accent,
  });

  if (state.solved) {
    caption(ctx, x + 12, y + 40, `${m.name} (${m.symbol})`, theme, { size: 16, weight: 800 });
    caption(ctx, x + 12, y + 60, `Found with ${state.clues} clue${state.clues === 1 ? "" : "s"}.`, theme, {
      size: 11, color: theme.inkSoft,
    });
    return;
  }

  ctx.save();
  ctx.font = "500 11px system-ui, sans-serif";
  let ly = y + 34;
  for (let i = 0; i < state.clues && i < MAX_CLUES; i++) {
    const lines = wrapText(ctx, `${i + 1}. ${clueFor(m, i)}`, w - 24, 2);
    for (const line of lines) {
      if (ly > y + h - 22) break;
      caption(ctx, x + 12, ly, line, theme, { size: 11, weight: 500 });
      ly += 14;
    }
    ly += 3;
  }
  ctx.restore();

  if (state.clues < MAX_CLUES && ly < y + h - 12) {
    const frac = state.clueTimer / CLUE_INTERVAL;
    ctx.save();
    ctx.fillStyle = hexA(theme.inkSoft, 0.2);
    roundRect(ctx, x + 12, y + h - 14, w - 24, 4, 2);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, x + 12, y + h - 14, (w - 24) * frac, 4, 2);
    ctx.fill();
    ctx.restore();
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays } = rc;
  const mode = params.colorBy as ColorMode;
  const hunting = Boolean(params.mystery);

  sky(ctx, width, height, theme, "indoor");

  caption(ctx, TABLE_X, 16, "The Periodic Table", theme, { size: 15, weight: 800 });
  caption(ctx, TABLE_X + 152, 17, "click any element", theme, { size: 10, color: theme.inkSoft });

  drawLegend(rc, mode);
  drawTable(rc, mode);

  /* ---- the detail card grows into whatever room the stage has ---- */
  const cardX = TABLE_X + TABLE_W + 16;
  const cardW = width - cardX - TABLE_X;
  if (cardW >= 170) {
    drawCard(rc, cardX, TABLE_Y, cardW, TABLE_BOTTOM - TABLE_Y);
  } else {
    const e = elementByZ(state.selectedZ) ?? ELEMENTS[0];
    badge(ctx, TABLE_X, TABLE_BOTTOM + 18, `${e.symbol}  ${e.name}`, theme, {
      color: theme.sci[CATEGORY_SCI[e.category]], sub: CATEGORY_LABEL[e.category],
    });
  }

  /* ---- trends and the unknown-element hunt share the floor ---- */
  const trendY = TABLE_BOTTOM + 16;
  const trendH = height - trendY - 12;
  const fullW = width - 2 * TABLE_X;
  if (trendH >= 80 && fullW > 220) {
    const mysteryW = hunting ? Math.min(300, Math.max(170, fullW * 0.34)) : 0;
    const chartW = fullW - mysteryW - (hunting ? 12 : 0);
    if (overlays.trends && chartW > 180) drawTrend(rc, TABLE_X, trendY, chartW, trendH, mode);
    if (hunting) drawMystery(rc, TABLE_X + fullW - mysteryW, trendY, mysteryW, trendH);
  }

  /* ---- what the pointer is over ---- */
  const hover = elementByZ(state.hoverZ);
  if (hover && hover.z !== state.selectedZ && state.pointerY > 0) {
    badge(ctx, state.pointerX, state.pointerY - 22, hover.name, theme, {
      align: "center", color: cellColor(hover, mode, theme),
    });
  }

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const periodicTableSim: SimManifest<State> = {
  id: "chem.periodic-table",
  title: "The Living Periodic Table",
  tagline: "Recolour the table by size, pull or reactivity and watch the same pattern repeat, row after row.",
  subject: "chemistry",
  bands: ["6-8", "9-12"],
  grades: [7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS1-1", "HS-PS1-1", "HS-PS1-2"] },
  learningGoals: [
    "Read everything one cell of the periodic table tells you.",
    "Explain what the elements in a group share, and what changes along a period.",
    "Find metals, non-metals and metalloids, and say where the boundary runs.",
    "Describe a periodic trend in atom size, electron pull or reactivity.",
  ],
  misconceptions: [
    "The periodic table is an arbitrary list to memorise",
    "The table is ordered by atomic mass",
    "Reactive means dangerous or poisonous",
    "Atoms get bigger as you go across a row, because they have more electrons",
  ],
  tickRate: 60,
  interactionHint: "Click any element, or drag the slider, then change what the colour means.",
  params: {
    element: {
      type: "number", label: "Element (atomic number)", kind: "count",
      min: 1, max: 92, step: 1, default: 6,
      marks: [
        { value: 1, label: "H" },
        { value: 6, label: "C" },
        { value: 8, label: "O" },
        { value: 26, label: "Fe" },
        { value: 79, label: "Au" },
      ],
      help: "Slides across the table. Cells drawn as empty outlines are elements this set leaves out.",
    },
    colorBy: {
      type: "option", label: "Colour the table by",
      options: [
        { value: "category", label: "Type" },
        { value: "radius", label: "Atom size" },
        { value: "electronegativity", label: "Electron pull" },
        { value: "reactivity", label: "Reactivity" },
      ],
      default: "category",
      help: "Switch to a property and the same pattern appears in every row. That is what periodic means.",
    },
    mystery: {
      type: "boolean", label: "Unknown element hunt", default: false,
      help: "Clues arrive one at a time. Click the element you think they describe.",
    },
    round: {
      type: "number", label: "Which unknown", kind: "count",
      min: 1, max: 12, step: 1, default: 1,
      help: "A different element to identify.",
    },
  },
  overlays: [
    { key: "trends", label: "Trend chart", default: true },
    { key: "regions", label: "Metals / non-metals", default: true },
    { key: "labels", label: "Group & period numbers", default: true },
    { key: "shells", label: "Electron shells", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "across-a-period",
      title: "What happens to atoms as you go across a row?",
      question: "Do atoms get bigger or smaller as you move left to right across a period?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS1-1"],
      setup: { element: 11, colorBy: "radius", mystery: false, round: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Commit to an answer",
          instruction: "Each atom across a row has one more proton and one more electron than the last.",
          predict: {
            prompt: "Going left to right across period 3, from sodium to argon, the atoms...",
            options: ["get bigger", "get smaller", "stay the same size", "get bigger then smaller"],
            correct: 1,
            reveal: "They shrink. Every step adds a proton to the nucleus, and that stronger positive charge pulls the same outer shell in tighter. Sodium is 190 pm; argon is 71 pm.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Measure the row",
          instruction: "Step through sodium (11) to argon (18) and record the atom size at each one.",
          requireData: 8,
          hints: [
            "The Atom size readout is in nanometres; the card shows picometres.",
            "Use the arrow keys on the slider to move one element at a time.",
            "Keep going all the way to argon before you decide.",
          ],
        },
        {
          id: "next-row",
          phase: "measure",
          title: "Now step into the next row",
          instruction: "Go from argon (18) to potassium (19). Record it.",
          check: {
            describe: "Potassium is selected",
            test: (v) => v.facts.atomicNumber === 19,
          },
          hints: ["Argon is 71 pm. What does potassium do to that number?"],
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Look at the trend chart",
          instruction: "The chart under the table plots the same numbers. Describe its shape.",
          write: {
            prompt: "What shape does atom size make across the whole chart, and where does it jump?",
            placeholder: "Across each row the size ... and at the start of a new row it ...",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the jump",
          instruction: "Say why a new row starts a new, bigger atom.",
          write: {
            prompt: "Why does potassium's atom dwarf argon's, when it has only one more proton?",
            placeholder: "Potassium starts a new shell, so ...",
          },
          hints: ["Look at the electron-shell picture for argon and then for potassium."],
        },
      ],
    },
    {
      id: "families",
      title: "What do the elements in one column share?",
      question: "Why are lithium, sodium and potassium called a family?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-PS1-1"],
      setup: { element: 3, colorBy: "reactivity", mystery: false, round: 1 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Lithium, sodium and potassium sit in the same column of the table.",
          predict: {
            prompt: "What do you expect all three to have in common?",
            options: [
              "The same number of protons",
              "The same number of electrons in their outer shell",
              "The same mass",
              "Nothing — the columns are just how it fits on the page",
            ],
            correct: 1,
            reveal: "All three have exactly one outer-shell electron. A group is a column of elements with the same outer shell, and that is what makes them behave alike.",
          },
        },
        {
          id: "group1",
          phase: "measure",
          title: "Walk down group 1",
          instruction: "Record lithium (3), sodium (11) and potassium (19). Watch the outer-shell number.",
          requireData: 3,
          hints: ["The Outer-shell electrons readout is the one to watch."],
        },
        {
          id: "group18",
          phase: "measure",
          title: "Now a different family",
          instruction: "Record helium (2), neon (10) and argon (18). Record all three.",
          requireData: 6,
          check: {
            describe: "A noble gas is selected",
            test: (v) => v.facts.category === "noble",
          },
        },
        {
          id: "reactive",
          phase: "analyze",
          title: "Compare their reactivity",
          instruction: "Colour the table by reactivity. What do the two families look like?",
          check: {
            describe: "The table is coloured by reactivity",
            test: (v) => v.facts.colorBy === "reactivity",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the family rule",
          instruction: "Explain why a full outer shell and a nearly empty one behave so differently.",
          write: {
            prompt: "Why is potassium wildly reactive while argon does nothing at all?",
            placeholder: "Potassium has ... in its outer shell, so ... Argon has ..., so ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "name-the-unknown",
      title: "Name the unknown",
      brief: "Clues arrive one at a time. Identify the element before too many are spent.",
      bands: ["6-8", "9-12"],
      setup: { mystery: true, round: 1, colorBy: "category", element: 6 },
      goal: {
        describe: "Identify the unknown element",
        test: (v) => Boolean(v.facts.solved),
      },
      stars: {
        two: {
          describe: "Identify it with no more than three clues",
          test: (v) => Boolean(v.facts.solved) && (v.facts.cluesShown as number) <= 3,
        },
        three: {
          describe: "Identify it with no more than two clues",
          test: (v) => Boolean(v.facts.solved) && (v.facts.cluesShown as number) <= 2,
        },
      },
      hints: [
        "The state clue alone rules out almost everything: only two elements here are liquid at room temperature.",
        "Period tells you the row; outer-shell electrons tell you the column. Together they name one cell.",
        "Try the reactivity colouring — it separates the families at a glance.",
      ],
    },
    {
      id: "most-reactive-metal",
      title: "Find the eager metal",
      brief: "Somewhere in this table is the metal that gives up an electron more easily than any other here.",
      bands: ["6-8", "9-12"],
      setup: { colorBy: "reactivity", element: 26, mystery: false, round: 1 },
      goal: {
        describe: "Select a metal with a reactivity index above 7",
        test: (v) => Boolean(v.facts.metal) && (v.facts.reactivity as number) > 7,
      },
      stars: {
        two: {
          describe: "Find the most reactive metal in the table",
          test: (v) => Boolean(v.facts.metal) && (v.facts.reactivity as number) > 9,
        },
        three: {
          describe: "Find it with the table coloured by reactivity",
          test: (v) =>
            Boolean(v.facts.metal) && (v.facts.reactivity as number) > 9
            && v.facts.colorBy === "reactivity",
        },
      },
      hints: [
        "Reactivity in a metal means letting an electron go. Which metals hold theirs most loosely?",
        "Look at the bottom left of the table, not the top right.",
        "Group 1 gets more reactive as you go down. How far down does this table go?",
      ],
    },
  ],
};
