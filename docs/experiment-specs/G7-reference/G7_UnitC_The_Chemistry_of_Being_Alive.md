# GradeNext Smart Lab · Simulation Experiment Book
## Grade 7 · Unit C · The Chemistry of Being Alive

**California Integrated Science, Grade 7** · Domain: Biology / Biochemistry · 5 topics · 25 experiments
**NGSS performance expectations anchored:** MS-LS1-6, MS-LS1-7
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
| C1.1 | Naming the inputs | Supply Lines: What a Leaf Takes In | Hybrid 2D+3D | Molecular + Particle system | Investigate | 12–18 min |
| C1.2 | Naming the outputs | The Harvest: Collecting What a Leaf Makes | Hybrid 2D+3D | Molecular + State machine | Investigate | 18–25 min |
| C1.3 | Where in the cell this happens | Zoom In: Hunting the Green Machine | 3D Scene | Molecular + Ray/wave | Investigate | 18–25 min |
| C1.4 | Photosynthesis as atoms rearranged | Nothing New: The Atom Ledger | Hybrid 2D+3D | Molecular | Investigate | 18–25 min |
| C1.5 | Conditions that affect the rate | Bubble Count: Finding the Limiting Factor | Hybrid 2D+3D | Particle system + Data-driven model | Investigate | 18–25 min |
| C2.1 | The intuitive but wrong answer | The Soil Story: Run Your Own Model | Hybrid 2D+3D | Data-driven model + Particle system | Investigate | 12–18 min |
| C2.2 | Van Helmont's willow tree experiment | Van Helmont's Willow: Five Years on a Balance | 3D Scene | State machine + Data-driven model | Investigate | 18–25 min |
| C2.3 | What the soil-mass evidence actually shows | Weigh the Ash: What the Tree Is Made Of | 3D Scene | State machine + Molecular | Investigate | 18–25 min |
| C2.4 | Building the case for air and water | Labelled Atoms: Tracing the New Mass | Hybrid 2D+3D | Molecular + Data-driven model | Investigate | 18–25 min |
| C2.5 | Evaluating, not asserting, the conclusion | The Warrant Test: Does Your Evidence Hold? | Data Dashboard | Data-driven model + Agent-based | Argue-from-data | 18–25 min |
| C3.1 | Naming the inputs | Supply Line: What a Mitochondrion Orders | 3D Scene | Molecular + Particle system | Investigate | 18–25 min |
| C3.2 | Naming the outputs | The Exhaust Test: Proving What Comes Out | Hybrid 2D+3D | Fluid/thermal + State machine (reagent chemistry) | Investigate | 18–25 min |
| C3.3 | Where in the cell this happens | All the Way In: Hummingbird to Crista | 3D Scene | Molecular + State machine (pathway tracker) | Investigate | 18–25 min |
| C3.4 | Comparing photosynthesis and respiration side by side | Mirror Image: One Set of Atoms, Two Directions | Hybrid 2D+3D | Molecular + Data-driven model | Investigate | 18–25 min |
| C3.5 | Respiration in plants and animals alike | The Plant in the Dark | Data Dashboard | Data-driven model + Fluid/thermal | Argue-from-data | 18–25 min |
| C4.1 | Modeling a food molecule broken down | Taking Glucose Apart | 3D Scene | Molecular | Manipulate | 18–25 min |
| C4.2 | Modeling the atoms rearranged into products | Building the Exhaust | 3D Scene | Molecular | Design | 18–25 min |
| C4.3 | Energy released, not created | The Bond Bank | Hybrid 2D+3D | Molecular + Data-driven model | Investigate | 18–25 min |
| C4.4 | Comparing respiration to a familiar reaction | Two Ways to Burn the Same Sugar | Hybrid 2D+3D | Fluid/thermal + Molecular + Data-driven model | Investigate | 18–25 min |
| C4.5 | Applying the model to an unfamiliar food molecule | Mystery Fuel: Balancing a Fat | Hybrid 2D+3D | Molecular + Data-driven model | Argue-from-data | 18–25 min |
| C5.1 | A carbon atom enters a plant | Through the Stoma: One Carbon Comes In | 3D Scene | Molecular + State machine | Explore | 18–25 min |
| C5.2 | A carbon atom moves into an animal | Swallowed: One Carbon Changes Owner | 2.5D Layered | Agent-based + State machine | Manipulate | 18–25 min |
| C5.3 | A carbon atom returns to the air | Exhaled: One Carbon Leaves the Deer | Hybrid 2D+3D | Molecular + Fluid/thermal | Investigate | 12–18 min |
| C5.4 | Photosynthesis and respiration as linked opposite processes | Round Trip: Atoms Cycle, Energy Doesn't | 2D Canvas | Molecular + Data-driven model | Argue-from-data | 12–18 min |
| C5.5 | Why plants run both processes | Night Shift: A Sealed Seedling, 24 Hours | Hybrid 2D+3D | Data-driven model + Particle system | Investigate | 18–25 min |

---

## C1 · Photosynthesis: inputs and outputs · MS-LS1-6

### C1.1 · Naming the inputs

**Experiment name:** Supply Lines: What a Leaf Takes In  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Particle system  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A single coast live oak leaf lies across the frame, sliced like a wedge of cake so the student looks into its thickness. The cut face is the star: a glassy cuticle on top, a rank of colourless brick epidermal cells, then tall palisade columns packed with jade lozenges, then spongy cells with open air caves. Sunlight falls from the upper left as visible golden darts. Beneath the leaf the air is a thin haze of red-and-charcoal CO₂ molecules queuing at two open stomatal pores. Rising from the lower right, a glass-clear xylem vessel carries a column of water molecules up into the vein. Palette is jade, straw and pale sky. The control panel is docked right; three brass gate valves stand on the left margin, one per supply line.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Leaf cutaway block | Environment | 900×420 px wedge cut at 45°, tissue depth 180 µm to scale, bevelled cut face, printed 50 µm scale bar; rotates ±20° on drag | Yes: drag |
| 2 | Waxy cuticle | Structure | 4 µm glossy transparent film across the upper surface with one specular streak; gas-tight, so no molecule ever crosses it | No |
| 3 | Upper epidermis | Structure | Single rank of 14 flat brick cells, 1 µm colourless walls, deliberately drawn with no chloroplasts | No |
| 4 | Palisade mesophyll cell | Actor | 8 columns 60×20 µm, thin cellulose wall, one large central vacuole, 38 jade chloroplast lozenges pressed against the outer wall; cytoplasm streams clockwise at 2 µm/s | Yes: swap |
| 5 | Spongy mesophyll and air space | Structure | 20 rounded cells at 45 percent void; the void is one connected air network tinted pale grey so CO₂ paths stay visible | No |
| 6 | Guard cell pair | Actor | Two kidney-shaped cells 35 µm long, thick inner wall, thin outer wall, 6 chloroplasts each; swell and bow apart to open the pore | Yes: drag |
| 7 | Stomatal pore | Structure | Lens-shaped gap between the guard cells, aperture 0–12 µm; the only route CO₂ has into the leaf | No |
| 8 | Xylem vessel | Structure | Hollow tube, 25 µm bore, annular lignin thickening rings, glass-clear; continuous water column; a clamp collar can pinch it shut | Yes: connect |
| 9 | Phloem sieve tube | Structure | Parallel tube with perforated sieve plates, amber sucrose dots moving downward; carries product out, takes no input | No |
| 10 | Chloroplast | Actor | 5×2 µm jade lozenge, double envelope, 12 dark grana stacks resolvable at this zoom; a small hopper gauge on its flank fills with arriving molecules | No |
| 11 | CO₂ molecule | Particle | Linear O=C=O, charcoal C sphere r 0.77 u between two red O spheres r 0.66 u, double-bond rod pairs 116 pm; 400 instanced, Brownian drift, serial-tagged | No |
| 12 | Water molecule | Particle | Bent triad at 104.5°, red O r 0.66 u with two white H r 0.31 u, O–H rods 96 pm; 1200 in the xylem column, rising at 4 mm/s scaled | No |
| 13 | Photon packet | Particle | Golden 6 px dart carrying a wavelength tag and zero mass; annihilates on a chlorophyll hit; 200 per second at default intensity | No |
| 14 | Mineral ion set | Particle | Violet K⁺, blue NO₃⁻ and green Mg²⁺ spheres riding the xylem stream at 1 ion per 400 water molecules; the deliberate distractor | Yes: swap |
| 15 | Supply valve rig | Instrument | Three brass gate valves on the left margin labelled LIGHT, AIR, WATER; closing one greys its whole route and stops its counter | Yes: drag |
| 16 | Input tally board | Overlay | Docked strip counting molecules delivered to the chloroplast per minute per species, plus atoms of C, H and O arriving per minute | No |

**How it works — the model.**
Three independent supply lines feed one consumer. Light arrives as photon packets at a flux set by the intensity slider. CO₂ enters only through open stomata, so its delivery rate is proportional to aperture area multiplied by the outside-to-inside concentration difference. Water arrives by mass flow up the xylem at a rate set by soil availability and by transpiration through those same pores, which is why closing the stomata throttles two lines at once. The chloroplast hopper consumes strictly 6 CO₂ to 6 H₂O to 48 photons per glucose; each tick it completes whatever combinations it can and queues the rest visibly. Rate is therefore set by the scarcest line, never by the total. Two honesty rules the build must keep: photons must never enter the atom columns of the tally, because light supplies energy and not matter, and mineral ions must be visible yet must always tally under 0.1 percent of arriving atoms.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Light intensity | Slider | 0–2000 | 600 | µmol m⁻² s⁻¹ | Photon packet flux onto the leaf surface |
| Stomatal aperture | Slider | 0–12 | 7 | µm | Guard cell shape and the CO₂ entry rate |
| Air CO₂ concentration | Slider | 0–1200 | 420 | ppm | Molecule density in the air below the leaf |
| Soil water availability | Slider | 0–100 | 80 | percent | Height and speed of the xylem water column |
| Xylem clamp | Toggle | Open / Clamped | Open | — | Cuts the water line at the petiole without touching the other two |
| Mineral supply | Dropdown | None / Trace / Full | Full | — | Ion density in the xylem stream; tests the soil-food idea |
| Cutaway plane | Drag-handle | 0–100 | 40 | percent of blade width | Slides the slice across the leaf to expose vein or lamina |
| Molecule labels | Toggle | On / Off | On | — | Chemical formulae float beside each particle species |
| Playback speed | Dial | 0.25×–4× | 1× | — | Time scaling of the whole scene |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Open for business | light=600; aperture=7; CO₂=420; water=80; clamp=Open | Three things arrive at the chloroplast. Which two are made of atoms, and which one is not? |
| S2 | Sealed pores | aperture=0; light=600; water=80 | Closing one 12 µm gap stops the leaf almost completely. Which input line did that gap belong to? |
| S3 | Rich soil, no water | minerals=Full; water=0; clamp=Clamped; light=600 | The soil is packed with minerals. Why does the chloroplast hopper still stop filling? |
| S4 | Central Valley midday | light=1900; CO₂=420; aperture=2; water=25 | On a hot dry afternoon the leaf shuts its pores to save water. What does it lose by doing so? |

**Student activities.**
1. Set all three valves open at default and run 60 s. Record the tally board figures for CO₂, H₂O and photons delivered.
2. Close the LIGHT valve only. Re-run 60 s and record which counters fall to zero and which keep running.
3. Drag the stomatal aperture from 7 µm to 0 and back in four steps, recording CO₂ delivery at each step; state which other counter moved with it.
4. Set minerals to Full and water to 0. Record the atom tally and write one sentence on whether minerals can be the source of the leaf's mass.
5. Predict, before touching it, what raising CO₂ to 1200 ppm does when light is set to 100. Then test and explain the result.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Molecules delivered | Live numeric | count/min | Separate counters for CO₂, H₂O and mineral ions reaching the chloroplast, refreshed every 2 s |
| Photon arrival rate | Live numeric | packets/s | Energy input, displayed in its own panel away from the atom columns |
| Atom inventory in | Data table | atoms/min | C, H and O arriving, split by which molecule carried them |
| Glucose assembly progress | Live numeric | percent | Fill level of the chloroplast hopper toward the next complete glucose |
| Limiting input | Pass-fail badge | — | Names the scarcest of the three lines and turns amber when it changes |
| Run log | Data table | mixed | One row per run with all control values and all counters; exportable CSV |

**What the student should realise.**
Students believe a plant takes food from the soil and that sunlight is another ingredient. The atom tally separates the claims: the only atoms crossing into the leaf come from carbon dioxide and water, minerals arrive but stay below a thousandth of it, and photons register in the energy column with no atoms. The student should be able to say: *"A leaf takes in carbon dioxide and water as materials, and light as energy — those are different jobs."*

### C1.2 · Naming the outputs

**Experiment name:** The Harvest: Collecting What a Leaf Makes  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A school prep-room bench under cool daylight, everything laid out in the order the procedure runs. At the centre stands a potted variegated geranium, cream-margined leaves over deep green centres, with one leaf clipped between two halves of a matte-black foil stencil cut into a star. On the left a borosilicate bell jar waits on a greased plate, an oxygen probe through its collar and a glowing splint clamped beside it. To the right runs the testing line: a hotplate carrying a beaker of boiling water, a smaller ethanol beaker standing inside it, a white glazed tile, and an amber dropper of iodine. Floating above the bench is a circular molecular window into one chloroplast, where glucose rings are being threaded onto a growing starch grain. Control panel docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Variegated geranium | Actor | 24 cm potted plant, 9 leaves, cream margin over green centre, turgid stems; any leaf can be detached with forceps | Yes: drag |
| 2 | Foil stencil mask | Structure | Two 0.1 mm matte-black aluminium plates clipped either side of one blade, cut-out shapes star / letter G / circle / half-leaf | Yes: place |
| 3 | Bell jar and base plate | Instrument | 30 cm borosilicate dome, ground rim on a greased glass plate, side port with a rubber septum, sealed volume 9.4 L | No |
| 4 | Oxygen probe | Instrument | 8 mm optical O₂ sensor through the collar, range 0–30 percent v/v, samples every 1 s, digital head | No |
| 5 | Soda-lime sachet | Structure | 20 g of white pellets in a mesh bag inside the jar; drops jar CO₂ below 5 ppm within 10 min when fitted | Yes: place |
| 6 | Glowing splint | Actor | 10 cm wooden splint with an orange ember; flares back to flame with a visible white burst above 24 percent O₂ | Yes: swap |
| 7 | Hotplate and water bath | Instrument | 18 cm ceramic top, dial 0–200 °C, 400 mL beaker of water held at 100 °C to kill the leaf and stop it changing | No |
| 8 | Ethanol beaker | Instrument | 100 mL beaker standing inside the water bath, never over a flame; ethanol runs clear to deep bottle-green as chlorophyll leaves the leaf | No |
| 9 | White tile and forceps | Instrument | 12 cm glazed tile plus stainless forceps; the decolourised leaf lands brittle and pale straw on the tile | Yes: drag |
| 10 | Iodine dropper | Instrument | Amber bottle of iodine in potassium iodide, orange-brown drops that turn blue-black on starch within 3 s | Yes: drag |
| 11 | Chloroplast inset window | Overlay | 240 px circular view: double envelope, 14 grana stacks, stroma, one growing starch grain, faint scanline rim | No |
| 12 | Glucose molecule | Particle | Six-membered pyranose ring, 6 charcoal C, 6 red O, 12 white H, ball-and-stick, all 24 atoms serial-tagged | No |
| 13 | Starch grain | Structure | Cream-white ovoid in the stroma growing from 0.2 to 4 µm as glucose rings link into chains, concentric growth rings visible | No |
| 14 | Oxygen molecule | Particle | Two red spheres r 0.66 u joined by one 121 pm double-bond rod; released at a granum, drifts out through the stoma into the jar | No |
| 15 | Sucrose export stream | Particle | Amber paired rings entering the phloem and moving down the stem, showing sugar leaving rather than piling up | No |
| 16 | Product tally board | Overlay | Running counts of O₂ released, glucose assembled, starch mass gained, and the C, H and O atoms now locked in products | No |

**How it works — the model.**
The leaf runs a three-condition gate at every 2 mm patch: light reaching that patch, chlorophyll present in that patch, and CO₂ available inside the jar. Product rate at a patch is the product of the three, so any one of them at zero gives zero, which is what makes the stencil and the cream margin readable. Fixed carbon accumulates first as glucose, then polymerises into a starch grain at a rate that saturates, and drains during dark pre-treatment at a slower fixed rate — this is why 48 h of darkness empties the leaf. Oxygen is released stoichiometrically at one O₂ per CO₂ fixed and mixes into the jar volume, so the probe trace and the iodine map come from the same event, not two separate stories. The iodine test is destructive and irreversible: once a leaf is boiled the sim must lock it out of further exposure runs.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Dark pre-treatment | Slider | 0–72 | 48 | h | How completely existing starch is drained before the run starts |
| Light exposure | Slider | 0–12 | 6 | h | How long the masked leaf sits under the lamp before testing |
| Light intensity | Slider | 0–1200 | 500 | µmol m⁻² s⁻¹ | Photon flux on the canopy, and the depth of colour in the iodine map |
| Mask shape | Dropdown | None / Star / Letter G / Circle / Half-leaf | Star | — | Which cut-out appears in the stain; swaps the stencil object |
| Leaf chosen | Dropdown | All-green / Variegated / Chlorotic yellow | Variegated | — | Structural swap of the leaf that enters the testing line |
| Jar atmosphere | Dropdown | Normal air / CO₂-free with soda lime / CO₂-enriched 1000 ppm | Normal air | — | Whether CO₂ reaches the leaf; fits or removes the sachet |
| Ethanol bath time | Slider | 0–10 | 5 | min | How completely chlorophyll is removed; under 3 min leaves green that hides the stain |
| Iodine drops | Stepper | 0–10 | 4 | drops | Stain coverage across the tile |
| Inset zoom | Dropdown | Leaf / Cell / Chloroplast / Molecule | Chloroplast | — | Which scale the molecular window shows |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The stencil test | leaf=All-green; mask=Star; dark=48; exposure=6; atmosphere=Normal air | Where does blue-black appear, and what was missing everywhere it stayed straw-coloured? |
| S2 | The cream margin | leaf=Variegated; mask=None; exposure=6; intensity=500 | Every part of this leaf got the same light and the same air. Why does only part of it stain? |
| S3 | Air taken away | leaf=All-green; mask=None; atmosphere=CO₂-free with soda lime; exposure=6 | Light and chlorophyll are both present. Why is there no starch and almost no oxygen? |
| S4 | Overnight control | leaf=All-green; mask=None; dark=48; exposure=0 | Nothing stains at all. Does the glowing splint agree, and what does that tell you about the two outputs? |

**Student activities.**
1. Set the dark pre-treatment to 48 h and run the full testing line on an unexposed leaf. Record the iodine result as your zero.
2. Place the star stencil on an all-green leaf, expose for 6 h, then run the test. Sketch the stain pattern and label which region got light.
3. Measure the jar oxygen at the start and end of the same 6 h run, and test with the glowing splint. Record both results side by side.
4. Swap to CO₂-free air and repeat. Record starch result and oxygen change, then state which single input you removed.
5. Zoom the inset to Molecule and count the atoms in one glucose ring. Compare that count with the product atom inventory after a full run.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Iodine result map | Heat map | — | False colour over the leaf outline from straw (no starch) to blue-black (dense starch), sampled on a 2 mm grid |
| Oxygen in the jar | Line graph | percent v/v | Probe trace across the whole exposure, 1 s samples, with the start value marked |
| Glowing splint test | Pass-fail badge | — | Relight or no relight, stamped with the O₂ percentage at the moment of testing |
| Oxygen released | Counter | count and cm³ | Cumulative O₂ molecules leaving the leaf, also shown as gas volume at room conditions |
| Starch grain mass | Live numeric | pg per chloroplast | Rises during exposure, falls during the dark pre-treatment, updated every 5 simulated minutes |
| Product atom inventory | Data table | atoms | C, H and O locked into glucose and released as O₂ per run; exportable CSV |

**What the student should realise.**
Students describe a plant's outputs as "oxygen for us" and imagine sugar being eaten as it is made. Both tests here fire from one event: starch appears only where light, chlorophyll and CO₂ all reached, and the jar oxygen rises over exactly the same hours. Oxygen is a leftover of the reaction, not a service; sugar is a store the plant builds. The student should be able to say: *"The leaf makes sugar and lets the oxygen go."*

### C1.3 · Where in the cell this happens

**Experiment name:** Zoom In: Hunting the Green Machine  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + Ray/wave  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
The scene opens on a sunlit coast live oak leaf in a soft-jawed clamp, underside to the camera, a 2 cm scale bar in the corner. Turning the zoom dial drives a single continuous flight with no cuts: the surface resolves into interlocking jigsaw epidermal cells, a stoma parts between two kidney-shaped guard cells, the camera slips through the gap into a moist air cave, brushes past spongy cells, enters the flank of a palisade column, and finally crosses the double envelope of one chloroplast to hover between two grana. The palette cools as it descends, oak-green outside to deep teal within, with wet highlights on every membrane. A micro-beam spotlight and a needle-thin oxygen microsensor hang in frame throughout. Control panel docked right; the scale bar updates every frame.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Leaf blade and cutaway wedge | Environment | 6 cm oak leaf, 210 µm thick, held in a clamp; a slicing plane opens a wedge so the camera can enter the interior | Yes: drag |
| 2 | Cuticle and epidermis | Structure | 4 µm glassy wax film over one rank of jigsaw-edged cells 30 µm across, colourless walls, no chloroplasts | No |
| 3 | Guard cell pair and stoma | Actor | Two kidney cells 35 µm long, thickened inner walls, 6 small chloroplasts each; bow apart to open a 0–12 µm pore | Yes: drag |
| 4 | Mesophyll cells | Actor | 8 palisade columns 60×20 µm plus 20 rounded spongy cells at 45 percent air space; palisade holds 38 chloroplasts, spongy holds 12 | Yes: swap |
| 5 | Central vacuole and nucleus | Structure | Vacuole filling 80 percent of cell volume, faint straw tint; nucleus 8 µm with visible pores and a dense nucleolus; both pigment-free | No |
| 6 | Mitochondrion | Actor | 2×0.6 µm capsule, russet, folded cristae inside a double membrane; drifts on cytoplasmic streaming; the contrast organelle | No |
| 7 | Chloroplast outer envelope | Structure | Smooth continuous membrane, 5×2 µm lens, pale jade, freely permeable, drawn as a distinct skin | No |
| 8 | Chloroplast inner envelope | Structure | Second membrane 20 nm inside the first with a visible intermembrane gap; controls what enters the stroma | No |
| 9 | Thylakoid disc | Structure | Flattened sac 500 nm across, 20 nm lumen, teal membrane with a wet sheen; the only surface carrying pigment | No |
| 10 | Granum | Structure | Stack of 12–18 thylakoid discs like a roll of coins, 14 grana per chloroplast, spaced 10 nm apart | Yes: resize |
| 11 | Stroma lamella | Structure | Unstacked thylakoid tube 40 nm wide bridging neighbouring grana at a shallow angle, 2–3 per granum pair | No |
| 12 | Stroma | Structure | Viscous olive-green fluid filling the envelope, with 70S ribosomes as 20 nm dots and one circular DNA loop | No |
| 13 | Chlorophyll molecule | Particle | Flat porphyrin head 1.5 nm with a central Mg atom plus a phytol tail anchored in the lipid bilayer; 2400 instanced per disc face | Yes: swap |
| 14 | Starch grain | Structure | Cream ovoid 2–4 µm in the stroma, concentric rings, grows during a lit run | No |
| 15 | Micro-beam and O₂ microsensor | Instrument | 1–20 µm spotlight of chosen wavelength plus a 3 µm sensor tip 5 µm downstream reading oxygen evolution | Yes: place |
| 16 | Zoom dial and scale bar | UI-Probe | Continuous camera track with a live field-width readout that steps from cm to µm to nm without ever cutting | Yes: drag |

**How it works — the model.**
This is a localisation assay in the style of Engelmann's micro-beam. A spotlight of chosen diameter and wavelength is aimed at one named structure, and the microsensor reads oxygen evolved from that spot. The rule the engine runs is signal = beam power × chlorophyll surface density at the hit point × action-spectrum weight for that wavelength. Chlorophyll surface density is non-zero only on thylakoid membranes, so wall, vacuole, nucleus, mitochondrion and stroma fluid all return a flat zero, grana return maximum, stroma lamellae return roughly 40 percent because they carry less membrane area per unit volume, and guard cells return a small positive. Zoom is one continuous camera path with a continuously updating scale bar and no jump cuts, because the misconception that a chloroplast is a solid green blob comes from cutting straight to a cartoon icon at high magnification.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Zoom | Dial | 1×–500 000×, detents at leaf, surface, cell, chloroplast, membrane | 1× | — | Camera altitude along the flight path and the scale bar reading |
| Micro-beam target | Dropdown | Cell wall / Vacuole / Nucleus / Mitochondrion / Stroma / Granum / Stroma lamella / Guard cell | Granum | — | Which structure the spot lands on |
| Beam wavelength | Slider | 400–740 | 662 | nm | Spot colour and the action-spectrum weight applied to the signal |
| Beam power | Slider | 0–100 | 40 | µW | Photon rate into the spot |
| Spot diameter | Slider | 1–20 | 5 | µm | How selectively one structure can be hit without catching its neighbours |
| Cutaway plane | Drag-handle | 0–100 | 45 | percent of leaf thickness | Slices the tissue open so interior structures are reachable |
| Chlorophyll density | Slider | 0–100 | 100 | percent of normal | Strips pigment from the thylakoids while leaving the membranes intact |
| Leaf sector | Dropdown | Green / Cream margin / Chlorotic yellow | Green | — | Structural swap of which tissue the camera and beam are working in |
| Stomatal aperture | Slider | 0–12 | 7 | µm | Width of the entry route the camera flies through |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Find the source | zoom=chloroplast; target=Granum; wavelength=662; power=40; sector=Green | Fire the beam at six structures in turn. Which ones give an oxygen signal at all? |
| S2 | Membranes without pigment | chlorophyll=0; target=Granum; power=40 | The thylakoid stacks are still there and still stacked. Why has the signal vanished? |
| S3 | The cream margin | sector=Cream margin; target=Granum; zoom=cell | The beam reports no such structure here. What are these cells missing that green cells two millimetres away have? |
| S4 | Guard cells count too | sector=Green; target=Guard cell; zoom=surface; spot=5 | Guard cells are green and they do give a signal. Why is it so much smaller than a palisade cell's? |

