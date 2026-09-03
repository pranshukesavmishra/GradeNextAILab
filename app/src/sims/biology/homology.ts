import type { RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  caption, hexA, isDarkTheme, sky, sphere, vignette,
} from "@ui/scene";

/**
 * Homologous Structures — Grades 4-12.
 *
 * A human arm, a cat's foreleg, a whale's flipper and a bat's wing, drawn from
 * the same bone list because they are built from the same bone list. Slide
 * Align and the four limbs scale and rotate onto one another until the
 * correspondence is impossible to argue with: one humerus, one radius, one
 * ulna, a block of carpals, five metacarpals, five digits — in every one of
 * them, doing four completely different jobs.
 *
 * Then the control: a bat's wing and an insect's wing do exactly the same job
 * and share nothing. The insect wing has no bones at all. Same function is not
 * evidence of relatedness; same construction is.
 *
 * Bone counts are the standard adult counts. Where a group varies (cetacean
 * hyperphalangy, the reduced bat ulna) the comment says so and the value used
 * is typical rather than universal. Colour on this stage encodes bone identity
 * and nothing else, and the mapping is the same in all four animals — that
 * fixed mapping is the whole argument.
 */

/* ------------------------------------------------------------------ *
 * Limb anatomy
 * ------------------------------------------------------------------ */

export const BONE_GROUPS = [
  "humerus", "radius", "ulna", "carpals", "metacarpals", "phalanges",
] as const;
export type BoneGroup = (typeof BONE_GROUPS)[number];

export interface Limb {
  key: string;
  species: string;
  /** What the limb is actually used for. */
  use: string;
  /** How many bones of each kind. Zero means the animal has none. */
  bones: Record<BoneGroup, number>;
  digits: number;
  /** Segment lengths as fractions of the whole limb — each species' own. */
  prop: { humerus: number; forearm: number; carpal: number; metacarpal: number; phalanx: number };
  /** Resting pose angles, radians, and how widely the digits fan. */
  pose: { shoulder: number; elbow: number; wrist: number; spread: number };
  /** Thickness of the shaft relative to limb length. */
  stout: number;
}

export const LIMBS: Limb[] = [
  {
    key: "human", species: "Human", use: "grasping",
    bones: { humerus: 1, radius: 1, ulna: 1, carpals: 8, metacarpals: 5, phalanges: 14 },
    digits: 5,
    prop: { humerus: 0.33, forearm: 0.28, carpal: 0.06, metacarpal: 0.12, phalanx: 0.21 },
    pose: { shoulder: 0.25, elbow: 0.35, wrist: 0.05, spread: 0.22 },
    stout: 0.045,
  },
  {
    key: "cat", species: "Cat", use: "walking",
    // The cat's first digit is the dewclaw, with two phalanges rather than three.
    bones: { humerus: 1, radius: 1, ulna: 1, carpals: 7, metacarpals: 5, phalanges: 14 },
    digits: 5,
    prop: { humerus: 0.30, forearm: 0.30, carpal: 0.05, metacarpal: 0.20, phalanx: 0.15 },
    pose: { shoulder: 0.55, elbow: 0.5, wrist: 0.3, spread: 0.13 },
    stout: 0.04,
  },
  {
    key: "whale", species: "Whale", use: "steering",
    // Cetaceans show hyperphalangy: many more finger bones than other mammals.
    // 26 is typical for a dolphin flipper; the count varies between species.
    bones: { humerus: 1, radius: 1, ulna: 1, carpals: 6, metacarpals: 5, phalanges: 26 },
    digits: 5,
    prop: { humerus: 0.18, forearm: 0.16, carpal: 0.10, metacarpal: 0.20, phalanx: 0.36 },
    pose: { shoulder: 0.1, elbow: 0.12, wrist: 0.05, spread: 0.1 },
    stout: 0.06,
  },
  {
    key: "bat", species: "Bat", use: "flying",
    // The bat's ulna is present but greatly reduced and partly fused to the radius.
    bones: { humerus: 1, radius: 1, ulna: 1, carpals: 8, metacarpals: 5, phalanges: 11 },
    digits: 5,
    prop: { humerus: 0.16, forearm: 0.28, carpal: 0.04, metacarpal: 0.26, phalanx: 0.26 },
    pose: { shoulder: 0.2, elbow: 0.3, wrist: 0.1, spread: 0.5 },
    stout: 0.028,
  },
];

/** The two wings used as the control: same job, nothing else in common. */
export const BIRD_WING: Limb = {
  key: "bird", species: "Bird", use: "flying",
  // Bird carpals and metacarpals are fused into a single carpometacarpus, and
  // only three digits remain.
  bones: { humerus: 1, radius: 1, ulna: 1, carpals: 2, metacarpals: 3, phalanges: 5 },
  digits: 3,
  prop: { humerus: 0.30, forearm: 0.34, carpal: 0.10, metacarpal: 0.16, phalanx: 0.10 },
  pose: { shoulder: 0.2, elbow: 0.55, wrist: 0.2, spread: 0.18 },
  stout: 0.035,
};

