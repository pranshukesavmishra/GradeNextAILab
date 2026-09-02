# Resume plan — GradeNext Smart Lab

**Paused:** 2 September 2026, at a five-hour usage limit.
**Branch:** `claude/gradenext-smart-lab-plan-yba89q`
**Pull request:** [#2](https://github.com/pranshukesavmishra/GradeNextAILab/pull/2) (draft)
**Everything below is committed and pushed. Nothing is in an unsaved state.**

Read this file first on resuming. It is written so no time is spent
re-discovering where things stand.

---

## 1. State at the pause — all green

| | |
|---|---|
| Typecheck (`npx tsc -b --noEmit`) | **0 errors** |
| Tests (`npx vitest run`) | **344 passing** |
| Build (`npx vite build`) | **clean** |
| Topic files | **78** |
| Simulations built | **410** |
| Subtopics pointed at their own simulation | **405** |
| Topics with no file yet | **22** (Grade 8 units C, D, E, F) |

Run these three from `app/` to confirm nothing drifted while paused.

---

## 2. What was built this session

### The 3D layer — the founder's "make all 500+ simulations 3D"

- **`src/ui/three3d.ts`** — one shared WebGL renderer (contexts are scarce on
  Chromebooks), three-point studio lighting, a procedural environment map, and
  subject builders: cell, organelle, microbe, glassware, molecule, atom, DNA,
  planet, particles, apparatus.
- **`src/ui/render3d.ts`** — the compositor. `draw3D(ctx, subject, x, y, size,
  t, theme, opts)` draws one subject onto the 2D canvas *at the point the flat
  drawing would have happened*, so the z-order the renderers already establish
  keeps working and text stays crisp. Subjects are built once, cached by what
  they are, and normalised to a unit sphere so one `size` in pixels means the
  same thing for a cell, a helix and a flask. Falls back to 2D silently when
  WebGL is absent.
- Every archetype simulation takes this path automatically. No per-simulation
  work was needed.

**Do not go back to a whole-layer blit.** It was tried and it buries specimens
under any opaque background drawn afterwards — the sort archetype rendered an
empty jar because of it.

### `drive` — the founder's "I want a working simulation experiment"

`ArchetypeSpec.drive({ v, f, t, specimen, index })` returns `level`, `color`,
`bubbles`, `precipitate`, `scale`, `offset`, `spin`, `tilt`, `glow`, `rate`.
It runs every frame, so the apparatus answers the controls instead of standing
there while the readouts change.

Worked example: `MEMBRANE` in `src/sims/topics/g6b2.ts` — the red blood cell
visibly shrinks at 900 mOsm/L and swells at 100, scaled by the **cube root** of
relative volume.

**38 simulations have a `drive` so far. The other ~370 do not. This is the
single most important piece of unfinished work** — see §3.

### Guided labs, generated from the science

`autoLab(spec)` and `autoChallenge(spec)` in `src/engine/archetype.ts` sample
the specification's own `measure` across its control range, work out what the
response actually does, and build a six-phase lab from it: question →
predict-before-run → set up → measure five spread readings → analyse →
conclude, plus a challenge with three star thresholds. The answer key is
computed from the science rather than transcribed, so it cannot drift.

`buildSim` attaches these when a specification does not supply its own. The Lab
and Challenge tabs in the player were already wired and had no content.

### Art coverage

- `body`, `landform`, `creature`, `flora`, `habitat` art kinds are now wired to
  the anatomy, geo and fauna kits. They previously fell through to a plain
  violet disc.
- `src/ui/ctxGuard.ts` — a canvas state guard. An art routine that calls
  `save()` without `restore()` leaves a clip behind and silently blanks
  everything drawn after it, with the symptom appearing nowhere near the cause.
  Probing found three real imbalances.
- `labware.ts` restored and rebuilt: burner with a real inner cone, helical
  spring with front-and-back depth ordering, cart, retort stand, filament lamp,
  cell, bar magnet, optical glass, prism, optical bench, pulley, incline, metre
  rule, force meter, wire harness, resistor, capacitor, knife switch, panel
  meter, circuit board.
- Glassware in 3D: three surfaces per wall so glass reads at the silhouette,
  rolled rim, beaker spout, hemispherical test-tube foot, concave meniscus,
  bubbles, and an **opaque** liquid (a transmissive liquid inside a
  transmissive vessel sorts behind the glass's highlights and reads as white).

### Wiring scripts — nobody hand-edits shared files any more

- `app/scripts/wire-topics.mjs` — regenerates `registry.ts` from the topic
  files on disk. Two agents once wrote that file simultaneously and produced
  something that compiled for neither.
- `app/scripts/wire-curriculum.mjs` — points every subtopic at its **own**
  simulation, positionally. This is what fixes the founder's repetition
  complaint. Reports mismatches rather than guessing.
- `app/scripts/health.mjs` — loads every simulation in Chromium on software GL
  and confirms it draws and survives a click. Now runs with
  `--use-gl=swiftshader` so the 3D path is actually exercised.

### Bugs found and fixed

- Fractional `bubbles` rounded to zero, silently removing bubbles from every
  simulation written against the documented meaning of the field.
- Comparison captions did not wrap, so two panels' sentences printed on top of
  one another.
- Three unbalanced `save()`/`restore()` pairs in the art kits.

---

## 3. Resume here — in this order

### Step 1 · Confirm the baseline (2 minutes)

```
cd app
npx tsc -b --noEmit && npx vitest run && npx vite build
```

### Step 2 · Finish the catalogue — 22 topics, ~110 simulations

Grade 8 units **C, D, E, F** have no topic files. Everything else is built.

| Slice | Unit | Topics | Sims |
|---|---|---|---|
| 1 | G8-C Noncontact forces and fields | C1-C5 | 25 |
| 2 | G8-D Waves and information | D1-D5 | 25 |
| 3 | G8-E Space systems and deep time | E1-E6 | 30 |
| 4 | G8-F Evolution and biodiversity | F1-F6 | 30 |

Four agents, one slice each, one file per topic. The contract is
`.workflows/SLICE_BRIEF.md` — hand it to each agent and nothing else needs
explaining. `src/ui/waves.ts` and `src/ui/space.ts` already hold the art those
slices need.

### Step 3 · Backfill `drive` across the ~370 simulations that lack it

**This is the highest-value work remaining.** Four agents, split by grade:

| Agent | Files |
|---|---|
| 1 | `g6a1`-`g6a5`, `g6b1`-`g6b6` |
| 2 | `g6c1`-`g6c5`, `g6d1`-`g6d6` |
| 3 | `g6e1`-`g6e6`, `g6f1`-`g6f6` |
| 4 | `g7a1`-`g7a5`, `g7b1`-`g7b6` |

then a second round for `g7c`-`g7f` and `g8a`-`g8f`. These four agents were
launched and killed at the pause, so they start clean.

Each must verify by driving the slider to both extremes from playwright,
screenshotting, **and reading both images back**. If the apparatus looks
identical at both ends, the `drive` is doing nothing.

### Step 4 · Re-wire and verify centrally

```
node scripts/wire-topics.mjs        # registry
node scripts/wire-curriculum.mjs    # one sim per subtopic
npx vite build --outDir dist-main
npx vite preview --port 4174 --outDir dist-main &
node scripts/health.mjs --port 4174 --jobs 4
```

Health must read `OK n/n`. Two timeouts appeared once under heavy agent load;
they were load, not failures, and passed on a re-check.

### Step 5 · Deploy and hand over the link

GitHub Pages deploy is gated on typecheck, tests and build.

---

## 4. Standing instructions from the founder

Every one of these is a live requirement, not a completed task:

1. **3D and ultra visualisation on every simulation.** Real geometry, real
   lighting, real occlusion.
2. **A working experiment, not a picture.** "You are just putting 3D images, I
   want a good efficient working simulation experiment related to that
   subtopic." `drive` and the generated labs are the answer; finish rolling
   them out.
3. **One simulation per subtopic.** No simulation serves two topics unless the
   science genuinely recurs. `wire-curriculum.mjs` enforces this.
4. **Vivid, real-life colour** in the brand's violet family. Never muted, never
   grey, never a small drawing in a large empty canvas.
5. **No emoji anywhere.** Professional icons and symbols; minimal text.
6. **Three checks on everything** — it compiles and the suite is green; it
   works in a browser; it looks right when the screenshot is read back. Three
   *different* questions.
7. **Many agents in parallel, quality rising with speed.** Batch four to six,
   one agent per file, agents never touch `src/engine/`, `src/ui/` or
   `registry.ts`.
8. **Formula Lab** — every formula the curriculum names. 102 formulas in 11
   groups are in `src/formulas/index.ts`; extend as the catalogue grows.

## 5. Blocked, and why

**Grades 1-5 and 9-12** cannot be built: only the Grade 6, 7 and 8 syllabus
PDFs were supplied. Ask for the rest before planning that work.

## 6. Hard-won rules — do not relearn these

1. **Batch four to six agents, never a hundred.** A 100-agent fan-out cost
   ~1.3M tokens and delivered nothing; every agent was killed mid-write.
2. **One agent per file, always.**
3. **Agents write incrementally** — one simulation reaches disk before the next
   begins, so an interruption costs one rather than all.
4. **Shared files are wired centrally by script**, never by an agent.
5. **Engine bugs are fixed centrally.** An agent that finds one reports it.
6. **Never trust a green typecheck as proof a simulation works.** The bug that
   made every archetype simulation unclickable, and the one that left all 153
   frozen, both passed typecheck and tests.