**Student activities.**
1. Drag the zoom dial from 1× to 500 000× in one continuous move and record the scale bar value at each of the five detents.
2. Fire the micro-beam at the wall, vacuole, nucleus, mitochondrion, stroma and granum in turn. Record the sensor reading for each in the hit log.
3. Set chlorophyll density to 0 and repeat the granum shot. Record the new reading and state what changed and what did not.
4. Count the chloroplasts in one palisade cell and the grana in one chloroplast, then read off the thylakoid membrane area. Record all three.
5. Sweep beam wavelength from 400 to 740 nm at the granum in 20 nm steps and mark the two wavelengths that give the strongest signal.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Oxygen microsensor | Live numeric | pmol O₂ cm⁻² s⁻¹ | Signal at the sensor tip, refreshed every 0.2 s while the beam is on |
| Structure hit log | Data table | mixed | One row per shot: structure, wavelength, power, spot size, signal; exportable |
| Signal by structure | Bar chart | pmol O₂ cm⁻² s⁻¹ | One bar per structure, built up as the student samples; zeros stay visible as empty bars |
| Scale readout | Live numeric | m, switchable to µm and nm | Current field width, updating continuously through the zoom flight |
| Chloroplast census | Counter | count | Chloroplasts in the cell on screen and grana in the chloroplast on screen |
| Thylakoid membrane area | Live numeric | µm² per chloroplast | Total pigment-bearing surface in the current chloroplast; rises as grana are resized |

**What the student should realise.**
Students place photosynthesis vaguely "in the leaf", or wherever the plant looks green. The beam makes location testable: wall, vacuole, nucleus, mitochondrion and stroma fluid all give nothing, the granum gives a strong signal, and stripping pigment from intact thylakoids kills that signal outright. The site is a membrane, not a colour and not a whole organ. The student should be able to say: *"It happens on the thylakoid membranes inside chloroplasts, because that is where the chlorophyll sits."*

### C1.4 · Photosynthesis as atoms rearranged

**Experiment name:** Nothing New: The Atom Ledger  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A dark, quiet workbench lit only from inside a glass reaction chamber standing at the centre on a steel plinth. To its left, two loading racks: one holding linear red-charcoal-red carbon dioxide molecules, one holding bent white-red-white water molecules, each sitting in a numbered slot. Above the chamber a small lamp drops golden photon packets onto the glass. To the right, two catch trays sit empty at the start, waiting for glucose and for oxygen. Along the bottom edge runs the atom ledger: three columns headed C, H and O, each with a live count and a stack of coloured tokens that physically move as bonds change. Every atom in the scene carries a faint serial tag that stays with it through every rearrangement.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reaction chamber | Instrument | 220 mm borosilicate cylinder on a steel plinth, lit from within, slow internal swirl; a lid ring switches it between sealed and vented | Yes: swap |
| 2 | Carbon atom | Particle | Charcoal sphere drawn at r 0.77 u, matte finish, serial tags C-01 to C-12 | No |
| 3 | Oxygen atom | Particle | Red sphere r 0.66 u, satin finish, serial tags O-01 to O-36 | No |
| 4 | Hydrogen atom | Particle | White sphere r 0.31 u, glossy, serial tags H-01 to H-24 | No |
| 5 | Double bond cylinder | Structure | Two parallel rods 0.08 u thick, 116 pm for C=O and 121 pm for O=O; flashes white for 0.3 s as it breaks or forms | No |
| 6 | Single bond cylinder | Structure | One rod 0.10 u thick at the correct length: O–H 96 pm, C–H 109 pm, C–C 154 pm, C–O 143 pm | No |
| 7 | Carbon dioxide molecule | Actor | Linear at 180°, one C flanked by two O with double bonds; 12 available in the left rack | Yes: drag |
| 8 | Water molecule | Actor | Bent at 104.5°, one O with two single-bonded H; 12 available in the left rack | Yes: drag |
| 9 | Photon packet | Particle | Golden dart with a wavelength tag and zero mass; enters the energy panel and is barred from the atom columns by construction | No |
| 10 | Glucose molecule | Actor | Six-carbon pyranose ring with one CH₂OH arm, C₆H₁₂O₆, 24 atoms; assembles atom by atom over 6 s in the chamber | No |
| 11 | Oxygen molecule | Actor | Two red spheres joined by one 121 pm double bond; drifts to the right catch tray on release | No |
| 12 | Loading racks | Instrument | Two numbered 12-slot racks; a molecule is dragged from a slot into the chamber mouth and cannot be un-made once inside | Yes: place |
| 13 | Atom ledger panel | Overlay | Three live columns, C, H and O, each split into In chamber, In products and Unused; plus a total mass row in u | No |
| 14 | Serial-tag overlay | Overlay | Small floating ID beside every atom; one selected atom is haloed and its route is drawn as a ribbon | Yes: swap |
| 15 | Leftover bin | Structure | Glass dish beneath the chamber where unmatched molecules drop and are counted by species | No |
| 16 | Balance plate | Instrument | Weighing plate under the whole chamber reading total contents in u before, during and after the run | No |

**How it works — the model.**
The chamber runs strict conservation. Every atom is a persistent object with an immutable serial number; bonds are separate objects that can be destroyed and created, but atoms can only be re-parented. The reaction proceeds as 6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂, and the engine will only complete an assembly when all required atoms are physically present in the chamber. Photon packets deplete an energy budget of 8 packets per CO₂ fixed and are logged in a separate energy panel that has no atom columns at all. Anything unmatched is pushed to the leftover bin, still carrying its serials. The failure the build must avoid is the classic cheat of spawning product atoms and despawning reactant atoms: products must be assembled from the very spheres the student loaded, visibly, or the ledger teaches nothing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| CO₂ molecules loaded | Stepper | 0–12 | 6 | count | Carbon and oxygen atoms entering the chamber |
| Water molecules loaded | Stepper | 0–12 | 6 | count | Hydrogen and oxygen atoms entering the chamber |
| Photon packets | Slider | 0–96 | 48 | count | Energy budget; 48 packets are needed to complete one glucose |
| Chamber seal | Toggle | Sealed / Vented | Sealed | — | Vented lets O₂ leave, so the after-tally loses atoms and the badge fails |
| Build mode | Radio | Guided / Free | Guided | — | Structural: Guided auto-pairs molecules, Free waits for the student to drag every one |
| Traced atom | Dropdown | None / any serial from C-01 to O-36 | O-07 | — | Haloes one atom and draws its path from reactant to product |
| Display style | Dropdown | Ball-and-stick / Space-fill / Skeletal with labels | Ball-and-stick | — | How atoms and bonds are drawn in the chamber |
| Assembly speed | Dial | 0.25×–4× | 1× | — | Time scaling of bond breaking and forming |
| Reverse run | Toggle | Off / On | Off | — | Runs the same chamber backwards as respiration; the ledger must still balance |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The exact recipe | CO₂=6; water=6; photons=48; seal=Sealed; mode=Guided | Count every element before and after. Which of the three counts changed? |
| S2 | Short of water | CO₂=6; water=2; photons=48; mode=Guided | No complete glucose forms. What is sitting in the leftover bin, and what does it tell you about the recipe? |
| S3 | Too much air | CO₂=10; water=6; photons=48; mode=Free | Four CO₂ are left over. Does the glucose come out bigger, or does something else happen instead? |
| S4 | Follow one oxygen | CO₂=6; water=6; photons=48; traced=O-07 | Trace an oxygen that started in a water molecule. Where does it end up, and where do the CO₂ oxygens go? |

**Student activities.**
1. Load 6 CO₂ and 6 H₂O, run, and record the C, H and O totals before and after from the ledger.
2. Set water to 2 and re-run. Record what appears in the leftover bin and how many O₂ were released.
3. Switch to Free mode and build one glucose by dragging molecules yourself. Record how many of each you needed.
4. Select a traced atom in a water molecule, run, and write down which product molecule it finished in.
5. Set the chamber to Vented, re-run, and explain in one sentence why the balance badge turns red even though nothing was destroyed.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom ledger | Data table | atoms | C, H and O counted before, during and after; the three after-totals must equal the three before-totals |
| Element tally strip | Bar chart | atoms | Paired before and after bars for each element, updating every frame as bonds change |
| Balance badge | Pass-fail badge | u | Total chamber mass before against after; green only when identical to the unit |
| Molecules formed | Counter | count | Glucose and O₂ produced this run, incremented as each completes |
| Leftover contents | Live numeric | count | Unmatched molecules and loose atoms in the bin, listed by species |
| Traced atom path | Vector overlay | — | Ribbon showing the selected atom's journey and every bond it belonged to |

**What the student should realise.**
Students think a plant makes matter out of sunlight, or that atoms are used up and new ones appear. The ledger makes both impossible: every atom in the glucose and the oxygen was already in the chamber, serial number and all, the element totals never move, and light is logged in an energy panel with no atoms attached. The student should be able to say: *"Nothing new was made. The same atoms were taken apart and put back together differently."*

### C1.5 · Conditions that affect the rate

**Experiment name:** Bubble Count: Finding the Limiting Factor  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Particle system + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A school lab bench seen straight on, deliberately plain so the numbers dominate. A boiling tube of pondwater holds three sprigs of Cabomba, cut stems upward, weighted at the base with a paperclip. Silver oxygen bubbles rise from the cut ends in a steady string, funnelled by an inverted glass cone into a graduated collecting tube. A lamp rides on a metre ruler track laid across the bench, its distance printed in centimetres. Between lamp and tube stands an optional glass tank of water, the heat shield. A wheel of coloured filter discs clicks in front of the lamp; a thermostatted water jacket surrounds the boiling tube; a syringe of sodium hydrogencarbonate solution stands ready. A photo-gate straddles the bubble path. Graph panel along the bottom, control panel docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Boiling tube and rack | Instrument | 25×150 mm borosilicate tube in a white plastic rack, filled to 130 mm with pondwater, faint green tint | No |
| 2 | Cabomba sprigs | Actor | 1–5 stems 80 mm long, whorls of feathery bright-green leaves every 8 mm, gently swaying; trimmed at the top | Yes: place |
| 3 | Cut stem end | Structure | Freshly cut 2 mm bore at the top of each sprig, pale cream core; the single emission point for bubbles | Yes: resize |
| 4 | Oxygen bubble | Particle | Silvered sphere 1.6 mm across, volume 2.1 mm³, rises at 22 mm/s with a slight wobble, coalesces at the funnel neck | No |
| 5 | Inverted funnel and collecting tube | Instrument | 60 mm glass cone over the sprigs feeding a 5 cm³ graduated tube marked every 0.1 cm³ | No |
| 6 | Lamp on ruler track | Instrument | 25 W LED lamp in a reflector on a sliding carriage; metre ruler graduated in cm runs the bench width | Yes: drag |
| 7 | Colour filter wheel | Structure | Six-position disc of 50 mm gel filters, clear / blue 450 / green 550 / yellow 590 / red 660 / far-red 730 | Yes: swap |
| 8 | Heat shield tank | Structure | 120×80×60 mm glass tank of clear water between lamp and tube; absorbs infrared without dimming much | Yes: place |
| 9 | Thermostatted water jacket | Instrument | Clear sleeve around the boiling tube fed by a bath, setpoint 5–45 °C, with a digital thermometer probe in the water | No |
| 10 | Hydrogencarbonate syringe | Instrument | 10 mL syringe of sodium hydrogencarbonate solution; each dose visibly disperses as a shimmer through the tube | Yes: drag |
| 11 | Dissolved CO₂ field | Field | Invisible scalar field through the tube volume, in mmol/L, depleted locally near the leaves and replenished by stirring | No |
| 12 | Photo-gate bubble counter | Instrument | Infrared beam and detector clamped across the bubble path, 8 mm above the stems; increments on each break | No |
| 13 | Dissolved oxygen probe | Instrument | 6 mm optical probe through a bung, range 0–20 mg/L, 1 s sampling, digital head on the rack | Yes: place |
| 14 | Light meter | Instrument | Flat sensor taped to the tube face reading incident photon flux, so intensity is measured and not assumed | No |
| 15 | Rate graph panel | Overlay | Dark-slate panel along the bottom plotting the chosen factor on x and bubble rate on y, points added per run | No |
| 16 | Results logbook | Overlay | Scrolling table of every counting window with all control settings attached; exportable | No |

**How it works — the model.**
Two independent supply terms compete. The light-driven supply is L = k·I·w(λ), where I is the measured flux at the tube face, falling with the inverse square of lamp distance, and w(λ) is an action-spectrum weight: 1.00 at 440 and 662 nm, 0.15 at 550 nm, 0.05 beyond 720 nm. The carbon supply is C = m·[CO₂] from the dissolved hydrogencarbonate. Gross rate is the smaller of L and C, multiplied by a temperature factor with Q₁₀ of 2.0 from 5 to 30 °C, flat to 35 °C, then falling to zero by 48 °C as enzymes denature. Net oxygen output is gross minus respiration, which also rises with temperature, so below the light compensation point no bubbles appear at all. Bubble count is net volume divided by 2.1 mm³. The plateaus are never drawn in: they emerge because one term overtakes the other.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Lamp distance | Drag-handle | 5–100 | 20 | cm | Carriage position on the ruler; incident flux follows the inverse square law |
| Lamp power | Slider | 5–60 | 25 | W | Brightness at the source, and heat output if the shield is removed |
| Filter | Dropdown | Clear / Blue 450 / Green 550 / Yellow 590 / Red 660 / Far-red 730 | Clear | nm | Wavelength reaching the sprigs and its action-spectrum weight |
| Hydrogencarbonate | Slider | 0.0–2.0 | 0.2 | percent w/v | Dissolved CO₂ available to the leaves |
| Water temperature | Slider | 5–45 | 20 | °C | Jacket setpoint, so enzyme rate and respiration rate |
| Number of sprigs | Stepper | 1–5 | 3 | count | Structural: total leaf area, so the height of every plateau |
| Heat shield | Toggle | Fitted / Removed | Fitted | — | Structural: blocks lamp heat, separating the light variable from temperature |
| Counting window | Slider | 30–300 | 120 | s | How long the photo-gate counts before reporting a rate |
| Settling time | Slider | 0–10 | 5 | min | Acclimatisation allowed after any change before counting starts |
| Plot mode | Dropdown | Rate vs light / Rate vs CO₂ / Rate vs temperature / Rate vs wavelength | Rate vs light | — | Which factor the graph panel builds along its x-axis |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Build the light curve | distance stepped 100→50→30→20→10→5; hydrogencarbonate=0.2; temperature=20; shield=Fitted | The curve rises then flattens. What is running out at the flat part, given that light is still increasing? |
| S2 | Lift the ceiling | distance=10; hydrogencarbonate stepped 0.2→1.0→2.0; temperature=20 | Light was already bright and did not change. Why does the rate climb again? |
| S3 | Bright but useless | filter=Green 550; distance=10; hydrogencarbonate=1.0; temperature=20 | The tube looks brightly lit to your eye. Why do the bubbles almost stop? |
| S4 | Delta canal in August | temperature=38; distance=10; hydrogencarbonate=1.0; shield=Fitted | Warm water and strong light, yet the rate is below the 30 °C result. What has gone wrong inside the leaf? |

**Student activities.**
1. Set the lamp at 100 cm, allow 5 min settling, and count bubbles for 120 s. Record the rate and the light meter reading together.
2. Repeat at 50, 30, 20, 10 and 5 cm. Plot rate against measured flux and mark the point where the curve stops rising.
3. At 10 cm, raise hydrogencarbonate from 0.2 to 1.0 to 2.0 percent, counting after each change. Record what happens to the plateau height.
4. Remove the heat shield, re-run the 5 cm reading, and record both bubble rate and water temperature. Explain why this run cannot be used as a light result.
5. Step the temperature from 5 to 45 °C in 5 °C steps at fixed light and CO₂. Record the rate at every step and mark the temperature where it peaks.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Bubble rate | Counter | bubbles/min | Photo-gate count divided by the counting window, reported at the end of each window |
| Oxygen collected | Live numeric | cm³ | Cumulative gas in the graduated tube, readable to 0.1 cm³ |
| Dissolved oxygen | Line graph | mg/L | Probe trace against time for the whole session, 1 s samples |
| Rate against chosen factor | Line graph | bubbles/min vs factor unit | Built point by point as the student steps a control; plateaus appear without being drawn in |
| Limiting factor | Pass-fail badge | — | Names whichever of light, CO₂ or temperature currently caps the rate, and flags when it changes |
| Results table | Data table | mixed | Every counting window with all ten control values attached; exportable CSV |

**What the student should realise.**
Students believe more light always means more photosynthesis, and treat the factors as adding up. The curve refuses to keep rising, and only raising CO₂ lifts the ceiling, so addition cannot be the rule. Green light being bright yet useless separates energy delivered from energy absorbed. The student should be able to say: *"The rate is set by whichever condition is in shortest supply, and adding more of anything else does nothing until you fix that one."*

## C2 · Evidence for where a plant's mass comes from · MS-LS1-6

### C2.1 · The intuitive but wrong answer

**Experiment name:** The Soil Story: Run Your Own Model  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Particle system  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A Central Valley greenhouse bench in flat morning light, split down the middle by a brass rail. On the right stands the real plant: a sunflower seedling in a terracotta pot on a large digital balance, a fine steel pin gauge resting on the soil surface against a millimetre scale, and a cutaway window in the pot wall showing the root ball. On the left is the model board, four glass source tanks labelled SOIL, WATER, AIR and SUNLIGHT, each with a brass tap, a mass gauge and its own colour: umber, blue, grey, gold. When the run starts, coloured mass parcels stream from whichever taps the student opened into the growing plant, and every tank's gauge falls by what it gave. Control panel right, timeline scrubber along the foot.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terracotta pot and soil column | Environment | 22 cm rim pot, 3.10 kg of dry loam filled to a scored line, crumb texture, darkens when watered | Yes: resize |
| 2 | Soil-level pin gauge | Instrument | Steel needle resting on the surface against a 0–50 mm vernier scale; reads to 0.5 mm and never moves on its own | Yes: drag |
| 3 | Sunflower plant | Actor | Six growth stages from 4 cm seedling to 1.4 m plant with 14 leaves and one head; stem thickens, leaves unfurl on schedule | No |
| 4 | Root ball | Structure | Branching white root system visible through a glass cutaway in the pot wall; extends but does not consume the soil crumbs | No |
| 5 | Digital balance (whole pot) | Instrument | 300×300 mm platform, capacity 20 kg, resolution 0.1 g, backlit display, tare button | No |
| 6 | Soil-only balance stand | Instrument | Second pan beside the bench used at harvest, after the plant is lifted out and the soil is sieved and oven-dried | Yes: place |
| 7 | Soil source tank and tap | Instrument | Umber glass cylinder holding 3100 g, brass tap, gauge falling as mass parcels leave | Yes: drag |
| 8 | Water source tank and tap | Instrument | Blue cylinder with a graduated watering can beside it, gauge in grams and in millilitres | Yes: drag |
| 9 | Air source tank and tap | Instrument | Pale grey cylinder of drifting CO₂ molecules, gauge in grams; refills from the greenhouse air | Yes: drag |
| 10 | Sunlight source tank and tap | Instrument | Gold cylinder of photon darts with a locked tap; the lock tooltip states that energy carries no mass | No |
| 11 | Mass parcel | Particle | 1 g cube tinted to its source tank, streams along a visible route into the stem and disappears into the plant | No |
| 12 | Allocation dial set | UI-Probe | Four linked sliders that always renormalise to 100 percent, with the running total shown above them | Yes: drag |
| 13 | Sieve and drying oven | Instrument | 2 mm mesh sieve and a small 105 °C oven for recovering and re-drying the soil at harvest | Yes: place |
| 14 | Prediction versus measurement chart | Overlay | Paired bars per source: what your model spent against what was actually measured, updated each simulated week | No |
| 15 | Mismatch meter | Instrument | Single dial in grams showing the gap between your model and the measurement, turning red beyond 50 g | No |
| 16 | Timeline scrubber | UI-Probe | 0–16 week track with weekly tick marks; scrubbing replays growth and rewinds every gauge | Yes: drag |

**How it works — the model.**
Two engines run side by side on one clock. The belief engine takes the four allocation percentages and moves literal 1 g mass parcels out of those tanks into the plant, decrementing each gauge; if soil is set to 100 percent, the pot must visibly surrender 1.4 kg and the pin gauge must sink accordingly. The measurement engine runs the same plant on logged greenhouse data: fresh mass follows a logistic curve to 1.60 kg over 16 weeks, dry mass is 12 percent of that, applied water is tallied, and the soil, sieved and re-dried at harvest, has lost 2.9 g through mineral uptake alone. Each week the two engines are compared source by source and the gap is reported in grams. The sunlight tap stays locked by construction. The build must never quietly rescale the belief engine to fit the plant; it has to fail visibly, because the failure is the lesson.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Mass from soil | Slider | 0–100 | 60 | percent | Share of new plant mass drawn from the soil tank; the other three renormalise |
| Mass from water | Slider | 0–100 | 25 | percent | Share drawn from the water tank |
| Mass from air | Slider | 0–100 | 10 | percent | Share drawn from the air tank |
| Mass from sunlight | Slider | 0–100 | 5 | percent | Share requested from the locked tank; the sim shows the request being refused |
| Extra soil added | Slider | 0–2000 | 0 | g | Structural: raises the soil column and moves the pin gauge up |
| Fertiliser | Dropdown | None / Low NPK / Full NPK | Low NPK | — | Mineral supply, which caps growth when absent but supplies almost no mass |
| Watering | Slider | 0–500 | 250 | mL/day | Water applied, logged in millilitres and grams |
| Run length | Timeline scrubber | 0–16 | 16 | weeks | How far the growth run plays out before harvest |
| View mode | Radio | Your model / Measured plant / Side by side | Side by side | — | Which pane the bench shows |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The soil story | soil=100; water=0; air=0; sunlight=0; run=16 weeks | Your model spends 1.4 kg of soil. How much soil did the pot actually lose, and by what factor were you out? |
| S2 | The sunlight story | sunlight=100; soil=0; water=0; air=0; run=16 weeks | The gold tap will not open. What can sunlight supply to the plant, and what can it not? |
| S3 | Feed it more soil | extra soil=2000; fertiliser=Low NPK; watering=250; run=16 weeks | You have doubled the soil in the pot. Does the plant finish heavier, and by how much? |
| S4 | Starve the minerals | fertiliser=None; extra soil=0; watering=250; run=16 weeks | The plant grows badly without fertiliser. Does that prove its mass came from the soil? |

**Student activities.**
1. Set the allocation to soil=100 and run all 16 weeks. Record the pin gauge reading at week 0 and week 16 in your model pane.
2. Switch to Measured plant and record the same two pin gauge readings, plus the harvested soil mass from the oven.
3. Set your allocation to what you personally believe, run, and record the mismatch meter value for each of the four sources.
4. Add 2000 g of extra soil and re-run. Record the final plant fresh mass and compare it with the 0 g run.
5. Adjust your allocation until the mismatch meter falls below 50 g and write down the four percentages that got you there.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Plant fresh mass | Live numeric | g | Whole-plant mass on the balance, updated weekly and at harvest |
| Plant dry mass | Live numeric | g | Mass after oven drying at harvest, with water removed |
| Soil mass change | Live numeric | g | Dry soil at harvest minus dry soil at planting, to 0.1 g |
| Soil level | Live numeric | mm | Pin gauge reading, shown for the model pane and the measured pane side by side |
| Predicted versus measured | Bar chart | g | Paired bars per source across the whole run |
| Mismatch per source | Data table | g | Model spend minus measured change for soil, water, air and sunlight; exportable |

**What the student should realise.**
Almost every student starts with the idea that a plant eats soil, and this sim makes them commit to it numerically before testing it. Running the soil model drains 1.4 kg from a pot that really lost under 3 g, and the pin gauge does not move. Minerals matter without supplying mass. The student should be able to say: *"The pot barely changed while the plant gained more than a kilogram, so the plant is not made of soil."*

### C2.2 · Van Helmont's willow tree experiment

**Experiment name:** Van Helmont's Willow: Five Years on a Balance  
**Render mode:** 3D Scene  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A seventeenth-century Brussels garden room seen from a low angle: lime-washed walls, an oak bench, tall leaded windows throwing shafts of daylight across a stone floor. At the centre, on a low plinth, stands a wide glazed earthenware pot, a perforated tin lid collaring the stem where it leaves the soil. The willow begins as a bare sapling barely taller than the pot rim. Behind it waits a brass beam balance with two pans and a rack of graded weights; beside it a rainwater butt with a copper dipper and a measuring jug, and a leather-bound ledger open on a lectern. A seasons wheel turns on the wall, driving the five-year clock, and leaf litter gathers on the flagstones each autumn. Palette: ochre, brass, wet green. Control panel docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Earthenware pot and plinth | Environment | 60 cm rim, cream salt glaze, two lug handles, on a 30 cm stone plinth; holds the soil charge to a scored fill line | No |
| 2 | Oven-dried soil charge | Structure | 90.72 kg of pale dried loam, visible crumb texture, surface scored with a fill line so any change in level is readable | Yes: resize |
| 3 | Drying oven | Instrument | Brick kiln with a sliding iron door and a pyrometer; dries soil at 105 °C and plots mass against time to constant mass | Yes: place |
| 4 | Willow tree | Actor | Growth from a 2.27 kg bare sapling to a 76.74 kg tree over five years: trunk girth 3→28 cm, 4→112 branches, full canopy each summer | No |
| 5 | Perforated tin lid | Structure | Beaten tin disc with a stem collar and 60 pinholes; admits water and air, keeps windblown dust off the soil | Yes: swap |
| 6 | Rainwater butt and jug | Instrument | Oak butt with a copper dipper and a 2 L graduated glass jug; every pour is logged to the ledger | Yes: drag |
| 7 | Beam balance | Instrument | Brass beam, two 50 cm pans, agate knife edge, pointer against an ivory scale; readable to 1 oz as built | Yes: place |
| 8 | Graded weight set | Structure | Brass weights from 2 oz to 56 lb in a fitted mahogany case; stacked on the pan to bring the beam level | Yes: place |
| 9 | Ledger book | Overlay | Leather-bound volume on a lectern; the student writes each weighing into a dated row, and nothing is auto-filled | Yes: drag |
| 10 | Seasons wheel | UI-Probe | Wall-mounted five-year dial with quarter markers; drives leaf-out, growth, autumn shed and dormancy | Yes: drag |
| 11 | Leaf litter pile | Structure | 1.1–1.6 kg of shed leaves each autumn, gathering on the flagstones; either swept to the balance or blown away | Yes: place |
| 12 | Sieve and root-washing tray | Instrument | 2 mm brass sieve over a zinc tray; separates roots from soil at harvest so each can be weighed alone | Yes: place |
| 13 | Soil scoop and moisture probe | Instrument | Iron scoop and a needle probe reading soil water as percent by mass, so wet soil is never weighed as dry | Yes: drag |
| 14 | Atmosphere field | Field | Invisible CO₂ and water-vapour field through the room, tagged NOT WEIGHED in the corner of the frame | No |
| 15 | Mass ledger board | Overlay | Running columns: soil in, soil out, water in, tree mass, litter mass, and an unaccounted line the student must fill | No |
| 16 | Uncertainty band overlay | Overlay | Grey band on every logged value equal to the balance resolution, so a 57 g change can be seen against a 28 g step | No |

