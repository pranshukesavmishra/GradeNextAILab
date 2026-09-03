# Experiment briefs — Grade 8, Units A and B

Fifty-five experiment briefs, one per subtopic of Unit A (Motion, Forces and
Collisions) and Unit B (Energy in Moving Systems). Each is the complete design
of a ten-to-fifteen-minute experiment. The science in each brief's *Real
numbers* section is taken from the checked `measure` functions and `because`
text in `app/src/sims/topics/g8a*.ts` and `g8b*.ts`; the experience is new.

Every brief was written against the seven-point bar in
`.workflows/REBUILD_BRIEF.md` and the test the founder set: *could a student
learn this from the picture alone, with the text hidden?*

---

## Conventions used in every brief

**Stage layout.** 16:9 stage. The left 62 % is the scene; the right 38 % is
the instrument column: the live graph on top, the run ledger (one row per
completed run) below it, and the energy bars where the brief calls for them.
Physical controls live *in the scene* (a plunger you pull, a clamp you drag, a
pedal you press); a slider appears only where the brief names one, and never
as the only interaction.

**3D and 2D.** Apparatus, surfaces and moving bodies are 3D (the `three3d`
layer), seen from a fixed, slightly elevated three-quarter camera — the
"engineer's view" — unless a brief specifies a side or top camera. Rulers,
scales, gauges, arrows, energy bars, traces and graphs are 2D overlays
projected onto the scene or drawn in the instrument column.

**Instruments (the shared set).**
- *Ruler / distance posts*: metre and 10 cm marks, numbered, projected on the
  surface the body moves along; the origin is drawn as a red start line.
- *Stopwatch*: large digits, starts on release, stops at the trigger the brief
  names.
- *Light gates*: a pair of upright posts with a red beam; a speed readout
  appears above the gate the instant the body clears it.
- *Force gauge*: a spring balance (dial and digital), or a sensor pad; reads
  live and leaves a peak marker.
- *Velocity arrow*: blue, from the body's centre, length proportional to speed
  (scale stated per brief), labelled with the value; always on the body.
- *Force arrows*: one colour per body (body A orange, body B teal, ground and
  Earth grey); the net force is a dashed darker arrow of the same colour drawn
  above the body. Length proportional to magnitude at a scale stated per brief.
- *Energy bars*: a stacked column beside the apparatus. Kinetic orange,
  gravitational store blue, elastic store green, thermal red, sound grey,
  deformation (permanent) brown. The starting total is a horizontal black line
  the column is measured against.
- *Thermal view*: a toggle that tints hot surfaces from transparent through
  yellow to red on a stated °C scale.

**Runs accumulate.** Run 1 is blue, run 2 orange, run 3 green. When a run ends
its trace on the graph stays at full weight; earlier runs are drawn thinner.
The run ledger gets a row per run, and the row is highlighted when the student
hovers its trace. Nothing is plotted before it happens; every trace is drawn
point by point from the stepped model as the run proceeds.

**Predict before run.** The prediction question is asked once, before run 1,
as a four-option choice. The reveal is shown after run 1 ends, beside the
evidence on the graph.

**The lab loop.** Every brief maps onto the `LabDefinition` phases
question → hypothesis (the prediction) → setup (the physical gestures)
→ measure (the runs) → analyze (the graph) → conclude (the write prompt).

---

## Shared scene kits

Where several subtopics share apparatus the engineer builds one kit and the
briefs say what differs.

| Kit | Used by | What it is |
|---|---|---|
| **Track kit** | A1.3, A3.2, A3.3, A3.4, A4.1–A4.5, A5.2 | A 2.0 m aluminium dynamics track on a lab bench, 10 cm marks, red start line, end-stop with a rubber bumper, a pulley that clamps to either end, a pair of light gates on sliding feet, an electromagnet release at the start, and a set of 1.0 kg carts with a load bay for 100 g slotted masses. The bench has an edge and a floor 0.9 m below it. |
| **Road kit** | A2.1–A2.5, A1.5 (partly) | A straight 300 m road on a stage seen from the three-quarter camera, distance posts every 20 m, a car with a speedometer dial, brake lights, tyre skid marks, and a pull-back-to-frame camera. Two live graphs, position-time and velocity-time. |
| **Bus** | A3.5 | A single-deck bus cut away along its length: driver, standing passenger, handrail, floor with anti-slip marks, windows the outside scenery moves past. |
| **Crash rig** | A5.4, A5.5, A6.1–A6.5, B1.5, B3.3, B3.4 | A 12 m rail with a barrier at the end, a sled carrying a seated crash dummy, a clip-on nose element of settable length, a chest force gauge on the dummy, a high-speed clock (ms), an energy bar column. |
| **Energy track** | B1.1–B1.4, B3.1, B4.1 | A curved launch ramp with a height scale (0–1.5 m), a level 3 m run with a light-gate speedometer at the foot of the ramp, and a magnetic brake strip whose retarding force is set on a dial (10 N default), with a distance scale along it. The distance the trolley drives into the brake strip *is* the energy meter. |
| **Stand and drop rig** | B2.1, B2.3, B3.2, B4.4, B5.1–B5.5 | A 2.0 m lab stand with a cm scale, a clamp that slides up and down, an electromagnet release, a clay or anvil landing bed, a height scale on the wall behind, and a strobe trace of the falling body. |
| **Spring bench** | B2.2, B2.4, B2.3 (partly) | A horizontal spring clamped at one end on the bench, a metre rule along it, a force gauge on the free end, a 50 g ball and a vertical launch tube with a 4 m height scale. |
| **Pendulum** | B2.5 | A 2 kg bob on a 1.8 m string from a beam, a protractor at the pivot, a light gate at the bottom, a movable peg. |

---

# Unit A — Motion, Forces and Collisions

## Topic A1 — Describing motion

### A1.1 — Distance vs displacement

**Subtopic.** A1.1 *Distance vs displacement* (`g8a1-around-the-block`).

**The question.** If you walk all the way round the block and end up back on
your own doorstep, how far did you go — and is there more than one honest
answer?

**The scene.** A 3D city block seen from a high three-quarter camera, tilted
enough that the whole rectangle of pavement is visible: 120 m east–west by
80 m north–south, drawn to scale so the long side is 1.5 times the short
side. Four corners, each marked with a street sign (NE, NW, SE, SW). The
start corner (SW) has a red doormat and a pin. A walking figure (articulated
legs, a rucksack, 1.7 m tall at scale) stands on the mat. Two instruments are
attached to the walker:

- On the walker's wrist, a *trip-meter* — a small 2D pedometer readout
  drawn in a callout above the figure, counting metres walked, that only ever
  goes up.
- Tied from the pin at the start corner to the walker's belt, a *taut red
  elastic string*. Along the string a 2D ruler reads its straight-line length,
  and at the pin a small compass rose shows the bearing of the string
  (e.g. "34° N of E").

The path the walker has covered is left on the pavement as a dotted trail of
footprints. Behind the walker, in the instrument column, the graph: x-axis
time (0–120 s), y-axis metres (0–420). Two live lines, *distance* (solid,
climbing) and *displacement* (dashed, the string length).

**What the student does.** The student drags the walker along the pavement.
The walker is constrained to the pavement (dragging into the road or across
the block snaps the figure back to the kerb). Walking speed is capped at
4.0 m/s of sim-time, so a fast drag cannot outrun the clock; a 400 m lap takes
100 s of sim time, played at 8× so it takes about 12 s of real time.

- Run 1: the whole block, anticlockwise, back to the mat.
- Run 2 (change the route): 120 m east to the SE corner and 120 m straight
  back to the mat.
- Run 3 (change the route): the diagonal footpath across the park that
  appears through the middle of the block, SW corner to NE corner, and stop
  there.

**What they see happen.** As the walker moves east along the first side the
trip-meter and the string length climb together and the two graph lines lie
on top of one another. At the SE corner the walker turns north; the string
now runs diagonally across the block, visibly shorter than the pavement
walked, and the two lines part: distance keeps its slope, the string rises
more slowly. At the NE corner the string is at its longest (144 m) and points
34° north of east. Walking west along the north side the string *shortens*
while the trip-meter keeps counting — the dashed line falls while the solid
line rises. Down the west side the string shrinks to nothing; on the mat it
is slack and the ruler reads 0 m. Trip-meter: 400 m.

Run 2: the string stretches to 120 m and shrinks back to 0. Trip-meter 240 m.
Run 3: the string and the footprints lie on top of each other the whole way;
distance and displacement both read 144 m.

**What accumulates.** Three pairs of lines on the same axes, one colour per
run. The solid lines all end at the run's total distance (400, 240, 144). The
dashed lines end at 0, 0 and 144. The ledger has columns *route*, *distance*,
*displacement (size, direction)*. After three runs the student can see that
distance only ever climbs, displacement can fall, and the two agree only when
the route is a straight line.

**The failure state.** There is no physical threshold here; the failure is
the pointer's. If the student drags the walker off the pavement the figure
stops at the kerb and the string quivers; the trip-meter does not count the
attempted shortcut. If the student stops mid-side, the run simply ends where
they stopped and the ledger records a non-zero displacement.

**The prediction.** *You walk all the way round the block and back to the
doormat. What will the two instruments read?*
1. Both 400 m.
2. Trip-meter 400 m, string 0 m. ✔
3. Trip-meter 0 m, string 400 m.
4. Both 0 m — you are back where you started.
Reveal: the trip-meter counts every step (400 m); the string measures where
you are from where you started, and you are on the doormat, so it is slack.

**The misconception it confronts.** *"Distance and displacement are two words
for the same measurement"* and *"Displacement cannot be zero if you have
been walking for ten minutes."* The string does the confronting: it is a
physical object that gets shorter while the pedometer keeps counting, and it
is visibly slack on the mat after 100 s of walking.

**Real numbers.** Block 120 m × 80 m. After side 1: distance 120 m,
displacement 120 m east. After side 2: distance 200 m, displacement
√(120² + 80²) = 144 m at atan(80/120) = 33.7° N of E. After side 3: distance
320 m, displacement 80 m north. Home: distance 400 m, displacement 0 m.
Walking speed 4.0 m/s; one lap 100 s. Distance = Σ|Δpath|;
displacement = (x − x₀, y − y₀), reported as magnitude and bearing.

---

### A1.2 — Speed vs velocity

**Subtopic.** A1.2 *Speed vs velocity* (`g8a1-size-or-arrow`).

**The question.** A toy car holds a perfectly steady speed. Can its velocity
be changing anyway?

**The scene.** A tabletop seen from the three-quarter camera with two slot-car
tracks laid on it side by side, both 6.0 m of track at scale:

- *Left track*: a straight, with a red start line, metre marks along the
  edge, and a reversing switch at each end.
- *Right track*: a circle of circumference 6.0 m (radius 0.955 m), with the
  start line at "12 o'clock" and a compass rose (N, E, S, W) painted inside
  the circle.

One battery car on each track; both cars carry the same two instruments:
a *speedometer dial* in a callout above the car (0–3 m/s, needle) and a
*velocity arrow* (blue, drawn from the car's centre, 0.5 m of arrow per m/s,
labelled with size and compass direction, e.g. "1.5 m/s E"). A throttle lever
sits in front of each track: a physical slider the student drags, marked
0–3 m/s. Instrument column: graph 1 *speed vs time* (0–20 s, 0–3 m/s), graph
2 *direction vs time* (0–20 s, y-axis a compass strip N–E–S–W–N), one line
per car on each.

**What the student does.**
- Run 1: drag both throttles to 1.5 m/s; the cars set off together for 20 s.
- Run 2 (change the direction of one car): flip the straight track's
  reversing switch so the left car runs the same 1.5 m/s the other way.
- Run 3 (change speed): drag both throttles to 3.0 m/s.

**What they see happen.** On the straight, the car runs steadily; its
speedometer needle sits on 1.5 and its arrow points east the whole time,
unchanging in size or direction. On the circle, the needle also sits on 1.5
— but the arrow *turns*: east at the top, south at 3 o'clock, west at the
bottom, north at 9 o'clock, sweeping round once every 4.0 s. On graph 1 both
lines are flat at 1.5. On graph 2 the straight car's line is flat at E; the
circular car's line is a rising sawtooth through E–S–W–N every 4 s.

Run 2: the left car's needle still reads 1.5; its arrow now points west and
graph 2's line for it sits flat at W. Run 3: needles at 3.0; the circular
car's arrow sweeps twice as fast (one turn per 2.0 s).

**What accumulates.** Flat speed lines at 1.5, 1.5, 3.0. Direction lines:
flat E, flat W, and sawtooths of period 4 s and 2 s. Ledger columns:
*track*, *speed*, *velocity at t = 0*, *velocity at t = 2 s*, *did the
velocity change?* (auto-filled Yes/No from the model).

**The failure state.** Above 2.5 m/s on the circle the car's tyres lose grip:
the car slides outward off the slot, leaves the track and stops on the
tabletop; its speedometer drops to 0 and the run ends. Run 3 as written
(3.0 m/s) therefore *fails on the circle*, which is the point: a changing
velocity needs a sideways force, and the slot could not supply enough. The
ledger records "left the track at t = 1.3 s".

**The prediction.** *Both cars are set to a steady 1.5 m/s. After 2 seconds,
which is true?*
1. Both cars have the same velocity as they started with.
2. The straight car's velocity is unchanged; the circular car's velocity has
   changed. ✔
3. Both have changed velocity because both have moved.
4. The circular car's speed has changed.
Reveal: the needles never moved. The arrow on the circle did. Velocity is
the size *and* the arrow.

**The misconception it confronts.** *"Velocity is just a longer word for
speed"* and *"Something moving at a steady speed always has a steady
velocity."* The two dials sit side by side: one never moves and one never
stops turning, on a car whose needle is nailed to 1.5.

**Real numbers.** Speed = |v|; velocity = (v, bearing). Circle radius
0.955 m, circumference 6.0 m; at 1.5 m/s one lap takes 4.0 s, at 3.0 m/s
2.0 s. Bearing on the circle = (360° × t × v / 6.0) measured from N,
clockwise. Grip limit on the circle: v ≤ 2.5 m/s (centripetal a = v²/r =
6.5 m/s² at the limit). The velocity dial's "changed?" flag is true when
either |v| or bearing differs from the run's t = 0 value by more than 1 %
or 2°.

---

### A1.3 — Reading a position-time graph

**Subtopic.** A1.3 *Reading a position-time graph* (`g8a1-slope-is-speed`).

**The question.** A line on a position-time graph goes up steeply. Does that
mean the cart went uphill, or went fast — and what does a line going *down*
mean?

**The scene.** The **Track kit**. The 2.0 m track lies dead level on the
bench, its 10 cm marks numbered 0.0 to 2.0 m from a red start line at the
left. A motion sensor (a small box with a speaker grille) is clamped at the
0.0 end, pointing along the track; every 0.1 s it emits a visible ping — a
thin grey arc that travels along the track, hits the cart, and returns. The
cart is a *constant-velocity buggy*: a 1.0 kg cart with a battery motor, a
speed dial on its top (marked 0–0.5 m/s) and a direction switch (◄ ►). The
end-stop at 2.0 m has a rubber bumper. The bench edge is visible beyond it
and the floor 0.9 m below. A velocity arrow rides on the buggy (0.5 m of
arrow per 0.1 m/s). Instrument column: *position vs time* graph, x 0–10 s,
y 0–2.0 m, with a horizontal line at the buggy's current position that
extends to the y-axis as a pointer.

**What the student does.**
1. Drag the buggy to a starting mark on the track (the position readout
   follows the drag).
2. Turn the speed dial (drag the dial's needle) and set the direction switch.
3. Press the green button on the buggy. The sensor starts pinging and the
   graph starts drawing.
- Run 1: start 0.2 m, 0.2 m/s, forward.
- Run 2 (change speed): start 0.2 m, 0.4 m/s, forward.
- Run 3 (change direction): start 1.8 m, 0.2 m/s, reverse (towards the
  sensor).

**What they see happen.** The buggy moves along a *flat* track; on the graph
the line goes *up*. Each ping adds one dot to the graph, so the line is
built dot by dot, ten per second, and the student can see that a dot lands
exactly where the buggy is. Run 2's line climbs twice as steeply and the
buggy reaches the end-stop in half the time. Run 3: the buggy drives back
towards the sensor and the line *falls* from 1.8 towards 0; the velocity
arrow points left. When the buggy hits the end-stop (run 1 at t = 9 s,
run 2 at 4.5 s) it stops against the bumper and the line goes flat.

**What accumulates.** Three straight lines: slope +0.2, slope +0.4, slope
−0.2, each ending in a flat segment where the buggy stopped. A slope
triangle can be dragged onto any line: it shows rise/run and computes
the gradient, and the ledger row shows the dial setting beside it so the
student sees gradient = dial. Ledger columns: *start (m)*, *dial (m/s)*,
*direction*, *gradient from the graph (m/s)*, *distance*, *displacement*.

**The failure state.** If the student starts the buggy within 0.2 m of the
far end and points it forward at 0.4 m/s the bumper is not enough: the buggy
rides over the end-stop, tips off the bench and falls to the floor. The graph
line ends at 2.0 m with a broken-off marker "left the track". The ledger
records the run as incomplete.

**The prediction.** *You will set the buggy to drive back towards the sensor.
What will the line look like?*
1. A line going up, because the buggy is moving.
2. A flat line, because the buggy is on a flat track.
3. A line going down towards zero. ✔
4. A line drawn from right to left.
Reveal: the line records *where the buggy is*, not which way the track goes.
Getting closer to the sensor means a smaller position, so the line falls.

**The misconception it confronts.** *"A position-time graph is a picture of
the path the object took"* and *"A steeper line means the object is higher
up."* The track is flat and stays flat while the line climbs; the buggy
never leaves the bench while the line falls. The picture and the graph are
on screen together, contradicting each other only if you believe the
misconception.

**Real numbers.** x(t) = x₀ + v t, stepped at the sensor's 10 Hz; gradient
= v; speed = |v|; displacement = v t; distance = |v| t. Buggy speed dial
0–0.5 m/s in 0.05 steps; track 0–2.0 m; end-stop stops a buggy only if
v ≤ 0.3 m/s or it has more than 0.2 m of track left to decelerate over
the bumper (0.05 m compression). (The spec's `measure` uses road-scale ranges,
x₀ ∈ [−20, 20] m, v ∈ [−8, 8] m/s; the relationships are identical and the
bench scale is chosen so the buggy is a thing the student can drag.)

---

### A1.4 — Reference frames

**Subtopic.** A1.4 *Reference frames* (`g8a1-who-is-moving`).

**The question.** A woman walks down the aisle of a moving train. How fast is
she going — and who is right, the person on the platform or the person in
the seat?

**The scene.** Side camera, low, at platform height. A railway platform runs
the full width of the stage: a yellow safety line, a station clock, and a
*platform ruler* — metre marks painted on the platform edge from 0 to 60 m.
A single carriage (3D, windows cut away so the interior is visible) runs
along the track behind the platform: seats, an aisle, and a *carriage ruler*
— metre marks on the aisle floor from 0 to 20 m, numbered from the rear
door. A walker stands in the aisle. A seated passenger sits mid-carriage.
Two tripod cameras are drawn in the scene: one bolted to the platform, one
bolted to the carriage floor; clicking a tripod cuts the view to that camera.
In the platform view the carriage slides across the stage and the platform
ruler is fixed; in the carriage view the carriage fills the stage, the aisle
ruler is fixed, and the platform (with its ruler) slides past the windows
backwards. Two stopwatches, one per camera, and a pair of light gates that
belong to whichever ruler is fixed in the current view. Velocity arrows ride
on the walker, the carriage and the platform ground; each is drawn *relative
to the camera in use*. Controls in scene: the train's throttle (a lever in
the cab, 0–40 m/s, reverse allowed) and a "walk" button that sets the walker
going down the aisle at 1.5 m/s (forward or back). Instrument column:
*position vs time* graph with two lines for the walker — *as measured from
the platform ruler* and *as measured from the aisle ruler*, plus the ledger.

**What the student does.**
1. Set the throttle (default 30 m/s). Press "walk". Click the platform
   tripod. The walker crosses the two platform light gates; the platform
   stopwatch reads the crossing time and the speed appears.
2. Click the carriage tripod. Press "walk" again. The walker crosses the two
   aisle light gates; the aisle stopwatch reads and the speed appears.
