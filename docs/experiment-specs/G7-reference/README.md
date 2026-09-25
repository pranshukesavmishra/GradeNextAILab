# GradeNext Smart Lab — Simulation Experiment Book
## Grade 7 · Unit A · Atoms and the Structure of Matter

This package contains the complete simulation build specifications for every subtopic in this unit.

| File | Purpose |
|---|---|
| `G7_UnitA_Atoms_and_the_Structure_of_Matter.pdf` | Typeset book. One specification per subtopic, each starting on a fresh page. For reading, review and sign-off. |
| `G7_UnitA_Atoms_and_the_Structure_of_Matter.md` | The same content as Markdown. For editing, diffing, version control, and feeding to LLM training or RAG pipelines. |
| `G7_UnitA.json` | Machine-readable bundle. Every specification as a structured object with parsed control ranges, editable flags, scenario presets as key-value maps. For direct ingestion into the Smart Lab content pipeline and for model training. |
| `experiment-spec.schema.json` | JSON Schema (draft 2020-12) describing the bundle format. |

### Contents

**A1 · The particle model, refined**
- `G7-A1.1` Reviewing the particle model — *Three Cells, One Substance* · Hybrid 2D+3D · Particle system + Fluid/thermal
- `G7-A1.2` Why chemistry needs a sharper picture — *When the Simple Model Breaks* · Hybrid 2D+3D · Data-driven model + State machine
- `G7-A1.3` Evidence that particles are real — *Chasing the Invisible: The Smoke Cell* · Hybrid 2D+3D · Particle system
- `G7-A1.4` Particles versus atoms — *Split It Again: Atoms Inside Particles* · 3D Scene · Molecular
- `G7-A1.5` Scale of the atom — *Ten Steps Down: Finding the Atom* · 3D Scene · Procedural + Data-driven model

**A2 · Inside the atom**
- `G7-A2.1` Protons, neutrons and electrons — *Assembling an Atom, Piece by Piece* · 3D Scene · Particle system + State machine
- `G7-A2.2` Atomic number defines the element — *The Proton Count Decides* · Hybrid 2D+3D · State machine + Data-driven model
- `G7-A2.3` Mass number and isotopes — *Weighing Atoms: The Mass Spectrometer* · Hybrid 2D+3D · Field/vector + Data-driven model
- `G7-A2.4` Building the model — early evidence — *The Gold Foil Rig: Finding the Nucleus* · 3D Scene · Field/vector + Particle system
- `G7-A2.5` Building the model — from shells to a cloud — *Where Is the Electron, Really?* · Hybrid 2D+3D · Ray/wave + Particle system
- `G7-A2.6` Why the model kept changing — *Model Tournament: Five Atoms, Three Rigs* · Hybrid 2D+3D · State machine + Field/vector + Data-driven model

**A3 · Elements and the periodic table**
- `G7-A3.1` Reading a cell of the periodic table — *Open the Drawer: What One Cell Is Telling You* · Hybrid 2D+3D · Molecular + State machine
- `G7-A3.2` Groups and periods — *Columns That Behave Alike* · 3D Scene · Data-driven model + Molecular
- `G7-A3.3` Metals, non-metals and metalloids — *The Materials Testing Bench* · 3D Scene · Data-driven model + Rigid-body
- `G7-A3.4` Why the table is organized this way — *Mendeleev's Desk: Build the Table From Data* · 2.5D Layered · Data-driven model + State machine
- `G7-A3.5` Reactivity patterns across the table — *The Armoured Theatre: Measuring Vigour* · 3D Scene · Fluid/thermal + Particle system

**A4 · Molecules, compounds and formulas**  (MS-PS1-1)
- `G7-A4.1` Element, compound and mixture — *Twelve Jars and a Separation Bench* · 3D Scene · Particle system + State machine
- `G7-A4.2` Reading a chemical formula — *The Formula Translator* · Hybrid 2D+3D · State machine + Molecular
- `G7-A4.3` Subscripts versus coefficients — *Two Dials: One Rebuilds, One Copies* · 3D Scene · Molecular + State machine
- `G7-A4.4` Counting atoms in a formula — *The Sorting Hopper: Every Atom Accounted For* · 2.5D Layered · State machine + Particle system
- `G7-A4.5` Modeling a molecule from its formula — *The Build Bench: Make It Legal in Three Dimensions* · 3D Scene · Molecular

**A5 · Modeling extended structures**  (MS-PS1-1)
- `G7-A5.1` Ball-and-stick models — *Sticks and Spheres: Build by the Rules* · 3D Scene · Molecular
- `G7-A5.2` Space-filling models — *The Empty Space Is a Lie* · 3D Scene · Molecular
- `G7-A5.3` When there is no single molecule — *Find Me One Molecule* · 3D Scene · Molecular + Field/vector
- `G7-A5.4` Comparing molecular and lattice structures — *Two White Crystals, Four Tests* · Hybrid 2D+3D · Data-driven model + Fluid/thermal + Molecular
- `G7-A5.5` Choosing the right model for the job — *Fit for Purpose: Pick Your Model* · Hybrid 2D+3D · State machine + Molecular

### How each specification is structured
Every experiment has the same nine parts, in the same order, so a model trained on one unit generalises to all of them:

1. **Header fields** — experiment name, render mode, simulation engine, interaction level, session length, NGSS anchor
2. **Theme & scene** — what the student sees on load (art-directable prose)
3. **Objects & components** — every entity the engine instantiates, with build notes and editability
4. **How it works — the model** — governing rules, equations, rate laws, honest simplifications
5. **Control panel** — every control with widget, range, default, unit and effect
6. **Scenarios** — named presets that ask different questions of the same simulation
7. **Student activities** — numbered actions with what to record
8. **Outputs & measurement** — readouts, graphs, tables, badges
9. **What the student should realise** — the one idea, the misconception displaced

### Conventions for the model-training team
- Experiment IDs (`G6-B2.1`) are globally unique and stable.
- `objects[].editable` is a boolean; `objects[].edit_modes` lists the direct-manipulation verbs (drag, place, swap, resize, connect).
- `controls[].range` always has `raw`; numeric sliders additionally have `min`/`max`; enumerated widgets have `options[]`.
- `scenarios[].preset` is a key→value map using shortened control names; `preset_raw` preserves the original string.
- All prose is plain text with light Markdown emphasis only.

Specification standard v1.0 · GradeNext · 04 September 2026
