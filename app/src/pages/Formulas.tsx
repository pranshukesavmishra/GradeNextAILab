import { useMemo, useState } from "react";
import { Icon } from "@ui/Icon";
import { FORMULA_GROUPS } from "../formulas";
import type { Formula } from "../formulas/types";

const GRADES = [6, 7, 8];

/**
 * The Formula Lab.
 *
 * A formula on its own is a string to memorise. Here each one leads with the
 * relationship in words, spells out what every symbol means and its unit,
 * shows a worked example the student can read straight through, carries the
 * caution a teacher would add, and links to the simulation where the student
 * can watch it behave.
 */
export function Formulas({ onOpenSim }: { onOpenSim: (id: string) => void }) {
  const [grade, setGrade] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string>("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FORMULA_GROUPS
      .map((g) => ({
        ...g,
        formulas: g.formulas.filter((f) => {
          if (grade !== "all" && !f.grades.includes(grade)) return false;
          if (!q) return true;
          return [f.name, f.expression, ...f.symbols.map((s) => `${s.sym} ${s.means}`), ...f.topics]
            .join(" ").toLowerCase().includes(q);
        }),
      }))
      .filter((g) => g.formulas.length > 0);
  }, [grade, query]);

  const total = groups.reduce((n, g) => n + g.formulas.length, 0);

  return (
    <div className="page formulas">
      <header className="page-head">
        <p className="eyebrow">Reference</p>
        <h1>Formula Lab</h1>
        <p className="page-sub">
          Every relationship the Grade 6–8 science curriculum asks a student to use — what each
          symbol means, the units it carries, a worked example, and the simulation where you can
          watch it behave.
        </p>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <Icon name="search" size={16} className="search-icon" />
          <input
            className="search"
            type="search"
            placeholder="Search a quantity, symbol or topic…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search formulas"
          />
        </div>
        <div className="seg-group" role="group" aria-label="Grade">
          <button
            type="button"
            className={`seg-btn${grade === "all" ? " is-on" : ""}`}
            onClick={() => setGrade("all")}
          >
            All grades
          </button>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`seg-btn${grade === g ? " is-on" : ""}`}
              onClick={() => setGrade(g)}
            >
              Grade {g}
            </button>
          ))}
        </div>
        <p className="toolbar-count">{total} formulas</p>
      </div>

      {groups.map((g) => (
        <section key={g.id} className={`fx-group sub-${g.subject}`}>
          <div className="fx-group-head">
            <h2>{g.title}</h2>
            <p>{g.blurb}</p>
          </div>
          <div className="fx-grid">
            {g.formulas.map((f) => (
              <FormulaCard
                key={f.id}
                f={f}
                open={open === f.id}
                onToggle={() => setOpen((o) => (o === f.id ? "" : f.id))}
                onOpenSim={onOpenSim}
              />
            ))}
          </div>
        </section>
      ))}

      {total === 0 && (
        <p className="empty">No formula matches that. Try a quantity like “speed” or a symbol like “λ”.</p>
      )}
    </div>
  );
}

function FormulaCard(
  { f, open, onToggle, onOpenSim }: {
    f: Formula; open: boolean; onToggle: () => void; onOpenSim: (id: string) => void;
  },
) {
  return (
    <article className={`fx-card${open ? " is-open" : ""}`}>
      <button type="button" className="fx-card-head" onClick={onToggle} aria-expanded={open}>
        <span className="fx-expr">{f.expression}</span>
        <span className="fx-name">{f.name}</span>
        <Icon name="chevron-down" size={16} className="fx-chev" />
      </button>

      {open && (
        <div className="fx-body">
          <dl className="fx-symbols">
            {f.symbols.map((s) => (
              <div key={s.sym} className="fx-sym">
                <dt>{s.sym}</dt>
                <dd>
                  {s.means}
                  {s.unit ? <span className="fx-unit">{s.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>

          {f.rearranged?.length ? (
            <p className="fx-rearranged">
              <span className="fx-label">Rearranged</span>
              {f.rearranged.map((r) => <code key={r}>{r}</code>)}
            </p>
          ) : null}

          {f.example ? (
            <div className="fx-example">
              <span className="fx-label">Worked example</span>
              <p className="fx-setup">{f.example.setup}</p>
              <p className="fx-working">
                <code>{f.example.working}</code>
                <Icon name="chevron-right" size={13} />
                <strong>{f.example.answer}</strong>
              </p>
            </div>
          ) : null}

          {f.note ? (
            <p className="fx-note">
              <Icon name="info" size={14} />
              {f.note}
            </p>
          ) : null}

          <footer className="fx-foot">
            <span className="fx-topics">
              {f.topics.map((t) => <span key={t} className="fx-topic">{t}</span>)}
            </span>
            {f.sims?.length ? (
              <span className="fx-sims">
                {f.sims.map((id) => (
                  <button key={id} type="button" className="fx-simlink" onClick={() => onOpenSim(id)}>
                    <Icon name="explore" size={13} />
                    Watch it work
                  </button>
                ))}
              </span>
            ) : null}
          </footer>
        </div>
      )}
    </article>
  );
}
