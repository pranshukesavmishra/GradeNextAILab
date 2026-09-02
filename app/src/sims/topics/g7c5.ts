import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit C · Topic C5 — Tracing carbon through an organism.
 *
 * Five simulations, one per subtopic:
 *
 *   C5.1  g7c5-into-the-leaf     a carbon atom enters a plant       (trace)
 *   C5.2  g7c5-eaten             a carbon atom moves into an animal (process)
 *   C5.3  g7c5-back-to-the-air   a carbon atom returns to the air   (trace)
 *   C5.4  g7c5-which-process     the two processes as a linked pair (sort)
 *   C5.5  g7c5-why-both          why plants run both processes      (investigate)
 *
 * One atom is followed the whole way round: out of the air at 421 parts per
 * million, into a starch grain, into a caterpillar, into a mitochondrion, and
 * back out through a lung. Nothing is consumed and nothing is created; the
 * same carbon simply keeps changing company.
 */

/* ---------------------------------------------------------------- *
 * C5.1 — A carbon atom enters a plant
 * ---------------------------------------------------------------- */

const INTO_THE_LEAF: ArchetypeSpec = {
  id: "g7c5-into-the-leaf",
  title: "One Carbon Atom, Into a Leaf",
  tagline: "Follow a single atom from open air to a starch grain inside a cell.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7"] },
  learningGoals: [
    "Trace a carbon atom from atmospheric carbon dioxide into a plant's tissue.",
    "Explain that a plant's solid material is assembled from a gas.",
  ],
  misconceptions: [
    "Carbon dioxide is only a waste gas",
    "Plants absorb their carbon through their roots",
  ],
  stages: [
    { name: "In the air", at: 0, caption: "421 carbon dioxide molecules in every million. This is one of them." },
    { name: "Stoma", at: 0.25, caption: "It drifts through an open pore on the underside of the leaf." },
    { name: "Cell", at: 0.5, caption: "Dissolved in the film of water around a mesophyll cell, then inside." },
    { name: "Fixed", at: 0.75, caption: "Rubisco bonds it to a sugar. The atom is now part of something solid." },
    { name: "Stored", at: 1, caption: "Six such carbons make a glucose; thousands of those make a starch grain." },
  ],
  route: [
    { at: [0.10, 0.30], name: "Open air",
      note: "One CO2 among 421 in every million molecules of air." },
    { at: [0.26, 0.48], name: "A stoma",
      note: "A pore 20 micrometres wide on the leaf's underside." },
    { at: [0.42, 0.34], name: "Air spaces",
      note: "Spongy mesophyll: mostly gaps, so gas reaches every cell." },
    { at: [0.58, 0.54], name: "Into the cell",
      note: "It dissolves, then crosses the wall and the membrane." },
    { at: [0.74, 0.36], name: "The stroma",
      note: "Rubisco clamps it onto a 5-carbon sugar. Now it is fixed." },
    { at: [0.90, 0.56], name: "A starch grain",
      note: "Six such carbons make one glucose, then starch." },
  ],
};

/* ---------------------------------------------------------------- *
 * C5.2 — A carbon atom moves into an animal
 * ---------------------------------------------------------------- */

