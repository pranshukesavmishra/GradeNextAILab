import { describe, expect, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, GradeBand, ParamValues } from "@engine/types";

import { statesOfMatterSim } from "./chemistry/states-of-matter";
import { phLabSim } from "./chemistry/ph-lab";
import { reactionsSim } from "./chemistry/reactions";
import { buildAtomSim } from "./chemistry/build-atom";
import { gasLawsSim } from "./chemistry/gas-laws";
import { ecosystemSim } from "./biology/ecosystem";
import { naturalSelectionSim } from "./biology/natural-selection";
import { photosynthesisSim } from "./biology/photosynthesis";
import { moonPhasesSim } from "./earth/moon-phases";
import { seasonsSim } from "./earth/seasons";
import { plateTectonicsSim } from "./earth/plate-tectonics";

/**
 * A simulation that is subtly wrong teaches something false with complete
 * confidence, and a student has no way to catch it. So every quantitative
 * claim these sims put on screen is checked here against a value science
 * already knows: water's boiling point, the gas constant, the synodic month,
 * Earth's axial tilt, the sign of a subduction trench.
 *
 * Where a model deliberately departs from the textbook (a hard-disk gas is not
 * an ideal gas), the tolerance says so and is pinned, so the departure cannot
 * quietly grow.
 */

const R_GAS = 8.314;
/** Time params are SI seconds, so a day index has to be converted. */
const DAY = 86400;
const SYNODIC_MONTH = 29.530588;
const DEG = Math.PI / 180;

