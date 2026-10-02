# Batch Plan — GradeNext Smart Lab

*Written 2026-09-25 at the founder's request: "plan a structure batch wise batch for each grade
units … there should be multiple things to teach with experiments on a single topic … focus on
the controls of experiments."* Read `memory.md` first; this plan is built to its §2 mandates and
to the InsightVis build method and lab specification (`docs/insightvis/memory.md` §2.11, §14).

**How to use this file.** Batches run in order. Within a batch, labs are built one at a time and
each is finished (ship checklist, A.3) before the next starts. Batch 1 is specified in full. Every
later batch is specified at the level of *what it computes, what its set-ups teach and which
traps it makes reachable*; **before a batch starts, expand its entries to Batch 1's level of
detail and commit that expansion before writing code.** Record progress in `memory.md` §9 and
§13, never here — this file is the plan, not the log. Change the plan only by editing it in a
commit that says why.

---

## Part A — How a batch works

### A.1 What a lab is

- **One lab per topic**, occasionally one lab for two tightly linked topics. 18 units, 100
  topics → **85 labs** (Part D).
- **A lab is a set of set-ups on one bench.** A `setup` select changes the apparatus; each
  set-up teaches one or more subtopics and says which in its `teaches` list; every subtopic of
  the lab's topics is taught by at least one set-up; the Course Library links each subtopic to
  its set-up (`#<labId>/<setup>`).
- **A real experiment** (memory §2.5): apparatus drawn as the real thing, an independent variable
  the student changes, a dependent variable an instrument reads, the held variables named, data
  into the notebook, a result on the plots.
- **A real model** (memory §2.1): the equations listed under each lab below are integrated or
  solved every frame; the idea the topic teaches is read off the apparatus, never stated first.
- **The full InsightVis anatomy** (`docs/insightvis/memory.md` §14): stage (3D bench wherever the
  thing is three-dimensional), control deck, presets (5–8, each an experiment), two plots (this
  system; the landscape of all comparable systems), readouts (6–11, formula in the label),
  live equation + eqNote, 4–5 predict-then-check problems (CAST pattern, `measure` reads the
  apparatus), 5–9 ask-then-reveal walkthrough steps, 4–5 quiz questions, notes closing on the
  misconception most likely to survive.

### A.2 The controls (memory §2.7)

Every lab's deck is designed before its stage:
1. **Set-up** first (the `setup` select), then one group per part of the apparatus in the order
   a student would assemble the real thing, then **Display** last.
2. Every control changes the computed model and moves at least one readout or plot —
   `audit.mjs` CLEAN and the liveness check green, for every set-up.
3. Controls not used by the current set-up are hidden (`when`), never left inert.
4. The primary variables are stage handles too (drag, synced to the slider, gains per
   InsightVis §2.13), verified with `drag.mjs` in both directions.
5. Real units and real ranges, typed entry, log keys across decades, ranges that include the
   failure.

### A.3 Definition of done

**A lab is done when:**
1. `node audit.mjs` prints CLEAN, including the liveness check for every set-up.
2. `node probchk.mjs <id>` — every problem's measured value matches its `working`, digit for digit.
3. Screenshots of **every set-up and every preset** have been looked at as the founder would look
   at them; 3D benches also through `sweepall.mjs` (home view + two extremes).
4. `node narrow.mjs <id>` — no horizontal overflow at 430 px.
5. `node drag.mjs` on every handle, both directions, no saturation.
6. The numerical checks named in its entry reproduce (InsightVis §14.13) and are written into
   the commit message.
7. Repo gate green (`tsc`, `vitest`, `build`); every subtopic it teaches is linked; pushed
   (the push deploys); `memory.md` §4, §9, §13 updated.

**A batch is done when** all its labs are done, every subtopic of the unit links to a set-up
(a test enforces it), and the founder has a batch report with screenshots of every set-up.
Founder feedback on any shipped batch pre-empts new work (memory §2.8: when the bar moves,
everything below it becomes work).

### A.4 Foundations — built inside Batch 1, reused by every batch

| Foundation | What | Where |
|---|---|---|
| Middle-school conventions in the engine | `grade`, `unit`, `topics`, set-up `teaches`; the rail grouped by unit in teaching order when a grade is shown; `#<labId>/<setup>` deep links; accents for the `engineering` and `earth` subjects | `smartlab/lab-core.js` (marked GradeNext block), `smartlab/index.html` |
| Middle School lab view in the app | a framed lab view like Higher Secondary's; the Course Library links each subtopic to its lab and set-up; a test that every subtopic of a built unit is linked | `app/src/pages/`, `app/src/curriculum/` |
| Liveness audit | sweep every control in every set-up and assert a readout or plot moves | `smartlab/live.mjs` (or an `audit.mjs` extension) |
| `art-life.js` | organisms at organism scale drawn on `render.js`: fish, aquatic and land plants, then (later batches) insects, birds, mammals, micro-organisms, flowers, seeds | `smartlab/` |
| `art-labware.js` | the school bench: glass tank, beaker, flask, test tube, graduated cylinder with meniscus, thermometer, probe, balance, hot plate, stopwatch, light gate, level sensor, test-kit colour cards | `smartlab/` |
| `art-earth.js` + `data-earth.js` | a ray-traced globe with real coastlines (a compact land mask from public-domain Natural Earth data), cutaway layers, terrain sections, clouds, strata | `smartlab/` |

Each library is built before the first lab that needs it and extended by later labs; a lab never
draws an organism, a vessel or a planet by hand (memory §2.4).

### A.5 Where a frozen keeper already covers the ground

Eighteen of the 37 React keepers sit on middle-school topics (noted per lab below). The new lab
must go beyond the keeper — new set-ups, new material, the InsightVis anatomy — and the keeper
stays linked beside it as a second resource. Keepers are never edited (memory §2.9).

---

## Part B — The batches

### Batch 1 — Grade 6 · Unit A · Systems and Subsystems (6 labs)

Subject accent: `engineering` (chosen with 6A-1). Unit A's topics carry no NGSS PE of their own;
they teach the cross-cutting concept *Systems and System Models* and the practices, so `exams`
lists the CCC, the practices used and `CAST`, plus a PE where a set-up genuinely meets one.

#### 6A-1 · The Living Tank — Parts, Boundaries and Flows
**Covers** A1 (A1.1–A1.5) and A2 (A2.1–A2.5). **Stage** a 3D bench: a 54 L planted aquarium on
a wooden stand — glass with real thickness, water volume, gravel, stem and ribbon plants, a
shoal of neon tetras, an air pump and airstone with rising bubbles, a filter in cutaway (sponge
and ceramic media), a heater with its thermostat, a lamp hood, a thermometer and a test-kit card.

**The real computation** — a coupled model in real units, integrated every frame:
- *Dissolved O₂* (mg/L): plant photosynthesis (a light-saturating P–I curve × temperature
  factor × CO₂ limitation), fish respiration (∝ body mass^0.8 × Q₁₀ temperature factor), plant
  respiration day and night, the O₂ demand of nitrification (4.57 g O₂ per g NH₄⁺-N), and
  surface exchange k·(O₂,sat(T) − O₂) whose coefficient rises with agitation (pump, filter
  outflow); O₂,sat(T) from the published freshwater solubility relation.
- *CO₂ and pH*: respiration in, photosynthesis out, exchange toward air equilibrium; pH from the
  carbonate equilibrium with the tank's alkalinity (pH = pK₁ + log[HCO₃⁻]/[CO₂]).
- *The nitrogen cycle*: ammonia from fish (∝ feed protein) and decaying food; nitrifying
  bacteria on the filter media as two populations with Monod kinetics (ammonia → nitrite →
  nitrate); plant uptake; water changes. Free NH₃ fraction from pH and temperature (Emerson
  pKₐ(T)) — the toxic part.
- *Temperature*: heater (thermostat with hysteresis), lamp heat, loss to the room, evaporation.
- *The shoal*: every fish is an agent (separation, alignment, cohesion, noise, predator
  avoidance) swimming in 3D; its behaviour couples to the model (fish gasp at the surface when
  O₂ is low).
- *Tracers*: a carbon atom moves between pools with probabilities taken from the live fluxes;
  a joule of lamp light is followed until it leaves as heat.

