import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@ui/Icon";
import { HS_LABS, HS_SUBJECT_LABEL, type HsLab } from "../curriculum/hsLabs";

/**
 * Higher Secondary — the Class 11–12 suite (JEE Main, JEE Advanced, NEET UG).
 *
 * These labs run on the Smart Lab engine (repository-root smartlab/), which
 * the site ships at smartlab/index.html. This page is their front door: a
 * catalogue by subject and chapter, and a lab view that frames the engine at
 * full height with ?level=hs so its own rail shows only this suite.
 *
 * The frame and the route follow each other: opening #/hs/<id> sets the
 * frame's hash, and switching labs from the frame's own rail posts a
 * `smartlab:mount` message that moves the route, so the address always names
 * the lab on screen and can be shared.
 */

type SubjectFilter = "all" | HsLab["subject"];
type ClassFilter = "all" | 11 | 12;

const SUBJECTS: HsLab["subject"][] = ["physics", "chemistry", "biology"];

/** Relative to the page, so it resolves under /GradeNextAILab/ on Pages and / in dev. */
function engineUrl(id: string, embed: boolean): string {
  return `smartlab/index.html?level=hs${embed ? "&embed=1" : ""}#${encodeURIComponent(id)}`;
}

export function HigherSecondary(
  { labId, onOpen, onBack, onFollow }: {
    labId?: string;
    onOpen: (id: string) => void;
    onBack: () => void;
    /** The framed engine switched labs itself: move the route, do not reload. */
    onFollow: (id: string) => void;
  },
) {
  const lab = labId ? HS_LABS.find((l) => l.id === labId) : undefined;
  if (labId && lab) return <HsLabView lab={lab} onBack={onBack} onFollow={onFollow} />;
  return <HsCatalogue onOpen={onOpen} missing={labId && !lab ? labId : undefined} />;
}

/* ------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------ */

