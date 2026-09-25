# GradeNext Smart Lab · Simulation Experiment Book
## Grade 7 · Unit B · Chemical Reactions and Conservation of Matter

**California Integrated Science, Grade 7** · Domain: Chemistry · 6 topics · 30 experiments
**NGSS performance expectations anchored:** MS-PS1-2, MS-PS1-3, MS-PS1-4, MS-PS1-5, MS-PS1-6
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
| B1.1 | Physical changes | The Split-Screen Bench: Same Particles, New Shape | Hybrid 2D+3D | Molecular + Fluid/thermal | Investigate | 18–25 min |
| B1.2 | Chemical changes | Bond Breaker: Where New Substances Come From | 3D Scene | Molecular + State machine | Investigate | 18–25 min |
| B1.3 | Cases that are easy to confuse | The Sorting Bench: Seven Awkward Cases | 2.5D Layered | State machine + Data-driven model | Argue-from-data | 18–25 min |
| B1.4 | Properties before and after | The Fingerprint Bench: Six Tests, Twice Over | 3D Scene | Data-driven model + State machine | Investigate | 18–25 min |
| B1.5 | Reversibility as a clue, not a rule | The Undo Lever: When Going Back Proves Nothing | Hybrid 2D+3D | State machine + Data-driven model | Argue-from-data | 18–25 min |
| B2.1 | Signs a reaction may have occurred | The Signal Bench: Five Detectors, Two Liars | 3D Scene | State machine + Particle system | Investigate | 18–25 min |
| B2.2 | Analyzing property data before and after | The Difference Machine: Signal, Noise and Proof | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| B2.3 | Identifying an unknown from a property table | Five White Powders at the Assay Office | 3D Scene | Data-driven model + State machine | Investigate | 18–25 min |
| B2.4 | Why appearance alone is not proof | Blind Judgement: Six Pairs of Twins | Hybrid 2D+3D | State machine + Data-driven model | Argue-from-data | 18–25 min |
| B2.5 | Naming a reaction from what goes in and comes out | The Name Plate Workbench: Building Word Equations | 3D Scene | Molecular + State machine | Design | 18–25 min |
| B3.1 | Mass before and after, in a closed container | The Sealed Flask That Never Loses a Gram | Hybrid 2D+3D | Molecular + Data-driven model | Investigate | 12–18 min |
| B3.2 | Mass before and after, in an open container | Where Did the Grams Go? Catching the Escape | Hybrid 2D+3D | Molecular + Fluid/thermal | Investigate | 18–25 min |
| B3.3 | Atom-counting diagrams | The Balance Bench: No Atom Left Behind | 2D Canvas | State machine + Molecular | Design | 12–18 min |
| B3.4 | Why mass conservation follows from atom conservation | The Atom Bank: Rearrange All You Like | 3D Scene | Molecular | Investigate | 18–25 min |
| B3.5 | Applying conservation to an unfamiliar reaction | The Missing Product: Weigh What You Cannot See | Hybrid 2D+3D | Data-driven model + Molecular | Argue-from-data | 18–25 min |
| B4.1 | Energy added and particle motion, revisited | Joules In, Speed Up: The Calorimeter Bench | Hybrid 2D+3D | Fluid/thermal + Particle system | Investigate | 12–18 min |
| B4.2 | Forces between particles | Pull Them Apart: The Stickiness Dial | 3D Scene | Molecular + Field/vector | Manipulate | 18–25 min |
| B4.3 | Reading a heating curve | The Heating Curve Rig: Five Segments, One Substance | Hybrid 2D+3D | Fluid/thermal + Particle system | Investigate | 18–25 min |
| B4.4 | Why temperature plateaus during a state change | Follow the Joule: Speed Up or Pull Apart | Hybrid 2D+3D | Particle system + Fluid/thermal | Argue-from-data | 18–25 min |
| B4.5 | Predicting a heating curve for a new substance | Draw It Before You Heat It | Hybrid 2D+3D | Data-driven model + Fluid/thermal | Design | 18–25 min |
| B5.1 | Petroleum and plastics | The Column and the Chain | Hybrid 2D+3D | Fluid/thermal + Molecular | Investigate | 18–25 min |
| B5.2 | Ores and alloys | Rock to Blade: Smelter and Alloy Furnace | 3D Scene | Fluid/thermal + Data-driven model | Design | 18–25 min |
| B5.3 | Medicines and synthetic fibers | Willow to Tablet, Melt to Thread | Hybrid 2D+3D | Molecular + State machine | Investigate | 18–25 min |
| B5.4 | Benefit and cost of a synthetic material | Cradle to Grave: The Life-Cycle Bench | 2.5D Layered | Data-driven model | Argue-from-data | 18–25 min |
| B5.5 | Comparing a natural and synthetic alternative | Same Test, Two Materials | 3D Scene | Data-driven model + Rigid-body | Investigate | 18–25 min |
| B6.1 | Criteria and constraints | Write the Spec, Break the Spec | Hybrid 2D+3D | State machine + Data-driven model | Design | 12–18 min |
| B6.2 | Choosing a chemical process | The Reagent Shortlist | 3D Scene | Fluid/thermal + Molecular | Investigate | 18–25 min |
| B6.3 | Collecting temperature data | Six Probes, One Truth | Hybrid 2D+3D | Fluid/thermal + Data-driven model | Investigate | 18–25 min |
| B6.4 | Modifying the design | Version Seven: The Iteration Bench | Hybrid 2D+3D | Data-driven model + Fluid/thermal | Design | 18–25 min |
| B6.5 | Reporting the final design | Defend the Build: The Review Panel | Hybrid 2D+3D | Data-driven model + State machine | Argue-from-data | 18–25 min |

---

## B1 · Physical change versus chemical change

### B1.1 · Physical changes

**Experiment name:** The Split-Screen Bench: Same Particles, New Shape  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-2

**Theme & scene.**
The screen splits horizontally. The upper two-thirds is an ordinary school lab in flat daylight: a white tiled splashback, a 250 mL Pyrex beaker sitting on a black ceramic hotplate, a digital balance to the left with its display angled at the camera, and a heat-proof mat holding tongs, a glass stirring rod and a watch glass. An evaporating basin waits on a tripod at the back right. The lower third is a dark navy window headed PARTICLE VIEW, 4 nm wide with a white scale bar, showing the very same material as spheres that jostle, slide or fly apart. A brass sample ring clipped to the beaker marks where the two views are locked together. Controls dock right; a particle inventory strip runs along the bottom edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | 250 mL Pyrex beaker | Instrument | Borosilicate cylinder 70 mm ⌀ × 95 mm, 2 mm wall, 50 mL graduations, pouring lip; contents render as continuous fluid with a real meniscus, never as visible balls | Yes: swap |
| 2 | Ceramic hotplate with magnetic stirrer | Instrument | 150 mm white ceramic top on a grey steel body, two knobs, an orange HOT lamp that stays lit until the plate falls below 50 °C; 25 mm PTFE stirrer flea spins in the beaker | Yes: drag |
| 3 | Digital balance | Instrument | 220 g × 0.01 g, draught shield, TARE key, four-digit display; sums the mass of everything inside the vessel boundary every 0.1 s | No |
| 4 | Watch glass lid | Structure | 80 mm concave glass disc; when seated it closes the vessel boundary so vapour cannot leave, and droplets bead on its underside after ~20 s of boiling | Yes: place |
| 5 | Evaporating basin on tripod and gauze | Instrument | 90 mm porcelain basin, unglazed outside, on a 150 mm steel tripod over wire gauze; used for the salt-recovery run | Yes: place |
| 6 | Glass stirring rod | Instrument | 6 mm × 200 mm solid rod, fire-polished ends; dragging it through liquid triples the local dissolution rate along its path | Yes: drag |
| 7 | Crucible tongs | Instrument | 250 mm sprung nickel-plated steel; the only way to lift hot glassware, and the sim refuses a bare-hand grab on anything above 45 °C | Yes: drag |
| 8 | Thermometer on clamp stand | Instrument | −10 to 250 °C stem thermometer in a boss-head clamp, bulb held 10 mm above the vessel floor; reads the liquid, not the plate | Yes: drag |
| 9 | Water molecule | Particle | Bent triad, O red r = 0.66 Å, two H white r = 0.31 Å, O–H 0.096 nm, angle 104.5°; ~900 instances; faint cyan halo in the liquid state, halo dropped in vapour | No |
| 10 | Sodium and chloride ions | Particle | Na⁺ violet sphere r = 1.02 Å, Cl⁻ green sphere r = 1.81 Å, alternating on a 5×5×5 cubic lattice; an ion detaches only once six water molecules complete a hydration shell around it | No |
| 11 | Sucrose molecule | Particle | Two fused rings, C charcoal, O red, H white, 45 atoms, compact cluster ≈1.0 nm across; stays intact in every run on this bench | No |
| 12 | Wax and butter chains | Particle | Zig-zag 18-carbon chains, matte cream, one kink at a double bond; stacked in ranks when solid, slithering past each other when melted | No |
| 13 | Aluminium foil strip and lattice | Structure | 100 × 30 mm silvery foil in the bench view; in the particle view an 8×8×8 close-packed sphere pack, r = 1.43 Å, that splits along one plane when torn, both halves keeping identical spacing | Yes: resize |
| 14 | Mortar and pestle | Instrument | 90 mm unglazed porcelain mortar with a 110 mm pestle; each grind stroke halves mean fragment size down to a 0.2 mm floor | Yes: drag |
| 15 | Particle view window and sample ring | UI-Probe | Framed lower panel, field of view 1–50 nm, navy ground, white scale bar, 30 fps; a brass collar clipped to any vessel or object chooses the region shown | Yes: drag |
| 16 | Particle inventory strip | Overlay | Bottom bar with one tile per species (H₂O, Na⁺, Cl⁻, sucrose, wax chain, Al), each showing a live count and a padlock icon that stays shut for the whole run | No |

**How it works — the model.**
Every substance owns a particle library, and each particle carries a species ID the engine is forbidden to rewrite during a physical run: the padlocks on the inventory strip are the visible promise. The hotplate injects energy, mean particle speed follows v ∝ √T, and state changes fire when mean kinetic energy crosses a per-substance threshold: lattice sites unlock at the melting threshold, surface particles escape above the boiling threshold. Dissolving is modelled as competition, not disappearance: an ion leaves the lattice only when six water molecules complete a hydration shell, and it rejoins if the shell breaks. Grinding and tearing act on the mesh, splitting it along a plane while leaving spacing and species untouched. The balance sums particles inside the vessel boundary, so an open beaker genuinely loses mass to escaping vapour while a lidded one does not. The bench view must always render bulk matter as continuous, because drawing tiny balls inside a drawn liquid is itself the misconception.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Substance | Dropdown | Ice and water / Salt in water / Sugar lump / Butter / Candle wax / Aluminium foil | Ice and water | — | Loads the sample and swaps the particle library in the lower window |
| Action | Radio | Heat / Cool / Crush or tear / Stir to dissolve | Heat | — | Which physical process the bench performs |
| Hotplate setpoint | Slider | 0–250 | 20 | °C | Energy delivered to the vessel; drives melting and boiling |
| Watch-glass lid | Toggle | On / Off | Off | — | Closes or opens the vessel boundary the balance sums over |
| Stirrer speed | Slider | 0–900 | 0 | rpm | Rate at which hydration shells form on the salt lattice |
| Particle view width | Slider | 1–50 | 4 | nm | Field of view of the lower window |
| Species labels | Toggle | On / Off | On | — | Prints the chemical name on every particle in the lower window |
| Vessel | Dropdown | 250 mL beaker / 100 mL beaker / Evaporating basin | 250 mL beaker | — | Which apparatus the sample sits in, changing surface area for evaporation |
| Playback speed | Dial | 0.25×–20× | 1× | — | Time scaling for slow processes such as evaporation |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Ice to steam, sealed | substance=Ice and water; lid=On; setpoint=120; playback=4× | Solid, then liquid, then gas. How many species does the inventory strip list at each stage, and does any count change? |
| S2 | The vanishing water | substance=Ice and water; lid=Off; setpoint=120 | The balance reading falls by 14 g. Where did those particles go, and are they still the same particles? |
| S3 | Owens Lake in a basin | substance=Salt in water; vessel=Evaporating basin; setpoint=90; stirrer=300 | The salt disappears, then reappears as crust when the water goes. What happened to the ions in between? |
| S4 | Grind, tear, still the same | substance=Sugar lump; action=Crush or tear; particle view=2 nm | Powdered sugar looks nothing like a lump. Does the particle view show any new kind of particle? |

**Student activities.**
1. Set the lid On, run S1 from −10 °C to 120 °C, and record the inventory count for H₂O at 0 °C, 50 °C and 110 °C.
2. Run the same heating with the lid Off and record the balance every 30 s; state in one sentence why the two runs disagree.
3. Drag the sample ring onto the beaker wall during boiling and describe what the escaping particles are doing differently from the liquid ones.
4. Stir salt into water, then swap to the evaporating basin and run to dryness. Measure the recovered crust on the balance and compare with the mass you started with.
5. Crush the sugar lump with the pestle for six strokes, then predict, before you look, what the particle inventory will read. Check it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Balance mass | Live numeric | g | Total mass inside the vessel boundary, 2 dp, refreshed 10×/s |
| Liquid temperature | Live numeric | °C | Thermometer stem reading, with a plateau visible during melting and boiling |
| Temperature vs time | Line graph | °C vs s | Shows the flat steps where energy goes into rearranging rather than heating |
| Particle inventory | Counter | count | One live count per species; the padlock icon marks that no count may change |
| Mean particle speed | Live numeric | m/s | Average speed in the particle window, updated every 0.5 s |
| Run log | Data table | mixed | One row per run: substance, action, start and end mass, recovered mass; exportable CSV |

**What the student should realise.**
Students believe that when sugar dissolves or water boils away, the substance is gone or has turned into something else. Here the particle inventory is padlocked and never changes, and a boiled-off gram comes back on the balance the moment the lid is fitted. Only spacing, arrangement and speed changed. The student should be able to say: *"In a physical change the particles are rearranged, not remade, so the substance is still there and I can usually get it back."*

### B1.2 · Chemical changes

**Experiment name:** Bond Breaker: Where New Substances Come From  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A fume hood dominates the frame, sash lowered to a working 40 cm, its interior lit cool white while the lab behind falls into shadow. On the hood floor sit a heat-proof mat, a Bunsen burner with a knurled air-hole collar, and a stand holding a boiling tube whose delivery tube dips into a small test tube of clear limewater. A conical flask closed with a rubber stopper feeds a 100 mL glass gas syringe clamped horizontally. A balance sits just outside the sash. Floating above the reaction zone is a translucent BOND VIEW bubble showing atoms as CPK spheres joined by bond cylinders. Top right, an atom inventory panel lists element tiles with a BEFORE and an AFTER count.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Fume hood and sash | Environment | 1.2 m stainless cabinet, toughened glass sash on counterweights, white LED strip, faint extract hum and a drifting airflow ribbon at the sash line | Yes: resize |
| 2 | Bunsen burner | Instrument | 130 mm barrel on a cast base, gas tap, knurled air-hole collar; flame renders as a lazy 90 mm yellow safety flame when the collar is shut and a 70 mm roaring blue cone with an inner cone when open | Yes: drag |
| 3 | Crucible tongs and pipe-clay triangle | Instrument | 250 mm sprung tongs plus a wire triangle on the tripod; the ribbon can only be held in the flame with the tongs | Yes: drag |
| 4 | Magnesium ribbon | Actor | 40 × 5 × 0.2 mm dull silver strip with an oxide bloom, mass 0.05–0.50 g; ignites to a clipped, deliberately over-exposed white flare and leaves a crumbly white ash | Yes: swap |
| 5 | Boiling tube with delivery tube and bung | Instrument | 150 × 25 mm tube, one-hole bung, right-angle glass delivery tube 8 mm bore running into the limewater tube | Yes: connect |
| 6 | Limewater test tube | Instrument | 100 × 16 mm tube of clear saturated calcium hydroxide; turns milky over 6 s once CO₂ bubbles arrive, opacity tied to gas volume delivered | No |
| 7 | Conical flask, stopper and gas syringe | Instrument | 100 mL flask, tight rubber stopper, 100 mL graduated glass syringe with a low-friction plunger; plunger travel reads gas produced to 1 mL | Yes: connect |
| 8 | Digital balance | Instrument | 220 g × 0.01 g with a draught shield; sums only the mass inside the chosen vessel boundary | No |
| 9 | Oxygen molecule | Particle | Two red spheres r = 0.66 Å joined by a double bond drawn as twin cylinders 0.121 nm long; ~600 drifting in the hood air | No |
| 10 | Magnesium atom | Particle | Dark green sphere r = 1.41 Å, packed in a metallic lattice inside the ribbon | No |
| 11 | Magnesium oxide unit | Particle | Alternating Mg green and O red spheres in a rigid cubic lattice, rendered chalk-white in bulk | No |
| 12 | Copper carbonate and its products | Particle | Green CuCO₃ lattice; on decomposition it yields black CuO grains plus free CO₂ triads (C charcoal r = 0.76 Å between two red O, C=O 0.123 nm) | No |
| 13 | Bond cylinder | Structure | 0.35 Å-radius cylinder between bonded atoms, single or double; carries a stored energy value and flashes white then recoils as two stubs when it breaks | No |
| 14 | Bond view bubble | UI-Probe | Translucent sphere 260 px across hovering over the reaction site, field of view 0.5–5 nm, showing every bond break and bond formation in real time | Yes: drag |
| 15 | Atom inventory panel | Overlay | Element tiles (Mg, O, C, Cu, Fe, S, H, Na) each with BEFORE and AFTER counts computed from the live scene graph, plus a green EQUAL lamp | No |
| 16 | Energy ledger and temperature probe | Instrument | Stainless probe in the vessel plus a side bar showing energy in to break bonds, energy out to make bonds, and the net figure driving the temperature trace | No |

**How it works — the model.**
Each reaction is a three-state machine: reactants, activated, products. The system will not leave the reactant state until the flame or spark supplies the activation energy for that reaction, which is why a magnesium ribbon can sit in air all day and do nothing. Bonds are real objects with stored energies. On activation the engine breaks the listed reactant bonds, holds the free atoms for two frames so the student sees them loose, then forms product bonds. Net energy equals bonds broken minus bonds formed, and that number, not a script, drives the temperature probe, so exothermic runs warm and the copper carbonate decomposition cools its surroundings while it is heated. Atoms are never created or destroyed: the inventory panel counts spheres actually present in the scene graph. Mass behaviour follows the vessel boundary, so burning magnesium in an open crucible gains mass from air while a stoppered flask holds steady even as the syringe fills.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reaction | Dropdown | Magnesium + oxygen / Heat copper carbonate / Iron + sulfur / Baking soda + vinegar / Methane + oxygen | Magnesium + oxygen | — | Loads reactants, apparatus preset and product set |
| Bunsen air hole | Radio | Shut (safety flame) / Half open / Fully open (roaring) | Shut (safety flame) | — | Flame colour and the heat delivered; a shut collar cannot reach ignition |
| Ignite or start | Stepper | Press to fire | Not fired | — | Delivers the activation energy for one attempt |
| Mass of solid reactant | Slider | 0.05–0.50 | 0.20 | g | How many atoms enter the reaction, and so how much product forms |
| Vessel | Dropdown | Open crucible / Stoppered flask + gas syringe / Boiling tube + limewater | Open crucible | — | Structural change: sets the boundary the balance sums over and where gas goes |
| Bond view | Toggle | On / Off | On | — | Shows or hides the bond-breaking bubble |
| Bond view width | Slider | 0.5–5.0 | 1.5 | nm | Zoom of the molecular bubble |
| Atom inventory | Toggle | On / Off | On | — | Shows the before and after element counts |
| Sash height | Slider | 0–60 | 40 | cm | Airflow at the opening; above 50 cm the sim posts a virtual safety warning |
| Playback speed | Dial | 0.1×–4× | 1× | — | Slows the reaction to human speed at the bond scale |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The ribbon that gains weight | reaction=Magnesium + oxygen; vessel=Open crucible; mass=0.20; air hole=Fully open | The ash weighs more than the ribbon did. Which atoms joined it, and where did they come from? |
| S2 | Sealed fizz | reaction=Baking soda + vinegar; vessel=Stoppered flask + gas syringe; playback=1× | The syringe fills with 62 mL of gas. Why does the balance reading not fall? |
| S3 | Green to black | reaction=Heat copper carbonate; vessel=Boiling tube + limewater; air hole=Fully open | The limewater turns milky and the powder turns black. Name the two new substances and say how you know each is new. |
| S4 | Grey mix, black solid | reaction=Iron + sulfur; vessel=Boiling tube + limewater; mass=0.40; air hole=Half open | Before heating a magnet pulls the iron out of the mixture. After heating it does not. What changed? |

**Student activities.**
1. Set the air hole to Shut and press Ignite on the magnesium. Record what happens, then repeat with the collar Fully open and explain the difference in one sentence.
2. Tare the balance, burn 0.20 g of ribbon in the open crucible, and record the mass before and after. Read the oxygen tile in the atom inventory.
3. Rebuild the rig as a stoppered flask with the gas syringe, run the baking soda and vinegar, and record both the syringe volume and the balance mass every 10 s.
4. Set playback to 0.1× with the bond view on and write down, in order, the three things you see happen to the bonds.
5. Connect the delivery tube to the limewater and heat the copper carbonate. Record the time for the limewater to turn milky and name the gas.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom inventory | Data table | count | Before and after count per element with an EQUAL lamp that must stay green |
| Balance mass | Live numeric | g | 2 dp, with a shaded band showing the current vessel boundary |
| Gas collected | Live numeric | mL | Gas syringe plunger travel, 1 mL resolution |
| Temperature of reaction | Line graph | °C vs s | Probe trace showing the exothermic spike or the endothermic dip |
| Energy ledger | Bar chart | kJ | Energy in to break bonds against energy out to form bonds, with the net difference |
| Limewater opacity | Pass-fail badge | — | Green CO₂ CONFIRMED when opacity passes threshold |

**What the student should realise.**
Students believe a chemical change is any change that looks dramatic. The bond view replaces that with a mechanism: bonds break, the same atoms regroup, and substances with different properties come out. The atom inventory stays equal every single time, so nothing is created and nothing vanishes. The student should be able to say: *"A chemical change rearranges atoms into new substances, and I can count the atoms to prove none were made or lost."*

### B1.3 · Cases that are easy to confuse

**Experiment name:** The Sorting Bench: Seven Awkward Cases  
**Render mode:** 2.5D Layered  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A long grey bench under one low task light, shot straight on. A slow-turning lazy-susan carousel carries seven micro-stations, each a complete little apparatus setup: a beaker of salt water on a hotplate, a flask boiling under a cold watch glass held in tongs, a petri dish of iron nails, a candle standing on a balance beneath an inverted funnel, a stoppered flask feeding a gas syringe, a watch glass of butter on a warm plate, and a boiling tube of egg white in a water bath. Two felt trays sit at the front, PHYSICAL in pale blue on the left, CHEMICAL in amber on the right, with a narrow BOTH AT ONCE tray between them. An evidence rail overhead holds four probes on curly leads.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Station carousel | Structure | 700 mm brushed-steel turntable with seven bays, indexes with a soft detent; the front bay is lit and live, the rest dimmed and paused | Yes: swap |
| 2 | Station 1 — salt water on the hotplate | Instrument | 250 mL beaker of cloudy brine on a ceramic hotplate with a glass stirring rod; salt crust re-forms in the base when run to dryness | Yes: drag |
| 3 | Station 2 — boiling water and cold watch glass | Instrument | 100 mL round-bottom flask over a Bunsen safety flame; an 80 mm watch glass held in tongs 60 mm above the neck collects visible condensate | Yes: drag |
| 4 | Station 3 — three iron nails | Actor | Petri dish split into three wells: dry air with silica gel, boiled water sealed under a 5 mm oil layer, damp salt spray; each nail 50 mm, bright grey, developing an orange flaky bloom on its own schedule | Yes: place |
| 5 | Station 4 — candle on a balance | Actor | 20 mm paraffin candle on the balance pan under an inverted glass funnel; molten wax pool at the wick, soot deposit on a cold watch glass held above, delivery from the funnel into limewater | Yes: place |
| 6 | Station 5 — baking soda and vinegar | Instrument | 100 mL conical flask, one-hole stopper, 100 mL gas syringe; froth rises 40 mm and the plunger travels | Yes: connect |
| 7 | Station 6 — butter on a warm plate | Actor | 8 g pat on an 80 mm watch glass over a 60 °C plate; slumps to a clear yellow pool in 40 s and re-sets on cooling | Yes: drag |
| 8 | Station 7 — egg white in a water bath | Actor | 5 mL clear albumen in a boiling tube standing in an 80 °C water bath; goes cloudy at 62 °C, then firm and opaque white; never re-clears | Yes: drag |
| 9 | Limewater probe | Instrument | Test tube of clear limewater on a stand with a short delivery tube; opacity rises when CO₂ is routed into it | Yes: connect |
| 10 | Bar magnet on a nylon line | Instrument | 50 mm red-and-blue bar magnet hanging from the evidence rail; reports pull force in millinewtons when lowered to a sample | Yes: drag |
| 11 | Conductivity probe pair | Instrument | Two carbon electrodes on a 6 V supply with a lamp and a digital µS readout; dipped into any liquid station | Yes: drag |
| 12 | Recovery kit | Instrument | Evaporating basin, tripod, gauze and a condenser lid; runs an "attempt to get the original back" cycle on the selected station | Yes: place |
| 13 | Hand lens | UI-Probe | 3× loupe following the cursor; at the candle it resolves the melting pool and the burning wick as two separate events | Yes: drag |
| 14 | Case cards | UI-Probe | One card per station showing a thumbnail, a title and three empty evidence sockets; drag a card into a tray to make a claim | Yes: drag |
| 15 | Evidence chips | UI-Probe | Small hexagonal chips minted whenever a probe returns a reading, stamped with the station, the probe and the value; dock into a card's sockets | Yes: connect |
| 16 | Verdict scoreboard | Overlay | Right-hand panel counting correct sorts, incorrect sorts, and a separate tally for "right tray, no evidence docked" | No |

**How it works — the model.**
Every station holds a hidden truth record with three fields: physical, chemical, or both, plus a list of evidence flags that only the correct probe can expose. Sorting is gated: a card dropped in a tray without at least one docked evidence chip is bounced back with the message "no evidence yet", so a lucky guess never scores. Each probe reads its own physical quantity and nothing else, which is what makes the confusable pairs work. The candle card is deliberately splittable: use the hand lens on the wick and the card divides into "wax melting" and "wax burning", and only then can the BOTH AT ONCE tray be used. The rust station runs its own compressed clock, up to 20 000×, and its three wells share air, water and salt conditions so the student can see which factor actually matters. Reversibility is recorded but never scored, because it becomes the subject of B1.5.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Station | Stepper | 1–7 | 1 | — | Rotates the carousel and makes that apparatus live |
| Probe in hand | Multi-select | Limewater / Magnet / Conductivity / Recovery kit / Hand lens | Hand lens | — | Which probes hang ready on the rail; each returns its own evidence chip |
| Time compression | Slider | 1×–20 000× | 1× | — | Speeds slow stations such as rusting; the day counter tracks it |
| Heat setpoint | Slider | 20–250 | 20 | °C | Hotplate, water bath or Bunsen output at the live station |
| Nail conditions | Radio | Dry air + silica gel / Boiled water under oil / Damp salt spray | Damp salt spray | — | Structural change: which wells are present in the petri dish |
| Vessel seal | Toggle | Stoppered / Open | Open | — | Whether gases stay in the vessel and on the balance |
| Split this case | Toggle | On / Off | Off | — | Divides the live station's card into two claims when the physics allows it |
| Attempt recovery | Stepper | Press to run | Not run | — | Runs the recovery kit and reports what came back |
| Playback speed | Dial | 0.25×–4× | 1× | — | Animation speed at the live station |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two lots of bubbles | station=2 then 5; probe=Limewater; seal=Stoppered | Both vessels bubble hard. Route each gas through limewater. Which bubbles are a new substance and which are just water in a different state? |
| S2 | The candle does both | station=4; split=On; probe=Hand lens, Limewater | Point to where the wax is only melting and where it is burning. Why is one card not enough for this station? |
| S3 | Nails in the Monterey fog | station=3; time=20 000×; conditions cycled through all three | After 14 simulated days, which nail rusted and which did not? Which two ingredients does rust need? |
| S4 | Gone but not gone | station=1 then 7; probe=Recovery kit, Conductivity | Salt disappears into water and egg white turns solid. Run recovery on both. Which one comes back, and what does that tell you? |

**Student activities.**
1. Set station 2, boil the water, and hold the cold watch glass in the tongs above the neck. Record what collects on it and mint an evidence chip.
2. Set station 5 with the stopper fitted, route the gas to the limewater and record the time to go milky. Compare that chip with the one from station 2.
3. Run station 3 at 20 000× for 14 days with all three wells. Record which nails rusted and dock a chip on the rust card naming the two conditions needed.
4. Use the hand lens on the candle, split the card, and place the two halves in the trays with one evidence chip each.
5. Sort all seven cases. Record your score, then re-open any card the scoreboard marked wrong and write the one probe reading that should have changed your mind.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Evidence chips minted | Counter | count | Running total per station and per probe |
| Limewater opacity | Live numeric | % | 0–100, with a CO₂ CONFIRMED threshold at 35 % |
| Magnet pull | Live numeric | mN | Attraction on the sample, which drops to near zero after iron reacts |
| Solution conductivity | Live numeric | µS/cm | Distinguishes dissolved ionic salt from pure water |
| Sorting scoreboard | Pass-fail badge | — | Correct, incorrect, and unsupported sorts, per card |
| Case log | Data table | mixed | Station, verdict, evidence used, and whether recovery succeeded; exportable CSV |

**What the student should realise.**
Students sort by drama: bubbles, heat and colour mean chemical, everything quiet means physical. Here boiling water bubbles just as hard as a real gas-producing reaction and butter melts as fast as an egg cooks, so the surface look decides nothing. Only the probes separate the cases, and one station turns out to be both at once. The student should be able to say: *"I have to test what came out, because two changes can look identical and be completely different."*

### B1.4 · Properties before and after