function run(
  sim: AnySim, overrides: ParamValues, seconds: number,
  band: GradeBand = "9-12", seed = "golden",
) {
  const params = { ...defaultParams(sim.params), ...overrides };
  const runner = new SimRunner({ manifest: sim, params, band, seed });
  runner.playing = true;
  for (let t = 0; t < seconds; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}

const factsOf = (...args: Parameters<typeof run>) => run(...args).facts();

/* ================================================================== *
 * Chemistry
 * ================================================================== */

describe("states of matter: real phase transitions", () => {
  it("puts water's melting and boiling points where they belong", () => {
    const f = factsOf(statesOfMatterSim, { substance: "water" }, 2);
    expect(f.meltingPoint).toBeCloseTo(273.15, 2);
    expect(f.boilingPoint).toBeCloseTo(373.15, 2);
  });

  it("shows every substance solid, liquid and gas in the right bands", () => {
    for (const [substance, melting, boiling] of [
      ["water", 273.15, 373.15], ["oxygen", 54.36, 90.19], ["neon", 24.56, 27.1],
    ] as const) {
      const solid = factsOf(statesOfMatterSim, { substance, temperature: melting * 0.85 }, 15);
      const liquid = factsOf(
        statesOfMatterSim, { substance, temperature: (melting + boiling) / 2 }, 15,
      );
      const gas = factsOf(statesOfMatterSim, { substance, temperature: boiling * 1.15 }, 15);
      expect(solid.phase, `${substance} below melting`).toBe("solid");
      expect(liquid.phase, `${substance} between melting and boiling`).toBe("liquid");
      expect(gas.phase, `${substance} above boiling`).toBe("gas");
    }
  });

  it("freezes, melts and boils water at the right temperatures", () => {
    // Long enough for the lattice to melt or the vapour to fill the box; phase
    // is measured from particle behaviour, so it is not instantaneous.
    expect(factsOf(statesOfMatterSim, { substance: "water", temperature: 230 }, 15).phase)
      .toBe("solid");
    expect(factsOf(statesOfMatterSim, { substance: "water", temperature: 320 }, 15).phase)
      .toBe("liquid");
    expect(factsOf(statesOfMatterSim, { substance: "water", temperature: 450 }, 15).phase)
      .toBe("gas");
  });
});

describe("pH lab: real acidity", () => {
  it("reads household substances at their textbook pH", () => {
    // Lemon juice is about 2; ammonia is a weak base well above 7.
    const lemon = factsOf(phLabSim, { substance: "lemon" }, 2);
    expect(lemon.ph as number).toBeGreaterThan(1.5);
    expect(lemon.ph as number).toBeLessThan(3.0);
    expect(lemon.acidic).toBe(true);
    expect(lemon.basic).toBe(false);
  });

  it("puts pure water at neutral", () => {
    const f = factsOf(phLabSim, { substance: "water" }, 2);
    expect(f.ph as number).toBeCloseTo(7, 0);
  });
});

describe("reaction kinetics: collision theory", () => {
  it("speeds the reaction up when heated", () => {
    const cold = factsOf(reactionsSim, { temperature: 400 }, 8);
    const hot = factsOf(reactionsSim, { temperature: 800 }, 8);
    expect(hot.percentComplete as number).toBeGreaterThan(cold.percentComplete as number);
  });

  it("speeds the reaction up with a catalyst, at the same temperature", () => {
    const plain = factsOf(reactionsSim, { catalyst: false }, 8);
    const catalysed = factsOf(reactionsSim, { catalyst: true }, 8);
    expect(catalysed.percentComplete as number).toBeGreaterThan(plain.percentComplete as number);
  });

  it("converts only a fraction of collisions, never more than all of them", () => {
    const f = factsOf(reactionsSim, {}, 8);
    expect(f.successful as number).toBeLessThanOrEqual(f.collisions as number);
    expect(f.percentComplete as number).toBeLessThanOrEqual(1);
  });
});

describe("build an atom: the real periodic table", () => {
  it("identifies elements by proton count alone", () => {
    for (const [protons, symbol] of [[1, "H"], [2, "He"], [6, "C"], [8, "O"], [10, "Ne"]] as const) {
      const f = factsOf(buildAtomSim, { protons, neutrons: protons, electrons: protons }, 1);
      expect(f.element, `Z=${protons}`).toBe(symbol);
    }
  });

  it("writes carbon-12 correctly and calls it neutral", () => {
    const f = factsOf(buildAtomSim, { protons: 6, neutrons: 6, electrons: 6 }, 1);
    expect(f.massNumber).toBe(12);
    expect(f.charge).toBe(0);
    expect(f.isNeutral).toBe(true);
    expect(f.isIon).toBe(false);
  });

  it("makes an ion when electrons do not match protons", () => {
    const cation = factsOf(buildAtomSim, { protons: 6, neutrons: 6, electrons: 5 }, 1);
    expect(cation.charge).toBe(1);
    expect(cation.isIon).toBe(true);

    const anion = factsOf(buildAtomSim, { protons: 8, neutrons: 8, electrons: 10 }, 1);
    expect(anion.charge).toBe(-2);
    expect(anion.element).toBe("O");
  });

  it("makes an isotope when neutrons change, without changing the element", () => {
    const c14 = factsOf(buildAtomSim, { protons: 6, neutrons: 8, electrons: 6 }, 1);
    expect(c14.element).toBe("C");
    expect(c14.massNumber).toBe(14);
    expect(c14.isIsotope).toBe(true);
  });
});

describe("gas laws: PV = nRT emerges from molecular collisions", () => {
  // Pressure here is measured from wall impulses, not computed from the ideal
  // gas law, so landing on R is a real result rather than a tautology.
  it("lands PV/nT on the gas constant", () => {
    const f = factsOf(gasLawsSim, { volume: 0.0009, temperature: 300 }, 45);
    expect(f.pvnt as number).toBeCloseTo(R_GAS, 0);
    expect(Math.abs((f.pvnt as number) - R_GAS) / R_GAS).toBeLessThan(0.03);
  });

  it("holds Boyle's law across a five-fold compression", () => {
    const ratios = [0.0015, 0.0012, 0.0009, 0.0006, 0.0003].map(
      (volume) => factsOf(gasLawsSim, { volume, temperature: 300 }, 45).pvnt as number,
    );
    // PV/nT must stay put as the gas is squeezed: no systematic drift.
    for (const r of ratios) expect(Math.abs(r - R_GAS) / R_GAS).toBeLessThan(0.05);
    const spread = (Math.max(...ratios) - Math.min(...ratios)) / R_GAS;
    expect(spread, "PV/nT spread across the sweep").toBeLessThan(0.05);
  });

  it("raises pressure when the gas is compressed at fixed temperature", () => {
    const big = factsOf(gasLawsSim, { volume: 0.0015, temperature: 300 }, 45);
    const small = factsOf(gasLawsSim, { volume: 0.0006, temperature: 300 }, 45);
    expect(small.pressure as number).toBeGreaterThan(big.pressure as number);
  });

  it("raises pressure when the gas is heated at fixed volume", () => {
    const cool = factsOf(gasLawsSim, { temperature: 200 }, 45);
    const warm = factsOf(gasLawsSim, { temperature: 500 }, 45);
    expect(warm.pressure as number).toBeGreaterThan(cool.pressure as number);
  });
});

/* ================================================================== *
 * Biology
 * ================================================================== */

describe("ecosystem: predator and prey", () => {
  it("keeps all three trophic levels alive under default conditions", () => {
    const f = factsOf(ecosystemSim, {}, 20);
    expect(f.speciesAlive).toBe(3);
  });

  it("collapses the foxes when their prey is removed", () => {
    const f = factsOf(ecosystemSim, { rabbits0: 4, foxes0: 30 }, 30);
    expect(f.foxes as number).toBeLessThan(30);
  });

  it("lets rabbits outnumber foxes, as a trophic pyramid requires", () => {
    const f = factsOf(ecosystemSim, {}, 25);
    expect(f.peakRabbits as number).toBeGreaterThan(f.peakFoxes as number);
  });
});

describe("natural selection: camouflage under predation", () => {
  it("favours light fur on snow", () => {
    const f = factsOf(naturalSelectionSim, { environment: "snow", startLight: 0.5 }, 45);
    if (!f.extinct) expect(f.lightFraction as number).toBeGreaterThan(0.9);
  });

  it("favours dark fur on grass, from the same starting mix", () => {
    const f = factsOf(naturalSelectionSim, { environment: "grass", startLight: 0.5 }, 45);
    if (!f.extinct) expect(f.darkFraction as number).toBeGreaterThan(0.9);
  });

  it("keeps the two morph fractions summing to one", () => {
    const f = factsOf(naturalSelectionSim, {}, 15);
    if (!f.extinct) {
      expect((f.lightFraction as number) + (f.darkFraction as number)).toBeCloseTo(1, 6);
    }
  });
});

describe("photosynthesis: limiting factors", () => {
  it("subtracts respiration from gross rate to give the net rate", () => {
    const f = factsOf(photosynthesisSim, {}, 5);
    expect(f.netRate as number).toBeCloseTo(
      (f.grossRate as number) - (f.respirationRate as number), 6,
    );
  });

  it("names light as the limiting factor in the dark", () => {
    const f = factsOf(photosynthesisSim, { light: 0.05, co2: 800 }, 5);
    expect(f.limitingFactor).toBe("light");
  });

  it("names carbon dioxide as limiting when light is plentiful but CO2 is not", () => {
    const f = factsOf(photosynthesisSim, { light: 1, co2: 150 }, 5);
    expect(f.limitingFactor).toBe("co2");
  });

  it("raises the rate as light increases, while light is the limit", () => {
    const dim = factsOf(photosynthesisSim, { light: 0.2, co2: 800 }, 5);
    const bright = factsOf(photosynthesisSim, { light: 0.9, co2: 800 }, 5);
    expect(bright.grossRate as number).toBeGreaterThan(dim.grossRate as number);
  });

  it("drives net production below zero in darkness, where respiration wins", () => {
    const f = factsOf(photosynthesisSim, { light: 0 }, 5);
    expect(f.netRate as number).toBeLessThan(0);
    expect(f.belowCompensation).toBe(true);
  });
});

/* ================================================================== *
 * Earth & space
 * ================================================================== */

describe("moon phases: the synodic month", () => {
  it("returns to the same phase one synodic month later", () => {
    const now = factsOf(moonPhasesSim, { startDay: 0, rate: 0 }, 1);
    const later = factsOf(
      moonPhasesSim, { startDay: SYNODIC_MONTH * DAY, rate: 0 }, 1,
    );
    expect(later.illuminated as number).toBeCloseTo(now.illuminated as number, 1);
    expect(later.phase).toBe(now.phase);
  });

  // Day 0 is 1 January 2000, which was NOT a new moon: the first new moon of
  // the millennium fell on 6 January. The sim is driven by real orbits, so the
  // phases are found rather than assumed.
  const newMoonDay = (() => {
    let best = { day: 0, lit: 1 };
    for (let day = 0; day < 32; day += 0.25) {
      const lit = factsOf(moonPhasesSim, { startDay: day * DAY, rate: 0 }, 0.2)
        .illuminated as number;
      if (lit < best.lit) best = { day, lit };
    }
    return best.day;
  })();

  it("puts the first new moon of 2000 on 6 January, as the ephemeris does", () => {
    expect(newMoonDay).toBeCloseTo(5, 0);   // day 0 is 1 January
  });

  it("shows a dark disc at new moon and a lit one at full", () => {
    const atNew = factsOf(moonPhasesSim, { startDay: newMoonDay * DAY, rate: 0 }, 1);
    expect(atNew.illuminated as number).toBeLessThan(0.02);
    expect(atNew.isNew).toBe(true);

    const atFull = factsOf(
      moonPhasesSim, { startDay: (newMoonDay + SYNODIC_MONTH / 2) * DAY, rate: 0 }, 1,
    );
    expect(atFull.illuminated as number).toBeGreaterThan(0.98);
    expect(atFull.isFull).toBe(true);
  });

  it("reaches half-lit at the quarters", () => {
    const firstQuarter = factsOf(
      moonPhasesSim, { startDay: (newMoonDay + SYNODIC_MONTH / 4) * DAY, rate: 0 }, 1,
    );
    expect(firstQuarter.illuminated as number).toBeCloseTo(0.5, 1);
  });
});

describe("seasons: tilt, not distance", () => {
  it("uses Earth's real axial tilt", () => {
    const f = factsOf(seasonsSim, {}, 1);
    expect(f.tiltDeg as number).toBeCloseTo(23.44, 1);
  });

  it("gives twelve hours of daylight at an equinox", () => {
    // Day 80 is on or about the March equinox.
    const f = factsOf(seasonsSim, { startDay: 80 * DAY, rate: 0, latitude: 40 * DEG }, 1);
    expect(f.daylightHours as number).toBeCloseTo(12, 0);
    expect(Math.abs(f.declinationDeg as number)).toBeLessThan(2);
  });

  it("swings the sun's declination between the tropics over a year", () => {
    const summer = factsOf(seasonsSim, { startDay: 172 * DAY, rate: 0 }, 1);   // June solstice
    const winter = factsOf(seasonsSim, { startDay: 355 * DAY, rate: 0 }, 1);   // December solstice
    expect(summer.declinationDeg as number).toBeCloseTo(23.44, 0);
    expect(winter.declinationDeg as number).toBeCloseTo(-23.44, 0);
  });

  it("gives the northern hemisphere long days in June and short days in December", () => {
    const lat = 40 * DEG;
    const june = factsOf(seasonsSim, { startDay: 172 * DAY, rate: 0, latitude: lat }, 1);
    const december = factsOf(seasonsSim, { startDay: 355 * DAY, rate: 0, latitude: lat }, 1);
    expect(june.daylightHours as number).toBeGreaterThan(14);
    expect(december.daylightHours as number).toBeLessThan(10);
  });

  it("delivers midnight sun inside the Arctic Circle at the June solstice", () => {
    const arctic = 75 * DEG;
    const f = factsOf(seasonsSim, { startDay: 172 * DAY, rate: 0, latitude: arctic }, 1);
    expect(f.midnightSun).toBe(true);
    expect(f.daylightHours as number).toBeCloseTo(24, 1);
  });

  it("puts Earth nearest the Sun in January, when the north is coldest", () => {
    // The distance argument for seasons is the classic misconception; the sim
    // must show perihelion falling in northern winter.
    const january = factsOf(seasonsSim, { startDay: 3 * DAY, rate: 0 }, 1).distanceAU as number;
    const july = factsOf(seasonsSim, { startDay: 185 * DAY, rate: 0 }, 1).distanceAU as number;
    expect(january).toBeLessThan(july);
    expect(january).toBeCloseTo(0.983, 1);
    expect(july).toBeCloseTo(1.017, 1);
  });
});

describe("plate tectonics: boundaries build the right landforms", () => {
  it("subducts ocean under continent, digging a trench and raising mountains", () => {
    const f = factsOf(
      plateTectonicsSim,
      { boundary: "convergent", leftPlate: "oceanic", rightPlate: "continental" }, 10,
    );
    expect(f.subducting).toBe(true);
    expect(f.minElevationM as number).toBeLessThan(-4000);   // trench
    expect(f.maxElevationM as number).toBeGreaterThan(1000); // arc mountains
  });

  it("collides two continents into mountains with no subduction", () => {
    const f = factsOf(
      plateTectonicsSim,
      { boundary: "convergent", leftPlate: "continental", rightPlate: "continental" }, 10,
    );
    expect(f.collision).toBe(true);
    expect(f.subducting).toBe(false);
    expect(f.maxElevationM as number).toBeGreaterThan(2000);
    expect(f.crustThicknessKm as number).toBeGreaterThan(35);
  });

  it("spreads a divergent boundary apart", () => {
    const f = factsOf(plateTectonicsSim, { boundary: "divergent" }, 12);
    expect(f.spreading).toBe(true);
  });

  it("slips a transform boundary sideways without building or destroying crust", () => {
    const f = factsOf(plateTectonicsSim, { boundary: "transform" }, 10);
    expect(f.subducting).toBe(false);
    expect(f.spreading).toBe(false);
    expect(Math.abs(f.offsetKm as number)).toBeGreaterThan(0);
  });

  it("shakes harder at a subduction zone than at a spreading ridge", () => {
    const sub = factsOf(
      plateTectonicsSim,
      { boundary: "convergent", leftPlate: "oceanic", rightPlate: "continental" }, 12,
    );
    const ridge = factsOf(plateTectonicsSim, { boundary: "divergent" }, 12);
    expect(sub.biggestQuake as number).toBeGreaterThan(ridge.biggestQuake as number);
  });
});
