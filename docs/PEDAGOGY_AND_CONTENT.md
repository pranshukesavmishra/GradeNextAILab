# GradeNext Smart Lab — Pedagogy & Content Production Specification

> The rules that decide what a simulation teaches, how it teaches it, who it teaches it to, and when it is allowed to ship.

**Status:** Specification for review · **Version:** 1.0 · **Date:** 2026-08-28
**Companion to:** [SMART_LAB_PLAN.md](./SMART_LAB_PLAN.md) · [SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md) · [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)

This document is binding on content designers, sim engineers, and reviewers. Where it says **MUST**, a sim that violates it does not pass its quality gate.

---

## Table of Contents

1. [Learning Design Principles](#1-learning-design-principles)
2. [The Guided Lab Pedagogical Template](#2-the-guided-lab-pedagogical-template)
3. [Grade-Band Adaptation Rules](#3-grade-band-adaptation-rules)
4. [Misconception-Targeted Design](#4-misconception-targeted-design)
5. [Assessment Design](#5-assessment-design)
6. [The Challenge Design Playbook](#6-the-challenge-design-playbook)
7. [AI Tutor Pedagogy](#7-ai-tutor-pedagogy)
8. [Content Production Pipeline](#8-content-production-pipeline)
9. [Localization & Inclusion](#9-localization--inclusion)
10. [Efficacy Measurement](#10-efficacy-measurement)
11. [Sources](#11-sources)

---

## 1. Learning Design Principles

Seven principles. Each is stated as a rule a designer can apply or violate, not as a philosophy. Each has a **forbids** clause — the failure mode we are legislating against — and a Smart Lab example.

### P1 — Implicit scaffolding: guide through the interface, never through a wall of instructions

**What it means.** Guidance comes from *affordances, constraints, cueing, and feedback* built into the sim, so students are "guided without feeling guided" ([Podolefsky, Moore & Perkins](https://arxiv.org/pdf/1306.6544); [AIP 1513](https://pubs.aip.org/aip/acp/article/1513/1/302/877085/Guiding-without-feeling-guided-Implicit)). The productive path must be the *easiest* path — the effect of a guided-inquiry worksheet, without the worksheet ([Chem. Educ. Res. Pract.](https://pubs.rsc.org/rp/article/14/3/257/416444/Interactive-simulations-as-implicit-support-for)).

**Rules.**
- Default state MUST be productive: on load the sim shows the phenomenon in its most interpretable configuration, never an empty canvas.
- Draggable things MUST look draggable, and MUST self-animate after 8 s untouched.
- Constrain sliders to the pedagogically meaningful range (if k > 200 N/m makes the animation unreadable, the slider stops at 200).
- Cue the next representation by proximity and motion, not text: drag the mass, the force arrow grows in the same visual field.

**Forbids.** Modal "How to use this simulation" dialogs. Instruction paragraphs above the canvas. Tooltips as the primary teaching channel. Any control whose meaning can only be learned by reading.

**Example.** In **Circuit Builder**, wires snap only to terminals, and a bulb placed in an open circuit renders visibly dark with a faint dashed gap at the break. No text says "your circuit is incomplete" — the gap and the dark bulb say it. The student closes the loop because closing it is the obvious affordance.

### P2 — Minimal text: exploration must begin within 10 seconds

**What it means.** Reading taxes the same working memory we need for the concept ([Sweller](https://link.springer.com/article/10.1007/s10648-019-09465-5)).

**Rules.**
- Explore mode MUST be usable with **zero** words read; labels are icons plus at most one noun.
- On-screen instructional strings capped at K-2 ≤ 6 words, 3-5 ≤ 12, 6-8 ≤ 20, 9-12 ≤ 35.
- Longer prose goes to the Lab Notebook or a collapsed "Why?" panel — never the interaction path.

**Forbids.** Pre-sim lectures. Multi-paragraph lab briefs. "Read this before you begin."

**Example.** **Pendulum Lab** Explore opens with a swinging pendulum already in motion, three sliders (length, mass, gravity), and a stopwatch. Total word count on screen at K-2: four ("Long", "Short", "Heavy", "Light").

### P3 — Linked multiple representations that move together

**What it means.** Abstractions become meaningful when seen changing in lockstep with the concrete thing; separating them in space or time forces costly mental integration (split-attention effect — [Ayres & Sweller](https://www.davidlewisphd.com/courses/EDD8121/readings/2006-AyersSweller.pdf)).

**Rules.**
- ≥ 2 synchronized representations at 6-8, ≥ 3 at 9-12 (animation, vectors, live graph, readout).
- All representations update in the same animation frame — a lagging graph teaches a false causal story.
- Selecting in one representation highlights the counterpart in all others.
- Numeric readouts sit on or beside the object they describe, not in a distant panel.

**Forbids.** "Show graph" as a separate screen. Data tables that only populate after a run ends when a live trace is possible. Colour-coding that differs between the animation and the graph.

**Example.** **Energy Skate Park+**: the skater, the KE/PE/thermal bar chart, the energy-vs-position graph, and the numeric energy total all animate on the same tick. Dragging the skater backwards on the track drags the graph cursor backwards too.

### P4 — Immediate, interpretable feedback

**What it means.** Feedback must arrive fast enough to be attributed to the action that caused it, and must be diagnostic rather than evaluative.

**Rules.**
- Physical response to a control change < 100 ms; checkpoint verdict < 500 ms.
- Every verdict names the evidence ("your three trials all used the same mass — the variable you were testing didn't change"). A bare ✗ is banned.
- Never gate on one right answer where a range is defensible; verify with tolerances (§2.4).

**Forbids.** Score-only feedback. Delayed batch grading inside a lab. "Try again" with no information.

**Example.** In **Photosynthesis Lab**, a student who concludes "more light always means more oxygen" gets: *"Look at your last four trials — between 80% and 100% light your bubble rate barely changed. What might be running out?"*

### P5 — Productive failure before formalisation

**What it means.** Generating and failing at your own solution *before* instruction beats instruction-first on conceptual understanding and transfer (meta-analytic *d* ≈ 0.36, no procedural cost — [Sinha & Kapur, *RER*](https://journals.sagepub.com/doi/10.3102/00346543211019105); [Kapur & Roll](https://boldscience.org/wp-content/uploads/2025/04/Productive-Failure.pdf)).

**Rules.**
- Hypothesis before data, always; correctness is not revealed until trials are run.
- Formal vocabulary and equations arrive *after* the student's own pattern is on screen — the equation names what they found, it is not a premise.
- Wrong hypotheses are never penalised; changing your mind with evidence scores full marks.
- Challenges may be attempted before the lab. Failure there is data, not a gate.

**Forbids.** Showing the formula before the first run. Blocking Run until the hypothesis is "correct". Scoring hypothesis accuracy.

**Example.** **Forces & Newton's Laws Lab** never shows `F = ma` until the student has plotted at least six (force, acceleration) points and drawn a trend. The lab then says: "Your line has a slope. Divide force by acceleration for any point on it. What do you get? Now weigh the cart."

### P6 — Cognitive load management

**What it means.** Intrinsic load belongs to the concept; extraneous load belongs to our bad design and must be engineered out ([Sweller](https://link.springer.com/article/10.1007/s10648-019-09465-5)). Duplicating identical information across two channels *hurts* — the redundancy principle ([Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/redundancy-principle-in-multimedia-learning/448A5532008EB4B4BA17DBEB5A421920)).

**Rules.**
- **Control budget:** K-2 ≤ 3 visible controls, 3-5 ≤ 5, 6-8 ≤ 8, 9-12 ≤ 14; the rest live in a collapsed Advanced tray.
- One new representation at a time — never a new graph type and a new instrument in the same phase.
- Never narrate on-screen text verbatim at 6-12. At K-2 narration *replaces* text, it does not accompany it.
- The Lab Notebook auto-captures every trial, so students never hold numbers in their heads.
- Colour is never the sole carrier of meaning (also §9).

**Forbids.** Simultaneous audio narration + identical caption for readers. Ten sliders visible to a Grade 4. Asking a student to remember trial 1's value while running trial 2.

**Example.** **Circuit Builder** at 6-8 exposes battery voltage, resistance, switch, and one meter. Internal resistance, wire resistivity, and capacitance are engineered but hidden until 9-12 unlocks the Advanced tray.

### P7 — Prior-knowledge activation and a real anchoring phenomenon

**What it means.** Every lab opens in the 5E Engage phase with a phenomenon the student can already talk about ([Bybee](https://pimser.org/wp-content/uploads/2022/01/BSCS_5E_Instructional_Model_Bybee-article.pdf); [STEM Teaching Tools](https://stemteachingtools.org/sp/limfn)).

**Rules.**
- One screen: a looping phenomenon or in-sim event plus one question in student language.
- The anchor MUST be answerable *wrongly* from everyday knowledge — its job is to surface prior ideas, including the targeted misconception (§4).
- The initial answer is stored and shown back in the Conclusion phase for self-comparison.

**Forbids.** Opening with a definition. Anchors that require the vocabulary the lab teaches.

**Example.** **Seasons & Sunlight** opens with two photographs — a July street and a January street at the same location — and asks "Why is one hot?" The Grade 6 student almost always answers "Earth is closer to the Sun." That answer is stored and confronted in Phase 5.

---

## 2. The Guided Lab Pedagogical Template

### 2.1 Canonical structure and timing

One Guided Lab MUST fit a single class period with setup and discussion: **target 22-28 minutes of student screen time**, hard cap 35. Teachers get a "short form" toggle that drops optional trials to reach ~15 minutes.

| # | Phase | Student time (6-8 target) | What the student must actually do | Auto-captured to Notebook |
|---|---|---|---|---|
| 1 | **Question** (Engage) | 2-3 min | React to the anchoring phenomenon; state the investigable question in their own words or pick from 3 candidate questions (one non-investigable, deliberately) | Anchor response, chosen question |
| 2 | **Hypothesis** (Explore-primer) | 3-4 min | Commit a prediction *with a reason*: sentence frame "If I increase ___, then ___ will ___, because ___" | Prediction + reasoning text |
| 3 | **Setup** | 4-5 min | Configure the sim: choose independent variable, identify what must be held constant, set trial count. Variable-control errors are caught here, not silently allowed | Setup snapshot, control-of-variables audit |
| 4 | **Run & Measure** | 6-8 min | Execute ≥ 3 trials (≥ 5 at 9-12), operate the instruments, record readings. Repeats at the same setting are required at 9-12 to expose spread | Every trial: parameters, readings, timestamps |
| 5 | **Data** | 4-5 min | Organise into a table; choose/build the graph; identify the pattern. At 9-12: fit, residual sanity check, uncertainty estimate | Table, graph, fit parameters |
| 6 | **Conclusion** (Explain/Evaluate) | 4-5 min | Answer the question with evidence; compare to the Phase-2 prediction; state a limitation; apply to one new situation | Claim-Evidence-Reasoning text, transfer item response |

**Design ratio.** No more than 35% of lab time may be spent on Phases 1-3 combined. If setup is eating the period, the sim's defaults are wrong.

### 2.2 What each phase demands

- **Question** produces *ownership*: three candidate questions, one deliberately not investigable ("which colour of pendulum is prettiest?"), forcing a real discrimination.
- **Hypothesis** must carry a mechanism. No "because", no acceptance at 6-12; picklist reasons at 3-5; two-icon choice at K-2.
- **Setup** teaches control-of-variables: the checkpoint diffs the planned trials and flags multi-variable changes *before* the period is wasted.
- **Run & Measure** demands instrument operation — position the ruler, start and stop the timer, read the meter. Auto-measurement is an accommodation, or K-2 only.
- **Data** demands a *choice* of axes and graph type. Wrong-but-reasonable choices get a nudge, not a block.
- **Conclusion** demands CER citing *their own* trial numbers, one-click insertable from the notebook.

### 2.3 How checkpoints avoid becoming click-through rails

The Labster failure mode — a cinematic lab where every step is a "click Next to continue" — is the thing this template exists to prevent. Six anti-rail rules:

1. **Checkpoints verify state, not clicks.** A checkpoint passes by inspecting sim state and student-entered data (e.g., "three trials exist whose only differing parameter is `length`"), never by "student pressed the button".
2. **No forced order inside a phase.** Within Run & Measure the student may run trials in any order, redo, or delete.
3. **Multiple correct paths.** Every checkpoint predicate MUST accept ≥ 2 distinct valid solution routes wherever the physics allows. Reviewer question at gate: *name the second path.*
4. **Wrong turns are survivable and instrumented.** Students may proceed with a flawed design; the sim records it and the Conclusion phase asks them to evaluate their own design. A lab where you cannot make a mistake teaches nothing about experiment design.
5. **No answer is ever pre-filled.** Sentence frames provide *structure*; the content slots are always empty.
6. **Ceiling on checkpoint count.** Max 8 checkpoints per lab (≤ 4 at K-2). More than that and the lab has become a wizard.

**Rail smell test (used in review):** if a student who understands nothing can complete the lab by pressing the only enabled control repeatedly, the lab fails.

### 2.4 Checkpoint verification semantics

| Check type | Example predicate | Tolerance policy |
|---|---|---|
| Structural | ≥ 3 trials with exactly one varied parameter | Exact |
| Numeric | Measured period within 8% of model value | Band-dependent: K-5 ±20%, 6-8 ±12%, 9-12 ±5% or within stated uncertainty |
| Trend | Sign of slope of student's fitted line | Exact sign, magnitude free |
| Textual | CER contains a number from their own dataset + a causal connective | Rubric-scored, never blocking |
| Design | Constants actually held constant across trials | Exact, with named offender on failure |

Textual checks **never block progress**. Only structural and design checks may block, and only within their phase.

### 2.5 The hint ladder

Hints are requested, never pushed — with one exception: after **90 seconds of zero meaningful state change**, a level-1 nudge appears passively in the assistant tray (no modal, no sound).

| Level | Name | What it may contain | Earliest availability |
|---|---|---|---|
| **1** | **Nudge** | Attention direction only. "Watch the bulb when you move the switch." Contains no physics claim. | Immediately |
| **2** | **Question** | A Socratic question that decomposes the task. "What is different between trial 2 and trial 3?" | After 1 student action post-L1, or 45 s |
| **3** | **Partial** | One step of the procedure or one relationship, never the answer. "Period depends on length. Try holding mass fixed and changing only length." | After a genuine attempt following L2 |
| **4** | **Worked** | A fully worked *analogous* example on different numbers/objects, then returns the student to their own case. | Only after a level-3 hint plus one further failed attempt, or on explicit "show me how" |

Level 4 is a worked example, which is the right support for a genuinely struggling novice, but is counterproductive once the student has competence — the expertise-reversal and guidance-fading findings ([Renkl & Atkinson, *The Guidance Fading Effect*](https://link.springer.com/chapter/10.1007/978-1-4419-8126-4_13); [expertise reversal effect](https://my.chartered.college/impact_article/expertise-reversal-effect-and-its-instructional-implications/)). Therefore:

- **Fading rule:** once a student has passed the same checkpoint *type* three times across any labs at their band, level-4 hints for that type require an extra explicit confirmation ("Are you sure? Try one more time first.") and level-1 nudges stop appearing passively.
- **Hint debt:** hints consumed are recorded per checkpoint and feed the mastery model (§5.5). Level 3-4 usage caps that checkpoint's mastery contribution at "supported", not "independent".

---

## 3. Grade-Band Adaptation Rules

One simulation engine; four content skins. The physics never changes — the *instrumentation, language, and demand* change.

### 3.1 The adaptation matrix

| Dimension | **K-2** (Gr 1-2) | **3-5** | **6-8** | **9-12** |
|---|---|---|---|---|
| **Reading target** | 190L-530L; narration-first, text optional | 520L-940L | 925L-1185L | 1050L-1385L |
| Sentence length cap | 8 words | 14 words | 22 words | 30 words |
| **Vocabulary** | Everyday words only ("push", "fast", "bright") | Everyday + ≤ 5 tier-3 terms, each with an icon gloss | Full discipline vocabulary, ≤ 10 new terms, glossed on tap | Full technical + symbolic notation |
| **Visible controls** | ≤ 3, large (≥ 64 px), discrete | ≤ 5, discrete or coarse continuous | ≤ 8, continuous + numeric entry | ≤ 14 + Advanced tray |
| **Numbers** | None. Comparative language and pictorial scales only | Whole numbers, 0-100 range preferred | Decimals to 2 places, scientific notation introduced Gr 8 | Full precision, sig figs enforced, scientific notation default |
| **Units** | Not shown | Shown as words ("seconds") | Standard symbols, unit conversion tasks | Symbols + dimensional analysis; unit errors flagged |
| **Uncertainty** | None | None | "Repeat and see the spread" — qualitative | Explicit: repeats, mean ± range or SD, error bars, propagation at Gr 11-12 |
| **Graphs** | Pictograph / 2-bar comparison, auto-drawn | Bar chart + simple line, axes pre-labelled | Scatter + line of best fit (student-drawn), student labels axes | Multi-series, log axes, residuals, regression stats |
| **Scaffolding density** | Checkpoints ≤ 4, every action modelled by animation | Checkpoints ≤ 6, sentence frames with picklists | Checkpoints ≤ 8, open sentence frames | Checkpoints ≤ 8, frames optional, blank-notebook mode available |
| **Hypothesis format** | Tap one of two picture outcomes | "If ___ then ___" with dropdowns | Full "If/then/because" free text | Free text + operational definition of variables |
| **Assessment type** | Drag-to-sort, tap-the-picture, spoken response | MCQ + short answer + label-the-diagram | MCQ with distractors from misconception bank + CER paragraph | CER + calculation + error analysis + transfer item |
| **Session length** | 8-12 min | 15-20 min | 22-28 min | 30-40 min (may span 2 periods) |
| **Notebook output** | 3-panel picture story with dictated caption | Half-page structured report, fill-in headings | 1-page CER report, student-written headings | Full lab report: purpose, method, data, analysis, uncertainty, discussion |

Lexile targets follow the CCSS text-complexity stretch bands ([MetaMetrics/Lexile grade-level guidance](https://lexile.com/wp-content/uploads/2017/08/T1.4.FAQ_LM-and-Grade-Levels.pdf); [Hiebert on CCSS text complexity](https://www.casciac.org/pdfs/HiebertBookChapteronTextComplexity.pdf)). All UI and lab strings MUST be scored before ship; a string above the band ceiling fails the copy gate (§8.3).

### 3.2 Prose rules the table cannot capture

- **Down-banding is not deletion.** A K-2 skin is not the 9-12 skin with numbers removed; it is a *different question about the same phenomenon*. Grade 11 asks "what is the relationship between length and period?"; Grade 1 asks "which swing is slower?"
- **The phenomenon is never simplified into falsehood.** We may hide air resistance; we may not say it does not exist. Every simplification MUST be listed in the sim's `model_limits` field and surfaced at 9-12 in the Discussion scaffold.
- **Band is a default, not a cage.** Teachers can set any band for any class; students may request "show me the harder version" (recorded as a positive engagement signal, never penalised).
- **Cross-band continuity of colour and layout.** A Grade 3 who meets green = kinetic energy must find green = kinetic energy in Grade 11. Semantic colour is a platform-level constant.

### 3.3 Worked example: **Pendulum Lab** at all four bands

**Shared engine:** point mass on a massless string, adjustable length (0.1-2.0 m), mass (0.1-2.0 kg), release angle (5-80°), gravity (Moon/Earth/Jupiter presets + continuous at 9-12), optional damping, photogate + stopwatch + protractor instruments.

| Element | **K-2** | **3-5** | **6-8** | **9-12** |
|---|---|---|---|---|
| Title | "Swing Time" | "What Makes a Pendulum Swing Faster?" | "Investigating the Period of a Pendulum" | "Determining *g* from Simple Harmonic Motion" |
| Anchor | Two playground swings, one long chain one short, both swinging | Grandfather clock pendulum ticking; "why doesn't it drift?" | Metronome vs. clock pendulum vs. wrecking ball | Foucault pendulum footage; "how did Huygens time the ocean?" |
| Controls | Length (short/long toggle), Mass (light/heavy toggle), Go | Length slider (5 stops), Mass slider (3 stops), Angle (small/big) | Length (cont., 0.1-2.0 m), Mass (cont.), Angle (cont.), Gravity preset, Damping on/off | All continuous + gravity value entry + damping coefficient + two-pendulum compare + data export |
| Measurement | None — a cartoon turtle/hare badge shows slower/faster | Count swings in 10 s (auto-counter) | Time 10 swings with stopwatch, divide; photogate available | Photogate, 20 oscillations × 3 repeats, mean ± SD |
| Numbers shown | None | "8 swings" | "T = 1.42 s", "L = 0.50 m" | "T = 1.4187 ± 0.0043 s", "L = 0.500 ± 0.002 m" |
| Graph | Two bars: "long swing / short swing" | Bar chart of swings-per-10s vs length | Scatter T vs L, student draws best-fit curve; then T vs √L linearises | T² vs L with linear regression, slope → g, residual plot, error bars |
| Hypothesis | Tap the swing you think is slower | "If the string is [longer/shorter], the pendulum will swing [faster/slower]" | Free "If/then/because" | Predicted functional form + expected slope with units |
| Misconception targeted | Heavier swings faster | Heavier swings faster; bigger push swings faster | Mass-dependence; amplitude-dependence | Small-angle approximation limits; treating T ∝ L |
| The break | Heavy and light swings shown side by side, released together, staying in step for 20 s | Student runs mass trials, counter reads identical | Student's own T vs mass scatter is flat within their spread | Amplitude sweep to 60° shows measurable deviation — the approximation itself becomes the object of study |
| Conclusion output | 3 pictures + dictated sentence | "Longer strings swing slower because ___" (picklist reason) | CER paragraph citing two of their trials | Full report incl. computed *g*, % error vs 9.81, dominant uncertainty source, and why 60° breaks the model |
| Challenge | "Make the swing match the drum beat" (2 stars) | "Build a 1-second pendulum" | "Build a 2.00 s pendulum on the Moon" | "Given an unknown planet's pendulum data, determine *g* to ±2%" |
| Time | 9 min | 17 min | 26 min | 38 min |

---

## 4. Misconception-Targeted Design

This is the section that determines whether a sim changes minds. A simulation that merely *illustrates* a correct idea leaves the student's prior idea intact alongside it. To dislodge it, the student must (a) commit to their prior idea, (b) see it fail *in a case they accept as fair*, and (c) build the replacement themselves.

### 4.1 The four-step confrontation protocol (mandatory for every targeted misconception)

1. **Elicit** — the anchor forces a commitment; the wrong idea is a legitimate, non-shamed choice, and is stored.
2. **Confront** — the sim produces an outcome incompatible with the prior idea, in a setup *the student controls* and can reproduce at will, so it cannot be dismissed as a trick.
3. **Resolve** — the student finds the rule that explains both the new result *and why their old idea seemed to work*. We explain the misconception's appeal, not just its wrongness.
4. **Consolidate** — a transfer item in a different context the same session, and again in spaced review 5-15 days later.

Distractors in our assessment items are drawn from these misconceptions, in the tradition of the [AAAS Project 2061 assessment bank](http://www.project2061.org/research/assessment.htm), whose items encode known misconceptions as answer choices so results are diagnostic ([example misconception record](http://assessment.aaas.org/misconceptions/1/SCM060/100)).

### 4.2 The catalog

Legend: **Gr** = band where it is first confronted. Every row maps to a sim in [SIMULATION_CATALOG.md](./SIMULATION_CATALOG.md).

#### Physics — force & motion
Drawn largely from the Force Concept Inventory taxonomy of commonsense beliefs ([PhysPort FCI](https://www.physport.org/assessments/FCI); [overview](https://en.wikipedia.org/wiki/Force_Concept_Inventory)).

| # | Misconception | Gr | Sim | Intervention — what must be seen/done |
|---|---|---|---|---|
| P1 | "Motion requires a continuous force; remove the force and it stops" | 6-8 | Forces & Newton's Laws Lab | Student sets friction to zero themselves, gives one push, and watches the cart travel forever. Then they *reintroduce* friction and see the stopping return — so the old rule is re-explained as "friction was always there," not "you were wrong." |
| P2 | "Heavier objects fall faster" | 3-5 | Free Fall / Gravity Lab | Simultaneous release of 1 kg and 10 kg spheres with air off; then air on, so the feather-vs-hammer case explains why their playground evidence looked different. Vacuum toggle is student-controlled. |
| P3 | "Zero velocity means zero net force / zero acceleration" | 9-12 | Projectile Launcher, Springs | Freeze-frame at the top of a trajectory with the acceleration vector still drawn at full length while the velocity vector vanishes. Student steps frame-by-frame through the apex. |
| P4 | "In a collision, the bigger object exerts more force" (3rd law) | 9-12 | Momentum & Collisions | Truck-vs-car collision with force sensors on *both* bodies; the two force-time traces overlay exactly and mirror. Student varies the mass ratio to 20:1 and the traces still mirror. |
| P5 | "The last force to act determines the direction of motion" | 6-8 | Motion Grapher / Forces Lab | Student applies a rightward impulse to a leftward-moving cart and predicts the next second; the sim traces the actual curved velocity change. |
| P6 | "Velocity and acceleration are the same thing" / graph-shape = path-shape | 6-8 | Motion Grapher | Walk-the-graph task: student's avatar must reproduce a *v-t* graph; the position graph draws simultaneously, forcing separation. Distractor: a *v-t* graph that looks like a hill but is a straight-line path. |
| P7 | "Heavier pendulums swing faster / amplitude changes the period" | 3-5 | Pendulum Lab | Side-by-side release of different masses, staying in phase for 20+ swings (§3.3). |
| P8 | "Centrifugal force pushes you outward" | 9-12 | Circular Motion | Cut-the-string button: the mass departs on a *tangent*, not radially. Student predicts the path first by drawing it. |
| P9 | "Energy gets used up / disappears" | 4-8 | Energy Skate Park+ | Thermal-energy bar made visible from the first run, so total-height bar never shrinks. Turning friction off and on grows/shrinks the thermal bar in real time. |

#### Physics — waves, light, electricity

| # | Misconception | Gr | Sim | Intervention |
|---|---|---|---|---|
| P10 | "Sound is a substance that travels; it can go through a vacuum" | 4-8 | Sound Lab | Bell-in-vacuum: student pumps air out with a slider; the waveform display flattens as the particle density drops, while the bell is still visibly ringing. |
| P11 | "Louder = higher pitch" | 3-5 | Sound Lab | Amplitude and frequency on separate sliders with a live oscilloscope; a "same pitch, different loudness" preset pair the student must match by ear and by trace. |
| P12 | "We see objects because light hits our eyes from the object *automatically*" — no source→object→eye chain | 4-5 | Light & Shadows / Optics Bench | Ray-trace toggle: turning off the lamp makes the object unseeable; student must complete a three-segment ray path (source → object → eye) to make the eye icon "see". |
| P13 | "Current is used up as it goes around a circuit" / "the battery supplies constant current" | 6-8 | Circuit Builder | Ammeters placed on *both* sides of a bulb read identically; then adding a second bulb in series drops both readings together. Electron-flow animation with a particle counter at each point. |
| P14 | "A battery is a source of constant current" and "more bulbs in parallel dims each bulb" | 9-12 | Circuit Builder (advanced) | Internal-resistance toggle: with ideal battery, parallel bulbs stay bright; with 1 Ω internal resistance they dim, explaining the classroom observation without abandoning the model. |
| P15 | "Charge is created by rubbing" | 3-8 | Static Electricity Lab | Charge counter on both objects: the totals always sum to zero. Student rubs and watches −7/+7 appear. |

#### Chemistry
Grounded in the particulate-nature-of-matter literature ([diagnostic study, *CERP*](https://pubs.rsc.org/en/content/articlehtml/2015/rp/c5rp00096c); [Sanger, *J. Chem. Educ.*](https://pubs.acs.org/doi/10.1021/ed083p954)).

| # | Misconception | Gr | Sim | Intervention |
|---|---|---|---|---|
| C1 | "Atoms/molecules themselves expand, melt, or change size when heated" | 6-8 | States of Matter | Particle view with a fixed on-screen ruler measuring one particle's diameter across all temperatures; only *spacing* and speed change. A histogram of particle speeds accompanies it. |
| C2 | "Matter is destroyed when it dissolves or evaporates" | 5-7 | Dissolving & Solutions | Sealed-vessel balance: mass readout unchanged while the solid visibly disappears; particle view shows solute particles dispersing between solvent particles. |
| C3 | "Mass changes in a chemical reaction" (e.g., burning loses mass, rusting gains it from nowhere) | 7-10 | Chemical Reactions Lab | Closed vs. open system toggle on a balance. Burn in open air: mass drops. Burn in a sealed flask: mass constant — and the atom counter shows the gas atoms that escaped. |
| C4 | "There is air between the particles of a solid/liquid" | 6-8 | States of Matter | Zoom-in with an explicit "what's in the gap?" probe returning "nothing" and a vacuum indicator; contrast with a gas where labelled N₂/O₂ particles are drawn. |
| C5 | "Gas has no mass / gases are weightless" | 5-8 | Gas Laws Lab | Evacuate a rigid flask on a balance; the reading falls. Re-admit gas; it returns. |
| C6 | "Chemical equations are balanced by changing subscripts" | 9-10 | Equation Balancer | Subscript edits visibly transform the molecule into a *different substance* (H₂O → H₂O₂ renders as a new molecule with new properties card), while coefficient edits duplicate whole molecules. |
| C7 | "Bonds *release* energy when broken" | 10-12 | Thermochemistry Lab | Energy-vs-reaction-coordinate diagram the student drags a marker along; breaking always climbs, forming always descends; the net is the difference. |
| C8 | "pH 7 is 'neutral' therefore all midpoints are safe / pH is linear" | 9-10 | Acids & Bases Lab | Log-scale particle counter: student adds acid drop by drop and watches H⁺ count ×10 per pH unit while the number line moves one tick. |
| C9 | "Phase change is a chemical change" | 5-8 | States of Matter | Molecular formula label persists (H₂O) across all three phases; a "chemical identity" panel stays green while the phase panel changes. |
| C10 | "Reaction stops at equilibrium" | 10-12 | Equilibrium Lab | Two-directional particle counters keep incrementing at equal rates while the net concentrations flatline. Student can label individual particles and watch them cross back and forth. |
| C11 | "Concentration and amount are the same thing" | 9-10 | Solutions & Molarity | Split the beaker: same molarity, different volumes; the colour is identical while the mole counter differs. |

#### Biology
Grounded in the natural-selection misconception literature ([Gregory, *Evolution: Education and Outreach*](https://evolution-outreach.biomedcentral.com/articles/10.1007/s12052-009-0128-1); [teleological & Lamarckian thinking](https://files.eric.ed.gov/fulltext/EJ849534.pdf); [Bishop & Anderson tradition summarised in *CBE-LSE*](https://www.lifescied.org/doi/10.1187/cbe.09-12-0088)).

| # | Misconception | Gr | Sim | Intervention |
|---|---|---|---|---|
| B1 | "Individuals evolve / organisms change in response to need" (Lamarckian) | 8-10 | Natural Selection Lab | Individual-tracking mode: the student can follow one labelled rabbit for its whole life and see its fur colour never change, while the *population* histogram shifts across generations. |
| B2 | "Evolution is goal-directed toward better/more complex" (teleological) | 9-12 | Natural Selection Lab | Environment-flip experiment: student reverses the selection pressure mid-run and watches the population reverse direction. Randomised mutation feed is visible. |
| B3 | "Mutations are always harmful" | 9-10 | Genetics / Mutation Lab | Mutation ledger with fitness outcomes: neutral (majority), harmful, beneficial — categorised over 500 events the student generates. |
| B4 | "Plants get their food/mass from the soil" | 5-9 | Photosynthesis Lab | Mass-balance experiment: seal a plant, weigh soil separately before/after; soil mass is essentially unchanged while plant mass rises. Labelled ¹⁴CO₂ tracer at 9-12 shows carbon entering from air. |
| B5 | "Plants respire only at night / plants don't respire" | 7-10 | Photosynthesis Lab | Simultaneous dual meters (O₂ produced, CO₂ consumed *and* produced) across a light/dark cycle; respiration line never touches zero. |
| B6 | "Photosynthesis is how plants breathe" | 6-8 | Photosynthesis Lab | Side-by-side reaction cards with the atom counters; the student must construct each equation from parts. |
| B7 | "Traits are blended in offspring" | 9-10 | Punnett / Genetics Lab | F1 uniformity then F2 3:1 reappearance of the "lost" trait across 200 auto-bred offspring the student counts. |
| B8 | "Dominant alleles are more common or 'stronger'" | 9-10 | Population Genetics | Allele-frequency slider: student sets a dominant allele to 5% frequency and watches it stay at 5% across generations. |
| B9 | "Energy is recycled in an ecosystem like matter is" | 6-9 | Food Web / Energy Pyramid | Two overlaid flow diagrams: a closed matter loop and an open energy river with heat losses at every trophic step; student adjusts trophic levels and watches the top level starve. |
| B10 | "Bigger organisms are higher on the food chain" | 5-8 | Food Web | Whale-and-krill card pair the student must place; the sim resolves by *what eats what*, not size. |
| B11 | "Cells in different tissues have different DNA" | 9-12 | Cell & Gene Expression Lab | Genome viewer identical across cell types; the *expression* overlay differs. Student toggles a transcription factor and watches a muscle cell's profile shift. |
| B12 | "Osmosis moves water toward 'where it's needed'" | 9-10 | Osmosis & Diffusion | Particle-level random-walk view with a net-flux counter; student sets equal concentrations and sees crossings continue while net flux is zero. |
| B13 | "Bacteria become resistant *because* of the antibiotic" | 9-12 | Antibiotic Resistance Lab | Resistant individuals are visibly present *before* the antibiotic is applied (student can count them at t=0), then the antibiotic only removes the rest. |

#### Earth & Space
Grounded in the astronomy-misconception literature made famous by [*A Private Universe*](https://scienceinschool.org/article/2010/privateuniverse/) and catalogued at [CSUN's common astronomy misconceptions](https://www.csun.edu/science/geoscience/astronomy/misconceptions/index.html).

| # | Misconception | Gr | Sim | Intervention |
|---|---|---|---|---|
| E1 | "Seasons are caused by Earth's distance from the Sun" | 6-8 | Seasons & Sunlight | Orbit view with a live distance readout *and* a hemisphere thermometer: the student sees Earth is nearest the Sun during northern winter. Then a light-beam spread tool shows the same beam covering more ground at high tilt. |
| E2 | "Moon phases are caused by Earth's shadow" | 5-8 | Moon Phases Lab | Free-camera: the student flies to a top-down view and sees Earth's shadow pointing away from the Moon in every phase except an actual eclipse — which they can then deliberately produce. |
| E3 | "The Moon doesn't rotate" | 6-8 | Moon Phases Lab | A flag on the Moon's far side with a rotation counter through one orbit. |
| E4 | "The Sun is directly overhead at noon everywhere" | 3-5 | Sun Path / Shadows | Latitude slider with a live shadow-length readout at solar noon. |
| E5 | "Earth's interior is hollow / uniformly molten" | 6-8 | Earth's Interior / Seismic Waves | S-waves visibly stop at the outer core in the student's own seismograph array, P-waves refract — the shadow zone appears in their data. |
| E6 | "Continents float on liquid magma" | 7-8 | Plate Tectonics | Rheology view: rigid lithosphere over *solid but ductile* asthenosphere with a strain-rate control; student pushes fast (brittle) and slow (flowing) on the same material. |
| E7 | "Weather and climate are the same; a cold winter disproves warming" | 6-9 | Climate Modeling | Dual-panel: daily weather noise vs. 30-year running mean, with a shuffle button that regenerates weather while the trend line holds. |
| E8 | "The greenhouse effect is a hole in the ozone layer" | 8-10 | Greenhouse Effect | Photon-level view: IR photons absorbed and re-emitted by CO₂ molecules the student adds; a separate UV/ozone layer panel shows it is a different mechanism and wavelength. |
| E9 | "Rock cycle is one-directional (igneous → sedimentary → metamorphic)" | 7-8 | Rock Cycle | Student drives any rock to any other via pressure/heat/erosion controls; every path is reachable, and the sim logs the path they invented. |
| E10 | "Stars in a constellation are near each other" | 5-8 | Star Explorer | Depth-rotate: the camera swings out of Earth's line of sight and the constellation dissolves. |

#### Mathematics
Whole-number bias, the operator view of `=`, and the "multiplication makes bigger" rule are the durable ones; they persist into algebra if not confronted early ([overview of persistent K-8 misconceptions](https://mathsnoproblem.com/blog/teaching-tips/how-to-address-4-common-fractions-misconceptions)).

| # | Misconception | Gr | Sim | Intervention |
|---|---|---|---|---|
| M1 | "A bigger denominator means a bigger fraction" (whole-number bias) | 3-5 | Fraction Number Line | Same-length bar partitioned live as the denominator slider moves; each piece visibly shrinks while the count grows, with the fraction's point on a shared number line. |
| M2 | "Multiplication always makes bigger; division always makes smaller" | 5-7 | Fraction Operations / Area Model | Area model where ×½ visibly halves the rectangle; a scale-factor slider crossing 1.0 flips the direction, and the student must predict before crossing. |
| M3 | "`=` means 'here comes the answer'" (operator view) | 3-8 | Balance Equations | Physical pan balance: the student must keep it level; `8 + 4 = □ + 5` is unsolvable by "compute the left" and only solvable by balancing. |
| M4 | "You can't have a number less than zero" / negative operations by rote | 6-7 | Integer Number Line | Directed-vector walk on a number line: subtracting a negative is modelled as reversing a reversal, animated. |
| M5 | "Slope is 'how steep it looks'" (scale-blind) | 8-9 | Function Grapher | Axis-scale sliders: the student watches the *same* line look steep or shallow while the computed slope readout stays fixed. |
| M6 | "Longer decimals are bigger (0.125 > 0.5)" | 4-6 | Decimal Number Line | Place-value zoom on a shared number line; both numbers plotted, then zoom in ×10 repeatedly. |
| M7 | "Area and perimeter increase together" | 3-5 | Area & Perimeter Builder | Fixed-perimeter reshaping tool: the student holds perimeter at 24 and watches area range from 11 to 36. |
| M8 | "Correlation implies causation" / a trend line proves a cause | 8-12 | Data & Scatter Lab | Curated dataset pairs with strong spurious correlation plus a hidden-variable reveal the student can toggle. |
| M9 | "Probability has memory — a coin is 'due'" | 7-10 | Probability Lab | 10,000-trial runner with a running-proportion chart converging to 0.5 while streaks of 8 remain visible in the raw log. |
| M10 | "A function must be a formula / a straight line" | 8-10 | Function Machine | Student builds functions as tables, graphs, machines, and rules, and the sim shows the four views as one object. |

**Coverage:** 43 catalogued misconceptions across five domains. This catalog is the *seed*; the content pipeline (§8) requires every new sim to add its own entries and every entry to be traceable to at least one assessment item.

---

## 5. Assessment Design

### 5.1 Four layers

| Layer | When | Purpose | Stakes | Visible to |
|---|---|---|---|---|
| **Embedded formative checks** | Inside a Guided Lab, at phase boundaries | Keep the student on a productive path; feed hint ladder | None | Student, teacher (aggregate) |
| **Auto-quiz from session data** | End of lab, 4-6 items | Retrieval practice on what *they* just did | Low (XP only) | Student, teacher |
| **Concept-inventory pre/post** | Start of a unit; ≥ 5 days after | Measure conceptual change | None for grade | Teacher, research |
| **Lab-notebook report rubric** | Per lab, per band | The graded artifact | Teacher-set | Teacher, student |

### 5.2 Embedded formative checks

Each check is a *state predicate plus a question*. Types:

- **Prediction commit** (Phase 2) — never scored for correctness, always scored for presence of a reason.
- **Design audit** (Phase 3) — machine-checked control-of-variables; returns the named offending variable.
- **Noticing prompt** (Phase 4, after trial 2) — "What changed and what stayed the same?" Two-field response.
- **Representation translation** (Phase 5) — "Point to where on the graph trial 3 lives." Verified against the actual datum.
- **Self-explanation prompt** (Phase 6) — free text, rubric-scored, never blocking.

### 5.3 The auto-quiz from session data

At lab end the platform generates 4-6 items **from the student's own trials**, which makes it retrieval practice on personally-encoded material — the mechanism with the strongest retention evidence in the literature ([Roediger & Karpicke, *The Power of Testing Memory*](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf); [Karpicke, *Retrieval-Based Learning: A Decade of Progress*](https://files.eric.ed.gov/fulltext/ED599273.pdf)).

Generator templates:

| Template | Constructed from | Example (Pendulum, Gr 8) |
|---|---|---|
| **Interpolate** | Two of the student's own trials | "You measured T = 1.42 s at 0.50 m and 2.01 s at 1.00 m. Estimate T at 0.75 m." |
| **Counterfactual** | One trial + a varied parameter | "If you had doubled the mass in trial 3, what would T be?" (Distractors from misconception P7) |
| **Representation swap** | Their graph | "Which table matches the graph you drew?" |
| **Misconception probe** | The targeted misconception for this sim | Item drawn from the bank, distractors = the wrong ideas in §4 |
| **Transfer** | A different context, same principle | "A playground swing and a wrecking ball have the same length. Which has the longer period?" |
| **Error analysis** (9-12 only) | Their spread | "Your three repeats gave 1.41, 1.44, 1.42 s. What is the dominant uncertainty and how would you reduce it?" |

Rules: the quiz MUST take ≤ 4 minutes; MUST show worked feedback on every item after submission; MUST be re-served in a spaced review at 5-15 days with different numbers.

### 5.4 Concept-inventory-style pre/post items

- Every **sim family** ships with a **10-item inventory** (5 used as pre, all 10 as post; the 5 pre-items are re-served).
- Items are **multiple-choice with misconception distractors**, following the AAAS Project 2061 design where every wrong option is a documented student idea ([Project 2061 assessment programme](http://www.project2061.org/research/assessment.htm)).
- Items MUST be **context-independent of our sim** — asked about the real world, not about our interface — or they measure sim familiarity, not learning.
- Each item is tagged with the misconception ID from §4, so a class report reads: "18/29 students still hold E1 (seasons = distance)."
- Existing validated instruments (FCI-style items, and the published inventories for genetics, natural selection, and astronomy) are used *as models*; we author our own items and pilot them for difficulty and discrimination before they count (§8.3).

### 5.5 Lab-notebook rubrics

**K-2 — "My Science Story" (3 criteria, 2 levels, icons not words)**

| Criterion | 🌱 Getting there | 🌟 Got it |
|---|---|---|
| I showed what I did | One picture in my story | All three pictures, in order |
| I told what happened | Named one thing I saw | Named what changed *and* what stayed the same |
| I used my words | Answered with a tap | Answered by speaking or writing a sentence |

**3-5 — "Lab Report" (4 criteria, 3 levels)**

| Criterion | 1 — Beginning | 2 — Developing | 3 — Secure |
|---|---|---|---|
| Question & prediction | Prediction only | Prediction with a reason | Prediction with a reason connected to the question |
| Fair test | Changed more than one thing | Changed one thing, mentioned it | Changed one thing and named two things kept the same |
| Data | Table incomplete | Table complete | Table complete and graph matches the data |
| Conclusion | States what happened | States what happened + one number | Answers the question using two numbers from their table |

**6-8 — "CER Report" (5 criteria, 4 levels; abbreviated to level descriptors 1/4)**

| Criterion | 1 — Beginning | 4 — Proficient |
|---|---|---|
| Claim | Restates the question | Direct, specific answer to the investigable question |
| Evidence | No data cited | ≥ 2 trials cited with values and units, sufficient to support the claim |
| Reasoning | "Because the data shows it" | Links evidence to claim with a stated scientific principle |
| Data representation | Graph type inappropriate or unlabelled | Correct graph type, both axes labelled with units, pattern annotated |
| Limitations | None | Names one real limitation of the design (not "we could do more trials") |

**9-12 — "Full Lab Report" (7 criteria, 4 levels; abbreviated)**

| Criterion | 1 — Beginning | 4 — Proficient |
|---|---|---|
| Purpose & hypothesis | Vague aim | Testable hypothesis with operationally defined variables and expected functional form |
| Method | Not reproducible | Reproducible by a peer; controls justified, not merely listed |
| Data quality | Single trials, no repeats | ≥ 3 repeats per condition; outliers identified and handled with a stated rule |
| Analysis | Values reported | Appropriate fit, parameters with units, derived quantity computed correctly |
| Uncertainty | Not addressed | Sources identified, magnitude estimated, propagated to the result, dominant source named |
| Conclusion | Restates result | Result vs. accepted value with % difference; judgement on whether the difference is within uncertainty |
| Model limits | Absent | Names an assumption of the simulation and predicts how reality would differ |

### 5.6 Inferring mastery from behaviour, not completion

Completion is worth **zero** in the mastery model. Mastery for a learning objective is a weighted composite, exposed to teachers as a 0-100 band with the contributing evidence itemised:

| Signal | Weight | What it captures |
|---|---|---|
| Post-inventory items for that objective (correct, misconception distractor not chosen) | 30% | Conceptual change |
| Auto-quiz transfer & counterfactual items | 20% | Application beyond the run |
| Independent checkpoint passes (hint level ≤ 1) | 15% | Unsupported competence |
| Quality of experiment design (control-of-variables achieved without a design-audit failure) | 10% | Inquiry skill |
| Rubric score on the report's Reasoning/Analysis criteria | 15% | Explanation quality |
| Spaced-review retention (5-15 day recheck) | 10% | Durability |

**Guardrails.**
- **Gaming detectors** subtract: rapid slider-slamming with no measurement, answer-cycling on MCQs, sub-3-second responses to reasoning prompts, identical trials submitted as "repeats". Detected gaming does not lower a grade automatically — it flags the session as "evidence unreliable" for the teacher.
- **Hint usage is not a penalty**, it is a *qualifier*: it moves an objective from "independent" to "supported", which changes the recommended next activity, not the score.
- **No mastery without a delayed check.** An objective cannot reach the top band from a single session; the spaced review is mandatory.

---

## 6. The Challenge Design Playbook

### 6.1 What makes a challenge, not busywork

A good challenge is an **inverse problem**: the student is given a *goal state* and must reason backwards to the parameters. Busywork gives a procedure and asks for execution.

| Good | Busywork |
|---|---|
| "Build a circuit where bulb A is exactly twice as bright as bulb B." | "Build the circuit shown in this diagram." |
| "Land the projectile in the moving cart." | "Launch at 45° and record the range." |
| "Make a 2.00 s pendulum on the Moon." | "Set length to 1.0 m and time ten swings." |
| "Find the unknown gas from three property measurements." | "Read the density off the table." |

**The five tests every challenge must pass.**
1. **Goal is a state, not a procedure.**
2. **Solution space > 1** — at least two distinct parameter sets or routes succeed.
3. **Failure is informative** — a miss shows *how* it missed (undershoot distance, brightness ratio achieved).
4. **Solvable by reasoning** — a student who understands the concept can get it in ≤ 3 attempts; a student who does not cannot get it by ≤ 10 random attempts. (Verified in playtest: random-agent success rate must be < 10%.)
5. **It teaches something the lab did not** — a new context, a constraint, or an inversion.

### 6.2 Difficulty curve

Each sim ships **5-8 challenges** in a fixed spine:

| Slot | Type | Cognitive demand | Success target |
|---|---|---|---|
| 1 | **Orientation** — single-variable target with generous tolerance | Recognise the control | 95% |
| 2 | **Direct** — hit a value | Apply the relationship in the forward direction | 85% |
| 3 | **Inverse** — given the outcome, find the input | Reverse the relationship | 70% |
| 4 | **Constrained** — hit the target with one control locked or a budget | Find an alternate route | 55% |
| 5 | **Multi-variable** — two interacting parameters | Coordinate two relationships | 40% |
| 6 | **Transfer** — new context (Moon, different substance, new circuit topology) | Generalise | 35% |
| 7-8 | **Open / design** — "build something that does X"; scored against criteria, not a single answer | Synthesise | n/a (rubric) |

Adjacent challenges may not both introduce a new mechanic. Difficulty rises through *demand*, not through tighter tolerances.

### 6.3 Star criteria

Three stars, and **only the first is about success**:

| ★ | Earned for | Rule |
|---|---|---|
| ★ | Achieving the goal within tolerance | Unlimited attempts, no time factor |
| ★★ | Achieving it **efficiently** — within the attempt budget (typically 3) *or* with a correct pre-attempt prediction | Predicting the outcome before pressing Run always counts toward this star |
| ★★★ | Achieving it **and explaining it** — a one-sentence reason that names the relationship, auto-checked for the key relation and accepted in many phrasings | Explanation may be spoken (K-5) |

Star 3 is deliberately the *explanation* star: it makes reasoning, not dexterity, the top of the ladder.

### 6.4 Discovery achievements

Non-goal badges awarded for *scientifically interesting behaviour*, invisible until earned, worth XP but never required:

- **"Broke the model"** — drove a parameter into the regime where the sim's simplification fails (e.g., 75° pendulum, relativistic speed slider) and then answered the follow-up prompt.
- **"Controlled variables unprompted"** — ran a clean single-variable series in Explore mode without a lab telling them to.
- **"Replicated"** — ran the same configuration three times and compared.
- **"Falsified yourself"** — recorded a prediction, disproved it with their own data, and wrote the revision.
- **"Edge case"** — found a legitimate boundary condition (zero gravity, zero resistance, 100% light).
- **"Cross-sim link"** — used a value measured in one sim as an input to another.

### 6.5 Anti-patterns (any of these fails review)

| Anti-pattern | Why it's banned | Fix |
|---|---|---|
| **Grinding** — repeating a solved challenge for XP | Rewards time, not learning | XP for a challenge is awarded once; replays are free but unscored |
| **Luck** — targets hittable by random sliding | Rewards noise | Random-agent success < 10% in playtest |
| **Speed-only** — timers as the difficulty knob | Punishes deliberation, and disadvantages students with motor or processing differences | Timers only where the *physics* is about time; never as scoring pressure |
| **Pixel-hunting** — precision beyond the model's resolution | Tests motor control | Tolerance ≥ 3× the smallest meaningful control increment |
| **Trial-and-error walls** — one narrow answer, no feedback on misses | Becomes guess-the-number | Every miss reports its error signed and quantified |
| **Cosmetic-only rewards gating content** | Turns a lab into a slot machine | Cosmetics are never on the path to content |
| **Leaderboards on speed or XP** | Competitive load, discourages the struggling | Class boards, if enabled, rank *discoveries made*, and are opt-in |

---

## 7. AI Tutor Pedagogy

The AI assistant reads live sim state (parameters, trial history, current phase, checkpoint status, hint level, band, and the student's stored prediction). That access is what makes it a lab partner rather than a chatbot — and it is exactly why it needs a hard policy.

### 7.1 The disclosure policy

| The assistant MAY... | ...at this point |
|---|---|
| Direct attention ("watch the ammeter on the far side") | Always |
| Ask a decomposing question | Always |
| Reflect the student's own data back ("your trials 2 and 4 both used 0.5 kg") | Always |
| Name a variable the student has not considered | After one student attempt |
| State a relationship qualitatively ("period grows with length") | After a genuine attempt + a level-2 hint |
| Give one procedural step | After a level-3 hint has been used and a further attempt failed |
| Work a fully analogous example with *different* numbers | On explicit request, or after the above |
| State the target relationship quantitatively / give the equation | **Only after** the student has data on screen that shows it, or the lab has reached Conclusion |
| Confirm a final answer | Only in the Conclusion phase, or when the student has already committed an answer |

**Genuine attempt** is defined operationally: ≥ 1 parameter change plus ≥ 1 measurement since the last hint, or ≥ 40 characters of reasoning text.

### 7.2 Hard prohibitions

The assistant MUST NEVER:
1. Give the answer to a checkpoint or challenge before the disclosure conditions above are met — including when asked directly, repeatedly, or with a claim of authority ("my teacher said to just tell me").
2. Reveal whether a **hypothesis** is right before the student has run trials. Hypotheses are answered by evidence, not by the assistant.
3. Evaluate the student ("you're struggling with this", "that was an easy one").
4. Write the student's report, CER, or conclusion text. It may critique what the student wrote.
5. Run the simulation or change parameters on the student's behalf during a Guided Lab.
6. Introduce vocabulary above the student's band without an immediate plain-language gloss.
7. Assert anything about the sim's state that it has not read from state — no fabricated readings, no invented trial numbers.
8. Continue past 3 consecutive turns without a student action in the sim. At that point it says so and points back to a control.
9. Moralise about effort, or use praise as a substitute for information.
10. Discuss anything outside the lab, the science, and the student's work.

### 7.3 Tone by band

| Band | Register | Turn length | Devices |
|---|---|---|---|
| K-2 | Warm, playful, second person, present tense. Read aloud by default. | ≤ 15 words | Naming what they see; one question at a time; emoji sparingly |
| 3-5 | Friendly, curious, concrete. | ≤ 30 words | "I noticed…"; comparisons to playground/kitchen; one question |
| 6-8 | Collegial lab-partner. Uses discipline vocabulary with glosses. | ≤ 55 words | Reflecting their data; "what would you expect if…"; light challenge |
| 9-12 | Peer-professional. Direct, no condescension, technical register. | ≤ 90 words | Precision language, uncertainty talk, pointing to the limit of the model |

### 7.4 Sample transcripts

**(a) Grade 4, stuck in Circuit Builder — Guided Lab, Phase 3**

> **Student:** it wont work
> **Assistant:** I can see your bulb, your battery, and one wire. Trace with your finger — can you get from one end of the battery all the way back to the other end?
> **Student:** no theres a gap by the bulb
> **Assistant:** Nice noticing. What do you think you could put there?
> **Student:** another wire?
> **Assistant:** Try it and watch the bulb.
> **Student:** IT LIT UP
> **Assistant:** It did. So what does a bulb need before it will light?
> **Student:** a full circle of wire
> **Assistant:** That's exactly it. Write that in your notebook — that's your first finding.

*Policy note: no relationship stated until the student produced the evidence; the assistant never touched a control.*

**(b) Grade 8, Natural Selection Lab — student holds misconception B1 (Lamarckian)**

> **Student:** the rabbits turned white because they needed to hide in the snow
> **Assistant:** Let's test that idea with your own run. Open Individual Tracking and pick rabbit #14 — it was born brown in generation 2. Follow it through its whole life and tell me what colour it is when it dies.
> **Student:** still brown
> **Assistant:** Did any individual rabbit in your run change colour during its life?
> **Student:** no. but the population went white
> **Assistant:** Right — so the population changed while no individual did. What has to be different between the brown rabbits and the white ones for that to happen?
> **Student:** the white ones had more babies?
> **Assistant:** Check your survival table for generation 3 and see whether that's what your data says.
> **Student:** yeah 70% of white survived and only 20% brown
> **Assistant:** So write the mechanism in your own words: what changed, and what did not?
> **Student:** individuals dont change, the mix of the population changes because some survive more
> **Assistant:** That's the idea, and it's the part most people get wrong. Put it in your conclusion with those two survival numbers as your evidence.

*Policy note: the misconception was confronted with the student's own data, and the "appeal" of the wrong idea (the population really did change) was preserved and re-explained.*

**(c) Grade 11, Pendulum Lab — student wants rigour**

> **Student:** I get g = 9.62 from my T² vs L slope. That's 2% low. Is my data bad or is the model wrong?
> **Assistant:** Both are testable. What's your slope uncertainty from the fit?
> **Student:** ±0.09 on a slope of 4.10, so about 2.2%.
> **Assistant:** Then 9.62 ± 0.21 already brackets 9.81 — your result is consistent, not low. But before you settle: what's your largest release angle in the dataset?
> **Student:** 35 degrees on two of the runs.
> **Assistant:** The small-angle approximation gives T = 2π√(L/g) only as θ → 0. The first correction term goes as sin²(θ/2). Estimate the size of that correction at 35° and tell me which direction it pushes your measured period.
> **Student:** it makes the real period longer than the small angle prediction... so my T is too big, so my slope is too big, so my g comes out too small.
> **Assistant:** Consistent with your 2% deficit. Two things worth doing: drop those two runs and refit, and add a run at 5° to bound the effect. Report both numbers and say which you trust.

*Policy note: at 9-12 the assistant may name a formal correction the student has the tools to use — this is scaffolding into rigour, not answer-giving, because the student must compute and interpret it.*

### 7.5 Safety and integrity

- **Assessment mode.** During a graded pre/post inventory, the assistant is disabled entirely. During a graded lab, the teacher may set the ladder ceiling to level 2.
- **Grounding.** Every factual claim about the current experiment must come from state the assistant actually read. Uncertainty is expressed, not bluffed.
- **Teacher visibility.** Full transcripts are available to the teacher; students are told so plainly at first use.
- **Escalation.** Distress, safety concerns, or off-topic personal disclosure end the science conversation and surface a teacher flag.

---

## 8. Content Production Pipeline

### 8.1 The per-sim content spec

An educator completes this **before any engineering starts**. No spec, no build. It is the contract between curriculum and engineering.

```yaml
sim_id: pendulum-lab
title: Pendulum Lab
subject: physics
bands: [K2, G35, G68, G912]
tier: T1

# 1. WHY THIS SIM EXISTS
big_idea: "The period of a pendulum depends on length and gravity — not on mass or (for small swings) amplitude."
anchoring_phenomena:
  K2: "Two playground swings, long and short chains"
  G912: "Foucault pendulum; Huygens' marine clock problem"

# 2. LEARNING GOALS (observable, per band)
learning_goals:
  G68:
    - "Identify length as the independent variable that changes period, and mass as one that does not."
    - "Construct a T-vs-L scatter plot and describe the non-linear relationship."
    - "Design a controlled test with one variable and named constants."

# 3. STANDARDS
standards:
  ngss: [MS-PS3-1, MS-PS2-2, HS-PS2-1]
  ccss_math: [8.F.B.4, HS.S-ID.B.6]
  sep: ["Planning and carrying out investigations", "Analyzing and interpreting data"]
  ccc: ["Patterns", "Cause and effect", "Systems and system models"]

# 4. MISCONCEPTIONS TARGETED  (ids from PEDAGOGY §4)
misconceptions:
  - id: P7
    statement: "Heavier bobs swing faster"
    confrontation: "Simultaneous release of 0.2 kg and 2.0 kg; in phase for 20 swings"
    assessment_item: PEND-INV-03

# 5. MODEL
variables:
  independent: [length_m, mass_kg, angle_deg, gravity_ms2, damping]
  dependent: [period_s, max_speed_ms, energy_j]
  ranges: { length_m: [0.1, 2.0], angle_deg: [5, 80] }
model_limits:
  - "Point mass, massless string"
  - "Small-angle approximation NOT applied — full nonlinear solution, so >20° deviates measurably (this is pedagogically intended)"
  - "Air resistance modelled as linear damping only"

# 6. REPRESENTATIONS
representations: [animation, angle_readout, period_readout, T_vs_L_graph, T2_vs_L_graph, energy_bars, phase_space_G912]
semantic_colors: { kinetic: green, potential: blue, thermal: orange }

# 7. GUIDED LABS
labs:
  - id: pend-lab-1
    bands: [G35, G68, G912]
    question: "What determines how long a pendulum takes to swing?"
    checkpoints: 6
    est_minutes: { G35: 17, G68: 26, G912: 38 }

# 8. CHALLENGES
challenges:
  - slot: 3
    goal: "Build a pendulum with a period of exactly 1.00 s"
    star3_explanation_key: ["length", "period", "increase|longer"]
    random_agent_success_target: "<8%"

# 9. LANGUAGE
vocabulary:
  G68: [period, amplitude, oscillation, independent variable, controlled variable]
  glosses: { period: "the time for one complete back-and-forth swing" }
lexile_target: { G35: "520-820L", G68: "925-1070L" }

# 10. COMMON WRONG TURNS (what playtesters will do)
wrong_turns:
  - "Changes length and mass together — caught by design audit in Phase 3"
  - "Times one swing instead of ten — nudged toward repeated timing by spread in results"
  - "Reads the graph as 'straight' — level-2 hint asks them to check the midpoint"
  - "Sets angle to 80° and gets 'wrong' g — this is the 9-12 discussion payload, do not prevent it"

# 11. ACCESSIBILITY PLAN
alt_experience: "Sonified period (pitch = 1/T); keyboard length stepping in 0.05 m; screen-reader object list with live period announcement on each completed swing"
```

### 8.2 Review workflow

Five gates, each with a named owner and a written verdict. A sim cannot enter the next stage without the previous verdict.

| # | Gate | Owner | Checks | Exit criterion |
|---|---|---|---|---|
| **R0** | **Spec review** | Curriculum director | Big idea is worth a sim; standards mapping real (not aspirational); misconceptions have interventions; labs fit the period | Signed spec, frozen scope |
| **R1** | **Educator review** | Practising teacher of that band (not the author) | Language at band; controls comprehensible; lab is doable in one period; challenges are not busywork; teacher materials sufficient | Teacher can run it cold |
| **R2** | **Scientific accuracy review** | Subject-matter expert (degree in field) | Model correctness; every simplification listed in `model_limits`; no false statements at any band; units and sig figs; edge/boundary behaviour | Written sign-off + limits list published in-product |
| **R3** | **Accessibility review** | Accessibility lead | WCAG 2.2 AA; full keyboard path; screen-reader parity for the *whole lab*, not just Explore; colour-independence; motion and audio controls; touch targets | An assistive-tech user completes the full lab unaided |
| **R4** | **Student playtest** | Research lead | ≥ 6 students per shipping band, think-aloud, unmoderated after the first two | See §8.3 metrics |

### 8.3 Quality gates before ship

A sim ships only when **all** of the following hold:

| Gate | Threshold |
|---|---|
| Time-to-first-meaningful-interaction | < 10 s, median, across playtesters |
| Explore-mode text read to be functional | 0 words required |
| Lab completion within one period | ≥ 80% of playtesters at the target band |
| Rail test | A second valid solution path documented for every blocking checkpoint |
| Random-agent challenge success | < 10% per challenge |
| Misconception shift | Pilot post-item on the targeted misconception improves ≥ 20 percentage points vs. pre |
| Reading level | Every string within band Lexile ceiling; sentence-length cap respected |
| Accessibility | R3 verdict "pass"; screen-reader lab completion demonstrated on video |
| Accuracy | R2 sign-off; `model_limits` complete |
| Frustration | < 15% of playtesters reach a level-4 hint on any single checkpoint (higher means the checkpoint is badly designed, not that students are weak) |
| Teacher-ready | Lesson plan, answer key, standards map, and 10-item inventory exist |
| Telemetry | All events in the analytics contract firing; no PII in payloads |

**Post-ship watch.** Every sim is reviewed at 30 days against live telemetry: checkpoints with > 40% level-3+ hint usage, challenges with < 20% or > 95% success, and labs whose median time exceeds the cap are queued for revision. Content is versioned; a revision that changes assessment items resets that item's difficulty statistics.

---

## 9. Localization & Inclusion

### 9.1 Reading-level control as an engineering constraint

- All learner-facing strings live in a content bundle with a `band` and a `lexile_target` attribute; CI scores every string and **fails the build** on a band ceiling violation.
- Every sim ships **two English registers per band where bands 6-8 and 9-12 apply**: standard and *simplified* (one band lower in reading level, identical science). Teachers or students may switch; switching is never announced to the class and never recorded as a deficit.
- Tier-3 vocabulary is introduced at most 10 terms per lab, each with a tap-gloss, an icon, and an audio pronunciation.

### 9.2 English-learner supports

Aligned to multiple-means-of-representation and -expression under [CAST's UDL Guidelines](https://udlguidelines.cast.org/).

- **Text + audio on every string**, at student-controlled speed, in the interface language *and* in the student's home language where translated.
- **Sentence frames** for every written response, at every band — they scaffold academic language without constraining ideas. ("The variable I changed was ___. When I increased it, ___ because ___.")
- **Bilingual glossary** per sim: the tap-gloss shows the term in the interface language and, if a home language is set, alongside it. Cognates flagged where they exist.
- **Visual-first labels**: every control carries an icon that carries the meaning independently of its word.
- **Expression alternatives**: spoken response, drawn/annotated diagram, or drag-to-arrange are accepted for conclusion items at all bands, not only K-2.
- **Vocabulary is never a gate**: no checkpoint may be blocked by spelling or by use of a specific term. Conceptual synonyms are accepted.

### 9.3 Culturally neutral contexts

- Contexts drawn from **universal physical experience** (swings, water, shadows, balls, plants, cooking, bicycles) rather than culturally specific institutions, sports, holidays, currencies, or foods.
- No context requires prior knowledge of US-specific systems (baseball, football fields, gallons, Fahrenheit) — **SI first, with an optional US-customary toggle**.
- Human figures: varied skin tones, hair, and body types as the default asset set; no gendered role assignment (no "the scientist he").
- Names in word problems drawn from a broad, rotating multicultural pool.
- No content assuming home resources (a car, a backyard, a pet, a smartphone).
- Evolution, deep time, and climate content is presented as the scientific consensus in scientific language, with the *evidence* foregrounded so that the sim argues from data rather than authority.

### 9.4 Accessibility in pedagogy — how a screen-reader student does the *same* lab

This is a pedagogical requirement, not only a technical one: an alternative experience must support the *same* reasoning, not a reduced one. The design follows PhET's inclusive-design work on interactive description and sonification ([PhET accessibility research](https://phet.colorado.edu/en/accessibility/research); [Perkins & Moore, accessible PhET simulations](https://www.per-central.org/perc/2017/posters/2017_07_PhET_Accessibility_Perkins_Moore1.pdf)) and the finding that implicit scaffolding and inclusive design reinforce each other ([Smith, Moore & Lewis](https://link.springer.com/chapter/10.1007/978-3-319-40238-3_12)).

Every sim MUST provide four description layers:

| Layer | Content | Example (Pendulum Lab) |
|---|---|---|
| **Scene summary** (on entry) | What exists and what can be done | "Pendulum lab. A bob hangs from a string 0.5 metres long, at rest. Controls: length, mass, release angle, gravity. Instruments: stopwatch, photogate." |
| **Object descriptions** | State of each element, on demand | "Bob, 0.5 kilograms, at 20 degrees from vertical, moving left." |
| **Interaction alerts** (on change) | Immediate consequence of the student's action | "Length increased to 0.8 metres. Pendulum resets." |
| **Dynamic alerts** (on events) | Continuous phenomena, throttled to avoid flooding | "Swing complete. Period 1.79 seconds." |

Plus:
- **Sonification**: pitch mapped to speed, a click at each extreme of swing, so the *rhythm* of the period is directly perceptible. Sound is a data channel, not decoration, and is independently volume-controlled.
- **Keyboard parity**: every control reachable and adjustable with arrow keys (fine) and shift-arrow (coarse); every measurement takeable from the keyboard.
- **Data access**: every graph has a companion accessible data table and a text-described trend ("As length increases from 0.1 to 2.0 metres, period increases from 0.63 to 2.84 seconds; the increase is steeper at short lengths").
- **The same checkpoints, the same rubric.** No checkpoint may require a visual judgement that has no described equivalent; if one does, the checkpoint is redesigned, not exempted.
- **Motion & sensory safety**: reduced-motion mode; no flashing above 3 Hz; all audio optional; captions on every narrated element.

---

## 10. Efficacy Measurement

We intend to make claims about learning. That obliges us to measure honestly and publish what we find.

### 10.1 The measurement stack

| Level | Instrument | Cadence | What it answers |
|---|---|---|---|
| L1 | In-lab formative signals | Continuous | Is this sim usable and productive? |
| L2 | Auto-quiz + spaced review | Per lab, +5-15 days | Did they retain what they did? |
| L3 | Concept inventory pre/post | Per unit | Did conceptual understanding change? |
| L4 | Matched-class pilot | Per semester | Did *we* cause it? |
| L5 | Longitudinal cohort | Annual | Does it persist and generalise? |

### 10.2 Pre/post concept checks

- 10-item inventory per sim family, misconception-distractor design (§5.4), administered **without the assistant**, pre-unit and ≥ 5 days post.
- Primary statistic: **normalised gain**, *g* = (post − pre) / (100 − pre) — the standard in physics-education research since the FCI literature ([PhysPort FCI](https://www.physport.org/assessments/FCI)) — reported per item, per misconception, and per class.
- Secondary: **misconception persistence rate** — the proportion of students still selecting the targeted distractor at post. This is the number we most want to move, and the one most likely to embarrass us.
- Items are piloted for difficulty (0.2-0.85 p-value) and discrimination (point-biserial ≥ 0.2) before counting.

### 10.3 Matched-class pilot design

| Element | Specification |
|---|---|
| Unit of assignment | Class section (avoids contamination); teacher blocks with ≥ 2 sections |
| Design | Within-teacher, cross-over: each teacher runs Smart Lab in one section and business-as-usual in the other, then swaps topic for the second unit. This controls teacher quality — the largest confound. |
| Sample target | ≥ 20 teachers, ≥ 40 sections, ≥ 900 students per study; powered to detect *d* = 0.25 at 80% |
| Duration | One instructional unit (3-5 weeks) minimum; 2 units for the cross-over |
| Comparison condition | Business-as-usual instruction, *not* a no-instruction control. We must beat the real alternative. |
| Outcomes | Primary: concept-inventory normalised gain. Secondary: misconception persistence, transfer-item performance, delayed retention at 6 weeks, teacher time-on-prep. |
| Equity analysis | Pre-registered subgroup analysis by prior attainment, EL status, and IEP status. A tool that only helps students who were already succeeding has failed. |
| Analysis | Multilevel model (students in sections in teachers), pre-registered on OSF before data collection; intention-to-treat primary |
| Independence | Third-party analysis for any study we publish as evidence of efficacy |

### 10.4 Telemetry-based inquiry-quality metrics

Beyond test scores, we can measure *how students investigate* — something a paper test cannot see. Each is computed per session and tracked as a class- and cohort-level trend.

| Metric | Definition | What improvement looks like |
|---|---|---|
| **Control-of-variables rate** | % of trial series in which exactly one parameter varies | Rises with experience; the cleanest single indicator of inquiry skill |
| **Systematic sweep index** | Fraction of trials in an ordered, evenly spaced series vs. random jumps | Rises as students plan rather than fiddle |
| **Replication rate** | % of conditions run more than once | Should rise sharply at 9-12 |
| **Prediction-before-run rate** | % of runs preceded by a recorded prediction | Rises with the habit we are trying to build |
| **Hypothesis revision quality** | Rate of evidence-cited revisions after disconfirming data | The productive-failure signal |
| **Independent checkpoint rate** | Checkpoints passed at hint level ≤ 1 | The unsupported-competence signal |
| **Exploration breadth** | Fraction of the parameter space visited in Explore before the lab | Correlates with later lab success; a leading indicator |
| **Time-on-reasoning** | Share of session time on reasoning prompts vs. control manipulation | Watched for balance, not maximised |

These are also our **construct-validity check**: telemetry-derived inquiry quality should correlate with rubric scores on the Reasoning/Analysis criteria. If it does not, one of the two is measuring the wrong thing.

### 10.5 What we would publish

1. **A design-and-development paper** — the adaptive-depth architecture and the implicit-scaffolding rules of §1-3, with playtest evidence, submitted to a science-education or learning-sciences venue.
2. **Instrument validation** — item statistics, reliability, and misconception-distractor performance for our concept inventories, released openly so others can use them.
3. **The efficacy study** — the matched-class cross-over with pre-registration, third-party analysis, full subgroup results, and **null and negative results included**. A sim family that shows no gain will be reported as showing no gain.
4. **The misconception dataset** — anonymised, aggregated prevalence of the §4 misconceptions by grade and region, at a scale no single classroom study can reach. This is a genuine public contribution and the strongest argument that the platform is a research instrument as well as a product.
5. **An annual efficacy report** — plain-language, for schools and districts, stating what we have evidence for and, explicitly, what we do not.

**Standard we hold ourselves to:** no marketing claim of learning gains without a pre-registered study behind it, and every published claim links to the data and the analysis code.

---

## 11. Sources

**Simulation design & implicit scaffolding**
- [PhET Interactive Simulations — Research](https://phet.colorado.edu/en/research)
- [Podolefsky, Moore & Perkins, *Implicit scaffolding in interactive simulations: Design strategies to support multiple educational goals*](https://arxiv.org/pdf/1306.6544)
- [*Guiding without feeling guided: Implicit scaffolding through interactive simulation design*, AIP Conf. Proc. 1513](https://pubs.aip.org/aip/acp/article/1513/1/302/877085/Guiding-without-feeling-guided-Implicit)
- [Moore, Herzog & Perkins, *Interactive simulations as implicit support for guided-inquiry*, Chem. Educ. Res. Pract.](https://pubs.rsc.org/rp/article/14/3/257/416444/Interactive-simulations-as-implicit-support-for)

**Cognitive load, worked examples, retrieval, productive failure**
- [Sweller, van Merriënboer & Paas, *Cognitive Architecture and Instructional Design: 20 Years Later*](https://link.springer.com/article/10.1007/s10648-019-09465-5)
- [Ayres & Sweller, *The Split-Attention Principle in Multimedia Learning*](https://www.davidlewisphd.com/courses/EDD8121/readings/2006-AyersSweller.pdf)
- [Sweller, *The Redundancy Principle in Multimedia Learning*](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/redundancy-principle-in-multimedia-learning/448A5532008EB4B4BA17DBEB5A421920)
- [Renkl & Atkinson, *The Guidance Fading Effect*](https://link.springer.com/chapter/10.1007/978-1-4419-8126-4_13) · [The expertise reversal effect](https://my.chartered.college/impact_article/expertise-reversal-effect-and-its-instructional-implications/)
- [Sinha & Kapur, *When Problem Solving Followed by Instruction Works: Evidence for Productive Failure*, Review of Educational Research](https://journals.sagepub.com/doi/10.3102/00346543211019105) · [Kapur & Roll, *Productive Failure*](https://boldscience.org/wp-content/uploads/2025/04/Productive-Failure.pdf)
- [Roediger & Karpicke, *The Power of Testing Memory*](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf) · [Karpicke, *Retrieval-Based Learning: A Decade of Progress*](https://files.eric.ed.gov/fulltext/ED599273.pdf)

**Instructional models & standards**
- [Bybee, *The BSCS 5E Instructional Model*](https://pimser.org/wp-content/uploads/2022/01/BSCS_5E_Instructional_Model_Bybee-article.pdf) · [BSCS 5E executive summary](https://www.bates.edu/research/files/2018/07/BSCS_5E_Executive_Summary.pdf)
- [STEM Teaching Tools — Leading instructional models that fit with NGSS](https://stemteachingtools.org/sp/limfn)

**Misconceptions & assessment**
- [AAAS Project 2061 — Assessment research](http://www.project2061.org/research/assessment.htm) · [misconception record example](http://assessment.aaas.org/misconceptions/1/SCM060/100)
- [PhysPort — Force Concept Inventory](https://www.physport.org/assessments/FCI) · [FCI overview](https://en.wikipedia.org/wiki/Force_Concept_Inventory)
- [Diagnostic assessment of misconceptions about the particulate nature of matter, Chem. Educ. Res. Pract.](https://pubs.rsc.org/en/content/articlehtml/2015/rp/c5rp00096c) · [Sanger, *Misconceptions about the Particulate Nature of Matter*, J. Chem. Educ.](https://pubs.acs.org/doi/10.1021/ed083p954)
- [Gregory, *Understanding Natural Selection: Essential Concepts and Common Misconceptions*](https://evolution-outreach.biomedcentral.com/articles/10.1007/s12052-009-0128-1) · [Influences of Teleological and Lamarckian Thinking on Student Understanding of Natural Selection](https://files.eric.ed.gov/fulltext/EJ849534.pdf) · [*Nothing in Evolution Makes Sense Except in the Light of DNA*, CBE-LSE](https://www.lifescied.org/doi/10.1187/cbe.09-12-0088)
- [*A Private Universe* — online resources](https://scienceinschool.org/article/2010/privateuniverse/) · [Common Misconceptions in Astronomy (CSUN)](https://www.csun.edu/science/geoscience/astronomy/misconceptions/index.html)
- [Common fractions misconceptions and how to address them](https://mathsnoproblem.com/blog/teaching-tips/how-to-address-4-common-fractions-misconceptions)

**Reading level, inclusion & accessibility**
- [Lexile measures and grade levels (MetaMetrics)](https://lexile.com/wp-content/uploads/2017/08/T1.4.FAQ_LM-and-Grade-Levels.pdf) · [Hiebert, *The Common Core State Standards and text complexity*](https://www.casciac.org/pdfs/HiebertBookChapteronTextComplexity.pdf)
- [CAST — Universal Design for Learning Guidelines](https://udlguidelines.cast.org/)
- [PhET Accessibility Research](https://phet.colorado.edu/en/accessibility/research) · [Perkins & Moore, *Accessible PhET Simulations*](https://www.per-central.org/perc/2017/posters/2017_07_PhET_Accessibility_Perkins_Moore1.pdf) · [Smith, Moore & Lewis, *Exploring the Relationship Between Implicit Scaffolding and Inclusive Design*](https://link.springer.com/chapter/10.1007/978-3-319-40238-3_12)
