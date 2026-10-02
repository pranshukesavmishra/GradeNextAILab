# GradeNext Smart Lab · Simulation Experiment Book
## Grade 7 · Unit A · Atoms and the Structure of Matter

**California Integrated Science, Grade 7** · Domain: Chemistry · 5 topics · 26 experiments
**NGSS performance expectations anchored:** MS-PS1-1
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
| A1.1 | Reviewing the particle model | Three Cells, One Substance | Hybrid 2D+3D | Particle system + Fluid/thermal | Manipulate | 12–18 min |
| A1.2 | Why chemistry needs a sharper picture | When the Simple Model Breaks | Hybrid 2D+3D | Data-driven model + State machine | Argue-from-data | 18–25 min |
| A1.3 | Evidence that particles are real | Chasing the Invisible: The Smoke Cell | Hybrid 2D+3D | Particle system | Investigate | 12–18 min |
| A1.4 | Particles versus atoms | Split It Again: Atoms Inside Particles | 3D Scene | Molecular | Design | 18–25 min |
| A1.5 | Scale of the atom | Ten Steps Down: Finding the Atom | 3D Scene | Procedural + Data-driven model | Explore | 12–18 min |
| A2.1 | Protons, neutrons and electrons | Assembling an Atom, Piece by Piece | 3D Scene | Particle system + State machine | Manipulate | 18–25 min |
| A2.2 | Atomic number defines the element | The Proton Count Decides | Hybrid 2D+3D | State machine + Data-driven model | Investigate | 12–18 min |
| A2.3 | Mass number and isotopes | Weighing Atoms: The Mass Spectrometer | Hybrid 2D+3D | Field/vector + Data-driven model | Investigate | 18–25 min |
| A2.4 | Building the model — early evidence | The Gold Foil Rig: Finding the Nucleus | 3D Scene | Field/vector + Particle system | Investigate | 18–25 min |
| A2.5 | Building the model — from shells to a cloud | Where Is the Electron, Really? | Hybrid 2D+3D | Ray/wave + Particle system | Investigate | 18–25 min |
| A2.6 | Why the model kept changing | Model Tournament: Five Atoms, Three Rigs | Hybrid 2D+3D | State machine + Field/vector + Data-driven model | Argue-from-data | 18–25 min |
| A3.1 | Reading a cell of the periodic table | Open the Drawer: What One Cell Is Telling You | Hybrid 2D+3D | Molecular + State machine | Investigate | 12–18 min |
| A3.2 | Groups and periods | Columns That Behave Alike | 3D Scene | Data-driven model + Molecular | Investigate | 12–18 min |
| A3.3 | Metals, non-metals and metalloids | The Materials Testing Bench | 3D Scene | Data-driven model + Rigid-body | Argue-from-data | 18–25 min |
| A3.4 | Why the table is organized this way | Mendeleev's Desk: Build the Table From Data | 2.5D Layered | Data-driven model + State machine | Design | 18–25 min |
| A3.5 | Reactivity patterns across the table | The Armoured Theatre: Measuring Vigour | 3D Scene | Fluid/thermal + Particle system | Investigate | 18–25 min |
| A4.1 | Element, compound and mixture | Twelve Jars and a Separation Bench | 3D Scene | Particle system + State machine | Investigate | 18–25 min |
| A4.2 | Reading a chemical formula | The Formula Translator | Hybrid 2D+3D | State machine + Molecular | Manipulate | 12–18 min |
| A4.3 | Subscripts versus coefficients | Two Dials: One Rebuilds, One Copies | 3D Scene | Molecular + State machine | Investigate | 12–18 min |
| A4.4 | Counting atoms in a formula | The Sorting Hopper: Every Atom Accounted For | 2.5D Layered | State machine + Particle system | Investigate | 12–18 min |
| A4.5 | Modeling a molecule from its formula | The Build Bench: Make It Legal in Three Dimensions | 3D Scene | Molecular | Design | 18–25 min |
| A5.1 | Ball-and-stick models | Sticks and Spheres: Build by the Rules | 3D Scene | Molecular | Design | 18–25 min |
| A5.2 | Space-filling models | The Empty Space Is a Lie | 3D Scene | Molecular | Manipulate | 12–18 min |
| A5.3 | When there is no single molecule | Find Me One Molecule | 3D Scene | Molecular + Field/vector | Investigate | 18–25 min |
| A5.4 | Comparing molecular and lattice structures | Two White Crystals, Four Tests | Hybrid 2D+3D | Data-driven model + Fluid/thermal + Molecular | Argue-from-data | 18–25 min |
| A5.5 | Choosing the right model for the job | Fit for Purpose: Pick Your Model | Hybrid 2D+3D | State machine + Molecular | Design | 12–18 min |

---

## A1 · The particle model, refined

### A1.1 · Reviewing the particle model

**Experiment name:** Three Cells, One Substance  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Particle system + Fluid/thermal  
**Interaction level:** Manipulate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A dark lab bench under warm tungsten light. Three thick-walled borosilicate cells stand in a steel rack: the left one holds a frozen block, the middle one a stirred liquid with a spinning flea, the right one a clear gas capped by a glass syringe. The same substance is in all three. Floating above each cell is a circular particle window, a cutaway loupe that magnifies a 5 nm patch of the contents and shows the actual particles, so the student sees macroscopic and particle views of the same thing at once. A hotplate runs under the rail, three thermometer probes dip into the cells, and the control panel is docked right. Ambient motion: gas particles streak, liquid particles slither past each other, solid particles buzz in place without leaving.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Steel cell rack | Environment | 640×90 px brushed rail with three clamp collars, matte gunmetal; casts a soft shadow on the bench | No |
| 2 | Cell A (solid) | Instrument | Borosilicate cylinder 60 mm tall, 30 mm bore, 3 mm wall, faint green edge tint; frosted where chilled | Yes: resize |
| 3 | Cell B (liquid) | Instrument | Identical cylinder, filled to 60 percent, meniscus curve drawn, faint condensation above the line | Yes: resize |
| 4 | Cell C (gas) | Instrument | Identical cylinder sealed by a sliding glass piston, volume scale 10–100 cm³ printed up the side | Yes: resize |
| 5 | Water molecule | Particle | Red O sphere r 0.73 Å with two white H spheres r 0.37 Å at 104.5°, bond cylinders 0.096 nm, 0.10 u dia | No |
| 6 | Argon atom | Particle | Single cyan sphere r 0.71 Å, glossy, no bonds, no internal detail | No |
| 7 | Iodine molecule | Particle | Two dark-violet spheres r 1.33 Å joined by one 0.267 nm cylinder, dumbbell tumbles as it moves | No |
| 8 | Particle window loupe | UI-Probe | 180 px circular cutaway above each cell, 1×–20× zoom, black rim, faint scanline; shows instanced particles | Yes: drag |
| 9 | Hotplate | Instrument | 620×40 px ceramic strip beneath the rail, glows dull orange above 100 °C, heat shimmer overlay | No |
| 10 | Thermometer probe ×3 | Instrument | Stainless 2 mm stems into each cell, digital head reading °C to 1 dp | Yes: drag |
| 11 | Gas syringe and plunger | Instrument | Glass barrel with a black rubber-tipped piston, draggable along a 10–100 cm³ scale | Yes: drag |
| 12 | Magnetic stirrer flea | Actor | 12 mm white PTFE bar in Cell B, spins 0–900 rpm, drags a vortex dimple in the liquid surface | Yes: swap |
| 13 | Rubber bung | Structure | Tapered black stopper for Cell C; when removed, gas particles escape upward and the count falls | Yes: place |
| 14 | Lattice constraint field | Field | Invisible spring network holding solid particles to fixed sites; stiffness falls to zero at the melting point | No |
| 15 | Speed histogram overlay | Overlay | Toggleable bar chart of particle speeds per cell, 20 bins, 0–1200 m/s | No |
| 16 | Wall collision probe | Instrument | Invisible plane on each cell wall counting particle strikes per second; feeds the pressure readout | No |

**How it works — the model.**
One particle population per cell, each particle a rigid body with a fixed size and a velocity drawn from a Maxwell distribution set by temperature. Mean speed rises with the square root of absolute temperature, so heating speeds particles up but never changes their size. In the solid, each particle is tethered to a lattice site by a spring and vibrates about it. Above the melting point the springs release and particles keep contact but exchange neighbours. Above the boiling point cohesion drops to near zero and particles fill the container. Pressure is computed from wall strikes per second, so compressing Cell C raises pressure with no change to the particles themselves. The failure to avoid: particles must never be drawn as small balls floating inside a continuous coloured fluid. When the loupe is open, the substance is nothing but the particles, with vacuum between them.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Substance | Dropdown | Water / Argon / Iodine | Water | — | Swaps the particle mesh, radius, mass and the melting and boiling points |
| Temperature | Slider | −50 to 200 | 25 | °C | Particle speed, spring stiffness, which cells change state |
| Gas volume | Drag-handle | 10–100 | 60 | cm³ | Piston position in Cell C, so spacing and wall strikes per second |
| Stirrer speed | Slider | 0–900 | 0 | rpm | Bulk flow in Cell B without changing particle speed |
| Particles in Cell C | Stepper | 20–200 | 80 | count | How many gas particles exist; pressure at fixed volume |
| Bung fitted | Toggle | On / Off | On | — | Off lets gas particles leave, so count and pressure fall |
| Loupe zoom | Dial | 1×–20× | 8× | — | Magnification inside the particle windows |
| Speed arrows | Toggle | On / Off | Off | — | Draws a velocity arrow on every particle, length proportional to speed |
| Trails | Toggle | On / Off | Off | — | Leaves a 2 s fading path behind each particle |
| Playback speed | Dial | 0.25×–4× | 1× | — | Time scaling of the whole bench |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Room temperature baseline | substance=Water; temperature=25; volume=60; bung=On | In which cell do particles stay in fixed places, in which do they swap neighbours, and in which do they fly free? |
| S2 | Heat it through | substance=Water; temperature=0 then 100 then 150; loupe zoom=12× | As the solid melts, do the particles get bigger, or does something else change? |
| S3 | Squeeze the gas | substance=Argon; volume=60 then 20; particles=80 | Halving the volume roughly triples the wall strikes. What did NOT change when you squeezed it? |
| S4 | Monterey fog bank | substance=Water; temperature=12; stirrer=0; trails=On | Water is nowhere near 100 °C, yet particles keep leaving the liquid surface. Where do they come from? |

**Student activities.**
1. Set temperature to 25 °C and open the loupe on all three cells. Record particle spacing and whether particles keep their neighbours, for each cell.
2. Drag the temperature slider from −20 °C to 150 °C in 20 °C steps and record the temperature at which Cell A loses its lattice and Cell B empties.
3. Predict, before touching the plunger, what happens to particle size when you halve the gas volume. Then drag the piston from 60 cm³ to 20 cm³ and record particle size, spacing and wall strikes.
4. Swap the substance to argon and repeat step 2. Record both change-of-state temperatures and compare them with water's.
5. Run the Monterey fog preset with trails on for 60 s and count how many particles leave the liquid surface and how many return.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mean particle speed | Live numeric | m/s | Per cell, averaged over 0.5 s |
| Nearest-neighbour spacing | Live numeric | nm | Mean centre-to-centre distance inside the loupe patch |
| Wall strikes | Live numeric | strikes/s | Cell C only; the pressure proxy |
| State badge | Pass-fail badge | — | Reads Solid, Liquid or Gas per cell from lattice and cohesion state |
| Temperature vs time | Line graph | °C vs s | Three traces; plateaus appear during melting and boiling |
| Speed distribution | Bar chart | count vs m/s | Twenty-bin histogram, redrawn each second |
| Run log | Data table | mixed | One row per setting, exportable as CSV |

**What the student should realise.**
Students believe a substance is a continuous stuff that has particles hidden inside it, and that heating makes the particles themselves swell. Every loupe view here shows the substance is nothing but particles plus empty space, and every readout shows that heating changes speed and spacing while size and mass stay fixed. The student should be able to say: *"Solid, liquid and gas are the same particles arranged and moving differently, not different particles."*

### A1.2 · Why chemistry needs a sharper picture

**Experiment name:** When the Simple Model Breaks  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A split bench in a bright teaching lab. On the left, real apparatus: a clamp stand, a tripod and gauze, a pipeclay triangle carrying a crucible with a lid, a gas burner with a sharp blue cone, a stoppered conical flask fitted with a delivery tube to a gas syringe, and an electronic balance reading to 0.01 g whose display is the brightest thing on screen. On the right, mounted on the wall, two glowing model boxes like small terraria. Model 1 holds featureless grey spheres, all identical. Model 2 holds CPK-coloured atoms that can bond. Each box runs its own prediction of whatever the bench is about to do and prints a card. A verdict strip runs along the bottom edge, still blank at load.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Gas burner | Instrument | 120 mm chrome barrel, rotating air collar, flame renders yellow-luminous to blue-roaring with collar position | Yes: drag |
| 2 | Tripod, gauze and pipeclay triangle | Structure | Black iron tripod 150 mm, mesh gauze square, white ceramic triangle seated on top | Yes: place |
| 3 | Crucible and lid | Instrument | Squat porcelain cup 30 mm across, off-white, lid liftable with tongs; contents visible when open | Yes: place |
| 4 | Electronic balance | Instrument | 140×110 px platform, LCD to 0.01 g, tare button, re-reads whenever an object is placed on it | Yes: place |
| 5 | Conical flask and bung | Instrument | 100 cm³ flask, orange rubber bung, side delivery tube; sealed or open per control | Yes: swap |
| 6 | Gas syringe | Instrument | 100 cm³ glass barrel on a stand, black piston, printed scale, slides out as gas is collected | No |
| 7 | Magnesium ribbon | Actor | Coiled silver strip 5 cm × 3 mm, dull grey oxide skin, burns to a white crumbly ash | Yes: place |
| 8 | Copper foil square | Actor | 20 mm orange-brown square, blackens from the edges inward as heating proceeds | Yes: place |
| 9 | Iron and sulfur mixture | Actor | Boiling tube of grey iron filings mixed with yellow sulfur powder, speckled; fuses to a uniform black solid | Yes: place |
| 10 | Bar magnet probe | Instrument | 50 mm red-blue magnet on a handle; drag it along a tube and iron filings jump to it, or do not | Yes: drag |
| 11 | Model box 1 — featureless particles | Overlay | Lit glass cube containing 60 identical matte grey spheres r 0.5 u, no colour, no bonds, no internal parts | No |
| 12 | Model box 2 — distinguishable atoms | Overlay | Same cube with CPK atoms: Mg green-grey 1.60 Å, O red 0.73 Å, C charcoal 0.77 Å, S yellow 1.02 Å, Fe orange-brown 1.26 Å, plus bond cylinders | No |
| 13 | Prediction card printer | Instrument | Brass console that prints one card per model per run, stating predicted mass change, predicted product, predicted magnet result | No |
| 14 | Verdict strip | Overlay | Bottom rail of paired badges, green tick or red cross, one pair per test | No |
| 15 | Atom inventory panel | Overlay | Live count of each element before and after, in two columns, with a totals row | No |
| 16 | Air supply field | Field | Invisible oxygen reservoir above the open crucible; depletes locally, refills from the room, absent inside a stoppered flask | No |

**How it works — the model.**
The bench is a small dataset of five real changes with measured values: magnesium burning (0.24 g ribbon gives 0.40 g white ash), copper heated in air (gains 25 percent), iron plus sulfur (grey mixture becomes one black solid), bicarbonate plus vinegar (open flask loses mass, sealed flask does not, gas syringe collects the difference), and ice melting (no change at all). Each model box is a separate rule engine run on the same starting conditions. Model 1 treats particles as identical and indivisible with no composition, so it can only predict rearrangement in space, which means mass constant, no new substance, magnet test unchanged. Model 2 treats particles as groups of distinct atoms that can be taken apart and recombined, so it predicts mass moving between the solid and the air while total atoms stay fixed. The verdict strip compares each printed prediction with the observed balance and syringe readings.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Change under test | Dropdown | Melt ice / Burn magnesium / Heat copper / Iron plus sulfur / Bicarbonate plus vinegar | Melt ice | — | Swaps the reactants, apparatus layout and the real dataset used |
| Model under test | Radio | Featureless particles / Distinguishable atoms / Both side by side | Both side by side | — | Which prediction engines run and print cards |
| Vessel | Dropdown | Open crucible / Stoppered flask / Flask plus gas syringe | Open crucible | — | Whether gas can leave the system, so whether the balance reading falls |
| Burner setting | Slider | 0–900 | 500 | °C | Flame temperature and whether the reaction starts at all |
| Starting mass | Slider | 0.10–1.00 | 0.24 | g | Mass of the sample placed in the crucible or tube |
| Run time | Slider | 0–180 | 60 | s | How long heating continues before the balance is read |
| Magnet probe | Toggle | On / Off | Off | — | Runs the magnet test on the tube and reports whether iron separates |
| Atom inventory | Toggle | On / Off | On | — | Shows the before and after element counts |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A change both models survive | change=Melt ice; vessel=Stoppered flask; model=Both side by side | Both models predict correctly here. What does that tell you about using melting to choose between them? |
| S2 | The ribbon that gains weight | change=Burn magnesium; vessel=Open crucible; mass=0.24; burner=650 | Mass rises from 0.24 g to 0.40 g. Which model can explain where the extra 0.16 g came from? |
| S3 | Sealed against open | change=Bicarbonate plus vinegar; vessel=Open crucible then Flask plus gas syringe | Mass falls in one vessel and holds in the other. What must the escaping gas be made of? |
| S4 | The magnet test | change=Iron plus sulfur; magnet=On; burner=700 | The magnet pulls filings out before heating but not after. Is the product a mixture or something new? |

**Student activities.**
1. Run the melt-ice preset with both models printing. Record each model's predicted mass change and the balance reading, and state whether either model failed.
2. Set the change to burning magnesium with an open crucible. Predict the balance reading before you press Run, then record the actual value and both model predictions.
3. Repeat the bicarbonate reaction twice, once open and once with the gas syringe fitted. Record the mass lost in the open run and the gas volume collected in the sealed run, and compare them.
4. Switch on the atom inventory for the magnesium run. Record the count of Mg and O atoms before and after and state which number changed.
5. Fill in the verdict strip for all five changes, then write one sentence naming the first test that the featureless model got wrong.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Balance reading | Live numeric | g | Two decimal places, updates as the vessel is loaded and after each run |
| Mass change | Live numeric | g | Final minus initial, signed, printed beside the predicted value |
| Gas collected | Live numeric | cm³ | Syringe barrel position, updated each second while gas is produced |
| Prediction versus observation | Data table | mixed | One row per model per test: predicted mass change, predicted product, observed values |
| Model scorecard | Pass-fail badge | — | Green or red per model per test, plus a running failure count |
| Atom inventory | Data table | count | Element-by-element totals before and after, with a difference column |

**What the student should realise.**
Students carry a particle model in which every particle is the same featureless dot, which is enough for melting and boiling and useless for chemistry. Here the same model that explains ice melting predicts the wrong mass for burning magnesium and the wrong magnet result for iron and sulfur. The student should be able to say: *"Particles have to be made of different kinds of atom, or nothing can explain how one substance turns into another."*

### A1.3 · Evidence that particles are real

**Experiment name:** Chasing the Invisible: The Smoke Cell  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Particle system  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-4

**Theme & scene.**
The lab is blacked out. A monocular microscope stands on the bench, its stage holding a 10 mm glass smoke cell with a slip lid. A lamp on the left throws a horizontal beam through a converging lens into the side of the cell, so anything inside glows white against total black. The dominant panel is the circular eyepiece view: forty pinpricks of California wildfire smoke, each one dancing an aimless jitter that never stops and never repeats. A crosshair reticle with a micrometre scale sits over the view. On the same bench to the right, a second station: a tall glass diffusion tube of still water with a purple potassium permanganate crystal about to be dropped in, and a thermometer beside it. The control panel is docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Microscope body | Instrument | Black enamel arm and base, coarse and fine focus wheels, three-objective turret marked ×4, ×10, ×40 | Yes: drag |
| 2 | Smoke cell | Instrument | 10 mm glass cube on the stage, chamfered corners, thin slip lid, faint fingerprint smudge on one face | Yes: place |
| 3 | Lamp and condenser lens | Instrument | Brass housing with a 6 V bulb and a 25 mm plano-convex lens on a slider rail; beam brightness adjustable | Yes: drag |
| 4 | Light beam volume | Environment | Thin bright wedge crossing the cell horizontally, visible as a dusty shaft only where smoke is present | No |
| 5 | Smoke speck | Actor | Irregular soot grain 0.5–8 µm, near-white specular point with a soft halo, 5–60 instances, never leaves the cell | Yes: resize |
| 6 | Air molecule | Particle | 0.3 nm pale-blue sphere, roughly 2000 in the cell volume, invisible unless the reveal toggle is on | No |
| 7 | Impulse solver | Field | Invisible per-frame routine giving each speck the vector sum of molecule strikes on its surface | No |
| 8 | Path tracer overlay | Overlay | Draws the trail of one selected speck as a straight-segment zigzag with a dot at each 0.5 s sample | No |
| 9 | Crosshair reticle | UI-Probe | Eyepiece graticule, 100 divisions, relabelled in µm when the objective changes | Yes: drag |
| 10 | Stopwatch | Instrument | Bench-top digital timer to 0.01 s, start and lap buttons, drives the sampling interval | No |
| 11 | Heating coil and thermometer | Instrument | Nichrome coil under the cell stage plus a probe reading to 1 dp; warms the enclosed air | Yes: place |
| 12 | Diffusion tube | Instrument | 300 mm glass tube, 20 mm bore, filled with still water, mm scale etched up the side | Yes: place |
| 13 | Permanganate crystal | Actor | 1 mm deep-purple grain, dissolves from the surface, releases colour that spreads with no stirring | Yes: place |
| 14 | Dye front tracker | Instrument | Detects the height where colour intensity first exceeds 10 percent, reports it in mm each second | No |
| 15 | Displacement plotter | Overlay | Live scatter of mean squared displacement against time for the tracked speck | No |
| 16 | Darkroom shutter | Environment | Black roller blind over the window; closing it raises the contrast of the eyepiece view | Yes: swap |

**How it works — the model.**
Two thousand invisible air molecules move at random through the cell at speeds set by temperature. Each smoke speck is a much heavier body that is hit from every side thousands of times per second. If the strikes were perfectly balanced the speck would sit still. They are not balanced, so each frame the speck receives a small net impulse in a random direction, and its path becomes a random walk. Mean squared displacement grows in proportion to time, which is why the plotter shows a straight line rather than a curve. Heating raises molecule speed so the jitter grows. Enlarging a speck raises its mass and its surface, and averaging over more strikes makes the jitter smaller, which is the honest reason big grains barely move. The reveal toggle draws the molecules, and the interface must label that view as the model, not the observation.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Station | Dropdown | Smoke cell / Diffusion tube / Both | Smoke cell | — | Which apparatus is on the bench and which readouts are active |
| Cell temperature | Slider | 5–80 | 20 | °C | Molecule speed, so the size and rate of the speck jitter |
| Speck size | Slider | 0.5–8.0 | 2.0 | µm | Mass and surface area of every smoke grain |
| Speck count | Stepper | 5–60 | 40 | count | How many grains are in the illuminated field |
| Reveal air molecules | Toggle | On / Off | Off | — | Draws the invisible bombarding molecules and labels the view as a model |
| Trail length | Slider | 0–20 | 5 | s | How much of the tracked speck's path stays on screen |
| Objective | Dropdown | ×4 / ×10 / ×40 | ×10 | — | Field of view and the micrometre value of one graticule division |
| Water temperature | Slider | 5–80 | 20 | °C | Diffusion tube only: how fast the purple front climbs |
| Playback speed | Dial | 0.25×–4× | 1× | — | Time scaling for both stations |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Cold and quiet | station=Smoke cell; temperature=20; speck size=2.0; trail=5 | Nothing is touching the specks that you can see. So what is moving them? |
| S2 | Heat the cell | station=Smoke cell; temperature=60; speck size=2.0 | Compare the jitter distance in 10 s at 20 °C and 60 °C. Which one is bigger, and by roughly how much? |
| S3 | Big grain, small grain | station=Smoke cell; speck size=0.5 then 8.0; temperature=20 | Why does the large grain barely move if the same air is hitting it? |
| S4 | Wildfire smoke and cold coffee | station=Both; water temperature=5 then 60; trail=10 | The purple front climbs faster in warm water. What does that share with the hot smoke cell? |

**Student activities.**
1. Set the cell to 20 °C and track one speck for 30 s with a 5 s trail. Record its net displacement and sketch the shape of the path.
2. Raise the cell to 60 °C, track the same size of speck for 30 s, and record net displacement again. Compare the two numbers.
3. Set speck size to 8.0 µm and repeat at 20 °C. Record the displacement and explain in one sentence why a bigger grain moves less.
4. Switch on reveal air molecules and write down what the model claims is happening. Then switch it off and write down what you can actually see.
5. Run the diffusion tube at 5 °C and 60 °C, timing the purple front to the 50 mm mark in each case. Record both times.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Net displacement | Live numeric | µm | Straight-line distance of the tracked speck from its start point |
| Mean squared displacement | Line graph | µm² vs s | Built from 0.5 s samples; a straight line is the signature of a random walk |
| Jitter rate | Live numeric | direction changes/s | How often the tracked speck changes heading by more than 30° |
| Dye front height | Line graph | mm vs s | Diffusion tube only, sampled each second |
| Track table | Data table | mixed | Time, x, y for the tracked speck, exportable as CSV |
| Temperature | Live numeric | °C | Cell air and tube water, 1 dp |

