import { useEffect, useMemo, useRef, useState } from "react";
import type { DataRow, GradeBand, Readout } from "@engine/types";
import { BAND_SIG_FIGS } from "@engine/types";
import { formatValue } from "@engine/units";
import { readTheme } from "./theme";

interface GraphProps {
  series: DataRow[];
  readouts: Readout[];
  band: GradeBand;
  themeKey: string;
  /** Readout keys currently plotted. */
  plotted: string[];
  onTogglePlot: (key: string) => void;
  /** x-axis source: "t" for time, or another readout key for XY plots. */
  xKey: string;
  onXKey: (key: string) => void;
  frame: number;
}

const PAD = { left: 56, right: 14, top: 14, bottom: 30 };

/**
 * Axis ticks a student can actually read: steps of 1, 2, or 5 times a power of
 * ten, so labels land on round numbers instead of arbitrary slices of the data
 * range.
 */
function niceTicks(min: number, max: number, target = 5): { values: number[]; decimals: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { values: [min], decimals: 0 };
  }
  const rawStep = (max - min) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const first = Math.ceil(min / step) * step;
  const values: number[] = [];
  for (let v = first; v <= max + step * 1e-6; v += step) {
    // Kill floating-point dust like 0.30000000000000004.
    values.push(Number(v.toPrecision(12)));
  }
  // Label precision follows the step, so a step of 5 prints "10", not "10.00".
  const decimals = Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));
  return { values: values.length ? values : [min, max], decimals };
}

/**
 * Series colour: the quantity's semantic colour when it is unambiguous, and a
 * distinct fallback when two plotted series share one (height and distance are
 * both lengths, but a reader still has to tell the two lines apart).
 */
function seriesColors(
  keys: string[],
  meta: { key: string; semantic?: string }[],
  theme: { sci: Record<string, string>; accent: string; ink: string },
): Record<string, string> {
  const fallback = [
    theme.sci["velocity"], theme.sci["acceleration"], theme.sci["energy-kinetic"],
    theme.sci["field"], theme.sci["acid"], theme.sci["current"],
  ];
  const used = new Set<string>();
  const out: Record<string, string> = {};
  let fi = 0;
  for (const key of keys) {
    const semantic = meta.find((m) => m.key === key)?.semantic;
    const preferred = semantic ? theme.sci[semantic] : undefined;
    if (preferred && !used.has(preferred)) {
      out[key] = preferred;
      used.add(preferred);
    } else {
      let candidate = fallback[fi++ % fallback.length];
      let guard = 0;
      while (used.has(candidate) && guard++ < fallback.length) {
        candidate = fallback[fi++ % fallback.length];
      }
      out[key] = candidate ?? theme.accent;
      used.add(out[key]);
    }
  }
  return out;
}

/**
 * Live experiment graphing.
 *
 * Drawn on canvas rather than SVG: a student can stream a thousand samples
 * while dragging a slider, and React would choke re-rendering that as elements.
 */
