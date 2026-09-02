import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 8 · Unit C · Topic C3 — Magnetic forces and electromagnets.
 *
 * Five simulations, one per subtopic:
 *
 *   C3.1  g8c3-two-ends-never-one   magnetic poles                  (explore)
 *   C3.2  g8c3-which-ones-stick     magnetic materials              (sort)
 *   C3.3  g8c3-the-needle-turns     current produces a field        (investigate)
 *   C3.4  g8c3-more-turns-more-pull building an electromagnet       (investigate)
 *   C3.5  g8c3-a-magnet-that-big    Earth's magnetic field          (compare)
 *
 * The two investigations are the two classic benches. C3.3 is Oersted's, read
 * as a tangent galvanometer: the compass settles where the wire's field and
 * Earth's own agree, so tan(theta) = B_wire / B_horizontal and the needle
 * itself is the ammeter. C3.4 is the electromagnet, with mu0 mu_r N I / L for
 * the field and B squared A / 2 mu0 for the pull — and iron that stops
 * answering at 1.6 T however much more current is poured in.
 */

/** Permeability of free space, T m / A. */
const MU0 = 4e-7 * Math.PI;
/** Earth's horizontal field component at mid latitudes, T. */
const B_HORIZONTAL = 18e-6;
/** Earth's total field at the magnetic equator, T. */
const B_EQUATOR = 31e-6;
/** Where soft iron stops magnetising further, T. */
const IRON_SATURATION = 1.6;
/** Relative permeability of the annealed soft-iron core. */
const IRON_MU_R = 200;
/** Length of the solenoid, m. */
const COIL_LENGTH = 0.08;
/** Cross-section of the 12 mm core, m2. */
const CORE_AREA = Math.PI * 0.006 * 0.006;

/* ---------------------------------------------------------------- *
 * C3.1 — Magnetic poles
 * ---------------------------------------------------------------- */

const TWO_ENDS_NEVER_ONE: ArchetypeSpec = {
  id: "g8c3-two-ends-never-one",
  title: "Two Ends, Never One",
  tagline: "Saw a magnet in half and you do not get a north half and a south half.",
  kind: "explore",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5"] },
  learningGoals: [
    "Identify the poles of a bar magnet and state that like poles repel.",
    "Explain why a magnet cannot be divided into a separate north and south piece.",
  ],
  misconceptions: [
    "A magnet can be cut to give a single north pole",
    "The middle of a bar magnet is the strongest part",
  ],
  specimens: [
    {
      id: "bar",
      name: "Alnico bar magnet, 1 A m2",
      art: { art: "apparatus", which: "magnet" },
      parts: [
        {
          id: "north", name: "North-seeking pole", at: [0.44, -0.12],
          note: "Field lines leave here. On the axis 5 cm out the field is 1.6 mT, about thirty times Earth's own.",
        },
        {
          id: "south", name: "South-seeking pole", at: [-0.44, -0.12],
          note: "The same lines return here. Every line that leaves the north end comes back, which is why the two ends are always equal in strength.",
        },
        {
          id: "middle", name: "The neutral middle", at: [0.0, 0.36],
          note: "Dip the bar in iron filings and the middle comes out almost bare. The lines run along inside the metal here rather than out through the surface.",
        },
        {
          id: "cut", name: "Cut it in half", at: [0.36, 0.44],
          note: "You get two shorter magnets, each with its own north and south. Keep going down to a single atom and it is still a tiny two-ended magnet.",
        },
        {
          id: "domains", name: "Why it works at all", at: [-0.4, 0.44],
          note: "Billions of domains, each already magnetic, lined up together. Heat iron past its Curie point of 770 degrees and they scramble and the magnetism is gone.",
        },
      ],
    },
  ],
  /*
   * A slow, steady turn: the point of the sim is that both ends are always
   * present, and a magnet that rotates shows both of them without the student
   * having to be told.
   */
  drive: () => ({ tilt: 0.24, rate: 1 }),
};

/* ---------------------------------------------------------------- *
 * C3.2 — Magnetic materials
 * ---------------------------------------------------------------- */