**What the student should realise.**
Students treat particles as a story adults tell, unsupported by anything they can see. Here the specks are visible and the thing shoving them is not, and yet the shoving is measurable, direction-changing, temperature-dependent and never stops. The student should be able to say: *"I cannot see the air molecules, but I can watch what they do to something I can see, and nothing else explains a jiggle that never stops."*

### A1.4 · Particles versus atoms

**Experiment name:** Split It Again: Atoms Inside Particles  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A bright white sorting bay lit from above like a jeweller's bench, with three zones on one worktop. On the left, ten open atom bins, each holding a drift of identical spheres in its CPK colour with the symbol stencilled on the bin lip. In the middle, a magnetic build plate ruled with a faint grid and studded with bond snap points, where the student assembles a particle by dragging atoms in. On the right, a sealed glass splitter bell with two electrode paddles and a red lever; pulling the lever pours energy into whatever particle is inside and, if there is a bond to break, the particle comes apart in slow motion. The bell floor carries a stencilled line: atoms cannot be split here. A small gas cell behind the bench shows thirty copies of the current particle, so the bulk substance is always in view.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Magnetic build plate | Structure | 300×200 mm white plate, 10 mm grid, glowing snap points that light green when a bond is legal | Yes: resize |
| 2 | Hydrogen atom | Particle | White sphere, covalent radius 0.37 Å, slight pearl sheen, symbol H on hover | Yes: place |
| 3 | Oxygen atom | Particle | Red sphere, 0.73 Å, matte, two bond sockets at 104.5° | Yes: place |
| 4 | Carbon atom | Particle | Charcoal sphere, 0.77 Å, four sockets in a tetrahedron | Yes: place |
| 5 | Nitrogen atom | Particle | Blue sphere, 0.75 Å, three sockets | Yes: place |
| 6 | Chlorine atom | Particle | Green sphere, 0.99 Å, one socket | Yes: place |
| 7 | Sodium atom | Particle | Violet sphere, 1.54 Å, no covalent socket; used only in the giant-structure tray | Yes: place |
| 8 | Noble atom (He, Ar) | Particle | He pale peach 0.31 Å, Ar cyan 0.71 Å, no sockets at all, cannot be bonded | Yes: place |
| 9 | Bond cylinder | Structure | Grey capsule 0.14 u diameter; single is one, double is two parallel, triple is three; length set per pair, for example 0.096 nm for O–H | Yes: swap |
| 10 | Splitter bell | Instrument | 180 mm glass dome with two brass electrode paddles and a red lever; interior lights blue when energy is applied | Yes: place |
| 11 | Bond energy gauge | Instrument | Vertical bar on the bell reading 0–500 kJ/mol with a marker at the current particle's weakest bond | No |
| 12 | Bulk gas cell | Instrument | 200 mm sealed cube behind the bench holding 10–60 instances of the current particle in Brownian motion | Yes: resize |
| 13 | Classification tray | UI-Probe | Three labelled slots: single atom, molecule of an element, molecule of a compound; accepts a dragged particle and scores it | Yes: drag |
| 14 | Giant structure tray | Structure | 3×3×3 alternating violet Na and green Cl spheres on a 0.282 nm cubic lattice, with a caption reading no molecules here | Yes: place |
| 15 | Atom inventory panel | Overlay | Live per-element count of what is on the build plate, in the bell and in the gas cell, with a totals row | No |
| 16 | Formula readout | Overlay | Auto-generated formula for whatever sits on the build plate, updating as atoms snap on | No |

**How it works — the model.**
The build plate runs a valence checker. Each atom carries a socket count, hydrogen one, oxygen two, nitrogen three, carbon four, chlorine one, and the nobles zero, so a bond only snaps when both partners have a free socket. The formula readout counts what is on the plate and prints it, which is where the difference between one particle and many atoms first becomes visible as two separate numbers. The splitter bell compares applied energy with the weakest bond in the loaded particle: below that value nothing happens, above it the bond breaks and the fragments separate. Atoms have no bonds to break, so applying maximum energy to argon does nothing at all, and the bell prints not divisible by this apparatus. Atom counts are conserved across every split, and the inventory panel must show that: fragments carry their atoms with them, nothing is created and nothing vanishes.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Particle to load | Dropdown | He / Ar / H₂ / O₂ / N₂ / H₂O / CO₂ / CH₄ / NaCl unit | H₂O | — | Loads a ready-built particle onto the plate and into the gas cell |
| Splitter energy | Slider | 0–500 | 0 | kJ/mol | Energy delivered by the bell; must exceed the weakest bond for anything to break |
| Bond type | Radio | Single / Double / Triple | Single | — | Which bond the next snap creates, and the cylinder count drawn |
| Bulk cell contents | Stepper | 10–60 | 30 | count | How many copies of the current particle fill the gas cell |
| Show bulk cell | Toggle | On / Off | On | — | Whether the bulk substance is displayed behind the bench |
| Explode view | Dial | 0–100 | 0 | % | Pulls bonded atoms apart along their bond axes without breaking them |
| Scale bar units | Dropdown | nm / Å / picometres | nm | — | Units on the ruler and on all distance labels |
| Classification check | Toggle | On / Off | Off | — | Turns on scoring for the three-slot tray |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Argon in a balloon | load=Ar; bulk=30; splitter energy=500 | The bell is at maximum and nothing breaks. How many atoms are in one particle of argon? |
| S2 | Oxygen gas comes apart | load=O₂; splitter energy=500; explode=0 | Oxygen gas splits into two pieces. Are those pieces still oxygen gas, and how would you tell? |
| S3 | Water into two gases | load=H₂O; splitter energy=500; bulk=30 | Water is a liquid but its atoms make gases. Which does the property belong to, the particle or the atom? |
| S4 | Salt from Monterey Bay | load=NaCl unit; classification=On; explode=40 | Where is the salt molecule in this tray, and what would you call the smallest repeating piece instead? |

**Student activities.**
1. Load argon, set splitter energy to 500 kJ/mol, pull the lever, and record what the bell prints and what the atom inventory shows.
2. Drag two hydrogen atoms and one oxygen atom onto the build plate and snap them into water. Record the formula readout, the number of particles and the number of atoms.
3. Split O₂ in the bell and record the atom inventory before and after. State which number stayed the same.
4. Load each of the nine particles in turn and sort them into the three classification slots. Record your score and correct any slot the checker marks red.
5. Compare the NaCl tray with the CO₂ gas cell and write one sentence saying why only one of them has a particle you can point at.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Particles versus atoms | Live numeric | count | Two numbers side by side for the current contents, updating on every snap or split |
| Formula readout | Live numeric | — | Auto-generated formula for the build plate contents |
| Atom inventory | Data table | count | Per-element totals before and after any split, with a difference column |
| Weakest bond energy | Live numeric | kJ/mol | The threshold the splitter must exceed for the loaded particle |
| Classification score | Pass-fail badge | — | Green per correct slot, red with a hint per wrong one |
| Build log | Data table | mixed | Every particle built or split this session, exportable as CSV |

**What the student should realise.**
Students use particle and atom as if they were the same word. Here argon resists the splitter because one particle is one atom, while oxygen and water come apart into atoms that are no longer the substance at all. The student should be able to say: *"A particle is the smallest piece of the substance, and it is often a group of atoms joined together, so the smallest piece of the substance and the smallest piece of matter are not the same thing."*

### A1.5 · Scale of the atom

**Experiment name:** Ten Steps Down: Finding the Atom  
**Render mode:** 3D Scene  
**Simulation engine:** Procedural + Data-driven model  
**Interaction level:** Explore  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
The scene opens at human scale: a gloved hand laying a 30 cm length of copper wire on a dark bench beside a steel ruler. Down the right-hand edge stands the instrument that runs this experiment, a calibrated zoom column with a brass dial notched in powers of ten from 10⁻¹ m down to 10⁻¹⁵ m, one click per decade, with a soft mechanical clunk at each stop. The scale bar bottom-left relabels itself at every click, from 30 cm through 3 mm, 30 µm, 300 nm, 3 nm, 0.3 nm and finally 3 fm. Along the base runs a logarithmic reference strip with pinned objects: a redwood, a hand, a grain of Sierra sand, a hair, a red blood cell, a virus, a DNA strand, a copper atom, a nucleus.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Zoom column dial | Instrument | Brass dial with 15 detents labelled 10⁻¹ to 10⁻¹⁵ m, a rotating cursor and a lit exponent window | Yes: drag |
| 2 | Specimen — copper wire | Actor | 30 cm × 1.2 mm drawn wire, warm orange-brown with a faint oxide bloom and lengthwise drawing marks | Yes: swap |
| 3 | Steel ruler | Instrument | 300 mm rule with mm graduations; stays in frame until the field of view drops below 1 mm | Yes: drag |
| 4 | Decade level-of-detail stack | Structure | Six swap-in meshes: wire surface, drawing scratches at 10⁻⁴, crystal grain boundaries at 10⁻⁵, stepped terraces at 10⁻⁸, atom lattice at 10⁻¹⁰, single atom at 10⁻¹¹ and below | No |
| 5 | Copper atom | Particle | Orange-brown sphere, metallic radius 0.128 nm, soft specular highlight, instanced roughly 4000 in the lattice view | No |
| 6 | Face-centred cubic cell | Structure | Cube edge 0.361 nm with corner and face-centre atoms, wireframe edges shown on hover | Yes: resize |
| 7 | Electron cloud shell | Field | Translucent fuzzy shell around one atom, density falling outward, opacity slider-driven | No |
| 8 | Nucleus knot | Structure | Bright pinpoint 6 fm across at the atom's centre; invisible until the dial passes 10⁻¹³ m | No |
| 9 | Scale bar overlay | Overlay | Black-and-white bar that redraws and relabels at each decade, always spanning a round number | No |
| 10 | Field-of-view readout | Instrument | Corner plate stating the real width of the frame in the current sensible unit | No |
| 11 | Logarithmic reference strip | Overlay | Base rail spanning 10² m to 10⁻¹⁵ m with pinned silhouettes; a marker slides to the current zoom | Yes: place |
| 12 | Comparison caliper | UI-Probe | Two draggable pins with a live separation readout in the current unit | Yes: drag |
| 13 | Stadium analogy arena | Environment | Full stadium model 100 m across representing one atom, terraced stands, floodlights, empty green centre | Yes: swap |
| 14 | Nucleus grain marker | Actor | 1 mm rice grain on the stadium centre spot, with a magnifier callout so it can be found at all | Yes: place |
| 15 | Atoms-across counter | Instrument | Enter a real width and it divides by the current atom diameter and prints the count | No |
| 16 | Emptiness overlay | Overlay | Shades the volume of the atom that contains no nucleus, with a live percentage caption | No |

**How it works — the model.**
The zoom dial drives one continuous logarithmic camera transform, and the level-of-detail stack swaps geometry at fixed exponents so the specimen stays honest at every scale. Real measurements drive everything: a copper atom is 0.256 nm across centre to centre, the fcc cell edge is 0.361 nm, a human hair is about 70 µm, so the atoms-across counter returns roughly 273000 atoms for a hair. The nucleus is set at about 6 fm, roughly forty thousand times smaller than the atom in diameter, which the emptiness overlay converts into a volume fraction of the order of 10⁻¹⁴. Stadium mode is not a picture, it is the same ratio rebuilt at a size a person can walk through: the atom becomes a 100 m arena and the nucleus a 1 mm grain on the centre spot. The camera can travel from the stands to the grain.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Zoom exponent | Slider | −1 to −15, stepped by 1 | −1 | log₁₀ m | Camera scale and which level-of-detail mesh is drawn |
| Specimen | Dropdown | Copper wire / Redwood needle / Sierra granite grain / Human hair | Copper wire | — | Swaps the whole level-of-detail stack and the bottom-scale structures |
| View mode | Radio | Zoom column / Stadium analogy | Zoom column | — | Rebuilds the scene as either a magnification or a walkable scale model |
| Comparison caliper | Drag-handle | 0–300, pins placed anywhere in frame | Retracted | current unit | Measures any two points and prints the separation |
| Reference pins | Multi-select | Redwood / Hand / Sand grain / Hair / Blood cell / Virus / DNA / Copper atom / Nucleus | Hair, Copper atom, Nucleus | — | Which silhouettes appear on the logarithmic strip |
| Atoms-across target | Numeric field | 0.001–10.000 | 0.070 | mm | Width fed to the atoms-across counter |
| Cloud opacity | Slider | 0–100 | 40 | % | How solid the electron cloud looks at the single-atom stop |
| Emptiness overlay | Toggle | On / Off | Off | — | Shades nucleus-free volume and prints the percentage |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Down to one atom | specimen=Copper wire; zoom=−1 then −10; caliper=on two atom centres | How many decades did you travel, and what is the centre-to-centre distance you measured? |
| S2 | Across a hair | specimen=Human hair; atoms-across target=0.070; zoom=−10 | How many copper atoms would lie side by side across one hair? |
| S3 | Find the nucleus | view=Stadium analogy; nucleus marker=on centre spot | Standing in the stands, how big is the nucleus and how much of the atom is empty? |
| S4 | Sierra granite | specimen=Sierra granite grain; zoom=−3 then −10; reference pins=Sand grain, Copper atom | A sand grain and an atom are both called small. How many decades apart are they really? |

**Student activities.**
1. Click the zoom dial one decade at a time from 10⁻¹ to 10⁻¹⁰ m, recording the scale bar value and what structure appears at each stop.
2. Place the caliper pins on two neighbouring copper atom centres and record the separation in nanometres.
3. Set the atoms-across target to 0.070 mm and record the counter value, then repeat for a 1 mm pencil line.
4. Switch to stadium mode, walk the camera from the top of the stands to the centre spot, and record how far you travelled before the nucleus grain became visible.
5. Turn on the emptiness overlay and record the percentage of the atom's volume that contains no nucleus, then write it as a fraction.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Scale bar value | Live numeric | m, mm, µm, nm or fm | Real width the bar represents at the current zoom |
| Field-of-view width | Live numeric | m | Frame width in metres in scientific notation |
| Caliper separation | Live numeric | current unit | Distance between the two placed pins, 3 significant figures |
| Atoms-across counter | Live numeric | count | Target width divided by the current atom diameter |
| Powers-of-ten position | Heat map | log₁₀ m | Marker sliding along the logarithmic reference strip |
| Emptiness fraction | Live numeric | % | Volume of the atom outside the nucleus, printed as a percentage and a fraction |
| Scale comparison table | Data table | mixed | Object, real size, decades below one metre, exportable as CSV |

**What the student should realise.**
Students file atoms alongside dust and bacteria as things that are simply small. Ten deliberate clicks put five whole decades between a dust grain and an atom, and stadium mode makes the nucleus a rice grain in an empty arena. The student should be able to say: *"An atom is about a ten-billionth of a metre across, its nucleus is tens of thousands of times smaller again, and almost all of the atom is empty space."*

## A2 · Inside the atom

### A2.1 · Protons, neutrons and electrons

**Experiment name:** Assembling an Atom, Piece by Piece  
**Render mode:** 3D Scene  
**Simulation engine:** Particle system + State machine  
**Interaction level:** Manipulate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A dim assembly chamber, almost black, with one object lit: a suspended containment field drawn as a faint blue wire sphere holding a small cradle at its centre. Along the left wall stand three dispensers with clear hoppers. The proton hopper holds warm red-orange spheres embossed with a raised plus. The neutron hopper holds matte slate-grey spheres of the same size stamped with a zero. The electron dispenser drips tiny electric-blue pinpoints trailing faint comet tails, each carrying a minus. The student drags particles into the chamber; nucleons snap into the cradle with a magnetic clunk, electrons streak away into a fuzzy outer band. Instruments ring the chamber: an analogue charge meter with a swinging needle, a mass balance reading in unified atomic mass units, a stability lamp and an element identity plate.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Containment chamber | Environment | 400 mm wire-sphere cage, faint cyan glow, thin hex panels that flicker where a particle passes through | Yes: resize |
| 2 | Nucleus cradle | Structure | Invisible attractor at the chamber centre with a 20 mm capture radius; nucleons pack into a rough sphere | No |
| 3 | Proton | Particle | Sphere radius 1.0 u, warm red-orange with a slightly rough surface, raised plus glyph, mass 1.0073 u | Yes: place |
| 4 | Neutron | Particle | Sphere radius 1.0 u, matte slate grey, smooth, incised zero glyph, mass 1.0087 u | Yes: place |
| 5 | Electron | Particle | Sphere radius 0.15 u, electric blue, self-lit, minus glyph, 0.4 s comet trail, mass 0.00055 u | Yes: place |
| 6 | Electron shell band | Field | Two concentric fuzzy bands at 3.0 u and 6.0 u radius holding 2 then 8 electrons; a full band glows brighter | No |
| 7 | Proton hopper | Instrument | Clear 200 mm column on the wall with a release trigger and a remaining-count display | Yes: drag |
| 8 | Neutron hopper | Instrument | Identical column in grey livery, separate count display | Yes: drag |
| 9 | Electron dispenser | Instrument | Slim blue-lit nozzle that emits one electron per pull, with a spark at the tip | Yes: drag |
| 10 | Charge meter | Instrument | 120 mm analogue dial, scale −5 to +5 e, red needle, zero centred, damped swing over 0.3 s | No |
| 11 | Mass balance | Instrument | Digital pan reading in u to 3 dp, with a second line converting to ×10⁻²⁷ kg | No |
| 12 | Element identity plate | Overlay | Brass plate showing symbol, name and atomic number, restamped whenever the proton count changes | No |
| 13 | Electrostatic repulsion vectors | Overlay | Red arrows between protons in the nucleus, length proportional to 1/d², shown only when vectors are on | No |
| 14 | Strong-force ribbon | Overlay | Short green ribbons between touching nucleons, fading to nothing beyond 2.5 u, the counterweight to repulsion | No |
| 15 | Stability lamp | Instrument | Bezelled lamp: green when the neutron count is inside the stable band, amber near the edge, red when the nucleus flies apart | No |
| 16 | Mass see-saw comparator | Instrument | Beam balance with one proton on the left pan and a counter on the right that fills with electrons; stops level at 1836 | Yes: drag |

**How it works — the model.**
Three particle types with fixed properties. Protons carry +1 e and 1.007 u, neutrons carry 0 e and 1.009 u, electrons carry −1 e and 0.00055 u, which is 1/1836 of a proton. Net charge is simply protons minus electrons and the meter shows it live. Total mass sums all three, so the balance shows the electron contribution as a barely visible last digit. Nucleons entering the cradle experience two competing rules: an inverse-square repulsion between every pair of protons, and a short-range attraction that acts only between touching nucleons. When repulsion wins, the nucleus unbinds and the stability lamp goes red. Electrons are placed into the shell bands, two then eight, and are never drawn as a ball on a wire. Every state is recomputed the moment a particle is dragged in or out, with no run button, because the point is direct cause and effect.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Protons | Stepper | 1–20 | 2 | count | Nucleus contents, element identity, net charge |
| Neutrons | Stepper | 0–24 | 2 | count | Nucleus mass and stability, with no effect on charge or identity |
| Electrons | Stepper | 0–22 | 2 | count | Shell occupancy and net charge, with almost no effect on mass |
| Particle hoppers | Drag-handle | Drag any particle from a hopper into or out of the chamber | Idle | — | Same effect as the steppers, performed by hand |
| Electron display | Radio | Shell bands / Probability cloud / Single ring | Shell bands | — | How electron position is drawn, without changing the physics |
| Force vectors | Toggle | On / Off | Off | — | Shows proton repulsion arrows and strong-force ribbons |
| Nucleus zoom | Dial | 1×–200× | 1× | — | Magnifies the cradle so individual nucleons can be counted |
| Mass units | Dropdown | u / ×10⁻²⁷ kg | u | — | Units on the balance and in the data table |
| Comparator | Toggle | On / Off | Off | — | Runs the see-saw that counts electrons against one proton |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Build a helium atom | protons=2; neutrons=2; electrons=2; vectors=Off | What is the net charge, what is the mass in u, and where is nearly all of that mass? |
| S2 | Take one electron away | protons=2; neutrons=2; electrons=1 | Charge changed but the balance barely moved. What does that tell you about an electron's mass? |
| S3 | Add a neutron only | protons=2; neutrons=3; electrons=2 | Mass rose by about 1 u. Did the charge change, and did the element identity plate change? |
| S4 | Too much positive | protons=10; neutrons=0; electrons=10; vectors=On | Watch the stability lamp. Why can a nucleus of pure protons not hold together? |

**Student activities.**
1. Drag two protons, two neutrons and two electrons into the chamber. Record net charge, total mass and the element plate reading.
2. Remove one electron and record all three readouts again. State which one changed most and which changed least.
3. Add neutrons one at a time from 2 to 6, recording mass and the stability lamp colour at each step.
4. Run the see-saw comparator and record how many electrons balance one proton.
5. Set protons to 10 and neutrons to 0, turn on force vectors, and describe in one sentence what the red arrows are doing just before the lamp turns red.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Net charge | Live numeric | e | Protons minus electrons, signed, whole numbers |
| Total mass | Live numeric | u | Sum over all particles, 3 dp, updated on every change |
| Mass from electrons | Live numeric | % | Electron contribution as a percentage of total mass, typically under 0.03 |
| Particle count table | Data table | count | Protons, neutrons and electrons with their individual charges and masses |
| Stability badge | Pass-fail badge | — | Green, amber or red from the neutron-to-proton ratio |
| Element identity | Live numeric | — | Symbol, name and atomic number from the proton count |

**What the student should realise.**
Students picture three particles as roughly equal partners, and often think electrons carry a fair share of the atom's mass. Here the balance moves by three decimal places when an electron leaves and by a whole unit when a neutron arrives, and the see-saw needs 1836 electrons to match one proton. The student should be able to say: *"Nearly all the mass sits in the nucleus, while the charge balance is set by how many electrons are outside it."*

### A2.2 · Atomic number defines the element

**Experiment name:** The Proton Count Decides  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A darkened spectroscopy bench. At the far left an atom bay, a small transparent cylinder holding one atom with three counters and paired plus and minus paddles beneath it, so the atom's composition can be edited by hand. The atom bay feeds a gas discharge lamp in a black housing whose tube glows the colour of whatever element the bay currently holds, driven by an EHT dial with a warning lamp. In front of the lamp sit a narrow slit, a diffraction grating on a rotating mount, and a white screen where sharp coloured lines fall against black beside a nanometre ruler. Behind the bench, a strip of the first twenty periodic table cells; one cell is lit. To the right, a flame-test station with a burner, a nichrome loop and five watch glasses of virtual salts.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Atom bay cylinder | Instrument | 120 mm glass cylinder on a chrome collar, holding one rendered atom, faint vacuum haze inside | Yes: resize |
| 2 | Nucleus render | Structure | Packed cluster of red-orange protons and slate neutrons, scaled up 10⁵× so it can be counted by eye | Yes: place |
| 3 | Electron shell bands | Field | Two fuzzy bands at 3.0 u and 6.0 u holding up to 2 and 8 electrons, glowing brighter when filled | Yes: place |
| 4 | Proton, neutron, electron paddles | UI-Probe | Three pairs of chunky plus and minus paddles under the bay, each with its own count window | Yes: drag |
| 5 | Discharge lamp housing | Instrument | Matte black box 200 mm long with a viewing slot and a fan grille, tube visible through the slot | Yes: place |
| 6 | Discharge tube and electrodes | Structure | Sealed 150 mm capillary with two tungsten pins, gas glow colour driven by the element in the bay | No |
| 7 | EHT supply dial | Instrument | Rotary dial 0–5 kV with a red interlock lamp; below the striking voltage the tube stays dark | Yes: drag |
| 8 | Slit | Structure | Adjustable 0.1 mm brass jaw pair on a rail, sharpens the lines when narrowed | Yes: drag |
| 9 | Diffraction grating | Instrument | 50 mm grating in a rotating mount, marked 300, 600 or 1200 lines per mm | Yes: swap |
| 10 | Spectrum screen and ruler | Instrument | White screen 400 mm wide with a printed 380–750 nm scale and 5 nm ticks | No |
| 11 | Spectral line dataset | Overlay | Lookup of the principal visible lines for the first twenty elements, for example sodium at 589.0 and 589.6 nm | No |
| 12 | Periodic strip | Overlay | Twenty cells, H to Ca, each with symbol and atomic number; the current cell lights amber | Yes: drag |
| 13 | Element identity badge | Overlay | Large card printing symbol, name and atomic number, restamped on every edit | No |
| 14 | Burner and nichrome loop | Instrument | Chrome burner with an adjustable air collar plus a wire loop on a glass handle, dipped and held in the flame | Yes: drag |
| 15 | Watch glasses of salts | Actor | Five 60 mm dishes labelled lithium, sodium, potassium, calcium and copper, each with a white or blue powder | Yes: swap |
| 16 | Edit log | Overlay | Running list of every change made, with a column stating whether the element changed | No |

