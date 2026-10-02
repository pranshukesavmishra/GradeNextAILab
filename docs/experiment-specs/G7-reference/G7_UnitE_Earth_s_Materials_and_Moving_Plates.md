# GradeNext Smart Lab · Simulation Experiment Book
## Grade 7 · Unit E · Earth's Materials and Moving Plates

**California Integrated Science, Grade 7** · Domain: Earth Science · 6 topics · 30 experiments
**NGSS performance expectations anchored:** MS-ESS2-1, MS-ESS2-2, MS-ESS2-3, MS-ESS3-1
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
| E1.1 | Igneous rock | Crystal Clock: The Magma Cooling Rig | Hybrid 2D+3D | Procedural geology + Fluid/thermal | Investigate | 18–25 min |
| E1.2 | Sedimentary rock | Basin Builder: Layers Under Pressure | 2.5D Layered | Particle system + Procedural geology | Design | 18–25 min |
| E1.3 | Metamorphic rock | The Deep Press: Squeezing Rock Without Melting It | 3D Scene | Procedural geology + Field/vector | Investigate | 18–25 min |
| E1.4 | Identifying a sample from evidence | The Unknown Drawer: Reading Four California Rocks | 3D Scene | State machine + Data-driven model | Argue-from-data | 18–25 min |
| E1.5 | The energy that drives the cycle | Two Engines: Tracing the Power Behind the Rocks | Hybrid 2D+3D | Agent-based + Data-driven model | Argue-from-data | 18–25 min |
| E2.1 | Physical weathering | Break It Without Changing It: The Four-Rig Bench | 3D Scene | Rigid-body + Fluid/thermal | Investigate | 18–25 min |
| E2.2 | Chemical weathering | The Slow Dissolve: Acid, Air and Rusting Rock | Hybrid 2D+3D | Molecular + Data-driven model | Investigate | 18–25 min |
| E2.3 | Agents of erosion | Four Carriers: Water, Wind, Ice and Gravity | 3D Scene | Fluid/thermal + Particle system | Investigate | 18–25 min |
| E2.4 | Where sediment ends up | The Sorting Flume: Where Each Grain Stops | 2.5D Layered | Fluid/thermal + Particle system | Investigate | 18–25 min |
| E2.5 | Soil formation | Growing a Soil: From Bare Rock to Four Horizons | 2.5D Layered | Data-driven model + Agent-based | Design | 18–25 min |
| E3.1 | Fast processes | Sixty Seconds That Move a Mountain | Hybrid 2D+3D | Procedural geology + Rigid-body | Investigate | 18–25 min |
| E3.2 | Slow processes | The Million-Year Dial | 3D Scene | Procedural geology | Investigate | 18–25 min |
| E3.3 | Constructing an explanation from rock layers | Read the Wall, Write the History | Hybrid 2D+3D | State machine + Data-driven model | Argue-from-data | 18–25 min |
| E3.4 | Combining fast and slow in one explanation | Grand Canyon: Two Clocks, One Gorge | 3D Scene | Procedural geology + Particle system | Investigate | 18–25 min |
| E3.5 | Spatial scale, from outcrop to continent | One Rock, Eight Zooms | 2.5D Layered | Data-driven model + Procedural geology | Investigate | 12–18 min |
| E4.1 | Matching coastlines and rock types | The Pangaea Jigsaw Bench | Hybrid 2D+3D | Data-driven model + Rigid-body | Investigate | 18–25 min |
| E4.2 | Matching fossil distributions | Three Fossils That Cannot Swim | 2D Canvas | Data-driven model | Argue-from-data | 12–18 min |
| E4.3 | Seafloor age and magnetic striping | Towing the Magnetometer Across the Ridge | Hybrid 2D+3D | Field/vector + Data-driven model | Investigate | 18–25 min |
| E4.4 | Analyzing plate motion data | Millimetres a Year, Kilometres a Million | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| E4.5 | Reconstructing a simplified history | Rewind the Planet: 200 Million Years Back | Hybrid 2D+3D | Data-driven model + Procedural geology | Design | 18–25 min |
| E5.1 | Divergent boundaries | Rift to Ridge: Where New Crust Is Born | 2.5D Layered | Procedural geology + Fluid/thermal | Investigate | 18–25 min |
| E5.2 | Convergent boundaries | Head-On: Three Ways Plates Collide | 2.5D Layered | Procedural geology + Fluid/thermal | Investigate | 18–25 min |
| E5.3 | Transform boundaries | Stick, Slip and Creep on the San Andreas | Hybrid 2D+3D | Field/vector + State machine | Investigate | 18–25 min |
| E5.4 | Why hazards cluster at boundaries | Fifty Thousand Dots Draw the Plates | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| E5.5 | Reading a plate-boundary map | Teeth, Arrows and Double Lines | 2D Canvas | Field/vector + Data-driven model | Investigate | 12–18 min |
| E6.1 | Mineral resources | Ore Forge: Where Metals Gather | 2.5D Layered | Procedural geology + Fluid/thermal | Investigate | 18–25 min |
| E6.2 | Energy resources | Basin Kitchen: Cooking Oil, Gas and Coal | 2.5D Layered | Procedural geology + Fluid/thermal | Investigate | 18–25 min |
| E6.3 | Groundwater as a resource | The Sinking Valley: Pumping the Aquifer | Hybrid 2D+3D | Fluid/thermal + Data-driven model | Investigate | 18–25 min |
| E6.4 | Renewable versus nonrenewable resources | The Rate Room: Faster In or Faster Out? | 2D Canvas | Data-driven model | Design | 12–18 min |
| E6.5 | Constructing an explanation for resource distribution | Why Here? The Resource Detective's Board | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |

---

## E1 · The rock cycle · MS-ESS2-1

### E1.1 · Igneous rock

**Experiment name:** Crystal Clock: The Magma Cooling Rig  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Procedural geology + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-1

**Theme & scene.**
A vertical cutaway of Sierra Nevada crust, 8 km tall and 3 km wide, seen side-on with 1× vertical exaggeration. At the bottom a lens-shaped magma chamber glows sodium-orange and churns slowly; above it a narrow conduit climbs through banded grey country rock to a low volcanic cone at the surface, where a black lava apron cools under a cold blue dawn sky. Heat bleeds from the chamber as a soft red halo into the surrounding rock. A depth ruler runs up the left edge in kilometres. Along the bottom sits a lit inspection bench holding three sample discs and a brass hand lens the student drags over any disc to magnify it. The control panel is docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Crust cutaway block | Environment | 3000×8000 m slab, six banded grey-brown strata with visible bedding lines, cold end #4A4640; conducts heat away from the chamber | No |
| 2 | Magma chamber | Actor | Lens-shaped body 1200 m wide, volume slider-driven; emissive gradient 1200 °C white-orange core to 700 °C dull red rim; slow convective swirl at 0.05 Hz | Yes: resize, drag |
| 3 | Feeder conduit / dyke | Structure | Vertical pipe 40 m wide from chamber roof to vent; fills with melt only when Erupt is triggered | Yes: place |
| 4 | Vent and cone | Structure | 300 m cinder cone, dark scoria texture, ring of steam sprites | No |
| 5 | Lava flow apron | Actor | Surface sheet that spreads 0–1500 m; skins over from orange to matte black in seconds of sim time | No |
| 6 | Melt matrix | Field | Continuous molten phase, refractive amber; fraction falls from 1.0 to 0 as crystals grow | No |
| 7 | Crystal — plagioclase lath | Particle | Rectangular blade, milky white, aspect 4:1, length driven by growth model; instanced up to 6000 per sample | No |
| 8 | Crystal — quartz | Particle | Rounded grey-glassy blob filling gaps between laths, last to solidify | No |
| 9 | Crystal — olivine / pyroxene | Particle | Stubby olive-green and black prisms; appear first, only in basaltic composition | No |
| 10 | Nucleation seed emitter | Field | Invisible point source; seeds per m³ rise sharply as cooling rate rises, setting how many crystals compete | No |
| 11 | Volatile bubbles (vesicles) | Particle | Spherical voids 0.5–8 mm, trapped only in fast-cooled samples; produce holey scoria texture | No |
| 12 | Quench glass shell | Structure | Non-crystalline black rind 1–20 mm thick on any surface touching air or water | No |
| 13 | Sample discs (×3) | Instrument | 60 mm polished pucks on the bench; each captures the texture from the depth it was cut at | Yes: place, swap |
| 14 | Hand lens | UI-Probe | Brass loupe, 10× circular magnifier with a 1 mm graticule scale etched across it; hovers any disc | Yes: drag |
| 15 | Thermocouple probe | Instrument | Slim needle the student stabs into the chamber, conduit or flow; reports live °C at that point | Yes: drag, place |
| 16 | Cooling-curve panel | Overlay | Dark 2D chart plotting temperature against compressed time for every probe placed | No |

**How it works — the model.**
Each tick the engine solves one-dimensional conductive cooling: the rate of heat loss rises as the temperature difference between melt and surrounding rock rises, so a body emplaced at 8 km inside 400 °C rock cools thousands of times more slowly than the same melt poured onto 10 °C air. Cooling rate then splits into two competing processes. Nucleation rate rises steeply with cooling rate; crystal growth rate depends on how long the melt sits between its liquidus and solidus. Mean crystal diameter is computed as d = k·√(time in the crystallisation window), with the number of seeds dividing the available melt. Fast cooling therefore gives many tiny crystals or no crystals at all (glass); slow cooling gives few large ones. The simplification is that composition only shifts the melting window and the mineral list, not the full phase diagram. The failure to avoid: crystals must grow outward from seeds and jam against each other into an interlocking mosaic, never appear pre-formed and drop into place like gravel, because that is the sedimentary picture.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Emplacement depth | Slider | 0–8 | 6 | km | Where the chamber sits; sets surrounding rock temperature and insulation |
| Country-rock temperature | Slider | 5–500 | 300 | °C | Temperature difference driving heat loss |
| Magma composition | Dropdown | Basaltic / Andesitic / Granitic | Granitic | — | Mineral list, colour, melting window, viscosity |
| Chamber volume | Slider | 0.01–20 | 4 | km³ | Thermal mass; big bodies hold heat far longer |
| Dissolved water and gas | Slider | 0–5 | 1.5 | wt % | Bubble count and vesicle texture |
| Erupt to surface | Toggle | Hold / Erupt | Hold | — | Structural: opens the conduit and moves melt to the surface mid-run |
| Surface quench medium | Dropdown | Air / Seawater / Snowpack | Air | — | How violently a surface flow is chilled |
| Time compression | Dial | 1×–100000× | 10000× | — | Sim seconds per real second |
| Hand lens power | Stepper | 2×–20× | 10× | — | Magnification and graticule scale on the loupe |
| Cut sample at | Drag-handle | Any point in chamber, conduit or flow | Chamber centre | — | Structural: chooses where the next sample disc is taken from |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Deep and patient (Sierra batholith) | depth=8; composition=Granitic; volume=20; erupt=Hold | After full solidification, measure three crystals under the lens. Why can you see them without the lens at all? |
| S2 | Poured onto the Mojave | depth=0.2; composition=Basaltic; erupt=Erupt; quench=Air | The same melt makes crystals too small to measure. What single quantity changed? |
| S3 | Two-stage magma (porphyry) | depth=6; volume=4; hold 60 % of run then erupt=Erupt | The rock ends with big white laths floating in a fine dark paste. When did each size form? |
| S4 | Pillow lava quench | depth=0; composition=Basaltic; quench=Seawater; water=4 | Why does this sample contain no measurable crystals at all, and what is the black rind made of? |

**Student activities.**
1. Set depth to 8 km and run to full solidification. Drag the hand lens over the sample disc and record the mean crystal length in millimetres against the graticule.
2. Set depth to 0.2 km, erupt, and cut a second disc from the lava flow. Measure again and record both numbers side by side in the data table.
3. Place the thermocouple probe in the chamber and again in the surface flow. Record how long each takes to fall below 700 °C.
4. Predict, before running, what a magma that sits deep for a while and then erupts will look like under the lens. Run S3 and check your prediction against the disc.
5. Compare the two basaltic discs from S2 and S4 and write one sentence explaining why seawater produced glass where air produced tiny crystals.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mean crystal diameter | Live numeric | mm | Updated as growth proceeds, to 2 dp |
| Crystal size distribution | Bar chart | count vs mm | Histogram of every crystal in the current sample disc |
| Cooling curve | Line graph | °C vs s | One trace per placed thermocouple, shared time axis |
| Time to solidus | Timer | s (sim time, compressed) | Time from emplacement until melt fraction hits zero |
| Texture classification | Pass-fail badge | — | Reports Glassy / Fine-grained / Coarse-grained / Porphyritic from the measured grain data |
| Rock name | Live numeric | — | Names the product (granite, basalt, obsidian, andesite porphyry) from composition plus texture |
| Vesicle fraction | Live numeric | % by volume | Void space trapped in the sample |
| Run log | Data table | mixed | Depth, cooling rate, mean grain size and rock name per run; exportable CSV |

**What the student should realise.**
Students believe grain size tells you how old a rock is, or how hot the magma was. This rig makes that untenable: identical melt at identical starting temperature produces Half Dome granite at 8 km and Mojave basalt at the surface, and the only variable that changed was how fast heat could escape. The student should be able to say: *"Big crystals mean slow cooling deep underground, and tiny crystals or glass mean fast cooling at the surface."*

### E1.2 · Sedimentary rock

**Experiment name:** Basin Builder: Layers Under Pressure  
**Render mode:** 2.5D Layered  
**Simulation engine:** Particle system + Procedural geology  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-1

**Theme & scene.**
A tall, narrow cross-section through a coastal basin, framed like an aquarium wall: still green-grey water in the upper two thirds, a widening wedge of accumulated sediment below, bedrock floor at the base. Sediment rains down continuously from the left, where a river mouth spills a brown plume that fans and settles. Each completed layer draws as a distinct band with its own colour and grain texture, separated by hairline bedding planes. Vertical exaggeration is 5×, stated on the frame. A depth-and-age ruler runs up the right edge in metres and thousands of years. Bottom-left holds a core-barrel tray; the control panel is docked right, with a burial-depth scrubber beneath the scene.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Basin water column | Environment | 600×900 px translucent green-grey volume, faint suspended haze, gentle current vectors | No |
| 2 | Bedrock floor | Structure | Dark granodiorite base with an irregular top surface; basin can be tilted | Yes: resize |
| 3 | River-mouth sediment source | Actor | Emitter at upper left; brown plume sprite; discharge rate slider-driven | Yes: drag, place |
| 4 | Gravel particles | Particle | 6–20 px angular polygons, tan-grey; settle fastest, drop nearest the source | No |
| 5 | Sand particles | Particle | 2–5 px rounded grains, pale gold, slight sparkle for quartz | No |
| 6 | Silt particles | Particle | 1 px dots, olive-brown, drift far before settling | No |
| 7 | Clay / mud particles | Particle | Sub-pixel haze rendered as a translucent wash, settles only in still water | No |
| 8 | Shell and leaf fragments | Particle | Small white ribbed discs and dark leaf slivers; become the fossil objects | Yes: place |
| 9 | Deposited layer band | Structure | Procedurally generated stratum; thickness, grain mix, colour and texture recorded per band; up to 24 bands | Yes: swap |
| 10 | Pore-space overlay | Overlay | False-colour blue wash showing void fraction between grains; shrinks visibly during compaction | No |
| 11 | Cement precipitate | Structure | Thin calcite or silica rim drawn growing around each grain contact once mineral-rich water is switched on | No |
| 12 | Overburden load bar | Instrument | Vertical pressure gauge on the right wall, reading MPa at the selected layer | No |
| 13 | Core barrel | Instrument | 50 mm cylindrical corer the student drops anywhere; extracts a labelled vertical column to the tray | Yes: drag, place |
| 14 | Core tray | UI-Probe | Bottom-left rack that displays the extracted core with a grain-size scale beside each band | Yes: drag |
| 15 | Burial timeline scrubber | UI-Probe | Horizontal scrubber that advances burial from 0 to 2 km with layers thinning and hardening as it moves | Yes: drag |

**How it works — the model.**
Sediment settles by size. Each particle carries a settling speed that rises with grain diameter, so gravel lands near the source, sand next, silt beyond, and clay only where current speed falls below its threshold. That single rule produces sorting along the basin floor and, when current speed is changed between pulses, produces stacked layers of different grain size. Once a layer is buried, overburden pressure rises roughly one megapascal for every 40 m of overlying sediment; pore space shrinks along a compaction curve, layer thickness falls, and grains rotate into tighter packing. Cementation is separate and must not be conflated with squeezing: if mineral-rich pore water is on, dissolved calcite or silica precipitates at grain contacts and locks the grains together. Compaction alone gives a dense but crumbly layer; only cement makes rock. Deeper layers are always older, and the sim must never reorder them.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sediment supply rate | Slider | 0–500 | 120 | kg/s | Particles emitted from the river mouth per second |
| Grain mix | Multi-select | Gravel / Sand / Silt / Clay | Sand + Silt | — | Structural: which particle classes the source releases |
| Current speed | Slider | 0.0–1.5 | 0.4 | m/s | How far each grain size travels before settling |
| Basin floor tilt | Slider | 0–12 | 3 | degrees | Redirects where coarse material piles up |
| Depositional event | Stepper | 1–8 pulses | 3 | count | Structural: number of separate flood pulses, each making its own layer |
| Burial depth | Timeline scrubber | 0–2000 | 0 | m | Overburden pressure, compaction and layer thinning |
| Pore-water minerals | Dropdown | None / Calcite / Silica / Iron oxide | Calcite | — | Cement type, cement colour and final hardness |
| Organic input | Toggle | On / Off | On | — | Whether shells and leaves are buried to become fossils |
| Time compression | Dial | 100×–100000× | 10000× | — | Sim years per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Quiet lagoon | current=0.1; mix=Silt+Clay; pulses=1; burial=800 | What grain size dominates in still water, and what rock does the core barrel name? |
| S2 | Flood, then calm (Central Valley) | pulses=4; current alternating 1.2 and 0.2; mix=Gravel+Sand+Silt+Clay | Explain why the core shows coarse bands alternating with fine ones. |
| S3 | Squeezed but not glued | burial=2000; minerals=None | The layer is dense and thin but falls apart in the core barrel. What is missing? |
| S4 | Monterey shale recipe | mix=Clay+Silt; current=0.05; organics=On; burial=1500; minerals=Silica | Why do the fossils in this core lie flat and undamaged rather than being smashed? |

**Student activities.**
1. Set the grain mix to all four classes and run one pulse. Measure and record the horizontal distance from the source at which each grain size stops.
2. Run four pulses, alternating current speed between 1.2 and 0.2 m/s. Drop the core barrel and sketch the banding you extract.
3. Drag the burial scrubber from 0 to 2000 m and record layer thickness and pore-space percentage at 0, 500, 1000 and 2000 m.
4. Set pore-water minerals to None, bury fully, and test the core hardness. Then switch to Calcite and repeat. Record both hardness readings.
5. Place three shell fragments in the second layer, bury the basin, and record which layer they sit in and their measured age.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Layer thickness log | Data table | mm | One row per stratum: grain mix, thickness before and after burial, age |
| Pore space | Live numeric | % | Void fraction in the selected layer, falls during compaction |
| Overburden pressure | Live numeric | MPa | Pressure at the selected layer depth |
| Grain-size profile | Bar chart | % vs class | Composition of the selected layer by gravel/sand/silt/clay |
| Sorting distance curve | Line graph | m vs settling speed | Where each grain class came to rest along the basin floor |
| Rock name | Pass-fail badge | — | Conglomerate / Sandstone / Siltstone / Shale / Limestone from the measured mix |
| Core hardness test | Pass-fail badge | — | Green when cement is sufficient to hold the core intact |
| Fossil inventory | Counter | count | Shells and leaves preserved, listed by host layer |

**What the student should realise.**
Students believe sedimentary rock forms because loose sediment is simply pressed hard enough. The None-cement run makes that untenable: a layer buried under two kilometres is dense and thin, yet still crumbles in the corer, because pressure closes gaps while dissolved minerals do the gluing. The student should be able to say: *"Sediment settles biggest-first, gets squeezed as more piles on top, and only turns into rock when minerals cement the grains together."*

### E1.3 · Metamorphic rock

**Experiment name:** The Deep Press: Squeezing Rock Without Melting It  
**Render mode:** 3D Scene  
**Simulation engine:** Procedural geology + Field/vector  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-1

**Theme & scene.**
A heavy industrial press stands in a dim laboratory bay, lit from above by a single hard lamp so the steel platens throw long shadows. Between the platens sits a 100 mm cube of rock on a ceramic plate, its cut face turned toward the camera. Two hydraulic rams push in from the sides; a ring furnace glows a dull cherry red around the sample chamber. Behind the press, a wall-mounted schematic shows where in the crust the current pressure and temperature would put you, with the San Andreas and the Sierra roots marked. Arrows on the sample face show the squeeze direction. The near-field is the sample cube; the press body is mid-ground; the control panel is docked right with a large red Run cycle button.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Press frame and platens | Environment | Steel A-frame 2.4 m tall, two 300 mm hardened platens, oiled dark-grey finish, visible bolt heads | No |
| 2 | Hydraulic rams (×2) | Actor | Chromed pistons entering from left and right; stroke length tracks applied pressure; faint hiss and shudder | No |
| 3 | Ring furnace | Actor | Toroidal heating element around the chamber; colour ramps black to cherry red to orange with temperature | No |
| 4 | Parent rock cube | Actor | 100 mm cube; texture swapped by the starting-rock dropdown; front face polished for viewing | Yes: swap, resize |
| 5 | Mineral grain — clay platelet | Particle | Flat hexagonal flake, dull grey-brown, 0.05 mm; randomly oriented at start | No |
| 6 | Mineral grain — mica flake | Particle | Reflective silvery plate, 0.5–3 mm; grows from clay and rotates perpendicular to the squeeze | No |
| 7 | Mineral grain — calcite | Particle | Rhombic translucent crystal; in marble it coarsens without aligning | No |
| 8 | Mineral grain — quartz / feldspar | Particle | Rounded pale grains that flatten into lenses under directed pressure | No |
| 9 | Stress vector field | Field | Invisible directed-stress tensor; visualised as opposed arrow pairs on the sample face | No |
| 10 | Foliation planes | Overlay | Emergent dark banding drawn once mineral alignment passes threshold; spacing tightens with pressure | No |
| 11 | Melt-warning halo | Overlay | Amber rim that appears if temperature crosses the melting line, ending the run as igneous | No |
| 12 | Fluid injection port | Structure | Small nozzle on the chamber wall; releases hot water that speeds recrystallisation | Yes: place |
| 13 | Hand lens viewport | UI-Probe | 10× circular window over the sample face showing individual grains and their orientation | Yes: drag |
| 14 | Crustal depth schematic | Overlay | Side wall diagram with a moving dot showing where this P and T occurs in real crust | No |
| 15 | Grain-orientation rose plot | Instrument | Circular histogram of grain long-axis directions; a random ring means unfoliated, a two-lobed shape means foliated | No |
| 16 | Sample archive rack | Instrument | Rack of six slots holding the finished cube from each run for side-by-side comparison | Yes: place, drag |

**How it works — the model.**
The engine tracks two independent inputs: confining plus directed pressure, and temperature. Temperature drives recrystallisation, so grain diameter grows on a rate curve that steepens above about 300 °C and accelerates again if hot fluid is injected. Directed pressure drives alignment: each platy grain rotates toward the plane perpendicular to the maximum squeeze direction, at a rate proportional to pressure and to how platy the mineral is. Foliation is therefore an emergent readout of alignment, not a texture pasted on. Because calcite is not platy, marble coarsens but never foliates, which is the case that breaks the rule students over-generalise. A hard ceiling sits at the melting line: cross it and the run terminates with the melt halo and the label "you made magma, not metamorphic rock". Nothing is added or removed from the cube, so the mineral inventory panel must balance before and after.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Directed pressure | Dial | 0–1200 | 400 | MPa | Ram stroke, grain rotation rate, foliation spacing |
| Temperature | Dial | 20–900 | 450 | °C | Furnace colour and recrystallisation (grain growth) rate |
| Starting rock | Dropdown | Shale / Limestone / Granite / Sandstone / Basalt | Shale | — | Structural: the mineral inventory the cube starts with |
| Squeeze direction | Radio | Horizontal / Vertical / All-round (confining only) | Horizontal | — | Structural: whether stress is directed or equal on all sides |
| Hold time | Slider | 0.1–50 | 5 | million years | How long the sample sits at the set conditions |
| Hot fluid injection | Toggle | On / Off | Off | — | Speeds recrystallisation and mineral growth |
| Time compression | Dial | 1000×–1000000× | 100000× | — | Million years per real second |
| Foliation overlay | Toggle | On / Off | On | — | Draws the emergent banding planes |
| Cut and archive sample | Stepper | Slots 1–6 | Slot 1 | — | Structural: stores the finished cube in the comparison rack |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Shale to slate to schist | rock=Shale; pressure=200 then 900; temp=300 then 600; direction=Horizontal | At what pressure do the mica flakes first line up, and what does the rock split into? |
| S2 | Marble without stripes | rock=Limestone; pressure=800; temp=550; direction=Horizontal | Grains got much bigger but no bands appeared. Why does this mineral refuse to line up? |
| S3 | Squeezed evenly | rock=Shale; direction=All-round; pressure=900; temp=600 | Same pressure, same heat, no foliation. What does foliation actually record? |
| S4 | One step too far | rock=Granite; temp=880; pressure=600 | The run ends with a melt warning. Explain why the product is no longer metamorphic. |

**Student activities.**
1. Set shale at 200 MPa and 300 °C, run, and record grain size and the rose-plot shape. Archive to slot 1.
2. Raise to 900 MPa and 600 °C, run again, archive to slot 2, and record how foliation spacing changed.
3. Swap the starting rock to limestone at the same settings. Measure grain size and record whether foliation appeared.
4. Switch squeeze direction to All-round and re-run the shale. Compare the rose plot with your slot 2 result and state what changed.
5. Push the temperature to 880 °C and record the exact temperature at which the melt warning triggers.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Mean grain diameter | Live numeric | mm | Recrystallisation progress, updated each tick |
| Grain-orientation rose | Heat map | % per 10° sector | Circular histogram; two strong lobes indicate foliation |
| Foliation index | Live numeric | 0–1 | Fraction of platy grains aligned within 15° of the foliation plane |
| Pressure–temperature path | Line graph | MPa vs °C | The run's path plotted on a crustal field diagram with the melting line drawn |
| Mineral inventory | Data table | count | Each mineral before and after; totals must balance |
| Rock name | Pass-fail badge | — | Slate / Phyllite / Schist / Gneiss / Marble / Quartzite / Melted |
| Archive comparison | Data table | mixed | Side-by-side rows for all six archived cubes |

**What the student should realise.**
Students believe metamorphic rock is rock that partly melted. Every successful run here stays solid, and the one run that crosses the melting line is labelled as a failure that produced magma instead. Heat grows grains; directed pressure lines them up; equal pressure on all sides lines up nothing. The student should be able to say: *"Metamorphic rock is old rock rebuilt in the solid state by heat and squeezing, and the stripes only appear when the squeeze comes from one direction."*

### E1.4 · Identifying a sample from evidence

**Experiment name:** The Unknown Drawer: Reading Four California Rocks  
**Render mode:** 3D Scene  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-1

**Theme & scene.**
A field geologist's identification bench under a bright work lamp, shot from just above eye level. A wooden specimen drawer on the left holds four unlabelled hand samples on foam, each about 80 mm across, tagged only A, B, C and D. Centre bench holds the test kit: a steel hardness pick, a copper coin, a glass plate, a brass loupe on a hinged arm, a dropper bottle of dilute acid with a virtual-hazard ring around it, and a rinse tray. A magnetic streak plate lies to the right. Pinned behind the bench is a California map with pins on the Sierra Nevada, Mojave, Monterey coast and Inyo Mountains. The evidence log and identification key are docked right; the acid bottle glows faintly when armed.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Specimen drawer | Environment | Shallow oak tray with four cut-foam wells, brass label plates reading A–D | No |
| 2 | Sample — Sierra granite | Actor | 80 mm block, speckled pink-white-black, interlocking 2–5 mm crystals, no layering; hardness 6.5 | Yes: drag, swap |
| 3 | Sample — Mojave basalt | Actor | 80 mm dark grey-black block, grains below 0.1 mm, scattered vesicles; hardness 6 | Yes: drag, swap |
| 4 | Sample — Monterey shale | Actor | 80 mm olive-brown block with 1 mm parallel bedding laminae, splits into flat sheets; hardness 3 | Yes: drag, swap |
| 5 | Sample — Inyo marble | Actor | 80 mm white-and-grey swirled block, interlocking 1–3 mm sugary calcite grains; hardness 3, fizzes | Yes: drag, swap |
| 6 | Hardness pick set | Instrument | Steel point (6.5), copper coin (3.5), fingernail (2.5), glass plate (5.5); each leaves a visible scratch or fails to | Yes: drag |
| 7 | Scratch mark decal | Overlay | Persistent white groove drawn on the sample face wherever a harder tool wins | No |
| 8 | Grain-size loupe | UI-Probe | 10× hinged lens with a 0.1 mm graticule; shows crystal shape and whether grains interlock or are cemented | Yes: drag |
| 9 | Acid dropper bottle | Instrument | 30 mL bottle of dilute acid, clearly labelled "simulated"; dispenses one drop per click | Yes: drag, place |
| 10 | Fizz reaction effect | Overlay | Bubble burst and thin white foam, lasting 3 s, only on calcite-bearing samples; audible faint fizz | No |
| 11 | Rinse tray | Structure | Shallow water tray that clears acid residue so a sample can be retested | Yes: place |
| 12 | Streak plate | Instrument | Unglazed white porcelain tile; records powder colour when a sample is rubbed on it | Yes: drag |
| 13 | Layering probe | UI-Probe | Splitting blade that attempts to cleave the sample along a plane; succeeds only on layered rocks | Yes: drag, place |
| 14 | Evidence log | Instrument | Right-hand panel; each test performed writes one immutable row: sample, test, result | No |
| 15 | Dichotomous key panel | Overlay | Branching key that highlights the live branch as evidence accumulates and greys out excluded rocks | Yes: connect |
| 16 | California origin map | Overlay | Behind-bench map; a correct identification lights that rock's home pin and gives a one-line field note | No |

