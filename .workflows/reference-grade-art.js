export const meta = {
  name: 'reference-grade-art',
  description: 'Rebuild the anatomy, labware and organic art modules to photoreal medical-illustration standard, then verify each visually',
  phases: [
    { title: 'Rebuild', detail: 'One agent per art domain, rebuilt to reference standard' },
    { title: 'Judge', detail: 'Independent visual critics score each against the reference' },
    { title: 'Repair', detail: 'Fix whatever the critics reject' },
  ],
}

const STANDARD = `
## THE REFERENCE STANDARD (non-negotiable)

The founder supplied a photoreal 3D medical render as the bar: a full human
torso on a BLACK background showing, layered front to back — the skeleton
(ribs, clavicle, sternum, pelvis) in bone white; a complete arterial tree in
crimson and venous tree in deep blue, both branching recursively down to fine
capillary-scale twigs; yellow nerve networks; and anatomically correct organs
(wedge-shaped liver, J-shaped stomach, densely coiled small intestine framed by
the large intestine, green gallbladder, lobed lungs with visible texture).

Everything is richly saturated and lit. Nothing is a grey oval.

### What that means concretely for canvas drawing

1. **DARK GROUND.** Anatomy and space subjects render on near-black. Saturated
   reds, blues and yellows only sing against dark. A washed pale background is
   why the current work looks dead.
2. **RECURSIVE BRANCHING.** Vessels, nerves, bronchi, dendrites and roots must
   be drawn by a recursive function: each branch spawns 2-3 children at
   decreasing width and length with slight angular jitter, to at least 5 levels.
   Three straight lines is a failure. The reference shows HUNDREDS of vessels.
3. **TRACED SILHOUETTES, NOT PRIMITIVES.** Every organ is a multi-point bezier
   outline with its true anatomical shape. A heart is not an ellipse: it has a
   broad base, two ventricular lobes, an apex pointing down-left, and great
   vessels leaving the top. A liver is a wedge with a notch. Intestines are a
   continuous coiled tube, drawn as one long stroked path that folds back on
   itself many times, not a row of circles.
4. **LAYERED DEPTH.** Draw back-to-front: deep structures, then mid, then
   superficial, with the nearer layers casting soft shadow on those behind.
5. **MATERIAL SHADING.** Every filled shape gets a gradient along its own axis,
   a specular highlight up-left, and a darker rim. Flat fills are forbidden.
6. **DENSITY.** The reference is dense with detail. Sparse output reads as
   unfinished. Where a real structure has many parts, draw many parts.

### Hard rules
- TypeScript strict, no \`any\`. \`npx tsc -b --noEmit\` must be clean.
- Deterministic: never \`Math.random()\`. Seed from position or an explicit seed.
- Works in BOTH light and dark themes (dark is the primary for anatomy/space).
- No emoji. Comment WHY an anatomical or physical detail matters pedagogically.
- Import \`hexA\`, \`isDarkTheme\` from \`./scene\`; local mix/shade helpers are fine.

### Self-verification is mandatory
Write a scratch playwright harness that draws every exported function LARGE on a
1400x900 canvas, screenshot it, then **READ the PNG back with the Read tool** and
judge honestly against the standard above. Ask yourself: would a medical
illustrator or a physics teacher accept this? Iterate until the answer is yes.
Delete the harness before reporting.

Verify with: npx tsc -b --noEmit
Work in /home/user/GradeNextAILab/app. Read src/ui/organic.ts first — it is the
closest existing module to the standard. Do NOT edit files outside your assignment.
`

