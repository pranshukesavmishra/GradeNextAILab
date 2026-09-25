# GradeNext Smart Lab · Simulation Experiment Book
## Grade 6 · Unit A · Systems and Subsystems

**California Integrated Science, Grade 6** · Domain: Science Practice / Systems Thinking · 5 topics · 27 experiments
**NGSS performance expectations anchored:** Supporting unit (feeds later PEs)
**Specification standard:** v1.0 · Assembled 04 September 2026

> **How to read this book.** Every subtopic in the GradeNext California Science syllabus has exactly one
> simulation experiment specification. Each specification is a *build order*: it tells a developer what to
> code, an artist what to model, and a curriculum designer what the student is meant to discover. Nothing here
> is a worksheet; every experiment is a running, manipulable scene with a control panel, more than one scenario,
> and something measurable coming out.

### Anatomy of a specification

| Section | What it is for | Who reads it first |
|---|---|---|
| **Header fields** | Experiment name, render mode, simulation engine, interaction level, session length, NGSS anchor | Product, curriculum |
| **Theme & scene** | What the student sees on load: setting, camera, palette, lighting, foreground/background, where the panel sits | Art, UX |
| **Objects & components** | Every entity the engine must instantiate, including invisible ones (fields, colliders, probes). Build notes give geometry, appearance, counts, behaviour. The *Editable* column says which objects the student can drag, place, swap, resize or connect directly | 3D/2D art, engine |
| **How it works — the model** | The rules the engine runs: equations, rate laws, state machines, datasets; what updates per tick; what is deliberately simplified and why | Engine, science review |
| **Control panel** | Every control with widget type, range or options, default, unit and visible effect. At least one control is *structural* (changes which objects exist or how they are arranged) | Engine, UI |
| **Scenarios** | Named presets that reconfigure the same simulation to ask a different question. Presets reference control names from the panel | Curriculum, QA |
| **Student activities** | Numbered actions the student performs and what they record | Curriculum |
| **Outputs & measurement** | Readouts, graphs, tables, badges the sim produces and when they update | Engine, UI, assessment |
| **What the student should realise** | The single idea, the misconception it displaces, and the sentence the student should be able to say | Curriculum, assessment |

### Glossary of tags

**Render mode** · *2D Canvas* — vector/sprite scene on a flat canvas, the mode of the existing collision and projectile sims · *3D Scene* — camera, lights, meshes and materials · *2.5D Layered* — parallax layers or cutaways with depth ordering but no free camera · *Hybrid 2D+3D* — a 3D viewport alongside a 2D graph, diagram or map panel · *Data Dashboard* — datasets, filters, plot canvases and claim-building tools as the primary scene.

**Simulation engine** · *Rigid-body* (masses, forces, collisions) · *Particle system* (many small agents with simple rules) · *Field/vector* (scalar or vector fields sampled in space) · *Molecular* (atoms, bonds, valence, CPK colouring) · *Agent-based* (organisms or entities with behaviours) · *Fluid/thermal* (heat flow, buoyancy, convection) · *Ray/wave* (light and sound propagation) · *Data-driven model* (real or realistic datasets driving the scene) · *State machine* (staged processes with transitions) · *Procedural geology* (layers, uplift, erosion, plate motion).

**Interaction level** · *Explore* (look, zoom, toggle overlays) · *Manipulate* (drag, place, swap objects) · *Investigate* (control variables, measure, record) · *Design* (build, test, score, iterate) · *Argue-from-data* (select evidence, build and score claims).

**Object class** · *Actor* (moves or acts) · *Structure* (static or slowly changing body) · *Particle* (instanced small entity) · *Field* (invisible spatial quantity) · *Instrument* (measures something) · *Overlay* (visual layer on top of the scene) · *Environment* (backdrop, terrain, container) · *UI-Probe* (cursor-following tool).

**Control widgets** · Slider · Stepper · Dropdown · Toggle · Radio · Colour · Dial · Drag-handle · Multi-select · Numeric field · Timeline scrubber.

### Engineering conventions

- **Experiment ID** is `G<grade>-<subtopic>` (for example `G6-B2.1`). It is stable and unique across the whole programme.
- **Scenario presets** use `control=value` pairs separated by semicolons. Control names in presets are shortened versions of the panel labels; the JSON companion resolves them.
- **Every control carries a unit.** Where a control is unitless the unit column reads "—".
- **The JSON companion** for this unit (`json/G<grade>_Unit<letter>.json`) contains every field of every specification in structured form, with numeric ranges parsed into `min`/`max` and option lists into `options[]`, ready for ingestion by the Smart Lab content pipeline.
- **Ages 11–14.** All simulated hazards are clearly virtual. No procedure here is a real-lab instruction.

### Unit map

| ID | Subtopic | Experiment | Render | Engine | Level | Session |
|---|---|---|---|---|---|---|
| A1.1 | What makes a system a system | Unplug the Aquarium | Hybrid 2D+3D | Data-driven model (stock-and-flow) + Agent-based | Investigate | 12–18 min |
| A1.2 | Subsystems nested within systems | The Bike Inside the Bike | Hybrid 2D+3D | Rigid-body + State machine | Investigate | 18–25 min |
| A1.3 | Interactions among a system's parts | Cut the Link, Cook the Tomatoes | Hybrid 2D+3D | Data-driven model (system dynamics) + Fluid/thermal | Investigate | 18–25 min |
| A1.4 | Emergent properties | No Bee Is In Charge | 3D Scene | Agent-based | Investigate | 18–25 min |
| A1.5 | Systems across scales, from a cell to a planet | From Chloroplast to Coastline | 2.5D Layered | Data-driven model (coupled multi-scale) + Agent-based | Investigate | 18–25 min |
| A2.1 | Drawing a system's boundary | Where You Draw the Line | Hybrid 2D+3D | Data-driven model (flow network) + State machine | Investigate | 12–18 min |
| A2.2 | Open vs closed systems | Three Jars, One Lamp | 3D Scene | Data-driven model (mass and energy balance) + Fluid/thermal | Investigate | 12–18 min |
| A2.3 | Inputs and outputs | On the Dyno: In One End, Out the Other | Hybrid 2D+3D | Data-driven model (process balance) + State machine | Investigate | 12–18 min |
| A2.4 | Tracing matter and energy through a system | Follow One Drop, Follow One Joule | 2.5D Layered | Agent-based (tracer particles on a flow network) + Data-driven model | Investigate | 18–25 min |
| A2.5 | Choosing a boundary for a purpose | The Zero-Emission Bus Argument | Data Dashboard | Data-driven model + Agent-based | Argue-from-data | 18–25 min |
| A3.1 | Why scientists build models | The Experiment You Cannot Run | Hybrid 2D+3D | Data-driven model + State machine | Investigate | 12–18 min |
| A3.2 | Diagrams and flowcharts as models | The Diagram That Runs | Hybrid 2D+3D | State machine + Agent-based | Design | 18–25 min |
| A3.3 | Physical and digital models | Two Bays: The Warehouse and the Solver | Hybrid 2D+3D | Fluid/thermal + Data-driven model | Investigate | 18–25 min |
| A3.4 | What a model leaves out on purpose | The Model That Flattened the Sierra | Hybrid 2D+3D | Data-driven model + Fluid/thermal | Argue-from-data | 18–25 min |
| A3.5 | Building and revising a model of a system | Three Versions of a Kelp Forest | Hybrid 2D+3D | Data-driven model (stock-and-flow) + Agent-based | Design | 18–25 min |
| A4.1 | The geosphere | Peel the Planet: Reading the Rock Shells | 3D Scene | Procedural geology + Ray/wave | Investigate | 18–25 min |
| A4.2 | The hydrosphere | Ninety-Seven, Two, and a Splash | Hybrid 2D+3D | Data-driven model + Particle system | Investigate | 18–25 min |
| A4.3 | The atmosphere | Ride the Balloon to the Edge of Air | 3D Scene | Fluid/thermal + Data-driven model | Investigate | 12–18 min |
| A4.4 | The biosphere | The Living Skin: Painting Life onto Bare Rock | Hybrid 2D+3D | Agent-based + Data-driven model | Design | 18–25 min |
| A4.5 | Interactions among Earth's four spheres | Pull One Thread: The Four-Sphere Web | 2.5D Layered | Data-driven model + Field/vector | Investigate | 12–18 min |
| A4.6 | Modeling an Earth-system event | One Spark, Sixty Years: A Sierra Watershed | Hybrid 2D+3D | State machine + Data-driven model + Particle system | Argue-from-data | 18–25 min |
| A5.1 | Lab safety and working like a scientist | The Bench That Bites | 3D Scene | State machine + Fluid/thermal | Investigate | 18–25 min |
| A5.2 | Variables and fair tests | Four Chambers, One Question | Hybrid 2D+3D | Data-driven model + State machine | Investigate | 18–25 min |
| A5.3 | SI units and measurement | Read It Right: The Metrology Bench | Hybrid 2D+3D | Rigid-body + State machine | Investigate | 18–25 min |
| A5.4 | Organizing and graphing data | The Plotting Bench: Charts That Lie | Data Dashboard | Data-driven model | Investigate | 18–25 min |
| A5.5 | Claim, evidence and reasoning | Argument Bridge: The Delta Fish Kill | Hybrid 2D+3D | Data-driven model + Rigid-body | Argue-from-data | 18–25 min |
| A5.6 | Designing an investigation of a system | Run My Plan: The Ecocolumn Trial | Hybrid 2D+3D | Data-driven model + State machine | Design | 18–25 min |

---

## A1 · Systems and subsystems

### A1.1 · What makes a system a system

**Experiment name:** Unplug the Aquarium  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model (stock-and-flow) + Agent-based  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-LS2-3

**Theme & scene.**
A 60-litre classroom aquarium at eye level against a plain slate wall, lit from above by one LED bar so the water throws slow caustics across the bench top. Six zebra danio hold station in the filter outflow; five ribbons of Vallisneria sway; the gravel is dark with biofilm. In the foreground, close enough to click, a four-way power strip with three plugged cables running up to the pump, the heater and the light. To the right of the glass, a translucent stock-and-flow overlay redraws the same aquarium as labelled tanks joined by pipes and valves: ammonia, nitrite, nitrate, dissolved oxygen, heat. On a second bench behind, deliberately unlit, the identical components lie loose in a tray. Control panel docks right; a dipping test probe follows the cursor.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Glass tank | Structure | 60×30×35 cm rim-polished box, 6 mm glass, refractive water volume filled to 32 cm, silicone seams visible at corners | No |
| 2 | Gravel bed and biofilm | Structure | 4 cm of 3 mm pea gravel, 40 % of the bacteria population lives here; surface darkens from buff to olive as biofilm stock rises | Yes: resize |
| 3 | Canister filter and pump | Actor | 20 cm cylinder under the bench, impeller spinning at 1200 rpm, intake strainer and spray-bar return; outflow jet drives a visible surface ripple | Yes: connect |
| 4 | Filter media cartridge | Structure | Removable basket holding a blue sponge block and 300 ceramic rings; carries 60 % of the nitrifying bacteria stock | Yes: swap |
| 5 | Heater rod | Actor | 25 cm glass tube, 100 W, suction-cupped to the rear glass, amber LED pulses when the element is on; thermostat with 0.5 °C hysteresis | Yes: connect |
| 6 | LED light bar | Actor | 55 cm alloy strip on the rim, 6500 K, dimmable, on a daily timer; drives plant photosynthesis rate | Yes: connect |
| 7 | Zebra danio | Actor | 3 cm agents, 6 by default, silver-blue with four dark stripes; shoaling steering behaviour, gill beat rate tied to dissolved oxygen, colour desaturates under stress | Yes: place |
| 8 | Vallisneria plants | Actor | 5 clumps of 25 cm ribbon leaves, jade, anchored in gravel; leaf count grows with nitrate and light; pearls oxygen bubbles when photosynthesising | Yes: place |
| 9 | Nitrifying bacteria colony | Field | Invisible population stock, split across media and gravel; doubling time 20 h, dies back without flow or oxygen; visualised only as biofilm darkening | No |
| 10 | Ammonia / nitrite / nitrate stocks | Field | Three invisible scalar stocks in mg/L, spatially uniform, drawn as filling tanks in the overlay | No |
| 11 | Dissolved oxygen field | Field | Invisible scalar, 0–10 mg/L, higher near the surface ripple and near pearling leaves | No |
| 12 | Water temperature field | Field | Invisible scalar with 4 h thermal inertia; relaxes toward 19 °C room temperature when the heater is unplugged | No |
| 13 | Power strip and cables | Instrument | Four-socket white strip, 3 plugs seated; pulling a plug animates the cable falling slack and cuts that device's flows to zero | Yes: connect |
| 14 | Dipping test probe | UI-Probe | Handheld wand; hovering over any point reads that point's ammonia, nitrite, nitrate, oxygen and temperature | Yes: drag |
| 15 | Stock-and-flow overlay | Overlay | Tanks, pipes and valve icons mirroring the live model; pipe width scales with flow rate, valves close to grey when a flow is zero | No |
| 16 | Loose parts tray | Structure | Second bench holding the same pump, heater, light, media, gravel, plants and fish jar, all unconnected; items can be dragged into the tank to assemble it | Yes: drag |

**How it works — the model.**
A true stock-and-flow engine runs at one tick per simulated minute. Stocks: ammonia, nitrite, nitrate, oxygen, heat, bacteria, plant biomass, fish health. Fish excrete ammonia at a rate proportional to biomass and feeding; uneaten food decays into ammonia over 8 h. Bacteria convert ammonia to nitrite and nitrite to nitrate at rate k·B·S/(S+Km), and B grows only where oxygenated water actually flows through media, so unplugging the pump both starves the colony and stops delivering substrate to it. Plants draw nitrate and release oxygen in light. Fish and bacteria consume oxygen continuously. Fish health falls when ammonia exceeds 0.25 mg/L or oxygen drops below 4 mg/L. The failure to avoid: the filter must never act as a magic life-support box that simply keeps fish alive. Every death has to be traceable along the chain, and in the loose-parts scenario every coupling coefficient is genuinely set to zero so the identical parts sit there doing nothing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Power strip | Multi-select | Pump / Heater / Light | Pump, Heater, Light | — | Which devices are connected; unplugging zeroes that device's flows |
| Filter media | Dropdown | Mature seeded media / New sterile sponge / None | Mature seeded media | — | Starting bacteria population, from full to zero |
| Heater setpoint | Slider | 18–30 | 25 | °C | Target water temperature and heater duty cycle |
| Light hours | Slider | 0–16 | 8 | h/day | Photosynthesis window, oxygen production, plant growth |
| Fish stocked | Stepper | 0–12 | 6 | count | Ammonia production rate and oxygen demand |
| Feeding rate | Slider | 0–4.0 | 1.5 | g/day | Ammonia input from waste and from uneaten food decay |
| Plants | Stepper | 0–10 | 5 | count | Nitrate uptake and daytime oxygen input |
| Weekly water change | Stepper | 0–50 | 25 | % volume | Dilutes every dissolved stock once per simulated week |
| Time compression | Dial | 1×–5000× | 1000× | — | Simulated days per real second |
| Overlay mode | Radio | Tank only / Stocks and flows / Both | Both | — | Whether the pipe-and-valve diagram is drawn over the scene |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A running tank | power=Pump, Heater, Light; media=Mature seeded media; fish=6; feeding=1.5 | Over 14 simulated days, which stocks stay steady and which cycle? Name three parts that affect each other. |
| S2 | Pull the plug | power=Heater, Light; media=Mature seeded media; fish=6 | The pump is unplugged and nothing else changes. Trace the chain from the dead impeller to the first stressed fish. |
| S3 | A heap of parts | power=none; media=None; fish=0; plants=0; loose parts tray in use | Every component is present on the bench and none is connected. Is this an aquarium? What exactly is missing? |
| S4 | New tank syndrome | media=New sterile sponge; fish=12; feeding=3.0; time=5000× | The filter is running from minute one. Why does ammonia still spike, and what has to grow before it falls? |

**Student activities.**
1. Run S1 for 14 simulated days. Record ammonia, nitrite, nitrate and oxygen on days 1, 7 and 14 with the dipping probe.
2. Unplug the pump and run again. Record the hour at which ammonia first crosses 0.25 mg/L, and the hour at which the first fish shows stress colour.
3. Rebuild from the loose parts tray: drag in the tank, gravel, media, pump, heater, light, plants and fish, plugging each cable as you go. Record the number of active flows in the overlay after each part you connect.
4. Set feeding to 4.0 g/day with plants at 0, then repeat with plants at 10. Compare nitrate on day 14 and say which part removed it.
5. Write down the three parts you would keep if you could keep only three, and run that configuration to test whether the tank survives 14 days.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Ammonia, nitrite, nitrate | Line graph | mg/L | Three traces on shared axes; the classic cycling curve emerges over 30 days |
| Dissolved oxygen | Live numeric | mg/L | Updated every simulated hour, sampled at the probe position |
| Water temperature | Live numeric | °C | Current value plus heater on/off state |
| Fish health index | Bar chart | 0–100 | One bar per fish, red below 40 |
| Active flows | Counter | count | Number of non-zero couplings between parts right now; reads 0 in the heap scenario |
| System check | Pass-fail badge | — | Green only when parts, connections and a maintained function are all present |
| Run log | Data table | mixed | Exportable CSV: one row per simulated hour, every stock and flow |

**What the student should realise.**
Students believe a system is a group of related things. The parts tray holds every component of a working aquarium and does nothing, while pulling one plug on the assembled tank kills fish that the pump never touched. Parts alone are a heap; parts plus interactions plus a maintained function are a system. The student should be able to say: *"It is not the parts that make it a system, it is that the parts do something to each other."*

### A1.2 · Subsystems nested within systems

**Experiment name:** The Bike Inside the Bike  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Rigid-body + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ETS1-4

**Theme & scene.**
A rider on a road bike climbing a bright, dusty canyon grade, framed dead side-on so the whole machine reads as a diagram. The bike is drawn X-ray: frame tubes ghosted to 30 % opacity so the chain, cassette teeth, cable housings, brake pads and hub bearings show through in hard-edged colour. Behind, the canyon wall scrolls; a gradient strip along the bottom shows where on the climb the rider is. Whichever subsystem is currently selected lifts into full opacity inside a soft cyan containment frame while everything else dims. A green power ribbon runs from the rider's legs through crank, chain, cassette, hub and tyre to the road, narrowing at each loss. Left of the scene, a collapsible system tree; control panel docked bottom-right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Frame and fork | Structure | 56 cm alloy diamond frame, 8 tubes modelled separately, ghosted; flexes 2 mm under peak pedal torque | No |
| 2 | Rider | Actor | Rigged cyclist, cadence-driven leg cycle 40–110 rpm, torso rocks above 250 W, head turns to check the road | Yes: swap |
| 3 | Crank, pedals and chainrings | Actor | 172.5 mm cranks, 50/34 T rings, teeth individually modelled; rotates with the chain, not independently | Yes: swap |
| 4 | Chain | Actor | 114 articulated links, steel grey, each pin a hinge constraint; sags 6 mm on the lower run, jumps sprockets on a shift | Yes: connect |
| 5 | Cassette and freehub | Actor | 11 sprockets 11–34 T, bronze wear shading on the most-used cogs; freehub ratchets audibly when coasting | Yes: swap |
| 6 | Rear derailleur and jockey wheels | Actor | Parallelogram cage, two 11 T jockey wheels, spring return; travels across the cassette on cable pull | Yes: place |
| 7 | Shift cable and housing | Structure | 1.1 mm stainless inner in a black outer, routed along the down tube; can be severed at any point along its run | Yes: connect |
| 8 | Brake lever and brake cable | Structure | Alloy lever with a 12 mm throw, 1.6 mm inner cable to the caliper; severing drops lever resistance to zero | Yes: connect |
| 9 | Caliper, pads and rim track | Actor | Dual-pivot caliper, two 55 mm pads; pad-to-rim gap 1.5 mm, glows orange with accumulated braking heat | Yes: swap |
| 10 | Wheel, tyre, spokes, hub | Structure | 700×28 C tyre on a 32-spoke wheel; hub broken out into cones, bearings, axle; one bearing can be set to seized | Yes: swap |
| 11 | Bearing friction field | Field | Invisible per-bearing coefficient set by grease state; feeds the drivetrain loss ladder | No |
| 12 | Road and gradient profile | Environment | 1 km climb, gradient editable per 100 m segment, chip-seal texture, heat shimmer at the top | Yes: drag |
| 13 | Power flow ribbon | Overlay | Ribbon from rider to contact patch, width ∝ watts, notched and narrowed at each loss point with a labelled figure | No |
| 14 | System tree panel | UI-Probe | Collapsible tree: Bicycle > Drivetrain / Braking / Steering / Wheels / Frame / Rider, each expanding to components and parts; components can be dragged between branches and are scored | Yes: drag |
| 15 | Containment frame | Overlay | Cyan rounded box drawn around the current selection, with a level label reading System, Subsystem, Component or Part | No |
| 16 | Failure propagation highlight | Overlay | When a part fails, every enclosing level that loses function pulses red in the tree, from the part upward | No |

**How it works — the model.**
Rigid-body drivetrain plus a nested state machine. Rider power P is split by a loss ladder: chain friction (1–4 % depending on lubrication), bearing drag (per-bearing coefficient), tyre rolling resistance (∝ 1/pressure), and air drag at ½ρCdAv². What remains accelerates a mass of rider plus bike against gravity component mg·sin θ, so speed on the grade follows from a simple power balance updated 60 times a second. Every component carries a state: healthy, worn, or failed. Failure propagates strictly upward through the containment tree, never sideways by magic: a seized rear hub bearing raises one friction coefficient, that raises drivetrain loss, that drops wheel power to near zero, and only then does the tree mark Bicycle as non-functional. Braking runs its own chain of lever travel, cable tension, pad force, friction coefficient and heat. Cutting the brake cable leaves 95 % of the machine perfectly healthy, which is exactly the point.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Zoom level | Radio | Whole bike / Subsystem / Component / Part | Whole bike | — | Camera framing and which level the containment frame encloses |
| Selected subsystem | Dropdown | Drivetrain / Braking / Steering / Wheels / Frame / Rider | Drivetrain | — | Which branch lifts to full opacity and gets its own readouts |
| Sever a link | Multi-select | Brake cable / Shift cable / Chain / Rear hub bearing / Three spokes | none | — | Sets that part to failed and starts upward propagation |
| Rider power | Slider | 40–350 | 120 | W | Power entering the drivetrain at the pedals |
| Gradient | Slider | −8 to +12 | 6 | % | Road slope over the current 100 m segment |
| Gear | Stepper | 1–11 | 6 | sprocket | Cassette sprocket selected, sets pedal-to-wheel ratio |
| Tyre pressure | Slider | 1.5–6.5 | 4.0 | bar | Rolling resistance and comfort; low pressure adds visible tyre squash |
| Brake pad condition | Dropdown | New / Worn / Glazed / Missing | New | — | Pad friction coefficient and therefore stopping distance |
| Chain lubrication | Slider | 0–100 | 70 | % | Chain friction loss, from 1 % to 4 % of rider power |
| Timed descent | Toggle | On / Off | Off | — | Runs a scored 1 km descent that requires the braking subsystem to work |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Healthy climb | power=180; gradient=6; gear=9; lubrication=70; sever=none | Expand the tree to four levels. How many parts sit below "Drivetrain", and what does the drivetrain do that no single part of it does? |
| S2 | Cut the brake cable | sever=Brake cable; descent=On; gradient=−8 | Every other part is healthy. Which levels of the tree turn red, and why does the whole bicycle count as failed? |
| S3 | One seized bearing | sever=Rear hub bearing; power=250; gradient=6 | A part four levels down has stopped. Follow the power ribbon and record where the 250 W is going instead. |
| S4 | Single-speed rebuild | sever=Shift cable; gear=6 fixed; drag derailleur out of the tree | Removing a whole subsystem still leaves a rideable bike. What can it no longer do, and on which gradient does that first matter? |

**Student activities.**
1. Expand the system tree fully and record the four levels for one named part, from the part up to the whole bicycle.
2. Set rider power to 180 W on a 6 % gradient and record the wattage at each notch of the power ribbon. Calculate how many watts never reach the road.
3. Sever the brake cable, run the timed descent, and record which tree levels turn red and which stay green.
4. Seize the rear hub bearing and record speed before and after. Then argue in one sentence whether a bearing is a system.
5. Drag the derailleur and shift cable out of the Drivetrain branch, re-run the climb at 12 % gradient, and record what the rider can no longer do.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Speed | Live numeric | km/h | Updated per frame, with the current gradient shown alongside |
| Power loss ladder | Bar chart | W | Stacked losses: chain, bearings, tyre, air, plus power delivered to the road |
| Stopping distance | Live numeric | m | From 30 km/h with the current pad and cable state; reads "no stopping" when severed |
| Tree health | Pass-fail badge | — | One badge per tree level, green or red, updating as failure propagates |
| Levels affected | Counter | count | How many tree levels a single part failure knocked out |
| Climb time | Timer | s | Time for the 1 km segment, logged per run |
| Run log | Data table | mixed | Exportable CSV: configuration, severed parts, losses, times |

**What the student should realise.**
Students treat "the system" as a fixed thing and its parts as merely smaller things. Here every level is a system in its own right: the drivetrain has its own inputs, outputs and failures, and the level you call "the system" is a choice you make for your question. A cut cable stops a 90 kilogram machine. The student should be able to say: *"Every part of this bike is itself made of parts, and a failure at any level climbs upward."*

### A1.3 · Interactions among a system's parts

**Experiment name:** Cut the Link, Cook the Tomatoes  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model (system dynamics) + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS3-4

**Theme & scene.**
Eleven in the morning in July inside a Central Valley polytunnel near Fresno. The camera looks down a row of 120 staked tomato plants, leaves backlit through 200-micron poly film, the far end of the tunnel dissolving into heat shimmer. Ridge vents crack open overhead on visible motor arms; a wet wall breathes at the far end with a slow fan; a shade cloth waits on a motorised roll; drip lines glisten at the root zone. Warm ochre and washed green, with hard white light. On the right, a dark 2D link board draws every component as a node and every interaction as a labelled arrow carrying a sign, a gain and a delay. Arrows can be clicked, cut, slowed or amplified. Control panel sits below the board.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Polytunnel shell | Structure | 30 m × 9 m hoop house, 14 galvanised hoops, 200 µm poly film transmitting 78 % of incident light and trapping long-wave heat | Yes: resize |
| 2 | Tomato plants | Actor | 120 staked agents at 45 cm spacing, leaf area 0.2–2.4 m² each, growing; leaves droop through four visible wilt stages, fruit trusses set above 18 °C | Yes: place |
| 3 | Ridge vent motors | Actor | Two 12 m vent panels on rack-and-pinion arms, 0–100 % open, 40 s full travel, faint motor whine | Yes: connect |
| 4 | Wet wall and fan | Actor | 9 m corrugated cellulose pad kept wet by a header pipe, 1.1 m diameter extract fan opposite; cools by evaporation, raises humidity | Yes: connect |
| 5 | Shade cloth roll | Actor | 40 % knitted shade fabric on a motorised roller under the ridge; unrolls in 25 s, cuts solar gain and light for photosynthesis together | Yes: connect |
| 6 | Propane unit heater | Actor | 12 kW hanging heater with a squirrel-cage fan, orange burner glow when firing, night duty only | Yes: connect |
| 7 | Drip irrigation manifold | Actor | 6 lateral lines, 2 L/h emitters at each plant, pressure gauge at the header; wets a visible soil disc | Yes: connect |
| 8 | CO₂ regulator and tank | Actor | 50 kg cylinder and a perforated distribution tube along the row; releases in pulses when enrichment is on | Yes: place |
| 9 | Controller box | Instrument | Wall-mounted panel with air temperature, humidity and CO₂ readouts; issues open, close, fire and mist commands on thresholds | Yes: swap |
| 10 | Air temperature stock | Field | Scalar stock in °C with a 12-minute thermal time constant; vertically stratified, 2 °C hotter at the ridge | No |
| 11 | Humidity stock | Field | Scalar stock in % RH, fed by transpiration and the wet wall, drained by venting | No |
| 12 | Soil water stock | Field | Scalar stock in mm available water, filled by drip, drained by transpiration; sets whether plants can transpire at all | No |
| 13 | Causal link board | Overlay | 9 nodes and 12 labelled arrows; each arrow shows sign (+ or −), gain and delay, and can be cut, restored or edited | Yes: connect |
| 14 | Link scissors and delay dial | UI-Probe | Cursor tool: click an arrow to sever it (it goes dashed grey), or drag its delay dial to add lag | Yes: drag |
| 15 | Loop detector | Instrument | Traces closed paths through the intact arrows and labels each B (balancing) or R (reinforcing), with the loop highlighted on the board | No |
| 16 | Airflow and shimmer overlay | Overlay | Streamlines through vents and along the row, plus a false-colour heat wash from 20 °C blue to 48 °C white | No |