**How it works — the model.**
The identity engine is a single rule: element name and symbol come from the proton count and from nothing else. Neutron edits change only the mass number readout, electron edits change only the charge and the ion label, and proton edits restamp the badge, relight a different periodic cell and load a completely new set of spectral lines. The lamp draws its emission lines from a real lookup table and renders them at their true wavelengths on the screen, so sodium always gives its doublet near 589 nm and lithium its red line at 670.8 nm. Flame colour is a second, independent lookup keyed to the same proton count, which matters because it gives two different instruments that agree. The grating spacing sets line separation on the screen, and a coarse grating crowds the lines together without changing which lines exist.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Protons | Stepper | 1–20 | 11 | count | Element identity, spectral line set, flame colour, lit periodic cell |
| Neutrons | Stepper | 0–24 | 12 | count | Mass number only; identity and spectrum unchanged |
| Electrons | Stepper | 0–22 | 11 | count | Net charge and the ion label; identity unchanged |
| Station | Dropdown | Spectroscope / Flame test / Both | Spectroscope | — | Which apparatus is powered and which readouts are live |
| EHT voltage | Slider | 0–5 | 3.0 | kV | Tube brightness; below about 1.2 kV the tube does not strike |
| Grating | Dropdown | 300 / 600 / 1200 lines per mm | 600 | lines/mm | Spacing of the lines across the screen |
| Burner air collar | Slider | 0–100 | 80 | % open | Yellow luminous flame against a clean blue flame that shows salt colours |
| Line labels | Toggle | On / Off | On | — | Prints the wavelength beside each line |
| Salt on the loop | Dropdown | Lithium / Sodium / Potassium / Calcium / Copper | Sodium | — | Which virtual salt is held in the flame |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Sea salt from the Pacific | protons=11; neutrons=12; electrons=11; station=Both; salt=Sodium | Two intense yellow lines at 589.0 and 589.6 nm and a yellow flame. Which element is in the bay? |
| S2 | Add a neutron | protons=11; neutrons=13; electrons=11; station=Spectroscope | The mass number rose. Did a single spectral line move? Did the badge change? |
| S3 | Take an electron away | protons=11; neutrons=12; electrons=10 | The atom is now charged. Is it still sodium, and how does the badge justify its answer? |
| S4 | Add one proton | protons=12; neutrons=12; electrons=12; station=Both | One proton more. What is the new name, the new flame colour, and the new lit cell? |

**Student activities.**
1. Set 11 protons, 12 neutrons and 11 electrons. Record the badge, the two brightest line wavelengths and the flame colour.
2. Step neutrons from 12 to 13 to 14 and record the mass number and the line wavelengths at each step.
3. Step electrons from 11 down to 10 and record net charge, the ion label and whether the element name changed.
4. Step protons from 11 to 12, then to 13, recording the badge, the lit periodic cell and one distinctive line for each.
5. Use only the flame colour and the spectrum to identify two mystery samples supplied by the bench, and record your evidence for each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Element identity badge | Live numeric | — | Symbol, name and atomic number Z |
| Atomic number | Live numeric | count | Proton count, shown as Z on the badge and on the periodic strip |
| Spectral line table | Data table | nm | Wavelength and relative brightness of every visible line for the current element |
| Flame colour swatch | Heat map | — | Rendered flame colour with its RGB value and a named description |
| Identity changed | Pass-fail badge | — | Green when an edit changed the element, red when it did not, printed per edit |
| Edit log | Data table | mixed | Every edit with before and after values for Z, mass number and charge |

**What the student should realise.**
Students believe an element is defined by its mass, or by the number of electrons, or by how it looks. Here neutron edits change the mass while the spectrum stays identical, electron edits change the charge while the name holds, and a single extra proton produces a different lamp colour, a different line set and a different cell. The student should be able to say: *"The number of protons is the element. Nothing else in the atom decides that."*

### A2.3 · Mass number and isotopes

**Experiment name:** Weighing Atoms: The Mass Spectrometer  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Field/vector + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A bench-top mass spectrometer, cut away along its length so the whole beam path is visible from the side. Reading left to right: a sample vial on a heated inlet block, its label reading Monterey Bay sea salt; a glowing ioniser filament; a pair of parallel accelerating plates with a high-voltage supply and a thick red lead; a curved evacuated flight tube of thick glass sweeping through a quarter circle between the grey poles of a large electromagnet; and at the end a segmented detector plate that flashes where ions land. Ions travel as coloured streaks, one hue per isotope. Below the instrument a bar chart builds itself peak by peak, mass over charge along the bottom, relative abundance up the side, with a weighted-mean calculator strip beneath it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample vial and heated inlet | Instrument | 15 mm glass vial in an aluminium block at 40–300 °C, with a needle valve leaking vapour into the source | Yes: swap |
| 2 | Ioniser filament | Instrument | White-hot tungsten hairpin behind a wire grid; strips one electron from each incoming atom | No |
| 3 | Ion actor | Particle | 6 px sphere with a 1+ glyph and a 0.3 s streak; one colour per isotope, for example chlorine-35 pale green and chlorine-37 deep green | No |
| 4 | Accelerating plate pair | Structure | Two 60 mm parallel plates 20 mm apart with a slit in the second, field lines drawn when the overlay is on | Yes: place |
| 5 | High-voltage supply | Instrument | Rack unit with a 200–4000 V dial and a digital readout | Yes: drag |
| 6 | Flight tube | Structure | 25 mm bore glass quarter-arc, 300 mm radius, with a vacuum gauge tapped into the elbow | Yes: resize |
| 7 | Electromagnet poles | Instrument | Two 120 mm grey-blue cylindrical poles above and below the arc, coil windings visible, current dial on the side | Yes: drag |
| 8 | Magnetic field overlay | Field | Uniform field between the poles drawn as blue crosses into the page, density scaling with the field setting | No |
| 9 | Ion path traces | Overlay | Fading curves showing the last 20 ion trajectories, colour matched to isotope | No |
| 10 | Detector plate | Instrument | 64-segment plate at the arc exit; each segment counts hits and lights proportionally | No |
| 11 | Vacuum pump and gauge | Instrument | Rotary pump with a rubber hose and an analogue gauge reading 10⁻³ to 100 Pa; audible hum | Yes: swap |
| 12 | Isotope builder tray | UI-Probe | Side panel showing one atom of the sample; neutrons can be dragged in or out and the peak moves live | Yes: drag |
| 13 | Mass spectrum chart | Overlay | Bar chart, mass over charge from 1 to 80 on the x axis, relative abundance 0–100 percent on the y axis | No |
| 14 | Weighted-mean calculator strip | Overlay | Row of cells showing each peak's mass, its abundance, their product, and the running total | Yes: drag |
| 15 | Isotope notation card | Overlay | Prints the current isotope as mass number over atomic number beside the symbol, for example 35 over 17 Cl | No |
| 16 | Sample atom inventory | Overlay | Live table of how many atoms of each isotope remain in the vial | No |

**How it works — the model.**
Each atom is ionised to a single positive charge, then accelerated through the plate voltage so that heavier ions leave the source more slowly. In the magnetic field the path curves with radius r proportional to the square root of mass at fixed voltage and field, so heavier isotopes swing wide and lighter ones curve tightly, and the detector segment that lights is a direct read of mass. Abundances come from real data: chlorine 75.8 percent at 35 and 24.2 percent at 37, copper 69.2 percent at 63 and 30.8 percent at 65, boron 19.9 percent at 10 and 80.1 percent at 11. The calculator strip multiplies each mass by its abundance and sums, so chlorine returns 35.5. Dropping the vacuum makes ions collide with residual gas, and the sim scatters them into a smear rather than faking a clean spectrum, because that is what really happens.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample | Dropdown | Chlorine from sea salt / Copper from Sierra ore / Boron from Mojave borax / Carbon / Magnesium | Chlorine from sea salt | — | Loads a different vial, isotope set and real abundance data |
| Magnet field | Slider | 0.05–0.60 | 0.25 | T | Curvature of every ion path and where the peaks land on the detector |
| Accelerating voltage | Slider | 200–4000 | 1500 | V | Ion speed leaving the source, so peak spread across the plate |
| Neutrons in the tuned atom | Stepper | 0–40 | 18 | count | Builds a chosen isotope by hand and moves its peak along the chart |
| Abundance of the lighter isotope | Slider | 0–100 | 75.8 | % | Relative heights of the two main peaks and the calculated mean |
| Detector gain | Slider | 1–100 | 20 | × | Height scaling of small peaks so trace isotopes become visible |
| Ion path traces | Toggle | On / Off | On | — | Draws the curved trajectories inside the flight tube |
| Vacuum pump | Toggle | On / Off | On | — | Off lets residual gas scatter the beam and smear every peak |
| Scan | Timeline scrubber | 0–60 | 0 | s | Replays the run and shows the spectrum building peak by peak |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two chlorines | sample=Chlorine from sea salt; field=0.25; voltage=1500; abundance=75.8 | Two peaks appear at 35 and 37. Both are chlorine, so what is different inside them? |
| S2 | The missing peak | sample=Chlorine from sea salt; gain=100; traces=On | The periodic table says 35.5 but there is no peak there. Why does no single atom weigh 35.5 u? |
| S3 | Sierra copper | sample=Copper from Sierra ore; field=0.30; voltage=1500 | Read both peaks and their abundances, then calculate the relative atomic mass and check it against 63.5. |
| S4 | Break the vacuum | sample=Boron from Mojave borax; vacuum=Off; traces=On | The peaks smear into a band. What are the ions hitting on the way to the detector? |

**Student activities.**
1. Load the chlorine sample and run a scan. Record the mass over charge of each peak and its abundance from the chart.
2. Fill in the weighted-mean strip by hand: multiply each mass by its abundance, add the products, and record your relative atomic mass.
3. Use the isotope builder to add one neutron to chlorine-35. Record the new mass number, the new notation card and whether the atomic number changed.
4. Repeat the full procedure for copper and for boron, recording both peaks, both abundances and your calculated mean for each.
5. Turn the vacuum off, run again, and record what happens to the peak width and to the calculated mean.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mass spectrum | Bar chart | percent vs m/z | Peak height against mass over charge, rebuilt live as ions arrive |
| Peak table | Data table | mixed | One row per peak: mass number, abundance percent, ion count, isotope symbol |
| Relative atomic mass | Live numeric | u | Abundance-weighted mean, 1 dp, updated as the chart fills |
| Mass number readout | Live numeric | count | A equals Z plus N for the tuned isotope, with all three shown |
| Isotope notation card | Live numeric | — | Mass number, atomic number and symbol in standard notation |
| Weighted-mean check | Pass-fail badge | — | Green when the student's entered mean matches the instrument within 0.1 u |

**What the student should realise.**
Students assume every atom of an element is identical, and that the decimal mass printed on the periodic table belongs to a real atom. The spectrometer shows two or more sharp peaks at whole mass numbers, never one at the decimal value. The student should be able to say: *"Isotopes are atoms of the same element with different numbers of neutrons, and the decimal mass on the table is the average of a real mixture, not the mass of any single atom."*

### A2.4 · Building the model — early evidence

**Experiment name:** The Gold Foil Rig: Finding the Nucleus  
**Render mode:** 3D Scene  
**Simulation engine:** Field/vector + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A blacked-out room lit only by a red darkroom lamp. On a heavy cast-iron base sits a circular brass scattering chamber about 400 mm across, its lid lifted away in cutaway so the interior is visible. Inside, a lead block with a drilled channel holds a sealed alpha source stencilled VIRTUAL SOURCE, aimed through a collimating slit at a foil holder at the chamber's centre. The gold leaf in the holder is so thin it reads as translucent green-gold. Riding on a rotating arm around the chamber is a zinc sulfide screen with a small microscope eyepiece bolted to it; the arm sweeps a brass protractor scale from 0 to 180 degrees. Every alpha that lands makes a green pinprick flash and a click from the counter box.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Scattering chamber | Environment | 400 mm brass cylinder on a cast base, cutaway lid, engraved 0–180° protractor around the rim | Yes: resize |
| 2 | Lead source block | Structure | 80 mm lead cube, dull grey, with a 2 mm drilled channel and a hazard stencil; blocks all alphas but the beam | Yes: drag |
| 3 | Alpha source pellet | Actor | 3 mm sealed radium pellet inside the block, faint blue glow, labelled clearly as a virtual source | No |
| 4 | Collimator slit | Structure | Two brass jaws 1 mm apart, narrowing the emitted cone to a pencil beam | Yes: drag |
| 5 | Alpha particle | Particle | Two protons and two neutrons drawn as a fused 2 u cluster, gold-yellow, 2+ glyph, short comet trail | No |
| 6 | Gold foil | Structure | 20 mm square leaf, translucent green-gold in transmission, thickness 0.1–10 µm, visibly buckled at the edges | Yes: swap |
| 7 | Foil holder swivel | Instrument | Sprung clip on a graduated swivel so the foil can be turned edge-on or removed entirely | Yes: place |
| 8 | Gold atom lattice | Structure | Face-centred cubic array of 1.44 Å gold atoms filling the foil, drawn only when the nucleus overlay is on | No |
| 9 | Nucleus point charge | Field | Point of +79 e at each atom centre, effective radius 7 fm; the whole scattering model lives here | No |
| 10 | Rotating detector arm | Instrument | 250 mm brass arm on a central bearing, hand-draggable, with a vernier reading to 0.5° | Yes: drag |
| 11 | Zinc sulfide screen | Instrument | 30 mm coated disc on the arm; each alpha strike makes a 0.2 s green scintillation about 1 px wide | Yes: swap |
| 12 | Eyepiece microscope | Instrument | ×20 eyepiece bolted to the screen mount, whose circular view is shown as an inset panel | Yes: drag |
| 13 | Scintillation counter | Instrument | Bakelite box with a mechanical register, an audible click per flash and a 10–120 s timer | Yes: place |
| 14 | Vacuum pump and gauge | Instrument | Belt-driven pump with a hose to the chamber and a gauge; with air in, alphas scatter before reaching the foil | Yes: swap |
| 15 | Trajectory overlay | Overlay | Draws the last 30 alpha paths as fading curves, with sharp hyperbolic turns near a nucleus | No |
| 16 | Model engine selector | UI-Probe | Physical three-position switch on the console: solid sphere, plum pudding, nuclear; changes the physics, not the graphics | Yes: swap |

**How it works — the model.**
Alphas leave the collimator on parallel paths and fly straight until they enter the foil. In nuclear mode each gold atom carries a point charge of +79 e concentrated inside 7 fm, and every alpha is deflected by Coulomb repulsion on a hyperbolic path whose turn angle is set by its impact parameter. Because a nucleus is tiny compared with an atom, almost every alpha misses by far enough to pass nearly straight through, and the count at angle θ falls off steeply, following roughly one over sin⁴ of half θ, so about one in eight thousand comes back beyond 90 degrees. In plum pudding mode the same positive charge is smeared uniformly through the whole atom, so the forces on an alpha nearly cancel and no path bends by more than about one degree. In solid sphere mode alphas simply cannot enter and everything reflects. The rig runs whichever physics the switch selects and reports the counts honestly.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Model under test | Radio | Solid sphere / Plum pudding / Nuclear | Nuclear | — | Which scattering physics the engine runs, so what the screen shows |
| Detector angle | Dial | 0–180, draggable arm | 0 | degrees | Where the scintillation screen sits around the chamber |
| Foil material | Dropdown | Gold / Silver / Aluminium / No foil | Gold | — | Nuclear charge per atom and therefore how strongly alphas are deflected |
| Foil thickness | Slider | 0.1–10.0 | 1.0 | µm | Number of atom layers an alpha must cross, so the chance of a close approach |
| Source strength | Slider | 100–10000 | 2000 | alphas/min | Emission rate, so how long a count at a large angle takes |
| Count time | Stepper | 10–120 | 60 | s | Duration of one counting run at the current angle |
| Trajectory overlay | Toggle | On / Off | Off | — | Draws recent alpha paths inside the chamber |
| Chamber vacuum | Toggle | On / Off | On | — | Off fills the chamber with air, which scatters alphas before the foil |
| Nucleus overlay zoom | Dial | 1×–10000× | 1× | — | Magnifies one atom so the nucleus and the empty space around it can be seen |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Straight through | model=Nuclear; angle=0; foil=Gold; thickness=1.0; count time=60 | Count the flashes at zero degrees. What fraction of the alphas passed almost undeflected? |
| S2 | Hunting big angles | model=Nuclear; angle swept 15 to 150 in 8 steps; source=10000 | How does the count change as the arm swings back, and does it ever reach exactly zero? |
| S3 | Test the pudding | model=Plum pudding; angle=0 then 90; thickness=1.0 | Plum pudding predicts nothing beyond about one degree. What does the screen actually show at 90 degrees? |
| S4 | Aluminium instead | model=Nuclear; foil=Aluminium; thickness=1.0; angle=90 | Aluminium nuclei carry a much smaller charge. Does the number of big deflections rise or fall? |

**Student activities.**
1. Set the arm to 0 degrees and count for 60 s with gold foil in place. Record the count and the source rate.
2. Move the arm to 15, 30, 45, 60, 90, 120 and 150 degrees, counting 60 s at each. Record all seven counts in a table.
3. Predict what the plum pudding switch will do to your 90 degree count, then switch and re-run for 60 s. Record both numbers.
4. Turn the nucleus overlay to 10000× and measure, with the on-screen caliper, how much of the atom's width the nucleus occupies.
5. Swap gold for aluminium at the same thickness and re-count at 90 degrees. Record both results and explain the difference in one sentence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Flash count | Counter | flashes | Mechanical register total for the current run, with an audible click per event |
| Count rate versus angle | Line graph | flashes per minute vs degrees | Logarithmic y axis, one point added per completed run |
| Fraction beyond 90 degrees | Live numeric | — | Large-angle events as a fraction of total emitted, typically about 1 in 8000 for gold |
| Closest approach estimate | Live numeric | fm | Derived from the largest deflection recorded, giving an upper bound on nucleus size |
| Model match | Pass-fail badge | — | Compares the selected model's prediction with the observed angular data |
| Angle and count table | Data table | mixed | Angle, count time, flashes, rate; exportable as CSV |

**What the student should realise.**
Students imagine the atom as a solid ball, or as a pudding with charge spread evenly through it. Here nearly every alpha sails through, which no solid ball allows, and a stubborn handful bounces back past 90 degrees, which no smeared charge can produce. The student should be able to say: *"Most of the atom is empty, and all the positive charge and nearly all the mass are packed into a nucleus far smaller than the atom itself."*

### A2.5 · Building the model — from shells to a cloud

**Experiment name:** Where Is the Electron, Really?  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Ray/wave + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
Two stations share one long optical bench in a dim room. On the left, a hydrogen discharge tube glows pink-magenta in a clamp, its light passing through a narrow slit and a diffraction grating onto a black screen where four sharp lines stand out: a deep red, a blue-green, a blue-violet and a faint violet, with a nanometre ruler running beneath them. Beside the screen hangs an energy ladder diagram, six rungs, with arrows that light when a line is selected. On the right stands the position sampler: a small glass chamber holding a single hydrogen atom, a trigger handle, and a stamping plate. Each pull of the trigger fires a sampling flash and prints one dot where the electron was found. Hundreds of pulls build a fuzzy ball.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Hydrogen discharge tube | Instrument | 150 mm capillary with wide end bulbs and tungsten electrodes, glowing pink-magenta when struck | Yes: swap |
| 2 | EHT supply and leads | Instrument | Rack unit with a 0–5 kV dial, red and black leads, interlock lamp | Yes: drag |
| 3 | Adjustable slit | Structure | Brass jaw pair, 0.05–1.00 mm gap, on a rail; wider jaws blur every line | Yes: drag |
| 4 | Diffraction grating | Instrument | 50 mm grating in a rotating mount, swappable between 300, 600 and 1200 lines per mm | Yes: swap |
| 5 | Spectrum screen and nm ruler | Instrument | 500 mm matte black screen with a printed 380–750 nm scale and 2 nm ticks | No |
| 6 | Hydrogen line set | Overlay | Four Balmer lines rendered at 656.3, 486.1, 434.0 and 410.2 nm with correct relative brightness | No |
| 7 | Energy ladder diagram | Overlay | Six rungs at −13.6, −3.40, −1.51, −0.85, −0.54 and −0.38 eV, unevenly spaced, with lit jump arrows | Yes: drag |
| 8 | Photon actor | Particle | Short travelling wave packet coloured to its wavelength, emitted whenever a jump arrow fires | No |
| 9 | Position sampler chamber | Instrument | 120 mm glass cube with a shutter, a trigger handle and a lamp that flashes on each sample | Yes: place |
| 10 | Single hydrogen atom | Actor | One proton at the centre plus one electron, drawn per the current model view, scaled so 0.053 nm reads as 40 mm | Yes: place |
| 11 | Dot stamp plate | Overlay | Accumulating scatter of 1 px dots, one per sample, never cleared until reset | Yes: drag |
| 12 | Radial probability histogram | Overlay | Bar chart of dot count against distance from the nucleus, peaking at 0.053 nm | No |
| 13 | Bohr ring meshes | Structure | Thin luminous circles at 0.053, 0.212 and 0.476 nm, drawn as bookkeeping only, never animated as a track | Yes: swap |
| 14 | Cloud volume renderer | Field | Density-mapped fog whose opacity follows the 1s probability density, brightest near the nucleus | No |
| 15 | Shell filling tray | UI-Probe | Row of slots holding 2, 8 and 8 electrons for elements up to calcium, with drag-in placement and an overfill warning | Yes: drag |
| 16 | Scale bar | Overlay | Calibrated bar reading in nanometres, resizing with the sampler zoom | No |

**How it works — the model.**
The spectrum station is a lookup of real hydrogen transitions. Each observed line is matched to a jump down to the second rung, so 656.3 nm comes from the third rung and 410.2 nm from the sixth, and the ladder shows the arithmetic as a subtraction of two rung energies rather than as algebra. The sampler station is a Monte Carlo experiment: each trigger pull draws a radius from the 1s radial probability distribution, which rises from zero at the nucleus, peaks at 0.053 nm and tails away, then draws a random direction. Thousands of samples therefore build a fuzzy ball with a definite most-likely radius. The failure the sim must avoid is animating a small ball running round a wire ring. A Bohr ring may be drawn as a marker of a most-probable distance, never as a path the electron is shown following.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Model view | Radio | Bohr shells / Probability cloud / Both superposed | Bohr shells | — | How electron position is drawn and which readouts are active |
| Element | Dropdown | Hydrogen / Helium / Lithium / Neon / Sodium | Hydrogen | — | Loads a different spectrum and a different shell filling in the tray |
| Samples per trigger pull | Stepper | 1–500 | 25 | count | How many dots are stamped per pull of the sampler handle |
| EHT voltage | Slider | 0–5 | 3.0 | kV | Tube brightness; below about 1.2 kV the tube does not strike |
| Grating | Dropdown | 300 / 600 / 1200 lines per mm | 600 | lines/mm | Line separation across the spectrum screen |
| Cloud opacity | Slider | 0–100 | 50 | % | Density of the fog renderer at the sampler station |
| Histogram bin width | Slider | 0.005–0.050 | 0.010 | nm | Resolution of the radial probability chart |
| Highlight transition | Dropdown | n=3 to 2 / n=4 to 2 / n=5 to 2 / n=6 to 2 | n=3 to 2 | — | Lights one ladder arrow and its matching line on the screen |
| Shell tray | Drag-handle | Place electrons into 2, 8 and 8 slots | Empty | count | Builds the shell arrangement for the chosen element by hand |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Four lines, four jumps | element=Hydrogen; model=Bohr shells; grating=600; highlight each in turn | Match each line to a jump on the ladder. Why are there gaps between the lines instead of a smooth rainbow? |
| S2 | Stamp a thousand dots | element=Hydrogen; model=Probability cloud; samples=500; bin=0.010 | After 1000 samples, at what distance from the nucleus was the electron found most often? |
| S3 | Ring against cloud | element=Hydrogen; model=Both superposed; cloud opacity=50 | Does the Bohr ring sit at the peak of your histogram, and does the electron ever appear off the ring? |
| S4 | Filling sodium | element=Sodium; shell tray=2, 8, 1; model=Bohr shells | Sodium has one electron alone in its outer shell. Which electron would be easiest to pull away, and why? |

**Student activities.**
1. Strike the hydrogen tube and record the wavelength of all four visible lines from the screen ruler, to the nearest nanometre.
2. Use the highlight control to match each line to a ladder jump. Record the rung numbers for each of the four lines.
3. Switch to the probability cloud and pull the trigger until 1000 dots are stamped. Record the peak of the radial histogram in nanometres.
4. Superpose both views and record whether the Bohr ring radius agrees with your histogram peak, and whether any dot lies outside the ring.
5. Fill the shell tray for sodium and record the arrangement, then predict which shell loses an electron first and check it against the ladder spacing.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Line position table | Data table | nm | Measured wavelength, matched transition and rung energies for each visible line |
| Transition match | Pass-fail badge | — | Green when the student's line-to-jump pairing is correct |
| Dot stamp count | Counter | samples | Total positions recorded at the sampler station |
| Radial probability histogram | Bar chart | count vs nm | Built live from the stamped dots, peaking near 0.053 nm |
| Most probable radius | Live numeric | nm | Position of the histogram peak, 3 dp |
| Shell occupancy | Data table | count | Electrons per shell for the chosen element, with an overfill flag |

**What the student should realise.**
Students picture electrons circling the nucleus like planets on drawn tracks, because that is how the diagrams look. Here the sampler finds the electron at many different distances and in every direction, yet its most likely distance is exactly the radius the shell diagram draws. The student should be able to say: *"Shells are real as energy levels, not as tracks. The ring on the diagram marks where the electron is most likely to be, not the path it follows."*

