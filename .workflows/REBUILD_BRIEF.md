# Rebuild brief — why the catalogue fails, and the bar it must meet

## The verdict

The founder reviewed five simulations and rejected the whole approach. He is
right. This is the evidence, exactly as it appeared on screen:

| Subtopic | What the screen showed | Why it is not an experiment |
|---|---|---|
| Position vs time (G8-A1) | A purple box floating on an empty floor. A gauge reading "24.0 m". A straight line on a graph with a dot on it. | No track, no distance marks, no start line, no timer. The box does not sit on anything. The graph is a formula plotted in advance with a marker — nothing the student does produces the line. |
| Relative motion: train and walker (G8-A1) | The same purple box captioned "the train". An orange sphere captioned "only the walker". | A sphere is not a walker. Nothing moves relative to anything. Two props with captions is a slide, not a model. |
| Inertia: braking bus (G8-A3) | The same purple box, floating. A stage rail: "The driver brakes. The bus loses speed at 4.8 m/s². Nothing has touched the passenger." | There is no bus, no passenger, no braking, no lurch. The sentence describes an event the picture does not show. |
| Drop height vs deceleration (G8-B) | A cream sphere hanging in mid-air. A graph. | No floor, no height, no drop, no impact. The one thing the subtopic is about — a ball falling and stopping — never happens. |
| Stored energy vs height (G8-B) | A retort stand with **nothing on it**. A graph reading 420 J. | The mass whose height is being varied is not drawn. The student cannot see what is stored, where, or why. |

The root cause is architectural. Every simulation was expressed as *one stock
prop plus a graph*, drawn by a shared renderer, with the physics reduced to a
closed-form `measure(v)` that the graph plots ahead of time. A prop cannot show
an experiment. The founder's words: "you just stuck an image on and wiggled it."

## The bar

A simulation passes only if all of these are true, judged from screenshots by
someone other than its author.

1. **The whole apparatus is in the scene, in spatial relationship.** The track
   *and* the cart *and* the ruler *and* the timer. The bus *and* the passenger
   *and* the handrail. The stand *and* the mass *and* the ground it could fall
   to. Never one prop on an empty sweep.
2. **The physics is integrated live.** Positions, velocities, temperatures,
   concentrations are stepped by a real model every tick. The graph fills in as
   the thing happens. It is never a pre-computed curve with a marker on it.
3. **Cause is visible on the objects.** Force arrows, velocity vectors, energy
   bars, heat glow, particle flow — drawn at the right place, scaled to the real
   magnitude, changing as the run proceeds.
4. **The student does something physical.** Pull the cart back and let go. Drag
   the mass up the stand. Drop the ball. Close the switch. Tip the reagent in.
   Sliders alone are not interaction.
5. **It takes time and accumulates.** Set up → run → watch → measure → change
   one thing → run again. Each run leaves its trace on the graph so the
   relationship emerges from the student's own runs, side by side.
6. **The failure state is shown.** The ball bounces or does not. The spring
   passes its elastic limit. The solution saturates. The population crashes.
7. **Nothing is broken on screen.** No text collision, nothing off-stage, both
   themes, read from screenshots at t = 0, mid-run and end, and at both extremes
   of every control.

## What this replaces

- `ArchetypeSpec` + `drawSpecimen` as the way a simulation is expressed. The
  seven archetype *interaction kinds* were a reasonable idea; the *specimen*
  model that implemented them is the thing that failed.
- Closed-form `measure` as the physics. It stays useful for readouts and the
  answer key; it is no longer what the picture is built from.

## What survives

- The 3D layer (`three3d.ts`, `render3d.ts`) — real geometry, lighting, the
  compositor. It renders a subject well; it was asked to render the wrong
  thing.
- The 2D kits (`labware`, `organic`, `anatomy`, `geo`, `fauna`, `waves`,
  `space`, `charts`) — the drawings are good; they need to be composed into
  scenes.
- The curriculum, the Formula Lab, the Course Library, the lab/challenge runner,
  the wiring scripts, the health checker, the clock fix.
- The 521 specs as *content*: titles, learning goals, misconceptions, the real
  constants in their `measure` functions. That science was checked and is
  right. It is the picture that was wrong.