const WHICH_ONES_STICK: ArchetypeSpec = {
  id: "g8c3-which-ones-stick",
  title: "Only Three Metals, Really",
  tagline: "Eight samples, all of them shiny. A magnet cares about only some of them.",
  kind: "sort",
  subject: "physics",
  bands: ["6-8"],
  grades: [7, 8],
  standards: { ngss: ["MS-PS2-3"] },
  learningGoals: [
    "Identify iron, nickel and cobalt as the ferromagnetic elements met at this level.",
    "Reject the idea that all metals, or only shiny things, are magnetic.",
  ],
  misconceptions: [
    "All metals are attracted to magnets",
    "Anything that conducts electricity is magnetic",
  ],
  categories: [
    { id: "magnetic", name: "A magnet picks it up", hint: "iron, nickel, cobalt and their alloys" },
    { id: "not", name: "A magnet ignores it", hint: "shiny, conducting, and completely unmoved" },
  ],
  specimens: [
    {
      id: "iron", name: "Iron nail", category: "magnetic",
      because: "The classic ferromagnet. Its domains line up in a field and stay lined up until you knock or heat them out of it.",
      art: { art: "sphere", color: "#8a8f99", radius: 0.44 },
    },
    {
      id: "steel", name: "Steel paperclip", category: "magnetic",
      because: "Steel is mostly iron with under 2 per cent carbon, so it behaves like iron. This is why paperclips and pins are the standard test object.",
      art: { art: "sphere", color: "#c2c8d2", radius: 0.42 },
    },
    {
      id: "nickel", name: "Nickel coin blank", category: "magnetic",
      because: "One of only three elements that are ferromagnetic at room temperature. It loses it above 358 degrees, its Curie point.",
      art: { art: "sphere", color: "#cfd4c0", radius: 0.42 },
    },
    {
      id: "cobalt", name: "Cobalt sample", category: "magnetic",
      because: "The third one, and the toughest: it stays magnetic up to 1 115 degrees, which is why it goes into magnets that have to work hot.",
      art: { art: "sphere", color: "#7f9ecb", radius: 0.42 },
    },
    {
      id: "copper", name: "Copper wire", category: "not",
      because: "The best everyday conductor and completely unmagnetic. Conducting and being magnetic are two different properties, and copper proves it.",
      art: { art: "sphere", color: "#c87b4a", radius: 0.44 },
    },
    {
      id: "aluminium", name: "Aluminium can", category: "not",
      because: "A metal, shiny, light, and a magnet will not lift it. Drop a magnet down an aluminium tube though and it falls slowly: that is a different effect entirely.",
      art: { art: "sphere", color: "#dde0e6", radius: 0.44 },
    },
    {
      id: "brass", name: "Brass screw", category: "not",
      because: "Copper and zinc, neither of them magnetic. Brass screws are used near compasses on boats for exactly this reason.",
      art: { art: "sphere", color: "#cbaa4e", radius: 0.42 },
    },
    {
      id: "glass", name: "Glass rod", category: "not",
      because: "Not a metal at all. It can be charged by rubbing, which is an electric effect, and no magnet will ever touch it.",
      art: { art: "sphere", color: "#bfe1e6", radius: 0.4 },
    },
  ],
  /*
   * A magnet is being held above the tray. A ferromagnetic sample lifts toward
   * it and turns as its domains swing into line; the rest sit on the bench and
   * do nothing at all. Everything comes from the specimen's own category and
   * the clock, so the same sample behaves the same way every run.
   */
  drive: ({ specimen, t }) =>
    specimen.category === "magnetic"
      ? { offset: [0, -0.2 + Math.sin(t * 1.6) * 0.04], rate: 2 }
      : { offset: [0, 0.08], rate: 0 },
};

/* ---------------------------------------------------------------- *
 * C3.3 — Current produces a magnetic effect
 * ---------------------------------------------------------------- */

