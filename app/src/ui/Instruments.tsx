import { useCallback, useEffect, useRef, useState } from "react";
import type { GradeBand } from "@engine/types";

/**
 * The measurement toolbox.
 *
 * Instruments are draggable overlays that sit above the stage and work on any
 * simulation. Choosing and placing an instrument is itself a science practice,
 * so these are deliberately physical objects a student positions, not readouts
 * the sim hands over for free.
 */

export type InstrumentKind = "ruler" | "protractor" | "stopwatch" | "magnifier";

export interface InstrumentState {
  id: string;
  kind: InstrumentKind;
  x: number;
  y: number;
  /** Rotation in degrees, for the ruler. */
  rotation: number;
}

export const INSTRUMENTS: { kind: InstrumentKind; label: string; icon: string; bands?: GradeBand[] }[] = [
  { kind: "ruler", label: "Ruler", icon: "📏" },
  { kind: "protractor", label: "Protractor", icon: "📐", bands: ["3-5", "6-8", "9-12"] },
  { kind: "stopwatch", label: "Stopwatch", icon: "⏱" },
  { kind: "magnifier", label: "Magnifier", icon: "🔍", bands: ["K-2", "3-5"] },
];

let nextId = 1;

export function useInstruments() {
  const [items, setItems] = useState<InstrumentState[]>([]);

  const add = useCallback((kind: InstrumentKind) => {
    setItems((prev) => [
      ...prev,
      { id: `inst-${nextId++}`, kind, x: 80 + prev.length * 26, y: 90 + prev.length * 22, rotation: 0 },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, x, y } : i)));
  }, []);

  const rotate = useCallback((id: string, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, rotation: i.rotation + delta } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, move, rotate, clear };
}

interface LayerProps {
  instruments: ReturnType<typeof useInstruments>;
  /** Simulated seconds, so the stopwatch measures sim time, not wall time. */
  simTime: number;
  band: GradeBand;
}

export function InstrumentLayer({ instruments, simTime, band }: LayerProps) {
  if (!instruments.items.length) return null;
  return (
    <div className="inst-layer">
      {instruments.items.map((item) => (
        <Instrument
          key={item.id}
          item={item}
          simTime={simTime}
          band={band}
          onMove={instruments.move}
          onRotate={instruments.rotate}
          onRemove={instruments.remove}
        />
      ))}
    </div>
  );
}