**Experiment name:** The Fingerprint Bench: Six Tests, Twice Over  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A horseshoe of six instrument stations wraps a central sample carousel lit from directly overhead by a copy-stand lamp, so colours read true and shadows stay short. Clockwise from the left: an electric melting-point block with a capillary tube and a magnified eyepiece window; a density kit of balance and 50 mL measuring cylinder; the copy-stand camera above a printed grey-scale and colour swatch strip; a conductivity meter with two carbon electrodes, a small lamp and a µS display; a magnet on a swinging boom over a tiny force balance; and a solubility rig of stoppered test tube, mechanical shaker and stopwatch. At the front a card printer feeds out a two-column property card headed BEFORE and AFTER. Controls dock right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample carousel | Structure | 400 mm turntable of eight recessed wells, each holding a 60 mm watch glass with a paper label and a spatula | Yes: swap |
| 2 | Melting-point block | Instrument | Aluminium heating block with a 1.5 mm capillary slot, ramp 1–10 °C/min to 400 °C, backlit 8× eyepiece window; logs the temperature at first liquid | Yes: drag |
| 3 | Density kit | Instrument | 220 g × 0.01 g balance plus a 50 mL measuring cylinder graduated in 0.5 mL for displacement; computes and displays m/V | Yes: drag |
| 4 | Copy-stand camera and swatch strip | Instrument | Fixed 12 MP head 300 mm above the stage under a D65 lamp, with a 16-patch colour strip and a grey card for calibration; returns an RGB triple and the nearest swatch name | No |
| 5 | Conductivity meter | Instrument | Two 6 mm carbon rods 20 mm apart on a 6 V supply, a 2.5 V lamp in series and a 0–2000 µS/cm digital display; tests solids dry and solutions wet | Yes: drag |
| 6 | Magnet boom and force balance | Instrument | 50 mm neodymium bar on a pivoting boom lowering to a fixed 5 mm gap over a 0–500 mN force balance; reads attraction, not a yes or no | Yes: drag |
| 7 | Solubility rig | Instrument | 150 × 25 mm stoppered test tube on a 200 rpm shaker with a stopwatch; reports grams dissolved per 100 mL at 20 °C and the time to a clear solution | Yes: connect |
| 8 | Sample — iron | Actor | Bright grey filings and one 50 mm nail; the after-state is a flaky orange-brown oxide bloom that crumbles under the spatula | Yes: swap |
| 9 | Sample — copper foil | Actor | 30 × 20 mm bright salmon-pink foil; the after-state is a matte black scale that flakes off the surface | Yes: swap |
| 10 | Sample — sugar | Actor | 3 g white crystals with visible faces under the lens; after-states are amber caramel and then a black porous carbon char with a burnt smell tag | Yes: swap |
| 11 | Sample — candle wax | Actor | 5 g white shaved paraffin; melts to a clear pool at 58 °C and re-sets as an opaque white disc | Yes: swap |
| 12 | Sample — table salt | Actor | 3 g cubic crystals; dissolves to a clear solution then recrystallises as cubes in the evaporating basin | Yes: swap |
| 13 | Sample — egg white and magnesium | Actor | 5 mL clear albumen that sets opaque, plus a 40 mm magnesium ribbon whose after-state is white crumbly ash | Yes: swap |
| 14 | Change chamber | Instrument | Small enclosed stage that applies the chosen change: gentle heat, strong heat over a Bunsen with a safety flame, dissolve and recover, or damp salt air on a timer | Yes: place |
| 15 | Property card printer | UI-Probe | Prints one card per sample with six rows and two columns; a row highlights amber when the after-value leaves the before-value's uncertainty band | No |
| 16 | Uncertainty band overlay | Overlay | Grey ribbon on every numeric readout showing the instrument's stated ± figure, e.g. ±1 °C on melting point, ±0.02 g/cm³ on density | No |

**How it works — the model.**
Each sample carries two full property records, one before and one after, drawn from real values: iron melts at 1538 °C, is strongly magnetic and conducts; iron oxide is weakly magnetic, does not conduct and has no clean melting point. The instruments do not read the record directly, they simulate a measurement: the melting-point block ramps and reports the temperature at first liquid, the density kit needs both a mass and a displacement, the magnet boom returns a force in millinewtons rather than a yes or no. Every reading is drawn from a normal distribution around the true value with the instrument's stated uncertainty, so repeated runs disagree slightly and the student must judge whether a difference is real. The card highlights only differences larger than the combined uncertainty. Reversible changes such as melting wax restore the original record exactly, which is the comparison the whole bench is built to make.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample | Dropdown | Iron / Copper / Sugar / Candle wax / Table salt / Egg white / Magnesium | Iron | — | Which watch glass rotates to the front and which property records load |
| Change to apply | Radio | Heat gently / Heat strongly / Melt and let set / Dissolve and recover / Leave in damp salt air | Leave in damp salt air | — | Structural change: which after-state the change chamber produces |
| Test station | Stepper | Melting point / Density / Colour / Conductivity / Magnetism / Solubility | Melting point | — | Moves the sample to that instrument and arms it |
| Sample mass | Slider | 0.5–5.0 | 2.0 | g | How much material each test consumes; small samples widen the uncertainty band |
| Melting ramp rate | Slider | 1–10 | 5 | °C/min | Slower ramps give a sharper, more trustworthy melting temperature |
| Water volume for solubility | Slider | 5–50 | 10 | mL | Denominator in the grams per 100 mL figure |
| Damp salt air exposure | Slider | 0–14 | 7 | days | How far the rusting after-state has progressed |
| Uncertainty bands | Toggle | On / Off | On | — | Shows or hides the ± ribbon on every readout |
| Repeat count | Stepper | 1–5 | 3 | runs | How many times each test is repeated before the card takes a mean |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Wax, melted and set | sample=Candle wax; change=Melt and let set; repeats=3 | Six tests before, six after. How many rows on the card light up amber, and what does that tell you about the substance? |
| S2 | A nail in the coastal fog | sample=Iron; change=Leave in damp salt air; exposure=14; station cycled through all six | Which properties changed, and which single test is the most convincing evidence that this is a new substance? |
| S3 | Salt round trip | sample=Table salt; change=Dissolve and recover; water=10 | The crystals vanished and came back. Does the recovered solid have the same fingerprint as the original? |
| S4 | Sugar past the point of no return | sample=Sugar; change=Heat strongly; ramp=5; repeats=3 | Caramel, then black char. List every property that changed, and explain why no single change would have been enough on its own. |

**Student activities.**
1. Choose iron, run all six tests before any change, and record the full BEFORE column on the property card.
2. Apply 14 days of damp salt air, repeat all six tests, and record the AFTER column beside it.
3. Set repeats to 3 with uncertainty bands on, and mark which differences are bigger than the ± ribbon and which are not.
4. Run wax through Melt and let set, and compare the number of amber rows with the number you got for iron.
5. Predict which two tests would separate recovered salt from unchanged salt, run them, and record whether your prediction held.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Melting point | Live numeric | °C | Temperature at first liquid, with ±1 °C band |
| Density | Live numeric | g/cm³ | Mass over displaced volume, with ±0.02 band |
| Colour | Live numeric | RGB triple | Camera value plus the nearest named swatch |
| Conductivity | Live numeric | µS/cm | Solid dry test and solution test reported separately |
| Magnetic pull | Live numeric | mN | Force at a fixed 5 mm gap |
| Solubility | Live numeric | g per 100 mL | At 20 °C, with time to dissolve |
| Property card | Data table | mixed | Six rows, BEFORE and AFTER columns, amber highlight on real differences; exportable CSV |

**What the student should realise.**
Students judge change by looks alone, so they call melted wax a new substance and rusted iron just dirty metal. Measuring the same six properties twice reverses both verdicts: wax returns an identical fingerprint, while rust changes melting behaviour, colour, conductivity and magnetism together. The student should be able to say: *"A new substance has a different set of properties, so I check the fingerprint, not the photograph."*

### B1.5 · Reversibility as a clue, not a rule

**Experiment name:** The Undo Lever: When Going Back Proves Nothing  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** Supporting — MS-PS1-2

**Theme & scene.**
A heavy oak bench with a brass double-throw lever bolted to the front edge, its two positions engraved RUN FORWARD and ATTEMPT REVERSE. Behind the lever a small glass cloche covers the working stage, where a boiling tube sits clamped over a Bunsen safety flame with a cold watch glass poised at its mouth. To the right, a recovery rack holds an evaporating basin, a condenser lid, a wash bottle of distilled water, a cold finger and a stubby tube furnace with a carbon boat. Left of the stage stands the fingerprint verifier, a cream instrument cabinet with three test bays and a stamping arm. Above everything, a wall board ruled into four quadrants waits for cards. Controls dock bottom right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Undo lever | Instrument | 300 mm brass lever with a walnut ball grip, two detented positions and a red interlock that will not throw while the stage is above 60 °C | Yes: drag |
| 2 | Working stage under the cloche | Environment | 200 mm glass dome over a ceramic tile stage with a small extract slot; frosts faintly when the cold finger runs | Yes: resize |
| 3 | Boiling tube, clamp and Bunsen | Instrument | 150 × 25 mm tube in a boss-head clamp over a Bunsen with an air-hole collar; safety flame by default, blue cone when the collar is open | Yes: drag |
| 4 | Cold watch glass and tongs | Instrument | 80 mm glass disc held in 250 mm sprung tongs above the tube mouth; collects condensate or sublimate as a visible ring | Yes: drag |
| 5 | Case — hydrated copper(II) sulfate | Actor | 3 g of translucent blue crystals with clear faces; on heating they crumble to a chalky white powder while droplets condense at the tube mouth; a drop of water turns them blue again and the tube warms | Yes: swap |
| 6 | Case — ammonium chloride | Actor | 2 g of fine white powder; on heating it produces a dense white cloud that vanishes upward and re-deposits as a white ring 60 mm up the cool tube wall | Yes: swap |
| 7 | Case — rusted nail | Actor | 50 mm nail with a flaky orange-brown bloom; the tube furnace with a carbon boat at 900 °C returns grey metallic iron and a wisp of gas | Yes: swap |
| 8 | Case — cooked egg white | Actor | 5 mL albumen, clear before and rubbery opaque after; every reverse attempt returns the same rubbery solid | Yes: swap |
| 9 | Case — shredded paper | Actor | One 80 × 80 mm sheet reduced to 400 confetti fragments; hand reassembly restores a ragged sheet whose fingerprint still matches paper | Yes: swap |
| 10 | Case — melted candle wax | Actor | 5 g white paraffin, pooling clear at 58 °C and re-setting as an opaque disc with a shrinkage dimple | Yes: swap |
| 11 | Case — salt in a 5 000 L tank | Actor | 20 g of salt stirred into a wall-mounted cutaway tank; a scaled evaporation run takes weeks of compressed time to return it | Yes: swap |
| 12 | Recovery rack | Instrument | Evaporating basin on a tripod, condenser lid, distilled-water wash bottle, cold finger and a 900 °C tube furnace with a carbon boat; only the selected tool moves to the stage | Yes: place |
| 13 | Fingerprint verifier | Instrument | Three-bay cabinet running melting point (±1 °C), colour camera and a combined conductivity and magnet test, then stamping VERIFIED ORIGINAL or DIFFERENT SUBSTANCE on the returned material | No |
| 14 | Effort meter | Instrument | Vertical gauge reporting energy and conditions used in a reverse attempt, from 0 kJ for hand reassembly to 180 kJ and 900 °C for carbon reduction | No |
| 15 | Quadrant board | UI-Probe | Wall board ruled physical against chemical on one axis, reversible against irreversible on the other, with card slots in all four cells and a completion lamp per cell | Yes: connect |
| 16 | Case cards | UI-Probe | One card per case carrying a thumbnail, the forward result, the verifier stamp and the effort figure; dragged into a quadrant to make a claim | Yes: drag |

**How it works — the model.**
Each case stores two independent facts that the sim deliberately never lets collapse into one: whether the forward step made a new substance, and whether any available tool brings the original back. The forward run is a scripted state transition with real visuals; the reverse run is a lookup over recovery tools, each with a completeness fraction and an effort cost. Whatever comes back is then measured, not asserted: the verifier runs three property tests and compares them with the stored original fingerprint inside the instrument uncertainty. That is why heated copper sulfate stamps DIFFERENT SUBSTANCE at the white stage and VERIFIED ORIGINAL after water is added, and why the ammonium chloride ring stamps VERIFIED ORIGINAL despite looking like smoke and ash. The quadrant board will not light its completion lamp until every one of the four cells holds at least one card, which forces the student to find the reversible chemical case and the irreversible physical case rather than assuming they do not exist.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Case | Dropdown | Hydrated copper sulfate / Ammonium chloride / Rusted nail / Cooked egg white / Shredded paper / Melted wax / Salt in a 5 000 L tank | Hydrated copper sulfate | — | Loads the sample, the apparatus preset and the case card |
| Lever | Radio | Run forward / Attempt reverse | Run forward | — | Which direction the stage runs |
| Recovery tool | Dropdown | Cool and let set / Add water / Condense and collect / Evaporate to dryness / Reduce with carbon at 900 °C / Reassemble by hand | Cool and let set | — | Structural change: which apparatus is fitted to the stage for the reverse attempt |
| Heat setpoint | Slider | 20–950 | 20 | °C | Bunsen or tube furnace output; the furnace range unlocks only with the carbon boat fitted |
| Verifier tests | Multi-select | Melting point / Colour / Conductivity and magnet | All three | — | Which property tests run on the returned material |
| Time compression | Slider | 1×–50 000× | 1× | — | Speeds slow recoveries such as the tank evaporation |
| Effort meter | Toggle | On / Off | On | — | Shows the energy and conditions each reverse attempt demanded |
| Quadrant board | Toggle | On / Off | On | — | Shows the four-cell sorting board and its completion lamps |
| Playback speed | Dial | 0.25×–4× | 1× | — | Animation speed on the working stage |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Blue, white, blue again | case=Hydrated copper sulfate; lever=Run forward then Attempt reverse; tool=Add water; heat=250 | It went back perfectly, so was it a physical change? Read the verifier stamp at the white stage before you answer. |
| S2 | The smoke that was not smoke | case=Ammonium chloride; heat=340; tool=Condense and collect | A cloud rises and a new white ring forms higher up. The verifier stamps VERIFIED ORIGINAL. What actually happened? |
| S3 | Physical and gone for good | case=Shredded paper then Salt in a 5 000 L tank; tool=Reassemble by hand then Evaporate to dryness; time=50 000× | Neither is a new substance. Why is neither one easy to undo, and does that make them chemical changes? |
| S4 | Rust in a furnace | case=Rusted nail; tool=Reduce with carbon at 900 °C; effort meter=On | The iron comes back. Compare the effort figure with the wax case and say what reversibility really measured here. |

**Student activities.**
1. Run the copper sulfate forward, record the verifier stamp on the white powder, then reverse with water and record the stamp again.
2. Heat the ammonium chloride, collect the ring on the cold watch glass, and run all three verifier tests on it. Write down which test settled it.
3. Attempt to reverse the cooked egg white with every tool on the rack in turn and record the completeness figure for each.
4. Place all seven case cards on the quadrant board and record which case fills the reversible-chemical cell and which fills the irreversible-physical cell.
5. Record the effort meter reading for three reverse attempts and rank them; state in one sentence why effort is not the same thing as chemistry.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Verifier stamp | Pass-fail badge | — | VERIFIED ORIGINAL or DIFFERENT SUBSTANCE on the returned material |
| Recovery completeness | Live numeric | % | Fraction of the original mass returned with a matching fingerprint |
| Effort required | Live numeric | kJ and °C | Energy and conditions the reverse attempt demanded |
| Fingerprint comparison | Data table | mixed | Original against returned, three properties, with uncertainty bands |
| Quadrant board fill | Counter | count | Cards in each of the four cells, with a lamp per cell |
| Case log | Data table | mixed | Case, forward result, tool used, stamp, effort; exportable CSV |

**What the student should realise.**
Students are taught the shortcut "reversible means physical", and it fails in both directions. Hydrated copper sulfate makes a genuinely new white substance and still goes back with a splash of water, while shredded paper and salt lost in a tank stay exactly the same substance and never practically return. Reversibility measures effort, not chemistry. The student should be able to say: *"Whether I can undo it is a hint, but only the properties of what came out can tell me if it is a new substance."*

## B2 · Evidence that a reaction happened · MS-PS1-2

### B2.1 · Signs a reaction may have occurred

**Experiment name:** The Signal Bench: Five Detectors, Two Liars  
**Render mode:** 3D Scene  
**Simulation engine:** State machine + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A dark instrument bench under a low vented canopy, everything matte black except the glassware. At the centre a 100 mL beaker sits on a magnetic stirrer inside a small extraction hood, lit from below so bubbles and cloudiness show sharply against the dark. Five sensor heads reach in on chrome gooseneck arms: a gas-capture funnel feeding a bubble counter and a swappable identification cartridge, a stainless temperature probe, a colorimeter clamped across a cuvette, a turbidity beam crossing the beaker at mid-height, and a filtered sniff port with a red guard ring. Along the front edge, five chunky illuminated SIGN buttons: BUBBLES, COLOUR, HEAT, SOLID FORMED, SMELL. A confirmation tray of follow-up tests sits to the right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reaction beaker on a stirrer | Instrument | 100 mL borosilicate beaker, 50 mL of liquid, 20 mm PTFE flea; the stirrer plate is white on matte black with a speed dial and a heat lamp indicator | Yes: swap |
| 2 | Extraction canopy | Environment | Low black hood with an amber airflow ribbon at the lip, sash fixed at 25 cm, extract hum at low volume | No |
| 3 | Gas capture funnel and bubble counter | Instrument | Inverted 60 mm glass funnel over the liquid feeding a bubble-break sensor and a 100 mL syringe; counts bubbles per second and total gas volume | Yes: connect |
| 4 | Gas identification cartridge | Instrument | Snap-in cartridge holder taking one of four cartridges: limewater tube, glowing splint, lit splint or blank; each returns a specific pass or fail, not a general answer | Yes: swap |
| 5 | Temperature probe | Instrument | 3 mm stainless probe on a gooseneck, −20 to 120 °C, 0.1 °C resolution, logging 5 readings per second | Yes: drag |
| 6 | Colorimeter and cuvette | Instrument | Blue, green and red LED source across a 10 mm cuvette to a photodiode; reports absorbance at each wavelength plus a nearest-colour name | Yes: drag |
| 7 | Turbidity beam | Instrument | Collimated white beam across the beaker to a side-scatter detector, reading 0–2000 NTU; distinguishes clear, cloudy and settled | No |
| 8 | Sniff port with charcoal filter | Instrument | Guarded port that samples headspace and returns a smell class only (vinegar, burnt, eggy, none), never an intensity a student could chase | No |
| 9 | Trial rack | Structure | Twelve labelled reagent bottles in a wooden rack: vinegar, baking soda, distilled water, fizzy water, potassium permanganate, universal indicator, copper sulfate solution, an iron nail, ammonium nitrate, calcium chloride, sodium carbonate and powdered chalk | Yes: place |
| 10 | Bubble particles | Particle | Spheres 0.4–2.0 mm rising with buoyancy plus a random walk; steam bubbles collapse before the surface when the liquid is below boiling, gas bubbles never do | No |
| 11 | Precipitate grains | Particle | 12 µm white grains nucleating through the bulk and settling at 0.6 mm/s; suspension grains are 40 µm, irregular and settle at 4 mm/s | No |
| 12 | Filter and settle station | Instrument | Funnel, filter paper and a 5-minute settling stand; separates a suspension cleanly while a true precipitate stays as a fine cake | Yes: place |
| 13 | Balance under the beaker | Instrument | 220 g × 0.01 g, with a toggleable stopper and gas syringe to close the system when needed | No |
| 14 | Sign buttons | UI-Probe | Five illuminated latching buttons; each press timestamps a claimed sign and locks it until the confirmation test is run | Yes: connect |
| 15 | Confirmation tray | UI-Probe | Slots for the follow-up test chosen after each claimed sign, with a verdict chip reading CONFIRMED or FALSE ALARM | Yes: drag |
| 16 | Detector scoreboard | Overlay | Right panel tallying true positives, false positives and missed reactions across all trials | No |

**How it works — the model.**
Every trial carries a hidden truth flag, reacted or not reacted, plus a list of the observable signals it genuinely produces. Signals are generated by physics, not by that flag, which is the whole point: boiling water launches bubbles from a temperature rule, warming fizzy water releases dissolved carbon dioxide from a solubility curve, and diluting permanganate lowers absorbance by the Beer relationship, so three convincing signs appear with no reaction anywhere. Confirmation tests read the underlying state instead of the appearance. The limewater cartridge tests only for carbon dioxide, the filter station separates a coarse suspension but not a true precipitate, the sealed balance detects whether total mass moved, and the temperature trace shape separates a dissolution dip that recovers from a reaction spike that does not. The scoreboard counts a claimed sign as correct only when the follow-up test supports it, so pressing all five buttons every time scores badly.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Trial | Dropdown | Vinegar + baking soda / Boiling water / Warming fizzy water / Diluting permanganate / Indicator + vinegar / Copper sulfate + iron nail / Ammonium nitrate in water / Calcium chloride + sodium carbonate / Chalk dust in water | Vinegar + baking soda | — | Structural change: loads that trial's reagents, glassware and truth flag |
| Gas cartridge | Dropdown | Limewater / Glowing splint / Lit splint / Blank | Blank | — | Which gas test is fitted to the capture funnel |
| Stirrer speed | Slider | 0–900 | 300 | rpm | Mixing rate, and how fast a precipitate spreads through the beaker |
| Plate temperature | Slider | 20–120 | 20 | °C | Heat delivered; above 100 °C water boils and produces steam bubbles |
| Dilution added | Slider | 0–200 | 0 | mL | Distilled water added, which fades colour without any reaction |
| System boundary | Toggle | Open / Stoppered with gas syringe | Open | — | Whether escaping gas leaves the balance reading |
| Filter and settle | Stepper | Press to run | Not run | — | Runs the separation test on any cloudy mixture |
| Sign buttons | Multi-select | Bubbles / Colour / Heat / Solid formed / Smell | None pressed | — | Which signs the student claims for this trial |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling for slow trials |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two beakers of bubbles | trial=Boiling water then Vinegar + baking soda; cartridge=Limewater; plate=110 then 20 | Both fizz vigorously. Which gas test separates them, and what is each gas? |
| S2 | Colour that means nothing | trial=Diluting permanganate; dilution=150 then trial=Indicator + vinegar | Purple fades to pale pink in one beaker and green turns red in the other. Which colour change is evidence of a reaction? |
| S3 | Cold is not proof | trial=Ammonium nitrate in water then Copper sulfate + iron nail; boundary=Stoppered with gas syringe | One beaker drops 9 °C and the other warms slightly. Which one made a new substance, and how does the nail prove it? |
| S4 | Cloudy twins | trial=Calcium chloride + sodium carbonate then Chalk dust in water; filter=Press to run; stirrer=300 | Both go milky white. Run the filter and settle test on each. Which cloud is a new solid? |

**Student activities.**
1. Run the boiling water trial, press the BUBBLES sign, then fit the limewater cartridge and record whether the claim is confirmed or a false alarm.
2. Repeat with vinegar and baking soda and record the bubble rate, gas volume and limewater verdict side by side with the previous run.
3. Dilute the permanganate in four 50 mL steps, recording absorbance at each step, and state why fading colour alone proved nothing.
4. Run both cloudy trials, press SOLID FORMED for each, then run filter and settle. Record which cloud passed through the paper.
5. Complete all nine trials, then record your final scoreboard and name the two signs that caught you out most often.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Bubble rate and gas volume | Live numeric | bubbles/s and mL | From the capture funnel and syringe, refreshed twice a second |
| Gas test verdict | Pass-fail badge | — | Limewater milky, splint relit or squeaky pop, else negative |
| Temperature trace | Line graph | °C vs s | Shape distinguishes a dissolution dip that recovers from a reaction change that does not |
| Absorbance | Live numeric | AU | Colorimeter reading at three wavelengths, with the nearest colour name |
| Turbidity | Live numeric | NTU | Before and after the filter and settle test |
| Detector scoreboard | Data table | count | True positives, false positives and missed reactions per trial; exportable CSV |

**What the student should realise.**
Students learn the list of signs and then treat any sign as proof. This bench hands them bubbles with no reaction, a dramatic colour change from plain water, a temperature drop from simple dissolving and a white cloud that filters straight out. Each sign only survives a follow-up test that examines what is actually there. The student should be able to say: *"A sign tells me where to look, and only a test on the products tells me a reaction happened."*

### B2.2 · Analyzing property data before and after

**Experiment name:** The Difference Machine: Signal, Noise and Proof  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A dark analyst's dashboard, but the top 25 % of the screen is a live bench strip so the numbers never float free of their apparatus: a sample tray under a copy-stand camera, a balance with its draught shield open, a melting-point block, and a stoppered conical flask on a stirrer with a gas syringe. A scrub bar under the strip replays the footage of whichever trial is selected. Below, the dashboard proper: a paired BEFORE and AFTER table on the left in cool grey, a difference bar chart in the centre with whiskers on every bar, a mass lane running the full width in a separate boxed band, and a claim builder on the right holding three draggable claim cards with empty evidence sockets. Amber is used for one thing only, a difference the data can actually support.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Bench strip and replay scrubber | Instrument | Live 16:5 video band of the rig that produced the selected trial, with a frame-accurate scrub bar and a timestamp overlay | Yes: drag |
| 2 | Sample tray under the copy stand | Instrument | Eight numbered 60 mm watch glasses under a fixed camera and a D65 lamp, with a grey card in every frame for colour calibration | Yes: swap |
| 3 | Balance and draught shield | Instrument | 220 g × 0.01 g with a shield that can stand open or closed; the closed state is what makes the sealed trials trustworthy | No |
| 4 | Melting-point block | Instrument | Aluminium block with a capillary slot, ramp 1–10 °C/min, backlit window; logs the temperature at first liquid with ±1 °C | No |
| 5 | Stoppered flask and gas syringe | Instrument | 100 mL flask, rubber stopper and 100 mL graduated syringe; the sealed boundary for the magnesium and the carbonate trials | Yes: connect |
| 6 | Trial dataset | Field | Six trials × seven properties × five repeats, each value stored with a true figure, an instrument uncertainty and a realistic scatter; loaded from a CSV the sim ships with | No |
| 7 | Paired before-and-after table | Overlay | Two-column grid, one row per property, showing the mean of the shown repeats and its ± figure; row text greys when the property is deselected | Yes: connect |
| 8 | Difference bar chart | Overlay | Horizontal bars of after minus before, each with a whisker of the combined uncertainty and a dashed threshold line the student can move | No |
| 9 | Threshold handle | UI-Probe | Draggable vertical rule on the bar chart, calibrated in multiples of the combined uncertainty from 0.5 to 5 | Yes: drag |
| 10 | Mass lane | Overlay | Full-width band showing mass before, mass after and the difference, with a padlock icon when the trial ran sealed | No |
| 11 | Repeat dots | Overlay | Individual repeat values plotted as small dots behind each bar, so scatter is visible rather than described | No |
| 12 | Slope chart view | Overlay | Alternative rendering pairing each before value to its after value with a line, useful when units differ wildly | No |
| 13 | Claim cards | UI-Probe | Three cards: "A new substance formed", "The same substance changed state", "Mass was conserved"; each with four evidence sockets | Yes: drag |
| 14 | Evidence chips | UI-Probe | One chip per property row per trial, stamped with the difference and whether it clears the threshold; dragged into a claim socket | Yes: connect |
| 15 | Claim scorer | Instrument | Checks each docked chip against the claim: a chip inside the noise band scores zero, a chip that contradicts the claim scores negative, and the panel explains why | No |
| 16 | Annotation pins | UI-Probe | Numbered pins the student drops on any bar or table cell with a one-line note, saved into the exported report | Yes: place |

**How it works — the model.**
The dashboard reads a fixed dataset rather than a live simulation, so the student is analysing evidence rather than generating it. Each measurement is stored as a true value plus an instrument uncertainty, and the five repeats are drawn around that true value, so scatter behaves the way real repeats behave. A difference counts as real only when it exceeds the combined uncertainty of the two means by the factor set on the threshold handle, computed as the root of the sum of squares rather than a simple sum. Mass is treated separately and deliberately: in sealed trials the mass difference is always within noise even when four other properties change hugely, and in open trials it moves because matter crossed the boundary. The claim scorer performs the argument step, rejecting evidence that is real but irrelevant, such as offering a mass reading as proof that a new substance formed.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Trial | Dropdown | Wax melted and set / Iron in damp salt air / Salt dissolved and recovered / Sugar heated to char / Copper heated in air / Magnesium burned in a sealed flask | Wax melted and set | — | Loads that trial's data and its bench footage |
| Properties shown | Multi-select | Mass / Melting point / Density / Colour / Conductivity / Magnetism / Solubility | All seven | — | Structural change: which rows exist in the table and the chart |
| Significance threshold | Slider | 0.5–5.0 | 2.0 | × combined uncertainty | Where the dashed line falls, and so which differences count as real |
| Repeats shown | Stepper | 1–5 | 3 | runs | How many repeats feed each mean; fewer repeats widen the whiskers |
| Chart view | Radio | Difference bars / Paired table / Before-and-after slopes | Difference bars | — | How the same numbers are drawn |
| Normalisation | Toggle | Absolute / Percentage change | Absolute | — | Lets properties with very different units be compared fairly |
| System boundary | Radio | As recorded / Force open / Force sealed | As recorded | — | Re-runs the mass lane under a different boundary to show why mass moved |
| Claim under test | Dropdown | A new substance formed / The same substance changed state / Mass was conserved | A new substance formed | — | Which card the scorer is currently checking |
| Replay position | Timeline scrubber | 0–100 | 0 | % of run | Moves the bench footage to the moment a measurement was taken |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Nothing to see here | trial=Wax melted and set; threshold=2.0; repeats=5 | Seven properties, seven small differences. How many clear the threshold, and what claim does that support? |
| S2 | Four changes at once | trial=Iron in damp salt air; view=Difference bars; normalisation=Percentage change | Which properties changed by more than noise, and why is the combination more convincing than any single one? |
| S3 | Everything changed except the mass | trial=Magnesium burned in a sealed flask; boundary=As recorded then Force open | Colour, conductivity and melting behaviour all change, yet the mass lane stays padlocked. What does that prove and what does it not prove? |
| S4 | Moving the goalposts | trial=Salt dissolved and recovered; threshold dragged 0.5 → 5.0; repeats=1 then 5 | Slide the threshold and cut the repeats. At what settings does a difference stop being real, and is that honest? |

**Student activities.**
1. Load the wax trial with five repeats and record how many of the seven properties clear a threshold of 2.0.
2. Switch to the iron trial and record the difference and whisker for every property, marking each as real or within noise.
3. Drag the threshold handle from 0.5 to 5.0 on the salt trial and record the setting at which the melting point difference stops counting.
4. Dock four evidence chips onto the claim "A new substance formed" for the sugar trial and record the score and any rejection reason the panel gives.
5. Set the magnesium trial to Force open, record the new mass difference, and write one sentence explaining where the extra mass came from.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Property difference | Bar chart | mixed | After minus before per property, with combined-uncertainty whiskers |
| Significance verdict | Pass-fail badge | — | Real difference or within noise, per property row |
| Repeat scatter | Data table | mixed | All five repeat values per measurement, with mean and range |
| Mass lane | Live numeric | g | Mass before, after and difference, padlocked when the trial ran sealed |
| Claim score | Live numeric | points | Sum over docked chips, with negative marks for contradicting evidence |
| Analysis report | Data table | mixed | Trial, threshold used, chips docked, claim score and pinned notes; exportable CSV |