const DOMAINS = [
  {
    key: 'anatomy',
    file: 'src/ui/anatomy.ts',
    brief: `Rebuild \`src/ui/anatomy.ts\` completely to the reference standard. The current
file has only 18 curve calls across 2383 lines, which is why it renders grey
rectangles and ovals.

Export at minimum:
- \`anatomyStage(ctx, w, h, theme)\` — the dark ground the reference uses.
- \`skeleton(ctx, x, y, h, theme, opts)\` — ribcage with 12 curved rib pairs,
  sternum, clavicles, spine, pelvis. Bone white with subtle warm shading.
- \`vascularTree(ctx, root, kind, depth, theme, t)\` — RECURSIVE branching to 5+
  levels, arterial crimson or venous blue, tapering width, with animated blood
  cells travelling the larger branches.
- \`nerveTree(ctx, root, depth, theme, t)\` — yellow recursive branching with
  travelling action potentials.
- \`organ(ctx, x, y, size, which, theme, opts)\` — traced bezier silhouettes for
  heart (four chambers + great vessels), lungs (lobed, with bronchial tree),
  liver (wedge with notch), stomach (J-curve), smallIntestine (ONE long coiled
  stroked path), largeIntestine (framing colon), kidney (bean + hilum),
  gallbladder, pancreas, bladder, brain (real gyri and sulci via recursive
  wandering paths, cerebellum, brainstem), spinalCord, muscle (fibre striations).
- \`bodySystem(ctx, x, y, h, which, theme, t)\` — a full labelled system placed on
  the figure: circulatory, respiratory, digestive, nervous, muscular, skeletal,
  excretory. Composed from the parts above, layered correctly.
- \`neuron(ctx, x, y, size, theme, opts)\` — fractal dendrites (recursive, 4+
  levels), myelinated axon with nodes of Ranvier, terminal boutons, animated
  action potential.
- \`humanFigure(ctx, x, y, h, theme, opts)\` — correct proportions (head 1/7.5 of
  height), semi-transparent so systems show through.

The digestive tract and the vascular trees are the two hardest and most
important. Spend the effort there.`,
  },
  {
    key: 'labware',
    file: 'src/ui/labware.ts',
    brief: `Raise \`src/ui/labware.ts\` to the same reference standard for CHEMISTRY and
PHYSICS apparatus. The founder wants equipment that looks like real equipment.

Improve what exists and add what is missing:
- Glassware: thicker rolled rims, true refraction (what is behind the glass is
  displaced and tinted), caustic light patch cast on the bench, condensation
  droplets on a cold vessel, a proper curved meniscus.
- \`benchStage(ctx, w, h, theme)\` — a lab bench surface with material and depth.
- \`buretteStand\`, \`condenser\`, \`funnel\`, \`evaporatingDish\`, \`crucible\`,
  \`gasSyringe\`, \`balance\` (with a real pan and readout), \`thermometerProbe\`.
- \`bunsenFlame\` — improve to a real two-cone flame with luminous inner cone.
- Physics: \`opticalBench\` (rail with sliding carriers), \`lens\` and \`prism\` as
  real glass with caustics, \`pulley\` (grooved wheel with rope), \`inclinePlane\`,
  \`meterRule\`, \`forceMeter\` (spring scale with dial), \`circuitBoard\` with real
  components — resistors with colour bands, capacitors, switches with blades,
  ammeters and voltmeters with swept needles and mirrored scales.
- \`wireHarness(ctx, path, theme, t)\` — wires with thickness, insulation sheen,
  solder joints and animated charge carriers.

Every metal surface needs an anisotropic highlight; every glass surface needs a
bright vertical streak and a soft caustic. Flat fills are forbidden.`,
  },
  {
    key: 'organic',
    file: 'src/ui/organic.ts',
    brief: `Raise \`src/ui/organic.ts\` to the reference standard and extend it. It is the
best existing module but is still short of a medical render.

Improve:
- \`membrane\` — add a visible phospholipid bilayer texture at the rim (two
  leaflets of head groups), embedded transport proteins, and cytoplasmic
  streaming visible as drifting texture.
- \`nucleus\` — chromosomes as distinct condensed bodies when dividing, a real
  double envelope with a visible perinuclear space.
- \`mitochondrion\` — more cristae, matrix granules, a visible double membrane.
- \`chloroplast\` — grana stacks connected by stroma lamellae, starch grains.

Add:
- \`cellDividing(ctx, x, y, size, phase, theme, t)\` — mitosis with a real spindle
  apparatus, condensed chromosomes and a cleavage furrow, phase 0-1.
- \`dnaHelix(ctx, x, y, w, h, twist, theme, opts)\` — a true double helix with
  base-pair rungs colour-coded A/T/G/C and a readable major/minor groove.
- \`proteinChain\`, \`ribosomeTranslating\` — for gene-expression topics.
- \`tissueSheet(ctx, x, y, w, h, which, theme)\` — epithelial, muscle, nervous and
  connective tissue, each visually distinct at a glance.
- \`microscopeView(ctx, x, y, r, magnification, theme, draw)\` — a circular field
  of view with a bright rim, slight chromatic edge and a scale bar.
- \`pollenGrain\`, \`seed\`, \`rootHair\`, \`stomate\` — plant structures.`,
  },
]

