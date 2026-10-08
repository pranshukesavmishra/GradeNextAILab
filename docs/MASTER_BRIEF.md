# Master brief — GradeNext Smart Lab, full end-to-end rebuild

This is the founder's governing instruction for the project, recorded verbatim
in intent. Every agent, every phase and every acceptance decision answers to
it. Read it before touching anything.

## Primary objective

Rebuild the platform so that for **every** simulation the answer is yes to:

> Can a teacher actually use this simulation to demonstrate a concept to a
> student, and can the student independently manipulate the experiment,
> observe a real model-driven result, measure it, repeat the experiment,
> inspect the data, and understand WHY the result occurred?

If no, that simulation is NOT COMPLETE.

- **BAD** — static image + labels + little movement + decorative particles +
  fake counters + preset animation + quiz questions.
- **ACCEPTABLE** — a real computational model in which meaningful input
  changes produce measurable changes in the simulated system.
- **EXCELLENT** — real model + high-quality scientific visualization +
  instruments + live measurements + graphs + experiment workflow +
  replay/reset + guided pedagogy + challenge mode + data collection +
  explainable model behaviour + performance + accessibility + automated tests.

**The target is EXCELLENT.**

## Absolute non-negotiable rule

Never substitute for a real simulation: a static image with labels, decorative
SVG motion, CSS-only fake physics, looping animation, randomly moving
particles that represent no model, counters that change without causal
relation to the system, manually scripted graph lines, hard-coded answers
pretending to be measurements, a "simulate" button that swaps a picture,
moving arrows without vector computation, collision effects without momentum
calculation, molecule movement without particle state, circuit current
without circuit solving, ecosystems without population dynamics, waves
without propagation, orbit trails without gravitational dynamics.

For every visual element ask: **what model variable controls this?** If none,
it is decorative — remove or redesign it.

## What a real simulation is

A. **Causal model** — inputs alter the computational state.
B. **Dynamic state** — objects, particles, fields, agents, waves, organisms
   have evolving state.
C. **Time** — play, pause, step, slow motion, reset, replay, time readout.
D. **Measurements** — instruments: ruler, stopwatch, thermometer, voltmeter,
   ammeter, balance, spring scale, pressure gauge, pH probe, protractor,
   graph probe, coordinate probe. Placed by the student, reading the model.
E. **Data** — trials recorded: trial number, inputs, measured outputs,
   derived values. Add, delete, reset, repeat, graph columns, export.
F. **Graphs** — from actual simulation data. Multiple series, units, grid,
   tooltips, point selection, trend lines, real-time, synchronised with the
   table.
G. **Repeatability** — multiple trials.
H. **Scientific interpretation** — students infer relationships; the
   simulation does not merely reveal the answer.
I. **Model transparency** — phenomenon / vector / particle / graph /
   equation / measurement views, gated by grade so younger students are not
   overwhelmed.

## Architecture: a shared platform, not 500 one-offs

Reusable engines, each with automated tests:

| Engine | Powers |
|---|---|
| Mechanics | forces, Newton's laws, projectiles, friction, inclines, collisions, momentum, circular motion, springs, pendulum, work & power, simple machines |
| Orbital / gravity | gravity, orbits, Kepler, escape velocity, solar system |
| Wave | wave machine, sound, ripple tank, interference, diffraction, standing waves, signals |
| Optics / ray | mirrors, lenses, shadows, colour, vision |
| Circuit | real circuit solving: battery, resistor, lamp, switch, capacitor, motor; V, I, R, P; series/parallel; instruments; faults |
| Particle / matter | states of matter, gas laws, dissolving, diffusion, heat transfer, density, fluids, pressure |
| Chemical reaction | rates, collision theory, stoichiometry, equilibrium, acid-base, titration, calorimetry, electrochemistry — macroscopic + particle + symbolic views |
| Biology agent / process | ecosystems, food webs, natural selection, populations, epidemics, pollination, plant growth, genetics, enzymes |
| Cellular / molecular | cell, division, membrane transport, DNA→RNA→protein, photosynthesis, respiration |
| Earth / environmental | water cycle, erosion, weather, climate, greenhouse, volcanoes, earthquakes, plate tectonics, rock cycle — time-accelerated causal models |
| Mathematics labs | fractions, geometry, functions, probability (seeded trials), calculus, vectors — synchronised representations |
| Engineering | design → load → stress → failure → redesign loops |

Pipeline, with one authoritative state:

    INPUTS → MODEL → STATE → RENDERER → MEASUREMENTS → DATA → GRAPHS → NOTEBOOK

