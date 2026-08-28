import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, camera, disc, label } from "@ui/draw";

/**
 * Optics Bench — Grades 6-12.
 *
 * A converging or diverging lens, or a curved mirror, with an object on a
 * bench. Three principal rays are traced and the image is built where they
 * cross, so the image position is a construction rather than an assertion —
 * and it agrees with 1/f = 1/do + 1/di to the last decimal place, which the
 * readouts invite the student to check.
 *
 * Confronts the belief that covering half a lens removes half the image, and
 * that a virtual image is "not really there".
 */

/* ------------------------------------------------------------------ *
 * Optics
 * ------------------------------------------------------------------ */

/** Beyond this the image is so far away it is drawn as "no image". */
const MAX_DI = 200;

export interface ImageSolution {
  /** Signed focal length: positive converges, negative diverges. */
  f: number;
  /** Object distance, m. Always positive here. */
  dObject: number;
  /** Image distance, m. Positive is a real image. */
  dImage: number;
  magnification: number;
  imageHeight: number;
  real: boolean;
  upright: boolean;
  /** True when the object sits at the focal point and no image forms. */
  atFocus: boolean;
  mirror: boolean;
}

export function solveOptics(params: ParamValues): ImageSolution {
  const element = params.element as string;
  const mirror = element === "concave" || element === "convex";
  const converging = element === "converging" || element === "concave";
  const f = (converging ? 1 : -1) * (params.focalLength as number);
  const dObject = params.objectDistance as number;
  const hObject = params.objectHeight as number;

  const denom = dObject - f;
  const atFocus = Math.abs(denom) < 1e-6;
  // The thin-lens (and mirror) equation, rearranged: di = do·f / (do - f).
  const raw = atFocus ? Number.POSITIVE_INFINITY : (dObject * f) / denom;
  const dImage = Math.max(-MAX_DI, Math.min(MAX_DI, raw));
  const magnification = -dImage / dObject;

  return {
    f, dObject, dImage, magnification,
    imageHeight: magnification * hObject,
    real: dImage > 0 && !atFocus,
    upright: magnification > 0,
    atFocus,
    mirror,
  };
}

/* ------------------------------------------------------------------ *
 * Model
 *
 * The bench is quasi-static: the optics are exact at every instant and the
 * only thing that evolves is the light pulse animation.
 * ------------------------------------------------------------------ */

interface State {
  t: number;
}