**How it works — the model.**
A genuine system-dynamics engine: four stocks (air temperature, humidity, soil water, CO₂) updated every simulated minute by explicit flows, and every flow is owned by an arrow on the link board. Solar gain adds heat at 850 W/m² × transmission × (1 − shade). Venting removes heat proportional to opening area and the inside-outside temperature difference. Transpiration removes heat as latent energy at a rate proportional to leaf area, temperature and available soil water, and adds the same water to humidity. The controller closes two balancing loops: temperature raises vent opening, which lowers temperature; humidity raises vent opening as well. Every arrow carries sign, gain and a delay implemented as a first-order lag, so adding lag to a balancing loop produces genuine oscillation, not a scripted wobble. Cutting an arrow leaves every component present and running, which is the whole argument. Plant stress integrates minutes spent above 35 °C leaf temperature.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Link editor | Multi-select | temp→vent / temp→transpiration / transpiration→humidity / humidity→vent / shade→solar gain / soil water→transpiration / CO₂→growth / temp→heater | all intact | — | Which interactions exist; cut arrows go dashed and their flow drops to zero |
| Delay on selected link | Slider | 0–30 | 2 | min | Lag between cause and effect on the arrow currently selected |
| Gain on selected link | Slider | 0.2–3.0 | 1.0 | × | How strongly that arrow's cause moves its effect |
| Outside air temperature | Slider | 5–45 | 38 | °C | Driving heat difference across the film and through open vents |
| Solar input | Slider | 0–1000 | 850 | W/m² | Heat and light entering through the roof |
| Vent control mode | Radio | Automatic / Manual / Disconnected | Automatic | — | Whether the controller drives the vents, the student does, or nothing does |
| Manual vent opening | Slider | 0–100 | 0 | % open | Vent area when in manual mode |
| Irrigation | Slider | 0–8 | 4 | L/plant/day | Soil water refill rate, which sets the ceiling on transpiration cooling |
| Shade cloth | Toggle | Deployed / Retracted | Retracted | — | Cuts solar gain by 40 % and light for photosynthesis by 40 % |
| Time compression | Dial | 1×–600× | 120× | — | Simulated minutes per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | An ordinary July day | all links intact; outside=38; solar=850; vents=Automatic; irrigation=4 | Name every closed loop the detector finds and say which of them holds the temperature down. |
| S2 | One arrow cut | link temp→vent cut; everything else unchanged | Every part is still present and powered. Why does the tunnel reach 49 °C by two o'clock? |
| S3 | The same link, delayed | link temp→vent intact; delay=25 min | The link works, just late. Describe the shape the temperature graph now makes and measure its period. |
| S4 | Dry roots | irrigation=0; all links intact; vents=Automatic | The cooling link runs through the soil. With vents working perfectly, why do leaf temperatures still climb? |

**Student activities.**
1. Run S1 for one simulated day and record peak air temperature, peak humidity and the loop labels the detector reports.
2. Cut the temp→vent arrow and re-run. Record peak temperature, then list every part that is still working normally.
3. Restore that arrow and set its delay to 25 minutes. Measure the period and amplitude of the temperature oscillation from the graph.
4. Set irrigation to 0 and predict, before running, whether vents alone can hold the temperature. Run it and record leaf temperature at 14:00.
5. Set the gain on humidity→vent to 3.0 and describe what the tunnel now does at dawn, when humidity is high but temperature is low.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Air and leaf temperature | Line graph | °C | Two traces over 24 simulated hours, with a 35 °C stress threshold drawn |
| Humidity | Line graph | % RH | Plotted on the same time axis as temperature |
| Soil water available | Live numeric | mm | Current value plus hours of transpiration remaining |
| Active loops | Data table | — | Every closed loop found, its members, and its B or R label |
| Oscillation period and amplitude | Live numeric | min and °C | Computed from the last three peaks; blank until three peaks exist |
| Heat stress accumulated | Counter | °C·min above 35 | Integrated leaf-temperature excess, the yield-damage proxy |
| Day-end yield score | Pass-fail badge | — | Green if stress stays under 400 °C·min and fruit set continues |
| Run log | Data table | mixed | Exportable CSV: every stock, every flow, every link state, per simulated minute |

**What the student should realise.**
Students explain system behaviour by listing parts: a greenhouse is hot because it has a heater. Here every part stays present and powered while one arrow is cut, and the tunnel cooks anyway. Then the same arrow, merely delayed, makes the temperature swing instead of settle. Behaviour lives in the interactions, not the inventory. The student should be able to say: *"The parts did not change. What changed was what they were allowed to do to each other."*

### A1.4 · Emergent properties

**Experiment name:** No Bee Is In Charge  
**Render mode:** 3D Scene  
**Simulation engine:** Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS2-2

**Theme & scene.**
Nine in the morning at a Sierra-foothills apiary. The camera opens inside the hive, close on a comb face where six hundred bees crawl over honey-gold hexagons in a slow boiling mass, with a dance floor near the entrance where returning foragers cut figure-eights. Pull the camera back through the entrance slot and the scene becomes a warm top-down field 400 metres across: four flower patches in an almond orchard and a wildflower verge, each a different density of bloom, with bee traffic drawn as faint amber threads between them and the hive. Dust hangs in the light. A colony readout board floats top-left; a single-bee inspector card appears wherever the student clicks. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Worker bee agent | Actor | 12 mm body, amber and charcoal bands, blurred wing quads at 200 Hz; up to 2000 instances; five-state machine: rest, scout, forage, dance, follow | Yes: place |
| 2 | Queen | Actor | 18 mm elongated abdomen, unmarked except for a white dot; walks the brood comb laying one egg per cell; issues no instructions to anyone | No |
| 3 | Comb cells | Structure | Hex grid at 5.4 mm pitch across two frames; per-cell state: empty, nectar, capped honey, pollen, brood; caps render as pale wax discs | Yes: place |
| 4 | Wax builder bees and wax scales | Actor | Bees hanging in festoons, each depositing 0.8 mm wax scales; new cells appear at the growing comb edge without any template | No |
| 5 | Flower patches | Environment | Four circular patches, radius 8–20 m, nectar concentration stock per patch, bloom density drawn as sprite count; deplete on visits and regrow | Yes: drag |
| 6 | Hive nectar store | Field | Colony-level stock in grams, filled by returning foragers, drained by consumption; shown as a filling bar and as capped cells | No |
| 7 | Waggle dance floor | Structure | 12 cm patch of comb just inside the entrance; dances render as figure-eights whose run angle encodes bearing to the sun and whose run duration encodes distance | No |
| 8 | Odour field | Field | Invisible diffusing scalar grid, 2 m cells, deposited by foragers at flowers and decaying with a 6-minute half-life | No |
| 9 | Hive air temperature field | Field | Invisible scalar across the comb volume; heated by bee metabolism, cooled by fanning and water evaporation | No |
| 10 | Fanning and clustering behaviour | Actor | Sub-state of the worker agent: a bee fans at the entrance above its own 36 °C threshold, joins a huddle below 33 °C; no bee reads the colony average | No |
| 11 | Guard bees and entrance | Actor | 6 bees at a 90 mm entrance slot, challenging arrivals; traffic counter sits under the sill | No |
| 12 | Rule card panel | UI-Probe | Five cards, one per individual behaviour rule; each can be switched off, which removes that behaviour from every bee at once | Yes: swap |
| 13 | Colony readout board | Overlay | Floating panel: share of foragers at each patch, total nectar, hive core temperature, decision time | No |
| 14 | Single-bee inspector | UI-Probe | Click any bee to lock the camera to it and open a card listing everything that bee knows: one patch, one bearing, one nectar memory | Yes: drag |
| 15 | Visit heat map | Overlay | Toggleable false-colour wash over the field, counting foraging visits per square metre over the last 10 minutes | No |
| 16 | Weather event driver | Environment | Rain or cold-snap events that suppress flight and drop outside temperature over 3 simulated minutes | Yes: swap |

**How it works — the model.**
Pure agent-based. Every bee runs the same five rules and holds only private knowledge: one remembered patch, its bearing, and how good it was last time. Rule 1, an unemployed bee watches a dance and copies its bearing with an angular error. Rule 2, a returning forager dances with a duration proportional to the nectar quality it found, so richer patches recruit more followers per return. Rule 3, a forager abandons a patch when its yield falls below a threshold. Rule 4, bees follow the odour gradient over the last 30 m. Rule 5, a bee fans above its own temperature threshold and clusters below it. Nothing in the code compares patches, computes a colony average, or issues an order. Colony-level quantities are read out but never written to. Patch share and hive temperature must therefore be measured from the agents, never imposed on them, or the whole demonstration is a fraud.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Individual rules | Multi-select | Follow a dance / Dance if rich / Abandon if poor / Follow odour / Fan or cluster | all on | — | Which behaviours exist in every bee; switching one off removes it colony-wide |
| Colony size | Slider | 50–2000 | 600 | bees | How many agents run; the emergent behaviours weaken then vanish as it falls |
| Patch count | Stepper | 1–6 | 4 | patches | How many flower patches exist in the field; patches can also be dragged |
| Richness of selected patch | Slider | 0–100 | 70 | % bloom | Nectar concentration in the patch currently selected |
| Nectar regrowth | Slider | 0–20 | 6 | % per min | How fast a depleted patch refills, which sets whether a choice stays stable |
| Dance angular error | Slider | 0–30 | 8 | ° | Precision with which a follower copies a dance bearing |
| Outside temperature | Slider | 0–45 | 22 | °C | Drives fanning and clustering, and whether bees can fly at all |
| Follow one bee | Toggle | On / Off | Off | — | Locks the camera to a single agent and shows only what it knows |
| Rain event | Toggle | On / Off | Off | — | Grounds all foragers for the duration |
| Time compression | Dial | 1×–120× | 30× | — | Simulated minutes per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Four patches, one best | patches=4; richness A=90, B=45, C=30, D=20; rules=all on; colony=600 | Does the colony end up mostly at the best patch? Now inspect ten bees. How many of them compared the patches? |
| S2 | Silence the dance | rules: Dance if rich OFF; patches and richness as S1 | Every bee still forages perfectly well. What exactly has the colony lost the ability to do? |
| S3 | The best patch runs dry | richness A drops to 5 at minute 20; regrowth=0; rules=all on | How many minutes does the colony take to switch, and what individual behaviour makes the switch happen? |
| S4 | Cold snap in the almond bloom | outside=4; rules: Fan or cluster ON; colony=1200 | Hive core temperature holds near 34 °C. Which bee measured it, and what is each bee actually responding to? |

**Student activities.**
1. Run S1 for 30 simulated minutes and record the share of foragers at each patch every 5 minutes.
2. Click five individual bees and write down, for each, the number of patches it knows about. Compare that to the number the colony is exploiting.
3. Switch off "Dance if rich", re-run S1, and record final patch share. State in one sentence what disappeared.
4. Run S3 and record the time from the patch drying out to the moment more than half the foragers are elsewhere.
5. Drop colony size to 60 with all rules on. Record whether the colony still converges, and give the smallest size at which it still works.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Patch share | Line graph | % of foragers | Four stacked traces over time, updated every 10 simulated seconds |
| Colony choice accuracy | Live numeric | % | Share of foragers at whichever patch is objectively richest right now |
| Total nectar stored | Line graph | g | Colony-level stock over the run |
| Individual knowledge | Data table | count | For the inspected bee: patches known, last yield, bearing held, dances watched |
| Hive core temperature | Line graph | °C | Measured from the agent field, with outside temperature as a second trace |
| Decision time | Timer | min | Time from a change in patch richness to the colony's majority moving |
| Emergence check | Pass-fail badge | — | Green when a colony-level property holds while no individual holds it |
| Run log | Data table | mixed | Exportable CSV: agent states, patch stocks, colony readouts per simulated minute |

**What the student should realise.**
Students assume that organised behaviour needs someone organising it: the queen must be deciding, or some bee must be keeping score. Inspecting any bee shows it knows one patch and one bearing, and switching off a single rule destroys a colony-level ability while leaving every bee intact. The whole has properties the parts do not. The student should be able to say: *"The colony chooses, and not one bee is choosing."*

### A1.5 · Systems across scales, from a cell to a planet

**Experiment name:** From Chloroplast to Coastline  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model (coupled multi-scale) + Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS2-1

**Theme & scene.**
A continuous vertical column of Monterey Bay water, sun shafts raking down through a swaying kelp canopy, particles drifting in the green light. On the left, a logarithmic scale slider runs from 1 µm to 1000 km with a live scale bar that redraws at every step. At the deepest setting the view is inside one kelp cell: jade chloroplasts, thylakoid stacks, a pale cell wall. Pull outward and the scene cross-dissolves through blade, whole plant, forest patch with urchins and otters, the whole bay, and finally the California coast from orbit with a chlorophyll satellite wash. Each layer keeps its own small HUD in the same position, so the numbers change while the frame does not. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Chloroplast | Structure | 5 µm lens, jade, internal thylakoid stacks as ribbed discs, starch grain inclusions; 60 per cell, streaming slowly around the vacuole | No |
| 2 | Kelp cell | Structure | 30 µm rectangular cell, translucent wall 0.8 µm thick, large central vacuole, plasmodesmata pits at the walls | No |
| 3 | Sieve tube element | Structure | Elongated conducting cell with a perforated end plate; carries sugar down the stipe at 10 cm/min, drawn as a moving stripe | No |
| 4 | Blade and pneumatocyst | Structure | 40 cm corrugated blade with a 3 cm gas bladder at its base; bladder holds carbon monoxide and buoys the blade upward | Yes: place |
| 5 | Stipe and holdfast | Structure | Stipe up to 30 m, holdfast a tangle of 200 haptera gripping a granite boulder; sways on a 6 s swell period | No |
| 6 | Giant kelp individual | Actor | Whole plant agent; growth up to 30 cm/day when nitrate and light allow; senesces and detaches in storms | Yes: place |
| 7 | Kelp forest patch | Environment | One hectare, 180 individuals, canopy fraction 0–100 %, understory light shaded accordingly | Yes: resize |
| 8 | Purple urchin agents | Actor | 6 cm test with moving spines, 0–40 per m²; graze holdfasts; switch to a dormant "barren" state when food is gone | Yes: place |
| 9 | Sea otter agents | Actor | 1.2 m agents rafting at the surface, each eating 25 % of body mass daily; visibly crack urchins on their chests | Yes: place |
| 10 | Sunflower star and sheephead | Actor | Second and third urchin predators, added or removed to change the food web without touching kelp directly | Yes: place |
| 11 | Water column layers | Environment | Light attenuating with depth at k=0.12 m⁻¹, nitrate stock rising with depth, thermocline drawn as a shimmer band | No |
| 12 | Scale slider and scale bar | UI-Probe | Log slider 1 µm to 1000 km with a bar that relabels itself: 10 µm, 1 cm, 1 m, 100 m, 10 km, 500 km | Yes: drag |
| 13 | Cross-scale link arrows | Overlay | Arrows showing which quantity at one level feeds the next: photosynthesis per chloroplast to sugar per blade to biomass per plant to tonnes per hectare | No |
| 14 | Carbon accountant | Instrument | Invisible integrator summing fixed carbon upward through every level and reporting it in that level's natural units | No |
| 15 | Perturbation tool | UI-Probe | Drop a change at any level: block light on one chloroplast, cut a blade, remove otters, warm the bay; marks the injection point with a pin | Yes: place |
| 16 | Satellite chlorophyll layer | Overlay | Coast-scale false-colour wash from MODIS-style data, 1 km pixels, with the bay outlined | No |

**How it works — the model.**
Six nested models run at once, each with its own units and its own clock, coupled only upward through explicit aggregation. At the chloroplast level, photosynthesis follows a light-response curve saturating near 400 µmol photons/m²/s. Cell-level fixation is chloroplast rate multiplied by count. Blade fixation sums cells over area; plant growth sums blades and subtracts respiration; patch biomass sums plants and subtracts urchin grazing; bay production sums patches. Grazing is agent-based: urchin density rises when predators are removed, and above about 9 urchins/m² a patch flips to a barren state that persists even after grazing falls, which is the hysteresis the coast really shows. Characteristic times differ by level: chloroplast seconds, plant days, forest years. The honesty rule: a perturbation at one level must propagate only through the actual coupling arrows, so blocking light on a single chloroplast genuinely changes nothing measurable at the bay.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Scale | Slider (log) | 1 µm – 1000 km | 10 m | m | Which nested level is on screen and which HUD units are shown |
| Perturbation site | Dropdown | Chloroplast / Cell / Blade / Whole plant / Forest patch / Whole bay | Forest patch | — | Level at which the next change is injected |
| Perturbation type | Dropdown | Block light / Cut nutrients / Remove otters / Warm water +3 °C / Storm swell / Harvest canopy | Remove otters | — | What the injected change actually does |
| Otter population | Stepper | 0–40 | 18 | otters | Predation pressure on urchins in the modelled patch |
| Upwelling nitrate | Slider | 0–30 | 18 | µmol/L | Nutrient supply to kelp growth, the Central California seasonal driver |
| Surface light | Slider | 0–2000 | 1200 | µmol photons/m²/s | Light at the sea surface before attenuation with depth |
| Sea temperature | Slider | 10–24 | 13 | °C | Growth rate and, above 18 °C, nutrient starvation in surface water |
| Time span | Timeline scrubber | 0–20 | 0 | years | Position within a 20-year run, scrubbable both ways |
| Cross-scale arrows | Toggle | On / Off | On | — | Draws the aggregation links between adjacent levels |
| Level clock | Radio | Seconds / Hours / Days / Years | Days | — | Which characteristic time the current level is stepped in |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Climb the ladder | perturbation=none; light=1200; nitrate=18; temp=13 | Read carbon fixed at all six levels. The number changes by twelve orders of magnitude. What stays the same? |
| S2 | Break it at the bottom | site=Chloroplast; type=Block light; span=0–5 years | One chloroplast is shaded. Measure the effect at cell, plant, patch and bay. At which level does it vanish into the noise? |
| S3 | Break it in the middle | site=Forest patch; type=Remove otters; otters=0; span=0–20 years | The forest collapses to a barren. Has photosynthesis per chloroplast changed? What has changed? |
| S4 | The 2014 warm blob | temp=19; nitrate=3; otters=6; type=Warm water +3 °C; span=0–20 years | This is what the California coast actually experienced. Which level did the heat act on, and which level showed it first? |

**Student activities.**
1. Set the scale slider to each of the six levels in turn and record carbon fixed with its units at each. Note where the unit changes from femtograms to tonnes.
2. Inject "Block light" at the chloroplast, then read the bay-level output. Record the change to three significant figures.
3. Inject "Remove otters" at the patch level and scrub the timeline to year 20. Record urchin density and canopy area at years 1, 5 and 20.
4. With the barren established, set otters back to 18 and scrub forward five more years. Record whether the forest returns and how long it takes.
5. Run S4 and write one sentence naming the level the disturbance entered and the level at which you first measured it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Carbon fixed at current level | Live numeric | fg/s, mg/day, kg/day or t/year | Rescales automatically to the level on screen; the unit change is the lesson |
| Scale ladder table | Data table | mixed | All six levels side by side: object, size, characteristic time, output, unit |
| Canopy area | Line graph | ha | Forest patch canopy over the 20-year timeline |
| Urchin density | Line graph | urchins/m² | Plotted with the 9 per m² barren threshold marked |
| Otter count | Live numeric | otters | Current predator population in the modelled patch |
| Effect size by level | Bar chart | % change | How much the injected perturbation moved each of the six levels |
| Recovery time | Timer | years | Time from restoring predators to canopy passing 50 % of its former area |
| Run log | Data table | mixed | Exportable CSV: every level's state at every timestep |

**What the student should realise.**
Students think of a system as one fixed size, usually the size they can see. Here the same kelp is a system at six sizes at once, and the units, the clock and the answerable questions all change with the level. A change that is catastrophic at one level is invisible at another. The student should be able to say: *"Whether something counts as a big change depends on which level I chose to look at."*

## A2 · Boundaries, inputs and outputs

### A2.1 · Drawing a system's boundary

**Experiment name:** Where You Draw the Line  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model (flow network) + State machine  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ESS3-3

**Theme & scene.**
An isometric cutaway of a Sierra-foothills middle school at ten in the morning, drawn like a clean architectural model: four classroom blocks with their roofs lifted off, a cafeteria with a working kitchen, a rooftop solar array, a bus loop with two buses, a garden with three compost bins, a trash and recycling enclosure, and the utility connections at the street edge. Flows move as coloured ribbons across the model: blue water, yellow electricity, green food, grey waste, white people. A dashed magenta boundary polygon lies over the site with grab handles at each vertex; everything inside is rendered in full colour, everything outside falls to 40 % grey. The ledger panel on the right lists Inputs, Outputs and Internal transfers and rewrites itself the instant a handle moves.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Site terrain plate | Environment | 180 m × 140 m isometric base with asphalt, playing field, oak shade and a street edge; sun angle set by the day clock | No |
| 2 | Classroom blocks | Structure | Four single-storey blocks, roofs lifted 3 m to show lighting, HVAC ducts and occupancy; each draws a metered electrical load | Yes: place |
| 3 | Cafeteria and kitchen | Actor | Serving line, two ovens, a walk-in chiller, three sinks; converts delivered food into meals, food waste and grey water on a lunch-hour schedule | Yes: place |
| 4 | Rooftop solar array | Actor | 60 kW of panels on the gym roof, tilt 20°, output following a daily curve with a visible inverter cabinet | Yes: place |
| 5 | Grid connection and meter | Instrument | Pole transformer and a bidirectional meter at the street; reads import and export separately in kWh | No |
| 6 | Water main and meter | Instrument | 100 mm main under the street with a pit-mounted meter reading cumulative m³ | No |
| 7 | Sewer lateral and flow meter | Instrument | 150 mm lateral leaving the site with an inline flow meter; carries kitchen and washroom outflow | No |
| 8 | Food delivery truck | Actor | Arrives 07:30, unloads 240 kg of food into the kitchen store, departs; the ribbon it carries is drawn only while it moves | Yes: place |
| 9 | School buses | Actor | Two 12 m buses on the loop, arriving 07:50 and 15:10; consume diesel, carry students in and out | Yes: place |
| 10 | Garden and compost bins | Actor | Three 1 m³ bins plus 12 raised beds; takes kitchen scraps and returns soil and a small vegetable yield to the kitchen | Yes: place |
| 11 | Trash and recycling enclosure | Actor | Six wheeled bins behind a screen wall; a hauler empties them twice a week and drives off site | Yes: place |
| 12 | Flow ribbons | Overlay | Bezier ribbons between nodes, width ∝ rate, colour by type, animated dashes showing direction | No |
| 13 | Boundary polygon tool | UI-Probe | Dashed magenta closed polygon, 3–12 draggable vertices, snapping to building corners and fence lines | Yes: drag |
| 14 | Crossing detector | Instrument | Invisible geometry test: every ribbon-polygon intersection is registered with its type, direction and rate | No |
| 15 | Ledger panel | Overlay | Three live columns, Inputs, Outputs and Internal transfers, each row naming the flow, its rate and its unit | No |
| 16 | Balance check badge | Instrument | Tests inputs minus outputs minus accumulation for each flow type and reports whether the books close | No |

**How it works — the model.**
The campus is a directed flow network: 14 nodes, 26 edges, each edge carrying a typed flow with a rate schedule across the school day. Water enters at the main, splits to washrooms, kitchen and irrigation, and leaves by sewer or by evaporation. Electricity enters from the grid, is generated on the roof, and is consumed by lighting, HVAC and kitchen. Food enters by truck, becomes meals, scraps and packaging. Nothing about these flows depends on the boundary. The boundary is purely a geometric classifier evaluated every frame: an edge with both endpoints inside is an internal transfer, an edge crossing inward is an input, an edge crossing outward is an output. Dragging a vertex therefore reclassifies flows without changing a single rate, and the ledger animates the reclassification. The failure to avoid: the sim must never alter a flow rate when the boundary moves, because the entire idea is that the boundary is an accounting choice, not a wall.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Boundary preset | Dropdown | Whole campus / Cafeteria only / Buildings only / Campus plus buses and supplier / Custom | Whole campus | — | Jumps the polygon to a saved shape and rewrites the ledger |
| Boundary vertices | Drag-handle | 3–12 handles, snapping to corners and fences | 6 handles | — | The actual shape of the system boundary |
| Flow types shown | Multi-select | Water / Electricity / Food / Waste / People | all | — | Which ribbons are drawn and counted in the ledger |
| Time of day | Timeline scrubber | 06:00–18:00 | 12:00 | h:mm | Every flow rate follows its own daily schedule |
| Solar output | Slider | 0–60 | 42 | kW | Rooftop generation, which can turn grid import into export |
| Enrolment | Slider | 200–900 | 520 | students | Scales water use, food, waste and bus trips together |
| Composting | Toggle | On / Off | On | — | Whether kitchen scraps go to the garden or to the hauler |
| Irrigation | Slider | 0–40 | 12 | m³/day | Water sent to the field and garden rather than to the sewer |
| Show crossings only | Toggle | On / Off | Off | — | Hides internal ribbons so only boundary crossings remain visible |
| Aggregation window | Radio | Per minute / Per day / Per school year | Per day | — | Units in which the ledger reports every flow |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The whole campus | preset=Whole campus; time=12:00; flows=all; window=Per day | List every input and every output. How many flows cross the line, and how many are purely internal? |
| S2 | Just the cafeteria | preset=Cafeteria only; composting=On | The compost ribbon was internal a moment ago. Which column is it in now, and what physically changed? |
| S3 | Solar left outside | preset=Buildings only; solar=42 | The array is 8 m away, on the gym roof, outside the line. Why does the ledger now show electricity as an input? |
| S4 | Draw it wide | preset=Campus plus buses and supplier; window=Per school year | Bus diesel and the supplier depot are now inside. Does the total crossing count go up or down, and why? |

**Student activities.**
1. Load S1 and copy the full ledger into your table: name, type, direction and rate for every crossing.
2. Drag one vertex so the garden falls outside the line. Record which two flows changed column, and confirm that neither rate changed.
3. Switch the preset to Cafeteria only and count crossings. Compare with the whole-campus count and explain the difference.
4. Set composting off, then on, at the whole-campus boundary. Record what happens to the waste output and why the total mass leaving the site changes.
5. Draw a custom boundary that makes water an internal transfer rather than an input. Record whether that is possible on this site, and say why.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Crossing list | Data table | mixed | Every boundary crossing: name, type, direction, rate, unit; rewritten on every vertex drag |
| Inputs vs outputs by type | Bar chart | m³, kWh, kg | Paired bars per flow type for the current boundary and window |
| Internal transfers | Counter | count | How many flows are wholly inside the line right now |
| Reclassified by last drag | Counter | count | Flows that changed column when the boundary last moved |
| Accumulation | Live numeric | m³, kWh, kg | What is piling up inside the boundary, per flow type |
| Balance check | Pass-fail badge | — | Green when inputs minus outputs equals accumulation for every type |
| Ledger export | Data table | mixed | Exportable CSV of the ledger for up to six saved boundaries side by side |

**What the student should realise.**
Students treat a boundary as a real wall that decides what is in the system. Dragging one vertex turns an internal compost flow into an output, and turns the school's own solar electricity into an import, while no physical rate changes. The boundary is a line the investigator draws, not a thing the world contains. The student should be able to say: *"Nothing moved. I moved the line, and that changed what counts as going in and out."*

### A2.2 · Open vs closed systems

**Experiment name:** Three Jars, One Lamp  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model (mass and energy balance) + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-5