**Set-ups**
| `setup` | Teaches | What the student does — what emerges |
|---|---|---|
| `unplug` — Unplug a part | A1.1, A1.3 | Switch parts off or out (lamp, plants, pump, filter flow, rinse the media in tap water, heater, feeding) and watch the interaction web: arrow widths are live fluxes. Knocking out one part fails parts it never touched (lamp off → O₂ falls → fish gasp; CO₂ up → pH down → less free NH₃). The same parts in separate buckets do not keep a fish alive: a system is parts *and* interactions. |
| `zoom` — Systems inside systems | A1.2, A1.5 | Zoom the one O₂ pathway from the planet's biosphere to the tank, one fish, its gill, one cell and its mitochondria; the same *input → process → output* at every level, with the flux in the unit that fits each scale. |
| `shoal` — No fish is in charge | A1.4 | Tune the three local rules and the noise; schooling appears or dissolves. Polarisation and cohesion are measured; a lone fish cannot school; remove any fish, including a chosen "leader", and the school carries on. |
| `boundary` — Draw the boundary | A2.1, A2.5 | Drag a boundary round a fish, the plants, the filter, the water, the tank and air, the room. A ledger shows every flow crossing it. For each question ("why does the fish gasp at dawn?") the lab computes whether the chosen boundary contains what answers it. |
| `sealed` — Open, closed, isolated | A2.2 | The open tank beside a sealed glass sphere and a sealed sphere in the dark. Total carbon inside the sealed sphere stays constant while light still enters and heat leaves; in the dark the sphere runs down. |
| `trace` — Follow an atom and a joule | A2.3, A2.4 | Inputs and outputs of the whole tank (electricity, food, top-up water → heat, evaporated water, trimmings); a tagged carbon atom cycles, a joule of light goes through once and leaves as heat — matter cycles, energy flows. |