**What the student should realise.**
Students treat any difference in a number as a change and any identical number as proof of nothing happening. Here small differences sit inside the measurement noise while four large ones move together, and mass stubbornly refuses to change in a sealed flask even when the substance clearly has. Judging evidence means asking how big a difference is compared with how carefully it was measured. The student should be able to say: *"One property changing might be noise, several changing together is a new substance, and mass staying put is exactly what I should expect."*

### B2.3 · Identifying an unknown from a property table

**Experiment name:** Five White Powders at the Assay Office  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A Gold Country assay office preserved as a working bench: dark varnished counter, brass-cornered ledger open at a printed PROPERTY TABLE, and a green-shaded lamp throwing a tight pool of light. Five numbered watch glasses sit in a row, each holding a small heap of white powder that looks, from a metre away, exactly like the other four. To the left, a white porcelain spot tile with twelve wells and three dropper bottles labelled distilled water, vinegar and iodine solution. To the right, a nickel spatula, a deflagrating spoon, a Bunsen with its collar shut to a yellow safety flame, tongs and a hand lens on a brass stand. A conductivity probe pair rests in a beaker of rinse water. Each unknown has a sample budget gauge reading 2.00 g.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reference property table | UI-Probe | Printed ledger page listing six candidate powders against six test outcomes, with two deliberate ties so no single test can finish the job | Yes: connect |
| 2 | Unknown watch glasses | Actor | Five 60 mm glasses, each with 2.00 g of white powder and a stamped brass number tag; contents randomised per session | Yes: swap |
| 3 | Powder — table salt | Structure | Cubic crystals 0.3 mm with square faces under the lens; dissolves clear, conducts strongly, crackles but does not melt on the spoon | No |
| 4 | Powder — granulated sugar | Structure | Chunky irregular crystals 0.5 mm, glassy edges; dissolves clear, does not conduct, melts to amber then blackens with a caramel smell | No |
| 5 | Powder — baking soda | Structure | Fine rounded grains 0.1 mm, faintly clumped; partly dissolves, fizzes hard with vinegar, gives off a gas that turns limewater milky | No |
| 6 | Powder — cornflour | Structure | Very fine matte powder that squeaks under the spatula; does not dissolve, turns blue-black with iodine, chars without melting | No |
| 7 | Powder — chalk | Structure | Soft micro-grains 0.02 mm; will not dissolve, fizzes with vinegar, leaves a white residue and does not char | No |
| 8 | Powder — plaster of Paris | Structure | Fine white powder that stiffens into a warm solid cake within 90 s of adding water; does not fizz, does not char | No |
| 9 | Spot tile and dropper bottles | Instrument | 12-well porcelain tile plus three 30 mL amber dropper bottles with pipette caps; one drop consumes 0.05 g of sample | Yes: place |
| 10 | Deflagrating spoon and Bunsen | Instrument | 200 mm spoon over a yellow safety flame; heating consumes 0.30 g and shows melt, char, crackle or no change over 40 s | Yes: drag |
| 11 | Conductivity probe pair | Instrument | Two carbon rods on a 6 V supply with a lamp and a 0–2000 µS/cm display; needs the powder dissolved in 10 mL first | Yes: drag |
| 12 | Hand lens on a stand | UI-Probe | 10× lens on a brass arm resolving crystal shape and grain size; costs no sample at all | Yes: drag |
| 13 | Sample budget gauge | Instrument | Vertical gauge per unknown starting at 2.00 g and falling as tests consume material; testing stops at zero | No |
| 14 | Candidate tracker | Overlay | Six candidate tiles that grey out as each test result eliminates them, with a live count of survivors | No |
| 15 | Identification slip | UI-Probe | Small form where the student writes a name for each unknown and lists the tests that ruled the others out | Yes: connect |
| 16 | Verdict stamp | Instrument | Brass stamp that marks each slip CORRECT or INCORRECT and reports how much sample was spent reaching it | No |

**How it works — the model.**
Each unknown is assigned a true identity at load, and every test is a lookup into that substance's real behaviour with a small chance of an ambiguous reading when the sample is very small. Tests cost material, so the budget gauge turns strategy into a visible resource: a student who runs all six tests on all five unknowns runs out before finishing. The candidate tracker performs pure elimination logic from the printed table, greying a tile the moment a result is incompatible with it, which makes the branching structure of identification visible rather than abstract. Two deliberate ties are built in: baking soda and chalk both fizz with vinegar, and salt and sugar look nearly identical under the lens, so the student must reach for a discriminating test such as solubility or conductivity. In the mixture scenario the results are internally contradictory, and no single row of the table can satisfy them all.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Unknown selected | Stepper | 1–5 | 1 | — | Which watch glass moves under the lamp and which budget gauge is live |
| Test to run | Dropdown | Hand lens / Dissolve in water / Vinegar drop / Iodine drop / Conductivity of solution / Heat on the spoon | Hand lens | — | Which test the bench performs and how much sample it consumes |
| Sample used per test | Slider | 0.05–0.50 | 0.20 | g | Bigger samples give clearer results but exhaust the budget faster |
| Water for dissolving | Slider | 5–25 | 10 | mL | Volume used for the solubility and conductivity tests |
| Bunsen collar | Radio | Shut (safety flame) / Half open | Shut (safety flame) | — | Heating rate on the spoon; the half-open flame chars faster and less clearly |
| Powder set | Dropdown | Standard five / Kitchen five / One is a mixture / Empty rack for teacher setup | Standard five | — | Structural change: which substances are issued as unknowns |
| Candidate tracker | Toggle | On / Off | On | — | Shows or hides the automatic elimination of candidates |
| Reference table | Toggle | Open / Closed | Open | — | Whether the printed property table is visible while testing |
| Limewater on the spoon test | Toggle | On / Off | Off | — | Routes any gas from heating or fizzing into a limewater tube |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Two fizzers | set=Standard five; test=Vinegar drop on all five; tracker=On | Two powders fizz identically. Which single further test separates them, and why does the fizz test alone fail? |
| S2 | Cheapest correct route | set=Standard five; sample per test=0.05; budget watched | Identify all five while spending under 1.00 g each. What is the smallest number of tests that still gives certainty? |
| S3 | Table closed | set=Kitchen five; reference table=Closed for the first three tests | Run tests before you read the table, then open it. Did knowing the answers in advance change which tests you chose? |
| S4 | The impossible sample | set=One is a mixture; tracker=On | One unknown eliminates every candidate on the table. What does that result actually mean, and what would you do next? |

**Student activities.**
1. Examine all five unknowns with the hand lens and record grain shape and size before spending any sample.
2. Run the water solubility test on each and record which dissolve, which stay cloudy and which set into a solid cake.
3. Apply one vinegar drop to each, record the fizz, then route the gas through limewater on the two that fizzed and record which gas came off.
4. Choose one discriminating test for the pair the tracker still cannot separate, run it, and record what it ruled out.
5. Write a name on each identification slip with the tests you used, stamp them, and record your score and the total sample spent.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Test result log | Data table | mixed | Unknown, test, observation and sample consumed, one row per test |
| Candidates remaining | Counter | count | Live survivor count per unknown after each result |
| Sample budget | Live numeric | g | Remaining material for each of the five unknowns |
| Solution conductivity | Live numeric | µS/cm | For any powder that dissolves |
| Identification score | Pass-fail badge | — | Correct or incorrect per slip, with total sample spent |
| Elimination path | Data table | mixed | The branching route taken for each unknown; exportable CSV |

**What the student should realise.**
Students expect one clever test to name a substance, and they treat a matching result as a match. Here two powders fizz the same, two look the same, and a mixture matches nothing at all, so identity only emerges from a pattern of several properties read against a table. The student should be able to say: *"No single property names a substance. I match a whole set of properties, and if nothing on the table fits, my sample is not on the table."*

### B2.4 · Why appearance alone is not proof

**Experiment name:** Blind Judgement: Six Pairs of Twins  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
The session opens on a viewing gallery, not a bench. A wall-mounted monitor shows a clean camera feed of two beakers side by side on a black stage, labelled only LEFT and RIGHT, lit hard from the front so the glassware reads crisply and nothing else does. Behind the stage, an instrument tray sits shuttered behind frosted glass with a red LOCKED lamp above it. In front of the monitor there is one control: a chunky verdict dial with two stops, REACTION and NO REACTION, and a confidence slider under it. A conveyor track carries six sealed twin pairs into the stage in turn. Once the first pass is submitted the shutter rolls up, the tray lights green, and the same six pairs come round again.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Viewing monitor and camera feed | Instrument | 900 px 16:9 panel showing a fixed front-on camera on the stage, with optional 8× slow motion and a frame counter; no instrument readouts are ever composited into this feed | Yes: resize |
| 2 | Twin stage and conveyor | Structure | Black 400 mm stage with two marked positions and a belt that indexes the next sealed pair into place with a soft clunk | Yes: swap |
| 3 | Pair 1 — two fizzing beakers | Actor | Left: 100 mL water at 102 °C on a hotplate, bubbles 1.5 mm rising fast. Right: chalk and vinegar, bubbles 1.5 mm rising fast. Visually indistinguishable at this framing | Yes: place |
| 4 | Pair 2 — two fading purple solutions | Actor | Left: potassium permanganate diluted with 120 mL of water. Right: the same permanganate decolourised by a few drops of vitamin C solution. Both end pale pink over 40 s | Yes: place |
| 5 | Pair 3 — two white clouds | Actor | Left: calcium chloride and sodium carbonate forming a true precipitate of 12 µm grains. Right: powdered chalk stirred into water as a 40 µm suspension. Both read as identical milky white | Yes: place |
| 6 | Pair 4 — two black powders | Actor | Left: sugar heated to a porous black char on a watch glass. Right: white sugar stirred with powdered graphite to the same shade. Matched under the copy-stand camera | Yes: place |
| 7 | Pair 5 — two disappearing solids | Actor | Left: a 3 g sugar lump dissolving to a clear solution. Right: a 40 mm magnesium ribbon dissolving in dilute acid to a clear solution. Both vessels end clear and empty-looking | Yes: place |
| 8 | Pair 6 — two warming beakers | Actor | Left: calcium chloride dissolving, temperature rising 14 °C. Right: magnesium in dilute acid, temperature rising 14 °C. Identical warmth on the hand and on the trace | Yes: place |
| 9 | Instrument tray behind the shutter | Instrument | Roller shutter over limewater tube, thermometer, filter funnel and paper, conductivity probe pair, gas syringe with stopper, and a balance with a sealable draught shield | Yes: drag |
| 10 | Sealing stopper and gas syringe | Instrument | One-hole stopper and 100 mL syringe that convert any open beaker into a closed system so the balance boundary can be trusted | Yes: connect |
| 11 | Verdict dial and confidence slider | UI-Probe | Two-stop brass dial plus a 0–100 % confidence slider; both are logged for every judgement in both passes | Yes: drag |
| 12 | Blinding shuffler | Field | Invisible randomiser that decides, per session, which twin is on the left, so a remembered answer never transfers | No |
| 13 | Flip counter | Overlay | Large panel counting verdicts that changed between pass one and pass two, and naming the instrument that caused each change | No |
| 14 | Calibration chart | Overlay | Scatter of stated confidence against whether the verdict was right, with the perfect-calibration diagonal drawn faintly behind | No |
| 15 | Evidence chip rail | UI-Probe | Chips minted by each instrument reading, dragged onto a verdict to record what changed the student's mind | Yes: connect |
| 16 | Truth reveal panel | Overlay | Stays hidden until both passes are submitted, then names each twin and shows which sign was doing the lying | No |

**How it works — the model.**
Each pair is built to be a visual match on purpose, and the sim enforces that: bubble size, rise rate and count are matched between the fizzing twins, the two purple solutions are driven to the same final absorbance, and the two black powders are tuned to the same camera value under the same lamp. Nothing is faked, and both twins are physically simulated, but the camera framing is chosen so no discriminating detail is visible. The instrument pass reads underlying state instead of appearance: limewater tests only for carbon dioxide, the filter separates a coarse suspension but not a fine precipitate, the sealed balance detects whether mass crossed a boundary, and conductivity separates dissolved sugar from a solution of magnesium salt. The flip counter and calibration chart are the real outputs, because the lesson is about how confidently a wrong verdict can be given, not about any single pair.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Pair on stage | Stepper | 1–6 | 1 | — | Indexes the conveyor to the next sealed twin pair |
| Pass mode | Radio | Appearance only / Instruments unlocked | Appearance only | — | Structural change: whether the tray shutter is open and probes exist |
| View | Radio | Camera monitor / Close bench view / 8× slow motion | Camera monitor | — | How much visual detail the student is allowed |
| Waiting time | Slider | 0–300 | 30 | s | How long each pair runs before judgement; some differences only appear late |
| Instruments in hand | Multi-select | Limewater / Thermometer / Filter funnel / Conductivity / Sealed balance and syringe | None | — | Which probes are on the bench during pass two |
| Confidence | Slider | 0–100 | 50 | % | Recorded with every verdict and plotted on the calibration chart |
| Verdict | Radio | Reaction / No reaction | No reaction | — | The claim submitted for the twin currently under the cursor |
| Re-blind the pairs | Toggle | On / Off | On | — | Reshuffles which twin sits left, so answers cannot be memorised |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling for the slower pairs |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Judge on sight | pairs 1–6; pass=Appearance only; view=Camera monitor; waiting=30 | Give twelve verdicts with a confidence for each. How many do you expect to be right? |
| S2 | The tray opens | pairs 1–6; pass=Instruments unlocked; instruments=All five | Re-judge the same twelve. How many verdicts flipped, and which instrument flipped each one? |
| S3 | The honest disappearance | pair=5; pass=Instruments unlocked; instruments=Conductivity, Sealed balance and syringe | Both solids vanished into clear liquid. Which two readings separate dissolving from reacting? |
| S4 | Confidence on trial | pairs 1–6; confidence recorded in both passes; blinding=On | Where do your points sit on the calibration chart? Were you most confident about the pairs you got wrong? |

**Student activities.**
1. Run all six pairs on the camera monitor only and record twelve verdicts, each with a confidence figure.
2. Unlock the tray, run limewater on both twins of pair 1, and record which gas each beaker produced.
3. Filter both twins of pair 3 and record what stayed on the paper in each case.
4. Fit the stopper and syringe to both twins of pair 5, record the balance before and after, and dock the chip that changed your verdict.
5. Record your pass-one and pass-two scores, the flip count, and one sentence naming the sign that fooled you most.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Pass-one accuracy | Live numeric | correct out of 12 | Score from appearance alone |
| Pass-two accuracy | Live numeric | correct out of 12 | Score with instruments, shown beside pass one |
| Verdict flips | Counter | count | Verdicts that changed, tagged with the instrument responsible |
| Confidence calibration | Line graph | % confidence vs % correct | Student points against the perfect-calibration diagonal |
| Instrument readings | Data table | mixed | Every probe reading taken, by pair and by twin |
| Judgement log | Data table | mixed | Pair, twin, verdict, confidence, evidence chips, final truth; exportable CSV |

**What the student should realise.**
Students trust their eyes and are most certain exactly where they are most wrong: two beakers can fizz identically, warm identically and go cloudy identically while only one made a new substance. The calibration chart puts that overconfidence on screen as their own data. The student should be able to say: *"Looking told me something changed, but only a test on what came out told me whether it is a new substance."*

### B2.5 · Naming a reaction from what goes in and comes out

**Experiment name:** The Name Plate Workbench: Building Word Equations  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-2

**Theme & scene.**
A wide workbench with two circular reactant pads sunk flush into the top, engraved IN A and IN B, each with a brass collar that lights when a bottle is seated. Between them a small vented reaction well holds the glassware for whichever family is running: a crucible on a pipe-clay triangle, a boiling tube with a delivery tube, or a conical flask with a stopper and gas syringe. Behind the bench a product tray slides out on runners carrying whatever formed, each item on its own labelled watch glass. Above that, a magnetic word-tile rack in three coloured banks, and across the top a brass equation rail where tiles snap into place. A conservation lamp sits at the end of the rail, dark until the equation balances by element.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Reactant pads A and B | Instrument | Two 90 mm recessed pads with brass collars and contact rings; a seated bottle lights its collar and posts its contents to the rig | Yes: place |
| 2 | Reagent shelf | Structure | Twelve labelled bottles and holders: magnesium ribbon, copper foil, iron wool, sulfur, zinc granules, oxygen cylinder, dilute hydrochloric acid, dilute sulfuric acid, dilute nitric acid, sodium hydroxide solution, calcium carbonate chips, and a gas tap for methane | Yes: drag |
| 3 | Reaction well and glassware set | Instrument | Vented 200 mm well accepting a crucible on a pipe-clay triangle, a boiling tube with a right-angle delivery tube, or a stoppered conical flask with a 100 mL gas syringe | Yes: swap |
| 4 | Bunsen with air-hole collar | Instrument | Standard burner, yellow safety flame when shut, blue roaring cone when open; supplies activation energy where the family needs it | Yes: drag |
| 5 | Tongs, spatula and heat-proof mat | Instrument | 250 mm sprung tongs, nickel spatula and a 300 mm mat; the tongs are required for anything leaving the well hot | Yes: drag |
| 6 | Product tray | Instrument | Slide-out tray with four labelled watch glasses and two gas ports; populated only after the reaction runs, one slot per distinct product | Yes: drag |
| 7 | Product test kit | Instrument | Limewater tube for carbon dioxide, lit splint for the hydrogen pop, glowing splint for oxygen, universal indicator paper, and an evaporating basin on a tripod to crystallise a dissolved salt | Yes: connect |
| 8 | Atom sphere set | Particle | CPK spheres used in the molecular preview: Mg dark green r = 1.41 Å, Cu copper-brown 1.32 Å, Fe orange-brown 1.32 Å, O red 0.66 Å, H white 0.31 Å, C charcoal 0.76 Å, S yellow 1.05 Å, Cl green 1.02 Å, Na violet 1.66 Å, Ca grey-green 1.76 Å | No |
| 9 | Bond cylinders | Structure | 0.35 Å radius cylinders, single or double, drawn at real bond lengths; break and re-form in the preview window as the reaction runs | No |
| 10 | Word-tile rack | UI-Probe | Three magnetic banks: element and compound names in slate, acid names in maroon, salt endings and connectors (chloride, sulfate, nitrate, oxide, sulfide, water, hydrogen, carbon dioxide, +, →) in cream | Yes: drag |
| 11 | Equation rail | UI-Probe | Brass rail 900 mm wide with snap positions; tiles lock in order and the arrow tile can only be placed once | Yes: connect |
| 12 | Conservation lamp | Instrument | Green lamp at the rail's end that lights only when every element named on the left also appears on the right and nothing new is invented | No |
| 13 | Atom inventory panel | Overlay | Element tiles with BEFORE and AFTER counts read from the live scene graph, mirroring the equation the student built | No |
| 14 | Salt naming helper | UI-Probe | Small card linking each acid to its salt ending: hydrochloric to chloride, sulfuric to sulfate, nitric to nitrate; can be closed for a harder run | Yes: swap |
| 15 | Family badge | Overlay | Tag that appears once the equation is accepted, naming the pattern: metal plus oxygen, metal plus acid, acid plus carbonate, acid plus alkali, fuel plus oxygen, or element plus element | No |
| 16 | Equation checker | Instrument | Scores the rail on three counts: correct products, correct names, and arrow direction; reports the specific fault rather than a bare wrong | No |

**How it works — the model.**
Loading two bottles onto the pads selects a reaction from a table of six families, each with real reactants, real products and the activation conditions it needs. The rig runs the reaction physically first and populates the product tray from what the engine actually produced, so the student names observations rather than guesses. Naming is then a construction task on the rail, and the checker tests three things separately. The conservation lamp is the strictest: it compares the elements named on the left with those named on the right, so an equation like magnesium plus oxygen giving magnesium chloride is rejected because there is no chlorine anywhere on the left. The salt naming rule is enforced by the acid on the pad, not by a lookup of the answer, so swapping hydrochloric for sulfuric on the same metal changes the ending and the student can see why. Word equations only at this grade; no formulae and no balancing numbers.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reactant A | Dropdown | Magnesium / Copper / Iron / Zinc / Sulfur / Calcium carbonate / Methane | Magnesium | — | Structural change: which bottle is seated on pad A and what enters the well |
| Reactant B | Dropdown | Oxygen / Hydrochloric acid / Sulfuric acid / Nitric acid / Sodium hydroxide / Sulfur | Oxygen | — | Structural change: the second reactant, which decides the family |
| Glassware | Dropdown | Crucible on a triangle / Boiling tube with delivery tube / Stoppered flask with gas syringe | Crucible on a triangle | — | Which apparatus is fitted, and whether gases are captured or lost |
| Bunsen collar | Radio | Shut (safety flame) / Half open / Fully open | Shut (safety flame) | — | Heat supplied; families needing activation will not start on a safety flame |
| Amount of reactant A | Slider | 0.10–1.00 | 0.30 | g | How much product forms and how far the gas syringe travels |
| Product test | Dropdown | Limewater / Lit splint / Glowing splint / Indicator paper / Evaporate to crystals | Limewater | — | Which identification test runs on the selected product tray slot |
| Salt naming helper | Toggle | Open / Closed | Open | — | Whether the acid-to-salt-ending card is visible while building |
| Atom inventory | Toggle | On / Off | On | — | Shows the before and after element counts beside the rail |
| Check equation | Stepper | Press to check | Not checked | — | Scores the rail and lights or refuses the conservation lamp |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Burn a metal | A=Magnesium; B=Oxygen; glassware=Crucible on a triangle; collar=Fully open | One product, white and powdery. Build the equation and say what every metal burned in air gives you. |
| S2 | One metal, three salts | A=Magnesium; B cycled through Hydrochloric, Sulfuric and Nitric acid; glassware=Stoppered flask with gas syringe | The gas is the same every time and the solid is not. Name all three salts and state the rule you used. |
| S3 | Three products at once | A=Calcium carbonate; B=Hydrochloric acid; glassware=Boiling tube with delivery tube; test=Limewater | Fizzing, a warm damp tube and a salty solution. Prove each of the three products before you name any of them. |
| S4 | The impossible equation | A=Magnesium; B=Oxygen; build "magnesium + oxygen → magnesium chloride"; inventory=On | The conservation lamp refuses to light. Read the atom inventory and explain exactly what is wrong with the name you chose. |

**Student activities.**
1. Seat magnesium and oxygen on the pads, run the reaction with the collar fully open, and record the appearance and mass of the single product.
2. Build the word equation on the rail, press Check, and record the family badge you were awarded.
3. Swap the acid three times with magnesium fixed on pad A, and record the salt name and the gas test result for each run.
4. Run calcium carbonate with hydrochloric acid and record a test result for each of the three products before writing any names on the rail.
5. Deliberately place a product tile containing an element absent from the left-hand side, record what the conservation lamp and the atom inventory do, then correct it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Product tray contents | Data table | mixed | One row per product with appearance, state, mass or volume |
| Product test verdicts | Pass-fail badge | — | Limewater, splint, indicator or crystal result per product |
| Atom inventory | Data table | count | Element counts before and after, taken from the live scene |
| Conservation lamp | Pass-fail badge | — | Green only when no element appears on the right that is missing on the left |
| Equation score | Live numeric | points | Separate marks for correct products, correct names and arrow direction |
| Equation log | Data table | mixed | Reactants, family badge, equation built, faults reported; exportable CSV |

**What the student should realise.**
Students think a reaction is named by how it looks, and they will happily write a product containing an element that was never present. The conservation lamp refuses those names, and swapping one acid for another changes the salt in a predictable way, so naming turns out to follow from what went in. The student should be able to say: *"The name of a product comes from the elements that went in, so I can predict the name before I even see it."*

## B3 · Conservation of mass · MS-PS1-5

### B3.1 · Mass before and after, in a closed container

**Experiment name:** The Sealed Flask That Never Loses a Gram  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-5

**Theme & scene.**
A white bench under cool lab light, camera three-quarters on at pan level. A 250 mL conical flask stands on a black top-pan balance whose display glows green at 0.000 g. Inside the flask a small glass vial of white powder leans against the wall, held clear of the acid lying below it. A scarlet rubber bung is clamped down by a steel spring clip, and a clear acrylic draught shield rings the pan. Behind the flask a circular particle window magnifies a 4 nm patch of the liquid and the headspace above it. Along the top of the screen runs the atom inventory strip, one coloured counter per element. The control panel docks right; the grey tare square on the balance is pressable.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Top-pan balance | Instrument | 180×140×55 mm black ABS body, 120 mm stainless pan, 7-segment display to 0.001 g, tare key that depresses 1.5 mm and zeroes the reading | Yes: place |
| 2 | Conical flask | Instrument | 250 mL borosilicate, 85 mm base, 22 mm neck, 2.5 mm wall with a faint green edge tint, graduations at 50 mL intervals; tips about its base edge when dragged | Yes: drag, swap |
| 3 | Rubber bung and spring clip | Structure | Tapered scarlet bung 24→20 mm, plus a zinc-plated steel clip that hooks the neck flange; clip closes with a visible snap | Yes: swap |
| 4 | Inner reagent vial | Actor | 12×40 mm glass tube of white powder resting against the flask wall; tips and empties when the flask is rotated past 25° | Yes: drag |
| 5 | Acid solution body | Structure | 40 mL pale straw liquid with a drawn meniscus, refractive edge highlight, slight sloshing inertia when the flask is tilted | No |
| 6 | Sodium atom | Particle | Sphere r 1.66 Å, CPK violet, matte; labelled Na on hover | No |
| 7 | Carbon atom | Particle | Sphere r 0.76 Å, CPK charcoal, semi-gloss; labelled C on hover | No |
| 8 | Oxygen atom | Particle | Sphere r 0.66 Å, CPK red, gloss; labelled O on hover | No |
| 9 | Hydrogen atom | Particle | Sphere r 0.31 Å, CPK white, matte; labelled H on hover | No |
| 10 | Chlorine atom | Particle | Sphere r 1.02 Å, CPK green, semi-gloss; labelled Cl on hover | No |
| 11 | Bond cylinders | Structure | 0.12 Å radius rods; C=O double drawn as twin rods 0.4 Å apart at 0.116 nm, O–H single at 0.096 nm; stretch and snap on reaction | No |
| 12 | Headspace gas volume | Field | Invisible 210 cm³ compartment above the liquid holding free CO₂ molecules; pressure computed and shown on a small dial | No |
| 13 | Froth layer | Structure | Instanced bubble caps 0.5–3 mm on the liquid surface, translucent white, rise and pop over 0.6 s without deleting any molecule | No |
| 14 | Particle loupe window | UI-Probe | 200 px circular cutaway, 1×–60× zoom, black bezel, faint scanline; can be parked over liquid, headspace or the vial | Yes: drag, resize |
| 15 | Atom inventory strip | Overlay | Horizontal panel of five element counters (Na, C, O, H, Cl), each a coloured chip with a live integer and a small bar; updates every frame, not only at start and end | No |
| 16 | Draught shield | Environment | 200 mm clear acrylic four-sided box, 3 mm wall, open top; damps the airflow noise term on the balance | Yes: swap |

**How it works — the model.**
The engine runs a stoichiometric reaction ledger rather than free molecular dynamics. Each tick a fixed fraction of the remaining limiting reagent converts, NaHCO₃ + HCl → NaCl + H₂O + CO₂, one formula unit at a time, and every atom stripped from a reactant is re-instanced into a product inside the same frame. Atoms are never created or destroyed at any point in the update, which is why the inventory strip can be read live and not only before and after. The balance reading is derived: it sums every atom inside the sealed boundary times its relative atomic mass, adds the glass and bung tare, and prints the result. It is never a scripted number. Carbon dioxide is drawn as real molecules crowding the headspace, never as bubbles that dissolve into nothing at the surface, because the vanishing bubble is the misconception this experiment exists to kill.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reaction cartridge | Dropdown | Acid + hydrogencarbonate (gas) / Sodium carbonate + calcium chloride (precipitate) / Copper sulfate + sodium hydroxide (colour) / Iron + copper sulfate (displacement) | Acid + hydrogencarbonate | — | Swaps the reagents, the products, the visible change and the inventory elements |
| Solid reagent mass | Stepper | 0.50–5.00, step 0.25 | 2.00 | g | Atoms loaded into the inner vial; sets how much gas is made |
| Acid concentration | Slider | 0.10–1.00 | 0.50 | mol/L | Reaction rate and whether acid or solid is limiting |
| Vessel | Dropdown | 250 mL conical / 100 mL round-bottom / 50 mL sealed syringe barrel | 250 mL conical | — | Headspace volume, so the same gas reaches a different pressure |
| Bung clip | Toggle | Clamped / Resting | Clamped | — | Clamped holds to 3.0 bar; Resting lets the bung lift at 1.4 bar and vent |
| Balance resolution | Dropdown | 1 / 0.1 / 0.01 / 0.001 | 0.01 | g | How fine a change the display can show |
| Contents temperature | Slider | 5–40 | 20 | °C | Reaction speed and gas pressure in the headspace |
| Particle view | Toggle | On / Off | On | — | Shows or hides the loupe cutaway |
| Atom inventory | Toggle | On / Off | On | — | Shows or hides the live element counters |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling of the whole rig |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Fizz in a sealed flask | cartridge=Acid + hydrogencarbonate; solid=2.00; clip=Clamped; resolution=0.01 | The flask is full of froth and the gas is obviously new. By how much does the balance reading change? |
| S2 | A solid appears from two clear liquids | cartridge=Sodium carbonate + calcium chloride; concentration=0.60; clip=Clamped | A white solid forms where there was none. Does making a solid add mass? |
| S3 | Same reaction, fine balance, small flask | vessel=100 mL round-bottom; resolution=0.001; solid=5.00 | Pressure inside is now high. Read to 0.001 g: is there any change at all, or only the change you expected to see? |
| S4 | The seal that fails | clip=Resting; solid=5.00; concentration=1.00; vessel=100 mL round-bottom | The bung lifts partway through. Watch the reading and the inventory strip together: which atoms left, and where did they go? |

**Student activities.**
1. Press tare with the empty clamped flask on the pan, then load 2.00 g of solid into the inner vial and record the starting reading to 0.01 g.
2. Drag the flask to tilt it past 25° so the vial empties, and record the balance reading at 5 s, 20 s and 60 s in a three-row table.
3. Park the loupe over the headspace during the fizzing and count how many CO₂ molecules are present at 10 s and at 40 s. Say where those atoms were at the start.
4. Predict, in writing, the reading for S2 before running it, then run S2 and record whether making a solid changed the total.
5. Set the clip to Resting, run S4, and record the reading and the oxygen count at the moment the bung lifts and 20 s afterwards.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Balance reading | Live numeric | g | Derived from the atom sum, printed at the chosen resolution, updated 10× per second |
| Atom inventory | Counter | count | One live integer per element, shown before, during and after, always equal across the run |
| Mass vs time | Line graph | g vs s | A flat trace while sealed; a visible step down the instant a seal fails |
| Headspace pressure | Live numeric | bar | Gas pressure in the sealed volume, 2 dp |
| Free CO₂ molecules | Counter | count | How many gas molecules exist in the headspace right now |
| Run log | Data table | mixed | Start mass, end mass, difference, pressure and per-element counts per run; exportable CSV |

