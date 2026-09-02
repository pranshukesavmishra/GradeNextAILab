import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 7 · Unit A · Topic A2 — Inside the atom.
 *
 * Six simulations, one per subtopic:
 *
 *   A2.1  g7a2-three-particles     protons, neutrons and electrons  (explore)
 *   A2.2  g7a2-protons-decide      atomic number defines the element (sort)
 *   A2.3  g7a2-same-element        mass number and isotopes         (investigate)
 *   A2.4  g7a2-through-the-foil    early evidence                   (trace)
 *   A2.5  g7a2-shells-to-cloud     from shells to a cloud           (process)
 *   A2.6  g7a2-two-models          why the model kept changing      (compare)
 *
 * The three sub-atomic particles are worth nothing as a list of names, so each
 * simulation here makes one of them do work: the proton decides identity
 * (A2.2), the neutron decides mass (A2.3), and the gold foil shows that the
 * whole nucleus is a speck (A2.4).
 */

/* ---------------------------------------------------------------- *
 * A2.1 — Protons, neutrons and electrons
 * ---------------------------------------------------------------- */

const THREE_PARTICLES: ArchetypeSpec = {
  id: "g7a2-three-particles",
  title: "Three Particles, One Atom",
  tagline: "Pick a carbon atom apart and weigh what you find.",
  kind: "explore",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Name the proton, neutron and electron and give the charge and location of each.",
    "Explain that almost all of an atom's mass sits in a nucleus that is almost none of its volume.",
  ],
  misconceptions: [
    "Electrons weigh about the same as protons",
    "The nucleus is a solid ball filling the middle of the atom",
    "Electrons follow neat circular tracks like planets",
  ],
  specimens: [
    {
      id: "carbon", name: "Carbon-12 atom",
      art: { art: "atom", protons: 6, neutrons: 6, electrons: 6 },
      parts: [
        {
          id: "nucleus", name: "The nucleus", at: [0.0, 0.04],
          note: "Six protons and six neutrons packed together. It is about 25,000 times narrower than the whole atom, yet it carries 99.97% of its mass.",
        },
        {
          id: "proton", name: "Proton", at: [-0.07, 0.09],
          note: "Charge +1, mass 1.673 x 10^-27 kg. Six of them is what makes this carbon rather than boron or nitrogen.",
        },
        {
          id: "neutron", name: "Neutron", at: [0.08, 0.08],
          note: "No charge at all, and a whisker heavier than a proton. Neutrons set the mass and keep the nucleus from flying apart.",
        },
        {
          id: "inner", name: "Inner shell: 2 electrons", at: [-0.19, -0.11],
          note: "Charge -1 each, and 1,836 times lighter than a proton. The first shell is full at two.",
        },
        {
          id: "outer", name: "Outer shell: 4 electrons", at: [0.28, -0.15],
          note: "Four outer electrons, four bonds. Every fact about carbon chemistry starts here, not in the nucleus.",
        },
        {
          id: "empty", name: "Empty space", at: [-0.28, 0.21],
          note: "Almost all of it. If the nucleus were a pea on the centre spot, the nearest electron would be out past the stands.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.2 — Atomic number defines the element
 * ---------------------------------------------------------------- */

const PROTONS_DECIDE: ArchetypeSpec = {
  id: "g7a2-protons-decide",
  title: "Only the Protons Get a Vote",
  tagline: "Six atoms with different neutron and electron counts. Name each one.",
  kind: "sort",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Identify an element from its proton count alone.",
    "Explain that changing neutrons or electrons changes the isotope or the charge, never the element.",
  ],
  misconceptions: [
    "Adding a neutron turns one element into the next one",
    "An ion is a different element because its electron count changed",
  ],
  categories: [
    { id: "carbon", name: "Carbon", hint: "6 protons" },
    { id: "nitrogen", name: "Nitrogen", hint: "7 protons" },
    { id: "oxygen", name: "Oxygen", hint: "8 protons" },
  ],
  specimens: [
    {
      id: "c12", name: "6 protons, 6 neutrons, 6 electrons", category: "carbon",
      because: "Carbon-12, the reference atom for the whole mass scale: one atom of it is defined as exactly 12 u.",
      art: { art: "atom", protons: 6, neutrons: 6, electrons: 6 },
    },
    {
      id: "c14", name: "6 protons, 8 neutrons, 6 electrons", category: "carbon",
      because: "Carbon-14. Two extra neutrons make it heavier and radioactive, with a half-life of 5,730 years, but 6 protons still means carbon.",
      art: { art: "atom", protons: 6, neutrons: 8, electrons: 6 },
    },
    {
      id: "n14", name: "7 protons, 7 neutrons, 7 electrons", category: "nitrogen",
      because: "Nitrogen-14, which is 99.6% of the nitrogen in the air you are breathing right now.",
      art: { art: "atom", protons: 7, neutrons: 7, electrons: 7 },
    },
    {
      id: "n3-", name: "7 protons, 7 neutrons, 10 electrons", category: "nitrogen",
      because: "A nitride ion, charge 3-. Three borrowed electrons change how it bonds and nothing else: 7 protons, so still nitrogen.",
      art: { art: "atom", protons: 7, neutrons: 7, electrons: 10 },
    },
    {
      id: "o16", name: "8 protons, 8 neutrons, 8 electrons", category: "oxygen",
      because: "Oxygen-16, 99.76% of all oxygen. One more proton than nitrogen, and an utterly different element.",
      art: { art: "atom", protons: 8, neutrons: 8, electrons: 8 },
    },
    {
      id: "o18", name: "8 protons, 10 neutrons, 8 electrons", category: "oxygen",
      because: "Oxygen-18. Rare, heavy and harmless; ice cores are dated by how much of it the ancient snow contains.",
      art: { art: "atom", protons: 8, neutrons: 10, electrons: 8 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.3 — Mass number and isotopes
 * ---------------------------------------------------------------- */

const SAME_ELEMENT: ArchetypeSpec = {
  id: "g7a2-same-element",
  title: "Same Element, Different Weight",
  tagline: "Add neutrons one at a time and watch the mass number climb while the name stays put.",
  kind: "investigate",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Calculate mass number as protons plus neutrons, and neutrons as mass number minus atomic number.",
    "Define isotopes as atoms of one element with different neutron counts.",
  ],
  misconceptions: [
    "Mass number and atomic mass are the same thing",
    "Isotopes of an element react differently from one another",
  ],
  // The drawing is carbon-12, which is where the sliders start. Move them and
  // the arithmetic follows the sliders, not the picture.
  specimens: [
    { id: "nucleus", name: "Carbon-12: 6 protons, 6 neutrons", art: { art: "atom", protons: 6, neutrons: 6, electrons: 6 } },
  ],
  variables: [
    { key: "protons", label: "Protons (atomic number Z)", min: 1, max: 20, step: 1, default: 6 },
    { key: "neutrons", label: "Neutrons (N)", min: 0, max: 24, step: 1, default: 6 },
  ],
  /*
   * Mass number is a count, so it is exact: A = Z + N. The nuclear radius uses
   * the standard empirical relation R = 1.2 A^(1/3) fm, which is what electron
   * scattering measures.
   *
   * The mass share is computed from the real particle masses in unified mass
   * units: proton 1.007276, neutron 1.008665, electron 0.000549. Adding those
   * up does not give the atom's true mass -- carbon-12 is defined as exactly
   * 12 u, about 0.8% less than its parts weigh separately, and that missing
   * mass is the nuclear binding energy. The share the electrons hold is
   * unaffected by that, so 99.97% for carbon is a real figure.
   */
  measure: (v) => {
    const z = Math.max(1, Math.round(v.protons));
    const n = Math.max(0, Math.round(v.neutrons));
    const a = z + n;
    const nucleons = z * 1.007276 + n * 1.008665;
    const electrons = z * 0.00054858;
    return {
      massNumber: a,
      neutronsPerProton: n / z,
      nuclearRadiusFm: 1.2 * Math.cbrt(a),
      nucleusMassPercent: (100 * nucleons) / (nucleons + electrons),
    };
  },
  plot: {
    x: "neutrons", y: "massNumber",
    xLabel: "Neutrons in the nucleus", yLabel: "Mass number (protons + neutrons)",
  },
  /*
   * The nucleus is the readout. Its radius is 1.2 A^(1/3) fm, so the drawn
   * size is the cube root of the mass number against carbon-12's: a nucleus of
   * 44 nucleons is only 1.5 times as wide as one of 12, not nearly four times,
   * because nucleons pack at a fixed density.
   *
   * Stability is the failure state, and it is a real line. Among the first
   * twenty elements every stable isotope sits between about N/Z = 0.8 and
   * N/Z = 1.3; outside that band the nucleus is radioactive, and it shakes
   * here in the direction it will decay -- a neutron-rich nucleus drifts one
   * way, a proton-rich one the other. Push it far past the band and no such
   * nucleus exists at all: it stops dead.
   */
  drive: ({ f, t }) => {
    const ratio = f.neutronsPerProton;
    const off = ratio > 1.3 ? ratio - 1.3 : ratio < 0.8 ? ratio - 0.8 : 0;
    const shake = Math.min(0.22, Math.abs(off) * 0.3);
    const gone = ratio > 2.6 || ratio < 0.42;
    return {
      scale: Math.cbrt(f.massNumber / 12),
      rate: gone ? 0 : 0.8 + Math.abs(off) * 0.6,
      offset: [
        Math.sign(off) * shake * (0.6 + 0.4 * Math.sin(t * 7.7)),
        Math.cos(t * 6.1) * shake * 0.5,
      ],
    };
  },
};

/* ---------------------------------------------------------------- *
 * A2.4 — Building the model: early evidence
 * ---------------------------------------------------------------- */

const THROUGH_THE_FOIL: ArchetypeSpec = {
  id: "g7a2-through-the-foil",
  title: "Follow One Alpha Particle",
  tagline: "Manchester, 1909. Ride a single alpha particle into a sheet of gold leaf.",
  kind: "trace",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Describe the gold foil experiment and the result that could not be explained.",
    "Explain how the rare large deflections point to a tiny, dense, positive nucleus.",
  ],
  misconceptions: [
    "Scientists saw the nucleus and then drew it",
    "Most of the alpha particles bounced back",
  ],
  specimens: [
    {
      id: "alpha", name: "One alpha particle: 2 protons, 2 neutrons, no electrons",
      art: { art: "atom", protons: 2, neutrons: 2, electrons: 0 },
    },
  ],
  // Named only so `drive` can read the speed the engine already publishes for a
  // staged simulation; the stage position is 0.16 x speed x t.
  variables: [
    { key: "rate", label: "Speed", min: 0, max: 2, step: 0.1, default: 0.6 },
  ],
  /*
   * The alpha particle is the subject, and what it does is decelerate. It
   * leaves the source at 1.5 x 10^7 m/s and crosses 1 400 layers of gold as if
   * they were not there. At the head-on approach every joule of its 4.9 MeV of
   * kinetic energy is turned into electrical potential energy against the
   * +79 nucleus, so it stops dead -- 46 fm short of the nucleus, having never
   * touched it -- and is thrown straight back out at the speed it arrived.
   * The picture stops with it.
   */
  drive: ({ v, t }) => {
    const p = (0.16 * v.rate * t) % 1;
    const near = Math.max(0, 1 - Math.abs(p - 0.8) / 0.2);
    return {
      rate: 0.12 + (1 - near) * 1.9,
      scale: 0.72 + near * 0.62,
      offset: [(p <= 0.8 ? p * 0.5 : (1.6 - p) * 0.5) - 0.2, 0],
    };
  },
  stages: [
    { name: "Source", at: 0, caption: "Radium in a lead block. Each alpha particle leaves at 1.5 x 10^7 m/s: 5% of the speed of light." },
    { name: "Foil", at: 0.3, caption: "Gold leaf 400 nm thick, about 1,400 atoms deep. Thin enough to see through, thick enough to hit something." },
    { name: "Straight on", at: 0.55, caption: "Almost every alpha goes through as if the foil were not there." },
    { name: "Turned back", at: 0.8, caption: "About 1 in 8,000 comes back past 90 degrees. Rutherford: like a shell bouncing off tissue paper." },
    { name: "The conclusion", at: 1, caption: "All the positive charge sits in a nucleus under 10^-14 m across. The rest of the atom is empty." },
  ],
  route: [
    {
      at: [0.08, 0.5], name: "Radium source",
      note: "An alpha particle is 2 protons and 2 neutrons: a helium nucleus, charge +2, mass 6.6 x 10^-27 kg. Radium-226 fires them out with 4.9 MeV of energy.",
    },
    {
      at: [0.22, 0.5], name: "The slit",
      note: "A lead collimator throws away every alpha except a narrow beam, so any deflection later must be the foil's doing.",
    },
    {
      at: [0.4, 0.5], name: "Into the gold",
      note: "Gold leaf, 0.00004 cm thick. Gold is chosen because it can be beaten thinner than any other metal and its atoms are heavy: 79 protons each.",
    },
    {
      at: [0.58, 0.44], name: "Through the empty space",
      note: "Most of the atom is nothing at all. The alpha passes tens of nuclei by at a distance and barely notices them: no deflection worth measuring.",
    },
    {
      at: [0.72, 0.32], name: "A near miss",
      note: "Pass closer and the +2 alpha is pushed by a +79 nucleus. A small deflection, a degree or two. These were common, and Thomson's model could just about explain them.",
    },
    {
      at: [0.5, 0.2], name: "The head-on hit",
      note: "One alpha in 8,000 comes almost straight at a nucleus, is stopped by the repulsion and thrown back the way it came. Only a tiny concentrated charge can do that.",
    },
    {
      at: [0.88, 0.55], name: "Zinc sulfide screen",
      note: "Every arrival makes a faint flash. Geiger and Marsden sat in the dark for half an hour to adapt their eyes, then counted flashes by hand, angle by angle, for months.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.5 — Building the model: from shells to a cloud
 * ---------------------------------------------------------------- */

const SHELLS_TO_CLOUD: ArchetypeSpec = {
  id: "g7a2-shells-to-cloud",
  title: "Thirty Years, Four Atoms",
  tagline: "Walk the model forward from 1897 and watch each version get overturned by a measurement.",
  kind: "process",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Put the plum pudding, nuclear, shell and cloud models in order and say what each added.",
    "Explain that a model is replaced when a measurement it cannot account for arrives.",
  ],
  misconceptions: [
    "Earlier scientists were simply wrong and had nothing useful to say",
    "Electrons orbit the nucleus the way planets orbit the Sun",
  ],
  specimens: [
    { id: "h", name: "A hydrogen atom", art: { art: "atom", protons: 1, neutrons: 0, electrons: 1 } },
  ],
  // Named only so `drive` can read the speed the engine already publishes for a
  // staged simulation; the stage position is 0.16 x speed x t.
  variables: [
    { key: "rate", label: "Speed", min: 0, max: 2, step: 0.1, default: 0.6 },
  ],
  /*
   * Each model is drawn the size it claims the atom's charge is. Thomson's
   * positive charge fills the whole atom, 10^-10 m across, so the picture
   * starts wide and slack. Rutherford's collapses it into a nucleus 25 000
   * times smaller and the drawing shrinks with it. Bohr pins the electron to
   * fixed levels, so it settles into a steady turn. Schrodinger takes the path
   * away again: the electron is a standing wave with no orbit, so it smears
   * into a blur that will not resolve however long you look at it.
   */
  drive: ({ v, t }) => {
    const p = (0.16 * v.rate * t) % 1;
    const at = [0, 0.25, 0.5, 0.75, 1];
    const scaleAt = [1.5, 0.62, 0.95, 1.2, 1.05];
    const rateAt = [0.15, 1.1, 0.9, 3.2, 1.4];
    let i = 0;
    while (i < 3 && p > at[i + 1]) i++;
    const k = Math.max(0, Math.min(1, (p - at[i]) / (at[i + 1] - at[i])));
    return {
      scale: scaleAt[i] + (scaleAt[i + 1] - scaleAt[i]) * k,
      rate: rateAt[i] + (rateAt[i + 1] - rateAt[i]) * k,
      tilt: 0.24 + Math.sin(t * 0.3) * 0.05,
    };
  },
  stages: [
    {
      name: "1897 Thomson", at: 0,
      caption: "Cathode rays bend in a magnetic field. The particle doing the bending is 1,836 times lighter than a hydrogen atom: the electron. Atoms have parts.",
    },
    {
      name: "1911 Rutherford", at: 0.25,
      caption: "The gold foil result kills the pudding. Charge and mass sit in a nucleus 25,000 times smaller than the atom.",
    },
    {
      name: "1913 Bohr", at: 0.5,
      caption: "Electrons are allowed only fixed energy levels. Drop from level 3 to level 2 and the atom emits 1.89 eV: hydrogen's red line at 656 nm, exactly where it is seen.",
    },
    {
      name: "1926 Schrodinger", at: 0.75,
      caption: "The electron is a standing wave, not a bead on a wire. In hydrogen it is most likely 0.053 nm out, but it has no path and no orbit.",
    },
    {
      name: "Today", at: 1,
      caption: "Shells for chemistry, clouds for physics. The neutron only turned up in 1932, twenty-one years after the nucleus it lives in.",
    },
  ],
};

/* ---------------------------------------------------------------- *
 * A2.6 — Why the model kept changing
 * ---------------------------------------------------------------- */

const TWO_MODELS: ArchetypeSpec = {
  id: "g7a2-two-models",
  title: "Two Models, One Experiment",
  tagline: "Set the 1904 atom beside the 1911 atom and ask each what the foil should do.",
  kind: "compare",
  subject: "chemistry",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS1-1"] },
  learningGoals: [
    "Compare two models by what each one predicts, not by which looks better.",
    "Explain that a model survives only while its predictions match measurement.",
  ],
  misconceptions: [
    "The plum pudding model was a silly guess",
    "Models are opinions, so one cannot be shown to be better than another",
  ],
  specimens: [
    {
      id: "pudding", name: "Thomson, 1904: charge spread through the whole atom",
      because:
        "A serious model built on real evidence: electrons exist, atoms are neutral, so the positive charge must be somewhere. Spread over 10^-10 m it pushes only feebly, so it predicts every alpha particle passes through deflected by a fraction of a degree. Not one should ever come back.",
      art: { art: "sphere", color: "#e39ab0", radius: 0.44 },
    },
    {
      id: "nuclear", name: "Rutherford, 1911: all the charge in a speck",
      because:
        "Squeeze the same +79 charge into 10^-14 m and the push at close range grows a hundred million times. It predicts most alphas pass untouched and about 1 in 8,000 turns past 90 degrees, which is what Geiger and Marsden counted at every angle in 1913.",
      art: { art: "atom", protons: 2, neutrons: 2, electrons: 2 },
    },
  ],
  variables: [
    {
      key: "energy", label: "Energy of the alpha particle", unit: "MeV",
      min: 1, max: 60, step: 0.5, default: 4.9,
    },
  ],
  /*
   * Fire the same alpha at each model and ask what it should do.
   *
   * An alpha of energy E, charge +2, aimed straight at a gold nucleus of
   * charge +79, stops where all its kinetic energy has become electrical
   * potential energy. In the units nuclear physicists use, e^2/(4 pi eps0) is
   * 1.43996 MeV fm, so the closest approach is
   *
   *   d = 2 x 79 x 1.43996 / E  =  227.5 / E  femtometres
   *
   * which for the 4.9 MeV alphas Geiger and Marsden used is 46 fm: seven times
   * further out than the gold nucleus itself, which is 1.2 x 197^(1/3) =
   * 7.0 fm in radius. Their alphas never touched a nucleus. Rutherford's count
   * of large deflections falls as 1/E^2, so 1 in 8 000 at 4.9 MeV.
   *
   * Thomson's atom spreads the same +79 over the whole 10^-10 m of the atom,
   * and the single-scattering angle it allows is 2 x 79 x 1.43996 / (10^5 fm x
   * E) radians -- 0.027 degrees at 4.9 MeV. That is the number that killed it.
   */
  measure: (v) => ({
    closestApproachFm: 227.5 / v.energy,
    goldNucleusRadiusFm: 7.0,
    turnedBackPerMillion: 125 * (4.9 / v.energy) ** 2,
    thomsonMaxDeflectionDeg: 0.1304 / v.energy,
    reachesTheNucleus: 227.5 / v.energy <= 7.0 ? 1 : 0,
  }),
  /*
   * Thomson's atom is inert whatever you fire at it: a hundredth of a degree
   * is not a picture, so it sits there, and that is the honest drawing of what
   * the model predicts. Rutherford's nucleus fills more and more of the frame
   * as the alpha is allowed closer -- the drawn size is the 46 fm turning
   * point of a radium alpha divided by this one's. Past 32.5 MeV the alpha
   * arrives inside the nuclear surface, Rutherford's formula stops holding,
   * and the drawing stops with it: that departure is how nuclear radii were
   * first measured.
   */
  drive: ({ f, t, index }) => {
    if (index === 0) {
      return {
        rate: 0.12,
        offset: [Math.sin(t * 5) * f.thomsonMaxDeflectionDeg * 0.12, 0],
      };
    }
    const hit = f.reachesTheNucleus > 0;
    return {
      scale: Math.max(0.45, Math.min(2.5, 46.4 / f.closestApproachFm)),
      rate: hit ? 0 : 0.5 + 8 / f.closestApproachFm,
      offset: hit ? [Math.sin(t * 24) * 0.09, Math.cos(t * 19) * 0.09] : [0, 0],
    };
  },
};

export const g7a2ThreeParticles = buildSim(THREE_PARTICLES);
export const g7a2ProtonsDecide = buildSim(PROTONS_DECIDE);
export const g7a2SameElement = buildSim(SAME_ELEMENT);
export const g7a2ThroughTheFoil = buildSim(THROUGH_THE_FOIL);
export const g7a2ShellsToCloud = buildSim(SHELLS_TO_CLOUD);
export const g7a2TwoModels = buildSim(TWO_MODELS);
