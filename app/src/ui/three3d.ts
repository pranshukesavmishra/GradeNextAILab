import * as THREE from "three";
import type { ThemeColors } from "@engine/types";
import { isDarkTheme } from "./scene";

/**
 * Real 3D rendering.
 *
 * The founder's reference material is photorealistic 3D: a body with genuine
 * depth, organs that occlude one another, light that falls across curved
 * surfaces. Canvas 2D can imitate some of that with gradients, but it cannot
 * produce true occlusion, real specular response, or a shape you can turn
 * round and look at from another side — and turning a thing round is often
 * exactly what makes it make sense.
 *
 * AI-generated stills would look the part but cannot be a simulation: a
 * picture does not respond when a student moves a slider. WebGL gives both —
 * the visual quality of a render and the interactivity of a model.
 *
 * This module keeps a single renderer and reuses it across simulations, which
 * matters on the low-end Chromebooks this has to run on: WebGL contexts are a
 * scarce browser resource and creating one per simulation exhausts them.
 */

export interface Scene3D {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  render: (w: number, h: number) => void;
  /** Draw the current frame onto a 2D canvas, so 3D composites with 2D overlays. */
  blitTo: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  dispose: () => void;
  /** Orbit the camera. Simulations drive this from pointer drag or time. */
  orbit: (azimuth: number, elevation: number, distance: number) => void;
}

let shared: {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
} | null = null;

/** Lazily create the one renderer this app uses. Returns null if WebGL is absent. */
function getRenderer(): { renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement } | null {
  if (shared) return shared;
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: "low-power",
    });
    // Capped at 2: beyond that the cost outweighs any visible gain, which
    // matters on the machines this runs on.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    shared = { renderer, canvas };
    return shared;
  } catch {
    return null;   // No WebGL: callers fall back to their 2D path.
  }
}

export function webglAvailable(): boolean {
  return getRenderer() !== null;
}

/**
 * Three-point studio lighting.
 *
 * A key light up-left matching the 2D kit's convention so 3D and 2D subjects
 * agree about where the light is, a soft fill opposite to keep shadows from
 * going black, and a rim behind to separate the subject from its background.
 * This is what makes a rendered object look photographed rather than computed.
 */
function studioLights(scene: THREE.Scene, dark: boolean) {
  const key = new THREE.DirectionalLight(0xffffff, dark ? 2.4 : 2.1);
  key.position.set(-4, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  scene.add(key);

  const fill = new THREE.DirectionalLight(dark ? 0x8fa8d8 : 0xd8e4ff, dark ? 0.5 : 0.7);
  fill.position.set(4, 1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(dark ? 0xc79ad8 : 0xffffff, dark ? 1.4 : 0.9);
  rim.position.set(0, 2, -5);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(
    dark ? 0x352a44 : 0xf2ecff, dark ? 0x0d0913 : 0xcfc2dd, dark ? 0.7 : 0.9,
  ));
}

/** Build an empty lit scene ready for subjects. */
export function createScene(theme: ThemeColors, opts: { distance?: number } = {}): Scene3D | null {
  const r = getRenderer();
  if (!r) return null;
  const dark = isDarkTheme(theme);

  const scene = new THREE.Scene();
  studioLights(scene, dark);

  const camera = new THREE.PerspectiveCamera(38, 1.6, 0.1, 200);
  let az = 0.5, el = 0.25, dist = opts.distance ?? 8;

  const place = () => {
    camera.position.set(
      dist * Math.cos(el) * Math.sin(az),
      dist * Math.sin(el),
      dist * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(0, 0, 0);
  };
  place();

  return {
    scene,
    camera,
    orbit(azimuth, elevation, distance) {
      az = azimuth;
      // Clamp so the camera never flips over the pole, which is disorienting.
      el = Math.max(-1.3, Math.min(1.3, elevation));
      dist = Math.max(1.5, distance);
      place();
    },
    render(w, h) {
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      r.renderer.setSize(w, h, false);
      r.renderer.render(scene, camera);
    },
    blitTo(ctx, w, h) {
      this.render(w, h);
      ctx.drawImage(r.canvas, 0, 0, w, h);
    },
    dispose() {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
      scene.clear();
    },
  };
}

/* ------------------------------------------------------------------ *
 * Materials — the difference between a render and a diagram
 * ------------------------------------------------------------------ */

/** Wet, translucent biological tissue: membranes, organs, cytoplasm. */
export function tissueMaterial(color: string, opts: { opacity?: number; glossy?: number } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
    roughness: 0.42 - (opts.glossy ?? 0) * 0.3,
    metalness: 0,
    // Light entering the surface and scattering back out is what makes flesh
    // look like flesh rather than painted plastic.
    transmission: 0.18,
    thickness: 1.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
    sheen: 0.4,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.5),
  });
}

