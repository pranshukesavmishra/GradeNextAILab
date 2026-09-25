# GradeNext Smart Lab — Project Memory

> **Purpose of this file.** GradeNext Smart Lab is a long-running project spanning many work
> sessions. This file is the durable memory: the brief, the standing mandates, the decisions,
> the conventions and the state. **Read it before starting any work. Update it whenever a
> decision is made, a constraint is discovered, or an increment lands** — the founder asked for
> this explicitly ("every time update yours memory.md file too"). A stale memory is worse than
> no memory: fix anything here that no longer matches reality.
>
> Since 2026-09-25 this project is built **by the InsightVis process**. That process lives in
> `docs/insightvis/memory.md` (a verbatim copy — never edit it) and this file adopts it section
> by section. Where this file says *"InsightVis §x governs"*, read that section there; it is
> binding here exactly as written, with only the adaptations stated below.

Last updated: 2026-09-25 (v1 of the InsightVis-process memory)

---

## 0. Resume protocol — do this first, every session

1. Read this file top to bottom. Then read `docs/insightvis/memory.md` §2.11 (the build method)
   and §14 (the lab specification) — every new lab is built from those two.
2. `git status --short` and `git log --oneline -5` on branch
   `claude/gradenext-smart-lab-plan-yba89q`. Verify what is on disk before trusting §9.
3. Open `docs/BATCH_PLAN.md` at the batch §9 names as current, and continue with the next lab
   in it. One lab at a time, built to the end of the ship checklist (§2.11 step 9–10) before the
   next one starts.
4. Fresh container: `cd app && npm install`, and `cd smartlab && npm install` (the harness).
5. Never `git add -A`. `git status --short`, then stage the exact files.

---

## 1. Project identity

| | |
|---|---|
| **Name** | GradeNext Smart Lab — the virtual-laboratory wing of the GradeNext platform |
| **Owner** | The founder (GradeNext). Every verdict quoted here is theirs. |
| **Repository** | `pranshukesavmishra/GradeNextAILab`, working branch `claude/gradenext-smart-lab-plan-yba89q` |
| **Live site** | https://pranshukesavmishra.github.io/GradeNextAILab/ — deployed by `.github/workflows/deploy.yml` on every push to the branch (and to `main`) |
| **Open PR** | https://github.com/pranshukesavmishra/GradeNextAILab/pull/2 (draft) |
| **Track 1 — Middle School** | Grades 6–8, California Integrated Science (the NGSS integrated model). 18 units, 100 topics, 521 subtopics, encoded in `app/src/curriculum/grade6.ts`, `grade7.ts`, `grade8.ts`. Being rebuilt batch by batch (`docs/BATCH_PLAN.md`). |
| **Track 2 — Higher Secondary** | Class 11–12, JEE Main / JEE Advanced / NEET UG. The 42 InsightVis labs, merged intact on 2026-09-25. Route `#/hs`. |
| **Sister project** | `pranshukesavmishra/insightvis` — the source of the engine, the process and the Higher Secondary labs. **Read-only from this workspace** (we cannot push to it). |

---

## 2. The standing mandate — read this every session

### 2.0 The founder's directive of 2026-09-25 (verbatim — this governs everything below)

> "https://github.com/pranshukesavmishra/insightvis.git merege all the experiments of this github
> repository in a higher seconday section because these can be for both 11 and 12 grade. and
> qlso copy its memory.md file into you and work according to that , as these experiments are
> very best and you have to make like these or more better but follow the guidliness and process
> of this repository. and remove the grade 6 unit A experiment that you build last as they are
> too bad and rubish and pl,an a structure batch wise batch for each grade units , this time i am
> not forcing to make each experimemt for each subtopic , its on you however you build i just
> want that there should be multiple things to teach with experiments on a single topic , one
> more point that focus on the controls of experiments as they should be perfectly workint with
> multiple experiment controls which helps better into experiment and visualised learnings. copy
> its memory.md file and its processes to build and every time update yours memory.md file too.
> […] and higest qulity graphics and simulation max"

Read as six instructions, all permanent:
1. The InsightVis labs are **the bar** — "make like these or more better".
2. **The InsightVis process is the process** — its mandates, its build method, its spec, its
   harness, its ship checklist.
3. **One experiment per topic is fine; one idea per experiment is not.** Each lab carries several
   set-ups that teach several things on one topic (§2.6).
4. **The controls are the experiment** — many of them, all genuinely working (§2.7).
5. **Highest-quality graphics and simulation** — InsightVis §2.3/§2.4/§2.7–§2.9/§2.12 in full.
6. **Keep this file current, every time.**

### 2.1 Real working models, never decorative animation
InsightVis §2.1 governs. Every experiment computes the actual governing equations — integrated,
solved or summed — and every displayed quantity was calculated. This absorbs the older GradeNext
law *"never fake anything"*: a real causal model, every control measurably alive, measurements
computed from state, failure states shown, deterministic and finite always. **A fake simulation
is worse than an unfinished topic.**

### 2.2 The level: the top of the band, never down to it
**Higher Secondary** — InsightVis §2.2 governs unchanged (JEE/NEET difficulty, the traps
examiners set, second-order effects).

**Grades 6–8** — the same attitude, pitched at the right student:
- **The NGSS performance expectation says what the student must be able to *do*** — plan an
  investigation, analyse and interpret data, develop and use a model, construct an explanation,
  engage in argument from evidence. The lab is built so the student *does that act inside it*,
  not so they read about it.
- **The model under the hood is the one a scientist would write** — the heat equation,
  Stefan–Boltzmann, Henry's law, logistic growth, F = ma, Coulomb's law: real equations, real
  constants, real SI units — even when what the student reads off the screen is a comparison
  or a direction rather than a number.
- **The misconceptions students of this age actually hold are the traps** (heavier things fall
  faster; cold flows in; a plant's mass comes from the soil; seasons come from distance to the
  Sun; the Moon's phases are Earth's shadow; air has no weight; energy gets used up). Each is
  something the student can **drive the apparatus into** and watch fail (InsightVis §2.11 step 3).
- **The exam equivalent is CAST** — the California Science Test, taken in Grade 8 over every
  middle-school performance expectation. Worked problems are written in its pattern (a
  phenomenon, a data display, a claim to evaluate) and checked by the apparatus.
- **Assume the student is curious, bright and has never been shown the real thing.** Short
  sentences and plain words in the teaching text; no simplification of the science itself.

### 2.3 Graphics and UI/UX: no compromise, ever
InsightVis §2.3 governs. The founder's words: *"higest qulity graphics and simulation max"*.
Every stage looks like professional scientific instrumentation or a plate from a good
textbook — lit, volumetric, dense with labelled structure. If a choice trades visual quality
for convenience, make the other choice.

### 2.4 Things are drawn as the real thing — never boxes, blobs, cartoons or clip-art
InsightVis §2.4 governs, extended to every subject. The founder's verdict on the removed Grade 6
Unit A: *"the object and characters used are so silly and low quality"*. A fish is drawn as a
fish (fins, operculum, lateral line, scales, eye), a plant as a plant (stem, nodes, leaves,
roots, chloroplast-green tissue), a beaker as glass with a meniscus, a globe as a lit planet
with real continents and cloud, a thermometer with a bulb and a graduated bore. **No faces on
objects, no mascots, no emoji, no characters.** Everything goes through a figure library on
`render.js` (§2.11 step 4) so the suite looks like one instrument.

### 2.5 An experiment, not an animation and not a dashboard
The founder's other verdict on the removed unit: *"there is nothing of experiment type"*. Every
lab is an experiment in the laboratory sense:
- **Apparatus on the bench** — a physical set-up the student recognises (tank, bench, chamber,
  globe, stream table, track, shake table), drawn as §2.4 requires.
- **An independent variable the student changes, a dependent variable an instrument measures**,
  and the variables held constant named on screen.
- **A reading taken off an instrument** — a thermometer, a probe, a balance, a gate, a gauge —
  shown as the instrument would show it, beside the model's value (InsightVis 2026-09-23 (c):
  *"every value a meter shows must be the value a real instrument would give"*).
- **A result the student can record** (the lab notebook) and graph (the plots).
A ledger with sliders is not an experiment. A cartoon that plays when you press a button is
not an experiment.

### 2.6 Depth per topic — several things to teach in one experiment
The founder: *"i just want that there should be multiple things to teach with experiments on a
single topic"*, and *"this time i am not forcing to make each experiment for each subtopic"*.
InsightVis did the same from 2026-09-12 (*"depth over breadth"*) and its best labs carry 4–8
set-ups (gravitation 5, fluids 8).
- **One lab per topic** (occasionally one lab for two tightly linked topics). A lab is organised
  as **set-ups**: a `mode` select that changes the apparatus, each set-up teaching one or more
  subtopics of the topic, all set-ups sharing one bench, one model, one figure library.
- **Every subtopic of the topic is taught by at least one set-up**, and the Course Library links
  each subtopic to the set-up that teaches it (§8, set-up deep links). This is how the old law
  *"subtopic alignment — very very very important"* survives: not one sim per subtopic, but no
  subtopic left without the part of an experiment that teaches it.
- A set-up earns its place only if it teaches something the others do not. Two set-ups that
  differ only in numbers are presets, not set-ups.

