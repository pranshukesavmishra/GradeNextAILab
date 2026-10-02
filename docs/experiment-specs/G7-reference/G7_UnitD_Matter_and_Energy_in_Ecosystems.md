# GradeNext Smart Lab · Simulation Experiment Book
## Grade 7 · Unit D · Matter and Energy in Ecosystems

**California Integrated Science, Grade 7** · Domain: Biology / Ecology · 6 topics · 30 experiments
**NGSS performance expectations anchored:** MS-LS2-1, MS-LS2-2, MS-LS2-3, MS-LS2-4, MS-LS2-5
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
| D1.1 | Limiting resources | Which Shortage Bites First: Tomales Point | Hybrid 2D+3D | Agent-based + Data-driven model | Investigate | 18–25 min |
| D1.2 | Carrying capacity | The Island Fills Up: Foxes on Santa Cruz | Hybrid 2D+3D | Agent-based | Investigate | 18–25 min |
| D1.3 | Reading real population data | Three California Censuses, One Argument | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| D1.4 | Predicting the response to scarcity | Call It First: The Scarcity Forecast Desk | Hybrid 2D+3D | Agent-based + Data-driven model | Argue-from-data | 18–25 min |
| D1.5 | Competition for the same limiting resource | One Reef, One Ration: Urchin Against Abalone | 3D Scene | Agent-based | Investigate | 18–25 min |
| D2.1 | Producers, consumers and decomposers | The Floor That Eats: A Sierra Nutrient Ledger | 2.5D Layered | Agent-based + Fluid/thermal | Investigate | 18–25 min |
| D2.2 | From food chain to food web | Draw the Web: Monterey Kelp Forest | Hybrid 2D+3D | Data-driven model + Agent-based | Design | 18–25 min |
| D2.3 | Trophic levels | Half a Level Up: Where Omnivores Sit | Hybrid 2D+3D | Data-driven model + Agent-based | Investigate | 18–25 min |
| D2.4 | Why energy decreases at each level | Follow the Joule: Where the Energy Goes | Hybrid 2D+3D | Particle system + Agent-based | Investigate | 18–25 min |
| D2.5 | Reading an energy pyramid | Build the Pyramid, Then Break It | Hybrid 2D+3D | Data-driven model | Argue-from-data | 18–25 min |
| D3.1 | Matter cycling between organisms and the environment | The Sealed Jar: Nothing Leaves, Nothing Arrives | Hybrid 2D+3D | Agent-based + Data-driven model | Investigate | 18–25 min |
| D3.2 | Decomposers closing the loop | Rot Chamber: Who Unlocks the Nutrients | 3D Scene | Agent-based + Fluid/thermal | Investigate | 18–25 min |
| D3.3 | The carbon cycle, introduced | Carbon on Tour: Reservoirs and Fluxes | 2.5D Layered | Data-driven model + Particle system | Argue-from-data | 18–25 min |
| D3.4 | The nitrogen cycle, introduced | Under the Alfalfa: Four Microbe Crews | 3D Scene | Agent-based + Molecular | Investigate | 18–25 min |
| D3.5 | Modeling matter and energy together | The Loop and the One-Way Street | Hybrid 2D+3D | Data-driven model + Particle system | Argue-from-data | 18–25 min |
| D4.1 | Competition and predation | Chase, Lag and Crowd-Out | Hybrid 2D+3D | Agent-based + Data-driven model | Investigate | 18–25 min |
| D4.2 | Mutualism, commensalism and parasitism | The Fitness Ledger: Who Gains, Who Pays | 3D Scene | Agent-based + Data-driven model | Investigate | 18–25 min |
| D4.3 | The same pattern in very different ecosystems | Three Places, One Pattern | 2.5D Layered | Agent-based + State machine | Design | 18–25 min |
| D4.4 | Interactions that shift over time or condition | When Partners Turn: Finding the Tipping Point | Hybrid 2D+3D | State machine + Agent-based | Argue-from-data | 18–25 min |
| D4.5 | Interaction patterns and population change | Draw the Curve: From Interaction to Population | Data Dashboard | Data-driven model + State machine | Argue-from-data | 18–25 min |
| D5.1 | Physical disruptions | Fire, Flood and Slide: The Landscape Stress Test | Hybrid 2D+3D | Agent-based + Fluid/thermal | Investigate | 18–25 min |
| D5.2 | Biological disruptions | Uninvited: Invaders, Blights and a Missing Keystone | Hybrid 2D+3D | Agent-based | Investigate | 18–25 min |
| D5.3 | Constructing an argument from evidence | The Evidence Docket: Prove What Wrecked the River | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| D5.4 | Succession after a disruption | The Comeback: Ninety Years on a Burnt Slope | 2.5D Layered | State machine + Procedural geology | Investigate | 18–25 min |
| D5.5 | Short-term versus long-term change | One Year Later, Fifty Years Later | 2.5D Layered | Data-driven model | Investigate | 12–18 min |
| D6.1 | Naming ecosystem services | The Invisible Payroll: What the Land Does for Free | Data Dashboard | Data-driven model | Investigate | 12–18 min |
| D6.2 | Threats to biodiversity | Pressure Stack: Layering the Threats on a Range Map | 2.5D Layered | Field/vector + Data-driven model | Investigate | 18–25 min |
| D6.3 | Named solution categories | The Solutions Bench: Six Tools, One Watershed | Hybrid 2D+3D | Agent-based + Data-driven model | Design | 18–25 min |
| D6.4 | Evaluating competing solutions | Weights Change Winners: The Trade-off Bench | Data Dashboard | Data-driven model | Argue-from-data | 18–25 min |
| D6.5 | A biodiversity solution for a real ecosystem | Delta Commission: A Budget, a Room, and Thirty Years | Hybrid 2D+3D | Agent-based + Data-driven model | Design | 18–25 min |

---

## D1 · Resource availability and populations · MS-LS2-1

### D1.1 · Limiting resources

**Experiment name:** Which Shortage Bites First: Tomales Point  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-1

**Theme & scene.**
A high three-quarter view over the Tomales Point headland at Point Reyes: yellow-green coastal prairie running out to a grey Pacific, fog lying in the swales, the elk fence a thin dark line across the neck of the peninsula. Roughly two hundred tule elk graze as individual animals, heads down, calves tucked beside cows, a bull bugling on the ridge. Two shallow stock ponds glint; a seep darkens one gully. Coyote brush thickets throw hard afternoon shade. On the left, five vertical gauge staves labelled Forage, Water, Minerals, Shade, Space fill and drain live. The control panel docks left beneath them; a hover probe reads any animal's private hunger and thirst.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Elk cow agent | Actor | Low-poly cervid ~2.0 u nose-to-tail, tan body, darker neck ruff; walks 0.6 u/s, grazes head-down 8 s bouts; carries private hunger, thirst, salt, heat and space needs; instanced ×20–600 | Yes: drag |
| 2 | Elk bull agent | Actor | Same body 15 % larger, six-point antlers, mahogany mane; holds a rut territory disc in autumn; higher forage demand | Yes: drag |
| 3 | Elk calf agent | Actor | 0.9 u, pale dappled coat, tracks its cow within 4 u; dies first when any need is unmet | No |
| 4 | Forage tile field | Field | 8 m grid over 1,050 ha of coastal prairie; each tile holds standing biomass 0–4,000 kg/ha, drawn as grass height plus a green-to-straw colour ramp; regrows on a seasonal logistic curve | Yes: resize |
| 5 | Stock pond | Structure | Shallow ellipse basins 20–60 u across, volume 0–4,000 m³, water plane drops visibly as drunk and evaporated; cracked mud ring appears below 15 % | Yes: place |
| 6 | Seep spring | Structure | 4 u dark wet patch feeding 0.5–6 m³/day regardless of season; supports only ~12 animals/day | Yes: place |
| 7 | Mineral lick patch | Structure | 6 u scuffed pale-grey soil scar; supplies sodium; elk queue at it, one animal per 20 s | Yes: place |
| 8 | Coyote brush thicket | Structure | Clumped 3 u dark-olive shrub domes casting real shade; each thicket shelters ~8 animals from heat load | Yes: place, resize |
| 9 | Elk fence | Structure | 2.4 m woven wire on posts across the peninsula neck, 4.8 km long; a hard collider blocking emigration; can be opened at a gate or removed | Yes: swap |
| 10 | Rut territory field | Field | Invisible repulsion discs radius 60 u around each bull in autumn; caps how many bulls the headland holds | No |
| 11 | Need-state bars | Overlay | Five 12 px micro-bars floating above each selected animal: forage, water, salt, heat, space; red below threshold | No |
| 12 | Limiting-stave gauge | Overlay | Five vertical staves, tallest = most abundant; the shortest stave glows amber and is labelled "limiting now" every tick | No |
| 13 | Scarcity spotlight | Overlay | Desaturates the whole scene except the currently limiting resource, which keeps full colour | No |
| 14 | Fog drip layer | Environment | Volumetric low cloud rolling in from the west on summer mornings; adds 0.2–1.4 mm/day condensation to forage and ponds | No |
| 15 | Census drone | Instrument | Small quadcopter running a fixed transect every simulated month; produces the count the graph plots, with ±8 % sighting error | Yes: drag |
| 16 | Carcass marker | Overlay | Small bone-white pin left where an animal died, colour-tagged by cause of death | No |

**How it works — the model.**
Each elk is an agent with five independent need meters that drain at rates set by body size, season and heat. Every tick an animal moves to the nearest tile that satisfies its most urgent unmet need, consumes from that stock, and refills that meter. Stocks are finite and deplete: forage tiles lose the kilograms eaten and regrow at the productivity rate; pond volume falls by drinking plus evaporation; lick and shade have hard queue capacities. Survival is governed by the single worst-off meter, not by an average, so the population is capped by whichever resource runs out first, exactly as Liebig's law of the minimum states. Raising any other resource changes nothing measurable. The model must never show a generic "food" bar: the five stocks are separate objects with separate units, because the misconception being attacked is that animals need "enough resources" in general.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Forage productivity | Slider | 200–3,000 | 1,600 | kg/ha per season | Regrowth rate and peak height of every grass tile |
| Pond water volume | Slider | 0–4,000 | 1,200 | m³ | Starting drinking water; pond surface redraws |
| Summer fog days | Slider | 0–60 | 30 | days/season | Fog drip added to forage and ponds; slows evaporation |
| Herd starting size | Stepper | 20–600 | 300 | head | Number of elk agents instantiated |
| Mineral lick patches | Stepper | 0–6 | 2 | count | How many sodium sources exist on the headland |
| Shade thicket cover | Slider | 0–40 | 15 | % of area | Number and size of coyote brush domes; heat relief capacity |
| Fence state | Dropdown | Closed (historic) / Gate open / Fence removed | Closed (historic) | — | Whether elk may leave for Limantour range when a need fails |
| Season preset | Dropdown | Wet spring / Dry summer / Drought summer 2021 | Dry summer | — | Loads real rainfall, temperature and forage figures |
| Scarcity spotlight | Toggle | On / Off | Off | — | Greys out every resource except the limiting one |
| Playback speed | Dial | 0.5×–8× | 2× | — | Simulated days per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Green year | forage=2,400; pond=3,000; fog=45; herd=300; season=Wet spring | With everything topped up, which stave is still the shortest, and how many elk does the headland hold? |
| S2 | Drought summer 2021 | season=Drought summer 2021; pond=250; forage=900; herd=445 | Grass is still standing in places, yet elk are dying. Which stock actually ran out, and how do the carcass tags prove it? |
| S3 | Grass gone, water fine | forage=350; pond=4,000; fog=50; herd=300 | Water is unlimited here. Why does adding more of it not save a single animal? |
| S4 | Open the fence | fence=Fence removed; forage=900; pond=250; herd=445 | When animals may walk to the next range, does the shortage still limit the herd? What replaces death as the response? |

**Student activities.**
1. Run S1 for two simulated years, then record which stave the gauge labels "limiting now" in each of the four seasons. Write the four answers in a row.
2. Set pond volume to 4,000 m³ and change nothing else in S3. Record herd size after one year, then compare it with the S3 result and explain the identical number.
3. Drag ten elk onto the map to push the herd past 450. Record how many days pass before the first carcass marker appears and which cause colour it carries.
4. Place two extra mineral licks and one extra pond in the drought preset. Record herd survival, then state which single addition would have worked better and why.
5. Switch the fence to Fence removed and re-run S2. Record emigration count and final herd size, and describe what limits the population once escape is possible.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Herd size | Line graph | head | Census-drone count per simulated month, with the ±8 % sighting band shaded |
| Resource stocks | Line graph | mixed | Four traces: forage kg/ha, pond m³, lick queue length, shade slots free |
| Limiting resource log | Data table | — | One row per month naming the shortest stave and its value |
| Cause of death tally | Bar chart | count | Starvation, dehydration, heat, salt deficiency, old age |
| Individual need probe | Live numeric | % | The five meters of the animal under the cursor, updated each tick |
| Emigration count | Counter | head | Animals that left through an open gate or removed fence |
| Run comparison | Data table | mixed | Exportable CSV: settings in, final herd size and limiting resource out |

**What the student should realise.**
Students believe a population is limited by "not enough resources" as a general shortage, so adding any resource should help. Here four stocks can sit full while one empties, and the herd falls to the level the emptiest one allows. Pouring in water when grass is the problem changes nothing measurable. The student should be able to say: *"A population is set by whichever single resource runs short first, and topping up the others does nothing."*

### D1.2 · Carrying capacity

**Experiment name:** The Island Fills Up: Foxes on Santa Cruz  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-1

**Theme & scene.**
A slow orbit above Santa Cruz Island: chaparral ridges in grey-green, oak groves in the canyons, fog pooling on the north shore, the Santa Barbara Channel a hard blue rim. Cat-sized island foxes trot along ridgelines in ones and twos, each with a faint energy ring around it. Deer mice glitter as small pale sparks in the scrub; toyon and manzanita bushes carry countable red fruit clusters that empty as they are eaten. Dens show as dark holes under rock outcrops. The right-hand panel holds two graphs stacked: fox number against time, and growth per fox against fox number. Nothing on screen is labelled with a capacity figure.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Island fox agent | Actor | 0.5 u body, rust-and-grey coat, black tail tip; trots 0.9 u/s along ridge paths; carries energy 0–100, age, sex and a den claim | Yes: drag |
| 2 | Fox pup | Actor | 0.25 u, woolly grey; appears in litters of 1–5 in spring, stays within 6 u of the den for 60 days | No |
| 3 | Energy ring | Overlay | Thin arc around each fox, green above 60, amber 30–60, red below 30; fox dies at 0 | No |
| 4 | Deer mouse stock | Field | Per-cell prey density 0–140 mice/ha drawn as pale sparks; regrows logistically toward its own ceiling; depleted where foxes hunt | Yes: resize |
| 5 | Toyon and manzanita shrub | Structure | 2 u domed shrubs with 0–40 instanced fruit spheres, scarlet; fruit count drops as eaten and refills on a seasonal mast schedule | Yes: place |
| 6 | Insect patch | Field | Jerusalem cricket and beetle density under leaf litter, 0–60 units/ha; low-value, always-available food floor | No |
| 7 | Den site | Structure | Dark 0.6 u burrow mouth under a rock outcrop; a fixed number exist; only a fox holding one may breed | Yes: place |
| 8 | Chaparral terrain tile | Environment | 250 km² heightfield split into 8 ha cells with slope and vegetation type; sets travel cost and mouse regrowth | No |
| 9 | Golden eagle | Actor | 1.8 u wingspan raptor circling at altitude; stoops on a fox every N minutes when present; historically the cause of the 1990s crash | Yes: place |
| 10 | Feral pig herd | Actor | 1.2 u dark bodies rooting in oak groves; piglets subsidise eagles, raising eagle numbers without any fox involvement | Yes: place |
| 11 | Energy budget field | Field | Invisible per-agent ledger: intake minus travel cost minus basal cost per day; drives the energy ring | No |
| 12 | Radio-collar census | Instrument | Annual mark-recapture routine returning an estimate with a 90 % interval; this is the number graphed | No |
| 13 | Growth-per-fox plot | Overlay | Scatter of annual per-capita growth rate against that year's fox number; the descending line and its zero crossing are the point of the sim | No |
| 14 | Overshoot marker | Overlay | Red bracket drawn on the time graph wherever fox number exceeds the level the food stock can sustain | No |
| 15 | Carcass and cause tag | Overlay | Bone-white pin colour-coded starvation, predation, age, disease | No |
| 16 | Prey-stock gauge | Instrument | Island-wide totals for mice, fruit and insects as three thin horizontal bars above the graphs | No |

**How it works — the model.**
No carrying capacity is stored anywhere in the code. Each fox spends energy on basal metabolism and travel and gains it by eating whatever prey cell it reaches; prey stocks are real depletable quantities that regrow at their own rates. A fox above 70 energy that holds a den breeds; a fox at 0 dies. When there are few foxes, prey is thick, energy gain is easy, litters survive and numbers climb steeply. As foxes accumulate they eat the prey stock down, per-fox intake falls, litters fail and deaths rise until births equal deaths. The plateau the student sees is that balance point, and the growth-per-fox plot falls linearly to zero at exactly that number. The failure to avoid is drawing a smooth S-curve from an equation: the curve must be the emergent census of individuals, noisy, and capable of overshooting and crashing.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Starting foxes | Stepper | 2–400 | 10 | foxes | How many agents exist at year zero |
| Island area in use | Slider | 10–250 | 250 | km² | Terrain cells available; fewer cells means less total prey |
| Mouse regrowth rate | Slider | 0.1–1.2 | 0.6 | per year | How fast the deer mouse stock refills after being hunted |
| Fruit crop | Dropdown | Failed / Poor / Normal / Mast year | Normal | — | Fruit spheres per shrub and their refill schedule |
| Den sites | Stepper | 5–400 | 220 | count | Breeding slots; a structural cap independent of food |
| Litter size | Slider | 1–5 | 3 | pups | Pups born per denning female per spring |
| Golden eagles | Stepper | 0–8 | 0 | birds | Predation pressure; each bird removes foxes at a set rate |
| Feral pigs | Toggle | Present / Removed | Removed | — | Whether an eagle food subsidy exists on the island |
| Drought severity | Slider | 0–80 | 0 | % cut to regrowth | Multiplier applied to all prey and fruit regrowth |
| Playback speed | Dial | 0.5×–10× | 3× | — | Simulated years per real minute |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Ten foxes, empty island | foxes=10; area=250; mouse regrowth=0.6; eagles=0 | Sketch the shape of the population curve. At what number does it stop rising, and what stopped it? |
| S2 | Dropped in at the top | foxes=400; area=250; mouse regrowth=0.6 | Starting far above the plateau, what happens in the first three years, and why does the population fall below the plateau before settling? |
| S3 | Half the mice | mouse regrowth=0.3; foxes=10; fruit=Normal | Predict the new plateau before running. By what fraction did it move, and did the shape of the curve change? |
| S4 | Eagles and pigs, 1994 | eagles=4; pigs=Present; foxes=1,400 scaled; drought=0 | The island held foxes easily for decades. Why does the population now crash to double figures with food untouched? |

**Student activities.**
1. Run S1 for 40 simulated years. Record fox number at years 2, 5, 10, 20 and 40, then draw the curve from your five points before looking at the graph.
2. Read the prey-stock gauge at year 2 and again at year 40. Record both, and state in one sentence what the foxes did to the mice.
3. Halve the mouse regrowth rate and re-run from 10 foxes. Record the new plateau and calculate the ratio between the two plateaus.
4. Set den sites to 30 with mouse regrowth back at 0.6. Record the plateau and explain why plenty of food no longer sets the ceiling.
5. Read the growth-per-fox plot and record the fox number at which the line crosses zero. Compare it with the plateau on the time graph.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Fox population | Line graph | foxes | Annual mark-recapture estimate with its 90 % interval band |
| Prey stocks | Line graph | units/ha | Three traces: deer mice, fruit, insects, island-wide |
| Growth per fox vs number | Line graph | per year vs foxes | Scatter plus fitted line; the zero crossing is the emergent capacity |
| Measured plateau | Live numeric | foxes | Mean of the last ten years, reported only after the run ends |
| Mean fox energy | Live numeric | 0–100 | Population average, updated yearly |
| Deaths by cause | Bar chart | count/year | Starvation, predation, age, disease |
| Overshoot flag | Pass-fail badge | — | Amber whenever numbers exceed what current prey can sustain |
| Run archive | Data table | mixed | Exportable CSV of settings and resulting plateau for every run |

**What the student should realise.**
Students think carrying capacity is a fixed property of a place, like a stadium's seat count. Here the plateau is never entered as a setting: it appears because foxes eat the prey stock down until births match deaths, and it moves whenever prey regrowth, fruit crops, den sites or drought change. The same island holds different numbers in different years. The student should be able to say: *"Carrying capacity is not a number the island has. It is where growth runs out, and it moves when resources move."*

### D1.3 · Reading real population data

**Experiment name:** Three California Censuses, One Argument  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-1

**Theme & scene.**
A wide dark-slate analyst's desk. Left, three dataset cards stacked like field notebooks: an island fox card with a fox photograph and the Channel Islands in silhouette, a tule elk card showing the Tomales Point fence line, a sea otter card with a raft of otters in kelp. Centre, a large plot canvas, pale grid, one bold data series in warm amber with open circles for each survey year and a translucent uncertainty ribbon behind it. Right, a claim-builder tray of blank cards and an evidence basket. A small California map inset marks the survey area for whichever card is loaded. Annotation pins hang below the time axis waiting to be opened.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Dataset card — island fox | Instrument | Notebook tile holding per-island counts 1993–2016 for San Miguel, Santa Rosa and Santa Cruz; loads on drag to the canvas | Yes: drag |
| 2 | Dataset card — tule elk | Instrument | Tomales Point herd counts 1978–2023, annual, from the reintroduction of ten animals through the drought die-off | Yes: drag |
| 3 | Dataset card — sea otter | Instrument | California spring survey index 1985–2023, three-year running mean supplied alongside raw counts | Yes: drag |
| 4 | Plot canvas | Overlay | 900×520 px axes; year on x, count or density on y; supports two series at once with paired axes | Yes: resize |
| 5 | Data point marker | Overlay | Open 7 px circle per survey year; hovering shows year, count, method and observer note | No |
| 6 | Uncertainty ribbon | Overlay | Translucent band around each series showing the published interval; collapses to a line when the toggle is off | No |
| 7 | Annotation pin | Overlay | Twelve draggable pins carrying real events: golden eagles arrive 1994, captive breeding begins 1999, last releases 2004, delisting 2016, sea star wasting 2013, marine heatwave 2014, drought 2020–21 | Yes: drag, place |
| 8 | Smoothing engine | Field | Running-mean filter of width 1–5 years applied live; draws the smoothed line over the raw points | No |
| 9 | Model overlay curve | Overlay | Selectable dashed curve: none, exponential, logistic, or logistic with a step event; fitted parameters shown beside it | Yes: swap |
| 10 | Capacity guide line | Overlay | Horizontal dashed line the student drags to their estimate of the plateau; reports the value it sits at | Yes: drag |
| 11 | Residual strip | Overlay | Thin panel under the plot showing data minus model per year as up or down bars | No |
| 12 | Claim card | UI-Probe | Blank card with a dropdown claim stem and a slot for three evidence chips | Yes: place |
| 13 | Evidence chip | UI-Probe | Chip minted by clicking any data point, pin or measured value; carries its number and source | Yes: drag |
| 14 | Claim scorer | Instrument | Checks whether the chips in a claim actually support its stem; returns green, amber or red with a written reason | No |
| 15 | Method note tooltip | Overlay | Explains how each series was collected: mark-recapture grids, ground counts from the fence line, shore and aerial otter counts | No |
| 16 | California map inset | Environment | 240 px orthographic state map with the active survey area highlighted and a scale bar | No |

**How it works — the model.**
Nothing here is invented. Each card loads a stored survey series with its published years, values, method and interval, and every drawn element is derived from those numbers. The smoothing engine recomputes a running mean of the chosen width each time the stepper moves, so the student can watch a jagged otter series turn into a trend and back again. The model overlay fits its curve to the visible window only, reporting growth rate and, for logistic, the plateau it inferred; residuals are the honest difference between fit and data. The claim scorer parses the selected stem, checks the chips against the series, and rejects claims whose evidence is off-topic, out of window, or contradicted. The sim must never redraw a data point to fit the model, and must never hide a survey year with a wide interval, because the skill being taught is reading data that argues with you.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Dataset | Dropdown | Island fox (San Miguel) / Island fox (Santa Cruz) / Tule elk (Tomales Point) / Sea otter (California) | Island fox (San Miguel) | — | Loads a different real series, map inset and method notes |
| Second series | Dropdown | None / any of the four above | None | — | Adds a paired series on a second y-axis for comparison |
| Year window | Timeline scrubber | 1978–2023 | Full range | year | Which survey years the plot and any fit use |
| Smoothing window | Stepper | 1–5 | 1 | years | Width of the running mean drawn over the raw points |
| Uncertainty ribbon | Toggle | On / Off | On | — | Shows or hides the published interval around each point |
| Model overlay | Dropdown | None / Exponential / Logistic / Logistic + event | None | — | Which curve is fitted to the visible window |
| Capacity guide | Drag-handle | 0–3,600 | Off | animals | Student's own estimate of the plateau, reported live |
| Y-axis quantity | Radio | Total count / Density per km² | Total count | — | Rescales using the surveyed area of the active dataset |
| Annotation pins | Toggle | On / Off | On | — | Reveals the dated real events under the time axis |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The fox that nearly went | Dataset=Island fox (San Miguel); window=1993–2016; pins=On; overlay=None | The series falls from hundreds to fifteen and then climbs again. Which two pins sit at the turning points, and what does each say? |
| S2 | A herd against a fence | Dataset=Tule elk (Tomales Point); window=1978–2023; overlay=Logistic; capacity guide=drag | Where does the herd first stop rising, and does the 2020–21 fall look like normal wobble or something new? |
| S3 | Noise or trend | Dataset=Sea otter (California); smoothing=1 then 3 then 5; ribbon=On | At a one-year window the index goes up and down constantly. With a three-year mean, what single sentence describes 1985–2023? |
| S4 | Two islands, one threat | Dataset=Island fox (San Miguel); second series=Island fox (Santa Cruz); window=1993–2010 | The two islands crash at different times and different depths. What does that tell you about the cause? |

**Student activities.**
1. Load the San Miguel fox series and record the lowest count, its year, and the two nearest annotation pins.
2. Set the smoothing window to 1, then 3, then 5 on the otter series. Record the 2000 value each time and state which width you would report and why.
3. Drag the capacity guide to where the elk herd levels off and record the number, then compare it with the plateau the logistic fit reports.
4. Build a claim card reading "This population was limited by a resource shortage" and fill it with three evidence chips. Record the scorer's colour and its written reason.
5. Compare the two fox islands on shared axes and record, for each island, the first year of decline and the year recovery began.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Population series | Line graph | animals | The loaded survey values with their intervals and method markers |
| Smoothed trend | Line graph | animals | Running mean of the chosen width, redrawn live |
| Fitted parameters | Live numeric | mixed | Growth rate per year and inferred plateau for the selected overlay |
| Residuals | Bar chart | animals | Data minus model per year, positive above the axis |
| Capacity guide value | Live numeric | animals | Where the student's dashed line currently sits |
| Claim score | Pass-fail badge | — | Green, amber or red on each claim card with the reason text |
| Evidence log | Data table | mixed | Every chip minted, with its value, year and source dataset |
| Export | Data table | mixed | CSV of the visible window, raw and smoothed, for use outside the sim |

**What the student should realise.**
Students treat a population graph as a picture of what happened, and read every wiggle as a real event. Working with three genuine California series, they find intervals wide enough to swallow a wiggle, a smoothing choice that changes the story, and a crash whose cause is a pin rather than a shortage. The student should be able to say: *"Before I say a population changed, I have to check whether the survey could tell the difference."*

### D1.4 · Predicting the response to scarcity

**Experiment name:** Call It First: The Scarcity Forecast Desk  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-1

