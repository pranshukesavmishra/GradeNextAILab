# Authoring a simulation

Every simulation is one file exporting one `SimManifest`. The shell supplies the
stage, controls, time controls, graphing, data table, measurement, labs,
challenges, accessibility, and theming — you write the physics and the drawing.

## The shape of a sim file

```ts
import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { arrow, camera, disc, grid, ground, label } from "@ui/draw";

interface State { /* plain, serializable data only */ }

const model: SimModel<State> = {
  init(params, ctx) { return { /* ... */ }; },
  step(state, dt, params, ctx, inputs) { return nextState; },
  applyParams(state, params, prev, ctx) { return state; },   // optional
  readouts(state, params, ctx) { return [ /* ... */ ]; },
  facts(state, params) { return { /* for lab checkpoints */ }; },  // optional
};

function render(rc: RenderContext<State>) { /* draw with rc.ctx */ }

export const mySim: SimManifest<State> = {
  id: "phys.my-sim", title: "...", tagline: "...",
  subject: "physics", bands: ["6-8", "9-12"], grades: [7, 8, 9],
  standards: { ngss: ["MS-PS2-2"] },
  learningGoals: ["..."],
  params: { /* ... */ },
  overlays: [ /* ... */ ],
  model, render,
  labs: [ /* ... */ ], challenges: [ /* ... */ ],
};
```

Then add it to `src/sims/registry.ts`. That is the only wiring step.

## Non-negotiable rules

1. **`step` must be pure.** No `Math.random`, no `Date.now`, no DOM, no
   module-level mutable state. Randomness comes only from `ctx.rng`. This is what
   makes share links, replay, and teacher review work.
2. **State must be JSON-serializable.** Plain objects, arrays, and numbers. No
   class instances, no functions, no `Map`/`Set` in state.
3. **Return new state; do not mutate the argument.** For large particle arrays,
   building a new array each step is fine — allocate once and reuse the shape.
4. **Store SI units.** Metres, seconds, kilograms, kelvin. The parameter's `unit`
   field controls display only; the shell converts at the edge.
5. **Never hardcode colours.** Use `rc.theme.ink`, `rc.theme.line`, and the
   semantic palette `rc.theme.sci["velocity"]`. Sims must work in both themes.
6. **Respect the grade band.** Use `rc.band` to decide how much to draw, and the
   `bands` field on parameters, readouts, and overlays to control what appears.

## Semantic colours

Colour inside the stage always means a quantity. Available keys on `theme.sci`:

`velocity` · `acceleration` · `force` · `momentum` · `energy-kinetic` ·
`energy-potential` · `energy-thermal` · `energy-total` · `charge-pos` ·
`charge-neg` · `field` · `current` · `cold` · `hot` · `mass` · `distance` ·
`time` · `acid` · `neutral` · `base` · `solid` · `liquid` · `gas` · `producer` ·
`primary-consumer` · `secondary-consumer` · `decomposer` · `light` · `wave`

Never use one of these for decoration, and never use a different colour for a
quantity that already has one. A student learning that blue means velocity in a
Grade 4 sim must find the same thing true in Grade 11.

## Parameters

```ts
speed: {
  type: "number", label: "Launch speed", kind: "velocity", unit: "m/s",
  min: 2, max: 40, step: 0.5, default: 18,
  bands: ["6-8", "9-12"],            // omit to show at every band
  hideValueBands: ["K-2"],           // control visible, number hidden
  help: "One short sentence, shown on demand.",
  marks: [{ value: 1.62, label: "Moon" }],   // labelled preset stops
},
onOff:  { type: "boolean", label: "Air resistance", default: false },
choice: { type: "option", label: "Surface", options: [{ value: "ice", label: "Ice" }], default: "ice" },
```

Constrain ranges to what is pedagogically meaningful. If a value above 200 makes
the animation unreadable, the slider stops at 200.

## Readouts

Readouts feed the chips, the graph, the data table, the CSV export, lab
checkpoints, and the screen-reader description. Expose everything a student
might measure.

