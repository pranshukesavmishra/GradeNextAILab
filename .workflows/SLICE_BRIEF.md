# Slice brief — building a unit's simulations

Read this before writing anything. It is the whole contract.

## What you produce

One file per topic, at `app/src/sims/topics/<code>.ts` (lower case, e.g. `g7a1.ts`).
Each file exports one `ArchetypeSpec`-built sim **per subtopic** of that topic —
no more, no fewer. Six subtopics means six exports.

Shape, copied from `app/src/sims/topics/g6c1.ts` (read it first, it is the model):

```ts
import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

const SOMETHING: ArchetypeSpec = { id: "g7a1-slug", title: "...", ... };
export const g7a1Slug = buildSim(SOMETHING);
```

`id` is `<topiccode>-<slug>`, all lower case. The export name is
`<topicCode><PascalSlug>`.

## Where the subtopics come from

`app/src/curriculum/grade6.ts`, `grade7.ts`, `grade8.ts`. Find your unit by its
`code`, then each `topic.code` and its `subtopics`. Every subtopic gets exactly
one simulation, and the simulation is about *that* subtopic, not the topic in
general.

## The spec vocabulary

`ArchetypeKind` is one of `sort`, `explore`, `investigate`, `process`,
`assemble`, `compare`, `trace`. **Use at least four different kinds per topic.**
A topic whose six sims are six sorts is rejected.

`Art` — how a specimen is drawn. The ones with real 3D behind them, which is
what you should reach for first:

| `art` | fields |
|---|---|
| `cell` | `plant?` |
| `organelle` | `which`: nucleus, mitochondrion, reticulum, chloroplast, golgi, vesicle |
| `microbe` | `which`: virus, bacterium |
| `glassware` | `which`: beaker, flask, testTube; `level?`, `color?`, `bubbles?`, `precipitate?` |
| `sphere` | `color?`, `radius?`, `glow?` |
| `molecule` | `formula`: H2O, CO2, CH4, O2, N2, NaCl, H2 |
| `atom` | `protons`, `neutrons`, `electrons` |
| `dna` | — |
| `planet` | `color`, `rings?`, `atmosphere?` |

These stay on the 2D kit, which for them is the better drawing:
`apparatus` (spring, cart, stand, bulb, battery, magnet, burner), `body`,
`landform`, `icon`.

Read `app/src/engine/archetype.ts` for the full interface — `variables`,
`measure`, `plot`, `stages`, `route`, `labs`, `challenges`.

## `drive` — the picture has to answer the controls

**Every `investigate` and every `compare` simulation must have a `drive`.** So
must anything else where the apparatus could visibly respond.

Without it a simulation is a photograph standing next to a calculator: the
slider moves, the readout changes, the graph draws a point — and the thing on
the bench sits there. That is not an experiment, and it is the single most
common way a simulation in this catalogue fails.

```ts
drive: ({ v, f, t, specimen, index }) => ({
  level: f.volume / 250,          // glassware fills as the reaction runs
  color: f.pH < 7 ? "#e0483f" : "#4a63f0",
  bubbles: f.rate,                // 0-1 intensity, or a count above 1
  scale: Math.cbrt(f.relativeVolume),   // the cell swells
  offset: [f.displacement / 4, 0],      // the cart moves
  glow: f.power / 60,             // the lamp brightens
  rate: f.burst ? 0 : 1,          // freeze it when it has broken
  spin, tilt, precipitate,
}),
```

`v` is the live control values, `f` is everything `measure` returned. It runs
every frame, so keep it cheap and allocate nothing you do not need.

Two rules that matter:

- **Scale by the right power.** Volume goes as the cube of the radius, so a
  cell at 1.65× its volume is 1.18× as wide. Drawing it 1.65× as wide teaches
  the wrong lesson.
- **Show the failure state.** If the model has a threshold — bursting, boiling,
  melting, breaking, saturating — cross it visibly: change the colour, stop the
  motion, add the precipitate.

Read `g6b2.ts`'s `MEMBRANE` spec for a worked example.

## Science

`measure` must return textbook-checkable values from real constants and real
relationships. No invented numbers. If you cannot compute it honestly, choose a
different variable. Say the number in `because` text where it helps — "a 2 kg
cart at 3 m/s carries 9 J" teaches more than "it has kinetic energy".

## Rules that exist because they were broken before

1. **Write one simulation at a time and save the file after each.** An
   interruption then costs one simulation, not the whole slice.
2. **Touch only your own topic files.** Never `src/engine/`, never `src/ui/`,
   never `registry.ts` — those are wired centrally. If you find an engine bug,
   report it, do not work around it.
3. **No `Math.random()` and no `Date.now()`.** Every simulation must be
   deterministic; hash from a seed or an index instead.
4. **No emoji anywhere.**

## Before you report

- `npx tsc -b --noEmit` from `app/` — clean for the files you wrote.
- `npx vitest run` — green.
- Report the exact export names you created, per file, so they can be wired.

Report format: one line per topic — `<code>: <n> sims — <export names>`.
