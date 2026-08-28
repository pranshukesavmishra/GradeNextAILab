import { useId, useMemo } from "react";
import type { GradeBand, ParamSpec, ParamValues, Readout } from "@engine/types";
import { BAND_SIG_FIGS } from "@engine/types";
import { convert, format, formatValue, toSI, unitSymbol } from "@engine/units";

/* ------------------------------------------------------------------ *
 * Slider — the most-used control on the platform
 * ------------------------------------------------------------------ */

interface SliderProps {
  label: string;
  value: number;          // SI
  min: number;            // SI
  max: number;            // SI
  step: number;           // SI
  unitKind: Parameters<typeof convert>[1];
  unitId?: string;
  band: GradeBand;
  hideValue?: boolean;
  help?: string;
  marks?: { value: number; label: string }[];
  disabled?: boolean;
  onChange: (siValue: number) => void;
}

export function Slider(props: SliderProps) {
  const { label, value, min, max, step, unitKind, unitId, band, hideValue, help, marks, disabled, onChange } = props;
  const id = useId();
  const listId = `${id}-marks`;

  const dMin = convert(min, unitKind, unitId ?? "");
  const dMax = convert(max, unitKind, unitId ?? "");
  const dVal = convert(value, unitKind, unitId ?? "");
  const dStep = Math.abs(convert(min + step, unitKind, unitId ?? "") - dMin) || step;
  const symbol = unitId ? unitSymbol(unitKind, unitId) : "";
  const sig = BAND_SIG_FIGS[band];

  const pct = dMax === dMin ? 0 : ((dVal - dMin) / (dMax - dMin)) * 100;

  return (
    <div className={`ctrl${disabled ? " is-disabled" : ""}`}>
      <div className="ctrl-head">
        <label className="ctrl-label" htmlFor={id}>
          {label}
          {help && (
            <span className="ctrl-help" title={help} aria-hidden="true">?</span>
          )}
        </label>
        {!hideValue && (
          <output className="ctrl-value mono" htmlFor={id}>
            {formatValue(dVal, sig)}
            {symbol && <span className="ctrl-unit">{symbol}</span>}
          </output>
        )}
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min={dMin}
        max={dMax}
        step={dStep}
        value={dVal}
        disabled={disabled}
        list={marks?.length ? listId : undefined}
        style={{ ["--pct" as string]: `${pct}%` }}
        aria-valuetext={`${formatValue(dVal, sig)}${symbol ? ` ${symbol}` : ""}`}
        onChange={(e) => onChange(toSI(Number(e.target.value), unitKind, unitId ?? ""))}
      />
      {marks?.length ? (
        <>
          <datalist id={listId}>
            {marks.map((m) => (
              <option key={m.value} value={convert(m.value, unitKind, unitId ?? "")} label={m.label} />
            ))}
          </datalist>
          <div className="ctrl-marks">
            {marks.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`mark${Math.abs(m.value - value) < step / 2 ? " is-on" : ""}`}
                onClick={() => onChange(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Toggle
 * ------------------------------------------------------------------ */

export function Toggle({ label, checked, onChange, help, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; help?: string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`ctrl ctrl-row${disabled ? " is-disabled" : ""}`}>
      <label className="ctrl-label" htmlFor={id}>
        {label}
        {help && <span className="ctrl-help" title={help} aria-hidden="true">?</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch${checked ? " is-on" : ""}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Segmented control
 * ------------------------------------------------------------------ */

export function Segmented<T extends string>({ label, value, options, onChange, compact }: {
  label?: string;
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={`segmented${compact ? " is-compact" : ""}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`seg${value === o.value ? " is-on" : ""}`}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          title={o.label}
        >
          {o.icon && <span className="seg-icon" aria-hidden="true">{o.icon}</span>}
          <span className={compact && o.icon ? "visually-hidden" : ""}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Parameter panel — renders a whole schema for the active band
 * ------------------------------------------------------------------ */

export function ParamControl({ name, spec, value, band, onChange, disabled }: {
  name: string;
  spec: ParamSpec;
  value: number | boolean | string;
  band: GradeBand;
  onChange: (key: string, v: number | boolean | string) => void;
  disabled?: boolean;
}) {
  if (spec.type === "number") {
    return (
      <Slider
        label={spec.label}
        value={value as number}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        unitKind={spec.kind}
        unitId={spec.unit}
        band={band}
        hideValue={spec.hideValueBands?.includes(band)}
        help={spec.help}
        marks={spec.marks}
        disabled={disabled}
        onChange={(v) => onChange(name, v)}
      />
    );
  }
  if (spec.type === "boolean") {
    return (
      <Toggle
        label={spec.label}
        checked={value as boolean}
        help={spec.help}
        disabled={disabled}
        onChange={(v) => onChange(name, v)}
      />
    );
  }
  return (
    <div className="ctrl">
      <div className="ctrl-head">
        <span className="ctrl-label">{spec.label}</span>
      </div>
      <Segmented
        label={spec.label}
        value={value as string}
        options={spec.options}
        onChange={(v) => onChange(name, v)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Time controls
 * ------------------------------------------------------------------ */

const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 20, 100];

export function TimeControls({ playing, speed, time, band, onToggle, onStep, onReset, onSpeed, maxSpeed = 5 }: {
  playing: boolean;
  speed: number;
  time: number;
  band: GradeBand;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (s: number) => void;
  maxSpeed?: number;
}) {
  const speeds = useMemo(() => SPEEDS.filter((s) => s <= maxSpeed), [maxSpeed]);
  const showNumbers = band !== "K-2";

  return (
    <div className="timebar">
      <button
        type="button"
        className="tbtn tbtn-primary"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
      </button>
      <button type="button" className="tbtn" onClick={onStep} aria-label="Step forward one frame" disabled={playing}>
        <span aria-hidden="true">⏭</span>
      </button>
      <button type="button" className="tbtn" onClick={onReset} aria-label="Reset the experiment">
        <span aria-hidden="true">↺</span>
      </button>

      {showNumbers && (
        <>
          <div className="timebar-sep" />
          <div className="speed-group" role="group" aria-label="Speed">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed${speed === s ? " is-on" : ""}`}
                aria-pressed={speed === s}
                onClick={() => onSpeed(s)}
              >
                {s < 1 ? `${s}×` : `${s}×`}
              </button>
            ))}
          </div>
          <div className="timebar-sep" />
          <output className="clock mono" aria-label="Elapsed simulation time">
            {time < 100 ? time.toFixed(2) : time.toFixed(0)}<span className="ctrl-unit">s</span>
          </output>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Readout chips
 * ------------------------------------------------------------------ */

export function Readouts({ readouts, band }: { readouts: Readout[]; band: GradeBand }) {
  const visible = readouts.filter((r) => !r.bands || r.bands.includes(band));
  if (!visible.length) return null;
  const sig = BAND_SIG_FIGS[band];

  return (
    <div className="readouts">
      {visible.map((r) => (
        <div key={r.key} className="readout">
          <span
            className="readout-dot"
            style={r.semantic ? { background: `var(--sci-${r.semantic})` } : undefined}
            aria-hidden="true"
          />
          <span className="readout-label">{r.label}</span>
          <span className="readout-value mono">
            {format(r.quantity, { unitId: r.unit, sigFigs: sig, showUncertainty: band === "9-12" })}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Presets
 * ------------------------------------------------------------------ */

export function Presets({ presets, onApply }: {
  presets: { label: string; values: ParamValues }[];
  onApply: (v: ParamValues) => void;
}) {
  if (!presets.length) return null;
  return (
    <div className="presets">
      {presets.map((p) => (
        <button key={p.label} type="button" className="preset" onClick={() => onApply(p.values)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