### A2.6 · Why the model kept changing

**Experiment name:** Model Tournament: Five Atoms, Three Rigs  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Field/vector + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A long instrument rail runs the width of the bench under a glass hood, carrying three working stations. Station one is a cathode ray tube: a pear-shaped evacuated glass envelope with a heated cathode filament glowing dull orange, an anode disc with a slit, two horizontal deflection plates fed from a kilovolt supply, a pair of Helmholtz coils, and a phosphor strip running the tube's length with a millimetre scale printed beside it. A green beam line crosses it. Station two is a compact foil-scatter cartridge with a ring detector. Station three is a discharge lamp with a grating and a spectrum screen. On the wall behind, a rack of five model cartridges, dated. A brass prediction console with a card printer sits between the rail and the rack; a verdict matrix board hangs above.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Instrument rail and hood | Environment | 1200 mm rail with three docking bays and a smoked glass hood, warm bench lighting from above | No |
| 2 | Model cartridge rack | Structure | Five slotted cartridges labelled Dalton 1803, Thomson 1897, Rutherford 1911, Bohr 1913, Quantum 1926, each with an etched icon | Yes: swap |
| 3 | Prediction console and printer | Instrument | Brass console with a slot for one cartridge and a thermal printer that issues a prediction card per station | Yes: place |
| 4 | Cathode ray tube envelope | Structure | 300 mm pear-shaped glass tube on a stand, silvered neck, vacuum tap at the rear | Yes: resize |
| 5 | Cathode filament and heater | Instrument | Tungsten hairpin glowing dull orange behind a focusing cap; the metal it is made of is swappable | Yes: swap |
| 6 | Anode disc with slit | Structure | 25 mm disc with a 1 mm horizontal slit that shapes the beam into a flat ribbon | Yes: place |
| 7 | Deflection plate pair | Instrument | Two 80 mm parallel plates 25 mm apart, wired to a −3000 to +3000 V supply with a polarity switch | Yes: drag |
| 8 | Helmholtz coil pair | Instrument | Two 100 mm copper coils either side of the tube, 0–3 A supply, bending the beam out of the plane | Yes: place |
| 9 | Phosphor strip and mm scale | Instrument | 250 mm coated strip inside the tube glowing green where the beam grazes it, with a printed millimetre rule | No |
| 10 | Electron beam | Actor | Thin green line, deflection proportional to plate voltage, bending toward whichever plate is positive | No |
| 11 | Maltese cross insert | Structure | Swap-in metal cross that casts a sharp shadow on the end screen, showing the beam travels in straight lines | Yes: swap |
| 12 | Foil-scatter cartridge | Instrument | Sealed 150 mm unit with a virtual alpha source, a gold or aluminium foil and a 360° zinc sulfide ring detector | Yes: swap |
| 13 | Discharge lamp and grating | Instrument | Small lamp, slit and 600 lines per mm grating throwing a line spectrum onto a 200 mm screen | Yes: swap |
| 14 | Verdict matrix board | Overlay | Five-row, three-column board of lamps: green when a cartridge's prediction matches that station's reading, red when it fails | No |
| 15 | Prediction card | Overlay | Printed card stating the loaded model's prediction for the docked station, in plain words with a number where one exists | Yes: drag |
| 16 | Evidence timeline rail | Overlay | Dated rail from 1803 to 1932 with markers for each instrument result and each model revision | Yes: drag |

**How it works — the model.**
Each cartridge is a rule set the prediction console runs before the student presses Start, and the printed card is locked in so it cannot be edited afterwards. Dalton's atom is indivisible, so it predicts no particles emerging from a metal, no large-angle scattering and no line spectrum. Thomson's atom has negative corpuscles in a positive jelly, so it predicts a beam that bends toward the positive plate, which is correct, but also no backscatter and a continuous spectrum, which are both wrong. Rutherford's atom gets the beam and the scattering right and still predicts a smooth spectrum. Bohr's shells add the discrete lines. The quantum cloud matches all three stations. The cathode ray tube runs real deflection physics, with beam displacement proportional to plate voltage and reversing with polarity, and the beam is identical for every cathode metal, which is exactly the evidence Thomson used.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Model cartridge | Dropdown | Dalton 1803 / Thomson 1897 / Rutherford 1911 / Bohr 1913 / Quantum 1926 | Dalton 1803 | — | Which rule set the console prints a prediction from |
| Station | Dropdown | Cathode ray tube / Foil scatter / Line spectrum | Cathode ray tube | — | Which apparatus is docked, powered and displayed |
| Deflection voltage | Slider | −3000 to +3000 | 0 | V | Beam displacement on the phosphor strip and which way it bends |
| Coil current | Slider | 0–3.0 | 0 | A | Magnetic deflection out of the plane, a second independent test of charge |
| Cathode metal | Dropdown | Tungsten / Copper / Aluminium / Iron | Tungsten | — | Which element the beam is drawn out of; the beam should not change |
| Tube pressure | Slider | 0.001–100 | 0.01 | Pa | Above about 10 Pa the beam scatters and the trace fades |
| Foil element | Dropdown | Gold / Aluminium | Gold | — | Nuclear charge at the scatter station, so the large-angle count |
| Maltese cross | Toggle | In / Out | Out | — | Inserts the cross to cast a beam shadow on the end screen |
| Timeline | Timeline scrubber | 1803–1932 | 1803 | year | Scrubs the evidence rail and greys out models not yet proposed |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Dalton meets the cathode ray | model=Dalton 1803; station=Cathode ray tube; voltage=1500 | Dalton's card says nothing can come out of an atom. What does the phosphor strip show? |
| S2 | Thomson meets the foil | model=Thomson 1897; station=Foil scatter; foil=Gold | Thomson's card predicts a single central spot. Where does the ring detector register hits? |
| S3 | Rutherford meets the spectrum | model=Rutherford 1911; station=Line spectrum | Rutherford's card predicts a smooth band of colour. How many lines does the screen actually show? |
| S4 | Four cathodes, one beam | model=Thomson 1897; station=Cathode ray tube; cathode metal cycled through all four; voltage=1500 | The beam bends the same amount from every metal. What does that say about where electrons come from? |

**Student activities.**
1. Load the Dalton cartridge, print its three prediction cards, then run all three stations and record which predictions failed.
2. Repeat for Thomson, Rutherford, Bohr and quantum, filling one row of the verdict matrix per cartridge.
3. At the cathode ray tube, step the deflection voltage from −3000 V to +3000 V in 500 V steps and record beam displacement in millimetres at each step.
4. Cycle the cathode metal through all four options at 1500 V and record the beam displacement for each.
5. Using your completed matrix, write one sentence per model naming the single piece of evidence that ended it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Verdict matrix | Pass-fail badge | — | Fifteen lamps, one per model and station, green on a match and red on a failure |
| Beam displacement | Live numeric | mm | Position of the green trace on the phosphor scale, signed about the centre line |
| Deflection versus voltage | Line graph | mm vs V | Straight line through the origin, reversing sign with polarity |
| Charge sign | Live numeric | — | Reads negative because the beam bends toward the positive plate |
| Predictions failed | Counter | count | Running total of failed cards per model |
| Claim and evidence table | Data table | mixed | Model, station, prediction, observation, verdict; exportable as CSV |

**What the student should realise.**
Students think earlier scientists were simply wrong and that science replaced mistakes with facts. The matrix shows each model passing every test available in its own decade and failing only when a new instrument produced a reading it could not account for. The student should be able to say: *"A model is kept while it explains the evidence and revised the moment an instrument shows it something it cannot explain, which is why the atom's picture changed five times."*

## A3 · Elements and the periodic table

### A3.1 · Reading a cell of the periodic table

**Experiment name:** Open the Drawer: What One Cell Is Telling You  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A dim hall lined by one wall-sized periodic table, back-lit so each of the 118 tiles glows like a specimen drawer. The camera opens wide enough to read the whole table, then dollies in when a tile is pressed. The chosen tile slides forward on brass runners and opens: inside, on a lit turntable, an atom assembles itself to that element's real counts, protons dropping into a nucleus, neutrons packing around them, electrons snapping onto shells with a soft chime. Behind the atom stands a small stoppered vial of the actual substance, warmly lit. The rest of the table dims to slate. Control panel docks right; the four printed numbers of the cell float beside the atom, each tied to its part by a thin amber leader line.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Table wall | Environment | 118 tiles, 96 × 120 px each, laid in the standard 18 × 7 grid with the f-block dropped below; unselected tiles at 25 % brightness, hovered tile rimmed in amber | No |
| 2 | Element cell tile | UI-Probe | Single tile carrying four printed fields: atomic number top-left, symbol centre at 48 pt, name below at 14 pt, relative atomic mass bottom to 3 s.f.; slides forward 40 px on press | Yes: place |
| 3 | Nucleus cluster | Structure | Tight packed sphere pile, radius scales as 1.2 × A^(1/3) display units, drawn at a stated 25,000× exaggeration relative to the electron shells | No |
| 4 | Proton | Particle | Sphere r = 0.5 u, crimson, embossed "+"; instanced exactly Z times; each carries an index label 1…Z on hover | Yes: drag |
| 5 | Neutron | Particle | Sphere r = 0.5 u, slate grey, unmarked; instanced exactly A − Z times | Yes: drag |
| 6 | Electron | Particle | Sphere r = 0.15 u, pale cyan with a soft glow trail, embossed "−"; orbits its shell at 0.4 rev/s | Yes: drag |
| 7 | Electron shell rings | Structure | Concentric wire rings at radii 6, 11, 16, 21 u, capacities 2 / 8 / 8 / 18 shown as empty sockets that fill visibly | No |
| 8 | Leader lines and field labels | Overlay | Four amber leaders from the printed cell fields to the matching atom part; label text "protons = atomic number", "protons + neutrons = mass number", and so on | No |
| 9 | True-scale inset | Overlay | Corner panel 200 px square showing the same atom with the nucleus at honest scale: a single sub-pixel dot inside a 100 px electron cloud, captioned with the real ratio 1 : 100,000 | No |
| 10 | Substance vial | Actor | 40 mm stoppered glass vial on the drawer floor, contents swapped per element: copper turnings, sulfur powder, grey silicon lump, sealed argon glow tube, sodium under oil | No |
| 11 | Isotope rack | Instrument | Slide rail behind the atom holding the element's stable isotopes as labelled chips, for example ¹²C ¹³C ¹⁴C, each chip showing its natural abundance | Yes: swap |
| 12 | Charge tray | Instrument | Shallow tray to the left of the atom where removed electrons are parked; tray count drives the ion charge readout | Yes: drag |
| 13 | Identity lock lamp | Instrument | Green lamp reading the element name while proton count matches the open tile; flips to amber and names the new element the instant a proton is added or removed | No |
| 14 | Mass balance | Instrument | Two-pan beam balance under the atom, left pan loaded with the nucleons, right pan with a stack of calibrated 1 u weights; tips until the mass number is matched | Yes: drag |
| 15 | Assembly turntable | Structure | 300 mm brushed steel disc, 4 s per revolution, halts on drag so the student can work on the far side | Yes: drag |

**How it works — the model.**
The engine reads one row from a 118-element dataset: symbol, name, atomic number Z, relative atomic mass, stable isotopes with abundances, and the school shell sequence 2, 8, 8, 18. Protons instantiate Z times, neutrons A − Z times where A comes from the selected isotope chip, electrons Z minus the tray charge. Shell sockets fill lowest-first and refuse a ninth electron in shell two. The rule runs backwards too: proton count is the only identity key, so dragging a proton in or out re-queries the dataset and the highlighted tile jumps along the wall to the new element. Neutrons change only the mass number, electrons only the charge. Two simplifications are stated on screen: shells are rings rather than probability clouds, and relative atomic mass is a weighted average across isotopes, rarely whole. The failure to avoid is a nucleus drawn at a size the student could mistake for real, so the true-scale inset stays visible.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Element | Search field + tile click | Any of the 118 tiles, by symbol, name or number | Carbon (6) | — | Which drawer opens and which atom is built |
| Isotope | Stepper along the rack | Stable isotopes of the chosen element, e.g. ¹²C / ¹³C / ¹⁴C | Most abundant | mass number | Neutron count only; mass number readout and balance |
| Charge | Stepper | −3 to +3 | 0 | e | Electrons removed to or returned from the charge tray |
| Nucleus magnification | Slider | 1×–50,000× | 25,000× | — | How large the nucleus is drawn relative to the shells |
| Shell display | Dropdown | Bohr rings / Socket bar chart / Occupancy numbers only / Off | Bohr rings | — | How electron arrangement is represented |
| Build direction | Toggle | Table drives atom / Atom drives table | Table drives atom | — | Structural: whether the student picks a tile and watches it build, or builds a nucleus and makes the table find it |
| Leader lines | Toggle | On / Off | On | — | Shows or hides the four labelled links from cell fields to atom parts |
| Assembly speed | Dial | 0.25×–4× | 1× | — | How fast particles fly into place |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Reading carbon cold | element=Carbon; isotope=¹²C; charge=0; leader lines=On | Four numbers are printed on this cell. Which atom part does each one count, and which one is not a whole number? |
| S2 | Same element, heavier | element=Carbon; isotope=¹⁴C; charge=0 | Two more neutrons have gone in. Is this still carbon, and what exactly changed? |
| S3 | Steal an electron | element=Sodium; isotope=²³Na; charge=+1 | The atom has 11 protons and 10 electrons. Has the element changed? What has? |
| S4 | Build it backwards | build direction=Atom drives table; element=Neon; then drag one proton out | You removed one proton from neon. Predict where the highlight jumps before you let go, then check. |

**Student activities.**
1. Open the carbon drawer and record all four printed numbers, then write beside each one the atom part it counts.
2. Step the isotope rack from ¹²C to ¹⁴C. Record the proton, neutron and electron counts before and after, and state which of the three the isotope chip controls.
3. Set charge to +1 on sodium and record what the identity lamp says. Repeat at −1 on chlorine and record again.
4. Switch build direction to Atom drives table, drag one proton out of the neon nucleus, and record which tile lights and what its symbol is.
5. Compare the nucleus at 25,000× with the true-scale inset and write one sentence about how much of an atom is empty space.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Particle tally | Live numeric | count | Protons, neutrons and electrons listed separately, updating on every drag |
| Mass number | Live numeric | u | Protons + neutrons, shown next to the printed relative atomic mass for contrast |
| Net charge | Live numeric | e | Protons minus electrons, signed |
| Shell occupancy | Bar chart | electrons per shell | One bar per shell with its capacity drawn as a ghost outline |
| Identity log | Data table | mixed | One row per change the student makes: what was dragged, the resulting element, and whether identity changed |
| Element check | Pass-fail badge | — | Green while the built atom matches the open tile, amber with the correct new name when it does not |

**What the student should realise.**
Students read the largest printed number as "how much stuff is in the atom" and treat the atomic number as a ranking. Dragging a single proton renames the element, while adding two neutrons or removing an electron does not, so the ranking reading collapses. The student should be able to say: *"The atomic number is not where the element sits in a list, it is how many protons it has, and that alone decides what element it is."*

### A3.2 · Groups and periods

**Experiment name:** Columns That Behave Alike  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model + Molecular  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A dark studio floor with the periodic table inlaid into it as 118 lit floor tiles, viewed from a raised three-quarter camera so the grid reads as a plan. Selecting a group lifts that whole column out of the floor on slow hydraulic pistons into a colonnade of waist-high plinths; above each plinth a single atom rotates with its outer shell picked out in hot gold and every inner shell dimmed to charcoal. Selecting a period instead sends a white light sweep along that row, and a bar rises behind each tile as the sweep passes. The far wall carries a long property ribbon that redraws for whichever slice is live. The d-block stays sunk and shaded olive throughout. Control panel docks right, camera dolly on a rail beneath it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Floor tile grid | Environment | 118 flush floor tiles 200 × 250 mm, engraved symbol and atomic number, lit from beneath at 20 % until selected | Yes: place |
| 2 | Riser piston | Structure | Hydraulic ram beneath each tile, 0–900 mm travel, 1.2 s rise with a settling bounce; whole column rises together | No |
| 3 | Plinth atom | Actor | Bohr-ring atom floating 300 mm above its risen tile, ring radii 6/11/16/21 u, rotating at 0.25 rev/s | Yes: drag |
| 4 | Valence halo | Overlay | Hot gold ring and glow on the outermost occupied shell only; its electrons rendered at 1.6× size with a slow pulse | No |
| 5 | Inner-shell ghosting | Overlay | All shells below the outermost dropped to 15 % opacity charcoal so the eye counts only the outer electrons | No |
| 6 | Group plaque | Structure | Engraved brass plate at the head of each column: group number, family name where one exists (alkali metals, alkaline earth metals, halogens, noble gases), and the outer-electron count | No |
| 7 | Period rail | Structure | Illuminated strip running the length of each row with the period number at both ends and a shell counter that ticks 1, 2, 3… as the sweep advances | No |
| 8 | Shell-stack bar | Overlay | Vertical stacked bar behind each tile, one segment per occupied shell, segment height proportional to that shell's electron count | No |
| 9 | Property ribbon | Instrument | 4 m wall graph, x-axis is the live slice in order, y-axis the chosen property, points joined and annotated with the element symbol | No |
| 10 | Mystery tile | Actor | Any one tile blanked to matt white with only its coordinates showing; accepts a typed prediction of outer electrons and shells before revealing | Yes: swap |
| 11 | Comparison ghost column | Overlay | A second group rendered as translucent blue plinths interleaved with the live column for side-by-side reading | Yes: swap |
| 12 | d-block shade | Overlay | Olive wash over groups 3–12 with a standing caption explaining that their outer-electron rule is not the simple one | No |
| 13 | Reactivity chip | Instrument | Small disc on each plinth showing a 0–10 vigour index drawn from the same dataset the reactivity theatre uses | No |
| 14 | Slice selector cursor | UI-Probe | Glowing frame the student drags over any column or row to select it, snapping to whole groups or whole periods | Yes: drag |
| 15 | Camera dolly rig | Instrument | Rail carrying the viewpoint from plan view down to eye level with the plinths | Yes: drag |

**How it works — the model.**
Every element row carries its group, period, shell occupancy string, atomic radius in pm, melting point in °C, density and a vigour index. Selection drives everything. A group selection filters to one column and reads the outer-electron count off each shell string, identical all the way down: group 1 gives 1, group 2 gives 2, groups 13–18 give group number minus 10. A period selection filters to one row and reads the number of occupied shells, identical all the way across while the outer count climbs 1, 2, 3 … 8. The ribbon plots real measured values, so period 3 melting points really do spike at silicon and collapse at phosphorus. The limit is stated rather than hidden: transition metals break the simple valence rule, so the d-block is shaded and the caption says why. The failure to avoid is implying that group members are identical; the vigour chips differ down every column even though the outer count does not.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Selection mode | Radio | Group / Period / Two-group compare / Free tile | Group | — | Structural: whether a column rises, a row sweeps, or two columns interleave |
| Group | Dropdown | 1, 2, 13, 14, 15, 16, 17, 18 | 1 | — | Which column lifts on the pistons |
| Period | Stepper | 1–7 | 3 | — | Which row the light sweep runs along |
| Property on the ribbon | Dropdown | Outer electrons / Atomic radius / Melting point / Density / Vigour with water | Outer electrons | varies | What the wall graph plots for the live slice |
| Second group to compare | Dropdown | None, 1, 2, 13, 14, 15, 16, 17, 18 | None | — | Adds the translucent ghost column |
| Shell rendering | Dropdown | Rings with halo / Stacked bars / Occupancy string / Off | Rings with halo | — | How each atom's electron arrangement is drawn |
| Mystery tile | Toggle + tile pick | Off, or any single tile | Off | — | Blanks one element and demands a prediction before revealing |
| Riser height | Slider | 0–900 | 700 | mm | How far the selected column stands proud of the floor |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Down the first column | mode=Group; group=1; property=Outer electrons | Lithium, sodium, potassium, rubidium. What number is the same all the way down, and what number keeps growing? |
| S2 | Across period 3 | mode=Period; period=3; property=Outer electrons | Sodium to argon. Which count stays fixed across the row and which climbs by one each step? |
| S3 | The unreactive column | mode=Two-group compare; group=17; second group=18; property=Vigour with water | Group 17 attacks almost everything and group 18 does nothing. What is different about their outer shells? |
| S4 | Name the blank | mode=Group; group=2; mystery tile=period 4, group 2 | Only the coordinates are showing. State the outer electrons and the number of shells before you reveal it. |

**Student activities.**
1. Select group 1 and record the outer-electron count and the shell count for all five plinths in a two-column table.
2. Switch to period 3 and record the same two numbers across the row. Circle the one that behaved differently from the group run.
3. Set the property ribbon to melting point for period 3 and mark the two elements where the line jumps hardest.
4. Compare groups 17 and 18 with the vigour chips on and write one sentence linking outer electrons to how violently each family reacts.
5. Blank the calcium tile, predict its two numbers in writing, then reveal and record whether you were right.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Outer electrons per element | Bar chart | count | One bar per element of the live slice; flat for a group, a staircase for a period |
| Shell count per element | Bar chart | count | Companion chart; a staircase for a group, flat for a period |
| Property ribbon | Line graph | pm, °C, g/cm³ or index | Real measured values along the live slice, annotated by symbol |
| Group vigour spread | Data table | index 0–10 | Vigour for every member of the selected column, showing the trend within the shared behaviour |
| Prediction score | Pass-fail badge | — | Green when both mystery-tile numbers were predicted correctly, with the correct values shown either way |
| Slice log | Data table | mixed | Exportable CSV of every slice viewed with its two counts |

**What the student should realise.**
Students think the rows are the families, because left to right is how they read everything else. Lifting a column and finding one number identical the whole way down, while the same number climbs steadily across any row, puts the family in the vertical. The student should be able to say: *"A group shares behaviour because its members all have the same number of outer electrons; a period just tells me how many shells the atom is using."*

### A3.3 · Metals, non-metals and metalloids

**Experiment name:** The Materials Testing Bench  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model + Rigid-body  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-3

**Theme & scene.**
A bright school materials lab shot from just above bench height. Along the front edge lies a foam-lined tray of twelve sample coupons, each a 20 × 20 × 3 mm plate: warm copper, dull grey zinc, silvery magnesium, pale silicon with a metallic sheen, grey-white germanium, brittle yellow sulfur, black graphite, dark red phosphorus, blue-black iodine crystals, aluminium, brass and one blank coupon stamped UNKNOWN. Behind them sit four rigs in a row: a conductivity circuit with crocodile clips and a lit lamp, a small hydraulic press with a load cell, a gloss booth with a swivelling lamp, and a heated rod with wax beads along it. To the right stand three labelled bins. Control panel docks right; the data table builds itself along the bottom of the screen.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample coupon | Actor | 20 × 20 × 3 mm plate with a 6 mm grip tab, per-element albedo and roughness map, twelve instances in a foam tray; drags to any rig and clicks into its jaws | Yes: drag |
| 2 | Unknown coupon | Actor | Identical geometry, matt grey primer, stamped UNKNOWN and a run number; its true identity is hidden until the student commits a classification | Yes: drag |
| 3 | Conductivity rig | Instrument | 3 V cell, two crocodile clips on flying leads, 6 V 0.06 A lamp, series milliammeter with a 0–500 mA scale, all on a wooden base | Yes: connect |
| 4 | Sample heater collar | Instrument | Small clamp-on heater around the coupon in the conductivity rig, 20–120 °C, with a bead thermocouple reading to 0.1 °C | Yes: place |
| 5 | Hydraulic press | Instrument | Bench press with a 30 mm flat anvil, hand wheel, digital load cell to 5,000 N; crushes or bends whichever coupon is in the jaws | Yes: connect |
| 6 | Deformation gauge | Instrument | Dial gauge riding on the anvil, 0–3.00 mm to 0.01 mm; freezes at the reading where fracture occurred | No |
| 7 | Fracture debris | Particle | For brittle samples, 8–30 angular shards spawned at the fracture load with the parent material's colour, scattering with rigid-body physics | No |
| 8 | Gloss booth | Instrument | Matt black box with a lamp on a 0–85° swivel arm and a photodiode opposite; reads specular reflection in gloss units 0–120 | Yes: connect |
| 9 | Thermal rod rig | Instrument | 150 mm rod clamped to the coupon at one end, five paraffin wax beads spaced 25 mm along it, hot plate at 90 °C at the far end; beads drop as heat arrives | Yes: place |
| 10 | Stopwatch probe | Instrument | Auto-triggered timer measuring seconds from heater-on to the fifth bead dropping | No |
| 11 | Classification bins | Structure | Three open-topped bins labelled METAL, NON-METAL, METALLOID, each with a live count and a lid that will not close until every tested coupon is filed | Yes: place |
| 12 | Property card | Overlay | A card that flips up beside each rig showing that rig's single measured number, unit and uncertainty; blank until the test is run | No |
| 13 | Data table strip | Overlay | Bottom-of-screen grid, one row per coupon, five measured columns, filling as tests complete; exportable | No |
| 14 | Temperature-conductivity plotter | Instrument | Small scope panel plotting current against sample temperature for whichever coupon is in the conductivity rig | No |
| 15 | Reveal lever | UI-Probe | Brass lever beside the bins; throwing it reveals every coupon's true identity and scores the student's bin choices | Yes: drag |

