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
    // ACES rolls highlights off beautifully but desaturates as it does, and the
    // brief is vivid colour, so the exposure sits a little under 1 and the
    // materials carry their own colour floor rather than relying on key light.
    renderer.toneMappingExposure = 1.0;
    shared = { renderer, canvas };
    return shared;
  } catch {
    return null;   // No WebGL: callers fall back to their 2D path.
  }
}

/**
 * The one renderer, for callers that composite several subjects themselves.
 *
 * `render3d.ts` draws a whole stage of subjects in a single pass and needs the
 * renderer directly rather than through a `Scene3D`. Everything else should
 * use `createScene`.
 */
export function sharedRenderer(): THREE.WebGLRenderer | null {
  return getRenderer()?.renderer ?? null;
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

  const fill = new THREE.DirectionalLight(dark ? 0x7f92c8 : 0xc4d4ff, dark ? 0.42 : 0.5);
  fill.position.set(4, 1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(dark ? 0xc79ad8 : 0xffffff, dark ? 1.4 : 0.9);
  rim.position.set(0, 2, -5);
  scene.add(rim);

  // The hemisphere light is ambient: generous with it and every subject drifts
  // toward the colour of the room rather than its own.
  scene.add(new THREE.HemisphereLight(
    dark ? 0x352a44 : 0xece4fb, dark ? 0x0d0913 : 0xb9a8cc, dark ? 0.55 : 0.6,
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
  const c = new THREE.Color(color);
  // A colour floor. Tone mapping plus a bright fill light wash a mid-tone
  // toward grey, and a grey cell is exactly the complaint this whole effort
  // exists to answer. A little self-emission in the subject's own hue keeps
  // the colour saturated in shadow without making it look like it glows.
  const floor = c.clone().multiplyScalar(0.9);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
    roughness: 0.34 - (opts.glossy ?? 0) * 0.26,
    metalness: 0,
    emissive: floor,
    emissiveIntensity: 0.16,
    // Light entering the surface and scattering back out is what makes flesh
    // look like flesh rather than painted plastic.
    transmission: 0.16,
    thickness: 1.2,
    clearcoat: 0.62,
    clearcoatRoughness: 0.28,
    // Sheen keeps its hue: white sheen is what greys a saturated subject.
    sheen: 0.55,
    sheenColor: c.clone().lerp(new THREE.Color(0xffffff), 0.22),
    sheenRoughness: 0.5,
  });
}

/**
 * A saturated rim shell.
 *
 * Rendering the *inside* of a slightly larger copy of a shape, additively,
 * puts a bright edge exactly where the surface turns away from the viewer —
 * the fresnel falloff a real translucent body shows. It is the single cheapest
 * thing that stops a 3D subject reading as a pale grey ball.
 */
export function rimShell(radius: number, color: string, strength = 0.55): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 36),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: strength,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  m.renderOrder = 3;
  return m;
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

  // The cytosol: a dense, saturated interior so the organelles are seen
  // suspended *in* something rather than floating in front of the page.
  const cytosol = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 48, 36),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#7c47b8"), transparent: true, opacity: 0.3,
      roughness: 0.5, transmission: 0.55, thickness: R * 1.6,
      emissive: new THREE.Color("#5e2f96"), emissiveIntensity: 0.3,
      depthWrite: false,
    }),
  );
  cytosol.renderOrder = 1;
  g.add(cytosol);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 48),
    tissueMaterial("#8e5bc4", { opacity: 0.42, glossy: 0.7 }),
  );
  shell.renderOrder = 2;
  g.add(shell);
  // Fresnel rim: the bright violet edge a wet membrane shows where it turns
  // away from the eye. Without it the cell has no silhouette against a pale
  // background and the whole subject looks washed out.
  g.add(rimShell(R * 1.012, "#c98bff", 0.42));

  if (opts.plant) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(R * 2.1, R * 2.1, R * 2.1),
      tissueMaterial("#6fae5a", { opacity: 0.26 }),
    );
    wall.renderOrder = 4;
    g.add(wall);
    // Cellulose is fibrous, and the fibres are what makes the wall stiff.
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(R * 2.1, R * 2.1, R * 2.1)),
      new THREE.LineBasicMaterial({ color: new THREE.Color("#4e9440"), transparent: true, opacity: 0.85 }),
    );
    edges.renderOrder = 5;
    g.add(edges);
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