**What the student should realise.**
Students believe fizzing destroys matter and that a gas weighs nothing, so a reaction that bubbles must get lighter. Sealing the flask makes that untenable: the froth is loud, the pressure dial climbs, and the reading to 0.001 g does not move, because every atom is still inside the glass. The student should be able to say: *"The gas did not disappear, it just spread out inside the flask, and the atoms are all still on the pan."*

### B3.2 · Mass before and after, in an open container

**Experiment name:** Where Did the Grams Go? Catching the Escape  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-5

**Theme & scene.**
Two identical top-pan balances sit side by side on a long bench, lit flat. On the left balance an open conical flask fizzes freely and a faint blue-grey plume of gas drifts up and off the top of the frame. On the right, the twin flask is bunged, and a length of amber rubber tubing runs from its bung to a 100 cm³ glass gas syringe lying in a wooden cradle, its black plunger creeping outward. Behind both, a coil of steel wool waits under a lamp on a third pan. A dashed cyan system boundary can be dragged around whichever apparatus the student decides to count. The control panel docks right; the atom inventory strip runs across the top with a scope selector beside it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Balance A (open station) | Instrument | Black top-pan, 0.001 g display, 120 mm stainless pan, tare key; reading falls as gas leaves | Yes: place |
| 2 | Balance B (captured station) | Instrument | Identical twin unit, wide enough to take flask and syringe cradle together on one pan | Yes: place |
| 3 | Open conical flask | Instrument | 250 mL borosilicate, neck bare, faint green edge tint, froth visible to the shoulder | Yes: drag |
| 4 | Bung with single hole | Structure | Scarlet tapered bung, 7 mm bore, brass ferrule; seats with a soft push animation | Yes: place, swap |
| 5 | Delivery tubing | Structure | Amber rubber, 6 mm bore, 400 mm, physically slack and swinging; snaps to a port when an end is dropped within 20 mm | Yes: connect |
| 6 | Gas syringe | Instrument | 100 cm³ glass barrel, graduations every 2 cm³, black rubber-tipped plunger with near-zero friction, in a pine cradle | Yes: place, connect |
| 7 | Gas collection balloon | Instrument | 180 mm uninflated latex, pale grey, stretches over the neck; inflates and shows a buoyancy correction note | Yes: swap |
| 8 | Escaping gas plume | Particle | Emitter at the flask mouth releasing CO₂ molecules that rise, thin out and leave the frame; each departure decrements the flask compartment | No |
| 9 | Room air compartment | Field | Invisible reservoir holding N₂ and O₂ molecules, feeding the steel wool and receiving the plume | No |
| 10 | Steel wool coil and lamp | Actor | 30 mm ball of grey iron fibres on a ceramic gauze under a virtual heat lamp; fibres blacken and thicken as they oxidise | Yes: swap |
| 11 | Iron atom | Particle | Sphere r 1.32 Å, CPK orange-brown, metallic sheen | No |
| 12 | Oxygen molecule | Particle | Two red spheres r 0.66 Å, one 0.121 nm double-bond cylinder pair, tumbling | No |
| 13 | System boundary | Overlay | Dashed 2 px cyan rectangle with eight drag handles; whatever it encloses is what the inventory and the total mass count | Yes: drag, resize |
| 14 | Atom inventory strip | Overlay | Element counters with a scope selector; when scope is Flask only the counts visibly fall, when scope is Everything they hold | No |
| 15 | Mass vs time chart | Overlay | Twin traces, open station in amber and captured station in teal, on one shared axis pair | No |
| 16 | Particle loupe window | UI-Probe | 200 px cutaway, 1×–60× zoom, parkable over the flask mouth, the syringe barrel or the steel wool | Yes: drag |

**How it works — the model.**
Every atom belongs to exactly one compartment: flask, syringe, balloon, or room air. A reaction moves atoms between molecules; diffusion and buoyancy move whole molecules between compartments. A balance reports only the atoms in the compartments it is carrying, so the open flask reading falls at the rate CO₂ crosses its mouth, while the captured station reading holds because the syringe is on the same pan. The steel wool case runs the transfer the other way, 4Fe + 3O₂ → 2Fe₂O₃, pulling oxygen out of the room compartment onto the pan so the reading climbs. Gas mass is computed from atom counts, not assumed to be zero. The one thing the engine must never do is delete a molecule when it leaves the frame: it is moved to the room compartment, where the Everything scope can still find every atom of it.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Station A closure | Dropdown | Open / Bung only / Bung + gas syringe / Bung + balloon | Open | — | Whether escaping gas is lost, trapped in the flask, or caught on the same pan |
| Reaction | Dropdown | Acid + hydrogencarbonate (gas out) / Steel wool + air (gas in) / Copper carbonate heated (gas out) | Acid + hydrogencarbonate | — | Which direction atoms cross the boundary, and which elements appear in the strip |
| Reagent mass | Stepper | 0.50–6.00, step 0.25 | 3.00 | g | Total atoms available, so total possible mass change |
| Acid concentration | Slider | 0.10–1.00 | 0.50 | mol/L | How fast gas is produced and therefore how steep the fall is |
| Lamp power | Slider | 0–300 | 0 | W | Drives the steel wool and the carbonate decomposition |
| Inventory scope | Radio | Flask only / Flask + syringe / Everything | Flask only | — | What the atom counters are allowed to count |
| Bench airflow | Slider | 0.0–0.5 | 0.1 | m/s | Draught that speeds plume removal and adds balance noise |
| Balance resolution | Dropdown | 1 / 0.1 / 0.01 / 0.001 | 0.01 | g | Display fineness on both balances |
| Buoyancy correction | Toggle | On / Off | Off | — | Shows the small upthrust term on the inflated balloon, honestly labelled |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Open and losing | closure=Open; reaction=Acid + hydrogencarbonate; reagent=3.00; scope=Flask only | The reading falls by a definite amount. How much, and what exactly left the pan? |
| S2 | Catch it and get it back | closure=Bung + gas syringe; reagent=3.00; scope=Flask + syringe | Run the identical reaction with the syringe on the same pan. What is the change now, and why? |
| S3 | The reaction that gains | reaction=Steel wool + air; lamp=250; closure=Open; scope=Flask only | The open pan gets heavier. Where did the extra grams come from, and which counter proves it? |
| S4 | Draw the boundary yourself | closure=Open; reaction=Acid + hydrogencarbonate; scope=Everything | Stretch the dashed boundary to include the room air. Does anything change now? State the rule you have just found. |

**Student activities.**
1. Tare both balances, run S1 and S2 together, and record each reading at 0 s, 30 s and 120 s in a two-column table.
2. Drag the tubing end onto the syringe port to connect the capture line, then re-run and record the syringe volume and the balance change side by side.
3. Predict the sign of the change for steel wool before running S3, then run it and record the mass gained and the drop in the room oxygen counter.
4. Drag the system boundary from around the flask only to around the whole bench and record what happens to each element counter as you do it.
5. Compare your S1 loss with your S3 gain and write one sentence that covers both cases without using the words "lost" or "made".

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Balance A / Balance B reading | Live numeric | g | Both stations, chosen resolution, 10 updates per second |
| Mass vs time | Line graph | g vs s | Amber falling trace and teal flat trace on shared axes, the contrast is the point |
| Atom inventory | Counter | count | Per element, recomputed under the current scope; equal totals only when the scope covers everywhere |
| Gas captured | Live numeric | cm³ | Syringe plunger position, matched to a computed molecule count |
| Atoms outside the boundary | Counter | count | How many atoms the current boundary is failing to count |
| Run log | Data table | mixed | Closure, reaction, start mass, end mass, difference, gas volume; exportable CSV |

**What the student should realise.**
Students believe an open reaction proves mass is destroyed, and that a gas being invisible means it weighs nothing. Two identical reactions on two balances, one venting and one plumbed into a syringe, make that untenable, and steel wool gaining mass finishes it off. The apparent loss is bookkeeping, not physics. The student should be able to say: *"Mass only looks like it changes when I forget to weigh part of the system."*

### B3.3 · Atom-counting diagrams

**Experiment name:** The Balance Bench: No Atom Left Behind  
**Render mode:** 2D Canvas  
**Simulation engine:** State machine + Molecular  
**Interaction level:** Design  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-5

**Theme & scene.**
A dark slate workbench seen flat on, split by a heavy vertical arrow into a reactant side and a product side. Molecule tiles sit in a tray along the bottom, each drawn as a small ball-and-stick model on a rounded charcoal chip with its formula printed beneath. Dragging a tile onto either side snaps it into a slot on a faint grid. Above the arrow hangs a brass balance beam that tilts, live, toward whichever side has more atoms. Down the right edge stands the atom inventory panel: one row per element, a left bar and a right bar facing each other, red where they differ and green where they match. A padlock sits on the Accept button, shut. Bottom right, a small lit window previews the real apparatus.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Equation bench | Environment | 1280×520 px slate panel, 24 px snap grid, a 90 px brass reaction arrow dividing left from right | No |
| 2 | Molecule tile | Actor | 96×96 px rounded chip carrying a ball-and-stick glyph plus formula text; library includes H₂, O₂, N₂, Cl₂, H₂O, CH₄, CO₂, NH₃, HCl, NaCl, Na, Mg, MgO, Fe, Fe₂O₃, CuO, CuCO₃ | Yes: drag, place |
| 3 | Loose atom token | Particle | 40 px CPK-coloured disc with the element symbol: H white, C charcoal, O red, N blue, Cl green, Na violet, Mg dark green, Fe orange-brown, Cu orange | Yes: drag, place |
| 4 | Bond stick | Structure | 6 px charcoal rod between atom centres, doubled and offset 5 px for a double bond, tripled for a triple; drawn to scale inside every tile | No |
| 5 | Coefficient chip | UI-Probe | 34 px circular stepper clipped to a tile's left edge, values 1–8, click-up and click-down arrows; sets how many copies of that tile exist | Yes: drag |
| 6 | Subscript lock | Overlay | Small brass padlock glyph over each formula's subscripts; shakes and refuses when clicked while locked | No |
| 7 | Atom inventory panel | Overlay | One row per element present, left bar and right bar meeting at a centre line, integer readout on each, green when equal and red when not; updates on every drag frame | No |
| 8 | Balance beam meter | Instrument | 320 px brass beam on a pivot, tilt angle proportional to the largest per-element mismatch, capped at 18° | No |
| 9 | Accept gate | Instrument | Wide button with a padlock; the padlock only opens when every element row is green, and a click while shut prints the name of the element that is short and by how many | No |
| 10 | Refusal message strip | Overlay | Amber text line under the gate: "Right side is short 2 oxygen atoms" with the offending row pulsing | No |
| 11 | Recycle bin | Instrument | 72 px hopper bottom left; a tile dropped in is removed and its atoms leave the inventory immediately | Yes: drag |
| 12 | Equation card deck | Structure | Stack of 10 cards, each printing an unbalanced skeleton equation and a short real-world caption | Yes: swap |
| 13 | Reaction preview window | Overlay | 320×220 px lit vignette showing the balanced equation running as real apparatus: crucible, tongs, Bunsen flame, gas syringe, with the same molecules in motion | No |
| 14 | Consequence viewer | Overlay | Opens when formula editing is unlocked: shows that H₂O with the subscript changed to H₂O₂ is a different liquid with different properties, not a balanced water equation | No |
| 15 | Hint lamp | UI-Probe | Small brass lamp; one press highlights the element row furthest from balance, a second suggests which side needs a coefficient | Yes: drag |
| 16 | Attempt counter and timer | Instrument | Corner readout: attempts made, refusals received, seconds elapsed | No |

**How it works — the model.**
The bench holds a multiset of atoms, nothing more. Each tile declares its formula, so placing 3 copies of H₂O adds 6 H and 3 O to the right multiset. The atom inventory panel is a live diff of the two multisets, recomputed on every drag frame rather than on submit, so the bars move under the student's hand. The Accept gate is a hard state machine guard: the balanced state requires every element's left count to equal its right count, and no other condition unlocks it. A press while unbalanced does not fail silently, it names the deficit. Subscripts are locked because changing them changes the substance, not the count, and the consequence viewer demonstrates that instead of merely asserting it. Coefficients are the only lever, which is the whole grammar of balancing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Equation card | Dropdown | Methane burning / Hydrogen burning / Magnesium burning / Iron rusting / Copper carbonate heated / Ammonia making / Sodium and chlorine / Acid and hydrogencarbonate / Photosynthesis / Rocket hydrogen | Methane burning | — | Loads a new skeleton equation, tray of tiles and preview apparatus |
| Build mode | Radio | Set coefficients / Place whole molecules / Build from loose atoms | Set coefficients | — | Structural: changes what you drag and how much scaffolding you get |
| Coefficient limit | Stepper | 1–8 | 6 | count | The highest coefficient a chip will accept, to keep answers sensible |
| Formula editing | Toggle | Locked / Show consequence | Locked | — | Unlocking opens the consequence viewer instead of allowing a bogus balance |
| Atom inventory | Toggle | On / Off | On | — | Shows or hides the live left-versus-right bars |
| Auto-snap | Toggle | On / Off | On | — | Tiles snap to grid slots or stay where dropped |
| Reaction preview | Toggle | On / Off | On | — | Shows the balanced reaction running as real apparatus |
| Hints | Stepper | 0–3 | 0 | count | How many hint presses are available on this card |
| Challenge timer | Toggle | On / Off | Off | — | Adds a visible clock and logs time per card |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One coefficient short | card=Hydrogen burning; mode=Set coefficients; hints=1 | H₂ + O₂ → H₂O refuses to accept. Which element is short, and what is the smallest set of coefficients that fixes it? |
| S2 | Build it atom by atom | card=Magnesium burning; mode=Build from loose atoms; inventory=On | Assemble both sides from loose tokens. How many magnesium and oxygen atoms did you need on each side, and were they the same atoms? |
| S3 | The tempting shortcut | card=Methane burning; formula editing=Show consequence | Try to balance the oxygen by editing a subscript. What does the consequence viewer show you have actually made? |
| S4 | A big one, from a real furnace | card=Copper carbonate heated; limit=8; preview=On | Balance the decomposition, then watch the preview. Does the crucible plus the gas syringe hold the same atoms it started with? |

**Student activities.**
1. Drag tiles onto both sides for the hydrogen card, read the atom inventory panel, and record which element is short before touching a coefficient.
2. Press Accept while the equation is unbalanced and copy the refusal message word for word into your notes.
3. Set coefficients until every inventory row turns green, then record the balanced equation and the final per-element counts.
4. Switch Build mode to Build from loose atoms and rebuild the magnesium card, recording how many atoms of each element you placed on each side.
5. Compare the atom inventory before and after on any card and write one sentence explaining why the coefficient chips are the only thing you were allowed to change.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Per-element left and right counts | Counter | count | Two integers per element, live, red when unequal and green when matched |
| Imbalance meter | Bar chart | count | Signed difference per element, drawn as bars either side of a centre line |
| Balance beam tilt | Live numeric | degrees | Tilt angle proportional to the worst mismatch, zero when balanced |
| Accept gate | Pass-fail badge | — | Locked or unlocked, with the reason printed when locked |
| Attempts and refusals | Counter | count | How many submissions were made and how many were refused, per card |
| Card log | Data table | mixed | Card name, final coefficients, attempts, time taken; exportable CSV |

**What the student should realise.**
Students treat balancing as a puzzle about symbols, and their standard cheat is to change a subscript. The bench refuses that outright and shows what the edited formula would actually be, while the inventory bars turn a symbolic exercise into a headcount. Coefficients say how many molecules, subscripts say what a molecule is. The student should be able to say: *"Balancing is not tidying the equation, it is making sure I have not invented or deleted a single atom."*

### B3.4 · Why mass conservation follows from atom conservation

**Experiment name:** The Atom Bank: Rearrange All You Like  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-5

**Theme & scene.**
A 200 mm glass sphere sits on a heavy balance in a dim room, lit from inside by the faint glow of its own contents. Molecules drift within it, bond sticks catching the light. To the left, mounted on the wall, is the atom bank: seven glass bins labelled H, C, O, N, S, Fe and Cu, each holding loose atoms in CPK colours and stencilled with its relative atomic mass. A pair of chrome bond tongs floats near the cursor, jaws open. Beneath the sphere, two panels glow: the atom inventory with one counter per element, and the mass ledger, a spreadsheet whose columns read count, relative atomic mass and mass, with a bold total. A spark electrode pair pierces the sphere wall. The control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sealed reaction sphere | Instrument | 200 mm borosilicate globe, 4 mm wall, ground flange and clamp collar, faint interior fog; sits on a saddle so it cannot roll | Yes: swap |
| 2 | Precision balance | Instrument | 0.0001 g display, 160 mm pan, anti-vibration feet, tare key; reading is always the ledger total plus the glass tare | No |
| 3 | Atom bank bins | Structure | Seven 60×90 mm glass hoppers on a wall rail, each with an element symbol, a CPK-coloured fill and its Ar stencilled below (H 1, C 12, N 14, O 16, S 32, Fe 56, Cu 64) | Yes: swap |
| 4 | Hydrogen atom | Particle | Sphere r 0.31 Å, CPK white, matte; mass tag 1 on hover | Yes: drag |
| 5 | Carbon atom | Particle | Sphere r 0.76 Å, CPK charcoal, semi-gloss; four bonding sites drawn as faint dimples | Yes: drag |
| 6 | Oxygen atom | Particle | Sphere r 0.66 Å, CPK red, gloss; two bonding sites | Yes: drag |
| 7 | Bond cylinder | Structure | 0.12 Å radius rod; C–H at 0.109 nm, O=O drawn as twin rods at 0.121 nm, C=O twin rods at 0.116 nm; glows and snaps when broken | Yes: connect |
| 8 | Bond tongs | Instrument | 120 mm chrome tool following the cursor; closing on a bond costs the bond energy in kJ/mol from the energy budget and splits it | Yes: drag |
| 9 | Spark electrode pair | Actor | Two tungsten pins 8 mm apart through the sphere wall; fires a blue-white arc that supplies activation energy to nearby molecules | Yes: place |
| 10 | Atom inventory panel | Overlay | One counter per element with a small sparkline of the last 30 s; the counters are wired to the same array the renderer draws from, so they cannot drift | No |
| 11 | Mass ledger panel | Overlay | Table of element, count, Ar, count × Ar, with a bold total row; recomputed every frame from the inventory | No |
| 12 | Annihilate tool | Instrument | Red-handled tool that appears to delete an atom; on use it plays a refusal, restores the atom and prints "atoms cannot be removed from a sealed system" | Yes: drag |
| 13 | Chamber gauges | Instrument | Small brass dials on the flange for pressure in bar and temperature in °C | No |
| 14 | Neighbour snap guides | Overlay | Faint white arcs showing valid bonding geometry when a dragged atom is within 0.25 nm of a partner | No |
| 15 | Reaction timeline scrubber | UI-Probe | 900 px track under the bench with keyframes at each bond break and each bond made; dragging replays the rearrangement | Yes: drag |
| 16 | Soot and water film | Structure | Cosmetic products of incomplete burning: charcoal specks and a thin condensate film on the inner glass, both made of counted atoms | No |

**How it works — the model.**
The sphere owns a fixed array of atom objects. Bonds are edges over that array. Every operation the student can perform, spark, tongs, heat, drag, only adds or removes edges. No operation adds or removes a vertex while the chamber is sealed, and the annihilate tool exists purely to be refused so the constraint becomes something the student has tested rather than been told. Mass is derived from the array with a single sum, mass = Σ(count × Ar), printed as a ledger and echoed by the balance. Breaking a bond costs energy and making one releases it, so the temperature gauge moves during a reaction while the ledger total does not, which separates energy change from mass change cleanly. Opening the bank makes atoms crossable, and the total then changes by exactly the mass of what crossed, never by anything else.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Starting mixture | Dropdown | CH₄ + 2 O₂ / 2 H₂ + O₂ / N₂ + 3 H₂ / 2 Mg + O₂ / Fe + CuSO₄ solution | CH₄ + 2 O₂ | — | Loads a different atom set, so a different ledger and different bonds |
| Chamber seal | Toggle | Sealed / Bank open | Sealed | — | Structural: whether atoms may cross between the sphere and the wall bins |
| Spark energy | Slider | 0–800 | 0 | kJ/mol | Energy delivered per arc; sets whether the reaction starts at all |
| Bond tongs strength | Slider | 100–1000 | 400 | kJ/mol | The strongest bond the tongs can break by hand |
| Chamber temperature | Slider | 15–900 | 25 | °C | Molecular speed, collision rate and how fast the rearrangement proceeds |
| Relative atomic masses | Dropdown | Whole numbers / One decimal place | Whole numbers | — | Precision used in the ledger and the balance |
| Mass ledger | Toggle | On / Off | On | — | Shows or hides the count × Ar spreadsheet |
| Bank bin contents | Stepper | 0–40 atoms per bin | 20 | count | Structural: how many loose atoms are available when the bank is open |
| Timeline scrubber | Timeline scrubber | 0–180 | 0 | s | Replays the run keyframe by keyframe, forwards or backwards |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Burn it and count it | mixture=CH₄ + 2 O₂; seal=Sealed; spark=600 | The methane is gone and there is water on the glass. What happened to the carbon, hydrogen and oxygen counters, and to the ledger total? |
| S2 | Break bonds by hand | mixture=2 H₂ + O₂; tongs strength=600; spark=0 | Break every bond with the tongs so nothing is joined to anything. Does the balance reading change? |
| S3 | Try to lose an atom | mixture=2 Mg + O₂; seal=Sealed; spark=500 | Use the annihilate tool on a magnesium atom. What does the system do, and what does that tell you about the ledger? |
| S4 | Open the bank | seal=Bank open; bin contents=20; mixture=N₂ + 3 H₂ | Drag six hydrogen atoms in from the wall bin. By how much does the total change, and can you predict it before it updates? |

**Student activities.**
1. Record the atom inventory and the ledger total for the starting mixture, then fire the spark and record both again after the reaction settles.
2. Drag the timeline scrubber to the exact frame a C–H bond breaks and record the inventory at that instant, mid-reaction.
3. Break every bond in the chamber with the tongs and record the balance reading before, during and after, then explain the reading in one sentence.
4. Attempt to delete an atom with the annihilate tool and copy down the refusal message.
5. Open the bank, drag in a known number of oxygen atoms, and predict the new ledger total from count × Ar before you look at it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom inventory | Counter | count | One live counter per element, before, during and after, with a 30 s sparkline |
| Mass ledger | Data table | g | Element, count, Ar, count × Ar and a bold total, recomputed every frame |
| Balance reading | Live numeric | g | The ledger total plus tare, to 4 dp, so any real change would be unmissable |
| Bond count | Line graph | count vs s | Total bonds against time, which drops and recovers while the atom count does not |
| Chamber temperature | Line graph | °C vs s | Rises during an exothermic rearrangement, proving energy changed while mass did not |
| Conservation check | Pass-fail badge | — | Green while atoms in equals atoms out for the current boundary, amber the moment the bank is opened |

**What the student should realise.**
Students accept mass conservation as a rule to remember, so they abandon it whenever a reaction looks dramatic. Here mass is not a rule, it is a sum: the ledger multiplies fixed counts by fixed atomic masses, so it cannot move unless a count moves, and no tool in the chamber can move one. The student should be able to say: *"Reactions only rearrange atoms, and since every atom keeps its mass, the total has nowhere else to go."*

### B3.5 · Applying conservation to an unfamiliar reaction

**Experiment name:** The Missing Product: Weigh What You Cannot See  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Molecular  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-5

**Theme & scene.**
An analysis bench in a dim room. A fused-silica tube runs through a stubby tube furnace whose element coil glows dull orange behind a slotted shield, and inside the tube a small ceramic boat holds an unlabelled green powder. Out of the far end an amber line drops into a U-tube sunk in a beaker of crushed ice, then rises to a 100 cm³ gas syringe on a cradle. Everything, furnace excepted, stands on one wide balance pan reading to 0.001 g. To the right, a dark dashboard shows a mass table with one cell blank and pulsing, and beneath it a prediction pad with a numeric field and a locked Reveal button. Six sealed sample vials wait in a rack labelled A to F.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Tube furnace | Instrument | 220 mm ceramic barrel, coiled Kanthal element visible through a slot, digital setpoint head, dull orange glow above 400 °C with a heat shimmer overlay | Yes: place |
| 2 | Fused-silica reaction tube | Instrument | 25 mm bore, 400 mm long, transparent with a faint smoke tint; ground ends take rubber connectors | Yes: swap |
| 3 | Ceramic sample boat | Actor | 60×12 mm white alumina trough with a small ridge; slides into the tube on a hooked rod and holds 0.5–5 g of powder | Yes: drag, place |
| 4 | Sample vials A–F | Structure | Six 15×45 mm screw-top vials in a wooden rack: green powder, silver ribbon, blue crystals, white chips, grey granules, yellow powder | Yes: drag, swap |
| 5 | Cold trap U-tube | Instrument | 12 mm bore glass U in crushed ice, condensate beads forming on the inner wall and pooling; captures water vapour only | Yes: connect |
| 6 | Gas syringe | Instrument | 100 cm³ glass barrel, 2 cm³ graduations, low-friction black plunger in a pine cradle, on the same pan as the tube | Yes: connect |
| 7 | Delivery line | Structure | Amber rubber, 6 mm bore, in two slack segments; snaps to a port when dropped within 20 mm of it | Yes: connect |
| 8 | Wide balance pan | Instrument | 300×200 mm stainless deck under the whole train, 0.001 g display, tare key; the pan boundary is drawn as a thin cyan edge | No |
| 9 | Residue in the boat | Structure | Product solid replacing the sample: matte black powder, white ash, or grey sinter depending on the run; volume shrinks or swells visibly | No |
| 10 | Gas analyser head | Instrument | Small grey box on the syringe line with a two-line display naming the gas and its molar mass once a run ends | Yes: place |
| 11 | Atom inventory strip | Overlay | Live per-element counters across the top with a scope selector for Boat / Boat + trap / Whole pan; counts never differ under the widest scope | No |
| 12 | Mass ledger table | Overlay | Dashboard rows for each named substance with start mass, end mass and one deliberately blank cell that pulses amber | No |
| 13 | Prediction pad | UI-Probe | Numeric entry 0.00–20.00 g with a submit key, a written-reason box, and a locked Reveal button beside it | Yes: drag |
| 14 | Tolerance badge | Instrument | Circular badge that turns green within ±0.05 g of the true value, amber within ±0.20 g, red beyond | No |
| 15 | Particle loupe window | UI-Probe | 200 px cutaway parkable over boat, trap or syringe, showing the actual molecules present at 40× | Yes: drag |
| 16 | Timeline scrubber | UI-Probe | 900 px track with keyframes at ignition, peak gas evolution and end of run | Yes: drag |

**How it works — the model.**
Each sample card carries a real stoichiometry and real molar masses, and the engine runs it as an atom ledger exactly like a sealed system: CuCO₃ → CuO + CO₂, 2Mg + O₂ → 2MgO, CuSO₄·5H₂O → CuSO₄ + 5H₂O, CaCO₃ → CaO + CO₂. Mass of each named product is computed from atom counts times relative atomic masses, so the number the student is asked to predict is genuinely determined rather than invented. The dashboard withholds exactly one product mass, the one that left the boat, and the pan total is available throughout. The student therefore has total in, total out minus one, and must close the ledger. The reveal step is gated behind a submitted prediction so the sim cannot be reverse-engineered by peeking, and the analyser only names the gas after the guess is locked.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample | Dropdown | A green powder / B silver ribbon / C blue crystals / D white chips / E grey granules / F yellow powder | A green powder | — | Structural: loads a different real reaction, residue colour, gas and ledger |
| Sample mass | Stepper | 0.50–5.00, step 0.25 | 2.00 | g | Atoms loaded, so every product mass scales with it |
| Furnace temperature | Slider | 100–900 | 500 | °C | Whether the reaction starts, and how fast it runs to completion |
| Capture route | Dropdown | Vented to air / Cold trap only / Cold trap + gas syringe | Cold trap + gas syringe | — | Structural: which products stay on the pan and which leave it |
| Inventory scope | Radio | Boat / Boat + trap / Whole pan | Whole pan | — | What the element counters are allowed to count |
| Your prediction | Numeric field | 0.00–20.00, step 0.01 | 0.00 | g | The missing product mass you are committing to |
| Reveal answer | Toggle | Locked / Unlock | Locked | — | Only unlocks after a prediction is submitted; shows the true value and the analyser result |
| Repeat runs | Stepper | 1–5 | 1 | count | Runs the same sample several times so the student can see spread, not a single number |
| Balance resolution | Dropdown | 0.1 / 0.01 / 0.001 | 0.001 | g | Display fineness on the pan |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The green powder that goes black | sample=A green powder; mass=2.00; temperature=500; route=Cold trap + gas syringe | 2.00 g in, 1.29 g of black residue out. What mass of gas came off, and how do you know before the analyser tells you? |
| S2 | The ribbon that gets heavier | sample=B silver ribbon; mass=1.20; temperature=700; route=Vented to air | The residue outweighs the sample. Predict the mass of oxygen that joined it, then check. |
| S3 | Crystals that dry out | sample=C blue crystals; mass=2.50; temperature=250; route=Cold trap only | The trap fills with a clear liquid. Predict its mass, and say why the syringe stays empty. |
| S4 | Vented and unrecoverable | sample=D white chips; mass=3.00; route=Vented to air; scope=Boat | Nothing was captured this time. Can you still work out the missing mass, and what evidence are you relying on? |

**Student activities.**
1. Drag sample A into the boat, slide the boat into the tube, connect the line to the syringe, tare the pan and record the starting mass.
2. Run the furnace to completion, then record the residue mass, the trap mass and the syringe volume in a four-row table.
3. Predict the missing product mass in the prediction pad and type one sentence of reasoning before pressing submit. Do not unlock Reveal first.
4. Unlock Reveal, record the true value and your error, and note what the gas analyser named.
5. Repeat with sample B, where the residue is heavier than the sample, and state which direction atoms crossed the pan boundary this time.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Pan mass | Live numeric | g | Total on the balance to 0.001 g, live through the whole run |
| Mass ledger | Data table | g | Substance, start mass, end mass, with the withheld cell blank until reveal |
| Prediction error | Live numeric | g | Signed difference between the student's entry and the true value, shown only after submit |
| Tolerance check | Pass-fail badge | — | Green within ±0.05 g, amber within ±0.20 g, red beyond |
| Atom inventory | Counter | count | Per element under the chosen scope; equal only when scope is Whole pan |
| Gas identity | Live numeric | g/mol | Analyser reading naming the gas and its molar mass, released after prediction |
| Run log | Data table | mixed | Sample, mass in, residue, trap, syringe, prediction, true value, error; exportable CSV |