**Theme & scene.**
A dark lab bench under one adjustable LED grow bar on a rail. Three identical two-litre wide-mouth jars stand in a row, each on its own digital balance whose display reads to 0.01 g. Jar A is open, its mouth bare. Jar B wears a silicone-gasket lid clamped down. Jar C is sealed the same way but sits inside a mirrored vacuum-flask jacket with a small shutter over its light window. Inside each jar: three centimetres of moist dark soil, four duckweed fronds on a water film, a moss cushion, one snail, and condensation beading on the cold upper glass. Grey-green, clinical, high contrast, with the lamp the only warm thing in frame. Behind the jars, three vertical accounting strips fill live: mass, energy, matter species. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Bench and lamp rail | Environment | 1.2 m matte-black bench, anodised rail 40 cm above it, lamp head slides along the rail and can be aimed | Yes: drag |
| 2 | Jar shells | Structure | Three 2 L borosilicate jars, 14 cm tall, 11 cm wide, 3 mm wall, faint mould seam; identical in every respect | No |
| 3 | Gasket lids | Structure | Silicone-sealed screw lids with a visible red gasket ring; a lid can be removed, replaced, or fitted with a 1 mm pinhole | Yes: swap |
| 4 | Vacuum-flask jacket and shutter | Structure | Double-walled mirrored sleeve around Jar C with a 30 mm sliding shutter over its light window; blocks conduction, radiation and convection when closed | Yes: place |
| 5 | Digital balances | Instrument | Three 0.01 g platforms with backlit displays and a tare button; drift-free, reading total jar mass continuously | No |
| 6 | Soil layer and microbes | Structure | 3 cm of dark loam, visible aggregate texture; carries an invisible microbe stock that respires and decomposes | Yes: resize |
| 7 | Duckweed and moss | Actor | Four 4 mm fronds floating plus one 3 cm moss cushion; photosynthesis follows a light-response curve, fronds yellow and sink when starved | Yes: place |
| 8 | Snail | Actor | 12 mm garden snail agent, grazes moss, respires continuously, retracts and slows below 12 °C | Yes: place |
| 9 | Water in three states | Field + Particle | One water stock split between soil water, free liquid, and vapour; condensation droplets render on the inside glass and run back down | No |
| 10 | Gas stocks | Field | Per-jar stocks of O₂, CO₂, N₂ and water vapour in millimoles, drawn as four segmented bars beside each jar | No |
| 11 | LED grow lamp | Actor | 30 cm bar, 0–400 µmol photons/m²/s, 4000 K, on a daily timer; casts a hard rectangle of light on the bench | Yes: swap |
| 12 | Thermal probe and gas sensor | Instrument | Thin stainless probe and a miniature O₂/CO₂ sensor through each lid; live per-jar readouts on stalk displays | No |
| 13 | Energy flux arrows | Overlay | Yellow arrows for light in, red arrows for infrared out, drawn crossing or stopping at each jar wall; Jar C's arrows visibly terminate at the jacket | No |
| 14 | Mass ledger strip | Overlay | Vertical strip per jar showing starting mass, current mass, and cumulative mass crossing the wall | No |
| 15 | Tagged carbon tracer | Particle | 20 carbon atoms rendered as magenta spheres cycling CO₂ to sugar to tissue to CO₂; toggleable, counted but never created or destroyed | No |
| 16 | Time compression clock | UI-Probe | Bench-mounted clock face reading elapsed simulated days, with a scrub handle | Yes: drag |

**How it works — the model.**
Three parallel balance models, one per jar, each conserving mass and energy explicitly. Photosynthesis converts CO₂ and water to sugar and O₂ at a rate set by the light-response curve. Respiration by snail, plants and soil microbes runs the reaction backwards day and night. Water evaporates and condenses between the three water stores according to temperature and the vapour deficit. Wall exchange is what differs: Jar A exchanges both matter and energy, Jar B exchanges energy only (light in, infrared out through glass), Jar C exchanges neither while the shutter is closed. Every gram and every joule that crosses a wall is logged. Nothing is permitted to appear or vanish, so a sealed jar's total mass must stay flat to the last decimal even as the water cycles between liquid, soil and vapour. The classification badge is computed from the crossing counters, never hard-coded, so a lid with a pinhole is correctly reported as an open system.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Jar A lid | Dropdown | Open / Sealed / Sealed with 1 mm pinhole | Open | — | Whether matter can cross Jar A's wall, and how fast |
| Jar B lid | Dropdown | Open / Sealed / Sealed with 1 mm pinhole | Sealed | — | Whether matter can cross Jar B's wall |
| Jar C jacket | Toggle | Fitted / Removed | Fitted | — | Whether energy can cross Jar C's wall by conduction and radiation |
| Jar C light shutter | Toggle | Open / Closed | Closed | — | The last energy pathway into Jar C; closing it makes the jar isolated |
| Lamp intensity | Slider | 0–400 | 220 | µmol photons/m²/s | Energy input to Jars A and B, and to C when the shutter is open |
| Light hours | Slider | 0–24 | 12 | h/day | Length of the daily photosynthesis window |
| Room temperature | Slider | 10–35 | 21 | °C | Drives evaporation, respiration rate and the heat flow through each wall |
| Living things per jar | Stepper | 0–6 | 3 | organisms | How many plants and animals are inside each jar at the start |
| Tagged carbon tracer | Toggle | On / Off | Off | — | Renders 20 labelled carbon atoms so they can be counted as they cycle |
| Time compression | Dial | 1×–20000× | 5000× | — | Simulated days per real second, up to a 90-day run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Thirty days side by side | A=Open; B=Sealed; C=Fitted with shutter Open; lamp=220; hours=12 | Which jar loses mass, and which jar's mass never changes at all? Which jars are still alive on day 30? |
| S2 | Sealed and dark | B=Sealed; lamp=0 for Jar B only via shutter and lamp aim | Matter is fully conserved and the jar still dies. What was crossing the wall before, and what is not crossing now? |
| S3 | Truly isolated | C=Jacket Fitted; shutter=Closed; time=20000× | Neither matter nor energy crosses. Record how long anything stays alive and what the gas bars do at the end. |
| S4 | The pinhole test | A=Sealed with 1 mm pinhole; room=30 | The lid is on and it looks sealed. What does the balance say after 30 days, and what does the badge classify it as? |

**Student activities.**
1. Tare all three balances, run 30 simulated days, and record mass for each jar on days 0, 10, 20 and 30.
2. Record the energy crossing counter for Jar B. State whether a closed system can still receive anything, and what.
3. Close Jar C's shutter and run again. Record the day on which CO₂ stops rising and explain what has run out.
4. Fit the pinhole lid to Jar A, run 30 days, and record the total mass lost. Predict first, then compare.
5. Switch on the carbon tracer for Jar B and count the magenta atoms on day 0 and day 30. Record where each one is at both times.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Jar mass | Line graph | g | Three traces to 0.01 g over the run; the sealed trace is a flat line |
| Gas concentrations | Line graph | mmol | O₂ and CO₂ for the selected jar, with day and night bands shaded |
| Energy crossing wall | Live numeric | W | In and out separately for each jar, updated every simulated hour |
| Matter crossing wall | Counter | g cumulative | Total mass that has crossed each wall since the run started |
| System classification | Pass-fail badge | — | Reads Open, Closed or Isolated per jar, computed from the two counters |
| Survival status | Live numeric | days | Days since the last living organism in that jar stopped respiring |
| Carbon atom census | Data table | count | Where each tagged atom sits: gas, water, plant tissue, snail, soil |
| Run log | Data table | mixed | Exportable CSV of all three jars, every stock and crossing, per simulated day |

**What the student should realise.**
Students hear "closed system" and picture a box that nothing gets into at all. Jar B is sealed, its mass never moves, and it thrives for a month because light keeps pouring through the glass. Jar C, which really does exclude everything, dies. Closed means matter cannot cross; energy still can, and usually must. The student should be able to say: *"Sealed to matter is not sealed to energy, and that difference is what keeps the jar alive."*

### A2.3 · Inputs and outputs

**Experiment name:** On the Dyno: In One End, Out the Other  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model (process balance) + State machine  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS3-5

**Theme & scene.**
A school engineering test cell seen through a thick observation window, everything clearly labelled as a virtual rig. Centre stage, a single-cylinder 250 cm³ engine bolted to a dynamometer, cut away down its axis so the piston, valves, spark plug and crankshaft run visibly through their four strokes. Fuel arrives from a graduated glass burette on the wall whose level drops as you watch. Air comes in through a bell mouth with a mass-flow meter. A coolant loop leaves for a radiator and returns. The exhaust runs into a gas analyser cabinet. Five ribbons wrap the rig: amber fuel, pale blue air, green shaft work, red heat, grey exhaust. A Sankey bar across the bottom splits the fuel energy live. Control panel right, atom inventory left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Engine block cutaway | Structure | 250 cm³ single cylinder, 70 mm bore, 65 mm stroke, alloy fins, sectioned on the centre plane with cut faces in hatched grey | No |
| 2 | Piston, rings, conrod, crank | Actor | Three rings modelled separately, conrod journal and counterweight; runs 600–4000 rpm with correct phase against the valves | No |
| 3 | Intake and exhaust valves with camshaft | Actor | Two 30 mm poppet valves on springs, single overhead cam with visible lobes; opening events shown on a small timing wheel | No |
| 4 | Spark plug and spark | Actor | 14 mm plug, electrode gap 0.8 mm, blue spark sprite once per two revolutions, advance angle adjustable | Yes: swap |
| 5 | Fuel injector and burette | Actor + Instrument | Injector spraying a visible cone into the intake; 100 mL glass burette on the wall with 1 mL graduations and a falling meniscus | No |
| 6 | Air intake and mass-flow meter | Instrument | Bell mouth with a hot-wire meter reading g/s to one decimal; intake air drawn as pale blue streamlines | No |
| 7 | Coolant loop | Actor + Instrument | Pump, hoses, radiator with a fan, and two thermometers; heat removed computed as flow × ΔT × specific heat | Yes: connect |
| 8 | Exhaust pipe and gas analyser | Instrument | 38 mm pipe into a cabinet reading CO₂, H₂O, O₂, N₂ and unburnt hydrocarbons as percentages | No |
| 9 | Dynamometer brake and load cell | Instrument | Water brake with a 0.5 m torque arm on a load cell; reads N·m, and with rpm gives shaft power in kW | Yes: swap |
| 10 | Fuel and air molecule tokens | Particle | C₈H₁₈ tokens with charcoal C and white H spheres, O₂ as paired red spheres, N₂ as paired blue; recombine into CO₂ and H₂O at combustion | No |
| 11 | Atom inventory panel | Overlay | Live count of C, H, O and N atoms entering and leaving per second, before and after combustion, with a difference column that must read zero | No |
| 12 | Energy Sankey ribbon | Overlay | One wide amber input band splitting into green shaft work, red coolant heat, grey exhaust heat and a thin friction band; widths ∝ kW | No |
| 13 | Control volume frame | Overlay | Dashed white box around the counted region; snaps to engine only, engine plus radiator, or engine plus radiator plus fuel tank | Yes: resize |
| 14 | Input disconnect valves | Actor | Four physical shutoffs on the fuel line, air duct, ignition lead and coolant hose; each can be closed by hand | Yes: connect |
| 15 | Extraction hood and hazard badge | Environment | Stainless hood over the rig, running fan, plus a persistent "simulated rig" badge and interlock light | No |
| 16 | Data logger | Instrument | Rack-mounted unit sampling every channel at 10 Hz with a run marker and an export button | No |

**How it works — the model.**
A steady-state process balance with a four-stroke state machine driving the animation. Fuel energy in equals mass flow × 44 MJ/kg. Shaft power out equals torque × angular speed. Coolant heat out equals flow × 4.18 kJ/kg·K × ΔT. Exhaust heat out equals exhaust mass flow × specific heat × temperature rise. Friction takes what remains, and by construction the four outputs sum exactly to the input, so the Sankey always closes to 100 %. Combustion stoichiometry is explicit: two C₈H₁₈ plus twenty-five O₂ gives sixteen CO₂ plus eighteen H₂O, so the atom inventory balances at every air-fuel ratio, with unburnt hydrocarbons appearing in the exhaust when the mixture is rich. Blocking an output is modelled honestly: with coolant stopped, heat accumulates in the block's thermal mass, temperature climbs, and the engine derates then seizes. Efficiency must never be allowed to exceed roughly 30 %, because the wasted heat is the point.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Throttle | Slider | 0–100 | 40 | % open | Air and fuel mass flow into the cylinder |
| Dyno load | Slider | 0–20 | 8 | N·m | Braking torque the engine must overcome, which sets rpm |
| Air-fuel ratio | Slider | 10:1–18:1 | 14.7:1 | mass ratio | Completeness of combustion and what appears in the exhaust |
| Spark timing | Slider | −5 to +35 | 20 | ° before top dead centre | How much of the fuel energy becomes work rather than exhaust heat |
| Coolant flow | Slider | 0–30 | 12 | L/min | Rate of the heat output pathway through the radiator |
| Disconnect an input | Multi-select | Fuel / Air / Ignition / Coolant | none | — | Physically closes that supply, which is a structural change to the rig |
| Control volume | Dropdown | Engine only / Engine plus radiator / Engine plus radiator plus fuel tank | Engine only | — | Which components are inside the counted box, and therefore what counts as a crossing |
| Run duration | Stepper | 10–120 | 60 | s | Length of a logged dyno run |
| Ledger units | Radio | kW / % of fuel energy / g per second | % of fuel energy | — | Units for the Sankey and the input-output table |
| Slow-motion cycle | Toggle | On / Off | Off | — | Drops to 1/40 speed so the four strokes can be counted individually |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Steady cruise | throttle=40; load=8; ratio=14.7:1; timing=20; coolant=12 | List every input and every output with its rate. What fraction of the fuel energy leaves as useful work, and where does the rest go? |
| S2 | Starve one input | disconnect=Air; everything else as S1 | Cut one input and every output collapses. Which output keeps flowing for a while afterwards, and why? |
| S3 | Rich mixture | ratio=10:1; throttle=60 | Unburnt fuel appears in the exhaust. Check the atom inventory. Did any atoms go missing, and if not, where did they go? |
| S4 | Block an output | coolant=0; throttle=60; load=12; duration=120 | Every input is still connected. Trace what happens to block temperature and power when heat has nowhere to leave. |

**Student activities.**
1. Run S1 for 60 s and record fuel flow, air flow, shaft power, coolant heat and exhaust heat. Add the outputs and compare with the input.
2. Set the ledger to "% of fuel energy" and copy the four Sankey widths into your table. State which output is the largest.
3. Disconnect the air supply and record the time to stall and the coolant heat still leaving 20 s later.
4. Set the air-fuel ratio to 10:1 and record the carbon atom count in and out. Then say what the difference column reads.
5. Set coolant flow to zero and record block temperature every 20 s until the engine derates. Record the temperature at which it stops.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Input table | Data table | g/s and kW | Fuel, air and coolant flow, each with its energy equivalent |
| Output table | Data table | g/s and kW | Shaft work, coolant heat, exhaust heat, friction and exhaust mass |
| Energy split | Bar chart | % of fuel energy | Live Sankey widths as numbers; must sum to 100 % |
| Atom inventory | Data table | atoms/s | C, H, O and N in, out and difference; the difference column must read zero |
| Shaft power and torque | Live numeric | kW and N·m | Updated at 10 Hz with rpm alongside |
| Block temperature | Line graph | °C | Over the run, with derate and seizure thresholds marked |
| Thermal efficiency | Live numeric | % | Shaft work divided by fuel energy |
| Run log | Data table | mixed | Exportable CSV at 10 Hz for every channel |

**What the student should realise.**
Students list a machine's inputs, assuming the outputs are just the useful one. This rig shows three quarters of the fuel energy leaving as heat, and shows that closing the radiator, an output, kills the engine as surely as closing the fuel line. Meanwhile the atom count in equals the atom count out. The student should be able to say: *"A system needs its outputs open as much as its inputs, and the energy that leaves is still all there."*

### A2.4 · Tracing matter and energy through a system

**Experiment name:** Follow One Drop, Follow One Joule  
**Render mode:** 2.5D Layered  
**Simulation engine:** Agent-based (tracer particles on a flow network) + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-4

**Theme & scene.**
A long cutaway landscape scrolling left to right, from Sierra granite down to San Francisco Bay, at twelve times vertical exaggeration so every drop of elevation is legible. Left, a blue-white snowfield above a reservoir held by a concrete arch dam. Then a penstock plunging to a powerhouse, an aqueduct running the valley, a treatment plant of rectangular basins, a pump station, a hilltop tank, a school with its plumbing exposed, a sewer, a wastewater plant, and an outfall into the bay. Above everything, faint evaporation arrows curl up to a cloud that drifts back east. The tracers are the only saturated colour on screen: a glowing magenta droplet with a tag number, and a small orange dot labelled 1 J. Control panel docks bottom-right; a path log scrolls left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terrain profile plate | Environment | 260 km horizontal at 1:400 000, vertical exaggeration ×12, elevation ticks every 200 m from 2600 m to sea level, granite to alluvium textures | No |
| 2 | Snowpack and melt front | Actor | Snowfield with a retreating edge, melt rate driven by air temperature; meltwater renders as thin braided threads | Yes: resize |
| 3 | Reservoir and dam | Structure | Arch dam 90 m high, reservoir stock in millions of m³ drawn as a filling wedge with a visible bathtub ring at low level | Yes: resize |
| 4 | Penstock, turbine, generator | Actor | 3 m steel pipe dropping 300 m, Francis runner spinning, generator housing with a live kW display; converts gravitational energy to electrical | Yes: connect |
| 5 | Aqueduct and inverted siphon | Structure | 4 m concrete channel on piers with a siphon crossing a canyon; flow velocity 1.2 m/s shown by drifting surface texture | Yes: connect |
| 6 | Treatment plant nodes | Actor | Four sequential nodes: bar screen, flocculation basin with paddle mixers, sand filter bed, chlorine contact tank; each has its own residence time | Yes: place |
| 7 | Pump station | Actor | Three centrifugal pumps in a shed, kWh meter on the wall; lifts water 140 m and adds energy that shows on the joule tracer | Yes: connect |
| 8 | Hilltop storage tank | Structure | 8 million litre welded steel tank on a ridge, level gauge on the side; the buffer that decouples supply from demand | No |
| 9 | School plumbing and fountain | Actor | Service line, meter, riser, and a drinking fountain in cutaway; consumption follows the school-day schedule | Yes: place |
| 10 | Student body node | Actor | Simple body outline showing where drunk water goes: blood, sweat, breath vapour, urine; splits the tracer's onward path | No |
| 11 | Sewer and wastewater plant | Actor | Gravity sewer, then screening, aeration basins with churning surface, clarifier with a rotating arm and a returning sludge line | Yes: place |
| 12 | Outfall, bay and cloud | Environment | Diffuser pipe on the bay floor, then evaporation arrows to a drifting cloud that closes the loop back to the snowfield | No |
| 13 | Water tracer particle | Particle | Numbered magenta droplet, 6 px, leaves a fading trail; obeys the same flow field as the bulk water, with a random draw at every branch | Yes: place |
| 14 | Energy tracer particle | Particle | Orange token labelled 1 J; at every node a slice of it turns dull red and drifts away as waste heat, so the token visibly shrinks and dims | Yes: place |
| 15 | Path log | Instrument | Scrolling record: node entered, arrival time, residence time, transformation applied, energy remaining | No |
| 16 | Node inspector | UI-Probe | Click any node to open its stock, inflow, outflow, mean residence time and current tracer count | Yes: drag |

**How it works — the model.**
A directed flow network of 18 nodes, each a stock with an inflow, an outflow and a computed residence time equal to stock divided by outflow. Bulk flows are solved first, so the reservoir genuinely holds water for years while the pipe holds it for minutes. Tracers are then advected as agents: at each node a tracer waits a time drawn from that node's residence distribution, then takes an exit branch with probability proportional to that branch's flow. Matter tracers are never destroyed, only moved, and the loop through evaporation and snowfall closes, so a water tracer can return to its starting node. Energy tracers behave differently by design: at every node a fixed fraction of the token is converted to low-grade heat and removed to the environment, and the token cannot be recycled back into the network. That asymmetry is the entire lesson, so the engine must never let an energy tracer complete a loop.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Tracer type | Radio | Water molecule / Joule of energy / Both | Water molecule | — | Which kind of tagged packet is released and logged |
| Release point | Dropdown | Snowpack / Reservoir / Aqueduct / Treatment plant / School fountain / Sewer / Bay | Snowpack | — | Where the tracer enters the network |
| Number of tracers | Stepper | 1–200 | 1 | tracers | One tells a story; two hundred reveal the spread of paths and times |
| Snowmelt rate | Slider | 0–120 | 35 | m³/s | Inflow to the reservoir and therefore reservoir residence time |
| Pump station power | Slider | 0–2500 | 900 | kW | Energy added to the water, visible as a step on the joule tracer |
| School demand | Slider | 0–60 | 18 | m³/day | Outflow rate at the school and how often a tracer is drawn through it |
| Aqueduct leak | Slider | 0–25 | 0 | % of flow | Diverts a share of flow to a soil node, adding a branch the tracer can take |
| Show residence times | Toggle | On / Off | Off | — | Prints each node's mean residence time on the scene |
| Energy quality shading | Toggle | On / Off | On | — | Fades the joule token from bright orange to dull red as it degrades |
| Time compression | Dial | 1×–100000× | 20000× | — | Simulated hours per real second, enough to run multi-year reservoir storage |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One drop, whole journey | tracer=Water molecule; release=Snowpack; count=1; time=20000× | List every node the drop passes through in order. How many days from snow to bay, and where did it wait longest? |
| S2 | Two hundred drops | tracer=Water molecule; count=200; release=Snowpack | The drops started together. Why do their arrival times at the school differ by years rather than hours? |
| S3 | One joule, same route | tracer=Joule of energy; release=Snowpack; shading=On; pump=900 | Follow the token to the outfall. How much of the original joule is still useful, and what is the rest now? |
| S4 | The leaky aqueduct | leak=20; tracer=Both; count=50 | A fifth of the flow is lost. Where do the lost tracers actually end up, and does any water disappear? |

**Student activities.**
1. Release one water tracer at the snowpack and copy the path log: every node, its arrival time and its residence time.
2. Release 200 tracers at once and record the earliest and latest arrival at the school fountain. Sketch the spread.
3. Switch to an energy tracer from the same release point and record the token's remaining value at the turbine, the pump station, the school and the outfall.
4. Set the aqueduct leak to 20 % and run 50 tracers. Record how many reach the school and where the others finished.
5. Run a water tracer for a full simulated cycle and record whether it can return to the snowpack. Repeat with an energy tracer and record the result.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Path log | Data table | mixed | Node, arrival time, residence time, transformation, energy remaining, for the selected tracer |
| Arrival time distribution | Bar chart | days | Histogram of when a batch of tracers reaches the chosen node |
| Node residence times | Data table | h or years | Stock divided by outflow for all 18 nodes, updating with the flow settings |
| Energy remaining | Line graph | J | The tracer token's value against distance along the network; a staircase down |
| Waste heat released | Counter | J cumulative | Total energy shed to the environment so far on this run |
| Tracer census | Live numeric | count | How many tracers are currently in each node |
| Loop closed | Pass-fail badge | — | Green for a matter tracer that returns to its start; permanently grey for an energy tracer |
| Run log | Data table | mixed | Exportable CSV of every tracer's full path and timing |

**What the student should realise.**
Students say energy is "used up", and they picture water as vanishing once it goes down a drain. Tagging one droplet shows it circling from snow to bay to cloud to snow again with nothing lost, while the tagged joule dwindles at every step into heat that never comes back. Matter cycles; energy flows through once and degrades. The student should be able to say: *"The same water comes back around, and the same energy never does."*

### A2.5 · Choosing a boundary for a purpose

**Experiment name:** The Zero-Emission Bus Argument  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model + Agent-based  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS3-3

**Theme & scene.**
A working analyst's dashboard in cool slate and paper white, alive rather than static. Down the left, a narrow live map strip of a Fresno school bus route: 22 km, fourteen stops, three electric buses and one diesel bus crawling through a compressed school day. Across the centre, a horizontal lifecycle chain of seven boxes from lithium mine to battery recycling, with animated flow arrows whose widths breathe as the day runs. Over the chain lies a resizable dashed boundary frame with corner handles; boxes inside are crisp and counted, boxes outside desaturate to grey and their flows become unlabelled arrows entering the frame. Top centre, a question card. Right, the ledger and the claim builder. A hard-edged fit badge sits beside the question, red, amber or green.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Route map strip | Environment | 22 km loop drawn schematically over a Fresno street grid, 14 stops as pins, an elevation ribbon underneath, a moving time-of-day marker | No |
| 2 | Electric bus agents | Actor | Three buses, 155 kWh pack each, 1.1 kWh/km consumption, animated along the route; state of charge shown as a filling bar over each icon | Yes: place |
| 3 | Diesel bus agent | Actor | One comparison bus, 32 L/100 km, animated grey tailpipe plume that thickens on the uphill segment | Yes: swap |
| 4 | Depot charger and meter | Actor | 150 kW charger with a schedulable window and a kWh meter that spins only while charging | Yes: connect |
| 5 | Grid mix ribbon | Overlay | Hourly California generation stack: solar, wind, hydro, gas, imports; drives a live gCO₂ per kWh figure that dips at midday and spikes after sunset | No |
| 6 | Lifecycle chain nodes | Structure | Seven boxes: lithium mine, cell factory, bus assembly, depot charger, route operation, battery second life, recycling; each carries energy, CO₂, cost and pollutant values with uncertainty bands | Yes: place |
| 7 | Flow arrows between nodes | Overlay | Arrow width ∝ mass or energy moved; arrows crossing the boundary frame render as bold entering or leaving arrows with a crossing tag | No |
| 8 | Boundary frame | UI-Probe | Dashed white rectangle with four corner handles, snapping to node edges; can enclose any contiguous run of the chain | Yes: resize |
| 9 | Question card deck | UI-Probe | Six cards, each stating one question and carrying a hidden list of the quantities needed to answer it; a card is dragged onto the board to arm the run | Yes: drag |
| 10 | Fit badge | Instrument | Compares the question's required quantities against what the current boundary encloses; green if all inside, amber if partly, red if a required quantity is outside | No |
| 11 | Ledger panel | Overlay | Totals inside the current boundary: energy, CO₂, running cost, NOx and PM2.5, each with an uncertainty range | No |
| 12 | Claim builder | UI-Probe | Three slots: claim, evidence rows dragged from the ledger, and the boundary used; scores whether the evidence can support the claim under that boundary | Yes: drag |
| 13 | Neighbourhood air probe | Instrument | A sensor pin dropped beside the school gate reading PM2.5 in µg/m³ as buses arrive and depart | Yes: place |
| 14 | Time-of-day scrubber | UI-Probe | 00:00 to 23:00 handle that drives the grid mix, the route and the charging window together | Yes: drag |
| 15 | Uncertainty band overlay | Overlay | Grey whiskers on every ledger figure showing the plausible range, so a difference smaller than the band is flagged as not a difference | No |
| 16 | Boundary comparison tray | Instrument | Holds up to four saved boundary and question pairs side by side for direct comparison | Yes: place |

**How it works — the model.**
Two coupled models feed one accounting engine. The route model is agent-based: each bus consumes energy per kilometre with a gradient and stop-frequency correction, drains its pack, and returns to the depot to charge in the chosen window. The lifecycle model is a static inventory per node, in kWh, kg CO₂, dollars and grams of pollutant per bus-year, each with an uncertainty band. The accounting engine sums only what the boundary frame encloses, exactly as in a real life-cycle assessment. The grid mix is a real hourly California profile, so charging at 13:00 draws mostly solar and charging at 19:00 draws mostly gas, and the same boundary yields different answers at different hours. The fit badge is the heart of it: every question card declares the quantities it needs, and the badge is computed, not scripted. A claim scored on a red boundary is rejected however true it happens to be.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Question card | Dropdown | Air outside our school / Total CO₂ over the year / CO₂ in the first year / Cheaper to run / Where does the pollution move to / Is the electricity clean when we charge | Air outside our school | — | Which question the run must answer, and which quantities the badge demands |
| Boundary preset | Dropdown | Tailpipe only / Bus and charger / Bus, charger and power plants / Whole life cycle / Custom | Tailpipe only | — | Jumps the frame to a saved span of the chain |
| Boundary frame | Drag-handle | Any contiguous run of the 7 chain nodes | Route operation only | — | Which nodes are counted; everything outside greys out and becomes a crossing |
| Charging window | Timeline scrubber | 00:00–23:00 | 22:00 | h:mm | Which hourly grid mix the depot draws, which sets gCO₂ per kWh |
| Grid scenario | Dropdown | California average / Sunny midday / Evening peak / Rooftop solar depot | California average | — | The generation mix behind every kWh the buses use |
| Fleet size | Stepper | 1–40 | 12 | buses | Scales every ledger figure and the depot load together |
| Bus service life | Slider | 4–18 | 12 | years | How far the manufacturing burden is spread, which moves the break-even year |
| Comparison vehicle | Dropdown | 2008 diesel / 2020 diesel / Compressed natural gas / Electric | 2020 diesel | — | The baseline the electric fleet is measured against |
| Ledger metrics | Multi-select | CO₂ / Energy / Running cost / NOx / PM2.5 | CO₂, PM2.5 | — | Which totals the ledger reports for the enclosed nodes |
| Uncertainty bands | Toggle | On / Off | On | — | Shows the plausible range on every figure and flags false differences |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The right small boundary | question=Air outside our school; boundary=Tailpipe only; probe placed at the gate | The badge is green and the answer is zero. Why is a tiny boundary the correct one for this question? |
| S2 | The same boundary, a new question | question=Total CO₂ over the year; boundary=Tailpipe only | The badge turns red. Name the quantity the question needs that this boundary leaves outside. |
| S3 | The whole life cycle | question=CO₂ in the first year; boundary=Whole life cycle; life=12 | The answer flips to no. Move the service life slider and find the year in which the electric fleet breaks even. |
| S4 | Charge at noon | question=Is the electricity clean when we charge; boundary=Bus, charger and power plants; charging=13:00 then 19:00 | The boundary never moves. Why does the answer change by a factor of three? |

