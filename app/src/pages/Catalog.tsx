import { useMemo, useState } from "react";
import type { AnySim, GradeBand, Subject } from "@engine/types";
import { Icon } from "@ui/Icon";
import { SUBJECT_LABEL } from "@engine/types";
import { SIMS, bandForGrade, filterSims } from "@sims/registry";
import { CURRICULA, countTopics } from "../curriculum";

const SUBJECT_ORDER: Subject[] = ["physics", "chemistry", "biology", "earth", "math", "engineering"];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface CatalogProps {
  onOpen: (id: string, band: GradeBand) => void;
  onOpenNotebook: () => void;
  onOpenLibrary: (grade?: number) => void;
}

export function Catalog({ onOpen, onOpenNotebook, onOpenLibrary }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [grade, setGrade] = useState<number | "all">("all");

  const results = useMemo(
    () => filterSims(SIMS, { query, subject, grade }),
    [query, subject, grade],
  );

  const grouped = useMemo(() => {
    const map = new Map<Subject, AnySim[]>();
    for (const sim of results) {
      const list = map.get(sim.subject) ?? [];
      list.push(sim);
      map.set(sim.subject, list);
    }
    return SUBJECT_ORDER.filter((s) => map.has(s)).map((s) => [s, map.get(s)!] as const);
  }, [results]);

  const openWithBand = (sim: AnySim) => {
    const preferred = grade === "all" ? sim.bands[Math.min(1, sim.bands.length - 1)] : bandForGrade(grade);
    const band = sim.bands.includes(preferred) ? preferred : sim.bands[0];
    onOpen(sim.id, band);
  };

  return (
    <div className="catalog">
      <header className="cat-hero">
        <div className="cat-hero-inner">
          <p className="cat-eyebrow">GradeNext</p>
          <h1>Smart Lab</h1>
          <p className="cat-thesis">
            Every science and math idea from Grade 1 to Grade 12 — something you can see,
            change, and run an experiment on.
          </p>

          <div className="cat-courses">
            <p className="cat-courses-label">Follow your course, in teaching order</p>
            <div className="cat-course-row">
              {CURRICULA.map((c) => (
                <button
                  key={c.grade}
                  type="button"
                  className="cat-course"
                  onClick={() => onOpenLibrary(c.grade)}
                >
                  <span className="cat-course-g">Grade {c.grade}</span>
                  <span className="cat-course-t">{c.units.length} units · {countTopics(c)} topics</span>
                </button>
              ))}
            </div>
          </div>

          <div className="cat-actions">
            <button type="button" className="btn btn-quiet" onClick={() => onOpenLibrary()}>
              <Icon name="library" size={16} /> Course Library
            </button>
            <button type="button" className="btn btn-quiet" onClick={onOpenNotebook}>
              <Icon name="notebook" size={16} /> My Lab Notebook
            </button>
          </div>
        </div>
      </header>

      <div className="cat-filters">
        <input
          className="search"
          type="search"
          placeholder="Search simulations, topics, or standards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search simulations"
        />
        <div className="filter-row" role="group" aria-label="Subject">
          <button
            type="button"
            className={`filter${subject === "all" ? " is-on" : ""}`}
            onClick={() => setSubject("all")}
          >
            All subjects
          </button>
          {SUBJECT_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`filter subject-${s}${subject === s ? " is-on" : ""}`}
              onClick={() => setSubject(s)}
            >
              {SUBJECT_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="filter-row" role="group" aria-label="Grade">
          <button
            type="button"
            className={`filter${grade === "all" ? " is-on" : ""}`}
            onClick={() => setGrade("all")}
          >
            All grades
          </button>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`filter is-grade${grade === g ? " is-on" : ""}`}
              onClick={() => setGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="cat-empty">
          Nothing matches that yet. Try a different subject or clear the search.
        </p>
      ) : (
        grouped.map(([subj, sims]) => (
          <section className="cat-group" key={subj}>
            <h2 className={`cat-group-h subject-${subj}`}>
              {SUBJECT_LABEL[subj]} <span className="cat-count">{sims.length}</span>
            </h2>
            <div className="cat-grid">
              {sims.map((sim) => (
                <article className={`sim-card subject-${sim.subject}`} key={sim.id}>
                  <button type="button" className="sim-card-hit" onClick={() => openWithBand(sim)}>
                    <h3>{sim.title}</h3>
                    <p className="sim-tagline">{sim.tagline}</p>
                    <div className="sim-meta">
                      <span className="sim-grades">
                        Grades {Math.min(...sim.grades)}–{Math.max(...sim.grades)}
                      </span>
                      <span className="sim-modes" aria-label="Available modes">
                        <span title="Explore"><Icon name="explore" size={15} /></span>
                        {sim.labs?.length ? <span title={`${sim.labs.length} guided labs`}><Icon name="lab" size={15} /></span> : null}
                        {sim.challenges?.length ? <span title={`${sim.challenges.length} challenges`}><Icon name="challenge" size={15} /></span> : null}
                      </span>
                    </div>
                    {sim.standards.ngss?.length ? (
                      <p className="sim-std">{sim.standards.ngss.slice(0, 3).join(" · ")}</p>
                    ) : null}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