**Theme & scene.**
A forecaster's desk split down the middle. On the right, a live 3D window into one California ecosystem: a Monterey kelp forest with otters cracking urchins in the canopy shadows, or the Santa Cruz Island scrub, or the Tomales Point headland. On the left, a broad prediction chart, pale on charcoal, with the population history drawn solid up to today and empty grid beyond it. A dashed forecast spline waits with six draggable control points, and a translucent tolerance ribbon follows it. Below sits a deck of twelve mechanism cards, face up, each naming one way a population can answer a shortage. A red event marker on the timeline shows when the scarcity will hit.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Ecosystem window | Environment | 3D viewport, 620×620 px, rendering whichever system is loaded with live agents at 1 frame per simulated day | Yes: drag (camera) |
| 2 | Sea otter agent | Actor | 1.3 u body, dark brown, floats on its back with an urchin on its chest; forages in dives, switches prey when urchins thin | No |
| 3 | Purple urchin agent | Actor | 0.15 u spiny hemisphere, violet; grazes kelp holdfasts; survives long fasts by shrinking gonads | No |
| 4 | Bull kelp stipe | Structure | 8–20 u swaying stipes with a gas float and blade fan, amber-brown; count falls as urchins graze and rises with nutrient upwelling | No |
| 5 | Prediction spline | UI-Probe | Dashed forecast line through six draggable control points spanning the forecast window | Yes: drag |
| 6 | Tolerance ribbon | Overlay | Band of adjustable half-width around the spline; the truth curve must sit inside it to score | Yes: resize |
| 7 | Mechanism card deck | UI-Probe | Twelve cards: fewer births, more deaths, emigration, diet switch, smaller bodies, delayed breeding, den or territory loss, disease spread, predator switches prey, cannibalism, dormancy, no change | Yes: place |
| 8 | Event injector | Instrument | Timeline marker the student drags to set when scarcity starts; carries type, severity and duration | Yes: drag |
| 9 | Resource stock gauge | Instrument | Vertical bar for the scarce resource in its own unit: kelp stipes/m², mice/ha, m³ of pond water | No |
| 10 | Truth curve | Overlay | Solid line drawn only after Run, produced by the same agent engine used in D1.1 and D1.2 | No |
| 11 | Lag marker | Overlay | Bracket between the event start and the first month the population changes measurably | No |
| 12 | Per-capita rate panel | Overlay | Two small traces, births per individual and deaths per individual, that move before the total does | No |
| 13 | Residual bars | Overlay | Prediction minus truth per month, drawn under the chart | No |
| 14 | Forecast scorer | Instrument | Scores direction, depth, lag and recovery separately, plus the mechanism cards played, and prints a written verdict | No |
| 15 | Replay scrubber | UI-Probe | Timeline handle that steps the 3D window back and forth so the student can watch what the agents did during the drop | Yes: drag |
| 16 | Locked-forecast seal | Overlay | Small padlock that greys the spline once Run is pressed, so a prediction cannot be edited after the fact | No |

**How it works — the model.**
The student commits first. They shape a forecast spline, choose a ribbon width, and play up to three mechanism cards; pressing Run seals all of it. The engine then runs the same individual-based population model used elsewhere in this topic, with the chosen resource stock cut by the chosen severity for the chosen duration. Populations do not respond instantly: individuals draw down body reserves, then births fail, then deaths rise, so the total lags the resource by weeks to a season, and the per-capita panel moves first. Scoring is component-wise, so a student who gets the direction right but the timing wrong is told exactly that. The engine must not tune itself toward the prediction, and the truth curve must carry its own demographic noise, because the lesson is that a good forecast is one that survives an honest run.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| System | Dropdown | Monterey kelp forest / Santa Cruz Island fox / Tomales Point elk | Monterey kelp forest | — | Loads a different ecosystem, agent set and 3D scene |
| Scarce resource | Dropdown | Kelp / Deer mice / Fruit crop / Drinking water / Den sites | Kelp | — | Which stock the event cuts; gauge relabels and re-units |
| Event severity | Slider | 0–95 | 60 | % cut to the stock | How deep the shortage goes |
| Event start | Timeline scrubber | Month 6–36 | Month 12 | month | When the shortage begins |
| Event duration | Slider | 1–36 | 12 | months | How long the stock stays suppressed before recovering |
| Recovery | Toggle | Stock recovers / Stays low | Stock recovers | — | Whether the resource returns after the event |
| Tolerance ribbon width | Slider | 5–40 | 20 | % of population | How generous the scoring band is |
| Mechanism cards played | Multi-select | The twelve deck cards, maximum three | None | — | The responses the student commits to before running |
| Forecast horizon | Stepper | 12–60 | 36 | months | How far past today the prediction and the run extend |
| Playback speed | Dial | 0.5×–6× | 2× | — | Simulated months per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A shallow dip | system=Monterey kelp forest; resource=Kelp; severity=30; duration=6; recovery=Stock recovers | Predict the otter and urchin curves. Does a shallow, short shortage leave a permanent mark? |
| S2 | The kelp does not come back | severity=85; duration=36; recovery=Stays low; horizon=60 | Predict the depth of the fall and where the population settles. Why does it settle above zero rather than dying out? |
| S3 | Two years of drought on the island | system=Santa Cruz Island fox; resource=Deer mice; severity=70; duration=24 | Predict the lag. How many months pass between the mouse crash and the fox count falling? |
| S4 | Take away the dens, not the food | system=Santa Cruz Island fox; resource=Den sites; severity=80; duration=24 | With food untouched, predict which mechanism card the model plays. Does the shape differ from S3? |

**Student activities.**
1. Drag the six control points to draw your forecast for S1 before running anything. Record the lowest value your spline reaches and the month it happens.
2. Play up to three mechanism cards and record which you chose. After the run, record which the model actually used.
3. Run S1 and record the scorer's four component results: direction, depth, lag and recovery.
4. Use the replay scrubber to step back into the month the drop began and record what the per-capita panel was doing before the total moved.
5. Repeat your best forecast in S3 with the ribbon width cut to 5 %. Record the new score and explain what a narrow ribbon actually claims.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Forecast vs truth | Line graph | animals | Sealed dashed prediction, ribbon, and the solid run outcome on one axis pair |
| Component score | Pass-fail badge | — | Four badges: direction, depth, lag, recovery, each green or red with a reason |
| Mechanism match | Data table | — | Cards played beside the mechanisms the engine actually invoked, with counts |
| Response lag | Live numeric | months | Gap between event start and the first month outside normal variation |
| Per-capita birth and death rates | Line graph | per individual per month | The two traces that move before the population total does |
| Resource stock | Line graph | stock unit | The scarce resource in its own units, with the event window shaded |
| Residuals | Bar chart | animals | Prediction minus truth per month across the horizon |
| Forecast log | Data table | mixed | Exportable CSV of every sealed forecast, its settings and its four scores |

**What the student should realise.**
Students expect a population to drop the moment its food does, and to drop to zero if the shortage is severe. Sealed forecasts scored against an honest run show a lag of weeks to months, a fall that stops at a new lower level, and responses other than death: fewer births, smaller bodies, animals leaving. The student should be able to say: *"A shortage does not kill a population instantly. It changes births, deaths and movement, and the numbers follow later."*

### D1.5 · Competition for the same limiting resource

**Experiment name:** One Reef, One Ration: Urchin Against Abalone  
**Render mode:** 3D Scene  
**Simulation engine:** Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-1

**Theme & scene.**
A shallow Monterey reef seen from just above the rock, camera low so the animals are at eye level. Granite benches are furred with coralline algae in dusty pink, cut by crevices and surge channels. Purple urchins sit in shallow pits with their spines fanned; red abalone clamp the rock in the shadows, shells crusted, muscular feet gripping. Torn blades of giant kelp drift in on a slow surge and settle: this is the food, and there is a countable amount of it. Bubbles rise, light shafts wander. A stock gauge on the left shows drift kelp in grams per square metre; two population counters, violet and red, run beneath it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Purple urchin agent | Actor | 0.08 u test with ~60 instanced spines, violet; creeps 0.02 u/s on tube feet; traps drifting kelp with spines; carries gut fullness and body condition | Yes: drag |
| 2 | Red abalone agent | Actor | 0.18 u oval shell, brick-red with respiratory pores, cream foot; moves 0.01 u/s; traps drift kelp under the shell edge; condition drives shell growth | Yes: drag |
| 3 | Drift kelp blade | Particle | 0.4–1.2 u torn amber blades that arrive on the surge, tumble, then settle and are consumed gram by gram; count set by supply rate | No |
| 4 | Attached giant kelp holdfast | Structure | 0.5 u rooted claw of haptera with a stipe rising out of frame; a second, harder-to-reach food source only urchins can attack | Yes: place |
| 5 | Coralline crust layer | Environment | Pink lithified algal veneer on all rock; grazed patches turn chalk-white, marking a developing barren | No |
| 6 | Crevice refuge | Structure | Dark 0.3 u rock slots; a fixed number; abalone inside are safe from otters and lose less energy to surge | Yes: place |
| 7 | Sea otter agent | Actor | 1.3 u forager arriving on a schedule; selects the largest visible urchin, ignores sheltered abalone; removes prey and leaves shell fragments | Yes: place |
| 8 | Drift supply emitter | Field | Invisible upstream line releasing blades at the set grams per square metre per day; pulsed with a swell cycle | No |
| 9 | Resource stock field | Field | Per-cell grams of settled drift kelp, depleted by grazing, replenished by the emitter, decaying at 3 % per day | No |
| 10 | Body condition ring | Overlay | Ring around each animal, green to red, showing reserves; abalone shells visibly thin and urchin tests visibly shrink at low condition | No |
| 11 | Starvation threshold marker | Overlay | Two horizontal lines on the stock gauge showing the ration each species needs to break even | No |
| 12 | Barren extent overlay | Overlay | False-colour wash marking rock where coralline has been grazed white, with a live percentage | No |
| 13 | Shell fragment litter | Structure | Cracked test and shell debris accumulating where animals died, tagged by species and cause | No |
| 14 | Quadrat sampler | Instrument | Draggable 1 m² frame that counts both species and weighs drift kelp inside it | Yes: drag |
| 15 | Population counter pair | Instrument | Two live counts plus a stacked area trace of both species over time | No |
| 16 | Surge current field | Field | Oscillating flow vector driving blade transport and adding an energy cost to any animal not in a crevice | No |

**How it works — the model.**
Both species eat the same settled drift kelp, and the supply arriving each day is finite. Every tick, each animal grazes from its cell, pays a metabolic cost, and updates its condition; above a growth threshold it reproduces, at zero condition it dies. Because both draw on one stock, more of either species drives the standing kelp down for both. The species that can still break even on the thinner ration keeps growing while the other keeps shrinking, so it drives the stock below its rival's threshold and the rival disappears: competitive exclusion emerges without any rule that says "urchins beat abalone". Coexistence appears only when the tie to one resource is broken, by attached kelp that only urchins can reach, by crevices that shelter abalone, or by otters cropping urchins. The engine must never remove a species by decree.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Drift kelp supply | Slider | 0–60 | 22 | g/m² per day | Blades released by the emitter; the whole shared ration |
| Starting purple urchins | Stepper | 0–400 | 60 | per 100 m² | Urchin agents instantiated at t=0 |
| Starting red abalone | Stepper | 0–120 | 40 | per 100 m² | Abalone agents instantiated at t=0 |
| Urchin break-even ration | Slider | 0.2–4.0 | 0.6 | g/day per animal | Food an urchin needs to hold condition; sets its survival floor |
| Abalone break-even ration | Slider | 0.5–8.0 | 2.4 | g/day per animal | Food an abalone needs to hold condition |
| Attached kelp | Toggle | Present / Absent | Absent | — | Adds a second food source only urchins can reach |
| Crevice refuges | Stepper | 0–60 | 10 | count | Shelter slots that cut abalone energy cost and hide them from otters |
| Sea otters | Stepper | 0–4 | 0 | otters | Predators that crop the largest urchins only |
| Water temperature | Slider | 9–20 | 13 | °C | Metabolic costs for both species and drift decay rate |
| Playback speed | Dial | 0.5×–8× | 3× | — | Simulated days per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Fair start, one food | supply=22; urchins=60; abalone=40; attached=Absent; otters=0; refuges=0 | Both start healthy on the same reef. After three simulated years, which species is left, and what number on the stock gauge explains it? |
| S2 | Outnumbered but tougher | urchins=5; abalone=100; supply=22; attached=Absent | The urchins begin rare. Do they still take over, and what does starting number actually decide? |
| S3 | Two different foods | attached=Present; supply=22; urchins=60; abalone=40 | Give urchins something abalone cannot eat. Do both species now persist, and what happened to the drift kelp level? |
| S4 | Otters return to the reef | otters=2; attached=Absent; supply=22; urchins=60; abalone=40 | With a predator eating only urchins, which species survives that would not have? Is that competition or predation? |

**Student activities.**
1. Run S1 for three simulated years and record both counts at years 0, 1, 2 and 3, plus the drift kelp stock at the end.
2. Record each species' break-even line from the stock gauge, then state which line the final stock sits below.
3. Set urchins to 5 and abalone to 100, re-run, and record whether the outcome changes. Write one sentence on what starting number does and does not decide.
4. Turn attached kelp on and re-run. Record both final counts and the final drift kelp stock, and compare that stock with S1.
5. Place two otters with attached kelp off. Record final counts, then argue in two sentences whether abalone survived because of the otters or because of the kelp.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species counts | Line graph | animals per 100 m² | Two traces, violet and red, from a monthly quadrat census |
| Drift kelp stock | Line graph | g/m² | Standing food, with both break-even thresholds drawn as horizontal lines |
| Mean body condition | Live numeric | 0–100 | Population average per species, updated weekly |
| Barren extent | Live numeric | % of rock | Fraction of coralline crust grazed white |
| Deaths by cause | Bar chart | count | Starvation, predation, surge dislodgement, per species |
| Quadrat sample | Data table | mixed | Counts and kelp weight from wherever the student drops the frame |
| Outcome badge | Pass-fail badge | — | Reports Exclusion or Coexistence at the end of each run, with which species won |
| Run archive | Data table | mixed | Exportable CSV: settings in, both final counts and outcome out |

**What the student should realise.**
Students think competition is a fight, decided by size, aggression or who got there first. Nothing here fights, and starting numbers do not decide the winner. The species that can still break even on the thinner ration eats the shared stock down past what the other needs, and the other simply starves. The student should be able to say: *"Two species cannot live on one limiting resource unless something splits them apart, and the one that survives is the one that needs less."*

## D2 · Food webs and energy flow · MS-LS2-3

### D2.1 · Producers, consumers and decomposers

**Experiment name:** The Floor That Eats: A Sierra Nutrient Ledger  
**Render mode:** 2.5D Layered  
**Simulation engine:** Agent-based + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A cutaway of a Sierra Nevada mixed-conifer forest, sliced vertically so half the screen is air and half is soil. Above the cut, ponderosa pine trunks in cinnamon plates, sugar pine boughs, bracken fern and a scatter of ceanothus; sunlight comes down in slanted dusty shafts. Below the cut, a soil profile in three bands: brown needle litter on top, dark crumbly humus beneath, pale mineral soil at the bottom, threaded with white fungal strands and shifting mites. A chickaree carries a cone along a branch; a black-tailed deer browses. Right of the scene, a vertical nutrient ledger shows three tanks: litter, soil nitrogen, living biomass.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Ponderosa pine | Actor | 14 u trunk with plated cinnamon bark and needle bundles; grows only when soil nitrogen and light are both above threshold; drops litter each autumn | Yes: place |
| 2 | Bracken fern and ceanothus | Actor | 0.8–2 u understorey clumps; fast-growing producers that respond visibly within one simulated season | Yes: place |
| 3 | Sunlight photon particles | Particle | Thin gold streaks falling at 60°, absorbed on contact with any green surface; density set by the canopy gap slider | No |
| 4 | Chickaree squirrel | Actor | 0.3 u rust-and-grey agent; eats cones and fungi; leaves droppings that enter the litter tank | Yes: drag |
| 5 | Black-tailed deer | Actor | 1.6 u browser cropping fern and ceanothus tips; removes living tissue, returns dung | Yes: drag |
| 6 | Needle litter layer | Structure | Stackable 2D strata of brown needles above the soil line; thickness in centimetres is a live state variable and visibly grows | No |
| 7 | Fungal hyphae mat | Actor | Branching white filament network that spreads cell by cell through litter, thinning it; growth rate set by moisture and temperature | Yes: place |
| 8 | Turkey-tail bracket fungi | Structure | Banded 0.3 u fruiting shelves on fallen logs; appear only where hyphae density is high; visible marker of decomposition | No |
| 9 | Millipede and springtail agents | Actor | 0.05 u detritivores shredding needles into fragments, which raises the surface area available to hyphae | Yes: place |
| 10 | Soil bacteria field | Field | Invisible per-cell population converting shredded litter into plant-available nitrogen at a temperature-dependent rate | No |
| 11 | Soil nitrogen stock | Field | Per-cell nitrogen in kg/ha, drawn as a blue saturation wash in the mineral band; drained by plant uptake, refilled by decomposers | No |
| 12 | Carbon dioxide plume | Particle | Faint grey wisps leaving every respiring organism, including hyphae and bacteria; density proportional to respiration rate | No |
| 13 | Fallen log | Structure | 6 u downed trunk that decays over simulated decades, hosting hyphae, brackets and invertebrates | Yes: place |
| 14 | Role tag overlay | Overlay | Toggleable badge over every organism reading Producer, Consumer or Decomposer, with its carbon source named beneath | No |
| 15 | Nutrient ledger tanks | Instrument | Three vertical tanks, litter, soil nitrogen and living biomass, in kg/ha, that must sum to a constant unless fire or export is on | No |
| 16 | Soil core probe | Instrument | Draggable corer returning litter depth, humus depth and nitrogen at the sampled point | Yes: drag |

**How it works — the model.**
Every organism is tagged by where its carbon comes from, and the tag is enforced by the engine rather than written on a label. Producers take carbon from photon particles and nitrogen from the soil stock. Consumers take carbon by removing living tissue from another agent. Decomposers take carbon only from dead material in the litter layer, and are the sole process that converts litter back into soil nitrogen. Litter grows by leaf fall, dung and death, and shrinks only through detritivore shredding and hyphal and bacterial breakdown, both scaled by moisture and temperature. Nutrients therefore circulate while energy leaves as carbon dioxide from every respiring agent, including the fungi. If decomposers are removed, the litter tank climbs, the soil nitrogen tank drains, and producers stop growing within a few simulated years. The failure to avoid is treating decomposers as tidy-up crew rather than as the return path.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Decomposer abundance | Slider | 0–100 | 70 | % of normal | Hyphal spread rate and bacterial activity across the soil |
| Detritivore count | Stepper | 0–500 | 200 | animals/m² | Millipedes and springtails shredding needles into fragments |
| Litter input | Slider | 0–6,000 | 2,800 | kg/ha per year | Needle and branch fall from the canopy each autumn |
| Soil moisture | Slider | 5–45 | 22 | % by volume | Decomposition rate; below 10 % breakdown nearly stops |
| Soil temperature | Slider | 0–30 | 12 | °C | Bacterial and fungal rates; doubles roughly every 10 °C |
| Herbivore load | Stepper | 0–20 | 6 | animals/ha | Deer and squirrels removing living tissue |
| Canopy gap | Slider | 0–80 | 25 | % open sky | Photon density reaching the understorey |
| Fire | Dropdown | None / Low-intensity ground fire / Stand-replacing | None | — | Burns litter, returns nutrients fast, removes agents |
| Starting soil nitrogen | Slider | 200–5,000 | 2,200 | kg/ha | Size of the nutrient tank at t=0 |
| Playback speed | Dial | 1×–20× | 6× | — | Simulated years per real minute |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A working floor | decomposers=70; detritivores=200; moisture=22; fire=None | Sort every organism by where its carbon comes from. Which group is the only one that puts nitrogen back? |
| S2 | Switch off the decomposers | decomposers=0; detritivores=0; litter input=2,800 | Run 30 simulated years. Record litter depth and soil nitrogen. Why do the pines stop growing when nothing ate them? |
| S3 | Too dry to rot | moisture=7; temperature=8; decomposers=70 | Decomposers are present but barely working. Does the ledger behave more like S1 or S2, and what does that say about rate? |
| S4 | Ground fire in the Sierra | fire=Low-intensity ground fire; decomposers=70; litter input=2,800 | Fire returns nutrients in minutes. Compare its effect on the three tanks with 30 years of fungal decay. |

**Student activities.**
1. Turn the role tag overlay on and record every organism in three columns: Producer, Consumer, Decomposer. Write each one's carbon source beside it.
2. Set decomposers and detritivores to 0. Run 30 simulated years and record litter depth and soil nitrogen at years 0, 10, 20 and 30.
3. Drag the soil corer to three different points and record litter depth, humus depth and nitrogen at each.
4. Restore decomposers to 70 % and record how many simulated years pass before pine growth restarts.
5. Run the low-intensity fire preset and record the change in all three ledger tanks in the first simulated month.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Litter depth | Live numeric | cm | Thickness of the needle layer at the corer position, updated yearly |
| Nutrient ledger | Line graph | kg/ha | Three traces: litter carbon, soil nitrogen, living biomass |
| Role tally | Bar chart | count | Number of agents currently tagged Producer, Consumer, Decomposer |
| Carbon dioxide released | Live numeric | kg/ha per year | Total respiration, split by producers, consumers and decomposers |
| Nitrogen return rate | Live numeric | kg/ha per year | Litter converted to plant-available nitrogen |
| Producer growth | Line graph | kg/ha per year | Standing plant production, the first thing to fail when return stops |
| Soil core log | Data table | mixed | Every core taken, with position, depths and nitrogen |
| Ledger closure | Pass-fail badge | — | Green while the three tanks sum to a constant; flags any leak when fire or export is on |

**What the student should realise.**
Students file decomposers under cleaning up, a tidy afterthought rather than part of the system. Removing them here leaves the forest visibly intact for a while and then starves it: litter piles metres deep, soil nitrogen drains, and pines stop growing though nothing ate them. The student should be able to say: *"Producers capture the energy, consumers pass it on, and decomposers are the only reason the raw materials ever come back."*

### D2.2 · From food chain to food web

**Experiment name:** Draw the Web: Monterey Kelp Forest  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Agent-based  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A dark teal build canvas fills two thirds of the screen, faintly ruled, with a shelf of organism tokens along the bottom: giant kelp, phytoplankton, urchins, abalone, crabs, small fish, rockfish, sheephead, otters, seals, pelicans, sea stars, bacteria. Each token is a clean illustrated silhouette on a rounded card with its name and a small diet note. The student drags tokens onto the canvas and drags arrows between them; links snap and glow when accepted, flick red and spring back when refused. The right third is a live window on a real Monterey reef, kelp swaying in surge, so that every card on the canvas has a moving animal behind it. The control panel runs along the top.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Organism token | UI-Probe | 90×110 px card: silhouette, common name, diet note, live population meter along its base; 18 available in the palette | Yes: drag, place |
| 2 | Giant kelp token and agent | Actor | Producer card; in the 3D window a 20 u stipe with blades and floats swaying on the surge; biomass drives everything above it | Yes: place |
| 3 | Phytoplankton token | Actor | Producer card representing the drifting green layer; in the window, a fine particle haze in the upper water | Yes: place |
| 4 | Detritus and bacteria token | Actor | Decomposer card fed by every death and every waste event on the canvas; returns nutrients to both producers | Yes: place |
| 5 | Feeding link arrow | Structure | Bezier arrow from eaten to eater, 3 px, colour-graded by how much energy flows along it; thickness set by diet fraction | Yes: connect, drag |
| 6 | Link direction validator | Instrument | Rejects any arrow drawn eater-to-eaten and shows the correction, since energy direction is the point | No |
| 7 | Plausibility checker | Instrument | Compares each proposed link against a stored diet database and refuses impossible ones, e.g. urchin eats otter, with a one-line reason | No |
| 8 | Diet fraction handle | UI-Probe | Small draggable weight on each incoming arrow setting what share of that consumer's diet it supplies; shares are normalised to 100 % | Yes: drag |
| 9 | Removal hammer | UI-Probe | Cursor tool that deletes an organism from the built web and triggers the cascade run | Yes: drag |
| 10 | Cascade propagation engine | Field | Runs the built web forward, pushing population changes along every link for 60 simulated months after a removal | No |
| 11 | Population meter | Overlay | Bar on each token, green rising, red falling, updating live during a cascade run | No |
| 12 | Live reef viewport | Environment | 3D window showing the built community as real animals; species removed from the canvas visibly vanish from the reef | Yes: drag (camera) |
| 13 | Auto-arrange field | Field | Optional layout force that lifts each token to a height matching its position in the web | No |
| 14 | Web statistics panel | Instrument | Live counts of nodes, links, links per node, longest chain and number of separate paths from producer to top | No |
| 15 | Chain overlay | Overlay | Highlights one single path through the web at a time so a chain can be seen inside the web | No |
| 16 | Field guide card | UI-Probe | Flip side of every token, giving the real diet of that species in Monterey Bay with rough percentages | Yes: swap |

**How it works — the model.**
The canvas builds a directed graph. Each accepted arrow states that energy moves from the eaten to the eater, and each consumer's incoming arrows carry diet fractions that must total 100 %. Behind the palette sits a diet database drawn from Monterey Bay studies, so the checker can refuse links no observation supports and can score a finished web against the real one. Pressing Run passes the graph to the population engine: producers grow on light and nutrients, each consumer's intake is the sum of its links weighted by fraction, and populations update monthly. When a species is removed, the loss travels along every link it touched, and consumers with several inbound links re-weight toward their remaining prey while consumers with one link fail. That re-weighting, not any hidden robustness setting, is why a web absorbs a removal that flattens a chain.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Build mode | Dropdown | Blank canvas / Single chain (5 species) / Full web (14 species) | Blank canvas | — | Which tokens and links are pre-placed on the canvas |
| Organism palette | Multi-select | 18 Monterey species, any subset | Kelp, urchin, otter, sheephead, bacteria | — | Which tokens are available on the shelf |
| Remove species | Dropdown | Any species currently on the canvas | None | — | Deletes that node and starts a cascade run |
| Removal type | Radio | Total removal / Reduce by half | Total removal | — | Whether the species vanishes or is only cut back |
| Diet fractions | Toggle | Show / Hide | Show | — | Reveals the weight handles on every incoming arrow |
| Plausibility checker | Toggle | On / Off | On | — | Whether impossible links are refused or allowed through |
| Auto-arrange by level | Toggle | On / Off | Off | — | Lifts tokens to a height matching their place in the web |
| Run length | Slider | 12–120 | 60 | months | How long the cascade engine runs after a change |
| Nutrient upwelling | Slider | 20–120 | 70 | % of normal | Producer growth rate, so the base of the web can be squeezed |
| Playback speed | Dial | 1×–12× | 4× | — | Simulated months per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Build the classic chain | mode=Single chain (5 species); checker=On | Build kelp to urchin to otter and add two more links. Which way does every arrow point, and why is that the only direction allowed? |
| S2 | Break the chain | mode=Single chain (5 species); remove=Urchin; type=Total removal | Remove one species from a five-species chain. How many of the remaining four are affected, and how badly? |
| S3 | Break the web at the same point | mode=Full web (14 species); remove=Urchin; type=Total removal | Remove the same species from a full web. Compare the damage with S2 and explain the difference using the arrows. |
| S4 | Pull out the otter | mode=Full web (14 species); remove=Sea otter; run=120; upwelling=70 | Remove a predator that eats several prey. Which population explodes, and what happens to the producer at the bottom? |

**Student activities.**
1. Drag at least ten tokens onto the canvas and connect them into a working web. Record how many links the statistics panel counts and how many the checker refused.
2. Set diet fractions on every consumer with more than one prey, then record the three heaviest arrows in the whole web.
3. Use the removal hammer on the urchin in chain mode and again in web mode. Record every species whose meter changed in each case.
4. Turn on the chain overlay and trace three different paths from giant kelp to a top predator. Record the length of each path.
5. Remove the sea otter, run 120 months, and record urchin and kelp populations at months 0, 12, 60 and 120.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Web statistics | Live numeric | mixed | Nodes, links, mean links per node, longest chain, distinct producer-to-top paths |
| Population meters | Line graph | relative to start | One trace per species during a cascade run |
| Species affected count | Counter | count | How many populations moved more than 10 % after a removal |
| Link validity log | Data table | — | Every attempted link with accepted or refused and the reason given |
| Web accuracy score | Pass-fail badge | % | Overlap between the student's web and the stored Monterey diet database |
| Cascade comparison | Bar chart | % change | Chain result beside web result for the same removal |
| Energy path list | Data table | — | Every route from a producer to the selected top predator, with its length |
| Exported web | Data table | mixed | CSV of all nodes, links and diet fractions the student built |

**What the student should realise.**
Students picture feeding relationships as a single line and expect one removal to knock over everything behind it. Building both, then striking the same species out of each, shows a chain collapse and a web absorb it because consumers with several prey re-weight toward what is left. Removing a predator instead makes its prey explode and eats the base away. The student should be able to say: *"A chain is one path through a web, and having other paths is what keeps an ecosystem standing."*

### D2.3 · Trophic levels