**How it works — the model.**
Each coupon carries five real measured properties: electrical conductivity in S/m, its temperature coefficient, gloss units, fracture strain in per cent, and thermal transit time for the wax rod. Nothing is labelled by category anywhere in the scene; category is only ever assigned by the student. The rigs convert stored properties into instrument readings, so the conductivity rig returns lamp current I = V / (R_lead + ρL/A) using the sample's real resistivity, and the press returns a deformation curve that either yields plastically or snaps at the fracture strain, spawning shards. The temperature control carries the decisive evidence: metals lose conductivity as they warm because the coefficient is positive on resistance, while silicon and germanium gain it sharply, so the metalloid class falls out of a measurement rather than out of a definition. Two deliberate traps are built in: graphite conducts well and iodine is genuinely lustrous, so no single test separates the classes.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Coupon in the jaws | Drag-handle | Any of the twelve tray coupons | Copper | — | Structural: which sample is loaded into the selected rig |
| Test rig | Radio | Conductivity / Press / Gloss booth / Thermal rod | Conductivity | — | Which rig the coupon is clamped into and which card flips up |
| Test voltage | Slider | 1.5–6.0 | 3.0 | V | Driving voltage in the conductivity circuit and therefore the current scale |
| Sample temperature | Slider | 20–120 | 20 | °C | Heater collar setting; drives the conductivity-versus-temperature plot |
| Press load | Slider | 0–5,000 | 0 | N | Force applied by the press; deformation or fracture follows |
| Lamp angle | Dial | 0–85 | 60 | ° | Angle of incidence in the gloss booth |
| Unknown coupons | Stepper | 0–4 | 1 | count | How many blind samples appear in the tray for classification |
| Category hints | Toggle | On / Off | Off | — | When Off, no colour coding or labels anywhere; when On, the periodic table staircase is drawn afterwards for checking |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Four easy coupons | coupons=Copper, Zinc, Sulfur, Phosphorus; rig=Conductivity; voltage=3.0; hints=Off | Two coupons light the lamp and two do not. What else do the two conducting coupons have in common when you press and polish them? |
| S2 | The awkward ones | coupons=Graphite, Iodine; rig=Gloss booth then Conductivity; hints=Off | Graphite conducts and iodine shines. Run all four tests on each. Why does neither belong in the metal bin? |
| S3 | Heat the sample | coupons=Copper, Silicon; rig=Conductivity; temperature swept 20→120 | Copper's current falls as it warms and silicon's rises. What does that one difference let you call silicon? |
| S4 | Blind classification | unknowns=4; hints=Off; all four rigs available | You have four unmarked coupons and four tests. File each one and defend the filing with two numbers. |

**Student activities.**
1. Drag copper, sulfur, silicon and graphite in turn into the conductivity rig at 3.0 V and record the lamp current in mA for each.
2. Press each of the same four coupons to fracture and record the deformation in mm at which it either bent or shattered.
3. Set the gloss booth to 60° and record gloss units for all four, then note which reading would have misled you on its own.
4. Sweep the sample temperature from 20 °C to 120 °C for copper and for silicon and record the direction each current moved.
5. Classify all four unknown coupons into the bins, writing the two measurements you used for each, then throw the reveal lever and record your score.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Lamp current | Live numeric | mA | Series milliammeter reading, 1 dp, updating while clips are attached |
| Conductivity vs temperature | Line graph | mA vs °C | One trace per coupon tested; slope sign is the metalloid test |
| Deformation at failure | Live numeric | mm | Dial gauge value frozen at fracture or at 5,000 N if it never fractures |
| Gloss | Live numeric | gloss units | Photodiode reading at the set lamp angle |
| Thermal transit time | Timer | s | Time for the fifth wax bead to drop |
| Property matrix | Data table | mixed | Twelve rows by five measured columns, exportable as CSV |
| Classification score | Pass-fail badge | — | Correct bins out of the number filed, revealed only after the lever is thrown |

**What the student should realise.**
Students classify by appearance: shiny means metal, dull means non-metal, and that settles it. Iodine is lustrous, graphite conducts, and silicon does both weakly, so appearance alone files three coupons wrongly. Only the set of measurements, especially the direction conductivity moves when the sample is heated, separates the three classes cleanly. The student should be able to say: *"Metal, non-metal and metalloid are decided by a set of measured properties working together, not by whether something looks shiny."*

### A3.4 · Why the table is organized this way

**Experiment name:** Mendeleev's Desk: Build the Table From Data  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-1

**Theme & scene.**
A wide oak desk under a green-shaded lamp, seen from directly above. Spread across it is a green felt sorting board ruled into empty snap cells. To the left waits a squared-off deck of thirty stiff cards, each printed only with measured properties: a mass in u, a density, a melting point, the formula of its oxide and its chloride, and a one-line note on what happens with water. No names, no symbols, no colours. A brass card-holder, an inkwell, a ledger open at a blank page and a rack of stoppered oxide samples sit right. When cards land in an arrangement the data supports, the column beneath them warms from felt-green to lamplight-gold. Control panel docks right; the live property plot pins to the desk's top edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sorting board | Structure | Felt board ruled into a grid of 60 × 80 px snap cells, columns and rows re-ruled instantly when row length changes | Yes: resize |
| 2 | Property card | Actor | 60 × 80 px card stock with a hairline border; six printed fields, no element name; thirty instances; lifts with a shadow on drag and clicks into a cell | Yes: drag |
| 3 | Card face fields | Overlay | Relative atomic mass to 1 dp, density in g/cm³, melting point in °C, oxide formula as R₂O / RO / RO₂, chloride formula, and a water note such as "fizzes, floats, alkaline" | No |
| 4 | Anomaly card pair | Actor | Two specially marked cards, Ar 39.9 and K 39.1, whose mass order contradicts their property order; identical stock so they are found, not signposted | Yes: drag |
| 5 | Gap token | Structure | Blank card with a question mark and a dotted border, placeable in any empty cell to reserve it for an undiscovered element | Yes: place |
| 6 | Prediction slip | UI-Probe | Small slip that unfolds from a gap token with four editable fields: expected mass, density, oxide formula and water behaviour | Yes: place |
| 7 | Column resonance lamp | Instrument | Under-felt glow per column; brightness scales with how consistent the oxide formulas and water notes are down that column | No |
| 8 | Property plot strip | Instrument | 1,200 px strip along the desk's top edge plotting the chosen property against position in the current layout, redrawn on every card move | No |
| 9 | Row-length ruler | Instrument | Brass ruler along the board's top notched 3 to 10; sliding it re-ruled the grid and shuffles cards into the new row length | Yes: drag |
| 10 | Oxide sample rack | Structure | Twelve stoppered 15 mm vials of the oxides named on the cards, matched by colour: white, red-brown, yellow, black | Yes: swap |
| 11 | Mendeleev's ledger | Instrument | Open ledger that transcribes each committed layout with a timestamp and its periodicity score | No |
| 12 | Reveal plate | UI-Probe | Hinged brass plate along the board's right edge; lowering it prints the real symbol on every card in place | Yes: drag |
| 13 | Modern-key lever | UI-Probe | Second lever that re-sorts by atomic number instead of mass, moving only the cards where the two orders disagree | Yes: drag |
| 14 | Periodicity scorer | Instrument | Invisible evaluator over the whole board returning a 0–100 score from column-wise agreement of oxide formula, chloride formula and water note | No |
| 15 | Discard tray | Structure | Shallow tray for cards the student has not placed yet; counts remaining | Yes: place |

**How it works — the model.**
The thirty cards hold the real measured properties of the first thirty elements as they were known in 1869, with names stripped. The scorer never checks the layout against the modern table; it checks the data against itself. For every column it compares oxide formula, chloride formula and the water note across the cards actually sitting there and returns an agreement fraction, and the column lamp brightness is that fraction. Row length is the structural lever: at any length other than eight the columns disagree and stay dark, at eight the alkali cards stack, the halogen cards stack, and the board lights. Sort key is the second lever. Sorting by mass places argon after potassium and the anomaly cards break their columns; switching to atomic number moves exactly those cards and nothing else, the repair Moseley made. Gap tokens raise the periodicity score when the properties either side genuinely skip a step, so leaving a hole is rewarded, not penalised.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Card deck | Dropdown | First 20 elements / First 30 elements / Mendeleev's 1869 set of 63 | First 30 elements | count | Structural: how many cards are dealt and how hard the pattern is to see |
| Row length | Drag-handle on the ruler | 3–10 | 5 | cells | Re-rules the grid; the single control that makes or breaks the columns |
| Sort key | Radio | Atomic mass / Density / Melting point / Atomic number | Atomic mass | — | Which property the auto-arrange button orders cards by |
| Auto-arrange | Stepper | Off / Order only / Order and deal into rows | Off | — | Whether the deck lays itself out by the chosen key or the student places every card |
| Property on the plot strip | Dropdown | Atomic mass / Density / Melting point / Oxide formula type / Water vigour | Density | — | What the top-edge graph plots against board position |
| Gap tokens available | Stepper | 0–6 | 3 | count | How many holes the student may reserve for undiscovered elements |
| Reveal names | Toggle | Hidden / Shown | Hidden | — | Prints real symbols on the cards; locks the periodicity score at its pre-reveal value |
| Modern key | Toggle | Off / On | Off | — | Re-sorts by atomic number, moving only the cards where mass order and number order disagree |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Rows of five | deck=First 20; row length=5; sort key=Atomic mass; reveal=Hidden | Lay all twenty out in rows of five. Do any columns light? What does that tell you about five? |
| S2 | Find the row length | deck=First 20; row length free 3–10; sort key=Atomic mass | Try every row length from 3 to 10 and record the periodicity score for each. Which one lights the board, and why that one? |
| S3 | Leave a hole | deck=First 30; row length=8; gap tokens=3 | Two neighbouring cards jump in density and change oxide formula. Reserve a gap and write on the slip what the missing element must weigh and how it must behave. |
| S4 | The pair that will not sit | deck=First 20; row length=8; sort key=Atomic mass; then modern key=On | Two cards break their columns when you sort by mass. Which two, and what changed when you switched to atomic number? |

**Student activities.**
1. Deal the first twenty cards and place them in rows of five by increasing mass. Record the periodicity score and which columns, if any, lit.
2. Drag the row-length ruler through 3, 4, 6, 7, 8 and 10, recording the score at each. Plot score against row length.
3. Set row length to 8 and write down, for one lit column, the three card fields that are the same all the way down it.
4. Place a gap token where the data skips, fill in the prediction slip, then lower the reveal plate and record how close your predicted mass and density were.
5. Switch the modern key on and record exactly which cards moved and which stayed put.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Periodicity score | Live numeric | 0–100 | Column-wise agreement of oxide formula, chloride formula and water note for the current layout |
| Score vs row length | Line graph | score vs cells | Built point by point as the student tries each row length; peaks sharply at 8 |
| Column agreement | Bar chart | % | One bar per column showing how consistent its cards are |
| Prediction error | Data table | u and g/cm³ | Predicted minus actual mass and density for each gap token filled |
| Cards displaced by the modern key | Counter | count | How many cards move when the sort key changes from mass to atomic number |
| Layout ledger | Data table | mixed | Every committed layout with its row length, sort key and score, exportable |

**What the student should realise.**
Students assume the table's shape was decided by somebody, the way a seating plan is decided. Here nobody decides anything: with the names hidden, only a row length of eight makes the measured properties line up, and the same pattern appears whichever thirty cards are dealt. The student should be able to say: *"The table has this shape because the properties really do repeat every so often, and the shape was discovered in the data rather than invented."*

### A3.5 · Reactivity patterns across the table

**Experiment name:** The Armoured Theatre: Measuring Vigour  
**Render mode:** 3D Scene  
**Simulation engine:** Fluid/thermal + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-2

**Theme & scene.**
A remote demonstration theatre seen from a raked viewing gallery behind 60 mm armoured glass. The glass carries a faint blue wireframe grid and a corner watermark reading SIMULATION so nobody mistakes this for a procedure they could run. Beyond it, a white-tiled cell holds a glass trough of water tinted violet-pink by universal indicator, a rack of stoppered halogen and halide solutions, and a jointed manipulator arm that lifts one pellet at a time from an oil-filled jar. Sensors crowd the trough: a thermocouple on a stalk, an inverted gas-collection tube, a hydrophone, a pH probe, and a high-speed camera whose feed occupies a picture-in-picture panel top-left. When a reaction runs, the tiles flash with the flame colour. Control panel docks right, sensor readouts stack along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Armoured viewing glass | Environment | 60 mm laminated pane with a blue wireframe overlay, corner SIMULATION watermark, and a spatter layer that accumulates through a session | No |
| 2 | Water trough | Structure | 400 × 250 × 150 mm glass tank filled to 100 mm with water dyed violet-pink by universal indicator; dye advects with the surface flow | Yes: resize |
| 3 | Alkali metal pellet | Actor | Soft grey cube 3–12 mm with a freshly cut bright face; stored under paraffin oil in a jar; melts to a molten sphere on the surface for sodium and heavier | Yes: drag |
| 4 | Manipulator arm | Instrument | Three-jointed arm with rubber-tipped tongs; lifts one pellet, wipes the oil, and drops it from a set height | Yes: drag |
| 5 | Hydrogen bubble stream | Particle | Emitter locked to the pellet, rate proportional to the vigour index, bubbles 0.5–3 mm rising into the collection tube | No |
| 6 | Flame plume | Particle | Ignites above the pellet once the vigour index passes 6; colour keyed to the metal, crimson for lithium, orange-yellow for sodium, lilac for potassium, red-violet for rubidium | No |
| 7 | Indicator plume | Field | Purple hydroxide plume spreading from the reaction site through the violet-pink water on a diffusion field; the visible proof an alkali formed | No |
| 8 | Gas collection tube | Instrument | Inverted 50 mL graduated tube over the pellet track, water-filled, displaced by collected hydrogen; graduated in 1 mL | Yes: place |
| 9 | Thermocouple stalk | Instrument | K-type bead on a 200 mm stalk, −10 to 120 °C, 0.1 °C resolution, placeable anywhere in the trough | Yes: place |
| 10 | Hydrophone | Instrument | Sealed 20 mm sensor on the tank wall reading peak sound level 30–130 dB | Yes: place |
| 11 | Halogen solution rack | Structure | Six 25 mL stoppered tubes: chlorine water pale yellow-green, bromine water orange-brown, iodine solution brown, plus potassium chloride, bromide and iodide solutions, all colourless | Yes: swap |
| 12 | Displacement test tube | Actor | 16 × 150 mm tube in a rack, receives 2 mL of a halogen and 2 mL of a halide; a 1 mL cyclohexane cap sits on top and takes the colour of whichever halogen ends up free | Yes: place |
| 13 | Colorimeter | Instrument | Clamp-on cell reading absorbance 0.00–2.00 at 470 nm and 520 nm to turn the colour change into a number | Yes: connect |
| 14 | High-speed camera feed | Overlay | Picture-in-picture panel at 240 fps with a scrub bar, so the first 200 ms of a violent reaction can be stepped through | Yes: drag |
| 15 | Reactivity ladder chart | Overlay | Right-hand vertical chart onto which each completed run pins a marker at its measured vigour, building an ordered ladder from the student's own data | No |
| 16 | Vent and quench system | Structure | Overhead extraction hood and a flood valve that clears the trough between runs; visible reset animation | No |

**How it works — the model.**
Two reaction families share one engine. Alkali metal in water runs 2M + 2H₂O → 2MOH + H₂ at a rate constant that rises down group 1 as the single outer electron sits further from the nucleus and is lost more easily, so lithium fizzes steadily while potassium ignites its own hydrogen. Rate scales with exposed surface area, so pellet size changes duration and peak power but not the ranking. Released energy feeds the thermal field to give the temperature rise, hydrogen output feeds the gas tube, and turbulence feeds the hydrophone. Halogen displacement runs a straight comparison of the two halogens' pull on an electron: chlorine displaces bromide and iodide, bromine displaces iodide only, iodine displaces neither, and the cyclohexane cap turns pale, orange or violet accordingly. The failure to avoid is presenting vigour as danger; every readout is a measured number, and the ladder the student builds is ordered by position in the table, not by drama.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Theatre mode | Radio | Alkali metal in water / Halogen displacement / Group 2 in water / Noble gas control | Alkali metal in water | — | Structural: which apparatus is wheeled in and which sensors arm |
| Metal | Dropdown | Lithium / Sodium / Potassium / Rubidium / Magnesium / Calcium | Sodium | — | Which pellet the arm lifts and which rate constant applies |
| Pellet size | Slider | 3–12 | 6 | mm | Exposed surface area, and so duration and peak power |
| Water temperature | Slider | 5–40 | 20 | °C | Starting temperature and reaction rate |
| Halogen added | Dropdown | Chlorine water / Bromine water / Iodine solution | Chlorine water | — | Which halogen goes into the displacement tube |
| Halide in the tube | Dropdown | Potassium chloride / Potassium bromide / Potassium iodide | Potassium iodide | — | Which halide it is tested against |
| Camera speed | Dial | 25–240 | 25 | fps | Frame rate of the picture-in-picture feed for stepping through the first moments |
| Indicator | Toggle | On / Off | On | — | Whether the water carries universal indicator |
| Auto-log to ladder | Toggle | On / Off | On | — | Whether each finished run pins its own marker to the reactivity ladder |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Down group 1 | mode=Alkali metal; metal stepped Li→Na→K→Rb; pellet=6 mm; water=20 °C | Run all four at the same size and temperature. Put the four peak temperature rises in order. Which way does vigour go as you move down the column? |
| S2 | Bigger piece, same metal | mode=Alkali metal; metal=Sodium; pellet stepped 3→6→12 mm | A bigger pellet reacts harder. Does that move sodium's place on the ladder relative to potassium? |
| S3 | The displacement grid | mode=Halogen displacement; every halogen against every halide | Fill in all nine cells of the grid. Which halogen displaces the most, and how does that order compare with group 1? |
| S4 | Two more columns | mode=Group 2 in water then Noble gas control; metal=Magnesium then Calcium | Magnesium barely moves, calcium fizzes steadily, argon does nothing at all. What does the outer-electron count predict about each? |

**Student activities.**
1. Run lithium, sodium, potassium and rubidium at 6 mm and 20 °C. Record peak temperature rise, hydrogen volume in 30 s and peak sound level for each.
2. Predict, before running, whether a 12 mm sodium pellet will out-react a 6 mm potassium pellet. Run both and record which won on peak temperature.
3. Set the camera to 240 fps and step through the first 200 ms of the potassium run. Record the time at which the flame first appears.
4. Complete the three-by-three displacement grid, entering the cyclohexane colour and the colorimeter absorbance in each cell.
5. Read your own ladder chart and write the two trend sentences it supports, one for group 1 and one for group 17.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Peak temperature rise | Live numeric | °C | Thermocouple maximum minus starting temperature, 0.1 °C |
| Hydrogen collected | Live numeric | mL | Volume displaced in the graduated tube, running total per run |
| Gas production rate | Line graph | mL/s vs s | Rate trace for the whole run; peak height is the cleanest vigour measure |
| Peak sound level | Live numeric | dB | Hydrophone maximum over the run |
| Final pH | Live numeric | pH | Probe reading after mixing, showing the hydroxide formed |
| Displacement grid | Data table | colour + absorbance | Three by three matrix of halogen against halide with a reacted or unreacted verdict per cell |
| Reactivity ladder | Bar chart | vigour index 0–10 | Student-built ordering of every element run, pinned in the order they were measured |

**What the student should realise.**
Students treat reactivity as unpredictable danger, roughly equal to how loud something is. Measuring four metals at identical size and temperature produces a strict order that matches their positions down group 1, and the halogen grid produces the opposite order down group 17, both from numbers rather than impressions. The student should be able to say: *"How strongly an element reacts is set by where it sits in the table, so I can predict the order before I run anything."*

## A4 · Molecules, compounds and formulas · MS-PS1-1

### A4.1 · Element, compound and mixture

**Experiment name:** Twelve Jars and a Separation Bench  
**Render mode:** 3D Scene  
**Simulation engine:** Particle system + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A long white lab bench lit flat, shot from a low three-quarter angle. Twelve stoppered 100 mL jars stand along the back rail, numbered only: copper turnings, sulfur powder, iron filings, blue copper sulfate crystals, water, salt solution, sand in water, black iron sulfide, air in a gas jar, a brass ingot, mixed iron filings and sulfur, and a bottle of black ink. In front stand three empty sorting trays. To the right, the separation bench carries a filter funnel over a conical flask, an evaporating basin on a tripod above a hotplate, a chromatography tank with a paper strip above the solvent, and a magnet on a wooden handle. A loupe on a swing arm hovers above. Control panel docks right; the particle view opens as an inset.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample jar | Actor | 100 mL screw-top glass jar, numbered label only, twelve instances with per-sample contents mesh and colour; lifts and pours | Yes: drag |
| 2 | Particle loupe | UI-Probe | 120 mm brass loupe on a swing arm; hovering a jar opens an inset showing that sample at particle level with a 1 nm scale bar | Yes: drag |
| 3 | Single-atom sphere | Particle | CPK-coloured sphere per element: copper brown, sulfur yellow, iron orange-brown, sodium violet, chlorine green, oxygen red, hydrogen white; 200–400 instances per loupe view | No |
| 4 | Bonded compound unit | Particle | Fixed-ratio cluster with visible bond cylinders, for example one Cu with one S and four O, or one Fe with one S; the cluster never separates under stirring | No |
| 5 | Mixture volume | Field | Invisible container region holding two or more particle species in a student-set ratio, freely re-proportioned and freely intermingled | Yes: resize |
| 6 | Sorting tray | Structure | Three shallow steel trays labelled ELEMENT, COMPOUND, MIXTURE, each with a live count and a jar-shaped snap socket | Yes: place |
| 7 | Filter funnel assembly | Instrument | 75 mm glass funnel, folded filter paper, conical flask beneath, retort stand and clamp; passes dissolved particles, retains anything above 1 µm | Yes: connect |
| 8 | Evaporating basin rig | Instrument | 90 mm porcelain basin on a gauze and tripod over a hotplate set 0–300 °C; solvent particles leave as vapour, solute crystals grow in the basin | Yes: connect |
| 9 | Chromatography tank | Instrument | 200 mm glass tank, solvent to 10 mm, paper strip with a pencil baseline and a 3 mm ink spot; components creep at their own R_f values | Yes: place |
| 10 | Magnet wand | Instrument | 20 mm neodymium disc on a 150 mm wooden handle; attracts iron particles only, and only while they are unbonded | Yes: drag |
| 11 | Reaction furnace | Instrument | Small tube furnace, 20–600 °C, that converts a placed iron-and-sulfur mixture into iron sulfide once above 250 °C, with a visible glow front travelling along the tube | Yes: connect |
| 12 | Bench balance | Instrument | Top-pan balance, 0–500 g to 0.01 g, tared per vessel; weighs every fraction recovered | Yes: place |
| 13 | Mass ledger | Overlay | Running account of starting mass and every recovered fraction, with a residual line so nothing goes missing | No |
| 14 | Ratio mixer | Instrument | Twin-hopper dispenser that builds a custom iron-and-sulfur mixture at any mass ratio from 1:9 to 9:1 | Yes: swap |
| 15 | Property card | Overlay | Card flipping up beside any sample showing colour, magnetic response, and behaviour with dilute acid; blank until tested | No |

**How it works — the model.**
Every sample is a particle list. An element holds one species of unbonded sphere; a compound holds identical bonded clusters in a fixed whole-number ratio that no mechanical process can break; a mixture holds two or more species, unbonded, at whatever ratio the student sets. Each separation technique tests one physical property: the filter passes anything below 1 µm, evaporation removes species whose boiling point is below the hotplate setting, chromatography advances each species by its own R_f, and the magnet grips unbonded iron. Because separations act on particles rather than labels, they fail on compounds. The furnace is the hinge: heat an iron-and-sulfur mixture past 250 °C and the engine consumes iron and sulfur in a strict 1:1 ratio into iron sulfide clusters; from that moment the magnet lifts nothing and the ratio slider greys out. The failure to avoid is drawing a compound as two touching spheres; bonds must be visible cylinders surviving every stir, filter and shake.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample on the bench | Drag-handle | Any of the twelve jars | Jar 11, iron and sulfur | — | Structural: which particle list is loaded and what the loupe shows |
| Separation technique | Dropdown | None / Filtration / Evaporation / Chromatography / Magnetism | None | — | Which rig the sample is poured into and which property is tested |
| Hotplate temperature | Slider | 20–300 | 100 | °C | Which species evaporate from the basin, and how fast |
| Furnace temperature | Slider | 20–600 | 20 | °C | Above 250 °C, converts an iron and sulfur mixture into iron sulfide irreversibly |
| Iron : sulfur ratio | Slider | 1:9 to 9:1 | 5:5 | mass ratio | Composition of the custom mixture built by the ratio mixer |
| Loupe magnification | Slider | 1×–20,000,000× | 5,000,000× | — | Zoom from jar view down to individual particles, with the scale bar tracking |
| Solvent | Dropdown | Water / Propanone / Ethanol | Water | — | Which solvent the chromatography tank runs, changing the R_f values |
| Bond overlay | Toggle | On / Off | On | — | Draws the bond cylinders inside compound clusters |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Twelve jars, three trays | sample=each jar in turn; technique=None; loupe=5,000,000× | Sort all twelve jars using the loupe alone. What do you look for to tell a compound from a mixture? |
| S2 | Take it apart | sample=Jar 7 sand in water then Jar 6 salt solution; technique=Filtration then Evaporation | Both look like one substance in a jar. Which technique recovers each part, and what mass comes back? |
| S3 | Make a compound | sample=Jar 11; ratio=5:5; magnet first; then furnace=400 °C; magnet again | The magnet lifted the iron before heating and lifts nothing after. What happened to the iron? |
| S4 | Any ratio you like | sample=custom; ratio stepped 2:8, 5:5, 8:2; then furnace=400 °C on each | You can mix iron and sulfur in any ratio you choose. After heating, what ratio does the black solid always come out at? |

