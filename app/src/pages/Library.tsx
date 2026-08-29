import { useMemo, useState } from "react";
import type { GradeBand } from "@engine/types";
import { Icon } from "@ui/Icon";
import { SUBJECT_LABEL } from "@engine/types";
import { getSim } from "@sims/registry";
import {
  CURRICULA, countSubtopics, countTopics, gradeCoverage, unitCoverage,
  type Topic, type Unit,
} from "../curriculum";

interface LibraryProps {
  onOpen: (id: string, band: GradeBand) => void;
  /** Grade to open on; falls back to the first curriculum. */
  initialGrade?: number;
}

/**
 * The Library — the curriculum, in teaching order.
 *
 * The catalog answers "what simulations exist?", which is the question you ask
 * when browsing. This answers the question a teacher actually asks on a Monday
 * morning: "I am teaching Grade 7, Unit B, topic B3 today — what do I open?"
 * Units run in the order they are taught, topics in the order they are taught,
 * and each subtopic carries the simulations that teach it.
 */
export function Library({ onOpen, initialGrade }: LibraryProps) {
  const [grade, setGrade] = useState<number>(initialGrade ?? CURRICULA[0].grade);
  const curriculum = CURRICULA.find((c) => c.grade === grade) ?? CURRICULA[0];
  const [openUnit, setOpenUnit] = useState<string>(curriculum.units[0].code);

  const coverage = useMemo(() => gradeCoverage(curriculum), [curriculum]);

  const pickGrade = (g: number) => {
    setGrade(g);
    const next = CURRICULA.find((c) => c.grade === g);
    if (next) setOpenUnit(next.units[0].code);
  };

  return (
    <div className="library">
      <header className="lib-head">        <div className="lib-title">
          <p className="lib-eyebrow">California Integrated Science</p>
          <h1>Course Library</h1>
          <p className="lib-sub">{curriculum.summary}</p>
        </div>

        <div className="lib-grades" role="tablist" aria-label="Grade">
          {CURRICULA.map((c) => (
            <button
              key={c.grade}
              type="button"
              role="tab"
              aria-selected={c.grade === grade}
              className={`lib-grade ${c.grade === grade ? "is-on" : ""}`}
              onClick={() => pickGrade(c.grade)}
            >
              <span className="lib-grade-n">Grade {c.grade}</span>
              <span className="lib-grade-meta">
                {c.units.length} units · {countTopics(c)} topics
              </span>
            </button>
          ))}
        </div>

        <p className="lib-coverage">
          <strong>{countSubtopics(curriculum)}</strong> subtopics ·{" "}
          <strong>{coverage.covered}</strong> with a simulation attached
          <span className="lib-bar" aria-hidden="true">
            <span style={{ width: `${(100 * coverage.covered) / coverage.total}%` }} />
          </span>
        </p>
      </header>

      <div className="lib-units">
        {curriculum.units.map((unit) => (
          <UnitBlock
            key={unit.code}
            unit={unit}
            grade={curriculum.grade}
            open={openUnit === unit.code}
            onToggle={() => setOpenUnit((u) => (u === unit.code ? "" : unit.code))}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function UnitBlock(
  { unit, grade, open, onToggle, onOpen }: {
    unit: Unit; grade: number; open: boolean; onToggle: () => void;
    onOpen: (id: string, band: GradeBand) => void;
  },
) {
  const cov = unitCoverage(unit);
  return (
    <section className={`lib-unit sub-${unit.subject} ${open ? "is-open" : ""}`}>
      <button type="button" className="lib-unit-head" onClick={onToggle} aria-expanded={open}>
        <span className="lib-unit-code">{unit.code}</span>
        <span className="lib-unit-name">
          <strong>{unit.title}</strong>
          <span className="lib-unit-meta">
            {SUBJECT_LABEL[unit.subject]} · {unit.topics.length} topics · {cov.total} subtopics
          </span>
        </span>
        <span className="lib-unit-cov">{Math.round((100 * cov.covered) / cov.total)}%</span>
        <Icon name="chevron-right" size={18} className="lib-chev" />
      </button>

      {open && (
        <ol className="lib-topics">
          {unit.topics.map((topic) => (
            <TopicRow key={topic.code} topic={topic} grade={grade} onOpen={onOpen} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TopicRow(
  { topic, grade, onOpen }: {
    topic: Topic; grade: number; onOpen: (id: string, band: GradeBand) => void;
  },
) {
  // One button per distinct simulation in the topic, in the order taught.
  const sims = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of topic.subtopics) {
      for (const id of s.sims ?? []) {
        if (!seen.has(id)) { seen.add(id); out.push(id); }
      }
    }
    return out;
  }, [topic]);

  const band: GradeBand = grade <= 5 ? "3-5" : grade <= 8 ? "6-8" : "9-12";

  return (
    <li className="lib-topic">
      <div className="lib-topic-head">
        <span className="lib-topic-code">{topic.code}</span>
        <h3>{topic.title}</h3>
        {topic.standards?.length ? (
          <span className="lib-std">{topic.standards.join(" · ")}</span>
        ) : null}
      </div>

      <ul className="lib-subs">
        {topic.subtopics.map((s) => (
          <li key={s.code} className={s.sims?.length ? "has-sim" : ""}>
            <span className="lib-sub-code">{s.code}</span>
            <span className="lib-sub-title">{s.title}</span>
          </li>
        ))}
      </ul>

      {sims.length > 0 && (
        <div className="lib-simrow">
          {sims.map((id) => {
            const sim = getSim(id);
            if (!sim) return null;
            const useBand = sim.bands.includes(band) ? band : sim.bands[0];
            return (
              <button
                key={id}
                type="button"
                className={`lib-simbtn sub-${sim.subject}`}
                onClick={() => onOpen(id, useBand)}
              >
                <span className="lib-simbtn-title">{sim.title}</span>
                <span className="lib-simbtn-modes">
                  {sim.labs?.length ? (
                    <><Icon name="lab" size={13} />{sim.labs.length}</>
                  ) : null}
                  {sim.challenges?.length ? (
                    <><Icon name="challenge" size={13} />{sim.challenges.length}</>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}
