# LabKit — GradeNext Smart Lab Design System

> The specification for every pixel, token, control, and sound in Smart Lab.
> If a sim breaks a rule here, the sim is wrong.

**Status:** Specification v1.0 · **Date:** 2026-08-28 · **Applies to:** all ~164 sims, the catalog, presenter mode, and the Lab Notebook
**Implements:** [SMART_LAB_PLAN.md §6](./SMART_LAB_PLAN.md) · **Ships as:** `packages/ui-kit`

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing, Radius, Elevation, Motion](#4-spacing-radius-elevation-motion)
5. [Layout System](#5-layout-system)
6. [Component Library](#6-component-library)
7. [The Instrument Icon Set](#7-the-instrument-icon-set)
8. [Grade-Band UI Adaptation](#8-grade-band-ui-adaptation)
9. [Accessibility Specification](#9-accessibility-specification)
10. [Sound Design](#10-sound-design)
11. [Empty, Loading & Error States](#11-empty-loading--error-states)
12. [Voice & Tone](#12-voice--tone)
13. [The Do-Not-Do Gallery](#13-the-do-not-do-gallery)

---

## 1. Design Principles

### P1 — The phenomenon is the hero

**Means:** The stage owns ≥ 62% of viewport area at every breakpoint. Chrome is achromatic; color inside the stage carries meaning. Controls dock to edges and are dismissible.
**Forbids:** Any panel, dialog, tooltip, or hint that overlaps the stage's active region by default. Branding inside the stage. Decorative backgrounds behind a phenomenon.
**Example:** In *Projectile Motion*, the launcher, arc, and landing zone fill the frame; angle/speed/mass live in the right dock. The AI assistant is a 56px bubble until invoked, and when opened it takes dock width — it never becomes a floating window over the trajectory.

### P2 — Progressive disclosure

**Means:** First paint shows the 1–3 parameters that produce the sim's core insight, plus time controls. Everything else lives in collapsed `ParameterGroup`s ordered by pedagogical priority. Advanced overlays are opt-in and remembered per user, per sim.
**Forbids:** Shipping every exposed model parameter as a visible slider. "Advanced" groups open by default. More than 7 visible controls in any band below 9-12.
**Example:** *Pendulum* opens with Length and Gravity. Damping, drive amplitude, drive frequency, and the phase-space overlay are inside "More variables" — a 6-8 student who never opens it still discovers the period law.

### P3 — Immediate feedback, never an Apply button

**Means:** Every input commits on the same frame it changes. Parameters are live-editable during motion. Graphs, readouts, vectors, and the narrator all update from one state tick, so representations are always mutually consistent.
**Forbids:** Apply / Update / Run buttons for parameter changes. Debounced sliders. Any representation lagging another by more than one frame.
**Example:** Dragging *mass* mid-flight in *Collisions* changes momentum vectors, the energy bars, and the data table simultaneously — students see coupling, not a recomputation.

### P4 — Implicit scaffolding

**Means:** Guidance is carried by defaults, ranges, snap points, presets, and gentle highlight — not by prose. Slider ranges are chosen so the interesting regime is reachable; detents sit on pedagogically meaningful values.
**Forbids:** Instruction paragraphs on the stage. Modal "how to use this sim" walkthroughs. Any tutorial that must be dismissed before touching anything.
**Example:** The *Ohm's Law* voltage slider has detents at 1.5 V, 3 V, 4.5 V, 9 V — battery values. Students find the pattern by feel before anyone names it.

### P5 — Touch-first, mouse-refined

**Means:** Design at 44px targets and validate at 24px (WCAG 2.2 minimum); every drag has a keyboard and a tap-to-place equivalent; pinch-zoom and two-finger pan work on the stage; hover is enhancement only.
**Forbids:** Any function reachable only by hover, right-click, or drag. Controls closer than 8px edge-to-edge. Fixed-width canvases.
**Example:** `ToolChip` instruments can be dragged onto the stage *or* tapped to drop at stage center, then nudged with arrows.

### P6 — One physical language everywhere

**Means:** A quantity has the same color, arrowhead, dash pattern, icon, and unit format in all 164 sims. An instrument looks and behaves identically wherever it appears.
**Forbids:** Per-sim palettes. A sim "borrowing" force red for a decorative element. Renaming a shared instrument.
**Example:** Velocity is `--sci-velocity` blue with a single filled arrowhead in *Projectile*, *Collisions*, *Orbits*, and *Doppler*. A student who learns to read one arrow reads all of them.

### P7 — Delight without noise

**Means:** Motion and sound reward comprehension moments, not every click. Celebration is proportional to achievement and scales down with grade band. Micro-interactions ≤ 180ms.
**Forbids:** Confetti for routine actions. Looping ambient animation near the stage. Bouncing, pulsing, or attention-seeking idle chrome. Sound that plays without an explicit prior gesture.
**Example:** Completing a Challenge's third star plays a 640ms particle burst *anchored to the goal object*, plus a two-note chime. Recording a data point plays nothing and simply slides the new row in over 120ms.

### P8 — Data is a first-class citizen

**Means:** Every graph has a toggleable data table with identical values; every table exports CSV; every measurement is timestamped into the Lab Notebook with its units and precision.
**Forbids:** Graphs without axis labels, units, or scale readouts. Silent auto-rescaling with no indication. Numbers displayed to more precision than the model justifies.
**Example:** *Photosynthesis Rate* graph's "Table" tab shows the same 40 samples that plot the curve — and is the screen-reader alternative required by §9.

### P9 — Honest instruments

**Means:** Measurement tools behave like real equipment: they have ranges, resolutions, and readable faces; they can be misplaced and give a wrong answer. Precision shown matches instrument resolution.
**Forbids:** Instruments that magically snap to the "right" answer. Readouts with more digits than resolution. Hiding an instrument's range.
**Example:** The stopwatch reads to 0.01 s and starts when *you* press it — reaction-time error is real, discussable, and the point of the uncertainty lab.

---

## 2. Color System

### 2.1 The rule of two color worlds

**Chrome is achromatic.** Surfaces, ink, and lines are neutral; exactly one brand accent (`--lk-accent`) marks focus, selection, and primary action.
**The stage is chromatic.** Inside the stage, in legends, and in graph series, color *means a physical quantity* and nothing else.

This separation is what makes the semantic palette teachable: no student ever sees force-red on a button.

### 2.2 Core tokens — light theme (default)

```css
:root {
  /* Surfaces */
  --lk-surface-app:      #F2F5F9;   /* app background behind everything     */
  --lk-surface-stage:    #FBFCFE;   /* the canvas ground                    */
  --lk-surface-0:        #FFFFFF;   /* docks, sheets, cards                 */
  --lk-surface-1:        #F4F7FB;   /* grouped rows, inset wells            */
  --lk-surface-2:        #E9EEF6;   /* hover, track fills                   */
  --lk-surface-3:        #DCE4F0;   /* pressed, selected background         */

  /* Ink */
  --lk-ink-1:            #0C1424;   /* primary text, 16.1:1 on surface-0    */
  --lk-ink-2:            #35435E;   /* secondary text, 9.1:1                */
  --lk-ink-3:            #5C6B87;   /* tertiary, labels, 5.6:1              */
  --lk-ink-4:            #8493AD;   /* placeholder / disabled, 3.1:1 (non-text only) */
  --lk-ink-inverse:      #FFFFFF;

  /* Lines */
  --lk-line-subtle:      #E4EAF3;
  --lk-line:             #CFD9E8;
  --lk-line-strong:      #A9B7CD;

  /* Accent (UI only — never a quantity) */
  --lk-accent:           #4C5FD7;
  --lk-accent-hover:     #4152C4;
  --lk-accent-press:     #3746AB;
  --lk-accent-weak:      #E8EBFC;
  --lk-accent-ink:       #FFFFFF;

  /* Focus */
  --lk-focus-ring:       #4C5FD7;
  --lk-focus-halo:       #FFFFFF;   /* 2px inner halo so the ring reads on any ground */

  /* States (chrome only) */
  --lk-success:  #10794F;  --lk-success-weak:  #DFF3E9;
  --lk-warn:     #96590A;  --lk-warn-weak:     #FDF0D8;
  --lk-danger:   #BC2032;  --lk-danger-weak:   #FCE6E8;
  --lk-info:     #10559B;  --lk-info-weak:     #E1EDFA;
}
```

### 2.3 Core tokens — dark theme ("night lab")

```css
[data-theme="dark"] {
  --lk-surface-app:      #070A11;
  --lk-surface-stage:    #0B1018;
  --lk-surface-0:        #131A28;
  --lk-surface-1:        #1B2436;
  --lk-surface-2:        #253046;
  --lk-surface-3:        #303D57;

  --lk-ink-1:            #F3F6FB;   /* 15.4:1 on surface-0 */
  --lk-ink-2:            #C4CEDF;   /* 9.7:1  */
  --lk-ink-3:            #93A1B9;   /* 5.4:1  */
  --lk-ink-4:            #67758F;
  --lk-ink-inverse:      #0C1424;

  --lk-line-subtle:      #212C41;
  --lk-line:             #2E3A52;
  --lk-line-strong:      #45536F;

  --lk-accent:           #93A3FF;
  --lk-accent-hover:     #A8B5FF;
  --lk-accent-press:     #7C8DF0;
  --lk-accent-weak:      #1E2547;
  --lk-accent-ink:       #0C1424;

  --lk-focus-ring:       #A8B5FF;
  --lk-focus-halo:       #070A11;

  --lk-success:  #4FD196;  --lk-success-weak:  #10291F;
  --lk-warn:     #F0BA4E;  --lk-warn-weak:     #2C2312;
  --lk-danger:   #FF8A94;  --lk-danger-weak:   #33161B;
  --lk-info:     #7FB6F5;  --lk-info-weak:     #10233A;
}
```

Theme selection: `[data-theme]` attribute set from user preference, defaulting to `prefers-color-scheme`. **Presenter mode forces light** unless the teacher overrides — projectors wash out dark themes.

### 2.4 The semantic science palette

**These tokens are locked platform-wide. They are never used decoratively — not for a button, a badge, a chart of usage statistics, a marketing gradient, or a mode indicator.** A reviewer rejects any PR that uses `--sci-*` outside the stage, a legend, or a graph series.

Uniqueness is guaranteed *within any set of quantities that can co-occur on one stage*. Cross-domain reuse (e.g. a violet appearing both in the momentum family and in the states-of-matter family) is permitted because those quantities never share a frame.

#### Mechanics & kinematics

| Quantity | Token | Light | Dark | Secondary encoding (mandatory) |
|---|---|---|---|---|
| Velocity | `--sci-velocity` | `#1F6FEB` | `#7BB2FF` | solid line, **single filled** arrowhead |
| Acceleration | `--sci-acceleration` | `#D9560B` | `#FFA45C` | solid line, **double** arrowhead |
| Force (applied/net) | `--sci-force` | `#C41F35` | `#FF8794` | thickest stroke, **open triangle** head |
| Momentum | `--sci-momentum` | `#7A38C4` | `#C4A3FF` | **notched tail**, arrowhead filled |
| Displacement | `--sci-displacement` | `#0D7A70` | `#5FDCC8` | **dashed 6/4**, single head |
| Friction | `--sci-friction` | `#7A6350` | `#C6AA8E` | **sawtooth** line |
| Normal force | `--sci-normal` | `#3E6DDA` | `#8FB0FF` | **dotted 2/3**, single head |

#### Energy (bar charts always add pattern + text label)

| Form | Token | Light | Dark | Pattern fill |
|---|---|---|---|---|
| Kinetic | `--sci-e-kinetic` | `#1D9A6C` | `#59D9A8` | solid |
| Gravitational potential | `--sci-e-grav` | `#5B57C9` | `#A6A2FF` | diagonal hatch ↗ |
| Elastic potential | `--sci-e-elastic` | `#C2820B` | `#F3C452` | diagonal hatch ↘ |
| Thermal | `--sci-e-thermal` | `#C0392B` | `#FF9184` | dots |
| Chemical | `--sci-e-chemical` | `#A32C8E` | `#EE95DA` | cross-hatch |
| Electrical | `--sci-e-electrical` | `#B08800` | `#F0CE45` | vertical rule |
| Radiant / light | `--sci-e-light` | `#D97706` | `#FFC061` | radial dots |
| Sound | `--sci-e-sound` | `#0E7C99` | `#63CBE8` | horizontal rule |
| Total | `--sci-e-total` | `var(--lk-ink-2)` | `var(--lk-ink-2)` | outline only |

#### Thermal ramp (sequential; also drives thermometer fill and heat maps)

| Stop | Light | Dark | Also encoded by |
|---|---|---|---|
| 0.00 coldest | `#0B3D91` | `#3D6FD1` | numeric readout + ramp legend with tick values; particle motion amplitude on stage |
| 0.20 | `#2E7FD1` | `#5FA0E8` | |
| 0.40 | `#7FC3E8` | `#9BD3F0` | |
| 0.55 neutral | `#EDE9DC` | `#4A5163` | |
| 0.70 | `#F2C05C` | `#F5CC72` | |
| 0.85 | `#E77A2B` | `#FF9C4D` | |
| 1.00 hottest | `#B21C1C` | `#FF6B6B` | |

#### Electricity, magnetism & fields

| Quantity | Token | Light | Dark | Secondary encoding |
|---|---|---|---|---|
| Positive charge | `--sci-charge-pos` | `#D93A47` | `#FF8A94` | **`+` glyph inside every marker** |
| Negative charge | `--sci-charge-neg` | `#2C6FD1` | `#7FB6F5` | **`−` glyph inside every marker** |
| Neutral | `--sci-charge-neutral` | `#8493AD` | `#7A8AA5` | **`○` glyph** |
| Electric field | `--sci-e-field` | `#8C43C9` | `#CB9CF5` | thin field lines, arrows at 48px intervals |
| Magnetic field | `--sci-b-field` | `#0E8F82` | `#4FD6C4` | dashed field lines; **⊗ into page / ⊙ out of page** |
| Current | `--sci-current` | `#C28800` | `#F5C63D` | flowing dots (static arrows under reduced motion) |
| Voltage (diverging) | `--sci-voltage-*` | `#2C6FD1` → `#EDE9DC` → `#D93A47` | `#7FB6F5` → `#3A4257` → `#FF8A94` | signed numeric readout always shown |

#### Chemistry

| Set | Mapping | Secondary encoding |
|---|---|---|
| Atoms | **CPK standard**: H `#F5F7FA` · C `#3B4351` · N `#2C6FD1` · O `#D93A47` · S `#D4B106` · P `#E07A2A` · Cl `#3E9B4F` · Na `#8C43C9` | element symbol rendered on every atom ≥ 20px; radius follows van der Waals ratios |
| pH ramp | 1 `#C7202C` · 2 `#E14A28` · 3 `#EE7F1C` · 4 `#F3A81E` · 5 `#F2CE15` · 6 `#C3D129` · 7 `#3E9B4F` · 8 `#2C9A8C` · 9 `#2C82BF` · 10 `#2A5CA6` · 11 `#3A3E96` · 12 `#4A2C8E` · 13 `#5A2382` · 14 `#6A1E6A` | **numeric pH always displayed**; acid/base word label; ramp legend with ticks |
| States of matter | Solid `#3E6DDA` · Liquid `#0E8F82` · Gas `#D9560B` · Plasma `#A32C8E` | particle **spacing and motion** encode state independently; text label on the container |

Dark-theme chemistry values lighten by ~18% L\*; the full pairs live in `packages/ui-kit/tokens/science.dark.css`.

#### Biology

| Set | Mapping | Secondary encoding |
|---|---|---|
| DNA/RNA bases | A `#2CA25F` · T `#D6273E` · U `#C2569C` · G `#E8A33D` · C `#2E7FD1` | **the base letter is always drawn**; complementary pairs share a notch shape |
| Trophic levels | Producer `#3E9B4F` · Primary consumer `#DDAF28` · Secondary `#E07A2A` · Tertiary/apex `#BF3B2B` · Decomposer `#7A5C3E` | level number badge (1–4, D) + organism silhouette |
| Genotype | Dominant allele `#5B57C9` · Recessive `#C2820B` | uppercase/lowercase letter glyph (B/b) is primary; color is support |

### 2.5 Colorblind safety — the non-negotiable rule

> **Color is never the only channel.** Every semantic color pairs with at least one of: shape, arrowhead style, dash pattern, pattern fill, glyph, or an always-visible text label.

Enforcement:

- **CI check.** `pnpm test:a11y-color` renders each sim's legend and asserts every series declares a `pattern` or `glyph` alongside its `color`.
- **Deuteranopia/protanopia simulation** in the sim QA harness; a reviewer must be able to answer the sim's core question in the simulated view.
- **The velocity/acceleration pair** (blue/orange) and **charge pair** (red/blue) are the two most confusable in deuteranopia; both carry mandatory glyph or arrowhead differentiation above.
- **Contrast:** every stage line/arrow maintains ≥ 3:1 against `--lk-surface-stage`. Filled regions may go below only when an outline at ≥ 3:1 is drawn.
- A **Colorblind-safe patterns** toggle in Settings raises all pattern fills from decorative-weight to high-contrast weight and adds inline labels to every vector.

---

## 3. Typography

### 3.1 Faces

| Role | Face | Notes |
|---|---|---|
| UI | **LabKit Sans** (Plus Jakarta Sans Variable), fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Friendly geometric; variable weight 400–800 |
| Early reader (K-2) | LabKit Sans with `font-feature-settings: "ss01"` | Single-story **a** and **g** — matches classroom print |
| Numeric / data | LabKit Sans with `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "zero"` | Slashed zero, fixed-width digits so readouts don't jitter |
| Math | **KaTeX** (KaTeX_Main / KaTeX_Math) | Inline math scaled to `1.08em` to match surrounding x-height |
| Code / CSV preview | **JetBrains Mono** | Notebook code blocks, export previews only |
| Accessibility option | **Atkinson Hyperlegible** | User setting "Dyslexia-friendly type"; swaps UI face globally, never math |

### 3.2 Base type scale (9-12 band = 1.0×)

| Token | px / rem | Line height | Weight | Use |
|---|---|---|---|---|
| `--lk-type-display` | 40 / 2.5rem | 44px | 700 | Presenter titles, celebration |
| `--lk-type-h1` | 32 / 2rem | 38px | 700 | Sim title, catalog hero |
| `--lk-type-h2` | 24 / 1.5rem | 30px | 600 | Panel headers, lab step titles |
| `--lk-type-h3` | 20 / 1.25rem | 26px | 600 | `ParameterGroup` headers |
| `--lk-type-readout` | 20 / 1.25rem | 24px | 600 tnum | Live numeric values |
| `--lk-type-body-lg` | 18 / 1.125rem | 28px | 400 | Lab instructions, assistant replies |
| `--lk-type-body` | 16 / 1rem | 24px | 400 | Default |
| `--lk-type-body-sm` | 14 / 0.875rem | 20px | 400 | Dense tables, secondary |
| `--lk-type-label` | 13 / 0.8125rem | 16px | 600 | Control labels (sentence case, `0.005em`) |
| `--lk-type-caption` | 12 / 0.75rem | 16px | 500 | Units, hints, table headers |
| `--lk-type-micro` | 11 / 0.6875rem | 14px | 500 | Graph axis ticks **only** — never interactive |

### 3.3 Grade-band type ramps

Applied by setting `--lk-type-scale` on the shell root; all tokens derive with `calc()`.

| Band | `--lk-type-scale` | Body | Control label | Readout | Min interactive text | Max line length |
|---|---|---|---|---|---|---|
| **K-2** | `1.375` | 22px / 34px | 20px | 34px | 20px | 42ch |
| **3-5** | `1.1875` | 19px / 30px | 17px | 28px | 17px | 56ch |
| **6-8** | `1.0625` | 17px / 26px | 15px | 22px | 15px | 68ch |
| **9-12** | `1.0` | 16px / 24px | 13px | 20px | 13px | 76ch |

### 3.4 Labeling & reading level

- **Units are typographically subordinate:** value at `--lk-type-readout` weight 600, unit at `--lk-type-caption` weight 500 in `--lk-ink-3`, separated by a hair space. `12.4 m/s` — never `12.4m/s`.
- **Precision follows the model,** not the float. Each parameter declares `displayDigits`; the shell formats. Never render `9.800000000000001`.
- **Reading level ceilings** (Flesch-Kincaid, enforced by lint on all copy strings): K-2 ≤ 1.5 · 3-5 ≤ 4.0 · 6-8 ≤ 7.0 · 9-12 ≤ 10.0.
- **Symbols follow the band:** K-2 sees "How heavy", 3-5 "Mass", 6-8 "Mass (kg)", 9-12 "$m$ (kg)" with KaTeX.
- **Sentence case everywhere.** No ALL-CAPS labels — they slow early readers and break screen-reader pronunciation.

---

## 4. Spacing, Radius, Elevation, Motion

### 4.1 Spacing (4px base)

```css
--lk-space-0: 0;      --lk-space-1: 2px;   --lk-space-2: 4px;
--lk-space-3: 8px;    --lk-space-4: 12px;  --lk-space-5: 16px;
--lk-space-6: 20px;   --lk-space-7: 24px;  --lk-space-8: 32px;
--lk-space-9: 40px;   --lk-space-10: 48px; --lk-space-11: 64px;
```

Dock padding `--lk-space-5`; gap between controls `--lk-space-5` (9-12) up to `--lk-space-8` (K-2); minimum gap between any two hit targets **8px**.

### 4.2 Radius

```css
--lk-radius-xs: 4px;   --lk-radius-sm: 6px;   --lk-radius-md: 10px;
--lk-radius-lg: 14px;  --lk-radius-xl: 20px;  --lk-radius-2xl: 28px;
--lk-radius-pill: 999px;
```

Band mapping: K-2 uses `xl`/`2xl` on controls (soft, toy-adjacent); 9-12 uses `sm`/`md` (instrument-adjacent). Radius is the cheapest signal of "who this is for."

### 4.3 Elevation

| Level | Use | Light | Dark |
|---|---|---|---|
| `e0` | Flush surfaces | none | none |
| `e1` | Docks, cards | `0 1px 2px rgba(12,20,36,.06), 0 1px 1px rgba(12,20,36,.04)` | `inset 0 0 0 1px var(--lk-line-subtle)` |
| `e2` | Popovers, dropped tools | `0 4px 12px rgba(12,20,36,.10)` | `0 4px 12px rgba(0,0,0,.5), inset 0 0 0 1px var(--lk-line)` |
| `e3` | Bottom sheet, drawer | `0 -8px 28px rgba(12,20,36,.14)` | `0 -8px 28px rgba(0,0,0,.6), inset 0 0 0 1px var(--lk-line)` |
| `e4` | Modal (rare) | `0 16px 48px rgba(12,20,36,.20)` | `0 16px 48px rgba(0,0,0,.7)` |

**Dark theme replaces shadow with border.** Shadows are invisible on `#0B1018`; a 1px `--lk-line` inset does the separation work.

### 4.4 Motion

```css
--lk-dur-instant: 0ms;    --lk-dur-fast: 120ms;   --lk-dur-base: 180ms;
--lk-dur-slow:    260ms;  --lk-dur-sheet: 320ms;  --lk-dur-celebrate: 640ms;

--lk-ease-standard:   cubic-bezier(.2, 0, 0, 1);
--lk-ease-decelerate: cubic-bezier(.05, .7, .1, 1);
--lk-ease-accelerate: cubic-bezier(.3, 0, .8, .15);
--lk-ease-emphasis:   cubic-bezier(.2, 0, 0, 1.2);   /* sheets, celebration only */
```

| Transition | Duration | Easing |
|---|---|---|
| Hover / press feedback | `fast` | `standard` |
| Control value snap, chip drop | `fast` | `decelerate` |
| Panel expand/collapse, tab change | `base` | `standard` |
| Drawer, bottom sheet, dock slide | `sheet` | `emphasis` |
| Mode switch (Explore ↔ Lab ↔ Challenge) | `slow` | `standard` |
| Celebration burst | `celebrate` | `emphasis` |

**The prime motion rule:** *simulation motion is never animated by the design system.* Model motion comes from the engine's fixed-timestep loop at `DT = 1/120` with render interpolation. No CSS transition, spring, or tween ever touches an object whose position is model state. Interpolating a physical quantity for aesthetic smoothness is falsifying data.

**`prefers-reduced-motion: reduce`:**

| Category | Behavior |
|---|---|
| Chrome transitions | Reduced to `instant`; opacity cross-fade at 100ms retained for orientation |
| Sheets & drawers | Appear without slide; no overshoot |
| Celebration | Static badge + one-line message; no particles |
| **Model motion** | **Unchanged** — it *is* the content. Users needing less can use pause/step or reduce sim speed |
| Flow indicators (current dots, field animation) | Switch to static directional arrows |
| Trails / traces | Drawn instantly at full length rather than progressively |

---

## 5. Layout System

### 5.1 Regions

`Stage` · `Dock` (parameters) · `Rail` (tools) · `Drawer` (data) · `HUD` (time controls + mode) · `Assistant` · `Notebook`.

### 5.2 Breakpoints

| Token | Range | Layout |
|---|---|---|
| `xs` | < 480px | Phone portrait — stage + collapsed sheet |
| `sm` | 480–767 | Phone landscape / small tablet portrait |
| `md` | 768–1023 | Tablet portrait — bottom sheet dock |
| `lg` | 1024–1279 | Tablet landscape / small laptop — right dock, icon rail |
| `xl` | 1280–1679 | Laptop — right dock + labeled rail |
| `2xl` | ≥ 1680 | Desktop wide — dock + rail + pinned drawer |
| `presenter` | mode, not width | Stage + minimal HUD |

**Invariant:** the stage keeps ≥ 62% of viewport area at `md`+ and ≥ 55% at `xs`/`sm`. Docks that would violate this collapse to icons automatically.

### 5.3 Wireframes

**A. Desktop wide (`2xl`, ≥1680px)**

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ◀ Catalog   Projectile Motion        [Explore|Guided Lab|Challenge]  ☾ ⚙ │
├────┬────────────────────────────────────────────────┬─────────────────────┤
│ 📏 │                                                │  PARAMETERS         │
│ 📐 │                                                │  Launch angle  45°  │
│ ⏱ │                 S T A G E                       │  ●━━━━━━━━━━━━━━━━  │
│ 🌡 │            (canvas · 62%+ of area)              │  Speed      20 m/s  │
│ ⚖ │                                                │  ━━━━━●━━━━━━━━━━  │
│ 🔬 │                                                │  ▸ More variables   │
│ 🧲 │                                                │  ▸ Overlays         │
├────┴────────────────────────────────────────────────┤  ── Presets ──      │
│ ⏮ ⏸ ⏭ ⟲   speed 1.0×  ━━●━━   t = 2.41 s          │  [Earth][Moon][Mars]│
├─────────────────────────────────────────────────────┤                     │
│ DATA  [Graph ▾ y vs t] [Table] [＋ Record]  ⤓ CSV   │                🤖  │
│  y ┤    ⌒⌒⌒                                        │                     │
│    └──────────── t                                  │                     │
└─────────────────────────────────────────────────────┴─────────────────────┘
```

**B. Tablet landscape (`lg`, 1024–1279px)**

```
┌──────────────────────────────────────────────────────────┐
│ ◀  Projectile Motion    [Explore|Lab|Challenge]      ⚙  │
├───┬──────────────────────────────────────┬───────────────┤
│📏 │                                      │ Angle    45°  │
│📐 │            S T A G E                 │ ●━━━━━━━━━━  │
│⏱ │                                      │ Speed  20 m/s │
│🌡 │      (tool rail = icons only)        │ ━━━●━━━━━━━  │
│⚖ │                                      │ ▸ More        │
│⋯  │                                      │ [Earth][Moon] │
├───┴──────────────────────────────────────┴───────────────┤
│  ⏮ ⏸ ⏭ ⟲    1.0×     t = 2.41 s      📸   📓   🤖     │
├──────────────────────────────────────────────────────────┤
│  ▲ Data (tap to raise)                                   │
└──────────────────────────────────────────────────────────┘
```

**C. Tablet portrait / phone (`xs`–`md`) — bottom sheet**

```
┌───────────────────────────┐   Sheet has 3 detents:
│ ◀ Projectile      ⚙  🤖 │   • peek  (96px)  — time controls only
├───────────────────────────┤   • half  (48vh)  — primary parameters
│                           │   • full  (88vh)  — all groups + data
│        S T A G E          │
│                           │   Tool rail becomes a horizontal
│                           │   scroll strip above the sheet.
│   📏 📐 ⏱ 🌡 ⚖ ⋯      │   Drag handle is a 44×5px pill,
├═══════════════╤═══════════┤   48px grab region.
│      ▭ (drag handle)      │
│  ⏮  ⏸  ⏭  ⟲   1.0×      │   Swipe up on the sheet = next detent.
├───────────────────────────┤   Stage never scrolls with the sheet;
│ Angle              45°    │   it resizes, and the model re-fits
│ ●━━━━━━━━━━━━━━━━━━━━   │   via a viewport transform (never a
│ Speed            20 m/s   │   re-scale of physical units).
│ ━━━━━━●━━━━━━━━━━━━━━   │
│ [Earth] [Moon] [Mars]     │
└───────────────────────────┘
```

**D. Presenter mode (any width, teacher-driven)**

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                     S T A G E  (full bleed)                   │
│                  type ramp forced to K-2 scale                │
│                  stroke weights ×1.5, labels ×1.4             │
│                                                               │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│   ⏮  ⏸  ⏭  ⟲      Angle 45°   Speed 20 m/s      Esc: exit  │
└───────────────────────────────────────────────────────────────┘
     ↑ HUD auto-hides after 4s idle; any input restores it.
     Laser cursor: 20px --lk-accent dot, 40% opacity trail 600ms.
```

### 5.4 Rearrangement rules

1. **The stage never moves.** Regions attach and detach around a stable stage; students keep their spatial model of the phenomenon.
2. **Dock right → sheet bottom** at `< 1024px`. Never a left dock: left is the tool rail's permanent home.
3. **Rail labels drop before rail icons.** Icons never drop; the rail becomes a horizontal strip at `< 768px`.
4. **The drawer is pinned only at `2xl`.** Below that it is an overlay drawer that dims nothing and can be dragged away.
5. **Orientation change preserves detent and scroll**; the model does not reset, pause, or lose recorded data.

---

## 6. Component Library

Shared conventions: all interactive components accept `size?: 'sm' | 'md' | 'lg' | 'xl'` (defaulting from the band), forward refs, expose `data-state`, and are built on Radix primitives where one exists. Minimum target **24×24px** (WCAG 2.2 AA), design target **44×44px**, K-2 target **72×72px**.

### 6.1 Slider — the workhorse

The single most-used control in the platform. Everything below is normative.

**Anatomy**

```
  Label ─────────────────────────── Value  Unit
  Launch angle                        45   °
  ┌──────────────────────────────────────────┐
  │  ╌╌╌╌╌╌●╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │ ← track (h), fill (left of thumb), thumb
  └──────────────────────────────────────────┘
     ▲     ▲        ▲                          ← detents (pedagogically meaningful values)
     0°   45°      90°                         ← end labels (6-8+ only)
```

| Element | Spec |
|---|---|
| Track height | sm 4px · md 6px · lg 10px · xl 16px; radius `pill`; `--lk-surface-2` |
| Fill | `--lk-accent`; **or** the parameter's `--sci-*` token when the parameter *is* that quantity (the one sanctioned chrome exception, because the slider then reads as an instrument for that quantity) |
| Thumb | sm 20px · md 28px · lg 40px · xl 56px circle, `--lk-surface-0`, 2px `--lk-line-strong` border, `e2` |
| Hit target | Full row height, min 44px (72px at K-2) — the whole row is draggable, not just the thumb |
| Value readout | Right-aligned, tabular numerals, `--lk-type-readout`; editable on click at 6-8+ (becomes a numeric input) |
| Detents | Optional `detents: number[]`; 6px haptic-style snap window; a 40ms micro-resistance on drag, and an optional tick sound |
| Ticks | `showTicks` renders 2px marks at detents in `--lk-ink-4` |

**States:** `idle` · `hover` (thumb grows 2px, track lightens to `--lk-surface-3`) · `focus` (3px `--lk-focus-ring` + 2px `--lk-focus-halo` offset) · `active` (thumb scales 1.06, value readout enlarges to `h3`, 120ms) · `disabled` (40% opacity, `--lk-ink-4`, cursor `not-allowed`, tooltip explains *why*) · `locked-by-lab` (padlock glyph, tooltip: "This step keeps mass the same") · `ai-adjusted` (2s `--lk-accent-weak` glow when the assistant sets it, plus a narrator announcement).

**Keyboard:** `←/→` or `↓/↑` = 1 step · `Shift` + arrow = 10 steps · `Alt` + arrow = 0.1 step (fine) · `PageUp/PageDown` = 10 steps · `Home/End` = min/max · `Enter` on the readout = type a value · `Esc` while dragging = revert to pre-drag value.

**Grade-band variants**

| Band | Height / thumb | Label | Value | Ticks | Behavior |
|---|---|---|---|---|---|
| **K-2** | 16px track, 56px thumb, 72px row | Icon + one word ("Heavy") | **None** — a 3-stop pictorial scale | 3 large detents with pictograms | Snaps to detents only; drag anywhere on the row; thumb is an object image (a weight) not a circle |
| **3-5** | 10px / 40px / 56px row | Word label ("Mass") | Integer, no unit symbol ("5 kg" as "5 kilograms") | 5 detents | Snaps to detents; fine drag disabled |
| **6-8** | 6px / 28px / 44px row | Label + unit ("Mass (kg)") | 1 decimal, editable | Optional | Continuous with soft detents |
| **9-12** | 6px / 28px / 44px row | Symbol + unit ("$m$ (kg)") | Model precision, editable, sci-notation supported | Min/max/detent labels | Continuous; `Alt` fine control; supports log scale |

```ts
interface SliderProps {
  id: string;
  label: string;                       // resolved per band by the copy layer
  value: number;
  onChange: (v: number) => void;       // fires every frame — must be cheap
  onCommit?: (v: number) => void;      // pointer-up / key-release; logs to the event stream
  min: number;
  max: number;
  step?: number;                       // default (max-min)/100
  scale?: 'linear' | 'log';            // log for frequency, spring constant, population
  unit?: string;                       // 'm/s' — rendered subordinate
  displayDigits?: number;              // overrides band default
  detents?: number[];
  detentLabels?: string[];             // K-2/3-5 pictograms or words
  showTicks?: boolean;
  quantity?: ScienceQuantity;          // 'velocity' | 'force' | ... → tints the fill
  band?: GradeBand;                    // inherited from shell; explicit override is rare
  size?: ControlSize;
  disabled?: boolean;
  lockedReason?: string;               // renders padlock + tooltip; never silently disabled
  icon?: InstrumentIcon;
  describedBy?: string;                // extra aria-describedby target
  sonify?: boolean;                    // pitch-maps value while dragging (§9.5)
}
```

### 6.2 Remaining controls

```ts
interface StepperProps {                 // discrete counts: batteries, bulbs, trials
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number;
  renderValue?: (v: number) => ReactNode;  // K-2 renders v objects, not a numeral
  size?: ControlSize; unit?: string;
}
// −/+ buttons ≥44px (72px K-2), press-and-hold repeats after 500ms at 8/s.
// Keyboard: arrows step; Home/End clamp. Buttons disable at bounds (never wrap).

interface ToggleProps {                  // boolean overlays: show vectors, show grid
  label: string; checked: boolean; onChange: (c: boolean) => void;
  icon?: InstrumentIcon; quantity?: ScienceQuantity;  // swatch shown when it toggles an overlay
  size?: ControlSize; disabled?: boolean; lockedReason?: string;
}
// Switch (not checkbox) at all bands. Track 44×24 (md) / 72×40 (K-2), 180ms standard.
// An overlay toggle shows the overlay's semantic color swatch + pattern chip inline.

interface SegmentedControlProps<T extends string> {   // 2–4 mutually exclusive options
  options: { value: T; label: string; icon?: InstrumentIcon }[];
  value: T; onChange: (v: T) => void;
  size?: ControlSize; fullWidth?: boolean;
}
// Radix RadioGroup underneath. Selection pill slides 180ms; arrows move & select;
// ≥5 options must become a PresetPicker or Select instead.

interface PresetPickerProps {            // "Earth / Moon / Mars", "Copper / Rubber / Silicon"
  presets: { id: string; label: string; thumbnail?: ReactNode; params: Record<string, number> }[];
  activeId?: string; onApply: (id: string) => void;
  layout?: 'chips' | 'cards';            // cards ≥ lg, chips below
}
// Applying a preset animates each affected slider to its new value over 260ms —
// the one place chrome animates a parameter, because seeing WHICH controls moved is the lesson.

interface ParameterGroupProps {
  title: string; defaultOpen?: boolean;
  badge?: string;                        // "3 changed"
  children: ReactNode;
  band?: GradeBand;                      // K-2 renders groups flat, never collapsed
}

interface TimeControlsProps {
  state: 'playing' | 'paused' | 'ended';
  onPlayPause: () => void; onStep: (frames: number) => void; onReset: () => void;
  speed: number; onSpeedChange: (s: number) => void;   // 0.1× – 100×, log slider
  elapsed: number; showElapsed?: boolean;
  history?: { duration: number; onScrub: (t: number) => void };
  band?: GradeBand;
}
// Play/pause is the largest control on the stage HUD (56px md, 88px K-2), always leftmost.
// Space toggles play/pause anywhere the stage has focus. "." steps one frame; "R" resets
// (with an undo toast for 5s — reset is destructive of an unrecorded run).
// Speed shows "slow-mo"/"fast" words at K-2/3-5, numeric multiplier at 6-8+.

interface ToolChipProps {                // draggable instrument in the rail
  instrument: InstrumentId; label: string;
  available: boolean; unavailableReason?: string;
  onDrop: (stagePoint: Point) => void; onTapPlace: () => void;   // tap-to-place = drag parity
  count?: number;                        // instruments already on stage
}
// 56×56 (md) / 88×88 (K-2). Drag ghost is the instrument at true stage scale, 70% opacity.
// Keyboard: Enter places at stage centre and moves focus to it.

interface MeasurementInstrumentProps {   // ruler, protractor, stopwatch, probe overlays
  instrument: InstrumentId;
  position: Point; rotation?: number;
  onMove: (p: Point) => void; onRotate?: (deg: number) => void; onRemove: () => void;
  reading: { value: number; unit: string; resolution: number };
  pinned?: boolean;                      // pinned instruments survive reset
}
// Every instrument: 24px grab margin, rotation handle at 32px, a readout bubble that
// flips side to avoid occluding what is measured, and a "×" at 32px.
// Keyboard: arrows move 1px, Shift+arrows 10px, "[" / "]" rotate 1°, Shift = 15° snap.
// Instruments obey their declared resolution — the ruler reads to 1mm, not to float.

interface GraphPanelProps {
  series: { id: string; label: string; quantity: ScienceQuantity;
            pattern: SeriesPattern; data: () => Float32Array }[];
  xAxis: AxisSpec; yAxis: AxisSpec;      // { label, unit, min?, max?, autoscale? }
  view: 'graph' | 'table';               // the table IS the a11y alternative — always present
  onViewChange: (v: 'graph' | 'table') => void;
  onExport: (fmt: 'csv' | 'png') => void;
  onSendToNotebook: () => void;
  crosshair?: boolean; maxSamples?: number;   // ring buffer, default 4000
}
// Canvas-rendered at 60fps. Autoscale changes are announced ("y-axis now 0 to 40 metres")
// and marked with a 120ms axis flash — silent rescaling misleads.

interface DataTableProps {
  columns: { key: string; label: string; unit?: string; digits: number }[];
  rows: Record<string, number>[];
  onRecord?: () => void;                 // the manual "record data point" button
  onDeleteRow?: (i: number) => void; onExport: () => void;
  sortable?: boolean; maxHeight?: number;
}
// Tabular numerals, right-aligned numerics, sticky header, zebra at --lk-surface-1.
// New rows slide in over 120ms and are announced politely ("Trial 4 recorded, 2.41 seconds").

interface SnapshotButtonProps { onCapture: () => Promise<Snapshot>; destination: 'notebook' | 'download'; }
// Captures stage + full parameter state + instrument readings. 120ms flash (suppressed
// under reduced motion), then a toast: "Saved to your notebook." Never a modal.

interface ModeSwitcherProps {
  mode: 'explore' | 'lab' | 'challenge';
  onChange: (m: Mode) => void;
  available: Mode[]; progress?: Record<Mode, number>;
}
// SegmentedControl in the top bar. Switching preserves parameters; it never resets the model.

interface HintBubbleProps {
  text: string; anchor: 'stage-object' | 'control' | 'assistant';
  anchorId?: string; level: 'nudge' | 'hint' | 'answer';
  onDismiss: () => void; autoDismissMs?: number;   // default 12000 for nudge
}
// Anchored with a 10px tail to what it references; max 2 lines at 6-8+, 1 line at K-5.
// Never covers the object it points at — it flips side. One hint on screen at a time, ever.

interface CheckpointCardProps {          // Guided Lab step
  index: number; total: number; title: string; prompt: string;
  status: 'locked' | 'active' | 'passed' | 'retry';
  verification?: { met: boolean; description: string }[];   // live-checked conditions
  onSubmit?: () => void; onSkip?: () => void;
}
// Conditions tick green live as the student satisfies them — the checklist IS the feedback.
// "Retry" is never "Wrong": it says what was observed vs. what the step asks for.

interface ChallengeStarsProps { earned: 0|1|2|3; criteria: string[]; band?: GradeBand; }
// Stars fill left-to-right with a 260ms scale-in each, staggered 80ms. Criteria always
// visible before the attempt — no hidden scoring.

interface AssistantPanelProps {
  state: 'bubble' | 'panel';
  messages: AssistantMessage[];
  inputMode: 'chips' | 'text';           // 'chips' forced for K-5 (§7.6 of the plan)
  suggestedChips: string[];
  onSend: (text: string) => void; onChipSelect: (chip: string) => void;
  onParamProposal?: (p: ParamChange[]) => void;   // requires explicit student confirm
}
// The bubble is 56px (88px K-2) in the stage's least-busy corner, computed from the model's
// bounding box. Expands to dock width, never floats over the stage.

interface NotebookDrawerProps {
  entries: NotebookEntry[];              // snapshots, graphs, tables, notes
  onAddNote: () => void; onExportPdf: () => void;
  scaffold: 'draw-and-tell' | 'hoc' | 'full-report';   // by band
}

interface SimCardProps {                 // catalog
  sim: SimManifestSummary;
  preview: 'loop' | 'static';            // loop autoplays muted, pauses under reduced motion
  standards: StandardsTagProps[];
  progress?: { explored: boolean; labsDone: number; stars: number };
}
// 3:2 preview, title at h3, subject chip, grade-range pill, standards tags. Whole card is
// one link; nested actions are avoided so it stays a single tab stop.

interface StandardsTagProps { framework: 'NGSS' | 'CCSS-M'; code: string; title?: string; }
// Monospace-ish code chip in --lk-surface-2, hover/focus reveals the full PE text.
// Never a link out — the popover carries the text so nobody leaves the lab.
```

---

## 7. The Instrument Icon Set

The toolbox must read as **equipment**. The rules that produce that:

1. **Grid.** Drawn on a 24×24 grid with a 1px safe margin; live area 22×22. Exported at 24/32/40/56/88.
2. **Stroke.** 1.75px at 24px, scaling proportionally (2.33px at 32, 2.92px at 40, 6.4px at 88). Round caps, round joins. Never a hairline; never variable-width.
3. **Projection.** Strict **orthographic, straight-on** — front elevation for faced instruments (stopwatch, voltmeter, thermometer), plan view for flat instruments (ruler, protractor). **No 3/4 view, no perspective, no isometric.** Mixing projections is what makes an icon set look like clip-art.
4. **Two tones only.** Stroke in `currentColor`; one optional fill at 12% opacity marking the instrument's *reading surface* (the meter face, the liquid column, the scale pan). Fill never outlines a shape the stroke already carries.
5. **No gradients, no shadows, no highlights, no rounded-cartoon exaggeration.** The one sanctioned tint is the semantic color of what the instrument measures, applied to the fill: thermometer fill uses the thermal ramp mid-stop, ammeter fill uses `--sci-current`.
6. **Relative scale is preserved across the set.** The ruler is drawn longer than the stopwatch is wide; the graduated cylinder is taller than the pH probe's body. An icon set where everything fills the box equally reads as symbols, not tools.
7. **Rest orientation.** Ruler horizontal, protractor flat-edge down, stopwatch upright with crown at 12 o'clock, probes tip-down at 30° from vertical. Every instrument has exactly one canonical orientation, used in the rail, the notebook, and documentation.
8. **Minimum aperture 2px.** No enclosed gap narrower than 2px at 24px, or it fills in on a Chromebook's rendering.
9. **Optical, not mathematical, centering**, with 2px optical padding on all sides.
10. **The on-stage instrument is the same drawing, scaled** — the rail icon and the placed tool are one asset family, so the rail teaches what the stage will show.
11. **Never emoji. Never stock icons.** Emoji vary per platform, break at stroke weight, and destroy the equipment metaphor. (Emoji appear in *this document* as ASCII stand-ins only.)

**The 15:** ruler/tape · protractor · stopwatch · motion sensor · thermometer · balance scale · spring scale (force meter) · voltmeter · ammeter · multimeter probe · pH probe · magnifier · light meter · graduated cylinder · compass/field probe.

---

## 8. Grade-Band UI Adaptation

| Dimension | **K-2** | **3-5** | **6-8** | **9-12** |
|---|---|---|---|---|
| Control size | 72px targets, `xl` | 56px, `lg` | 44px, `md` | 44px, `md` |
| Radius | `2xl` (28px) | `xl` (20px) | `md` (10px) | `sm`/`md` (6–10px) |
| Max visible controls | **3** | 5 | 7 | Unlimited (grouped) |
| Groups | Flat, never collapsed | 1 collapsed group max | Collapsed groups | Collapsed groups + advanced tab |
| Labels | Icon + one word | Word | Word + unit | Symbol + unit (KaTeX) |
| Numbers | **None** — pictorial scales | Integers, spelled units | Decimals, symbol units | Full precision, sci-notation, uncertainty |
| Graphs | None (pictographs only) | Bar/pictograph, pre-scaled | Line graph, 1–2 series, autoscale | Multi-series, log axes, fits, residuals |
| Help | Always-on narration + animated demo on idle 20s | Narrated hint on request | Text hints, Socratic chips | Assistant, equations, derivations |
| Instruments | 2 pre-placed, non-removable | 4 in rail | Full rail | Full rail + resolution/uncertainty settings |
| Sound | On by default (physical + UI + celebration) | On by default | Physical + UI on; celebration modest | Physical on; UI subtle; celebration minimal |
| Celebration | Full: particles, chime, character reaction, 900ms | Particles + chime, 640ms | Star fill + soft chime, 400ms | Badge + subtle check, 260ms |
| Text ceiling | 8 words on screen | 25 words | 60 words | No cap; still no instruction walls |
| Assistant input | Choice chips only | Choice chips only | Chips + short text | Free text |

### 8.1 One control across four bands: **mass**

```
K-2   ┌────────────────────────────────────────┐   Label: [feather icon] "Heavy?"
      │  🪶            ⬤             🧱       │   Three pictorial detents, snap only.
      │  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │   No number anywhere. Thumb is the object
      │  light      medium       heavy        │   itself. 72px row. Narrator: "Now heavy."
      └────────────────────────────────────────┘

3-5   Mass                                  5 kilograms
      ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ▲    ▲    ▲    ▲    ▲                        Five detents, integers only, spelled unit.

6-8   Mass (kg)                                    5.0
      ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      1                                        10   Continuous; readout editable; ends labelled.

9-12  m (kg)                                  5.00 ± 0.05
      ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      0.10                            [log] 100.0   Log toggle, Alt-fine, sci-notation input,
                                                    uncertainty shown when the lab declares one.
```

Band is a shell-level context (`<LabShell band="6-8">`); components read it. **A sim never forks its model for a band** — only its presentation. Students and teachers can change band at any time from the top bar; the model state survives the switch intact.

---

## 9. Accessibility Specification

Target: **WCAG 2.2 AA**, verified per sim before release. The hybrid architecture (real-DOM controls, canvas world) does most of the work; this section covers the rest.

### 9.1 Region navigation

`F6` / `Shift+F6` cycles landmark regions in order: **Stage → Parameters → Tools → Data → Assistant → Notebook**. Each region is a landmark with an `aria-label`. A visible "Skip to parameters" link is the first tab stop.

### 9.2 Focus model over canvas objects

The stage is `role="application"` with `aria-roledescription="simulation stage"` and a **parallel DOM layer**: an ordered list of transparent `<button>` proxies positioned over interactive model objects, each ≥ 24×24px, each with an `aria-label` describing object and state.

| Key | Action |
|---|---|
| `Tab` into stage | Focus the first object; stage outline appears |
| `Tab` / `Shift+Tab` | Next / previous object in reading order (left→right, top→bottom, then z-order) |
| `Enter` / `Space` | **Grab** the focused object (announced: "Grabbed cart. Use arrows to move.") |
| `Arrows` (grabbed) | Move by one grid step |
| `Shift` + arrows | Coarse — 10 steps |
| `Alt` + arrows | Fine — 0.1 step |
| `Enter` / `Space` again | Drop and announce the new position |
| `Esc` | Cancel the grab and restore the pre-grab position |
| `?` | Open the sim's keyboard-shortcut sheet |

Focus indicator on canvas objects is drawn *by the renderer* to match `--lk-focus-ring`: a 3px ring with a 2px `--lk-focus-halo`, at ≥ 3:1 against both the object and the stage.

### 9.3 The experiment narrator

A persistent `aria-live="polite"` region (`#lk-narrator`), also viewable as visible text via **Settings → Show narrator**. Throttled to one message per 900ms with coalescing (the newest supersedes an unspoken older one of the same category). `aria-live="assertive"` is reserved for errors and challenge outcomes; **physics events never interrupt**.

| Category | Trigger | Example string |
|---|---|---|
| Parameter | On commit, not per frame | "Launch angle 45 degrees." |
| Object state | Grab, drop, collision, boundary | "Cart 1 hit cart 2. Cart 1 now moving left at 0.8 metres per second." |
| Milestone | Model-declared event | "The projectile reached its highest point, 20.4 metres, at 2.0 seconds." |
| Measurement | Instrument reading changes ≥ its resolution | "Ruler reads 34 centimetres." |
| Data | Row recorded | "Trial 4 recorded. Angle 45 degrees, range 40.8 metres." |
| Graph | Autoscale or series toggle | "Y-axis now 0 to 40 metres. Velocity series shown." |
| Lab | Checkpoint condition met | "Checkpoint 2: mass is held constant. One condition remaining." |
| Error | Assertive | "The circuit is short-circuited. The battery is bypassed." |

A **Scene description** button (`D`) reads a fuller model-authored paragraph: "A cart of mass 2 kilograms rests at the 1-metre mark on a level track. A spring is compressed 8 centimetres behind it."

### 9.4 Data-table alternative

**Every `GraphPanel` ships a `DataTable` with identical values** — same samples, same precision, same units. It is not a lesser mode: it is the primary representation for screen-reader users, is the CSV export source, and is reachable at `T`. Table headers carry units in the header cell, not in every row.

### 9.5 Sonification hooks

Optional per sim (a quality tier, not a requirement), off by default, enabled in Settings:

- `sonify` on `Slider` maps value → pitch (200–1200 Hz, log) while dragging.
- **Graph traversal:** with a graph focused, `←/→` walks samples and plays pitch = y-value; discontinuities get a marker click.
- **Continuous model sonification** on flagship sims (pendulum period, wave frequency, current magnitude) mapped to a sustained tone with a hard −18 dBFS ceiling.
- Every sonification has a text equivalent; sound is never the only channel for anything.

### 9.6 Contrast & targets

| Requirement | Rule |
|---|---|
| Body & label text | ≥ 4.5:1 (all `--lk-ink-1/2/3` pairs verified above) |
| Large text (≥ 24px, or ≥ 19px bold) | ≥ 3:1 |
| UI component boundaries, focus ring, icons | ≥ 3:1 |
| Stage vectors, lines, instrument strokes | ≥ 3:1 against `--lk-surface-stage` |
| Target size | **≥ 24×24px** (WCAG 2.2 AA, 2.5.8); design target 44px; K-2 72px |
| Target spacing | ≥ 8px between adjacent targets, or 24px effective spacing |
| Timing | No sim requires a timed reaction except opt-in Challenges, which are pausable and retryable without limit (2.2.1) |
| Dragging | Every drag has a keyboard and tap-to-place equivalent (2.5.7) |
| Motion actuation | No sim requires device tilt or shake |
| Flashing | Nothing flashes above 3 Hz; strobe/spark effects are capped and reduced under `prefers-reduced-motion` |

---

## 10. Sound Design

Three categories, three volume buses, one rule.

| Category | What it is | Examples | Default | Bus |
|---|---|---|---|---|
| **Physical** | Sound the *phenomenon* makes; carries information | collision impact scaled to momentum, current hum scaled to amperage, heartbeat rate, wave frequency, Geiger clicks, boiling | On for all bands | `physical` |
| **UI feedback** | Confirms an action the student took | detent tick, tool drop, data point recorded, checkpoint met, toggle | On K-8, subtle 9-12 | `ui` |
| **Celebration** | Marks achievement | challenge star, badge earned, lab completed | Scales down by band (§8) | `celebration` |

**Design rules**

- **Physical sound is data.** Its pitch/volume maps monotonically to a model quantity, and the mapping is documented in the sim manifest. A collision at twice the momentum is audibly bigger. Never a stock "boing".
- **UI sound is short and quiet:** ≤ 120ms, ≤ −24 dBFS, one-shot, no tail. If two would overlap within 60ms, only the newest plays.
- **Celebration is the only sound allowed a musical interval** (a rising major third at one star, a triad at three).
- **Nothing plays before a user gesture** — Web Audio contexts start suspended and resume on first interaction, satisfying autoplay policy and classroom sanity.
- **Ceiling −18 dBFS** on all buses combined; no compression pumping; a 30-second silent-run test is part of sim QA.

**The mute model:** a single speaker control in the top bar with three states — **All on / Physical only / Muted** — plus per-bus sliders in Settings. State persists per user across sims and devices. Muting is remembered; nothing re-enables it. Presenter mode adds a one-tap mute for the whole class view.

**The never-required rule:** *no information is available only through sound.* Every physical sound has a visual analogue on the stage (impact flash, current-dot rate, waveform) and a narrator string. Sound is a second channel, never the only one.

---

## 11. Empty, Loading & Error States

Every state names what happened, what it means, and exactly one thing to do next. No dead ends, no stack traces, no apology paragraphs.

| State | Visual | Copy (6-8 default; band-adapted) |
|---|---|---|
| **Sim loading** | Stage shows a subtle skeleton of the scene's silhouette + a determinate progress bar once ≥ 20% is known. Controls render immediately, disabled. | "Setting up the lab…" |
| **Slow load (> 4s)** | Progress bar plus a line under it | "Still loading — school Wi-Fi can be slow. You can wait, or [Open a lighter version]." |
| **Sim failed to load** | Stage replaced by an illustrated broken-flask panel (line art, `--lk-ink-3`) | **"This experiment didn't start."** / "Something went wrong loading *Projectile Motion*. Your notebook is safe." / Buttons: **[Try again]** · [Report this] · [Back to catalog] / Fine print: `error PLAY-3021 · phys.projectile@1.4.0` |
| **Offline** | Persistent top bar strip, `--lk-warn-weak` | "You're offline. Sims you've opened before still work, and your data is saved on this device — it'll sync when you're back." |
| **Offline, sim not cached** | Card in the catalog | "This one needs a connection. [Show what works offline]" |
| **Device too slow** | Toast after 5s below 24fps | "Running slowly on this device. [Turn on Lite mode] — fewer particles, same physics." |
| **Empty data table** | Inset well, dashed border, `--lk-ink-3` | "No measurements yet. Run the experiment, then press **Record data** to add a row." |
| **Empty graph** | Axes drawn, plot area empty | "Pick something to graph." + inline series chips |
| **Empty notebook** | Illustrated notebook, `--lk-space-9` padding | "Your notebook is empty. Take a snapshot in any sim and it lands here." |
| **Catalog: no results** | Centred | "No sims match *photosynthesis grade 2*. Try [photosynthesis] or [Grade 2] on their own." |
| **Challenge failed** | Stage keeps the final state; card slides up | "Not this time — you landed at 8.2 m/s, and the goal is under 5. **[Try again]** · [Show me a hint]" — never "Wrong", never "Failed" |
| **Model diverged** (rare) | Model auto-pauses, stage frozen | "The simulation went unstable — those numbers are outside what this model handles. [Reset to last stable setup]" |
| **AI assistant unavailable** | In the panel | "The lab assistant is offline right now. The experiment still works — try changing one thing at a time and watching what happens." |
| **Saving** | Inline, near the action | "Saving…" → "Saved" (2s, then fades). Never a blocking spinner. |

---

## 12. Voice & Tone

**Who we sound like:** a good lab partner — curious, specific, never condescending, never hyped. We describe what happened and ask what's next.

### Rules

1. **Second person, active voice, present tense.** "You changed the mass" — not "The mass has been changed."
2. **Name the observation before the concept.** "The bulb got dimmer. That's resistance."
3. **Never say "wrong", "failed", "incorrect", "error" to a student.** Say what was observed and what the goal is.
4. **Never say "simply", "just", "obviously", "of course".** They punish the confused.
5. **No exclamation marks below the celebration tier** — and at most one, ever.
6. **Never use "AI" as a subject.** The assistant says "Let's slow it down and watch the top of the arc", not "As an AI, I can help you".
7. **Units spelled out for K-5, symbols for 6-12.**
8. **Buttons are verbs:** Record data · Take snapshot · Try again · Show me. Never OK / Submit / Go.

### Do / Don't (real strings)

| Situation | Band | ✅ Do | ❌ Don't |
|---|---|---|---|
| Sim intro | K-2 | "Make the bulb light up." | "In this simulation you will explore the principles of electrical circuits." |
| Sim intro | 9-12 | "Vary the launch angle and find the range maximum." | "Welcome! This fun sim lets you learn all about projectile motion!" |
| Hint | 3-5 | "Try changing only the mass. Watch the graph." | "Hint: The correct answer is that mass does not affect the period." |
| Wrong result | 6-8 | "Your cart ended at 3.1 m/s. The goal is under 2. What could you change?" | "Incorrect. Try again." |
| Locked control | 6-8 | "This step keeps the mass the same, so it's locked." | "Disabled." |
| Checkpoint met | 6-8 | "Mass held constant — one condition to go." | "Success! Great job!! 🎉🎉" |
| Challenge won | 3-5 | "Three stars — you landed it softly every time." | "PERFECT!!! You are a genius!" |
| Error | 9-12 | "This experiment didn't start. Your notebook is safe. [Try again]" | "Oops! Something went wrong 😅" |
| Data prompt | 9-12 | "Record at least five trials before fitting a line." | "Please record data points in order to continue." |
| Offline | any | "You're offline. Your data is saved on this device." | "Network error: connection refused." |
| Assistant | 6-8 | "What happens to the period if you only change the length? Try it." | "The period is T = 2π√(L/g), so it increases with length." |

---

## 13. The Do-Not-Do Gallery

Each item is named for what our market research actually found. These are rejection criteria in design review.

1. **The GeoGebra-export slider.** A 2px gray track, a 12px thumb, a tiny label, no unit, no detents, no keyboard affordance. *Why it fails:* untouchable on a tablet, unreadable on a projector, and it tells you nothing about what it controls. → §6.1.
2. **The floating gray dialog over the action.** PhET-style panels parked on top of the phenomenon. *Why it fails:* it hides the thing you came to see, and on small screens it hides most of it. → P1: chrome docks to edges, never over the stage.
3. **The wall of instruction text.** A paragraph of setup prose before anything is touchable. *Why it fails:* it front-loads reading onto students whose reading is the bottleneck, and research shows exploration collapses when it appears. → P4: scaffold with defaults, ranges, and presets.
4. **The fixed desktop canvas.** An 800×600 applet in a scrollable page. *Why it fails:* it is the single loudest signal of a decade-old tool, and it makes Chromebooks and tablets second-class. → §5: the stage is fluid and the model re-fits by viewport transform.
5. **Decorative use of semantic color.** A red "Reset" button, a green "Start", an orange highlight bar — in a platform where red means force and green means kinetic energy. *Why it fails:* it dissolves the one thing that makes 164 sims feel like one lab. → §2.1: two color worlds; `--sci-*` never appears on chrome.
6. **Emoji as instrument icons.** 🌡️ for a thermometer, ⚖️ for a balance. *Why it fails:* they render differently on every OS, can't be stroke-matched, can't be tinted semantically, and turn equipment into stickers. → §7.
7. **The stacked checkbox column.** Fourteen checkboxes, one per overlay, no grouping, no hierarchy. *Why it fails:* it exposes the model's implementation instead of the pedagogy. → §6.2 `ParameterGroup` + `Toggle` with swatches; ≤ 7 visible controls below 9-12.
8. **The Apply button.** Change a value, then press Apply to see it. *Why it fails:* it breaks the causal link between action and consequence, which is the entire learning mechanism. → P3.
9. **Per-sim design.** Every sim its own layout, its own control style, its own color choices. *Why it fails:* students relearn the interface each time, so the interface — not the science — is the difficulty. → this document, applied to all 164.
10. **Animated model motion.** CSS-tweening a physical object for smoothness. *Why it fails:* it makes the picture lie about the physics, and the graph and the object disagree. → §4.4.
11. **Celebration inflation.** Confetti on every click, three exclamation marks, a mascot cheering routine actions. *Why it fails:* reward for nothing devalues reward for something, and it is the fastest way to lose 9-12 students. → P7, §8.
12. **The precision lie.** `9.800000000000001 m/s²` or a ruler reading to six decimals. *Why it fails:* it teaches students that measurement has no uncertainty. → P9, §3.4.

---

## Appendix — Definition of Done for a Sim's UI

A sim ships only when all of the following pass:

- [ ] Stage ≥ 62% of viewport at `md`+; nothing floats over it by default
- [ ] ≤ 3 (K-2) / 5 (3-5) / 7 (6-8) visible controls on first paint
- [ ] All four band ramps render without truncation, overflow, or overlap
- [ ] Every quantity uses its `--sci-*` token **plus** a second encoding; no `--sci-*` on chrome
- [ ] Deuteranopia and protanopia simulations remain answerable
- [ ] Full keyboard path: region cycling, object grab/move/drop, every control operable
- [ ] Narrator strings authored for all eight categories in §9.3
- [ ] Every graph has a value-identical data table and a CSV export
- [ ] All targets ≥ 24px with ≥ 8px spacing; verified on a real tablet
- [ ] `prefers-reduced-motion` verified; model motion unchanged, chrome motion suppressed
- [ ] All copy within the band's reading-level ceiling; no forbidden words (§12)
- [ ] Loading, failure, and offline states implemented with §11 copy
- [ ] 30 fps floor sustained on the reference 4 GB Chromebook, sound-muted run included
