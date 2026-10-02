/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-2  Inside the Cell — Membranes, Walls and Organelles
   (B2.1 Cell membrane; B2.2 Cell wall; B2.3 Nucleus; B2.4 Mitochondria;
    B2.5 Chloroplasts; B2.6 Relating structure to whole-cell function)

   Six benches, one for each part of a cell, each with the experiment that
   showed what that part does — worked out from the physics, not painted.
     membrane — a bag of Visking tubing, a model cell: water flows in as
                fast as its permeability and the difference in dissolved
                particles drive it (Kedem–Katchalsky), each solute leaks at
                its own rate, starch never; seen at the pores, molecules move.
     wall     — red onion cells and red blood cells in the same salt: the
                wall stops the bursting, not the water. Each cell has its own
                sap, so plasmolysis and bursting spread over a range.
     nucleus  — Hämmerling's Acetabularia: cut, grafted, left alone. The
                nucleus makes a cap-building substance that lasts weeks; the
                cap is whatever mix the stalk holds when it starts one.
     mito     — a respirometer in a water bath: peas, maggots, beads; the dye
                drop measures oxygen used (Q10 = 2.1); and the electron
                microscope's view of cells that work hard and cells that don't.
     chloro   — Elodea's bubbles against the lamp's distance (inverse square,
                saturation, compensation); Engelmann's bacteria gathering in
                the red and the blue; a variegated leaf tested for starch.
     size     — agar cubes soaked in alkali (x ∝ √t) and a cell grown until
                oxygen can no longer reach its middle (R = √(6DC/q)).
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.CELL, MICRO, MEAS, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, MI = () => window.MICRO, CE = () => window.CELL;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const R_GAS = 8.314;
  const eta = Tc => 2.414e-5 * Math.pow(10, 247.8 / (Tc + 273.15 - 140));      // water's viscosity, Pa·s (Vogel)
  const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2); const pr = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - pr : pr; };
  /* ±4 standard deviations in 49 weighted points, for averaging over cells that differ */
  const GH = (() => { const out = []; for (let i = -24; i <= 24; i++) { const z = i / 6; out.push([z, Math.exp(-z * z / 2)]); } const s = out.reduce((u, q) => u + q[1], 0); return out.map(q => [q[0], q[1] / s]); })();

  /* ============================================================
     1. THE MEMBRANE — a Visking-tubing bag in a beaker
     Water crosses as J = Lp·A·(Σσ·i·RT·Δc − P): Lp 3.5 × 10⁻¹³ m/(Pa·s),
     fitted to the classic class result (a bag of sucrose in water gains
     4, 8, 11, 14, 17 % in 30 minutes at 0.2 … 1.0 M). Each solute leaks at
     its own permeability P and is felt by the water only as its reflection
     coefficient σ says: sucrose barely leaks (σ 0.55), salt goes straight
     through (σ 0.05), starch never (σ 1). The tubing is 25 mm flat (a 16 mm
     tube), 12 cm long between its knots, 15 mL in it, 200 mL outside; once
     full it stretches no further, and its pressure P stops the water.
     Warmer, everything crosses faster: D ∝ T/η, Lp ∝ 1/η.
     ============================================================ */
  const SOLUTES = {
    glucose: { name: 'glucose', P: 1.5e-6, sigma: 0.25, i: 1, M: 180.16, dens: 0.38 },
    sucrose: { name: 'sucrose', P: 0.7e-6, sigma: 0.55, i: 1, M: 342.3, dens: 0.38 },
    salt: { name: 'salt', P: 4e-6, sigma: 0.05, i: 1.86, M: 58.44, dens: 0.7 },
    iodine: { name: 'iodine', P: 6e-6, sigma: 0.05, i: 1, M: 254, dens: 0.7 },
    starch: { name: 'starch', P: 0, sigma: 1, i: 1, M: 1e6, dens: 0.38 }
  };
  const SK = Object.keys(SOLUTES);
  const TUBE = { flat: 2.5, LP: 3.5e-13, E: 30e6, fill: 1.25, len: 12, bath: 200, iodine: 1.0, starch: 10 };
  function bagStart(p) {
    const L_ = TUBE.len, Vmax = Math.PI * Math.pow(TUBE.flat / Math.PI, 2) * L_, V = TUBE.fill * L_;        // mL
    const inC = {}, outC = {};
    SK.forEach(k => { inC[k] = 0; outC[k] = 0; });
    if (p.fill === 'starch') { inC.glucose = p.cIn; inC.starch = TUBE.starch / SOLUTES.starch.M; }
    if (p.fill === 'sucrose') inC.sucrose = p.cIn;
    if (p.fill === 'salt') inC.salt = p.cIn;
    if (p.bath === 'iodine') outC.iodine = TUBE.iodine / 1000;
    if (p.bath === 'sucrose') outC.sucrose = p.cOut;
    const nIn = {}, nOut = {};
    SK.forEach(k => { nIn[k] = inC[k] * V / 1000; nOut[k] = outC[k] * TUBE.bath / 1000; });        // mol
    const B = { t: 0, V, V0: V, Vmax, A: 2 * TUBE.flat * L_, Vtot: V + TUBE.bath, nIn, nOut, P: 0, Jv: 0, dPi: 0, c0: { in: Object.assign({}, inC), out: Object.assign({}, outC) } };
    B.m0 = bagMass(B);
    return B;
  }
  const cIn = (B, k) => B.nIn[k] / (B.V / 1000);                       // mol/L
  const cOut = (B, k) => B.nOut[k] / ((B.Vtot - B.V) / 1000);
  function bagMass(B) { let rho = 1; SK.forEach(k => { rho += cIn(B, k) * SOLUTES[k].M * SOLUTES[k].dens * 1e-3; }); return B.V * rho; }
  function bagStep(B, dt, Tc) {
    const T = Tc + 273.15, fP = T / 293.15 * eta(20) / eta(Tc), fL = eta(20) / eta(Tc), A = B.A * 1e-4;
    let dPi = 0;
    SK.forEach(k => { const S = SOLUTES[k]; dPi += S.sigma * S.i * R_GAS * T * (cIn(B, k) - cOut(B, k)) * 1000; });
    const Vs = 0.97 * B.Vmax; B.P = B.V > Vs ? TUBE.E * (B.V / Vs - 1) : 0;
    const Jv = TUBE.LP * fL * A * (dPi - B.P);                         // m³/s into the bag
    SK.forEach(k => { const S = SOLUTES[k]; if (!S.P) return; const J = S.P * fP * A * (cOut(B, k) - cIn(B, k)) * 1000 * dt; B.nIn[k] += J; B.nOut[k] -= J; });
    B.V += Jv * 1e6 * dt; B.t += dt; B.Jv = Jv * 1e6 * 3600; B.dPi = dPi;
  }
  function bagRun(p, minutes) { const B = bagStart(p), n = Math.round(minutes * 30); for (let i = 0; i < n; i++) bagStep(B, 2, p.temp); return B; }
  const massPct = B => (bagMass(B) / B.m0 - 1) * 100;
  /* Benedict's test on a sample of the beaker water: the colour a reducing sugar gives, by % glucose */
  const BENEDICT = [[0.05, 'blue: none', '#3A6ED8'], [0.25, 'green: a trace', '#58A04A'], [0.75, 'yellow: some', '#D8C040'], [1.5, 'orange: a lot', '#E08A30'], [1e9, 'brick red: very much', '#B83A20']];
  const benedict = pct => BENEDICT.find(b => pct < b[0]);
  const glucosePct = M => M * 180.16 / 10;
  const boundOf = B => 1 - Math.exp(-cIn(B, 'iodine') / 0.0002);    // the starch–iodine blue-black inside, 0…1

  /* ============================================================
     2. WALLS — red onion cells, their protoplasts, and red blood cells
     Outside, π = osmolality × RT (NaCl: 2 ions, osmotic coefficient 0.93).
     A red onion cell's sap is about 0.85 MPa (±8 % cell to cell). In a
     weaker solution water enters until the wall (stiffness 8 MPa) pushes
     back as hard as the sap pulls — turgor; in a stronger one the living
     protoplast shrinks away from its wall (15 % of it is not water). Walls
     digested away, the same protoplast swells as the solution dilutes and
     bursts at 1.5× its volume (±8 %). A red cell: 90 fL at 290 mOsm, 43 %
     of it not water; it bursts at 147.5 fL (±7 %; the cells ±8 %), about
     half of them in 0.43 % salt — the osmotic fragility test. Boiled, the
     membranes are dead: the red leaks out, and nothing shrinks.
     ============================================================ */
  const RT_MPA = R_GAS * 293.15 / 1000;
  const osmNaCl = pct => pct * 10 / 58.44 * 2 * 0.93;                // osmol/L
  const piOut = pct => osmNaCl(pct) * RT_MPA;                           // MPa
  const ONION = { pi: 0.85, cv: 0.08, b: 0.15, eps: 8, burst: 1.5, burstCv: 0.08, tau: 60, tauP: 20 };
  function walled(pi, po) {
    if (po >= pi) return { v: ONION.b + (1 - ONION.b) * pi / po, P: 0, plas: true };
    let x = 1; for (let k = 0; k < 40; k++) { const f = ONION.eps * (x - 1) - (pi / x - po); x -= f / (ONION.eps + pi / (x * x)); }
    return { v: x, P: ONION.eps * (x - 1), plas: false };
  }
  const freeProto = (pi, po) => ONION.b + (1 - ONION.b) * pi / Math.max(1e-3, po);
  const RBC = { V0: 90, b: 0.43, osm0: 0.29, crit: 147.5, cv: 0.08, critCv: 0.07, tau: 1.5 };
  const rbcV = (pct, V0) => (V0 || RBC.V0) * (RBC.b + (1 - RBC.b) * RBC.osm0 / Math.max(0.004, osmNaCl(pct)));
  const fracPlas = pct => Phi((piOut(pct) - ONION.pi) / (ONION.cv * ONION.pi));
  function fracBurstProto(pct) { const po = piOut(pct); let s = 0; GH.forEach(([a, wa]) => GH.forEach(([c, wc]) => { if (freeProto(ONION.pi * (1 + ONION.cv * a), po) > ONION.burst * (1 + ONION.burstCv * c)) s += wa * wc; })); return s; }
  function fracLysed(pct) { let s = 0; GH.forEach(([a, wa]) => GH.forEach(([c, wc]) => { if (rbcV(pct, RBC.V0 * (1 + RBC.cv * a)) > RBC.crit * (1 + RBC.critCv * c)) s += wa * wc; })); return s; }
  function fracCrenated(pct) { let s = 0; GH.forEach(([a, wa]) => { if (rbcV(pct, RBC.V0) < 0.85 * RBC.V0 * (1 + 0 * a)) s += wa; }); return s; }
  /* where half the onion cells plasmolyse (incipient plasmolysis), and where half the red cells burst */
  const PCT_PLAS50 = ONION.pi / RT_MPA / (2 * 0.93) * 58.44 / 10;
  function pctLysed50() { let lo = 0.1, hi = 0.9; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (fracLysed(m) > 0.5) lo = m; else hi = m; } return (lo + hi) / 2; }
  /* the slides the lab counts: onion epidermis (rows of long cells), protoplasts set free, a drop of blood */
  function onionCells(seed) {
    const r = rng(seed * 17 + 3), cells = [];
    let y = -620;
    const rows = []; while (y < 620) { rows.push(y); y += 56 + r() * 12; }
    const edge = (j, x) => rows[j] + 3 * Math.sin(x / 230 + j * 1.7) + 2 * Math.sin(x / 80 + j);
    for (let j = 0; j < rows.length - 1; j++) {
      let x = -1100 - r() * 250;
      while (x < 1100) {
        const len = 170 + r() * 170, x1 = x + len, z = (r() + r() + r() - 1.5) * 2, zb = (r() + r() + r() - 1.5) * 2;
        const v = [[x, edge(j, x)], [x1, edge(j, x1)], [x1, edge(j + 1, x1)], [x, edge(j + 1, x)]];
        const h = rows[j + 1] - rows[j];
        const coag = []; for (let q = 0; q < 7; q++) coag.push([(r() - 0.5) * len * 0.8, (r() - 0.5) * h * 0.6, 1 + r() * 1.6]);
        cells.push({ v, cx: (x + x1) / 2, cy: (rows[j] + rows[j + 1]) / 2, w: len, h, pi: ONION.pi * (1 + ONION.cv * z), burstAt: ONION.burst * (1 + ONION.burstCv * zb), off: r() * 2 - 1, tone: r() * 2 - 1, vol: 1, sap: 1, coagList: coag });
        x = x1;
      }
    }
    return cells;
  }
  function protoCells(seed) {
    const r = rng(seed * 29 + 5), out = [];
    for (let i = 0; i < 90; i++) { const z = (r() + r() + r() - 1.5) * 2, zb = (r() + r() + r() - 1.5) * 2, a = r() * TAU, d = Math.sqrt(r()) * 620; out.push({ free: true, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7, pi: ONION.pi * (1 + ONION.cv * z), burstAt: ONION.burst * (1 + ONION.burstCv * zb), vol: 1, sap: 1, r0: 44 + r() * 14, r: 50, burst: false, a: r() * TAU, tone: r() * 2 - 1 }); }
    return out;
  }
  function rbcCells(seed) {
    const r = rng(seed * 41 + 7), out = [];
    for (let i = 0; i < 1500; i++) { const z = (r() + r() + r() - 1.5) * 2, zc = (r() + r() + r() - 1.5) * 2, V0 = RBC.V0 * (1 + RBC.cv * z); out.push({ x: (r() - 0.5) * 420, y: (r() - 0.5) * 420, V0, V: V0, crit: RBC.crit * (1 + RBC.critCv * zc), lysed: false, a: r() * TAU }); }
    return out;
  }
  /* a school microscope's 10× and 40×, as 6B-1 works them out: resolution, blur off the focal plane, field */
  const OBJ = { 10: 0.25, 40: 0.65, 100: 1.25 };
  function scope(obj) { const NAo = OBJ[obj] || 0.65, NAc = NAo * 0.7, r = 1.22 * 0.55 / (NAo + NAc), sd = 0.344 * r, th = Math.asin(NAc); return { M: obj * 10, field: 18000 / obj, r, sigma: dz => Math.sqrt(sd * sd + Math.pow(Math.abs(dz) * Math.tan(th) / 2, 2)), pc: 0.45 }; }

  /* ============================================================
     3. THE NUCLEUS — Hämmerling's Acetabularia (1930s–1950s)
     One cell 4–5 cm tall, its single nucleus in the rhizoid at the base.
     The nucleus makes a cap-building substance, 1 unit a day of its own
     kind; it lasts (half-life 15 days) and is stored up the stalk. A stalk
     that has grown back for 10 days can start a cap once it holds 10 units;
     the cap uses them up and takes the shape of the mixture — all
     mediterranea, smooth; all crenulata, free notched rays; in between,
     in between. A full-grown cell holds about 20 units, a young one 6;
     the rhizoid by itself about 2. With no nucleus a piece lives about
     75 days; a cap cut off, about 12.
     ============================================================ */
  const ACET = { p: 1, half: 15, theta: 10, prep: 10, grow: 7, S0: 20, young: 6, rhiz: 2, Lmin: 1.5, g: 0.3, Lmax: 4.5, noNucLife: 75, capLife: 12 };
  const SPN = { med: 'A. mediterranea', cren: 'A. crenulata' };
  function acetPieces(op, nuc, age, stalk) {
    const other = nuc === 'med' ? 'cren' : 'med', S0 = age === 'young' ? ACET.young : ACET.S0;
    const pool = (sp, v) => ({ med: sp === 'med' ? v : 0, cren: sp === 'cren' ? v : 0 });
    const piece = o => Object.assign({ nuclei: [], S: { med: 0, cren: 0 }, L: 0, cap: null, since: 0, caps: [], alive: true, age: 0, hist: [] }, o);
    if (op === 'decap') return [piece({ name: 'the cell, its cap cut off', nuclei: [nuc], S: pool(nuc, S0), L: age === 'young' ? 1.4 : 4, cut: true })];
    if (op === 'pieces') return [
      piece({ name: 'the cap', kind: 'cap', L: 0.3, cap: { f: nuc === 'cren' ? 1 : 0, grow: 1, old: true } }),
      piece({ name: 'the stalk', sub: 'no nucleus', S: pool(nuc, S0), L: age === 'young' ? 1.0 : 2.6, base: false, cut: true }),
      piece({ name: 'the base', sub: 'the nucleus', nuclei: [nuc], S: pool(nuc, ACET.rhiz), L: 0.4, cut: true })];
    if (op === 'graft') return [piece({ name: 'a ' + (other === 'med' ? 'mediterranea' : 'crenulata') + ' stalk', sub: 'on a ' + (nuc === 'med' ? 'mediterranea' : 'crenulata') + ' base', nuclei: [nuc], S: { med: (other === 'med' ? S0 : 0) + (nuc === 'med' ? ACET.rhiz : 0), cren: (other === 'cren' ? S0 : 0) + (nuc === 'cren' ? ACET.rhiz : 0) }, L: 3, graft: 0.4, cut: true })];
    if (op === 'two') { const st = stalk || 'med'; return [piece({ name: 'one ' + (st === 'med' ? 'mediterranea' : 'crenulata') + ' stalk', sub: 'on two bases, one of each', nuclei: ['med', 'cren'], S: { med: (st === 'med' ? S0 : 0) + ACET.rhiz, cren: (st === 'cren' ? S0 : 0) + ACET.rhiz }, L: 3, graft: 0.4, cut: true })]; }
    return [];
  }
  function acetStep(pieces, dt, recut) {
    const lam = Math.LN2 / ACET.half;
    pieces.forEach(pc => {
      if (!pc.alive) return;
      pc.age += dt;
      if (pc.kind === 'cap') { if (pc.age > ACET.capLife) pc.alive = false; return; }
      if (!pc.nuclei.length && pc.age > ACET.noNucLife) { pc.alive = false; return; }
      pc.nuclei.forEach(sp => { pc.S[sp] += ACET.p * dt; });
      pc.S.med *= Math.exp(-lam * dt); pc.S.cren *= Math.exp(-lam * dt);
      pc.since += dt;
      if (!pc.cap && pc.L < ACET.Lmax && (pc.nuclei.length || pc.L < 1.2 * ACET.Lmin)) pc.L = Math.min(ACET.Lmax, pc.L + ACET.g * dt * (pc.nuclei.length ? 1 : 0.3));
      if (pc.since > 0.5) pc.cut = false;
      const tot = pc.S.med + pc.S.cren;
      if (!pc.cap && pc.since >= ACET.prep && pc.L >= ACET.Lmin && tot >= ACET.theta) {
        const f = pc.S.cren / tot; pc.S.med *= 1 - ACET.theta / tot; pc.S.cren *= 1 - ACET.theta / tot;
        pc.cap = { f, grow: 0, day: pc.age }; pc.caps.push({ day: pc.age, f });
      }
      if (pc.cap && !pc.cap.old && pc.cap.grow < 1) pc.cap.grow = Math.min(1, pc.cap.grow + dt / ACET.grow);
      if (pc.cap && pc.cap.grow >= 1 && !pc.cap.old && recut) { pc.cap = null; pc.since = 0; pc.cut = true; }
    });
  }
  /* the whole run to day 100, worked out once for these settings */
  function aheadOf(S) { const p = S.p, key = [p.op, p.nuc, p.age, p.recut, p.stalk].join('|'); if (S._ahead && S._ahead.key === key) return S._ahead.P; const P = acetRun(p.op, p.nuc, p.age, 100, p.recut, p.stalk); S._ahead = { key, P }; return P; }
  function acetRun(op, nuc, age, days, recut, stalk) { const P = acetPieces(op, nuc, age, stalk); for (let d = 0; d < Math.round(days * 10); d++) acetStep(P, 0.1, recut); return P; }

  /* ============================================================
     4. MITOCHONDRIA — the respirometer, and cells seen by electrons
     Germinating peas use about 0.048 mL of oxygen a gram an hour at 22 °C
     (25 peas, 10 g: 0.16 mL in 20 minutes, as classes measure), dry peas
     2 % of that, blowfly maggots about 0.5; Q10 = 2.1, falling away above
     35 °C as the enzymes denature. KOH takes up the CO₂ they give out; without
     it only oxygen used minus CO₂ made shows (RQ 1.0 for peas burning starch,
     0.8 for maggots burning fat): nothing, for peas. The bath cools 0.15 °C
     over the run, shrinking the 20 mL of air in every vial a little — the beads
     show it, and are taken off the others.
     ============================================================ */
  const RESP = { Q10: 2.1, T0: 22, gas: 20, org: { peas: { per: 0.048, rq: 1.0, name: 'germinating peas' }, maggots: { per: 0.5, rq: 0.8, name: 'blowfly maggots' }, boiled: { per: 0, rq: 1, name: 'boiled peas' }, dry: { per: 0.048 * 0.02, rq: 1, name: 'dry peas' } } };
  const respRate = (kind, T) => { const o = RESP.org[kind]; return o.per * Math.pow(RESP.Q10, (T - RESP.T0) / 10) * (T > 35 ? Math.max(0, 1 - (T - 35) / 10) : 1); };
  const drift = (t, T) => RESP.gas * 0.15 * (1 - Math.exp(-t / 900)) / (T + 273.15);
  /* the reading on one vial after t s: the drop moves in as gas is used; beads read only the drift */
  function reading(kind, mass, T, koh, t) { const o = RESP.org[kind], O2 = respRate(kind, T) * mass * t / 3600; return { O2, read: (koh ? O2 : O2 * (1 - o.rq)) + drift(t, T) }; }
  const DRY_G = 5;
  /* the three vials' readings now, from the oxygen used so far */
  function respNow(S) { const p = S.p, d = drift(S.ts, p.bathT), o = RESP.org[p.org], dry = RESP.org.dry; return { v1: (p.koh ? S.o2 : S.o2 * (1 - o.rq)) + d, v2: (p.koh ? S.o2dry : S.o2dry * (1 - dry.rq)) + d, d, o2: S.o2 }; }
  /* the cells under the electron microscope: the share of each that is mitochondria (morphometry), and
     the oxygen the tissue uses, mL a gram an hour, working as it does */
  const TISSUE = {
    pea: { name: 'a pea’s seed leaf, germinating', short: 'pea seed leaf', mito: 0.02, o2: 0.05, plant: true, has: 'starch grains and protein, and mitochondria to burn them' },
    root: { name: 'a root-tip cell', short: 'root tip', mito: 0.06, o2: 0.4, plant: true, has: 'a big nucleus, dividing: busy' },
    leaf: { name: 'a leaf’s palisade cell', short: 'leaf', mito: 0.015, o2: 0.1, plant: true, has: 'chloroplasts, and mitochondria too' },
    heart: { name: 'heart muscle', short: 'heart', mito: 0.25, o2: 5, has: 'myofibrils, and a row of mitochondria along each' },
    flight: { name: 'a hummingbird’s flight muscle', short: 'hummingbird', mito: 0.35, o2: 130, has: 'the most mitochondria of any muscle' },
    leg: { name: 'leg muscle', short: 'leg muscle', mito: 0.05, o2: 12, has: 'myofibrils, mitochondria in pairs; fast work runs short of oxygen' },
    liver: { name: 'a liver cell', short: 'liver', mito: 0.2, o2: 2, has: 'glycogen, and the machinery of a chemical works' },
    fat: { name: 'a fat cell', short: 'fat', mito: 0.01, o2: 0.1, has: 'one drop of fat, a thin rim of cytoplasm' },
    rbc: { name: 'a red blood cell', short: 'red cell', mito: 0, o2: 0, has: 'nothing but haemoglobin: no nucleus, no mitochondria' }
  };

  /* ============================================================
     5. CHLOROPLASTS
     Elodea under a lamp: 600 µmol photons/m²/s at 10 cm, falling as 1/d².
     Oxygen made = P_max · CO₂ factor · temperature factor · tanh(I·colour/I_k)
     (P_max 1 µmol/min, I_k 150; CO₂ from bicarbonate, c/(0.05 + c); Q10 2 to
     30 °C, then falling), minus respiration (0.08 µmol/min at 20 °C). A bubble
     is 1 mm³ of gas, 0.041 µmol. LEDs of one colour at the same photon flux:
     red and white 1, blue 0.85 (some caught by carotenoids that pass less on),
     green 0.35 (a thin leaf lets most of it through). A filament lamp warms
     the water 4 °C at 10 cm (as 1/d²) over about 8 minutes, unless a beaker of
     water stands in between.
     Engelmann (1882): a spectrum across a green alga; oxygen is made where
     light is absorbed (the absorption of a green alga, from its chlorophylls
     and carotenoids), and aerobic bacteria gather where the oxygen is.
     A leaf's starch: made only where there are chloroplasts and light,
     0.22 of a full test's colour an hour; a plant left in the dark for two days
     has used up the starch it had.
     ============================================================ */
  const EL = { I0: 600, d0: 10, PMAX: 1.0, IK: 150, RESP: 0.08, BUBBLE: 0.041, heat: 4, tauHeat: 480 };
  const COLOUR = { white: 1, red: 1, blue: 0.85, green: 0.35 };
  const LAMP = { white: '#FFF4D0', red: '#FF6A50', blue: '#6A8CFF', green: '#6CE07C' };
  const Iat = d => EL.I0 * Math.pow(EL.d0 / d, 2);
  const tFac = T => Math.pow(2, (Math.min(T, 30) - 20) / 10) * (T > 30 ? Math.max(0, 1 - (T - 30) / 12) : 1);
  const co2Fac = pct => { const c = pct + 0.01; return c / (0.05 + c); };
  const gross = (I, pct, T, col) => EL.PMAX * co2Fac(pct) * tFac(T) * Math.tanh((COLOUR[col] || 1) * I / EL.IK);
  const respE = T => EL.RESP * Math.pow(2, (T - 20) / 10);
  const netO2 = (d, pct, T, col) => gross(Iat(d), pct, T, col) - respE(T);
  const bubbles = (d, pct, T, col) => Math.max(0, netO2(d, pct, T, col)) / EL.BUBBLE;
  const heatUp = (d, shield) => EL.heat * Math.pow(EL.d0 / d, 2) * (shield ? 0.1 : 1);
  const waterAt = (p, t) => p.waterT + heatUp(p.dist, p.shield) * (1 - Math.exp(-t / EL.tauHeat));
  function compensation(pct, T, col) { let lo = 5, hi = 400; if (netO2(hi, pct, T, col) > 0) return Infinity; if (netO2(lo, pct, T, col) < 0) return 0; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (netO2(m, pct, T, col) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  const ABS = [[380, 0.62], [400, 0.78], [420, 0.9], [435, 0.95], [455, 0.92], [470, 0.9], [490, 0.78], [510, 0.55], [530, 0.36], [550, 0.26], [570, 0.25], [590, 0.3], [610, 0.38], [630, 0.46], [650, 0.66], [665, 0.85], [678, 0.92], [690, 0.7], [700, 0.36], [715, 0.1], [740, 0.02], [760, 0]];
  const lerpT = (T, x) => { if (x <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (x <= T[i][0]) { const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return T[T.length - 1][1]; };
  const absorb = nm => lerpT(ABS, nm);
  const action = nm => absorb(nm) * (nm > 470 && nm < 530 ? 0.72 + 0.28 * Math.abs(nm - 500) / 30 : 1);
  const SPEC_COL = [[400, '#7E5CD8'], [440, '#4A62F0'], [480, '#36B4F0'], [510, '#46D27A'], [550, '#A8E040'], [580, '#F2E03A'], [610, '#FFA030'], [650, '#FF4A26'], [720, '#A01414']];
  const specCol = nm => { for (let i = 1; i < SPEC_COL.length; i++) if (nm <= SPEC_COL[i][0]) { const a = SPEC_COL[i - 1], b = SPEC_COL[i]; return RXmix(a[1], b[1], (nm - a[0]) / (b[0] - a[0])); } return SPEC_COL[SPEC_COL.length - 1][1]; };
  function RXmix(a, b, t) { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join(''); }
  /* Engelmann's slide: a spectrum 400–720 nm spread over 800 µm; the filament lies along it */
  const ENG = { x0: -400, x1: 400, nm0: 400, nm1: 720, lam: 55, span: 900, speed: 4 };
  const nmAt = x => ENG.nm0 + (clamp(x, ENG.x0, ENG.x1) - ENG.x0) / (ENG.x1 - ENG.x0) * (ENG.nm1 - ENG.nm0);
  /* Spirogyra: cells 110 µm long, 36 µm wide, a ribbon chloroplast in two turns a cell */
  const SPI = { L: 110, W: 36, turns: 2, band: 5.5, spotR: 14, full: 0.168 };          // full: the share of the spot a ribbon fills where it crosses the middle
  const ribbonY = x => { const u = ((x % SPI.L) + SPI.L) % SPI.L / SPI.L, th = u * SPI.turns * TAU; return { y: Math.sin(th) * (SPI.W / 2 - 3.5), front: Math.cos(th) > 0 }; };
  function spotOnRibbon(sx) { let hit = 0, n = 0; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const x = sx + i / 6 * SPI.spotR, y = j / 6 * SPI.spotR; if (i * i + j * j > 36) continue; n++; const R = ribbonY(x); if (R.front && Math.abs(y - R.y) < SPI.band / 2 + 0.5) hit++; } return n ? hit / n : 0; }
  /* the oxygen the filament makes along its length, relative (1 = the best-lit, best-absorbed spot) */
  function engSource(p, x) {
    if (p.light === 'spot') return Math.exp(-Math.pow((x - p.spot) / (2 * SPI.spotR), 2)) * Math.min(1, spotOnRibbon(p.spot) / SPI.full);      // the oxygen spreads a little round the lit spot
    if (x < ENG.x0 || x > ENG.x1) return 0;
    if (p.light === 'white') return 0.66;
    if (p.light === 'green') return action(540);
    return action(nmAt(x));
  }
  const leafStarch = (o) => { if (!o.green) return 0; return (o.destarch ? 0 : 0.8) + (o.lit ? 0.22 * o.hours : 0); };
  const iodineBlue = s => 1 - Math.exp(-s / 0.35);

  /* ============================================================
     6. SIZE — agar cubes, and a cell that grows
     Alkali soaks into phenolphthalein agar as x = k√t, 2 mm in 10 minutes
     at 20 °C (a diffusion front: warmer, faster as D is). The share of a
     cube it has reached is 1 − (1 − 2x/L)³.
     A cell takes oxygen in through its surface (water outside holds 0.28 mol/m³
     at 20 °C; D = 2 × 10⁻⁹ m²/s) and uses it throughout (q, mol/m³/s). Its
     middle is fed only while R ≤ √(6DC/q) for a sphere, √(2DC/q) for a sheet's
     half-thickness, √(4DC/q) for a thread's radius; past that a core gets none.
     ============================================================ */
  const KF = 2 / Math.sqrt(600);
  const front = (t, Tc) => KF * Math.sqrt(Math.max(0, t) * ((Tc + 273.15) / 293.15 * eta(20) / eta(Tc)));
  const pinkFrac = (L_, x) => { const c = Math.max(0, L_ - 2 * x) / L_; return 1 - c * c * c; };
  const CUBES = [5, 10, 20, 30];
  const DOX = 2e-9, CS = 0.28;
  const DEMAND = {
    bacterium: { q: 1.7, name: 'a bacterium, growing fast', real: 1, realName: 'a real one: 1 µm' },
    busy: { q: 0.3, name: 'a muscle cell, working hard', real: 30, realName: 'a muscle fibre: 30 µm' },
    resting: { q: 0.02, name: 'a resting body cell', real: 8, realName: 'a body cell: 8 µm' },
    amoeba: { q: 0.005, name: 'an amoeba', real: 250, realName: 'Amoeba proteus: 250 µm' },
    egg: { q: 1.5e-4, name: 'a frog’s egg', real: 700, realName: 'a frog’s egg: 700 µm' }
  };
  const SHAPE_K = { sphere: 6, flat: 2, thread: 4 };
  const Rmax = (q, shape) => Math.sqrt((SHAPE_K[shape] || 6) * DOX * CS / q) * 1e6;
  /* the three shapes hold the same volume as a sphere of radius R: a disc ten times as wide as it is thick,
     or a thread forty radii long */
  function shapeOf(shape, R) {
    if (shape === 'flat') { const a = R * Math.cbrt(4 / 150); return { a, Rd: 5 * a, len: 10 * a, sa: (2 * Math.PI * 25 * a * a + 2 * Math.PI * 5 * a * 2 * a), vol: 4 / 3 * Math.PI * R * R * R }; }
    if (shape === 'thread') { const a = R / Math.cbrt(30); return { a, len: 40 * a, sa: 2 * Math.PI * a * 40 * a + 2 * Math.PI * a * a, vol: 4 / 3 * Math.PI * R * R * R }; }
    return { a: R, len: 2 * R, sa: 4 * Math.PI * R * R, vol: 4 / 3 * Math.PI * R * R * R };
  }
  /* the starving core: how far in from the surface oxygen reaches (µm), for each shape; and the profile */
  function coreOf(shape, a, q) {
    const Rm = Rmax(q, shape); if (a <= Rm) return 0;
    const A = a * 1e-6, D = DOX, f = r0 => shape === 'sphere' ? q * A * A / (6 * D) + q * r0 * r0 * r0 / (3 * D * A) - q * r0 * r0 / (2 * D) - CS
      : shape === 'thread' ? q / (4 * D) * (A * A - r0 * r0) - q * r0 * r0 / (2 * D) * Math.log(A / r0) - CS
        : q * Math.pow(A - r0, 2) / (2 * D) - CS;
    let lo = 1e-12, hi = A;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2 * 1e6;
  }
  /* oxygen, 0…1 of the water's, a fraction u of the way from the surface (0) to the middle (1) */
  function o2At(shape, a, q, u) {
    const A = a * 1e-6, r = A * (1 - u), r0 = coreOf(shape, a, q) * 1e-6, D = DOX;
    let c;
    if (shape === 'flat') { if (r0 > 0) { const del = A - r0, d = A - r; c = d >= del ? 0 : CS * Math.pow(1 - d / del, 2); } else c = CS - q * (A * A - r * r) / (2 * D); }
    else if (shape === 'thread') { if (r0 > 0) c = r <= r0 ? 0 : q / (4 * D) * (r * r - r0 * r0) - q * r0 * r0 / (2 * D) * Math.log(r / r0); else c = CS - q * (A * A - r * r) / (4 * D); }
    else { if (r0 > 0) c = r <= r0 ? 0 : q * r * r / (6 * D) + q * r0 * r0 * r0 / (3 * D * r) - q * r0 * r0 / (2 * D); else c = CS - q * (A * A - r * r) / (6 * D); }
    return clamp(c / CS, 0, 1);
  }
  const radiusOf = p => Math.pow(10, p.lr);
  function cellOf(p) {
    const R = radiusOf(p), D_ = DEMAND[p.demand] || DEMAND.busy, sh = shapeOf(p.shape, R), core = coreOf(p.shape, sh.a, D_.q);
    const coreVol = p.shape === 'sphere' ? Math.pow(core / sh.a, 3) : p.shape === 'thread' ? Math.pow(core / sh.a, 2) : core / sh.a;
    return { R, D: D_, sh, core, coreVol, rmax: Rmax(D_.q, p.shape), sav: sh.sa / sh.vol, centre: o2At(p.shape, sh.a, D_.q, 1), tDiff: Math.pow(sh.a * 1e-6, 2) / ((SHAPE_K[p.shape] || 6) * DOX) };
  }

  /* ============================================================
     SET-UPS AND PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'membrane', label: 'What gets through a membrane?', teaches: ['B2.1'] },
    { value: 'wall', label: 'What a wall is for', teaches: ['B2.2'] },
    { value: 'nucleus', label: 'Whose cap? The nucleus decides', teaches: ['B2.3'] },
    { value: 'mito', label: 'Cells that breathe', teaches: ['B2.4'] },
    { value: 'chloro', label: 'Where light makes food', teaches: ['B2.5'] },
    { value: 'size', label: 'Why cells are small', teaches: ['B2.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'membrane', seed: 1, lapse: 60,
    fill: 'starch', cIn: 0.55, bath: 'iodine', cOut: 0.5, temp: 20,
    cells: 'both', salt: 0.9, treat: 'fresh', obj: 40,
    op: 'graft', nuc: 'cren', stalk: 'med', age: 'mature', recut: true, pace: 2,
    org: 'peas', mass: 10, bathT: 22, koh: true, tissue: 'pea',
    cexp: 'bubbles', dist: 20, colour: 'white', bicarb: 0.2, waterT: 20, shield: true, light: 'spectrum', spot: 55, destarch: true, foil: true, hours: 6, stage: 'iodine',
    cut: false, lr: 2, demand: 'busy', shape: 'sphere'
  };
  const SETUP_DEFAULTS = { membrane: { lapse: 60 }, wall: { lapse: 10 }, nucleus: {}, mito: { lapse: 60 }, chloro: { lapse: 10 }, size: { lapse: 60 } };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  const HOMES = {
    membrane: { theta: -0.95, phi: 0.2, dist: 0.44, target: [0.0, 0, 0.07], fov: 0.72 },
    wall: { theta: -0.8, phi: 0.26, dist: 0.7, target: [0.0, -0.02, 0.06], fov: 0.72 },
    nucleus: { theta: -1.05, phi: 0.18, dist: 0.24, target: [0.0, 0.0, 0.035], fov: 0.72 },
    mito: { theta: -1.0, phi: 0.52, dist: 0.72, target: [-0.03, -0.03, -0.035], fov: 0.72 },
    chloro: { theta: -1.3, phi: 0.2, dist: 0.85, target: [-0.18, 0.0, 0.1], fov: 0.72 },
    size: { theta: -0.85, phi: 0.5, dist: 0.36, target: [0.0, 0.0, 0.01], fov: 0.72 }
  };
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    // a new set-up chosen from the list, the tabs or a link opens with its own pace; a preset brings its own
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    const idx = SETUPS.findIndex(s => s.value === p.setup);
    S._rng = rng(1000 + p.seed * 7919 + idx * 131);
    S.t = 0; S.ts = 0; S.hist = []; S._lastRec = -1; S.sim = null; S._slides = null; S._ver = 0;
    S.bag = null; S.onion = null; S.proto = null; S.rbc = null; S.pieces = null; S.day = 0; S.count = 0; S.bact = null; S.o2 = 0; S.o2dry = 0;
    if (p.setup === 'membrane') { S.bag = bagStart(p); record(S, true); }
    if (p.setup === 'wall') {
      S.onion = onionCells(p.seed); S.proto = protoCells(p.seed); S.rbc = rbcCells(p.seed);
      // the slide was mounted in the solution a moment ago: the cells start as they were, in their own sap and in blood plasma
      S.onion.forEach(cl => { cl.vol = walled(cl.pi, piOut(0.9)).v; cl.sap = p.treat === 'boiled' ? 0.4 : 1; });
      S.proto.forEach(cl => { cl.vol = Math.min(cl.burstAt * 0.95, freeProto(cl.pi, piOut(0.9))); });
      S.rbc.forEach(b => { b.V = rbcV(0.9, b.V0); });
    }
    if (p.setup === 'nucleus') { S.pieces = acetPieces(p.op, p.nuc, p.age, p.stalk); record(S, true); }
    if (p.setup === 'mito') record(S, true);
    if (p.setup === 'chloro' && p.cexp === 'engelmann') engSetup(S);
    if (!S.cam || S.camFor !== p.setup || S.camKey !== camKey(p)) { const h = HOMES[p.setup]; const tg = h.target.slice(); if (p.setup === 'chloro' && p.cexp === 'bubbles') tg[0] = -p.dist / 200; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist * (p.setup === 'chloro' && p.cexp !== 'bubbles' ? 0.75 : 1), target: tg, fov: h.fov }); S.cam.minDist = 0.15; S.cam.maxDist = 3; S.camFor = p.setup; S.camKey = camKey(p); }
  }
  const camKey = p => p.setup === 'chloro' ? p.cexp : '';
  function engSetup(S) {
    const r = S._rng, N = 560;
    S.bact = [];
    for (let i = 0; i < N; i++) { const near = r() < 0.7; S.bact.push({ x: (r() - 0.5) * ENG.span, y: near ? (r() - 0.5) * 240 : (r() - 0.5) * ENG.span, a: r() * TAU }); }
  }
  /* the history each plot draws from */
  function record(S, force) {
    const p = S.p;
    if (p.setup === 'membrane') { const B = S.bag, m = Math.floor(B.t / 30); if (!force && m === S._lastRec) return; S._lastRec = m; S.hist.push([B.t / 60, massPct(B), glucosePct(cOut(B, 'glucose')), cIn(B, 'iodine') * 1000, B.V, cIn(B, 'salt'), cOut(B, 'salt'), cIn(B, 'sucrose'), cOut(B, 'sucrose'), cIn(B, 'glucose')]); }
    if (p.setup === 'nucleus') { const m = Math.floor(S.day * 2); if (!force && m === S._lastRec) return; S._lastRec = m; S.hist.push([S.day].concat(S.pieces.map(pc => [pc.S.med, pc.S.cren]))); }
    if (p.setup === 'mito') { const m = Math.floor(S.ts / 60); if (!force && m === S._lastRec) return; S._lastRec = m; const R = respNow(S); S.hist.push([S.ts / 60, R.v1, R.v2, R.d]); }
    if (p.setup === 'chloro' && p.cexp === 'bubbles') { const m = Math.floor(S.ts / 15); if (!force && m === S._lastRec) return; S._lastRec = m; S.hist.push([S.ts / 60, S.count, waterAt(p, S.ts)]); }
  }
  const MAX_T = { membrane: 6 * 3600, wall: 3600, mito: 3600, chloro: 3600, size: 2 * 3600 };
  function step(S, dt) {
    const p = S.p, lapse = p.lapse || 1;
    S.t += dt;
    if (p.setup === 'membrane') {
      const B = S.bag;
      if (B.t < MAX_T.membrane) { let left = Math.min(dt * lapse, 60); while (left > 1e-9) { const h = Math.min(2, left); bagStep(B, h, p.temp); left -= h; } }
      S.ts = B.t; record(S);
      if (S.sim && CE()) CE().memStep(S.sim, memTargets(S), Math.min(dt, 0.05));
    } else if (p.setup === 'wall') {
      const h = Math.min(dt * lapse, 30);
      if (S.ts < MAX_T.wall) S.ts += h;
      const po = piOut(p.salt), kO = 1 - Math.exp(-h / ONION.tau), kP = 1 - Math.exp(-h / ONION.tauP), kR = 1 - Math.exp(-h / RBC.tau);
      S.onion.forEach(cl => {
        const eq = p.treat === 'boiled' ? 1 : walled(cl.pi, po).v;
        cl.vol += (eq - cl.vol) * kO;
        if (p.treat === 'boiled') cl.sap += (0.02 - cl.sap) * (1 - Math.exp(-h / 45));
      });
      S.proto.forEach(cl => { if (cl.burst) return; cl.vol += (freeProto(cl.pi, po) - cl.vol) * kP; if (cl.vol > cl.burstAt) cl.burst = true; cl.r = cl.r0 * Math.cbrt(cl.vol); });
      S.rbc.forEach(b => { if (b.lysed) return; b.V += (rbcV(p.salt, b.V0) - b.V) * kR; if (b.V > b.crit) b.lysed = true; });
      S._ver++;
    } else if (p.setup === 'nucleus') {
      const dd = Math.min(dt * p.pace, 2);
      if (S.day < 120) { let left = dd; while (left > 1e-9) { const h = Math.min(0.1, left); acetStep(S.pieces, h, p.recut); left -= h; S.day += h; } }
      record(S);
    } else if (p.setup === 'mito') {
      if (S.ts < MAX_T.mito) { const h = Math.min(MAX_T.mito - S.ts, dt * lapse); S.o2 += respRate(p.org, p.bathT) * p.mass * h / 3600; S.o2dry += respRate('dry', p.bathT) * DRY_G * h / 3600; S.ts += h; }
      record(S);
    } else if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') {
        const h = Math.min(dt * lapse, 30);
        if (S.ts < MAX_T.chloro) { S.ts += h; S.count += bubbles(p.dist, p.bicarb, waterAt(p, S.ts), p.colour) / 60 * h; }
        record(S);
      } else if (p.cexp === 'engelmann') { const h = Math.min(dt, 0.1) * ENG.speed; S.ts += h; engStep(S, h); }
    } else if (p.setup === 'size') {
      if (S.ts < MAX_T.size) S.ts = Math.min(MAX_T.size, S.ts + dt * lapse);
    }
  }
  /* aerotactic bacteria: a biased random walk up the oxygen, as fast as they swim; at rest, their density
     follows exp(κ·O₂) — gathered where the filament makes most */
  const ENG_O2 = (p, x, y) => engSource(p, x) * Math.exp(-Math.max(0, Math.abs(y) - (p.light === 'spot' ? SPI.W : 44) / 2) / ENG.lam);
  function engStep(S, dt) {
    const p = S.p, r = S._rng, Dm = 800, chi = 4 * Dm, h = 4;
    S.bact.forEach(b => {
      const gx = (ENG_O2(p, b.x + h, b.y) - ENG_O2(p, b.x - h, b.y)) / (2 * h), gy = (ENG_O2(p, b.x, b.y + h) - ENG_O2(p, b.x, b.y - h)) / (2 * h);
      const s = Math.sqrt(2 * Dm * dt), nx = (r() + r() + r() - 1.5) * 2 * s, ny = (r() + r() + r() - 1.5) * 2 * s;
      const dx = chi * gx * dt + nx, dy = chi * gy * dt + ny;
      b.x = clamp(b.x + dx, -ENG.span / 2, ENG.span / 2); b.y = clamp(b.y + dy, -ENG.span / 2, ENG.span / 2);
      if (Math.abs(dx) + Math.abs(dy) > 0.01) b.a = Math.atan2(dy, dx);
    });
  }
  /* bacteria near the filament, in each colour band */
  function engCounts(S) {
    const p = S.p, bands = [['violet–blue', 400, 490], ['green', 490, 570], ['yellow–orange', 570, 640], ['red', 640, 720]], out = bands.map(b => ({ name: b[0], lo: b[1], hi: b[2], n: 0 }));
    let near = 0;
    (S.bact || []).forEach(b => { if (Math.abs(b.y) > 60) return; near++; const nm = nmAt(b.x); if (b.x < ENG.x0 || b.x > ENG.x1) return; out.forEach(o => { if (nm >= o.lo && nm < o.hi) o.n++; }); });
    return { bands: out, near };
  }

  /* ---------- the membrane window: how many of each molecule on each side, how often they cross ---------- */
  const MCAP = { glucose: 9, sucrose: 8, salt: 12, iodine: 7 };
  function memTargets(S) {
    const B = S.bag, p = S.p, counts = { water: [22, 22] }, rates = {};
    const jv = clamp(B.Jv * 0.35, -4, 4);
    rates.water = [2.5 + Math.max(0, jv), 2.5 + Math.max(0, -jv)];
    ['glucose', 'sucrose', 'salt', 'iodine'].forEach(k => {
      const ref = Math.max(B.c0.in[k], B.c0.out[k]); if (!(ref > 0)) return;
      const ci = cIn(B, k) / ref, co = cOut(B, k) / ref;
      counts[k] = [MCAP[k] * ci, MCAP[k] * co];
      const v = 1.6 * Math.sqrt(SOLUTES[k].P / 1.5e-6) * (p.lapse >= 60 ? 1 : 0.5);
      rates[k] = [v * co, v * ci];
    });
    return { counts, rates, starch: p.fill === 'starch' ? 3 : 0 };
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtT = s => s < 3600 ? (s / 60).toFixed(s < 600 ? 1 : 0) + ' min' : (s / 3600).toFixed(2) + ' h';
  const fmtUm = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 2) + ' mm' : v >= 10 ? v.toFixed(0) + ' µm' : v >= 1 ? v.toFixed(1) + ' µm' : (v * 1000).toFixed(0) + ' nm';
  /* what the right of the stage holds: one circle, two, or a panel */
  function panelMode(p) {
    if (p.setup === 'wall') return p.cells === 'both' ? 'two' : 'circle';
    if (p.setup === 'nucleus') return 'rect';
    if (p.setup === 'chloro' && p.cexp === 'leaf') return 'rect';
    return 'circle';
  }
  function lay(g, mode) {
    const W = g.w, H = g.h, HD = 58, FT = 26, narrow = W < 640;
    if (narrow) {
      // a phone: the card chips take a row under the header, the scale bar and the hint the foot
      if (mode === 'two') { const R = Math.max(60, Math.min((W - 44) / 4, (H - HD - 44 - 78) / 2)); return { narrow, mode, R, c: [[W / 2 - R - 6, HD + 38 + R], [W / 2 + R + 6, HD + 38 + R]], W, H }; }
      if (mode === 'rect') { const pw = W - 20, ph = Math.max(200, H - HD - 110); return { narrow, mode, x: 10, y: HD + 38, w: pw, h: ph, W, H }; }
      const R = Math.max(70, Math.min((W - 34) / 2, (H - HD - 44 - 78) / 2)); return { narrow, mode, R, c: [[W / 2, HD + 38 + R]], W, H };
    }
    if (mode === 'two') { const R = Math.max(80, Math.min((H - HD - FT - 58) / 2, (W * 0.62 - 70) / 4)); return { narrow, mode, R, c: [[W - 3 * R - 48, HD + 18 + R], [W - R - 22, HD + 18 + R]], W, H, bw: W - 4 * R - 100 }; }
    if (mode === 'rect') { const pw = Math.min(W * 0.52, 600), ph = H - HD - FT - 36; return { narrow, mode, x: W - pw - 16, y: HD + 12, w: pw, h: ph, W, H, bw: W - pw - 40 }; }
    const R = Math.max(90, Math.min((H - HD - FT - 58) / 2, W * 0.28));
    return { narrow, mode, R, c: [[W - R - 22, HD + 18 + R]], W, H, bw: W - 2 * R - 60 };
  }

  /* ---------- the bench ---------- */
  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, C = CE(), M = MI(), bw = Ly.bw;
    if (!cam || !C || bw < 160) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 20, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    MEAS.bench(F, -0.95, 0.6, -0.36, 0.38, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.95, 0.6, 0.38, 0, 0.75);
    const lab = [];
    if (p.setup === 'membrane') benchMembrane(S, F, C, lab);
    else if (p.setup === 'wall') benchWall(S, F, C, M, lab);
    else if (p.setup === 'nucleus') benchNucleus(S, F, C, lab);
    else if (p.setup === 'mito') benchMito(S, F, C, lab);
    else if (p.setup === 'chloro') benchChloro(S, F, C, M, lab);
    else if (p.setup === 'size') benchSize(S, F, C, lab);
    F.render();
    if (g.labels && bw > 260) lab.forEach(([at, text, dx, dy]) => {
      const q = cam.project(at); if (!q.ok || q.y + dy < 70 || q.y + dy > g.h - 30 || q.x < 0 || q.x > bw) return;      /* never under the header or the hint */
      ctx.save(); ctx.font = mono(10, 600);
      // the name goes on whichever side of its leader has room, and is shortened only if neither has
      const tw = ctx.measureText(text).width, ex = q.x + dx; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > bw - 6) left = true;
      const room = left ? ex - 9 : bw - 6 - ex - 3, t = kit().fitText(ctx, text, Math.max(40, room));
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, q.y + dy); ctx.stroke();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
      ctx.strokeText(t, ex + (left ? -3 : 3), q.y + dy); ctx.fillStyle = '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), q.y + dy); ctx.restore();
    });
    ctx.restore();
  }
  function bathTint(p, B) {
    if (p.bath === 'iodine') return RXmix('#E4EEF2', '#C07A22', clamp(cOut(B, 'iodine') / 0.001, 0, 1) * 0.85);
    if (p.bath === 'sucrose') return '#DDEBF0';
    return '#CFE6F2';
  }
  function bagTint(p, B) {
    if (p.fill === 'starch') return RXmix('#ECEAE0', '#1C2046', boundOf(B));
    return p.fill === 'water' ? '#BCD2DA' : '#B4CAD2';            // clear solutions: the tubing's own grey-blue cellophane shows
  }
  function benchMembrane(S, F, C, lab) {
    const p = S.p, B = S.bag, H = 0.13, lv = 0.108;
    MEAS.beaker(F, [0, 0, 0], 0.034, H, lv, { tint: bathTint(p, B) });
    C.glassRod(F, [-0.058, 0, H + 0.005], [0.058, 0, H + 0.005]);
    const r = Math.sqrt(B.V * 1e-6 / (Math.PI * TUBE.len / 100)), slack = clamp(1 - (B.V / B.Vmax - 0.6) / 0.37, 0, 1);
    C.viskingBag(F, [0, 0, H + 0.005], { len: 0.082, r, fill: bagTint(p, B), slack, liquid: { z: lv, tint: bathTint(p, B), alpha: 0.26 } });
    lab.push([[0, -0.006, 0.05], 'Visking tubing bag, ' + B.V.toFixed(1) + ' mL', -70, 60], [[0.034, 0, 0.12], '200 mL ' + (p.bath === 'iodine' ? 'iodine solution' : p.bath === 'sucrose' ? 'sucrose ' + p.cOut.toFixed(2) + ' M' : 'water'), 40, -26]);
    // the test that shows what came out
    if (p.fill === 'starch') { const b = benedict(glucosePct(cOut(B, 'glucose'))); C.testTube(F, [0.11, -0.04, 0], { level: 0.45, liquid: b[2], label: 'Benedict’s', size: 9.5 }); C.smallBottle(F, [0.12, 0.07, 0], 'Iodine', { glass: '#5A3A1A' }); lab.push([[0.11, -0.04, 0.04], 'the beaker water, boiled with Benedict’s', 36, 20]); }
    else if (p.fill === 'salt') { const cl = clamp(cOut(B, 'salt') / 0.02, 0, 1); C.testTube(F, [0.11, -0.04, 0], { level: 0.45, liquid: '#F2F2EE', cloud: cl, label: 'silver nitrate', size: 9.5 }); lab.push([[0.11, -0.04, 0.04], cl > 0.1 ? 'white cloud: salt has come out' : 'clear: no salt out yet', 36, 20]); }
    // a balance, and the bag's mass as last weighed
    R3.box(F, [-0.1, 0.05, 0.012], [0.09, 0.08, 0.024], '#DDE2E8', { ambient: 0.5 });
    R3.cylinder(F, [-0.1, 0.05, 0.024], [-0.1, 0.05, 0.028], 0.032, '#B8C0CA', { segments: 24, shadow: false });
    F.push([-0.1, 0.012, 0.012], () => { const q = F.cam.project([-0.1, 0.009, 0.012]); if (!q.ok) return; const ctx = F.ctx; ctx.save(); ctx.fillStyle = '#10202A'; ctx.fillRect(q.x - 30, q.y - 8, 60, 16); ctx.fillStyle = '#7CF0C0'; ctx.font = mono(11, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(bagMass(B).toFixed(2) + ' g', q.x, q.y); ctx.restore(); }, -0.05);
    lab.push([[-0.1, 0.009, 0.012], 'weighed as it goes', -20, 44]);
  }
  const TUBES = [0, 0.3, 0.45, 0.6, 0.9, 3];
  function benchWall(S, F, C, M, lab) {
    const p = S.p;
    M.compound(F, [0.13, 0.07, 0], { obj: p.obj === 10 ? 10 : 40, iris: 0.6, lamp: 0.7, focus: 0, stage: [0, 0], slide: { tint: p.cells === 'blood' ? '#D07888' : '#B0487A', r: 0.005 }, oil: false });
    const near = TUBES.reduce((u, v) => Math.abs(v - p.salt) < Math.abs(u - p.salt) ? v : u, TUBES[0]);
    C.tubeRack(F, [-0.07, -0.02, 0], TUBES.map(s => ({ liquid: '#B81E2E', cloud: 1 - fracLysed(s), label: s === near ? s + ' %' : null, sel: true, level: 0.55, size: 10 })), { pitch: 0.03 });
    C.tile(F, [-0.1, -0.16, 0], 0.12, 0.08);
    C.redOnion(F, [-0.11, -0.16, 0.005], 0.026);
    M.dropper(F, [0.2, -0.1, 0], 'Salt ' + p.salt.toFixed(2) + ' %', '#E8F0F4');
    lab.push([[-0.07, -0.045, 0.03], 'blood in 0 · 0.3 · 0.45 · 0.6 · 0.9 · 3 % salt: cloudy = whole, clear = burst', -10, 70], [[-0.11, -0.16, 0.04], 'red onion', -30, 20]);
  }
  function benchNucleus(S, F, C, lab) {
    const pcs = S.pieces || [], n = pcs.length;
    C.tank(F, [0, 0, 0], 0.17, 0.08, 0.075, { sand: '#B8A882', water: '#7FB8C4' });
    pcs.forEach((pc, i) => {
      const x = n > 1 ? -0.055 + i * 0.055 : 0, base = [x, 0.005, 0.006];
      if (pc.kind === 'cap') { if (pc.alive) C.acetabularia(F, [x, 0.01, 0.006], { stalk: 0.003, cap: { f: pc.cap.f, grow: 1 }, dead: pc.age > 6 }); return; }
      C.acetabularia(F, base, { stalk: Math.max(0.003, pc.L / 100), cap: pc.cap, nucleus: pc.nuclei.length > 0, nucleusCol: pc.nuclei.length ? CE().SP_COL[pc.nuclei[0]] : null, graft: pc.graft != null ? pc.graft / 100 : null, hairs: !pc.cap && pc.alive, cut: pc.cut, dead: !pc.alive });
    });
    C.tile(F, [0.14, -0.08, 0], 0.09, 0.07); C.scalpel(F, [0.11, -0.09, 0.006], 0.3);
    lab.push([[0.0, -0.04, 0.07], 'Acetabularia in seawater, 4–5 cm tall: one cell each', -30, -30]);
  }
  function benchMito(S, F, C, lab) {
    const p = S.p, Rn = respNow(S), v1 = Rn.v1, v2 = Rn.v2, v3 = Rn.d;
    const wrap = v => (v % 0.95);
    C.respirometer(F, [0, 0, 0], { T: p.bathT, vials: [{ kind: p.org, read: wrap(v1), label: RESP.org[p.org].name + ', ' + p.mass + ' g', koh: p.koh, sel: true }, { kind: 'dry', read: wrap(v2), label: 'dry peas + beads', koh: p.koh, mixBeads: true }, { kind: 'beads', read: wrap(v3), label: 'glass beads', koh: p.koh }] });
    lab.push([[0.16, -0.07, 0.02], '1 mL pipettes: the dye moves in as oxygen is used', 20, 30], [[-0.17, 0.07, 0.02], p.koh ? 'KOH on cotton wool takes up CO₂' : 'no KOH: CO₂ stays in the air', -20, -40]);
  }
  function benchChloro(S, F, C, M, lab) {
    const p = S.p;
    if (p.cexp === 'bubbles') {
      const rate = bubbles(p.dist, p.bicarb, waterAt(p, S.ts), p.colour);
      C.elodeaRig(F, [0, 0, 0], { d: p.dist / 100, rate, t: S.t * (p.lapse > 1 ? Math.min(p.lapse, 10) : 1), col: LAMP[p.colour], shield: p.shield, power: 1 });
      lab.push([[0, 0, 0.13], 'Elodea, cut end up, in ' + (p.bicarb > 0 ? p.bicarb.toFixed(1) + ' % bicarbonate' : 'tap water'), 40, -30], [[-p.dist / 100, 0, 0.09], (p.colour === 'white' ? 'lamp' : p.colour + ' LED') + ' at ' + p.dist + ' cm', -20, -40]);
      if (p.shield) lab.push([[-0.075, 0, 0.07], 'heat shield: a beaker of water', -30, 30]);
    } else if (p.cexp === 'engelmann') {
      M.compound(F, [0.02, 0.03, 0], { obj: 10, iris: 0.5, lamp: 0.9, focus: 0, stage: [0, 0], slide: { tint: '#78B060', r: 0.005 } });
      // Engelmann's prism under the stage, splitting the lamp's light into a spectrum
      MEAS.extrude(F, [[-0.012, -0.008], [0.012, -0.008], [0, 0.013]], { at: [0.02, -0.02, 0.05], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, 0.02, '#BFE6F2', { alpha: 0.6, ambient: 0.7 });
      lab.push([[0.02, -0.02, 0.06], p.light === 'spectrum' ? 'a prism spreads the light into a spectrum' : p.light === 'spot' ? 'a tiny spot of light' : p.light === 'green' ? 'green light only' : 'white light', -40, 30]);
    } else {
      plant(F, [-0.12, 0.06, 0], p);
      MEAS.beaker(F, [0.08, 0.06, 0], 0.045, 0.1, 0.07, { tint: '#DDE8EC' });
      MEAS.beaker(F, [0.08, 0.06, 0.004], 0.018, 0.09, 0.05, { tint: p.stage === 'ethanol' || p.stage === 'iodine' ? '#9AC060' : '#E8ECE0' });
      C.tile(F, [0.1, -0.12, 0], 0.13, 0.1);
      const cv = leafCanvas(p); if (cv) R3.texPlane(F, [0.1, -0.12, 0.0062], [0.03, 0, 0], [0, 0.04, 0], cv, { grid: 3 });
      C.smallBottle(F, [0.19, -0.02, 0], 'Iodine');
      lab.push([[-0.12, 0.06, 0.2], p.destarch ? 'two days in the dark first' : 'straight from the windowsill', -30, -26], [[0.08, 0.06, 0.1], 'ethanol in a hot-water bath', 30, -30], [[0.1, -0.12, 0.01], 'the leaf, tested', 30, 26]);
    }
  }
  /* a potted variegated plant, one leaf with a strip of foil across it */
  let leafCv = null, leafKey = '';
  function leafCanvas(p, stage) {
    const C = CE(); if (!C || typeof document === 'undefined') return null;
    const st = stage || p.stage, key = [st, p.foil, p.destarch, p.hours].join('|');
    if (!stage && leafCv && leafKey === key) return leafCv;
    const c = document.createElement('canvas'); c.width = 180; c.height = 240; const x = c.getContext('2d');
    C.leafDraw(x, 90, 110, 90, { foil: p.foil, blue: leafBlue(p) }, st);
    if (!stage) { leafCv = c; leafKey = key; }
    return c;
  }
  let plantLeaf = null;
  function plant(F, at, p) {
    const C = CE();
    R3.cylinder(F, at, [at[0], at[1], at[2] + 0.07], 0.05, '#B4583A', { segments: 24, ambient: 0.45 });
    R3.cylinder(F, [at[0], at[1], at[2] + 0.07], [at[0], at[1], at[2] + 0.074], 0.046, '#4A3424', { segments: 24, shadow: false });
    if (!plantLeaf && typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = 120; c.height = 160; C.leafDraw(c.getContext('2d'), 60, 74, 60, { foil: false }, 'fresh'); plantLeaf = c; }
    const foilLeaf = leafCanvasFresh(p);
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * TAU + 0.3, h = 0.12 + (k % 3) * 0.03, top = [at[0] + Math.cos(a) * 0.04, at[1] + Math.sin(a) * 0.04, at[2] + h];
      R3.cylinder(F, [at[0], at[1], at[2] + 0.07], top, 0.0022, '#5A8A3A', { segments: 6, shadow: false });
      const img = k === 2 && p.foil ? foilLeaf : plantLeaf;
      if (img) R3.texPlane(F, [top[0] + Math.cos(a) * 0.03, top[1] + Math.sin(a) * 0.03, top[2] + 0.012], [Math.cos(a + Math.PI / 2) * 0.022, Math.sin(a + Math.PI / 2) * 0.022, 0], [Math.cos(a) * 0.028, Math.sin(a) * 0.028, 0.018], img, { grid: 2 });
    }
  }
  let freshFoil = null;
  function leafCanvasFresh(p) { if (!freshFoil && typeof document !== 'undefined' && CE()) { const c = document.createElement('canvas'); c.width = 120; c.height = 160; CE().leafDraw(c.getContext('2d'), 60, 74, 60, { foil: true }, 'fresh'); freshFoil = c; } return freshFoil; }
  function benchSize(S, F, C, lab) {
    const p = S.p, x = front(S.ts, 20) / 1000;
    if (!p.cut) {
      C.dish(F, [0, 0, 0], 0.2, 0.1, { liquid: '#EEF2F6' });
      CUBES.forEach((mm, i) => C.agarCube(F, [-0.07 + i * 0.045, 0, 0.001], mm / 1000, x, {}));
      lab.push([[0, -0.05, 0.012], 'agar with indicator, in dilute alkali', -40, 30]);
    } else {
      C.tile(F, [0, 0, 0], 0.22, 0.11);
      CUBES.forEach((mm, i) => C.agarCube(F, [-0.075 + i * 0.048, 0, 0.005], mm / 1000, x, { cut: true }));
      C.scalpel(F, [0.05, -0.07, 0.006], 2.9);
      lab.push([[0, -0.055, 0.012], 'cut open: pink where the alkali has reached', -40, 30]);
    }
    BENCH.rule(F, [-0.11, 0.08, 0.0005], [1, 0, 0], 0.22, { up: [0, 0, 1] });
    CUBES.forEach((mm, i) => lab.push([[(p.cut ? -0.075 + i * 0.048 : -0.07 + i * 0.045), 0, mm / 1000 + 0.004], mm + ' mm', 0, -16]));
  }
  const leafBlue = p => ({ lit: iodineBlue(leafStarch({ green: true, lit: true, hours: p.hours, destarch: p.destarch })), foil: iodineBlue(leafStarch({ green: true, lit: false, hours: p.hours, destarch: p.destarch })) });

  /* ---------- the panels on the right ---------- */
  function drawPanel(S, g, Ly) {
    const p = S.p, ctx = g.ctx, C = CE(), M = MI();
    if (!C) return;
    if (p.setup === 'membrane') {
      const [cx, cy] = Ly.c[0];
      if (!S.sim) { S.sim = C.memSim(p.seed * 13 + 1); for (let i = 0; i < 30; i++) C.memStep(S.sim, memTargets(S), 0.05); }
      C.memDraw(ctx, cx, cy, Ly.R, S.sim, { inTint: RXmix('#18223A', bagTint(p, S.bag), 0.3), outTint: RXmix('#18223A', bathTint(p, S.bag), 0.4), bound: p.fill === 'starch' ? boundOf(S.bag) : 0, labels: g.labels });
      rim(ctx, Ly, 0, 'the bag’s wall, 12 nm across', 'to size · slowed 10⁹ times');
    } else if (p.setup === 'wall') wallViews(S, g, Ly);
    else if (p.setup === 'nucleus') {
      C.acetabView(ctx, Ly.x, Ly.y, Ly.w, Ly.h, S.pieces.map(pc => Object.assign({}, pc)), { t: S.t });
      ctx.save(); ctx.font = mono(10.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('day ' + S.day.toFixed(0), Ly.x + Ly.w - 12, Ly.y + 10); ctx.restore();
    } else if (p.setup === 'mito') {
      const [cx, cy] = Ly.c[0], T = TISSUE[p.tissue] || TISSUE.pea;
      const r = C.tem(ctx, cx, cy, Ly.R, p.tissue, p.seed);
      rim(ctx, Ly, 0, T.short + ' · electron microscope', 'mitochondria ' + Math.round(T.mito * 100) + ' % of the cell');
      if (g.labels && Ly.R > 120) temLabels(S, g, Ly, r);
    } else if (p.setup === 'chloro') {
      if (p.cexp === 'leaf') { C.leafPanel(ctx, Ly.x, Ly.y, Ly.w, Ly.h, { stage: p.stage, foil: p.foil, blue: leafBlue(p) }); return; }
      if (!M) return;
      const [cx, cy] = Ly.c[0];
      if (!S._slides) S._slides = {};
      if (p.cexp === 'bubbles') {
        const sl = S._slides.elodea || (S._slides.elodea = M.slide('elodea', p.seed));
        const O = scope(40);
        M.view(ctx, cx, cy, Ly.R, { slide: sl, dyn: [], at: [0, 0], fov: O.field, invert: true, focus: 0, sigma: O.sigma, lamp: '#FFF6E6', bright: 1, haze: 0, pc: 0.4, t: S.t, mount: '#FFFFFF', optKey: 'el' });
        rim(ctx, Ly, 0, 'an Elodea leaf at 400×', 'the chloroplasts, where the oxygen comes from');
      } else {
        const sl = engSlide(S), O = { field: ENG.span, sigma: dz => Math.sqrt(0.6 * 0.6 + Math.pow(dz * 0.12, 2)) };
        const mask = p.light === 'spot' ? { kind: 'lightMask', x: 0, y: 0, mode: 'spot', sx: p.spot, sy: 0, sr: SPI.spotR, z: 0, h: 1e4 } : { kind: 'lightMask', x: 0, y: 0, mode: p.light === 'spectrum' ? 'spectrum' : p.light === 'green' ? 'green' : 'white', nmAt, colAt: specCol, z: 0, h: 1e4 };
        const dyn = [{ kind: 'aeroBact', x: 0, y: 0, b: S.bact || [], z: 0, h: 10 }];
        if (p.light !== 'white') dyn.push(mask);
        M.view(ctx, cx, cy, Ly.R, { slide: sl, dyn, at: [p.light === 'spot' ? p.spot * 0.6 : 0, 0], fov: p.light === 'spot' ? 300 : O.field, invert: false, focus: 0, sigma: O.sigma, lamp: '#FFFFFF', bright: 1, haze: 0, pc: 0.5, t: S.t, mount: '#FFFFFF', optKey: 'eng' + p.light });
        rim(ctx, Ly, 0, p.light === 'spot' ? 'Spirogyra, a spot of light' : 'Cladophora in ' + (p.light === 'spectrum' ? 'a spectrum' : p.light + ' light'), (p.light === 'spot' ? '300 µm across' : '0.9 mm across') + ' · 4× real time');
        if (p.light === 'spectrum' && g.labels) specLabels(ctx, Ly);
      }
    } else if (p.setup === 'size') {
      const [cx, cy] = Ly.c[0], c = cellOf(p), sh = c.sh, q = c.D.q;
      const span = p.shape === 'sphere' ? sh.a * 2.4 : p.shape === 'flat' ? sh.len * 1.18 : sh.a * 14;
      C.o2Cell(ctx, cx, cy, Ly.R, { shape: p.shape, R: sh.a, a: sh.a, len: sh.len, span, c: u => o2At(p.shape, sh.a, q, u), core: c.core / sh.a, label: c.core > 0 ? 'its middle starves' : 'oxygen reaches the middle' });
      rim(ctx, Ly, 0, (p.shape === 'sphere' ? 'a round cell' : p.shape === 'flat' ? 'a flat cell, edge on' : 'a thread-like cell') + ', ' + fmtUm(2 * c.R) + ' across as a ball', 'oxygen: pale where there is plenty, dark where none');
    }
  }
  function rim(ctx, Ly, i, left, right) {
    const [cx, cy] = Ly.c[i], R = Ly.R;
    ctx.save(); ctx.font = mono(Ly.narrow ? 9.5 : 10.5, 600); ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillStyle = '#EAF1FF'; ctx.fillText(kit().fitText(ctx, left, R * (right ? 1.2 : 2)), cx - R, cy - R - 8);
    if (right && !Ly.narrow) { ctx.textAlign = 'right'; ctx.fillStyle = '#8FA3C0'; ctx.fillText(kit().fitText(ctx, right, R * 0.8), cx + R, cy - R - 8); }
    ctx.restore();
  }
  function specLabels(ctx, Ly) {
    const [cx, cy] = Ly.c[0], R = Ly.R;
    ctx.save(); ctx.font = mono(9.5, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [[450, 'blue'], [530, 'green'], [590, 'yellow'], [670, 'red']].forEach(([nm, t]) => { const x = cx + ((nm - ENG.nm0) / (ENG.nm1 - ENG.nm0) * (ENG.x1 - ENG.x0) + ENG.x0) / ENG.span * 2 * R; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.8)'; ctx.strokeText(t + ' ' + nm, x, cy + R * 0.72); ctx.fillStyle = '#FFFFFF'; ctx.fillText(t + ' ' + nm, x, cy + R * 0.72); });
    ctx.restore();
  }
  /* the Engelmann slides: Cladophora for the spectrum, Spirogyra for the spot */
  function engSlide(S) {
    const p = S.p, M = MI(), key = p.light === 'spot' ? 'spi' : 'cla';
    if (S._slides[key]) return S._slides[key];
    const r = rng(p.seed * 7 + (key === 'spi' ? 3 : 1)), cells = [];
    let item;
    if (key === 'cla') {
      for (let i = -6; i < 6; i++) { const x0 = i * 150, net = [], pyr = []; for (let q = 0; q < 70; q++) net.push([x0 + 5 + r() * 140, -19 + r() * 38, 2.5 + r() * 3, 1.6 + r() * 2, r() * 3]); for (let q = 0; q < 9; q++) pyr.push([x0 + 8 + r() * 134, -14 + r() * 28]); cells.push({ x0, x1: x0 + 150, net, pyr }); }
      item = { kind: 'cladophora', x: 0, y: 0, r: 2000, w: 44, cells, z: 0, h: 44 };
    } else {
      for (let i = -5; i < 5; i++) { const x0 = i * SPI.L, pyr = []; for (let q = 0; q < 12; q++) { const u = (q + 0.5) / 12, th = u * SPI.turns * TAU; if (Math.cos(th) > 0) pyr.push([x0 + 3 + u * (SPI.L - 6), Math.sin(th) * (SPI.W / 2 - 3.5)]); } cells.push({ x0, x1: x0 + SPI.L, turns: SPI.turns, ph: 0, pyr }); }
      item = { kind: 'spirogyra', x: 0, y: 0, r: 2000, w: SPI.W, cells, z: 0, h: 36 };
    }
    const items = [item];
    S._slides[key] = { kind: key, items, query: () => items, version: 1, mount: '#FFFFFF' };
    return S._slides[key];
  }
  /* the two microscopes' views: red onion (or its protoplasts) and blood, in the same salt */
  function wallViews(S, g, Ly) {
    const p = S.p, M = MI(), ctx = g.ctx; if (!M) return;
    const which = p.cells === 'both' ? ['onion', 'blood'] : [p.cells];
    which.forEach((w, i) => {
      const [cx, cy] = Ly.c[i];
      const cellsItem = w === 'onion' ? (p.treat === 'noWall' ? { kind: 'redOnion', x: 0, y: 0, r: 3000, cells: S.proto.map(c => ({ free: true, x: c.x, y: c.y, r: c.r, sap: c.sap, vol: c.vol, burst: c.burst, a: c.a, tone: c.tone })), z: 0, h: 60 }
        : { kind: 'redOnion', x: 0, y: 0, r: 3000, cells: S.onion.map(c => ({ v: c.v, cx: c.cx, cy: c.cy, w: c.w, h: c.h, vol: c.vol, sap: c.sap, off: c.off, tone: c.tone, coag: p.treat === 'boiled' ? c.coagList : null })), z: 0, h: 40 })
        : { kind: 'rbcWet', x: 0, y: 0, r: 3000, cells: S.rbc, z: 0, h: 6 };
      const O = scope(w === 'blood' ? 100 : p.obj), fov = O.field;
      const mount = w === 'onion' && p.treat === 'boiled' ? '#F6E4EE' : '#FFFFFF';
      M.view(ctx, cx, cy, Ly.R, { slide: null, dyn: [cellsItem], at: [0, 0], fov, invert: true, focus: 0, sigma: O.sigma, lamp: '#FFF6E6', bright: 1, haze: 0, pc: O.pc, t: S.t, mount, optKey: w });
      rim(ctx, Ly, i, (w === 'onion' ? (p.treat === 'noWall' ? 'onion protoplasts, walls digested' : p.treat === 'boiled' ? 'red onion, boiled first' : 'red onion skin') : 'red blood cells, oil immersion') + ' · ' + O.M + '×', which.length > 1 ? '' : 'in ' + p.salt.toFixed(2) + ' % salt');
    });
  }
  function temLabels(S, g, Ly, r) {
    const p = S.p, ctx = g.ctx, [cx, cy] = Ly.c[0], R = Ly.R;
    const T = CE().TISSUE_ART[p.tissue] || {};
    const tags = [];
    if (T.fib) tags.push(['myofibrils: the parts that pull', -0.2, -0.46], ['mitochondria between them', 0.1, 0.1]);
    else if (T.lipid) tags.push(['a single drop of fat', 0.1, 0.05], ['mitochondrion', -0.82, -0.76]);
    else if (T.rbc) tags.push(['haemoglobin, and nothing else', -0.1, 0]);
    else { if (T.wall) tags.push(['cell wall', -0.9, -0.2]); if (T.nucleus) tags.push(['nucleus', T.wall ? 0.24 : 0.44, T.wall ? 0.12 : 0.36]); if (T.starch) tags.push(['starch grains', 0.0, -0.4]); if (T.chloro) tags.push(['chloroplast', -0.3, -0.1]); if (T.glyco) tags.push(['glycogen', -0.5, 0.5]); tags.push(['mitochondria', -0.4, 0.62]); }
    ctx.save(); ctx.font = mono(10, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    tags.forEach(([t, u, v]) => { const x = cx + u * R, y = cy + v * R; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,.88)'; ctx.strokeText(t, x, y); ctx.fillStyle = '#10141C'; ctx.fillText(t, x, y); });
    ctx.restore();
  }

  /* ---------- the stage ---------- */
  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !CE()) return;
    const Ly = lay(g, panelMode(p));
    if (!Ly.narrow) drawBench(S, g, Ly);
    drawPanel(S, g, Ly);
    cards(S, g, Ly);
    const H = headerOf(S);
    K.header(g, H[0], H[1], H[2]);
  }

  /* ============================================================
     CARDS — what the lab has worked out, beside what it shows
     ============================================================ */
  function drawRows(ctx, x, y, w, rows, o) {
    o = o || {};
    rows.forEach((row, i) => {
      const yy = y + i * (o.lh || 15);
      row.forEach((cell, j) => {
        const c = typeof cell === 'object' ? cell : { t: String(cell) };
        const cx = x + (o.cols ? o.cols[j] * w : 0);
        ctx.fillStyle = c.col || (j === 0 ? '#DCE6F6' : '#AFC0D8'); ctx.font = c.bold ? mono(10.5, 700) : mono(10, 500);
        ctx.textAlign = 'left';
        ctx.fillText(kit().fitText(ctx, c.t, (o.widths ? o.widths[j] : w) - 4), cx, yy);
      });
    });
  }
  function cards(S, g, Ly) {
    const p = S.p, K = kit(), ctx = g.ctx;
    const wideW = Ly.narrow ? 0 : Math.min(318, (Ly.bw || 320) - 10);
    const box = (title, rows, o) => {
      o = o || {};
      const h = 30 + rows.length * 15 + 4, r = K.cardSlot(g, S, title, wideW, { x: 10, y: g.h - 26 - h - 6 });
      if (!r) return;
      K.card(ctx, r.x, r.y, r.w, h);
      ctx.save(); ctx.textBaseline = 'top'; ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left';
      ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
      drawRows(ctx, r.x + 10, r.y + 28, r.w - 20, rows, o);
      ctx.restore();
    };
    const two = [0, 0.4], tw = w => [0.4 * w, 0.6 * w];
    if (p.setup === 'membrane') {
      const B = S.bag, rows = [];
      const moved = (k, what) => { const a = B.c0.in[k], b = B.c0.out[k]; if (!(a > 0) && !(b > 0)) return; const ci = cIn(B, k), co = cOut(B, k); rows.push([{ t: what, bold: true }, { t: a > b ? 'out: ' + (co * 1000).toFixed(co < 0.01 ? 1 : 0) + ' mM outside now' : 'in: ' + (ci * 1000).toFixed(ci < 0.01 ? 2 : 0) + ' mM inside now', col: '#9FE0B8' }]); };
      rows.push([{ t: 'water', bold: true }, { t: (B.Jv >= 0 ? 'in, ' : 'out, ') + Math.abs(B.Jv).toFixed(2) + ' mL an hour', col: '#8FD4FA' }]);
      moved('glucose', 'glucose'); moved('sucrose', 'sucrose'); moved('salt', 'salt'); moved('iodine', 'iodine');
      if (p.fill === 'starch') rows.push([{ t: 'starch', bold: true }, { t: 'stays in: none in the beaker', col: '#FF8A80' }]);
      rows.push([{ t: 'the bag', bold: true }, { t: (massPct(B) >= 0 ? '+' : '') + massPct(B).toFixed(1) + ' % mass' + (B.P > 1000 ? ' · tight, ' + (B.P / 1000).toFixed(0) + ' kPa' : ''), col: '#FFD66B' }]);
      box('What crossed the membrane', rows, { cols: two, widths: tw(wideW - 20) });
    } else if (p.setup === 'wall') {
      const W = wallStats(S);
      const rows = [[{ t: '', bold: true }, { t: 'onion (a wall)', bold: true, col: '#E08ABE' }, { t: 'red cell (none)', bold: true, col: '#FFB0A0' }],
        ['water', W.onionDir, W.rbcDir],
        ['volume', W.onionVol, W.rbcVol],
        ['pressure', W.turgor, 'none: no wall'],
        ['seen now', W.onionSeen, W.rbcSeen]];
      box('The same salt, with and without a wall', rows, { cols: [0, 0.26, 0.63], widths: [0.26 * (wideW - 20), 0.37 * (wideW - 20), 0.37 * (wideW - 20)] });
    } else if (p.setup === 'nucleus') {
      const rows = S.pieces.map(pc => [{ t: pc.name.replace(/^a |^the |^one /, ''), bold: true }, { t: pc.kind === 'cap' ? (pc.alive ? 'wilting: nothing to renew it' : 'dead') : pc.caps.length ? pc.caps.map(c => Math.round(c.f * 100) + ' %').join(' → ') + ' crenulata' : pc.alive ? 'no cap yet' : 'died with no cap', col: pc.alive ? '#AFC0D8' : '#FF8A80' }]);
      rows.push([{ t: 'nucleus', bold: true }, { t: p.op === 'two' ? 'one of each kind' : SPN[p.nuc], col: p.op === 'two' ? '#DCE6F6' : CE().SP_COL[p.nuc] }]);
      box('Each cap, in order (0 % smooth … 100 % crenulate)', rows, { cols: [0, 0.34], widths: [0.34 * (wideW - 20), 0.66 * (wideW - 20)] });
    } else if (p.setup === 'mito') {
      const T = TISSUE[p.tissue];
      const keys = [p.tissue].concat(['flight', 'heart', 'liver', 'leg', 'pea', 'rbc'].filter(k => k !== p.tissue)).slice(0, 6);
      const rows = keys.map(k => { const t = TISSUE[k], on = k === p.tissue, col = on ? '#FFD66B' : t.plant ? '#9FE0B8' : null; return [{ t: t.short, bold: on, col }, { t: t.mito ? (t.mito * 100).toFixed(t.mito < 0.02 ? 1 : 0) + ' %' : '0', col }, { t: String(t.o2), col }]; });
      box('Mitochondria · oxygen, mL a gram an hour', [[{ t: 'cells of', bold: true }, { t: 'share', bold: true }, { t: 'oxygen', bold: true }]].concat(rows), { cols: [0, 0.46, 0.66], widths: [0.46 * (wideW - 20), 0.2 * (wideW - 20), 0.34 * (wideW - 20)] });
    } else if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') {
        const T = waterAt(p, S.ts), I = Iat(p.dist), bm = bubbles(p.dist, p.bicarb, T, p.colour), comp = compensation(p.bicarb, T, p.colour);
        box('Counting bubbles', [
          [{ t: 'light', bold: true }, I.toFixed(0) + ' µmol/m²/s at ' + p.dist + ' cm'],
          [{ t: 'made', bold: true }, { t: (gross(I, p.bicarb, T, p.colour)).toFixed(2) + ' µmol O₂ a minute', col: '#9FE0B8' }],
          [{ t: 'used', bold: true }, { t: respE(T).toFixed(2) + ' µmol a minute: the plant breathes too', col: '#FFB0A0' }],
          [{ t: 'bubbles', bold: true }, { t: bm.toFixed(1) + ' a minute · ' + Math.floor(S.count) + ' counted', col: '#FFD66B' }],
          [{ t: 'water', bold: true }, T.toFixed(1) + ' °C' + (p.shield ? '' : ' — warming: no heat shield')],
          [{ t: 'no bubbles', bold: true }, isFinite(comp) ? 'beyond ' + comp.toFixed(0) + ' cm: made = used' : 'never']
        ], { cols: [0, 0.26], widths: [0.26 * (wideW - 20), 0.74 * (wideW - 20)] });
      } else if (p.cexp === 'engelmann') {
        const E = engCounts(S);
        if (p.light === 'spot') { const f = spotOnRibbon(p.spot); box('A spot of light on Spirogyra', [[{ t: 'the spot', bold: true }, f > 0.08 ? 'on the chloroplast ribbon' : 'between the turns of the ribbon'], [{ t: 'oxygen', bold: true }, { t: f > 0.08 ? 'made where the spot falls' : 'none: no chloroplast lit', col: f > 0.08 ? '#9FE0B8' : '#FF8A80' }], [{ t: 'bacteria', bold: true }, E.near + ' near the filament']], { cols: [0, 0.26], widths: [0.26 * (wideW - 20), 0.74 * (wideW - 20)] }); }
        else box('Bacteria by the filament, by colour', E.bands.map(b => [{ t: b.name, bold: true }, { t: String(b.n), col: b.n > 12 ? '#9FE0B8' : '#AFC0D8' }, 'absorbed ' + Math.round(absorb((b.lo + b.hi) / 2) * 100) + ' %']), { cols: [0, 0.42, 0.56], widths: [0.42 * (wideW - 20), 0.14 * (wideW - 20), 0.44 * (wideW - 20)] });
      } else {
        const B = leafBlue(p), word = v => v > 0.6 ? 'blue-black: starch' : v > 0.2 ? 'dark: some starch' : 'brown: no starch';
        box('The iodine test', [[{ t: 'green, lit', bold: true }, { t: word(B.lit), col: B.lit > 0.2 ? '#AFC4FF' : '#E8B870' }], [{ t: 'green, foil', bold: true }, { t: p.foil ? word(B.foil) : 'no foil on it', col: B.foil > 0.2 ? '#AFC4FF' : '#E8B870' }], [{ t: 'white edge', bold: true }, { t: 'brown: no chloroplasts', col: '#E8B870' }], [{ t: 'so', bold: true }, { t: p.destarch ? 'starch is made only with chloroplasts and light' : 'old starch hides the result: destarch first', col: p.destarch ? '#9FE0B8' : '#FFB35C' }]], { cols: [0, 0.3], widths: [0.3 * (wideW - 20), 0.7 * (wideW - 20)] });
      }
    } else if (p.setup === 'size') {
      const x = front(S.ts, 20), rows = [[{ t: 'cube', bold: true }, { t: 'SA : V', bold: true }, { t: 'reached', bold: true }, { t: 'to the middle', bold: true }]].concat(CUBES.map(mm => [mm + ' mm', (6 / mm).toFixed(2), Math.round(pinkFrac(mm, x) * 100) + ' %', fmtT(Math.pow(mm / 2 / KF, 2))]));
      box('Agar cubes after ' + fmtT(S.ts), rows, { cols: [0, 0.24, 0.48, 0.7], widths: [0.24 * (wideW - 20), 0.24 * (wideW - 20), 0.22 * (wideW - 20), 0.3 * (wideW - 20)] });
    }
  }
  /* what the two slides show, counted */
  function wallStats(S) {
    const p = S.p, po = piOut(p.salt);
    const on = p.treat === 'noWall' ? S.proto : S.onion, n = on.length;
    let plas = 0, burst = 0, vsum = 0;
    on.forEach(c => { if (p.treat === 'noWall') { if (c.burst) burst++; else vsum += c.vol; } else { vsum += c.vol; if (c.vol < 0.985) plas++; } });
    const rb = S.rbc, lys = rb.filter(b => b.lysed).length, cren = rb.filter(b => !b.lysed && b.V < 0.85 * b.V0).length, vr = rb.filter(b => !b.lysed).reduce((u, b) => u + b.V, 0) / Math.max(1, rb.length - lys);
    const turg = p.treat === 'fresh' ? walled(ONION.pi, po).P : 0;
    const onionEq = p.treat === 'noWall' ? freeProto(ONION.pi, po) : p.treat === 'boiled' ? 1 : walled(ONION.pi, po).v;
    return {
      n, plas, burst, plasPct: plas / n * 100, burstPct: burst / n * 100, onionV: p.treat === 'noWall' ? vsum / Math.max(1, n - burst) : vsum / n, lys, lysPct: lys / rb.length * 100, cren, crenPct: cren / rb.length * 100, rbcV: vr, turg, onionEq,
      onionDir: p.treat === 'boiled' ? 'nothing held: membranes dead' : onionEq > 1.002 ? 'in, until the wall pushes back' : onionEq < 0.998 ? 'out: the protoplast shrinks' : 'no change',
      rbcDir: rbcV(p.salt) > 91.5 ? 'in' + (lys > rb.length / 2 ? ', until it bursts' : '') : rbcV(p.salt) < 88.5 ? 'out: it shrinks' : 'no change',
      onionVol: p.treat === 'noWall' ? (burst / n > 0.5 ? 'most burst' : Math.round(onionEq * 100) + ' %') : Math.round(onionEq * 100) + ' % of the wall',
      rbcVol: lys / rb.length > 0.5 ? 'most burst' : rbcV(p.salt).toFixed(0) + ' fL (of 90)',
      turgor: p.treat === 'fresh' ? (turg > 0.005 ? turg.toFixed(2) + ' MPa: firm' : 'none: limp') : p.treat === 'boiled' ? 'none: dead' : 'none: no wall',
      onionSeen: p.treat === 'noWall' ? burst + ' of ' + n + ' burst' : p.treat === 'boiled' ? 'the red leaked out' : plas + ' of ' + n + ' plasmolysed',
      rbcSeen: lys + ' burst · ' + cren + ' spiky'
    };
  }

  /* ============================================================
     THE HEADER
     ============================================================ */
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'membrane') {
      const B = S.bag, what = { starch: 'starch and ' + (p.cIn * 18).toFixed(0) + ' % glucose', sucrose: p.cIn.toFixed(2) + ' M sucrose', salt: p.cIn.toFixed(2) + ' M salt', water: 'water' }[p.fill], out = { iodine: 'iodine solution', water: 'water', sucrose: p.cOut.toFixed(2) + ' M sucrose' }[p.bath];
      const line = 'A bag of ' + what + ' in ' + out + ': ' + (Math.abs(massPct(B)) < 0.2 ? 'no change in mass' : (massPct(B) > 0 ? 'it gains ' : 'it loses ') + Math.abs(massPct(B)).toFixed(1) + ' %');
      const sub = fmtT(S.ts) + ' · ' + p.temp + ' °C · water ' + (B.Jv >= 0 ? 'in' : 'out') + ' at ' + Math.abs(B.Jv).toFixed(2) + ' mL/h';
      const note = p.fill === 'starch' ? (boundOf(B) > 0.3 ? 'iodine got in (blue-black inside); glucose got out (Benedict’s); starch stayed in' : 'watch the inside turn blue-black as iodine comes in') : p.fill === 'salt' ? 'salt slips through the pores: it leaks out, so little water moves' : 'sucrose barely fits the pores: water moves toward the side with more of it';
      return [line, sub, note];
    }
    if (p.setup === 'wall') {
      const W = wallStats(S);
      return ['Red onion and red blood cells in ' + p.salt.toFixed(2) + ' % salt (' + (osmNaCl(p.salt) * 1000).toFixed(0) + ' mOsm)', fmtT(S.ts) + ' since mounting · onion ' + W.onionSeen + ' · blood ' + W.rbcSeen, p.treat === 'noWall' ? 'without their walls the onion protoplasts burst like red cells' : p.treat === 'boiled' ? 'dead membranes hold nothing: the red leaks out, and nothing shrinks' : 'water crosses both; only the cell with a wall holds firm'];
    }
    if (p.setup === 'nucleus') {
      const live = S.pieces.filter(pc => pc.alive && pc.kind !== 'cap'), made = S.pieces.reduce((u, pc) => u + pc.caps.length, 0);
      const last = S.pieces.map(pc => pc.caps[pc.caps.length - 1]).filter(Boolean).sort((a, b) => b.day - a.day)[0];
      return ['Acetabularia, day ' + S.day.toFixed(0) + ': ' + (last ? 'a new cap, ' + Math.round(last.f * 100) + ' % crenulata' : 'no cap yet'), { decap: 'the cap cut off', pieces: 'cut into three: cap, stalk, base', graft: 'a stalk grafted onto a base of the other kind', two: 'one stalk on two bases, one of each kind' }[p.op] + ' · ' + made + ' cap' + (made === 1 ? '' : 's') + ' so far · ' + live.length + ' alive', p.recut ? 'each cap is cut off when grown: the next shows what the nucleus makes now' : 'left alone: the first cap is made from what the stalk had stored'];
    }
    if (p.setup === 'mito') {
      const t = S.ts, Rn = respNow(S), cor = Rn.v1 - Rn.d, T = TISSUE[p.tissue];
      return [RESP.org[p.org].name.replace(/^./, c => c.toUpperCase()) + ' at ' + p.bathT + ' °C: ' + cor.toFixed(3) + ' mL of oxygen in ' + fmtT(t), (p.koh ? 'KOH takes up the CO₂' : 'no KOH: CO₂ given out replaces O₂ taken') + ' · rate ' + (respRate(p.org, p.bathT) * p.mass).toFixed(3) + ' mL an hour', 'the electron microscope: ' + T.name + ' — ' + T.has];
    }
    if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') { const T = waterAt(p, S.ts), bm = bubbles(p.dist, p.bicarb, T, p.colour); return ['Elodea under ' + (p.colour === 'white' ? 'a lamp' : 'a ' + p.colour + ' LED') + ' ' + p.dist + ' cm away: ' + bm.toFixed(1) + ' bubbles a minute', 'light ' + Iat(p.dist).toFixed(0) + ' µmol/m²/s (1/d²) · ' + (p.bicarb > 0 ? p.bicarb.toFixed(1) + ' % bicarbonate' : 'no bicarbonate') + ' · ' + T.toFixed(1) + ' °C', bm < 0.05 ? 'too dim: the leaf makes no more oxygen than it uses' : 'each bubble is oxygen the chloroplasts have made']; }
      if (p.cexp === 'engelmann') return ['Engelmann, 1882: ' + (p.light === 'spot' ? 'a spot of light on a Spirogyra cell' : p.light === 'spectrum' ? 'a spectrum across a green filament' : p.light + ' light on a green filament'), 'bacteria that need oxygen swim to wherever it is being made', p.light === 'spectrum' ? 'they crowd in the red and the blue — the colours chlorophyll absorbs' : p.light === 'spot' ? 'only a lit chloroplast makes oxygen: slide the spot along' : p.light === 'green' ? 'green is mostly passed through, not absorbed: few gather' : 'white light: oxygen all along the filament'];
      const B = leafBlue(p);
      return ['A variegated leaf, ' + p.hours + ' h in the light' + (p.foil ? ', a strip of foil across it' : ''), (p.destarch ? 'destarched first (two days dark)' : 'not destarched') + ' · boiled, then hot ethanol, then iodine', B.lit > 0.5 && B.foil < 0.2 ? 'starch only where there were chloroplasts and light' : !p.destarch ? 'old starch everywhere green: the test cannot tell' : 'too short a time in the light to make much starch'];
    }
    const c = cellOf(p);
    return ['Agar cubes: ' + fmtT(S.ts) + ' in alkali · a ' + c.D.name.replace(/^an? /, '') + ' grown to ' + fmtUm(2 * c.R), 'the 10 mm cube: surface ÷ volume = 0.6 per mm; the 30 mm: 0.2 — a third as much surface for its size', c.core > 0 ? 'past ' + fmtUm(c.rmax) + (p.shape === 'sphere' ? ' radius' : ' half-thickness') + ' its middle gets no oxygen: ' + Math.round(c.coreVol * 100) + ' % starves' : 'oxygen reaches the middle: ' + Math.round(c.centre * 100) + ' % as much as at the surface'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'membrane') {
      const H = S.hist, tmax = Math.max(30, S.ts / 60 * 1.1), items = [{ c: '#FFD66B', label: 'this bag' }];
      const fam = p.fill === 'sucrose' && p.bath === 'water' ? famCurves(p) : null;
      if (fam) items.push({ c: 'rgba(201,212,234,.5)', label: '0.2 … 1.0 M sucrose', dash: [4, 3] });
      const Kk = K.plotKey(g, items), ys = H.map(q => q[1]).concat(fam ? fam.flatMap(c => c.pts.map(q => q[1])) : []), lo = Math.min(-2, ...ys), hi = Math.max(2, ...ys);
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: lo * 1.15, ymax: hi * 1.15, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'minutes', ylabel: 'mass change, %', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.35)'); if (fam) fam.forEach(c => { P.line(c.pts, 'rgba(201,212,234,.45)', 1.2, [4, 3]); const q = c.pts[c.pts.length - 1]; if (q[0] <= tmax) P.tag(q[0], q[1], c.c.toFixed(1) + ' M', '#AFC0D8', 'right', -6); }); P.line(H.map(q => [q[0], q[1]]), '#FFD66B', 2.5); const q = H[H.length - 1]; if (q) P.dot(q[0], q[1], 4.5, '#FFD66B'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'wall') {
      const W = wallStats(S), items = [{ c: '#E08ABE', label: 'onion plasmolysed' }, { c: '#FFB0A0', label: 'red cells burst' }, { c: '#9FE0B8', label: 'protoplasts burst', dash: [5, 3] }, { c: '#8FB4FF', label: 'red cells spiky', dash: [2, 3] }];
      const Kk = K.plotKey(g, items), xs = []; for (let i = 0; i <= 120; i++) xs.push(i / 40);
      const P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'salt, %', ylabel: 'cells, %', xticks: [0, 0.5, 0.9, 1.5, 2, 3], xfmt: v => String(v), yticks: [0, 50, 100], yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.line(xs.map(x => [x, fracPlas(x) * 100]), '#E08ABE', 2.2); P.line(xs.map(x => [x, fracLysed(x) * 100]), '#FFB0A0', 2.2);
        P.line(xs.map(x => [x, fracBurstProto(x) * 100]), '#9FE0B8', 1.6, [5, 3]); P.line(xs.map(x => [x, rbcV(x) < 0.85 * RBC.V0 ? 100 : 0]), '#8FB4FF', 1.4, [2, 3]);
        P.vline(p.salt, 'rgba(255,214,107,.8)', [3, 3]);
        if (p.treat === 'fresh') P.dot(p.salt, W.plasPct, 5, '#E08ABE', '#0B0F18'); else if (p.treat === 'noWall') P.dot(p.salt, W.burstPct, 5, '#9FE0B8', '#0B0F18');
        P.dot(p.salt, W.lysPct, 5, '#FFB0A0', '#0B0F18');
        P.tag(PCT_PLAS50, 50, 'half plasmolysed: ' + PCT_PLAS50.toFixed(2) + ' %', '#E08ABE', 'left', -10);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'nucleus') {
      const H = S.hist, pcs = S.pieces, items = [];
      const withS = pcs.map((pc, i) => ({ pc, i })).filter(o => o.pc.kind !== 'cap');
      withS.forEach(({ pc }, j) => { if (withS.length > 1) items.push({ c: j ? '#9FE0B8' : '#FFD66B', label: pc.name + ': all substance', dash: j ? [5, 3] : null }); });
      if (withS.length === 1) items.push({ c: '#E8B458', label: 'mediterranea’s' }, { c: '#7FC8F0', label: 'crenulata’s' });
      items.push({ c: 'rgba(255,138,128,.8)', label: 'a cap needs 10', dash: [3, 3] });
      const Kk = K.plotKey(g, items), top = Math.max(22, ...H.flatMap(q => q.slice(1).map(v => v[0] + v[1]))) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: Math.max(40, S.day * 1.1, 60), ymin: 0, ymax: top, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'days', ylabel: 'cap substance, units', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.hline(ACET.theta, 'rgba(255,138,128,.7)', [3, 3]);
        withS.forEach(({ pc, i }, j) => {
          const pts = H.map(q => [q[0], q[i + 1]]);
          if (withS.length === 1) { P.line(pts.map(q => [q[0], q[1][0]]), '#E8B458', 2.2); P.line(pts.map(q => [q[0], q[1][1]]), '#7FC8F0', 2.2); }
          else P.line(pts.map(q => [q[0], q[1][0] + q[1][1]]), j ? '#9FE0B8' : '#FFD66B', 2.2, j ? [5, 3] : null);
          pc.caps.forEach(c => { P.vline(c.day, 'rgba(201,212,234,.3)'); P.tag(c.day, top * 0.92, Math.round(c.f * 100) + '%', '#EAF1FF', 'left', 0); });
        });
        P.vline(S.day, 'rgba(255,214,107,.6)', [2, 3]);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'mito') {
      const H = S.hist, items = [{ c: '#FFD66B', label: RESP.org[p.org].name }, { c: '#C9B878', label: 'dry peas' }, { c: '#8FB4FF', label: 'beads (the control)' }, { c: '#9FE0B8', label: 'corrected', dash: [5, 3] }];
      const Kk = K.plotKey(g, items), tmax = Math.max(20, S.ts / 60 * 1.1), top = Math.max(0.2, ...H.map(q => q[1])) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: top, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'minutes', ylabel: 'gas used, mL', yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => {
        P.line(H.map(q => [q[0], q[1]]), '#FFD66B', 2.4); P.line(H.map(q => [q[0], q[2]]), '#C9B878', 2); P.line(H.map(q => [q[0], q[3]]), '#8FB4FF', 2); P.line(H.map(q => [q[0], q[1] - q[3]]), '#9FE0B8', 1.6, [5, 3]);
        H.forEach(q => { if (q[0] % 5 === 0) { P.dot(q[0], q[1], 3.5, '#FFD66B'); P.dot(q[0], q[2], 3, '#C9B878'); P.dot(q[0], q[3], 3, '#8FB4FF'); } });
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') {
        const T = waterAt(p, S.ts), items = [{ c: '#FFD66B', label: 'bubbles a minute (' + p.colour + ')' }, { c: 'rgba(201,212,234,.55)', label: 'if light alone set the pace: 1/d²', dash: [4, 3] }];
        const Kk = K.plotKey(g, items), xs = []; for (let d = 5; d <= 80; d += 0.5) xs.push(d);
        const top = Math.max(5, ...xs.map(d => bubbles(d, p.bicarb, T, p.colour))) * 1.2, ref = bubbles(40, p.bicarb, T, p.colour) + respE(T) / EL.BUBBLE;
        const P = g.Plot({ xmin: 5, xmax: 80, ymin: 0, ymax: top, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'lamp distance, cm', ylabel: 'bubbles a minute', yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(xs.map(d => [d, ref * Math.pow(40 / d, 2) - respE(T) / EL.BUBBLE]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(xs.map(d => [d, bubbles(d, p.bicarb, T, p.colour)]), '#FFD66B', 2.4); P.dot(p.dist, bubbles(p.dist, p.bicarb, T, p.colour), 5.5, '#FFD66B', '#0B0F18'); const c = compensation(p.bicarb, T, p.colour); if (isFinite(c) && c < 80) { P.vline(c, 'rgba(255,138,128,.7)', [3, 3]); P.tag(c, top * 0.85, 'made = used', '#FF8A80', 'left', 0); } });
        Kk.draw(P); return;
      }
      if (p.cexp === 'engelmann') {
        const items = [{ c: '#FFD66B', box: true, label: 'bacteria by the filament' }, { c: '#9FE0B8', label: 'light the alga absorbs, %' }];
        const Kk = K.plotKey(g, items);
        if (p.light === 'spot') {
          const P = g.Plot({ xmin: -150, xmax: 150, ymin: 0, ymax: 1.05, pad: { t: Kk.t }, xlabel: 'where the spot is, µm along the filament', ylabel: 'of the spot on a chloroplast', yfmt: v => (v * 100).toFixed(0) + '%' }).frame();
          const xs = []; for (let x = -150; x <= 150; x += 1) xs.push([x, Math.min(1, spotOnRibbon(x) / SPI.full)]);
          P.clip(() => { P.area(xs, 0, 'rgba(111,224,160,.25)'); P.line(xs, '#9FE0B8', 2); P.vline(p.spot, '#FFD66B', [3, 3]); P.dot(p.spot, Math.min(1, spotOnRibbon(p.spot) / SPI.full), 5, '#FFD66B'); });
          Kk.draw(P); return;
        }
        const nb = 32, bins = new Array(nb).fill(0); (S.bact || []).forEach(b => { if (Math.abs(b.y) > 60 || b.x < ENG.x0 || b.x > ENG.x1) return; bins[Math.min(nb - 1, Math.floor((b.x - ENG.x0) / (ENG.x1 - ENG.x0) * nb))]++; });
        const top = Math.max(8, ...bins) * 1.15;
        const P = g.Plot({ xmin: 400, xmax: 720, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'colour of the light, nm', ylabel: 'bacteria', yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { bins.forEach((n, i) => { const nm = 400 + (i + 0.5) * 320 / nb; P.bar(nm, n, 5, 0, specCol(nm)); }); const xs = []; for (let nm = 400; nm <= 720; nm += 4) xs.push([nm, absorb(nm) * top * 0.9]); P.line(xs, '#9FE0B8', 2); });
        Kk.draw(P); return;
      }
      const items = [{ c: '#AFC4FF', label: 'green, lit' }, { c: '#E8B870', label: 'green, under foil', dash: [5, 3] }, { c: '#DCE6F6', label: 'white edge', dash: [2, 3] }];
      const Kk = K.plotKey(g, items), xs = []; for (let h = 0; h <= 8; h += 0.25) xs.push(h);
      const P = g.Plot({ xmin: 0, xmax: 8, ymin: 0, ymax: 1.05, pad: { t: Kk.t }, xlabel: 'hours in the light', ylabel: 'iodine’s blue-black', yfmt: v => (v * 100).toFixed(0) + '%' }).frame();
      P.clip(() => { P.line(xs.map(h => [h, iodineBlue(leafStarch({ green: true, lit: true, hours: h, destarch: p.destarch }))]), '#AFC4FF', 2.4); P.line(xs.map(h => [h, iodineBlue(leafStarch({ green: true, lit: false, hours: h, destarch: p.destarch }))]), '#E8B870', 2, [5, 3]); P.line(xs.map(h => [h, 0.004]), '#DCE6F6', 1.6, [2, 3]); P.vline(p.hours, 'rgba(255,214,107,.8)', [3, 3]); });
      Kk.draw(P); return;
    }
    // size: the cubes over time
    const cols = ['#FFD66B', '#9FE0B8', '#8FB4FF', '#FF8A80'], items = CUBES.map((mm, i) => ({ c: cols[i], label: mm + ' mm cube' }));
    const Kk = K.plotKey(g, items), tmax = Math.max(20, S.ts / 60 * 1.15), xs = []; for (let i = 0; i <= 120; i++) xs.push(i / 120 * tmax);
    const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: 105, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'minutes in alkali', ylabel: 'of the cube reached, %', yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { CUBES.forEach((mm, i) => P.line(xs.map(t => [t, pinkFrac(mm, front(t * 60, 20)) * 100]), cols[i], 2.2)); P.vline(S.ts / 60, 'rgba(255,214,107,.7)', [3, 3]); });
    Kk.draw(P);
  }
  let famCache = null;
  function famCurves(p) {
    const key = p.temp; if (famCache && famCache.key === key) return famCache.c;
    const c = [0.2, 0.4, 0.6, 0.8, 1.0].map(cc => { const q = Object.assign({}, p, { fill: 'sucrose', cIn: cc, bath: 'water' }), B = bagStart(q), pts = [[0, 0]]; for (let m = 1; m <= 90; m++) { for (let i = 0; i < 30; i++) bagStep(B, 2, q.temp); pts.push([m, massPct(B)]); } return { c: cc, pts }; });
    famCache = { key, c }; return c;
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'membrane') {
      if (p.fill === 'starch') {
        const H = S.hist, items = [{ c: '#FFD66B', label: 'glucose outside, %' }, { c: '#C07A22', label: 'iodine inside, mM' }, { c: '#FF8A80', label: 'starch outside', dash: [3, 3] }];
        const Kk = K.plotKey(g, items), tmax = Math.max(30, S.ts / 60 * 1.1), top = Math.max(1.1, ...H.map(q => Math.max(q[2], q[3]))) * 1.15;
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: top, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'minutes', ylabel: 'outside: glucose % · inside: iodine mM', yfmt: v => v.toFixed(1) }).frame();
        P.clip(() => { P.line(H.map(q => [q[0], q[2]]), '#FFD66B', 2.4); P.line(H.map(q => [q[0], q[3]]), '#C07A22', 2.4); P.line(H.map(q => [q[0], 0.01]), '#FF8A80', 1.6, [3, 3]); });
        Kk.draw(P); return;
      }
      const items = [{ c: '#FFD66B', label: 'sucrose' }, { c: '#8FB4FF', label: 'salt' }, { c: '#FF8A80', dot: true, label: 'this bag' }];
      const Kk = K.plotKey(g, items), key = p.temp;
      if (!S._diffKey || S._diffKey !== key) { const mk = f => { const out = []; for (let d = -1; d <= 1.001; d += 0.1) { const q = Object.assign({}, p, d >= 0 ? { fill: f, cIn: d, bath: 'water' } : { fill: 'water', cIn: 0, bath: 'sucrose', cOut: -d }); if (f === 'salt' && d < 0) continue; out.push([d, massPct(bagRun(q, 30))]); } return out; }; S._diff = { suc: mk('sucrose'), salt: mk('salt') }; S._diffKey = key; }
      const dC = (p.fill === 'water' ? 0 : p.cIn) - (p.bath === 'sucrose' ? p.cOut : 0);
      const P = g.Plot({ xmin: -1, xmax: 1, ymin: -22, ymax: 22, pad: { t: Kk.t }, xlabel: 'inside − outside, M', ylabel: 'mass change in 30 min, %', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.35)'); P.vline(0, 'rgba(201,212,234,.35)'); P.line(S._diff.suc, '#FFD66B', 2.2); P.line(S._diff.salt, '#8FB4FF', 2.2); const h = S.hist.find(q => q[0] >= 30); P.dot(dC, h ? h[1] : massPct(S.bag), 5, '#FF8A80', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'wall') {
      const items = [{ c: '#E08ABE', label: 'onion protoplast, in its wall' }, { c: '#9FE0B8', label: 'without a wall', dash: [5, 3] }, { c: '#FFB0A0', label: 'red cell' }];
      const Kk = K.plotKey(g, items), xs = []; for (let i = 1; i <= 120; i++) xs.push(i / 40);
      const P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 2.2, pad: { t: Kk.t }, xlabel: 'salt, %', ylabel: 'volume ÷ normal', xticks: [0, 0.5, 0.9, 1.5, 2, 3], xfmt: v => String(v), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => {
        P.hline(1, 'rgba(201,212,234,.35)');
        P.line(xs.map(x => [x, walled(ONION.pi, piOut(x)).v]), '#E08ABE', 2.4);
        const pb = xs.filter(x => freeProto(ONION.pi, piOut(x)) < ONION.burst); P.line(pb.map(x => [x, freeProto(ONION.pi, piOut(x))]), '#9FE0B8', 2, [5, 3]); if (pb.length) { const x0 = pb[0]; P.tag(x0, ONION.burst, '✕ bursts', '#9FE0B8', 'left', -8); }
        const rb = xs.filter(x => rbcV(x) < RBC.crit); P.line(rb.map(x => [x, rbcV(x) / RBC.V0]), '#FFB0A0', 2.2); if (rb.length) P.tag(rb[0], RBC.crit / RBC.V0, '✕ bursts', '#FFB0A0', 'left', -8);
        P.vline(p.salt, 'rgba(255,214,107,.8)', [3, 3]);
        P.tag(0.05, walled(ONION.pi, 0.001).v, 'the wall stops it', '#E08ABE', 'left', -10);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'nucleus') {
      const caps = []; S.pieces.forEach(pc => pc.caps.forEach((c, j) => caps.push({ pc, j, f: c.f, day: c.day })));
      caps.sort((a, b) => a.day - b.day);
      const items = [{ c: '#E8B458', box: true, label: 'smooth (mediterranea)' }, { c: '#7FC8F0', box: true, label: 'crenulate (crenulata)' }];
      const Kk = K.plotKey(g, items), n = Math.max(4, caps.length);
      const P = g.Plot({ xmin: 0.3, xmax: n + 0.7, ymin: 0, ymax: 100, pad: { t: Kk.t }, xticks: caps.map((c, i) => i + 1), xfmt: v => { const c = caps[Math.round(v) - 1]; return c ? 'day ' + c.day.toFixed(0) : ''; }, ylabel: 'crenulata, %', yticks: [0, 50, 100], yfmt: v => v.toFixed(0) }).frame();
      caps.forEach((c, i) => { P.bar(i + 1, 100, 0.3, 0, '#E8B458'); P.bar(i + 1, c.f * 100, 0.3, 0, '#7FC8F0'); P.tag(i + 1, c.f * 100, Math.round(c.f * 100) + '%', '#EAF1FF', 'center', -9); });
      if (!caps.length) P.tag(0.5 + n / 2, 50, 'no cap yet — run the days on', '#8FA3C0', 'center', 0);
      Kk.draw(P); return;
    }
    if (p.setup === 'mito') {
      const items = [{ c: '#FFD66B', label: RESP.org[p.org].name + ', mL a gram an hour' }, { c: '#FF8A80', dot: true, label: 'now' }];
      const Kk = K.plotKey(g, items), xs = []; for (let T = 0; T <= 50; T += 0.5) xs.push(T);
      const top = Math.max(0.06, ...xs.map(T => respRate(p.org === 'boiled' ? 'peas' : p.org, T))) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: 50, ymin: 0, ymax: top, pad: { t: Kk.t }, xfmt: v => v.toFixed(0), xlabel: 'bath temperature, °C', ylabel: 'oxygen, mL/g/h', yfmt: v => v.toFixed(v < 0.1 ? 3 : 2) }).frame();
      P.clip(() => { if (p.org === 'boiled') P.line(xs.map(T => [T, respRate('peas', T)]), 'rgba(201,212,234,.4)', 1.4, [4, 3]); P.line(xs.map(T => [T, respRate(p.org, T)]), '#FFD66B', 2.4); P.dot(p.bathT, respRate(p.org, p.bathT), 5.5, '#FF8A80', '#0B0F18'); P.tag(2, top * 0.86, '×2.1 for every 10 °C warmer (Q10)', '#AFC0D8', 'left', 0); P.tag(41, top * 0.62, 'enzymes fail', '#FF8A80', 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') {
        const T = waterAt(p, S.ts), items = [{ c: '#9FE0B8', label: 'oxygen made' }, { c: '#FF8A80', label: 'used by the plant', dash: [4, 3] }, { c: '#FFD66B', dot: true, label: 'this lamp' }];
        const Kk = K.plotKey(g, items), xs = []; for (let I = 0; I <= 700; I += 5) xs.push(I);
        const P = g.Plot({ xmin: 0, xmax: 700, ymin: 0, ymax: EL.PMAX * 1.25, pad: { t: Kk.t }, xlabel: 'light, µmol photons/m²/s', ylabel: 'O₂, µmol a minute', yfmt: v => v.toFixed(1) }).frame();
        P.clip(() => { P.line(xs.map(I => [I, gross(I, p.bicarb, T, p.colour)]), '#9FE0B8', 2.4); P.hline(respE(T), 'rgba(255,138,128,.8)', [4, 3]); const I = Iat(p.dist); P.dot(Math.min(700, I), gross(I, p.bicarb, T, p.colour), 5.5, '#FFD66B', '#0B0F18'); P.tag(560, gross(560, p.bicarb, T, p.colour), 'saturated: CO₂ or heat limits it', '#AFC0D8', 'right', -12); });
        Kk.draw(P); return;
      }
      if (p.cexp === 'engelmann') {
        const items = [{ c: '#9FE0B8', label: 'light absorbed' }, { c: '#FFD66B', label: 'oxygen made (per photon)', dash: [5, 3] }];
        const Kk = K.plotKey(g, items), xs = []; for (let nm = 400; nm <= 720; nm += 2) xs.push(nm);
        const P = g.Plot({ xmin: 400, xmax: 720, ymin: 0, ymax: 1.05, pad: { t: Kk.t }, xlabel: 'wavelength, nm', ylabel: 'of the most, %', yfmt: v => (v * 100).toFixed(0) }).frame();
        P.clip(() => { xs.forEach(nm => P.bar(nm, 0.04, 1.2, 0, specCol(nm))); P.line(xs.map(nm => [nm, absorb(nm)]), '#9FE0B8', 2.4); P.line(xs.map(nm => [nm, action(nm)]), '#FFD66B', 2, [5, 3]); P.tag(440, 0.97, 'blue', '#AFC4FF', 'center', -6); P.tag(675, 0.94, 'red', '#FF8A80', 'center', -6); P.tag(550, 0.3, 'green: passed through', '#9FE0B8', 'center', -10); });
        Kk.draw(P); return;
      }
      const B = leafBlue(p), items = [{ c: '#AFC4FF', box: true, label: 'starch at the start' }, { c: '#FFD66B', box: true, label: 'after the light' }];
      const Kk = K.plotKey(g, items), parts = [['green, lit', true, true], ['green, foil', true, false], ['white', false, true]];
      const P = g.Plot({ xmin: 0.4, xmax: 3.6, ymin: 0, ymax: 2.6, pad: { t: Kk.t }, xticks: [1, 2, 3], xfmt: v => (parts[Math.round(v) - 1] || [''])[0], ylabel: 'starch, relative', yfmt: v => v.toFixed(1) }).frame();
      parts.forEach(([n, green, lit], i) => { const s0 = leafStarch({ green, lit, hours: 0, destarch: p.destarch }), s1 = leafStarch({ green, lit: lit && (!p.foil || i !== 1) ? lit : false, hours: p.hours, destarch: p.destarch }); P.bar(i + 1 - 0.17, s0, 0.15, 0, '#AFC4FF'); P.bar(i + 1 + 0.17, s1, 0.15, 0, '#FFD66B'); });
      Kk.draw(P); void B; return;
    }
    const c = cellOf(p), items = [{ c: '#FFD66B', label: 'oxygen in this cell' }, { c: 'rgba(255,138,128,.8)', label: 'none left', dash: [3, 3] }];
    const Kk = K.plotKey(g, items), xs = []; for (let i = 0; i <= 100; i++) xs.push(i / 100);
    const P = g.Plot({ xmin: 0, xmax: c.sh.a, ymin: 0, ymax: 1.08, pad: { t: Kk.t }, xfmt: v => v >= 10 ? v.toFixed(0) : v.toFixed(1), xlabel: 'µm in from the surface to the middle', ylabel: 'oxygen ÷ outside', yfmt: v => (v * 100).toFixed(0) + '%' }).frame();
    P.clip(() => { P.area(xs.map(u => [u * c.sh.a, o2At(p.shape, c.sh.a, c.D.q, u)]), 0, 'rgba(255,214,107,.18)'); P.line(xs.map(u => [u * c.sh.a, o2At(p.shape, c.sh.a, c.D.q, u)]), '#FFD66B', 2.4); P.hline(0.01, 'rgba(255,138,128,.7)', [3, 3]); if (c.core > 0) { P.vline(c.sh.a - c.core, 'rgba(255,138,128,.7)', [3, 3]); P.tag(c.sh.a - c.core, 0.5, 'starving from here', '#FF8A80', 'left', 0); } });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'membrane') {
      const B = S.bag, out = [
        { label: 'Time', value: fmtT(S.ts), hint: 'time-lapse ×' + p.lapse },
        { label: 'Bag mass', value: bagMass(B).toFixed(2), unit: 'g', flag: 'accent', hint: (massPct(B) >= 0 ? '+' : '') + massPct(B).toFixed(1) + ' % since the start' },
        { label: 'Water moving', value: Math.abs(B.Jv).toFixed(2), unit: 'mL/h', hint: B.Jv >= 0 ? 'into the bag' : 'out of the bag' },
        { label: 'Pull on the water', value: (B.dPi / 1000).toFixed(0), unit: 'kPa', hint: 'σ·i·RT × the difference in concentration' }
      ];
      if (p.fill === 'starch') out.push({ label: 'Glucose outside', value: glucosePct(cOut(B, 'glucose')).toFixed(2), unit: '%', flag: 'accent', hint: 'Benedict’s: ' + benedict(glucosePct(cOut(B, 'glucose')))[1] }, { label: 'Iodine inside', value: (cIn(B, 'iodine') * 1000).toFixed(2), unit: 'mM', hint: boundOf(B) > 0.3 ? 'the starch has turned blue-black' : 'not enough yet to colour the starch' }, { label: 'Starch outside', value: '0', unit: 'g', hint: 'far too big for a 2.4 nm pore' });
      if (p.fill === 'salt') out.push({ label: 'Salt left inside', value: (cIn(B, 'salt') / Math.max(1e-9, p.cIn) * 100).toFixed(0), unit: '%', flag: 'accent', hint: 'it leaks through the pores' });
      if (p.fill === 'sucrose') out.push({ label: 'Sucrose left inside', value: (cIn(B, 'sucrose') / Math.max(1e-9, B.c0.in.sucrose) * 100).toFixed(0), unit: '% of start', hint: 'diluted by water, a little leaked' });
      out.push({ label: 'Bag volume', value: B.V.toFixed(1), unit: 'mL', flag: B.P > 1000 ? 'warn' : '', hint: B.P > 1000 ? 'tight: pressure ' + (B.P / 1000).toFixed(0) + ' kPa' : 'full at ' + B.Vmax.toFixed(1) + ' mL' });
      return out;
    }
    if (p.setup === 'wall') {
      const W = wallStats(S), O = scope(p.obj);
      return [
        { label: 'Time since mounting', value: fmtT(S.ts), hint: 'time-lapse ×' + p.lapse },
        { label: 'Outside', value: (osmNaCl(p.salt) * 1000).toFixed(0), unit: 'mOsm', hint: 'π = ' + piOut(p.salt).toFixed(2) + ' MPa' },
        { label: p.treat === 'noWall' ? 'Protoplasts burst' : 'Onion plasmolysed', value: p.treat === 'noWall' ? W.burstPct.toFixed(0) : W.plasPct.toFixed(0), unit: '%', flag: 'accent', hint: p.treat === 'noWall' ? W.burst + ' of ' + W.n + ' · model ' + (fracBurstProto(p.salt) * 100).toFixed(0) + ' %' : W.plas + ' of ' + W.n + ' · model ' + (p.treat === 'boiled' ? 0 : fracPlas(p.salt) * 100).toFixed(0) + ' %' },
        { label: 'Onion protoplast', value: (W.onionEq * 100).toFixed(0), unit: '%', hint: p.treat === 'noWall' ? 'of its volume in the cell' : 'of the space inside its wall' },
        { label: 'Turgor', value: W.turg.toFixed(2), unit: 'MPa', hint: p.treat === 'fresh' ? 'the wall pushing back' : 'no living membrane or wall to hold it' },
        { label: 'Red cells burst', value: W.lysPct.toFixed(0), unit: '%', flag: W.lysPct > 50 ? 'crit' : 'accent', hint: W.lys + ' of ' + S.rbc.length + ' · model ' + (fracLysed(p.salt) * 100).toFixed(0) + ' %' },
        { label: 'Red cell volume', value: rbcV(p.salt).toFixed(0), unit: 'fL', hint: 'normal 90 · bursts near 148' },
        { label: 'Magnification', value: String(O.M), unit: '×', hint: 'field ' + fmtUm(O.field) }
      ];
    }
    if (p.setup === 'nucleus') {
      const pcs = S.pieces, live = pcs.filter(pc => pc.alive && pc.kind !== 'cap'), stem = pcs.find(pc => pc.kind !== 'cap' && pc.nuclei.length) || pcs.find(pc => pc.kind !== 'cap');
      const made = pcs.reduce((u, pc) => u + pc.caps.length, 0), last = pcs.map(pc => pc.caps[pc.caps.length - 1]).filter(Boolean).sort((a, b) => b.day - a.day)[0];
      const ahead = aheadOf(S), aheadCaps = ahead.reduce((u, pc) => u + pc.caps.length, 0), aheadLast = ahead.map(pc => pc.caps[pc.caps.length - 1]).filter(Boolean).sort((a, b) => b.day - a.day)[0];
      return [
        { label: 'Day', value: S.day.toFixed(0), hint: p.pace + ' days a second' },
        { label: 'Caps so far', value: String(made), hint: live.length + ' piece' + (live.length === 1 ? '' : 's') + ' alive' },
        { label: 'Newest cap', value: last ? Math.round(last.f * 100) + ' %' : '—', flag: 'accent', hint: last ? 'crenulata · day ' + last.day.toFixed(0) : 'none yet' },
        { label: 'Stored: mediterranea', value: stem ? stem.S.med.toFixed(1) : '0', unit: 'units', hint: 'a cap takes 10' },
        { label: 'Stored: crenulata', value: stem ? stem.S.cren.toFixed(1) : '0', unit: 'units', hint: 'half gone in 15 days' },
        { label: 'By day 100', value: aheadCaps + ' cap' + (aheadCaps === 1 ? '' : 's'), hint: aheadLast ? 'the last ' + Math.round(aheadLast.f * 100) + ' % crenulata' : 'none at all' }
      ];
    }
    if (p.setup === 'mito') {
      const t = S.ts, Rn = respNow(S), d = Rn.d, T = TISSUE[p.tissue];
      return [
        { label: 'Time', value: fmtT(t), hint: 'time-lapse ×' + p.lapse },
        { label: 'Drop has moved', value: (Rn.v1 - d).toFixed(3), unit: 'mL', flag: 'accent', hint: 'reading ' + Rn.v1.toFixed(3) + ' − beads ' + d.toFixed(3) + (p.koh ? '' : ' · O₂ used: ' + Rn.o2.toFixed(3)) },
        { label: 'Rate', value: (respRate(p.org, p.bathT) * p.mass).toFixed(3), unit: 'mL/h', hint: RESP.org[p.org].name + ', ' + p.mass + ' g' },
        { label: 'Per gram', value: respRate(p.org, p.bathT).toFixed(4), unit: 'mL/g/h', hint: 'at ' + p.bathT + ' °C' },
        { label: 'Dry peas', value: (Rn.v2 - d).toFixed(3), unit: 'mL', hint: 'dormant: 2 % of the rate' },
        { label: 'CO₂ taken up', value: p.koh ? 'yes' : 'no', flag: p.koh ? '' : 'warn', hint: p.koh ? 'KOH on the cotton wool' : 'the drop shows O₂ used − CO₂ made' },
        { label: 'Mitochondria', value: Math.round(T.mito * 100), unit: '% of the cell', hint: T.short },
        { label: 'That tissue uses', value: String(T.o2), unit: 'mL O₂/g/h', hint: T.plant ? 'a plant cell: it respires too' : 'working as it does' }
      ];
    }
    if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') {
        const T = waterAt(p, S.ts), I = Iat(p.dist), comp = compensation(p.bicarb, T, p.colour);
        return [
          { label: 'Time', value: fmtT(S.ts), hint: 'time-lapse ×' + p.lapse },
          { label: 'Light at the plant', value: I.toFixed(0), unit: 'µmol/m²/s', hint: '600 × (10 ÷ ' + p.dist + ')²' },
          { label: 'Bubbles', value: bubbles(p.dist, p.bicarb, T, p.colour).toFixed(1), unit: 'a minute', flag: 'accent', hint: Math.floor(S.count) + ' counted so far' },
          { label: 'Oxygen made', value: gross(I, p.bicarb, T, p.colour).toFixed(2), unit: 'µmol/min', hint: 'used: ' + respE(T).toFixed(2) },
          { label: 'Water', value: T.toFixed(1), unit: '°C', flag: T > 30 ? 'warn' : '', hint: 'will reach ' + (p.waterT + heatUp(p.dist, p.shield)).toFixed(1) + ' °C' + (p.shield ? '' : ' — no shield') },
          { label: 'No bubbles beyond', value: isFinite(comp) ? comp.toFixed(0) : '—', unit: isFinite(comp) ? 'cm' : '', hint: 'the compensation point' }
        ];
      }
      if (p.cexp === 'engelmann') {
        const E = engCounts(S), f = spotOnRibbon(p.spot);
        if (p.light === 'spot') return [{ label: 'Spot on chloroplast', value: Math.round(f * 100), unit: '%', flag: 'accent', hint: 'of the spot lies on the green ribbon' }, { label: 'Bacteria near it', value: String((S.bact || []).filter(b => Math.hypot(b.x - p.spot, b.y) < 40).length), hint: 'within 40 µm of the spot' }, { label: 'Time', value: S.ts.toFixed(0), unit: 's' }];
        return E.bands.map(b => ({ label: 'Bacteria, ' + b.name, value: String(b.n), flag: b.n > 12 ? 'accent' : '', hint: 'absorbed ' + Math.round(absorb((b.lo + b.hi) / 2) * 100) + ' %' })).concat([{ label: 'By the filament', value: String(E.near), hint: 'of ' + (S.bact || []).length }, { label: 'Light', value: p.light, hint: p.light === 'spectrum' ? '400 → 720 nm across the field' : '' }]);
      }
      const B = leafBlue(p);
      return [
        { label: 'Green, lit', value: Math.round(B.lit * 100), unit: '% blue-black', flag: 'accent', hint: 'chloroplasts and light' },
        { label: 'Green, under foil', value: Math.round(B.foil * 100), unit: '% blue-black', hint: p.foil ? 'chloroplasts, no light' : 'no foil used' },
        { label: 'White edge', value: '0', unit: '% blue-black', hint: 'light, no chloroplasts' },
        { label: 'Destarched first', value: p.destarch ? 'yes' : 'no', flag: p.destarch ? '' : 'warn', hint: p.destarch ? 'two days in the dark' : 'old starch spoils the test' },
        { label: 'Light', value: String(p.hours), unit: 'h' }
      ];
    }
    const c = cellOf(p), x = front(S.ts, 20);
    return [
      { label: 'In alkali', value: fmtT(S.ts), hint: 'the front: ' + x.toFixed(2) + ' mm in' },
      { label: '10 mm cube reached', value: Math.round(pinkFrac(10, x) * 100), unit: '%', hint: 'SA : V = 0.6 per mm' },
      { label: '30 mm cube reached', value: Math.round(pinkFrac(30, x) * 100), unit: '%', hint: 'SA : V = 0.2 per mm' },
      { label: 'The cell', value: fmtUm(2 * c.R), hint: 'across, as a ball' },
      { label: 'Surface ÷ volume', value: c.sav.toFixed(c.sav < 0.1 ? 3 : 2), unit: 'per µm', hint: p.shape === 'sphere' ? '3 ÷ R' : 'flatter or thinner: more' },
      { label: 'Largest fed', value: fmtUm(c.rmax), flag: c.core > 0 ? 'crit' : 'accent', hint: (p.shape === 'sphere' ? 'radius' : p.shape === 'flat' ? 'half-thickness' : 'thread radius') + ' √(' + SHAPE_K[p.shape] + 'DC/q)' },
      { label: 'Oxygen at the middle', value: Math.round(c.centre * 100), unit: '%', flag: c.centre < 0.01 ? 'crit' : '', hint: 'of the water’s' },
      { label: 'Starving', value: Math.round(c.coreVol * 100), unit: '% of it', flag: c.core > 0 ? 'crit' : '', hint: 'diffusing to the middle: ' + (c.tDiff < 1 ? (c.tDiff * 1000).toFixed(1) + ' ms' : c.tDiff < 120 ? c.tDiff.toFixed(1) + ' s' : (c.tDiff / 60).toFixed(0) + ' min') }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'membrane') { const B = S.bag; return E.v('J') + E.sub('water') + ' ' + E.op('=') + ' ' + E.v('L') + E.sub('p') + E.v('A') + ' (Σ' + E.v('σ') + E.v('i') + E.v('RT') + 'Δ' + E.v('c') + ' − ' + E.v('P') + ') ' + E.op('=') + ' 3.5×10⁻¹³ × ' + E.n((B.A).toFixed(0), 'cm²') + ' × (' + E.n((B.dPi / 1000).toFixed(0), 'kPa') + ' − ' + E.n((B.P / 1000).toFixed(0), 'kPa') + ') ' + E.op('=') + ' ' + E.n(B.Jv.toFixed(2), 'mL/h'); }
    if (p.setup === 'wall') { const po = piOut(p.salt), w = walled(ONION.pi, po); return E.v('π') + E.sub('out') + ' ' + E.op('=') + ' ' + E.v('c') + E.v('RT') + ' ' + E.op('=') + ' ' + E.n((osmNaCl(p.salt) * 1000).toFixed(0), 'mOsm') + ' × 2.44 ' + E.op('=') + ' ' + E.n(po.toFixed(2), 'MPa') + (po >= ONION.pi ? ' ' + E.op('≥') + ' ' + E.v('π') + E.sub('cell') + ' 0.85: water leaves, the protoplast shrinks to ' + Math.round(w.v * 100) + ' %' : ' ' + E.op('<') + ' ' + E.v('π') + E.sub('cell') + ' 0.85: water enters until the wall pushes back ' + E.n(w.P.toFixed(2), 'MPa')) + '   ·   red cell ' + E.v('V') + ' ' + E.op('=') + ' 90 × (0.43 + 0.57 × ' + E.frac('290', (osmNaCl(p.salt) * 1000).toFixed(0)) + ') ' + E.op('=') + ' ' + E.n(rbcV(p.salt).toFixed(0), 'fL'); }
    if (p.setup === 'nucleus') { const st = S.pieces.find(pc => pc.kind !== 'cap' && pc.nuclei.length) || S.pieces.find(pc => pc.kind !== 'cap'), tot = st ? st.S.med + st.S.cren : 0; return E.v('f') + E.sub('crenulata') + ' ' + E.op('=') + ' ' + E.frac(E.v('S') + E.sub('cren'), E.v('S') + E.sub('med') + ' + ' + E.v('S') + E.sub('cren')) + ' ' + E.op('=') + ' ' + E.frac(E.n(st ? st.S.cren.toFixed(1) : '0', ''), E.n(tot.toFixed(1), '')) + ' ' + E.op('=') + ' ' + E.n(tot > 0 ? Math.round(st.S.cren / tot * 100) : 0, '%') + '   ·   ' + E.v('dS') + '/' + E.v('dt') + ' ' + E.op('=') + ' 1 a day from each nucleus − ' + E.frac('ln 2', '15 days') + E.v('S') + ';  a cap when ' + E.v('S') + ' ' + E.op('≥') + ' 10'; }
    if (p.setup === 'mito') { const r = respRate(p.org, p.bathT); return E.v('rate') + ' ' + E.op('=') + ' ' + E.v('r') + E.sub('22') + ' × ' + E.v('Q') + E.sub('10') + '<sup>(' + E.v('T') + '−22)/10</sup> × ' + E.v('m') + ' ' + E.op('=') + ' ' + E.n(RESP.org[p.org].per.toFixed(3), 'mL/g/h') + ' × 2.1<sup>' + ((p.bathT - 22) / 10).toFixed(1) + '</sup> × ' + E.n(p.mass, 'g') + ' ' + E.op('=') + ' ' + E.n((r * p.mass).toFixed(3), 'mL/h') + '   ·   in ' + fmtT(S.ts) + ': ' + E.n(S.o2.toFixed(3), 'mL'); }
    if (p.setup === 'chloro') {
      if (p.cexp === 'bubbles') { const T = waterAt(p, S.ts), I = Iat(p.dist); return E.v('I') + ' ' + E.op('=') + ' ' + E.n(600, '') + ' × ' + E.frac('10²', E.n(p.dist, '') + '²') + ' ' + E.op('=') + ' ' + E.n(I.toFixed(0), 'µmol/m²/s') + '   ·   bubbles ' + E.op('=') + ' ' + E.frac('made − used', '0.041 µmol a bubble') + ' ' + E.op('=') + ' ' + E.frac(E.n(gross(I, p.bicarb, T, p.colour).toFixed(2), '') + ' − ' + E.n(respE(T).toFixed(2), ''), '0.041') + ' ' + E.op('=') + ' ' + E.n(bubbles(p.dist, p.bicarb, T, p.colour).toFixed(1), 'a minute'); }
      if (p.cexp === 'engelmann') return 'oxygen made ' + E.op('∝') + ' light absorbed: ' + E.v('A') + '(450 nm) ' + E.op('=') + ' ' + E.n(Math.round(absorb(450) * 100), '%') + ', ' + E.v('A') + '(550 nm) ' + E.op('=') + ' ' + E.n(Math.round(absorb(550) * 100), '%') + ', ' + E.v('A') + '(675 nm) ' + E.op('=') + ' ' + E.n(Math.round(absorb(675) * 100), '%') + '   ·   bacteria gather as ' + E.v('e') + '<sup>κ·O₂</sup>';
      return 'starch ' + E.op('=') + ' ' + (p.destarch ? '0' : 'what was there') + ' + 0.22 × ' + E.v('t') + E.sub('light') + ' (only where there are chloroplasts and light) ' + E.op('=') + ' ' + E.n(leafStarch({ green: true, lit: true, hours: p.hours, destarch: p.destarch }).toFixed(2), '') + ' in the lit green part';
    }
    const c = cellOf(p);
    return E.v('x') + ' ' + E.op('=') + ' ' + E.v('k') + '√' + E.v('t') + ' ' + E.op('=') + ' ' + E.n(front(S.ts, 20).toFixed(2), 'mm') + '   ·   ' + E.v('R') + E.sub('max') + ' ' + E.op('=') + ' √(' + E.frac(SHAPE_K[p.shape] + E.v('D') + E.v('C'), E.v('q')) + ') ' + E.op('=') + ' √(' + E.frac(SHAPE_K[p.shape] + ' × 2×10⁻⁹ × 0.28', E.n(c.D.q, 'mol/m³/s')) + ') ' + E.op('=') + ' ' + E.n(fmtUm(c.rmax), '');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'membrane') return 'Water moves through the pores toward the side with more dissolved particles that cannot keep up with it — that is osmosis. Each dissolved substance moves too, down its own concentration difference, if it fits the pores: glucose and iodine do, starch never.';
    if (p.setup === 'wall') return 'Water crosses a membrane toward the stronger solution, wall or no wall. The wall does not keep water out: it keeps the cell from bursting, pushing back as the cell fills (turgor). A red cell has no wall; in water it swells until its membrane tears.';
    if (p.setup === 'nucleus') return 'The nucleus sends a long-lasting message into the cell telling it what shape of cap to build. A stalk keeps some of the message it was given; once that runs out, only the nucleus it now has can make more — so its caps turn into that nucleus’s kind.';
    if (p.setup === 'mito') return 'Mitochondria release the energy stored in food, using oxygen and giving out carbon dioxide. Every living cell with them does it — the pea’s as well as the maggot’s. Warmer, the enzymes run faster, until too hot they fall apart.';
    if (p.setup === 'chloro') return p.cexp === 'engelmann' ? 'A chloroplast makes oxygen only with light it absorbs. Chlorophyll absorbs blue and red strongly and passes most green on — which is why leaves look green, and why Engelmann’s bacteria crowd in the red and the blue.' : p.cexp === 'leaf' ? 'Starch is where the sugar a leaf makes is stored. It appears only where there are chloroplasts and light — and only if the old starch was used up first, in the dark.' : 'In a chloroplast, light splits water and gives off its oxygen. More light, more oxygen — until something else runs short: carbon dioxide, or the right temperature. In dim light the plant uses as much as it makes.';
    return 'A cell’s surface brings everything in; its whole volume uses it. Double the size and the surface grows 4 times but the volume 8: each part of it gets half as much. Past a limit the middle cannot be fed in time — so cells stay small, or grow flat or thin.';
  };

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6b-inside-cell',
    grade: 6, unit: '6B', topics: ['B2'],
    subject: 'biology',
    name: 'Inside the Cell — Membranes, Walls and Organelles',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-2', 'NGSS Science and Engineering Practice 2: developing and using models', 'CAST'],
    weight: 'Cells',
    is3D: true,
    autoplay: true,
    bloom: 0.08,
    stageHint: 'Every picture is computed · drag the bench to look round it',
    lede: 'Six experiments that showed what each part of a cell does. Hang a bag of <b>Visking tubing</b> in a beaker and see what crosses its pores. Put red onion and red blood cells in the same salt: only one has a <b>wall</b>. ' +
      'Graft <b>Acetabularia</b> as Hämmerling did and see whose cap grows. Measure a pea’s <b>mitochondria</b> at work in a respirometer. Count <b>Elodea</b>’s bubbles, and watch Engelmann’s bacteria find where <b>chloroplasts</b> make oxygen. ' +
      'Then grow a cell until its middle starves — and see why cells are <b>small</b>.',

    params: preset({}),
    presets: [
      { name: 'Starch and glucose in the bag, iodine outside', params: preset({ fill: 'starch', cIn: 0.55, bath: 'iodine' }) },
      { name: 'The same bag, at 40 °C', params: preset({ fill: 'starch', cIn: 0.55, bath: 'iodine', temp: 40 }) },
      { name: 'A bag of 1 M sucrose in water: it swells', params: preset({ fill: 'sucrose', cIn: 1, bath: 'water', lapse: 300 }) },
      { name: 'Water in the bag, sucrose outside: it shrinks', params: preset({ fill: 'water', bath: 'sucrose', cOut: 0.5 }) },
      { name: 'Salt in the bag: it leaks out instead', params: preset({ fill: 'salt', cIn: 0.5, bath: 'water' }) },
      { name: 'Sucrose both sides, equal: no change', params: preset({ fill: 'sucrose', cIn: 0.5, bath: 'sucrose', cOut: 0.5 }) },
      { name: 'Onion and blood in 0.9 % salt', params: preset({ setup: 'wall', salt: 0.9 }) },
      { name: 'In pure water: the red cells burst', params: preset({ setup: 'wall', salt: 0 }) },
      { name: 'In 3 % salt: plasmolysis and spiky red cells', params: preset({ setup: 'wall', salt: 3 }) },
      { name: 'Half plasmolysed: the onion’s own strength', params: preset({ setup: 'wall', cells: 'onion', salt: 1.1, obj: 10 }) },
      { name: 'Boiled onion in 3 % salt', params: preset({ setup: 'wall', cells: 'onion', treat: 'boiled', salt: 3 }) },
      { name: 'Walls digested away: most burst in 0.65 % salt', params: preset({ setup: 'wall', treat: 'noWall', salt: 0.65 }) },
      { name: 'Cut off the cap: it grows back', params: preset({ setup: 'nucleus', op: 'decap', nuc: 'med' }) },
      { name: 'Cut into three: cap, stalk, base', params: preset({ setup: 'nucleus', op: 'pieces', nuc: 'med' }) },
      { name: 'A young stalk, no nucleus: no cap', params: preset({ setup: 'nucleus', op: 'pieces', nuc: 'med', age: 'young' }) },
      { name: 'Hämmerling’s graft: whose cap?', params: preset({ setup: 'nucleus', op: 'graft', nuc: 'cren', recut: true }) },
      { name: 'The graft left alone', params: preset({ setup: 'nucleus', op: 'graft', nuc: 'cren', recut: false }) },
      { name: 'Two nuclei, one of each', params: preset({ setup: 'nucleus', op: 'two', stalk: 'med', pace: 5 }) },
      { name: 'Germinating peas at 22 °C', params: preset({ setup: 'mito', org: 'peas', bathT: 22 }) },
      { name: 'The bath at 32 °C', params: preset({ setup: 'mito', org: 'peas', bathT: 32 }) },
      { name: 'No KOH: the drop hardly moves', params: preset({ setup: 'mito', org: 'peas', koh: false }) },
      { name: 'Maggots: an animal', params: preset({ setup: 'mito', org: 'maggots', mass: 3, tissue: 'leg' }) },
      { name: 'Boiled peas: dead cells', params: preset({ setup: 'mito', org: 'boiled' }) },
      { name: 'Heart muscle, by electron microscope', params: preset({ setup: 'mito', tissue: 'heart' }) },
      { name: 'A leaf cell: chloroplasts and mitochondria', params: preset({ setup: 'mito', tissue: 'leaf' }) },
      { name: 'Elodea, the lamp at 20 cm', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 20 }) },
      { name: 'The lamp at 60 cm: hardly any bubbles', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 60 }) },
      { name: 'Green light', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 20, colour: 'green' }) },
      { name: 'No bicarbonate', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 15, bicarb: 0 }) },
      { name: 'No heat shield, lamp at 6 cm', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 6, shield: false, lapse: 60 }) },
      { name: 'Engelmann’s spectrum', params: preset({ setup: 'chloro', cexp: 'engelmann', light: 'spectrum' }) },
      { name: 'Engelmann’s spot of light', params: preset({ setup: 'chloro', cexp: 'engelmann', light: 'spot', spot: 55 }) },
      { name: 'Variegated leaf: where is the starch?', params: preset({ setup: 'chloro', cexp: 'leaf', destarch: true, foil: true, hours: 6 }) },
      { name: 'Not destarched: the test fails', params: preset({ setup: 'chloro', cexp: 'leaf', destarch: false, foil: true, hours: 6 }) },
      { name: 'Agar cubes, cut open after 10 minutes', params: preset({ setup: 'size', cut: true, lapse: 60 }) },
      { name: 'Grow a busy cell until its middle starves', params: preset({ setup: 'size', demand: 'busy', lr: 2.4 }) },
      { name: 'The same cell, flattened', params: preset({ setup: 'size', demand: 'busy', lr: 2.4, shape: 'flat' }) },
      { name: 'A frog’s egg: big, and slow', params: preset({ setup: 'size', demand: 'egg', lr: 2.85 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The bag and the beaker', when: is('membrane'), items: [
        { key: 'fill', type: 'select', label: 'In the bag', restructure: R_, options: [{ value: 'starch', label: 'Starch and glucose' }, { value: 'sucrose', label: 'Sucrose' }, { value: 'salt', label: 'Salt' }, { value: 'water', label: 'Just water' }] },
        { key: 'cIn', label: 'Strength in the bag', min: 0, max: 1, step: 0.05, unit: 'M', restructure: R_, when: S => S.p.fill !== 'water', fmt: v => v.toFixed(2) },
        { key: 'bath', type: 'select', label: 'In the beaker', restructure: R_, options: [{ value: 'iodine', label: 'Water with iodine' }, { value: 'water', label: 'Water' }, { value: 'sucrose', label: 'Sucrose' }] },
        { key: 'cOut', label: 'Sucrose in the beaker', min: 0, max: 1, step: 0.05, unit: 'M', restructure: R_, when: S => S.p.bath === 'sucrose', fmt: v => v.toFixed(2) },
        { key: 'temp', label: 'Temperature', min: 10, max: 40, step: 1, unit: '°C' } ] },
      { group: 'The cells and the salt', when: is('wall'), items: [
        { key: 'salt', label: 'Salt around them', min: 0, max: 5, step: 0.05, unit: '%', fmt: v => v.toFixed(2) },
        { key: 'cells', type: 'select', label: 'Look at', display: true, rebuild: true, options: [{ value: 'both', label: 'Both, side by side' }, { value: 'onion', label: 'Red onion skin' }, { value: 'blood', label: 'Red blood cells' }] },
        { key: 'treat', type: 'select', label: 'The onion', restructure: R_, options: [{ value: 'fresh', label: 'Fresh, alive' }, { value: 'boiled', label: 'Boiled first' }, { value: 'noWall', label: 'Walls digested away' }] },
        { key: 'obj', type: 'select', label: 'Objective for the onion', restructure: false, options: [{ value: 10, label: '10×' }, { value: 40, label: '40×' }] } ] },
      { group: 'The operation', when: is('nucleus'), items: [
        { key: 'op', type: 'select', label: 'Do this', restructure: R_, options: [{ value: 'decap', label: 'Cut off the cap' }, { value: 'pieces', label: 'Cut into three pieces' }, { value: 'graft', label: 'Graft a stalk on the other kind' }, { value: 'two', label: 'One stalk, two nuclei' }] },
        { key: 'nuc', type: 'select', label: 'The base, with the nucleus', restructure: R_, when: S => S.p.op !== 'two', options: [{ value: 'med', label: 'A. mediterranea (smooth cap)' }, { value: 'cren', label: 'A. crenulata (notched cap)' }] },
        { key: 'stalk', type: 'select', label: 'The stalk', restructure: R_, when: S => S.p.op === 'two', options: [{ value: 'med', label: 'A. mediterranea' }, { value: 'cren', label: 'A. crenulata' }] },
        { key: 'age', type: 'select', label: 'Cut from a cell that was', restructure: R_, options: [{ value: 'mature', label: 'full grown' }, { value: 'young', label: 'young' }] },
        { key: 'recut', type: 'toggle', label: 'Cut off each new cap' },
        { key: 'pace', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'a day a second' }, { value: 2, label: '2 days a second' }, { value: 5, label: '5 days a second' }] } ] },
      { group: 'The respirometer', when: is('mito'), items: [
        { key: 'org', type: 'select', label: 'In the first vial', options: [{ value: 'peas', label: 'Germinating peas' }, { value: 'maggots', label: 'Blowfly maggots' }, { value: 'boiled', label: 'Boiled peas' }] },
        { key: 'mass', label: 'Mass', min: 2, max: 20, step: 1, unit: 'g' },
        { key: 'bathT', label: 'Water bath', min: 5, max: 45, step: 1, unit: '°C' },
        { key: 'koh', type: 'toggle', label: 'KOH to take up CO₂', restructure: R_ },
        { key: 'tissue', type: 'select', label: 'Electron microscope', restructure: false, options: [{ value: 'pea', label: 'a pea’s seed leaf' }, { value: 'root', label: 'a root-tip cell' }, { value: 'leaf', label: 'a leaf cell' }, { value: 'heart', label: 'heart muscle' }, { value: 'flight', label: 'a hummingbird’s flight muscle' }, { value: 'leg', label: 'leg muscle' }, { value: 'liver', label: 'a liver cell' }, { value: 'fat', label: 'a fat cell' }, { value: 'rbc', label: 'a red blood cell' }] } ] },
      { group: 'The experiment', when: is('chloro'), items: [
        { key: 'cexp', type: 'select', label: 'Try', restructure: R_, rebuild: true, options: [{ value: 'bubbles', label: 'Elodea: count the bubbles' }, { value: 'engelmann', label: 'Engelmann’s bacteria, 1882' }, { value: 'leaf', label: 'A leaf tested for starch' }] },
        { key: 'dist', label: 'Lamp distance', min: 5, max: 80, step: 1, unit: 'cm', when: S => S.p.cexp === 'bubbles' },
        { key: 'colour', type: 'select', label: 'Light', when: S => S.p.cexp === 'bubbles', options: [{ value: 'white', label: 'white' }, { value: 'red', label: 'red LED' }, { value: 'blue', label: 'blue LED' }, { value: 'green', label: 'green LED' }] },
        { key: 'bicarb', label: 'Sodium bicarbonate', min: 0, max: 1, step: 0.05, unit: '%', when: S => S.p.cexp === 'bubbles', fmt: v => v.toFixed(2) },
        { key: 'waterT', label: 'Water', min: 5, max: 40, step: 1, unit: '°C', when: S => S.p.cexp === 'bubbles' },
        { key: 'shield', type: 'toggle', label: 'Heat shield (a beaker of water)', when: S => S.p.cexp === 'bubbles' },
        { key: 'light', type: 'select', label: 'Light on the filament', restructure: R_, rebuild: true, when: S => S.p.cexp === 'engelmann', options: [{ value: 'spectrum', label: 'a spectrum, through a prism' }, { value: 'white', label: 'white' }, { value: 'green', label: 'green only' }, { value: 'spot', label: 'a tiny spot (Spirogyra)' }] },
        { key: 'spot', label: 'Move the spot', min: -150, max: 150, step: 1, unit: 'µm', when: S => S.p.cexp === 'engelmann' && S.p.light === 'spot' },
        { key: 'destarch', type: 'toggle', label: 'Two days in the dark first', when: S => S.p.cexp === 'leaf' },
        { key: 'foil', type: 'toggle', label: 'A strip of foil across a leaf', when: S => S.p.cexp === 'leaf' },
        { key: 'hours', label: 'Hours in the light', min: 0, max: 8, step: 0.5, unit: 'h', when: S => S.p.cexp === 'leaf' },
        { key: 'stage', type: 'select', label: 'Show the leaf', display: true, when: S => S.p.cexp === 'leaf', options: [{ value: 'fresh', label: 'after the light' }, { value: 'boiled', label: 'boiled' }, { value: 'ethanol', label: 'in hot ethanol' }, { value: 'iodine', label: 'with iodine' }] } ] },
      { group: 'Cubes and cells', when: is('size'), items: [
        { key: 'cut', type: 'toggle', label: 'Cut the cubes open', display: true },
        { key: 'lr', label: 'Grow the cell (radius)', min: 0, max: 3.3, step: 0.05, fmt: v => fmtUm(Math.pow(10, v)) },
        { key: 'demand', type: 'select', label: 'A cell that works like', restructure: false, options: Object.keys(DEMAND).map(k => ({ value: k, label: DEMAND[k].name })) },
        { key: 'shape', type: 'select', label: 'Shape', restructure: false, options: [{ value: 'sphere', label: 'round' }, { value: 'flat', label: 'flat, like a pancake' }, { value: 'thread', label: 'long and thin' }] } ] },
      { group: 'Time', when: S => S.p.setup !== 'nucleus' && !(S.p.setup === 'chloro' && S.p.cexp !== 'bubbles'), items: [
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 10, label: '×10' }, { value: 60, label: '×60 (a minute a second)' }, { value: 300, label: '×300 (5 minutes a second)' }] },
        { key: 'seed', label: 'Another sample', min: 1, max: 9, step: 1, restructure: R_, display: true, when: S => S.p.setup === 'wall' || S.p.setup === 'mito' } ] }
    ],

    setup, step, drawStage, onPointer,
    plots: [
      { title: S => ({ membrane: 'The bag’s mass as it goes', wall: 'Which cells change, against salt', nucleus: 'Cap-building substance in the cell', mito: 'The respirometer, read every minute', chloro: S.p.cexp === 'bubbles' ? 'Bubbles against the lamp’s distance' : S.p.cexp === 'engelmann' ? (S.p.light === 'spot' ? 'How much of the spot lights a chloroplast' : 'Where the bacteria gather') : 'Starch against hours of light', size: 'How much of each cube the alkali reached' })[S.p.setup], draw: plot1 },
      { title: S => ({ membrane: S.p.fill === 'starch' ? 'What crossed: glucose out, iodine in' : 'Mass change in 30 minutes, against the difference', wall: 'Volume against salt: with a wall and without', nucleus: 'Each new cap: which kind?', mito: 'Respiration against temperature', chloro: S.p.cexp === 'bubbles' ? 'Oxygen made against light' : S.p.cexp === 'engelmann' ? 'Light absorbed, oxygen made' : 'Starch before and after', size: 'Oxygen from the surface to the middle' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · osmosis in a model cell', params: preset({ fill: 'sucrose', cIn: 0.6, bath: 'water' }),
        q: 'A bag of Visking tubing holds 0.6 M sucrose and hangs in water. The class result for bags like it: about +4 % mass in 30 minutes for every 0.2 M. What % mass does this bag gain in 30 minutes?',
        predict: { label: 'Mass gained in 30 min', unit: '%', tol: 0.12 },
        measure: S => massPct(bagRun(S.p, 30)),
        working: '0.6 M is three steps of 0.2 M: 3 × 4 % ≈ <b>11–12 %</b>. The lab gives 11.0 %: a little less than proportional, because a little sucrose leaks out and the water coming in dilutes what is left.' },
      { source: 'CAST pattern · incipient plasmolysis', params: preset({ setup: 'wall', cells: 'onion', salt: 1.1, obj: 10 }),
        q: 'Red onion sap pulls water with 0.85 MPa. Salt at 1 % pulls with 0.78 MPa. At what salt percentage will about half the cells plasmolyse?',
        predict: { label: 'Salt for half plasmolysed', unit: '%', tol: 0.06 },
        measure: () => PCT_PLAS50,
        working: 'The pull grows in step with the salt: 0.85 ÷ 0.78 × 1 % ≈ <b>1.1 %</b>. There, the solution pulls as hard as the typical cell’s sap; weaker cells plasmolyse first, stronger ones later.' },
      { source: 'CAST pattern · a red cell swelling', params: preset({ setup: 'wall', salt: 0.45 }),
        q: 'A red cell is 90 fL in 290 mOsm plasma; 43 % of it is not water. In 0.45 % salt (145 mOsm) its water part doubles. What volume does it reach?',
        predict: { label: 'Volume', unit: 'fL', tol: 0.04 },
        measure: S => rbcV(S.p.salt),
        working: 'V = 90 × (0.43 + 0.57 × 290 ÷ 145) = 90 × (0.43 + 1.14) ≈ <b>141–143 fL</b> — close to the 148 fL at which a typical cell bursts, which is why about a third burst in 0.45 % salt.' },
      { source: 'CAST pattern · Hämmerling’s first cap', params: preset({ setup: 'nucleus', op: 'graft', nuc: 'cren', recut: true }),
        q: 'A mediterranea stalk holding 20 units of cap substance is grafted onto a crenulata base. Each unit halves in 15 days; the nucleus makes 1 unit a day. After 10 days, what share of the stalk’s substance is crenulata’s — and so of its first cap?',
        predict: { label: 'First cap, crenulata', unit: '%', tol: 0.08 },
        measure: S => { const P = acetRun(S.p.op, S.p.nuc, S.p.age, 12, true); return P[0].caps[0].f * 100; },
        working: 'The stored mediterranea: 20 × ½^(10/15) ≈ 12.6. The crenulata made: about 9 (10 days’ worth, some already fading, plus the base’s own 2 fading). 9.3 ÷ 21.9 ≈ <b>43 %</b>: an in-between cap. Cut it off, and the next is 82 %, then 96 %.' },
      { source: 'CAST pattern · Q10', params: preset({ setup: 'mito', org: 'peas', bathT: 32, mass: 10 }),
        q: '10 g of germinating peas use 0.16 mL of oxygen in 20 minutes at 22 °C. With Q10 = 2.1, how much in 20 minutes at 32 °C?',
        predict: { label: 'Oxygen in 20 min', unit: 'mL', tol: 0.06 },
        measure: S => respRate(S.p.org, S.p.bathT) * S.p.mass * 20 / 60,
        working: 'Q10 = 2.1 means 10 °C warmer, 2.1 times as fast: 0.16 × 2.1 ≈ <b>0.34 mL</b>.' },
      { source: 'CAST pattern · the inverse-square law', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 20 }),
        q: 'A lamp gives 600 µmol of light a square metre a second at 10 cm. How much at 20 cm?',
        predict: { label: 'Light at 20 cm', unit: 'µmol/m²/s', tol: 0.02 },
        measure: S => Iat(S.p.dist),
        working: 'Twice as far, the light spreads over 2² = 4 times the area: 600 ÷ 4 = <b>150</b>. The bubbles fall less than 4 times, because at 10 cm the plant was already short of CO₂, not light.' },
      { source: 'CAST pattern · surface and volume', params: preset({ setup: 'size', cut: true }),
        q: 'Alkali soaks 2 mm into agar in 10 minutes, and the distance grows as the square root of time. How long to reach the middle of a 20 mm cube?',
        predict: { label: 'Time to the middle', unit: 'h', tol: 0.05 },
        measure: () => Math.pow(10 / KF, 2) / 3600,
        working: 'The middle is 10 mm in: 5 times as far as 2 mm, so 5² = 25 times as long: 25 × 10 min = 250 min ≈ <b>4.2 h</b>. A 10 mm cube takes 1 h; a 5 mm one 16 min — why a cell’s parts must be close to its surface.' },
      { source: 'CAST pattern · the largest cell', params: preset({ setup: 'size', demand: 'busy', lr: 2 }),
        q: 'A cell working as hard as muscle uses 0.3 mol of oxygen a cubic metre a second; water holds 0.28 mol/m³ and oxygen diffuses at D = 2 × 10⁻⁹ m²/s. For a ball, R = √(6DC ÷ q). How big can it be?',
        predict: { label: 'Largest radius', unit: 'µm', tol: 0.05 },
        measure: S => Rmax(DEMAND[S.p.demand].q, 'sphere'),
        working: 'R = √(6 × 2×10⁻⁹ × 0.28 ÷ 0.3) = √(1.12×10⁻⁸) m ≈ <b>106 µm</b>. A muscle fibre is about 30 µm across its radius — well inside. Bigger, and its middle would get no oxygen.' }
    ],

    walkthrough: [
      { title: 'What stays in?', ask: 'Starch and glucose are in the bag, iodine outside. Which of the three will you find on the other side after half an hour?', reveal: 'Iodine gets in — the inside turns blue-black — and glucose gets out (Benedict’s turns green, then yellow). Starch never: its molecules are hundreds of times longer than the 2.4 nm pores. A membrane lets small things through and holds big ones.', params: preset({ fill: 'starch', cIn: 0.55, bath: 'iodine' }) },
      { title: 'Osmosis moves water', ask: 'A bag of salt and a bag of sucrose, the same strength, hang in water. Both gain mass — true?', reveal: 'Only the sucrose bag gains much: sucrose barely fits the pores, so water flows in toward it. Salt slips straight through and leaks away, so the difference that would pull water in is gone. Osmosis is water moving — not the salt.', params: preset({ fill: 'salt', cIn: 0.5, bath: 'water' }) },
      { title: 'Does the wall keep water out?', ask: 'In pure water, red blood cells burst. Why doesn’t the onion cell?', reveal: 'Water floods into both. The onion’s wall is fully permeable — it keeps nothing out — but it is strong: as the cell fills, the wall pushes back until no more can come in. That push is turgor, 0.77 MPa: what keeps a plant firm.', params: preset({ setup: 'wall', salt: 0 }) },
      { title: 'Which part chooses?', ask: 'Boil the onion skin and put it in 3 % salt. Does it plasmolyse?', reveal: 'No. The wall is unchanged, but the living membrane is dead: the red leaks out and water and salt go where they like. It is the membrane that sets what crosses, not the wall.', params: preset({ setup: 'wall', cells: 'onion', treat: 'boiled', salt: 3 }) },
      { title: 'Whose cap?', ask: 'A mediterranea stalk grafted onto a crenulata base grows an in-between cap. Cut it off. What grows next?', reveal: 'A crenulata cap — and more so each time. The first was built with instructions the stalk had stored from its old nucleus; they fade (half in 15 days) and the new nucleus sends its own. The nucleus decides the cell’s form.', params: preset({ setup: 'nucleus', op: 'graft', nuc: 'cren', recut: true }) },
      { title: 'Do plants breathe?', ask: 'Plant cells have chloroplasts. Do they need mitochondria?', reveal: 'Yes. Germinating peas take up oxygen in the dark just as maggots do; their cells release energy from stored starch in mitochondria. Chloroplasts make food; mitochondria release its energy — plant cells have both.', params: preset({ setup: 'mito', org: 'peas', tissue: 'leaf' }) },
      { title: 'Why a beaker of water?', ask: 'Why does the lamp shine through a beaker of water on its way to the Elodea?', reveal: 'A filament lamp heats as well as lights. Close up, without the shield, the water warms by several degrees and the plant speeds up for the wrong reason — or, too hot, slows down. The shield keeps temperature the same: a fair test of light alone.', params: preset({ setup: 'chloro', cexp: 'bubbles', dist: 6, shield: false, lapse: 60 }) },
      { title: 'Why are cells small?', ask: 'Grow the cell. What goes wrong when it gets big?', reveal: 'Its volume grows faster than its surface: food and oxygen come in through the surface but are used throughout. Past a few hundred micrometres a busy cell’s middle gets no oxygen at all. Cells stay small, or flat, or thin — or divide.', params: preset({ setup: 'size', demand: 'busy', lr: 2.4 }) }
    ],

    quiz: [
      { q: 'A bag of Visking tubing with starch inside sits in iodine solution. After 20 minutes', options: ['the inside turns blue-black', 'the outside turns blue-black', 'nothing changes colour', 'both turn blue-black'], answer: 0, explain: 'Iodine is small and crosses into the bag, where it meets the starch; starch is too big to cross out.' },
      { q: 'Osmosis is the movement of', options: ['water across a partially permeable membrane', 'salt from high to low concentration', 'any substance through a wall', 'sugar into a cell'], answer: 0, explain: 'Water moves toward the side where more of the dissolved particles cannot follow it.' },
      { q: 'A plant cell in pure water does not burst because', options: ['its wall pushes back as it fills', 'its wall keeps water out', 'it has no membrane', 'its vacuole empties'], answer: 0, explain: 'Water enters, but the strong wall resists: turgor pressure balances the pull.' },
      { q: 'Red blood cells placed in 3 % salt water', options: ['shrink and look spiky', 'swell and burst', 'stay the same', 'grow a wall'], answer: 0, explain: 'The outside is stronger; water leaves the cells and they crenate.' },
      { q: 'In Hämmerling’s graft, later caps took the shape set by', options: ['the nucleus in the base', 'the stalk', 'the seawater', 'the first cap'], answer: 0, explain: 'Once the stalk’s stored instructions ran out, only the nucleus made more.' },
      { q: 'Germinating peas in a respirometer take up oxygen. This shows that plant cells', options: ['respire, using mitochondria', 'photosynthesise in the dark', 'have no mitochondria', 'only need oxygen in light'], answer: 0, explain: 'Every living cell releases energy by respiration; plant cells have mitochondria as well as chloroplasts.' },
      { q: 'Engelmann’s bacteria crowded in the red and blue parts of the spectrum because', options: ['chloroplasts made most oxygen there', 'bacteria like those colours', 'green light kills bacteria', 'the filament was thicker there'], answer: 0, explain: 'Chlorophyll absorbs red and blue light, so oxygen is made where they fall.' },
      { q: 'A 2 cm agar cube compared with a 1 cm cube has', options: ['half the surface area for each unit of volume', 'the same surface area to volume ratio', 'twice the surface area to volume ratio', 'four times the volume'], answer: 0, explain: 'SA : V = 6 ÷ side: 3 per cm against 6 per cm. (Its volume is 8 times as big.)' }
    ],

    notes: '<p><b>The membrane.</b> A cell’s membrane lets some substances through and holds others back — partially permeable. Small molecules (water, oxygen, glucose, iodine) cross; big ones (starch, proteins) cannot. Water moves toward the side with more of the particles that cannot cross: <b>osmosis</b>. Each dissolved substance also moves down its own concentration difference, if it fits.</p>' +
      '<p><b>The wall.</b> A plant cell’s cellulose wall lets water and salts through freely. It does not keep water out; it keeps the cell from bursting. As water fills the cell the wall pushes back — <b>turgor</b> — which holds a plant up. In strong salt the living protoplast shrinks away from its wall: <b>plasmolysis</b>. A red blood cell has no wall: in water it swells and bursts.</p>' +
      '<p><b>The nucleus.</b> Hämmerling (1930s–50s) cut and grafted the giant single-celled alga <i>Acetabularia</i>. A piece without its nucleus can grow one cap from instructions it has stored, but never another; a graft’s caps come to match the nucleus in its base. The nucleus holds the instructions for the cell.</p>' +
      '<p><b>Mitochondria and chloroplasts.</b> Mitochondria release the energy in food using oxygen (respiration) — in plant and animal cells alike; cells that work hard, like heart muscle, are packed with them. Chloroplasts, in green plant cells only, use light to make food and give off oxygen; they absorb red and blue light best (Engelmann, 1882).</p>' +
      '<p><b>Size.</b> Everything a cell needs comes in through its surface and is used throughout its volume. Bigger, the volume grows faster than the surface, and the middle is further from it: diffusion takes as long as the <i>square</i> of the distance. Cells stay small, flat or thin.</p>' +
      '<p><b>The traps.</b> “Osmosis moves salt” — it moves water. “The wall keeps water out” — it holds the cell together. “Plant cells have no mitochondria” — they have both.</p>'
  });

  L.models = L.models || {};
  L.models['g6b-inside-cell'] = { bagStart, bagStep, bagRun, massPct, cIn, cOut, bagMass, benedict, SOLUTES, TUBE, osmNaCl, piOut, walled, freeProto, rbcV, fracPlas, fracBurstProto, fracLysed, PCT_PLAS50, pctLysed50, ONION, RBC, acetPieces, acetStep, acetRun, ACET, respRate, reading, drift, RESP, TISSUE, Iat, gross, respE, bubbles, heatUp, compensation, absorb, action, spotOnRibbon, leafStarch, iodineBlue, front, pinkFrac, KF, Rmax, coreOf, o2At, shapeOf, cellOf, DEMAND, BASE: () => preset({}) };
})(window.InsightLab);