/* ------------------------------------------------------------------ *
 * Specimen builders — one per Art kind the archetype engine understands
 *
 * These exist so a simulation written as content gets a real 3D subject with
 * no extra work. The archetype engine maps an `art` descriptor onto one of
 * these, which is what lets a catalogue of hundreds be three-dimensional
 * without hundreds of separate 3D scenes being authored by hand.
 * ------------------------------------------------------------------ */

/** A single organelle, large, for topics that study one structure closely. */
export function buildOrganelle(scene: THREE.Scene, which: string): THREE.Group {
  const g = new THREE.Group();
  switch (which) {
    case "nucleus": {
      const n = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 64, 48), tissueMaterial("#5c2a86", { glossy: 0.5 }),
      );
      n.castShadow = true;
      g.add(n);
      const nl = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 32, 24), tissueMaterial("#3d1a5c"),
      );
      nl.position.set(0.3, 0.15, 0.5);
      g.add(nl);
      // Pores read as a real double envelope rather than a painted ring.
      const pore = new THREE.TorusGeometry(0.11, 0.04, 8, 16);
      for (let i = 0; i < 22; i++) {
        const a = i * 2.39, b = Math.acos(1 - 2 * ((i + 0.5) / 22));
        const p = new THREE.Mesh(pore, tissueMaterial("#7b4aa8"));
        p.position.setFromSphericalCoords(1.6, b, a);
        p.lookAt(0, 0, 0);
        g.add(p);
      }
      break;
    }
    case "mitochondrion": {
      const outer = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.7, 1.8, 12, 32),
        tissueMaterial("#e0708a", { opacity: 0.55, glossy: 0.5 }),
      );
      outer.rotation.z = Math.PI / 2;
      outer.castShadow = true;
      g.add(outer);
      // The cristae are the organelle's whole point: folding is what creates
      // the surface area that makes it the cell's power plant.
      const crista = new THREE.TorusGeometry(0.5, 0.07, 8, 24, Math.PI * 1.2);
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(crista, tissueMaterial("#c04a68"));
        c.position.x = -1.1 + i * 0.28;
        c.rotation.set(Math.PI / 2, 0, i % 2 ? 0.5 : -0.5);
        g.add(c);
      }
      break;
    }
    case "chloroplast": {
      const outer = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 48, 36),
        tissueMaterial("#3fae62", { opacity: 0.5, glossy: 0.4 }),
      );
      outer.scale.set(1, 0.6, 0.8);
      outer.castShadow = true;
      g.add(outer);
      // Grana: stacks of thylakoid discs, the sites that catch the light.
      const disc = new THREE.CylinderGeometry(0.26, 0.26, 0.07, 24);
      for (let s = 0; s < 4; s++) {
        for (let d = 0; d < 5; d++) {
          const m = new THREE.Mesh(disc, tissueMaterial("#1f7a3c"));
          m.position.set(-0.6 + s * 0.42, -0.16 + d * 0.09, (s % 2) * 0.2 - 0.1);
          g.add(m);
        }
      }
      break;
    }
    case "reticulum": {
      // Folded sheets, studded with ribosomes where it is rough.
      for (let i = 0; i < 6; i++) {
        const sheet = new THREE.Mesh(
          new THREE.TorusGeometry(0.9 - i * 0.06, 0.05, 8, 48, Math.PI * 1.4),
          tissueMaterial("#7b6be0", { glossy: 0.4 }),
        );
        sheet.position.y = -0.5 + i * 0.2;
        sheet.rotation.set(Math.PI / 2.2, i * 0.3, 0);
        g.add(sheet);
      }
      const rib = new THREE.SphereGeometry(0.055, 10, 8);
      for (let i = 0; i < 40; i++) {
        const r = new THREE.Mesh(rib, tissueMaterial("#4b3aa8"));
        const a = i * 0.61;
        r.position.set(Math.cos(a) * 0.85, -0.5 + (i % 6) * 0.2, Math.sin(a) * 0.85);
        g.add(r);
      }
      break;
    }
    case "golgi": {
      for (let i = 0; i < 5; i++) {
        const c = new THREE.Mesh(
          new THREE.TorusGeometry(0.8 - i * 0.09, 0.07, 8, 40, Math.PI * 1.1),
          tissueMaterial("#4aa3d8", { glossy: 0.5 }),
        );
        c.position.y = -0.35 + i * 0.18;
        c.rotation.set(Math.PI / 2, 0, 0.2);
        g.add(c);
      }
      const ves = new THREE.SphereGeometry(0.12, 16, 12);
      for (let i = 0; i < 6; i++) {
        const v = new THREE.Mesh(ves, tissueMaterial("#6cc3f0", { glossy: 0.8 }));
        v.position.set(0.9 + i * 0.16, 0.4 - i * 0.14, 0.2);
        g.add(v);
      }
      break;
    }
    default: {
      const v = new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 36), tissueMaterial("#43b6e8", { glossy: 0.8 }),
      );
      v.castShadow = true;
      g.add(v);
    }
  }
  scene.add(g);
  return g;
}

