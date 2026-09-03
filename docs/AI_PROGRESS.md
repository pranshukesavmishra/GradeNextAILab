# AI progress — the project brain

Read this first in any new context. The repository is the memory; this file is
its index. Governing documents, in order of authority:

1. `docs/MASTER_BRIEF.md` — the founder's full rebuild mandate and acceptance
   gate. Nothing below it may be weakened.
2. `.workflows/REBUILD_BRIEF.md` — the five concrete failures the founder
   rejected and the seven-point scene bar.
3. This file + `docs/NEXT_WORK_QUEUE.md` — where we are and what is next.

## Current phase

Phase 1 (audit) and Phase 2 (architecture) of the master brief are running as
resumable workflows; foundational infrastructure that is needed regardless of
the architecture outcome is being built directly.

## Done and verified (all committed, typecheck 0 / tests green / build clean)

- **582/582 browser health** — every registered sim loads, draws, survives a
  click (that is the "not crashed" bar, NOT the founder's bar).
- **Clock unfreeze + regression tests** — every sim was stuck at t=0 from a
  negative first-frame delta; guarded at both ends, 4 tests.
- **Trial/data system (master brief §21-22)** — `DataRow` now snapshots
  `inputs` (the control settings at record time) and `trial` number;
  `SimRunner.snapshotRow` copies params; DataTable shows Trial + varying-input
  columns; CSV exports them; **TrialPlot** draws the student's own recorded
  runs as input-vs-output scatter (range vs angle, period vs length) — from
  recorded rows only, nothing synthesized. Fixed autoLab's measure-step check
  reading the varied control from `values` (a readout map that never contains
  it) instead of `inputs`.
- 521 archetype sims + 61 hand-written sims registered; one sim per subtopic;
  wiring scripts (`wire-topics.mjs`, `wire-curriculum.mjs`); guided labs
  generated from `measure`; drag-to-orbit 3D; the founder has REJECTED the
  archetype specimen model as "not experiments" — its science content is
  salvage, its picture model is condemned.

## In flight (resumable, cache-backed)

| Stream | Run/agent | Cached so far | Remaining |
|---|---|---|---|
| Scene-engine architecture workflow | `wf_ffe191e8-756`, script `design-scene-engine-wf_ffe191e8-756.js` | all 4 architects (physics, pedagogy, visual, scale) | 3 judges, synthesise → writes `docs/SCENE_ENGINE_SPEC.md` |
| Phase-1 audit workflow | `wf_4916b355-36a`, script `audit-catalogue-wf_4916b355-36a.js` | audit:registry, audit:handwritten | archetypes, infra, reconcile → writes `docs/AUDIT.md` + `app/src/manifest/simulations.json` |
| Product designer briefs | background agent, deliverable `docs/EXPERIMENT_BRIEFS_G8_AB.md` | 25 briefs (topics A1-A5) | A6, B1-B5; fix A1 run-3 slip → 3.59 m/s |

## Acceptance gate (landed)

`app/src/sims/acceptance.test.ts` asserts, for all 582 sims: finite readouts
and facts at t=0 and after a run, the clock advances, determinism (same seed →
same fingerprint), and clean reset. `npm run lab:quality` = wire-topics
--check + wire-curriculum --check + tsc + vitest (930 tests). The min→max
causal sweep is REPORTED to `docs/QUALITY_STATUS.json`, not asserted: 19 sims
queue there for triage. Triage rule: an unresponsive control is either a real
defect (fix the model) or correct physics whose null effect lacks an exposed
readout (e.g. pendulum period is mass-independent — expose energy so mass
visibly does something); when the queue is empty, promote the sweep to an
assertion. Three sims that leaked Infinity through facts (pendulum periodError
/gError, circulation inertialRadius at f≈0, function-grapher matchError) now
use validity-flag booleans + finite placeholders, with every lab check gated
on the flag.

Resume commands are in the workflow scripts dir:
`/root/.claude/projects/-home-user-GradeNextAILab/cab651ca-ba1e-5d3f-b80e-a9208800d96c/workflows/scripts/`
— `Workflow({scriptPath, resumeFromRunId})` replays cached agents free.

## Benchmarks (per audit so far + direct reading)

`app/src/sims/physics/projectile.ts` and `collisions.ts` are the flagship
standard: real integrated models (semi-implicit Euler; bilinear hysteretic
contact), hand-written labs with predict-before-run, real readouts. They still
lack: input-recording trials existed only now, no challenge on collisions'
crumple, instrument probes.

## Rules learned at cost (do not relearn)

1. Limits kill agents mid-flight — workflows must be resumable, agents must
   save incrementally, and the resume must come from THIS file, not memory.
2. One agent per file; shared files wired centrally by script.
3. A still screenshot cannot distinguish frozen from running — compare two,
   seconds apart, or drive a control.
4. A green typecheck proves nothing about a simulation working.
5. `pkill -f "vite preview"` inside a background command kills itself.
