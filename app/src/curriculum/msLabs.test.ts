import { describe, expect, it } from "vitest";
import { MS_LABS, msTeaching } from "./msLabs";
import { CURRICULA } from "./index";
import { defs, setupsOf } from "./ms/engine";

/**
 * The Grades 6–8 catalogue (msLabs.ts, assembled from ms/g*.ts) against the engine:
 * see ms/engine.ts for how the engine is loaded. Each unit's model tests live in
 * ms/<unit>.test.ts.
 */

describe("Grades 6–8 catalogue matches the Smart Lab engine", () => {
  it("finds the Grades 6–8 labs the engine registers", () => {
    expect(defs.length).toBeGreaterThanOrEqual(1);
  });

  it("lists exactly the engine's Grades 6–8 labs, in load order", () => {
    expect(MS_LABS.map((l) => l.id)).toEqual(defs.map((d) => d.id));
  });

  for (const lab of MS_LABS) {
    it(`${lab.id}: grade, unit, topics, subject and name agree`, () => {
      const d = defs.find((x) => x.id === lab.id)!;
      expect(d.grade).toBe(lab.grade);
      expect(d.unit).toBe(`${lab.grade}${lab.unit}`);
      expect(d.topics).toEqual(lab.topics);
      expect(d.subject).toBe(lab.subject);
      expect(d.name).toBe(lab.name);
    });

    it(`${lab.id}: every set-up, its label and what it teaches agree`, () => {
      const d = defs.find((x) => x.id === lab.id)!;
      expect(setupsOf(d).map((o) => ({ value: o.value, label: o.label, teaches: o.teaches ?? [] })))
        .toEqual(lab.setups.map((s) => ({ value: s.value, label: s.label, teaches: s.teaches })));
    });
  }
});

describe("Grades 6–8 labs run every set-up without a page", () => {
  for (const d of defs) {
    for (const o of setupsOf(d)) {
      it(`${d.id}/${o.value}: sets up, steps and reports finite numbers`, () => {
        const run = d as unknown as { setup: (S: unknown) => void; step: (S: unknown, dt: number) => void;
          readouts: (S: unknown) => { label: string; value: string }[]; equation?: (S: unknown) => string };
        const S = { p: Object.assign({}, d.params, { setup: o.value }), t: 0, cam: null };
        run.setup(S);
        for (let k = 0; k < 20; k++) run.step(S, 0.05);
        const ro = run.readouts(S);
        expect(ro.length).toBeGreaterThan(0);
        for (const r of ro) expect(String(r.value), r.label).not.toMatch(/NaN|Infinity|undefined/);
        if (run.equation) expect(run.equation(S)).not.toMatch(/NaN|undefined/);
      }, 30_000); // heavy set-ups (the 6A-1 shoal) pass 5 s idle but not on a loaded machine; the checks are unchanged
    }
  }
});

describe("Grades 6–8 labs cover the curriculum they claim", () => {
  for (const lab of MS_LABS) {
    const grade = CURRICULA.find((c) => c.grade === lab.grade)!;
    const unit = grade.units.find((u) => u.code === lab.unit);

    it(`${lab.id}: its unit exists and every code it teaches is a subtopic of a topic it claims`, () => {
      expect(unit, `unit ${lab.unit} of grade ${lab.grade}`).toBeDefined();
      const claimed = unit!.topics.filter((t) => lab.topics.includes(t.code));
      expect(claimed.map((t) => t.code)).toEqual(lab.topics);
      const codes = new Set(claimed.flatMap((t) => t.subtopics.map((s) => s.code)));
      for (const s of lab.setups) {
        expect(s.teaches.length, `${s.value} teaches nothing`).toBeGreaterThan(0);
        for (const c of s.teaches) expect(codes.has(c), `${s.value} teaches ${c}`).toBe(true);
      }
    });

    it(`${lab.id}: it teaches at least one subtopic of every topic it claims`, () => {
      for (const t of unit!.topics.filter((x) => lab.topics.includes(x.code))) {
        const mine = t.subtopics.filter((s) => lab.setups.some((u) => u.teaches.includes(s.code)));
        expect(mine.length, `${lab.id} claims ${t.code} but teaches none of it`).toBeGreaterThan(0);
      }
    });
  }

  /* A topic can be served by more than one lab (A4: Earth's Four Spheres and One Event, Four Spheres).
     Together, the labs that claim a topic must teach every one of its subtopics. */
  const claimed = new Map<string, typeof MS_LABS>();
  for (const lab of MS_LABS) for (const t of lab.topics) {
    const k = `${lab.grade}|${lab.unit}|${t}`;
    claimed.set(k, [...(claimed.get(k) ?? []), lab]);
  }
  for (const [k, labs] of claimed) {
    const [grade, unitCode, topic] = k.split("|");
    it(`grade ${grade} topic ${topic}: every subtopic is taught by a set-up of a lab that claims it (${labs.map((l) => l.id).join(", ")})`, () => {
      const unit = CURRICULA.find((c) => c.grade === Number(grade))!.units.find((u) => u.code === unitCode)!;
      const t = unit.topics.find((x) => x.code === topic)!;
      for (const s of t.subtopics) {
        // Through the same lookup the Library page uses, so the page finds a lab for every subtopic.
        expect(msTeaching(Number(grade), s.code).some((m) => labs.includes(m.lab)), `${s.code} ${s.title}`).toBe(true);
      }
    });
  }
});