/** A virus or a bacterium. */
export function buildMicrobe(scene: THREE.Scene, which: "virus" | "bacterium"): THREE.Group {
  const g = new THREE.Group();
  if (which === "virus") {
    const capsid = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),   // faceted, as a real capsid is
      tissueMaterial("#9a4fc9", { glossy: 0.6 }),
    );
    capsid.castShadow = true;
    g.add(capsid);
    const spikeGeom = new THREE.ConeGeometry(0.09, 0.42, 12);
    const knob = new THREE.SphereGeometry(0.13, 14, 10);
    for (let i = 0; i < 34; i++) {
      const a = i * 2.399, b = Math.acos(1 - 2 * ((i + 0.5) / 34));
      const dir = new THREE.Vector3().setFromSphericalCoords(1, b, a);
      const s = new THREE.Mesh(spikeGeom, tissueMaterial("#7a35a8"));
      s.position.copy(dir.clone().multiplyScalar(1.16));
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(s);
      const k = new THREE.Mesh(knob, tissueMaterial("#c07ae0", { glossy: 0.7 }));
      k.position.copy(dir.clone().multiplyScalar(1.42));
      g.add(k);
    }
  } else {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 1.6, 12, 32),
      tissueMaterial("#9a4fc9", { glossy: 0.5 }),
    );
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    g.add(body);
    // Flagella as tubes following a helix, so they read as whipping tails.
    for (let f = -1; f <= 1; f++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const p = i / 24;
        pts.push(new THREE.Vector3(-1.4 - p * 1.5, Math.sin(p * 8) * 0.22 * p, f * 0.22 + Math.cos(p * 8) * 0.22 * p));
      }
      const tail = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 8, false),
        tissueMaterial("#b06ad8"),
      );
      g.add(tail);
    }
  }
  scene.add(g);
  return g;
}

/** Laboratory glassware with a liquid that has a real surface. */
export function buildGlassware(
  scene: THREE.Scene,
  which: "beaker" | "flask" | "testTube",
  opts: { level?: number; color?: string } = {},
): THREE.Group {
  const g = new THREE.Group();
  const level = Math.max(0, Math.min(1, opts.level ?? 0.55));
  const liquidColor = opts.color ?? "#8e5bc4";

  if (which === "flask") {
    const body = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 48, 1, true), glassMaterial());
    body.position.y = -0.2;
    g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1, 32, 1, true), glassMaterial());
    neck.position.y = 1.1;
    g.add(neck);
    if (level > 0.02) {
      const lh = 1.6 * level;
      const liq = new THREE.Mesh(
        new THREE.ConeGeometry(1.02 * level + 0.1, lh, 48),
        tissueMaterial(liquidColor, { opacity: 0.85, glossy: 0.9 }),
      );
      liq.position.y = -1.1 + lh / 2;
      g.add(liq);
    }
  } else {
    const r = which === "testTube" ? 0.42 : 1;
    const h = which === "testTube" ? 2.6 : 2;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), glassMaterial());
    g.add(body);
    const base = new THREE.Mesh(new THREE.CircleGeometry(r, 48), glassMaterial());
    base.rotation.x = -Math.PI / 2;
    base.position.y = -h / 2;
    g.add(base);
    if (level > 0.02) {
      const lh = (h - 0.1) * level;
      const liq = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.96, r * 0.96, lh, 48),
        tissueMaterial(liquidColor, { opacity: 0.88, glossy: 0.9 }),
      );
      liq.position.y = -h / 2 + lh / 2 + 0.05;
      liq.castShadow = true;
      g.add(liq);
    }
  }
  scene.add(g);
  return g;
}