**Experiment name:** Half a Level Up: Where Omnivores Sit  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A tall cross-section of Elkhorn Slough and the Monterey shelf, drawn as a water column with a numbered height axis running up the left edge from 1 to 5. Eelgrass and phytoplankton sit on the line marked 1; zooplankton and grazing snails float near 2; small fish, crabs and gulls hang at awkward heights between the printed numbers. Each animal is a small live 3D model rotating slowly in place, tethered to the axis by a thin line. Beside the column stands an isotope bench: a compact grey instrument with a sample tray and a needle gauge reading parts per thousand. A diet wheel opens whenever an animal is selected.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Trophic height axis | Instrument | Vertical scale marked 1.0 to 5.0 in tenths; every organism's vertical position is its computed level, not a drawn tier | No |
| 2 | Eelgrass and phytoplankton | Actor | Producer models: 3 u ribbon blades and a fine green haze; pinned at exactly 1.0 and unmovable by the student | No |
| 3 | Detritus and bacteria node | Actor | Brown flocculent cloud with a bacterial shimmer; treated as level 1 material so detritus feeders are handled honestly | Yes: place |
| 4 | Zooplankton swarm | Actor | 0.05 u copepods and larvae drifting in a loose cloud; grazes phytoplankton, so lands near 2.0 | No |
| 5 | Kelp crab | Actor | 0.4 u model with legs animating; diet spans algae, detritus and small animals, so its level is emphatically not a whole number | Yes: drag |
| 6 | Señorita fish | Actor | 0.3 u slim orange fish picking invertebrates off blades; a near-clean level 3 for contrast | Yes: drag |
| 7 | California sheephead | Actor | 0.9 u fish with a blunt head and strong jaws; crushes urchins and snails, mixing levels 2 and 3 | Yes: drag |
| 8 | Sea otter | Actor | 1.3 u forager holding prey on its chest; diet shifts across urchins, crabs, clams and fish by season | Yes: drag |
| 9 | Western gull | Actor | 0.7 u bird; the honest awkward case, eating fish, crabs, eggs, carrion and refuse across three levels | Yes: drag |
| 10 | Diet wheel | UI-Probe | Ring of draggable wedges around the selected animal, one per prey; wedges normalise to 100 % as they are dragged | Yes: drag, resize |
| 11 | Level computation tether | Overlay | Thin line from each animal to the axis; animates smoothly to a new height whenever its diet wheel changes | No |
| 12 | Nitrogen isotope bench | Instrument | Grey benchtop unit with a sample tray, a needle gauge in parts per thousand and a printout slot; sampling any animal returns a value | Yes: drag |
| 13 | Isotope sample vial | Structure | Small labelled vial minted per sample, holding species, value and computed level; stacks in a rack | Yes: place |
| 14 | Integer tier ghost | Overlay | Optional faint horizontal bands at 1, 2, 3, 4 showing the textbook picture, so the mismatch with real animals is visible | No |
| 15 | Mismatch flag | Overlay | Amber tag on any animal more than 0.2 levels from the nearest whole number when integer mode is on | No |
| 16 | Season control ribbon | Environment | Background tint and prey availability shifting across spring upwelling, summer, autumn and winter, which moves real diets | No |

**How it works — the model.**
Each organism's trophic level is computed, never assigned: level equals one plus the average level of everything it eats, weighted by how much of its diet each prey supplies. Producers and detritus are fixed at 1.0, so a pure herbivore lands at 2.0 and a predator that eats only herbivores at 3.0. An animal that takes 60 % algae and 40 % crabs lands at 2.8 and sits between the printed lines. The engine recomputes the whole web whenever a wedge moves, propagating upward, and the isotope bench supplies an independent check: a baseline value plus roughly 3.4 parts per thousand of nitrogen-15 for every level, with measurement scatter added. The two methods should agree within scatter. The failure to avoid is snapping any animal to a whole number, because the misconception is precisely that every animal belongs on one clean rung.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Selected organism | Dropdown | Any of the 12 animals in the column | Kelp crab | — | Which diet wheel is open and which animal the tether highlights |
| Diet wedges | Drag-handle | 0–100 per prey, normalised | Real Monterey values | % of diet | Rewrites that consumer's diet and moves it up or down the axis |
| Season | Dropdown | Spring upwelling / Summer / Autumn / Winter | Summer | — | Loads the real seasonal diet for every consumer at once |
| Integer tier mode | Toggle | On / Off | Off | — | Forces whole-number tiers and flags every animal that does not fit |
| Isotope bench | Toggle | On / Off | On | — | Enables sampling any animal for its nitrogen-15 value |
| Baseline isotope value | Slider | 4.0–12.0 | 7.5 | ‰ | Nitrogen-15 of the producers, which sets where the whole scale starts |
| Enrichment per level | Slider | 2.0–4.5 | 3.4 | ‰ per level | How much the isotope rises with each feeding step |
| Samples per animal | Stepper | 1–10 | 3 | samples | Repeat measurements, which shrinks the scatter on the readout |
| Detritus pathway | Toggle | On / Off | On | — | Whether detritus and bacteria count as a level 1 food source |
| Add omnivore | Dropdown | Raccoon / Black bear / Brown pelican / None | None | — | Places an extra California omnivore into the column with its real diet |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Clean cases first | selected=Zooplankton; season=Summer; integer mode=Off | Eelgrass sits at 1.0. Where do a pure grazer and a fish that eats only grazers land, and why exactly there? |
| S2 | The animal that will not fit | selected=Kelp crab; integer mode=On; bench=On | The crab is flagged. What is its computed level, and what would you have to believe about its diet to call it level 2? |
| S3 | Move the diet, move the animal | selected=Western gull; wedges=drag fish to 0 % | Change one gull wedge at a time and record its level. How much diet change does one whole level take? |
| S4 | Two methods, one answer | season=Spring upwelling; bench=On; samples=5; baseline=7.5 | Sample five animals. Do the isotope levels and the diet-wheel levels agree, and what explains the gaps that remain? |

**Student activities.**
1. Select five animals in turn and record each computed trophic level to one decimal place, without rounding.
2. Turn integer tier mode on and record every animal the mismatch flag catches, with how far off the nearest whole number it is.
3. Drag the kelp crab's algae wedge from 60 % to 20 % in four steps and record its level at each step.
4. Sample four animals with the isotope bench at three samples each. Record the measured value and the computed level side by side.
5. Load Spring upwelling and Winter in turn and record how far the sea otter's level moves between the two seasons.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Computed trophic level | Live numeric | level | One decimal place per organism, recomputed on every wedge change |
| Level distribution | Bar chart | count | Histogram of all organisms by level in 0.2 bands; shows how few sit on whole numbers |
| Diet composition | Data table | % | Every consumer's prey list with its fraction and that prey's own level |
| Isotope readout | Live numeric | ‰ | Nitrogen-15 of the sampled animal with its scatter range |
| Isotope versus diet level | Line graph | ‰ vs level | Each sample plotted against its computed level, with the expected slope drawn |
| Mismatch count | Counter | count | Organisms flagged as not fitting a whole tier under integer mode |
| Seasonal shift | Line graph | level vs season | Selected animal's level across the four seasons |
| Sample rack | Data table | mixed | Exportable CSV of every vial: species, value, computed level, season |

**What the student should realise.**
Students believe every animal belongs to one tidy tier, so an omnivore must be filed under whichever level looks closest. Computing levels from real diets puts the crab, the gull and the otter at fractions, and an independent isotope measurement agrees with the fractions rather than the tiers. The student should be able to say: *"A trophic level is an average of what an animal eats, so animals with mixed diets genuinely sit between the levels."*

### D2.4 · Why energy decreases at each level

**Experiment name:** Follow the Joule: Where the Energy Goes  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Particle system + Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
Point Reyes coastal prairie at first light, camera low among the bunchgrass. Fog lies in the hollows, a red-tailed hawk turns slow circles overhead, and California voles run their worn runways under the thatch. Every scrap of energy in the scene is visible as a small glowing amber chip: chips sit packed in the grass blades, travel along a vole's gut as it feeds, rise off every warm body as a drifting orange heat wisp, and drop out behind the voles as dull brown pellets. To the right, a Sankey canvas draws itself in real time, one broad band entering at the grass and thin ribbons peeling off at every loss. The control panel is docked left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Energy token | Particle | 4 px amber chip, each worth exactly 1 kJ; instanced in the tens of thousands; every token has one location and one fate, and is never created or destroyed | No |
| 2 | Bunchgrass sward tile | Structure | 0.5 m tiles of California oatgrass and purple needlegrass, 12–40 u blades; each tile holds a token count set by its yearly production | Yes: resize |
| 3 | Sunlight budget beam | Field | Broad gold band entering the top of the Sankey canvas; only about 1 % of it is ever captured, and the uncaptured remainder is drawn peeling straight off | No |
| 4 | California vole agent | Actor | 0.12 u grey-brown rodent, running 0.5 u/s along thatch runways; visible gut segment fills with tokens as it feeds; instanced ×20–400 | Yes: drag |
| 5 | Red-tailed hawk agent | Actor | 1.2 u wingspan raptor, rufous tail, circling and stooping; captures a vole on a success roll and carries tokens to a perch | Yes: drag |
| 6 | Golden eagle agent | Actor | 2.0 u wingspan; only present when a fourth level is added; takes hawks and large prey | Yes: place |
| 7 | Side-blotched lizard agent | Actor | 0.08 u ectotherm swappable for the vole; loses far less energy to heat because it does not hold its own temperature | Yes: swap |
| 8 | Respiration heat wisp | Particle | Orange wisp rising 2 u then fading, one per respired token; density is the single most visible loss stream in the scene | No |
| 9 | Faecal pellet | Structure | 0.02 u dull brown pellet dropped where an animal fed; carries the tokens that were eaten but never absorbed | No |
| 10 | Uneaten remains pile | Structure | Small heap of fur, bone and seed husk left after a kill or a meal; holds the tokens a predator did not swallow | No |
| 11 | Decomposer sink | Actor | Fungal and bacterial mat under the thatch that receives pellets, remains and dead bodies and respires their tokens away as heat | Yes: place |
| 12 | Token tracer | Instrument | Click any single token to paint it white and follow it through every transfer until it leaves as heat; leaves a visible trail | Yes: drag |
| 13 | Sankey canvas | Overlay | Self-drawing flow diagram, band width proportional to kJ, with named ribbons: respired, egested, uneaten, transferred | No |
| 14 | Thermal overlay | Overlay | False-colour camera view where every animal glows by its live respiration rate; endotherms burn bright, the lizard does not | No |
| 15 | Level calorimeter | Instrument | Boxed probe placed on any level reporting kJ per square metre per year entering, stored and leaving it | Yes: place |
| 16 | Efficiency gauge | Instrument | Dial reading the transfer percentage between the two selected levels, updated at the end of each simulated year | No |

**How it works — the model.**
Energy is conserved token by token, and the engine may never mint or delete one. Grass captures a small fraction of incident sunlight into tokens. A vole that eats a blade takes those tokens into its gut, then loses a fixed share straight through as faeces, and burns most of the rest on staying warm, moving and breathing, each burnt token leaving as a heat wisp. Only the tokens still in tissue at the end of the year are available to the next level, and a hawk captures only the fraction of voles it actually catches and swallows. The roughly ten per cent that reaches each next level is therefore an outcome of three visible subtractions, not a number written anywhere in the code. Warm-blooded animals lose more than cold-blooded ones, which the lizard swap makes plain. Every lost token ends as heat, so nothing recycles.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sunlight input | Slider | 1,000–8,000 | 5,000 | MJ/m² per year | Total light arriving; grass capture is a small fixed share of it |
| Grass production | Slider | 200–1,200 | 600 | g/m² per year | Tokens loaded into the sward at the start of each year |
| Herbivore type | Dropdown | California vole / Side-blotched lizard / Black-tailed hare | California vole | — | Swaps the level 2 agent, changing heat loss and gut efficiency |
| Herbivore count | Stepper | 20–400 | 120 | animals/ha | How many level 2 agents exist |
| Assimilation efficiency | Slider | 20–90 | 65 | % of food absorbed | Share of eaten tokens absorbed rather than egested as pellets |
| Activity level | Slider | 0.5–3.0 | 1.4 | × basal rate | How hard animals work, and therefore how fast they respire tokens |
| Air temperature | Slider | 0–35 | 14 | °C | Heat loss for endotherms; below 10 °C respiration climbs sharply |
| Number of levels | Stepper | 2–4 | 3 | levels | Structural: adds or removes the hawk and the golden eagle |
| Decomposers | Toggle | Present / Absent | Present | — | Whether pellets, remains and bodies are respired away or pile up |
| Token tracing | Toggle | On / Off | Off | — | Enables clicking a single token and following its whole journey |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Grass, vole, hawk | levels=3; herbivore=California vole; grass=600; activity=1.4; temperature=14 | Read the calorimeter at all three levels. What percentage of the grass energy reaches the hawk, and what are the three places the rest went? |
| S2 | Follow one chip | tracing=On; levels=3; same as S1 | Trace ten individual tokens. How many reach the hawk, and what happened to the ones that did not? |
| S3 | Swap in a cold-blooded grazer | herbivore=Side-blotched lizard; grass=600; temperature=22 | A lizard does not heat itself. Does the transfer percentage rise, and which Sankey ribbon shrank? |
| S4 | Add a fourth level | levels=4; grass=600; herbivore=California vole | Add a golden eagle above the hawk. How much energy is left at level 4, and what does that say about long food chains? |

**Student activities.**
1. Place the calorimeter on each of the three levels in turn and record kJ per square metre per year for each.
2. Calculate the transfer percentage from level 1 to 2 and from level 2 to 3, then compare both with the efficiency gauge.
3. Turn tracing on and follow ten tokens. Record the fate of each as respired, egested, uneaten or transferred, and tally the four columns.
4. Swap the vole for the side-blotched lizard, re-run one year, and record the new transfer percentage and the change in the respired ribbon.
5. Set levels to 4 and record the energy at each level. State how many voles-worth of grass one eagle-worth of energy required.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Energy per level | Bar chart | kJ/m² per year | Standing production at each level, measured by the calorimeters |
| Transfer efficiency | Live numeric | % | Between each adjacent pair of levels, computed at year end |
| Sankey flow diagram | Heat map | kJ/m² per year | Self-drawing bands showing captured, respired, egested, uneaten and transferred energy |
| Loss breakdown | Bar chart | kJ/m² per year | Respiration, egestion and uneaten remains side by side for each level |
| Traced token fates | Data table | count | Every traced token with its route and where it finally left the system |
| Heat released | Live numeric | kJ/m² per year | Total respiration across all levels including decomposers |
| Energy closure | Pass-fail badge | — | Green while tokens in equals tokens accounted for; flags any leak in the engine |
| Run archive | Data table | mixed | Exportable CSV of settings, level energies and both efficiencies per run |

**What the student should realise.**
Students think energy is lost at each level because animals fail to eat everything, or because it is somehow used up and stored elsewhere. Tracing individual joules shows three concrete exits, respired heat above all, and shows that heat leaves the ecosystem for good. Ten per cent is a result, not a rule. The student should be able to say: *"Most of the energy at every level is burned to stay alive and leaves as heat, so only a small part is ever left to pass on."*

### D2.5 · Reading an energy pyramid

**Experiment name:** Build the Pyramid, Then Break It  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A clean charcoal studio holding one object: a stack of glowing slabs, each as wide as the quantity it represents, floating one above another and slowly rotating so the student can see the taper edge on. The bottom slab is broad and warm gold, the ones above narrow sharply, and the top slab is a sliver. Every slab carries its value on its face and its organism cards along its front edge. To the left, four dataset cards wait: the student's own kelp forest web, the Point Reyes prairie, Monterey open water, and a single valley oak in the Central Valley. To the right, three mode buttons labelled Energy, Biomass, Numbers, and a caliper tool for measuring any slab.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Pyramid tier slab | Structure | Extruded slab 0.6 u thick; width strictly proportional to the tier value; warm gold at the base cooling to pale blue at the top; animates width on any change | Yes: resize |
| 2 | Tier organism card | UI-Probe | Small card clipped to a slab's front edge naming each species on that tier with its contribution | Yes: drag |
| 3 | Imported web link | Instrument | Reads the food web the student built in the previous experiment and lays its species onto tiers automatically | Yes: swap |
| 4 | Dataset card — kelp forest | Instrument | Monterey kelp forest figures: giant kelp production, urchin and crab biomass, fish and otter standing stock | Yes: drag |
| 5 | Dataset card — coastal prairie | Instrument | Point Reyes grass, vole and hawk figures carried over from the energy-flow experiment in matching units | Yes: drag |
| 6 | Dataset card — Monterey open water | Instrument | Phytoplankton and zooplankton standing crop and annual production; the classic inverted biomass case | Yes: drag |
| 7 | Dataset card — valley oak | Instrument | One 200-year valley oak with its insect, bird and raptor community; the classic inverted numbers case | Yes: drag |
| 8 | Mode switch | UI-Probe | Three-way control rebuilding the same community as an energy, biomass or numbers pyramid with correct units | Yes: swap |
| 9 | Slab caliper | Instrument | Draggable tool that measures any slab and reports its value, its share of the tier below, and the ratio between them | Yes: drag |
| 10 | Turnover dial | Instrument | Physical dial setting how many times a year the producer stock is replaced; visibly separates standing crop from production | Yes: drag |
| 11 | Fractional tier splitter | Field | Distributes an omnivore across tiers according to its computed level from the previous experiment, so a 2.8 animal contributes to both | No |
| 12 | Inversion detector | Overlay | Red outline and a printed warning on any slab wider than the one beneath it, with the tier ratio shown | No |
| 13 | Axis scale toggle | UI-Probe | Switches slab width between linear and logarithmic so a top tier a thousand times smaller stays visible | Yes: swap |
| 14 | Unit ribbon | Overlay | Band under the pyramid showing the current units: kJ/m² per year, g/m², or individuals per hectare | No |
| 15 | Claim card and scorer | UI-Probe | Blank claim with evidence slots; the scorer checks whether the chosen slab values actually support the claim written | Yes: place |
| 16 | Comparison rail | Overlay | Holds up to three saved pyramids side by side at matched scale for direct comparison | Yes: drag |

**How it works — the model.**
One community, three questions. The engine holds each dataset as a table of species with four fields: annual energy production, standing biomass, individual count, and computed trophic level. Choosing a mode rebuilds slab widths from the matching field, using the same species and the same tier assignment, so any difference between the three pyramids comes from the quantity measured and nothing else. Omnivores are split across tiers by their fractional level rather than rounded. The turnover dial matters: phytoplankton are eaten and replaced many times a year, so a small standing crop can feed a larger consumer stock above it, which inverts a biomass pyramid while the energy pyramid stays upright. Numbers pyramids invert whenever one large producer feeds many small consumers. The engine must never quietly reorder tiers to keep a pyramid tidy.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Community | Dropdown | My kelp forest web / Coastal prairie / Monterey open water / Valley oak | My kelp forest web | — | Loads a different species table, tiers and unit set |
| Pyramid type | Radio | Energy / Biomass / Numbers | Energy | — | Which field sets slab width; unit ribbon relabels |
| Quantity basis | Toggle | Annual production / Standing crop | Annual production | — | Whether a slab shows energy passing through per year or stock present now |
| Producer turnover | Slider | 1–120 | 4 | replacements/year | How fast producers are eaten and regrown; drives the gap between the two bases |
| Omnivore handling | Dropdown | Split by fraction / Round to nearest tier | Split by fraction | — | How animals with fractional levels are placed in the stack |
| Include decomposers | Toggle | On / Off | Off | — | Adds a decomposer slab alongside the stack with its own flow |
| Axis scale | Toggle | Linear / Logarithmic | Linear | — | Slab width mapping, so a tiny top tier remains readable |
| Sample area | Slider | 1–10,000 | 100 | m² | Area the counts and masses are expressed over; changes numbers, not shape |
| Save to comparison rail | Stepper | 0–3 | 0 | slots | Structural: stores the current pyramid beside others for comparison |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Your own web, as energy | community=My kelp forest web; type=Energy; basis=Annual production | Turn the web you built into an energy pyramid. What is the ratio between each tier and the one below it? |
| S2 | One oak, thousands of insects | community=Valley oak; type=Numbers; area=100 | Count individuals instead of energy. Why is the bottom tier now a single organism, and is anything wrong with the ecosystem? |
| S3 | Upside-down ocean | community=Monterey open water; type=Biomass; basis=Standing crop; turnover=60 | Weigh the plankton instead. The producers weigh less than their consumers. How can that possibly work? |
| S4 | Same water, measured as energy | community=Monterey open water; type=Energy; basis=Annual production; turnover=60 | Switch the same community to energy. Which way up is the pyramid now, and what does that tell you about which quantity can never invert? |

**Student activities.**
1. Load your own kelp forest web as an energy pyramid and record the value on each slab, then use the caliper to record the ratio between each pair of tiers.
2. Switch the same community to Numbers and record how the shape changes without changing a single organism.
3. Load the valley oak in Numbers mode and record the count on each tier. Write one sentence explaining the inverted shape.
4. Load Monterey open water, set turnover to 60, and record producer and consumer values in both Biomass and Energy modes.
5. Build a claim card stating which pyramid type can never be inverted, fill it with three slab values as evidence, and record the scorer's verdict.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Tier values | Bar chart | kJ/m² per year, g/m² or individuals | The four slab values in the current mode and units |
| Tier ratio | Live numeric | % | Each tier as a percentage of the one below, reported by the caliper |
| Inversion flag | Pass-fail badge | — | Red on any tier wider than the one beneath it, with the ratio printed |
| Standing crop versus production | Line graph | g/m² and kJ/m² per year | The two bases plotted together as turnover is changed |
| Pyramid comparison | Bar chart | mixed | Up to three saved pyramids at matched scale on the comparison rail |
| Species contribution | Data table | mixed | Every species with its tier, fractional level and contribution to its slab |
| Claim score | Pass-fail badge | — | Whether the selected evidence supports the written claim, with a reason |
| Export | Data table | mixed | CSV of all tiers, all three quantities and the active settings |

**What the student should realise.**
Students think a pyramid is the shape ecosystems have, so an upside-down one means something is broken. Rebuilding one community three ways shows that numbers and biomass pyramids invert quite legitimately, when one oak feeds thousands of insects or when fast-growing plankton are eaten as quickly as they grow. Only energy per year cannot invert. The student should be able to say: *"The shape depends on what you measured, and only the energy pyramid must always be widest at the bottom."*

## D3 · Cycling matter through an ecosystem · MS-LS2-3

### D3.1 · Matter cycling between organisms and the environment

**Experiment name:** The Sealed Jar: Nothing Leaves, Nothing Arrives  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A one-litre glass jar stands on a pale birch bench, lit from the left by a small desk lamp, sealed with a clamped steel lid and an orange silicone gasket. Inside: two centimetres of washed grit, three strands of pondweed leaning toward the light, a green algal bloom fogging the glass on the lamp side, one ramshorn snail grazing, and a slow snow of detritus settling. Bubbles cling to the pondweed leaves and release one at a time. Behind the jar, floating in dark slate, is the Atom Ledger: five stacked bars showing where every tagged atom currently sits. The control panel is docked right; a loupe on the cursor zooms any patch to microbe scale with a 20 µm scale bar.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Glass jar body | Environment | Cylinder 120 mm tall, 95 mm across, 3 mm wall, refractive glass shader with a faint green cast; interior volume is the whole simulated world | Yes: resize |
| 2 | Lid and gasket seal | Structure | Steel disc with a knurled clamp and an orange gasket ring; when unsealed the lid tilts 20° and a dotted boundary line opens across the jar mouth | Yes: swap |
| 3 | Grit substrate | Environment | 20 mm bed of 1–3 mm quartz grains, warm grey with mica flecks; holds the buried-detritus reservoir | No |
| 4 | Water column | Environment | Translucent teal volume with slow convection swirl, 0.3 mm/s drift; carries dissolved gases and ions | No |
| 5 | Pondweed strand | Actor | Stem capsule 70 mm long bearing 24 lance-shaped leaves 6 mm long, jade green with a darker midrib; leaves tilt toward the lamp over 30 s; grows one leaf node per simulated day when photosynthesising | Yes: place, resize |
| 6 | Algal film | Actor | Instanced 0.4 mm discs, 400–3000 of them, sprayed on the lamp-side glass; density tracks light and nutrients | Yes: swap |
| 7 | Ramshorn snail | Actor | Flat coiled shell 9 mm across, amber banded, foot in dull cream; crawls the glass at 2 mm/s, rasps algae, drops a pellet every 40 s | Yes: place |
| 8 | Ostracod grazers | Actor | 0.9 mm bean-shaped shells, translucent straw; 0–60 of them, jittering random walk; eat suspended detritus | Yes: place |
| 9 | Decomposer bacteria colonies | Actor | Rod cells 2 µm long, rendered as slate-blue haze patches over dead matter until the loupe resolves them into rods; population doubles every 90 simulated minutes on available detritus | Yes: swap |
| 10 | Detritus particles | Particle | Irregular 0.2–1.5 mm brown flecks, 200–1200 instanced; sink at 0.5 mm/s, settle into the grit, shrink as bacteria consume them | No |
| 11 | Dissolved gas field | Field | Two invisible scalar fields (O₂, CO₂) on a 12×12×12 lattice inside the water; drives bubble formation and snail stress; shown as a blue-to-amber wash when overlay is on | No |
| 12 | Tagged atom set | Particle | 60 individually numbered atoms, drawn as small glowing beads with a comet trail 3 s long: carbon gold, nitrogen violet, oxygen cyan; each carries a reservoir label that updates when it changes hands | Yes: place |
| 13 | Atom Ledger panel | Overlay | Five stacked bars (Air space · Water · Producers · Consumers · Decomposers + soil) plus a TOTAL strip that must never change height | No |
| 14 | Desk lamp | Instrument | 40 mm shaded bulb on a hinged arm, warm-white cone; intensity and daily on-hours are slider-driven | Yes: drag |
| 15 | Gas and temperature probe | Instrument | Slim 60 mm rod dipped through a port, tip glowing; reports dissolved O₂, CO₂ and temperature at its tip depth | Yes: drag |
| 16 | Boundary flux meter | Instrument | Invisible plane across the jar mouth counting atoms crossing in and out per hour; reads exactly zero while the lid is sealed | No |

**How it works — the model.**
The jar holds a fixed inventory of tagged atoms. Every process is written as a transfer, never a creation: photosynthesis moves carbon and oxygen atoms from the dissolved-gas reservoir into the pondweed and algae reservoirs; grazing moves them from producers to the snail; respiration moves them back to the gas field; death and excretion move them to detritus; bacterial decay moves them from detritus back to gas and to dissolved ions. Each transfer is a rate rule of the form `flux = k · (source pool) · (limiting factor)`, where the limiting factor is light for photosynthesis, food density for grazing, and temperature for decay. The ledger sums all five reservoirs every tick and asserts the total is unchanged. The engine must never spawn or delete a tagged atom while the lid is sealed; a "matter used up" bug is the exact misconception the experiment exists to kill. Biomass is reported in atom counts, not grams, so growth always visibly costs some other reservoir.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Lid seal | Toggle | Sealed / Open | Sealed | — | Opens or closes the boundary; when open, atoms may leave and enter |
| Snails | Stepper | 0–6 | 1 | count | How many grazers exist; sets grazing and respiration load |
| Pondweed strands | Stepper | 0–5 | 3 | count | Producer biomass and therefore photosynthetic capacity |
| Decomposers | Toggle | Present / Removed | Present | — | Whether detritus is broken down or simply accumulates |
| Daily light hours | Slider | 0–24 | 12 | h/day | Length of the lit phase each simulated day |
| Lamp intensity | Slider | 0–1200 | 400 | µmol/m²/s | Photosynthesis rate ceiling |
| Water temperature | Slider | 8–32 | 21 | °C | Respiration and decay rates; snail stress threshold |
| Tracer element | Dropdown | Carbon / Nitrogen / Oxygen | Carbon | — | Which element the 60 tagged atoms represent |
| Time compression | Dial | 1×–2000× | 500× | — | Simulated hours per real second |
| Gas overlay | Toggle | On / Off | Off | — | Shows the dissolved O₂ / CO₂ colour wash |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Balanced jar | lid=Sealed; snails=1; pondweed=3; decomposers=Present; light hours=12 | Run 30 simulated days. Which reservoirs gain atoms and which lose them, and what happens to the TOTAL bar? |
| S2 | Overstocked | snails=5; pondweed=1; light hours=12 | The snails die by day 9. Did their atoms disappear from the jar, and where can you find them afterwards? |
| S3 | Decomposers removed | decomposers=Removed; snails=2; run 60 days | Detritus piles up on the grit. Which reservoir bar stops refilling, and why does the pondweed stall? |
| S4 | Lid off | lid=Open; snails=1; pondweed=3 | With the boundary open, the total is no longer fixed. What does the boundary flux meter show, and what changed about your accounting? |

