# Fast Build Plan — all of Grades 6–8 in 24–48 hours

*Written 2026-10-01 at the founder's request: finish every Grade 6, 7 and 8 topic in 24–48 hours,
drop the slow method, raise — never lower — the quality: "high level of graphics, high level of
work in the experiment and high level of control workings", "more controls … that make sense",
"experimentally correct", "check three times … a fast checking". This plan **replaces the
process parts** of `docs/BATCH_PLAN.md` Part A and memory §0/§2.11. The science, the mandates
(memory §2.1–§2.8) and the lab specification (InsightVis §14) are unchanged. BATCH_PLAN Part B
stays the content source: what each lab computes, its set-ups, its traps.*

## 1. Why the old way was slow

| Old | Cost | New |
|---|---|---|
| One lab at a time, one session | 8 labs built, 77 to go | **Unit lanes in parallel** (§3) — 8 at once |
| Every lab built serially to one template | slow | **No fixed limits**: each topic gets the set-ups, controls and visualisation that make it extraordinary (founder, 2026-10-01) |
| A new figure library per lab, built and tested in grids first | hours per lab | **One library per unit** (`art-g<unit>.js`), extended by its labs; reuse the 15 existing libraries first |
| Screenshots of every set-up × preset × width × 8–12 camera angles, looked at one by one | the slowest step | **One contact sheet** (`ship.mjs`) — every set-up, every preset, 390 px — read in one look |
| `audit`, `live`, `probchk`, `narrow` run by hand, problems checked digit by digit by eye | many runs | **`node ship.mjs <id>`** — numbers, controls, mounts, sheet in one command |
| One shared catalogue file and one shared test file | parallel work collides | **One file per unit** (`app/src/curriculum/ms/g<unit>.ts`, `ms/g<unit>.test.ts`, a marked block per unit in `smartlab/index.html`) |
| 1,100-line memory read in full each session | slow start | Lanes read the **lane brief** (`docs/LANE_BRIEF.md`) only |

## 2. The quality bar — higher than before

- **The reference is the best InsightVis labs** (`sims-physics10.js`, `sims-physics11.js`,
  `sims-biology.js`, `sims-organic.js`) and the best of Unit A/B (`sims-g6b-2.js`). Every new lab
  must look at least as good: lit, volumetric 3D bench or textbook-plate stage, real apparatus,
  dense labelled structure, the dark instrument console.
- **The 37 React keepers are superseded, not copied**: where a keeper covers a topic, the new lab
  must clearly beat it — more set-ups, real apparatus, real equations, more controls. The keeper
  stays linked beside it as a second resource.
- **Controls: as many as the experiment has, every one meaningful** — each is a variable a scientist would change
  in that experiment (a lamp's distance, a salt concentration, a slope's angle), changes the
  computed model, moves a readout or plot, and is grouped by the part of the apparatus it belongs
  to. No decorative or duplicate controls. Primary variables are drag handles on the stage too.
- **Experimentally correct**: real equations, SI units, published constants; each lab names and
  reproduces 3+ published or textbook numbers in its unit test file.

## 3. How the work is split

- **17 lanes, one per unit** still to build (6B finishes B3–B6; 6C … 8F in full). Each lane is one
  builder agent working in its own git worktree, building its unit's labs in BATCH_PLAN order:
  library first, then lab 1, 2, … each finished and committed before the next.
- **At most 3 lanes at once**, refilled one by one as each finishes (§5).
- **A lane touches only its own files**: `smartlab/art-g<u>*.js`, `smartlab/sims-g<u>-<n>.js`,
  its block in `smartlab/index.html`, `app/src/curriculum/ms/g<u>.ts` and `ms/g<u>.test.ts`,
  `docs/labs/<u>.md` (its build notes and calibration constants). Never the engine core, other
  units, `memory.md` or the shared app pages — those belong to the integrator.
- **The integrator** (the main session) merges each finished lane, runs the full gate, reviews the
  contact sheets, updates `memory.md`, pushes.
- **Existing work is linked now**: the 37 keepers and the relevant Higher Secondary labs are mapped
  onto the Grade 6–8 subtopics they genuinely teach (never a wrong fit), so every unit has
  something live before its new lab lands.

## 4. Definition of done — the three checks

A lab ships when all three pass:
1. **Numbers** — `ms/g<u>.test.ts` holds the model to 3+ published values; `ship.mjs` holds every
   problem's measure to the bold answer in its working.
2. **Controls** — `ship.mjs` runs `live.mjs <id> --presets`: every control in every set-up and
   preset moves the model; every set-up and preset mounts with no page error, no NaN.
3. **Eyes** — the builder opens every `sheet-<id>-<k>.png` (6 tiles a page) and checks every tile: real objects (no boxes,
   blobs, cartoons, faces), nothing overlapping or clipped, labels legible, the 390 px tiles usable.
   Anything wrong is fixed and the sheet is re-made.

Plus the repo gate (`cd app && npx tsc -b --noEmit && npx vitest run && npm run build`). The full
`audit.mjs` (all 50+ labs, ~1 min) runs once per merge, by the integrator.

## 5. Order

**At most 3 lanes run at once** (founder, 2026-10-01: rate limits; one failure must not take
everything down). Teaching order: 6B · 6C · 6D → 6E · 6F · 7A → 7B · 7C · 7D → 7E · 7F · 8A →
8B · 8C · 8D → 8E · 8F. When a lane finishes it is merged and checked, and the next one starts.
Lanes started earlier and then paused resume from their own commits and their "Resume here" notes.

Each lane's unit report is its contact sheets; the founder reviews per unit on the live site.