**What the student should realise.**
Students think conservation is a fact to recite about reactions they already know, and are stuck the moment a reaction is unfamiliar. Here they meet an unnamed sample and still get the answer, because the ledger closes whether or not you can name the chemistry. Conservation is a tool for finding an unknown, not a slogan. The student should be able to say: *"I did not need to know what it was, I only needed everything else to add up."*

## B4 · Thermal energy, particles and states · MS-PS1-4

### B4.1 · Energy added and particle motion, revisited

**Experiment name:** Joules In, Speed Up: The Calorimeter Bench  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Particle system  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A polished copper calorimeter can sits inside a felt-lined outer jacket on a black bench, its lid pierced by three brass ports. Through them go a coiled immersion heater, a stainless thermometer probe and a slim stirrer shaft turned by a small grey motor. A joulemeter box beside the can counts energy delivered in glowing amber digits. Above the can floats a circular particle window, a 5 nm cutaway of the liquid where individual molecules jostle, each trailing a short motion streak whose length is its speed. Below the window sits a speed histogram, a row of teal bars that shifts to the right as the liquid warms. The temperature-time plot runs along the bottom of the screen. Control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Copper calorimeter can | Instrument | 70 mm diameter, 90 mm tall, 0.5 mm polished copper, rolled rim, 100 g mass tag on the flank | Yes: swap |
| 2 | Insulating jacket | Structure | Outer 110 mm plastic vessel with 15 mm felt lagging, removable in one piece; swappable for none or a vacuum flask | Yes: swap |
| 3 | Calorimeter lid and ports | Structure | 4 mm black nylon disc with three 8 mm brass grommets, a stirrer bearing at the centre | No |
| 4 | Immersion heater | Instrument | 6 mm nichrome coil in a silica sheath, 80 mm submerged length, glows dull red above 60 W, delivers exactly the set power | Yes: place, swap |
| 5 | Joulemeter and supply | Instrument | 120×80 mm box with amber 4-digit display in J, a power knob and a reset key; energy total is the integral of power over time | No |
| 6 | Thermometer probe | Instrument | 2 mm stainless stem, digital head reading −10 to 120 °C to 1 dp, response time 1.5 s so it lags slightly and honestly | Yes: drag |
| 7 | Stirrer paddle and motor | Actor | 30 mm PTFE cross-paddle on a 3 mm shaft, 0–600 rpm, drags a shallow vortex dimple in the surface | Yes: swap |
| 8 | Liquid body | Structure | Filled to a drawn meniscus with a refractive edge; colour and viscosity change with the substance chosen | Yes: resize |
| 9 | Substance particles | Particle | Water as bent red-white triads r 0.15 u; ethanol as a two-carbon chain with a red-white tail; olive oil as long kinked chains; aluminium as a close-packed lattice of grey spheres | No |
| 10 | Motion streak trails | Overlay | Short comet tails behind each particle, length proportional to instantaneous speed, redrawn every frame | No |
| 11 | Particle loupe window | UI-Probe | 220 px circular cutaway, 1×–80× zoom, parkable anywhere in the liquid or against the heater coil | Yes: drag, resize |
| 12 | Speed histogram | Overlay | 24 teal bars binning particle speeds 0–1200 m/s, mean marked by a white line that slides right as temperature climbs | No |
| 13 | Heat-loss field | Field | Invisible conduction term through jacket and lid proportional to the can-to-room temperature difference, drawn as faint escaping arrows when overlay is on | No |
| 14 | Temperature-time plot | Overlay | 900×220 px dark chart, °C against s, one trace per run, previous runs kept as ghost traces | No |
| 15 | Clamp stand and boss | Environment | Cast base, 12 mm steel rod, two bosses holding heater and thermometer clear of the can wall | Yes: drag |
| 16 | Stopwatch | Instrument | 40 mm bench timer, start and lap keys, reads to 0.1 s | Yes: drag |

**How it works — the model.**
Bulk heating obeys E = m·c·ΔT with a heat-loss term: each tick the can gains P·Δt joules from the heater and loses k·(T − T_room)·Δt to the room, and the temperature rises by the net divided by m·c. Substance choice sets c: water 4180, ethanol 2440, olive oil 1970, aluminium 900 J/kg·°C. The particle view is driven by the same temperature, not animated independently. Mean particle speed is scaled so that average kinetic energy is proportional to absolute temperature, so the histogram widens and shifts right together rather than merely sliding. Every run stays strictly inside one phase, deliberately, so no plateau appears and the student meets the clean proportional case first. The sim must never draw a small number of tiny balls inside an otherwise continuous liquid; the loupe is a cutaway of the whole substance, not a sprinkle of particles in it.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Heater power | Slider | 0–100 | 50 | W | Joules delivered per second, so the steepness of the temperature rise |
| Mass of substance | Slider | 50–500 | 200 | g | How many particles share the energy, so how much the temperature climbs |
| Substance | Dropdown | Water / Ethanol / Olive oil / Aluminium block / Dry sand | Water | — | Structural: swaps particle model, colour, viscosity and specific heat capacity |
| Insulation | Dropdown | None / Felt jacket / Vacuum flask | Felt jacket | — | Structural: sets the heat-loss constant k, and whether lagging is drawn |
| Stirrer speed | Slider | 0–600 | 200 | rpm | How evenly heat spreads; at 0 a hot layer forms around the coil |
| Room temperature | Slider | 10–30 | 20 | °C | The target the can leaks towards when the heater is off |
| Starting temperature | Slider | 5–60 | 20 | °C | Where the trace begins, kept clear of any phase change |
| Particle view | Toggle | On / Off | On | — | Shows or hides the loupe cutaway and its motion streaks |
| Speed histogram | Toggle | On / Off | On | — | Shows or hides the distribution of particle speeds |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling of heating and particle motion together |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Baseline warm-up | substance=Water; mass=200; power=50; insulation=Felt jacket | How many joules does the joulemeter show for the first 10 °C rise, and what is the slope of the trace in °C per minute? |
| S2 | Twice the water | mass=400; power=50; substance=Water | Same power, double the mass. Predict the new slope before running, then measure it. |
| S3 | Same joules, different substance | substance=Olive oil; mass=200; power=50 | Deliver exactly 20 000 J to oil and to water in turn. Why does one end up much hotter? |
| S4 | Leaky and lidless | insulation=None; power=20; room=10; stirrer=0 | The trace bends over and stops climbing. What is happening at the point where it flattens, and is it a state change? |

**Student activities.**
1. Set water, 200 g, 50 W, and record temperature every 30 s for 5 minutes alongside the joulemeter reading.
2. Park the loupe in the middle of the liquid and record the mean speed marker on the histogram at 20 °C, 40 °C and 60 °C.
3. Predict the slope for 400 g before running S2, then measure it and record your predicted and actual values side by side.
4. Deliver 20 000 J to olive oil and to water and record the final temperature of each, then compare with their specific heat capacities.
5. Run S4 with no insulation and mark on your plot the time at which the trace stops rising, then explain the flattening without using the word melting.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Temperature | Live numeric | °C | Probe reading to 1 dp with its honest 1.5 s lag |
| Energy delivered | Live numeric | J | Running joulemeter total, resettable between runs |
| Temperature vs time | Line graph | °C vs s | Live trace with earlier runs retained as ghosts for comparison |
| Mean particle speed | Live numeric | m/s | Average over all particles in the loupe volume, updated every 0.5 s |
| Speed distribution | Bar chart | count vs m/s | 24-bin histogram that shifts right and broadens as temperature rises |
| Heat lost to room | Live numeric | W | Instantaneous loss term, so students can see why the trace bends |
| Run log | Data table | mixed | Substance, mass, power, insulation, joules in, ΔT, slope; exportable CSV |

**What the student should realise.**
Students use heat and temperature as the same word, so they expect one heater to give the same temperature rise in anything. Two identical 20 000 J deliveries ending at different temperatures make that untenable: energy is what you put in, temperature is how fast the particles move on average, and mass and substance sit between them. The student should be able to say: *"Temperature tells me how fast the particles are moving, not how much energy is in there."*

### B4.2 · Forces between particles

**Experiment name:** Pull Them Apart: The Stickiness Dial  
**Render mode:** 3D Scene  
**Simulation engine:** Molecular + Field/vector  
**Interaction level:** Manipulate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A dark instrument bay split in two. On the left, a micro-manipulator bench: two chrome tweezer arms hold a single pair of particles a fraction of a nanometre apart, each particle wrapped in a soft blue halo that thickens as they approach. A slim force probe bridges one arm, its digital face reading piconewtons, and a nanometre ruler is etched along the stage. On the right stands a sealed 40 mm observation cell packed with three hundred of the same particles over a small hotplate, a thermometer stem through its cap, and a state badge above it that reads SOLID, LIQUID or GAS. Between the two, a force-separation graph glows. The stickiness dial is the largest control on the panel, docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Micro-manipulator arms | Instrument | Two 90 mm chrome arms on lead screws, jaws 0.1 nm at the tip, one fixed and one draggable along the stage axis | Yes: drag |
| 2 | Test particle A | Particle | Sphere r 0.15 u in the current substance's colour, with a matte body and a specular highlight; hover shows its mass in u | Yes: swap |
| 3 | Test particle B | Particle | Identical twin of A, mounted on the moving arm; separation from A is read live off the stage ruler | Yes: swap |
| 4 | Attraction halo field | Field | Volumetric blue glow around each particle, opacity ∝ field strength, visibly overlapping and brightening below 0.4 nm | No |
| 5 | Force probe | Instrument | 30 mm strain gauge on the moving arm, digital face reading 0–600 pN to 1 dp, needle bends visibly under load | Yes: place |
| 6 | Nanometre stage ruler | Instrument | Etched scale 0.0–2.0 nm with 0.05 nm graduations, illuminated tick under the moving jaw | No |
| 7 | Hydrogen-bond glyph | Overlay | Dashed white line with three short cross-ticks, drawn only for the water-like substance when two particles align head to tail | No |
| 8 | Observation cell | Instrument | 40 mm sealed borosilicate cube, 3 mm wall, ground cap with a thermometer grommet, faint interior fog | Yes: resize |
| 9 | Bulk particles | Particle | 50–400 instanced copies of the test particle, colliding, clumping or streaking according to temperature and attraction | No |
| 10 | Hotplate and thermometer | Instrument | 45 mm ceramic hotplate under the cell glowing dull orange above 300 °C, plus a 2 mm probe reading −100 to 900 °C | Yes: place |
| 11 | Force-separation graph | Overlay | 420×260 px chart, force in pN against separation in nm, with the well minimum marked and the current jaw position tracked by a live dot | No |
| 12 | State badge | Instrument | 140 px plate above the cell reading SOLID, LIQUID or GAS, decided by measured particle mobility, not by a scripted label | No |
| 13 | Escape counter | Instrument | Invisible plane at the cell's upper surface counting particles that break free per second | No |
| 14 | Substance cards | Structure | Four physical cards in a slot reader: helium-like sphere, water-like bent triad, wax-like long chain, salt-like charged pair | Yes: swap |
| 15 | Snap-back animation | Overlay | When the jaws release, the two particles accelerate together and collide, with a small impact flash scaled to the well depth | No |
| 16 | Melting and boiling readout | Instrument | Two amber digits above the cell showing the temperatures at which the state badge last changed | No |

**How it works — the model.**
Each pair of particles interacts through a Lennard-Jones style well with two knobs the student owns: well depth ε in kJ/mol, which is the stickiness dial, and equilibrium separation r₀ in nm. Force is repulsive below r₀, attractive above it, and fades to nothing beyond about 3 r₀, and the probe reads exactly that force as the jaw is dragged. The same ε drives the bulk cell: particles are compared each tick, and the state badge is decided by measured mobility, whether a particle keeps its neighbours, exchanges them, or leaves entirely. Melting and boiling temperatures are therefore emergent from ε rather than typed in, so raising the dial visibly raises both. The model must never present attraction as an on-off bond; the graph shows a smooth curve, because forces between particles weaken with distance rather than snapping.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Attraction strength | Dial | 0.5–60 | 20 | kJ/mol | Depth of the attraction well, so the pull on the probe and both state-change temperatures |
| Substance card | Dropdown | Helium-like sphere / Water-like triad / Wax-like chain / Salt-like charged pair | Water-like triad | — | Structural: swaps particle shape, mass, halo colour and whether the hydrogen-bond glyph appears |
| Particle mass | Slider | 4–200 | 18 | u | How fast particles move at a given temperature, and how sharply they snap back |
| Equilibrium separation | Slider | 0.20–0.60 | 0.30 | nm | Where the force crosses zero, so the natural spacing in the packed solid |
| Jaw separation | Drag-handle | 0.20–2.00 | 0.30 | nm | Directly pulls the two test particles apart while the probe reads the force |
| Cell temperature | Slider | −100–900 | 25 | °C | Bulk particle speeds, and therefore which state the badge shows |
| Particle count | Stepper | 50–400 | 300 | count | How densely the observation cell is packed |
| Halo field view | Toggle | On / Off | On | — | Shows or hides the volumetric attraction glow |
| Force-separation graph | Toggle | On / Off | On | — | Shows or hides the live force curve and its well minimum |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling of both benches at once |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Feel the pull | card=Water-like triad; attraction=20; jaw separation dragged 0.30 → 1.20 | At what separation is the probe reading highest, and what happens to the force past 1.0 nm? |
| S2 | Weak sticky | card=Helium-like sphere; attraction=1.0; temperature=−100 | With almost no attraction, what state is the cell in even at −100 °C, and what does the probe read? |
| S3 | Turn up the stickiness | card=Water-like triad; attraction=50; temperature=25; count=300 | Raise the dial and watch the melting and boiling readouts. Which way do they move, and why? |
| S4 | Salt-strong | card=Salt-like charged pair; attraction=60; temperature=800 | Even at 800 °C the badge still reads SOLID. Explain that using the probe reading, not the word ionic. |

**Student activities.**
1. Drag the moving jaw from 0.30 nm out to 1.20 nm in 0.10 nm steps and record the probe force at each step.
2. Plot your force readings against separation, then compare your hand plot with the graph panel and mark where the force is zero.
3. Set the attraction dial to 5, 20 and 50 in turn and record the melting and boiling readouts for each.
4. Release the jaws at 0.9 nm and record what the two particles do, then repeat at 2.0 nm and record the difference.
5. Predict which substance card will boil at the lowest temperature, run all four at 100 °C, and record the state badge for each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Probe force | Live numeric | pN | Force needed to hold the jaws at the current separation, 1 dp, 20 updates per second |
| Force vs separation | Line graph | pN vs nm | Live curve with the well minimum marked and the current jaw position tracked |
| Melting point | Live numeric | °C | Temperature at which the badge last switched between solid and liquid |
| Boiling point | Live numeric | °C | Temperature at which the badge last switched between liquid and gas |
| State badge | Pass-fail badge | — | SOLID, LIQUID or GAS, decided from measured mobility in the cell |
| Escapes per second | Counter | count/s | Particles leaving the bulk surface, which climbs steeply near boiling |
| Run log | Data table | mixed | Card, attraction, mass, r₀, melting point, boiling point; exportable CSV |

**What the student should realise.**
Students picture particles as tiny balls that simply bounce, with nothing holding them together, so a state change looks like a rule rather than a consequence. Feeling the pull on a probe, then watching melting and boiling temperatures move when only the stickiness dial has, makes that untenable. The student should be able to say: *"Whether something is solid, liquid or gas depends on how strongly its particles pull on each other compared with how hard they are jiggling."*

### B4.3 · Reading a heating curve

**Experiment name:** The Heating Curve Rig: Five Segments, One Substance  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Particle system  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A thick-walled glass vessel of crushed ice sits sunk in an aluminium heating block whose cartridge heater shows a constant wattage in green digits. A stirrer paddle turns slowly, a long thermometer probe reaches to the bottom, and a hinged condenser lid catches vapour and drips it back. Below the bench, filling the lower half of the screen, is the temperature-time plot, drawn on a fine grid with the live trace advancing in white. To its right sits a synchronised particle window: whatever moment the plot cursor is on, that is the arrangement shown. A tray of five draggable labels waits under the plot, reading SOLID, MELTING, LIQUID, BOILING and GAS. A gradient tool with two draggable feet lies beside them.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Heating vessel | Instrument | 60 mm bore, 120 mm tall borosilicate with 4 mm wall and a graduated flank, contents visible throughout the run | Yes: swap |
| 2 | Aluminium heating block | Instrument | 90 mm anodised block with a cartridge heater bore, green wattage display, machined seat that grips the vessel base | Yes: place |
| 3 | Cartridge heater | Actor | 8 mm sheathed element delivering exactly the set constant power, faint orange internal glow, thermal contact with the block only | Yes: swap |
| 4 | Thermometer probe | Instrument | 2 mm stainless stem to within 5 mm of the vessel base, digital head reading −30 to 130 °C to 1 dp | Yes: drag |
| 5 | Stirrer paddle and motor | Actor | 25 mm PTFE paddle on a 3 mm shaft, 0–400 rpm, keeps the vessel uniform so no false plateau appears from layering | Yes: swap |
| 6 | Condenser lid | Structure | Hinged glass dome with a cold finger and a drip lip; when fitted, boiled vapour returns and the mass stays constant | Yes: place, swap |
| 7 | Substance mass in vessel | Structure | Crushed solid, clear liquid or visible vapour, redrawn as the phase fraction changes; the melt front is a real visible boundary | Yes: resize |
| 8 | Particle assembly | Particle | 400 instanced particles: fixed lattice with buzz in the solid, sliding neighbours in the liquid, free flight in the gas; drawn as a cutaway of the whole substance, never as a sprinkle inside it | No |
| 9 | Synchronised particle window | UI-Probe | 300×300 px cutaway locked to the plot cursor, so scrubbing the graph rewinds the particles | Yes: drag, resize |
| 10 | Temperature-time plot | Overlay | 1000×280 px chart, °C against s, 5 s minor grid, live white trace, previous runs kept as grey ghosts | No |
| 11 | Region label tiles | Actor | Five 120×34 px tiles reading SOLID, MELTING, LIQUID, BOILING, GAS; dropped on a plot region they snap and score green or red | Yes: drag, place |
| 12 | Crosshair cursor | UI-Probe | Draggable vertical line on the plot with a bubble reading time and temperature at that instant | Yes: drag |
| 13 | Gradient tool | Instrument | Two draggable feet joined by a dashed hypotenuse; reports slope in °C per minute between them | Yes: drag, resize |
| 14 | Melting and boiling markers | Overlay | Horizontal dashed lines auto-drawn at the plateau temperatures once each plateau is complete, with numeric tags | No |
| 15 | Vent and pressure gauge | Instrument | Small brass relief valve and a 0–2 bar dial on the lid, so a sealed run cannot build unsafe pressure | Yes: swap |
| 16 | Data table panel | Overlay | Scrolling table logging time, temperature, phase and fraction melted or boiled every 5 s | No |

**How it works — the model.**
Constant power in, one substance, no shortcuts. Inside a single phase the temperature rises at P/(m·c), so the segment slopes are set by the specific heat capacity of that phase and are deliberately different for solid and liquid. When the temperature reaches the melting point, the incoming joules go into a latent-heat accumulator instead of the thermometer, and the phase fraction advances by P·Δt/(m·L_f); only when the accumulator fills does the temperature move again. The same logic runs at the boiling point with L_v, which is several times larger, so the second plateau is visibly longer. The particle view reads the phase fraction directly, so during a plateau the student can watch order breaking down while the number on the thermometer holds still. Stirring is on by default so a plateau can never be an artefact of a cold layer.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Heater power | Slider | 10–200 | 60 | W | Steepness of every sloping segment and the length of both plateaus |
| Substance | Dropdown | Water / Stearic acid / Paraffin wax / Ethanol / Lauric acid | Water | — | Structural: swaps melting point, boiling point, both heat capacities and both latent heats |
| Mass in vessel | Slider | 20–300 | 100 | g | How long every stage takes, without changing any plateau temperature |
| Starting temperature | Slider | −30–20 | −20 | °C | Where the trace begins, so whether the solid segment is visible |
| Lid | Dropdown | Open / Loose lid / Condenser fitted | Condenser fitted | — | Structural: whether vapour escapes, so whether mass falls during boiling |
| Stirrer speed | Slider | 0–400 | 200 | rpm | Uniformity; at 0 a hot layer forms and the trace goes lumpy |
| Plot cursor | Timeline scrubber | 0–900 | 0 | s | Moves the crosshair and rewinds the particle window with it |
| Region labels | Toggle | On / Off | On | — | Shows or hides the label tray and its scoring |
| Particle window | Toggle | On / Off | On | — | Shows or hides the synchronised cutaway |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Ice to steam | substance=Water; mass=100; power=60; start=−20; lid=Condenser fitted | Label all five regions. What are the two plateau temperatures, and which plateau is longer? |
| S2 | Same substance, more of it | mass=300; power=60; substance=Water | Predict what changes and what does not when you triple the mass, then check both plateau temperatures. |
| S3 | Turn the heater up | power=180; mass=100; substance=Water | The whole run finishes in a third of the time. Did either plateau move up the temperature axis? |
| S4 | A different solid | substance=Stearic acid; start=20; power=60; mass=100 | Where does this curve's first plateau sit, and what does that number tell you about the substance? |

**Student activities.**
1. Run water from −20 °C at 60 W and record the temperature every 15 s until the trace leaves the second plateau.
2. Drag the five region labels onto the plot and record which ones the sim marks green on your first attempt.
3. Place the gradient tool feet on the solid segment and then on the liquid segment, and record both slopes in °C per minute.
4. Drag the plot cursor into the middle of the first plateau and describe, in one sentence, what the particle window is showing while the thermometer is not moving.
5. Triple the mass, re-run, and record the two plateau temperatures and the two plateau durations next to your first run.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Temperature | Live numeric | °C | Probe reading to 1 dp, updated 5 times per second |
| Temperature vs time | Line graph | °C vs s | The heating curve itself, with earlier runs kept as ghost traces |
| Segment slope | Live numeric | °C/min | Gradient tool output between its two feet |
| Plateau temperatures | Live numeric | °C | Auto-detected melting and boiling values, tagged on the plot |
| Plateau durations | Timer | s | How long each plateau lasted at the current power and mass |
| Region labelling score | Pass-fail badge | — | Five-part badge, one segment at a time, green when a label lands on the right region |
| Phase fraction | Live numeric | % | Percentage melted or boiled so far, which is the only thing moving during a plateau |
| Data table | Data table | mixed | Time, temperature, phase, fraction, every 5 s; exportable CSV |

**What the student should realise.**
Students read a heating curve as a picture of something getting hotter and treat the flat parts as the heater switching off or the thermometer sticking. Constant power, a running joule count and a particle window that keeps changing through the plateau make that untenable. Flat does not mean nothing is happening. The student should be able to say: *"The flat parts are where the substance is changing state, and the sloping parts are where it is changing temperature."*

### B4.4 · Why temperature plateaus during a state change

**Experiment name:** Follow the Joule: Speed Up or Pull Apart  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Particle system + Fluid/thermal  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A thick-walled sealed cell of a pale waxy solid sits clamped over a flat heater plate whose joulemeter counts up in amber. A thermometer stem enters the cap, a slow stirrer turns beside it, and a Peltier cooling block waits underneath on a slide so the whole run can be reversed. Filling the right half of the screen is the particle theatre: a cutaway of the substance in which every near neighbour pair is joined by a faint white spring that stretches and snaps. Under it stand two tall meters, a red one labelled MOTION and a blue one labelled SEPARATION, and beside them the speed histogram. Along the bottom, the temperature-time plot has its plateaus shaded blue. The panel docks right, with a large STEP 100 J key.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sealed thick-wall cell | Instrument | 50 mm bore, 100 mm tall borosilicate, 5 mm wall, screw cap with two grommets and a relief valve; contents fully visible | Yes: swap |
| 2 | Constant-power heater plate | Instrument | 70 mm anodised plate with a printed wattage display, in thermal contact with the cell base only | Yes: place |
| 3 | Peltier cooling block | Actor | 60 mm ceramic block on a slide rail, frost forming on its fins when active, removes power at the same rate the heater adds it | Yes: drag, swap |
| 4 | Joulemeter | Instrument | 120×80 mm box with a 5-digit amber total in J, a reset key and a STEP 100 J button that advances exactly 100 J then pauses | Yes: place |
| 5 | Thermometer probe | Instrument | 2 mm stainless stem, digital head reading −60 to 200 °C to 1 dp | Yes: drag |
| 6 | Stirrer paddle | Actor | 22 mm PTFE paddle at 150 rpm, present so a plateau can never be blamed on a cold layer | Yes: swap |
| 7 | Particle theatre cutaway | Overlay | 420×420 px window showing 400 particles of the cell contents at 60×, lattice at the start, disordered by the end | Yes: resize |
| 8 | Neighbour spring glyphs | Overlay | Faint white springs drawn between particles closer than 0.45 nm, thickness ∝ attraction, stretching and snapping visibly during a plateau | No |
| 9 | Motion meter | Instrument | Tall red bar, 0–100, tracking mean kinetic energy per particle with a numeric cap; deliberately flat during a plateau | No |
| 10 | Separation meter | Instrument | Tall blue bar, 0–100, tracking mean potential energy per particle; the only meter that climbs during a plateau | No |
| 11 | Energy packet tracer | Actor | Glowing 8 px sprite released from the plate on each STEP press, flying to a particle and either lengthening its motion streak or stretching a spring | No |
| 12 | Speed histogram | Overlay | 24-bin chart of particle speeds; its mean marker holds still through a plateau, which is the visual proof | No |
| 13 | Neighbour-count probe | Instrument | Invisible counter reporting the average number of neighbours within 0.45 nm per particle | No |
| 14 | Latent heat calculator | Overlay | Panel computing joules absorbed between plateau start and plateau end, divided by mass, printed in J/g | No |
| 15 | Temperature-time plot | Overlay | 1000×240 px chart with plateau regions auto-shaded pale blue and an energy axis mirrored on the right | No |
| 16 | Bench, clamp and relief valve | Environment | Cast base, 12 mm rod with two bosses, brass valve on the cap venting above 1.5 bar | Yes: drag |

**How it works — the model.**
Every joule delivered is routed to one of two accounts and the sim shows which. Inside a phase it goes to kinetic energy, raising particle speeds and therefore the thermometer, at P/(m·c). At a plateau it goes to potential energy, doing work against the attraction between neighbours, so mean separation grows and the neighbour count falls while mean speed does not change at all. That routing is the mechanism, not a caption: the motion meter is computed from actual particle velocities and the separation meter from actual pair distances. STEP 100 J discretises the delivery so a student can watch a single packet arrive and see which meter twitches. Cooling reverses the routing exactly, springs re-form and release energy, and the temperature holds at the same plateau value. The plateau is never scripted as a timer, it ends when the potential account is full.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Heater power | Slider | 10–150 | 50 | W | Joules per second delivered, so how quickly both accounts fill |
| Direction | Radio | Heating / Cooling with Peltier | Heating | — | Structural: swaps the heater plate for the cooling block and reverses every energy flow |
| Attraction strength | Slider | 5–60 | 25 | kJ/mol | How much energy each neighbour pair needs before it separates, so plateau length |
| Substance | Dropdown | Water / Stearic acid / Paraffin wax / Ethanol | Stearic acid | — | Structural: melting and boiling points, both heat capacities and both latent heats |
| Mass in cell | Slider | 20–200 | 80 | g | Total joules needed for each stage, without moving a plateau temperature |
| Energy delivery | Toggle | Continuous / Step 100 J | Continuous | — | Step mode pauses after each packet so the tracer can be followed |
| Energy split view | Toggle | On / Off | On | — | Shows or hides the motion and separation meters |
| Neighbour springs | Toggle | On / Off | On | — | Draws the stretching springs between near neighbours in the theatre |
| Speed histogram | Toggle | On / Off | On | — | Shows or hides the distribution of particle speeds |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Watch the meters cross over | substance=Stearic acid; power=50; delivery=Continuous; split view=On | The thermometer stops at 69 °C. Which meter keeps climbing, and by how much over the plateau? |
| S2 | One joule at a time | delivery=Step 100 J; power=50; springs=On | Press STEP fifteen times inside the plateau. Where does each packet end up, and does the histogram mean marker move? |
| S3 | Stickier substance | attraction=55; substance=Stearic acid; mass=80 | Predict what happens to the length of the plateau when the attraction is more than doubled, then measure it. |
| S4 | Run it backwards | direction=Cooling with Peltier; substance=Water; mass=80; power=50 | Cooling gives a plateau at the same temperature. What are the springs doing this time, and where is the energy going? |

**Student activities.**
1. Run S1 and record the temperature, the motion meter and the separation meter at 30 s intervals through the whole melt.
2. Switch to Step 100 J and record, for ten consecutive presses inside the plateau, which meter changed and by how much.
3. Record the joulemeter reading at the start and end of the melting plateau, divide by the mass, and compare your value with the latent heat panel.
4. Set attraction to 55, re-run, and record the new plateau length beside your first one.
5. Switch direction to cooling, run to the freezing plateau, and record what the springs and the two meters do compared with heating.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Temperature | Live numeric | °C | Probe reading to 1 dp, visibly frozen during a plateau |
| Energy delivered | Live numeric | J | Joulemeter total, still climbing steadily while the temperature is not |
| Motion energy per particle | Live numeric | relative units | Mean kinetic energy, flat through a plateau |
| Separation energy per particle | Live numeric | relative units | Mean potential energy, the only account rising through a plateau |
| Mean neighbour count | Live numeric | count | Neighbours within 0.45 nm per particle, falling as the solid comes apart |
| Latent heat measured | Live numeric | J/g | Plateau joules divided by mass, calculated live from the student's own run |
| Temperature and energy vs time | Line graph | °C and J vs s | Two traces on mirrored axes, so the flat one and the rising one sit together |
| Run log | Data table | mixed | Substance, attraction, mass, power, plateau temperature, plateau joules, latent heat; exportable CSV |

**What the student should realise.**
Students believe a plateau means the heating has stopped, or that the energy is being wasted while the temperature waits. Constant power, a joulemeter that never pauses and two meters that swap roles at the plateau make that untenable: the energy is still arriving, it is just spent pulling particles apart instead of speeding them up. The student should be able to say: *"During melting the joules go into separating the particles, so the temperature has nothing to rise with."*

### B4.5 · Predicting a heating curve for a new substance

**Experiment name:** Draw It Before You Heat It  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Fluid/thermal  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-4