**How it works — the model.**
Each sample is a data record holding true values for hardness, grain size, grain shape (interlocking or cemented), layering, mineral content and acid reactivity. Instruments are pure functions on that record: the pick returns a scratch if the tool hardness exceeds the sample hardness, the loupe returns measured grain diameter with a small random reading error so students must look carefully, the acid drop returns a fizz only if calcite content exceeds five per cent. Nothing is revealed until a test is run, and every test writes to the evidence log. The dichotomous key is driven entirely by logged evidence, so guessing without testing leaves branches unresolved. The scoring rule is the point: a correct name submitted with fewer than three supporting log rows scores as unsupported, while a wrong name backed by consistent evidence scores partial credit and shows exactly which test would have separated the two candidates.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active sample | Radio | A / B / C / D | A | — | Which specimen is on the test stage |
| Test tool | Dropdown | Fingernail / Copper coin / Glass plate / Steel pick | Steel pick | — | Which hardness tool the cursor carries |
| Loupe magnification | Stepper | 2×–20× | 10× | — | Grain detail and graticule scale |
| Acid drop | Toggle | Armed / Safe | Safe | — | Whether clicking a sample dispenses a drop |
| Attempt to split | Toggle | On / Off | Off | — | Runs the layering probe on the active sample |
| Sample library | Multi-select | Sierra granite / Mojave basalt / Monterey shale / Inyo marble / Sandstone / Obsidian / Gneiss | The four defaults | — | Structural: which rocks are loaded, shuffled into A–D |
| Shuffle drawer | Stepper | Reshuffle 1–20 | 1 | count | Structural: randomises which rock sits in which well |
| Show key | Toggle | On / Off | On | — | Displays the branching identification key |
| Submit identification | Dropdown | Rock names from the loaded library | — | — | Locks in a name for the active sample and scores it |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Four classics | library=default four; shuffle=1; key=On | Identify all four using at most four tests each. Which single test separated the marble from the shale? |
| S2 | The fizz trap | library=Inyo marble + Monterey shale + Sandstone + Sierra granite; acid=Armed | Two samples are both soft and pale. Which test tells them apart, and why is hardness useless here? |
| S3 | Blind reshuffle | shuffle=12; key=Off | Without the key, name each rock and justify every name with at least three logged results. |
| S4 | Look-alikes | library=Mojave basalt + Obsidian + Gneiss + Sierra granite; loupe=20× | Two dark samples look identical at arm's length. What does the loupe show that your eye could not? |

**Student activities.**
1. Run the steel pick on all four samples and record which ones scratch, in a four-row table.
2. Set the loupe to 10× and measure the grain diameter of each sample. Record whether the grains interlock or sit in cement.
3. Arm the acid dropper and test every sample. Record which fizz, then rinse each one.
4. Predict a name for each sample from your log, then submit and record the score and which evidence rows the scorer accepted.
5. Reshuffle the drawer, hide the key, and re-identify all four using only your own logged evidence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Evidence log | Data table | mixed | Immutable row per test: sample, tool, result, timestamp |
| Measured hardness | Live numeric | Mohs band | Bracketed range from which tools scratched and which did not |
| Measured grain size | Live numeric | mm | Loupe reading with visible tolerance |
| Acid reaction | Pass-fail badge | — | Fizz / No fizz per sample |
| Key path | Vector overlay | — | Highlighted branch through the dichotomous key with excluded rocks greyed |
| Identification score | Pass-fail badge | — | Correct-and-supported / Correct-but-unsupported / Incorrect, per sample |
| Evidence sufficiency | Counter | count | Number of log rows that actually constrain the answer given |
| Origin field note | Live numeric | — | One-line California provenance shown when a name is confirmed |

**What the student should realise.**
Students believe rocks are identified by what they look like at a glance, mostly by colour. The look-alike scenario destroys that: basalt and obsidian are both black, marble and shale are both pale and soft, and only a scratch, a loupe reading and an acid drop separate them. Colour is the least reliable property in the drawer. The student should be able to say: *"I name a rock from tested properties I can write down, not from what it reminds me of."*

### E1.5 · The energy that drives the cycle

**Experiment name:** Two Engines: Tracing the Power Behind the Rocks  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
A single continuous cutaway of California from 30 km above the coast down to 200 km into the mantle, drawn at 1:1 horizontally with 2× vertical exaggeration. The upper half is daylight: sun overhead, coastal fog, rain falling on the Sierra front, a river carrying sediment west into a shelf basin. The lower half is hot: a red-shading mantle, a subducting slab, a rising magma plume feeding a volcano. Twenty small glowing rock parcels move continuously around the loop, each trailing a coloured ribbon (gold for solar-powered legs, crimson for internal-heat legs). Two large power gauges hang top-left and bottom-left, one labelled Sun, one labelled Earth's interior. The control panel is docked right; a legend strip runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Crust-to-mantle cutaway | Environment | Layered section: sediment wedge, granitic crust, oceanic slab, asthenosphere; colour ramps from grey to deep red with depth | No |
| 2 | Sun disc and insolation beam | Actor | Top-right disc with a widening beam of pale gold arrows striking land and ocean; brightness tracks the solar slider | Yes: drag |
| 3 | Internal heat source | Actor | Diffuse crimson glow along the base of the section, with rising convection arrows in the mantle | No |
| 4 | Rock parcel agents (×20) | Actor | 12 px faceted pebbles, each carrying a state tag: Igneous / Sediment / Sedimentary / Metamorphic / Melt | Yes: drag, place |
| 5 | Energy ribbon trail | Overlay | Trail behind each parcel, gold where the last step was solar-powered, crimson where it was internal-heat powered | No |
| 6 | Weathering-and-erosion station | Structure | Sierra front cliff face with rain, frost and wind sprites; converts Igneous or Metamorphic parcels to Sediment | Yes: place |
| 7 | River transport channel | Structure | Animated braided channel from range to basin; parcel speed scales with rainfall | Yes: drag |
| 8 | Deposition basin | Structure | Offshore wedge where Sediment parcels settle and stack into visible layers | No |
| 9 | Burial and cementation zone | Structure | Sub-basin band where stacked parcels convert to Sedimentary after a dwell time | No |
| 10 | Subduction and metamorphic zone | Structure | Slab-top band at 20–60 km, orange-shaded, converting parcels to Metamorphic | No |
| 11 | Melting zone and magma chamber | Structure | Deep hot lens where parcels convert to Melt; feeds the volcanic conduit | No |
| 12 | Uplift and exhumation column | Field | Vertical vector field along the range front that returns deep parcels to the surface | No |
| 13 | Solar power gauge | Instrument | Large dial reading incoming solar power in W/m², plus a running total in joules delivered | No |
| 14 | Geothermal power gauge | Instrument | Second dial reading Earth's internal heat flow in mW/m², same running-total display | No |
| 15 | Energy tagger probe | UI-Probe | Click any moving parcel or any arrow to open a card naming that step's energy source and the process | Yes: drag |
| 16 | Cycle census board | Overlay | Bottom strip counting how many parcels currently sit in each of the five states | No |

**How it works — the model.**
Each parcel is an agent in a state machine with five states and eight transitions. Every transition has an energy tag and a rate. Solar-tagged transitions (weathering, erosion, river transport, deposition) run at a rate proportional to the solar power setting, because sunlight drives evaporation, rainfall and wind, and gravity does the falling once the water is lifted. Internal-heat-tagged transitions (subduction, metamorphism, melting, uplift, volcanic eruption) run at a rate proportional to the internal heat setting, because mantle convection moves the plates. Setting either source to zero freezes exactly the transitions with that tag while the others keep running, and the census board then piles parcels up at the stalled boundary. That pile-up is the argument. The honest simplification: gravity is not itself an energy source here, it is the return path for material the Sun already lifted, and the tagger card says so in plain words.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Solar power | Slider | 0–1400 | 340 | W/m² | Rate of weathering, erosion, river transport and deposition |
| Earth's internal heat | Slider | 0–300 | 87 | mW/m² | Rate of subduction, metamorphism, melting and uplift |
| Rainfall | Slider | 0–2500 | 900 | mm/yr | Strength of the weathering and river-transport legs specifically |
| Plate convergence rate | Slider | 0–120 | 45 | mm/yr | How fast parcels are dragged into the subduction zone |
| Parcels in play | Stepper | 5–40 | 20 | count | Structural: number of tracked agents on the loop |
| Highlight energy source | Radio | Both / Solar only / Internal only / Off | Both | — | Structural: dims every pathway not driven by the chosen source |
| Shortcut pathways | Toggle | On / Off | On | — | Structural: enables sediment-to-metamorphic and igneous-to-sediment direct routes |
| Time compression | Dial | 1000×–10000000× | 1000000× | — | Sim years per real second |
| Place a parcel | Drag-handle | Any point in the section | Surface | — | Structural: drops a new parcel at a chosen state and location |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Both engines running | solar=340; internal=87; rainfall=900 | Follow one parcel for a full loop. Write down which legs were gold and which were crimson. |
| S2 | Sun switched off | solar=0; internal=87 | Which parts of the cycle stop, and where do the parcels pile up? |
| S3 | Cold Earth | solar=340; internal=0 | Rocks still break down and pile up in the basin. Why does nothing ever come back up as new igneous rock? |
| S4 | Sierra rain shadow | rainfall=150; solar=500; internal=87; convergence=45 | On the dry side of the range, which leg slows most, and does the deep leg care? |

**Student activities.**
1. Tag one parcel with the probe and follow it for a full loop. Record the energy source of each of its six steps.
2. Set solar power to 0, run 30 s, and record the census-board counts for all five states.
3. Set solar back to 340 and internal heat to 0. Run again and record the census counts a second time.
4. Compare the two censuses and write one sentence naming which processes belong to which engine.
5. Drop three new parcels into the deposition basin and predict, before running, whether they can reach the magma chamber with internal heat at zero. Then test it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Solar power delivered | Live numeric | W/m² and MJ total | Instantaneous and cumulative energy from the Sun |
| Internal heat delivered | Live numeric | mW/m² and MJ total | Instantaneous and cumulative energy from Earth's interior |
| State census | Bar chart | count | Parcels in each of the five rock states, updated each second |
| Transition tally by energy source | Data table | count | Every completed transition, grouped as solar-driven or internal-driven |
| Parcel journey log | Data table | mixed | Per-parcel route: state, process, energy source, sim years elapsed |
| Cycle completion time | Timer | sim years | Time for a tagged parcel to return to its starting state |
| Stalled-pathway flag | Pass-fail badge | — | Names any transition currently at zero rate and the source responsible |

**What the student should realise.**
Students believe the rock cycle is powered by one thing, usually heat, or that gravity is the engine. Killing each source separately makes that untenable: with the Sun off, the surface arm freezes while melting and uplift continue; with internal heat off, sediment piles up forever and never returns. The student should be able to say: *"The Sun runs the surface half of the rock cycle and Earth's internal heat runs the deep half, and the cycle only closes when both are working."*

## E2 · Weathering, erosion and deposition

### E2.1 · Physical weathering

**Experiment name:** Break It Without Changing It: The Four-Rig Bench  
**Render mode:** 3D Scene  
**Simulation engine:** Rigid-body + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
A weathering test bench in a cold-lit lab bay, four rigs standing side by side on a steel worktop, each with its own small placard and its own sample of the same starting rock. Left is a frost chamber: a glass-fronted cabinet holding a granite block with a visible water-filled crack, and a thermometer needle swinging between plus and minus. Next, a planter box where a seedling root presses into a joint in a slab. Third, a slowly rotating clear tumbler drum with angular chips clattering inside. Fourth, a desert plinth with a heat lamp on a day-night arm, casting shifting shadows across a dark boulder. The camera can dolly along the bench; the control panel is docked right, with a shared master clock above.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Steel worktop and bay | Environment | 4 m bench, cold fluorescent key light, faint condensation on the frost cabinet glass | No |
| 2 | Frost chamber cabinet | Structure | 500 mm glass-front box with a chiller coil, internal thermometer, drip feed above the sample | No |
| 3 | Granite block with crack | Actor | 200 mm block, speckled pink-grey; a 2 mm crack runs 60 mm in from one face; crack length is state | Yes: resize, swap |
| 4 | Water in crack | Particle | Blue fluid volume filling the crack; expands 9 % on freezing to white opaque ice with a visible bulge | Yes: place |
| 5 | Crack-tip stress field | Field | Invisible stress concentration at the crack tip; drives crack extension per freeze event; visualised as a red glow | No |
| 6 | Root wedging planter | Structure | Soil-filled box holding a jointed sandstone slab; roots grow procedurally along the joint | No |
| 7 | Seedling root | Actor | Branching tapered tube, pale cream, thickens 0.02 mm per sim day, exerts radial pressure on joint walls | Yes: place, resize |
| 8 | Abrasion tumbler drum | Actor | 300 mm clear acrylic drum on rollers, rotating 0–40 rpm; contains rock chips and optional water | Yes: swap |
| 9 | Tumbler rock chips | Particle | 20–60 angular fragments, 10–30 mm; edges progressively rounded and mass logged each revolution | Yes: place |
| 10 | Rock flour and sand | Particle | Fine pale powder that accumulates in the drum base as chips wear; volume is a direct readout | No |
| 11 | Desert plinth and boulder | Structure | 400 mm dark basalt boulder on a sand plinth; outer 10 mm shell tracked separately from the core | Yes: swap |
| 12 | Heat lamp on day-night arm | Actor | Motorised lamp arcing overhead; surface temperature swings while core lags behind | Yes: drag |
| 13 | Thermal stress shell | Field | Differential expansion between hot shell and cool core; spalls curved flakes when stress exceeds threshold | No |
| 14 | Spall flakes | Particle | Curved 20–60 mm shell fragments that peel off and drop to the plinth | No |
| 15 | Digital balance (×4) | Instrument | One under each rig, reading intact-block mass to 0.1 g; fragment mass tracked separately | No |
| 16 | Composition assay probe | UI-Probe | Handheld probe that reports the mineral list of any piece, before and after, to prove nothing changed chemically | Yes: drag, place |

**How it works — the model.**
All four rigs share one rule: fragments are produced, mineral composition is not. Freeze-thaw runs a temperature cycle; each time water in the crack crosses 0 °C downward it expands about nine per cent, applies a wedging force at the crack tip, and extends the crack by an increment that scales with how full the crack is and how deep the freeze goes. Cracks that meet split the block. Root wedging is the same wedge geometry driven by steady radial growth pressure instead of ice. Abrasion is impact-driven: chip mass loss per collision scales with tumbler speed squared and with chip hardness contrast, and the lost mass reappears as rock flour, so total mass is conserved. Thermal cycling builds shell-versus-core stress from the temperature difference and spalls a flake when a threshold is crossed. The assay probe exists to make one point unavoidable: surface area rises steeply while the mineral list stays identical.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active rig | Radio | Freeze-thaw / Root wedging / Abrasion / Thermal cycling / All four | All four | — | Structural: which rigs run and which the camera frames |
| Temperature swing | Slider | −25 to +45 | −10 to +12 | °C | Low and high points of the frost-chamber and desert cycle |
| Freeze-thaw cycles | Stepper | 0–500 | 100 | cycles | Number of complete freeze-thaw events to run |
| Water in crack | Slider | 0–100 | 80 | % of crack volume filled | How much ice forms and how hard it wedges |
| Root growth rate | Slider | 0–0.10 | 0.03 | mm/day | Radial pressure the root applies to the joint |
| Tumbler speed | Slider | 0–40 | 20 | rpm | Impact energy per collision, and abrasion rate |
| Tumbler contents | Multi-select | Granite chips / Sandstone chips / Water / Sand | Granite chips + Water | — | Structural: what is inside the drum |
| Rock type on all rigs | Dropdown | Granite / Basalt / Sandstone / Shale / Marble | Granite | — | Structural: swaps the sample in every rig at once |
| Elapsed sim time | Timeline scrubber | 0–200 | 20 | years | Master clock all four rigs share |
| Composition assay | Toggle | On / Off | Off | — | Shows the before-and-after mineral list on every fragment |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Sierra winter | rig=Freeze-thaw; swing=−10 to +12; cycles=200; water=80 | How many cycles pass before the block splits, and what does the crack do on each freeze? |
| S2 | Dry cold | rig=Freeze-thaw; water=0; cycles=200; swing=−25 to +5 | Colder than S1, same number of cycles, no split. What is actually doing the breaking? |
| S3 | Mojave day and night | rig=Thermal cycling; swing=+4 to +45; time=50 | No water at all, yet flakes fall off. Where does the stress come from? |
| S4 | Tumbling river load | rig=Abrasion; speed=35; contents=Granite chips + Water; time=5 | Chips lose mass and round off. Weigh the flour: where did the missing mass go? |

**Student activities.**
1. Set water in crack to 80 % and run 200 freeze-thaw cycles. Record the crack length after every 25 cycles and plot it.
2. Set water to 0 %, re-run the same 200 cycles, and record the final crack length beside your first result.
3. Run the tumbler at 20 rpm for 5 sim years. Record chip mass, rock-flour mass and their sum.
4. Switch on the composition assay and record the mineral list of one boulder before and one spall flake after thermal cycling.
5. Measure and record total exposed surface area on all four rigs at the start and at the end of the run.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Crack length | Line graph | mm vs cycles | Freeze-thaw crack extension, one trace per water-fill setting |
| Fragment count | Counter | count | Pieces produced per rig, updated on each break event |
| Total exposed surface area | Live numeric | cm² | Sum over all fragments; rises sharply as pieces multiply |
| Mass balance | Data table | g | Intact mass, fragment mass, flour mass and total per rig; total must stay constant |
| Mineral composition before / after | Data table | % by mineral | Assay probe results; the two columns must match |
| Rounding index | Live numeric | 0–1 | Mean edge sharpness of tumbler chips, 1 = angular, 0 = fully rounded |
| Spall events | Timer | events/sim-year | Thermal-cycling flake detachment rate |
| Rig comparison | Bar chart | fragments per sim-year | Breaking rate of all four mechanisms on the same rock |

**What the student should realise.**
Students believe that if a rock breaks it must have changed into something else, and that ice is soft so it cannot break stone. Two hundred cycles with an empty crack produce nothing while a full crack splits the block, and the assay proves both halves are still granite. Breaking is mechanical; the minerals are untouched. The student should be able to say: *"Physical weathering makes more pieces and much more surface, but every piece is still the same rock."*

### E2.2 · Chemical weathering

**Experiment name:** The Slow Dissolve: Acid, Air and Rusting Rock  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
Two stations share one bench under warm laboratory light. On the left, a rain station: a glass tank holding a carved limestone garden ornament and a small block of the same stone on a balance, with a fine drip head above delivering simulated acid rain, and a pH meter dipping into the collection tray. On the right, a humid station: a sealed clear chamber holding a fist-sized block of dark iron-rich basalt on a mesh shelf, with a humidity dial, an oxygen gauge and a warm mist drifting through. A magnified inset window in the top-right corner shows the mineral surface at 1000×, where individual ions detach or where an orange rust front advances into the rock. Control panel docked right; a shared elapsed-years clock sits above both stations.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Rain station tank | Environment | 400 mm glass tank, drip head above, collection tray and drain below, wet reflective surfaces | No |
| 2 | Limestone ornament | Actor | Carved 300 mm figure, pale cream, sharp detail at start; edges soften and pit as mass is lost | Yes: swap, resize |
| 3 | Limestone test block | Actor | 50 mm cube on the balance pan, same material, used for clean mass measurements | Yes: place, swap |
| 4 | Acid rain droplets | Particle | 2 mm droplets, tinted by pH from clear (pH 7) to pale yellow (pH 3.5); splash and sheet down the stone | No |
| 5 | Calcite surface lattice | Structure | Inset-window ball-and-stick lattice: Ca²⁺ pale grey spheres, carbonate groups with C charcoal and O red | No |
| 6 | Hydrogen ions | Particle | Small white spheres in the droplets; attack carbonate groups at the surface only | No |
| 7 | Dissolved-ion plume | Particle | Faint blue-green wisps carrying Ca²⁺ and bicarbonate away into the tray water | No |
| 8 | Carbon dioxide bubbles | Particle | 0.3–2 mm bubbles released at the reacting surface, rising and popping | No |
| 9 | Humid chamber | Environment | Sealed 400 mm acrylic box, mesh shelf, mist sprites, condensation beads on the inner wall | No |
| 10 | Iron-rich basalt block | Actor | 120 mm dark grey-green block; olivine and pyroxene grains visible under the inset window | Yes: swap, resize |
| 11 | Oxidation front | Field | Advancing orange-brown rind that thickens inward from every exposed face; depth is state | No |
| 12 | Rust crust and flakes | Structure | Crumbly iron-oxide layer that expands slightly, cracks, and sheds flakes onto the shelf | No |
| 13 | pH meter | Instrument | Probe in the tray, live reading to 1 dp, plus a drift trace as reaction consumes acid | Yes: drag, place |
| 14 | Digital balance (×2) | Instrument | Under the limestone block and under the basalt block, 0.01 g resolution, logging continuously | No |
| 15 | Magnified surface inset | UI-Probe | 1000× window that follows a cursor pin on either sample and shows ion detachment or rust advance | Yes: drag |
| 16 | Surface-area sculptor | Instrument | Tool that splits a sample into 1, 8 or 64 equal cubes of the same total mass | Yes: place, swap |

**How it works — the model.**
Both stations run surface reactions, so rate scales with exposed surface area, not with volume. Limestone dissolution rate rises as pH falls: each hydrogen ion arriving at an exposed carbonate group removes it, releasing calcium and bicarbonate into solution plus a small carbon dioxide bubble, and the removed volume is subtracted from the mesh so the carving visibly rounds. Rate also rises with temperature and with drip rate, because fresh acid replaces spent acid. Oxidation runs a diffusion-limited front: oxygen and water reach iron-bearing minerals and convert them to iron oxide, and front depth advances as the square root of time, so rusting starts fast and slows as the crust thickens. The rust occupies more volume than the mineral it replaced, so the crust cracks and sheds, exposing fresh rock. The critical honesty: mass leaves the limestone permanently as dissolved ions, while the basalt gains mass by taking in oxygen. Chemical weathering is not always loss.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Rain pH | Slider | 3.0–7.0 | 5.6 | pH | Hydrogen-ion concentration and dissolution rate |
| Rainfall rate | Slider | 0–40 | 8 | mm/h | How fast spent acid is replaced with fresh |
| Temperature | Slider | 0–40 | 18 | °C | Reaction rate at both stations |
| Chamber humidity | Slider | 0–100 | 70 | % RH | Water available for oxidation |
| Chamber oxygen | Slider | 0–35 | 21 | % by volume | Oxidation front speed |
| Sample material | Dropdown | Limestone / Marble / Granite / Sandstone / Iron-rich basalt | Limestone | — | Structural: swaps the sample at the selected station |
| Break sample into | Radio | 1 block / 8 cubes / 64 cubes | 1 block | — | Structural: same mass, different surface area |
| Elapsed time | Timeline scrubber | 0–500 | 50 | years | Master clock for both stations |
| Magnified view target | Dropdown | Limestone surface / Basalt surface / Off | Limestone surface | — | What the 1000× inset shows |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Normal rain | pH=5.6; material=Limestone; rainfall=8; time=200 | How much mass does the block lose in 200 years, and where does the lost material go? |
| S2 | Acid rain city | pH=3.8; rainfall=20; time=200 | Same stone, same years. Compare the carving's detail and the balance reading with S1. |
| S3 | Same mass, more faces | pH=4.5; break=64 cubes; time=50 | Total mass is unchanged but weathering is far faster. What quantity actually controls the rate? |
| S4 | Rusting Sierra outcrop | material=Iron-rich basalt; humidity=95; oxygen=21; time=300 | The block gets heavier while getting weaker. Explain both at once. |

**Student activities.**
1. Set rain pH to 5.6 and run 200 sim years. Record limestone mass at 0, 50, 100 and 200 years.
2. Reset, set pH to 3.8, and repeat the same four readings. Plot both series on one axis.
3. Break the sample into 64 cubes at fixed pH and record the mass lost in 50 years against the single-block result.
4. Switch the inset to the basalt surface, run 300 years at 95 % humidity, and record oxidation front depth every 50 years.
5. Record the basalt block's mass before and after and explain, in one sentence, why it went up.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Sample mass | Line graph | g vs sim years | Continuous trace per sample; one line per run for comparison |
| Mass loss rate | Live numeric | g/yr | Instantaneous dissolution rate at the current settings |
| Tray pH | Live numeric | pH | Live acidity of collected runoff, showing acid consumed by reaction |
| Dissolved ion count | Counter | mmol | Calcium and bicarbonate carried away into solution |
| Oxidation front depth | Line graph | mm vs sim years | Rust penetration, showing the square-root slowdown |
| Exposed surface area | Live numeric | cm² | Updates when the sculptor splits a sample |
| Rate vs surface area | Bar chart | g/yr per configuration | 1, 8 and 64 cube results side by side |
| Detail-loss score | Pass-fail badge | — | How much carved detail survives, graded Sharp / Softened / Lost |

**What the student should realise.**
Students believe weathering always means a rock is worn away by something hitting it, and that anything weathering must lose mass. Limestone dissolving in weak acid with no impact at all, and basalt gaining mass as it rusts and crumbles, both break that. Chemical weathering changes the minerals themselves, and it works fastest where there is the most exposed surface. The student should be able to say: *"Chemical weathering changes what the rock is made of, and more surface means a faster change."*

### E2.3 · Agents of erosion

**Experiment name:** Four Carriers: Water, Wind, Ice and Gravity  
**Render mode:** 3D Scene  
**Simulation engine:** Fluid/thermal + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
A 3 m by 2 m sandbox terrain table seen from a raised three-quarter angle, filled with erodible layered ground: pale sand on top, ochre silt beneath, a resistant grey caprock band, then clay. The terrain starts as a gently tilted plateau with one shallow valley cut into it. Four agent heads are mounted on a rail above the table: a spray bar for rain and channel flow, a fan for wind, a small blue-white glacier tongue on a screw feed, and a tilt jack under the table for gravity. Only the armed agent is lit; the others sit dark. Coloured tracer grains are seeded through the terrain so eroded material can be followed. A catchment tray at the low end collects everything removed. Control panel docked right; a contour overlay toggles on the terrain surface.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terrain heightfield | Environment | 300×200 cell grid, 10 mm cells, 5× vertical exaggeration stated on the frame; deformable each tick | Yes: drag, resize |
| 2 | Sand layer | Structure | Top 40 mm, pale gold, low erosion resistance (index 0.2) | Yes: swap |
| 3 | Silt layer | Structure | Next 60 mm, ochre, resistance 0.4 | Yes: swap |
| 4 | Caprock band | Structure | 25 mm grey resistant band, resistance 0.9; produces overhangs and mesas when undercut | Yes: place, swap |
| 5 | Clay base | Structure | Lowest 80 mm, red-brown, resistance 0.6, low permeability | Yes: swap |
| 6 | Rain and channel spray bar | Actor | Rail-mounted bar with 24 nozzles; droplet impact plus surface flow; flow lines visible as silver threads | Yes: drag, place |
| 7 | Wind fan | Actor | 200 mm ducted fan on the rail; produces a directional velocity field and lifts loose grains into a visible dust plume | Yes: drag |
| 8 | Glacier tongue | Actor | Blue-white ice body 400 mm wide on a screw feed, advancing 0–200 mm/min; carries embedded gravel on its base | Yes: drag, resize |
| 9 | Tilt jack | Actor | Under-table jack raising one edge 0–35°; triggers slumps, slides and rockfall once the angle of repose is passed | Yes: drag |
| 10 | Sediment grains | Particle | Three size classes (2 mm gravel, 0.5 mm sand, 0.05 mm silt), each with its own entrainment threshold | No |
| 11 | Tracer grains | Particle | 500 magenta, cyan and lime grains seeded at known start positions; each logs its full path | Yes: place |
| 12 | Flow velocity field | Field | Invisible 2D velocity grid over the surface, used by water and wind; visualised as an arrow overlay | No |
| 13 | Catchment tray | Instrument | Removable tray at the low edge that weighs and size-sorts everything delivered | Yes: drag |
| 14 | Contour overlay | Overlay | 5 mm contour lines redrawn live; erosion shows as contours migrating | No |
| 15 | Erosion-depth heat map | Overlay | False-colour wash, blue = deposition, red = deepest scour, recomputed each second | No |
| 16 | Cross-section blade | UI-Probe | Draggable vertical plane that slices the terrain and shows the profile with layers labelled | Yes: drag, place |