export function Graph(props: GraphProps) {
  const { series, readouts, band, themeKey, plotted, onTogglePlot, xKey, onXKey, frame } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [hover, setHover] = useState<{ x: number; row: DataRow } | null>(null);

  const graphable = useMemo(
    () => readouts.filter((r) => r.graphable !== false && (!r.bands || r.bands.includes(band))),
    [readouts, band],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const theme = readTheme(themeKey);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const plotW = w - PAD.left - PAD.right;
    const plotH = h - PAD.top - PAD.bottom;
    if (plotW <= 10 || plotH <= 10) { ctx.restore(); return; }

    const active = plotted.filter((k) => graphable.some((g) => g.key === k));
    const xOf = (row: DataRow) => (xKey === "t" ? row.t : row.values[xKey] ?? 0);

    if (series.length < 2 || active.length === 0) {
      ctx.fillStyle = theme.inkSoft;
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        active.length === 0 ? "Pick a quantity below to plot it." : "Press play to collect data.",
        w / 2, h / 2,
      );
      ctx.restore();
      return;
    }

    // Bounds across every plotted series, with a little headroom.
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const row of series) {
      const x = xOf(row);
      if (!Number.isFinite(x)) continue;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      for (const key of active) {
        const y = row.values[key];
        if (!Number.isFinite(y)) continue;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    if (!Number.isFinite(xMin) || !Number.isFinite(yMin)) { ctx.restore(); return; }
    if (xMax - xMin < 1e-9) xMax = xMin + 1;
    if (yMax - yMin < 1e-9) { yMax = yMin + 1; yMin -= 1; }
    const pad = (yMax - yMin) * 0.08;
    yMin -= pad; yMax += pad;

    const px = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const py = (y: number) => PAD.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // Recessive grid.
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = theme.inkSoft;
    const yTicks = niceTicks(yMin, yMax, 5);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const val of yTicks.values) {
      const y = Math.round(py(val)) + 0.5;
      if (y < PAD.top - 1 || y > PAD.top + plotH + 1) continue;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(yTicks.decimals), PAD.left - 8, y);
    }
    const xTicks = niceTicks(xMin, xMax, 5);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const val of xTicks.values) {
      const x = Math.round(px(val)) + 0.5;
      if (x < PAD.left - 1 || x > PAD.left + plotW + 1) continue;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + plotH);
      ctx.stroke();
      ctx.fillText(val.toFixed(xTicks.decimals), x, PAD.top + plotH + 7);
    }

    // Axis frame.
    ctx.strokeStyle = theme.line;
    ctx.strokeRect(PAD.left + 0.5, PAD.top + 0.5, plotW, plotH);

    // Series, 2px, drawn last so they sit above the grid.
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const colors = seriesColors(active, graphable, theme);
    for (const key of active) {
      ctx.strokeStyle = colors[key] ?? theme.accent;
      ctx.beginPath();
      let started = false;
      for (const row of series) {
        const x = xOf(row);
        const y = row.values[key];
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const cx = px(x), cy = py(y);
        if (!started) { ctx.moveTo(cx, cy); started = true; }
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Emphasised endpoint — where the experiment is right now.
      const last = series[series.length - 1];
      const lx = xOf(last), ly = last.values[key];
      if (Number.isFinite(lx) && Number.isFinite(ly)) {
        ctx.beginPath();
        ctx.arc(px(lx), py(ly), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.fill();
      }
    }

    // Crosshair.
    if (hover) {
      ctx.strokeStyle = theme.inkSoft;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hover.x, PAD.top);
      ctx.lineTo(hover.x, PAD.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }, [series, plotted, xKey, graphable, band, themeKey, frame, hover]);

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (!series.length) return;
    const { w } = sizeRef.current;
    const plotW = w - PAD.left - PAD.right;
    const frac = Math.min(1, Math.max(0, (x - PAD.left) / plotW));
    const idx = Math.round(frac * (series.length - 1));
    setHover({ x, row: series[idx] });
  };

  const sig = BAND_SIG_FIGS[band];
  const legendColors = useMemo(
    () => seriesColors(plotted, graphable, readTheme(themeKey)),
    [plotted, graphable, themeKey],
  );

  return (
    <div className="graph">
      <div className="graph-canvas-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Graph of ${plotted.join(", ") || "no quantities"} against ${xKey === "t" ? "time" : xKey}`}
        />
        {hover && (
          <div className="graph-tip mono" style={{ left: Math.min(hover.x + 10, sizeRef.current.w - 130) }}>
            <div className="graph-tip-row">
              <span>{xKey === "t" ? "t" : xKey}</span>
              <b>{formatValue(xKey === "t" ? hover.row.t : hover.row.values[xKey] ?? 0, sig)}</b>
            </div>
            {plotted.map((k) => (
              <div className="graph-tip-row" key={k}>
                <span>{graphable.find((g) => g.key === k)?.label ?? k}</span>
                <b>{formatValue(hover.row.values[k] ?? 0, sig)}</b>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="graph-legend">
        <span className="graph-legend-label">Plot</span>
        {graphable.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`chip${plotted.includes(r.key) ? " is-on" : ""}`}
            aria-pressed={plotted.includes(r.key)}
            onClick={() => onTogglePlot(r.key)}
          >
            <span
              className="chip-dot"
              style={{ background: legendColors[r.key] ?? (r.semantic ? `var(--sci-${r.semantic})` : "var(--muted)") }}
              aria-hidden="true"
            />
            {r.label}
          </button>
        ))}
        <span className="graph-legend-label graph-legend-x">vs</span>
        <select className="xselect" value={xKey} onChange={(e) => onXKey(e.target.value)} aria-label="Horizontal axis">
          <option value="t">time</option>
          {graphable.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
