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
  function jarHalfTime(Tc, pAtm) { const D = Dbr(Tc, pAtm), J = jarStart(), Lz = 2 * BR2.jarH, h = Lz * Lz / D / 4000; for (let k = 0; k < 40000; k++) { jarStep(J, D, h); if (jarTop(J) >= 0.5) return J.t; } return Infinity; }

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
  const kappa = c => 5.5e-6 + 12.9 * c / (1 + 0.6 * Math.sqrt(c));       // S/m
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

  L.models = L.models || {};
  L.models['g7a-particle-detective'] = { eta, Dink, inkRadius, inkPeak, vbar, Dfuller, Dknudsen, Dbr, freePath, jarStart, jarStep, jarAdvance, jarTop, jarHalfTime, rhoEW, mixOf, mixedAt, TAU_MIX, rhoWater, Dgrain, scaleHeight, perrinTracks, meanSq, avogadroFromTracks, settleCounts, avogadroFromCounts, LEVELS, kappa, pWater, current, gasVol, molarVol, monoThick, oilVol, film, OILS, NA };
})(window.InsightLab);
