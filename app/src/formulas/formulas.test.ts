import { describe, expect, it } from "vitest";
import { ALL_FORMULAS, FORMULA_GROUPS } from "./index";
import { SIMS } from "@sims/registry";
import { CURRICULA } from "../curriculum";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * The characters a symbol may be built from: Latin letters, Greek letters
 * (Δ, ρ, λ, π, θ, Ω), the combining macron in v̄, subscript digits and
 * subscript letters (N₀, Fₙₑₜ, Eᵢₙ), and the superscript n used for an
 * exponent. Digits, superscript digits, operators and punctuation are
 * deliberately excluded, so "½ × m × v²" yields the tokens m and v, and
 * "6CO₂" yields CO₂.
 */
const SYMBOL_CHARS =
  "A-Za-z\\u0304\\u0391-\\u03A9\\u03B1-\\u03C9\\u1D62-\\u1D6A\\u2080-\\u2089\\u2090-\\u209C\\u207F";

function symbolTokens(text: string): string[] {
  return text.match(new RegExp(`[${SYMBOL_CHARS}]+`, "gu")) ?? [];
}

/** Every number in a string, accepting the unicode minus as well as the hyphen. */
function numbersIn(text: string): number[] {
  const found = text.match(/[-−]?\d+(?:\.\d+)?/g) ?? [];
  return found.map((s) => Number(s.replace("−", "-")));
}

const SIM_IDS = new Set(SIMS.map((s) => s.id));

/** Every curriculum topic code in "G8·A2" form. */
const TOPIC_CODES = new Set<string>(
  CURRICULA.flatMap((c) =>
    c.units.flatMap((u) => u.topics.map((t) => `G${c.grade}·${t.code}`)),
  ),
);

/* ------------------------------------------------------------------ *
 * Structure
 * ------------------------------------------------------------------ */

