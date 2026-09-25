import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSim } from "@engine/useSim";
import { BAND_LABEL, GRADE_BANDS, defaultParams, paramsForBand } from "@engine/types";
import type { AnySim, DataRow, GradeBand, LabValues, ParamValues, SimMode } from "@engine/types";
import { Stage } from "@ui/Stage";
import { Graph } from "@ui/Graph";
import { Icon } from "@ui/Icon";
import { ParamControl, Presets, Readouts, Segmented, TimeControls } from "@ui/controls";
import { LabPanel, useLab } from "@ui/LabRunner";
import { BAND_SIG_FIGS } from "@engine/types";
import { formatValue } from "@engine/units";
import { addNotebookEntry } from "@ui/notebook";
import { readTheme } from "@ui/theme";
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
    const inputKeys = varyingInputKeys(sim.data);
    const header = ["trial", ...inputKeys, "t", ...keys].join(",");
    const rows = sim.data.map((r, i) => [
      String(r.trial ?? i + 1),
      ...inputKeys.map((k) => String(r.inputs?.[k] ?? "")),
      r.t.toFixed(4),
      ...keys.map((k) => String(r.values[k] ?? "")),
    ].join(","));
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
                <DataTable
                  data={sim.data} readouts={sim.readouts} band={band}
                  params={manifest.params} themeKey={themeKey}
                  onClear={sim.clearData} onExport={exportCsv}
                />
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

/**
 * Which control settings actually changed across the recorded rows.
 *
 * A fair test changes one thing, so the table shows exactly the columns the
 * student's own procedure created: vary the angle and an angle column appears;
 * vary nothing and no input column clutters the readings.
 */
function varyingInputKeys(data: { inputs?: Record<string, number | boolean | string> }[]): string[] {
  const first = data.find((d) => d.inputs)?.inputs;
  if (!first) return [];
  return Object.keys(first).filter((k) => {
    const v0 = first[k];
    return data.some((d) => d.inputs && d.inputs[k] !== v0);
  });
}

