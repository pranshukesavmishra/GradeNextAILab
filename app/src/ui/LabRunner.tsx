import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataRow, LabDefinition, LabStep, LabValues, ParamValues } from "@engine/types";

/**
 * The Guided Lab runtime.
 *
 * A lab is a sequence of steps over a live simulation: predict, set up, measure,
 * analyse, conclude. Checkpoints are predicates over real sim state, so the lab
 * verifies that the student actually did the experiment rather than clicking
 * through — which is the failure mode of every scripted virtual lab we studied.
 */

export interface LabProgress {
  stepIndex: number;
  completed: string[];
  predictions: Record<string, number>;
  writings: Record<string, string>;
  hintsShown: Record<string, number>;
}

const emptyProgress: LabProgress = {
  stepIndex: 0, completed: [], predictions: {}, writings: {}, hintsShown: {},
};

export function useLab(lab: LabDefinition | null, values: LabValues) {
  const [progress, setProgress] = useState<LabProgress>(emptyProgress);

  useEffect(() => {
    setProgress(emptyProgress);
  }, [lab?.id]);

  const step: LabStep | null = lab ? lab.steps[progress.stepIndex] ?? null : null;

  // A step is satisfiable when its check passes, its data quota is met, and any
  // prediction has been committed to.
  const canAdvance = useMemo(() => {
    if (!step) return false;
    if (step.predict && progress.predictions[step.id] === undefined) return false;
    if (step.requireData !== undefined && values.data.length < step.requireData) return false;
    if (step.check && !safeTest(step.check.test, values)) return false;
    if (step.write && !(progress.writings[step.id]?.trim().length >= 3)) return false;
    return true;
  }, [step, values, progress]);

  const advance = useCallback(() => {
    setProgress((p) => {
      if (!lab) return p;
      const current = lab.steps[p.stepIndex];
      if (!current) return p;
      return {
        ...p,
        completed: p.completed.includes(current.id) ? p.completed : [...p.completed, current.id],
        stepIndex: Math.min(p.stepIndex + 1, lab.steps.length),
      };
    });
  }, [lab]);

  const back = useCallback(() => {
    setProgress((p) => ({ ...p, stepIndex: Math.max(0, p.stepIndex - 1) }));
  }, []);

  const predict = useCallback((stepId: string, choice: number) => {
    setProgress((p) => ({ ...p, predictions: { ...p.predictions, [stepId]: choice } }));
  }, []);

  const write = useCallback((stepId: string, text: string) => {
    setProgress((p) => ({ ...p, writings: { ...p.writings, [stepId]: text } }));
  }, []);

  const revealHint = useCallback((stepId: string) => {
    setProgress((p) => ({ ...p, hintsShown: { ...p.hintsShown, [stepId]: (p.hintsShown[stepId] ?? 0) + 1 } }));
  }, []);

  const finished = lab ? progress.stepIndex >= lab.steps.length : false;

  return { progress, step, canAdvance, advance, back, predict, write, revealHint, finished, reset: () => setProgress(emptyProgress) };
}

function safeTest(fn: (v: LabValues) => boolean, v: LabValues): boolean {
  try {
    return fn(v);
  } catch {
    return false;
  }
}

const PHASE_LABEL: Record<LabStep["phase"], string> = {
  question: "Question",
  hypothesis: "Predict",
  setup: "Set up",
  measure: "Measure",
  analyze: "Analyse",
  conclude: "Conclude",
};

interface LabPanelProps {
  lab: LabDefinition;
  lab_: ReturnType<typeof useLab>;
  values: LabValues;
  onApplySetup: (values: ParamValues) => void;
  onExit: () => void;
  onSaveToNotebook: () => void;
}