**Student activities.**
1. Drag the "Air outside our school" card onto the board with the tailpipe boundary. Record the badge colour, the PM2.5 reading and your answer.
2. Keep the boundary and swap to the "Total CO₂" card. Record the badge colour and write down exactly which node sits outside the frame.
3. Widen the frame node by node until the badge turns green. Record the smallest boundary that can answer the question.
4. Set the whole-life-cycle boundary and step the service life from 4 to 18 years. Record the break-even year against the 2020 diesel baseline.
5. Build a claim in the claim builder with three evidence rows and the boundary you used. Record the score and the reason given if it is rejected.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Ledger totals | Data table | kg CO₂, kWh, $, g NOx, g PM2.5 | Totals for the enclosed nodes only, each with an uncertainty range |
| Boundary fit | Pass-fail badge | — | Green, amber or red, computed from the question's required quantities against the frame |
| Nodes inside vs outside | Counter | count | How many of the seven chain nodes the frame currently encloses |
| Gate air quality | Live numeric | µg/m³ | PM2.5 at the school gate probe as buses arrive and leave |
| Grid carbon intensity | Line graph | gCO₂/kWh | Hourly California profile with the charging window shaded |
| Break-even year | Live numeric | years | When cumulative electric emissions fall below the comparison vehicle's |
| Claim score | Pass-fail badge | — | Whether the selected evidence can support the claim under the stated boundary |
| Comparison tray | Data table | mixed | Up to four saved question and boundary pairs side by side, exportable as CSV |

**What the student should realise.**
Students look for the one correct boundary. Here the tailpipe boundary is exactly right for air at the school gate and exactly wrong for yearly carbon, and both facts are true at once. A boundary is fit for a purpose, not true or false, and every claim carries the boundary that produced it. The student should be able to say: *"Before I answer, I have to say where I drew the line and why that line fits this question."*

## A3 · Models of systems

### A3.1 · Why scientists build models

**Experiment name:** The Experiment You Cannot Run  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ETS1-4

**Theme & scene.**
A dim field station at dusk. Along the back wall stand four armoured cases holding systems the student may watch but never touch: a Sierra snowpack under a frosted dome, a magma chamber glowing beneath a sectioned block of Long Valley, a redwood seedling in a pot with a 90 m adult ghosted behind it, and a near-Earth asteroid turning slowly on a wire. Red lamps above each case read TOO SLOW, TOO BIG, TOO DANGEROUS, TOO FAR, whichever apply. Facing them, warmly lit and open to the hands, is the model bench: a turntable, a glass tank, a whiteboard and a laptop. One clock hangs between the halves with two faces, real time on the left, model time on the right. Control panel docks right, cost meter above it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reality case | Structure | 1.2 m armoured vitrine, 40 mm laminated glass, brushed steel frame, interlocked door that never opens; four instanced along the back wall | No |
| 2 | Sierra snowpack specimen | Actor | 2 m × 2 m slab of layered snow on granite, 6 visible strata from November crust to April firn, melts at the true seasonal rate, meltwater trickles into a weir | No |
| 3 | Long Valley magma chamber | Actor | Sectioned rock block 3 m tall, rhyolite melt lens glowing 780 °C orange at 6–8 km depth, crystal mush rim, convection cells drifting at 1 cm/year | No |
| 4 | Coast redwood pair | Actor | Potted 30 cm seedling in the foreground, 90 m adult ghosted at 20 % opacity behind, growth ring counter reading 0 and 1,240 years | No |
| 5 | Near-Earth asteroid | Actor | 340 m irregular basalt body on a gimbal, 4.2 h rotation, orbit trace drawn as a faint ellipse crossing Earth's | No |
| 6 | Barrier lamp cluster | Instrument | Four red lamps per case labelled TOO SLOW / TOO BIG / TOO DANGEROUS / TOO FAR; lit lamps dim one by one as a model removes each barrier | No |
| 7 | Ground-truth engine | Field | Invisible state model per case, run once, irreversibly, at 1× real time; supplies the answer the student is eventually graded against | No |
| 8 | Reality sensor set | Instrument | Surface-only probes: snow stake, satellite pass every 16 days, thermal camera, one seismometer, one telescope; each reads a single number, never a cross-section | Yes: place |
| 9 | Scale-model turntable and tank | Structure | 60 cm turntable and 40 L glass tank on the model bench, holds sand, ice, dyed water or wax depending on the case | Yes: swap |
| 10 | Computational model laptop | Instrument | Open laptop showing the case's equations as editable blocks; runs the same state model with adjustable process count and speed | Yes: swap |
| 11 | Mathematical model whiteboard | Instrument | Whiteboard carrying two or three relations for the case, for example melt = degree-day factor × positive degrees; solvable in one step | Yes: swap |
| 12 | Analogue model tray | Structure | Tray of stand-ins: flour and a marble for impact, a heat lamp over corn syrup for convection, a fan over a sand ridge for drift | Yes: swap |
| 13 | Dual-face clock | Instrument | Wall clock with two dials, real time fixed at 1×, model time driven by the compression dial, both showing elapsed days | No |
| 14 | Rewind lever | UI-Probe | Brass lever on the model bench, throws freely; the identical lever on the reality wall is welded solid and rings when pulled | Yes: drag |
| 15 | Cross-section knife | UI-Probe | Cutting plane that slices any model object open; refuses to cross the vitrine glass | Yes: drag |
| 16 | Prediction card and error meter | Overlay | Index card the student writes a numeric prediction on before running, then a needle gauge showing prediction minus outcome | Yes: place |

**How it works — the model.**
Both tracks run the same governing state model for the selected case, so the comparison is honest. The reality track runs at 1× with process noise, exposes only the sensors the student has placed, and can be run exactly once. The model track runs the same equations with three levers: a process count from 1 to 10, which switches terms on in order of importance; a time compression dial; and a repeat count, which reruns with fresh noise draws to give a spread rather than a single answer. Each medium adds its own systematic bias term: scale models carry a distortion offset, mathematical models carry a truncation error, analogue models carry a material mismatch. Error therefore falls with more processes but never reaches zero. The failure to avoid is a model that is simply reality at high speed. It must visibly get things wrong, and the student must be able to say which barrier it removed in exchange.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reality case | Dropdown | Sierra snowpack / Long Valley magma / Coast redwood / Near-Earth asteroid | Sierra snowpack | — | Which system is behind the glass, which barrier lamps light, and which ground truth runs |
| Model medium | Dropdown | None / Scale physical / Computational / Mathematical / Analogue | None | — | What appears on the model bench and which bias term applies |
| Processes included | Slider | 1–10 | 4 | count | How many terms of the state model the model track computes |
| Model time compression | Dial | 1×–1,000,000× | 1,000× | — | Simulated days per real second on the model track only |
| Repeat runs | Stepper | 1–50 | 1 | runs | How many times the model is rerun with new noise; reality stays locked at one |
| Reality sensors | Multi-select | Snow stake / Satellite pass / Thermal camera / Seismometer / Telescope | Snow stake | — | Which single numbers the sealed case will give up |
| Rewind | Toggle | On / Off | Off | — | Enables rewind on the model track; stays locked off for reality |
| Cut open | Toggle | On / Off | Off | — | Slices the model object to expose its interior |
| Lab time allowed | Slider | 1–72 | 8 | h | Budget the run consumes; long real-time waits exhaust it |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Ask reality | case=Sierra snowpack; medium=None; sensors=Snow stake; repeat=1; rewind=Off | How long must you wait for the melt-out date, and how many times can you repeat the season to check it? |
| S2 | Speed it up | case=Sierra snowpack; medium=Computational; processes=6; compression=1,000,000×; repeat=30 | Thirty melt seasons finish in two minutes. What is the spread of melt-out dates, and what did one run hide? |
| S3 | Cut it open | case=Long Valley magma; medium=Scale physical; cut open=On; repeat=5 | What can you see inside the model that no instrument on the real chamber can show, and what does the model get wrong? |
| S4 | Never touchable | case=Near-Earth asteroid; medium=Mathematical; sensors=Telescope; processes=3; repeat=50 | You cannot experiment on this object at all. How can two equations still give a miss distance you would bet on? |

**Student activities.**
1. Run S1 with no model and record the elapsed real time on the left clock when the melt-out date finally arrives, plus how many repeats you got.
2. Write a melt-out date on the prediction card, then run the computational model 30 times and record the earliest, latest and most common date.
3. Swap the medium to Scale physical, cut the model open, and list two things you can now measure that the sensors on the sealed case cannot reach.
4. Pull the rewind lever on the reality wall, then on the model bench, and record what each one does.
5. For each of the four cases, record which barrier lamps the model switched off and which one it could not.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Prediction error | Live numeric | days or km | Prediction minus the ground-truth outcome, shown once reality resolves |
| Answer spread | Bar chart | count per bin | Histogram of results across repeat runs; a single run has no spread at all |
| Time to answer | Timer | h | Real-track and model-track elapsed time side by side |
| Barriers removed | Counter | count | How many of the four red lamps this model configuration switched off |
| Bias contribution | Data table | days or km | Systematic error added by the chosen medium at the chosen process count |
| Run log | Data table | mixed | Exportable CSV: case, medium, processes, repeats, prediction, outcome, error |

**What the student should realise.**
Students think a model is a small copy built to show what something looks like. Here the real snowpack melts once, at its own pace, and yields only surface readings; the model runs thirty times, a million times faster, and can be cut in half. A model exists to let you do what reality forbids. The student should be able to say: *"We model what we cannot rewind, reach, or risk."*

### A3.2 · Diagrams and flowcharts as models

**Experiment name:** The Diagram That Runs  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Agent-based  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS3-3

**Theme & scene.**
The screen splits down the middle. Left is a small, warm, working plant: the drinking-water treatment works of a Sierra foothills town of 12,000, drawn as a low three-quarter cutaway with the canal intake, the alum doser ticking, paddles turning in the floc basin, sludge settling brown in the sedimentation tank, and a sand filter whose bed you can see through. Right is a cold blue drafting grid with a palette of empty shapes down its edge: rounded terminators, rectangles, diamonds, parallelograms, tanks, arrows. The student's diagram lives there. When Run is pressed a small white token enters the diagram and walks it, one shape at a time, while the real plant runs the same minute beside it. Control panel sits along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Canal intake and bar screen | Actor | Concrete headworks with a 20 mm steel bar rack, weed and leaf debris catching on it and raking off every 40 s | No |
| 2 | Coagulant doser | Actor | 200 L alum tank with a peristaltic pump, dose rate 5–90 mg/L, drip visible in a sight glass, level falls as it runs | Yes: swap |
| 3 | Flocculation basin and paddles | Actor | 8 m × 4 m basin, three paddle banks at 3–15 rpm, floc particles growing from specks to 2 mm snow over 20 min | No |
| 4 | Sedimentation tank and sludge blanket | Structure | 25 m rectangular tank, inclined plate pack, brown blanket thickening on the floor, scraper crawling at 2 cm/s | No |
| 5 | Rapid sand filter bed | Actor | 1 m of graded sand over gravel in a glass-walled box; a headloss column beside it rises from 0.2 m to 2.5 m as the bed loads | No |
| 6 | Backwash pump and waste line | Actor | Reversing pump and a grey waste pipe; fires only if the diagram contains a loop back to the filter | Yes: connect |
| 7 | Chlorine contact tank | Structure | Serpentine baffled tank giving 30 min contact, dosing point with a residual probe at the outlet | No |
| 8 | Clearwell and distribution pumps | Structure | Buried 4 ML clearwell with a level gauge and two pumps feeding the town main | No |
| 9 | Water parcel tokens | Particle | 1,000 L parcels, colour-coded by turbidity from mud brown to clear blue; carry their own state through every step | No |
| 10 | Diagram canvas | Environment | Snap grid, 24 px pitch, cold blue, holds the student's shapes and arrows | Yes: resize |
| 11 | Shape palette | UI-Probe | Terminator, process box, decision diamond, input/output parallelogram, stock tank, off-page connector; drag out to instantiate | Yes: place |
| 12 | Flow arrows | Structure | Directed connectors that snap to shape ports; decision diamonds require two labelled exits or they refuse to close | Yes: connect |
| 13 | Token walker | Actor | Execution head that highlights the shape it is in, pauses 0.4 s, and takes the branch the diagram tells it to | No |
| 14 | Reality event log | Instrument | Ground-truth trace from the plant: a timestamped list of every real step and decision the water actually went through | No |
| 15 | Trace diff overlay | Overlay | Draws the reality trace beside the diagram trace, green where they match, amber for a missing step, red for a wrong branch | No |
| 16 | Notation switcher | UI-Probe | Redraws the same plant as flowchart, cycle diagram, cross-section schematic or single black box | Yes: swap |

**How it works — the model.**
The diagram is not a picture of the model, it is the model. Shapes compile to states, arrows to transitions, diamonds to conditional branches evaluated on the token's own state: turbidity in NTU, chlorine residual in mg/L, filter headloss in metres. Each token entering a process box has that box's real transfer function applied, for example sedimentation removing 60–90 % of turbidity as a function of floc size and residence time. The plant on the left runs the same physics from its own hard-wired process order, and every token it passes writes a line to the reality event log. On Run, the two traces are aligned step by step and scored. A diagram missing the headloss diamond keeps pushing water through a clogged bed until throughput collapses; a diagram missing the backwash loop can never recover. Nothing is scored on neatness. It is scored on whether the arrows predict what the plant does.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Notation | Dropdown | Flowchart / Cycle diagram / Cross-section schematic / Black box | Flowchart | — | Which kind of model the canvas builds and which questions it can answer |
| Available shapes | Multi-select | Terminator / Process / Decision / Input-output / Stock tank / Loop-back arrow | All six | — | Which symbols the palette offers; removing one makes some systems undrawable |
| Raw water turbidity | Slider | 0.5–120 | 3.0 | NTU | How dirty the incoming canal water is, and which branches must exist |
| Town demand | Slider | 1–40 | 12 | ML/day | Token release rate and how fast the clearwell drains |
| Run mode | Radio | Step one token / Continuous / Fast 24 h | Step one token | — | Whether the walker moves on click, in real time, or over a compressed day |
| Fault injection | Dropdown | None / Filter clogged / Doser empty / Power cut / Algal bloom | None | — | Injects a real plant fault that only a correctly branched diagram survives |
| Show reality trace | Toggle | On / Off | On | — | Displays the plant's own event log beside the diagram trace |
| Auto-check arrows | Toggle | On / Off | Off | — | Flags dangling arrows and unlabelled diamonds before the run |
| Diagram time compression | Dial | 1×–2,000× | 60× | — | Simulated minutes per real second for both panes |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Draw the works | turbidity=3.0; demand=12; run mode=Step one token; show reality trace=On | Draw the plant as a flowchart, run one token, and report what percentage of your steps match the reality trace. |
| S2 | Muddy river day | turbidity=90; demand=12; fault=None | The raw water goes brown. Which decision diamond does your diagram need, and what reaches the town without it? |
| S3 | The missing loop | fault=Filter clogged; available shapes=all except Loop-back arrow | Throughput falls to zero and stays there. Which single shape would fix it, and why is a straight-line diagram wrong here? |
| S4 | Four ways to draw one plant | notation=Cycle diagram, then Cross-section schematic, then Black box | Ask "where does the sludge go?" of each notation. Which ones can answer it, and what did each drop to stay readable? |

**Student activities.**
1. Drag out shapes and connect them into a flowchart of the plant, then run one token and record your trace match percentage.
2. Set turbidity to 90 NTU, run again, and record the outlet turbidity before and after you add a coagulant decision diamond.
3. Inject the filter-clogged fault and record throughput each minute for ten minutes, first without a loop-back arrow and then with one.
4. Redraw the same plant as a cycle diagram and as a black box; record for each which of three questions it can answer.
5. Delete one arrow of your choice, predict which token step will break, run, and record whether you were right.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Trace match | Live numeric | % | Fraction of reality-log steps that the diagram's token path reproduced in order |
| Water delivered | Line graph | ML/day | Throughput to the town over the run, per diagram version |
| Outlet turbidity | Live numeric | NTU | Final token turbidity, red above 1.0 NTU |
| Unmatched steps | Data table | — | Named list of missing steps and wrong branches, one row each |
| Deadlock check | Pass-fail badge | — | Green if every token reaches a terminator, red if any token stalls or loops forever |
| Diagram complexity | Counter | shapes | Number of shapes and arrows used, so a working simple diagram beats a working cluttered one |

**What the student should realise.**
Students treat a diagram as a picture that decorates an explanation. Here the arrows are executed, so a missing decision diamond sends untreated water into the town and a missing loop-back arrow leaves the filter clogged forever. The layout is a claim about order and dependency, and it can be wrong. The student should be able to say: *"A flowchart is a model, and its arrows are predictions I can test."*

### A3.3 · Physical and digital models

**Experiment name:** Two Bays: The Warehouse and the Solver  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ETS1-4

**Theme & scene.**
A vast Sausalito warehouse, skylit and echoing. Underfoot, 1.5 acres of concrete San Francisco Bay: the Golden Gate, the two bay lobes, Carquinez Strait, Suisun Bay and the Delta out to Stockton, all filled with real water that glints under the roof lights. Horizontal scale is 1:1000 and vertical scale 1:100, so the vertical exaggeration is 10× and the shallows look like canyons. Thousands of copper roughness strips bristle from the shallows. At the seaward end a tide machine sighs once every 14.9 minutes, one full lunar day. A steel walkway crosses the model; a monitor on a trolley shows the same Bay as a grid of coloured cells. Controls dock right; a dye bottle follows the cursor.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Concrete bay basin | Environment | 320 modelled bathymetry panels forming the Bay and Delta, 1:1000 horizontal, 1:100 vertical, painted grey-green, water depth 1–12 cm | No |
| 2 | Tide machine | Actor | Hydraulic plunger at the seaward end, stroke adjustable, one cycle every 14.9 min representing a 24.8 h lunar day, audible sigh at each turn | No |
| 3 | Copper roughness strips | Structure | 250,000 vertical copper tabs 15 mm high, instanced across the shallows, tuning friction so the model's tidal timing matches the real Bay | Yes: place |
| 4 | Delta inflow header | Actor | Pump manifold at Stockton and Sacramento ends delivering scaled Sacramento and San Joaquin river flow, flowmeter dial visible | No |
| 5 | Dye and dye ports | Particle | 40 brass ports; green fluorescein for tracing, red rhodamine for a second release; plumes stretch and fold with the tide | Yes: place |
| 6 | Salinity probe gantry | Instrument | Rolling gantry with five conductivity probes lowering on cables at Golden Gate, Richmond, Carquinez, Antioch and Rio Vista | Yes: drag |
| 7 | Reber Plan barrier blocks | Structure | Two placeable earth-fill dam blocks, one across the north bay and one across the south, each with a lock and a highway deck moulded on | Yes: place |
| 8 | Dredged channel tool | Structure | Removable insert cutting a 15 m deep, 200 m wide shipping channel through Suisun Bay | Yes: swap |
| 9 | Digital grid field | Field | Finite-volume mesh over the same Bay, cell size 50–2000 m, each cell carrying depth, velocity, salinity; drawn as a false-colour skin on the monitor | Yes: resize |
| 10 | Digital solver panel | Instrument | Shows equations being stepped, cell count, time step and wall-clock cost per simulated day | No |
| 11 | Digital tracer field | Field | Numerical dye concentration advected on the grid, plotted as contours to compare with the physical plume | No |
| 12 | Field observation dataset | Instrument | Real station records for the five sites: tidal range, salinity, slack-water timing; the arbiter both models are judged against | No |
| 13 | Scale-effect overlay | Overlay | Amber wash marking where the physical model misleads: surface tension at millimetre depths, 10× vertical exaggeration, warm indoor water | No |
| 14 | Comparison chart panel | Overlay | Three-series plot, physical vs digital vs field, one panel per station | No |
| 15 | Surprise log | Overlay | Auto-logged list of behaviours seen in the water that no line of the digital model produces, for example a standing eddy behind a barrier | No |
| 16 | Observation walkway | Structure | Steel grating bridge with handrail crossing the model at Carquinez; the camera can be parked on it | Yes: drag |

**How it works — the model.**
The physical basin is real shallow-water flow at 1:1000, tuned with copper roughness until its tidal timing matches the field record; it therefore produces eddies, salt wedges and sediment fans that nobody wrote down. The digital model solves depth-averaged continuity and momentum plus a salt advection-diffusion equation on the chosen mesh, stepping at a stability-limited time step, so its cost rises steeply as cells shrink. Both are compared against the same field dataset. The physical model carries scale distortions that are stated openly: with 10× vertical exaggeration, slopes are ten times too steep, and at millimetre depths surface tension and viscosity matter far more than they do in the real Bay. The digital model has no such distortion but contains only what was programmed. The whole point is that neither is "the real Bay", and each fails in its own characteristic direction.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Model in use | Radio | Physical / Digital / Side-by-side | Side-by-side | — | Which basin, monitor, or both are driving the run |
| Delta inflow | Slider | 100–3,000 | 700 | m³/s | Combined Sacramento and San Joaquin freshwater flow, scaled to the basin |
| Tide amplitude | Slider | 0.0–2.0 | 1.2 | m | Tide machine stroke and the digital boundary forcing |
| Barriers and channels | Multi-select | None / Reber north dam / Reber south dam / Dredged 15 m channel | None | — | Places physical blocks and edits the digital bathymetry to match |
| Dye release point | Drag-handle | Any of 40 ports | Golden Gate | — | Where the tracer plume starts in both models |
| Digital cell size | Slider | 50–2,000 | 200 | m | Mesh resolution, solver cost, and whether Carquinez Strait exists as more than one cell |
| Run length | Slider | 1–30 | 14 | tidal days | How long both models are run before the salt front is read |
| Scale-effect overlay | Toggle | On / Off | Off | — | Marks where the physical model's distortions dominate |
| Digital speed | Dial | 1×–100,000× | 5,000× | — | Simulated seconds per real second on the solver only |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Same question, two models | model=Side-by-side; inflow=700; tide=1.2; run length=14 | Where does the salt front sit in each model after 14 tidal days, and which is closer to the field stations? |
| S2 | Test the Reber Plan | barriers=Reber north dam, Reber south dam; inflow=700 | Two dams are meant to make fresh-water lakes. What happens to flushing and salinity behind them? |
| S3 | Cheap and coarse | model=Digital; cell size=2,000; inflow=200 | The strait is now narrower than one cell. How far does the salt front move, and can you trust the number? |
| S4 | Where the water lies | model=Physical; scale-effect overlay=On; inflow=100 | Which observed behaviours are real Bay physics, and which are artefacts of 10× exaggeration and centimetre depths? |

**Student activities.**
1. Run S1 and record salt front position and salinity at all five stations for the physical model, the digital model and the field dataset.
2. Place both Reber dams, run 14 tidal days, and record salinity and dye clearance time behind each dam.
3. Step the digital cell size through 50, 200, 800 and 2,000 m and record the salt front position and the solver cost at each.
4. Release dye at the Golden Gate in both models and record every behaviour listed in the surprise log that the digital model did not reproduce.
5. Turn on the scale-effect overlay and name two measurements you would refuse to take from the physical model, with a reason for each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Salt front position | Live numeric | km from Golden Gate | Location of the 2 PSU contour in each model, updated each tidal cycle |
| Salinity at five stations | Line graph | PSU | Three series per station: physical, digital, field observation |
| Tracer clearance time | Live numeric | h | Time for peak dye concentration to fall by 90 % at the release point |
| Agreement chart | Bar chart | PSU error | Absolute error against field data for each model at each station |
| Surprises | Counter | count | Behaviours logged in the physical model with no counterpart in the digital output |
| Cost to answer | Data table | mixed | Solver wall-clock seconds, cells, and physical model run time per scenario |

**What the student should realise.**
Students rank models as more or less realistic, with the computer at the top. Here the concrete Bay throws eddies nobody programmed but lies about slopes and surface tension, while the solver is undistorted yet contains only what was typed in. Both miss, in opposite directions. The student should be able to say: *"A physical model can surprise me and a digital model cannot, but only the digital one lets me change the Bay before lunch."*

### A3.4 · What a model leaves out on purpose

**Experiment name:** The Model That Flattened the Sierra  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Fluid/thermal  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-6

**Theme & scene.**
One landscape, drawn twice, with a draggable wipe between them. On the right is reality: California from Sacramento to Reno rendered from a 10 m elevation model, oak savanna rising into pine, granite crest, then the grey sagebrush drop into the Great Basin, with five instrument huts on their real sites. On the left is the model's world, the same landscape built from blocks whose size the student sets: at 200 km the Sierra is a single grey slab, at 4 km the crest and lee appear. A cold westerly stream of vapour parcels blows in over both. Below runs a modelling console: an omission ledger of process cards with checkboxes, a compute budget bar, and a scatter plot with a 1:1 line waiting to be filled.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reality terrain | Environment | 10 m DEM strip 260 km west to east, vertical exaggeration 3×, real land cover textures, unchangeable by the student | No |
| 2 | Model terrain blocks | Environment | The same strip rebuilt as flat-topped blocks at the chosen cell size, each block one averaged elevation; visibly rebuilds when the slider moves | Yes: resize |
| 3 | Wipe divider | UI-Probe | Vertical draggable seam with a grab handle, sweeping model over reality anywhere across the scene | Yes: drag |
| 4 | Vapour parcel stream | Particle | 2,000 translucent parcels entering from the west, each carrying water vapour in kg, speed set by the wind dial | No |
| 5 | Orographic lift field | Field | Vertical velocity field computed from wind crossing terrain slope; drawn as pale upward arrows when the process card is on | No |
| 6 | Condensation and cloud layer | Particle | Parcels turn opaque white above their lifting condensation level, thickening as they climb | No |
| 7 | Precipitation cells | Particle | Falling streaks, blue for rain, white six-point flakes for snow, chosen against the freezing level | No |
| 8 | Freezing level plane | Overlay | Horizontal translucent cyan sheet at the set altitude, cutting the terrain visibly at the snow line | Yes: drag |
| 9 | Rain gauge huts | Instrument | Five huts at Sacramento 8 m, Blue Canyon 1,610 m, Donner Summit 2,100 m, Truckee 1,800 m and Reno 1,340 m, each with a tipping bucket and a running total | Yes: place |
| 10 | Process cards | UI-Probe | Seven cards: terrain detail, orographic lift, rain-snow phase, valley evaporation, cloud microphysics, canopy interception, wind drift; each shows its compute cost | Yes: place |
| 11 | Omission ledger | Overlay | Two-column board, IN and LEFT OUT, with a reason field for each omitted card and its measured error cost | Yes: swap |
| 12 | Compute budget bar | Instrument | Horizontal bar of 100 units filling as cards and resolution are added; turns red past the limit and refuses the run | No |
| 13 | Model-vs-reality scatter | Overlay | Five points, modelled against observed annual precipitation, with a dashed 1:1 line and error bars | No |
| 14 | Error map | Overlay | False-colour ribbon over the terrain, blue where the model is too dry, red where too wet, grey within 10 % | No |
| 15 | Run timer | Instrument | Stopwatch showing solver seconds for the current configuration, so cheapness is visible | No |