- Run 1: train 30 m/s, walker forward.
- Run 2 (change the walker's direction): walker walks towards the rear.
- Run 3 (change the train's speed): throttle to 0; the train stands at the
  platform; walker forward.

**What they see happen.** From the platform tripod, the whole carriage
sweeps across in about two seconds and the walker with it; her arrow reads
31.5 m/s. From the carriage tripod she strolls down the aisle at 1.5 m/s
and the platform ruler streams past the windows the other way at 30 m/s;
her arrow reads 1.5 m/s; the platform's arrow reads −30. Run 2: from the
platform she is still moving forward at 28.5 m/s — walking backwards and
still going the platform's way — while from the seat her arrow points to the
rear at 1.5. Run 3: both tripods agree at 1.5 m/s, and the two graph lines
lie on top of each other.

**What accumulates.** Per run, two lines on the position-time graph: a
steep one (platform frame) and a shallow one (carriage frame). Ledger
columns: *train (m/s)*, *walker along aisle (m/s)*, *walker from platform
(m/s)*, *walker from seat (m/s)*, *platform from seat (m/s)*. After three
runs the sum rule is sitting in the table.

**The failure state.** Set the throttle to full and the walker walking
backwards (−40 + 1.5): from the platform she goes *backwards* at 38.5 m/s;
the ledger records a negative platform velocity, and the student has to say
which way the platform saw her go. Nothing breaks; the failure is that the
"obvious" answer — she walked forward — is wrong in one frame.

**The prediction.** *Train at 30 m/s, walker walking forward at 1.5 m/s.
The platform camera measures her speed. What does it read?*
1. 1.5 m/s — that is how fast she is walking.
2. 30 m/s — she is on the train.
3. 31.5 m/s. ✔
4. It cannot be measured from the platform.
Reveal: the platform light gates timed her at 31.5 m/s; the aisle light gates
timed the same woman at 1.5 m/s. Both are right; each is measured against a
different ruler.

**The misconception it confronts.** *"There is one true velocity and the
other observer is mistaken"* and *"Sitting still on a moving train means
you are not moving."* Two rulers, two stopwatches, two honest numbers for one
walker; and the seated passenger, who never moves in the carriage view,
crosses the platform gates at 30 m/s in the platform view.

**Real numbers.** Walker from platform = v_train + v_walk (31.5 m/s at
defaults); walker from seat = v_walk (1.5); platform from seat = −v_train
(−30); train from walker = −v_walk. Train −40…40 m/s, walker ±1.5 m/s (spec
range −3…3). Light gates 10 m apart on the platform ruler and 6 m apart on
the aisle ruler; speed = gap / crossing time.

---

### A1.5 — Calculating average speed

**Subtopic.** A1.5 *Calculating average speed* (`g8a1-whole-journey`).

**The question.** You walk, you wait, you ride the bus, you walk again. What
was your average speed for the whole trip — and why is it not the average of
the speeds?

**The scene.** A side-scrolling town drawn in 2D (the `geo` kit style) with
the camera following the traveller: a house with a front door on the left;
400 m of pavement with lamp-posts every 50 m; a bus stop with a shelter and
a timetable; 6 000 m of road (the scroll speeds up here) into town; a
town-centre stop; 600 m more of pavement; the school gate. The traveller is
an articulated walking figure with a rucksack. A bus (3D, doors that open)
waits off-screen until called. Two instruments ride in the top corner of the
scene: a *trip-meter* (metres, only ever up) and a *stopwatch that never
stops* (sim seconds, from the moment the front door closes). Time runs at
30× real, so the 1 770 s journey takes about a minute. Instrument column:
*distance vs time* graph, x 0–2 000 s, y 0–7 000 m, drawn live; a straight
"average" line from origin to the run's end point is added when the run
ends.

**What the student does.**
1. Click the front door: the stopwatch starts. Drag the traveller along the
   pavement; the figure walks at 1.33 m/s and will not go faster however
   fast the pointer moves.
2. At the shelter, the wait timer runs. The bus arrives after the wait the
   student has set on the timetable (a dial: 0–300 s). Click the bus door to
   board.
3. The bus drives to town at 6.67 m/s. Click the door to get off. Drag the
   traveller the last 600 m to the gate; the stopwatch stops at the gate.
- Run 1: wait 120 s (the default timetable).
- Run 2 (change the wait): wait 0 s — the bus is there when you arrive.
- Run 3 (change the wait): wait 300 s.

**What they see happen.** The distance line climbs gently as the figure walks
(slope 1.33), goes *flat* while the traveller stands under the shelter (the
stopwatch keeps spinning, the trip-meter does not), then climbs steeply on
the bus (slope 6.67), then gently again. At the gate a straight line from
the origin to the end point is drawn: its slope is the average speed, and it
is labelled with total distance / total time. A second, fainter dashed line
is drawn at the slope of the mean of the leg speeds (3.11 m/s): it visibly
does not reach the school gate at the time the traveller arrived.

**What accumulates.** Three staircase-shaped lines with flat steps of 120,
0 and 300 s. Three "average" lines from the origin with slopes 3.95, 4.24 and
3.59 m/s. The ledger: *wait (s)*, *total distance (m)*, *total time (s)*,
*average speed*, *mean of leg speeds* — the last column is the same 3.11
in every row while the average column changes.

**The failure state.** If the student never calls the bus (wait dial past
300 s, or walking straight past the stop) the traveller must walk the whole
7 000 m at 1.33 m/s: 5 263 s. The graph runs off the right of the axes; the
school bell (drawn at t = 2 700 s as a vertical red line) is passed, and the
gate is shut when the traveller arrives. Ledger: "late".

**The prediction.** *Walking legs at 1.33 m/s, a bus leg at 6.67 m/s, and
120 s standing at the stop. The average speed for the whole trip is…*
1. (1.33 + 6.67 + 1.33) / 3 = 3.11 m/s.
2. 6.67 m/s, because most of the distance was on the bus.
3. 7 000 m / 1 770 s = 3.95 m/s. ✔
4. 1.33 m/s, because you started and finished walking.
Reveal: the straight line from door to gate has slope 3.95. The 3.11 line
misses the gate. Averaging speeds ignores how long each speed lasted.

**The misconception it confronts.** *"Average speed is the mean of the
speeds on each leg"* and *"Time spent waiting does not count in the
journey."* The flat step on the graph is time that counts with no distance to
show for it, and the 3.11 line is drawn so the student can watch it fail to
arrive.

**Real numbers.** Legs: walk 400 m in 300 s (1.33 m/s); wait W s (default
120); bus 6 000 m in 900 s (6.67 m/s); walk 600 m in 450 s (1.33 m/s).
Total 7 000 m in (1 650 + W) s: W = 120 → 1 770 s → 3.95 m/s; W = 0 →
4.24 m/s; W = 300 → 3.59 m/s. Mean of moving-leg speeds = 3.11 m/s (always).
Average speed = total distance / total time.

---

## Topic A2 — Acceleration and motion graphs

All five A2 experiments run on the **Road kit**: the same 300 m road, the
same car, the same two graphs. What differs is which pedal the student has,
what the road is set up with, and which graph is in front.

### A2.1 — Acceleration as a rate of change

**Subtopic.** A2.1 *Acceleration as a rate of change*
(`g8a2-how-quickly-changed`).

**The question.** Two cars both end up at 27 m/s. One took 3 seconds, one
took 9. Which had the bigger acceleration — and does a fast car always have
a big one?

**The scene.** The Road kit, three-quarter camera pulled back so 0–300 m is
in frame with distance posts every 20 m. One car at the 0 m post, a red
start line under its front wheels. Two instruments on the car: a
*speedometer dial* in a callout (0–40 m/s) and a *velocity arrow* (blue,
1 m of arrow per 4 m/s). A second arrow appears while the car is
accelerating: the *acceleration arrow* (orange, drawn behind the car's
rear bumper, 1 m per 1 m/s², labelled). In front of the car, an in-scene
control: a *target-speed post* the student drags along a gauge (0–40 m/s)
and a *stopwatch-limit dial* (the seconds in which the driver must reach
it, 0.5–20 s). A large stopwatch at the top of the scene. Instrument column:
*velocity vs time* graph (x 0–20 s, y 0–40 m/s), drawn live, with the
ledger below.

**What the student does.**
1. Drag the target-speed post to the speed wanted (default 27 m/s).
2. Turn the time dial to the seconds allowed (default 9 s).
3. Press the accelerator pedal (a pedal drawn bottom-left; press and hold).
   The driver holds exactly the throttle needed to hit the target in that
   time. Release the pedal early and the run ends early.
- Run 1: 0 → 27 m/s in 9 s.
- Run 2 (change the time): 0 → 27 m/s in 3 s.
- Run 3 (change the starting speed): the car is already rolling at 20 m/s
  (a rolling-start toggle on the start line), 20 → 27 m/s in 9 s.

**What they see happen.** Run 1: the car pulls away; the needle climbs
smoothly; the orange acceleration arrow appears at 3.0 m/s² and stays that
length the whole run; the blue velocity arrow grows steadily. The v-t line
is a straight ramp reaching 27 at t = 9; the car has covered 121.5 m
(posts count by). Run 2: the car leaps; the acceleration arrow is three
times as long (9.0 m/s²); the line is a steep ramp hitting 27 at t = 3;
the car has covered only 40.5 m. Run 3: the car is already moving fast, but
the acceleration arrow is *short* (0.78 m/s²) — a fast car with a small
acceleration — and the line is a gentle ramp from 20 to 27.

**What accumulates.** Three v-t ramps of gradient 3.0, 9.0 and 0.78. A
gradient triangle can be dragged onto each; its rise/run equals the
acceleration arrow's label. The ledger: *start (m/s)*, *end (m/s)*, *time
(s)*, *Δv (m/s)*, *a = Δv/t (m/s²)*, *a in g*, *distance (m)*.

**The failure state.** Ask for more than the car can give — target 40 m/s in
0.5 s is 80 m/s², eight g — and the tyres spin: smoke from the rear wheels,
the car's acceleration arrow caps at the grip limit (6.9 m/s², rubber on
dry asphalt) and the needle climbs no faster than that. The v-t line bends
away from the demanded ramp and the ledger records "traction limited: asked
80 m/s², got 6.9".

**The prediction.** *Two runs both finish at 27 m/s. Run A takes 9 s, run
B takes 3 s. Which has the larger acceleration?*
1. The same — they reach the same speed.
2. Run A, because it accelerates for longer.
3. Run B: the same change in less time. ✔
4. It depends on how far each car travelled.
Reveal: the orange arrow was three times longer in run B. Acceleration is
how *quickly* the speed changed, not how much.

**The misconception it confronts.** *"A fast-moving object must have a large
acceleration"* and *"Zero acceleration means the object has stopped."* Run 3
puts a fast car under a tiny orange arrow. And at the end of every run the
car is still moving at 27 m/s with *no* orange arrow at all.

**Real numbers.** a = (v − u) / t; Δv = v − u; distance = ((u + v)/2) t;
a in g = a / 9.81. Defaults u = 0, v = 27 m/s, t = 9 s: a = 3.0 m/s²
(0.306 g), 121.5 m. Traction cap for rubber on dry asphalt: a ≤ 0.70 × 9.81
= 6.87 m/s². Model: v ← v + a dt, x ← x + v dt at 120 Hz.

---

### A2.2 — Reading a velocity-time graph

**Subtopic.** A2.2 *Reading a velocity-time graph* (`g8a2-slope-and-area`).

**The question.** A velocity-time graph is one line. How can one line tell
you both how hard the car accelerated *and* how far it went?

**The scene.** The Road kit, but the graph is the hero: the instrument
column widens to 50 % of the stage. Left: the road, 0–300 m, the car with
its speedometer, velocity arrow and acceleration arrow as in A2.1, and a
*distance odometer* on the dashboard (a rolling digit counter, metres).
Right: the *velocity-time* graph, x 0–20 s, y −5…20 m/s (the axis goes
below zero), drawn live. As the line is drawn, the area between it and the
time axis is *shaded* (blue above the axis, red below) and the shaded area
is labelled with its value in metres. A *slope triangle* handle sits on the
line and reads the gradient. In-scene controls: an *initial-speed post* on
the start line (0–20 m/s, rolling start) and an *acceleration dial* on the
dashboard (−5…+5 m/s²).

**What the student does.**
1. Set the initial speed (default 2 m/s) and the acceleration dial
   (default +1.5 m/s²).
2. Press the pedal; the car holds that acceleration for 8 s, then the run
   ends and the odometer freezes.
- Run 1: u = 2, a = +1.5.
- Run 2 (change the acceleration): u = 2, a = 0.
- Run 3 (change the acceleration): u = 2, a = −1.0. The car slows, stops at
  t = 2 s, then *reverses* for the remaining 6 s.

**What they see happen.** Run 1: the line climbs from 2 to 14; the blue
shading grows as a trapezium; at t = 8 its label reads 64 m and the odometer
reads 64 m — the same number, side by side, at the same instant. Run 2: a
horizontal line at 2 m/s. The car is *moving* — the velocity arrow is short
but present, posts go by slowly — and the shaded rectangle grows to 16 m.
Run 3: the line falls through zero at t = 2 s; the car stops for an
instant (arrow gone) and then rolls backwards; below the axis the shading
is red; the odometer counts *distance* (up), while a second readout,
*position*, counts back down toward — and past — the start line. Shading:
+2 m (blue) then −18 m (red); position ends at −16 m, behind the start line.

**What accumulates.** Three lines and their shaded areas. Ledger: *u*, *a =
gradient*, *v at 8 s*, *shaded area (m)*, *odometer distance (m)*, *position
(m)*. The student sees gradient = the dial they set, area = the odometer, and
in run 3 that area below the axis counts backwards.

**The failure state.** a = −5 with u = 2: the car stops in 0.4 s and reverses
hard; by t = 8 it is 150 m behind the start and off the left of the road
stage — the camera cannot follow and the car leaves the frame; the ledger
records "left the road stage at −100 m". A car reversing at 38 m/s is also a
prompt for the write step: what real thing does this line describe?

**The prediction.** *The graph shows a horizontal line at 2 m/s for 8 s.
What is the car doing?*
1. Standing still — the line is flat.
2. Moving at a steady 2 m/s and covering 16 m. ✔
3. Accelerating gently.
4. Slowing down.
Reveal: the car crossed eight posts' worth of road while the line stayed
flat. Flat on a v-t graph means steady speed; the area under it is where
it went.

**The misconception it confronts.** *"A velocity-time graph and a
position-time graph show the same thing"* and *"A horizontal line on a
velocity-time graph means the object is stopped."* Run 2's flat line sits
beside a car that visibly drives. And a companion position readout, when the
student toggles it, draws the *other* graph for the same run — a curve, not
a straight line — underneath.

**Real numbers.** v(t) = u + a t; gradient = a; area = u t + ½ a t²;
average velocity = u + ½ a t. Defaults u = 2, a = 1.5, t = 8: v = 14 m/s,
area 64 m. Run 3 (a = −1.0): stops at t = 2 s, x(8) = 16 − 32 = −16 m;
distance travelled 2 + 18 = 20 m. Shading is computed per tick as v dt and
signed.

---

### A2.3 — Constant vs changing acceleration

**Subtopic.** A2.3 *Constant vs changing acceleration*
(`g8a2-steady-or-fading`).

**The question.** A dropped ball and a car pulling away from the lights both
speed up. Do they speed up the same *way*?

**The scene.** The Road kit with a *drop tower* added at the 0 m post: a
vertical steel frame 45 m tall (at scale it stands beside the road with the
camera pulled back), a metre scale up its side, an electromagnet at the top
holding a 0.5 kg steel ball, a sand pit at its foot. A camera toggle frames
the tower for the fall. The car sits on the start line at traffic lights
(red/amber/green). Both bodies carry a velocity arrow and an acceleration
arrow (orange, 1 m per 1 m/s²). Instrument column: one *velocity-time* graph
for both, x 0–10 s, y 0–35 m/s, with the tower's line in blue and the car's
in orange; a *gradient-triangle* handle on each line.

**What the student does.**
1. Click the electromagnet: the ball drops. Its v-t line draws for 3.0 s
   until it hits the sand.
2. Click the traffic light to green: the driver floors it for 10 s.
- Run 1: the ball (drop).
- Run 2: the car from rest.
- Run 3 (change the start): the car from a rolling start at 15 m/s (rolling
  start toggle), floored for 10 s.

**What they see happen.** The ball: its orange acceleration arrow appears at
9.81 and *never changes length* all the way down; the blue velocity arrow
grows in equal steps each second (9.8, 19.6, 29.4). Its v-t line is dead
straight. The car: it lunges off the line with a 4.0 m/s² arrow, and the
arrow *shrinks* as the needle climbs — by 15 m/s it is half its starting
length; by 25 m/s a stub. The v-t line starts as steep as a 4.0 ramp and
bends over towards 30 m/s. Run 3 starts already on the flat part: the arrow
is a stub from the start and the line barely rises. Sliding the gradient
triangle along the car's line shows the gradient falling; on the ball's line
it reads 9.81 wherever it is placed.

**What accumulates.** One straight line, two curves that bend towards the
same 30 m/s ceiling. Ledger: *body*, *a at t = 0*, *a at t = 2 s*, *a at
t = 5 s*, *shape of line (straight / curved)* (auto-filled from the model:
straight if a varies by < 2 %).

**The failure state.** The ball hits the sand at 29.4 m/s and 3.0 s: a puff
of sand, a crater, and the line stops. Drop it from the 45 m top and the
crater is deep; a tower-height dial (5–45 m) lets the student see the line
cut off earlier at the same slope. The car has no failure: it approaches
30 m/s and never reaches it, which is the point — a "fading" acceleration
reaches a ceiling.

**The prediction.** *Both speed up from rest. After 2 s, which has the
larger acceleration — and after 6 s?*
1. The car both times: cars are powerful.
2. The ball both times: gravity never eases off. ✔
3. The car at 2 s, the ball at 6 s.
4. They are equal at all times.
Reveal: the ball's arrow was 9.81 at every instant. The car's started at
4.0 and had fallen to about 1 by 6 s. The engine has to work harder for each
extra m/s; gravity does not.

**The misconception it confronts.** *"Anything speeding up has a constant
acceleration"* and *"A curved velocity-time graph means the object moved
along a curve."* The car's road is straight; its line is curved. The ball's
path is straight; its line is straight. The bend is in the *rate*, not the
road.

**Real numbers.** Ball: a = 9.81 m/s² constant, v = 9.81 t, falls 45 m in
3.03 s arriving at 29.7 m/s. Car: a(v) = 4.0 × (1 − v / 30) m/s², so the
line is v(t) = 30 (1 − e^(−t/7.5)) — 4.0 m/s² at rest, 2.0 at 15 m/s,
0.67 at 25 m/s. Stepped: v ← v + a(v) dt. Rolling start 15 m/s.

---

### A2.4 — Deceleration

**Subtopic.** A2.4 *Deceleration* (`g8a2-thirty-metres-late`).

**The question.** A ball rolls into the road 40 m ahead of a car doing
20 m/s. The driver brakes as hard as the tyres allow. Does the car stop in
time — and would it at 30 m/s?

**The scene.** The Road kit, three-quarter camera, 0–120 m in frame. A car
approaching from the left at a steady speed with brake lights, a speedometer
callout and a velocity arrow. A *hazard* — a football that has rolled into
the lane — that the student places by dragging it along the road; a distance
post under it reads its distance from where the driver first sees it (the
0 m line). Above the road, a *driver-reaction bar*: a horizontal strip that
fills red for the 0.70 s between "sees it" and "brake pad touches disc",
during which the car keeps its full speed. When the brakes bite, the brake
lights come on, a deceleration arrow appears (orange, pointing backwards,
6.87 m/s²), and the tyres lay dark skid marks on the road. Instrument
column: *velocity vs time* graph (x 0–5 s, y 0–35 m/s) and beneath it a
*distance strip* — a horizontal bar chart of thinking distance (red) and
braking distance (black) laid end to end against the hazard's distance
(a vertical line).

**What the student does.**
1. Drag the football to a distance (default 40 m).
2. Set the approach speed on the speedometer callout (drag the needle;
   default 20 m/s).
3. Press the pedal to set off; when the car crosses the 0 m line the driver
   "sees" the ball and the reaction bar starts; the student has no further
   control — the physics does the rest.
- Run 1: 20 m/s, hazard at 40 m.
- Run 2 (change the speed): 30 m/s, hazard at 40 m.
- Run 3 (change the speed): 10 m/s, hazard at 40 m.

**What they see happen.** Run 1: the car passes the 0 m line; the reaction
bar fills over 0.70 s while the car covers 14 m at full speed; then the
brake lights, the orange arrow, and skid marks; the needle falls in a
straight line; after 2.91 s of braking the car stops with its bumper 3 m
short of the ball. The v-t line: flat at 20 for 0.7 s, then a straight
descent to zero. The distance strip: 14 m red + 29.1 m black = 43.1 m. The
hazard line at 40 m sits *inside* the black bar — meaning the car stopped
past... no: the strip shows 43.1 m against a hazard at 40 m: the car *hits*
the ball. (Run 1 as written hits; the student sees the football knocked
away, and the ledger records "struck at 6.6 m/s".) Run 2: 21 m thinking +
65.5 m braking = 86.5 m; the car hits the ball at 25 m/s. Run 3: 7 m +
7.3 m = 14.3 m; the car stops well short.

**What accumulates.** Three v-t traces, each a flat then a straight descent
with the *same* gradient (−6.87) — only the flat's height changes, and the
descent from a higher flat takes longer. Three distance strips stacked: at
10, 20, 30 m/s the black braking bars are 7.3, 29.1, 65.5 m — the ratio
1 : 4 : 9 is visible as bar lengths. Ledger: *speed*, *thinking distance*,
*braking distance*, *total*, *stopped short by / struck at (m/s)*.

**The failure state.** The car strikes the ball. The ball is knocked away
with a thump, the car's velocity arrow at the moment of impact is frozen as
a red label ("struck at 6.6 m/s"), and the run ends. The student can drag
the hazard back to find the distance that just clears — 44 m at 20 m/s —
and the ledger records that.

**The prediction.** *At 20 m/s the car needs 43 m to stop. At 30 m/s it will
need about…*
1. 65 m — one and a half times.
2. 86 m — the braking part goes up by more than the speed. ✔
3. 130 m — three times.
4. 43 m — the brakes are the same.
Reveal: thinking distance rose 14 → 21 m (with the speed). Braking distance
rose 29 → 65.5 m (with the *square* of the speed).

**The misconception it confronts.** *"Brakes stop a car instantly if you
press hard enough"* and *"Doubling the speed doubles the stopping
distance."* The pedal is fully down from the moment the brakes bite and the
orange arrow is at the tyre's maximum; the car still travels 29 m. Between
run 1 and run 3 the speed doubles and the black bar quadruples.

**Real numbers.** Reaction time 0.70 s; thinking distance = v × 0.70
(14 m at 20 m/s). μ = 0.70 (rubber on dry asphalt), deceleration =
μ g = 6.87 m/s². Braking distance = v² / (2 × 6.87): 7.3 m at 10, 29.1 m at
20, 65.5 m at 30 m/s. Braking time = v / 6.87: 2.91 s at 20 m/s. Totals
14.3, 43.1, 86.5 m. Stepped: during braking v ← max(0, v − 6.87 dt).

---

### A2.5 — Connecting the two graph types

**Subtopic.** A2.5 *Connecting the two graph types*
(`g8a2-two-graphs-one-car`).

**The question.** You drive one journey. Two graphs draw themselves at the
same time. When one of them curves, what is the other one doing?

**The scene.** The Road kit, 0–300 m, three-quarter camera following the
car. The car has *two pedals* drawn bottom-left: accelerator and brake,
each pressable (hold). Speedometer callout, velocity arrow, acceleration
arrow. Instrument column split top/bottom into two graphs sharing one time
axis (x 0–40 s): *position vs time* above (y 0–300 m) and *velocity vs
time* below (y 0–20 m/s). A vertical *time cursor* runs down through both
graphs at the current instant. After a run, hovering either graph moves the
cursor on *both* and replays the car to that instant.

**What the student does.** Drive the journey with the pedals:
1. Hold the accelerator until 15 m/s (the driver's assist holds a steady
   3.0 m/s² while it is pressed).
2. Release; the car cruises at 15 m/s (no drag or friction on this road).
3. Hold the brake (−3.0 m/s²) until stopped.
- Run 1: the journey above, ending near 300 m.
- Run 2 (change the cruise speed): the same pattern but let go at 10 m/s.
- Run 3 (change the braking): cruise at 15 m/s, but use the *gentle* brake
  setting (a switch: −1.5 m/s²).

**What they see happen.** Pulling away: the v-t line is a straight rising
ramp; the x-t line above it *curves upward* (each second the car covers more
posts than the last). Cruising: the v-t line goes flat at 15; the x-t line
becomes a straight slope. Braking: the v-t line falls to zero; the x-t
line bends over and *flattens*. Stopped: both flat — v at 0, x at wherever
it ended (300 m in run 1). The time cursor links the two: at the moment the
v-t line breaks from rising to flat, the x-t line changes from curve to
straight, and the student can drag the cursor to that instant and watch the
car in the scene.

**What accumulates.** Three pairs of graphs. Ledger with one row per *phase*
per run: *phase*, *v-t shape (rising / flat / falling)*, *x-t shape (curving
up / straight / flattening / flat)*, *distance in phase*. After three runs
the pairing (rising ↔ curving up, flat ↔ straight, falling ↔ flattening) is
in the table.

**The failure state.** Hold the accelerator too long and the car reaches
the 300 m end of the stage at speed and runs off the road into a gravel trap:
the x-t line hits the top of its axis and stops; the v-t line drops to zero
in a jagged, non-straight fall (gravel, 8 m/s²), and the ledger records
"ran off the end at 22 m/s".

**The prediction.** *While the car is cruising at a steady 15 m/s, the v-t
line is flat. What is the x-t line doing?*
1. Also flat — the car is not accelerating.
2. Curving upward.
3. A straight line sloping up. ✔
4. Falling.
Reveal: steady speed means position grows the same amount each second: a
straight slope. The flat line is on the *velocity* graph, not the position
graph.

**The misconception it confronts.** *"A flat line means the same thing on
both graphs"* and *"A steep position-time line and a steep velocity-time
line describe the same motion."* With both graphs live and the cursor tying
them to the same instant, the student sees flat-v paired with sloped-x and
steep-x paired with flat-v.

**Real numbers.** a = +3.0 m/s² while accelerating, 0 while cruising,
−3.0 (or −1.5) while braking. Reference journey: 0 → 15 m/s in 5 s
(37.5 m), cruise 15 m/s for 15 s (225 m), brake 15 → 0 in 5 s (37.5 m):
total 300 m in 25 s. Stepped every tick: v ← v + a dt, x ← x + v dt.
Gravel trap beyond 300 m: a = −8 m/s² with ±1 m/s² noise.

---

## Topic A3 — Newton's First Law

### A3.1 — Inertia

**Subtopic.** A3.1 *Inertia* (`g8a3-fifty-newtons-each`).

**The question.** Two balls get exactly the same push. One is a baseball,
one is a shot put. What does "the same push" do to each — and is anything
pushing back?

**The scene.** One long lab bench, side-on camera, with **two identical
launch lanes** side by side front and back, each 5.0 m long with 0.5 m
marks scored into the bench and a red start line. In each lane, a
*pneumatic ram*: a cylinder on a stand with a padded piston face, a force
dial on its body (5–200 N) and a contact-time dial (0.02–0.50 s). Lane A
(front): a baseball, 0.145 kg, on a shallow guide groove. Lane B (back): a
shot put, 7.26 kg, same groove. Both balls sit touching their piston faces.
One *fire button* is wired to both rams through a visible cable — one press,
two identical pushes at the same instant. A light gate stands at the 1.0 m
mark of each lane. During the push, an orange force arrow (2 cm of arrow
per 10 N) is drawn from each piston face onto its ball; both arrows are the
same length because the dials are shared. After the push, each ball carries
only its blue velocity arrow (1 cm per 2 m/s). A high-speed clock (ms) at
the top. Beyond the 5.0 m end of the bench: open floor, 0.9 m down.
Instrument column: *speed after the push vs impulse* graph (two point
series, one per ball) and the ledger.

**What the student does.**
1. Set the force dial (default 50 N) and the time dial (default 0.10 s).
2. Roll each ball back against its piston (a drag; the ball clicks home).
3. Press fire. Watch. Read the two light-gate speeds.
- Run 1: 50 N, 0.10 s.
- Run 2 (change the force): 100 N, 0.10 s.
- Run 3 (change the contact time): 100 N, 0.20 s.

**What they see happen.** The two orange arrows appear together, identical,
for exactly 0.10 s — a slow-motion dilation stretches the push to about a
second of screen time so it can be seen, with the ms clock showing true
time. The baseball streaks away, is through its light gate almost at once
("34.5 m/s" pops above the gate) and is off the end of the bench within a
blink — it flies off the edge and bounces away across the floor. The shot
put barely stirs: it creeps forward, takes 1.4 s to reach its gate
("0.69 m/s"), and rolls to the 5 m mark over several seconds. After the
push, neither ball has any arrow on it but the blue one: nothing is pushing
either of them, and both keep the velocity the push left them with. Runs 2
and 3 double the impulse and both speeds double — but the *ratio* of the
two speeds never moves.

**What accumulates.** Two point-series on the speed-vs-impulse graph: the
baseball's points lie on a steep line, the shot's on a line 50 times
shallower. Ledger: *impulse (N·s)*, *baseball speed*, *shot speed*, *ratio*
— the ratio column reads 50.1 in every row, and a footer note ties it to
7.26 / 0.145.

**The failure state.** At maximum impulse (200 N × 0.50 s = 100 N·s) even
the shot put reaches 13.8 m/s: it thunders off the end of the bench,
drops, and cracks a floor tile with a dust flash — the ledger records
"left the bench at 13.8 m/s". The baseball at that setting (690 m/s) is
refused by the rig: a red interlock trips at 60 m/s equivalent
("ram cannot follow the ball"), teaching that a push can only act while
the piston is still touching.

**The prediction.** *Both balls get 50 N for 0.10 s. The baseball leaves at
34.5 m/s. The shot put will leave at about…*
1. 34.5 m/s — same push, same speed.
2. 17 m/s — half, because it is heavier.
3. 0.69 m/s — fifty times less, because it has fifty times the mass. ✔
4. 0 m/s — a shot put cannot be moved by 50 N.
Reveal: the same impulse divided by fifty times the mass is a fiftieth of
the speed. The mass ratio 7.26 / 0.145 = 50.1 is the speed ratio, exactly.

**The misconception it confronts.** *"Heavy objects have more inertia only
while they are moving"* — both balls are at rest when the push lands, and
the resistance to *starting* is where the 50× shows up. *"Inertia is a force
that pushes back on you"* — during the push the only arrow on each ball is
the ram's orange one; after it, no arrow at all, yet the ball keeps going.
Inertia is never drawn as an arrow because it is not a force.

**Real numbers.** Impulse = F·t; v = F·t / m. Baseball m = 0.145 kg
(regulation), shot m = 7.26 kg (regulation): 50 N × 0.10 s = 5.0 N·s →
34.5 m/s and 0.689 m/s; ratio 50.1 at every setting. F ∈ [5, 200] N,
t ∈ [0.02, 0.5] s. During the push a = F/m stepped per tick; after it,
v constant (groove friction negligible, stated on the rig).

---

### A3.2 — Balanced vs unbalanced forces

**Subtopic.** A3.2 *Balanced vs unbalanced forces* (`g8a3-do-they-cancel`).

**The question.** Two teams pull on the same cart in opposite directions.
If the pulls are equal, does the cart have to be standing still?

**The scene.** The **Track kit**, with a pulley clamped to *each* end of the
2.0 m track. A 1.0 kg cart sits mid-track with a cord from each end plate
running over its pulley to a hanger hanging off the bench edge. Each hanger
takes 100 g slotted masses from a tray drawn beside the track (each slot
mass is a real object the student picks up and drops on). Force arrows: the
left cord's pull in teal from the cart's left plate, the right cord's pull
in orange from the right plate (2 cm per 0.5 N), and above the cart the
dashed *net* arrow — drawn only as long as the difference. Blue velocity
arrow on the cart. Light gates at 0.5 m and 1.5 m. Instrument column:
*velocity vs time* graph (x 0–8 s, y −1…1 m/s) and the ledger.

**What the student does.**
1. Load hangers: run 1 loads 3 masses each side (2.94 N each way).
2. Press release. Watch 4 s. Then, mid-scene, *flick* the cart: drag it
   sideways and let go (the drag speed becomes its launch speed, capped
   at 0.6 m/s).
- Run 1: 3 v 3, cart at rest, then flicked.
- Run 2 (change one side): 4 v 3, cart starting at rest.
- Run 3 (change the start): 4 v 3, but flick the cart *towards* the lighter
  side first.

**What they see happen.** Run 1: with equal loads the two arrows are the
same length, the net arrow is absent, and the cart does not move — v-t flat
at 0. Then the flick: while the cart glides, both cord arrows stay equal
(the cords stay taut over their pulleys), the net arrow is still absent —
and the cart *keeps gliding at the same speed*, the v-t line flat at
0.4 m/s until the end-stop. Balanced does not mean still; it means
*unchanging*. Run 2: one extra mass and a short net arrow appears (0.981 N);
the cart accelerates from rest towards the heavier side; the v-t line is a
straight ramp. Run 3: flicked one way with the net arrow pointing the other,
the cart slows, stops for an instant, and comes back — the v-t line crosses
zero, while the net arrow never changes direction.

**What accumulates.** Three v-t traces: a flat step then a flat glide; a
ramp from zero; a ramp that crosses the axis. Ledger: *left (N)*, *right
(N)*, *net (N)*, *what the velocity did* (auto: "held at 0", "held at
0.4", "changed steadily"). The rule — net zero ↔ velocity holds — emerges
across rows.

**The failure state.** Any unbalanced run eventually drives the cart to an
end: the winning hanger reaches the floor, its cord goes slack, its arrow
vanishes mid-run — and the cart, now under one cord only… no: with the
pulling cord slack the *other* side's still-hanging load takes over, and
the cart decelerates and reverses. The moment of the arrow vanishing is
marked on the v-t trace with a kink flag ("left hanger landed"). Students
watch the force diagram rewrite itself and the motion answer it.

**The prediction.** *Equal loads on both sides. You flick the cart to the
right and let go. What does it do?*
1. Stops quickly — the forces cancel it out.
2. Keeps rolling at the speed you gave it. ✔
3. Speeds up towards the right pulley.
4. Returns to the middle, where it balances.
Reveal: cancelling forces add to zero, and zero force changes nothing —
including a velocity of 0.4 m/s. Only an *unbalanced* force can slow it.

**The misconception it confronts.** *"Something moving must have an
unbalanced force on it"* — run 1's glide happens under a visibly zero net
arrow. *"A moving object at the top of its flight has no force acting"* is
met by run 3's cousin: at the instant the cart reverses, its velocity arrow
vanishes while the net arrow is still there, full length, pointing the way
it is about to go.

**Real numbers.** Each 100 g slot = 0.981 N of cord tension. Net =
(n_L − n_R) × 0.981 N. Moving mass = 1.0 kg cart + 0.1 kg × (n_L + n_R);
run 2: net 0.981 N on 1.7 kg → a = 0.577 m/s². Flick speed cap 0.6 m/s.
Track rolling resistance 0.02 N (declared on the rig; visibly negligible
over 2 m). Stepped: a = net/m each tick; cord tension recomputed when a
hanger lands.

---

### A3.3 — Free-body diagrams

**Subtopic.** A3.3 *Free-body diagrams* (`g8a3-every-arrow`).

**The question.** Draw every force on the cart — and only the forces. Does
your diagram predict what the cart actually does?

**The scene.** The **Track kit**. A 5.0 kg loaded cart (the load bay
visibly stacked) at the 0.2 m mark; a cord from its front plate over the
right-hand pulley to a 2.04 kg hanger (the cord tension will be 20.0 N).
Light gates at 0.5 m and 1.5 m. The cart is drawn large; next to the track
floats the *arrow palette*: five draggable arrows, each a labelled tile —
**Weight**, **Normal force**, **Pull of the cord**, **Friction**, and a
trap: **Force of motion**. Dragging a tile to the cart pins an arrow at the
correct application point (weight from the centre downward, normal up from
the wheels, pull from the front plate, friction backward at the wheels);
the student then *sizes* it by dragging its tip along a newton scale that
appears (2 cm per 10 N). A *prediction chip* above the cart continuously
computes the acceleration implied by the student's current diagram
("your arrows say a = … m/s²"). A TEST button on the electromagnet release.
Instrument column: the measured *velocity vs time* graph and a ledger of
diagram-vs-measured.

**What the student does.**
1. Build the diagram: drag on the arrows they believe in, size each.
2. Press TEST. The cart runs; the gates measure the real acceleration; the
   chip's prediction is laid over the measured value.
- Run 1: the setup above (correct diagram: 49.1 down, 49.1 up, 20.0
  forward, 0.98 back → net 19.0 N, a = 3.80).
- Run 2 (change what pulls): unhook the cord (drag it off the plate). Now a
  correct diagram is two arrows, and the cart must sit still.
- Run 3 (change the load on the surface): a hand icon presses down on the
  cart with 20 N (drag the hand onto the cart roof). Weight stays 49.1;
  what changes?

**What they see happen.** Run 1: with a correct diagram the chip says 3.80,
the gates measure 3.80, the two numbers fuse into one green tick, and the
dashed net arrow the model draws matches the gap the student left between
pull and friction. If the student added **Force of motion**, the chip
over-predicts; on TEST the measured line falls below the predicted one, the
bogus arrow glows red, cracks, and crumbles off the cart — there is no
pusher to supply it. Run 2: cord off; a correct diagram is weight and
normal only; TEST confirms a = 0, and the two arrows sit head-to-head.
Run 3: with the hand pressing 20 N, the normal arrow must be dragged out to
69.1 N to keep the cart from sinking (the model shows the wheels
compressing until the diagram balances vertically), friction grows to
1.38 N (it follows the normal, not the weight), and the measured a drops
to 3.72.

**What accumulates.** Ledger, one row per test: *arrows used*, *diagram's
predicted a*, *measured a*, *verdict*. Three rows tell the story: right
diagram → match; bogus arrow → over-prediction; pressed cart → normal
69.1 ≠ weight 49.1 and still a match.

**The failure state.** The crumbling motion-force arrow is the designed
failure. A second: size the friction arrow above the pull (drag it past
20 N) and the chip predicts the cart accelerating *backwards*; TEST shows
it plainly does not, and the oversized arrow is trimmed back by the model
with a "the bench can only resist, never drive" note.

**The prediction.** *The cart is rolling forward at a steady speed after
the hanger has landed. Which arrows belong on it?*
1. Weight, normal, and a forward force of motion.
2. Weight and normal only, plus a small backward friction. ✔
3. A forward force bigger than friction.
4. No arrows — nothing is touching it horizontally.
Reveal: motion is not a force. Only the Earth, the bench and the axles are
acting; the small friction arrow is why the glide very slowly dies.

**The misconception it confronts.** *"A moving object carries a forward
force with it"* — the palette invites the error and the measurement
executes it. *"The normal force is always equal to the weight"* — run 3
splits them by 20 N on screen, with both arrows labelled.

**Real numbers.** Weight = 5.0 × 9.81 = 49.1 N; normal = 49.1 N (run 3:
69.1 N); pull = 20.0 N; rolling friction = 0.020 × normal = 0.98 N (run 3:
1.38 N); net = 19.0 N; a = net / 5.0 = 3.80 m/s² (run 3: 3.72). Cart from
rest covers ½ × 3.80 × t²: 1.9 m in 1.0 s, matching the gate timing.

---

### A3.4 — Friction as the reason intuition misleads

**Subtopic.** A3.4 *Friction as the reason intuition misleads*
(`g8a3-take-friction-away`).

**The question.** Everything you have ever slid comes to a stop. Is that
because moving things naturally stop — or because something stops them?

**The scene.** A 4.0 m bench, side camera, with a *swappable surface bed*:
the top of the bench is a channel into which the student slides one of
three full-length strips from a rack at the left — **rubber-on-asphalt**
(dark, gritty texture, μ = 0.70), **wood** (grain, μ = 0.30), **polished
ice** (pale, specular, μ = 0.02). A spring launcher at the 0 m end fires a
5.0 kg block at exactly 4.0 m/s (its dial is fixed and says so). Metre
marks 0–4 m; beyond the 4 m end, the bench ends and the floor is 0.9 m
below, with a crash mat conspicuously *not* covering the landing zone. On
the block: blue velocity arrow, and a red friction arrow pointing backward
whose length is live (2 cm per 5 N). A skid trail darkens the strip behind
the block. Thermal view toggle: the skid trail glows on rubber, faintly on
wood, not at all on ice. Instrument column: *stopping distance vs μ* graph
(one point per run) and the v-t graph of the current run.

**What the student does.**
1. Slide a strip into the bed (a drag; it clunks home).
2. Cock the launcher (pull its handle back to the latch) and fire.
3. Read where the block stopped against the metre marks; the run drops a
   point on the distance-vs-μ graph.
- Run 1: wood.
- Run 2 (change the surface): rubber.
- Run 3 (change the surface): ice.
- Run 4 (change the mass, surface back to wood): stack a second 5 kg block
  on top and fire again.

**What they see happen.** Wood: the red arrow sits at 14.7 N; the block
decelerates visibly and stops at 2.72 m; the v-t line is a straight descent
lasting 1.36 s. Rubber: a long red arrow (34.3 N), a hard stop at 1.17 m,
a strong thermal streak. Ice: the red arrow is a sliver (0.98 N); the block
crosses the whole bench barely slowing (3.92 m/s at the end), sails off
the edge, tips forward and falls to the floor with a bang; the v-t line is
almost flat to the edge, then the model hands it to gravity. Run 4: double
the mass — the friction arrow doubles (29.4 N) but the block stops at the
*same* 2.72 m mark, on top of run 1's skid.

**What accumulates.** The distance-vs-μ graph gains points at (0.70,
1.17), (0.30, 2.72), (0.02, "> 4 m, left the bench" plotted as an
open-topped marker at the axis top with 40.8 m labelled), and run 4's point
lands exactly on run 1's. A dashed curve v²/(2μg) is fitted through the
student's own points after three runs. Ledger: *surface*, *μ*, *friction
(N)*, *deceleration*, *stopping distance*, *mass*.

**The failure state.** The ice run *is* the failure state and the lesson:
nothing was ever going to stop the block in 4 m, because stopping is what
friction does, not what motion does. The block's fall is honest — off the
end, tip, drop, bounce — and the ledger records "needed 40.8 m; had 4".

**The prediction.** *Same launcher, same block, ice strip. Where does the
block stop?*
1. Around 3 m — ice is slippery but everything stops.
2. It will not stop on this bench. ✔
3. At the same 2.72 m as wood — the block is the same.
4. Sooner than wood — ice is cold.
Reveal: μ = 0.02 needs v²/(2μg) = 40.8 m. The bench holds 4. The block was
always leaving.

**The misconception it confronts.** *"A moving object needs a constant push
or it will slow down on its own"* — the launcher touches the block for a
tenth of a second and the only horizontal arrow ever after is friction's;
shrink that arrow and the "natural" stopping recedes to 40.8 m and beyond.
*"Heavier objects always slide further because they have more momentum"* —
run 4 doubles the mass and lands on the same mark, because deceleration
μg has no mass in it.

**Real numbers.** Friction = μ m g (wood 14.7 N at 5 kg); deceleration
= μ g regardless of mass: 6.87, 2.94, 0.196 m/s². Stopping distance
= v²/(2μg) at 4.0 m/s: rubber 1.17 m, wood 2.72 m, ice 40.8 m. Stopping
time = v/(μg): 0.58, 1.36, 20.4 s. Speed at the 4 m edge on ice:
√(16 − 2×0.196×4) = 3.92 m/s. Stepped: v ← v − μg dt while on the strip;
projectile once past the edge.

---

### A3.5 — Applying the First Law to everyday scenarios

**Subtopic.** A3.5 *Applying the First Law to everyday scenarios*
(`g8a3-the-bus-stops`).

**The question.** The bus brakes hard and you lurch towards the front.
What pushed you?

**The scene.** The **Bus kit**, the founder's own failed case rebuilt. A
single-deck bus drawn in cutaway side view filling the stage: driver's cab
with a brake pedal, six rows of seats, an aisle, an overhead handrail
running the length, a padded partition behind the cab. Mid-aisle stands a
65 kg passenger holding a phone, feet on the marked floor. Above the bus, a
street: lampposts, a zebra crossing 60 m ahead, parked cars — all of which
slide past the windows so the bus's motion is visible *twice*, in the world
going by and in a roadside distance track under the wheels. Instruments:
the bus's speedometer (cab), a *blue velocity arrow on the bus's roof* and
a *separate blue velocity arrow on the passenger's chest*, each labelled
with its own number; when braking, an orange deceleration arrow on the bus
and — only if something is touching the passenger — an orange force arrow
at the touch point (hand on rail, or chest on partition), with a newton
label. A *grip meter* beside the passenger's hand (0–500 N, with a red
"grip fails" zone above 400 N). Camera toggle, the hero control: **street
camera** (bus moves through a fixed world) / **bus camera** (bus fixed,
world slides). Instrument column: two v-t lines on one graph — bus and
passenger — plus the ledger.

**What the student does.**
1. Choose the passenger's state by dragging their hand: onto the rail, or
   hanging free at their side.
2. Press the bus's pedal (bottom-left) with a chosen braking strength
   (a two-stop pedal: normal 4.8 m/s², emergency 8.0 m/s²). A dog trots
   toward the crossing to give the driver a reason.
3. Watch in the street camera; then replay the same run in the bus camera.
- Run 1: holding the rail, normal braking.
- Run 2 (change the grip): hand free, normal braking.
- Run 3 (change the braking): holding the rail, emergency stop.

**What they see happen.** Run 1: both arrows read 12 m/s. The pedal goes
down; the bus's arrow starts shrinking (orange arrow on the bus only); for
a beat the passenger's arrow *does not shrink* — then the rail tugs, an
orange 312 N arrow appears at the hand, and the passenger's arrow shrinks
in step. On the graph, the bus's line and the passenger's line fall
together. Run 2: hand free. The bus's line falls; the passenger's line
*stays flat at 12 m/s* — in the street camera the passenger glides in a
dead-straight, constant-speed line while the bus slows around them; in the
bus camera the same event looks like the passenger accelerating towards
the front with nothing touching them. They cover the 3 m of aisle in
1.12 s and meet the partition at 5.4 m/s relative; the pad compresses, an
orange arrow blooms at the chest, and only then does the passenger's v-t
line fall. Run 3: the rail must supply 520 N; the grip meter climbs into
the red at 400 N, the hand tears off the rail mid-brake, and the run turns
into run 2 from that instant — the kink is marked on the graph.

**What accumulates.** Three pairs of v-t lines. Ledger: *grip*, *braking
(m/s²)*, *force the passenger needed (65 × a)*, *what supplied it (rail /
partition / nothing until…)*, *gap between the two lines*. The rule — no
touch, no change — is the column that never has an exception.

**The failure state.** Two, both real: the free passenger striking the
partition at 5.4 m/s, and the grip failing at 400 N in the emergency stop.
Both are moments where the *absence* of a force is the visible event.

**The prediction.** *The driver brakes. Nothing is touching the standing
passenger. What happens to them?*
1. They are thrown towards the front by the braking force.
2. They keep moving at 12 m/s while the bus slows around them. ✔
3. They slow with the bus — they are inside it.
4. They fall straight down.
Reveal: watch the street camera. The passenger's path is a straight,
steady 12 m/s the whole time; it is the bus that changed. "Thrown forward"
is what an unchanged motion looks like from a braking seat.

**The misconception it confronts.** *"A force throws you forward when a
vehicle brakes"* and *"You stop when the vehicle stops because you are
inside it."* The two-camera replay is the confrontation: the same run
looks like a mysterious forward push in the bus frame and like nothing
happening to the passenger in the street frame — and the force arrows,
which only ever appear at a touch, agree with the street.

**Real numbers.** Bus and passenger at 12 m/s. Normal braking 4.8 m/s²:
stop in 2.5 s over 15 m. Rail force = 65 × 4.8 = 312 N; emergency
= 65 × 8.0 = 520 N against a 400 N grip limit. Free passenger: relative
acceleration 4.8 m/s², 3.0 m of aisle → t = √(2×3/4.8) = 1.12 s, relative
speed 4.8 × 1.12 = 5.4 m/s at the partition. Stepped per tick for both
bodies separately; the passenger's a is 0 until a contact force exists.

---

## Topic A4 — Forces, mass and change in motion

One investigation runs through all five briefs: the classic trolley-and-
hanger experiment on the **Track kit**. The engineer builds the rig once —
2.0 m track with adjustable feet and a bubble level, 1.0 kg cart with a
load bay carrying five 100 g slotted masses, cord over an end pulley to a
hanger, electromagnet release at the start line, light gates at 0.5 m and
1.5 m — and the five briefs change what the student is allowed to touch
and what the instrument column shows. Masses are physical: the student
picks a 100 g slot out of the cart's bay and drops it onto the hanger, or
takes one from the separate *spares box* (the trap A4.1 is about).

### A4.1 — Planning a fair test of force and motion

**Subtopic.** A4.1 *Planning a fair test of force and motion*
(`g8a4-three-kinds-of-variable`).

**The question.** You want to know how the pull changes the acceleration.
Two ways of adding pull look almost identical — why does only one of them
give an answer?

**The scene.** The A4 rig, three-quarter camera close enough that the
cart's load bay and the hanger are both readable. In the load bay: five
100 g masses, each engraved "100 g". On the bench beside the track: the
*spares box*, an open crate of identical 100 g masses. Above the rig, a
*system scale* — a long balance beam that continuously weighs everything
that moves (cart + bay + hanger + hanger load) and shows the total:
"moving mass: 1.00 kg". The hanger hangs off the bench edge on its cord.
Light gates, electromagnet release. Instrument column: *acceleration vs
pull* graph (x 0–5 N, y 0–5 m/s²) and the ledger. A faint diagonal
reference line through the origin is NOT drawn — the student's data must
make it.

**What the student does.**
- Series 1 (the plausible wrong way): take masses from the *spares box*,
  one per run, onto the hanger. Release, read the gate acceleration,
  repeat for 1–5 spares.
- Series 2 (the fair way): put the spares back; now *move* one mass per
  run from the cart's bay across to the hanger. Release, read, repeat
  for 1–5 moved.
- Series 3 (spoil a controlled variable on purpose): with the fair
  loading at 3 moved masses, swap the electromagnet release for a hand
  release (drag the hand icon in) and run five repeats.

**What they see happen.** Series 1: with each spare added the hanger pull
grows — but the system scale ticks up too: 1.10, 1.20, … 1.50 kg. The
points on the graph rise but *bend over*, sagging below any straight
line. Series 2: each move leaves the scale frozen at exactly 1.00 kg —
the mass changed places, not amount — and the five points land on a dead
straight line through the origin. Both series stay plotted in their own
colours, the bent one and the straight one, from the same rig. Series 3:
five releases by hand scatter their five points vertically around one
pull value (the hand adds a random ±0.15 m/s of launch speed, visible as
the cart twitching on release); re-run with the electromagnet and the
five repeats stack into one dot.

**What accumulates.** The graph ends the session holding the whole
argument: a curved series, a straight series, and a scattered cluster
beside a tight one. Ledger columns: *where the mass came from*, *pull
(N)*, *moving mass (kg)*, *a (m/s²)*. A final prompt asks the student to
label each rig part with one of three tags — *I change it* / *it answers*
/ *I keep it the same* — and the tags snap onto the hanger load, the
gates' readout, and the scale/release/level respectively.

**The failure state.** The bent line *is* the failure: the same gesture
("add pull") producing data no straight line fits, because two variables
moved at once. The scattered hand-release cluster is the second failure.
Neither is an error message; both are data the student made.

**The prediction.** *You add pull by taking masses from the spares box.
What will the graph look like?*
1. A straight line through the origin — more pull, more acceleration.
2. A line that bends below straight, because the load is getting heavier
   too. ✔
3. A flat line — the extra mass cancels the extra pull.
4. The same as moving masses across; where they come from cannot matter.
Reveal: the system scale read 1.50 kg by the last run. You changed the
pull *and* the mass, and the graph shows both at once, which is why it
shows neither cleanly.

**The misconception it confronts.** *"A fair test just means being
careful"* — series 1 is performed perfectly carefully and still fails,
because fairness is about what is *held fixed*, not about neatness.
*"Anything you write down during the experiment is a dependent variable"*
— the tagging step forces the scale reading (written down every run,
always 1.00) into *kept the same*, not *it answers*.

**Real numbers.** Each 100 g on the hanger = 0.981 N of pull. Fair
series: moving mass 1.00 kg, a = 0.981 n m/s² for n = 1…5 (0.98 to
4.91). Unfair series: moving mass 1.0 + 0.1 n kg, a = 0.981 n /
(1 + 0.1 n): 0.89, 1.64, 2.26, 2.80, 3.27 m/s² — each point 9–33 % below
the fair line. Hand release adds ±0.15 m/s initial speed; gate-pair
acceleration is computed from the two crossing speeds, so the scatter is
±0.3 m/s² at low pulls. A 1° track slope would add g sin 1° =
0.17 m/s² (quoted on the bubble level's tooltip).

---

### A4.2 — The qualitative force-mass-acceleration relationship

**Subtopic.** A4.2 *The force-mass-acceleration relationship*
(`g8a4-force-over-mass`).

**The question.** Double the pull — what happens to the acceleration?
Double the mass instead — what happens then?

**The scene.** The A4 rig with two changes. The pull is now set by a
*calibrated tow*: the cord runs to a winch with a tension dial
(0–20 N in 0.5 N steps) that maintains exactly the set tension —
drawn as a taut cord whose teal force arrow at the cart's plate always
matches the dial. The cart's load bay accepts *1 kg slabs* from a rack
(0.2–10 kg total; the cart visibly rides lower and its wheels squash as
slabs go on). Light gates; electromagnet release; a 2.0 s run timer that
ends every run (the winch brakes the cart gently after it). Instrument
column: TWO graphs stacked — *a vs F* (x 0–20 N) and *a vs m*
(x 0–10 kg) — each collecting points only from runs where the *other*
quantity was at its default; plus the ledger.

**What the student does.**
1. Set tension 6 N, mass 2 kg. Release. The gates report a.
- Runs 1–3 (change only the force): 6 N, 12 N, 3 N at 2 kg.
- Runs 4–6 (change only the mass): 2 kg, 4 kg, 8 kg at 6 N.
- Run 7 (the zero run): tension 0 N. Release. Nothing happens, on
  purpose: the cart sits at the start line for the whole 2 s.

**What they see happen.** Force runs: at 6 N the cart covers 6.0 m-worth
of track in its 2 s (scaled onto the 2 m track with the camera
tracking); at 12 N it is visibly twice as eager off the line and the
orange acceleration arrow is twice as long; at 3 N, half. The *a vs F*
graph builds a straight line through the origin. Mass runs: same 6 N
teal arrow every time, but each added slab makes the launch lazier; the
*a vs m* graph builds a falling curve — halve-the-a-when-you-double-the-m
— that is visibly not a straight line. Run 7 leaves a point at the
origin and a cart that never moved: zero net force is not slow motion,
it is no *change* of motion.

**What accumulates.** A straight line on one graph and an inverse curve
on the other, from the student's seven runs. Ledger: *F (N)*, *m (kg)*,
*a measured*, *F/m computed* — the last two columns agree to the digit,
run after run, which is the law read as a table.

**The failure state.** Set 20 N on 0.2 kg: a = 100 m/s². The cart
crosses both gates in 0.2 s, hits the end-stop at 14 m/s (the run timer
never gets its 2 s), and the bumper cannot hold it: the cart somersaults
off the end of the track onto the bench, wheels up. The ledger records
"run ended at the stop, 0.28 s". The physics is right; the rig has
limits, and finding them is allowed.

**The prediction.** *At 6 N the acceleration is 3.0 m/s². You double the
mass and keep 6 N. The acceleration will be…*
1. 6.0 m/s² — more stuff, more effect.
2. 3.0 m/s² — the force is the same.
3. 1.5 m/s² — twice the mass shares the same pull. ✔
4. 0 — the cart is too heavy now.
Reveal: the gates read 1.50. The same pull spread over twice the mass
changes each kilogram's motion half as much: a = F / m.

**The misconception it confronts.** *"A bigger force means a bigger
speed rather than a bigger change of speed"* — every run starts from
rest and the readout is the *slope* of the speed, and run 7's zero-force
cart has zero *change*, at a speed of zero it merely keeps. *"Doubling
the mass halves the force needed"* — the mass runs hold the force fixed
on a dial in plain sight while the acceleration alone answers.

**Real numbers.** a = F / m: defaults 6 N / 2 kg = 3.0 m/s²; 12 N →
6.0; 3 N → 1.5; 4 kg → 1.5; 8 kg → 0.75. Speed after 2 s = 2a;
distance in 2 s = 2a (numerically, ½a·4). Weight readout m·9.81 N shown
on the cart when slabs are added. F ∈ [0, 20] N, m ∈ [0.2, 10] kg.
Stepped: v ← v + (F/m) dt; winch tension constant along the run.

---

### A4.3 — Running the investigation

**Subtopic.** A4.3 *Running the investigation* (`g8a4-five-runs`).

**The question.** Five settings, three releases each, one straight line —
can you run the whole experiment cleanly enough that the line is yours?

**The scene.** The A4 rig in full protocol dress. The track's two feet
have *thumbscrews* the student can turn (drag up/down); a *bubble level*
sits on the track mid-span, its bubble drifting off-centre whenever the
track slopes (0.2° of slope moves the bubble one graduation). The cart
carries its five 100 g masses; the electromagnet release has an armed
light; the hanger hangs at the pulley. A *protocol strip* across the top
of the scene shows six steps as unlit lamps: LEVEL → LOAD → RELEASE ×3 →
MOVE ONE ACROSS → … Instrument column: the *a vs F* graph with room for
5 clusters of 3, a *mean* toggle that collapses each cluster to its
mean point, and the ledger with one row per release.

**What the student does.**
1. Level: turn the thumbscrews until the bubble centres; then the check
   — set the cart mid-track and let go. If it creeps either way, the
   LEVEL lamp stays dark.
2. Load: confirm five masses in the bay (scale reads 1.00 kg).
3. Release three times at 1 mass on the hanger, recording each.
4. Move one mass across; repeat. Continue to 5 on the hanger.
- The three "runs" of this brief are the first three *settings*; the lab
  step then asks for the remaining two, so the full five-point line is
  the student's own.

**What they see happen.** Levelling is a real act: the bubble chases the
thumbscrews, overshoots, settles; the free-standing cart betrays a 0.2°
error by creeping 2 cm in the 3 s check. Each release: arm, cart still,
magnet click, run, two gate speeds, a point on the graph. The three
points per setting land close but not identical (gate timing granularity
±0.02 m/s²); the MEAN toggle draws the cluster's mean as a ringed dot.
As settings accumulate, the ringed dots line up; after five, a fit line
is offered and it passes through the origin with gradient 0.99.

**What accumulates.** Fifteen raw points in five clusters, five mean
dots, one fitted line, and a ledger whose *spread* column (max−min per
setting) stays under 0.04 m/s². The graph is the deliverable A4.5 will
reuse: it is saved to the notebook as "my five-run line".

**The failure state.** Skip levelling (the protocol strip lets you — it
marks the lamp red rather than blocking) and every cluster lands offset
by the same +0.17 m/s² (a 1° slope helping the cart); the fitted line
misses the origin and its intercept is flagged: "your line says the cart
accelerates with no pull at all — believe it, or check the level."
Hand-release (dragging the cart off the magnet manually) doubles the
spread and the ledger's spread cell turns amber.

**The prediction.** *You release three times without changing anything.
The three accelerations will be…*
1. Identical — nothing changed.
2. Close but not identical, and the mean is the number to keep. ✔
3. Wildly different — experiments are unpredictable.
4. Rising each time as the rig warms up.
Reveal: 0.97, 0.99, 0.98 m/s². The rig has grain — gate timing, cord
flex — and repeats measure how much. The mean rides above the grain.

**The misconception it confronts.** *"One reading per setting is enough
if you measure carefully"* — the cluster spread exists at every setting
however carefully the student releases, and the amber hand-release
spread shows care alone shrinking nothing. *"Adding masses to the
hanger keeps everything else the same"* — the MOVE lamp only lights for
a bay-to-hanger move; feeding from the spares box (still on the bench)
leaves it dark and the system scale ticking upward, as learned in A4.1.

**Real numbers.** Setting n: pull 0.981 n N on 1.00 kg → true a =
0.981 n m/s² (0.98, 1.96, 2.94, 3.92, 4.91). Measurement noise ±0.02
m/s² (uniform, seeded). Slope error: +g sin θ; at 1° = +0.171 m/s² on
every point. Run length 1.4 s; distances ½at²: 0.96 m (n = 1) to 4.81 m
(n = 5, camera-tracked). Fit: least squares through the student's mean
dots; expected gradient 1/1.00 kg = 0.99–1.01 kg⁻¹, intercept < 0.05
m/s² when level.

---

### A4.4 — Comparing prediction to measured data

**Subtopic.** A4.4 *Comparing prediction to measured data*
(`g8a4-why-it-came-up-short`).

**The question.** The law says a = F/m. Your cart keeps coming up short
of it — is the law wrong, is the rig broken, or is something real being
left out?

**The scene.** The A4 rig with a *spring balance spliced into the cord*
(a drawn dial balance, 0–6 N, its needle live) so the pull is measured,
not assumed, and the cart's own rolling resistance made the subject.
Instrument column: the *a vs F* graph now opens with a tool — a
*prediction ruler* the student drags to lay their predicted line
(a = F/m for the 1.00 kg cart: they pin it through the origin at slope
1.0) before any run; the line locks in grey. Below the graph, a second
live plot: *shortfall (%) vs F*. A small tub of fine sand and a brush
sit by the track (the "grit" prop for the failure state). The track feet
keep their thumbscrews.

**What the student does.**
1. Lay the prediction line.
2. Run the five settings once each (the protocol is warmed up from
   A4.3); each measured point lands against the grey line.
- Run set 1: the five settings, level track.
- Run set 2 (change one thing): brush grit onto the axles (drag the
  brush across the cart) and rerun two settings.
- Run set 3 (the remedy): clean the axles, then *friction-compensate* —
  raise the start-end thumbscrew until a nudged cart glides at constant
  speed (the bubble sits one graduation off; a "glide check" like the
  level check but passing when the nudge neither dies nor grows). Rerun
  the five settings.

**What they see happen.** Set 1: every measured point sits *below* the
grey line — and not by a constant amount, but by a constant *force*: the
gap in a is 0.49 m/s² at every setting, which is 50 % of the smallest
pull and 10 % of the largest. The shortfall plot draws that falling
curve — the signature of a systematic effect, nothing like the
symmetric scatter of A4.3's repeats. Set 2: with gritted axles the gap
doubles; the shortfall curve lifts as a whole. Set 3: with the track
tilted just enough that gravity pays the friction bill, the measured
points land on the grey prediction line — the student has not removed
friction, they have cancelled it, and the one-graduation bubble says so.

**What accumulates.** The grey predicted line; three families of
measured points (level, gritted, compensated); the shortfall curves for
each. Ledger: *F from the balance (N)*, *predicted a*, *measured a*,
*gap as force (N)* — the gap-as-force column reads 0.49, 0.49, 0.49…
then 0.98 gritted, then 0.00 compensated.

**The failure state.** Set the pull below the friction: hang a single
50 g trim mass (0.49 N) with gritted axles (0.98 N of friction). The
balance needle stands at 0.49 N — a force, plainly measured, plainly
present — and the cart does not move at all; the measured point lands
at zero. A pull can be real and still not be enough; the graph records
a point *on the axis* that no straight line through the origin will
ever visit.

**The prediction.** *Your measured points all fall below the predicted
line. Running each setting ten more times will…*
1. Bring the points up to the line — errors average out.
2. Not move the means: the gap is a real force, not noise. ✔
3. Show the law is wrong.
4. Widen the gap.
Reveal: repeats shrink scatter, and this gap is not scatter — it is
0.49 N of rolling resistance, the same every run, in one direction.
Averaging a systematic effect just measures it more precisely.

**The misconception it confronts.** *"A measurement that misses the
prediction means the theory is wrong"* — the theory, with friction
*included*, threads every point, and the compensated set shows the bare
law recovered on demand. *"Repeating the run more times would remove
the difference"* — the prediction question is settled by the tight,
still-low clusters.

**Real numbers.** Predicted a = F/m. Friction = μ m g with μ = 0.05,
m = 1.00 kg → 0.49 N; measured a = (F − 0.49)/1.00, floored at 0.
Shortfall % = μmg/F × 100: 50 % at 0.98 N, 25 % at 1.96 N, 10 % at
4.91 N. Gritted μ = 0.10 → 0.98 N. Compensation tilt: sin θ = μ →
θ = 2.9°, giving g sin θ = 0.49 m/s² along the track. Spec ranges:
F 0.2–6 N, m 0.2–5 kg, μ 0–0.30.

---

### A4.5 — Communicating investigation results

**Subtopic.** A4.5 *Communicating investigation results*
(`g8a4-writing-it-up`).

**The question.** Your write-up is good only if a stranger can rebuild
your experiment from it and get your line. Can yours survive that test?

**The scene.** A split stage. Left third: *your bench* — the A4 rig,
settled, with the five-run graph from A4.3 glowing on its instrument
panel. Right third: *Riva's bench* — a second scientist (a rendered
figure with her own stool and coffee) at an identical but *unbuilt* rig:
track flat-packed, cart in its box, no masses placed. Centre: the
*report page*, an A4 sheet with six labelled slots: **Claim**,
**Evidence**, **Reasoning**, **Spread of repeats**, **Conditions and
limits**, **What to test next**. Below the sheet, a card tray holding
about ten draggable cards — the six right ones and four tempting
imposters ("We were very careful", "The graph speaks for itself",
"It worked", "Force makes things go"). The Evidence card is the
student's own A4.3 graph in miniature. A pneumatic message tube runs
from the sheet to Riva's bench.

**What the student does.**
1. Fill the six slots by dragging cards; each snaps in or bounces out
   (any card fits any slot — judging fit is Riva's job, not the UI's).
2. Press SEND. The sheet rolls up, shoots down the tube; Riva reads it,
   *builds her rig using only what the sheet says*, runs it, and stamps
   the sheet.
- Attempt 1: however the student first fills it (typically with an
  imposter or an empty Conditions slot).
- Attempt 2 (change what failed): fix the slot Riva's stamp named.
- Attempt 3: the full, correct six.

**What they see happen.** Riva's build is watchable and literal. If
*Conditions and limits* ("level track, 1.00 kg total, pull below 5 N")
is missing or vague, she shrugs, builds on her slightly sloped bench,
and her five points land offset from the claim's line: the stamp
**NOT REPRODUCED** thuds onto the sheet with a note ("my line does not
pass through the origin — was yours level?"). If *Spread of repeats* is
missing, she runs each setting once, gets 1.02 where the claim implied
0.98, and stamps **CANNOT TELL — is this disagreement or noise?** If
the Claim slot holds "It worked", she reads it aloud, flatly, and
stamps **NO TESTABLE CLAIM**. With all six sound, she levels, loads,
releases, and her five mean dots land on the student's line inside the
quoted spread: **REPRODUCED**, and both graphs are overlaid on the
centre sheet, her points among yours.

**What accumulates.** The sheet keeps its stamps — a run of red and
amber ending in green — and the overlay graph of two independent data
sets on one line, which is the whole point of writing anything up. The
ledger records each attempt: *slots filled*, *Riva's result*, *stamp*.

**The failure state.** NOT REPRODUCED, performed, not announced: a real
second rig visibly producing different data because of a specific
missing sentence, with the divergence drawn.

**The prediction.** *You send a perfect report except it never mentions
levelling the track. Riva's line will…*
1. Match yours — levelling is obvious.
2. Miss the origin: her slope adds a constant push you never had. ✔
3. Be steeper.
4. Not exist — she cannot run at all.
Reveal: her bench slopes 1°, hers happened to help the cart, and her
intercept is +0.17 m/s². A condition you did not write down is a
condition she did not meet.

**The misconception it confronts.** *"A conclusion is just what you
expected to happen"* — the Claim slot rejects nothing, but Riva does,
and only a measurable claim ("a is proportional to F; gradient 0.99
kg⁻¹") earns a stamp either way. *"A graph speaks for itself and needs
no words"* — send the graph card alone and watch Riva turn it over
looking for the mass, the level, and the spread it does not carry.

**Real numbers.** The six correct contents, from the checked spec:
Claim — acceleration proportional to net force. Evidence — five points,
0.98–4.91 N, gradient 0.99 kg⁻¹. Reasoning — a straight line through
the origin means a = F/m with m constant. Spread — three runs per
setting, spread < 0.04 m/s². Conditions — level track, 1.00 kg moving
mass, pull ≤ 5 N. Next — hold force, vary mass. Riva's un-level offset
+0.171 m/s² (1°); her single-run noise ±0.02 m/s².

---

## Topic A5 — Newton's Third Law and collisions

A5.1–A5.3 share the **Track kit** with a new instrument, the *pair probe*
(built once): click any force arrow and the body it acts on flashes; a
four-box stamp appears — same size? · same type? · opposite directions? ·
**different bodies?** — and only four ticks earn the "Third Law pair" seal.
A5.4 and A5.5 move to the **Crash rig**.

### A5.1 — Action-reaction pairs

**Subtopic.** A5.1 *Action-reaction pairs* (`g8a5-partner-or-not`).

**The question.** When you pull on something, it pulls back on you — always?
Even when it is lighter than you, or moving away, or not touching you?

**The scene.** The Track kit. In the middle of the track, two dial force
gauges (spring balances with big faces, 0–20 N) hooked face-to-face, so
gauge A's hook holds gauge B's hook. Gauge A's other end is a handle the
student drags. Gauge B's other end clips, by choice, to one of three
anchors parked along the bench: a **wall bracket** bolted to the bench, a
**1.0 kg cart**, or a **7.0 kg cart** (visibly bigger, same wheels). Force
arrows: whatever pulls on B's anchor is orange; whatever pulls back on the
student's handle is teal; both are drawn at 2 cm per 5 N. Off to the side,
the standing *contrast display*: a 5.0 kg cart parked on the bench with
its weight (49 N down) and normal (49 N up) arrows drawn — two equal,
opposite arrows that the probe will expose. Instrument column: a two-needle
strip chart drawing both gauges against time, and the ledger.

**What the student does.**
1. Clip B to the wall. Drag the handle to pull, gently then hard, watching
   both dials.
2. Clip B to the 1.0 kg cart. Pull with a steady 10 N (a tension assist
   holds the drag at 10 N once latched). The cart accelerates away.
3. Clip B to the 7.0 kg cart. Same 10 N.
4. With the probe, stamp two candidates: the gauge-A/gauge-B pull pair,
   and the parked cart's weight/normal pair.

**What they see happen.** Against the wall: nothing moves, and the two
dials read identically at every instant — 3 N and 3 N, 12 N and 12 N,
mirror needles on the strip chart. Against the light cart: the cart runs
away at 10 m/s² *and the dials still match* — accelerating away does not
let it pull back one newton less. Against the heavy cart: a lazier 1.4
m/s², dials matched again. The strip chart shows two traces that never
separate, in all three anchors. The probe on the pull pair: click the
orange arrow — the cart flashes; click the teal — the *student's handle*
flashes; four ticks, seal granted. The probe on weight/normal: click both
arrows — the *same cart* flashes twice; the fourth box stays empty, a red
"both on one body — these are balanced forces, not partners", and the seal
is refused. The probe then offers the weight's true partner: an arrow at
the *Earth's centre*, drawn small at the bottom of the stage, 49 N upward,
labelled "cart pulls Earth".

**What accumulates.** Strip-chart traces from three anchors, never
diverging; a ledger of *anchor*, *A read*, *B read*, *anchor's
acceleration*; and two stamped probe cards — one sealed, one refused —
pinned to the instrument column.

**The failure state.** Pull past 20 N and the gauges' needles hit their
end stops together and the hooks slip with a twang — both gauges recoil,
*both* read zero at the same instant. Even the failure is symmetric:
you cannot break one end of an interaction.

**The prediction.** *You pull the light cart and it accelerates away
fast. While it accelerates, gauge B (its pull back on you) reads…*
1. Less than gauge A — it is losing the tug of war.
2. Zero — it is moving, not pulling.
3. Exactly what gauge A reads, the whole time. ✔
4. More than gauge A — it has speed on its side.
Reveal: the strip chart's two traces lie on top of each other through the
whole run. Winning and losing is about *acceleration* — the light cart
moves because 10 N is a lot for 1 kg — never about unequal forces.

**The misconception it confronts.** *"Any two equal and opposite forces
are an action-reaction pair"* — the weight/normal card fails the probe's
fourth box in front of the student. *"The weight of an object and the
table's push are a Third Law pair"* — refused, and the weight's real
partner (the cart pulling the Earth) is drawn where it lives.

**Real numbers.** Pair readings equal at all times: F_AB = F_BA (the
model enforces it by construction; the gauges display the same state).
Anchored carts: a = 10 N / 1.0 kg = 10 m/s²; 10 / 7.0 = 1.43 m/s².
Contrast display: weight = normal = 5.0 × 9.81 = 49 N, both on the cart.
From the spec's sort: bat/ball 1 500 N each way; Earth–Moon 1.98 × 10²⁰ N
each way with an 81× mass ratio (shown as a wall card the probe can also
stamp); magnet/steel 0.40 N each way.

---

### A5.2 — Why the pair acts on different objects

**Subtopic.** A5.2 *Why the pair acts on different objects*
(`g8a5-one-force-each`).

**The question.** Two magnets repel. Can you arrange things so only *one*
of them feels the push?

**The scene.** The Track kit. Two low-friction carts face each other
mid-track, each carrying a bar magnet, north poles facing, a 5 cm gap
between the pole faces. Cart L is small (20 g of magnet on a skeleton
frame, drawn light and open); cart R is 200 g (a solid block). On each
cart, a force arrow drawn *from its own magnet's face*, pointing away from
the gap — L's teal, R's orange — both 0.40 N and both exactly the same
length (2 cm per 0.1 N). A hairline links the two arrows' tails through
the gap, labelled "one interaction". A *clamp* can be dropped over either
cart (drag from the bench); the clamp contains its own force gauge. A
*steel shield* on a slide can be inserted into the gap. The release is a
pin the student pulls. Instrument column: velocity-time graph, two lines
(L teal, R orange), and the ledger.

**What the student does.**
- Run 1 (equal masses): swap L's skeleton for a second 200 g block (a
  drag from the parts rack). Pull the pin. Both carts released.
- Run 2 (unequal masses): back to 20 g vs 200 g. Pull the pin.
- Run 3 (pin one down): clamp cart R. Pull the pin — only L is free.
- Between runs, the two vanish tests: lift one magnet clean off its cart
  (drag it away) and watch both arrows; and slide the steel shield in.

**What they see happen.** Run 1: the carts spring apart symmetrically —
two equal arrows, two equal 2 m/s² accelerations, v-t lines mirror-image.
Run 2: the arrows are *still the same length* — 0.40 N each — but the
skeleton cart streaks away at 20 m/s² while the block barely rolls at
2 m/s²; the v-t lines split 10:1 while the arrows refuse to. Run 3: the
clamped cart's gauge climbs to 0.40 N — the force on it did not go away
when it stopped being able to move — and the free cart accelerates as
before. The vanish tests: lift either magnet and *both* arrows disappear
in the same frame — there is no half-interaction to keep; the shield
slid in shrinks both arrows together, never one.

**What accumulates.** Three v-t pairs; a ledger of *m_L*, *m_R*,
*F on L*, *F on R*, *a_L*, *a_R* in which the two force columns are
identical in every row and the acceleration columns are not; and the
vanish tests logged as "arrows removed: always two at a time".

**The failure state.** There is no arrangement that produces one arrow.
That impossibility is staged as the failure: a "make it one-sided"
challenge button invites the student to try (clamp, shield, lift, swap);
every attempt updates both arrows together, and after three attempts the
challenge concedes with the rule written the way the rig showed it:
*forces only come in interactions; an interaction has two ends.*

**The prediction.** *20 g magnet cart against 200 g magnet cart. Which
feels the bigger force when released?*
1. The 200 g one — the light one cannot push hard.
2. The 20 g one — it needs more help to keep up.
3. Both feel 0.40 N; the light one just responds ten times as much. ✔
4. Neither — they are not touching.
Reveal: the arrows never differed; the accelerations did, 20 against
2 m/s², exactly the inverse of the masses.

**The misconception it confronts.** *"The stronger or heavier object
pushes harder"* — run 2's equal arrows over a 10:1 split in response.
*"The action happens first and the reaction answers it"* — the pin
release and the vanish tests show both arrows born and dying in the same
frame; neither ever exists alone.

**Real numbers.** Pair force at the 5 cm gap: 0.40 N on each magnet
(falling off visibly as the gap opens — the model uses F = 0.40 N ×
(0.05/d)² capped at 0.40, so the arrows shrink together as the carts
part). a_L = 0.40/0.020 = 20 m/s²; a_R = 0.40/0.200 = 2 m/s²; equal
masses 0.40/0.200 = 2 m/s² each.

---

### A5.3 — A common Third Law misconception

**Subtopic.** A5.3 *A common Third Law misconception*
(`g8a5-so-nothing-moves`).

**The question.** The cart pulls back on the horse exactly as hard as the
horse pulls the cart. So how can the cart ever start moving?

**The scene.** A farm lane, side camera. A horse in harness hitched to a
loaded 700 kg cart. The traces between them pass through a *two-faced
dial gauge* — one dial facing the horse, one facing the cart, both
needles driven by the same spring, so the two readings cannot differ and
the student can see they cannot. Arrows are colour-coded by the body they
act on: **on the cart** orange (traces pull 900 N forward; rolling
resistance 549 N backward at the wheels), **on the horse** teal (traces
pull 900 N backward; the ground's push on the hooves, forward), **on the
ground** grey (hoof push backward, drawn into the dirt). Under the
scene, two *sum trays*: "forces on the CART" and "forces on the HORSE".
Dragging an arrow to a tray works only if the arrow acts on that tray's
body — a wrong arrow bounces out with the body it does act on flashing.
Each tray totals its contents into a net chip. A third, tempting tray
sits between them: "add everything". A GO whistle starts the pull.
Ground-condition lever by the lane: DRY / MUD. Instrument column: v-t
graph for the cart, ledger.

**What the student does.**
- Run 1: drag the 900 N forward arrow and the 549 N resistance arrow
  into the CART tray (the 900 N *backward* arrow bounces out — it acts
  on the horse). Net chip: 351 N. Blow GO.
- Run 2: drop the 900/900 pair into the "add everything" tray. Blow GO
  anyway.
- Run 3: lever to MUD. Blow GO.

**What they see happen.** Run 1: with the cart's own forces summed, the
chip reads 351 N forward; on GO the horse leans, the traces go taut, the
two dial faces both read 900, and the cart accelerates at a stately
0.50 m/s² — 4.0 m down the lane in the first four seconds, hoofbeats
and creak. The v-t line is a shallow ramp. Run 2: the "add everything"
tray happily shows 0 N — and the cart *still* accelerates on GO, while
the tray blushes red with the caption "this zero belongs to no body:
one 900 acts on the cart, the other on the horse; no object anywhere
feels both." Run 3: in mud, the hooves cannot get their grip — the
ground's forward push on the horse maxes out below what the pull
needs; the hooves spin, mud sprays, the two dial faces sag to 750 N
together, the cart tray's net goes to 201 N… and then the wheels bog
(resistance climbs) and everything stops. *This* is what "nothing
moves" actually looks like, and it is a statement about the ground,
not about the Third Law.

**What accumulates.** Three ledger rows: *tray used*, *net on the cart
(N)*, *predicted a*, *measured a* — 351/0.50/0.50; "no owner"/—/0.50
(the cart ignored the fake zero); mud row with the reduced numbers.
The graph keeps the three cart v-t lines.

**The failure state.** The mud run: a real stall with a real cause —
insufficient ground force on the horse — standing right next to the
paradox's fake stall, so the difference between them is the lesson.

**The prediction.** *The cart pulls back on the horse with exactly
900 N. When the horse pulls, the cart will…*
1. Stay put — 900 forward and 900 back cancel.
2. Move only if the horse somehow pulls harder than 900.
3. Accelerate: the 900 N back acts on the horse, not the cart. ✔
4. Move backwards.
Reveal: the only forces *on the cart* are 900 N forward and 549 N of
rolling resistance. Net 351 N, and 351 N on 700 kg is 0.50 m/s². The
partner force spends its whole life on the horse's shoulders.

**The misconception it confronts.** *"Equal and opposite forces mean
nothing can accelerate"* — the bouncing trays make the bookkeeping
physical: the pair cannot be summed because no single body owns both.
*"The horse must pull harder than the cart pulls back"* — the two-faced
gauge is one spring with two windows; it cannot read 901 and 900.

**Real numbers.** Traces tension 900 N (both directions, one
interaction). Cart: weight 700 × 9.81 = 6 867 N; rolling resistance
0.08 × 6 867 = 549 N; net 900 − 549 = 351 N; a = 351/700 = 0.50 m/s²;
distance ½ × 0.50 × 4² = 4.0 m in 4 s. Mud: ground's forward push
capped at 750 N; tension falls to 750 N on both faces; net on cart
750 − 549 = 201 N until bogging raises resistance past it.

---

### A5.4 — Applying the law to a collision-safety design

**Subtopic.** A5.4 *Applying the law to a collision-safety design*
(`g8a5-stretch-the-stop`).

**The question.** The crash will happen at 13.4 m/s no matter what you
build. The only thing you control is how *long* the stop takes — how
much does that buy?

**The scene.** The **Crash rig**: a 12 m rail, side camera, with a
barrier at the right end. On the rail, a sled carrying a seated crash
dummy (70 kg, articulated at neck and hip), lap-and-shoulder belt drawn,
a *chest force gauge* on the dummy reading in kN with a peak-hold
needle. The barrier's face carries the design variable made physical: a
*ride-down pack* — a telescoping stack of honeycomb cells the student
drags out from the barrier face like an accordion, from 0.13 m (nearly a
bare wall) to 4.0 m of travel; a scale under it reads the stopping time
that stack buys at the current speed (t = 2d/v). Overhead, a millisecond
clock. A launch catapult at the left end with a speed dial (2–20 m/s,
default 13.4). Above the dummy, the momentum ribbon: "938 kg·m/s to
remove", constant across runs at default. A red line is painted across
the chest gauge at 15 kN, labelled "braced adult limit". Instrument
column: *force vs stopping time* graph (one point per run, with the
student's points joined), a slow-motion replay scrubber, and the ledger.

**What the student does.**
1. Drag the ride-down pack to a depth. The stopping-time scale follows.
2. Fire the catapult. The sled crosses, hits, rides the pack down; the
   chest gauge swings and peak-holds.
3. Scrub the replay at 1/50 speed to watch the stop itself.
- Run 1: pack at 1.00 m (0.15 s).
- Run 2 (shorten it): pack at 0.13 m (0.02 s).
- Run 3 (stretch it): pack at 4.0 m (0.60 s).

**What they see happen.** Run 1: the sled arrives at 13.4 m/s, the pack
concertinas over a metre, the dummy leans hard into the belt, the gauge
swings to 6.3 kN and holds — under the red line. Run 2: the pack is a
stub; the stop is a bang, the dummy's head whips, the gauge slams to
46.9 kN, three times past the red line, and the dummy buckles forward
over the belt with a shudder; the replay shows the whole stop occupying
two frames. Run 3: four metres of unhurried crumpling, the dummy riding
down like a braked train, 1.6 kN, the needle barely into the dial. In
every run the momentum ribbon reads the same 938 before and 0 after —
what changed is only *how long* the removal took.

**What accumulates.** Three points on force-vs-time, joined into the
student's own hyperbola; the ledger of *stop time*, *ride-down (m)*,
*peak force (kN)*, *deceleration (g)*, *over/under the red line*.
Doubling the time halves the force, in the student's own rows.

**The failure state.** Any run whose force crosses 15 kN: the dummy
buckles and shudders, the gauge holds its peak in red, and the ledger
row is stamped over-limit. It is the same physics as the pass — only
the time differs.

**The prediction.** *Run 1 stopped in 0.15 s at 6.3 kN. Halving the
stopping time to 0.075 s will make the peak force about…*
1. 6.3 kN — the crash is the same crash.
2. 9 kN — a bit worse.
3. 12.5 kN — double: half the time, twice the force. ✔
4. 3.1 kN — half.
Reveal: the momentum is fixed at 938 kg·m/s. Force is momentum over
time; shrink the denominator and the force answers in exact proportion.

**The misconception it confronts.** *"A seatbelt works by being strong
enough to hold you"* — the belt is identical in all three runs; what
saved the dummy in run 3 was distance and time, not strength. *"The
force in a crash depends only on how fast you were going"* — all three
runs arrive at the same 13.4 m/s and the peak force spans 1.6 to
46.9 kN.

**Real numbers.** Momentum = m·v = 70 × 13.4 = 938 kg·m/s. Peak force
F = m·v/t: 0.02 s → 46.9 kN; 0.15 s → 6.3 kN; 0.60 s → 1.6 kN.
Deceleration g = v/(t·9.81): 68 g / 9.1 g / 2.3 g. Ride-down distance
= v·t/2: 0.13 m / 1.00 m / 4.0 m. Limit line 15 kN. Ranges: t 0.02–
0.60 s, v 2–20 m/s, m 30–90 kg (a dummy-size dial scales the figure by
∛(m/70)).

---

### A5.5 — Testing the design against criteria

**Subtopic.** A5.5 *Testing the design against criteria*
(`g8a5-against-the-limit`).

**The question.** Two nose designs, one 15 kN pass mark. Which passes —
and by how much, and up to what speed?

**The scene.** The **Crash rig** doubled: two parallel rails, shared
launch catapult with one speed dial (both sleds always fired together at
the same speed), one barrier wall across both lanes. Lane 1's sled wears
the **rigid nose** — a machined billet, polished, visibly stiff; its
stopping time is a measured property, 0.04 s. Lane 2's wears the
**crumple nose** — a honeycomb cartridge, 0.12 s. Identical 70 kg
dummies, identical chest gauges with the 15 kN red line. Between the
lanes, the *margin board*: two vertical bars growing downward from the
15 kN line, green below it, red above, labelled with per cent of margin
used or exceeded. Instrument column: *peak force vs impact speed* graph,
two curves accumulating (one per nose), the red 15 kN rule drawn across;
ledger.

**What the student does.**
1. Set the dial to the test speed. Fire. Both sleds run and stop side by
   side; both gauges peak-hold; the margin board fills.
- Run 1: 13.4 m/s (the specified test).
- Run 2 (change the criterion, not the design): drag the red line to
  10 kN and re-fire at 13.4 — a stricter market.
- Run 3 (find the edge): raise the speed until the crumple nose fails
  too. The dial's fine steps let the student close in on it.

**What they see happen.** Run 1: the rigid sled stops in a crack —
23.5 kN, its dummy buckling, its margin bar shooting 56 % past the red
line; the crumple sled rides its 0.12 s down at 7.8 kN, dummy upright,
margin bar comfortably green at 48 % spare. Same speed, same dummy,
same wall; three times the stopping time, a third the force, on one
screen. Run 2: nobody's hardware changed, but at a 10 kN line the
crumple nose's margin shrinks to 22 % and the rigid nose is now 135 %
over — criteria are choices, and margins are measured against them.
Run 3: at 20 m/s the rigid nose reads 35.0 kN; the crumple nose 11.7 kN
— still passing. The student keeps raising: at 25.7 m/s the crumple
nose's peak crosses 15.0 kN and its dummy finally buckles. Every design
has a speed that breaks it; "safe" always carries "up to".

**What accumulates.** Two force-vs-speed lines built from the student's
own firings, both straight through the origin with slopes in the ratio
3:1, crossing the red rule at different speeds (8.6 m/s rigid, 25.7 m/s
crumple). Ledger: *speed*, *rigid kN*, *crumple kN*, *margin each*,
*verdict each* — verdicts reported as margins, never as bare pass/fail.

**The failure state.** Two: the rigid nose failing its very first
specified test, and the crumple nose being *walked to* its own failure
speed by the student in run 3 — the design that passed is also shown to
have an edge.

**The prediction.** *Same sled, same speed, same wall. The stiffer,
stronger-looking rigid nose will read…*
1. Lower — stronger is safer.
2. The same — the crash energy is identical.
3. Three times higher: it stops in a third of the time. ✔
4. Zero — it does not break, so nothing is felt.
Reveal: 23.5 against 7.8 kN. The dummy does not care how strong the
nose is; it cares how long the nose gives it to stop.

**The misconception it confronts.** *"The stiffer design must be the
safer one"* — beaten side by side, same instant, same wall. *"A design
either works or it does not, with no margin to report"* — run 2 moves
the pass mark and the margins move with it; run 3 finds the passing
design's own limit. The board never says PASS; it says how much room
was left.

**Real numbers.** Momentum p = m·v (70 kg default). Rigid: F = p/0.04;
crumple: F = p/0.12. At 13.4 m/s: 23.5 kN and 7.8 kN; margins vs
15 kN: −56 % and +48 %. At 20 m/s: 35.0 and 11.7 kN. Crumple crosses
15 kN at v = 15 000 × 0.12 / 70 = 25.7 m/s; rigid at 8.6 m/s.
Ride-down distances v·t/2: 0.27 m and 0.80 m at 13.4 m/s. Ranges:
v 2–20 m/s on the dial plus a +30 % override for run 3, limit line
5–30 kN, dummy 30–90 kg.

---

## Topic A6 — Engineering a collision solution

One design problem spans the topic: protect a 70 kg occupant arriving at
13.4 m/s (30 mph), carrying 6 285 J. All five briefs live around the
**Crash rig**, extended once with two stations the engineer builds for the
whole topic: the **scrutineering bench** (a 200 mm gauge box drawn as a
clear acrylic tunnel, a balance scale with a 250 g limit flag, and a
materials scanner wand) and the **component press** (a slow hydraulic ram
with a live force-vs-crush graph whose area shades as energy).

### A6.1 — Defining criteria and constraints

**Subtopic.** A6.1 *Defining criteria and constraints* (`g8a6-must-or-may`).

**The question.** Some requirements are tests your design must score well
on. Others are lines you may not cross before you even run. Which is
which — and what happens if you mix them up?

**The scene.** The Crash rig on the right; the scrutineering bench on the
left; between them, a *requirements rack* holding six engraved tags on
lanyards: «peak force on the dummy below 15 kN» · «the egg survives a
2.0 m drop» · «stopping time above 0.10 s» · «fits inside 200 mm» ·
«only card, straws and tape» · «no more than 250 g added». Two prototype
noses sit on a trolley: a card-and-straw honeycomb, and a gleaming
steel-spring nose (the bait). Each station has a tag hook: hang a tag on
the crash rig and the rig runs the matching test at 13.4 m/s and returns
a *number*; hang it on the scrutineering bench and the bench performs a
*check* — slide the nose through the gauge box, sit it on the scale,
sweep the wand — and returns yes/no *without anything being crashed*.
Hang a tag on the wrong station and the station visibly fails to make
sense of it. Instrument column: a two-column board, CRITERIA (with a
score cell each) and CONSTRAINTS (with a tick/cross each), plus the
ledger.

**What the student does.**
- Run 1: take the honeycomb nose, hang the three test-shaped tags on the
  crash rig one at a time, firing each test: the force test (a full sled
  run, gauge peak 10.5 kN), the egg drop (an egg-carrier variant dropped
  2.0 m), the timing test (the ms clock across the stop).
- Run 2: hang the other three tags on the scrutineering bench: the nose
  slides through the 200 mm tunnel with 12 mm to spare; the scale reads
  240 g under the flag; the wand sweeps and lights card/straw/tape only.
- Run 3 (the mix-up, encouraged): hang «fits inside 200 mm» on the crash
  rig — the rig idles and a caption points at the gauge box: "nothing to
  run; this is answered by a box." Hang «peak force below 15 kN» on the
  scrutineering bench — the scale and box shrug: no crash, no number.
  Then swap prototypes: the steel-spring nose *aces* the force test
  (3.9 kN) but the wand lights STEEL in red and the scale reads 410 g —
  scrutineering disqualifies it before its score can count.

**What they see happen.** Criteria produce motion, instruments and a
number that could rank two designs; constraints produce a quiet yes/no
at a bench, before any test, and a breach ends the story regardless of
scores. The bait nose makes it hurt: its beautiful force number sits on
the board greyed out behind a red DISQUALIFIED banner.

**What accumulates.** The board fills: three criteria cells with numbers
(10.5 kN, egg intact, 0.12 s) and three constraint cells with ticks; a
second column for the spring nose showing one brilliant number and two
red crosses. The ledger records which station answered each tag.

**The failure state.** The disqualification: a design that wins the
measurable contest and never gets to enter, because a constraint is not
a score to beat but a gate.

**The prediction.** *The steel-spring nose reads 3.9 kN — the best force
result of the day. Its overall verdict will be…*
1. Winner — lowest force wins.
2. Winner, with a small penalty for the steel.
3. Disqualified: it breaks the materials and mass constraints, and no
   score can buy those back. ✔
4. A tie with the honeycomb.
Reveal: the wand and the scale said no before the rig said 3.9. A
criterion measures how well; a constraint rules what may exist at all.

**The misconception it confronts.** *"Criteria and constraints are two
words for the requirements list"* — the two stations physically answer
different kinds of question, and each tag only works at one of them.
*"A constraint is anything that makes the design harder"* — the egg's
40 N shell makes the design very hard and is a criterion (it is tested,
and scored, by a drop).

**Real numbers.** Force criterion 15 kN ≈ 22 g on 70 kg, near a braced
adult's limit. Egg drop: 2.0 m → arrives at √(2·9.81·2) = 6.3 m/s;
shell fails near 40 N. Timing criterion: t > 0.10 s keeps F = 938/t
under 9.4 kN at 13.4 m/s. Constraints: envelope 200 mm; card, straws,
tape only; added mass ≤ 250 g. Honeycomb nose: 10.5 kN, 0.12 s, 240 g,
188 mm. Spring nose: 3.9 kN and 410 g of steel.

---

### A6.2 — Crumple zones and impulse, conceptually

**Subtopic.** A6.2 *Crumple zones and impulse, conceptually*
(`g8a6-longer-to-crush`).

**The question.** The crash always delivers 6 285 J. If you cannot make
the energy smaller, what *can* you make smaller?

**The scene.** The Crash rig, one lane. Clipped to the barrier, a
*crumple element* — a honeycomb cartridge the student can grab by its
end plate and telescope out to any length from 0.05 m (a stub) to 1.2 m
(longer than the sled), a length scale beneath. The sled and 70 kg dummy
arrive at a fixed 13.4 m/s (the dial is locked for this brief and says
so: "the crash is not yours to choose"). The hero instrument sits in
the column: the *constant-area rectangle* — a force-vs-distance graph
in which the run draws a rectangle, crush length along the bottom,
force up the side, and its area is shaded and labelled 6 285 J. As the
student drags the element longer *before* a run, a ghost rectangle
previews: wider always means lower, the area label never moving. Chest
gauge with the 15 kN red line; ms clock. A "spring swap" hook holds a
steel spring of the same length for run 3.

**What the student does.**
1. Drag the element to a length. Fire. Watch the crush and the
   rectangle draw for real over the ghost.
- Run 1: 0.60 m.
- Run 2 (shorten it): 0.05 m.
- Run 3 (same length, wrong physics): swap in the 0.60 m steel spring
  and fire.

**What they see happen.** Run 1: 0.60 m folds down cell by cell over
90 ms; force flat at 10.5 kN; a long low rectangle; the dummy leans and
recovers. Run 2: the stub is gone in 7 ms at 126 kN — a tall thin
rectangle of exactly the same shaded area — and the dummy buckles hard
past a pinned gauge. Same joules, both times, in the same-sized patch
of shading; only the shape of the rectangle changed. Run 3: the spring
compresses 0.60 m at a rising force (a triangle, not a rectangle,
peaking at 21 kN)… and then *gives it all back*: the sled is fired
backwards off the barrier at nearly its arrival speed, the shaded area
un-shades as the curve retraces, and the dummy is snapped twice — once
stopping, once being thrown back.

**What accumulates.** Three force-distance figures on shared axes: two
rectangles of equal area at 3:1 aspect, and the spring's closed
triangle whose *kept* energy nets to nearly zero. Ledger: *length*,
*peak force*, *stop time*, *energy kept in the element*, *sled speed
after* — 0 m/s, 0 m/s, −12.1 m/s.

**The failure state.** Two: the stub's 126 kN buckle, and the spring's
rebound — a "protector" that returns the crash to its passenger.

**The prediction.** *You double the crush length from 0.30 m to
0.60 m. The average force will…*
1. Stay the same — the crash energy is fixed.
2. Halve: the same area spread over twice the width. ✔
3. Double — more material pushes back harder.
4. Drop to zero.
Reveal: the rectangle cannot change its area, only its shape. Force is
energy divided by distance, so every centimetre you add is force you
subtract.

**The misconception it confronts.** *"A stronger car body protects the
people inside better"* — the strongest object in the brief (the stub,
then the spring) produces the worst chest readings on screen. *"A
crumple zone works by making the car bounce off"* — run 1 ends at
0 m/s with the honeycomb permanently flat and the energy ledger full;
run 3 is what bouncing actually looks like, and it is worse.

**Real numbers.** E = ½ × 70 × 13.4² = 6 285 J, fixed. Average force
= E/d: 0.05 m → 126 kN; 0.30 m → 21.0 kN; 0.60 m → 10.5 kN; 1.2 m →
5.2 kN. Stop time = 2d/v: 7 ms, 45 ms, 90 ms, 179 ms. Deceleration
= v²/2d: at 0.60 m, 150 m/s² = 15.3 g. Spring: F = kx to 21 kN at
0.60 m (k = 35 kN/m), energy returned ≈ 90 %, exit speed ≈ −12.1 m/s.

---

### A6.3 — Generating candidate solutions

**Subtopic.** A6.3 *Generating candidate solutions*
(`g8a6-what-could-work`).

**The question.** Before choosing anything: what are all the ways the
stopping could be stretched — and what does each one actually do with
the energy?

**The scene.** The **component press**: a bench with a slow hydraulic
ram (a piston head that advances at a steady 0.05 m/s with a force
gauge in its face), a specimen anvil, and above it the live
*force-vs-crush* graph whose swept area shades as "energy taken". To
the left, a parts carousel holding six candidates, each a real object:
a **crumple can** (drinks-can corrugation), a **foam block**, a
**steel spring**, a **longer nose** (a second crumple can at double
length), a **seatbelt** on a mini-sled with a 10 kg mini-dummy, and an
**airbag** module on the same mini-sled. The two occupant-side
candidates test on a short slave rail beside the press, fired at
5 m/s, with a mini chest gauge. Below the graph, the *candidate
gallery*: six empty card slots, each waiting for a tested candidate's
autogenerated record card (peak force · distance used · energy kept ·
energy handed back). The CHOOSE drawer under the gallery is physically
locked — its hasp only opens when all six slots hold cards.

**What the student does.** Load each candidate onto the press (drag
from carousel to anvil), run the press stroke, watch the curve draw,
and stamp the card into its slot. The seatbelt and airbag runs fire
the mini-sled instead. The "runs" are the six tests; the variable that
changes is the candidate.

**What they see happen.** The crumple can draws a clean flat line at
3 kN for 0.30 m — a 900 J rectangle, shaded and kept, the can staying
crushed. The foam block absorbs gently for a few centimetres (40 J)
then *bottoms out*: the curve turns a corner and climbs a cliff as the
press meets solid, the spike flagged red. The spring draws its rising
line, stores 250 J — then, as the press withdraws, pushes the ram
back, and the shaded area drains away to a thin hysteresis sliver:
"kept: ~0 J". The longer nose draws the same 3 kN but twice as far:
1 800 J. The seatbelt run: unbelted first (the mini-dummy leaves the
sled and strikes the end wall, its own gauge spiking), then belted
(the dummy rides the sled's slow-down curve, gauge low and wide). The
airbag adds 0.03 s to the dummy's stop and the gauge trace flattens
and broadens — same impulse, spread over chest area and time.

**What accumulates.** Six record cards in the gallery — the topic's
raw material, generated by the student's own presses. The graph screen
keeps all six curves overlaid, colour-keyed to the cards. When the
sixth card lands, the CHOOSE drawer clunks open, revealing the A6.4
score sheet: judging is now allowed.

**The failure state.** The spring's draining shade — a candidate that
looked best mid-stroke revealed as keeping nothing — and the foam's
red spike, a candidate that quits early. Both failures happen on the
press, cheaply, which is the argument for testing components before
crashing vehicles.

**The prediction.** *The steel spring reaches 250 J of shading at full
compression. When the press withdraws, the "energy kept" figure will
read…*
1. 250 J — it absorbed it, we watched.
2. About half.
3. Nearly zero: it hands the energy straight back. ✔
4. More than 250 J.
Reveal: the shade drained as the spring re-extended and shoved the ram
out. Storing is not absorbing; only what stays crushed stays kept.

**The misconception it confronts.** *"The first workable idea is the
one to build"* — the locked drawer makes collecting-before-choosing a
mechanism, not advice, and the sixth candidate tested (whichever it
is) usually beats the first. *"A part that springs back has absorbed
the energy"* — the spring's shade drains on screen.

**Real numbers.** Crumple can: 3 kN × 0.30 m = 900 J, kept. Foam:
≈ 40 J then bottoms out (spike to the press limit). Spring: ½kx² =
250 J stored, ≈ 95 % returned. Longer nose: 3 kN × 0.60 m = 1 800 J;
doubling crush halves the peak force needed for the same energy.
Seatbelt: keeps the dummy on the vehicle's slow-down curve (mini-sled:
5 m/s over 0.25 m = 50 m/s² instead of a 0.02 m dash-strike at
625 m/s²). Airbag: +0.03 s of stopping time, load spread over
≈ 0.05 m² of chest.

---

### A6.4 — Systematic evaluation of designs

**Subtopic.** A6.4 *Systematic evaluation of designs*
(`g8a6-two-noses-scored`).

**The question.** Two finalists from the gallery. Same test, same
sheet, same pass marks — which one earns the recommendation?

**The scene.** The Crash rig's twin rails (as in A5.5). Lane 1: the
**foam nose**, 0.25 m of crush available, 180 g. Lane 2: the **crumple
can nose**, 0.60 m, 240 g. Shared catapult dial. Between the lanes,
the *score sheet* on a clipboard, four printed rows: «peak force ≤
15 kN» · «margin against the limit» · «mass added (≤ 250 g)» · «fits
200 mm» — each row has two empty cells, one per design, that fill only
from a measurement or a scrutineering check, never by hand. Chest
gauges with the red line; the scrutineering bench in the background,
already stamped from A6.1. Instrument column: *peak force vs speed*
graph, two accumulating curves; ledger.

**What the student does.**
- Run 1: fire both at 13.4 m/s. The force cells fill from the gauges;
  the margin cells compute; mass and fit cells pull their stamps from
  scrutineering.
- Run 2 (test beyond the brief): dial to 20 m/s, fire both.
- Run 3 (change the occupant): dummy dial to 100 kg, back to 13.4 m/s,
  fire both.

**What they see happen.** Run 1: the foam nose bottoms out through its
0.25 m and reads 25.1 kN — its dummy buckles, its cell prints red,
margin −68 %; the can rides 0.60 m at 10.5 kN, margin +30 %. On mass,
the *foam wins* (180 g against 240 g) and its cell prints green — one
sheet now holds a winner-per-row disagreement, and the verdict line
resolves it: the force row is a criterion with a hard limit; a design
that fails it is out no matter what it wins. Run 2: at 20 m/s both
designs go over — 56.0 kN and 23.3 kN — both dummies buckle; the sheet
prints a second column pair in red with the caption "the 13.4 m/s
verdict was a 13.4 m/s verdict." Run 3: at 100 kg the can reads
14.96 kN — a pass by 0.3 %, its margin bar a sliver — and the sheet's
margin row shows why margins are reported: a pass that thin is a
different fact from run 1's +30 %.

**What accumulates.** The completed two-column sheet with red and
green cells and margins; force-vs-speed curves for both noses crossing
the 15 kN rule at 8.0 and 19.1 m/s; ledger rows for each firing.

**The failure state.** The foam's bottoming-out buckle at the specified
test; both designs failing together at 20 m/s; and the 0.3 % squeaker,
which is the sheet teaching that pass/fail alone hides what matters.

**The prediction.** *The foam nose is 60 g lighter and fails the force
row. Overall it…*
1. Wins — most rows green.
2. Ties.
3. Is rejected: no other row can pay for a failed hard criterion. ✔
4. Wins if we retest at a gentler speed.
Reveal: the sheet's verdict line reads the force row first. Rows are
not currency; a hard criterion is a gate with a number on it.

**The misconception it confronts.** *"The lighter design is
automatically better"* — mass row green, dummy buckled, on one sheet.
*"A design that fails one criterion can be fixed by scoring well on
the others"* — the verdict line refuses the trade in front of the
student, and run 3 shows the same design's pass thinning to 0.3 %
when one condition moves.

**Real numbers.** E = ½mv². At 70 kg, 13.4 m/s: 6 285 J → foam
(0.25 m) 25.1 kN, margin −68 %; can (0.60 m) 10.5 kN, margin +30 %.
At 20 m/s: 14 000 J → 56.0 kN and 23.3 kN, both over. At 100 kg,
13.4 m/s: 8 978 J → 35.9 kN and 14.96 kN (+0.3 % margin). Masses
180 g and 240 g against the 250 g constraint; both fit 200 mm.
Crossing speeds for 15 kN: foam 8.0 m/s, can 19.1 m/s.

---

### A6.5 — Reporting the best solution and its trade-offs

**Subtopic.** A6.5 *Reporting the best solution and its trade-offs*
(`g8a6-the-recommendation`).

**The question.** You are recommending the crumple can. Can you say
exactly what the buyer gets, what it costs them, and where your
evidence runs out — before a review board finds out for you?

**The scene.** Three zones. Left: the Crash rig, loaded with the
recommended build — can nose plus seatbelt — ready to run the
*validation firing*. Centre: the *recommendation dossier*, a large
card with five printed fields: **The choice** · **Evidence it meets
each criterion** · **The energy path** · **What it costs** ·
**Conditions not covered**. The energy-path field is filled by an
instrument, not typing: during the validation firing an *energy
ribbon* flows across the scene — a band leaving the sled labelled
6 285 J, dividing into the can (a thick branch, 6 285 J at 10.5 kN
over 0.60 m) while the belt's branch shows the dummy held on the
sled's own 0.090 s slow-down; the ribbon freezes into the dossier as
its diagram. Right: the *review board* — three examiners at a desk
with their own miniature crash rig and a rubber stamp. Field chips to
drag into the dossier are generated by the student's own instruments:
the 10.5 kN peak, the +30 % margin, the 240 g and +0.60 m costs, and
a chip that only exists if the student has run the rig at any speed
above 13.4: «untested above 13.4 m/s — at 20 m/s the force reaches
23.3 kN».

**What the student does.**
- Run 1: the validation firing at 13.4 m/s; watch the ribbon; the
  evidence chips mint themselves.
- Run 2 (probe the envelope): fire at 20 m/s once, on purpose, to
  mint the conditions chip — watching their recommended design fail
  in their own hands.
- Run 3: assemble the dossier and submit. If **What it costs** or
  **Conditions not covered** is empty, the board does not argue: an
  examiner walks to their miniature rig, dials it to 20 m/s, fires,
  watches the mini-dummy buckle, and stamps **OVERCLAIMED**. With all
  five fields honest, the board stamps **ACCEPTED — WITHIN STATED
  LIMITS**, and reads the costs aloud.

**What they see happen.** The validation run is the topic's finale
played on its own apparatus: the arrival, the 0.60 m of fold, the
flat 10.5 kN, the dummy held by its belt on the same curve as the
sled, the ribbon carrying every joule into crushed aluminium and
warmth with nothing left over and nothing handed back. The 20 m/s
probe is the same scene turned hostile. And the board's re-test makes
the cost of omission concrete: claims are checked by other people
with rigs of their own.

**What accumulates.** The finished dossier — choice, four evidence
chips against four criteria, the frozen energy ribbon, two cost
lines, one envelope line — and the board's stamp. This card is the
artefact the whole unit was building.

**The failure state.** OVERCLAIMED: the board's independent 20 m/s
firing, run because the dossier was silent about it.

**The prediction.** *You submit without the «untested above 13.4 m/s»
line. The board will…*
1. Accept — the tests you did run all passed.
2. Ask politely for more data.
3. Run the missing test themselves and reject the claim. ✔
4. Accept with a lower score.
Reveal: an unstated limit reads as an unlimited claim, and unlimited
claims are the easiest kind to break — one dial, one firing.

**The misconception it confronts.** *"The best design has no
drawbacks"* — the dossier physically will not close without the cost
field, and the accepted stamp names the 240 g and the 0.60 m aloud.
*"A design tested once at one speed is finished"* — the student mints
the envelope chip by breaking their own design, and the board enforces
it.

**Real numbers.** Validation at 13.4 m/s: 6 285 J and 938 kg·m/s
removed; can 0.60 m at 10.5 kN average; stop 2d/v = 0.090 s; dummy on
the belt follows the same 0.090 s curve (belt load ≈ 938/0.090 =
10.4 kN shared across the harness); margin (15 − 10.5)/15 = +30 %.
Costs: +240 g, +0.60 m of nose. Envelope: at 20 m/s, E = 14 000 J →
23.3 kN, over the limit by 56 %.

---

# Unit B — Energy in Moving Systems

## Topic B1 — Kinetic energy

B1.1–B1.4 run on the **Energy track**: a curved launch ramp with a height
scale (a clamp the student drags up its rail, 0–1.5 m), a light-gate
speedometer at the ramp's foot, a level 3 m run, and the topic's key
instrument — the **magnetic brake strip**, a 2.5 m bed of copper fins with
a retarding-force dial (locked at 10 N for the topic, printed on its side)
and a distance scale. A trolley entering the strip is dragged by a steady
10 N until it stops, so *the distance it penetrates is the kinetic energy
made visible*: every 0.10 m of penetration is 1.0 J spent. A flag drops
where the trolley stops and stays there between runs. B1.5 moves to the
**Crash rig**.

### B1.1 — Kinetic energy and mass

**Subtopic.** B1.1 *Kinetic energy and mass* (`g8b1-load-the-trolley`).

**The question.** Two trolleys pass the speed gate at exactly the same
3.0 m/s. One is loaded double. Does it carry double the energy — and how
would you *see* that?

**The scene.** The Energy track, side camera. The trolley (1.0 kg bare)
has an open load bay taking 1.0 kg slabs from a rack; a scale built into
the start platform reads the total. The ramp clamp is parked at 0.46 m
and *locked* for this brief, with a label: "same start height → the gate
will read 3.0 m/s for any load" — the gate is there to prove it every
run. The brake strip's stop-flags are numbered per run. Velocity arrow
on the trolley; at the moment the trolley enters the strip an energy bar
appears over it (orange, full) and drains in proportion as fins go by,
while a red thermal tint blooms along the fins it has passed. Instrument
column: *energy spent in the strip (J) vs mass (kg)* graph — the y-value
is computed as 10 N × penetration, so the graph is literally reading the
scene — and the ledger.

**What the student does.**
1. Load the bay (run 1: no slab — 1.0 kg total). Hoist the trolley onto
   the ramp clamp (a drag), release.
2. Read the gate speed as it passes; watch the strip; log the flag.
- Run 1: 1.0 kg.
- Run 2 (change the mass): 2.0 kg.
- Run 3 (change the mass): 4.0 kg.

**What they see happen.** Every run the gate flashes the same "3.0 m/s"
— same start height, same arrival speed, visibly independent of load.
But the strip tells them apart: the 1.0 kg trolley is wrestled to a stop
in 0.45 m; the 2.0 kg pushes to 0.90 m, exactly twice as deep, past
run 1's flag; the 4.0 kg grinds out 1.80 m of glowing fins. Three flags
in a row, each doubling, at one shared speed. The energy bar over each
trolley starts at 4.5, 9.0, 18 J and drains to zero at its flag.

**What accumulates.** Three points on energy-vs-mass lying on a straight
line through the origin (4.5, 9.0, 18 J at 1, 2, 4 kg); the flags
physically on the strip in the scene; ledger columns *mass*, *gate
speed*, *penetration (m)*, *energy = 10 N × d (J)*, *momentum (kg·m/s)*
— the momentum column (3, 6, 12) doubling alongside energy here, held
for contrast with B1.2 where they will part company.

**The failure state.** Load 8.0 kg (two more slabs than the runs ask):
36 J wants 3.6 m and the strip has 2.5 — the trolley reaches the end
buffer still doing 1.7 m/s and slams it; the buffer's impact lamp
lights, and the ledger records "energy not fully spent in the strip:
25 J in the fins, 11 J into the buffer." The meter has a range, like
every real meter.

**The prediction.** *Same 3.0 m/s at the gate, twice the mass. The
trolley will drive into the brake strip…*
1. The same distance — same speed, same stop.
2. Twice as far. ✔
3. Four times as far.
4. Less far — heavy things are harder to move.
Reveal: flag 2 stands at 0.90 m, twice flag 1's 0.45 m. Each kilogram
carries its own ½v² of energy; two kilograms at one speed carry exactly
two shares.

**The misconception it confronts.** *"A heavy object always has more
energy than a light one"* — before run 3 the loaded 4 kg trolley sits
parked beside the moving 1 kg one, its energy bar flat at 0 J while the
mover's reads 4.5: mass without speed holds nothing. *"Mass and speed
affect kinetic energy in the same way"* — the linear line built here is
half the evidence; B1.2 supplies the bending other half on the same
axes style.

**Real numbers.** Ramp drop 0.46 m → v = √(2·9.81·0.46) = 3.0 m/s for
any mass. E = ½mv²: 4.5, 9.0, 18.0, 36.0 J at 1, 2, 4, 8 kg. Momentum
mv: 3.0, 6.0, 12.0. Penetration d = E / 10 N: 0.45, 0.90, 1.80, 3.60 m
(strip length 2.5 m). Buffer case: v at strip end = √(2(E − 25)/m).
Spec cross-checks kept: stopping force over a 2.00 m trap = E/2;
climb height v²/2g = 0.46 m, the ramp height back again.

---

### B1.2 — Kinetic energy and speed

**Subtopic.** B1.2 *Kinetic energy and speed* (`g8b1-roll-it-faster`).

**The question.** Same trolley, twice the speed. Twice the energy — or
more?

**The scene.** The Energy track again, with the controls swapped: the
load bay is *sealed* at 2.0 kg (a plate over it: "mass locked"), and
the ramp clamp is now the student's — its rail marked both in metres
*and*, on a second scale alongside, in the gate speed each height will
produce (0.051 m ↔ 1.0 m/s, 0.20 m ↔ 2.0, 0.46 m ↔ 3.0, 0.82 m ↔ 4.0,
1.27 m ↔ 5.0). Same gate, same 10 N strip, same numbered flags, same
thermal bloom. Instrument column: *energy spent (J) vs gate speed
(m/s)* graph with the y-axis to 30 J, and the ledger. A ghost overlay
of B1.1's straight line is available as a toggle for contrast.

**What the student does.**
1. Drag the clamp to a height, seat the trolley, release; read the
   gate; log the flag.
- Run 1: 1.0 m/s.
- Run 2 (double it): 2.0 m/s.
- Run 3 (double again): 4.0 m/s.

**What they see happen.** Run 1: a gentle roll; the strip swallows it
in 0.10 m — one fin's worth of glow. Run 2: double the speed and the
flag lands at 0.40 m — *four* fins of glow, four times the
penetration, unmistakably not two. Run 3: 4.0 m/s buries the trolley
1.60 m deep, sixteen times run 1, the thermal bloom running most of
the bed. The three flags spread out along the strip in the ratio
1 : 4 : 16 while the clamp heights that made them sit in the ratio
1 : 4 : 16 as well — the ramp scale quietly telling the same story.

**What accumulates.** Three points bending upward on energy-vs-speed
(1, 4, 16 J at 1, 2, 4 m/s); with the B1.1 overlay on, a straight
line and a curve share the column and the student can point at which
variable does which. Ledger: *gate speed*, *penetration*, *energy*,
*momentum* — momentum reads 2, 4, 8 (doubling) while energy reads 1,
4, 16 (quadrupling): the two columns part company here, on the same
rows.

**The failure state.** The clamp's top stop is 1.27 m — 5.0 m/s and
25 J, which is 2.50 m of penetration: the flag lands exactly at the
strip's last centimetre, the design's own full-scale mark. A cheat
toggle ("+push") lets the student add a hand shove at the top; any
shove sends the trolley into the buffer, and the ledger's energy cell
splits into "strip 25 J + buffer n J", teaching that the meter maxed,
not the physics.

**The prediction.** *Run 1 at 1.0 m/s went 0.10 m into the strip. At
2.0 m/s the trolley will go…*
1. 0.20 m — twice the speed, twice the energy.
2. 0.40 m — twice the speed, four times the energy. ✔
3. 0.10 m — the same trolley stops the same way.
4. 0.80 m.
Reveal: the flag is at 0.40 m. Speed enters the energy twice — once
because you move faster, once because you arrive sooner — so doubling
it multiplies the energy by four.

**The misconception it confronts.** *"Doubling the speed doubles the
kinetic energy"* — falsified by a flag the student walks past.
*"A graph of energy against speed is a straight line"* — their own
three points refuse a ruler, with B1.1's genuinely straight line
overlaid for the contrast.

**Real numbers.** Clamp heights h = v²/(2·9.81): 0.051, 0.204, 0.459,
0.815, 1.274 m for 1–5 m/s. E = ½·2.0·v² = v²: 1, 4, 16, 25 J.
Penetration = E/10: 0.10, 0.40, 1.60, 2.50 m. Momentum 2v: 2, 4, 8,
10 kg·m/s. Spec cross-check kept: energy at double speed = 4× at every
speed; climb height = v²/2g returns the clamp height.

---

### B1.3 — Why speed has the larger effect

**Subtopic.** B1.3 *Why speed has the larger effect*
(`g8b1-one-four-nine`).

**The question.** Every extra metre per second costs energy. Does the
third one cost the same as the first?

**The scene.** The Energy track with the ramp swung aside and a
**pump launcher** docked at the start: a stout hand pump whose handle
the student physically drags down, a mechanical *joule counter* on its
flank (each full stroke clicks exactly 1 J into the launch spring —
the counter's digits roll with a clunk), a spring-compression window
showing the coil tightening, and a release trigger. The trolley is the
sealed 2.0 kg one. The gate reads the launch speed; the 10 N strip
and flags stand ready as the checkable second opinion. Above the
scene, the *price board*: a bar chart with slots for each target
speed, 1–5 m/s, each bar built of unit blocks — one block per pump
stroke, stacked live as the student pumps. Instrument column: the
board is the graph this time; ledger below.

**What the student does.**
1. A target chip ("reach 1.0 m/s") docks by the gate. Pump until the
   gate — on release — confirms the target. Strokes are counted; the
   bar builds.
- Run 1: target 1.0 m/s. One stroke does it: gate 1.0.
- Run 2: target 2.0 m/s. The student pumps… 2 strokes and releases —
  gate reads 1.41. Short. Re-dock, pump to 4, release: gate 2.0.
- Run 3: target 3.0 m/s. 9 strokes.
(The measure step then asks for 4.0 and 5.0: 16 and 25 strokes, the
pumping now a real labour the student feels in repetition.)

**What they see happen.** The counter and the gate together make the
law tactile: equal speed steps, wildly unequal work. The price board
fills into 1, 4, 9, 16, 25 — and a second row under it lights the
*differences*: +3, +5, +7, +9, the odd numbers marching. Every launch
is auditable: the strip flag lands at counter ÷ 10 metres, so the
9-stroke launch buries 0.90 m of fins — the energy bought by pumping
is recovered, all of it, as braking distance.

**What accumulates.** The completed price board (the squares) with its
difference row (the odd numbers); flags on the strip at 0.10, 0.40,
0.90 m…; ledger: *target v*, *strokes needed*, *gate reading*,
*strokes for this step*, *strip check (m)*.

**The failure state.** Run 2's first attempt is the designed failure:
double the strokes does *not* double the speed — 2 J launches at
1.41 m/s, and the gate says so to two decimals. The wrong theory is
tried by hand and priced.

**The prediction.** *One stroke gave 1.0 m/s. To reach 2.0 m/s you
will need…*
1. 2 strokes — double is double.
2. 3 strokes.
3. 4 strokes. ✔
4. It depends how fast you pump.
Reveal: 2 strokes read 1.41 m/s on the gate. Energy goes with the
square of the speed, so the second metre per second costs three more
strokes than you own after the first.

**The misconception it confronts.** *"Each equal step of speed adds an
equal amount of energy"* — the student's forearm learns otherwise
before the board says it: steps cost 1, then 3, then 5, then 7
strokes. *"Mass and speed matter equally"* — a side plaque restates
B1.1: adding a second kilogram would double every bar; adding a
second metre per second squares its way up.

**Real numbers.** With m = 2.0 kg, E = ½·2·v² = v² exactly: the joule
count for v m/s is v² (1, 4, 9, 16, 25 J) and each stroke is 1.00 J
into ½kx² of spring. Step cost to go from v−1 to v: 2v − 1 J (the odd
numbers). Gate speed for n strokes: √n m/s (2 strokes → 1.41). Strip
check: d = n/10 m. Five times the speed of run 1 = twenty-five times
its energy.

---

### B1.4 — Interpreting the shape of the curve

**Subtopic.** B1.4 *Interpreting the shape of the curve*
(`g8b1-reading-the-curve`).

**The question.** Here is the whole energy-speed curve for your
trolley. Can you read a road-safety argument straight off its shape?

**The scene.** The stage splits evenly. Right: the *curve wall* — the
E = v² curve for the sealed 2.0 kg trolley drawn floor-to-ceiling
(x 0–10 m/s, y 0–100 J), with a heavy crosshair bead the student
drags *along the curve itself* (it will not leave the line), spilling
a vertical drop-line to the speed axis and a horizontal one to the
energy axis. Left: the Energy track, live, enslaved to the bead —
whatever speed the bead sits at, the trolley on the track runs at,
over and over, with the strip showing the matching penetration as a
ghost flag at E/10 metres. Two graph tools on a small shelf: the
*step ruler* (a rigid +2.0 m/s wide bracket that, placed anywhere on
the curve, shades the energy strip that step adds) and the *half
line* (a horizontal dashed line at 50 J the student can switch on).
Instrument column: ledger of placed flags.

**What the student does.**
- Run 1 (place the flags): drag the bead to 2, 4, 6, 8, 10 m/s; at
  each, a click plants a flag on the curve and the track below runs
  that speed, its ghost flag landing at 0.4, 1.6, 3.6, 6.4, 10.0 m
  (the strip's scale extends as a dashed continuation past its real
  2.5 m, honestly labelled "beyond the rig").
- Run 2 (equal steps, unequal strips): walk the step ruler up the
  curve from 0: the four shaded strips it cuts read 4, 12, 20, 28 J.
- Run 3 (the halfway hunt): switch on the 50 J half line; the student
  drags the bead to where they think half the top energy lives.

**What they see happen.** The flags climb a curve that steepens with
every placement — the vertical gaps between successive flags grow
(12, 20, 28, 36 J) while the horizontal gaps stay a fixed 2 m/s. The
step ruler makes the growth into objects: four shaded strips of
visibly increasing area, each an equal speed step. The halfway hunt:
almost every student parks the bead at 5 m/s — the drop-line lands at
25 J, only a quarter of the wall's height, and the bead has to be
dragged on to 7.07 m/s before the horizontal line kisses 50 J. The
track beside it makes each guess physical: at 5 m/s the ghost flag
sits at 2.5 m; at 7.07 m/s, 5.0 m.

**What accumulates.** Five flags on the curve; four shaded steps with
their areas; the two halfway markers (the wrong 5.0 and the right
7.07) both left standing, labelled. Ledger: *v*, *E*, *E gap from
previous flag*, *strip distance*.

**The failure state.** A "does it flatten?" lever extends the axes to
12 m/s: the student drags the bead past 10 hunting for the curve
easing off, and it reads 121, 144 — steeper still, with the caption
from the checked spec: *it never flattens*. The expectation fails,
not the rig.

**The prediction.** *Half of 100 J is 50 J. The speed that carries
50 J is…*
1. 5.0 m/s — half the top speed.
2. About 7.1 m/s. ✔
3. 2.5 m/s.
4. 50 J is off this curve.
Reveal: at 5.0 m/s the drop-line hits 25 J — halfway along is a
quarter of the way up. Energy halves at v/√2, not v/2.

**The misconception it confronts.** *"A curve that gets steeper must
eventually level off"* — the extension lever lets the student go look,
and it does not. *"Halfway along the speed axis is halfway up the
energy axis"* — the halfway hunt stages the error and leaves both
markers up as the trophy.

**Real numbers.** E = v² for the 2.0 kg trolley: flags at 2, 4, 6, 8,
10 m/s read 4, 16, 36, 64, 100 J; gaps 12, 20, 28, 36 J (the spec's
"that one step cost 28 J, seven whole first points" is the 6→8 gap).
Step-ruler strips from 0: 4, 12, 20, 28 J. Half energy at 10/√2 =
7.07 m/s. Strip distances E/10 m. Extension: 11 m/s → 121 J, 12 →
144 J.

---

### B1.5 — Applying kinetic energy to a collision scenario

**Subtopic.** B1.5 *Applying kinetic energy to a collision scenario*
(`g8b1-thirty-and-sixty`).

**The question.** The same car hits the same wall at 30 km/h and at
60 km/h. How many times worse is the second crash — twice?

**The scene.** The **Crash rig** dressed as a road-safety test house:
twin lanes into one instrumented wall, each lane carrying a 1 200 kg
car body (a proper car shell — bonnet, cabin, windscreen — over the
sled chassis) with a belted dummy. The wall's face on each lane is a
grid of *deformation cells*, each cell a 2 000 J honeycomb cube that
crushes and stays crushed, so the wall itself is the energy meter:
count the flattened cells. Lane L's speed is pinned at 30 km/h (a
sealed dial); lane R's dial is the student's (10–120 km/h, default
60). Each car has an energy bar over it (orange) and a *crash clock*
in ms. Both cars carry crush rulers along the bonnet: the front 0.5 m
is marked in cm. A g-meter on each dummy's chest with a red line at
30 g. Instrument column: *crash energy vs speed* graph accumulating
one point per lane per firing, and the ledger.

**What the student does.**
1. Fire both lanes together (one plunger).
- Run 1: R at 60 km/h.
- Run 2 (change R): 90 km/h.
- Run 3 (find "twice the crash"): the student hunts the R dial for
  the speed that flattens exactly *twice* lane L's cells — trying 60
  first is expected and wrong; closing in lands on ≈ 42 km/h.

**What they see happen.** Run 1: lane L folds its bonnet through
0.5 m and flattens 21 cells; the g-meter touches 7.1 g — firm but
green. Lane R at 60, *twice the speed on the same car*: 83 cells
flatten — a slab of wall four times as wide — the crush ruler
vanishes entirely, the g-meter slams to 28.3 g, brushing the red
line, and the cabin's windscreen crazes. The two walls stand side by
side afterwards: 21 crushed cubes against 83. Run 2 at 90: 188
cells, 63.7 g, deep into the red — the deformation reaches the cabin
firewall, the dummy's readout flags "not survivable", and the car is
written off on screen. Run 3 resolves the title: doubling the *crash*
needs only 42 km/h, and 60 km/h — "just double the town limit" — was
never twice the crash; it was four times.

**What accumulates.** The energy-vs-speed graph grows the student's
own steepening curve (41 667 J at 30 pinned every run; 166 667 at
60; 375 000 at 90; 83 333 found at 42); the walls keep their crushed
cells between runs as a bar chart made of wreckage. Ledger: *speed*,
*energy (J)*, *cells (≈ E/2 000)*, *crush force (kN)*, *peak g*,
*× the 30 km/h crash* — the last column reading 1.0, 4.0, 9.0, 2.0.

**The failure state.** Run 2's cabin intrusion: with only 0.5 m of
crush available, 375 000 J demands 750 kN and 63.7 g — past the 30 g
line the dummy's meter holds red, and the "not survivable" flag is
the rig telling the truth the campaign posters compress.

**The prediction.** *Lane L crushes 21 wall cells at 30 km/h. Lane R
at 60 km/h will crush about…*
1. 42 cells — twice the speed, twice the crash.
2. 63 cells.
3. 83 cells — four times. ✔
4. 21 cells — same car, same wall.
Reveal: count them: 83. Kinetic energy carries the square of the
speed, and the wall keeps the receipts.

**The misconception it confronts.** *"Twice the speed is twice as
dangerous"* — the two walls stand as a 1:4 monument, and run 3 pins
"twice as dangerous" to 42 km/h. *"A crash at any speed puts the
same load on the car"* — the g-meter spans 7.1 to 63.7 g across the
same car and wall.

**Real numbers.** v(m/s) = km/h ÷ 3.6. E = ½·1200·v²: 30 km/h →
41 667 J; 60 → 166 667 J; 90 → 375 000 J; 42.4 → 83 333 J. Cells ≈
E / 2 000 J: 21, 83, 188, 42. Average crush force = E / 0.5 m: 83,
333, 750, 167 kN. Deceleration = v²/(2·0.5·9.81): 7.1, 28.3, 63.7,
14.1 g; red line 30 g. ×-the-30-crash = (v/30)². Crush slider range
kept from spec (0.1–1.2 m) as an advanced control, default 0.5 m.

---

## Topic B2 — Potential energy in a system

B2.1 and B2.3 use the **Stand and drop rig** in its tall variant (the same
kit built 3.0 m high, cm scale up the column); B2.2 and B2.4 use the
**Spring bench**; B2.5 uses the **Pendulum**. The topic's shared
instrument is the two-colour energy bar pair — *store* (blue) and *motion*
(orange) — drawn beside every apparatus at the same joules-per-pixel
scale, so a store filled in one brief reads identically when it drains in
another.

### B2.1 — Gravitational potential energy

**Subtopic.** B2.1 *Gravitational potential energy*
(`g8b2-lift-it-and-hold`).

**The question.** Winding a mass up a stand is work. Where has that work
gone while the mass just hangs there — and can you get all of it back?

**The scene.** The tall Stand rig, side camera. Up the 3.0 m column runs
a cm scale; a *crank winch* is bolted to the column's foot, its cord
running over a top pulley down to a cradle holding a 1.2 kg mass (slabs
allow 2.4 kg). The crank handle is the student's: dragging it in circles
lifts the cradle 10 cm per turn, and the cord visibly bears the load —
a small inline tension gauge reads 11.77 N as it climbs. On the crank, a
*work meter*: a dial totting up force × distance as joules, ticking as
the handle turns. A ratchet pawl clicks every turn; release the handle
and the mass *stays*, the work meter frozen, the blue store bar beside
the column standing at the meter's figure. At the column's foot: a clay
landing bed and a light gate one bob-height above it. A release lever
trips the cradle. Instrument column: *stored energy vs height* graph
(one point per hold), the bar pair, ledger.

**What the student does.**
1. Crank the mass up, watching the work meter; stop at the target
   height; let go of the crank (the ratchet holds); *wait* — a held
   beat in which nothing moves and the blue bar just stands there.
2. Pull the release lever. The mass falls; the gate reads its arrival
   speed; the clay takes a crater.
- Run 1: 1.2 kg to 2.5 m.
- Run 2 (change the height): 1.2 kg to 1.25 m.
- Run 3 (change the mass): 2.4 kg to 2.5 m.

**What they see happen.** Cranking is priced: every full turn costs the
same effort and adds the same 1.18 J — the work meter climbs linearly,
21 turns to 2.5 m, 29.4 J. The held beat is the subtopic: effort has
stopped, nothing moves, and the energy is plainly *somewhere* — the
blue bar holds 29.4 J against the ratchet's pawl. On release, the blue
bar drains into orange exactly as the height scale unwinds; the gate
reads 7.00 m/s; the crater is measured by a depth probe. Run 2: half
the height, half the turns, half the store — and a gate reading of
4.95 m/s, not half of 7. Run 3: double mass doubles the tension gauge
(23.5 N), doubles the meter (58.9 J), doubles the crater — but the
gate reads the *same* 7.00 m/s: twice the energy arrived in twice the
mass.

**What accumulates.** Store-vs-height points forming two straight lines
through the origin — the 1.2 kg line and, after run 3, the first point
of a steeper 2.4 kg line; craters left in the clay row per run, depth
ordered by joules, not by speed. Ledger: *mass*, *height*, *turns*,
*work in (J)*, *store (J)*, *gate speed*, *speed² / 2g check (m)* —
the last column giving back the height every time.

**The failure state.** Crank 2.4 kg to the column's 3.0 m top and
release: 70.6 J bottoms the clay bed out — the probe hits the bench
through it, the bench dents, and the over-range flag says the meter
(the clay) has a floor. Separately, holding the crank *without*
engaging the ratchet and letting the handle slip: the mass runs back
down, spinning the crank backwards, and the work meter runs *down* to
zero — the store was never in the student's arm; it was in the lifted
arrangement, and lowering un-stores it.

**The prediction.** *Double the mass, same 2.5 m. The landing speed
will be…*
1. Twice — twice the energy.
2. The same 7.00 m/s. ✔
3. Less — heavier falls slower.
4. √2 times more.
Reveal: twice the joules landed in twice the kilograms. v = √(2gh) has
no mass in it; the crater, which counts joules, is what doubled.

**The misconception it confronts.** *"A heavy object stores more energy
however high it is"* — the 2.4 kg mass parked in its cradle at 0 cm
shows a blue bar at exactly 0 J beside run 2's lighter-but-lifted
14.7 J. *"Potential energy is something inside the
object itself"* — the work meter's backward run when lowering, and the
tension gauge showing the Earth pulling through the cord the whole
time, put the store in the lifted *pair*; B2.3 finishes the argument.

**Real numbers.** Weight = m·g: 11.77 N (1.2 kg), 23.5 N (2.4 kg).
Store = m·g·h: 29.43 J (1.2 × 9.81 × 2.5); per metre = m·g = 11.77 J.
Landing speed = √(2gh): 7.00 m/s from 2.5 m, 4.95 from 1.25 m — mass
absent. Fall time = √(2h/g): 0.714 s from 2.5 m. Crank: 10 cm/turn,
1.18 J/turn at 1.2 kg. Spec ranges kept: h 0–12 m and m 0.1–20 kg
exist as an off-bench "tower mode" toggle for the graph only.

---

### B2.2 — Elastic potential energy

**Subtopic.** B2.2 *Elastic potential energy* (`g8b2-stretch-and-store`).

**The question.** The first centimetre of stretch is nearly free and the
tenth is hard work. So what does *twice* the stretch store?

**The scene.** The **Spring bench**, side camera. A steel spring lies
horizontal, one end on a wall bracket, the other on a *draw handle*
with an inline force gauge (0–80 N); under the spring, a metre rule
marked in cm from the natural-length zero. The handle latches at any
extension. At the zero mark, a swivel dock holds a 50 g steel ball; a
*launch tube* rises from the dock — a clear vertical tube 4.0 m tall
with a height scale and a soft cap at the top. Beside the bench, the
force-vs-extension graph draws live as the handle moves, the area
under the line shading green (the elastic store); the green bar joins
the bar pair. A k-swap rack holds three springs: k = 60, 120 (default),
240 N/m, each visibly different in coil weight. Instrument column:
*height reached vs extension* graph and ledger.

**What the student does.**
1. Drag the handle out against the gauge; feel the line climb; latch.
2. Press the trigger: the spring fires the ball up the tube; a ring
   marker sticks at the peak height.
- Run 1: k = 120, pull to 9.0 cm.
- Run 2 (double the stretch): 18.0 cm.
- Run 3 (change the spring): k = 240, back to 9.0 cm.

**What they see happen.** Run 1: the gauge reads 10.8 N at latch; the
shaded triangle holds 0.49 J; the ball pops up to 0.99 m and falls
back. Run 2: the gauge reads 21.6 N — the *pull* doubled — but the
shaded triangle is four times the area (1.94 J), and the ball sails
to 3.96 m, kissing the top of the tube: double the stretch, four
times the height, on a scale the student squints up at. Run 3: the
stiff spring at the same 9 cm doubles the triangle's height but not
its base — 0.97 J, 1.98 m: stiffness doubles the store; stretch
squares it.

**What accumulates.** Peak rings left on the tube at 0.99, 3.96,
1.98 m; three shaded F-x triangles overlaid; height-vs-extension
points bending upward. Ledger: *k*, *x*, *pull at latch (N)*,
*store ½kx² (J)*, *launch speed*, *height*, *height ÷ run 1's*.

**The failure state.** Pull the default spring to 25 cm: 3.75 J wants
7.65 m and the tube has 4.0 — the ball cracks into the soft cap at
8.5 m/s, drops back, and the ledger splits the energy: "3.75 J
stored; 1.96 J of climb used; the rest returned to the cap and the
fall." The rig's range, found by exceeding it.

**The prediction.** *9 cm of stretch sent the ball to about 1 m.
18 cm will send it to about…*
1. 2 m — double the stretch, double the height.
2. 4 m. ✔
3. 1.4 m.
4. 8 m.
Reveal: the ring sits at 3.96 m. The store is the *area* of the F-x
triangle, and doubling both the base and the height of a triangle
quadruples it.

**The misconception it confronts.** *"Stretching twice as far stores
twice the energy"* — the tube answers vertically, 0.99 against
3.96 m. *"A stiff spring always stores more energy than a soft one"*
— a run 3 coda invites the soft k = 60 spring pulled to 25 cm
(1.88 J) against the stiff k = 240 at 9 cm (0.97 J): the soft spring
wins on screen, because x is squared and k is not.

**Real numbers.** Store = ½kx²; pull = kx. Defaults from the spec:
k = 120, x = 0.15 → 18 N and 1.35 J, launch √(2E/0.05) = 7.35 m/s,
height E/(0.05·9.81) = 2.75 m. Runs: (120, 0.09) → 0.486 J, 0.99 m;
(120, 0.18) → 1.944 J, 3.96 m; (240, 0.09) → 0.972 J, 1.98 m; (120,
0.25) → 3.75 J vs the tube's 1.96 J ceiling. Ranges kept: x 0–0.40 m,
k 20–400 N/m.

---

### B2.3 — Potential energy as a property of a system

**Subtopic.** B2.3 *Potential energy as a property of a system*
(`g8b2-whose-energy-is-it`).

**The question.** The label says "29 J stored". Stored *in what*? Can
you change the store without ever touching the mass?

**The scene.** The tall Stand rig rebuilt around a hole: the 1.2 kg
mass hangs from its clamp 1.0 m above a *platform* with a light gate
at platform level; the platform is a **trapdoor** — a hinged pair of
doors with a lever — and through it, 1.5 m further down, lies the
floor with a second light gate and the clay bed (total drop 2.5 m).
To the right, a second station: a clear tube holding two ring magnets
north-to-north, the upper one floating on repulsion; a plunger can
press it down, with a work meter and a gap scale in mm. To the left,
the third station: the 3.0 kg trolley from Unit B rolling at 1.5 m/s
in a small oval (its orange bar reading 3.4 J as it goes). The key
prop: **energy labels** — physical tags reading "… J stored" that the
student must pin somewhere. A tag pinned to a single object springs
off ("with respect to what?"); a tag *stretched* between two things
(mass↔platform, mass↔floor, magnet↔magnet) locks on as a bracket and
computes its own number. Instrument column: ledger and the bar pairs.

**What the student does.**
- Run 1 (doors shut): pin the bracket label mass↔platform (it reads
  11.8 J); release; the platform gate reads the arrival speed.
- Run 2 (doors open): reset the same mass to the same clamp; pull the
  trapdoor lever — *touching only the door* — and watch the bracket
  labels: mass↔platform still 11.8 J but greyed (nothing to land on);
  mass↔floor now live at 29.4 J. Release; the floor gate reads.
- Run 3 (the magnet gap): press the floating magnet down 3 cm against
  the plunger's work meter; latch; pin the bracket magnet↔magnet; then
  *remove the lower magnet* with tongs — the floater drops dead and
  every label attached to the pair evaporates.

**What they see happen.** Run 1: 4.43 m/s at the platform. Run 2: the
same object, same clamp, same height above the *bench* — and it
arrives at the floor gate at 7.00 m/s carrying 29.4 J. The extra
17.7 J was granted by a lever the mass never felt: the store was
never "in" the mass; it lives in the mass-and-where-it-can-fall
arrangement, and opening the doors changed the arrangement. Run 3
seals it: the magnet store visibly needs *both* magnets — take one
away and the number does not transfer to the survivor; it ceases to
exist.

**What accumulates.** The ledger's sorting question, answered by
test rather than by opinion — a column "*could you change the store
without touching it?*": trapdoor mass YES (the lever), magnet pair
YES (move the partner), rolling trolley NO (its 3.4 J of motion
cannot be altered except through the trolley itself). Bracket labels
remain pinned across the scene as the diagram the student built.

**The failure state.** The springing-off tag: every attempt to pin a
store on a lone object fails in the hand, including the seductive one
— pinning "29.4 J" on the mass itself while it hangs. The rig's
refusal *is* the content.

**The prediction.** *Same mass, same clamp. You open the trapdoor
underneath it, touching only the lever. The stored energy…*
1. Cannot change — nothing touched the mass.
2. Rises from 11.8 to 29.4 J: the arrangement changed. ✔
3. Falls to zero — the platform is gone.
4. Stays 11.8 J but the fall gets faster.
Reveal: the floor gate read 7.00 m/s = 29.4 J delivered. A store is a
fact about the mass *and* the Earth *and* what lies between; doors
count.

**The misconception it confronts.** *"Potential energy is stored
inside a single object"* — the tags will not stick to one. *"A
stationary object has no energy at all"* — the hanging mass's blue
bracket reads 29.4 J while its orange bar reads 0; the two bars name
different facts.

**Real numbers.** From the spec's checked set: clamped 1.2 kg at
2.5 m ↔ 29.4 J with the Earth; at 1.0 m ↔ 11.77 J; arrivals
√(2gh) = 4.43 and 7.00 m/s. Magnet pair: pressing 3 cm stores the
plunger meter's ~0.5 J in the gap (spec's squashed-spring analogue:
8 cm at k = 200 → 0.64 J is quoted on the station's plate). Trolley:
½ × 3.0 × 1.5² = 3.4 J, its own wherever it goes.

---

### B2.4 — Modeling potential energy as an arrangement changes

**Subtopic.** B2.4 *Modeling potential energy as an arrangement
changes* (`g8b2-ten-centimetres-more`).

**The question.** Four identical pulls, ten centimetres each. Why does
the fourth one cost seven times what the first did?

**The scene.** The **Spring bench** fitted with a *ratchet drawbar*:
the handle now moves in exact 10 cm clicks — drag, clunk, latch —
against the k = 150 N/m spring. Instruments per click: the inline
force gauge (reads the holding force at each latch: 15, 30, 45,
60 N), and a *click till* — a receipt printer that stamps one paper
slip per click with the work that click cost, the slips accumulating
on a spike in order. The F-x graph draws live, and each click's strip
of new area is shaded in its own tint, so the graph becomes four
bands of visibly growing area. A ghost meter runs alongside: the
*flat-price counter*, which believes every click costs what the first
one did and prints its own faded slips (0.75 J, 0.75 J, …) for
contrast. Instrument column: *store vs extension* curve accumulating
a point per click; ledger.

**What the student does.**
- Run 1: four clicks out, reading the gauge and collecting the four
  slips: 0.75, 2.25, 3.75, 5.25 J (the flat-price ghost printing its
  wrong 0.75s beside them).
- Run 2 (reverse it): four clicks *back*, one at a time — each click
  returns exactly its slip's joules to the drawbar (the till prints
  refunds in green), ending at zero.
- Run 3 (read the force story): out again, but pausing at each latch
  to pin the gauge reading onto the graph — 15, 30, 45, 60 N — and
  watch the strips' growth track the force they were pulled against.

**What they see happen.** The receipts disagree with the ghost from
click two onward, and by click four the spike holds 0.75 + 2.25 +
3.75 + 5.25 = 12.00 J against the ghost's 3.00 — a 4:1 gap printed on
paper. The graph shows why with no algebra: each strip is a trapezoid
whose left edge starts at the force the last click *ended* on; the
strips grow because the force grew, and the force grew because the
spring is further from its natural shape. The refunds of run 2 make
the store's bookkeeping exact in both directions.

**What accumulates.** The slip spike (the odd-number-spaced costs),
the four-band graph, the store-vs-extension points curving upward
(0.75, 3.00, 6.75, 12.00 J), and a ledger column *cost of this click
÷ cost of click 1* reading 1, 3, 5, 7.

**The failure state.** Yank the drawbar past the fourth latch toward
a fifth (0.50 m): the pawl slips at 0.45 m — the spring snaps back
along the bench, the drawbar cracks against the zero stop, all
12-plus joules land in one bang and shiver, and the till prints a
single red slip: "returned: everything, at once." Storage is
reversible; the *rate* of return is a design decision, as Unit A's
crash briefs said from the other side.

**The prediction.** *Click one cost 0.75 J. Click four will cost…*
1. 0.75 J — same distance, same price.
2. 3.00 J.
3. 5.25 J — you are pulling against 45 N before it even starts. ✔
4. 12.00 J.
Reveal: the slip says 5.25 J. Equal distances are not equal work when
the force you pull against has been growing the whole way.

**The misconception it confronts.** *"Each equal pull adds the same
energy to the spring"* — the flat-price ghost is that belief given a
meter, and it is 9 J short by click four. *"The force needed stays
the same as a spring is stretched"* — the gauge is read aloud at
every latch: 15, 30, 45, 60 N.

**Real numbers.** k = 150 N/m. Holding force at latches: kx = 15,
30, 45, 60 N. Store at latches: ½kx² = 0.75, 3.00, 6.75, 12.00 J.
Click costs (differences): 0.75, 2.25, 3.75, 5.25 J — each 1.50 J
more than the last; cost of click n = ½k(x_n² − x_{n−1}²) =
15x + 0.75 J. Ratios to click one: 1, 3, 5, 7.

---

### B2.5 — Potential and kinetic energy trading off

**Subtopic.** B2.5 *Potential and kinetic energy trading off*
(`g8b2-swing-and-trade`).

**The question.** Nothing pushes a pendulum downhill and nothing hauls
it back up. What exactly is being traded, and does the total ever
change?

**The scene.** The **Pendulum**: a 2.0 kg brass bob on a 1.8 m string
from a beam, side camera framing the full swing. At the pivot, a
large protractor with a drag-to-set release finger; behind the swing,
a faint height grid with its zero at the bob's lowest point; at the
bottom of the arc, a light gate. The bob leaves a *speed-tinted
trail* (deep blue when slow, hot orange at the bottom) that fades
over a few swings. Beside the rig, the topic's bar pair at full
size: blue store and orange motion, with a black *total* tick at
10.34 J that never moves. A clamp-on *peg* can be fixed to the beam's
post 0.9 m below the pivot, in the string's path. Force-arrow toggle:
shows only the two real forces on the bob (string tension, weight).
Instrument column: *store and motion vs time* graph (two braided
lines) and the ledger.

**What the student does.**
1. Drag the bob up to an angle on the protractor's finger; let go.
2. Watch three swings; read the gate each pass.
- Run 1: release at 45°.
- Run 2 (change the release): 30°.
- Run 3 (change the path, not the energy): 45° again, with the peg
  clamped in — the string catches it at the bottom and the bob whips
  round a tighter arc on the far side.

**What they see happen.** Run 1: the bob is 0.527 m up the height
grid holding 10.34 J of blue and none of orange; as it falls the two
bars pour one into the other — passing 30° the split is 4.73/5.61,
at the bottom 0/10.34 and the gate stamps 3.22 m/s — and the far
side rebuilds the blue to a whisker under 45°. The braided graph
shows two lines crossing and re-crossing while their sum rides the
black tick like a rail. Run 2: a shallower version — bottom speed
2.17 m/s, total parked at 4.73 J — the trade scales with the
release, the totals differ, the *rule* does not. Run 3 is the
showpiece: the string snags the peg at the bottom, the arc tightens,
the far-side path is completely different — and the bob climbs to
*the same height* as run 1's, 0.527 m on the grid, a wider angle on
a shorter string. The grid, not the protractor, is what the energy
answers to.

**What accumulates.** Gate stamps per pass (3.22, 3.22, 3.21… the
slow leak visible in the third decimal); braided graphs for each
release; run 3's two different arcs peaking on one height line,
drawn over each other. Ledger: *release angle*, *height (m)*,
*total (J)*, *bottom speed predicted √(2gh)*, *bottom speed
measured*, *far-side height*.

**The failure state.** Left swinging for 60 s, the envelope decays:
each far side loses a few millijoules to the air and the pivot (the
trail's fade made quantitative — the braided sum drifts a hair's
width below the black tick, flagged "leaking to the room: it never
comes back"). And releasing above 80° with a slack-string warning:
the string goes slack at the top of the far swing, the bob falls
inside the arc for a beat — a real pendulum's real limit.

**The prediction.** *The peg catches the string at the bottom, so
the far-side arc is short and steep. The bob will rise to…*
1. The same 45° angle it left from.
2. The same height it left from, at a wider angle. ✔
3. Half the height — the peg took half.
4. Higher — the tighter circle slings it up.
Reveal: run 1 and run 3 peak on the same grid line, 0.527 m. The
trade is heights for speeds; angles and arcs are just the route.

**The misconception it confronts.** *"The pendulum gains energy as
it speeds up"* — the braided sum never leaves the black tick while
speed comes and goes. *"The bob is pushed downwards by something as
it swings"* — the force toggle shows exactly two arrows, tension
and weight, and nowhere a pusher; the speeding-up is the blue bar's
spending, not a third force's shove.

**Real numbers.** L = 1.8 m, m = 2.0 kg. Release 45°: drop
h = L(1 − cos 45°) = 0.527 m; total = mgh = 10.34 J; bottom speed
√(2gh) = 3.22 m/s (mass cancels); period (small-angle) 2π√(L/g) =
2.69 s. At 30° on the way down from 45°: store 4.73 J, motion
5.61 J, speed 2.37 m/s — still summing 10.34. Release 30°: h =
0.241 m, total 4.73 J, bottom 2.17 m/s. Peg at 0.9 m: far-side
radius 0.9 m, same 0.527 m rise → far angle cos⁻¹(1 − 0.527/0.9) ≈
65°. Leak per swing: a few mJ (spec: air and pivot warmth, gone for
good).

---

## Topic B3 — Energy transfer in a collision

B3.1 runs on the **Energy track** (level section, no ramp); B3.2 and B3.5
on the **Stand and drop rig** family; B3.3 and B3.4 on the **Crash rig**.
The topic's shared instrument is the *collision ledger* — a two-column
tally, momentum and kinetic energy, before and after every collision,
with the momentum column always balancing and the energy column made to
say where the difference went.

### B3.1 — Energy converted, not lost

**Subtopic.** B3.1 *Energy converted, not lost* (`g8b3-two-carts-one-click`).

**The question.** One trolley rolls in with 2.00 J. After the click, the
pair rolls away with 1.00 J. Half the energy is missing — where is it?

**The scene.** The Energy track's level 4.5 m section, side camera.
Trolley A (1.0 kg, hook-and-loop pad on its nose) is launched by the
calibrated plunger at exactly 2.0 m/s; trolley B (1.0 kg, matching pad)
stands at rest at the 2.0 m mark. Light gates at 1.0 m (before) and
3.0 m (after). Over each trolley, its orange energy bar and a small
momentum arrow (grey, distinct from the velocity arrow, labelled in
kg·m/s). At the top, the collision ledger. The hero instrument: the
*click magnifier* — after any collision a replay window opens at 1/100
speed and 20× zoom on the pads, showing the thousands of tiny hooks
bending, catching and shivering, with a thermal tint blooming across
both pads and a single sound-wave ring leaving the click. Instrument
column: the ledger, bars, and a *where-did-it-go* stack (thermal,
sound, pad deformation) that fills to exactly the missing amount.

**What the student does.**
1. Launch A. Read the before-gate. Watch the click. Read the
   after-gate. Open the magnifier and scrub the replay.
- Run 1: A at 2.0 m/s into B (1.0 kg), stick.
- Run 2 (change the target's mass): B loaded to 2.0 kg? — the student
  stacks a slab on B and relaunches.
- Run 3 (change the speed): B back to 1.0 kg, A launched at 4.0 m/s.

**What they see happen.** Run 1: A crosses the first metre in half a
second; the click; the pair crawls on at exactly half the approach
speed — the second half of the journey visibly takes twice as long.
The ledger fills: momentum 2.0 before, 2.0 after; energy 2.00 before,
1.00 after, and the where-did-it-go stack rises to 1.00 J: bent hooks,
one click of sound, two slightly warm pads in the magnifier. Run 2:
the heavier target crawls away at 0.67 m/s; momentum still balances
(2.0 = 3.0 × 0.667); the energy row keeps only 0.67 J — a *third*
kept this time, so the "half" of run 1 was a fact about equal masses,
not a law. Run 3: everything scales — 8.00 J in, 4.00 J kept, the
stack takes 4.00 — and the *fraction* for the equal pair returns to
exactly half.

**What accumulates.** Three ledger rows in which the momentum columns
balance to the digit every time and the energy columns never do; the
stack's receipts matching the deficit every time; gate stamps proving
the half-speed crawl. A final ledger line totals each run: "moving +
converted = arrived", exact.

**The failure state.** A "recover it" button on the pads invites the
student to un-click the trolleys and get the joule back: the pair is
pulled apart by tongs, the hooks un-bend audibly — and the meters
show the separation *costing* work, not refunding any. The joule in
the warm pads and the spent sound ring never reassembles. The button
exists to fail.

**The prediction.** *A arrives at 2.0 m/s and sticks to an identical
B. The pair moves off at…*
1. 2.0 m/s — the energy carries on.
2. 1.41 m/s — the energy is shared.
3. 1.0 m/s — the momentum is shared. ✔
4. 0 — the crash stops them.
Reveal: 2.0 kg·m/s spread over 2.0 kg can only be 1.0 m/s. Momentum
set the speed; the energy books then closed at half, and the pads,
the click and the warmth are the other half, itemised.

**The misconception it confronts.** *"Energy is destroyed in a
collision"* — the stack fills to the deficit, receipt by receipt, in
the magnifier's own imagery. *"Momentum and kinetic energy are the
same thing"* — two columns, same table, same events: one balances,
one does not, three runs running.

**Real numbers.** Equal pair: 1.0 kg at 2.0 m/s → momentum 2.0
kg·m/s, KE 2.00 J; after sticking v = 1.00 m/s, KE 1.00 J: exactly
half converted, for any equal sticking pair. Loaded target: v′ =
2.0/3.0 = 0.667 m/s, KE′ = 0.667 J (2/3 converted). Doubled speed:
4 m/s → 8.00 J in, 4.00 J kept. Converted share for mass ratio
m₂/m₁ hitting a stationary target = m₂/(m₁+m₂).

---

### B3.2 — Elastic vs inelastic collisions

**Subtopic.** B3.2 *Elastic vs inelastic collisions*
(`g8b3-steel-and-clay`).

**The question.** Two balls, the same mass, the same drop, the same
0.49 J on arrival. Why does one come back to your hand and the other
just lie there?

**The scene.** The **Stand and drop rig** doubled: two clear drop
columns side by side over one massive steel anvil, each with a metre
scale, an electromagnet release at the top (heights ganged to one
clamp, 0.2–3.0 m), and a *peak ring* that slides up each column to
latch at the highest rebound point. Column L: a 50 g hardened steel
bearing. Column R: a 50 g ball of modelling clay. Each ball leaves a
strobe trail (a dotted fall-and-rise history that persists per run).
A dashed *release line* is drawn across both columns at the drop
height. Below each column, the energy bar pair plus a brown
*deformation* bar; a thermal tint on ball and anvil. A material dial
on column L morphs its ball (steel e = 0.95, superball 0.89, wood
0.60, …) — column R's clay is fixed at its measured e = 0.14 and
says so on a brass plate. Instrument column: *rebound height vs drop
height* graph (a line per material) and the ledger.

**What the student does.**
1. Set the shared height. Release both at once (one switch). Watch
   the falls, the strikes, the rebounds; log the peak rings.
- Run 1: 1.00 m, steel vs clay.
- Run 2 (change the height): 2.00 m.
- Run 3 (change the material): dial L to superball, 1.00 m.

**What they see happen.** Both balls fall identically — the strobe
dots match all the way down, arriving together at 4.43 m/s: the drop
is fair and seen to be. Then the anvil: the steel bearing rings and
climbs back to 0.90 m — its trail nearly retraces itself — while the
clay lands with a dead *thud*, flattens visibly into a mound, and
its rebound is a 2 cm hop the peak ring barely registers. The bars:
steel keeps 90 % as motion, a sliver to sound and warmth; clay keeps
2 %, its brown deformation bar taking nearly everything, its shape
change permanent — tongs offered mid-scene fail to re-round it.
Run 2: both rebounds scale in proportion (1.80 m and 0.04 m): the
*ratio* is the material's, not the drop's. Run 3: the superball
tops out at 0.79 m — bouncy, and measurably not elastic.

**What accumulates.** Peak rings latched per run; per-material lines
building on rebound-vs-drop, each straight through the origin with
slope e²; the ledger of *material*, *drop*, *arrival energy*,
*rebound height*, *% kept (= e² × 100)*, *where the rest went* —
steel's "rest" split into ring-tone and warmth, clay's into shape.

**The failure state.** The dashed release line is a boundary nothing
crosses: every rebound, every material, every height latches its
ring *below* the line. A "beat the line" challenge invites the
student to find any setting that returns a ball above where it was
dropped from; the challenge is unwinnable and says why when
conceded — a rebound above the line would be energy from nowhere
(B4.5 will meet a claim that pretends otherwise).

**The prediction.** *Same mass, same 1.00 m drop, same 0.49 J
arriving. The clay's rebound will be…*
1. About 0.90 m, like the steel — energy is energy.
2. About half the steel's.
3. A couple of centimetres: nearly everything went into its new
   shape. ✔
4. Zero exactly — clay cannot bounce.
Reveal: the peak ring sits at 2 cm. The collision kept e² = 2 % as
motion; the mound on the anvil *is* the other 98 %, plus a little
warmth the tint shows.

**The misconception it confronts.** *"An elastic collision is one
where something stretches"* — the steel, which visibly deforms
least, is the most elastic thing on the bench; elastic names what
happens to the *kinetic energy*, not to the shape. *"The clay ball
lost its energy, and the steel ball did not use any"* — both bars
account to the same 0.49 J: the steel spent a tenth (ring, warmth),
the clay banked nearly all of it as shape and heat; nobody lost
anything.

**Real numbers.** Arrival: v = √(2gh) = 4.43 m/s from 1.00 m;
E = mgh = 0.050 × 9.81 × 1.00 = 0.4905 J. Rebound height = h·e²;
energy kept = E·e². Steel e = 0.95 → 0.90 m, 90.3 %; clay e = 0.14
→ 0.02 m, 2.0 %; superball e = 0.89 → 0.79 m, 79 %. Ranges: h
0.2–3.0 m, e dial 0.05–0.98.

---

### B3.3 — Tracing energy through a crash

**Subtopic.** B3.3 *Tracing energy through a crash*
(`g8b3-through-the-crash`).

**The question.** 137 200 J arrive at a wall in a tenth of a second.
Trace every joule — and find which few thousand of them are the ones
that decide whether the driver walks away.

**The scene.** The **Crash rig** at full length with a complete
cutaway car: bumper and thin-walled *crash boxes*, a 0.60 m crumple
zone (engine bay drawn as folding structure), a rigid cabin cell, a
70 kg driver on a seat with a working belt (toggle: worn / off), a
dashboard 0.06 m of padding away from an unbelted driver's chest,
and an airbag module (toggle) adding 0.15 m of ride-down. The car
arrives at 14 m/s (50 km/h). Overhead, the hero instrument: the
*energy river* — a 137 200 J ribbon flowing with the car that, at
the wall, divides in real time into named channels (crash boxes,
crumple zone, cabin's residual motion, driver's share), each channel
gauged in joules and kN as it takes its cut. G-meters on the cabin
and on the driver's chest, red-lined at 30 g. Millisecond clock;
1/100 replay scrubber. Instrument column: the river's final
accounting and the ledger.

**What the student does.**
1. Configure the driver (belt on/off, airbag on/off). Fire. Scrub
   the replay along the ms clock, reading each channel as it fills.
- Run 1: belt on, airbag on.
- Run 2 (remove one protection): belt off, airbag on (it cannot
  save an unbelted driver and the run shows why).
- Run 3 (stiffen the car): a chassis swap lever replaces the 0.60 m
  crumple zone with 0.15 m of "performance" bracing; belt and
  airbag on.

**What they see happen.** Run 1, scrubbed: first the crash boxes
fold (the first few cm and joules); then the crumple zone spends
90 ms folding through 0.60 m at 229 kN while the cabin's g-meter
reads 16.6 g; the driver, belted, rides the cabin's own slow-down
stretched to 0.75 m by belt give and airbag — chest gauge 9.1 kN,
13.3 g, green. The river ends fully spent: torn steel, warm metal,
the bang — every channel labelled, nothing missing. Run 2: the car's
side of the crash is identical — same crumple, same 16.6 g cabin —
but the driver's channel now runs level at 14 m/s *across the
cabin* while everything slows around them, then spends its whole
6 860 J against 0.06 m of dashboard: 114 kN, 166 g, the chest gauge
pinned in red and the airbag flag reading "fired too late to
matter". Run 3: the stiff car stops in a quarter of the distance —
the cabin's own meter hits 66 g, and even the belted driver's
channel reads over the line: the car survives looking straighter,
the person does not.

**What accumulates.** Three river accountings pinned side by side —
same 137 200 J total each time, radically different splits; the
ledger of *configuration*, *cabin g*, *driver ride-down (m)*,
*driver peak force*, *driver g*, *verdict against 30 g*. The
constant total over three catastrophically different outcomes is
the topic's thesis in one table.

**The failure state.** Runs 2 and 3 are the failure states, played
honestly: the unbelted dash-strike and the rigid-car cabin, both
crossing the red line with the numbers that say so.

**The prediction.** *The belt is off. The car's crumple zone works
perfectly anyway. The driver's stop happens over…*
1. The same 0.75 m as before — the car does the stopping.
2. 0.60 m — the crumple zone's length.
3. 0.06 m of dashboard, at about twelve times the force. ✔
4. It never happens — the airbag catches them.
Reveal: a crumple zone can only slow what is attached to it. The
belt is the attachment; without it the driver keeps 14 m/s until
the dashboard, and 6 860 J over 0.06 m is 114 kN.

**The misconception it confronts.** *"A stiff car is a safe car"* —
run 3's straighter wreck and worse chest numbers, side by side with
run 1. *"A seatbelt works by holding you still"* — the replay shows
the belt *moving* the driver, riding them down the same 90 ms curve
as the cabin, stretched a little longer; holding still is exactly
what the dashboard does, and the dashboard reads 166 g.

**Real numbers.** 1 400 kg at 14 m/s: ½·1400·14² = 137 200 J,
~0.1 s to spend it. Crumple 0.60 m → average 137 200/0.60 =
229 kN; cabin deceleration 14²/(2·0.60) = 163 m/s² = 16.6 g.
Belted driver: 70 kg, 6 860 J over ≈ 0.75 m (crush + belt stretch
+ airbag) → 9 100 N, 13.3 g. Unbelted: 6 860 J over 0.06 m →
114 000 N, 166 g. Stiff swap: 0.15 m → cabin 66.6 g; belted driver
ride-down collapses to ≈ 0.30 m → 22.9 kN, 33 g, over the line.

---

### B3.4 — Safety design and energy conversion

**Subtopic.** B3.4 *Safety design and energy conversion*
(`g8b3-buy-yourself-a-metre`).

**The question.** You cannot make the crash smaller. Can you make it
*longer* — and how many metres does a survivable crash cost?

**The scene.** The **Crash rig**, one lane: a 70 kg instrumented
sled (no car body — the physics bare) arriving at 14 m/s at a
barrier whose face carries the *crush caddy*: a stack of
uniform-crush cartridges the student drags to any depth from 0.05
to 1.20 m, a metre scale beneath. Above the barrier, this brief's
twin dials, mounted together on one bracket: the **energy dial**,
frozen at 6 860 J with its needle painted on (a plaque: "not
adjustable — this is what arriving at 14 m/s means"), and the
**g-meter**, live, with a red *injury line at 30 g*. Force gauge on
the barrier in kN; ms clock; thermal tint on the crushed
cartridges. Instrument column: *deceleration (g) vs crush distance
(m)* graph accumulating the student's points on a drawn 30 g rule,
and the ledger.

**What the student does.**
1. Drag the caddy to a depth. Fire. Read the g-meter's peak-hold,
   the force gauge, the clock.
- Run 1: 0.60 m.
- Run 2 (starve it): 0.05 m.
- Run 3 (spend big): 1.20 m.
- Then the design question, put by the rig: "find the *least*
  crush that stays under 30 g" — the student closes in by halves:
  0.30 m reads 33 g (just over), 0.35 m reads 28.6 g (under).

**What they see happen.** Run 1: 86 ms of steady crushing, 11.4 kN,
16.6 g — under the line with room. Run 2: the same 6 860 J spent
in 7 ms — 137 kN, 200 g, the sled's frame drums and the g-needle
wraps deep into the red; the cartridges are a scorched wafer.
Run 3: 171 ms of the gentlest stop on the rig, 5.7 kN, 8.3 g.
Every run, the frozen energy dial has not moved and the thermal
tint totals the same joules — only the *metres* differ, and the
g-meter answers the metres alone. The closing-in exercise turns
the hyperbola into a design act: survivability costs 0.35 m, and
every centimetre under that is paid in g.

**What accumulates.** The student's points tracing their own
hyperbola over the 30 g rule, with the found crossing at ≈ 0.33 m
marked; the ledger of *crush*, *stop time*, *force*, *g*, *under /
over the line*; the row of spent cartridge stacks left standing in
the scene, depth-ordered, all equally warm.

**The failure state.** Run 2's 200 g wafer — and, at the other
end, a caddy over-drag past 1.20 m hits the rail's end bracket:
the rig cannot buy more than 1.2 m in this lane, which is the
constraint a real car's bonnet length imposes and the reason A6
existed.

**The prediction.** *Halve the crush distance from 0.60 to
0.30 m. The deceleration will…*
1. Halve — less crushing, less violence.
2. Stay 16.6 g — the energy is unchanged.
3. Double to about 33 g, crossing the injury line. ✔
4. Quadruple.
Reveal: same joules over half the metres is twice the force, and
the g-meter read 33. The energy dial never moved; only the
distance was yours.

**The misconception it confronts.** *"Padding removes energy from
a crash"* — the frozen dial and the constant thermal total show
nothing removed, ever; padding only *stretches the spending*.
*"A stronger, stiffer structure protects people better"* — the
stiffest setting on the bench (0.05 m) posts the worst number on
the g-meter by a factor of twelve.

**Real numbers.** E = ½·70·14² = 6 860 J, fixed. Average force
= E/d: 0.05 m → 137 kN; 0.35 m → 19.6 kN; 0.60 m → 11.4 kN;
1.20 m → 5.7 kN. Deceleration = v²/(2d): 200 g, 28.6 g, 16.6 g,
8.3 g; injury line 30 g crosses at d = 14²/(2·30·9.81) = 0.333 m.
Stop time = 2d/v: 7, 50, 86, 171 ms. Ranges kept: crush 0.05–1.2 m,
speed dial 2–20 m/s available for the measure phase.

---

### B3.5 — Comparing energy conversion across two collisions

**Subtopic.** B3.5 *Comparing energy conversion across two
collisions* (`g8b3-kept-or-converted`).

**The question.** Six collisions, from a superball to a smashed
test tube. Measured fairly, what fraction of the motion survives
each one — and what evidence gives the answer away before the
meter does?

**The scene.** The *collision carousel*: a rotating hexagonal
bench that swings each of six stations into the one instrumented
test bay. The bay's fixed instruments: an in/out speed gate pair,
a peak-height ring on a drop column, a microphone whose waveform
draws in the corner, a thermal probe, and the *kept-fraction
meter* — a big dial 0–100 % that computes (speed out / speed in)²
or (height out / height in). The six stations, each with its own
apparatus: ① rubber superball over concrete; ② two steel bearings
on a twin pendulum cradle that click together; ③ a sealed chamber
of nitrogen molecules (magnified view) where two molecules meet;
④ a putty ball over the same concrete; ⑤ two railway wagons on a
short track, one rolled at the other, couplers ready; ⑥ a test
tube held over a tiled floor, with a rack of spare tubes and a
"broken: n" counter. A shelf above the bay holds six empty tile
slots on a 0–100 % rail, waiting for measured results. Instrument
column: the tiles, waveforms and ledger.

**What the student does.** Rotate the carousel, run each station,
and let its measured tile snap onto the shelf's percentage rail:
drop the superball (ring at 0.80 m → 80 %); swing one bearing
into the other (the struck one flies out at 95 % of the arriving
speed → 90 % kept); watch the molecular pair meet and part (gates
read identical speeds → 100 %); drop the putty (no ring at all →
≈ 0 %); roll a wagon at its twin (couple, and the pair leaves at
half speed → 50 %); release the tube (it breaks — 0 %, and the
counter ticks). Then the sort: slide the divider on the rail to
split the tiles into "motion mostly survives" and "mostly
converted" — the tiles have already arranged themselves; the
divider's natural gap sits between 50 % and 80 %.

**What they see happen.** Each station pairs its number with its
evidence: the superball's tall ring against the putty's absent
one; the bearings' sharp *click* on the microphone — a spike of
spent per cent — against the wagons' long clang at 50 %; the
molecules' silent, dent-free 100 % (the one collision with
nowhere for energy to hide); the tube's crack and scatter, its
waveform ragged, its warmth immeasurable, its shape
unrecoverable. The putty and tube both read ≈ 0 by wholly
different receipts: warmth-and-shape versus new surfaces and
flying fragments.

**What accumulates.** Six measured tiles standing on the
percentage rail in the student's own order; six waveforms; the
ledger of *station*, *evidence used (height / speed / both)*,
*% kept*, *loudest?*, *permanent shape change?* — the last two
columns deliberately failing to sort the tiles on their own.

**The failure state.** The test tube: a one-shot collision — no
rerun, only a fresh tube and an honest counter. And station ③'s
challenge button ("make the molecules keep less than 100 %")
concedes: molecules have no dents to take and no warmth of their
own to gain; perfect elasticity exists, and only down there.

**The prediction.** *The wagons couple with a deafening clang;
the putty lands almost silently. Which converts the larger
fraction of its motion?*
1. The wagons — you can hear the energy leaving.
2. The putty: quiet, but nearly 100 % converted. ✔
3. Equal — clang and thud are the same joules.
4. Neither converts anything.
Reveal: the meter read 50 % for the wagons, ≈ 0 % kept for the
putty. Loudness is *a* leak, not *the* ledger; most of the
putty's energy left as shape and warmth, which make no sound.

**The misconception it confronts.** *"Any collision with a
bounce is perfectly elastic"* — the superball's own tile reads
80, and nothing on the rail but the molecules reads 100. *"A
quiet collision converts as much energy as a loud one"* — the
prediction question is built on its refutation, with the
microphone's evidence honestly useful and honestly
insufficient.

**Real numbers.** Kept fraction = e² (speeds) or h′/h (heights).
Superball on concrete: rebound 0.80 m from 1.00 m → 80 %. Steel
bearings: e ≈ 0.95 → 90 %. N₂ pair: 100 % (no internal store to
take it). Putty: e ≈ 0.03 → ≈ 0 %, permanent flattening. Equal
wagons coupling: kept = ½ exactly (momentum shared, B3.1's law).
Test tube: 0 % — energy into new glass surfaces, fragments and
the crack.

---

## Topic B4 — Energy conservation across a system

The topic's own instrument, built once: the **boundary box** — a resizable
rectangle the student drags around any part of a scene, with a live meter
reading "inside the box: … J". Only energy inside counts; energy crossing
the edge is flagged at the crossing point. B4.1 introduces it on the
bench; B4.2 scales it to a valley; B4.3 zooms it into a bike wheel; B4.4
runs it over a bouncing ball; B4.5 hands it to the student as an audit
tool.

### B4.1 — Energy is conserved

**Subtopic.** B4.1 *Energy is conserved* (`g8b4-close-the-box`).

**The question.** A trolley is launched with 5.00 J and coasts to a stop.
Its energy meter reads zero. Draw a box around enough of the world that
nothing has gone missing.

**The scene.** A 5 m carpet runner on the lab floor, side camera. At the
left, a spring launcher (its coil visibly compressed, a plaque: "holding
5.00 J"); on the runner, a 2.5 kg trolley with hard wheels; along the
runner, metre marks. The air is drawn — faint drifting motes that swirl
when the trolley passes. Thermal view toggle: the wheels and the carpet
track behind them warm faintly as it rolls; the launcher's coil, the
axle bearings, everything has a temperature. Overlaid on it all, the
**boundary box**: drag its corners anywhere; its meter totals every
energy form inside (motion, spring store, thermal above ambient, sound
in flight) and its edges spark wherever energy is crossing them.
Instrument column: *"inside the box" vs time* graph, one line per box
choice, plus the ledger.

**What the student does.**
1. Draw a box. Press the launcher's trigger. Watch the meter and its
   line for the 4-odd seconds of the roll and beyond.
- Run 1 (box = trolley only): a tight box that travels with the
  trolley.
- Run 2 (grow it): box around trolley + the whole carpet runner + the
  air above it — but the launcher left outside.
- Run 3 (close it properly): the box takes in the launcher too, wall
  to wall.

**What they see happen.** Run 1: the meter starts at 0 (the spring's
joules are outside), jumps to 5.00 as the launch crosses the edge —
the entry sparked and flagged "+5.00 J in" — then *falls* all the way
back to 0 over 4.08 m of coasting, the edges sparking continuously at
the wheels: energy is streaming out of a box that holds only the
trolley. The line on the graph is a rise and a long sag. Run 2: the
launch still arrives as a +5.00 J crossing, but after that the line
runs *flat*: the 4.90 J the carpet and wheels take, and the 0.10 J
the air takes, are all still inside — the thermal view shows exactly
where, a warm 4-metre stripe and two warm axles. Run 3: the line is
flat at 5.00 J from before the trigger to after the stop: first in
the coil, then split between motion and a growing thermal residue,
finally all residue — one horizontal line, no crossings, nothing
made, nothing lost.

**What accumulates.** Three "inside the box" lines: a sag, a
step-then-flat, and a dead-flat — the same event, three boundaries.
The ledger itemises run 3's final 5.00 J: carpet and wheel flex
≈ 4.88 J, axle bearings a share of it, air 0.10 J, sound well under
a millijoule — quoting the checked audit.

**The failure state.** The sagging line of run 1 is the failure, named
at its cause: a boundary that cuts through the story. A "find the
leak" pointer invites the student to click the sparking edge; it
zooms to the wheel-carpet contact where the joules are leaving as
warmth.

**The prediction.** *The trolley has stopped. The 5.00 J is…*
1. Used up — moving took effort.
2. Destroyed by friction.
3. All still there, as warmth spread through carpet, wheels and air. ✔
4. Back in the spring.
Reveal: run 3's line never left 5.00. Warm the box's contents by what
the thermal view shows and the books close to the joule.

**The misconception it confronts.** *"The trolley used up its
energy"* and *"Friction destroys energy"* — destruction would look
like run 3's line falling, and it never falls; only badly drawn boxes
sag, and the sag always matches a sparking edge you can go and
inspect.

**Real numbers.** Launch: ½ × 2.5 × 2.0² = 5.00 J. Rolling
resistance ≈ 0.05 × 2.5 × 9.81 = 1.23 N; travel = 5.00/1.23 =
4.08 m; coast time ≈ 4.1 s. Air drag ½ × 1.225 × 0.01 × 1.0 × 2.0²
≈ 0.025 N → ≈ 0.10 J over the run. Sound < 1 mJ. Stepped: v decays
under 1.23 N; thermal deposition per tick = F·v dt, laid along the
contact patch.

---

### B4.2 — Tracking energy through a multi-step system

**Subtopic.** B4.2 *Tracking energy through a multi-step system*
(`g8b4-water-to-wall-socket`).

**The question.** Forty-nine megawatts of falling water enter the top
of the mountain. Thirty-nine and a half come out of the wall sockets
in town. Track the journey step by step — and find the missing 9.6 MW
*somewhere*, because they did not vanish.

**The scene.** A valley in cutaway, three-quarter camera: a reservoir
50 m above a turbine hall; the *intake gate* (a wheel the student
turns, flow 0–100 m³/s, with a gauge in m³/s); the penstock running
down the rock; a Francis turbine spinning in the hall; the generator
on its shaft; a transformer yard; 400 kV lines marching to a town of
lit windows (a counter: "homes supplied at 1.2 kW: …"). Through it
all flows the hero instrument: the *power ribbon* — a broad band,
49.05 MW wide at the top, that visibly narrows at each stage as a
thin red-warm wisp peels off into the surroundings, each wisp
labelled in MW and each peel-point instrumented with a clip-on
*thermal probe* socket. The boundary box is available at valley
scale. Instrument column: a stage table (in / out / kept %) filling
as the probes go in, and the ledger.

**What the student does.**
1. Spin the gate to 100 m³/s. Watch the ribbon establish.
2. Clip the thermal probe onto each peel-point in turn: penstock
   wall, draft-tube water, generator hall air, transformer and line.
- Run 1: full flow, all four probes placed, the table completed.
- Run 2 (change the flow): 50 m³/s, table again.
- Run 3 (spend one upgrade): a workshop offers ONE improvement —
  penstock relined (95 → 98 %) or turbine re-bladed (92 → 95 %);
  the student picks, the crew installs it, and the run measures
  what the town actually gained.

**What they see happen.** Run 1: the ribbon narrows 49.05 → 46.60 →
42.87 → 42.01 → 39.49 MW, and each probe finds the peeled wisp *as
heat where it went*: the penstock wall a fraction of a degree warm
along its length; the draft-tube water stirred and warmed by 3.7 MW;
the generator hall needing its fans (0.86 MW of warm air); the lines
faintly warm across the valley (2.52 MW). The town counter reads
32 900 homes. Nothing labelled "lost" — every wisp is followed to a
warm somewhere. Run 2: half the water, half the ribbon everywhere
(24.5 in, 19.75 out), but the *kept %* column unchanged: efficiency
is the plant's shape, not its throughput. Run 3: either upgrade
widens the town's ribbon by a hair over 1.25 MW — about a thousand
more lit homes on the counter — and the stage table shows exactly
which wisp thinned.

**What accumulates.** The completed stage table (95, 92, 98, 94 %,
compounding to 80.5 %); probe readings pinned at four warm places;
the homes counter across runs; ledger rows for flow, delivered MW,
and overall %.

**The failure state.** Spin the gate shut: the ribbon dies from the
top, the turbine freewheels down, the town browns out window by
window and the counter falls to zero — the plant *moves* power and
has none of its own to give. The boundary box around the whole
valley still balances: reservoir store simply stops converting.

**The prediction.** *The generator is "98 % efficient". The other
2 % is…*
1. Destroyed in the windings.
2. Still electricity, leaking to earth.
3. Heat in the generator hall — which is why the hall has cooling
   fans. ✔
4. Rounding error.
Reveal: the probe on the hall reads 0.86 MW of warm air at full
flow. Every "loss" in the table is findable with the same probe;
none of them is a disappearance.

**The misconception it confronts.** *"Energy is lost at each stage
of a power station"* — each peeled wisp is chased to its warm
destination on screen. *"A power station creates electricity"* —
the shut gate kills the town: nothing upstream, nothing out; the
plant converts 80.5 % of what the reservoir sends and creates
nothing.

**Real numbers.** 100 m³/s = 100 000 kg/s falling 50 m: 100 000 ×
9.81 × 50 = 49.05 MW. Stages: penstock 95 % → 46.60 MW (water
≈ 30 m/s at the bottom); turbine 92 % → 42.87 MW (3.7 MW stirs the
draft-tube water); generator 98 % → 42.01 MW (0.86 MW to the
hall); transformer + line 94 % → 39.49 MW (line heating ∝ I², the
reason for 400 kV). Overall 80.5 %; homes = 39.49 MW / 1.2 kW ≈
32 900. Upgrades: penstock→98 % delivers 40.74 MW; turbine→95 %
delivers 40.78 MW.

---

### B4.3 — Dissipation as spreading out, not disappearing

**Subtopic.** B4.3 *Dissipation as spreading out, not disappearing*
(`g8b4-spread-not-gone`).

**The question.** One hard stop on a bike turns 2 880 J of motion
into heat. Follow that heat for five minutes — it never disappears,
so why can you never have it back?

**The scene.** A street, side camera: a bike with a 90 kg
rider-and-bike total rolling at 8 m/s; rim brakes with visible
pads; a brake lever drawn large at bottom-left for the student's
hand. The hero view: a *thermal camera toggle* that re-renders the
whole scene in temperature colours (scale 20–35 °C, rim inset
scaled 20–90 °C). A *time-lapse dial* (1× / 60×) because spreading
is slow. Fixed to the scene, the *temperature ladder*: four rungs
labelled "the same 2 880 J, held by…" — one 0.3 kg rim (+10.7 °C),
1 kg of passing air (+2.9 °C), the whole street of air
(+0.001 °C), the town (unmeasurable) — each rung lighting as the
heat actually reaches that spread. And a hand crank on the rear
wheel labelled "wind it back up from the warm air", with a joule
meter reading what it recovers. Instrument column: *rim temperature
vs time* graph and an energy stack (motion / rim / near air / far
air) whose total is pinned at 2 880 J per stop; ledger.

**What the student does.**
- Run 1: squeeze the lever to a full stop (2 s). Watch the rim in
  thermal view.
- Run 2: spin the time-lapse to 60× and watch five minutes of
  spreading.
- Run 3 (downhill stops): a hill profile loads; the rider remounts
  and brakes to a stop repeatedly without cooling gaps — squeeze,
  roll, squeeze — while the rim graph climbs a staircase.
- Any time: try the crank.

**What they see happen.** Run 1: the pads flare in thermal view;
the rim ring blooms to 30.7 °C (+10.7) in two seconds; the energy
stack pours motion → rim while the total stands still; the squeal
draws a little waveform (its energy labelled: well under a joule).
Run 2, time-lapsed: the rim's glow feeds a plume that drifts and
dilutes; the rim line droops back toward 20 °C as the near-air rung
lights (+2.9 °C for the first kilogram), then the far-air rung
(+0.001 °C); by five minutes the scene's thermal view is almost
uniform again — *and the stack still totals 2 880 J*, now all in
the faint bottom band. The crank, tried at any point: the meter
reads 0.00 J recovered — turning it only warms the bearing a
little more (its own joules join the band; the meter counts
*net* recovery and goes slightly negative). Run 3: each stop adds
+10.7 °C faster than the air can take it away; on the fourth
squeeze the rim passes 60 °C — a "too hot to touch" flag and a
faint pad-fade wobble in the lever — the staircase graph showing
heat arriving in steps and leaving as a slow decay.

**What accumulates.** The rim's temperature history across all
runs; the ladder's four lit rungs with their four temperatures for
one energy; the stack's constant total against its ever-lower
concentration; ledger rows per stop: *speed*, *joules converted*,
*rim ΔT*, *crank recovery (always 0.00)*.

**The failure state.** The over-hot rim of run 3 — dissipation's
one-way street run against, deliberately: heat you cannot shed
fast enough is the same heat you can never gather back.

**The prediction.** *Five minutes after the stop, the 2 880 J
is…*
1. Gone — the room ate it.
2. Still all present, spread so thin no part of it can push the
   bike again. ✔
3. Back in the rim, slowly.
4. Turned into sound.
Reveal: the stack still totals 2 880 J and the crank still reads
0.00. Conserved and useless are compatible; that pairing is what
"dissipated" means.

**The misconception it confronts.** *"Friction destroys energy"*
— the pinned stack total through every squeeze. *"Heat that
spreads out has been lost from the universe"* — the ladder shows
it found, rung by rung, at ever-smaller temperatures; the crank
shows why "still here" and "recoverable" are different claims.

**Real numbers.** ½ × 90 × 8² = 2 880 J per stop from 8 m/s
(4 m/s² over 8 m, 2 s). Rim: 0.3 kg aluminium, c = 900 J/kg·K →
ΔT = 2 880/(0.3 × 900) = 10.7 °C. First kilogram of air, c =
1 005: ΔT = 2.9 °C. Street-scale air: ~0.001 °C; town:
unmeasurable. Downhill staircase: +10.7 °C per stop minus
Newton-cooling decay (τ ≈ 90 s); 60 °C flag on the fourth
consecutive stop. Squeal ≪ 1 J.

---

### B4.4 — Applying conservation to a bouncing ball

**Subtopic.** B4.4 *Applying conservation to a bouncing ball*
(`g8b4-bounce-after-bounce`).

**The question.** A dropped ball bounces lower and lower and then
lies still. Did its energy run out — and could you have predicted
every single bounce height from the first?

**The scene.** The **Stand and drop rig** with a tall clear column
over a hard floor tile: a 60 g tennis ball on the electromagnet
(release height clamp 0.2–3.0 m), a cm scale up the column, and a
*bounce comb* — a rack of thin peak-marker fingers that latch at
each successive rebound apex, leaving a physical decay envelope in
the scene. A material dial sets e (0.20–0.95; tennis-ball default
0.75). Sound: each impact ticks, quieter as the heights shrink,
the ticks crowding together exactly as real bounces do. Energy
stack beside the column: motion/store trading at the top, and a
red thermal band growing from the bottom *by a fixed fraction of
what remains, every bounce*. The boundary box sits around column,
ball and floor. Instrument column: *apex height vs bounce number*
graph (with a log-scale toggle that straightens the decay), a
*predicted next apex* chip the student sets before each bounce,
and the ledger.

**What the student does.**
1. Set drop height and e. Before releasing: dial a prediction for
   the first rebound apex into the chip. Release. The comb latches
   the truth next to the chip.
2. Predict the *fifth* apex from the first (chip again), then let
   the whole sequence run out — bounces crowding, ticks
   accelerating, ball finally still.
- Run 1: h = 1.50 m, e = 0.75.
- Run 2 (change e): 0.95.
- Run 3 (change e): 0.20.

**What they see happen.** Run 1: first rebound 0.844 m (56 % of
the drop), then 0.475, 0.267, 0.150, 0.084 — under 10 cm by the
fifth; the comb's fingers draw a geometric staircase and the ball
is flat on the tile within four seconds, ticks blurring together
at the end. The stack: each impact moves a fixed 44 % of what's
left into the red band; the total never moves; the ball at rest
sits under a stack that is all red — 0.883 J, present and
accounted for, none of it coming back. Run 2 at 0.95: twenty-odd
bounces, still audibly ticking at the window's end, comb fingers
packed like a fine comb. Run 3 at 0.20: one 6 cm hop and done —
the whole story in under a second. The log toggle turns every
comb envelope into a straight line whose slope is 2 ln e.

**What accumulates.** Three comb envelopes standing in the scene;
three straight lines on the log graph with their slopes; the
prediction chips beside the latched truths; ledger: *e*, *drop*,
*apex 1 predicted / measured*, *apex 5 predicted / measured*,
*bounces to < 10 cm predicted / counted*.

**The failure state.** The ball's final stillness played against
a full energy meter: a "wake it up" prod (a poker the student can
nudge the resting ball with) moves it a centimetre and lets it
settle — the red band will not run backward. Also the prediction
chip's honest misses: at e = 0.95 most students under-predict
bounce counts wildly, and the counted 27 stands against their
guess.

**The prediction.** *(the predict-before-run chip, formalised)*
*First rebound from 1.50 m at e = 0.75 will reach…*
1. 1.13 m — three quarters of the drop.
2. 0.844 m — e² of the drop. ✔
3. 0.75 m — exactly half.
4. 1.50 m — bounces repeat until worn out.
Reveal: e is a ratio of *speeds*; heights go as speed squared, so
each apex is e² = 56 % of the last. One number predicts the whole
staircase — the comb agrees finger by finger.

**The misconception it confronts.** *"A ball loses energy because
gravity gets stronger each bounce"* — gravity's 9.81 is printed
on the column and never changes; the log-line's constant slope
pins the loss to the *impacts*, equal fractions every time. *"A
ball that stops bouncing has run out of energy"* — the stack
under the still ball reads 0.883 J, all red: not run out,
relocated beyond recall.

**Real numbers.** Drop 1.50 m: arrival √(2gh) = 5.43 m/s, energy
0.06 × 9.81 × 1.50 = 0.883 J. Apex n = h·e²ⁿ; kept per bounce
e² (56.25 % at 0.75); to heat per bounce 1 − e². Bounce count to
< 0.10 m: ln(0.1/h)/(2 ln e) → 4.7 (so the 5th is under) at
0.75; ≈ 26.4 at 0.95; < 1 at 0.20. Bounce durations shrink ×e
each time (√(2h′/g)), giving the accelerating tick rhythm.

---

### B4.5 — Conservation as a check on a claim

**Subtopic.** B4.5 *Conservation as a check on a claim*
(`g8b4-does-it-add-up`).

**The question.** Six devices, each with a confident advert. You
have three probes and one law. Which claims survive an audit?

**The scene.** The *auditor's bench*: a long counter under gallery
lighting with six curtained alcoves, each curtain printed with its
device's advertising slogan. The student's toolkit, on a belt:
an **input probe** (clips to any power inlet, reads W or J), an
**output probe** (reads what leaves — light, motion, heat), and
the audit's soul, the **environment probe** (a broad paddle that
reads energy arriving from or leaving to the surroundings). Each
alcove has a verdict slot taking one of two brass stamps: PASSES
THE AUDIT / BREAKS CONSERVATION. The devices behind the curtains,
each drawn *exactly as advertised* and running: ① a magnet motor
"running on nothing forever"; ② an LED lamp "400 lumens from
4 W"; ③ a heat pump "1 kW in, 3 kW of heat out"; ④ a wonder-ball
"bounces to 1.2 m from a 1.0 m drop"; ⑤ a quartz clock "two years
on one AA cell"; ⑥ a wind-up toy "goes further on every run".
Instrument column: the audit table (claimed in / measured in /
measured out / environment flow / verdict) and the ledger.

**What the student does.** Open each curtain, watch the device do
what its slogan says (the ball really does climb to 1.2 m; the
toy really does go further each run), then probe all three
channels and stamp. The three runs of the lab loop are the three
*hard* audits: ③, ④ and ⑥; the other three are the warm-up.

**What they see happen.** ② LED: in 4.0 W; out 1.2 W of light +
2.8 W of warm heatsink; environment 0. Books close — PASSES. ⑤
clock: one AA holds 14 000 J; the movement sips 0.2 mW; 14 000 /
0.0002 = 7 × 10⁷ s ≈ 2.2 years — PASSES, no mystery. ③ heat pump:
in 1.0 kW, out 3.0 kW — the audit *fails* on two probes, and
first-time stampers reach for BREAKS — until the environment
paddle, held to the outdoor coil, finds 2.0 kW streaming in from
the cold morning air: moved, not made — PASSES, and the stamp
slot engraves "pumps, not creates". ④ wonder-ball: out-climbs
its drop by 20 % while all three probes read nothing arriving —
no plug, no spring under the floor, no warm inlet; the extra
m·g·0.2 has no source anywhere the paddle can find — BREAKS (and
the B3.2 release line, drawn faintly across the alcove, is being
crossed on screen). ① magnet motor: probes find no input — and
then the device does what every one ever built has done: turns,
slows, stops; a force-along-the-loop meter integrates to zero
around any closed path — BREAKS as a *claim* (the curtain's
"forever"), with the stalled rotor as evidence. ⑥ wind-up toy:
the input probe on the key reads the same ½kx² every wind; the
runs nevertheless lengthen on screen; distance × friction force
exceeds the wound-in joules by run three — BREAKS, the deficit
printed.

**What accumulates.** The audit table, six rows, three PASSES and
three BREAKS, each verdict resting on a probe reading the student
took; the environment column doing the deciding in every hard
case — 0 for the ball (damning), +2.0 kW for the heat pump
(saving). The stamps stay in their slots as the scene's record.

**The failure state.** Stamping the heat pump BREAKS on two
probes: the slot rejects the stamp with a spring — "one probe
missing" — until the environment paddle has been placed at least
once. The audit teaches its own method: the books include the
surroundings or they are not books.

**The prediction.** *The heat pump delivers 3 kW of heat for 1 kW
of electricity. Conservation says…*
1. Impossible — 2 kW from nowhere.
2. Possible only if it is 33 % efficient somehow.
3. Fine, if 2 kW of heat is entering from somewhere else — go and
   find it. ✔
4. Fine — heat is not really energy.
Reveal: the paddle on the outdoor coil reads 2.0 kW arriving from
the cold air. 1 + 2 = 3, every second. A mover can beat 100 % of
its *electricity*; nothing beats 100 % of its *inputs*.

**The misconception it confronts.** *"A machine can be more than
100 % efficient"* — the ball and the toy, drawn exactly as their
adverts insist, stand on the bench as visible impossibilities
whose missing source three probes fail to find. *"Any device
that outputs more heat than the electricity it draws must be a
fraud"* — the heat pump's audit, which nearly every student
initially stamps wrong, and the paddle that redeems it.

**Real numbers.** LED: 400 lm / 4 W = 100 lm/W (ordinary for a
good LED); ≈ 1.2 W light + 2.8 W heat. Heat pump: 1 kW electric
+ 2 kW pumped from outdoor air = 3 kW delivered. Wonder-ball:
rebound needs m·g·1.2 against m·g·1.0 supplied — a 20 % sourceless
surplus. Quartz clock: AA ≈ 14 000 J at 0.2 mW → 7 × 10⁷ s ≈ 2.2
years. Magnet motor: ∮F·ds = 0 around any closed loop — no energy
per cycle; observed behaviour: turns, then stalls. Wind-up toy:
fixed ½kx² per wind; friction work per run can at best equal it.

---

## Topic B5 — Modeling and iterative testing

One engineering programme spans the topic: land a 58 g egg from 2.00 m
without breaking it. The apparatus is the **Stand and drop rig** in its
egg-lab dress, built once for all five briefs: a 2.0 m stand with a metre
rule bolted to it (extendable to 4.0 m), an electromagnet release, a
padded *test pallet* where foam samples clip in, an **accelerometer
logger** whose trace (deceleration vs ms) prints on a card after every
drop, a *foam catalogue* drawer (samples labelled by crush force), an
egg carton of identical 58 g eggs, and a "broken: n" counter. The model
under test is one line, printed on the rig's flank: **deceleration in g
= drop height ÷ crush distance** — exact whenever the crushing force is
steady. The shell's limit, measured once in B5.2 and painted on the rig
thereafter: **53 g**.

### B5.1 — Developing a model to generate data

**Subtopic.** B5.1 *Developing a model to generate data*
(`g8b5-build-the-drop-rig`).

**The question.** Before the rig can answer any question about foam, it
has to stop lying. Which parts of it exist purely so the numbers can be
trusted?

**The scene.** The egg-lab rig *in pieces*: a parts trolley holds the
stand and rule, the electromagnet, a hook-and-string "hand release"
(the tempting alternative), the egg carton, a 3 cm foam sample, the
logger, and a protocol card reading "three drops per setting". The
assembly points on the bench glow faintly. Beside the bench, the
*calibration board*: a strip chart that plots every drop's measured
arrival speed as a dot on a line marked with the theoretical 6.26 m/s,
and below it a slot where logger cards file themselves per drop.
Instrument column: the calibration board writ large and the ledger.

**What the student does.** Build, then *calibrate* — the experiment is
discovering what each part is for by dropping with and without it:
- Run 1 (release comparison): assemble with the hand release; drop a
  dummy egg five times reading arrival speed each time. Swap in the
  electromagnet; five more.
- Run 2 (height comparison): nudge the release clamp to 1.90 m
  ("near enough"), three drops; then set it against the rule's 2.00 m
  stop, three drops.
- Run 3 (repeats comparison): two foam samples that differ by 5 %
  (marked A and B) — first one drop each, then three drops each.

**What they see happen.** Run 1: the hand-release dots scatter around
and *above* 6.26 (a hand always adds a little push and a wobble —
±0.15 m/s and visible spin on the way down); the electromagnet dots
stack on the line. Run 2: at 1.90 m every logger card reads 5 % low —
consistently, not noisily; a tidy rig can still be wrong, and it is
wrong the same way every time (the calibration board draws the offset
as a shifted cluster, not a spread one). Run 3: with one drop each,
sample A reads 64 g and B reads 66 — indistinguishable from the
scatter; with three each, the means separate cleanly (64.1 ± 1.2 vs
67.4 ± 1.1) and a divider appears between the clusters. The logger
cards stack up as the physical record of all of it.

**What accumulates.** The calibration board's dot clusters — scattered,
stacked, shifted — each labelled with the rig state that made them;
the card file; a final *rig certificate* that stamps itself only when
release = electromagnet, height = against-the-stop, and protocol =
×3: "this rig's numbers now mean something."

**The failure state.** Any drop made before the certificate exists
files its card with a grey corner — usable, untrusted. The concrete
failure is run 3's first half: a real 5 % foam improvement rendered
invisible by a one-drop protocol; the improvement was there and the
rig could not see it.

**The prediction.** *Five hand-released drops, five electromagnet
drops. The two clusters of arrival speeds will…*
1. Match — a drop is a drop.
2. Hand release reads higher and scatters wider. ✔
3. Electromagnet reads higher.
4. Both scatter the same amount.
Reveal: the hand's dots ride above the line and spread; the magnet's
sit on it. A release that adds an unknown push adds an unknown energy
— and unknowns are what the rig exists to remove.

**The misconception it confronts.** *"One successful drop shows the
design works"* — sample B "beat" sample A on single drops in a third
of the seeded orderings, and three-drop means un-decide it. *"A model
has to look like the real thing to be useful"* — the rig looks
nothing like a delivery van; it controls two lengths and a release,
and that is exactly enough for g = h/d to generate trustworthy
numbers.

**Real numbers.** From 2.00 m: arrival √(2·9.81·2.00) = 6.26 m/s,
energy 0.058 × 9.81 × 2.00 = 1.14 J. Height error 10 cm → 5 % error
in every computed deceleration. Hand release: +0.05 to +0.25 m/s and
spin; electromagnet: from rest, no spin. Foam pair: true 64 vs 67 g;
single-drop noise ±2.5 g; three-drop mean noise ±1.2 g. Crush time
≈ 2d/v ≈ 9.6 ms at 3 cm.

---

### B5.2 — Running a first round of testing

**Subtopic.** B5.2 *Running a first round of testing* (`g8b5-round-one`).

**The question.** Three centimetres of foam under the egg. Raise the
drop until something gives — where exactly is the edge, and is it
above or below the 2.00 m the brief demands?

**The scene.** The certified rig from B5.1. On the pallet: the round-one
package — the egg in a 3 cm foam jacket (drawn at true size, 110 mm
across). The release clamp slides on the rule, 0.25–4.00 m. The logger
prints its card per drop. New to this brief, the *survival chart*: a
vertical strip beside the rule, one marker per drop at its height —
green (intact) or cracked-egg red — building a boundary the student
closes in on. A dashed line is painted across the rule at 2.00 m,
labelled "the brief". The egg carton and the broken counter stand by;
a cracked egg is *not reused* — it stays flattened on the pallet until
swapped, and the counter ticks. Instrument column: *deceleration vs
drop height* graph (a straight line through the origin building from
the student's drops, slope 1/0.03), the survival chart mirrored, and
the ledger.

**What the student does.**
- Run 1: drop from 0.75 m. Read the card. Log the marker.
- Run 2: drop from 2.00 m — the brief's own requirement.
- Run 3 (bracket the edge): binary-search the clamp — 1.40 m, 1.70,
  1.55, 1.60 — until the boundary between green and red is pinned
  inside a 10 cm band.

**What they see happen.** Run 1: a soft landing — the card reads 25 g,
flat-topped; the egg is lifted back for reuse; a green marker at
0.75 m. Run 2: the fall looks identical until the last centimetre —
the foam bottoms firm, the card prints 66.7 g, and the shell cracks
with an audible tick; yolk wets the foam; red marker at 2.00 m, right
on the brief's dashed line; the counter ticks 1. Round one has
*failed the brief*, measurably. Run 3: markers alternate green, red,
green… converging; the boundary lands between 1.55 and 1.60 m, and
the graph's line shows why: deceleration crosses the shell's measured
limit — 53 g — at h = 53 × 0.03 = 1.59 m. The student has produced,
from their own drops, both the failure of the current design and the
number (53 g) that any redesign must respect; the 53 g line paints
itself onto the rig's flank for the rest of the topic.

**What accumulates.** The survival chart's green/red boundary with its
bracket; the deceleration line through the origin, slope 33.3 g/m;
logger cards for every drop; the ledger of *height*, *g measured*,
*g predicted = h/0.03*, *intact?* — prediction and measurement
agreeing within noise on every row, which certifies the model even
as the design fails.

**The failure state.** The 2.00 m crack is the round's designed
failure — the brief's own requirement breaking the current design on
screen — plus every red marker of the bracketing, each costing a
real egg from a finite carton.

**The prediction.** *3 cm of foam. The brief demands 2.00 m. The
drop will…*
1. Crack the egg: 2.00 ÷ 0.03 is 66.7 g, past anything a shell
   takes. ✔
2. Be survived — foam is foam.
3. Be survived if the egg lands point-down.
4. Depend on the egg's mass.
Reveal: the card printed 66.7 g and the shell went at its ~53 g
limit. The model predicted the failure before the yolk confirmed it
— which is what models are for.

**The misconception it confronts.** *"A heavier package hits harder,
so a light egg is safer"* — the g = h/d line has no mass in it; a
side drop with a 116 g double-yolker (twice the mass) prints the
same 66.7 g card. *"Doubling the drop height doubles the energy but
not the force"* — the graph line is straight: height doubles, g
doubles, force with it.

**Real numbers.** g = h/d exactly for steady crushing: 0.75 m →
25 g; 1.59 m → 53 g (the shell's edge: 30 N ÷ (0.058 × 9.81) =
52.8); 2.00 m → 66.7 g. Arrival at 2.00 m: 6.26 m/s, 1.14 J; crush
time 2d/v = 9.6 ms; average force at 2.00 m = 1.14 J / 0.03 m =
38 N > the 30 N shell limit. Logger noise ±1.5 g.

---

### B5.3 — Modifying the model from test data

**Subtopic.** B5.3 *Modifying the model from test data*
(`g8b5-what-the-data-said`).

**The question.** Round one broke the egg at 66.7 g. Two fixes are on
the bench: thicker foam, and stiffer foam. The equation only mentions
one of them — which, and can the logger prove it?

**The scene.** The certified rig, clamp locked at the brief's 2.00 m
(a padlock icon on the rule: the brief is not negotiable, so height
has left the table). On the bench, three packages drawn at true
size: **round one's** 3 cm soft jacket (110 mm across, still yolk-
stained), a **stiff** 3 cm jacket (same size, denser hatch — the
catalogue calls it "firm: crushes at 38 N"), and a **thick** 9 cm
soft jacket (230 mm across, visibly a different object). The logger's
card printer now feeds a *trace gallery* — cards pinned side by side
for comparison, each a deceleration-vs-ms curve. Instrument column:
the gallery, the g = h/d model line with the three packages' predicted
points flagged on it, and the ledger.

**What the student does.**
- Run 1 (re-run the failure, eyes on the trace): drop round one's
  spare. Pin the card.
- Run 2 (the intuitive fix): drop the *stiff* 3 cm package.
- Run 3 (the model's fix): drop the *thick* 9 cm package.

**What they see happen.** Run 1's card: a clean flat top at 66.7 g
for 9.6 ms — the foam crushed all the way, steadily, and steady ×
too-short = deadly; crack, counter ticks. Run 2, the popular
choice: the stiff foam *barely crushes* — 1 cm — and its card is a
narrow tower: a spike past 100 g in 3 ms. Worse than round one, and
the trace says exactly why: d in g = h/d is the distance the foam
actually gives, and stiffness *reduced* it. Crack; counter. Run 3:
the fall is the same 2.00 m, the landing takes three times as long,
and the card is a low plateau: 22.2 g predicted, 23 g printed,
flat-topped for 29 ms with no end-spike — the foam used its full
9 cm and never bottomed. The egg is lifted out whole, held up to
the camera. One variable moved; the deceleration fell by a factor
of three; the *trace shape* — flat versus spiked — is the
between-runs referee.

**What accumulates.** Three pinned cards forming the topic's key
exhibit: flat-and-high (crack), spiked (crack, worse), flat-and-low
(intact); the model line with measured points landing on it for
runs 1 and 3 and *off* it for run 2, annotated "d was not 3 cm —
the foam only gave 1"; the ledger of *package*, *d given (from the
trace's duration)*, *g predicted*, *g printed*, *intact?*.

**The failure state.** Run 2 — the plausible improvement made
measurably worse, cracked egg and spiked card as the evidence pair;
plus the model's own limit surfaced: g = h/d applies only when the
trace is flat, and the spike is the trace announcing the model's
edge.

**The prediction.** *Same 2.00 m. Which package saves the egg?*
1. The stiff 3 cm — stronger foam, stronger protection.
2. The thick 9 cm: only distance appears in g = h/d. ✔
3. Both — any change helps.
4. Neither — 2.00 m is simply too high.
Reveal: cards 22 g flat against 100+ g spiked. The equation never
had a "stiffness" term, and the logger showed stiffness *stealing*
the one term it does have.

**The misconception it confronts.** *"A failed test means starting
the design again"* — round two is round one with one number moved,
and it passes; the data pointed at the variable, and everything
else (rig, egg, height, protocol) carried over. *"More padding
always means a softer landing"* — the stiff jacket *is* more
padding by weight, and it spiked; padding helps exactly in
proportion to the crush distance it donates.

**Real numbers.** Locked height 2.00 m, arrival 1.14 J. Round one:
2.00/0.03 = 66.7 g, flat, 9.6 ms. Stiff: gives ≈ 0.01 m → spike
> 100 g, ≈ 3 ms, then hard stop. Round two: 2.00/0.09 = 22.2 g
predicted, 23 g logged, ≈ 29 ms flat; package 230 mm across.
Shell line 53 g. Flat-top test: model valid; end-spike: foam
bottomed, model void.

---

### B5.4 — Naming the trade-off in each improvement

**Subtopic.** B5.4 *Naming the trade-off in each improvement*
(`g8b5-safe-or-small`).

**The question.** The 9 cm jacket saves the egg — and will not go
through a letterbox. What exactly does every centimetre of safety
cost, and is there a thickness that satisfies both?

**The scene.** The certified rig (clamp still locked at 2.00 m) with
two new stations flanking it. Left, the **letterbox**: a wall-mounted
brass slot, 150 mm wide, with a spring flap — packages are posted by
hand, and one that does not fit *visibly* does not fit. Right, the
**postal scale**, reading the foam's mass in grams. Centre, the
*jacket lathe*: a dial that builds a package at any jacket thickness
1–15 cm, always drawn at true radius around the 50 mm egg — the
package on the pallet grows in width *linearly* with the dial while
the scale under it climbs with the *cube*. Instrument column: a
two-axis scorecard — *deceleration (g) vs thickness* falling as 1/t,
and *foam mass (g) vs thickness* rising as a cubic — with the 53 g
shell line on the first and the letterbox's 150 mm limit drawn as a
vertical wall across both; ledger.

**What the student does.**
- Run 1 (test the compact): dial 3 cm. Post it — it sails through
  the slot; weigh it — 16 g; drop it — crack (66.7 g).
- Run 2 (test the padded): dial 9 cm. Drop — intact (22.2 g); weigh
  — 158 g, ten times the foam for three times the thickness; post —
  it jams in the slot flap, half in, half out, and stays there
  until pulled back.
- Run 3 (hunt the window): sweep the dial while watching both
  curves: survival needs t ≥ 3.8 cm; the slot allows t ≤ 5.0 cm.
  Build 4.5 cm; drop, weigh, post — all three pass, and then the
  rig asks its last question: drop the 4.5 cm package *five* times
  (44 g is only 17 % under the 53 g edge, and foam varies…).

**What they see happen.** The lathe makes the cost physical: dialling
3 → 9 cm triples the width on screen but the scale spins 16 → 158 —
the cube at work, stated by the ledger as "×3 thickness, ×10 foam".
The letterbox turns "too big" from a number into an event. Run 3
finds the window — 3.8 to 5.0 cm — and then prices it: of five
drops at 4.5 cm (44 g nominal, ±3 g of real foam variation), the
seeded sequence cracks one egg on the fourth drop at a logged 49 +
4 g excursion… no: at 44 ± 3 the shell's 53 stays clear; the drops
log 42–47 g, all green but crowding the line on the chart — the
student watches five markers stack just under the red zone and is
asked to *name* what the 9 cm design was buying: distance from the
edge. The window exists; it is narrow, and it spends margin to fit
the slot.

**What accumulates.** The two-curve scorecard with the survival
line, the slot wall, and the discovered window shaded between
them; five clustered markers under the 53 g line at 4.5 cm against
one lonely comfortable marker at 9 cm (22 g); the ledger's final
column, written by the student from a menu: what each design
*costs* — compact: the egg; padded: the letterbox and 158 g;
window: the margin.

**The failure state.** Run 2's jam — a passing design failing a
constraint bodily, in brass — and run 1's crack: each end of the
dial fails a different master, which is what "trade-off" means
when it stops being a word.

**The prediction.** *Tripling the jacket from 3 to 9 cm multiplies
the foam needed by about…*
1. 3 — three times the thickness.
2. 6.
3. 10 — the jacket is a shell, and shells grow with the cube. ✔
4. 2.
Reveal: the scale read 16 g then 158 g. Width grew like the dial;
volume grew like the dial cubed; the postage grows with the
volume.

**The misconception it confronts.** *"The best design is the one
that scores best on the main criterion"* — the 9 cm jacket is the
safety champion and hangs jammed in the letterbox. *"Improvements
are free if the material is cheap"* — the foam costs pennies; the
158 g and the 230 mm cost the mission; the window design pays in
margin instead, and the five crowded markers price that too.

**Real numbers.** Survival: g = 2.00/t ≤ 53 → t ≥ 3.77 cm. Slot:
width 2(25 + t mm) ≤ 150 → t ≤ 50 mm. Window: 3.8–5.0 cm; at
4.5 cm, 44.4 g nominal, foam spread ±3 g. Foam mass = shell
volume × 25 kg/m³: 3 cm → 16 g; 4.5 cm → 34 g; 9 cm → 158 g;
15 cm → 610 g (a thousand times 1 cm's 0.6 g for fifteen times
the thickness). Package widths: 110, 140, 230, 350 mm.

---

### B5.5 — A second round of modification

**Subtopic.** B5.5 *A second round of modification* (`g8b5-two-layers`).

**The question.** Nine centimetres to spend and 1.14 J to absorb —
and the catalogue only stocks foams with fixed crush forces. Can
two layers do what no single stocked foam can?

**The scene.** The certified rig, 2.00 m, one last station: the
**layer press** — a cross-section workbench where the student builds
a 9 cm jacket from horizontal layers pulled out of the *foam
catalogue* drawer: grades stamped 8 N, 10 N, 12 N, 14 N, 16 N (each
crushes at exactly its stamped force, and says so). Layers stack in
the order they will meet the ground — *outer at the bottom*. Beside
the press, the brief's hero instrument: the **energy budget graph**
— force (N) vertical, crush distance (cm) horizontal, with the
arriving 1.14 J drawn as a shaded target area and the student's
stack rendered as rectangles (width = layer thickness, height =
stamped force) that must *tile at least 1.14 J before the distance
runs out*, plus a horizontal line at 30 N: the shell's force limit
(53 g). Every built stack can be dropped for real; the logger card
referees. Instrument column: budget graph, trace gallery, ledger.

**What the student does.**
1. Build a stack on the layer press: pull layer slabs from the
   catalogue drawer, slide them into the 9 cm frame in landing
   order (outer at the bottom), and watch the budget graph tile
   its rectangles as each slab seats.
2. Carry the built jacket to the pallet (a drag), seat the egg,
   release from 2.00 m, and pin the logger card next to the
   stack's budget tiling.
- Run 1 (the single soft stack): 9 cm of the 12 N grade.
- Run 2 (the single firm stack): 9 cm of the 14 N grade.
- Run 3 (the two-layer stack, round two's design): 6 cm of 12 N
  outer, 3 cm of 14 N inner. Then the coda: flip the two layers
  (14 N outer) and drop once more.

**What they see happen.** Run 1: the budget graph shows one
rectangle, 12 N × 9 cm = 1.08 J — visibly short of the 1.14 J
target, a sliver of unshaded energy left over. The drop agrees:
the trace runs flat at 12 N (21 g) for 8.7 cm… and then the
sliver lands all at once — bottoming spike, crack. 0.06 J with
nowhere to go is still a hammer. Run 2: rectangle 1.26 J, budget
met with room; the trace is flat at 24.6 g, 8.1 cm used, egg
intact — and the whole landing, first touch included, runs at
24.6 g. Run 3: rectangles 0.72 J + 0.42 J = 1.14 J, the budget
tiled exactly, to the joule; the trace is a two-step staircase —
21 g for the first 6 cm, a clean handover, 24.6 g for the last
3 — flat-topped twice, no spike, egg intact, and the first
two-thirds of the landing ran 15 % gentler than run 2's. The
wrong-order coda: the budget graph is *identical* — same
rectangles, same 1.14 J — but the drop opens hard at 24.6 g from
first touch, and the inner 12 N layer meets the remaining 0.42 J
with only 12 × 0.03 = 0.36 J of capacity: bottoming spike,
crack. Order is invisible to the budget and decisive to the egg.

**What accumulates.** Four budget-graph tilings pinned beside their
four logger cards — short/spiked, met/flat, exact/staircase,
exact-but-reversed/spiked — the pairing teaching that the area
argument is necessary and not sufficient; the ledger of *stack*,
*capacity (J)*, *peak g*, *distance used*, *intact?*; and the
programme's closing line, auto-totalled from run 3: 0.72 + 0.42 =
1.14 J = 0.058 × 9.81 × 2.00 — the books of the whole topic closed
by the student's own final drop. The crushed layers stay crushed:
the package is single-use, and the ledger's last cell names that
as the accepted trade.

**The failure state.** Two engineered cracks — the under-budget
bottom-out and the right-budget wrong-order spike — each predicted
by one instrument and missed by the other, which is the round-two
lesson: model *and* trace, always both.

**The prediction.** *Two stacks hold the same 1.14 J: 12-then-14,
and 14-then-12. Dropped, they will…*
1. Behave identically — same foams, same energy.
2. Both crack — 1.14 J is 1.14 J.
3. Differ: soft-first lands gently and survives; firm-first spikes
   at the end and cracks. ✔
4. Differ: firm-first is better — strength up front.
Reveal: the staircase card against the spiked one. The budget
fixes *whether* the energy fits; the order fixes *when* each force
is met, and the last centimetre is the one that decides.

**The misconception it confronts.** *"Softer padding is always
better"* — the all-soft stack is the one that cracks the egg, by
0.06 J of shortfall. *"A second round of testing is only needed if
the first one failed"* — run 2 *passed*, and run 3 still found a
measurably gentler landing inside the same 9 cm; iteration is how
the passing design got better, not how the failing one got
rescued.

**Real numbers.** Budget: 0.058 × 9.81 × 2.00 = 1.14 J over
≤ 9 cm; shell force limit 30 N (53 g). Layer capacities F × d:
12 N × 0.09 = 1.08 J (short); 14 N × 0.09 = 1.26 J (met, 8.14 cm
used); 12 N × 0.06 = 0.72 J + 14 N × 0.03 = 0.42 J = 1.14 J
(exact). Peaks: 12 N → 21.1 g; 14 N → 24.6 g — against 66.7 g in
round one and 22.2 g in the idealised round-two model. Bottoming
remainder in run 1: 0.06 J arriving at 1.4 m/s into a hard stop.

---

## Coverage

| Topic | Briefs | Kit |
|---|---|---|
| A1 Describing motion | A1.1–A1.5 | block walk · slot-car table · Track kit · platform/train · town journey |
| A2 Acceleration and motion graphs | A2.1–A2.5 | Road kit (+ drop tower in A2.3) |
| A3 Newton's First Law | A3.1–A3.5 | launch lanes · Track kit ×3 · Bus kit |
| A4 Force, mass, acceleration | A4.1–A4.5 | Track kit (one investigation throughout) |
| A5 Third Law and collisions | A5.1–A5.5 | Track kit + pair probe · farm lane · Crash rig ×2 |
| A6 Engineering a collision solution | A6.1–A6.5 | Crash rig + scrutineering bench + component press |
| B1 Kinetic energy | B1.1–B1.5 | Energy track (brake strip) · Crash rig |
| B2 Potential energy | B2.1–B2.5 | tall Stand rig · Spring bench · Pendulum |
| B3 Energy transfer in collisions | B3.1–B3.5 | Energy track · drop columns · Crash rig ×2 · carousel |
| B4 Conservation | B4.1–B4.5 | boundary box over bench · valley · bike · drop rig · auditor's bench |
| B5 Modeling and iterative testing | B5.1–B5.5 | egg-drop rig (one programme throughout) |

Fifty-five briefs. Every scene is a complete apparatus in spatial
relationship; every model is stepped live; every cause is drawn on the
objects; every experiment is run by hand, accumulates across runs, can
fail visibly, and opens with a committed prediction. The science —
every constant and relationship in every *Real numbers* section — is
carried over from the checked `measure` functions and `because` text of
the g8a1–g8a6 and g8b1–g8b5 specs.
