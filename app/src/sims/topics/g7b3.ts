import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit B · Topic B3 — Conservation of mass.
 *
 * Five simulations, one per subtopic:
 *
 *   B3.1  g7b3-sealed-and-weighed   mass in a closed container       (investigate)
 *   B3.2  g7b3-stopper-on-stopper-off  closed against open          (compare)
 *   B3.3  g7b3-count-both-sides     atom-counting diagrams           (assemble)
 *   B3.4  g7b3-nowhere-to-go        atoms conserved, so mass is too  (trace)
 *   B3.5  g7b3-could-that-be-right  applying it to a new reaction    (sort)
 *
 * One reaction runs through the first two, so the numbers agree across them:
 * 5.0 g of sodium hydrogencarbonate in 100 cm3 of vinegar releases 2.62 g of
 * carbon dioxide, which the sealed flask keeps and the open beaker loses.
 */

/* ---------------------------------------------------------------- *
 * B3.1 — Mass before and after, in a closed container
 * ---------------------------------------------------------------- */

const SEALED_AND_WEIGHED: ArchetypeSpec = {
  id: "g7b3-sealed-and-weighed",
  title: "Sealed, Reacted, Weighed Again",
  tagline: "The flask fizzes hard, the pressure climbs, and the balance does not move.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Predict the mass of gas a reaction makes from the mass of the limiting reactant.",
    "Explain why the total mass in a sealed container cannot change.",
  ],
  misconceptions: [
    "Gas weighs nothing",
    "Mass is destroyed when a solid fizzes away",
  ],
  specimens: [
    {
      id: "flask", name: "500 cm3 conical flask, stoppered, on a balance",
      art: { art: "glassware", which: "flask", level: 0.45, color: "#e6dcc0", bubbles: 22 },
    },
  ],
  variables: [
    { key: "bicarb", label: "Sodium hydrogencarbonate (g)", min: 0.5, max: 20, step: 0.5, default: 5 },
    { key: "vinegar", label: "Vinegar added (cm3)", min: 10, max: 200, step: 5, default: 100 },
  ],
  // NaHCO3 + CH3COOH gives CH3COONa + H2O + CO2, one mole of each.
  // Molar masses 84.007 and 60.052; carbon dioxide is 44.009. Table vinegar is
  // 5 per cent acid by mass at 1.005 g/cm3, which works out at 0.837 mol/dm3.
  // Pressure in the sealed headspace follows pV = nRT at 293 K, assuming none
  // of the gas redissolves.
  measure: (v) => {
    const molesBicarb = v.bicarb / 84.007;
    const molesAcid = (0.837 * v.vinegar) / 1000;
    const reacted = Math.min(molesBicarb, molesAcid);
    const massBefore = v.bicarb + v.vinegar * 1.005;
    const headspaceM3 = (500 - v.vinegar) / 1e6;
    return {
      carbonDioxideG: reacted * 44.009,
      massBeforeG: massBefore,
      massAfterSealedG: massBefore,
      massAfterOpenG: massBefore - reacted * 44.009,
      bicarbLeftOverG: (molesBicarb - reacted) * 84.007,
      acidLeftOverG: (molesAcid - reacted) * 60.052,
      pressureKPa: 101.3 + (reacted * 8.314 * 293) / headspaceM3 / 1000,
    };
  },
  plot: {
    x: "bicarb", y: "carbonDioxideG",
    xLabel: "Sodium hydrogencarbonate (g)", yLabel: "Carbon dioxide made (g)",
  },
};

/* ---------------------------------------------------------------- *
 * B3.2 — Mass before and after, in an open container
 * ---------------------------------------------------------------- */