export const INSECT_WING: Limb = {
  key: "insect", species: "Insect", use: "flying",
  bones: { humerus: 0, radius: 0, ulna: 0, carpals: 0, metacarpals: 0, phalanges: 0 },
  digits: 0,
  prop: { humerus: 0, forearm: 0, carpal: 0, metacarpal: 0, phalanx: 0 },
  pose: { shoulder: 0, elbow: 0, wrist: 0, spread: 0 },
  stout: 0,
};

export function limbByKey(key: string): Limb {
  if (key === "bird") return BIRD_WING;
  if (key === "insect") return INSECT_WING;
  return LIMBS.find((l) => l.key === key) ?? LIMBS[0];
}

/** How many bone groups two limbs both possess — the test of homology. */
export function sharedBoneGroups(a: Limb, b: Limb): number {
  let n = 0;
  for (const g of BONE_GROUPS) if (a.bones[g] > 0 && b.bones[g] > 0) n++;
  return n;
}

export function totalBones(limb: Limb): number {
  let n = 0;
  for (const g of BONE_GROUPS) n += limb.bones[g];
  return n;
}

/* ------------------------------------------------------------------ *
 * Vestigial structures
 * ------------------------------------------------------------------ */

export interface Vestigial {
  owner: string;
  part: string;
  wasFor: string;
}

export const VESTIGIAL: Vestigial[] = [
  { owner: "Human", part: "tailbone (coccyx)", wasFor: "a tail" },
  { owner: "Human", part: "ear-moving muscles", wasFor: "swivelling the ears" },
  { owner: "Whale", part: "pelvic bones", wasFor: "hind legs" },
  { owner: "Python", part: "pelvic spurs", wasFor: "hind legs" },
  { owner: "Kiwi", part: "tiny wings", wasFor: "flight" },
  { owner: "Cave fish", part: "eye sockets, no eyes", wasFor: "seeing" },
];

/* ------------------------------------------------------------------ *
 * A character matrix, and the tree it implies
 * ------------------------------------------------------------------ */

export const CHARACTERS = [
  "backbone", "jaws", "bony skeleton", "four limbs", "amniotic egg", "hair and milk", "placenta",
] as const;

export interface CladeTaxon {
  name: string;
  /** One flag per character, in the order above. */
  has: boolean[];
}

/**
 * A perfectly nested matrix: every character a taxon has, the taxa below it in
 * this list also have. That nesting is the evidence, and the tree is read off
 * it rather than assumed.
 */
export const CLADE_TAXA: CladeTaxon[] = [
  { name: "Lamprey", has: [true, false, false, false, false, false, false] },
  { name: "Shark", has: [true, true, false, false, false, false, false] },
  { name: "Frog", has: [true, true, true, true, false, false, false] },
  { name: "Lizard", has: [true, true, true, true, true, false, false] },
  { name: "Kangaroo", has: [true, true, true, true, true, true, false] },
  { name: "Cat", has: [true, true, true, true, true, true, true] },
  { name: "Human", has: [true, true, true, true, true, true, true] },
];

export function charactersShared(a: CladeTaxon, b: CladeTaxon): number {
  let n = 0;
  for (let i = 0; i < CHARACTERS.length; i++) if (a.has[i] && b.has[i]) n++;
  return n;
}

export function characterCount(t: CladeTaxon): number {
  return t.has.reduce((n, h) => n + (h ? 1 : 0), 0);
}

/**
 * Order the taxa by how many shared derived characters they carry. With a
 * nested matrix that ordering is the branching order of the tree.
 */
export function branchingOrder(): string[] {
  return CLADE_TAXA
    .map((t, i) => ({ name: t.name, n: characterCount(t), i }))
    .sort((a, b) => (a.n - b.n) || (a.i - b.i))
    .map((t) => t.name);
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  t: number;
  /** Eased alignment, 0 = natural pose, 1 = overlaid on one template. */
  align: number;
  /** Embryo development, 0 = pharyngula stage, 1 = recognisably different. */
  stage: number;
}

