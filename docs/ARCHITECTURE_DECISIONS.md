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

## ADR-5 · The Rig Engine is the scene engine (2026-09-03)
Four independent architect designs (physics, pedagogy, visual, scale lenses)
were judged by three independent judges: unanimous for the physics design,
the Rig Engine, with mandatory grafts from the pedagogy design (predict gate,
continuous-run mode, confront-from-own-runs labs) and named pieces of the
visual and scale designs. Deciding argument: bindings receive (state, params)
and never a time parameter, so the condemned wall-clock-decoration failure is
unwritable at the type level rather than discouraged by review. The full spec
is docs/SCENE_ENGINE_SPEC.md (definitive; builders implement from it alone).
Key contours: engine code in app/src/engine/rig/ (additive; existing
engine/types.ts untouched apart from §2.6 seam changes), shared physics kits
in engine/models/, actor registry wrapping the surviving 2D/3D kits, prebuilt
rigs in sims/rigs/, one file per experiment in sims/experiments/<topic>/,
two-tier lint mapping the founder's seven-point bar to machine checks run per
experiment in CI, migration keeps buildSim coexisting with buildExperiment
with a visible burndown via manifest.engine. Budget ~6.0M tokens with the
verifier pass protected — never cut verification to fit construction.
