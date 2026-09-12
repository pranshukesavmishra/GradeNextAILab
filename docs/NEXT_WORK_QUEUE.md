# Next work queue — highest value first

1. **G6 Unit A build (ACTIVE)** — the founder's experiment book at
   docs/experiment-specs/G6-UnitA/ is the authoritative spec: 27 experiments
   (A1x5, A2x5, A3x5, A4x6, A5x6). A1.1 "Unplug the Aquarium" is being built
   first as the unit exemplar; the remaining topics fan out to its pattern,
   one owner agent per topic, each experiment verified (unit tests + the
   acceptance gate + npm run build) before the next. Register in registry.ts,
   link the curriculum subtopic, id scheme "g6.a1-1", files under
   app/src/sims/g6/.
2. **After G6-A is done and the founder approves**: ask for the next unit
   package; do not start a unit without its book.
3. **Kept-37 enhancements** — only on the founder's explicit suggestions;
   the 37 are otherwise frozen (ADR-6).
4. **Unresponsive-control queue** — 1 of 37 remains (phys.collisions massB,
   physics-at-defaults case); fold into any founder-approved collisions
   enhancement rather than touching the frozen sim now.
5. **Rig Engine (ADR-5)** — shared machinery adopted incrementally as kits
   emerge from unit builds; not a prerequisite (ADR-7).

Blocked: further unit packages come from the founder one at a time.