**How it works — the model.**
Straight bookkeeping on a five-year clock compressed into about five minutes, scrubbable in both directions. The historical run is reproduced exactly: 90.72 kg of oven-dried soil, a 2.27 kg willow shoot, rainwater only, and after five years a tree of 76.74 kg, a gain of 74.47 kg, with the re-dried soil down by 57 g. Water added accumulates at the watering rate, so 8 L a week for 260 weeks is roughly 2080 kg poured in, almost all of which transpires back into the room. Leaf litter sheds each autumn and enters the ledger only if the student chooses to collect it. Every weighing is quantised to the chosen balance resolution and drawn with an uncertainty band. The engine must never total the unaccounted line itself: that arithmetic, and the discomfort it produces, belongs to the student.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Soil charge | Slider | 50–120 | 90.7 | kg | Mass of oven-dried soil placed in the pot at the start |
| Soil drying time | Slider | 0–48 | 24 | h at 105 °C | How completely soil is dried before and after the run; short drying leaves water in the reading |
| Sapling starting mass | Slider | 1.0–5.0 | 2.27 | kg | Mass of the willow shoot planted on day one |
| Water source | Dropdown | Rainwater / Distilled / Tap / None | Rainwater | — | What is poured, and whether it carries dissolved minerals |
| Watering rate | Slider | 0–20 | 8 | L/week | Volume added and logged each week |
| Pot lid | Toggle | Perforated tin / None | Perforated tin | — | Structural: keeps windblown dust and debris out of the soil |
| Leaf litter | Radio | Collect and weigh / Let it blow away | Let it blow away | — | Structural: whether shed mass ever enters the ledger |
| Balance resolution | Dropdown | 1 oz (28 g) / 1 g / 0.01 g | 1 oz (28 g) | — | Smallest change any weighing can detect, and the width of every uncertainty band |
| Elapsed time | Timeline scrubber | 0–5 | 5 | years | Position in the run; a weighing can be taken at any point on the track |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The 1648 run | soil=90.7; sapling=2.27; water=Rainwater; rate=8; lid=Perforated tin; litter=Let it blow away; balance=1 oz | The tree gained 74.47 kg and the soil lost 57 g. Which explanation does that rule out? |
| S2 | Take the water away | water=None; rate=0; elapsed=1 year | The willow dies in its first summer. What does that prove, and what does it fail to prove? |
| S3 | A modern re-run | balance=0.01 g; litter=Collect and weigh; lid=None; water=Distilled; rate=8 | With the litter weighed and a far better balance, how much mass is still unaccounted for? |
| S4 | Mineral-rich water | water=Tap; rate=8; balance=0.01 g; litter=Collect and weigh | Does tap water grow a heavier tree than distilled, and is the difference anywhere near 74 kg? |

**Student activities.**
1. Weigh the dried soil and the sapling before planting and write both into the ledger with their uncertainty bands.
2. Scrub the seasons wheel to years 1, 2, 3, 4 and 5, weighing the tree at each stop, and record the five masses.
3. At year 5, wash the roots, re-dry the soil for 24 h, weigh it, and record the change from the starting figure.
4. Add up the water poured over the whole run from the ledger and compare that total with the tree's mass gain.
5. Complete the unaccounted line yourself, then switch the balance to 0.01 g and re-run to see whether that line changes.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mass ledger | Data table | kg and g | Soil before and after, water added, tree mass, litter mass, one dated row per weighing; exportable |
| Tree mass against time | Line graph | kg vs years | Five-year growth trace with a marker at every weighing the student took |
| Soil mass change | Live numeric | g | Dry soil at harvest minus dry soil at planting, shown with its uncertainty band |
| Cumulative water added | Live numeric | L and kg | Running total of everything poured into the pot |
| Unaccounted mass | Live numeric | kg | Tree gain minus everything the student has actually weighed; stays blank until they complete the ledger |
| Resolution warning | Pass-fail badge | — | Flags amber whenever a recorded change is smaller than the balance can honestly resolve |

**What the student should realise.**
Van Helmont's numbers kill the soil explanation: 74 kg of new tree against 57 g of missing soil is not a shortfall but a different order of magnitude. But the sim withholds his conclusion: 2080 kg of water went in and was never tracked out, and the air was never weighed. The student should be able to say: *"The soil answer is dead, but this experiment cannot tell me whether it was the water or the air."*

### C2.3 · What the soil-mass evidence actually shows

**Experiment name:** Weigh the Ash: What the Tree Is Made Of  
**Render mode:** 3D Scene  
**Simulation engine:** State machine + Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A modern analytical bench set up beside the harvested willow, two centuries in one frame: the earthenware pot and beam balance sit out of focus behind. In the foreground, discs cut from trunk, branch, root and leaf lie in labelled porcelain crucibles on a stainless tray. A glass-doored drying oven holds one sample on a hanging pan whose mass trace is drawn live. Behind toughened safety glass a muffle furnace glows dull orange, tagged VIRTUAL FURNACE in the corner so nobody mistakes this for a bench procedure. A combustion tube runs from the furnace through two absorption tubes, white soda-lime granules in one, magnesium perchlorate in the other, each standing on its own four-decimal balance. A small vial labelled 57 g sits at the front.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Willow sample set | Actor | Four discs on a tray: trunk wood with growth rings, branch, washed root, and a fresh leaf; each 40 mm across and separately selectable | Yes: swap |
| 2 | Porcelain crucible and tongs | Instrument | 30 mL glazed crucible with a lid and a pair of nickel tongs; carries the sample between balance, oven and furnace | Yes: drag |
| 3 | Analytical balance | Instrument | 200 g capacity, 0.0001 g resolution, inside a glass draught shield with sliding doors and a levelling bubble | No |
| 4 | Drying oven | Instrument | 40 L oven at 40–120 °C with a glass door and a hanging pan on a load cell; plots sample mass against time to constant mass | Yes: place |
| 5 | Muffle furnace | Instrument | 550 °C chamber behind toughened glass, dull orange glow, digital setpoint, clearly tagged as simulated | Yes: place |
| 6 | Combustion tube and oxygen stream | Instrument | 25 mm silica tube through the furnace with a metered oxygen flow, carrying combustion gases forward to the absorbers | Yes: connect |
| 7 | Soda-lime absorption tube | Instrument | U-tube of white granules that trap CO₂ and gain mass; sits on its own balance so the gain is read directly | Yes: connect |
| 8 | Magnesium perchlorate tube | Instrument | Second U-tube trapping water vapour and gaining mass; also on its own balance | Yes: connect |
| 9 | Ash residue | Structure | Pale grey-white powder left in the crucible, 1–5 percent of the dry mass, visibly real and not a trace | No |
| 10 | Flame-test rack | Instrument | Nichrome loop and a burner with reference colour cards for potassium lilac, calcium orange-red and sodium yellow | Yes: drag |
| 11 | Soil-loss vial | Structure | Stoppered 50 mL vial holding the 57 g the pot lost in C2.2, labelled and placed for direct comparison with the ash | Yes: drag |
| 12 | Element pie board | Overlay | Circular chart splitting dry mass into C, H, O, N and mineral ash, redrawn after each analysis stage | No |
| 13 | Mass-flow Sankey overlay | Overlay | Flow diagram from fresh mass, splitting to water and dry mass, then dry mass splitting to CO₂, H₂O and ash, widths to scale | No |
| 14 | Element ledger | Overlay | Grams of each element found, alongside the same figures as percentages of dry mass | No |
| 15 | Whole-tree extrapolator | Instrument | Scales any sample result up to the 76.74 kg tree, showing the arithmetic and the assumption it rests on | Yes: drag |
| 16 | Conclusion scope cards | UI-Probe | Four draggable cards stating candidate conclusions; each turns green, amber or red against the evidence actually gathered | Yes: place |

**How it works — the model.**
Three gravimetric stages run on one sample. Drying at 105 °C to constant mass splits fresh mass into water and dry mass, using tissue-specific water fractions: leaf 0.78, young stem 0.62, trunk wood 0.45, root 0.68 of fresh mass. Ashing at 550 °C splits dry mass into volatile matter and ash, ash being 1.2 percent of trunk dry mass and 4.8 percent of leaf. With the absorption tubes fitted, the volatile matter is caught as CO₂ on soda lime and as H₂O on magnesium perchlorate, and each tube's mass gain converts back to grams of carbon, hydrogen and oxygen. Every mass is quantised to the chosen balance resolution. Above 700 °C some potassium volatilises and the ash reads low, which is a real and instructive error. The build must keep the ash visibly non-zero, because "it all burns away to nothing" is the mirror misconception to "it is all soil".

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample tissue | Dropdown | Leaf / Young stem / Trunk wood / Root / Whole-tree composite | Trunk wood | — | Structural: which disc goes into the crucible, and its water and ash fractions |
| Sample fresh mass | Slider | 1–50 | 10.000 | g | How much tissue is analysed, and therefore how large every later reading is |
| Oven temperature | Slider | 40–120 | 105 | °C | Drying setpoint; below 100 °C the sample never reaches constant mass |
| Drying time | Slider | 0–48 | 24 | h | How close the sample gets to constant mass before it is weighed |
| Ashing temperature | Slider | 300–800 | 550 | °C | Furnace setpoint; above 700 °C minerals volatilise and the ash reads low |
| Absorption tubes | Dropdown | None / CO₂ only / CO₂ and H₂O | CO₂ and H₂O | — | Structural: which combustion products are captured and weighed |
| Balance resolution | Dropdown | 0.1 g / 0.001 g / 0.0001 g | 0.0001 g | — | Smallest mass change the bench can detect |
| Mineral assay | Dropdown | Off / Flame test / Full elemental | Flame test | — | Which elements the ash is identified as containing |
| Compare with soil vial | Toggle | On / Off | On | — | Overlays the 57 g soil loss against the whole-tree ash figure |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Take out the water | tissue=Leaf; fresh=10.000; oven=105; drying=24; tubes=None | What fraction of a fresh leaf is water, and does that water belong to the tree's dry mass at all? |
| S2 | Burn what is left | tissue=Trunk wood; fresh=10.000; ashing=550; tubes=None | Only a small grey residue remains. What percentage of the dry wood was ash, and what is that ash? |
| S3 | Catch what escaped | tissue=Trunk wood; fresh=10.000; tubes=CO₂ and H₂O; ashing=550; balance=0.0001 g | Both tubes gain mass. Which elements left the wood, and in what form did they leave? |
| S4 | Match it to the soil | tissue=Whole-tree composite; compare=On; balance=0.0001 g | The whole tree's ash and the pot's 57 g loss are the same order of size. What exactly does that match explain? |

**Student activities.**
1. Weigh a 10.000 g fresh leaf disc, dry it for 24 h at 105 °C, and record the dry mass and the water percentage.
2. Ash the dried sample at 550 °C and weigh the crucible again. Record the ash mass and its percentage of dry mass.
3. Fit both absorption tubes, repeat the combustion, and record the mass gained by each tube separately.
4. Convert those two gains into grams of carbon, hydrogen and oxygen using the element ledger, and record all three.
5. Extrapolate to the whole 76.74 kg tree, place the soil vial alongside the ash figure, and sort the four scope cards into supported and unsupported.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Fresh, dry and ash mass | Data table | g | One row per analysis with all three masses to the chosen resolution; exportable |
| Water and ash percentages | Live numeric | percent | Water as a share of fresh mass and ash as a share of dry mass, updated at each stage |
| Absorption tube gains | Live numeric | g | Mass gained by the soda-lime tube and the magnesium perchlorate tube, read separately |
| Element split | Bar chart | percent of dry mass | C, H, O, N and mineral ash side by side, rebuilt after every run |
| Mass-flow diagram | Heat map | g | Sankey flow from fresh mass through water and dry mass to CO₂, H₂O and ash, widths drawn to scale |
| Whole-tree extrapolation | Live numeric | kg | Sample result scaled to 76.74 kg, with the ash total set against the 57 g soil loss |
| Scope card verdict | Pass-fail badge | — | Green, amber or red for each candidate conclusion, with the reason stated |

**What the student should realise.**
It is tempting to jump from "the soil barely changed" to "so it came from the air". This bench measures instead: almost half the fresh mass is water, the ash is a percent or two and matches the soil's 57 g loss closely, and the rest leaves as carbon dioxide and water vapour when burned. The student should be able to say: *"The tree is mostly carbon, hydrogen and oxygen, and the soil supplied the minerals, not the mass."*

### C2.4 · Building the case for air and water

**Experiment name:** Labelled Atoms: Tracing the New Mass  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A sealed growth chamber the size of a fridge stands in a clean plant-science lab: acrylic on all four faces, a gasketed door, a pressure gauge and a rubber septum on the flank. Inside, a young sunflower stands under a white LED panel, its leaves stirring faintly in the circulation fan's draught. On the left, two gas cylinders sit in a rack, one banded charcoal for ordinary carbon dioxide, one cyan for the labelled kind, feeding brass valves and a glass flow meter. Beneath them, two water reservoirs, one clear and one banded magenta. On the right stands a bench mass spectrometer with a live spectrum on its screen. Along the foot runs the atom map, where labelled atoms glow cyan and magenta against ordinary grey, red and white.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sealed growth chamber | Environment | 900×600×600 mm acrylic cabinet, silicone door gasket, pressure gauge on the flank, septum sampling port, internal circulation fan turning at 400 rpm | Yes: swap |
| 2 | Sunflower plant | Actor | 35 cm plant with 6 leaves growing to 9 over the run; leaf area and stem thickness both increase on the logged growth curve | No |
| 3 | LED grow panel | Instrument | 300×300 mm white panel above the plant, 0–800 µmol m⁻² s⁻¹, on a programmable day-night timer | Yes: place |
| 4 | Ordinary CO₂ cylinder | Instrument | Charcoal-banded steel cylinder with a two-stage regulator and a pressure dial; supplies ¹²C¹⁶O₂ | Yes: connect |
| 5 | Labelled CO₂ cylinder | Instrument | Cyan-banded cylinder, identical fittings; supplies either ¹³CO₂ or C¹⁸O₂ depending on the label chosen | Yes: connect |
| 6 | Ordinary water reservoir | Instrument | 2 L clear vessel with a peristaltic feed line to the pot and a graduated sight tube | Yes: connect |
| 7 | Labelled water reservoir | Instrument | 2 L magenta-banded vessel of H₂¹⁸O, identical feed line, so the plant cannot tell them apart | Yes: connect |
| 8 | Valves, flow meter and septum | Instrument | Brass needle valves, a glass rotameter with a floating ball, and a self-sealing septum for drawing gas samples | Yes: drag |
| 9 | CO₂ analyser | Instrument | Infrared analyser on the chamber return line, 0–2000 ppm, 1 s logging, digital display on the cabinet face | No |
| 10 | Oxygen sample loop | Instrument | Stainless loop drawing chamber gas through a drier and into the spectrometer inlet at 20 mL/min | Yes: connect |
| 11 | Mass spectrometer | Instrument | Bench unit with a 60 cm flight tube and a screen plotting counts against m/z, markers preset at 32, 34, 36, 44, 45 and 46 | No |
| 12 | Harvest station | Instrument | 8 mm leaf punch, a small freeze-drier, and numbered sample vials on a rack; the punch leaves a visible hole in the leaf | Yes: drag |
| 13 | Atom map | Overlay | Molecules from the harvested tissue drawn atom by atom, glucose, starch chain and cellulose; labelled atoms glow cyan or magenta | Yes: drag |
| 14 | Label-origin counter | Overlay | Per element, the share of atoms in the sample tagged as coming from chamber gas, from irrigation water, or from the original seedling | No |
| 15 | Dark control chamber | Environment | Identical second cabinet with the LED panel off and the same gas and water supply; grows nothing and takes up no label | Yes: swap |
| 16 | Evidence card printer | Instrument | Small thermal printer that issues a card carrying this run's settings and results, to be used in C2.5 | Yes: place |

**How it works — the model.**
Isotopes are the only difference: ¹³C behaves chemically like ¹²C and ¹⁸O like ¹⁶O, so nothing about growth changes when the label is switched on. Every carbon fixed into new tissue inherits the isotope ratio of the chamber gas at the moment it was fixed, and every hydrogen inherits the ratio of the water in the xylem. The engine keeps a per-atom origin tag, so any harvested molecule can be interrogated atom by atom. Two results carry the whole argument and the build must get both right. First, carbon in new dry mass traces to the chamber gas, so labelling the air labels the plant. Second, the oxygen released as O₂ traces to water and not to carbon dioxide, reproducing Ruben and Kamen's 1941 result: label the water and the released O₂ shifts from m/z 32 to 34, but label the oxygen in the CO₂ instead and the released O₂ stays at 32.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| CO₂ label | Dropdown | None (¹²C¹⁶O₂) / Heavy carbon (¹³CO₂) / Heavy oxygen (C¹⁸O₂) | Heavy carbon (¹³CO₂) | — | Which atom in the chamber gas carries a traceable tag |
| Water label | Dropdown | None (H₂¹⁶O) / Heavy oxygen (H₂¹⁸O) | None (H₂¹⁶O) | — | Whether the irrigation water carries a traceable tag |
| Label strength | Slider | 0–100 | 95 | percent enrichment | How strongly the labelled supply is enriched; low values make the peak hard to separate |
| Chamber CO₂ | Slider | 100–1500 | 420 | ppm | Gas concentration held inside the cabinet by the regulator |
| Light period | Slider | 0–24 | 16 | h/day | Daily photoperiod under the LED panel |
| Run length | Timeline scrubber | 1–21 | 14 | days | How long the plant grows in the labelled atmosphere before harvest |
| Chamber seal | Toggle | Sealed / Vented | Sealed | — | Structural: vented admits outside air and dilutes the label over hours |
| Dark control | Toggle | On / Off | On | — | Structural: runs the identical second cabinet with the lights off |
| Harvest tissue | Dropdown | New leaf / Old leaf / Stem / Root / Starch grain | New leaf | — | Which tissue is punched, freeze-dried and analysed |
| Analyse | Dropdown | Chamber O₂ / Chamber CO₂ / Plant tissue | Plant tissue | — | What the sample loop feeds into the spectrometer |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Label the air | CO₂ label=Heavy carbon; water label=None; strength=95; run=14 days; seal=Sealed; tissue=New leaf; analyse=Plant tissue | What share of the carbon in brand-new leaf tissue carries the tag, and where must that carbon have come from? |
| S2 | Where the oxygen comes from | water label=Heavy oxygen; CO₂ label=None; run=7 days; analyse=Chamber O₂ | The oxygen leaving the plant is heavy. Which of the two inputs supplied it? |
| S3 | The other way round | CO₂ label=Heavy oxygen; water label=None; run=7 days; analyse=Chamber O₂ | Now the carbon dioxide carries the heavy oxygen. Why does the released O₂ stay light? |
| S4 | Broken seal and dark control | seal=Vented; dark control=On; CO₂ label=Heavy carbon; run=14 days; tissue=New leaf | Compare lit against dark, and vented against sealed. What has happened to the strength of your evidence? |

**Student activities.**
1. Set the CO₂ label to heavy carbon, seal the chamber, run 14 days, and record the labelled fraction of carbon in a new leaf.
2. Harvest an old leaf and a root from the same plant and record their labelled fractions. Explain the difference in one sentence.
3. Switch to heavy-oxygen water, analyse the chamber oxygen, and record the m/z peaks you see and their relative heights.
4. Repeat with heavy oxygen in the CO₂ instead of the water. Record the peaks again and state which input the released oxygen came from.
5. Print the evidence card for your two strongest runs and note the sample size and the seal state recorded on each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mass spectrum | Line graph | counts vs m/z | Live trace with markers at 32, 34 and 36 for oxygen and 44, 45 and 46 for carbon dioxide |
| Labelled atom fraction | Live numeric | percent | Share of C, H and O atoms in the sampled tissue carrying a label, reported per element |
| Atom-origin split | Bar chart | percent of atoms | Where each element in new dry mass came from: chamber gas, irrigation water, or the original seedling |
| Chamber CO₂ trace | Line graph | ppm vs h | Falls through each light period as carbon is fixed, rises in darkness as the plant respires |
| Dry mass gain | Live numeric | g | New dry mass over the run, lit chamber and dark control shown side by side |
| Evidence card | Data table | mixed | Printed record of settings, results, sample size and seal state; carried forward into C2.5 |

**What the student should realise.**
Students who give up on soil land on "the plant breathes carbon dioxide in and the same oxygen out". The labels break it: the carbon in new tissue was in the air, the hydrogen came from water, and the released oxygen carries the water's label, not the carbon dioxide's. The student should be able to say: *"The tree's mass is carbon from the air and hydrogen from water, and the oxygen we breathe was split out of water."*

### C2.5 · Evaluating, not asserting, the conclusion

**Experiment name:** The Warrant Test: Does Your Evidence Hold?  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model + Agent-based  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-6

**Theme & scene.**
A dark slate review table seen from directly above, lit like a boardroom at night. Dead centre is an empty claim slot, a raised brass frame waiting for a sentence. Down the left runs a card rack holding every run made across this unit: the willow ledger, the ash bench, the isotope chamber, the bubble counter, the dark control, the soil-model board, the starch test. Each card carries a miniature chart, its sample size, whether a control was run, and its instrument resolution. Ribbons drag from any card to the claim slot and glow green, amber or red as they land. Down the right stand three dials under glass: Relevance, Sufficiency and Control. Along the bottom edge a challenger panel deals objection cards face up, one at a time.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Claim slot and builder | UI-Probe | Brass sentence frame with three word wells: strength, verb and source; assembled words snap in and lock the claim's scope | Yes: drag |
| 2 | Evidence card | Structure | 90×140 px card carrying a thumbnail chart, run ID, n, control state, instrument resolution and the variable measured | Yes: drag |
| 3 | Card rack and filters | Instrument | Left-hand rail holding 7 base cards plus any requisitioned ones, with filter chips for topic, controlled and replicated | Yes: place |
| 4 | Reasoning ribbon | Overlay | Drawn link from a card to the claim slot, 4 px, green when the card measures a variable inside the claim's scope, amber when adjacent, red when irrelevant | Yes: connect |
| 5 | Warrant dials | Instrument | Three brass dials under glass, 0–100 each, needles moving live as ribbons are attached and objections are answered | No |
| 6 | Reviewer B | Actor | Challenger agent shown as a small silhouette at the table's foot; deals one objection card whenever a rule trips, and never repeats a closed one | No |
| 7 | Objection card set | Structure | Twelve printed objections: no control, sample of one, confound uncontrolled, change below resolution, scope overreach, correlation not cause, and six more | Yes: drag |
| 8 | Confound flag pin | Instrument | Red pin the student sticks into any card to declare a known confound; costs Control points until it is answered | Yes: place |
| 9 | Plot canvas | Overlay | 420×300 px panel that re-plots the raw data behind any selected card as scatter, bar or line | Yes: swap |
| 10 | Annotation pin | Instrument | Numbered pin dropped anywhere on the plot canvas with a short typed note attached, saved to the certificate | Yes: place |
| 11 | Uncertainty band renderer | Overlay | Draws each card's stated instrument resolution as a grey band on its chart, so unresolvable changes are visible as noise | No |
| 12 | Alternative-explanation tray | Structure | Shelf of rival explanation tiles; each stays lit until a card is linked that excludes it | Yes: place |
| 13 | Scope-gap ruler | Instrument | Horizontal bar comparing the claim's scope with the combined scope of the linked cards; the unfilled part is the gap | No |
| 14 | Missing-evidence detector | Overlay | Lists the specific measurements the claim needs and the rack does not contain, naming the lab that could supply each | No |
| 15 | Requisition slip | Instrument | Tear-off slip that sends a request to the rate lab, willow rig, ash bench or isotope chamber and returns a new card | Yes: drag |
| 16 | Conclusion certificate | Overlay | Printed claim, evidence, reasoning and verdict, exportable as a CER document with every dial reading attached | Yes: drag |

**How it works — the model.**
A rubric engine, not an answer key. Each card carries tags: the variable it measured, whether a control was run, sample size, instrument resolution and provenance. The claim carries a scope built from its strength and source. Three sub-scores run 0–100. Relevance is the fraction of linked cards whose measured variable falls inside the claim's scope. Sufficiency is coverage: a claim about all of a plant's mass needs a carbon result, a hydrogen result and a total that adds up; a claim about most of the dry mass needs the drying and ashing data. Control subtracts for every rival left lit on the tray with no card excluding it, and for every card whose reported change is below its own instrument resolution. Reviewer B deals an objection each time a rule trips, and it stays open until answered. Crucially the engine can mark a correct conclusion unwarranted, because a right answer reached from one uncontrolled run scores nothing on Control.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Claim strength | Dropdown | All of a plant's mass / Most of a plant's dry mass / Some of a plant's mass | Most of a plant's dry mass | — | Sets how much scope the evidence has to cover |
| Claim source | Dropdown | Soil / Water / Air / Sunlight / Air and water | Air and water | — | The second half of the sentence in the claim slot |
| Evidence linked | Multi-select | Willow ledger / Ash bench / Isotope chamber / Bubble rate lab / Dark control / Soil-model board / Starch test | Willow ledger, Isotope chamber | — | Which cards are ribboned to the claim |
| Rivals to exclude | Multi-select | Minerals from soil / Dust through the lid / Uncollected leaf litter / Balance error / Water alone | Minerals from soil, Water alone | — | Which alternative explanations sit lit on the tray demanding an answer |
| Reviewer strictness | Radio | Novice / Standard / Strict | Standard | — | How many rules Reviewer B enforces and how far the dials must move to pass |
| Uncertainty bands | Toggle | On / Off | On | — | Draws each card's instrument resolution onto its chart |
| Replicates available | Dropdown | n=1 / n=3 / n=12 | n=3 | — | Structural: how many archived repeats of each run exist as separate cards |
| Request a measurement | Dropdown | None / Rate lab / Willow rig / Ash bench / Isotope chamber | None | — | Structural: issues a requisition and adds the returned card to the rack |
| Plot variable | Dropdown | Mass gain / Soil change / Ash percent / Labelled fraction / Bubble rate | Labelled fraction | — | What the plot canvas draws from the currently selected card |
| Scoring mode | Radio | Practice / Graded | Practice | — | Whether Reviewer B hints at an objection before it fires |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Van Helmont's own conclusion | strength=All of a plant's mass; source=Water; evidence=Willow ledger; rivals=all five; strictness=Standard | This is exactly what he concluded in 1648. What does it score, and which dial fails hardest? |
| S2 | The soil verdict | strength=Most of a plant's dry mass; source=Soil; evidence=Willow ledger, Soil-model board; rivals=all five | Can any card on the rack support this claim at all? What does the missing-evidence detector list? |
| S3 | The full case | strength=Most of a plant's dry mass; source=Air and water; evidence=Willow ledger, Ash bench, Isotope chamber, Dark control; rivals=all five | All three dials should clear. Remove one card at a time: which removal costs the most? |
| S4 | Right for the wrong reasons | strength=All of a plant's mass; source=Air and water; evidence=Starch test; replicates=n=1; strictness=Strict | The claim is essentially correct. Why is it still marked unwarranted? |