**Student activities.**
1. Set the tracer to Carbon, pin tag #7 onto a pondweed leaf, and record every reservoir it visits over 20 simulated days, in order, with the day number.
2. Run S1 for 30 days and record the five reservoir bar heights at day 0, 10, 20 and 30. Add the five numbers each time and write down the totals.
3. Predict, before running S2, whether the total atom count will fall when the snails die. Run it, record the answer, and write one sentence explaining what happened instead.
4. Set decomposers to Removed and run 60 days. Measure the detritus reservoir and the producer reservoir every 10 days and describe the shape of each curve.
5. Open the lid and run 10 days. Record the boundary flux meter, then re-seal and explain in one sentence why the sealed jar was easier to account for.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Atom Ledger | Bar chart | atoms | Five reservoir bars, updated every simulated hour |
| Total atom count | Pass-fail badge | atoms | Green while the total is unchanged; amber the instant the lid is opened |
| Tagged atom itinerary | Data table | reservoir vs day | One row per reservoir change for the pinned atom, exportable |
| Dissolved O₂ and CO₂ | Line graph | mg/L | Two traces vs simulated days, from the probe tip |
| Living biomass by group | Line graph | atoms | Producers, consumers, decomposers on shared axes |
| Detritus on the grit | Live numeric | atoms | Updated hourly; the pile that grows when decomposers are off |
| Boundary flux | Counter | atoms/h | In, out and net across the jar mouth; reads 0 when sealed |
| Snail survival | Timer | simulated days | How long each grazer lasted before starvation or low oxygen |

**What the student should realise.**
Students believe matter is used up: that a dead snail's substance is gone and that plants make new material out of nothing. A sealed jar with a fixed, numbered atom inventory makes that untenable, because the total never moves while every individual atom changes address many times. Growth in one reservoir is always a withdrawal from another. The student should be able to say: *"The same atoms keep getting reused by different living things; nothing is made and nothing is destroyed, it just changes hands."*

### D3.2 · Decomposers closing the loop

**Experiment name:** Rot Chamber: Who Unlocks the Nutrients  
**Render mode:** 3D Scene  
**Simulation engine:** Agent-based + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A cutaway litter box the size of a shoebox sits under soft north light, its front wall a pane of glass so the student sees the profile: a top layer of crisp brown oak leaves, then a matted black horizon of half-rotted fragments, then crumbly dark soil. A fallen coast live oak branch lies across the surface, its bark split. White fungal hyphae creep out from the split in thin threads that visibly lengthen. Wood lice trundle in the litter, an earthworm slides through a burrow behind the glass, and a faint warm shimmer rises from the middle layer. On the right a nutrient-release chart draws itself day by day. A loupe zooms to a 10 µm scale bar showing bacterial rods swarming a leaf edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Chamber and glass front | Environment | 300×180×160 mm box, matte grey walls, one optically clear front pane with a 10 mm grid etched faintly for depth reference | No |
| 2 | Fresh leaf litter layer | Structure | 60–200 instanced oak leaf cards 35 mm long, curled, russet to tan, individually tracked with a remaining-mass value; visibly perforate and shrink as they are consumed | Yes: place |
| 3 | Fragmented litter horizon | Structure | 25 mm band of 2–8 mm dark brown flecks, produced when a detritivore chews a leaf; grows as leaves shrink | No |
| 4 | Humus and soil layer | Environment | 70 mm of crumb-textured near-black soil with visible pore spaces; holds the mineral nutrient pool | No |
| 5 | Oak branch | Structure | 180 mm cylinder tapering 22 mm to 14 mm, greyish bark shell over pale sapwood, one lengthwise split; decays an order of magnitude slower than leaves | Yes: place, swap |
| 6 | Fungal hyphae network | Actor | Branching filaments 4 µm wide, chalk white with a faint pearl sheen, growing 3 mm per simulated day from inoculation points, branching every 8 mm; only fungi can attack the lignin in bark and wood | Yes: place |
| 7 | Fungal fruiting body | Actor | Small tan bracket or 12 mm toadstool that erupts once a hyphal network passes a size threshold; releases a spore puff | No |
| 8 | Decomposer bacteria colonies | Actor | Rod cells 2 µm long in slate-blue clusters on wet leaf surfaces; population doubles every 40 simulated minutes in warm, moist conditions and collapses when dry | Yes: swap |
| 9 | Wood louse (detritivore) | Actor | 11 mm segmented armoured body, slate grey, 14 legs, ambling at 4 mm/s; shreds whole leaves into fragments, multiplying the surface area available to microbes | Yes: place |
| 10 | Earthworm | Actor | 90 mm segmented tube, dull pink with a clitellum band, peristaltic crawl through a visible burrow; drags surface leaves down and mixes horizons | Yes: place |
| 11 | Moisture field | Field | Scalar field over the profile, 0–100 % of water-holding capacity; rendered as a darkening of soil colour and a glisten on leaf surfaces | No |
| 12 | Heat field and thermal plume | Field | Temperature field driven by microbial respiration; a translucent orange shimmer rises from any cell above ambient by 2 °C | No |
| 13 | Mineral nutrient pool | Field | Three tracked ion stocks in the soil layer (nitrate, phosphate, potassium) with a colour-ramp overlay; only rises when decomposers work | No |
| 14 | Seedling bioassay tray | Instrument | Six 40 mm radish seedlings planted in soil drawn from the chamber; their height is the biological read of nutrient release | Yes: place |
| 15 | Mass balance and CO₂ probe | Instrument | Load cell under the chamber plus a gas port in the lid; reports remaining litter mass and CO₂ evolution rate | No |
| 16 | Loupe | UI-Probe | 6× circular lens following the cursor, with a 10 µm scale bar and a microbe-count badge | Yes: drag |

**How it works — the model.**
Every piece of dead matter carries a mass, a toughness value and a nutrient content. Detritivores reduce particle size without releasing many nutrients; microbes release nutrients but their rate depends on exposed surface area, so shredding by wood lice and worms multiplies microbial output. Bacteria attack soft, wet, sugary tissue fast; fungi grow slowly but are the only agents with the enzymes to break lignin, so bark and wood decay only where hyphae have reached. Decay rate per patch is `rate = k · surface · f(moisture) · Q₁₀^((T−20)/10)`, with a moisture optimum near 60 % and near-zero rate below 15 % or above 95 %. Released nutrients enter the soil mineral pool with a lag, producing the characteristic curve: slow at first, steep in the middle, then flattening as the easy material runs out. Respiration adds CO₂ to the headspace and heat to the profile, which is how the student sees that decomposers are living things eating, not chemicals dissolving.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Decomposer crew | Multi-select | Bacteria / Fungi / Wood lice / Earthworms | Bacteria + Fungi | — | Which agent types exist in the chamber |
| Litter load | Slider | 20–300 | 120 | g | How much dead leaf material starts on the surface |
| Litter type | Dropdown | Oak leaves / Pine needles / Grass clippings / Oak branch | Oak leaves | — | Toughness and nutrient content of the dead matter |
| Soil moisture | Slider | 5–100 | 60 | % of capacity | Microbial activity; below 15 % decay nearly stops |
| Temperature | Slider | 2–40 | 20 | °C | Decay rate through the Q₁₀ rule |
| Fungal inoculation points | Stepper | 0–8 | 2 | count | Where hyphal networks begin; only these can reach the branch |
| Detritivore count | Stepper | 0–20 | 6 | count | Shredding rate and therefore exposed surface area |
| Run length | Slider | 10–180 | 90 | simulated days | Length of the run drawn on the nutrient curve |
| Seedling bioassay | Toggle | On / Off | On | — | Plants the radish tray and reads soil nutrients biologically |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Full crew | crew=all four; litter=120 g; moisture=60 %; temp=20 °C; run=90 d | On which simulated day does the nutrient-release curve rise most steeply, and what is the litter mass by day 90? |
| S2 | Sterile floor | crew=none; litter=120 g; run=180 d | With no decomposers at all, what happens to litter mass, soil nutrients and seedling height over 180 days? |
| S3 | Bacteria only, wood added | crew=Bacteria; litter type=Oak branch; run=180 d | Bacteria alone barely touch the branch. Which crew member is missing, and what can it break that bacteria cannot? |
| S4 | Mojave dry heat | moisture=10 %; temp=35 °C; crew=all four; run=180 d | The chamber is hot but bone dry. Why does the leaf litter stay almost intact for half a year? |

**Student activities.**
1. Set the crew to Bacteria + Fungi only and run 90 days. Record litter mass and soil nitrate at days 0, 15, 30, 60 and 90, and sketch the release curve.
2. Add wood lice and earthworms and re-run the identical settings. Compare the day-30 nitrate value with your first run and state, in one sentence, why shredding sped up the microbes.
3. Swap the litter type to Oak branch, remove fungi, and run 180 days. Measure how much branch mass is lost, then re-run with fungi restored and record the difference.
4. Drag the moisture slider to 10 %, run 60 days, and record the CO₂ evolution rate. Then return to 60 % and record it again at the same run length.
5. Read the six radish seedlings' heights at day 90 in your best and worst runs, and write the number that shows nutrients actually returned to the soil.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Remaining litter mass | Line graph | g | Falling curve vs simulated days, from the load cell |
| Nutrient release curve | Line graph | mg/kg soil | Nitrate, phosphate and potassium on shared axes; the lag, rise and plateau are the point |
| CO₂ evolution rate | Live numeric | mg/kg/day | Updated daily; the breathing of the decomposers |
| Microbial population | Line graph | cells ×10⁶ | Bacteria and fungal biomass traced separately |
| Chamber temperature rise | Live numeric | °C above ambient | Heat produced by respiration in the middle horizon |
| Seedling height | Bar chart | mm | Six radish bioassay plants at run end |
| Decay half-life | Live numeric | simulated days | Days for litter mass to fall by half in the current settings |
| Run comparison | Data table | mixed | One row per run with crew, conditions and day-90 values, exportable |

**What the student should realise.**
Students believe dead things simply "rot away" on their own, and that decomposers are unpleasant extras rather than a step the ecosystem depends on. Removing the crew leaves the litter almost intact after 180 days and the nutrient pool flat, while the seedlings stay stunted, so decay is visibly the work of living organisms feeding. The student should be able to say: *"Decomposers are the ones that hand the atoms back to the soil and the air; without them the material stays locked in dead bodies and the plants get nothing."*

### D3.3 · The carbon cycle, introduced

**Experiment name:** Carbon on Tour: Reservoirs and Fluxes  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model + Particle system  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A wide, stylised California cross-section runs from Monterey surf on the left to Sierra granite on the right, drawn in flat layered planes: pale sky, a redwood stand, ploughed Central Valley fields, a city with a freeway, the coastal ocean, and a dark rock basement. Over each part of the landscape floats a translucent glass tank labelled with its carbon stock, filled to a level in gigatonnes: Atmosphere, Land plants, Soil and litter, Ocean, Fossil rock. Between the tanks, curved arrow-pipes carry visible carbon beads; the pipes thicken and thin as fluxes change. One bead glows gold, trails a ribbon, and is the atom the student follows. The control panel is docked right; a scrubber timeline runs along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Landscape backplate | Environment | Five parallax layers, coast to Sierra, muted teal-ochre palette, slow cloud drift; purely scenic context for the tanks | No |
| 2 | Atmosphere tank | Structure | Wide flat glass tank across the sky band, filled with pale blue gas at a level in GtC; a ppm label sits on the rim | Yes: resize |
| 3 | Land plant tank | Structure | Tall green-tinted tank behind the redwood stand; level rises with photosynthesis and drops with harvest, fire and respiration | Yes: resize |
| 4 | Soil and litter tank | Structure | Broad dark-brown tank set into the ground plane, the largest fast-cycling land store | Yes: resize |
| 5 | Ocean tank | Structure | Deep blue tank under the sea layer, split into a thin surface compartment and a thick deep compartment with a slow exchange valve between them | Yes: resize |
| 6 | Fossil rock tank | Structure | Sealed charcoal tank in the basement layer with a valve icon; opening the valve is what burning coal and oil means | Yes: swap |
| 7 | Flux pipes | Structure | 12 curved translucent tubes between tanks, width mapped linearly to flux in GtC/yr, each labelled with its process name | Yes: connect |
| 8 | Carbon beads | Particle | 3 px gold-brown spheres flowing along pipes, one bead per 0.1 GtC/yr, spacing shows rate at a glance | No |
| 9 | Tagged carbon atom | Particle | One bead scaled 3×, glowing, with a 4 s ribbon trail and a floating label naming its current reservoir | Yes: place |
| 10 | Photosynthesis engine | Field | Invisible rate node on the plant tank; draws from the atmosphere as a function of plant stock, light and temperature | No |
| 11 | Respiration and decay nodes | Field | Two invisible return nodes from plants and from soil back to the atmosphere; decay is temperature-sensitive | No |
| 12 | Combustion node | Actor | Freeway and power-station sprite with an animated exhaust plume; its rate is the fossil-fuel slider | Yes: swap |
| 13 | Wildfire event | Actor | Animated flame front across the redwood stand that transfers a slug of carbon from plants to atmosphere in one step | Yes: place |
| 14 | Ocean exchange valve | Instrument | Two-way gate between atmosphere and surface ocean; rate depends on the difference in partial pressure and on water temperature | No |
| 15 | Flux meter clamp | Instrument | Draggable clamp that snaps onto any pipe and reads its instantaneous flux and cumulative total | Yes: drag |
| 16 | Timeline scrubber | UI-Probe | Bottom-docked track, year 1750 to 2100, with a playhead and pinnable event markers | Yes: drag |

**How it works — the model.**
Five reservoirs hold stocks in gigatonnes of carbon; twelve fluxes move carbon between them each simulated year. Each stock updates by `S(t+1) = S(t) + Σ inflows − Σ outflows`, so the sum across all five tanks is constant unless the student explicitly opens the fossil valve, which moves carbon out of a store that had been sealed for millions of years. Photosynthesis scales with plant stock and light; plant and soil respiration scale with their own stocks and with temperature; ocean uptake scales with the atmosphere-to-surface difference and falls as the water warms. Default stocks and fluxes are rounded from published global estimates so the numbers are realistic without being fussy. The critical honesty is that fossil carbon is not a new kind of matter: it is the same element, previously parked. The sim must never draw carbon appearing from nowhere, and the ledger strip must always show the grand total flat while the valve is shut.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Fossil fuel burning | Slider | 0–15 | 9 | GtC/yr | Opens the fossil valve; adds carbon to the atmosphere |
| Forest cover | Slider | 0–150 | 100 | % of 1750 area | Plant stock and photosynthesis capacity |
| Global temperature offset | Slider | −2 to +5 | 0 | °C | Decay rate, respiration rate and ocean solubility |
| Ocean mixing | Slider | 0.2–4.0 | 1.0 | × baseline | Surface-to-deep exchange speed |
| Wildfire | Stepper | 0–5 | 0 | events/decade | Pulses of plant carbon into the atmosphere |
| Reservoir editor | Drag-handle | Resize any tank 0.5×–2× | 1× | × baseline | Structural: changes a starting stock and redraws the pipes |
| Tagged atom start | Dropdown | Atmosphere / Plants / Soil / Ocean / Fossil rock | Atmosphere | — | Where the glowing atom begins its tour |
| Run to year | Timeline scrubber | 1750–2100 | 2025 | year | How far forward the model integrates |
| Flux labels | Toggle | On / Off | On | — | Shows numeric GtC/yr on every pipe |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Pre-industrial balance | fossil=0; forest=100 %; temp=0; run to 1850 | With the fossil valve shut, do the tank levels drift? What does that say about inflow and outflow for the atmosphere? |
| S2 | Valve open | fossil=9 GtC/yr; forest=100 %; run to 2100 | Which tank empties and which fills, and where does roughly a quarter of the added carbon end up instead of the air? |
| S3 | Clear the forest | fossil=9; forest=40 %; run to 2100 | Cutting forests changes two fluxes at once. Name both, and say what happens to the atmosphere tank compared with S2. |
| S4 | Warm soil | fossil=6; temp=+3 °C; run to 2100 | Warming speeds decay. Does the soil tank act as a store or a source in this run, and how can you tell from the pipe widths? |

**Student activities.**
1. Set the tagged atom to start in the Atmosphere, run to 1850, and record every reservoir it enters with the year of each move.
2. Clamp the flux meter onto the photosynthesis pipe and onto the plant-respiration pipe in S1. Record both numbers and explain why the plant tank level barely moves.
3. Open the fossil valve to 9 GtC/yr, run to 2100, and record all five tank levels at 2025, 2050 and 2100. Add them and compare with the 1750 total.
4. Drag the Land plant tank handle to 0.5× and re-run S2. Record the 2100 atmosphere level and compare it with the unedited run.
5. Predict, before running S4, whether warming makes the soil tank rise or fall. Run it, record the soil flux at 2100, and correct your prediction in one sentence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Reservoir levels | Bar chart | GtC | Five bars updated each simulated year |
| Atmospheric CO₂ | Line graph | ppm | Converted from the atmosphere stock, 1750 to the run end |
| Flux table | Data table | GtC/yr | All twelve fluxes with names, exportable |
| Clamped pipe reading | Live numeric | GtC/yr and cumulative GtC | Instantaneous and running total on the selected pipe |
| Tagged atom itinerary | Data table | reservoir vs year | The gold atom's route, one row per move |
| Grand total carbon | Pass-fail badge | GtC | Green while the five-tank total is constant; flags the fossil valve as the only true source |
| Land and ocean uptake share | Bar chart | % of emissions | How much of the added carbon each sink absorbs |

**What the student should realise.**
Students believe carbon dioxide is "made" by cars and "destroyed" by trees. The tank-and-pipe ledger makes that untenable, because the grand total is flat until fossil rock is opened, and trees are shown parking carbon temporarily rather than removing it. Emissions are a transfer from a sealed store into a fast-moving loop. The student should be able to say: *"Burning fuel does not create carbon; it moves carbon that was locked in rock into the air, where the cycle then has to deal with it."*

### D3.4 · The nitrogen cycle, introduced

**Experiment name:** Under the Alfalfa: Four Microbe Crews  
**Render mode:** 3D Scene  
**Simulation engine:** Agent-based + Molecular  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
A soil cross-section stands like an aquarium slice, 400 mm wide and 500 mm deep, seen head-on. Above the surface, three alfalfa shoots and one young corn plant catch low warm light. Below, the root systems fan out through a dark crumb structure of soil aggregates, air pockets and glinting water films. Pink nodules the size of peppercorns bulge along the alfalfa roots, cut away on the nearest ones to show a coral-red interior packed with bacteria. In the air band above, blue N₂ molecules drift as tightly bonded pairs with a visible triple bond. Four microbe crews work in visibly different places, each with its own silhouette and colour. The control panel is docked right; a molecular loupe reads a 100 nm scale bar.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Soil profile block | Environment | 400×500×120 mm slice, front face clear; three horizons with distinct crumb sizes, 3 mm topsoil aggregates over 8 mm subsoil peds | No |
| 2 | Soil aggregates and pore space | Structure | Irregular clumped meshes with 20 % visible air-filled porosity; pore water drawn as glossy meniscus films that thicken with the moisture slider | No |
| 3 | Alfalfa plant | Actor | 180 mm stem with trifoliate leaves, taproot descending 320 mm with fine laterals; grows in visible increments when nitrogen supply allows | Yes: place |
| 4 | Corn plant (non-fixer) | Actor | 220 mm stem, strap leaves, fibrous root mat; has no nodules and depends entirely on soil nitrate | Yes: place, swap |
| 5 | Root nodule | Structure | 3 mm pink ovoid on the alfalfa root, cutaway variant showing coral-red leghaemoglobin interior with packed bacteroids; forms over 6 simulated days after infection | Yes: place |
| 6 | Crew 1 — Nitrogen fixers (*Rhizobium*) | Actor | 1.5 µm curved rods, deep magenta, living inside nodules and as free cells near roots; animation: grabs a drifting N₂ pair, the triple bond flashes and splits, and two NH₄⁺ badges are released | Yes: place |
| 7 | Crew 2 — Ammonia oxidisers | Actor | 1 µm spherical cells, amber, clustered on aggregate surfaces in well-aerated pores; convert NH₄⁺ to NO₂⁻ with a small oxygen bubble consumed per conversion | Yes: swap |
| 8 | Crew 3 — Nitrite oxidisers | Actor | 1.2 µm short rods, orange, always found beside Crew 2; convert NO₂⁻ to NO₃⁻ in a visibly separate second step | Yes: swap |
| 9 | Crew 4 — Denitrifiers | Actor | 2 µm fat rods, slate blue, active only inside waterlogged, oxygen-poor pores; convert NO₃⁻ back to N₂ gas which rises as bubbles and leaves the soil | Yes: swap |
| 10 | Decomposer crew (ammonifiers) | Actor | Grey-green rods and fine hyphae on dead root fragments; release NH₄⁺ from organic nitrogen | Yes: swap |
| 11 | N₂ molecules | Particle | Two blue spheres r=0.30 u joined by a three-cylinder bond bundle, drifting above the surface and in air-filled pores; the bond bundle is deliberately conspicuous | No |
| 12 | Nitrogen ion badges | Particle | NH₄⁺ as a blue-white tetrahedral cluster with a plus halo; NO₂⁻ as one blue and two red spheres; NO₃⁻ as one blue and three red spheres; organic N as a violet chain segment | No |
| 13 | Oxygen availability field | Field | Scalar field through the profile, driven by moisture and compaction; rendered as a pale wash, with anoxic pockets outlined in blue | No |
| 14 | Fertiliser applicator | Instrument | Hopper above the surface that broadcasts NH₄NO₃ granules; granules dissolve into badges over 2 simulated days | Yes: drag |
| 15 | Leaching drain and gauge | Instrument | Collection tray at 500 mm depth measuring nitrate washed below the root zone | No |
| 16 | Step-through stage controller | UI-Probe | Four-stop dial that isolates fixation, nitrification, assimilation or denitrification and dims the other three | Yes: drag |

**How it works — the model.**
Nitrogen atoms are tagged and conserved across six chemical forms: N₂ gas, NH₄⁺, NO₂⁻, NO₃⁻, organic N in living tissue, and organic N in dead matter. Each conversion is performed by a named microbe crew and only where that crew's conditions are met. Fixation runs inside nodules and needs plant sugar, so it stops if the plant is shaded. Nitrification is two separate steps by two separate crews and requires oxygen, so it collapses in waterlogged soil. Assimilation moves NO₃⁻ or NH₄⁺ into root tissue at a rate set by root surface area. Ammonification returns organic N to NH₄⁺ as dead matter decays. Denitrification runs only in anoxic pockets and is the one path that returns nitrogen to the air. Rates follow `flux = k · crew population · substrate · f(O₂, moisture, temperature)`. The sim must never let a plant absorb N₂ directly from the air, because "plants take nitrogen from the air" is precisely the misconception in play.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Crop planted | Dropdown | Alfalfa (nodulating) / Corn / Bare soil / Alfalfa + corn | Alfalfa | — | Structural: whether nodules and fixation exist at all |
| Microbe crews present | Multi-select | Fixers / Ammonia oxidisers / Nitrite oxidisers / Denitrifiers / Ammonifiers | All five | — | Structural: switch any crew out and break one step of the chain |
| Soil moisture | Slider | 10–100 | 45 | % of capacity | Oxygen field; above ~80 % anoxic pockets spread and denitrifiers wake |
| Soil temperature | Slider | 4–35 | 18 | °C | All microbial rates |
| Fertiliser application | Slider | 0–250 | 0 | kg N/ha | Adds NH₄NO₃ badges directly to the soil |
| Soil compaction | Slider | 0–100 | 30 | % | Pore space and therefore oxygen supply |
| Nodule count per plant | Stepper | 0–40 | 18 | count | Fixation capacity of the alfalfa |
| Stage isolation | Dial | All / Fixation / Nitrification / Assimilation / Denitrification | All | — | Dims every process but one for close inspection |
| Run length | Slider | 5–120 | 60 | simulated days | Length of the run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Alfalfa field | crop=Alfalfa; crews=all; moisture=45 %; fertiliser=0 | With no fertiliser at all, where does the nitrogen in the alfalfa's leaves come from? Trace one atom from air to leaf and name every crew that handled it. |
| S2 | Corn without nodules | crop=Corn; fertiliser=0; run=60 d | The corn yellows and stalls. Nitrogen gas is all around its leaves. Why can it not use it? |
| S3 | Flooded Central Valley field | moisture=95 %; crop=Corn; fertiliser=150 kg N/ha | Track the nitrate level after fertilising a waterlogged field. Which crew is thriving, and where is the nitrogen going? |
| S4 | Broken chain | crews=Fixers + Ammonifiers only (oxidisers removed); crop=Corn; run=60 d | Ammonium accumulates but nitrate stays near zero. Which two steps are missing, and which plant suffers most? |

**Student activities.**
1. Set the stage dial to Fixation and watch one nodule for 60 s. Record how many N₂ molecules are split per simulated day and what molecule leaves the nodule.
2. Step the dial through Nitrification and record the two separate products in order, naming the crew responsible for each.
3. Plant corn with fertiliser at 0, run 60 days, and record leaf nitrogen and plant height. Then plant alfalfa with the same settings and record both again.
4. Set moisture to 95 %, run 30 days, and measure the denitrification flux and the leaching gauge. Record where the nitrogen went, in two numbers.
5. Remove the ammonia oxidisers, run 60 days, and record the NH₄⁺ and NO₃⁻ levels. Restore them and re-record to show which step you had broken.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Nitrogen form inventory | Bar chart | mg N/kg soil | Six bars: N₂, NH₄⁺, NO₂⁻, NO₃⁻, living organic N, dead organic N |
| Process flux panel | Live numeric | mg N/kg/day | Fixation, nitrification step 1, step 2, assimilation, ammonification, denitrification |
| Soil nitrate over time | Line graph | mg N/kg | Trace vs simulated days, with fertiliser events marked |
| Tagged nitrogen atom route | Data table | form vs day | One row per conversion, naming the crew that did it |
| Plant nitrogen and height | Bar chart | mg N per plant, mm | Per plant, updated daily |
| Nitrogen lost to air | Counter | mg N/kg cumulative | Running total of denitrified nitrogen leaving the soil |
| Nitrate leached below root zone | Live numeric | mg N/kg | From the drain gauge at 500 mm |
| Crew populations | Line graph | cells ×10⁶/g | One trace per microbe crew |

**What the student should realise.**
Students believe plants take nitrogen straight from the air, since the air is four-fifths nitrogen and plants are surrounded by it. Watching corn starve in a nitrogen-rich atmosphere while alfalfa thrives on the output of bacteria inside its own nodules makes that untenable. The N₂ triple bond has to be broken by a living crew before any plant can use the atom. The student should be able to say: *"Nitrogen gas is useless to plants until certain bacteria convert it, and different bacteria run each step of the loop that eventually sends it back to the air."*

### D3.5 · Modeling matter and energy together

**Experiment name:** The Loop and the One-Way Street  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Data-driven model + Particle system  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-3

**Theme & scene.**
The screen splits. On the left, a Sierra foothill clearing sits under a low glass dome: blue oak, bunchgrass, a mule deer browsing, a bobcat resting on granite, fungi fruiting on a fallen limb, all in warm late-afternoon light. The dome is sealed at the sides but its roof is an open grille, and faint orange shimmer escapes through it. On the right, the same scene is redrawn live as a flow board: five reservoir nodes joined by pipes. Two tracer types move through both halves at once. Blue matter tokens travel a closed circuit and always come back. Gold energy tokens enter from a sun icon, travel one way up the chain, and shed dull-red heat quanta that rise and vanish through the grille. The control panel is docked right; a heat-loss counter sits under the grille.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Glass dome and heat grille | Environment | Hemisphere 600 mm across in clear glass; sides opaque to matter, roof a fine louvre through which only heat quanta may pass; louvre can be shut by the student | Yes: swap |
| 2 | Sun source | Instrument | Warm disc at the upper left with a beam cone; emits gold energy tokens at a rate set by the irradiance slider; can be switched off entirely | Yes: drag |
| 3 | Blue oak and bunchgrass (producers) | Actor | 320 mm oak with lobed leaves plus a 60 mm grass sward, sage-green; leaves flash faintly each time they capture an energy token | Yes: place, resize |
| 4 | Mule deer (primary consumer) | Actor | 140 mm quadruped, dun coat, black-tipped tail; browses grass on a 20 s cycle, one bite transferring both token types | Yes: place |
| 5 | Bobcat (secondary consumer) | Actor | 90 mm spotted cat, tawny with barred forelegs; hunts on a 3-simulated-day cycle | Yes: place |
| 6 | Fungi and soil microbes (decomposers) | Actor | Cream bracket fungi 30 mm plus a slate haze on the fallen limb; take tokens from any carcass or litter | Yes: place |
| 7 | Matter tokens | Particle | 4 px blue-white cubes, 240 of them, numbered; move between reservoirs and can never leave the dome while the sides are sealed | Yes: place |
| 8 | Energy tokens | Particle | 4 px gold teardrops with a soft bloom; created only at the sun, destroyed only by conversion into heat quanta | No |
| 9 | Heat quanta | Particle | 3 px dull-red motes, wobbling upward at 20 mm/s, deleted when they pass the grille; every trophic transfer spawns them | No |
| 10 | Flow board nodes | Overlay | Five rounded panels on the right half (Sun, Producers, Primary consumers, Secondary consumers, Decomposers + soil), each showing its current matter and energy totals | No |
| 11 | Matter pipes | Overlay | Closed circuit of blue pipes with arrowheads, returning from decomposers to producers, so the loop visibly closes | No |
| 12 | Energy pipes | Overlay | Gold pipes running strictly one way, each with a wide red side-branch labelled "lost as heat", none returning to the sun | No |
| 13 | Trophic transfer engine | Field | Invisible node on each feeding link applying the transfer efficiency and spawning the corresponding heat quanta | No |
| 14 | Heat grille counter | Instrument | Digital readout mounted on the louvre totalling heat quanta that have left the dome | No |
| 15 | Dual ledger strip | Overlay | Two horizontal bars along the bottom: total matter inside the dome, and total usable energy inside the dome, side by side | No |
| 16 | Token inspector | UI-Probe | Click any token to pin it and show a scrolling history of every reservoir it has occupied | Yes: drag |