### 2.7 The controls are the experiment — many of them, all perfectly working
The founder: *"focus on the controls of experiments as they should be perfectly working with
multiple experiment controls which helps better into experiment and visualised learnings."*
Rules, on top of InsightVis §14.3:
1. **Every control changes the computed model** — never only the picture — and the change is
   visible on the stage *and* in at least one readout or plot. `node audit.mjs` must print
   CLEAN; the audit's liveness check (§6 rule 13) must pass for every control of every set-up.
2. **Controls are grouped by the part of the apparatus they belong to** (*Light*, *Tank*,
   *Fish*, *Filter*), in the order a student would set up the real thing.
3. **Controls follow the set-up** — group- and item-level `when` hide what the current set-up
   does not use; nothing on the deck is inert.
4. **The primary variables are also drag handles on the stage** (InsightVis §2.11 step 7,
   §14.7, §2.13 gains), kept in sync with their sliders.
5. **Real units, real ranges, typed entry** — click a value to type it; log keys for quantities
   spanning decades; the range covers the whole phenomenon including its failure.
6. **Presets are experiments** (5–8 per lab; InsightVis §14.3) and must set every parameter
   they depend on.
7. **Fair-test support** — the ghost overlay and the notebook are the tools for "change one
   variable, hold the rest"; labs that teach investigation make the held variables explicit.

### 2.8 Quality never decreases
The oldest GradeNext law (ADR-8), kept: every efficiency measure must be quality-neutral or
quality-raising; at the first sign of slipping, revert immediately. Speed is never a defence.
And InsightVis §2.10's corollary: **a lab is not finished because it once shipped** — when the
bar moves, everything below it becomes work.

### 2.9 What is frozen
- **The 37 keeper simulations** of the React engine (`app/src/sims/`, listed in §4) are frozen
  as-is; they change only on the founder's explicit suggestion. They stay live and linked.
- **The 42 Higher Secondary labs** are InsightVis's work, merged verbatim. They change only by
  syncing from upstream (§8) or on the founder's explicit request.

### 2.10 CALIBRATION — the founder's verdicts, and what they mean

| Round | Verdict | What it means |
|---|---|---|
| React keepers, 37 sims (to 2026-09-10) | *"build like these for all subtopics"*, then *"i didn't like these so much… build and design at extra ordinary level"* | Acceptable, not the ceiling. Frozen and kept live. |
| Grade 6 Unit A, 27 React sims, one per subtopic (2026-09-06 → 09-12) | *"there is nothing of experiment type"*, *"the object and characters used are so silly and low quality"*, *"too bad and rubbish"* — **removed entirely on 2026-09-25** | **1053 passing tests, a clean acceptance gate and a three-pass alignment audit did not make them good.** The faults were all on the screen: cartoon objects and characters, dashboards and ledgers instead of apparatus, and one thin idea per sim spread across 27 sims. Correctness was the floor and was mistaken for the bar. |
| InsightVis, 42 labs (2026-09-25) | *"these experiments are very best and you have to make like these or more better"* | **The bar.** And InsightVis's own client scored them lower than they look — organic 50%, physics 40% before the 3D round (InsightVis §2.10) — so the ceiling sits above even them. What moved their score: **true 3D benches, apparatus the student drags into shape, predict-then-check problems, and new material rather than polish.** Start every lab there. |

**Never present a batch as finished because it verified clean.** Clean is the floor. The founder
judges what is on the screen; look at every screenshot as they would.

### 2.11 THE BUILD METHOD — InsightVis §2.11, adapted
InsightVis §2.11 is the procedure for every lab, in its order, with these adaptations:

- **Step 1 — Pick the lab from `docs/BATCH_PLAN.md`, in batch order** (teaching order), not by
  exam weight. Middle-school labs are pitched by §2.2 above. Check §4 so two labs never cover
  the same ground.
- **Step 2 — The real computation, and the rule as its output.** For Grades 6–8 "the rule" is
  the disciplinary core idea the performance expectation names (e.g. *thermal energy moves from
  hotter to colder until equilibrium*, *matter is conserved because atoms are*). It must be
  readable off the apparatus without ever being stated first.
- **Step 3 — Every grade-band misconception on the topic is a reachable trap** (§2.2).
- **Step 4 — Figure library first.** Middle-school subjects need libraries InsightVis never
  built (living things at organism scale, Earth and sky, the bench for grade-school apparatus).
  Build the library on `render.js` / `render3d.js` / `bench3d.js` before the first lab uses it,
  one library per domain, never drawing in a sim file. Record each new library in §4 and §8.
- **Step 5–8 — unchanged** (plate standard, two plots, drag handles, teaching text last and
  asking before telling), plus **the set-up structure of §2.6** and **the control rules of §2.7**.
- **Step 9 — Verify** with the harness (InsightVis §14.12) *and* look at every screenshot:
  every set-up, every preset, the orbit extremes for 3D benches, 430 px narrow. Then the repo
  gate: `cd app && npx tsc -b --noEmit && npx vitest run && npm run build`.
- **Step 10 — Ship the whole increment**: register the script in `smartlab/index.html` in
  order; add the lab to the GradeNext catalogue and link every subtopic it teaches to its
  set-up; update §4, §9 and §13 of this file; commit with a message that explains the science
  and names the bugs found; push (the push deploys the site).

### 2.12 InsightVis rules adopted by reference — binding here as written
Do not duplicate these; read them in `docs/insightvis/memory.md`:
§2.7 the plate standard · §2.8 rendering is a layer · §2.9 rich, volumetric, vivid, dense ·
§2.12 a 3D bench must read as the object it is (depth policy, occlusion by camera, labels by
projection, the orbit sweep) · §2.13 drag gains on compressed axes · §5 design system ·
§6 engineering rules 1–10 · §7 calibration constants · §8 conventions · §14 the lab
specification · §14.12 the harness · §14.13 numerical verification · §14.14 the ship checklist.

---

## 3. Scope

**Middle School, Grades 6–8** — California Integrated Science, in teaching order:
- Grade 6: A Systems and Subsystems · B Cells, Bodies and Senses · C Energy, Heat and Thermal
  Systems · D Water, Atmosphere and Weather · E Regional Climate, Organisms and Heredity ·
  F Global Warming and Human Impact.
- Grade 7: A Atoms and the Structure of Matter · B Chemical Reactions and Conservation of
  Matter · C The Chemistry of Being Alive · D Matter and Energy in Ecosystems · E Earth's
  Materials and Moving Plates · F Natural Hazards and Engineering Solutions.
- Grade 8: A Motion, Forces and Collisions · B Energy in Moving Systems · C Noncontact Forces
  and Fields · D Waves and Information · E Space Systems and Deep Time · F Evolution and
  Sustaining Biodiversity.

**Higher Secondary, Class 11–12** — Physics, Chemistry, Biology at JEE/NEET level (InsightVis
§3); continuation chapters are listed in `docs/BATCH_PLAN.md` Part C.

The grade-1–12 vision in `docs/SMART_LAB_PLAN.md` and `docs/SIMULATION_CATALOG.md` is the
long-range product plan; the curriculum files are the ground truth for what is taught.

---

## 4. What is built

**The site** (`app/`, React + Vite) — the shell: top bar, Courses (the Grade 6–8 course library
by unit → topic → subtopic), Higher Secondary, Simulations (catalogue), Formulas, Notebook.

**Higher Secondary** — 42 labs, 28 chapters (28 Class 11, 14 Class 12), all on the Smart Lab
engine, served at `smartlab/index.html` and framed by `app/src/pages/HigherSecondary.tsx`.
The catalogue list `app/src/curriculum/hsLabs.ts` is generated from the engine sources and
held to them by `hsLabs.test.ts`. InsightVis README §4 describes each lab.

**The 37 frozen keepers** (React SimManifest engine, `app/src/sims/`):
physics — collisions, em-spectrum, heat-transfer, kinetic-energy, motion-graphs, optics,
pendulum, sound, waves · chemistry — build-atom, conservation, gas-laws, heating-curve,
molecules, ph-lab, reactions, states-of-matter · biology — artificial-selection, body-systems,
carbon-cycle, cell, ecosystem, heredity, mutations, natural-selection, symbiosis · earth —
erosion, fronts, moon-phases, plate-tectonics, radiometric, rock-cycle, seasons, spheres,
unequal-heating, water-cycle, weather. Acceptance-gate triage: one open entry
(`phys.collisions` · `massB`, frozen, awaits the founder).

**Middle School on the Smart Lab engine** — Batch 1 (Grade 6 Unit A) in progress:
- **6A-1 The Living Tank — Parts, Boundaries and Flows** (`smartlab/sims-g6a-1.js`, id
  `g6a-living-tank`, topics A1–A2, 10 subtopics). A planted 54 L tank integrated as one system:
  18-state RK4 model (O₂ Benson–Krause, CO₂/DIC Weiss + Harned speciation by bisection, two-step
  Monod nitrification with Anthonisen inhibition, P–I photosynthesis for plants and algae, fish
  respiration Q10, thermostat heat balance, evaporation, redox bookkeeping Ω), boids shoal with
  rotational-diffusion noise and an angelfish with a confusion effect. Six set-ups: **unplug**
  (A1.1, A1.3: interaction web, the filter cut open with its two bacterial populations),
  **zoom** (A1.2, A1.5: planet → tank → fish → gill → cell → mitochondrion, ray-traced Earth and
  four textbook plates), **shoal** (A1.4: order Φ, blind runs against noise over four starts),
  **boundary** (A2.1, A2.5: draggable boundary, ledger that closes to model precision),
  **sealed** (A2.2: two sealed spheres, carbon conserved to 1e-14), **trace** (A2.3, A2.4:
  carbon atoms cycle, joules leave as heat, residence times against store ÷ flow). Phone layout:
  cards fold into chips, the zoom ladder becomes a rung strip.
