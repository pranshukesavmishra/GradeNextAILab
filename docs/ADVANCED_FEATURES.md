# GradeNext Smart Lab — Advanced Features Specification

> **The extraordinary tier.** Everything beyond the MVP that turns a very good simulation catalog into a laboratory instrument nobody else on the market has.

**Status:** Proposal for review · **Version:** 1.0 · **Date:** 2026-08-28 · **Companion to:** [SMART_LAB_PLAN.md](./SMART_LAB_PLAN.md), [SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md)

---

## Table of Contents

1. [Thesis & Ground Rules](#1-thesis--ground-rules)
2. [Platform Primitives](#2-platform-primitives)
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
13. [Tier Risks & Cost Envelope](#13-tier-risks--cost-envelope)
14. [Open Questions](#14-open-questions)

---

## 1. Thesis & Ground Rules

The MVP gives a student a sim. This tier gives a student **a laboratory**: instruments that travel between experiments, data that survives, runs that can be compared, classmates who can join, real datasets to argue with, and a model whose assumptions are visible and editable.

| Ground rule | Consequence |
|---|---|
| **Determinism is the product.** `{seed, params, input log}` reproduces any run exactly. | Time machine, replay export, class pooling, batch sweeps, verifiable records and AI context are consequences of an architecture already decided — not new subsystems. |
| **The 4 GB Chromebook is the floor.** | Every feature declares a degrade path: what turns off, at what frame rate, with what message. No degrade path, no ship. |
| **Nothing unvalidated reaches a student.** | AI-generated content, teacher-authored labs and imported data all pass a validation gate before a student session sees them. |
| **No feature may make the first 30 seconds worse.** | Advanced capability is progressively disclosed — hidden at K-5, one control away at 6-8, fully exposed at 9-12. |

**Effort scale** (small team, mature engine): **Easy** ≤ 2 dev-weeks · **Medium** 3–8 dev-weeks · **Hard** 2–6 dev-months and/or recurring infrastructure cost.

**Phases** extend the master-plan roadmap: **P2** Smart in Smart Lab · **P3** Coverage & Scale · **P4** Moat · **P5** Frontier (new — capabilities that need P2–P4 primitives first).

---

## 2. Platform Primitives

Twenty-four features share five substrates. Build these first, or everything below costs 3× more.

**P-1 · The Data Bus (cross-sim ports).** A typed pub/sub channel in `@gnlab/engine`. Each sim declares what it emits and accepts:

```ts
ports: {
  out: [{ id: "trajectory", kind: "series", schema: { t: "s", x: "m", y: "m" }, rate: 20 }],
  in:  [{ id: "windProfile", kind: "series", schema: { h: "m", v: "m/s" } }]
}
```

Series are unit-tagged (F29), stamped in model time, ring-buffered. In-process inside a workbench, `postMessage`-bridged across iframes. A slow consumer gets decimated samples, never a stalled producer. → *F1, F5, F7, F16, F23, F26.*

**P-2 · The Instrument Protocol.** Measurement tools become sim-independent objects: `attach(target) → reading stream`, a calibration surface, declared precision, and a rendering that works on a Pixi stage or an R3F scene. A thermometer doesn't know it's in a chemistry sim; it knows it reads a `temperature` field at a point. → *F3, F5, F6, F16, F29.*

**P-3 · The Sim Control RPC.** A per-sim whitelisted action list — the one surface used by the AI assistant, presenter mode, live broadcast and replay:

```ts
actions: [
  { id: "setParam", args: { key: "angle", range: [0, 90], unit: "deg" } },
  { id: "toggleOverlay", args: { key: "velocityVectors" } },
  { id: "setTimeScale", args: { range: [0.05, 4] } }
]
```

Every call is schema-validated, rate-limited, journaled into the input log, and reversible. **No caller — human, AI or remote peer — touches the model except through this list.** → *F8, F9, F14, F15, F17.*

**P-4 · The Session Service.** Rooms, presence, authoritative parameter state, broadcast. WebSocket with a documented resync protocol (on reconnect: snapshot + journal tail). The only genuinely new backend this tier requires. → *F14, F15, F16.*

**P-5 · Semantic Telemetry.** A layer above raw input events: `hypothesis_stated`, `variable_changed(var, from, to)`, `run_completed(outcome)`, `prediction_vs_result(delta)`, `confound_introduced`. Per student, aggregated per class. → *F2, F4, F10, F11, F16, F17.*

---

## 3. A. Deeper Experimentation

### F1 · Multi-Sim Workbench & Cross-Sim Data Bus

**What.** Split the stage into 2 panes (4 on desktop), each running a sim, with a wiring strip between: projectile trajectory → Function Grapher; ecosystem populations → Data Studio; circuit current → a motor's speed. Wiring is part of shared state, so a workbench has its own share URL.

**Why.** The biggest gap between school science and real science is that school data never leaves the page it was made on. Piping a physics sim into a grapher is the moment `y = ½at²` stops being an assertion and becomes a fit to data the student generated — and it's the cheapest route to genuine cross-disciplinary work.

**How.** P-1 plus a workbench route (`/bench?a=phys.projectile&b=math.grapher&wire=...`). Each pane is an independent engine instance; the bus samples on the consumer's frame, not the producer's tick, so panes never block each other and may run at different time scales.

**Feasibility: Medium** — the engine is already instance-safe; the work is the port type system, unit coercion at wire time, and a layout surviving 1366×768. **Device: High** (the tier's heaviest routine operation). Mitigation: second pane capped at 30 fps, halved particle budgets, one 3D sim per bench maximum, and on low memory a *sequential* mode (run A, capture series, feed B) that costs almost nothing. **Phase: P3.**

### F2 · Student-Designed Experiments (Variable & Control Planner)

**What.** Before running, the student commits a structured plan generated from the sim manifest: *I will change* (IV), *I will measure* (DV), *I will keep the same* (controls), *I predict…*. The engine then watches for fair-test violations: if a declared control changes mid-investigation, the shell flags it — "You changed two things at once, so your result can't tell you which one mattered. Undo, or add it as a second variable?"

**Why.** Controlling variables is an NGSS practice tested at every grade band, and it is the thing simulations usually destroy — a student flails sliders and calls it inquiry. It also produces a machine-readable design, which is what makes F10 and F17 possible at all.

**How.** A `design` object stored with the run; middleware on the parameter store comparing every `setParam` against it; a "confound ledger" the notebook renders. Grade-adaptive: two picture-chips at K-5; replicate counts and interval planning at 9-12.

**Feasibility: Easy–Medium** — application logic over existing schemas; the cost is UX iteration across four grade bands. **Device: negligible. Phase: P2.**

### F3 · Uncertainty & Real-World Messiness Mode

**What.** A toggle (default off ≤ Grade 8, on for HS/AP labs) injecting realistic imperfection: Gaussian sensor noise, instrument resolution limits (a ruler reads to the nearest mm, not eight decimals), stopwatch reaction jitter, optional systematic error (a mis-zeroed balance). Readings display as `24.3 ± 0.2 °C`; graphs carry error bars; fits report R² and slope uncertainty.

**Why.** Perfect physics teaches the false lesson that data agrees with theory exactly, and leaves students unable to do the error analysis AP and IB require. It is also the honest answer to the teacher's first objection: "it's not like the real lab."

**How.** Noise lives in the **instrument layer** (P-2), never the model — the model stays deterministic and noise draws come from the same seeded PRNG, so a noisy run is still exactly reproducible. Instruments declare `resolution`, `sigma`, optional `bias`; propagation to derived quantities uses first-order propagation in the units layer (F29).

**Feasibility: Easy** for noise and display, **Medium** for multi-step propagation and the fitting UI. **Device: negligible. Phase: P3.**

### F4 · Time Machine & Experiment Diff

**What.** Three linked capabilities: **scrub** (drag backward, step frames, branch a new run from any point); **overlay** (run B ghosted behind run A, both on shared axes); **diff** (parameter table plus plain-language summary — *"Angle 30° → 45°, everything else identical. Range 15.3 → 17.7 m (+15.7%), flight time +41%."*).

**Why.** Comparison is where conceptual change happens; otherwise students remember only the last run.

**How.** Scrubbing uses keyframe snapshots every 2 s of model time plus deterministic re-simulation to the exact frame — we store the input log, not frames. Overlay renders run B's replay into a dimmed second layer. The diff is a structural param comparison plus the sim's exported `summaryStats`; the sentence is templated from the numbers, so diff works offline, and the AI adds only the causal explanation on request.

**Feasibility: Medium** — determinism makes it tractable; the cost is per-sim snapshot correctness (any sim holding state outside the model breaks it, so this doubles as an architecture conformance test). **Device: Medium** — overlay is a second render pass; capped at two runs, off for 3D on low memory. **Phase: P3.**

### F5 · Free-Form Lab Bench

**What.** A sandbox where equipment from different sims coexists: a thermometer and pH probe in an exothermic reaction; a DC motor from the circuit sim driving a pulley in the mechanics sim; an optics mirror in the wave tank. Not "all sims merged" — a curated set of cross-compatible domain pairs (thermal+chemical, electrical+mechanical, optical+wave).

**Why.** It is the difference between a simulation *collection* and a *laboratory*, and where genuinely student-owned investigations live. ChemCollective had the idea for chemistry; nobody has generalized it.

**How.** Two contracts: portable instruments (P-2), and sims exposing **fields** — `field("temperature", (x,y) → K)`, `field("current", nodeId → A)` — that any probe can sample. Cross-domain coupling is explicit and hand-authored per pair (an "energy bridge" converting electrical power to torque at a declared efficiency), *not* a general physics unification, which is where scope would become unbounded.

**Feasibility: Hard** — not exotic, but combinatorial: each pair is a designed, tested, pedagogically reviewed artifact. Ship **three** pairs, not "anything with anything." **Device: High. Phase: P5**, seeded by shipping P-2 in P3.

---

## 4. B. Sensing & the Real World

### F6 · Device Sensors as Simulation Inputs

**What.** Three concrete labs, not a generic sensor API:

| Sensor | Lab | Signal path |
|---|---|---|
| **Microphone** | Hum a note, see your waveform and FFT beside the generated tone; tune to a target frequency; measure ambient dB | Web Audio `AnalyserNode` + autocorrelation pitch detection |
| **Camera** | Sample a real object's colour for mixing/absorption; optional motion tracking of a rolling object → position-time graph | `getUserMedia` + canvas pixel sampling; MediaPipe Tasks Vision (WASM/WebGPU) for tracking |
| **Accelerometer** (tablets) | Walk with the device, produce a real a-t graph, integrate to v-t and x-t | Generic Sensor API, secure context, permission-gated |

**Why.** It closes the loop the market leaves open: the simulation stops substituting for reality and becomes an instrument pointed at it. A student seeing their own voice on the same axes as the generated wave learns something no animation delivers.

**How & privacy.** Hard rule: raw audio, video frames and sensor streams **never leave the device**. All processing is client-side; only the analysis output (a frequency, an RGB triple, an acceleration series) enters the model. Nothing is persisted or sent to the AI proxy. Opt-in per lab with a plain-language explainer, a persistent on-screen indicator, and a district-level kill switch — schools disable cameras wholesale, so this must be optional by design. Generic Sensor and `getUserMedia` require HTTPS and are blocked in cross-origin iframes absent an explicit Permissions Policy, so sensor labs run only in the first-party player; the embeddable widget (F19) declares them unavailable.

**Feasibility: Easy** (microphone, colour sampling). **Medium–Hard** for camera motion tracking: MediaPipe hits ~30 fps on decent hardware, but not dependably on a 4 GB integrated-GPU Chromebook also running a sim — ship as labelled beta with a frame-rate floor check falling back to manual frame-by-frame tagging (pedagogically fine, and what Pivot Interactives sells). **Device: Low / High. Phase: P4** (microphone in P3 with the Sound sims).

### F7 · Real-Data Ingestion (Live Datasets + Student CSV)

**What.** **In:** curated feeds — NASA (planetary parameters, solar imagery), NOAA/NCEI (climate normals, CO₂ and temperature series, tides, storm tracks), USGS (real-time earthquakes, streamflow), PubChem/RCSB (compound properties, structures) — flowing into Earth/space/chemistry sims. **Compare:** a student uploads the CSV from their real probeware or hand-recorded table; the platform overlays it on the simulation run and computes residuals. *"Where does the model disagree with your lab, and why?"*

**Why.** Comparing a model to data and reasoning about the divergence is the top of the NGSS practice hierarchy and essentially absent from every competitor. It also converts our main weakness — a simulation is not the real world — into the lesson.

**How.** **All external data goes through our own server-side proxy with a cache**, never direct browser fetch: agency APIs have inconsistent CORS, rate limits, key requirements and uptime, and 30 Chromebooks hitting one endpoint simultaneously is both rude and fragile. The proxy normalizes into our series schema (P-1), caches per dataset with a sensible TTL (earthquakes: minutes; climate normals: months), and ships a **frozen fallback snapshot** so a lab still works when upstream is down or the school is offline. Provenance and citation are always visible. CSV import gets a column-mapping wizard with unit assignment, sanity-range validation and a size cap.

**Feasibility: Medium** — per-dataset adapters plus recurring maintenance when upstream schemas change; budget ongoing content-ops, not just build. **Device: Low. Phase: P3** for four marquee datasets, expanding through P4.

### F8 · Instrument Calibration & Reading Discipline

Small, disproportionately valuable: HS instruments must be zeroed and calibrated before use, and read to their stated precision — meniscus, parallax, tare. It is exactly what lab-practical exams assess. **Easy · Device: none · P3.**

---

## 5. C. AI Beyond Chat

### F9 · AI That Drives the Sim

**What.** The assistant operates the sim rather than sitting beside it. *"Why does it go further at 45°?"* → it sets 30°, runs, annotates the range, sets 45°, runs, overlays both, enables velocity-component vectors, narrating each step with the parameter changes shown as reviewable chips.

**Why.** It is the demonstration a great teacher gives, available to every student at their own pace — and it models *how to interrogate a system*, which is the transferable skill.

**How.** P-3 exclusively: only whitelisted actions, schema-validated arguments, rate-limited, every call rendered as an undoable step and journaled into the input log — so a demonstration is itself a shareable replay. No code execution, no arbitrary state writes; a per-turn action budget and an always-live stop control prevent runaway sequences.

**Feasibility: Medium** — the AI side is ordinary tool use via the Claude API; the real cost is authoring and testing the action surface per sim. **Device: negligible** (server-side inference). **Phase: P2**, on ~8 flagship sims — this is the plan's stated flagship differentiator.

### F10 · Misconception Detection from Behaviour

**What.** Behavioural signatures in telemetry that reveal a wrong mental model, triggering a targeted intervention instead of a generic hint.

| Signature | Misconception | Intervention |
|---|---|---|
| Keeps raising force to hold constant velocity | Motion requires continuous force | Zero-friction challenge + predict-then-see |
| Changes 3+ parameters between runs, repeatedly | No control-of-variables schema | Activate F2 planner in scaffolded mode |
| Expects heavier = faster falling, in vacuum mode | Aristotelian gravity | Feather-and-hammer demo (F9) |
| Adds bulbs in series expecting brighter | Current "used up" / more = more | Ammeter overlay at each node |
| Sets pH 8 expecting "twice as basic as 4" | Linear reading of a log scale | Particulate zoom (F22) with ion counts |

**Why.** Misconceptions are stable, well-catalogued, and invisible to answer-based assessment — a student can pick the right option while holding the wrong model. Behaviour is the honest signal, and simulations are the only place in edtech where it is observable.

**How.** A **rules-first** detector: hand-authored per-sim deterministic matchers over semantic telemetry (P-5), each with a confidence threshold, minimum evidence count and cooldown. Surfaced to the student as an offer ("Want to try something?"), never an accusation; to the teacher as a class heatmap ("11 of 24 show the force-implies-motion pattern"). The AI *conducts* the intervention; it does not *infer* the misconception — inference stays rules-based so it is auditable, cheap and explicable to a teacher.

**Feasibility: Medium** per sim, **Hard** catalogue-wide — it is content work (3–8 signatures per flagship sim, each needing a pedagogy source and pilot validation). **Device: negligible. Phase: P4**, flagships first. This is the deepest moat in the document: it compounds with usage data and cannot be copied by shipping a feature.

### F11 · AI Lab-Report Feedback

**What.** The student writes a conclusion; the assistant gives formative feedback against a visible rubric (claim/evidence/reasoning, use of data, control of variables, uncertainty at HS) — never a grade, always specific: *"Your claim is clear. You cite the 45° run but not the 30° run that contradicts it — which measurement best supports the claim?"*

**Why.** Writing consolidates understanding, and it is what teachers cannot give timely feedback on at 150 students a week. Formative-only is also the safe position: the teacher grades, the AI coaches.

**How.** The prompt carries the rubric, the draft, and the student's *actual run data and design object* (F2) — so it catches the specific failure, a claim unsupported by the student's own numbers, which generic writing feedback cannot. Stored, teacher-visible, marked AI-generated; no PII; cached stable prefix per rubric.

**Feasibility: Easy–Medium** (rubric/prompt engineering plus notebook UI). **Ongoing cost:** the tier's largest token consumer — cap drafts per lab, default to the smaller model class with escalation on request. **Device: negligible. Phase: P3.**

### F12 · Natural-Language Sim & Standards Search

**What.** *"Show me something for MS-PS1-4"* · *"a sim about why the moon changes shape"* · *"circuits for 4th graders, 20 minutes"* → ranked sims, specific labs, suggested presets.

**How.** Hybrid retrieval over the manifest corpus: embeddings for the fuzzy side, exact filters on structured fields (grade band, standards codes, duration, capabilities). Standard-code queries bypass the model and hit the taxonomy index. Embeddings precomputed at build time. The manifest is already the source of truth, so this is index-building, not new metadata.

**Feasibility: Easy. Device: negligible. Phase: P3** — high adoption leverage per dev-week; teachers search by standard and give up fast when they can't find things.

### F13 · Teacher AI: Differentiated Variants, Worksheets, Exit Tickets

**What.** From any sim: a lab variant at three reading/depth levels, an ELL-supported version, printable pre- and post-lab worksheets keyed to that sim's real parameters, a five-question exit ticket with answer key, an IEP-accommodated version. All editable, all traceable to the manifest and standards tags.

**Why.** Differentiation is the most time-expensive part of a teacher's week and the strongest retention driver in the teacher segment. Gizmos ships static materials; nobody generates them from a live sim's parameter space.

**How.** Constrained generation: the model fills a structured lab-script schema the platform already executes, rather than writing free prose — and every generated numerical answer is **verified by running the sim headless** (F26) before the worksheet renders. Unverifiable answers are dropped. Teacher review required before assignment.

**Feasibility: Medium. Device: negligible. Phase: P4.**

### F14 · AI-Assisted Sim Authoring (with a hard validation gate)

**What.** A teacher describes a variation — "projectile on Mars with a draggable target, no air resistance"; "an inclined-plane lab where friction is the variable" — and the platform produces it from a **parameterized template family** (projectile, collision, circuit, reaction, population, geometric construction), emitting a manifest + parameter bindings + lab script. Not free-form code generation.

**Why.** It is the only credible path from 164 sims to 1,000+ without linear headcount, and it turns teachers into a content flywheel. It is also the highest-risk feature here, which is why the guardrails *are* the spec.

**How — the gate is the feature.** Every generated sim passes: (1) manifest schema validation; (2) parameter-range sanity checks; (3) **golden-value tests** — the same analytic-solution harness every first-party sim must pass; (4) a performance smoke test on the reference device profile; (5) an accessibility lint; (6) **human review** — the author's own classes only, until a GradeNext reviewer promotes it publicly. No generated code executes in a student session: templates are our code, generation produces only data. Any gate failure returns to the author with the reason named.

**Feasibility: Hard** — the template family and the validation pipeline are each substantial, and the review process is an operational commitment, not just software. **Device: negligible** (authored sims inherit the budgets). **Phase: P5.**

---

## 6. D. Social & Classroom

### F15 · Live Class Mode (Peer Instruction Flow)

**What.** The teacher opens a sim in Live mode with a join code. Students join on their own devices and see the teacher's state. The flow follows the peer-instruction protocol with the strongest evidence base in physics education:

1. Teacher poses a prediction question and **locks** student controls.
2. Every student answers privately; the teacher sees the distribution, students don't.
3. Unlock: "discuss with your neighbour, answer again."
4. Second distribution shown; the teacher reveals by *running the experiment*.
5. Free exploration — and the **parameter grid** shows every student's live settings, so the teacher sees at a glance who is stuck, who is off-task, and who found the interesting edge case.

**Why.** Peer instruction produces large replicated conceptual gains, and the missing ingredient in most classrooms is a frictionless predict-and-reveal loop. The parameter grid is formative assessment of *thinking*, not of answers.

**How.** P-4; the teacher is authoritative and students receive state deltas. Student→teacher traffic is a ~1 Hz diffed heartbeat of current params — hundreds of bytes per second, because we ship parameters, never pixels. Degrades to a share link plus polling when school networks block websockets (a real and common failure).

**Feasibility: Medium** (the service is the cost). **Device: Low. Phase: P4** — the strongest whole-class adoption driver in this document.

### F16 · Collaborative Labs (2–4 students, one experiment)

**What.** A shared experiment: per-student cursors, rotating roles (Driver / Recorder / Analyst), one run everyone sees, a co-written notebook. Soft locks — the Driver holds control, others request it — with a visible turn indicator and role-specific tools.

**How — and the tradeoff, explicitly.** **Authoritative server for simulation state, not CRDTs.** Yjs-style CRDTs converge beautifully for text and unordered structures, but simulation parameters are not commutative: two students setting `angle` must resolve to one physical world, and last-write-wins per field is the semantics we want anyway. More decisively, determinism requires a **single ordered input log**; a CRDT-merged log reorders inputs and breaks replay, diff and verifiable records. So: server-authoritative for model state and the input log (server assigns sequence numbers, clients predict locally and reconcile), and **CRDT for notebook text and annotations**, where offline editing and merge genuinely matter. This split belongs in the architecture doc.

**Feasibility: Hard** — reconnection, late-join resync, conflicting intent, multi-client determinism testing. **Device: Low. Phase: P5.** Honest ordering: F15 delivers most of the classroom value at a fraction of the cost, so ship it first and let usage justify F16.

### F17 · Class Data Pooling

**What.** Every student's measurements flow into a class dataset. Thirty pendulum periods reveal T ∝ √L *with real scatter*; thirty natural-selection runs reveal a distribution rather than an anecdote; thirty titration endpoints give a mean and standard deviation. Live class scatter/histogram, exportable, analysable in Data Studio.

**Why.** The pedagogical bargain of the century: statistical thinking, replication, outliers and sampling variability — free, from work students were already doing. It teaches what single-run simulations structurally cannot: variability is data, not error.

**How.** P-5 emits `measurement_recorded(quantity, value, unit, runId)`; P-4 aggregates per class per assignment. Anonymised by default. Outlier runs are inspectable *by replay* — a genuinely powerful moment when the class can open the weird data point and see what that student did.

**Feasibility: Medium. Device: negligible. Phase: P4**, immediately after F15 — same service, huge marginal value.

---

## 7. E. Presentation & Creation

### F18 · Sim-to-Explainer Export (Narrated Deterministic Replay)

**What.** The student records their experiment while narrating (voice or typed captions) and gets a **share link** — not a video. Opening it replays the experiment deterministically at full fidelity, captions and callouts timed to model time, with a "take the controls" button dropping the viewer into the sim at that exact state.

**Why.** Explaining is the highest-retention learning activity there is; this makes explanations assessable, tiny and interactive. It is also the natural viral artifact — a student's link opens a working lab, not a YouTube clip.

**How.** `{seed, params, input log}` + a caption track + optional compressed audio (Opus ~24 kbps ≈ 180 KB/min, which dominates a payload otherwise measured in kilobytes). Rendering is the existing replay path plus a caption layer. Optional `MediaRecorder` MP4 export where an LMS won't accept an interactive link.

**Feasibility: Easy–Medium** — the deterministic engine already paid for the hard part. **Device: Low** (MP4 capture is the expensive path; desktop-only). **Phase: P3.**

### F19 · Embeddable Widgets + LTI 1.3 Advantage

**What.** Three embed levels: a copy-paste `<iframe>` with a state-bearing URL (free, no login, for blogs and GradeNext lessons); the npm player component for first-party pages; and full **LTI 1.3 Advantage** — Deep Linking (pick a sim and lab from inside Canvas/Schoology/Moodle), Names & Role Provisioning (roster without manual setup), Assignment & Grade Services (lab scores post back to the gradebook).

**Why.** Distribution. Teachers live inside an LMS, and a tool that doesn't appear there is used once. Grade passback is the specific feature that converts a trial into a department purchase.

**How.** The iframe player and postMessage bridge exist in the MVP plan; LTI adds an OIDC launch flow, JWKS key management, per-district platform registration and the three service endpoints. Budget for certification and per-LMS quirks — the spec is standard, the implementations are not. Per F6, sensor features are unavailable in cross-origin embeds and must degrade with an explicit message.

**Feasibility: Medium** for core + Deep Linking, **Medium–Hard** with AGS/NRPS and multi-LMS QA. **Device: none. Phase: P4.**

### F20 · Print & Offline Worksheets from a Sim State

**What.** From any sim state: a print-ready worksheet with a vector snapshot of the current setup, the parameter table, blank data tables sized to the planned trials, axes pre-labelled with the right units and ranges, and a QR code back to that exact state.

**Why.** Sub-1:1 device classrooms are still the majority of US science rooms, and substitute days, fire drills and dead Chromebook carts are routine. Print isn't a retreat from the product; it is how the product survives contact with schools.

**How.** Server-side render of the sim's existing vector snapshot into a print CSS layout → PDF. Table and axis ranges derive from the manifest schema and the F2 design object, so worksheets are specific rather than generic. **Feasibility: Easy. Device: none. Phase: P3.**

---

## 8. F. Depth & Accessibility Frontiers

### F21 · Sonification

**What.** Map live quantities to sound: pitch to velocity, a click train to radioactive decay, timbre to wave superposition, a rising tone as a titration nears its endpoint, panning to position. Plus an "audio graph" mode sweeping any plotted series left-to-right as pitch, with axis ticks as percussive cues.

**Why.** For blind and low-vision students it is the difference between exclusion and participation, and it backs the master plan's WCAG commitment. For everyone else it is a real second channel: a period, a rate change or an approach to an asymptote is often heard before it is seen.

**How.** A Web Audio graph fed from the model at ~20 Hz with parameter smoothing (no zipper noise); mappings declared per sim in the manifest (`sonify: [{ source: "v", target: "pitch", range: [200, 900] }]`); user controls for volume, mapping and mute, plus a global audio-off for shared classrooms. Audio-graph mode is a generic capability of the chart layer, so it works on every sim that graphs anything.

**Feasibility: Easy** generically, **Medium** to do tastefully per flagship (bad sonification is worse than none). **Device: Low. Phase: P3** — PhET is the only competitor doing this at all, on a handful of sims.

### F22 · Slow-Motion + Micro/Macro Zoom Continuum

**What.** One continuous zoom travelling from the macroscopic phenomenon to the particulate level with no mode switch: the beaker and thermometer → a magnifier circle showing molecules → full particulate view, macroscopic readouts still live at the edge. Coupled with a 0.05×–4× time scale (and a "1 second = 1 nanosecond" frame for fast processes). Applies to dissolving, phase change, diffusion, gas laws, reaction rate, electron drift under the current arrow, and osmosis.

**Why.** Johnstone's triangle — macroscopic / particulate / symbolic — is the central diagnosis of why chemistry is hard: students never connect the three levels because they are always shown separately. Making the transition continuous and manipulable is, in this document's judgement, the highest-leverage single visualization in K-12 science. Competitors offer side-by-side panels at best.

**How.** Two coupled models behind one interface: the macroscopic continuum model (T, P, concentration) and a particulate model whose statistics are *constrained to match* it — velocities sampled from Maxwell-Boltzmann at the current T, particle counts proportional to concentration. Zoom cross-fades between representations across a defined band, instantiating only particles inside the visible window (a few hundred, pooled sprites) — that cap is what keeps it cheap. The symbolic level (F23) rides along as the third panel.

**Feasibility: Medium** per sim, but it must be designed into the model rather than retrofitted — so the *architectural* decision (dual-representation model interface) belongs in P2 even though the sims ship later. **Device: Medium**, bounded by the window cap. **Phase: P3** for 5–6 chemistry/thermal flagships, extending in P4.

### F23 · Equation ↔ Simulation Binding

**What.** The governing equation displayed live with each term bound to the running model: drag the mass and the `m` in `F = ma` pulses and updates in place; the dominant term highlights; hovering a term dims everything in the scene except the quantity it describes. At HS/AP depth the student **edits the model** — swap drag from `−bv` to `−cv²`, change a coefficient — and watches the trajectory shift against the previous run's ghost.

**Why.** It is the third leg of Johnstone's triangle and the direct answer to "the math means nothing to me." Editing in particular teaches what a model *is* — an editable claim about the world, not a fact handed down — which is the actual content of AP Physics C and any modelling-based curriculum.

**How.** KaTeX render with per-term DOM nodes bound to model observables (the observable pattern already exists in the engine). Editing is not arbitrary code: sims declare a small set of swappable terms with typed slots (`dragModel: none | linear | quadratic` plus a coefficient) and a constrained expression field parsed by a safe math parser — no `eval`, whitelisted functions, declared variables only, with step-count and NaN guards. A divergent model is caught by the integrator and reported as *"this model blows up — why might that be?"*, which is itself a good question.

**Feasibility: Medium** for binding, **Hard** for safe general editing catalogue-wide — so scope editing to 6–8 sims with declared swappable terms. **Device: Low. Phase: P4** (binding), **P5** (editing).

### F24 · 3D & AR View

**What.** True 3D where 3D *is* the content — molecular geometry and VSEPR, protein structure, organ layers, orbital mechanics and eclipse geometry, crystal lattices — plus optional **AR** to place a molecule or a heart on the desk and walk around it on a supported phone or tablet.

**Why.** Spatial reasoning is a documented bottleneck in stereochemistry, anatomy and astronomy; 2D diagrams of 3D relationships are the actual source of the difficulty.

**How.** Three.js/react-three-fiber (already in the stack); WebXR for AR **where available**, which in 2026 means Chrome on AR-capable Android and Safari on visionOS — *not* Chromebooks, *not* iOS Safari. So AR is strictly an enhancement path entered by scanning a QR code from the desktop sim; the Chromebook experience is a full orbit-controlled 3D view, and the low-end fallback is a pre-rendered turntable sprite sequence. Budgets: ≤ 50k triangles, compressed textures, instanced geometry for lattices and orbits.

**Feasibility: Medium** both for the 3D sims and for a "place and inspect one object" WebXR path. **Device: High** on 4 GB Chromebooks — one 3D sim at a time, never inside a bench, aggressive LOD, and a frame-rate watchdog that steps quality down automatically. **Phase: P4.**

---

## 9. G. Our Own Additions

### F25 · Predict-Before-Run Gate

**What.** The sim will not start until the student commits a prediction — and not by picking a multiple choice: they **drag the curve** they expect onto the empty graph, or place a marker where they think the ball lands. After the run, prediction and result are overlaid with the gap quantified.

**Why.** Predict-Observe-Explain is among the best-evidenced conceptual-change structures in science education, and its power depends entirely on commitment *before* evidence — which software can enforce and a worksheet cannot. It also yields a clean misconception signal for F10 and a ready-made prediction question for F15.

**How.** A sketch layer over the chart (pointer/touch path resampled onto the x-axis), stored in the run record; the predicted-versus-actual delta becomes a first-class notebook and telemetry metric. **Feasibility: Easy. Device: negligible. Phase: P2.** Best effort-to-impact ratio in this document.

### F26 · Parameter Sweep & Batch Runs

**What.** Declare a range and step (or a distribution and a trial count) and the platform runs the sim headless hundreds of times in seconds: angle 0–90° in 1° steps → the range curve; 500 stochastic selection runs → an outcome distribution; a Monte Carlo over measurement uncertainty (F3) → a confidence interval.

**Why.** It is the one thing a virtual lab can do that no physical lab ever can, and it goes straight at the concepts needing many trials — distributions, sampling, optimisation, sensitivity, emergent regularity. It is also the verification engine behind F13's answer keys.

**How.** The model runs without a renderer — already permitted, since view and model are separate — in a Web Worker pool at max tick rate with no interpolation. A projectile run is sub-millisecond; a 500-run ABM sweep is seconds. Progress bar, cancel, and a hard total-tick cap protect the device. Heavy sims can sweep server-side through the identical deterministic code path — another payoff of determinism.

**Feasibility: Medium. Device: Medium but controlled. Phase: P3.**

### F27 · Counterfactual Constants

**What.** A guarded panel of world dials — gravity (Earth/Moon/Mars/arbitrary), the speed of light down to walking pace, Coulomb's constant, friction globally off, Planck's constant scaled up — each with a consequence readout and a short "what breaks" note.

**Why.** Understanding what a constant *does* is best taught by removing it. It is also pure delight, the kind of thing students screenshot and share — and delight is a distribution strategy.

**How.** Constants are already parameters in a well-built model; the work is guarding numerically unstable regions per sim, offering curated presets rather than raw sliders below HS, and labelling honestly when a counterfactual outruns model validity (F30). **Feasibility: Easy–Medium. Device: negligible. Phase: P3.**

### F28 · Verifiable Lab Records

**What.** Every completed lab produces a server-signed record: the run's `{seed, params, input log}` hash, timestamps, the design object and the notebook text. The teacher opening a submission can **replay exactly what the student did** rather than read a claim about it.

**Why.** When any written lab report can be generated in seconds, the defensible assessment artifact is the *process* — and we are one of the few platforms that structurally has it. It is a serious district sales argument and fair to students: it rewards doing the work.

**How.** Falls out of the existing replay format plus a signature and a submission endpoint. Claim it honestly: it proves the record is the one our server received and that it replays consistently, not that a human rather than a script produced the inputs — pair it with process telemetry (pacing, revisions) rather than overclaiming. **Feasibility: Easy–Medium. Device: none. Phase: P4.**

### F29 · Units & Uncertainty as a First-Class Type

**What.** Every engine quantity is `{ value, unit, uncertainty? }`, not a bare number. Arithmetic is dimension-checked; the UI renders unit chips; unit systems switch anywhere (SI ↔ US customary, °C ↔ K ↔ °F) with real conversions; entering `5 cm` where metres are expected is handled, not rejected; mismatched units in an equation are caught and explained.

**Why.** Dimensional analysis is a Common Core and NGSS quantitative-reasoning requirement and a chronic failure point. As infrastructure it is what makes cross-sim wiring (F1), instrument portability (F5), CSV import (F7) and uncertainty propagation (F3) safe rather than a source of silent, wrong physics.

**How.** A small units library over the existing zod schemas (dimension vectors, not string matching), with branded TypeScript types and runtime checks at boundaries. **Feasibility: Medium** — the library is small, but the migration surface is the whole catalogue, so **do it before the T2 wave**. **Device: negligible. Phase: P2.**

### F30 · Model Fidelity Ladder & Visible Limits

**What.** Each sim declares its model tier and assumptions, visibly: *Grade 5 view — air resistance ignored, g constant. Grade 11 view — quadratic drag, altitude-varying g.* A "model limits" note names where the simulation stops being true, and where supported the student can step up a tier and see what changes.

**Why.** Every simulation lies; the honest ones say how. That models are purpose-built approximations is a top-level NGSS crosscutting concept, and saying so defuses the expert critique that virtual labs teach idealised physics. Competitors treat their simplifications as invisible; we make them the lesson.

**How.** Manifest metadata (`fidelity: { tier, assumptions[], validRange, knownDeviations[] }`) rendered in the shell, plus tier-switchable model terms sharing F23's machinery. **Feasibility: Easy** (metadata + UI) to **Medium** (multi-tier models). **Device: none. Phase: P3.**

---

## 10. Why We Beat Each Competitor

● full · ◐ partial · ○ absent.

| Capability | **Smart Lab** | PhET | Labster | Gizmos | CK-12 PLIX | oPhysics |
|---|---|---|---|---|---|---|
| F1 Cross-sim data bus / workbench | ● | ○ | ○ | ○ | ○ | ○ |
| F2 Enforced fair-test design | ● | ○ | ◐ scripted | ◐ worksheet | ○ | ○ |
| F3 Uncertainty & error analysis | ● | ○ | ◐ | ○ | ○ | ○ |
| F4 Time machine / run diff | ● | ○ | ○ | ○ | ○ | ○ |
| F5 Cross-domain free-form bench | ● | ○ | ◐ chem only | ○ | ○ | ○ |
| F6 Device sensors as input | ● | ○ | ○ | ○ | ○ | ○ |
| F7 Live datasets + CSV compare | ● | ○ | ○ | ○ | ○ | ○ |
| F9 AI that operates the sim | ● | ○ | ○ | ○ | ◐ tutor beside content | ○ |
| F10 Behavioural misconception detection | ● | ◐ research only, paid | ○ | ○ | ○ | ○ |
| F11 AI formative report feedback | ● | ○ | ◐ auto-quiz | ○ | ◐ | ○ |
| F13 Teacher generative materials | ● | ○ | ○ | ◐ static | ◐ | ○ |
| F15 Live class + peer instruction | ● | ○ | ○ | ◐ class view | ○ | ○ |
| F17 Class data pooling | ● | ○ | ○ | ○ | ○ | ○ |
| F18 Deterministic narrated replay | ● | ○ | ○ | ○ | ○ | ○ |
| F19 LTI 1.3 Advantage + free embeds | ● | ◐ embed only | ● | ● | ◐ | ◐ |
| F21 Sonification | ● | ◐ few sims (only real precedent) | ○ | ○ | ○ | ○ |
| F22 Macro↔particulate continuum | ● | ◐ separate views | ◐ cinematic | ◐ | ○ | ○ |
| F23 Equation binding + model editing | ● | ○ | ○ | ○ | ○ | ◐ formulas shown |
| F26 Batch / sweep experiments | ● | ○ | ○ | ○ | ○ | ○ |
| F28 Verifiable process records | ● | ◐ paid tier | ◐ | ◐ | ○ | ○ |
| F30 Visible model limits | ● | ○ | ○ | ○ | ○ | ○ |
| Grade 1–12 single-platform coverage | ● | ◐ weak K-2 & bio | ○ HS+ | ● | ● | ○ HS physics |
| Runs well on a 4 GB Chromebook | ● | ● | ○ | ● | ● | ● |

**Strategic reading.** PhET wins on pedagogy research and price and will not be beaten there; we beat it on *what happens around the sim* — data flow, classroom orchestration, AI, assessment, coverage. Labster wins on spectacle and loses on inquiry, performance and price. Gizmos wins on catalogue and materials and loses on modernity and depth. CK-12 wins on free and loses on depth. oPhysics is one author's GeoGebra exports. **Nobody occupies "deep experimentation + classroom orchestration + AI inside the model."** That is the position.

---

## 11. Prioritization & the Extraordinary-Tier Shortlist

Impact = learning value × differentiation × adoption leverage.

| # | Feature | Impact | Effort | Device | Phase |
|---|---|---|---|---|---|
| F25 | Predict-before-run gate | ★★★★★ | Easy | – | P2 |
| F2 | Variable & control planner | ★★★★★ | Easy–Med | – | P2 |
| F9 | AI that drives the sim | ★★★★★ | Medium | – | P2 |
| F29 | Units & uncertainty type | ★★★☆☆ infra | Medium | – | P2 |
| P-1…P-5 | Platform primitives | ★★★★★ infra | Medium | – | P2–P3 |
| F22 | Macro↔particulate zoom | ★★★★★ | Medium | Med | P3 |
| F4 | Time machine & diff | ★★★★☆ | Medium | Med | P3 |
| F26 | Parameter sweeps | ★★★★☆ | Medium | Med | P3 |
| F1 | Multi-sim workbench | ★★★★☆ | Medium | High | P3 |
| F3 | Uncertainty mode | ★★★★☆ | Easy–Med | – | P3 |
| F7 | Real data + CSV compare | ★★★★☆ | Medium | Low | P3 |
| F11 | AI report feedback | ★★★★☆ | Easy–Med | – | P3 |
| F18 | Narrated replay export | ★★★★☆ | Easy–Med | Low | P3 |
| F12 | NL / standards search | ★★★☆☆ | Easy | – | P3 |
| F21 | Sonification | ★★★☆☆ | Easy–Med | Low | P3 |
| F20 | Print worksheets | ★★★☆☆ | Easy | – | P3 |
| F27 | Counterfactual constants | ★★★☆☆ | Easy–Med | – | P3 |
| F30 | Model fidelity ladder | ★★★☆☆ | Easy | – | P3 |
| F8 | Calibration discipline | ★★☆☆☆ | Easy | – | P3 |
| F15 | Live class mode | ★★★★★ | Medium | Low | P4 |
| F17 | Class data pooling | ★★★★★ | Medium | – | P4 |
| F10 | Misconception detection | ★★★★★ | Med–Hard | – | P4 |
| F19 | LTI 1.3 Advantage | ★★★★☆ | Med–Hard | – | P4 |
| F13 | Teacher generative materials | ★★★★☆ | Medium | – | P4 |
| F28 | Verifiable records | ★★★★☆ | Easy–Med | – | P4 |
| F23 | Equation binding (→ editing) | ★★★★☆ | Med → Hard | Low | P4 → P5 |
| F24 | 3D & AR | ★★★☆☆ | Medium | High | P4 |
| F6 | Device sensors | ★★★☆☆ | Med–Hard | High | P4 |
| F5 | Free-form lab bench | ★★★★☆ | Hard | High | P5 |
| F14 | AI-assisted authoring | ★★★★☆ | Hard | – | P5 |
| F16 | Collaborative labs | ★★★☆☆ | Hard | Low | P5 |

### The Extraordinary Eight — build these first after MVP

| # | Feature | The one-line case |
|---|---|---|
| 1 | **F25 Predict-before-run** | Highest learning gain per dev-week in this document; ships in days. |
| 2 | **F2 Variable & control planner** | Turns slider-flailing into science; unlocks F10 and F17. |
| 3 | **F9 AI that drives the sim** | The market's clearest white space, and the demo that sells the product. |
| 4 | **F22 Macro↔particulate zoom** | The most powerful visualization in K-12 chemistry — and it must be architected *before* the T2 sim wave. |
| 5 | **F4 Time machine & diff** | Makes comparison, where conceptual change happens, a first-class action. |
| 6 | **F1 Multi-sim workbench** | The capability no competitor can retrofit; proves "platform," not "collection." |
| 7 | **F15 Live class mode** | The strongest whole-class adoption driver; evidence-backed peer-instruction flow. |
| 8 | **F17 Class data pooling** | Enormous pedagogical value at near-zero marginal cost once F15's service exists. |

Sequencing: 1–2 are application logic and can start immediately; 3 ships with the P2 assistant; 4 is an architectural decision that gates sim production; 5–6 depend on the data bus; 7–8 share the session service and should be built as one project.

---

## 12. What We Deliberately Reject

| Rejected | Why |
|---|---|
| **Photorealistic 3D "game" labs (Labster style)** | High cost per lab, heavy on 4 GB Chromebooks, and the evidence is that spectacle displaces inquiry — students navigate a corridor instead of controlling a variable. Clarity over cinema; the budget goes into model depth. |
| **VR-first / headset-required experiences** | Headsets are absent from essentially all US K-12 science rooms, supervision and hygiene are real, and WebXR doesn't exist on Chromebooks. AR stays an optional phone-side enhancement (F24). |
| **Open-world / avatar lab campus** | Navigation is not learning. Every minute walking to the stockroom is a minute not measuring. |
| **General "physics engine for everything" cross-sim coupling** | Unbounded scope, unbounded QA, and a guaranteed source of subtly wrong science. F5 ships curated domain pairs instead. |
| **Free-form AI code generation of student-facing sims** | Unvalidatable and unsafe — it would put unverified science in front of children. F14 generates *data for our templates*, behind golden-value tests and human review. |
| **CRDT-merged simulation state** | Breaks the single ordered input log, and with it determinism, replay, diff and verifiable records. CRDTs are for notebook text only. |
| **AI-assigned grades** | Formative only. Grading is the teacher's authority; automated grading invites bias claims, district resistance and appeals we cannot win. |
| **Raw sensor/media data leaving the device** | Camera and microphone processing stays client-side, permanently. No "anonymised" uploads. |
| **A native mobile app** | The PWA covers offline; two codebases would halve sim output. Revisit only if AR usage proves substantial. |
| **Blockchain credentialing for lab records** | F28's signed records give the entire practical benefit without the cost, complexity or reputational drag. |
| **Real-time voice chat with the assistant** | Unworkable acoustics in a 30-student room, high per-minute cost, marginal gain over text plus F9's on-sim actions. Revisit for accessibility only. |

---

## 13. Tier Risks & Cost Envelope

| Risk | Likelihood | Mitigation |
|---|---|---|
| Feature creep drowns sim production | High | Phase gates; the catalogue keeps an independent velocity target; no advanced feature takes more than ~25% of a phase's capacity. |
| AI running cost scales with engagement (F11 dominant) | High | Per-student daily caps, prompt caching of stable prefixes, smaller model class by default, generated artifacts cached and shared across a class. |
| Realtime service becomes an ops burden | Medium | One service (P-4) serves F15/F16/F17; stateless except rooms, no per-sim server logic, graceful degrade to share links when websockets are blocked. |
| Advanced UI overwhelms a 5th grader | Medium | Progressive disclosure is a shell-level rule; every feature declares a minimum grade band and is invisible below it. |
| Determinism regressions break half the tier at once | Medium | CI runs a cross-platform replay-hash test on every sim on every commit; divergence fails the build. |
| Dataset upstream changes/outages (F7) | Medium | Server proxy + cache + frozen fallback snapshot per dataset; adapter contract tests nightly. |
| Teacher-authored content quality drift (F14) | Medium | Author's own classes only until reviewed; non-bypassable validation gate; public entries name their reviewer. |
| Sensor features blocked by district policy (F6) | High | Assume blocked by default; every sensor lab has a full non-sensor path and is never an assignment prerequisite. |

**Envelope**, small team across P2–P5: primitives ≈ 2 months; the Extraordinary Eight ≈ 5–7 months; the remainder spread over P4–P5 alongside sim production. New recurring costs: the session service, the data proxy, and AI inference — the last being the only one that scales with student count, and therefore the one needing a modelled unit economic before F11 ships broadly.

---

## 14. Open Questions

1. **Session service:** build on GradeNext's existing realtime infrastructure, or stand up a dedicated one? Gates F15/F16/F17 as a group.
2. **AI budget per student per month** — decides whether F11 is unlimited or capped and whether F13 is teacher-metered.
3. **Free vs paid boundary:** recommendation — F1/F4/F22/F25/F27 free (they drive word-of-mouth and are the product's soul); F15/F17/F13/F19/F28 form the teacher/district paid tier.
4. **Authoring governance (F14):** who reviews, at what SLA, and is there a public marketplace or district-scoped sharing only?
5. **Sensor posture:** pursue explicit district approval for camera/microphone labs, or keep them permanently opt-in extras?
6. **LTI certification:** formal 1EdTech certification (procurement advantage, real cost) or a conformant-but-uncertified integration first?
7. **Uncertainty defaults:** should messiness mode (F3) default *on* for Grades 9-12, accepting that it makes early exploration harder?