**Student activities.**
1. Hover the loupe over all twelve jars and sort each into ELEMENT, COMPOUND or MIXTURE, writing the particle-level reason for each.
2. Pour jar 7 through the filter and jar 6 into the evaporating basin. Record the mass recovered from each and compare it with the starting mass.
3. Run the ink through the chromatography tank in water and then in propanone. Record how many components appear each time.
4. Draw the magnet through the iron and sulfur mixture, record the mass of iron lifted, then heat the mixture to 400 °C and repeat the magnet test.
5. Build the mixture at 2:8 and at 8:2, heat both, and record the composition of the iron sulfide produced in each case.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Particle inventory | Data table | count | Species and count in the loupe view, with a bonded or unbonded flag for each |
| Mass recovered | Live numeric | g | Balance reading for each separated fraction, 0.01 g |
| Mass ledger | Data table | g | Start mass, every fraction out, and the residual, so losses are visible |
| Chromatogram | Heat map | R_f 0–1 | Strip image with a measured R_f for each band |
| Magnetic response | Pass-fail badge | — | Lifted or not lifted, logged before and after any furnace run |
| Composition of product | Bar chart | mass % | Iron and sulfur proportions in the product, which lands on the same fixed ratio from every starting mix |

**What the student should realise.**
Students treat a compound as a well-stirred mixture, expecting a strong filter or magnet to pull it apart. Every separation here is a physical test, and all fail the moment iron and sulfur are joined, while the same tools undo any mixture. The student should be able to say: *"A mixture keeps its parts and their properties and I can take it apart; a compound has one fixed recipe and new properties, and no magnet will touch it."*

### A4.2 · Reading a chemical formula

**Experiment name:** The Formula Translator  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Molecular  
**Interaction level:** Manipulate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A console in two halves. On the left, a heavy mechanical keyboard beneath a green phosphor input strip where the typed formula appears at 40 pt, each character boxed as the parser claims it. Below the strip, a paper tape scrolls out of a slot printing one token per line: symbol, subscript, bracket open, bracket close, multiplier, coefficient. On the right, behind glass, a tall assembly chamber lined with 20 labelled dispenser cartridges, each holding spheres of one element in its CPK colour. As the tape prints, the matching cartridge fires a sphere down a chute into a steel tray on a lit turntable. A red buzzer lamp above the chamber flags anything the parser cannot read. Control panel docks right; the atom inventory panel runs down the left edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Input strip | UI-Probe | Green phosphor field, 40 pt monospace, live per-character boxing: symbols in white, subscripts in amber, brackets in cyan, coefficient in magenta | Yes: place |
| 2 | Parser tape | Instrument | Continuous printed tape, one token per line with its type and value, scrolling out of a slot at 3 lines per second | No |
| 3 | Element dispenser cartridge | Structure | Twenty clear tubes on the chamber wall, each labelled with a symbol and full name, holding CPK-coloured spheres: H white, C charcoal, N blue, O red, S yellow, Cl green, Na violet, Mg green, Al pink-grey, Ca dark green, Fe orange-brown, Cu copper-brown, K purple, P orange | Yes: swap |
| 4 | Atom sphere | Particle | Sphere sized to the element's covalent radius scaled 1 pm to 0.02 u, so H reads 0.62 u and Cl reads 1.98 u; falls with a soft bounce into the tray | Yes: drag |
| 5 | Assembly tray | Structure | 200 mm shallow steel tray on a turntable, 3 s per revolution; spheres settle into a loose pile grouped by element | Yes: drag |
| 6 | Bracket expander | Instrument | Brass mechanism that visibly clamps around the bracketed tokens on the tape and stamps them the multiplier number of times before dispensing | No |
| 7 | Coefficient carousel | Structure | Rotating platform beneath the tray with slots for up to six identical trays, filled when a leading coefficient is present | No |
| 8 | Case-sensitivity checker | Instrument | Small panel that lights whenever the typed string differs only by case from another valid formula, showing both readings side by side, for example CO and Co | No |
| 9 | Buzzer lamp and reject chute | Instrument | Red lamp above the chamber and a side chute that ejects an unreadable token onto a reject tray with a plain-English reason | No |
| 10 | Name plate | Overlay | Illuminated plate on the chamber front showing the accepted chemical name of the parsed formula, blank if the string is valid but not a named substance | No |
| 11 | Atom inventory panel | Overlay | Left-edge column, one row per element present, each with its CPK swatch, symbol and live count, plus a total-atoms line at the foot | No |
| 12 | Relative formula mass readout | Instrument | Panel above the inventory summing count × relative atomic mass per element, showing the working line by line | No |
| 13 | Preset formula wheel | UI-Probe | Detented thumb wheel loading twelve worked formulas, from H₂O up to Al₂(SO₄)₃ and CuSO₄·5H₂O | Yes: swap |
| 14 | Comparison bay | Structure | Second smaller tray beside the first that holds a previously parsed formula for side-by-side counting | Yes: place |
| 15 | Chamber glass and chute network | Environment | Glass front with the fourteen chutes routed from cartridges to tray, each chute lighting as its element fires | No |
| 16 | Scale bar | Overlay | 100 pm reference bar beside the tray so relative sphere sizes are readable | No |

**How it works — the model.**
The parser is a small finite-state machine and its states are visible on the tape. It reads left to right: an optional leading coefficient, then repeatedly a symbol, which must be one uppercase letter optionally followed by one lowercase letter, or a bracket group. A number immediately after a symbol or a closing bracket is a subscript and multiplies only what it follows; the leading number is a coefficient and multiplies everything. Symbols are checked against the 118-element table, so "NACL" is rejected with "no element NA" while "NaCl" gives sodium and chlorine, and "Co" gives cobalt where "CO" gives carbon and oxygen. Bracket groups expand before dispensing, so the student watches Mg(OH)₂ become one Mg, two O and two H rather than being told. Counts drive the dispensers directly, so the tray always contains exactly what the formula says. The failure to avoid is a parser that quietly fixes bad input; every rejection must be shown with its reason.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Formula | Numeric and text field | Any string up to 24 characters using element symbols, digits and round brackets | H₂O | — | Structural: the string that is parsed and therefore every atom dispensed |
| Preset formula | Dropdown | H₂O / CO₂ / NaCl / CH₄ / NH₃ / CaCO₃ / Mg(OH)₂ / C₆H₁₂O₆ / Al₂(SO₄)₃ / CuSO₄·5H₂O / CO / Co | H₂O | — | Loads a worked formula into the input strip |
| Coefficient | Stepper | 1–6 | 1 | — | Leading number; fills that many trays on the carousel |
| Dispense speed | Dial | 0.25×–4× | 1× | — | How fast the tape prints and the cartridges fire |
| Bracket handling | Toggle | Expand visibly / Expand instantly | Expand visibly | — | Whether the bracket expander animates the stamping step |
| Case check | Toggle | On / Off | On | — | Shows the side-by-side reading whenever a string differs only by capitalisation |
| Show name | Toggle | On / Off | On | — | Lights the name plate for recognised substances |
| Comparison bay | Dropdown | Empty, or any previously parsed formula from this session | Empty | — | Loads a second tray alongside for direct comparison |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Three easy ones | formula stepped H₂O, CO₂, NaCl; coefficient=1 | For each formula, how many of each element land in the tray, and where in the string is that number written? |
| S2 | Cobalt or carbon monoxide | formula=CO then Co; case check=On | Two strings, two letters each, one capital difference. What is in the tray each time? |
| S3 | Inside the brackets | formula=Mg(OH)₂; bracket handling=Expand visibly | The 2 sits outside the bracket. Which atoms does it multiply, and how many of each end up in the tray? |
| S4 | The hard one | formula=Al₂(SO₄)₃; comparison bay=Mg(OH)₂ | Seventeen atoms come out of this string. Write the count for each element before you press dispense, then check. |

**Student activities.**
1. Type H₂O, CO₂ and NaCl in turn and record the inventory panel counts for each, alongside the total atoms.
2. Type CO, read the name plate and the tray, then type Co and do the same. Record both readings and the rule that separates them.
3. Type NACL and record the exact rejection message and which token was ejected, then correct it and record what changed.
4. Predict, in writing, the six numbers in the inventory for Al₂(SO₄)₃, then dispense and record the actual counts beside your predictions.
5. Load Mg(OH)₂ into the comparison bay against CaCO₃ and record which formula puts more oxygen atoms in its tray.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom inventory | Data table | count | One row per element with its CPK swatch and live count, updated as each sphere lands |
| Total atoms | Counter | count | Sum across all elements in the current tray |
| Token tape | Data table | mixed | Every token with its type, value and the atoms it produced, exportable |
| Relative formula mass | Live numeric | u | Sum of count × relative atomic mass, with the per-element working shown |
| Parse verdict | Pass-fail badge | — | Valid, or invalid with the offending token and a plain-English reason |
| Prediction accuracy | Data table | count | Student's predicted counts against the machine's, per element, per attempt |

**What the student should realise.**
Students read a formula as a word, so "CO" and "Co" look interchangeable and the small numbers look decorative. Watching a machine dispense spheres from the string makes the formula a set of orders: one capital letter changes the element, and every digit demands a specific count. The student should be able to say: *"A formula is an instruction list. A capital letter starts an element's symbol, and the number after it says how many of that atom to take."*

### A4.3 · Subscripts versus coefficients

**Experiment name:** Two Dials: One Rebuilds, One Copies  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A machine-shop rig on a dark bench, symmetrical about a central spine. On the left stands the lathe: a chuck holding one molecule under a work lamp, with a brass subscript dial per element below it, notched 1 to 6 with an audible detent. On the right stands the replicator: a six-slot carousel and a stamping head driven by one coefficient dial. Between them a printed formula card sits in a clip, the subscript digits lit amber and the coefficient digit lit magenta. Under each half sits a sample jar and a property card. The left dial makes the chuck strip the molecule down and rebuild it; the right makes the head thump out identical copies. Control panel docks right; the atom inventory runs across the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Molecule chuck | Structure | Four-jaw chuck 80 mm across holding one ball-and-stick molecule at eye level under a work lamp; rotates 0.3 rev/s | Yes: drag |
| 2 | Subscript dial | UI-Probe | Brass dial per element in the formula, 60 mm, notched 1 to 6, with a detent click and an engraved element symbol | Yes: drag |
| 3 | Coefficient dial | UI-Probe | Larger brass dial, 90 mm, notched 1 to 6, engraved COPIES, driving the stamping head | Yes: drag |
| 4 | Atom sphere set | Particle | CPK-coloured spheres at covalent radii: H white 31 pm, C charcoal 76 pm, N blue 71 pm, O red 66 pm, S yellow 105 pm, Cl green 99 pm | Yes: drag |
| 5 | Bond cylinder | Structure | Grey cylinder 6 mm diameter at the correct bond length, single as one cylinder, double as two parallel at 3 mm spacing, triple as three | Yes: swap |
| 6 | Rebuild animation rig | Instrument | Mechanism that unclamps, strips the changed atoms out to a parts bin, and re-clamps the new arrangement over 1.5 s whenever a subscript dial moves | No |
| 7 | Replicator carousel | Structure | Six-slot turntable, each slot a 60 mm pad, filling left to right with byte-identical copies as the coefficient rises | Yes: place |
| 8 | Stamping head | Actor | Pneumatic head that descends, thumps, and leaves a copy; visibly copies rather than builds, with no parts bin involved | No |
| 9 | Identity plate | Instrument | Illuminated plate under the chuck naming the current substance, going blank and reading NOT A KNOWN SUBSTANCE for invented formulas | No |
| 10 | Property card | Overlay | Card on a stand beside the chuck listing state at room temperature, colour, smell, one common use and one hazard note; flips completely when the substance changes | No |
| 11 | Sample jar | Actor | 50 mL jar whose contents re-render with the substance: clear water, pale blue peroxide, colourless gas swirl, brown nitrogen dioxide haze | No |
| 12 | Ghost of the previous molecule | Overlay | Translucent blue copy of the last molecule held beside the chuck for direct before-and-after comparison | Yes: drag |
| 13 | Same-substance comparator | Instrument | Lamp between the two halves, green when the chuck molecule matches the ghost atom for atom and bond for bond, red when it does not | No |
| 14 | Atom inventory bar | Overlay | Bottom strip showing per-element totals across the whole rig, chuck plus carousel, with a total-atoms figure at the right | No |
| 15 | Parts bin | Structure | Open bin beside the lathe catching atoms removed during a rebuild, so nothing appears or vanishes without being seen | No |
| 16 | Formula card and clip | Instrument | Printed card in a spring clip showing the live formula with subscripts amber and coefficient magenta, redrawn on every dial move | No |

**How it works — the model.**
The rig runs one rule with two very different consequences. A subscript dial edits the composition of a single molecule, so the engine dissolves the current structure, returns the surplus atoms to the parts bin, applies valence rules to rebuild, and re-queries the substance database for a new identity, property card and jar contents. Water at H₂O becomes hydrogen peroxide at H₂O₂, a different substance with a different property card. The coefficient dial never touches composition; it clones the finished molecule into carousel slots, so 3 H₂O is three of exactly the same thing. The inventory bar totals both halves at once, which is where the arithmetic lands: 2H₂O gives four hydrogen and two oxygen, and H₄O₂ would give the same totals while being an entirely different and in fact non-existent structure. The comparator lamp is the honesty check. The failure to avoid is animating a coefficient change as the molecule growing; the stamping head must visibly copy, never build.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Base formula | Dropdown | H₂O / O₂ / CO / NO / SO₂ / CH₄ / N₂O | H₂O | — | Structural: which molecule is clamped in the chuck and which dials appear |
| Subscript, element A | Stepper | 1–6 | 2 | atoms | Rebuilds the molecule with that many of the first element |
| Subscript, element B | Stepper | 1–6 | 1 | atoms | Rebuilds the molecule with that many of the second element |
| Coefficient | Stepper | 1–6 | 1 | copies | How many identical molecules the stamping head places on the carousel |
| Locked dial | Radio | None / Lock subscripts / Lock coefficient | None | — | Forces the student to change only one thing at a time |
| Ghost comparison | Toggle | On / Off | On | — | Keeps the previous molecule visible beside the chuck |
| Property card | Toggle | On / Off | On | — | Shows or hides the substance's real properties and jar contents |
| Rebuild speed | Dial | 0.25×–4× | 1× | — | How slowly the strip-and-rebuild animation plays |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One more oxygen | base=H₂O; subscript B stepped 1→2; coefficient=1; property card=On | The subscript changed by one. Read both property cards. Is this still water? |
| S2 | Three of the same | base=H₂O; subscripts locked; coefficient stepped 1→3 | Three molecules now sit on the carousel. Did any single molecule change? What did the inventory do? |
| S3 | Same atoms, different substance | base=O₂ then subscript A=3; then back to O₂ with coefficient=3 | 2O₃ and 3O₂ both hold six oxygen atoms. Why is one a gas you breathe and the other is not? |
| S4 | Deadly by one atom | base=CO; subscript B stepped 1→2; property card=On | Carbon monoxide to carbon dioxide is one extra oxygen. Compare the two hazard lines. |

**Student activities.**
1. Set the base formula to H₂O and record the identity plate, the property card and the inventory counts.
2. Step the oxygen subscript from 1 to 2 and record the same three things again. State in one sentence what the subscript changed.
3. Reset to H₂O, lock the subscripts, and step the coefficient to 3. Record the inventory before and after and whether the identity plate changed.
4. Predict the inventory for 2H₂O in writing, then set it and check. Now write what H₄O₂ would give for the same inventory and say why that is not the same instruction.
5. Compare CO and CO₂ using the property cards and record the one atom of difference and one consequence of it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom inventory | Data table | count | Per-element totals across chuck and carousel, with a grand total |
| Molecules on the carousel | Counter | count | How many identical copies exist |
| Atoms per molecule | Live numeric | count | Composition of the single molecule in the chuck, independent of the copy count |
| Substance identity | Live numeric | — | Name from the database, or NOT A KNOWN SUBSTANCE |
| Same-substance comparator | Pass-fail badge | — | Green when the chuck molecule is identical to the ghost, red when a subscript has rebuilt it |
| Change log | Data table | mixed | Every dial move with which dial, the new formula, the new identity and the new totals |

**What the student should realise.**
Students read 2H₂O as a bigger water molecule and H₂O₂ as more water, treating both numbers as vague amounts. Two dials make the difference physical: one strips the molecule apart and hands back a different substance with a new hazard note, the other stamps out copies of something unchanged. The student should be able to say: *"The little number inside changes what the molecule is; the big number in front only changes how many of them there are."*

### A4.4 · Counting atoms in a formula

**Experiment name:** The Sorting Hopper: Every Atom Accounted For  
**Render mode:** 2.5D Layered  
**Simulation engine:** State machine + Particle system  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A Victorian counting machine seen side-on, all brass gearing and glass tubing against a workshop wall. A belt runs left to right carrying the formula as wooden letter and digit blocks. A scanning head on a rail rides above the belt, reading one block at a time. Where a bracket group passes, a gearbox drops in and re-runs the group once per multiplier; where a coefficient leads, a larger drum re-runs the whole belt. Atoms fall from the head into a fan of chutes and stack as coloured beads in tall glass tubes, one per element, each with a printed scale. To the right hangs a twin-pan balance, one pan per formula. A small platen printer prints the finished tally on a paper strip. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Formula belt | Structure | 900 px leather belt carrying 40 × 40 px wooden blocks, one per character; letters in black serif, digits in red, brackets as brass staples | Yes: place |
| 2 | Scanning head | Instrument | Brass carriage on a rail, 60 mm lamp underneath, advances one block per tick with a ratchet sound; its lamp is the only lit thing on the belt | Yes: drag |
| 3 | Bracket gearbox | Instrument | Gear train that engages when a bracket opens, latches the enclosed blocks, and re-runs them once per multiplier with the pass number showing on a counter wheel | No |
| 4 | Coefficient drum | Instrument | Large drum at the belt head that re-runs the entire belt once per coefficient count, its revolution counter visible | No |
| 5 | Bracket-depth flag | Overlay | Small red flag that rises above the head while it is inside a bracket group and drops when the group closes | No |
| 6 | Chute fan | Structure | Fourteen glass chutes fanning from the head down to the bin tubes, each lighting as an atom passes through it | No |
| 7 | Element bin tube | Instrument | 400 mm glass tube per element with a printed 0–30 scale, a CPK-coloured bead column and a symbol plate at its foot | Yes: place |
| 8 | Atom bead | Particle | 12 mm bead in its element's CPK colour: H white, C charcoal, N blue, O red, S yellow, Cl green, Na violet, Mg green, Al pink-grey, Ca dark green, Cu copper-brown, K purple | No |
| 9 | Tally counter head | Instrument | Mechanical odometer above each tube showing that element's running count in four digits | No |
| 10 | Prediction slate | UI-Probe | Slate board to the left of the machine where the student writes a predicted count per element before pressing Run; locks when Run is pressed | Yes: place |
| 11 | Twin-pan balance | Instrument | Beam balance with a formula card clipped over each pan and element bins beneath each; tips when the two sides disagree on any element | Yes: connect |
| 12 | Balance verdict lamp | Instrument | Lamp above the beam, green when every element matches across the two pans, red with the offending element named when not | No |
| 13 | Strip printer | Instrument | Platen printer issuing a 60 mm paper strip listing formula, per-element counts, total atoms and prediction score | No |
| 14 | Reject block chute | Structure | Side chute that ejects any block the head cannot read, with the reason printed on a small card | No |
| 15 | Blackboard worked example | Overlay | Chalk panel behind the machine writing the count out longhand as the head runs, for example "3 × (1 Ca + 2 × (1 N + 3 O))" | No |
| 16 | Bin reset lever | UI-Probe | Long brass lever that empties every tube back into the hopper with a visible cascade | Yes: drag |

**How it works — the model.**
The machine multiplies rather than adds, and that is what makes brackets legible. The head walks the belt one block at a time with two running multipliers: an outer multiplier set by the leading coefficient and an inner multiplier set by whatever bracket group it is inside. Every element symbol it reads contributes its own subscript multiplied by both, so in 3Ca(NO₃)₂ the oxygen contributes 3 × 2 × 3 = 18 beads, and the student sees those three numbers on three counter wheels before the beads drop. Nesting is capped at one level, honest because school formulas do not nest further. The slate locks before Run so the machine scores the student rather than leading them. The twin-pan balance runs the same counter over two formulas and compares element by element. The failure to avoid is a bin that fills instantly; every bead must fall through a chute the student can watch, so the count is witnessed, not asserted.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Formula on the belt | Numeric and text field | Any string to 24 characters using element symbols, digits and one level of round brackets | Ca(OH)₂ | — | Structural: which blocks are loaded onto the belt |
| Preset formula | Dropdown | Ca(OH)₂ / Al₂(SO₄)₃ / Mg(NO₃)₂ / C₆H₁₂O₆ / CuSO₄·5H₂O / NH₄NO₃ / Fe₂O₃ | Ca(OH)₂ | — | Loads a worked formula onto the belt |
| Coefficient | Stepper | 1–6 | 1 | copies | Sets the outer multiplier and how many times the drum re-runs the belt |
| Scan speed | Dial | 0.25×–4× | 1× | blocks/s | How fast the head advances; slow enough at 0.25× to count each bead by eye |
| Prediction first | Toggle | On / Off | On | — | Whether the slate must be filled and locked before Run is available |
| Second formula | Numeric and text field | Any valid string, or empty | Empty | — | Loads the right-hand pan of the balance for a side-by-side comparison |
| Bracket highlight | Toggle | On / Off | On | — | Whether the gearbox animates and the depth flag rises |
| Bin display | Radio | Beads / Numbers only / Both | Both | — | How each element tube reports its count |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The bracket trap | formula=Ca(OH)₂; coefficient=1; prediction first=On | Predict the count for calcium, oxygen and hydrogen. Most people get hydrogen wrong. Run it and say what the 2 outside the bracket multiplied. |
| S2 | Seventeen atoms | formula=Al₂(SO₄)₃; coefficient=1; scan speed=0.25× | Watch the gearbox. How many times does the group run, and how many oxygen beads land in total? |
| S3 | Coefficient on top of a bracket | formula=Mg(NO₃)₂; coefficient stepped 1→2 | The coefficient doubles a formula that already has a bracket. What are the three numbers being multiplied for oxygen? |
| S4 | Two pans | formula=CH₄ with coefficient=1 plus 2O₂; second formula=CO₂ plus 2H₂O | Load both sides of a reaction. Does every element match across the beam? Which lamp lights? |

**Student activities.**
1. Write your predicted counts for Ca(OH)₂ on the slate, lock it, run the belt, and record the machine's counts beside yours.
2. Set the scan speed to 0.25× for Al₂(SO₄)₃ and record the counter wheel readings at the moment the gearbox engages and the moment it releases.
3. Run Mg(NO₃)₂ at coefficient 1 and then at coefficient 2. Record the oxygen count both times and the multiplication that produced each.
4. Load CH₄ with 2O₂ against CO₂ with 2H₂O on the twin-pan balance and record the per-element comparison and the verdict lamp.
5. Choose one formula the machine rejects, record its printed reason, then fix the string and record what changed.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Per-element count | Data table | count | One row per element with its bead column height and odometer reading |
| Total atoms | Counter | count | Sum of every bin, updating bead by bead |
| Multiplier trace | Data table | mixed | For each element: subscript, bracket multiplier, coefficient and the product, exactly as the counter wheels showed |
| Prediction score | Pass-fail badge | — | Per-element right or wrong against the locked slate, with an overall fraction |
| Balance comparison | Data table | count | Left pan against right pan, element by element, with the difference column |
| Balance verdict | Pass-fail badge | — | Green when every element matches across the beam, red naming the first element that does not |
| Printed tally strip | Data table | mixed | Exportable record of every run: formula, counts, total, score |

**What the student should realise.**
Students stop at the subscript they can see, so Ca(OH)₂ becomes one oxygen and two hydrogen, and a coefficient applies to the first element only. Three counter wheels and a bead column filling one bead at a time make the multiplication impossible to skip. The student should be able to say: *"A number outside a bracket multiplies everything inside, and the number in front multiplies the whole formula, so I count by multiplying, not by reading the last digit."*

### A4.5 · Modeling a molecule from its formula