**How it works — the model.**
Two tracer systems run on the same food web with deliberately different rules. Matter tokens obey strict conservation: every feeding, death and decay event moves a token from one reservoir to another, and the decomposer node returns tokens to the soil pool that producers draw from, so the circuit closes and the matter ledger bar never changes length while the dome sides are sealed. Energy tokens obey a one-way rule: at every transfer, a fixed efficiency (default 10 %) passes forward and the remainder is immediately converted into heat quanta that rise and exit. Producers convert incoming sunlight at about 1 %. Nothing in the model can turn heat quanta back into gold tokens, and there is no pipe from any reservoir back to the sun. If the sun is switched off, the matter loop keeps turning briefly while the energy ledger drains to zero and the system dies. That asymmetry, shown by two tracers in one scene, is the whole experiment.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Sunlight input | Slider | 0–1600 | 800 | W/m² | Rate of gold token creation at the producers |
| Dome sides | Toggle | Sealed / Open | Sealed | — | Whether matter tokens may leave the system |
| Heat grille | Toggle | Open / Shut | Open | — | Structural: shutting it traps heat and raises dome temperature |
| Trophic transfer efficiency | Slider | 2–25 | 10 | % | How much energy passes to the next level per feeding event |
| Food web members | Multi-select | Producers / Deer / Bobcat / Decomposers | All four | — | Structural: removes a node and its pipes from both halves |
| Decomposer return | Toggle | On / Off | On | — | Whether the matter circuit closes or dead-ends in litter |
| Tracer view | Radio | Matter only / Energy only / Both | Both | — | Which token type is drawn |
| Run length | Slider | 10–400 | 120 | simulated days | Length of the run |
| Time compression | Dial | 10×–5000× | 800× | — | Simulated days per real second |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Sun on, dome sealed | sunlight=800; sides=Sealed; grille=Open; web=all four | Run 120 days. Which ledger bar stays the same length and which one only holds up while the sun shines? |
| S2 | Sun off | sunlight=0; sides=Sealed; run=60 d | The matter total has not changed but everything dies. Explain what ran out, using the heat counter as evidence. |
| S3 | Loop broken | decomposer return=Off; sunlight=800; run=200 d | Matter piles up in the litter node. What happens to the producers, and is any matter actually lost from the dome? |
| S4 | Trap the heat | grille=Shut; sunlight=800; run=60 d | With heat unable to leave, dome temperature climbs and organisms fail. Does trapped heat become usable energy again? |

**Student activities.**
1. Set the tracer view to Matter only, pin token #12, and record every reservoir it visits over 60 days. Then set the view to Energy only and try to pin one gold token for the same length of time. Record what happens to it.
2. Run S1 and record both ledger bars at days 0, 40, 80 and 120. State which one is flat and which one depends on the sun.
3. Switch the sun off and record the heat grille counter and the energy ledger every 10 days until the ledger hits zero. Record the day it does.
4. Turn decomposer return off, run 200 days, and record the matter held in the litter node and in the producers. Confirm from the matter ledger that none of it left the dome.
5. Compare the energy arriving at the bobcat with the energy captured by the producers in S1, and write the ratio as a single number.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Matter ledger | Live numeric | tokens | Total matter inside the dome; flat while the sides are sealed |
| Energy ledger | Live numeric | tokens | Total usable energy inside the dome; falls whenever the sun dips |
| Heat lost through the grille | Counter | quanta cumulative | Running total of energy leaving as heat, updated every tick |
| Matter by reservoir | Bar chart | tokens | Five bars, showing redistribution without change in the total |
| Energy by trophic level | Bar chart | tokens | The pyramid shape appears without being drawn as a pyramid |
| Population survival | Line graph | count | Producers, deer, bobcat, decomposers vs simulated days |
| Pinned token history | Data table | reservoir vs day | Route of a chosen matter token; energy tokens end at "heat, gone" |
| Dome temperature | Live numeric | °C | Rises when the grille is shut, showing where the energy actually went |

**What the student should realise.**
Students believe energy is recycled like matter, and that a food chain "passes energy round". Running both tracers in one scene makes that untenable: the blue circuit closes and its total never changes, while gold tokens march one way and end as heat that physically leaves through the roof and never comes back. The student should be able to say: *"Matter goes round and round in an ecosystem, but energy only passes through once and leaves as heat, so the sun has to keep resupplying it."*

## D4 · Patterns of interaction among organisms · MS-LS2-2

### D4.1 · Competition and predation

**Experiment name:** Chase, Lag and Crowd-Out  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-2

**Theme & scene.**
A dry Sierra foothill meadow seen from a low, wide angle: golden bunchgrass, scattered blue oaks, a granite outcrop, dust hanging in warm light. Black-tailed jackrabbits graze in loose groups and freeze when a coyote crests the ridge; the coyote quarters the grass with its nose down. Along a fenceline, two small seed-eaters work the same patch of buckwheat seed: a kangaroo rat that hops and a pocket mouse that scurries. Docked below the meadow is a dark graph panel where two population traces climb and fall out of step, with a movable caliper that measures the gap between their peaks. The control panel is docked right; a census hoop can be dropped anywhere on the meadow to count animals inside it.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Meadow terrain | Environment | 200×140 m plot, low-poly rolling ground, straw-gold grass shader with wind ripple at 0.3 Hz | Yes: resize |
| 2 | Bunchgrass and buckwheat patches | Structure | 300–900 instanced tussocks 400 mm high plus 120 seed-bearing buckwheat clumps; regrow at a slider-set rate and thin visibly when overgrazed | Yes: place |
| 3 | Blue oak and granite outcrop | Structure | Three 6 m oaks and a 4 m granite slab providing shade and cover patches that alter capture probability | Yes: drag |
| 4 | Black-tailed jackrabbit | Actor | 480 mm body, tan with black ear tips, bounding gait at 3 m/s, freeze-then-flee behaviour, breeds when local grass is above threshold | Yes: place |
| 5 | Coyote | Actor | 900 mm body, grizzled grey-buff, trotting search at 1.6 m/s with a 12 m detection radius and a 40 m sprint; starves if its energy store empties | Yes: place |
| 6 | Kangaroo rat | Actor | 110 mm body with a 150 mm tufted tail, sandy; bipedal hops, caches seed, tolerates dry conditions well | Yes: place |
| 7 | Pocket mouse | Actor | 80 mm body, greyish; quadrupedal scurry, forages faster per second but needs more water | Yes: place |
| 8 | Seed resource field | Field | Scalar seed-density field on a 2 m grid; consumed by both rodents, regrows logistically; the shared resource that drives competition | No |
| 9 | Grass biomass field | Field | Second scalar field on the same grid feeding the jackrabbits; regrowth rate is slider-driven | No |
| 10 | Predator detection cone | Overlay | Translucent wedge in front of the coyote, 12 m long and 120° wide, brightening when prey enters | No |
| 11 | Territory and cover overlay | Overlay | Toggleable hatching showing high-cover cells where capture probability drops by half | No |
| 12 | Coupled population graph | Overlay | Two-axis dark panel plotting predator and prey counts against simulated weeks, traces in tan and slate | No |
| 13 | Phase-lag caliper | Instrument | Draggable two-legged marker on the graph; snaps to peaks and reads the delay between them in weeks | Yes: drag |
| 14 | Census hoop | Instrument | 20 m translucent ring dropped on the meadow; counts each species inside it and reports density per hectare | Yes: place, resize |
| 15 | Niche overlap dial (resource partitioning) | Field | Sets what fraction of seed sizes both rodents can eat; at 100 % they eat identically, at 0 % they use separate seed sizes | No |
| 16 | Event timeline | UI-Probe | Bottom strip with pinnable markers for drought, predator removal and introductions | Yes: drag |

**How it works — the model.**
Two coupled systems share one meadow. The predator-prey pair runs agent-by-agent: rabbits eat grass and breed above an energy threshold; coyotes search, detect within a cone, capture with a probability reduced by cover, and starve without kills. Because a coyote must first eat before it can breed, and a rabbit population must first grow before it can feed many coyotes, the two curves cannot peak together. The engine deliberately produces that delay from the agents' own energy budgets rather than imposing it, and the caliper measures it. The rodent pair runs on a shared seed field: each species has a consumption rate and a set of seed sizes it can handle. Where the overlap is total, the species with the marginally better rate drives the other to zero, slowly and without any fighting animation, because exclusion is a matter of arithmetic, not aggression. Where overlap is partial, both persist at lower densities.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Starting jackrabbits | Slider | 0–200 | 60 | count | Initial prey population |
| Starting coyotes | Slider | 0–20 | 4 | count | Initial predator population |
| Grass regrowth rate | Slider | 0.1–5.0 | 1.5 | % biomass/day | Carrying capacity for prey |
| Cover density | Slider | 0–80 | 25 | % of cells | Fraction of the meadow where capture probability halves |
| Competitor pair | Multi-select | Kangaroo rat / Pocket mouse | Both | — | Structural: which seed-eaters are present |
| Niche overlap | Slider | 0–100 | 100 | % of seed sizes shared | How completely the two rodents use the same food |
| Predator removal | Toggle | Coyotes present / Removed at week 20 | Present | — | Structural: deletes all coyotes mid-run |
| Drought | Slider | 0–80 | 0 | % cut in regrowth | Reduces both grass and seed production |
| Run length | Slider | 20–300 | 150 | simulated weeks | Length of the run drawn on the graph |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Coyotes and hares | rabbits=60; coyotes=4; grass=1.5; run=150 wk | Measure the delay between each rabbit peak and the coyote peak that follows it. Is the delay roughly the same every cycle? |
| S2 | Remove the predator | predator removal=Removed at week 20; run=150 wk | Rabbits surge, then crash without a coyote in sight. What ran out, and what does that show about who else limits prey numbers? |
| S3 | Identical rivals | pair=Both; overlap=100 %; coyotes=0; run=300 wk | Two seed-eaters, exactly one food supply. What happens to the second species, and how long does it take? |
| S4 | Split the seeds | pair=Both; overlap=30 %; run=300 wk | With the seed sizes partly divided, can both species persist? Record both final densities. |

**Student activities.**
1. Run S1 for 150 weeks. Drag the caliper onto the first rabbit peak and the following coyote peak, and record the lag in weeks. Repeat for two more cycles.
2. Predict which curve leads and which follows before running. Record your prediction, then correct it in one sentence using the caliper reading.
3. Remove the coyotes at week 20 and record rabbit numbers and grass biomass every 10 weeks to week 100. Note the week of the crash.
4. Set niche overlap to 100 % with no predators, run 300 weeks, and record the week each rodent species falls below 5 individuals.
5. Drop the census hoop on a high-cover patch and on open ground. Record rabbit density per hectare in each and explain the difference in one sentence.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Coupled population graph | Line graph | count vs weeks | Predator and prey traces on shared axes, the out-of-step pattern being the point |
| Phase lag | Live numeric | weeks | Caliper reading between paired peaks |
| Competitor populations | Line graph | count vs weeks | Kangaroo rat and pocket mouse traces |
| Grass and seed biomass | Line graph | g/m² | Both resource fields vs time |
| Kills per week | Counter | kills/week | Coyote hunting success, updated weekly |
| Census hoop density | Live numeric | animals/ha | Local density inside the placed hoop |
| Time to exclusion | Timer | simulated weeks | Weeks until a competitor drops below 5 individuals |
| Run comparison | Data table | mixed | One row per run: settings, peak values, lag, outcome; exportable |

**What the student should realise.**
Students believe predators simply wipe out prey, and that competition means animals fighting. Neither survives this meadow. Predator and prey numbers rise and fall together with a measurable delay, each one limiting the other, and when the coyotes are removed the rabbits crash anyway once the grass runs out. The rodents never touch each other, yet one still disappears. The student should be able to say: *"Predators and prey control each other on a delay, and competition can push a species out with no fighting at all, just by taking the same food."*

### D4.2 · Mutualism, commensalism and parasitism

**Experiment name:** The Fitness Ledger: Who Gains, Who Pays  
**Render mode:** 3D Scene  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-2

**Theme & scene.**
A long dark-walled gallery holds five lit habitat pods, each a glass drum about a metre across, arranged like specimen tanks. Pod 1 is a warm reef nook where a clownfish shelters among the stinging tentacles of a sea anemone. Pod 2 is a soil block with a blue oak seedling whose roots are sleeved in pale fungal threads. Pod 3 is a Mojave night: a yucca in flower with a small white moth working the blossoms. Pod 4 is a Central Valley pasture with a cow and a cattle egret stepping beside its hooves. Pod 5 is a foothill scene with a mule deer carrying ticks and an oak burdened with mistletoe. Above each pod hang two fitness dials, one per partner. The control panel is docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Habitat pod frame | Environment | Glass drum 1000 mm across on a brushed steel plinth, individually lit, with a species label plate and a swap socket | Yes: swap |
| 2 | Sea anemone | Actor | 180 mm column, ochre, crowned with 120 pale tentacles 60 mm long, each carrying animated stinging cells that flash on contact with any fish but the clownfish | Yes: place |
| 3 | Clownfish | Actor | 70 mm ovoid body, orange with three white bands, mucus coat rendered as a faint sheen; darts out to chase butterflyfish and returns; carries scraps back to the anemone | Yes: place |
| 4 | Blue oak seedling and root system | Actor | 200 mm shoot, taproot with 40 fine laterals; root tips glow faintly where fungal contact is active | Yes: place, resize |
| 5 | Mycorrhizal fungal sheath and hyphae | Actor | Pale cream sleeve 0.2 mm thick over root tips, extending 60 mm of 5 µm hyphae into the soil; the hyphae reach soil volume the roots cannot | Yes: swap |
| 6 | Yucca and flower cluster | Actor | 900 mm rosette of stiff blades with a 600 mm flower spike bearing 30 cream bells; ovules visible in a cutaway ovary | Yes: place |
| 7 | Yucca moth | Actor | 18 mm white moth with specialised mouth tentacles; collects pollen into a ball, flies to another flower, packs pollen onto the stigma, then lays eggs among the ovules | Yes: place |
| 8 | Cow and cattle egret | Actor | 1.4 m cow with a plodding walk that flushes insects from the grass; 500 mm white egret stepping alongside, snatching flushed insects; the cow's behaviour is unaffected by the egret's presence | Yes: place |
| 9 | Mule deer with ticks | Actor | 1.2 m deer; 0–60 tick sprites 3 mm long attached at ears and flanks, each drawing a fixed blood volume per day and shown swelling | Yes: place |
| 10 | Oak with mistletoe | Actor | 5 m oak carrying 0–8 mistletoe clumps 400 mm across, olive-green, each with haustoria drawn tapping into a branch and drawing water and nutrients | Yes: place |
| 11 | Insect prey swarm | Particle | 200 instanced 6 mm insects in the pasture pod, flushed upward in a burst when the cow's hoof lands | No |
| 12 | Fitness dials | Instrument | Paired analogue dials above each pod reading −100 to +100 % change against a solo baseline, with a coloured sign badge (+, 0 or −) | No |
| 13 | Partner removal switch | Instrument | Toggle beside each pod that deletes one partner and re-runs the pod against the same baseline | Yes: swap |
| 14 | Baseline solo control pod | Structure | Sixth dimmed pod containing each organism alone; supplies the reference values the dials compare against | No |
| 15 | Sign table | Overlay | Live five-row grid with a +/0/− cell per partner, filled in automatically as each pod finishes a run | No |
| 16 | Interaction inspector loupe | UI-Probe | Click any pair to open a slow-motion close-up of the exchange with an annotated cost and benefit list | Yes: drag |

**How it works — the model.**
Every organism carries a fitness score built from three measured quantities: survival probability, growth rate and offspring produced. Each pod is run twice, once with both partners and once against a stored solo baseline, and the dials display the percentage change. The interaction type is never declared by a label; it is derived from the pair of signs the model produces. Clownfish gain shelter while the anemone gains cleaning and defence, so both dials read positive. The fungal sheath supplies phosphorus from soil the roots cannot reach and takes sugar in return, again both positive. The yucca moth is the only pollinator that fits the flower and its larvae eat a portion of the seeds, so the score is positive on both sides but visibly costly. The egret gains insects while the cow's numbers are statistically unchanged, giving plus and zero. Ticks and mistletoe take blood, water and nutrients, so one dial rises while the other falls in proportion to the parasite load.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active pod | Dropdown | Anemone + clownfish / Oak + mycorrhizae / Yucca + moth / Cow + egret / Deer + ticks / Oak + mistletoe | Anemone + clownfish | — | Which pair is centre stage and instrumented |
| Partner present | Toggle | Both partners / Partner removed | Both partners | — | Structural: deletes one organism and re-runs against baseline |
| Parasite load | Slider | 0–80 | 20 | ticks per deer, or clumps per oak | Size of the cost imposed on the host |
| Soil phosphorus | Slider | 1–60 | 8 | mg/kg | How much the oak actually needs its fungal partner |
| Predator pressure in reef pod | Slider | 0–10 | 4 | attacks/day | How valuable the anemone's shelter is to the clownfish |
| Moth egg load | Stepper | 0–20 | 6 | eggs per flower | Seeds eaten by larvae against seeds set by pollination |
| Run length | Slider | 30–365 | 180 | simulated days | Length of each pod run |
| Show cost and benefit tags | Toggle | On / Off | On | — | Floating labels on each exchange in the pod |
| Compare pods | Multi-select | Any two to five pods | Pods 1 and 5 | — | Puts chosen pods side by side in the sign table |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Both gain | pod=Anemone + clownfish; predator pressure=4; run=180 d | Record both dials. What does each partner actually give the other, and what are the two signs? |
| S2 | One gains, one pays | pod=Deer + ticks; parasite load=60; run=180 d | Put a number on the cost: how much does the deer's fitness fall, and does the parasite benefit from killing its host? |
| S3 | One gains, one unaffected | pod=Cow + egret; run=180 d | The egret's dial is clearly positive. Read the cow's dial. What does a reading of zero mean about this relationship? |
| S4 | Partner removed | pod=Oak + mycorrhizae; soil phosphorus=4; partner=Partner removed | With the fungus gone from poor soil, record the oak's growth. Which partner turns out to have needed the other more? |

**Student activities.**
1. Run each of the five pods for 180 days and record both fitness dials for each. Fill in the sign table with +, 0 or − for every partner.
2. Remove the anemone from pod 1 and re-run. Record the clownfish's survival, then restore it and record again.
3. Set the tick load to 0, 20, 40 and 60 in turn, running 180 days each time, and plot deer fitness against parasite load.
4. Set soil phosphorus to 4 mg/kg and then to 50 mg/kg with the fungus present, and record the oak's growth in both. Write one sentence about when the partnership matters most.
5. Compare pod 3 and pod 5 side by side and explain, using the moth's egg load, why a relationship can be a partnership even when one side takes something.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Fitness change per partner | Live numeric | % vs solo baseline | The two dials above the active pod, updated daily |
| Sign table | Data table | +, 0 or − | Five rows, two cells each; the classification the student builds from evidence |
| Host cost curve | Line graph | % fitness vs parasite load | Built point by point as the student steps the load slider |
| Survival probability | Bar chart | % surviving 180 days | Each organism with and without its partner |
| Offspring produced | Counter | count per run | Direct fitness measure for both partners |
| Nutrient or food transferred | Live numeric | mg/day or items/day | Phosphorus to the oak, sugar to the fungus, insects to the egret, blood to the tick |
| Seeds set against seeds eaten | Bar chart | seeds per flower | The yucca pod's balance sheet |
| Run comparison | Data table | mixed | One row per pod run with settings and both dial values; exportable |

**What the student should realise.**
Students believe relationships between species are either friendly or hostile, and that a partner that takes anything must be an enemy. Reading two fitness dials per pod makes that untenable: the categories are simply the pairs of signs, and the yucca moth takes seeds while remaining essential. Cost and benefit are measured, not assumed. The student should be able to say: *"You classify a relationship by measuring what happens to each partner: both up is mutualism, up and unchanged is commensalism, up and down is parasitism."*

### D4.3 · The same pattern in very different ecosystems

**Experiment name:** Three Places, One Pattern  
**Render mode:** 2.5D Layered  
**Simulation engine:** Agent-based + State machine  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-2

**Theme & scene.**
Three tall viewports stand side by side like windows in a gallery wall, each running its own living scene. Left: a Monterey kelp forest in green underwater light, giant kelp fronds swaying upward from holdfasts, urchins on the rock, a sea otter rolling at the surface. Centre: a Sierra foothill oak woodland in dry golden light, blue oaks and acorn woodpeckers, ground squirrels, a gopher snake in the leaf litter. Right: a Mojave bajada at dusk, creosote and yucca on pale gravel, kangaroo rats, a sidewinder, a kit fox. Below the viewports runs a rail of blank role cards. Drag a card into a viewport slot and the matching organism is spotlit in all three scenes at once. The control panel is docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Viewport frames | Environment | Three 420×700 px windows with brushed dark surrounds, each independently pan and zoom capable, each running its own agent population | No |
| 2 | Kelp forest backdrop | Environment | Six parallax layers of green water with god-rays, a rocky reef floor, and drifting particulate; surface shimmer on the top layer | No |
| 3 | Oak woodland backdrop | Environment | Five layers, straw-gold understorey, scattered blue oaks, granite knuckles, heat haze near the ground | No |
| 4 | Mojave bajada backdrop | Environment | Five layers of pale alluvial gravel, evenly spaced creosote, distant ranges in dusk violet | No |
| 5 | Producer set | Actor | Giant kelp blades 8 m with pneumatocysts; blue oak canopy with acorn crop; creosote with resinous leaves and yucca rosette; each grows and is grazed | Yes: swap |
| 6 | Primary consumer set | Actor | Purple urchin 70 mm with moving spines; California ground squirrel 250 mm; Merriam's kangaroo rat 110 mm with tufted tail; each feeds on its scene's producer | Yes: place |
| 7 | Predator set | Actor | Sea otter 1.2 m rolling and hammering urchins on its chest; gopher snake 1.4 m in a searching crawl; sidewinder 600 mm with its looping sideways track and kit fox 500 mm with oversized ears | Yes: place |
| 8 | Mutualist pair set | Actor | Kelp holdfast with encrusting bryozoans; oak roots with mycorrhizal sheath; yucca with yucca moth; each pod animates its exchange | Yes: place |
| 9 | Role cards | UI-Probe | Six draggable cards labelled Producer, Primary consumer, Predator, Decomposer, Mutualist, Competitor, blank of any species name | Yes: drag, place |
| 10 | Role slots | Structure | Five empty sockets beneath each viewport that accept a card and bind it to a species in that scene | Yes: connect |
| 11 | Pattern-match scorer | Instrument | Compares the interaction network the student has assembled across the three scenes and scores structural equivalence out of 100 | No |
| 12 | Interaction arrow overlay | Overlay | Coloured arrows drawn between filled slots: red for eats, green for mutual benefit, grey for competes; identical arrow shapes appear in all three viewports when the pattern matches | No |
| 13 | Synchronised perturbation bar | Instrument | Single control that removes the predator, or halves the producers, in all three viewports simultaneously | Yes: swap |
| 14 | Population strip charts | Overlay | Three stacked mini-graphs, one per ecosystem, on a shared time axis so the shapes can be compared directly | No |
| 15 | Species dossier card | UI-Probe | Hover any organism for a card with its name, diet, size, and its role in that ecosystem | Yes: drag |
| 16 | Scale reference bar | Overlay | Per-viewport bar showing metres, since the three scenes differ enormously in physical scale | No |

**How it works — the model.**
One interaction engine runs three parameter sets. Each ecosystem holds the same abstract nodes (producer, primary consumer, predator, decomposer, mutualist pair) filled by different species with different rates: kelp grows fast and is grazed hard, oak grows slowly with a pulsed acorn crop, creosote grows very slowly with long dormancy. Because the structure is shared, a perturbation applied to all three at once produces the same qualitative response with different timescales: remove the otter and urchins boom and strip the kelp within a season; remove the snake and squirrels boom over a few years; remove the kit fox and kangaroo rats boom over a decade. The scorer checks whether the student's assembled arrow network is structurally identical across scenes, not whether the species names match. The honest simplification is that only one strand of each real food web is modelled, and the sim says so on the dossier cards.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Ecosystems shown | Multi-select | Kelp forest / Oak woodland / Mojave bajada | All three | — | Structural: which viewports are live |
| Role assignment | Drag-handle | Six cards into five slots per viewport | Empty | — | Structural: builds the interaction network the scorer grades |
| Synchronised perturbation | Dropdown | None / Remove predator / Halve producers / Add competitor / Remove mutualist | None | — | Applies the same shock to every live viewport at once |
| Run length | Slider | 1–40 | 10 | simulated years | Length of the run on the strip charts |
| Time alignment | Toggle | Real time / Normalised time | Real time | — | Normalised stretches each scene's axis so shapes can be overlaid |
| Producer growth multiplier | Slider | 0.2–3.0 | 1.0 | × baseline | Scales productivity in every scene at once |
| Predator starting number | Stepper | 0–20 | 6 | count per scene | Initial predator population in each viewport |
| Arrow overlay | Toggle | On / Off | On | — | Draws the interaction arrows between filled slots |
| Dossier cards | Toggle | On / Off | On | — | Hover information for every species |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Fill the slots | ecosystems=all three; perturbation=None; run=10 yr | Assign all six role cards in each viewport. What score does the pattern matcher give, and which slot was hardest to fill in the Mojave? |
| S2 | Pull the predator | perturbation=Remove predator; run=20 yr | The same shock in three places. Compare the three strip charts: what is the same about the shapes, and what is different about the timing? |
| S3 | Normalise the clock | perturbation=Remove predator; time alignment=Normalised | With each scene's time axis stretched to the same length, how similar do the three responses look now? |
| S4 | Lean years | producer growth=0.4; run=40 yr | Cut productivity everywhere. Which ecosystem's populations fall furthest, and what does its producer's growth rate have to do with it? |

**Student activities.**
1. Drag the Producer, Primary consumer and Predator cards into all three viewports and record which species you chose for each slot.
2. Run S1 for 10 years and record the pattern-match score. Fix any mismatched arrow and record the improved score.
3. Apply Remove predator to all three at once, run 20 years, and record the peak primary-consumer number and the year it occurs in each ecosystem.
4. Switch time alignment to Normalised and sketch the three curves on one axis. Write one sentence on how alike they are.
5. Set producer growth to 0.4, run 40 years, and record final populations in all three. Rank the ecosystems by how hard they were hit.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Pattern-match score | Pass-fail badge | 0–100 | How structurally identical the three assembled networks are |
| Population strip charts | Line graph | count vs years | Three stacked panels on a shared or normalised axis |
| Peak consumer number and year | Data table | count, year | Per ecosystem after a perturbation |
| Response time to perturbation | Live numeric | simulated years | Time from the shock to the peak in each scene |
| Producer biomass | Line graph | relative units | Kelp, oak and creosote biomass on common relative axes |
| Role slot audit | Data table | filled / empty | Which roles the student assigned in each viewport |
| Arrow network map | Vector overlay | — | The interaction diagram the student built, exportable as an image |

**What the student should realise.**
Students believe ecosystems are lists of local species and that a kelp forest has nothing to do with a desert. Running one engine behind three unrelated scenes and applying the identical shock makes that untenable: the same roles are present in each, the same arrows connect them, and the response curves have the same shape once the clocks are matched. Only the names and the timescales differ. The student should be able to say: *"Different places have completely different species, but the same patterns of interaction repeat, so what I learn in one ecosystem helps me predict another."*

### D4.4 · Interactions that shift over time or condition

**Experiment name:** When Partners Turn: Finding the Tipping Point  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** State machine + Agent-based  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-2