**Theme & scene.**
A prediction station. On the left, a wooden drawer holds eight stoppered sample vials, each with a printed spec card slotted behind it giving melting point, boiling point, both heat capacities and both latent heats. A card reader slot sits beside the drawer, brass-rimmed, and a card pushed into it lights up. In the centre, filling most of the screen, is a blank plotting grid, temperature against time, with five draggable nodes strung along a dashed line waiting to be shaped into a prediction. The heating rig itself, vessel, cartridge block, thermometer, stirrer and condenser lid, sits small and ready at the top right beside a particle thumbnail. The RUN key stays greyed until a prediction is submitted.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample drawer and vials | Structure | Pine drawer with eight 18×50 mm vials: gallium beads, cocoa butter, paraffin wax, lauric acid, ethanol, olive oil, table salt, an unlabelled mystery vial | Yes: drag, swap |
| 2 | Spec card | Structure | 90×55 mm printed card per substance listing melting point, boiling point, c_solid, c_liquid, latent heat of fusion and of vaporisation | Yes: drag, place |
| 3 | Card reader slot | Instrument | Brass-rimmed slot that lights amber when a card seats; an empty reader keeps the prediction grid locked | Yes: place |
| 4 | Prediction grid | Overlay | 900×420 px chart, 0–200 s by −40 to 400 °C, 10 °C minor grid, axes relabelled automatically to suit the loaded card | No |
| 5 | Prediction nodes | Actor | Five 14 px draggable handles joined by a dashed amber polyline; a node can be locked flat to make a deliberate plateau | Yes: drag |
| 6 | Predicted curve | Overlay | Amber polyline through the nodes, redrawn live as they are dragged, with segment slopes labelled in °C per minute | No |
| 7 | Heating vessel and cartridge block | Instrument | 50 mm bore glass vessel seated in a 90 mm anodised block with a constant-wattage cartridge heater, shown at quarter scale | Yes: swap |
| 8 | Thermometer probe | Instrument | 2 mm stainless stem, digital head, range auto-set from the card, 1 dp | Yes: drag |
| 9 | Stirrer and condenser lid | Structure | 22 mm PTFE paddle at 150 rpm plus a hinged glass dome with a drip lip, so mass stays constant through boiling | Yes: place, swap |
| 10 | Actual curve trace | Overlay | White line drawn live over the student's amber prediction on the same axes | No |
| 11 | Error ribbon | Overlay | Shaded band between predicted and actual, amber where the student ran hot and blue where they ran cold, with the worst gap tagged | No |
| 12 | Fit score badge | Instrument | Circular badge scoring three things separately: plateau temperatures, plateau lengths and segment slopes, each green, amber or red | No |
| 13 | Particle thumbnail | UI-Probe | 180×180 px cutaway synced to the live trace, so the student can check a plateau really is a state change | Yes: drag |
| 14 | Attraction design dial | Instrument | Brass dial on a small pedestal for the design-your-own substance, feeding a computed melting and boiling point onto a blank card | Yes: drag |
| 15 | Mystery sample analyser | Instrument | Grey box that accepts the unlabelled vial and returns only a measured curve, with a four-way identification chooser beneath it | Yes: place |
| 16 | Run log board | Overlay | Corkboard panel pinning each attempt as a small card: substance, prediction, actual, score | No |

**How it works — the model.**
The rig is the same constant-power thermal engine as the heating curve laboratory, but the numbers now come from the loaded spec card rather than a menu, and the card is shown to the student before the run. Segment slope is P/(m·c) for the phase in question and plateau length is m·L/P, so both are fully determined by figures the student is holding, which is what makes prediction fair rather than guesswork. The predicted polyline is scored against the actual trace on three separate criteria so a student who gets the plateau temperatures right but the lengths wrong is told exactly that. In design-your-own mode the attraction dial feeds an empirical mapping from well depth to melting and boiling point, tying this back to the forces bench. The mystery vial withholds the card entirely and returns only a curve.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Substance card | Dropdown | Gallium / Cocoa butter / Paraffin wax / Lauric acid / Ethanol / Olive oil / Table salt / Mystery vial | Cocoa butter | — | Structural: loads new melting and boiling points, heat capacities, latent heats and axis ranges |
| Heater power | Slider | 10–200 | 60 | W | Every segment slope and both plateau lengths |
| Mass in vessel | Slider | 20–300 | 100 | g | Plateau lengths and slopes, with no effect on plateau temperatures |
| Starting temperature | Slider | −40–100 | 20 | °C | Where the trace begins, so which phases the run passes through |
| Prediction nodes | Drag-handle | 5 nodes, 0–200 s by −40–400 °C | Flat line at start temperature | s and °C | Shapes the amber predicted curve the run will be scored against |
| Design your own | Dial | 5–60 | 25 | kJ/mol | Attraction strength for a blank card; the sim computes and prints its melting and boiling points |
| Show actual curve | Toggle | Locked / Unlock | Locked | — | Only unlocks after a prediction is submitted, so the answer cannot be traced |
| Mystery mode | Toggle | On / Off | Off | — | Hides the spec card and asks the student to identify the substance from its curve |
| Playback speed | Dial | 0.25×–8× | 1× | — | Time scaling of the heating run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A substance that melts in your hand | card=Cocoa butter; mass=100; power=60; start=20 | Its melting point is 34 °C. Draw the curve, then run it. Did your plateau land in the right place? |
| S2 | Two plateaus far apart | card=Table salt; mass=100; power=200; start=20 | Melting at 801 °C and boiling at 1465 °C. Which plateau is longer, and could you have predicted that from the card alone? |
| S3 | Design a substance | design your own=45; mass=100; power=60 | Set the attraction dial to 45 and read off the melting and boiling points the sim computes. Predict and verify that curve. |
| S4 | Name the mystery vial | mystery mode=On; card=Mystery vial; power=60; mass=100 | You get a curve and no card. Which of the eight substances is it, and which two features of the curve decided it? |

**Student activities.**
1. Slot the cocoa butter card into the reader and copy its melting point, boiling point and both latent heats into your notes.
2. Drag the five prediction nodes to draw your expected curve, then record the plateau temperature and plateau length you have drawn before submitting.
3. Submit, run the rig, and record the actual plateau temperature and length beside your predicted values, plus the fit score for all three criteria.
4. Set the design dial to 45 kJ/mol, record the melting and boiling points the sim computes, and predict then verify that substance's curve.
5. Run the mystery vial, measure both plateau temperatures with the crosshair, and record which substance you identify and on what evidence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Predicted curve | Line graph | °C vs s | The student's amber polyline, with each segment's slope labelled |
| Actual curve | Line graph | °C vs s | The rig's measured white trace, released only after submission |
| Error ribbon | Heat map | °C | Shaded difference between the two curves, with the largest gap tagged and timed |
| Fit score | Pass-fail badge | — | Three separate verdicts: plateau temperatures, plateau lengths, segment slopes |
| Measured plateau values | Live numeric | °C and s | Auto-detected from the actual trace and compared with the card |
| Computed melting and boiling points | Live numeric | °C | Derived from the attraction dial in design-your-own mode |
| Identification result | Pass-fail badge | — | Correct or incorrect naming of the mystery vial, with the deciding features listed |
| Attempt log | Data table | mixed | Substance, power, mass, predicted and actual plateau values, score; exportable CSV |

**What the student should realise.**
Students treat a heating curve as a shape to memorise for water, and are lost when the numbers are unfamiliar. A spec card and a blank grid make that untenable: the plateau temperatures come straight off the card, the plateau lengths come from mass and latent heat, and the slopes come from power and heat capacity. The student should be able to say: *"I can build the whole curve from the substance's numbers, because every part of it means something."*

## B5 · Synthetic materials from natural resources · MS-PS1-3

### B5.1 · Petroleum and plastics

**Experiment name:** The Column and the Chain  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-3

**Theme & scene.**
Dawn over a refinery. A steel fractionating column forty trays tall fills the left of the frame, its shell cut away so each tray reads as a shallow bubbling pool. Colour runs top to bottom from cool slate at the cap to furnace orange at the base, and a temperature ribbon prints the reading every fifth tray. Crude oil arrives treacly from the feed heater, flashes to vapour with a shudder, and climbs. A rack of labelled glass receivers waits below the draw-off spouts. The right third is a clean white reactor room: a stirred vessel where a monomer chain grows bead by bead across a molecular viewport, and a small injection moulder stamping a test coupon. Controls dock right; an atom inventory strip runs along the bottom edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Column shell | Structure | Riveted steel cylinder 3 u diameter, 24 u tall, front quarter cut away; lagging shown as pale grey wrap; interior lit by the fluid temperature ramp | Yes: resize |
| 2 | Bubble-cap tray | Structure | Perforated disc with 40 slotted caps, instanced 8–40 up the column at 0.55 u spacing; liquid pool 0.1 u deep on each, bubbling at 3 Hz | Yes: place |
| 3 | Tray thermocouple | Instrument | 0.2 u bead on a stalk piercing the shell at every tray; face prints the tray temperature to 1 °C; feeds the gradient plot | No |
| 4 | Feed heater and flash zone | Actor | Coiled pipe still glowing dull red inside a firebox; crude enters liquid and leaves as a visible vapour plume with a spray of unvaporised residue | No |
| 5 | Hydrocarbon molecule library | Particle | Alkanes C1 to C40: charcoal carbon spheres r=0.70 u, white hydrogen spheres r=0.32 u, single-bond cylinders 0.15 u thick at 109°; chain drawn zig-zag; ~4000 instanced per run | No |
| 6 | Vapour and condensate phase tag | Particle | Same molecule mesh, two shaders: vapour is translucent with a fast jitter, condensate is glossy and settles into the tray pool with a droplet trail | No |
| 7 | Draw-off spout and valve | Instrument | Elbow pipe with a quarter-turn handle that clamps onto any tray lip; up to 6 may exist; snaps to tray height with a click | Yes: place, drag |
| 8 | Receiver flask rack | Instrument | Six 500 mL conical flasks on a bench, each with a blank paper label the student types into; liquid level and colour update live | Yes: swap |
| 9 | Head condenser and reflux line | Structure | Water-jacketed coil at the cap plus a return pipe dropping liquid back onto the top tray; flow width scales with the reflux ratio | No |
| 10 | Catalytic cracker | Actor | Squat reactor bottle packed with pale beige zeolite pellets r=0.15 u; long chains entering are visibly snipped mid-chain with a flash | Yes: swap |
| 11 | Ethene monomer | Particle | Two carbons at 1.33 Å scaled, four hydrogens, double bond drawn as twin parallel cylinders in bright cyan; 600 floating in the reactor | No |
| 12 | Initiator radical | Particle | Small magenta sphere with a single unpaired-electron dot; one per chain; docks to the first monomer and stays at the chain end | No |
| 13 | Growing polymer chain | Actor | Backbone that extends one monomer per tick along a serpentine path in the viewport; opened double bonds recolour from cyan to grey as they become links | No |
| 14 | Polymerisation reactor vessel | Instrument | Jacketed 2 L vessel with an anchor stirrer at 1 Hz, pressure gauge 0–20 bar, thermometer port, sight glass showing the melt thickening | Yes: swap |
| 15 | Injection moulder and tensile jig | Instrument | Ram press stamping a dogbone coupon, then a two-grip puller with a load cell that stretches it until it necks and snaps | Yes: place |
| 16 | Atom inventory panel | Overlay | Bottom strip counting C and H atoms in feed, in every receiver, in the cracker and in the polymer; totals must match or the strip turns amber | No |

**How it works — the model.**
Each molecule carries a carbon number, with a boiling point from real alkane data (C4 near 0 °C, C8 near 126 °C, C16 near 287 °C). The column holds a linear gradient from the flash zone to the cap. Every tick a vapour packet rises one tray and is tested: if the tray temperature is below its boiling point it condenses into that tray's pool, otherwise it keeps climbing. Reflux returns condensate downward, so light molecules that condensed too low get a second chance to rise, and purity improves with reflux and tray count. Nothing is created here. Cracking breaks one long chain into a shorter alkane plus an alkene, conserving every atom, and the inventory strip proves it. Polymerisation opens each monomer's double bond and uses the freed bond to link the next unit, so chain length equals the number of addition events. Tensile strength and melting point rise with chain length along a saturating curve.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Feed heater temperature | Slider | 150–420 | 360 | °C | How much of the crude flashes to vapour and how hot the base tray runs |
| Crude blend | Dropdown | Light sweet / Heavy sour / Kern County heavy / Field condensate | Light sweet | — | The carbon-number histogram of the feed, and the residue left at the base |
| Trays in column | Stepper | 8–40 | 32 | count | Number of separation stages; rebuilds the column geometry |
| Draw-off spouts | Drag-handle | Place 1–6 spouts at any tray | 4 spouts at trays 6, 14, 24, 30 | tray number | Which height each fraction is tapped from |
| Reflux ratio | Slider | 0–5 | 2.0 | — | How much condensate returns down the column; sharpens or blurs the cut |
| Cracker temperature | Slider | 400–700 | 520 | °C | Whether long chains break, and how small the pieces are |
| Cracker catalyst | Dropdown | None / Zeolite / Alumina | Zeolite | — | Breaking rate and where along the chain the break happens |
| Monomer | Dropdown | Ethene / Propene / Chloroethene | Ethene | — | Which polymer is built and its side-group in the viewport |
| Reactor residence time | Slider | 5–600 | 120 | s | Number of addition steps, therefore chain length |
| Atom inventory overlay | Toggle | On / Off | On | — | Shows the live C and H tally across every vessel |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Straight run | feed heater temperature=360; crude blend=Light sweet; trays in column=32; draw-off spouts at trays 6, 14, 24, 30; reflux ratio=2.0 | Read the carbon number in each receiver. What do the molecules taken from the highest spout have in common, and what does that share with their boiling point? |
| S2 | Cold column | feed heater temperature=220; crude blend=Heavy sour; reflux ratio=2.0 | Only the lowest two receivers fill. The crude definitely contains petrol molecules, so where did they go? |
| S3 | Cracking for petrol | crude blend=Kern County heavy; cracker temperature=560; cracker catalyst=Zeolite | Feed the diesel fraction to the cracker. Record carbon numbers in and out, then check the atom inventory. Was anything added or lost? |
| S4 | Two plastics, one monomer | monomer=Ethene; reactor residence time=15 then 480 | Build a short chain and a long chain from identical monomer. Record melting point and tensile strength for each. Which product would you make a crate from, and which a food wrap? |

**Student activities.**
1. Set the heater to 360 °C and drag four draw-off spouts to trays 6, 14, 24 and 30. Run, then record the mean carbon number and the tray temperature for each receiver.
2. Drop the tray count from 32 to 10 without moving the spouts. Re-run and record how the purity percentage of the petrol receiver changes.
3. Predict what a reflux ratio of 0 will do to the purity of every cut, then set it and record all four purities to test your prediction.
4. Send the kerosene fraction through the cracker at 560 °C. Record the carbon numbers before and after, and copy the atom inventory totals into your table.
5. Run the reactor for 15 s, mould a coupon and pull it to failure. Repeat at 480 s. Record chain length, melting point and tensile strength for both.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Tray temperature profile | Line graph | °C vs tray number | Live gradient up the column, with each active spout marked |
| Fraction yield | Bar chart | % by mass | One bar per receiver, updating as liquid collects |
| Cut purity | Live numeric | % in band | Share of collected molecules whose carbon number falls inside the named fraction's range |
| Carbon-number histogram | Bar chart | count vs C number | Feed and each receiver overlaid, showing separation as a splitting of one hump into several |
| Polymer chain length | Live numeric | monomer units | Counts addition events on the tracked chain |
| Melting point and tensile strength | Data table | °C and MPa | One row per moulded coupon, tied to its chain length |
| Atom inventory | Pass-fail badge | count of C and H | Green while total atoms in equals total atoms out across every vessel |

**What the student should realise.**
Students believe crude oil is turned into plastic by adding a plastic-making ingredient. The column adds nothing at all, it only sorts by boiling point, and the reactor only relinks atoms that were already in the feed. Chain length, not a secret additive, is what makes one product a wrap and another a crate. The student should be able to say: *"Refining separates the molecules that are already there, and making a plastic just joins them into longer chains."*

### B5.2 · Ores and alloys

**Experiment name:** Rock to Blade: Smelter and Alloy Furnace  
**Render mode:** 3D Scene  
**Simulation engine:** Fluid/thermal + Data-driven model  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-3

**Theme & scene.**
A foundry at night, lit almost entirely by its own heat. Left of frame stands a blast furnace cut open down its face, a tapering brick tower whose burden of rust-red ore, black coke and chalk-white limestone descends slowly through bands of deepening orange. Air jets stab in near the base and the hearth pool glows white-yellow with a crust of dark slag floating on it. Right of frame, a cooler bench: an induction crucible, a rack of small alloying ingots on an analytical balance, an ingot mould and three test machines under work lamps. A microscope panel floats above the bench showing the metal's atomic lattice. The control panel docks right; an atom inventory strip runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Blast furnace stack | Structure | Refractory-lined tower 18 u tall, front quarter removed; interior temperature bands render as a vertical colour ramp from 200 °C at the throat to 1600 °C at the tuyères | Yes: resize |
| 2 | Charge hopper and skip | Actor | Tilting bucket that drops a layered charge every 20 s; layer thicknesses redraw when the coke-to-ore ratio changes | Yes: drag |
| 3 | Haematite ore lump | Structure | Irregular 0.6 u rock, rust-red with a grey gangue speckle; exploded view shows Fe atoms orange-brown r=1.26 u and O atoms red r=0.60 u in a 2 : 3 ratio | Yes: swap |
| 4 | Coke lump | Structure | Porous 0.5 u black lump, dull matte, glowing at the surface below the tuyère line; carbon atoms charcoal r=0.70 u | Yes: swap |
| 5 | Limestone lump | Structure | Chalky white 0.4 u block; decomposes with a puff at 900 °C into a pale oxide plus a CO₂ molecule | Yes: swap |
| 6 | Tuyère and hot blast jet | Actor | Four water-cooled nozzles ringing the hearth, each with a cone-shaped jet whose length scales with blast rate and whose colour scales with blast temperature | Yes: drag |
| 7 | Reducing gas molecules | Particle | CO as a charcoal carbon plus red oxygen with a triple-bond cylinder; CO₂ as a red-charcoal-red linear triad; ~900 rising through the burden, recoloured as they take oxygen from the ore | No |
| 8 | Molten iron droplet and hearth pool | Particle | 0.15 u white-hot beads that trickle down the burden and merge into a mirror-bright pool with a convecting surface pattern | No |
| 9 | Slag layer and slag notch | Structure | Dark green-grey glassy raft floating 0.4 u thick on the pool, with a side notch that can be opened to run it off | Yes: place |
| 10 | Taphole and ladle | Actor | Clay-plugged hole at hearth level plus a refractory ladle on a bogie; opening it pours a numbered sample into the alloy bench | Yes: drag |
| 11 | Hearth pyrometer | Instrument | Optical head on a tripod aimed at the pool; prints temperature to 5 °C and logs it | Yes: place |
| 12 | Induction crucible and ingot rack | Instrument | 2 kg clay-graphite crucible in a copper coil that hums and glows; rack holds labelled C, Cr, Ni, Cu, Sn and Mn ingots, each with its mass printed | Yes: place, drag |
| 13 | Balance, mould and test bar | Instrument | Top-pan balance reading to 0.01 g, a strip mould, and the cast bar 100 × 10 × 5 mm that all three testers accept | Yes: swap |
| 14 | Hardness tester | Instrument | Bench press with a diamond pyramid indenter; leaves a visible square dent whose diagonal is measured on screen and converted to HV | Yes: place |
| 15 | Salt-spray chamber and bend jig | Instrument | Sealed glass cabinet with a fine salt mist and a heater at 35 °C, plus a three-point bend rig that flexes the bar until it yields or snaps | Yes: place |
| 16 | Lattice microscope inset | Overlay | Floating panel showing a body-centred iron lattice, spheres r=1.26 u; foreign atoms drawn at their true relative radii (C tiny, Cr and Ni near-equal, Sn oversized) with a slip-plane arrow that stalls where a foreign atom sits | Yes: swap |

**How it works — the model.**
Two linked stages. Reduction runs the real chain: coke burns to CO₂ at the tuyères, CO₂ meets hot coke to make CO, and CO strips oxygen from the ore as Fe₂O₃ + 3CO gives 2Fe + 3CO₂. Yield depends on hearth temperature above about 1200 °C, on the coke-to-ore ratio and on blast rate; too little carbon leaves unreduced ore in the slag, too much wastes coke and cools nothing. Every oxygen atom removed from the ore appears in an exhaust molecule, and the inventory strip tracks it. Alloying is a composition vector fed to a lookup of real data: hardness, elongation and corrosion rate come from measured values for mild steel, high-carbon steel, quenched and tempered steel, bronze and 18/8 stainless. Cooling rate sets grain structure and therefore hardness. The lattice inset explains why, by stalling a slip plane against a substituted atom.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Ore type | Dropdown | Haematite 65% Fe / Magnetite 60% Fe / Low-grade taconite 30% Fe | Haematite 65% Fe | — | The lumps loaded into the hopper, the gangue load and the slag volume |
| Coke to ore ratio | Slider | 0.10–1.20 | 0.55 | kg/kg | Carbon available to reduce the ore and to burn for heat |
| Hot blast temperature | Slider | 600–1300 | 1100 | °C | Hearth temperature and therefore reduction rate |
| Blast rate | Slider | 0–120 | 70 | m³/min | Oxygen supplied, coke burn rate and how fast the burden descends |
| Limestone flux | Slider | 0–30 | 12 | kg per 100 kg ore | Slag fluidity and how much gangue is carried off the iron |
| Alloy recipe | Drag-handle | Drag C, Cr, Ni, Cu, Sn, Mn ingots onto the balance, each 0–25 | C 0.20 | % by mass | Which foreign atoms enter the lattice; rebuilds the microscope inset |
| Melt temperature | Slider | 1100–1700 | 1550 | °C | Whether the additions fully dissolve or sit as undissolved lumps |
| Cooling method | Dropdown | Air cool / Oil quench / Water quench | Air cool | — | Grain structure, and therefore hardness and brittleness |
| Tempering temperature | Slider | 0–650 | 0 | °C | Trades some hardness back for bend-before-break |
| Salt-spray duration | Slider | 0–1000 | 240 | h | Corrosion exposure applied to the finished bar |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A working smelt | ore type=Haematite 65% Fe; coke to ore ratio=0.55; hot blast temperature=1100; blast rate=70; limestone flux=12 | Every ore lump arrived with oxygen attached and the iron leaves without it. Read the atom inventory and say exactly where that oxygen went. |
| S2 | Starved furnace | coke to ore ratio=0.15; hot blast temperature=1100; limestone flux=12 | The tap runs thin and the slag is stained red. What is still in the slag, and which reactant ran out? |
| S3 | Mild versus hard | alloy recipe C=0.20 with cooling method=Air cool, then alloy recipe C=0.90 with cooling method=Water quench | Record hardness and elongation for both bars. What did the extra carbon buy, and what did it cost? |
| S4 | Salt fog on the Bay | alloy recipe C=0.20 alone, then alloy recipe Cr=18 and Ni=8; salt-spray duration=1000 | Two bars, the same fog, 1000 hours. Which survives a San Francisco Bay bridge fitting, and what are the chromium atoms doing at the surface? |

**Student activities.**
1. Set the coke-to-ore ratio to 0.55 and run one full smelt. Record iron yield, hearth temperature and the CO to CO₂ ratio in the exhaust.
2. Step the coke-to-ore ratio through 0.15, 0.35, 0.55, 0.80 and 1.20. Record iron yield at each and plot yield against ratio; mark the point where more coke stops helping.
3. Drag a 0.90% carbon ingot onto the balance, water quench the cast bar, and measure hardness with the indenter and elongation on the bend jig. Repeat with 0.20% carbon.
4. Temper your hardest bar at 400 °C, re-test both properties, and record what tempering gave back and what it took away.
5. Build a bar with 18% chromium and 8% nickel, run 1000 h of salt spray, and record mass loss against the plain steel bar. Zoom the lattice inset to 500× and describe what the chromium atoms have done to the surface.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Iron yield | Live numeric | % of iron in charge | Mass of iron tapped divided by iron present in the ore |
| Tap composition | Data table | % by mass | Every element in the tapped metal, refreshed at each tap |
| Hearth temperature | Line graph | °C vs time | Pyrometer trace with the 1200 °C reduction threshold marked |
| Exhaust gas mix | Bar chart | % CO and % CO₂ | Shows whether carbon is being used to reduce or merely burned |
| Hardness | Live numeric | HV | Converted from the measured indent diagonal, 1 dp |
| Elongation at break | Live numeric | % | From the bend jig, measured on the same bar as the hardness test |
| Corrosion mass loss | Live numeric and heat map | mg per cm² per year | Number plus a pit map painted on the bar surface |
| Cost of the alloy | Live numeric | US$ per kg | Sum of ingredient costs at real 2025 metal prices |
| Atom inventory | Pass-fail badge | count of Fe, O, C, Ca | Green while atoms in the charge equal atoms in metal, slag and exhaust |

**What the student should realise.**
Students believe metal is dug up ready-made, and that an alloy is a stronger metal poured into the mould. Neither survives: the ore contains no metal until carbon takes its oxygen away, and the alloy is a mixture whose foreign atoms jam the sliding layers. Every gain has a price: the hardest bar snaps first and the rust-proof bar costs five times more. The student should be able to say: *"Smelting removes oxygen, and alloying blocks the layers from sliding."*

### B5.3 · Medicines and synthetic fibers

**Experiment name:** Willow to Tablet, Melt to Thread  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Molecular + State machine  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-3

**Theme & scene.**
A split bench under bright, even lab light, with a translucent VIRTUAL LAB screen across the front so the student can see that nothing here is real. On the left, a white-tiled fume hood: a round-bottom flask of pale willow bark chips simmering under a water-cooled reflux condenser, then a hotplate stirrer where a clear solution is warmed, then an ice bath in which needle crystals visibly grow and knit. Filtration glassware, a melting-point block and a thin-layer plate stand ready beside the balance. On the right, a warm metal-grey fibre rig: a hopper of chips feeding a heated melt pot, a gear pump, a bright spinneret disc, and a filament running down a quench column onto spinning godets. Controls dock right; a molecular viewport floats above the active bench.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Fume hood and virtual-lab screen | Environment | Tiled hood with a sliding sash, extract flow shown by drifting motes; a translucent amber screen with the word VIRTUAL repeated faintly across the glass | No |
| 2 | Willow bark chips and extraction flask | Structure | 250 mL round-bottom flask half-filled with 2–5 mm curled bark strips, buff brown with a grey outer skin; chips darken and soften as extraction runs | Yes: swap |
| 3 | Reflux condenser | Instrument | Vertical Liebig coil with visible cooling water and a running condensate ring; vapour rises and returns without loss | Yes: place |
| 4 | Salicin molecule | Particle | Two-ring structure, sugar ring plus phenol ring; charcoal carbon r=0.70 u, red oxygen r=0.60 u, white hydrogen r=0.32 u; leaves the bark and drifts into solution | No |
| 5 | Salicylic acid molecule | Particle | Flat benzene hexagon with an –OH group and a –COOH group highlighted in a pale halo; melting point 159 °C carried as a property | No |
| 6 | Acetylating reagent dispenser | Instrument | Sealed glass ampoule in a keyed dispenser that measures a fixed dose; drawn with a clearly virtual hazard placard and gloves resting beside it | Yes: place |
| 7 | Aspirin molecule and by-product | Particle | Same hexagon with the –OH replaced by an ester group drawn in a bright teal; a small ethanoic acid molecule is released alongside every conversion | No |
| 8 | Hotplate stirrer with flea and thermometer | Instrument | Ceramic-top plate with a temperature dial, a spinning PTFE flea making a vortex, and a probe thermometer reading to 0.5 °C | Yes: drag |
| 9 | Ice-bath crystalliser and filtration set | Instrument | Beaker of crushed ice holding the flask; needle crystals nucleate and grow at a rate set by cooling; Büchner funnel, filter paper and side-arm flask below | Yes: place |
| 10 | Melting-point apparatus and TLC plate | Instrument | Heated block with a magnifier and a capillary tube; beside it a silica plate in a solvent tank where spots rise and separate | Yes: place |
| 11 | Balance, spatula and weighing boat | Instrument | Four-place balance reading to 0.001 g with a draught shield; weighings auto-log to the yield calculator | Yes: drag |
| 12 | Polymer chip hopper and melt pot | Structure | Clear hopper of 3 mm lens-shaped chips feeding a screw into a banded heater block; the melt is seen through a sight glass thickening or thinning with temperature | Yes: swap |
| 13 | Gear pump and spinneret disc | Actor | Two meshing gears metering the melt, then a 40 mm steel disc with 12 capillary holes; disc swaps when hole diameter changes, holes visibly larger or smaller | Yes: swap |
| 14 | Quench column, godets and winder | Actor | 2 m chimney of cross-flow air, two heated godet rollers turning at different speeds, and a bobbin winding the filament; the filament visibly thins between godets | Yes: drag |
| 15 | Fibre microscope inset and tensile jig | Overlay | Panel showing polymer chains as tangled noodles before drawing and combed parallel after; a two-grip jig pulls a 20 cm filament to break | Yes: place |
| 16 | Atom inventory panel | Overlay | Live C, H and O counts across flask, filtrate, crystals and waste; the acetyl group is highlighted as it moves from reagent to product | No |

**How it works — the model.**
Three stages run as a state machine over molecular objects. Extraction dissolves salicin out of the bark at a rate rising with temperature and stirring, saturating once the bark is spent, so beyond about 30 minutes more time adds nothing. Conversion then hydrolyses and oxidises salicin to salicylic acid. Esterification transfers an acetyl group from the reagent to the phenol –OH, releasing ethanoic acid; the atom inventory shows the group moving rather than appearing. Rate rises with temperature, but above roughly 90 °C a side reaction begins and impurity fraction climbs, which the melting-point block reports as a wide, low melting range and the plate reports as a second spot. On the fibre side, extruded filament diameter follows d ∝ √(throughput ÷ take-up speed), so hole size alone does not set thickness. Drawing aligns chains, raising tensile strength and cutting elongation, until the draw ratio exceeds the polymer's limit and filaments break.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Bark mass | Slider | 0–50 | 25 | g | How much salicin is available, and therefore the theoretical yield |
| Extraction temperature | Slider | 40–100 | 80 | °C | Rate at which salicin leaves the bark |
| Extraction time | Slider | 5–60 | 30 | min | How far extraction runs toward its ceiling |
| Esterification temperature | Slider | 40–100 | 60 | °C | Conversion rate and the amount of side product formed |
| Crystallisation route | Dropdown | Slow bench cool / Ice bath / Flash chill | Ice bath | — | Crystal size, recovered mass and trapped impurity |
| Fibre polymer | Dropdown | Polyester PET / Nylon-6,6 / Polypropylene | Polyester PET | — | Chips in the hopper, melt behaviour and every fibre property |
| Melt temperature | Slider | 230–300 | 285 | °C | Melt viscosity, and whether the filament runs smooth or breaks |
| Spinneret hole diameter | Slider | 0.15–0.60 | 0.25 | mm | Swaps the disc; sets the jet size leaving the plate |
| Pump throughput | Slider | 2–30 | 12 | g/min | Mass fed per minute, one half of the diameter equation |
| Godet draw ratio | Slider | 1.0–5.0 | 3.2 | × | How far the filament is stretched, aligning the chains |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Bark to tablet | bark mass=25; extraction temperature=80; extraction time=30; esterification temperature=60; crystallisation route=Ice bath | How many grams of aspirin come from 25 g of bark, and what percentage of the theoretical yield is that? |
| S2 | Cooked too hot | esterification temperature=100; crystallisation route=Flash chill | The melting range widens from 1 °C to 12 °C and a second spot appears on the plate. What is in the flask besides aspirin? |
| S3 | Fine thread, coarse thread | spinneret hole diameter=0.15 with pump throughput=4, then hole diameter=0.60 with pump throughput=24; godet draw ratio=3.2 | Measure filament diameter both times. Which control actually set the thickness, and what evidence says so? |
| S4 | Drawn too far | godet draw ratio=1.2, then 3.2, then 4.8; fibre polymer=Polyester PET | Record tensile strength and elongation at each ratio. At which ratio do filaments start snapping, and what has happened to the chains? |

