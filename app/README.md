# GradeNext Smart Lab — application

The simulation platform itself. See [`../docs/`](../docs) for the plans and specifications.

## Running it

```bash
cd app
npm install
npm run dev      # development server
npm run build    # production build
npm test         # engine, physics, and determinism tests
npm run typecheck
```

## How it is put together

```
src/
  engine/     the deterministic runtime — no DOM, no React, no rendering
    rng.ts        counter-based seeded PRNG, forkable per subsystem
    units.ts      SI quantities, display conversion, uncertainty, constants
    types.ts      the contracts every simulation implements
    loop.ts       fixed-timestep runner with replay and fingerprinting
    useSim.ts     the React binding
  ui/         LabKit — design tokens, stage, controls, graphing, lab runner
  sims/       one file per simulation, registered in registry.ts
  pages/      catalog, player shell, notebook
```

**The engine never imports from `ui/`, and simulations never touch the DOM.**
That boundary is what makes simulations testable, replayable, and portable.

Adding a simulation: see [`SIM_AUTHORING.md`](./SIM_AUTHORING.md).
