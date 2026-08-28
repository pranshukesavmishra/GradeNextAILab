# GradeNext Smart Lab — Advanced Features Specification

> **The extraordinary tier.** Everything beyond the MVP that turns a very good simulation catalog into a laboratory instrument nobody else on the market has.

**Status:** Proposal for review · **Version:** 1.0 · **Date:** 2026-08-28 · **Companion to:** [SMART_LAB_PLAN.md](./SMART_LAB_PLAN.md), [SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md)

---

## Table of Contents

1. [Thesis & Ground Rules](#1-thesis--ground-rules)
2. [Platform Primitives — the five things that unlock everything else](#2-platform-primitives)
3. [A. Deeper Experimentation (F1–F5)](#3-a-deeper-experimentation)
4. [B. Sensing & the Real World (F6–F8)](#4-b-sensing--the-real-world)
5. [C. AI Beyond Chat (F9–F14)](#5-c-ai-beyond-chat)
6. [D. Social & Classroom (F15–F17)](#6-d-social--classroom)
7. [E. Presentation & Creation (F18–F20)](#7-e-presentation--creation)
8. [F. Depth & Accessibility Frontiers (F21–F24)](#8-f-depth--accessibility-frontiers)
9. [G. Our Own Additions (F25–F30)](#9-g-our-own-additions)
10. [Why We Beat Each Competitor](#10-why-we-beat-each-competitor)
11. [Prioritization & the Extraordinary-Tier Shortlist](#11-prioritization--the-extraordinary-tier-shortlist)
12. [What We Deliberately Reject](#12-what-we-deliberately-reject)
13. [Tier-Specific Risks & Cost Envelope](#13-tier-specific-risks--cost-envelope)
14. [Open Questions](#14-open-questions)

---

## 1. Thesis & Ground Rules

The MVP gives a student a sim. The extraordinary tier gives a student **a laboratory**: instruments that travel between experiments, data that survives, runs that can be compared, classmates who can join, a real dataset to argue with, and a model whose assumptions are visible and editable.

**Four ground rules govern everything below.**

| Rule | Consequence |
|---|---|
| **Determinism is the product.** `{seed, params, input log}` reproduces any run exactly. | Time machine, replay export, class pooling, batch sweeps, verifiable records and AI context are all *free consequences* of an architecture already decided — not new subsystems. |
| **The 4 GB Chromebook is the floor, not the target.** | Every feature ships with a declared degrade path: what turns off, at what frame rate, with what user-visible message. A feature with no degrade path does not ship. |
| **Nothing unvalidated reaches a student.** | AI-generated content, teacher-authored labs and imported data all pass a validation gate before appearing in a student session. |
| **No feature may make the first 30 seconds worse.** | Advanced capability is *progressively disclosed*: hidden at K-5 depth, one control away at 6-8, fully exposed at 9-12 and behind an "Advanced" toggle. |

**Effort scale used throughout** (small team, engine mature, AI-assisted development):

- **Easy** ≈ ≤ 2 dev-weeks · **Medium** ≈ 3–8 dev-weeks · **Hard** ≈ 2–6 dev-months, and/or introduces recurring infrastructure or content cost.

**Phase mapping** extends the master-plan roadmap:

| Phase | Name | Position |
|---|---|---|
| **P2** | The Smart in Smart Lab | as in master plan (AI assistant, teacher suite v1) |
| **P3** | Coverage & Scale | T2 sim wave, PWA, standards reports |
| **P4** | Moat | analytics, LMS, teacher authoring |
| **P5** | Frontier | new: the capabilities that require P2–P4 primitives to exist first |

---

## 2. Platform Primitives

Twenty-four features share five substrates. Build the substrates once, in this order, or every feature below costs 3× more.

### P-1 · The Data Bus (cross-sim ports)

A typed publish/subscribe channel in `@gnlab/engine`. Every sim declares in its manifest what it emits and accepts:

```ts
ports: {
  out: [{ id: "trajectory", kind: "series", schema: { t: "s", x: "m", y: "m" }, rate: 20 }],
  in:  [{ id: "windProfile", kind: "series", schema: { h: "m", v: "m/s" } }]
}
```

Series are **unit-tagged** (see F29), timestamped in model time, and ring-buffered at a declared rate. The bus is in-process when sims are in the same workbench, and `postMessage`-bridged when one is an iframe embed. Backpressure rule: a consumer that cannot keep up gets decimated samples, never a stalled producer.

**Unlocks:** F1, F5, F7, F16, F23, F26.

### P-2 · The Instrument Protocol

Measurement tools (`@gnlab/tools`) become sim-independent objects with a contract — `attach(target) → reading stream`, a calibration surface, a declared precision, and a rendering that works on a Pixi stage or an R3F scene. A thermometer does not know it is in a chemistry sim; it knows it is reading a `temperature` field at a point.

**Unlocks:** F3, F5, F6, F16, F29.

### P-3 · The Sim Control RPC (whitelisted actions)

A per-sim declarative action list — the same surface used by the AI assistant, the teacher's presenter mode, live class broadcast, and replay playback:

```ts
actions: [
  { id: "setParam", args: { key: "angle", range: [0, 90], unit: "deg" } },
  { id: "toggleOverlay", args: { key: "velocityVectors" } },
  { id: "setTimeScale", args: { range: [0.05, 4] } }
]
```

Every action is validated against the manifest's zod schema, rate-limited, journaled into the input log, and reversible. **No caller — human, AI or remote peer — can touch the model except through this list.**

**Unlocks:** F8, F9, F14, F15, F17.

### P-4 · The Session Service (presence & shared state)

A thin realtime service: rooms, presence, authoritative parameter state, and a broadcast channel. WebSocket with a documented reconnect/resync protocol (on reconnect: fetch snapshot, replay journal tail). This is the only genuinely *new backend* the tier requires.

**Unlocks:** F14, F15, F16.

### P-5 · Semantic Telemetry

The existing event log gets a semantic layer above raw input: `hypothesis_stated`, `variable_changed(var, from, to)`, `run_completed(outcome)`, `prediction_vs_result(delta)`, `confound_introduced`. Emitted by the shell and by lab scripts, stored per student, aggregated per class.

**Unlocks:** F2, F4, F10, F11, F16, F17.

---

## 3. A. Deeper Experimentation

### F1 · Multi-Sim Workbench & Cross-Sim Data Bus

**What.** Split the stage into 2 (or 4, on desktop) panes, each running a sim, with a wiring strip between them. Drag an output port to an input port: projectile trajectory → Function Grapher; ecosystem population counts → Data Studio; circuit current → Motion Grapher for a motor's speed. Wiring is part of the shared state, so a workbench has its own share URL.

**Why it matters.** The single biggest gap between school science and real science is that school data never leaves the page it was made on. Piping a physics sim into a graphing tool is the moment "y = ½at²" stops being an assertion and becomes a *fit to data the student generated*. It is also the cheapest route to genuine cross-disciplinary work (chemistry → math, biology → statistics).

**How.** P-1 plus a workbench route (`/bench?a=phys.projectile&b=math.grapher&wire=...`). Each pane is an independent engine instance with its own tick loop; the bus samples on the consumer's frame, not the producer's tick, so instances never block each other. Panes may run at different time scales — the bus carries model time, and the consumer resamples. Memory: cap two heavy sims (Pixi or R3F) per bench, and force a lightweight-renderer partner beyond that.

**Feasibility: Medium.** The engine is already instance-safe and serializable; the work is the port type system, unit coercion at wire time, and a layout that survives an 11" 1366×768 screen. **Device impact: High** — two live sims is the tier's heaviest routine operation. Mitigation: second pane capped at 30 fps, particle budgets halved, hard "one 3D sim per bench" rule, and on detected low memory the bench offers *sequential* mode (run A, capture its series, then feed B) which costs almost nothing.

**Phase: P3.**

### F2 · Student-Designed Experiments (Variable & Control Planner)

**What.** Before running, the student fills a short structured planner: *I will change* (IV), *I will measure* (DV), *I will keep the same* (controls), *I predict…*. The planner is generated from the sim manifest, so the choices are the sim's actual parameters. The engine then **watches for fair-test violations**: if the declared control `mass` changes mid-investigation, the shell flags it — "You changed two things at once. Your result can't tell you which one mattered. Undo, or add mass as a second variable?"

**Why.** Controlling variables is an NGSS science-and-engineering practice tested at every grade band, and it is the thing simulations usually *destroy* — a student flails sliders and calls it inquiry. This inverts that. It also produces a machine-readable experimental design, which is what makes F10 (misconception detection) and F16 (class pooling) possible at all.

**How.** A `design` object stored alongside the run; a middleware on the parameter store comparing every `setParam` against the declared design; a "confound ledger" the notebook renders. Grade-adaptive: at K-5 the planner is two picture-chips ("change" / "watch"); at 9-12 it adds replicate count, range and interval planning.

**Feasibility: Easy–Medium.** Pure application logic over existing schemas; the cost is UX iteration across four grade bands, not engineering. **Device impact: Negligible.** **Phase: P2** — cheap, uniquely differentiating, and a prerequisite for several later features.

### F3 · Uncertainty & Real-World Messiness Mode

**What.** A per-sim toggle (default off ≤ Grade 8, default on in HS/AP labs) that injects realistic imperfection: Gaussian sensor noise on instrument readings, quantized instrument resolution (a ruler reads to the nearest mm — not to eight decimals), reaction-time jitter on manual stopwatch use, and optional systematic error (a mis-zeroed balance, a thermometer offset). Readings then display as `24.3 ± 0.2 °C`, graphs carry error bars, and fits report R² and slope uncertainty.

**Why.** Perfect physics teaches the false lesson that data agrees with theory exactly, and leaves students unable to do the error analysis that AP Physics, AP Chemistry and IB internal assessments require. Deliberate messiness is also the honest answer to teachers' first objection to simulations: "it's not like the real lab."

**How.** Noise is applied in the **instrument layer** (P-2), never in the model — the model stays deterministic and the noise draws come from the same seeded PRNG, so a noisy run is still exactly reproducible. Each instrument declares `resolution`, `sigma`, and an optional `bias`; propagation to derived quantities uses standard first-order propagation, computed in the units layer (F29). Error bars are a rendering mode of the existing chart layer.

**Feasibility: Easy** for the noise and display; **Medium** for correct propagation through multi-step derived quantities and for the fitting/statistics UI. **Device impact: Negligible.** **Phase: P3** (HS labs wave).

### F4 · Time Machine & Experiment Diff

**What.** Three connected capabilities: (a) **scrub** — drag backward through the current run, step frame-by-frame, branch a new run from any point; (b) **overlay** — render run B ghosted behind run A, with both graphs on shared axes; (c) **diff** — a parameter-level comparison table plus a plain-language "what changed" summary: *"Angle 30° → 45° (+15°), everything else identical. Range increased 15.3 m → 17.7 m (+15.7%), flight time +41%."*

**Why.** Comparison is where conceptual change happens; students otherwise remember the last run only. The diff view makes the control-of-variables idea *visible* rather than preached, and pairs directly with F2.

**How.** Scrubbing uses periodic keyframe snapshots (every 2 s of model time) plus deterministic re-simulation to the exact frame — this is why replay is cheap: we store the input log, not frames. Overlay renders run B from its replay into a second, dimmed layer of the same scene graph. The diff is a structural comparison of two param objects plus outcome metrics the sim exports as `summaryStats`. The plain-language sentence is templated from the numbers; the AI assistant only adds the *causal* explanation on request (so diff works offline).

**Feasibility: Medium.** Deterministic replay makes it tractable; the cost is per-sim snapshot correctness (any sim holding state outside the model breaks it, so this doubles as an architecture conformance test). **Device impact: Medium** — overlay is a second render pass; capped at two concurrent runs and disabled for 3D sims on low-memory devices. **Phase: P3.**

### F5 · Free-Form Lab Bench

**What.** A sandbox surface where equipment from different sims coexists: put a thermometer and a pH probe into an exothermic reaction; wire a DC motor from the circuit sim to a pulley lifting a mass in the mechanics sim; drop a mirror from the optics bench into the wave tank. Not "every sim merged" — a curated set of **cross-compatible domains** (thermal + chemical, electrical + mechanical, optical + wave).

**Why.** It is the difference between a simulation *collection* and a *laboratory*. Open-ended equipment combination is the one thing ChemCollective got right and nobody has generalized; it is also where genuinely student-owned investigations live.

**How.** Requires two contracts: (1) instruments as portable objects (P-2), and (2) sims exposing **fields** — a sim declares `field("temperature", (x,y) → K)` and `field("current", nodeId → A)`, and any probe can sample any declared field. Cross-domain coupling is explicit and hand-authored per pair (an "energy bridge" object converting electrical power to mechanical torque with a declared efficiency) — *not* a general physics unification, which is where this feature would become unbounded.

**Feasibility: Hard.** Not technically exotic, but the combinatorics are: each domain pair is a designed, tested, pedagogically reviewed artifact. Scope control is the entire game — ship **three** domain pairs, not "any sim with any sim." **Device impact: High** (multiple engines live). **Phase: P5**, seeded by shipping the instrument protocol in P3.

---

## 4. B. Sensing & the Real World

### F6 · Device Sensors as Simulation Inputs

**What.** Three concrete labs, not a generic "sensor API":

| Sensor | Lab | Signal |
|---|---|---|
| **Microphone** | Sound & Waves: hum a note, see your waveform and FFT next to the generated tone; tune to a target frequency; measure your classroom's ambient dB | Web Audio `AnalyserNode` + autocorrelation pitch detection |
| **Camera** | Colour mixing & absorption (sample a real object's RGB); optional motion tracking of a rolling object → position-time graph | `getUserMedia` + canvas pixel sampling; MediaPipe Tasks Vision (WASM/WebGPU) for tracking |
| **Accelerometer** (tablets/convertibles) | Motion & forces: walk with the device, produce a real a-t graph, integrate to v-t and x-t | Generic Sensor API (`Accelerometer`), secure context, permission-gated |

**Why.** It closes the loop the market leaves open: the simulation stops being a substitute for reality and becomes an *instrument pointed at* reality. A student who sees their own voice on the same axes as the generated wave has learned something no animation delivers.

**How & privacy.** Hard rules: raw audio, video frames and sensor streams **never leave the device** — all processing is client-side, and the analysis output (a frequency number, an RGB triple, an acceleration series) is what enters the model. No frames or samples are persisted, uploaded, or sent to the AI proxy. Sensor use is opt-in per lab with a plain-language explainer, a persistent on-screen indicator, and a teacher/district-level kill switch in admin settings (schools disable cameras wholesale, so the feature must be optional by design). Generic Sensor and `getUserMedia` require HTTPS and are blocked in cross-origin iframes unless we set an explicit Permissions Policy — so sensor labs run in the first-party player, and the embeddable widget (F18) declares them unavailable.

**Feasibility: Easy** for microphone (Web Audio has done this for a decade) and camera colour sampling. **Medium–Hard** for camera motion tracking: MediaPipe runs ~30 fps in-browser on decent hardware, but on a 4 GB integrated-GPU Chromebook simultaneously running a sim it is not dependable — ship it as an explicitly labelled beta with a frame-rate floor check and an automatic fall back to manual frame-by-frame tagging (which is pedagogically fine and is what Pivot Interactives sells). **Device impact: Microphone Low; camera High.** **Phase: P4** (microphone earlier, in P3, if the Sound sims ship then).

### F7 · Real-Data Ingestion (Live Datasets + Student CSV Import)

**What.** Two directions.
**In:** curated live/periodic feeds — NASA (planetary and ephemeris parameters, solar imagery), NOAA/NCEI (climate normals, CO₂ and temperature series, tides, storm tracks), USGS (real-time earthquake feed, streamflow), PubChem/RCSB (compound properties, structures) — flowing into Earth/space/chemistry sims. *"This is the actual seismicity of the last 24 hours"* is a different lesson from a canned dataset.
**Out/compare:** a student uploads the CSV from their real classroom probeware or a hand-recorded table; the platform overlays it against the simulation run and computes residuals. "Where does the model disagree with your lab, and why?"

**Why.** Modelling — comparing a model to data and reasoning about the divergence — is the top of the NGSS practice hierarchy and essentially absent from every competitor. It also converts our main weakness (a simulation is not the real world) into the lesson.

**How.** **All external data goes through our own server-side proxy with a cache** — never direct browser fetch. Public agency APIs have inconsistent CORS, rate limits, key requirements and uptime; a Chromebook classroom of 30 hitting an agency endpoint simultaneously is both rude and fragile. The proxy normalizes into our series schema (P-1), caches per dataset with a sensible TTL (earthquakes: minutes; climate normals: months), and ships a **frozen fallback snapshot** with each dataset so a lab still works when the upstream is down or the school is offline. Every dataset carries visible provenance and citation. CSV import runs a column-mapping wizard with unit assignment, sanity-range validation, and a hard client-side size cap.

**Feasibility: Medium.** Per-dataset adapter work (each agency API is its own dialect) plus recurring maintenance when upstream schemas change — budget ongoing content-ops time, not just build time. **Device impact: Low.** **Phase: P3** for 3–4 marquee datasets (USGS quakes, NOAA climate, NASA planetary, PubChem), expanding through P4.

### F8 · Instrument Calibration & Reading Discipline *(bundled with F3/F6)*

A small but disproportionately valuable addition: instruments must be **zeroed and calibrated** before use in HS labs, and readings must be taken to the instrument's stated precision. Meniscus reading, parallax on analogue scales, tare on a balance. **Easy**, negligible device cost, **P3**, and it is exactly what lab-practical exams assess.

---

## 5. C. AI Beyond Chat

### F9 · AI That Drives the Sim (Guided Demonstrations)

**What.** The assistant is not beside the sim; it *operates* it. "Why does the ball land further at 45°?" → the assistant sets the angle to 30°, runs, annotates the range, sets 45°, runs, overlays both, turns on velocity-component vectors, and narrates each step in the transcript with the parameter changes shown as reviewable chips.

**Why.** It is the demonstration a great teacher gives, available to each student at their own pace — and it teaches *how to interrogate a system*, which is the transferable skill.

**How.** P-3 exclusively: the assistant may call only whitelisted actions with schema-validated arguments, at a rate limit, with every call rendered in the UI as an undoable step and journaled in the input log (so a demonstration is itself a shareable replay). No code execution, no arbitrary state writes. Guard against runaway sequences with a per-turn action budget and a "stop" control that is always live.

**Feasibility: Medium.** The AI-side work is ordinary tool use via the Claude API; the real cost is authoring and testing the action surface per sim and preventing incoherent action sequences on edge-case parameter combinations. **Device impact: Negligible** (server-side inference). **Phase: P2** — this is the plan's stated flagship differentiator and should ship with the assistant, initially on ~8 flagship sims.

### F10 · Misconception Detection from Behaviour

**What.** Behavioural signatures in the telemetry stream that reveal a wrong mental model, triggering a targeted, gentle intervention rather than a generic hint. Examples:

| Signature | Likely misconception | Intervention |
|---|---|---|
| Always raises force to keep constant velocity | "Motion requires continuous force" | Zero-friction challenge + predict-then-see |
| Changes 3+ parameters between runs, repeatedly | No control-of-variables schema | Activate F2 planner in scaffolded mode |
| Treats heavier = faster falling, repeatedly, in vacuum mode | Aristotelian gravity | Feather-and-hammer demo (F9) |
| Adds bulbs in series expecting brighter | Current "used up" / more = more | Ammeter overlay at each node |
| Sets pH 8 expecting "twice as basic as 4" | Linear reading of a log scale | Particulate zoom (F22) with ion counts |

**Why.** Misconceptions are stable, well-catalogued, and invisible to answer-based assessment — a student can pick the right multiple-choice option holding the wrong model. Behaviour is the honest signal, and simulations are the only place in edtech where it is observable.

**How.** A **rules-first** detector: hand-authored, per-sim, deterministic pattern matchers over the semantic telemetry (P-5), each with a confidence threshold, a minimum evidence count, and a cooldown. Detections are surfaced to the student as an offer ("Want to try something?"), never an accusation, and to the teacher as a class-level heatmap ("11 of 24 students show the force-implies-motion pattern"). The AI assistant is used to *phrase* and *conduct* the intervention, not to infer the misconception — inference stays rules-based so it is auditable, testable, cheap, and explicable to a teacher.

**Feasibility: Medium** per sim, **Hard** as catalogue-wide coverage (it is content work: ~3–8 signatures per flagship sim, each needing a pedagogy source and pilot validation). **Device impact: Negligible.** **Phase: P4**, on the 10 flagship sims first. This is the single deepest moat in the document — it compounds with usage data and cannot be copied by shipping a feature.

### F11 · AI Lab-Report Feedback

**What.** The student writes a conclusion in the Lab Notebook; the assistant gives formative feedback against a visible rubric (claim / evidence / reasoning, use of data, control of variables, uncertainty treatment at HS) — *never a grade*, always specific: "Your claim is clear. You reference the 45° run but not the 30° run that contradicts it — which measurement supports your claim best?"

**Why.** Writing is where understanding consolidates, and it is the thing teachers cannot give timely feedback on at 150 students/week. Formative-only positioning is also the safe position: the teacher grades, the AI coaches.

**How.** Prompt assembles the rubric + the student's *actual run data and design object* (F2) + the draft. Because the model sees the real data, it can catch the specific failure — a claim unsupported by the student's own numbers — which generic writing feedback cannot. Feedback is stored, teacher-visible, and marked as AI-generated in the notebook. No PII in the prompt; cached stable prefix per rubric.

**Feasibility: Easy–Medium** (mostly prompt/rubric engineering plus the notebook UI). **Device impact: Negligible.** **Ongoing cost:** the tier's largest token consumer — long inputs, per student, per lab. Cap with a per-lab draft-feedback limit (e.g. 3) and route to the smaller model class with escalation only on request. **Phase: P3.**

### F12 · Natural-Language Sim Search & Standards Search

**What.** "Show me something for MS-PS1-4" · "a sim about why the moon changes shape" · "something for 4th graders on circuits that takes 20 minutes" → ranked sims, specific labs, and suggested presets.

**How.** Hybrid retrieval over the manifest corpus: embeddings for the fuzzy natural-language side, exact filters on structured fields (grade band, standards codes, duration, subject, capabilities). The manifest is already the source of truth for all of it, so this is index-building, not new metadata. Standard-code queries bypass the model entirely and hit the taxonomy index. Precompute embeddings at build time; serve from the catalog service.

**Feasibility: Easy.** **Device impact: Negligible.** **Phase: P3** — high adoption leverage per dev-week; teachers search by standard and give up fast when they can't find things.

### F13 · Teacher AI: Differentiated Variants, Worksheets, Exit Tickets

**What.** From any sim: generate a lab variant at three reading/depth levels, an ELL-supported version, a printable pre-lab and post-lab worksheet keyed to that sim's actual parameters, a 5-question exit ticket with an answer key, and a modified version for an IEP accommodation. Everything editable, everything traceable to the sim's manifest and standards tags.

**Why.** Differentiation is the most time-expensive part of a teacher's week and the strongest driver of retention in the teacher segment. Gizmos ships static materials; nobody ships materials generated *from the live sim's parameter space*.

**How.** Generation is constrained: the model fills a structured template (a JSON lab-script schema the platform already executes) rather than writing free prose, and every generated numerical answer is **verified by running the sim headless** (F26's batch runner) before the worksheet renders. Answers that fail verification are dropped, not published. Teacher review is required before assignment to students.

**Feasibility: Medium.** **Device impact: Negligible.** **Phase: P4.**

### F14 · AI-Assisted Sim Authoring (with a hard validation gate)

**What.** A teacher describes a variation — "a projectile sim on Mars with a draggable target and no air resistance" or "an inclined-plane lab where friction is the variable" — and the platform produces it from a **parameterized template family** (projectile, collision, circuit, reaction, population, geometric construction), not from free-form code generation. The output is a manifest + parameter bindings + a lab script.

**Why.** It is the only credible path from 164 sims to 1,000+ without linear headcount, and it turns teachers into a content flywheel. It is also the highest-risk feature in this document, which is why the guardrails define it.

**How — the gate is the feature.** A generated sim passes through: (1) schema validation of the manifest; (2) parameter-range sanity checks; (3) **golden-value tests** — the same analytic-solution harness every first-party sim must pass (projectile range, energy conservation, equilibrium constants); (4) a performance smoke test on the reference device profile; (5) an accessibility lint; (6) **human review** — the authoring teacher's own classes only, until a GradeNext reviewer promotes it to the public catalog. No generated code executes in a student session; templates are our code, generation only produces data. Anything failing any gate is returned to the author with the failure named.

**Feasibility: Hard** — the template family and the validation pipeline are each a substantial project, and the pedagogy review process is an operational commitment, not just software. **Device impact: Negligible** (authored sims obey the same budgets by construction). **Phase: P5.**

---

## 6. D. Social & Classroom

### F15 · Live Class Mode (Peer Instruction / ConcepTest Flow)

**What.** Teacher opens a sim in Live mode and gets a join code. Students join on their own devices and see the teacher's sim state. The flow, matching the peer-instruction protocol that has the strongest evidence base in physics education:

1. Teacher poses a prediction question and **locks** student parameter controls.
2. Every student answers privately; the teacher sees the distribution, students do not.
3. Teacher unlocks: "discuss with your neighbour, then answer again."
4. Second distribution shown; the teacher reveals by *running the experiment*.
5. Teacher unlocks free exploration; the **parameter grid** shows every student's current settings live — the teacher sees at a glance who is stuck, who is off-task, and who found the interesting edge case.

**Why.** Peer instruction produces large, replicated conceptual-gain effects, and the missing ingredient in most classrooms is a fast, frictionless prediction-and-reveal loop. Also: the parameter grid is *formative assessment of thinking*, not of answers.

**How.** P-4 session service; teacher is authoritative, students receive state deltas; student → teacher traffic is a small heartbeat (current params + status), throttled to ~1 Hz and diffed. Bandwidth per student is tiny (hundreds of bytes/s) because we ship parameters, never pixels. Degrades to a share-link + polling flow when websockets are blocked by school networks (a real and common failure).

**Feasibility: Medium** (the service is the cost; the UI is straightforward). **Device impact: Low.** **Phase: P4** — the strongest single driver of whole-class adoption in the document.

### F16 · Collaborative Labs (2–4 students, one experiment)

**What.** A shared experiment: each student has a cursor and a role (Driver / Recorder / Analyst, rotating), everyone sees the same run, the notebook is co-written.

**How — and the tradeoff, explicitly.** **Use an authoritative server, not CRDTs, for simulation state.** CRDTs (Yjs) converge beautifully for text and unordered structures, but simulation parameters are *not* commutative: two students setting `angle` concurrently must resolve to one physical world, and "last write wins per field" is exactly the semantics we want anyway. More decisively, our determinism guarantee requires a **single ordered input log**; a CRDT-merged log reorders inputs and breaks reproducibility, replay, and the diff/time-machine features. So: **server-authoritative for model state and the input log** (server assigns sequence numbers; clients predict locally and reconcile), and **Yjs/CRDT for the notebook text and annotations**, where offline editing and merge really do matter. This split is the right answer and should be written into the architecture doc.

Anti-chaos design: soft locks (the Driver holds control; others request it), a visible turn indicator, and per-role tool affordances.

**Feasibility: Hard** — reconnection, late-join resync, conflicting intent, and testing multi-client determinism. **Device impact: Low.** **Phase: P5.** Note the honest ordering: F15 (broadcast) delivers most of the classroom value at a fraction of F16's cost, so ship it first and let usage justify F16.

### F17 · Class Data Pooling

**What.** Each student's measurements flow into a class dataset. Thirty students' pendulum periods reveal the T ∝ √L relation with real scatter; thirty independent natural-selection runs reveal a distribution, not an anecdote; thirty titration endpoints produce a mean and standard deviation. Displayed as a live class scatter/histogram, exportable, and analysable in Data Studio.

**Why.** It is the pedagogical bargain of the century: statistical thinking, replication, outlier discussion and sampling variability — for free, from work students were already doing. And it teaches the thing single-run simulations structurally cannot: *variability is data, not error*.

**How.** Semantic telemetry (P-5) emits `measurement_recorded(quantity, value, unit, runId)`; the session service (P-4) aggregates per class per assignment. Anonymised by default (teacher can toggle names on); outlier runs are inspectable via replay — a genuinely powerful moment when the class can *open* the weird data point and see what that student did.

**Feasibility: Medium.** **Device impact: Negligible.** **Phase: P4** (immediately after F15 — same service, huge marginal value).

---

## 7. E. Presentation & Creation

### F18 · Sim-to-Explainer Export (Narrated Deterministic Replay)

**What.** A student presses record, runs their experiment while narrating (voice or typed captions), and gets a **share link** — not a video. Opening it replays the experiment deterministically at full fidelity, with captions and annotation callouts timed to model time, and a "take the controls" button that drops the viewer into the sim at that exact state.

**Why.** Explaining is the highest-retention learning activity there is, and this makes explanations assessable, tiny, and interactive. It is also the natural viral artifact — a student's link opens a working lab, not a YouTube clip.

**How.** `{seed, params, input log}` + a caption track + optional compressed audio. Payload is kilobytes for the sim, and audio dominates (Opus at ~24 kbps ≈ 180 KB/min). Rendering the timeline is the existing replay path with a caption layer. Optional MP4 export via `MediaRecorder` for LMS submission where an interactive link isn't accepted.

**Feasibility: Easy–Medium** — the deterministic engine has already paid for the hard part. **Device impact: Low** (recording audio while simulating is fine; MP4 capture is the expensive path and should be desktop-only). **Phase: P3.**

### F19 · Embeddable Sim Widgets + LTI 1.3 Advantage

**What.** Three embed levels: a copy-paste `<iframe>` with a state-bearing URL (free, no login, for blogs and GradeNext lessons); the npm player component for first-party pages; and a full **LTI 1.3 Advantage** integration — Deep Linking (teacher picks a sim and lab from inside Canvas/Schoology/Moodle), Names & Role Provisioning (roster without manual setup), and Assignment & Grade Services (lab completion and scores post back to the LMS gradebook).

**Why.** Distribution. Teachers live inside an LMS; a tool that doesn't appear there is a tool used once. AGS grade passback is the specific feature that converts a trial into a department purchase.

**How.** The iframe player and postMessage bridge already exist in the MVP plan; LTI adds an OIDC launch flow, JWKS key management, platform registration per district, and the three service endpoints. Budget for certification and for per-LMS quirks — the spec is standard, the implementations are not. Note the constraint from F6: sensor features are unavailable in cross-origin embeds unless the host sets a Permissions Policy; embeds must degrade cleanly and say so.

**Feasibility: Medium** for LTI core + Deep Linking; **Medium–Hard** including AGS and NRPS plus multi-LMS QA. **Device impact: None.** **Phase: P4.**

### F20 · Print & Offline Worksheets from a Sim State

**What.** From any sim state: a print-ready worksheet with a crisp vector snapshot of the current setup, the parameter table, blank data tables sized to the planned trials, axes pre-labelled with the right units and ranges, and a QR code back to the exact sim state.

**Why.** Sub-1:1 device classrooms are still the majority of US science rooms, and substitute-teacher days, fire drills and Chromebook cart failures are routine. Print is not a retreat from the product — it is how the product survives contact with schools.

**How.** Server-side render of the sim's SVG/vector snapshot path (sims already need a snapshot capability for the notebook) into a print CSS layout → PDF. Blank tables and axis ranges are derived from the sim's manifest schema and the F2 design object, so worksheets are actually specific rather than generic.

**Feasibility: Easy.** **Device impact: None.** **Phase: P3.**

---

## 8. F. Depth & Accessibility Frontiers

### F21 · Sonification

**What.** Map a live quantity to sound: pitch to velocity, a click train to radioactive decay, timbre to wave superposition, a rising tone as a titration approaches its endpoint, panning to position. Plus an "audio graph" mode that sweeps any plotted series left-to-right as pitch, with axis tick marks as percussive cues.

**Why.** For blind and low-vision students it is the difference between exclusion and participation, and it is a WCAG-aligned commitment already in the master plan. For everyone else it is a genuine second perception channel: a period, a rate change, or an approach to asymptote is often *heard* before it is seen.

**How.** Web Audio graph fed from the model at ~20 Hz with parameter smoothing to avoid zipper noise; per-sim mapping declared in the manifest (`sonify: [{ source: "v", target: "pitch", range: [200, 900] }]`); user controls for volume, mapping choice, and mute; obeys `prefers-reduced-motion` conventions and a global "audio off" for shared classrooms (headphone reminder). Audio-graph mode is a generic capability of the chart layer, so it works on every sim that graphs anything.

**Feasibility: Easy** as a generic capability; **Medium** to do *tastefully* per flagship sim (bad sonification is worse than none). **Device impact: Low.** **Phase: P3** — a differentiator and the right thing to do; PhET is the only competitor doing this at all, on a handful of sims.

### F22 · Slow-Motion + Micro/Macro Zoom Continuum

**What.** One continuous zoom control that travels from the macroscopic phenomenon to the particulate level *without a mode switch*: the beaker with a thermometer → a magnifier circle showing molecules → full particulate view, with the macroscopic readouts still live at the edge. Coupled with a time-scale control spanning 0.05× to 4× (and, for fast processes, a "1 second = 1 nanosecond" frame). Applies to dissolving, phase change, diffusion, gas laws, reaction rate, electricity (electron drift under the current arrow), and osmosis.

**Why.** Johnstone's triangle — macroscopic / particulate / symbolic — is the central diagnosis of why chemistry is hard: students never connect the three levels because they are always shown separately. Making the transition *continuous and manipulable* is, in this document's judgement, the highest-leverage single visualization in K-12 science. Nothing on the market does the continuum; they do side-by-side panels at best.

**How.** Two coupled models with a mapped interface: the macroscopic continuum model (temperature, pressure, concentration) and a particulate model whose statistics are *constrained to match* the macro state (sampled velocities from the Maxwell-Boltzmann distribution at the current T, particle counts proportional to concentration). The zoom cross-fades between representations over a defined band, with the particulate view instantiating only the particles inside the visible window (a few hundred, pooled sprites) — that is what keeps it cheap. Symbolic level (F23) rides along as the third panel.

**Feasibility: Medium** per sim, and it must be designed into the sim's model from the start rather than retrofitted — so the *architectural* decision (dual-representation model interface) belongs in P2 even though the sims ship later. **Device impact: Medium**, bounded by the visible-window particle cap. **Phase: P3** for 5–6 chemistry/thermal flagships, extending in P4.

### F23 · Equation ↔ Simulation Binding

**What.** The governing equation is displayed live, with each term bound to the running model: as the student drags mass, the `m` in `F = ma` pulses and its numeric value updates in place; the term contributing most to the current result is highlighted; hovering a term dims everything in the scene except the quantity it describes. At HS/AP depth, the student can **edit the model**: change the drag law from `−bv` to `−cv²`, add a term, set a coefficient — and watch the trajectory change against the previous run's ghost.

**Why.** It is the third leg of Johnstone's triangle and the direct answer to "the math means nothing to me." Equation editing in particular teaches what a *model* is — an editable claim about the world, not a fact handed down — which is the actual content of AP Physics C and any modelling-based curriculum.

**How.** KaTeX render with per-term DOM nodes bound to model observables (the observable pattern is already in the engine). Editing is **not** arbitrary code: the sim declares a small set of swappable model terms with typed slots (`dragModel: none | linear | quadratic`, with a coefficient), plus a constrained expression field parsed by a safe math parser (mathjs-class, no eval, whitelisted functions, declared variables only) with a step-count and NaN guard. Divergent or non-finite models are caught by the integrator and reported as "this model blows up — why might that be?" (which is itself a good question).

**Feasibility: Medium** for binding/highlighting; **Hard** for safe general equation editing across the catalogue — so scope it to **6–8 sims with declared swappable terms**, not a universal capability. **Device impact: Low.** **Phase: P4** (binding), **P5** (editing).

### F24 · 3D & AR View

**What.** True 3D for the cases where 3D is the content — molecular geometry and VSEPR, protein structure, organ systems and dissection layers, orbital mechanics and eclipse geometry, crystal lattices. Plus optional **AR**: place the molecule or the heart on the desk, walk around it, on a supported phone or tablet.

**Why.** Spatial reasoning is a documented bottleneck in stereochemistry, anatomy and astronomy; 2D diagrams of 3D relationships are the actual source of the difficulty.

**How.** Three.js/react-three-fiber (already in the stack) for 3D; WebXR for AR **where available**, which as of 2026 means Chrome on AR-capable Android and Safari on visionOS — not Chromebooks, and not iOS Safari. Therefore: AR is strictly an *enhancement path*, entered by scanning a QR code with a phone from the desktop sim; the desktop/Chromebook experience is a full orbit-controlled 3D view, and the low-end fallback is a pre-rendered turntable sprite sequence. Model budgets: ≤ 50k triangles, compressed textures, instanced geometry for lattices and orbits.

**Feasibility: Medium** for 3D sims, **Medium** for the AR path (the WebXR API surface for a "place and inspect one object" experience is small). **Device impact: High** on 4 GB Chromebooks — hard rule of one 3D sim at a time, no 3D in a multi-pane bench, aggressive LOD and a frame-rate watchdog that steps quality down automatically. **Phase: P4.**

---

## 9. G. Our Own Additions

### F25 · Predict-Before-Run Gate

**What.** Before certain runs, the sim will not start until the student commits a prediction — and not by picking a multiple choice: they **drag the curve** they expect onto the empty graph, or place a marker where they think the ball lands. When the run completes, their prediction is overlaid against the result, with the gap quantified.

**Why.** Predict-Observe-Explain is one of the best-evidenced conceptual-change structures in science education, and its power depends entirely on *commitment before evidence* — which software can enforce and a worksheet cannot. It also produces a beautifully clean misconception signal for F10 and a natural prediction question for F15.

**How.** A sketch layer over the chart (pointer/touch path capture, resampled onto the x-axis), stored in the run record; the delta between predicted and actual curve is a first-class metric in the notebook and telemetry. **Feasibility: Easy.** **Device impact: Negligible.** **Phase: P2.** Best effort-to-impact ratio in this document.

### F26 · Parameter Sweep & Batch Runs ("run 200 experiments")

**What.** Declare a parameter range and a step (or a random distribution and a trial count), and the platform runs the sim headless, hundreds of times, producing a dataset in seconds: launch angle 0–90° in 1° steps → the range curve; 500 stochastic natural-selection runs → an outcome distribution; a Monte Carlo of measurement uncertainty (F3) → a confidence interval.

**Why.** It is the one thing a virtual lab can do that no physical lab ever can, and it takes students straight to the concepts that need many trials: distributions, sampling, optimisation, sensitivity, emergent regularity. It is also the verification engine behind F13's generated answer keys.

**How.** The model runs without a renderer — which our architecture already permits, since view and model are separate — inside a Web Worker (or a pool of them), at maximum tick rate with no interpolation. A projectile run is sub-millisecond; a 500-run ABM sweep is seconds. Progress bar, cancel button, hard caps on total ticks per sweep to protect the device, and results streamed into Data Studio as a series (P-1). For heavy sims, sweeps may be executed server-side by the same deterministic engine — the identical code path, which is a further payoff of determinism.

**Feasibility: Medium.** **Device impact: Medium but controlled** (workers keep the UI responsive; tick caps bound it). **Phase: P3.**

### F27 · Counterfactual Constants ("what if the world were different?")

**What.** A guarded panel of world dials: gravity (Earth / Moon / Mars / arbitrary), the speed of light down to walking pace, Coulomb's constant, friction globally off, Planck's constant scaled up. Each dial shows the consequence and a short "what breaks" note.

**Why.** Understanding what a constant *does* is best taught by removing it. It is also pure delight — the kind of thing students screenshot and share — and delight is a distribution strategy.

**How.** Constants are already parameters in a well-built model; the work is (a) guarding against numerically unstable regions per sim, (b) a curated preset list rather than raw sliders at lower grade bands, and (c) an honest label when a counterfactual outruns the model's validity (F30). **Feasibility: Easy–Medium.** **Device impact: Negligible.** **Phase: P3.**

### F28 · Verifiable Lab Records

**What.** Every completed lab produces a signed record: the run's `{seed, params, input log}` hash, timestamps, the design object, and the notebook text, signed server-side. A teacher opening a submission can **replay exactly what the student did** — not read a claim about it.

**Why.** In an era where any written lab report can be generated in seconds, the defensible assessment artifact is *the process*, and we are one of the few platforms that structurally has it. This is a serious sales argument to districts, and it is also fair to students: it rewards doing the work.

**How.** Falls out of the existing replay format plus a server-side signature and a submission endpoint. Anti-tamper is bounded and should be described honestly: it proves the record is the one our server received and that it replays consistently, not that a human rather than a script produced the inputs — pair it with the process telemetry (pacing, revisions) rather than overclaiming. **Feasibility: Easy–Medium.** **Device impact: None.** **Phase: P4.**

### F29 · Units & Uncertainty as a First-Class Type

**What.** Every quantity in the engine is `{ value, unit, uncertainty? }`, not a bare number. Arithmetic is dimension-checked at the type level and at runtime; the UI renders unit chips; students can switch unit systems anywhere (SI ↔ US customary, °C ↔ K ↔ °F) and get real conversions; entering `5 cm` where metres are expected is *handled*, not an error; and mismatched units in an equation are caught and explained.

**Why.** Dimensional analysis is a Common Core and NGSS quantitative-reasoning requirement and a chronic student failure point. As infrastructure, it is also what makes cross-sim wiring (F1), instrument portability (F5), CSV import (F7) and uncertainty propagation (F3) safe rather than a source of silent, wrong physics.

**How.** A small units library over the existing zod schemas (dimension vectors, not string matching), with compile-time branding in TypeScript and runtime checks at boundaries. Retrofitting later is painful, so this belongs early. **Feasibility: Medium** (the library is small; the migration surface is the whole catalogue — hence: do it before the T2 wave). **Device impact: Negligible.** **Phase: P2.**

### F30 · Model Fidelity Ladder & Visible Limits

**What.** Each sim declares its model tier and its assumptions, visibly: *Grade 5 view — air resistance ignored, Earth gravity constant. Grade 11 view — quadratic drag, altitude-varying g.* A "model limits" note names where the simulation stops being true, and — where the sim supports it — the student can **step up a tier** and see what changes.

**Why.** Every simulation lies; the honest ones say how. Teaching that models are approximations chosen for a purpose is a top-level NGSS crosscutting concept, and it defuses the expert critique that virtual labs teach idealised physics. Competitors treat their simplifications as invisible; we make them the lesson.

**How.** Manifest metadata (`fidelity: { tier, assumptions[], validRange, knownDeviations[] }`) rendered in the shell, plus tier-switchable model terms where they exist (shares machinery with F23). **Feasibility: Easy** (metadata + UI) to **Medium** (multi-tier models per sim). **Device impact: None.** **Phase: P3.**

---

## 10. Why We Beat Each Competitor

Legend: ● full · ◐ partial/limited · ○ absent.

| Capability | **Smart Lab** | PhET | Labster | Gizmos | CK-12 PLIX | oPhysics |
|---|---|---|---|---|---|---|
| F1 Cross-sim data bus / workbench | ● | ○ | ○ | ○ | ○ | ○ |
| F2 Enforced fair-test design | ● | ○ | ◐ (scripted) | ◐ (worksheet) | ○ | ○ |
| F3 Uncertainty & error analysis | ● | ○ | ◐ | ○ | ○ | ○ |
| F4 Time machine / run diff | ● | ○ | ○ | ○ | ○ | ○ |
| F5 Free-form cross-domain bench | ● | ○ | ◐ (chem only) | ○ | ○ | ○ |
| F6 Device sensors as input | ● | ○ | ○ | ○ | ○ | ○ |
| F7 Live real datasets + CSV compare | ● | ○ | ○ | ○ | ○ | ○ |
| F9 AI that operates the sim | ● | ○ | ○ | ○ | ◐ (tutor beside content) | ○ |
| F10 Behavioural misconception detection | ● | ◐ (research only, PhET-iO) | ○ | ○ | ○ | ○ |
| F11 AI formative report feedback | ● | ○ | ◐ (auto-quiz) | ○ | ◐ | ○ |
| F13 Teacher generative materials | ● | ○ | ○ | ◐ (static) | ◐ | ○ |
| F15 Live class + peer instruction | ● | ○ | ○ | ◐ (class view) | ○ | ○ |
| F17 Class data pooling | ● | ○ | ○ | ○ | ○ | ○ |
| F18 Deterministic narrated replay share | ● | ○ | ○ | ○ | ○ | ○ |
| F19 LTI 1.3 Advantage + free embeds | ● | ◐ (embed only) | ● | ● | ◐ | ◐ |
| F21 Sonification | ● | ◐ (few sims — the only real precedent) | ○ | ○ | ○ | ○ |
| F22 Macro↔particulate zoom continuum | ● | ◐ (separate views) | ◐ (cinematic, not continuous) | ◐ | ○ | ○ |
| F23 Live equation binding + model editing | ● | ○ | ○ | ○ | ○ | ◐ (formulas shown) |
| F26 Batch/sweep experiments | ● | ○ | ○ | ○ | ○ | ○ |
| F28 Verifiable process records | ● | ◐ (PhET-iO, paid) | ◐ | ◐ | ○ | ○ |
| F30 Visible model limits | ● | ○ | ○ | ○ | ○ | ○ |
| Grade 1–12 single-platform coverage | ● | ◐ (weak K-2, weak bio) | ○ (HS+) | ● | ● | ○ (HS physics) |
| Runs well on a 4 GB Chromebook | ● | ● | ○ | ● | ● | ● |

**The strategic reading.** PhET wins on pedagogy research and price and will not be beaten there; we beat it on *what happens around the sim* — data flow, classroom orchestration, AI, assessment, coverage. Labster wins on spectacle and loses on inquiry, performance and price. Gizmos wins on catalogue and teacher materials and loses on modernity and interaction depth. CK-12 wins on free and loses on depth. oPhysics is a single author's GeoGebra exports. **Nobody occupies "deep experimentation + classroom orchestration + AI inside the model."** That is the position.

---

## 11. Prioritization & the Extraordinary-Tier Shortlist

Impact = learning value × differentiation × adoption leverage.

| # | Feature | Impact | Effort | Device | Phase |
|---|---|---|---|---|---|
| F25 | Predict-before-run gate | ★★★★★ | Easy | – | P2 |
| F2 | Variable & control planner | ★★★★★ | Easy–Med | – | P2 |
| F9 | AI that drives the sim | ★★★★★ | Medium | – | P2 |
| F29 | Units & uncertainty type | ★★★☆☆ (infra) | Medium | – | P2 |
| P-1..P-5 | Platform primitives | ★★★★★ (infra) | Medium | – | P2–P3 |
| F22 | Macro↔particulate zoom | ★★★★★ | Medium | Med | P3 |
| F4 | Time machine & diff | ★★★★☆ | Medium | Med | P3 |
| F26 | Parameter sweeps | ★★★★☆ | Medium | Med | P3 |
| F1 | Multi-sim workbench | ★★★★☆ | Medium | High | P3 |
| F3 | Uncertainty mode | ★★★★☆ | Easy–Med | – | P3 |
| F7 | Real data + CSV compare | ★★★★☆ | Medium | Low | P3 |
| F18 | Narrated replay export | ★★★★☆ | Easy–Med | Low | P3 |
| F12 | NL / standards search | ★★★☆☆ | Easy | – | P3 |
| F21 | Sonification | ★★★☆☆ | Easy–Med | Low | P3 |
| F20 | Print worksheets | ★★★☆☆ | Easy | – | P3 |
| F27 | Counterfactual constants | ★★★☆☆ | Easy–Med | – | P3 |
| F30 | Model fidelity ladder | ★★★☆☆ | Easy | – | P3 |
| F11 | AI report feedback | ★★★★☆ | Easy–Med | – | P3 |
| F15 | Live class mode | ★★★★★ | Medium | Low | P4 |
| F17 | Class data pooling | ★★★★★ | Medium | – | P4 |
| F10 | Misconception detection | ★★★★★ | Med–Hard | – | P4 |
| F19 | LTI 1.3 Advantage | ★★★★☆ | Med–Hard | – | P4 |
| F13 | Teacher generative materials | ★★★★☆ | Medium | – | P4 |
| F24 | 3D & AR | ★★★☆☆ | Medium | High | P4 |
| F23 | Equation binding | ★★★★☆ | Med (Hard for editing) | Low | P4/P5 |
| F28 | Verifiable records | ★★★★☆ | Easy–Med | – | P4 |
| F6 | Device sensors | ★★★☆☆ | Med–Hard | High | P4 |
| F5 | Free-form lab bench | ★★★★☆ | Hard | High | P5 |
| F16 | Collaborative labs | ★★★☆☆ | Hard | Low | P5 |
| F14 | AI-assisted authoring | ★★★★☆ | Hard | – | P5 |

### The Extraordinary-Tier Eight — build these first after MVP

| # | Feature | The one-line case |
|---|---|---|
| 1 | **F25 Predict-before-run** | Highest learning-gain-per-dev-week in the document; ships in days. |
| 2 | **F2 Variable & control planner** | Turns slider-flailing into science; unlocks F10 and F17. |
| 3 | **F9 AI that drives the sim** | The market's clearest white space; the demo that sells the product. |
| 4 | **F22 Macro↔particulate zoom** | The single most powerful visualization in K-12 chemistry; must be architected before the T2 sim wave. |
| 5 | **F4 Time machine & diff** | Makes comparison — where conceptual change happens — a first-class action. |
| 6 | **F1 Multi-sim workbench** | The capability no competitor can retrofit; proves "platform," not "collection." |
| 7 | **F15 Live class mode** | The strongest whole-class adoption driver; evidence-backed peer-instruction flow. |
| 8 | **F17 Class data pooling** | Enormous pedagogical value for near-zero marginal cost once F15's service exists. |

Sequencing note: 1–2 are application logic and can start immediately; 3 ships with the P2 assistant; 4 requires an architectural decision (dual-representation models) *before* the T2 sims are built; 5–6 depend on the data bus; 7–8 share the session service and should be built as one project.

---

## 12. What We Deliberately Reject

| Rejected | Why |
|---|---|
| **Photorealistic 3D "game" labs (Labster style)** | High production cost per lab, heavy on 4 GB Chromebooks, and the evidence is that spectacle displaces inquiry — students navigate a corridor instead of controlling a variable. We choose clarity over cinema, and spend the budget on model depth. |
| **VR-first / headset-required experiences** | Headsets are absent from ~all US K-12 science classrooms, hygiene and supervision are real, and WebXR is unavailable on Chromebooks. AR stays an optional phone-side enhancement (F24), never a requirement. |
| **Open-world / avatar-based lab campus** | Navigation is not learning. Every minute spent walking to the stockroom is a minute not spent measuring. |
| **A general "physics engine for everything" cross-sim coupling** | Unbounded scope, unbounded QA, and a guaranteed source of subtly wrong science. F5 ships *curated* domain pairs instead. |
| **Free-form AI code generation of student-facing sims** | Unvalidatable, unsafe, and it would put unverified science in front of children. F14 generates *data for our templates*, behind golden-value tests and human review. |
| **CRDT-merged simulation state** | Breaks the single ordered input log, and with it determinism, replay, diff and verifiable records. CRDTs are used for notebook text only (F16). |
| **AI-assigned grades** | Formative feedback only. Grading is the teacher's authority; automated grading invites bias claims, district resistance and appeals we cannot win. |
| **Raw sensor/media data leaving the device** | Camera and microphone processing stays client-side, permanently. No exceptions, no "anonymised" uploads. |
| **A native mobile app** | The PWA covers offline; two codebases would halve sim output. Revisit only if AR usage (F24) proves substantial. |
| **Blockchain / NFT credentialing for lab records** | F28's server-signed records give the entire practical benefit without the cost, complexity or reputational drag. |
| **Real-time voice conversation with the AI assistant** | Unworkable acoustics in a 30-student room, high cost per minute, and marginal gain over text plus F9's on-sim actions. Revisit for accessibility use cases only. |

---

## 13. Tier-Specific Risks & Cost Envelope

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Feature creep drowns sim production** | High | The tier is gated per phase and the sim catalogue keeps its own independent velocity target; no advanced feature may consume more than ~25% of a phase's capacity. |
| **AI running cost scales with engagement** (F11 dominant) | High | Per-student daily caps, aggressive prompt caching of stable prefixes, smaller model class by default with escalation, and generated artifacts cached and shared across a class rather than regenerated per student. |
| **Realtime service becomes an ops burden** | Medium | One service (P-4) serves F15/F16/F17; stateless-except-room design, no per-sim server logic, graceful degrade to share links when school networks block websockets. |
| **Advanced UI overwhelms a 5th grader** | Medium | Progressive disclosure by grade band is a shell-level rule; every feature declares its minimum grade band in the manifest and is invisible below it. |
| **Determinism regressions break half the tier at once** | Medium | CI runs a cross-platform replay-hash test on every sim on every commit — a divergence fails the build. |
| **External dataset upstream changes/outages** (F7) | Medium | Server proxy + cache + frozen fallback snapshot shipped with every dataset; adapter contract tests run nightly. |
| **Teacher-authored content quality drift** (F14) | Medium | Author's own classes only until reviewed; validation gate is non-bypassable; a public catalogue entry always names its reviewer. |
| **Sensor features blocked by district policy** (F6) | High | Assume blocked by default; every sensor lab has a full non-sensor path, and none is a prerequisite for any assignment. |

**Rough envelope for the whole tier**, small team, sequenced across P2–P5: primitives ~2 months; the Extraordinary Eight ~5–7 months; the remainder spread across P4–P5 alongside sim production. New recurring costs: the session service, the data proxy, and AI inference — the last being the only one that scales with student count and therefore the one that needs a modelled unit economic before F11 ships broadly.

---

## 14. Open Questions

1. **Session service:** build on GradeNext's existing realtime infrastructure, if any, or stand up a dedicated one? This decision gates F15/F16/F17 as a group.
2. **AI budget per student per month** — sets whether F11 is unlimited or capped, and whether F13 is teacher-metered.
3. **Free vs paid boundary for the tier:** recommendation — F1/F4/F22/F25/F27 free (they drive word-of-mouth and are the product's soul); F15/F17/F13/F19/F28 are the teacher/district paid tier.
4. **Teacher-authoring governance (F14):** who reviews, at what SLA, and is there a public marketplace or district-scoped sharing only?
5. **Sensor policy posture:** do we pursue explicit district approval for camera/microphone labs, or ship them permanently as opt-in extras?
6. **LTI certification:** pursue formal 1EdTech certification (procurement advantage, real cost) or ship a conformant-but-uncertified integration first?
7. **Uncertainty defaults:** should messiness mode (F3) be *on* by default for Grades 9-12, accepting that it makes early exploration harder?
