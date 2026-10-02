import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { q } from "@engine/units";
import { arrow, camera } from "@ui/draw";
import { opticalGlass } from "@ui/labware";
import { bokeh, callout } from "@ui/organic";
import {
  badge, glow, hexA, isDarkTheme, material, metal, softShadow, sphere, vignette,
} from "@ui/scene";

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
  const dark = isDarkTheme(theme);
  const t = state.t;

  // ---- Framing --------------------------------------------------------
  const halfX = Math.max(sol.dObject, Math.abs(diShown), 2.2 * fMag) * 1.06 + 0.12;
  const aperture = Math.max(ho * 1.5, fMag * 0.55, 0.3);
  const halfY = Math.max(aperture, ho, Math.min(Math.abs(sol.imageHeight), 3 * ho)) * 1.2;
  // Independent x and y scaling: an affine squash keeps every ray straight and
  // every crossing point exactly where it belongs, while making the diagram
  // fill the stage.
  const cam = camera({
    x0: -halfX, y0: -halfY * 1.42, x1: halfX, y1: halfY * 1.1, width, height, square: false,
  });
  const X = (x: number) => cam.toScreenX(x);
  const Y = (y: number) => cam.toScreenY(y);
  const axisY = Y(0);
  const railY = Y(-halfY * 1.16);
  const railH = Math.max(16, height * 0.045);

  // ---- A darkened room, so light can look like light --------------------
  // In either theme the room is the darkest colour the palette owns; every
  // line on it is the palest.
  const room = dark ? theme.surface : theme.ink;
  const roomLift = dark ? theme.surfaceAlt : theme.inkSoft;
  const chalk = dark ? theme.ink : theme.surface;
  const chalkSoft = dark ? theme.inkSoft : theme.surfaceAlt;
  const rayColor = theme.sci["light"];

  ctx.save();
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, width, height);
  const wash = ctx.createRadialGradient(
    width * 0.44, axisY, 0, width * 0.44, axisY, Math.max(width, height) * 0.72);
  wash.addColorStop(0, hexA(roomLift, 0.5));
  wash.addColorStop(0.55, hexA(roomLift, 0.16));
  wash.addColorStop(1, hexA(roomLift, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  bokeh(ctx, width, railY, rayColor, 9, 17);

  // ---- The optical rail ---------------------------------------------------
  // A machined bench with a T-slot and an engraved scale. Everything on the
  // bench is clamped to it, so nothing floats in the dark.
  softShadow(ctx, () => {
    metal(ctx, -8, railY, width + 16, railH, theme.sci["mass"], { radius: 3, angle: 90 });
  }, { blur: 26, dy: -8, alpha: 0.5 });
  ctx.save();
  ctx.fillStyle = hexA(room, 0.66);
  ctx.fillRect(-8, railY + railH * 0.34, width + 16, railH * 0.26);
  ctx.fillStyle = hexA(chalk, 0.18);
  ctx.fillRect(-8, railY + railH * 0.34, width + 16, 1.4);
  ctx.restore();
  // Engraved scale along the top edge of the rail, in centimetres.
  {
    const steps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2];
    const step = steps.find((v) => (2 * halfX) / v <= 16) ?? 2;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = -Math.ceil(halfX / step) * step; v <= halfX; v += step) {
      const px = X(v);
      if (px < -4 || px > width + 4) continue;
      const major = Math.round(v / step) % 2 === 0;
      ctx.strokeStyle = hexA(chalk, major ? 0.55 : 0.3);
      ctx.beginPath();
      ctx.moveTo(px, railY + 3);
      ctx.lineTo(px, railY + (major ? 11 : 7));
      ctx.stroke();
      if (major && railH > 18) {
        ctx.fillStyle = hexA(chalk, 0.5);
        ctx.fillText(`${Math.round(Math.abs(v) * 100)}`, px, railY + 12);
      }
    }
    ctx.restore();
  }

  /** A carrier clamped to the rail with a post rising to a component. */
  const mount = (x: number, topY: number) => {
    const postW = Math.max(7, width * 0.007);
    metal(ctx, x - postW / 2, topY, postW, Math.max(6, railY + 4 - topY),
      theme.sci["mass"], { radius: 2, angle: 0 });
    softShadow(ctx, () => {
      metal(ctx, x - postW * 2.1, railY - railH * 0.34, postW * 4.2, railH * 0.62,
        theme.sci["mass"], { radius: 3, angle: 90 });
    }, { blur: 10, dy: 3, alpha: 0.45 });
    sphere(ctx, x + postW * 1.5, railY - railH * 0.05, postW * 0.6, theme.sci["mass"]);
  };

  // ---- Optical axis and focal points -----------------------------------
  ctx.save();
  ctx.strokeStyle = hexA(chalkSoft, 0.45);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(X(-halfX), axisY);
  ctx.lineTo(X(halfX), axisY);
  ctx.stroke();
  ctx.restore();

  if (overlays.focalPoints && band !== "K-2") {
    for (const [x, name] of [[fMag, "F"], [-fMag, "F"], [2 * fMag, "2F"], [-2 * fMag, "2F"]] as [number, string][]) {
      if (Math.abs(x) > halfX) continue;
      glow(ctx, X(x), axisY, 13, chalkSoft, 0.35);
      sphere(ctx, X(x), axisY, 4.5, chalkSoft);
      ctx.save();
      ctx.font = '700 12px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = hexA(room, 0.85);
      ctx.strokeText(name, X(x), axisY + 22);
      ctx.fillStyle = hexA(chalk, 0.85);
      ctx.fillText(name, X(x), axisY + 22);
      ctx.restore();
    }
  }

  // ---- The element ------------------------------------------------------
  const apTop = Y(aperture), apBot = Y(-aperture);
  const cx = X(0);
  const lensBulge = Math.max(13, width * 0.014);
  mount(cx, apBot);
  ctx.save();
  ctx.lineJoin = "round";
  if (sol.mirror) {
    // A curved mirror: a machined backing, a silvered face and a bright
    // specular line where the light is actually reflected.
    const bulge = (sol.f > 0 ? -1 : 1) * lensBulge;
    const face = (off: number) => {
      ctx.beginPath();
      ctx.moveTo(cx + off, apTop);
      ctx.quadraticCurveTo(cx + bulge * 2 + off, axisY, cx + off, apBot);
    };
    ctx.lineCap = "round";
    face(-bulge * 0.55);
    ctx.strokeStyle = hexA(theme.sci["mass"], 1);
    ctx.lineWidth = 13;
    ctx.stroke();
    face(0);
    ctx.strokeStyle = hexA(chalk, 0.35);
    ctx.lineWidth = 9;
    ctx.stroke();
    face(0);
    ctx.strokeStyle = hexA(chalk, 0.95);
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    face(0);
    ctx.strokeStyle = hexA(rayColor, 0.3);
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  } else {
    // Glass in a metal cell: an opticalGlass body, then the specular edges
    // that are the whole reason a lens reads as glass and not as a hole.
    const lensPath = (ox: number, oy: number) => {
      ctx.beginPath();
      if (sol.f > 0) {
        ctx.moveTo(cx + ox, apTop + oy);
        ctx.quadraticCurveTo(cx + lensBulge + ox, axisY + oy, cx + ox, apBot + oy);
        ctx.quadraticCurveTo(cx - lensBulge + ox, axisY + oy, cx + ox, apTop + oy);
      } else {
        const w2 = lensBulge * 0.62;
        ctx.moveTo(cx - w2 + ox, apTop + oy);
        ctx.quadraticCurveTo(cx + w2 * 0.3 + ox, axisY + oy, cx - w2 + ox, apBot + oy);
        ctx.lineTo(cx + w2 + ox, apBot + oy);
        ctx.quadraticCurveTo(cx - w2 * 0.3 + ox, axisY + oy, cx + w2 + ox, apTop + oy);
      }
      ctx.closePath();
    };
    const gx = cx - 30, gy = axisY - 30;
    ctx.save();
    ctx.translate(gx, gy);
    opticalGlass(ctx, () => lensPath(-gx, -gy), theme);
    ctx.restore();
    // Inner body sheen: a vertical ramp down the glass.
    ctx.save();
    lensPath(0, 0);
    ctx.clip();
    const sheen = ctx.createLinearGradient(cx - lensBulge, apTop, cx + lensBulge, apBot);
    sheen.addColorStop(0, hexA(chalk, 0.3));
    sheen.addColorStop(0.4, hexA(chalk, 0.04));
    sheen.addColorStop(1, hexA(rayColor, 0.16));
    ctx.fillStyle = sheen;
    ctx.fillRect(cx - lensBulge * 2, apTop, lensBulge * 4, apBot - apTop);
    ctx.restore();
    lensPath(0, 0);
    ctx.strokeStyle = hexA(chalk, 0.9);
    ctx.lineWidth = 2;
    ctx.stroke();
    // Two specular streaks down the lit shoulder.
    ctx.strokeStyle = hexA(chalk, 0.75);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - lensBulge * 0.42, apTop + (apBot - apTop) * 0.16);
    ctx.quadraticCurveTo(cx - lensBulge * 0.62, axisY, cx - lensBulge * 0.42, apTop + (apBot - apTop) * 0.5);
    ctx.stroke();
    ctx.strokeStyle = hexA(chalk, 0.35);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + lensBulge * 0.3, apTop + (apBot - apTop) * 0.58);
    ctx.lineTo(cx + lensBulge * 0.36, apTop + (apBot - apTop) * 0.84);
    ctx.stroke();
  }
  // The metal cell that holds the element, top and bottom.
  for (const yy of [apTop, apBot]) {
    const capH = Math.max(9, height * 0.022);
    metal(ctx, cx - lensBulge * 1.5, yy - (yy === apTop ? capH : 0), lensBulge * 3, capH,
      theme.sci["mass"], { radius: 3, angle: 90 });
  }
  ctx.restore();

  // ---- Ray construction ---------------------------------------------------
  const imgX = sol.mirror ? -sol.dImage : sol.dImage;
  const hi = sol.imageHeight;
  const outSign = sol.mirror ? -1 : 1;
  const edge = halfX * 1.05;
  // A real image inside the bench gets a screen, and the light stops on it.
  const hasScreen = sol.real && !sol.atFocus && Math.abs(imgX) <= halfX * 0.99;

  function outgoing(yLens: number): P[] {
    if (hasScreen) return [{ x: 0, y: yLens }, { x: imgX, y: hi }];
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

  const strokePaths = (list: P[][]) => {
    for (const path of list) {
      ctx.beginPath();
      ctx.moveTo(X(path[0].x), Y(path[0].y));
      for (let i = 1; i < path.length; i++) ctx.lineTo(X(path[i].x), Y(path[i].y));
      ctx.stroke();
    }
  };

  // Bloom first, additively, then the beam, then a hot core: three passes are
  // what separates "a yellow line" from "light travelling".
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [lw, a] of [[22, 0.05], [11, 0.1], [5.5, 0.2]] as [number, number][]) {
    ctx.strokeStyle = hexA(rayColor, a);
    ctx.lineWidth = lw;
    strokePaths(paths);
  }
  ctx.strokeStyle = hexA(rayColor, 0.95);
  ctx.lineWidth = 2.4;
  strokePaths(paths);
  ctx.strokeStyle = hexA(chalk, 0.7);
  ctx.lineWidth = 1;
  strokePaths(paths);
  ctx.restore();

  // Backward extensions: where a virtual image actually comes from.
  if (!sol.real && !sol.atFocus && Math.abs(imgX) <= halfX * 1.02) {
    ctx.save();
    ctx.strokeStyle = hexA(rayColor, 0.5);
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
    const phase = (t % period) / period;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const path of paths) {
      let total = 0;
      for (let i = 1; i < path.length; i++) {
        total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      }
      for (let k = 0; k < 3; k++) {
        const p = pulseAt(path, ((phase + k / 3) % 1) * total);
        if (!p) continue;
        glow(ctx, X(p.x), Y(p.y), 20, rayColor, 0.5);
        sphere(ctx, X(p.x), Y(p.y), 3.8, chalk, { rim: false });
      }
    }
    ctx.restore();
  }

  // ---- Object: an illuminated arrow target on a carrier ---------------------
  const objX = X(-sol.dObject);
  mount(objX, axisY);
  {
    const tipY = Y(ho);
    const w = Math.max(9, width * 0.009);
    // Lamp house behind the target, throwing the light that makes the object.
    metal(ctx, objX - w * 2.4, tipY - w * 0.6, w * 1.5, (axisY - tipY) + w * 1.2,
      theme.sci["mass"], { radius: 3, angle: 90 });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, objX - w * 1.4, (tipY + axisY) / 2, w * 4.2, rayColor, 0.4);
    glow(ctx, objX, (tipY + axisY) / 2, w * 3.2, theme.sci["field"], 0.45);
    glow(ctx, objX, tipY, w * 3.6, theme.sci["field"], 0.6);
    ctx.restore();
    arrow(ctx, objX, axisY, objX, tipY, theme.sci["field"], { width: Math.max(5, w * 0.62) });
    ctx.save();
    ctx.strokeStyle = hexA(chalk, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(objX, axisY);
    ctx.lineTo(objX, tipY);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Screen and image -----------------------------------------------------
  let imageAnchor: P | null = null;
  if (!sol.atFocus && Math.abs(imgX) <= halfX * 1.02) {
    const ix = X(imgX);
    const iy = Y(hi);
    imageAnchor = { x: ix, y: iy };
    if (hasScreen) {
      // A white card standing at the image plane. Light lands on it and stops:
      // that is what makes a real image real.
      const cardH = Math.abs(apBot - apTop) * 1.08;
      const cardW = Math.max(18, width * 0.019);
      const cardTop = axisY - cardH * 0.52;
      mount(ix, cardTop + cardH);
      softShadow(ctx, () => {
          material(ctx, ix - cardW / 2, cardTop, cardW, cardH, theme.inkSoft, 2);
      }, { blur: 16, dy: 4, alpha: 0.5 });
      ctx.save();
      ctx.beginPath();
      ctx.rect(ix - cardW / 2, cardTop, cardW, cardH);
      ctx.clip();
      const cg = ctx.createLinearGradient(ix - cardW / 2, cardTop, ix + cardW / 2, cardTop + cardH);
      cg.addColorStop(0, hexA(chalkSoft, 0.62));
      cg.addColorStop(1, hexA(chalkSoft, 0.34));
      ctx.fillStyle = cg;
      ctx.fillRect(ix - cardW / 2, cardTop, cardW, cardH);
      // The projected image, glowing on the card.
      ctx.globalCompositeOperation = "lighter";
      const g2 = ctx.createLinearGradient(ix, axisY, ix, iy);
      g2.addColorStop(0, hexA(rayColor, 0.5));
      g2.addColorStop(1, hexA(rayColor, 0.95));
      ctx.strokeStyle = g2;
      ctx.lineWidth = cardW * 0.62;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ix, axisY);
      ctx.lineTo(ix, iy);
      ctx.stroke();
      // The patch of light spilling around the projected arrow.
      const spill = ctx.createLinearGradient(ix, axisY, ix, iy);
      spill.addColorStop(0, hexA(rayColor, 0.1));
      spill.addColorStop(1, hexA(rayColor, 0.28));
      ctx.fillStyle = spill;
      ctx.fillRect(ix - cardW / 2, Math.min(axisY, iy), cardW, Math.abs(iy - axisY));
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, ix, iy, 26, rayColor, sol.real ? 0.5 : 0.25);
    ctx.restore();
    arrow(ctx, ix, axisY, ix, iy, rayColor, { width: 3.8, dashed: !sol.real });
  }

  // ---- Callouts --------------------------------------------------------------
  // Every name sits in the dark air above the bench, on a leader line.
  if (band !== "K-2") {
    const topRow = Math.max(26, height * 0.062);
    const row2 = topRow + 46;
    callout(ctx, objX, Y(ho) - 6, Math.min(objX + 26, width * 0.2), topRow,
      "Object", theme, { sub: `${(ho * 100).toFixed(0)} cm tall`, side: "right", accent: theme.sci["field"] });
    callout(ctx, cx, apTop + 4, cx + 24, topRow,
      sol.mirror ? (sol.f > 0 ? "Concave mirror" : "Convex mirror")
        : (sol.f > 0 ? "Converging lens" : "Diverging lens"),
      theme, { sub: `f = ${(fMag * 100).toFixed(0)} cm`, side: "right", accent: rayColor });
    if (imageAnchor && !sol.atFocus) {
      const px = Math.min(imageAnchor.x + 20, width - 172);
      callout(ctx, imageAnchor.x, imageAnchor.y, px, row2,
        hasScreen ? "Image on screen" : sol.real ? "Real image" : "Virtual image",
        theme, {
          sub: `${sol.upright ? "upright" : "inverted"} · ${Math.abs(sol.magnification).toFixed(2)}×`,
          side: "right",
          accent: sol.real ? theme.sci["energy-kinetic"] : theme.sci["field"],
        });
    }
  }

  // ---- Numbers ------------------------------------------------------------------
  if (band !== "K-2") {
    let ly = railY - 30;
    const put = (text: string, color: string) => {
      badge(ctx, 16, ly, text, theme, { color });
      ly -= 28;
    };
    if (sol.atFocus) {
      put("object at F — no image forms", theme.sci["field"]);
    } else {
      if (band === "9-12") {
        put(`1/do + 1/di = ${(1 / sol.dObject + 1 / sol.dImage).toFixed(3)} = 1/f`, theme.inkSoft);
      }
      if (band === "6-8" || band === "9-12") {
        put(`di = ${(sol.dImage * 100).toFixed(0)} cm`, rayColor);
        put(`do = ${(sol.dObject * 100).toFixed(0)} cm`, theme.sci["field"]);
      }
    }
  }

  vignette(ctx, width, height, 0.28);
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