function HsCatalogue({ onOpen, missing }: { onOpen: (id: string) => void; missing?: string }) {
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [cls, setCls] = useState<ClassFilter>("all");

  const shown = useMemo(
    () => HS_LABS.filter((l) => (subject === "all" || l.subject === subject) && (cls === "all" || l.ncertClass === cls)),
    [subject, cls],
  );
  const chapters = useMemo(() => new Set(HS_LABS.map((l) => l.chapter)).size, []);
  const countIn = (s: HsLab["subject"]) =>
    HS_LABS.filter((l) => l.subject === s && (cls === "all" || l.ncertClass === cls)).length;

  return (
    <div className="hs">
      <header className="hs-hero">
        <p className="lib-eyebrow">Higher Secondary · Class 11–12</p>
        <h1>The JEE &amp; NEET Lab</h1>
        <p className="hs-thesis">
          Forty-two working experiments for Class 11 and 12. Every one integrates the governing
          equations rather than animating a picture, is pitched at JEE Main, JEE Advanced and NEET UG,
          and puts the trap the paper sets within reach of a control — benches you can orbit,
          apparatus you can drag, and exam problems the apparatus itself marks.
        </p>
        <dl className="hs-stats">
          <div><dt>Experiments</dt><dd>{HS_LABS.length}</dd></div>
          <div><dt>Chapters</dt><dd>{chapters}</dd></div>
          <div><dt>Class 11</dt><dd>{HS_LABS.filter((l) => l.ncertClass === 11).length}</dd></div>
          <div><dt>Class 12</dt><dd>{HS_LABS.filter((l) => l.ncertClass === 12).length}</dd></div>
        </dl>
      </header>

      {missing && (
        <p className="hs-missing" role="status">
          There is no experiment called <code>{missing}</code>. It may have been renamed — pick it from the list below.
        </p>
      )}

      <div className="hs-filters">
        <div className="filter-row" role="tablist" aria-label="Subject">
          <button type="button" role="tab" aria-selected={subject === "all"}
            className={`filter ${subject === "all" ? "is-on" : ""}`} onClick={() => setSubject("all")}>
            All subjects
          </button>
          {SUBJECTS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={subject === s}
              className={`filter sub-${s} ${subject === s ? "is-on" : ""}`} onClick={() => setSubject(s)}>
              <span className="hs-dot" aria-hidden="true" />{HS_SUBJECT_LABEL[s]}
              <span className="hs-count">{countIn(s)}</span>
            </button>
          ))}
        </div>
        <div className="filter-row" role="tablist" aria-label="NCERT class">
          {(["all", 11, 12] as const).map((c) => (
            <button key={String(c)} type="button" role="tab" aria-selected={cls === c}
              className={`filter ${cls === c ? "is-on" : ""}`} onClick={() => setCls(c)}>
              {c === "all" ? "Class 11 and 12" : `Class ${c}`}
            </button>
          ))}
        </div>
      </div>

      {SUBJECTS.filter((s) => subject === "all" || subject === s).map((s) => {
        const labs = shown.filter((l) => l.subject === s);
        if (!labs.length) return null;
        const byChapter: [string, HsLab[]][] = [];
        for (const l of labs) {
          const row = byChapter.find(([c]) => c === l.chapter);
          if (row) row[1].push(l); else byChapter.push([l.chapter, [l]]);
        }
        return (
          <section key={s} className={`hs-subject sub-${s}`} aria-labelledby={`hs-${s}`}>
            <h2 id={`hs-${s}`} className="hs-subject-head">
              <span className="hs-dot" aria-hidden="true" />{HS_SUBJECT_LABEL[s]}
              <span className="hs-subject-meta">{labs.length} experiments</span>
            </h2>
            {byChapter.map(([chapter, list]) => (
              <div key={chapter} className="hs-chapter">
                <h3 className="hs-chapter-head">
                  <span>{chapter}</span>
                  <span className="hs-class">Class {list[0].ncertClass}</span>
                </h3>
                <div className="hs-cards">
                  {list.map((l) => <HsCard key={l.id} lab={l} onOpen={onOpen} />)}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function HsCard({ lab, onOpen }: { lab: HsLab; onOpen: (id: string) => void }) {
  const [title, sub] = splitName(lab.name);
  return (
    <button type="button" className={`hs-card sub-${lab.subject}`} onClick={() => onOpen(lab.id)}>
      <span className="hs-card-title">{title}</span>
      {sub && <span className="hs-card-sub">{sub}</span>}
      <span className="hs-card-foot">
        {lab.exams.map((e) => <span key={e} className="hs-exam">{e}</span>)}
        {lab.weight && <span className="hs-weight">{lab.weight}</span>}
      </span>
    </button>
  );
}

/** "Young's Double Slit — Path Difference to Fringe" → title and subtitle.
 *  A subtitle that continues the title in lower case ("the Rayleigh
 *  Criterion") starts a line of its own here, so it takes a capital. */
function splitName(name: string): [string, string] {
  const i = name.indexOf(" — ");
  if (i < 0) return [name, ""];
  const sub = name.slice(i + 3);
  return [name.slice(0, i), sub.charAt(0).toUpperCase() + sub.slice(1)];
}

/* ------------------------------------------------------------------ *
 * One lab, framed
 * ------------------------------------------------------------------ */

function HsLabView({ lab, onBack, onFollow }: { lab: HsLab; onBack: () => void; onFollow: (id: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  // The frame loads once; after that, labs change through its hash so the
  // engine keeps running instead of reloading forty scripts.
  const [src] = useState(() => engineUrl(lab.id, true));

  useEffect(() => {
    const w = frame.current?.contentWindow;
    try {
      if (w && decodeURIComponent(w.location.hash.slice(1)) !== lab.id) w.location.hash = encodeURIComponent(lab.id);
    } catch { /* not loaded yet: the src already names this lab */ }
  }, [lab.id]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; id?: string } | null;
      if (d && d.type === "smartlab:mount" && typeof d.id === "string" && d.id !== lab.id
          && HS_LABS.some((l) => l.id === d.id)) onFollow(d.id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lab.id, onFollow]);

  const [title, sub] = splitName(lab.name);
  return (
    <div className="hs-labview">
      <div className={`hs-labbar sub-${lab.subject}`}>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onBack}>
          <Icon name="arrow-left" size={16} /> Higher Secondary
        </button>
        <div className="hs-labbar-title">
          <strong>{title}</strong>
          <span>{HS_SUBJECT_LABEL[lab.subject]} · {lab.chapter} · Class {lab.ncertClass}{sub ? ` · ${sub}` : ""}</span>
        </div>
        <a className="btn btn-quiet btn-sm" href={engineUrl(lab.id, false)} target="_blank" rel="noopener">
          <Icon name="external" size={16} /> Full screen
        </a>
      </div>
      <iframe
        ref={frame}
        className="hs-frame"
        src={src}
        title={`${lab.name} — Smart Lab`}
        allow="fullscreen"
      />
    </div>
  );
}
