# GradeNext Smart Lab — Simulation Experiment Book
## Grade 6 · Unit A · Systems and Subsystems

This package contains the complete simulation build specifications for every subtopic in this unit.

| File | Purpose |
|---|---|
| `G6_UnitA_Systems_and_Subsystems.pdf` | Typeset book. One specification per subtopic, each starting on a fresh page. For reading, review and sign-off. |
| `G6_UnitA_Systems_and_Subsystems.md` | The same content as Markdown. For editing, diffing, version control, and feeding to LLM training or RAG pipelines. |
| `G6_UnitA.json` | Machine-readable bundle. Every specification as a structured object with parsed control ranges, editable flags, scenario presets as key-value maps. For direct ingestion into the Smart Lab content pipeline and for model training. |
| `experiment-spec.schema.json` | JSON Schema (draft 2020-12) describing the bundle format. |

### Contents

**A1 · Systems and subsystems**
- `G6-A1.1` What makes a system a system — *Unplug the Aquarium* · Hybrid 2D+3D · Data-driven model (stock-and-flow) + Agent-based
- `G6-A1.2` Subsystems nested within systems — *The Bike Inside the Bike* · Hybrid 2D+3D · Rigid-body + State machine
- `G6-A1.3` Interactions among a system's parts — *Cut the Link, Cook the Tomatoes* · Hybrid 2D+3D · Data-driven model (system dynamics) + Fluid/thermal
- `G6-A1.4` Emergent properties — *No Bee Is In Charge* · 3D Scene · Agent-based
- `G6-A1.5` Systems across scales, from a cell to a planet — *From Chloroplast to Coastline* · 2.5D Layered · Data-driven model (coupled multi-scale) + Agent-based

**A2 · Boundaries, inputs and outputs**
- `G6-A2.1` Drawing a system's boundary — *Where You Draw the Line* · Hybrid 2D+3D · Data-driven model (flow network) + State machine
- `G6-A2.2` Open vs closed systems — *Three Jars, One Lamp* · 3D Scene · Data-driven model (mass and energy balance) + Fluid/thermal
- `G6-A2.3` Inputs and outputs — *On the Dyno: In One End, Out the Other* · Hybrid 2D+3D · Data-driven model (process balance) + State machine
- `G6-A2.4` Tracing matter and energy through a system — *Follow One Drop, Follow One Joule* · 2.5D Layered · Agent-based (tracer particles on a flow network) + Data-driven model
- `G6-A2.5` Choosing a boundary for a purpose — *The Zero-Emission Bus Argument* · Data Dashboard · Data-driven model + Agent-based

**A3 · Models of systems**
- `G6-A3.1` Why scientists build models — *The Experiment You Cannot Run* · Hybrid 2D+3D · Data-driven model + State machine
- `G6-A3.2` Diagrams and flowcharts as models — *The Diagram That Runs* · Hybrid 2D+3D · State machine + Agent-based
- `G6-A3.3` Physical and digital models — *Two Bays: The Warehouse and the Solver* · Hybrid 2D+3D · Fluid/thermal + Data-driven model
- `G6-A3.4` What a model leaves out on purpose — *The Model That Flattened the Sierra* · Hybrid 2D+3D · Data-driven model + Fluid/thermal
- `G6-A3.5` Building and revising a model of a system — *Three Versions of a Kelp Forest* · Hybrid 2D+3D · Data-driven model (stock-and-flow) + Agent-based

**A4 · Earth as a system**
- `G6-A4.1` The geosphere — *Peel the Planet: Reading the Rock Shells* · 3D Scene · Procedural geology + Ray/wave
- `G6-A4.2` The hydrosphere — *Ninety-Seven, Two, and a Splash* · Hybrid 2D+3D · Data-driven model + Particle system
- `G6-A4.3` The atmosphere — *Ride the Balloon to the Edge of Air* · 3D Scene · Fluid/thermal + Data-driven model
- `G6-A4.4` The biosphere — *The Living Skin: Painting Life onto Bare Rock* · Hybrid 2D+3D · Agent-based + Data-driven model
- `G6-A4.5` Interactions among Earth's four spheres — *Pull One Thread: The Four-Sphere Web* · 2.5D Layered · Data-driven model + Field/vector
- `G6-A4.6` Modeling an Earth-system event — *One Spark, Sixty Years: A Sierra Watershed* · Hybrid 2D+3D · State machine + Data-driven model + Particle system

**A5 · Investigation, measurement and evidence**
- `G6-A5.1` Lab safety and working like a scientist — *The Bench That Bites* · 3D Scene · State machine + Fluid/thermal
- `G6-A5.2` Variables and fair tests — *Four Chambers, One Question* · Hybrid 2D+3D · Data-driven model + State machine
- `G6-A5.3` SI units and measurement — *Read It Right: The Metrology Bench* · Hybrid 2D+3D · Rigid-body + State machine
- `G6-A5.4` Organizing and graphing data — *The Plotting Bench: Charts That Lie* · Data Dashboard · Data-driven model
- `G6-A5.5` Claim, evidence and reasoning — *Argument Bridge: The Delta Fish Kill* · Hybrid 2D+3D · Data-driven model + Rigid-body
- `G6-A5.6` Designing an investigation of a system — *Run My Plan: The Ecocolumn Trial* · Hybrid 2D+3D · Data-driven model + State machine

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