**Traps reachable** — "the filter cleans the water" (it houses the bacteria: rinse the media in
tap water and ammonia climbs with the filter still running); "plants make oxygen, so the fish are
safe" (the dawn O₂ minimum); "a closed system has nothing crossing it" (light and heat do);
"schools follow a leader"; "energy is recycled like matter".
**Controls** Set-up · Light (photoperiod, intensity) · Plants (cover, trim) · Fish (number,
feeding) · Filter and air (flow, pump, media state) · Heater (set point, room temperature) ·
Shoal rules (when `shoal`) · Boundary (when `boundary`) · Display.
**Presets** Balanced planted tank · New tank: watch it cycle · Media rinsed in tap water · Power
cut on a hot night · Overstocked, no plants · Sealed sphere in a window · Sealed sphere in the dark
· A school under attack.
**Plots** (1) this tank over time — O₂, CO₂/pH, ammonia–nitrite–nitrate, temperature (or
polarisation in `shoal`); (2) landscape — the dawn O₂ minimum against the number of fish for
every plant cover (the tank's carrying capacity), the classic cycling curve for a new tank, and
polarisation against noise in `shoal`, with the current state as a dot.
**Numerical checks** O₂ saturation 8.26 mg/L at 25 °C and 9.09 mg/L at 20 °C; a new tank's
ammonia then nitrite peaks in the order and on the timescale (weeks) aquarists report; total
carbon in the sealed sphere conserved to rounding; the free-NH₃ fraction against the published
table; the ledger closes (in − out = change in store) for every boundary.

#### 6A-2 · The Draining Tank — Building, Testing and Revising a Model
**Covers** A3 (A3.1–A3.5). **Stage** a 3D bench: a tall clear cylinder with a tap and flow meter,
a sharp-edged orifice at the base whose jet arcs into a catch basin, an ultrasonic level sensor
on top, a stopwatch; a 1:4 and a 1:10 scale model beside it; a stock-and-flow diagram panel.

**The real computation** The apparatus obeys Torricelli with a discharge coefficient
(Cd ≈ 0.61 for a sharp edge), a viscous correction for small orifices, inflow and evaporation:
A·dh/dt = Q_in − Cd·a·√(2gh) − E. The jet's range is computed from its exit speed and fall
height, so it visibly shortens as the level drops. The student's digital models are separate:
constant outflow (dh/dt = −k), outflow ∝ level (−kh) and outflow ∝ √level (−k√h), fitted by
least squares to the sensor's noisy readings.

**Set-ups**
| `setup` | Teaches | What happens |
|---|---|---|
| `why` — Why model? | A3.1 | The town's water tower loses its pump at 6 pm: when does it run dry? Nobody tests that by draining a town — the model answers in seconds, then the real run confirms it. |
| `diagram` — Diagram, flowchart, equation | A3.2 | Drag flows (tap, drain, leak, evaporation, rain) onto the stock; the flowchart becomes the equation shown live and runs beside a labelled cross-section. |
| `scale` — Physical and digital models | A3.3 | Drain the 1:10 model and scale its time up. Dividing by ten fails; the data say √10 (Froude scaling). The digital model needs no scaling. |
| `leaves` — What a model leaves out | A3.4 | Switch the vena contracta, viscosity, evaporation and wall friction in and out of the model: evaporation changes the drain time by a negligible fraction, Cd changes it by tens of percent. Leave out what does not matter for this question. |
| `revise` — Build and revise | A3.5 | Fit model 1, see the residuals curve, revise to model 2, see it never empties, revise to model 3; then test it on a run with the tap on, which it was not fitted to. |

**Traps** a model has to look like the thing; scaling time by the length ratio; a better fit on
the fitting data proves the model (validation run); the linear model "almost" fits.
**Plots** (1) level against time — sensor dots, model line, ghost of the previous model; (2)
drain time against starting height on log–log axes for each model family, with the measured
points — the slope identifies the law.
**Numerical checks** the drain time against the exact Torricelli solution
t = (A/(Cd·a))·√(2h₀/g) (tap off, no viscosity); scale-model times in the ratio √(scale).

#### 6A-3 · Earth's Four Spheres
**Covers** A4.1–A4.5. **Stage** a ray-traced globe with real coastlines and cloud, a cutaway
wedge, and set-up-specific instruments (a seismograph network, a radiosonde, a water-inventory
column, a Whittaker biome chart).

**The real computation**
- *Geosphere*: a layered Earth with published density and seismic velocity profiles (PREM);
  P and S rays traced through the shells by Snell's law; S waves stopped by the liquid outer
  core — the shadow zones emerge from the rays.
- *Hydrosphere*: Earth's water inventory from the published reservoir volumes; melt the ice and
  the sea rises by the computed amount.
- *Atmosphere*: the standard atmosphere (lapse rate by layer, hydrostatic pressure, composition);
  a weather balloon expands (ideal gas) and bursts at altitude.
- *Biosphere*: net primary productivity from the Miami model — the smaller of a temperature-
  limited and a precipitation-limited value — on a draggable point of the biome chart; where
  life is found, from deep crust to high air.
- *Interactions*: a global carbon and water box model with fluxes between the spheres.

**Set-ups** `geo` (A4.1 — set off an earthquake; find the core from the missing S waves; make the
outer core solid and the shadow disappears) · `hydro` (A4.2) · `atmo` (A4.3 — discover the layers
from the radiosonde's own data) · `bio` (A4.4 — which factor limits this biome?) · `links` (A4.5 —
drag an arrow between two spheres to see the process and its flux).
**Traps** the core is known because someone drilled there; most fresh water is in rivers and
lakes; air has no weight; deserts and tundra are unproductive for the same reason.
**Plots** (1) seismic travel time against distance (P and S), or the set-up's profile; (2) the
counterfactual landscape — arrivals with a liquid against a solid outer core — or productivity
across the biome chart, current state as a dot.
**Numerical checks** S shadow beyond ≈ 103°, P shadow ≈ 103°–142°; the inventory sums to
≈ 1.386 × 10⁹ km³; sea-level rise from all ice ≈ 65–70 m; pressure halves near 5.5 km.

#### 6A-4 · One Event, Four Spheres
**Covers** A4.5, A4.6. **Stage** the globe and a four-sphere cascade panel whose arrows carry
computed fluxes; one event at a time, each with its own verified model:
- `eruption` — SO₂ mass → stratospheric aerosol optical depth (e-folding ≈ 1 year) → radiative
  forcing → global temperature from a one-box energy balance with an ocean mixed layer; ash and
  rain → lahars; diffuse light → a photosynthesis response.
- `hurricane` — sea-surface temperature → evaporation (Clausius–Clapeyron) → potential intensity
  → surge and rainfall → coastal erosion; wetlands reduce surge.
- `wildfire` — fuel moisture and wind → burn severity → water-repellent soil → storm runoff by
  the curve-number method → debris and sediment → stream habitat; recovery by succession.
- `drought` — rainfall deficit → soil-moisture bucket → plant stress and productivity → fire
  risk → groundwater pumping → land subsidence.
An event ships only if its model reproduces its numerical check; an unverified event is removed
from the select, never left as an illustration (memory §15).
**Covers** A4.5 in every event (the spheres interact), A4.6 in the modelling of each.
**Plots** (1) each sphere's key variable against time after the event; (2) the landscape — peak
cooling against SO₂ mass for historical eruptions (Pinatubo, El Chichón, Krakatoa, Tambora) with
the current run as a dot, and the equivalent for each event.
**Numerical checks** Pinatubo (≈ 15–20 Mt SO₂) cools the globe ≈ 0.4–0.5 °C about a year later.

#### 6A-5 · The Measurement Bench — Safety, SI Units and Honest Numbers
**Covers** A5.1, A5.3, A5.4. **Stage** a lab bench: hot plate and beaker, acid and water bottles,
digital balance, graduated cylinder with a real meniscus, rock samples, a drop tower with light
gates, a stopwatch; an IR-camera toggle.

**The real computation** lumped cooling of hot glass against published skin-burn thresholds
(temperature × contact time); dilution heat when water meets concentrated acid versus acid
into water (heat released into the small versus the large mass of liquid); parallax error from
the eye's height by geometry; reaction time as a measured distribution (≈ 0.2 s); free fall with
air drag (a ping-pong ball against a steel ball); density by displacement with the uncertainty
of each instrument carried through; least-squares fits and outlier tests on the notebook table.

**Set-ups** `safety` (A5.1 — the rules as physics: hot glass looks like cold glass; acid into
water; working like a scientist) · `units` (A5.3 — SI units and prefixes; identify a mineral by
density; can this cylinder tell pyrite from hematite?) · `timing` (A5.3, A5.4 — hand timing
against gates; repeat trials; the spread) · `graph` (A5.4 — table to graph: variable on the right
axis, the right graph type, best fit, the outlier, the truncated axis that misleads).
**Numerical checks** g recovered from gate timing within the gates' resolution; propagated
density uncertainty against the spread of repeated measurements.

#### 6A-6 · The Fair Test — Variables, Evidence and Investigation Design
**Covers** A5.2, A5.5, A5.6. **Stage** a stairwell drop tower with a metre rule, light gates at
top and bottom, and a paper helicopter (paper texture, folded blades, body, paper clips) that
spins as it falls.

**The real computation** autorotating descent: m·dv/dt = mg − ½ρC·A_disc·v², with the disc from
the blade length, the mass from paper weight and clips, spin-up at release, a spin rate tied to
the descent speed, flutter when long blades are too flexible, and trial-to-trial variation from
release angle and air currents. Timing by stopwatch (reaction noise) or gates.

**Set-ups** `fair` (A5.2 — compare two designs; the lab names the independent, dependent and
held variables and flags a confound: longer blades cut from the same paper also add mass) ·
`trials` (A5.2, A5.4 — how many trials tell a 5 % difference apart?) · `cer` (A5.5 — pick a claim,
pick the evidence rows, and the lab tests the claim against the data: supported, unsupported,
overstated; blade colour is a decoy variable) · `design` (A5.6 — plan the question, variables,
range and trials; the lab runs the plan and scores it before showing the result).
**Plots** (1) drop time per trial for the designs compared (dot plot, mean and range); (2) the
design space — drop time against blade length for several masses, current design as a dot,
optimum and flutter limit visible.
**Numerical checks** terminal descent speeds against published paper-helicopter measurements
(order 1 m/s); the steady speed against the closed form √(2mg/(ρC·A)).

**Batch 1 coverage** — all 27 subtopics: A1.1 unplug · A1.2 zoom · A1.3 unplug · A1.4 shoal ·
A1.5 zoom · A2.1 boundary · A2.2 sealed · A2.3 trace · A2.4 trace · A2.5 boundary · A3.1–A3.5
6A-2 · A4.1–A4.4 6A-3 · A4.5 6A-3 links and 6A-4 · A4.6 6A-4 · A5.1 safety · A5.2 fair, trials ·
A5.3 units, timing · A5.4 graph, trials · A5.5 cer · A5.6 design.

---

Batches 2–18 list each lab as: **covers** · **computes** · **set-ups** (subtopics) · **traps** ·
*keeper overlap* where one exists.

### Batch 2 — Grade 6 · Unit B · Cells, Bodies and Senses (6 labs)

**6B-1 · The Microscope — Discovering Cells** · B1 · MS-LS1-1
Computes: compound-microscope optics (magnification, field of view, depth of field, resolution
0.61λ/NA — the Higher Secondary resolving lab's maths), each specimen imaged at the chosen
objective with its true blur; low-Reynolds-number swimming for live organisms; division timing.
Set-ups: `hooke` (B1.2 — Hooke's and Leeuwenhoek's instruments on cork and pond water) · `theory`
(B1.1) · `living` (B1.3 — yeast, pollen, sand, a salt crystal against the criteria of life) ·
`unicellular` (B1.4) · `multicellular` (B1.5 — Volvox against true tissue) · `scale` (B1.6 —
what each magnification can resolve; why no light microscope shows a virus).
Traps: more magnification always shows more (empty magnification); all cells are one size.

**6B-2 · Inside the Cell — Membranes, Walls and Organelles** · B2 · MS-LS1-2
Computes: osmosis (water potential; plant-cell turgor against the wall; a red cell swelling to
lysis), diffusion time ≈ x²/2D and surface-to-volume supply, organelle supply and demand.
Set-ups: `membrane` (B2.1 — visking-tube cell with starch, glucose and iodine) · `wall` (B2.2 —
onion cell and red cell in a salt series) · `nucleus` (B2.3 — Hämmerling's Acetabularia grafts:
the cap follows the nucleus) · `mito` (B2.4) · `chloro` (B2.5) · `size` (B2.6 — grow a cell until
its centre starves).
Traps: osmosis moves salt; plant cells have no mitochondria; the wall keeps water out.

**6B-3 · Levels of Organization** · B3 · MS-LS1-3
Computes: sizes and counts at each level (≈ 3.7 × 10¹³ cells in an adult), and shape-for-job
physics — a red cell's biconcave disc against a sphere of equal volume (O₂ loading time), a
neuron's length against signal time, root-hair area against uptake; differentiation as genes
switched on.
Set-ups: `hierarchy` (B3.1, B3.6) · `special` (B3.2) · `tissues` (B3.3) · `organs` (B3.4 — the
stomach wall layer by layer) · `systems` (B3.5 — knock one organ out).
Traps: bigger animals have bigger cells; every body cell is the same apart from shape.

**6B-4 · The Body Systems Bench** · B4 · MS-LS1-3
Computes one classic experiment per system: amylase on starch in a water bath (Michaelis–Menten
with thermal denaturation; the iodine colour) · a nephron's filtration and reabsorption with ADH
· the heart as a pump and flow through a narrowed vessel (∝ r⁴) · the bell-jar lung (Boyle's law)
and a spirometer trace · the forearm as a lever (biceps force to hold a load) · the ruler-drop
reaction test (d = ½gt²).
Set-ups: `digestive` (B4.1) · `excretory` (B4.2) · `circulatory` (B4.3) · `respiratory` (B4.4) ·
`muscular` (B4.5) · `nervous` (B4.6).
Traps: muscles push; the lungs draw air in by themselves; the biceps pulls with the load's weight.
*Keeper overlap: body-systems.*

**6B-5 · The Body During Exercise** · B5 · MS-LS1-3
Computes: a coupled whole-body model — muscle O₂ demand from power, cardiac output and
ventilation responses (breathing driven mainly by CO₂), O₂ delivery = output × arteriovenous
difference, blood glucose from gut and liver, heat → sweat → water loss → kidney conservation.
Set-ups: `meal` (B5.1) · `oxygen` (B5.2) · `move` (B5.3 — motor-unit recruitment) · `balance`
(B5.4) · `exercise` (B5.5 — rest → run → recover, every system on one timeline) · `break` (B5.6 —
anaemia, asthma, a blocked artery, dehydration: watch the others compensate).
Traps: we breathe harder because O₂ runs out; one organ limits exercise.

**6B-6 · Stimulus, Signal, Response, Memory** · B6 · MS-LS1-8
Computes: receptor thresholds and Weber's law, two-point discrimination from receptor density,
conduction at real velocities (myelinated against unmyelinated) plus synaptic delays, Hick's law
for choice reactions, reflex-arc against voluntary latency, a forgetting curve with rehearsal.
Set-ups: `receptors` (B6.1) · `pathway` (B6.2) · `processing` (B6.3) · `reflex` (B6.4) · `memory`
(B6.5) · `together` (B6.6 — a ball thrown at you: every stage's time; can you catch it?).
Traps: reflexes pass through the brain; the hand does the feeling; memory is a recording.

### Batch 3 — Grade 6 · Unit C · Energy, Heat and Thermal Systems (5 labs)

**6C-1 · The Energy Chain Bench** · C1
Computes: a chain in joules and watts — solar cell → battery → motor lifting a mass → falling mass
driving a generator → lamp — with losses at each stage; a cart on a track with friction and drag;
the ledger sums to the input at every instant.
Set-ups: `forms` (C1.1) · `kinetic` (C1.2 — speed gates) · `potential` (C1.3) · `chain` (C1.4) ·
`conserve` (C1.5 — thermal energy is the hidden bucket) · `everyday` (C1.6 — kettle, braking bike,
phone charger as computed Sankeys).
Traps: energy gets used up; a battery stores electricity. *Keeper overlap: kinetic-energy.*

**6C-2 · The Particle Box** · C2 · MS-PS3-5 context
Computes: molecular dynamics (Lennard-Jones, velocity Verlet, thermostat) — phases emerge;
Brownian motion of a large particle (mean-square displacement ∝ t); speed distribution and
temperature from mean kinetic energy; total thermal energy ∝ amount; a thermometer probe with
its own heat capacity.
Set-ups: `particles` (C2.1) · `brownian` (C2.2) · `phases` (C2.3) · `temperature` (C2.4) · `total`
(C2.5 — a spark against a bathtub) · `thermometer` (C2.6 — a probe that disturbs a small sample).
Traps: solid particles do not move; temperature is the amount of heat.
*Keeper overlap: states-of-matter.*

**6C-3 · The Heat Transfer Bench** · C3 · MS-PS3-4
Computes: the heat equation on rods and slabs; a low-resolution convection tank (Boussinesq
flow — warm plumes rise); Stefan–Boltzmann radiation with emissivity; contact temperature from
thermal effusivity; relaxation to equilibrium with one energy ledger.
Set-ups: `direction` (C3.1 — "cold flows in") · `conduction` (C3.2 — Ingen-Housz's rods with wax
beads) · `convection` (C3.3) · `radiation` (C3.4 — Leslie's cube under an IR camera) · `materials`
(C3.5 — why metal feels colder at the same temperature) · `equilibrium` (C3.6).
*Keeper overlap: heat-transfer.*

**6C-4 · The Specific Heat Investigation** · C4 · MS-PS3-4
Computes: calorimetry on identical hot plates with real specific heats and Newton-cooling losses;
probe sampling; c = P/(m·dT/dt) with the loss correction.
Set-ups: `material` (C4.1) · `mass` (C4.2) · `plan` (C4.3 — confounds flagged) · `collect` (C4.4) ·
`analyze` (C4.5) · `explain` (C4.6 — why beach sand burns and the sea does not).

**6C-5 · The Thermal Design Studio** · C5 · MS-PS3-3, MS-ETS1-3, MS-ETS1-4
Computes: a thermal-resistance network (layers with real conductivities, film coefficients,
radiation, air gaps) over hours; melting ice with latent heat; cost, mass and size constraints.
Set-ups: `materials` (C5.1) · `define` (C5.2) · `build` (C5.3 — drag layers into a cooler or solar
cooker) · `test` (C5.4) · `compare` (C5.5) · `redesign` (C5.6).

### Batch 4 — Grade 6 · Unit D · Water, Atmosphere and Weather (6 labs)

**6D-1 · The Water Cycle Machine** · D1 · MS-ESS2-4
Computes: a global reservoir box model (published volumes and fluxes; residence = volume ÷ flux)
and a bench terrarium — evaporation from the vapour-pressure deficit (Clausius–Clapeyron),
condensation at the dew point, infiltration capacity against runoff, transpiration.
Set-ups: `reservoirs` (D1.1) · `evaporate` (D1.2 — a cloud chamber) · `rain` (D1.3) · `transpire`
(D1.4 — a potometer) · `drivers` (D1.5 — switch off the Sun, then gravity) · `residence` (D1.6).
Traps: clouds are vapour; the cycle is one circle. *Keeper overlap: water-cycle.*

**6D-2 · The Atmosphere Column** · D2
Computes: the standard atmosphere, hydrostatic pressure, ideal-gas expansion, parcel buoyancy
and hot-air-balloon lift L = V(ρ_out − ρ_in)g.
Set-ups: `composition` (D2.1) · `layers` (D2.2 — the radiosonde) · `pressure` (D2.3) · `ptrho`
(D2.4 — a sealed bag up a mountain) · `rise` (D2.5 — will the balloon fly?).

**6D-3 · The Weather Station** · D3
Computes: each instrument as an instrument — thermometer time constant, aneroid barometer,
psychrometer (wet and dry bulb → humidity and dew point), tipping-bucket gauge, cup anemometer
and vane — driven by a diurnal weather generator.
Set-ups: `temperature` (D3.1) · `barometer` (D3.2) · `humidity` (D3.3) · `precipitation` (D3.4) ·
`wind` (D3.5) · `station` (D3.6). *Keeper overlap: weather.*

**6D-4 · Air Masses and Fronts** · D4 · MS-ESS2-5
Computes: a vertical section with two air masses (cold air undercuts warm; front slope from the
density contrast), lifting to the condensation level → cloud and rain type; a pressure map with
winds from high to low; station records as a front passes.
Set-ups: `masses` (D4.1) · `highs` (D4.2) · `cold` (D4.3) · `warm` (D4.4) · `occluded` (D4.5) ·
`track` (D4.6 — find the front's speed from three stations). *Keeper overlap: fronts.*

**6D-5 · Unequal Heating** · D5
Computes: insolation from solar angle and day length, a surface energy balance with heat
capacity and mixing depth, the lapse rate, albedo by surface, a 24-hour surface temperature.
Set-ups: `angle` (D5.1) · `landwater` (D5.2) · `altitude` (D5.3) · `albedo` (D5.4) · `combined`
(D5.5). *Keeper overlap: unequal-heating.*

**6D-6 · California's Weather Machine** · D6
Computes: a coast-to-desert section — upwelled cold water, a marine-layer inversion and fog at
the dew point, moist then dry lapse rates over the Coast Ranges and Sierra Nevada (rain shadow,
warmer and drier lee), ocean moderation by heat capacity.
Set-ups: `coastal` (D6.1) · `fog` (D6.2) · `rainshadow` (D6.3) · `deserts` (D6.4) · `pacific`
(D6.5) · `together` (D6.6 — model against published climate normals for San Francisco,
Sacramento and Death Valley).

### Batch 5 — Grade 6 · Unit E · Regional Climate, Organisms and Heredity (5 labs)

**6E-1 · Climate from Weather** · E1 · MS-ESS2-6
Computes: a stochastic daily weather generator per location → 30-year statistics → climographs
→ the Köppen rules applied to them.
Set-ups: `weathervsclimate` (E1.1) · `build` (E1.2) · `graphs` (E1.3) · `maps` (E1.4) · `zones` (E1.5).
Traps: a cold day disproves a warming climate; climate is only an average.

**6E-2 · Circulation of Air and Ocean** · E2 · MS-ESS2-6
Computes: a convection tank; parcels on a rotating sphere (f = 2Ω sin φ); exact rotating-frame
trajectories on a turntable; wind-driven gyres (the Stommel model — western boundary currents
emerge); seawater density from temperature and salinity; poleward heat transport.
Set-ups: `convection` (E2.1) · `cells` (E2.2) · `coriolis` (E2.3) · `currents` (E2.4) · `density`
(E2.5) · `heat` (E2.6). Traps: Coriolis sets the swirl in a sink.

**6E-3 · Making the Next Generation** · E3 · MS-LS1-4
Computes: mate choice against predation risk; clutch size against offspring survival (Lack's
optimum); pollinator agents carrying pollen between flowers; winged-seed descent and wind drift.
Set-ups: `courtship` (E3.1) · `care` (E3.2) · `flower` (E3.3 — a 3D dissection) · `pollinate`
(E3.4) · `seeds` (E3.5). Traps: more eggs always means more young raised.

**6E-4 · Nature and Nurture Growth Chambers** · E4 · MS-LS1-5
Computes: plant growth (radiation-use efficiency × light, with water, nutrient and temperature
limits) for different genotypes; temperature-sensitive coat colour; hydrangea colour and pH;
reaction norms.
Set-ups: `environment` (E4.1) · `test` (E4.2) · `genes` (E4.3) · `compare` (E4.4) · `separate`
(E4.5 — a 2 × 2 design).

**6E-5 · The Heredity Lab** · E5 + E6 · MS-LS3-2
Computes: meiosis with independent assortment, fertilization, cloning, crosses at population
scale (3 : 1 emerges with numbers), pedigrees, sexual against asexual populations in a changing
environment.
Set-ups: `sexual` (E5.1, E6.3) · `resemble` (E5.2, E6.2) · `asexual` (E5.3, E5.4, E6.4) · `compare`
(E5.5) · `genes` (E6.1) · `diagrams` (E6.5) · `punnett` (E6.6). *Keeper overlap: heredity.*

### Batch 6 — Grade 6 · Unit F · Global Warming and Human Impact (4 labs)

**6F-1 · Earth's Energy Balance** · F1 + F3 · MS-ESS3-5
Computes: a zero-dimensional energy balance with a greenhouse layer, CO₂ forcing
5.35 ln(C/C₀), ice-albedo and water-vapour feedbacks, a two-box ocean, emissions → CO₂, natural
forcings (solar cycle, volcanic aerosol).
Set-ups: `components` (F1.1, F1.5) · `budget` (F1.2) · `greenhouse` (F1.3) · `feedback` (F1.4) ·
`gases` (F3.1) · `fossil` (F3.2) · `land` (F3.3) · `natural` (F3.4) · `timescales` (F3.5).
Traps: the greenhouse effect is the ozone hole; the sealed-jar demonstration proves it (it mostly
measures blocked convection); the Sun explains recent warming.

**6F-2 · Reading the Climate Record** · F2 + F4 · MS-ESS3-5
Computes: pseudo-proxy records from a reference history calibrated to published values, each
through its own response and noise (ice-core gas smoothing, tree-ring width, coral isotopes,
tide gauges, sea ice, the Keeling curve with its seasonal cycle); trend fits and their
sensitivity to the start year.
Set-ups: `icecore` (F2.1) · `rings` (F2.2) · `instrumental` (F2.3) · `sealevel` (F2.4) · `keeling`
(F2.5) · `agree` (F2.6) · `causation` (F4.1) · `graphs` (F4.2 — truncated axes and cherry-picked
start years) · `apply` (F4.3) · `multiple` (F4.4) · `claims` (F4.5).
Traps: one cool year reverses the trend; CO₂ lagging temperature in ice cores rules CO₂ out.

**6F-3 · Living Systems Under Warming** · F5
Computes: thermal niches along a mountain and a latitude gradient with dispersal limits;
degree-day flowering against day-length-cued pollinators (mismatch); snowpack and water; coral
degree-heating weeks; thermal tolerance limits.
Set-ups: `habitat` (F5.1) · `resources` (F5.2) · `timing` (F5.3) · `ranges` (F5.4) · `limits` (F5.5).

**6F-4 · The Mitigation Studio** · F6 · MS-ESS3-3, MS-ETS1-1, MS-ETS1-2
Computes: 6F-1's model driven by a regional plan (stabilization wedges, cost, time to effect),
sea-level rise against a sea wall's height and flood probability, an indicator dashboard.
Set-ups: `monitor` (F6.1) · `mitadapt` (F6.2) · `define` (F6.3) · `compare` (F6.4) · `values`
(F6.5 — which statements a model can test, which are value judgements).

### Batch 7 — Grade 7 · Unit A · Atoms and the Structure of Matter (4 labs)

**7A-1 · The Particle Detective** · A1 · MS-PS1-1
Computes: diffusion as a random walk against temperature; Brownian motion of a colloid and the
Einstein–Perrin relation → Avogadro's number from the student's own measurements; alcohol–water
volume contraction from real densities; the oil-film experiment → the size of a molecule.
Set-ups: `review` (A1.1) · `sharper` (A1.2) · `evidence` (A1.3 — Perrin) · `atoms` (A1.4) ·
`scale` (A1.5 — the oil film).

**7A-2 · Inside the Atom** · A2 · MS-PS1-1
Computes: Thomson's e/m tube; Rutherford scattering (Coulomb trajectories, counts against angle,
plum pudding against nucleus); a nuclide builder with stability; isotope abundances → average
atomic mass; Bohr levels and line spectra → the electron cloud.
Set-ups: `particles` (A2.1) · `number` (A2.2) · `isotopes` (A2.3) · `early` (A2.4) · `cloud` (A2.5)
· `changing` (A2.6 — the experiment that broke each model). *Keeper overlap: build-atom.*

**7A-3 · The Periodic Table Explorer** · A3 · MS-PS1-1
Computes: a verified element data file (source cited in it) drawn as property landscapes;
Mendeleev's prediction of a missing element from its neighbours, checked against germanium;
alkali metals in water (vigour from ionization energy and heat released); a conductivity circuit.
Set-ups: `cell` (A3.1) · `groups` (A3.2) · `metals` (A3.3) · `why` (A3.4) · `reactivity` (A3.5).

**7A-4 · Molecules and Lattices** · A4 + A5 · MS-PS1-1
Computes: a 3D builder with valence rules and force-field relaxation (VSEPR shapes emerge); a
formula parser and atom counter; lattices built from unit cells (NaCl, diamond, graphite, a
metal); van der Waals radii for space-filling.
Set-ups: `ecm` (A4.1) · `formula` (A4.2) · `coefficients` (A4.3 — 2 H₂O against H₂O₂) · `count`
(A4.4) · `build` (A4.5) · `ballstick` (A5.1) · `spacefill` (A5.2) · `lattice` (A5.3) · `compare`
(A5.4) · `choose` (A5.5). *Keeper overlap: molecules.*

### Batch 8 — Grade 7 · Unit B · Chemical Reactions and Conservation of Matter (5 labs)

**7B-1 · The Change Detective** · B1 + B2 · MS-PS1-2
Computes: the stoichiometry of each bench reaction, gas volumes, temperature change from ΔH and
heat capacity; products matched to a property table.
Set-ups: `physical` (B1.1) · `chemical` (B1.2) · `confusing` (B1.3) · `properties` (B1.4, B2.2) ·
`reversible` (B1.5 — hydrated copper sulfate) · `signs` (B2.1) · `unknown` (B2.3) · `appearance`
(B2.4) · `naming` (B2.5). *Keeper overlap: reactions.*

**7B-2 · The Conservation of Mass Balance** · B3 · MS-PS1-5
Computes: reactions on an analytical balance — open flask (CO₂ leaves at a computed rate), sealed
flask with a balloon (constant, until the balloon's buoyancy lowers the reading by ρ_air·V),
burning steel wool (gains oxygen's mass); atom counts synchronized to progress.
Set-ups: `closed` (B3.1) · `open` (B3.2) · `atoms` (B3.3) · `why` (B3.4) · `apply` (B3.5).
*Keeper overlap: conservation.*

**7B-3 · Heating Curves and Particle Forces** · B4 · MS-PS1-4
Computes: constant-power heating with real specific and latent heats; molecular dynamics where
the attraction sets melting and boiling points; a curve predicted for a new substance.
Set-ups: `motion` (B4.1) · `forces` (B4.2) · `read` (B4.3) · `plateau` (B4.4) · `predict` (B4.5).
*Keeper overlap: heating-curve, states-of-matter.*

**7B-4 · The Materials Refinery** · B5 · MS-PS1-3
Computes: fractional distillation (boiling point against carbon number); cracking and
polymerization (chain length against properties); smelting (carbon reduces iron oxide above the
temperature where their oxidation lines cross); alloys; a synthesis yield; life-cycle energy and
CO₂ for natural against synthetic.
Set-ups: `plastics` (B5.1) · `metals` (B5.2) · `medicines` (B5.3) · `costbenefit` (B5.4) ·
`compare` (B5.5).

**7B-5 · Hand Warmer and Cold Pack Design** · B6 · MS-PS1-6
Computes: dissolution and reaction enthalpies (CaCl₂, NH₄NO₃, iron oxidation, sodium acetate
crystallization) with kinetics and a thermal model of a pouch in a hand.
Set-ups: `criteria` (B6.1) · `process` (B6.2) · `data` (B6.3) · `modify` (B6.4) · `report` (B6.5).

### Batch 9 — Grade 7 · Unit C · The Chemistry of Being Alive (3 labs)

**7C-1 · The Photosynthesis Chamber** · C1 + C2 · MS-LS1-6
Computes: pondweed O₂ bubbles against light (P–I curve, inverse square from the lamp), CO₂ and
temperature; leaf-disc flotation; a sealed chamber's gas sensors; the ¹⁸O tracer (the oxygen
comes from water); van Helmont's willow over five years with a carbon and water mass ledger.
Set-ups: `inputs` (C1.1) · `outputs` (C1.2) · `where` (C1.3) · `atoms` (C1.4) · `rate` (C1.5) ·
`intuition` (C2.1) · `vanhelmont` (C2.2) · `soil` (C2.3) · `case` (C2.4) · `evaluate` (C2.5).
Traps: a plant's mass comes from the soil; its oxygen comes from CO₂.

**7C-2 · Respiration and Food Molecules** · C3 + C4 · MS-LS1-7
Computes: a respirometer (germinating peas against beads, CO₂ absorbed), yeast fermentation,
food burned in a calorimeter against food respired (same products, same energy), glucose + O₂
rearranged atom by atom, a fat's respiratory quotient (0.7 against glucose's 1.0) measured.
Set-ups: `inputs` (C3.1) · `outputs` (C3.2) · `where` (C3.3) · `compare` (C3.4) · `both` (C3.5) ·
`breakdown` (C4.1) · `rearrange` (C4.2) · `released` (C4.3) · `burning` (C4.4) · `unfamiliar` (C4.5).
Traps: plants photosynthesise instead of respiring; respiration creates energy.

**7C-3 · A Carbon Atom's Journey** · C5 · MS-LS1-7
Computes: a stochastic carbon tracer over real pools and fluxes; net = gross photosynthesis −
respiration and the light compensation point; snail-and-pondweed tubes with bromothymol blue
(colour from CO₂ through pH).
Set-ups: `plant` (C5.1) · `animal` (C5.2) · `air` (C5.3) · `opposites` (C5.4) · `both` (C5.5).
*Keeper overlap: carbon-cycle.*

### Batch 10 — Grade 7 · Unit D · Matter and Energy in Ecosystems (6 labs)

**7D-1 · Populations and Limits** · D1 · MS-LS2-1 — logistic growth with resource limits, carrying
capacity, Gause's Paramecium competition, the St Matthew Island reindeer boom and crash.
Set-ups: `limits` (D1.1) · `capacity` (D1.2) · `data` (D1.3) · `scarcity` (D1.4) · `competition` (D1.5).

**7D-2 · Food Webs and Energy Flow** · D2 · MS-LS2-3 — energy flow with ≈ 10 % transfer between
levels; pyramids of energy, numbers and biomass (the ocean's inverted biomass pyramid).
Set-ups: `roles` (D2.1) · `web` (D2.2) · `levels` (D2.3) · `ten` (D2.4) · `pyramid` (D2.5).
*Keeper overlap: ecosystem.*

**7D-3 · Decomposers and Nutrient Cycles** · D3 · MS-LS2-3 — litter-bag decomposition against
temperature, moisture and mesh size; the nitrogen and carbon cycles; matter cycles, energy flows.
Set-ups: `cycling` (D3.1) · `decomposers` (D3.2) · `carbon` (D3.3) · `nitrogen` (D3.4) · `together`
(D3.5).

**7D-4 · Interactions Among Organisms** · D4 · MS-LS2-2 — predator–prey cycles (lynx and hare),
competition, mutualism that turns parasitic when nutrients are plentiful, commensalism, parasitism;
one pattern in two ecosystems.
Set-ups: `compete` (D4.1) · `symbiosis` (D4.2) · `pattern` (D4.3) · `shift` (D4.4) · `populations`
(D4.5). *Keeper overlap: symbiosis.*

**7D-5 · Disruption and Succession** · D5 · MS-LS2-4 — a landscape automaton (fire, flood,
invasive species, succession stages) with before-and-after data.
Set-ups: `physical` (D5.1) · `biological` (D5.2) · `argue` (D5.3) · `succession` (D5.4) ·
`timescales` (D5.5).

**7D-6 · Biodiversity and Ecosystem Services** · D6 · MS-LS2-5 — the species–area relationship
S = cA^z, fragmentation and corridors, service values, competing solutions scored for a real
California ecosystem.
Set-ups: `services` (D6.1) · `threats` (D6.2) · `solutions` (D6.3) · `evaluate` (D6.4) · `real` (D6.5).

### Batch 11 — Grade 7 · Unit E · Earth's Materials and Moving Plates (6 labs)

**7E-1 · The Rock Cycle Machine** · E1 · MS-ESS2-1 — cooling rate → crystal size (nucleation and
growth), compaction with burial, metamorphic grade from a pressure–temperature path,
identification tests (grain size, hardness, acid, density).
Set-ups: `igneous` (E1.1) · `sedimentary` (E1.2) · `metamorphic` (E1.3) · `identify` (E1.4) ·
`energy` (E1.5). *Keeper overlap: rock-cycle.*

**7E-2 · The Stream Table** · E2 · MS-ESS2-2 — erosion, transport and deposition against grain size
and flow speed (Hjulström), frost wedging, chemical weathering rates, delta sorting, soil horizons.
Set-ups: `physical` (E2.1) · `chemical` (E2.2) · `agents` (E2.3) · `deposit` (E2.4) · `soil` (E2.5).
*Keeper overlap: erosion.*

**7E-3 · Fast and Slow Earth** · E3 · MS-ESS2-2 — a landscape-evolution model (hillslope diffusion
+ stream incision) over a million years, event deposits, explanation from layers, outcrop to
continent.
Set-ups: `fast` (E3.1) · `slow` (E3.2) · `layers` (E3.3) · `combine` (E3.4) · `scale` (E3.5).

**7E-4 · The Evidence for Moving Plates** · E4 · MS-ESS2-3 — continental fit by rotation about an
Euler pole (Bullard's 1965 fit), fossil and rock-belt matches, magnetic stripes from a reversal
timeline and a spreading rate, GPS velocities, reconstructing the history.
Set-ups: `coasts` (E4.1) · `fossils` (E4.2) · `seafloor` (E4.3) · `data` (E4.4) · `history` (E4.5).
*Keeper overlap: plate-tectonics.*

**7E-5 · Plate Boundaries** · E5 · MS-ESS2-3 — divergent, subducting, colliding and transform
sections; a spring-block fault (stick–slip earthquakes); where hazards cluster; a boundary map.
Set-ups: `divergent` (E5.1) · `convergent` (E5.2) · `transform` (E5.3) · `hazards` (E5.4) · `map` (E5.5).

**7E-6 · Where Resources Are** · E6 · MS-ESS3-1 — ore at subduction arcs, the oil window from
burial depth and geothermal gradient, groundwater by Darcy's law and a well's cone of depression
(and the subsidence it causes), formation rate against use rate.
Set-ups: `minerals` (E6.1) · `energy` (E6.2) · `groundwater` (E6.3) · `renewable` (E6.4) · `explain`
(E6.5).

### Batch 12 — Grade 7 · Unit F · Natural Hazards and Engineering Solutions (3 labs)

**7F-1 · Hazards and Their Reach** · F1 · MS-ESS3-2 — shaking against magnitude and distance,
tsunami speed √(gh) and travel times, wildfire spread with wind and slope, flood hydrographs;
California's own profile.
Set-ups: `geologic` (F1.1) · `weather` (F1.2) · `tsunami` (F1.3) · `california` (F1.4) · `reach` (F1.5).

**7F-2 · Forecasting and Early Warning** · F2 · MS-ESS3-2 — Gutenberg–Richter statistics from a
synthetic catalogue, recurrence and 30-year Poisson probability, hazard maps, early-warning time
(S-wave arrival minus detection).
Set-ups: `history` (F2.1) · `probability` (F2.2) · `maps` (F2.3) · `warning` (F2.4) · `inform` (F2.5).

**7F-3 · The Shake-Table Engineering Studio** · F3 + F4 + F5 · MS-ETS1-1…4
Computes: a multi-storey frame as masses, springs and dampers (natural frequencies, resonance with
ground motion, bracing, base isolation, a tuned mass damper) under synthetic ground motions.
Set-ups follow the design cycle: `problem` (F3.1, F3.2, F3.3) · `tradeoffs` (F3.4, F3.5) ·
`candidates` (F4.1, F4.4) · `score` (F4.2, F4.3) · `recommend` (F4.5) · `model` (F5.1) · `rounds`
(F5.2, F5.3) · `optimize` (F5.4, F5.5).
Traps: stiffer is always safer; taller always sways more.

### Batch 13 — Grade 8 · Unit A · Motion, Forces and Collisions (3 labs)

**8A-1 · The Motion Track** · A1 + A2 · MS-PS2-2 — a cart and a motion sensor (noisy samples,
least-squares slopes); drag the cart to draw the graphs; a train and platform for reference
frames; a fan cart for constant acceleration; braking.
Set-ups: `displacement` (A1.1) · `velocity` (A1.2) · `xt` (A1.3) · `frames` (A1.4) · `average`
(A1.5) · `acceleration` (A2.1) · `vt` (A2.2) · `changing` (A2.3) · `braking` (A2.4) · `connect` (A2.5).
*Keeper overlap: motion-graphs.*

**8A-2 · Newton's Laws Bench** · A3 + A4 · MS-PS2-1, MS-PS2-2 — an air track with variable friction
(inertia appears as friction goes to zero; Galileo's two ramps), force sensors, live free-body
diagrams, static and kinetic friction, the tablecloth trick (impulse μmgΔt), a cart pulled by a
hanging mass (the hanging mass accelerates too).
Set-ups: `inertia` (A3.1) · `balanced` (A3.2) · `fbd` (A3.3) · `friction` (A3.4) · `everyday` (A3.5)
· `plan` (A4.1) · `fma` (A4.2) · `run` (A4.3) · `compare` (A4.4) · `communicate` (A4.5).
Traps: moving things need a force to keep moving; heavier objects fall faster.

**8A-3 · Collisions and the Third Law** · A5 + A6 · MS-PS2-1, MS-ETS1-1, MS-ETS1-2 — two carts with
force sensors (mirror-image force–time curves), a balloon-rocket cart, crumple-zone design from
materials' force–crush curves (stopping distance → peak force), criteria and scoring.
Set-ups: `pairs` (A5.1) · `objects` (A5.2) · `misconception` (A5.3 — the truck and the bug) ·
`safety` (A5.4) · `test` (A5.5) · `criteria` (A6.1) · `impulse` (A6.2) · `candidates` (A6.3) ·
`evaluate` (A6.4) · `report` (A6.5). *Keeper overlap: collisions.*

### Batch 14 — Grade 8 · Unit B · Energy in Moving Systems (3 labs)

**8B-1 · The Energy Launcher** · B1 + B2 · MS-PS3-1, MS-PS3-2 — launcher and speed gates (KE
against mass and speed; stopping distance ∝ v²), springs and slingshots (½kx², the area under
force–extension), lifting, the Earth–ball and magnet systems, a potential-energy landscape track,
a bungee jump (a spring only when taut).
Set-ups: `mass` (B1.1) · `speed` (B1.2) · `why` (B1.3) · `curve` (B1.4) · `crash` (B1.5) · `gravity`
(B2.1) · `elastic` (B2.2) · `system` (B2.3) · `arrangement` (B2.4) · `tradeoff` (B2.5).
*Keeper overlap: kinetic-energy, pendulum.*

**8B-2 · Where the Energy Goes** · B3 + B4 · MS-PS3-2 — spring against clay bumpers with energy
bars that include thermal and sound, a crash's crumple work, a bouncing ball's restitution and
warming, a multi-step chain, a perpetual-motion claim tested (the overbalanced wheel).
Set-ups: `converted` (B3.1) · `elastic` (B3.2) · `crash` (B3.3) · `safety` (B3.4) · `compare` (B3.5)
· `conserved` (B4.1) · `multistep` (B4.2) · `dissipation` (B4.3) · `bounce` (B4.4) · `claim` (B4.5).

**8B-3 · The Trebuchet Studio** · B5 · MS-ETS1-4 — a trebuchet as a real multibody simulation
(counterweight, arm ratio, sling length, release): model → data → modify → trade-offs → round two.
Set-ups: `model` (B5.1) · `round1` (B5.2) · `modify` (B5.3) · `tradeoff` (B5.4) · `round2` (B5.5).

### Batch 15 — Grade 8 · Unit C · Noncontact Forces and Fields (3 labs)

**8C-1 · The Electric Force Bench** · C1 + C2 · MS-PS2-3 — rubbing and the triboelectric series,
the electroscope, induction, Coulomb's torsion balance (the inverse square found on log axes),
charge magnitude, Van de Graaff sparks and lightning (air breaks down near 3 MV/m).
Set-ups: `contact` (C1.1) · `noncontact` (C1.2) · `sort` (C1.3) · `attract` (C1.4) · `field` (C1.5)
· `charge` (C2.1) · `questions` (C2.2) · `distance` (C2.3) · `magnitude` (C2.4) · `lightning` (C2.5).

**8C-2 · Magnets and Electromagnets** · C3 · MS-PS2-3 — dipole fields with an iron-filings
texture, compasses, induced magnetism, Oersted's experiment, an electromagnet builder
(B = μ₀μᵣnI; paper clips lifted), Earth's field and dip angle.
Set-ups: `poles` (C3.1) · `materials` (C3.2) · `current` (C3.3) · `build` (C3.4) · `earth` (C3.5).

**8C-3 · Gravity and Fields** · C4 + C5 · MS-PS2-4, MS-PS2-5 — the Cavendish balance, weight on
other worlds (a balance and a spring scale on the Moon), the pull between two people,
gravitational, electric and magnetic fields mapped side by side with a test object, energy across
empty space.
Set-ups: `attractive` (C4.1) · `massdistance` (C4.2) · `unnoticed` (C4.3) · `massweight` (C4.4) ·
`apply` (C4.5) · `field` (C5.1) · `map` (C5.2) · `evidence` (C5.3) · `energy` (C5.4) · `unify` (C5.5).
Traps: there is no gravity in space; mass and weight are the same thing.

### Batch 16 — Grade 8 · Unit D · Waves and Information (5 labs)

**8D-1 · Waves on a Rope, a Spring and a Tank** · D1 · MS-PS4-1 — the wave equation on a rope
(v = √(T/μ)) and a slinky, a ripple tank, energy ∝ A², λ and f measured → v.
Set-ups: `properties` (D1.1) · `speed` (D1.2) · `energy` (D1.3) · `types` (D1.4) · `data` (D1.5).
*Keeper overlap: waves.*

**8D-2 · Light Meets Matter** · D2 · MS-PS4-2 — Fresnel reflection, Beer–Lambert absorption,
spectral reflectance × illuminant × eye response → the colour seen, Snell's law and total internal
reflection.
Set-ups: `outcomes` (D2.1) · `model` (D2.2) · `colour` (D2.3) · `refraction` (D2.4) · `evidence`
(D2.5). *Keeper overlap: optics.*

**8D-3 · The Electromagnetic Spectrum** · D3 · MS-PS4-2 — wavelength, frequency and photon energy
across the bands; antennas, microwave heating, a thermal camera (a 310 K body's Planck curve),
ultraviolet and sunburn, X-ray absorption; one speed in vacuum.
Set-ups: `visible` (D3.1) · `order` (D3.2) · `uses` (D3.3) · `speed` (D3.4) · `energy` (D3.5).
*Keeper overlap: em-spectrum.*

**8D-4 · The Sound Lab** · D4 · MS-PS4-1 — the bell jar, pitch and loudness in decibels, the speed
of sound against temperature and medium, the ear's range, echo ranging and ultrasound.
Set-ups: `medium` (D4.1) · `pitchloud` (D4.2) · `speed` (D4.3) · `ear` (D4.4) · `echo` (D4.5).
*Keeper overlap: sound.*

**8D-5 · Analog and Digital Signals** · D5 · MS-PS4-3, MS-ETS1-3 — sampling and quantization,
channel noise with distance (analog fades, digital holds then falls off a cliff), repeaters, a
Hamming(7,4) code correcting a flipped bit, a light-link communicator design.
Set-ups: `encode` (D5.1) · `reliable` (D5.2) · `noise` (D5.3) · `compare` (D5.4) · `device` (D5.5).

### Batch 17 — Grade 8 · Unit E · Space Systems and Deep Time (6 labs)

**8E-1 · The Earth–Moon–Sun Orrery** · E1 · MS-ESS1-1 — phases lit by the Sun (seen from Earth and
from space), umbra and penumbra, the Moon's 5° orbit and its nodes (eclipse seasons), tidal bulges
from differential gravity.
Set-ups: `cycle` (E1.1) · `phases` (E1.2) · `eclipses` (E1.3) · `notmonthly` (E1.4) · `tides` (E1.5).
Traps: phases are Earth's shadow. *Keeper overlap: moon-phases.*

**8E-2 · Seasons** · E2 · MS-ESS1-1 — insolation and day length for any latitude and date from the
real orbital geometry; tilt to zero and the seasons vanish; perihelion falls in January.
Set-ups: `tilt` (E2.1) · `angle` (E2.2) · `hemispheres` (E2.3) · `solstice` (E2.4) · `model` (E2.5).
Traps: seasons come from distance to the Sun. *Keeper overlap: seasons.*

**8E-3 · Orbits, from a Cannon to the Galaxy** · E3 · MS-ESS1-2 — Newton's cannon (falls back,
orbits, escapes), barycentres, Kepler orbits of moons, asteroids and comets from real elements,
the Sun's orbit round the Milky Way.
Set-ups: `holding` (E3.1) · `falling` (E3.2) · `sunmass` (E3.3) · `small` (E3.4) · `galaxy` (E3.5).

**8E-4 · The Scale of the Solar System** · E4 · MS-ESS1-3 — measured sizes and distances, a
to-scale model and why no classroom holds it, planetary properties against each other, a scale walk.
Set-ups: `au` (E4.1) · `data` (E4.2) · `impossible` (E4.3) · `compare` (E4.4) · `build` (E4.5).

**8E-5 · Strata and the Fossil Record** · E5 · MS-ESS1-4 — a stratigraphy builder (deposit, erode,
tilt, fold, intrude, fault) obeying superposition and cross-cutting, index fossils correlating
outcrops, unconformities, rock type → environment, the geologic time scale.
Set-ups: `superposition` (E5.1) · `index` (E5.2) · `record` (E5.3) · `timescale` (E5.4) · `explain`
(E5.5 — the Grand Canyon).

**8E-6 · The Radiometric Clock** · E6 · MS-ESS1-4 — random decay of single atoms (half-life
emerges), real half-lives, a layer bracketed by dated ash beds, a Pb–Pb meteorite isochron
(Patterson's 4.55 billion years), claims evaluated (carbon-14 on a dinosaur).
Set-ups: `relative` (E6.1) · `radiometric` (E6.2) · `combine` (E6.3) · `age` (E6.4) · `evaluate`
(E6.5). *Keeper overlap: radiometric.*

### Batch 18 — Grade 8 · Unit F · Evolution and Sustaining Biodiversity (6 labs)

**8F-1 · The Mutation Lab** · F1 · MS-LS3-1 — DNA → mRNA → protein with the real genetic code;
silent, missense, nonsense and frameshift changes; why most are neutral; sickle-cell and lactase
persistence traced to single changes.
Set-ups: `change` (F1.1) · `outcomes` (F1.2) · `neutral` (F1.3) · `source` (F1.4) · `trace` (F1.5).
*Keeper overlap: mutations.*

**8F-2 · The Fossil Record** · F2 · MS-LS4-1 — fossilization probability (hard parts, burial rate,
low oxygen), first and last appearances, the five mass extinctions, transitional series
(Tiktaalik; the whale series), fossil data analysis.
Set-ups: `formation` (F2.1) · `order` (F2.2) · `transitional` (F2.3) · `timescale` (F2.4) · `analyze`
(F2.5).

**8F-3 · Anatomy, Embryos and the Tree of Life** · F3 · MS-LS4-2, MS-LS4-3 — homologous forelimbs
drawn bone by bone (human, cat, whale, bat), analogous and vestigial structures, embryos compared,
a character matrix → a parsimony tree computed.
Set-ups: `homologous` (F3.1) · `analogous` (F3.2) · `ancestry` (F3.3) · `embryos` (F3.4) · `tree` (F3.5).

**8F-4 · Natural Selection** · F4 · MS-LS4-4 — the Grants' finches after the 1977 drought (the
breeder's equation R = h²S), peppered moths, antibiotic resistance; an individual does not evolve.
Set-ups: `vsh` (F4.1) · `case` (F4.2) · `differential` (F4.3) · `populations` (F4.4) · `explain`
(F4.5). *Keeper overlap: natural-selection.*

**8F-5 · Artificial Selection and Adaptation** · F5 · MS-LS4-5, MS-LS4-6 — selective breeding
(teosinte to maize; the Illinois long-term selection experiment), allele frequency under
selection, gene technologies, predicted future proportions.
Set-ups: `breeding` (F5.1) · `same` (F5.2) · `technology` (F5.3) · `track` (F5.4) · `predict` (F5.5).
*Keeper overlap: artificial-selection.*

**8F-6 · Population, Consumption and Impact** · F6 · MS-ESS3-4 — population milestones, I = P × A × T,
footprints, habitat loss → species–area extinctions, management options with trade-offs.
Set-ups: `population` (F6.1) · `consumption` (F6.2) · `argue` (F6.3) · `biodiversity` (F6.4) ·
`manage` (F6.5).

---

## Part C — Higher Secondary continuation (Class 11–12)

The 42 merged labs cover 28 NCERT chapters. New Higher Secondary labs are built by the same
process in their own files (`smartlab/sims-hs-*.js`) so upstream syncs from InsightVis stay clean,
and declare `grade: 11` or `grade: 12` explicitly (update `hsLabs.test.ts`, which today treats any
lab with `grade:` as middle school). Order, when the founder asks for this track or between batches:
1. **InsightVis's own Phase 2 list** — chemical equilibrium, electrochemical cells, a VSEPR builder;
   DNA replication and translation, nephron filtration, mitosis and meiosis.
2. **NCERT chapters with no lab yet, highest JEE/NEET weight first** — for example Semiconductor
   Electronics, Nuclei, Magnetism and Matter, Electromagnetic Waves, Chemical Kinetics, Solutions,
   Coordination Compounds, Principles of Inheritance, Molecular Basis of Inheritance, Photosynthesis
   in Higher Plants, Breathing and Exchange of Gases.
3. **InsightVis Phase 3 — Mathematics** (JEE): function and surface plotting, conic sections from a
   cutting plane, vector geometry.
Before starting, check upstream InsightVis for labs built since `657e3ab`; sync rather than
duplicate.

---

## Part D — Totals

| Batch | Unit | Topics | Subtopics | Labs |
|---|---|---|---|---|
| 1 | 6A Systems and Subsystems | 5 | 27 | 6 |
| 2 | 6B Cells, Bodies and Senses | 6 | 36 | 6 |
| 3 | 6C Energy, Heat and Thermal Systems | 5 | 30 | 5 |
| 4 | 6D Water, Atmosphere and Weather | 6 | 34 | 6 |
| 5 | 6E Regional Climate, Organisms and Heredity | 6 | 32 | 5 |
| 6 | 6F Global Warming and Human Impact | 6 | 31 | 4 |
| 7 | 7A Atoms and the Structure of Matter | 5 | 26 | 4 |
| 8 | 7B Chemical Reactions and Conservation of Matter | 6 | 30 | 5 |
| 9 | 7C The Chemistry of Being Alive | 5 | 25 | 3 |
| 10 | 7D Matter and Energy in Ecosystems | 6 | 30 | 6 |
| 11 | 7E Earth's Materials and Moving Plates | 6 | 30 | 6 |
| 12 | 7F Natural Hazards and Engineering Solutions | 5 | 25 | 3 |
| 13 | 8A Motion, Forces and Collisions | 6 | 30 | 3 |
| 14 | 8B Energy in Moving Systems | 5 | 25 | 3 |
| 15 | 8C Noncontact Forces and Fields | 5 | 25 | 3 |
| 16 | 8D Waves and Information | 5 | 25 | 5 |
| 17 | 8E Space Systems and Deep Time | 6 | 30 | 6 |
| 18 | 8F Evolution and Sustaining Biodiversity | 6 | 30 | 6 |
| | **Total** | **100** | **521** | **85** |

Every one of the 521 subtopics is named in some lab's set-up list above.
