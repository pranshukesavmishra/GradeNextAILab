# The subtopic structure — every experiment in the curriculum

`SUBTOPIC_STRUCTURE.json` holds **all 521 curriculum subtopics** (Grade 6: 190,
Grade 7: 166, Grade 8: 165), generated from `app/src/curriculum/grade*.ts` so it
can never drift from the real curriculum. Each entry is one experiment:

```json
{ "code": "A4.4", "title": "The biosphere",
  "idea":   "what a student must be able to say afterwards — ONE thing",
  "design": "the experiment that teaches exactly that idea",
  "sim":    "g6.a4-4",  "status": "built" }
```

`status`: `built` (registered, tested, live) · `designed` (design written, not
yet built) · `design pending` (no design yet — never build from an empty design).

## The standard every experiment is built to

The founder named the bar explicitly — these already-approved simulations:

- **Physics**: Heat Transfer · Motion Graphs · Electromagnetic Spectrum ·
  Wave Machine · Collisions and Crumple Zones · Sound · Pendulum Lab ·
  Kinetic Energy · Optics Bench
- **Chemistry**: Heating Curve · Molecule Builder · Build an Atom ·
  States of Matter: Particle View · Gas Properties · Reaction Rates &
  Collisions · Conservation of Mass · pH & Acid-Base Lab
- **Earth & Space**: Why Earth Heats Unevenly · Radiometric Dating · The Water
  Cycle · The Weather Station · Weathering, Erosion and Deposition · Air Masses
  and Fronts · Earth's Four Spheres · Seasons & Sun Angle · Plate Tectonics ·
  Moon Phases & Eclipses · The Rock Cycle

What they have in common, and what every new experiment must therefore have:
a real integrated model running live; an apparatus you recognise; controls that
change the physics, not the picture; instruments that measure the model's own
state; graphs plotted from those measurements; predict-before-run labs; a
visible failure state; and repeatability — same setup, same result.

## Writing a design (pipeline step 1)

Before building, write the design into the entry's `design` field, in the
founder's nine-part shape:

1. **Name** — what a teacher would call it on the board.
2. **The question** — the one the experiment answers.
3. **The scene** — the whole apparatus, what a student sees on load.
4. **What the student does** — the physical gestures, not the widgets.
5. **The model** — governing equations/rules with REAL constants and units,
   what updates per tick, what is deliberately simplified and why.
6. **Controls** — each with widget, range, default, unit and visible effect;
   at least one must be structural (changes what exists, not just a value).
7. **What is measured** — readouts and graphs, all computed from state.
8. **The failure state** — what going wrong looks like, drawn on the objects.
9. **The fraud to avoid** — the specific fake version this must never become.

Then: `idea` must be one sentence a student could say afterwards, and the
built simulation's `learningGoals` must state it plainly (founder law 2).

## Order of work

Unit by unit, in curriculum order, one unit finished and verified before the
next opens. Where the founder supplies a spec book (`docs/experiment-specs/`)
it is ground truth; where none exists, the design is written here first.