const model: SimModel<State> = {
  init(params) {
    return { t: 0, align: params.align as number, stage: params.stage as number };
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const target = params.align as number;
    const auto = params.autoAlign as boolean;
    // With auto-align on, the limbs breathe between poses so the stage is
    // never a still diagram — until the slider leaves zero, which takes the
    // pose into the student's hands; returning it to zero resumes the sweep.
    const t = state.t + dt;
    const align = auto && target === 0
      ? 0.5 - 0.5 * Math.cos(t * 0.55)
      : state.align + (target - state.align) * Math.min(1, dt * 4);
    const stageTarget = params.stage as number;
    const stage = params.view === "embryos" && auto
      ? 0.5 - 0.5 * Math.cos(t * 0.4)
      : state.stage + (stageTarget - state.stage) * Math.min(1, dt * 4);
    return { t, align, stage };
  },

  applyParams(state, params, prev) {
    if (params.align !== prev.align) return { ...state, align: params.align as number };
    if (params.stage !== prev.stage) return { ...state, stage: params.stage as number };
    return state;
  },

  readouts(state, params) {
    const a = limbByKey(params.limbA as string);
    const b = limbByKey(params.limbB as string);
    return [
      {
        key: "sharedGroups", label: "Bone kinds in both",
        quantity: q(sharedBoneGroups(a, b), "count"), semantic: "mass", graphable: false,
      },
      {
        key: "bonesA", label: `Bones in the ${a.species.toLowerCase()} limb`,
        quantity: q(totalBones(a), "count"), semantic: "distance", graphable: false,
      },
      {
        key: "bonesB", label: `Bones in the ${b.species.toLowerCase()} limb`,
        quantity: q(totalBones(b), "count"), semantic: "distance", graphable: false,
      },
      {
        key: "digitsA", label: "Digits, first limb", quantity: q(a.digits, "count"),
        semantic: "primary-consumer", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "digitsB", label: "Digits, second limb", quantity: q(b.digits, "count"),
        semantic: "primary-consumer", graphable: false, bands: ["6-8", "9-12"],
      },
      {
        key: "align", label: "Alignment", quantity: q(state.align, "percent"), unit: "%",
        semantic: "time", graphable: true, bands: ["6-8", "9-12"],
      },
    ];
  },

  facts(state, params) {
    const a = limbByKey(params.limbA as string);
    const b = limbByKey(params.limbB as string);
    const human = limbByKey("human");
    const bat = limbByKey("bat");
    const order = branchingOrder();
    return {
      view: params.view as string,
      align: state.align,
      embryoStage: state.stage,
      speciesA: a.species,
      speciesB: b.species,
      sharedBoneGroups: sharedBoneGroups(a, b),
      homologous: sharedBoneGroups(a, b) === BONE_GROUPS.length,
      sameJob: a.use === b.use,
      bonesA: totalBones(a),
      bonesB: totalBones(b),
      digitsA: a.digits,
      digitsB: b.digits,
      humanBatShared: sharedBoneGroups(human, bat),
      batInsectShared: sharedBoneGroups(bat, INSECT_WING),
      insectWingBones: totalBones(INSECT_WING),
      vestigialCount: VESTIGIAL.length,
      firstBranch: order[0],
      lastBranch: order[order.length - 1],
      humanCatShared: charactersShared(CLADE_TAXA[6], CLADE_TAXA[5]),
      humanSharkShared: charactersShared(CLADE_TAXA[6], CLADE_TAXA[1]),
    };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * Bone identity, and only bone identity. The same colour means the same bone
 * in every animal on the stage — that constancy is the evidence.
 */
function boneColor(g: BoneGroup, theme: RenderContext<State>["theme"]): string {
  switch (g) {
    case "humerus": return theme.sci["mass"];
    case "radius": return theme.sci["velocity"];
    case "ulna": return theme.sci["acceleration"];
    case "carpals": return theme.sci["field"];
    case "metacarpals": return theme.sci["distance"];
    default: return theme.sci["primary-consumer"];
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** The pose all four limbs converge on when the student aligns them. */
const TEMPLATE_POSE = { shoulder: 0.22, elbow: 0.3, wrist: 0.1, spread: 0.24 };

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, len: number, w: number, color: string, alpha: number,
) {
  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = mixHex(color, "#000000", 0.35);
  ctx.lineWidth = w + 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
  return { x: x2, y: y2 };
}

interface LimbDraw {
  x: number; y: number; length: number; align: number;
  alpha?: number; highlight?: string; labels?: boolean;
}

function drawLimb(rc: RenderContext<State>, limb: Limb, o: LimbDraw) {
  const { ctx, theme } = rc;
  const a = o.align;
  const alpha = o.alpha ?? 1;
  const L = o.length;
  const stout = limb.stout * L;
  const dim = (g: BoneGroup) =>
    !o.highlight || o.highlight === "all" || o.highlight === g ? alpha : alpha * 0.16;

  const shoulder = lerp(limb.pose.shoulder, TEMPLATE_POSE.shoulder, a);
  const elbow = lerp(limb.pose.elbow, TEMPLATE_POSE.elbow, a);
  const wrist = lerp(limb.pose.wrist, TEMPLATE_POSE.wrist, a);
  const spread = lerp(limb.pose.spread, TEMPLATE_POSE.spread, a);

  if (limb.bones.humerus === 0) {
    // An insect wing: a membrane on veins, and not one bone anywhere in it.
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = theme.sci["liquid"];
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.quadraticCurveTo(o.x + L * 0.5, o.y - L * 0.34, o.x + L, o.y - L * 0.05);
    ctx.quadraticCurveTo(o.x + L * 0.55, o.y + L * 0.2, o.x, o.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hexA(theme.ink, 0.5);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const f = i / 6;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.quadraticCurveTo(o.x + L * 0.5, o.y - L * 0.28 * f, o.x + L * (0.55 + 0.45 * f), o.y - L * 0.22 * f + L * 0.1);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  let ang = -shoulder;
  const p1 = drawBar(ctx, o.x, o.y, ang, L * limb.prop.humerus, stout * 2.2, boneColor("humerus", theme), dim("humerus"));

  ang += elbow;
  const forearm = L * limb.prop.forearm;
  // Radius and ulna run side by side: two bones, always, in all four animals.
  const nx = Math.sin(ang) * stout * 1.1;
  const ny = -Math.cos(ang) * stout * 1.1;
  drawBar(ctx, p1.x + nx, p1.y + ny, ang, forearm, stout * 1.3, boneColor("radius", theme), dim("radius"));
  const p2 = drawBar(ctx, p1.x - nx, p1.y - ny, ang, forearm, stout * 1.1, boneColor("ulna", theme), dim("ulna"));
  const wristX = (p1.x + Math.cos(ang) * forearm);
  const wristY = (p1.y + Math.sin(ang) * forearm);

  // Carpals as a cluster of small blocks; the count is the animal's own.
  const carpalR = Math.max(1.6, stout * 0.8);
  const nCarp = Math.min(limb.bones.carpals, 8);
  ctx.save();
  ctx.globalAlpha = dim("carpals");
  for (let i = 0; i < nCarp; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    sphere(
      ctx,
      wristX + Math.cos(ang) * (row * carpalR * 1.9) + Math.sin(ang) * ((col - 1.5) * carpalR * 1.9),
      wristY + Math.sin(ang) * (row * carpalR * 1.9) - Math.cos(ang) * ((col - 1.5) * carpalR * 1.9),
      carpalR, boneColor("carpals", theme),
    );
  }
  ctx.restore();

  // Digits: metacarpal, then the phalanges of that finger.
  ang += wrist;
  const handX = wristX + Math.cos(ang) * L * limb.prop.carpal;
  const handY = wristY + Math.sin(ang) * L * limb.prop.carpal;
  const digits = limb.digits;
  const perDigit = Math.max(1, Math.round(limb.bones.phalanges / Math.max(digits, 1)));
  for (let d = 0; d < digits; d++) {
    const off = (d - (digits - 1) / 2) * spread;
    const da = ang + off;
    const mc = drawBar(
      ctx, handX, handY, da, L * limb.prop.metacarpal, stout * 0.9,
      boneColor("metacarpals", theme), dim("metacarpals"),
    );
    let px = mc.x, py = mc.y;
    const segLen = (L * limb.prop.phalanx) / perDigit;
    for (let s = 0; s < perDigit; s++) {
      const seg = drawBar(
        ctx, px, py, da + off * 0.12, segLen * (1 - s * 0.06), stout * (0.7 - s * 0.05),
        boneColor("phalanges", theme), dim("phalanges"),
      );
      px = seg.x; py = seg.y;
    }
  }

  if (o.labels) {
    caption(ctx, o.x, o.y + 16, limb.species, theme, {
      align: "center", size: 12, color: theme.ink, weight: 700,
    });
    caption(ctx, o.x, o.y + 29, `for ${limb.use}`, theme, {
      align: "center", size: 10, color: theme.inkSoft,
    });
  }
  // Keeps the compiler honest that p2 is the anatomical end of the forearm.
  void p2;
}

function drawLegend(rc: RenderContext<State>, x: number, y: number, w: number) {
  const { ctx, theme, band } = rc;
  if (band === "3-5") return;
  const per = Math.min(96, w / BONE_GROUPS.length);
  for (let i = 0; i < BONE_GROUPS.length; i++) {
    const g = BONE_GROUPS[i];
    const gx = x + i * per;
    ctx.save();
    ctx.fillStyle = boneColor(g, theme);
    roundRect(ctx, gx, y - 4, 10, 8, 3);
    ctx.fill();
    ctx.restore();
    caption(ctx, gx + 14, y, g, theme, { size: 9, color: theme.inkSoft });
  }
}

function renderLimbs(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, overlays, band } = rc;
  const a = state.align;
  const cols = LIMBS.length;
  const L = Math.min(width * 0.34, height * 0.5);
  const baseY = height * (band === "3-5" ? 0.62 : 0.6);

  caption(ctx, 12, 16, "Same bones, four different jobs", theme, { size: 13, color: theme.ink, weight: 700 });
  caption(ctx, 12, 31, "Slide Align to stack them on top of one another", theme, {
    size: 10, color: theme.inkSoft,
  });

  for (let i = 0; i < cols; i++) {
    const spread = width * (0.16 + 0.68 * (i / (cols - 1)));
    // Aligned, every limb starts from the same shoulder and is drawn to the
    // same overall length, so only the proportions can differ.
    const x = lerp(spread, width * 0.2, a);
    const y = lerp(baseY - (i - 1.5) * 4, baseY, a);
    drawLimb(rc, LIMBS[i], {
      x, y, length: lerp(L * 0.62, L, a), align: a,
      alpha: a > 0.55 ? 0.45 + 0.55 * (1 - a) : 1,
      highlight: rc.params.highlight as string,
      labels: a < 0.6,
    });
  }

  if (a > 0.55) {
    caption(ctx, width * 0.5, height * 0.2, "one humerus · one radius · one ulna", theme, {
      align: "center", size: 13, color: theme.accent, weight: 700,
    });
    caption(ctx, width * 0.5, height * 0.2 + 16, "carpals · five metacarpals · five digits — in all four", theme, {
      align: "center", size: 11, color: theme.inkSoft,
    });
  }

  if (overlays.legend !== false) drawLegend(rc, 12, height - 14, width - 24);

  if (overlays.vestigial && band !== "3-5") {
    const v = VESTIGIAL[Math.floor(state.t * 0.35) % VESTIGIAL.length];
    caption(ctx, width - 12, 16, "vestigial:", theme, { align: "right", size: 10, color: theme.inkSoft });
    caption(ctx, width - 12, 30, `${v.owner} — ${v.part}`, theme, {
      align: "right", size: 11, color: theme.sci["mass"], weight: 700,
    });
    caption(ctx, width - 12, 43, `left over from ${v.wasFor}`, theme, {
      align: "right", size: 10, color: theme.inkSoft,
    });
  }
}

function renderAnalogy(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, band } = rc;
  const byFunction = params.grouping === "function";
  const three = [limbByKey("bat"), BIRD_WING, INSECT_WING];
  const L = Math.min(width * 0.26, height * 0.42);
  const baseY = height * 0.52;

  caption(ctx, 12, 16, "Three wings. Two of them are not related as wings.", theme, {
    size: 13, color: theme.ink, weight: 700,
  });

  for (let i = 0; i < three.length; i++) {
    const x = width * (0.18 + 0.32 * i);
    const flap = Math.sin(state.t * 2.4 + i * 1.1) * 0.12;
    ctx.save();
    ctx.translate(x, baseY);
    ctx.rotate(flap);
    ctx.translate(-x, -baseY);
    drawLimb(rc, three[i], { x, y: baseY, length: L, align: 0.6, labels: true });
    ctx.restore();
    caption(ctx, x, baseY + 44, `${totalBones(three[i])} bones`, theme, {
      align: "center", size: 11,
      color: totalBones(three[i]) === 0 ? theme.sci["force"] : theme.inkSoft, weight: 700,
    });
  }

  /* The bracket: grouping by job puts all three together, and is wrong. */
  const bracketY = height * 0.84;
  ctx.save();
  ctx.strokeStyle = byFunction ? theme.sci["force"] : theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (byFunction) {
    ctx.moveTo(width * 0.18, bracketY - 8);
    ctx.lineTo(width * 0.18, bracketY);
    ctx.lineTo(width * 0.82, bracketY);
    ctx.lineTo(width * 0.82, bracketY - 8);
  } else {
    ctx.moveTo(width * 0.18, bracketY - 8);
    ctx.lineTo(width * 0.18, bracketY);
    ctx.lineTo(width * 0.5, bracketY);
    ctx.lineTo(width * 0.5, bracketY - 8);
  }
  ctx.stroke();
  ctx.restore();

  caption(
    ctx, width * (byFunction ? 0.5 : 0.34), bracketY + 13,
    byFunction ? "grouped by job — bat, bird and insect together" : "grouped by bones — bat and bird share a forelimb",
    theme, { align: "center", size: 11, color: byFunction ? theme.sci["force"] : theme.accent, weight: 700 },
  );
  if (band !== "3-5") {
    caption(
      ctx, width / 2, height - 8,
      byFunction
        ? "But an insect wing has no bones at all. Same job is not evidence of family."
        : "Bat and bird forelimbs share every bone. The insect wing shares none of them.",
      theme, { align: "center", size: 10, color: theme.inkSoft },
    );
  }
}

/** Four embryos: nearly identical early, unmistakable later. */
function drawEmbryo(
  rc: RenderContext<State>, x: number, y: number, r: number, stage: number,
  name: string, tailLen: number, headSize: number, limbLen: number,
) {
  const { ctx, theme } = rc;
  const s = stage;
  // At the pharyngula stage every one of these is a comma with arches and a
  // tail. The species-specific numbers only take effect as s rises.
  const tail = lerp(1, tailLen, s);
  const head = lerp(1, headSize, s);
  const limb = lerp(0.25, limbLen, s);

  ctx.save();
  ctx.fillStyle = hexA(theme.sci["primary-consumer"], 0.85);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 0.75, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head
  sphere(ctx, x - r * 0.35, y - r * 0.55, r * 0.42 * head, theme.sci["primary-consumer"]);
  // Pharyngeal arches — the shared feature that makes the point.
  ctx.strokeStyle = hexA(theme.sci["acid"], 0.9);
  ctx.lineWidth = Math.max(1, r * 0.07);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.3, r * (0.3 + i * 0.08), -0.4, 0.8);
    ctx.stroke();
  }
  // Tail
  ctx.strokeStyle = hexA(theme.sci["primary-consumer"], 0.95);
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + r * 0.3, y + r * 0.5);
  ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.85, x + r * (0.5 + tail * 0.7), y + r * (0.3 + tail * 0.2));
  ctx.stroke();
  // Limb buds
  if (limb > 0.05) {
    ctx.lineWidth = Math.max(1.2, r * 0.11);
    for (const sy of [-0.15, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(x + r * 0.2, y + r * sy);
      ctx.lineTo(x + r * (0.2 + limb * 0.8), y + r * (sy + 0.25));
      ctx.stroke();
    }
  }
  ctx.restore();

  caption(ctx, x, y + r * 1.25, name, theme, { align: "center", size: 11, color: theme.ink, weight: 700 });
}