**Theme & scene.**
Two lit bays face each other across a dark bench. The left bay is a soil column: a blue oak seedling with its roots sleeved in pale mycorrhizal threads, a fertiliser hopper poised above the surface, and a phosphorus dial set into the glass. The right bay is a warm reef ledge where a bluestreak cleaner wrasse works a queue of client fish, darting into gills and mouths; a small counter above it tallies parasites removed and mucus bites stolen. Between the bays hangs the Sign Board: a single large plus-or-minus badge for each partner that visibly flips as conditions cross a threshold. Below both bays lies a two-axis sign map that fills in with colour as the student sweeps conditions. The control panel is docked right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Soil column bay | Environment | 300×600 mm glass column, crumb-structured soil, front face clear, root zone lit from a low angle | No |
| 2 | Blue oak seedling | Actor | 240 mm shoot with four leaf pairs, taproot to 400 mm with 60 fine laterals; leaf area and stem height are its measured fitness | Yes: place, resize |
| 3 | Mycorrhizal sheath and hyphal net | Actor | Cream 0.2 mm sleeve on root tips extending 80 mm of 5 µm hyphae; hyphae glow faint blue when delivering phosphorus and faint amber when drawing sugar | Yes: swap |
| 4 | Sugar and phosphorus exchange tokens | Particle | 3 px amber tokens travelling root to fungus, 3 px blue tokens travelling fungus to root; token counts are the raw exchange data | No |
| 5 | Fertiliser hopper | Instrument | 90 mm hopper on a rail above the column; broadcasts phosphate granules that dissolve over two simulated days | Yes: drag |
| 6 | Soil phosphorus field | Field | Scalar field through the column, 1–120 mg/kg, rendered as a violet wash of increasing saturation | No |
| 7 | Reef ledge bay | Environment | 500 mm coralline ledge in warm blue-green water with drifting motes and a soft caustic pattern | No |
| 8 | Cleaner wrasse | Actor | 90 mm slender fish, pale blue with a black lateral stripe, hovering dance to advertise, darting into gill covers; carries a hunger state that rises between meals | Yes: place |
| 9 | Client fish queue | Actor | 6–24 clients 200–400 mm long in three species, hovering in a loose line, posing with fins spread; each carries a parasite count and a mucus reserve | Yes: place |
| 10 | Gill parasites | Particle | 2 mm pale isopod sprites clinging to gills and flanks, 0–40 per client, removed one at a time by the cleaner | No |
| 11 | Mucus bite marker | Overlay | Small red flash on a client's flank each time the cleaner cheats and takes mucus instead of a parasite; clients jolt and may leave the queue | No |
| 12 | Sign Board | Overlay | Two large badges, one per partner, reading + or − with the interaction name beneath; flips live and logs the tick at which it flipped | No |
| 13 | Sign map | Overlay | Two-axis heat map, condition on x, second condition on y, each cell shaded green for mutualism, grey for neutral and red for parasitism as it is sampled | No |
| 14 | Condition sweep dial | Instrument | Dial that ramps the chosen condition smoothly across its whole range while the run continues, drawing a live trace | Yes: drag |
| 15 | Season timeline | Instrument | Twelve-month strip that can drive conditions automatically, so the same pair changes sign across a year | Yes: drag |
| 16 | Fitness meters | Instrument | Paired dials per bay reading percentage change against a partner-free baseline, identical in style to the ledger the student met earlier | No |

**How it works — the model.**
Each partnership is a state machine with two states, Mutualism and Exploitation, and the transition is driven by a measured net benefit rather than by a label. In the soil bay, the oak pays a fixed sugar cost per unit of hyphal network and receives phosphorus that the hyphae reach beyond the root zone. When soil phosphorus is low the delivered phosphorus is worth far more than the sugar, so both fitness meters are positive. As fertiliser raises soil phosphorus, the roots can get phosphorus unaided while the sugar bill stays the same, so the oak's meter crosses zero and turns negative: the same fungus, unchanged, is now a parasite. In the reef bay, the cleaner chooses between eating a parasite and biting mucus, weighted by hunger and by queue length; cheating raises the cleaner's fitness and lowers the client's. Cheating is punished when clients can leave, which is why long queues make cleaners behave. Nothing about either partner's identity changes; only the conditions do.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active bay | Dropdown | Oak + mycorrhizae / Reef cleaner + clients / Both | Oak + mycorrhizae | — | Which partnership is instrumented |
| Soil phosphorus | Slider | 1–120 | 6 | mg/kg | The condition that flips the fungal partnership |
| Fungal network size | Slider | 10–200 | 80 | mm of hyphae per root tip | Sugar cost paid by the oak |
| Light available to the oak | Slider | 50–1500 | 600 | µmol/m²/s | How easily the oak can afford the sugar bill |
| Client queue length | Stepper | 2–24 | 10 | fish | Whether cheating cleaners are punished by clients leaving |
| Cleaner hunger | Slider | 0–100 | 30 | % | Probability the cleaner takes mucus instead of a parasite |
| Client escape allowed | Toggle | Clients may leave / Clients captive | May leave | — | Structural: removes the punishment mechanism entirely |
| Condition sweep | Dial | Off / Sweep phosphorus / Sweep hunger / Sweep queue | Off | — | Ramps one condition across its range during a single run |
| Season driver | Timeline scrubber | Jan–Dec | Off | month | Drives conditions automatically through a year |
| Run length | Slider | 20–365 | 120 | simulated days | Length of the run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Poor soil partnership | bay=Oak + mycorrhizae; phosphorus=6; light=600; run=120 d | Record both fitness meters. Which partner gains, and what exactly does each one hand over? |
| S2 | Fertilised to the flip | bay=Oak + mycorrhizae; sweep=Sweep phosphorus; run=120 d | Sweep phosphorus from 1 to 120 mg/kg. At what value does the oak's meter cross zero, and what is the fungus called after that point? |
| S3 | The cheating cleaner | bay=Reef; hunger=80; queue=3; escape=May leave; run=60 d | Count mucus bites per hour. Does the client's fitness stay positive, and what happens to the queue? |
| S4 | Captive clients | bay=Reef; hunger=80; queue=3; escape=Clients captive | With clients unable to leave, how does the cheating rate change, and which way does each sign badge point? |

**Student activities.**
1. Run S1 for 120 days and record both fitness meters and the number of phosphorus tokens delivered per day.
2. Set the sweep dial to Sweep phosphorus and run once. Record the exact phosphorus value at which the Sign Board flips, and repeat with the fungal network at 200 mm to see whether the threshold moves.
3. Sample nine points on the sign map by setting phosphorus to 5, 30 and 100 against light at 100, 600 and 1400, recording the oak's sign in each cell.
4. In the reef bay, set hunger to 20, 50 and 80 with a queue of 10, and record mucus bites per hour and client fitness at each setting.
5. Switch clients to captive, re-run the hunger=80 case, and write one sentence comparing the cheating rate with and without the ability to leave.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Partner fitness meters | Live numeric | % vs partner-free baseline | Both partners in the active bay, updated daily |
| Sign Board state | Pass-fail badge | +/− pair | The current interaction classification, with a log of every flip |
| Flip threshold | Live numeric | mg/kg or % hunger | The condition value at which the sign last changed |
| Sign map | Heat map | — | Interaction outcome across two conditions, filled cell by cell |
| Exchange tokens | Line graph | tokens/day | Sugar out and phosphorus in, on shared axes |
| Mucus bites and parasites removed | Bar chart | count/hour | The cleaner's honest and dishonest behaviour side by side |
| Queue length over time | Line graph | fish vs hours | How clients respond to being cheated |
| Sweep trace | Line graph | fitness vs condition | Continuous record from a condition sweep, showing the zero crossing |

**What the student should realise.**
Students believe a species is permanently a helper or permanently a pest, as though the label lived inside the organism. Sweeping one condition and watching the identical fungus cross from mutualist to parasite, with no change to the fungus at all, makes that untenable. The relationship is a running balance of what each side gains and pays under current conditions. The student should be able to say: *"Whether an interaction helps or harms depends on the conditions, so the same two species can be partners one week and a parasite and host the next."*

### D4.5 · Interaction patterns and population change

**Experiment name:** Draw the Curve: From Interaction to Population  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model + State machine  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-2

**Theme & scene.**
A dark analyst's console fills the screen. Top left, a small live stage shows the two chosen species as animated tokens in a stylised habitat strip so the abstraction stays anchored to organisms. Top right sits the Interaction Setter: a three-by-three sign grid where the student clicks a cell to declare what each species does to the other, plus a strength dial. The lower two-thirds is the Prediction Canvas: a blank grid with population on the vertical axis and weeks on the horizontal, where the student draws two freehand curves with the cursor before pressing Run. On Run, the model's own curves are drawn over the sketch in a contrasting colour and a match score appears. The control panel is docked right; a scenario library sits along the bottom.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Console shell | Environment | Dark slate panel layout with three docked regions and a thin amber accent rule; all typography high-contrast for graph reading | No |
| 2 | Live stage strip | Overlay | 420×160 px habitat band showing species A and B as instanced tokens whose numbers track the model; token count redraws every simulated week | No |
| 3 | Species A token | Actor | 14 px organism sprite, teal, swappable between eight presets (kelp, blue oak, jackrabbit, kangaroo rat, urchin, sea otter, mycorrhizal fungus, tick) | Yes: swap |
| 4 | Species B token | Actor | 14 px organism sprite, amber, same swappable preset list, with a warning if the pair is biologically absurd | Yes: swap |
| 5 | Interaction Setter grid | UI-Probe | 3×3 grid of cells labelled by the effect of A on B and B on A (+, 0, −); selecting a cell names the interaction automatically | Yes: connect |
| 6 | Interaction strength dial | Instrument | 0–100 dial setting how hard each species presses on the other; feeds the coupling coefficients | Yes: drag |
| 7 | Prediction Canvas | UI-Probe | 900×420 px grid, 0–500 individuals against 0–200 weeks, with a freehand pen that captures two sketched traces at 5-week resolution | Yes: drag |
| 8 | Sketched prediction traces | Overlay | Two dashed lines in the student's colours, locked once Run is pressed so they cannot be quietly redrawn | Yes: drag |
| 9 | Model output traces | Overlay | Two solid lines drawn over the sketch after Run, teal and amber, with peaks and troughs auto-marked | No |
| 10 | Match scorer | Instrument | Compares sketch and model on three features (shape, lead-lag order, final level) and reports a score out of 100 with a per-feature breakdown | No |
| 11 | Coupled population model | Field | Invisible pair of difference equations updating both populations each simulated week from the sign grid and strength dial | No |
| 12 | Carrying capacity line | Overlay | Dashed horizontal rule on the canvas at the resource limit for species A | Yes: drag |
| 13 | Perturbation injector | Instrument | Drop a marker anywhere on the time axis to fire a one-off event: disease, drought, removal or introduction | Yes: place |
| 14 | Scenario library rail | UI-Probe | Bottom rail of preset cards, each loading a sign-grid setting and a species pair | Yes: place |
| 15 | Evidence claim card | UI-Probe | Panel where the student writes a claim and drags a graph region onto it as evidence; the panel checks that the region actually shows what the claim states | Yes: drag, connect |
| 16 | Run log | Overlay | Scrolling table of every run with the sign grid used, the strength, the match score and the outcome | No |

**How it works — the model.**
Two populations update each simulated week by `N(t+1) = N(t) + r·N(t)·(1 − N(t)/K) + c·N(t)·M(t)/1000`, where `c` carries the sign the student chose in the grid and its magnitude comes from the strength dial. Setting minus and zero gives simple exploitation; minus and minus gives competition, which drives one population to zero when strengths are unequal; plus and plus gives mutualism, where both settle above their solo carrying capacities; plus and minus with a lag term gives the classic out-of-step predator-prey oscillation. The engine adds a one-week reproductive delay to the consumer so that lag emerges rather than being drawn on. The match scorer never rewards a lucky line: it grades shape category, which curve peaks first, and the final level, separately. The point of the prediction step is that a wrong sketch is useful data, so the model output is never previewed before Run and the sketch is locked on submission.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Interaction type | Radio | Predation / Competition / Mutualism / Commensalism / Parasitism / No interaction | Predation | — | Structural: sets the sign pair and relabels the axes legend |
| Species pair | Dropdown | Eight preset organisms for A and for B | Jackrabbit / Coyote | — | Structural: swaps the stage sprites and the sensible starting numbers |
| Interaction strength | Dial | 0–100 | 45 | — | Coupling magnitude between the two populations |
| Starting population A | Slider | 5–500 | 120 | individuals | Initial value of the teal trace |
| Starting population B | Slider | 1–200 | 20 | individuals | Initial value of the amber trace |
| Carrying capacity for A | Drag-handle | 50–600 | 300 | individuals | Structural: moves the dashed resource ceiling on the canvas |
| Perturbation event | Dropdown | None / Disease in A / Drought / Remove B / Introduce competitor | None | — | Fires a one-off shock at the marker's week |
| Perturbation week | Slider | 5–195 | 60 | week | Where on the time axis the shock lands |
| Run length | Slider | 40–200 | 150 | simulated weeks | Horizontal extent of the canvas |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Predict predation | interaction=Predation; pair=Jackrabbit / Coyote; strength=45; run=150 wk | Sketch both curves first. Which peaks first, and by how many weeks, and how close was your sketch? |
| S2 | Predict competition | interaction=Competition; pair=Kangaroo rat / Kangaroo rat variant; strength=70 | Sketch what happens to both. Does either curve reach zero, and does the winner end above or below its solo capacity? |
| S3 | Predict mutualism | interaction=Mutualism; pair=Blue oak / Mycorrhizal fungus; strength=60 | Sketch both. Where do the two curves settle compared with the carrying capacity line? |
| S4 | Shock the system | interaction=Predation; perturbation=Disease in A; week=60; run=200 wk | Sketch the recovery. How long does the oscillation take to return to its earlier size, and does the predator recover first or second? |

**Student activities.**
1. Choose Predation, sketch both curves on the canvas without running anything, and record your match score and the three feature scores.
2. Re-sketch the same scenario after seeing the model once, run again, and record the improvement. Write one sentence on what you got wrong the first time.
3. Set Competition with strength 70, predict which species survives, run, and record the week the loser reaches zero.
4. Switch to Mutualism, drag the carrying capacity line from 300 to 150, run, and record both final populations against the line.
5. Place a disease perturbation at week 60 in the predation run, sketch the recovery, then record the actual recovery time and build one claim card citing the graph region that supports it.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Model population curves | Line graph | individuals vs weeks | Both species drawn over the locked sketch |
| Prediction match score | Pass-fail badge | 0–100 | Overall score with shape, lead-lag and final-level components shown separately |
| Lead-lag between peaks | Live numeric | weeks | Auto-measured from marked peaks in the model output |
| Final populations | Live numeric | individuals | Both species at the end of the run, with the capacity line for reference |
| Interaction sign pair | Data table | +, 0 or − | What the student declared and what the resulting curves actually show |
| Recovery time after shock | Timer | simulated weeks | Weeks to return within 10 % of pre-shock amplitude |
| Claim card verdict | Pass-fail badge | — | Whether the cited graph region supports the written claim |
| Run log | Data table | mixed | Every run with settings, scores and outcomes, exportable as CSV |

**What the student should realise.**
Students believe population graphs are things to be read off rather than things that follow from how species treat each other, and they expect every curve to rise or fall smoothly. Committing a sketch before the model runs exposes that: predation gives out-of-step waves, competition gives one curve to zero, mutualism lifts both above their solo ceilings, and the shape is decided by the sign pair. The student should be able to say: *"If I know what each species does to the other, I can predict the shape of both population curves before I run anything."*

## D5 · Ecosystem disruption and change · MS-LS2-4

### D5.1 · Physical disruptions

**Experiment name:** Fire, Flood and Slide: The Landscape Stress Test  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Fluid/thermal  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
A tilted three-quarter view of one square kilometre of Californian foothill country, rendered as a low-poly terrain block with a visible soil cutaway down the front face. An oak woodland fills the upper slope, chaparral the mid-slope, a willow-lined creek the valley floor, and a grassy terrace beside it. Colour is late-summer: straw gold, olive scrub, dusty green oaks, a thin silver creek. Animal agents move as small coloured markers grazing, hunting and drinking. A wind sock on a ridge pole shows direction and strength. The control panel docks right; a slim before/after biodiversity strip runs along the bottom edge, greyed until a disruption has been run.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Terrain block | Environment | 1 km × 1 km heightfield, 4 m grid, vertical exaggeration ×2, cutaway front face showing 40 cm topsoil over pale weathered bedrock | Yes: resize |
| 2 | Blue oak stand | Actor | 180 instanced trees, 6–9 m crowns, olive canopy; each carries a health value 0–1 that drives leaf colour from green to grey | Yes: place |
| 3 | Chaparral patch | Actor | 900 low domes 0.8–1.8 m, dusty sage-green, high oil content flagged in the fuel model | Yes: place |
| 4 | Perennial grass sward | Structure | Tinted ground layer, straw gold, regrows on a 60-day clock after removal | Yes: swap |
| 5 | Creek and riparian willows | Structure | Polyline channel 3 m wide with 40 willow sprites; channel widens and browns during flood | No |
| 6 | Soil column | Structure | Layered slab: 12 cm dark A-horizon, 28 cm brown B-horizon, bedrock; root mesh drawn as fine white threads through the top two layers | No |
| 7 | Deer agents | Actor | 24 tan markers, browse oak and shrub, flee fire fronts at 4 m/s | No |
| 8 | Ground squirrel agents | Actor | 140 small brown markers, burrow icons; survive surface fire in burrows | No |
| 9 | Scrub jay agents | Actor | 30 blue markers, cache acorns, disperse after canopy loss | No |
| 10 | Stream invertebrate agents | Particle | 500 fine specks in the creek, killed by sediment above a turbidity threshold | No |
| 11 | Fire front | Field | Cellular spread field over the fuel grid; flame sprites 0.4–4 m tall scaled by fuel and wind | No |
| 12 | Flood water body | Field | Height-based water surface with sediment tint; deposits or scours soil cells on recession | No |
| 13 | Landslide mass | Particle | 3,000 debris particles released when slope saturation exceeds a threshold; buries cells beneath | No |
| 14 | Soil moisture field | Field | Invisible per-cell scalar 0–1, driven by rainfall and drought controls; feeds fire, flood and slide rules | No |
| 15 | Wind sock and vane | Instrument | Ridge pole with striped cone; angle and inflation show direction and speed | Yes: drag |
| 16 | Quadrat survey frame | UI-Probe | 50 m × 50 m draggable square that counts species and individuals inside it | Yes: drag |

**How it works — the model.**
Each terrain cell holds fuel load (t/ha), moisture (0–1), slope and vegetation type. Fire spreads cell to cell each tick with probability rising with fuel load and wind speed, falling with moisture; spread is biased downwind and uphill, so a 30 km/h upslope wind roughly triples front speed. Rainfall fills the moisture field; above field capacity the excess becomes runoff, and runoff above the channel capacity floods valley cells. Slope failure triggers where saturation exceeds 0.85 on slopes steeper than 25°. Drought simply holds rainfall at zero and drains moisture on an evaporation curve. Every agent carries a survival rule tied to the disruption type: burrowers survive surface fire, canopy nesters do not; stream invertebrates die to turbidity, not to heat. Species richness and each population are sampled before the event and at chosen intervals after, so the readouts are always a comparison, never a single number.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Disruption type | Dropdown | Wildfire / Flood / Landslide / Drought / None | Wildfire | — | Which physical event the Run button releases |
| Fuel load | Slider | 2–40 | 18 | t/ha | Density of shrub and litter; flame height and spread rate |
| Wind speed | Slider | 0–60 | 15 | km/h | Fire front speed and direction bias |
| Wind direction | Dial | 0–359 | 225 | degrees | Which way the front runs across the slope |
| Rainfall intensity | Slider | 0–120 | 0 | mm/h | Fills soil moisture; drives flood depth and slide risk |
| Slope steepness | Slider | 5–40 | 22 | degrees | Terrain tilt; landslide threshold and runoff speed |
| Drought length | Stepper | 0–36 | 0 | months | Baseline moisture before the event |
| Vegetation layout | Drag-handle | Place or delete oak, chaparral, grass, willow | Mixed foothill | — | Structural: rebuilds the fuel and habitat map |
| Recovery window | Timeline scrubber | 0–10 | 1 | years | How long after the event the survey is taken |
| Playback speed | Dial | 0.5×–8× | 2× | — | Time scaling of the event itself |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Cool grass fire | disruption=Wildfire; fuel load=6; wind speed=8; drought length=0 | Which populations drop and which barely change when a low fire runs through grass? |
| S2 | Diablo wind event | disruption=Wildfire; fuel load=34; wind speed=55; wind direction=45; drought length=18 | Same landscape, same ignition. Why does this fire remove the oak canopy when S1 did not? |
| S3 | Winter storm on a bare slope | disruption=Flood; rainfall intensity=95; slope steepness=34; vegetation layout=grass removed | The creek invertebrates die but the deer survive. What killed the invertebrates? |
| S4 | Three dry years | disruption=Drought; drought length=36; rainfall intensity=0; recovery window=3 | Nothing burns and nothing washes away. Explain how the ecosystem still loses species. |

**Student activities.**
1. Run S1, then record the before and after richness count and the deer, squirrel and jay populations from the survey strip.
2. Set fuel load to 34 and wind to 55 km/h, re-run, and record the same four numbers beside the first set.
3. Drag the quadrat frame onto the burnt oak stand and onto unburnt chaparral; record species counts in each and state which patch recovered faster.
4. Predict, before running S3, whether flood or fire removes more species; then run both and compare your prediction to the richness bars.
5. Set the recovery window to 1 year, then 5, then 10 for the same fire, and record how richness changes across the three surveys.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species richness before/after | Bar chart | species count | Paired bars per survey, updated when the recovery window changes |
| Population by species | Data table | individuals | One row per species, columns for before, immediately after, and end of window |
| Area disturbed | Live numeric | hectares | Burnt, flooded or buried area, updated each tick during the event |
| Fire front speed | Live numeric | m/min | Instantaneous spread rate; responds visibly to the wind slider |
| Soil loss | Live numeric | cm of A-horizon | Depth of topsoil scoured or buried, sampled from the cutaway face |
| Canopy cover | Line graph | % vs months | Cover trace from event to end of recovery window |
| Turbidity in creek | Live numeric | NTU | Sediment load; the killer variable in flood runs |
| Run comparison log | Data table | mixed | Exportable CSV, one row per run, all settings and all outcomes |

**What the student should realise.**
Students believe a disruption is bad in proportion to how dramatic it looks. Here a quiet three-year drought removes more species than a fast grass fire, and the same ignition produces a survivable burn or a stand-replacing one depending only on fuel and wind. Damage tracks conditions and the traits of each species, not spectacle. The student should be able to say: *"The same event can be small or catastrophic — what decides is the state the ecosystem was already in."*

### D5.2 · Biological disruptions

**Experiment name:** Uninvited: Invaders, Blights and a Missing Keystone  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
The screen splits into three linked stages the student can switch between: a Central Valley grassland terrace in bleached summer gold, a slice of Monterey kelp forest in green-blue water with light shafts, and a Sierra reservoir shore with pale concrete intake pipes. Each stage holds its own living community drawn as recognisable silhouettes rather than icons: bunchgrass tussocks, purple starthistle rosettes, otters rolling at the surface, urchin spines bristling on rock, mussel crusts thickening on pipe steel. A translucent invader release capsule floats above whichever stage is active. The panel docks right; a running species ledger sits along the bottom, one row per species, filling in as the years advance.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Grassland stage | Environment | 200 m terrace, straw ground plane, 400 native bunchgrass tussocks 30 cm tall, seed-head sway 0.3 Hz | Yes: resize |
| 2 | Yellow starthistle agents | Actor | Grey-green rosette 20 cm wide with a spined yellow flower head; taproot drawn 1.2 m into the soil cutaway; spreads by seed rings | Yes: place |
| 3 | Native forb agents | Actor | 250 low broadleaf sprites in six colours, outcompeted where starthistle density exceeds 4 per m² | No |
| 4 | Kelp forest stage | Environment | Water column 18 m deep, 60 giant kelp stipes with gas bladders, canopy shimmer at the surface | Yes: resize |
| 5 | Sea otter agents | Actor | 12 brown floating markers, forage dives every 90 s, each removes 1–3 urchins per dive | Yes: place |
| 6 | Purple urchin agents | Actor | 800 spiked violet discs 6 cm across, graze kelp holdfasts, breed when kelp is plentiful | No |
| 7 | Urchin barren overlay | Overlay | Pink coralline wash that replaces kelp texture where holdfast loss exceeds 80% | No |
| 8 | Reservoir stage | Environment | Shoreline slab, submerged intake pipe 1.2 m diameter, boat ramp, launch trailer prop | Yes: place |
| 9 | Quagga mussel colony | Actor | Striped 2 cm shells instanced as crust layers on pipe and rock; layer thickness grows with time and calcium | Yes: place |
| 10 | Plankton field | Field | Invisible scalar in the reservoir, drawn as green haze; drained by mussel filtration | No |
| 11 | Tanoak and coast live oak stand | Actor | 90 trees, canopy 5–8 m, trunk bleeding cankers appear as dark seeps as infection advances | Yes: place |
| 12 | Sudden oak death pathogen field | Field | Spore concentration grid; spreads on rain splash and along walking and vehicle routes | No |
| 13 | Vector paths | Structure | Dashed lines for trail, road and boat ramp; carry propagule pressure into each stage | Yes: connect |
| 14 | Species ledger | Instrument | Bottom strip, one row per species with a live count and a trend arrow | No |
| 15 | Time dial | Instrument | Circular dial marked 0–25 years, drives all population updates | Yes: drag |
| 16 | Sampling transect | UI-Probe | 25 m draggable line that counts every agent it crosses | Yes: drag |

**How it works — the model.**
Each stage runs coupled logistic populations on an annual tick. Natives grow toward a carrying capacity; an invader added at some starting density grows at its own rate and reduces the natives' effective capacity in proportion to its cover, which is why starthistle can occupy a terrace without ever "eating" anything. Otters and urchins run a predator–prey pair: remove the otters and urchin numbers rise until kelp holdfast loss crosses the barren threshold, at which point kelp cannot recover even if urchins later decline — a deliberate hysteresis, because the misconception is that removing a predator only affects its prey. Sudden oak death spreads as a spore field with a rain-splash term and a human-transport term, killing tanoak faster than coast live oak. Quagga mussels filter plankton at a fixed rate per individual, so their effect on everything else is indirect: fewer plankton, fewer larval fish.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Stage | Dropdown | Grassland / Kelp forest / Reservoir / Oak woodland | Grassland | — | Structural: swaps the whole community and its species set |
| Disruption | Dropdown | Invasive plant / Invasive mussel / Disease / Keystone removal / None | Invasive plant | — | Which biological event runs |
| Invader starting density | Slider | 0–50 | 5 | plants/m² or shells/m² | Size of the initial introduction |
| Invader spread rate | Slider | 0.1–3.0 | 1.2 | ×/year | How fast the invader's range expands |
| Otter population | Stepper | 0–40 | 12 | individuals | Predation pressure on urchins; 0 models the fur-trade removal |
| Pathogen introduction | Toggle | On / Off | Off | — | Seeds the spore field at the trailhead |
| Human traffic | Slider | 0–500 | 80 | visits/week | Propagule and spore transport along vector paths |
| Native seed bank | Slider | 0–100 | 60 | % of original | How much native recovery capacity remains in the soil |
| Years elapsed | Timeline scrubber | 0–25 | 0 | years | Advances all populations; scrub back and forth freely |
| Control action | Multi-select | Mow / Graze / Boat wash station / Trail closure / None | None | — | Structural: adds a management intervention mid-run |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Starthistle takes a terrace | stage=Grassland; disruption=Invasive plant; invader starting density=5; years elapsed=12 | Starthistle eats nothing. How does it still reduce native forb numbers by more than half? |
| S2 | The otters are gone | stage=Kelp forest; disruption=Keystone removal; otter population=0; years elapsed=15 | Only one species was removed. Count how many species end up affected, and explain the chain. |
| S3 | Putting the otters back | stage=Kelp forest; otter population=20; years elapsed=25 | Return the otters after a barren has formed. Why does kelp not simply come back? |
| S4 | Mussels on the intake | stage=Reservoir; disruption=Invasive mussel; human traffic=400; control action=Boat wash station | Compare plankton and larval fish with the wash station on and off. What did the mussels actually take? |

**Student activities.**
1. Set the grassland stage with starthistle at 5 plants/m², scrub the timeline to year 12, and record native forb richness before and after.
2. Drag the sampling transect across a starthistle patch and an uninvaded patch; record counts for both and compare.
3. Set otters to 0 in the kelp stage, run to year 15, then raise otters to 20 and scrub to year 25; record kelp cover at all three points.
4. Switch to the oak woodland, turn pathogen introduction on, and record tanoak and coast live oak deaths separately at years 5 and 15.
5. Run the reservoir stage twice, once with the boat wash station and once without, and record final plankton and mussel density for each.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species ledger | Data table | individuals | Live count and trend arrow for every species in the active stage |
| Richness before/after | Bar chart | species count | Paired bars at year 0 and at the scrubbed year |
| Population trajectories | Line graph | individuals vs years | One trace per species, native traces solid and invader dashed |
| Invaded area | Live numeric | % of stage | Fraction of cells above the invader density threshold |
| Kelp canopy cover | Live numeric | % | Falls as urchins graze; the barren threshold is marked on the gauge |
| Plankton concentration | Line graph | mg/m³ vs years | Drops as the mussel crust thickens |
| Infected tree count | Counter | trees | Split by species so the difference in susceptibility is visible |
| Run comparison log | Data table | mixed | Exportable CSV of settings and end-state values for every run |

