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
4. **I design experiments myself, at an EXTRAORDINARY level** (founder,
   2026-09-10: "i didn't like these so much... build and design at extra
   ordinary level experiments and you can get help from these but think
   yourself as i need very high level of experiments"). The founder's unit
   books are now REFERENCE, not ground truth: read them for the subtopic and
   for real numbers, then design something better — a deeper causal model, a
   more physical interaction, a sharper measurement, a lesson that lands.
   Exception: G6 Unit A's book was accepted as spec and is already built to.
   Every design goes into docs/structure/SUBTOPIC_STRUCTURE.json before code.
   Bar to clear: would this out-teach the founder's named keepers?
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
- **NEVER `git add -A` blindly while lanes are live.** It sweeps mid-edit lane
  files and scratch (`_diag*.test.ts`, `_debug*.test.ts`) into a commit and
  turns CI red — this happened once (2026-09-06) and cost a red build. Before
  any commit: `git status --short`, delete lane scratch (underscore-prefixed
  test files are never shippable), run the gate, and only then add. Vitest
  runs `_*` test files even though tsconfig excludes `_*` from typecheck.
- Incremental saves always: files land on disk as they're finished so a limit
  kill loses minutes, not hours. Commit+push at every verified increment.
- On resume: read this file, check `git status --short` + docs/G6A_BUILD_LOG.md
  tail, verify what's on disk, commit what's green, resume dead lanes via
  SendMessage with their exact remaining list.

## STATE (update before every pause)

Updated: 2026-09-11, after registering a wave of 5 + fixing a1-4 from scratch.

**Live and green on the site** (61 registered sims, full gate green: tsc
clean, 975/975 vitest, npm run build clean):
- The 37 keepers (frozen).
- G6 Unit A: 24 of 27 registered, tested, pushed — a1-1 (exemplar), a1-2,
  a1-3, a1-4, a2-1, a2-2, a2-3, a2-4, a3-1, a3-2, a3-3, a3-4, a3-5, a4-1,
  a4-2, a4-3, a4-4, a4-5, a5-1, a5-2, a5-3, a5-4, a5-5, a5-6.

**Remaining Unit A (3), none started**: a1-5, a2-5, a4-6. Every
model-built-but-untested file left over from earlier lane passes (a2-4,
a4-5, a5-6) is now landed — these three need the FULL pipeline from step 1
(design), not just a missing test. Read app/src/curriculum/grade6.ts for
each subtopic's exact title, then follow docs/BUILDER_GUIDE.md +
the exemplar (a1-1) same as any from-scratch build; there is no founder
book chapter for these beyond the subtopic title, so design per law 4.

**Recipe that landed a2-4, a4-5 and a5-6** (each: a model built by an
earlier lane pass, with no test): read the whole file once (check for a
lane's own gitignored `_*.test.ts` scratch diagnostic first — reuse its
param/fact names as a map, then delete it once superseded), diagnose real
timing/scale via standalone vite-node scripts BEFORE writing assertions
(residence times and multi-decade lags need the shared engine's own
`MAX_FRAME_SECONDS` respected — advance in that increment in a loop, at
the control's own max speed dial — empirically confirmed both correctness
AND that it stays fast, tens of ms even for multi-year/decade runs), write
the test against verified real behaviour, then register and gate. The gate
found something every time but the last: a2-4 had 2 real model bugs
(divide-by-zero at a control's own labelled minimum, a state flag never
set on one path); a4-5 had one control never wired to anything at all
(fixed by wiring it, not patching around it); a5-6 held up clean on a
comprehensive test (only a genuinely-inert-by-design control pair needed
an honest live readout, same as the others). Worth repeating for a1-5/
a2-5/a4-6 even though they start from zero: diagnose real behaviour with
vite-node before trusting any assumption about timing or scale.

**Acceptance-gate triage queue** (docs/QUALITY_STATUS.json, machine-
generated — do not hand-edit): down to 3 — phys.collisions massB (frozen
keeper, waits on founder-approved enhancement), a5-1 sash, a5-4 yAxisMax
(both pre-existing, untouched this pass). a1-3 (linkDelayMin/linkGain/
solarInput) and a1-4 (patchCount/selectedPatch) triaged to zero this pass —
see build log for the fix (both were real controls masked by the sweep's
short window landing entirely at simulated midnight / before any bee
completes a round trip; fixed with instant, gate-free readouts, no model
formula changed).

**g6.a1-4 "No Bee Is In Charge" — full rebuild from a broken lane draft**
(2026-09-11): found and fixed 4 real model bugs by direct numerical
diagnosis (standalone runner scripts, not reading code alone) — measurement-
by-arrival undercounting convergence, "richest" read from live harvest-
drained stock instead of student-set target, Rule 4's odour correction not
credited in the static target measurement, and the real root cause: harvest
fraction (0.22, lane-invented, unmarked) let up to 600 near-simultaneous
foragers (S1's own default colony) compound-drain the richest patch faster
than regrowth could ever recover, holding it below the dance/memory
thresholds ~98% of the time regardless of simulated duration — structurally
incapable of the emergence the sim exists to demonstrate. Retuned to 0.01,
verified across many seeds (colonySize=600 now reliably reaches 55-66%
accuracy by minute 20-25, matching the spec's stated session length). All
17 of its own science tests pass; full detail in docs/G6A_BUILD_LOG.md.
TWO KNOWN GAPS logged there, not blocking ship, founder input wanted before
touching further: (a) "Colony size" control's tooltip ("weakens then
vanishes as it falls") reads backwards from verified behaviour — smaller
colonies converge MORE reliably (a carrying-capacity effect the tooltip
doesn't anticipate); the more detailed "smallest-working-colony" challenge
is unaffected and passes reliably. (b) "recruit-without-dancing" challenge
(accuracy>50% via chance+odour alone) is not reachable in any practical
time — Rule 4 is richness-blind by design, but the challenge's own hint
implies it should not be.

**Retroactive subtopic-alignment audit** (law 2) — TWO PASSES DONE on the
first 15 (2026-09-06, tagline level then learningGoals level, see git
history for full quotes) plus a THIRD, learningGoals-level pass on this
wave's 5 (2026-09-11): a1-3 "explain that a system's behaviour comes from
the interactions between its parts, not from the parts on their own"; a1-4
"state the core idea of an emergent property: a whole can have an ability
that not one of its parts has, or could have"; a2-3 "list a machine's
inputs and outputs without assuming the useful output is the only one";
a3-5 "distinguish a parameter problem from a structural one by watching
auto-tune hit a floor"; a5-5 "distinguish a testable, specific claim from a
vague one that no evidence can properly support". Law 2 holds on all 21
shipped. Re-run the same check on each new experiment at wire time
(pipeline step 4) — cheap (grep learningGoals, read against the subtopic
title), always do it before registering.

**Next actions, in order**:
1. Read docs/QUALITY_STATUS.json + this file, confirm git status is clean
   (should be, right after this update's commit+push).
2. Write science tests for the three model-complete-but-untested files
   (a2-4, a4-5, a5-6), verify (own tests + vitest + tsc), wire, gate, ship.
3. Build the remaining three from zero (a1-5, a2-5, a4-6) per the pipeline.
4. Unit A completion report to founder; then next unit (founder sends the
   book, or I design per law 4).

**After Unit A**: founder sends next unit book one at a time; where no book,
I design each subtopic's experiment myself (law 4) at keeper quality.

## OPERATING STRUCTURE (full system — any orchestrator model resumes from here)

**Model policy.** The orchestrator runs on the session model — Opus 5 at high
effort is an approved configuration for long fast runs. Builder lanes run on
Sonnet 5. Escalate one experiment to Opus 5 when its lane fails verification
twice or the physics is unusually hard. QUALITY IS ENFORCED BY THE GATES, NOT
BY THE MODEL: every experiment passes the same science tests, acceptance gate,
typecheck, build, and orchestrator review whatever model built it. If quality
ever slips under any configuration, ADR-8's revert rule fires: roll back to
the last proven setup immediately and record it here.

**Roles.**
- Orchestrator (this session): owns registry/curriculum wiring, the gates,
  commits/pushes, memory.md STATE, lane resumes, reviews, founder contact.
- Builder lanes: one owner per topic, files only, incremental, log per finish.
- Reviewer (orchestrator, or an Opus agent for big waves): checks each
  finished experiment against the RUBRIC below before it is wired in.

**Per-experiment pipeline** (never skip a step):
1. DESIGN — from the founder's spec book if one exists; else I design it:
   read the subtopic in app/src/curriculum/grade*.ts, research what the
   subtopic means a student must learn, choose the one most interactive
   experiment that teaches exactly that, write a short nine-part design
   (name, scene, objects, causal model with real constants, controls,
   scenarios, measurements, failure state, the fraud to avoid) into
   docs/experiment-specs/<unit>/SELF/<code>.md BEFORE building.
2. BUILD — per docs/BUILDER_GUIDE.md, to the keeper bar.
3. VERIFY — own science tests + vitest + tsc green from app/.
4. ALIGN — law 2 check: labs and conclusions walk the student to the
   subtopic's idea, stated plainly.
5. WIRE — orchestrator registers + links curriculum.
6. GATE — full vitest + tsc (+ npm run build each wave); triage any
   unresponsive-control entry immediately or assign it to the lane.
7. SHIP — commit, push, update STATE here.

**RUBRIC (orchestrator review before wiring):**
- Teaches its subtopic (law 2) — the decisive question.
- Real model: constants sourced, couplings per design, no closed-form
  positions, no wall-clock physics, honesty rule enforced structurally.
- Every control measurably alive; readouts/facts finite always.
- Labs predict-first, checks on facts a student can actually cause.
- Scene shows the whole apparatus, cause drawn on objects, failure visible.
- Matches keeper style; no emoji; theme-aware.
Reject → back to lane with the specific gap; two rejections → escalate model.

**Roadmap.**
1. Finish G6 Unit A (12 remaining; lanes live).
2. Retroactive alignment audit of all 27 (law 2).
3. Next units in founder order, one at a time. If the founder sends a book →
   it is ground truth. If not → I design each subtopic per pipeline step 1,
   using app/src/curriculum/grade6.ts (units B-F), grade7.ts, grade8.ts as
   the subtopic source. Curriculum subtopics without sims show as planned;
   never attach a wrong-fit sim just to fill a slot.
4. Each unit ends with: unit report to founder, alignment audit, STATE update.

**Long-run efficiency levers (all active).**
Distilled reading (BUILDER_GUIDE + exemplar only) · topic batching · Sonnet
lanes · central wiring · single verification chain (lane → gate → CI) ·
incremental commits · memory.md resume (a limit reset costs ~zero context) ·
shared scene kits extracted when two experiments duplicate machinery (kit code
goes in app/src/ui/, unit-tested, then both use it).