function renderEmbryos(rc: RenderContext<State>) {
  const { ctx, state, theme, width, height, band } = rc;
  const s = state.stage;
  const r = Math.min(width * 0.1, height * 0.22);
  const y = height * 0.46;

  caption(ctx, 12, 16, "Four embryos, early and late", theme, { size: 13, color: theme.ink, weight: 700 });
  caption(ctx, 12, 31, s < 0.4 ? "early: gill arches and a tail in every one" : "later: each one becomes itself", theme, {
    size: 11, color: s < 0.4 ? theme.accent : theme.inkSoft,
  });

  const set: [string, number, number, number][] = [
    ["Fish", 1.6, 0.9, 0.0],
    ["Chicken", 0.5, 1.1, 0.9],
    ["Pig", 0.35, 1.0, 1.0],
    ["Human", 0.05, 1.35, 1.0],
  ];
  for (let i = 0; i < set.length; i++) {
    const [name, tail, head, limb] = set[i];
    drawEmbryo(rc, width * (0.18 + 0.215 * i), y, r, s, name, tail, head, limb);
  }

  if (band !== "3-5") {
    caption(
      ctx, width / 2, height - 14,
      "A human embryo has a tail and gill arches. It does not keep them — but it builds them first.",
      theme, { align: "center", size: 10, color: theme.inkSoft },
    );
  }
}

