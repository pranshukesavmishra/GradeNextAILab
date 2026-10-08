# Builder guide — G6+ unit experiments

You are building ONE experiment from the founder's spec book (docs/experiment-specs/<unit>/).
The exemplar is `app/src/sims/g6/a1-1-unplug-the-aquarium.ts` — open it once, copy its shape.
This guide is the contract; the spec is the content. Read both, then build.

## The law (ADR-8 — quality never decreases)
A simulation is a real experiment: a causal model integrated live, controls that
measurably change it, measurements computed from state, failure states shown,
scenarios as predict-first labs. Never fake anything. The spec names the exact
fraud to avoid — build so that fraud is impossible.

## File and wiring
- One file: `app/src/sims/g6/<code>-<slug>.ts` (e.g. `a2-1-where-you-draw-the-line.ts`),
  exporting one `SimManifest` named `<camel>Sim`. id `"g6.a2-1"`, grades `[6]`, bands `["6-8"]`.
- Register: import + entry in `app/src/sims/registry.ts` (keep the g6 block together).
- Curriculum: in `app/src/curriculum/grade6.ts`, set the matching subtopic's
  `sims: ["g6.a2-1"]`.
- Subject must be one of the legal `Subject` union values (see @engine/types).

## The manifest, in exemplar order
1. **Constants block** — every rate, threshold and unit from the spec's model section,
   each with a one-line comment saying what it is (and `// spec:` where the spec fixes it).
   Real values, SI units, no magic numbers inline.
2. **State interface** — the stocks/agents/state-machine state. Numbers and small arrays.
3. **Pure helpers** — rate laws as named functions.
4. **`init(params, ctx)`** — deterministic; seed-driven via `ctx.rng` only.
5. **`step(state, dt, params, ctx, inputs)`** — PURE. dt is hours or seconds as the
   spec's tick defines (exemplar: 1 tick = 1 sim minute, `timeComp` dial scales sim-time
   per real second). No Date.now, no Math.random. Events (thresholds, failures) set
   named state flags. Every coupling the spec names is a term here; every honesty rule
   ("must never...") is enforced structurally (e.g. loose-parts zeroes the coupling
   constants, colony reads flow, boundary never changes rates).
6. **`readouts(state)`** — the spec's measurements, computed from state, `graphable: true`
   for what the spec graphs. ALWAYS finite (validity-flag boolean + finite placeholder if
   a value starts undefined). Correct units and labels.
7. **`facts(state, params)`** — everything lab checks need: thresholds crossed, phase
   flags, crossing times, counts. All numeric facts finite always.
8. **`render(rc)`** — Canvas 2D, whole apparatus visible, cause drawn on objects
   (flows, arrows, glow, distress), failure states drawn and named soberly. Use the kits
   (@ui/labware, scene, organic, fauna, charts, draw). Theme-aware (light/dark via
   `rc.theme`), vivid, NO emoji. `draw3D` only where it genuinely helps, 2D fallback.
   The spec's `view` control (if any) switches scene panels honestly.
9. **`labs`** — one lab per spec scenario, 5-ish steps each, FIRST step is a predict
   (`predict:` with options), later steps `check:` against `v.facts`. Copy the exemplar's
   voice: short imperative instructions, checks that a student can actually cause.
10. **`challenges`** — the spec's assessment/what-if items, 2 is typical.

## Verification (before you say done)
From `app/`: `npx tsc -b --noEmit` (zero errors — strict, unused imports fail),
`npx vitest run` (the acceptance gate auto-covers your sim: finite readouts/facts,
clock advances, determinism, clean reset — plus every existing test),
and your own science test file `app/src/sims/g6/<code>.test.ts`: assert the spec's
causal claims actually hold (drive a control, watch the measurement respond; run the
failure cascade; verify the honesty rule), determinism, reset.
Then `npm run build`. All green or you are not done. Do NOT git commit.

## Style
Match the exemplar exactly: comment density (explain physics/contracts, never narrate
edits), naming, section banners. British-neutral plain prose in student-facing text.
No emoji anywhere. Keep each file self-contained; shared helpers only from @ui/@engine.
