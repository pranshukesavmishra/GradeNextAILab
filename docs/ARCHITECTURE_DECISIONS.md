# Architecture decisions

## ADR-1 · The archetype specimen model is condemned (2026-09-02)
The founder rejected "one prop + a pre-plotted graph" with evidence
(.workflows/REBUILD_BRIEF.md). Its replacement is being designed by a
judged multi-architect workflow; until docs/SCENE_ENGINE_SPEC.md exists, no
new simulation is built on `buildSim`/`drawSpecimen`. The 521 specs' science
(measure functions, constants, misconceptions, goals) is salvage.

## ADR-2 · Trials record their inputs (2026-09-02)
`DataRow` carries `inputs` (param snapshot) + `trial`. Rationale: five
recorded ranges without their five angles cannot show a relationship; the
input-vs-output trial plot and the fair-test table both require it. The
runner snapshots params at record time; nothing follows the sliders
afterwards.

## ADR-3 · The animation clock trusts performance.now, never the rAF
timestamp (2026-09-02)
First frame after slow startup can carry a timestamp older than loop setup →
negative delta → accumulator ~-20s → permanent freeze. Both ends guarded;
regression tests in engine.test.ts. Do not revert to the callback timestamp.

## ADR-4 · Quality levels and honest statuses (2026-09-02, founder mandate)
Every experience carries a quality level 0-7 (0 placeholder, 1 decorative,
2 weak model, 3 conceptual visualization, 4 functional simulation,
5 experimental simulation, 6 digital lab, 7 exemplary digital lab) and an
honest status from: NOT_STARTED, PLANNED, PROTOTYPE, FUNCTIONAL,
EXPERIMENTAL, DIGITAL_LAB, EXEMPLARY, FAILED_QUALITY_GATE, NEEDS_REBUILD,
BLOCKED_NEEDS_MODEL. Level 4+ requires the stated behaviour to actually
exist; a route, a render or a nice UI is not completion. One excellent
simulation outranks ten fake ones — coverage is never bought with quality.
The manifest (app/src/manifest/simulations.json) carries both fields; the
acceptance harness (app/src/sims/acceptance.test.ts) and
docs/QUALITY_STATUS.json are the evidence trail. Experience types: full
experimental simulation / interactive scientific visualization / interactive
mathematical model / structure exploration / reference content — reference
content is never called a simulation.