**Student activities.**
1. Assemble the claim "Most of a plant's dry mass comes from air and water" in the slot and record all three dial readings before linking any evidence.
2. Drag ribbons from the willow ledger and the isotope chamber. Record how each dial moves and which ribbon turned amber, and say why.
3. Answer every objection Reviewer B deals, using either a card or a requisition. Record how many you could not close and what each one demanded.
4. Remove the ash bench card and re-score. Record the drop in Sufficiency and write one sentence on what that card was doing for you.
5. Change the claim to "All of a plant's mass comes from air", re-score with the same evidence, and record which dial collapses.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Warrant score | Live numeric | 0–100 | Combined score, recomputed the moment any ribbon, card or claim word changes |
| Three dials | Bar chart | 0–100 each | Relevance, Sufficiency and Control shown separately so a failure can be diagnosed rather than guessed |
| Objections outstanding | Counter | count | Unanswered cards from Reviewer B, each printed with the rule that triggered it |
| Evidence-claim matrix | Data table | mixed | Every linked card against every element of the claim's scope, marked supports, silent or contradicts |
| Missing-evidence list | Data table | — | The measurements the claim requires and the rack lacks, each naming the lab that could supply it |
| Conclusion certificate | Pass-fail badge | — | Warranted, partially warranted or unwarranted, with reasons and dial readings; exportable as a CER document |

**What the student should realise.**
Students treat a conclusion as sound the moment it is correct, and treat agreement as evidence. Here a right answer from one uncontrolled run scores below a careful, narrower claim, and Van Helmont's conclusion fails the Control dial on his own data. Warrant is a property of the reasoning, not of the answer. The student should be able to say: *"Being right is not the same as being justified — my evidence has to rule out the other explanations too."*

## C3 · Cellular respiration · MS-LS1-7

### C3.1 · Naming the inputs

**Experiment name:** Supply Line: What a Mitochondrion Orders  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
Inside the calf muscle of a hiker three hours up a Sierra trail. The camera sits in pale straw cytosol, three-quarters on, with a capillary running diagonally behind a translucent plasma membrane; red blood cells shoulder through it in single file, each flaring from maroon to bright scarlet as it lets go of oxygen. Filling the lower right of the frame is one mitochondrion: a bean the colour of warm ochre, its outer membrane pocked with pale barrel-shaped pores, its interior opened by a cutaway that shows the inner membrane folded into deep parallel shelves. Glucose rings drift in from the left, tumbling. A scale bar reads 1 µm. The control panel docks right; a tally board floats top-left, counting every molecule that crosses in.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Capillary lumen and endothelium | Environment | Tube 7 µm bore running diagonally through the back third of the frame; wall one endothelial cell thick, pale pink, semi-transparent so cargo is visible through it | No |
| 2 | Red blood cell | Actor | Biconcave disc 7.5 µm across, 2 µm thick, deforming to squeeze the bore; carries ~270 million haemoglobin tetramers drawn as a dense internal speckle; surface hue drives from scarlet (loaded) to maroon (unloaded) with saturation | Yes: drag |
| 3 | Haemoglobin tetramer | Structure | Four-lobed protein, 5.5 nm, each lobe holding one orange-brown haem iron; releases up to 4 O₂; lobes rotate 15° on release so unloading is visible in the loupe | No |
| 4 | Oxygen molecule (O₂) | Particle | Two red CPK spheres, covalent radius 0.66 Å scaled ×40, joined by a double-bond twin cylinder at 121 pm; countable; Brownian walk at 500 m/s scaled | No |
| 5 | Glucose molecule (C₆H₁₂O₆) | Particle | Pyranose chair ring: 6 charcoal carbons (0.76 Å), 12 white hydrogens (0.31 Å), 6 red oxygens (0.66 Å); C–C 154 pm, C–H 109 pm, C–O 143 pm; ring puckers slowly; each molecule carries its own atom label on hover | No |
| 6 | Muscle-fibre plasma membrane | Structure | Phospholipid bilayer 5 nm thick, heads violet, tails pale yellow, lipids swapping laterally ~1 per 0.4 s; curved across the frame's mid-plane | No |
| 7 | GLUT4 glucose transporter | Actor | Twelve-helix clamshell barrel, teal, 4 nm across; binds one glucose, rocks 180°, releases it inside; cycle time 12 ms so it saturates | Yes: place |
| 8 | Cytosol and glycolysis bench | Actor | Straw-coloured volume with ten pale enzyme blobs strung in a loose line; a glucose entering the line leaves as two three-carbon pieces plus 2 ATP; sits entirely outside the mitochondrion, and is labelled so | No |
| 9 | Pyruvate molecule | Particle | Three charcoal carbons, 3 red oxygens, 4 hydrogens; short kinked chain 0.9 nm; drifts to the mitochondrial surface | No |
| 10 | Mitochondrial outer membrane and porins | Structure | Smooth ellipsoid shell 2.4 × 0.9 µm, 7 nm thick, ochre; studded with 60 pale barrel porins (VDAC), bore 2.5 nm, permanently open to small molecules | No |
| 11 | Intermembrane space | Structure | 15 nm gap between the two membranes, tinted faintly blue where protons accumulate; the tint deepens as the electron transport chain runs | No |
| 12 | Inner membrane folded into cristae | Structure | Continuous sheet folded into 14 lamellar shelves reaching two-thirds across the interior; crista junctions 25 nm; total area 3.5× the outer membrane at default fold setting | Yes: resize |
| 13 | Matrix | Environment | Dense amber gel filling between the shelves; contains loose Krebs enzymes as small ochre grains and one circular mtDNA nucleoid | No |
| 14 | ATP synthase rotor | Actor | Mushroom 22 nm tall: 10 nm F1 head on a stalk, c-ring of 8 subunits in the membrane; sits in double rows along the crista rims; spins visibly, 3 ATP per revolution | No |
| 15 | ATP and ADP tokens | Particle | ATP drawn as a three-phosphate tail with the terminal phosphate glowing amber; ADP identical minus the glow and one phosphate; leave through the porins and stream toward the myosin heads | No |
| 16 | Delivery tally and atom inventory | Overlay | Top-left board: glucose in, O₂ in, CO₂ out, H₂O out, ATP made, plus a live C / H / O element count and a fixed 1 µm scale bar | No |

**How it works — the model.**
Two independent supply chains feed one consumer. Glucose entry rate is set by GLUT4 count × cycle rate and saturates; oxygen entry is pure diffusion, proportional to the blood-to-cytosol partial-pressure difference. Inside, the engine runs strict stoichiometry: one glucose consumed requires six O₂ and yields six CO₂, six H₂O and about 32 ATP. Rate is set by whichever input is currently scarcer, so ATP output tracks the minimum, never the sum. Demand raises the myosin ATP draw; if draw exceeds supply, the ATP pool falls and the myosin heads visibly slow. Below about 60% saturation the cytosolic bench keeps running without the mitochondrion and lactate accumulates, which is why glycolysis is drawn outside the organelle from the first frame. The failure to avoid is any animation showing oxygen being consumed as fuel: oxygen must always be seen ending up in the products, never disappearing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Blood glucose | Slider | 2.0–12.0 | 5.0 | mmol/L | Number of glucose rings in the capillary and the uptake driving force |
| Blood oxygen saturation | Slider | 40–100 | 98 | % | O₂ carried per red blood cell and the diffusion gradient into the fibre |
| Altitude | Dropdown | Sea level / 1,500 m / 3,000 m / 4,300 m (Mt Whitney) | Sea level | m | Resets saturation to 98 / 93 / 86 / 70% and tints the sky in the corner vignette |
| Muscle demand | Slider | 1–12 | 2 | × resting | Myosin cycling rate and therefore the ATP draw |
| GLUT4 transporters | Stepper | 0–40 | 12 | count | Maximum glucose uptake rate; transporters appear in the membrane as you add them |
| Mitochondria in the fibre section | Stepper | 1–6 | 2 | count | How many organelles exist to process the supply |
| Capillary clamp | Toggle | Open / Clamped | Open | — | Halts both deliveries at the same instant |
| Cutaway depth | Slider | 0–100 | 60 | % | Clip plane through the mitochondrion, from intact shell to fully opened matrix |
| Atom inventory | Toggle | On / Off | On | — | Shows the live C, H and O counts on the tally board |
| Playback speed | Dial | 0.1×–10× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Trail pace | Blood glucose=5.0; Blood oxygen saturation=98; Muscle demand=2; GLUT4 transporters=12 | For every one glucose that goes in, how many oxygen molecules go in with it? Read it off the tally, do not guess. |
| S2 | Full tank, no fuel | Blood glucose=2.0; Blood oxygen saturation=98; Muscle demand=6 | Oxygen is arriving faster than ever and the ATP rate still collapses. Is oxygen the fuel? |
| S3 | Whitney summit | Altitude=4,300 m (Mt Whitney); Blood glucose=5.0; Muscle demand=6 | Saturation falls to 70%. Which input is short now, and what appears in the cytosol that was not there at sea level? |
| S4 | Tourniquet | Capillary clamp=Clamped; Muscle demand=4; Mitochondria in the fibre section=2 | Both deliveries stop at once. Which of the two inputs runs out first inside the fibre, and why that one? |

**Student activities.**
1. Run S1 for 60 simulated seconds and record the tally totals for glucose in, oxygen in, carbon dioxide out and ATP made. Write the glucose-to-oxygen ratio as a whole number pair.
2. Drag eight more GLUT4 transporters onto the plasma membrane, set demand to 6, re-run, and record the ATP rate before and after.
3. Set glucose to 2.0 with saturation at 98, then glucose to 5.0 with saturation at 55. Record the ATP rate for both runs and write the one sentence that explains both results.
4. Step the altitude dropdown through all four settings at demand 6, recording ATP rate each time, and plot ATP rate against altitude.
5. Open the cutaway to 100% and follow one glucose from the capillary to the point its carbons reach the matrix. List every membrane it crosses, in order, and name the compartment it is in at each stage.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Molecules delivered | Counter | count | Glucose and O₂ arriving at the fibre, totalled per 10 simulated seconds |
| Input ratio | Live numeric | O₂ per glucose | Running ratio of the two consumption counts; settles on 6.0 |
| Atom inventory | Data table | atoms | Live C, H and O totals held in reactants, in products and in transit; the grand total never changes |
| ATP production rate | Live numeric | ATP/s | Rotor revolutions × 3, summed over all mitochondria, refreshed every 0.5 s |
| ATP pool | Line graph | ATP tokens vs s | Supply minus demand; falls visibly whenever draw beats delivery |
| Limiting input flag | Pass-fail badge | — | Names whichever input is currently capping the rate, or reads "neither" |
| Run log | Data table | mixed | Exportable CSV, one row per simulated 5 s, every counter and every control setting |

**What the student should realise.**
Students believe oxygen is the fuel, that breathing supplies energy directly, and that food and air are two separate stories. Here the ATP rate collapses in exactly the same way whichever input is starved, and the tally settles stubbornly on six oxygen molecules for every one glucose. The student should be able to say: *"A cell needs both, in a fixed ratio. Oxygen is not the fuel, it is what the fuel gets taken apart with."*

### C3.2 · Naming the outputs

**Experiment name:** The Exhaust Test: Proving What Comes Out  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + State machine (reagent chemistry)  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
A school lab bench under cool white light, shot straight on so the whole gas train reads as a line of apparatus left to right. At the left, a squat aquarium pump feeds air through a soda-lime tower; then a sealed borosilicate chamber, one litre, its ground-glass lid clipped down, holding a bed of germinating peas swollen and split with pale radicles. Downstream: a cold finger beaded with condensate, a strip of blue paper turning at its base, a bulb of clear limewater, a vial of orange indicator, and two probe leads running to a data logger. Behind the glass, a vacuum flask with a thermistor in the seeds. A small molecular window floats top-right. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sealed respirometer chamber | Structure | Borosilicate cylinder 90 mm × 160 mm, 1 L, ground-glass lid with two hose barbs and a silicone gasket; contents visible; fogs internally when humidity passes 90% | Yes: swap |
| 2 | Germinating pea seeds | Actor | 40 wrinkled seeds, 8 mm, pale green swelling to split coats with 5 mm white radicles; respire at 1.2 mL O₂ per gram per hour at 20 °C; radicles elongate visibly over a long run | Yes: place |
| 3 | Boiled seed control | Actor | Identical seeds, dulled and darkened, dosed with antiseptic so nothing microbial grows on them; zero metabolic rate by construction | Yes: swap |
| 4 | House crickets | Actor | Six 18 mm insects, tan with darker banding, moving in short hops; respire at 2.6 mL O₂ per gram per hour; a mesh floor keeps them off the probe | Yes: swap |
| 5 | Yeast and glucose flask | Actor | Cloudy beige suspension, 100 mL, with a foam head that builds; produces CO₂ with or without oxygen, which is the awkward case the student meets in S4 | Yes: swap |
| 6 | Soda-lime inlet scrubber | Instrument | Clear tower 30 mm × 200 mm of white granules turning violet as they load; removes CO₂ from incoming air to below 5 ppm | Yes: swap |
| 7 | Air pump and flow meter | Instrument | Diaphragm pump with a ball-in-tube rotameter, 0–200 mL/min, ball height tracks the set flow | No |
| 8 | Cold finger condenser | Instrument | Chilled glass finger at 4 °C hanging in the gas stream; droplets nucleate, grow and run into a graduated 2 mL collector | No |
| 9 | Water detectors | Instrument | Cobalt chloride paper strip, blue when dry and pink above 40% relative humidity, plus a side tube of white anhydrous copper(II) sulfate that turns blue when wetted; both are threshold state machines with a stated trigger | Yes: place |
| 10 | Limewater bulb | Instrument | 25 mL of clear calcium hydroxide solution in a bubbler; turbidity rises with cumulative CO₂ passed, from clear through milky to a chalky precipitate | No |
| 11 | Hydrogencarbonate indicator vial | Instrument | 10 mL of orange-red solution; goes yellow as CO₂ rises, magenta as CO₂ falls below atmospheric, with the colour keyed to a printed scale on the vial | Yes: place |
| 12 | Carbon dioxide probe | Instrument | NDIR sensor, 0–10,000 ppm, ±30 ppm, 20 s response, mounted in the chamber headspace | No |
| 13 | Oxygen probe | Instrument | Galvanic cell, 0–25% O₂, ±0.1%, in the same headspace | No |
| 14 | Vacuum flask and thermistor | Instrument | 250 mL insulated flask holding a second seed sample with a bead thermistor in the middle, 0.05 °C resolution, plus an identical flask of boiled seeds beside it | Yes: swap |
| 15 | Molecular inset window | Overlay | 300 px window on the matrix interior: carbons leaving as CO₂, hydrogens and oxygen combining into H₂O at the end of the inner membrane, ATP synthase rotors spinning; drawn to the same CPK scheme used elsewhere | No |
| 16 | Mass and atom ledger | Overlay | Running dry mass of the sample, cumulative CO₂ carbon, cumulative water, cumulative joules of heat, and a C / H / O balance that must close | No |

**How it works — the model.**
The chamber is a well-mixed gas volume solved as a mass balance each tick: CO₂ in equals production minus washout, O₂ likewise. Production is mass × specific rate × Q₁₀^((T−20)/10) with Q₁₀ = 2, and the respiratory quotient fixes CO₂ made per O₂ used at 1.0 for the starch-fed seeds. Water vapour is produced in the same ratio and condenses on the cold finger once the stream is chilled below its dew point. Metabolic heat is 470 kJ per mole of O₂ consumed, fed into the flask's thermal mass with a loss term to the room. Every reagent is a threshold state machine with a stated trigger, not a decoration. The inlet scrubber is the argument of the whole experiment: with incoming CO₂ at under 5 ppm, any CO₂ the probe reads was made inside the chamber and nowhere else.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Chamber contents | Dropdown | Germinating peas / Boiled peas / Crickets / Yeast and glucose / Empty | Germinating peas | — | Which organism is in the chamber, and therefore which rates exist at all |
| Sample mass | Slider | 2–40 | 15 | g | Scales every production rate proportionally |
| Chamber temperature | Slider | 5–35 | 22 | °C | Respiration rate through Q₁₀ = 2, and the dew point at the cold finger |
| Inlet scrubber | Toggle | Soda lime in / Bypassed | Soda lime in | — | Whether incoming air carries 425 ppm CO₂ or under 5 ppm |
| Detection train | Multi-select | Cold finger / Cobalt chloride / Copper sulfate / Limewater / Hydrogencarbonate indicator / CO₂ probe / O₂ probe | Cold finger, Cobalt chloride, Limewater, CO₂ probe, O₂ probe | — | Which detectors are plumbed inline, in that order |
| Air flow | Slider | 0–200 | 60 | mL/min | How fast gas is swept to the detectors; zero seals the chamber |
| Chamber volume | Dropdown | 250 / 500 / 1,000 / 2,000 | 1,000 | mL | How quickly concentrations build for a given production rate |
| Insulated flask | Toggle | In circuit / Removed | In circuit | — | Whether the thermistor pair is running alongside the gas train |
| Run length | Slider | 5–180 | 60 | min | Simulated duration of the run |
| Time compression | Dial | 1×–600× | 120× | — | Simulated minutes per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Living seeds | Chamber contents=Germinating peas; Sample mass=15; Chamber temperature=22; Inlet scrubber=Soda lime in | Name all three outputs and give the evidence for each one: which detector, what change, at what time. |
| S2 | Dead seed control | Chamber contents=Boiled peas; Sample mass=15; Chamber temperature=22 | Same seeds, same mass, same air. Nothing changes anywhere. What does that rule out? |
| S3 | Where did the CO₂ come from | Chamber contents=Germinating peas; Inlet scrubber=Bypassed, then Soda lime in; Air flow=60 | With the scrubber in, incoming air has almost no CO₂ and the probe still climbs. Where was that carbon dioxide made? |
| S4 | Cold store | Chamber contents=Germinating peas; Chamber temperature=5; Run length=180 | The outputs still appear but take far longer. Has respiration stopped or slowed? Give the number that decides it. |

**Student activities.**
1. Set S1 and run 60 simulated minutes. Record the time at which the limewater first goes milky, the cobalt chloride first goes pink, and the flask thermistor first reads 1.0 °C above the boiled control.
2. Swap the chamber contents to boiled peas and repeat exactly, recording the same three times or writing "never" for each.
3. Bypass the soda lime, run 20 minutes, then re-run with it in circuit, and record the final CO₂ in ppm for both. Write one sentence saying what the scrubber proves.
4. Set the temperature to 5 °C and then 35 °C, holding mass at 15 g, and record CO₂ produced per gram per hour at each. Work out the ratio and compare it with the Q₁₀ = 2 the model uses.
5. Swap to crickets at the same 15 g and run 30 minutes. Compare CO₂ per gram per hour with the seeds and state which detector was the first to respond in each case.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Chamber CO₂ | Line graph | ppm | Headspace concentration against time, with the 425 ppm atmospheric line drawn for reference |
| Chamber O₂ | Line graph | % | Falls as CO₂ rises; the two traces are near mirror images |
| Water collected | Live numeric | mL | Volume in the cold finger's graduated collector, to 0.05 mL |
| Temperature difference | Live numeric | °C | Living flask minus boiled flask, to 0.05 °C, updated every simulated minute |
| Detector state board | Data table | — | Each reagent, its current colour, its trigger threshold and the time it crossed |
| ATP made | Counter | ATP (×10¹⁸) | Read off the molecular inset; the output you cannot collect in a tube |
| Output ledger | Data table | mixed | Exportable CSV: cumulative CO₂, H₂O, heat and dry mass lost, one row per simulated 5 min |

**What the student should realise.**
Students believe respiration's only output is "energy", and that exhaled CO₂ is just the CO₂ breathed in. The scrubbed inlet kills the second idea; the detector board replaces the first. What actually leaves the chamber is carbon dioxide, water and warmth, while the energy that matters is locked into ATP inside. The student should be able to say: *"Carbon dioxide and water come out, and the energy leaves as ATP and heat, not as a gas you can collect."*

### C3.3 · Where in the cell this happens

**Experiment name:** All the Way In: Hummingbird to Crista  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + State machine (pathway tracker)  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
An Anna's hummingbird hangs at a manzanita flower in a Bay Area garden, wings a blurred disc, held dead centre in a locked frame. The scene never cuts. A dolly slider drives the camera straight into the bird's chest and keeps going: through iridescent feather, into the deep red slab of flight muscle, into one striped fibre, past the sarcolemma into straw cytosol, then through the ochre wall of a single mitochondrion into an amber matrix roofed by close-packed cristae. Light shifts from garden daylight to a soft internal glow as scale drops. A scale bar in the lower left rewrites itself continuously from centimetres to nanometres. Four labelled step cards wait in a rack on the left. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Anna's hummingbird | Actor | 11 cm bird, 4.5 g, magenta gorget, wings beating at 42 Hz as a motion-blurred disc; hover cycle loops; body becomes a translucent shell as the camera enters | No |
| 2 | Pectoralis flight-muscle block | Structure | Deep red slab, 25% of body mass, fibres running fore-and-aft; cut face shows a mottled texture where mitochondria occupy 35% of fibre volume, the highest known in a vertebrate | No |
| 3 | Muscle fibre with sarcolemma | Structure | Cylinder 30 µm across, banded with sarcomeres at 2.2 µm repeat; sheathed by a 5 nm bilayer with T-tubule invaginations every sarcomere | No |
| 4 | Cytosol volume | Environment | Straw-tinted gel filling between fibrils; explicitly labelled "cytoplasm — outside the mitochondrion" whenever the glycolysis stage is highlighted | No |
| 5 | Glycolysis enzyme cluster | Actor | Ten pale grey-green enzyme bodies, 5–8 nm, strung loosely along a fibril in the cytosol; one glucose enters, two pyruvate and 2 net ATP leave; keeps running when oxygen is switched off | No |
| 6 | Mitochondrial outer membrane and porins | Structure | Ellipsoid shell 2.0 × 0.8 µm, 7 nm thick, ochre, 60 pale VDAC barrels of 2.5 nm bore, permanently open | No |
| 7 | Intermembrane space | Structure | 15 nm gap, tinted with a blue proton haze whose density tracks the pH difference the model computes | No |
| 8 | Inner membrane | Structure | Continuous sheet 6 nm thick, darker ochre, impermeable except at named carriers; carries every complex and rotor | No |
| 9 | Cristae folds | Structure | Lamellar shelves, 14 at default, spanning two-thirds of the interior; junction necks 25 nm; total area 1×–6× the outer membrane under slider control; rims curve because rotor dimers sit along them | Yes: resize |
| 10 | Matrix | Environment | Amber gel between the shelves with loose Krebs enzyme grains, ribosomes and one circular mtDNA nucleoid drawn as a coiled thread | No |
| 11 | Electron transport complexes I–IV | Actor | Four distinct membrane bodies, blue, green, violet and rust, plus a small mobile ubiquinone dot and a pink cytochrome c bead shuttling between III and IV; each complex pumps protons on a visible beat | No |
| 12 | Proton particles | Particle | 1,200 small white spheres with a faint halo; pumped out into the intermembrane space, queue at the rotor inlet, return through it | No |
| 13 | ATP synthase rotor | Actor | 22 nm mushroom: F1 head 10 nm, stalk, and an 8-subunit c-ring in the membrane; arranged in double rows along crista rims; spins at up to 350 rev/s, releasing 3 ATP per revolution | No |
| 14 | Pathway tracker | Overlay | Tints the six carbons of one chosen glucose and follows them through every stage, with a floating caption naming the compartment they are currently in | No |
| 15 | Step cards and drop-zones | UI-Probe | Four cards (Glycolysis, Link reaction, Krebs cycle, Electron transport) dragged onto four glowing drop-zones (Cytosol, Matrix, Matrix, Inner membrane); wrong placements bounce back with the compartment named | Yes: place |
| 16 | Zoom dolly and scale bar | Instrument | Logarithmic camera rail over eight decades, 0.1 m to 5 nm, with five detented stops; scale bar relabels itself and prints the current magnification | Yes: drag |

**How it works — the model.**
The zoom is one continuous logarithmic camera path with level-of-detail swaps at fixed scales, so the student never sees a cut and never loses the thread between bird and rotor. The pathway is a four-state machine, each state bound to a named compartment: glycolysis in the cytosol, 2 net ATP, no oxygen required; the link reaction and the Krebs cycle in the matrix, releasing the carbons as CO₂; electron transport on the inner membrane, where the complexes pump protons out and the rotors let them back in, yielding roughly 26 further ATP. ATP output scales linearly with crista area because rotor count scales with area. Switching oxygen off freezes the electron chain within two seconds while the cytosolic bench carries on, which is the whole structural argument made visible: if all of respiration lived in the mitochondrion, everything would stop together.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Zoom depth | Slider | 0.1 m – 5 nm, logarithmic, eight decades | 0.1 m | m | Camera position on the dolly rail and which level of detail is drawn |
| Cutaway plane | Slider | 0–100 | 0 | % | Slices first the fibre, then the mitochondrion, revealing the compartments in order |
| Crista folding | Slider | 1.0–6.0 | 3.5 | × outer-membrane area | Number and depth of shelves, and therefore how many rotors fit |
| Rotor density | Stepper | 500–4,000 | 2,500 | rotors per µm² | ATP synthase complexes per unit of crista membrane |
| Stage highlight | Radio | Glycolysis / Link reaction / Krebs cycle / Electron transport / All | All | — | Which stage glows, and which compartment caption is shown |
| Oxygen supply | Toggle | On / Off | On | — | Stalls the electron chain and the rotors; the cytosolic bench keeps running |
| Pathway playback | Timeline scrubber | 0–120 | 0 | s | Steps the tracked carbons stage by stage, forwards or backwards |
| Compartment labels | Toggle | On / Off | On | — | Names every compartment the camera is currently inside |
| Step cards | Drag-handle | 4 cards onto 4 drop-zones | Unplaced | — | The placement task; scores each card as it lands |
| Tracer colour | Dropdown | Magenta / Cyan / Amber | Magenta | — | Tint applied to the tracked carbons |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The full descent | Zoom depth=0.1 m to 5 nm; Stage highlight=All; Compartment labels=On | Write the five scale stops in order with the size of what you see at each. Where does the first stage of respiration actually happen? |
| S2 | Oxygen off | Oxygen supply=Off; Stage highlight=All; Pathway playback=0–120 | Some machinery stops within seconds and some keeps going. Which is which, and what does that tell you about where each stage lives? |
| S3 | Smooth versus folded | Crista folding=1.0, then 6.0; Rotor density=2,500 | Nothing about the mitochondrion's outside changes. Why does ATP output change by so much? |
| S4 | Put the stages away | Step cards=drag all four; Compartment labels=Off | Place all four stage cards without the labels showing. Which one is not in the mitochondrion at all? |

