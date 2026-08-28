import { useEffect, useState } from "react";
import { clearNotebook, deleteNotebookEntry, loadNotebook, type NotebookEntry } from "@ui/notebook";
import { formatValue } from "@engine/units";

export function Notebook({ onExit }: { onExit: () => void }) {
  const [entries, setEntries] = useState<NotebookEntry[]>(() => loadNotebook());

  useEffect(() => {
    const refresh = () => setEntries(loadNotebook());
    window.addEventListener("gnlab:notebook", refresh);
    return () => window.removeEventListener("gnlab:notebook", refresh);
  }, []);

  return (
    <div className="notebook">
      <header className="nb-head">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onExit}>← Lab</button>
        <h1>My Lab Notebook</h1>
        {entries.length > 0 && (
          <div className="nb-head-actions">
            <button type="button" className="btn btn-sm" onClick={() => window.print()}>Print</button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => { if (confirm("Delete every notebook entry? This cannot be undone.")) clearNotebook(); }}
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      {entries.length === 0 ? (
        <div className="nb-empty">
          <p>Your notebook is empty.</p>
          <p className="muted-text">
            Finish a Guided Lab and choose <strong>Save to Lab Notebook</strong>, and your setup,
            your data, and what you wrote will land here.
          </p>
        </div>
      ) : (
        <div className="nb-list">
          {entries.map((e) => (
            <article className="nb-entry" key={e.id}>
              <header className="nb-entry-head">
                <div>
                  <h2>{e.labTitle ?? e.simTitle}</h2>
                  <p className="nb-meta">
                    {e.simTitle} · {e.band} · {new Date(e.when).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={() => deleteNotebookEntry(e.id)}
                  aria-label={`Delete entry for ${e.labTitle ?? e.simTitle}`}
                >
                  Delete
                </button>
              </header>

              {Object.entries(e.writings).filter(([, v]) => v.trim()).length > 0 && (
                <div className="nb-writings">
                  {Object.entries(e.writings)
                    .filter(([, v]) => v.trim())
                    .map(([k, v]) => <p key={k} className="nb-write">{v}</p>)}
                </div>
              )}

              {e.data.length > 0 && (
                <div className="nb-data">
                  <p className="nb-data-h">{e.data.length} recorded measurements</p>
                  <div className="data-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>t (s)</th>
                          {Object.keys(e.data[0].values).slice(0, 6).map((k) => <th key={k}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {e.data.slice(0, 12).map((row, i) => (
                          <tr key={i}>
                            <td className="mono">{i + 1}</td>
                            <td className="mono">{formatValue(row.t, 3)}</td>
                            {Object.keys(e.data[0].values).slice(0, 6).map((k) => (
                              <td className="mono" key={k}>{formatValue(row.values[k] ?? 0, 3)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