/** Laboratory glass: highly transmissive with real refraction. */
export function glassMaterial(tint = "#ffffff") {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tint),
    transparent: true,
    opacity: 0.28,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.92,
    thickness: 0.6,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  });
}

/** Brushed or polished metal for apparatus. */
export function metalMaterial(color = "#b9b2c4", roughness = 0.32) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), metalness: 0.95, roughness,
  });
}

/** A body that emits light: bulbs, stars, hot bodies. */
export function emissiveMaterial(color: string, strength = 1.6) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: strength,
    roughness: 0.5,
  });
}

/* ------------------------------------------------------------------ *
 * Subject builders
 * ------------------------------------------------------------------ */

/**
 * An organelle-bearing cell in 3D.
 *
 * The membrane is transmissive so the organelles inside are genuinely seen
 * through it rather than drawn over it, which is the whole reason to render a
 * cell in 3D: depth tells the student the organelles are suspended in a volume,
 * not arranged on a disc.
 */
export function buildCell(
  scene: THREE.Scene, opts: { plant?: boolean; radius?: number } = {},
): THREE.Group {
  const g = new THREE.Group();
  const R = opts.radius ?? 2.4;

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 48),
    tissueMaterial("#8e5bc4", { opacity: 0.3, glossy: 0.7 }),
  );
  shell.renderOrder = 2;
  g.add(shell);

  if (opts.plant) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(R * 2.1, R * 2.1, R * 2.1),
      tissueMaterial("#6fae5a", { opacity: 0.16 }),
    );
    wall.renderOrder = 3;
    g.add(wall);
  }

  const nuc = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.34, 48, 36),
    tissueMaterial("#5c2a86", { glossy: 0.5 }),
  );
  nuc.position.set(-R * 0.1, R * 0.05, 0);
  nuc.castShadow = true;
  g.add(nuc);

  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.12, 24, 18),
    tissueMaterial("#3d1a5c"),
  );
  nucleolus.position.set(-R * 0.04, R * 0.02, R * 0.1);
  g.add(nucleolus);

  // Mitochondria: capsules on varied axes, so the volume reads as inhabited.
  const mitoGeom = new THREE.CapsuleGeometry(R * 0.09, R * 0.24, 8, 20);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(mitoGeom, tissueMaterial("#e0708a", { glossy: 0.4 }));
    const a = i * 2.39, b = i * 1.17;
    m.position.set(
      Math.cos(a) * R * 0.62, Math.sin(b) * R * 0.5, Math.sin(a) * R * 0.58,
    );
    m.rotation.set(a, b, a * 0.5);
    m.castShadow = true;
    g.add(m);
  }

  if (opts.plant) {
    const chGeom = new THREE.SphereGeometry(R * 0.16, 20, 14);
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(chGeom, tissueMaterial("#3fae62", { glossy: 0.3 }));
      const a = i * 1.9;
      c.position.set(Math.cos(a) * R * 0.74, Math.sin(a * 0.7) * R * 0.5, Math.sin(a) * R * 0.7);
      c.scale.set(1, 0.55, 1);
      c.castShadow = true;
      g.add(c);
    }
  }

  // Vesicles
  const vGeom = new THREE.SphereGeometry(R * 0.045, 14, 10);
  for (let i = 0; i < 22; i++) {
    const v = new THREE.Mesh(vGeom, tissueMaterial("#43b6e8", { glossy: 0.8 }));
    const a = i * 0.79, r2 = R * (0.3 + 0.55 * ((i * 7) % 10) / 10);
    v.position.set(Math.cos(a) * r2, Math.sin(a * 1.3) * r2 * 0.8, Math.sin(a * 0.6) * r2);
    g.add(v);
  }

  scene.add(g);
  return g;
}