**How it works — the model.**
Each agent supplies a shear stress to the surface. A grain is entrained when the local shear exceeds that grain's threshold, and the threshold rises with grain size and with the layer's resistance index. Water routes downslope through the velocity field, so shear concentrates in channels, which is why valleys deepen and widen rather than eroding evenly. Wind applies shear only above a threshold speed and can only lift the smallest classes, so it leaves gravel behind as a lag surface. Ice does not sort at all: the glacier removes everything under its footprint at a rate set by its advance speed and drops it wherever it stops, producing an unsorted pile. Gravity has no carrying threshold; once slope exceeds the angle of repose, whole blocks fail at once. Every removed grain keeps its identity and its origin, so the catchment tray can always be reconciled against the terrain's lost volume.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active agent | Radio | Water / Wind / Ice / Gravity | Water | — | Structural: which head is armed and lit |
| Rainfall intensity | Slider | 0–120 | 30 | mm/h | Surface flow depth and shear from water |
| Wind speed | Slider | 0–30 | 12 | m/s | Shear from air; below 6 m/s nothing moves |
| Glacier advance rate | Slider | 0–200 | 50 | mm/min | How fast the ice front sweeps the terrain |
| Slope angle | Slider | 0–35 | 6 | degrees | Table tilt; drives gravity failures and speeds water |
| Ground cover | Dropdown | Bare / Grass / Chaparral / Forest | Bare | — | Structural: root binding that raises every entrainment threshold |
| Layer stack | Multi-select | Sand / Silt / Caprock / Clay | All four | — | Structural: which layers exist and in what order |
| Run duration | Slider | 1–120 | 20 | sim years | Length of one erosion run |
| Tracer grains | Stepper | 0–500 | 200 | count | How many tracked grains are seeded |
| Erosion heat map | Toggle | On / Off | On | — | Shows the scour-and-fill false-colour wash |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Rain on bare ground | agent=Water; rainfall=60; cover=Bare; slope=8; duration=20 | Where does the terrain lose most material, and why is the loss not spread evenly? |
| S2 | Mojave wind | agent=Wind; wind=22; layers=Sand+Silt+Caprock; duration=40 | Wind removes a lot but leaves a stony surface behind. Which grain sizes stayed, and why? |
| S3 | Sierra glacier | agent=Ice; advance=120; duration=30 | Compare this valley's cross-section shape with the water-cut valley from S1. |
| S4 | Slope failure | agent=Gravity; slope=32; cover=Bare; duration=5 | Nothing is flowing over the ground, yet a whole block moves. What triggered it? |

**Student activities.**
1. Run water at 60 mm/h on bare ground for 20 years. Record catchment-tray mass and the deepest scour value from the heat map.
2. Set ground cover to Forest, re-run identically, and record both numbers again beside the first pair.
3. Run wind at 22 m/s and record the grain-size breakdown in the catchment tray, then describe the surface left behind.
4. Drag the cross-section blade across the valley after the water run and again after the ice run. Sketch both profiles.
5. Raise the slope in 5° steps with gravity armed and record the exact angle at which the first block fails.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Sediment yield | Live numeric | kg/sim-year | Mass arriving in the catchment tray per year |
| Catchment size breakdown | Bar chart | % gravel / sand / silt | How well the agent sorted what it carried |
| Erosion-depth map | Heat map | mm | Scour in red, deposition in blue, over the whole terrain |
| Terrain cross-section | Line graph | mm vs mm | Live profile under the blade, with layer boundaries marked |
| Tracer paths | Vector overlay | mm | Start-to-end tracks of tagged grains, coloured by class |
| Volume balance | Data table | cm³ | Terrain volume lost against tray volume gained; the two must agree |
| Failure events | Counter | count | Gravity slumps and slides, with the slope angle logged for each |
| Agent comparison | Data table | mixed | Yield, sorting and valley shape for all four agents on the same terrain |

**What the student should realise.**
Students believe erosion is just water washing soil away, and that all agents do the same job. Running four agents on identical ground makes the differences unmissable: water concentrates into channels and sorts by size, wind takes only the fine grains and leaves stones, ice removes everything and sorts nothing, and gravity waits for a slope angle and then moves a whole block at once. The student should be able to say: *"Erosion is transport, and each carrier picks up different material and leaves a different shape behind."*

### E2.4 · Where sediment ends up

**Experiment name:** The Sorting Flume: Where Each Grain Stops  
**Render mode:** 2.5D Layered  
**Simulation engine:** Fluid/thermal + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
A 4 m glass-sided flume runs left to right across the whole screen, seen dead side-on so the water column and the bed are both fully visible. At the left end a hopper feeds a mixed sediment load into fast, turbulent water pouring down a steep upper reach; the channel then flattens, widens, and finally opens into a still blue standing-water basin at the right end. Above the glass, a metre tape runs the full length in 10 cm marks. The bed builds up in real time: coarse angular gravel banking up in the first metre, gold sand ripples in the middle, olive silt drapes further on, and a pale clay haze settling last in the basin. Backlighting through the glass makes the suspended load visible. Control panel docked right; a sampling rack sits under the flume.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Glass flume channel | Environment | 4000×400 mm side-on glass box with steel frame, backlit; 10 cm graduations along the top rail | Yes: resize |
| 2 | Channel bed profile | Structure | Editable longitudinal bed line: steep upper reach, break of slope, flat lower reach; drag any of six control nodes | Yes: drag |
| 3 | Water column | Field | Depth-and-velocity field solved per 10 mm station; surface drawn with standing waves over the steep reach | No |
| 4 | Sediment hopper | Actor | Left-end hopper with an adjustable gate; releases a chosen mix at a chosen rate | Yes: place, resize |
| 5 | Gravel grains | Particle | 4–32 mm angular polygons, tan-grey; roll and bounce along the bed as bedload, never suspended | No |
| 6 | Sand grains | Particle | 0.2–2 mm gold rounded grains; saltate in short hops and build ripples | No |
| 7 | Silt grains | Particle | 0.01–0.06 mm olive dots; carried in suspension, settle only where flow slows | No |
| 8 | Clay particles | Particle | Sub-0.004 mm translucent haze; settle only in the still basin, and only if flocculation is on | No |
| 9 | Ripple and dune bedforms | Structure | Procedural asymmetric bedforms that grow, migrate downstream and change shape with flow speed | No |
| 10 | Delta foreset wedge | Structure | Prograding wedge at the basin mouth with visible topset, foreset and bottomset beds | No |
| 11 | Standing-water basin | Environment | Right-end still-water body, 600 mm wide, deep blue, no flow; clay clears from it slowly | Yes: resize |
| 12 | Velocity probe | Instrument | Draggable propeller meter reading local water speed in m/s at any station | Yes: drag, place |
| 13 | Bed sampler cores (×6) | Instrument | 25 mm corers the student presses into the bed at any station; extract a labelled column to the rack | Yes: drag, place |
| 14 | Sample rack | UI-Probe | Under-flume rack displaying up to six cores with a grain-size scale beside each | Yes: drag |
| 15 | Distance-vs-grain-size chart | Overlay | Live scatter of median grain diameter against distance from the hopper | No |
| 16 | Flood pulse timer | Instrument | Scheduler that raises discharge for a set duration then drops it, producing a coarse layer over a fine one | Yes: place |

**How it works — the model.**
Every grain class carries a settling velocity that rises steeply with diameter, and an entrainment threshold that also rises with diameter. Water speed is solved along the flume from slope, discharge and channel width, so speed falls as the bed flattens and the channel widens. A grain stays in transport while local speed keeps it above its threshold and drops out where speed falls below its settling condition. Because thresholds differ by class, the drop-out points differ, and sorting along the flume is an emergent result rather than a scripted animation. Bedload and suspended load are handled separately: gravel and sand move by contact with the bed, silt and clay travel within the water. Flood pulses raise speed everywhere, pushing every drop-out point downstream and burying finer deposits under coarser ones, which is exactly how graded layers form. Total sediment mass in must equal deposited mass plus mass still in transit.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Discharge | Slider | 0.5–40 | 8 | L/s | Water speed everywhere along the flume |
| Upper-reach slope | Slider | 0.5–12 | 4 | degrees | Steepness of the first metre, and the peak speed there |
| Channel width profile | Drag-handle | 60–400 mm at six nodes | 120 mm narrowing to 400 mm | mm | Structural: reshapes where flow slows down |
| Sediment mix | Multi-select | Gravel / Sand / Silt / Clay | All four | — | Structural: which classes the hopper releases |
| Feed rate | Slider | 0–200 | 60 | g/s | How much sediment enters per second |
| Flood pulse | Stepper | 0–5 pulses | 0 | count | Structural: timed discharge surges layered into the run |
| Basin water | Toggle | Still basin / Open outlet | Still basin | — | Structural: whether fines settle or are flushed out of the flume |
| Salt water (flocculation) | Toggle | Fresh / Salty | Fresh | — | Whether clay clumps and settles quickly at the river mouth |
| Run duration | Slider | 1–60 | 10 | min (sim) | Length of the deposition run |
| Grain-size chart | Toggle | On / Off | On | — | Displays the live distance-versus-size scatter |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Steady river | discharge=8; slope=4; mix=all four; duration=10 | Core the bed at 0.5, 1.5, 2.5 and 3.5 m. What changes along the flume, and in what order? |
| S2 | Flood | discharge=32; slope=4; pulses=1; duration=10 | Where does gravel reach now, and what does the core at 2.5 m look like compared with S1? |
| S3 | Central Valley to the Delta | slope=1; width widening to 400 mm; basin=Still; salt=Salty | Why does clay finally settle here when it stayed suspended the whole way down the channel? |
| S4 | Same water, coarse load only | mix=Gravel+Sand; discharge=8 | With no fines in the load, does anything reach the basin at all? Explain using the velocity probe. |

**Student activities.**
1. Run the standard mix for 10 sim minutes. Take bed cores at 0.5, 1.5, 2.5 and 3.5 m and record the dominant grain size in each.
2. Drag the velocity probe to those same four stations and record the water speed at each.
3. Plot your four speeds against your four grain sizes and describe the relationship in one sentence.
4. Add one flood pulse, re-run, and record how far downstream the gravel front moved.
5. Switch the basin to Salty and record how long the clay haze takes to clear, against the Fresh result.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Water speed profile | Line graph | m/s vs m | Speed along the whole flume, updated live |
| Median grain size vs distance | Line graph | mm vs m | The sorting curve, built as deposition proceeds |
| Core logs | Data table | mixed | Station, depth, grain-size fractions and layer count for each of the six cores |
| Deposit thickness map | Heat map | mm | Bed accumulation along the flume, coarse to fine coloured |
| Mass balance | Data table | g | Fed in, deposited, still in transit and flushed out; the four must reconcile |
| Suspended load | Live numeric | g/L | Concentration of silt and clay still in the water column |
| Delta progradation | Live numeric | mm | How far the foreset wedge has advanced into the basin |
| Sorting quality | Pass-fail badge | — | Well sorted / Moderately sorted / Poorly sorted for the selected core |

**What the student should realise.**
Students believe rivers dump everything they carry in one place when they stop, and that a mixed load stays mixed. The cores make that impossible to hold: gravel is already grounded in the first metre while clay is still travelling three metres later, and every core shows a different dominant size. Deposition is a filter set by water speed. The student should be able to say: *"Sediment drops out in order, biggest first, wherever the water slows down enough to stop carrying it."*

### E2.5 · Soil formation

**Experiment name:** Growing a Soil: From Bare Rock to Four Horizons  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model + Agent-based  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-1

**Theme & scene.**
A 1 m by 1.5 m soil pit dug into a hillside, viewed as an open cross-section with the pit face toward the camera and a sliver of the living surface visible along the top. At the start the face is almost entirely bare bedrock with a thin dusting of grit. As the run proceeds, distinct horizons build downward from the surface: a dark leaf-litter mat, a crumbly dark-brown topsoil threaded with pale roots and burrow tunnels, a redder, denser subsoil with visible clay coatings and iron staining, and a rubbly zone of broken parent rock above solid bedrock. A depth tape runs down the right side of the pit in centimetres. Rain, sun and a small stand of vegetation animate along the top edge. Control panel docked right; a decade timeline scrubber sits below the pit.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Soil pit face | Environment | 1000×1500 mm cutaway with a clean vertical face, side walls in soft shadow, depth tape on the right | No |
| 2 | Parent bedrock (R) | Structure | Solid basal layer; texture and colour swapped by parent-material dropdown; weathers only at its top surface | Yes: swap |
| 3 | C horizon (broken parent rock) | Structure | Rubbly zone of angular fragments in the parent's own colour; thickness grows as the weathering front descends | No |
| 4 | B horizon (subsoil) | Structure | Denser, redder layer with clay skins and iron staining; grows by receiving washed-down clay and iron | No |
| 5 | A horizon (topsoil) | Structure | Crumbly dark-brown mineral-plus-humus layer; darkness tracks organic content | No |
| 6 | O horizon (litter mat) | Structure | Surface mat of leaves, needles and twigs, 0–80 mm, brown to near-black as it decays | Yes: place |
| 7 | Vegetation stand | Actor | Selectable cover: bunchgrass, chaparral shrubs, oak or pine; grows with time and drops litter each sim year | Yes: swap, place |
| 8 | Root network | Actor | Branching root system that deepens over time, wedges the C horizon and pumps organic matter downward | No |
| 9 | Earthworms and soil fauna | Agent | 10–200 small agents that burrow visible tunnels, mix the A horizon and accelerate humus formation | Yes: place |
| 10 | Leaching flow field | Field | Downward water flux through the profile; carries clay, iron and dissolved minerals from A into B | No |
| 11 | Clay and iron migration particles | Particle | Fine ochre and rust specks visibly travelling from A to B and accumulating as coatings | No |
| 12 | Weathering front | Field | Boundary between fresh bedrock and C horizon; descends at a rate set by climate and parent hardness | No |
| 13 | Erosion sweep | Actor | Optional surface stripping event that removes the top horizons if cover is low and slope is high | Yes: place |
| 14 | Soil auger | Instrument | 30 mm auger the student drives to any depth; returns texture, colour, pH and organic percentage at that depth | Yes: drag, place |
| 15 | Horizon ruler | UI-Probe | Draggable calliper that measures the thickness of any named horizon to the nearest millimetre | Yes: drag |
| 16 | Decade timeline scrubber | UI-Probe | Scrubber running 0 to 10000 years; scrubbing backwards rewinds the profile exactly | Yes: drag |

**How it works — the model.**
Soil grows from two directions at once. From below, a weathering front descends into bedrock at a rate set by rainfall, mean temperature and the parent rock's resistance, converting solid rock into C-horizon rubble. From above, vegetation adds litter each year; decomposition converts litter into humus at a rate that rises with warmth and moisture, and fauna mix humus down into the mineral grains to form the A horizon. Leaching then moves clay and iron from A downward into B whenever infiltration exceeds evaporation, so B thickens only in wetter settings and stays thin in dry ones. Horizon thicknesses are therefore outputs of the five soil-forming factors, never presets. Erosion competes with all of this: if cover is low and slope high, the sweep removes the A and O horizons faster than they form and the profile stalls, which is the point of the degraded scenario. Total profile depth must always equal the sum of the horizon thicknesses.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Rainfall | Slider | 50–3000 | 700 | mm/yr | Weathering-front speed, leaching strength and plant growth |
| Mean temperature | Slider | −5 to 32 | 14 | °C | Chemical weathering and decomposition rates |
| Parent material | Dropdown | Granite / Basalt / Sandstone / Shale / Limestone | Granite | — | Structural: how fast the front descends and what texture results |
| Vegetation cover | Dropdown | Bare / Bunchgrass / Chaparral / Oak woodland / Pine forest | Bunchgrass | — | Structural: litter input rate, root depth and surface protection |
| Slope angle | Slider | 0–30 | 5 | degrees | Erosion risk on the surface horizons |
| Soil fauna | Stepper | 0–200 | 60 | organisms/m² | Mixing rate between litter, humus and mineral grains |
| Elapsed time | Timeline scrubber | 0–10000 | 500 | years | Master clock; scrubbing rewinds and replays the profile |
| Erosion event | Stepper | 0–4 events | 0 | count | Structural: schedules surface stripping episodes into the run |
| Auger depth | Slider | 0–150 | 30 | cm | Where the auger samples the profile |
| Horizon labels | Toggle | On / Off | On | — | Shows or hides the O, A, B, C and R labels on the pit face |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Sierra pine slope | rainfall=1200; temp=9; parent=Granite; cover=Pine forest; time=3000 | Which horizon is thickest after 3000 years, and which one formed first? |
| S2 | Mojave desert | rainfall=120; temp=22; parent=Basalt; cover=Bare; time=3000 | Same 3000 years, barely any soil. Which two factors are limiting it? |
| S3 | Central Valley grassland | rainfall=450; temp=17; parent=Shale; cover=Bunchgrass; fauna=150; time=2000 | Why is the A horizon here dark and deep when rainfall is far lower than S1? |
| S4 | Stripped hillside | rainfall=1200; cover=Bare; slope=25; erosion=3; time=1000 | The profile stops growing. Which horizons are missing, and what does the auger find at 10 cm? |

**Student activities.**
1. Set the Sierra preset and scrub the timeline to 100, 500, 1500 and 3000 years. Record the thickness of each horizon at all four times.
2. Drive the auger to 5, 20, 50 and 100 cm and record colour, texture and organic percentage at each depth.
3. Swap vegetation cover from Pine forest to Bare, hold everything else fixed, re-run to 3000 years, and record the O and A thicknesses.
4. Set slope to 25° with three erosion events and record which horizons survive and which are gone.
5. Compare your Sierra and Mojave profiles and write one sentence naming the factor responsible for the biggest difference.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Horizon thickness log | Data table | cm | O, A, B, C thickness at every timeline stop, exportable CSV |
| Profile development curve | Line graph | cm vs years | Total soil depth against time; flattens as the front slows |
| Organic matter content | Line graph | % vs depth | Depth profile showing the sharp peak in the A horizon |
| Auger sample card | Data table | mixed | Depth, colour, texture class, pH and organic percentage at the sampled depth |
| Clay and iron transfer | Counter | g/m² per century | Material leached from A and accumulated in B |
| Soil loss to erosion | Live numeric | t/ha/yr | Surface material removed at the current cover and slope |
| Horizon identification | Pass-fail badge | — | Whether a recognisable O, A, B, C sequence exists yet |
| Formation rate | Live numeric | mm/century | Net soil deepening at current settings, for comparison with erosion loss |

**What the student should realise.**
Students believe soil is dirt that was always there, or that it is simply crushed rock. Watching a bare granite face take three thousand years to build a few centimetres, and watching three erosion events erase it in one, makes that untenable. Soil is a layered product built from below by weathering and from above by living things, and it is destroyed far faster than it is made. The student should be able to say: *"Soil is rock plus life plus time, and its layers record how it was built."*

## E3 · Geoscience processes across time and scale · MS-ESS2-2

### E3.1 · Fast processes

**Experiment name:** Sixty Seconds That Move a Mountain  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Procedural geology + Rigid-body  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-2

**Theme & scene.**
A two-kilometre block of California ground sits on a dark bench like a specimen tray, its front face sliced open to show pale bedded layers. A stopwatch runs in real seconds at the top left, never in years. Four event cartridges line the bottom rail: a fault trace, a snow-capped cone, a coastal bluff, a dry desert wash. Load one and the block re-dresses itself in seconds. The camera is a three-quarter aerial that can drop to eye level beside a parked car and a two-storey house, both left on the block purely as scale. Palette is dust-tan and slate, with hazard orange reserved for whatever is currently moving. The control panel docks right; a translucent white shell hovers over the terrain showing the surface as it was before the event began.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terrain block | Environment | 2000×2000×400 m heightfield, 2 m grid, dust-tan with sparse chaparral instancing; vertical exaggeration 1.5× stated on screen | Yes: resize |
| 2 | Cutaway strata face | Structure | Front and right walls exposed; five beds (soil 0.4 m, alluvium 6 m, sandstone 22 m, shale 15 m, granite basement) with distinct hatch textures | No |
| 3 | Fault plane and asperity patches | Field | Vertical plane cutting the block, dip 88°; 6–14 red "sticky" patches of variable strength on it; slip arrows sprout on the surface trace as each patch breaks | Yes: drag |
| 4 | Seismograph and strong-motion pad | Instrument | 30 cm drum recorder plus a flat accelerometer plate; writes a live trace; records peak ground acceleration in g | Yes: place |
| 5 | Magma chamber | Structure | Ellipsoid 900×500 m at 5 km depth, glowing dull orange, bubble density rising with gas content | Yes: resize |
| 6 | Conduit and vent | Structure | Vertical pipe 20–120 m bore from chamber to summit crater; rim of welded spatter; student may re-site the vent on a flank | Yes: place |
| 7 | Ash plume emitter | Particle | Cone emitter at the vent, up to 40,000 grey particles, buoyant rise then umbrella spread; wind shears the column downrange | No |
| 8 | Pyroclastic flow / lava lobe | Particle | Dense ground-hugging particle sheet (explosive case) or a viscous cooling lobe with a crusted black skin (effusive case) | No |
| 9 | Hillslope regolith wedge | Structure | Loose soil-and-rock wedge 3–12 m thick draped on the bluff, brown speckled, separated from bedrock by a mapped contact | Yes: resize |
| 10 | Failure surface | Field | Curved (rotational) or planar (translational) slip surface computed inside the wedge; renders as a glowing seam when the safety factor drops below 1.1 | No |
| 11 | Debris runout mass | Actor | 2,000–20,000 rigid-body clasts 0.2–4 m across plus a fluidised fine-grain layer; entrains extra material as it travels | No |
| 12 | Storm cell | Particle | Grey anvil cloud 4 km wide with a rain-streak curtain beneath; drifts across the catchment on a heading | Yes: drag |
| 13 | Wash channel and flood-depth field | Field | Braided sandy channel spline with a 1 m-resolution water-depth raster; depth shaded pale blue to brown by sediment load | Yes: drag |
| 14 | Scale props | Actor | Sedan (4.5 m), two-storey house (7 m), valley oak (12 m), standing figure (1.6 m); can be re-placed anywhere on the block | Yes: place |
| 15 | Before-surface ghost | Overlay | Translucent white mesh frozen at t=0; the gap between it and the live surface is the change | No |
| 16 | Elevation-change profiler | Instrument | Draggable laser line across the block returning a before/after profile pair and metres gained or lost | Yes: drag |

**How it works — the model.**
Each cartridge runs a different rule set on the same clock, and the clock is always real time. The fault stores elastic strain as a slip deficit in metres; when shear stress on an asperity exceeds its strength the patch fails, sheds load onto its neighbours, and a rupture front sweeps the plane at 2.8 km/s. Slip on the surface trace equals the released deficit. The volcano runs a chamber pressure balance: dissolved gas exsolves as magma rises, and if the gas fraction at fragmentation depth exceeds about 75 % by volume the column fragments and goes explosive, otherwise it flows. The hillslope computes a safety factor from slope angle, wedge thickness and pore-water pressure; below 1.0 the wedge releases and runs out as rigid bodies. The wash uses a rainfall-runoff routing model: depth rises where inflow exceeds outflow. Nothing here is time-compressed. If it takes forty seconds on screen it took forty seconds in the world, and that is the point.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Event | Dropdown | Fault rupture / Eruption / Landslide / Flash flood | Fault rupture | — | Reloads the terrain dressing, the hazard actors and the instrument set |
| Stored fault strain | Slider | 0.0–8.0 | 4.5 | m of slip deficit | How much offset is available to release; sets magnitude |
| Rupture length | Slider | 2–120 | 30 | km | How much of the fault breaks, and how long the shaking lasts |
| Magma gas content | Slider | 0.2–6.0 | 3.0 | % H₂O by mass | Whether the column fragments; plume height |
| Magma type | Dropdown | Basalt / Andesite / Rhyolite | Andesite | — | Viscosity, so lava lobe versus ash column |
| Slope angle | Slider | 15–45 | 32 | ° | Driving stress in the regolith wedge |
| Regolith water content | Slider | 0–45 | 18 | % by volume | Pore pressure; pushes the safety factor toward 1.0 |
| Rain intensity | Slider | 0–90 | 25 | mm/h | Runoff supplied to the wash and to the hillslope |
| Playback speed | Dial | 0.1×–20× | 1× | — | Time scaling; 1× is genuine real time |
| Before-surface ghost | Toggle | On / Off | On | — | Shows the pre-event land surface for direct comparison |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Parkfield section | Event=Fault rupture; stored fault strain=2.0; rupture length=30 | How many seconds does strong shaking last, and how far does the fence line across the trace end up offset? |
| S2 | Gas-charged dome | Event=Eruption; magma gas content=5.5; magma type=Rhyolite | How long after the first tremor does ash begin falling on the house, and how high does the column climb? |
| S3 | Big Sur bluff after the atmospheric river | Event=Landslide; slope angle=38; regolith water content=38; rain intensity=60 | Rain has run for an hour with nothing happening. What number crosses what threshold at the instant the slope lets go? |
| S4 | Mojave dry wash | Event=Flash flood; rain intensity=75; slope angle=15 | The storm cell is parked 6 km upstream and no rain falls on the wash itself. How does the water arrive, and how deep is it at peak? |

**Student activities.**
1. Run S1 at 1× playback with the stopwatch visible. Record the total shaking duration in seconds and the final offset of the fence line in metres.
2. Place the seismograph 200 m from the trace, run again, then drag it to 8 km and re-run. Record peak ground acceleration at both distances.
3. Set magma gas content to 1.0 and run; set it to 5.5 and run. Record plume height and whether lava flowed or ash fell, and state the gas value where the behaviour flipped.
4. Raise regolith water content in 5 % steps from 15 %, running after each step. Record the value at which the slope fails and the runout distance of the debris.
5. Drag the elevation-change profiler across the scar of any completed event and record the maximum metres of ground lost, together with the clock time when it happened.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Event clock | Timer | s | Real elapsed seconds since trigger; never converts to years |
| Surface offset | Live numeric | m | Horizontal and vertical displacement across the fault trace |
| Seismogram | Line graph | g vs s | Live ground acceleration trace with peak marked |
| Plume height | Live numeric | km above vent | Top of the ash column, sampled every 0.5 s |
| Runout distance and front speed | Live numeric | m and m/s | Distance travelled by the debris front and its instantaneous speed |
| Flood hydrograph | Line graph | m depth vs min | Water depth at the wash gauge through the storm |
| Elevation change | Heat map | m | Live surface minus ghost surface, red for loss, blue for gain |
| Event log | Data table | mixed | One row per run: event, settings, duration, maximum change; exportable |

**What the student should realise.**
Students believe geology is always slow and that anything shaping the land must take thousands of years. Here the clock runs in genuine seconds and a hillside still moves eight metres, a fault offsets a fence by two, and a dry wash becomes a metre deep. The changes are large, measured, and finished before the session ends. The student should be able to say: *"Some of the land's shape is made in seconds, not in ages."*

### E3.2 · Slow processes

**Experiment name:** The Million-Year Dial  
**Render mode:** 3D Scene  
**Simulation engine:** Procedural geology  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-2

**Theme & scene.**
A wide Sierra Nevada landscape fills the frame under low raking light, drawn in muted granite greys and dry-grass gold, with a river ribbon threading a shallow valley. Everything looks still. Dominating the right of the panel is a heavy brass dial marked in years per second, from 1 to 500,000, with a six-digit odometer beside it counting elapsed model years. Turn the dial and the stillness becomes motion: ridge crests rise, the river bites downward, a delta fans into a pale sea, ice creeps and grinds. The front and right faces of the terrain are cut away so bedrock layers of different hardness show as coloured bands. A vertical exaggeration figure and a metre scale bar sit permanently in the lower left corner.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Landscape heightfield | Environment | 60×60 km domain on a 100 m grid; granite grey uplands, gold grassland lowlands; re-meshes every tick | Yes: resize |
| 2 | Rock hardness layers | Structure | Four stacked units with erodibility values: granite (hardest, pink-grey speckle), limestone, sandstone (buff, cross-bedded), shale (soft, dark grey fissile); exposed on the cut faces | Yes: swap |
| 3 | Uplift field | Field | Invisible scalar map of vertical rate in mm/yr, painted as a dome or a ridge; drives the whole surface upward each tick | Yes: drag |
| 4 | River channel network | Actor | Branching spline that re-routes itself downhill each tick; width scales with discharge; renders as a blue-white ribbon | Yes: drag |
| 5 | Sediment load packets | Particle | Ochre motes carried along the channel, count proportional to erosion rate; deposited where slope flattens | No |
| 6 | Delta lobe builder | Structure | Fan-shaped depositional wedge at the river mouth, growing in lobes that switch position every few thousand model years | No |
| 7 | Sea-level plane | Environment | Flat translucent blue plane with a shoreline contour that redraws as elevation or sea level changes | Yes: drag |
| 8 | Glacier body | Actor | Ice mass with an accumulation zone above the snowline and a melting tongue below; blue-white with surface crevasse lines | Yes: resize |
| 9 | Glacial abrasion tool | Field | Invisible erosion kernel beneath the ice that widens and deepens the valley toward a U cross-section, and cuts a cirque at the head | No |
| 10 | Moraine ridges | Structure | Lateral and terminal ridges of unsorted grey debris left where the ice front stalls | No |
| 11 | Cross-section knife | Instrument | Draggable vertical plane returning a valley profile; overlays V-shape and U-shape reference curves | Yes: drag |
| 12 | Elevation marker post | Instrument | Placeable survey post that logs the height of that point in metres against model time | Yes: place |
| 13 | Million-year odometer | UI-Probe | Six-digit mechanical counter reading elapsed model years and Myr, mounted beside the dial | No |
| 14 | Timeline scrubber | UI-Probe | Horizontal rail with keyframe pins; dragging it replays saved landscape states forward or backward | Yes: drag |
| 15 | Rate flag | Overlay | Small tag pinned to each active process showing its rate in mm/yr, so the student always sees a per-year number | No |
| 16 | Scale bar and exaggeration label | Overlay | Kilometre bar plus a permanent "vertical exaggeration 3×" caption | No |