describe("formula lab structure", () => {
  it("has groups, each with a title, a blurb and formulas", () => {
    expect(FORMULA_GROUPS.length).toBeGreaterThan(5);
    for (const g of FORMULA_GROUPS) {
      expect(g.id, g.title).toBeTruthy();
      expect(g.title, g.id).toBeTruthy();
      expect(g.blurb.length, g.id).toBeGreaterThan(20);
      expect(g.formulas.length, g.id).toBeGreaterThan(0);
    }
  });

  it("gives every formula a unique id", () => {
    const seen = new Map<string, string>();
    for (const g of FORMULA_GROUPS) {
      for (const f of g.formulas) {
        expect(seen.has(f.id), `duplicate formula id ${f.id}`).toBe(false);
        seen.set(f.id, g.id);
      }
    }
    expect(seen.size).toBe(ALL_FORMULAS.length);
  });

  it("gives every group a unique id", () => {
    const ids = FORMULA_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leads every name with the relationship in words, not the symbols", () => {
    for (const f of ALL_FORMULAS) {
      // A name that is only an equation would be short and contain "=".
      expect(f.name.length, f.id).toBeGreaterThan(20);
      expect(f.name.includes("="), f.id).toBe(false);
      expect(f.expression.length, f.id).toBeGreaterThan(2);
    }
  });

  it("places every formula in grades 6 to 8", () => {
    for (const f of ALL_FORMULAS) {
      expect(f.grades.length, f.id).toBeGreaterThan(0);
      for (const grade of f.grades) expect([6, 7, 8], f.id).toContain(grade);
    }
  });

  it("carries the teacher's caution on every formula", () => {
    for (const f of ALL_FORMULAS) {
      expect(f.note, f.id).toBeTruthy();
      expect(f.note!.length, f.id).toBeGreaterThan(40);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Symbols
 * ------------------------------------------------------------------ */

describe("symbols", () => {
  it("declares every symbol that appears in an expression", () => {
    for (const f of ALL_FORMULAS) {
      const declared = new Set(f.symbols.flatMap((s) => symbolTokens(s.sym)));
      for (const token of symbolTokens(f.expression)) {
        expect(
          declared.has(token),
          `${f.id}: "${token}" appears in "${f.expression}" but is not declared in symbols`,
        ).toBe(true);
      }
    }
  });

  it("uses every declared symbol in the expression or a rearrangement", () => {
    for (const f of ALL_FORMULAS) {
      const written = [f.expression, ...(f.rearranged ?? [])].join(" ");
      for (const s of f.symbols) {
        expect(
          written.includes(s.sym),
          `${f.id}: declares "${s.sym}" but never writes it`,
        ).toBe(true);
      }
    }
  });

  it("says what every symbol means", () => {
    for (const f of ALL_FORMULAS) {
      expect(f.symbols.length, f.id).toBeGreaterThan(0);
      for (const s of f.symbols) {
        expect(s.sym.length, f.id).toBeGreaterThan(0);
        expect(s.means.length, `${f.id}: ${s.sym}`).toBeGreaterThan(3);
      }
    }
  });

  it("declares each symbol only once per formula", () => {
    for (const f of ALL_FORMULAS) {
      const syms = f.symbols.map((s) => s.sym);
      expect(new Set(syms).size, f.id).toBe(syms.length);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Links out — simulations and curriculum
 * ------------------------------------------------------------------ */

describe("links", () => {
  it("only links to simulation ids that exist in the registry", () => {
    for (const f of ALL_FORMULAS) {
      for (const id of f.sims ?? []) {
        expect(SIM_IDS.has(id), `${f.id}: no such simulation "${id}"`).toBe(true);
      }
    }
  });

  it("names at least one real curriculum topic code on every formula", () => {
    for (const f of ALL_FORMULAS) {
      expect(f.topics.length, f.id).toBeGreaterThan(0);
      for (const code of f.topics) {
        expect(TOPIC_CODES.has(code), `${f.id}: no such topic "${code}"`).toBe(true);
      }
    }
  });

  it("agrees with itself about which grades a topic belongs to", () => {
    const problems: string[] = [];
    for (const f of ALL_FORMULAS) {
      for (const code of f.topics) {
        const grade = Number(code.slice(1, 2));
        if (!f.grades.includes(grade)) {
          problems.push(`${f.id} cites ${code} but is not listed for Grade ${grade}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Worked examples
 *
 * Each entry recomputes the answer from the numbers written in the
 * example's own working, so a typo in either half fails the test.
 * ------------------------------------------------------------------ */

type Check = (n: number[]) => number;

const NUMERIC_CHECKS: Record<string, Check> = {
  // Motion
  "motion.speed": ([d, t]) => d / t,
  "motion.average-speed": ([d1, d2, t1, t2, t3]) => (d1 + d2) / (t1 + t2 + t3),
  "motion.velocity": ([d1, d2, t1, t2]) => (d1 - d2) / (t1 + t2),
  "motion.relative-speed": ([a, b]) => a - b,
  "motion.acceleration": ([v, u, t]) => (v - u) / t,
  "motion.final-velocity": ([u, a, t]) => u + a * t,
  "motion.distance-time-gradient": ([d2, d1, t2, t1]) => (d2 - d1) / (t2 - t1),
  "motion.velocity-time-gradient": ([v2, v1, t2, t1]) => (v2 - v1) / (t2 - t1),
  "motion.area-under-velocity-time": ([u, v, t]) => 0.5 * (u + v) * t,

  // Forces
  "forces.resultant": ([a, b]) => a - b,
  "forces.newton-second": ([f, m]) => f / m,
  "forces.weight": ([m, g]) => m * g,
  "forces.momentum": ([m, v]) => m * v,
  "forces.momentum-conservation": ([m1, u1, m2, u2, mt]) => (m1 * u1 + m2 * u2) / mt,
  "forces.pressure": ([f, a]) => f / a,
  "forces.field-strength": ([w, m]) => w / m,
  "forces.gravitation": (n) => n[2] / n[3],
  "forces.electric": (n) => n[2] * n[3],
  "forces.electromagnet": ([after, before]) => after / before,

  // Energy
  "energy.kinetic": ([m, v]) => 0.5 * m * v * v,
  "energy.gravitational-potential": ([m, g, h]) => m * g * h,
  "energy.elastic-potential": ([k, x]) => 0.5 * k * x * x,
  "energy.conservation": ([m, g, h]) => m * g * h,
  "energy.speed-from-drop": ([two, g, h]) => Math.sqrt(two * g * h),
  "energy.work": ([f, d]) => f * d,
  "energy.power": ([w, t]) => w / t,
  "energy.efficiency": ([out, total, hundred]) => (out / total) * hundred,
  "energy.pendulum-period": ([two, pi, l, g]) => two * pi * Math.sqrt(l / g),

  // Waves
  "waves.wave-speed": ([f, lambda]) => f * lambda,
  "waves.frequency-period": ([one, t]) => one / t,
  "waves.frequency-count": ([n, t]) => n / t,
  "waves.light-speed": (n) => n[0] / n[2],
  "waves.echo-distance": ([v, t, two]) => (v * t) / two,
  "waves.amplitude-energy": ([a]) => a * a,
  "waves.digital-codes": ([base, bits]) => base ** bits,

  // Electricity
  "elec.ohm": ([v, r]) => v / r,
  "elec.charge": ([i, t]) => i * t,
  "elec.power": ([v, i]) => v * i,
  "elec.series-resistance": ([r1, r2]) => r1 + r2,
  "elec.parallel-current": ([i1, i2]) => i1 + i2,

  // Matter
  "matter.density": ([m, v]) => m / v,
  "matter.boyle": ([p1, v1, v2]) => (p1 * v1) / v2,
  "matter.charles": ([v1, t2, t1]) => v1 * (t2 / t1),
  "matter.mass-number": ([z, n]) => z + n,
  "matter.percent-composition": ([el, cmp, hundred]) => (el / cmp) * hundred,
  "matter.formula-mass": ([n1, a1, n2, a2]) => n1 * a1 + n2 * a2,
  "matter.atom-count": ([coeff, sub]) => coeff * sub,

  // Heat
  "heat.temperature-change": ([t2, t1]) => t2 - t1,
  "heat.specific-heat": ([m, c, dT]) => m * c * dT,
  "heat.latent": ([m, l]) => m * l,
  "heat.equilibrium": ([q, m, c]) => q / (m * c),
  "heat.celsius-kelvin": ([theta, offset]) => theta + offset,
  "heat.celsius-fahrenheit": ([theta, nine, five, thirtyTwo]) =>
    (theta * nine) / five + thirtyTwo,

  // Chemical change
  "chem.conservation-mass": ([a, b]) => a + b,
  "chem.open-container": ([before, gas]) => before - gas,
  "chem.energy-released": ([m, c, dT]) => m * c * dT,

  // Earth and space
  "earth.astronomical-unit": ([km, au]) => km / au,
  "earth.light-travel-time": ([d, c]) => d / c,
  "earth.orbital-period": ([a, b, c]) => Math.sqrt(a * b * c),
  "earth.synodic-month": (n) => 1 / (1 / n[2] - 1 / n[4]),
  "earth.half-life": (n) => n[0] / n[1] ** (n[2] / n[3]),
  "earth.fraction-remaining": ([one, base, n]) => one / base ** n,
  "earth.radiometric-age": ([n, halfLife]) => n * halfLife,
  "earth.spreading-rate": ([d, t]) => d / t,
  "earth.plate-motion": ([d, t]) => d / t,
  "earth.albedo": ([reflected, incoming]) => reflected / incoming,
  "earth.energy-balance": ([inbound, outbound]) => inbound - outbound,
  "earth.lapse-rate": ([rate, h]) => rate * h,
  "earth.relative-humidity": ([actual, max, hundred]) => (actual / max) * hundred,
  "earth.residence-time": ([stored, flow]) => stored / flow,
  "earth.magnitude-scale": (n) => n[0] ** (n[1] - n[2]),

  // Life
  "life.trophic-transfer": ([available, share]) => available * share,
  "life.population-growth": ([births, arrivals, deaths, departures]) =>
    births + arrivals - (deaths + departures),
  "life.percent-growth": ([change, n, hundred]) => (change / n) * hundred,
  "life.human-impact": ([people, each]) => people * each,
  "life.magnification": ([eyepiece, objective]) => eyepiece * objective,
  "life.actual-size": ([image, m]) => image / m,
  "life.surface-area-volume": ([six, s]) => six / s,
  "life.cardiac-output": ([rate, stroke]) => rate * stroke,
  "life.punnett-probability": ([matching, total]) => matching / total,

  // Maths toolkit
  "math.mean": (n) => (n[0] + n[1] + n[2] + n[3]) / n[4],
  "math.percent-of": ([percent, hundred, whole]) => (percent / hundred) * whole,
  "math.percent-change": ([v2, v1, v1again, hundred]) => ((v2 - v1) / v1again) * hundred,
  "math.percent-error": ([measured, accepted, again, hundred]) =>
    Math.abs(((measured - accepted) / again) * hundred),
  "math.ratio-proportion": ([a, d, b]) => (a * d) / b,
  "math.slope": ([y2, y1, x2, x1]) => (y2 - y1) / (x2 - x1),
  "math.rate": ([change, t]) => change / t,
  "math.unit-conversion": ([v, m, d]) => (v * m) / d,
  "math.area-rectangle": ([l, w]) => l * w,
  "math.volume-box": ([l, w, h]) => l * w * h,
  "math.circle-circumference": ([two, pi, r]) => two * pi * r,
  "math.circle-area": ([pi, r]) => pi * r * r,
  "math.cylinder-volume": ([pi, r, h]) => pi * r * r * h,
  "math.sphere-volume": ([four, three, pi, r]) => (four / three) * pi * r ** 3,
  "math.scale-factor": ([real, factor]) => real / factor,
};

describe("worked examples", () => {
  it("gives every example a setup, working and an answer", () => {
    for (const f of ALL_FORMULAS) {
      if (!f.example) continue;
      expect(f.example.setup.length, f.id).toBeGreaterThan(15);
      expect(f.example.working.length, f.id).toBeGreaterThan(5);
      expect(f.example.answer.length, f.id).toBeGreaterThan(0);
    }
  });

  it("recomputes to the stated answer wherever the example is checkable", () => {
    for (const f of ALL_FORMULAS) {
      const check = NUMERIC_CHECKS[f.id];
      if (!check) continue;
      expect(f.example, `${f.id} has a numeric check but no example`).toBeDefined();

      const inputs = numbersIn(f.example!.working);
      const stated = numbersIn(f.example!.answer)[0];
      expect(stated, `${f.id}: no number in the answer to check against`).toBeDefined();

      const computed = check(inputs);
      expect(Number.isFinite(computed), `${f.id}: check produced ${computed}`).toBe(true);

      const tolerance = Math.max(Math.abs(computed) * 0.01, 1e-9);
      expect(
        Math.abs(computed - stated) <= tolerance,
        `${f.id}: working gives ${computed} but the answer says ${stated}`,
      ).toBe(true);
    }
  });

  it("checks the numbers on most of the quantitative formulas", () => {
    const checkable = ALL_FORMULAS.filter((f) => NUMERIC_CHECKS[f.id]);
    expect(checkable.length).toBeGreaterThan(ALL_FORMULAS.length * 0.75);
  });
});

/* ------------------------------------------------------------------ *
 * House style
 * ------------------------------------------------------------------ */

describe("house style", () => {
  const EMOJI =
    /[\u{1F000}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

  it("contains no emoji anywhere", () => {
    for (const g of FORMULA_GROUPS) {
      const text = JSON.stringify(g);
      const hit = text.match(EMOJI);
      expect(hit, `${g.id} contains the emoji ${hit?.[0]}`).toBeNull();
    }
  });

  it("uses unicode maths rather than ASCII stand-ins", () => {
    for (const f of ALL_FORMULAS) {
      const written = [f.expression, ...(f.rearranged ?? [])].join(" ");
      expect(written.includes("*"), `${f.id}: uses * instead of ×`).toBe(false);
      expect(written.includes("^"), `${f.id}: uses ^ instead of a superscript`).toBe(false);
      expect(/\\[a-z]+\{/.test(written), `${f.id}: looks like LaTeX`).toBe(false);
      expect(/\bsqrt\b/.test(written), `${f.id}: uses sqrt instead of √`).toBe(false);
    }
  });
});