- **6A-2 The Draining Tank — Building, Testing and Revising a Model** (`smartlab/sims-g6a-2.js`,
  id `g6a-draining-tank`, topic A3, 5 subtopics). A 10 cm × 60 cm clear column draining through a
  sharp-edged hole into a tray, read by an ultrasonic sensor (whole mm, noise). The apparatus:
  Torricelli with the vena contracta (Cd 0.61), Cd(Re) (Lienhard shape), surface tension holding
  2σ/(ρgd) of head, evaporation, a tap and a leak; the jet a true parabola that breaks into drops;
  the tray holds exactly what drained. Five set-ups: **why** (A3.1: a town's 1131 m³ tower loses
  its pump at 18:00 — the model answers first, the real evening shows it 2 h late for leaving out
  the leaking mains), **diagram** (A3.2: a stock-and-flow diagram whose valves are the bench's
  valves; the equation assembles from its arrows), **scale** (A3.3: 1:2 / 1:4 / 1:10 copies —
  half-times go as √size; the 1:10 stops, held by surface tension), **leaves** (A3.4: four effects
  switched in and out of the model, each with its measured share: 39 % / 0.4 % / 0.3 % / <0.001 %),
  **revise** (A3.5: constant, proportional and square-root models fitted by least squares; the
  residuals decide; validated on a tap-on run it never saw).
- **6A-3 Earth's Four Spheres — Rock, Water, Air and Life** (`smartlab/sims-g6a-3.js`, id
  `g6a-four-spheres`, topic A4, 6 subtopics). One planet, five experiments, each on a published
  model: **geo** (A4.1: a quake's P and S rays traced through isotropic PREM by the exact Δ(p),
  T(p) integrals; the globe cut in half with every layer at its PREM radius; the fan's wavefronts
  run in time; a draggable seismometer with its seismogram; aim one ray; make the outer core solid
  or the inner core liquid and watch the shadows come and go), **hydro** (A4.2: the USGS water
  balls to scale on North America, 300 tagged molecules hopping through an 8-store cycle
  (Gleick volumes, Trenberth flows) against the exact matrix exponential; melt the land ice →
  sea level), **atmo** (A4.3: a radiosonde on a latex balloon through the US Standard / AFGL
  tropical / subarctic-winter atmospheres; hydrostatic pressure; the balloon swells as T/P and
  bursts at its rated diameter; the view from the gondola ray-cast over a round Earth; discover
  the layers in the sonde's own readings), **bio** (A4.4: the Miami model over a Whittaker
  chart; 16 real places pinned on the globe; warm or wet a place and see which limit binds),
  **links** (A4.5, A4.6: carbon through air, land, three ocean layers and fossil fuels since
  1750 on recorded emissions, checked against Mauna Loa; switch off the ocean or plant growth;
  four futures to 2100).