/** A molecule from atom positions and bonds, in real 3D. */
export function buildMolecule(
  scene: THREE.Scene,
  atoms: { el: string; pos: [number, number, number] }[],
  bonds: [number, number][],
): THREE.Group {
  const CPK: Record<string, { c: string; r: number }> = {
    H: { c: "#ffffff", r: 0.28 }, C: { c: "#2f2f38", r: 0.42 },
    N: { c: "#3050f8", r: 0.4 }, O: { c: "#e03030", r: 0.38 },
    S: { c: "#e6c53c", r: 0.5 }, P: { c: "#ff8000", r: 0.5 },
    Na: { c: "#ab5cf2", r: 0.6 }, Cl: { c: "#3fd03f", r: 0.5 },
  };
  const g = new THREE.Group();

  for (const a of atoms) {
    const spec = CPK[a.el] ?? { c: "#b0a8bb", r: 0.4 };
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(spec.r, 32, 24),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(spec.c), roughness: 0.28, metalness: 0.05,
        clearcoat: 0.9, clearcoatRoughness: 0.1,
      }),
    );
    m.position.set(...a.pos);
    m.castShadow = true;
    g.add(m);
  }

  for (const [i, j] of bonds) {
    const a = new THREE.Vector3(...atoms[i].pos);
    const b = new THREE.Vector3(...atoms[j].pos);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b);
    const bond = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, len, 16),
      new THREE.MeshStandardMaterial({ color: 0xcfc7d6, roughness: 0.5, metalness: 0.1 }),
    );
    bond.position.copy(mid);
    bond.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize(),
    );
    bond.castShadow = true;
    g.add(bond);
  }

  scene.add(g);
  return g;
}

/** A planet or moon with a real terminator, because the light is real. */
export function buildPlanet(
  scene: THREE.Scene, radius: number, color: string,
  opts: { atmosphere?: string; rings?: boolean } = {},
): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 48),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color), roughness: 0.85, metalness: 0,
    }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  if (opts.atmosphere) {
    const air = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.06, 48, 36),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(opts.atmosphere), transparent: true, opacity: 0.22,
        roughness: 1, transmission: 0.6, side: THREE.BackSide,
      }),
    );
    g.add(air);
  }
  if (opts.rings) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.4, radius * 2.2, 96),
      new THREE.MeshStandardMaterial({
        color: 0xc9b89a, side: THREE.DoubleSide, transparent: true, opacity: 0.7, roughness: 0.9,
      }),
    );
    ring.rotation.x = Math.PI / 2.3;
    g.add(ring);
  }
  scene.add(g);
  return g;
}

/** Particles in a box: gases, states of matter, diffusion. */
export function buildParticles(
  scene: THREE.Scene, count: number, color: string, boxSize: number,
): { group: THREE.Group; setPositions: (p: Float32Array) => void } {
  const group = new THREE.Group();
  const geom = new THREE.SphereGeometry(boxSize * 0.028, 16, 12);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color), roughness: 0.25, metalness: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.08,
  });
  const mesh = new THREE.InstancedMesh(geom, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  group.add(mesh);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(boxSize, boxSize, boxSize),
    glassMaterial("#dbe8ff"),
  );
  group.add(box);
  scene.add(group);

  const dummy = new THREE.Object3D();
  return {
    group,
    setPositions(p) {
      const n = Math.min(count, p.length / 3);
      for (let i = 0; i < n; i++) {
        dummy.position.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
