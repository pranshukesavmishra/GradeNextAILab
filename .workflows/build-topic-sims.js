export const meta = {
  name: 'smartlab-per-topic-sims',
  description: 'Upgrade the scene kit, then build dedicated simulations for every Grade 6 Unit A/B topic',
  phases: [
    { title: 'Build', detail: 'One agent per curriculum topic, 4-5 dedicated sims each' },
    { title: 'Verify', detail: 'Adversarial quality and science check per topic' },
  ],
}

const APP = '/home/user/GradeNextAILab/app'

const KIT_BRIEF = `You are raising the shared rendering kit of GradeNext Smart Lab to a PREMIUM standard.

Work in ${APP}. Edit ONLY \`src/ui/scene.ts\` (you may add to it freely; keep every existing export working — many sims import them).

Context: the founder rejected the current visuals as "too low", "too basic", flat and unprofessional. The kit has: sky, starfield, groundPlane, vignette, sphere, contactShadow, material, glow, comet, badge, caption, hexA, lifted, isDarkTheme. That is a decent floor but nowhere near premium.

ADD high-end primitives that make canvas scenes look designed rather than diagrammed. At minimum:
- \`gradientFill(ctx, x, y, w, h, stops, angle)\` — multi-stop linear gradients at any angle.
- \`glass(ctx, x, y, w, h, r, theme)\` — frosted translucent panel with a light edge, for beakers, containers, HUD cards.
- \`metal(ctx, ...)\` and \`plastic(ctx, ...)\` — believable material shading with specular bands.
- \`softShadow(ctx, drawFn, {blur, dy, alpha})\` — reusable drop shadow wrapper.
- \`innerGlow\` / \`rimLight(ctx, path, color)\` — edge lighting that makes objects sit in the scene.
- \`particleField(ctx, pts, color, opts)\` — efficient batched particle rendering with size/alpha variation.
- \`arcGauge(ctx, cx, cy, r, frac, color, theme, label)\` — a premium circular gauge.
- \`ribbon(ctx, points, width, colorA, colorB)\` — a smooth tapered gradient ribbon for flows (energy, blood, currents, signals).
- \`dashFlow(ctx, points, color, phase, opts)\` — animated marching-ants flow along a path, for directional movement.
- \`gridPaper(ctx, w, h, theme, opts)\` — a refined engineering grid, far quieter than a hairline mesh.
- \`labelLeader(ctx, fromX, fromY, toX, toY, text, theme, opts)\` — a proper leader line with an elbow and a text plate, for anatomical/structural labelling. THIS IS IMPORTANT: many sims must label parts of a diagram cleanly without overlap.
- \`spriteShadowEllipse\`, \`bevelRect\`, \`hatchFill\`, \`noiseWash\` — texture and depth helpers.
- \`easeInOut(t)\`, \`pulse(time, hz)\`, \`spring(t)\` — animation easing helpers so motion feels designed, not linear.

Requirements:
- Pure Canvas 2D, no new dependencies.
- Every colour comes from the passed theme or an explicit colour argument. Respect \`isDarkTheme(theme)\` so everything works in both themes.
- Cheap enough for a low-end Chromebook: no per-pixel loops over the whole canvas, no allocation inside hot paths.
- Full TSDoc on each export explaining WHEN to use it, in the voice of the existing file.
- \`npx tsc -b --noEmit\` must pass.

Return a concise list of the exports you added with one line each on what it is for.`