**How it works — the model.**
A one-dimensional west-to-east moisture budget on the chosen grid. Each parcel carries vapour; where terrain rises, forced ascent cools it at 6 °C per km until saturation, and the excess falls out as precipitation, so the windward slope is wet by construction. Descending on the lee side, the parcel warms and dries and nothing falls, producing the rain shadow. Every process card switched off removes a term: no terrain detail averages elevation over the whole cell, so a 200 km cell has no crest to lift anything; no phase rule puts rain where snow belongs; no valley evaporation starves the parcels of the moisture the Central Valley returns. Ground truth is the 1991–2020 gauge normals, roughly 470 mm at Sacramento, 1,500 mm at Blue Canyon and 190 mm at Reno. The honest part is the compute budget: it is never large enough for everything, so omission is forced and must be argued for, not apologised for.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Grid cell size | Slider | 1–200 | 25 | km | How coarsely the terrain is rebuilt, and whether the crest exists at all |
| Processes included | Multi-select | Terrain detail / Orographic lift / Rain-snow phase / Valley evaporation / Cloud microphysics / Canopy interception / Wind drift | Terrain detail, Orographic lift, Rain-snow phase | — | Which terms the moisture budget computes; each has a compute cost |
| Compute budget | Slider | 10–200 | 100 | units | Total cost allowed; cards and fine grids must fit inside it |
| Storm strength | Slider | 100–1,200 | 400 | kg/m/s | Incoming vapour transport, the moisture available to fall out |
| Wind direction | Dial | 180–360 | 250 | ° | Angle of approach, and therefore which slopes are windward |
| Freezing level | Slider | 500–4,000 | 1,800 | m | Altitude of the rain-to-snow switch and the visible snow line |
| Wipe position | Drag-handle | 0–100 | 50 | % of width | Where the seam between model world and real world sits |
| Compare against | Dropdown | 1991–2020 normals / Feb 2017 storm / Dec 2021 storm | 1991–2020 normals | — | Which observed dataset the scatter plot is scored on |
| Terrain exaggeration | Slider | 1–10 | 3 | × | Vertical stretch of both terrains for legibility only |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A flat California | cell size=200; processes=none; storm=400 | With no mountains in the model, how much rain does it give Blue Canyon and Reno, and what do the gauges say? |
| S2 | Put the mountains back | cell size=4; processes=Terrain detail, Orographic lift, Rain-snow phase | What appears at Blue Canyon and disappears at Reno, and what is the windward to leeward ratio now? |
| S3 | Spend the budget | budget=100; choose any four cards; cell size=10 | You cannot afford all seven processes. Which four omissions cost you the least error, and why? |
| S4 | Storm of record | compare=Feb 2017 storm; storm=900; freezing level=2,700 | The model puts snow where the gauges recorded rain. Which omitted process explains the miss? |

**Student activities.**
1. Set the cell size to 200 km with all process cards off, run, and record modelled and observed precipitation at all five gauges.
2. Turn on terrain detail and orographic lift, drop the cell size to 4 km, re-run, and record the change in mean absolute error.
3. Fill the omission ledger: for every card you left out, write the reason and record the error cost the ledger reports for it.
4. Hold the budget at 100 units and find the cheapest configuration that keeps error under 150 mm; record the cards you kept.
5. Drag the wipe across the crest and describe, in one sentence, exactly what the model's world is missing there.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Precipitation at five gauges | Bar chart | mm/year | Paired modelled and observed bars for each station |
| Model vs reality scatter | Line graph | mm vs mm | Five points against a dashed 1:1 line; distance from the line is the error |
| Mean absolute error | Live numeric | mm | Averaged across the five stations, updated at the end of each run |
| Rain-shadow ratio | Live numeric | — | Blue Canyon divided by Reno precipitation, observed value close to 8 |
| Omission ledger | Data table | mm and units | One row per omitted process: reason given, compute saved, error added |
| Run time | Timer | s | Solver seconds for the current configuration |

**What the student should realise.**
Students assume a better model is one that includes more, and that leaving things out is cheating. Here the budget forbids everything, and a model with four well-chosen processes beats one with seven crammed onto a coarse grid. Omission is a design decision with a stated price. The student should be able to say: *"Every model leaves things out on purpose, and I should be able to name what mine left out and what that cost me."*

### A3.5 · Building and revising a model of a system

**Experiment name:** Three Versions of a Kelp Forest  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model (stock-and-flow) + Agent-based  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS2-4

**Theme & scene.**
The left half of the screen is underwater at Point Lobos: a giant kelp forest lit by green shafts, blades rocking on the swell, sardine flicker in the gloom, and off to one side a pale pink patch of bare rock crawling with purple urchins. Otters raft at the surface, silhouetted against the light. The right half is a pale drafting canvas holding nothing yet, with a block palette down its edge: square stocks, valved flow pipes, small circular converters, thin connectors and curved feedback links with a plus or minus at the head. Along the bottom runs a ribbon of ground truth, thirty-five years of measured canopy area with a violent trough after 2013. Controls dock right; the fit score sits above the canvas.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Giant kelp plant | Actor | 20 m stipes with 40 blades and gas-filled floats, jade to olive, growing up to 0.4 m/day; canopy thins to bare stipes as biomass falls | No |
| 2 | Holdfast and rocky reef | Structure | Granite reef at 12 m with 25 cm branching holdfasts; a detached holdfast leaves a pale scar the model counts as lost habitat | No |
| 3 | Purple urchin agents | Actor | 6 cm spiny hemispheres, up to 4,000 instanced, crawl at 1 cm/s toward kelp, mass into a visible barren front when food runs out | Yes: place |
| 4 | Sea otter agents | Actor | 1.2 m rafting bodies, 6–60 instanced, dive on a 90 s cycle, surface with an urchin and a rock, tool-tapping animation | Yes: place |
| 5 | Sunflower sea star | Actor | 60 cm twenty-armed star, ochre, creeping at 0.2 cm/s; removed from the scene entirely by the wasting shock | Yes: place |
| 6 | Sea temperature field | Field | Invisible scalar over the reef, 9–20 °C, drives kelp growth through a nutrient proxy; drawn as a thermal wash when the overlay is on | No |
| 7 | Model canvas | Environment | Snap grid, warm white, holds the student's blocks; blocks refuse to connect if the units on the two ends disagree | Yes: resize |
| 8 | Stock block | Structure | Rectangular tank with a fill level and a units label, for example kelp biomass in tonnes or urchins in thousands | Yes: place |
| 9 | Flow block | Structure | Pipe with a valve and a rate label, always joining a stock to a stock or to a cloud; valve aperture animates with the live rate | Yes: connect |
| 10 | Converter block | Structure | Small circle holding a constant, a data series or a formula, for example sea temperature or grazing per urchin | Yes: place |
| 11 | Feedback link | Structure | Curved arrow carrying a plus or minus at its head; closed loops are auto-detected and shaded, reinforcing in red, balancing in blue | Yes: connect |
| 12 | Source and sink clouds | Structure | Cloud glyphs marking where matter enters or leaves the model boundary; a model with no sink cannot ever fall | Yes: place |
| 13 | Ground-truth ribbon | Instrument | Measured kelp canopy area for this stretch of coast, 1985–2020, one value per year, with the 2014–2016 collapse to near zero | No |
| 14 | Fit overlay and residual band | Overlay | Model curve drawn over the ground-truth ribbon with a shaded residual band; the worst three years are pinned and labelled | No |
| 15 | Version stack | UI-Probe | Card stack of saved versions v1 to v8, each showing its block count, loop count and score; two cards can be opened side by side | Yes: swap |
| 16 | Structure diff panel | Overlay | Highlights blocks and links added, removed or rewired between two versions, with the score change attached | No |

**How it works — the model.**
Whatever the student assembles is what runs. Blocks compile to a stock-and-flow system integrated once per simulated day: each stock changes by inflows minus outflows, each flow reads only the blocks wired into it. A minimal kelp model grows logistically toward a carrying capacity and can never crash. Wire in an urchin stock and a grazing flow and the system gains a balancing loop; wire otter predation onto the urchin stock and it gains a second. The observed 2014 collapse cannot be produced by any parameter setting of those loops, because it was driven by a temperature shock and by the loss of a predator, so the fit only improves when structure is added. Auto-tune therefore searches parameters only, which is the honest and important limitation: it will grind to a floor and stop, and that floor is the evidence that something is structurally missing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Block palette | Multi-select | Stock / Flow / Converter / Connector / Feedback link / Cloud | Stock, Flow | — | Which blocks can be placed on the canvas, and therefore what kinds of model are buildable |
| Kelp growth rate | Slider | 0.00–0.25 | 0.08 | per day | Speed of canopy regrowth after any loss |
| Grazing per urchin | Slider | 0.000–0.050 | 0.012 | kg kelp/urchin/day | How fast urchins strip the reef and how quickly a barren forms |
| Otter predation rate | Slider | 0–40 | 22 | urchins/otter/day | Strength of the top-down balancing loop |
| Temperature forcing | Dropdown | Constant 13 °C / Observed 1985–2020 / Observed plus 2 °C | Constant 13 °C | — | Whether the converter reads a flat value or the real ocean record |
| Shock events | Multi-select | None / Sea-star wasting 2013 / Marine heatwave 2014–2016 / El Niño storms 1998 | None | — | Injects real disturbances at their real dates |
| Auto-tune parameters | Toggle | On / Off | Off | — | Searches numeric values only; it can never add a block |
| Run span | Slider | 5–35 | 35 | years | Length of the simulated record compared against the data |
| Model version | Stepper | v1–v8 | v1 | — | Loads a saved structure for editing or comparison |
| Playback speed | Dial | 0.25–5 | 1 | years/s | Simulated years per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two boxes and a pipe | palette=Stock, Flow; growth=0.08; temperature=Constant 13 °C; shocks=None | Build kelp with growth alone. Your curve climbs and flattens. What can a model with no consumer never reproduce? |
| S2 | Add the grazers | palette=all; grazing=0.012; predation=0; shocks=None | Add an urchin stock and a grazing flow. Does the reef now crash, and does it ever come back? |
| S3 | The auto-tune wall | structure from S2; auto-tune=On; temperature=Observed 1985–2020 | Tune every number as hard as the machine can. What is the lowest score you reach, and which years still refuse to fit? |
| S4 | The real record | palette=all; temperature=Observed 1985–2020; shocks=Sea-star wasting 2013, Marine heatwave 2014–2016 | Add otters and a temperature converter. Which single added block cut the error most? |

**Student activities.**
1. Build v1 from one stock and one flow, run the full 35 years, and record the fit score and the first year the model and the data disagree by more than half.
2. Add an urchin stock, a grazing flow and the feedback link that closes the loop. Save as v2 and record the new score and the loop count.
3. Turn on auto-tune with v2's structure and record the best score it can reach, then write one sentence saying why it stops there.
4. Add the temperature converter, the otter stock and the two shocks. Save as v3, record the score, and open the diff against v2.
5. Rank your three versions by score and state, for each, the one behaviour in the data it still cannot produce.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Fit score | Live numeric | km² canopy | Root-mean-square error between model and measured canopy area, updated at run end |
| Model vs data | Line graph | km² vs year | Model curve over the ground-truth ribbon for the whole span |
| Residuals | Line graph | km² | Model minus data per year; systematic humps reveal missing structure |
| Loop inventory | Counter | count | Reinforcing and balancing loops detected in the current wiring |
| Barren area | Live numeric | % of reef | Fraction of reef in urchin barren, model value beside the surveyed value |
| Version diff | Data table | mixed | Blocks and links added or removed between two versions, with the score change for each |

**What the student should realise.**
Students think a model that misses the data has the wrong numbers in it. Auto-tune here searches every number and still cannot reproduce the 2014 collapse, because no amount of tuning invents a predator or a heatwave. The fix was a new connection, not a new value. The student should be able to say: *"When my model fails, I check what I left out of it before I change what is in it."*

## A4 · Earth as a system

### A4.1 · The geosphere

**Experiment name:** Peel the Planet: Reading the Rock Shells  
**Render mode:** 3D Scene  
**Simulation engine:** Procedural geology + Ray/wave  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
Earth hangs in black, turning once every twenty seconds, drawn true to scale with no vertical exaggeration on the globe itself. A quarter wedge has been lifted out over the North Pacific, so the planet is a cut fruit: buff crust barely thicker than a drawn line, then banded mantle in deepening ochres, then the outer core glowing a dull sodium orange, then a hard white inner core at the centre. Fine white contour rings mark 410, 660 and 2,891 km. A blue push-pin sits on the San Andreas near Parkfield; a ring of small seismograph huts is scattered over the globe, each with a paper drum turning. A depth-profile column stands to the left; the control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Globe body and cut wedge | Environment | 6,371 km radius sphere with a removable 90° wedge; the cut face is the only place layers can be seen edge-on | Yes: drag |
| 2 | Continental crust | Structure | Buff granite shell 30–50 km thick, thickening to 55 km under the Sierra root, speckled feldspar texture, density 2.7 g/cm³ | No |
| 3 | Oceanic crust | Structure | Dark basalt shell only 7 km thick with pillow-lava texture and a thin sediment drape, density 3.0 g/cm³ | No |
| 4 | Lithospheric mantle and plates | Structure | Rigid peridotite shell to about 100 km, olive green, scored into 15 plate outlines that creep 2–7 cm/year when the timeline runs | Yes: place |
| 5 | Asthenosphere | Structure | 100–410 km, slightly translucent and softly deforming, 1–2 % partial melt shown as a faint shimmer | No |
| 6 | Transition zone | Structure | 410–660 km, two sharp bands where minerals repack; seismic rays visibly kink at both boundaries | No |
| 7 | Lower mantle | Structure | 660–2,891 km, dense ochre, slow convection cells drawn as pale streamlines when the plate timeline runs | No |
| 8 | Outer core | Structure | 2,891–5,150 km, liquid iron and nickel, glowing orange, swirling at centimetres per second; transmits P waves and stops S waves | No |
| 9 | Inner core | Structure | 5,150–6,371 km, solid iron, white-hot at about 5,200 °C under 360 GPa, rotating fractionally faster than the mantle | No |
| 10 | Moho and core-mantle boundary | Overlay | Two labelled interfaces drawn as thin cyan lines on the cut face, with their depths and the velocity jump across each | No |
| 11 | Earthquake source | Actor | Placeable focus with a depth handle 0–700 km; releases a pulse and an expanding wavefront shell on trigger | Yes: place |
| 12 | P and S ray bundles | Field | 180 traced rays per event, P in yellow and S in magenta, refracting at every velocity boundary and reflecting off the core | No |
| 13 | Seismograph stations | Instrument | Placeable huts with drum recorders; each prints P arrival, S arrival, and a flat trace where a wave never came | Yes: place |
| 14 | Shadow-zone band | Overlay | Translucent grey band painted on the globe from 103° to 142° for P and beyond 103° for S, drawn only after a run | No |
| 15 | California drill core | Instrument | Draggable rig producing a scaled core column: Central Valley alluvium 0–600 m, marine sediment, then Sierra granodiorite or Franciscan mélange, with a 20× exaggerated surface inset | Yes: drag |
| 16 | Depth profile column | Overlay | Vertical strip plotting temperature, pressure and density against depth, with a slider cursor tied to the peel depth | No |

**How it works — the model.**
Layers are defined by their seismic velocities, and the rays are what the student actually measures. Each ray is traced through a radial velocity model, bending by Snell's law at every boundary: P velocity climbs from 6 km/s in crust to 13.7 km/s at the base of the mantle, then drops abruptly to 8 km/s entering the liquid outer core, which is what bends P waves aside and creates the 103° to 142° shadow band. S waves are shear waves and simply cannot travel through liquid, so they stop dead at the core-mantle boundary and no station beyond 103° ever records one. Ray travel is played at real speed by default: about 13 minutes for P to cross the planet. Changing the core-state hypothesis rebuilds the velocity model, so a solid-core Earth genuinely delivers S waves everywhere, and the station record then contradicts the real data.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Peel depth | Slider | 0–6,371 | 0 | km | How far the shells are stripped back on the cut face, and where the profile cursor sits |
| Shells shown | Multi-select | Crust / Lithospheric mantle / Asthenosphere / Transition zone / Lower mantle / Outer core / Inner core | All seven | — | Which shells are drawn; hidden shells still transmit waves |
| Earthquake site | Drag-handle | Any surface point, focus depth 0–700 | Parkfield, 8 km | km depth | Where the pulse starts and therefore which stations sit in shadow |
| Magnitude | Slider | 4.0–8.5 | 6.5 | Mw | Wave amplitude on the drums and how far a readable arrival travels |
| Wave type | Radio | P only / S only / P and S / Surface waves | P and S | — | Which ray bundles are traced and drawn |
| Seismograph stations | Stepper | 4–24 | 12 | count | How densely the globe is instrumented, and whether the shadow edge is resolvable |
| Core-state hypothesis | Dropdown | Liquid outer core / Solid all the way through / Uniform rock, no core | Liquid outer core | — | Rebuilds the velocity model, so a wrong Earth gives visibly wrong arrivals |
| Drill site | Drag-handle | Central Valley / Sierra crest / Coast Ranges / Mojave | Central Valley | — | Where the core column is taken and what rock sequence comes up |
| Surface inset exaggeration | Slider | 1–50 | 20 | × | Vertical stretch of the drill-core inset only; the globe stays true scale |
| Playback speed | Dial | 0.25×–20× | 1× | — | Ray travel speed, from real time to a fast sweep |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One quake, twelve drums | site=Parkfield; magnitude=6.5; wave type=P and S; stations=12 | Which stations record both waves, which record only P, and where on the globe are they? |
| S2 | Find the shadow | stations=24; wave type=S only; magnitude=7.5 | Mark every station with no S arrival. What angle does the silent zone begin at, and what does that silence prove? |
| S3 | A wrong Earth | core state=Solid all the way through; stations=24; wave type=P and S | Predict the drums first, then run. Which stations now record S waves, and how does that clash with the real record? |
| S4 | Drill California | drill site=Central Valley, then Sierra crest; exaggeration=20× | How deep is bedrock at each site, and after ten kilometres of drilling which shell are you still inside? |

**Student activities.**
1. Place twelve stations evenly around the globe, fire the Parkfield event, and record P and S arrival times for each in a table.
2. Set wave type to S only, raise the station count to 24, and record the angular distance at which S arrivals stop.
3. Switch the hypothesis to a solid core, predict what each drum will show, run, and record which predictions failed.
4. Drag the peel slider from 0 to 6,371 km and record the temperature, pressure and density at 35, 660, 2,891 and 5,150 km.
5. Drill at the Central Valley site and the Sierra crest and record the layer sequence and bedrock depth for each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Arrival table | Data table | s | P and S arrival time per station, with a dash where no arrival came |
| Travel-time curve | Line graph | s vs degrees | Arrival time against angular distance, with the shadow band showing as a gap |
| Shadow-zone map | Heat map | — | Globe painted by which waves reached each point |
| Layer profile | Line graph | °C, GPa, g/cm³ | Temperature, pressure and density against depth on the cut face |
| Hypothesis check | Pass-fail badge | — | Green when the chosen core state reproduces the real observed shadow zones |
| Drill core log | Data table | m | Rock unit, thickness and depth for the chosen California site |

**What the student should realise.**
Students picture Earth's interior as molten rock all the way down, and believe the layers were seen by digging. Nobody has drilled past 12 km. The layers are inferred from waves: a band of stations that never records an S wave is the evidence that the outer core is liquid. The student should be able to say: *"We know the inside of the Earth from what its waves do, not from having looked."*

### A4.2 · The hydrosphere

**Experiment name:** Ninety-Seven, Two, and a Splash  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-4

**Theme & scene.**
The same slowly turning Earth, but the rock is dimmed to a grey ghost and only water is lit. Ocean basins glow in depth bands from pale shelf turquoise to near-black abyss, with the Mariana trench a dark scar at 10,935 m. Antarctic and Greenland ice sit as thick blue-white shells. Under the continents a subsurface amber haze marks groundwater; rivers thread the surface as fine silver lines; a soft haze of vapour hangs above everything. Floating beside the planet are three matched spheres, drawn to scale: all Earth's water at 1,385 km across, all fresh water much smaller, and all liquid fresh surface water a dot. A California inset shows the Sierra snowpack, the Central Valley and the Delta. Panel right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Ocean water body | Structure | 1.338 billion km³ shell, hypsometric colour ramp from 0 to 11,000 m, animated surface currents as faint drifting streaks | No |
| 2 | Ice sheets and glaciers | Structure | Antarctic shell to 4.8 km thick, Greenland to 3.2 km, plus 200,000 small mountain glaciers as bright specks; 24.06 million km³ total | Yes: swap |
| 3 | Groundwater body | Structure | Amber subsurface layer to 2 km depth with a visible water table surface that can be dragged down; 23.4 million km³ total | Yes: resize |
| 4 | Surface fresh water | Structure | Lakes as flat discs and rivers as 3 px silver threads; Lake Tahoe, Mono Lake, the Sacramento and San Joaquin individually named | No |
| 5 | Soil moisture film | Structure | Thin dark film in the top 2 m of land, dries visibly to pale tan under drought settings | No |
| 6 | Atmospheric vapour haze | Particle | Translucent white haze, densest over the warm tropics, holding only 12,900 km³ at any instant | No |
| 7 | Comparison spheres | Structure | Three to-scale spheres, 1,385 km, 434 km and 56 km across, held beside the globe with labels and volumes | No |
| 8 | Tagged water tracers | Particle | Numbered glowing droplets, up to 500, moving between reservoirs by residence-time probability, leaving a fading trail | Yes: place |
| 9 | Tracer passport | Overlay | Card per tracer stamped with each reservoir entered, arrival year and time spent there | No |
| 10 | Central Valley aquifer cutaway | Structure | Vertical section from Sacramento to Bakersfield showing Corcoran clay, upper and lower aquifers, well screens and the water table | Yes: drag |
| 11 | Subsidence bench mark | Instrument | Survey pole near Mendota with 1925, 1977 and today marks; ground surface drops as pumping continues, up to 8.5 m | No |
| 12 | Sierra snowpack wedge | Actor | White wedge across the range whose thickness scales with April snow water equivalent; melts on a spring schedule into the rivers | Yes: resize |
| 13 | Sea-level ruler | Instrument | Graduated pole planted on the San Francisco waterfront reading metres above today's mean sea level | Yes: place |
| 14 | Reservoir stock bars | Overlay | Horizontal bar panel, one bar per reservoir, in both km³ and percentage of all water; a log toggle makes the small ones visible | No |
| 15 | Salinity overlay | Overlay | False colour from 0 to 40 PSU across every water body, making the fresh fraction visibly tiny | No |
| 16 | Reservoir probe | UI-Probe | Cursor-following pointer reading volume, salinity and residence time wherever it is held | Yes: drag |

**How it works — the model.**
A reservoir-and-transfer model of the whole hydrosphere. Eight stocks hold real volumes: ocean 1.338 billion km³, ice 24.06 million, groundwater 23.4 million, lakes 176,400, soil moisture 16,500, atmosphere 12,900, rivers 2,120. Transfers run at measured global rates, evaporation 505,000 km³ per year, precipitation the same, river discharge 45,000. Each tracer is a random walker: on entering a reservoir it draws an exit time from that reservoir's residence-time distribution, nine days for the atmosphere, months for a river, 3,200 years for the deep ocean, centuries to ten millennia for groundwater. Pumping adds an extra outflow from the Central Valley aquifer that no natural inflow replaces, so the stock falls and the bench mark sinks, which is the honest lesson: not every reservoir refills on a human timescale.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Water bodies shown | Multi-select | Ocean / Ice / Groundwater / Lakes and rivers / Soil moisture / Atmosphere | All six | — | Which reservoirs are drawn and included in the stock bars |
| Tracer release site | Drag-handle | Any point on the globe | Pacific surface, off Monterey | — | Where tagged droplets enter the system |
| Tracer count | Stepper | 1–500 | 100 | droplets | How many walkers run, and whether one path or a distribution is visible |
| Time compression | Dial | 1 day/s – 1,000 years/s | 10 years/s | — | Simulated time per real second |
| Central Valley pumping | Slider | 0–20 | 8 | km³/year | Extra groundwater outflow; drives water-table fall and land subsidence |
| Sierra snowpack | Slider | 0–200 | 100 | % of average | April snow water equivalent, and therefore spring river flow |
| Ice scenario | Dropdown | Today / Mountain glaciers melt / Greenland melts / All ice melts | Today | — | Moves ice volume into the ocean and raises the sea-level ruler |
| Salinity overlay | Toggle | On / Off | Off | — | Colours every water body by salt content |
| View mode | Radio | Globe / Comparison spheres / Stock bars | Globe | — | Switches between the planet, the to-scale spheres and the accounting panel |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Count the water | view mode=Comparison spheres, then Stock bars; salinity overlay=On | Of all the water on Earth, what percentage is liquid, fresh, and above ground where you could drink it? |
| S2 | Follow one droplet | release site=Pacific surface; tracers=200; compression=100 years/s | Over 5,000 simulated years, which reservoirs do the droplets visit, and in which one do they spend the longest? |
| S3 | Drought pumping | snowpack=40; pumping=16; compression=1 year/s; run 10 years | How far does the water table fall, how far does the bench mark sink, and does the aquifer refill when pumping stops? |
| S4 | If all the ice went | ice scenario=All ice melts; view mode=Globe; salinity overlay=On | How much does the sea-level ruler rise, which California coastline is lost, and does the fresh fraction go up or down? |

**Student activities.**
1. Switch to comparison spheres and record the diameter and volume of each of the three spheres, then convert the smallest to a percentage of the largest.
2. Release 200 tracers in the Pacific, run 5,000 years, and record from the passports the mean time spent in the ocean, the atmosphere and groundwater.
3. Set pumping to 16 km³/year for ten years, record water-table depth and subsidence each year, then set pumping to 0 and record how much recovers in ten more.
4. Step the snowpack slider through 40, 100 and 160 % and record peak river discharge and summer soil moisture for each.
5. Run each ice scenario and record the sea-level ruler reading and the change in the ice stock bar.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Reservoir stocks | Bar chart | km³ and % | Live volume in each of the eight reservoirs, with a log scale toggle |
| Residence times | Data table | days to years | Measured mean residence time per reservoir from the tracers actually run |
| Tracer passport | Data table | mixed | Per droplet: every reservoir entered, the year it arrived and how long it stayed |
| Water-table depth and subsidence | Line graph | m | Two traces against time for the Central Valley section |
| Sea level | Live numeric | m | Ruler reading above today's mean sea level for the current ice scenario |
| Fresh and accessible fraction | Live numeric | % | Share of all water that is liquid, fresh and at or near the surface |

**What the student should realise.**
Students believe fresh water is abundant and endlessly renewed, and that groundwater is an underground river. The accounting refuses both: 96.5 % of the water is salt, most of the rest is locked in ice, and the aquifer that sinks the valley floor takes centuries to refill. The student should be able to say: *"Almost all Earth's water is unusable, and the small usable part sits in reservoirs that refill at very different speeds."*

### A4.3 · The atmosphere

**Experiment name:** Ride the Balloon to the Edge of Air  
**Render mode:** 3D Scene  
**Simulation engine:** Fluid/thermal + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ESS2-5

