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
