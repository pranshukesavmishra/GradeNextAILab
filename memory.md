# MEMORY — read this first on every resume

This file is the project's brain. On any limit reset or fresh context: read this
file top to bottom, then continue from **STATE** below. Update STATE before every
pause and after every landed increment. Deeper history lives in docs/ (ADRs,
progress, build log) — this file is the entry point and the law.

## THE FOUNDER'S STANDING LAWS (never violate, never forget)

1. **Quality never decreases** (ADR-8). Every efficiency measure must be
   quality-neutral or quality-raising. At the first sign of slipping, revert
   the change strictly and immediately. Speed is never a defense.
2. **SUBTOPIC ALIGNMENT — very very very important.** Every experiment exists
   to teach its ONE specific subtopic. Scene, model, controls, labs and
   measurements must all serve that subtopic's learning goal; a student who
   finishes it must have learned exactly that idea. Check every build against
   this; it applies RETROACTIVELY to everything already uploaded. When
   reviewing an experiment, first question is always: "does this make a
   student learn THIS subtopic?"
3. **The quality bar** is the founder-approved keepers, named explicitly:
   Physics (Heat Transfer, Motion Graphs, EM Spectrum, Wave Machine,
   Collisions and Crumple Zones, Sound, Pendulum Lab, Kinetic Energy, Optics
   Bench) and Chemistry (Heating Curve, Molecule Builder, Build an Atom,
   States of Matter, Gas Properties, Reaction Rates, Conservation of Mass,
   pH & Acid-Base Lab) — "build like these for all subtopics."
4. **I design experiments myself** for each subtopic: research the subtopic,
   decide the most fully functional, deeply interactive experiment that
   teaches it, then build. The founder's unit spec books
   (docs/experiment-specs/) are ground truth where they exist; where they
   don't, I write the design first in the same nine-part spirit.
5. **Never fake anything**: real integrated causal model, every control
   measurably alive, measurements computed from state, failure states shown,
   predict-first labs, deterministic and finite always. A fake simulation is
   worse than an unfinished topic.
6. The 37 keeper sims are frozen as-is; improvements only on the founder's
   explicit suggestion.

## HOW WORK RUNS (efficiency rules — keep tokens low, keep moving)

- Builders: Sonnet lanes, one owner per topic, one experiment fully built and
  verified at a time. They read docs/BUILDER_GUIDE.md + the exemplar
  (app/src/sims/g6/a1-1-unplug-the-aquarium.ts) + their spec — nothing more.
- Lanes NEVER touch registry.ts / grade6.ts / this file (contention); they
  append one line per finished experiment to docs/G6A_BUILD_LOG.md and write
  sim + test files only. No commits from lanes.
- Orchestrator wires registry + curriculum centrally, runs the gate
  (npx tsc -b --noEmit; npx vitest run; npm run build for big waves), commits,
  pushes, updates STATE here. Verify once, not thrice: lanes verify their own
  work, orchestrator gates at commit, CI seals.
- Every experiment must pass: its own science tests + the acceptance gate
  (finite/deterministic/reset/live-controls) + typecheck. Unresponsive
  controls land in docs/QUALITY_STATUS.json — triage to zero, honestly.
- Never recreate scratch tsconfigs (root tsconfig excludes src/sims/g6 for
  unregistered drafts by design; registered sims get checked via the registry
  import). Never Read agent .output transcripts (context overflow).
- Incremental saves always: files land on disk as they're finished so a limit
  kill loses minutes, not hours. Commit+push at every verified increment.
- On resume: read this file, check `git status --short` + docs/G6A_BUILD_LOG.md
  tail, verify what's on disk, commit what's green, resume dead lanes via
  SendMessage with their exact remaining list.

## STATE (update before every pause)

Updated: 2026-09-06, after limit reset.

**Live and green on the site** (52 registered sims, CI green at head e742c86+):
- The 37 keepers (frozen).
- G6 Unit A: 15 of 27 done, registered, tested, pushed —
  a1-1 (exemplar), a1-2, a2-1, a2-2, a3-1..a3-4, a4-1..a4-3, a5-1..a5-4.

**On disk, uncommitted right now**: mid-build a1-3, a2-3, a4-4, a5-5 (sims
modified); revived tests a3-5.test.ts, a4-4.test.ts (were .wip, lanes fixed
them — VERIFY with vitest before trusting); a4-4.test.ts.wip deleted.

**Remaining Unit A (12)**: a1-3, a1-4, a1-5 (A1 lane) · a2-3, a2-4, a2-5
(A2 lane) · a3-5 (A3 lane) · a4-4, a4-5, a4-6 (A4 lane) · a5-5, a5-6
(A5 lane). Plus triage queue in docs/QUALITY_STATUS.json (a3-1
processes/compression/repeats, a3-2 compression, a3-3 runLengthDays, a4-1
magnitude, a4-3 ascentRateTarget, a5-1 sash, a5-4 yAxisMax; phys.collisions
massB waits on founder-approved enhancement).

**Retroactive subtopic-alignment audit** (law 2): after Unit A completes,
review all 15+12 against "does it teach its subtopic"; fix gaps.

**Next actions, in order**:
1. Verify on-disk work (vitest), commit+push what's green.
2. Resume the five lanes (SendMessage) with their remaining lists AND law 2
   verbatim in the message.
3. As lanes finish: wire, gate, commit, push, update STATE.
4. Unit A completion report to founder; then subtopic-alignment audit; then
   next unit (founder sends the book, or I design per law 4).

**After Unit A**: founder sends next unit book one at a time; where no book,
I design each subtopic's experiment myself (law 4) at keeper quality.