**What the student should realise.**
Students believe an introduced species harms only what it eats, and that a disruption can be reversed by undoing it. Here starthistle crowds without eating, one missing otter reshapes an entire kelp community, and returning the otters does not restore the kelp because a barren holds itself in place. The student should be able to say: *"A living disruption spreads through relationships, and putting the original piece back is not the same as putting the ecosystem back."*

### D5.3 · Constructing an argument from evidence

**Experiment name:** The Evidence Docket: Prove What Wrecked the River  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
A case-file desk viewed straight down, lit like a reading lamp on dark wood. On the left, a stack of evidence cards fans out: monitoring graphs, a photo pair, a survey table, a rainfall record, a land-use map of a Sierra foothill river reach. Centre desk holds an empty claim board with three ruled slots labelled Claim, Evidence and Reasoning. Right side shows the river reach itself as a small live map with a scrub bar, so any card can be checked against the year it came from. A brass scoring plate at the top right stays dim until a claim is assembled, then lights amber, then green.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Case desk | Environment | Dark oak surface 1600×900 px, warm pooled lamp light, soft paper shadows under every card | No |
| 2 | Evidence card — fish counts | Instrument | 300×200 px card carrying a 20-year line graph of trout and sucker counts; flips to show source note | Yes: drag |
| 3 | Evidence card — water temperature | Instrument | Same card frame, monthly mean temperature 1998–2024 with a summer maximum trace | Yes: drag |
| 4 | Evidence card — turbidity record | Instrument | Bar series of monthly turbidity with two spikes matching logging years | Yes: drag |
| 5 | Evidence card — rainfall record | Instrument | Annual precipitation bars; deliberately shows no trend, so it is the tempting irrelevant card | Yes: drag |
| 6 | Evidence card — canopy photo pair | Instrument | Two aerial photographs, 2004 and 2019, riparian shade visibly thinned | Yes: drag |
| 7 | Evidence card — invertebrate survey | Instrument | Table of mayfly, stonefly and midge counts by year, with a tolerance rating column | Yes: drag |
| 8 | Evidence card — upstream land use | Instrument | Map card, hatched areas for logged parcels, dated | Yes: drag |
| 9 | Distractor card set | Instrument | Three cards holding true but irrelevant facts: a road resurfacing date, a nearby town's population, a fishing licence count | Yes: drag |
| 10 | Claim board | Structure | Three ruled slots with magnetic snap; Claim takes one card, Evidence up to four, Reasoning takes typed text | Yes: place |
| 11 | Claim card deck | Actor | Six pre-written claim cards, one correct, two partly supported, three unsupported by the available data | Yes: swap |
| 12 | Reasoning text field | UI-Probe | Free text box, 40–120 words, with sentence starters that can be toggled off | Yes: swap |
| 13 | Scoring plate | Instrument | Brass plate returning three sub-scores: relevance, sufficiency, and match between evidence and claim | No |
| 14 | Rebuttal generator | Actor | Produces one counter-argument card that the student must answer with a further piece of evidence | No |
| 15 | River reach mini-map | Overlay | Live 6 km reach with shade, turbidity and temperature layers, tied to the year scrubber | Yes: drag |
| 16 | Year scrubber | UI-Probe | Timeline 1998–2024 that redraws every card's highlighted year and the mini-map | Yes: drag |

**How it works — the model.**
The dataset behind the cards is a single generated 26-year record for one river reach, built so that riparian canopy loss drives summer water temperature up by 3.4 °C, which drives trout counts down while tolerant midges rise; turbidity spikes are real but transient and explain none of the long-term decline; rainfall is flat. The scorer does not check whether the student's claim is the one the author preferred. It checks three things per selected card: is this variable causally linked to the claimed cause in the underlying model, does the card's time span overlap the change being explained, and does the card discriminate between the claim and its rivals. A card that is true but explains nothing scores zero on discrimination, which is how the sim teaches that evidence must do work. Reasoning text is checked for whether it names the mechanism linking each selected card to the claim.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Case file | Dropdown | Foothill river / Coastal lagoon / Sierra meadow | Foothill river | — | Structural: swaps the whole dataset and card deck |
| Claim selection | Radio | Six claim cards | None | — | Which claim the evidence must support |
| Evidence slots | Drag-handle | 1–4 cards | Empty | count | Structural: which cards sit on the board |
| Year window | Timeline scrubber | 1998–2024 | Full range | year | Restricts every card to the selected span |
| Show source notes | Toggle | On / Off | On | — | Reveals who collected each dataset and how |
| Distractor cards | Toggle | On / Off | On | — | Adds or removes the three true-but-irrelevant cards |
| Rebuttal difficulty | Stepper | 1–3 | 1 | level | How pointed the generated counter-argument is |
| Scoring detail | Toggle | Score only / Full breakdown | Score only | — | Shows or hides per-card relevance and discrimination marks |
| Reasoning aids | Toggle | Sentence starters on / off | On | — | Scaffolding for the written reasoning |
| Peer comparison | Toggle | On / Off | Off | — | Overlays the class's most common evidence choices |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The obvious suspect | case file=Foothill river; distractor cards=Off; claim selection=Turbidity killed the trout | Turbidity spiked and trout fell. Which single card shows that the spikes cannot explain the decline? |
| S2 | Full docket | case file=Foothill river; distractor cards=On; evidence slots=4 | Build the best-supported claim you can. Which two cards carry almost all the score, and why? |
| S3 | Blame the weather | claim selection=A drought caused the decline; evidence slots=rainfall + fish counts | The rainfall card is genuine data. Why does the scorer give it nothing? |
| S4 | Answer the rebuttal | case file=Coastal lagoon; rebuttal difficulty=3 | The rebuttal says the fish moved rather than died. What evidence settles it? |

**Student activities.**
1. Select a claim card, drag three evidence cards into the slots, and record the three sub-scores from the brass plate.
2. Swap one high-scoring card for a distractor, re-score, and record how much the total falls and which sub-score dropped.
3. Set the year window to 2004–2019 and record whether the fish count card still supports your claim over that shorter span.
4. Write a reasoning paragraph that names the mechanism linking canopy to temperature to trout, then record the reasoning sub-score before and after adding the word "because".
5. Run the rebuttal generator at level 3 and record which single extra card raises your score enough to clear the green threshold.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Argument score | Live numeric | 0–100 | Total across relevance, sufficiency and discrimination, updated on every card change |
| Per-card breakdown | Data table | mixed | Each selected card with its three marks and a one-line explanation |
| Claim strength badge | Pass-fail badge | — | Grey, amber or green; green requires at least two discriminating cards |
| Evidence coverage map | Heat map | — | Which years and which variables the selected cards actually cover |
| Rebuttal status | Pass-fail badge | — | Whether the counter-argument has been answered |
| Reasoning check | Live numeric | 0–20 | Marks for naming a mechanism rather than restating the data |
| Argument export | Data table | mixed | Claim, cards, reasoning and scores as an exportable record |

**What the student should realise.**
Students believe evidence is anything true that they can find, and that more evidence is always stronger. Here true-but-irrelevant cards score zero and a four-card pile can beat a two-card argument by nothing at all, because only cards that separate one explanation from another do work. The student should be able to say: *"Evidence has to rule something out, not just sound related — otherwise I have collected facts, not built an argument."*

### D5.4 · Succession after a disruption

**Experiment name:** The Comeback: Ninety Years on a Burnt Slope  
**Render mode:** 2.5D Layered  
**Simulation engine:** State machine + Procedural geology  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
A wide side-on band of Sierra foothill slope, drawn as layered parallax: charred soil and blackened snags in the foreground, a receding ridge in soft haze behind, sky washing from smoke-grey at year zero to clear blue by mid-run. Under the ground line a soil cutaway shows the organic layer thickening and root threads deepening as time passes. A thick timeline scrubber runs the full width beneath the scene, marked in years 0 to 90, with faint stage bands labelled Pioneer, Early seral, Mid seral and Climax. Dragging the scrubber redraws the slope continuously; the panel docks right, and a species turnover ribbon tracks the top edge.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Burnt slope base layer | Environment | 1400 px parallax band, charcoal ground with ash streaks at year 0, greening progressively | Yes: resize |
| 2 | Standing snags | Structure | 26 blackened trunks 4–11 m, bark sloughing over years 3–12, falling one by one after year 15 | Yes: place |
| 3 | Soil cutaway | Structure | 60 cm profile: ash cap, mineral soil, weathering bedrock; organic horizon grows 0 to 14 cm across the run | No |
| 4 | Fire-following annuals | Actor | Whispering bells and golden eardrops sprites, 8–25 cm, dense in years 1–3 then near-absent | No |
| 5 | Lupine and other nitrogen fixers | Actor | Blue-purple spikes 40 cm with visible root nodules in the cutaway; peak years 2–8 | Yes: place |
| 6 | Perennial bunchgrasses | Actor | Tussocks 30–60 cm, establish from year 3, persist in gaps thereafter | No |
| 7 | Chamise and manzanita shrubs | Actor | Domes growing 0.4 m to 2.4 m across years 4–30; manzanita drawn with red bark | Yes: place |
| 8 | Ponderosa pine cohort | Actor | Seedlings from year 8, 25 m crowns by year 70, self-thinning as canopy closes | No |
| 9 | Black oak cohort | Actor | Resprouts from surviving root crowns in year 1, slower, shade-tolerant in later stages | Yes: place |
| 10 | Seed source edge | Structure | Unburnt forest strip at one end supplying propagules; distance is adjustable | Yes: drag |
| 11 | Animal guild markers | Actor | Bird, small mammal and insect icons that appear and vanish by stage: bluebird early, woodpecker at snag stage, flying squirrel at climax | No |
| 12 | Litter and coarse woody debris | Particle | Needle mat and fallen logs accumulating from year 12; feeds the organic horizon | No |
| 13 | Canopy light field | Field | Invisible transmitted-light scalar per column; falls as canopy closes and gates which species can establish | No |
| 14 | Species turnover ribbon | Overlay | Top-edge stacked band showing each species' relative cover across the whole 90 years | No |
| 15 | Timeline scrubber | UI-Probe | Full-width control, 0–90 years, scrubbable in both directions with stage bands marked | Yes: drag |
| 16 | Stage inspector | UI-Probe | Draggable magnifier that reports stage name, dominant species and light level at any point | Yes: drag |

**How it works — the model.**
Succession runs as a state machine over four stages, but the transitions are driven by two continuous variables rather than a clock: available light at ground level, and soil organic content. Each species carries an establishment window defined by the light and soil ranges it tolerates, plus a growth curve and a lifespan. Fire-followers germinate only on ash chemistry and vanish once litter covers the mineral soil. Nitrogen fixers raise the soil nitrogen term, which is what allows shrubs to grow faster after year 6, so the sim shows early species building the conditions for their own replacement. Shrubs shade out the annuals; pines overtop the shrubs; oaks persist beneath the pines because their tolerance window includes low light. Distance to the nearest seed source delays every arrival, and severity sets how much root crown and seed bank survived. Scrubbing backwards recomputes state rather than replaying an animation, so the timeline is genuinely explorable.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Disturbance severity | Slider | 0–100 | 65 | % biomass removed | How much seed bank and root crown survives year 0 |
| Starting substrate | Dropdown | Ash over soil / Bare mineral soil / Bare rock / Flood silt | Ash over soil | — | Structural: sets whether this is primary or secondary succession |
| Distance to seed source | Slider | 10–2000 | 150 | m | Arrival delay for every wind and animal dispersed species |
| Rainfall regime | Slider | 250–1400 | 800 | mm/year | Growth rates and how long each stage lasts |
| Timeline position | Timeline scrubber | 0–90 | 0 | years | Scrubs the whole scene forward and backward |
| Repeat disturbance | Stepper | 0–4 | 0 | events | Structural: inserts further fires at chosen years |
| Repeat interval | Slider | 3–40 | 15 | years | Spacing of those repeat events |
| Grazing pressure | Slider | 0–3 | 0 | animal units/ha | Suppresses shrub and seedling establishment |
| Species turnover ribbon | Toggle | On / Off | On | — | Shows or hides the stacked cover band |
| Soil cutaway | Toggle | On / Off | On | — | Reveals the organic horizon and root depth |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Secondary succession after fire | starting substrate=Ash over soil; disturbance severity=65; distance to seed source=150 | At which year does shrub cover overtake annual cover, and what changed to cause the switch? |
| S2 | Starting from bare rock | starting substrate=Bare rock; distance to seed source=150 | Compare year 30 with S1. Why is this slope so far behind? |
| S3 | Fire every eight years | repeat disturbance=4; repeat interval=8 | Does the slope ever reach the climax stage? Name the stage it keeps returning to. |
| S4 | Isolated patch | distance to seed source=1800; rainfall regime=450 | Which species never arrive at all, and what does that do to the final community? |

**Student activities.**
1. Scrub to years 1, 5, 15, 40 and 80 and record the dominant species and total species count at each stop.
2. Turn the soil cutaway on and record organic horizon depth at the same five years beside your species counts.
3. Set the substrate to bare rock, re-run, and record how many years later the shrub stage begins compared with S1.
4. Predict which animal markers appear at the snag stage, then scrub to year 12 and record which actually appear.
5. Set repeat disturbance to 4 at 8-year intervals and record the highest stage the slope reaches across the full 90 years.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Current stage | Live numeric | stage name | Pioneer, early seral, mid seral or climax at the scrubbed year |
| Species turnover ribbon | Bar chart | % cover | Stacked relative cover for every species across 0–90 years |
| Species richness | Line graph | species vs years | Total richness trace; typically peaks mid-seral rather than at climax |
| Canopy light at ground | Live numeric | % of full sun | The gate variable, updated as the scrubber moves |
| Soil organic depth | Live numeric | cm | Read from the cutaway; grows through the run |
| Above-ground biomass | Line graph | t/ha vs years | Rises smoothly and dips at each repeat disturbance |
| Animal guild present | Data table | species | Which animal markers are active at the scrubbed year |
| Stage timing table | Data table | years | Start and end year of each stage, exportable for comparison across runs |

**What the student should realise.**
Students believe succession is a fixed queue of species marching to a final forest, and that the last stage holds the most life. Here richness peaks in the middle stages, the same slope takes twenty years or ninety depending on substrate and seed distance, and repeat fire parks the community permanently in the shrub stage. Early species change the soil that dooms them. The student should be able to say: *"Succession is not a schedule — each stage builds the conditions that decide what comes next."*

### D5.5 · Short-term versus long-term change

**Experiment name:** One Year Later, Fifty Years Later  
**Render mode:** 2.5D Layered  
**Simulation engine:** Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-LS2-4

**Theme & scene.**
The screen is a split diptych of the same Sierra meadow-and-forest basin, rendered twice side by side from an identical camera. The left panel is locked to a short horizon, the right to a long one, and a shared disruption is applied to both. At load, the left shows a blackened basin one year after fire — bare ground, standing snags, a silt-choked stream — while the right shows the same basin at fifty years, with a mixed-age forest, a meadow edge and a clear stream. A brass slider between the panels sets each panel's year independently. Below, twin readout strips mirror each other so any number can be compared at a glance. The control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Basin scene, left panel | Environment | 700 px parallax basin: meadow floor, forested slope, stream, granite outcrop; state redrawn from its own year value | Yes: resize |
| 2 | Basin scene, right panel | Environment | Identical geometry and camera to the left, driven by a separate year value | Yes: resize |
| 3 | Snag field | Structure | 40 blackened trunks that stand years 0–20, fall progressively, and are gone by year 35 | No |
| 4 | Regenerating conifer cohort | Actor | Seedlings from year 4, 3 m at year 20, 24 m at year 60; density thins with age | Yes: place |
| 5 | Meadow sward | Structure | Sedge and forb ground layer; expands into the burn scar in years 2–15, then retreats under shade | Yes: swap |
| 6 | Stream channel | Structure | 2 m polyline with adjustable sediment tint; runs brown for the first 4 years, clears thereafter | No |
| 7 | Downed wood and litter | Particle | Log and needle instances accumulating from year 12; feeds the soil carbon readout | No |
| 8 | Wildlife markers | Actor | Six guild icons — woodpecker, bluebird, deer, marten, trout, beetle — appearing and vanishing by decade | No |
| 9 | Soil carbon column | Instrument | Vertical bar embedded in each panel's foreground, filled to the current soil carbon value | No |
| 10 | Divergence graph | Overlay | Shared strip beneath both panels plotting a chosen metric across 0–100 years with both panel years marked | No |
| 11 | Twin year dials | UI-Probe | Two brass dials, 0–100 years each, one per panel, linkable | Yes: drag |
| 12 | Metric selector chips | UI-Probe | Row of draggable chips — richness, biomass, carbon, water clarity, timber value, deer numbers | Yes: drag |
| 13 | Verdict cards | Actor | Two cards, one per panel, each carrying a student-set judgement of Catastrophic / Damaging / Neutral / Beneficial | Yes: swap |
| 14 | Baseline ghost overlay | Overlay | Faint pre-disruption outline drawn over each panel for direct comparison | No |
| 15 | Difference meter | Instrument | Centre gauge showing the signed gap between the two panels on the selected metric | No |

**How it works — the model.**
One 100-year trajectory is computed per metric for the chosen disruption, and both panels sample that same trajectory at their own year. Nothing differs between panels except the sampling time, which is the entire point. Trajectories are shaped so that different metrics recover at genuinely different rates: water clarity returns within 5 years, species richness overshoots the pre-fire value around year 20, above-ground biomass takes 60 years, and soil carbon dips for a decade before exceeding its starting value. Some disruptions have no long-term recovery at all — a reservoir inundation and a paved conversion hold flat forever — so the student cannot learn the false rule that everything heals. The difference meter reports the signed gap, and the verdict cards are stored per panel so a single disruption can carry two honest and opposite judgements at once.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Disruption | Dropdown | Wildfire / Flood / Landslide / Clear-cut logging / Reservoir flooding / Paved development | Wildfire | — | Structural: swaps every trajectory and the scene furniture |
| Left panel year | Dial | 0–100 | 1 | years | Which year the left basin is drawn from |
| Right panel year | Dial | 0–100 | 50 | years | Which year the right basin is drawn from |
| Metric on display | Multi-select | Richness / Biomass / Soil carbon / Water clarity / Timber value / Deer numbers | Richness | — | Which trajectory drives the graph and the difference meter |
| Disruption severity | Slider | 10–100 | 65 | % biomass removed | Depth of the initial drop and the length of recovery |
| Repeat frequency | Slider | 0–50 | 0 | years between events | Structural: adds recurring disruptions to the trajectory |
| Baseline ghost | Toggle | On / Off | On | — | Draws the pre-disruption outline over both panels |
| Link panels | Toggle | On / Off | Off | — | Locks the two dials a fixed number of years apart |
| Verdict card, left | Radio | Catastrophic / Damaging / Neutral / Beneficial | None | — | Records the student's short-horizon judgement |
| Verdict card, right | Radio | Catastrophic / Damaging / Neutral / Beneficial | None | — | Records the student's long-horizon judgement |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The same fire, twice | disruption=Wildfire; left panel year=1; right panel year=50 | Both panels show one event. Which verdict is correct, and can both be? |
| S2 | Race of the metrics | disruption=Wildfire; metric on display=Water clarity, then Biomass | Which metric recovers first and which last? Record the year each returns to baseline. |
| S3 | No coming back | disruption=Reservoir flooding; left panel year=1; right panel year=100 | Run the long panel to year 100. Why does this trajectory never return to baseline? |
| S4 | Fire every ten years | disruption=Wildfire; repeat frequency=10; right panel year=50 | Compare with S1 at the same year. What has repetition done to the long-term picture? |

**Student activities.**
1. Set the left dial to 1 and the right to 50 for a wildfire, and record species richness in each panel.
2. Step the right dial through 5, 10, 20, 40 and 80 years, recording richness at each stop, and mark the year it first exceeds baseline.
3. Swap the display metric to biomass and repeat the same five stops; record which metric crosses baseline first.
4. Set both verdict cards for the wildfire, then switch the disruption to reservoir flooding and set them again; record which verdicts changed.
5. Turn repeat frequency to 10 years and record the year-50 richness beside your original year-50 value.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Panel values | Live numeric | metric units | The selected metric in each panel, side by side |
| Difference meter | Live numeric | signed metric units | Right panel minus left panel, updated as either dial moves |
| Recovery trajectory | Line graph | metric vs years | Full 0–100 year curve with both panel years marked as vertical pins |
| Time to baseline | Live numeric | years | Year at which the selected metric first returns to its pre-disruption value, or "never" |
| Metric race table | Data table | years | Time-to-baseline for all six metrics in one column each |
| Verdict pair | Pass-fail badge | — | Shows whether the two recorded verdicts conflict, which is expected rather than an error |
| Wildlife guild timeline | Data table | decade | Which guild markers are present in each panel |
| Run log | Data table | mixed | Exportable CSV of disruption, severity, both years and all metric values |

**What the student should realise.**
Students believe a disruption is simply good or bad, judged from the immediate aftermath. Here the identical fire reads as catastrophic at one year and as regenerative at fifty, different measurements recover at wildly different rates, and some disruptions never recover at all. The judgement depends on the timescale and the metric chosen. The student should be able to say: *"Before I call a change harmful, I have to say how long I looked and what I measured."*

## D6 · Biodiversity and ecosystem services · MS-LS2-5

### D6.1 · Naming ecosystem services

**Experiment name:** The Invisible Payroll: What the Land Does for Free  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Investigate  
**Session length:** 12–18 min  
**NGSS anchor:** MS-LS2-5

**Theme & scene.**
A ledger-styled dashboard laid over a soft aerial illustration of a Central Coast watershed: orchard blocks, oak savanna, a marsh at the river mouth, a working harbour. Five service dials sit across the top like meters on a plant room wall — Pollination, Water filtration, Carbon storage, Flood buffering, Fisheries — each with a needle, a monetary figure beneath it and a small non-monetary caption above. The aerial view stays interactive: clicking any land parcel highlights every service that parcel contributes to, drawing thin gold threads from the parcel up to the dials it feeds. The palette is warm paper and ink with the dials in brass. The control panel docks right; a running annual account sits bottom-left.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Watershed aerial base | Environment | 1200×800 px illustrated plan, 20 km across, parcels outlined in fine ink | Yes: resize |
| 2 | Orchard parcels | Actor | 14 hatched blocks of almond and apple rows; yield depends on the pollination dial | Yes: swap |
| 3 | Oak savanna parcels | Actor | 22 stippled parcels with scattered canopy dots; feed carbon and pollinator habitat | Yes: swap |
| 4 | Riparian corridor | Structure | Green ribbon 30–90 m wide along the river; width is directly draggable | Yes: resize |
| 5 | Tidal marsh | Structure | Cross-hatched delta polygon; area drives flood buffering and fish nursery capacity | Yes: resize |
| 6 | Wetland treatment cells | Structure | Three shallow ponds with reed fringes; nitrogen removal proportional to area and residence time | Yes: place |
| 7 | Native bee nesting habitat | Actor | Hedgerow and bare-ground patches shown as dashed edges; sets wild pollinator population | Yes: place |
| 8 | Managed hive stacks | Actor | Boxed hive icons in threes; the paid substitute for wild pollination | Yes: place |
| 9 | Harbour and fishing fleet | Actor | Quay with 12 boat icons; landings scale with marsh nursery area | No |
| 10 | Service dials | Instrument | Five brass gauges with needle, monetary figure and non-monetary caption; animate on any change | No |
| 11 | Gold contribution threads | Overlay | Bezier threads from a selected parcel to every dial it feeds, thickness ∝ contribution | No |
| 12 | Substitution cost calculator | Instrument | Panel that prices the engineered replacement for any service switched off | No |
| 13 | Non-monetary card set | Instrument | Six cards holding values that resist pricing: cultural significance, drinking water safety, species existence, recreation, sense of place, Tribal harvest rights | Yes: drag |
| 14 | Annual account ledger | Instrument | Bottom-left running table of service value per year, in dollars and in physical units | No |
| 15 | Land-use brush | UI-Probe | Paint tool that converts any parcel between orchard, savanna, marsh, wetland and housing | Yes: place |
| 16 | Parcel inspector | UI-Probe | Draggable loupe reporting a parcel's area, land use and every service it supplies | Yes: drag |

**How it works — the model.**
Each service is computed from land cover using published-style coefficients simplified to one line each: pollination value scales with the area of orchard within 800 m of nesting habitat; water filtration removes nitrogen at a fixed kg/ha/year for wetland and riparian cover; carbon storage sums a per-hectare stock by cover type; flood buffering converts marsh and floodplain area into peak-flow reduction and then into avoided damage; fisheries landings scale with nursery marsh area on a saturating curve. Every service reports twice, once in dollars per year and once in a physical unit, and the substitution calculator prices what it would cost to buy the same outcome from engineering — hives trucked in, a filtration plant, a levee. Some values deliberately have no dollar figure at all: the non-monetary cards can be attached to a service but never convert, so the ledger always ends with a section that does not add up.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Land-use brush | Drag-handle | Orchard / Savanna / Marsh / Wetland / Housing | Off | — | Structural: repaints parcels and recomputes every dial |
| Riparian corridor width | Slider | 0–120 | 45 | m | Nitrogen removal and shade; drives water filtration |
| Marsh area | Slider | 0–900 | 380 | hectares | Flood buffering and fish nursery capacity |
| Wild pollinator habitat | Slider | 0–30 | 12 | % of farm edge | Wild bee population and orchard set rate |
| Managed hives | Stepper | 0–600 | 0 | hives | Bought pollination; appears as a cost, not a service |
| Oak canopy cover | Slider | 0–60 | 28 | % | Carbon stock and shade |
| Valuation mode | Radio | Dollars / Physical units / Both | Both | — | Which figure each dial shows |
| Storm severity | Dropdown | 2-year / 10-year / 100-year storm | 10-year | — | Which flood event the buffering service is tested against |
| Non-monetary cards | Multi-select | Six value cards | None | — | Attaches unpriceable values to the ledger |
| Show contribution threads | Toggle | On / Off | On | — | Draws the gold parcel-to-dial links |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | The watershed as found | All defaults; valuation mode=Both | Which two services carry the largest annual value, and which parcels supply them? |
| S2 | Pave the marsh | land-use brush=Housing over marsh; marsh area=0; storm severity=100-year | The housing has a sale value. What does the ledger lose, and what does the flood dial do? |
| S3 | Buy the bees back | wild pollinator habitat=0; managed hives=450 | Hedgerows removed, hives hired. Is the orchard as productive, and what does it now cost? |
| S4 | The unpriceable column | non-monetary cards=Drinking water safety + Tribal harvest rights + Sense of place | Attach three cards. Why does the total at the bottom of the ledger refuse to be one number? |

**Student activities.**
1. Click each of the five dials in turn and record which parcels light up gold for each service.
2. Set marsh area to 0 and record all five dial values before and after; note which services change and which do not.
3. Set wild pollinator habitat to 0, then raise managed hives until orchard yield returns to its original figure; record the number of hives and the cost.
4. Run the flood dial at the 2-year, 10-year and 100-year storm settings and record avoided damage for each.
5. Attach three non-monetary cards, then write one sentence explaining why the ledger total is now incomplete.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Service dials | Live numeric | $/year and physical units | All five services, both valuations, updated on any land change |
| Pollination delivered | Live numeric | % of orchard flowers set | Physical measure independent of price |
| Nitrogen removed | Live numeric | kg/year | Water filtration in mass, not money |
| Carbon stored | Live numeric | tonnes C | Standing stock across the watershed |
| Avoided flood damage | Live numeric | $/year | Depends on the chosen storm severity |
| Substitution cost | Bar chart | $/year | Engineered replacement cost beside each natural service |
| Annual account ledger | Data table | mixed | Full account, with a separate unpriced section for the non-monetary cards |
| Land-use summary | Data table | hectares | Area by cover type after every brush edit |

**What the student should realise.**
Students believe nature is scenery and that the working parts of a landscape are the farms and buildings. Here removing a marsh drops flood protection and fish landings at once, replacing wild pollinators with hired hives costs real money for the same crop, and some of the most important values will not convert into dollars at all. The student should be able to say: *"Healthy ecosystems already do jobs we would otherwise have to pay for, and a few of those jobs have no price at all."*

### D6.2 · Threats to biodiversity

**Experiment name:** Pressure Stack: Layering the Threats on a Range Map  
**Render mode:** 2.5D Layered  
**Simulation engine:** Field/vector + Data-driven model  
**Interaction level:** Investigate  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-5