**How it works — the model.**
The landscape updates once per model tick with two competing terms: uplift adds elevation at the rate painted into the uplift field, and erosion removes it at a rate proportional to channel slope, discharge and the erodibility of whichever rock unit is currently at the surface. Anything eroded is conserved as sediment and must be deposited somewhere downstream, which is what grows the delta. Ice erodes on a different law again, scaling with ice thickness and basal sliding speed, and it erodes the valley walls as well as the floor, so the cross-section migrates from V toward U. The dial changes only how many model years pass per real second, never the rates themselves, and the rate flags stay pinned in mm/yr throughout. That separation is the honest part: nothing speeds up, the student's view of it does.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Process | Dropdown | Mountain uplift / Canyon incision / Delta growth / Glacial carving | Mountain uplift | — | Loads a different starting landscape, agent set and instrument kit |
| Time compression | Dial | 1–500,000 | 1,000 | model years per real second | How fast the odometer runs; rates are unchanged |
| Uplift rate | Slider | 0.0–10.0 | 2.0 | mm/yr | How fast the uplift field raises the surface |
| River discharge | Slider | 1–2,000 | 120 | m³/s | Erosive power of the channel and sediment carried |
| Rock hardness set | Dropdown | All granite / Granite over sandstone / Sandstone over shale / Layered (four units) | Layered | — | Which units the river must cut through; changes cliff and bench form |
| Precipitation | Slider | 100–2,500 | 600 | mm/yr | Discharge feed and how quickly slopes are stripped |
| Sea level | Slider | −120 to +40 | 0 | m relative to today | Where deposition starts; drowns or exposes the delta |
| Snowline elevation | Slider | 1,500–4,000 | 2,700 | m | Glacier size; below the snowline the ice melts back |
| Vertical exaggeration | Slider | 1–6 | 3 | × | Relief on screen; the caption updates with it |
| Keyframe capture | Toggle | On / Off | On | — | Saves landscape states so the timeline scrubber can replay them |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Sierra Nevada rising | Process=Mountain uplift; uplift rate=1.0; river discharge=80; time compression=100,000 | At 1 mm per year, how many metres has the range risen after one million years, and does that match the marker post? |
| S2 | A river through hard and soft | Process=Canyon incision; rock hardness set=Layered; discharge=600; precipitation=900 | Why does the canyon wall have cliffs at some levels and gentle benches at others, when the river cut all of them? |
| S3 | Sacramento delta building | Process=Delta growth; discharge=900; sea level=0; time compression=10,000 | Where does the sediment removed upstream end up, and how far does the shoreline advance in 50,000 years? |
| S4 | Ice takes the valley | Process=Glacial carving; snowline elevation=2,200; precipitation=1,800 | Run the river first, then the ice down the same valley. What changes about the cross-section, and what makes the ice different from the water? |

**Student activities.**
1. Set time compression to 1 model year per second and watch for 30 s. Record how much the marker post moved, then explain in one sentence why the dial exists.
2. Place a marker post on the ridge crest, set uplift to 2 mm/yr, and run to 1 Myr. Record the post's height and check it against 2 mm × 1,000,000.
3. Drag the cross-section knife across the valley in S4 before and after the glacier passes. Sketch both profiles and label which is V-shaped and which is U-shaped.
4. Swap the rock hardness set from All granite to Sandstone over shale, re-run S2 to the same model age, and compare the canyon widths you measure.
5. Run S3 and record the sediment budget every 10,000 years. Compare the mass removed upstream with the mass added to the delta and state whether they balance.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Model age | Live numeric | years and Myr | Odometer reading, updated every frame |
| Marker post elevation | Line graph | m vs Myr | Height of each placed post against model time |
| Erosion and uplift rates | Live numeric | mm/yr | Current values at the cursor position, always per year |
| Valley cross-section | Line graph | m vs m | Profile under the knife, with V and U reference curves overlaid |
| Sediment budget | Data table | m³ | Eroded, in transit and deposited volumes per 10,000-year interval |
| Shoreline position | Live numeric | km from start | How far the delta front has advanced |
| Landscape keyframes | Data table | mixed | Saved states with age, mean elevation, relief; exportable |

**What the student should realise.**
Students believe slow processes are too weak to matter, because nothing visible happens while they watch. The dial makes the arithmetic unavoidable: a rate of two millimetres a year, which is invisible, becomes two kilometres in a million years, which is a mountain range. Nothing in the model ever sped up. The student should be able to say: *"A tiny rate is not a small change, it is a small change per year, and years are what the Earth has most of."*

### E3.3 · Constructing an explanation from rock layers

**Experiment name:** Read the Wall, Write the History  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-2

**Theme & scene.**
A highway road-cut fills the left two-thirds of the screen: a fresh, dusty rock face forty metres high and ninety wide, lit by hard midday sun so every bed edge throws a shadow line. The beds are unmistakably different from each other in colour, thickness and texture, and they are not all horizontal. A dark igneous sheet cuts obliquely across several of them. Near the base a ragged, irregular surface separates tilted layers below from flat layers above. A hand lens follows the cursor. The right third is the explanation bench: a deck of event cards, an empty timeline rail running oldest at the bottom to youngest at the top, and a scoring strip. Ruler, hammer icon and a metre scale bar sit at the base of the face.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Road-cut face | Environment | 90×40 m rock wall with a talus apron and a guard rail for scale; slightly weathered normal map | No |
| 2 | Bed 1 — schist basement | Structure | Bottom 8 m, dark grey-green, strongly foliated with wavy banding, no fossils | No |
| 3 | Bed 2 — basal conglomerate | Structure | 1.5 m, rounded pebbles 2–8 cm in a sandy matrix, sits directly on the irregular surface | No |
| 4 | Bed 3 — cross-bedded sandstone | Structure | 9 m, buff, with sweeping internal cross-bed sets and rare reptile tracks | No |
| 5 | Bed 4 — grey shale | Structure | 6 m, dark, fissile, splits into plates, carries flattened plant fossils | No |
| 6 | Bed 5 — fossiliferous limestone | Structure | 7 m, pale cream, packed with shell and coral fragments, blocky weathering | No |
| 7 | Bed 6 — volcanic ash tuff | Structure | 0.8 m, pale pink, fine and even; carries a radiometric age label when the dating overlay is on | No |
| 8 | Bed 7 — capping soil horizon | Structure | 0.6 m, brown, root-mottled, grades downward into weathered limestone | No |
| 9 | Angular unconformity surface | Structure | Irregular erosional contact truncating the tilted schist beneath Bed 2; drawn as a red dashed trace when highlighted | No |
| 10 | Basalt dike | Structure | 1.2 m dark sheet cutting Beds 1–5 at 70°, with a chilled fine-grained margin and baked rims either side | No |
| 11 | Normal fault | Structure | Offsets Beds 2–5 by 3 m down to the right, but stops beneath Bed 7 | No |
| 12 | Hand lens | UI-Probe | Circular 6× lens following the cursor, revealing grain size, sorting and fossil detail | Yes: drag |
| 13 | Sample pin | Instrument | Placeable pin returning a card with rock type, grain size, fossil content and depositional environment | Yes: place |
| 14 | Event card deck | UI-Probe | 14–20 cards such as "Sea floods the area", "Layers tilted", "Erosion strips the top", "Magma injected", "Faulting"; 4–8 are distractors that do not fit this face | Yes: drag |
| 15 | Timeline rail | UI-Probe | Vertical rail with 10 snap slots, oldest at the bottom; cards lock into slots | Yes: place |
| 16 | Evidence link wire | UI-Probe | Drag a wire from a placed card to the bed or structure that justifies it; unlinked cards score zero | Yes: connect |

**How it works — the model.**
The outcrop is a fixed, authored dataset rather than a physics run: each bed and structure carries hidden properties for rock type, environment, relative age and cross-cutting relationships. The bench scores two independent things. Order score compares the student's card sequence with the true sequence derived from superposition (lower beds are older unless overturned), cross-cutting relationships (the dike and the fault must be younger than everything they cut), and unconformities (the irregular surface records tilting then erosion then renewed deposition, so it must sit between them). Evidence score checks each placed card's link wire: a card is only credited if it is wired to a feature that actually supports it, so a correct order guessed without evidence scores half. Distractor cards for events with no trace in this wall must be left in the deck. The model must never award full marks for a plausible story with no wires attached, because the whole skill is tying claim to evidence.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Outcrop | Dropdown | Cajon Pass road-cut / Mojave wash bank / Coast Range sea cliff / Sierra foothill quarry | Cajon Pass road-cut | — | Loads a different authored wall with different beds and structures |
| Hand lens magnification | Slider | 2–20 | 6 | × | Grain and fossil detail visible under the cursor |
| Wash the face | Toggle | On / Off | Off | — | Removes weathering film and talus so contacts read cleanly |
| Dating overlay | Toggle | On / Off | Off | — | Prints radiometric ages on the ash beds in millions of years |
| Fossil overlay | Toggle | On / Off | Off | — | Pins fossil symbols with names on the beds that contain them |
| Structure highlight | Multi-select | Bedding / Unconformity / Dike / Fault / None | None | — | Traces the chosen structures in colour across the face |
| Distractor cards | Stepper | 0–8 | 4 | count | How many events with no evidence in this wall are mixed into the deck |
| Snap to timeline | Toggle | On / Off | On | — | Whether cards lock to slots or can be placed freely |
| Hint level | Radio | None / Nudge / Guided | None | — | Nudge flags one misplaced card; Guided names the principle to apply |
| Submit explanation | Toggle | Draft / Submit | Draft | — | Locks the sequence and runs the two-part score |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The plain stack | Outcrop=Mojave wash bank; distractor cards=0; structure highlight=Bedding | Five flat beds and nothing cutting them. Which is oldest, and what one rule did you use? |
| S2 | The cut and the crack | Outcrop=Cajon Pass road-cut; structure highlight=Dike, Fault; distractor cards=2 | The dike passes through five beds. Where must it go on the timeline, and how do you know it is not the oldest thing here? |
| S3 | Missing time | Outcrop=Coast Range sea cliff; structure highlight=Unconformity; dating overlay=On | The ash below reads 95 Myr and the ash above reads 34 Myr. What happened in between, and where is the evidence for it? |
| S4 | Prove it | Outcrop=Sierra foothill quarry; distractor cards=8; hint level=None | Build the sequence with every card wired to evidence. Which cards did you refuse to place, and why? |

**Student activities.**
1. Drag the hand lens across all seven beds and record grain size and fossil content for each in a table before touching a single card.
2. Place a sample pin in the conglomerate and in the limestone. Record the depositional environment each pin returns and what that says about sea level.
3. Build the sequence by dragging cards onto the timeline rail, oldest at the bottom. Then wire every card to the feature that justifies it.
4. Set structure highlight to Unconformity and write one sentence explaining what the irregular surface means about time that is not represented by any rock.
5. Submit, read both scores, then change exactly one card position and resubmit. Record which score moved and by how much.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Order score | Live numeric | % | Fraction of card pairs in the correct relative order |
| Evidence score | Live numeric | % | Fraction of placed cards wired to a feature that genuinely supports them |
| Sequence chart | Data table | — | The student's timeline beside the true sequence, revealed only after Submit |
| Bed property log | Data table | mixed | Rock type, grain size, fossils and environment for every bed sampled |
| Unresolved features | Counter | count | Structures on the wall that no placed card accounts for |
| Distractors rejected | Pass-fail badge | — | Green when every unsupported card was left in the deck |
| Missing time estimate | Live numeric | Myr | Gap between ages above and below the unconformity, when dating overlay is on |

**What the student should realise.**
Students believe rock layers are simply a picture of the past, and that reading them is remembering which one is on top. Here the same face contains a tilt, an erosion surface, a dike and a fault, so ordering alone fails and the scoring only rewards claims tied to a visible feature. A gap in the rock turns out to be a large amount of time. The student should be able to say: *"The rock does not tell me the story, it gives me evidence, and the order I argue for has to be tied to something I can point at."*

### E3.4 · Combining fast and slow in one explanation

**Experiment name:** Grand Canyon: Two Clocks, One Gorge  
**Render mode:** 3D Scene  
**Simulation engine:** Procedural geology + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-2

**Theme & scene.**
The camera hangs above the Colorado River at river level, looking upstream between walls that climb 1,500 metres in stepped cliffs and slopes, each formation a different band of cream, red and grey. The river is a narrow jade thread with white water where side canyons meet it. Two clocks sit in the corners and they disagree on purpose: a slow clock top-left counting millions of years, and a fast clock top-right counting minutes and seconds, dark until an event fires. Monsoon cloud shadows sweep the rim. When a storm loads, the fast clock lights orange, the slow clock freezes, and a wall of brown water comes down a side canyon into the calm blue-green main stem. Control panel docks right; a running event ledger scrolls beneath it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Canyon block | Environment | 25 km of gorge on a 20 m grid, rim to river 1,500 m, vertical exaggeration 1× with the label shown | Yes: resize |
| 2 | Kaibab Limestone caprock | Structure | Top 90 m, pale cream, hard, forms the rim cliff and sheds large blocks | Yes: swap |
| 3 | Coconino Sandstone | Structure | 100 m, near-white, cross-bedded, sheer cliff former | No |
| 4 | Hermit Shale | Structure | 90 m, deep red, soft, weathers to a slope and undermines the cliff above it | No |
| 5 | Supai Group | Structure | 300 m, banded red sandstone and shale, alternating small cliffs and ledges | No |
| 6 | Redwall Limestone | Structure | 150 m, grey rock stained red from above, single vertical cliff | No |
| 7 | Bright Angel Shale | Structure | 90 m, green-grey, forms the broad Tonto Platform bench | No |
| 8 | Tapeats Sandstone and Vishnu Schist | Structure | 60 m brown sandstone over dark contorted schist at river level, separated by a major unconformity | No |
| 9 | Colorado River channel | Actor | Jade ribbon 80–120 m wide, discharge-driven width and speed; incises the bed each slow tick | Yes: drag |
| 10 | Side canyon tributaries | Actor | Six steep dry drainages notched into the walls; each has its own catchment area | Yes: place |
| 11 | Monsoon storm cell | Particle | Anvil cloud with a rain curtain, parked over a chosen tributary catchment | Yes: drag |
| 12 | Debris flow | Particle | Brown, boulder-loaded slurry running the tributary in real time; deposits a fan at the mouth | No |
| 13 | Debris fan and rapid | Structure | Cone of unsorted blocks pushing into the main channel; constricts it and generates white water | No |
| 14 | Rockfall block emitter | Particle | Releases 1–400 m³ blocks from an undermined cliff; blocks bounce, fragment and build a talus cone | No |
| 15 | Dual clock and event ledger | Instrument | Slow clock in Myr, fast clock in minutes; ledger logs every fast event with its model date and volume moved | No |
| 16 | Wall profile probe | Instrument | Draggable rim-to-river profile line returning cliff and slope segments and cumulative depth cut | Yes: drag |

**How it works — the model.**
The simulation runs two loops on one landscape. The slow loop advances at the chosen model rate and lowers the river bed by an incision rate that depends on discharge, sediment supply and the hardness of the unit currently at the bed, while regional uplift raises the whole block; the canyon deepens by the difference. The fast loop is event-driven and freezes the slow clock while it runs. A monsoon storm dumps rain on one tributary catchment; if rainfall intensity times catchment area exceeds the debris-flow threshold, a slurry runs out in real seconds and dumps a fan at the mouth. Cliff retreat is not continuous: soft shale is removed grain by grain in the slow loop until the overhanging hard unit loses support, and then it fails as a discrete rockfall in the fast loop. Every fast event writes its volume into the same ledger the slow loop writes to, so the two can be compared in identical units of cubic metres.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Slow clock rate | Dial | 100–200,000 | 20,000 | model years per real second | Speed of the incision and uplift loop only |
| Uplift rate | Slider | 0.0–1.5 | 0.3 | mm/yr | How fast the plateau rises against the river |
| River discharge | Slider | 200–8,000 | 900 | m³/s | Incision power and channel width |
| Caprock unit | Dropdown | Kaibab Limestone / Basalt flow / Soft sandstone / No caprock | Kaibab Limestone | — | Structural: swaps the rim-forming unit, changing cliff height and rockfall size |
| Monsoon storm frequency | Slider | 0–12 | 3 | storms per model century | How often the fast loop interrupts the slow loop |
| Storm intensity | Slider | 10–120 | 55 | mm/h | Whether a storm produces runoff only or a full debris flow |
| Fire a storm now | Toggle | Armed / Fire | Armed | — | Drops a storm on the tributary the student has selected |
| Rockfall trigger | Toggle | Automatic / Manual | Automatic | — | Whether undermined cliffs fail on their own or on command |
| Event pause | Toggle | On / Off | On | — | Freezes the slow clock whenever a fast event is running |
| Ledger units | Dropdown | m³ / truckloads / m of canyon depth | m³ | — | How the two loops' contributions are expressed side by side |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | River alone | Monsoon storm frequency=0; rockfall trigger=Manual; slow clock rate=100,000; discharge=900 | With no storms and no rockfalls, run to 5 Myr. How deep is the canyon, and how wide? Does it look like the real thing? |
| S2 | One afternoon | Monsoon storm frequency=0; storm intensity=95; fire a storm now=Fire | Fire a single storm on one tributary. In real minutes, how much rock moves and what appears in the main river? |
| S3 | Both clocks running | Monsoon storm frequency=6; storm intensity=70; slow clock rate=20,000; rockfall trigger=Automatic | Run to 5 Myr with everything on. Compare the total volume moved by the slow loop with the total from all fast events. |
| S4 | Soft rim | Caprock unit=No caprock; monsoon storm frequency=6 | Remove the hard caprock and re-run. What happens to the cliffs, and why does the canyon end up a different shape? |

**Student activities.**
1. Run S1 to 5 Myr and record canyon depth and rim-to-rim width. Drag the wall profile probe across and note whether the walls are stepped or smooth.
2. Fire a single storm in S2 with the fast clock visible. Record the duration in minutes and the volume of debris in cubic metres.
3. Run S3 and read the ledger every million model years. Record the running totals for slow incision and for fast events in the same units.
4. Set rockfall trigger to Manual, run until the Hermit Shale slope has been stripped back 20 m, then fire the rockfall. Record the block volume released.
5. Swap the caprock unit and re-run S3. Compare the two wall profiles you measured and state which parts of the shape came from which clock.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Model age | Live numeric | Myr | Slow clock, frozen during fast events |
| Event clock | Timer | min:s | Real elapsed time inside the current fast event |
| Canyon depth | Line graph | m vs Myr | Rim to river depth at the profile line |
| Volume ledger | Data table | m³ | Every entry tagged slow or fast, with model date and location |
| Slow versus fast share | Bar chart | % of total m³ | Running comparison of the two contributions |
| Wall profile | Line graph | m vs m | Rim-to-river cross-section showing cliff and slope segments |
| Rapids count | Counter | count | Debris fans currently constricting the main channel |
| Sediment leaving the reach | Live numeric | m³/yr | Material carried out of the canyon by the river |

**What the student should realise.**
Students believe a canyon is worn away steadily, like sandpaper, so it should have smooth sloping walls. Running the slow loop alone produces exactly that, and it looks wrong. The stepped cliffs, the talus, the side canyons and the rapids only appear when short violent events are allowed to punctuate the long quiet stretches. The student should be able to say: *"The slow process gave it the depth and the time, but the fast events gave it its shape, and I need both to explain what I see."*

### E3.5 · Spatial scale, from outcrop to continent

**Experiment name:** One Rock, Eight Zooms  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model + Procedural geology  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ESS2-2

**Theme & scene.**
The screen opens on a slab of pale, papery rock held in a gloved hand: the Monterey Formation, thin cream laminations, a coin resting on it for scale. A brass zoom ladder runs down the right edge with eight rungs from Hand sample to Continent. Click a rung and the camera pulls back through a smooth cross-dissolve, each level a different render: photographic outcrop, oblique hillside, canyon wall, geologic map, shaded-relief range, state map, continental plate map. One thing never leaves the screen. A scale bar in the lower left redraws its units at every level, from centimetres to thousands of kilometres, and the Monterey Formation stays highlighted in the same pale mustard colour wherever it appears. Palette is muted survey-report tones with a single saturated highlight.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Level 1 — hand sample | Structure | 12 cm slab, cream, sub-millimetre laminations, chalky matte; rotatable in the hand | Yes: drag |
| 2 | Level 2 — road-cut outcrop | Structure | 8 m of face near Santa Barbara, bedded pale mustard mudstone with chert ribs and a fracture set | No |
| 3 | Level 3 — hillside exposure | Structure | 120 m slope with the formation banding across it, chaparral cover in the gaps | No |
| 4 | Level 4 — sea-cliff panorama | Structure | 1.5 km of coast cliff, beds visibly folded into an open anticline | No |
| 5 | Level 5 — geologic map sheet | Overlay | 15 km quadrangle, formations as flat colour polygons with contact lines and strike-dip ticks | Yes: swap |
| 6 | Level 6 — Coast Ranges relief | Environment | 150 km shaded-relief terrain, formation belt traced as a long mustard stripe between fault lines | No |
| 7 | Level 7 — California state map | Overlay | 1,200 km, simplified geologic provinces, San Andreas system drawn as a heavy red line | No |
| 8 | Level 8 — continental plate map | Overlay | 6,000 km of North America and the eastern Pacific, plate boundaries and margin basins | No |
| 9 | Scale bar | Instrument | Redraws at every level with correct units and a numeric length; never absent, never wrong | No |
| 10 | Human-scale reference set | Actor | Coin (2.4 cm), hand (18 cm), person (1.6 m), car (4.5 m), football pitch (100 m), city block (200 m), town (5 km); the appropriate one auto-places, and any can be pinned | Yes: place |
| 11 | Formation tracer highlight | Overlay | Mustard wash locked to the Monterey Formation at every level, with a leader line at levels where it is only a few pixels wide | No |
| 12 | Second formation channel | Overlay | Sierra granodiorite in pink as a contrast unit, so the student can trace two different things | Yes: swap |
| 13 | Breadcrumb ladder | UI-Probe | Eight rungs labelled with their field-of-view width; current rung lit; supports jumping and stepping | Yes: drag |
| 14 | Magnification odometer | UI-Probe | Reads the field-of-view width and the factor relative to Level 1, e.g. "×50,000" | No |
| 15 | Cross-section line | Instrument | Draggable line on any map level that opens a vertical slice showing the formation at depth | Yes: drag |
| 16 | Feature visibility log | UI-Probe | Auto-fills a table of which features (laminations, beds, folds, faults, provinces) are resolvable at the current level | No |

**How it works — the model.**
Each level is an authored, georeferenced dataset rather than a procedurally generated zoom, because real geological detail does not survive naive interpolation. Levels are stitched by matching a real ground position, so the coin on the hand sample sits inside the road-cut, the road-cut sits inside the hillside, and so on all the way to the continent. The tracer works from a unit identifier attached to every polygon, bed and slab in the stack, so the same formation can be highlighted regardless of how it is drawn at that level. Two rules are enforced. First, the scale bar is computed from the actual field of view at every rung, never hand-authored, so it can never lie. Second, a feature only appears in the visibility log if its true size is at least four screen pixels at that level, which is what makes laminations vanish by Level 4 and the plate boundary appear only at Level 8.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Zoom level | Timeline scrubber | Level 1–Level 8 | Level 2 | — | Structural: swaps the entire rendered dataset and its object set |
| Traced formation | Multi-select | Monterey Fm / Sierra granodiorite / Great Valley sediments / Franciscan complex / None | Monterey Fm | — | Which units carry the highlight wash through all eight levels |
| Scale bar units | Dropdown | Auto / cm / m / km | Auto | — | Forces the bar into one unit so the student sees the numbers grow |
| Reference object | Dropdown | Auto / Coin / Person / Car / Football pitch / City block / Town | Auto | — | Which familiar object is placed in the scene for comparison |
| Map layers | Multi-select | Topography / Geology / Faults / Rivers / Roads | Topography, Geology | — | Which overlays draw on map-type levels |
| Overlay transparency | Slider | 0–100 | 60 | % | How strongly geology colours sit over the relief |
| Vertical exaggeration | Slider | 1–8 | 2 | × | Relief on 3D levels and on the cross-section |
| Cross-section depth | Slider | 0.1–20 | 3 | km | How deep the slice cuts beneath the map surface |
| Map projection | Dropdown | Web Mercator / Albers equal-area / Orthographic | Albers equal-area | — | Shape and area distortion at Levels 7 and 8 |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Follow one unit up the ladder | Traced formation=Monterey Fm; zoom level=Level 1 then step to Level 8 | At which level does the formation stop looking like layers and start looking like a stripe, and does it stop being layers? |
| S2 | Where did the laminations go | Zoom level=Level 4; traced formation=Monterey Fm; reference object=Person | The laminations were 1 mm apart at Level 1. Why can you not see them here, and are they still there? |
| S3 | Two units, two shapes | Traced formation=Monterey Fm, Sierra granodiorite; zoom level=Level 6 | One highlight is a long thin stripe, the other a broad blob. What does each shape tell you about how the rock formed? |
| S4 | The boundary only big maps show | Zoom level=Level 8; map layers=Geology, Faults; map projection=Orthographic | What single feature is visible here that was invisible at every smaller level, and how wide is it in kilometres? |

**Student activities.**
1. Start at Level 1 and step one rung at a time to Level 8. Record the scale bar value at every level in a table of eight rows.
2. Pin the person reference at Level 3 and the town reference at Level 6. Record the field-of-view width at each and calculate how many times bigger Level 6 is.
3. Set traced formation to Monterey Fm and note the level at which the highlight becomes too thin to see without the leader line.
4. Drag the cross-section line across Level 5 and record how deep the formation goes and what lies beneath it.
5. Switch map projection from Albers to Web Mercator at Level 8 and describe, in one sentence, what changed about the shape of the northern plates.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Field of view | Live numeric | cm, m or km | Real ground width currently on screen |
| Magnification factor | Live numeric | × | Ratio of current field of view to Level 1 |
| Scale ladder table | Data table | mixed | Level, field of view, scale-bar unit and reference object, one row per rung |
| Feature visibility log | Data table | — | Which features are resolvable at each level, auto-filled as the student climbs |
| Formation extent | Live numeric | km² | Mapped area of the traced unit at map levels |
| Cross-section profile | Line graph | km depth vs km distance | Formation thickness and depth along the drawn line |
| Projection distortion | Heat map | % area error | Shown only at Levels 7 and 8, comparing the chosen projection to equal-area |

**What the student should realise.**
Students believe zooming out shows a different, simpler rock, and that a stripe on a geologic map is a line rather than a body of rock they could stand on. Tracing one formation through eight levels with an honest scale bar at each makes both ideas untenable: the mustard stripe on the state map is the same slab that fitted in a hand. The student should be able to say: *"Changing scale changes what I can see, not what is there, and I have to say which scale I am talking about."*

## E4 · Evidence for plate motion · MS-ESS2-3

### E4.1 · Matching coastlines and rock types

**Experiment name:** The Pangaea Jigsaw Bench  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Rigid-body  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-3