const EATEN: ArchetypeSpec = {
  id: "g7c5-eaten",
  title: "Eaten",
  tagline: "The leaf is bitten, and the atom changes owner without ever changing itself.",
  kind: "process",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Explain that an animal's body is built from carbon that a plant fixed first.",
    "Describe digestion as taking food molecules apart, not destroying them.",
  ],
  misconceptions: [
    "Digestion destroys food",
    "An animal makes its own building material from nothing",
  ],
  specimens: [
    { id: "gutcell", name: "Cell lining the gut", art: { art: "cell" } },
  ],
  stages: [
    {
      name: "In the starch", at: 0,
      caption: "The atom sits in a starch grain, one glucose unit among many thousands.",
    },
    {
      name: "Bitten", at: 0.25,
      caption: "A caterpillar eats the leaf. Nothing has happened to the atom yet.",
    },
    {
      name: "Digested", at: 0.5,
      caption: "Amylase cuts the starch back into single glucose molecules. Atoms intact.",
    },
    {
      name: "Absorbed", at: 0.75,
      caption: "Glucose crosses the gut wall into the blood, carrying the same carbon.",
    },
    {
      name: "Built in", at: 1,
      caption: "It ends up in fat, protein or new cells. The caterpillar is made of leaf.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C5.3 — A carbon atom returns to the air
 * ---------------------------------------------------------------- */

const BACK_TO_THE_AIR: ArchetypeSpec = {
  id: "g7c5-back-to-the-air",
  title: "One Carbon Atom, Back to the Air",
  tagline: "Out of a muscle cell, through the blood, across a lung, and gone.",
  kind: "trace",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-7"] },
  learningGoals: [
    "Trace a carbon atom from an animal's food back to atmospheric carbon dioxide.",
    "Explain that exhaled carbon comes from food, not from the air breathed in.",
  ],
  misconceptions: [
    "The carbon dioxide you breathe out is the air you breathed in",
    "Carbon is used up by living things",
  ],
  stages: [
    { name: "In the cell", at: 0, caption: "The atom is in glucose in a muscle cell's cytoplasm." },
    { name: "Mitochondrion", at: 0.25, caption: "The matrix strips it off the fuel and it becomes carbon dioxide." },
    { name: "Blood", at: 0.5, caption: "It leaves in the blood, mostly as hydrogencarbonate ion." },
    { name: "Lung", at: 0.75, caption: "Across the alveolus wall and into the air in the lung." },
    { name: "Air again", at: 1, caption: "Breathed out at about 4 per cent CO2, and free for the next leaf." },
  ],
  route: [
    { at: [0.10, 0.56], name: "Muscle cell",
      note: "Held in glucose in the cytoplasm, ready to be spent." },
    { at: [0.26, 0.36], name: "Mitochondrion",
      note: "The matrix strips the carbon off as carbon dioxide." },
    { at: [0.42, 0.56], name: "The blood",
      note: "It travels mostly as hydrogencarbonate, not as gas." },
    { at: [0.58, 0.34], name: "An alveolus",
      note: "Across a lung wall half a micrometre thick." },
    { at: [0.74, 0.54], name: "Breathed out",
      note: "Exhaled air is about 4 per cent carbon dioxide." },
    { at: [0.90, 0.30], name: "Open air",
      note: "Free again, and ready for the next leaf. Loop closed." },
  ],
};

/* ---------------------------------------------------------------- *
 * C5.4 — Photosynthesis and respiration as linked opposite processes
 * ---------------------------------------------------------------- */

const WHICH_PROCESS: ArchetypeSpec = {
  id: "g7c5-which-process",
  title: "Which Process Owns This?",
  tagline: "Seven things from the loop. Some belong to one side, some to both.",
  kind: "sort",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7"] },
  learningGoals: [
    "Match structures and substances to photosynthesis, respiration or both.",
    "Explain that the products of one process are the reactants of the other.",
  ],
  misconceptions: [
    "Plants photosynthesise and animals respire, and that is the whole story",
    "Oxygen belongs only to breathing and carbon dioxide only to plants",
  ],
  categories: [
    { id: "photo", name: "Photosynthesis only", hint: "green cells, and only in light" },
    { id: "resp", name: "Respiration only", hint: "every living cell, day and night" },
    { id: "both", name: "Both", hint: "one process hands it to the other" },
  ],
  specimens: [
    {
      id: "chloroplast", name: "Chloroplast", category: "photo",
      because: "Found only in green plant cells and algae. An animal cell has none at all.",
      art: { art: "organelle", which: "chloroplast" },
    },
    {
      id: "light", name: "Light energy", category: "photo",
      because: "2803 kJ per mole has to be pushed in. Respiration needs no light and runs in the dark.",
      art: { art: "sphere", color: "#f6d365", radius: 0.5, glow: 1 },
    },
    {
      id: "mitochondrion", name: "Mitochondrion", category: "resp",
      because: "In plant cells as well as animal ones. A leaf cell has both organelles side by side.",
      art: { art: "organelle", which: "mitochondrion" },
    },
    {
      id: "muscle", name: "A human muscle cell", category: "resp",
      because: "No chloroplasts, so no photosynthesis, but its mitochondria never stop.",
      art: { art: "cell" },
    },
    {
      id: "glucose", name: "Glucose", category: "both",
      because: "Made by one process, spent by the other. 180.156 g of it carries 2803 kJ either way.",
      art: { art: "glassware", which: "testTube", level: 0.7, color: "#d9a441" },
    },
    {
      id: "oxygen", name: "Oxygen", category: "both",
      because: "Six O2 out of photosynthesis, six O2 into respiration. The same molecule, both ways.",
      art: { art: "molecule", formula: "O2" },
    },
    {
      id: "co2", name: "Carbon dioxide", category: "both",
      because: "Respiration's waste is photosynthesis's raw material. That is what closes the loop.",
      art: { art: "molecule", formula: "CO2" },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * C5.5 — Why plants run both processes
 * ---------------------------------------------------------------- */

const WHY_BOTH: ArchetypeSpec = {
  id: "g7c5-why-both",
  title: "Why a Plant Needs Both",
  tagline: "Photosynthesis banks the sugar. Respiration is the only way to spend it.",
  kind: "investigate",
  subject: "biology",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-LS1-6", "MS-LS1-7"] },
  learningGoals: [
    "Explain why a plant must respire as well as photosynthesise.",
    "Find the light level at which a leaf's two processes exactly balance.",
  ],
  misconceptions: [
    "Photosynthesis gives a plant energy directly",
    "A plant only needs light to stay alive",
  ],
  specimens: [
    { id: "leaf", name: "One square metre of leaf", art: { art: "cell", plant: true } },
  ],
  variables: [
    { key: "lightPercent", label: "Light, as a share of full sun (%)", min: 0, max: 100, step: 1, default: 50 },
    { key: "temperatureC", label: "Leaf temperature (C)", min: 5, max: 40, step: 1, default: 20 },
  ],
  /**
   * A standard model of a C3 leaf, in micromoles of CO2 per square metre per
   * second, which is the unit gas-exchange meters actually report.
   *
   * Gross photosynthesis follows a rectangular hyperbola in light:
   * 20 x I / (I + 400), where I is the photon flux and full sun is 2000
   * micromoles of photons per square metre per second. Dark respiration is
   * 1.5 at 20 C and, being enzyme-controlled, doubles for every 10 C rise.
   *
   * Those give a light compensation point of 400 x R / (20 - R): at 20 C that
   * is 32 micromoles of photons, about 1.6 per cent of full sun, which is
   * roughly deep twilight. Below it the leaf loses sugar even in daylight.
   *
   * Net uptake converts to sugar directly: one glucose per six CO2, so
   * net x 3600 x 10^-6 / 6 x 180.156 grams per square metre per hour.
   */
  measure: (v) => {
    const photonFlux = (v.lightPercent / 100) * 2000;
    const gross = (20 * photonFlux) / (photonFlux + 400);
    const respiration = 1.5 * 2 ** ((v.temperatureC - 20) / 10);
    const net = gross - respiration;
    return {
      photonFlux,
      grossPhotosynthesisUmol: gross,
      respirationUmol: respiration,
      netUptakeUmol: net,
      compensationPhotonFlux: respiration < 20 ? (400 * respiration) / (20 - respiration) : 0,
      sugarGPerM2PerHour: (net * 3600 * 1e-6 * 180.156) / 6,
      shareOfSugarRespiredPercent: gross > 0 ? (respiration / gross) * 100 : 100,
    };
  },
  plot: {
    x: "lightPercent", y: "netUptakeUmol",
    xLabel: "Light (% of full sun)", yLabel: "Net CO2 uptake (umol per m2 per s)",
  },
};

export const g7c5IntoTheLeaf = buildSim(INTO_THE_LEAF);
export const g7c5Eaten = buildSim(EATEN);
export const g7c5BackToTheAir = buildSim(BACK_TO_THE_AIR);
export const g7c5WhichProcess = buildSim(WHICH_PROCESS);
export const g7c5WhyBoth = buildSim(WHY_BOTH);