**Experiment name:** The Build Bench: Make It Legal in Three Dimensions  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A modelling bench under a warm overhead lamp, camera low three-quarter against a dark studio backdrop. Along the back rail sit compartmented trays of drilled atom balls in their CPK colours, each labelled with the symbol, its number of holes and the angle between them. Beside them a rack of grey bond struts in three lengths and three thicknesses, and a small drawer of translucent lone-pair caps. Centre bench is a turntable 300 mm across with a magnetic build plate. A formula card sits in a clip at the back left. A validity lamp on a gooseneck arm leans over the build, amber while holes remain unfilled and green when the structure is legal. A protractor rests within reach. Control panel docks right; the checklist panel pins top-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Hydrogen ball | Particle | White sphere, covalent radius 31 pm rendered at 0.62 u, one socket | Yes: place |
| 2 | Carbon ball | Particle | Charcoal sphere, 76 pm rendered at 1.52 u, four sockets at 109.5° tetrahedral | Yes: place |
| 3 | Oxygen ball | Particle | Red sphere, 66 pm rendered at 1.32 u, two sockets at 104.5° | Yes: place |
| 4 | Nitrogen ball | Particle | Blue sphere, 71 pm rendered at 1.42 u, three sockets in a 107° pyramid | Yes: place |
| 5 | Chlorine and sulfur balls | Particle | Chlorine green 99 pm one socket; sulfur yellow 105 pm two sockets at 92° | Yes: place |
| 6 | Bond strut, single | Structure | Grey cylinder 6 mm diameter, length set per pair from real bond lengths: C–H 109 pm, C–C 154 pm, O–H 96 pm, N–H 101 pm, C–O 143 pm, C–Cl 177 pm | Yes: connect |
| 7 | Bond strut, double | Structure | Two parallel 4 mm cylinders 3 mm apart, shorter than the single: C=C 134 pm, C=O 123 pm, O=O 121 pm | Yes: connect |
| 8 | Bond strut, triple | Structure | Three 3 mm cylinders in a triangle, shortest of all: C≡C 120 pm, N≡N 110 pm | Yes: connect |
| 9 | Lone-pair cap | Structure | Translucent grey teardrop clipping into an unbonded lobe on O, N or S; pushes bonded angles inward when shown | Yes: place |
| 10 | Build turntable and plate | Structure | 300 mm magnetic plate on a turntable, free spin with inertia, snaps to 15° detents when the snap toggle is on | Yes: drag |
| 11 | Formula card and clip | Instrument | Printed card on a stand showing the target formula at 36 pt, with a tick appearing beside each element as its count is satisfied | Yes: swap |
| 12 | Validity lamp | Instrument | Gooseneck lamp over the build: amber while any socket is empty, red the instant a valence rule is broken, green when every atom is satisfied and the formula matches | No |
| 13 | Socket highlighter | Overlay | Pulsing halo on every unfilled socket in the current build, with a live count of how many remain | No |
| 14 | Bond angle protractor | UI-Probe | Transparent 120 mm protractor the student drags onto any three connected atoms to read the angle between them to 0.1° | Yes: drag |
| 15 | Rejection tray and reason card | Instrument | Side tray that any illegal atom springs back into, with a printed card such as "carbon already has four bonds" or "oxygen cannot take a third" | No |
| 16 | Reference shelf | Structure | Twelve completed models on a back shelf the student can lift down and inspect but not modify, each drawn in whichever representation the panel is set to | Yes: drag |

**How it works — the model.**
Each atom ball carries a socket count equal to its ordinary valence, and each socket a fixed direction from the real geometry: four at 109.5° on carbon, two at 104.5° on oxygen, three in a 107° pyramid on nitrogen. Bonds are made socket to socket, so an impossible structure is not marked wrong afterwards, it will not assemble; a fifth hydrogen offered to a full carbon springs back into the rejection tray with a printed reason. A double bond consumes two sockets on each atom and installs the shorter double strut, which is why CO₂ can only be completed as O=C=O and comes out straight at 180°. The card is satisfied only when the atom counts and every socket match. Bond lengths and angles come from a measured table, so the protractor reads real values. The failure to avoid is a flat, angle-free model that looks correct on screen; snapping and lengths must make the three-dimensional shape unavoidable.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Target formula | Dropdown | H₂O / CH₄ / NH₃ / CO₂ / HCl / H₂S / C₂H₆ / C₂H₄ / C₂H₂ / CH₃Cl / O₂ / N₂ | H₂O | — | Structural: which formula card is clipped up and which atom trays are unlocked |
| Atom tray | Drag-handle | Any ball from H, C, N, O, S, Cl trays | — | count | Structural: places one atom of that element onto the plate |
| Bond order tool | Radio | Single / Double / Triple | Single | — | Which strut is fitted on the next connection, and how many sockets it consumes |
| Representation | Dropdown | Ball-and-stick / Space-filling / Skeletal | Ball-and-stick | — | How the finished molecule is drawn; space-filling uses true relative radii |
| Snap to socket angle | Toggle | On / Off | On | — | Whether bonds snap to the real geometry or hang loose for comparison |
| Lone pairs | Toggle | On / Off | Off | — | Shows unbonded lobes on O, N and S and narrows the bonded angle accordingly |
| Turntable spin | Dial | 0–30 | 6 | rev/min | Auto-rotation speed for inspecting the model from all sides |
| Validate | Stepper | Check now / Check continuously | Check continuously | — | Whether the lamp updates live or only on demand |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Build water | target=H₂O; bond order=Single; lone pairs=Off then On | Two hydrogens and one oxygen. Measure the H–O–H angle with the protractor. Why is it not 180°? |
| S2 | The one that will not take five | target=CH₄; then try to add a fifth hydrogen | Build methane, then offer carbon one more hydrogen. What does the rejection card say, and what does that tell you about carbon? |
| S3 | Only doubles will do | target=CO₂; bond order=Single first, then Double | Try to finish carbon dioxide with single bonds and record how many sockets are left empty. Now switch to doubles. What shape do you get? |
| S4 | Two carbons, three ways | target=C₂H₆ then C₂H₄ then C₂H₂ | Same two elements each time. Record the carbon–carbon bond length and the H–C–H angle for all three and describe how the shape changes. |

**Student activities.**
1. Build H₂O from the trays, then drag the protractor onto the three atoms and record the H–O–H angle to 0.1°.
2. Build CH₄ and try to attach a fifth hydrogen. Record the rejection reason and the number of sockets carbon actually has.
3. Attempt CO₂ using only single bonds, record how many sockets remain unfilled, then rebuild with double bonds and record the O=C=O angle.
4. Build C₂H₆, C₂H₄ and C₂H₂ in turn and record the C–C bond length and the validity lamp state for each.
5. Switch the finished CH₄ to space-filling and record which atoms are hidden from view, then explain why the ball-and-stick version is still useful.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Unfilled sockets | Counter | count | How many bonding positions remain empty across the whole build |
| Formula checklist | Data table | count | Required against placed, element by element, with a tick per satisfied row |
| Bond angle | Live numeric | ° | Protractor reading for any three connected atoms, 0.1° |
| Bond length table | Data table | pm | Every bond in the build with its atom pair, order and length |
| Structure verdict | Pass-fail badge | — | Green only when counts match and no socket is empty; red names the rule broken |
| Rejection log | Data table | mixed | Every attempted illegal bond with the reason card text, exportable |
| Build time | Timer | s | Time from first atom placed to a green lamp |

**What the student should realise.**
Students picture a molecule as the flat string of letters they wrote, so they assume atoms join in any number and arrangement. A bench where carbon refuses a fifth bond, CO₂ needs doubles and water measures 104.5° gives them an object with shape and rules. The student should be able to say: *"The formula tells me which atoms and how many, but each atom makes a set number of bonds at set angles, so the molecule has one shape."*

## A5 · Modeling extended structures · MS-PS1-1

### A5.1 · Ball-and-stick models

**Experiment name:** Sticks and Spheres: Build by the Rules  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A dark indigo build chamber with no horizon, lit by one soft overhead key and a cool blue rim so every sphere reads glossy, rounded and clearly separate from its neighbours. Centre stage a brushed-glass turntable disc carries whatever is being built and idles at 6° per second until the student grabs it. Along the bottom edge sits an open tray of bins: chalk-white hydrogen, charcoal carbon, red oxygen, blue nitrogen, green chlorine, yellow sulfur, each bin stencilled with its element symbol and its covalent radius in picometres. Unused bonding directions glow as small amber stubs that pulse once a second, so the model always advertises where it is unfinished. The control panel docks right; a protractor and a picometre ruler hang on a tool rail at the left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Hydrogen atom | Structure | Sphere, drawn radius 22 pm (0.7 × covalent radius 31 pm), CPK white with a 2 pm grey rim so it separates from the background; exactly one valence socket | Yes: place |
| 2 | Carbon atom | Structure | Sphere, drawn radius 53 pm (covalent 76 pm), CPK charcoal, slight specular sheen; four valence sockets fixed at 109.5° to one another | Yes: place |
| 3 | Oxygen atom | Structure | Sphere, drawn radius 46 pm (covalent 66 pm), CPK red; two valence sockets at 104.5°, two lone-pair anchor points | Yes: place |
| 4 | Nitrogen atom | Structure | Sphere, drawn radius 50 pm (covalent 71 pm), CPK blue; three sockets in a 107° pyramid, one lone-pair anchor at the apex | Yes: place |
| 5 | Chlorine atom | Structure | Sphere, drawn radius 71 pm (covalent 102 pm), CPK green; one socket, three lone-pair anchors | Yes: place |
| 6 | Sulfur atom | Structure | Sphere, drawn radius 74 pm (covalent 105 pm), CPK yellow; two sockets at 92° | Yes: place |
| 7 | Valence socket stub | Overlay | 12 pm amber cone projecting along each unused bonding direction, 1 Hz pulse; vanishes the instant that socket is filled | No |
| 8 | Single bond cylinder | Structure | Grey matte cylinder, radius 12 pm, spanning nucleus to nucleus, length locked to the bond-length table; hover label reads "one shared pair" | Yes: swap |
| 9 | Multiple bond cylinders | Structure | Double = two parallel cylinders radius 9 pm offset 22 pm; triple = three cylinders offset 26 pm on a triangle; both shorten the bond to its tabulated value | Yes: swap |
| 10 | Lone pair lobes | Overlay | Translucent pale-violet teardrops 40 pm long on oxygen, nitrogen, chlorine and sulfur; off by default | No |
| 11 | Turntable pedestal | Environment | 300 pm brushed-glass disc with a faint radial graticule every 30°, sitting on a matte black plinth; trackball drag spins the whole model | Yes: drag |
| 12 | Atom tray bins | Structure | Six open-topped bins along the lower frame, each holding a slow-tumbling stack of its element; dragging out of a bin spawns a fresh atom | Yes: swap |
| 13 | Bond angle protractor | Instrument | Click three atoms; a translucent arc fills between the two bonds and prints the angle to 0.1° | Yes: drag |
| 14 | Picometre ruler | Instrument | Click two atoms; a dimension line with end ticks prints the internuclear distance in pm | Yes: drag |
| 15 | Atom inventory panel | Overlay | Live tally of every element on the turntable, the assembled formula string, and the target formula beside it with a matching tick or cross per element | No |
| 16 | Valence violation flash | Overlay | On a refused bond the offending atom rings red for 0.4 s and a caption names the rule broken, e.g. "carbon already has four bonds" | No |

**How it works — the model.**
Every atom carries a fixed valence (H 1, Cl 1, O 2, S 2, N 3, C 4) and a fixed socket geometry drawn from a small lookup table: 109.5° tetrahedral for four bonds, 120° trigonal for three, 107° pyramidal on ammonia's nitrogen, 104.5° bent on water's oxygen, 180° linear on a doubly bonded carbon. When a dragged atom comes within 120 pm of a free socket the engine snaps it so the internuclear distance equals the tabulated bond length for that pair and bond order (C–H 109, C–C 154, C=C 134, C–O 143, C=O 122, O–H 96, N–H 101, H–Cl 127 pm), then re-orients any remaining sockets. A filled socket is removed, so a fifth bond to carbon is geometrically impossible rather than merely discouraged. Spheres draw at 0.7 × covalent radius, keeping relative sizes true while leaving stick visible. The failure to avoid is the stick reading as a rod that props atoms apart: every bond hover prints "one shared pair of electrons", never "a connector".

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Molecule template | Dropdown | Blank bench / Water H₂O / Methane CH₄ / Ammonia NH₃ / Carbon dioxide CO₂ / Hydrogen chloride HCl / Oxygen O₂ / Ethanol C₂H₅OH | Blank bench | — | Loads a target formula into the inventory panel and stocks the tray to match |
| Atom tray stock | Multi-select | H / C / O / N / Cl / S | H, C, O | — | Which element bins exist to drag from; removing an element removes that build option |
| Bond order | Radio | Single / Double / Triple | Single | — | The order of the next bond made, and therefore its length and cylinder count |
| Ball scale | Slider | 0.30–1.00 | 0.70 | × covalent radius | Sphere size relative to true covalent radius; at 1.00 the sticks nearly disappear |
| Stick radius | Slider | 6–24 | 12 | pm | Thickness of every bond cylinder |
| Show lone pairs | Toggle | On / Off | Off | — | Draws the non-bonding electron lobes on O, N, Cl and S |
| Auto-snap geometry | Toggle | On / Off | On | — | Whether a new bond snaps to the tabulated angle or stays at the angle it was dropped |
| Valence lock | Toggle | Enforced / Warn only | Enforced | — | Whether an over-bond is refused outright or allowed and flagged red |
| Model rotation | Drag-handle | 0–360 about two axes | 0, 0 | ° | Trackball view angle; the turntable idle spin pauses while dragging |
| Build replay | Timeline scrubber | 0–100 | 100 | % of build history | Steps back through every atom and bond added, in order |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Water from scratch | Molecule template=Blank bench; Atom tray stock=H, O; Bond order=Single; Valence lock=Enforced | Build a particle with one oxygen and two hydrogens. What does the protractor read for H–O–H, and why is it not 180°? |
| S2 | The fifth hydrogen | Molecule template=Methane CH₄; Atom tray stock=H, C; Valence lock=Enforced; Auto-snap geometry=On | Try to attach a fifth hydrogen to the carbon. What does the bench do, and what number about carbon does that prove? |
| S3 | Two sticks, one bond | Molecule template=Carbon dioxide CO₂; Bond order=Double; Show lone pairs=On | Build O=C=O. Measure the O–C–O angle and the C=O length, then compare that length with the C–O single bond in ethanol. |
| S4 | A longer skeleton | Molecule template=Ethanol C₂H₅OH; Atom tray stock=H, C, O; Build replay=0 then 100 | Nine atoms, eight bonds. Which atom carries the one angle that is not 109.5°, and what is that angle? |

**Student activities.**
1. Drag one oxygen and two hydrogens onto the turntable and bond them. Record the H–O–H angle from the protractor and both O–H lengths from the ruler.
2. Build methane, then attempt a fifth C–H bond and record exactly what the bench refuses and what caption it prints.
3. Set Ball scale to 0.30, then 0.70, then 1.00 on the same methane. Record at which value you can no longer see the sticks, and write one sentence on why the small setting is a choice rather than the truth.
4. Rebuild carbon dioxide with Bond order=Single first, then with Double. Record both C–O lengths and state which one the atom inventory accepts as complete.
5. Build ethanol, then scrub Build replay back to 50% and list, in order, the first four bonds you made.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom inventory | Data table | count | Live count per element with the assembled formula beside the target formula, updated on every place or delete |
| Bond list | Data table | pm | One row per bond: the two atoms, the order, and the internuclear length |
| Bond angle | Live numeric | ° | Protractor reading to 0.1° for the three currently selected atoms |
| Free sockets remaining | Counter | count | Total unfilled valence positions across the whole model |
| Valence check | Pass-fail badge | — | Green only when every atom has zero free sockets and the formula matches the target |
| Build step count | Counter | steps | Number of place, bond and delete actions used to reach the finished model |
| Model card export | Data table | mixed | CSV of formula, every bond length and every bond angle, plus a rendered still of the model |

**What the student should realise.**
Students believe a ball-and-stick model is a photograph of a molecule and that the sticks are physical rods holding the atoms apart. Building one under enforced valence makes that untenable: the sticks are counted, not measured, each one standing for a shared pair, and the angles are fixed by the atoms rather than by the modeller. The student should be able to say: *"The balls say which atoms and the sticks say which pairs are shared, and I shrank the balls on purpose so the bonds would show."*

### A5.2 · Space-filling models

**Experiment name:** The Empty Space Is a Lie  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Manipulate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A bright white product-photography cyclorama: seamless curved floor and wall, one large soft-box from the upper left, a weaker fill from the right, so the molecule hovering at centre casts exactly one soft shadow onto the floor card. That shadow matters, because it is the model's true footprint and it grows as the model swells. Behind the molecule stands a brushed-steel filter plate with a circular iris pore, its diameter printed in picometres on the rim. A cyan-edged clip plane can be dragged straight through the model to reveal the cross-section, where the little grey bond cylinders sit buried inside merged shells. The control panel docks right, with the morph slider three times the width of any other control.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Hydrogen shell | Structure | Sphere interpolating from 22 pm to its van der Waals radius 120 pm, CPK white, soft fresnel edge so overlaps stay readable | No |
| 2 | Carbon shell | Structure | Sphere interpolating 53 → 170 pm, CPK charcoal; at full size it swallows every attached hydrogen nucleus | No |
| 3 | Oxygen shell | Structure | Sphere interpolating 46 → 152 pm, CPK red | No |
| 4 | Nitrogen shell | Structure | Sphere interpolating 50 → 155 pm, CPK blue | No |
| 5 | Chlorine shell | Structure | Sphere interpolating 71 → 175 pm, CPK green; the largest shell in the set | No |
| 6 | Inner core marker | Overlay | The original ball-and-stick sphere, kept at 0.7 × covalent radius in bright cyan, drawn only where the clip plane cuts | No |
| 7 | Bond cylinder | Structure | Grey cylinder radius 12 pm at the true bond length; progressively hidden inside the shells and gone from outside view above about 55% morph | No |
| 8 | Morph controller | Instrument | Invisible driver setting every shell radius to r = 0.7·r_cov + t(r_vdW − 0.7·r_cov) with t from the slider; runs at 60 Hz so the swell is continuous | No |
| 9 | Filter plate and iris | Structure | 400 pm thick brushed-steel plate spanning the frame, central circular aperture with animated iris blades, diameter label on the rim | Yes: resize |
| 10 | Molecule carriage | Actor | Invisible sled advancing the model toward the pore at 20 pm per frame in the chosen orientation; halts and flashes on first shell contact | Yes: drag |
| 11 | Silhouette projector | Instrument | Orthographic shadow cast onto the floor card, its outline traced in thin red and its area integrated in pm² | No |
| 12 | Clip plane | UI-Probe | Draggable plane with a cyan cap shader; everything in front of it is culled, so the interior is exposed | Yes: drag |
| 13 | Occupancy dart probe | Instrument | Fires 20 000 uniformly random points into the model's bounding box, counts the fraction landing inside any shell, redraws as a fine speckle | No |
| 14 | Caliper | Instrument | Two sliding jaws that close onto the model along the current view axis and print the widest span in pm | Yes: drag |
| 15 | Water shell ghosts | Particle | 0–40 water molecules at true van der Waals size, translucent pale cyan, drifting in and packing against the model without ever interpenetrating it | Yes: place |
| 16 | Representation label card | Overlay | A printed card on the cyclorama floor that reads BALL-AND-STICK, TRANSITIONAL or SPACE-FILLING and names what the current view hides | No |

**How it works — the model.**
One number drives everything. The morph value t rescales every atom's radius linearly between its ball-and-stick size and its true van der Waals radius. At t = 0 the scene is exactly the A5.1 model; at t = 1 neighbouring shells overlap heavily, because a bond is far shorter than the sum of the two van der Waals radii — a C–H bond is 109 pm while the two shells sum to 290 pm. That overlap is the whole reason bonds disappear: they are not deleted, they are buried, which the clip plane proves. The fit test uses actual shell geometry for collision, so a model that strolls through a pore at t = 0 jams at t = 1. Methane measures about 220 pm across in ball-and-stick and about 418 pm space-filling, close to the 380 pm kinetic diameter engineers use when sizing gas filters, so the test is not a toy. The failure to avoid is presenting shells as hard rind: the water ghosts stop at contact because repulsion rises, and the caption says so.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Molecule | Dropdown | Water / Methane / Ammonia / Carbon dioxide / Ethanol / Chlorine Cl₂ / Glucose C₆H₁₂O₆ | Methane | — | Which model sits on the plinth; the atom set and all radii change with it |
| Representation morph | Slider | 0–100 | 0 | % toward van der Waals | Every shell radius at once; 0 is ball-and-stick, 100 is space-filling |
| Pore diameter | Slider | 100–800 | 400 | pm | Iris aperture in the filter plate, and therefore what can pass |
| Approach orientation | Dial | 0–360 | 0 | ° | Rotation of the model about the push axis before the carriage advances |
| Clip plane position | Drag-handle | −400 to 400 | 400 | pm | Where the cutaway slices; at 400 pm it sits outside the model and cuts nothing |
| Show bond cylinders | Toggle | On / Off | On | — | Whether sticks are drawn beneath the shells at all |
| Water shell ghosts | Stepper | 0–40 | 0 | molecules | Adds true-size water around the model to test how close anything can get |
| Second molecule | Dropdown | None / Water / Methane / Carbon dioxide | None | — | Mounts a second model on a twin plinth so two morphs run side by side |
| Occupancy probe | Toggle | On / Off | Off | — | Fires the dart cloud and prints the percentage of the bounding box occupied |
| Silhouette measure | Toggle | On / Off | On | — | Traces and integrates the floor shadow area |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The vanishing sticks | Molecule=Methane; Show bond cylinders=On; Representation morph=0 then 100; Clip plane position=0 | At what morph percentage does the last stick disappear from outside view, and where does the clip plane show it has gone? |
| S2 | The filter that lies | Molecule=Ethanol; Pore diameter=400; Representation morph=0 then 100; Approach orientation=0 | Ball-and-stick ethanol strolls through a 400 pm pore. Does space-filling ethanol? Find the smallest pore that still lets it through. |
| S3 | Two shadows, one molecule | Molecule=Water; Silhouette measure=On; Representation morph=0 then 100 | Measure the shadow area at each end of the morph. By what factor does the footprint grow, and did any atom get added? |
| S4 | Nothing can get closer | Molecule=Methane; Representation morph=100; Water shell ghosts=40; Occupancy probe=On | Push water against the methane. How close does a water centre get to the carbon centre, and what percentage of the box is actually occupied? |

**Student activities.**
1. Set Representation morph to 0 and record the caliper width. Raise it in five steps to 100, recording the width each time, and plot width against morph.
2. Run the carriage at Pore diameter=400 with morph at 0, then at 100. Record pass or blocked for each, then find the smallest pore each representation clears.
3. Drag the clip plane to 0 pm at morph 100 and describe, in one sentence, what is visible in the cut face that is invisible from outside.
4. Turn on the occupancy probe at morph 0 and again at morph 100. Record both percentages and state which one describes real matter.
5. Place 40 water ghosts and record the closest centre-to-centre distance any water reaches. Compare it with the sum of the two van der Waals radii.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Caliper width | Live numeric | pm | Widest span along the current view axis, updating continuously as morph and orientation change |
| Width vs morph | Line graph | pm vs % | One trace per loaded molecule, built live as the slider moves |
| Silhouette area | Live numeric | pm² | Integrated area of the traced floor shadow |
| Occupancy fraction | Live numeric | % | Dart-probe estimate; typically under 10% at morph 0 and 40–60% at morph 100 |
| Fit test | Pass-fail badge | — | Green if the carriage clears the pore at the current settings, red on first shell contact |
| Smallest pore that passes | Data table | pm | One row per molecule × representation, filled in as the student searches |
| Radius table | Data table | pm | Per element: covalent radius, currently drawn radius, van der Waals radius |

**What the student should realise.**
Students look at a ball-and-stick model and conclude that molecules are mostly empty space with thin rods between small beads. Morphing the identical molecule to true van der Waals radii makes that untenable: nothing was added, yet the footprint roughly doubles, the sticks vanish inside the shells and a pore that waved the model through now stops it dead. The student should be able to say: *"Ball-and-stick shrinks the atoms so I can see the bonds; space-filling shows how much room the molecule really takes up."*

### A5.3 · When there is no single molecule