**Theme & scene.**
A dark laboratory bench holds seven continent tiles cut like jigsaw pieces, each about the thickness of a slate coaster, drifting slightly as if on water. They are rendered in neutral grey-green so no political borders distract, and each carries faint printed geology: age-banded rock provinces, mountain-belt ribbons, coal-field patches, and small arrows showing which way ancient glaciers scratched the rock. Two outlines glow on every tile: a white line at the present shoreline and a cyan line at the edge of the continental shelf, further out. Above the bench floats a translucent globe showing where the pieces currently sit today. Grab a tile and it lifts with a soft shadow. The fit meter is a horizontal bar along the top that fills green as gaps close. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | South America tile | Actor | Slate-thick plate, grey-green, 1,800 px long axis; drags and rotates with inertia and a soft snap | Yes: drag |
| 2 | Africa tile | Actor | Same construction, largest piece, held fixed by default as the reference | Yes: drag |
| 3 | North America tile | Actor | Same construction; carries the Appalachian belt ribbon along its eastern edge | Yes: drag |
| 4 | Europe and Greenland tiles | Actor | Two pieces; Europe carries the Caledonian belt, Greenland links the two | Yes: drag |
| 5 | India, Madagascar, Antarctica, Australia tiles | Actor | Four southern pieces, each with shield and glacial-striation printing | Yes: drag |
| 6 | Present shoreline outline | Overlay | 2 px white line at 0 m, the edge students think they should match | No |
| 7 | Continental shelf outline | Overlay | 3 px cyan line at the 200 m and 2,000 m isobaths, selectable; the edge that actually fits | Yes: swap |
| 8 | Rock province patches | Overlay | Flat colour polygons keyed by age: >2.5 Ga dark plum, 2.5–1.0 Ga teal, 1.0–0.5 Ga amber, <0.5 Ga pale grey | No |
| 9 | Mountain-belt ribbons | Overlay | Thick corded bands along old fold belts (Appalachian, Caledonian, Cape, Sierra do Mar) that visibly continue across a good join | No |
| 10 | Glacial striation arrows | Overlay | Short barbed arrows showing ice-flow direction on 300 Ma glaciated surfaces | No |
| 11 | Coal and desert-sandstone patches | Overlay | Black hatch for coal measures, orange stipple for ancient dune sandstone, both climate indicators | No |
| 12 | Rotation handle | UI-Probe | Ring around the selected tile with a degree readout; drag to rotate about the tile centre | Yes: drag |
| 13 | Gap and overlap detector | Instrument | Computes area of empty gap and area of double-covered overlap along every join, per pair | No |
| 14 | Misfit heat map | Overlay | Red wash where tiles overlap, blue wash where a gap remains; updates live while dragging | No |
| 15 | Latitude and longitude grid | Overlay | 15° graticule that travels with each tile so palaeolatitude can be read | No |
| 16 | Modern-position ghost | Overlay | Faint white outlines of where each continent sits today, held fixed on the bench | No |

**How it works — the model.**
Every tile is a rigid polygon carrying three independent data layers: geometric outlines at three sea depths, rock-province polygons with numeric ages, and belt and climate-indicator features. Dragging applies a two-dimensional translation and rotation only, with no scaling, so the student cannot cheat a fit by shrinking a continent. The fit score is computed from three separate terms, reported separately and never merged into one number: outline misfit as gap plus overlap area in square kilometres along each join; province continuity as the fraction of rock-province boundary length that meets a boundary of the same age band across the join; and indicator continuity as the fraction of mountain-belt ribbons and striation arrows that continue without a kink. This separation is the argument. A student can achieve a decent outline fit and still see the province score stay low, which forces the realisation that shape alone is weak evidence and matching rock does the real work.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Matching edge | Dropdown | Present shoreline / Shelf edge 200 m / Shelf edge 2000 m | Present shoreline | — | Structural: which outline the tiles are cut to and scored against |
| Continents on the bench | Multi-select | S America / Africa / N America / Europe / Greenland / India / Madagascar / Antarctica / Australia | S America, Africa | — | Structural: which tiles exist in the scene |
| Rotation | Dial | −180 to 180 | 0 | ° | Rotates the selected tile about its own centre |
| Rock province overlay | Toggle | On / Off | Off | — | Prints age-banded geology on every tile |
| Mountain-belt overlay | Toggle | On / Off | Off | — | Prints fold-belt ribbons across the tiles |
| Climate indicator overlay | Multi-select | Glacial striations / Coal measures / Desert sandstone / None | None | — | Prints ancient climate evidence on the tiles |
| Snap tolerance | Slider | 0–300 | 80 | km | How close a join must be before the tiles lock together |
| Misfit heat map | Toggle | On / Off | On | — | Shows gap and overlap wash along the joins |
| Modern-position ghost | Toggle | On / Off | On | — | Shows where the continents sit today for comparison |
| Auto-fit check | Toggle | Draft / Score | Draft | — | Locks the arrangement and prints all three fit scores |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The famous pair | Continents on the bench=S America, Africa; matching edge=Present shoreline; rock province overlay=Off | Fit the two by shape alone. What is the largest gap left, in kilometres, and where is it? |
| S2 | Fit the shelf instead | Continents on the bench=S America, Africa; matching edge=Shelf edge 2000 m | Refit using the shelf edge. Does the outline misfit go up or down, and by how much? |
| S3 | Check the rocks | Continents on the bench=S America, Africa; rock province overlay=On; mountain-belt overlay=On | Without moving anything, do the 2 billion-year-old provinces line up across your join? What would a wrong fit look like? |
| S4 | Build the whole supercontinent | Continents on the bench=all nine; matching edge=Shelf edge 200 m; climate indicator overlay=Glacial striations | Assemble every tile. Where do all the glacial arrows point once the pieces are joined, and what does that say about where this land sat? |

**Student activities.**
1. Drag South America against Africa using shorelines only. Record the outline misfit in square kilometres from the fit meter.
2. Switch the matching edge to the 2,000 m shelf edge, refit, and record the new misfit. State which edge fits better and by what factor.
3. Turn on the rock province overlay and record the province continuity score. Then deliberately slide one tile 500 km north and record how each of the three scores responds.
4. Assemble all nine tiles into one mass. Record the total number of joins you made and the three scores for the finished assembly.
5. Turn on glacial striations and mark, on your own sketch, where the centre of the ancient ice sheet must have been.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Outline misfit | Live numeric | km² | Gap area plus overlap area summed across all joins |
| Province continuity | Live numeric | % | Fraction of rock-province boundary length matching the same age band across joins |
| Indicator continuity | Live numeric | % | Fraction of mountain belts and striation arrows continuing without a kink |
| Join list | Data table | mixed | Every pair joined, with its individual misfit and continuity figures |
| Misfit map | Heat map | km of separation | Live red and blue wash along every join |
| Largest remaining gap | Live numeric | km | Widest single opening in the current arrangement, with its location named |
| Assembly badge | Pass-fail badge | — | Green when all three scores clear the thresholds at once |

**What the student should realise.**
Students believe the coastline match is a coincidence, and that if it were real the shorelines would fit perfectly. Here the shoreline fit is visibly poor and the shelf-edge fit is far better, because the true edge of a continent is underwater. More decisively, ancient rock provinces and mountain belts run straight across the join and stop dead at the modern sea. The student should be able to say: *"It is not the coastlines that match, it is the rocks, and a coincidence of shape would not carry the geology across with it."*

### E4.2 · Matching fossil distributions

**Experiment name:** Three Fossils That Cannot Swim  
**Render mode:** 2D Canvas  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 12–18 min  
**NGSS anchor:** MS-ESS2-3

**Theme & scene.**
A field-museum table, dark green baize, holding a flat world map printed on linen. Scattered across the southern continents are small pin-flags, each topped by a painted specimen card: a slender crocodile-shaped reptile, a tongue-shaped fern leaf, a squat barrel-bodied reptile. Pick a card up and it enlarges into a specimen plate with a photograph, a size bar, and three lines of habitat data. A brass measuring tape lies on the table for drawing distances across ocean. A large lever on the right is labelled MODERN at one end and 250 MILLION YEARS AGO at the other; pulling it slides the continents smoothly together while the pins ride along with the land they are pinned to. Warm lamp light, long shadows, deliberately archival.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Linen world map | Environment | Flat equal-area map on cloth texture, land in pale khaki, ocean in deep slate, no country borders | No |
| 2 | Continent tiles | Actor | Nine draggable land masses that carry every pin, overlay and grid line stuck to them | Yes: drag |
| 3 | Mesosaurus pin set | Overlay | 11 pins in eastern South America and southwest Africa; 45 cm freshwater reptile, thin snout, paddle limbs | Yes: place |
| 4 | Glossopteris pin set | Overlay | 34 pins across South America, Africa, India, Antarctica, Australia; tongue-shaped seed-fern leaf, heavy seeds | Yes: place |
| 5 | Lystrosaurus pin set | Overlay | 19 pins in Africa, India, Antarctica; barrel-bodied land reptile with tusks, 1 m long | Yes: place |
| 6 | Cynognathus pin set | Overlay | 8 pins in South America and Africa; dog-toothed land reptile, contrast species | Yes: place |
| 7 | Specimen cards | UI-Probe | Enlargeable plates giving length, mass, habitat (fresh water / land / land plant), dispersal ability, age range in Ma | Yes: drag |
| 8 | Measuring tape | Instrument | Drag from pin to pin; returns great-circle distance in km, and states how much of the path is ocean | Yes: drag |
| 9 | Reconstruction lever | UI-Probe | Vertical slider between Modern and 250 Ma; drives a smooth interpolated continental drift animation | Yes: drag |
| 10 | Palaeolatitude bands | Overlay | Grey graticule locked to the reconstructed pole, showing where the equator and 60°S sat at the chosen age | No |
| 11 | Climate belt overlay | Overlay | Wash of tropical, temperate, and ice-covered zones for the chosen age, drawn behind the tiles | No |
| 12 | Dispersal test tool | Instrument | Pick a mechanism (swim / raft / fly / land bridge) and it draws that organism's realistic maximum range as a ring around each pin | Yes: place |
| 13 | Ocean gap mask | Field | Computes the shortest open-water crossing between any two pin clusters of the same species | No |
| 14 | Cluster scorer | Instrument | Measures how tightly each species' pins group in the current arrangement, as a mean nearest-neighbour distance | No |
| 15 | Claim card bench | UI-Probe | Four claim cards ("They swam", "They rafted", "A land bridge existed", "The land was joined") with slots for evidence pins | Yes: connect |
| 16 | Evidence wire | UI-Probe | Drag from a claim card to any pin, tape measurement or specimen card to attach it as evidence | Yes: connect |

**How it works — the model.**
Fossil occurrences are a fixed authored dataset of real localities with real ages, attached to continent tiles rather than to the map, so moving a tile moves its fossils with it. The reconstruction lever interpolates each tile between its present position and a published 250 Ma position, which lets the same pins be viewed in two arrangements without any new data being introduced. Three quantities are computed continuously. The ocean gap is the shortest open-water distance between clusters of the same species. The dispersal ring is that species' plausible maximum range from its habitat and body data, held at realistic values (a freshwater reptile does not cross salt water, a heavy seed does not blow 4,000 km). The cluster score is the mean nearest-neighbour distance among a species' pins. The claim bench then compares each claim against the numbers actually attached to it, so a claim survives only if its own evidence supports it, never because it sounds sensible.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Arrangement | Timeline scrubber | Modern to 250 Ma | Modern | Ma | Slides continents between today's positions and the reconstruction |
| Species shown | Multi-select | Mesosaurus / Glossopteris / Lystrosaurus / Cynognathus / All | Mesosaurus | — | Structural: which pin sets exist on the map |
| Time slice | Dropdown | 299 Ma / 275 Ma / 250 Ma / 200 Ma | 250 Ma | — | Filters pins to fossils of that age and sets the reconstruction target |
| Dispersal mechanism | Dropdown | Swim / Raft on debris / Wind-blown seed / Land bridge / None | None | — | Which plausibility ring is drawn around each pin |
| Climate belt overlay | Toggle | On / Off | Off | — | Shows tropical, temperate and glaciated zones for the chosen age |
| Palaeolatitude grid | Toggle | On / Off | Off | — | Draws the reconstructed equator and latitude lines |
| Tape units | Dropdown | km / miles / days of drifting | km | — | Units the measuring tape reports, including a raft-speed conversion |
| Cluster scoring | Toggle | On / Off | On | — | Displays the mean nearest-neighbour distance per species |
| Continent lock | Toggle | Free / Locked | Locked | — | Structural: whether tiles can be dragged by hand or only by the lever |
| Submit claim | Toggle | Draft / Submit | Draft | — | Scores every claim card against the evidence wired to it |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The freshwater problem | Species shown=Mesosaurus; arrangement=Modern; dispersal mechanism=Swim | Measure the ocean between the two Mesosaurus clusters. Can an animal that lives in fresh water cross it? |
| S2 | Close the ocean | Species shown=Mesosaurus; arrangement=250 Ma | Pull the lever to 250 Ma. What happens to the ocean gap and to the cluster score? |
| S3 | Five continents, one leaf | Species shown=Glossopteris; arrangement=250 Ma; climate belt overlay=On | Glossopteris appears on five separate continents today. In the reconstruction, what single climate belt do all its pins fall into? |
| S4 | Test every excuse | Species shown=All; arrangement=Modern; dispersal mechanism=Raft on debris | Try to explain the modern distribution with rafting. Which species defeats the idea first, and what number proves it? |

**Student activities.**
1. Drag the measuring tape between the closest Mesosaurus pins in South America and Africa. Record the total distance and the ocean-only portion.
2. Read the Mesosaurus specimen card and record its habitat and length. Set dispersal mechanism to Swim and record whether the ring reaches the other cluster.
3. Pull the reconstruction lever to 250 Ma and record the ocean gap and cluster score for all four species, before and after, in one table.
4. Turn on the climate belt overlay in S3 and record which belt every Glossopteris pin falls in once the continents are joined.
5. Wire evidence to the claim card you believe, submit, and record which of your wires the scorer accepted and which it rejected.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Ocean gap | Live numeric | km | Shortest open-water crossing between same-species clusters |
| Cluster score | Live numeric | km | Mean nearest-neighbour distance per species, before and after reconstruction |
| Dispersal ring reach | Live numeric | km | Maximum plausible range for the chosen mechanism and species |
| Distance log | Data table | km | Every tape measurement taken, tagged with species and arrangement |
| Species by continent | Bar chart | count | Fossil localities per continent, per species |
| Claim scorecard | Pass-fail badge | — | Green only when a claim's attached evidence actually supports it |
| Palaeolatitude of pins | Data table | ° | Reconstructed latitude of each locality at the chosen time slice |

**What the student should realise.**
Students believe animals must simply have swum, rafted or crossed a land bridge, and treat the fossil map as a puzzle about travel. Measuring the crossing against what each organism could physically do kills that: a freshwater reptile faces 4,000 km of salt water and a heavy fern seed faces the same. Joining the continents drops every gap to zero at once, for four unrelated species. The student should be able to say: *"The fossils are not spread across oceans, they are spread across one piece of land that has since been torn apart."*

### E4.3 · Seafloor age and magnetic striping

**Experiment name:** Towing the Magnetometer Across the Ridge  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Field/vector + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-3

**Theme & scene.**
Split screen. The upper two-thirds is an underwater view of the Juan de Fuca Ridge off northern California: a dark basalt seafloor of pillow lavas and abyssal hills, a narrow axial valley glowing faintly with hot water plumes, sediment thickening into pale drifts on either side as the eye travels outward. A small white survey ship crosses the surface far above, trailing a torpedo-shaped magnetometer fish on a long catenary cable, both drawn to scale so the cable's sag is obvious. The lower third is a paper strip chart scrolling right to left as the ship moves, pen twitching. When the age overlay is on, the seafloor is repainted in a rainbow ramp from red at the axis to deep blue at the margins, and the magnetic stripes appear as alternating dark and light bands running parallel to the ridge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Ridge bathymetry | Environment | 600 km of seafloor across the axis, dark basalt, abyssal hills 200 m high, vertical exaggeration 10× labelled | No |
| 2 | Axial valley and vents | Structure | 6 km-wide rift at the crest with a 1 km graben, black smoker chimneys and shimmering hot-water plumes | No |
| 3 | Pillow lava field | Structure | Instanced bulbous 1–2 m lobes with glassy crusts, densest within 5 km of the axis | No |
| 4 | Sediment blanket | Structure | Pale grey drape thickening from 0 m at the axis to 400 m at 300 km out; visible in the cutaway front wall | No |
| 5 | Magnetised crust bands | Field | Alternating blocks of normally and reversely magnetised basalt, widths set by spreading rate and the reversal timescale | No |
| 6 | Survey ship | Actor | 60 m white research vessel with a stern A-frame; follows the drawn track at the set speed | Yes: drag |
| 7 | Towed magnetometer fish | Instrument | 1.4 m yellow torpedo on a 200–600 m cable with realistic catenary sag; records total field in nanotesla | Yes: drag |
| 8 | Survey track line | UI-Probe | Student-drawn polyline on the map inset; the ship follows it exactly | Yes: place |
| 9 | Strip chart recorder | Instrument | Scrolling paper trace of magnetic anomaly against distance, pen ink, with a zero line | No |
| 10 | Seafloor age raster | Overlay | Rainbow age ramp, red 0 Ma to blue 180 Ma, with 10 Myr contour lines | No |
| 11 | Magnetic stripe overlay | Overlay | Black and white bands parallel to the axis, mirrored either side | No |
| 12 | Sediment thickness probe | Instrument | Placeable core drill returning sediment thickness in metres and the age of the deepest layer | Yes: place |
| 13 | Transform faults | Structure | Two ridge-offsetting fracture zones cutting the stripes at right angles, with visible scarps | No |
| 14 | Spreading arrows | Overlay | Paired arrows either side of the axis, length proportional to the half-spreading rate | No |
| 15 | Reversal timescale ruler | Overlay | Vertical barcode of known polarity reversals in Ma, used to convert stripe widths to ages | Yes: drag |
| 16 | Age versus distance plotter | Instrument | Builds a scatter of crustal age against distance from the axis, one point per core or stripe identified | No |

**How it works — the model.**
New basalt is created at the axis and carried outward at the half-spreading rate, so crustal age is simply distance from the axis divided by that rate. As each new strip of basalt cools through its Curie temperature it locks in the direction of Earth's magnetic field at that moment, and the field flips polarity on the real, irregular reversal timescale that the simulation reads from a dataset. Two strips of equal age therefore exist on both sides, with the same polarity and the same width, which is what makes the pattern symmetric. The magnetometer measures the total field, which is the steady background plus the small contribution of the crust beneath it, so the pen swings positive over normally magnetised blocks and negative over reversed ones. Signal strength falls with the square of the distance from the source, so towing the fish deeper sharpens the stripes. Sediment thickness accumulates at a constant rate on crust of a given age, which gives a completely independent check on the same ages.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Ridge | Dropdown | Juan de Fuca / Mid-Atlantic / East Pacific Rise / Gorda | Juan de Fuca | — | Structural: loads a different bathymetry, spreading rate and stripe pattern |
| Survey track | Drag-handle | Draw a polyline anywhere on the map inset | Perpendicular across the axis | — | Structural: the path the ship sails and therefore what the pen records |
| Ship speed | Slider | 2–14 | 8 | knots | Survey duration and along-track sampling density |
| Tow cable length | Slider | 100–800 | 300 | m | Fish depth; deeper tows resolve narrower stripes |
| Half-spreading rate | Slider | 5–90 | 29 | mm/yr | Stripe width and how fast age increases away from the axis |
| Overlays | Multi-select | Seafloor age / Magnetic stripes / Sediment thickness / Spreading arrows / None | None | — | Which data layers are painted on the seafloor |
| Core drill | Drag-handle | Place up to 8 cores anywhere on the seafloor | — | — | Structural: adds sediment-thickness and basement-age sample points |
| Chart gain | Slider | 100–2,000 | 600 | nT full scale | Vertical sensitivity of the strip chart |
| Reversal ruler | Toggle | On / Off | Off | — | Shows the known polarity barcode for matching against the trace |
| Plot mode | Dropdown | Anomaly vs distance / Age vs distance / Sediment vs age | Anomaly vs distance | — | What the lower panel graphs |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Straight across | Ridge=Juan de Fuca; survey track=Perpendicular across the axis; overlays=None; tow cable length=300 | Sail the line with all overlays off. Describe the pattern the pen draws either side of the axis. |
| S2 | Along the ridge instead | Ridge=Juan de Fuca; survey track=Parallel to the axis 20 km east | Sail parallel to the ridge. Why does the pen go almost flat, and what does that tell you about the shape of the stripes? |
| S3 | Fast versus slow spreading | Ridge=East Pacific Rise; half-spreading rate=75 then 12 | Same reversal history, two spreading rates. What changes about the stripe widths, and what does not change? |
| S4 | Two clocks agree | Overlays=Seafloor age, Sediment thickness; core drill=6 cores at 20, 60, 120, 180, 240, 300 km | Do the sediment thicknesses agree with the ages you read from the stripes? Which core disagreed most, and by how much? |

**Student activities.**
1. Draw a survey track straight across the axis and run it. Record the distance from the axis of the first four positive peaks on each side.
2. Compare your two lists and state, in one sentence, what the relationship between the east side and the west side is.
3. Set half-spreading rate to 12 mm/yr, re-sail the same track, and record the new peak positions. Calculate the age of the fourth peak on each run.
4. Place six core drills at increasing distances from the axis and record sediment thickness and basement age for each.
5. Switch plot mode to Age vs distance, fit a straight line through your core points by eye, and read the spreading rate off its slope. Compare it with the control panel value.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Magnetic anomaly trace | Line graph | nT vs km | Live strip-chart record along the survey track |
| Peak position table | Data table | km | Distance of each anomaly peak from the axis, east and west, with polarity |
| Symmetry check | Pass-fail badge | — | Green when east and west peak distances match within the survey tolerance |
| Crustal age | Live numeric | Ma | Age beneath the ship, from distance divided by half-spreading rate |
| Age versus distance | Line graph | Ma vs km | Scatter of cores and identified stripes; slope gives the spreading rate |
| Sediment thickness | Live numeric | m | Reading at each placed core, with the age of the deepest sediment |
| Survey log | Data table | mixed | Track, ship speed, tow depth, every peak and core; exportable |

**What the student should realise.**
Students believe the ocean floor is ancient, fixed rock, and that magnetic stripes are a curiosity with no bearing on moving continents. Recording the pattern themselves makes the symmetry impossible to ignore: identical stripes at identical distances on both sides, ages rising outward, sediment thickening in step. Nothing can produce a mirror image about a line except something being made at that line and moved away. The student should be able to say: *"The seafloor is a conveyor with a date stamp, and the youngest rock is at the ridge because that is where it is being made."*

### E4.4 · Analyzing plate motion data

**Experiment name:** Millimetres a Year, Kilometres a Million  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-3

**Theme & scene.**
A geodesy control room, dark navy panels and pale data ink. The left three-quarters is a map of California from Cape Mendocino to the Salton Sea, with the San Andreas, Hayward, Garlock and San Jacinto faults drawn as thin red traces. Scattered across it are forty-two GPS station markers, small white triangles on tripods, each labelled with a four-letter code. From every marker springs a velocity arrow, and the arrows do something startling as soon as the eye adjusts: on one side of the San Andreas they all point one way, on the other side they all point another. The right quarter holds a station table, a unit converter with three linked readouts, and a time-series panel whose traces climb steadily then jump at an earthquake. A scale key states what arrow length equals what speed.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | California base map | Environment | Albers equal-area, 1,200 km tall, muted relief shading, coastline in bone white, no city clutter beyond six labels | No |
| 2 | Fault trace layer | Overlay | San Andreas, Hayward, Calaveras, Garlock, San Jacinto as 2 px red lines with named segments | No |
| 3 | GPS station markers | Instrument | 42 white triangles on tripod icons with four-letter codes (CAND, MONB, LAND, POTR, HOLC and others); click to open a station card | Yes: place |
| 4 | Velocity vector arrows | Overlay | One per station, length proportional to speed, colour by plate; scale key updates with the vector scale slider | No |
| 5 | Reference-frame selector puck | UI-Probe | Physical-looking dial showing which plate is being held still; rotating it re-computes every arrow live | Yes: drag |
| 6 | Station data table | UI-Probe | Sortable rows: code, latitude, longitude, east and north velocity, speed, uncertainty, plate | Yes: swap |
| 7 | Unit converter panel | Instrument | Three linked fields showing the same speed in mm/yr, cm/century and km/Myr; changing any one updates the others | Yes: swap |
| 8 | Position time series | Overlay | Per-station plot of east position against year from 1994 to 2026, a steady ramp with a step at the 2004 Parkfield event | No |
| 9 | Baseline pair tool | Instrument | Drop two pins on two stations; returns separation, closing or opening rate, and time to a chosen separation | Yes: place |
| 10 | Cross-fault profile line | Instrument | Draggable line across a fault; plots fault-parallel velocity against distance, revealing the strain gradient | Yes: drag |
| 11 | Strain-rate heat map | Overlay | Warm wash where neighbouring stations move differently, brightest in a 30 km band along the locked San Andreas | No |
| 12 | Uncertainty ellipses | Overlay | Small ellipses at each arrow tip, 95 % confidence, typically 0.5–1.5 mm/yr | No |
| 13 | Extrapolation ghost | Overlay | Faint future positions of selected stations projected forward, with a slider-driven horizon | No |
| 14 | Earthquake offset markers | Overlay | Vertical dashed lines on the time series at recorded events, with the co-seismic step in mm annotated | No |
| 15 | Outlier flag | Instrument | Marks stations whose motion is dominated by local effects such as groundwater pumping or landsliding | Yes: swap |
| 16 | Calculation worksheet | UI-Probe | Three-row worked panel the student fills: rate, time span, product, with units checked on entry | Yes: swap |

**How it works — the model.**
The dashboard runs on a realistic GPS velocity field for the western United States: each station carries an east and north velocity in millimetres per year with a stated uncertainty, derived from thirty years of daily position solutions. Velocity is a relative quantity, so the reference frame is a real control rather than a cosmetic one; selecting a frame subtracts that plate's motion from every station, which is why the same station can read 48 mm/yr in one frame and 3 mm/yr in another without any data changing. Unit conversion is exact and chained: 1 mm/yr equals 10 cm per century equals 1 km per million years. The profile tool interpolates fault-parallel velocity along the drawn line, producing the characteristic S-shaped ramp of a locked fault: motion is smooth and gradual across a wide zone even though the fault itself is stuck. That is the one thing the model must not hide, because the misconception is that a plate boundary is a single crack that slides steadily.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reference frame | Dropdown | North America fixed / Pacific fixed / Stable interior / No frame (absolute) | North America fixed | — | Which plate is held still; recomputes every arrow and table row |
| Stations shown | Multi-select | All / Pacific side / North America side / Named subset of 8 / Single station | All | — | Structural: which markers, arrows and table rows exist |
| Velocity units | Dropdown | mm/yr / cm/century / km/Myr | mm/yr | — | Units used in the table, the arrows' key and the converter |
| Vector scale | Slider | 1–40 | 12 | mm/yr per cm on screen | Arrow length; makes small differences readable |
| Time window | Slider | 1994–2026 | 1994–2026 | year range | Which span the velocities are fitted over; short windows are noisier |
| Baseline pair | Drag-handle | Place two pins on any two stations | CAND and MONB | — | Structural: defines the pair whose separation is tracked |
| Cross-fault profile | Drag-handle | Draw a line 20–200 km long across any fault | Across San Andreas at Parkfield | — | Structural: the transect the velocity profile is computed along |
| Extrapolation horizon | Slider | 0–20 | 0 | Myr | How far forward the ghost positions are projected |
| Uncertainty ellipses | Toggle | On / Off | On | — | Shows whether a difference between two stations is real |
| Outlier filter | Toggle | On / Off | Off | — | Hides stations flagged as moving for local, non-tectonic reasons |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Read the arrows | Reference frame=North America fixed; stations shown=All; velocity units=mm/yr; vector scale=12 | Which stations move fastest, and what line separates the fast group from the slow group? |
| S2 | Change what stands still | Reference frame=Pacific fixed; stations shown=All | The same stations now point the other way. What actually changed, the Earth or the frame? |
| S3 | Three ways to say one number | Stations shown=Single station (CAND); velocity units=mm/yr then cm/century then km/Myr | Write CAND's speed in all three units. Which one makes plate motion sound fast? |
| S4 | Los Angeles goes north | Baseline pair=LAND and MONB; extrapolation horizon=20; reference frame=North America fixed | At today's rate, how long until the two stations are side by side, and what does that assume? |

**Student activities.**
1. Set the reference frame to North America fixed and record the speed and direction of six stations, three on each side of the San Andreas.
2. Switch to Pacific fixed and record the same six stations again. State in one sentence what changed and what did not.
3. Take one station's speed in mm/yr and convert it in the worksheet to cm/century and km/Myr. Check your three numbers against the converter panel.
4. Drag the cross-fault profile line across the San Andreas at Parkfield and record the velocity at 100 km either side and at the fault itself. Describe the shape of the graph.
5. Place a baseline pair on two stations 500 km apart, read the closing rate, and calculate how many million years until the separation is zero.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Station velocity | Live numeric | mm/yr, cm/century or km/Myr | East, north and total speed with uncertainty, for the selected station |
| Velocity field | Vector overlay | mm/yr | All arrows on the map with a live scale key |
| Station table | Data table | mixed | Every station's coordinates, velocities and plate assignment; exportable CSV |
| Position time series | Line graph | mm vs year | Daily positions with the fitted slope and any earthquake step marked |
| Cross-fault velocity profile | Line graph | mm/yr vs km | Fault-parallel speed against distance across the transect |
| Baseline separation | Live numeric | km and mm/yr | Current distance between the pair and the rate it is changing |
| Time to contact | Live numeric | Myr | Separation divided by closing rate, for the chosen pair |
| Unit conversion check | Pass-fail badge | — | Green when the student's three worksheet entries are consistent |