function renderCladogram(rc: RenderContext<State>) {
  const { ctx, theme, width, height, band } = rc;
  const taxa = CLADE_TAXA;
  const left = width * 0.1;
  const right = width * (band === "3-5" ? 0.78 : 0.72);
  const top = 48;
  const bottom = height - 26;
  const rowH = (bottom - top) / taxa.length;

  caption(ctx, 12, 16, "Build the tree from shared characters", theme, {
    size: 13, color: theme.ink, weight: 700,
  });
  caption(ctx, 12, 31, "Each mark on the trunk is a feature that appeared once and was inherited", theme, {
    size: 10, color: theme.inkSoft,
  });

  const maxChars = CHARACTERS.length;
  const xForDepth = (d: number) => left + ((right - left) * d) / maxChars;

  // The trunk, and one branch per taxon leaving it where its characters stop.
  ctx.save();
  ctx.strokeStyle = hexA(theme.inkSoft, 0.85);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left, top + rowH * 0.5);
  ctx.lineTo(left, bottom - rowH * 0.5);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < taxa.length; i++) {
    const t = taxa[i];
    const y = top + rowH * (i + 0.5);
    const depth = characterCount(t);
    const bx = xForDepth(depth);
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(bx, y);
    ctx.stroke();
    ctx.restore();
    caption(ctx, bx + 8, y, t.name, theme, { size: 12, color: theme.ink, weight: 700 });
    if (band !== "3-5") {
      caption(ctx, bx + 8, y + 12, `${depth} shared features`, theme, {
        size: 9, color: theme.inkSoft,
      });
    }
  }

  // Character marks along the trunk, at the depth where each first appears.
  for (let c = 0; c < CHARACTERS.length; c++) {
    let firstRow = taxa.length;
    for (let i = 0; i < taxa.length; i++) if (taxa[i].has[c]) { firstRow = Math.min(firstRow, i); }
    const y = top + rowH * (firstRow + 0.5);
    const x = xForDepth(c + 1) - (right - left) / maxChars / 2;
    ctx.save();
    ctx.strokeStyle = theme.sci["field"];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left, Math.min(y, bottom - rowH * 0.5));
    ctx.lineTo(left, Math.min(y, bottom - rowH * 0.5) - rowH * 0.4);
    ctx.stroke();
    ctx.restore();
    if (band !== "3-5") {
      ctx.save();
      ctx.translate(x, top - 8);
      caption(ctx, 0, 0, CHARACTERS[c], theme, {
        align: "center", size: 8, color: theme.sci["field"],
      });
      ctx.restore();
    }
  }
}

