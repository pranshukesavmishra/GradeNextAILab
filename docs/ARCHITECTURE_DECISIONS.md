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