**What the student should realise.**
Students believe plates either sit still or move too slowly to matter, because 35 mm a year sounds like nothing. Converting that same measurement into 3.5 cm per century and 35 km per million years, and then watching the extrapolation ghost carry Los Angeles past San Francisco, changes the size of the number without changing the measurement. The student should be able to say: *"The rate is small because we measure it per year, and the Earth does not work in years."*

### E4.5 · Reconstructing a simplified history

**Experiment name:** Rewind the Planet: 200 Million Years Back  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Procedural geology  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS2-3

**Theme & scene.**
A slowly turning globe hangs in a dark room, oceans in charcoal, continents in bone, plate boundaries picked out in thin gold. Beneath it runs a heavy brass timeline from 0 to 200 million years ago with detented stops every 10 Myr. Each plate carries a small pull-handle showing its assigned velocity in millimetres per year, in the student's own handwriting font, taken straight from the previous experiment. Pull the timeline back and the globe unwinds: the Atlantic narrows and closes, India retreats south toward Antarctica, the Pacific widens, and the seafloor age map un-paints itself from the ridges outward so that young crust disappears first. A ghost of a published reconstruction sits behind the student's version as a faint white outline. A fit meter and a residual map sit bottom right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Globe | Environment | Sphere r=1 unit, charcoal ocean, bone continents, subtle specular highlight; free-rotating with inertia | Yes: drag |
| 2 | Plate polygons | Actor | Nine rigid spherical polygons (Pacific, North America, South America, Africa, Eurasia, India, Antarctica, Australia, Nazca), each with an edge bevel so overlaps are visible | Yes: drag |
| 3 | Continental shelf outlines | Overlay | Cyan lines at the 200 m isobath carried on every plate, so joins are judged at the true continental edge | No |
| 4 | Rotation pole markers | UI-Probe | Small brass pins on the globe surface marking each plate's Euler pole; drag to change the arc a plate swings along | Yes: place |
| 5 | Velocity handles | UI-Probe | Per-plate pull-handles with a numeric field in mm/yr and a direction arrow; pre-filled from the student's own GPS estimates | Yes: drag |
| 6 | Seafloor age skin | Overlay | Rainbow age raster on the ocean floor that erases from the ridge outward as the clock rewinds, so no crust exists before it was made | No |
| 7 | Mid-ocean ridge lines | Structure | Gold double-lines that migrate and lengthen as the reconstruction runs; new ridge appears where an ocean opens | No |
| 8 | Subduction margins | Structure | Toothed dark bands along convergent edges, teeth pointing at the overriding plate; consume old crust as the clock runs forward | No |
| 9 | Hotspot trail | Overlay | Hawaii and Emperor seamount chain drawn as a bent line of cones; an independent check that the Pacific's path is right | Yes: swap |
| 10 | Reconstruction timeline | UI-Probe | Brass rail 0–200 Ma with detents every 10 Myr; supports scrub, step and play | Yes: drag |
| 11 | Published-model ghost | Overlay | Faint white outlines of an accepted reconstruction at the same age, drawn behind the student's plates | No |
| 12 | Residual map | Overlay | Red and blue wash showing where the student's plate sits ahead of or behind the ghost, in kilometres | No |
| 13 | Overlap and gap detector | Instrument | Flags any two plates occupying the same ground, or any hole in the reconstructed lithosphere, with an area in km² | No |
| 14 | Evidence pin set | Instrument | Placeable pins carrying the earlier evidence: Mesosaurus localities, Glossopteris localities, Appalachian and Caledonian belt ends, matching shield ages | Yes: place |
| 15 | Keyframe strip | UI-Probe | Row of thumbnails at 0, 50, 100, 150 and 200 Ma; each stores the student's arrangement for comparison | Yes: swap |
| 16 | Model report card | UI-Probe | Panel printing the fit metrics, the evidence pins satisfied, and the rates used; exportable as a one-page summary | No |

**How it works — the model.**
Every plate moves on a sphere by rotating about an Euler pole at an angular rate, which is the honest way to move rigid pieces on a curved Earth and keeps their shapes intact. The student supplies a linear speed at a reference point on each plate, in millimetres per year, and the engine converts it to the angular rate needed about the pole they have placed. Rewinding is simply integrating that rotation backward in the chosen step size. Three independent checks run continuously. Geometry: overlap and gap area between plates. Seafloor: crust younger than the current model age is deleted, so a plate cannot sit on ocean floor that did not yet exist. Evidence: each placed pin scores whether the localities it links are within a stated distance of each other at that age. The model never reveals the published answer during work; the ghost is shown only as an outline so the student compares, rather than copies. Small rate errors are allowed to compound honestly, because a 5 mm/yr error over 200 Myr is 1,000 km and the student needs to see that.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Model age | Timeline scrubber | 0–200 | 0 | Ma | How far back the reconstruction is wound; drives everything on the globe |
| Plate velocities | Numeric field | 0–160 per plate | From the student's GPS estimates | mm/yr | Speed assigned to each plate; the core input of the whole model |
| Rotation pole | Drag-handle | Any point on the globe, per plate | Published pole per plate | ° lat, ° lon | Structural: the arc each plate swings along; changes path shape, not just speed |
| Velocity source | Dropdown | My estimates / GPS-derived / Seafloor-age derived / Published model | My estimates | — | Structural: swaps the whole velocity set so three models can be compared |
| Step size | Dropdown | 1 Myr / 5 Myr / 10 Myr | 5 Myr | — | Integration step; coarse steps visibly accumulate error |
| Seafloor age skin | Toggle | On / Off | On | — | Whether ocean crust is erased as it un-forms |
| Hotspot trail | Toggle | On / Off | Off | — | Draws the Hawaii-Emperor chain as an independent check on Pacific motion |
| Evidence pins | Multi-select | Mesosaurus / Glossopteris / Fold belts / Shield ages / Glacial striations / None | None | — | Structural: which evidence tests are active and scored |
| Published ghost | Toggle | On / Off | Off | — | Shows the accepted reconstruction outline behind the student's plates |
| Capture keyframe | Toggle | Draft / Capture | Draft | — | Stores the current arrangement into the keyframe strip and the report card |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Rewind the Atlantic | Velocity source=My estimates; plate velocities: North America=25, Africa=22; model age=0 to 200; evidence pins=None | At your own rates, at what model age does the Atlantic close completely? |
| S2 | Test it against fossils | Evidence pins=Mesosaurus, Glossopteris; model age=250 target via 200 Ma; published ghost=Off | Do your reconstructed continents put the fossil localities close enough together? Which pin fails first? |
| S3 | Wrong by a little, wrong by a lot | Velocity source=My estimates; change India from 45 to 60 mm/yr; model age=200 | A 15 mm/yr change sounds tiny. How many kilometres out is India after 200 Myr? |
| S4 | Three models, one Earth | Velocity source=GPS-derived, then Seafloor-age derived, then Published model; model age=100; published ghost=On | Which of the three velocity sets reproduces the accepted reconstruction best, and where do they all agree? |

**Student activities.**
1. Enter your own velocity for each of the nine plates from the GPS analysis. Record the nine numbers before you run anything.
2. Scrub the timeline from 0 to 200 Ma in 10 Myr steps. Record the model age at which the Atlantic first closes and at which India first touches Antarctica.
3. Place Mesosaurus and Glossopteris evidence pins, re-run to 200 Ma, and record how many pins are satisfied and by what margin the failures miss.
4. Change one plate's velocity by 15 mm/yr, re-run to 200 Ma, and record the residual distance in kilometres for that plate.
5. Capture keyframes at 0, 50, 100, 150 and 200 Ma, then turn on the published ghost and record your largest residual at each keyframe.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Model age | Live numeric | Ma | Current reconstruction age from the timeline |
| Plate displacement | Data table | km | Distance each plate has been moved back, per plate, at the current age |
| Overlap and gap area | Live numeric | km² | Total area of plates on top of each other, and of holes in the lithosphere |
| Residual against ghost | Heat map | km | Where the student's plates sit ahead of or behind the accepted model |
| Evidence pins satisfied | Pass-fail badge | count | How many of the active evidence tests the reconstruction passes |
| Ocean basin width | Line graph | km vs Ma | Atlantic and Tethys widths through the reconstruction |
| Rate sensitivity | Bar chart | km per mm/yr | How far each plate moves per unit of rate error over 200 Myr |
| Model report card | Data table | mixed | Velocities used, poles, keyframe residuals and evidence results; exportable |

**What the student should realise.**
Students believe the map of Pangaea is a picture someone drew, something to be memorised rather than checked. Building it from their own measured rates, watching it fail the fossil tests when a rate is wrong, and seeing a 15 mm/yr slip become 3,000 km makes it a model with inputs, errors and evidence. The student should be able to say: *"Pangaea is not a picture I was shown, it is a reconstruction I can build from present-day speeds and test against fossils, rocks and the age of the sea floor."*

## E5 · Plate boundaries and the landforms they build

### E5.1 · Divergent boundaries

**Experiment name:** Rift to Ridge: Where New Crust Is Born  
**Render mode:** 2.5D Layered  
**Simulation engine:** Procedural geology + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-2, MS-ESS2-3

**Theme & scene.**
A cross-section slab 600 km wide and 150 km deep, cut clean like a layer cake and viewed straight on at vertical exaggeration 2×. The lower two-thirds is mantle: one convection cell rendered as a slow glowing conveyor, cherry-red where it rises under the centre, dulling to maroon as it spreads left and right, with hundreds of ember-motes drifting along its streamlines. Above it two plates pull apart. In rift mode they are buff continental blocks stepping down into a valley on faults; in ridge mode they are black basalt slabs under a deepening indigo ocean, with black smokers puffing at the axis. A stripe of fresh orange dike glows in the exact middle and cools to grey as it travels outward. Controls dock right; an age ruler runs along the top edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Mantle convection cell | Field | Asthenosphere volume 600×100 km, false-colour temperature from 1300 °C at base to 1100 °C at top; velocity field rises under the axis and diverges at the half-spreading rate; drives 400 ember-motes along streamlines | No |
| 2 | Decompression melt zone | Particle | Inverted triangle under the axis, 60 km wide at 60 km depth narrowing to the melt lens; 5–20 % melt drawn as bright orange droplets migrating upward; vanishes if spreading stops | No |
| 3 | Axial melt lens | Structure | Lens 2 km wide × 0.5 km thick at 1.5 km below the axis, glowing yellow-orange, pulses each time a dike injects | No |
| 4 | Sheeted dike swarm | Structure | Vertical 1 px stripes injected at the axis every tick; each new dike splits the previous one, so half of every dike travels left and half right; colour cools orange to dark grey over 1 Myr | No |
| 5 | Pillow basalt layer | Structure | Top 0.5 km of oceanic crust as bumpy pillow silhouettes, glassy black; fresh pillows at the axis glow briefly | No |
| 6 | Gabbro layer | Structure | 5 km coarse speckled dark-green layer beneath the dikes; thickness set by mantle temperature | No |
| 7 | Continental crust blocks (rift mode) | Structure | Two 35 km buff granite-textured slabs, sliced by normal faults into horst and graben blocks that drop as the plates part; thin toward 12 km before breakup | Yes: drag |
| 8 | Normal fault planes | Structure | Planar dark lines dipping toward the axis at the set angle, 8 per side, each slipping in 100 m increments | Yes: place |
| 9 | Lithosphere base isotherm | Overlay | Dashed 1300 °C line thickening away from the axis as L = 10√t km (t in Myr), capped at 100 km | No |
| 10 | Ocean water layer | Environment | Translucent indigo fill above the crust; depth d = 2600 + 350√t m; drawn only when the rift is flooded | No |
| 11 | Hydrothermal vents | Particle | Three black-smoker chimneys within 2 km of the axis emitting dark particle plumes; appear only under water | No |
| 12 | Crust-age paint | Overlay | Colour ramp red (0 Myr) to violet (30 Myr) applied to every crust column; symmetric about the axis by construction | No |
| 13 | Magnetic recorder | Overlay | Paints black and white polarity stripes onto crust as it forms, using the real reversal timescale for the last 30 Myr | No |
| 14 | Age pins | Instrument | Two draggable pins that lock onto a crust column and ride with it; readout shows their separation and the rate it grows | Yes: place |
| 15 | Temperature probe | Instrument | Draggable thermometer needle reading the field at any depth to 1 °C | Yes: drag |
| 16 | Fissure eruption emitter | Particle | Rift-valley basalt fountain at the axis; fires once the stretching factor β passes 2 | No |

**How it works — the model.**
Each tick the two plates move outward at half the spreading rate. The gap at the axis is filled from below by a new dike, and every earlier dike is split down its middle, so crust forms only at the centre and ages symmetrically outward: age = distance ÷ half-rate. Mantle temperature never changes during a run; melting happens because rising rock loses pressure, not because it is heated, and the melt zone shrinks to nothing if spreading stops. Crust thickness is 7 km at 1350 °C and grows by 1 km for every 15 °C above that, so a hot mantle builds Iceland-style thick crust that stands above sea level. Cooling crust subsides as depth = 2600 + 350√t m, which gives the ridge its profile. In rift mode the continental blocks stretch on normal faults; once the stretching factor β passes 3 the crust is thin enough for basalt to take over and the scene converts to a ridge. Time runs at 10,000 to 500,000 years per second.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Boundary type | Dropdown | Continental rift / Young ocean (Gulf of California) / Mature mid-ocean ridge | Mature mid-ocean ridge | — | Structural: swaps continental blocks for oceanic crust and sets the starting ocean width and fault set |
| Spreading rate | Slider | 1–15 | 5 | cm/yr | Full separation rate; plate speed, melt supply and dike frequency |
| Mantle temperature | Slider | 1250–1450 | 1350 | °C | Melt fraction and crust thickness; hot values lift the ridge above sea level |
| Fault dip | Slider | 45–70 | 60 | ° | Angle of rift normal faults; shallower dips make a wider valley |
| Flood the rift | Toggle | On / Off | On | — | Fills topography below sea level with water and enables vents |
| Time compression | Dial | 10,000–500,000 | 100,000 | yr/s | Geological time passing per second |
| Age paint | Toggle | On / Off | Off | — | Shows the crust-age colour ramp |
| Magnetic recorder | Toggle | On / Off | Off | — | Paints polarity stripes onto forming crust |
| Section width | Dropdown | 200 / 600 / 1500 | 600 | km | Zoom level of the slab; pins and ruler rescale |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Slow ridge, Mid-Atlantic | Boundary type=Mature mid-ocean ridge; Spreading rate=2.5; Age paint=On | Which crust is youngest, and how old is the crust 200 km from the axis on each side? |
| S2 | Fast ridge, East Pacific Rise | Boundary type=Mature mid-ocean ridge; Spreading rate=14; Section width=1500; Age paint=On | How much farther from the axis does 10-million-year-old crust sit here than in S1, and what happened to the axial valley? |
| S3 | Rift to ocean, East Africa | Boundary type=Continental rift; Spreading rate=1; Time compression=500,000; Flood the rift=On | How thin does the continent get before basalt replaces it, and what does the valley turn into? |
| S4 | Gulf of California opening | Boundary type=Young ocean (Gulf of California); Spreading rate=5; Section width=600 | The gulf is about 250 km wide at its mouth. How long ago did Baja California leave the mainland? |

**Student activities.**
1. Set Spreading rate to 2.5 cm/yr, run 20 Myr of model time, and place the two age pins on crust of equal colour either side of the axis. Record their separation and the measured rate.
2. Drag the temperature probe from the axis to 250 km out at 20 km depth in five steps; record the temperature at each step and describe what the lithosphere is doing.
3. Predict, before changing anything, how the ridge profile will change at 14 cm/yr. Set it, run, and record the seafloor depth 100 km from the axis for both rates.
4. Switch to Continental rift, run at 500,000 yr/s, and record the stretching factor β and crust thickness at the moment the first basalt fissure fires.
5. Turn on the magnetic recorder, run 5 Myr, and count the stripes on each side of the axis; write one sentence explaining why the two counts match.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Crust age at cursor | Live numeric | Myr | Age of the column under the pointer, updated per frame |
| Measured spreading rate | Live numeric | cm/yr | Separation of the two age pins divided by elapsed model time |
| Age vs distance | Line graph | Myr vs km | Built continuously; a symmetric V centred on the axis |
| Seafloor depth profile | Line graph | m vs km | Depth below sea level across the section; flattens with the square root of age |
| Probe temperature | Live numeric | °C | Field value at the probe tip |
| Crust thickness | Live numeric | km | Gabbro plus dikes plus pillows at the axis |
| Stretching factor β | Live numeric | — | Rift mode only: original crust thickness ÷ current thickness |
| Run log | Data table | mixed | One row per pin or probe reading; exportable CSV |

**What the student should realise.**
Students picture the ridge as a mountain range heaped up by eruptions with the oldest rock at its crest, or imagine continents pushing the seafloor outward from their edges. Here new rock only ever appears on the centre line, every older dike is split in two, and both flanks age in mirror image. The ridge stands high because young crust is hot, not because material piled up. The student should be able to say: *"The seafloor is made at the middle and carried away on both sides, so the youngest rock is always at the ridge."*

### E5.2 · Convergent boundaries

**Experiment name:** Head-On: Three Ways Plates Collide  
**Render mode:** 2.5D Layered  
**Simulation engine:** Procedural geology + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-2

**Theme & scene.**
A cutaway 1200 km wide and 300 km deep at vertical exaggeration 2×, lit from the upper left so plate surfaces catch light while the mantle glows from within. The convection engine runs underneath: a cell that sinks beside the trench and drags ember-motes down alongside the slab. From the left an oceanic plate, slate-grey with a thin olive skin of sediment, bends into a deep V-shaped trench and slides beneath the right-hand plate. Where it reaches 100 km depth, blue water beads escape and drift up into the mantle wedge; orange melt blobs form there and rise into a chain of stratovolcanoes. Red pinpricks of earthquake foci trace the descending slab. Swapping the collision type rebuilds the scene: a second ocean plate with an island arc, or two continents crumpling into a high range. Controls dock right; the timeline runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Mantle convection cell | Field | Asthenosphere 1200×220 km, false-colour temperature; downwelling limb pinned to the slab; 500 ember-motes on streamlines | No |
| 2 | Subducting oceanic plate | Actor | 7 km basalt-gabbro crust (charcoal) on 80 km lithospheric mantle (dark olive), bending at the trench on a 300 km radius and descending at the set dip; carries blue hydrous-mineral speckles | Yes: drag |
| 3 | Sediment skin | Structure | 0–3 km olive-tan layered blanket riding on the ocean plate; scraped off at the trench | No |
| 4 | Overriding plate | Structure | Continental: 38 km buff granitic crust on 100 km lithosphere; oceanic: 7 km basalt on 60 km lithosphere; swapped by the collision-type control | Yes: swap |
| 5 | Trench | Environment | V-shaped notch 8–11 km below sea level at the plate contact, filled with indigo water | No |
| 6 | Accretionary wedge | Structure | Stacked olive thrust slices growing at the trench edge from scraped sediment, Franciscan-style chaotic texture | No |
| 7 | Slab dehydration emitter | Particle | Blue droplets released from the slab between 80 and 150 km depth, 20 per tick, rising through the wedge | No |
| 8 | Mantle wedge melt zone | Particle | Orange melt blobs nucleate where droplets meet mantle hotter than 1000 °C; coalesce into diapirs 10 km across rising to the base of the crust | No |
| 9 | Magma chamber and volcanic arc | Structure | Lens 20 km wide at 8 km depth feeding stratovolcanoes 2.5 km high with 30° flanks, spaced 70 km; each erupts an ash plume every 20 kyr of model time | Yes: place |
| 10 | Benioff-zone hypocentres | Particle | Red dots generated along the slab top, 5 per tick, deepening with distance from the trench; maximum depth set by slab age | No |
| 11 | Colliding continent (collision mode) | Actor | Second buff crustal block riding in on the ocean plate; too buoyant to sink, it stacks into thrust sheets and doubles crust thickness | Yes: drag |
| 12 | Fold-thrust belt and crustal root | Structure | Folded sediment layers with 30° thrust faults rising above sea level, mirrored by a root growing 4.5× deeper into the mantle | No |
| 13 | Island arc and back-arc basin (ocean-ocean mode) | Structure | Volcanic islands built on the overriding ocean plate; thinning back-arc floor behind them | No |
| 14 | Depth probe | Instrument | Draggable crosshair reporting depth, temperature and water content at any point | Yes: drag |
| 15 | Section ruler | Instrument | Draggable horizontal tape for trench-to-arc distance, reads km | Yes: drag |
| 16 | Model-time counter | Instrument | Myr elapsed since run start, top-left | No |

**How it works — the model.**
The slab is kinematic: it descends at the convergence rate along the set dip, and every frame the engine advances it, scrapes sediment into the wedge, and spawns hypocentres along its upper surface down to a maximum depth that scales with slab age, 100 km for a 5 Myr plate and the full section for 150 Myr. Between 80 and 150 km depth the slab releases its water; a droplet entering mantle hotter than 1000 °C lowers the melting point there and seeds melt. The arc therefore sits above the point where the slab is 100 km deep: trench-to-arc distance = 100 ÷ tan(dip) km, the relationship students measure. With water off the slab still descends but no melt forms, because friction alone cannot melt rock. In collision mode, once the ocean between the continents is consumed, the buoyant crust refuses to sink; convergence turns into thickening, the arc dies, and height rises by 0.18 × thickening under simple isostasy, minus erosion. Time runs at up to 1 Myr per second.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Collision type | Dropdown | Ocean under continent / Ocean under ocean / Continent meets continent | Ocean under continent | — | Structural: rebuilds the overriding plate, arc style and end state |
| Convergence rate | Slider | 1–10 | 5 | cm/yr | Slab speed, quake rate, wedge growth and collision timing |
| Slab dip | Slider | 15–70 | 45 | ° | Angle of descent; moves the arc nearer or farther from the trench |
| Slab age | Slider | 5–150 | 60 | Myr | Slab density and coldness; sets deepest hypocentre and trench depth |
| Sediment thickness | Slider | 0–3 | 1 | km | Blanket on the ocean plate; controls wedge growth |
| Water in slab | Toggle | On / Off | On | — | Enables dehydration and therefore arc melting |
| Ocean width | Slider | 200–1500 | 800 | km | Collision mode only: distance the second continent travels before impact |
| Time compression | Dial | 10,000–1,000,000 | 200,000 | yr/s | Model time per second |
| Show hypocentres | Toggle | On / Off | On | — | Draws or hides earthquake foci |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Cascadia under northern California | Collision type=Ocean under continent; Convergence rate=4; Slab dip=25; Slab age=10 | Measure the trench-to-arc distance. Why do Mount Shasta and Lassen Peak stand so far inland from the coast, and how deep do the quakes reach? |
| S2 | Mariana, ocean under ocean | Collision type=Ocean under ocean; Slab age=150; Slab dip=70 | Why is this trench the deepest, why is the arc a line of islands, and where do the deepest earthquakes occur? |
| S3 | Himalaya | Collision type=Continent meets continent; Convergence rate=5; Ocean width=800; Time compression=1,000,000 | When the continents meet, where do the volcanoes go, and how high has the range risen 50 Myr later? |
| S4 | Dry slab | Collision type=Ocean under continent; Water in slab=Off; Slab dip=45 | The slab still grinds down at 5 cm/yr. Why is there no volcano, and what was really doing the melting? |

**Student activities.**
1. Set Slab dip to 30°, run 2 Myr, and measure trench-to-arc distance with the section ruler. Repeat at 45° and 60°; record all three and state the pattern.
2. Drag the depth probe along the slab top from the trench to 150 km depth; record where the water beads leave and where the first melt forms.
3. Turn Water in slab Off, run 3 Myr, and record melt production and eruption count. Turn it back On and compare.
4. Switch to Continent meets continent, predict how high the range will stand after 30 Myr, run, and record the height and root depth from the readouts.
5. Set Slab age to 5 Myr and then 150 Myr; record the deepest hypocentre for each and explain the difference in one sentence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Trench-to-arc distance | Live numeric | km | Horizontal gap from trench axis to the nearest active cone |
| Trench depth | Live numeric | km | Deepest point of the notch below sea level |
| Deepest hypocentre | Live numeric | km | Maximum focal depth generated in the run |
| Melt production | Live numeric | km³/kyr | Volume of wedge melt reaching the crust per thousand years |
| Hypocentre depth vs distance | Line graph | km vs km | Dots plotted as generated; traces the slab |
| Range height and root depth | Live numeric | km | Collision mode: peak elevation and root thickness beneath it |
| Crust thickness at arc | Live numeric | km | Overriding crust including added magma |
| Run log | Data table | mixed | Ruler, probe and event readings; exportable CSV |

**What the student should realise.**
Students think the sinking plate melts from friction and that every collision makes volcanoes. Here the slab never melts; the water it carries down lowers the melting point of the mantle above it, so cutting the water kills the arc while the plates keep grinding. When two continents meet, neither sinks, the volcanoes die, and the crust thickens into a range instead. The student should be able to say: *"What forms at a collision depends on which plate can sink and whether it carries water down with it."*

### E5.3 · Transform boundaries

**Experiment name:** Stick, Slip and Creep on the San Andreas  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Field/vector + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-ESS2-2, MS-ESS3-2

**Theme & scene.**
A 3D block of the Carrizo Plain, 60 km along the fault by 30 km across and 20 km deep, seen from a helicopter angle in late-afternoon light: tawny grassland, the Temblor Range to the north-east, the fault trace a faint scar running the length of the block. A creek, a fence line, a road and a row of almond trees cross the scar at right angles. The front face of the block is cut away to show the fault plane going straight down: rusty red where it is locked, mossy green where it creeps, shading into a smeared taffy-like ductile zone below 15 km. The south-west half of the block glides steadily north-west; the north-east half lags. Controls dock right; a seismograph drum and year counter sit bottom-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terrain block | Environment | 60×30×20 km block at vertical exaggeration 1×, grassland texture with a 1 km grid and two hill ranges; Pacific side (SW) and North American side (NE) as separate rigid bodies | No |
| 2 | Fault trace | Structure | Surface line along the block centre; splits the terrain mesh so the halves can slide; bends of ±15° selectable | No |
| 3 | Fault plane face | Structure | Vertical plane 0–15 km with red locked and green creeping patch textures, passing into grey ductile shear below 15 km | Yes: swap |
| 4 | Elastic strain field | Field | Invisible displacement field u(x) = (v·t/π)·arctan(x/D) either side of a locked segment; bends every surface marker; released on rupture | No |
| 5 | Wallace Creek channel | Structure | Blue 6 m-wide stream from the NE hills across the fault to the plain; the crossing segment offsets and lengthens; abandoned reaches remain as dry beheaded gullies | Yes: place |
| 6 | Fence line | Structure | Straight barbed-wire fence with posts every 20 m crossing the fault; bends elastically then jumps | Yes: place |
| 7 | Almond rows and road | Structure | Parallel marker rows crossing the trace; same behaviour as the fence | Yes: place |
| 8 | GPS stations | Instrument | Tripod markers placed anywhere; report north-west displacement relative to a station 100 km from the fault | Yes: place |
| 9 | Creepmeter | Instrument | Wire stretched across the trace reporting cumulative fault slip at that point to 1 mm | Yes: drag |
| 10 | Seismograph drum | Instrument | Rotating drum trace; each rupture writes a wiggle and prints its magnitude | No |
| 11 | Stress gauge | Instrument | Bar showing stored slip deficit against the threshold; turns red near failure | No |
| 12 | Rupture propagator | Particle | On failure, a bright front runs along the trace at 3 km/s followed by shake rings and dust puffs | No |
| 13 | Pressure ridge and sag pond | Structure | A restraining bend raises a hill, a releasing bend drops a pond; appear only when the geometry is bent | No |
| 14 | Measuring tape | Instrument | Two-ended tape for stream and fence offsets, reads metres | Yes: drag |
| 15 | Year counter | Instrument | Model calendar from a chosen start year | No |

