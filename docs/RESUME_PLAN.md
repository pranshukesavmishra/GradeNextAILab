# GradeNext Smart Lab — where we are, and what to do next

Written at the point the weekly limit was reached. Read this first when work
resumes; it is meant to be enough to restart without re-deriving anything.

---

## 1. State of the platform

**It is usable right now.** Typecheck clean, 344 tests passing, production
build green, deployed.

- **Live:** https://pranshukesavmishra.github.io/GradeNextAILab/
- **Branch:** `claude/gradenext-smart-lab-plan-yba89q` — every push auto-deploys
  after typecheck, tests and build pass, so a broken version cannot reach students.

| | Count |
|---|---|
| Simulations registered and working | 66 |
| Curriculum topics (Grades 6-8) | 100 |
| Curriculum subtopics | 521 |
| Formulas in the Formula Lab | 102 |
| Tests passing | 344 |

### What is finished

- **Curriculum** — Grades 6, 7 and 8 encoded exactly from the syllabus PDFs
  (34/33/33 topics, 190/166/165 subtopics) with NGSS codes per topic.
- **Course Library** — grade → unit → topic in teaching order, with coverage bars.
- **Brand** — palette sampled from the official brand assets: primary `#703880`,
  gold `#F8C038`, sky `#58B8F8`, lilac `#D8C8E0`. Light and dark both rebuilt on it.
- **Icons** — every emoji replaced by a drawn SVG set on a 24-unit grid.
- **Formula Lab** — 102 formulas, each with symbols, units, a worked example and
  a caution. The test suite recomputes 95 worked examples from their own numbers
  and was mutation-tested to prove it catches errors.
- **Rendering kits** — `organic.ts` (membranes, nuclei, mitochondria with
  cristae, ER, chloroplasts, Golgi, viruses, bacteria, specimen jars, magnifiers,
  callouts) and `labware.ts` (beakers, flasks, test tubes, liquids with a real
  meniscus, Bunsen flames, springs, carts, filament bulbs, batteries, magnets).
- **Archetype engine** — simulations written as content instead of code.

---

## 2. The archetype engine — read this before building anything

This is the most important thing to understand on resuming.

Hand-writing a simulation costs an agent 40-80k tokens, so 450 of them is roughly
22 million — unaffordable — and it produces 450 separately-invented renderers whose
quality drifts. Instead, most science interactions are one of seven shapes:

`sort` · `explore` · `investigate` · `process` · `assemble` · `compare` · `trace`

Each shape is written once in `src/engine/archetypeSim.ts` and drawn through the
kits above. A simulation then supplies only what is unique to it — its specimens,
its categories, its variables, and the function that computes the real science.

**The economics, measured on the first topic built this way:**

| | Hand-written | Archetype |
|---|---|---|
| Cost per simulation | 40-80k tokens | ~2k tokens |
| Grade 6 topic B1 (5 sims) | ~7,500 lines | 180 lines |
| Full 450-sim catalogue | ~22M tokens | ~1M tokens |

Quality goes **up**, not down: when specimens were found to be rendering too small
in a mostly empty stage, fixing the layout maths in one place fixed every
simulation built on the engine. That same property is how existing simulations get
upgraded — move them onto the engine rather than rewriting each one.

**Worked example to copy:** `src/sims/topics/g6b1.ts` — five distinct simulations
for "Cells: the basic unit of life", verified on screen.

---

## 3. What to do next, in order

### Step 1 — Generate the remaining Grade 6 topics (~28 topics)
Write content specs in `src/sims/topics/g6<unit><n>.ts`, following `g6b1.ts`.
Four to five simulations per topic, each covering one or two adjacent subtopics,
every subtopic covered by something. Read the subtopic list from
`src/curriculum/grade6.ts` — it is the definitive source.

Batch **8-10 topics at a time**, then register, verify and commit. Do not exceed
that: a 100-agent fan-out was tried and returned nothing (see §5).

### Step 2 — Verify a sample on screen
After each batch, screenshot two or three of the new simulations and judge them
against the founder's reference standard (§4). Fix in the **engine**, not in the
individual files — that is what keeps quality uniform.

### Step 3 — Grades 7 and 8 (~66 topics)
Same process. Chemistry and physics topics lean on `labware.ts`; earth and space
topics will want a few new primitives (strata, plate cross-sections, orbital
diagrams) added to the kit first.

### Step 4 — Move the 61 existing simulations onto the engine
This is the "upgrade the existing ones" half. Most map cleanly onto an archetype.
The dozen genuinely bespoke ones (circuits, optics, gas laws) keep their own
renderers — they earn the cost.

### Step 5 — Wire the curriculum
Replace the shared-simulation mappings in `src/curriculum/grade*.ts` with the new
per-topic simulation ids, so each topic points at its own dedicated simulations
rather than reusing one across many topics.

---

## 4. The visual standard

The founder supplied photoreal 3D educational renders as the reference. What that
means concretely, and what the kits already provide:

- Translucent membranes with light scattering through them and a wet rim
- Mitochondria with **visible folded cristae** — the folding is why the organelle
  works, so drawing it is teaching, not decoration
- Glassware with a thick rolled rim, a bright vertical highlight, and a **curved
  meniscus** — the meniscus is how you read a volume
- Filament bulbs that genuinely brighten with current
- Labels in dark pills on leader lines, sitting **clear of the artwork**
- Soft depth backgrounds; the subject fills the stage
- One light direction (upper left) shared by every module, so specimens and
  apparatus read as one scene
- No emoji anywhere; no raw floats in readouts

---

## 5. Lessons that cost real budget — do not repeat

1. **Do not fan out 100 agents.** It was tried: ~1.3M tokens spent, **zero**
   topics completed. Every agent was killed mid-write by the session limit.
   Throughput is capped by the token budget, not by how many agents start.
   **Batch 8-12, finish, commit, repeat.**
2. **Agents must checkpoint after each simulation.** The same run lost everything
   because agents held five finished sims in memory and wrote them at the end.
   The brief in `.workflows/build-topic-sims.js` now requires writing sim 1 to
   disk before starting sim 2.
3. **Assign one agent per file.** Two agents once wrote `g6/a1.ts` simultaneously
   and produced a file with interleaved content from both that compiled for
   neither.
4. **Keep workflow scripts in the repo.** A container restart made an earlier run
   unresumable because the script existed only in the session directory. It now
   lives in `.workflows/`.
5. **Do not patch partial work into merely compiling.** Incomplete drafts are
   quarantined behind the `_` prefix that the typecheck excludes
   (`src/sims/g6/_*.draft.ts`) and rebuilt properly.

---

## 6. Open decisions for the founder

1. **Scope order** — finish Grade 6 completely before starting 7 and 8, or spread
   across all three? Recommendation: finish Grade 6, so one complete grade reaches
   students sooner.
2. **The 12 bespoke simulations** — three agents were part-way through upgrading
   cell, pH lab, states of matter and optics when work paused. Their partial work
   is committed and green. Finish them, or move them onto the engine instead?
3. **Grades 1-5 and 9-12** — the curriculum encoding only covers 6-8. Supplying
   those syllabus documents is what unblocks the rest.

---

## 7. Restarting quickly

```bash
cd app
npm ci
npx tsc -b --noEmit && npx vitest run && npm run build   # expect green, 344 tests
npx vite dev                                              # local
```

The topic-build workflow, if used again:

```
Workflow({ scriptPath: ".workflows/build-topic-sims.js", args: [ ...8-10 topics... ] })
```

Topic payloads are `{grade, unit, unitTitle, subject, topic, topicTitle, standards}`;
agents read the subtopic list from `src/curriculum/` themselves.