const STOPPER_ON_STOPPER_OFF: ArchetypeSpec = {
  id: "g7b3-stopper-on-stopper-off",
  title: "Stopper On, Stopper Off",
  tagline: "Same chemicals, same balance, two different readings. Only one of them is a puzzle.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Explain a mass loss in an open container as matter leaving, not matter vanishing.",
    "Design a container that lets the mass of every product be measured.",
  ],
  misconceptions: [
    "Mass is only conserved in special sealed experiments",
    "A lighter reading proves matter was destroyed",
  ],
  specimens: [
    {
      id: "sealed", name: "Stoppered flask: 155.0 g before, 155.0 g after",
      because: "49.5 g of flask, 5.0 g of sodium hydrogencarbonate and 100 cm3 of vinegar weighing 100.5 g. The reaction makes 2.62 g of carbon dioxide, but the stopper keeps every molecule of it inside, so the balance reads 155.0 g throughout. The flask is harder to open afterwards: the trapped gas has pushed the pressure past 4 atmospheres.",
      art: { art: "glassware", which: "flask", level: 0.45, color: "#e6dcc0", bubbles: 18 },
    },
    {
      id: "open", name: "Open beaker: 155.0 g before, 152.4 g after",
      because: "Exactly the same chemicals, and exactly the same 2.62 g of carbon dioxide, but this time it walks out into the room. 155.0 minus 2.62 is 152.4 g. Weigh the room as well and nothing has been lost. Carbon dioxide has a density of 1.84 g/dm3 at room temperature, so those 2.62 g fill about 1.4 dm3.",
      art: { art: "glassware", which: "beaker", level: 0.5, color: "#e6dcc0", bubbles: 24 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.3 — Atom-counting diagrams
 * ---------------------------------------------------------------- */

const COUNT_BOTH_SIDES: ArchetypeSpec = {
  id: "g7b3-count-both-sides",
  title: "Count Both Sides",
  tagline: "Build the diagram for burning hydrogen, one molecule at a time, and tally as you go.",
  kind: "assemble",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Draw an atom-counting diagram in which every element tallies on both sides.",
    "Balance an equation by changing how many molecules there are, never the formulas.",
  ],
  misconceptions: [
    "You can balance an equation by changing a subscript",
    "New atoms appear during a reaction",
  ],
  specimens: [
    {
      id: "diagram", name: "2 H2 + O2 gives 2 H2O",
      art: { art: "molecule", formula: "H2O" },
      parts: [
        {
          id: "hydrogen", name: "Two H2 molecules", at: [-0.38, -0.22],
          note: "Four hydrogen atoms in all. Hydrogen never travels alone at room temperature: it goes about in pairs, 2.016 g per mole, so these two weigh 4.03 g per mole of reaction.",
        },
        {
          id: "oxygen", name: "One O2 molecule", at: [-0.34, 0.24],
          note: "Two oxygen atoms, 31.998 g per mole. One molecule is enough, because there are exactly two oxygen atoms to place on the other side.",
        },
        {
          id: "leftTally", name: "Left-hand tally", at: [-0.06, -0.44],
          note: "H 4, O 2. Mass on this side: 4.03 + 32.00 = 36.03 g per mole of oxygen used.",
        },
        {
          id: "water", name: "Two H2O molecules", at: [0.36, -0.2],
          note: "Each takes two hydrogens and one oxygen, 18.015 g per mole. Two of them use up all four hydrogens and both oxygens, with nothing left over.",
        },
        {
          id: "rightTally", name: "Right-hand tally", at: [0.1, 0.44],
          note: "H 4, O 2, and 2 x 18.015 = 36.03 g. Both columns match, which is the whole definition of a balanced equation.",
        },
        {
          id: "wrong", name: "The version that fails", at: [0.34, 0.24],
          note: "H2 + O2 gives H2O has two oxygens on the left and one on the right. You cannot fix that by writing H2O2, which is a different substance, hydrogen peroxide. You fix it by using more whole molecules.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.4 — Why mass conservation follows from atom conservation
 * ---------------------------------------------------------------- */

const NOWHERE_TO_GO: ArchetypeSpec = {
  id: "g7b3-nowhere-to-go",
  title: "The Atoms Have Nowhere to Go",
  tagline: "Follow one oxygen atom out of the air and into the rust, without ever leaving the flask.",
  kind: "trace",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Explain conservation of mass as a consequence of atoms being neither created nor destroyed.",
    "Account for a mass gain in an open container by naming where the extra atoms came from.",
  ],
  misconceptions: [
    "Rust is iron that has been eaten away",
    "Mass conservation is a rule reactions happen to follow",
  ],
  specimens: [{ id: "o2", name: "One oxygen molecule", art: { art: "molecule", formula: "O2" } }],
  stages: [
    { name: "Sealed", at: 0, caption: "Damp steel wool, air, stopper on. The balance reads 250.000 g." },
    { name: "In the air", at: 0.25, caption: "About 21 per cent of that trapped air is O2, at 31.998 g per mole." },
    { name: "At the surface", at: 0.5, caption: "Iron gives up electrons, oxygen takes them. Both atoms are still inside the glass." },
    { name: "In the rust", at: 0.75, caption: "4 Fe + 3 O2 gives 2 Fe2O3: 223.38 + 95.99 = 319.38 g per unit of reaction." },
    { name: "Weighed again", at: 1, caption: "Still 250.000 g. The wool is heavier and the air is lighter by the same amount." },
  ],
  route: [
    {
      at: [0.09, 0.34], name: "The sealed flask",
      note: "Steel wool, dampened, sealed with a stopper, sitting on a balance that reads 250.000 g. Everything the experiment will ever contain is already inside.",
    },
    {
      at: [0.27, 0.6], name: "One O2 in the trapped air",
      note: "Air is 21 per cent oxygen by volume. A 500 cm3 flask holds about 0.0044 mol of O2, which is 0.14 g. That is the entire budget: when it runs out the rusting stops.",
    },
    {
      at: [0.44, 0.3], name: "The iron surface",
      note: "Water lets iron atoms give up electrons, and the oxygen molecule takes them. The atom has changed partners, not places. It is still one of the atoms the balance is weighing.",
    },
    {
      at: [0.61, 0.58], name: "Inside the rust",
      note: "4 Fe + 3 O2 gives 2 Fe2O3. Four iron atoms weigh 223.38 g per mole, three oxygen molecules 95.99 g, and the two rust units they build weigh 319.38 g. The sum was fixed before the reaction started.",
    },
    {
      at: [0.78, 0.3], name: "The balance, hours later",
      note: "250.000 g, unchanged. Take the wool out and it is heavier than it went in; the air left behind is lighter by exactly that much. Nothing about the total could have gone any other way, because no atom left.",
    },
    {
      at: [0.92, 0.6], name: "Now do it in the open",
      note: "With the stopper off, fresh oxygen keeps arriving and the iron keeps taking it. A 10.0 g nail rusted right through ends up as 14.3 g of Fe2O3. The 4.3 g came out of the air, which is why an open experiment seems to break the rule and does not.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B3.5 — Applying conservation to an unfamiliar reaction
 * ---------------------------------------------------------------- */

const COULD_THAT_BE_RIGHT: ArchetypeSpec = {
  id: "g7b3-could-that-be-right",
  title: "Could That Be Right?",
  tagline: "Eight reports from other people's labs. Add up the masses before you believe any of them.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-5"] },
  learningGoals: [
    "Test an unfamiliar claim about a reaction against conservation of mass.",
    "Decide whether a container was open or closed before judging a mass reading.",
  ],
  misconceptions: [
    "Burning always makes something lighter",
    "A sealed container can gain mass if the reaction is violent enough",
  ],
  categories: [
    { id: "ok", name: "Could be right", hint: "the atoms add up" },
    { id: "no", name: "Breaks conservation", hint: "atoms appear or vanish" },
  ],
  specimens: [
    {
      id: "carbon", name: "12.0 g of carbon burns in 32.0 g of oxygen and gives 44.0 g of carbon dioxide",
      category: "ok",
      because: "C + O2 gives CO2. Carbon is 12.011 g per mole and oxygen 31.998, so the product must be 44.009. Every atom that went in is accounted for in the gas.",
      art: { art: "molecule", formula: "CO2" },
    },
    {
      id: "magnesium", name: "10.0 g of magnesium ribbon burns to 16.6 g of white ash",
      category: "ok",
      because: "It gained 6.6 g, from the air. 2 Mg + O2 gives 2 MgO: 10.0 g is 0.4114 mol of magnesium, which makes 0.4114 mol of magnesium oxide at 40.304 g per mole, or 16.58 g. The oxygen was always part of the total.",
      art: { art: "sphere", color: "#f4f2ea", radius: 0.36, glow: 1 },
    },
    {
      id: "wood", name: "10.0 g of dry wood burns down to 0.5 g of ash",
      category: "ok",
      because: "The other 9.5 g left as carbon dioxide and water vapour, taking oxygen from the air with it. Collect the smoke and the gases and the total is larger than 10.0 g, not smaller.",
      art: { art: "glassware", which: "beaker", level: 0.18, color: "#8d8477", precipitate: 0.7 },
    },
    {
      id: "electrolysis", name: "50.0 g of water is split and gives 5.6 g of hydrogen and 44.4 g of oxygen",
      category: "ok",
      because: "2 H2O gives 2 H2 + O2. 50.0 g of water is 2.776 mol, so 2.776 mol of H2 at 2.016 g is 5.60 g, and 1.388 mol of O2 at 31.998 g is 44.4 g. They add back to 50.0 g exactly, and the hydrogen fills twice the volume of the oxygen.",
      art: { art: "apparatus", which: "battery" },
    },
    {
      id: "jar", name: "5.0 g of one powder and 5.0 g of another, sealed in a jar, give 12.0 g of product",
      category: "no",
      because: "Two grams have appeared from nowhere inside a closed jar. No reaction can do that. Either the balance was not zeroed, the jar was not sealed, or the product was weighed while still wet.",
      art: { art: "glassware", which: "flask", level: 0.5, color: "#d8d2c4" },
    },
    {
      id: "copper", name: "100.0 g of copper heated in a sealed tube gives 96.0 g of black powder and nothing else",
      category: "no",
      because: "In a sealed tube the total cannot drop below 100.0 g, and 4 g of the metal cannot simply go. Heated in open air the opposite happens: 2 Cu + O2 gives 2 CuO, so 100.0 g of copper becomes 125.2 g of black copper oxide.",
      art: { art: "glassware", which: "testTube", level: 0.4, color: "#3a3a40", precipitate: 0.8 },
    },
    {
      id: "sealedvinegar", name: "A stoppered flask of vinegar and baking soda reads 155.0 g before and 152.4 g after, still stoppered",
      category: "no",
      because: "That 2.6 g is the carbon dioxide, and with the stopper in it has nowhere to go. This is the open-beaker reading written down for a sealed one, which is the commonest mistake in the whole experiment.",
      art: { art: "glassware", which: "flask", level: 0.45, color: "#e6dcc0", bubbles: 20 },
    },
    {
      id: "candle", name: "A candle burns inside a sealed box and the whole box loses 3 g",
      category: "no",
      because: "Nothing crossed the wall of the box, so the reading cannot change. Inside, the wax is turning into carbon dioxide and water vapour and taking oxygen from the trapped air; the pieces move around, the total does not.",
      art: { art: "apparatus", which: "burner" },
    },
  ],
};

export const g7b3SealedAndWeighed = buildSim(SEALED_AND_WEIGHED);
export const g7b3StopperOnStopperOff = buildSim(STOPPER_ON_STOPPER_OFF);
export const g7b3CountBothSides = buildSim(COUNT_BOTH_SIDES);
export const g7b3NowhereToGo = buildSim(NOWHERE_TO_GO);
export const g7b3CouldThatBeRight = buildSim(COULD_THAT_BE_RIGHT);
