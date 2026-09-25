import { useEffect, useRef, useState } from "react";
import { Icon } from "@ui/Icon";
import { msLab, msLabUrl, MS_LABS, type MsLab } from "../curriculum/msLabs";

/**
 * One Grades 6–8 Smart Lab experiment, framed.
 *
 * The engine runs in an iframe at full height, opened on the lab and set-up the
 * route names (#/ms/<lab>/<setup>). The route and the frame follow each other:
 * choosing a set-up here moves the frame's hash, and choosing one inside the
 * frame posts `smartlab:setup` (or `smartlab:mount` for another lab), which
 * moves the route without reloading — so the address always names the
 * experiment on screen and can be shared with a class.
 */
export function MiddleSchoolLab(
  { labId, setup, onBack, onPick, onFollow }: {
    labId: string;
    setup?: string;
    /** Back to the Course Library, on this lab's grade. */
    onBack: (grade?: number) => void;
    /** The student chose a set-up from the tabs: a new history step. */
    onPick: (labId: string, setup: string) => void;
    /** The framed engine changed lab or set-up itself: move the route, do not reload. */
    onFollow: (labId: string, setup?: string) => void;
  },
) {
  const lab = msLab(labId);
  if (!lab) {
    return (
      <div className="not-found">
        <h2>That experiment is not here</h2>
        <p>There is no Smart Lab experiment called <code>{labId}</code>. It may have been renamed.</p>
        <button type="button" className="btn btn-primary" onClick={() => onBack()}>Back to the Course Library</button>
      </div>
    );
  }
  return <MsLabView lab={lab} setup={setup} onBack={onBack} onPick={onPick} onFollow={onFollow} />;
}

function MsLabView(
  { lab, setup, onBack, onPick, onFollow }: {
    lab: MsLab; setup?: string;
    onBack: (grade?: number) => void;
    onPick: (labId: string, setup: string) => void;
    onFollow: (labId: string, setup?: string) => void;
  },
) {
  const frame = useRef<HTMLIFrameElement>(null);
  const current = lab.setups.find((s) => s.value === setup) ?? lab.setups[0];
  // The frame loads once; after that the lab and set-up change through its hash,
  // so the engine keeps running instead of reloading its scripts.
  const [src] = useState(() => msLabUrl(lab, current.value, true));

  useEffect(() => {
    const w = frame.current?.contentWindow;
    const want = `${lab.id}/${current.value}`;
    try {
      if (w && decodeURIComponent(w.location.hash.slice(1)) !== want) {
        w.location.hash = `${encodeURIComponent(lab.id)}/${encodeURIComponent(current.value)}`;
      }
    } catch { /* not loaded yet: the src already names this experiment */ }
  }, [lab.id, current.value]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; id?: string; setup?: string } | null;
      if (!d || typeof d.id !== "string") return;
      const other = MS_LABS.find((l) => l.id === d.id);
      if (!other) return;
      if (d.type === "smartlab:setup" && typeof d.setup === "string"
          && (d.id !== lab.id || d.setup !== current.value)
          && other.setups.some((s) => s.value === d.setup)) onFollow(d.id, d.setup);
      else if (d.type === "smartlab:mount" && d.id !== lab.id) onFollow(d.id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lab.id, current.value, onFollow]);

  const [title, sub] = splitName(lab.name);
  return (
    <div className="hs-labview ms-labview">
      <div className={`hs-labbar sub-${lab.subject}`}>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => onBack(lab.grade)}>
          <Icon name="arrow-left" size={16} /> Grade {lab.grade}
        </button>
        <div className="hs-labbar-title">
          <strong>{title}</strong>
          <span>Grade {lab.grade} · Unit {lab.unit} · {lab.topics.join(", ")}{sub ? ` · ${sub}` : ""}</span>
        </div>
        <a className="btn btn-quiet btn-sm" href={msLabUrl(lab, current.value, false)} target="_blank" rel="noopener">
          <Icon name="external" size={16} /> Full screen
        </a>
      </div>
      <nav className="ms-setups" aria-label="Experiments on this apparatus">
        {lab.setups.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`ms-setup ${s.value === current.value ? "is-on" : ""}`}
            aria-current={s.value === current.value ? "true" : undefined}
            onClick={() => onPick(lab.id, s.value)}
          >
            <span className="ms-setup-label">{s.label}</span>
            <span className="ms-setup-codes">{s.teaches.join(" · ")}</span>
          </button>
        ))}
      </nav>
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

/** "The Living Tank — Parts, Boundaries and Flows" → title and subtitle. */
function splitName(name: string): [string, string] {
  const i = name.indexOf(" — ");
  return i < 0 ? [name, ""] : [name.slice(0, i), name.slice(i + 3)];
}
