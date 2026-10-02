# Build plan — completing the Grade 6-8 catalogue

## 1. Exact remaining work

| | |
|---|---|
| Topics total | 100 |
| Topics done | 12 (Grade 6 units A, B) |
| **Topics remaining** | **88** |
| **Simulations remaining** | **452** (one per subtopic) |
| Simulations built | 129 |
| Target | ~581 |

Remaining by grade: **Grade 6** 22 topics · **Grade 7** 33 · **Grade 8** 33.

## 2. Work split — 16 slices, one agent each

A slice is one curriculum unit, so an agent holds a coherent body of science
rather than scattered topics. Sizes are even: 4-6 topics, 24-34 simulations.

| Slice | Unit | Topics | Sims | Leans on |
|---|---|---|---|---|
| 1 | G6-C Energy, Heat, Thermal | 4 | 24 | labware (burner, beaker) |
| 2 | G6-D Water, Atmosphere, Weather | 6 | 34 | scene (sky, ground) |
| 3 | G6-E Regional Climate, Heredity | 6 | 32 | organic (cells, Punnett) |
| 4 | G6-F Global Warming, Human Impact | 6 | 31 | charts, scene |
| 5 | G7-A Atoms and Structure of Matter | 5 | 26 | spheres, glassware |
| 6 | G7-B Chemical Reactions | 6 | 30 | labware (full glassware) |
| 7 | G7-C Chemistry of Being Alive | 5 | 25 | organic (chloroplast) |
| 8 | G7-D Matter and Energy in Ecosystems | 6 | 30 | organic, charts |
| 9 | G7-E Earth's Materials, Moving Plates | 6 | 30 | landform art (new) |
| 10 | G7-F Natural Hazards, Engineering | 5 | 25 | landform, charts |
| 11 | G8-A Motion, Forces, Collisions | 6 | 30 | labware (cart, spring) |
| 12 | G8-B Energy in Moving Systems | 5 | 25 | labware, charts |
| 13 | G8-C Noncontact Forces and Fields | 5 | 25 | labware (magnet, battery) |
| 14 | G8-D Waves and Information | 5 | 25 | wave art (new) |
| 15 | G8-E Space Systems and Deep Time | 6 | 30 | space art (new) |
| 16 | G8-F Evolution and Biodiversity | 6 | 30 | organic, charts |

## 3. Order of execution

**Phase A — close the art gaps first (blocking).**
Four slices need primitives that do not exist yet. Building them before the
agents start is what stops those slices producing placeholder circles:

- `landform` — strata layers, plate cross-section, volcano, river valley (slices 9, 10)
- `wave` — transverse and longitudinal medium, spectrum band, ray (slice 14)
- `space` — planet with terminator, orbit path, star body, moon phase (slice 15)
- `chart` — bar, line and scatter with axes, drawn to the same standard
  (slices 4, 8, 10, 12, 16)

**Phase B — Grade 6 completion (slices 1-4).** 4 agents in parallel.
**Phase C — Grade 7 (slices 5-10).** 6 agents in parallel.
**Phase D — Grade 8 (slices 11-16).** 6 agents in parallel.

Each phase: wire the registry, run the three checks, commit, deploy. A phase
that fails a check is fixed before the next one starts.

## 4. The three checks, run on every slice

Each piece is checked three times. These are three *different questions* —
running one check three times proves nothing.

**Check 1 — it compiles and the suite is green.**
`npx tsc -b --noEmit` · `npx vitest run` · `npm run build`. Automatic, per agent,
before it reports.

**Check 2 — it actually works in a browser.**
Load every new simulation, click its primary interaction, confirm state changes.
This is the check that caught the pixel-versus-normalised bug which made every
archetype simulation unclickable while looking perfectly fine.

**Check 3 — it looks right and is genuinely distinct.**
Screenshot each simulation, read the image back, and judge it against the
standard in §5. Confirm that within a topic no two simulations are the same
shape with swapped labels, and that every subtopic has exactly one.

## 5. Quality gates — a slice is rejected if any fail

**Coverage** — one simulation per subtopic, no more and no fewer. A topic with
six subtopics ships six simulations.

**Distinctness** — at least four different interaction kinds per topic. No
simulation may be another with different words.

**Science** — every `measure` returns textbook-checkable values. Real constants,
real relationships, no invented numbers.

**Graphics** — the standing requirement:

- Vivid, real-life colour in the brand's violet family; never muted or grey
- The subject fills the stage; never a small drawing in a large empty canvas
- Specular highlights, contact shadows, rim light; nothing flat
- Labels in pills on leader lines, always clear of the artwork
- Structure that carries meaning is drawn: cristae, meniscus, grana, filament
- Animated — things move, flow and pulse. A static picture is a failure
- No emoji; no raw floats in readouts; no text overlapping artwork

**UI/UX** — controls legible at a glance, the primary action obvious without
instruction, feedback immediate and felt, and a student never has to read a
paragraph before touching anything.

## 6. Risk controls, learned the expensive way

1. **Batch 4-6 agents, never 100.** A 100-agent fan-out cost roughly 1.3M tokens
   and delivered nothing; every agent was killed mid-write.
2. **One agent per file, always.** Two agents once wrote the same file at the
   same time and produced something that compiled for neither.
3. **Agents write incrementally** — simulation 1 reaches disk before simulation 2
   begins, so an interruption costs one rather than all.
4. **Agents never touch `src/engine/`, `src/ui/` or `registry.ts`.** Shared files
   are wired centrally after each phase.
5. **Engine bugs are fixed centrally.** An agent that finds one reports it rather
   than working around it: the trace-animation bug was found this way and fixed
   once for all seven traces.

## 7. Definition of done

- 100 topics, 521 subtopics, one simulation each
- All three checks passing on every slice
- Curriculum rewired so each topic points at its own simulations, with none
  serving more than one topic except where the science genuinely recurs
- Deployed, green, and screenshot-verified