/** An atom: nucleus of nucleons with electrons on visible shells. */
export function buildAtom(
  scene: THREE.Scene, protons: number, neutrons: number, electrons: number,
): { group: THREE.Group; tick: (t: number) => void } {
  const g = new THREE.Group();

  const pGeom = new THREE.SphereGeometry(0.2, 20, 16);
  const total = Math.max(1, protons + neutrons);
  for (let i = 0; i < total; i++) {
    const isP = i < protons;
    const m = new THREE.Mesh(pGeom, tissueMaterial(isP ? "#e0455a" : "#8a92a8", { glossy: 0.6 }));
    // Fibonacci packing keeps the nucleus dense and evenly filled.
    const a = i * 2.399, rr = 0.26 * Math.cbrt(i + 1);
    const b = Math.acos(1 - 2 * ((i + 0.5) / total));
    m.position.setFromSphericalCoords(rr, b, a);
    m.castShadow = true;
    g.add(m);
  }

  const shells = [2, 8, 18, 32];
  const orbiters: { mesh: THREE.Mesh; r: number; speed: number; tilt: number; phase: number }[] = [];
  let left = electrons;
  shells.forEach((cap, si) => {
    if (left <= 0) return;
    const n = Math.min(cap, left);
    left -= n;
    const R = 1.5 + si * 0.9;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x9d7ac0, transparent: true, opacity: 0.35 }),
    );
    ring.rotation.set(Math.PI / 2 + si * 0.4, si * 0.6, 0);
    g.add(ring);
    for (let i = 0; i < n; i++) {
      const e = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 12), emissiveMaterial("#4fc3f7", 1.4),
      );
      g.add(e);
      orbiters.push({ mesh: e, r: R, speed: 0.9 - si * 0.16, tilt: si * 0.4, phase: (i / n) * Math.PI * 2 });
    }
  });

  scene.add(g);
  return {
    group: g,
    tick(t) {
      for (const o of orbiters) {
        const a = t * o.speed + o.phase;
        o.mesh.position.set(
          Math.cos(a) * o.r,
          Math.sin(a) * o.r * Math.sin(o.tilt),
          Math.sin(a) * o.r * Math.cos(o.tilt),
        );
      }
    },
  };
}

/** A double helix with base-pair rungs. */
export function buildDNA(scene: THREE.Scene, turns = 3): THREE.Group {
  const g = new THREE.Group();
  const H = 6, R = 0.8;
  const strand = (offset: number, color: string) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const p = i / 120, a = p * turns * Math.PI * 2 + offset;
      pts.push(new THREE.Vector3(Math.cos(a) * R, -H / 2 + p * H, Math.sin(a) * R));
    }
    return new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.13, 12, false),
      tissueMaterial(color, { glossy: 0.6 }),
    );
  };
  g.add(strand(0, "#8e5bc4"));
  g.add(strand(Math.PI, "#4aa3d8"));

  const BASES = ["#e0455a", "#3fae62", "#f0a83c", "#4fc3f7"];
  for (let i = 0; i <= 34; i++) {
    const p = i / 34, a = p * turns * Math.PI * 2;
    const y = -H / 2 + p * H;
    const A = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
    const B = new THREE.Vector3(Math.cos(a + Math.PI) * R, y, Math.sin(a + Math.PI) * R);
    const rung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, A.distanceTo(B), 12),
      tissueMaterial(BASES[i % 4], { glossy: 0.5 }),
    );
    rung.position.copy(A.clone().add(B).multiplyScalar(0.5));
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    g.add(rung);
  }
  scene.add(g);
  return g;
}