const THE_NEEDLE_TURNS: ArchetypeSpec = {
  id: "g8c3-the-needle-turns",
  title: "The Needle Turns",
  tagline: "Oersted's accident: a compass under a wire swings the moment the current flows.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5"] },
  learningGoals: [
    "Show that an electric current produces a magnetic field around the wire.",
    "Relate the size of that field to the current and to the distance from the wire.",
  ],
  misconceptions: [
    "Only magnets can make a magnetic field",
    "The wire's field points along the wire",
  ],
  specimens: [
    { id: "compass", name: "Compass needle under the wire", art: { art: "apparatus", which: "magnet" } },
  ],
  variables: [
    { key: "current", label: "Current in the wire (A)", min: 0, max: 6, step: 0.1, default: 2 },
    { key: "distance", label: "Compass below the wire (mm)", min: 5, max: 40, step: 1, default: 15 },
  ],
  /*
   * Around a long straight wire, B = mu0 I / (2 pi r), which is 2e-7 x I / r
   * exactly. 2.0 A at 15 mm gives 26.7 microtesla. The compass is already held
   * by Earth's horizontal field of about 18 microtesla, and it settles where
   * the two agree, so tan(theta) = B_wire / B_horizontal — 56 degrees here.
   * That is a tangent galvanometer: the needle is the ammeter, and reading the
   * angle backwards gives the current.
   */
  measure: (v) => {
    const r = Math.max(0.002, v.distance / 1000);
    const b = (MU0 * v.current) / (2 * Math.PI * r);
    return {
      wireFieldMicroTesla: b * 1e6,
      deflectionDeg: (Math.atan(b / B_HORIZONTAL) * 180) / Math.PI,
      timesEarthsHorizontalField: b / B_HORIZONTAL,
    };
  },
  plot: {
    x: "current", y: "deflectionDeg",
    xLabel: "Current in the wire (A)", yLabel: "Needle deflection (degrees)",
  },
  /*
   * The compass is viewed from above, so the needle's swing is a turn about
   * the vertical: `spin` is exactly the deflection the measurement found, and
   * at zero current it lies along the north-south line where Earth alone put
   * it. Turn the current up and it walks round toward ninety degrees but never
   * quite reaches it, because Earth's field is still there pulling back.
   */
  drive: ({ f }) => ({
    tilt: 1.15,
    spin: (f.deflectionDeg * Math.PI) / 180,
    offset: [0, 0.12],
    scale: 0.9,
  }),
};

/* ---------------------------------------------------------------- *
 * C3.4 — Building and varying a simple electromagnet
 * ---------------------------------------------------------------- */

const MORE_TURNS_MORE_PULL: ArchetypeSpec = {
  id: "g8c3-more-turns-more-pull",
  title: "More Turns, More Pull",
  tagline: "Wind on more wire and the trolley slides in. Keep going and the iron stops caring.",
  kind: "investigate",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-ETS1-3"] },
  learningGoals: [
    "Predict how the strength of an electromagnet changes with turns and with current.",
    "Explain magnetic saturation as the limit of what an iron core can add.",
  ],
  misconceptions: [
    "An electromagnet gets stronger without limit as the current rises",
    "The iron core is only there to hold the coil up",
  ],
  specimens: [
    { id: "load", name: "Iron trolley on the bench", art: { art: "apparatus", which: "cart" } },
  ],
  variables: [
    { key: "turns", label: "Turns of wire", min: 20, max: 200, step: 5, default: 80 },
    { key: "current", label: "Current (A)", min: 0.2, max: 3, step: 0.1, default: 1 },
  ],
  /*
   * Inside a solenoid, B = mu0 mu_r N I / L. With an annealed soft-iron core
   * of mu_r = 200, 80 mm long, 100 turns at 1.0 A gives
   * 1.2566e-6 x 200 x 100 x 1.0 / 0.080 = 0.314 T. The pull on a flat iron
   * face in contact is B squared A / (2 mu0), and with a 12 mm core, area
   * 1.131e-4 m2, that is 4.4 N — about 450 g. Iron cannot be magnetised past
   * about 1.6 T however hard it is driven, so past that point extra turns and
   * extra current buy nothing at all.
   */
  measure: (v) => {
    const raw = (MU0 * IRON_MU_R * v.turns * v.current) / COIL_LENGTH;
    const b = Math.min(IRON_SATURATION, raw);
    const force = (b * b * CORE_AREA) / (2 * MU0);
    return {
      fieldTesla: b,
      liftForceN: force,
      liftKg: force / 9.81,
      saturated: raw >= IRON_SATURATION ? 1 : 0,
    };
  },
  plot: {
    x: "turns", y: "fieldTesla",
    xLabel: "Turns of wire", yLabel: "Field in the core (T)",
  },
  /*
   * The trolley is the force meter. It starts out at the far end of the bench
   * and is drawn in as the pull grows, in proportion to the field the core has
   * actually reached — so once the iron saturates it stops advancing however
   * far the sliders go, and its wheels stop with it. That refusal to move is
   * the lesson: the current is still rising and the magnet is not.
   */
  drive: ({ f }) => {
    const pull = Math.min(1, f.fieldTesla / IRON_SATURATION);
    const stuck = f.saturated > 0.5;
    return {
      offset: [0.5 - pull * 0.95, 0.16],
      scale: 0.78,
      tilt: 0.26,
      rate: stuck ? 0 : 0.5 + pull * 2.5,
    };
  },
};