export function LabPanel({ lab, lab_, values, onApplySetup, onExit, onSaveToNotebook }: LabPanelProps) {
  const { progress, step, canAdvance, advance, back, predict, write, revealHint, finished } = lab_;

  if (finished) {
    return (
      <div className="lab-panel">
        <div className="lab-done">
          <h3>Lab complete</h3>
          <p className="lab-done-title">{lab.title}</p>
          <p className="muted-text">
            You answered: <strong>{lab.question}</strong>
          </p>
          <div className="lab-actions">
            <button type="button" className="btn btn-primary" onClick={onSaveToNotebook}>
              Save to Lab Notebook
            </button>
            <button type="button" className="btn" onClick={onExit}>Back to exploring</button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const hintsShown = progress.hintsShown[step.id] ?? 0;
  const prediction = progress.predictions[step.id];
  const predicted = prediction !== undefined;

  return (
    <div className="lab-panel">
      <div className="lab-head">
        <div className="lab-spine" aria-label={`Step ${progress.stepIndex + 1} of ${lab.steps.length}`}>
          {lab.steps.map((s, i) => (
            <span
              key={s.id}
              className={`spine-dot${i < progress.stepIndex ? " is-done" : ""}${i === progress.stepIndex ? " is-now" : ""}`}
              title={PHASE_LABEL[s.phase]}
            />
          ))}
        </div>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onExit}>Exit lab</button>
      </div>

      <p className="lab-phase">{PHASE_LABEL[step.phase]}</p>
      <h3 className="lab-title">{step.title}</h3>
      <p className="lab-instruction">{step.instruction}</p>

      {lab.setup && progress.stepIndex === 0 && (
        <button type="button" className="btn btn-sm" onClick={() => onApplySetup(lab.setup!)}>
          Use the starting setup
        </button>
      )}

      {step.predict && (
        <div className="predict">
          <p className="predict-prompt">{step.predict.prompt}</p>
          <div className="predict-options">
            {step.predict.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                className={`predict-opt${prediction === i ? " is-picked" : ""}`}
                aria-pressed={prediction === i}
                disabled={predicted}
                onClick={() => predict(step.id, i)}
              >
                {opt}
              </button>
            ))}
          </div>
          {predicted && (
            <p className={`predict-reveal${prediction === step.predict.correct ? " is-right" : ""}`}>
              {prediction === step.predict.correct
                ? "That matches what the experiment shows. "
                : "Most people pick that too — run it and watch. "}
              {step.predict.reveal}
            </p>
          )}
        </div>
      )}

      {step.requireData !== undefined && (
        <div className="lab-quota">
          <span className="mono">{values.data.length} / {step.requireData}</span> data points recorded
          <div className="quota-bar">
            <span style={{ width: `${Math.min(100, (values.data.length / step.requireData) * 100)}%` }} />
          </div>
        </div>
      )}

      {step.check && (
        <p className={`lab-check${safeTest(step.check.test, values) ? " is-met" : ""}`}>
          <span aria-hidden="true">{safeTest(step.check.test, values) ? "✓" : "○"}</span> {step.check.describe}
        </p>
      )}

      {step.write && (
        <label className="lab-write">
          <span>{step.write.prompt}</span>
          <textarea
            rows={3}
            placeholder={step.write.placeholder}
            value={progress.writings[step.id] ?? ""}
            onChange={(e) => write(step.id, e.target.value)}
          />
        </label>
      )}

      {step.hints?.length ? (
        <div className="lab-hints">
          {step.hints.slice(0, hintsShown).map((h, i) => (
            <p className="hint" key={i}>{h}</p>
          ))}
          {hintsShown < step.hints.length && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => revealHint(step.id)}>
              {hintsShown === 0 ? "I need a hint" : "Another hint"}
            </button>
          )}
        </div>
      ) : null}

      <div className="lab-actions">
        {progress.stepIndex > 0 && (
          <button type="button" className="btn btn-quiet" onClick={back}>Back</button>
        )}
        <button type="button" className="btn btn-primary" disabled={!canAdvance} onClick={advance}>
          {progress.stepIndex === lab.steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
      {!canAdvance && (
        <p className="lab-blocker">
          {step.predict && !predicted
            ? "Commit to a prediction first."
            : step.requireData !== undefined && values.data.length < step.requireData
              ? "Record more data points using the Record button."
              : step.check && !safeTest(step.check.test, values)
                ? step.check.describe
                : step.write
                  ? "Write your answer to continue."
                  : ""}
        </p>
      )}
    </div>
  );
}

export type { DataRow };