**How it works — the model.**
The two blocks move at the plate rate at all times; nothing ever stops the plates. On a creeping segment the fault surface slides continuously, so markers offset steadily and no stress builds. On a locked segment the fault holds, and the surface within about 20 km of the trace bends elastically along an arctangent profile with locking depth D while the slip deficit grows at the plate rate. When the deficit reaches the slip-per-earthquake threshold the segment ruptures: the deficit is released as slip, the markers snap straight and offset, and the magnitude comes from the moment M0 = 3×10¹⁰ × (rupture length × D) × slip, with Mw = (log10 M0 − 9.1)/1.5. The recurrence interval is therefore slip ÷ rate, about 150 years for 5 m at 3.4 cm/yr. Below 15 km the fault flows continuously in both modes. The simplification is that every quake releases the whole deficit; real faults are messier, but the cycle is honest.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Segment behaviour | Dropdown | Locked (Carrizo Plain) / Creeping (Parkfield to Hollister) / Locked NW, creeping SE | Locked (Carrizo Plain) | — | Structural: assigns locked and creeping patches to the fault plane |
| Plate motion rate | Slider | 1.0–6.0 | 3.4 | cm/yr | Steady relative speed of the two blocks |
| Locking depth | Slider | 5–20 | 15 | km | Depth of the locked patch; width of the bent zone and rupture area |
| Slip per earthquake | Slider | 1–10 | 5 | m | Deficit stored before rupture; sets the recurrence interval |
| Rupture length | Slider | 20–400 | 300 | km | Length used in the magnitude calculation |
| Fault geometry | Radio | Straight / Restraining bend / Releasing bend | Straight | — | Structural: bends the trace and adds a pressure ridge or sag pond |
| Time compression | Dial | 1–1000 | 50 | yr/s | Model years per second |
| Show strain field | Toggle | On / Off | Off | — | False-colour shear-strain wash on the surface |
| Show cross-section | Toggle | On / Off | On | — | Reveals the cut-away fault plane face |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Carrizo Plain, locked | Segment behaviour=Locked (Carrizo Plain); Plate motion rate=3.4; Slip per earthquake=5; Time compression=5 | Watch the fence for a full cycle. Does the ground move before the earthquake, and how many years pass between ruptures? |
| S2 | Parkfield to Hollister, creeping | Segment behaviour=Creeping (Parkfield to Hollister); Plate motion rate=3.4; Time compression=50 | After the same years the fence is offset by the same amount as in S1. Where did the earthquakes go? |
| S3 | Wallace Creek | Segment behaviour=Locked (Carrizo Plain); Slip per earthquake=5; Time compression=200 | The real creek is offset 130 m. How many earthquakes and how many years did that take? |
| S4 | The Big Bend | Fault geometry=Restraining bend; Plate motion rate=3.4; Time compression=500 | The plates only slide sideways. Why is a mountain rising at the bend? |

**Student activities.**
1. Place a fence across the trace, set Time compression to 5 yr/s, and record the bend of the fence at 50, 100 and 150 model years using the tape between its two ends.
2. Place four GPS stations at 1, 5, 20 and 50 km from the trace; after 100 years record each displacement and sketch displacement against distance.
3. Predict the recurrence interval for Slip per earthquake = 8 m at 3.4 cm/yr, then run and check it against the seismograph timestamps.
4. Switch to Creeping, run the same 150 years, and record creepmeter slip and the number of magnitude 6 or larger events.
5. Drag Wallace Creek onto the trace, run until the offset reads 130 m, and record the years elapsed and the count of ruptures.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Slip deficit | Live numeric | m | Stored, unreleased motion on the locked patch |
| Creepmeter slip | Live numeric | cm | Cumulative fault slip at the creepmeter |
| GPS displacement vs distance | Line graph | cm vs km | Arctangent profile across the fault; flat for creeping |
| Rupture list | Data table | Mw | Every rupture with model year, slip and magnitude |
| Recurrence interval | Live numeric | yr | Mean gap between the last five ruptures |
| Marker offset | Live numeric | m | Tape reading for the selected stream or fence |
| Uplift at bend | Live numeric | m | Height of the pressure ridge, bent geometries only |
| Run log | Data table | mixed | Exportable CSV of all readings by model year |

**What the student should realise.**
Students think the plates sit still until an earthquake shoves them, or that California will drop into the sea. Here the plates never pause; a locked fault stores that steady motion as bending, and the earthquake is only the catch-up, while a creeping segment keeps pace with no big quakes at all. The student should be able to say: *"The plates move all the time; the fault either creeps along with them or falls behind, bends the ground, and catches up in an earthquake."*

### E5.4 · Why hazards cluster at boundaries

**Experiment name:** Fifty Thousand Dots Draw the Plates  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS3-2

**Theme & scene.**
A dark situation-room wall: a world map in the Equal Earth projection, oceans near-black, continents charcoal, no borders and no names. Over it lie 52,000 earthquake epicentres from 1990 to 2024 as glowing dots, yellow for shallow through orange to violet for deep, sized by magnitude, and 1,350 Holocene volcanoes as small white triangles. The plate boundaries are hidden at load. Along the top a time scrubber ticks the years; on the left a stack of filter chips; on the right the density readout, a two-column ledger headed Inside band and Outside band. A brass buffer brush hangs over the map, waiting to be dragged along a line of dots. Bottom-right, a California inset; bottom-left, a claim rail with four empty evidence slots.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | World map canvas | Environment | Equal Earth projection, 1600×800 px, so every km² draws at the same area; zoomable to 5× | No |
| 2 | Earthquake catalogue | Field | 52,000 USGS events of M ≥ 4.5 from 1990 to 2024 with latitude, longitude, depth, magnitude and date; loaded once | No |
| 3 | Epicentre dot layer | Overlay | One dot per event, radius 1.5–6 px by magnitude, colour by depth (yellow below 70 km, orange 70–300 km, violet beyond 300 km); 15 % opacity so piles glow | No |
| 4 | Volcano layer | Overlay | 1,350 Smithsonian Holocene volcanoes as 6 px white triangles with name on hover | No |
| 5 | Plate-boundary line set | Overlay | Bird (2003) boundaries, 260,000 km in total, drawn red (divergent), blue with teeth (convergent), green (transform); hidden until revealed | No |
| 6 | Buffer brush | UI-Probe | Draggable band of adjustable width laid along any path or boundary; everything inside counts as Inside band | Yes: drag, resize |
| 7 | Hexagon bin grid | Overlay | Hex cells 1°, 3° or 5° across, shaded by event count on a log scale | No |
| 8 | Lasso tool | UI-Probe | Freehand region selection; reports count and true area | Yes: drag |
| 9 | Density ledger | Instrument | Inside and Outside counts, areas, densities per million km², and their ratio | No |
| 10 | Null-model shuffler | Field | Scatters the same number of dots uniformly by area to show what no clustering looks like | No |
| 11 | Depth cross-section widget | UI-Probe | Draw a line across a boundary; a side panel plots focal depth against distance along it | Yes: place |
| 12 | Hotspot markers | Overlay | Hawaii, Yellowstone, Réunion and twelve others as amber rings; the exceptions the map must not hide | No |
| 13 | Claim rail | UI-Probe | Four claim cards with evidence slots; a slot accepts only readouts, never typed opinions | Yes: place |
| 14 | California inset | Overlay | 300 px panel in California Albers projection with the San Andreas, Cascadia, Long Valley and Lassen in view | No |
| 15 | Time scrubber | Instrument | 1990–2024 playback; dots appear on their date; running count ticker | Yes: drag |
| 16 | Annotation pins | Overlay | Numbered pins with typed notes, exported with the log | Yes: place |

**How it works — the model.**
Nothing is simulated; every dot is a recorded event, and the engine's work is honest counting. When the student lays the buffer brush along a boundary at width w, it computes the band's area on the sphere, counts events and volcanoes inside and outside, and reports density per million km² for each and the ratio between them. It also computes the fraction of all events the band holds and compares it with the fraction of Earth's surface the band covers; that comparison is the clustering index. The null-model shuffler drops the same number of dots at random, weighted by area, so the student sees that a random world gives an index near 1 while the real one gives around 5. Depth cross-sections plot raw focal depths against distance. The Equal Earth projection matters: on a Mercator map high-latitude areas inflate and every density lies.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Hazard layer | Multi-select | Earthquakes / Volcanoes / Hotspots | Earthquakes | — | Structural: which catalogues are drawn and counted |
| Minimum magnitude | Slider | 4.5–8.0 | 5.0 | Mw | Filters the earthquake layer |
| Depth class | Dropdown | All / Shallow (below 70 km) / Intermediate (70–300 km) / Deep (beyond 300 km) | All | — | Filters by focal depth |
| Band width | Slider | 50–1000 | 200 | km | Width of the buffer brush each side of its path |
| Boundary type shown | Multi-select | Divergent / Convergent / Transform | All three | — | Which boundary lines are revealed and counted |
| Time window | Timeline scrubber | 1990–2024 | 1990–2024 | yr | Which events are visible and counted |
| Null model | Toggle | Off / Shuffled | Off | — | Replaces real dots with area-random dots |
| Bin size | Dropdown | 1° / 3° / 5° | 3° | — | Hexagon grid resolution |
| Region focus | Dropdown | World / Pacific rim / North Atlantic / Central Asia / California | World | — | Zooms and re-centres the map |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The whole world in a band | Hazard layer=Earthquakes; Band width=200; Minimum magnitude=5.0 | What fraction of M ≥ 5 earthquakes falls within 200 km of a boundary, and what fraction of Earth's surface does that band cover? |
| S2 | Volcanoes by boundary type | Hazard layer=Volcanoes; Boundary type shown=Convergent; Band width=150 | Repeat for Divergent and Transform. Which type has the most volcanoes per 1000 km of boundary, and which has almost none? |
| S3 | Where the deep ones live | Hazard layer=Earthquakes; Depth class=Deep (beyond 300 km); Region focus=Pacific rim | Deep earthquakes sit on only one kind of boundary. Draw a cross-section across Tonga: what shape do the depths make? |
| S4 | California's own cluster | Region focus=California; Hazard layer=Earthquakes / Volcanoes; Band width=100 | Is the California cluster a line or a scatter, and why are the volcanoes only in the north-east while the quakes run the whole length? |

**Student activities.**
1. Set Band width to 200 km, drag the buffer brush along the entire Pacific rim, and record Inside and Outside densities and the clustering index.
2. Toggle Null model to Shuffled with the same band and record the index again; write one sentence comparing the two.
3. Set Depth class to Deep, place a cross-section line across the Tonga trench, and record the depth at 100, 300 and 500 km along the line.
4. Compare the three boundary types with the Volcanoes layer; record volcanoes per 1000 km for each and rank them.
5. Drag the four claim cards into the rail and attach a readout to each; record which claims the evidence supports and which it kills.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Inside / Outside density | Live numeric | events per million km² | Updated whenever the brush, filters or window change |
| Clustering index | Live numeric | — | Fraction of events in the band ÷ fraction of area in the band |
| Volcanoes per 1000 km | Bar chart | count/1000 km | One bar per boundary type currently revealed |
| Depth cross-section | Line graph | km vs km | Focal depth against distance along the drawn line |
| Distance-to-boundary histogram | Bar chart | count vs km | How far every event sits from the nearest boundary |
| Yearly count | Line graph | events/yr | Events passing the current filters, by year |
| Claim verdicts | Pass-fail badge | — | Supported, Refuted or Not enough evidence, per claim card |
| Selection table | Data table | mixed | Every event inside the lasso or band; exportable CSV |

**What the student should realise.**
Students believe earthquakes and volcanoes strike at random, or that the two always arrive together. Fifty thousand dots refuse to scatter: they trace lines, those lines are the plate edges, and a shuffled map looks nothing like it. Transform boundaries shake without erupting, deep quakes occur only where a plate sinks, and hotspots are the rare exceptions. The student should be able to say: *"Hazards cluster where plates meet, because that is where rock is being torn, forced down or ground past."*

### E5.5 · Reading a plate-boundary map

**Experiment name:** Teeth, Arrows and Double Lines  
**Render mode:** 2D Canvas  
**Simulation engine:** Field/vector + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** Supporting — MS-ESS2-2, MS-ESS2-3

**Theme & scene.**
A cartographer's light table. A world map in the Robinson projection fills the screen on cream paper, continents pale sand, oceans a faint blue-grey wash, seafloor lightly shaded by age so the ridges show as pale spines. Fifteen plates are outlined in thin ink with their names set in small capitals. Along every boundary the standard symbols are stamped: black sawteeth on the side of the plate that stays on top, a red double line with cross-ticks along the ridges, paired green half-arrows sliding past each other along transforms. Purple velocity arrows sprout from each plate. A brass-rimmed probe lens sits at the cursor; a tray of draggable symbol stamps lies along the bottom; controls dock right; a California inset and a scorecard sit bottom-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Map canvas | Environment | Robinson projection, 1600×820 px, cream paper with a faint graticule every 30°; zooms to 6× and pans by drag; the California inset uses California Albers | No |
| 2 | Plate polygons | Structure | Fifteen plates from the Bird (2003) outlines: Pacific, North America, South America, Eurasia, Africa, Antarctic, Australia, India, Nazca, Cocos, Juan de Fuca, Philippine Sea, Caribbean, Arabia, Scotia; each a filled region that tints 6 % on hover, name in small capitals | No |
| 3 | Crust-type shading | Overlay | Continental crust sand; oceanic crust blue-grey on a 0–180 Myr age ramp so ridges read as pale spines; toggleable | No |
| 4 | Boundary segment set | Structure | 1,200 polyline segments, each tagged with the two plates it separates and a true type computed from their motion; drawn as a neutral grey hairline when symbols are hidden | No |
| 5 | Convergent stamp (sawteeth) | Overlay | Black filled triangles 8 px high every 24 px along the segment, pointing onto the overriding plate; teeth on the plate that stays on top | Yes: place |
| 6 | Divergent stamp (double line) | Overlay | Two parallel red lines 3 px apart with 6 px cross-ticks every 30 px | Yes: place |
| 7 | Transform stamp (paired half-arrows) | Overlay | Green single line with opposed half-arrowheads every 40 px showing the sense of slip; flips when the student clicks it | Yes: place |
| 8 | Absolute velocity arrows | Overlay | One purple arrow per plate at its centroid and at four boundary points, from the NNR-MORVEL56 model; length ∝ speed at the set scale | No |
| 9 | Relative-motion arrow pair | Overlay | Two opposed arrows either side of a boundary point, one per plate, showing the difference velocity; appear wherever the probe touches a boundary | No |
| 10 | Probe lens | UI-Probe | 90 px brass ring with crosshair; snaps to the nearest boundary within 20 px; opens a card reading plate pair, boundary type, relative rate, sense of motion and expected landform | Yes: drag |
| 11 | Symbol tray | UI-Probe | Dock holding unlimited copies of the three stamps plus an eraser; a stamp dragged onto a segment paints its full length | Yes: drag |
| 12 | Scoring engine | Instrument | Compares each stamped segment with its true type and checks the orientation of teeth and half-arrows; invisible | No |
| 13 | Mystery planet generator | Field | Procedural globe with 4–12 plates, random rotation poles and coastlines; its boundary types follow from its arrows, so the answer key is computed, never stored | No |
| 14 | Spreading-rate ruler | Instrument | Two-ended tape laid across a ridge between matched seafloor-age bands; converts distance and age difference to cm/yr | Yes: drag |
| 15 | Landform card deck | Overlay | Six illustrated cards: mid-ocean ridge, rift valley, trench with island arc, trench with continental arc, collisional range, strike-slip valley; the probe lights the matching card | No |
| 16 | Scorecard | Instrument | Correct, wrong and unstamped segments; teeth-orientation errors listed separately | No |

**How it works — the model.**
Every plate moves as a rigid cap on the sphere, so its velocity at any point follows from its rotation pole and rate; the engine stores NNR-MORVEL56 poles for the fifteen real plates and random poles for a mystery planet. At a boundary point it subtracts the two plate velocities to get the relative motion and resolves it against the segment's direction. If the part across the boundary closes the gap faster than 1 cm/yr and exceeds the sliding part, the segment is convergent; if it opens the gap, divergent; otherwise transform. The overriding plate at a convergent segment is the one with continental crust, or the younger ocean plate where both are oceanic, and the teeth must point onto it. The landform lookup keys on type plus crust pair, from ridge to collisional range. A plate's own speed never tells the type; only the difference does, and the probe reports both so the absolute-arrow trap stays visible.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Map mode | Dropdown | Real Earth / Mystery planet | Real Earth | — | Structural: swaps the real plate set for a generated globe whose answers are computed from its arrows |
| Symbol layer | Radio | Shown / Hidden / Student stamps only | Shown | — | Whether the true symbols are drawn, hidden, or replaced by what the student has stamped |
| Arrow frame | Radio | Absolute (each plate) / Relative (across boundary) / Both | Absolute (each plate) | — | Which motion arrows are drawn |
| Arrow scale | Slider | 5–40 | 20 | px per cm/yr | Length of every arrow on the map |
| Crust shading | Toggle | On / Off | On | — | Shows continental against ocean crust and seafloor age |
| Number of plates | Stepper | 4–12 | 6 | count | Mystery planet only: how many plates are generated |
| Region focus | Dropdown | World / Pacific rim / Atlantic / California | World | — | Zooms and re-centres; California opens the Albers inset full size |
| Probe detail | Radio | Type only / Type and rate / Full (landform and hazard) | Full (landform and hazard) | — | How much the probe card reveals |
| Challenge segments | Stepper | 6–24 | 12 | count | How many hidden segments the challenge asks the student to classify |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Learn the code | Map mode=Real Earth; Symbol layer=Shown; Arrow frame=Relative (across boundary); Region focus=World | Which symbol sits where the arrows pull apart, where they push together, and where they slide past? On which side of a trench do the teeth sit? |
| S2 | Blind classification | Map mode=Real Earth; Symbol layer=Hidden; Arrow frame=Relative (across boundary); Challenge segments=12 | Using arrows alone, stamp all twelve segments. How many were right, and which two types did you confuse most often? |
| S3 | Same direction, still a collision | Region focus=Pacific rim; Arrow frame=Absolute (each plate); Symbol layer=Hidden | At the Mariana Trench both plate arrows point west. Is the boundary convergent, divergent or transform, and what does switching to the relative frame reveal? |
| S4 | Three boundaries in one state | Region focus=California; Symbol layer=Shown; Probe detail=Full (landform and hazard) | Probe Point Reyes, Cape Mendocino and the Salton Sea. Which boundary type and landform does each report, and why does one state have all three? |

**Student activities.**
1. Set Arrow frame to Relative, probe six boundaries on three continents, and record for each the plate pair, the relative rate and the type the probe reports.
2. Set Symbol layer to Hidden and Challenge segments to 12; drag stamps from the tray onto every highlighted segment, making sure teeth point onto the plate that stays on top. Record the scorecard.
3. Predict the type of the Mariana boundary from the absolute arrows alone, then switch to Relative and record whether the prediction survived and the relative rate.
4. Lay the spreading-rate ruler across the Mid-Atlantic Ridge between matching 10 Myr age bands and record the rate; compare it with the probe's rate at the same point.
5. Switch to Mystery planet with 8 plates, stamp every boundary from the arrows alone, and record the score and the number of teeth-orientation errors.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Probe card | Live numeric | cm/yr | Plate pair, boundary type, relative rate, sense of motion and expected landform at the probed point |
| Relative-motion vector | Vector overlay | cm/yr | Two opposed arrows at the probe point, drawn at the arrow scale |
| Classification score | Live numeric | % | Correct stamps ÷ challenge segments, updated on every stamp |
| Teeth-orientation errors | Counter | count | Convergent segments stamped with teeth on the wrong plate |
| Rate by boundary type | Bar chart | cm/yr | Mean relative rate of every probed segment, grouped by type |
| Ruler spreading rate | Live numeric | cm/yr | Distance between matched age bands ÷ age difference |
| Confusion table | Data table | count | Stamped type against true type, 3×3 |
| Run log | Data table | mixed | Every probe reading and stamp with its location; exportable CSV |

**What the student should realise.**
Students read a plate map as decoration, or believe two plates moving the same way cannot collide. Here the symbols are a code with rules, and the type comes only from the difference between two motions: at the Mariana Trench both arrows point west and the plates still converge. The student should be able to say: *"The symbol tells me the type, the teeth tell me which plate stays on top, and the difference between the arrows tells me why."*

## E6 · The uneven distribution of Earth's resources · MS-ESS3-1

### E6.1 · Mineral resources

**Experiment name:** Ore Forge: Where Metals Gather  
**Render mode:** 2.5D Layered  
**Simulation engine:** Procedural geology + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS3-1

**Theme & scene.**
A cutaway of the upper crust beneath a volcanic arc, 30 km wide and 12 km deep at vertical exaggeration 1.5×, lit like a furnace from below. A domed salmon-pink granite pluton pushes up into grey-green country rock and glows orange at its core. Above its roof the rock is shattered into a stockwork of hairline cracks, and through them hot brine climbs as pale gold wisps that turn cyan as they cool. Past a threshold the wisps leave a glittering bronze fog of copper minerals in the cracks. Swapping the setting rebuilds the scene: a Sierra foothills fault zone laced with white quartz veins and specks of gold, or a gravel-bed river carrying that gold to a bend. Controls dock right; a drill rig hangs at the cursor.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Country rock | Structure | Layered grey-green metavolcanic and slate slabs, 30×12 km, bedding dipping 40°, foliation lines as texture; conducts heat for the thermal field | No |
| 2 | Granite pluton | Actor | Domed intrusion 8 km wide with its roof at the set depth, salmon-pink speckled texture; cools from its start temperature by conduction and releases brine as it crystallises | Yes: drag, resize |
| 3 | Heat field | Field | Temperature on a 200×80 grid: 25 °C/km geotherm plus the pluton's conductive halo; false-colour overlay when toggled | No |
| 4 | Stockwork fracture network | Structure | Procedural crack mesh 4 km wide above the pluton roof, 1 px white hairlines, density set by the fracturing control; the only channels fluid may use | No |
| 5 | Hydrothermal fluid emitter | Particle | Brine wisps released from the crystallising pluton, 40 per tick, each carrying dissolved copper; drawn gold when hot, cyan below 300 °C | No |
| 6 | Metal solubility rule | Field | Per-metal curve of dissolved metal against temperature; copper drops out between 450 and 300 °C, gold on the pressure drop of an opening fracture | No |
| 7 | Sulphide ore specks | Particle | Bronze chalcopyrite specks instanced where copper precipitates; specks per cell equals grade; a brassy pyrite halo forms outside the copper shell | No |
| 8 | Mother Lode fault zone (gold mode) | Structure | Steep Melones-style fault zone 1 km wide through slate and greenstone; opens and reseals on each seismic cycle | Yes: swap |
| 9 | Quartz veins (gold mode) | Structure | Milky white veins 0.1–3 m wide filling fault openings; one layer per cycle; gold specks on the vein walls | No |
| 10 | Metamorphic fluid source (gold mode) | Particle | Carbon-dioxide-rich water released from dehydrating greenstone at 15 km depth, rising at 300–400 °C along the fault | No |
| 11 | Foothill river (placer mode) | Environment | Meandering gravel river 2 km long crossing the eroded vein, with an inside bend, a bedrock riffle and a pothole; flowing water particles | No |
| 12 | Placer grains | Particle | Gold flakes (density 19.3, 1–3 mm, yellow) and quartz sand (density 2.65, grey) tumbled by the flow; settle by a size-and-density rule | No |
| 13 | Erosion clock (placer mode) | Field | Lowers the land surface at the set rate, unroofing the vein and feeding grains to the river | No |
| 14 | Drill rig probe | Instrument | Draggable derrick that sinks a vertical hole to 2 km; reports grade at 50 m intervals | Yes: drag |
| 15 | Ore-shell tracer | Overlay | Contour of every cell at or above cut-off grade; area × thickness gives tonnage | No |
| 16 | Gold pan | Instrument | Scoop placed on any river cell; reports flakes per pan after a 30 s wash | Yes: place |

**How it works — the model.**
Every tick the pluton loses heat to the country rock and the temperature field is recomputed; as it crystallises it releases brine at a rate tied to its cooling and water content. Fluid particles climb the fracture network at a speed set by permeability, each carrying the source's dissolved copper. Every step a particle checks the solubility curve: when its temperature falls into the 450–300 °C window it drops most of its copper there, so grade builds where hot fluid meets cool fractured rock, a shell around the pluton roof. In gold mode the trigger is the pressure drop when the fault opens, so quartz and gold grow one vein layer per earthquake. In placer mode the river sorts grains by size and density: gold settles where flow slows, quartz travels on. One metal and one solubility curve per setting is a simplification, honest because concentration by moving fluid is the whole story.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Deposit setting | Dropdown | Porphyry copper (subduction arc) / Mother Lode quartz-vein gold / Placer gold (foothill river) | Porphyry copper (subduction arc) | — | Structural: rebuilds the scene around a pluton, a fault zone or a river |
| Pluton roof depth | Slider | 1–6 | 2 | km | How deep the intrusion sits; sets pressure and cooling speed |
| Pluton temperature | Slider | 650–900 | 750 | °C | Starting heat; drives fluid release and the size of the hot halo |
| Fracturing | Slider | 0–100 | 60 | % of cells cracked | Stockwork density; controls the paths fluid can take |
| Water in the magma | Slider | 0–6 | 4 | wt % | Volume of brine released; 0 shuts the system off |
| Metal in source | Slider | 10–300 | 60 | ppm | Dissolved copper, or gold-equivalent, per fluid particle at release |
| Seismic cycle (gold mode) | Slider | 1–20 | 5 | kyr | Years between fault openings; sets vein growth rate |
| Erosion rate (placer mode) | Slider | 0.05–0.5 | 0.2 | mm/yr | Unroofing speed feeding the river |
| Cut-off grade | Slider | 0.1–2.0 | 0.5 | % Cu (g/t Au in gold modes) | Threshold for the ore-shell tracer |
| Time compression | Dial | 100–200,000 | 20,000 | yr/s | Model time per second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Copper shell, Andes style | Deposit setting=Porphyry copper (subduction arc); Pluton roof depth=2; Water in the magma=4; Fracturing=60 | Where does the ore shell sit relative to the pluton, and how many times richer is the ore than the 60 ppm the fluid started with? |
| S2 | Dry magma | Deposit setting=Porphyry copper (subduction arc); Water in the magma=0; Pluton temperature=850 | The pluton is hotter than in S1. Why is there no ore at all? |
| S3 | Mother Lode veins | Deposit setting=Mother Lode quartz-vein gold; Seismic cycle=5; Time compression=200,000 | How many vein layers form in 1 Myr, and why does the gold sit in a narrow steep band rather than a dome? |
| S4 | Forty-Niner placer | Deposit setting=Placer gold (foothill river); Erosion rate=0.2; Time compression=100 | Pan the inside bend, the straight reach and the bedrock pothole. Where do flakes collect, and what property of gold sorts it from the sand? |

**Student activities.**
1. Run the copper setting for 200 kyr of model time, then drag the drill rig across the pluton roof in 500 m steps; record grade against distance from the pluton edge and find the peak.
2. Set Water in the magma to 0 and re-run for the same time; record the ore tonnage and the fluid-released counter.
3. Predict where the ore shell will move when Pluton roof depth is set to 5 km, then run and record the peak-grade depth for both settings.
4. Switch to Mother Lode, run 1 Myr, and drill the vein; record vein width and vein layer count for seismic cycles of 2, 5 and 10 kyr.
5. Switch to Placer, place the gold pan at the inside bend, the straight reach and the pothole, and record flakes per pan at each; rank the three.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Grade at drill | Live numeric | % Cu or g/t Au | Metal content at each 50 m interval of the drill hole |
| Grade vs distance | Line graph | % vs km | Built as the drill is moved; shows the shell around the pluton |
| Ore tonnage | Live numeric | Mt | Cells above cut-off × thickness × 2.7 t/m³, updated per tick |
| Enrichment factor | Live numeric | × | Peak grade ÷ source concentration for the metal |
| Temperature at drill tip | Live numeric | °C | Heat-field value at the bottom of the hole |
| Fluid released | Counter | particles | Cumulative brine particles emitted by the pluton |
| Vein layer count | Counter | layers | Gold mode: seismic openings filled with quartz |
| Flakes per pan | Live numeric | flakes | Placer mode: result of the last pan at its position |
| Run log | Data table | mixed | Every drill, pan and tonnage reading; exportable CSV |

**What the student should realise.**
Students believe metals lie evenly through the ground, or that a mine can be dug anywhere. Here copper at 60 ppm is useless until a wet pluton concentrates it a hundredfold, and a dry pluton makes nothing; gold sits in river bends because it is seven times denser than sand. The student should be able to say: *"An ore body is where a geological process gathered a metal, so mines can only be where that process happened."*

### E6.2 · Energy resources

**Experiment name:** Basin Kitchen: Cooking Oil, Gas and Coal  
**Render mode:** 2.5D Layered  
**Simulation engine:** Procedural geology + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS3-1