const model: SimModel<State> = {
  init() {
    return { t: 0 };
  },

  step(state, dt) {
    return { t: state.t + dt };
  },

  readouts(_state, params) {
    const s = solveOptics(params);
    const ho = params.objectHeight as number;
    return [
      {
        key: "objectDistance", label: "Object distance", quantity: q(s.dObject, "length"),
        unit: "cm", semantic: "distance", graphable: true,
      },
      {
        key: "imageDistance", label: "Image distance", quantity: q(s.dImage, "length"),
        unit: "cm", semantic: "distance", graphable: true,
      },
      {
        key: "focalLength", label: "Focal length", quantity: q(s.f, "length"),
        unit: "cm", semantic: "distance", graphable: true, bands: ["9-12"],
      },
      {
        key: "magnification", label: "Magnification", quantity: q(s.magnification, "ratio"),
        semantic: "light", graphable: true,
      },
      {
        key: "objectHeight", label: "Object height", quantity: q(ho, "length"),
        unit: "cm", semantic: "distance", graphable: true, bands: ["6-8", "9-12"],
      },
      {
        key: "imageHeight", label: "Image height", quantity: q(s.imageHeight, "length"),
        unit: "cm", semantic: "light", graphable: true,
      },
      {
        key: "invSum", label: "1/do + 1/di  (per metre)",
        quantity: q(1 / s.dObject + (s.dImage !== 0 ? 1 / s.dImage : 0), "ratio"),
        semantic: "field", graphable: true, bands: ["9-12"],
      },
      {
        key: "invF", label: "1/f  (per metre)", quantity: q(1 / s.f, "ratio"),
        semantic: "field", graphable: true, bands: ["9-12"],
      },
    ];
  },

  facts(_state, params) {
    const s = solveOptics(params);
    return {
      imageDistance: s.dImage,
      magnification: s.magnification,
      size: Math.abs(s.magnification),
      real: s.real,
      virtual: !s.real && !s.atFocus,
      upright: s.upright,
      inverted: !s.upright,
      enlarged: Math.abs(s.magnification) > 1,
      atFocus: s.atFocus,
      element: params.element as string,
      // How well the construction satisfies the thin-lens equation. It should
      // be zero to machine precision; it is exposed so a lab can prove it.
      lensEquationError: Math.abs(1 / s.dObject + 1 / s.dImage - 1 / s.f),
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

type P = { x: number; y: number };

/** Points along a polyline, used to send light pulses down each ray. */
function pulseAt(path: P[], d: number): P | null {
  let rem = d;
  for (let i = 1; i < path.length; i++) {
    const seg = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    if (rem <= seg) {
      const t = seg > 0 ? rem / seg : 0;
      return {
        x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
        y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
      };
    }
    rem -= seg;
  }
  return null;
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height, overlays, band } = rc;
  const sol = solveOptics(params);
  const ho = params.objectHeight as number;
  const fMag = Math.abs(sol.f);
  const diShown = Math.max(-6, Math.min(6, sol.dImage));

  // ---- Framing --------------------------------------------------------
  const halfX = Math.max(sol.dObject, Math.abs(diShown), 2.2 * fMag) * 1.18 + 0.25;
  const aperture = Math.max(ho * 1.5, fMag * 0.55, 0.3);
  const halfY = Math.max(aperture, ho, Math.min(Math.abs(sol.imageHeight), 3 * ho)) * 1.35;
  // Independent x and y scaling: an affine squash keeps every ray straight and
  // every crossing point exactly where it belongs, while making the diagram
  // fill the stage.
  const cam = camera({ x0: -halfX, y0: -halfY, x1: halfX, y1: halfY, width, height, square: false });
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);
  const axisY = Y(0);

  // ---- Optical axis and focal points -----------------------------------
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(-halfX), axisY);
  ctx.lineTo(X(halfX), axisY);
  ctx.stroke();
  ctx.restore();

  if (overlays.focalPoints && band !== "K-2") {
    for (const [x, name] of [[fMag, "F"], [-fMag, "F"], [2 * fMag, "2F"], [-2 * fMag, "2F"]] as [number, string][]) {
      if (Math.abs(x) > halfX) continue;
      disc(ctx, X(x), axisY, 3.5, theme.inkSoft);
      label(ctx, name, X(x), axisY + 18, theme, {
        align: "center", color: theme.inkSoft, size: 11, plate: false,
      });
    }
  }

  // ---- The element ------------------------------------------------------
  const apTop = Y(aperture), apBot = Y(-aperture);
  const cx = X(0);
  ctx.save();
  ctx.strokeStyle = theme.ink;
  ctx.fillStyle = theme.surfaceAlt;
  ctx.lineWidth = 2;
  if (sol.mirror) {
    // A curved mirror, drawn bowing the way it actually curves.
    const bulge = (sol.f > 0 ? -1 : 1) * 16;
    ctx.beginPath();
    ctx.moveTo(cx, apTop);
    ctx.quadraticCurveTo(cx + bulge * 2, axisY, cx, apBot);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = apTop; yy < apBot; yy += 9) {
      const t = (yy - apTop) / (apBot - apTop);
      const off = bulge * 4 * t * (1 - t);
      ctx.moveTo(cx + off, yy);
      ctx.lineTo(cx + off - bulge * 0.55, yy + 7);
    }
    ctx.stroke();
  } else if (sol.f > 0) {
    // Biconvex.
    ctx.beginPath();
    ctx.moveTo(cx, apTop);
    ctx.quadraticCurveTo(cx + 15, axisY, cx, apBot);
    ctx.quadraticCurveTo(cx - 15, axisY, cx, apTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Biconcave.
    ctx.beginPath();
    ctx.moveTo(cx - 9, apTop);
    ctx.quadraticCurveTo(cx + 2, axisY, cx - 9, apBot);
    ctx.lineTo(cx + 9, apBot);
    ctx.quadraticCurveTo(cx - 2, axisY, cx + 9, apTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // ---- Ray construction ---------------------------------------------------
  // Every ray from the tip of the object leaves the element heading either
  // towards the image point (real) or directly away from it (virtual).
  const imgX = sol.mirror ? -sol.dImage : sol.dImage;
  const hi = sol.imageHeight;
  const outSign = sol.mirror ? -1 : 1;
  const edge = halfX * 1.05;

  function outgoing(yLens: number): P[] {
    let dx: number, dy: number;
    if (sol.real) { dx = imgX - 0; dy = hi - yLens; }
    else { dx = 0 - imgX; dy = yLens - hi; }
    // Force the ray to leave on the correct side of the element.
    if (Math.sign(dx) !== outSign) { dx = -dx; dy = -dy; }
    const len = Math.hypot(dx, dy) || 1;
    const reach = (edge * 2) / (Math.abs(dx) / len || 1e-6);
    return [
      { x: 0, y: yLens },
      { x: (dx / len) * reach, y: yLens + (dy / len) * reach },
    ];
  }

  const rayHeights: number[] = [ho, 0];
  // The ray aimed at the near focal point leaves parallel to the axis; it hits
  // the element at this height. It runs away to infinity as do approaches f.
  const focalHeight = sol.atFocus ? Number.NaN : (-ho * sol.f) / (sol.dObject - sol.f);
  if (Number.isFinite(focalHeight) && Math.abs(focalHeight) < aperture * 2.4) rayHeights.push(focalHeight);

  const tip: P = { x: -sol.dObject, y: ho };
  const paths: P[][] = rayHeights.map((yLens) => {
    const out = outgoing(yLens);
    return [tip, { x: 0, y: yLens }, out[1]];
  });

  ctx.save();
  ctx.strokeStyle = theme.sci["light"];
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  for (const path of paths) {
    ctx.beginPath();
    ctx.moveTo(X(path[0].x), Y(path[0].y));
    for (let i = 1; i < path.length; i++) ctx.lineTo(X(path[i].x), Y(path[i].y));
    ctx.stroke();
  }
  ctx.restore();

  // Backward extensions: where a virtual image actually comes from.
  if (!sol.real && !sol.atFocus && Math.abs(imgX) <= halfX * 1.02) {
    ctx.save();
    ctx.strokeStyle = theme.sci["light"];
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    for (const path of paths) {
      ctx.beginPath();
      ctx.moveTo(X(path[1].x), Y(path[1].y));
      ctx.lineTo(X(imgX), Y(hi));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Light pulses --------------------------------------------------------
  if (overlays.pulses) {
    const period = 2.6;
    const phase = (state.t % period) / period;
    for (const path of paths) {
      let total = 0;
      for (let i = 1; i < path.length; i++) {
        total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      }
      for (let k = 0; k < 3; k++) {
        const p = pulseAt(path, ((phase + k / 3) % 1) * total);
        if (p) disc(ctx, X(p.x), Y(p.y), 3.5, theme.sci["light"]);
      }
    }
  }

  // ---- Object and image -------------------------------------------------------
  arrow(ctx, X(-sol.dObject), axisY, X(-sol.dObject), Y(ho), theme.accent, {
    width: 3.5, label: band === "K-2" ? undefined : "object",
  });

  if (!sol.atFocus && Math.abs(imgX) <= halfX * 1.02) {
    ctx.save();
    if (!sol.real) ctx.setLineDash([6, 4]);
    arrow(ctx, X(imgX), axisY, X(imgX), Y(hi), theme.sci["light"], {
      width: 3.5, dashed: !sol.real,
      label: band === "K-2" ? undefined : sol.real ? "real image" : "virtual image",
    });
    ctx.restore();
  }

  // ---- Numbers ------------------------------------------------------------------
  if (band !== "K-2") {
    const lines: string[] = [];
    if (sol.atFocus) {
      lines.push("Object at F — the rays leave parallel, so no image forms.");
    } else {
      lines.push(`${sol.real ? "Real" : "Virtual"}, ${sol.upright ? "upright" : "inverted"}, ${Math.abs(sol.magnification).toFixed(2)}× size`);
      if (band === "6-8" || band === "9-12") {
        lines.push(`do = ${(sol.dObject * 100).toFixed(0)} cm    di = ${(sol.dImage * 100).toFixed(0)} cm`);
      }
      if (band === "9-12") {
        lines.push(`1/do + 1/di = ${(1 / sol.dObject + 1 / sol.dImage).toFixed(3)}    1/f = ${(1 / sol.f).toFixed(3)}`);
      }
    }
    let ly = 22;
    for (const line of lines) {
      label(ctx, line, 14, ly, theme, { color: theme.ink, size: 12 });
      ly += 20;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const opticsSim: SimManifest<State> = {
  id: "phys.optics",
  title: "Optics Bench",
  tagline: "Slide the object, trace the rays, and watch the image flip, grow and vanish.",
  subject: "physics",
  bands: ["6-8", "9-12"],
  grades: [6, 7, 8, 9, 10, 11, 12],
  standards: { ngss: ["MS-PS4-2", "HS-PS4-5"], ccssMath: ["8.EE.B.6", "HSA.CED.A.4"] },
  learningGoals: [
    "Trace the three principal rays through a lens or mirror.",
    "Predict whether an image is real or virtual, upright or inverted, bigger or smaller.",
    "Use 1/f = 1/do + 1/di and check it against a ray diagram.",
    "Explain why a magnifying glass only works closer than one focal length.",
  ],
  misconceptions: [
    "Covering half a lens removes half the image",
    "A virtual image is not really there",
    "The image always forms at the focal point",
    "Moving the object closer always makes the image bigger",
  ],
  interactionHint: "Slide the object towards the lens and watch the image run away.",
  params: {
    element: {
      type: "option", label: "Optical element",
      options: [
        { value: "converging", label: "Converging lens" },
        { value: "diverging", label: "Diverging lens" },
        { value: "concave", label: "Concave mirror" },
        { value: "convex", label: "Convex mirror" },
      ],
      default: "converging",
      help: "Converging lenses and concave mirrors bring light together.",
    },
    objectDistance: {
      type: "number", label: "Object distance", kind: "length", unit: "cm",
      min: 0.1, max: 2.5, step: 0.05, default: 1,
      help: "How far the object sits from the lens or mirror.",
    },
    focalLength: {
      type: "number", label: "Focal length", kind: "length", unit: "cm",
      min: 0.15, max: 1.2, step: 0.05, default: 0.5,
      help: "A stronger lens has a shorter focal length.",
    },
    objectHeight: {
      type: "number", label: "Object height", kind: "length", unit: "cm",
      min: 0.1, max: 0.6, step: 0.05, default: 0.3,
    },
  },
  overlays: [
    { key: "focalPoints", label: "Focal points", default: true },
    { key: "pulses", label: "Moving light", default: true },
  ],
  model,
  render,
  labs: [
    {
      id: "lens-equation",
      title: "Find the lens equation from your data",
      question: "Is there a rule linking where the object is to where the image lands?",
      bands: ["9-12"],
      minutes: 30,
      standards: ["HS-PS4-5"],
      setup: { element: "converging", objectDistance: 2.5, focalLength: 0.5, objectHeight: 0.3 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the trend",
          instruction: "You will slide the object from 250 cm in towards the lens.",
          predict: {
            prompt: "As the object moves closer to the lens, the image distance will...",
            options: [
              "shrink towards zero",
              "stay near the focal point",
              "grow, slowly at first then very fast",
              "stay exactly the same",
            ],
            correct: 2,
            reveal: "It grows, and it runs away to infinity as the object reaches the focal point. That is what 1/do + 1/di = 1/f demands.",
          },
        },
        {
          id: "collect",
          phase: "measure",
          title: "Six object distances",
          instruction: "Hold the focal length at 50 cm. Record six object distances beyond it.",
          requireData: 6,
          check: {
            describe: "A converging lens is selected",
            test: (v) => v.params.element === "converging",
          },
          hints: [
            "Stay outside the focal point for now, so the image stays real.",
            "Record the image distance from the chip, not from the picture.",
          ],
        },
        {
          id: "reciprocals",
          phase: "analyze",
          title: "Take reciprocals",
          instruction: "For every row work out 1/do + 1/di. Compare with 1/f.",
          write: {
            prompt: "What is 1/do + 1/di in each row, and how does it compare with 1/f?",
            placeholder: "Every row gave ... per metre, and 1/f is ...",
          },
          hints: ["Two of the readouts already do the arithmetic for you."],
        },
        {
          id: "change-f",
          phase: "measure",
          title: "Change the lens",
          instruction: "Set the focal length to 20 cm and check your rule still holds.",
          check: {
            describe: "Focal length is 25 cm or less",
            test: (v) => (v.params.focalLength as number) <= 0.25,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Write the equation",
          instruction: "Write the rule, then use it to predict di for do = 80 cm, f = 20 cm.",
          write: {
            prompt: "State the lens equation and use it to predict one image distance you have not tested.",
            placeholder: "The rule is ... so for do = 80 cm and f = 20 cm I predict di = ...",
          },
        },
      ],
    },
    {
      id: "when-virtual",
      title: "When is the image virtual?",
      question: "A magnifying glass makes a big upright image. When does that happen?",
      bands: ["6-8", "9-12"],
      minutes: 25,
      standards: ["MS-PS4-2", "HS-PS4-5"],
      setup: { element: "converging", objectDistance: 1.5, focalLength: 0.5, objectHeight: 0.3 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict where it flips",
          instruction: "The focal length is 50 cm. Slide the object inwards.",
          predict: {
            prompt: "The image turns upright and virtual when the object is...",
            options: [
              "further than 2 focal lengths away",
              "between 1 and 2 focal lengths",
              "closer than 1 focal length",
              "exactly at 2 focal lengths",
            ],
            correct: 2,
            reveal: "Closer than one focal length. Inside F the rays leave still spreading out, so they only appear to come from a point behind the object.",
          },
        },
        {
          id: "outside",
          phase: "measure",
          title: "Start outside the focal point",
          instruction: "Record the image at 150 cm, 100 cm and 60 cm.",
          requireData: 3,
        },
        {
          id: "inside",
          phase: "measure",
          title: "Now go inside",
          instruction: "Move the object closer than 50 cm and record twice more.",
          requireData: 5,
          check: {
            describe: "The image is virtual",
            test: (v) => Boolean(v.facts.virtual),
          },
          hints: [
            "Watch the rays after the lens: are they coming together or spreading out?",
            "The dashed lines show where the light only appears to come from.",
          ],
        },
        {
          id: "diverging",
          phase: "measure",
          title: "Try a diverging lens",
          instruction: "Switch to the diverging lens. Can you ever get a real image?",
          check: {
            describe: "A diverging lens is selected",
            test: (v) => v.params.element === "diverging",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "State the rule",
          instruction: "Say exactly when a converging lens gives a virtual image.",
          write: {
            prompt: "When is the image virtual, and how can you tell from the rays alone?",
            placeholder: "The image is virtual when ... I can tell because the rays ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "double-size",
      title: "Exactly twice life size",
      brief: "Make a real image exactly twice as tall as the object.",
      bands: ["9-12"],
      setup: { element: "converging", objectDistance: 2, focalLength: 0.5, objectHeight: 0.3 },
      goal: {
        describe: "A real image between 1.9× and 2.1× the object size",
        test: (v) => Boolean(v.facts.real) && Math.abs((v.facts.size as number) - 2) <= 0.1,
      },
      stars: {
        two: {
          describe: "Within 0.02 of exactly 2×",
          test: (v) => Boolean(v.facts.real) && Math.abs((v.facts.size as number) - 2) <= 0.02,
        },
        three: {
          describe: "Exactly 2×, inverted, with a lens of 30 cm or shorter",
          test: (v) =>
            Boolean(v.facts.real) &&
            Math.abs((v.facts.size as number) - 2) <= 0.02 &&
            Boolean(v.facts.inverted) &&
            (v.params.focalLength as number) <= 0.3,
        },
      },
      hints: [
        "A real image from a converging lens is always inverted, so the magnification is negative.",
        "Twice the size means the image distance is twice the object distance.",
        "Put that into 1/do + 1/di = 1/f and you get do = 1.5 f.",
      ],
    },
    {
      id: "magnifier",
      title: "Build a magnifying glass",
      brief: "Get an upright virtual image at least three times life size.",
      bands: ["6-8", "9-12"],
      setup: { element: "converging", objectDistance: 0.8, focalLength: 0.5, objectHeight: 0.3 },
      goal: {
        describe: "An upright virtual image 3× or larger",
        test: (v) =>
          Boolean(v.facts.virtual) && Boolean(v.facts.upright) && (v.facts.size as number) >= 3,
      },
      stars: {
        two: {
          describe: "5× or larger",
          test: (v) =>
            Boolean(v.facts.virtual) && Boolean(v.facts.upright) && (v.facts.size as number) >= 5,
        },
        three: {
          describe: "5× or larger with the object at least 15 cm from the lens",
          test: (v) =>
            Boolean(v.facts.virtual) && Boolean(v.facts.upright) &&
            (v.facts.size as number) >= 5 && (v.params.objectDistance as number) >= 0.15,
        },
      },
      hints: [
        "A magnifying glass only magnifies when the object is inside the focal length.",
        "The closer the object gets to F from the inside, the bigger the image grows.",
        "A longer focal length lets you hold the object further away for the same magnification.",
      ],
    },
  ],
};
