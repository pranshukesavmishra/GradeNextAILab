# GradeNext Smart Lab — Master Plan

> **The virtual laboratory wing of GradeNext.** Every science and math concept a US student meets from Grade 1 to Grade 12 — visualized, manipulable, and experimentable, in the browser.

**Status:** Proposal for review · **Version:** 1.0 · **Date:** 2026-08-28

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Market Research — What Exists & Where It Fails](#2-market-research)
3. [Product Definition](#3-product-definition)
4. [Curriculum Coverage — Grades 1–12](#4-curriculum-coverage)
5. [Core Features](#5-core-features)
6. [UX & Design System](#6-ux--design-system)
7. [Technical Architecture](#7-technical-architecture)
8. [Simulation Catalog & Prioritization](#8-simulation-catalog)
9. [Roadmap & Phases](#9-roadmap)
10. [Risks & Mitigations](#10-risks)
11. [Success Metrics](#11-success-metrics)
12. [Open Questions for Confirmation](#12-open-questions)

---

## 1. Vision & Goals

### 1.1 Vision

**"If you can see it and touch it, you can understand it."**

GradeNext Smart Lab turns every abstract science and math concept in the US K-12 curriculum into something a student can *see*, *manipulate*, and *experiment with* — directly in the browser, on any school device. It is not a video library and not a worksheet engine: it is a living laboratory where a Grade 2 student makes a bulb light up, a Grade 7 student breeds virtual pea plants, and a Grade 12 student verifies conservation of momentum with real collected data.

### 1.2 Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Visual coverage of the US science curriculum, Grades 1–12 (NGSS-aligned), plus high-value math topics | % of NGSS performance expectations with ≥1 mapped sim |
| G2 | True *experimentation*, not just animation — students change variables, measure, collect data, and draw conclusions | Every sim ships with measurable variables + at least one Guided Lab |
| G3 | A GUI that is a generation ahead of PhET/oPhysics — modern, delightful, touch-first | Design-system driven; usability-tested with students |
| G4 | One platform, four depths — the same sim adapts from Grade 2 to Grade 12 | Grade-band adaptive UI on every applicable sim |
| G5 | AI-native — a lab assistant that sees the experiment and teaches through it | AI assistant integrated into the sim shell |
| G6 | Cheap to scale content — a sim framework where sim #50 costs a fraction of sim #1 | Shared engine + shell; new sim ≤ 1–2 dev-weeks average |

### 1.3 Non-Goals (v1)

- Photorealistic 3D "game" labs (Labster-style) — high cost, low pedagogical return; we choose clarity over spectacle.
- Native mobile apps — the web app is responsive/touch-first; PWA covers offline later.
- Replacing physical labs entirely — we complement and extend them (pre-lab prep, impossible experiments, unlimited retries).

---

## 2. Market Research

The virtual-lab market is ~$1.5B (2024) growing ~12.5%/yr toward a projected ~$4.2B (2033). We researched every significant player (August 2026):

### 2.1 The landscape at a glance

| Platform | What it is | Cost | Verdict for us |
|---|---|---|---|
| **PhET** (CU Boulder) | 170+ sims, the research-backed gold standard; 250M+ uses/yr, 130+ languages | Free (nonprofit) | The pedagogy bar to meet; plain aesthetics, no progression/curriculum spine, thin biology, analytics paywalled (PhET-iO) |
| **oPhysics** | Single-author physics catalog (Tom Walsh) | Free | See §2.2 — the founder's critique is structural |
| **Labster** | ~300 narrative 3D labs (bio/chem-heavy), HS+ | ~$79-109/student/yr | Cinematic but *click-through rails*, laggy, barely customizable — proof that 3D spectacle ≠ inquiry |
| **ExploreLearning Gizmos** | 550+ sims gr3-12 + lesson materials | $6/student site; $799/teacher | Big catalog, dated Flash-era look, text-heavy, no audio/multilingual, setup burden |
| **CK-12 PLIX / Flexi** | 1,200+ free micro-interactives + the biggest K-12 AI tutor (Flexi) | Free (NC license) | Shallow single-concept interactives; AI sits *beside* content, not *inside* the sim |
| **Javalab** | Hundreds of bite-size sims, all subjects | Free (ads) | Radical simplicity, minimal depth, no pedagogy/teacher layer |
| **Falstad CircuitJS1** | Engineer-grade circuit sim (GPLv2) | Free | The archetype of ugly-but-powerful; beloved despite its UI |
| **Physics Aviary / myPhysicsLab / Physics Classroom** | Free physics labs & mechanics sims | Free | Great lab mechanics / open Apache-2.0 math (myPhysicsLab); programmer-art UIs |
| **ChemCollective** (CMU) | Open-ended virtual chem bench | Free, **CC BY-NC-ND** | The right *idea* for chemistry; legally unusable in a commercial product — we build our own bench |
| **BioInteractive / Visible Body / BioDigital** | HHMI activities; paid 3D anatomy suites | Free / paid | Anatomy atlases ≠ biology simulation; **K-12 bio sim is the least-served subject** |
| **Algodoo / Tinkercad Circuits** | Physics sandbox; breadboard+Arduino sim | Free (proprietary) | UX benchmarks for playfulness & approachable electronics |
| **Concord Consortium** (MW, CODAP, SageModeler) | Research-grade modeling & data tools | Free; CODAP is MIT | Deep pedigree, utilitarian UIs; CODAP is a reusable data-analysis gem |
| **GeoGebra / Desmos** | The math visualization duopoly | Free for **non-commercial**; commercial = paid agreements | Can't legally build on either — we own our math layer |
| **Brilliant** | 60+ polished interactive STEM courses | ~$13.49-27.99/mo | The consumer bar for interaction polish; no sandbox, no teachers, closed |
| **New entrants** (Pivot Interactives, Beyond Labz, VRLab, WhimsyLabs, PraxiLabs) | Real-experiment video data; VR/AI labs | Paid | Niches (real data, VR); none ships an AI that reads live sim state |

### 2.2 The oPhysics diagnosis (why its GUI feels wrong)

oPhysics sims are **GeoGebra applet exports** — which explains everything the founder dislikes: default GeoGebra widgets (thin sliders, stacked checkboxes, tiny fonts), fixed-size desktop canvases, no touch or responsive layout, no design system, one disconnected page per sim. The lesson is architectural, not cosmetic: **you cannot skin your way out of a tool-generated UI**. And strategically: GeoGebra is free only for non-commercial use — the oPhysics approach is legally closed to a commercial platform anyway. Smart Lab owns its rendering and design system outright (§6, §7).

### 2.3 What makes PhET the gold standard (our pedagogy baseline)

Twenty years of published research, distilled into principles every Smart Lab sim must meet:

1. **Implicit scaffolding** — guidance via affordances, constraints, cueing, and feedback instead of instruction walls ("guiding without feeling guided").
2. **Minimal text; exploration starts in seconds.**
3. **Immediate feedback with multiple linked representations** — motion, vectors, graphs, and numbers move *together*.
4. **Guided inquiry over recipes** — challenges that let students own the question.
5. **Interview-based iterative design** with real students.
6. **Inclusive design** (descriptions, sonification, alternative input) that nobody else matches — table stakes for us, differentiator vs everyone else.

### 2.4 Where the whole market is weak (validated gaps)

1. Dated desktop-era GUIs almost everywhere; even PhET is plain rather than beautiful.
2. Fragmented catalogs with no shared design system — students relearn every sim's UI.
3. Weak touch/Chromebook optimization outside PhET & Brilliant.
4. **No progression spine** — sims are islands; nobody sequences Grade 1→12 with standards, prerequisites, and mastery.
5. Analytics absent or paywalled (PhET-iO, Labster, Gizmos).
6. Guidance is binary: zero help (Falstad) or scripted rails (Labster). Nothing adapts in between.
7. **No in-sim AI** — CK-12's Flexi sits beside content; AI entrants are VR-first and small.
8. Accessibility neglect (PhET aside) — and it's a district procurement requirement.
9. Subject silos: physics over-served free; **elementary (1-5) and biology under-served**; math lives in a separate (legally closed) ecosystem.
10. Polish is paywalled: the well-designed products cost $3.50-$109/student/yr.

### 2.5 Our differentiation (ranked)

1. **Brilliant-quality design on PhET-quality pedagogy, across all four subjects and all 12 grades, in one design system.** No one has both.
2. **AI assistant *inside* the sim** — reads live experiment state, nudges Socratically, sets parameters on request. The clearest 2026 white space (§5.3, §7.6).
3. **A curriculum spine** — NGSS/CCSS-sequenced progression with mastery, making the lab a course companion, not a link farm (§4).
4. **Sandbox + Guided + Challenge on one engine** — bridges Falstad-power and Labster-structure without either's flaw (§3.2).
5. **Teacher analytics on inquiry behavior** in the base price — attacking the PhET-iO/Gizmos paywall (§5.4).
6. **Elementary and biology depth** — the two emptiest quadrants of the market (§8).
7. **Accessibility parity with PhET** — procurement-grade (§6.4).
8. **Pricing disruption** — generous free Explore tier; school tier under Gizmos' $6/student (final pricing = open question §12).

### 2.6 Reuse legally vs build ourselves

**Safe to reuse (verified licenses):** SceneryStack libraries (MIT — mined for patterns, not adopted; §7.1) · myPhysicsLab engines (Apache-2.0 TypeScript mechanics) · CODAP data workbench (MIT) · PhET *published* sims are CC BY 4.0 embeddable with attribution — but their licensing page scopes this to sims released before March 29, 2026, so verify per-sim before any embedding; useful at most as a stopgap while our own sims ship, never as the product.

**Legally closed (do not build on):** GeoGebra & Desmos (non-commercial/negotiated), ChemCollective (BY-NC-ND), CK-12 content (NC), CircuitJS1 & NetLogo (GPL — clean-room only), Labster/Gizmos/Visible Body/BioDigital/Brilliant/Algodoo/Tinkercad (proprietary).

**Build ourselves (the moat):** the design system, the cross-subject engine + sim catalog (especially chemistry bench & biology), the AI guidance layer, the curriculum spine, teacher analytics, and assessment. Details in §7.

---

## 3. Product Definition

### 3.1 Personas

| Persona | Needs | Smart Lab answer |
|---|---|---|
| **Explorer (Grades 1–5)** | Play, wonder, big friendly controls, no reading walls | Explore mode, icon-first UI, narrated hints, challenges as games |
| **Learner (Grades 6–8)** | Understand *why*, prepare for tests, do "real" experiments | Guided Labs, measurement tools, first quantitative graphs |
| **Achiever (Grades 9–12, AP)** | Rigor, data, equations, exam alignment | Full data/vector overlays, CSV export, derivations, AP-tagged labs |
| **Teacher** | Assign, project in class, see who's stuck, prove standards coverage | Assignments, class dashboard, presenter mode, NGSS coverage report |
| **Parent (GradeNext home users)** | Safe, self-serve, visible progress | Kid-safe AI, progress reports, no setup |

### 3.2 The Three Modes (every sim, where applicable)

1. **🧭 Explore** — open sandbox. All controls unlocked, no goals. Curiosity first. (This is where PhET stops.)
2. **🧪 Guided Lab** — a structured experiment on top of the sim: *Question → Hypothesis → Setup → Run & Measure → Data → Conclusion*. Checkpoints auto-verify setup and collected data; results flow into the Lab Notebook. This is the "do experiments like a real lab" core of Smart Lab.
3. **🎯 Challenge** — goal-based puzzles with stars/XP ("Land the rover with < 5 m/s", "Keep the food web alive for 10 years", "Build a circuit that lights 3 bulbs equally"). Turns mastery into play.

### 3.3 Where it lives

Smart Lab is a module of the GradeNext platform: same accounts, same classes, same design language family. It must also run **standalone** (own URL, shareable sim links) so teachers anywhere can use and spread it — the acquisition funnel into GradeNext.

---

## 4. Curriculum Coverage

### 4.1 The standards we align to

**Science → NGSS** (Next Generation Science Standards, adopted/adapted by ~44 states). NGSS defines **208 Performance Expectations (PEs)** across K-12, each weaving three dimensions: a **Disciplinary Core Idea** (PS1-4 Matter/Forces/Energy/Waves · LS1-4 Organisms/Ecosystems/Heredity/Evolution · ESS1-3 Universe/Earth/Human Activity · ETS1 Engineering), a **Science & Engineering Practice**, and a **Crosscutting Concept**.

**Math → Common Core (CCSS-M)**, K-8 domains through the HS Algebra 1 → Geometry → Algebra 2 → Precalc/Calc/Stats sequence.

### 4.2 Why simulations are not decoration here — they ARE the standard

NGSS standards describe what students **do**, and four of its eight Science & Engineering Practices are literally what a Smart Lab sim delivers: *Developing & Using Models*, *Planning & Carrying Out Investigations*, *Analyzing & Interpreting Data*, and *Using Mathematics & Computational Thinking*. **Roughly half of all 208 PEs begin with "Develop a model…", "Plan and conduct an investigation…", or "Use mathematical representations…"** — sentences a textbook cannot satisfy but a Guided Lab satisfies natively. Smart Lab is therefore positioned not as enrichment but as the *primary instrument* for NGSS compliance — a major selling point to US schools.

### 4.3 Coverage strategy

- **K-5 is grade-specific** in NGSS — we tag sims to exact grades (e.g., Grade 5 particle model of matter, Grade 3 balanced/unbalanced forces).
- **6-8 and 9-12 are bands** — states sequence them differently, so Smart Lab treats in-band grade assignment as **configurable per school**, defaulting to the most common split (6: Earth/energy · 7: life + intro chemistry · 8: physics + space; HS: Bio → Chem → Physics, with a physics-first toggle).
- **Every sim carries standards tags** (NGSS PE codes + CCSS-M clusters), powering search, teacher reports, and GradeNext course integration.
- **AP alignment** at Grade 11-12: AP Physics 1/2/C (2024-25 revised units — fluids now in Physics 1), AP Chemistry (9 units), AP Biology (8 units), AP Statistics, AP Calculus.

### 4.4 How big is "everything"?

Research sizing: full coverage of every high-value visualizable topic K-12 is **~320-385 distinct topics** (Physics ~75-90 · Chemistry ~45-55 · Biology ~55-65 · Earth/Space ~45-55 · Math ~100-120). For calibration, PhET — the field benchmark — covers K-12 *plus intro college* with ~170 sims. Our catalog (§8) reaches this with **~165 sims**, because one adaptive-depth sim with multiple Guided Labs covers many topics and grades (one Waves engine serves Grade 1 sound patterns, Grade 4 amplitude/wavelength, Grade 8 wave math, and Grade 11 interference).

The full grade-by-grade topic matrix and topic → simulation mapping live in **[docs/SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md)**.

---

## 5. Core Features

### 5.1 The Sim Shell (the common player)

Every simulation runs inside one shared shell — this is where most of the product value concentrates and what makes sim production cheap:

- **Canvas-first stage** — the simulation fills the screen; controls dock to edges and collapse. No PhET-style gray dialog boxes floating over the action.
- **Parameter panel** — sliders, steppers, toggles, presets. Density adapts to grade band (see §5.5).
- **Time controls** — play / pause / single-step / reset; slow-motion (0.1×–1×) and fast-forward (up to 100× for orbits, ecosystems, geology); a scrubbable recent-history timeline for "wait, what just happened?" replays.
- **Measurement toolbox 🧰** — draggable instruments that work across all sims where physically meaningful: ruler/tape, protractor, stopwatch, motion sensor, thermometer, balance/scale, voltmeter & ammeter, pH probe, magnifier. Learning to *choose and place instruments* is itself NGSS practice.
- **Overlays** — vectors (velocity/acceleration/force), field lines, grids, trails/traces, energy bars, particle labels. Individually toggleable; consistent colors platform-wide (§6).
- **Live graphing** — record any exposed variable vs. time or vs. any other variable; multi-series; auto-scaling; pinnable next to the stage. One tap sends a graph to the Lab Notebook; data exports as CSV.
- **Data table** — running measurements log (auto + manual "record data point" button, like a real lab).
- **Snapshot camera 📸** — captures stage + settings into the Lab Notebook.
- **Save / Share state** — every experiment state serializes to a short URL. Teachers share exact setups; students submit exact results; bug reports reproduce exactly.
- **Accessibility layer** — full keyboard operation, screen-reader descriptions of state and events, reduced-motion mode, colorblind-safe palettes (§6.4).

### 5.2 The Lab Notebook 📓

A per-student digital lab notebook — the feature no competitor does well:

- Auto-collects snapshots, graphs, and data tables from any sim session.
- Structured lab-report scaffolds per grade band (K-5: draw + one sentence; 6-8: hypothesis/observation/conclusion; 9-12: full report with uncertainty discussion).
- Rich text + sketching on top of snapshots.
- Exports to PDF (print for class, attach anywhere).
- Teacher review & comment flow; plagiarism-resistant because data is the student's own run.

### 5.3 The AI Lab Assistant 🤖 (GradeNext AI inside the lab)

Powered by the Claude API, with the **live sim state as context**:

- **"Why did that happen?"** — explains the phenomenon the student *just caused*, at their grade's reading level.
- **Socratic hints** in Guided Labs — nudges ("What happens to the period if you only change the mass? Try it"), never answer-dumps.
- **"What if?" generator** — proposes the next experiment based on what the student has already tried.
- **Auto-quiz** — 3 quick questions generated from the student's own session data.
- **Teacher co-pilot** — drafts lab worksheets and discussion questions from any sim.
- **Safety rails** — curriculum-scoped, age-appropriate output, no free-form chat for young grades (choice-chip interactions instead), full logging for review, COPPA-conscious (no PII to the model).

### 5.4 Teacher & Classroom Tools 🍎

- **Assign** any sim/Guided Lab/Challenge to a class with due dates; auto-checked checkpoints.
- **Class dashboard** — who explored, who finished, common wrong turns, time-on-task.
- **Presenter mode** — a clean, big-type projector view with a laser-pointer cursor and hidden student chrome; teacher drives one sim for the whole class.
- **Standards report** — NGSS/Common Core coverage per class, exportable (admin-pleasing).
- **Setup links** — pre-configured sim states as starting points for differentiated instruction.

### 5.5 Grade-Adaptive Depth (one sim, four skins)

The same underlying engine renders per grade band — our sharpest differentiator (PhET builds *separate* sims per level; we adapt one):

| Band | UI | Example: Circuits sim |
|---|---|---|
| **K-2** | Icons, narration, 2–3 giant controls, no numbers | "Connect the battery. Make the bulb glow!" |
| **3-5** | Simple numbers, friendly labels, guided discovery | Brightness vs. number of batteries; series vs. parallel by dragging |
| **6-8** | Quantitative: readouts, first graphs, units | Measure V and I; discover Ohm's law from own data |
| **9-12** | Full instrumentation, equations, uncertainty | Kirchhoff's laws, internal resistance lab, exported CSV analysis |

A student (or teacher) can always switch depth — a 4th grader can peek upward; a 10th grader can drop down to rebuild intuition.

### 5.6 Progression & Gamification 🏆

- XP per experiment; badges per domain ("Circuit Master", "Gene Wizard", "Orbit Architect").
- **Discovery achievements** — awarded for *finding* phenomena ("You discovered resonance!"), rewarding exploration, not just completion.
- Streaks and a "Lab License" ladder (Junior Scientist → Researcher → Principal Investigator) that unlocks advanced instruments cosmetically (never gates learning content).
- Class-level (not public) leaderboards only — no cross-school comparison pressure.

### 5.7 Discovery & Navigation

- Browse by **grade**, **subject**, **NGSS standard**, **GradeNext course unit**; instant search.
- **Collections** — curated sequences ("Forces & Motion — Grade 8, 6 sims + 4 labs") matching common curricula.
- Each sim page: preview video-loop, learning objectives, standards tags, related sims, teacher notes.

---

## 6. UX & Design System

The founder's core complaint about oPhysics-class tools is the GUI. This section is therefore a first-class part of the plan.

### 6.1 Design principles

1. **The phenomenon is the hero.** The canvas gets the pixels. Controls are quiet, docked, collapsible. Nothing floats over the action by default.
2. **Progressive disclosure.** First load shows the 1–3 controls that matter. Everything else is one tap away. (PhET's own research: fewer visible controls → more systematic experimentation.)
3. **Immediate feedback.** Every interaction responds within one frame — drag a mass mid-flight, physics answers instantly. No "apply" buttons.
4. **Implicit scaffolding.** The design nudges productive paths (sensible defaults, meaningful presets, gentle highlights) without walls of instruction text.
5. **Touch-first, mouse-refined.** Fat targets, gestures (pinch-zoom the stage, two-finger pan), and hover niceties on desktop.
6. **Consistent physical language.** Same color always means the same quantity, everywhere (see 6.3). Same instrument icon everywhere. Knowledge transfers between sims.
7. **Delight without noise.** Micro-animations, satisfying sounds (togglable), confetti on challenge stars — celebration, never distraction.

### 6.2 Layout system

- **Stage** (canvas) — fills viewport.
- **Control dock** — right on desktop, bottom sheet on touch; collapsible groups; grade-band density.
- **Tool rail** — left; drag instruments onto the stage.
- **Data drawer** — bottom; graphs & tables slide up, pinnable side-by-side on wide screens.
- **Assistant bubble** — corner; expands to a side panel.
- Fullscreen/presenter collapses everything to stage + minimal HUD.

### 6.3 Visual identity ("LabKit")

- Modern, clean, slightly playful; soft depth (subtle shadows/glass), rounded geometry; light & dark themes (dark = "night lab" — students love it, projectors need light).
- **Semantic color tokens across ALL sims:** velocity = blue, acceleration = orange, force = red, energy = amber/green scale, temperature = thermal ramp, charge + = red / − = blue, DNA bases = fixed 4-color set, pH = standard indicator ramp. This consistency is a pedagogical feature, not just styling.
- Typography: a friendly geometric sans for UI, a proper math font (KaTeX) for equations; K-2 gets larger type ramps.
- Iconography: one custom line-icon set for instruments/actions (the toolbox must feel like *equipment*, not clip-art).

### 6.4 Accessibility (WCAG 2.2 AA target)

- Full keyboard operation of sims (focus model over canvas objects), screen-reader live descriptions of state changes, pause-safe (nothing requires reflexes except opt-in challenges), captions/transcripts for narration, reduced-motion mode, colorblind-safe encodings (color never the sole channel — patterns/labels double-encode), dyslexia-friendly font option.

---

## 7. Technical Architecture

### 7.1 Recommended stack (research-verified licenses & maintenance status, Aug 2026)

| Layer | Choice | Why |
|---|---|---|
| Language / UI | **TypeScript + React 19**, Radix UI primitives + Tailwind tokens | Accessible-by-default controls; the whole ecosystem below is React-friendly |
| 2D rendering | **PixiJS v8** (WebGL) with React DOM control overlay | Fastest batched 2D scene graph; active (v8.16, 2026); WebGPU path later |
| 3D rendering | **Three.js + react-three-fiber (+ drei)** | Declarative 3D as React components — molecules, anatomy, orbits; very active |
| Physics | **Rapier** (`rapier2d-deterministic` / `rapier3d`), Apache-2.0 | Rust→WASM, fast, and **cross-platform deterministic** — reproducible experiments on every device (the only mainstream engine guaranteeing this) |
| Math scenes | **Mafs** (MIT) + **JSXGraph** (MIT dual-license) for construction geometry | Modern declarative math visuals; JSXGraph covers compass-straightedge tools |
| Equations | **KaTeX** (MIT) | Fast math typesetting |
| Live charts | **Custom canvas chart layer on D3 scales** | 60 fps streaming oscilloscope-style graphs need canvas, not SVG re-renders; Recharts only in teacher dashboards |
| Chemistry | **3Dmol.js** (BSD-3) + **Mol\*** (MIT) viewers; **RDKit-JS** (BSD-3) cheminformatics; Kekule.js/openchemlib editor; PubChem + RCSB free data APIs | Permissive, education-proven, real chemistry under the hood |
| Circuits | **Own MNA solver** (modified nodal analysis, TS, ~2-4k LOC) | Falstad's CircuitJS1 is GPL (contamination risk); K-12 scope is small enough to own — and it becomes a differentiating asset |
| Ecosystems/epidemics | **Own lightweight agent-based-model engine** on the sim core | NetLogo is GPL + paid commercial license; our ABM needs are simple |
| Monorepo | **pnpm workspaces + Turborepo** | Cached parallel builds across 150+ sim packages |
| Sim player app | **Vite SPA**, per-sim lazy chunks | Sims don't need SSR; fastest dev loop |
| Embedding | **npm package into GradeNext (primary)** + **sandboxed iframe player with postMessage API (universal)** | Zero-overhead in-house; iframe serves LMS/LTI + crash isolation. No module federation |
| AI tutor | **Claude API** via server-side proxy — Haiku-class for standard turns, Sonnet-class escalation, prompt-cached | See §7.6 |

**On PhET's own stack (SceneryStack, MIT):** don't build on it (a parallel non-React universe with no outside community) — **mine it** for its accessibility architecture (parallel DOM), observable-property pattern, and strict model/view separation. PhET *sim* repos have **mixed licenses** (some MIT, some GPL-3.0) — our policy is learn-from, never port; check each repo before even reading-to-port.

### 7.2 Licensing policy (red flags found in research)

- **No GPL/AGPL code in the monorepo** (CircuitJS1, NetLogo, some PhET sims). Clean-room reimplementation only.
- **GeoGebra**: NOT usable — commercial embedding requires a paid agreement (CC BY-NC-SA materials). This is also oPhysics' foundation — one more reason we build our own.
- **Desmos API**: production embedding requires a negotiated partner agreement — don't make sims depend on it.
- **Anatomy assets**: Z-Anatomy (CC BY-SA) usable with attribution + share-alike on modified *models*; keep provenance records.
- Everything in our chosen stack is MIT/BSD/Apache/ISC — safe for a commercial product.

### 7.3 The engine: deterministic, serializable, replayable

The engine's contract is what enables Smart Lab's signature features (share links, replays, teacher review, AI context):

```ts
// @gnlab/engine — fixed-timestep accumulator loop
const DT = 1/120;                        // model tick (render interpolates)
while (acc >= DT) { model.step(DT, inputs.drain()); acc -= DT; tick++; }
view.render(model, acc / DT);            // Pixi / R3F / Mafs
```

- **Determinism rules:** fixed dt; seeded PRNG only (never `Math.random`/`Date.now` in models); Rapier deterministic build; model state = plain serializable data (zod-validated).
- **Save** = snapshot JSON → **Share** = compressed state in URL → **Replay** = `{seed, params, input-event log}` re-run through the engine. Tiny payloads, perfect fidelity — and the event log doubles as the learning-analytics stream and the AI tutor's context.
- **Accuracy QA:** every sim ships golden-value tests against analytic solutions (projectile range, RC decay, Hardy-Weinberg equilibrium…), so physics bugs can't silently teach misconceptions.

### 7.4 Sim-as-package: the manifest

Every sim is a small package: `manifest.ts + model/ + Sim.tsx + labs/ + a11y/`. The manifest drives the catalog, URL state, teacher presets, standards search, and AI context:

```ts
{
  id: "phys.projectile", version: "1.4.0",
  subject: "physics", gradeBands: ["6-8", "9-12"],
  standards: { ngss: ["MS-PS2-2", "HS-PS2-1"], ccssMath: ["HSF.IF.B.4"] },
  paramsSchema: ProjectileParams,          // zod — one schema, many consumers
  capabilities: ["measure.ruler", "measure.stopwatch", "graph.live", "data.csv"],
  engine: { physics: "rapier2d-deterministic", tickRate: 120 },
  entry: () => import("./ProjectileSim"),  // lazy chunk
  aiTutor: { contextBuilder: "./aiContext" }
}
```

### 7.5 Monorepo layout

```
gradenext-smart-lab/            (pnpm + Turborepo)
├─ packages/
│  ├─ engine/       # loop, seeded PRNG, units, serialization, event log
│  ├─ ui-kit/       # LabKit: Radix controls, sim chrome, themes, i18n
│  ├─ tools/        # measurement instruments (ruler, probes, meters…)
│  ├─ graphing/     # canvas live charts, data table, CSV/PNG export
│  ├─ physics/      # Rapier adapters · mna/ circuits · abm/ agents
│  ├─ chem/         # 3Dmol/Mol*/RDKit wrappers, PubChem client
│  ├─ ai-tutor/     # assistant UI, context builders, proxied Claude client
│  └─ manifest/     # schemas, registry, NGSS/CCSS taxonomy
├─ sims/            # 150+ sim packages (phys.*, chem.*, bio.*, earth.*, math.*)
├─ apps/
│  ├─ player/       # Vite SPA: /sim/:id, iframe-embeddable, postMessage bridge
│  ├─ catalog/      # browse/search by grade / subject / standard
│  └─ authoring/    # internal QA harness & lab-script editor
└─ services/        # thin backend: state store, AI proxy, progress API (or reuse GradeNext's)
```

### 7.6 AI Lab Assistant — implementation notes

- **Server-side proxy only** (no API keys in the client). Per turn: compact structured context = manifest excerpt + current params + recent event-log entries + student question.
- **Model routing:** Haiku-class (`claude-haiku-4-5`) for standard tutoring turns; Sonnet-class escalation for multi-step reasoning. **Prompt-cache** the stable prefix (system prompt + sim manifest) so per-turn cost is dominated by the small dynamic state. Hard caps on turns/tokens per student per day.
- **Minor-safety:** Socratic system prompt (guide, never dump answers; stay on the experiment), input/output moderation, **no student PII in prompts** (COPPA/FERPA), teacher-visible transcripts, choice-chip (no free text) mode for K-5. Confirm education-agreement / data-retention terms with Anthropic during procurement.
- **The differentiator:** the assistant *reads live experiment state and can set parameters* through a whitelisted tool interface ("Let me slow it down and add the velocity vectors — watch the top of the arc"). Khanmigo is only beginning to touch this pattern; nobody ships it well for K-12 sims yet.

### 7.7 Performance & offline (the Chromebook reality)

Reference device: 4 GB RAM, integrated-GPU Chromebook with 30 tabs open. Budgets: **< 300 KB gz** initial JS per sim (shared engine chunks cached), 60 fps target / 30 fps design floor, TTI < 3 s cached. Tactics: OffscreenCanvas + Web Worker for heavy sims (all-Chrome fleet makes this safe), WASM SIMD physics, devicePixelRatio cap 2, pause on tab-hide. **PWA:** service-worker precache of engine + visited sims, IndexedDB experiment saves — labs survive school Wi-Fi. A real $250 Chromebook sits in the QA loop.

### 7.8 Accessibility architecture

Hybrid rendering is our shortcut to WCAG 2.2 AA: **every control is real DOM** (Radix sliders/buttons/readouts) — only the "world" is canvas. Add: arrow-key manipulation of in-canvas objects with `aria-live` announcements, a text "experiment narrator" region, a data-table alternative for every graph (doubles as CSV export), `prefers-reduced-motion`, and sonification on flagship sims (PhET-style, scoped per-sim as a quality tier).

---

## 8. Simulation Catalog

**~164 simulations** across six areas, each with grade-band reach, modes (Explore / Guided Labs / Challenges), and a build tier. Full detail: **[docs/SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md)**.

| Subject | Sims | T1 (MVP flagships) | T2 | T3 |
|---|---|---|---|---|
| Physics / Physical Science | ~46 | 10 | 20 | 16 |
| Chemistry | ~30 | 5 | 12 | 13 |
| Biology / Life Science | ~32 | 8 | 12 | 12 |
| Earth & Space | ~23 | 4 | 9 | 10 |
| Math | ~31 | 6 | 12 | 13 |
| Engineering (ETS) | 2 | — | 1 | 1 |
| **Total** | **~164** | **33** | **66** | **65** |

**The 33 T1 flagships** (examples: Circuit Builder, Motion Grapher, Forces & Newton's Laws, Projectile Launcher, Energy Skate Park+, Wave Machine, Optics Bench, States of Matter, Gravity & Orbits, Build an Atom, Virtual Reaction Bench, pH Lab, Periodic Table, Cell Explorer, Ecosystem Simulator, Natural Selection, Heredity Lab, Human Body Atlas, Photosynthesis Lab, Plant Growth Lab, Food Web Builder, Moon Phases, Seasons, Water Cycle, Plate Tectonics, Fraction Lab, Number Line Universe, Function Grapher, Balance Scale Equations, Probability Arcade, Unit Circle, Motion↔Calculus links) are chosen to (a) cover the highest-traffic topic in every grade band, (b) exercise every engine subsystem early, and (c) each span 3+ grade levels via adaptive depth.

**Deliberate reuse:** Gravity & Orbits powers the Solar System Explorer; Gas Properties powers HS Gas Laws; the Function Grapher ingests live data from any physics sim; Probability Arcade feeds AP Statistics. Engines are amortized across subjects — that is what makes 164 sims feasible.

---

## 9. Roadmap

Phases gate on **shipped, usable product** — every phase ends with something students can learn from. Durations assume a small team (2-3 engineers + 1 designer, AI-assisted development); they scale with team size, and sim production accelerates as the engine matures.

### Phase 0 — Foundation & Proof (≈ 6-8 weeks)
- **LabKit design system** (tokens, semantic colors, components, K-2 → 9-12 density variants) with a living style guide.
- **Sim engine core**: deterministic fixed-timestep loop, units system, state serialization (save/share URLs), sim manifest schema.
- **Sim shell v1**: stage + control dock + time controls + live graphing + snapshot.
- **5 proof sims** spanning subjects & renderers: Circuit Builder, Motion Grapher, States of Matter, Gravity & Orbits (tests 2D engine breadth), Fraction Lab (math manipulatives).
- Catalog site skeleton; usability test with 5-10 real students.
- **Gate:** the 5 sims feel *better than PhET* to test users, on a Chromebook.

### Phase 1 — MVP Launch (≈ 3-4 months)
- **20 T1 sims** live; **Guided Lab framework** (checkpointed experiments) with ~30 labs; **Lab Notebook v1** (auto-capture, PDF export).
- Grade-adaptive depth on all applicable sims; measurement toolbox v1 (ruler, stopwatch, meters, probes).
- Browse/search by grade, subject, standard; shareable sim states.
- Embedded into GradeNext (SSO + navigation) *and* standalone URL.
- **Gate:** first classes complete assigned labs end-to-end.

### Phase 2 — The Smart in Smart Lab (≈ 3-4 months)
- Remaining **T1 sims (33 total)**; **AI Lab Assistant** (explain / hint / what-if / auto-quiz, age-gated); **Challenge mode + XP/badges**.
- **Teacher suite v1**: assignments, class dashboard, presenter mode.
- Accessibility pass to WCAG 2.2 AA on the shell + top sims.
- **Gate:** measurable learning-gain pilot (pre/post concept checks) in ≥3 classrooms.

### Phase 3 — Coverage & Scale (≈ 6 months)
- **T2 wave (+66 sims → ~99 cumulative)**, prioritized by GradeNext usage data; NGSS standards-coverage reports for teachers; Spanish localization decision; PWA/offline mode; AP-depth labs for Bio/Chem/Physics.
- **Gate:** ≥60% of NGSS PEs mapped; Smart Lab attached to every GradeNext science unit.

### Phase 4 — Full Catalog & Moat (ongoing)
- **T3 long tail → ~164 sims**; advanced analytics (misconception detection from experiment patterns); teacher-authored Guided Labs on existing sims (content marketplace); districts/LMS integrations (Google Classroom, Clever, LTI).

**Production model:** after Phase 1 the engine + shell + templates make an average new sim ≈ 1-2 dev-weeks (simple manipulatives days; complex engines like Plate Tectonics longer). Content specs (learning goals, lab scripts, misconceptions to target) are written per-sim by an educator/founder and reviewed against NGSS tags — pedagogy is spec'd, not improvised.

---

## 10. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Catalog scope explosion** (hundreds of topics) | High | Shared engine/shell so marginal sim cost falls; strict phase gates; reuse one sim across many grade bands via adaptive depth |
| **Physics/chemistry accuracy bugs** teach misconceptions | Medium | Deterministic engine + golden-value unit tests against analytic solutions; educator review pass per sim; visible "model limits" notes at HS depth |
| **Low-end Chromebook performance** | Medium | Perf budget per sim (60 fps on reference device), object pooling, capped particle counts, quality auto-step-down |
| **AI assistant cost & safety** | Medium | Response caching, small-context design, per-student rate limits; strict age-gated modes; no PII to model; human-reviewed prompt suite |
| **License contamination** from copying open-source sims | Medium | Clean-room policy: learn from GPL sims, never port code; use permissive (MIT/BSD/Apache) libraries only — see §7 licensing table |
| **Teacher adoption friction** | Medium | Standalone free tier of Explore mode; shareable links with zero login for viewing; import rosters from GradeNext |
| **Solo/small-team burnout** | High | Phases sized small; every phase ships a usable product; content pipeline templates |

---

## 11. Success Metrics

- **Learning:** pre/post concept-check deltas on flagship sims; Guided Lab completion rates; notebook quality rubric samples.
- **Engagement:** weekly active students, average experiments per session, return rate, challenge retry rate (healthy struggle).
- **Coverage:** % of NGSS PEs with a mapped sim (target: 60% by Phase 3, 90% at maturity); % of GradeNext units with an attached lab.
- **Teacher:** classes with ≥1 assignment/month, presenter-mode sessions, standards-report exports.
- **Quality:** sim frame-rate telemetry (P95 ≥ 50 fps on reference Chromebook), crash-free sessions ≥ 99.5%, accessibility audit pass per release.

## 12. Open Questions

1. **Branding:** "GradeNext Smart Lab" confirmed as public name? Assistant persona name?
2. **Standalone free tier:** how much is free vs. GradeNext-subscriber-only? (Recommendation: Explore mode free forever; Guided Labs, Notebook, AI, teacher tools = GradeNext.)
3. **Backend:** reuse GradeNext's existing auth/user/progress services, or does Smart Lab need its own? (Need a look at the main platform's API surface.)
4. **Languages:** English-only at launch, or is Spanish (large US classroom need) in scope early?
5. **AI provider budget:** monthly cap for Claude API in year 1?
6. **Team:** who builds this — size and skills available? (Roadmap in §9 assumes a small team; it compresses/stretches accordingly.)