/* ---------------------------------------------------------------- *
 * C3.5 — Earth's magnetic field
 * ---------------------------------------------------------------- */

const A_MAGNET_THAT_BIG: ArchetypeSpec = {
  id: "g8c3-a-magnet-that-big",
  title: "A Magnet the Size of a Planet",
  tagline: "Back away from the Earth and from a bar magnet. The field dies at exactly the same rate.",
  kind: "compare",
  subject: "physics",
  bands: ["6-8"],
  grades: [8],
  standards: { ngss: ["MS-PS2-3", "MS-PS2-5"] },
  learningGoals: [
    "Describe Earth's magnetic field as that of a bar magnet tilted inside the planet.",
    "Show that both fields fall with the cube of the distance from the centre.",
  ],
  misconceptions: [
    "Earth's magnetic north pole is the same place as its geographic north pole",
    "Earth's field is made by a lump of permanent magnet in the core",
  ],
  specimens: [
    {
      id: "earth", name: "Earth: 31 microtesla at the surface",
      because: "A dipole tilted about 11 degrees from the spin axis, made by molten iron churning in the outer core. Doubling your distance from the centre leaves an eighth of the field.",
      art: { art: "planet", color: "#3f7fd0", atmosphere: "#bcd9ff" },
    },
    {
      id: "bar", name: "Bar magnet: 1 600 microtesla at 5 cm",
      because: "Fifty times stronger close up, and it dies away with exactly the same one-over-r-cubed law. Same shape of field, different size of magnet.",
      art: { art: "apparatus", which: "magnet" },
    },
  ],
  variables: [
    { key: "distance", label: "Distance out, in source radii", min: 1, max: 5, step: 0.1, default: 1 },
    { key: "latitude", label: "Magnetic latitude (degrees)", min: 0, max: 80, step: 1, default: 52 },
  ],
  /*
   * A dipole field falls as one over r cubed, whatever makes it. For Earth,
   * the surface field runs from 31 microtesla at the magnetic equator to about
   * 62 at the pole, following B0 root(1 + 3 sin squared latitude); at 2 Earth
   * radii it is an eighth of that. For a 1 A m2 bar magnet, the on-axis field
   * one radius out — taking 5 cm as its radius — is 2e-7 / 0.05 cubed, which
   * is 1 600 microtesla, and it falls by the same cube. The dip angle follows
   * tan(dip) = 2 tan(latitude): 0 degrees at the equator, 69 at 52 north.
   */
  measure: (v) => {
    const r = Math.max(1, v.distance);
    const lat = (v.latitude * Math.PI) / 180;
    const surface = B_EQUATOR * Math.sqrt(1 + 3 * Math.sin(lat) * Math.sin(lat));
    return {
      earthFieldMicroTesla: (surface / (r * r * r)) * 1e6,
      barMagnetFieldMicroTesla: (2e-7 / Math.pow(0.05 * r, 3)) * 1e6,
      dipAngleDeg: (Math.atan(2 * Math.tan(lat)) * 180) / Math.PI,
    };
  },
  plot: {
    x: "distance", y: "earthFieldMicroTesla",
    xLabel: "Distance out, in source radii", yLabel: "Earth's field (microtesla)",
  },
  /*
   * Both panels answer the same slider the same way, which is the argument.
   * Apparent size goes as one over the distance, so backing off to five radii
   * leaves each source a fifth of the width it had at the surface — while the
   * readings beside them have fallen by a factor of 125. The picture shrinks
   * slowly and the field collapses: that is what a cube law looks like.
   */
  drive: ({ v, index }) => {
    const r = Math.max(1, v.distance);
    return {
      scale: 1.05 / r,
      offset: index === 0 ? [0, 0] : [0, 0.05],
      tilt: 0.24,
    };
  },
};

export const g8c3TwoEndsNeverOne = buildSim(TWO_ENDS_NEVER_ONE);
export const g8c3WhichOnesStick = buildSim(WHICH_ONES_STICK);
export const g8c3TheNeedleTurns = buildSim(THE_NEEDLE_TURNS);
export const g8c3MoreTurnsMorePull = buildSim(MORE_TURNS_MORE_PULL);
export const g8c3AMagnetThatBig = buildSim(A_MAGNET_THAT_BIG);