function Instrument({ item, simTime, band, onMove, onRotate, onRemove }: {
  item: InstrumentState;
  simTime: number;
  band: GradeBand;
  onMove: (id: string, x: number, y: number) => void;
  onRotate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { dx: e.clientX - rect.left - item.x, dy: e.clientY - rect.top - item.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    onMove(item.id, e.clientX - rect.left - drag.dx, e.clientY - rect.top - drag.dy);
  };

  const onPointerUp = () => { dragRef.current = null; };

  // Keyboard: an instrument must be placeable without a mouse.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const stepPx = e.shiftKey ? 20 : 4;
    if (e.key === "ArrowLeft") { onMove(item.id, item.x - stepPx, item.y); e.preventDefault(); }
    else if (e.key === "ArrowRight") { onMove(item.id, item.x + stepPx, item.y); e.preventDefault(); }
    else if (e.key === "ArrowUp") { onMove(item.id, item.x, item.y - stepPx); e.preventDefault(); }
    else if (e.key === "ArrowDown") { onMove(item.id, item.x, item.y + stepPx); e.preventDefault(); }
    else if (e.key === "[") { onRotate(item.id, -5); e.preventDefault(); }
    else if (e.key === "]") { onRotate(item.id, 5); e.preventDefault(); }
    else if (e.key === "Delete" || e.key === "Backspace") { onRemove(item.id); e.preventDefault(); }
  };

  const meta = INSTRUMENTS.find((i) => i.kind === item.kind);

  return (
    <div
      ref={nodeRef}
      className={`inst inst-${item.kind}`}
      style={{ left: item.x, top: item.y, transform: `rotate(${item.rotation}deg)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`${meta?.label ?? item.kind}. Arrow keys move it, brackets rotate it, Delete removes it.`}
    >
      <button
        type="button"
        className="inst-close"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove the ${meta?.label ?? item.kind}`}
        tabIndex={-1}
      >
        ×
      </button>

      {item.kind === "ruler" && <Ruler band={band} />}
      {item.kind === "protractor" && <Protractor />}
      {item.kind === "stopwatch" && <Stopwatch simTime={simTime} />}
      {item.kind === "magnifier" && <Magnifier />}
    </div>
  );
}

/**
 * The ruler measures in screen pixels mapped to a nominal scale. Sims that want
 * true world-unit measurement expose a `pxPerUnit` readout; until then this
 * gives students a consistent relative measuring tool.
 */
function Ruler({ band }: { band: GradeBand }) {
  const ticks = band === "K-2" ? 6 : 12;
  return (
    <svg className="inst-svg" width={ticks * 24 + 16} height={46} aria-hidden="true">
      <rect x="0" y="8" width={ticks * 24 + 16} height="30" rx="4"
        fill="var(--panel)" stroke="var(--line2)" />
      {Array.from({ length: ticks + 1 }, (_, i) => (
        <g key={i}>
          <line x1={8 + i * 24} y1="8" x2={8 + i * 24} y2={i % 5 === 0 ? 26 : 18}
            stroke="var(--ink2)" strokeWidth={i % 5 === 0 ? 1.5 : 1} />
          {i % 5 === 0 && (
            <text x={8 + i * 24} y="35" fontSize="9" textAnchor="middle" fill="var(--muted)"
              fontFamily="ui-monospace, monospace">{i}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function Protractor() {
  const r = 62;
  return (
    <svg className="inst-svg" width={r * 2 + 8} height={r + 18} aria-hidden="true">
      <path d={`M 4 ${r + 4} A ${r} ${r} 0 0 1 ${r * 2 + 4} ${r + 4} Z`}
        fill="var(--panel)" fillOpacity="0.9" stroke="var(--line2)" />
      {Array.from({ length: 19 }, (_, i) => {
        const deg = i * 10;
        const rad = (deg * Math.PI) / 180;
        const inner = deg % 30 === 0 ? r - 14 : r - 7;
        return (
          <g key={i}>
            <line
              x1={r + 4 - Math.cos(rad) * r} y1={r + 4 - Math.sin(rad) * r}
              x2={r + 4 - Math.cos(rad) * inner} y2={r + 4 - Math.sin(rad) * inner}
              stroke="var(--ink2)" strokeWidth={deg % 30 === 0 ? 1.4 : 0.8}
            />
            {deg % 30 === 0 && (
              <text
                x={r + 4 - Math.cos(rad) * (r - 24)} y={r + 4 - Math.sin(rad) * (r - 24) + 3}
                fontSize="8.5" textAnchor="middle" fill="var(--muted)" fontFamily="ui-monospace, monospace"
              >
                {deg}
              </text>
            )}
          </g>
        );
      })}
      <circle cx={r + 4} cy={r + 4} r="2.5" fill="var(--accent)" />
    </svg>
  );
}

/** Measures simulated time, so slow motion and fast-forward stay honest. */
function Stopwatch({ simTime }: { simTime: number }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [frozen, setFrozen] = useState<number | null>(null);

  const elapsed = frozen !== null ? frozen : startedAt === null ? 0 : simTime - startedAt;

  return (
    <div className="stopwatch">
      <output className="stopwatch-face mono">{elapsed.toFixed(2)}<span className="ctrl-unit">s</span></output>
      <div className="stopwatch-btns">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            if (startedAt === null) { setStartedAt(simTime); setFrozen(null); }
            else if (frozen === null) setFrozen(simTime - startedAt);
            else { setStartedAt(simTime); setFrozen(null); }
          }}
        >
          {startedAt === null ? "Start" : frozen === null ? "Stop" : "Restart"}
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={() => { setStartedAt(null); setFrozen(null); }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function Magnifier() {
  return (
    <svg className="inst-svg" width="92" height="92" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="var(--stage)" fillOpacity="0.35"
        stroke="var(--ink2)" strokeWidth="3" />
      <circle cx="40" cy="40" r="30" fill="none" stroke="var(--panel)" strokeWidth="1" />
      <line x1="62" y1="62" x2="84" y2="84" stroke="var(--ink2)" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** The rail of instrument chips that adds them to the stage. */
export function ToolRail({ band, onAdd, hasAny, onClear }: {
  band: GradeBand;
  onAdd: (kind: InstrumentKind) => void;
  hasAny: boolean;
  onClear: () => void;
}) {
  const available = INSTRUMENTS.filter((i) => !i.bands || i.bands.includes(band));
  return (
    <div className="tool-rail" role="group" aria-label="Measurement instruments">
      {available.map((i) => (
        <button
          key={i.kind}
          type="button"
          className="tool-chip"
          onClick={() => onAdd(i.kind)}
          title={`Add a ${i.label.toLowerCase()} to the stage`}
        >
          <span className="tool-icon" aria-hidden="true">{i.icon}</span>
          <span className="tool-label">{i.label}</span>
        </button>
      ))}
      {hasAny && (
        <button type="button" className="tool-chip is-clear" onClick={onClear} title="Remove all instruments">
          <span className="tool-icon" aria-hidden="true">✕</span>
          <span className="tool-label">Clear</span>
        </button>
      )}
    </div>
  );
}

/** Restores focus handling when instruments unmount mid-drag. */
export function useEscapeToClear(onClear: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (e.target as HTMLElement)?.classList?.contains("inst")) onClear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClear]);
}