**Student activities.**
1. Weigh 25 g of bark, run the extraction at 80 °C for 30 min, and record the mass of salicylic acid recovered before the acetylation step.
2. Esterify at 60 °C, crystallise in the ice bath, filter and dry. Record the aspirin mass, then calculate and record percentage yield against the theoretical value shown.
3. Repeat the esterification at 100 °C. Record the melting range and the number of TLC spots for both products and state which is purer.
4. Swap the spinneret to 0.60 mm holes and set throughput to 24 g/min. Measure the filament diameter, then halve the throughput and measure again. Record both.
5. Set the draw ratio to 1.2, 3.2 and 4.8 in turn. For each, pull a filament to break and record tensile strength, elongation and the breaks-per-minute counter.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Product mass | Live numeric | g | Dry crystal mass on the balance after filtration, 3 dp |
| Percentage yield | Live numeric | % | Actual divided by theoretical from the limiting reagent |
| Melting range | Live numeric | °C | Onset and completion temperature; a wide range signals impurity |
| TLC plate | Data table | Rf values | Spot count and Rf for product and reference, imaged after each run |
| Filament diameter | Live numeric | µm | Laser gauge below the second godet, sampled at 10 Hz |
| Linear density | Live numeric | dtex | Grams per 10 000 m, computed from throughput and take-up speed |
| Tensile strength and elongation | Line graph | MPa vs % | Stress-strain curve per filament, overlaid across draw ratios |
| Filament breaks | Counter | breaks/min | Counts spinning failures, which rise sharply past the draw limit |
| Atom inventory | Pass-fail badge | count of C, H, O | Green while every atom is accounted for across product and waste |

**What the student should realise.**
Students believe a medicine is found in a plant and a fibre is a thread that exists ready-made. Both benches show a deliberate rebuild: the willow supplies a starting skeleton that is chemically altered on purpose, and a fibre's strength is created by stretching, not discovered. Process conditions decide purity and strength. The student should be able to say: *"Natural material is the starting point, and what the process does to the molecules decides what the product is worth."*

### B5.4 · Benefit and cost of a synthetic material

**Experiment name:** Cradle to Grave: The Life-Cycle Bench  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-3

**Theme & scene.**
A long side-scrolling conveyor runs the width of the screen through five lit dioramas, like a cutaway model railway. Station one is the raw source, which changes with the material: an oil well, a bauxite pit, a sand quarry, a maize field, a forest plot. Station two is a process plant whose stack plume thickens and darkens in proportion to the energy used. Station three is a kitchen where the product is used and re-used under a wear counter. Station four is a kerbside bin bank with a deposit machine beside it. Station five holds three doors: a recycler, an incinerator with a turbine, and a landfill cell with a decades clock. One bottle rides the belt. Meters and a radar chart line the right edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Life-cycle conveyor | Environment | Belt 2400 px long scrolling through five backlit dioramas; the product mesh rides it and pauses at each station for its stage animation | No |
| 2 | Product under test | Actor | One-litre bottle, 240 mm tall; mesh and shader swap per material with correct wall thickness and mass (PET 35 g, glass 400 g, aluminium 26 g, PLA 40 g, carton 28 g) | Yes: swap |
| 3 | Feedstock diorama | Structure | Five interchangeable set pieces: nodding oil pump, red bauxite terrace, pale sand pit, green maize rows, conifer plot; each with a depletion gauge | Yes: swap |
| 4 | Process plant and stack | Actor | Compact refinery block with a stack whose plume opacity and width scale linearly with MJ per kilogram; furnace glow brightens with energy | No |
| 5 | Transport leg | Actor | Articulated lorry plus an optional container ship; travel time and fuel burn scale with distance and with the product's mass | Yes: swap |
| 6 | Use-phase house | Structure | Kitchen counter with a fill-and-empty animation; a tally chalked on the wall counts deliveries, and the bottle visibly scuffs as reuse rises | No |
| 7 | Wear and failure model | Field | Invisible per-material fatigue counter; when it crosses the failure threshold the bottle cracks on screen and the run must fetch a replacement | No |
| 8 | Kerbside bin bank and deposit machine | Instrument | Three wheeled bins plus a reverse-vending machine that pays a 5 or 10 cent deposit; the machine's throughput sets what fraction is captured | Yes: place |
| 9 | Optical sorter and bale press | Actor | Belt with an infrared eye and air jets that kick bottles into streams, then a press making a 200 kg bale; misidentified items pass to residue | No |
| 10 | Incinerator and turbine | Actor | Furnace with a grate and a steam turbine spinning behind glass; a recovery gauge shows the MJ per kilogram returned as electricity | Yes: place |
| 11 | Landfill cell and decades clock | Structure | Layered cell in cross-section with a dial reading in years; each material's remains fade at its own rate, glass and PET barely at all | No |
| 12 | Litter route and fragment emitter | Particle | Optional path to a storm drain and a stylised bay; a fragment emitter releases 0.2 u particles at a rate set by the material's brittleness | Yes: place |
| 13 | Energy meter | Instrument | Analogue-style dial plus a digital readout in MJ per functional unit, summing every stage live as the belt runs | No |
| 14 | Carbon and cost ledger | Instrument | Two rolling counters, kg CO₂ and cents per delivery, itemised by stage when clicked | No |
| 15 | Weighting console | UI-Probe | Four physical dials labelled energy, cost, durability and end-of-life; turning one visibly re-lengths the radar chart spokes | Yes: drag |
| 16 | Comparison rack and claim card | Overlay | Slots holding up to five completed runs as cards; a claim card at the front asks the student to name a winner and turns amber if the runs compared used different functional units | Yes: place |

**How it works — the model.**
Every material carries a real data row: embodied energy per kilogram (PET 84 MJ, glass 15 MJ, virgin aluminium 200 MJ, recycled aluminium 25 MJ, PLA 55 MJ, carton 27 MJ), bottle mass, transport emissions per tonne-kilometre, unit cost, expected number of uses, recyclability and degradation time. The engine deliberately reports everything per functional unit, defined as one litre delivered, not per kilogram, because per-kilogram comparison is exactly the trick that makes light materials look free and heavy ones look wasteful. Mass drives transport, so distance punishes glass and barely touches PET. Reuse divides manufacturing energy by the number of trips, which is why a returnable glass bottle overtakes PET at around eight trips. The weighted score is a normalised sum with student-set weights, and the sim shows plainly that no material wins every column.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Material under test | Dropdown | PET / Soda-lime glass / Aluminium / PLA bioplastic / Paperboard carton | PET | — | Swaps the bottle, the feedstock diorama and every data row |
| Functional unit | Slider | 1–200 | 100 | litres delivered | The job all materials must do; every result is divided by this |
| Transport distance | Slider | 10–2000 | 400 | km | Fuel and emissions per trip, scaled by the loaded mass |
| Recycled feedstock share | Slider | 0–100 | 0 | % | How much of the new bottle is made from recovered material |
| Kerbside capture rate | Slider | 0–95 | 30 | % | Fraction of used bottles that reach the sorter rather than the bin |
| End-of-life route | Dropdown | Recycle / Incinerate with recovery / Landfill / Littered | Recycle | — | Which door the belt takes, and which station five objects run |
| Weight: energy | Dial | 0–5 | 3 | — | Length of the energy spoke in the radar chart and its share of the score |
| Weight: cost | Dial | 0–5 | 2 | — | Share of the score given to cents per delivery |
| Weight: durability and reuse | Dial | 0–5 | 3 | — | Share of the score given to deliveries before failure |
| Weight: end-of-life recovery | Dial | 0–5 | 2 | — | Share of the score given to recovered mass fraction |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One hundred litres | material under test=PET then Soda-lime glass; functional unit=100; transport distance=400; end-of-life route=Recycle; kerbside capture rate=30 | Per litre delivered, which bottle costs less energy, and how many refills does the glass bottle need before it overtakes the PET one? |
| S2 | Aluminium twice over | material under test=Aluminium; recycled feedstock share=0 then 90; transport distance=400 | Nine-tenths of the energy disappears between the two runs. What was that energy being spent on in the first run? |
| S3 | Change what you care about | material under test=PET vs Paperboard carton; weight: energy=5 with weight: cost=1, then weight: energy=1 with weight: cost=5 | The data did not change but the winner did. What does that tell you about the word "better"? |
| S4 | The California deposit | material under test=PET; kerbside capture rate=25 then 75; end-of-life route=Recycle; transport distance=400 | A 10 cent CRV deposit lifts capture from a quarter to three-quarters. Which columns of the scorecard move, and which do not move at all? |

**Student activities.**
1. Set the functional unit to 100 litres and run all five materials in turn without changing anything else. Record energy, CO₂, cost and recovered fraction for each in one table.
2. Run glass at 1 delivery, then at 5, 10 and 20 refills. Plot energy per litre against number of refills and mark the crossover with PET.
3. Set aluminium to 0% recycled feedstock, then 90%, and record the energy change. Write one sentence naming the process that energy was paying for.
4. Set all four weighting dials to 3, note the ranking, then set energy to 5 and cost to 0 and note the ranking again. Record which materials swapped places.
5. Drag two run cards into the comparison rack that used different functional units. Record what the claim card says and explain why it refuses the comparison.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Energy per functional unit | Live numeric | MJ per litre delivered | Sums extraction, processing, transport, use and end-of-life credits |
| Stage breakdown | Bar chart | MJ | Five stacked segments so the dominant stage is obvious at a glance |
| Carbon footprint | Live numeric | kg CO₂ per functional unit | Updated as the belt passes each station |
| Cost per delivery | Live numeric | US cents | Material, processing, transport and disposal cost, itemised on click |
| Deliveries before failure | Counter | count | How many uses the product survived before the wear model broke it |
| Recovered mass fraction | Live numeric | % | Mass returned to a new product rather than burned, buried or littered |
| Fragment count | Counter | fragments | Only on the litter route, showing what a broken product leaves behind |
| Material profile | Heat map | normalised 0–1 | Radar chart across five criteria, one shape per material, overlaid |
| Weighted score | Live numeric | points | The single number, with the current weights printed beside it |
| Comparison validity | Pass-fail badge | — | Green only when compared runs share a functional unit and distance |

**What the student should realise.**
Students believe one material is simply good and another simply bad. Every run here splits the verdict: PET wins on transport and loses on end-of-life, glass reverses both, aluminium is worst or nearly best depending on one slider. The ranking follows from the weights chosen and from insisting that all materials do the same job. The student should be able to say: *"There is no best material, only a best material for this job, this distance and these priorities."*

### B5.5 · Comparing a natural and synthetic alternative

**Experiment name:** Same Test, Two Materials  
**Render mode:** 3D Scene  
**Simulation engine:** Data-driven model + Rigid-body  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-3

**Theme & scene.**
A quiet materials testing lab, daylight-white and deliberately symmetrical. At the centre a slow turntable carries two identical clamping jigs, and in them sit a matched pair of coupons cut to the same size: a cream cotton swatch and a bright white polyester swatch, indistinguishable at arm's length. Four stations ring the turntable, each duplicated left and right so both samples always meet the same machine: a tensile puller with a load cell, a rotating abrasion head under a weight, a water dropper above a balance, and a weathering cabinet with a violet lamp. A microscope panel hangs above, showing one fibre from each sample side by side. Twin mirrored result panels fill the right edge; the control panel sits beneath them.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Sample turntable and twin jigs | Instrument | 400 mm brushed steel disc indexing in six positions; two identical spring clamps face outward so a station always grips both coupons at once | Yes: drag |
| 2 | Coupon pair library | Actor | Six swappable pairs at 50 × 200 mm: cotton and polyester, vegetable-tanned leather and polyurethane, white oak and glass-fibre composite, wool and acrylic, natural rubber and neoprene, kraft paper and polypropylene film | Yes: swap |
| 3 | Tensile puller | Instrument | Twin-column rig with wedge grips, a 5 kN load cell and a clip-on extensometer; jaws separate at 100 mm/min until the coupon necks and parts with a visible tear | Yes: place |
| 4 | Martindale abrasion head | Instrument | 30 mm felt-faced rubbing head on a Lissajous drive, carrying a swappable 2–12 N weight; leaves a widening bald patch and stops on thread break | Yes: swap |
| 5 | Absorbency dropper and balance | Instrument | Burette above a 0.001 g balance pan; drops land on the coupon, and mass gained per gram of dry sample is logged every 5 s | Yes: place |
| 6 | Drying rack with fan and timer | Instrument | Wire rack in a 1 m/s airflow with a digital timer; each coupon's mass is tracked back to dry weight | Yes: drag |
| 7 | UV weathering cabinet | Environment | Sealed box with a violet lamp bank and a rotating carousel; an hour counter compresses 500 h into 60 s of run time | Yes: place |
| 8 | Heat behaviour plate | Instrument | Ceramic plate 50–300 °C under a clearly virtual guard screen; samples melt, shrink, char or do nothing, each with its own animation | Yes: place |
| 9 | Calipers and analytical balance | Instrument | Digital calipers to 0.01 mm and a four-place balance; both auto-fill the coupon's dimension and mass fields | Yes: drag |
| 10 | Fibre microscope, textile pair | Overlay | Cotton drawn as a flat twisted ribbon 15 µm wide with a hollow lumen; polyester as a smooth glassy rod 12 µm across; both at the same magnification | Yes: swap |
| 11 | Cross-section model, leather pair | Overlay | Leather as a dense random weave of collagen fibre bundles; polyurethane as a printed foam skin bonded onto a knitted backing, with the bond line visible | Yes: swap |
| 12 | Cross-section model, timber pair | Overlay | Oak as tracheid tubes with ray cells crossing them; composite as parallel glass rovings 16 µm across embedded in clear resin | Yes: swap |
| 13 | Twin results panel | Overlay | Two mirrored bar charts sharing one axis scale, forced identical so a difference cannot be exaggerated by re-scaling | No |
| 14 | Fair-test interlock | Field | Invisible validator holding every station's settings; when on, it refuses to run unless both jigs are loaded and every setting matches | Yes: swap |
| 15 | Repeat scatter and error bars | Overlay | Each repeat drops a dot on the bar chart; the bar shows the mean and whiskers show the range across repeats | No |
| 16 | Cost and sourcing tag | Instrument | Hand scanner that reads a coupon tag and prints cost per square metre, raw source and typical service life | Yes: place |

**How it works — the model.**
Each material carries a vector of measured values: breaking stress, extension at break, abrasion cycles to failure, water held as a percentage of dry mass, drying time in a 1 m/s draught, strength retained after 500 h of ultraviolet exposure, behaviour on a hot plate, density, cost per square metre. Cotton holds about 24 g of water per 100 g and dries slowly; polyester holds about 3 g and dries roughly three times faster. Polyester survives around 30 000 abrasion cycles against cotton's 10 000, but melts at 254 °C where cotton chars without melting. Every result is drawn from the stored mean with a five per cent spread, so two repeats never match exactly and the student must average. The fair-test interlock is the heart of the sim: with it on, a station physically cannot apply a different load to the two jigs, and turning it off is allowed precisely so the student can watch a conclusion break.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sample pair | Dropdown | Cotton and polyester / Leather and polyurethane / Oak and glass-fibre composite / Wool and acrylic / Rubber and neoprene / Paper and polypropylene film | Cotton and polyester | — | Swaps both coupons and both microscope cross-sections |
| Tests to run | Multi-select | Tensile / Abrasion / Absorbency / Drying / Ultraviolet / Heat | Tensile + Absorbency + Drying | — | Which stations the turntable visits, and in what order |
| Abrasion load | Slider | 2–12 | 9 | N | Weight on the rubbing head, and therefore cycles to failure |
| Ultraviolet exposure | Slider | 0–500 | 0 | h | Simulated weathering applied before the mechanical tests |
| Hot plate temperature | Slider | 50–300 | 200 | °C | Whether a sample softens, melts, shrinks or chars |
| Water dose | Slider | 0.5–10 | 5.0 | mL | Volume dropped onto each coupon in the absorbency test |
| Repeats per test | Stepper | 1–5 | 3 | count | How many times each station runs; drives the error bars |
| Coupon width | Slider | 10–50 | 25 | mm | Recuts both coupons; changes breaking force but not breaking stress |
| Microscope magnification | Dial | 10–500 | 100 | × | Zoom on the paired fibre or cross-section models |
| Fair-test interlock | Toggle | On / Off | On | — | Forces both jigs to receive identical settings, or releases them |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The school shirt | sample pair=Cotton and polyester; tests to run=Tensile + Absorbency + Drying; repeats per test=3 | Each fabric wins some tests. List which, and say which shirt you would want for a hot day and why. |
| S2 | The bag strap | sample pair=Leather and polyurethane; tests to run=Tensile + Abrasion + Absorbency; abrasion load=9; repeats per test=3 | Polyurethane costs a quarter as much. After 20 000 abrasion cycles, is it still the cheaper choice? |
| S3 | The bench slat | sample pair=Oak and glass-fibre composite; tests to run=Tensile + Ultraviolet + Absorbency; ultraviolet exposure=500 | Divide breaking stress by density for both. Which is stronger for its weight, and which changed most after weathering? |
| S4 | A broken comparison | fair-test interlock=Off; abrasion load=4 on the natural jig and 10 on the synthetic jig; repeats per test=1 | Write the conclusion this run supports, then turn the interlock back on, re-run and write the conclusion again. Which one is worth anything? |

**Student activities.**
1. Load the cotton and polyester pair, set repeats to 3, and run the tensile, absorbency and drying tests. Record the mean and the range for every result in one shared table.
2. Measure both coupons with the calipers first, then record breaking force and breaking stress separately. Explain in one sentence why the two columns rank the materials differently when the widths differ.
3. Set ultraviolet exposure to 500 h on the oak and composite pair, re-run the tensile test, and record strength retained as a percentage for each.
4. Turn the fair-test interlock off, give one jig a 4 N abrasion load and the other 10 N, and record the result. Then turn the interlock back on, re-run, and record the difference between the two conclusions.
5. Scan both cost tags and build a final table with one row per criterion, marking which material wins each row. Count the wins and state which material you would choose for a named product.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Breaking force and stress | Live numeric | N and MPa | Peak load and load divided by cross-section, printed for both jigs |
| Stress-strain curves | Line graph | MPa vs % | Both samples on one pair of axes with a shared scale |
| Abrasion cycles to failure | Counter | cycles | Counts up live and freezes when the surface breaks through |
| Water held | Live numeric | g per 100 g dry | Balance reading converted to percentage of dry mass |
| Drying time | Timer | s | Time to return to within 1% of dry mass in the draught |
| Strength retained after weathering | Live numeric | % | Post-ultraviolet breaking stress over the unweathered value |
| Heat behaviour | Pass-fail badge | — | One of melts, shrinks, chars, or no visible change, per sample |
| Cost per square metre | Live numeric | US$ | Read from the coupon tag, alongside raw source and service life |
| Paired property profile | Heat map | normalised 0–1 | Spider chart with both materials overlaid on identical axes |
| Fair-test status | Pass-fail badge | — | Green only while both jigs ran the same test at the same settings |

**What the student should realise.**
Students believe natural means better and gentler, or that synthetic means stronger and cheaper. The paired bars refuse both: cotton wins on comfort and heat behaviour, polyester on strength, abrasion and drying, and each pair splits the same way. A verdict only exists once you name the job. The student should be able to say: *"Neither one wins everything, so I choose by what the product has to do, and the comparison only counts if both got the same test."*

## B6 · Designing a thermal energy device · MS-PS1-6

### B6.1 · Criteria and constraints

**Experiment name:** Write the Spec, Break the Spec  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Data-driven model  
**Interaction level:** Design  
**Session length:** 12–18 min  
**NGSS anchor:** MS-PS1-6

**Theme & scene.**
A design studio bench under a low pendant lamp. Filling the left is a magnetic whiteboard split into two columns headed MUST DO and MUST NOT EXCEED, with blank cards stacked in a tray beneath it; each card has empty slots for a quantity, a comparison symbol, a number, a unit and a way of checking. On the bench to the right stands a glass test cabinet holding the client's actual object: a chilled drink can with a probe already in it. Behind the cabinet a rack of five sealed candidate pouches waits under numbered labels. A spec compiler bar runs along the bottom, currently red, listing what is missing. A small wheeled bot sits idle beside the rack.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Spec whiteboard | Structure | 1200 × 800 mm magnetic board, two labelled columns with snap zones for up to eight cards; cards click into place and glow at the edge when complete | Yes: place |
| 2 | Criterion card | UI-Probe | Pale green card 220 × 90 px with five slots: quantity, comparison, value, unit, check method; incomplete slots pulse amber | Yes: drag, swap |
| 3 | Constraint card | UI-Probe | Pale red card of the same size and slots; used for limits the design must not cross | Yes: drag, swap |
| 4 | Quantity and unit chips | UI-Probe | Small magnetic tiles reading temperature change, time, mass, cost, surface temperature; unit chips read °C, min, g, US$, mL | Yes: drag |
| 5 | Comparison chips | UI-Probe | Three tiles reading at least, at most, and between; snapping one into a card sets the predicate's direction | Yes: drag |
| 6 | Client brief card | Structure | Pinned photo card at the top of the board with the client's words in plain speech, deliberately vague, plus the ambient temperature they will use it in | Yes: swap |
| 7 | Test cabinet and target object | Environment | Glass-fronted cabinet holding the object under discussion: a 350 mL drink can, a gel pack on a model ankle, or a lunch box, with a probe and a stopwatch | Yes: swap |
| 8 | Candidate device rack | Actor | Five sealed foil pouches on numbered hooks, each carrying a hidden property vector for temperature change, time, hold, mass, cost, surface temperature and reusability | No |
| 9 | Spec compiler bar | Instrument | Bottom strip that parses every card into a machine-checkable test; prints one error line per fault and turns amber then green | No |
| 10 | Loophole bot | Actor | Palm-sized wheeled robot with a single lens; when released it trundles to the rack, picks the worst device that still legally passes the written spec, and drives it to the cabinet | Yes: place |
| 11 | Energy budget calculator | Instrument | Side panel that computes the joules needed for the stated temperature change and compares them with the joules the mass budget can supply | No |
| 12 | Feasible region plot | Overlay | Cost against temperature change on two axes; each constraint drops a line and shades out the excluded half plane, leaving a white feasible island | No |
| 13 | Check-method chip | UI-Probe | Tile reading probe in the liquid, probe on the outer surface, stopwatch, or balance; a criterion with no method cannot compile | Yes: drag |
| 14 | Safety guard stamp | Instrument | Red rubber stamp that slams onto any spec allowing a surface above 50 °C, marking it REJECTED with a note about skin contact | No |
| 15 | Spec version log | Overlay | Right-hand column listing every compiled draft with a timestamp, the error count and the number of devices that passed | Yes: place |
| 16 | Spec quality meter | Instrument | Vertical gauge scoring measurability, completeness and tightness from 0 to 100, moving as cards change | No |

**How it works — the model.**
Every card compiles into a predicate of the form quantity, comparison, value, unit, method. The compiler rejects a card missing any of the five, so words like fast or safe cannot pass. Once compiled, the spec is run against all five candidates and the pass list is shown. Two checks then run. The energy budget uses real physics: cooling 350 mL of drink by 20 °C needs about 29 kJ, and ammonium nitrate absorbs roughly 0.32 kJ per gram, so a 10 g mass cap makes that criterion impossible, and the calculator says so with the arithmetic visible. The satisfiability check intersects every constraint on the cost against temperature-change plane; if the feasible island vanishes, no device can exist. Finally the loophole bot searches for the device that passes the written words while serving the client worst, which is the whole point of the experiment.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Client brief | Dropdown | Hand warmer for a Sierra hike / Cold pack for a sprained ankle / Warm a packed lunch / Chill a drink on a Fresno soccer sideline | Cold pack for a sprained ankle | — | Swaps the target object, the ambient temperature and the candidate rack |
| Cards on the board | Drag-handle | Place or remove 0–8 cards, each with five slots | 2 criteria and 1 constraint | count | Which predicates exist at all; nothing compiles until cards are placed |
| Target temperature change | Slider | 2–60 | 20 | °C | The value written into the temperature criterion card |
| Time to reach target | Slider | 0.5–30 | 3.0 | min | The value written into the speed criterion card |
| Hold time at target | Slider | 1–60 | 20 | min | How long the device must stay past the target before it counts as done |
| Mass budget | Slider | 5–200 | 120 | g | Upper limit on the whole device, which caps the energy available |
| Cost cap | Slider | 0.10–5.00 | 1.50 | US$ | Upper limit per unit; drops a vertical line on the feasible region plot |
| Maximum surface temperature | Slider | 30–70 | 50 | °C | Safety limit checked against every candidate's outer skin |
| Reuse requirement | Radio | Single-use / Reusable / Either | Either | — | Removes non-conforming candidates from the rack entirely |
| Release the loophole bot | Toggle | On / Off | Off | — | Sends the bot to fetch the worst device your written spec still allows |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The vague spec | cards on the board=3 with words only and no numbers; release the loophole bot=On | The bot returns a pouch that reaches 78 °C in four seconds and passes. Name the missing element on each of your three cards. |
| S2 | Nothing can exist | client brief=Chill a drink on a Fresno soccer sideline; target temperature change=50; mass budget=10; cost cap=0.20; time to reach target=1.0 | The feasible island vanishes. Read the energy budget panel and say which single constraint you must relax, and by how much. |
| S3 | A spec worth having | target temperature change=15; time to reach target=3.0; hold time at target=20; mass budget=120; cost cap=1.50; maximum surface temperature=50; reuse requirement=Either; release the loophole bot=On | Two candidates now pass and the bot cannot find a loophole. What tie-break criterion would you add, and how would you measure it? |
| S4 | Fresno sideline | client brief=Chill a drink on a Fresno soccer sideline; target temperature change=15; hold time at target=20 | The same spec that worked indoors now fails. Which card has to change once ambient is 38 °C rather than 21 °C? |

**Student activities.**
1. Drag three criterion cards and two constraint cards onto the board and fill every slot. Record the compiler's error count before and after you add the unit and check-method chips.
2. Release the loophole bot on your first draft. Record which device it fetched and the exact number that made your spec allow it.
3. Set the target change to 50 °C with a 10 g mass budget. Copy the energy budget arithmetic into your notes and state, in joules, why no device can pass.
4. Tighten the cost cap step by step from $5.00 down to $0.20, recording after each step how many candidates still pass and how the feasible island shrinks.
5. Rewrite the whole spec for the Fresno brief. Record your final card set, then run the bot again and note whether any loophole survives.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Compiler status | Pass-fail badge | — | Green only when every card carries a quantity, comparison, value, unit and method |
| Missing-element list | Data table | — | One line per faulty card naming exactly which slot is empty |
| Candidates passing | Counter | count | How many of the five sealed devices satisfy the current written spec |
| Worst legal device | Live numeric | mixed | The bot's find, with its temperature change, surface temperature, mass and cost |
| Energy budget | Live numeric | kJ | Joules required versus joules the mass budget can supply, shown side by side |
| Feasible region | Heat map | US$ vs °C | Shaded plot whose white island shrinks as constraints tighten and vanishes when over-constrained |
| Spec quality score | Live numeric | points out of 100 | Measurability, completeness and tightness, recalculated on every card change |
| Draft history | Data table | mixed | Every compiled version with its error count, passing candidates and score |

**What the student should realise.**
Students treat the brief as the easy part before real work. The loophole bot ends that: a spec written in words is satisfied by a device that scalds the user, and a spec with numbers but no mass ceiling demands more energy than physics allows. A criterion is a test, not a wish. The student should be able to say: *"If I cannot say what to measure, in what unit, and which way is better, it is not a criterion."*

### B6.2 · Choosing a chemical process

**Experiment name:** The Reagent Shortlist  
**Render mode:** 3D Scene  
**Simulation engine:** Fluid/thermal + Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-6

**Theme & scene.**
Six identical white polystyrene cups stand in a row on a dark bench, each lidded, each with a stirrer bar turning and a slim digital probe through the lid reading to a tenth of a degree. A clear acrylic safety screen crosses the front with VIRTUAL LAB etched into it, and every hazard placard on the reagent shelf is drawn as an outline rather than a solid, so nothing here reads as real. Behind the cups a shelf holds eight labelled bottles and a top-pan balance with a spatula resting on the pan guard. Above the bench, a six-channel strip-chart recorder draws six coloured temperature traces on a rolling grid. A floating energy-bar panel opens whenever a reagent is selected.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Calorimeter cup and lid | Instrument | 250 mL expanded polystyrene cup, 3 mm wall, with a two-port lid; six instanced in a row; a cutaway toggle shows the wall thickness and the trapped air | Yes: swap |
| 2 | Digital temperature probe | Instrument | 3 mm stainless stem through the lid, tip in the liquid, face reading to 0.1 °C at 2 Hz; one per cup, colour-keyed to its chart trace | Yes: place |
| 3 | Magnetic stirrer and flea | Actor | Low black plate under each cup with a 20 mm PTFE flea making a visible vortex; vortex depth scales with stir speed | Yes: drag |
| 4 | Balance, spatula and weighing boat | Instrument | Top-pan balance to 0.01 g with a draught shield; every weighing writes straight into the run log | Yes: drag |
| 5 | Measuring cylinder and wash bottle | Instrument | 100 mL graduated cylinder with a readable meniscus, plus a squeeze bottle for making up volumes | Yes: drag |
| 6 | Reagent bottle shelf | Structure | Eight amber and clear bottles: calcium chloride, magnesium sulfate, ammonium nitrate, ammonium chloride, potassium nitrate, sodium acetate solution, iron powder with salt, citric acid with sodium hydrogencarbonate | Yes: swap |
| 7 | Ionic lattice and dissolved ions | Particle | Salt drawn as a cubic lattice of alternating spheres that peels apart at the corners; free ions coloured by species, with Cl⁻ green r=0.90 u, Na⁺ violet r=0.50 u, Ca²⁺ pale green r=0.55 u, NO₃⁻ as a blue-red planar triad | No |
| 8 | Water molecules and hydration shells | Particle | 0.20 u bent triads, red oxygen and white hydrogens, ~2000 per cup; six of them swing around and cage each freed ion with a visible click | No |
| 9 | Two-step energy bar | Overlay | Panel with an upward bar for energy taken in to break the lattice and a downward bar for energy given out as ions are hydrated, plus the net arrow between them | Yes: swap |
| 10 | Iron powder grains and air inlet | Actor | 60 µm grey grains that grow a rust-orange oxide shell over minutes; a vent slider controls oxygen entry and therefore reaction rate | Yes: drag |
| 11 | Sodium acetate solution and click disc | Actor | Clear supersaturated solution with a small metal disc at the bottom; clicking it launches a white crystal front that races through the liquid in about 4 s | Yes: place |
| 12 | Fizzing pair and gas bubbles | Actor | Citric acid crystals plus sodium hydrogencarbonate powder; on mixing, CO₂ bubbles rise and the trace dives | Yes: swap |
| 13 | Six-channel strip chart | Overlay | Rolling grid 900 × 320 px, temperature against time, six traces plus a dashed line at the starting temperature | No |
| 14 | Insulation swap set | Structure | Three interchangeable vessels: bare glass beaker, single polystyrene cup, double cup with a lid; the cutaway shows why loss differs | Yes: swap |
| 15 | Safety screen and alarm | Environment | Acrylic screen plus an amber lamp and a soft chime whenever any cup passes 60 °C, with an on-screen note that this is a simulation | No |
| 16 | Cost tag reader and shortlist table | Instrument | Scanner that reads each bottle's price per kilogram and writes energy per gram and energy per cent into a growing comparison table | Yes: place |