function render(rc: RenderContext<State>) {
  const { ctx, params, theme, width, height } = rc;
  sky(ctx, width, height, theme, isDarkTheme(theme) ? "indoor" : "microscope");

  const view = params.view as string;
  if (view === "analogy") renderAnalogy(rc);
  else if (view === "embryos") renderEmbryos(rc);
  else if (view === "cladogram") renderCladogram(rc);
  else renderLimbs(rc);

  vignette(ctx, width, height, 0.12);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const LIMB_OPTIONS = [
  { value: "human", label: "Human arm" },
  { value: "cat", label: "Cat foreleg" },
  { value: "whale", label: "Whale flipper" },
  { value: "bat", label: "Bat wing" },
  { value: "bird", label: "Bird wing" },
  { value: "insect", label: "Insect wing" },
];

export const homologySim: SimManifest<State> = {
  id: "bio.homology",
  title: "Homologous Structures",
  tagline: "Stack a human arm, a cat's leg, a whale's flipper and a bat's wing on top of each other.",
  subject: "biology",
  bands: ["3-5", "6-8", "9-12"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-LS4-2", "MS-LS4-3", "HS-LS4-1"] },
  learningGoals: [
    "Recognise the same bones doing different jobs in different animals.",
    "Tell homologous structures from analogous ones, and say why the difference matters.",
    "Explain what a vestigial structure is evidence of.",
    "Read a cladogram, and build one from shared characters.",
  ],
  misconceptions: [
    "Animals that look alike must be closely related",
    "A whale is a kind of fish",
    "A bat and a bird are close relatives because both fly",
    "Vestigial means useless",
  ],
  interactionHint: "Drag Align from 0 to 1 and watch the four limbs come into register.",
  tickRate: 60,
  params: {
    view: {
      type: "option", label: "Evidence",
      options: [
        { value: "limbs", label: "Forelimbs, overlaid" },
        { value: "analogy", label: "Wings: same job, different bones" },
        { value: "embryos", label: "Early development" },
        { value: "cladogram", label: "Build a family tree" },
      ],
      default: "limbs",
    },
    align: {
      type: "number", label: "Align the limbs", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0,
      help: "At 1 all four are drawn to the same length from the same shoulder.",
    },
    autoAlign: {
      type: "boolean", label: "Sweep automatically", default: true,
      help: "Turn it off — or move the slider off zero — to hold the limbs where you want them.",
    },
    highlight: {
      type: "option", label: "Highlight one bone",
      options: [
        { value: "all", label: "All bones" },
        { value: "humerus", label: "Humerus" },
        { value: "radius", label: "Radius" },
        { value: "ulna", label: "Ulna" },
        { value: "carpals", label: "Carpals" },
        { value: "metacarpals", label: "Metacarpals" },
        { value: "phalanges", label: "Phalanges" },
      ],
      default: "all",
      bands: ["6-8", "9-12"],
    },
    grouping: {
      type: "option", label: "Group the wings by",
      options: [
        { value: "structure", label: "The bones inside" },
        { value: "function", label: "The job they do" },
      ],
      default: "structure",
      bands: ["6-8", "9-12"],
      help: "One of these two ways of grouping gives the wrong family tree.",
    },
    stage: {
      type: "number", label: "Development stage", kind: "ratio",
      min: 0, max: 1, step: 0.05, default: 0.2,
      bands: ["6-8", "9-12"],
    },
    limbA: {
      type: "option", label: "Compare this", options: LIMB_OPTIONS, default: "human",
      bands: ["6-8", "9-12"],
    },
    limbB: {
      type: "option", label: "with this", options: LIMB_OPTIONS, default: "bat",
      bands: ["6-8", "9-12"],
    },
  },
  overlays: [
    { key: "legend", label: "Bone key", default: true },
    { key: "vestigial", label: "Vestigial structures", default: true, bands: ["6-8", "9-12"] },
  ],
  model,
  render,
  labs: [
    {
      id: "same-bones",
      title: "Why do four different limbs have the same bones?",
      question: "An arm, a leg, a flipper and a wing. What do they have in common, and why?",
      bands: ["3-5", "6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS4-2"],
      setup: { view: "limbs", align: 0, autoAlign: false, highlight: "all", limbA: "human", limbB: "whale" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "Look at the four limbs before aligning them.",
          predict: {
            prompt: "How many of these four limbs contain a humerus, a radius and an ulna?",
            options: ["Only the human", "The human and the cat", "All four"],
            correct: 2,
            reveal:
              "All four. A whale's flipper and a bat's wing are built from exactly the bones in your own arm, in the same order.",
          },
        },
        {
          id: "align",
          phase: "measure",
          title: "Align them",
          instruction: "Slide Align to 1 and look at where each colour ends up.",
          check: {
            describe: "The limbs are aligned",
            test: (v) => (v.facts.align as number) >= 0.9,
          },
          hints: ["Turn the automatic sweep off first so you can hold it at 1."],
        },
        {
          id: "count",
          phase: "analyze",
          title: "Count the digits",
          instruction: "Compare a human arm with a whale flipper. How many bone kinds do both have?",
          check: {
            describe: "All six bone groups are in both",
            test: (v) => (v.facts.sharedBoneGroups as number) === 6,
          },
          requireData: 2,
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain it",
          instruction: "Say why four animals with completely different lives share one bone plan.",
          write: {
            prompt: "Why would a swimming animal and a flying animal be built from the same bones?",
            placeholder: "If they both inherited the plan from ...",
          },
        },
      ],
    },
    {
      id: "wings-that-are-not-related",
      title: "Do all wings mean the same thing?",
      question: "A bat, a bird and a dragonfly all fly. Does that make them relatives?",
      bands: ["6-8", "9-12"],
      minutes: 20,
      standards: ["MS-LS4-2", "MS-LS4-3"],
      setup: { view: "analogy", grouping: "function", limbA: "bat", limbB: "insect" },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict first",
          instruction: "All three wings do the same job.",
          predict: {
            prompt: "How many bones are inside an insect's wing?",
            options: ["None", "Three", "About the same as a bat's"],
            correct: 0,
            reveal:
              "None. An insect wing is a stiffened membrane on hollow veins. It flies as well as a bat's wing and shares nothing with it.",
          },
        },
        {
          id: "compare",
          phase: "measure",
          title: "Compare the bones",
          instruction: "Set the comparison to bat and insect and read the shared bone count.",
          check: {
            describe: "Bat compared with insect",
            test: (v) => (v.facts.batInsectShared as number) === 0,
          },
        },
        {
          id: "regroup",
          phase: "analyze",
          title: "Group them the other way",
          instruction: "Switch the grouping to the bones inside. Which two wings go together now?",
          check: {
            describe: "Grouped by structure",
            test: (v) => v.params.grouping === "structure",
          },
          hints: ["A bat's wing is a hand. A bird's wing is an arm. A dragonfly's wing is neither."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Write the rule for telling shared ancestry from mere resemblance.",
          write: {
            prompt: "What evidence tells you two animals are related, and what evidence does not?",
            placeholder: "Doing the same job is not evidence, because ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "find-the-outsider",
      title: "Find the odd one out",
      brief: "Pick the pair of wings that share no bones at all.",
      bands: ["6-8", "9-12"],
      setup: { view: "analogy", limbA: "bat", limbB: "bird", grouping: "structure" },
      goal: {
        describe: "A pair with zero shared bone groups",
        test: (v) => (v.facts.sharedBoneGroups as number) === 0,
      },
      stars: {
        two: {
          describe: "And both of them are used for flying",
          test: (v) => (v.facts.sharedBoneGroups as number) === 0 && v.facts.sameJob === true,
        },
      },
      hints: ["Only one of the six limbs on the list has no bones in it."],
    },
    {
      id: "line-up",
      title: "Perfect register",
      brief: "Align all four forelimbs and highlight a single bone in all of them at once.",
      bands: ["3-5", "6-8", "9-12"],
      setup: { view: "limbs", align: 0, autoAlign: false, highlight: "all" },
      goal: {
        describe: "Fully aligned with one bone highlighted",
        test: (v) => (v.facts.align as number) >= 0.95 && v.params.highlight !== "all",
      },
      stars: {
        two: {
          describe: "Highlight the humerus — the bone nearest the shoulder",
          test: (v) => (v.facts.align as number) >= 0.95 && v.params.highlight === "humerus",
        },
      },
      hints: ["Turn off the automatic sweep, then push Align all the way to 1."],
    },
  ],
};