function DataTable({ data, readouts, band, params, themeKey, onClear, onExport }: {
  data: DataRow[];
  readouts: { key: string; label: string; unit?: string; bands?: GradeBand[] }[];
  band: GradeBand;
  params: AnySim["params"];
  themeKey: string;
  onClear: () => void;
  onExport: () => void;
}) {
  const cols = readouts.filter((r) => !r.bands || r.bands.includes(band));
  const sig = BAND_SIG_FIGS[band];
  const inputKeys = varyingInputKeys(data);
  const inputLabel = (k: string) => {
    const def = params[k];
    if (!def) return k;
    const unit = "unit" in def && def.unit ? ` (${def.unit})` : "";
    return `${def.label}${unit}`;
  };
  const [plotX, setPlotX] = useState<string>("");
  const [plotY, setPlotY] = useState<string>("");

  if (!data.length) {
    return (
      <div className="data-empty">
        <p>No data yet. Press <strong>Record data</strong> while the experiment runs to build a table.</p>
      </div>
    );
  }

  const xKey = inputKeys.includes(plotX) ? plotX : inputKeys[0];
  const yKey = cols.some((c) => c.key === plotY) ? plotY : cols[0]?.key;

  return (
    <div className="data-wrap">
      <div className="data-actions">
        <button type="button" className="btn btn-sm" onClick={onExport}>Export CSV</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClear}>Clear</button>
        {inputKeys.length > 0 && data.length >= 2 && (
          <span className="trial-plot-picks">
            <label>
              Plot
              <select value={yKey} onChange={(e) => setPlotY(e.target.value)} aria-label="Measured value to plot">
                {cols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </label>
            <label>
              against
              <select value={xKey} onChange={(e) => setPlotX(e.target.value)} aria-label="Input to plot against">
                {inputKeys.map((k) => <option key={k} value={k}>{inputLabel(k)}</option>)}
              </select>
            </label>
          </span>
        )}
      </div>
      <div className="data-body">
        <div className="data-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trial</th>
                {inputKeys.map((k) => <th key={k}>{inputLabel(k)}</th>)}
                <th>t (s)</th>
                {cols.map((c) => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="mono">{row.trial ?? i + 1}</td>
                  {inputKeys.map((k) => (
                    <td className="mono" key={k}>
                      {typeof row.inputs?.[k] === "number"
                        ? formatValue(row.inputs[k] as number, sig)
                        : String(row.inputs?.[k] ?? "—")}
                    </td>
                  ))}
                  <td className="mono">{formatValue(row.t, sig)}</td>
                  {cols.map((c) => <td className="mono" key={c.key}>{formatValue(row.values[c.key] ?? 0, sig)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inputKeys.length > 0 && data.length >= 2 && xKey && yKey && (
          <TrialPlot
            data={data} xKey={xKey} yKey={yKey}
            xLabel={inputLabel(xKey)}
            yLabel={cols.find((c) => c.key === yKey)?.label ?? yKey}
            themeKey={themeKey} sig={sig}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The student's own trials, plotted.
 *
 * This is the graph the experiment loop exists to produce: each recorded run
 * is one point, the thing the student changed runs along the bottom, the thing
 * they measured runs up the side, and after three or four runs the shape of
 * the relationship is standing in their own data. It is deliberately drawn
 * from `data` — the recorded rows — and from nothing else, so every point on
 * it is a measurement somebody actually took.
 */
function TrialPlot({ data, xKey, yKey, xLabel, yLabel, themeKey, sig }: {
  data: DataRow[]; xKey: string; yKey: string;
  xLabel: string; yLabel: string; themeKey: string; sig: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const W = Math.max(220, Math.floor(parent?.clientWidth ?? 260));
    const H = 190;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const theme = readTheme(themeKey);
    ctx.fillStyle = theme.surfaceAlt;
    ctx.fillRect(0, 0, W, H);

    const pts = data
      .map((r) => ({ x: Number(r.inputs?.[xKey]), y: Number(r.values[yKey]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 2) return;

    let x0 = Math.min(...pts.map((p) => p.x)), x1 = Math.max(...pts.map((p) => p.x));
    let y0 = Math.min(...pts.map((p) => p.y)), y1 = Math.max(...pts.map((p) => p.y));
    if (x1 - x0 < 1e-12) { x0 -= 0.5; x1 += 0.5; }
    if (y1 - y0 < 1e-12) { y0 -= 0.5; y1 += 0.5; }
    const padX = (x1 - x0) * 0.08, padY = (y1 - y0) * 0.12;
    x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;

    const L = 46, R = 10, T = 10, B = 34;
    const sx = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
    const sy = (y: number) => H - B - ((y - y0) / (y1 - y0)) * (H - T - B);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.font = '500 10px ui-monospace, monospace';
    ctx.fillStyle = theme.inkSoft;
    for (let i = 0; i <= 3; i++) {
      const gy = T + ((H - T - B) * i) / 3;
      ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(W - R, gy); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(formatValue(y1 - ((y1 - y0) * i) / 3, sig), L - 4, gy);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(formatValue(x0 + padX, sig), sx(x0 + padX), H - B + 14);
    ctx.fillText(formatValue(x1 - padX, sig), sx(x1 - padX), H - B + 14);

    // A faint join in x-order guides the eye along the trend without claiming
    // to be a fit; the points are the data.
    const ordered = [...pts].sort((a, b) => a.x - b.x);
    ctx.strokeStyle = theme.accent + "55";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ordered.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
    ctx.stroke();

    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.strokeStyle = theme.surface;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    ctx.fillStyle = theme.inkSoft;
    ctx.font = '600 10px "Source Sans 3", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(xLabel, L + (W - L - R) / 2, H - 6);
    ctx.save();
    ctx.translate(11, T + (H - T - B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }, [data, xKey, yKey, xLabel, yLabel, themeKey, sig]);

  return (
    <div className="trial-plot" role="img" aria-label={`${yLabel} against ${xLabel}, one point per recorded trial`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

/** A one-line spoken description of the live state, for screen readers. */
function describeSim(title: string, readouts: { label: string; quantity: { value: number } }[], sig: number): string {
  const parts = readouts.slice(0, 4).map((r) => `${r.label} ${formatValue(r.quantity.value, sig)}`);
  return `${title}. ${parts.join(", ")}.`;
}