**Theme & scene.**
Dawn on a stubble field outside Sacramento. A 2 m latex balloon strains on its line above a small styrofoam gondola bristling with sensors and a parachute folded beneath. Release, and the camera rides the payload: the valley falls away, the Sierra crest slides past on the right, and the sky bleeds from pale blue to indigo to black while the horizon curves. Translucent shells slide past like the panes of a lantern, each labelled with its altitude and named at the boundary where the temperature turns around. The balloon swells visibly as pressure falls. On the left a profile chart draws itself in real time, three traces climbing with the payload. Control panel docks right, altimeter top-centre.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Latex balloon envelope | Actor | 2.0 m sphere at launch, inflating continuously to about 10 m as external pressure falls, skin thinning and going translucent, then bursting into ribbons | Yes: resize |
| 2 | Instrument gondola | Actor | 25 cm styrofoam box on a 15 m tether, spinning slowly, with sensor booms and a camera port; mass set by the payload control | Yes: swap |
| 3 | Parachute | Structure | 1.2 m orange canopy stowed above the gondola, deploying on burst and giving a 5 m/s descent | No |
| 4 | Troposphere shell | Structure | Ground to 11 km over mid-latitude California, hazy blue, holding all the weather, temperature falling 6.5 °C per km | No |
| 5 | Stratosphere shell | Structure | 11–50 km, clear and dark, temperature flat then rising to about −3 °C at the top; layered with the ozone band | No |
| 6 | Ozone band | Field | Concentration maximum near 25 km at about 8 parts per million, drawn as a faint violet glow that brightens under the UV overlay | No |
| 7 | Mesosphere shell | Structure | 50–85 km, near-black, coldest place in the atmosphere at about −90 °C; meteor streaks burn up inside it | No |
| 8 | Thermosphere shell | Structure | 85–600 km, molecules drawn far apart, temperature reading over 1,000 °C while the density readout is almost zero | No |
| 9 | Air molecule field | Particle | N₂ blue dumbbells, O₂ red dumbbells, Ar violet spheres, CO₂ and H₂O tagged; instanced density falls exponentially with height | No |
| 10 | Altitude landmarks | Structure | To-scale markers: cumulus base 2 km, Mt Whitney 4,421 m, airliner 11 km, ozone peak 25 km, noctilucent cloud 82 km, Kármán line 100 km, ISS 410 km | No |
| 11 | Jet stream ribbon | Field | Fast west-to-east flow near 10 km, up to 60 m/s, drawn as a translucent ribbon that visibly shoves the balloon downwind | No |
| 12 | Cumulative mass column | Overlay | Vertical bar beside the profile filling as the balloon climbs, showing the fraction of atmospheric mass now below the payload | No |
| 13 | Composition probe | UI-Probe | Draggable altitude marker returning a live composition pie and a molecule count per cubic centimetre | Yes: drag |
| 14 | Smoke and aerosol layer | Particle | Optional grey-brown plume from a Sierra fire, lofting to 6–12 km and spreading laterally under the tropopause | Yes: place |
| 15 | Profile chart | Overlay | Pressure on a log axis, temperature and ozone against altitude, drawn live and kept between runs for comparison | No |
| 16 | Data logger | Instrument | Onboard recorder writing one row per 100 m of ascent, downloadable after the flight | No |

**How it works — the model.**
Pressure follows the barometric relation p = p₀·exp(−z/H) with a scale height of about 8.5 km, so half the atmosphere's mass lies below 5.5 km and 90 % below 16 km. Temperature follows the standard atmosphere: falling at 6.5 °C per km through the troposphere to −56.5 °C at 11 km, flat to 20 km, rising through the stratosphere to about −3 °C at 50 km because ozone absorbs ultraviolet, falling again to −90 °C at the mesopause, then rising in the thermosphere where the few remaining molecules move very fast. Balloon volume scales inversely with pressure, so it bursts when its skin reaches its stretch limit, typically 30–34 km. The lesson the sim must protect is that the thermosphere is hot and would not feel hot: temperature and heat are separated on screen by putting the density readout beside the thermometer.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Payload mass | Slider | 0.5–5.0 | 1.2 | kg | Ascent rate and burst altitude |
| Helium fill | Slider | 1.0–8.0 | 3.5 | m³ | Lift, initial ascent rate and how soon the skin reaches its limit |
| Launch site | Dropdown | Sacramento 8 m / Owens Valley 1,150 m / Mt Whitney 4,421 m / San Diego coast 20 m | Sacramento 8 m | — | Starting altitude, pressure and how much atmosphere is already below you |
| Instrument package | Multi-select | Pressure / Temperature / Ozone / CO₂ / Humidity / UV / Particle counter / Camera | Pressure, Temperature, Ozone | — | Which traces the profile chart draws and which columns the logger writes |
| Layer shells | Toggle | On / Off | On | — | Draws the labelled translucent shells and their boundary names |
| Air mass | Dropdown | Standard day / Winter storm / Summer heat / Marine layer / Wildfire smoke plume | Standard day | — | Reshapes the temperature profile and adds inversions or a smoke layer |
| Composition probe altitude | Drag-handle | 0–120 | 25 | km | Where the pie chart and molecule count are sampled |
| Ascent rate target | Slider | 1–8 | 5 | m/s | Climb speed, and therefore how finely the profile is sampled |
| Time compression | Dial | 1×–200× | 60× | — | Real seconds per simulated second of flight |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Straight up | payload=1.2; fill=3.5; site=Sacramento 8 m; package=Pressure, Temperature, Ozone | At what altitude does the temperature stop falling and start rising, and what is that boundary called? |
| S2 | Half the air | probe altitude=5.5, then 16, then 48; layer shells=On | At what altitude is half of all the air below you, and how does that compare with the height of Mt Whitney? |
| S3 | Smoke over the valley | air mass=Wildfire smoke plume; package adds Particle counter; site=Sacramento 8 m | How high does the smoke rise, what stops it going higher, and what does the particle count read at 3 km and 15 km? |
| S4 | Hot and empty | probe altitude=110; package adds Camera | The thermometer reads over 1,000 °C. Why would a hand held out there freeze rather than burn? |

**Student activities.**
1. Launch the default flight and record temperature and pressure every 2 km up to burst, then mark on your chart where each trace changes direction.
2. Drag the composition probe to 0, 25 and 110 km and record the molecule count per cubic centimetre and the percentage of nitrogen at each.
3. Set the air mass to the wildfire smoke plume and record the top of the smoke layer and the particle count above and below it.
4. Run two flights with payloads of 1.2 kg and 5.0 kg and record burst altitude and total flight time for each.
5. Read the cumulative mass column at 5.5 km and 16 km and write down what fraction of the atmosphere lies above 16 km.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Pressure profile | Line graph | hPa vs km | Log-scaled pressure against altitude, drawn live during ascent |
| Temperature profile | Line graph | °C vs km | The double reversal at the tropopause and stratopause is the shape to notice |
| Ozone profile | Line graph | ppm vs km | Concentration against altitude, peaking near 25 km |
| Cumulative mass below | Live numeric | % | Share of atmospheric mass beneath the payload at the current altitude |
| Composition at probe | Bar chart | % by volume | N₂, O₂, Ar, CO₂ and water vapour at the probe altitude |
| Burst altitude and flight log | Data table | m and mixed | Burst height plus one logged row per 100 m for the whole flight |

**What the student should realise.**
Students picture the atmosphere as a uniform blanket that thins gradually to space, and read a high thermosphere temperature as scalding. The flight shows a layered structure defined by where energy is absorbed, temperature reversing twice, and half of all the air lying below the height of a Sierra peak. The student should be able to say: *"The air is layered and astonishingly shallow, and its layers are set by what absorbs the Sun's energy."*

### A4.4 · The biosphere

**Experiment name:** The Living Skin: Painting Life onto Bare Rock  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS2-3, MS-ESS2-1

**Theme & scene.**
The planet loads dead. Tan regolith, grey scree slopes, blue ocean, not one leaf, turning slowly under a hard sun. Along the bottom edge sits a biome tray of loaded brushes: coast redwood, chaparral, Central Valley grassland, Mojave scrub, kelp bed, open-ocean plankton, Arctic tundra. Paint one onto the globe and colour floods outward as the vegetation grows in over simulated decades. Hinged out on the left is a one square metre core patch in cutaway at three times vertical exaggeration: canopy, litter, dark leaf mould, crumb-textured topsoil, mottled subsoil, grit-and-clay saprolite, then fractured granodiorite with pale root tips wedged into every crack. Three glass bins across the top, labelled air, life and rock, are joined by pipes whose bore swells with whatever is flowing. Controls dock right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Bare globe base | Environment | 6,371 km sphere at true scale, unvegetated: tan regolith, grey talus, hypsometric ocean; terminator sweeps once per minute; per-cell albedo recomputed whenever cover changes | Yes: drag |
| 2 | Biome patch | Structure | Paintable surface cell about 400 km across, carrying its own leaf area index, rooting depth and soil age; grows in over 5–80 simulated years rather than appearing instantly | Yes: place |
| 3 | Coast redwood stand | Actor | 90 m tapered trunks in fog-belt cells, 40–60 instanced per patch, flat needle sprays, fog drip animating down the boles at 2 cm/s | Yes: place |
| 4 | Valley grassland sward | Actor | 60 cm bunchgrass tussocks, 12,000 instanced, green in winter and straw-gold by June, root mass drawn to 1.8 m in the cutaway | Yes: place |
| 5 | Chaparral shrub | Actor | 2 m chamise and manzanita domes, waxy grey-green, dense lignotuber knot at the base for resprouting | Yes: place |
| 6 | Mojave creosote and Joshua tree | Actor | Creosote at 1.5 m spaced 4 m apart on bare grit, Joshua tree at 6 m with bayonet leaves; 5 % ground cover only | Yes: place |
| 7 | Marine producers | Actor | Kelp blades on the shelf and a fine emerald phytoplankton haze offshore, bloom density pulsing on a spring and autumn cycle | Yes: place |
| 8 | Decomposer community | Actor | White fungal hyphae threads, bacterial stipple, 3 mm springtails and 10 cm earthworms in the litter and A horizon; population scales with litter mass | Yes: place |
| 9 | Herbivore agents | Actor | Tule elk, pocket gophers and grasshoppers as small walkers, 0–60 per km², cropping leaf area and dropping dung pellets that re-enter the litter | Yes: place |
| 10 | Root network and rhizosphere | Structure | Branching roots to species depth, translucent halo of exuded acid around every tip, visible crack propagation into granite at the deepest tips | Yes: resize |
| 11 | Soil column cutaway | Structure | One square metre column at 3× vertical exaggeration with O, A, B and C horizons drawn separately, plus a graduated stake reading depth in millimetres | Yes: drag |
| 12 | Bedrock and saprolite | Structure | Sierra granodiorite below, grading up through 40 cm of crumbly saprolite; the weathering front advances upward as a visibly ragged boundary | No |
| 13 | Gas exchange particles | Particle | CO₂ as red-and-charcoal triads, O₂ as red dimers, up to 4,000 per patch, flowing both directions at once, day and night streams drawn separately | No |
| 14 | Transpiration plume | Particle | Faint vapour column rising from the canopy, opacity scaled to millimetres per day; condenses into fog over the redwood belt | No |
| 15 | Sphere flux ledger | Overlay | Three glass bins, air, life and rock, joined by six pipes whose bore is proportional to live flux, each pipe carrying its own live number | No |
| 16 | Flux chamber probe | Instrument | Clear 50 cm dome the student clamps over any patch; seals, then reads CO₂ in and out, O₂ in and out, and water vapour for 60 simulated seconds | Yes: place |

**How it works — the model.**
Every painted cell runs two flows, not one. Gross photosynthesis fixes carbon at a rate set by biome, light, temperature, rainfall and CO₂: about 1,300 g C per square metre per year under coast redwood, 550 under valley grassland, 60 under Mojave scrub, 130 in open ocean. Plant respiration burns roughly half of that straight back, and decomposers in the litter and soil return nearly all the remainder, so net storage is the small difference between two large opposing flows. Oxygen tracks carbon at 2.67 g O₂ per gram of carbon fixed, and is consumed again at the same ratio. Roots and soil microbes push soil CO₂ to 0.5–3 %, ten to seventy times the air above, which acidifies pore water and roughly triples chemical weathering of the bedrock beneath, so soil thickens at 0.02–0.1 mm per year. The sim must never draw photosynthesis as one-way oxygen production; both arrows stay live at all times.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Biome brush | Multi-select | Coast redwood / Chaparral / Valley grassland / Mojave scrub / Kelp bed / Open-ocean plankton / Arctic tundra / Bare rock eraser | Valley grassland | — | Which biome the brush paints, and therefore which organisms exist in the scene at all |
| Patch coverage | Slider | 0–100 | 35 | % of land surface | How much of the globe carries living cover; drives every global total |
| Herbivore stocking | Slider | 0–60 | 12 | animals/km² | Grazing pressure, leaf area removed, and how much carbon takes the dung route |
| Decomposer activity | Slider | 0–200 | 100 | % of normal | Speed litter is returned to CO₂, and therefore how much carbon stays in the soil |
| Air temperature | Slider | −10–40 | 15 | °C | Photosynthesis and respiration respond differently, so the net flip point moves |
| Rainfall | Slider | 0–3,000 | 500 | mm/year | Water available; a biome painted outside its range thins and dies back |
| Atmospheric CO₂ | Slider | 180–800 | 420 | ppm | Photosynthesis rate, soil CO₂, and weathering of the bedrock below |
| Time compression | Dial | 1 day/s – 500 years/s | 1 year/s | — | Simulated time per real second, from single days to soil-building millennia |
| View | Radio | Globe / Core patch / Flux ledger | Globe | — | Switches between the planet, the one square metre cutaway and the accounting bins |
| Flux chamber site | Drag-handle | Any painted patch | Central Valley grassland | — | Where the sealed dome takes its 60-second measurement |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A world with nothing living | Biome brush=Bare rock eraser; Patch coverage=0; Time compression=500 years/s | With no life anywhere, do the pipes between air and rock stop? Does soil ever form on the core patch? |
| S2 | Paint California | Biome brush=Coast redwood, Valley grassland, Mojave scrub; Patch coverage=35; Flux chamber site=Central Valley grassland | Which of the three moves the most carbon per square metre, and which moves the most in total once you count its area? |
| S3 | The warm night shift | Air temperature=30; Decomposer activity=200; Patch coverage=60; View=Flux ledger | Photosynthesis is still running at full rate. Why has the net oxygen pipe dropped to zero and then reversed? |
| S4 | Ten thousand years of soil | Biome brush=Coast redwood; Patch coverage=100; Time compression=500 years/s; View=Core patch | How deep is the soil after 10,000 years, and how many millimetres of granite were consumed to make it? |

**Student activities.**
1. Erase all life, run 1,000 years at full compression, and record soil depth, weathering rate and every one of the six pipe values.
2. Paint redwood, grassland and Mojave scrub onto their real California positions, then clamp the flux chamber on each in turn and record gross photosynthesis, respiration and net carbon for all three.
3. Set decomposer activity to 200 % and air temperature to 30 °C, and record the moment the net oxygen flux crosses zero.
4. Raise herbivore stocking from 0 to 60 in four steps, recording leaf area index and net carbon storage at each step.
5. Run the core patch for 10,000 years under redwood, recording soil depth every 1,000 years, then plot depth against time and describe the shape.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Sphere exchange ledger | Data table | g C/m²/day | All six flows between air, life and rock, in both directions, updated every tick |
| Gross versus net production | Bar chart | g C/m²/year | Photosynthesis, plant respiration, decomposer respiration and the net remainder side by side |
| Net CO₂ and O₂ flux | Live numeric | g/m²/day | Signed values from the sealed flux chamber, positive out of the patch |
| Soil depth | Line graph | mm vs years | Depth of O, A and B horizons on the core patch as it builds |
| Weathering rate | Live numeric | mm/1,000 years | Advance of the weathering front into fresh granodiorite, with the bare-rock value shown beside it |
| Transpiration | Live numeric | mm/day | Water moved from soil to air by the current cover |
| Global cover map | Heat map | % cover | Painted globe coloured by leaf area index, with total land area vegetated |

**What the student should realise.**
Students treat the biosphere as a layer of living things sitting on top of the Earth, and picture plants as oxygen factories that only give. The ledger refuses both. Photosynthesis and respiration run at once, and any net gain is the small difference between them, while the same roots that feed the plant are dissolving the granite that becomes soil at a tenth of a millimetre a year. The student should be able to say: *"Life is not on the Earth, it is one of the flows that builds it."*

### A4.5 · Interactions among Earth's four spheres

**Experiment name:** Pull One Thread: The Four-Sphere Web  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model + Field/vector  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ESS2-2, MS-ESS2-6

**Theme & scene.**
Four translucent planes hang one above another in a dark studio, each carrying the same 700 km slice of California drawn from the Pacific through the Coast Ranges, the Central Valley and the Sierra crest down into the Owens Valley. Lowest is the geosphere plane: granite batholith, valley fill, the San Andreas trace. Above it the hydrosphere plane, with ocean, fog bank, snowpack, silver rivers and an amber aquifer. Above that the atmosphere plane, onshore flow on the left and rain shadow on the right. On top the biosphere plane: redwood belt, oak savanna, irrigated cropland, mixed conifer, sagebrush. Twelve arrows run vertically between the planes, each named, each with a small clock at its midpoint. A loaded injector sits lower left; controls dock right; the cause log runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Transect frame | Environment | 700 km west-to-east slice at 20× vertical exaggeration, four parallel planes 120 px apart with parallax on drag; exaggeration factor printed on the frame | Yes: drag |
| 2 | Geosphere plane | Structure | Franciscan mélange under the Coast Ranges, 800 m of Central Valley alluvium, Sierra granodiorite batholith, Owens fault scarp; state variables are uplift, erosion rate and soil depth | No |
| 3 | Hydrosphere plane | Structure | Ocean with a cold upwelling tongue off Monterey, coastal fog bank, Sierra snowpack wedge, Sacramento and San Joaquin threads, aquifer glow, two reservoir discs | No |
| 4 | Atmosphere plane | Structure | Marine layer at 400 m, onshore westerly arrows, orographic cloud on the west slope, dry descending air east of the crest, jet stream ribbon at 10 km | No |
| 5 | Biosphere plane | Structure | Redwood belt on the coast, oak savanna on the foothills, irrigated cropland on the valley floor, mixed conifer to 2,600 m, sagebrush beyond; colour tracks leaf area | No |
| 6 | Sphere hub node | Instrument | Four labelled glass discs, one per plane, each carrying four live state gauges shown as fractions of baseline with a coloured deviation ring | No |
| 7 | Causal link arrow | Structure | Twelve directed arrows between hubs, thickness proportional to the flux carried, blue for a damping effect and amber for an amplifying one, name printed along the shaft | Yes: connect |
| 8 | Link delay clock | Instrument | Small dial at each arrow midpoint showing that link's lag, from one week to fifty years, counting down while an effect is in transit | No |
| 9 | Perturbation injector | Instrument | Dart tool the student aims at any hub; barrel shows the chosen perturbation and its size, and fires a visible pulse into that plane | Yes: drag |
| 10 | Travelling pulse | Particle | Bright bead running along an arrow at a speed set by that link's lag, splitting at every junction so branching chains are visible | No |
| 11 | Feedback loop halo | Overlay | Closed chains auto-detected and outlined, red for reinforcing and blue for balancing, with the loop's gain printed beside it | No |
| 12 | Human works | Actor | Placeable dams, the California Aqueduct, groundwater wells and irrigated fields; each adds or reroutes named links when placed | Yes: place |
| 13 | Cause log | Overlay | Ribbon along the bottom writing one plain sentence per hop, timestamped, in the order the engine actually fired them | No |
| 14 | Cut-link scissors | UI-Probe | Cursor tool that disables a chosen arrow, greying it out; the engine then runs with that pathway genuinely absent | Yes: connect |
| 15 | Cross-section probe | UI-Probe | Vertical pin the student drops at any point along the transect, reading all sixteen state variables in that column | Yes: drag |
| 16 | Response order board | Instrument | Four-row scoreboard stamping the simulated time at which each sphere first moves more than 5 % from baseline | No |

**How it works — the model.**
Each hub holds four state variables expressed as fractions of their baseline, twelve directed links join the hubs, and every link carries a gain and a lag. On injection the engine integrates the coupled set once per simulated month: each state changes by the summed contributions of its incoming links, each contribution delayed by that link's own lag. Real couplings set the numbers. A 1 °C atmospheric warming lifts the Sierra snow line about 150 m and shifts peak runoff two to three weeks earlier, with a lag of one to three years. Clearing forest raises surface albedo and roughly doubles hillslope erosion within a single wet season. Ocean warming off Monterey weakens upwelling and thins kelp inside a year. Gains are linear and lags fixed, which is honest only for small kicks, and the panel says so on screen. The failure to avoid is a one-way hierarchy with life on top: every link has a return link, and cutting one must visibly break the chain.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Target sphere | Radio | Geosphere / Hydrosphere / Atmosphere / Biosphere | Atmosphere | — | Which hub the injector fires into, and therefore where the chain starts |
| Perturbation | Dropdown | Ash eruption / Fault uplift pulse / Ocean warms / Aqueduct diversion / CO₂ step / Wind shift / Forest cleared / Bark beetle outbreak | CO₂ step | — | The specific kick delivered; the list filters to match the target sphere |
| Perturbation size | Slider | 0–100 | 25 | % of baseline | Magnitude of the kick, and how far downstream it stays above the 5 % threshold |
| Links active | Multi-select | All twelve named arrows | All twelve | — | Which pathways the engine may use; disabling one removes that route entirely |
| Human works | Multi-select | Dams / Aqueduct / Groundwater wells / Irrigated cropland / None | Dams, Aqueduct, Irrigated cropland | — | Adds engineered links that reroute water between spheres |
| Delay scaling | Slider | 0.1–10 | 1 | × | Stretches or compresses every lag together, so slow chains can be seen inside a lesson |
| Run span | Slider | 1–200 | 50 | years | How long the coupled system is integrated after the kick |
| Arrow display | Radio | Sign only / Thickness by flux / Hidden | Thickness by flux | — | How much of the causal web is drawn, so a student can predict before seeing |
| Loop highlight | Toggle | On / Off | On | — | Outlines detected reinforcing and balancing loops and prints their gain |
| Playback speed | Dial | 0.25–20 | 2 | years/s | Simulated years per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One kick, four answers | Target sphere=Atmosphere; Perturbation=CO₂ step; Perturbation size=25; Links active=All twelve; Run span=50 | In what order do the other three spheres first move, and how many years does each take to get there? |
| S2 | Cut the thread | Same as S1, but Links active removes Atmosphere to hydrosphere | Which downstream changes disappear entirely, and what does that prove that link was carrying? |
| S3 | Kick the rock instead | Target sphere=Geosphere; Perturbation=Ash eruption; Perturbation size=60; Run span=20 | Starting in the geosphere, does the biosphere respond faster or slower than it did in S1, and by which route? |
| S4 | California plumbing | Target sphere=Hydrosphere; Perturbation=Aqueduct diversion; Perturbation size=40; Human works=Dams, Aqueduct, Groundwater wells, Irrigated cropland | Which sphere absorbs the water shortfall first, which one shows it last, and does the geosphere respond at all? |

**Student activities.**
1. Set arrow display to Sign only, predict on paper which sphere will move second after a CO₂ step, then run S1 and record the response order board against your prediction.
2. Cut the atmosphere to hydrosphere link, re-run the identical kick, and record which of the four hubs still move and by how much.
3. Fire the same 25 % kick into each of the four spheres in turn, recording for each run how many hubs ended more than 5 % from baseline.
4. Place dams, wells and irrigated cropland, run the aqueduct diversion, and copy out the cause log as a numbered chain of sentences.
5. Turn loop highlight on, list every closed loop the engine finds, and mark each as reinforcing or balancing.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Sphere state gauges | Live numeric | % of baseline | Sixteen state variables, four per hub, updated every simulated month |
| Response order and lag | Data table | years | First time each sphere crosses 5 % from baseline, in the order it happened |
| Link flux traces | Line graph | % of baseline vs years | One trace per active arrow, so the delayed arrivals are visible as offset humps |
| Cause chain | Data table | mixed | The cause log as ordered rows: source, link, effect, delay, size |
| Loop inventory | Counter | count | Reinforcing and balancing loops detected in the currently active wiring |
| Entry-point sensitivity | Bar chart | hubs moved | Number of spheres pushed past 5 % per unit of kick, one bar per entry sphere |

**What the student should realise.**
Students imagine four spheres stacked like floors of a building, with effects running only downward and life sitting on top. Kicking the geosphere and watching the atmosphere answer first, then cutting a single arrow and seeing a distant effect vanish, makes that untenable. Every link has a return link, and every link has a delay. The student should be able to say: *"The spheres are not layers, they are one machine, and a push anywhere comes back changed."*

### A4.6 · Modeling an Earth-system event

**Experiment name:** One Spark, Sixty Years: A Sierra Watershed  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model + Particle system  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS3-2

**Theme & scene.**
An oblique aerial over twelve kilometres of the American River headwaters: granite domes and mixed conifer running from 1,400 m at the reservoir up to a ridge at 2,600 m, with a two-lane highway threading the canyon and a small town on the far bench. Late August light, the air already tan. A timeline ribbon spans the full width of the screen, its ticks spaced logarithmically, hours across the first week, then months, then decades out to year sixty, with a chunky scrubber handle the student drags. Everything redraws to whatever moment the handle sits on: terrain, sky, water, forest. Four stacked sphere cards on the right each carry a sparkline. Controls dock right beneath them.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Watershed terrain | Environment | 12 × 12 km elevation model, 1,400–2,600 m, 1.5× vertical exaggeration, granite outcrop and glacial bench, full drainage network to the reservoir | Yes: drag |
| 2 | Mixed conifer stand | Actor | 80,000 instanced trees: ponderosa, sugar pine, white fir, incense cedar, 20–50 m; per-tree state of green, scorched, torched or fallen | Yes: place |
| 3 | Understory and chaparral | Actor | Manzanita and chamise domes on south aspects, 1–2 m, with lignotuber knots that resprout within one season of burning | Yes: place |
| 4 | Fuel load field | Field | Invisible grid in tonnes per hectare, 8 t/ha after recent fire rising to 90 t/ha after ninety years of exclusion; drawn as a straw-to-red wash when the overlay is on | Yes: resize |
| 5 | Fire front | Actor | Advancing perimeter polygon with a flame band 3–40 m high, spotting embers thrown up to 1.5 km ahead, perimeter timestamped every hour | No |
| 6 | Smoke plume | Particle | Grey-brown column lofting to 6–12 km then flattening under the tropopause, drifting downwind, with a PM2.5 concentration field trailing to Sacramento and Reno | No |
| 7 | Soil column and hydrophobic layer | Structure | 1 m profile per cell; under high severity a waxy water-repellent band bakes in 2–4 cm down, drawn as a dark seal that rain visibly beads on | No |
| 8 | Snowpack patch | Structure | White wedge above 1,900 m, thickness set by snow water equivalent; ash fall darkens it from albedo 0.80 to about 0.50, and melt-out date shifts visibly | Yes: resize |
| 9 | Reservoir and river reach | Structure | Reservoir disc with a water treatment intake, plus the river reach above it; both take a turbidity colour ramp from clear green to milk-chocolate | No |
| 10 | Rill and debris flow | Actor | Erosion channels incising the burned hillslope, coalescing into a debris lobe that runs the canyon and buries a stretch of highway | No |
| 11 | Storm driver | Environment | Scheduled winter storm with intensity in millimetres per hour, rain-on-snow flag, and an atmospheric river ribbon drawn offshore when that event is selected | Yes: swap |
| 12 | Wildlife and insect agents | Actor | Mule deer browsing new shrubs, black-backed woodpeckers arriving in year one on standing snags, spotted owl territory outlines, bark beetle population on stressed survivors | No |
| 13 | Regrowth succession stack | Structure | Per-cell state machine drawn as real vegetation: bare, herbs by year one, shrub field years three to fifteen, pine sapling to closed canopy by year sixty | No |
| 14 | Sensor kit | Instrument | Placeable air quality monitor, stream gauge, snow pillow, soil moisture probe and reservoir turbidity meter, each logging its own series for the whole run | Yes: place |
| 15 | Timeline scrubber | UI-Probe | Logarithmic ribbon from hour zero to year sixty with labelled event pins; dragging it moves the scene and every readout together | Yes: drag |
| 16 | Four-sphere impact dashboard | Overlay | Four stacked cards, geosphere, hydrosphere, atmosphere, biosphere, each with a 0–100 impact index, a sparkline and a recovery clock | No |