const buildBrief = (t) => `You are building the dedicated simulations for ONE curriculum topic of GradeNext Smart Lab. Work in ${APP}.

## Your topic
Grade ${t.grade} · Unit ${t.unit} (${t.unitTitle}) · Topic ${t.topic}: ${t.topicTitle}
Subject: ${t.subject}${t.standards.length ? ' · NGSS: ' + t.standards.join(', ') : ''}

Subtopics you must cover:
${t.subtopics.map(s => `  ${s.code}  ${s.title}`).join('\n')}

## What to build
Create **${Math.max(4, Math.min(5, t.subtopics.length))} SEPARATE simulations**, each dedicated to this topic. Together they must cover EVERY subtopic above. Each sim covers one or two adjacent subtopics — do NOT build one giant sim.

These must be genuinely DIFFERENT KINDS of interactive experience, not the same thing reskinned. Draw from: a manipulable model, a build-it/assemble-it sandbox, a measurement investigation with data collection, a process animation the student drives and can step through, a sorting/classification challenge, a trace-the-path explorer, a comparison rig running two conditions side by side, a design-and-test loop.

Write them ALL into ONE file: \`src/sims/g${t.grade}/${t.unit.toLowerCase()}${t.topic.slice(1)}.ts\`
You own that file exclusively. Do NOT create or edit any other file. Do NOT touch registry.ts or the curriculum files.

Sim ids follow: \`g${t.grade}${t.topic.toLowerCase()}-<short-slug>\` (e.g. \`g${t.grade}${t.topic.toLowerCase()}-nested-systems\`).
Export each as a named const, e.g. \`export const g${t.grade}${t.topic.toLowerCase()}NestedSystems\`.

## Read these first
1. \`src/sims/physics/projectile.ts\` — the reference for structure AND visual quality. Match it.
2. \`src/ui/scene.ts\` — the premium scene kit. USE IT HEAVILY. This is how sims stop looking basic.
3. \`src/ui/draw.ts\` — arrows, camera, grid, energy bars.
4. \`src/engine/types.ts\` — the SimManifest contract.

## Quality bar — the founder rejected the last attempt as "too basic"
- Every sim must establish a PLACE, not a diagram: a real backdrop, real materials, depth, lighting.
- Objects are lit and shaded (\`sphere\`, \`material\`, \`glass\`, \`metal\`), never flat circles and rectangles.
- Things MOVE. Continuous, purposeful animation — flows, pulses, drifting particles, easing. Use the kit's easing/pulse helpers so motion feels designed.
- Label diagram parts with \`labelLeader\` so text never overlaps the artwork. Overlapping text is an automatic fail.
- Put live values on the stage with \`badge\` beside the thing they describe.
- Fill the stage: compute the camera from what actually happens; never leave most of the canvas empty.
- NO EMOJI anywhere — not in titles, taglines, labels, lab text or canvas drawing.
- Format every number: never dump a raw float like 3.4403669724770634.

## Each sim needs
- \`id\`, \`title\`, \`tagline\`, \`subject: "${t.subject}"\`, \`bands\` (include "6-8"; add "3-5" or "9-12" only where honest), \`grades\`, \`standards\`${t.standards.length ? ' (use ' + t.standards.join(', ') + ')' : ''}
- \`learningGoals\`, \`misconceptions\` (real wrong ideas it confronts)
- \`params\` the student manipulates, \`readouts\`/\`facts\` a test can assert on
- **2 guided labs** (each opening with a prediction step) and **2 challenges**
- Real science with real values a student could check against a textbook.

## Rules
- Colours ONLY from \`theme\` (\`theme.sci[...]\`, \`theme.ink\`, \`theme.accent\`) plus the scene kit's internal palettes. Never hardcode a hex in a sim.
- Randomness ONLY via \`ctx.rng\`. Never Math.random() or Date.now().
- The model is pure: \`step(state, dt, inputs, ctx)\` returns new state.
- No new npm dependencies.

## Verify before reporting
\`npx tsc -b --noEmit\` must pass with zero errors. If other agents' files have transient errors, ignore those and ensure YOUR file is clean.

Return the list of sims you built: for each, its id, export name, title, and which subtopic codes it covers.`

const BUILD_SCHEMA = {
  type: 'object',
  required: ['topic', 'grade', 'file', 'sims'],
  properties: {
    topic: { type: 'string' },
    grade: { type: 'number' },
    file: { type: 'string' },
    sims: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'exportName', 'title', 'subtopics'],
        properties: {
          id: { type: 'string' },
          exportName: { type: 'string' },
          title: { type: 'string' },
          subtopics: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['topic', 'passed', 'issues'],
  properties: {
    topic: { type: 'string' },
    passed: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
    fixed: { type: 'array', items: { type: 'string' } },
  },
}

const kit = 'already built and committed in a previous run'
log('Scene kit already committed (22 premium primitives). Fanning out one agent per curriculum topic.')

const topics = args
log(`Building dedicated simulations for ${topics.length} topics (~${topics.length * 4}-${topics.length * 5} sims)`)

const results = await pipeline(
  topics,
  (t) => agent(buildBrief(t), {
    label: `build:G${t.grade}-${t.topic}`,
    phase: 'Build',
    schema: BUILD_SCHEMA,
  }),
  (built, t) => {
    if (!built) return null
    return agent(
      `You are the quality gate for ONE topic's simulations in GradeNext Smart Lab. Work in ${APP}.

File: \`${built.file}\`
Topic: Grade ${t.grade} · ${t.topic} ${t.topicTitle}
Sims built: ${built.sims.map(s => s.id + ' (' + s.subtopics.join(',') + ')').join('; ')}
Subtopics that MUST all be covered: ${t.subtopics.map(s => s.code).join(', ')}

Be adversarial. Check and FIX in that file:
1. **Coverage** — is every subtopic above genuinely covered by some sim? Not just tagged: actually taught.
2. **Distinctness** — are these ${built.sims.length} sims genuinely different kinds of experience, or the same sim reskinned? If two are near-duplicates, rebuild one to a different interaction type.
3. **Science correctness** — are the values real and checkable? Fix anything wrong or made up.
4. **Visual quality** — does each render establish a place with lighting, depth and motion, or is it a flat diagram? Does any text overlap artwork? Is the stage filled? Improve any that fall short: use \`src/ui/scene.ts\` primitives (labelLeader for labels, glass/metal/material for objects, ribbon/dashFlow for flows, easing helpers for motion).
5. **No emoji anywhere**, and no unformatted floats.
6. **Determinism** — randomness only via ctx.rng.
7. Each sim has 2 labs (opening with a prediction) and 2 challenges.

Edit \`${built.file}\` directly to fix what you find. Do NOT touch any other file.
Then run \`npx tsc -b --noEmit\` and make sure YOUR file has zero errors.

Report what you found and what you fixed.`,
      { label: `verify:G${t.grade}-${t.topic}`, phase: 'Verify', schema: VERIFY_SCHEMA },
    )
  },
)

const built = results.filter(Boolean)
log(`Done: ${built.length}/${topics.length} topics verified`)
return { kit, topics: topics.length, verified: built.length, detail: built }