```ts
{ key: "vx", label: "Horizontal speed", quantity: q(state.vx, "velocity"),
  unit: "m/s", semantic: "velocity", graphable: true, bands: ["6-8", "9-12"] }
```

`facts()` is for values labs need to test but students should not see as a
readout (`landed`, `distanceToTarget`, `shots`).

## Drawing

Use `camera()` to map world coordinates onto the canvas with y pointing up:

```ts
const cam = camera({ x0: 0, y0: 0, x1: 40, y1: 20, width: rc.width, height: rc.height });
const sx = cam.toScreenX(worldX);
const sy = cam.toScreenY(worldY);
```

Helpers in `@ui/draw`: `grid`, `ground`, `arrow` (the single platform arrow
style — use it for every vector), `disc`, `roundRect`, `label` (draws a legible
plate behind text), `trail`, `energyBars`, `mixHex` (for thermal ramps).

Keep the frame budget in mind: this must hold 60 fps on a low-end Chromebook.
Cap particle counts, avoid per-frame allocation in hot loops, and do not draw
text for every particle.

## Guided labs

A lab is a sequence of steps over the live simulation. Checkpoints are
predicates over real state, so a student cannot click through without doing the
experiment.

```ts
{
  id: "angle-range",
  title: "Which angle goes furthest?",
  question: "The question in student language.",
  bands: ["6-8", "9-12"], minutes: 20,
  setup: { speed: 18, angle: Math.PI / 12 },
  steps: [
    { id: "predict", phase: "hypothesis", title: "Make a prediction",
      instruction: "Short. The specification caps instructional text.",
      predict: { prompt: "...", options: ["15°", "45°", "75°"], correct: 1,
                 reveal: "Explained only after they commit." } },
    { id: "collect", phase: "measure", title: "Test five angles",
      instruction: "...", requireData: 5,
      hints: ["A nudge.", "A sharper nudge.", "Nearly the answer."] },
    { id: "check", phase: "setup", title: "Set it up",
      instruction: "...",
      check: { describe: "Mass is above 10 kg", test: (v) => (v.params.mass as number) >= 10 } },
    { id: "conclude", phase: "conclude", title: "Explain it",
      instruction: "...",
      write: { prompt: "Write a rule someone else could follow." } },
  ],
}
```

Phases: `question` · `hypothesis` · `setup` · `measure` · `analyze` · `conclude`.

A step advances when its prediction is committed, its `check` passes, its
`requireData` quota is met, and its `write` has content. Hints ladder one at a
time and never jump to the answer.

**Open every lab with a prediction.** Committing to an answer before seeing the
result is the highest-value pedagogical move available, and it costs one field.

## Challenges

```ts
{
  id: "hit-target", title: "Hit the target", brief: "One sentence.",
  bands: ["3-5", "6-8"], setup: { speed: 15 },
  goal:  { describe: "Land within 0.5 m", test: (v) => (v.facts.distanceToTarget as number) <= 0.5 },
  stars: { two: { /* stricter */ }, three: { /* strictest */ } },
  hints: ["..."],
}
```

Stars are evaluated continuously and never decrease within an attempt. A good
challenge rewards understanding, not grinding, luck, or reaction speed.

## Writing for students

- Explore mode must be usable with zero words read.
- Instruction strings: K-2 ≤ 6 words, 3-5 ≤ 12, 6-8 ≤ 20, 9-12 ≤ 35.
- Name the thing the student sees, not the implementation. "Launch speed", not
  "initial velocity magnitude".
- Taglines say what the student *does*: "Launch it, watch the arc, and find out
  what really controls where it lands."

## Before you call a sim done

- [ ] `npm run typecheck` and `npm test` pass.
- [ ] A golden test compares the model against a closed-form solution where one
      exists, with the expected value written out.
- [ ] It reads correctly in both light and dark themes.
- [ ] Every band in `bands` yields a sensible control set and stage.
- [ ] Defaults are productive on load — never an empty canvas.
- [ ] Readouts are finite from the first frame (there is a test for this).
- [ ] The misconception the sim targets is actually confrontable in Explore mode.