**How it works — the model.**
Three stages run off one clock. Spread uses a simplified Rothermel rule: rate of spread scales with fuel load, roughly doubles for every 20 km/h of wind, doubles again per 20° of upslope, and rises sharply once dead fuel moisture falls below 8 %, at which point the fire climbs into the crowns. Burn severity per cell then sets the post-fire state: high severity bakes a water-repellent layer 2–4 cm down and the runoff coefficient jumps from about 0.1 to 0.6. Erosion follows rainfall intensity, so above roughly 24 mm in an hour on a steep high-severity slope the cell fails as a debris flow, and sediment yield decays with a three-year e-folding time as cover returns. Ash on snow drops albedo from 0.80 to about 0.50 and melts the pack two to three weeks early. Regrowth is a state machine, herbs to shrubs to pines, over sixty years. Timeline ticks are logarithmic on purpose: the whole point is that the four clocks differ.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Event | Dropdown | Sierra wildfire / Atmospheric river / Multi-year drought / Coastal upwelling collapse | Sierra wildfire | — | Loads a different driver, a different cascade and a relabelled panel; the scene, objects and sensors change with it |
| Ignition point | Drag-handle | Any terrain cell, 1,400–2,600 m | Ridge at 1,850 m | m elevation | Where the fire starts, and therefore what slope and aspect it runs on |
| Wind speed | Slider | 0–90 | 35 | km/h | Rate of spread, spotting distance and which way the plume carries |
| Fuel moisture | Slider | 3–30 | 6 | % | Flammability, and whether the fire stays on the ground or reaches the crowns |
| Years since last fire | Slider | 2–120 | 90 | years | Fuel load on every cell, which sets how severe the burn can become |
| First-winter storm | Slider | 0–150 | 60 | mm in 24 h | Intensity of the December storm, and whether debris flows trigger at all |
| Post-fire action | Multi-select | None / Mulch treatment / Replanting / Salvage logging / Prescribed burn beforehand | None | — | Adds or removes objects on the hillslope and changes which recovery path the state machine takes |
| Timeline | Timeline scrubber | Hour 0 – Year 60 | Hour 0 | hours to years | Moves the scene and every readout to that moment, forward or back |
| Sphere focus | Multi-select | Geosphere / Hydrosphere / Atmosphere / Biosphere | All four | — | Which impact cards and overlays are drawn |
| Playback speed | Dial | 0.5×–50× | 1× | — | How fast the clock advances when the timeline is left to run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The baseline fire | Event=Sierra wildfire; Ignition point=Ridge at 1,850 m; Wind speed=35; Fuel moisture=6; Years since last fire=90; First-winter storm=60; Post-fire action=None | Scrub the whole timeline. At what moment is each of the four spheres worst hit, and how far apart are those moments? |
| S2 | The winter after | Same as S1, but First-winter storm=140 | Did the greatest hydrosphere and geosphere damage come from the fire itself, or from rain that fell three months after it was out? |
| S3 | Prepared ground | Years since last fire=8; Post-fire action=Prescribed burn beforehand; Wind speed=35; Fuel moisture=6 | With the same wind and the same dryness, how do burn severity, sediment yield and the biosphere recovery clock change? |
| S4 | A different event entirely | Event=Atmospheric river; First-winter storm=150; Post-fire action=None; Sphere focus=All four | Which spheres respond in a different order this time, and which one is still not back to baseline at year sixty? |

**Student activities.**
1. Run the baseline fire, then drag the timeline to hour 6, day 21, December, April and year five, recording all four impact indices at each stop.
2. Place the air monitor in Sacramento, the stream gauge below the burn and the snow pillow at 2,100 m, then record each sensor's peak value and the date it occurred.
3. Set the first-winter storm to 140 mm, re-run, and record sediment yield and reservoir turbidity against the 60 mm run.
4. Compare the prepared-ground run with the baseline and record burn severity, debris flow count and years to 90 % canopy recovery for both.
5. Rank the four spheres by recovery time, then write one sentence naming the sphere that recovered fastest and the one that had not recovered by year sixty.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Four-sphere impact index | Bar chart | 0–100 | Live severity per sphere at the scrubber's current position, with the run's peak marked on each bar |
| Recovery clocks | Data table | days and years | Time for each sphere to return to 90 % of its pre-event value, one row per sphere |
| Air quality at Sacramento | Line graph | µg/m³ PM2.5 | Concentration against time on the log axis, with the healthy threshold drawn across it |
| Sediment yield and turbidity | Line graph | t/ha/year and NTU | Hillslope loss and reservoir turbidity on shared time axis, peaking in the first wet season |
| Snowmelt timing | Live numeric | days earlier | Shift in melt-out date at the snow pillow caused by ash darkening the pack |
| Carbon ledger | Line graph | t C/ha | Carbon released during the burn against carbon regained by regrowth, over the full sixty years |
| Burn severity map | Heat map | severity class | Watershed painted unburned, low, moderate and high, with the area of each class |
| Event chronology | Data table | mixed | Every modelled event with its timestamp, sphere and magnitude, exportable as CSV |

**What the student should realise.**
Students think a disaster is one event, in one place, that ends when the news does. Here the smoke has cleared in three weeks, the worst hydrosphere and geosphere damage arrives in December on rain that falls after the fire is out, the snow melts early the following April, and the forest is still recovering at year sixty. The student should be able to say: *"One event, four spheres, four different clocks, and the biggest damage did not arrive first."*

## A5 · Investigation, measurement and evidence

### A5.1 · Lab safety and working like a scientist

**Experiment name:** The Bench That Bites  
**Render mode:** 3D Scene  
**Simulation engine:** State machine + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-2

**Theme & scene.**
A school laboratory bench at the student's own eye height, close enough that two gloved hands reach in from below the frame. Grey epoxy worktop, a gas tap, a sink with an eyewash arm folded above it, a hot plate whose coil glows dull orange, a spirit burner with a lazy blue flame, a rack of glassware holding pale blue copper sulfate solution. Lighting is cool and flat like a real lab, except that every liquid carries a diagonal SIMULATION watermark and every accident plays as a clean graphic effect: colour, a card, never gore. Behind the bench hangs a peg wall of goggles, aprons and gloves. The fume cupboard sash slides at the left. Control panel docks right; a risk overlay can wash the bench amber.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Bench worktop and services | Environment | 120×60 cm grey epoxy top, upstand at the rear, gas tap, twin sockets, sink with swan neck; surfaces carry a wet/dry state and a contamination map | No |
| 2 | Gloved hands avatar | Actor | Two rigged forearms entering from the frame bottom; sleeve length swappable short/long; skin and glove show a soft red glow at a contact site, never a wound | Yes: drag |
| 3 | PPE peg wall | Structure | Wall rail holding splash goggles, side-shield spectacles, cotton apron, nitrile gloves, hair tie, closed shoes; each item drags onto the avatar and snaps into a worn slot | Yes: place |
| 4 | Hot plate and thermal field | Actor | 18 cm ceramic top on a steel body, coil glow ramps black→dull red→orange with setpoint; invisible temperature field extends 4 cm above the plate and 2 cm past its rim | Yes: place |
| 5 | Spirit burner and flame | Actor | 60 mL glass reservoir, wick, cap; 6 cm blue flame with a 3 cm near-invisible upper cone; flame tilts to a draught and relights from any surface above 250 °C | Yes: place |
| 6 | Glassware rack | Structure | 250 mL beaker, 100 mL conical flask, six 16 mm test tubes in a wooden rack, watch glass, stirring rod; each has a fill level, a hot/cold state and a topple threshold | Yes: swap |
| 7 | Reagent bottles | Structure | Four 250 mL amber bottles with real GHS pictogram labels: 0.1 M hydrochloric acid, copper sulfate solution, limewater, ethanol; ground-glass stoppers lift off and can be left off | Yes: swap |
| 8 | Splash droplet particles | Particle | 60–400 droplets per pour, radius 0.5–2 mm, tinted to the reagent, launched at exit speed from the pour lip; each droplet reports where it lands | No |
| 9 | Spill puddle | Particle | Shallow fluid sheet spreading at 3 cm/s to an area set by volume; darkens the worktop, wets paper, and becomes a slip hazard on the floor | No |
| 10 | Emergency station | Instrument | Eyewash arm with twin aerated heads, drench shower pull-ring, fire blanket in a red pouch, 2 kg CO₂ extinguisher on a bracket; each has a reach distance from the bench and an activation time | Yes: place |
| 11 | Fume cupboard sash | Structure | Toughened glass sash on a counterweight, 0–60 cm travel, airflow arrows drawn in the aperture; above 40 cm the containment arrows break up and vapour escapes | Yes: drag |
| 12 | Bench clutter | Structure | Rucksack, exercise book, phone, coat, coiled cable; each is a topple, ignition or trip object with its own flammability | Yes: drag |
| 13 | Broken glass and sharps bin | Structure | Shard set generated on any topple from above 15 cm, dustpan and brush, blue sharps bin; shards cut only on a bare-hand grab | Yes: place |
| 14 | Hazard state machine | Instrument | Invisible per-object channel table (thermal, chemical, mechanical, electrical) plus the contact-event queue and the countdown timer for each correct response | No |
| 15 | Risk heat overlay | Overlay | Toggleable amber-to-red wash over every bench zone, intensity ∝ current hazard magnitude; grey where a hazard is present but currently inert | No |
| 16 | Shake table | Environment | The whole bench sits on a hidden platform that can run a 6 s, 3 cm horizontal sway; unsecured glassware slides toward the nearest edge | No |

**How it works — the model.**
A hazard state machine runs beside the physics. Every object carries hazard channels: thermal (surface temperature), chemical (corrosive, irritant, flammable), mechanical (sharp, heavy, unstable) and electrical. Every student action generates a contact event carrying which channel, what magnitude, which body part and for how long. PPE is a filter on that event: goggles block splash to the eye entirely, gloves cut chemical contact to a fraction and cut thermal contact not at all above 120 °C, an apron intercepts torso splash. Severity is magnitude minus what the PPE absorbed, and severity selects the outcome card and the seconds allowed for a correct response. Splashes are real particles: pour height sets exit speed, exit speed sets spray radius, so a 25 cm pour genuinely reaches the face. The failure to avoid is random punishment. Every incident replays as a traceable chain from the first unsafe choice, and every hazard is visible before it fires.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| PPE worn | Multi-select | Splash goggles / Apron / Nitrile gloves / Hair tied / Closed shoes | Splash goggles | — | Which channels the consequence engine can still reach the avatar through |
| Hot plate setpoint | Slider | 20–350 | 180 | °C | Coil glow, plate surface temperature, burn severity, ignition of vapour above it |
| Reagent in use | Dropdown | Water / 0.1 M hydrochloric acid / Copper sulfate solution / Limewater / Ethanol | Copper sulfate solution | — | Splash consequence, flammability, the pictograms on the label |
| Pour height | Slider | 1–30 | 5 | cm | Droplet exit speed, spray radius, how far splash travels toward the face |
| Bench clutter | Stepper | 0–6 | 3 | items | How many loose objects can topple, catch fire or snag a sleeve |
| Fume cupboard sash | Drag-handle | 0–60 | 20 | cm open | Vapour containment; above 40 cm ethanol vapour reaches the room |
| Bench layout | Drag-handle | Free placement of hot plate, burner, glassware, bottles and bag within 120×60 cm | Standard layout | — | Where every item sits, and therefore what a reach passes over |
| Reach path | Radio | Across the hot plate / Around the front | Across the hot plate | — | Whether the sleeve and forearm cross the thermal field |
| Earthquake drill | Toggle | On / Off | Off | — | Runs a 6 s shake that slides unsecured glassware toward the bench edge |
| Step through incidents | Toggle | On / Off | On | — | Freezes at the instant of contact and draws the cause chain |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Suited up | PPE=Splash goggles, Apron, Nitrile gloves, Hair tied, Closed shoes; reagent=Copper sulfate solution; pour height=5; clutter=0 | Run the full pour-and-heat sequence. How many incidents does the log record, and which single item of PPE absorbed the one splash that still happened? |
| S2 | Bare-eyed | PPE=Apron; reagent=0.1 M hydrochloric acid; pour height=25; clutter=3 | Where exactly did the droplets land, and how many seconds did the timer give you to reach the eyewash? |
| S3 | Three things at once | reagent=Ethanol; hot plate setpoint=300; sash=55; reach path=Across the hot plate; clutter=4 | The vapour ignites. Name the three separate conditions that all had to be true, and remove the single cheapest one. |
| S4 | Shake-table drill | earthquake=On; hot plate setpoint=180; bench layout=glassware at the front edge; PPE=all | Which items moved and how far? Move them 15 cm inboard, re-run the shake, and record what changed. |

**Student activities.**
1. Drag PPE onto the avatar one item at a time, running the same acid pour after each addition. Record which incident disappears at each step.
2. Set pour height to 5 cm, then 15 cm, then 25 cm with goggles off. Measure the maximum splash distance from the beaker in each case and record all three.
3. Place the hot plate, burner, ethanol bottle and rucksack yourself, then run the heating sequence. Record the risk overlay's peak value for your layout and for one improved layout.
4. Trigger the ethanol ignition deliberately, then use step-through to write down the cause chain in order, from the first choice to the flame.
5. Run the earthquake drill twice, once with glassware at the edge and once secured inboard, and record the number of breakages each time.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Incident log | Data table | mixed | One row per contact event: time, channel, magnitude, PPE absorbed, severity, response taken |
| Safety score | Live numeric | 0–100 | Starts at 100, deducts by severity, restores partially for a correct response inside the timer |
| Exposure counter | Counter | count | Eye, skin, inhalation and cut exposures, tallied separately |
| Response time | Timer | s | Seconds from incident to eyewash, shower, blanket or extinguisher activation |
| Risk map | Heat map | — | Bench-zone hazard intensity right now, updated every frame |
| PPE compliance | Pass-fail badge | — | Green only when every PPE item required by the current reagent and heat source is worn before the first action |
| Cause chain | Data table | — | The ordered list of choices leading to each incident, exportable as CSV |

**What the student should realise.**
Students believe lab safety is a list of rules to memorise and obey. Here the rules are never stated first: a 25 cm pour genuinely throws droplets to eye height, and goggles genuinely stop them. Safety turns out to be prediction, done before you act, about what a hazard can reach. The student should be able to say: *"Before I touch anything, I work out what could reach me, and I put something in the way."*

### A5.2 · Variables and fair tests

**Experiment name:** Four Chambers, One Question  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS1-5

**Theme & scene.**
Four sealed growth chambers stand in a row on a steel rack in a dim grow room, each a clear acrylic box the size of a shoebox with its own LED bar, drip line and heating plate. Inside each, lettuce seedlings push up from peat plugs against a black backdrop, so pale green reads hard against dark. A window at the right end of the rack leaks daylight across chamber four. The camera sits level with the plugs, close enough to see cotyledons open. Left of the rack hangs the variable-locking panel: seven rows, each with a padlock, a value and a live difference reading. Below, a strip chart draws four height traces. Time runs fast; leaves visibly unfold.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Chamber rack | Environment | 1.6 m steel shelf with four bays at 40 cm spacing, cable trays beneath; bays can be emptied or filled | Yes: place |
| 2 | Growth chamber shell | Structure | 30×20×25 cm clear acrylic box with a sealed lid, hygrometer window, vent grommet; four instances, each independently labelled | Yes: resize |
| 3 | LED grow bar | Actor | 28 cm strip of 24 white-plus-red diodes above each chamber, dimmable, on a per-chamber timer; casts a real pool of light with visible falloff | Yes: swap |
| 4 | Drip emitter and water meter | Instrument | 4 mm line ending in a dripper over each plug, with a graduated 100 mL reservoir; drips are visible and the reservoir level falls | Yes: connect |
| 5 | Peat plug and substrate | Structure | 40 mm cylindrical plug, three substrate options with different water-holding capacity, colour darkens when wet | Yes: swap |
| 6 | Lettuce seedling | Actor | Procedural plant: hypocotyl, two cotyledons, then true leaves at 3 day intervals; height, leaf count, leaf area and colour all driven by the model; six per chamber by default | Yes: place |
| 7 | Heating plate and temperature field | Field | Thin plate under each chamber with a setpoint; invisible scalar field inside the box, 0.5 °C hysteresis, 40 min thermal lag | No |
| 8 | Ruler stake | Instrument | 150 mm stake beside each plug with 1 mm graduations, read automatically each simulated midnight | No |
| 9 | Variable lock panel | UI-Probe | Seven rows: light hours, water, temperature, substrate, seed variety, pot size, rack position. Each row has a padlock; locked rows force all chambers identical and shake when you try to change one chamber alone | Yes: drag |
| 10 | Confound detector | Instrument | Invisible comparator counting how many variables differ between any two chambers; feeds the attribution meter | No |
| 11 | Attribution meter | Overlay | Vertical gauge, 0–100 %, green at 100 when exactly one variable differs, falling to 0 when two or more do | No |
| 12 | Natural variation generator | Field | Per-seed vigour drawn from a distribution whose spread is slider-set; the reason two identical chambers still differ | No |
| 13 | Ghost curve overlay | Overlay | When two variables are unlocked, draws the translucent curve each one alone would have produced; the two overlap the measured curve and cannot be separated | No |
| 14 | Chamber label cards | Structure | Magnetic cards on each bay front showing that chamber's full setting list, with any differing value highlighted amber | Yes: swap |
| 15 | Time-lapse camera and strip chart | Instrument | Fixed camera per chamber producing a daily frame; strip chart below the rack plots four height traces on shared axes | No |
| 16 | Randomiser shuffle tray | Instrument | A mechanism that swaps chamber positions on the rack each simulated day, breaking the window-side light and warmth gradient | Yes: drag |

**How it works — the model.**
Growth is a rate model run once per simulated hour. Each seedling accumulates biomass at a rate proportional to the product of four limiting factors: light (saturating above 14 h/day), water (falling off sharply below 10 mL/day and above 50 mL/day through waterlogging), temperature (an optimum near 20 °C with a steep drop past 30 °C) and substrate nutrient supply. Height and leaf area follow biomass with a fixed allometry. Each seed carries a vigour multiplier drawn from a spread the student sets, so two identically treated chambers never match exactly. The rack imposes a genuine nuisance gradient: chamber four receives 900 lx of extra window light and sits 2 °C warmer. The engine is honest about attribution: the confound detector counts differing variables directly, and when the count exceeds one the ghost overlay draws both candidate explanations sitting on top of each other, because the data genuinely cannot separate them.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Independent variable | Dropdown | Light hours / Water per day / Temperature / Substrate / Seed variety | Light hours | — | Which row the lock panel releases, and which chambers are allowed to differ in |
| Locked variables | Multi-select | Light hours / Water / Temperature / Substrate / Seed variety / Pot size / Rack position | Water, Temperature, Substrate, Seed variety, Pot size, Rack position | — | Structural: a locked variable is forced identical across all four chambers |
| Light hours per chamber | Slider (one per chamber) | 0–20 | 6 / 10 / 14 / 18 | h/day | LED on-time in each chamber, and the pool of light you can see |
| Water per chamber | Slider (one per chamber) | 0–60 | 20 / 20 / 20 / 20 | mL/day | Dripper volume, substrate wetness, waterlogging above 50 |
| Temperature per chamber | Slider (one per chamber) | 8–35 | 22 / 22 / 22 / 22 | °C | Plate setpoint and the internal air temperature field |
| Seedlings per chamber | Stepper | 1–8 | 6 | count | Replicates; how much a single unlucky seed can shift the mean |
| Natural seed variation | Slider | 0–40 | 15 | % spread | How different identically treated plants are from each other |
| Rack position effect | Toggle | On / Off | On | — | Whether the window gradient adds light and warmth to the right-hand bay |
| Randomise positions daily | Toggle | On / Off | Off | — | Shuffles which chamber occupies which bay, averaging the gradient away |
| Time compression | Dial | 100×–20000× | 5000× | — | Simulated hours per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A fair test of light | Independent variable=Light hours; locked=Water, Temperature, Substrate, Seed variety, Pot size, Rack position; light=6/10/14/18; seedlings=6 | Which chamber grows tallest by day 21, and what exactly lets you say the light caused it? |
| S2 | Two things at once | Unlock Water; light=6/10/14/18; water=10/20/40/60; seedlings=6 | Chamber four wins by 34 mm. Was it the light or the water? Point at the thing on screen that proves you cannot tell. |
| S3 | One seed each | seedlings=1; natural variation=35; independent variable=Light hours; light=6/10/14/18 | Run the identical setup three times. Does the same chamber win every time? What does that do to your conclusion? |
| S4 | Central Valley water trial | Independent variable=Water per day; water=5/15/30/60; temperature locked at 30; seedlings=8; randomise=On | Below what daily volume does growth collapse, and what would you say to a grower who tested only one plant? |

**Student activities.**
1. Set the lock panel so only light hours is unlocked, run to day 21, and record final mean height for all four chambers.
2. Unlock water as well, set water to 10/20/40/60, re-run, and record the attribution meter reading and what the ghost curves show.
3. Drop seedlings to 1 and raise natural variation to 35 %. Run the same light test three times and record the winning chamber each time.
4. Turn rack position effect on with randomise off, run, then turn randomise on and re-run. Record the difference between chamber four and chamber one in both.
5. Design and run your own fair test of temperature: choose the four values, lock everything else, and record your prediction before pressing Run.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Height traces | Line graph | mm vs day | Four traces on shared axes, one per chamber, drawn from the midnight ruler reading |
| Mean height with range | Bar chart | mm | One bar per chamber, whisker showing the spread across that chamber's seedlings |
| Attribution meter | Live numeric | % | 100 when one variable differs, 0 when two or more do; updated whenever a control moves |
| Differences table | Data table | mixed | Every variable, chamber by chamber, with differing cells highlighted |
| Fair-test verdict | Pass-fail badge | — | Green only when exactly one variable differs and replicates are at least three |
| Confound list | Data table | — | Named list of every variable currently free to differ, with its size of difference |
| Run export | Data table | mixed | CSV of every seedling's daily height, leaf count and treatment |

**What the student should realise.**
Students believe a fair test means being careful and tidy. The rig makes it mechanical: unlock a second variable and the simulation itself reports that it cannot say which change caused the difference, and the two ghost curves lie on top of each other to prove it. Fairness is not an attitude, it is a countable property of the setup. The student should be able to say: *"If two things differ, the result cannot tell me which one did it."*

### A5.3 · SI units and measurement

**Experiment name:** Read It Right: The Metrology Bench  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Rigid-body + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-2

**Theme & scene.**
A dark rubber-matted bench under one warm pool of light, shot from just above the instruments so their scales face the student. Along the mat: a triple-beam balance with its three notched riders, a 100 mL graduated cylinder half full of tinted water, a vernier caliper lying open, a steel metre rule, an alcohol thermometer in a clip, a stopwatch. A tray of specimens sits at the front: a river pebble, a steel bolt, a 20 mm aluminium cube, a wooden block, an irregular brass nut. Top right, a magnifier panel blows up whatever scale the cursor touches, so the divisions are always readable. Left, a small eye icon on a vertical track shows exactly where the student is looking from. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Bench mat and levelling feet | Environment | 90×45 cm black rubber mat on three adjustable feet with a spirit-level bubble at the rear; tilt shifts the bubble and biases the balance | Yes: drag |
| 2 | Triple-beam balance | Instrument | 32 cm beam assembly, 12 cm stainless pan, three beams reading 0–500 g in 100 g notches, 0–100 g in 10 g notches, 0–10 g continuous with 0.1 g graduations; pointer swings with damped oscillation and settles in 4 s | Yes: place |
| 3 | Balance riders and zero screw | Structure | Three brass sliders that drag along their beams and snap into notches on the two rear beams, plus a knurled zero screw under the pan giving ±0.5 g of trim; beam torque is computed from real rider positions, not from a lookup | Yes: drag |
| 4 | Digital balance | Instrument | 0.01 g resolution, tare key, 2 s settling, drifts 0.02 g when the bench is tilted; provided as a contrast to the beam balance | Yes: swap |
| 5 | Graduated cylinder set | Instrument | 10 mL with 0.1 mL divisions, 100 mL with 1 mL divisions, 250 mL with 5 mL divisions; borosilicate look with a real refractive water column | Yes: swap |
| 6 | Meniscus surface | Structure | Curved liquid top rendered with a concave dip and a bright edge highlight; its apparent position on the scale shifts with the eye icon's height | No |
| 7 | Vernier caliper | Instrument | 150 mm stainless caliper: main scale in 1 mm, vernier scale of 20 divisions giving 0.05 mm, external jaws, internal jaws, depth rod, thumbwheel and lock screw; jaws close on the specimen and stop at its true width | Yes: drag |
| 8 | Rules | Instrument | 1 m steel rule and a 30 cm plastic rule, both graduated in mm; the plastic rule has a visibly worn end so the zero mark is not at the edge | Yes: swap |
| 9 | Thermometer | Instrument | −10 to 110 °C alcohol column in glass, 1 °C divisions, 20 s response time; reads air unless the bulb is fully immersed | Yes: place |
| 10 | Stopwatch | Instrument | 0.01 s display with start, stop and lap; adds a 0.15–0.25 s human reaction offset to every manual start and stop | Yes: place |
| 11 | Specimen tray | Actor | River pebble 24.3 g, steel bolt 11.85 mm shank, aluminium cube 20.0 mm, wooden block 45×30×20 mm, brass nut of irregular shape, 50 mL water sample; each carries hidden true values to four significant figures | Yes: swap |
| 12 | Displacement kit | Structure | 250 mL beaker, overflow can with spout, small catch cylinder, thread hook; used for the volume of an irregular solid | Yes: place |
| 13 | Eye-level marker | UI-Probe | Eye icon on a vertical track beside the cylinder, ±15 cm about the meniscus; drives the parallax offset applied to the apparent reading | Yes: drag |
| 14 | Magnifier scale panel | UI-Probe | Fixed panel at top right showing a 6× view of whichever scale the cursor is over, with the nearest graduation labelled | Yes: drag |
| 15 | Reading entry and tolerance checker | Instrument | Numeric field plus a unit dropdown; checks the value against the true value within half the smallest division, and separately checks the number of digits claimed | No |
| 16 | Unit conversion ladder | Overlay | Vertical ladder for km–m–cm–mm, kg–g–mg, L–mL–cm³, with animated ×10 and ÷10 rungs; lights the rungs the current conversion crosses | No |

**How it works — the model.**
Every instrument is mechanical, not a lookup. The balance sums real torques: pan load times arm length against each rider's mass times its distance, so the pointer settles only when the sum is zero, and the zero-adjust trim and the bench tilt both enter that sum. The cylinder reading is a geometric projection: apparent scale position equals true meniscus height plus the eye offset times a parallax factor set by the viewing distance, which is why the same 45 mL reads 47 mL from above. The caliper computes vernier alignment directly, so exactly one vernier line coincides with a main-scale line. Every instrument declares a smallest division, and the checker demands a reading estimated one digit beyond it, with an uncertainty of half a division. The failure to avoid is the calculator answer: no reading may ever appear pre-formatted, and no derived quantity may carry more significant figures than its least precise input.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Instrument on the bench | Dropdown | Triple-beam balance / Digital balance / Graduated cylinder / Vernier caliper / Rule / Thermometer / Stopwatch | Triple-beam balance | — | Structural: which instrument is live, magnified and accepting a reading |
| Specimen | Dropdown | River pebble / Steel bolt / Aluminium cube / Wooden block / Brass nut / Water sample | River pebble | — | The hidden true mass, volume and dimensions the instruments must reveal |
| Rider positions | Drag-handle | Rear beam 0–500 g in 100 g notches, middle beam 0–100 g in 10 g notches, front beam 0.0–10.0 g continuous | 0 / 0 / 0.0 | g | Beam torque, pointer position and how long the pointer takes to settle |
| Zero-adjust trim | Dial | −0.50 to +0.50 | 0.00 | g | Systematic offset on every mass reading until the student zeroes it |
| Bench tilt | Dial | −2.0 to +2.0 | 0.0 | ° | Spirit bubble position and a proportional bias on both balances |
| Cylinder size | Dropdown | 10 mL (0.1 mL divisions) / 100 mL (1 mL) / 250 mL (5 mL) | 100 mL | — | Structural: the smallest division, and therefore the digits you may honestly claim |
| Liquid volume | Slider | 0–100 | 45 | mL | True volume in the cylinder and the height of the meniscus on the scale |
| Eye level | Slider | −15 to +15 | 0 | cm relative to meniscus | Parallax; how far the apparent reading sits from the true one |
| Entry unit | Dropdown | mm / cm / m / g / kg / mL / L / cm³ / s / °C | g | — | The unit your typed reading is interpreted in; a wrong unit fails the check outright |
| Reveal true value | Toggle | On / Off | Off | — | After you commit a reading, shows the simulator's true value and your error |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Zero first | Instrument=Triple-beam balance; specimen=River pebble; zero-adjust trim=+0.35; bench tilt=0.0 | Weigh the pebble, then zero the balance and weigh it again. How big was the error, which way did it go, and would repeating the measurement have caught it? |
| S2 | The meniscus and your eye | Instrument=Graduated cylinder; cylinder size=100 mL; liquid volume=45; eye level stepped +10, 0, −10 | Record three readings of the same 45 mL of water. Which one is correct, and what physically changed between them? |
| S3 | Rule against caliper | Instrument=Rule then Vernier caliper; specimen=Steel bolt | Give the bolt's shank diameter to as many digits as each tool honestly allows. Which digit is the estimated one in each case? |
| S4 | Density, twice over | Instrument sequence=Triple-beam balance then Graduated cylinder; specimen=Aluminium cube; cylinder size=100 mL; displacement kit in use | Report the cube's density in g/cm³ and again in kg/m³. Why is one number a thousand times the other when the metal has not changed? |