**Theme & scene.**
A cool cartographic view of coastal and inland California from Monterey Bay to the western Sierra, drawn as a muted relief map with rivers in pale blue and city footprints in warm grey. Hovering above the map are six semi-transparent threat layers, drawn as stacked sheets a few pixels apart so the student can see them as physically separate: habitat loss, fragmentation, pollution, overharvest, invasive species and climate shift. Each sheet can be lifted on or off. Below the map sits a species tray holding eight Californian species cards, each draggable onto the map to see its range clipped by whichever pressures are active. The palette is restrained so the threat washes read clearly. The control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Relief base map | Environment | 1400×900 px shaded relief, Albers projection, 400 km across, coastline and rivers inked | Yes: resize |
| 2 | Habitat loss layer | Field | Semi-transparent sheet, ochre wash where cover is converted; intensity 0–1 per 1 km cell | Yes: swap |
| 3 | Fragmentation layer | Field | Sheet drawn as a lattice of roads, canals and fence lines; carries an edge-density value per cell | Yes: swap |
| 4 | Pollution layer | Field | Blue-grey plume sheet from outfalls, farm runoff and urban stormwater, decaying with distance | Yes: swap |
| 5 | Overharvest layer | Field | Red hatch over fishing grounds and logging blocks, scaled by extraction rate | Yes: swap |
| 6 | Invasive species layer | Field | Violet stipple with expanding fronts from ports, marinas and highways | Yes: swap |
| 7 | Climate shift layer | Field | Warm gradient sheet plus arrows showing the direction suitable climate is moving | Yes: swap |
| 8 | Species cards | Actor | Eight cards: sea otter, Chinook salmon, valley elderberry longhorn beetle, giant garter snake, monarch butterfly, Sierra yellow-legged frog, burrowing owl, blue oak | Yes: drag |
| 9 | Range polygon | Overlay | Each species' potential range drawn as a soft-edged polygon, clipped live by the active layers | No |
| 10 | Pressure stack meter | Instrument | Right-edge column showing each active layer's contribution to total pressure at the pinned cell | No |
| 11 | Interaction highlighter | Overlay | Cross-hatch that appears only where two or more layers overlap above threshold, marking compound pressure | No |
| 12 | Corridor pinch points | Structure | Auto-detected narrow passages between habitat blocks, drawn as amber chevrons | No |
| 13 | Map pin probe | UI-Probe | Draggable pin returning per-layer values, total pressure and predicted local extinction risk | Yes: drag |
| 14 | Time slider ghosts | Overlay | Faint 1970 and 2070 outlines of each layer for before-and-after comparison | No |
| 15 | Threat ranking board | Instrument | Sortable list of the six pressures ranked by area affected and by species affected | No |
| 16 | Legend and scale bar | UI-Probe | Movable legend block with colour keys, a 50 km scale bar and a north arrow | Yes: drag |

**How it works — the model.**
Every 1 km cell carries six pressure values from 0 to 1. A species card holds a potential range polygon and a sensitivity weight for each pressure, so a salmon is heavily weighted to pollution and fragmentation while a blue oak is weighted to habitat loss and climate. Realised range is the potential range with cells removed wherever the weighted sum of pressures exceeds that species' tolerance. Crucially the sum is not linear: where two or more layers exceed 0.4 in the same cell, the model applies a compound multiplier, so two moderate pressures together remove more range than either severe pressure alone. Fragmentation is computed from edge density rather than area lost, which lets the sim show a landscape that keeps most of its habitat but loses its connectivity. Climate shift moves the suitable band northward and upslope each decade, so range loss can occur in cells where nothing was built and nothing was polluted.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Active threat layers | Multi-select | Habitat loss / Fragmentation / Pollution / Overharvest / Invasives / Climate shift | Habitat loss | — | Structural: which sheets are stacked on the map |
| Species on map | Drag-handle | Any of eight species cards | Sea otter | — | Structural: swaps range polygon and sensitivity weights |
| Habitat conversion | Slider | 0–90 | 35 | % of cells converted | Extent of the ochre wash |
| Road and canal density | Slider | 0–4.0 | 1.4 | km/km² | Edge density driving the fragmentation layer |
| Pollutant load | Slider | 0–200 | 60 | kg N/km²/year | Plume strength and reach |
| Harvest rate | Slider | 0–80 | 25 | % of stock per year | Overharvest layer intensity |
| Invasive front speed | Slider | 0–40 | 8 | km/year | How fast the violet stipple expands from ports and roads |
| Warming by 2070 | Slider | 0.0–4.0 | 2.0 | °C | Distance the suitable climate band shifts |
| Decade | Timeline scrubber | 1970–2070 | 2020 | year | Redraws every layer at that decade |
| Compound highlighting | Toggle | On / Off | On | — | Shows where overlapping pressures multiply |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | One threat at a time | active threat layers=Habitat loss only; species on map=Burrowing owl; habitat conversion=35 | How much range does habitat loss alone remove? Record the percentage. |
| S2 | Two moderate pressures | active threat layers=Habitat loss + Fragmentation; road and canal density=2.2 | Add fragmentation at moderate strength. Why is the loss larger than the two separate losses added together? |
| S3 | Different species, same map | active threat layers=All six; species on map=Chinook salmon, then Blue oak | Same pressures, two species. Which pressure dominates for each, and why do they differ? |
| S4 | Nothing built, range still lost | active threat layers=Climate shift only; warming by 2070=3.0; decade=2070 | No habitat was converted here. Explain how the species still loses its range. |

**Student activities.**
1. Place the sea otter card on the map with only the overharvest layer active and record realised range as a percentage of potential range.
2. Add layers one at a time in any order, recording realised range after each addition, and mark where the drop is larger than expected.
3. Drag the map pin to a cross-hatched compound cell and to a single-pressure cell; record the per-layer values at both.
4. Swap the species card to the monarch butterfly and repeat the full layer stack; record which two pressures matter most for it.
5. Scrub the decade slider from 1970 to 2070 with all layers on and record realised range at 1970, 2020 and 2070.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Realised range | Live numeric | % of potential range | Updates whenever a layer or slider changes |
| Range area | Live numeric | km² | Absolute area remaining for the selected species |
| Pressure stack at pin | Bar chart | 0–1 per pressure | Six stacked bars for the pinned cell |
| Compound-pressure area | Live numeric | km² | Area where two or more pressures exceed threshold |
| Threat ranking board | Data table | mixed | Six pressures ranked by area affected and by species affected |
| Extinction risk band | Pass-fail badge | — | Low, elevated or high, from remaining range and fragmentation |
| Range over time | Line graph | km² vs decade | 1970–2070 trace for the selected species |
| Species comparison table | Data table | mixed | Realised range for all eight species under the current layer stack |

**What the student should realise.**
Students believe biodiversity is lost mainly through one obvious cause, usually hunting or bulldozers, and that threats simply add up. Here two moderate pressures together strip more range than one severe pressure, a species can lose habitat where nothing was built because the climate band moved, and the leading threat is different for a salmon than for an oak. The student should be able to say: *"Threats stack and multiply, and which one matters most depends on the species you are asking about."*

### D6.3 · Named solution categories

**Experiment name:** The Solutions Bench: Six Tools, One Watershed  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-5

**Theme & scene.**
A workbench view: along the bottom of the screen sits a physical-looking rack of six labelled tool trays — Protected areas, Wildlife corridors, Habitat restoration, Invasive control, Regulation, Incentives — each holding draggable tokens with their own icon and material, from a green boundary ribbon to a paper permit card. Above the bench, filling most of the screen, is a working Central Valley and foothill landscape in three-quarter view: farmland grid, a river with a levee, remnant riparian woodland, a highway cutting the valley, a hill range on the horizon. Animals move as markers along whatever connectivity exists. Dropping a token onto the landscape places a real object there. The control panel docks right; an outcomes strip runs across the top.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Valley landscape | Environment | 25 km × 15 km three-quarter terrain, farm grid, river, levee, highway, foothills; 2 m vertical exaggeration | Yes: resize |
| 2 | Protected area token | Actor | Green boundary ribbon that snaps to parcel edges and encloses any area drawn; ranger station prop at its gate | Yes: place, resize |
| 3 | Wildlife corridor token | Actor | 60–400 m planted strip or a highway underpass box culvert with fencing wings | Yes: place, connect |
| 4 | Habitat restoration token | Actor | Restoration patch that converts a farm parcel to riparian or grassland over a visible 8-year growth animation | Yes: place |
| 5 | Invasive control token | Actor | Crew truck and treatment zone disc; repeats annually while funded, otherwise the invader front resumes | Yes: place |
| 6 | Regulation token | Actor | Permit card that applies a rule to a whole class of parcels, e.g. a 30 m no-clear buffer on every stream | Yes: place |
| 7 | Incentive token | Actor | Contract card offering a per-hectare payment; landowner agents accept or refuse by their own economics | Yes: place |
| 8 | Landowner agents | Actor | 40 farm markers with a profit value and a willingness threshold; change land use when an incentive beats their margin | No |
| 9 | Wildlife agents | Actor | 200 markers across four guilds; movement is blocked by highway and levee unless a corridor exists | No |
| 10 | Invasive front | Field | Expanding perimeter from the port and highway; retreats inside funded control zones | No |
| 11 | Connectivity graph | Overlay | Node-and-link diagram over the landscape; links appear where corridors join habitat blocks | No |
| 12 | Budget meter | Instrument | Top-strip gauge showing annual cost against the available budget; turns red when overdrawn | No |
| 13 | Compliance meter | Instrument | Gauge showing what fraction of landowners are actually following a placed regulation | No |
| 14 | Tool tray rack | UI-Probe | Bench along the bottom holding all six token types with counts remaining | Yes: drag |
| 15 | Outcome inspector | UI-Probe | Draggable probe reporting local richness, connectivity and cost for any spot | Yes: drag |
| 16 | Year clock | Instrument | Dial 0–30 years driving growth, invasion, compliance drift and agent decisions | Yes: drag |

**How it works — the model.**
Each tool type acts on a different variable, and the sim refuses to let one tool do another's job. Protected areas set conversion probability to zero inside their boundary but do nothing about an invasive front or a barrier. Corridors add edges to the connectivity graph, and wildlife population is computed from effective connected habitat area rather than raw habitat area, so a corridor can raise numbers without adding a hectare. Restoration adds habitat on a delay: newly planted parcels count at 20% value for the first five years. Invasive control is the only recurring cost and its gains reverse within three years of defunding. Regulation applies landscape-wide at low cost but generates a compliance value below 100% that drifts with enforcement spending. Incentives work through landowner agents, who accept only when the payment exceeds their margin, so uptake is patchy and voluntary. Every placement bills against the budget meter.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Tool selection | Drag-handle | Six token types from the bench | Protected area | — | Structural: which object the next placement creates |
| Annual budget | Slider | 0.5–20 | 6 | $ million/year | How much can be placed and maintained |
| Protected area size | Slider | 50–5000 | 800 | hectares | Extent enclosed by the next boundary ribbon |
| Corridor width | Slider | 30–500 | 120 | m | Passage quality; narrow corridors carry fewer guilds |
| Restoration intensity | Slider | 0–100 | 50 | % of a parcel replanted | How quickly a restored parcel reaches full habitat value |
| Invasive control funding | Slider | 0–100 | 0 | % of area treated per year | Whether the invasive front retreats or resumes |
| Regulation strength | Dropdown | None / Stream buffer / Grading permit / Take prohibition | None | — | Which landscape-wide rule applies |
| Incentive payment | Slider | 0–900 | 250 | $/hectare/year | Landowner uptake rate |
| Enforcement spending | Slider | 0–30 | 10 | % of budget | Compliance level for any active regulation |
| Year clock | Timeline scrubber | 0–30 | 0 | years | Advances growth, invasion, uptake and compliance drift |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | A park and nothing else | tool selection=Protected area; protected area size=3000; invasive control funding=0; year clock=15 | The reserve is large and legally safe. Why does richness inside it still fall by year 15? |
| S2 | Connect what exists | tool selection=Wildlife corridor; corridor width=200; annual budget=6 | Add no new habitat, only corridors. How much does wildlife population rise, and why? |
| S3 | Rules versus payments | regulation strength=Stream buffer; enforcement spending=5, then incentive payment=600 | Compare riparian hectares protected by rule and by payment at the same cost. Which delivers more, and which is more certain? |
| S4 | Stop paying the weed crew | invasive control funding=80 for 10 years, then 0; year clock=20 | Fund control for a decade then stop. What happens between years 10 and 20? |

**Student activities.**
1. Drag one protected area token of 3000 hectares onto the foothills, run to year 15, and record richness inside and outside the boundary.
2. Place two corridor tokens joining the riparian woodland to the foothills, run again, and record wildlife population before and after.
3. Set a stream buffer regulation with enforcement at 5%, then at 25%, and record compliance and riparian hectares for each.
4. Raise the incentive payment in steps of 150 $/ha/year and record landowner uptake at each step until it stops rising.
5. Spend the entire budget on one tool type, record the outcomes strip, then rebuild using three tool types for the same money and compare.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species richness | Live numeric | species | Landscape total, updated as the year clock advances |
| Connected habitat area | Live numeric | hectares | Effective area after connectivity is accounted for, not raw area |
| Wildlife population by guild | Bar chart | individuals | Four guilds, showing which respond to corridors and which to area |
| Invaded area | Line graph | hectares vs years | Rises, falls under funded control, and rebounds when funding stops |
| Annual cost | Live numeric | $ million/year | Placement plus maintenance against the budget meter |
| Compliance rate | Live numeric | % of landowners | Only meaningful when a regulation is active |
| Incentive uptake | Live numeric | % of eligible parcels | Voluntary acceptance at the current payment |
| Solution mix log | Data table | mixed | Exportable record of every token placed, its cost and its measured effect |

**What the student should realise.**
Students believe conservation means one thing, usually drawing a line around a park, and that a good solution works everywhere. Here a large reserve fails against an invasion, corridors raise populations without adding habitat, regulation is cheap but only as strong as its compliance, and incentives are willing but patchy. Each tool fixes one specific problem. The student should be able to say: *"Every solution type has a job it is good at, so the real question is which problem I am trying to fix."*

### D6.4 · Evaluating competing solutions

**Experiment name:** Weights Change Winners: The Trade-off Bench  
**Render mode:** Data Dashboard  
**Simulation engine:** Data-driven model  
**Interaction level:** Argue-from-data  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-5

**Theme & scene.**
A cool analyst's bench in slate and pale ink. The centre is a matrix: five candidate solutions for one degraded Sacramento Valley floodplain run down the rows, and six criteria run across the columns — biodiversity gain, cost, time to benefit, community support, water security, and maintenance burden. Each cell holds a small filled bar rather than a bare number, so the pattern is readable at a glance. Above each column sits a physical-looking weight dial with a brass knob. Down the right edge, a ranking column shows the five solutions ordered by weighted score, and the rows visibly slide and reorder whenever a weight is turned. A small floodplain thumbnail sits top-left, updating to show whichever solution is selected.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Decision matrix grid | Structure | 5 rows × 6 columns, 1100×520 px, ruled slate panel with ink gridlines and column headers | Yes: resize |
| 2 | Solution row cards | Actor | Five cards: setback levee, engineered levee raise, riparian restoration, upstream reservoir release rules, buy-out and retreat; each carries an icon and a thumbnail | Yes: swap |
| 3 | Criterion columns | Structure | Six headed columns, each with its own unit and its own better-is-higher or better-is-lower direction | Yes: swap |
| 4 | Score cells | Instrument | 30 cells, each a filled bar 0–10 with the raw value printed beneath in real units | No |
| 5 | Weight dials | UI-Probe | Six brass knobs above the columns, 0–5 each, with a live percentage-of-total readout | Yes: drag |
| 6 | Ranking column | Instrument | Right-edge ordered list with animated row reordering and the weighted score to 1 dp | No |
| 7 | Sensitivity strip | Overlay | Thin band under each dial showing the weight range across which the top-ranked solution stays the same | No |
| 8 | Floodplain thumbnail | Overlay | 320×220 px plan of the reach that redraws for the selected solution: levee line, restored acres, houses removed | No |
| 9 | Stakeholder viewpoint chips | Actor | Five draggable chips — farmer, city flood manager, Tribal council, biologist, taxpayer — each carrying a preset weight profile | Yes: drag |
| 10 | Raw data drawer | Instrument | Slide-out panel holding the underlying figure and source note behind every cell | Yes: drag |
| 11 | Normalisation switch | UI-Probe | Control that swaps between raw units, 0–10 scaling and rank scoring, so the effect of scaling is visible | Yes: swap |
| 12 | Tie and near-tie flag | Overlay | Amber marker on any pair of solutions within 0.3 of each other, warning against over-reading small gaps | No |
| 13 | Constraint bar | Instrument | Budget and schedule limits drawn as a red line across the matrix; violating solutions grey out | Yes: drag |
| 14 | Decision log | Instrument | Bottom strip recording every weight profile tried and the winner it produced | No |
| 15 | Justification field | UI-Probe | Text box requiring the student to name the weights they chose and why, scored for consistency with their ranking | Yes: swap |

**How it works — the model.**
Each solution has a fixed set of real-unit performance figures: hectares of habitat gained, capital cost, years to first benefit, a survey-style support percentage, acre-feet of water security, and annual maintenance cost. Those figures never change when a weight moves, which is the central honesty of the sim. Normalisation converts each column to a 0–10 scale, flipping direction for cost-like criteria so that higher always means better, and the weighted score is the sum of weight × normalised score divided by the total weight. Turning any dial recomputes and reorders instantly. The sensitivity strip solves, for each dial, the range over which the current winner remains the winner, so a fragile result is visibly fragile. Stakeholder chips are stored weight vectors, not opinions layered on top of the data, so choosing a viewpoint is exactly the same operation as turning the dials by hand.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Biodiversity weight | Dial | 0–5 | 3 | — | Influence of habitat gain on the weighted score |
| Cost weight | Dial | 0–5 | 3 | — | Influence of capital cost, direction-flipped |
| Time-to-benefit weight | Dial | 0–5 | 2 | — | Influence of how soon results appear |
| Community support weight | Dial | 0–5 | 2 | — | Influence of the support survey figure |
| Water security weight | Dial | 0–5 | 2 | — | Influence of acre-feet secured |
| Maintenance weight | Dial | 0–5 | 1 | — | Influence of annual upkeep, direction-flipped |
| Stakeholder profile | Dropdown | None / Farmer / Flood manager / Tribal council / Biologist / Taxpayer | None | — | Structural: loads a stored weight vector into all six dials |
| Solutions in play | Multi-select | Five solution cards | All five | — | Structural: adds or removes rows from the matrix |
| Normalisation | Radio | Raw units / 0–10 scale / Rank score | 0–10 scale | — | How cells are converted before weighting |
| Budget constraint | Slider | 5–250 | 120 | $ million | Greys out any solution above the line |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Balanced start | All weights=3; normalisation=0–10 scale; budget constraint=250 | With every criterion weighted equally, which solution ranks first and by what margin? |
| S2 | Cheap and fast | cost weight=5; time-to-benefit weight=5; biodiversity weight=0 | Which solution wins now? Did any cell value change when the ranking changed? |
| S3 | Two stakeholders | stakeholder profile=Biologist, then Farmer | The same five solutions and the same data. Why do the two viewpoints rank them differently? |
| S4 | Fragile winner | All weights=3, then move one dial by a single step | Use the sensitivity strip to find the criterion whose smallest change flips first place. |

**Student activities.**
1. Set all six weights to 3 and record the full ranking with each weighted score.
2. Turn the cost dial from 3 to 5 and the biodiversity dial from 3 to 0; record the new ranking and note which raw cell values changed.
3. Load the biologist profile, then the farmer profile, and record the top two solutions under each.
4. Open the raw data drawer for the cost column and record the actual figure behind each solution's bar.
5. Write in the justification field which weights you chose and why, then record the consistency score the field returns.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Weighted score | Live numeric | 0–10 | One score per solution, recomputed on every dial move |
| Ranking order | Data table | rank | Five solutions ordered, with animated reordering |
| Sensitivity range | Live numeric | weight units | The span over which the current winner survives, per criterion |
| Criterion contribution | Bar chart | score points | Stacked bars showing which criteria are carrying each solution's score |
| Raw performance table | Data table | mixed units | The unweighted figures behind every cell, exportable |
| Near-tie flag | Pass-fail badge | — | Amber when the top two are within 0.3 |
| Constraint status | Pass-fail badge | — | Which solutions remain feasible under the budget line |
| Decision log | Data table | mixed | Every weight profile tried and the winner it produced |

**What the student should realise.**
Students believe one solution is objectively best and that the numbers will simply reveal it. Here no cell value ever changes while the winner changes three times, because the ranking depends on what the decider chose to value. That does not make the exercise arbitrary: the data constrains the argument, and the sensitivity strip shows when a result is fragile. The student should be able to say: *"The evidence tells me what each option does — the weights tell you what I decided mattered, and I have to say them out loud."*

### D6.5 · A biodiversity solution for a real ecosystem

**Experiment name:** Delta Commission: A Budget, a Room, and Thirty Years  
**Render mode:** Hybrid 2D+3D  
**Simulation engine:** Agent-based + Data-driven model  
**Interaction level:** Design  
**Session length:** 18–25 min  
**NGSS anchor:** MS-LS2-5

**Theme & scene.**
A working commission table viewed at a slight angle. Most of the screen is a living map of the Sacramento–San Joaquin Delta: a braid of sloughs and channels, diked islands sitting below sea level behind their levees, tule marsh fringes, pumping plants at the south end, Suisun Bay to the west. Boats, birds and fish markers move across it. Along the left edge sit five stakeholder seats, each an illustrated place card with a mood indicator: Delta farmer, Southern California water agency, commercial fishing association, a Tribal representative, and a levee district engineer. Along the bottom sits a project tray with costed interventions. A thirty-year clock and a budget bar run across the top. The control panel docks right.

**Objects & components.**

| # | Object | Class | Build note (geometry · appearance · behaviour) | Editable |
|---|---|---|---|---|
| 1 | Delta map base | Environment | 90 km × 70 km plan, channels in blue, 18 diked islands with subsidence depth shown in a side profile strip, levee lines picked out in grey | Yes: resize |
| 2 | Diked island parcels | Actor | 18 polygons, each with land elevation from +1 m to −5 m, current use, and a flood-risk value | Yes: swap |
| 3 | Tidal marsh restoration project | Actor | Placeable patch that breaches a levee and converts an island to marsh over a 12-year vegetation animation | Yes: place |
| 4 | Levee reinforcement project | Actor | Placeable segment thickening a levee cross-section; reduces failure probability for that island only | Yes: place |
| 5 | Fish screen and passage project | Actor | Placeable structure at pump intakes and channel junctions; cuts entrainment losses | Yes: place |
| 6 | Invasive water hyacinth control | Actor | Treatment barge and zone disc; the mat regrows within three years if unfunded | Yes: place |
| 7 | Flow and salinity field | Field | Coupled scalar field for freshwater outflow and salinity intrusion from the west; drives habitat suitability | No |
| 8 | Chinook salmon agents | Actor | 400 migrating markers routed through channels; survival depends on screens, temperature and marsh rearing area | No |
| 9 | Delta smelt population | Actor | Population marker cloud in the low-salinity zone; highly sensitive to outflow and hyacinth cover | No |
| 10 | Waterbird flock agents | Actor | 12 flock markers using marsh and flooded-field habitat seasonally | No |
| 11 | Stakeholder seat cards | Actor | Five illustrated cards with a 0–100 satisfaction meter and a stated red line that turns the card red when crossed | Yes: drag |
| 12 | Water export gauge | Instrument | Pumping plant dial in acre-feet per year, coupled inversely to freshwater outflow | Yes: drag |
| 13 | Budget bar | Instrument | Top-strip bar showing capital spend and committed annual maintenance against the cap | No |
| 14 | Thirty-year clock | Instrument | Timeline scrubber 0–30 years driving vegetation growth, subsidence, populations and levee failure rolls | Yes: drag |
| 15 | Project tray | UI-Probe | Bottom rack of costed project tokens with unit price and maintenance cost printed on each | Yes: drag |
| 16 | Commission report card | Instrument | Final scoring panel: biodiversity outcome, budget compliance, stakeholder acceptance and a written rationale field | Yes: swap |

**How it works — the model.**
The Delta runs as a coupled system rather than a set of independent projects. Freshwater outflow and export pumping trade off directly: raising exports pulls the low-salinity zone eastward, which shrinks smelt habitat and raises the water agency's satisfaction at the same time. Breaching an island for tidal marsh adds rearing habitat that raises salmon survival and buffers flood peaks, but permanently removes that island's farmland and drops the farmer's meter. Subsidence continues on every farmed island at roughly 1–2 cm per year, so the cost of defending a levee rises through the run and the model never lets a do-nothing plan stay level. Each levee faces an annual failure probability, reduced by reinforcement; a failure floods that island regardless of any other plan. Every project carries capital plus annual maintenance, and maintenance is charged for all thirty years, so an over-built year-one plan runs out of money by year twelve. Stakeholder meters move from measured outcomes, not from opinion, and each seat has one red line that fails the plan if crossed.

**Control panel.**

| Control | Widget | Range / options | Default | Unit | What it changes |
|---|---|---|---|---|---|
| Ecosystem case | Dropdown | Sacramento–San Joaquin Delta / Monterey Bay kelp / Sierra meadow | Delta | — | Structural: swaps the whole map, species set and stakeholder seats |
| Total budget | Slider | 50–1200 | 400 | $ million over 30 years | Capital plus all maintenance available |
| Project placement | Drag-handle | Marsh restoration / Levee reinforcement / Fish screens / Invasive control | Marsh restoration | — | Structural: which project the next placement creates |
| Water exports | Slider | 1.0–6.5 | 4.2 | million acre-feet/year | Freshwater outflow, salinity intrusion and smelt habitat |
| Marsh restoration area | Slider | 0–20000 | 0 | hectares | How much diked island is converted to tidal marsh |
| Levee investment | Slider | 0–100 | 30 | % of levee length reinforced | Annual failure probability across the Delta |
| Invasive control funding | Slider | 0–100 | 0 | % of channel area treated per year | Water hyacinth cover and channel habitat quality |
| Sea level rise by 2055 | Slider | 0.1–1.0 | 0.4 | m | Levee load, salinity intrusion and marsh drowning risk |
| Stakeholder view | Multi-select | Five seat cards | All five | — | Which satisfaction meters and red lines are displayed |
| Year clock | Timeline scrubber | 0–30 | 0 | years | Advances subsidence, growth, populations and failure rolls |

**Scenarios.**

| # | Scenario | Preset | The question the student answers |
|---|---|---|---|
| S1 | Hold the line | levee investment=90; marsh restoration area=0; water exports=4.2; year clock=30 | Defend every island and restore nothing. What happens to salmon and smelt by year 30, and what does maintenance cost? |
| S2 | Restore at scale | marsh restoration area=14000; levee investment=20; total budget=400 | Breach a third of the islands. Which two stakeholder meters collapse, and which species recover? |
| S3 | Maximum exports | water exports=6.3; marsh restoration area=6000 | Push exports to the top of the range. Which red line is crossed first? |
| S4 | Rising sea, same budget | sea level rise by 2055=0.9; total budget=400; year clock=30 | Run your best plan again under high sea level rise. What fails, and what would you change? |

**Student activities.**
1. Place projects until the budget bar is full, run the clock to year 30, and record the four report card scores.
2. Set marsh restoration to 14,000 hectares and record salmon survival, smelt population and the farmer's satisfaction before and after.
3. Step water exports from 3.0 to 6.3 in four moves, recording the water agency meter and the smelt population at each step.
4. Rebuild your plan for half the budget and record which projects you dropped and what each drop cost in biodiversity.
5. Write a 60-word rationale in the report card naming your two biggest trade-offs, then record the acceptance score it returns.

**Outputs & measurement.**

| Readout | Type | Unit | Description |
|---|---|---|---|
| Species richness and key populations | Data table | individuals and species | Salmon survival, smelt index, waterbird numbers, total richness at the scrubbed year |
| Tidal marsh area | Live numeric | hectares | Functioning marsh, discounted for the first 12 years of establishment |
| Budget spent and committed | Live numeric | $ million | Capital plus all remaining maintenance against the cap |
| Stakeholder satisfaction | Bar chart | 0–100 | Five meters, with red-line breaches flagged individually |
| Levee failure events | Counter | events | Failures rolled across the run, with the island named |
| Water exports delivered | Line graph | million acre-feet vs years | Delivery trace against the agency's stated minimum |
| Outcome over time | Line graph | index vs years | Biodiversity index across the full 30 years for the current plan |
| Commission report card | Pass-fail badge | — | Pass requires biodiversity gain, budget compliance and no red line crossed |

**What the student should realise.**
Students believe a real conservation problem has a right answer that a well-meaning plan can reach in full. Here every plan that satisfies the fish disappoints a stakeholder, holding every levee costs more each year while species keep declining, and a plan that passes at 0.4 m of sea level rise fails at 0.9 m. Good solutions are defensible trade-offs made under constraint. The student should be able to say: *"I cannot give everyone everything — I can choose openly, show my evidence, and say what I gave up."*

---

*GradeNext Smart Lab · Grade 7 Unit D · 30 experiment specifications · standard v1.0*