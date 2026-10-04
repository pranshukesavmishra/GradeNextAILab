/* ============================================================
   GRADE 7 · UNIT A · ATOMS AND THE STRUCTURE OF MATTER
   7A-1  The Particle Detective
   (A1.1 Reviewing the particle model; A1.2 Why chemistry needs a sharper
    picture; A1.3 Evidence that particles are real; A1.4 Particles versus
    atoms; A1.5 Scale of the atom)

   Five benches, each the experiment that made the case:
     review   — a permanganate crystal in still water, bromine in a gas jar:
                particles move by themselves, faster when hot, and only air
                slows the bromine down (Stokes–Einstein, Fuller, Knudsen).
     sharper  — 50 mL of ethanol and 50 mL of water make 96.4 mL: the mass
                stays, the volume does not (CRC densities); marbles and sand
                show why — particles of different sizes and kinds.
     evidence — Perrin 1908: gamboge grains under the microscope. Their
                random steps and the way they settle each give Avogadro's
                number from the student's own counts.
     atoms    — a Hofmann voltameter: water's particle comes apart into
                two gases, 2 : 1 by volume, 1 : 8 by mass (Faraday's law).
     scale    — the oil film: one drop on water spreads one molecule thick,
                and a ruler measures a molecule (Rayleigh 1890).
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G7A, MEAS, MICRO, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, A7 = () => window.G7A;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k], norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  /* ============================================================
     CONSTANTS (CODATA 2018, exact where defined)
     ============================================================ */
  const KB = 1.380649e-23, NA = 6.02214076e23, RG = 8.314462618, G0 = 9.80665, FAR = 96485.33212;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  function gauss(r) { let u = 0; while (u < 1e-9) u = r(); const v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  /* Viscosity of water and of glycerol–water, Pa·s — Cheng (2008), Ind. Eng. Chem. Res. 47, 3285.
     T in °C, w the mass fraction of glycerol. At w = 0 it is water: 1.005 mPa·s at 20 °C. */
  function eta(Tc, w) {
    w = clamp(w || 0, 0, 1);
    const mw = 1.790 * Math.exp((-1230 - Tc) * Tc / (36100 + 360 * Tc)), mg = 12100 * Math.exp((-1233 + Tc) * Tc / (9900 + 70 * Tc));
    if (w === 0) return mw * 1e-3;
    const a = 0.705 - 0.0017 * Tc, b = (4.9 + 0.036 * Tc) * Math.pow(a, 2.5);
    const al = 1 - w + a * b * w * (1 - w) / (a * w + b * (1 - w));
    return Math.pow(mw, al) * Math.pow(mg, 1 - al) * 1e-3;
  }

  /* ============================================================
     1. REVIEW — particles that move: a permanganate crystal in still water, bromine in a gas jar
     Ink: D(T) = D₂₅ · (T/298.15) · η₂₅/η(T) (Stokes–Einstein scaling), D₂₅ = 1.632 × 10⁻⁹ m²/s for
     MnO₄⁻ (limiting ionic conductivity, CRC). The crystal's mass spreads as a half-space Gaussian;
     the eye sees the cloud out to where it falls below 0.5 mg/L, so the visible cloud grows, then
     fades. Bromine: Fuller's equation for D in air (diffusion volumes Br₂ 67.2, air 20.1), joined to
     Knudsen flight in the 6 cm jar by Bosanquet's rule, 1/D = 1/D_air + 1/D_Kn, D_Kn = v̄·d/3: take
     the air away and the molecules fly straight up at v̄ = √(8RT/πM).
     ============================================================ */
  const INK = { D25: 1.632e-9, cVis: 0.5e-3, M: 0.158034 };     // m²/s; kg/m³ (0.5 mg/L); kg/mol
  const BR2 = { M: 0.159808, v: 67.2, jarD: 0.06, jarH: 0.15 };
  const AIR = { M: 0.028965, v: 20.1 };
  const Dink = Tc => INK.D25 * ((Tc + 273.15) / 298.15) * eta(25) / eta(Tc);
  /* the visible radius of the cloud from m kg released at the floor, after t s: c = 2m/(4πDt)^{3/2}·e^{−r²/4Dt} */
  function inkRadius(t, mKg, Tc) {
    if (t <= 0) return 0;
    const D = Dink(Tc), peak = 2 * mKg / Math.pow(4 * Math.PI * D * t, 1.5), Lg = Math.log(peak / INK.cVis);
    return Lg > 0 ? Math.sqrt(4 * D * t * Lg) : 0;
  }
  const inkPeak = (t, mKg, Tc) => t > 0 ? 2 * mKg / Math.pow(4 * Math.PI * Dink(Tc) * t, 1.5) : Infinity;
  const vbar = (Tc, M) => Math.sqrt(8 * RG * (Tc + 273.15) / (Math.PI * M));
  /* Fuller, Schettler & Giddings (1966): D in cm²/s with T in K and p in atm → m²/s */
  function Dfuller(Tc, pAtm) { const T = Tc + 273.15; return 1e-4 * 1.00e-3 * Math.pow(T, 1.75) * Math.sqrt(1 / (BR2.M * 1000) + 1 / (AIR.M * 1000)) / (pAtm * Math.pow(Math.cbrt(BR2.v) + Math.cbrt(AIR.v), 2)); }
  const Dknudsen = Tc => vbar(Tc, BR2.M) * BR2.jarD / 3;
  const Dbr = (Tc, pAtm) => 1 / (1 / Dfuller(Tc, Math.max(pAtm, 1e-12)) + 1 / Dknudsen(Tc));
  /* mean free path of a bromine molecule among air molecules, m (collision diameter ≈ 0.40 nm) */
  const freePath = (Tc, pAtm) => KB * (Tc + 273.15) / (Math.SQRT2 * Math.PI * Math.pow(0.40e-9, 2) * pAtm * 101325);
  /* two jars mouth to mouth, 30 cm of gas; the lower half starts brown. Backward-Euler on 60 cells,
     zero flux at both ends — stable at any step, so the same code runs the evacuated jar. */
  const NZ = 60;
  function jarStart() { const c = new Float64Array(NZ); for (let i = 0; i < NZ / 2; i++) c[i] = 1; return { c, t: 0 }; }
  function jarStep(J, D, dt) {
    const dz = 2 * BR2.jarH / NZ, lam = D * dt / (dz * dz), a = new Float64Array(NZ), b = new Float64Array(NZ), cc = new Float64Array(NZ), d = J.c;
    for (let i = 0; i < NZ; i++) { a[i] = i > 0 ? -lam : 0; cc[i] = i < NZ - 1 ? -lam : 0; b[i] = 1 + (i > 0 ? lam : 0) + (i < NZ - 1 ? lam : 0); }
    for (let i = 1; i < NZ; i++) { const m = a[i] / b[i - 1]; b[i] -= m * cc[i - 1]; d[i] -= m * d[i - 1]; }
    d[NZ - 1] /= b[NZ - 1]; for (let i = NZ - 2; i >= 0; i--) d[i] = (d[i] - cc[i] * d[i + 1]) / b[i];
    J.t += dt;
  }
  function jarAdvance(J, D, T) { const dz = 2 * BR2.jarH / NZ, hMax = Math.max(1e-7, 4 * dz * dz / D); let left = T, n = 0; while (left > 1e-12 && n < 300) { const h = Math.min(hMax, left); jarStep(J, D, h); left -= h; n++; } if (left > 1e-12) jarStep(J, D, left); }
  /* the brown at the very top of the upper jar, as a fraction of where it ends (½) */
  const jarTop = J => J.c[NZ - 1] / 0.5;
  /* time for the top of the upper jar to reach half its final colour */
  const _half = {};
  function jarHalfTime(Tc, pAtm) { const k = Tc.toFixed(2) + '|' + pAtm.toPrecision(6); if (_half[k] == null) { if (Object.keys(_half).length > 400) Object.keys(_half).forEach(x => delete _half[x]); _half[k] = jarHalfTime0(Tc, pAtm); } return _half[k]; }
  function jarHalfTime0(Tc, pAtm) { const D = Dbr(Tc, pAtm), J = jarStart(), Lz = 2 * BR2.jarH, h = Lz * Lz / D / 4000; for (let k = 0; k < 40000; k++) { jarStep(J, D, h); if (jarTop(J) >= 0.5) return J.t; } return Infinity; }

  /* ============================================================
     2. SHARPER — 50 mL + 50 mL ≠ 100 mL
     Ethanol–water densities at 20 °C every 5 % by mass (CRC Handbook, "Concentrative properties
     of aqueous solutions"); a monotone cubic through them. Marbles and sand: the Furnas limit for a
     large size ratio — the small grains fill the voids of the large: V = max(V_L, V_S + φ_L·V_L).
     ============================================================ */
  const RHO_EW = [0.99820, 0.98938, 0.98187, 0.97514, 0.96864, 0.96168, 0.95382, 0.94494, 0.93518, 0.92472, 0.91384, 0.90258, 0.89113, 0.87948, 0.86766, 0.85564, 0.84344, 0.83095, 0.81797, 0.80424, 0.78934];
  const RHO_E = 0.78934, RHO_W = 0.99820, PHI_MARBLE = 0.62, PHI_SAND = 0.60;
  function rhoEW(w) {
    const x = clamp(w, 0, 1) * 20, i = Math.min(19, Math.floor(x)), u = x - i, y = RHO_EW;
    const m = k => k <= 0 ? y[1] - y[0] : k >= 20 ? y[20] - y[19] : (y[k + 1] - y[k - 1]) / 2;
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    return h00 * y[i] + h10 * m(i) + h01 * y[i + 1] + h11 * m(i + 1);
  }
  /* what you get when vA mL of the first is fully mixed with vB mL of the second */
  function mixOf(pair, vA, vB) {
    if (pair === 'ethanol') { const mA = vA * RHO_E, mB = vB * RHO_W, m = mA + mB; if (m <= 0) return { V: 0, m: 0, rho: RHO_W, w: 0 }; const w = mA / m, rho = rhoEW(w); return { V: m / rho, m, rho, w }; }
    if (pair === 'water') { const m = (vA + vB) * RHO_W; return { V: vA + vB, m, rho: RHO_W, w: 0 }; }
    // marbles (A) and sand (B), as bulk volumes; glass 2.50 and quartz 2.65 g/cm³; piles 62 % and 60 % solid
    const m = vA * PHI_MARBLE * 2.5 + vB * PHI_SAND * 2.65, V = Math.max(vA, vB + PHI_MARBLE * vA);
    return { V, m, rho: V > 0 ? m / V : 0, w: 0 };
  }
  /* mixing: the pour mixes 15 %; a glass rod finishes it in seconds; left alone, only diffusion across
     the 5 cm column mixes it — τ = L²/(π²D), D = 1.2 × 10⁻⁹ m²/s: days */
  const TAU_MIX = { stir: 2.5, still: 0.05 * 0.05 / (Math.PI * Math.PI * 1.2e-9) };
  const mixedAt = (t, stir) => 1 - 0.85 * Math.exp(-t / (stir ? TAU_MIX.stir : TAU_MIX.still));

  /* ============================================================
     3. EVIDENCE — Perrin, 1908–09: gamboge grains in water
     Each grain's step in each axis is Gaussian with ⟨x²⟩ = 2Dt, D = RT/(N_A·6πηr). Perrin turned it
     round: N_A = RTt/(3πηr⟨x²⟩). And grains that settle: n(h) = n₀·e^{−m′gh/kT}, m′ = (4/3)πr³(ρ−ρ_w).
     Gamboge 1.194 g/cm³ (Perrin's own value); his grains 0.212 µm (settling) and 0.367 µm (tracks).
     ============================================================ */
  const GAMB = { rho: 1194 };
  const rhoWater = Tc => 1000 * (1 - (Tc + 288.9414) / (508929.2 * (Tc + 68.12963)) * Math.pow(Tc - 3.9863, 2));
  const Dgrain = (Tc, rUm, w) => KB * (Tc + 273.15) / (6 * Math.PI * eta(Tc, w) * rUm * 1e-6);
  const scaleHeight = (Tc, rUm) => KB * (Tc + 273.15) / ((4 / 3) * Math.PI * Math.pow(rUm * 1e-6, 3) * (GAMB.rho - rhoWater(Tc)) * G0);
  /* N grains, tracked K times at intervals dt: per-axis displacements, µm */
  function perrinTracks(seed, n, K, dt, Tc, rUm, w) {
    const r = rng(seed), s = Math.sqrt(2 * Dgrain(Tc, rUm, w) * dt) * 1e6, out = [];
    for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) out.push(gauss(r) * s, gauss(r) * s);
    return out;
  }
  const meanSq = a => a.reduce((u, v) => u + v * v, 0) / Math.max(1, a.length);
  const avogadroFromTracks = (msqUm2, dt, Tc, rUm, w) => RG * (Tc + 273.15) * dt / (3 * Math.PI * eta(Tc, w) * rUm * 1e-6 * msqUm2 * 1e-12);
  /* counts at four levels of a 100 µm cell, as Perrin counted them through a shallow-focus objective */
  const LEVELS = [5, 35, 65, 95];
  function settleCounts(seed, Tc, rUm, nRead, n0) {
    const r = rng(seed), H = scaleHeight(Tc, rUm) * 1e6;
    return LEVELS.map(h => { const mean = n0 * nRead * Math.exp(-(h - 5) / H); return Math.max(0, Math.round(mean + gauss(r) * Math.sqrt(mean))); });
  }
  /* least squares of ln n against h → scale height → N_A = RT/(m′g·H) */
  function avogadroFromCounts(counts, Tc, rUm) {
    const pts = counts.map((c, i) => [LEVELS[i] * 1e-6, Math.log(Math.max(c, 0.5))]), n = pts.length;
    const mx = pts.reduce((u, q) => u + q[0], 0) / n, my = pts.reduce((u, q) => u + q[1], 0) / n;
    const sl = pts.reduce((u, q) => u + (q[0] - mx) * (q[1] - my), 0) / pts.reduce((u, q) => u + (q[0] - mx) * (q[0] - mx), 0);
    const H = -1 / sl, mg = (4 / 3) * Math.PI * Math.pow(rUm * 1e-6, 3) * (GAMB.rho - rhoWater(Tc)) * G0;
    return { H, NA: H > 0 ? RG * (Tc + 273.15) / (mg * H) : Infinity };
  }

  /* ============================================================
     4. ATOMS — a Hofmann voltameter: the particle of water is made of smaller particles
     Faraday: n(H₂) = It/2F, n(O₂) = It/4F; each gas at p = p_atm − p_water(T) (Buck 1981).
     Current: I = (V − 1.23 V − 0.6 V overpotential)/R, R = L/κA; κ of sodium sulfate from its molar
     conductivity (≈ 130 S cm²/mol at 0.5 M → 6.5 S/m), pure water 5.5 µS/m.
     ============================================================ */
  const CELLV = { L: 0.09, A: 1.6e-4, E0: 1.23, over: 0.6 };
  const kappa = c => 5.5e-6 + 18.5 * c / (1 + 0.6 * Math.sqrt(c));       // S/m: 6.5 at 0.5 M
  const pWater = Tc => 0.61121 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc))) * 1000;   // Pa, Buck
  function current(V, c) { const R = CELLV.L / (kappa(c) * CELLV.A), drive = V - CELLV.E0 - CELLV.over; return drive > 0 ? drive / R : 0; }
  const gasVol = (mol, Tc) => mol * RG * (Tc + 273.15) / (101325 - pWater(Tc)) * 1e6;   // mL
  const molarVol = Tc => RG * (Tc + 273.15) / (101325 - pWater(Tc)) * 1000;          // L/mol

  /* ============================================================
     5. SCALE — the oil film. A drop of oleic acid in ethanol on water: the ethanol leaves, the acid
     spreads to one molecule thick (area 0.46 nm² a molecule; M 282.46 g/mol, 0.895 g/cm³). Olive oil
     (triolein, three chains: 1.30 nm²) spreads too; paraffin oil cannot — no water-loving end — and sits
     as a lens 0.4 mm thick.
     ============================================================ */
  const OILS = {
    oleic: { name: 'oleic acid', M: 282.46, rho: 0.895, a: 0.46 },
    olive: { name: 'olive oil', M: 885.4, rho: 0.911, a: 1.30 },
    paraffin: { name: 'paraffin oil', M: 350, rho: 0.85, lens: 0.4e-3 }
  };
  const monoThick = k => { const o = OILS[k]; return o.lens || (o.M / o.rho * 1e-6 / NA) / (o.a * 1e-18); };     // m
  /* oil volume (m³) from the dropper: drops of 1/dpm mL, each 1 part oil in `dil` of solution */
  const oilVol = (drops, dpm, dil) => drops / dpm * 1e-6 / dil;
  function film(p) {
    const o = OILS[p.oil], V = oilVol(Math.round(p.drops), p.dpm, Math.pow(10, p.ldil)), h = monoThick(p.oil), A = V / h, d = Math.sqrt(4 * A / Math.PI);
    const tray = p.tray === 'pond' ? { w: 60, l: 34 } : { w: 0.30, l: 0.45 };
    return { V, h, A, d, tray, full: A > tray.w * tray.l * 0.6, molecules: V * o.rho * 1e6 / o.M * NA };
  }


  /* ============================================================
     THE MAGNIFIED VIEWS — small particle systems, stepped in step() so a run is deterministic
     ============================================================ */
  /* a liquid slice, LQ pm square, walls all round: Brownian dynamics with soft contact.
     Each molecule's random step has variance 2·D·h, with D scaled from the model's D(T) —
     the same Stokes–Einstein law that spreads the ink on the bench. */
  const LQ = 2800;
  const RAD = { w: 150, ion: 200, e: 190, br: 250, n2: 185, o2: 180 };
  function liqStart(seed, ions) {
    const r = rng(seed), p = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) p.push({ x: (i + 0.5) / 9 * LQ + (r() - 0.5) * 50, y: (j + 0.5) / 9 * LQ + (r() - 0.5) * 50, a: r() * TAU, t: (r() - 0.5) * 1.4, k: 'w' });
    // the crystal's face is at the bottom: its ions start packed there
    p.map((q, i) => [Math.hypot(q.x - LQ / 2, q.y - LQ * 0.92), i]).sort((a, b) => a[0] - b[0]).slice(0, ions).forEach(([, i]) => { p[i].k = 'ion'; });
    return { p, cx: LQ / 2, cy: LQ / 2, L: LQ, r: rng(seed * 31 + 7) };
  }
  function bdStep(sys, h, Drel, o) {
    o = o || {};
    const p = sys.p, n = p.length, r = sys.r, L = sys.L, Lh = sys.H || L, g = o.g || 0;
    const fx = new Float64Array(n), fy = new Float64Array(n);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = p[j].x - p[i].x, dy = p[j].y - p[i].y, d0 = RAD[p[i].k] + RAD[p[j].k] - (o.squeeze || 0), d2 = dx * dx + dy * dy;
      if (d2 >= d0 * d0) continue;
      const d = Math.sqrt(d2) || 1, f = (d0 - d) / d;
      fx[i] -= dx * f; fy[i] -= dy * f; fx[j] += dx * f; fy[j] += dy * f;
    }
    for (let i = 0; i < n; i++) {
      const q = p[i], rq = RAD[q.k], mob = q.k === 'ion' ? 0.6 : q.k === 'e' ? 0.75 : 1;
      const s = Math.sqrt(2 * 9000 * Drel * mob * h);           // pm: water molecules wander ≈ 95 pm/√s on screen at 20 °C
      q.x += fx[i] * 0.35 + gauss(r) * s; q.y += fy[i] * 0.35 + gauss(r) * s + g * (o.heavy && o.heavy[q.k] || 1) * h;
      q.a += gauss(r) * 0.6 * Math.sqrt(Drel * h * 10); q.t = clamp(q.t + gauss(r) * 0.1 * Math.sqrt(Drel), -0.8, 0.8);
      q.x = clamp(q.x, rq, L - rq); q.y = clamp(q.y, rq, Lh - rq);
    }
  }
  /* a gas slice, GW × GH pm: hard molecules on straight flights, elastic collisions, walls.
     Speeds are the real mean speeds √(8RT/πM), slowed 10¹¹ times so the eye can follow. */
  const GW = 7000, GH = 9000, SLOW = 1e-11 * 1e12;   // m/s → pm/s after slowing 10¹¹
  function gasStart(seed, Tc, pAtm) {
    const r = rng(seed), p = [], nAir = Math.round(46 * clamp(pAtm, 0, 1));
    const put = (k, y0, y1, M) => { for (let tries = 0; tries < 400; tries++) { const x = RAD[k] + r() * (GW - 2 * RAD[k]), y = y0 + r() * (y1 - y0); if (p.every(q => Math.hypot(q.x - x, q.y - y) > RAD[k] + RAD[q.k] + 20)) { const v = vbar(Tc, M) * SLOW / 1.2533; p.push({ x, y, vx: gauss(r) * v * 0.8, vy: gauss(r) * v * 0.8, a: r() * TAU, t: 0, k, m: M }); return; } } };
    for (let i = 0; i < 12; i++) put('br', GH * 0.55, GH - 300, BR2.M);
    for (let i = 0; i < nAir; i++) put(r() < 0.79 ? 'n2' : 'o2', 300, GH - 300, 0.0289);
    return { p, cx: GW / 2, cy: GH / 2, L: GW, H: GH, hits: 0 };
  }
  function gasStep(sys, h) {
    const p = sys.p, n = p.length;
    for (let i = 0; i < n; i++) {
      const q = p[i], rq = RAD[q.k];
      q.x += q.vx * h; q.y += q.vy * h; q.a += h * 2;
      if (q.x < rq) { q.x = rq; q.vx = Math.abs(q.vx); } if (q.x > GW - rq) { q.x = GW - rq; q.vx = -Math.abs(q.vx); }
      if (q.y < rq) { q.y = rq; q.vy = Math.abs(q.vy); } if (q.y > GH - rq) { q.y = GH - rq; q.vy = -Math.abs(q.vy); }
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = p[i], b = p[j], dx = b.x - a.x, dy = b.y - a.y, d0 = RAD[a.k] + RAD[b.k], d2 = dx * dx + dy * dy;
      if (d2 >= d0 * d0) continue;
      const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d, rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rv >= 0) continue;
      const J = 2 * rv / (1 / a.m + 1 / b.m);
      a.vx += J / a.m * nx; a.vy += J / a.m * ny; b.vx -= J / b.m * nx; b.vy -= J / b.m * ny;
      const push = (d0 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      sys.hits++;
    }
  }
  /* a column of two kinds poured one on the other, settling under gravity; a shake mixes them */
  function packStart(seed, pair, vA, vB) {
    const r = rng(seed), p = [];
    if (pair === 'beads') {
      // marbles (bottom, as they were poured first) and sand on top; the sand grains drawn 3 times smaller than a marble
      RAD.m = 260; RAD.s = 86;
      const W = 2400, nM = Math.round(18 * vA / 50), nS = Math.round(150 * vB / 50);
      let y = 2 * RAD.m * 0 + 80;
      for (let i = 0; i < nM; i++) { const row = Math.floor(i / 4), col = i % 4; p.push({ x: RAD.m + col * (W - 2 * RAD.m) / 3 + (row % 2 ? 60 : -60), y: RAD.m + row * 2 * RAD.m * 0.95 + r() * 40, a: 0, t: 0, k: 'm' }); y = Math.max(y, RAD.m + row * 2 * RAD.m * 0.95 + RAD.m); }
      for (let i = 0; i < nS; i++) { const row = Math.floor(i / 13), col = i % 13; p.push({ x: RAD.s + col * (W - 2 * RAD.s) / 12 + r() * 30, y: y + RAD.s + row * 2 * RAD.s + r() * 30, a: 0, t: 0, k: 's' }); }
      return { p, cx: W / 2, L: W, H: 9000, r: rng(seed * 17 + 3) };
    }
    // water at the bottom, the lighter liquid poured on top
    const W = 2400, nW = Math.round(36 * vB / 50), nE = Math.round(26 * vA / 50), top = pair === 'water' ? 'w' : 'e';
    let row = 0, col = 0;
    const lay = (k, n, step) => { for (let i = 0; i < n; i++) { p.push({ x: RAD[k] + col * step + r() * 30, y: 200 + row * step * 0.9 + r() * 30, a: r() * TAU, t: (r() - 0.5), k, tint: k === 'w' && pair === 'water' && p.length >= nW ? 1 : 0 }); col++; if (RAD[k] + col * step > W - RAD[k]) { col = 0; row++; } } };
    lay('w', nW, 2 * RAD.w * 1.02); col = 0; row++; lay(top, nE, 2 * RAD[top] * 1.02);
    return { p, cx: W / 2, L: W, H: 9000, r: rng(seed * 17 + 3) };
  }
  RAD.m = 260; RAD.s = 86;
  /* where the top of a settled column is: the mean of the highest few, pm */
  function packTop(sys) { const ys = sys.p.map(q => q.y + RAD[q.k]).sort((a, b) => b - a); const k = Math.min(6, ys.length); return ys.slice(0, k).reduce((u, v) => u + v, 0) / Math.max(1, k); }
  /* how mixed: the share of each kind's nearest neighbours that are the other kind */
  function packMixed(sys) { const p = sys.p; let other = 0, n = 0; p.forEach((q, i) => { let best = 1e9, bk = null; p.forEach((u, j) => { if (j === i) return; const d = Math.hypot(u.x - q.x, u.y - q.y) - RAD[u.k]; if (d < best) { best = d; bk = u.k; } }); n++; if (bk !== q.k) other++; }); return n ? other / n : 0; }

  /* Perrin's microscope: grains in a 60 µm field (tracks) or a 100 µm deep cell seen from the side (settling) */
  const FIELD = 60, CELLH = 100;
  function grainsStart(S) {
    const p = S.p, r = rng(4000 + p.seed * 97), G = [];
    if (p.pexp === 'track') { for (let i = 0; i < Math.round(p.nG); i++) G.push({ x: 6 + r() * (FIELD - 12), y: 6 + r() * (FIELD - 12), tr: [] }); G.forEach(g => g.tr.push([g.x, g.y])); }
    else for (let i = 0; i < 700; i++) G.push({ x: r() * FIELD, y: r() * CELLH });        // y up from the floor; shaken: uniform
    S.grains = G; S._gr = r; S.disp = []; S.nextRec = p.dt; S.reads = [0, 0, 0, 0]; S.nReads = 0;
  }
  function grainsStep(S, h) {
    const p = S.p, r = S._gr, D = Dgrain(p.T, p.rad, p.gly / 100) * 1e12;           // µm²/s
    if (p.pexp === 'track') {
      let left = h;
      while (left > 1e-9) {
        const hh = Math.min(left, S.nextRec - S.ts, p.dt / 6), s = Math.sqrt(2 * D * hh);
        S.grains.forEach(g => { g.x += gauss(r) * s; g.y += gauss(r) * s; });
        S.ts += hh; left -= hh;
        if (S.ts >= S.nextRec - 1e-9) {
          S.grains.forEach(g => { const L0 = g.tr[g.tr.length - 1]; S.disp.push(g.x - L0[0], g.y - L0[1]); g.tr.push([g.x, g.y]); if (g.tr.length > 60) g.tr.shift(); });
          S.nextRec += p.dt;
        }
      }
    } else {
      // sedimentation velocity v = m′g/(6πηr) = D·m′g/kT: a drift down, Brownian steps, a floor and a ceiling
      const v = D / (scaleHeight(p.T, p.rad) * 1e6), s = Math.sqrt(2 * D * h);
      S.grains.forEach(g => { g.y += -v * h + gauss(r) * s; g.x += gauss(r) * s; if (g.y < 0) g.y = -g.y; if (g.y > CELLH) g.y = 2 * CELLH - g.y; g.x = ((g.x % FIELD) + FIELD) % FIELD; });
      S.ts += h;
      // a reading: count the grains within ±1.5 µm of each focal level (a shallow objective), every interval
      while (S.ts >= S.nextRec) { LEVELS.forEach((lv, i) => { S.reads[i] += S.grains.filter(g => Math.abs(g.y - lv) < 1.5).length; }); S.nReads++; S.nextRec += p.dt; }
    }
  }
  const trackNA = S => S.disp.length >= 2 ? avogadroFromTracks(meanSq(S.disp), S.p.dt, S.p.T, S.p.rad, S.p.gly / 100) : NaN;
  const settleNA = S => S.nReads > 0 && S.reads.every(c => c > 0) ? avogadroFromCounts(S.reads, S.p.T, S.p.rad) : { H: NaN, NA: NaN };

  /* ============================================================
     SET-UPS, PARAMETERS, PRESETS
     ============================================================ */
  const SETUPS = [
    { value: 'review', label: 'Particles on the move', teaches: ['A1.1'] },
    { value: 'sharper', label: '50 mL + 50 mL = ?', teaches: ['A1.2'] },
    { value: 'evidence', label: 'Perrin: counting the uncountable', teaches: ['A1.3'] },
    { value: 'atoms', label: 'Pulling water apart', teaches: ['A1.4'] },
    { value: 'scale', label: 'Measuring a molecule with a ruler', teaches: ['A1.5'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'review', seed: 1, lapse: 60,
    what: 'ink', T: 20, mg: 5, lp: 0,
    pair: 'ethanol', vA: 50, vB: 50, stir: true,
    pexp: 'track', rad: 0.367, gly: 0, dt: 30, nG: 20,
    volts: 12, conc: 0.5, look: 'electrode',
    oil: 'oleic', ldil: 3, dpm: 50, drops: 1, tray: 'tray', zoom: 'molecules'
  };
  const SETUP_DEFAULTS = { review: { lapse: 60, T: 20 }, sharper: { lapse: 1 }, evidence: { lapse: 10, T: 17 }, atoms: { lapse: 10, T: 20 }, scale: { lapse: 1 } };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  const HOMES = {
    ink: { theta: -1.25, phi: 0.3, dist: 0.62, target: [0.0, 0.0, 0.15] },
    bromine: { theta: -1.2, phi: 0.22, dist: 0.72, target: [0.05, 0.0, 0.15] },
    sharper: { theta: -1.35, phi: 0.3, dist: 0.78, target: [0.0, 0.0, 0.11] },
    evidence: { theta: -1.0, phi: 0.3, dist: 0.8, target: [0.0, 0.0, 0.16] },
    atoms: { theta: -1.3, phi: 0.18, dist: 0.72, target: [0.07, 0.0, 0.19] },
    scale: { theta: -1.4, phi: 0.62, dist: 0.85, target: [0.0, 0.02, 0.03] }
  };
  const homeKey = p => p.setup === 'review' ? p.what : p.setup;
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    const idx = SETUPS.findIndex(s => s.value === p.setup);
    S.t = 0; S.ts = 0; S.hist = []; S._lastRec = -1; S.sys = null; S.grains = null; S.jar = null;
    S.molH = 0; S.molO = 0; S.nH = 0; S.nO = 0; S.bub = []; S.spread = 0; S.mixT = 0;
    const seed = 1000 + p.seed * 7919 + idx * 131;
    if (p.setup === 'review') {
      if (p.what === 'ink') S.sys = liqStart(seed, 5);
      else { S.jar = jarStart(); S.sys = gasStart(seed, p.T, Math.pow(10, p.lp)); }
    }
    if (p.setup === 'sharper') S.sys = packStart(seed, p.pair, p.vA, p.vB);
    if (p.setup === 'evidence') grainsStart(S);
    if (p.setup === 'atoms') { S.sys = liqStart(seed, 0); S._ar = rng(seed + 5); }
    record(S, true);
    const hk = homeKey(p);
    if (!S.cam || S.camFor !== hk) { const h = HOMES[hk]; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: 0.72 }); S.cam.minDist = 0.2; S.cam.maxDist = 3; S.camFor = hk; }
  }
  /* the history each plot draws from */
  function record(S, force) {
    const p = S.p, every = { review: p.what === 'ink' ? 30 : 5, sharper: 0.5, evidence: p.dt, atoms: 10, scale: 0.1 }[p.setup];
    const m = Math.floor(S.ts / every + 1e-9); if (!force && m === S._lastRec) return; S._lastRec = m;
    if (p.setup === 'review') S.hist.push(p.what === 'ink' ? [S.ts, inkRadius(S.ts, p.mg * 1e-6, p.T) * 1000] : [S.ts, jarTop(S.jar)]);
    else if (p.setup === 'sharper') S.hist.push([S.ts, sharperNow(S).V]);
    else if (p.setup === 'evidence') { if (p.pexp === 'track') { const v = trackNA(S); if (isFinite(v)) S.hist.push([S.disp.length / 2, v]); } }
    else if (p.setup === 'atoms') { const g = gasesNow(S); S.hist.push([S.ts, g.H, g.O]); }
    if (S.hist.length > 4000) S.hist.shift();
  }
  const MAX_T = { review: 3 * 86400, sharper: 6 * 86400, evidence: 6 * 3600, atoms: 3600, scale: 60 };
  function step(S, dt) {
    const p = S.p, lapse = p.lapse || 1, h = Math.min(dt, 0.05) * lapse;
    if (p.setup === 'review') {
      if (S.ts < MAX_T.review) {
        if (p.what === 'bromine') jarAdvance(S.jar, Dbr(p.T, Math.pow(10, p.lp)), h);
        S.ts += h;
      }
      // the close-up runs at its own slowed clock, whatever the time-lapse
      const hd = Math.min(dt, 0.05);
      if (p.what === 'ink') bdStep(S.sys, hd, Dink(p.T) / Dink(20)); else gasStep(S.sys, hd);
    } else if (p.setup === 'sharper') {
      if (S.ts < MAX_T.sharper) { S.ts += h; S.mixT += h; }
      const hd = Math.min(dt, 0.05), shake = p.stir ? 1 : 0;
      if (p.pair === 'beads') { if (shake) for (let k = 0; k < 2; k++) bdStep(S.sys, hd, 2.2, { g: -9000 * 2, heavy: { m: 1, s: 1 } }); else bdStep(S.sys, hd, 0.0, { g: -9000 * 2 }); }
      else bdStep(S.sys, hd, (p.stir ? 3 : 0.9) * (S.mixT > 0 ? 1 : 1), { g: -2500, heavy: { w: 1.25, e: 0.6 } });
    } else if (p.setup === 'evidence') {
      if (S.ts < MAX_T.evidence) grainsStep(S, h);
    } else if (p.setup === 'atoms') {
      if (S.ts < MAX_T.atoms && gasesNow(S).H < 49.5) {
        const I = current(p.volts, p.conc);
        if (p.look !== 'boil') { S.molH += I * h / (2 * FAR); S.molO += I * h / (4 * FAR); }
        S.ts += h;
        // the close-up: one H₂ for each two electrons; six molecules a second at 0.12 A, slowed alike for both
        if (p.look !== 'boil') { S.nH += I / 0.12 * 6 * Math.min(dt, 0.05); S.nO = S.nH / 2; }
      }
      bdStep(S.sys, Math.min(dt, 0.05), (p.look === 'boil' ? Dink(100) : Dink(p.T)) / Dink(20));
    } else if (p.setup === 'scale') {
      S.ts += Math.min(dt, 0.05); S.spread = 1 - Math.exp(-S.ts / 0.6);
    }
    record(S);
  }

  /* ---------- what each bench reads ---------- */
  function sharperNow(S) {
    const p = S.p, full = mixOf(p.pair, p.vA, p.vB), sum = p.pair === 'beads' ? p.vA + p.vB : p.vA + p.vB;
    const m = p.pair === 'beads' ? (p.stir ? 1 - Math.exp(-S.mixT / 3) : 0) : mixedAt(S.mixT, p.stir);
    return { V: sum - (sum - full.V) * m, m, full, sum, mass: p.pair === 'beads' ? full.m : full.m };
  }
  /* oxygen is twice as soluble as hydrogen: the first ≈ 0.3 mL of it stays in the water */
  const O2_DISSOLVES = 0.3;
  function gasesNow(S) { const p = S.p, H = gasVol(S.molH, p.T), Ot = gasVol(S.molO, p.T), O = Math.max(0, Ot - Math.min(Ot, O2_DISSOLVES * Ot / (Ot + 0.3))); return { H, O, Ot }; }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const fmtT = s => s < 120 ? s.toFixed(s < 10 ? 1 : 0) + ' s' : s < 7200 ? (s / 60).toFixed(s < 600 ? 1 : 0) + ' min' : s < 172800 ? (s / 3600).toFixed(1) + ' h' : (s / 86400).toFixed(1) + ' days';
  const sci = (v, d) => { if (!isFinite(v)) return '—'; const e = Math.floor(Math.log10(Math.abs(v))); return (v / Math.pow(10, e)).toFixed(d == null ? 2 : d) + ' × 10' + String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻').join(''); };
  const fmtLen = m => { const a = Math.abs(m); return a >= 1 ? m.toFixed(a >= 10 ? 0 : 2) + ' m' : a >= 0.01 ? (m * 100).toFixed(1) + ' cm' : a >= 1e-3 ? (m * 1000).toFixed(2) + ' mm' : a >= 1e-6 ? (m * 1e6).toFixed(1) + ' µm' : a >= 1e-9 ? (m * 1e9).toFixed(2) + ' nm' : a >= 1e-12 ? (m * 1e12).toFixed(0) + ' pm' : (m * 1e15).toFixed(1) + ' fm'; };
  function lay(g) {
    const W = g.w, H = g.h, HD = 58, FT = 26, narrow = W < 640;
    if (narrow) { const R = Math.max(70, Math.min((W - 34) / 2, (H - HD - 44 - 78) / 2)); return { narrow, R, c: [W / 2, HD + 38 + R], W, H }; }
    const R = Math.max(90, Math.min((H - HD - FT - 58) / 2, W * 0.26));
    return { narrow, R, c: [W - R - 26, HD + 22 + R], W, H, bw: W - 2 * R - 64 };
  }

  /* ---------- the bench ---------- */
  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, A = A7(), bw = Ly.bw;
    if (!cam || !A || bw < 160) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 20, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    MEAS.bench(F, -0.5, 0.5, -0.3, 0.3, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.5, 0.5, 0.3, 0, 0.7);
    const lab = [], H = [];
    if (p.setup === 'review') { if (p.what === 'ink') benchInk(S, F, A, lab, H); else benchBromine(S, F, A, lab, H); }
    else if (p.setup === 'sharper') benchSharper(S, F, A, lab, H);
    else if (p.setup === 'evidence') benchEvidence(S, F, A, lab, H);
    else if (p.setup === 'atoms') benchAtoms(S, F, A, lab, H);
    else benchScale(S, F, A, lab, H);
    F.render();
    S._ax = {};
    H.forEach(hd => hd(ctx, g));
    if (g.labels && bw > 260) window.G6B.benchLabels(ctx, cam, lab, bw, g.h);
    ctx.restore();
  }
  /* a handle on a world axis: the value moves along the axis's screen projection, a third of the stage for its range */
  function axisHandle(S, g, id, at, toward, key, min, max, o) {
    o = o || {};
    const cam = S.cam, q = cam.project(at), q2 = cam.project(toward);
    if (!q.ok || !q2.ok) return;
    let ux = q2.x - q.x, uy = q2.y - q.y; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    S._ax[id] = { ux, uy, per: (max - min) / (g.h * 0.33), key, min, max, round: o.round, re: o.re !== false };
    g.handle(q.x, q.y, 14, id);
    const ctx = g.ctx; ctx.save(); ctx.strokeStyle = g.dragging === id ? '#FFD66B' : 'rgba(255,214,107,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q.x - ux * 16, q.y - uy * 16); ctx.lineTo(q.x + ux * 16, q.y + uy * 16); ctx.stroke(); ctx.restore();
  }
  function benchInk(S, F, A, lab, H) {
    const p = S.p, top = MEAS.hotplate(F, [0, -0.02, 0], { top: p.T + 5 }).topZ, base = [0, -0.01, top];
    const r = 0.036, Hb = 0.105, lv = 0.085;
    MEAS.beaker(F, base, r, Hb, lv, { T: p.T, marks: { max: 250, perM: 250 / 0.115 }, tint: '#CFE6F2' });
    const rad = Math.min(inkRadius(S.ts, p.mg * 1e-6, p.T), 0.034), pk = inkPeak(S.ts, p.mg * 1e-6, p.T);
    A.inkCloud(F, base, Math.max(rad, 0.0015), clamp(Math.log10(Math.max(1e-9, pk) / INK.cVis) / 4, 0.08, 1), '#8A1E86');
    R3.box(F, [base[0], base[1], top + 0.0012], [0.0024, 0.0016, 0.0016].map(v => v * Math.cbrt(p.mg / 5)), '#3A0838', { shadow: false });
    const tip = [base[0] + 0.02, base[1] + 0.012, top + 0.02], dir = norm([0.12, 0.08, 1]);
    const e = window.G6C.glassThermometer(F, tip, dir, p.T, { len: 0.24, lo: -10, hi: 110 });
    lab.push([[base[0] - 0.02, base[1], top + 0.005], rad > 0.002 ? 'permanganate cloud, ' + (rad * 1000).toFixed(1) + ' mm' : 'a crystal of potassium permanganate, ' + p.mg + ' mg', -70, 40],
      [[base[0] - r, base[1], top + lv], 'still water — no stirring', -50, -50], [e, 'thermometer', 30, -10]);
    const colTop = add(add(tip, scale(dir, 0.012)), scale(dir, 0.22 * clamp((p.T + 10) / 120, 0, 1)));
    H.push((ctx, g) => axisHandle(S, g, 'T', colTop, add(colTop, dir), 'T', 2, 90, { re: false }));
  }
  function benchBromine(S, F, A, lab, H) {
    const p = S.p, base = [0, 0, 0];
    A.gasJars(F, base, S.jar.c, { H: BR2.jarH, r: 0.03 });
    // the vacuum line: a tap through the upper jar's lid, tubing to a gauge and the pump
    const lid = [0, 0, 2 * BR2.jarH + 0.006];
    R3.cylinder(F, lid, add(lid, [0, 0, 0.03]), 0.004, '#D9E8F2', { segments: 12, shadow: false });
    A.tubing(F, [add(lid, [0, 0, 0.03]), [0.06, 0, 0.36], [0.14, -0.02, 0.3], [0.17, -0.04, 0.1], [0.17, -0.04, 0.03]], { colour: '#3A2A22', r: 0.005 });
    R3.box(F, [0.19, -0.05, 0.04], [0.12, 0.09, 0.08], '#2F5E8A', { ambient: 0.45 });
    R3.cylinder(F, [0.13, -0.05, 0.05], [0.25, -0.05, 0.05], 0.03, '#3A4252', { segments: 20, shadow: false });
    const gq = [0.12, -0.04, 0.31];
    H.push((ctx, g) => {
      const q = S.cam.project(gq); if (!q.ok) return;
      const pa = Math.pow(10, p.lp), f = (p.lp + 5) / 5;
      A.gauge(ctx, q.x, q.y, 24, f, { ticks: [[0, '10⁻⁵'], [0.2, ''], [0.4, '10⁻³'], [0.6, ''], [0.8, '0.1'], [1, '1']], unit: 'atm' });
      axisHandle(S, g, 'lp', [gq[0], gq[1], gq[2] - 0.05], [gq[0] + 0.1, gq[1], gq[2] - 0.05], 'lp', -5, 0);
      void pa;
    });
    lab.push([[0, -0.03, 0.06], 'lower jar: bromine vapour', -60, 30], [[0, -0.03, 0.26], 'upper jar: ' + (p.lp > -0.05 ? 'air' : p.lp > -3 ? 'thin air' : 'almost a vacuum'), -60, -30], [[0, 0.03, BR2.jarH], 'glass plate slid out at t = 0', 60, 0], [[0.19, -0.05, 0.08], 'vacuum pump', 30, 20]);
  }
  const CYL100 = { cap: 100, div: 1, big: 10, mid: 5, d: 0.029 }, CYL250 = { cap: 250, div: 2, big: 50, mid: 10, d: 0.039 };
  function benchSharper(S, F, A, lab, H) {
    const p = S.p, N = sharperNow(S), beads = p.pair === 'beads';
    const tA = beads ? '#D8E6EE' : p.pair === 'ethanol' ? '#EEF2F6' : '#7FB2E8', tB = beads ? '#D9C49A' : '#CFE6F4';
    // the two measured amounts, already poured — shown as they were, in their cylinders, emptied
    const ga = MEAS.gradCylinder(F, [-0.14, -0.06, 0], CYL100, 0.4, { tint: tA });
    const gb = MEAS.gradCylinder(F, [-0.08, -0.1, 0], CYL100, 0.4, { tint: tB });
    // the mixing cylinder on the balance
    const pan = MEAS.balance(F, [0.07, 0.0, 0], { text: (N.mass + 168.2).toFixed(1), settled: true });
    const gm = MEAS.gradCylinder(F, [pan[0], pan[1], pan[2]], CYL250, Math.min(N.V, 249), {
      tint: beads ? '#CBB894' : p.pair === 'water' ? '#A8CCEA' : '#DCEBF4',
      inner: beads ? (F2, gg) => { const zA = gg.zOf(Math.max(0, p.vA * (1 - 0) * 0.999)), n = Math.round(p.vA / 50 * 14); for (let i = 0; i < n; i++) { const a = i * 2.4, rr = (i % 3) * 0.005; R3.sphere(F2, [pan[0] + Math.cos(a) * rr, pan[1] + Math.sin(a) * rr, gg.z0 + 0.008 + (zA - gg.z0 - 0.012) * i / Math.max(1, n)], 0.0068, '#BFE0F0', { shadow: false, rim: 0.9 }); } } : null
    });
    void ga; void gb;
    lab.push([[pan[0], pan[1] - 0.02, pan[2] + 0.08], 'the mixture: ' + N.V.toFixed(1) + ' mL', 50, -20], [[-0.14, -0.06, 0.08], beads ? p.vA + ' mL of marbles went in' : p.vA + ' mL of ' + (p.pair === 'ethanol' ? 'ethanol' : 'dyed water') + ' went in', -40, -60], [[-0.08, -0.1, 0.05], p.vB + ' mL of ' + (beads ? 'sand' : 'water') + ' went in', -40, 50], [[pan[0], pan[1] - 0.12, 0.05], 'balance: cylinder 168.2 g + contents', 40, 40]);
    if (p.stir) lab.push([[pan[0], pan[1], pan[2] + 0.2], beads ? 'shaken' : 'stirred with a glass rod', 40, -10]);
    const zv = (G, v, b) => [b[0], b[1], 0.018 + v * 1e-6 / (Math.PI * G.d * G.d / 4)];
    H.push((ctx, g) => { axisHandle(S, g, 'vA', zv(CYL100, p.vA, [-0.14, -0.06]), zv(CYL100, p.vA + 20, [-0.14, -0.06]), 'vA', 0, 100); axisHandle(S, g, 'vB', zv(CYL100, p.vB, [-0.08, -0.1]), zv(CYL100, p.vB + 20, [-0.08, -0.1]), 'vB', 0, 100); });
  }
  function benchEvidence(S, F, A, lab, H) {
    const p = S.p, M = window.MICRO;
    const pts = M.compound(F, [0.0, 0.04, 0], { obj: 40, iris: 0.6, lamp: 0.7, focus: 0, stage: [0, 0], slide: { tint: '#E8B840', r: 0.006 }, oil: false });
    MEAS.beaker(F, [-0.13, -0.08, 0], 0.03, 0.08, 0.05, { tint: '#E8C060', T: p.T });
    lab.push([pts.eyepiece, 'eyepiece with a squared graticule', 40, -20], [pts.slide, p.pexp === 'track' ? 'gamboge suspension under a cover slip' : 'a cell 100 µm deep, left to stand', 70, 40], [[-0.13, -0.08, 0.05], 'gamboge in water: grains of ' + p.rad.toFixed(3) + ' µm', -30, -40]);
  }
  function benchAtoms(S, F, A, lab, H) {
    const p = S.p, G = gasesNow(S), I = current(p.volts, p.conc);
    const tint = p.conc > 0 ? '#CFE6F4' : '#DCEFF8';
    const hf = A.hofmann(F, [0, 0, 0], G.H, G.O, { level: clamp((G.H + G.O) / 75, 0, 1), tint });
    const su = A.supply(F, [0.2, -0.06, 0], p.volts, I);
    A.tubing(F, [su.black, [0.12, -0.12, 0.02], [-hf.sep, -0.03, 0.04], hf.electrode(-hf.sep)], { colour: '#22262E', r: 0.0022 });
    A.tubing(F, [su.red, [0.12, -0.09, 0.02], [hf.sep, -0.03, 0.035], hf.electrode(hf.sep)], { colour: '#C8302A', r: 0.0022 });
    lab.push([hf.top(-hf.sep), 'cathode (−): hydrogen, ' + G.H.toFixed(1) + ' mL', -50, -20], [hf.top(hf.sep), 'anode (+): oxygen, ' + G.O.toFixed(1) + ' mL', 40, -40],
      [[0, 0, 0.08], p.conc > 0 ? 'water + ' + p.conc.toFixed(2) + ' M sodium sulfate' : 'pure water', -70, 40], [su.knob, 'power supply', 30, 30]);
    H.push((ctx, g) => axisHandle(S, g, 'volts', su.knob, add(su.knob, [0.05, 0, 0]), 'volts', 0, 20, { re: false }));
  }
  function benchScale(S, F, A, lab, H) {
    const p = S.p, f = film(p), pond = p.tray === 'pond';
    const w = 0.30, l = 0.45, sc = pond ? w / f.tray.w : 1, fr = Math.min(f.d / 2 * sc * S.spread, l * 0.6);
    A.oilTray(F, [0, 0, 0], w, l, p.oil === 'paraffin' ? 0.004 * S.spread : fr, { lens: p.oil === 'paraffin' });
    const tip = [0, 0, 0.12];
    const top = A.pipette(F, tip, { fill: 0.5 });
    window.BENCH.rule(F, [-w / 2, -l / 2 - 0.02, 0.026], [1, 0, 0], 0.3, { k: 1 });
    MEAS.bottle(F, [0.22, 0.12, 0], { label: '1 : ' + Math.round(Math.pow(10, p.ldil)) });
    lab.push([tip, 'pipette: ' + p.dpm + ' drops a mL', -60, -20], [[fr * 0.7, 0, 0.026], p.oil === 'paraffin' ? 'paraffin oil: a lens, not a film' : 'the film pushes the powder back: ' + fmtLen(f.d) + ' across' + (pond ? ' (a pond, drawn to fit)' : ''), 40, 50], [[0.12, -l / 2 + 0.03, 0.026], pond ? 'Clapham pond, 60 m × 34 m' : 'water dusted with lycopodium powder', 40, 40]);
    H.push((ctx, g) => axisHandle(S, g, 'drops', top, add(top, [0, 0, -0.06]), 'drops', 1, 10, { round: true }));
  }

  /* ---------- the magnified panel ---------- */
  function drawPanel(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = A7(), B = window.G6B, [cx, cy] = Ly.c, R = Ly.R;
    if (!A || !B) return;
    const cap = (l, r) => { ctx.save(); ctx.font = mono(Ly.narrow ? 9.5 : 10.5, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#EAF1FF'; ctx.fillText(kit().fitText(ctx, l, R * (r ? 1.25 : 2)), cx - R, cy - R - 9); if (r && !Ly.narrow) { ctx.textAlign = 'right'; ctx.fillStyle = '#8FA3C0'; ctx.fillText(kit().fitText(ctx, r, R * 0.72), cx + R, cy - R - 9); } ctx.restore(); };
    if (p.setup === 'review' && p.what === 'ink') {
      const s = 2 * R / (LQ * 0.95);
      B.circle(ctx, cx, cy, R, () => { const gr = ctx.createLinearGradient(0, cy - R, 0, cy + R); gr.addColorStop(0, '#0E2238'); gr.addColorStop(1, '#16304E'); ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); A.liquidSlice(ctx, S.sys, { cx, cy, s, R }); });
      cap('water and permanganate ions, 20 million times', p.T + ' °C · slowed 10¹² times');
      if (g.labels && R > 110) labelKinds(S, g, Ly, s, { w: 'water molecule (H₂O)', ion: 'permanganate ion (MnO₄⁻)' });
      B.scaleBar(ctx, cx - R * 0.55, cy + R * 0.82, 1000 * s, '1 nm');
    } else if (p.setup === 'review') {
      const sys = S.sys, s = 2 * R / (GH * 1.0);
      B.circle(ctx, cx, cy, R, () => { ctx.fillStyle = '#0B1424'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        ctx.strokeStyle = 'rgba(160,190,230,.25)'; ctx.strokeRect(cx - GW / 2 * s, cy - GH / 2 * s, GW * s, GH * s);
        sys.p.forEach(q => A.molecule2(ctx, cx + (q.x - GW / 2) * s, cy - (q.y - GH / 2) * s, q.k === 'br' ? A.MOL.Br2 : q.k === 'n2' ? A.MOL.N2 : A.MOL.O2, s, q.a, { k: 0.72, tint: q.k === 'br' ? '#E07A20' : null })); });
      cap('bromine and air in the upper jar, 10 million times', 'speeds slowed 10¹¹ times');
      if (g.labels && R > 110) { ctx.save(); ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.fillStyle = '#E8A080'; ctx.fillText('Br₂ (160 u, 197 m/s)', cx, cy + R * 0.86); ctx.fillStyle = '#9FB8E0'; ctx.fillText(Math.round(46 * Math.pow(10, p.lp)) ? 'N₂, O₂ of the air (29 u, 463 m/s)' : 'no air left to hit', cx, cy + R * 0.86 + 13); ctx.restore(); }
    } else if (p.setup === 'sharper') drawPack(S, g, Ly, cap);
    else if (p.setup === 'evidence') drawField(S, g, Ly, cap);
    else if (p.setup === 'atoms') drawElectrode(S, g, Ly, cap);
    else drawFilm(S, g, Ly, cap);
  }
  function labelKinds(S, g, Ly, s, names) {
    const [cx, cy] = Ly.c, R = Ly.R, out = [], seen = {};
    S.sys.p.forEach(q => { if (seen[q.k] || !names[q.k]) return; const x = cx + (q.x - S.sys.cx) * s, y = cy + (q.y - S.sys.cy) * s; if (Math.hypot(x - cx, y - cy) > R * 0.7) return; seen[q.k] = 1; out.push({ x, y, text: names[q.k], side: 'L' }); });
    window.G6B.sideLabels(g.ctx, out, { xL: cx - R - 12, xR: cx + R + 12, top: cy - R + 20, bottom: cy + R - 20, maxW: Ly.narrow ? 100 : 170 });
  }
  function drawPack(S, g, Ly, cap) {
    const p = S.p, ctx = g.ctx, A = A7(), [cx, cy] = Ly.c, R = Ly.R, sys = S.sys, beads = p.pair === 'beads';
    const s = 2 * R * 0.62 / sys.L, x0 = cx - sys.L / 2 * s, yb = cy + R * 0.78;
    window.G6B.circle(ctx, cx, cy, R, () => {
      ctx.fillStyle = '#0D1626'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      // the glass of the cylinder, seen in section
      ctx.fillStyle = 'rgba(200,228,245,.08)'; ctx.fillRect(x0 - 6, cy - R, sys.L * s + 12, yb - cy + R + 6);
      ctx.strokeStyle = 'rgba(215,238,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 5, cy - R); ctx.lineTo(x0 - 5, yb + 5); ctx.lineTo(x0 + sys.L * s + 5, yb + 5); ctx.lineTo(x0 + sys.L * s + 5, cy - R); ctx.stroke();
      if (!beads) { const ty = yb - packTop(sys) * s; const gr = ctx.createLinearGradient(0, ty, 0, yb); gr.addColorStop(0, 'rgba(120,170,220,.18)'); gr.addColorStop(1, 'rgba(60,110,170,.28)'); ctx.fillStyle = gr; ctx.fillRect(x0, ty, sys.L * s, yb - ty); }
      sys.p.slice().sort((a, b) => RAD[b.k] - RAD[a.k]).forEach(q => {
        const x = x0 + q.x * s, y = yb - q.y * s;
        if (q.k === 'm') { RX.ball(ctx, x, y, RAD.m * s, '#9FD0E8', { rim: 0.9, sub: 0.6, shadow: false }); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - RAD.m * s * 0.3, y - RAD.m * s * 0.3, RAD.m * s * 0.35, 3.6, 4.8); ctx.stroke(); ctx.restore(); }
        else if (q.k === 's') RX.ball(ctx, x, y, RAD.s * s, '#D2B47A', { rim: 0.4, sub: 0.3, shadow: false });
        else A.molecule2(ctx, x, y, q.k === 'e' ? A.MOL.EtOH : A.MOL.H2O, s * 0.95, q.a, { tilt: q.t, k: 0.74, tint: q.tint ? '#3D7FE0' : null });
      });
      // the level, as the eye reads it
      const ty = yb - packTop(sys) * s; ctx.strokeStyle = '#FFD66B'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 - 14, ty); ctx.lineTo(x0 + sys.L * s + 14, ty); ctx.stroke(); ctx.setLineDash([]);
      window.G6B.tag(ctx, x0 + sys.L * s + 16, ty, 'level', { align: 'left', col: '#FFD66B' });
    });
    cap(beads ? 'marbles and sand, in section' : p.pair === 'ethanol' ? 'ethanol on water, 20 million times' : 'dyed water on water', beads ? (p.stir ? 'shaking' : 'left alone') : (p.stir ? 'stirred' : 'left alone') + ' · a 2D slice');
    if (g.labels && R > 110) { ctx.save(); ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.fillStyle = '#C9D6EA'; ctx.fillText(beads ? 'sand runs into the gaps between marbles' : p.pair === 'ethanol' ? 'CH₃CH₂OH and H₂O: different sizes, held by H-bonds' : 'the same particles: they only mingle', cx, cy + R * 0.92); ctx.restore(); }
  }
  function drawField(S, g, Ly, cap) {
    const p = S.p, ctx = g.ctx, A = A7(), [cx, cy] = Ly.c, R = Ly.R, B = window.G6B;
    if (p.pexp === 'track') {
      const s = 2 * R / (FIELD * 1.08), ox = cx - FIELD / 2 * s, oy = cy - FIELD / 2 * s, rpx = Math.max(1.6, p.rad * s * 1.2);
      A.field(ctx, cx, cy, R, () => {
        A.graticule(ctx, cx, cy, R, 3.125 * 2 * s, 12);
        S.grains.forEach((gr, i) => {
          if (i < 3) { ctx.save(); ctx.strokeStyle = ['#C8302A', '#2A5CC8', '#2A8A40'][i]; ctx.lineWidth = 1.3; ctx.beginPath(); gr.tr.forEach((q, k) => { const x = ox + q[0] * s, y = oy + q[1] * s; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineTo(ox + gr.x * s, oy + gr.y * s); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; gr.tr.forEach(q => { ctx.beginPath(); ctx.arc(ox + q[0] * s, oy + q[1] * s, 1.8, 0, TAU); ctx.fill(); }); ctx.restore(); }
          A.grain(ctx, ox + gr.x * s, oy + gr.y * s, rpx);
        });
      }, { lamp: '#F3EEDF' });
      cap('gamboge grains at 400×, a position marked every ' + p.dt + ' s', 'Perrin’s squares: 6.25 µm');
      B.scaleBar(ctx, cx - R * 0.6, cy + R * 0.84, 10 * s, '10 µm');
      // the grain-size handle: a grain drawn to the scale of its own label, dragged sideways
      const hx = cx + R * 0.62, hy = cy + R * 0.86, hr = 4 + p.rad * 10;
      A.grain(ctx, hx, hy, hr); S._ax = S._ax || {}; S._ax.rad = { ux: 1, uy: 0, per: (1.5 - 0.1) / (g.h * 0.33), key: 'rad', min: 0.1, max: 1.5, re: true };
      g.handle(hx, hy, 14, 'rad'); B.tag(ctx, hx, hy - hr - 9, 'r = ' + p.rad.toFixed(3) + ' µm ⇆', { col: '#FFD66B', size: 9.5 });
    } else {
      const s = (2 * R * 0.86) / CELLH, x0 = cx - FIELD / 2 * s, yb = cy + CELLH / 2 * s;
      B.circle(ctx, cx, cy, R, () => {
        const gr = ctx.createLinearGradient(0, yb - CELLH * s, 0, yb); gr.addColorStop(0, '#E9E3CF'); gr.addColorStop(1, '#D8CDA8'); ctx.fillStyle = '#1A2234'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); ctx.fillStyle = gr; ctx.fillRect(x0, yb - CELLH * s, FIELD * s, CELLH * s);
        S.grains.forEach(q => { ctx.fillStyle = '#B87A10'; ctx.beginPath(); ctx.arc(x0 + q.x * s, yb - q.y * s, Math.max(1.1, p.rad * s * 2), 0, TAU); ctx.fill(); });
        LEVELS.forEach((lv, i) => { const y = yb - lv * s; ctx.fillStyle = 'rgba(255,214,107,.16)'; ctx.fillRect(x0, y - 1.5 * s, FIELD * s, 3 * s); ctx.strokeStyle = 'rgba(200,140,20,.8)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + FIELD * s, y); ctx.stroke(); ctx.setLineDash([]); B.tag(ctx, x0 + FIELD * s + 6, y, lv + ' µm: ' + S.reads[i], { align: 'left', size: 9.5, col: '#FFD66B' }); });
        ctx.strokeStyle = 'rgba(30,40,60,.8)'; ctx.lineWidth = 2; ctx.strokeRect(x0, yb - CELLH * s, FIELD * s, CELLH * s);
      });
      cap('the cell from the side: grains settle, and jiggle back up', S.nReads + ' readings');
      B.scaleBar(ctx, cx - R * 0.75, cy + R * 0.86, 20 * s, '20 µm');
    }
  }
  function drawElectrode(S, g, Ly, cap) {
    const p = S.p, ctx = g.ctx, A = A7(), [cx, cy] = Ly.c, R = Ly.R, s = 2 * R / (LQ * 0.95), B = window.G6B;
    B.circle(ctx, cx, cy, R, () => {
      const gr = ctx.createLinearGradient(0, cy - R, 0, cy + R); gr.addColorStop(0, '#0E2238'); gr.addColorStop(1, '#16304E'); ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      if (p.look === 'boil') {
        // a surface: below it liquid; above it, molecules that escaped — still whole H₂O
        ctx.fillStyle = '#0A1220'; ctx.fillRect(cx - R, cy - R, 2 * R, R * 0.7);
        A.liquidSlice(ctx, S.sys, { cx, cy: cy + R * 0.15, s: s * 0.95, R });
        const n = 7, ph = S.t; for (let i = 0; i < n; i++) { const u = ((ph * 0.25 + i / n) % 1); A.molecule2(ctx, cx - R * 0.6 + i * R * 0.2, cy - R * 0.32 - u * R * 0.55, A.MOL.H2O, s, i + ph * (0.5 + i * 0.1), { k: 0.72 }); }
        B.tag(ctx, cx, cy - R * 0.88, 'steam: the same H₂O molecules, farther apart', { size: 10 });
      } else {
        A.liquidSlice(ctx, S.sys, { cx, cy, s, R });
        // the two platinum plates and the bubbles growing on them, molecule by molecule
        [[-1, Math.floor(S.nH), A.MOL.H2, 'H₂'], [1, Math.floor(S.nO), A.MOL.O2, 'O₂']].forEach(([side, n, m, nm]) => {
          const ex = cx + side * R * 0.72; ctx.fillStyle = '#C9CED6'; ctx.fillRect(ex - 6, cy - R * 0.6, 12, R * 1.2);
          ctx.fillStyle = side < 0 ? '#2A2E36' : '#C8302A'; B.tag(ctx, ex, cy - R * 0.66, side < 0 ? '−' : '+', { size: 14, col: side < 0 ? '#9FB8E0' : '#FF8A80' });
          const inB = n % 12, rb = 14 + 5.5 * Math.sqrt(inB), bx = ex - side * (rb + 8), by = cy + R * 0.2;
          ctx.save(); ctx.fillStyle = '#0C1A2C'; ctx.strokeStyle = 'rgba(230,245,255,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(bx, by, rb, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
          for (let k = 0; k < inB; k++) { const a = k * 2.4, rr = Math.sqrt(k / 12) * rb * 0.75; A.molecule2(ctx, bx + Math.cos(a) * rr, by + Math.sin(a) * rr, m, s, a, { k: 0.72 }); }
          // detached bubbles rising
          const up = Math.floor(n / 12); for (let k = 0; k < Math.min(up, 3); k++) { const yy = by - (k + 1) * R * 0.32 - ((S.t * 30) % (R * 0.32)) * 0; ctx.save(); ctx.strokeStyle = 'rgba(230,245,255,.6)'; ctx.beginPath(); ctx.arc(bx + side * 4, yy, rb * 0.8, 0, TAU); ctx.stroke(); ctx.restore(); }
          B.tag(ctx, bx, by + rb + 12, nm + ' made: ' + n, { size: 9.5 });
        });
      }
    });
    cap(p.look === 'boil' ? 'boiling water, 20 million times' : 'at the electrodes, 20 million times', p.look === 'boil' ? 'molecules leave whole' : '2 H₂O → 2 H₂ + O₂');
  }
  function drawFilm(S, g, Ly, cap) {
    const p = S.p, ctx = g.ctx, A = A7(), [cx, cy] = Ly.c, R = Ly.R, f = film(p), B = window.G6B;
    if (p.zoom === 'tray') {
      const span = Math.max(f.d * 1.4, p.tray === 'pond' ? 80 : 0.2), s = 2 * R / span, fr = f.d / 2 * s * S.spread;
      B.circle(ctx, cx, cy, R, () => {
        ctx.fillStyle = '#6F8DA2'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        const r = rng(9); ctx.fillStyle = 'rgba(236,226,190,.9)'; for (let i = 0; i < 2600; i++) { const x = cx - R + r() * 2 * R, y = cy - R + r() * 2 * R; if (Math.hypot(x - cx, y - cy) > fr * 1.04) ctx.fillRect(x, y, 1.4, 1.4); }
        if (p.oil !== 'paraffin') { ctx.strokeStyle = 'rgba(245,236,200,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, fr, 0, TAU); ctx.stroke(); }
        else { RX.ball(ctx, cx, cy, Math.max(4, 0.004 * s * S.spread), '#D8C060', { rim: 0.9, sub: 0.4, shadow: false }); }
      });
      // a ruler across the film
      const rl = Math.min(2 * R * 0.9, Math.max(40, f.d * s)), unit = p.tray === 'pond' ? 10 : 0.01, nT = Math.floor(rl / (unit * s));
      ctx.save(); ctx.fillStyle = '#E8DDB0'; ctx.fillRect(cx - rl / 2, cy + R * 0.55, rl, 14); ctx.strokeStyle = '#2A2418'; ctx.lineWidth = 1; for (let i = 0; i <= nT; i++) { const x = cx - rl / 2 + i * unit * s; ctx.beginPath(); ctx.moveTo(x, cy + R * 0.55); ctx.lineTo(x, cy + R * 0.55 + (i % 5 ? 4 : 8)); ctx.stroke(); } ctx.restore();
      cap('the film from above', 'd = ' + fmtLen(f.d));
    } else if (p.zoom === 'molecules') {
      const s = 2 * R / 3600;
      B.circle(ctx, cx, cy, R, () => {
        ctx.fillStyle = '#0B1424'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        const wy = cy + R * 0.25;
        const gr = ctx.createLinearGradient(0, wy, 0, cy + R); gr.addColorStop(0, '#1E4C78'); gr.addColorStop(1, '#0E2440'); ctx.fillStyle = gr; ctx.fillRect(cx - R, wy, 2 * R, R);
        for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) A.molecule2(ctx, cx - R + (i + 0.5 + (j % 2) * 0.5) * 290 * s, wy + (j + 0.6) * 280 * s, A.MOL.H2O, s, i * 1.7 + j, { k: 0.72 });
        if (p.oil === 'paraffin') { ctx.fillStyle = 'rgba(216,192,96,.35)'; ctx.fillRect(cx - R, cy - R, 2 * R, wy - cy + R); B.tag(ctx, cx, cy - R * 0.2, 'a lens 0.4 mm thick: 300 000 molecules deep', { size: 10 }); }
        else {
          const step = Math.sqrt(OILS[p.oil].a) * 1000 * s;
          for (let x = cx - R; x < cx + R; x += step) A.molecule2(ctx, x, wy - 40 * s, A.OLEIC, s, 0, { k: 0.74, kH: 0.55, tilt: 0.5 });
          const top = wy - monoThick(p.oil) * 1e12 * s;
          ctx.save(); ctx.strokeStyle = '#FFD66B'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx + R * 0.72, wy); ctx.lineTo(cx + R * 0.72, top); ctx.moveTo(cx + R * 0.68, wy); ctx.lineTo(cx + R * 0.76, wy); ctx.moveTo(cx + R * 0.68, top); ctx.lineTo(cx + R * 0.76, top); ctx.stroke(); ctx.restore();
          B.tag(ctx, cx + R * 0.66, (wy + top) / 2, fmtLen(monoThick(p.oil)), { align: 'right', col: '#FFD66B' });
        }
      });
      cap('the film edge-on, 50 million times', p.oil === 'paraffin' ? 'no water-loving end' : 'acid heads in the water, tails up');
      B.scaleBar(ctx, cx - R * 0.6, cy - R * 0.75, 1000 * s, '1 nm');
    } else {
      // one carbon atom of the chain: its electron cloud, and the nucleus — too small to draw at this scale
      const s = 2 * R / 500;
      B.circle(ctx, cx, cy, R, () => {
        ctx.fillStyle = '#05080F'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 170 * s); gr.addColorStop(0, 'rgba(120,170,255,.55)'); gr.addColorStop(0.35, 'rgba(90,140,240,.32)'); gr.addColorStop(1, 'rgba(60,100,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, 170 * s, 0, TAU); ctx.fill();
        const r = rng(3); ctx.fillStyle = 'rgba(200,220,255,.5)'; for (let i = 0; i < 900; i++) { const rr = -Math.log(1 - r() * 0.98) * 40 * s, a = r() * TAU; ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1, 1); }
        ctx.fillStyle = '#FF6B4A'; ctx.beginPath(); ctx.arc(cx, cy, 1.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,107,.8)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, 170 * s, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      });
      B.tag(ctx, cx, cy - 16, 'nucleus: 2.7 fm across — this dot is 300× too big', { size: 9.5, col: '#FF9A80' });
      cap('one carbon atom, 2 billion times', 'its size: 0.17 nm (van der Waals)');
      B.scaleBar(ctx, cx - R * 0.5, cy + R * 0.8, 100 * s, '0.1 nm');
    }
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !A7()) return;
    const Ly = lay(g);
    if (!Ly.narrow) drawBench(S, g, Ly);
    else S._ax = {};
    drawPanel(S, g, Ly);
    cards(S, g, Ly);
    const H = headerOf(S);
    K.header(g, H[0], H[1], H[2]);
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'review') {
      if (p.what === 'ink') { const r = inkRadius(S.ts, p.mg * 1e-6, p.T); return ['A crystal of permanganate in still water at ' + p.T + ' °C: ' + (r > 0 ? 'a cloud ' + (r * 2000).toFixed(1) + ' mm across' : 'faded below what the eye can see'), fmtT(S.ts) + ' · D = ' + (Dink(p.T) * 1e9).toFixed(2) + ' × 10⁻⁹ m²/s · nobody is stirring', 'the colour spreads by itself: the particles of the water and the ink never stop moving'];
      }
      const pa = Math.pow(10, p.lp); return ['Bromine and ' + (pa > 0.9 ? 'air' : pa.toPrecision(2) + ' atm of air') + ': the top of the upper jar is ' + Math.round(clamp(jarTop(S.jar), 0, 1) * 100) + ' % of its final brown', fmtT(S.ts) + ' · D = ' + sciU(Dbr(p.T, pa)) + ' m²/s · free path ' + fmtLen(freePath(p.T, pa)), 'each Br₂ flies at ' + vbar(p.T, BR2.M).toFixed(0) + ' m/s — it is the air in the way that makes the colour slow'];
    }
    if (p.setup === 'sharper') { const N = sharperNow(S); return [p.vA + ' mL + ' + p.vB + ' mL = ' + N.V.toFixed(1) + ' mL' + (N.sum - N.V > 0.05 ? ' — ' + (N.sum - N.V).toFixed(1) + ' mL went missing' : ''), fmtT(S.ts) + ' · mass ' + N.mass.toFixed(1) + ' g before and after · ' + Math.round(N.m * 100) + ' % mixed', 'the mass is kept; the volume is not — so the particles are not all alike'];
    }
    if (p.setup === 'evidence') {
      if (p.pexp === 'track') { const v = trackNA(S); return ['Perrin’s grains: N_A = ' + (isFinite(v) ? sci(v, 2) : 'waiting for the first interval'), fmtT(S.ts) + ' · ' + S.disp.length / 2 + ' steps measured · D = ' + sciU(Dgrain(p.T, p.rad, p.gly / 100)) + ' m²/s', 'a grain is kicked unevenly by the water molecules round it — Brownian motion']; }
      const E = settleNA(S); return ['Settled gamboge: ' + (isFinite(E.NA) ? 'halves every ' + (E.H * 1e6 * Math.LN2).toFixed(0) + ' µm → N_A = ' + sci(E.NA, 2) : 'counting…'), fmtT(S.ts) + ' since it was shaken · ' + S.nReads + ' readings at four levels', 'wait for it to settle before you count: too soon, and the numbers lie'];
    }
    if (p.setup === 'atoms') { const G = gasesNow(S), I = current(p.volts, p.conc); return [p.look === 'boil' ? 'Boiling: the particles leave whole' : I < 1e-4 ? 'Pure water: almost no current, no gas' : 'Hydrogen ' + G.H.toFixed(1) + ' mL, oxygen ' + G.O.toFixed(1) + ' mL — ' + (G.O > 0.05 ? (G.H / G.O).toFixed(2) : '—') + ' : 1', fmtT(S.ts) + ' · ' + p.volts.toFixed(1) + ' V · ' + (I >= 0.01 ? I.toFixed(3) + ' A' : (I * 1e6).toFixed(2) + ' µA'), 'water is split into two different gases: its particle is made of smaller ones — atoms']; }
    const f = film(p); return ['One drop: a film ' + fmtLen(f.d) + ' across' + (f.full ? ' — it fills the tray' : '') + ', ' + (p.oil === 'paraffin' ? 'a lens, not a film' : fmtLen(f.h) + ' thick'), 'oil ' + sci(f.V * 1e6, 2) + ' mL = ' + sci(f.molecules, 1) + ' molecules · 1 : ' + Math.round(Math.pow(10, p.ldil)) + ' in ethanol', 'thickness = volume ÷ area: one molecule thick'];
  }
  const sciU = v => sci(v, 2);

  /* ============================================================
     CARDS
     ============================================================ */
  function cards(S, g, Ly) {
    const p = S.p, B = window.G6B, w = Ly.narrow ? 0 : Math.min(300, (Ly.bw || 320) - 10), at = { x: 10, w };
    if (p.setup === 'evidence' && p.pexp === 'settle') {
      const rows = LEVELS.map((lv, i) => [lv + ' µm up', { t: String(S.reads[i]), bold: true }, S.nReads ? (S.reads[i] / S.nReads).toFixed(1) + ' a reading' : '—']);
      const E = settleNA(S); rows.push(['N_A from the slope', { t: isFinite(E.NA) ? sci(E.NA, 2) : '—', col: '#FFD66B', bold: true }, '']);
      B.rowsCard(g, S, 'Perrin’s counts', rows, at, { cols: [0, 0.38, 0.62] });
    } else if (p.setup === 'atoms') {
      const G = gasesNow(S), mH = S.molH * 2.016, mO = S.molO * 31.998;
      B.rowsCard(g, S, 'What came out of the water', [['', { t: 'hydrogen', bold: true }, { t: 'oxygen', bold: true }], ['volume', G.H.toFixed(2) + ' mL', G.O.toFixed(2) + ' mL'], ['mass', (mH * 1000).toFixed(2) + ' mg', (mO * 1000).toFixed(2) + ' mg'], ['ratio', { t: (G.O > 0.05 ? (G.H / G.O).toFixed(2) : '—') + ' : 1 by volume', col: '#FFD66B' }, { t: mH > 0 ? '1 : ' + (mO / mH).toFixed(2) + ' by mass' : '', col: '#FFD66B' }]], at, { cols: [0, 0.3, 0.65] });
    } else if (p.setup === 'sharper') {
      const N = sharperNow(S);
      B.rowsCard(g, S, 'Before and after', [['', { t: 'before', bold: true }, { t: 'after', bold: true }], ['volume', N.sum.toFixed(1) + ' mL', { t: N.V.toFixed(1) + ' mL', col: '#FFD66B' }], ['mass', N.mass.toFixed(2) + ' g', { t: N.mass.toFixed(2) + ' g', col: '#9FE0B8' }], ['density', (N.mass / Math.max(1e-9, N.sum)).toFixed(4), (N.mass / Math.max(1e-9, N.V)).toFixed(4) + ' g/mL']], at, { cols: [0, 0.32, 0.64] });
    } else if (p.setup === 'scale') {
      const f = film(p);
      B.rowsCard(g, S, 'Size of a molecule', [['oil in the drop', sci(f.V * 1e6, 2) + ' mL'], ['film diameter', fmtLen(f.d)], ['film area', f.A >= 1 ? f.A.toFixed(0) + ' m²' : (f.A * 1e4).toFixed(0) + ' cm²'], ['thickness = V ÷ A', { t: fmtLen(f.h), col: '#FFD66B', bold: true }], ['atoms across a hair (80 µm)', sci(80e-6 / 0.15e-9, 1)]], at, { cols: [0, 0.55] });
    }
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'review' && p.what === 'ink') {
      const tmax = Math.max(1800, S.ts * 1.15), items = [{ c: '#C060C0', label: 'cloud you can see, this run' }, { c: 'rgba(201,212,234,.6)', label: '√(4Dt·ln(c₀/c_eye)), whole curve', dash: [4, 3] }], Kk = K.plotKey(g, items);
      const pts = []; for (let i = 1; i <= 160; i++) { const t = tmax * i / 160; pts.push([t / 60, inkRadius(t, p.mg * 1e-6, p.T) * 1000]); }
      const ymax = Math.max(5, ...pts.map(q => q[1])) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: tmax / 60, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'radius, mm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, 'rgba(201,212,234,.55)', 1.3, [4, 3]); P.line(S.hist.map(q => [q[0] / 60, q[1]]), '#C060C0', 2.4); P.dot(S.ts / 60, inkRadius(S.ts, p.mg * 1e-6, p.T) * 1000, 4.5, '#C060C0', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'review') {
      const items = [{ c: '#D88040', label: 'brown, now' }, { c: 'rgba(201,212,234,.55)', label: 'at the start', dash: [4, 3] }], Kk = K.plotKey(g, items), c = S.jar.c, n = c.length, dz = 30 / n;
      const P = g.Plot({ xmin: 0, xmax: 30, ymin: 0, ymax: 1.08, pad: { t: Kk.t }, xlabel: 'height up the jars, cm', ylabel: 'bromine, share of start', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line([[0, 1], [15, 1], [15, 0], [30, 0]], 'rgba(201,212,234,.5)', 1.2, [4, 3]); const pts = []; for (let i = 0; i < n; i++) pts.push([(i + 0.5) * dz, c[i]]); P.area(pts, 0, 'rgba(216,128,64,.2)'); P.line(pts, '#D88040', 2.4); P.vline(15, 'rgba(201,212,234,.3)'); });
      P.tag(15, 1.02, 'where the jars meet', '#AFC0D8', 'left', 0);
      Kk.draw(P); return;
    }
    if (p.setup === 'sharper') {
      const N = sharperNow(S), tmax = Math.max(p.stir ? 20 : 3 * 86400, S.ts * 1.1), dayScale = !p.stir, xs = v => dayScale ? v / 3600 : v;
      const items = [{ c: '#FFD66B', label: 'volume, this run' }, { c: 'rgba(201,212,234,.5)', label: 'what you poured in', dash: [4, 3] }, { c: '#9FE0B8', label: 'fully mixed', dash: [2, 3] }], Kk = K.plotKey(g, items);
      const lo = Math.min(N.full.V, N.sum) - Math.max(1, (N.sum - N.full.V) * 0.4), hi = N.sum + Math.max(1, (N.sum - N.full.V) * 0.3);
      const P = g.Plot({ xmin: 0, xmax: xs(tmax), ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: dayScale ? 'hours' : 'seconds', ylabel: 'volume, mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.hline(N.sum, 'rgba(201,212,234,.5)', [4, 3]); P.hline(N.full.V, '#9FE0B8', [2, 3]); P.line(S.hist.map(q => [xs(q[0]), q[1]]), '#FFD66B', 2.4); P.dot(xs(S.ts), N.V, 4.5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'evidence') {
      if (p.pexp === 'track') {
        // mean square step against the time between marks, from the run's own positions
        const D = Dgrain(p.T, p.rad, p.gly / 100) * 1e12, lags = [1, 2, 3, 4, 5, 6, 8], meas = [];
        lags.forEach(k => { let s = 0, n = 0; S.grains.forEach(gr => { for (let i = k; i < gr.tr.length; i++) { const dx = gr.tr[i][0] - gr.tr[i - k][0], dy = gr.tr[i][1] - gr.tr[i - k][1]; s += dx * dx + dy * dy; n += 2; } }); if (n) meas.push([k * p.dt, s / n]); });
        const tmax = 8 * p.dt * 1.05, ymax = Math.max(2 * D * tmax, ...meas.map(q => q[1])) * 1.1;
        const items = [{ c: '#FFD66B', label: '⟨x²⟩ measured', dot: true }, { c: 'rgba(201,212,234,.6)', label: '2Dt with N_A = 6.022 × 10²³', dash: [4, 3] }], Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'time between marks, s', ylabel: '⟨x²⟩, µm²', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line([[0, 0], [tmax, 2 * D * tmax]], 'rgba(201,212,234,.6)', 1.4, [4, 3]); meas.forEach(q => P.dot(q[0], q[1], 4.5, '#FFD66B', '#0B0F18')); });
        Kk.draw(P); return;
      }
      const H = scaleHeight(p.T, p.rad) * 1e6, tot = S.reads.reduce((u, v) => u + v, 0) || 1, items = [{ c: '#E0A21A', label: 'grains counted', box: true }, { c: 'rgba(201,212,234,.6)', label: 'e^(−h/H) at equilibrium', dash: [4, 3] }], Kk = K.plotKey(g, items);
      const Z = LEVELS.reduce((u, h) => u + Math.exp(-h / H), 0), ymax = Math.max(...S.reads.map(c => c / tot), ...LEVELS.map(h => Math.exp(-h / H) / Z)) * 1.2 || 1;
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'height in the cell, µm', ylabel: 'share of the grains counted', xticks: [5, 35, 65, 95], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => { S.reads.forEach((c, i) => P.bar(LEVELS[i], c / tot, 6, 0, '#E0A21A')); const pts = []; for (let h = 0; h <= 100; h += 2) pts.push([h, Math.exp(-h / H) / Z]); P.line(pts, 'rgba(201,212,234,.6)', 1.4, [4, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'atoms') {
      const tmax = Math.max(600, S.ts * 1.1), items = [{ c: '#9FD0FF', label: 'hydrogen' }, { c: '#FF8A80', label: 'oxygen' }, { c: 'rgba(255,138,128,.45)', label: '2 × oxygen', dash: [4, 3] }], Kk = K.plotKey(g, items);
      const ymax = Math.max(5, ...S.hist.map(q => q[1])) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: tmax / 60, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'gas collected, mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(S.hist.map(q => [q[0] / 60, q[1]]), '#9FD0FF', 2.4); P.line(S.hist.map(q => [q[0] / 60, q[2]]), '#FF8A80', 2.4); P.line(S.hist.map(q => [q[0] / 60, 2 * q[2]]), 'rgba(255,138,128,.45)', 1.2, [4, 3]); });
      Kk.draw(P); return;
    }
    const f1 = film(Object.assign({}, p, { drops: 1 })), items = [{ c: '#FFD66B', label: 'film diameter, this dropper and dilution' }, { c: 'rgba(255,138,128,.6)', label: 'the tray’s width', dash: [4, 3] }], Kk = K.plotKey(g, items), pond = p.tray === 'pond', u = pond ? 1 : 100;
    const pts = []; for (let n = 0; n <= 10; n += 0.1) pts.push([n, f1.d * Math.sqrt(n) * u]);
    const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: Math.max(f1.d * Math.sqrt(10), f1.tray.w) * u * 1.1, pad: { t: Kk.t }, xlabel: 'drops', ylabel: pond ? 'diameter, m' : 'diameter, cm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.hline(f1.tray.w * u, 'rgba(255,138,128,.6)', [4, 3]); P.line(pts, '#FFD66B', 2.2); P.dot(Math.round(p.drops), film(p).d * u, 5, '#FFD66B', '#0B0F18'); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'review' && p.what === 'ink') {
      const items = [{ c: '#C060C0', label: 'D of permanganate in water' }, { c: '#FFD66B', label: 'your bath', dot: true }], Kk = K.plotKey(g, items), pts = [];
      for (let T = 0; T <= 95; T += 1) pts.push([T, Dink(T) * 1e9]);
      const P = g.Plot({ xmin: 0, xmax: 95, ymin: 0, ymax: 6, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'D, 10⁻⁹ m²/s', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#C060C0', 2.2); P.dot(p.T, Dink(p.T) * 1e9, 5, '#FFD66B', '#0B0F18'); });
      P.tag(80, Dink(80) * 1e9, '× ' + (Dink(80) / Dink(20)).toFixed(1) + ' of 20 °C', '#AFC0D8', 'right', -10);
      Kk.draw(P); return;
    }
    if (p.setup === 'review') {
      const items = [{ c: '#D88040', label: 'time for the top to turn half brown' }, { c: '#FFD66B', label: 'this jar', dot: true }], Kk = K.plotKey(g, items), pts = [];
      if (!S._ht || S._ht.T !== p.T) { const arr = []; for (let l = -5; l <= 0.001; l += 0.25) arr.push([l, Math.log10(jarHalfTime(p.T, Math.pow(10, l)))]); S._ht = { T: p.T, arr }; }
      S._ht.arr.forEach(q => pts.push(q));
      const P = g.Plot({ xmin: -5, xmax: 0, ymin: -3, ymax: 4, pad: { t: Kk.t }, xlabel: 'air pressure in the jar, atm', ylabel: 'time', xticks: [-5, -4, -3, -2, -1, 0], xfmt: v => v === 0 ? '1' : '10' + '⁻' + '⁰¹²³⁴⁵'[-v], yticks: [-3, -2, -1, 0, 1, 2, 3, 4], yfmt: v => ({ '-3': '1 ms', '-2': '10 ms', '-1': '0.1 s', 0: '1 s', 1: '10 s', 2: '100 s', 3: '17 min', 4: '2.8 h' })[v] }).frame();
      P.clip(() => { P.line(pts, '#D88040', 2.2); P.dot(p.lp, Math.log10(jarHalfTime(p.T, Math.pow(10, p.lp))), 5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'sharper') {
      const items = [{ c: '#FFD66B', label: p.pair === 'beads' ? 'shrinkage, marbles + sand' : 'shrinkage, ethanol + water' }, { c: '#7FB2E8', label: 'water + water', dash: [4, 3] }, { c: '#FFD66B', label: 'your mixture', dot: true }], Kk = K.plotKey(g, items);
      const pts = [], tot = 100, pair = p.pair === 'water' ? 'ethanol' : p.pair; for (let i = 0; i <= 100; i++) { const a = i; const m = mixOf(pair, a, tot - a); pts.push([a, (tot - m.V) / tot * 100]); }
      const ymax = Math.max(...pts.map(q => q[1])) * 1.2;
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: -0.3, ymax: Math.max(1, ymax), pad: { t: Kk.t }, xlabel: (p.pair === 'beads' ? 'marbles' : 'ethanol') + ', % of the volume poured', ylabel: 'shrinkage, %', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(p.pair === 'beads' ? 0 : 1) }).frame();
      const N = sharperNow(S), share = p.vA + p.vB > 0 ? p.vA / (p.vA + p.vB) * 100 : 0;
      P.clip(() => { P.hline(0, '#7FB2E8', [4, 3]); P.line(pts, '#FFD66B', 2.2); P.dot(share, N.sum > 0 ? (N.sum - N.full.V) / N.sum * 100 : 0, 5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'evidence') {
      if (p.pexp === 'track') {
        const items = [{ c: '#FFD66B', label: 'N_A as the steps add up' }, { c: 'rgba(159,224,184,.7)', label: '6.022 × 10²³', dash: [4, 3] }], Kk = K.plotKey(g, items);
        const H = S.hist, xmax = Math.max(50, ...H.map(q => q[0])) * 1.05;
        const P = g.Plot({ xmin: 0, xmax, ymin: 0, ymax: 12, pad: { t: Kk.t }, xlabel: 'steps measured', ylabel: 'N_A, 10²³', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.hline(6.022, 'rgba(159,224,184,.7)', [4, 3]); P.line(H.map(q => [q[0], q[1] / 1e23]), '#FFD66B', 2.2); });
        Kk.draw(P); return;
      }
      const items = [{ c: '#E0A21A', label: 'ln(count)', dot: true }, { c: '#FFD66B', label: 'best line: slope −1/H' }], Kk = K.plotKey(g, items), lc = S.reads.map(c => Math.log(Math.max(c, 0.5)));
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: Math.min(0, ...lc) - 0.5, ymax: Math.max(1, ...lc) + 0.5, pad: { t: Kk.t }, xlabel: 'height, µm', ylabel: 'ln(grains counted)', xticks: [5, 35, 65, 95], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      const E = settleNA(S);
      P.clip(() => { if (isFinite(E.H)) { const m = lc.reduce((u, v) => u + v, 0) / 4, hm = 50; P.line([[0, m + hm / (E.H * 1e6)], [100, m - (100 - hm) / (E.H * 1e6)]], '#FFD66B', 1.6); } lc.forEach((v, i) => P.dot(LEVELS[i], v, 5, '#E0A21A', '#0B0F18')); });
      Kk.draw(P); return;
    }
    if (p.setup === 'atoms') {
      const items = [0, 0.1, 0.5, 1].map((c, i) => ({ c: ['#63729A', '#7FB2E8', '#9FD0FF', '#D8ECFF'][i], label: c ? c + ' M' : 'pure water' })).concat([{ c: '#FFD66B', label: 'now', dot: true }]), Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 0, xmax: 20, ymin: 0, ymax: 0.4, pad: { t: Kk.t }, xlabel: 'supply, V', ylabel: 'current, A', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => { [0, 0.1, 0.5, 1].forEach((c, i) => { const pts = []; for (let v = 0; v <= 20; v += 0.1) pts.push([v, current(v, c)]); P.line(pts, ['#63729A', '#7FB2E8', '#9FD0FF', '#D8ECFF'][i], 2); }); P.vline(CELLV.E0 + CELLV.over, 'rgba(255,138,128,.6)', [4, 3]); P.dot(p.volts, current(p.volts, p.conc), 5, '#FFD66B', '#0B0F18'); });
      P.tag(CELLV.E0 + CELLV.over, 0.37, '1.83 V: nothing below', '#FF8A80', 'left', 0);
      Kk.draw(P); return;
    }
    // the ladder of sizes, on one logarithmic axis
    const f = film(p), rows = [['the drop from the pipette', Math.cbrt(6 / Math.PI * 1e-6 / p.dpm)], ['the film', f.d], ['a hair', 80e-6], ['a bacterium', 2e-6], ['the film’s thickness', f.h], ['a carbon atom', 0.34e-9], ['its nucleus', 5.4e-15]];
    const P = g.Plot({ xmin: -15, xmax: 2, ymin: 0, ymax: rows.length + 0.5, pad: { t: 14, l: 10 }, xlabel: 'size, metres (each tick ×10)', ylabel: '', xticks: [-15, -12, -9, -6, -3, 0], xfmt: v => '10' + (v < 0 ? '⁻' : '') + String(Math.abs(v)).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''), yticks: [], yfmt: () => '' }).frame();
    P.clip(() => rows.forEach(([nm, v], i) => { const y = rows.length - i; P.line([[-15, y], [Math.log10(v), y]], 'rgba(255,214,107,.35)', 5); P.dot(Math.log10(v), y, 4.5, '#FFD66B', '#0B0F18'); }));
    rows.forEach(([nm, v], i) => P.tag(Math.log10(v), rows.length - i, nm + ' ' + fmtLen(v), '#DCE6F6', Math.log10(v) > -5 ? 'right' : 'left', -9));
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'review' && p.what === 'ink') {
      const r = inkRadius(S.ts, p.mg * 1e-6, p.T);
      return [{ label: 'Time', value: fmtT(S.ts), hint: 'time-lapse ×' + p.lapse }, { label: 'Diffusion coefficient D ∝ T/η', value: (Dink(p.T) * 1e9).toFixed(3), unit: '×10⁻⁹ m²/s', flag: 'accent', hint: '× ' + (Dink(p.T) / Dink(20)).toFixed(2) + ' of 20 °C' },
        { label: 'Water’s viscosity η', value: (eta(p.T) * 1000).toFixed(3), unit: 'mPa·s', hint: 'warmer water is runnier' }, { label: 'Cloud you can see', value: (r * 1000).toFixed(1), unit: 'mm', flag: r > 0 ? 'ok' : 'warn', hint: r > 0 ? 'out to 0.5 mg/L' : 'faded: too dilute to see' },
        { label: 'Typical spread √(6Dt)', value: (Math.sqrt(6 * Dink(p.T) * S.ts) * 1000).toFixed(1), unit: 'mm', hint: 'double the distance: 4 × the time' }, { label: 'Ink at the crystal', value: S.ts > 0 ? (inkPeak(S.ts, p.mg * 1e-6, p.T) * 1000).toPrecision(3) : '—', unit: 'mg/L' }];
    }
    if (p.setup === 'review') {
      const pa = Math.pow(10, p.lp);
      return [{ label: 'Time', value: fmtT(S.ts), hint: 'time-lapse ×' + p.lapse }, { label: 'Air pressure', value: pa >= 0.01 ? pa.toFixed(3) : pa.toExponential(1), unit: 'atm' }, { label: 'Mean speed of Br₂ √(8RT/πM)', value: vbar(p.T, BR2.M).toFixed(0), unit: 'm/s', hint: 'the same with air or without' },
        { label: 'Free path between hits', value: fmtLen(freePath(p.T, pa)), flag: freePath(p.T, pa) > BR2.jarD ? 'warn' : '', hint: freePath(p.T, pa) > BR2.jarD ? 'longer than the jar: they fly straight' : '' }, { label: 'D = 1/(1/D_air + 1/D_Kn)', value: sciU(Dbr(p.T, pa)), unit: 'm²/s', flag: 'accent' },
        { label: 'Top of the upper jar', value: Math.round(clamp(jarTop(S.jar), 0, 1) * 100), unit: '% of final', flag: jarTop(S.jar) >= 0.5 ? 'ok' : '' }, { label: 'Half brown at the top after', value: fmtT(jarHalfTime(p.T, pa)) }];
    }
    if (p.setup === 'sharper') {
      const N = sharperNow(S);
      return [{ label: 'Time since pouring', value: fmtT(S.ts) }, { label: 'Poured in', value: N.sum.toFixed(1), unit: 'mL' }, { label: 'Volume now', value: N.V.toFixed(2), unit: 'mL', flag: 'accent' }, { label: 'Fully mixed', value: N.full.V.toFixed(2), unit: 'mL', hint: p.pair === 'ethanol' ? 'CRC densities, 20 °C' : p.pair === 'beads' ? 'sand fills the gaps' : '' },
        { label: 'Missing', value: (N.sum - N.V).toFixed(2), unit: 'mL', flag: N.sum - N.V > 0.05 ? 'warn' : 'ok' }, { label: 'Mass (balance)', value: N.mass.toFixed(2), unit: 'g', flag: 'ok', hint: 'the same before and after' }, { label: 'Mixed', value: Math.round(N.m * 100), unit: '%' }];
    }
    if (p.setup === 'evidence') {
      const D = Dgrain(p.T, p.rad, p.gly / 100);
      if (p.pexp === 'track') { const v = trackNA(S); return [{ label: 'Time', value: fmtT(S.ts) }, { label: 'Viscosity η', value: (eta(p.T, p.gly / 100) * 1000).toFixed(2), unit: 'mPa·s' }, { label: 'D = RT/(N_A·6πηr)', value: (D * 1e12).toFixed(3), unit: 'µm²/s' }, { label: 'rms step in Δt', value: Math.sqrt(2 * D * p.dt * 1e12).toFixed(2), unit: 'µm' },
        { label: '⟨x²⟩ measured', value: S.disp.length ? meanSq(S.disp).toFixed(1) : '—', unit: 'µm²' }, { label: 'Steps measured', value: S.disp.length / 2 }, { label: 'N_A = RTΔt/(3πηr⟨x²⟩)', value: isFinite(v) ? sci(v, 2) : '—', flag: 'accent', hint: isFinite(v) ? (v / NA * 100 - 100).toFixed(0) + ' % from today’s value' : '' }]; }
      const E = settleNA(S), H = scaleHeight(p.T, p.rad);
      return [{ label: 'Since shaking', value: fmtT(S.ts) }, { label: 'Grain’s weight in water m′g', value: sciU((4 / 3) * Math.PI * Math.pow(p.rad * 1e-6, 3) * (GAMB.rho - rhoWater(p.T)) * G0), unit: 'N' }, { label: 'Scale height kT/m′g', value: (H * 1e6).toFixed(1), unit: 'µm', hint: 'halves every ' + (H * 1e6 * Math.LN2).toFixed(0) + ' µm' }, { label: 'Readings', value: S.nReads },
        { label: 'From the counts: halves every', value: isFinite(E.H) ? (E.H * 1e6 * Math.LN2).toFixed(1) : '—', unit: 'µm' }, { label: 'N_A = RT/(m′g·H)', value: isFinite(E.NA) ? sci(E.NA, 2) : '—', flag: isFinite(E.NA) && Math.abs(E.NA / NA - 1) < 0.15 ? 'ok' : 'warn', hint: S.ts < 3 * 3600 ? 'not settled yet' : '' }];
    }
    if (p.setup === 'atoms') {
      const G = gasesNow(S), I = current(p.volts, p.conc);
      return [{ label: 'Time', value: fmtT(S.ts) }, { label: 'Conductivity κ', value: kappa(p.conc) < 0.01 ? (kappa(p.conc) * 1e6).toFixed(1) : kappa(p.conc).toFixed(2), unit: kappa(p.conc) < 0.01 ? 'µS/m' : 'S/m' }, { label: 'Current I = (V − 1.83)/R', value: I >= 0.01 ? I.toFixed(3) : (I * 1e6).toFixed(2), unit: I >= 0.01 ? 'A' : 'µA', flag: I < 1e-3 ? 'warn' : '' },
        { label: 'Charge passed It', value: (I * S.ts).toFixed(1), unit: 'C' }, { label: 'Hydrogen It/2F', value: G.H.toFixed(2), unit: 'mL', flag: 'accent' }, { label: 'Oxygen It/4F', value: G.O.toFixed(2), unit: 'mL', hint: G.Ot - G.O > 0.01 ? (G.Ot - G.O).toFixed(2) + ' mL dissolved' : '' }, { label: 'Volume ratio H₂ : O₂', value: G.O > 0.05 ? (G.H / G.O).toFixed(2) : '—', unit: ': 1' }, { label: 'Molar volume of gas', value: molarVol(p.T).toFixed(2), unit: 'L/mol', hint: 'wet gas at 1 atm' }];
    }
    const f = film(p);
    return [{ label: 'Oil in the drops', value: sci(f.V * 1e6, 2), unit: 'mL' }, { label: 'Film diameter', value: fmtLen(f.d), flag: f.full ? 'warn' : '', hint: f.full ? 'reaches the edges: too much oil' : '' }, { label: 'Film area', value: f.A >= 1 ? f.A.toFixed(1) : (f.A * 1e4).toFixed(0), unit: f.A >= 1 ? 'm²' : 'cm²' },
      { label: 'Thickness h = V ÷ A', value: (f.h * 1e9).toFixed(p.oil === 'paraffin' ? 0 : 3), unit: 'nm', flag: 'accent' }, { label: 'Molecules in the film', value: sci(f.molecules, 2) }, { label: 'Area per molecule', value: p.oil === 'paraffin' ? '—' : OILS[p.oil].a.toFixed(2), unit: 'nm²' }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'review' && p.what === 'ink') return E.v('D') + ' ' + E.op('=') + ' ' + E.v('D') + E.sub('25') + ' · ' + E.frac(E.v('T'), '298 K') + ' · ' + E.frac(E.v('η') + E.sub('25'), E.v('η') + '(' + E.v('T') + ')') + ' ' + E.op('=') + ' 1.632 × ' + E.frac(E.n((p.T + 273.15).toFixed(1), 'K'), '298.15') + ' × ' + E.frac('0.893', (eta(p.T) * 1000).toFixed(3)) + ' ' + E.op('=') + ' ' + E.n((Dink(p.T) * 1e9).toFixed(3), '× 10⁻⁹ m²/s');
    if (p.setup === 'review') { const pa = Math.pow(10, p.lp); return E.frac('1', E.v('D')) + ' ' + E.op('=') + ' ' + E.frac('1', E.v('D') + E.sub('air')) + ' + ' + E.frac('1', E.v('D') + E.sub('Kn')) + ' :  ' + E.v('D') + E.sub('air') + ' ' + E.op('=') + ' ' + E.frac('0.0911 cm²/s', E.n(pa.toPrecision(2), 'atm')) + ',  ' + E.v('D') + E.sub('Kn') + ' ' + E.op('=') + ' ' + E.frac(E.v('v̄') + E.v('d'), '3') + ' ' + E.op('=') + ' ' + E.n(Dknudsen(p.T).toFixed(2), 'm²/s') + '  →  ' + E.n(sciU(Dbr(p.T, pa)), 'm²/s'); }
    if (p.setup === 'sharper') { const N = sharperNow(S); return p.pair === 'beads' ? E.v('V') + ' ' + E.op('=') + ' max(' + E.v('V') + E.sub('marbles') + ', ' + E.v('V') + E.sub('sand') + ' + 0.62 ' + E.v('V') + E.sub('marbles') + ') ' + E.op('=') + ' max(' + p.vA + ', ' + p.vB + ' + ' + (0.62 * p.vA).toFixed(1) + ') ' + E.op('=') + ' ' + E.n(N.full.V.toFixed(1), 'mL') : E.v('V') + ' ' + E.op('=') + ' ' + E.frac(E.v('m') + E.sub('ethanol') + ' + ' + E.v('m') + E.sub('water'), E.v('ρ') + E.sub('mix')) + ' ' + E.op('=') + ' ' + E.frac((p.vA * RHO_E).toFixed(2) + ' + ' + (p.vB * RHO_W).toFixed(2) + ' g', N.full.rho.toFixed(4) + ' g/mL') + ' ' + E.op('=') + ' ' + E.n(N.full.V.toFixed(2), 'mL'); }
    if (p.setup === 'evidence') { if (p.pexp === 'track') { const v = trackNA(S); return E.v('N') + E.sub('A') + ' ' + E.op('=') + ' ' + E.frac(E.v('RT') + 'Δ' + E.v('t'), '3π' + E.v('ηr') + '⟨' + E.v('x') + '²⟩') + ' ' + E.op('=') + ' ' + E.frac('8.314 × ' + (p.T + 273.15).toFixed(1) + ' × ' + p.dt, '3π × ' + (eta(p.T, p.gly / 100)).toExponential(3) + ' × ' + (p.rad * 1e-6).toExponential(3) + ' × ' + (S.disp.length ? (meanSq(S.disp) * 1e-12).toExponential(3) : '⟨x²⟩')) + ' ' + E.op('=') + ' ' + E.n(isFinite(v) ? sci(v, 2) : '…', ''); }
      const E2 = settleNA(S); return E.v('n') + '(' + E.v('h') + ') ' + E.op('=') + ' ' + E.v('n') + E.sub('0') + E.v('e') + E.sup('−' + E.v('m′gh') + '/' + E.v('kT')) + '  ⇒  ' + E.v('N') + E.sub('A') + ' ' + E.op('=') + ' ' + E.frac(E.v('RT'), E.v('m′g') + E.v('H')) + ' ' + E.op('=') + ' ' + E.n(isFinite(E2.NA) ? sci(E2.NA, 2) : '…', ''); }
    if (p.setup === 'atoms') { const I = current(p.volts, p.conc); return E.v('n') + '(H₂) ' + E.op('=') + ' ' + E.frac(E.v('It'), '2' + E.v('F')) + ' ' + E.op('=') + ' ' + E.frac(I.toFixed(4) + ' A × ' + S.ts.toFixed(0) + ' s', '2 × 96 485 C/mol') + ' ' + E.op('=') + ' ' + E.n((S.molH * 1000).toFixed(4), 'mmol') + ' → ' + E.n(gasVol(S.molH, p.T).toFixed(2), 'mL') + ';  ' + E.v('n') + '(O₂) ' + E.op('=') + ' ' + E.frac(E.v('It'), '4' + E.v('F')); }
    const f = film(p); return E.v('h') + ' ' + E.op('=') + ' ' + E.frac(E.v('V'), E.v('A')) + ' ' + E.op('=') + ' ' + E.frac(sci(f.V, 2) + ' m³', f.A.toPrecision(3) + ' m²') + ' ' + E.op('=') + ' ' + E.n((f.h * 1e9).toFixed(3), 'nm');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'review') return p.what === 'ink' ? 'Nothing pushes the ink: its ions are knocked about by water molecules that never stop moving, and wander outward. Hotter water moves faster and is runnier, so D grows. In a real beaker the colour usually spreads faster than this, because warm and cool water sets up currents — stillness is hard to get. The cloud you see is where the ink is above 0.5 mg/L; after many hours it fades even though it is still there.' : 'A bromine molecule flies at about 200 m/s, yet the colour takes a quarter of an hour to climb the jar: it hits an air molecule every 0.06 µm and is sent off in a new direction. Take the air away and it crosses the jar in about a millisecond. Diffusion is slow because of collisions, not because particles are slow.';
    if (p.setup === 'sharper') return p.pair === 'beads' ? 'The sand slips into the gaps between the marbles, so the pile is smaller than the two piles were — while every grain is still there. Shrinking when mixed is what you expect if a substance is made of separate particles with space between them.' : 'Ethanol and water molecules have different sizes and shapes and they attract each other (hydrogen bonds), so mixed they pack closer than either does alone. The balance shows nothing was lost. A model of matter as one kind of identical, featureless particle cannot explain this: chemistry needs particles of different kinds — atoms joined into molecules.';
    if (p.setup === 'evidence') return p.pexp === 'track' ? 'Perrin did not assume molecules; he counted their effect. A grain you can see is kicked by molecules you cannot, unevenly from moment to moment. How far it wanders tells you how big the kicks are — and so how many molecules make up a mole. The answer only stays the same when you change the grain, the liquid and the temperature if molecules are real.' : 'Gravity pulls the grains down; their Brownian jiggle spreads them up. They settle until the number halves every few tens of micrometres — the same balance as the air thinning with height, made 10¹¹ times smaller. Count too soon after shaking and you get the wrong answer.';
    if (p.setup === 'atoms') return 'Boiling turns water into steam made of the same H₂O molecules. Electrolysis turns it into two different substances, hydrogen and oxygen, always 2 : 1 by volume and 1 : 8 by mass — so a water molecule is built from smaller particles: two hydrogen atoms and one oxygen atom. Oxygen dissolves in water more than hydrogen does, so the first ratio is above 2. Pure water barely conducts: the sodium sulfate carries the current and is not used up.';
    return 'The oil spreads until it is one molecule thick, because one end of each molecule likes water and the other does not. So its thickness is the length of a molecule: volume ÷ area. A tenth of a millilitre of acid would cover a tennis court. Forget the dilution and you get an answer a thousand times too big; paraffin oil has no water-loving end and stays as a lens.';
  };

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function onDrag(S, e) {
    const A = S._ax && S._ax[e.id]; if (!A) return;
    const p = S.p, along = e.dx * A.ux + e.dy * A.uy;
    if (A.round) { S._dragAcc = (e.phase === 'start' ? 0 : (S._dragAcc || 0)) + along * A.per; const k = Math.trunc(S._dragAcc); if (!k) return; S._dragAcc -= k; p[A.key] = clamp(Math.round(p[A.key]) + k, A.min, A.max); }
    else p[A.key] = clamp(p[A.key] + along * A.per, A.min, A.max);
    if (A.re) this.setup(S);
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g7a-particle-detective',
    grade: 7, unit: '7A', topics: ['A1'],
    subject: 'chemistry',
    name: 'The Particle Detective — Evidence That Matter Is Made of Particles',
    chapter: 'Atoms and the Structure of Matter',
    exams: ['NGSS MS-PS1-1', 'NGSS MS-PS1-4', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag the bench to look round it · drag the gold rings: the thermometer, the gauge, the cylinders, the supply’s knob, the pipette',
    lede: 'You cannot see a particle. Five experiments that convinced the world anyway. Drop a <b>permanganate crystal</b> into still water and let <b>bromine</b> climb a gas jar — then pump the air out. Mix <b>50 mL of ethanol with 50 mL of water</b> and weigh it. ' +
      'Follow <b>Perrin’s gamboge grains</b> under a microscope and get Avogadro’s number from your own measurements. Split water in a <b>Hofmann voltameter</b>. Then measure a molecule with a ruler: one drop of <b>oleic acid</b> on water.',

    params: preset({}),
    presets: [
      { name: 'A crystal in still water, 20 °C', params: preset({ what: 'ink', T: 20, lapse: 60 }) },
      { name: 'The same crystal at 80 °C', params: preset({ what: 'ink', T: 80, lapse: 60 }) },
      { name: 'A day later: the cloud fades', params: preset({ what: 'ink', T: 20, lapse: 3600 }) },
      { name: 'Bromine climbing through air', params: preset({ what: 'bromine', lp: 0, lapse: 60 }) },
      { name: 'Bromine into a vacuum', params: preset({ what: 'bromine', lp: -4.5, lapse: 1 }) },
      { name: '50 mL ethanol + 50 mL water, stirred', params: preset({ setup: 'sharper', pair: 'ethanol', vA: 50, vB: 50, stir: true }) },
      { name: 'Poured gently, not stirred', params: preset({ setup: 'sharper', pair: 'ethanol', vA: 50, vB: 50, stir: false, lapse: 3600 }) },
      { name: 'Water + water: the control', params: preset({ setup: 'sharper', pair: 'water', vA: 50, vB: 50 }) },
      { name: 'Marbles and sand: a model', params: preset({ setup: 'sharper', pair: 'beads', vA: 50, vB: 50, stir: true }) },
      { name: 'Perrin 1909: grains of 0.367 µm', params: preset({ setup: 'evidence', pexp: 'track', rad: 0.367, T: 17, dt: 30, lapse: 30 }) },
      { name: 'Smaller grains, warmer water', params: preset({ setup: 'evidence', pexp: 'track', rad: 0.15, T: 40, dt: 30, lapse: 30 }) },
      { name: 'In 50 % glycerol: slower, same N_A', params: preset({ setup: 'evidence', pexp: 'track', rad: 0.367, gly: 50, T: 17, lapse: 30 }) },
      { name: 'Perrin’s settling cell, after 4 hours', params: preset({ setup: 'evidence', pexp: 'settle', rad: 0.212, T: 17, dt: 60, lapse: 3600 }) },
      { name: 'Electrolysis of water, 12 V', params: preset({ setup: 'atoms', volts: 12, conc: 0.5, lapse: 60 }) },
      { name: 'Pure water: no electrolyte', params: preset({ setup: 'atoms', volts: 20, conc: 0, lapse: 60 }) },
      { name: 'Boiling instead', params: preset({ setup: 'atoms', look: 'boil', volts: 12, conc: 0.5 }) },
      { name: 'One drop of 1 : 1000 oleic acid', params: preset({ setup: 'scale', oil: 'oleic', ldil: 3, drops: 1, dpm: 50 }) },
      { name: 'Undiluted: it floods the tray', params: preset({ setup: 'scale', oil: 'oleic', ldil: 0, drops: 1, dpm: 50, zoom: 'tray' }) },
      { name: 'Franklin’s teaspoon on Clapham pond', params: preset({ setup: 'scale', oil: 'olive', ldil: 0, drops: 100, dpm: 20, tray: 'pond', zoom: 'tray' }) },
      { name: 'Paraffin oil: no film', params: preset({ setup: 'scale', oil: 'paraffin', ldil: 0, drops: 1 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'What spreads', when: is('review'), items: [
        { key: 'what', type: 'select', label: 'Experiment', restructure: R_, rebuild: true, options: [{ value: 'ink', label: 'Permanganate in water' }, { value: 'bromine', label: 'Bromine in a gas jar' }] },
        { key: 'T', label: 'Water temperature', min: 2, max: 90, step: 1, unit: '°C', when: S => S.p.what === 'ink' },
        { key: 'mg', label: 'Crystal', min: 1, max: 20, step: 1, unit: 'mg', when: S => S.p.what === 'ink' },
        { key: 'lp', label: 'Air left in the jars', min: -5, max: 0, step: 0.05, unit: 'atm', restructure: R_, when: S => S.p.what === 'bromine', fmt: v => { const a = Math.pow(10, v); return a >= 0.01 ? a.toFixed(3) : a.toExponential(1); } } ] },
      { group: 'The two liquids', when: is('sharper'), items: [
        { key: 'pair', type: 'select', label: 'Pour', restructure: R_, options: [{ value: 'ethanol', label: 'Ethanol on water' }, { value: 'water', label: 'Water on water' }, { value: 'beads', label: 'Sand on marbles' }] },
        { key: 'vA', label: 'First cylinder', min: 0, max: 100, step: 1, unit: 'mL', restructure: R_ },
        { key: 'vB', label: 'Second cylinder', min: 0, max: 100, step: 1, unit: 'mL', restructure: R_ },
        { key: 'stir', type: 'toggle', label: 'Stir (or shake)' } ] },
      { group: 'The microscope', when: is('evidence'), items: [
        { key: 'pexp', type: 'select', label: 'Perrin’s method', restructure: R_, rebuild: true, options: [{ value: 'track', label: 'Track the grains' }, { value: 'settle', label: 'Count them settling' }] },
        { key: 'rad', label: 'Grain radius', min: 0.1, max: 1.5, step: 0.001, unit: 'µm', restructure: R_, fmt: v => v.toFixed(3) },
        { key: 'T', label: 'Temperature', min: 2, max: 60, step: 1, unit: '°C', restructure: R_ },
        { key: 'gly', label: 'Glycerol in the water', min: 0, max: 60, step: 5, unit: '%', restructure: R_, when: S => S.p.pexp === 'track' },
        { key: 'dt', label: 'Mark a position every', min: 5, max: 120, step: 5, unit: 's', restructure: R_ },
        { key: 'nG', label: 'Grains tracked', min: 3, max: 40, step: 1, restructure: R_, when: S => S.p.pexp === 'track' } ] },
      { group: 'The voltameter', when: is('atoms'), items: [
        { key: 'volts', label: 'Supply', min: 0, max: 20, step: 0.1, unit: 'V', fmt: v => v.toFixed(1) },
        { key: 'conc', label: 'Sodium sulfate', min: 0, max: 1.5, step: 0.05, unit: 'M', fmt: v => v.toFixed(2) },
        { key: 'T', label: 'Room', min: 5, max: 35, step: 1, unit: '°C' },
        { key: 'look', type: 'select', label: 'Close-up', restructure: R_, options: [{ value: 'electrode', label: 'At the electrodes' }, { value: 'boil', label: 'Boiling instead' }] } ] },
      { group: 'The drop and the tray', when: is('scale'), items: [
        { key: 'oil', type: 'select', label: 'Oil', restructure: R_, options: [{ value: 'oleic', label: 'Oleic acid' }, { value: 'olive', label: 'Olive oil' }, { value: 'paraffin', label: 'Paraffin oil' }] },
        { key: 'ldil', label: 'Diluted in ethanol, 1 part in', min: 0, max: 4, step: 0.1, restructure: R_, fmt: v => Math.round(Math.pow(10, v)).toLocaleString('en-US') },
        { key: 'dpm', label: 'Pipette', min: 20, max: 100, step: 1, unit: 'drops/mL', restructure: R_ },
        { key: 'drops', label: 'Drops', min: 1, max: 10, step: 1, restructure: R_ },
        { key: 'tray', type: 'select', label: 'On', restructure: R_, options: [{ value: 'tray', label: 'a 30 × 45 cm tray' }, { value: 'pond', label: 'Clapham pond' }] },
        { key: 'zoom', type: 'select', label: 'Look at', display: true, options: [{ value: 'tray', label: 'the film' }, { value: 'molecules', label: 'its molecules' }, { value: 'atom', label: 'one atom' }] } ] },
      { group: 'Time', when: S => S.p.setup !== 'scale', items: [
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 10, label: '×10' }, { value: 30, label: '×30' }, { value: 60, label: '×60' }, { value: 3600, label: 'an hour a second' }] },
        { key: 'seed', label: 'Another sample', min: 1, max: 9, step: 1, restructure: R_, display: true, when: S => S.p.setup === 'evidence' } ] }
    ],

    setup, step, drawStage, onPointer, onDrag,
    plots: [
      { title: S => ({ review: S.p.what === 'ink' ? 'The cloud you can see' : 'Bromine up the two jars', sharper: 'Volume after pouring', evidence: S.p.pexp === 'track' ? 'Mean square step against time' : 'Grains counted at each height', atoms: 'Gas in each limb', scale: 'Film diameter against drops' })[S.p.setup], draw: plot1 },
      { title: S => ({ review: S.p.what === 'ink' ? 'Diffusion against temperature' : 'How long, against the air left', sharper: 'Shrinkage across every mixture', evidence: S.p.pexp === 'track' ? 'Avogadro’s number, as the data come in' : 'ln(count) against height: a straight line', atoms: 'Current against voltage', scale: 'From the drop to the nucleus' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · analysing data', params: preset({ what: 'ink', T: 80 }),
        q: 'D for permanganate is proportional to T ÷ η (T in kelvin). Water’s viscosity is 1.005 mPa·s at 20 °C and 0.356 mPa·s at 80 °C. How many times faster is D at 80 °C?',
        predict: { label: 'D(80 °C) ÷ D(20 °C)', unit: '×', tol: 0.03 },
        measure: S => Dink(S.p.T) / Dink(20),
        working: '(353 ÷ 293) × (1.005 ÷ 0.356) = 1.205 × 2.82 ≈ <b>3.4</b>. Hot water: faster molecules and a runnier liquid.' },
      { source: 'CAST pattern · a model to predict', params: preset({ what: 'bromine', lp: Math.log10(0.5) }),
        q: 'In air at 1 atm the top of the upper jar is half brown after 15.6 minutes. D in a gas is inversely proportional to the pressure. Pump out half the air: how long now?',
        predict: { label: 'Time', unit: 'min', tol: 0.04 },
        measure: S => jarHalfTime(S.p.T, Math.pow(10, S.p.lp)) / 60,
        working: 'Half the air, twice the D, half the time: 15.6 ÷ 2 ≈ <b>7.8 min</b>. In a near vacuum it would be milliseconds.' },
      { source: 'CAST pattern · conservation and volume', params: preset({ setup: 'sharper', pair: 'ethanol', vA: 50, vB: 50, stir: true }),
        q: '50 mL of ethanol (0.7893 g/mL) and 50 mL of water (0.9982 g/mL) are mixed. The mixture’s density is 0.9265 g/mL. What volume do you get?',
        predict: { label: 'Volume', unit: 'mL', tol: 0.005 },
        measure: S => mixOf(S.p.pair, S.p.vA, S.p.vB).V,
        working: 'Mass = 39.47 + 49.91 = 89.38 g, the same before and after. V = 89.38 ÷ 0.9265 ≈ <b>96.5 mL</b> — 3.5 mL less than was poured in.' },
      { source: 'CAST pattern · a physical model', params: preset({ setup: 'sharper', pair: 'beads', vA: 60, vB: 30, stir: true }),
        q: 'A pile of marbles is 62 % glass and 38 % gaps. Shake 30 mL of fine sand into 60 mL of marbles. What volume does the mixture fill?',
        predict: { label: 'Volume', unit: 'mL', tol: 0.02 },
        measure: S => mixOf('beads', S.p.vA, S.p.vB).V,
        working: 'The gaps hold 0.38 × 60 = 22.8 mL; the sand needs 30 mL, so 7.2 mL of it sits on top: 60 + 7.2 = <b>67.2 mL</b>, not 90.' },
      { source: 'NGSS MS-PS1-1 · using a model to estimate', params: preset({ setup: 'evidence', pexp: 'track', rad: 0.367, T: 17, dt: 30, nG: 40, lapse: 30 }),
        q: 'Gamboge grains of radius 0.367 µm in water at 17 °C (η = 1.08 mPa·s) move a mean square of 32 µm² in each direction every 30 s. Perrin: N_A = RTt ÷ (3πηr⟨x²⟩). What do you get?',
        predict: { label: 'N_A', unit: '× 10²³', tol: 0.1 },
        measure: S => avogadroFromTracks(meanSq(perrinTracks(4000 + S.p.seed * 97, Math.round(S.p.nG), 100, S.p.dt, S.p.T, S.p.rad, S.p.gly / 100)), S.p.dt, S.p.T, S.p.rad, S.p.gly / 100) / 1e23,
        working: '8.314 × 290 × 30 ÷ (3π × 1.08 × 10⁻³ × 0.367 × 10⁻⁶ × 32 × 10⁻¹²) ≈ <b>6.0</b> × 10²³. The apparatus, with 4000 measured steps, gives about the same — the molecules nobody can see, counted.' },
      { source: 'CAST pattern · Perrin’s second method', params: preset({ setup: 'evidence', pexp: 'settle', rad: 0.212, T: 17 }),
        q: 'A gamboge grain of radius 0.212 µm (1.194 g/cm³) weighs 7.7 × 10⁻¹⁷ N in water; kT at 17 °C is 4.0 × 10⁻²¹ J. The number of grains halves every (kT ÷ weight) × 0.693. How many micrometres is that?',
        predict: { label: 'Halving height', unit: 'µm', tol: 0.04 },
        measure: S => scaleHeight(S.p.T, S.p.rad) * 1e6 * Math.LN2,
        working: '4.0 × 10⁻²¹ ÷ 7.7 × 10⁻¹⁷ = 52 µm; × 0.693 ≈ <b>36 µm</b>. Perrin measured about 30 µm — and from it, N_A.' },
      { source: 'CAST pattern · conservation of atoms', params: preset({ setup: 'atoms', volts: 12, conc: 0.5 }),
        q: 'The supply drives 0.117 A for 10 minutes. Each H₂ needs two electrons (96 485 C a mole of electrons); a mole of wet gas fills 24.6 L. How much hydrogen?',
        predict: { label: 'Hydrogen', unit: 'mL', tol: 0.03 },
        measure: S => gasVol(current(S.p.volts, S.p.conc) * 600 / (2 * FAR), S.p.T),
        working: '0.117 × 600 = 70.4 C; ÷ (2 × 96 485) = 0.365 mmol; × 24.6 L/mol ≈ <b>9.0 mL</b> — and half as much oxygen.' },
      { source: 'CAST pattern · the size of a molecule', params: preset({ setup: 'scale', oil: 'oleic', ldil: 3, drops: 1, dpm: 50 }),
        q: 'One drop (1/50 mL) of 1 part oleic acid in 1000 of ethanol makes a film 15 cm across. How thick is the film, in nanometres?',
        predict: { label: 'Thickness', unit: 'nm', tol: 0.05 },
        measure: S => { const f = film(S.p); return f.V / (Math.PI * f.d * f.d / 4) * 1e9; },
        working: 'Oil: 0.02 mL ÷ 1000 = 2 × 10⁻¹¹ m³. Area: π × 0.075² = 0.0177 m². h = 2 × 10⁻¹¹ ÷ 0.0177 ≈ <b>1.1 nm</b> — one molecule, about eight atoms long.' }
    ],

    walkthrough: [
      { title: 'Nobody stirs it', ask: 'A permanganate crystal sits on the bottom of still water. Will the colour spread if nobody touches it?', reveal: 'Yes — slowly. The water’s molecules are always moving and knock the ink’s ions about; the colour wanders outward by itself. Warm the water to 80 °C and it spreads 3.4 times faster.', params: preset({ what: 'ink', T: 20, lapse: 60 }) },
      { title: 'Fast particles, slow colour', ask: 'Bromine molecules fly at 200 m/s. Why does the brown take a quarter of an hour to climb 30 cm?', reveal: 'Each one hits an air molecule every 60 nanometres and goes off in a new direction. Pump the air out and the jar fills in about a millisecond.', params: preset({ what: 'bromine', lp: 0, lapse: 60 }) },
      { title: '50 + 50', ask: 'Pour 50 mL of ethanol into 50 mL of water and stir. Will there be 100 mL? Will the mass change?', reveal: 'There are 96.5 mL — and exactly the same mass. Nothing escaped; the particles packed closer. Water poured into water gives exactly 100 mL.', params: preset({ setup: 'sharper', pair: 'ethanol', stir: true }) },
      { title: 'Seeing the kicks', ask: 'A grain of gamboge is a million times heavier than a water molecule. Why does it jiggle?', reveal: 'Billions of molecules hit it every second, never exactly evenly. Perrin measured the jiggle and worked out how many molecules there are in a mole: about 6 × 10²³. Smaller grains, warmer water: more jiggle, the same number.', params: preset({ setup: 'evidence', pexp: 'track', lapse: 30 }) },
      { title: 'A particle that comes apart', ask: 'Boil water: what is the steam made of? Pass a current: what comes off?', reveal: 'Steam is water’s own molecules, farther apart. Electrolysis gives hydrogen and oxygen, 2 : 1 by volume — two new substances. The particle of water is made of smaller particles: atoms.', params: preset({ setup: 'atoms', lapse: 60 }) },
      { title: 'A ruler for molecules', ask: 'One drop of dilute oleic acid spreads to a disc 15 cm wide. How can that tell you the size of a molecule?', reveal: 'The film stops spreading when it is one molecule thick. Thickness = volume ÷ area = about 1.1 nm. A molecule is about a millionth of a millimetre; an atom ten times smaller.', params: preset({ setup: 'scale', zoom: 'molecules' }) }
    ],

    quiz: [
      { q: 'Permanganate spreads through still water faster when the water is hot because', options: ['the particles move faster', 'hot water is less dense', 'the colour gets lighter', 'heat pushes it'], answer: 0, explain: 'Particles of the water and the ink move faster and the water is runnier: D grows with T/η.' },
      { q: 'Bromine fills an evacuated jar almost instantly but takes minutes in air because', options: ['air molecules keep knocking it back', 'air is heavier than bromine', 'bromine is slower in air', 'the vacuum pulls it'], answer: 0, explain: 'Its speed is the same; in air its path is a random zigzag of tiny steps.' },
      { q: '50 mL of ethanol + 50 mL of water make about 96 mL. The mass of the mixture is', options: ['the sum of the two masses', 'less, as volume was lost', 'more, as it is denser', 'impossible to know'], answer: 0, explain: 'Mass is conserved; the particles pack closer, so the volume shrinks.' },
      { q: 'Brownian motion of a grain in water is evidence that', options: ['water is made of moving particles', 'the grain is alive', 'light pushes the grain', 'the water is warm'], answer: 0, explain: 'Uneven molecular kicks — Perrin used them to count molecules.' },
      { q: 'Electrolysis of water gives hydrogen and oxygen in a 2 : 1 volume ratio. This shows that', options: ['a water molecule is made of atoms of two elements', 'water is a mixture of two gases', 'boiling breaks water apart', 'water is an element'], answer: 0, explain: 'Boiling keeps the molecule; electrolysis breaks it into its atoms, H₂O.' },
      { q: 'An oil film is 1 nm thick. Roughly how many atoms is that?', options: ['about 10', 'about 1000', 'about a million', 'less than one'], answer: 0, explain: 'Atoms are about 0.1–0.2 nm across: an oleic acid molecule is about 8 carbon atoms tall.' }
    ],

    notes: '<p><b>The particle model.</b> All matter is made of particles too small to see, always moving (faster when hotter), with spaces between them, attracting each other. Diffusion is the evidence you can watch: no one stirs, and the colour still spreads.</p>' +
      '<p><b>A sharper picture.</b> A model of identical, featureless particles cannot explain 50 + 50 = 96.5. Chemists need particles of different kinds — atoms — joined into molecules with sizes and shapes.</p>' +
      '<p><b>Evidence.</b> Perrin (1908–09, Nobel Prize 1926) measured grains jiggling and settling and found N_A ≈ 6 × 10²³ both ways; after him, no scientist doubted atoms. Electrolysis (Nicholson and Carlisle, 1800) showed water’s particle has parts. Rayleigh (1890) and Pockels measured the thickness of an oil film: a molecule.</p>' +
      '<p><b>Scale.</b> Atoms are about 0.1–0.3 nm across: three hundred thousand of them span a hair. The nucleus is 100 000 times smaller still.</p>' +
      '<div class="pyq"><em>Misconception to catch</em>“The particles of a substance have its properties — copper particles are orange, water particles are wet, ice particles are cold.” Particles are not small pieces of the stuff; colour, wetness and temperature are what very many of them do together. And: “diffusion happens because the ink is pushed” — nothing pushes; it wanders.</div>'
  });

  L.models = L.models || {};
  L.models['g7a-particle-detective'] = { eta, Dink, inkRadius, inkPeak, vbar, Dfuller, Dknudsen, Dbr, freePath, jarStart, jarStep, jarAdvance, jarTop, jarHalfTime, rhoEW, mixOf, mixedAt, TAU_MIX, rhoWater, Dgrain, scaleHeight, perrinTracks, meanSq, avogadroFromTracks, settleCounts, avogadroFromCounts, LEVELS, kappa, pWater, current, gasVol, molarVol, monoThick, oilVol, film, OILS, NA };
})(window.InsightLab);