**Theme & scene.**
A cross-section of a sedimentary basin 120 km wide and 8 km deep at vertical exaggeration 4×, drawn like a field sketch on warm parchment and shaped like the San Joaquin Valley: Coast Ranges on the left, Sierra foothills on the right, the floor sagging between. At the top a shallow sea teems with green plankton drizzling into dark olive mud. Layer by layer the basin fills: pale sands, brown silts, and a black organic-rich shale that sinks under the pile. Two dashed isotherms, the amber oil window and the red gas window, hang at their temperatures; as the shale crosses them it sweats droplets that migrate up to collect under an arched cap rock. A derrick waits at the cursor; controls dock right; a depth-time clock sits bottom-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Basin floor | Environment | Bowl-shaped granitic basement 120 km wide, grey; subsides at the set rate so the bowl deepens through the run | No |
| 2 | Sediment beds | Structure | One bed per 100 kyr, 30–200 m thick: sand cream, silt tan, mud olive, shale black; each carries its deposition age and permeability | No |
| 3 | Source-rock shale | Structure | Black organic-rich layer, Monterey-style, 200–600 m thick, laid down while the plankton rain is on; carbon content set by the organic control | No |
| 4 | Plankton rain | Particle | Green diatom flakes falling through the water column, 60 per tick, feeding the shale's carbon store | No |
| 5 | Coastal swamp (coal mode) | Environment | Peat marsh at the basin edge with reed and tree silhouettes; its bed buries to lignite, bituminous and anthracite as depth and heat rise | Yes: place |
| 6 | Geotherm field | Field | Temperature = 15 °C + gradient × depth, recomputed as beds stack; false-colour overlay when toggled | No |
| 7 | Oil and gas windows | Overlay | Dashed isotherms at 60 °C, 120 °C and 200 °C, amber band for oil and red for gas; fixed in temperature, so they move in depth when the gradient changes | No |
| 8 | Kerogen maturity store | Field | Per shale cell, the fraction of organic carbon converted, rising with time spent inside a window; drawn as a lightening of the black | No |
| 9 | Hydrocarbon droplets | Particle | Amber oil beads and pale-blue gas bubbles released from mature cells; buoyant, migrating up through sand, blocked by shale | No |
| 10 | Anticline trap | Structure | Fold in the beds, amplitude 0–1 km, with a shale cap arching over a sand reservoir; oil pools in the crest | Yes: drag, resize |
| 11 | Fault trap | Structure | Normal fault throwing a sand bed against shale; a second trap style the student places | Yes: place |
| 12 | Cap rock seal | Structure | Impermeable shale bed over the reservoir; can be swapped for leaky silt to show escape | Yes: swap |
| 13 | Erosion event | Field | Strips the top 2 km of fill at 40 Myr and lets gas escape to the surface as a plume of pale bubbles | No |
| 14 | Drilling derrick | Instrument | Placed anywhere on the surface; sinks a well to a chosen depth and reports what it hits: dry, water, oil, gas or coal, with the column found | Yes: place |
| 15 | Depth-time clock | Instrument | Model age in Myr and the current depth of the source shale's base | No |
| 16 | Coal rank meter (coal mode) | Instrument | Reads peat, lignite, bituminous or anthracite and energy per kilogram at the swamp bed's current depth | No |

**How it works — the model.**
Each tick the basin floor sinks and a new bed is laid, so every older bed moves deeper and hotter. A shale cell matures only while its temperature sits inside a window: between 60 and 120 °C it converts carbon to oil at a rate that doubles every 10 °C, above 120 °C remaining carbon and any oil still in place crack to gas, and beyond 200 °C it is spent. Released droplets rise through permeable beds and pool beneath the first impermeable shale, so nothing accumulates without a seal and a trap; swap the seal for silt and the oil escapes. Peat follows the same burial: rank and energy content climb with depth and temperature. Time compression up to 1 Myr per second makes the point: the basin needs tens of millions of years to make what a derrick lifts in decades. One conversion rate per window is a simplification, honest because depth, heat and time are the lesson.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Basin setting | Dropdown | Marine basin (San Joaquin) / Coastal swamp (coal) / Deep hot rift | Marine basin (San Joaquin) | — | Structural: sets the sediment mix, the organic source and the starting geotherm |
| Subsidence rate | Slider | 0.05–1.0 | 0.3 | mm/yr | How fast the floor sinks; burial depth reached per Myr |
| Sediment supply | Slider | 0.05–1.0 | 0.3 | mm/yr | Bed thickness per tick; the basin overfills when this exceeds subsidence |
| Organic content | Slider | 0.5–12 | 5 | % carbon | Carbon in the source shale; total hydrocarbon possible |
| Geothermal gradient | Slider | 15–60 | 30 | °C/km | Temperature gain per km; moves the windows up or down |
| Trap type | Dropdown | None / Anticline / Fault / Both | Anticline | — | Structural: which traps exist for oil to pool in |
| Cap rock seal | Toggle | On / Off | On | — | Whether the shale over the reservoir blocks migration |
| Erosion event | Toggle | Off / At 40 Myr | Off | — | Strips the top 2 km of fill mid-run |
| Time compression | Dial | 10,000–1,000,000 | 200,000 | yr/s | Model time per second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Kern County kitchen | Basin setting=Marine basin (San Joaquin); Subsidence rate=0.3; Geothermal gradient=30; Trap type=Anticline | How deep must the shale sink before oil appears, and how many million years does that take? Drill the crest and the flank: which hits oil? |
| S2 | Too hot, too fast | Basin setting=Deep hot rift; Geothermal gradient=55; Subsidence rate=1.0 | The same shale passes the oil window in a few Myr and keeps sinking. What does the derrick find instead of oil, and where did the oil go? |
| S3 | No lid | Trap type=Anticline; Cap rock seal=Off; Organic content=8 | The shale made more oil than in S1. Why does the derrick hit almost none? |
| S4 | Coal swamp to anthracite | Basin setting=Coastal swamp (coal); Subsidence rate=0.5; Time compression=1,000,000 | Read the rank meter every 20 Myr. What burial depth turns peat into bituminous coal, and how much does energy per kilogram rise? |

**Student activities.**
1. Run the San Joaquin setting at 200,000 yr/s and record the model age and shale depth when the first oil droplet appears and when the first gas bubble appears.
2. Place the derrick at the anticline crest, on its flank and outside the fold; drill each to 3 km and record what each hits and the oil column the crest well reports.
3. Predict where the oil window will sit when Geothermal gradient is set to 55 °C/km, then set it and record the window's depth and the age at which the shale enters it.
4. Set Cap rock seal to Off, re-run, and record oil trapped against oil generated; then drag the anticline larger and record whether trapped volume changes.
5. Switch to Coastal swamp, run 60 Myr, and record coal rank and energy per kilogram at 1, 2, 4 and 6 km of burial.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Source-rock temperature | Live numeric | °C | Temperature at the base of the shale, per tick |
| Maturity | Live numeric | % converted | Fraction of source carbon turned to oil or gas |
| Oil generated vs trapped | Bar chart | million barrels per km | Total made against total pooled under seals |
| Gas escaped | Counter | million m³ | Bubbles that reached the surface |
| Burial history | Line graph | °C vs Myr | Temperature of the shale through time with both windows shaded |
| Well result | Pass-fail badge | — | Dry, water, oil, gas or coal for each placed derrick, with the column found |
| Coal rank and energy | Live numeric | MJ/kg | Rank name and heating value at the swamp bed |
| Time to first oil | Timer | Myr | Model time until the first droplet is released |
| Run log | Data table | mixed | Every drill and clock reading; exportable CSV |

**What the student should realise.**
Students think oil comes from dinosaurs, sits in underground lakes, and lies anywhere deep enough. Here it is plankton mud cooked in a narrow depth-and-heat band over millions of years, held only where a seal stops it rising; too hot and it turns to gas, no seal and it is gone. The student should be able to say: *"Fossil fuels form only where the right rock was buried to the right depth for long enough, then trapped."*

### E6.3 · Groundwater as a resource

**Experiment name:** The Sinking Valley: Pumping the Aquifer  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS3-1

**Theme & scene.**
A 3D block of the San Joaquin Valley near Mendota, 80 km across, 30 km along and 1 km deep at vertical exaggeration 20×, seen from a low aerial angle under a hazy summer sky: almond orchards in neat blocks, a town, a canal, tawny Coast Ranges left, green Sierra foothills right. The front face is cut away to show the fill: coarse gravel fans at both edges, buff sand and silt between, and halfway down a blue-grey ribbon of Corcoran Clay. Every pore is a pale dot, blue where it holds water, so the water table reads as a sharp edge. Steel well pipes drop from the orchards. A survey pole with dated year-marks stands by a farmhouse. Controls dock right; a water-budget ledger sits bottom-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Valley basement | Environment | Impermeable dark-grey granite floor 1 km down, sagging gently toward the valley centre | No |
| 2 | Gravel fans | Structure | Cobbled wedges at both valley edges, porosity 25 %, high permeability; the entry points for river recharge | No |
| 3 | Sand-and-silt fill | Structure | Buff layered sediment filling the bowl, porosity 30 %, medium permeability; the unconfined upper aquifer | No |
| 4 | Corcoran Clay | Structure | Blue-grey layer 20–60 m thick at 100–300 m depth, spanning the set width; near-impermeable; splits the fill into upper and lower aquifers | Yes: resize |
| 5 | Confined aquifer | Structure | Sand below the clay, porosity 30 %; its pressure head drawn as a dashed line that can stand above the clay | No |
| 6 | Pore-water field | Field | Saturation and head per cell on a 400×100 grid; drawn as blue dot fill inside the cut face | No |
| 7 | Water table surface | Overlay | Blue line at the top of the saturated zone; dips into cones around pumping wells | No |
| 8 | Sierra river recharge | Particle | Blue droplets entering the right-hand fans from the Kings and Kaweah rivers; rate follows the snowpack control | No |
| 9 | Rain recharge | Particle | Sparse droplets over the whole surface at rainfall minus evaporation; most vanish before reaching the water table | No |
| 10 | Irrigation wells | Actor | Steel pipe with pump house; screen depth set by the student; each removes its rate from the cells around its screen; a red flag rises when the screen runs dry | Yes: place, drag, resize |
| 11 | Orchard blocks | Structure | Almond rows in 2 km blocks, each demanding 1.2 m of water per year; leaves yellow when the block's well is dry | Yes: place |
| 12 | Managed recharge basin | Structure | Shallow gravel pond that leaks river surplus into the aquifer at 1 m per day while surplus exists | Yes: place |
| 13 | Clay compaction rule | Field | Each clay cell compacts irreversibly when its head falls below the lowest head it has ever seen; the surface above drops by the sum | No |
| 14 | Survey pole | Instrument | Dated pole at the valley centre marking ground level each decade against a fixed benchmark, in the manner of Joseph Poland's 1977 photograph | Yes: drag |
| 15 | Piezometer probe | Instrument | Draggable tube reading water-table depth or pressure head at any point to 0.1 m | Yes: drag |
| 16 | Water-budget ledger | Instrument | Recharge in, pumping out, change in storage, per model year | No |

**How it works — the model.**
The aquifer is a grid of cells, each holding water up to its porosity. Every model year, recharge from rivers, rain and any basin enters the edge and surface cells, and each well removes its rate from the cells around its screen. Water then flows between neighbouring cells down the head gradient at a speed set by permeability, so a pumped well opens a cone of depression that deepens with pump rate and shrinks with permeability, and the water table falls wherever pumping outruns inflow. Below the Corcoran Clay the confined aquifer is fed only from its far ends, so its head drops fast when deep wells pump. A clay cell whose head falls below the lowest it has ever seen compacts for good, and the surface above drops by the total; sand rebounds, clay does not. Storage change equals recharge minus pumping minus outflow, printed yearly in the ledger. Time runs at 1 to 10 years per second.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Rainfall | Slider | 100–500 | 250 | mm/yr | Rain on the valley floor; most evaporates, the rest recharges |
| Sierra snowpack | Slider | 0–200 | 100 | % of average | River recharge entering the fans |
| Number of wells | Stepper | 0–24 | 8 | count | Structural: how many wells stand on the surface |
| Pump rate per well | Slider | 0–5 | 2 | million m³/yr | Withdrawal from each well |
| Well screen depth | Slider | 50–600 | 150 | m | Whether wells draw from above or below the Corcoran Clay |
| Managed recharge basins | Stepper | 0–6 | 0 | count | Structural: gravel ponds that leak river surplus into the aquifer |
| Drought run | Dropdown | None / 2012–2016 / 1976–1977 / Custom 10-year | None | — | Cuts rainfall and snowpack for the chosen years |
| Corcoran Clay extent | Slider | 0–80 | 60 | km | Width of the confining layer; 0 removes it |
| Time compression | Dial | 1–10 | 3 | yr/s | Model years per second |
| Pore overlay | Toggle | On / Off | On | — | Draws the pore-fill dots on the cut face |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Wet century | Number of wells=4; Pump rate per well=1; Sierra snowpack=100 | Run 50 years. Does the water table fall at all, and how do the ledger's recharge and pumping columns compare? |
| S2 | Overdraft, 1925 to 1977 | Number of wells=16; Pump rate per well=3; Well screen depth=400; Time compression=10 | Run 50 years. How far does the survey pole show the ground has dropped, and does it come back when pumping stops? |
| S3 | Drought 2012 to 2016 | Number of wells=12; Pump rate per well=3; Drought run=2012–2016 | Which wells go dry first, the shallow or the deep ones, and by how much does storage change over the five years? |
| S4 | Recharge fix | Managed recharge basins=4; Number of wells=12; Pump rate per well=2; Sierra snowpack=120 | With four basins, does storage recover in a wet year, and does the ground surface? |

**Student activities.**
1. Place four wells at 150 m and run 20 years; record the water-table depth at each well and 5 km away using the piezometer probe.
2. Set Pump rate per well to 4 and record the depth of the cone of depression under one well at 1, 5 and 10 years; sketch its shape.
3. Predict what happens to the pole when Well screen depth is set to 400 m, below the clay, then run 40 years and record the subsidence each decade.
4. Set Pump rate per well to 0 after the subsidence run, run 20 more years, and record how much of the water table and how much of the ground surface recover.
5. Place three recharge basins near the rivers, re-run S3, and record the storage change and the count of dry wells compared with the run without basins.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Water table at probe | Live numeric | m below surface | Depth to the saturated zone at the piezometer |
| Confined head | Live numeric | m | Pressure head below the clay, per tick |
| Storage | Line graph | km³ vs yr | Total water held in the block through time |
| Recharge vs pumping | Bar chart | million m³/yr | Yearly inflow against withdrawal; overdraft years shaded red |
| Subsidence at pole | Live numeric | m | Cumulative surface drop at the survey pole |
| Dry wells | Counter | count | Wells whose screen sits above the water table |
| Cone of depression | Vector overlay | m | Drawdown contours around each well on the cut face |
| Run log | Data table | mixed | Yearly ledger with every probe reading; exportable CSV |

**What the student should realise.**
Students picture groundwater as underground rivers and lakes that refill each winter, a level rain always restores. Here water sits in pores between grains, moves slowly, and the valley loses storage whenever pumping outruns recharge; deep pumping squeezes the clay and the land drops for good, nine metres near Mendota. The student should be able to say: *"Groundwater is a slow-filling store; pump it faster than it refills and it runs down, and the sunken ground never rises again."*

### E6.4 · Renewable versus nonrenewable resources

**Experiment name:** The Rate Room: Faster In or Faster Out?  
**Render mode:** 2D Canvas  
**Simulation engine:** Data-driven model  
**Interaction level:** Design  
**Session length:** 12–18 min  
**NGSS anchor:** MS-ESS3-1

**Theme & scene.**
A bright plant room drawn flat and clean like an engineer's schematic. Six tall glass tanks stand in a row on a steel bench, each wearing an illustrated badge: a Sierra forest, the Central Valley aquifer, a Monterey sardine shoal, an oil field under Bakersfield, a copper mine and a solar farm in the Mojave. Every tank has an inflow pipe from above with a spinning valve and an outflow pipe below leading to a hungry city silhouette on the right. Each tank's liquid is tinted to match its resource. Over each valve floats a rate dial; beneath the bench a shared time axis rolls the years past. A log-scale ladder of refill times climbs the left wall from one day to a hundred million years. Controls dock right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Resource tank | Structure | Glass cylinder 120×360 px, up to six instances, filled to the stock fraction; tint green (timber), blue (groundwater), silver (fish), black (oil), copper (ore), gold (sunlight); level animates each year | Yes: resize |
| 2 | Inflow pipe and valve | Actor | Pipe from above with a gate valve that spins at a rate ∝ regeneration; resource particles stream through it | Yes: drag |
| 3 | Outflow pipe and valve | Actor | Pipe from the base to the city; spins ∝ extraction; its drag handle sets the rate | Yes: drag |
| 4 | Regeneration process card | Structure | Illustration clipped to each inflow pipe of what refills the tank: tree growth, snowmelt recharge, fish spawning, plankton burial over 10 Myr, ore formation over 100 Myr, sunrise | Yes: swap |
| 5 | City sink | Environment | Skyline whose lit windows track demand met; window count grows with population | No |
| 6 | Flow particle stream | Particle | Droplets or blocks moving along each pipe at a rate proportional to the flow; the visible measure of every rate | No |
| 7 | Stock counter | Instrument | Number on each tank in real units: hectares of forest, km³ of water, tonnes of fish, billion barrels, Mt of copper, TWh per year of sunlight | No |
| 8 | Sustainability gauge | Instrument | Semicircular dial per tank showing extraction ÷ regeneration; green below 1, amber near 1, red above | No |
| 9 | Recycling loop | Structure | Return pipe from the city back to the copper or water tank carrying the recycled fraction; must be connected by the student | Yes: connect |
| 10 | Regeneration ladder | Overlay | Log-scale wall chart pinning each resource's refill time from one day (sunlight) to 10⁸ years (ore); a thread links each tank to its rung | No |
| 11 | Growth clock | Field | Multiplies extraction by (1 + growth) each year when population growth is above zero | No |
| 12 | Years-to-empty marker | Instrument | Flag on the time axis projecting when a tank runs dry at current rates | No |
| 13 | Solar flux tank | Structure | Sixth tank has no lid and no level: sunlight passes straight through as a flux, unstored, so its stock reads infinite at any extraction rate | No |
| 14 | Time axis | Instrument | Scrolling axis beneath the bench for the chosen run length with the current year highlighted | No |

**How it works — the model.**
Each tank is a stock S with an inflow R, the regeneration rate, and an outflow E, the extraction rate. Every model year S changes by R minus E; when S reaches zero the outflow stops and the city dims. Living resources regrow in proportion to what is left, so a half-empty timber or fish tank refills more slowly and an emptied one does not regrow at all. Groundwater refills at a fixed rate set by climate. Oil and ore have refill times of 10 to 100 million years, so their inflow is drawn as one particle every few centuries, which is nonzero but useless. Sunlight arrives at a fixed flux that cannot be banked, so its tank never falls. A recycling loop returns a fraction of extracted copper or water. The sim defines renewable as an inequality, E ≤ R, never as a label on the material, and the gauge reports the ratio every year.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Resources on the bench | Multi-select | Timber / Groundwater / Fish / Oil / Copper / Sunlight | Timber, Groundwater, Oil | — | Structural: which tanks are built |
| Extraction rate | Slider (per tank) | 0–200 | 100 | % of natural regeneration | Outflow valve setting relative to the tank's natural inflow |
| Regeneration rate | Slider (per tank) | 0–200 | 100 | % of natural | Inflow valve; stands for climate, breeding or growth conditions |
| Population growth | Slider | 0–3 | 1 | %/yr | Extraction grows each year by this fraction |
| Recycling fraction | Slider | 0–90 | 0 | % | Share of extracted copper or water returned by the loop |
| Starting stock | Slider | 10–100 | 100 | % full | Level each tank starts at |
| Run length | Dropdown | 50 / 100 / 200 / 500 | 100 | yr | Span of the time axis |
| Time compression | Dial | 1–50 | 10 | yr/s | Model years per second |
| Show regeneration ladder | Toggle | On / Off | On | — | Reveals the log-scale refill-time chart |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Living within the inflow | Resources on the bench=Timber, Groundwater, Fish; Extraction rate=80; Population growth=0 | After 100 years, which tanks are as full as they started, and what does each sustainability gauge read? |
| S2 | Renewable, until it isn't | Resources on the bench=Timber, Fish; Extraction rate=150; Run length=200 | Timber regrows, so it is renewable. Why is the tank empty after about 60 years, and does regrowth restart? |
| S3 | Oil at any speed | Resources on the bench=Oil, Copper, Sunlight; Extraction rate=10; Run length=500 | Even at a tenth of today's rate, when does the oil run out, and why does the sunlight tank never move? |
| S4 | Central Valley overdraft | Resources on the bench=Groundwater; Extraction rate=140; Regeneration rate=70; Recycling fraction=0 | Groundwater is called renewable. What is the years-to-empty at these rates, and how far must extraction fall to turn the gauge green? |

**Student activities.**
1. Set every tank's Extraction rate to 80 and run 100 years; record each stock at the end and each gauge reading.
2. Drag the timber outflow valve to 150 and run; record the year the tank empties and whether inflow particles keep arriving afterward.
3. Predict the years-to-empty for oil at Extraction rate 10, then run 500 years and record the marker's year and the number of inflow particles seen.
4. Connect the recycling loop to the copper tank, set Recycling fraction to 60, and record the change in years-to-empty.
5. Rebuild the bench with groundwater only, set Regeneration rate to 70 to stand for a dry decade, and find by trial the extraction rate at which the stock stays level; record it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Stock vs time | Line graph | % full vs yr | One trace per tank; the sustainable ones stay flat |
| Sustainability ratio | Live numeric | — | Extraction ÷ regeneration per tank, updated yearly |
| Years to empty | Live numeric | yr | Projected exhaustion at current rates; reads "never" while the ratio is below 1 |
| Inflow vs outflow | Bar chart | units/yr | Paired bars per tank in the resource's own unit |
| Refill time | Data table | yr | Regeneration time for each resource on the ladder |
| Renewable at this rate | Pass-fail badge | — | Green when extraction stayed at or below regeneration for the whole run |
| City brightness | Live numeric | % | Share of demand met this year |
| Run log | Data table | mixed | Yearly stock, flows and ratio per tank; exportable CSV |

**What the student should realise.**
Students sort resources into two fixed boxes: trees and water renewable, oil and metal not. Here the label turns out to be a comparison of rates: timber cut faster than it regrows runs out and stays out, groundwater pumped beyond recharge behaves like oil, and oil refills so slowly that no human rate is small enough. The student should be able to say: *"A resource is renewable only while we take it more slowly than nature replaces it."*

### E6.5 · Constructing an explanation for resource distribution

**Experiment name:** Why Here? The Resource Detective's Board  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-ESS3-1

**Theme & scene.**
A detective's cork board on a dark slate wall. Its left two-thirds is a map of California in the California Albers projection, brushed relief in muted greys, with resource pins like coloured thumbtacks: gold for the Mother Lode, black for Kern County oil, red for The Geysers steam, white for Boron borax, blue for Central Valley groundwater, violet for Mountain Pass rare earths, silver for New Almaden mercury, green for Salton Sea lithium. Translucent geological layers can be laid over the map one at a time, each with its own edge colour. On the right hangs the explanation board: a resource card on top, empty process-card slots beneath, and red string ready to pin between cards and map evidence. Controls dock bottom-right; a verdict lamp glows above the board.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Base map | Environment | California Albers relief, 1000×1100 px, county lines faint; world mode swaps to Equal Earth | No |
| 2 | Resource pin set | Overlay | 40 California and 60 world deposits and resources, each with type, size or output and discovery year; hover shows a fact card | No |
| 3 | Layer: rock type | Overlay | Granite batholith, metamorphic belt, marine sedimentary basin, volcanic field, evaporite basin, alluvial fill; each a translucent tint | No |
| 4 | Layer: plate setting | Overlay | Ancient subduction arc, modern transform, the spreading centre under the Salton Trough and the Sierra batholith margin as tinted bands | No |
| 5 | Layer: faults | Overlay | Melones, San Andreas, Garlock and Hayward as red lines the buffer tool can follow | No |
| 6 | Layer: ancient environment | Overlay | Where a shallow sea, a swamp, a closed desert lake or a river once lay, redrawn by the time scrubber from 200 Myr ago to now | No |
| 7 | Layer: heat flow and rainfall | Overlay | Two scalar rasters, crustal heat flow and mean annual precipitation, each colour-ramped | No |
| 8 | Time scrubber | Instrument | Timeline from 200 Myr ago to present that redraws the ancient-environment layer | Yes: drag |
| 9 | Process-card deck | UI-Probe | 24 cards, each a named process with an icon: subduction melting, hydrothermal fluid cooling, fault pumping, uplift and erosion, river sorting by density, plankton burial, heating in the oil window, evaporation of a closed lake, snowmelt recharge into gravel, magma heating groundwater, and more | Yes: place |
| 10 | Explanation board | UI-Probe | Resource card at top, three to six ordered slots with arrows between them; cards snap into slots and can be reordered | Yes: place, connect |
| 11 | Evidence string | UI-Probe | Red string dragged from a process card to a map layer, a buffer count or a pin cluster; each string carries the measurement it was tied to | Yes: connect |
| 12 | Buffer and overlap tool | Instrument | Draws a band along any layer edge or fault and reports the share of the resource's pins inside it against the share of map area | Yes: drag, resize |
| 13 | Causal-graph scorer | Field | Hidden graph of which process legitimately feeds which; scores order, completeness and whether each card has evidence attached | No |
| 14 | Prediction lamp | Instrument | Once a chain is accepted, shades every map region where the same processes occurred; pins there light up if the resource exists | No |
| 15 | Random-location tester | Instrument | Drops markers at random points and asks the board whether the chain predicts the resource there | No |
| 16 | Verdict lamps and rubric | Instrument | Three lamps, Chain valid, Evidence attached, Prediction confirmed, plus a rubric score out of 100 | No |

**How it works — the model.**
The engine holds a causal graph: for every resource type, the chain of processes that produced it and the layer signature each process leaves. Mother Lode gold links subduction, fault pumping of hot fluid, quartz-vein precipitation, then uplift and erosion; borax at Boron links volcanic heat, a closed desert lake and evaporation. When the student drops cards on the board the scorer checks three things. Order: each card must be a legitimate parent of the next. Evidence: each card needs a string tied to a layer overlap, a buffer count or a pin cluster, and the buffer tool reports the actual share of pins inside the band against the share of area, so "gold follows the Melones fault" has a number behind it. Prediction: the accepted chain is projected onto the map and the lamp counts known deposits it finds and random points it wrongly predicts. Score = 40 % order + 40 % evidence + 20 % prediction.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Resource under investigation | Dropdown | Mother Lode gold / Kern County oil / The Geysers geothermal / Boron borax / Central Valley groundwater / Mountain Pass rare earths / Salton Sea lithium / New Almaden mercury | Mother Lode gold | — | Structural: sets the pins, the resource card and the hidden answer chain |
| Map extent | Radio | California / World | California | — | Swaps projection and pin set |
| Active layer | Dropdown | None / Rock type / Plate setting / Faults / Ancient environment / Heat flow / Rainfall | Rock type | — | Which overlay is drawn |
| Layer opacity | Slider | 10–90 | 50 | % | Transparency of the active overlay |
| Buffer width | Slider | 5–100 | 20 | km | Band width of the buffer tool |
| Ancient time | Timeline scrubber | 200 Myr ago–present | 15 Myr ago | Myr | Which past environment is drawn |
| Card slots | Stepper | 3–6 | 4 | count | Length of the explanation chain required |
| Scoring strictness | Radio | Guided / Standard / Expert | Standard | — | Guided highlights valid next cards; Expert hides the rubric until submission |
| Random test points | Stepper | 5–50 | 20 | count | How many random locations the tester drops |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Follow the gold | Resource under investigation=Mother Lode gold; Active layer=Faults; Buffer width=20 | What share of gold pins lie within 20 km of the Melones fault zone, and what share of California's area does that band cover? Build the chain that explains it. |
| S2 | Oil where the sea was | Resource under investigation=Kern County oil; Active layer=Ancient environment; Ancient time=15 Myr ago | Scrub time to 15 Myr ago. Where was the sea, and how does that outline compare with the oil pins? |
| S3 | Borax in the desert | Resource under investigation=Boron borax; Active layer=Heat flow; Buffer width=10 | Boron sits in the Mojave with no ore-bearing pluton. Which two layers together explain the deposit, and what chain lights all three lamps? |
| S4 | Predict the world | Resource under investigation=Mother Lode gold; Map extent=World; Random test points=30 | Project your gold chain onto the world. How many known deposits does it find, and how many random points does it wrongly light? |

**Student activities.**
1. Set Active layer to Faults, lay the buffer tool 20 km along the Melones fault, and record the share of gold pins inside against the share of area.
2. Drag four process cards into the board in the order you think formed the Mother Lode, tie a string from each to a layer or count, and record the three verdict lamps.
3. Rebuild the chain in a wrong order on purpose, and record which lamp goes out and the reason the scorer prints.
4. Switch to Kern County oil, scrub Ancient time from 200 Myr ago to present, and record the age at which the sea covered the oil pins.
5. Set Map extent to World with your accepted gold chain and record hits, misses and false predictions from the prediction lamp.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Buffer share | Live numeric | % | Share of the resource's pins inside the band against share of map area |
| Enrichment ratio | Live numeric | — | Pin share ÷ area share, the strength of the spatial link |
| Chain validity | Pass-fail badge | — | Every card a legitimate parent of the next |
| Evidence coverage | Live numeric | % | Cards with a string tied to a measurement |
| Prediction hits and false alarms | Bar chart | count | Known deposits found against random points wrongly predicted |
| Rubric score | Live numeric | /100 | Weighted order, evidence and prediction score |
| Layer correlation table | Data table | % | Pin share inside each layer's footprint, every layer, for the chosen resource |
| Explanation export | Data table | mixed | Cards, order, strings and measurements; exportable CSV |

**What the student should realise.**
Students explain a resource's location by luck, or by where people looked. Here a location is the visible end of a chain of processes, each of which left a mark on a map layer, and the chain can be scored on whether it fits the evidence and predicts deposits elsewhere. The student should be able to say: *"Resources are where they are because a specific geological process put them there, and I can show the evidence for each step."*

---

*GradeNext Smart Lab · Grade 7 Unit E · 30 experiment specifications · standard v1.0*