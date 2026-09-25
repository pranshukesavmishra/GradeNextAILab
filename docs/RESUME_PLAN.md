# Resume plan — GradeNext Smart Lab

**Paused:** 2 September 2026, second five-hour limit.
**Branch:** `claude/gradenext-smart-lab-plan-yba89q`
**Pull request:** [#2](https://github.com/pranshukesavmishra/GradeNextAILab/pull/2) (draft)
**Deploy:** GitHub Pages, run #42, triggered by the push at the pause.
**Everything below is committed and pushed. Nothing is in an unsaved state.**

Read this file first on resuming. It is written so no time is spent
re-discovering where things stand.

---

## 1. State at the pause

| | |
|---|---|
| Typecheck (`npx tsc -b --noEmit`) | **0 errors** |
| Tests (`npx vitest run`) | **347 passing** |
| Build (`npx vite build`) | **clean** |
| Topic files | **100 — the full Grade 6-8 syllabus** |
| Simulations | **521** |
| Subtopics with a simulation of their own | **521 — every one, none shared** |
| Simulations with a `drive` | **339 of 521** |

Run the three checks from `app/` to confirm nothing drifted while paused.

**The catalogue is complete.** Grade 6, 7 and 8 — 6 units each, 100 topics,
521 subtopics — every subtopic has its own simulation and no simulation stands
in for a second lesson.

---

## 2. What this session added

### The clock — the most important fix

Every simulation in the catalogue was **frozen at zero seconds**. Nothing
moved, no process advanced, and every `drive` reading `t` produced its value at
t = 0. This is precisely the "most of these do not work" complaint.

The animation loop measured its delta from the timestamp the frame callback is
handed and compared it against a `performance.now()` captured when the loop was
set up. Those two can disagree: on a slow start-up the first frame arrives
carrying a timestamp from *before* the loop existed, so the first delta is
large and negative, the runner's fixed-step accumulator lands around minus
twenty seconds, and from there it never again reaches a single tick.

It failed silently and everywhere, and the type-checker, the unit tests and a
still screenshot all reported it as fine. Both ends are now guarded, and
`src/engine/engine.test.ts` has four regression tests so it cannot return.

### `drive` — the apparatus answers the controls

`ArchetypeSpec.drive({ v, f, t, specimen, index })` returns `level`, `color`,
`bubbles`, `precipitate`, `scale`, `offset`, `spin`, `tilt`, `glow`, `rate`.
339 simulations now use it: a cart that moves the distance it actually
travelled, a lamp whose glow is its real power in watts, a flask that fills and
boils, a cell that swells by the cube root of its relative volume, a population
that grows and crashes.

Worked example: `MEMBRANE` in `src/sims/topics/g6b2.ts`.

### 3D, and the ability to turn it

- Dragging the stage **orbits the specimen**. A three-dimensional thing you
  cannot turn is a photograph of one. Once the student takes control the idle
  rotation stops; a pointer that travelled is a turn and not a tap.
- Glassware reads as glass: three surfaces per wall so it shows at the
  silhouette, rolled rim, beaker spout, hemispherical test-tube foot, concave
  meniscus, bubbles, and an opaque liquid (a transmissive liquid inside a
  transmissive vessel sorts behind the glass's own highlights and reads white).
- A studio environment map — metal has no diffuse colour of its own, so a
  metallic material with nothing to reflect renders black.
- Subjects are normalised by their bounding-sphere radius, which is
  rotation-invariant, and framed by a one-unit frustum, so nothing is ever
  cropped at any angle.

### Layout and legibility

- **Trace** was a dashed zigzag between grey dots. It is now a smooth
  Catmull-Rom vessel with a wall, a lumen and a highlight, lit station chambers
  carrying their own names, and a parcel with followers so the flow has a
  direction.
- **Explore/assemble** labels sat at the far edges of the stage on leaders that
  crossed the artwork and each other. Each now sits beside the part it names.
- **Sort**'s jar was a narrow column in a wide stage and the specimen's name
  was a pill at the far right. The jar fills its space; the name sits under it.
- Callout notes are capped and wrapped; comparison captions wrap to their own
  column; the stage rail's end labels align inward; the jar title is sized to
  its collar.

### Guided labs, generated from the science

`autoLab` and `autoChallenge` sample a specification's own `measure` across its
control range, work out what the response actually does, and build a six-phase
lab: question → predict-before-run → set up → measure five spread readings →
analyse → conclude, plus a challenge with three star thresholds. The answer key
is computed from the science, so it cannot drift from it.

### Safety nets

- `src/ui/ctxGuard.ts` — an art routine that calls `save()` without `restore()`
  leaves a clip behind and silently blanks everything drawn after it. Art now
  runs inside a guard. Probing found three real imbalances.
- `scripts/wire-topics.mjs` regenerates `registry.ts` from the files on disk.
- `scripts/wire-curriculum.mjs` points each subtopic at its own simulation.
- `scripts/health.mjs` loads every simulation in Chromium on software GL.

---

## 3. Resume here — in this order

### Step 1 · Confirm the baseline (2 minutes)

```
cd app
npx tsc -b --noEmit && npx vitest run && npx vite build
```

### Step 2 · Finish the `drive` backfill — 182 simulations

339 of 521 have one. The rest are mostly `sort` archetypes (correctly left
alone, their specimens are inert) plus the tail of the units whose agents were
stopped mid-file. Audit first, then fan out:

```
node -e 'const fs=require("fs");for(const f of fs.readdirSync("src/sims/topics")){const s=fs.readFileSync("src/sims/topics/"+f,"utf8");const n=(s.match(/^export const \w+ = buildSim\(/gm)||[]).length;const d=(s.match(/^\s*drive:/gm)||[]).length;if(d<n)console.log(f,d+"/"+n);}'
```

Four agents, split by grade, each owning its own files. Contract:
`.workflows/SLICE_BRIEF.md`. **Each must verify by driving the slider to both
extremes, screenshotting, and reading both images back** — if the apparatus
looks identical at both ends, the `drive` is doing nothing.

### Step 3 · Central verification pass

```
node scripts/wire-topics.mjs && node scripts/wire-curriculum.mjs
npx vite build && npx vite preview --port 4174 &
node scripts/health.mjs --port 4174 --jobs 4
```

Health must read `OK n/n`. **A health run was in flight at the pause and its
result was not seen** — re-run it first thing.

Then screenshot one simulation of each of the seven archetype kinds in both
themes and read them back. The dark theme has not been reviewed at all this
session; that is the largest unchecked surface.

### Step 4 · Quality sweep on the 3D subjects

The subjects that have been visually reviewed are cell, plant cell, cart,
molecule, beaker and flask. Not yet reviewed: organelle, microbe, atom, DNA,
planet, spring, stand, lamp, battery, magnet, burner, test tube. Probe them the
way `docs` describes — a grid harness, screenshot, read it back — and fix what
looks wrong.

### Step 5 · Deploy and hand over the link

The Pages deploy runs on every push to this branch and is gated on typecheck,
tests and build.

---

## 4. Standing instructions from the founder

Every one of these is a live requirement:

1. **3D and ultra visualisation on every simulation** — real geometry, real
   lighting, real occlusion.
2. **A working experiment, not a picture.** "You are just putting 3D images, I
   want a good efficient working simulation experiment related to that
   subtopic." `drive` plus the generated labs are the answer; finish the
   backfill.
3. **One simulation per subtopic** — done, and `wire-curriculum.mjs` keeps it
   that way.
4. **Vivid, real-life colour** in the brand's violet family. Never muted, never
   grey, never a small drawing in a large empty canvas.
5. **No emoji anywhere.** Professional icons and symbols; minimal text.
6. **Three checks on everything** — it compiles and the suite is green; it
   works in a browser; it looks right when the screenshot is read back. Three
   *different* questions.
7. **Many agents in parallel, quality rising with speed.** Ten ran
   concurrently this session without collisions.
8. **Formula Lab** — every formula the curriculum names. 102 formulas in 11
   groups are in `src/formulas/index.ts`; extend as the catalogue grows.

## 5. Blocked

**Grades 1-5 and 9-12** cannot be built: only the Grade 6, 7 and 8 syllabus
PDFs were supplied. Ask for the rest before planning that work.

## 6. Hard-won rules — do not relearn these

1. **Batch four to ten agents, never a hundred.** A 100-agent fan-out cost
   ~1.3M tokens and delivered nothing; every agent was killed mid-write.
2. **One agent per file, always.**
3. **Agents write incrementally** — one simulation reaches disk before the next
   begins, so an interruption costs one rather than all.
4. **Shared files are wired centrally by script**, never by an agent.
5. **Engine bugs are fixed centrally.** An agent that finds one reports it.
6. **Never trust a green typecheck as proof a simulation works.** The bug that
   made every archetype simulation unclickable, the one that left all 153
   frozen, and the negative-delta clock freeze all passed typecheck and tests.
7. **A still screenshot cannot tell a running simulation from a frozen one.**
   Compare two screenshots taken seconds apart, or drive a control and compare.
8. **Agents leave scratch files.** Sweep `app/` for `_*`, `zz*`, `dist-*` and
   stray `*.test.ts` before committing.