**Student activities.**
1. Drag the zoom dolly through all five detented stops and record the scale bar reading and the name of the structure filling the frame at each stop.
2. Set stage highlight to Glycolysis and record, in writing, which compartment glows. Repeat for the other three stages and build a four-row table of stage against compartment.
3. Switch oxygen off and run the pathway playback to 120 s. Record which stages still advance and which freeze, with the time each froze.
4. Set crista folding to 1.0, record ATP per second, then step it to 2.0, 3.5, 5.0 and 6.0, recording each time. Plot ATP rate against crista area and describe the shape.
5. Place all four step cards with compartment labels off, then turn labels on and correct any that bounced. Write down which card you got wrong and why.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Scale readout | Live numeric | m | Current field-of-view width, in scientific notation, updated continuously as the dolly moves |
| Stage-to-compartment table | Data table | — | Four rows built as the student highlights each stage, with the student's own entry checked against the model |
| ATP production rate | Live numeric | ATP/s | Total across all rotors, refreshed every 0.5 s |
| ATP rate versus crista area | Line graph | ATP/s vs × outer area | Built point by point as the folding slider is stepped; comes out linear |
| Proton count in the intermembrane space | Counter | protons | Live population; drops to zero within 2 s of oxygen going off |
| Card placement score | Pass-fail badge | — | Four green ticks when every stage sits in the right compartment |

**What the student should realise.**
Students believe respiration happens in the lungs, or that "the mitochondrion does respiration" from start to finish. The oxygen-off run makes both untenable: the first stage runs on in the cytosol without mitochondrion or oxygen, while everything inside the organelle stops. Respiration is a chemical process in cells, and it is spread across two compartments. The student should be able to say: *"Breathing gets oxygen to my cells. Respiration happens inside them, and it starts before the mitochondrion."*

### C3.4 · Comparing photosynthesis and respiration side by side

**Experiment name:** Mirror Image: One Set of Atoms, Two Directions  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
One coast live oak mesophyll cell fills the screen, its wall a pale straw hexagon, and a fine vertical seam splits it into two working panels. Left, in cool jade light, a chloroplast: a lens 6 µm long, envelope doubled, stacked coins of thylakoid piled into grana, stroma a paler green between them, photons arriving as thin gold darts. Right, in warm ochre, a mitochondrion of the same cell: shelved cristae, amber matrix, rotors turning. Beneath both panels a single horizontal band runs the width of the screen, the shared atom ledger, with three columns of counters. Four ports and four sockets sit at the seam waiting for pipes. Panel docks right; a 1 µm scale bar sits under each organelle.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Mesophyll cell wall and vacuole | Environment | Straw hexagon 60 µm across with a 3 µm cellulose wall showing fibril texture; a large pale vacuole behind both organelles; cytoplasm streams slowly clockwise | No |
| 2 | Chloroplast envelope | Structure | Two membranes 10 nm apart wrapping a 6 × 3 µm lens, outer smooth, inner carrying transporters; jade-tinted and slightly translucent | No |
| 3 | Thylakoid discs stacked into grana | Structure | Discs 500 nm across, 20 nm thick, stacked 12 high into 8 grana joined by stroma lamellae; membrane deep green, lumen pale | Yes: resize |
| 4 | Stroma | Environment | Pale green gel around the grana, holding starch grains that grow visibly while photosynthesis runs | No |
| 5 | Chlorophyll antenna cluster | Structure | Rosettes of 250 pigment discs on each thylakoid face; flash briefly where a photon lands | No |
| 6 | Photon particles | Particle | Gold darts 40 px long arriving from the upper left, rate set by the light slider; absorbed on contact with an antenna, never reflected back into the cell | No |
| 7 | Rubisco enzyme | Actor | Barrel of eight large and eight small subunits, 12 nm, in the stroma; grabs one CO₂ per cycle and its jaw closes visibly | No |
| 8 | Thylakoid ATP synthase | Actor | 20 nm rotor in the thylakoid membrane, head facing the stroma; deliberately drawn with the same silhouette as the mitochondrial rotor so the student notices | No |
| 9 | Mitochondrial outer membrane and intermembrane space | Structure | Ochre ellipsoid 1.8 × 0.7 µm with porins and a 15 nm proton-tinted gap | No |
| 10 | Cristae and matrix | Structure | 12 lamellar shelves in an amber matrix with Krebs enzyme grains; the same asset family used in C3.3, at matching scale | Yes: resize |
| 11 | Mitochondrial ATP synthase | Actor | 22 nm rotor, head facing the matrix; spins in the opposite screen direction to its chloroplast twin | No |
| 12 | Shared molecule pool | Particle | One pool of countable CO₂ (linear, charcoal and red), H₂O (bent, 104.5°), O₂ (red dimer) and glucose (charcoal ring); every molecule drawn once and owned by the cell, not by a panel | Yes: drag |
| 13 | Connector pipes | Actor | Four flexible glass tubes the student drags from a port on one panel to a socket on the other; glow when carrying; refuse to connect an output to another output | Yes: connect |
| 14 | Shared atom ledger band | Overlay | Full-width strip under both panels: C, H and O counters for the left panel, the right panel and the cell total, with the total pinned and highlighted red if it ever moves | No |
| 15 | Twin equation strip | Overlay | Two equations printed one above the other, the lower one written right to left so the reversal is visually obvious; terms light up as their molecules are consumed | No |
| 16 | Net-flux meter at the cell wall | Instrument | Two gauges on the wall reading net CO₂ and net O₂ crossing into or out of the cell, signed, with a green zero mark at the compensation point | No |

**How it works — the model.**
Both panels are stoichiometric engines drawing on one shared molecule pool, so nothing is ever created for a panel's convenience. Photosynthesis takes 6 CO₂ + 6 H₂O and light and returns 1 glucose + 6 O₂, at a rate set by a saturating light curve, a CO₂ term and a temperature optimum near 25 °C. Respiration takes 1 glucose + 6 O₂ and returns 6 CO₂ + 6 H₂O + about 32 ATP, at a rate set by demand and Q₁₀ = 2, and it runs day and night. The ledger is checked every tick and the C, H and O totals for the whole cell must not move by a single atom. The honest limit is stated on screen: this is a bookkeeping mirror, not a mechanical reversal, because the two use different enzymes in different compartments and photosynthesis needs light while respiration does not.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Light level | Slider | 0–2,000 | 900 | µmol/m²/s PAR | Photon arrival rate and therefore the left panel's rate |
| Carbon dioxide | Slider | 100–1,500 | 425 | ppm | Supply to the left panel and the level the right panel adds to |
| Temperature | Slider | 5–40 | 22 | °C | Q₁₀ = 2 on respiration, a peaked enzyme curve on photosynthesis |
| Cell demand | Slider | 1–8 | 2 | × resting | ATP draw, and therefore the right panel's rate |
| Organelles present | Multi-select | Chloroplast / Mitochondrion | Chloroplast, Mitochondrion | — | Which panels exist at all; removing one leaves a genuinely one-way ledger |
| Connector pipes | Drag-handle | 4 ports to 4 sockets | None connected | — | Routes one panel's outputs into the other's inputs |
| Panel mode | Radio | Side by side / Overlay / Ledger only | Side by side | — | Viewport layout; Overlay superimposes the two equations on one axis |
| Time of day | Timeline scrubber | 00:00–24:00 | 12:00 | h | Drives the light slider automatically along a daily curve |
| Ledger element | Dropdown | Carbon / Hydrogen / Oxygen / All | All | — | Which column of the shared ledger is enlarged and highlighted |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Noon in the canopy | Light level=900; Carbon dioxide=425; Temperature=22; Cell demand=2; Organelles present=Chloroplast, Mitochondrion | Both panels are running. Read the net-flux meter: which way is CO₂ crossing the wall, and is the right panel switched off? |
| S2 | Midnight | Time of day=00:00; Light level=0; Cell demand=2 | With no light the left panel stops. Which way does the ledger run now, and what has the cell been doing all along? |
| S3 | Find the balance point | Light level=step from 0 to 300; Temperature=22; Cell demand=2 | Find the light level at which both net-flux gauges read zero. Are both panels stopped, or are they cancelling? |
| S4 | An animal cell | Organelles present=Mitochondrion; Light level=900; Cell demand=4 | Remove the chloroplast. Which of the two equations is missing, and what happens to the shared ledger when only one direction exists? |

**Student activities.**
1. Run S1 for 60 simulated seconds and record the ledger's C, H and O totals at the start and end. State whether any total changed.
2. Drag all four connector pipes so the left panel's outputs feed the right panel's inputs, re-run, and record how many molecules now cross the cell wall compared with the unconnected run.
3. Set the time-of-day scrubber to 00:00, 06:00, 12:00 and 18:00, recording net CO₂ flux at each, and mark the two times when the gauge crosses zero.
4. Step light from 0 to 300 µmol/m²/s in 25-unit steps at demand 2, recording net O₂ flux each time, and read off the light level where the trace crosses zero.
5. Remove the chloroplast, run 30 s, then put it back and run again. Write one sentence comparing what the ledger's carbon column does in each case.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Shared atom ledger | Data table | atoms | C, H and O per panel and for the whole cell; the cell total is pinned and flashes red if it moves |
| Net CO₂ flux | Live numeric | molecules/s | Signed value at the cell wall, positive out; zero at the compensation point |
| Net O₂ flux | Live numeric | molecules/s | Signed value at the cell wall, opposite in sign to the CO₂ gauge |
| Panel rates | Line graph | reactions/s vs s | Two traces on shared axes, photosynthesis and respiration, showing that both are non-zero in daylight |
| Compensation point | Live numeric | µmol/m²/s PAR | The light level at which the two rates match, recomputed whenever temperature or demand changes |
| Glucose pool | Live numeric | molecules | Made by the left panel, spent by the right; rises in light, falls in the dark |
| Run log | Data table | mixed | Exportable CSV, one row per simulated 2 s, both rates, both fluxes and every ledger column |

**What the student should realise.**
Students believe photosynthesis and respiration belong to different organisms and are unrelated topics, and that a plant "breathes backwards". The shared ledger removes both ideas: exactly the same carbon, hydrogen and oxygen atoms are being assembled in one panel and taken apart in the other, inside one cell, at the same time. The student should be able to say: *"They are the same atoms rearranged in opposite directions, and one plant cell does both at once."*

### C3.5 · Respiration in plants and animals alike

**Experiment name:** The Plant in the Dark  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model + Fluid/thermal  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
A growth-room bench, shot slightly from above, with four sealed glass chambers in a row under a dimmable LED panel. Left to right: a coast live oak seedling in damp potting soil, a tray of germinating peas, six crickets on a mesh floor, and a boiled seedling that looks almost identical to the first. Each chamber carries a probe cluster on its lid and a coloured indicator vial clipped to its flank. A heavy black hood hangs on a rail above, ready to be dragged over any one chamber. The upper two-thirds of the screen is the dashboard: four gas traces on shared axes, a day-night band across the top, and a stacked decomposer chart. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sealed chamber vessel | Structure | Four identical borosilicate cubes 200 mm on a side, 8 L, clamped lids with silicone gaskets and four sealed feedthroughs; interior fogs above 90% relative humidity | Yes: swap |
| 2 | Coast live oak seedling | Actor | 180 mm seedling, eight leathery leaves with a visible waxy cuticle, roots in 400 g of damp potting soil; a hover inset shows stomatal pores on the underside opening in light and closing in darkness | Yes: place |
| 3 | Germinating pea seeds | Actor | 60 swollen seeds with 5 mm white radicles and no green tissue anywhere; respires but structurally cannot photosynthesise | Yes: place |
| 4 | House crickets | Actor | Six 18 mm insects on a mesh floor above a shallow water dish; hop at intervals; the metabolic comparison animal | Yes: place |
| 5 | Boiled seedling | Actor | Visually matched to object 2 but olive-drab and limp, dosed with antiseptic so no microbes colonise it; every rate is zero by construction | Yes: place |
| 6 | Bare potting soil | Actor | 400 g of the same damp soil with no plant, present to expose the real confound that soil microbes respire too | Yes: place |
| 7 | Blackout hood | Structure | Opaque 220 mm fabric box on an overhead rail, dragged onto any chamber slot; drops that chamber's light to 0 without changing its temperature | Yes: drag |
| 8 | LED grow-light panel | Instrument | 600 mm bar of white and deep-red diodes above all four chambers, dimmable 0–2,000 µmol/m²/s, with a quantum sensor reading the delivered level | No |
| 9 | Carbon dioxide probe | Instrument | NDIR sensor per chamber, 0–10,000 ppm, ±30 ppm, 20 s response, lid-mounted | No |
| 10 | Oxygen probe | Instrument | Galvanic cell per chamber, 0–25%, ±0.1%, lid-mounted alongside the CO₂ probe | No |
| 11 | Thermistor and chamber conditioner | Instrument | Bead thermistor to 0.05 °C plus a Peltier plate holding each chamber to the set temperature so heat cannot be confused with light | No |
| 12 | Hydrogencarbonate indicator vial | Instrument | 10 mL orange-red solution clipped to each chamber, going yellow as CO₂ rises and magenta as it falls, with a printed colour scale on the glass | Yes: place |
| 13 | Stirrer fan | Structure | 40 mm fan in each lid keeping the gas well mixed so a probe reading means the whole chamber | No |
| 14 | Dashboard trace panel | Overlay | Four CO₂ traces and four O₂ traces on shared time axes, colour-keyed to the chambers, with the 425 ppm atmospheric line drawn | No |
| 15 | Gross-and-net decomposer | Overlay | Stacked chart splitting a green chamber's measured net flux into a constant respiration band and a light-driven photosynthesis band, so respiration is visible as a band that never disappears | No |
| 16 | Day-night timeline scrubber | UI-Probe | Band across the top of the dashboard, dark where the lights are off; draggable playhead that scrubs any completed run | Yes: drag |

**How it works — the model.**
Every chamber is a well-mixed gas volume with net CO₂ flux equal to respiration minus photosynthesis. Respiration is R = R₂₀ × 2^((T−20)/10) × mass, running continuously and completely independently of light. Photosynthesis is P = P_max × I/(I + 250) scaled by a CO₂ term, and is structurally zero for the peas, the crickets, the boiled control and the bare soil, because none of them contains chlorophyll. The decomposer chart is not a second model: it draws the two terms the engine already computed. The failure the sim must avoid is drawing a plant's gas exchange as one arrow that flips direction at dusk. Both arrows exist at every instant; what the probe measures is only their difference. Bare soil is included because its microbes genuinely respire, and honest data has confounds in it.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Chamber loadout | Multi-select | Four slots from: Oak seedling / Pea seeds / Crickets / Boiled seedling / Bare soil / Empty | Oak seedling, Pea seeds, Crickets, Boiled seedling | — | What is inside each chamber, and therefore which rates can exist |
| Light level | Slider | 0–2,000 | 600 | µmol/m²/s PAR | Photon delivery to every uncovered chamber |
| Blackout hood | Drag-handle | Hood onto slot 1, 2, 3, 4 or the rail | On the rail | — | Darkens exactly one chamber while the others stay lit |
| Chamber temperature | Slider | 2–35 | 20 | °C | Respiration rate in every chamber through Q₁₀ = 2 |
| Sample mass per chamber | Slider | 1–50 | 12 | g | Living tissue mass, which scales respiration proportionally |
| Day length | Slider | 0–24 | 12 | h | Length of the lit part of the simulated daily cycle |
| Time compression | Dial | 60×–3,600× | 600× | — | Simulated seconds per real second |
| Gross-and-net decomposer | Toggle | On / Off | Off | — | Splits the green chambers' net traces into their two component bands |
| Probe set | Multi-select | CO₂ / O₂ / Thermistor / Indicator vial | CO₂, O₂, Indicator vial | — | Which instruments report to the dashboard |
| Trace units | Radio | Raw ppm / Per gram of tissue / Net beside gross | Raw ppm | — | How the traces are normalised for comparison |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Lights out | Chamber loadout=Oak seedling, Pea seeds, Crickets, Boiled seedling; Light level=0; Chamber temperature=20; Day length=0 | In total darkness, which chambers show CO₂ rising? Does the plant chamber behave like the cricket chamber or like the dead one? |
| S2 | One hood, three lit | Blackout hood=on slot 1; Light level=600; Chamber temperature=20 | The hooded seedling makes CO₂ and the lit one absorbs it. Are these two different plants, or the same plant doing the same thing under different lighting? |
| S3 | Salinas cold store | Chamber loadout=Pea seeds, Pea seeds, Empty, Empty; Chamber temperature=2, then 20; Light level=0 | Harvested produce is chilled before shipping. Using your CO₂ numbers, say exactly what refrigeration is slowing down. |
| S4 | Is it really the plant | Chamber loadout=Oak seedling, Bare soil, Boiled seedling, Empty; Light level=0; Sample mass per chamber=12 | The soil chamber makes CO₂ too. How much of chamber 1's CO₂ came from the seedling itself? Show the subtraction. |

**Student activities.**
1. Run S1 for 6 simulated hours and record each chamber's CO₂ at 0, 2 and 6 hours. Rank the four chambers by CO₂ produced per gram.
2. Drag the blackout hood onto the oak seedling with the lights at 600, run 4 hours, and record net CO₂ flux for the hooded and the unhooded seedling.
3. Turn the decomposer on with light at 600 and record the height of the respiration band at four different light levels. State whether that band ever reaches zero.
4. Set the temperature to 2 °C and then 20 °C for identical pea chambers, recording CO₂ per gram per hour for each, and calculate the ratio.
5. Run S4 and subtract the bare-soil chamber's CO₂ from the seedling chamber's. Record the corrected figure and write one sentence on why the control was necessary.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Chamber CO₂ traces | Line graph | ppm vs h | Four colour-keyed traces with the day-night band overhead and the 425 ppm line marked |
| Chamber O₂ traces | Line graph | % vs h | Four traces; falls wherever CO₂ climbs |
| Net flux per chamber | Live numeric | µmol CO₂ per gram per hour | Signed, positive when the chamber is a net CO₂ source |
| Gross respiration band | Bar chart | µmol CO₂ per gram per hour | Respiration only, drawn for every chamber including the lit plant, where it is otherwise hidden |
| Indicator vial states | Data table | — | Colour of each vial with the time it changed and the CO₂ level at that moment |
| Control comparison | Pass-fail badge | — | Green once the student has logged both the dead control and the soil control for the run |
| Run log | Data table | mixed | Exportable CSV, one row per simulated 10 min, every chamber and every probe |

**What the student should realise.**
Students believe plants photosynthesise instead of respiring, and that gas exchange in a plant only ever runs one way. A seedling sealed in the dark raises the CO₂ in its chamber exactly as the crickets do, while the boiled seedling beside it does nothing, and the decomposer shows the respiration band still present at full light. The student should be able to say: *"Plants respire all the time. In daylight photosynthesis is just faster, so it hides it."*

## C4 · Food molecules rearranged · MS-LS1-7

### C4.1 · Modeling a food molecule broken down

**Experiment name:** Taking Glucose Apart  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Manipulate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
A dark slate workbench under a single bright ring light, everything else in shadow. Centre stage, held in a soft magnetic cradle and slowly turning, is one glucose molecule built as ball and stick: a charcoal six-carbon ring with white hydrogens bristling off it and red oxygens at every hydroxyl, catching the ring light in glossy highlights. A rack on the left holds three tools: bond scissors with fine chrome jaws, a capping dispenser, and blunt tweezers. Along the bottom, four shallow parts-tray wells wait, each numbered. On the right, a tally board shows three enormous counters reading C 6, H 12, O 6. A ghost outline of the original molecule hangs faintly behind the cradle. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Carbon atom | Particle | Charcoal sphere, covalent radius 0.76 Å rendered at ×80, matte with a faint specular; four tetrahedral sockets at 109.5° drawn as recessed dimples when unfilled | Yes: drag |
| 2 | Hydrogen atom | Particle | White sphere, 0.31 Å at the same scale, one socket; the smallest object on the bench and deliberately hard to lose | Yes: drag |
| 3 | Oxygen atom | Particle | Red sphere, 0.66 Å, two sockets at 104.5°, with two faint lone-pair lobes on the reverse face | Yes: drag |
| 4 | Bond cylinders | Structure | Single bond: one 0.18 Å-wide chrome cylinder, drawn at true length, C–C 154 pm, C–H 109 pm, C–O 143 pm, O–H 96 pm. Double bond: twin parallel cylinders at 123 pm. Cylinders stretch and redden as the scissors close on them | Yes: swap |
| 5 | Glucose molecule assembly | Actor | Pyranose chair ring by default: 5 C and 1 O in the ring, one exocyclic CH₂OH, four ring hydroxyls; a toggle unrolls it into the open-chain aldehyde form with 5 C–C, 7 C–H, 5 C–O, 5 O–H and 1 C=O | Yes: swap |
| 6 | Magnetic cradle | Structure | Ring of six pale field emitters holding the molecule at bench centre; releases any fragment the tweezers pull free | No |
| 7 | Bond scissors | Instrument | Chrome tool with a 2 Å jaw; hovering over a bond highlights it and prints its type and length; a cut leaves two glowing open sockets and adds to the scissors charge | Yes: drag |
| 8 | Capping dispenser | Instrument | Twin-barrelled tool loaded with H caps and OH caps, each drawn from a water molecule in the reservoir, so a cap always costs the tally board something | Yes: drag |
| 9 | Enzyme stamp set | Actor | Three translucent enzyme bodies, 6 nm, each with a shaped recess: hexokinase, phosphofructokinase and aldolase; stamping the molecule performs that enzyme's real cut and nothing else | Yes: place |
| 10 | Fragment tray wells | Structure | Numbered shallow wells along the bench front; a fragment parked in a well is counted and labelled with its own formula | Yes: place |
| 11 | Valence halo | Overlay | Red pulsing ring around any atom with an unfilled socket, and a small printed count of sockets still open on that atom | No |
| 12 | Per-element tally board | Overlay | Three large counters, C, H and O, split into "on the bench", "in the wells" and "total"; the total is boxed and cannot change | No |
| 13 | Ghost of the original molecule | Overlay | Faint wireframe of the intact glucose left in place behind the cradle so every fragment can be traced to where it came from | No |
| 14 | Scissors charge counter | Instrument | A meter that only ever increases, labelled "energy spent cutting, kJ per mole", accumulating the real bond energy of each bond broken | No |
| 15 | Water reservoir | Structure | Small glass boat of 12 bent water molecules feeding the capping dispenser; empties visibly as caps are spent | Yes: place |
| 16 | Rewind scrubber and scale readout | UI-Probe | Timeline of every action taken, draggable backwards to undo cuts one at a time, with a live ångström scale printed beside the cursor | Yes: drag |

**How it works — the model.**
The molecule is a graph: atoms are nodes with a valence budget of C 4, O 2, H 1, and bonds are edges with a type and a real length. The scissors delete an edge and leave two unfilled sockets, which glow red, and the bench refuses to be declared finished while any socket is open. Caps can close sockets, but every cap is drawn from the water reservoir and every atom in it is counted, so nothing is ever free. Cutting the C3–C4 bond gives the split that aldolase actually makes and lights the three-carbon ghost template. The scissors charge accumulates real mean bond energies, 347 kJ/mol for C–C, 413 for C–H, 358 for C–O, 464 for O–H, and it only ever rises, which quietly sets up the next two experiments. The failure to avoid is any animation of energy pouring out of a bond as it is cut.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Molecule on the cradle | Dropdown | Glucose ring / Glucose open chain / Fructose / Ribose | Glucose ring | — | Which molecule is built in the cradle and what the tally board starts at |
| Tool in hand | Radio | Scissors / Hydrogen cap / Hydroxyl cap / Tweezers / Enzyme stamp | Scissors | — | What clicking on the molecule does |
| Enzyme stamp | Dropdown | Hexokinase / Phosphofructokinase / Aldolase | Aldolase | — | Which real cut the stamp performs |
| Water available | Stepper | 0–12 | 6 | molecules | How many caps can be paid for before the reservoir is empty |
| Display style | Radio | Ball and stick / Space filling / Skeletal | Ball and stick | — | How the molecule is drawn; space filling shows why the ring is bulky |
| Valence lamps | Toggle | On / Off | On | — | Whether open sockets glow red |
| Fragment tray wells | Stepper | 2–8 | 4 | count | How many places exist to park fragments, which caps how far you can shred |
| Tally board | Toggle | On / Off | On | — | Shows or hides the live element counters |
| Rewind | Timeline scrubber | 0–40 | 0 | actions | Steps backwards through every cut and cap made |
| Scale readout | Dropdown | Ångström / Picometre / Off | Ångström | — | Units printed beside the cursor and on every bond label |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Cut it in half | Molecule on the cradle=Glucose open chain; Tool in hand=Scissors; Fragment tray wells=4 | Cut one C–C bond so the ring becomes two three-carbon pieces. What does the tally board read afterwards, and what did it read before? |
| S2 | Shred it | Molecule on the cradle=Glucose open chain; Fragment tray wells=8; Water available=12 | Cut every carbon-to-carbon bond. You now have six separate pieces. How many carbons, hydrogens and oxygens are on the bench? |
| S3 | The vanishing act | Tool in hand=Scissors; Water available=0; Valence lamps=On | Try to make one hydrogen atom disappear from the bench. Report what the tool does and what the tally board does. |
| S4 | The real route | Tool in hand=Enzyme stamp; Enzyme stamp=Aldolase; Molecule on the cradle=Glucose open chain | Use the enzyme rather than the scissors. Where does aldolase cut, and how does its cut differ from the one you chose in S1? |

**Student activities.**
1. Record the tally board's three numbers before touching anything, then cut the molecule in half and record them again. Write down which numbers changed.
2. Cut every C–C bond in turn, parking each fragment in a numbered well, and write the formula of each fragment from the labels.
3. Set water available to 0, cut a C–H bond, and record what the valence halo shows and what the bench refuses to let you do next.
4. Read the scissors charge after one cut, after three cuts and after all five C–C cuts. Say whether it ever goes down, and what that suggests about breaking bonds.
5. Stamp the molecule with aldolase, then rewind fully and stamp with hexokinase. Record what each enzyme did, in one sentence each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Per-element tally | Live numeric | atoms | C, H and O on the bench, in the wells and in total; the total is boxed and never moves |
| Fragment inventory | Data table | — | One row per fragment: formula, carbon count, which bond it came from, which well it sits in |
| Open sockets | Counter | count | Unsatisfied valences currently on the bench; must reach zero before a build can be declared finished |
| Scissors charge | Live numeric | kJ/mol | Cumulative bond energy spent cutting, using real mean bond energies; monotonic increasing |
| Bond log | Data table | mixed | Every bond broken or made, with its type, its length and its energy; exportable CSV |
| Conservation badge | Pass-fail badge | — | Green while the total atom counts equal the starting counts; there is no way to turn it red, which is the point |

