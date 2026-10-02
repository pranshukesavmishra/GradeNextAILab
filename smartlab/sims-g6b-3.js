/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-3  Levels of Organization
   (B3.1 The organizational hierarchy; B3.2 Cell specialization; B3.3 Tissues;
    B3.4 Organs; B3.5 Organ systems; B3.6 The organism as the whole system)

   Five benches, each a measurement a biologist makes at one level:
     hierarchy — zoom from a whole body (or a bean plant) down to one
                 molecule, level by level, and count: how many of each fit in
                 the one above, how many cells make the body (3.72 × 10¹³),
                 and whether a bigger animal has bigger cells (it does not).
     special   — the same genes, different jobs, and the physics that makes
                 each shape right: a red cell's disc against a sphere of the
                 same volume (Evans–Fung shape; oxygen loading by diffusion;
                 the narrowest tube it can pass, Canham & Burton), one long
                 neuron against a chain of short cells, root hairs and area.
     tissues   — cells working together: a nerve–muscle preparation in an
                 organ bath (recruitment, summation, tetanus, force ∝ area),
                 skin tape-stripped under an evaporimeter (each layer a
                 resistance to water), a tendon pulled to failure.
     organs    — the stomach: every layer of its wall does a job. The
                 mucus–bicarbonate barrier as reaction–diffusion (surface pH),
                 the muscle grinding a meal until 2 mm bits pass the pylorus.
     systems   — the whole body as stores and flows; knock one organ out and
                 time what fails first: seconds, minutes, days or weeks.
   Registration and every model load without a page; only drawing uses G6B, R3.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, GA = () => window.G6B;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2); const pr = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - pr : pr; };

  /* ============================================================
     1 · THE HIERARCHY — levels, sizes, counts
     ============================================================ */
  /* each level: its name, the size of one (m), the field the zoom shows it in (m),
     how many there are in the one above, and the anchor of the next level inside it (field px of 1000) */
  const PATHS = {
    human: [
      { lv: 'organism', name: 'an organism: a human', unit: 'body', size: 1.75, field: 2.2, draw: 'body', inst: 'the eye', inUp: 1, next: [14, -146] },
      { lv: 'organ system', name: 'an organ system: circulatory', unit: 'system', size: 1.75, field: 0.62, draw: 'circ', inst: 'the eye', inUp: 1, next: [40, -80], up: '1 of 11 systems' },
      { lv: 'organ', name: 'an organ: the heart', unit: 'heart', size: 0.12, field: 0.16, draw: 'heart', inst: 'the eye', inUp: 1, next: [-60, 80], up: 'one heart, 0.3 kg' },
      { lv: 'tissue', name: 'a tissue: cardiac muscle', unit: 'block', size: 6e-4, field: 7e-4, draw: 'cardiac', inst: 'a light microscope (×40 objective)', inUp: 1, next: [-100, -70], up: 'its wall is 1 cm thick' },
      { lv: 'cell', name: 'a cell: a heart muscle cell', unit: 'cell', size: 1.0e-4, field: 1.4e-4, draw: 'cmcell', inst: 'a light microscope (×100 oil)', inUp: 4.4e9, next: [-200, 160], up: 'cells in the heart' },
      { lv: 'organelle', name: 'an organelle: a mitochondrion', unit: 'mitochondrion', size: 2e-6, field: 3e-6, draw: 'mito', inst: 'an electron microscope', inUp: 6000, next: [200, -50], up: 'in one heart cell' },
      { lv: 'molecule', name: 'a molecule: ATP synthase', unit: 'machine', size: 2.5e-8, field: 4.5e-8, draw: 'atp', inst: 'an electron microscope (cryo-EM)', inUp: 20000, next: [0, 0], up: 'in one mitochondrion' }
    ],
    plant: [
      { lv: 'organism', name: 'an organism: a bean plant', unit: 'plant', size: 0.5, field: 0.75, draw: 'plant', inst: 'the eye', inUp: 1, next: [40, -180] },
      { lv: 'organ system', name: 'an organ system: the shoot', unit: 'system', size: 0.4, field: 0.5, draw: 'shoot', inst: 'the eye', inUp: 1, next: [190, -120], up: 'shoot and root: the two systems' },
      { lv: 'organ', name: 'an organ: a leaf', unit: 'leaf', size: 0.08, field: 0.11, draw: 'leaf', inst: 'the eye', inUp: 9, next: [80, 40], up: 'leaves on this plant' },
      { lv: 'tissue', name: 'tissues: a leaf in section', unit: 'section', size: 3e-4, field: 4.5e-4, draw: 'leafsec', inst: 'a light microscope (×40 objective)', inUp: 1, next: [-30, -160], up: 'the leaf is 0.3 mm thick' },
      { lv: 'cell', name: 'a cell: a palisade cell', unit: 'cell', size: 8e-5, field: 1.0e-4, draw: 'palisade', inst: 'a light microscope (×100 oil)', inUp: 2.4e7, next: [-138, -150], up: 'palisade cells in the leaf' },
      { lv: 'organelle', name: 'an organelle: a chloroplast', unit: 'chloroplast', size: 6e-6, field: 8e-6, draw: 'chloro', inst: 'a light microscope; its insides, an electron microscope', inUp: 40, next: [-30, -40], up: 'in one palisade cell' },
      { lv: 'molecule', name: 'a molecule: chlorophyll', unit: 'molecule', size: 1.5e-9, field: 3e-9, draw: 'chlorophyll', inst: 'X-ray crystallography', inUp: 6e8, next: [0, 0], up: 'in one chloroplast' }
    ]
  };
  const ZMAX = { human: Math.log10(2.2), plant: Math.log10(0.75) }, ZMIN = { human: Math.log10(4.5e-8), plant: Math.log10(3e-9) };
  /* where the zoom is: the level drawn, the next one and how far between (0…1, in log field) */
  function zoomAt(path, z) {
    const P = PATHS[path], W = Math.pow(10, z);
    let i = 0; while (i < P.length - 1 && W <= P[i + 1].field) i++;
    const a = P[i], b = P[i + 1];
    const t = b ? clamp(Math.log(a.field / W) / Math.log(a.field / b.field), 0, 1) : 0;
    return { i, t, W, a, b };
  }
  /* Bianconi et al. 2013 census of a 70 kg adult, grouped */
  const CENSUS = [['red blood cells', 2.63e13], ['other blood & marrow cells', 2.1e12], ['blood-vessel lining', 2.5e12], ['skin & gut lining', 4.6e12], ['liver cells', 2.41e11], ['nerve cells', 8.6e10], ['fat cells', 5.0e10], ['everything else', 0]];
  CENSUS[CENSUS.length - 1][1] = 3.72e13 - CENSUS.slice(0, -1).reduce((u, c) => u + c[1], 0);
  const CELLS_70 = CENSUS.reduce((u, c) => u + c[1], 0);
  /* bigger animals: the same kinds of cell, about the same size, just more of them */
  const ANIMALS = {
    mouse: { name: 'a mouse', kg: 0.025, rbc: 6.6, liver: 21, neuron: 4 },
    cat: { name: 'a cat', kg: 4, rbc: 5.8, liver: 21, neuron: 4 },
    goat: { name: 'a goat', kg: 50, rbc: 3.6, liver: 22, neuron: 4 },
    human: { name: 'a human', kg: 70, rbc: 7.8, liver: 22, neuron: 4 },
    horse: { name: 'a horse', kg: 500, rbc: 5.7, liver: 23, neuron: 4 },
    elephant: { name: 'an elephant', kg: 5000, rbc: 9.2, liver: 24, neuron: 4 }
  };
  const cellsIn = kg => CELLS_70 * kg / 70;

  /* ============================================================
     2 · SPECIALISED CELLS
     ============================================================ */
  /* a red cell: Evans & Fung (1972) — z(r) = ½R√(1−u²)(C0 + C2u² + C4u⁴), R0 = 3.91 µm. A cell that loses
     membrane at constant volume (a spherocyte) rounds up: s = 0 the normal disc, s = 1 a sphere of the same volume */
  const EF = { R0: 3.91, C0: 0.207, C2: 2.003, C4: -1.123 };
  const D_O2 = 1.0e-11;          // m²/s: oxygen moving into a red cell while its haemoglobin fills (binding slows the front)
  const _shape = {};
  function rbcShape(s) {
    const key = Math.round(clamp(s, 0, 1) * 200);
    if (_shape[key]) return _shape[key];
    const ss = key / 200, c0 = EF.C0 + (2 - EF.C0) * ss, c2 = EF.C2 * (1 - ss), c4 = EF.C4 * (1 - ss);
    const zf = u => 0.5 * Math.sqrt(Math.max(0, 1 - u * u)) * (c0 + c2 * u * u + c4 * u ** 4);
    const vol = (f, cc) => { let v = 0; const n = 400; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; v += 2 * f(u) * TAU * u / n; } return v; };
    const V0 = vol(u => 0.5 * Math.sqrt(Math.max(0, 1 - u * u)) * (EF.C0 + EF.C2 * u * u + EF.C4 * u ** 4)) * EF.R0 ** 3;
    const R = Math.cbrt(V0 / vol(zf));
    let A = 0; const n = 2000;
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n; A += 2 * Math.PI * (u0 + u1) / 2 * R * Math.hypot((u1 - u0) * R, (zf(u1) - zf(u0)) * R) * 2; }
    let zmax = 0; for (let i = 0; i <= 100; i++) zmax = Math.max(zmax, zf(i / 100) * R);
    const out = { s: ss, R, D: 2 * R, V: V0, A, z: u => zf(clamp(u, 0, 1)) * R, thick: 2 * zmax, centre: 2 * zf(0) * R };
    out.tube = minTube(A, V0); out.t95 = t95(out);
    _shape[key] = out; return out;
  }
  /* the narrowest round tube a cell can pass without stretching its membrane: a capsule of the same area and volume */
  function minTube(A, V) {
    const f = r => r * A / 2 - 2 / 3 * Math.PI * r ** 3 - V; let lo = 0, hi = Math.sqrt(A / (4 * Math.PI));
    if (f(hi) < 0) return 2 * hi;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return lo + hi;
  }
  /* each column of the cell loads through its two faces like a slab of half-thickness z */
  function slabFrac(t, h) { if (h <= 1e-6) return 1; let s = 0; for (let n = 0; n < 30; n++) { const k = 2 * n + 1; s += 8 / (k * k * Math.PI * Math.PI) * Math.exp(-k * k * Math.PI * Math.PI * D_O2 * t / (4 * h * h * 1e-12)); } return 1 - s; }
  function loaded(sh, t) { let v = 0, f = 0; const n = 120; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, h = sh.z(u), dv = 2 * h * u; v += dv; f += dv * slabFrac(t, h); } return f / v; }
  function t95(sh) { let lo = 0, hi = 10; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (loaded(sh, m) < 0.95) lo = m; else hi = m; } return hi; }
  const frontDepth = t => Math.sqrt(4 * D_O2 * t) * 1e6;       // µm reached from a face, for drawing
  /* neurons: speed from diameter (Hursh: myelinated ≈ 6 m/s per µm; bare ≈ 1 m/s × √d), 0.5 ms at each synapse */
  const SYN = 0.5e-3;
  const speedOf = (d, my) => my ? 6 * d : Math.sqrt(d);
  const oneCell = (L, d, my) => L / speedOf(d, my);
  const nCells = (L, cellUm) => Math.max(1, Math.ceil(L / (cellUm * 1e-6)));
  const chainTime = (L, d, my, cellUm) => oneCell(L, d, my) + (nCells(L, cellUm) - 1) * SYN;
  /* root hairs: 1 cm of root 0.5 mm across; each hair a cylinder 12 µm across */
  const ROOT = { R: 0.25, L: 10, rh: 0.006, Lp: 0.0036 };      // mm; Lp: µL of water per mm² of surface per hour in moist soil
  function rootArea(len, den) { const base = TAU * ROOT.R * ROOT.L, n = den * base; return { base, hairs: n * (TAU * ROOT.rh * len + Math.PI * ROOT.rh * ROOT.rh), n, total: base + n * (TAU * ROOT.rh * len + Math.PI * ROOT.rh * ROOT.rh) }; }
  const uptake = (len, den) => rootArea(len, den).total * ROOT.Lp;
  /* the same genome, different genes switched on */
  const GENES = [['HBB', 'haemoglobin: carries oxygen'], ['SCN1A', 'sodium channel: fires signals'], ['MYH7', 'heart myosin: pulls'], ['KRT14', 'keratin: tough skin'], ['INS', 'insulin: a hormone'], ['ACTB', 'actin: every cell’s skeleton'], ['GAPDH', 'glycolysis: every cell’s energy']];
  const EXPRESS = {
    rbc: { name: 'a red blood cell (as it was made)', on: ['HBB', 'ACTB', 'GAPDH'], note: 'it fills with haemoglobin, then throws out its nucleus' },
    neuron: { name: 'a nerve cell', on: ['SCN1A', 'ACTB', 'GAPDH'], note: 'channels all along its membrane' },
    root: { name: 'a root hair cell (a bean’s genes)', on: ['RHD6', 'PIP2', 'ACT', 'GAPC'], plant: true, note: 'its chloroplast genes are switched off: it is in the dark' }
  };
  const PLANT_GENES = [['RHD6', 'root hair defective 6: makes the hair'], ['PIP2', 'aquaporin: lets water in'], ['LHCB', 'light-harvesting protein (leaf only)'], ['RBCS', 'rubisco: fixes CO₂ (leaf only)'], ['ACT', 'actin: every cell’s skeleton'], ['GAPC', 'glycolysis: every cell’s energy']];

  /* ============================================================
     3 · TISSUES
     ============================================================ */
  /* muscle: each stimulus starts a twitch of the active state; force = Fmax·a/(a + K), K so a single twitch is ¼ of tetanus.
     Fibres are recruited as the stimulus passes their axons' thresholds; Fmax = 22.5 N per cm² of cross-section */
  const SPEC_T = 22.5;                                   // N/cm², the force a square centimetre of muscle can make
  const FIB = { slow: { tc: 0.1, name: 'slow (red) fibres', kc: 0.333 }, fast: { tc: 0.03, name: 'fast (white) fibres', kc: 0.333 } };
  const recruit = V => Phi((V - 4) / 1.2);              // share of fibres whose motor axons fire at V volts
  const twitchA = (t, tc) => t <= 0 ? 0 : (t / tc) * Math.exp(1 - t / tc);
  function forceAt(t, p) {
    const tc = FIB[p.ftype].tc, per = 1 / p.freq, burst = TRAIN; let a = 0;
    const nMax = Math.floor(Math.min(t, burst) / per);
    for (let n = 0; n <= nMax; n++) a += twitchA(t - n * per, tc);
    // force saturates with the active state: 1 − e^(−a/K), K = 3.48 so a single twitch (a = 1) gives ¼ of Fmax
    return SPEC_T * Math.pow(10, p.lcsa) * recruit(p.volt) * (1 - Math.exp(-a / FUSE_K));
  }
  const TRAIN = 1.0, WIN = 1.6, FUSE_K = -1 / Math.log(0.75);                           // a 1 s train of shocks, watched for 1.6 s
  function fuse90(ft) { for (let f = 1; f <= 200; f++) if (1 - Math.exp(-Math.E * FIB[ft].tc * f / FUSE_K) >= 0.9) return f; return 200; }
  function peakForce(p) { let m = 0; for (let t = 0; t <= WIN; t += 0.002) m = Math.max(m, forceAt(t, p)); return m; }
  const fMax = p => SPEC_T * Math.pow(10, p.lcsa) * recruit(p.volt);
  /* skin: water vapour from 100 % humidity under the skin to the room, through the stratum corneum's layers in series */
  const SKIN = { L0: 16, rLayer: 683, rAir: 780, removePer: 0.06 };   // s/m
  const csat = T => 216.7 * 6.112 * Math.exp(17.62 * T / (243.12 + T)) / (T + 273.15);   // g/m³ of water vapour at saturation
  const layersLeft = n => SKIN.L0 * Math.pow(1 - SKIN.removePer, n);
  function tewl(n, rh, Ta) { const dc = csat(32) - rh / 100 * csat(Ta), R = layersLeft(n) * SKIN.rLayer + SKIN.rAir; return Math.max(0, dc / R * 3600); }   // g/m²/h
  /* tendon: a toe region where the crimp straightens (to 3 % strain), then linear (E = 1.2 GPa) to failure at 100 MPa */
  const TEND = { E: 1200, toe: 0.03, uts: 100 };     // MPa
  function strainOf(stress, dig) { const E = TEND.E * (dig ? 0.35 : 1), sToe = E * TEND.toe / 2; return stress <= sToe ? Math.sqrt(2 * stress * TEND.toe / E) : TEND.toe + (stress - sToe) / E; }
  const utsOf = dig => TEND.uts * (dig ? 0.3 : 1);

  /* ============================================================
     4 · THE STOMACH
     ============================================================ */
  /* the mucus–bicarbonate barrier: acid diffuses in from the lumen, bicarbonate out from the lining; they meet at a front
     and neutralise. The lining holds 20 mM bicarbonate at its face while it can secrete enough; past that, acid reaches it.
     D is the one calibrated constant: the effective diffusion of acid in the gel, set so 150 µm of gel and 3 µmol/cm²/h of
     bicarbonate keep the surface near neutral down to lumen pH ≈ 1.4, as microelectrodes find in a healthy stomach. */
  const GEL = { D: 2e-11, cb0: 20 };
  function barrier(pHl, Lum, J) {
    const cL = 1000 * Math.pow(10, -pHl), Lm = Lum * 1e-6, Jm = J * 1e-6 / 1e-4 / 3600;
    const cap = Lm > 0 ? Jm * Lm / GEL.D : 0;
    let cb = Math.min(GEL.cb0, cap - cL), surfH = 0;
    if (cb < 0) { surfH = Math.min(cL, -cb); cb = 0; }
    const xf = cb > 0 ? Lum * cb / (cb + cL) : 0;
    const pHs = cb > 0 ? 6.1 + Math.log10(cb / 1.2) : surfH > 0 ? -Math.log10(surfH / 1000) : 7;
    // pH across the gel, from the lumen (f = 0) to the lining (f = 1)
    const prof = f => { const x = (1 - f) * Lum; if (Lum <= 0) return pHl; if (cb > 0) { if (x > xf) { const h = cL * (x - xf) / Math.max(1e-9, Lum - xf); return -Math.log10(Math.max(1e-7, h / 1000)); } const b = cb * (xf - x) / Math.max(1e-9, xf); return 6.1 + Math.log10(Math.max(0.05, b) / 1.2); } const h = surfH + (cL - surfH) * x / Lum; return -Math.log10(Math.max(1e-7, h / 1000)); };
    return { cL, cb, surfH, xf, pHs, prof, need: GEL.D * (cL + GEL.cb0) / Math.max(Lm, 1e-9) * 1e6 * 1e-4 * 3600 };
  }
  const pepsin = pH => 1 / (1 + Math.exp((pH - 3.6) / 0.4)) * Math.exp(-Math.pow(Math.max(0, 1.8 - pH), 2) / 1.2);
  /* the layers knocked out, as what each does to the inputs */
  const KNOCK = {
    none: { name: 'nothing: a healthy stomach' },
    acid: { name: 'the acid-making cells (a proton-pump blocker)', layer: 'glands' },
    mucus: { name: 'the mucus and bicarbonate (aspirin)', layer: 'gel' },
    muscle: { name: 'the muscle layers (the vagus nerve cut)', layer: 'muscle' },
    blood: { name: 'the blood supply (shock)', layer: 'submucosa' }
  };
  function effective(p) {
    const k = p.knock;
    return {
      pHl: k === 'acid' ? Math.max(p.pHl, 5.5) : p.pHl,
      gel: k === 'mucus' ? p.gel * 0.55 : p.gel,
      hco3: k === 'mucus' ? p.hco3 * 0.35 : k === 'blood' ? p.hco3 * 0.15 : p.hco3,
      muscle: k === 'muscle' ? 0.25 : 1,
      waves: p.waves
    };
  }
  /* churning: 400 bits of a meal; each antral wave catches some and grinds them; bits under 2 mm pass the pylorus */
  const GUT = { N: 400, hit: 0.3, grind: 0.05, pass: 0.035, sieve: 2, hours: 5 };
  function mealRun(bite, waves, muscle, seed) {
    const r = rng(seed || 7), N = GUT.N, d = new Float32Array(N), out = new Uint8Array(N), pos = [];
    for (let i = 0; i < N; i++) { const z = (r() + r() + r() - 1.5) * 1.4; d[i] = bite * Math.exp(0.35 * z); pos.push([r(), r()]); }
    const per = waves > 0 ? 60 / waves : 1e9, nW = waves > 0 ? Math.floor(GUT.hours * 3600 / per) : 0, grind = 1 - GUT.grind * muscle;
    const snaps = [d.slice()], gone = [new Uint8Array(N)], curve = [[0, 0]];
    let done = 0;
    for (let k = 0; k < nW; k++) {
      for (let i = 0; i < N; i++) { if (out[i]) continue; if (r() < GUT.hit) { d[i] *= grind + (1 - grind) * 0.4 * r(); if (d[i] < GUT.sieve && r() < GUT.pass * muscle) { out[i] = 1; done++; } } }
      snaps.push(d.slice()); gone.push(out.slice()); curve.push([(k + 1) * per / 60, done / N]);
    }
    if (!nW) curve.push([GUT.hours * 60, 0]);
    const at = m => { if (!nW) return 0; const k = clamp(Math.floor(m * 60 / per), 0, nW); return curve[k][1]; };
    const t50 = (curve.find(q => q[1] >= 0.5) || [Infinity])[0];
    return { snaps, gone, curve, per, nW, at, t50, left4h: 1 - at(240), pos };
  }

  /* ============================================================
     5 · THE WHOLE BODY — stores, flows and what fails first
     ============================================================ */
  const BODY = { FRC: 2.4, Hb: 1.005, VO2: 0.25, brainStore: 0.008, brainUse: 0.049, ecf: 14 };
  const hill = P => Math.pow(P, 2.7) / (Math.pow(P, 2.7) + Math.pow(26.8, 2.7));
  function satFromStore(T) {
    let lo = 0, hi = Math.min(Math.max(T, 0), BODY.FRC * 0.95);
    for (let k = 0; k < 50; k++) { const Lm = (lo + hi) / 2; if (Lm + BODY.Hb * hill(713 * Lm / BODY.FRC) > T) hi = Lm; else lo = Lm; }
    return hill(713 * lo / BODY.FRC);
  }
  const ACT = { rest: { met: 1, name: 'resting' }, walk: { met: 3.5, name: 'walking' }, run: { met: 8, name: 'running' } };
  const ORGANS = {
    none: { name: 'nothing', what: 'every organ working' },
    heart: { name: 'the heart', what: 'no blood moves: nothing is delivered anywhere' },
    lungs: { name: 'the lungs', what: 'no air in or out: the body lives on the oxygen it holds' },
    liver: { name: 'the liver', what: 'no glucose released between meals' },
    kidneys: { name: 'the kidneys', what: 'no urine: urea and potassium build up' },
    gut: { name: 'the digestive system', what: 'no food or water absorbed' },
    skin: { name: 'the sweat glands of the skin', what: 'no sweating: heat stays in' }
  };
  /* the dangers: each a reading, its normal value and the value that kills or knocks out */
  const DANGER = [
    { k: 'brain', name: 'oxygen in the brain', unit: '%', normal: 100, fail: 0, failName: 'unconscious' },
    { k: 'sat', name: 'oxygen in the blood (SpO₂)', unit: '%', normal: 97.5, fail: 50, failName: 'blackout' },
    { k: 'glu', name: 'blood glucose', unit: 'mM', normal: 5, fail: 2.8, failName: 'hypoglycaemic coma' },
    { k: 'temp', name: 'core temperature', unit: '°C', normal: 37, fail: 41, failName: 'heat stroke' },
    { k: 'water', name: 'water lost', unit: 'L', normal: 0, fail: 7, failName: 'fatal dehydration (10 % of mass)' },
    { k: 'K', name: 'blood potassium', unit: 'mM', normal: 4.2, fail: 7, failName: 'the heart stops beating' },
    { k: 'urea', name: 'blood urea', unit: 'mM', normal: 5, fail: 40, failName: 'uraemic poisoning' },
    { k: 'fat', name: 'fat left', unit: 'kg', normal: 12, fail: 1, failName: 'starvation' }
  ];
  const T_END = 120 * 86400;
  /* integrate on a log clock from 1 s to 120 days */
  function bodyRun(p) {
    const k = p.organ, met = ACT[p.act].met, mass = p.mass, s = mass / 70;
    const st = { brain: 100, glu: 5, temp: 37, water: 0, K: 4.2, urea: 5, fat: 12 * s * (p.fatPct / 17) };
    const FA = p.pure ? 0.88 : 0.14, T0 = BODY.FRC * s * FA + BODY.Hb * s * hill(713 * FA);
    let o2 = T0, t = 0;
    const out = [], fails = {};
    const rec = () => {
      const sat = k === 'lungs' || k === 'heart' ? satFromStore(o2 / s) * 100 : 97.5;
      const row = { t, sat, brain: st.brain, glu: st.glu, temp: st.temp, water: st.water, K: st.K, urea: st.urea, fat: st.fat };
      out.push(row);
      DANGER.forEach(d => { if (fails[d.k] != null) return; const v = row[d.k], bad = d.fail > d.normal ? v >= d.fail : v <= d.fail; if (bad) fails[d.k] = t; });
    };
    rec();
    const meals = p.meals;
    while (t < T_END) {
      const dt = Math.max(0.05, t * 0.02), h = Math.min(dt, T_END - t);
      // oxygen
      const use = BODY.VO2 * s * met / 60;
      if (k === 'lungs') o2 -= use * h;
      if (k === 'heart') { st.brain = Math.max(0, st.brain - 100 * BODY.brainUse / BODY.brainStore / 60 * h); o2 -= use * 0.2 * h; }
      else if (k === 'lungs') { const sat = satFromStore(o2 / s); st.brain = clamp(100 * (sat - 0.3) / 0.675, 0, 100); }
      // glucose: brain 5 g/h + the rest 2 g/h × activity; kidneys make 1.5 g/h; meals 3 a day if eating; the liver holds 5 mM
      const hr = (t / 3600) % 24, mealIn = meals && k !== 'gut' ? [7, 12.5, 19].reduce((u, m) => u + (hr >= m && hr < m + 2 ? 40 : 0), 0) : 0;
      const useG = 5 + 2 * met + 8 * Math.max(0, st.glu - 5);          // insulin sends glucose above 5 mM into muscle and fat
      if (k === 'liver' || k === 'heart') st.glu = Math.max(0.2, st.glu + (mealIn * s + 1.5 * s - useG * s) / 3600 * h / (BODY.ecf * s * 0.18));
      else st.glu = 5 + (meals && k !== 'gut' ? 0.8 * (mealIn > 0 ? 1 : 0) : 0);
      // heat: production by activity; dry loss to the air; sweat up to 900 W (about 1.4 L an hour) if the glands work
      const M = 80 * s * met, dry = 5.3 * s * (st.temp - p.airT), need = M - dry;
      const sweat = k === 'skin' || k === 'heart' ? 0 : clamp(need + 400 * (st.temp - 37), 0, 900 * s);
      st.temp += (M - dry - sweat) / (243000 * s) * h;
      // water: 2.5 L a day at rest, plus sweat (2.4 MJ per L); drinking replaces it if the gut absorbs it
      const lossW = (2.5 / 86400 * s * (0.7 + 0.3 * met)) + sweat / 2.43e6;
      const drink = p.drink && k !== 'gut' ? lossW : 0;
      st.water = Math.max(0, st.water + (lossW - drink) * h - (k === 'kidneys' && p.drink ? 1.5 / 86400 * h : 0));
      // kidneys: urea and potassium build up without them
      if (k === 'kidneys') { st.urea += 6 / 86400 * h * (k === 'gut' ? 0.6 : 1); st.K += 0.4 / 86400 * h; }
      // fat: burned for the energy food no longer brings (32 MJ per kg)
      if (k === 'gut' || !meals) st.fat = Math.max(0, st.fat - (7.5e6 * s * (0.6 + 0.4 * met)) / 32e6 / 86400 * h);
      t += h; rec();
      if (out.length > 4000) break;
    }
    return { out, fails, T0 };
  }
  function firstFail(R) { let best = null; Object.keys(R.fails).forEach(key => { if (best == null || R.fails[key] < R.fails[best]) best = key; }); return best; }
  const rowAt = (R, t) => { const o = R.out; let lo = 0, hi = o.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (o[m].t <= t) lo = m; else hi = m; } return o[lo]; };
  const fmtDur = s => !isFinite(s) ? 'never (in 120 days)' : s < 60 ? s.toFixed(s < 10 ? 1 : 0) + ' s' : s < 3600 ? (s / 60).toFixed(1) + ' min' : s < 86400 ? (s / 3600).toFixed(1) + ' h' : (s / 86400).toFixed(1) + ' days';

  /* ============================================================
     SET-UPS AND PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'hierarchy', label: 'Zoom from a body to a molecule', teaches: ['B3.1', 'B3.6'] },
    { value: 'special', label: 'Same genes, different jobs', teaches: ['B3.2'] },
    { value: 'tissues', label: 'Cells working together: tissues', teaches: ['B3.3'] },
    { value: 'organs', label: 'An organ: the stomach, layer by layer', teaches: ['B3.4'] },
    { value: 'systems', label: 'Knock one organ out', teaches: ['B3.5', 'B3.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'hierarchy',
    path: 'human', zoom: Math.log10(2.2), animal: 'human',
    cell: 'rbc', sph: 0, dcap: 4, transit: 0.75, llen: 0, diam: 10, myelin: true, clen: 100, hlen: 0.7, hden: 100,
    tissue: 'muscle', freq: 1, volt: 8, lcsa: Math.log10(0.2), ftype: 'fast', strips: 0, rh: 40, airTs: 22, load: 2000, csaT: 60, digest: false,
    pHl: 2, gel: 150, hco3: 3, bite: 8, waves: 3, knock: 'none', lapse: 300,
    organ: 'lungs', act: 'rest', pure: false, drink: true, meals: true, airT: 22, mass: 70, fatPct: 17
  };
  const SETUP_DEFAULTS = { hierarchy: {}, special: {}, tissues: {}, organs: { lapse: 300 }, systems: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    if (p.setup === 'hierarchy') p.zoom = clamp(p.zoom, ZMIN[p.path], ZMAX[p.path]);
    S.ts = 0; S.hist = []; S._lastRec = -1; S.beat = 0; S.flow = 0;
    S.meal = null; S.bodyR = null; S.lt = 0;
    if (p.setup === 'tissues') { S.trace = []; S.tw = 0; S.reading = 0; }
    if (p.setup === 'organs') { const E = effective(p); S.meal = mealRun(p.bite, E.waves, E.muscle, 7); S.mealNormal = mealRun(p.bite, 3, 1, 7); }
    if (p.setup === 'systems') { S.bodyR = bodyRun(p); S.lt = 0; }
    if (p.setup === 'tissues' && !S.cam) S.cam = Camera({ theta: -1.05, phi: 0.3, dist: 1.05, target: [0, 0, 0.13], fov: 0.72 });
    if (p.setup === 'tissues' && S.camKey !== p.tissue) { const h = { muscle: [-1.0, 0.26, 0.95, [-0.02, 0, 0.18]], skin: [-1.25, 0.5, 0.85, [0.0, 0.03, 0.06]], tendon: [-1.1, 0.22, 1.05, [0.03, 0, 0.22]] }[p.tissue]; S.cam = Camera({ theta: h[0], phi: h[1], dist: h[2], target: h[3], fov: 0.72 }); S.cam.minDist = 0.3; S.cam.maxDist = 3; S.camKey = p.tissue; }
    if (p.setup !== 'tissues') { S.cam = null; S.camKey = null; }
  }
  function step(S, dt) {
    const p = S.p;
    S.beat = 0.5 - 0.5 * Math.cos((S.t || 0) * TAU * 1.2); S.flow = ((S.t || 0) * 0.25) % 1;
    if (p.setup === 'special') S.ts += dt;
    else if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') {
        // play the train at a quarter speed, and keep the trace
        S.tw += dt * 0.25; if (S.tw > WIN + 0.4) { S.tw = 0; S.trace = []; }
        if (S.tw <= WIN) S.trace.push([S.tw, forceAt(S.tw, p)]);
      } else if (p.tissue === 'skin') {
        // the probe reading settles toward the true flux with a 6 s time constant
        S.ts += dt * 4; const target = tewl(p.strips, p.rh, p.airTs); S.reading += (target - S.reading) * (1 - Math.exp(-dt * 4 / 6));
        const m = Math.floor(S.ts); if (m !== S._lastRec) { S._lastRec = m; S.hist.push([S.ts, S.reading]); if (S.hist.length > 400) S.hist.shift(); }
      } else S.ts += dt;
    } else if (p.setup === 'organs') { if (S.ts < GUT.hours * 3600) S.ts = Math.min(GUT.hours * 3600, S.ts + dt * (p.lapse || 1)); }
    else if (p.setup === 'systems') { S.lt = Math.min(Math.log10(T_END), S.lt + dt * 0.45); }
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sci = v => { if (v < 1e4) return Math.round(v).toLocaleString('en-US'); const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return m.toFixed(m < 9.95 ? 1 : 0) + ' × 10' + String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''); };
  const lenT = m => GA() ? GA().lenText(m) : m + ' m';

  /* the zoom: draw level i scaled about its anchor, the next level growing into place */
  function drawZoom(ctx, cx, cy, R, S) {
    const p = S.p, G = GA(), Z = zoomAt(p.path, p.zoom), P = PATHS[p.path], o = { beat: S.beat, flow: S.flow, t: S.t || 0 };
    const view = 2 * R;                                   // px across the view's field Z.W
    const drawLevel = (lv, centre, alpha) => {
      const sc = view * lv.field / Z.W / 1000;           // px per level unit
      if (sc * 1000 < 4 || alpha <= 0.002) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(centre[0], centre[1]); ctx.scale(sc, sc);
      ctx.beginPath(); ctx.rect(-500, -500, 1000, 1000); ctx.clip();
      G.LV[lv.draw](ctx, o); ctx.restore();
    };
    const a = Z.a, b = Z.b, t = Z.t;
    // the parent: its anchor drifts to the centre as we zoom toward it
    const scA = view * a.field / Z.W / 1000, anc = a.next;
    const cA = [cx - anc[0] * scA * t, cy - anc[1] * scA * t];
    drawLevel(a, cA, 1);
    if (b && t > 0) {
      const at = [cA[0] + anc[0] * scA, cA[1] + anc[1] * scA];
      const fade = clamp((t - 0.45) / 0.4, 0, 1);
      if (fade > 0) drawLevel(b, at, fade);
      else if (t > 0.15) { ctx.save(); ctx.strokeStyle = 'rgba(255,214,107,.85)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4; const half = view * b.field / Z.W / 2; ctx.strokeRect(at[0] - half, at[1] - half, 2 * half, 2 * half); ctx.restore(); }
    }
  }
  function lay(g) {
    const W = g.w, H = g.h, HD = 74, FT = 26, narrow = W < 640;
    if (narrow) { const R = Math.max(80, Math.min((W - 30) / 2, (H - 58 - 40 - 70) / 2)); return { narrow, W, H, R, c: [W / 2, 58 + 42 + R] }; }
    const R = Math.max(110, Math.min((H - HD - FT - 20) / 2, W * 0.27));
    return { narrow, W, H, R, c: [W - R - 26, HD + 6 + R], left: W - 2 * R - 60 };
  }
  /* thumbnails of each level, cached on a canvas per path */
  const thumbs = {};
  function thumbOf(path, i) {
    const key = path + i; if (thumbs[key]) return thumbs[key];
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d');
    x.translate(60, 60); x.scale(0.12, 0.12); x.beginPath(); x.rect(-500, -500, 1000, 1000); x.clip(); GA().LV[PATHS[path][i].draw](x, { beat: 0, flow: 0, t: 0 });
    thumbs[key] = c; return c;
  }
  function grip(ctx, x, y, ch) { ctx.save(); ctx.fillStyle = 'rgba(255,214,107,.92)'; ctx.strokeStyle = '#05080F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#05080F'; ctx.font = mono(11, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x, y); ctx.restore(); }
  function stageHierarchy(S, g, Ly) {
    const p = S.p, ctx = g.ctx, G = GA(), Z = zoomAt(p.path, p.zoom), P = PATHS[p.path], [cx, cy] = Ly.c, R = Ly.R;
    G.circle(ctx, cx, cy, R, () => drawZoom(ctx, cx, cy, R, S), { bg: '#0B1220' });
    g.handle(cx + R * 0.72, cy - R * 0.72, 16, 'zoom'); grip(ctx, cx + R * 0.72, cy - R * 0.72, '±');
    const nb = G.niceLen(Z.W * 0.3); G.scaleBar(ctx, cx - nb.v / Z.W * R, cy + R - 30, nb.v / Z.W * 2 * R, nb.text);
    G.caption(ctx, cx - R, cy - R - 8, 2 * R, (Z.t > 0.6 && Z.b ? Z.b : Z.a).name, 'field ' + lenT(Z.W));
    // the ladder of levels on the left: thumbnails, names, sizes, counts
    if (!Ly.narrow && Ly.left > 230) {
      const x0 = 14, y0 = 82, lh = Math.max(28, Math.min(44, (Ly.H - y0 - 200) / P.length)), cur = Z.t > 0.6 && Z.b ? Z.i + 1 : Z.i;
      P.forEach((lv, i) => {
        const y = y0 + i * lh, on = i === cur, ts = lh - 5, th = thumbOf(p.path, i);
        ctx.save();
        if (th) { ctx.save(); ctx.beginPath(); ctx.arc(x0 + ts / 2, y + ts / 2, ts / 2, 0, TAU); ctx.clip(); ctx.drawImage(th, x0, y, ts, ts); ctx.restore(); }
        ctx.strokeStyle = on ? '#FFD66B' : 'rgba(150,170,210,.4)'; ctx.lineWidth = on ? 2.2 : 1; ctx.beginPath(); ctx.arc(x0 + ts / 2, y + ts / 2, ts / 2, 0, TAU); ctx.stroke();
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = mono(10, 700); ctx.fillStyle = on ? '#FFD66B' : '#DCE6F6'; ctx.fillText(kit().fitText(ctx, lv.lv.toUpperCase() + ' · ' + lv.name.replace(/^an? [a-z ]+: /, '') + ' · ' + lenT(lv.size), Ly.left - ts - 30), x0 + ts + 10, y + lh * 0.12);
        ctx.font = mono(9, 500); ctx.fillStyle = '#8FA0C0'; ctx.fillText(kit().fitText(ctx, i ? (lv.inUp > 1 ? sci(lv.inUp) + ' ' + lv.up : lv.up) : (p.path === 'human' ? sci(cellsIn(ANIMALS[p.animal].kg)) + ' cells in ' + ANIMALS[p.animal].name : 'about 10¹⁰ cells'), Ly.left - ts - 30), x0 + ts + 10, y + lh * 0.12 + 13);
        ctx.restore();
        if (i < P.length - 1) { ctx.strokeStyle = 'rgba(150,170,210,.35)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x0 + ts / 2, y + ts + 1); ctx.lineTo(x0 + ts / 2, y + lh - 1); ctx.stroke(); ctx.setLineDash([]); }
        ctx.restore();
        if (on) G.dashedCallout(ctx, x0 + ts / 2, y + ts / 2, ts / 2 + 3, cx - R * 0.7, cy - R * 0.7, 6, 'rgba(255,214,107,.45)');
      });
    }
  }
  /* the special cells */
  function stageSpecial(S, g, Ly) {
    const p = S.p, ctx = g.ctx, G = GA(), W = g.w, H = g.h, narrow = W < 640;
    const top = narrow ? 102 : 84, bot = H - 30;
    if (p.cell === 'rbc') {
      const sh = rbcShape(p.sph), disc = rbcShape(0);
      // left: face and section; right: the capillary
      const pw = narrow ? W - 20 : Math.min(W * 0.42, 460), ph = narrow ? (bot - top) * 0.46 : bot - top - 172;
      G.plate(ctx, 10, top, pw, ph, () => {
        const k = Math.min(pw / 2.6 / sh.R, ph / 3.2 / sh.R, 30), cxf = 10 + pw * 0.3, cyf = top + ph * 0.42;
        G.rbcFace(ctx, cxf, cyf, sh.R, k, u => sh.z(u));
        const cxs = 10 + pw * 0.74, ld = clamp(S.ts % (p.transit * 2.2) / p.transit, 0, 1) * p.transit;
        G.rbcProfile(ctx, cxs, cyf, sh.R, k * 0.72, u => sh.z(u), { loaded: true, depth: () => frontDepth(ld) });
        G.tag(ctx, cxf, cyf + sh.R * k + 16, 'face on: ' + sh.D.toFixed(1) + ' µm', { size: 10 });
        G.tag(ctx, cxs, cyf + sh.R * k + 16, 'cut through: O₂ reaching in', { size: 10, col: '#FFB0A0' });
        G.scaleBar(ctx, 22, top + ph - 26, 2 * k, '2 µm');
      });
      G.caption(ctx, 10, top - 4, pw, sh.s < 0.02 ? 'the red cell: a biconcave disc' : sh.s > 0.98 ? 'a sphere of the same volume' : 'a cell that has lost membrane (spherocyte)', 'area ' + sh.A.toFixed(0) + ' µm² · volume ' + sh.V.toFixed(0) + ' fL');
      const cx0 = narrow ? 10 : pw + 26, cw = narrow ? W - 20 : W - pw - 36, cy0 = narrow ? top + ph + 30 : top, chh = narrow ? (bot - top) * 0.38 : bot - top - 4;
      G.plate(ctx, cx0, cy0, cw, chh, () => {
        const k = Math.min(cw / 34, chh / 16), phase = (S.ts / 4) % 1;
        const passes = sh.tube <= p.dcap + 1e-9, tubeR = Math.min(sh.tube, p.dcap) / 2, tubeL = Math.max(0, (sh.V - 4 / 3 * Math.PI * tubeR ** 3) / (Math.PI * tubeR * tubeR));
        G.capillary(ctx, cx0, cy0, cw, chh, { k, dCap: p.dcap, phase, passes, tubeR: tubeR * 2, tubeL, Rcell: sh.R, dMin: sh.tube, sphere: sh.s > 0.6 });
        S._kcap = k; const hx = cx0 + cw * 0.86, hy = cy0 + chh * 0.5 - p.dcap * k / 2; g.handle(hx, hy, 14, 'dcap'); grip(ctx, hx, hy, '↕');
        G.tag(ctx, cx0 + cw * 0.66, cy0 + chh * 0.5 - p.dcap * k / 2 - 14, 'capillary ' + p.dcap.toFixed(1) + ' µm', { size: 10 });
        G.tag(ctx, cx0 + cw * 0.5, cy0 + chh - 16, passes ? 'it folds and passes: needs ≥ ' + sh.tube.toFixed(1) + ' µm' : 'stuck: it needs ' + sh.tube.toFixed(1) + ' µm', { size: 10.5, col: passes ? '#9FE0B8' : '#FF8A80' });
      });
      G.caption(ctx, cx0, cy0 - 4, cw, 'squeezing through a capillary', 'its area cannot stretch more than 3 %');
    } else if (p.cell === 'neuron') {
      const L = Math.pow(10, p.llen), one = oneCell(L, p.diam, p.myelin), ch = chainTime(L, p.diam, p.myelin, p.clen), n = nCells(L, p.clen);
      const slow = Math.max(1, ch / 5), tt = (S.ts % (ch / slow * 1.25 + 0.6)) * slow;
      const x0 = 30, x1 = W - 30, y1 = top + 70, y2 = top + 170;
      G.plate(ctx, 10, top, W - 20, Math.min(bot - top - 4, 250), () => {
        G.neuronTrack(ctx, x0, x1, y1, { cells: 1, myelin: p.myelin, at: tt / one });
        G.neuronTrack(ctx, x0, x1, y2, { cells: Math.min(n, Math.floor((x1 - x0) / 4)), myelin: false, at: tt / ch });
        G.tag(ctx, x0, y1 - 40, 'ONE CELL, ' + lenT(L) + ' long' + (p.myelin ? ', myelinated' : '') + ': ' + fmtMs(one), { align: 'left', size: 11, col: '#9FE0B8' });
        G.tag(ctx, x0, y2 - 40, 'A CHAIN OF ' + sci(n) + ' CELLS, ' + p.clen + ' µm each: ' + fmtMs(ch), { align: 'left', size: 11, col: '#FFB0A0' });
        G.tag(ctx, (x0 + x1) / 2, y2 + 44, (slow < 1.5 ? 'real time' : 'slowed ' + sci(slow) + ' times') + ' · the yellow dot is the signal', { size: 9.5, col: '#98A6C6' });
        if (n > (x1 - x0) / 4) G.tag(ctx, (x0 + x1) / 2, y2 + 22, 'only ' + Math.floor((x1 - x0) / 4) + ' of the ' + sci(n) + ' cells drawn: each joint costs 0.5 ms', { size: 9.5, col: '#98A6C6' });
      });
      G.caption(ctx, 10, top - 4, W - 20, 'one long cell, or many short ones?', 'speed ' + speedOf(p.diam, p.myelin).toFixed(1) + ' m/s in a ' + p.diam + ' µm axon');
    } else {
      const A = rootArea(p.hlen, p.hden), pw = narrow ? W - 20 : W * 0.6;
      G.plate(ctx, 10, top, pw, bot - top - 4, () => {
        const Lr = pw * 0.8, w = Math.max(14, Lr * 0.025 * 2), y = top + (bot - top) * 0.45;
        G.seedlingRoot(ctx, 10 + pw * 0.14, y, Lr * 0.82, w, { den: p.hden, len: p.hlen });
        // water arrows into the hair zone, as many as the uptake
        const nA = Math.round(clamp(uptake(p.hlen, p.hden) / uptake(1.5, 200) * 14, 1, 14));
        for (let k = 0; k < nA; k++) { const u = ((S.ts * 0.3 + k / nA) % 1), xx = 10 + pw * 0.08 + Lr * lerp(0.3, 0.78, (k + 0.5) / nA), s = k % 2 ? -1 : 1; G.arrow(ctx, xx, y + s * (60 - u * 30), xx, y + s * (34 - u * 30), 'rgba(110,180,255,' + (0.9 - u * 0.6) + ')', 2); }
        G.tag(ctx, 10 + pw * 0.08 + Lr * 0.54, y + w + 50, 'root hair zone: ' + Math.round(A.n) + ' hairs on 1 cm', { size: 10 });
        G.scaleBar(ctx, 24, bot - 28, Lr / 20, '1 mm');
      });
      G.caption(ctx, 10, top - 4, pw, 'a bean seedling’s root on wet paper', 'hairs ' + p.hlen.toFixed(2) + ' mm · ' + p.hden + ' per mm²');
      if (!narrow) { const R = Math.min((W - pw - 40) / 2.4, (bot - top) / 3.2); G.circle(ctx, W - (W - pw - 20) / 2 - 6, top + R + 20, R, () => { ctx.fillStyle = '#2A2418'; ctx.fillRect(0, 0, W, H); G.rootSection(ctx, W - (W - pw - 20) / 2 - 6, top + R + 20, R * 0.5, { den: p.hden, len: p.hlen }); }); G.caption(ctx, W - (W - pw - 20) / 2 - 6 - R, top + 14, 2 * R, 'cut across', 'each hair is one cell'); }
    }
  }
  const fmtMs = s => s < 1 ? (s * 1000).toFixed(s < 0.01 ? 2 : 1) + ' ms' : s.toFixed(2) + ' s';
  /* tissues: a 3D bench on the left, the tissue in section on the right */
  const lcdCache = {};
  function lcd(title, value, unit, col) { const key = [title, value, unit].join('|'); if (!lcdCache[key]) { if (Object.keys(lcdCache).length > 60) Object.keys(lcdCache).forEach(k => delete lcdCache[k]); lcdCache[key] = BENCH.lcdTex(title, value, unit, col); } return lcdCache[key]; }
  let traceCv = null;
  function traceCanvas(S) {
    if (typeof document === 'undefined') return null;
    if (!traceCv) { traceCv = document.createElement('canvas'); traceCv.width = 240; traceCv.height = 160; }
    const x = traceCv.getContext('2d'), F = Math.max(1e-6, fMax(S.p));
    x.fillStyle = '#0A1410'; x.fillRect(0, 0, 240, 160); x.strokeStyle = 'rgba(80,200,140,.25)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, 20 + i * 24); x.lineTo(240, 20 + i * 24); x.stroke(); }
    x.strokeStyle = '#7CF0C0'; x.lineWidth = 2.5; x.beginPath(); (S.trace || []).forEach(([t, f], i) => { const px = 6 + t / WIN * 228, py = 150 - f / F * 130; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
    return traceCv;
  }
  function stageTissues(S, g) {
    const p = S.p, ctx = g.ctx, G = GA(), W = g.w, H = g.h, narrow = W < 640, cam = S.cam;
    const R = narrow ? Math.min((W - 30) / 2, (H - 150) / 2) : Math.max(100, Math.min((H - 130) / 2, W * 0.24)), cx = narrow ? W / 2 : W - R - 26, cy = narrow ? 104 + R : 84 + R;
    const bw = narrow ? 0 : W - 2 * R - 60;
    if (!narrow && cam && bw > 200) {
      cam.setViewport(bw, H); cam.update();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 20, H); ctx.clip();
      const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
      MEAS.bench(F, -0.5, 0.5, -0.3, 0.3, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.5, 0.5, 0.3, 0, 0.6);
      const lab = [];
      if (p.tissue === 'muscle') {
        const F0 = forceAt(S.tw, p), fm = Math.max(1e-6, fMax(p));
        G.organBath(F, [0, 0], { shorten: F0 / Math.max(fm, 1e-9), lcd: lcd('STIM ' + p.volt.toFixed(1) + ' V', String(p.freq >= 10 ? p.freq.toFixed(0) : p.freq.toFixed(1)), 'Hz', '#7CF0C0'), trace: traceCanvas(S) });
        lab.push([[0, 0, 0.1], 'muscle in Ringer’s solution, 20 °C', 40, 30], [[-0.03, 0, 0.375], 'force transducer', -30, -26], [[0.16, -0.04, 0.07], 'stimulator', 20, -30], [[-0.18, 0.1, 0.16], 'the force, as recorded', -20, -30]);
      } else if (p.tissue === 'skin') {
        G.forearm(F, [0, 0], { strips: p.strips, lcd: lcd('TEWL g/m²/h', S.reading.toFixed(1), '', '#7CF0C0') });
        lab.push([[0.02, 0, 0.17], 'evaporimeter probe on the skin', -20, -40], [[-0.05, -0.01, 0.085], p.strips + ' tape strips taken here', -40, 30], [[0.2, 0.12, 0.09], 'water lost, g a m² an hour', 20, -30]);
      } else {
        const st = Math.min(p.load / (p.csaT), utsOf(p.digest) * 1.0001), broken = p.load / p.csaT > utsOf(p.digest);
        G.tensile(F, [0, 0], { strain: broken ? 0.12 : strainOf(st, p.digest), broken, digest: p.digest, lcd: lcd('LOAD N', broken ? 'BREAK' : p.load.toFixed(0), '', broken ? '#FF6A60' : '#7CF0C0') });
        lab.push([[0, 0, 0.2], 'a tendon, ' + p.csaT + ' mm² across' + (p.digest ? ', collagen digested' : ''), 40, 20], [[0, 0, 0.36], 'load cell', -30, -20]);
      }
      F.render();
      if (g.labels) G.benchLabels(ctx, cam, lab, bw, H);
      ctx.restore();
    }
    // the tissue, magnified
    if (p.tissue === 'muscle') {
      const act = forceAt(S.tw, p) / Math.max(1e-9, SPEC_T * Math.pow(10, p.lcsa));
      G.circle(ctx, cx, cy, R, () => { ctx.fillStyle = '#1A1014'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); G.muscleSection(ctx, cx, cy, R * 0.9, { recruit: recruit(p.volt), active: clamp(act, 0, 1) }); });
      G.caption(ctx, cx - R, cy - R - 8, 2 * R, 'the muscle cut across', Math.round(recruit(p.volt) * 100) + ' % of fibres recruited');
    } else if (p.tissue === 'skin') {
      G.circle(ctx, cx, cy, R, () => { G.skinSection(ctx, cx - R, cy - R * 0.85, 2 * R, R * 1.85, { layers: Math.round(layersLeft(p.strips)), L0: SKIN.L0, flux: tewl(p.strips, p.rh, p.airTs), t: S.t || 0 }); });
      G.caption(ctx, cx - R, cy - R - 8, 2 * R, 'skin in section', Math.round(layersLeft(p.strips)) + ' of 16 dead layers left');
    } else {
      const st = p.load / p.csaT, broken = st > utsOf(p.digest);
      G.circle(ctx, cx, cy, R, () => G.collagen(ctx, cx - R, cy - R, 2 * R, 2 * R, { strain: broken ? 0.12 : strainOf(Math.min(st, utsOf(p.digest)), p.digest), broken, digest: p.digest }));
      g.handle(cx + R * 0.72, cy - R * 0.72, 16, 'load'); grip(ctx, cx + R * 0.72, cy - R * 0.72, '↕');
      G.caption(ctx, cx - R, cy - R - 8, 2 * R, 'collagen fibres, magnified', broken ? 'torn' : strainOf(st, p.digest) < TEND.toe ? 'the crimp straightening' : 'straight: now they stretch');
    }
  }
  /* the stomach plate */
  function mealParticles(S) {
    const M = S.meal; if (!M) return [];
    const k = M.nW ? clamp(Math.floor(S.ts / M.per), 0, M.nW) : 0, d = M.snaps[k], out = M.gone[k], q = [];
    for (let i = 0; i < GUT.N; i += 2) { if (out[i]) continue; const [a, b] = M.pos[i]; q.push({ d: d[i], u: 0.2 + a * 0.55 + (d[i] < 2 ? 0.12 : 0), v: 0.42 + b * 0.35 }); }
    return q;
  }
  function stageOrgans(S, g) {
    const p = S.p, ctx = g.ctx, G = GA(), W = g.w, H = g.h, narrow = W < 640, E = effective(p), B = barrier(E.pHl, E.gel, E.hco3);
    const top = narrow ? 102 : 84, bot = H - 30;
    const ow = narrow ? W - 20 : W * 0.5, oh = narrow ? (bot - top) * 0.45 : bot - top;
    let anchor = null;
    G.plate(ctx, 10, top, ow, oh, () => {
      const per = E.waves > 0 ? 60 / E.waves : 0, wave = per ? ((S.ts % per) / per) : null;
      const box = { x: 10 + ow * 0.06, y: top + oh * 0.08, w: ow * 0.86, h: oh * 0.84 };
      const A = G.stomachOrgan(ctx, box, { wave: p.knock === 'muscle' ? null : wave, strength: E.muscle, particles: mealParticles(S), off: p.knock === 'muscle' ? 'muscle' : null });
      anchor = A.window;
      if (g.labels) G.sideLabels(ctx, [{ x: A.fundus[0], y: A.fundus[1], text: 'fundus', side: 'L' }, { x: A.oes[0], y: A.oes[1], text: 'oesophagus', side: 'R' }, { x: A.body[0], y: A.body[1], text: 'body', side: 'L' }, { x: A.antrum[0], y: A.antrum[1], text: 'antrum', side: 'R' }, { x: A.pylorus[0], y: A.pylorus[1], text: 'pylorus', side: 'R' }, { x: A.window[0], y: A.window[1], text: 'muscle', side: 'L' }], { mid: 10 + ow / 2, xL: 10 + ow * 0.2, xR: 10 + ow * 0.8, top: top + 14, bottom: top + oh - 14, maxW: ow * 0.19 });
    });
    G.caption(ctx, 10, top - 4, ow, 'the stomach, ' + (S.ts / 60).toFixed(0) + ' min after the meal', Math.round(S.meal.at(S.ts / 60) * 100) + ' % emptied');
    const wx = narrow ? 10 : ow + 30, wy = narrow ? top + oh + 26 : top, ww = narrow ? W - 20 : W - ow - 40, wh = narrow ? bot - wy - 4 : bot - top;
    let Lw = null;
    G.plate(ctx, wx, wy, ww, wh, () => {
      const inner = { x: wx + (narrow ? 8 : ww * 0.33), y: wy + 10, w: ww * (narrow ? 0.6 : 0.62), h: wh - 20 };
      Lw = G.stomachWall(ctx, inner.x, inner.y, inner.w, inner.h, { gel: E.gel, prof: B.prof, pHl: E.pHl, acidOnLining: B.surfH, acidOff: p.knock === 'acid', muscleOff: p.knock === 'muscle', bloodOff: p.knock === 'blood' });
      if (g.labels) { const xl = narrow ? inner.x + inner.w + 6 : wx + ww * 0.31, side = narrow ? 'R' : 'L'; G.sideLabels(ctx, [{ x: inner.x + 6, y: Lw.lumen, text: 'lumen pH ' + E.pHl.toFixed(1) }, { x: inner.x + 6, y: (Lw.gel[0] + Lw.gel[1]) / 2, text: 'mucus gel ' + E.gel.toFixed(0) + ' µm' }, { x: inner.x + 6, y: Lw.epi, text: 'lining: pH ' + B.pHs.toFixed(1) }, { x: inner.x + 6, y: Lw.glands, text: 'glands: acid, pepsin' }, { x: inner.x + 6, y: Lw.sub, text: 'submucosa: blood' }, { x: inner.x + 6, y: (Lw.musc[0] + Lw.musc[1]) / 2, text: 'muscle: 3 layers' }, { x: inner.x + 6, y: Lw.serosa, text: 'serosa' }].map(it => Object.assign(it, { side, x: side === 'R' ? inner.x + inner.w - 4 : it.x })), { mid: 0, xL: xl, xR: xl, top: wy + 12, bottom: wy + wh - 10, maxW: narrow ? W - xl - 12 : ww * 0.3, size: 9.5 }); }
    });
    G.caption(ctx, wx, wy - 4, ww, 'its wall, layer by layer', 'not to scale: the gel is ' + E.gel.toFixed(0) + ' µm, the wall ~5 mm');
    if (!narrow && anchor && Lw) G.dashedCallout(ctx, anchor[0], anchor[1], 16, wx + 4, wy + wh * 0.45, 2, 'rgba(220,230,250,.45)');
  }
  /* the whole body */
  function stageSystems(S, g) {
    const p = S.p, ctx = g.ctx, G = GA(), W = g.w, H = g.h, narrow = W < 640, R = S.bodyR, t = Math.pow(10, S.lt), row = rowAt(R, t);
    const top = narrow ? 102 : 84, bot = H - 30;
    const bw = narrow ? W * 0.5 : Math.min(W * 0.36, 360);
    G.plate(ctx, 10, top, narrow ? W - 20 : bw, bot - top, () => {
      const Hb = (bot - top) * 0.94, cx = narrow ? W * 0.3 : 10 + bw / 2;
      const off = p.organ === 'gut' ? 'gut' : p.organ === 'none' ? null : p.organ;
      const A = G.body(ctx, cx, top + 8, Hb, { show: { circ: true, resp: true, dig: true, exc: true, nerv: true }, off, beat: p.organ === 'heart' ? 0 : S.beat, flow: S.flow, pulse: p.organ !== 'heart' });
      if (g.labels && !narrow) G.sideLabels(ctx, [['brain', 'brain'], ['lungs', 'lungs'], ['heart', 'heart'], ['liver', 'liver'], ['stomach', 'stomach'], ['kidneys', 'kidneys'], ['smallInt', 'intestines'], ['skin', 'skin']].map(([k, tx]) => ({ x: A[k][0], y: A[k][1], text: tx, col: (p.organ === k || (p.organ === 'gut' && (k === 'stomach' || k === 'smallInt')) || (p.organ === 'skin' && k === 'skin')) ? '#FF8A80' : null, side: ['brain', 'lungs', 'liver', 'kidneys'].includes(k) ? 'L' : 'R' })), { mid: cx, xL: 10 + 72, xR: 10 + bw - 72, top: top + 10, bottom: bot - 10, maxW: 70 });
    });
    G.caption(ctx, 10, top - 4, narrow ? W - 20 : bw, p.organ === 'none' ? 'every organ working' : 'without ' + ORGANS[p.organ].name, ACT[p.act].name + ' · ' + p.mass + ' kg');
    // the monitor
    const mx = narrow ? 10 : bw + 30, mw = narrow ? W - 20 : W - bw - 40, my = narrow ? top + (bot - top) * 0.62 : top;
    const rows = DANGER.map(d => { const v = d.k === 'sat' ? row.sat : row[d.k], f = (v - d.normal) / (d.fail - d.normal), when = R.fails[d.k]; return { name: d.name, value: (d.k === 'water' || d.k === 'fat' ? v.toFixed(1) : d.k === 'temp' ? v.toFixed(1) : d.k === 'K' ? v.toFixed(2) : v.toFixed(d.k === 'glu' ? 2 : 0)) + ' ' + d.unit, f, note: when != null ? d.failName + ' at ' + fmtDur(when) : 'safe for 120 days' }; });
    const show = narrow ? rows.filter(r => r.f > 0.02).slice(0, 3) : rows;
    G.plate(ctx, mx, my, mw, narrow ? bot - my : Math.min(bot - top, 44 + show.length * 40), () => {
      ctx.save(); ctx.font = mono(11, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('T + ' + fmtDur(t), mx + 12, my + 10); ctx.font = mono(9.5, 500); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'right'; ctx.fillText('time since ' + (p.organ === 'none' ? 'the start' : 'the organ stopped') + ' (log clock)', mx + mw - 12, my + 12); ctx.restore();
      G.monitor(ctx, mx + 12, my + 34, mw - 24, show.length ? show : rows.slice(0, 2));
    });
  }

  /* the stage for each set-up, then the cards and the header */
  function drawStage(S, g) {
    const p = S.p, K = kit(); if (!K || !GA()) return;
    if (p.setup === 'hierarchy') stageHierarchy(S, g, lay(g));
    else if (p.setup === 'special') stageSpecial(S, g);
    else if (p.setup === 'tissues') stageTissues(S, g);
    else if (p.setup === 'organs') stageOrgans(S, g);
    else stageSystems(S, g);
    cards(S, g);
    const Hd = headerOf(S); K.header(g, Hd[0], Hd[1], Hd[2]);
  }
  function cards(S, g) {
    const p = S.p, G = GA(), W = g.w, narrow = W < 640;
    if (p.setup === 'hierarchy') {
      const Ly = lay(g), w = narrow ? 0 : Math.min(300, Ly.left - 10);
      if (p.path === 'human') {
        const rows = [[{ t: 'animal', bold: true }, { t: 'cells', bold: true }, { t: 'red cell', bold: true }]].concat(Object.keys(ANIMALS).map(k => { const a = ANIMALS[k], on = k === p.animal; return [{ t: a.name.replace(/^an? /, '') + ' ' + (a.kg < 1 ? a.kg * 1000 + ' g' : a.kg + ' kg'), col: on ? '#FFD66B' : null, bold: on }, { t: sci(cellsIn(a.kg)), col: on ? '#FFD66B' : null }, { t: a.rbc.toFixed(1) + ' µm', col: on ? '#FFD66B' : null }]; }));
        G.rowsCard(g, S, 'Bigger animal, bigger cells?', rows, { x: 10, w: narrow ? 0 : Math.max(Math.min(w, Ly.left - 4), 250) }, { cols: [0, 0.5, 0.78], chip: 'animals' });
      } else {
        const Z = zoomAt(p.path, p.zoom), lv = Z.t > 0.6 && Z.b ? Z.b : Z.a;
        G.rowsCard(g, S, 'At this level', [[{ t: 'what', bold: true }, lv.name.replace(/^an? [a-z ]+: /, '')], [{ t: 'size', bold: true }, lenT(lv.size)], [{ t: 'seen with', bold: true }, lv.inst]], { x: narrow ? 10 : Math.max(10, Ly.left - 290), w: 290 }, { cols: [0, 0.3], chip: 'this level' });
      }
    } else if (p.setup === 'special') {
      const e = EXPRESS[p.cell], list = e.plant ? PLANT_GENES : GENES;
      const rows = list.map(([gname, what]) => { const on = e.on.includes(gname); return [{ t: (on ? '● ' : '○ ') + gname, bold: on, col: on ? '#9FE0B8' : '#5A6A84' }, { t: what, col: on ? '#DCE6F6' : '#5A6A84' }]; });
      rows.push([{ t: 'so', bold: true }, { t: e.note, col: '#FFD66B' }]);
      G.rowsCard(g, S, 'Genes switched on in ' + e.name, rows, { x: narrow ? 10 : (p.cell === 'root' ? W * 0.6 + 20 : 10), w: narrow ? 0 : (p.cell === 'root' ? W * 0.4 - 30 : Math.min(420, W * 0.42)) }, { cols: [0, 0.28], chip: 'genes' });
    } else if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') G.rowsCard(g, S, 'The nerve–muscle preparation', [[{ t: 'muscle', bold: true }, csaName(p.lcsa)], [{ t: 'fibres', bold: true }, FIB[p.ftype].name + ', twitch ' + (FIB[p.ftype].tc * 1000).toFixed(0) + ' ms'], [{ t: 'recruited', bold: true }, Math.round(recruit(p.volt) * 100) + ' % at ' + p.volt.toFixed(1) + ' V'], [{ t: 'peak force', bold: true }, { t: fmtN(peakForce(p)) + ' of ' + fmtN(fMax(p)) + ' possible', col: '#FFD66B' }]], { x: 10, w: narrow ? 0 : Math.min(330, g.w * 0.4) }, { cols: [0, 0.28], chip: 'muscle' });
      else if (p.tissue === 'skin') G.rowsCard(g, S, 'Tape stripping the forearm', [[{ t: 'strips', bold: true }, p.strips + ' taken'], [{ t: 'dead layers', bold: true }, layersLeft(p.strips).toFixed(1) + ' of 16 left'], [{ t: 'water lost', bold: true }, { t: tewl(p.strips, p.rh, p.airTs).toFixed(1) + ' g/m²/h (meter ' + S.reading.toFixed(1) + ')', col: '#FFD66B' }], [{ t: 'whole body', bold: true }, (tewl(p.strips, p.rh, p.airTs) * 1.8 * 24 / 1000).toFixed(2) + ' L a day if all skin were so']], { x: 10, w: narrow ? 0 : Math.min(330, g.w * 0.4) }, { cols: [0, 0.3], chip: 'skin' });
      else { const st = p.load / p.csaT, br = st > utsOf(p.digest); G.rowsCard(g, S, 'Pulling a tendon', [[{ t: 'stress', bold: true }, st.toFixed(1) + ' MPa = ' + p.load + ' N ÷ ' + p.csaT + ' mm²'], [{ t: 'stretch', bold: true }, br ? 'broken' : (strainOf(st, p.digest) * 100).toFixed(1) + ' %'], [{ t: 'breaks at', bold: true }, { t: (utsOf(p.digest) * p.csaT).toFixed(0) + ' N (' + utsOf(p.digest) + ' MPa)', col: br ? '#FF8A80' : '#FFD66B' }], [{ t: 'one cell', bold: true }, 'a tenocyte alone holds ~ 1 µN']], { x: 10, w: narrow ? 0 : Math.min(330, g.w * 0.4) }, { cols: [0, 0.26], chip: 'tendon' }); }
    } else if (p.setup === 'organs') {
      const E = effective(p), B = barrier(E.pHl, E.gel, E.hco3);
      if (narrow) G.rowsCard(g, S, 'Layer knocked out: ' + KNOCK[p.knock].name, [[{ t: 'surface pH', bold: true }, B.pHs.toFixed(1)], [{ t: 'emptied', bold: true }, Math.round(S.meal.at(S.ts / 60) * 100) + ' %']], { x: 10, w: 0 }, { cols: [0, 0.4], chip: 'layers' });
    } else if (p.setup === 'systems') {
      const R = S.bodyR, ff = firstFail(R);
      if (narrow) G.rowsCard(g, S, 'What fails first', [[{ t: 'knocked out', bold: true }, ORGANS[p.organ].name], [{ t: 'which means', bold: true }, ORGANS[p.organ].what], [{ t: 'first', bold: true }, { t: ff ? DANGER.find(d => d.k === ff).failName + ' at ' + fmtDur(R.fails[ff]) : 'nothing in 120 days', col: ff ? '#FF8A80' : '#9FE0B8' }]], { x: narrow ? 10 : Math.min(360, g.w * 0.36) + 30, w: narrow ? 0 : g.w - Math.min(360, g.w * 0.36) - 40, y: g.h - 26 - 79 - 6 }, { cols: [0, 0.24], chip: 'first to fail' });
    }
  }
  const fmtN = v => v >= 100 ? v.toFixed(0) + ' N' : v >= 1 ? v.toFixed(1) + ' N' : (v * 1000).toFixed(v < 0.01 ? 2 : 1) + ' mN';
  const csaName = l => { const c = Math.pow(10, l); return c < 1e-3 ? 'one fibre, ' + (c * 1e8).toFixed(0) + ' µm² across' : c < 0.6 ? 'a frog’s calf muscle, ' + c.toFixed(2) + ' cm²' : c < 15 ? 'a muscle of ' + c.toFixed(1) + ' cm² (a biceps ≈ 5)' : 'a thigh muscle, ' + c.toFixed(0) + ' cm²'; };

  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'hierarchy') {
      const Z = zoomAt(p.path, p.zoom), lv = Z.t > 0.6 && Z.b ? Z.b : Z.a;
      return [lv.lv[0].toUpperCase() + lv.lv.slice(1) + ': ' + lv.name.replace(/^an? [a-z ]+: /, '') + ' — ' + lenT(lv.size), 'field of view ' + lenT(Z.W) + ' · seen with ' + lv.inst + (p.path === 'human' ? ' · ' + sci(cellsIn(ANIMALS[p.animal].kg)) + ' cells in ' + ANIMALS[p.animal].name : ''), 'cells → tissues → organs → organ systems → an organism: each level is made of the one below, working together'];
    }
    if (p.setup === 'special') {
      if (p.cell === 'rbc') { const sh = rbcShape(p.sph), L95 = loaded(sh, p.transit); return [(sh.s < 0.02 ? 'A red cell, a biconcave disc' : sh.s > 0.98 ? 'A red cell rounded to a sphere' : 'A red cell rounding up') + ': ' + Math.round(L95 * 100) + ' % loaded with oxygen in ' + p.transit + ' s', 'area ' + sh.A.toFixed(0) + ' µm² for ' + sh.V.toFixed(0) + ' fL · thickest ' + sh.thick.toFixed(2) + ' µm · fits a ' + sh.tube.toFixed(1) + ' µm tube at best', 'the same haemoglobin genes as a sphere would have: the shape is the job']; }
      if (p.cell === 'neuron') { const Lm = Math.pow(10, p.llen); return ['A signal over ' + lenT(Lm) + ': one cell ' + fmtMs(oneCell(Lm, p.diam, p.myelin)) + ', a chain of short cells ' + fmtMs(chainTime(Lm, p.diam, p.myelin, p.clen)), (p.myelin ? 'myelinated' : 'bare') + ' axon ' + p.diam + ' µm across: ' + speedOf(p.diam, p.myelin).toFixed(1) + ' m/s · each joint between cells costs 0.5 ms', 'a nerve cell is long because a signal crosses one cell fast and every gap slowly']; }
      const A = rootArea(p.hlen, p.hden); return ['Root hairs multiply the surface ' + (A.total / A.base).toFixed(1) + ' times: ' + A.total.toFixed(0) + ' mm² on 1 cm of root', Math.round(A.n) + ' hairs, ' + p.hlen.toFixed(2) + ' mm long · water in ≈ ' + uptake(p.hlen, p.hden).toFixed(2) + ' µL an hour', 'each root hair is a single epidermal cell grown out sideways'];
    }
    if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') return ['Muscle, ' + p.freq + ' shocks a second at ' + p.volt.toFixed(1) + ' V: peak ' + fmtN(peakForce(p)), Math.round(recruit(p.volt) * 100) + ' % of fibres recruited · ' + FIB[p.ftype].name + ' · 22.5 N per cm² of muscle', peakForce(p) > 0.9 * fMax(p) ? 'the twitches fuse into one steady pull: tetanus' : p.freq > 2 ? 'twitches add up before each has relaxed: summation' : 'one shock, one twitch'];
      if (p.tissue === 'skin') return ['Skin, ' + p.strips + ' strips of tape: ' + tewl(p.strips, p.rh, p.airTs).toFixed(1) + ' g of water a m² an hour', layersLeft(p.strips).toFixed(1) + ' of 16 dead layers · room ' + p.airTs + ' °C, ' + p.rh + ' % humidity', 'each flat dead layer is one more barrier in the way of the water'];
      const st = p.load / p.csaT; return ['A tendon under ' + p.load + ' N: ' + (st > utsOf(p.digest) ? 'it breaks' : 'stretched ' + (strainOf(st, p.digest) * 100).toFixed(1) + ' %'), 'stress ' + st.toFixed(1) + ' MPa · breaks at ' + utsOf(p.digest) + ' MPa' + (p.digest ? ' (collagen digested)' : ''), 'the cells made the collagen; the collagen, not the cells, carries the load'];
    }
    if (p.setup === 'organs') { const E = effective(p), B = barrier(E.pHl, E.gel, E.hco3); return ['The stomach, ' + (KNOCK[p.knock].layer ? 'without ' + KNOCK[p.knock].name.replace(/ \(.*\)/, '') : 'every layer working') + ': lining at pH ' + B.pHs.toFixed(1), 'lumen pH ' + E.pHl.toFixed(1) + ' · gel ' + E.gel.toFixed(0) + ' µm · bicarbonate ' + E.hco3.toFixed(1) + ' µmol/cm²/h · ' + (S.meal.t50 < 1e9 ? 'half emptied at ' + S.meal.t50.toFixed(0) + ' min' : 'not emptying'), B.surfH > 0 ? 'acid reaches the lining: ' + B.surfH.toFixed(1) + ' mM — an ulcer starts here' : 'acid and bicarbonate meet ' + B.xf.toFixed(0) + ' µm above the lining']; }
    const R = S.bodyR, ff = firstFail(R);
    return [(p.organ === 'none' ? 'Every organ working: ' : 'Without ' + ORGANS[p.organ].name + ': ') + (ff ? DANGER.find(d => d.k === ff).failName + ' after ' + fmtDur(R.fails[ff]) : 'nothing fails in 120 days'), ACT[p.act].name + (p.pure ? ' · breathed pure oxygen first' : '') + (p.drink ? ' · drinking' : ' · not drinking') + (p.meals ? ' · eating' : ' · not eating') + ' · air ' + p.airT + ' °C', 'every organ keeps a different store topped up — the one whose store is smallest fails first'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'hierarchy') {
      const P0 = PATHS[p.path], Z = zoomAt(p.path, p.zoom), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'one of it', box: true }, { c: 'rgba(143,180,255,.8)', label: 'the field you are looking at', dash: [4, 3] }]);
      const P = g.Plot({ xmin: -0.6, xmax: P0.length - 0.4, ymin: -9.5, ymax: 1, pad: { t: Kk.t, b: 30 }, xticks: P0.map((_, i) => i), xfmt: i => (P0[Math.round(i)] || { lv: '' }).lv.replace('organ system', 'system').replace('organelle', 'org’elle'), yticks: [-9, -6, -3, 0], yfmt: v => ({ '-9': '1 nm', '-6': '1 µm', '-3': '1 mm', '0': '1 m' })[String(v)] || '', ylabel: 'size (log)' }).frame();
      P.clip(() => { P0.forEach((lv, i) => P.bar(i, Math.log10(lv.size), 0.32, -9.5, i === (Z.t > 0.6 && Z.b ? Z.i + 1 : Z.i) ? '#FFD66B' : 'rgba(255,214,107,.35)')); P.hline(Math.log10(Z.W), 'rgba(143,180,255,.8)', [4, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'special') {
      if (p.cell === 'rbc') {
        const sh = rbcShape(p.sph), d0 = rbcShape(0), s1 = rbcShape(1), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'this cell' }, { c: '#9FE0B8', label: 'normal disc', dash: [5, 3] }, { c: '#FF8A80', label: 'sphere', dash: [2, 3] }]);
        const ts = []; for (let i = 0; i <= 80; i++) ts.push(i / 80 * 1.2);
        const P = g.Plot({ xmin: 0, xmax: 1.2, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'seconds in a lung capillary', ylabel: 'oxygen loaded, %', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(ts.map(t => [t, loaded(d0, t) * 100]), '#9FE0B8', 1.5, [5, 3]); P.line(ts.map(t => [t, loaded(s1, t) * 100]), '#FF8A80', 1.5, [2, 3]); P.line(ts.map(t => [t, loaded(sh, t) * 100]), '#FFD66B', 2.5); P.vline(p.transit, 'rgba(201,212,234,.6)', [3, 3]); P.dot(p.transit, loaded(sh, p.transit) * 100, 5, '#FFD66B', '#0B0F18'); P.tag(p.transit, 12, 'transit ' + p.transit + ' s', '#C9D4EA', 'left', 0); });
        Kk.draw(P); return;
      }
      if (p.cell === 'neuron') {
        const Lm = Math.pow(10, p.llen), one = oneCell(Lm, p.diam, p.myelin), ch = chainTime(Lm, p.diam, p.myelin, p.clen), Kk = K.plotKey(g, [{ c: '#9FE0B8', label: 'one long cell' }, { c: '#FFB0A0', label: 'a chain of short cells' }]);
        const P = g.Plot({ xmin: 0, xmax: ch * 1.05 * 1000, ymin: 0, ymax: Lm * 100, pad: { t: Kk.t }, xlabel: 'ms after the start', ylabel: 'distance, cm', xfmt: v => v < 10 ? v.toFixed(1) : v.toFixed(0), yfmt: v => v < 1 ? v.toFixed(2) : v.toFixed(0) }).frame();
        P.clip(() => { P.line([[0, 0], [one * 1000, Lm * 100]], '#9FE0B8', 2.4); const n = nCells(Lm, p.clen), pts = [[0, 0]], seg = oneCell(Lm, p.diam, p.myelin) / n * 1000, step = Math.max(1, Math.floor(n / 200)); for (let k = 0; k < n; k += step) { const t0 = k * (seg + SYN * 1000); pts.push([t0 + seg * step, (k + step) / n * Lm * 100], [t0 + seg * step + SYN * 1000 * step, (k + step) / n * Lm * 100]); } P.line(pts, '#FFB0A0', 2); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: p.hden + ' hairs/mm²' }, { c: 'rgba(201,212,234,.5)', label: '50 · 200 /mm²', dash: [4, 3] }]);
      const xs = []; for (let i = 0; i <= 60; i++) xs.push(i / 60 * 1.5);
      const top = rootArea(1.5, 200).total * 1.08;
      const P = g.Plot({ xmin: 0, xmax: 1.5, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'root hair length, mm', ylabel: 'surface of 1 cm, mm²', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { [50, 200].forEach(d => P.line(xs.map(x => [x, rootArea(x, d).total]), 'rgba(201,212,234,.5)', 1.2, [4, 3])); P.line(xs.map(x => [x, rootArea(x, p.hden).total]), '#FFD66B', 2.4); P.hline(rootArea(0, 0).base, 'rgba(255,138,128,.7)', [3, 3]); P.tag(0.02, rootArea(0, 0).base, 'no hairs', '#FF8A80', 'left', -8); P.dot(p.hlen, rootArea(p.hlen, p.hden).total, 5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') {
        const F = Math.max(1e-9, fMax(p)), Kk = K.plotKey(g, [{ c: '#7CF0C0', label: 'force, this train' }, { c: 'rgba(201,212,234,.5)', label: 'one shock alone', dash: [4, 3] }, { c: 'rgba(255,214,107,.5)', label: 'shocks', box: true }]);
        const ts = []; for (let t = 0; t <= WIN; t += 0.004) ts.push(t);
        const P = g.Plot({ xmin: 0, xmax: WIN, ymin: 0, ymax: Math.max(F, 1e-9) * 1.08, pad: { t: Kk.t }, xlabel: 's', ylabel: 'force', xfmt: v => v.toFixed(1), yfmt: v => fmtN(v).replace(' ', '') }).frame();
        P.clip(() => { const one = Object.assign({}, p, { freq: 0.01 }); P.line(ts.map(t => [t, forceAt(t, one)]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); for (let t = 0; t <= TRAIN + 1e-9; t += 1 / p.freq) P.vline(t, 'rgba(255,214,107,.25)'); P.line(ts.map(t => [t, forceAt(t, p)]), 'rgba(124,240,192,.3)', 1.2); P.line((S.trace || []).map(q => [q[0], q[1]]), '#7CF0C0', 2.5); P.hline(F, 'rgba(255,138,128,.6)', [3, 3]); });
        Kk.draw(P); return;
      }
      if (p.tissue === 'skin') {
        const Kk = K.plotKey(g, [{ c: '#7CF0C0', label: 'the meter' }, { c: 'rgba(255,214,107,.7)', label: 'true flux', dash: [4, 3] }]);
        const H = S.hist, tmax = Math.max(60, S.ts * 1.05), top = Math.max(10, tewl(40, p.rh, p.airTs)) * 1.1;
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 's with the probe on', ylabel: 'g/m²/h', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.hline(tewl(p.strips, p.rh, p.airTs), 'rgba(255,214,107,.7)', [4, 3]); P.line(H.map(q => [q[0], q[1]]), '#7CF0C0', 2.4); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: p.digest ? 'digested tendon' : 'tendon' }, { c: 'rgba(201,212,234,.5)', label: p.digest ? 'healthy' : 'collagen digested', dash: [4, 3] }]);
      const curve = dig => { const pts = []; for (let s = 0; s <= utsOf(dig); s += utsOf(dig) / 60) pts.push([strainOf(s, dig) * 100, s]); return pts; };
      const st = p.load / p.csaT, br = st > utsOf(p.digest);
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 'stretch, %', ylabel: 'stress, MPa', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(curve(!p.digest), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(curve(p.digest), '#FFD66B', 2.5); P.vline(TEND.toe * 100, 'rgba(143,180,255,.4)', [2, 3]); P.tag(TEND.toe * 100, 100, 'toe: crimp straightens', '#8FB4FF', 'left', 0); if (!br) P.dot(strainOf(st, p.digest) * 100, st, 5, '#FFD66B', '#0B0F18'); else P.tag(8, utsOf(p.digest), 'broken', '#FF8A80', 'left', -8); });
      Kk.draw(P); return;
    }
    if (p.setup === 'organs') {
      const M = S.meal, N0 = S.mealNormal, Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'this stomach' }, { c: 'rgba(201,212,234,.5)', label: 'healthy, same meal', dash: [4, 3] }, { c: 'rgba(255,138,128,.6)', label: '4 h: >10 % left = gastroparesis', dash: [2, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: GUT.hours * 60, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'minutes after the meal', ylabel: 'meal left, %', xticks: [0, 60, 120, 180, 240, 300], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(N0.curve.map(q => [q[0], 100 - q[1] * 100]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(M.curve.map(q => [q[0], 100 - q[1] * 100]), 'rgba(255,214,107,.35)', 1.4); P.line(M.curve.filter(q => q[0] <= S.ts / 60 + 1e-9).map(q => [q[0], 100 - q[1] * 100]), '#FFD66B', 2.6); P.vline(240, 'rgba(255,138,128,.6)', [2, 3]); P.hline(10, 'rgba(255,138,128,.4)', [2, 3]); P.dot(S.ts / 60, 100 - M.at(S.ts / 60) * 100, 5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    const R = S.bodyR, Kk = K.plotKey(g, DANGER.filter(d => R.fails[d.k] != null || d.k === 'sat').slice(0, 4).map((d, i) => ({ c: DCOL[d.k], label: d.name.replace(/ \(.*\)/, '') })));
    const P = g.Plot({ xmin: 0, xmax: Math.log10(T_END), ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 'time (log)', ylabel: '% of the way to failure', xticks: [0, 1, 2, 3, 4, 5, 6, 7], xfmt: v => ['1 s', '10 s', '100 s', '17 min', '2.8 h', '28 h', '12 d', '116 d'][Math.round(v)] || '', yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.hline(100, 'rgba(255,138,128,.7)', [3, 3]); DANGER.forEach(d => { const pts = R.out.filter((_, i) => i % 3 === 0).map(r => [Math.log10(Math.max(1, r.t)), clamp(((d.k === 'sat' ? r.sat : r[d.k]) - d.normal) / (d.fail - d.normal) * 100, 0, 110)]); if (pts.some(q => q[1] > 1)) P.line(pts, DCOL[d.k], 2); }); P.vline(S.lt, 'rgba(255,214,107,.7)', [2, 3]); });
    Kk.draw(P);
  }
  const DCOL = { brain: '#FF6A9A', sat: '#FF8A80', glu: '#FFD66B', temp: '#FFB35C', water: '#8FD4FA', K: '#C89BFF', urea: '#9FE0B8', fat: '#E8C890' };
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'hierarchy') {
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'cells in the body', dot: true }, { c: '#FF8A80', label: 'red cell diameter (right scale ×10¹² )', dot: true }]);
      const P = g.Plot({ xmin: -2, xmax: 4, ymin: 9, ymax: 18, pad: { t: Kk.t }, xlabel: 'body mass (log)', ylabel: 'cells (log)', xticks: [-2, -1, 0, 1, 2, 3, 4], xfmt: v => ['10 g', '100 g', '1 kg', '10 kg', '100 kg', '1 t', '10 t'][v + 2], yticks: [9, 12, 15, 18], yfmt: v => '10^' + v }).frame();
      P.clip(() => { P.line([[-2, Math.log10(cellsIn(0.01))], [4, Math.log10(cellsIn(10000))]], 'rgba(255,214,107,.5)', 1.2, [4, 3]); Object.keys(ANIMALS).forEach(k => { const a = ANIMALS[k], x = Math.log10(a.kg), on = k === p.animal; P.dot(x, Math.log10(cellsIn(a.kg)), on ? 6 : 4, '#FFD66B', on ? '#0B0F18' : null); P.dot(x, 9 + a.rbc, on ? 6 : 4, '#FF8A80', on ? '#0B0F18' : null); P.tag(x, 9 + a.rbc, a.rbc.toFixed(1) + ' µm', '#FF8A80', 'left', -9); }); });
      Kk.draw(P); return;
    }
    if (p.setup === 'special') {
      if (p.cell === 'rbc') {
        const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'narrowest tube it can pass' }, { c: '#8FB4FF', label: 'this capillary', dash: [4, 3] }]);
        const xs = []; for (let i = 0; i <= 50; i++) xs.push(i / 50);
        const P = g.Plot({ xmin: 95, xmax: 140, ymin: 2, ymax: 7, pad: { t: Kk.t }, xlabel: 'membrane area, µm² (volume fixed)', ylabel: 'tube width, µm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(xs.map(s => { const q = rbcShape(s); return [q.A, q.tube]; }), '#FFD66B', 2.4); P.hline(p.dcap, '#8FB4FF', [4, 3]); const q = rbcShape(p.sph); P.dot(q.A, q.tube, 5.5, '#FFD66B', '#0B0F18'); P.tag(rbcShape(0).A, rbcShape(0).tube, 'normal: 3.0 µm', '#9FE0B8', 'right', -10); P.tag(rbcShape(1).A, rbcShape(1).tube, 'sphere: 5.6', '#FF8A80', 'left', -10); });
        Kk.draw(P); return;
      }
      if (p.cell === 'neuron') {
        const Kk = K.plotKey(g, [{ c: '#9FE0B8', label: 'one cell' }, { c: '#FFB0A0', label: 'chain of ' + p.clen + ' µm cells' }]);
        const xs = []; for (let i = 0; i <= 60; i++) xs.push(-3 + i / 60 * 3.3);
        const P = g.Plot({ xmin: -3, xmax: 0.3, ymin: -6, ymax: 2, pad: { t: Kk.t }, xlabel: 'length (log)', ylabel: 'time (log)', xticks: [-3, -2, -1, 0], xfmt: v => ['1 mm', '1 cm', '10 cm', '1 m'][v + 3], yticks: [-6, -3, 0], yfmt: v => ({ '-6': '1 µs', '-3': '1 ms', '0': '1 s' })[String(v)] }).frame();
        P.clip(() => { P.line(xs.map(x => [x, Math.log10(oneCell(Math.pow(10, x), p.diam, p.myelin))]), '#9FE0B8', 2.2); P.line(xs.map(x => [x, Math.log10(chainTime(Math.pow(10, x), p.diam, p.myelin, p.clen))]), '#FFB0A0', 2.2); P.dot(p.llen, Math.log10(oneCell(Math.pow(10, p.llen), p.diam, p.myelin)), 5, '#9FE0B8', '#0B0F18'); P.dot(p.llen, Math.log10(chainTime(Math.pow(10, p.llen), p.diam, p.myelin, p.clen)), 5, '#FFB0A0', '#0B0F18'); P.hline(Math.log10(0.1), 'rgba(255,214,107,.4)', [3, 3]); P.tag(-2.95, -1, 'a blink: 0.1 s', '#FFD66B', 'left', -8); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ c: '#8FD4FA', label: 'water in, µL an hour' }]);
      const P = g.Plot({ xmin: 0, xmax: rootArea(1.5, 200).total * 1.05, ymin: 0, ymax: uptake(1.5, 200) * 1.1, pad: { t: Kk.t }, xlabel: 'surface, mm²', ylabel: 'µL/h', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line([[0, 0], [rootArea(1.5, 200).total * 1.05, rootArea(1.5, 200).total * 1.05 * ROOT.Lp]], 'rgba(143,212,250,.6)', 1.4, [4, 3]); [['no hairs (rhd6 mutant)', 0, 0], ['typical', 0.7, 100]].forEach(([n, l, d]) => { P.dot(rootArea(l, d).total, uptake(l, d), 4, '#C9D4EA'); P.tag(rootArea(l, d).total, uptake(l, d), n, '#C9D4EA', 'left', -9); }); P.dot(rootArea(p.hlen, p.hden).total, uptake(p.hlen, p.hden), 6, '#8FD4FA', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') {
        const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'fast fibres' }, { c: '#FFB0A0', label: 'slow fibres' }]);
        const fs = []; for (let i = 0; i <= 40; i++) fs.push(Math.pow(10, -0.3 + i / 40 * 2.3));
        const rel = (ft, f) => peakForce(Object.assign({}, p, { ftype: ft, freq: f })) / Math.max(1e-12, fMax(p)) * 100;
        const P = g.Plot({ xmin: -0.3, xmax: 2, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'shocks a second (log)', ylabel: 'peak, % of tetanus', xticks: [0, 1, 2], xfmt: v => ['1', '10', '100'][v], yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { if (!S._fcurve || S._fcurve.key !== p.volt + '|' + p.lcsa) S._fcurve = { key: p.volt + '|' + p.lcsa, fast: fs.map(f => [Math.log10(f), rel('fast', f)]), slow: fs.map(f => [Math.log10(f), rel('slow', f)]) }; P.line(S._fcurve.fast, '#FFD66B', 2.2); P.line(S._fcurve.slow, '#FFB0A0', 2.2); P.dot(Math.log10(p.freq), rel(p.ftype, p.freq), 5.5, p.ftype === 'fast' ? '#FFD66B' : '#FFB0A0', '#0B0F18'); });
        Kk.draw(P); return;
      }
      if (p.tissue === 'skin') {
        const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'water lost' }, { c: 'rgba(143,212,250,.6)', label: 'dead layers left', dash: [4, 3] }]);
        const ns = []; for (let n = 0; n <= 40; n++) ns.push(n);
        const top = tewl(40, p.rh, p.airTs) * 1.1;
        const P = g.Plot({ xmin: 0, xmax: 40, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'tape strips', ylabel: 'g/m²/h', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(ns.map(n => [n, layersLeft(n) / 16 * top]), 'rgba(143,212,250,.6)', 1.3, [4, 3]); P.line(ns.map(n => [n, tewl(n, p.rh, p.airTs)]), '#FFD66B', 2.4); P.dot(p.strips, tewl(p.strips, p.rh, p.airTs), 5.5, '#FFD66B', '#0B0F18'); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'breaking force' }, { c: '#8FB4FF', label: 'your load', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: 0, ymax: 11000, pad: { t: Kk.t }, xlabel: 'tendon cross-section, mm²', ylabel: 'force, N', xfmt: v => v.toFixed(0), yfmt: v => (v / 1000).toFixed(0) + 'k' }).frame();
      P.clip(() => { P.line([[0, 0], [100, utsOf(p.digest) * 100]], '#FFD66B', 2.4); if (p.digest) P.line([[0, 0], [100, utsOf(false) * 100]], 'rgba(201,212,234,.5)', 1.2, [4, 3]); P.dot(p.csaT, p.load, 6, '#8FB4FF', '#0B0F18'); P.tag(65, 6500, 'Achilles ≈ 65 mm²', '#C9D4EA', 'left', -10); });
      Kk.draw(P); return;
    }
    if (p.setup === 'organs') {
      const E = effective(p), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'the lining, this stomach' }, { c: '#9FE0B8', label: 'healthy barrier', dash: [5, 3] }, { c: '#FF8A80', label: 'no gel', dash: [2, 3] }]);
      const xs = []; for (let i = 0; i <= 60; i++) xs.push(1 + i / 60 * 6);
      const P = g.Plot({ xmin: 1, xmax: 7, ymin: 1, ymax: 8, pad: { t: Kk.t }, xlabel: 'lumen pH', ylabel: 'pH at the lining', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(xs.map(x => [x, barrier(x, 150, 3).pHs]), '#9FE0B8', 1.3, [5, 3]); P.line(xs.map(x => [x, barrier(x, 0, 3).pHs]), '#FF8A80', 1.3, [2, 3]); P.line(xs.map(x => [x, barrier(x, E.gel, E.hco3).pHs]), '#FFD66B', 2.4); P.dot(E.pHl, barrier(E.pHl, E.gel, E.hco3).pHs, 5.5, '#FFD66B', '#0B0F18'); P.hline(4, 'rgba(255,138,128,.4)', [2, 3]); P.tag(1.05, 3.8, 'below 4: the lining is digested', '#FF8A80', 'left', 0); });
      Kk.draw(P); return;
    }
    const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'first failure, each organ out', box: true }]);
    const names = ['heart', 'lungs', 'liver', 'skin', 'gut', 'kidneys'];
    if (!S._land || S._land.key !== landKey(p)) S._land = { key: landKey(p), v: names.map(k => { const R = bodyRun(Object.assign({}, p, { organ: k })), f = firstFail(R); return f ? R.fails[f] : T_END; }) };
    const P = g.Plot({ xmin: -0.6, xmax: names.length - 0.4, ymin: 0, ymax: Math.log10(T_END), pad: { t: Kk.t }, xticks: names.map((_, i) => i), xfmt: i => names[Math.round(i)] || '', yticks: [0, 1, 2, 3, 4, 5, 6, 7], yfmt: v => ['1 s', '10 s', '100 s', '17 m', '2.8 h', '28 h', '12 d', '116 d'][v], ylabel: 'time (log)' }).frame();
    P.clip(() => { S._land.v.forEach((v, i) => P.bar(i, Math.log10(Math.max(1, v)), 0.3, 0, names[i] === p.organ ? '#FF8A80' : 'rgba(255,138,128,.35)')); });
    Kk.draw(P);
  }
  const landKey = p => [p.act, p.pure, p.drink, p.meals, p.airT, p.mass, p.fatPct].join('|');

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'hierarchy') {
      const Z = zoomAt(p.path, p.zoom), lv = Z.t > 0.6 && Z.b ? Z.b : Z.a, P = PATHS[p.path], i = P.indexOf(lv);
      const out = [
        { label: 'Level', value: lv.lv, flag: 'accent', hint: (i + 1) + ' of ' + P.length + ' on this path' },
        { label: 'Field of view', value: lenT(Z.W), hint: '10^' + p.zoom.toFixed(2) + ' m across' },
        { label: 'One ' + lv.unit, value: lenT(lv.size), hint: 'its size' },
        { label: 'Seen with', value: lv.inst.split(' (')[0], hint: lv.inst.includes('(') ? lv.inst.replace(/.*\(/, '(') : '' },
        { label: 'How many in the level above', value: i ? sci(lv.inUp) : '—', hint: i ? lv.up : 'the whole organism' }
      ];
      if (p.path === 'human') { const a = ANIMALS[p.animal]; out.push({ label: 'Cells in ' + a.name, value: sci(cellsIn(a.kg)), unit: '', hint: '3.72×10¹³ × mass ÷ 70 kg' }, { label: 'Its red cells', value: a.rbc.toFixed(1), unit: 'µm', hint: 'a human’s 7.8 µm' }, { label: 'Red cells in a human', value: '71', unit: '%', hint: '2.63×10¹³ of every cell' }); }
      else out.push({ label: 'Chloroplasts in one leaf', value: sci(2.4e7 * 40), hint: 'palisade cells × 40' });
      return out;
    }
    if (p.setup === 'special') {
      if (p.cell === 'rbc') { const sh = rbcShape(p.sph); return [
        { label: 'Membrane area A', value: sh.A.toFixed(1), unit: 'µm²', hint: 'Evans–Fung disc: 134' },
        { label: 'Volume V', value: sh.V.toFixed(1), unit: 'fL', hint: 'held fixed: same haemoglobin' },
        { label: 'Diameter', value: sh.D.toFixed(2), unit: 'µm', hint: 'thickest ' + sh.thick.toFixed(2) + ' µm' },
        { label: 'Narrowest tube (A, V fixed)', value: sh.tube.toFixed(2), unit: 'µm', flag: sh.tube <= p.dcap ? 'ok' : 'crit', hint: sh.tube <= p.dcap ? 'passes ' + p.dcap + ' µm' : 'stuck in ' + p.dcap + ' µm' },
        { label: 'O₂ loaded in ' + p.transit + ' s', value: Math.round(loaded(sh, p.transit) * 100), unit: '%', flag: loaded(sh, p.transit) > 0.95 ? 'ok' : 'warn', hint: 'the time in a lung capillary' },
        { label: '95 % loaded after', value: (sh.t95 * 1000).toFixed(0), unit: 'ms', flag: 'accent', hint: 'disc 144 ms · sphere 593 ms' },
        { label: 'Area ÷ volume', value: (sh.A / sh.V).toFixed(2), unit: 'per µm', hint: 'sphere of 94 fL: 1.06' }]; }
      if (p.cell === 'neuron') { const Lm = Math.pow(10, p.llen), one = oneCell(Lm, p.diam, p.myelin), ch = chainTime(Lm, p.diam, p.myelin, p.clen); return [
        { label: 'Distance', value: lenT(Lm), hint: 'spinal cord to toe ≈ 1 m' },
        { label: 'Speed v (Hursh)', value: speedOf(p.diam, p.myelin).toFixed(1), unit: 'm/s', hint: p.myelin ? '6 × diameter in µm' : '√diameter in µm' },
        { label: 'One cell: L ÷ v', value: fmtMs(one), flag: 'accent', hint: 'one membrane all the way' },
        { label: 'Cells in a chain', value: sci(nCells(Lm, p.clen)), hint: p.clen + ' µm each' },
        { label: 'Chain: L ÷ v + gaps × 0.5 ms', value: fmtMs(ch), flag: ch > 0.1 ? 'crit' : 'warn', hint: Math.round(ch / one) + ' times as long' }]; }
      const A = rootArea(p.hlen, p.hden); return [
        { label: 'Hairs on 1 cm', value: Math.round(A.n).toLocaleString('en-US'), hint: p.hden + ' per mm² of root' },
        { label: 'Surface without hairs 2πrL', value: A.base.toFixed(1), unit: 'mm²', hint: 'r = 0.25 mm, L = 10 mm' },
        { label: 'Hairs add', value: A.hairs.toFixed(1), unit: 'mm²', hint: 'each 2π × 6 µm × length' },
        { label: 'Surface multiplied', value: (A.total / A.base).toFixed(2), unit: '×', flag: 'accent' },
        { label: 'Water in', value: uptake(p.hlen, p.hden).toFixed(3), unit: 'µL/h', hint: '∝ surface in moist soil' }];
    }
    if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') return [
        { label: 'Stimulus', value: p.freq + ' Hz · ' + p.volt.toFixed(1) + ' V', hint: 'a 1 s train' },
        { label: 'Fibres recruited', value: Math.round(recruit(p.volt) * 100), unit: '%', hint: 'thresholds spread 2–6 V' },
        { label: 'Fmax = 22.5 N/cm² × A × recruited', value: fmtN(fMax(p)), hint: Math.pow(10, p.lcsa).toPrecision(2) + ' cm²' },
        { label: 'Peak force', value: fmtN(peakForce(p)), flag: 'accent', hint: Math.round(peakForce(p) / Math.max(1e-12, fMax(p)) * 100) + ' % of tetanus' },
        { label: 'Twitch time', value: (FIB[p.ftype].tc * 1000).toFixed(0), unit: 'ms', hint: '90 % fused above ' + fuse90(p.ftype) + ' Hz' },
        { label: 'Now', value: fmtN(forceAt(S.tw || 0, p)), hint: (S.tw || 0).toFixed(2) + ' s into the train' }];
      if (p.tissue === 'skin') return [
        { label: 'Strips', value: String(p.strips), hint: '6 % of what is left each' },
        { label: 'Dead layers left', value: layersLeft(p.strips).toFixed(1), unit: 'of 16' },
        { label: 'Δc = c_sat(32 °C) − RH·c_sat(air)', value: (csat(32) - p.rh / 100 * csat(p.airTs)).toFixed(1), unit: 'g/m³' },
        { label: 'TEWL = Δc ÷ (n·r + r_air)', value: tewl(p.strips, p.rh, p.airTs).toFixed(1), unit: 'g/m²/h', flag: tewl(p.strips, p.rh, p.airTs) > 25 ? 'crit' : 'accent' },
        { label: 'The meter reads', value: S.reading.toFixed(1), unit: 'g/m²/h', hint: 'settling: 6 s time constant' }];
      const st = p.load / p.csaT, br = st > utsOf(p.digest); return [
        { label: 'Stress σ = F ÷ A', value: st.toFixed(1), unit: 'MPa', flag: br ? 'crit' : 'accent' },
        { label: 'Stretch', value: br ? 'broken' : (strainOf(st, p.digest) * 100).toFixed(2), unit: br ? '' : '%', hint: 'toe region to 3 %' },
        { label: 'Breaking force', value: (utsOf(p.digest) * p.csaT).toFixed(0), unit: 'N', hint: utsOf(p.digest) + ' MPa × ' + p.csaT + ' mm²' },
        { label: 'Times body weight (70 kg)', value: (utsOf(p.digest) * p.csaT / 687).toFixed(1), unit: '×' }];
    }
    if (p.setup === 'organs') { const E = effective(p), B = barrier(E.pHl, E.gel, E.hco3), M = S.meal; return [
      { label: 'pH at the lining', value: B.pHs.toFixed(2), flag: B.pHs < 4 ? 'crit' : 'ok', hint: B.surfH > 0 ? 'acid reaches it' : 'bicarbonate holds' },
      { label: 'Neutral front above the lining', value: B.xf.toFixed(0), unit: 'µm', hint: 'of ' + E.gel.toFixed(0) + ' µm of gel' },
      { label: 'Bicarbonate needed', value: B.need.toFixed(2), unit: 'µmol/cm²/h', hint: 'secreting ' + E.hco3.toFixed(1) },
      { label: 'Pepsin activity', value: Math.round(pepsin(E.pHl) * 100), unit: '%', hint: 'of its best, at pH ' + E.pHl.toFixed(1) },
      { label: 'Meal emptied', value: Math.round(M.at(S.ts / 60) * 100), unit: '%', hint: (S.ts / 60).toFixed(0) + ' min' },
      { label: 'Half emptied at', value: isFinite(M.t50) ? M.t50.toFixed(0) : 'never', unit: isFinite(M.t50) ? 'min' : '', flag: 'accent', hint: 'healthy, same meal: ' + (isFinite(S.mealNormal.t50) ? S.mealNormal.t50.toFixed(0) + ' min' : '—') },
      { label: 'Left at 4 h', value: Math.round(M.left4h * 100), unit: '%', flag: M.left4h > 0.1 ? 'crit' : 'ok', hint: '> 10 %: gastroparesis' }]; }
    const R = S.bodyR, ff = firstFail(R), row = rowAt(R, Math.pow(10, S.lt));
    return [
      { label: 'Knocked out', value: ORGANS[p.organ].name.replace(/^the /, ''), flag: 'accent' },
      { label: 'First to fail', value: ff ? DANGER.find(d => d.k === ff).failName : 'nothing', flag: ff ? 'crit' : 'ok', hint: ff ? 'after ' + fmtDur(R.fails[ff]) : 'in 120 days' },
      { label: 'Oxygen store at the start', value: (R.T0 * 1000).toFixed(0), unit: 'mL', hint: p.pure ? 'lungs full of pure O₂' : 'lungs of air + blood' },
      { label: 'SpO₂ now', value: row.sat.toFixed(0), unit: '%' },
      { label: 'Glucose now', value: row.glu.toFixed(2), unit: 'mM' },
      { label: 'Core temperature', value: row.temp.toFixed(1), unit: '°C' },
      { label: 'Water lost', value: row.water.toFixed(2), unit: 'L' },
      { label: 'Urea · K⁺', value: row.urea.toFixed(0) + ' · ' + row.K.toFixed(1), unit: 'mM' },
      { label: 'Fat would last, with no food', value: (12 * p.mass / 70 * p.fatPct / 17 * 32 / (7.5 * p.mass / 70 * (0.6 + 0.4 * ACT[p.act].met))).toFixed(0), unit: 'days', hint: (12 * p.mass / 70 * p.fatPct / 17).toFixed(1) + ' kg of fat × 32 MJ/kg' }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'hierarchy') { const a = ANIMALS[p.animal]; return E.v('N') + E.sub('cells') + ' ' + E.op('=') + ' 3.72×10¹³ × ' + E.frac(E.n(a.kg, 'kg'), E.n(70, 'kg')) + ' ' + E.op('=') + ' ' + E.n(sci(cellsIn(a.kg)), '') + '   ·   field ' + E.op('=') + ' 10<sup>' + p.zoom.toFixed(2) + '</sup> m ' + E.op('=') + ' ' + E.n(lenT(Math.pow(10, p.zoom)), ''); }
    if (p.setup === 'special') {
      if (p.cell === 'rbc') { const sh = rbcShape(p.sph); return E.v('V') + ' ' + E.op('=') + ' ' + E.frac(E.v('r') + E.v('A'), '2') + ' − ' + E.frac('2π' + E.v('r') + '³', '3') + ' → ' + E.v('d') + E.sub('min') + ' ' + E.op('=') + ' 2' + E.v('r') + ' ' + E.op('=') + ' ' + E.n(sh.tube.toFixed(2), 'µm') + '   ·   loaded ' + E.op('=') + ' 1 − Σ' + E.frac('8', '(2n+1)²π²') + E.v('e') + '<sup>−(2n+1)²π²Dt/4z²</sup> ' + E.op('=') + ' ' + E.n(Math.round(loaded(sh, p.transit) * 100), '%'); }
      if (p.cell === 'neuron') { const Lm = Math.pow(10, p.llen); return E.v('t') + ' ' + E.op('=') + ' ' + E.frac(E.v('L'), E.v('v')) + ' + (' + E.v('n') + ' − 1) × 0.5 ms ' + E.op('=') + ' ' + E.frac(E.n(lenT(Lm), ''), E.n(speedOf(p.diam, p.myelin).toFixed(1), 'm/s')) + ' + ' + E.n(sci(nCells(Lm, p.clen) - 1), '') + ' × 0.5 ms ' + E.op('=') + ' ' + E.n(fmtMs(chainTime(Lm, p.diam, p.myelin, p.clen)), ''); }
      const A = rootArea(p.hlen, p.hden); return E.v('A') + ' ' + E.op('=') + ' 2π' + E.v('rL') + ' + ' + E.v('n') + ' × 2π' + E.v('r') + E.sub('h') + E.v('ℓ') + ' ' + E.op('=') + ' ' + E.n(A.base.toFixed(1), '') + ' + ' + E.n(Math.round(A.n), '') + ' × 2π × 0.006 × ' + E.n(p.hlen.toFixed(2), '') + ' ' + E.op('=') + ' ' + E.n(A.total.toFixed(1), 'mm²');
    }
    if (p.setup === 'tissues') {
      if (p.tissue === 'muscle') return E.v('F') + ' ' + E.op('=') + ' 22.5 N/cm² × ' + E.v('A') + ' × ' + E.v('f') + E.sub('rec') + ' × (1 − ' + E.v('e') + '<sup>−a/3.48</sup>),   ' + E.v('a') + ' ' + E.op('=') + ' Σ twitches ' + E.op('→') + ' peak ' + E.n(fmtN(peakForce(p)), '');
      if (p.tissue === 'skin') return E.v('J') + ' ' + E.op('=') + ' ' + E.frac('Δ' + E.v('c'), E.v('n') + E.v('r') + ' + ' + E.v('r') + E.sub('air')) + ' ' + E.op('=') + ' ' + E.frac(E.n((csat(32) - p.rh / 100 * csat(p.airTs)).toFixed(1), 'g/m³'), E.n(layersLeft(p.strips).toFixed(1), '') + ' × 683 + 780 s/m') + ' ' + E.op('=') + ' ' + E.n(tewl(p.strips, p.rh, p.airTs).toFixed(1), 'g/m²/h');
      return E.v('σ') + ' ' + E.op('=') + ' ' + E.frac(E.v('F'), E.v('A')) + ' ' + E.op('=') + ' ' + E.frac(E.n(p.load, 'N'), E.n(p.csaT, 'mm²')) + ' ' + E.op('=') + ' ' + E.n((p.load / p.csaT).toFixed(1), 'MPa') + ' ' + (p.load / p.csaT > utsOf(p.digest) ? E.op('>') + ' ' + utsOf(p.digest) + ' MPa → it breaks' : E.op('<') + ' ' + utsOf(p.digest) + ' MPa → it holds');
    }
    if (p.setup === 'organs') { const Ef = effective(p), B = barrier(Ef.pHl, Ef.gel, Ef.hco3); return E.v('J') + E.sub('needed') + ' ' + E.op('=') + ' ' + E.frac(E.v('D') + '(' + E.v('c') + E.sub('acid') + ' + ' + E.v('c') + E.sub('HCO₃')+ ')', E.v('L')) + ' ' + E.op('=') + ' ' + E.frac('2×10⁻¹¹ × (' + B.cL.toFixed(1) + ' + 20) mM', E.n(Ef.gel.toFixed(0), 'µm')) + ' ' + E.op('=') + ' ' + E.n(B.need.toFixed(2), 'µmol/cm²/h') + ' ' + (B.need <= Ef.hco3 ? E.op('≤') + ' ' + Ef.hco3.toFixed(1) + ' → the lining stays neutral' : E.op('>') + ' ' + Ef.hco3.toFixed(1) + ' → acid reaches the lining'); }
    const R = S.bodyR, ff = firstFail(R);
    if (p.organ === 'lungs') return E.v('t') + ' ' + E.op('=') + ' ' + E.frac('O₂ store − O₂ at blackout', 'O₂ used a minute') + ' ' + E.op('=') + ' ' + E.frac(E.n((R.T0 * 1000).toFixed(0), 'mL') + ' − ~590 mL', E.n((250 * p.mass / 70 * ACT[p.act].met).toFixed(0), 'mL/min')) + ' ' + E.op('=') + ' ' + E.n(fmtDur(R.fails.sat || Infinity), '');
    return 'first to fail ' + E.op('=') + ' the store that runs out soonest: ' + E.v('t') + ' ' + E.op('=') + ' ' + E.frac('store', 'rate of loss') + ' ' + E.op('→') + ' ' + (ff ? DANGER.find(d => d.k === ff).failName + ' at ' + fmtDur(R.fails[ff]) : 'none in 120 days');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'hierarchy') return 'The count assumes every mammal is built from cells of about the same size, so the number scales with mass. The census of a 70 kg adult (Bianconi et al. 2013) is 3.72 × 10¹³ cells — 71 % of them red blood cells. An elephant’s cells are not bigger than a mouse’s: there are about 200 000 times as many.';
    if (p.setup === 'special') return p.cell === 'rbc' ? 'Oxygen gets into a red cell through its faces; each part of the cell fills in a time set by the square of its thickness. D here is the lab’s one assumed constant — the effective speed of the oxygen front while haemoglobin is soaking it up. What does not depend on D: the disc fills about 4 times faster than a sphere of the same volume, and only a cell with spare membrane can fold into a 3 µm tube.' : p.cell === 'neuron' ? 'A signal is fast inside one cell and slow at every gap between cells (a synapse costs about 0.5 ms). That is why the cells that carry signals far are a metre long rather than a chain of ordinary cells.' : 'Water enters a root through its surface. Root hairs are single cells grown sideways: they cost the plant very little volume and multiply the surface several times.';
    if (p.setup === 'tissues') return p.tissue === 'muscle' ? 'One fibre makes about half a millinewton; a muscle’s force is the fibres pulling side by side, so it grows with the cross-section (22.5 N per cm²). The nervous system grades force two ways: more fibres (recruitment) and faster shocks (summation, up to fused tetanus).' : p.tissue === 'skin' ? 'The outer 16 or so layers are dead, flattened cells packed with keratin and lipid. Each is a resistance in series, so removing layers one by one with tape lets water escape faster and faster — a tissue protects as a sheet, not as single cells.' : 'A tendon is mostly collagen made by a few cells. The wavy crimp straightens first (the soft “toe”), then the fibres themselves stretch until they tear at about 100 MPa — a 65 mm² Achilles tendon holds about 9 times body weight.';
    if (p.setup === 'organs') return 'Each layer has its own job: the glands make acid and pepsin, the gel and bicarbonate keep the acid off the lining, the blood brings the bicarbonate, the muscle grinds and pushes. D, the effective diffusion of acid in the gel, is the one calibrated constant; how the barrier fails — thinner gel, less bicarbonate, lower pH — is what the model shows.';
    return 'The body is a set of stores kept topped up by organs: oxygen by the lungs (a few minutes’ worth), glucose by the liver (an hour or so between meals), water by the gut (days), and the kidneys clear what builds up (a week). Every store needs the heart to move it — which is why its loss is felt in seconds.';
  };

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function onDrag(S, e) {
    if (e.id === 'dcap' && S._kcap) { S.p.dcap = Math.round(clamp(S.p.dcap - 2 * e.dy / S._kcap, 2, 8) * 10) / 10; return; }   // the wall moves half the width change
    if (e.id === 'load') { S.p.load = Math.round(clamp(S.p.load - e.dy * 10000 / 300, 0, 10000) / 50) * 50; return; }       // 300 px spans the whole range (§2.13)
    if (e.id !== 'zoom') return;
    // drag up to zoom in: a third of the stage height spans the whole 10 decades (InsightVis §2.13 gain)
    const p = S.p, span = ZMAX[p.path] - ZMIN[p.path];
    p.zoom = clamp(p.zoom + e.dy * span / 300, ZMIN[p.path], ZMAX[p.path]);
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6b-levels',
    grade: 6, unit: '6B', topics: ['B3'],
    subject: 'biology',
    name: 'Levels of Organization',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-3', 'NGSS MS-LS1-1', 'CAST'],
    weight: 'Bodies',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag the yellow handles: ± zooms, ↕ sets the capillary or the load · drag a bench to turn it · on a phone, tap a chip to open its card',
    lede: 'Zoom from a whole body to a single <b>molecule</b> and count each level: 3.72 × 10¹³ cells make you, and an elephant’s are no bigger. See why a red cell is a <b>disc</b> and a nerve cell a metre long — the same genes, different ones switched on. ' +
      'Make <b>tissues</b> work: shock a muscle until its twitches fuse, peel skin away layer by layer, pull a tendon until it tears. Open the <b>stomach</b> wall and knock each layer out. Then switch off one <b>organ</b> and time what fails first.',

    params: preset({}),
    presets: [
      { name: 'A human, from body to molecule', params: preset({ path: 'human', zoom: Math.log10(2.2) }) },
      { name: 'Into the heart muscle', params: preset({ path: 'human', zoom: Math.log10(7e-4) }) },
      { name: 'A bean plant, to its chlorophyll', params: preset({ path: 'plant', zoom: Math.log10(0.75) }) },
      { name: 'An elephant: bigger cells?', params: preset({ path: 'human', animal: 'elephant', zoom: Math.log10(1.4e-4) }) },
      { name: 'A normal red cell in a 3 µm capillary', params: preset({ setup: 'special', cell: 'rbc', sph: 0, dcap: 3.2 }) },
      { name: 'Spherocytes: stuck, and slow to load', params: preset({ setup: 'special', cell: 'rbc', sph: 1, dcap: 4, transit: 0.25 }) },
      { name: 'A metre of nerve: one cell or a chain?', params: preset({ setup: 'special', cell: 'neuron', llen: 0, diam: 10, myelin: true }) },
      { name: 'A root with no hairs (rhd6 mutant)', params: preset({ setup: 'special', cell: 'root', hden: 0 }) },
      { name: 'Muscle: one twitch', params: preset({ setup: 'tissues', tissue: 'muscle', freq: 1, volt: 8 }) },
      { name: 'Slow fibres at 50 Hz: fused tetanus', params: preset({ setup: 'tissues', tissue: 'muscle', freq: 50, volt: 8, ftype: 'slow' }) },
      { name: 'Muscle: a weak shock recruits few fibres', params: preset({ setup: 'tissues', tissue: 'muscle', freq: 50, volt: 3.5 }) },
      { name: 'Skin: 20 strips of tape', params: preset({ setup: 'tissues', tissue: 'skin', strips: 20 }) },
      { name: 'An Achilles tendon at 5 kN', params: preset({ setup: 'tissues', tissue: 'tendon', load: 5000, csaT: 65 }) },
      { name: 'The stomach, every layer working', params: preset({ setup: 'organs', knock: 'none', pHl: 2 }) },
      { name: 'Aspirin: the gel thins, acid reaches the lining', params: preset({ setup: 'organs', knock: 'mucus', pHl: 1.6 }) },
      { name: 'The muscle layer out: gastroparesis', params: preset({ setup: 'organs', knock: 'muscle' }) },
      { name: 'Swallowed whole: 15 mm bites', params: preset({ setup: 'organs', bite: 15 }) },
      { name: 'Stop breathing, at rest', params: preset({ setup: 'systems', organ: 'lungs', act: 'rest' }) },
      { name: 'Breathe pure oxygen first, then stop', params: preset({ setup: 'systems', organ: 'lungs', pure: true }) },
      { name: 'The heart stops', params: preset({ setup: 'systems', organ: 'heart' }) },
      { name: 'No kidneys, still drinking', params: preset({ setup: 'systems', organ: 'kidneys' }) },
      { name: 'Running with no sweat glands', params: preset({ setup: 'systems', organ: 'skin', act: 'run', airT: 25 }) }
    ],

    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS }] },
      { group: 'The zoom', when: is('hierarchy'), items: [
        { key: 'path', type: 'select', label: 'Follow', restructure: R_, rebuild: true, options: [{ value: 'human', label: 'a human, into the heart' }, { value: 'plant', label: 'a bean plant, into a leaf' }] },
        { key: 'zoom', label: 'Field of view (log)', min: -8.5, max: 0.35, step: 0.01, fmt: v => lenT(Math.pow(10, v)) },
        { key: 'animal', type: 'select', label: 'The animal counted', restructure: false, when: S => S.p.path === 'human', options: Object.keys(ANIMALS).map(k => ({ value: k, label: ANIMALS[k].name.replace(/^an? /, '') })) }] },
      { group: 'The cell', when: is('special'), items: [
        { key: 'cell', type: 'select', label: 'Cell', restructure: R_, rebuild: true, options: [{ value: 'rbc', label: 'red blood cell' }, { value: 'neuron', label: 'nerve cell' }, { value: 'root', label: 'root hair cell' }] },
        { key: 'sph', label: 'Membrane lost (0 disc → 1 sphere)', min: 0, max: 1, step: 0.01, when: S => S.p.cell === 'rbc', fmt: v => (rbcShape(v).A).toFixed(0) + ' µm² left' },
        { key: 'dcap', label: 'Capillary width', min: 2, max: 8, step: 0.1, unit: 'µm', when: S => S.p.cell === 'rbc', fmt: v => v.toFixed(1) },
        { key: 'transit', label: 'Time in a lung capillary', min: 0.1, max: 1.2, step: 0.05, unit: 's', when: S => S.p.cell === 'rbc', fmt: v => v.toFixed(2) },
        { key: 'llen', label: 'Distance to cover', min: -3, max: 0.3, step: 0.01, when: S => S.p.cell === 'neuron', fmt: v => lenT(Math.pow(10, v)) },
        { key: 'diam', label: 'Axon diameter', min: 0.5, max: 20, step: 0.5, unit: 'µm', when: S => S.p.cell === 'neuron' },
        { key: 'myelin', type: 'toggle', label: 'Myelin sheath', when: S => S.p.cell === 'neuron' },
        { key: 'clen', label: 'Length of each cell in a chain', min: 20, max: 500, step: 10, unit: 'µm', when: S => S.p.cell === 'neuron' },
        { key: 'hlen', label: 'Root hair length', min: 0, max: 1.5, step: 0.05, unit: 'mm', when: S => S.p.cell === 'root', fmt: v => v.toFixed(2) },
        { key: 'hden', label: 'Root hairs per mm²', min: 0, max: 200, step: 5, when: S => S.p.cell === 'root' }] },
      { group: 'The tissue', when: is('tissues'), items: [
        { key: 'tissue', type: 'select', label: 'Tissue', restructure: R_, rebuild: true, options: [{ value: 'muscle', label: 'muscle (with its nerve)' }, { value: 'skin', label: 'skin: an epithelium' }, { value: 'tendon', label: 'tendon: connective' }] },
        { key: 'freq', label: 'Shocks a second', min: 0.5, max: 100, step: 0.5, unit: 'Hz', restructure: R_, when: S => S.p.tissue === 'muscle' },
        { key: 'volt', label: 'Shock strength', min: 0, max: 10, step: 0.1, unit: 'V', when: S => S.p.tissue === 'muscle', fmt: v => v.toFixed(1) },
        { key: 'lcsa', label: 'Muscle cross-section', min: -4.7, max: 1.9, step: 0.05, when: S => S.p.tissue === 'muscle', fmt: v => { const c = Math.pow(10, v); return c < 0.01 ? (c * 100).toPrecision(2) + ' mm²' : c.toPrecision(2) + ' cm²'; } },
        { key: 'ftype', type: 'select', label: 'Fibres', restructure: R_, when: S => S.p.tissue === 'muscle', options: [{ value: 'fast', label: 'fast (white)' }, { value: 'slow', label: 'slow (red)' }] },
        { key: 'strips', label: 'Tape strips taken', min: 0, max: 40, step: 1, restructure: R_, when: S => S.p.tissue === 'skin' },
        { key: 'rh', label: 'Room humidity', min: 10, max: 90, step: 5, unit: '%', restructure: R_, when: S => S.p.tissue === 'skin' },
        { key: 'airTs', label: 'Room temperature', min: 15, max: 32, step: 1, unit: '°C', restructure: R_, when: S => S.p.tissue === 'skin' },
        { key: 'load', label: 'Load', min: 0, max: 10000, step: 50, unit: 'N', when: S => S.p.tissue === 'tendon' },
        { key: 'csaT', label: 'Tendon cross-section', min: 10, max: 100, step: 1, unit: 'mm²', when: S => S.p.tissue === 'tendon' },
        { key: 'digest', type: 'toggle', label: 'Digest the collagen (collagenase)', when: S => S.p.tissue === 'tendon' }] },
      { group: 'The stomach', when: is('organs'), items: [
        { key: 'knock', type: 'select', label: 'Knock out', restructure: R_, options: Object.keys(KNOCK).map(k => ({ value: k, label: { none: 'nothing', acid: 'acid cells', mucus: 'mucus (aspirin)', muscle: 'muscle', blood: 'blood supply' }[k] })) },
        { key: 'pHl', label: 'Acid in the lumen', min: 1, max: 7, step: 0.1, unit: 'pH', fmt: v => v.toFixed(1) },
        { key: 'gel', label: 'Mucus gel', min: 0, max: 300, step: 5, unit: 'µm' },
        { key: 'hco3', label: 'Bicarbonate secreted', min: 0, max: 6, step: 0.1, unit: 'µmol/cm²/h', fmt: v => v.toFixed(1) },
        { key: 'bite', label: 'Size of the bites swallowed', min: 1, max: 15, step: 0.5, unit: 'mm', restructure: R_ },
        { key: 'waves', label: 'Antral waves', min: 0, max: 5, step: 0.5, unit: '/min', restructure: R_ },
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 60, label: '×60' }, { value: 300, label: '×300' }, { value: 900, label: '×900' }] }] },
      { group: 'The body', when: is('systems'), items: [
        { key: 'organ', type: 'select', label: 'Knock out', restructure: R_, options: Object.keys(ORGANS).map(k => ({ value: k, label: { none: 'nothing', heart: 'heart', lungs: 'lungs', liver: 'liver', kidneys: 'kidneys', gut: 'gut', skin: 'sweat glands' }[k] })) },
        { key: 'act', type: 'select', label: 'Doing', restructure: R_, options: Object.keys(ACT).map(k => ({ value: k, label: ACT[k].name })) },
        { key: 'pure', type: 'toggle', label: 'Breathed pure oxygen first', restructure: R_ },
        { key: 'drink', type: 'toggle', label: 'Drinking water', restructure: R_ },
        { key: 'meals', type: 'toggle', label: 'Eating three meals a day', restructure: R_ },
        { key: 'airT', label: 'Air temperature', min: 10, max: 40, step: 1, unit: '°C', restructure: R_ },
        { key: 'mass', label: 'Body mass', min: 30, max: 120, step: 1, unit: 'kg', restructure: R_ },
        { key: 'fatPct', label: 'Body fat', min: 5, max: 40, step: 1, unit: '%', restructure: R_ }] }
    ],

    setup, step, drawStage, onPointer, onDrag,
    plots: [
      { title: S => ({ hierarchy: 'How big is one of each level?', special: S.p.cell === 'rbc' ? 'Oxygen loaded while it crosses the lung' : S.p.cell === 'neuron' ? 'The signal’s journey' : 'Surface of 1 cm of root', tissues: S.p.tissue === 'muscle' ? 'Force, shock by shock' : S.p.tissue === 'skin' ? 'The evaporimeter settling' : 'Stress against stretch', organs: 'The meal leaving the stomach', systems: 'Every danger, on one log clock' })[S.p.setup], draw: plot1 },
      { title: S => ({ hierarchy: 'Bigger animals: more cells, not bigger ones', special: S.p.cell === 'rbc' ? 'Why spare membrane matters' : S.p.cell === 'neuron' ? 'One cell against a chain, at every length' : 'More surface, more water', tissues: S.p.tissue === 'muscle' ? 'Summation to tetanus: fast and slow fibres' : S.p.tissue === 'skin' ? 'Water lost, strip by strip' : 'Thicker tendon, stronger tendon', organs: 'What the gel does for the lining', systems: 'What fails first, organ by organ' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · scale and proportion', params: preset({ setup: 'hierarchy', path: 'human', animal: 'mouse' }),
        q: 'An adult human of 70 kg is made of about 3.72 × 10¹³ cells. A mouse’s cells are about the same size as ours. About how many cells make a 25 g mouse?',
        predict: { label: 'Cells in a mouse', unit: 'billion', tol: 0.03 },
        measure: S => cellsIn(ANIMALS[S.p.animal].kg) / 1e9,
        working: 'Same-sized cells, so the count goes with mass: 3.72 × 10¹³ × 0.025 ÷ 70 ≈ <b>13.3</b> billion. An elephant (5 t) has about 200 000 times as many — not bigger ones.' },
      { source: 'CAST pattern · structure and function', params: preset({ setup: 'special', cell: 'rbc', sph: 1 }),
        q: 'A red cell of 94 fL rounds into a sphere. Its membrane cannot stretch, so the narrowest tube it can pass is its own diameter, d = ∛(6V/π). How wide is that?',
        predict: { label: 'Narrowest tube', unit: 'µm', tol: 0.02 },
        measure: S => rbcShape(S.p.sph).tube,
        working: 'd = ∛(6 × 94 ÷ π) = ∛179.5 ≈ <b>5.64 µm</b> — too wide for most 3–5 µm capillaries. The normal disc, with 34 % more membrane, folds through 3.0 µm.' },
      { source: 'CAST pattern · developing a model', params: preset({ setup: 'special', cell: 'neuron', llen: 0, diam: 10, myelin: true, clen: 100 }),
        q: 'A myelinated axon 10 µm across carries a signal at 60 m/s. How long does it take to cover 1 m from the spinal cord to the toe?',
        predict: { label: 'Time', unit: 'ms', tol: 0.02 },
        measure: S => oneCell(Math.pow(10, S.p.llen), S.p.diam, S.p.myelin) * 1000,
        working: 't = L ÷ v = 1 m ÷ 60 m/s ≈ <b>16.7 ms</b>. A chain of 100 µm cells would need 10 000 gaps × 0.5 ms = 5 s.' },
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'tissues', tissue: 'muscle', lcsa: Math.log10(5), volt: 10, freq: 50 }),
        q: 'Muscle can pull with about 22.5 N for every cm² of its cross-section. A biceps is about 5 cm² across. With every fibre recruited and fused, what force can it make?',
        predict: { label: 'Force', unit: 'N', tol: 0.03 },
        measure: S => fMax(S.p),
        working: 'F = 22.5 × 5 ≈ <b>112 N</b> (all fibres: 10 V recruits 99.9 %). A thigh muscle of 70 cm² makes over 1.5 kN — the force is the fibres side by side.' },
      { source: 'CAST pattern · cause and effect', params: preset({ setup: 'tissues', tissue: 'tendon', csaT: 65, load: 1000 }),
        q: 'Tendon collagen breaks at about 100 MPa (100 N per mm²). What load breaks an Achilles tendon 65 mm² across?',
        predict: { label: 'Breaking load', unit: 'N', tol: 0.02 },
        measure: S => utsOf(S.p.digest) * S.p.csaT,
        working: 'F = 100 N/mm² × 65 mm² = <b>6500 N</b> — about 9.5 times the weight of a 70 kg person.' },
      { source: 'CAST pattern · systems and system models', params: preset({ setup: 'systems', organ: 'lungs', act: 'rest' }),
        q: 'At rest you hold about 1.3 L of oxygen in your lungs and blood, and use 250 mL a minute. You black out when about 590 mL is left. How long after your last breath?',
        predict: { label: 'Time to blackout', unit: 'min', tol: 0.08 },
        measure: S => S.bodyR.fails.sat / 60,
        working: '(1316 − 590) ÷ 250 ≈ <b>2.9 min</b>. Breathe pure oxygen first and the lungs hold 2.1 L of it: about 10 minutes.' }
    ],

    walkthrough: [
      { title: 'Count the levels', ask: 'Zoom from the whole body into the heart. Which level is the first you need a microscope for?', reveal: '<b>The tissue.</b> Organs and organ systems are visible to the eye; cardiac muscle tissue is cells 0.1 mm long. Each level is made of many of the one below — 4 billion cells in one heart.', params: preset({ path: 'human', zoom: Math.log10(7e-4) }) },
      { title: 'Bigger animal, bigger cells?', ask: 'An elephant weighs 200 000 times as much as a mouse. Are its cells 200 000 times bigger?', reveal: '<b>No — about the same size.</b> Its red cells are 9 µm against the mouse’s 6.6; a goat’s are smaller than a cat’s. It has 200 000 times as many cells.', params: preset({ path: 'human', animal: 'elephant', zoom: Math.log10(1.4e-4) }) },
      { title: 'Why a disc?', ask: 'Turn the red cell into a sphere of the same volume. What goes wrong?', reveal: '<b>Two things.</b> It now needs a 5.6 µm tube and jams in a 4 µm capillary — and its middle is so far from its surface that in 0.25 s (running) it loads only 79 % of its oxygen. Same genes; the disc is the job.', params: preset({ setup: 'special', cell: 'rbc', sph: 1, dcap: 4, transit: 0.25 }) },
      { title: 'Twitch to tetanus', ask: 'Shock the muscle once a second, then 50 times a second. Does it pull harder?', reveal: '<b>About four times harder.</b> At 50 Hz each twitch of these slow fibres starts before the last has relaxed; they add up and fuse into one steady pull (fast fibres need nearer 100 Hz). Turn the voltage down and fewer fibres join in: the tissue’s force is its cells working together.', params: preset({ setup: 'tissues', tissue: 'muscle', freq: 50, ftype: 'slow' }) },
      { title: 'Why doesn’t the stomach digest itself?', ask: 'The stomach is full of acid at pH 2 and an enzyme that digests protein. Why is its own lining safe?', reveal: '<b>A layer of gel with bicarbonate in it.</b> Acid diffusing in meets bicarbonate diffusing out and they cancel 100 µm above the cells: the lining sits at pH 7. Thin the gel with aspirin and drop the pH: the front reaches the lining.', params: preset({ setup: 'organs', knock: 'mucus', pHl: 1.6 }) },
      { title: 'What fails first?', ask: 'Knock out the heart, then the lungs, then the kidneys. Which fails fastest, and why?', reveal: '<b>The heart, in about 10 seconds.</b> The brain holds only a few seconds of oxygen and every store needs blood to move it. The lungs’ loss takes ~3 minutes (the body’s oxygen store), the kidneys’ a week (potassium builds up). Organs work as one system.', params: preset({ setup: 'systems', organ: 'heart' }) }
    ],

    quiz: [
      { q: 'Which list runs from smallest to largest?', options: ['cell, tissue, organ, organ system, organism', 'tissue, cell, organ, organism, organ system', 'organ, tissue, cell, organism, organ system', 'cell, organ, tissue, organ system, organism'], answer: 0, why: 'Each level is made of many of the level below it. Zoom out from a heart cell and you meet cardiac muscle tissue, then the heart, the circulatory system, the person.' },
      { q: 'An elephant has far more cells than a mouse because', options: ['it has many more cells of about the same size', 'each of its cells is much bigger', 'its cells divide faster', 'its cells have more DNA'], answer: 0, why: 'Cell size is set by what a cell must do (diffusion, signalling), not by the size of the animal. Look at the red cells in the table: 6.6 µm against 9.2 µm.' },
      { q: 'A nerve cell and a red blood cell from the same person', options: ['have the same genes, but different genes switched on', 'have completely different genes', 'have the same genes switched on', 'only differ in shape'], answer: 0, why: 'Every body cell carries the same genome. A red cell switches on haemoglobin; a nerve cell switches on sodium channels.' },
      { q: 'A muscle pulls harder when stimulated 50 times a second than once because', options: ['twitches add up before they relax', 'each fibre grows bigger', 'the muscle gets longer', 'the nerve sends stronger shocks'], answer: 0, why: 'Summation: a new twitch starts while the last is still pulling, up to a fused tetanus about four times a single twitch.' },
      { q: 'If the heart stops, a person loses consciousness in about', options: ['10 seconds', '3 minutes', '1 hour', '1 day'], answer: 0, why: 'The brain stores only seconds of oxygen. Without the heart no organ’s store can be delivered.' }
    ],

    notes: '<p><b>The hierarchy.</b> Cells make tissues (groups of similar cells doing one job), tissues make organs, organs work together as organ systems, and the systems together make an organism. A 70 kg adult is about 3.72 × 10¹³ cells (71 % red blood cells). Bigger animals have more cells, not bigger ones.</p>' +
      '<p><b>Specialised cells.</b> Every cell in a body has the same genes; different cells switch different genes on, and take the shape their job needs: a red cell is a thin disc (fast to fill with oxygen, foldable through capillaries), a nerve cell is long (one fast membrane instead of many slow gaps), a root hair cell is drawn out sideways (more surface for water).</p>' +
      '<p><b>Tissues and organs.</b> The four animal tissues — epithelium, connective, muscle and nervous — each work as a sheet or a bundle of cells. An organ like the stomach is several tissues layered together, each with a job: glands make acid and enzymes, mucus and bicarbonate protect, blood supplies, muscle churns.</p>' +
      '<p><b>Systems and the whole.</b> Each organ system keeps something topped up — oxygen, glucose, water — or clears something away. Knock one out and the store it keeps runs down: seconds without the heart, minutes without breathing, days without the kidneys.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Bigger animals have bigger cells” and “every body cell is the same apart from its shape.” Cells are about the same size in a mouse and an elephant; and cells differ in which genes are switched on, which is what makes their shapes and jobs different.</div>'
  });

  L.models = L.models || {};
  L.models['g6b-levels'] = { PATHS, zoomAt, CENSUS, CELLS_70, ANIMALS, cellsIn, rbcShape, minTube, loaded, t95, slabFrac, speedOf, oneCell, nCells, chainTime, rootArea, uptake, recruit, forceAt, peakForce, fMax, SPEC_T, FIB, tewl, layersLeft, csat, strainOf, utsOf, TEND, barrier, pepsin, effective, mealRun, bodyRun, firstFail, satFromStore, hill, BASE: () => preset({}) };
})(window.InsightLab);
