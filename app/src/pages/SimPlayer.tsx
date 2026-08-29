import { useCallback, useEffect, useMemo, useState } from "react";
import { useSim } from "@engine/useSim";
import { BAND_LABEL, GRADE_BANDS, defaultParams, paramsForBand } from "@engine/types";
import type { AnySim, GradeBand, LabValues, ParamValues, SimMode } from "@engine/types";
import { Stage } from "@ui/Stage";
import { Graph } from "@ui/Graph";
import { Icon } from "@ui/Icon";
import { ParamControl, Presets, Readouts, Segmented, TimeControls } from "@ui/controls";
import { LabPanel, useLab } from "@ui/LabRunner";
import { BAND_SIG_FIGS } from "@engine/types";
import { formatValue } from "@engine/units";
import { addNotebookEntry } from "@ui/notebook";
import { InstrumentLayer, ToolRail, useInstruments } from "@ui/Instruments";
import { decodeShare, encodeShare } from "@ui/share";

interface SimPlayerProps {
  manifest: AnySim;
  band: GradeBand;
  onBand: (b: GradeBand) => void;
  themeKey: string;
  /** Parameter values carried in a shared link, applied on first load. */
  shareQuery?: string;
  onExit: () => void;
}

export function SimPlayer({ manifest, band, onBand, themeKey, shareQuery, onExit }: SimPlayerProps) {
  const sharedParams = useMemo(
    () => (shareQuery ? decodeShare(shareQuery, manifest.params) : null),
    [shareQuery, manifest.params],
  );
  const sim = useSim({
    manifest,
    band,
    initialParams: sharedParams && Object.keys(sharedParams).length
      ? { ...defaultParams(manifest.params), ...sharedParams }
      : undefined,
  });
  const [mode, setMode] = useState<SimMode>("explore");
  const [activeLabId, setActiveLabId] = useState<string | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [plotted, setPlotted] = useState<string[]>([]);
  const [xKey, setXKey] = useState("t");
  const [drawer, setDrawer] = useState<"graph" | "data" | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const instruments = useInstruments();

  const availableLabs = useMemo(
    () => (manifest.labs ?? []).filter((l) => l.bands.includes(band)),
    [manifest.labs, band],
  );
  const availableChallenges = useMemo(
    () => (manifest.challenges ?? []).filter((c) => c.bands.includes(band)),
    [manifest.challenges, band],
  );

  const activeLab = availableLabs.find((l) => l.id === activeLabId) ?? null;
  const activeChallenge = availableChallenges.find((c) => c.id === activeChallengeId) ?? null;

  // Default the plotted series to the first graphable readout.
  useEffect(() => {
    if (plotted.length === 0) {
      const first = sim.readouts.find((r) => r.graphable !== false && (!r.bands || r.bands.includes(band)));
      if (first) setPlotted([first.key]);
    }
  }, [sim.readouts, band, plotted.length]);

  const labValues: LabValues = useMemo(
    () => ({
      readouts: sim.runner.readoutValues(),
      facts: sim.runner.facts(),
      params: sim.params,
      data: sim.data,
      elapsed: sim.runner.time,
    }),
    // Recompute each frame so checkpoints react to the live experiment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.frame, sim.params, sim.data],
  );

  const lab_ = useLab(activeLab, labValues);

  // Challenge evaluation, continuous while the sim runs.
  const [stars, setStars] = useState(0);
  useEffect(() => {
    if (!activeChallenge) { setStars(0); return; }
    let earned = 0;
    try {
      if (activeChallenge.goal.test(labValues)) earned = 1;
      if (earned && activeChallenge.stars?.two?.test(labValues)) earned = 2;
      if (earned >= 2 && activeChallenge.stars?.three?.test(labValues)) earned = 3;
    } catch {
      earned = 0;
    }
    setStars((prev) => Math.max(prev, earned));
  }, [activeChallenge, labValues]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const bandParams = useMemo(() => paramsForBand(manifest.params, band), [manifest.params, band]);
  const visibleOverlays = useMemo(
    () => (manifest.overlays ?? []).filter((o) => !o.bands || o.bands.includes(band)),
    [manifest.overlays, band],
  );

  const enterLab = (id: string) => {
    const lab = availableLabs.find((l) => l.id === id);
    setActiveLabId(id);
    setActiveChallengeId(null);
    setMode("lab");
    if (lab?.setup) sim.setParams({ ...sim.params, ...lab.setup });
    sim.reset();
    sim.clearData();
  };

  const enterChallenge = (id: string) => {
    const ch = availableChallenges.find((c) => c.id === id);
    setActiveChallengeId(id);
    setActiveLabId(null);
    setMode("challenge");
    setStars(0);
    if (ch?.setup) sim.setParams({ ...sim.params, ...ch.setup });
    sim.reset();
  };

  const exitToExplore = () => {
    setMode("explore");
    setActiveLabId(null);
    setActiveChallengeId(null);
  };

  const saveNotebook = useCallback(() => {
    addNotebookEntry({
      simId: manifest.id,
      simTitle: manifest.title,
      labTitle: activeLab?.title,
      band,
      when: Date.now(),
      params: sim.params,
      data: sim.data,
      writings: lab_.progress.writings,
    });
    showToast("Saved to your Lab Notebook");
  }, [manifest, activeLab, band, sim.params, sim.data, lab_.progress.writings, showToast]);

  const shareSetup = useCallback(() => {
    const url = encodeShare(manifest.id, band, sim.params);
    navigator.clipboard?.writeText(url).then(
      () => showToast("Link copied — it opens this exact setup"),
      () => showToast("Copy the link from the address bar"),
    );
  }, [manifest.id, band, sim.params, showToast]);

  const exportCsv = useCallback(() => {
    if (!sim.data.length) { showToast("Record some data points first"); return; }
    const keys = Object.keys(sim.data[0].values);
    const header = ["t", ...keys].join(",");
    const rows = sim.data.map((r) => [r.t.toFixed(4), ...keys.map((k) => String(r.values[k] ?? ""))].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manifest.id}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sim.data, manifest.id, showToast]);

  // Keyboard shortcuts, the ones a teacher at a projector actually wants.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); sim.toggle(); }
      else if (e.key === "r" || e.key === "R") sim.reset();
      else if (e.key === "." ) sim.stepOnce();
      else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sim, onExit]);

  const sig = BAND_SIG_FIGS[band];
  const canLaunch = "target" in manifest.params;

  return (
    <div className="player" data-band={band}>
      <header className="player-bar">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onExit} aria-label="Back to the catalog">
          ← Lab
        </button>
        <div className="player-title">
          <h2>{manifest.title}</h2>
          <p>{manifest.tagline}</p>
        </div>

        <Segmented
          label="Mode"
          value={mode}
          compact
          options={[
            { value: "explore" as SimMode, label: "Explore", icon: "explore" as const },
            ...(availableLabs.length ? [{ value: "lab" as SimMode, label: "Guided Lab", icon: "lab" as const }] : []),
            ...(availableChallenges.length ? [{ value: "challenge" as SimMode, label: "Challenge", icon: "challenge" as const }] : []),
          ]}
          onChange={(m) => {
            setMode(m);
            if (m === "explore") exitToExplore();
            if (m === "lab" && !activeLabId && availableLabs[0]) enterLab(availableLabs[0].id);
            if (m === "challenge" && !activeChallengeId && availableChallenges[0]) enterChallenge(availableChallenges[0].id);
          }}
        />

        <label className="band-picker">
          <span className="visually-hidden">Grade level</span>
          <select value={band} onChange={(e) => onBand(e.target.value as GradeBand)} aria-label="Grade level">
            {GRADE_BANDS.filter((b) => manifest.bands.includes(b)).map((b) => (
              <option key={b} value={b}>{BAND_LABEL[b]}</option>
            ))}
          </select>
        </label>
      </header>

      <div className={`player-body${dockOpen ? "" : " dock-closed"}`}>
        <main className="stage-area">
          <Stage
            manifest={manifest}
            state={sim.runner.getState()}
            params={sim.params}
            band={band}
            overlays={sim.overlays}
            alpha={sim.runner.alpha}
            time={sim.runner.time}
            themeKey={themeKey}
            frame={sim.frame}
            onInput={sim.push}
            ariaDescription={describeSim(manifest.title, sim.readouts, sig)}
          />

          <InstrumentLayer instruments={instruments} simTime={sim.runner.time} band={band} />

          {canLaunch && (
            <button
              type="button"
              className="launch-btn"
              onClick={() => { sim.play(); sim.push({ type: "action", action: "launch" }); }}
            >
              Launch
            </button>
          )}

          <div className="stage-foot">
            <TimeControls
              playing={sim.playing}
              speed={sim.speed}
              time={sim.runner.time}
              band={band}
              onToggle={sim.toggle}
              onStep={sim.stepOnce}
              onReset={() => { sim.reset(); }}
              onSpeed={sim.setSpeed}
            />
            <div className="stage-tools">
              <button type="button" className="btn btn-sm" onClick={sim.recordPoint}>Record data</button>
              <button type="button" className="btn btn-sm" onClick={shareSetup}>Share setup</button>
              <button
                type="button"
                className={`btn btn-sm${drawer === "graph" ? " is-on" : ""}`}
                onClick={() => setDrawer(drawer === "graph" ? null : "graph")}
                aria-pressed={drawer === "graph"}
              >
                Graph
              </button>
              <button
                type="button"
                className={`btn btn-sm${drawer === "data" ? " is-on" : ""}`}
                onClick={() => setDrawer(drawer === "data" ? null : "data")}
                aria-pressed={drawer === "data"}
              >
                Data {sim.data.length ? `(${sim.data.length})` : ""}
              </button>
            </div>
          </div>

          <ToolRail
            band={band}
            onAdd={instruments.add}
            hasAny={instruments.items.length > 0}
            onClear={instruments.clear}
          />

          <Readouts readouts={sim.readouts} band={band} />

          {drawer && (
            <section className="drawer" aria-label={drawer === "graph" ? "Graph" : "Data table"}>
              {drawer === "graph" ? (
                <Graph
                  series={sim.series}
                  readouts={sim.readouts}
                  band={band}
                  themeKey={themeKey}
                  plotted={plotted}
                  onTogglePlot={(k) => setPlotted((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))}
                  xKey={xKey}
                  onXKey={setXKey}
                  frame={sim.frame}
                />
              ) : (
                <DataTable data={sim.data} readouts={sim.readouts} band={band} onClear={sim.clearData} onExport={exportCsv} />
              )}
            </section>
          )}
        </main>

        <aside className="dock" aria-label="Controls">
          <button
            type="button"
            className="dock-toggle"
            onClick={() => setDockOpen((v) => !v)}
            aria-expanded={dockOpen}
          >
            <Icon name={dockOpen ? "chevron-right" : "chevron-left"} size={16} />
          </button>

          <div className="dock-inner">
            {mode === "lab" && activeLab && (
              <>
                {availableLabs.length > 1 && (
                  <select
                    className="lab-select"
                    value={activeLab.id}
                    onChange={(e) => enterLab(e.target.value)}
                    aria-label="Choose a lab"
                  >
                    {availableLabs.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                )}
                <LabPanel
                  lab={activeLab}
                  lab_={lab_}
                  values={labValues}
                  onApplySetup={(v: ParamValues) => sim.setParams({ ...sim.params, ...v })}
                  onExit={exitToExplore}
                  onSaveToNotebook={saveNotebook}
                />
              </>
            )}

            {mode === "challenge" && activeChallenge && (
              <div className="challenge-panel">
                {availableChallenges.length > 1 && (
                  <select
                    className="lab-select"
                    value={activeChallenge.id}
                    onChange={(e) => enterChallenge(e.target.value)}
                    aria-label="Choose a challenge"
                  >
                    {availableChallenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
                <h3 className="lab-title">{activeChallenge.title}</h3>
                <p className="lab-instruction">{activeChallenge.brief}</p>
                <div className="stars" aria-label={`${stars} of 3 stars earned`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`star${stars >= n ? " is-on" : ""}`} aria-hidden="true">★</span>
                  ))}
                </div>
                {stars > 0 && <p className="challenge-win">Goal met. Can you do better?</p>}
                {activeChallenge.hints?.length ? (
                  <details className="challenge-hints">
                    <summary>Stuck?</summary>
                    {activeChallenge.hints.map((h, i) => <p className="hint" key={i}>{h}</p>)}
                  </details>
                ) : null}
                <button type="button" className="btn btn-quiet btn-sm" onClick={exitToExplore}>Exit challenge</button>
              </div>
            )}

            <section className="dock-section">
              <h3 className="dock-h">Controls</h3>
              {bandParams.map(([name, spec]) => (
                <ParamControl
                  key={name}
                  name={name}
                  spec={spec}
                  value={sim.params[name]}
                  band={band}
                  onChange={sim.setParam}
                />
              ))}
              <Presets
                presets={[]}
                onApply={(v) => sim.setParams({ ...sim.params, ...v })}
              />
              <button type="button" className="btn btn-quiet btn-sm" onClick={sim.resetParams}>
                Reset controls
              </button>
            </section>

            {visibleOverlays.length > 0 && (
              <section className="dock-section">
                <h3 className="dock-h">Show</h3>
                <div className="overlay-chips">
                  {visibleOverlays.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      className={`chip${sim.overlays[o.key] ? " is-on" : ""}`}
                      aria-pressed={Boolean(sim.overlays[o.key])}
                      onClick={() => sim.toggleOverlay(o.key)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {band === "9-12" && (
              <section className="dock-section">
                <h3 className="dock-h">Realism</h3>
                <label className="messy">
                  <span>Measurement noise</span>
                  <input
                    type="range" min={0} max={1} step={0.1}
                    value={sim.messiness}
                    onChange={(e) => sim.setMessiness(Number(e.target.value))}
                  />
                </label>
                <p className="dock-note">
                  Turn this up to practise with imperfect data, the way a real lab behaves.
                </p>
              </section>
            )}

            <section className="dock-section">
              <h3 className="dock-h">About this sim</h3>
              <ul className="goal-list">
                {manifest.learningGoals.map((g) => <li key={g}>{g}</li>)}
              </ul>
              {manifest.standards.ngss?.length ? (
                <p className="std-tags">
                  {manifest.standards.ngss.map((s) => <span key={s} className="std">{s}</span>)}
                </p>
              ) : null}
            </section>
          </div>
        </aside>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function DataTable({ data, readouts, band, onClear, onExport }: {
  data: { t: number; values: Record<string, number> }[];
  readouts: { key: string; label: string; bands?: GradeBand[] }[];
  band: GradeBand;
  onClear: () => void;
  onExport: () => void;
}) {
  const cols = readouts.filter((r) => !r.bands || r.bands.includes(band));
  const sig = BAND_SIG_FIGS[band];
  if (!data.length) {
    return (
      <div className="data-empty">
        <p>No data yet. Press <strong>Record data</strong> while the experiment runs to build a table.</p>
      </div>
    );
  }
  return (
    <div className="data-wrap">
      <div className="data-actions">
        <button type="button" className="btn btn-sm" onClick={onExport}>Export CSV</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClear}>Clear</button>
      </div>
      <div className="data-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>t (s)</th>
              {cols.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="mono">{i + 1}</td>
                <td className="mono">{formatValue(row.t, sig)}</td>
                {cols.map((c) => <td className="mono" key={c.key}>{formatValue(row.values[c.key] ?? 0, sig)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A one-line spoken description of the live state, for screen readers. */
function describeSim(title: string, readouts: { label: string; quantity: { value: number } }[], sig: number): string {
  const parts = readouts.slice(0, 4).map((r) => `${r.label} ${formatValue(r.quantity.value, sig)}`);
  return `${title}. ${parts.join(", ")}.`;
}