**What the student should realise.**
Students believe food is "used up", "burned away" or "turned into energy", so that at the end there is less stuff than there was. Twenty minutes of cutting leaves exactly six carbons, twelve hydrogens and six oxygens on the bench, every single time, and the only meter that moved was the one counting energy spent. The student should be able to say: *"Every atom that was in the glucose is still here. I only changed how they are joined together."*

### C4.2 · Modeling the atoms rearranged into products

**Experiment name:** Building the Exhaust  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
The same slate bench, swung ninety degrees so it now runs left to right as an assembly line. At the left, the loose parts from the previous experiment lie in an open tray: charcoal carbons, white hydrogens, red oxygens, still tinted the blue of things that came from food. Overhead hangs an oxygen dispenser, a chrome hopper of red dimers tinted green, with a numbered dial on its face. At the right, a rack of empty product templates glows faintly: linear ghosts waiting for carbon dioxide, bent ghosts waiting for water. Beneath the line runs a see-saw ledger, reactants on the left arm, products on the right, currently tilted. A dark commit button sits under the rack. A small breath inset floats top-right. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Loose atom pool | Particle | The 6 C, 12 H and 6 O carried over from C4.1, lying in an open tray with their sockets visible; each atom keeps a persistent identity number | Yes: drag |
| 2 | Oxygen dispenser | Instrument | Chrome hopper with a numbered dial 0–12; each pull releases one O₂, drawn as two red spheres with a twin cylinder at 121 pm, tinted green to mark it as air-derived | Yes: drag |
| 3 | Carbon dioxide template | Structure | Linear ghost, O=C=O at exactly 180°, two double-bond slots at 116 pm; six of them in the rack; snaps shut with a click when correctly filled | Yes: place |
| 4 | Water template | Structure | Bent ghost at 104.5° with two O–H slots at 96 pm; six in the rack; refuses any atom that is not one oxygen and two hydrogens | Yes: place |
| 5 | Snap magnet field | Field | Invisible attractor around each empty slot with a 1.5 Å capture radius; pulls a correct atom home and repels a wrong one with a small shudder | No |
| 6 | Valence halo | Overlay | Red pulsing ring on any atom with an open socket anywhere on the bench, including inside a half-built product | No |
| 7 | Source tint shader | Overlay | Tints every atom by origin: blue for atoms that came from glucose, green for oxygen that came from the dispenser; survives assembly, so a finished molecule shows its parentage | No |
| 8 | Carbon tracer tag | UI-Probe | A heavy-isotope tag the student paints onto any one carbon; that carbon keeps a bright halo through every subsequent step and into the breath inset | Yes: place |
| 9 | Per-element see-saw ledger | Overlay | Physical balance beam under the line: reactant counts on the left pan, product counts on the right, tilting visibly until C, H and O all match, then levelling with a chime | No |
| 10 | Coefficient counters | Instrument | Three printed counters above the rack reading how many O₂ used, how many CO₂ built and how many H₂O built, updating as products complete | No |
| 11 | Commit gate | Actor | Heavy switch under the rack, dark and physically immovable until every socket is filled and the see-saw is level; throwing it sends the products to the bin and logs the run | Yes: place |
| 12 | Product bin and breath inset | Overlay | Committed products drop into a bin, then appear in a small inset of a nose and mouth exhaling, where the tagged carbon is visible leaving the body | No |
| 13 | Leftover shelf | Structure | A shelf beside the rack where any unused atoms sit; if it is not empty the commit gate stays locked and the shelf is labelled with what is stranded | Yes: place |
| 14 | Failure log | Overlay | Running list of blocked attempts with the reason printed: "3 oxygens short", "carbon has 3 bonds, needs 4", "2 hydrogens left on the shelf" | No |
| 15 | Electron transport cutaway | Actor | Optional panel showing where inhaled O₂ really ends up: at complex IV on the inner membrane, taken up into water rather than into carbon dioxide; opens as a side window without disturbing the bench | Yes: swap |
| 16 | Before and after inventory | Overlay | Two columns, reactants and products, listing C, H and O with a printed difference of zero on every row | No |

**How it works — the model.**
Snap assembly under strict valence enforcement. Each template exposes typed slots; a magnet field pulls a matching atom in and rejects anything else. The commit gate is a hard gate with three conditions: no open sockets, no atoms on the leftover shelf, and a level see-saw. The arithmetic drives everything: glucose supplies only 6 oxygen atoms, while 6 CO₂ needs 12 and 6 H₂O needs 6, so 18 are required and exactly 6 O₂ must be dialled in. Five leaves the ledger short, seven leaves two oxygens stranded. Source tint runs alongside as a tracer argument: every carbon in every committed CO₂ is blue, meaning it came from food. The optional cutaway keeps the model honest by showing that, in the real pathway, the inhaled oxygen is reduced to water at complex IV rather than being bolted directly onto carbon.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Oxygen molecules dialled in | Stepper | 0–12 | 0 | molecules | How many O₂ the dispenser releases onto the bench |
| Starting fragments | Dropdown | Intact glucose / Two three-carbon pieces / Six one-carbon pieces | Two three-carbon pieces | — | What the tray begins with, and therefore how much building is left to do |
| Product to build | Radio | Carbon dioxide / Water / Auto | Carbon dioxide | — | Which template the rack presents to the cursor |
| Snap assist | Toggle | On / Off | On | — | Whether the magnet field pulls correct atoms home or you must place them exactly |
| Source tint | Toggle | On / Off | On | — | Colours atoms blue for food-derived and green for air-derived |
| Carbon tracer | Drag-handle | Paint any 1 of the 6 carbons | None painted | — | Which carbon carries a halo through assembly and into the breath inset |
| Ledger element | Dropdown | Carbon / Hydrogen / Oxygen / All | All | — | Which row of the see-saw is enlarged |
| Where the inhaled oxygen goes | Toggle | Overall equation / Real pathway | Overall equation | — | Opens the electron transport cutaway alongside the bench |
| Breath inset | Toggle | On / Off | On | — | Shows committed products leaving the body |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Honest build | Starting fragments=Two three-carbon pieces; Oxygen molecules dialled in=0, then raise it; Snap assist=On | Build six carbon dioxides and six waters. How many O₂ did you have to dial in, and why not fewer? |
| S2 | No air | Oxygen molecules dialled in=0; Starting fragments=Intact glucose; Product to build=Auto | Using only the atoms glucose brought, build as many complete products as you can. What is left stranded, and why can you not finish? |
| S3 | Too much oxygen | Oxygen molecules dialled in=8; Starting fragments=Two three-carbon pieces | The gate will not throw. Read the failure log and the leftover shelf, then say exactly how many oxygen atoms are surplus. |
| S4 | Follow one carbon | Carbon tracer=paint carbon 1; Oxygen molecules dialled in=6; Breath inset=On | Tag a carbon, commit, and watch the inset. Where did the carbon in your exhaled CO₂ come from, the food or the air? |

**Student activities.**
1. Count the oxygen atoms glucose brings and the oxygen atoms the six CO₂ and six H₂O will need. Write both numbers, then predict how many O₂ you must dial in before you touch the dial.
2. Build all six carbon dioxides, recording the coefficient counters after each one, then build all six waters and record again.
3. Set oxygen to 5 and try to commit. Copy the exact wording from the failure log and say which element is short.
4. Paint the tracer on one carbon, commit the run, and record where that carbon appears in the breath inset and what colour it is.
5. Switch "Where the inhaled oxygen goes" to Real pathway and write one sentence on how the real route differs from the overall equation you just built.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| See-saw balance | Pass-fail badge | — | Level and green only when C, H and O all match across the beam |
| Coefficient counters | Live numeric | molecules | O₂ used, CO₂ built and H₂O built, updated as each product completes |
| Before and after inventory | Data table | atoms | Reactant and product columns for C, H and O with a difference column pinned at zero |
| Open sockets | Counter | count | Unsatisfied valences anywhere on the bench, including inside part-built products |
| Leftover shelf contents | Data table | atoms | What is stranded and why, refreshed on every failed commit |
| Failure log | Data table | — | Every blocked commit with its timestamp and printed reason; exportable CSV |
| Tracer destination | Live numeric | — | Names the product molecule the tagged carbon ended up in |

**What the student should realise.**
Students believe the carbon dioxide they breathe out is the air they breathed in coming back, and that oxygen is somehow converted into carbon dioxide. The source tint makes that untenable: every committed carbon is food-blue, and the six O₂ were needed because glucose does not carry enough oxygen of its own. The student should be able to say: *"The carbon in my breath came from my food. The oxygen from the air joined it, it did not become it."*

### C4.3 · Energy released, not created

**Experiment name:** The Bond Bank  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
The screen is split horizontally. The upper half is the molecular bench, dimly lit: glucose and six oxygen molecules on the left, six carbon dioxides and six waters on the right, and every single bond in both groups drawn as a small coiled spring with its energy printed on a paper tag hanging off it. The lower half is a side-on track shaped like a hill with a long drop beyond it, drawn in cool blueprint lines, with a small brass cart parked at the left shoulder. To the right of the track stand two receivers: a tall vault marked ATP with thirty-two slots, and a broad radiator that glows dull orange as it takes waste heat. A three-column ledger sits under the track. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reactant bond springs | Structure | Glucose's 5 C–C at 347, 7 C–H at 413, 5 C–O at 358, 5 O–H at 464 and 1 C=O at 745, plus 6 O=O at 498, each a coiled spring with a printed kJ/mol tag; springs stretch and whiten as they are pulled apart | Yes: swap |
| 2 | Product bond springs | Structure | 12 C=O in carbon dioxide at 805 and 12 O–H in water at 464, drawn shorter and visibly stiffer than the reactant springs, which is the whole reason there is a surplus | No |
| 3 | Bond-energy label tags | Overlay | Small paper tags on every spring; hovering enlarges one and names the bond type, its length and its mean energy | No |
| 4 | Reaction profile track | Structure | Blueprint-line rail: a starting shoulder, an activation hump, and a lower finishing shelf; the vertical axis is graduated in kJ/mol with real numbers, not a cartoon | No |
| 5 | Reaction cart | Actor | 30 px brass cart carrying a tiny glucose icon; rolls only if given enough energy to clear the hump, then coasts to the lower shelf | Yes: drag |
| 6 | Activation hump | Structure | Adjustable ridge on the track, 1,100 kJ/mol high with no enzymes and 55 kJ/mol with the full enzyme set; its height is the only thing enzymes change | Yes: resize |
| 7 | Enzyme actors | Actor | Up to thirty translucent enzyme bodies placed along the track; each one placed lowers the hump and adds one step to the staircase | Yes: place |
| 8 | Staircase step blocks | Structure | The long drop redrawn as a flight of small steps, one per enzyme, each labelled with its own modest energy drop; a single cliff when no enzymes are present | Yes: resize |
| 9 | ATP vault | Instrument | Glass tower with thirty-two numbered slots; ATP tokens drop in as they are made, each slot labelled 30.5 kJ/mol | No |
| 10 | ATP and ADP tokens | Particle | ATP with three phosphates and a glowing terminal one, ADP with two; ADP and phosphate feed in at the base of the vault as ATP leaves the top | No |
| 11 | Heat radiator | Instrument | Finned block beside the vault with a running joule counter; glows from grey to dull orange in proportion to the energy it has taken | No |
| 12 | Three-column ledger | Overlay | "Spent breaking", "paid back forming" and "net", each a large running total in kJ/mol; the net column is computed, never typed | No |
| 13 | Free-energy machine | UI-Probe | A brass gadget the student may bolt to the vault to try to draw more out than went in; it always stalls, and prints which ledger column it ran out of | Yes: place |
| 14 | Bond-energy lookup table | Overlay | Printed table of the mean bond energies used, so every number on screen can be checked against a source | No |
| 15 | Conservation badge | Instrument | Continuous check that spent minus paid-back equals net and that vault plus radiator equals net; goes red if either fails | No |
| 16 | Cell thermistor | Instrument | Bead probe in a small cell inset, showing the temperature rise that the radiator's joules actually produce in a real cell | No |

**How it works — the model.**
Straight bond-energy accounting, with every number drawn from the printed table. Breaking all of glucose's bonds costs 9,481 kJ/mol and breaking six O=O costs 2,988, so 12,469 kJ/mol must be spent before anything is gained. Forming twelve C=O in carbon dioxide pays back 9,660 and twelve O–H in water pays 5,568, so 15,228 comes back. The net is 2,759 kJ/mol released, close to the accepted 2,803 for glucose because mean bond energies are averages, and the sim says so rather than hiding the gap. Of that net, the coupling slider sends a fraction to the ATP vault, 34% by default, giving about 32 ATP, and the remainder goes to the radiator. The absolute rule is that no animation may ever show energy emerging from a bond as it breaks: breaking always costs, forming always pays.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| View | Radio | Bond springs / Energy staircase / Both | Both | — | Which half of the screen is active and enlarged |
| Stage | Radio | Break only / Form only / Whole reaction | Whole reaction | — | Runs half the accounting so the two halves can be read separately |
| Bond types shown | Multi-select | C–C / C–H / C–O / O–H / C=O / O=O | All six | — | Which springs are drawn and which rows of the ledger are itemised |
| Enzymes present | Stepper | 0–30 | 30 | steps catalysed | Activation hump height and how many steps the staircase has |
| ATP coupling | Slider | 0–60 | 34 | % of net | How much of the released energy reaches the vault rather than the radiator |
| Cell temperature | Slider | 20–45 | 37 | °C | Enzyme activity, and the temperature the radiator's joules produce in the cell inset |
| Free-energy machine | Toggle | Armed / Off | Off | — | Bolts the trap gadget to the vault and lets the student try to beat the ledger |
| Ledger units | Dropdown | kJ per mole / kJ per gram / kcal per gram | kJ per mole | — | Units on all three columns and on every spring tag |
| Playback | Timeline scrubber | 0–60 | 0 | s | Steps through breaking, then forming, then coupling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The whole ledger | Stage=Whole reaction; Enzymes present=30; ATP coupling=34; View=Both | Read all three ledger columns. Which is bigger, spent or paid back, and by how much? |
| S2 | Breaking only | Stage=Break only; Enzymes present=30; Playback=0–60 | Stop after every bond is broken. Is the ledger positive or negative at that moment? What does that say about "energy is released when bonds break"? |
| S3 | No enzymes | Enzymes present=0; Cell temperature=37; Stage=Whole reaction | The hump is 1,100 kJ/mol and the cart will not move. The sugar just sits there. Did the net energy change when you removed the enzymes? |
| S4 | Beat the bank | Free-energy machine=Armed; ATP coupling=60; Stage=Whole reaction | Try to fill more than thirty-two ATP slots. Which ledger column stops you, and what is the most the vault could ever hold? |

**Student activities.**
1. Record the "spent breaking" total, the "paid back forming" total and the net, in kJ per mole, and check that the first two really do subtract to the third.
2. Run Stage=Break only and record the ledger. Write one sentence saying whether breaking bonds gave energy out or took energy in.
3. Set enzymes to 0, 5, 15 and 30, recording the hump height and the net energy each time. State which of the two changed.
4. Move ATP coupling from 0% to 60% in steps of 15, recording ATP slots filled and radiator joules at each setting, and check that they always add to the same total.
5. Arm the free-energy machine, try to overfill the vault, and copy down the message it prints when it stalls.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Three-column ledger | Live numeric | kJ/mol | Spent breaking, paid back forming and net, all updating as the playback advances |
| Bond itemisation | Data table | kJ/mol | Every bond type, how many of them, and the subtotal for breaking and for forming |
| Energy profile | Line graph | kJ/mol vs reaction progress | The hump and the drop, redrawn as a staircase when enzymes are present |
| ATP slots filled | Counter | ATP | Out of 32; tracks the coupling slider |
| Radiator total | Live numeric | kJ/mol | Waste heat, always equal to net minus what reached the vault |
| Conservation badge | Pass-fail badge | — | Green while vault plus radiator equals net; it cannot be made to go red by any legal setting |
| Cell temperature rise | Live numeric | °C | What the radiator's joules do to the cell inset, so waste heat is a real quantity and not a shrug |

**What the student should realise.**
Students believe energy is created in respiration, and repeat that "energy is released when bonds break". Breaking every bond in this reaction costs 12,469 kJ/mol and the ledger stays negative until products form. The surplus exists only because the new bonds pay back more than the old cost. The student should be able to say: *"Nothing made new energy. Building the new bonds gave back more than taking the old ones apart cost, and that difference is what I get."*

### C4.4 · Comparing respiration to a familiar reaction

**Experiment name:** Two Ways to Burn the Same Sugar  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
One long lab bench behind a sheet of safety glass, lit hard from above, with two rigs facing each other across a shared central ledger. On the left, a bomb calorimeter: a squat steel pressure vessel with ignition leads, sunk in a stirred water jacket, a Beckmann thermometer standing in the water, and a small armoured viewport through which a 4.00 g pressed glucose tablet sits in a nickel crucible. On the right, a conical respirometer flask of cloudy beige yeast suspension holding a second, identical tablet, a thermistor and two gas probes through its bung, and no flame anywhere. Two wall clocks above the rigs run at wildly different speeds, each with its compression factor printed large in red. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Safety glass and twin bench | Environment | 2.4 m stainless bench split by a central ledger plinth; 8 mm polycarbonate screen with a faint reflection so the scene reads as behind glass | No |
| 2 | Bomb calorimeter vessel | Structure | Steel cylinder 65 mm × 100 mm with a screw head, oxygen fill valve, two insulated ignition posts and a 20 mm armoured viewport; cutaway view available | Yes: swap |
| 3 | Water jacket, stirrer and thermometer | Instrument | 2.00 kg of water in an insulated pail with a paddle stirrer and a Beckmann thermometer reading to 0.01 °C; the jacket is the whole measurement | No |
| 4 | Ignition coil and fuse wire | Actor | Nichrome loop across the crucible; glows orange then white on firing; the only energy input to the left rig, logged at 50 J and subtracted from the result | Yes: place |
| 5 | Glucose tablet | Actor | Pressed dextrose cube, 4.00 g, 18 mm, chalky white with a pressed seam; two identical tablets exist, one per rig; shrinks, browns and chars in the left rig, dissolves in the right | Yes: resize |
| 6 | Flame | Particle | Luminous yellow-white plume with a blue base, 1,100 °C in air and up to 1,600 °C in pure oxygen; emits light and soot; the temperature figure is printed on the plume | No |
| 7 | Soot and ash residue | Structure | Grey-black crust in the crucible whose mass is weighed and logged; a reminder that combustion in poor oxygen is incomplete | No |
| 8 | Respirometer flask | Structure | 1 L conical flask with a three-hole bung, magnetic stirrer bar, and a water bath around it holding 37 °C | Yes: swap |
| 9 | Yeast suspension | Actor | 600 mL cloudy beige culture, 8 g of cells, aerated by a fine sparger; swappable for a minced-muscle homogenate that gives the same chemistry with a different rate | Yes: swap |
| 10 | Thermistor | Instrument | Bead probe in the flask reading to 0.01 °C against a matched reference flask, so a rise of a fraction of a degree is still measurable | No |
| 11 | Carbon dioxide and oxygen probes | Instrument | NDIR CO₂ sensor 0–10,000 ppm and a galvanic O₂ cell 0–25%, both in the flask headspace; a matching pair samples the bomb's gases after firing | No |
| 12 | ATP counter | Instrument | Digital totaliser on the right rig only, reading ATP made in moles and in kJ; the left rig's equivalent readout is present and permanently pinned at zero | No |
| 13 | Reaction profile overlay | Overlay | One pair of axes carrying both routes: a single tall cliff for combustion and a flight of thirty small steps for respiration, drawn to the same vertical scale in kJ/mol | Yes: swap |
| 14 | Shared product ledger | Overlay | Central plinth display: CO₂ made, H₂O made and total energy released, one column per rig, converging on identical figures | No |
| 15 | Energy pie | Overlay | Two pies below the ledger splitting each rig's output into heat, light and ATP; the left pie has no ATP wedge at all | No |
| 16 | Twin timeline with compression badges | UI-Probe | Two scrubbable timelines with their compression factors printed in red; a lock button forces both to real time so the rate difference is felt rather than read | Yes: drag |

**How it works — the model.**
Both rigs run identical stoichiometry, C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O, and identical total energy, 15.56 kJ per gram, so 4.00 g releases 62.2 kJ on either side. Everything else differs. Combustion is one uncatalysed step gated by an ignition temperature near 400 °C; once lit, it is self-sustaining and oxygen-limited, finishing in about 35 s with a flame at 1,100 °C, and all 62.2 kJ leaves as heat and light, raising the 2.00 kg jacket by 7.4 °C. Respiration is thirty enzyme-catalysed steps at 37 °C, rate-limited by enzyme number, finishing in about six hours; 34% of the energy is captured as roughly 0.71 mol of ATP and the remaining 41 kJ trickles out at under 2 W, raising the flask by about 1 °C. The rule the engine must never break is that the two product ledgers end identical.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Glucose mass | Slider | 0.50–10.00 | 4.00 | g | Fuel in both rigs at once; they always get the same |
| Oxygen supply to the bomb | Slider | 20–100 | 100 | % O₂ | Flame temperature and how much soot is left in the crucible |
| Ignition | Toggle | Armed / Off | Off | — | Fires the coil; nothing happens on the left rig until this is thrown |
| Enzyme steps active | Stepper | 0–30 | 30 | steps | How many catalysed steps the right rig has, and therefore its rate |
| Cell rig temperature | Slider | 5–45 | 37 | °C | Enzyme rate, with denaturation collapsing the rate above 42 °C |
| Water jacket insulation | Toggle | On / Off | On | — | Whether the left rig's heat is retained for measurement or lost to the room |
| Left rig time compression | Dial | 0.1×–10× | 1× | — | Playback speed of the combustion rig |
| Right rig time compression | Dial | 1×–5,000× | 1,000× | — | Playback speed of the cell rig, so six hours fits in the lesson |
| View | Radio | Bomb only / Cell only / Synchronised split | Synchronised split | — | Which rig fills the frame; Synchronised locks both clocks to real time |
| Ledger units | Dropdown | kJ / kJ per gram / kcal | kJ | — | Units on the shared ledger and both pies |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Same fuel, both rigs | Glucose mass=4.00; Ignition=Armed; Enzyme steps active=30; Cell rig temperature=37; View=Synchronised split | Record peak temperature, duration and total energy for each rig. Which of those three numbers is the same on both sides? |
| S2 | A cell at flame temperature | Cell rig temperature=45; Enzyme steps active=30; Glucose mass=4.00 | Push the cell rig hot. The rate collapses instead of rising. What broke, and why can a cell not simply run hotter to go faster? |
| S3 | No enzymes, no ignition | Enzyme steps active=0; Ignition=Off; Glucose mass=4.00; Cell rig temperature=37 | Both tablets just sit there unchanged. If glucose really has 62.2 kJ in it, why is nothing happening on either side? |
| S4 | Where the carbon ends up | Ignition=Armed; Oxygen supply to the bomb=20; Enzyme steps active=30 | Starve the flame of oxygen and compare the ledgers. Which rig accounted for every carbon, and what is sitting in the crucible? |

**Student activities.**
1. Run S1 and record, for each rig, the peak temperature, the time to finish, the CO₂ made and the total energy released. Circle every figure that matches across the two rigs.
2. Lock both timelines to real time using the View control, watch for thirty seconds, and write one sentence describing what each rig has managed in that period.
3. Set enzyme steps to 0, 10, 20 and 30, recording the time the right rig takes to finish each run, and state whether the total energy released changed.
4. Read both energy pies and record the percentage that ended as ATP in each rig. Explain the left rig's figure.
5. Drop the bomb's oxygen to 20%, fire it, and record the ash mass and the CO₂ shortfall. Say what happened to the missing carbon.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Peak temperature per rig | Live numeric | °C | Flame temperature on the left, flask temperature on the right, side by side |
| Temperature traces | Line graph | °C vs s | Jacket and flask on shared axes with a logarithmic time axis, so a 35 s event and a 6 h event both fit |
| Shared product ledger | Data table | mol and g | CO₂ and H₂O made by each rig, plus total energy released; the columns converge |
| Energy split | Bar chart | % | Heat, light and ATP for each rig; ATP is zero on the left by construction |
| Duration | Timer | s | Elapsed simulated time to completion for each rig, printed with its compression factor |
| Reaction profile | Line graph | kJ/mol vs progress | The cliff and the staircase drawn to one vertical scale |
| Run log | Data table | mixed | Exportable CSV: every control setting and every readout, one row per run |

**What the student should realise.**
Students think respiration is nothing like burning, or that cells burn food and get hot. Both rigs take the same glucose and oxygen and release the same 62.2 kJ, yet one runs at 1,100 °C for 35 seconds and the other at 37 °C for six hours, banking a third as ATP. The student should be able to say: *"Same reaction, same products, same energy. The cell just does it in small steps, slowly and cool enough to keep."*

### C4.5 · Applying the model to an unfamiliar food molecule

**Experiment name:** Mystery Fuel: Balancing a Fat  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS1-7

**Theme & scene.**
The molecular bench returns, but the cradle now holds something the student has never seen: a triglyceride, three long charcoal hydrocarbon tails hanging from a short three-carbon backbone like a comb with only three teeth, fifty-one carbons in all, so large it has to be framed wide. Behind the cradle a brass carousel carries five other sample vials on a turntable. To the right, the familiar product rack and oxygen dial, with one new template greyed out and padlocked. Along the bottom, a prediction card is pinned to the bench with three empty boxes waiting for numbers, and beside it a dashboard strip carries an RQ dial, an energy-per-gram bar chart and a small water gauge. A field inset window sits top-right, currently dark. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Substrate carousel | Instrument | Brass turntable of six labelled vials; rotating it lifts the chosen molecule into the cradle and rebuilds the tally board's starting counts | Yes: swap |
| 2 | Glucose reference molecule | Actor | The pyranose ring from C4.1, kept as the known case; C₆H₁₂O₆, 24 atoms, drawn at the same scale as everything else so size comparisons are honest | Yes: drag |
| 3 | Butanoic acid molecule | Actor | C₄H₈O₂, a four-carbon chain ending in a carboxyl group with one C=O and one O–H; small enough to count by hand, and the rung the student starts on | Yes: drag |
| 4 | Lauric acid molecule | Actor | C₁₂H₂₄O₂, a twelve-carbon saturated chain with a single carboxyl head; a real coconut and palm-kernel fatty acid; 38 atoms | Yes: drag |
| 5 | Tripalmitin molecule | Actor | C₅₁H₉₈O₆: glycerol backbone of 3 carbons carrying three ester linkages, each to a sixteen-carbon palmitate tail; ester oxygens highlighted so the three joins are findable; 155 atoms | Yes: drag |
| 6 | Alanine molecule | Actor | C₃H₇NO₂: a carboxyl group, a central carbon with a methyl branch, and an amino group whose blue nitrogen is the only blue atom on the bench | Yes: drag |
| 7 | Nitrogen atom | Particle | CPK blue sphere, covalent radius 0.71 Å at the same ×80 scale, three sockets; the atom the CO₂-and-water model has no home for | Yes: drag |
| 8 | Oxygen dial and dispenser | Instrument | The hopper from C4.2 with its range widened to 0–160, because a triglyceride needs seventy-two and a half oxygen molecules and the student has to meet that half | Yes: drag |
| 9 | Product templates | Structure | Linear CO₂ ghosts and bent H₂O ghosts as before, plus a padlocked urea template, O=C(NH₂)₂, that unlocks only when nitrogen appears on the bench | Yes: place |
| 10 | Per-element tally with nitrogen column | Overlay | C, H and O counters as before, with an N column that fades in the moment a nitrogen-bearing substrate is loaded, and a flag reading "this model has no product for N" until the urea route is chosen | No |
| 11 | Prediction card | UI-Probe | Pinned card with three numeric boxes for O₂, CO₂ and H₂O, plus a signature line; the run button stays locked until the card is filled in | Yes: place |
| 12 | Scoring badge | Instrument | Marks the submitted prediction against the balanced equation, element by element, and prints which element was wrong rather than just "incorrect" | No |
| 13 | Respiratory quotient dial | Instrument | Analogue dial reading CO₂ made divided by O₂ used, 0.60 to 1.10, with printed bands: fat near 0.70, protein near 0.80, carbohydrate at 1.00 | No |
| 14 | Energy-per-gram bar chart | Overlay | Bars for each substrate in kJ per gram: glucose 15.6, butanoic acid 24.8, lauric acid 36.8, tripalmitin 38.9, alanine 17.7, with the food-label values printed alongside | No |
| 15 | Metabolic water gauge | Instrument | Column gauge reading grams of water made per gram of fuel: glucose 0.60, lauric acid 1.08, tripalmitin 1.09; fills as the run proceeds | No |
| 16 | Field inset | Overlay | Small window showing a Merriam's kangaroo rat in a Mojave burrow that never drinks, an overwintering monarch cluster at Pismo Beach, or an Anna's hummingbird in overnight torpor; each captioned with the fuel it is living on | Yes: swap |

