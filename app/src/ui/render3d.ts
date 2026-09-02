import * as THREE from "three";
import type { ThemeColors } from "@engine/types";
import {
  buildAtom, buildCell, buildDNA, buildGlassware, buildMicrobe, buildMolecule,
  buildApparatus, buildOrganelle, buildPlanet, createScene, sharedRenderer, webglAvailable,
} from "./three3d";
import type { Apparatus3D, Scene3D } from "./three3d";

/**
 * The 3D compositor.
 *
 * `three3d.ts` knows how to build one subject. This module is what lets a
 * simulation put *many* subjects on the same stage, in the same coordinates it
 * already uses for its 2D drawing, at the cost of a single WebGL draw call per
 * frame.
 *
 * The trick is an orthographic camera set up in pixel space: the visible
 * volume is exactly the canvas, one world unit is one CSS pixel, and a subject
 * asked to appear at (x, y) lands on the same pixel a 2D `arc()` would. A
 * simulation therefore keeps every layout decision it already made — the sort
 * bins, the tray positions, the label leaders — and only the specimens
 * themselves become real geometry: lit, shaded, occluding themselves, turning.
 *
 * Orthographic rather than perspective is deliberate. Under perspective, a
 * specimen at the edge of a tray is seen from an angle while the one in the
 * middle is seen head-on, and a row of identical specimens stops looking
 * identical. Each subject is instead tipped to a three-quarter view of its
 * own, which is what gives the depth; the camera stays honest.
 *
 * Subjects are built once and cached. Building a cell is expensive — dozens of
 * meshes, tessellated spheres — and a sort simulation shows eight of them,
 * sixty times a second. So the cache is keyed by what the subject *is*, and a
 * frame only moves, scales and turns what already exists.
 */

/** What to build. Mirrors the archetype `Art` union, minus its 2D-only cases. */
export type Subject3D =
  | { kind: "cell"; plant?: boolean }
  | { kind: "organelle"; which: string }
  | { kind: "microbe"; which: "virus" | "bacterium" }
  | { kind: "glassware"; which: "beaker" | "flask" | "testTube"; level?: number; color?: string; bubbles?: number }
  | { kind: "sphere"; color: string }
  | { kind: "planet"; color: string; rings?: boolean; atmosphere?: string }
  | { kind: "atom"; protons: number; neutrons: number; electrons: number }
  | { kind: "dna" }
  | { kind: "molecule"; formula: string }
  | { kind: "apparatus"; which: Apparatus3D };

export interface Draw3DOptions {
  /** Identifies the palette, so a theme switch rebuilds the lights. */
  themeKey?: string;
  /** Lay a fading mirror image beneath the subject, as on a polished bench. */
  reflect?: boolean;
  /** Turn about the vertical axis, radians. Drives the "turn it round" reading. */
  spin?: number;
  /** Tip toward the viewer, radians. Defaults to a three-quarter view. */
  tilt?: number;
  /** Scales the subject after it has been fitted to `size`. */
  zoom?: number;
}

interface Entry {
  root: THREE.Group;
  tick?: (t: number) => void;
}

let sceneRef: Scene3D | null = null;
let camera: THREE.OrthographicCamera | null = null;
let themeKey = "";
let activeTheme: ThemeColors | null = null;
const cache = new Map<string, Entry>();

/** True when this browser can render the 3D path at all. */
export function can3D(): boolean {
  return webglAvailable();
}

