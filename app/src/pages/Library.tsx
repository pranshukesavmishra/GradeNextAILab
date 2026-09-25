import { useMemo, useState } from "react";
import type { GradeBand } from "@engine/types";
import { Icon } from "@ui/Icon";
import { SUBJECT_LABEL } from "@engine/types";
import { getSim } from "@sims/registry";
import {
  CURRICULA, countSubtopics, countTopics, gradeCoverage, unitCoverage,
  type Topic, type Unit,
} from "../curriculum";
import { HS_LABS } from "../curriculum/hsLabs";
import { msTeaching, type MsTeaching } from "../curriculum/msLabs";

interface LibraryProps {
  onOpen: (id: string, band: GradeBand) => void;
  /** Grade to open on; falls back to the first curriculum. */
  initialGrade?: number;
  /** Class 11–12 lives on its own page (the Smart Lab engine), not in a curriculum tab. */
  onOpenHS: () => void;
  /** A Grades 6–8 Smart Lab experiment, opened on the set-up that teaches the subtopic. */
  onOpenLab: (labId: string, setup: string) => void;
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
export function Library({ onOpen, initialGrade, onOpenHS, onOpenLab }: LibraryProps) {
  const [grade, setGrade] = useState<number>(initialGrade ?? CURRICULA[0].grade);
  const curriculum = CURRICULA.find((c) => c.grade === grade) ?? CURRICULA[0];
  const [openUnit, setOpenUnit] = useState<string>(curriculum.units[0].code);

  // a subtopic a Smart Lab set-up teaches is covered as surely as one with a simulation
  const taught = useMemo(() => (code: string) => msTeaching(curriculum.grade, code).length > 0, [curriculum]);
  const coverage = useMemo(() => gradeCoverage(curriculum, taught), [curriculum, taught]);

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
          <button type="button" className="lib-grade" onClick={onOpenHS}>
            <span className="lib-grade-n">Class 11–12</span>
            <span className="lib-grade-meta">Higher Secondary · {HS_LABS.length} labs</span>
          </button>
        </div>

        <p className="lib-coverage">
          <strong>{countSubtopics(curriculum)}</strong> subtopics ·{" "}
          <strong>{coverage.covered}</strong> with a simulation or experiment attached
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
            onOpenLab={onOpenLab}
            taught={taught}
          />
        ))}
      </div>
    </div>
  );
}

function UnitBlock(
  { unit, grade, open, onToggle, onOpen, onOpenLab, taught }: {
    unit: Unit; grade: number; open: boolean; onToggle: () => void;
    onOpen: (id: string, band: GradeBand) => void;
    onOpenLab: (labId: string, setup: string) => void;
    taught: (code: string) => boolean;
  },
) {
  const cov = unitCoverage(unit, taught);
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
            <TopicRow key={topic.code} topic={topic} grade={grade} onOpen={onOpen} onOpenLab={onOpenLab} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TopicRow(
  { topic, grade, onOpen, onOpenLab }: {
    topic: Topic; grade: number; onOpen: (id: string, band: GradeBand) => void;
    onOpenLab: (labId: string, setup: string) => void;
  },
) {
  // One button per Smart Lab set-up that teaches any subtopic here, in the order taught.
  const experiments = useMemo(() => {
    const out: (MsTeaching & { codes: string[] })[] = [];
    for (const s of topic.subtopics) {
      for (const m of msTeaching(grade, s.code)) {
        const row = out.find((x) => x.lab.id === m.lab.id && x.setup.value === m.setup.value);
        if (row) row.codes.push(s.code); else out.push({ ...m, codes: [s.code] });
      }
    }
    return out;
  }, [topic, grade]);

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
          <li key={s.code} className={s.sims?.length || msTeaching(grade, s.code).length ? "has-sim" : ""}>
            <span className="lib-sub-code">{s.code}</span>
            <span className="lib-sub-title">{s.title}</span>
          </li>
        ))}
      </ul>

      {experiments.length > 0 && (
        <div className="lib-simrow lib-labrow">
          {experiments.map(({ lab, setup, codes }) => (
            <button
              key={`${lab.id}/${setup.value}`}
              type="button"
              className={`lib-simbtn lib-labbtn sub-${lab.subject}`}
              onClick={() => onOpenLab(lab.id, setup.value)}
            >
              <span className="lib-simbtn-title">{setup.label}</span>
              <span className="lib-simbtn-modes">
                <Icon name="lab" size={13} />{lab.name.split(" — ")[0]} · {codes.join(" · ")}
              </span>
            </button>
          ))}
        </div>
      )}

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