phase('Rebuild')
log(`Rebuilding ${DOMAINS.length} art modules to the founder's reference standard`)

const built = await parallel(DOMAINS.map((d) => () =>
  agent(`${d.brief}\n\n${STANDARD}`, {
    label: `rebuild:${d.key}`,
    phase: 'Rebuild',
    effort: 'high',
  })))

phase('Judge')
log('Independent critics scoring each module against the reference')

const CRITIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'score', 'failures'],
  properties: {
    verdict: { type: 'string', enum: ['ACCEPT', 'REJECT'] },
    score: { type: 'integer', minimum: 1, maximum: 10 },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['what', 'where', 'fix'],
        properties: {
          what: { type: 'string' },
          where: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
  },
}

const judged = await parallel(DOMAINS.map((d, i) => () =>
  agent(
    `You are a hostile visual critic. Judge \`${d.file}\` in /home/user/GradeNextAILab/app
against the reference standard below. Default to REJECT unless it genuinely meets the bar.

${STANDARD}

Method: write a scratch playwright harness drawing EVERY exported function large
on a 1400x900 canvas at both light and dark themes, screenshot, and READ the PNGs
back with the Read tool. Look hard. Then judge.

REJECT if any of these are true:
- any structure is a plain ellipse, rectangle or circle where a real one is not
- branching goes fewer than 4 levels deep, or has fewer than ~30 visible branches
- any fill is flat (no gradient, no highlight, no rim)
- the anatomy or apparatus would not be recognised by a specialist
- output looks sparse where the real subject is dense
- text overlaps artwork, or labels overlap each other
- it fails in either light or dark theme

Report a score out of 10 and a concrete failure list. Each failure must name what
is wrong, where in the file, and the specific fix. Be specific and harsh: vague
criticism cannot be acted on. Delete your harness before reporting.

The builder reported: ${String(built[i] ?? 'no report').slice(0, 1200)}`,
    { label: `judge:${d.key}`, phase: 'Judge', effort: 'high', schema: CRITIC_SCHEMA },
  )))

const rejected = DOMAINS
  .map((d, i) => ({ d, j: judged[i] }))
  .filter((x) => x.j && (x.j.verdict === 'REJECT' || x.j.score < 8))

log(`${DOMAINS.length - rejected.length}/${DOMAINS.length} accepted; repairing ${rejected.length}`)

phase('Repair')
const repaired = await parallel(rejected.map(({ d, j }) => () =>
  agent(
    `Fix every failure a critic found in \`${d.file}\` (/home/user/GradeNextAILab/app).
It scored ${j.score}/10 and must reach the reference standard.

FAILURES TO FIX:
${j.failures.map((f, k) => `${k + 1}. ${f.what}\n   where: ${f.where}\n   fix: ${f.fix}`).join('\n')}

${STANDARD}

Fix all of them. Then screenshot your own work, READ the PNG back with the Read
tool, and confirm each failure is genuinely resolved before reporting. Delete the
harness. Report what you fixed and your honest visual judgement.`,
    { label: `repair:${d.key}`, phase: 'Repair', effort: 'high' },
  )))

return {
  rebuilt: DOMAINS.map((d) => d.key),
  scores: DOMAINS.map((d, i) => ({ module: d.key, score: judged[i]?.score ?? null, verdict: judged[i]?.verdict ?? 'unknown' })),
  repaired: rejected.map((x) => x.d.key),
  repairReports: repaired.filter(Boolean).length,
}