function ensureScene(theme: ThemeColors, key: string): boolean {
  if (!webglAvailable()) return false;
  if (!sceneRef || themeKey !== key) {
    // A theme change alters every light in the scene, so the whole cache goes.
    if (sceneRef) {
      for (const e of cache.values()) e.root.removeFromParent();
      cache.clear();
      sceneRef.dispose();
    }
    sceneRef = createScene(theme);
    themeKey = key;
    camera = null;
  }
  activeTheme = theme;
  if (!sceneRef) return false;
  if (!camera) {
    // The subject is normalised to a unit sphere, so a frustum a little wider
    // than that frames it exactly, whatever it is.
    camera = new THREE.OrthographicCamera(-1.06, 1.06, 1.06, -1.06, -50, 50);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  return true;
}

function subjectKey(s: Subject3D): string {
  switch (s.kind) {
    case "cell": return `cell:${s.plant ? "plant" : "animal"}`;
    case "organelle": return `org:${s.which}`;
    case "microbe": return `mic:${s.which}`;
    case "glassware": return `gl:${s.which}:${Math.round((s.level ?? 0.55) * 20)}:${s.color ?? ""}:${Math.round(s.bubbles ?? 0)}`;
    case "sphere": return `sph:${s.color}`;
    case "planet": return `pl:${s.color}:${s.rings ? 1 : 0}:${s.atmosphere ?? ""}`;
    case "atom": return `at:${s.protons}:${s.neutrons}:${s.electrons}`;
    case "dna": return "dna";
    case "molecule": return `mol:${s.formula}`;
    case "apparatus": return `app:${s.which}`;
  }
}

/**
 * Ball-and-stick geometry for the molecules the Grade 6-8 curriculum names.
 *
 * Real bond angles: water is bent at 104.5°, methane is tetrahedral, carbon
 * dioxide is linear. Drawing them with the wrong angle teaches the wrong
 * chemistry, and the shape is the whole reason water behaves as it does.
 */
export function moleculeGeometry(formula: string): {
  atoms: { el: string; pos: [number, number, number] }[];
  bonds: [number, number][];
} {
  const D = 1.15;
  switch (formula) {
    case "H2O": {
      const half = (104.5 * Math.PI) / 180 / 2;
      return {
        atoms: [
          { el: "O", pos: [0, 0, 0] },
          { el: "H", pos: [-Math.sin(half) * D, Math.cos(half) * D, 0] },
          { el: "H", pos: [Math.sin(half) * D, Math.cos(half) * D, 0] },
        ],
        bonds: [[0, 1], [0, 2]],
      };
    }
    case "CO2":
      return {
        atoms: [
          { el: "C", pos: [0, 0, 0] },
          { el: "O", pos: [-D * 1.1, 0, 0] },
          { el: "O", pos: [D * 1.1, 0, 0] },
        ],
        bonds: [[0, 1], [0, 2]],
      };
    case "CH4": {
      const k = D * 0.58;
      return {
        atoms: [
          { el: "C", pos: [0, 0, 0] },
          { el: "H", pos: [k, k, k] }, { el: "H", pos: [-k, -k, k] },
          { el: "H", pos: [-k, k, -k] }, { el: "H", pos: [k, -k, -k] },
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
      };
    }
    case "O2":
      return { atoms: [{ el: "O", pos: [-D * 0.6, 0, 0] }, { el: "O", pos: [D * 0.6, 0, 0] }], bonds: [[0, 1]] };
    case "N2":
      return { atoms: [{ el: "N", pos: [-D * 0.55, 0, 0] }, { el: "N", pos: [D * 0.55, 0, 0] }], bonds: [[0, 1]] };
    case "NaCl":
      return { atoms: [{ el: "Na", pos: [-D * 0.9, 0, 0] }, { el: "Cl", pos: [D * 0.9, 0, 0] }], bonds: [[0, 1]] };
    case "H2":
      return { atoms: [{ el: "H", pos: [-D * 0.4, 0, 0] }, { el: "H", pos: [D * 0.4, 0, 0] }], bonds: [[0, 1]] };
    default:
      // An unknown formula still gets a plausible diatomic rather than nothing.
      return { atoms: [{ el: "C", pos: [-D * 0.6, 0, 0] }, { el: "O", pos: [D * 0.6, 0, 0] }], bonds: [[0, 1]] };
  }
}

/**
 * Build a subject and normalise it.
 *
 * Every builder works at whatever scale suited it — a cell is 2.4 units
 * across, a DNA helix is 6 tall. Callers should not have to know that, so the
 * subject is measured, recentred and scaled to a unit sphere. After this, a
 * `size` in pixels means the same thing for every subject in the catalogue.
 */
function build(scene: THREE.Scene, s: Subject3D, theme: ThemeColors): Entry {
  const holder = new THREE.Group();
  let inner: THREE.Object3D;
  let tick: ((t: number) => void) | undefined;

  switch (s.kind) {
    case "cell": inner = buildCell(scene, { plant: s.plant }); break;
    case "organelle": inner = buildOrganelle(scene, s.which); break;
    case "microbe": inner = buildMicrobe(scene, s.which); break;
    case "glassware":
      inner = buildGlassware(scene, s.which, { level: s.level, color: s.color, bubbles: s.bubbles });
      break;
    case "planet": inner = buildPlanet(scene, 2, s.color, { rings: s.rings, atmosphere: s.atmosphere }); break;
    case "dna": inner = buildDNA(scene, 3); break;
    case "atom": {
      const a = buildAtom(scene, s.protons, s.neutrons, s.electrons);
      inner = a.group; tick = a.tick;
      break;
    }
    case "molecule": {
      const g = moleculeGeometry(s.formula);
      inner = buildMolecule(scene, g.atoms, g.bonds);
      break;
    }
    case "apparatus": {
      const ap = buildApparatus(scene, s.which, theme);
      inner = ap.group; tick = ap.tick;
      break;
    }
    case "sphere": {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 36),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(s.color), roughness: 0.3, metalness: 0.04,
          clearcoat: 0.4, clearcoatRoughness: 0.2, sheen: 0.5,
          sheenColor: new THREE.Color(s.color),
        }),
      ));
      scene.add(g);
      inner = g;
      break;
    }
  }

  // Measure, recentre, normalise to a unit sphere.
  const box = new THREE.Box3().setFromObject(inner);
  const centre = box.getCenter(new THREE.Vector3());
  const extent = Math.max(1e-3, box.getSize(new THREE.Vector3()).length() * 0.5);
  inner.position.sub(centre);
  const norm = new THREE.Group();
  norm.add(inner);
  norm.scale.setScalar(1 / extent);
  holder.add(norm);

  scene.add(holder);
  holder.visible = false;
  return { root: holder, tick };
}