Model ≠ rendering ≠ controls ≠ data ≠ graphing. A model is testable without
rendering. Fixed timestep, deterministic, seeded. Reset truly resets.
Versioned state. One engine per concept, grade-adapted interface.

Shared components: control panel, canvas, instrument tray, graph, data table,
equation display, units, reset/replay/step/slow, instructions, hints,
observations, conclusion, challenge objectives, accessibility, grade
simplification.

## Three modes, plus teacher mode

1. **Explore** — free manipulation.
2. **Guided lab** — observe → predict → change one variable → run → measure →
   record → repeat → graph → analyse → conclude.
3. **Challenge** — a goal solved through the simulation.

Teacher mode: set parameters, demonstrate, pause, step, slow, point,
reset, reveal equations, show graphs and instructions; advanced parameters,
assumptions and reference values in the teacher view.

## Quality bars

- **Visualization** — the phenomenon occupies the centre; vectors, fields,
  particles, rays, trajectories, cross-sections, graphs, measurement
  overlays, labels, units, scale. Images are context, never the model.
- **Explicit assumptions** — say where the model is simplified.
- **Conservation tracked** where appropriate (energy, momentum, mass, charge,
  particle count), with losses explicit.
- **No error states** — no NaN, Infinity, undefined, impossible values, dead
  buttons, hung loops. Validate and clamp.
- **Responsive** — desktop, tablet, mobile; touch designed intentionally.
- **Accessible** — keyboard, focus, labels, reduced motion, contrast,
  non-drag alternatives, graph summaries, alt text.
- **Performant** — school hardware; adaptive fidelity without changing the
  science.

## Acceptance gate — every production simulation

**Model:** defined; explicit state; meaningful parameters; correct equations.
**Interaction:** meaningful inputs; inputs alter state; output changes
causally. **Visualization:** phenomenon obvious; behaviour meaningful; labels
and units readable; visual synchronised with state. **Experimentation:**
prediction possible; run; repeat; reset; pause; step; replay.
**Measurement:** instruments; units. **Data:** trials; table; graph.
**Learning:** compare; infer; guided lab; challenge. **Technical:** tests;
determinism; error handling; accessibility; responsive; performance.

Plus the **anti-fake test**: change an independent variable, run, measure a
dependent one, repeat with a different value, record, plot, verify the graph
comes from the model, reset, repeat, verify reproducibility, verify the visual
is caused by the model. If any step is fake, hard-coded or disconnected, NOT
COMPLETE.

Plus the **teacher demo test** (could a teacher teach for 5–15 minutes with
only this?) and the **student lab test** (would a student keep experimenting
after one click?).

## Phases and order

1. **Audit** — authoritative inventory, architecture map, status matrix,
   dependency map, engine opportunities, debt, gaps, **count reconciliation**
   (stated vs named vs registered vs engine-backed vs animation-only vs
   duplicated). A machine-readable manifest becomes the single source of
   truth. Documentation and navigation must agree with the final count.
2. **Architecture** — manifest, model layer, runner, renderer, instruments,
   measurement API, data API, graph API, guided lab, challenge, replay/reset,
   seeds, versioned state, test framework.
3. **Flagships** — Projectile, Collisions, Forces, Energy, Waves, Optics,
   Circuits, Gas Laws, Ecosystem, Probability. These set the bar; existing
   good simulations are the benchmark and are preserved and upgraded, never
   flattened.
4. **Engine expansion** — reuse, never thirty variants of one idea.
5. **Full catalogue** — every topic: inspect, classify, design, model,
   implement, instrument, visualize, graph, test, visually QA, document, mark
   status. Never skip one silently.

Priority: physics sets the bar → chemistry and biology process models →
earth/space → mathematics → engineering. Nothing permanently postponed.

## Behaviour

Autonomous. Do not ask "should I continue". Stop only for genuinely blocking
ambiguity or destructive actions. Never compromise scientific integrity
silently; choose the least misleading defensible model and document the
assumption. No fake completion: a route, a button, a rendering canvas or a
beautiful UI is not "done". After each large build: tests, production build,
console, runtime, visual, interaction, reset, responsive, accessibility,
performance, documentation, navigation, registry/manifest consistency.

## Final report

Inventory (status, engine, model, interactions, measurements, graphs, lab,
challenge, tests, QA) · before/after classification per topic (real /
upgraded / new / interactive visualization / educational module / not
complete) · architecture · coverage. **Do not manipulate the numbers.**

## Definition of success

Not "a website showing pictures of science concepts." A digital laboratory
where a teacher opens a simulation, the student sees the system, a variable
changes, the system responds, the student predicts, they run it, measure,
repeat, the data appears, the graph updates, the relationship becomes visible,
and the student understands not only what happened but why.