- **6A-4 One Event, Four Spheres — Eruption, Hurricane, Wildfire, Drought** (`smartlab/sims-g6a-4.js`,
  id `g6a-one-event`, topic A4 shared with 6A-3; every set-up teaches A4.5 and A4.6). Four real
  events on a 3D landscape block, each a chain of published models checked against the event it
  copies; a card draws the four spheres, numbers every link, and says what crossed and how much.
  **eruption** (SO₂ above the tropopause → sulfate → a veil of optical depth 0.006 per Mt →
  forcing −25 W/m² per unit depth → the Geoffroy two-layer ocean → sea level and the land carbon
  sink; the column and umbrella over the cone, ash, lahars; a globe card with the veil spreading;
  Pinatubo −0.38 °C at 25 months, sea level −5.6 mm, CO₂ growth −1.0 ppm/yr), **hurricane**
  (DeMaria–Kaplan potential intensity from the sea's temperature, Atkinson–Holliday pressure,
  Holland winds, a bathystrophic storm tide across a concave shelf plus the inverse barometer and
  wave setup; marsh takes 0.07 m a km; Kraft's rain rule; Katrina, Camille, Ike and Andrew each
  within 15 % of the measured, in the right order), **wildfire** (McArthur fire danger and fuel
  moisture, Rothermel's wind and slope factors, Van Wagner's crowning, Byram's intensity and flame
  length; the fire runs over the terrain by minimum travel time; then a storm on the bare slope —
  curve number 55 → 85 — and the forest's return), **drought** (Hargreaves evaporation on Fresno's
  normals, a 150 mm soil bucket, canal water as the square of the rain, wells for the rest; the
  aquifer falls by the extra pumping ÷ 0.08; clay compacts 1/15 m per metre of new low head —
  Poland's benchmark pole; the ground never comes back).
- **6A-5 The Measurement Bench — Safety, SI Units and Honest Numbers** (`smartlab/sims-g6a-5.js`,
  id `g6a-measurement-bench`, topic A5 with 6A-6). Five experiments on one bench. **hot** (A5.1: a
  beaker heated on a hot plate looks exactly like a cold one; the touch is computed layer by layer —
  object, glove, skin — and the burn read off Moritz and Henriques's table; glass or steel, water or
  empty, bare, nitrile, heat mitts or tongs; a thermal camera that shows the heat, and shows shiny steel
  as cold), **acid** (A5.1: Thomsen's heat of dilution in a stirred beaker in a fume cupboard; water
  poured into acid boils where each drop lands, even slowly, even in ice; acid into water warms a large
  mass), **density** (A5.3: a balance, cylinders or an overflow can, six mystery minerals; parallax,
  the meniscus, the tare, ± half a division; can the method tell pyrite from hematite, is the nugget
  gold; g/cm³ and kg/m³), **timing** (A5.3, A5.4: a drop tower with a release clamp, two light gates
  and a stroboscope, a stopwatch started by a reacting partner or by yourself, a table of drops; what
  averaging fixes and what it cannot), **graph** (A5.4: the notebook table and graph paper — which
  axis, points or a line, the best fit, the outlier, time² that straightens, the axis that lies — and
  what a reader would conclude from it).
- **6A-6 The Fair Test — Variables, Evidence and Investigation Design** (`smartlab/sims-g6a-6.js`,
  id `g6a-fair-test`, topic A5 with 6A-5). A paper helicopter autorotating down a stairwell through two
  light gates. **fair** (A5.2: change one thing between A and B; the lab names the independent,
  dependent and held variables — and what changed anyway: longer blades from the same paper are
  heavier; an open window lifts the air), **trials** (A5.2, A5.4: two designs 5 % apart; the means and
  their uncertainties as drops add up, told apart when the difference is twice its uncertainty),
  **cer** (A5.5: a class table of 24 helicopters; five claims tested against the rows chosen as
  evidence — overstated, supported, not supported, contradicted, no evidence, unfair comparison, too
  little), **design** (A5.6: a planning board checked on five criteria before the plan runs exactly as
  written, and its result against the whole pattern).
- Shared overlay kit `kit-ms.js` (KITMS: header, card, cardSlot/chipHit for phones, fitText,
  wrapText, led, plotKey, dayAxis, secAxis, watch) — every Grades 6–8 lab from 6A-2 on uses it.
  A stage with several cards gets a row of chips on a phone, one card open at a time
  (`S.cardOpen` is the open chip's index).
- Figure libraries made for it: `art-labware.js` (aquarium kit: gravel, caustics, LED bar,
  hang-on filter with cutaway, heater, airstone, bubbles, thermometer strip, test kits),
  `art-life.js` (poseable neon tetra, angelfish, shrimp; cabomba, vallisneria; fish / gill /
  cell / mitochondrion plates with row-set labels), `art-earth.js` + `data-earth.js` (2048×1024
  Blue Marble and land mask, ray-traced globe with water-only glint); `art-hydro.js` (HYDRO:
  graduated clear column with water as a volume, brass orifice, parabolic jet breaking into drops,
  catch tray with ripples, lab tap and its narrowing stream, rotameter, ultrasonic sensor,
  stopwatch, tiled lab wall, water tower with level board, houses with lit windows);
  `art-geo.js` (GEO: the PREM interior face — layers coloured by heat, liquid core streaming;
  ray fans with wavefronts; quake star; seismometer; glassy water balls; map pins; flux arrows
  carrying particles; the view from a balloon — a ray-cast landscape under haze, perspective
  cloud decks, the horizon dipping and curving with height — the balloon, parachute and sonde).
  `EARTH.trace` gained an optional `cut` (a half-space removed, its face painted by a callback);
  without it every globe renders exactly as before. `art-terrain.js` (TERRAIN: a height-field
  landscape block lit and painted per cell, drawn far to near with the things standing on it;
  water with shorelines, depth colour, glint and Fresnel; cut faces showing strata, the water table
  and the sea; trees in six states from live to burnt to sprouting; houses that flood; smoke and
  ash plumes; rain; a benchmark pole). `art-measure.js` (MEAS: an epoxy bench and tiled wall; a ceramic-topped
  hot plate with knobs and a hot-top light; glass and steel beakers with boiling and steam; tongs, mitts,
  a glove box, a heat-proof mat; the thermal camera's palette and emissivity; the skin-section plate; a
  fume cupboard, stirrer bar, graduated dropping funnel, reagent and wash bottles with the GHS label, an
  ice bath, spatter; a top-loading balance, weighing boat, graduated cylinders with a real meniscus, an
  overflow can, six minerals in their habits and lustres, a specimen tray, the parallax magnifier; a
  drop tower with release clamp, flat light gates and sand box, steel / glass / ping-pong balls; the
  paper helicopter, the drop frame and a wall tape).
- In the app: `app/src/curriculum/msLabs.ts` (catalogue; `msLabs.test.ts` VM-loads the engine's
  `sims-g*.js` files and holds the two to each other, checks every claimed topic is fully taught,
  runs every set-up headless, and checks the model's numbers), `app/src/pages/MiddleSchoolLab.tsx`
  (framed lab with set-up tabs at `#/ms/<lab>/<setup>`, route ⇄ frame both ways), and Course
  Library buttons that open the exact set-up that teaches a subtopic (coverage counts them).

**Engine** (`smartlab/`, from InsightVis at `657e3ab`): `lab-core.js` (registry, console,
control deck, multi-plot, walkthrough, quiz, notebook, camera, drag handles), `render.js`
(RX volume pass), `render3d.js` (R3 frame, depth sort), `bench3d.js` (BENCH apparatus),
`solve.js`, `mech.js`, figure libraries `art-physics.js`, `art-bio.js`, `art-zoo.js`,
`art-organic.js`, `art-animalia.js`, data `data-animalia.js`, and the `sims-*.js` lab files.
Harness: the `.mjs` files (never shipped; `app/vite.config.ts` ships only top-level `.js` and
`assets/`). GradeNext's own: `live.mjs` (§6 rule 13).

---

## 5. Design system

**Inside the Smart Lab engine: InsightVis §5 governs, locked** — the dark-committed instrument
console, ink ramp `#05080F → #1A2439`, text `#E7EDFB / #98A6C6 / #63729A`, IBM Plex Sans
Condensed / Sans / Mono with Georgia italic maths, single-scale charts, subject accents grounded
in something real (`--phys #3DD6F5` oscilloscope phosphor, `--chem #FFAE4C` sodium flame,
`--bio #FF6B9D` eosin).

**GradeNext additions to the accent set** — middle-school units carry two subjects the engine
has never had, `earth` and `engineering`. Each gets an accent grounded the same way, chosen and
recorded here with the first lab that needs it, added to `SUBJECTS` in `lab-core.js` and to the
`--*` tokens and `[data-subject]` rules in `smartlab/index.html` (§8).

**The React shell** keeps the LabKit system (`docs/DESIGN_SYSTEM.md`, light and dark themes);
it frames the engine, whose stage stays dark in both.

---

## 6. Engineering rules

InsightVis §6 rules 1–10 govern inside the engine (correctness and prettiness both; 60 fps;
SI units; syllabus-anchored; school hardware; accessible; nothing faked; no external JS; a path
does not survive `beginPath()`; `g.mix` returns rgb, `RX.mix` returns hex). GradeNext adds:

11. **The repo gate before every commit**: `cd app && npx tsc -b --noEmit && npx vitest run &&
    npm run build`. CI runs the same three on every push and deploys only if they pass.
12. **`node audit.mjs` CLEAN before every commit that touches `smartlab/`** (run from
    `smartlab/`; CI cannot run it — it needs Playwright).
13. **Controls are checked for liveness, not just wiring**: for Grades 6–8 labs, every control
    in every set-up must move at least one readout or plot when swept across its range
    (§2.7 rule 1). `cd smartlab && node live.mjs [labId] [-v]` must print **LIVE-CLEAN**: each
    value is a fresh seeded run of the same length (camera reset, render tier pinned via
    `__FX.pin`), the first value is run twice so only deterministic channels testify, and a
    control marked `display: true` counts only through the stage or a plot.
14. **Never `git add -A`.** `git status --short`, delete scratch, stage exact files. Scratch goes
    in the session scratchpad or in gitignored names (`smartlab/_preview*.html`,
    `smartlab/*.png`).
15. **Never loosen a test to make it pass.** A failing test is a finding.
16. **Incremental saves**: files land on disk as they are finished; commit and push at every
    verified increment, so a lost session costs minutes.
17. The engine never imports React, Three or anything from `app/`; the app reaches the engine
    only through `smartlab/index.html?…#<id>` and `postMessage`.
18. **Grades 6–8 lab files are `smartlab/sims-g<grade><unit>-<n>.js` and load without a DOM**:
    registration and model may not touch the page (drawing may). `msLabs.test.ts` loads them in
    a bare VM, and every new lab gets a row in `msLabs.ts` and model-number tests there.
19. **A control is shown only in the set-ups whose experiment it belongs to** (`when`). In a
    chaotic system (a shoal) any perturbation "moves" the output — that is not liveness; scope it.
20. **A select that only changes the view does not restart the lab**: mark it `display: true` or
    `restructure: false` (engine rule since 2026-09-25; selects otherwise restart as before).

---

## 7. Calibration constants — hard-won, do not re-guess

InsightVis §7 governs for the Higher Secondary labs. GradeNext constants are added here per lab
as they are found by direct numerical testing.

**6A-1 The Living Tank** (verified in `msLabs.test.ts` and the scratch model suite):
- O₂ saturation 9.09 / 8.26 / 7.54 mg/L at 20 / 25 / 30 °C; CO₂ at 420 ppm, 25 °C 0.63 mg/L;
  free NH₃ 0.56 % of TAN at pH 7, 25 °C.
- PLANT {pmax 10, ik 90, resp 0.6}; ALGA {pmax 150, ik 60, resp 7.5, loss 0.012} — algal pmax
  was 8× too slow at first (no bloom); 150 gives 1–2 doublings a day.
- FISH {wet 0.40 g, rO2 0.45 mg/g/h, Q10 2.2}: one neon ≈ 0.18 mg O₂/h at 25 °C.
- BACT {mu1 0.045, mu2 0.030, b 0.002, K 0.5, Ko 0.5}; media: mature 6, new 0.002, tap 0.3,
  tank 5.4. New tank: ammonia peaks ≈ day 10.7, nitrite ≈ day 24.
- Mortality starts below 1.3 mg/L O₂ (gasping below 2.5); power cut at 20:00 on a 31 °C night:
  1.48 mg/L at 07:00. Tap-rinsed media: test-kit 0.5 mg/L NH₃ after ≈ 37 h.
- Sealed sphere: exact redox bookkeeping (Ω = O₂ + 1.5 NO₂ + 2 NO₃ − organic C) — a blanket
  photosynthetic quotient made O₂ from nothing; carbon now drifts ~1e-14, Ω ~1e-13.
**6A-2 The Draining Tank** (verified in `msLabs.test.ts`):
- 10 cm bore, 6 mm hole, 50 cm start (49 cm head): exact Torricelli with Cd 0.61 empties in
  143.9 s; the apparatus's jet stops at 140.6 s (a jet slower than 5 cm/s·√(1/scale) is drips —
  in the viscous last millimetres Cd(Re)→0 and the flow would otherwise fade forever).
- Leaving an effect out moves the drain time: vena contracta −38.7 %, viscosity +0.43 %,
  surface tension +0.26 %, evaporation (2 mm/day) < 0.001 %.
- Half-times 42.4 / 30.3 / 21.9 s at full / 1:2 / 1:4 (full ÷ 1:4 = 1.94 against √4); the 1:10
  copy's 0.6 mm hole holds 2.48 cm of head and never reaches half.
- Tap 1.5 L/min on 6 mm settles at 12.0 cm; 2.0 L/min at 20.4 cm.
- Town: 20,000 people × 150 L/day on an evening profile, mains leaking 12 % of mean use, real use
  3.5 % above the textbook: the model without leaks says 04:32, the town runs dry at ~02:06.
- Fits to a full tap-off run: constant misses by 27 mm (pattern), proportional 77 mm (pattern),
  square root 1.4 mm (noise).
- Shoal: noise is rotational diffusion (σ = noise·0.35·√(2/dt) rad/s); lengthwise-swimming
  preference 0.45, pitch ≤ 20°. Blind Φ over four starts: 0.98 / 0.95 / 0.86 / 0.58 / 0.25 at
  noise 0 / 1 / 2 / 3 / 4 — order holds, then collapses between 2.5 and 3.5.

**6A-3 Earth's Four Spheres** (verified in `msLabs.test.ts`):
- PREM (isotropic polynomials, ocean left out): Earth's mass 5.976e24 kg, g 9.826, pressure at
  the CMB 135.9 GPa and at the centre 364.4 GPa — all from the densities alone.
- Rays by Δ(p) = 2∫p dr/(r√(η²−p²)) with r = r₀ + L·u² per shell (24 panels for display, 16 for
  the fan table, 0.04° take-off steps under 24°). Direct P reaches 98.3° (core-grazing p 253.7 s),
  direct S 102.6° (p 479 s), the PKP caustic 145.1°; with the inner core the P shadow is 99–117°
  (PKiKP/PKIKP fill the rest, weak), without it 99–145°; a solid core leaves no shadow.
  Travel times match ak135 within seconds: P 6.13 / 10.12 / 12.96 min at 30 / 60 / 90°,
  S 11.07 / 18.37 / 23.90, PKIKP 20.17 at 180°. Stations closer than 12° are not offered (the
  LVZ and 410/660 triplications make 8–10° a gap and are not this lesson).
- Water: 8 stores (thousand km³: ocean 1,338,000, ice 24,064, ground 23,400, lakes 176.4, soil
  16.5, air 12.9, rivers 2.12, life 1.12) and 16 balanced flows (10³ km³/yr): residence ocean
  3,240 yr, ice 9,626 yr, ground 1,800 yr, lakes 18 yr, soil 55 d, air 9.7 d, rivers 17 d, life
  9 d. All land ice melted: 66.5 m by volume ÷ ocean area (published SLE 65.64 m).
  USGS balls 1,383 / 406 / 273 / 56 km.
- Air: half below 5.48 km (mid), 5.72 (tropics), 5.08 (polar); tropopause by the WMO lapse rule
  above any ground inversion: 11 / 17 / 9 km. Balloon: Cd 0.25 + 0.22/(1+(Re/2.5e5)⁴) (drag
  crisis) keeps the ascent near 6–7 m/s; 600 g at 1.5 m bursts at 29.7 km after 70 min; a
  1200 g balloon under-filled (1.3 m) never lifts the 250 g sonde.
- Miami model (Lieth): NPP = min(3000/(1+e^(1.315−0.119T)), 3000(1−e^(−0.000664P))).
- Carbon: ka 0.12/yr (gross air–sea flux ÷ air stock) and kid 0.0015/yr (deep ventilation ~1000
  yr) fixed physically; kmi 0.0786/yr and β 0.108 fitted to ice cores + Mauna Loa + GCB sinks.
  Worst miss 1959–2023 5.0 ppm; 2023 423.6 (measured 421.1); 1850–2022: 698 GtC emitted, 42 %
  airborne, ocean 153, land 253. Stop in 2030 → 378 ppm in 2100; no ocean → 490 ppm in 2023.

**6A-4 One Event, Four Spheres** (verified in `msLabs.test.ts`):
- Eruption: stratospheric share clamp((plume − 14 km)/4, 0, 1); SO₂ → sulfate e-folding 35 days,
  ×98/64 ÷ 0.75 (75 % acid droplets); removal 1.0 yr (tropics) / 0.7 yr (high latitude); optical
  depth 0.0060 per Mt of sulfate spread over its growing band; forcing −25 × depth; Geoffroy
  two-layer ocean C 7.3, C_D 106 W·yr/m²/K, λ 1.13, γ 0.73; soil respiration Q10 2 on 110 GtC/yr;
  sea level 0.12 m per 10²⁴ J. Pinatubo (17 Mt, 15° N, 34 km): −0.38 °C at 25 months, sea level
  −5.6 mm, CO₂ growth −1.01 ppm/yr in the second year; a 12 km column changes nothing.
- Hurricane: DeMaria–Kaplan potential intensity (67.0 m/s at 28 °C; a 25 °C sea makes no
  hurricane); storm tide by the bathystrophic equation over 80 cells, dt 150 s, t −24 → +8 h, on
  the right of the track (y = +Rmax), with f·Q (not −f·Q); shelves wide {120 km, 60 m, concave
  p 2} and narrow {15 km, 60 m, p 1}; wave setup 0.1 × 0.2 × V; marsh 0.07 m/km. Katrina 6.71 m
  (measured 7.3–8.5), Camille 6.52 (6.9–7.5), Ike 5.36 (4.6–6.1), Andrew 2.13 (1.5–3.0). A steady
  one-dimensional setup gave about half — the along-shore current's Coriolis setup is the rest.
  Rain: Kraft's rule × 1.07^(SST − 28.5); a Harvey-like stall 1,398 mm.
- Wildfire: McArthur Mk5 FFDI (Black Saturday 46.4 °C, 6 %, 45 km/h, drought factor 10 → 138, catastrophic);
  Rothermel wind and slope factors with σ 1500 /ft (a 20° slope ×3.3–4.3); crowning by Van Wagner
  (crown base 4 m, foliar moisture 100 %), crown spread ×3.34; grass ×1.8, town ×0.5, creek no fuel;
  spread by Dijkstra over 16 neighbours on a 56 × 56 grid of 8 km. A windy fire burns > 20× a calm
  one in 6 h — McArthur's weak wind term alone made windy fires smaller. Runoff: NRCS curve number
  55 (forest) → 85 (burned); TR-55's own table value 76.2 mm on CN 80 → 31.75 mm, exact.
- Drought: Hargreaves on Fresno's normals 1,495 mm/yr (CIMIS ≈ 1,450); bucket 150 mm; canal water
  0.6 × need × rain²; wells 0.4 × need always; extra pumping ÷ Sy 0.08 lowers the head; the clay
  compacts 1/15 m per metre of new low head, and never rebounds; the head refills 1 m/yr after.
  Four dry years at 55 %, 1 °C warmer, with pumping: the land sinks 177 cm; without extra pumping it does not
  sink, and crops get < 70 % of their water.

**6A-5 The Measurement Bench** (verified in `msLabs.test.ts`; built, ships with 6A-6):
- The touch: 1D finite volumes graded to the contact, Crank–Nicolson; skin k 0.37, ρ 1100, c 3400 (e 1176),
  33 °C at the surface → 37 °C at 6 mm; glass e 1453, steel 7950, glass-ceramic 1789; nitrile 0.1 mm, heat mitt
  3 mm of fibre (k 0.06, ρc 3.3e5). Contact at 90 °C: glass 64.5 °C (closed form = FD within 0.1 K), steel
  82.7 °C. Burn = dose on the scald table (Moritz & Henriques 1947: 68.3 °C 1 s, 65.6 °C 2 s, 60 °C 5 s,
  57.2 °C 10 s, 54.4 °C 30 s, 51.7 °C 2 min, 48.9 °C 5 min, 44 °C 6 h), the first 10 ms (grid settling)
  ignored. 1-s limits: steel ≈ 73.5 °C (ISO 13732-1's 65–70 °C is the *onset* of a burn — a milder
  criterion), glass ≈ 97 °C; a 5 s bare hold on a glass beaker of water ≈ 79.5 °C.
- Hot plate 800 W, thermostat band 4 K, C 1050 J/K, loss = 1.5 × top area × (convection + radiation);
  beaker base contact 200 W/m²K; water evaporation by the Lewis analogy dominates above 70 °C. 250 °C
  setting: water 82 °C at 10 min; the plate is above 60 °C for 30+ min after switching off.
- Thomsen: Q = 74.73·n/(n + 1.798) kJ per mol H₂SO₄; c_p = 4.184 − 3.50w + 0.74w² J/g·K; ρ 98 % 1.836.
  A drop of water lands on the denser acid and mixes first with its own mass: +100 K on 98 % acid.
  20 mL 98 % acid + 100 mL water: acid→water peak 70 °C (no boiling anywhere); water→acid bulk 146 °C,
  landing spots 181 °C, 53 mL boils on landing; slowly (0.2 mL/s) in ice: bulk 76 °C but landing 140 °C.
- Density: balance ± 0.005 g; cylinders (ISO 4788) 10/0.2, 25/0.5, 100/1, 250/2 mL, bores 1.3/1.9/2.9/3.9 cm;
  ± ½ division a reading, read to a tenth; meniscus climbs 2.2 mm; eye 25 cm away; parallax h·r/D·A (the
  top edge is on the scale: no parallax, high by the climb); overflow can leaves 0.05 mL on its spout.
  Medium specimen, 100 mL before-after: ± 11 % (can't tell pyrite 5.01 / magnetite 5.18 / hematite 5.26);
  large in the can → 25 mL: ± 1.7 % (tells them, not magnetite from hematite); forgetting the 1.87 g boat
  turns pyrite into "magnetite".
- Fall: exact t = (v_t/g′)·arccosh(e^(g′h/v_t²)) with buoyancy; steel 25 mm 64 g Cd 0.47 → 0.4517 s for 1 m;
  ping-pong 2.7 g 40 mm Cd 0.5 → 0.4656 s (g from 2h/t² = 9.23). Stopwatch: partner's release seen late by
  0.19 ± 0.03 s (the ruler-drop number), the landing anticipated ± 0.045 s, shown to 0.01 s → 0.18 s short
  on average; gates 0.1 ms.
- Graphs: an outlier's residual > 3× the leave-one-out scatter; pyrite slope through zero 5.03 without the
  misread piece (4.90 with it); t² against h through zero → g 9.800; bars from 0.445 s show 3.1 % as 3.1×.

**6A-6 The Fair Test** (verified in `msLabs.test.ts`):
- Helicopter: blades L × w from copy paper (80 g/m²; tissue 25, card 160), a 7 cm body folded to thirds,
  paper clips 0.45 g. The spinning rotor is a drag disc πL², C 1.2; before it spins up (first 25 cm) the
  strip falls with drag 0.5 on a quarter of the disc. Flutter from L/w > 3.2·∛(stiffness) (copy 1, card
  4.5, tissue 0.35): up to 65 % of the rotor's drag lost. Tip speed 2.6 × the fall.
- 8 cm × 3 cm, one clip: 1.27 g, 0.93 m/s (= √(2mg ÷ ρCA)), 3.14 s for 3 m; slowest at about 10.25 cm
  (flutter from 9.6); 7 → 10 cm from the same paper adds 144 mg.
- Drop to drop the drag scatters 7 % (the time 3.5 %), more when fluttering; an open window lifts the
  stairwell's air at 0.1 m/s (3.14 → 3.49 s). Gates 1 ms; the stopwatch as in 6A-5 (you drop it).
- The class table: a careful 5–14 cm series, red/blue, card, and 0/2/3-clip groups on the 8 cm design,
  four mixed; group comparisons use every drop. Verdicts: longer — overstated (flutter beyond 11 cm);
  heavier — supported; red — not supported; card — contradicted; wider — no evidence; all 24 rows —
  unfair comparison; three rows — too little evidence.

Environment constants (this container family):
- Playwright is pinned at **1.56.1**; its Chromium is `/opt/pw-browsers/chromium-1194/…`, which
  the InsightVis harness hardcodes. Never run `playwright install`.
- The engine page loads IBM Plex from Google Fonts; headless Chromium here cannot fetch it
  (the proxy's certificate), so harness screenshots fall back to system fonts. Environment only.

---

## 8. Conventions

**Everything in InsightVis §8 applies.** GradeNext conventions on top:

- **Every new lab — middle school and higher secondary — is built on the Smart Lab engine.**
  The React SimManifest engine hosts only the 37 frozen keepers.
- **Grade tagging.** A lab declares `grade: 6 | 7 | 8` (or an array). A lab without `grade` is an
  InsightVis lab and counts as Class 11–12. Middle-school labs also declare `unit: '6A'` and
  `topics: ['A1', 'A2']` (curriculum topic codes), and `exams` carries the NGSS performance
  expectations and `'CAST'`. `chapter` is the unit's title.
- **URLs into the engine.** `smartlab/index.html` accepts `?level=hs|ms`, `?grade=N` (filters
  the rail), `#<labId>` (opens a lab), `?embed=1` (hides the console brand when framed). On
  every mount the engine posts `{ type: 'smartlab:mount', id }` to its parent and writes
  `#<id>` into its own address. The integration code is one marked block in `lab-core.js`
  (*"GradeNext integration"*) — keep every GradeNext change to the engine inside marked blocks
  so upstream syncs stay clean.
- **Set-up deep links** (to be built with Batch 1): a subtopic links to
  `#<labId>/<setupValue>`, which mounts the lab and selects that set-up.
- **Curriculum links.** A subtopic in `grade*.ts` names the lab and set-up that teach it; the
  Course Library opens them in a framed lab view like the Higher Secondary one. Never attach a
  wrong-fit lab just to fill a slot.
- **Files.** Middle-school labs go in `smartlab/sims-g<grade><unit>-<n>.js`
  (`sims-g6a-1.js`), two labs per file at most; new figure libraries are
  `smartlab/art-<domain>.js`. Script tags in `smartlab/index.html` follow InsightVis §14.1's
  order.
- **The Higher Secondary catalogue** (`hsLabs.ts`) is regenerated from the engine sources when
  the HS lab set changes; `hsLabs.test.ts` fails if it drifts.
- **Upstream sync from InsightVis.** Fetch `insightvis`, copy changed files from its
  `smartlab/` over ours **except** the marked GradeNext blocks in `lab-core.js` and the brand
  lines in `index.html` (re-apply those by hand), bump the commit reference in §4, regenerate
  `hsLabs.ts` if labs changed, run the audit and the gate.
- **Terminology.** Middle school: Grade 6/7/8, unit, topic, subtopic, NGSS, CAST. Higher
  Secondary: Class 11/12, chapter, NCERT, JEE Main / JEE Advanced / NEET UG, PYQ.

---

## 9. Current status

**State as of 2026-09-25 (latest):**
- **Batch 1 reported to the founder** (a private claude.ai page, "Grade 6 Unit A Smart Labs",
  https://claude.ai/artifact/So3QbJSqDpPAdWB18Bgk5B): all 29 set-ups screenshotted from the live
  build, each with its controls, presets, the subtopics it teaches and a direct link; the checks per
  lab; the two founder verdicts answered; Batch 2 previewed. Live sweep over all six labs: 203
  control × set-up pairs, LIVE-CLEAN. CI deploy of `28cf7d7` green. **Now: Batch 2.**
- **Batch 1 built: 6A-5 The Measurement Bench and 6A-6 The Fair Test ship together** (they share topic
  A5). Audit CLEAN (48 sims), live.mjs LIVE-CLEAN (6A-5 35 pairs, 6A-6 22), every problem's measure
  matches its working (6A-5: 65 °C, 79 °C, 70 °C, 181 °C, 19.1 g/cm³, 1.7 %, 0.4517 s, 0.18 s, 5.03;
  6A-6: 0.93 m/s, 144 mg, 3.14 s, 4–6 drops, 0.63 s, 10.25 cm), all 27 Unit A subtopics taught and linked,
  every set-up reviewed wide and at 390 px with each card open.
- **6A-4 One Event, Four Spheres built and verified**: audit CLEAN (46 sims), live.mjs LIVE-CLEAN
  (19 pairs), every problem's measure matches its working (0.383 °C, 7.5 Mt, 6.92 m, 0.70 m,
  1,398 mm, 138, 19.6 mm, 177 cm), gate green (471 tests), every set-up reviewed at 1500 px, at
  390 px (both eruption cards) and through its whole run. A4 is now claimed by two labs; the
  catalogue test holds them to teaching all of it together.
- **6A-3 Earth's Four Spheres built and verified**: audit CLEAN (45 sims), live.mjs LIVE-CLEAN
  (21 pairs), every problem's measure matches its working (10.12 min, 30.3 min, 9.7 d, 29.7 km,
  395 g/m², 378 ppm), gate green (448 tests), every set-up reviewed at 1500 px, at 390 px and at
  the end of its run. A1.1–A4.6 (21 of Unit A's 27 subtopics) open their set-ups from the Library.
- **6A-2 The Draining Tank built and verified**: audit CLEAN, live.mjs LIVE-CLEAN (23 pairs),
  probchk values match their workings (10.53 h, 12.0 cm, 21.9 s, −38.7 %, 20.4 cm), gate green
  (426 tests), every set-up reviewed at 1500 px, 430 px and from four orbit views. A1.1–A3.5
  (15 of Unit A's 27 subtopics) now open their set-ups from the Course Library.
- **6A-1 The Living Tank built and verified**: audit CLEAN (43 sims), live.mjs LIVE-CLEAN (83
  control × set-up pairs), probchk values match their workings, gate green (410 tests), every
  set-up reviewed at 1500 px, at 430 px and from four orbit views. Framed in the app at
  `#/ms/g6a-living-tank/<setup>`; the Course Library links A1.1–A2.5 to their set-ups.
- Higher Secondary: 42 labs live at `#/hs` (commit `71ac7a8`, deployed).
- Grade 6 Unit A's 27 React sims removed (commit `49cf1ca`, deployed); its 27 subtopics show
  as planned in the Course Library.
- The 37 keepers live and frozen.
- This memory rewritten to the InsightVis process; `docs/BATCH_PLAN.md` written.

**Next, in order:**
1. **Batch 2 — Grade 6 Unit B, Cells, Bodies and Senses** (`docs/BATCH_PLAN.md` Part B, Batch 2):
   6B-1 The Microscope → 6B-6 Stimulus, Signal, Response, Memory, one lab at a time, each to the
   end of the ship checklist. Batch 1 (6A-1 to 6A-6) is done and reported.
2. Report Batch 2 the same way (screenshot every set-up from the live build, one page) before Batch 3.
3. Batches 3–18 in order; the Higher Secondary continuation track (Part C) when the founder
   asks for it or between batches.

---

## 10. Open questions — need the founder's input

1. **Branding inside the engine.** The console now reads "GradeNext Smart Lab"; the InsightVis
   dark console identity is kept. Is that the identity the founder wants for both tracks?
2. **Middle-school console on dark.** The engine is dark-committed (InsightVis §5) while the
   GradeNext shell has light and dark themes. The plan keeps the lab stage dark for both
   tracks, for the same reason InsightVis gives (additive light, glow, fields).
3. **Batch review cadence.** The plan reports at the end of each batch (4–5 labs). Earlier or
   per-lab review is possible if the founder prefers.

The three items flagged in the old Unit A report (a1-4 tooltip and challenge, a4-6 dropdown)
are **moot** — those sims were removed.

---

## 11. Environment and access notes

- Push only to `claude/gradenext-smart-lab-plan-yba89q` with
  `git push -u origin claude/gradenext-smart-lab-plan-yba89q`; retry on network failure with
  backoff (2 s, 4 s, 8 s, 16 s).
- GitHub is reached through the GitHub MCP tools, not the `gh` CLI.
- `insightvis` is readable (clone over HTTPS) and **not pushable** from here.
- Fresh container: `app/` needs `npm install` (vite, three, vitest); `smartlab/` needs
  `npm install` for the harness. Harness scripts that are ad hoc run as CommonJS with
  `NODE_PATH=<repo>/smartlab/node_modules`.
- Dev server: `cd app && npx vite --port 5183 --strictPort`; it serves the engine at
  `/smartlab/` through the `smartLab()` plugin in `app/vite.config.ts` (the build copies it
  to `dist/smartlab/`). Kill a stale server with `lsof -ti:5183 | xargs -r kill`, not
  `pkill -f` (exit 144 aborts a chained command).

---

## 12. Decision log

Append only. Never rewrite history.

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-04 | ADR-8: quality never decreases | Founder's standing law; efficiency never at the cost of quality |
| 2026-09-10 | Founder's unit books become reference, not ground truth; design at an extraordinary level | Founder: "build and design at extra ordinary level experiments" |
| 2026-09-11 | The 37 keepers frozen | Improvements only on the founder's explicit suggestion |
| 2026-09-25 | **Merge all 42 InsightVis labs as a Higher Secondary (Class 11–12) section, intact** | Founder's directive; porting them would have lowered their quality, so the engine was merged whole and framed |
| 2026-09-25 | **Remove all 27 Grade 6 Unit A React sims** | Founder: "too bad and rubbish", "silly and low quality", "nothing of experiment type" |
| 2026-09-25 | **Adopt the InsightVis process (mandates, §2.11 method, §14 spec, harness, ship checklist) as this project's process** | Founder's directive; InsightVis's labs are the bar |
| 2026-09-25 | **Every new lab, middle school included, is built on the Smart Lab engine** | One engine, one design system, one harness; the quality of the InsightVis labs comes from that engine's render layers and apparatus library |
| 2026-09-25 | **One lab per topic, organised as set-ups; every subtopic taught by a set-up and linked to it** | Founder: multiple things to teach per topic, not one sim per subtopic; keeps subtopic alignment |
| 2026-09-25 | **Batches follow the teaching order, one unit per batch; Batch 1 is Grade 6 Unit A** | The removed unit leaves the first thing a Grade 6 student opens empty |
| 2026-09-25 | **Middle-school level: NGSS practice done inside the lab, real equations underneath, grade-band misconceptions as reachable traps, CAST-pattern problems** | InsightVis §2.2 translated to Grades 6–8 without lowering the bar |
| 2026-09-25 | **Engine fixes that reach every lab**: `.tooltip[hidden]` hides (the empty box sat on every plot); `.stage-hint` above the canvas; the orbit ignores the pointer while a handle is dragged | Found reviewing 6A-1; bugs, so fixed for the keepers too — no lab's content changed |
| 2026-09-25 | **Engine additions, backward compatible**: `eqNote` may be a function of state; a select restarts unless `display`/`restructure:false`; `R3.box` takes `alpha`; `__FX.pin` for the harness | Multi-set-up labs need set-up-specific notes and view selects that keep the run; cutaways need glass |
| 2026-09-25 | **Grades 6–8 labs reach the app as `#/ms/<lab>/<setup>`, and the Course Library opens the set-up that teaches each subtopic** | The founder's alignment requirement: every subtopic one click from its experiment |
| 2026-09-25 | **Middle-school overlays live in one kit (`kit-ms.js`)** from 6A-2 on | Five labs a batch; one header, one card, one phone fold, one plot key — a fix lands everywhere |
| 2026-09-25 | **A model's weakness is taught by the apparatus, not asserted**: the town model is hours late because it leaves out leaks; a 1:10 copy stops because surface tension does not scale | A3 is about models' limits — the limits must be computed, measured and visible |
| 2026-09-25 | **6A-3 runs each sphere on the model its scientists use** (PREM, Gleick/USGS + Trenberth, US Std Atmosphere + AFGL, Lieth's Miami model, a GCB-driven box model) and checks each against the published number it should reproduce | "Real working models"; a Grade 6 lab can still be the real thing, only told simply |
| 2026-09-25 | **Fit only what the data constrain**: in the carbon model the air–sea exchange and deep ventilation are set from physics; only two rates are fitted | A four-rate fit was degenerate (any of several combinations fitted equally) — fixed physical rates make the fitted two meaningful |
| 2026-09-25 | **A lab may teach a subtopic another lab also teaches** (6A-3 links and 6A-4 both teach A4.5–A4.6) | The founder wants several experiments on a topic; alignment only needs each subtopic taught somewhere |
| 2026-09-25 | **The catalogue test's coverage rule is per topic, not per lab**: each lab teaches at least one subtopic of every topic it claims, and the labs claiming a topic teach all of it together — checked through `msTeaching`, the lookup the Library page uses | 6A-4 claims A4 beside 6A-3 but teaches only A4.5–A4.6; the old per-lab rule would have forced it to repeat 6A-3 |
| 2026-09-25 | **An event ships only with its numerical check** (6A-4: Pinatubo, four measured storm tides, Black Saturday's fire danger, TR-55's table, Fresno's evaporation) | A disaster drawn without its numbers is the animation the founder rejected |
| 2026-09-25 | **KITMS.cardSlot gives a stage with several cards a row of chips on a phone** (one open at a time) | 6A-4's eruption has two cards; two chips drawn in one place opened both on top of each other |
| 2026-09-25 | **Labs that share a topic ship together** (6A-5 and 6A-6 both claim A5) | The per-topic rule fails honestly while a subtopic is untaught; it is not loosened, the pair is committed as one increment |
| 2026-09-25 | **A safety rule is modelled at the scale where it bites** (6A-5: the drop of water that lands on acid, not only the stirred beaker) | The stirred-beaker model said slow, iced water-into-acid never boils — a dangerous lesson; the landing drop boils at 140 °C |
| 2026-09-25 | **A comparison with a standard names the standard's criterion** (ISO 13732-1 is the onset of a burn; the scald table is a burn through the skin) | The lab's steel limit (73.5 °C) and ISO's (65–70 °C) differ because they measure different burns — said so, test checks the physical chain |

---

## 13. Session log

Newest first.

- **2026-09-25 (latest)** — **Batch 1 reported.** CI deploy of `28cf7d7` confirmed green. All 29 set-ups
  re-shot from the live build at 1.6× (stage only, after each had run), plus one whole lab page; the
  controls, presets and problems per set-up read out of `__R.def` in the same pass, so the report lists
  exactly what the student can change. live.mjs over the first three labs for the totals (6A-1 83,
  6A-2 23, 6A-3 21 pairs; all six 203). Published one private page (the app's own palette and faces:
  Bricolage Grotesque, Source Sans 3, IBM Plex Mono, GradeNext purple): the two verdicts answered, one
  annotated lab page, a subtopic → set-up map, per lab its thesis, checks and set-up cards (screenshot,
  what the student does, controls, presets, a live link), how it was checked, and Batch 2. Generator:
  scratchpad `mkreport.py` (rebuild for the next batch by swapping LABS / LABELS / NEXT).
- **2026-09-25** — **6A-6 The Fair Test built; 6A-5 and 6A-6 shipped together; Batch 1 complete.**
  The helicopter checked in a scratch runner first (the closed form, the fall from rest, the flutter
  peak, the mass confound). Found in numbers: a rising draught that made the helicopter fall faster (a
  sign), a class table whose random rows could not test the colour or card claims (rebuilt as a careful
  class would make it), group comparisons from two helicopter means (far too sure — now every drop), a
  flutter too weak to show, and a drop scatter stated as the drag's 3.5 % when the time's was half that.
  Found on screen: a close-up that cut B off, a stray handrail line, a verdict stamp over its text on a
  phone, a design chart balanced to the wrong mass and plotted at unrounded lengths.
- **2026-09-25** — **6A-5 The Measurement Bench built** (ships with 6A-6). Physics in scratch
  runners first (the touch's finite volumes against the effusivity closed form; the plate and beaker; Thomsen;
  the cylinder's parallax; the fall with drag against a step-by-step integration; fits and outliers), then
  `art-measure.js`. Found on screen or in numbers: the skin's first 10 ms (a grid artefact) counted as a
  burn — now ignored; a gingerbread-man "heat glove" (now mitts hanging on a rail); steam invisible against
  pale tiles (alpha raised, tiles darkened); `P.area` called without its base; a cylinder whose top was NaN
  (`scaleH` never existed); a tray face painted over the minerals in it (the painter's algorithm and one big
  face — the tray now sorts as ground); a magnifier that put the scale on the far wall (it is on the near
  wall, between the eye and the meniscus); the trials seeded from the hot plate's setting; and the stirred
  acid model teaching that slow, iced water-into-acid is safe — the landing drop now boils at 140 °C.
- **2026-09-25** — **6A-4 One Event, Four Spheres built.** Every chain run in a scratch runner and
  checked against its event before any drawing; `art-terrain.js` written first. Numbers found
  wrong and fixed: the storm tide at half the measured (a steady one-dimensional setup — now the
  bathystrophic equation, whose first version had the transect on the wrong side of the track and
  the Coriolis term's sign reversed); windy fires burning less than calm ones (McArthur's ellipse —
  now Rothermel's wind and slope factors with a crown-fire transition); the pumping switch meaning
  "no wells at all" (now normal wells always, the switch is the extra pumping). Screens found: flat
  relief (vertical exaggeration and a darker ambient), the first days of the eruption over in a
  blink (a slow early clock), the benchmark pole drawn behind the ground, "−0 mm", a forcing curve
  mapped to the wrong axis, overlapping labels, a header counting dry years beside a pole counting
  calendar years, "0.00 °C cooler" (now "the ocean is slow to cool"), and on a phone two card chips
  in one place that opened both cards on top of each other.
- **2026-09-25** — **6A-3 Earth's Four Spheres built.** Every model checked in scratch
  runners first. The ray tracer went through three versions: stepping rays wrapped them round the
  planet (a turning point that stalled); mirroring the down-leg fixed that; the exact Δ(p), T(p)
  integrals on PREM's own polynomials gave real travel times and shadows to within a degree. The
  carbon model's first fit hid an explicit-Euler oscillation (the air–sea mode relaxed in 0.05 yr
  against a 0.1-yr step) — its stocks looked right while its fluxes flipped each step; refitted
  with physical exchange rates and a stable step. The harness found the bio set-up's place select
  dead (it acted only through onChange); the climate became place + warmer + wetter, and the
  globe's turn moved into step() so the stage is deterministic. Screens found: the globe too big
  (quake under the header), a flat grey ground and stripes of cloud from the balloon (now a
  ray-cast landscape and perspective cloud decks), overlapping water-cycle nodes, labels off the
  stage, triplication fragments on the travel-time plot (now each wave's earliest arrival).
- **2026-09-25** — **6A-2 The Draining Tank built.** Physics checked in a scratch runner
  before any drawing (Torricelli 143.9 s exact; scale and surface-tension numbers); `art-hydro.js`
  and `kit-ms.js` written first. Bugs found on screen or in numbers: the draining model never
  "finished" with viscosity on (Cd(Re)→0 makes the last millimetres fade exponentially — a jet
  slower than 5 cm/s is drips, so that is where it stops); the flows plot clipped its own net line;
  the scale copy sat off-screen; the leaves card read −100 % for evaporation (the same stall bug).
- **2026-09-25 (later)** — **6A-1 The Living Tank finished to the ship checklist.**
  - Reviewed every set-up at 2× and fixed what the screen showed: the engine's always-visible
    tooltip box and a hint painted under the canvas; plot keys moved into a band above each frame
    (`plotKey`), day axes that never repeat a label (`dayAxis`); history opens on three recorded
    lived-in days (the run starts on day 4); readout labels short enough never to truncate; the
    unplug header now says what its numbers say; the web card places each flow label where it
    clears the nodes and the others; eqNote per set-up; stones drawn as projected hulls (a
    sliver read as a dead fish); neons swim level and lengthwise; the shoal camera close and
    following; plates labelled in rows inside their box; the globe lit from the side with Africa
    in view; the ledger's notes on their own line; a phone layout for every set-up.
  - The blind order curve averaged over four starts (it dipped at noise 0.5 on one start); the
    emergence problem moved to noise 3.0 (Φ 0.59) where "loosely aligned" is true.
  - Wrote `live.mjs`; it found `graph` and `cutFilter` dead in four set-ups and the tank's
    controls "live" in the shoal only through chaos — scoped them per set-up; made the filter
    cutaway real (glass shell + an inset of the media and both bacterial populations).
  - App: `msLabs.ts` + test (20 tests), the framed lab page, the route, Course Library links.
- **2026-09-25** — **Founder: merge InsightVis as Higher Secondary, adopt its process, remove
  Grade 6 Unit A, plan batches.**
  - Merged the InsightVis engine and its 42 labs intact into `smartlab/`, added a marked
    integration block to `lab-core.js` (grade tagging, level filter, deep links, embed,
    `smartlab:mount`), shipped it through a Vite plugin, and built the Higher Secondary page
    (catalogue by subject → chapter with class filter; a framed lab view whose route and frame
    follow each other). `hsLabs.ts` generated from the engine and tested against it.
  - Removed the 27 Grade 6 Unit A sims, their curriculum links and their tests; the gate went
    from 1053 to 390 tests, all green; the 37 keepers untouched.
  - Copied InsightVis's `memory.md` and `README.md` to `docs/insightvis/`; rewrote this file to
    its structure; wrote `docs/BATCH_PLAN.md`.
  - **Lesson:** the removed unit passed every automated check this project had. Checks confirm
    the floor; only looking at the screen as the founder does finds the bar.
- **2026-09-06 → 2026-09-12** — Grade 6 Unit A built as 27 React sims, one per subtopic, with a
  retroactive alignment audit and a completion report. Removed on 2026-09-25 (see §2.10). The
  lessons worth keeping are in §15.

---

## 14. The lab specification — InsightVis §14 governs

Every field, every structure and every harness in InsightVis §14 applies unchanged. GradeNext
additions for middle-school labs:

```js
L.register({
  id: 'g6a-living-tank',          // g<grade><unit>-<slug>
  grade: 6,                       // 6 | 7 | 8 — puts it in the Middle School track
  unit: '6A',
  topics: ['A1', 'A2'],           // curriculum topic codes this lab teaches
  subject: 'engineering',         // the unit's subject; sets the accent
  chapter: 'Systems and Subsystems',
  name: 'The Living Tank — Parts, Boundaries and Flows',
  exams: ['NGSS MS-LS2-3', 'CAST'],
  weight: 'Unit anchor',
  params: { setup: 'unplug', … },
  controls: [
    { group: 'Set-up', items: [
      { key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: [
        { value: 'unplug', label: 'Unplug a part', teaches: ['A1.1', 'A1.3'] }, … ] } ] },
    …
  ],
  …
});
```
- `teaches` on each set-up option names the subtopic codes it covers; the Course Library reads
  it to link each subtopic to its set-up. Every subtopic of every listed topic must appear in
  some set-up's `teaches` — a test enforces it.
- `problems[].source` names the pattern: `'CAST pattern · analysing data'`,
  `'NGSS MS-PS3-4 · planning an investigation'`.
- `notes` closes with the misconception most likely to survive the lesson, in the `pyq` block
  (*"Misconception to catch"*).

---

## 15. Lessons carried forward from the React-engine era

Still true on any engine:
- **Units must be real**: a value typed as seconds must hold seconds. Raw human-scale numbers in
  an SI field displayed as nonsense and no test saw it — only the running app did.
- **Pure timeline or stateful clock** is decided by one question: does any control fire a
  one-time shock mid-run? If yes, the state must persist across ticks; a recomputed timeline
  cannot show path dependence (hysteresis, recovery).
- **Two-component indices saturate silently.** Numerically check that the two scenarios the
  lesson compares land on different sides of the threshold, not merely that both are non-zero.
- **An eligibility gate must not make a continuous driver irrelevant** once it trips — a gate
  lowers a bar, it does not bypass the other input.
- **Never invent dropdown options** the design does not ground in a model and a scenario.
- **A reasoned constant must be tuned to the pivot the lesson needs**, and the pivot verified by
  finding the real crossover of two computed lines, not asserted.
- **Diagnose with numbers, not by reading code** — standalone runner scripts found every real
  model bug in that era.

Learned on the Smart Lab engine (6A-1):
- **Look at every set-up at 2× before calling it done.** The audit was CLEAN while an empty
  tooltip box sat on every plot of every lab and a stone rendered as a dead fish.
- **A liveness harness must control its own noise**: reset the camera, pin the render tier, run
  the first value twice. Without that, noise passed a control that drew nothing.
- **A background curve from one random start is not a result** — average several starts, and
  let the problem read the very same runs the curve is made of.
- **Overlays are laid out, not placed**: keys above frames, labels searched for a clear spot,
  plate labels in rows inside their box, cards that fold on a phone.

Learned on 6A-3:
- **Check the fluxes, not only the stocks.** An explicit step at the edge of stability made the
  air–sea flux flip sign every step while CO₂ still matched the record; a fit tuned on top of it
  was meaningless. Halve the step and compare, before fitting anything.
- **A control must act on the state, not through a side effect.** A select whose only effect was
  an onChange copying numbers into other params looked dead to the harness — and would to any
  preset or deep link. Make the chosen thing itself the input.
- **Animations that a run depends on belong in step(), not in drawStage()** — frames are not
  deterministic, steps are.
- **Real physics has details that are not the lesson** (the LVZ gap at 8–10°, triplications):
  keep the model whole, and choose the range and the curve (earliest arrival) the lesson needs.

Learned on 6A-4:
- **Check a model's direction, not only its size.** A fire model where wind makes the fire smaller
  passes a "burns some hectares" test; compare the two cases the lesson contrasts (windy vs calm,
  uphill vs flat) and require the right order and ratio.
- **When a model gives half the measured, look for the missing process, not a fudge factor.** The
  storm tide's missing half was the along-shore current's Coriolis setup — a physical term, which
  also got its sign and side of the track wrong at first; test against several real events at once.
- **A test's expected value is the source's own number, to the source's precision** (TR-55's
  31.75 mm, not 31.8 at one place) — never widen a tolerance to pass.
- **One count per quantity on one screen**: the header, the readout and the stage's own labels
  must use the same year, the same zero and the same units.
- **Every card needs its own phone chip**: check each set-up with every card open at 390 px.

Learned on 6A-5:
- **A well-mixed model can teach the opposite of the rule.** Model the place where the danger happens (the
  drop that lands), not only the average (the stirred beaker).
- **Before comparing with a standard, match what it measures.** ISO's burn onset and a scald table's burn
  through the skin are both "burn thresholds" and differ by several degrees.
- **Big flat faces and the painter's algorithm:** anything that holds small objects (a tray, a bench, a
  mat) must sort as ground, or its one face centre paints over what sits on it.
- **Draw the geometry the physics uses:** the scale is on the near wall of a cylinder — the magnifier has to
  show the eye, the scale and the meniscus in that order, or its parallax is backwards.

Learned on 6A-6:
- **State the scatter of what is measured**, not of what causes it: a 7 % scatter in drag is 3.5 % in time.
- **An uncertainty from two samples is not an uncertainty**: compare groups from every measurement, not
  from a couple of means that may happen to agree.
- **Evidence tables must be built to test the claims asked of them** — a random table cannot show that
  colour does nothing; a careful class's groups can. And a claim the data never varied has no evidence.