/**
 * Draw one subject onto a 2D canvas, at the moment the caller asks for it.
 *
 * Compositing this way rather than blitting a whole 3D layer at the end of the
 * frame is what keeps the z-order honest: the subject lands exactly where the
 * 2D drawing it replaces would have landed, so the jar drawn around it still
 * closes over it, the caption still sits on top, and nothing painted later can
 * bury it. A stage shows a handful of specimens at once, so the handful of
 * render calls costs far less than the layering bugs the alternative causes.
 *
 * Returns false when WebGL is unavailable and the caller should take its 2D
 * path unchanged — a locked-down school Chromebook must still get a working
 * simulation.
 */
export function draw3D(
  ctx: CanvasRenderingContext2D, s: Subject3D,
  x: number, y: number, size: number, t: number, theme: ThemeColors,
  opts: Draw3DOptions = {},
): boolean {
  if (size < 4) return false;
  if (!ensureScene(theme, opts.themeKey ?? "default")) return false;
  const scene = sceneRef!.scene;
  const r = sharedRenderer();
  if (!r || !camera) return false;

  const key = subjectKey(s);
  let entry = cache.get(key);
  if (!entry) {
    try {
      entry = build(scene, s, activeTheme ?? theme);
    } catch {
      return false;   // A subject that will not build must not stop the frame.
    }
    cache.set(key, entry);
  }
  const built: Entry = entry;

  // Only this subject is visible for this render.
  for (const [k, e] of cache) e.root.visible = k === key;

  const g = built.root;
  g.position.set(0, 0, 0);
  g.scale.setScalar(opts.zoom ?? 1);
  // A slow turn by default: a still 3D object reads as a photograph, and the
  // moment it turns the student sees it is a solid rather than a picture.
  g.rotation.set(opts.tilt ?? -0.26, opts.spin ?? t * 0.35, 0);
  built.tick?.(t);

  // Render at the size it will actually occupy, so nothing is resampled up.
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.max(64, Math.min(1024, Math.round(size * dpr)));
  r.setSize(px, px, false);
  r.setClearColor(0x000000, 0);
  r.render(scene, camera);

  try {
    if (opts.reflect !== false) drawReflection(ctx, r.domElement, x, y, size, px);
    ctx.drawImage(r.domElement, x - size / 2, y - size / 2, size, size);
  } catch {
    return false;   // A tainted or zero-size canvas must not take the sim down.
  }
  return true;
}

let mirror: HTMLCanvasElement | null = null;

/**
 * The mirror image beneath a subject.
 *
 * Product photographers stand things on a polished sweep because the
 * reflection is what tells the eye the object is *on* something — without it a
 * rendered subject floats, and floating reads as clip art. It is flipped,
 * squashed toward the horizon and faded out within about half its own height,
 * which is roughly what a semi-gloss bench actually returns.
 */
function drawReflection(
  ctx: CanvasRenderingContext2D, src: HTMLCanvasElement,
  x: number, y: number, size: number, px: number,
) {
  if (typeof document === "undefined") return;
  if (!mirror) mirror = document.createElement("canvas");
  const m = mirror;
  if (m.width !== px || m.height !== px) { m.width = px; m.height = px; }
  const mc = m.getContext("2d");
  if (!mc) return;

  mc.clearRect(0, 0, px, px);
  mc.save();
  mc.translate(0, px);
  mc.scale(1, -1);
  mc.drawImage(src, 0, 0, px, px);
  mc.restore();

  // Fade it out with the distance from the contact point.
  mc.globalCompositeOperation = "destination-in";
  const g = mc.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(0.42, "rgba(0,0,0,0.08)");
  g.addColorStop(0.7, "rgba(0,0,0,0)");
  mc.fillStyle = g;
  mc.fillRect(0, 0, px, px);
  mc.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(m, x - size / 2, y + size * 0.5 - size * 0.03, size, size * 0.5);
  ctx.restore();
}
