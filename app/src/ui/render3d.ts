import * as THREE from "three";
import type { ThemeColors } from "@engine/types";
import {
  buildAtom, buildCell, buildDNA, buildGlassware, buildMicrobe, buildMolecule,
  buildOrganelle, buildPlanet, createScene, sharedRenderer, webglAvailable,
} from "./three3d";
import type { Scene3D } from "./three3d";

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
  | { kind: "glassware"; which: "beaker" | "flask" | "testTube"; level?: number; color?: string }
  | { kind: "sphere"; color: string }
  | { kind: "planet"; color: string; rings?: boolean; atmosphere?: string }
  | { kind: "atom"; protons: number; neutrons: number; electrons: number }
  | { kind: "dna" }
  | { kind: "molecule"; formula: string };

export interface Place3DOptions {
  /** Turn about the vertical axis, radians. Drives the "turn it round" reading. */
  spin?: number;
  /** Tip toward the viewer, radians. Defaults to a three-quarter view. */
  tilt?: number;
  /** Scales the subject after it has been fitted to `size`. */
  zoom?: number;
  /** Front-to-back ordering when subjects overlap; larger draws in front. */
  depth?: number;
  /** Dim a subject that is not the focus, without redrawing it in 2D. */
  fade?: number;
}

interface Entry {
  root: THREE.Group;
  tick?: (t: number) => void;
}

let sceneRef: Scene3D | null = null;
let camera: THREE.OrthographicCamera | null = null;
let themeKey = "";
const cache = new Map<string, Entry>();
/** Subjects placed this frame; everything else is hidden before the draw. */
let live = new Set<string>();
let frameOpen = false;

/** True when this browser can render the 3D path at all. */
export function can3D(): boolean {
  return webglAvailable();
}

function subjectKey(s: Subject3D): string {
  switch (s.kind) {
    case "cell": return `cell:${s.plant ? "plant" : "animal"}`;
    case "organelle": return `org:${s.which}`;
    case "microbe": return `mic:${s.which}`;
    case "glassware": return `gl:${s.which}:${Math.round((s.level ?? 0.55) * 20)}:${s.color ?? ""}`;
    case "sphere": return `sph:${s.color}`;
    case "planet": return `pl:${s.color}:${s.rings ? 1 : 0}:${s.atmosphere ?? ""}`;
    case "atom": return `at:${s.protons}:${s.neutrons}:${s.electrons}`;
    case "dna": return "dna";
    case "molecule": return `mol:${s.formula}`;
  }
}

/**
 * Ball-and-stick geometry for the molecules the Grade 6-8 curriculum names.
 *
 * Real bond angles: water is bent at 104.5°, methane is tetrahedral, carbon
 * dioxide is linear. Drawing them with the wrong angle teaches the wrong
 * chemistry, and the shape is the whole reason water behaves as it does.
 */
function moleculeGeometry(formula: string): {
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
function build(scene: THREE.Scene, s: Subject3D): Entry {
  const holder = new THREE.Group();
  let inner: THREE.Object3D;
  let tick: ((t: number) => void) | undefined;

  switch (s.kind) {
    case "cell": inner = buildCell(scene, { plant: s.plant }); break;
    case "organelle": inner = buildOrganelle(scene, s.which); break;
    case "microbe": inner = buildMicrobe(scene, s.which); break;
    case "glassware": inner = buildGlassware(scene, s.which, { level: s.level, color: s.color }); break;
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
    case "sphere": {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 36),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(s.color), roughness: 0.22, metalness: 0.05,
          clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.4,
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
 * Open a 3D frame.
 *
 * Returns false when WebGL is unavailable, and callers then take their 2D
 * path unchanged. Nothing else in the app is allowed to assume 3D is present:
 * a locked-down school Chromebook with software rendering disabled must still
 * get a working, good-looking simulation.
 */
export function begin3D(width: number, height: number, theme: ThemeColors, key: string): boolean {
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
  if (!sceneRef) return false;

  if (!camera) camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -8000, 8000);
  camera.left = -width / 2; camera.right = width / 2;
  camera.top = height / 2; camera.bottom = -height / 2;
  camera.position.set(0, 0, 2000);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  live = new Set();
  frameOpen = true;
  return true;
}

/**
 * Put a subject on the stage at canvas coordinates.
 *
 * `size` is the diameter the subject should occupy, in the same pixels the 2D
 * kit uses, so a specimen drawn 3D sits exactly where its 2D twin would and a
 * simulation can switch between them without moving anything.
 */
export function place3D(
  s: Subject3D, x: number, y: number, size: number, t: number,
  width: number, height: number, opts: Place3DOptions = {},
): boolean {
  if (!frameOpen || !sceneRef) return false;
  const key = subjectKey(s);
  let entry = cache.get(key);
  if (!entry) {
    entry = build(sceneRef.scene, s);
    cache.set(key, entry);
  }
  live.add(key);

  const g = entry.root;
  g.visible = true;
  // Canvas y runs down, world y runs up.
  g.position.set(x - width / 2, height / 2 - y, (opts.depth ?? 0) * 0.5);
  g.scale.setScalar((size * 0.5) * (opts.zoom ?? 1));
  // A slow turn by default: a still 3D object reads as a photograph, and the
  // moment it turns the student sees it is a solid rather than a picture.
  g.rotation.set(opts.tilt ?? -0.28, opts.spin ?? t * 0.35, 0);
  entry.tick?.(t);
  void opts.fade;
  return true;
}

/**
 * Render the frame and composite it onto the 2D canvas.
 *
 * The 3D pass lands over whatever the simulation has already drawn — its
 * bench, its bins, its background — and under whatever it draws afterwards,
 * which is where labels, leaders and readouts go. That ordering is what keeps
 * text crisp: it is still drawn by the 2D engine, at device resolution, and
 * never resampled through a WebGL buffer.
 */
export function end3D(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  if (!frameOpen || !sceneRef || !camera) { frameOpen = false; return; }
  for (const [k, e] of cache) if (!live.has(k)) e.root.visible = false;

  const r = sharedRenderer();
  if (!r) { frameOpen = false; return; }
  r.setSize(width, height, false);
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(sceneRef.scene, camera);
  try {
    ctx.drawImage(r.domElement, 0, 0, width, height);
  } catch {
    // A tainted or zero-size canvas must not take the simulation down.
  }
  frameOpen = false;
}