**Student activities.**
1. Zero the balance with an empty pan, then drag the three riders to weigh the pebble. Record the mass with its uncertainty as ± half the smallest division.
2. Set the eye marker to +10 cm, 0 cm and −10 cm in turn and record the cylinder reading each time, then state which is the true volume.
3. Measure the aluminium cube's edge with the rule, then with the caliper. Record both, each with the correct number of significant figures, and note which digit is estimated.
4. Find the brass nut's volume by displacement: record the cylinder level before and after, then subtract. Record all three numbers.
5. Convert your cube density from g/cm³ to kg/m³ using the conversion ladder, and write down how many rungs you climbed and in which direction.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Committed reading | Live numeric | Selected unit | The value you typed, shown with the unit you chose |
| Tolerance check | Pass-fail badge | — | Green when your value falls within half the smallest division of the true value |
| Significant figures check | Pass-fail badge | — | Green only when the digit count matches what the instrument's precision supports |
| Absolute error | Live numeric | Same as reading | Your value minus the true value, shown only when reveal is on |
| Uncertainty | Live numeric | Same as reading | ± half the smallest division of the instrument in use |
| Precision comparison | Bar chart | mm or g | Uncertainty of each instrument used on the same specimen, side by side |
| Conversion trace | Data table | mixed | Each conversion attempted, the rungs crossed, and whether the exponent moved the right way |
| Measurement log | Data table | mixed | Every committed reading with instrument, specimen, unit, uncertainty and pass/fail, exportable as CSV |

**What the student should realise.**
Students believe a measurement is a number, and that more decimal places mean a better one. Here the 250 mL cylinder cannot support a tenth of a millilitre, eye position changes the reading without changing the water, and the balance lies until it is zeroed. A measurement is a number, a unit and an uncertainty, and the instrument decides how many digits you may claim. The student should be able to say: *"My last digit is a guess, and the instrument tells me which digit that is."*

### A5.4 · Organizing and graphing data

**Experiment name:** The Plotting Bench: Charts That Lie  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-6

**Theme & scene.**
A dark drafting table lit from within, laid out like a workbench rather than a spreadsheet. Down the left edge, a spool of field data unwinds and rows tick past on a paper ribbon, still warm from the logger. In the centre, a large white chart canvas glows on a light box, empty at first with two bare axis rails waiting. Along the right edge sits a rack of variable chips, one per column, each colour-edged by type: blue for continuous, amber for time, grey for category. Beneath the canvas turns a chart-type carousel of six mark styles. Top right, a small cartoon reader in a chair studies whatever you have drawn and says out loud what they conclude from it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Data spool and row ticker | Actor | Paper ribbon feeding from a reel at 4 rows/s on load, then parking; hovering a row highlights its mark on the canvas | No |
| 2 | Dataset cartridges | Structure | Five slot-in cartridges: Sierra snowpack water content by month (n=48), Monterey kelp canopy area vs sea surface temperature (n=96), class reaction times (n=120), Central Valley annual rainfall 1980–2024 (n=45), dissolved oxygen vs depth in a Delta slough (n=60) | Yes: swap |
| 3 | Variable chips | Structure | One 60×28 px chip per column, labelled with name and unit, edge-coloured by data type; drag onto an axis rail to assign | Yes: drag |
| 4 | Axis rails | Structure | Horizontal and vertical drop rails flanking the canvas; a chip snapped onto a rail sets that axis, and a mismatched type makes the rail flash amber | Yes: connect |
| 5 | Chart canvas | Environment | 720×520 px white plotting field on a light box, with a redraw animation that tweens marks whenever any choice changes | No |
| 6 | Chart-type carousel | UI-Probe | Rotating strip of six mark styles: scatter, line, bar, histogram, pie, box plot; each shows a thumbnail of the current data drawn that way | Yes: swap |
| 7 | Axis scale controls | Instrument | Min, max, tick interval and linear/log switch on each axis, with a tick ruler you can drag to change spacing directly | Yes: drag |
| 8 | Truncation ghost | Overlay | Whenever a bar chart's y-axis does not start at zero, a translucent grey version of the same chart drawn from zero is laid behind it | No |
| 9 | Data marks | Particle | The plotted points, bars, boxes and slices themselves; 4 px dots, 18 px bars, animated into position on every rebuild, each carrying its source row id | No |
| 10 | Trend line and residual sticks | Overlay | Least-squares line with thin vertical sticks from each point to the line; toggled, drawn only for two continuous variables | No |
| 11 | Naive reader avatar | Actor | Seated figure with a speech bubble that states, in one sentence, the conclusion the chart as drawn supports, right or wrong | No |
| 12 | Chart critique engine | Instrument | Invisible rule set of twelve named faults: truncated axis, wrong mark for the data type, unequal category spacing, pie of non-parts, missing units, missing spread, over-plotting, connected non-series, reversed axis, log without label, dropped rows, misleading aspect ratio | No |
| 13 | Fault pins | Overlay | Numbered pins that drop onto the offending region of the chart when a fault fires, each expanding to a one-line explanation | Yes: place |
| 14 | Data table view | Instrument | Sortable, filterable grid of the loaded rows, side-by-side with the canvas; selecting rows dims their marks | Yes: drag |
| 15 | Spread whiskers | Overlay | Range bars or box whiskers drawn per aggregated group, showing what the summary hid | No |
| 16 | Export card | Instrument | A framed card holding the chart image, the caption the student types, and the CSV of exactly the rows drawn | Yes: swap |

**How it works — the model.**
Nothing is simulated physically here; the model is the grammar of graphics. Each dataset column is typed as categorical, ordinal, continuous or temporal, and each chart type declares which types it accepts on each axis. Assigning a chip runs a compatibility test, and an incompatible pairing still draws, badly, because seeing the bad chart is the lesson. Scales are pure transforms: a mark's pixel position is (value − axis min) ÷ (axis max − axis min) times the canvas span, so truncating the axis genuinely multiplies apparent differences without changing a single number. The critique engine scores the chart against twelve faults each frame. The naive reader is the honest part: it reads only pixel geometry, comparing bar heights and slopes as a person would, and reports the conclusion that geometry supports. When the reader's conclusion and the dataset's true relationship disagree, the gap is displayed as a number.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Dataset | Dropdown | Sierra snowpack / Monterey kelp / Class reaction times / Central Valley rainfall / Slough oxygen by depth | Sierra snowpack | — | Structural: which rows, columns and chips exist at all |
| X variable | Drag-handle | Any chip from the rack onto the horizontal rail | Month | — | Horizontal variable and, through its type, which chart types are sensible |
| Y variable | Drag-handle | Any chip from the rack onto the vertical rail | Snow water equivalent | — | Vertical variable and the axis units |
| Chart type | Radio | Scatter / Line / Bar / Histogram / Pie / Box plot | Line | — | Which mark is drawn for each row or group |
| Y-axis start | Dropdown | Zero / Auto-fit / Custom | Zero | — | Where the vertical axis begins; anything but zero on a bar chart raises the truncation ghost |
| Y-axis maximum | Numeric field | 1–1200 | 1200 | mm | How much vertical room the data gets, and therefore how steep everything looks |
| Axis scale | Radio | Linear / Logarithmic | Linear | — | How values spanning several orders of magnitude are spaced |
| Aggregation | Dropdown | Every row / Mean per group / Median per group / Total per group | Every row | — | How many marks are drawn and how much individual spread is hidden |
| Show spread | Toggle | On / Off | Off | — | Draws range bars or box whiskers on aggregated groups |
| Reader test | Toggle | On / Off | On | — | Whether the naive reader states the conclusion your chart supports |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Snow through the year | dataset=Sierra snowpack; X=Month; Y=Snow water equivalent; chart type=Line; Y-axis start=Zero | Try line, bar and pie on the same rows. Which one shows the melt season, and why is a pie chart impossible for these data? |
| S2 | The cliff that is not there | dataset=Central Valley rainfall; chart type=Bar; Y-axis start=Custom; Y-axis maximum=520 | The reader says rainfall collapsed. By how many millimetres did it actually change, and what did your axis do to that number? |
| S3 | Kelp and warm water | dataset=Monterey kelp; X=Sea surface temperature; Y=Kelp canopy area; chart type=Scatter, then Line | Two measurements with no time order. Which mark is right, and what does joining the dots falsely claim? |
| S4 | One hundred and twenty people | dataset=Class reaction times; chart type=Histogram, then Bar with aggregation=Every row; show spread=On | What does the histogram reveal about the class that a bar per person hides, and what does the mean alone leave out? |

**Student activities.**
1. Drag Month onto the X rail and Snow water equivalent onto Y, then step through all six chart types. Record which faults the pins report for each.
2. Set Y-axis start to Custom and narrow the range until the reader announces a collapse. Record the axis limits you used and the true change in mm.
3. Plot kelp against temperature as a scatter, turn on the trend line, and record the direction of the relationship in one sentence with numbers.
4. Aggregate the reaction times to Mean per group with spread off, then turn spread on. Record the mean and the range, and say which one you would report.
5. Write a caption for your best chart, export it, and check whether the reader's conclusion now matches the true relationship.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Chart canvas | Line graph | Dataset units | The live chart, redrawn on every control change |
| Chart score | Live numeric | 0–100 | Starts at 100 and deducts per active fault, weighted by how badly each misleads |
| Fault list | Data table | — | Every fault currently firing, with the pin number and the region it points at |
| Reader's conclusion | Live numeric | — | The sentence the naive reader draws from the pixels, updated on each redraw |
| Misreading gap | Live numeric | % | Difference between the apparent effect size the chart implies and the true effect size in the rows |
| Spread summary | Bar chart | Dataset units | Mean, median and range for each group when aggregation is on |
| Rows drawn versus rows loaded | Counter | count | Flags any rows silently dropped by the current axis limits |
| Export card | Data table | mixed | Chart image, caption and the exact CSV of the rows plotted |

**What the student should realise.**
Students believe a graph is decoration added after the science, and that a chart cannot be wrong if its numbers are right. Here the same forty-five true rainfall numbers produce a collapse and a flat line depending on one axis setting, and the reader is fooled every time. The chart is the claim. The student should be able to say: *"The numbers did not change, my axis did, so the graph was making the argument, not the data."*

### A5.5 · Claim, evidence and reasoning

**Experiment name:** Argument Bridge: The Delta Fish Kill  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Rigid-body  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
Split screen. Above, a Sacramento Delta slough at first light: olive water, tule reeds, a thick jade algae mat hugging the north bank, and two dozen bluegill drifting pale-belly-up against the reed line. A concrete outfall pipe from a tomato field dribbles into the channel; a small aluminium survey skiff waits at the ramp for the student to drive it. A timeline ribbon under the scene runs from fourteen days before the kill to two days after. Below, in cross-section, a rocky gap: an evidence pier on the left, a claim pier on the right, and nothing between them but air. Planks and girders lie in a stack. A small red load-test cart waits at the left abutment.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Slough channel and flow field | Environment | 400 m reach, 60 m wide, 0–3.5 m deep with a scoured centre; tidal flow reversing twice daily at 0.1–0.4 m/s, drawn as drifting surface streaks | No |
| 2 | Algae mat | Actor | Procedural jade-green cover, 0–90 % of the surface, thickening over the fourteen days then collapsing to brown after the kill; blocks light to the water beneath and respires all night | Yes: resize |
| 3 | Fish population agents | Actor | Bluegill and mosquitofish, 400 agents, shoaling and depth-seeking; each carries an oxygen-stress state that turns it from silver to pale and finally to a floating body | No |
| 4 | Farm outfall and nutrient plume | Field | 300 mm concrete pipe on the north bank with a visible discharge cone; nitrate and phosphate scalar fields spreading downstream on the ebb | Yes: drag |
| 5 | Survey skiff with sonde | Actor | 4 m boat the student steers along the reach; a multiparameter sonde on a winch line reads dissolved oxygen, temperature, nitrate, pH, salinity and turbidity at the set depth | Yes: drag |
| 6 | Sampling site pins | Instrument | Up to eight numbered pins dropped anywhere on the reach; each stores a full vertical profile at the moment it was taken | Yes: place |
| 7 | Dissolved oxygen field | Field | Three-dimensional scalar, 0–12 mg/L, with a strong diurnal swing under the mat: 11 mg/L at 16:00, crashing to 1.4 mg/L at 05:00, and stratified so the bottom stays lowest | No |
| 8 | Timeline scrubber | UI-Probe | Ribbon from day −14 to day +2 in one-hour steps, with the algae cover, temperature and oxygen traces drawn along it as a sparkline | Yes: drag |
| 9 | Evidence cards | Structure | Auto-generated on each sample: a 140×90 px plank showing the quantity, value, site, depth and timestamp; its physical thickness in the bridge scales with its relevance to the current claim | Yes: drag |
| 10 | Claim rack | Structure | Five hanging claim cards, including one vague, two wrong-cause and one over-broad; selecting one raises it onto the right-hand pier | Yes: swap |
| 11 | Reasoning girders | Structure | Twelve candidate linking statements as steel girders of different lengths; each snaps between a plank and the next only if it actually connects those two ideas | Yes: connect |
| 12 | Bridge span and piers | Structure | Evidence pier at left, claim pier at right, 12 m gap; planks lay flat, girders truss beneath, and unsupported sections visibly sag | No |
| 13 | Load-test cart | Actor | Red four-wheeled cart with adjustable ballast; drives left to right at 1 m/s, falls through any gap or any plank whose relevance weight is below its axle load | No |
| 14 | Rebuttal bot | Actor | An opposing scientist at the right abutment who states the strongest alternative explanation the data still allows and sends a heavier cart across | No |
| 15 | Gap detector | Instrument | Invisible checker walking the evidence to reasoning to claim chain, reporting each break as a named gap with its position on the span | No |
| 16 | Argument scorecard | Overlay | Panel listing every card with its relevance percentage, every girder with its logical validity, and the final claim strength | No |

**How it works — the model.**
Two engines run together. Underneath, a real ecosystem model: algae photosynthesise in daylight and respire day and night, so oxygen swings hard under a thick mat and bottoms out just before dawn; nitrate from the outfall drives mat growth over the fourteen days; water temperature sets oxygen solubility; fish agents die when dissolved oxygen stays below 2 mg/L for more than three hours. Every measurement the skiff takes is genuinely drawn from those fields at that place, depth and hour. On top runs the argument mechanic: each evidence card is scored for relevance to the selected claim, defined as how much the measured quantity actually changed the modelled fish mortality. Relevance becomes plank thickness. Reasoning girders carry a validity flag, and only a valid girder bridges two planks. The cart then physically drives the argument, and it falls exactly where the reasoning does.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Case | Dropdown | Delta fish kill / Schoolyard heat islands / Oak grove die-off | Delta fish kill | — | Structural: which live scene, dataset, claim rack and girder set load |
| Claim | Dropdown | Something in the water killed the fish / Low dissolved oxygen before dawn killed the fish / Fertiliser from the farm poisoned the fish / The water got too hot for fish / Algae eat fish | Something in the water killed the fish | — | Which card rises onto the claim pier and therefore how every evidence card is scored |
| Sampling site | Drag-handle | Anywhere along the 400 m reach, up to 8 pins | Two pins: at the outfall and mid-channel | — | Where the sonde reads, and whether you sample under the mat or in clear water |
| Sample depth | Slider | 0.0–3.5 | 0.5 | m | Which layer the sonde reads; oxygen is stratified and the bottom is worst |
| Timeline position | Timeline scrubber | Day −14 to day +2, 1 h steps | Day 0, 05:00 | — | When the sample is taken; the oxygen crash sits between 03:00 and 07:00 |
| Evidence on the bridge | Multi-select | Any collected cards, maximum 6 | The first two cards collected | — | Which planks bear load; irrelevant planks are paper-thin |
| Reasoning girders | Drag-handle | Twelve candidate statements, snapped into the gaps between planks | None placed | — | Whether each plank actually connects to the next and to the claim |
| Challenge weight | Dial | 1×–5× | 2× | — | Ballast on the load-test cart, and therefore how strong the argument must be |
| Rebuttal bot | Toggle | On / Off | On | — | Whether the strongest alternative explanation is argued against you |
| Reveal the true cause chain | Toggle | On / Off | Off | — | After a load test, shows the model's actual chain of causes for comparison |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The vague claim | claim=Something in the water killed the fish; evidence=any 3 cards; challenge weight=2× | The planks are laid but the cart still falls at the right-hand end. What is missing from a claim like this, and how would you make it testable? |
| S2 | Right answer, wrong evidence | claim=Low dissolved oxygen before dawn killed the fish; evidence=nitrate at the outfall + water temperature at noon; challenge weight=2× | Your claim matches the simulator's own cause. Why does the bridge still collapse? |
| S3 | Before dawn, under the mat | timeline=Day 0, 05:00; sample depth=2.5; sampling site=3 pins under the algae mat | What oxygen value did you record, and what can that one number support that a sample taken at noon could not? |
| S4 | The opposing scientist | rebuttal bot=On; challenge weight=5×; claim=Low dissolved oxygen before dawn killed the fish | The rebuttal is that a salty tide pushed in and killed them. Which single extra measurement removes that alternative, and why? |

**Student activities.**
1. Drive the skiff to three sites, drop pins, and sample at 0.5 m and 2.5 m at both 05:00 and 16:00. Record all eight oxygen values in a table.
2. Select the vague claim, build the bridge with your three strongest cards, run the load test at 2×, and record where the cart falls.
3. Swap to a specific claim, rebuild, and record the relevance percentage the scorecard gives each of your cards.
4. Place reasoning girders until the gap detector reports zero gaps, then write down the sentence each girder carries in order.
5. Turn the rebuttal bot on at 5×, record the alternative it raises, then collect the one measurement that defeats it and re-run.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Load test | Pass-fail badge | — | Green when the cart crosses at the set challenge weight, red at the plank or gap where it fell |
| Card relevance | Bar chart | % | One bar per evidence card, showing how much that quantity actually mattered to fish mortality |
| Gap list | Data table | — | Every break in the evidence to reasoning to claim chain, with its position and its name |
| Claim strength | Live numeric | 0–100 | Combines evidence relevance, reasoning validity and how specific the claim is |
| Rebuttal survival | Pass-fail badge | — | Green only when the argument still crosses after the alternative explanation is loaded on |
| Sonde profiles | Line graph | mg/L, °C vs m | Vertical profiles of oxygen, temperature and salinity at each pin, per timestamp |
| Fish mortality | Line graph | count vs h | Cumulative deaths against the oxygen trace, for comparison after the test |
| Argument transcript | Data table | mixed | Claim, ordered evidence, ordered reasoning and the test result, exportable as CSV |

**What the student should realise.**
Students believe evidence means any true fact they collected, and that a correct conclusion excuses weak support. The bridge refuses both: a true nitrate reading taken at the wrong hour is a paper-thin plank that carries nothing, and the right claim still collapses when nothing connects it to the data. The student should be able to say: *"Evidence only counts if it is about the thing I am claiming, and reasoning is the part that carries the weight."*

### A5.6 · Designing an investigation of a system

**Experiment name:** Run My Plan: The Ecocolumn Trial  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS2-3

**Theme & scene.**
Two halves of one room. On the left, a magnetic planning board with nine empty slots down its face, from Question to Recording, and a tray of snap-together procedure blocks in bright plastic below it. On the right, a shelf of ecocolumns: two-litre bottle stacks, each a terrestrial chamber of loam and radish seedlings above a decomposition chamber of oak litter and red worms above an aquatic chamber of pond water, elodea and ramshorn snails. A shop lamp hangs over the left end of the shelf; a window at the right end throws a cooler, brighter wash across the last two columns. Press RUN and the room time-lapses, the plan executes exactly as written, and a review panel slides up.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Planning board | UI-Probe | 1.2 m magnetic whiteboard with nine labelled slots: Question, Independent variable, Dependent variable, Controlled variables, Procedure, Instruments, Replicates, Duration, Recording; empty slots read as gaps, not as errors, until RUN | Yes: place |
| 2 | Procedure block tray | Structure | Eighteen snap blocks with fill-in fields: Build N columns; Set variable to value in column i; Hold variable identical; Measure quantity with instrument; Repeat every interval; Randomise shelf positions; Run for D days; Record to table; Photograph daily; Compare means | Yes: connect |
| 3 | Ecocolumn assembly | Structure | Three 2 L PET bottles, cut and screw-coupled, 42 cm tall, cotton wick between the lower two, mesh vent in the cap; up to twelve instances on the shelf | Yes: swap |
| 4 | Terrestrial chamber contents | Actor | 350 g loam, 12 radish seeds sprouting on day 3, six isopods that move to the damp side; height and leaf count tracked per plant | Yes: place |
| 5 | Decomposition chamber | Actor | 20 g dry oak litter, four red worms, fungal bloom appearing from day 6; litter mass falls on a decay curve and the leachate darkens | Yes: place |
| 6 | Aquatic chamber | Actor | 600 mL pond water, three elodea sprigs pearling oxygen in light, four ramshorn snails grazing, an algae film thickening on the sunlit face | Yes: place |
| 7 | Shop lamp and light field | Field | 40 W lamp over the left bay; illuminance field falling from 8000 lx at bay one to 2200 lx at bay twelve | Yes: drag |
| 8 | Window draft and temperature gradient | Field | Hidden nuisance field: 3 °C cooler and 1200 lx brighter at the window end, with a daily swing twice as large there | No |
| 9 | Instrument rack | Instrument | Steel rule ±1 mm, digital balance ±0.01 g, dissolved oxygen probe ±0.2 mg/L, thermometer ±0.5 °C, lux meter ±50 lx, pH strips ±0.5, 10 mL syringe ±0.5 mL; each instrument stamps its own uncertainty onto the data column it fills | Yes: swap |
| 10 | Procedure executor | Instrument | Invisible interpreter that walks the block sequence literally; anything the plan does not specify is filled by a random but legal choice, and that choice is logged | No |
| 11 | Nuisance event generator | Field | Scheduled realistic disturbances: a four-day cloudy spell, one snail death, 8 % evaporation per week, one seed that never germinates | No |
| 12 | Auto data table | Instrument | Grows only the columns the plan asked for, at the intervals the plan set; unmeasured quantities are simply absent, not blank | Yes: drag |
| 13 | Design critique panel | Overlay | Ten criteria as coloured rows: testable question, single independent variable, controlled variables, replicates, instrument precision, sampling interval, duration versus process timescale, position randomisation, safe procedure, conclusion supported | No |
| 14 | Peer-review avatars | Actor | Three reviewers who each raise the fault their role would raise: a statistician on replicates and spread, a field ecologist on timescale and confounds, a technician on instruments and procedure | No |
| 15 | Version comparison rack | Overlay | Side-by-side view of v1 and v2 plans, their datasets and their scorecards, with changed blocks outlined | Yes: swap |
| 16 | Report skeleton export | Instrument | Card assembling the question, method blocks in order, the data table, the graph and a conclusion field the student fills | Yes: swap |

**How it works — the model.**
The ecocolumn runs a coupled stock-and-flow model at one tick per simulated hour: light drives elodea and radish photosynthesis, which adds oxygen and biomass; litter decays on a first-order curve, releasing nitrate downward into the aquatic chamber; snails and worms respire, drawing oxygen down overnight so dissolved oxygen swings between 3 and 9 mg/L within a single day. On top of that sits a literal procedure executor. It never repairs a plan. If the plan does not say when to measure, it measures at a random hour and the diurnal swing appears as noise; if the plan does not say to randomise shelf position, the light and temperature gradient is left standing and silently confounds the result. Every unspecified detail is logged as an assumption. The critique engine then scores the plan on ten criteria against what the executor actually had to invent.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| System under study | Dropdown | Ecocolumn / Schoolyard bioswale / Classroom light and heat | Ecocolumn | — | Structural: which physical system, instrument rack and nuisance set load |
| Procedure sequence | Drag-handle | Up to 20 snap blocks from the tray, in any order | A five-block starter plan | — | Structural: the plan itself, executed literally and in the order written |
| Independent variable | Dropdown | Light hours / Water added / Litter mass / Snail count / Soil type / None chosen | None chosen | — | What is deliberately varied between columns; None chosen runs an observation study |
| Controlled variables | Multi-select | Light / Water / Temperature / Shelf position / Seed batch / Water source | Seed batch | — | What the executor forces identical across every column |
| Columns built | Stepper | 1–12 | 3 | count | Treatment levels times replicates; how much a single dead snail matters |
| Run duration | Slider | 3–60 | 14 | days | How long before the answer is read, against processes that take 6 to 30 days |
| Measurement interval | Slider | 1–168 | 24 | h | Sampling rate; a weekly sample cannot see a daily oxygen swing |
| Instrument per measurement | Dropdown | Rule / Digital balance / Dissolved oxygen probe / Thermometer / Lux meter / pH strips / Syringe | Rule for height, thermometer for temperature | — | The precision stamped on each data column |
| Randomise shelf positions | Toggle | On / Off | Off | — | Whether the lamp and window gradient is averaged out or left to confound |
| Time compression | Dial | 500×–50000× | 10000× | — | Simulated days per real second during the run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The plan you would actually write | Procedure sequence=starter five blocks; independent variable=None chosen; columns=1; duration=14; measurement interval=168 | Run it. What question can this data answer, and what is the honest answer to "why did the snails die"? |
| S2 | One variable, three columns | independent variable=Light hours; columns=3; controlled=Water, Temperature, Seed batch, Water source; randomise=Off; interval=24 | The lamp-end column wins. The ecologist says it was position, not light. Who is right, and which single toggle settles it? |
| S3 | Sampling too slowly | independent variable=Litter mass; interval=168; instrument=Dissolved oxygen probe; duration=21 | Oxygen reads almost the same every week. Set the interval to 3 h, re-run, and record what the weekly plan hid. |
| S4 | Revise and re-run | Load the v1 critique; fix the three red criteria; columns=9; randomise=On; interval=6; duration=21 | Which of your v1 conclusions survives v2, and which one turns out to have been the shelf, not the treatment? |

**Student activities.**
1. Build a plan by snapping blocks onto the board, then press RUN and record every assumption the executor logged because your plan did not say.
2. Set columns to 1 and run, then set columns to 9 and run the identical treatment. Record the mean and the range in both, and say which you would report.
3. Run the same investigation with the measurement interval at 168 h and then at 3 h. Record the dissolved oxygen minimum in each and explain the difference.
4. Turn randomise shelf positions on and re-run S2. Record the difference between the lamp-end and window-end columns before and after.
5. Read all three peer reviews, rewrite the plan to answer them, and record your v1 and v2 scores side by side on the comparison rack.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Executed dataset | Data table | mixed | Only the quantities the plan asked for, at the intervals it set, each column stamped with its instrument uncertainty |
| Assumption log | Data table | — | Every detail the plan left unspecified and the value the executor invented instead |
| Design scorecard | Bar chart | 0–10 | Ten criteria, each scored and colour-coded, with a one-line reason per criterion |
| Peer review | Data table | — | Three named critiques, one per reviewer role, each pointing at a specific block |
| Result with spread | Line graph | Depends on measure | The dependent variable against time, one trace per column, with range bands across replicates |
| Confound flag | Pass-fail badge | — | Red whenever an uncontrolled gradient could explain the result as well as the treatment can |
| What this data can and cannot say | Live numeric | — | Two short lists generated from the plan, not from the outcome |
| Version comparison | Data table | mixed | v1 against v2: blocks changed, criteria fixed, and whether the conclusion changed |
| Report skeleton | Data table | mixed | Question, method, data, graph and conclusion, exportable as CSV and PDF |

**What the student should realise.**
Students believe designing an investigation means writing neat steps. The executor takes them at their word: an unstated measurement time becomes a random one, an unrandomised shelf turns the lamp into the result, and one column cannot tell a treatment from bad luck. Every decision left out of the plan is made for you instead. The student should be able to say: *"If my plan does not say it, the experiment decides it, and then my result is about the wrong thing."*

---

*GradeNext Smart Lab · Grade 6 Unit A · 27 experiment specifications · standard v1.0*