**How it works — the model.**
The balancer is general, not scripted. For any formula CₓH_yO_z it solves the same three conservation equations the student is asked to solve: carbon fixes CO₂ at x, hydrogen fixes H₂O at y/2, and oxygen fixes O₂ at (2x + y/2 − z)/2. Tripalmitin returns 72.5, which forces the student to double the whole equation, and the sim says so rather than quietly rounding. Nitrogen breaks the pattern deliberately: with alanine loaded there is no product in the rack that can take an N, and the tally board flags it. Choosing the calorimeter route balances to N₂; choosing the body route unlocks urea and drops the usable energy from the bomb value of 23 kJ per gram for protein to the 17 kJ per gram a food label prints, because the nitrogen leaves the body still carrying energy. Energy and RQ come from a lookup of real measured values, not from the bond ledger, and the panel says which.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Substrate | Dropdown | Glucose / Butanoic acid / Lauric acid / Tripalmitin / Alanine / Mystery fuel | Glucose | — | Which molecule the carousel lifts into the cradle and what the tally starts at |
| Predicted O₂ | Numeric field | 0–160 | 0 | molecules | The student's own coefficient, submitted before the run is allowed to start |
| Predicted CO₂ | Numeric field | 0–120 | 0 | molecules | As above, for carbon dioxide |
| Predicted H₂O | Numeric field | 0–120 | 0 | molecules | As above, for water |
| Balance help | Radio | Off / Hint / Solve | Off | — | Off scores blind; Hint names the element that is short; Solve fills the card and is logged as such |
| Nitrogen route | Radio | Nitrogen gas (calorimeter) / Urea (body) | Urea (body) | — | Which product template unlocks, and which energy figure the chart reports |
| Sample mass | Slider | 0.5–20.0 | 5.0 | g | Drives the per-gram outputs, the water gauge and the total energy figure |
| View | Radio | Molecule bench / Dashboard / Both | Both | — | Whether the cradle, the readouts, or both fill the frame |
| Tally columns | Multi-select | C / H / O / N | C, H, O | — | Which element counters are shown; N appears automatically when needed |
| Field inset | Dropdown | None / Mojave kangaroo rat / Pismo monarch cluster / Hummingbird in torpor | None | — | Which real animal is shown alongside, with the fuel it is running on |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Check the tool | Substrate=Glucose; Balance help=Off; Predicted O₂=6; Predicted CO₂=6; Predicted H₂O=6 | Start with the molecule you already know. Does the bench give the same answer you got in C4.2? |
| S2 | Climbing the fat ladder | Substrate=Butanoic acid, then Lauric acid, then Tripalmitin; Balance help=Off; Sample mass=5.0 | Balance each in turn. Why does oxygen needed per gram keep climbing as the tails get longer? |
| S3 | Name that fuel | Substrate=Mystery fuel; Balance help=Off; Sample mass=5.0; Field inset=Mojave kangaroo rat | The RQ dial reads 0.70 and the water gauge reads 1.08 g per gram. Which of the five known substrates is this animal running on, and how do you know? |
| S4 | The nitrogen problem | Substrate=Alanine; Tally columns=C, H, O, N; Nitrogen route=Nitrogen gas (calorimeter), then Urea (body) | The rack has no product that can hold a nitrogen. Where does the model break, and what has to be added to fix it? |

**Student activities.**
1. Load lauric acid and fill in the prediction card before running anything. Record your three numbers, then run and copy the scoring badge's verdict, including which element it named.
2. Balance all three fats in turn and build a table of substrate, O₂ per molecule, CO₂ per molecule and H₂O per molecule.
3. Set sample mass to 5.0 g for glucose and then for tripalmitin, recording energy released and water made for each. Work out how many times more water the fat produced per gram.
4. Run the mystery fuel and record the RQ dial and the water gauge. Name the fuel and give both readings as your evidence.
5. Load alanine and try to balance it with only CO₂ and H₂O templates. Record what the tally board's nitrogen column does, then switch the nitrogen route to Urea and record how the energy figure changes.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Balanced equation | Live numeric | molecules | Solved coefficients for O₂, CO₂, H₂O and, where relevant, urea or N₂, printed as a full equation |
| Prediction score | Pass-fail badge | — | Element-by-element check of the student's card, naming any element that failed |
| Per-element tally | Data table | atoms | C, H, O and N before and after, with a difference column pinned at zero |
| Respiratory quotient | Live numeric | CO₂ per O₂ | Computed from the balanced coefficients, to 2 dp, with its band label printed beside it |
| Energy per gram | Bar chart | kJ/g | All six substrates on one axis, with bomb and food-label values shown separately for the protein |
| Metabolic water yield | Live numeric | g water per g fuel | From the balanced equation and the molar masses, to 2 dp |
| Oxygen demand | Live numeric | mol O₂ per gram | Shows fat needing roughly 2.7 times as much oxygen per gram as glucose |
| Substrate comparison log | Data table | mixed | Exportable CSV, one row per substrate, every coefficient and every readout |

**What the student should realise.**
Students believe the respiration equation is a fact about sugar, and that a model that fails is worthless. Balancing a fifty-one-carbon fat with the same rules shows the model generalises; the fat's oxygen-poor tails explain its extra oxygen demand and energy per gram; and alanine's nitrogen shows where it runs out. The student should be able to say: *"Same rules, different atom counts, different answer. When the atoms include nitrogen, I need a new product to put it in."*

## C5 · Tracing carbon through an organism

### C5.1 · A carbon atom enters a plant

**Experiment name:** Through the Stoma: One Carbon Comes In  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Explore  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS1-6

**Theme & scene.**
The camera hangs beneath a valley oak leaf in the Central Valley, looking up at its pale, downy underside, backlit so the blade glows lime-green and the veins read as dark ribs. Ahead sits one stoma: two kidney-shaped guard cells, inner walls thickened and darker, bowed apart around a slot 12 µm long. Air molecules drift past as faint grey pairs and trios. One CO₂ molecule carries a carbon drawn as a bright gold sphere with a pulsing white ring, and the whole scene is lit to serve it. Depth-of-field fog hides the mesophyll beyond the pore until the student dives through. A scale bar at bottom left reads 10 µm and rescales at every stage. The control panel docks right; the Tag Tracker strip runs along the top.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Valley oak leaf underside | Environment | Lower epidermis as a sheet of jigsaw-shaped pavement cells under a waxy cuticle with a faint sheen, tufts of star-shaped trichomes; backlit lime-green with dark vein ribs; about 120 stomata per 0.25 mm² patch, only the central one built at full detail | No |
| 2 | Guard cell pair | Actor | Two kidney-shaped cells 35 µm long; thick inner wall drawn darker, thin outer wall, radial cellulose micro-fibrils drawn as fine hoops; each holds five small chloroplasts and a vacuole that swells with turgor; pore width animates 0–8 µm; the student can pull them apart or push them together | Yes: drag |
| 3 | Stomatal pore and substomatal chamber | Structure | Slot 12 µm by 0–8 µm opening into an air-filled cavity 60 µm across, lined by wet spongy-mesophyll surfaces drawn with a glossy water film | Yes: resize |
| 4 | Spongy mesophyll cell | Structure | Irregular lobed cell 40 µm across; primary cell wall 0.5 µm as a woven cellulose mat; plasma membrane beneath it as a thin bilayer; streaming cytoplasm, one large pale vacuole; 20 chloroplasts pressed against the wall | No |
| 5 | Chloroplast | Structure | Lens 6 × 3 µm; double envelope 10 nm apart; 40 grana of 10–20 thylakoid discs each, joined by stroma lamellae; stroma a pale-green gel; two or three white starch grains that grow during the run | Yes: drag |
| 6 | Thylakoid membrane detail | Structure | At the nanometre stage the disc surface shows chlorophyll antenna rosettes as green discs, two photosystem blocks, and a teal ATP synthase rotor 20 nm tall that spins while photons land; water molecules split at photosystem II and O₂ dimers leave from there | No |
| 7 | Rubisco | Actor | Barrel about 11 nm across, eight large teal subunits and eight small violet ones; 2,000 faint instances in the stroma, one at full detail near the camera; its jaw closes on a CO₂ and opens on two 3-PGA beads | No |
| 8 | Calvin cycle carousel | Overlay | Ring of bead molecules in the stroma (RuBP 5 beads, 3-PGA 3 beads, G3P 3 beads) turning slowly; every three CO₂ that enter release one G3P; two G3P join into a glucose ring at the exit | No |
| 9 | Tagged carbon atom | Particle | Charcoal CPK carbon overdrawn as a gold sphere r=0.7 u with a white pulsing halo and a 2 s comet trail; keeps its identity through every reaction; the student drops the tag onto any CO₂ in the boundary layer | Yes: place |
| 10 | CO₂, H₂O and O₂ pool | Particle | Linear O=C=O (red, charcoal, red), bent H₂O (red with two white, 104.5°), O₂ red dimers; about 400 CO₂, 1,500 H₂O and 250 O₂ in view, Brownian walk; all countable in the ledger | No |
| 11 | Photon darts | Particle | Gold darts 30 px long arriving from above at a rate set by light; absorbed on contact with an antenna, never reflected back; drive guard-cell opening and the carousel speed | No |
| 12 | Product molecules | Structure | Glucose as a six-carbon chair ring with red oxygens and white hydrogens; starch as a helix of glucose rings coiling into the grain; sucrose as a glucose-fructose pair that exits the cell; cellulose as straight glucose chains bundled into a 3 nm microfibril in the wall | Yes: swap |
| 13 | Cellulose synthase rosette | Actor | Six-lobed rosette 25 nm across in the plasma membrane; spins and extrudes a microfibril into the wall that lengthens visibly, one glucose unit per turn | No |
| 14 | Aperture gauge and chamber CO₂ probe | Instrument | Micrometer readout across the pore giving width in µm; a small infrared probe the student drags into the substomatal chamber reading ppm | Yes: drag |
| 15 | Tag Tracker strip | Overlay | Top strip naming the tagged atom's current molecule, compartment and elapsed time, with a breadcrumb chain of every molecule it has been part of | No |
| 16 | Stage camera and scale bar | UI-Probe | Six-stage camera rig (leaf surface, stoma, mesophyll cell, chloroplast, thylakoid and stroma, cell wall) with a lock-to-atom button; scale bar auto-rescales from 1 mm to 10 nm | Yes: drag |

**How it works — the model.**
Pore width w follows guard-cell turgor: light drives K⁺ into the guard cells, water follows, and w rises toward 8 µm; darkness or dry air reverses it, with a ten-minute time constant compressed to seconds. CO₂ entry per tick is proportional to w × (C_outside − C_chamber). Inside, the tagged CO₂ dissolves into the wet wall, diffuses straight through the membrane (small and nonpolar, so no channel is needed), crosses the double envelope and reaches the stroma. The Calvin ring is a state machine: Rubisco joins one CO₂ to a five-carbon RuBP, giving two three-carbon 3-PGA; every three CO₂ fixed release one G3P; two G3P make one glucose. The tagged carbon becomes one of that glucose's six carbons and keeps its gold halo through starch, sucrose or cellulose. Failure to avoid: the tagged carbon must never vanish and must never appear in O₂; the O₂ that leaves comes only from water molecules split on the thylakoid membrane, which is why the oxygen tags exist.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Light level | Slider | 0–2,000 | 800 | µmol/m²/s PAR | Photon arrival rate, guard-cell opening and carousel speed |
| Outside CO₂ | Slider | 150–1,000 | 425 | ppm | Number of CO₂ molecules in the boundary-layer air and the entry rate |
| Air humidity | Slider | 10–95 | 55 | % RH | Vapour-pressure deficit; dry air closes the pore even in full light |
| Guard-cell turgor override | Dial | Auto / 0–100 | Auto | % | Forces pore width by hand regardless of light and humidity |
| Tag element | Dropdown | Carbon of CO₂ / Oxygen of CO₂ / Oxygen of H₂O | Carbon of CO₂ | — | Which atom carries the gold halo, and therefore where the tag ends up |
| Product fate | Radio | Starch grain / Cellulose in wall / Sucrose to phloem | Starch grain | — | Where the tagged glucose is built once it leaves the carousel |
| Camera stage | Dropdown | Leaf surface / Stoma / Mesophyll cell / Chloroplast / Thylakoid and stroma / Cell wall | Stoma | — | Scene scale, fog depth and the scale bar |
| Lock camera to atom | Toggle | On / Off | On | — | Camera follows the tagged atom through every stage automatically |
| Molecule counters | Toggle | On / Off | On | — | Shows the countable CO₂, H₂O, O₂ and glucose ledger |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Morning in the Valley | Light level=800; Outside CO₂=425; Air humidity=55; Tag element=Carbon of CO₂; Product fate=Starch grain | Follow the gold atom from the air to the starch grain. How many different molecules is it part of on the way, and does it ever stop being a carbon atom? |
| S2 | Door shut at noon | Light level=800; Air humidity=15; Guard-cell turgor override=Auto | It is a hot, dry afternoon and the pore closes though the sun is bright. What happens to the chamber CO₂ reading and to the carousel speed? |
| S3 | Berkeley, 1941 | Tag element=Oxygen of CO₂, then Oxygen of H₂O; Light level=800 | Ruben and Kamen at Berkeley tagged oxygen atoms. Which tag turns up in the O₂ leaving the leaf, and which stays in the sugar? |
| S4 | Building a wall | Product fate=Cellulose in wall; Camera stage=Cell wall; Light level=1,200 | Your atom began as a gas. How long does it take to become part of a solid microfibril, and how many glucose units are in the chain when it arrives? |

**Student activities.**
1. Drag the gold tag onto any CO₂ molecule at the leaf surface, run at 1×, and record every molecule listed on the Tag Tracker breadcrumb until the atom reaches a glucose.
2. Set Air humidity to 15 % with Light level at 800 and record pore width and chamber CO₂ every 10 s for one minute; note the moment the carousel slows.
3. Pull the guard cells apart by hand with the override on, then release them, and record how pore width and the CO₂ entry rate change.
4. Predict, then test, which tag (carbon of CO₂, oxygen of CO₂, oxygen of H₂O) appears in the O₂ leaving the pore; record the ledger counts for each run.
5. Swap Product fate to Cellulose in wall, run until the atom is fixed in the wall, and record the glucose count in the microfibril and the air-to-solid timer.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Tag Tracker breadcrumb | Data table | — | Ordered list of every molecule and compartment the tagged atom has occupied, with the time of each hand-over |
| Pore width | Live numeric | µm | Stomatal aperture, updated every frame |
| Chamber CO₂ | Live numeric | ppm | Substomatal probe reading, updated every 0.5 s |
| CO₂ entry rate | Line graph | molecules/s vs s | Entry through the modelled stoma; falls to zero as the pore shuts |
| Molecule ledger | Counter | molecules | CO₂ in, H₂O in, O₂ out and glucose made, running totals that settle at 6:6:6:1 |
| Air-to-solid timer | Timer | s | Simulated time from tagging to the atom's fixing in starch or cellulose |
| Run log | Data table | mixed | Exportable CSV of every run, with tag element, fate and timings |

**What the student should realise.**
Students believe a plant turns carbon dioxide into oxygen, as if one gas were swapped for the other. The tagged atom makes that untenable: the carbon never leaves as O₂, the oxygen that leaves comes from water, and the carbon ends up fixed in a solid starch grain or a cellulose wall. The student should be able to say: *"The plant keeps the carbon. That gas atom is now part of the leaf, and the oxygen it gave off came from water."*

### C5.2 · A carbon atom moves into an animal

**Experiment name:** Swallowed: One Carbon Changes Owner  
**Render mode:** 2.5D Layered  
**Simulation engine:** Agent-based + State machine  
**Interaction level:** Manipulate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS1-7

**Theme & scene.**
A valley oak branch at the woodland edge, and on it the eater the student has chosen: a California oakworm caterpillar, 25 mm long, olive-green with yellow and black stripes, shearing a leaf edge with dark mandibles, or a black-tailed mule deer with its head down in the same branch. The animal is drawn whole and small at the left; its gut unrolls to the right as a glowing cutaway strip, pink-red and moist, built in sliding layers: lumen, gut wall, blood, muscle. The gold carbon glows inside the leaf, in a starch grain or a cellulose wall, waiting to be bitten. Leaf tissue keeps a cool green tint, the animal's body is warm crimson, and the gut lumen is deliberately left green because it is still outside. Scale bar re-labels per layer, cm to nm. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Eater body | Actor | Two full-body models: a 25 mm California oakworm caterpillar (olive-green, yellow and black stripes, brown head capsule) chewing a leaf edge, and a 1.4 m black-tailed mule deer browsing an oak twig with a sideways grinding jaw; the cutaway strip re-plans itself when the eater is swapped | Yes: swap |
| 2 | Valley oak leaf fragment | Structure | Leaf piece 20 × 20 mm showing mesophyll cells with white starch grains, a woven cellulose wall and a phloem vein carrying sucrose; the gold carbon sits in whichever the student chooses; glucose units drawn as countable rings | Yes: place |
| 3 | Mouthparts | Structure | Caterpillar mandibles as two dark chitin blades that shear the leaf into 0.5 mm strips; deer molars as ridged enamel that grind to 0.1–2 mm particles; particle size is read by the model | No |
| 4 | Foregut and crop, or rumen | Structure | Caterpillar: a short muscular crop; deer: a rumen about 6 L, olive-brown, holding a floating fibre mat; both animate a slow churn | No |
| 5 | Rumen microbes | Actor | Deer only: cellulose-digesting bacteria as 2 µm cream rods, 3,000 instanced, and ciliate protozoa 50 µm long, translucent, that attach to fibres and release volatile fatty acid beads (acetate, propionate, butyrate) | Yes: swap |
| 6 | Midgut or small intestine lumen | Environment | Tube 2 mm across (caterpillar, pH 10, violet tint) or 25 mm across (deer, pH 7); a peristalsis wave every 4 s carries the food bolus along | No |
| 7 | Digestive enzymes | Actor | Amylase as a blue clamshell that cuts starch chains to maltose; maltase as a teal block fixed on the brush border; cellulase as an orange wedge that exists only inside rumen microbes; 200 of each, drifting and snapping onto matching substrates | Yes: swap |
| 8 | Gut wall epithelium | Structure | Deer: villi 0.5 mm tall; caterpillar: flat columnar cells; every cell carries a brush border of 1 µm microvilli, a nucleus, and tight junctions drawn as zips to its neighbours; zooms to a bilayer at the nm stage | No |
| 9 | Sugar transporter and acid route | Actor | SGLT1 as a violet barrel in the microvillus membrane that carries one glucose with Na⁺ per cycle and therefore saturates; in the deer's rumen wall a pale-yellow passive route for the fatty-acid beads | No |
| 10 | Capillary and blood | Environment | 8 µm capillary under the epithelium with plasma pale yellow and biconcave red blood cells 7 µm across, 100 instanced, moving at 1 mm/s toward the hepatic portal vein; in the caterpillar an open haemolymph space with a dorsal tube heart | No |
| 11 | Liver way-station | Structure | Lobule cutaway where glucose may be parked as branched glycogen and later released; in the deer it also rebuilds glucose from propionate; adds a visible delay when the detour is on | No |
| 12 | Heart and arterial route | Structure | Deer: four-chamber heart at 60 bpm sending blood down an artery to a leg muscle; caterpillar: dorsal vessel pulsing haemolymph forward through the body cavity | No |
| 13 | Muscle cell | Structure | Striated fibre 50 µm across; sarcolemma studded with green sugar-transporter proteins; cytoplasm with glycogen granules and dark, inactive mitochondria that light up only in C5.3 | No |
| 14 | Frass and dung turnstile | Instrument | Counter at the hindgut or rectum ticking for every tagged atom that leaves without entering the body; black 2 mm frass pellets or deer pellets pile up beneath | No |
| 15 | Tagged carbon atom | Particle | Gold sphere with white halo and comet trail, identical to C5.1; keeps its identity through every molecule; the camera lock follows it across layers; the student may re-tag any glucose in the leaf | Yes: drag |
| 16 | Sugar meter, pH probe and Tag Tracker | Instrument | A meter reading blood glucose or haemolymph trehalose in mmol/L; a draggable pH probe along the gut strip; the top Tag Tracker strip listing molecule, compartment and owner (leaf, gut lumen, animal body) with a transit stopwatch | Yes: drag |

**How it works — the model.**
The gut is a chain of compartments run as a state machine, and the tagged atom's current molecule decides which transitions it may take. Chewing sets particle size, and digestion rate scales with surface area, so rate ∝ 1/diameter. Starch is cut by amylase, then maltase, to glucose, at a rate set by pH and enzyme count; glucose crosses the epithelium only through SGLT1 carriers, so absorption saturates when a big meal arrives. Cellulose has no enzyme in either animal's own set: in the caterpillar it goes straight to frass, while in the deer rumen microbes carrying cellulase ferment it to volatile fatty acids that cross the rumen wall and reach the same muscle. In the deer the microbes ferment most starch too, and the liver rebuilds glucose from propionate; in the caterpillar absorbed sugar travels the haemolymph as trehalose. Transit times use real data (caterpillar 2–4 h, deer 24–72 h), compressed. Every tagged atom ends in muscle, liver store or dung; none is ever created, destroyed or "turned into energy".

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Eater | Radio | California oakworm caterpillar / Mule deer | California oakworm caterpillar | — | Swaps the body, the gut plan, the circulation and the enzyme set |
| Tag location in leaf | Dropdown | Starch grain / Cellulose wall / Sucrose in phloem sap | Starch grain | — | Which molecule the gold atom starts in |
| Chewing thoroughness | Slider | 0.1–3.0 | 1.0 | mm particle size | Surface area available to enzymes and therefore digestion rate |
| Gut microbes | Toggle | Present / Absent | Present | — | Whether cellulase-carrying microbes live in the rumen (deer) or the midgut (caterpillar, very few) |
| Meal size | Slider | 1–30 | 10 | g leaf | Number of glucose units in play and the height of the sugar peak |
| Muscle activity | Slider | 1–8 | 2 | × resting | Rate at which muscle transporters pull sugar out of the blood |
| Liver detour | Toggle | On / Off | Off | — | Whether the tagged glucose is parked as glycogen before release |
| Camera layer | Dropdown | Whole animal / Gut lumen / Gut wall / Bloodstream / Muscle cell | Whole animal | — | Which layer slides to the front, and the scale bar |
| Playback speed | Dial | 1×–600× | 60× | — | Time compression of the gut transit |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Caterpillar eats starch | Eater=California oakworm caterpillar; Tag location in leaf=Starch grain; Gut microbes=Present | Track the gold atom from leaf to muscle. At which single step does it stop being outside the animal and start being inside it? |
| S2 | Caterpillar eats wall | Eater=California oakworm caterpillar; Tag location in leaf=Cellulose wall | The atom is eaten but never absorbed. Where does it come out, and why could the caterpillar not use it? |
| S3 | The deer's helpers | Eater=Mule deer; Tag location in leaf=Cellulose wall; Gut microbes=Present, then Absent | Same wall carbon, different animal. Which molecule carries the atom into the deer's blood, and what happens when the microbes are switched off? |
| S4 | Big meal, fast run | Eater=Mule deer; Tag location in leaf=Starch grain; Meal size=30; Muscle activity=8 | Blood sugar spikes and then falls. Where did the atoms go, and does a bigger meal make each transporter work any faster? |

**Student activities.**
1. Set Eater to the caterpillar and the tag in a starch grain, run at 60×, and record every molecule and compartment on the Tag Tracker, marking the row where the owner column changes from gut lumen to animal body.
2. Move the tag to the cellulose wall, run again, and record whether the atom ever reaches the blood; read the frass turnstile at the end.
3. Swap Eater to the mule deer with the tag still in cellulose and record the molecule that finally crosses the rumen wall; switch Gut microbes to Absent and re-run.
4. Set Chewing thoroughness to 3.0 mm and then 0.1 mm at Meal size 10, and record the transit stopwatch and the sugar-meter peak for each.
5. Drag the pH probe along the caterpillar's gut and record the pH where amylase works fastest; compare with the deer's small intestine.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Tag Tracker breadcrumb | Data table | — | Molecule, compartment, owner and time for every hand-over of the tagged atom |
| Blood sugar | Line graph | mmol/L vs min | Meter trace of glucose (deer) or trehalose (caterpillar); rises after absorption, falls with muscle uptake |
| Absorption rate | Live numeric | molecules/s | Crossings through the transporters per second, showing saturation at large meals |
| Frass and dung tagged count | Counter | atoms | Tagged atoms that left without ever entering the body |
| Gut transit time | Timer | h | From first bite to exit or to the muscle cell, per run |
| Gut pH | Live numeric | pH | Reading at the draggable probe position |
| Run log | Data table | mixed | Exportable CSV with eater, tag location, particle size and final fate |

**What the student should realise.**
Students believe an eaten leaf simply becomes part of the animal, or is "used up as energy". The tagged atom shows neither: the leaf's carbon changes owner only at the instant a small molecule crosses the gut wall into the blood, and carbon locked in cellulose passes straight through a caterpillar unless a microbe frees it. The student should be able to say: *"Eating doesn't move carbon into an animal; absorbing does, and only small molecules get absorbed."*

