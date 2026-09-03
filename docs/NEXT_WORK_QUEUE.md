# Next work queue — highest value first

1. **Finish the three in-flight streams** (see AI_PROGRESS.md table): resume
   architecture workflow, audit workflow, briefs agent. Everything below
   depends on the first two.
2. **Read `docs/SCENE_ENGINE_SPEC.md` when it lands**; sanity-check it against
   REBUILD_BRIEF.md's seven points; record the decision in
   `docs/ARCHITECTURE_DECISIONS.md`; then implement the engine core (one
   engineer/agent, `app/src/engine/scene/` or as the spec directs) with unit
   tests before any flagship.
3. **Flagship rebuilds** (master brief phase 3), each to the acceptance gate,
   each visually QA'd by driving controls and reading screenshots:
   projectile (upgrade), collisions (upgrade), forces, energy, waves, optics,
   circuits (needs real circuit solver), gas laws, ecosystem, probability.
   Use `docs/EXPERIMENT_BRIEFS_G8_AB.md` for the mechanics/energy ones.
4. ~~Quality gate command~~ DONE: `npm run lab:quality` runs wire-topics
   --check, wire-curriculum --check, tsc, vitest incl. the acceptance harness.
   Remaining: triage the 19-sim unresponsive-control queue in
   `docs/QUALITY_STATUS.json` (fix real dead controls; expose the missing
   readout where the null effect is the physics), then promote the causal
   sweep from a report to an assertion.
5. **Audit-driven catalogue plan**: when `docs/AUDIT.md` + manifest land,
   group the 521 archetype subtopics by target engine and schedule rebuild
   waves (engines first, then configurations).
6. Teacher mode, instruments-as-probes, accessibility pass, performance pass —
   after the engine exists (they hang off its APIs).

Blocked: Grades 1-5 and 9-12 need syllabus PDFs from the founder.
