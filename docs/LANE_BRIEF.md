# Lane brief — building one unit of Grades 6–8 Smart Labs

You are a **lane**: you build every lab of ONE unit, at the highest quality, fast. Your unit and
its lab list are given in your task. This brief is your contract; `docs/FAST_BUILD_PLAN.md` is
the why. Work only in your own git worktree.

## 0. Setup (once)
```
cd <your worktree>
ln -s /home/user/GradeNextAILab/app/node_modules app/node_modules
ln -s /home/user/GradeNextAILab/smartlab/node_modules smartlab/node_modules
```
Never run `npm install` or `playwright install`. Chromium: `/opt/pw-browsers/chromium-1194/…` (the
harness already points there).

## 1. Read first (targeted — do not read huge files whole; use grep / sed ranges)
1. `memory.md` §2 (the mandates — binding), §6 rules 11–20, §8, §14, §15 (lessons: real bugs, avoid them).
2. `docs/insightvis/memory.md` §14 (the lab specification, every field) and §2.7, §2.8, §2.9,
   §2.12, §2.13 (the plate standard, rendering layer, the look, 3D benches, drag gains).
3. `docs/BATCH_PLAN.md` — your unit's entries: what each lab computes, its set-ups, its traps.
4. `app/src/curriculum/grade<N>.ts` — your unit's topics and subtopic codes (ground truth).
5. A reference lab for structure: `smartlab/sims-g6b-2.js` (registration from ~line 1240; models
   at the top, drawing in between). For the 3D bench / look: one of `sims-physics10.js`,
   `sims-physics11.js`, `sims-biology.js` (grep for `drawStage`, `R3.`, `BENCH.`).
6. Figure libraries that already exist — **reuse before you draw**: `render.js` (RX), `render3d.js`
   (R3), `bench3d.js` (BENCH), `art-physics.js`, `art-bio.js`, `art-zoo.js`, `art-organic.js`,
   `art-life.js`, `art-labware.js`, `art-earth.js` (globe), `art-geo.js`, `art-terrain.js`,
   `art-hydro.js`, `art-measure.js`, `art-micro.js`, `art-cell.js`, `kit-ms.js` (KITMS overlays).
   grep their exported names; memory.md §4 describes each.

## 2. Files you own — touch nothing else
- `smartlab/art-g<u>.js` (your unit's figure library; more files `art-g<u>-x.js` if needed)
- `smartlab/sims-g<u>-<n>.js` (one lab each, `<u>` like `6c`)
- your block in `smartlab/index.html` (between `<!-- unit 6C … -->` and `<!-- end 6C -->`; art first)
- `app/src/curriculum/ms/g<u>.ts` (catalogue rows) and `app/src/curriculum/ms/g<u>.test.ts` (model tests)
- `docs/labs/<u>.md` (your build notes: per lab, calibration constants verified, bugs found)
Never edit `lab-core.js`, `render*.js`, `bench3d.js`, other units' files, `memory.md`, `msLabs.ts`,
the app pages, or the frozen labs. If the engine truly needs a change, write it in your final
report instead.

## 3. The lab — what "high quality" means here (higher than the earlier Grade 6 labs)
- **No fixed limits — every topic extraordinary.** Before coding, think: how can THIS topic be made
  extraordinary in a smart lab — what can the student see that no textbook shows, what can they
  build, change, measure, break and predict? Give the topic as many set-ups and controls as that
  vision needs; each topic finds its own way. One lab per topic (or as BATCH_PLAN groups), a
  `setup` select (`restructure: true`), each set-up with `teaches: [subtopic codes]`; **every
  subtopic of every topic the lab claims is taught by some set-up**. A set-up earns its place by
  teaching something the others do not.
- **Real model**: the equations BATCH_PLAN names, integrated/solved every step, SI units, published
  constants. Before drawing, check the model numerically with a throwaway node script in the
  session scratchpad; each lab reproduces **3+ published/textbook numbers**, written as tests in
  `ms/g<u>.test.ts` (see `ms/g6b.test.ts` for the pattern — `engine.InsightLab.models[id]`, `defs`).
- **Real apparatus, drawn as the real thing** — lit, volumetric, labelled; a 3D bench (R3/BENCH)
  wherever the thing is three-dimensional; organisms, glassware, instruments, planets drawn
  properly. **No boxes, blobs, cartoons, faces, emoji, mascots.** Drawing lives in your art file,
  not in the lab file. Close-ups/cards via KITMS (`header`, `card`, `cardSlot` for phones).
- **Controls: as many as the experiment truly has, every one meaningful** — a variable a scientist would change in that
  experiment; grouped by the part of the apparatus (Set-up first, Display last); hidden with `when`
  where a set-up does not use them; real units/ranges incl. the failure; primary variables are
  also stage drag handles. View-only selects: `display: true` or `restructure: false`.
  Set-up defaults applied in `setup()` when the set-up changes; presets carry `pre: 1`.
- **Anatomy (InsightVis §14)**: presets (each an experiment), plots (this run; the
  landscape across conditions), readouts, live `equation` + `eqNote` (may be a function),
  problems (CAST pattern; `measure` reads the apparatus; the `working` ends with the answer in
  `<b>…</b>` — `ship.mjs` checks it), walkthrough steps (ask, then reveal), quiz questions,
  `notes` closing on the misconception to catch.
- **Registration fields**: `id: 'g<u>-<slug>'`, `grade`, `unit: '6C'`, `topics: ['C1']`,
  `subject` (the unit's: physics | chemistry | biology | earth | engineering), `chapter` (unit
  title), `name`, `exams: ['NGSS MS-…', 'CAST']`. Lab files must load without a DOM (the tests run
  them in a bare VM): registration and model may not touch `window`/`document`; drawing may.
- Determinism: every random stream and accumulator reset in `setup()`; animations a run depends
  on happen in `step()`.

## 4. Per lab: build → check three times → commit
1. Model in a scratch runner; numbers right.  2. Art (extend `art-g<u>.js`).  3. The lab file.
4. Script tags in your index.html block; catalogue row in `ms/g<u>.ts` (setups mirror the engine).
5. Check, from `smartlab/`:
   - `node ship.mjs <labId>` → must print **SHIP-CLEAN** (problems ✓, every control live in every
     set-up and preset, no page errors, no NaN, no sideways scroll at 390 px).
   - **Look** at every `smartlab/sheet-<labId>-<k>.png` with the Read tool (6 tiles a page) — every tile: real objects,
     nothing overlapping/clipped/empty, labels legible, the 390 px tiles usable. Fix, re-run.
   - `cd ../app && npx tsc -b --noEmit && npx vitest run src/curriculum && npm run build` green.
6. `git add` the exact files (never `-A`), commit `"Grade N Unit X, lab k: <name>"` with a body
   that names the science, the published numbers reproduced and the bugs found. Do not push.
Then the next lab. Write `docs/labs/<u>.md` as you go and commit it with each lab.

## 5. Fast and economical
Speed matters: the founder needs every unit as soon as possible. Keep moving; no idle polishing
of one tile while labs wait — but ship nothing below the bar.

Tokens are limited. Read with grep/sed ranges, not whole 100 KB files. No long explanations to
yourself; write code. Do not re-read a file you just wrote. But never skip a check.

## 6. Final report (≤ 15 lines)
Labs built (id, set-ups, controls count), SHIP-CLEAN yes/no each, test count, the absolute paths of
the contact sheets, anything not done or any engine change you need.