**How it works — the model.**
Each process carries a real molar enthalpy: ammonium nitrate dissolving takes in 25.7 kJ per mole, ammonium chloride 14.8, potassium nitrate 34.9; calcium chloride gives out 82.8 kJ per mole, magnesium sulfate 91.2, sodium acetate crystallising about 36, and iron oxidising about 14.7 kJ per gram of iron. Temperature change is computed as moles times enthalpy divided by the thermal mass of the water plus the vessel, using 4.18 J per gram per degree, with a Newton cooling term to ambient so every trace peaks and then decays. Rate is separate from size: a soluble salt releases its energy in seconds, iron releases far more energy but is limited by oxygen entering the pouch, so it delivers a small rise for forty minutes. The energy bars keep endothermic dissolving honest, showing lattice separation taking energy in and hydration giving it back, with the sign of the sum deciding everything.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Reagent in the selected cup | Dropdown | Calcium chloride / Magnesium sulfate / Ammonium nitrate / Ammonium chloride / Potassium nitrate / Sodium acetate / Iron with salt and air / Citric acid with sodium hydrogencarbonate | Calcium chloride | — | Loads that bottle's contents, its particle model and its energy bars |
| Mass of reagent | Slider | 0.5–40 | 10.0 | g | Moles reacting, and therefore total energy released or absorbed |
| Water volume | Slider | 25–250 | 100 | mL | Thermal mass being heated or cooled; halving it doubles the change |
| Starting water temperature | Slider | 5–40 | 21 | °C | Where the trace begins and how fast it loses heat to the room |
| Stirring | Radio | Off / Slow / Fast | Slow | — | How quickly the solid dissolves, which sets time to peak |
| Vessel and insulation | Dropdown | Bare glass beaker / Single polystyrene cup / Double cup with lid | Single polystyrene cup | — | Rate of heat loss, and therefore how long the peak is held |
| Particle size | Dropdown | Fine powder / Small crystals / Lumps | Small crystals | — | Surface area, which changes speed but not total energy |
| Air vent for the iron cup | Slider | 0–100 | 40 | % open | Oxygen supply, which is the rate limit on the iron reaction |
| Run all six cups | Toggle | On / Off | On | — | Runs the whole shortlist in parallel on one chart, or one cup alone |
| Energy-bar overlay | Toggle | On / Off | On | — | Shows lattice-breaking and hydration bars for the selected reagent |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The warming shortlist | reagent in the selected cup=Calcium chloride, Magnesium sulfate, Iron with salt and air; mass of reagent=10; water volume=100; vessel and insulation=Single polystyrene cup; run all six cups=On | All three warm the water. Rank them by peak temperature, then rank them by how long they stay above 30 °C. Are the rankings the same? |
| S2 | The cooling shortlist | reagent in the selected cup=Ammonium nitrate, Ammonium chloride, Potassium nitrate; mass of reagent=10; water volume=100; starting water temperature=21 | Which reagent drops the temperature furthest, and what do the energy bars show is happening in the water while it does? |
| S3 | Peak against duration | reagent in the selected cup=Calcium chloride versus Iron with salt and air; air vent for the iron cup=40; run all six cups=On | One cup wins by 14 °C in the first minute and loses badly by minute thirty. Which device would each suit, and why? |
| S4 | Does doubling double it? | mass of reagent=10 then 20 with water volume=100; then mass of reagent=20 with water volume=200 | Predict the temperature change for each of the three runs before you press Run, then record the actual values and explain the pattern. |

**Student activities.**
1. Weigh 10.0 g of calcium chloride into 100 mL of water at 21 °C and record starting temperature, peak temperature and time to peak.
2. Repeat with each of the six shortlisted reagents at the same mass and volume. Build one table with peak change, time to peak and time spent past the target.
3. Predict, then test, what happens when you keep the mass at 10 g and halve the water to 50 mL. Record both temperature changes and explain the ratio.
4. Switch the vessel from a bare beaker to a double cup with a lid, re-run your best exothermic reagent, and record how much longer it stays above 30 °C.
5. Scan every bottle's cost tag and add two columns to your table: kilojoules per gram and kilojoules per cent. Circle the reagent you would shortlist and write one sentence saying why.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Live temperature | Live numeric | °C | One reading per cup at 2 Hz, to 0.1 °C |
| Six-trace temperature record | Line graph | °C vs s | All cups on one time axis, with the starting temperature dashed |
| Peak temperature change | Live numeric | °C | Largest deviation from the start, signed so endothermic reads negative |
| Time to peak | Timer | s | From mixing to the extreme of the trace |
| Time past target | Timer | s | How long the cup stayed above 30 °C or below 10 °C, chosen by the task |
| Energy exchanged | Live numeric | kJ | Computed from mass, enthalpy and moles, shown beside the measured value |
| Energy density | Live numeric | kJ per g and kJ per cent | The two numbers a designer actually shortlists on |
| Safety flag | Pass-fail badge | — | Amber whenever any cup passes 60 °C or drops below 0 °C |
| Shortlist table | Data table | mixed | Exportable CSV with one row per reagent and every measured column |

**What the student should realise.**
Students think exothermic means good and endothermic means bad, and that a chemical has one fixed temperature it reaches. Both fall apart here: the same 10 g gives a different temperature change in a different volume of water, and the reagent with the biggest peak is often the one that lasts ninety seconds. The student should be able to say: *"Choosing a process means choosing how much energy per gram, how fast it arrives, and how long it lasts."*

### B6.3 · Collecting temperature data

**Experiment name:** Six Probes, One Truth  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Fluid/thermal + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-6

**Theme & scene.**
The prototype pouch lies on a bench, sliced open down its long axis so its four layers are visible at once: a grey reagent bed, a sealed water sachet, a thin air gap, and the woven outer shell. Six thermocouples coil beside it like patient snakes, each with a coloured lead and a bright bead at the tip. Seven small pin sockets glow faintly at the places a probe can be fixed, from deep in the reagent bed to the outer fabric and the rubber hand pad pressed against it. A datalogger box hums at the back with six channel lamps and a memory bar. On the wall a thermostat drifts by tenths of a degree, and a small fan waits beside it. A strip chart fills the lower third.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Pouch cutaway | Structure | 120 × 80 × 18 mm pouch sliced on its long axis; the cut face shows all four layers with true relative thickness and a 10 mm scale bar | Yes: resize |
| 2 | Reagent bed | Structure | 8 mm bed of pale granules that darken as they react; a false-colour option paints the bed by local temperature | Yes: swap |
| 3 | Water sachet and burst seal | Actor | Clear 25 mL sachet with a crimped seal that splits on a click, releasing water into the bed with a visible wetting front | Yes: place |
| 4 | Air gap | Structure | 3 mm void drawn as faint drifting motes; the layer with the largest thermal resistance and the reason the outside stays cooler | Yes: resize |
| 5 | Fabric outer shell | Structure | Woven 0.6 mm skin with visible weave at 200× in the inset; heats last and least | Yes: swap |
| 6 | Type K thermocouple | Instrument | 0.25–3.0 mm bead on a twisted lead, six units in six lead colours; the bead visibly grows or shrinks with the size control | Yes: drag, place |
| 7 | Pin socket sites | Field | Seven invisible anchor points labelled reagent core, bed edge, inner wall, air gap, outer fabric, hand pad, room air; each returns its own true temperature | No |
| 8 | Rubber hand pad | Actor | 60 × 60 mm silicone pad at 33 °C pressed against the pouch face, with its own embedded reference sensor | Yes: drag |
| 9 | Datalogger | Instrument | Desktop box with six lamps, a sampling-interval dial, a memory bar that fills as points are stored, and a start-stop key | Yes: place |
| 10 | Calibration station | Instrument | Vacuum flask of ice and water at 0 °C beside a clearly virtual boiling flask at 100 °C, plus a reference thermometer to 0.05 °C | Yes: place |
| 11 | Draught fan | Actor | 90 mm desk fan with three positions; its airflow cone is drawn and it only cools probes exposed to it | Yes: drag |
| 12 | Room thermostat | Environment | Wall unit whose reading drifts on a slow sine of about 1.5 °C over ten minutes, so no baseline is perfectly flat | Yes: swap |
| 13 | Strip chart canvas | Overlay | 1000 × 300 px rolling plot with one trace per active channel, sample points marked as dots and a draggable cursor printing exact values | No |
| 14 | True-curve ghost | Overlay | Faint grey continuous curve of the real temperature behind each sampled trace, revealing what slow sampling missed | No |
| 15 | Fault injector | Field | Optional fault that unclips one probe mid-run so its trace drifts smoothly toward room air; the student must identify which channel | Yes: swap |
| 16 | Timestamped data table | Instrument | Scrolling table of time, channel, site, raw value and corrected value, with a CSV export button | Yes: place |

**How it works — the model.**
Heat moves outward through four shells with real thermal resistances, solved as a transient one-dimensional network each tick. Because each shell resists, the sites genuinely peak at different values and at different moments: the reagent core reaches about 58 °C at 90 s, the inner wall about 47 °C at 140 s, and the outer fabric only about 41 °C at 240 s. Each thermocouple then adds instrument behaviour on top of the truth. Bead size sets a response time constant from roughly 1 s at 0.25 mm to 8 s at 3 mm, so a fat probe lags and flattens a sharp peak. A settable offset shifts every reading, and Gaussian noise is added. Sampling is modelled honestly: at long intervals the sim still draws the true curve as a ghost, so an undersampled run visibly walks straight past the peak. Ambient drifts, and the fan only cools exposed probes.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Probe placement | Drag-handle | Pin up to 6 probes onto any of 7 sites | 1 probe at outer fabric | site | Which temperatures are recorded at all; each pinned probe adds a trace |
| Sampling interval | Slider | 0.5–60 | 5.0 | s | How often a point is stored; long intervals miss short peaks |
| Run duration | Slider | 1–40 | 10 | min | Length of the record and how much of the cooling tail is captured |
| Probe bead size | Slider | 0.25–3.0 | 0.5 | mm | Response time constant, and therefore how much a peak is rounded off |
| Sensor noise | Slider | 0.05–0.50 | 0.10 | °C | Scatter added to every reading; sets how many repeats you need |
| Calibration offset | Slider | −2.0 to +2.0 | 0.0 | °C | Shifts the selected probe's readings, to be caught at the ice point |
| Draught fan | Radio | Off / Low / High | Off | — | Extra convective loss on exposed probes only |
| Repeat runs | Stepper | 1–5 | 1 | count | Number of runs averaged, which turns single traces into means with ranges |
| Probe fault | Dropdown | None / Probe unclips at half-time / Probe pinned to the shell instead of the core | None | — | Corrupts one named channel physically, so its trace drifts or reads the wrong site |
| True-curve ghost | Toggle | On / Off | Off | — | Draws the real continuous temperature behind the sampled points |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One probe, one run | probe placement=1 probe at outer fabric; sampling interval=30; run duration=10; repeat runs=1 | Report the peak temperature of this device from your single trace. Write the number down and keep it. |
| S2 | Six probes, fast sampling | probe placement=6 probes at all sites; sampling interval=1.0; run duration=10; true-curve ghost=On | Compare your S1 number with all six peaks. Which site were you actually reporting, and by how much were you wrong about the core? |
| S3 | The suspect channel | probe placement=3 probes; calibration offset=+1.8 on channel 2; probe fault=Probe unclips at half-time; sampling interval=1.0 | Two channels disagree by nearly 2 °C. Use the ice point to decide which one is lying, and record the correction you apply. |
| S4 | Three repeats in a draught | probe placement=2 probes at outer fabric and hand pad; repeat runs=3; draught fan=Low then High | Record the mean and range of peak temperature for both fan settings. What belongs in the report as the uncertainty? |

**Student activities.**
1. Pin one probe to the outer fabric, set the interval to 30 s and run for 10 min. Record the peak temperature and the time it happened.
2. Pin all six probes, set the interval to 1 s, re-run and record the peak and time to peak for every site in one table. Mark how far apart the highest and lowest peaks are.
3. Turn the true-curve ghost on and re-run at 30 s intervals. Measure and record the difference between the ghost's peak and the peak your stored points show.
4. Dip each probe in the ice flask before a run and record its reading. Apply the offset you find, then state which channel you would have trusted wrongly.
5. Run the same configuration three times with the fan on Low. Record all three peaks, then report a single result in the form mean plus or minus half the range.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Live channel temperatures | Live numeric | °C | One row per pinned probe with its site name, to 0.1 °C |
| Multi-channel record | Line graph | °C vs s | One trace per channel with stored points marked, cursor prints exact values |
| Peak and time to peak | Data table | °C and s | Per channel, so the spread between sites is unavoidable to see |
| Time above 40 °C | Timer | s | Per channel; the number a hand-warmer specification actually cares about |
| Ice-point calibration check | Data table | °C | Each probe's reading in the 0 °C flask, with the offset it implies |
| Repeat spread | Live numeric | mean ± half-range in °C | Across repeats, computed per channel |
| Missed-peak indicator | Pass-fail badge | — | Amber when the sampled peak differs from the true peak by more than 1 °C |
| Full record | Data table | mixed | Exportable CSV of timestamp, channel, site, raw value, corrected value |

**What the student should realise.**
Students believe a thermometer reading is simply the temperature of the thing. Six probes in one small pouch return six different peaks at six different moments, and a slow sampling interval walks straight past the highest point. A reading is a claim about a place, a moment and an instrument. The student should be able to say: *"I have to say where I measured, how often, how well the probe was calibrated, and how much my repeats disagreed."*

### B6.4 · Modifying the design

**Experiment name:** Version Seven: The Iteration Bench  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Fluid/thermal  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-6

**Theme & scene.**
A workbench under a bright task lamp, with the current prototype laid out exploded on a magnetic mat: the woven outer shell, an insulating sheet, the reagent sachet, the water ampoule, the burst seal, and a small set of plastic baffle vanes, each part hovering a centimetre above its neighbour and labelled with its mass. To the left, a squat test chamber with a glass door holds the assembled pouch between two thermocouples. To the right, a wall of shelf slots holds every saved version as a physical card, each printed with a small render of that build and its scorecard, joined by a drawn version tree that branches where the student branched. Along the bottom run five spec meters with green target bands.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Assembly mat | Environment | 500 × 350 mm steel mat with six labelled outlines; parts snap into their outline and the pouch reassembles with an animated fold when Build is pressed | Yes: place |
| 2 | Outer shell swatch set | Structure | Three 120 × 80 mm skins: ripstop nylon 0.15 mm at 6 g, non-woven polypropylene 0.4 mm at 9 g, foil laminate 0.1 mm at 7 g; each with its own weave render and emissivity | Yes: swap |
| 3 | Insulation layer | Structure | Four options rendered at true thickness: none, felt 2 mm, bubble film 4 mm, foil laminate 1 mm; a drag handle on the edge sets thickness from 0 to 10 mm and the mass label updates live | Yes: swap, resize |
| 4 | Reagent sachet | Actor | Heat-sealed pouch with a mass dial printed on its face; granules visible through a window and darkening as they react | Yes: swap, resize |
| 5 | Water ampoule | Actor | Clear 120 mL blister with a volume dial; wetting front visibly spreads through the reagent bed when the seal is broken | Yes: resize |
| 6 | Burst seal strip | Structure | Crimped 40 mm strip that splits with a click on activation; its position sets where wetting begins and therefore how evenly the bed reacts | Yes: drag |
| 7 | Mixing baffle vanes | Structure | Zero to four 30 × 10 mm polypropylene vanes at 1 g each, snapping into slots inside the pouch; visibly channel the water across the whole bed | Yes: place |
| 8 | Assembled prototype | Actor | The live build, 120 × 80 mm, thickness recomputed from its parts; a cutaway toggle shows the layer stack in section | Yes: resize |
| 9 | Test chamber | Environment | Insulated box with a glass door, a thermostat and still air; one fixed ambient per run so builds are comparable | Yes: swap |
| 10 | Thermocouple pair | Instrument | Two 0.5 mm beads, one pinned in the reagent core and one on the outer shell, colour-keyed and always at the same two sites | Yes: place |
| 11 | Version card | Overlay | 180 × 240 px card with a small render of that exact build, its parameter list and its six-line scorecard; slots into the shelf wall | Yes: drag, place |
| 12 | Version tree rail | Overlay | Drawn line linking each card to its parent, branching where a version was forked; the best-so-far card carries a gold clip | No |
| 13 | Spec meter bar | Instrument | Five horizontal gauges for time to 40 °C, hold time, mass, cost and peak surface temperature, each with a green target band drawn from the B6.1 spec | Yes: swap |
| 14 | Diff ribbon | Overlay | Strip above the scorecard listing every parameter that differs from the parent version, with old and new values side by side | No |
| 15 | A and B compare tray | Instrument | Two card slots on the bench front; dropping two versions in prints a delta table of every scorecard line | Yes: place |
| 16 | One-change lock and regression flag | Field | Lock lamp turns green when exactly one parameter differs from the parent; a red regression flag raises when any previously passing spec meter falls out of band | Yes: swap |

**How it works — the model.**
The build's performance is computed from its parts, not chosen from a list. Total energy is reagent mass times its energy per gram, taken from the B6.2 shortlist. Peak core temperature rise is that energy divided by the thermal mass of water, reagent and shell, using 4.18 J per gram per degree. Heat then leaves through the layer stack at a rate set by the summed thermal resistance, so hold time above 40 °C rises with insulation while mass and cost rise with it too. Surface temperature is core temperature minus the drop across the insulation, which means the safest build is also the slowest to warm the hand. Baffles cut time to peak by about a third and add one gram each. Every Run writes a version node holding its parent pointer, its full parameter set, its scorecard and its diff, so the tree is the experiment's real output.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Insulation layer | Dropdown | None / Felt / Bubble film / Foil laminate | None | — | Which sheet exists in the stack, its thermal resistance and its mass |
| Insulation thickness | Slider | 0–10 | 2.0 | mm | Thermal resistance, hold time, added mass and added cost |
| Shell material | Dropdown | Ripstop nylon / Non-woven polypropylene / Foil laminate | Ripstop nylon | — | Surface heat loss and the shell's contribution to total mass |
| Reagent | Dropdown | Calcium chloride / Magnesium sulfate / Iron with air / Sodium acetate | Calcium chloride | — | Energy per gram, speed of release and whether the device is reusable |
| Reagent mass | Slider | 2–40 | 15 | g | Total energy available, and therefore peak temperature |
| Water volume | Slider | 10–120 | 40 | mL | Thermal mass warmed; more water lowers the peak but steadies it |
| Mixing baffles | Stepper | 0–4 | 0 | count | How evenly water reaches the bed, cutting time to peak and adding mass |
| One change at a time | Toggle | On / Off | On | — | Refuses to run a build that differs from its parent in more than one parameter |
| Branch from version | Dropdown | Any saved version card | Latest | — | Sets the parent for the next build, forking the tree |
| Test chamber ambient | Slider | 0–30 | 10 | °C | The conditions all versions are compared in; changing it invalidates old comparisons |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One clean change | insulation layer=None with reagent mass=15 and mixing baffles=0; then insulation layer=Felt with insulation thickness=2.0; one change at a time=On | Read the diff ribbon and the delta table. Exactly how many seconds of hold time did 2 mm of felt buy, and what did it cost in grams? |
| S2 | Three at once | branch from version=v1; reagent mass=28; insulation layer=Bubble film; insulation thickness=6.0; mixing baffles=3; one change at a time=Off | The scorecard improves on four lines at once. Which single change caused the improvement in hold time? Explain why you cannot tell. |
| S3 | The regression | branch from version=v2; reagent mass=40 | Peak temperature is your best yet, but two spec meters have turned red. Name them, and decide whether this version can ever be recommended. |
| S4 | Branch and merge | branch from version=v2 with insulation layer=Foil laminate and insulation thickness=8.0; then branch from version=v2 with mixing baffles=4; then one build combining both | Branch A won on hold time and branch B on speed. Does the combined build win both? Record what stopped it. |

**Student activities.**
1. Build v1 with no insulation and run it. Record all six scorecard lines and note which spec meters are already inside their green bands.
2. With the one-change lock on, add 2 mm of felt and run v2. Record the diff ribbon and copy the delta table into your notes.
3. Turn the lock off and change three parameters at once. Record the improvement, then write one sentence explaining what you can and cannot claim from this run.
4. Push reagent mass to 40 g deliberately. Record which spec meters go red and the exact surface temperature that triggered the safety band.
5. Branch twice from your best version, optimise one branch for hold time and the other for speed, then build the combination. Record all three scorecards side by side and state which criterion refused to improve.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Scorecard | Data table | mixed | Six lines per build: peak core rise, peak surface temperature, time to 40 °C at the surface, hold time above 40 °C, total mass, unit cost |
| Spec meters | Pass-fail badge | — | Five gauges with green target bands; the bar lights whole only when all five pass |
| Temperature record | Line graph | °C vs s | Core and surface traces for the current build, with the previous version ghosted behind |
| Diff ribbon | Data table | mixed | Every parameter changed from the parent, old value against new |
| A and B delta | Data table | mixed | Line-by-line difference between any two version cards dropped in the tray |
| Attributable badge | Pass-fail badge | — | Green only when the run differs from its parent in exactly one parameter |
| Regression flag | Pass-fail badge | — | Red when a criterion that previously passed now fails |
| Version history | Data table | mixed | Exportable CSV of every node with parent, parameters, scorecard and timestamp |

**What the student should realise.**
Students think improving a design means changing things until the numbers look better. The tree shows why that fails: the build that improved on four lines at once cannot tell you which change did it, and the build with the best peak breaks the safety and mass limits. Every gain is bought from another criterion. The student should be able to say: *"I changed one thing, I can prove what it did, and I know exactly what it cost me."*

### B6.5 · Reporting the final design

**Experiment name:** Defend the Build: The Review Panel  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-PS1-6

**Theme & scene.**
A small review room with a long table. The centre of the screen is a report page laid out as empty slots on warm paper: recommendation, criteria table, evidence panels, trade-offs, limitations, next test. Down the left, an evidence drawer stands open, filled with cards from earlier work: run cards from the reagent bench, graph clippings from the probe rig, version cards from the iteration bench, and the original spec. Across the table sit three reviewers, drawn as calm, patient figures with question cards stacked in front of them: the Client, the Safety Officer and the Sceptic. Behind them a demo rig holds the chosen build in a chamber set to the client's real conditions, and a projector shows whichever evidence card is selected.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Report canvas | Structure | A4-proportioned page with six typed drop zones; each zone states the kind of content it accepts and stays hatched grey until filled | Yes: place |
| 2 | Evidence drawer | Instrument | Left-hand rail of filterable cards with tabs for runs, traces, versions and spec; a search field filters by variable, condition or date | Yes: drag |
| 3 | Run card | UI-Probe | 160 × 200 px card holding one B6.2 or B6.3 run: reagent, mass, water, ambient, repeats, peak value, uncertainty, and a thumbnail of its trace | Yes: drag |
| 4 | Trace clipping | UI-Probe | Cropped graph snippet with its axes and units preserved; refuses to be cropped in a way that hides the axis labels | Yes: drag, resize |
| 5 | Version card | UI-Probe | The B6.4 build card with its full scorecard and parameter list on the back face; flips on click | Yes: drag |
| 6 | Spec card | Structure | The compiled B6.1 criteria and constraints, pinned at the top of the criteria table zone and not editable here | No |
| 7 | Claim card | UI-Probe | Wide card with a text line and a three-position strength dial; the dial's wording changes the claim's evidence requirement | Yes: swap, drag |
| 8 | Evidence connector | Field | Drawn cord from an evidence card to a claim; turns green when the evidence type matches the claim, red with a reason label when it does not | Yes: connect |
| 9 | Reviewer avatars | Actor | Three seated figures who lean forward when they have a question; the Client watches the criteria table, the Safety Officer the surface temperature, the Sceptic the repeats and ranges | No |
| 10 | Question card stack | Actor | Generated from real gaps in the report; each card names the claim, the missing evidence and what would answer it; answering by dropping the right card clears it | Yes: place |
| 11 | Demo rig and chamber | Instrument | The recommended build between two thermocouples inside a chamber set to the client's ambient; runs live in front of the panel | Yes: swap |
| 12 | Projector screen | Overlay | Wall panel showing the currently selected evidence card at full size with its conditions printed underneath | No |
| 13 | Limitations panel | Structure | Zone headed what this test did not show; auto-suggests untested conditions such as ambient outside the tested range or a single repeat | Yes: place |
| 14 | Unsupported-claim audit | Overlay | Right-hand list of every claim with no connected evidence or with mismatched evidence, updating live | No |
| 15 | Report scorecard | Instrument | Three gauges: completeness, evidence match and confidence calibration, the last measuring whether claim strength fits the evidence behind it | No |
| 16 | Final recommendation card and timer | Instrument | Printed card summarising build, claim, evidence count and open questions, plus a presentation timer counting the review down from 5 min | Yes: place |

**How it works — the model.**
Every evidence card carries metadata: the variable measured, the site, the ambient, the number of repeats and the uncertainty. Every claim slot declares what would support it. The connector validator matches the two and refuses mismatches with a stated reason, so a claim about hold time cannot be propped up by a peak-temperature card, a safety claim needs a surface reading rather than a core reading, and any claim of better needs two cards from the same conditions. Reviewer questions are generated from actual gaps, never from a fixed list, so a report citing one repeat draws a question about spread and a report tested only at 21 °C draws a question about the client's 4 °C sideline. The live demo then runs the build at the client's ambient; if that lies outside the tested range, the sim shows the gap between the claim and the result and the calibration gauge falls.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Recommended build | Dropdown | Any saved version card from the iteration bench | Best-so-far version | — | Which build the demo rig loads and which scorecard the report inherits |
| Evidence cards attached | Drag-handle | Connect 0–12 cards to claims | 0 | count | Which claims are supported at all, and what the validator has to check |
| Claim strength | Radio | Meets the criteria / Meets them under the conditions tested / May meet them, untested | Meets the criteria | — | The evidence the validator demands, and how far the panel can push back |
| Client ambient for the demo | Slider | 0–40 | 4 | °C | Conditions the build is actually run in, which may sit outside your tested range |
| Repeats cited | Stepper | 1–5 | 1 | count | Whether an uncertainty can be quoted, and the strength of the Sceptic's questions |
| Include limitations | Toggle | On / Off | Off | — | Whether the report states what it did not test; strongly affects calibration score |
| Include trade-off table | Toggle | On / Off | Off | — | Adds the criterion-by-criterion table of what was gained and given up |
| Reviewer strictness | Radio | Low / Standard / High | Standard | — | How many generated questions the panel asks and how specific they are |
| Unsupported-claim audit | Toggle | On / Off | On | — | Shows or hides the live list of claims with no valid evidence behind them |
| Demo run length | Slider | 1–30 | 20 | min | How long the panel watches the build, and whether hold time can be shown at all |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The overclaim | evidence cards attached=1; claim strength=Meets the criteria; repeats cited=1; include limitations=Off | The Sceptic asks which run showed that and under what conditions. Which of your claims survives, and which had nothing behind it? |
| S2 | The honest report | evidence cards attached=unchanged; claim strength=Meets them under the conditions tested; include limitations=On; repeats cited=3 | You have not run a single new experiment, yet the scorecard rose. What exactly improved? |
| S3 | The ambient surprise | client ambient for the demo=4; evidence cards attached=all cards tested at 21 °C; demo run length=20 | The demo falls short of your claim. Was your evidence wrong, or was your claim about the wrong conditions? |
| S4 | Safety veto | recommended build=the highest peak version from the iteration bench; reviewer strictness=High | The Safety Officer blocks a build that beats every other version on warmth. Which single measurement did that, and can any other column outvote it? |

**Student activities.**
1. Drag your recommended version card into the report and connect at least one evidence card to every claim. Record how many connectors turned red and the reason printed on each.
2. Run the review at Standard strictness and log every question the panel asks, marking which you could answer with a card already in the drawer.
3. Change the claim strength from meets the criteria to meets them under the conditions tested. Record the change in the confidence calibration gauge and explain it in one sentence.
4. Set the client ambient to 4 °C and run the live demo for 20 min. Record the demo result beside your claim and state the size of the gap.
5. Write the limitations panel and the next-test line, then re-run the review. Record the final report scorecard and the number of unsupported claims remaining.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Report completeness | Live numeric | % of zones filled | Fraction of the six report zones holding valid content |
| Evidence match | Live numeric | score out of 100 | How well each connected card fits the claim it supports, averaged across claims |
| Unsupported claims | Data table | count and list | Every claim with no evidence or mismatched evidence, with the reason given |
| Reviewer question log | Data table | mixed | Each question, its author, the gap it targets, and whether it was answered |
| Demo result against claim | Pass-fail badge | °C and min | The live run at the client's ambient compared line by line with the written claim |
| Confidence calibration | Live numeric | score out of 100 | Falls when the claim is stronger than the evidence and when limitations are omitted |
| Trade-off table | Data table | mixed | Criterion by criterion, what the recommended build gained and what it gave up |
| Final recommendation | Data table | mixed | Exportable report: build, claim, evidence list with conditions, limitations, next test |

**What the student should realise.**
Students believe reporting is writing up a decision already made, and that a confident claim is a strong one. The panel makes that untenable: every sentence is met with which run showed that, at what ambient, with how many repeats, and the hedged claim scores higher than the bold one on identical data. Honesty is measurable here. The student should be able to say: *"I can only claim what I measured, under the conditions I measured it in."*

---

*GradeNext Smart Lab · Grade 7 Unit B · 30 experiment specifications · standard v1.0*