**Experiment name:** Find Me One Molecule  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + Field/vector  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A darkened mineral display case. On a black slate plinth sits a single crystal block lit from two low sides so its cleaved faces flash, with faint volumetric dust hanging in the beams. The block is shown at two scales at once: a small photographic thumbnail top-left of the real material — a salt cube from a South San Francisco Bay evaporation pond, a snapped pencil lead, a quartz point from Sierra granite, a bright copper wire end — and, filling the stage, that same material magnified until individual ions and atoms are countable spheres. A glowing cyan wireframe outlines one unit cell with its edge length printed on it. A steel cleaving chisel hovers left, and the cursor carries a translucent lasso sphere. Control panel right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sodium ion Na⁺ | Structure | Sphere radius 102 pm, CPK violet, faint blue positive glyph on hover; instanced on alternating lattice sites, spacing 282 pm to its neighbours | Yes: place |
| 2 | Chloride ion Cl⁻ | Structure | Sphere radius 181 pm, CPK green, faint negative glyph on hover; clearly the larger of the pair, which is the visual point | Yes: place |
| 3 | Diamond carbon atom | Structure | Sphere radius 77 pm, charcoal; four bonds at 109.5°, C–C 154 pm, cubic cell edge 357 pm | No |
| 4 | Graphite carbon atom | Structure | Same charcoal sphere; three in-plane bonds at 120°, C–C 142 pm, sheets stacked 335 pm apart in an ABAB pattern, cell a = 246 pm, c = 671 pm | No |
| 5 | Silicon atom | Structure | Sphere radius 111 pm, CPK beige-tan; four bonds to bridging oxygens, Si–O 161 pm, cell 491 × 540 pm | No |
| 6 | Bridging oxygen atom | Structure | Sphere radius 66 pm, CPK red; bonded to exactly two silicons at an Si–O–Si angle of 144°, so the tetrahedra share corners | No |
| 7 | Copper atom core | Structure | Sphere radius 128 pm, CPK orange-brown, metallic shader; face-centred cubic, cell edge 361 pm, nearest neighbour 256 pm, twelve touching neighbours | No |
| 8 | Delocalised electron fog | Field | 2 000 translucent blue point sprites drifting between the copper cores with random walk; under an applied field the random walk gains a steady drift component | No |
| 9 | Covalent bond cylinder | Structure | Grey cylinder radius 12 pm, used only in diamond, graphite and quartz; hover prints the shared pair and the length | No |
| 10 | Ionic contact shading | Overlay | For sodium chloride, a soft violet-to-green gradient in the gap between neighbours instead of a stick, because there is no shared pair to draw | No |
| 11 | Unit cell wireframe | Overlay | Glowing cyan box around the smallest repeating unit, edge lengths labelled, repeatable as a faint ghost across the whole block | No |
| 12 | Growth controller | Instrument | Extends the block by whole unit cells along x, y and z; new atoms fade in at the correct sites with the correct alternation | Yes: resize |
| 13 | Cleaving chisel | Actor | Draggable steel blade that sets down on a chosen plane; on strike it computes bonds or ionic contacts crossing that plane per unit area and either splits the block cleanly or bounces | Yes: drag |
| 14 | Molecule lasso | UI-Probe | Translucent selection sphere 200–2000 pm across; on release it counts every bond or ionic contact crossing its surface and prints the tally | Yes: resize |
| 15 | Layer slide handle | Actor | Graphite only: a grip on the top sheet that drags it laterally over the sheet below, with a friction readout and no bond breaking | Yes: drag |
| 16 | Species inventory panel | Overlay | Live count of each element or ion in the block, their simplest whole-number ratio, and the empirical formula that ratio gives | No |

**How it works — the model.**
Nothing in this scene is built from molecule templates. Each structure is generated by tiling one unit cell, and every bond or ionic contact is created afterwards by a proximity rule, so connectivity is a property of the pattern rather than of any unit. The lasso is the argument: on release the engine counts links crossing the selection surface, and for any lattice that dangling count is greater than zero for every selection smaller than the whole block. Growing the block multiplies the atom counts but never changes the ratio, which stays 1:1 for sodium chloride and 1:2 for silicon to oxygen, so the formula is exposed as a ratio and not a particle count. Cleaving reports links broken per square nanometre, which is why graphite parts between sheets at low force while diamond will not part at all. Copper's electron fog belongs to no core; an applied voltage gives it net drift, and that drift is conduction.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Substance | Dropdown | Sodium chloride / Diamond / Graphite / Quartz SiO₂ / Copper | Sodium chloride | — | Replaces the entire lattice, its unit cell, its bonding and its thumbnail photograph |
| Block size | Stepper | 1–6 | 3 | unit cells per edge | How many repeats are grown; changes every atom count but no ratio |
| Cleave plane | Radio | Cube face {100} / Diagonal {110} / Octahedral {111} / Between layers | Cube face {100} | — | Which plane the chisel sets down on |
| Chisel force | Slider | 0–500 | 150 | N (virtual) | Whether the strike splits the block, chips it or bounces off |
| Lasso size | Drag-handle | 200–2000 | 600 | pm | Diameter of the region the student tries to isolate as a molecule |
| Explode view | Slider | 0–200 | 0 | % separation | Pulls every atom outward along its bond directions to expose coordination |
| Electron fog | Toggle | On / Off | On | — | Copper only: draws or hides the delocalised electron sprites |
| Applied voltage | Slider | 0–5 | 0 | V across the block | Adds a drift component to the electron fog and to any mobile ion |
| Layer slide | Drag-handle | 0–500 | 0 | pm | Graphite only: offsets the top sheet over the one beneath it |
| Draw ionic sticks | Toggle | On / Off | Off | — | Deliberately draws sticks between Na⁺ and Cl⁻; a red caption warns that this invents a molecule that does not exist |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Bay salt | Substance=Sodium chloride; Block size=3; Lasso size=600; Draw ionic sticks=Off | Lasso the smallest group you would call one molecule. How many ionic contacts did you cut? Grow the block to 6 and try again. |
| S2 | Same element, two crystals | Substance=Diamond then Graphite; Chisel force=150; Cleave plane=Between layers; Layer slide=0 then 400 | Both are pure carbon. Which one cleaves at 150 N, which refuses, and what is different about what you had to break? |
| S3 | Sierra quartz | Substance=Quartz SiO₂; Block size=2 then 5; Explode view=60 | Count the silicon and the oxygen atoms at both block sizes. What is the ratio each time, and what does SiO₂ therefore mean? |
| S4 | The metal that carries current | Substance=Copper; Electron fog=On; Applied voltage=0 then 5; Explode view=0 | When the voltage rises, what moves: the copper cores, the fog, or both? Record the drift readout for each. |

**Student activities.**
1. Set Substance to Sodium chloride and Block size to 2. Lasso one Na⁺ with its nearest Cl⁻ and record the dangling contact count. Repeat for a lasso of 8 ions and one of 27 ions.
2. Grow the block from 1 to 6 unit cells, recording the sodium count, the chloride count and their ratio at each step in a five-row table.
3. Strike graphite with the chisel at 50 N Between layers, then strike diamond at 500 N on {111}. Record which split and the links-broken-per-nm² reading for each.
4. Switch to Copper, set Applied voltage to 5 V, and record the electron drift speed. Then set Electron fog to Off and describe what information the picture loses.
5. Turn Draw ionic sticks On for sodium chloride, read the warning, and write one sentence explaining why the sticks are a lie about this substance.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species inventory | Data table | count | Atoms or ions of each type in the current block, their ratio, and the empirical formula |
| Dangling link count | Live numeric | count | Bonds or ionic contacts cut by the current lasso, updated as the lasso is resized or moved |
| Molecule found? | Pass-fail badge | — | Green only for a selection with zero cut links that is smaller than the whole block; for these five substances it never turns green |
| Links broken per cleave | Live numeric | links/nm² | Computed for the chosen plane at the moment the chisel strikes |
| Coordination number | Live numeric | count | Nearest neighbours of whichever atom is clicked: 6 for both ions in salt, 4 in diamond, 3 in a graphite sheet, 12 in copper |
| Electron drift speed | Live numeric | pm/s | Mean net velocity of the fog sprites under the applied voltage; zero at 0 V |
| Unit cell dimensions | Data table | pm | Edge lengths and key bond lengths and angles for the loaded substance |
| Layer friction | Live numeric | — | Relative resistance felt while sliding a graphite sheet, compared with sliding a diamond plane |

**What the student should realise.**
Students assume every substance is made of molecules, and that NaCl means one sodium joined to one chlorine. The lasso makes that impossible to hold: every attempt to isolate a molecule cuts bonds or contacts, and the badge never goes green, while the ratio stays 1:1 whether the block holds 8 ions or 1728. The student should be able to say: *"In salt, diamond, quartz and copper there is no single molecule — the formula only tells me the ratio in a pattern that keeps repeating."*

### A5.4 · Comparing molecular and lattice structures

**Experiment name:** Two White Crystals, Four Tests  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Fluid/thermal + Molecular  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A twin test bench, mirrored left and right down a central brass seam, so every instrument exists twice and every reading arrives as a pair. Each half carries a 40 mm ceramic sample dish under a glass hood, a coiled heating element above it whose glow ramps from black through dull red to white, a digital thermometer, a 50 mL beaker on a magnetic stirrer, a two-probe conductivity circuit with a small lamp, and a scratch stylus on a swing arm. Floating behind each dish is a magnified inset of that substance's structure, forty particles across, which animates the moment heating begins. The palette is cool laboratory grey and glass; the only saturated colour on screen is the conductivity lamp. The control panel spans the bottom edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample dish and hood (×2) | Structure | 40 mm white ceramic dish inside a borosilicate hood with a vent; hood fogs on sublimation and beads on condensation | Yes: swap |
| 2 | Crystal grain heap (×2) | Actor | 60–120 instanced grains with the correct habit per substance: salt cubes, sucrose monoclinic prisms, iodine grey-violet plates, quartz hexagonal points, copper granules, diamond octahedra, wax shavings | Yes: swap |
| 3 | Structure inset (×2) | Overlay | Live 40-particle-wide model of the loaded substance, floating behind the dish; molecular substances show discrete units with visible gaps between them, lattices show unbroken connectivity to the frame edge | No |
| 4 | Intermolecular force links | Overlay | Faint dashed lines drawn only between whole molecules in the inset; they stretch, thin and snap first as temperature climbs | No |
| 5 | Bond links | Structure | Solid grey cylinders inside molecules and throughout lattices; they survive long after every dashed link has snapped | No |
| 6 | Heating coil and thermal field | Actor | 40 mm nichrome spiral over each dish, glow ramp keyed to setpoint; an invisible temperature field applies the same setpoint to both stages simultaneously | No |
| 7 | Digital thermometer (×2) | Instrument | Stainless probe into the heap, four-digit display to 1 °C, range 20–3600 °C | Yes: drag |
| 8 | Melt detector (×2) | Instrument | Invisible watcher on the inset; latches the temperature at which long-range order is lost, and flags sublimation when units leave the solid without a liquid stage | No |
| 9 | Conductivity circuit (×2) | Instrument | 6 V cell, 3 V lamp, milliammeter and two graphite probes 10 mm apart on a lifting arm | Yes: place |
| 10 | Mobile charge carriers | Particle | Drawn in the inset only when the state allows: ions moving in a melt or solution, electrons drifting in a metal, nothing at all in a molecular solid, melt or solution | No |
| 11 | Solvent beaker and stirrer (×2) | Actor | 50 mL beaker with 25 mL of water or hexane, PTFE follower turning at 300 rpm, a scale bar and a graduated side | Yes: swap |
| 12 | Dissolution particles | Particle | Units leaving the crystal face: ions detach separately and pick up six-molecule water shells, molecular solids leave as intact whole molecules, lattices shed nothing at all | No |
| 13 | Scratch stylus and swing arm (×2) | Actor | Counterweighted arm lowering a swappable indenter tip onto a flat grain at 1 N; drags 5 mm across the face at 2 mm/s | Yes: swap |
| 14 | Scratch groove decal | Overlay | A score line rendered onto the scratched face when the indenter is harder, or a bright skid mark on the indenter when it is softer; groove depth logged in µm | No |
| 15 | Prediction card slot | UI-Probe | A card for each test that must be filled with a written prediction before the Run button unlocks; the card flips to show the result beside the prediction | Yes: drag |
| 16 | Comparison scorecard | Overlay | Two-column table accumulating every measured value, with a claim builder underneath that links each claim to the rows selected as evidence | No |

**How it works — the model.**
A lookup dataset of real values drives the four rigs, and one structural rule explains all four. Melting point is set by what must be broken before particles can move past one another. A molecular solid needs only its weak intermolecular forces broken, so it melts low and the inset shows whole molecules floating away intact: ice 0 °C, paraffin wax about 55 °C, iodine 114 °C, sucrose 186 °C, solid carbon dioxide subliming at −78 °C. A lattice needs real bonds broken and melts high: copper 1085 °C, quartz 1710 °C, sodium chloride 801 °C, magnesium oxide 2852 °C, diamond near 3550 °C. Conduction needs mobile charge: none in any molecular substance, none in solid ionic where the ions are locked, current once ionic is molten or dissolved, and always current in a metal. Solubility follows like dissolves like. Hardness is decided by comparing Mohs values, indenter against sample.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Left sample | Dropdown | Sucrose / Iodine / Ice / Paraffin wax / Solid carbon dioxide / Sodium chloride / Magnesium oxide / Quartz / Diamond / Copper | Sucrose | — | Replaces the grain heap, the structure inset and the whole left dataset |
| Right sample | Dropdown | Sucrose / Iodine / Ice / Paraffin wax / Solid carbon dioxide / Sodium chloride / Magnesium oxide / Quartz / Diamond / Copper | Sodium chloride | — | The same for the right stage, so any two structures can be paired |
| Furnace temperature | Slider | 20–3600 | 20 | °C | Setpoint applied identically to both stages; drives the coil glow and the inset animation |
| Heating rate | Slider | 1–200 | 20 | °C/s | How fast the setpoint is approached, and therefore how sharp the melting plateau looks |
| Conductivity probe state | Radio | Solid / Molten / Dissolved in water | Solid | — | Where the probes sit, and therefore whether any charge carrier is free to move |
| Solvent | Dropdown | Water / Hexane | Water | — | What the 25 mL in each beaker is, and which solutes dissolve |
| Stirring | Toggle | On / Off | On | — | Dissolution rate and how fast the solubility bar fills |
| Scratch indenter | Dropdown | Fingernail 2.5 / Copper coin 3.5 / Steel nail 5.5 / Quartz point 7 / Corundum 9 / Diamond 10 | Steel nail 5.5 | Mohs | Which tip attempts the scratch on both samples |
| Structure inset | Toggle | On / Off | On | — | Shows or hides the magnified model and which class of link is currently snapping |
| Prediction lock | Toggle | On / Off | On | — | Whether a written prediction must be entered before any test will run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two white crystals from a California kitchen | Left sample=Sucrose; Right sample=Sodium chloride; Furnace temperature=20→900; Conductivity probe state=Solid then Dissolved in water; Solvent=Water | Both are white crystals from the same cupboard, one from Central Valley sugar beet and one from Bay salt ponds. Which melts at 186 °C and which at 801 °C, and which conducts once dissolved? |
| S2 | Two giants, one conductor | Left sample=Diamond; Right sample=Copper; Scratch indenter=Corundum 9; Conductivity probe state=Solid; Furnace temperature=20→3600 | Both are giant structures with no molecules. Why does only one conduct as a solid, and which one does corundum scratch? |
| S3 | The soft one that is not a lattice | Left sample=Iodine; Right sample=Quartz; Solvent=Hexane; Furnace temperature=20→1800; Structure inset=On | One dissolves in hexane and melts before 120 °C. In each inset, what exactly is leaving the solid: whole particles, or pieces torn out of a pattern? |
| S4 | Small light atoms, opposite answers | Left sample=Ice; Right sample=Magnesium oxide; Furnace temperature=20→3000; Prediction lock=On | Both are built from small light atoms, yet one melts at 0 °C and one at 2852 °C. Predict the difference first, then name what is broken in each case. |

**Student activities.**
1. Set the two samples, write a prediction on each card, then ramp Furnace temperature from 20 °C and record both melting temperatures from the thermometers.
2. Watch both structure insets during melting and record, for each sample, whether dashed links or solid links snapped first.
3. Run the conductivity test three times per sample at Solid, Molten and Dissolved in water. Record the current in mA for all six readings in one table.
4. Swap the Solvent from Water to Hexane and repeat the dissolving test on both samples. Record which combinations dissolve and which do not.
5. Scratch both samples with three indenters in rising hardness and record, for each, the softest indenter that leaves a groove.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Melting or sublimation point | Live numeric | °C | Latched per sample the moment long-range order is lost; labelled "sublimes" where there is no liquid stage |
| Temperature vs time | Line graph | °C vs s | Both samples on shared axes, each showing a plateau while its links are breaking |
| Conductivity | Live numeric | mA | Per sample and per probe state, with the lamp lighting above 5 mA |
| Solubility | Bar chart | g per 100 mL | Per sample and per solvent, filling as the stirrer runs |
| Hardness verdict | Pass-fail badge | Mohs | Scratched or unmarked for the current indenter, with the sample's own Mohs value revealed after three tests |
| What broke | Counter | count | Running tally in each inset of intermolecular links snapped versus bonds snapped |
| Structure claim card | Data table | mixed | The student's claim plus the rows selected as evidence; turns green only when the selected rows actually discriminate the two structures |
| Comparison table export | Data table | mixed | Full two-column CSV of every reading taken in the session |

**What the student should realise.**
Students believe a high melting point means "strong molecules" and that dissolving or melting breaks a substance's bonds. Running identical tests on a molecular solid and a lattice makes that untenable: melting sucrose snaps only the weak links between whole molecules while every bond inside them survives, and salt conducts only once its ions are free to move. The student should be able to say: *"The melting point tells me what has to be broken, and that tells me whether the substance is made of separate molecules or one connected pattern."*

### A5.5 · Choosing the right model for the job

**Experiment name:** Fit for Purpose: Pick Your Model  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Molecular  
**Interaction level:** Design  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-1

**Theme & scene.**
A warm oak workbench seen from slightly above, lit by a single angled task lamp so the tools throw long shadows. At the back edge, a slot holds one printed question card, face up, its question in large type. Along the right rail stands a rack of eight model chips filed upright like records, each a live thumbnail: a ball-and-stick methane turning slowly, a matte space-filling methane, a fragment of salt lattice, a flat structural formula printed on card, a plain chemical formula in typewriter face, a dot-and-cross diagram, a copper block glowing with electron fog, and a looping particle-motion animation. Drop a chip into the bench mount and it inflates onto the central turntable. Above hangs a tool belt whose unusable tools go grey. The control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Question card deck | Structure | Twelve 90 × 55 mm printed cards, each carrying a question, the answer type it wants (number, name, ratio, yes-no) and a hidden requirement tag such as geometry, size-and-fit, connectivity, ratio, mobile charge or particle motion | Yes: swap |
| 2 | Card slot | Structure | Brass-lipped slot at the back edge; the seated card is spotlit and its requirement tag stays hidden until the round ends | Yes: place |
| 3 | Model chip — ball-and-stick | Structure | 60 mm chip with a live spinning ball-and-stick preview at 0.7 × covalent radii; encodes connectivity, bond order and angles, not true size | Yes: place |
| 4 | Model chip — space-filling | Structure | Same chip form, van der Waals shells merged; encodes size, shape and fit, hides every bond | Yes: place |
| 5 | Model chip — lattice fragment | Structure | 3 × 3 × 3 unit-cell block with the unit cell wireframed; encodes arrangement, ratio and coordination, carries no single molecule | Yes: place |
| 6 | Model chip — structural formula | Structure | Flat printed card, atoms as letters and bonds as drawn lines; encodes connectivity and bond order, flattens all geometry to the page | Yes: place |
| 7 | Model chip — chemical formula | Structure | Typewriter-face string such as CH₄ or SiO₂ on plain card; encodes composition and ratio only | Yes: place |
| 8 | Model chip — dot-and-cross | Structure | Two-circle overlap diagram with shared and unshared electrons; encodes where the electrons are, nothing about shape or size | Yes: place |
| 9 | Model chip — metallic electron sea | Structure | Cutaway copper block with drifting blue fog between orange-brown cores; encodes mobile charge and packing | Yes: place |
| 10 | Model chip — particle motion loop | Structure | Animated solid, liquid and gas arrangements of featureless spheres; encodes spacing and movement, deliberately says nothing about what a particle is | Yes: place |
| 11 | Bench mount and turntable | Actor | Sprung clamp at bench centre; a seated chip inflates over 0.6 s to full size and can be spun by drag | Yes: drag |
| 12 | Tool belt | Instrument | Seven hanging tools: protractor, picometre ruler, pore gauge, bond counter, ratio counter, charge probe, motion timer; each carries a per-model availability flag | Yes: swap |
| 13 | Information mask | Field | The logic layer that greys out unsupported tools, prints "this model carries no information about that" on a grey tool click, and, when the mismatch is forced, generates the plausible wrong reading the model would actually give | No |
| 14 | Verdict stamp | Overlay | A rubber stamp that thumps onto the card reading ANSWERS IT in green, CANNOT ANSWER in amber or MISLEADS in red, with a short reason line beneath | No |
| 15 | Mismatch replay | Overlay | Split panel showing the wrong value the mismatched model gave beside the value the fit model gives, with both measurements re-run side by side | No |
| 16 | Model-question matrix | Overlay | An 8 × 12 grid pinned to the wall behind the bench, one cell per model and card, filling green, amber or red as each pairing is tried | No |

**How it works — the model.**
A state machine matches two vectors. Each question card carries a requirement set, and each model chip carries an information vector listing what it does and does not encode. Fitness is a coverage test: covered gives ANSWERS IT, uncovered gives CANNOT ANSWER, and covered-but-distorted gives MISLEADS. The last of those is the point of the whole bench, so a mismatch is never simply refused. With Force mismatched tool on, the bench returns the number that model genuinely produces: the pore gauge on ball-and-stick methane reads about 220 pm across and clears a 300 pm pore, while space-filling methane reads about 418 pm and jams; the bond counter on a space-filling model returns zero because every bond is buried; the structural formula gives 109.5° as a printed 90° because the page is flat. Scoring rewards the smallest sufficient model, so a lattice block used to read a bond angle is marked correct but wasteful.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Question card | Dropdown | Card 1 Will methane pass a 300 pm pore? / Card 2 How many bonds does each carbon in ethanol make? / Card 3 Draw one molecule of sodium chloride / Card 4 What is the H–O–H angle in water? / Card 5 What is the Na to Cl ratio in salt? / Card 6 Why does copper conduct as a solid? / Card 7 What happens to spacing when ice melts? / Card 8 Which electrons are shared in HCl? / Cards 9–12 mixed | Card 1 | — | Seats a new question and its hidden requirement tag |
| Model chip mounted | Drag-handle | Any one of the eight rack chips, or none | None | — | Which representation sits inflated on the turntable and which tools stay lit |
| Substance | Dropdown | Methane / Water / Ethanol / Hydrogen chloride / Sodium chloride / Diamond / Graphite / Quartz / Copper | Methane | — | Which substance every chip in the rack displays |
| Tool selected | Radio | Protractor / Picometre ruler / Pore gauge / Bond counter / Ratio counter / Charge probe / Motion timer | Protractor | — | Which measurement the student attempts on the mounted model |
| Force mismatched tool | Toggle | On / Off | Off | — | Allows an unsupported tool to run anyway and return the plausible but wrong reading |
| Answer entry | Numeric field | 0–5000 | 0 | pm, °, count or ratio as the card demands | The value submitted for scoring against the card's true answer |
| Difficulty | Radio | Guided / Open / Trap | Guided | — | Guided offers three chips, Open offers all eight, Trap highlights two tempting mismatched chips |
| Round timer | Toggle | On / Off | Off | — | Puts 90 s on each card and logs time per answer |
| Show information vector | Toggle | On / Off | Off | — | Prints what the mounted model does and does not encode, beside the turntable |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Will it fit? | Question card=Card 1; Substance=Methane; Difficulty=Open; Tool selected=Pore gauge; Force mismatched tool=On | Answer with ball-and-stick mounted, then with space-filling mounted. Which chip earned ANSWERS IT and which earned MISLEADS, and by how many picometres did the loser miss? |
| S2 | Counting what you cannot see | Question card=Card 2; Substance=Ethanol; Difficulty=Open; Tool selected=Bond counter | Try the bond counter on the space-filling chip. What does it return, and which chip answers the card in a single tool move? |
| S3 | Nothing to draw | Question card=Card 3; Substance=Sodium chloride; Difficulty=Trap; Show information vector=On | Two tempting chips are offered. Why does every molecule-shaped model fail this card, and what does the chip that succeeds actually show? |
| S4 | Cheapest model that works | Question card=Card 5; Substance=Sodium chloride; Difficulty=Open; Round timer=On | Three chips can answer this ratio. Which needs the fewest tool moves, and why is the lattice chip marked correct but wasteful? |

**Student activities.**
1. Seat Card 1, mount ball-and-stick, measure with the pore gauge and record your answer. Repeat with space-filling and record both readings side by side.
2. Run Card 2 with the space-filling chip and Force mismatched tool on. Record what the bond counter returned, then record what the structural formula chip returns.
3. Work through Cards 1 to 6 in Open difficulty, recording the chip you chose and the verdict stamped, and fill in six cells of the model-question matrix.
4. Choose one MISLEADS result and open the mismatch replay. Write one sentence naming the information the losing model did not carry.
5. Rerun any two cards using the smallest chip that still earns ANSWERS IT, and record your tool-move count before and after.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Fitness verdict | Pass-fail badge | — | ANSWERS IT, CANNOT ANSWER or MISLEADS for the current card and chip pairing |
| Answer versus true value | Data table | mixed | Submitted value, true value and the size of the error, one row per attempt |
| Model-question matrix | Heat map | — | Eight models by twelve cards, cells filling green, amber or red as pairings are tested |
| Tool moves used | Counter | moves | How many measurements the student needed to reach an answer this round |
| Round score | Live numeric | 0–100 | Correctness plus model fitness, minus a small penalty for excess model detail and unused tool moves |
| Mismatch log | Data table | mixed | Every forced mismatch: card, chip, tool, wrong value, right value, and the missing information type |
| Time per card | Timer | s | Seconds from card seating to answer submission, recorded when the round timer is on |

**What the student should realise.**
Students believe one model is the true picture of a substance and that the most detailed model is always the best. Watching a fit ball-and-stick model give a confidently wrong pore answer, and a space-filling model report zero bonds, makes that untenable: each model deletes information on purpose, and the deleted part is exactly what some questions need. The student should be able to say: *"There is no best model, only the model that keeps the information my question is about."*

---

*GradeNext Smart Lab · Grade 7 Unit A · 26 experiment specifications · standard v1.0*