### C5.3 · A carbon atom returns to the air

**Experiment name:** Exhaled: One Carbon Leaves the Deer  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-LS1-7

**Theme & scene.**
A black-tailed mule deer stands in morning fog at Point Reyes, breath steaming, drawn as a small live silhouette in the top-left corner whose ribs rise and fall at the breathing rate. The main view is a ride inside one of its leg-muscle fibres: amber cytoplasm banded with striations, and in front a mitochondrion sliced open, outer membrane smooth, inner membrane folded into cristae like a rack of shelves, the matrix a warm honey gel. The gold carbon arrives inside a glucose ring and the camera follows it in. Along the bottom a 2D route map, drawn like a transit line, lists the stations ahead: cytosol, mitochondrion, capillary, vein, heart, lung capillary, alveolus, nostril. A capnograph trace glows at the deer's nose. Scale bar starts at 1 µm; panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Deer silhouette with capnograph | Actor | 2D silhouette in fog, ribcage animating at the breathing rate; a probe at the nostril traces exhaled CO₂ percentage breath by breath | No |
| 2 | Muscle fibre cytosol | Environment | 50 µm fibre with sarcomere banding, glycogen rosettes, and ATP drawn as yellow triple-phosphate tokens consumed by sliding filaments at a rate set by activity | No |
| 3 | Glycolysis lane | Overlay | Ten-step conveyor in the cytosol reduced to three visible beads: one glucose (6 carbons) splitting into two pyruvate (3 carbons each); the gold carbon rides one of them | No |
| 4 | Mitochondrial outer membrane | Structure | Smooth ellipsoid 2 × 0.8 µm with grey porin barrels that pyruvate and CO₂ pass through; intermembrane space 15 nm tinted proton-blue | No |
| 5 | Inner membrane and cristae | Structure | Fourteen lamellar shelves in deep amber; electron-transport complexes I to IV as embedded blocks; teal ATP synthase rotors 22 nm tall that spin faster with demand; O₂ dimers are consumed at complex IV and water molecules appear there | Yes: resize |
| 6 | Matrix and Krebs carousel | Overlay | Honey gel holding a ring of eight bead molecules from citrate (6 beads) round to oxaloacetate (4 beads); every turn ejects two CO₂ from the ring into the matrix | No |
| 7 | Pyruvate gate complex | Actor | Large violet complex at the matrix entry that snips one carbon off each pyruvate as CO₂ and hands the two-carbon remainder to the carousel | No |
| 8 | Tagged carbon atom | Particle | Gold sphere with white halo and trail, identical to C5.1 and C5.2; the student chooses which of glucose's six carbons is gold, which sets the station where it leaves as CO₂ | Yes: place |
| 9 | O₂, CO₂ and H₂O pool | Particle | O₂ red dimers arriving from the capillary; CO₂ made in the matrix as red-charcoal-red rods; H₂O formed at complex IV; all countable, settling at 6 O₂ in to 6 CO₂ out per glucose | No |
| 10 | Sarcolemma and interstitial fluid | Structure | Muscle-cell bilayer that CO₂ crosses directly with no channel; a thin water layer between the fibre and the capillary | No |
| 11 | Capillary with red blood cells | Environment | 8 µm vessel; biconcave red cells 7 µm across with haemoglobin; inside each, carbonic anhydrase drawn as a green disc converting CO₂ + H₂O into a bicarbonate bead and H⁺; three carriage forms colour-coded (dissolved, bicarbonate, bound to haemoglobin) | Yes: swap |
| 12 | Venous return and heart | Structure | Transit-map stations with a four-chamber heart beating at 60–180 bpm; the right ventricle sends blood to the lung capillary; blood speed scales with heart rate | No |
| 13 | Alveolus and barrier | Structure | Air sac 200 µm across lined by flat type I cells with a surfactant sheen; total barrier 0.5 µm to the capillary; CO₂ diffuses from blood to air across it while O₂ crosses the other way | No |
| 14 | Airway and nostril turnstile | Instrument | Bronchiole to trachea to nostril; a turnstile counts every tagged atom leaving the body, per breath, and stamps a gold tick on the capnograph | No |
| 15 | Gas ledger | Overlay | Live O₂ consumed, CO₂ produced, H₂O made and ATP made, with RQ = CO₂ ÷ O₂ over the last 10 s | No |
| 16 | Station map and scale bar | UI-Probe | Bottom transit line with eight stations and a sliding gold marker; dragging the marker jumps the camera to that station; scale bar auto-rescales from 1 µm to 1 mm | Yes: drag |

**How it works — the model.**
The glucose carrying the tag is split in the cytosol into two pyruvate, releasing no CO₂ yet. Each pyruvate enters the matrix, where the gate complex snips one carbon off as CO₂ and the Krebs carousel releases two more per turn, so all six glucose carbons leave within a few turns; the tag position sets the exit station from a lookup table, a fair simplification of a ring that scrambles positions. O₂ is consumed only at complex IV on the cristae, where it becomes water: the sim must never show O₂ turning into CO₂, because that is the misconception. ATP synthase rate rises with demand, and demand sets O₂ delivery, heart rate and breathing rate. CO₂ leaves the cell by diffusion down its gradient and travels 70 % as bicarbonate, 23 % bound to haemoglobin and 7 % dissolved, with carbonic anhydrase setting the conversion speed. At the alveolus CO₂ crosses into air because its partial pressure in blood is higher. RQ is 1.0 for glucose and 0.7 for fat.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Activity level | Slider | 1–10 | 2 | × resting | Muscle ATP demand, O₂ delivery, heart rate (60–180 bpm) and breathing rate |
| Fuel | Radio | Glucose / Fatty acid / Acetate from the rumen | Glucose | — | Which molecule carries the tag in; changes the entry route and the RQ |
| Tag carbon position | Stepper | C1–C6 | C3 | — | Which carbon of glucose is gold; sets the station where it leaves as CO₂ |
| Carbonic anhydrase | Toggle | Active / Blocked | Active | — | Speed of CO₂ to bicarbonate conversion inside red blood cells |
| Breathing | Radio | Auto / Hold breath | Auto | — | Hold breath stops exit at the alveolus; blood CO₂ climbs until release |
| Cristae per mitochondrion | Slider | 4–24 | 14 | count | ATP synthase capacity and the maximum respiration rate |
| Camera station | Dropdown | Cytosol / Mitochondrion / Capillary / Heart / Alveolus / Nostril | Mitochondrion | — | Camera position and scale bar |
| Playback speed | Dial | 0.25×–60× | 4× | — | Time compression |
| Gas ledger | Toggle | On / Off | On | — | Shows the O₂, CO₂, H₂O, ATP counters and RQ |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Resting deer | Activity level=2; Fuel=Glucose; Tag carbon position=C3 | Follow the atom from glucose to the nostril. At which station does it become CO₂, and does any O₂ molecule ever touch it? |
| S2 | Uphill sprint | Activity level=9; Fuel=Glucose | The deer bolts. How much faster does the gold atom leave, and which numbers on the gas ledger change together? |
| S3 | Held breath | Breathing=Hold breath; Activity level=4 | The atom reaches the lung and stops. Where does CO₂ pile up, and what does that tell you about why an animal must breathe out? |
| S4 | Slow blood | Carbonic anhydrase=Blocked; Activity level=4 | With the red-cell enzyme blocked, most CO₂ must travel dissolved. Compare capillary CO₂ and the transit time to the lung with the S1 run. |

**Student activities.**
1. Run S1 at 4× and record the station where the gold atom leaves as CO₂ and the elapsed time to the nostril turnstile.
2. Step Tag carbon position from C1 to C6 and record the exit station for each; note which carbons leave first.
3. Set Activity level to 2, then 9, and record O₂ consumed, CO₂ produced and heart rate over 30 simulated seconds each; calculate RQ for both.
4. Swap Fuel to Fatty acid, run 30 s, and record how RQ changes; explain it from the ledger counts.
5. Hold breath for 20 simulated seconds, record capillary CO₂ before and after, then release and record the height of the first exhaled CO₂ peak on the capnograph.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Tag station log | Data table | — | Station, molecule and time for every hand-over from glucose to exhaled CO₂ |
| Gas ledger | Live numeric | molecules | O₂ in, CO₂ out, H₂O made and ATP made, updated every tick |
| Respiratory quotient | Live numeric | — | CO₂ produced divided by O₂ consumed over the last 10 s |
| Capnograph | Line graph | % CO₂ vs s | Exhaled CO₂ per breath at the nostril, with tagged exits marked as gold ticks |
| Blood CO₂ carriage | Bar chart | % | Share travelling dissolved, as bicarbonate, and bound to haemoglobin |
| Heart rate and breathing rate | Live numeric | bpm and breaths/min | Both driven by activity level |
| Run log | Data table | mixed | Exportable CSV of every run |

**What the student should realise.**
Students believe the CO₂ an animal breathes out is the air it breathed in with the oxygen taken away, and that food mass "becomes energy". The tagged atom leaves the mitochondrion as CO₂ built from food carbon, while every O₂ molecule ends up in water, never in CO₂. The student should be able to say: *"The carbon I breathe out was in my food, and before that in a leaf. Food mass leaves through the lungs as gas; energy is what the bonds gave up on the way."*

### C5.4 · Photosynthesis and respiration as linked opposite processes

**Experiment name:** Round Trip: Atoms Cycle, Energy Doesn't  
**Render mode:** 2D Canvas  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-LS1-6, MS-LS1-7

**Theme & scene.**
A flat, high-contrast bench on an ink-dark background, split by one bright vertical seam. Left, in cool jade: a glass reaction box labelled PHOTOSYNTHESIS, six CO₂ and six H₂O tiles on its input shelf, one glucose ring and six O₂ on its output shelf, a thick arrow between, and an anglepoise lamp above pouring gold photons in. Right, in warm ochre: an identical box labelled RESPIRATION with its arrow pointing the other way, heat shimmer rising and yellow ATP tokens dropping into a tray. Between them the shared ledger: one column of atom counters, C 6, H 12, O 18, that both boxes draw on, and beneath it an energy ledger with a light-in counter and a heat-out counter. The gold tagged carbon glows in whichever tile holds it. Panel docks right; the claim-builder tray runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Photosynthesis reaction box | Structure | Glass box 480 × 300 px with a jade rim, input shelf on the left, output shelf on the right, and a labelled arrow; runs the forward reaction whenever its input shelf holds a full set | No |
| 2 | Respiration reaction box | Structure | Identical geometry with an ochre rim and the arrow reversed; runs the breakdown reaction whenever a glucose and six O₂ sit on its input shelf | No |
| 3 | Reversible reaction arrows | Actor | Two thick arrows with draggable heads; flipping one redraws that box's shelves and re-runs it backwards; a red padlock appears on the respiration arrow when reversed, because the box cannot emit light | Yes: drag |
| 4 | Molecule tiles | Particle | CPK ball-and-stick tiles: C charcoal r=0.7 u, O red r=0.6 u, H white r=0.3 u, bonds as grey cylinders; per set exactly 6 CO₂, 6 H₂O, 1 glucose and 6 O₂ exist at any moment, in one form or the other; tiles drag between shelves and across the seam | Yes: drag |
| 5 | Tagged carbon | Particle | One of the six carbons drawn gold with a white halo; it appears exactly once in the whole scene at every instant and the ledger checks for it | Yes: place |
| 6 | Shared atom ledger | Overlay | Central column of C, H and O counters for the whole scene plus per-box sub-counts; totals pinned; flashes red if a tile is ever duplicated or lost | No |
| 7 | Energy ledger | Overlay | Below the atom ledger: a photon counter (light in, gold) and a heat-plus-ATP counter (energy out, red and yellow); the first increments only on the left, the second only on the right, and neither ever counts down | No |
| 8 | Lamp and photon stream | Environment | Anglepoise lamp over the left box; photons as gold darts at a rate set by light that vanish into the box and never come back out | No |
| 9 | Heat shimmer and ATP tokens | Particle | Rising heat waves from the right box and yellow ATP tokens dropping into a tray, about 32 per glucose; both feed the energy ledger | No |
| 10 | Bond-energy bars | Overlay | Side bars showing the stored bond energy of each shelf's molecules; higher for glucose plus O₂ than for CO₂ plus H₂O by about 2,800 kJ per mole of glucose | No |
| 11 | Loop conveyor | Actor | Optional belt the student connects from the left output shelf to the right input shelf and back again, so the same tiles circulate; a lap counter shows completed round trips | Yes: connect |
| 12 | Location and enzyme cards | Structure | Two small cards per box, hidden until revealed: where (chloroplast stroma and thylakoid, or mitochondrial matrix and cristae) and which enzymes (Rubisco and ATP synthase, or dehydrogenases and ATP synthase); deliberately not mirror images | No |
| 13 | Claim-builder tray | UI-Probe | Bottom tray holding the claim "respiration is photosynthesis run backwards" and draggable evidence cards (atom ledger, energy ledger, location, light, enzymes); scores each card as supporting or contradicting | Yes: drag |
| 14 | Rate dials | Instrument | One dial per box reading reactions per minute; the dials drive how fast tiles move between shelves | No |
| 15 | Net-rate meter | Instrument | Reads left rate minus right rate as net CO₂ consumed or made per minute, with a green zero mark | No |
| 16 | Journey replay scrubber | UI-Probe | Timeline that replays the tagged atom's full C5.1 to C5.3 journey as one lap on the conveyor, with the leaf, the deer's gut and the deer's lung drawn as small icons on the belt | Yes: drag |

**How it works — the model.**
Both boxes are stoichiometric engines over one shared tile set: the left consumes 6 CO₂ + 6 H₂O and light to yield 1 glucose + 6 O₂, the right consumes 1 glucose + 6 O₂ to yield 6 CO₂ + 6 H₂O plus heat and about 32 ATP. The atom ledger is recomputed every tick from the tiles on screen and must never change; the tagged carbon is a persistent object that swaps its parent molecule but never its identity. Rates come from the panel: the left box follows a saturating light curve, the right follows demand. The energy ledger is one-way by construction: light enters only on the left, heat and ATP leave only on the right, and neither counter ever decrements, which is why reversing the respiration arrow to "make light" locks with a padlock. This is honest at this grade: the two processes are exact opposites in atom bookkeeping but not in energy, machinery or location. The failure to avoid is a single double-headed arrow implying one reaction that simply runs backwards.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Light on the left box | Slider | 0–2,000 | 800 | µmol/m²/s PAR | Photon rate and the photosynthesis dial |
| Energy demand on the right box | Slider | 0–8 | 2 | × resting | Respiration dial, ATP and heat output |
| Arrow to reverse | Radio | None / Left (photosynthesis) / Right (respiration) | None | — | Attempts to run one box backwards; the atom ledger allows it, the energy ledger locks the right box |
| Loop conveyor | Toggle | Connected / Open | Open | — | Whether each box's outputs feed the other's inputs, enabling laps |
| Tile sets | Stepper | 1–4 | 1 | glucose equivalents | How many sets of 6 CO₂ + 6 H₂O are on the bench |
| Ledger view | Dropdown | Atoms / Energy / Both | Both | — | Which ledger is enlarged in the centre |
| Location and enzyme cards | Toggle | Hidden / Revealed | Hidden | — | Shows the non-mirror facts about where and how each process runs |
| Journey replay | Timeline scrubber | Leaf (C5.1) to Lung (C5.3) | Leaf (C5.1) | — | Scrubs the tagged atom around one full lap of its earlier journey |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Mirror check | Light on the left box=800; Energy demand on the right box=2; Ledger view=Atoms | Read the atom ledger before and after ten reactions in each box. Which numbers never change, and whose outputs exactly match whose inputs? |
| S2 | Flip the arrow | Arrow to reverse=Right (respiration); Ledger view=Energy | You reversed respiration, so it ought to make light. The atoms allow it. What locks, and what does that say about the two processes? |
| S3 | Ten laps | Loop conveyor=Connected; Light on the left box=800; Energy demand on the right box=2; Tile sets=1 | Run the gold atom round ten laps. How many atoms did you use up, and how much light did you have to add? |
| S4 | Not a mirror after all | Location and enzyme cards=Revealed; Ledger view=Both | Build the claim "respiration is photosynthesis in reverse". Which evidence cards support it and which contradict it? Write the corrected claim. |

**Student activities.**
1. Run S1 and record the C, H and O totals at the start and after ten reactions in each box, noting which tiles crossed the seam.
2. Drag the head of the right box's arrow to reverse it and record what the energy ledger shows and why the padlock appears.
3. Connect the loop conveyor, run ten laps, and record the lap counter, the atom totals, and the light-in and heat-out counters at the end.
4. Predict, before revealing the cards, whether the same enzymes run both boxes; then reveal them and record both location cards.
5. Drag evidence cards into the claim-builder until it accepts a claim, and write the corrected one-sentence claim it accepted.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Shared atom ledger | Data table | atoms | C, H and O totals for the scene and per box; pinned, flashing red if any total moves |
| Energy ledger | Live numeric | photons and kJ | Light in (left only) and heat plus ATP out (right only), cumulative and one-way |
| Bond energy per shelf | Bar chart | kJ per mol glucose | Stored bond energy of inputs versus outputs in each box |
| Lap counter | Counter | laps | Complete round trips of the tagged atom on the conveyor |
| Net rate | Live numeric | CO₂/min | Left rate minus right rate |
| Claim score | Pass-fail badge | — | Green when the evidence dragged onto the claim agrees with the ledgers and cards |
| Run log | Data table | mixed | Exportable CSV of every run |

**What the student should realise.**
Students believe respiration is photosynthesis played backwards, so the two cancel out and nothing is needed to keep them going. The two ledgers split that idea in half: the atoms do reverse exactly and can go round for ever, but the energy does not, since light must be added on every lap and heat leaves on every lap, and the machinery and location differ. The student should be able to say: *"The atoms go round and round; the energy goes through once, in as light and out as heat."*

### C5.5 · Why plants run both processes

**Experiment name:** Night Shift: A Sealed Seedling, 24 Hours  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-LS1-7

**Theme & scene.**
A single glass chamber on a dark bench under a dimmable LED bar that brightens and fades with a 24-hour clock in the corner. Inside stands a valley oak seedling 25 cm tall with five lobed leaves, its acorn still attached at the base, the pot cut away so the tap root shows against dark soil. A second, lower glass box can seal the root zone on its own. Two CO₂ sensors glow on the lids, a third sensor labelled TAGGED FRACTION reads a gold number, and a gas syringe on the top lid holds a charge of gold-tagged CO₂. Gas molecules drift as countable specks, gold where tagged. The right half of the screen is a 24-hour strip chart with the night shaded. A 5 cm scale bar sits by the pot; a leaf inset rescales to 20 µm. Panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Shoot chamber | Structure | Sealed borosilicate box 300 × 300 × 400 mm (36 L) with a silicone-gasketed lid, four feedthroughs and a lid fan; the glass fogs slightly at night when the leaves stop transpiring | No |
| 2 | Root chamber | Structure | Lower box 300 × 300 × 200 mm (18 L) sealed around the stem with a split rubber collar; holds the pot and soil; merges with the shoot chamber when the split is off | Yes: swap |
| 3 | Valley oak seedling | Actor | 250 mm seedling with five lobed matte-green leaves on petioles, a woody stem, shrivelling acorn cotyledons at the base, a 200 mm tap root with fine laterals; leaves tilt toward the lamp by day; grows measurably along the run; three age variants | Yes: swap |
| 4 | Leaf inset | Overlay | 20 µm-scale inset of a mesophyll cell with stomata opening by day, chloroplasts whose starch grains grow by day and shrink by night, and mitochondria drawn active at every hour | No |
| 5 | Root cell inset | Overlay | Inset of a root cortex cell with no chloroplasts, many mitochondria, sucrose arriving from the phloem and ATP tokens made continuously | No |
| 6 | Phloem sugar stream | Particle | Sucrose beads travelling down the stem from leaves to roots at a scaled 0.5 mm/s, drawn gold when they carry a tagged carbon | No |
| 7 | Chamber gas molecules | Particle | Countable CO₂ rods (red, charcoal, red) and O₂ red dimers on a Brownian walk; tagged CO₂ drawn gold; the total count scales with the sensor reading | No |
| 8 | Tagged CO₂ syringe | Instrument | 60 mL gas syringe on the lid pre-filled with gold-tagged CO₂; pushing the plunger injects the pulse at the set clock time | Yes: drag |
| 9 | Infrared CO₂ sensors | Instrument | One per chamber, 0–5,000 ppm, ±20 ppm, 20 s response, lid-mounted with a small LED display | No |
| 10 | Tagged-fraction sensor | Instrument | Laser cell that reads the percentage of chamber CO₂ carrying the tag, ±0.5 %; can be moved between the two chambers | Yes: drag |
| 11 | LED grow bar and clock | Environment | 500 mm bar dimmable 0–2,000 µmol/m²/s following the 24-hour clock's programme; a quantum sensor reads delivered light | No |
| 12 | Thermistor and Peltier plate | Instrument | Holds each chamber at the set day and night temperature so heat cannot be confused with light | No |
| 13 | Balance under the pot | Instrument | 0.01 g platform balance reporting the plant's dry-mass gain computed from net carbon | No |
| 14 | Plant energy gauge | Overlay | Three ATP dials (leaf, stem, root) driven only by respiration, and a growth-and-transport bar that stalls when any dial reaches zero | No |
| 15 | Respiration lever | UI-Probe | A red lever labelled "Pause respiration (impossible in a real plant)"; when pulled, every mitochondrion dims and the ATP dials fall | Yes: drag |
| 16 | 24-hour strip chart | Overlay | Right-hand chart of CO₂ per chamber, tagged fraction, light level and the ATP dials against clock time, with the night band shaded | No |

**How it works — the model.**
Each chamber is a well-mixed gas volume where net CO₂ change equals respiration minus photosynthesis. Photosynthesis runs in leaves only, P = P_max × I/(I + 250) times a CO₂ term; respiration runs in every living cell at every hour, roots included, R = R₂₀ × 2^((T−20)/10) × tissue mass. Sugar made in the leaves is split by a fixed rule: 40 % respired in the leaf, 30 % sent down the phloem to stem and roots, 30 % stored as starch and drawn down at night. The tagged pulse is tracked as a labelled fraction through every pool, so the sim can report what share of tonight's exhaled CO₂ was fixed today and when tagged carbon first reaches the roots, after a phloem delay of a few hours. Growth and transport cost ATP, which only respiration supplies. The virtual respiration lever is honest because it is labelled impossible: it exists to show what would fail. The failure to avoid is one arrow that flips at dusk; both arrows exist at every hour.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Day length | Slider | 0–24 | 14 | h | Hours the LED bar is on in each 24-hour cycle |
| Peak light | Slider | 0–2,000 | 900 | µmol/m²/s PAR | Midday photon level at the leaves |
| Day temperature | Slider | 5–35 | 25 | °C | Respiration rate while the lamp is on, through Q₁₀ = 2 |
| Night temperature | Slider | 5–35 | 15 | °C | Respiration rate while the lamp is off |
| Tagged CO₂ pulse time | Timeline scrubber | 00:00–24:00 | 06:00 | h | Clock time at which the syringe fires |
| Pulse size | Slider | 0–400 | 200 | ppm added | Amount of tagged CO₂ injected into the shoot chamber |
| Chamber layout | Radio | Single sealed / Shoot and root split | Single sealed | — | Whether the roots have their own gas volume and sensor |
| Seedling stage | Dropdown | Acorn just sprouted (no leaves) / 4-week seedling / 12-week seedling | 4-week seedling | — | Leaf area and root mass, and whether photosynthesis is possible at all |
| Respiration lever | Toggle | Running / Paused (virtual) | Running | — | Thought experiment that pauses every mitochondrion |
| Time compression | Dial | 60×–3,600× | 600× | — | Simulated seconds per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One full day | Day length=14; Peak light=900; Chamber layout=Single sealed; Respiration lever=Running | CO₂ falls from 08:00 and rises after 20:00. Does the night rise mean photosynthesis has reversed, or that something else was running all along? |
| S2 | Tag at dawn, sniff at midnight | Tagged CO₂ pulse time=06:00; Pulse size=200; Chamber layout=Single sealed | The gold CO₂ disappears by noon. At midnight the sensor finds gold CO₂ again. Where did it spend the afternoon, and what does its return prove? |
| S3 | Roots never see the sun | Chamber layout=Shoot and root split; Tagged CO₂ pulse time=06:00; Pulse size=200 | The root chamber's CO₂ climbs all day and all night. When does tagged carbon first appear down there, and how did it get there? |
| S4 | The impossible plant | Respiration lever=Paused (virtual); Day length=14; Peak light=900 | Photosynthesis still runs and sugar piles up, yet the ATP dials fall to zero. What stops first, and why can a plant not live on photosynthesis alone? |

**Student activities.**
1. Run S1 for one 24-hour cycle at 600× and record shoot-chamber CO₂ at 06:00, 12:00, 18:00 and 00:00; mark the two clock times when the trace changes direction.
2. Set the pulse to 06:00, push the syringe plunger, and record the tagged fraction at 08:00, 12:00, 18:00 and 00:00; note the earliest night hour at which it rises again.
3. Switch to the split layout, re-run with the same pulse, and record the hour at which the root chamber's tagged fraction first exceeds zero, plus root-chamber CO₂ at noon and at midnight.
4. Pull the respiration lever at 08:00 and record the leaf, stem and root ATP dials every two simulated hours until the growth bar stops; write down what failed first.
5. Swap Seedling stage to Acorn just sprouted, run 24 hours, and record the CO₂ trace and the balance reading; state what the seedling is respiring when it has no leaves at all.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Shoot chamber CO₂ | Line graph | ppm vs h | 24-hour trace with the night band; falls by day and rises by night |
| Root chamber CO₂ | Line graph | ppm vs h | Rises at every hour; drawn only in the split layout |
| Tagged CO₂ fraction | Line graph | % vs h | Gold trace that drops after the pulse and returns at night; read per chamber |
| Tagged carbon location | Bar chart | % | Share of the pulse now in air, leaf sugar, starch, phloem, roots, or respired back out |
| Net daily carbon balance | Live numeric | mg C per day | Photosynthesis gain minus 24-hour respiration; matches the balance reading |
| ATP dials | Live numeric | % of demand | Leaf, stem and root, driven only by respiration |
| Run log | Data table | mixed | Exportable CSV, one row per simulated 10 min |

**What the student should realise.**
Students believe photosynthesis is what plants do and respiration is what animals do, or that a plant respires only at night. The sealed seedling fixes tagged carbon by day and breathes part of it back out that same night, its roots release CO₂ at every hour, and the virtual lever shows that a plant without respiration cannot grow or feed its roots. The student should be able to say: *"Photosynthesis makes the plant's food; respiration is how every cell in the plant, day and night, uses it."*

---

*GradeNext Smart Lab · Grade 7 Unit C · 25 experiment specifications · standard v1.0*