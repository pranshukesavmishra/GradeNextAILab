/* ============================================================
   GRADE 6 · UNIT C · ENERGY, HEAT AND THERMAL SYSTEMS
   6C-2  The Particle Box — Matter, Motion and Temperature
   (C2.1 Matter is made of particles; C2.2 Evidence for particle motion;
    C2.3 Particle movement in solids, liquids and gases; C2.4 Temperature as
    average kinetic energy; C2.5 Temperature vs total thermal energy;
    C2.6 Measuring temperature)

   The particles are real molecular dynamics: Lennard-Jones particles (argon's
   σ = 0.34 nm, ε/k = 120 K, 40 u) integrated by velocity Verlet in a box with
   walls, a piston and a heater. Nothing switches between "solid mode" and
   "gas mode": the phase is measured from what the particles do.
     particles   — squeeze the piston: a gas gives way (Boyle), a liquid and a
                   solid hardly move. Space between particles, and how much.
     brownian    — a latex bead under the microscope, kicked by water it is too
                   small to show: its mean-square displacement grows as 4Dt
                   (Einstein), and from D you can count molecules (Perrin).
     phases      — one substance, cooled and heated: a vibrating crystal, a
                   pool of liquid, a gas. A constant-power heater draws the
                   heating curve, plateau and all.
     temperature — two gases in one box at one temperature: the light ones
                   faster, the heavy ones slower, the same average kinetic
                   energy — the speed histogram against Maxwell–Boltzmann.
     total       — a spark and a bathtub: which melts more ice?
     thermometer — a probe has a heat capacity of its own: it reads the drop
                   wrong, slowly, or both.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6C, MEAS, BENCH, R3, RX and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6C;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  function gauss(r) { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  /* ---------------- constants ---------------- */
  const KB = 1.380649e-23, NA = 6.02214076e23, U = 1.66053907e-27;
  const AR = { sigma: 0.34e-9, epsK: 119.8, m: 39.95 };                  // argon's Lennard-Jones parameters
  const TAU_LJ = AR.sigma * Math.sqrt(AR.m * U / (AR.epsK * KB));            // 2.15 ps, the model's unit of time

  /* ============================================================
     MOLECULAR DYNAMICS — reduced units (σ = ε = m = 1), 2D, walls, piston
     ============================================================ */
  const RC = 2.5, RC2 = RC * RC, SHIFT = 4 * (Math.pow(RC, -12) - Math.pow(RC, -6));
  /* o = { N, W, H, T, seed, species: [{frac, m, s, e}], lattice, gravity, piston:{M, F} , andersen } */
  function mdNew(o) {
    const r = rng(o.seed || 7), N = o.N, sp = o.species || [{ frac: 1, m: 1, s: 1, e: 1 }];
    const M = { N, W: o.W, H: o.H, x: new Float64Array(N), y: new Float64Array(N), vx: new Float64Array(N), vy: new Float64Array(N),
      fx: new Float64Array(N), fy: new Float64Array(N), k: new Uint8Array(N), sp, r, t: 0, g: o.gravity || 0,
      pist: o.piston ? { y: o.piston.y0 || o.H, v: 0, M: o.piston.M, F: o.piston.F, f: 0, c: o.piston.c || 0 } : null, nu: o.andersen == null ? 0 : o.andersen, T: o.T, heatIn: 0,
      x0: new Float64Array(N), y0: new Float64Array(N), wallQ: 0 };
    // species by fraction
    let c = 0; sp.forEach((s, i) => { const n = i === sp.length - 1 ? N - c : Math.round(s.frac * N); for (let j = 0; j < n && c < N; j++) M.k[c++] = i; });
    // place: a hexagonal lattice from the bottom up (spacing a), or loose
    const a = o.spacing || 1.12;
    let i = 0;
    for (let row = 0; i < N && row < 400; row++) for (let col = 0; i < N; col++) {
      const X = 1.15 + col * a + (row % 2 ? a / 2 : 0);
      if (X > o.W - 1.15) break;
      M.x[i] = X + (o.jitter ? (r() - 0.5) * o.jitter : 0);
      M.y[i] = 1.15 + row * a * 0.866;
      i++;
    }
    // shuffle species so the mixture is mixed
    for (let j = N - 1; j > 0; j--) { const q = Math.floor(r() * (j + 1)), t = M.k[j]; M.k[j] = M.k[q]; M.k[q] = t; }
    for (let j = 0; j < N; j++) { const s = sp[M.k[j]], sd = Math.sqrt(o.T / s.m); M.vx[j] = gauss(r) * sd; M.vy[j] = gauss(r) * sd; }
    zeroMomentum(M);
    mdForces(M);
    M.x0.set(M.x); M.y0.set(M.y);
    return M;
  }
  function zeroMomentum(M) { let px = 0, py = 0, mt = 0; for (let i = 0; i < M.N; i++) { const m = M.sp[M.k[i]].m; px += m * M.vx[i]; py += m * M.vy[i]; mt += m; } for (let i = 0; i < M.N; i++) { M.vx[i] -= px / mt; M.vy[i] -= py / mt; } }
  function mdForces(M) {
    const N = M.N, x = M.x, y = M.y, fx = M.fx, fy = M.fy, sp = M.sp, k = M.k;
    fx.fill(0); fy.fill(0);
    let pe = 0, vir = 0;
    // cell list
    const Htop = M.pist ? M.pist.y : M.H, cs = RC * 1.25, nx = Math.max(1, Math.ceil(M.W / cs)), ny = Math.max(1, Math.ceil((Htop + 1) / cs));
    const head = new Int32Array(nx * ny).fill(-1), next = new Int32Array(N);
    for (let i = 0; i < N; i++) { const cx = clamp(Math.floor(x[i] / cs), 0, nx - 1), cy = clamp(Math.floor(y[i] / cs), 0, ny - 1), c = cy * nx + cx; next[i] = head[c]; head[c] = i; }
    for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
      for (let i = head[cy * nx + cx]; i >= 0; i = next[i]) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ax = cx + dx, ay = cy + dy; if (ax < 0 || ay < 0 || ax >= nx || ay >= ny) continue;
          for (let j = head[ay * nx + ax]; j >= 0; j = next[j]) {
            if (j <= i) continue;
            const si = sp[k[i]], sj = sp[k[j]], s = (si.s + sj.s) / 2, e = Math.sqrt(si.e * sj.e);
            const rx = x[i] - x[j], ry = y[i] - y[j], r2 = (rx * rx + ry * ry) / (s * s);
            if (r2 >= RC2) continue;
            const ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2, f = 24 * e * ir6 * (2 * ir6 - 1) * ir2 / (s * s);
            fx[i] += f * rx; fy[i] += f * ry; fx[j] -= f * rx; fy[j] -= f * ry;
            pe += 4 * e * ir6 * (ir6 - 1) - e * SHIFT; vir += f * (rx * rx + ry * ry);
          }
        }
      }
    }
    // the walls: a particle feels the repulsive core of the wall within 2^(1/6)·σ/2 + 0.5
    let pistF = 0;
    const wall = (d, s) => { const sw = s * 0.5 + 0.5, dc = sw * 1.12246; if (d >= dc) return 0; const ir = sw / Math.max(d, 0.75 * sw), ir6 = Math.pow(ir, 6); return 24 * ir6 * (2 * ir6 - 1) / d; };
    for (let i = 0; i < N; i++) {
      const s = sp[k[i]].s;
      fx[i] += wall(x[i], s) - wall(M.W - x[i], s);
      fy[i] += wall(y[i], s);
      const ft = wall(Htop - y[i], s); fy[i] -= ft; pistF += ft;
      fy[i] -= M.g * sp[k[i]].m;
    }
    if (M.pist) M.pist.f = pistF;
    M.pe = pe; M.vir = vir;
  }
  /* one velocity-Verlet step of dt; heater power P (reduced) adds energy by scaling; Andersen collisions hold T */
  function mdStep(M, dt, o) {
    o = o || {};
    const N = M.N, x = M.x, y = M.y, vx = M.vx, vy = M.vy, fx = M.fx, fy = M.fy, sp = M.sp, k = M.k;
    for (let i = 0; i < N; i++) { const m = sp[k[i]].m; vx[i] += 0.5 * dt * fx[i] / m; vy[i] += 0.5 * dt * fy[i] / m; x[i] += dt * vx[i]; y[i] += dt * vy[i]; }
    if (M.pist) { const P = M.pist; P.v += 0.5 * dt * (P.f - P.F) / P.M; P.y += dt * P.v; if (P.y < 2) { P.y = 2; P.v = Math.max(0, P.v); } if (P.y > M.H) { P.y = M.H; P.v = Math.min(0, P.v); } }
    mdForces(M);
    for (let i = 0; i < N; i++) { const m = sp[k[i]].m; vx[i] += 0.5 * dt * fx[i] / m; vy[i] += 0.5 * dt * fy[i] / m; }
    if (M.pist) { const P = M.pist; P.v += 0.5 * dt * (P.f - P.F) / P.M; P.v *= Math.exp(-(P.c || 0) * dt / P.M); }
    // the heat bath: Andersen collisions with particles of the bath at T
    if (M.nu > 0) {
      const p = 1 - Math.exp(-M.nu * dt);
      for (let i = 0; i < N; i++) if (M.r() < p) { const m = sp[k[i]].m, sd = Math.sqrt(M.T / m), ke0 = 0.5 * m * (vx[i] * vx[i] + vy[i] * vy[i]); vx[i] = gauss(M.r) * sd; vy[i] = gauss(M.r) * sd; M.heatIn += 0.5 * m * (vx[i] * vx[i] + vy[i] * vy[i]) - ke0; }
    }
    // a constant-power heater: the energy goes in as kinetic energy, shared in proportion
    if (o.P) {
      const ke = kinetic(M), add = o.P * dt, f = Math.sqrt(Math.max(0.01, (ke + add) / Math.max(1e-9, ke)));
      for (let i = 0; i < N; i++) { vx[i] *= f; vy[i] *= f; }
      M.heatIn += (f * f - 1) * ke;
    }
    M.t += dt;
  }
  function kinetic(M, kind) { let ke = 0; for (let i = 0; i < M.N; i++) { if (kind != null && M.k[i] !== kind) continue; const m = M.sp[M.k[i]].m; ke += 0.5 * m * (M.vx[i] * M.vx[i] + M.vy[i] * M.vy[i]); } return ke; }
  function count(M, kind) { if (kind == null) return M.N; let n = 0; for (let i = 0; i < M.N; i++) if (M.k[i] === kind) n++; return n; }
  /* temperature from the mean kinetic energy: 2 degrees of freedom, KE = N kT */
  const tempOf = (M, kind) => kinetic(M, kind) / Math.max(1, count(M, kind));
  function energy(M) { let gp = 0; for (let i = 0; i < M.N; i++) gp += M.g * M.sp[M.k[i]].m * M.y[i]; const P = M.pist; return kinetic(M) + M.pe + gp + (P ? 0.5 * P.M * P.v * P.v + P.F * P.y : 0); }
  /* the mean number of neighbours within 1.5 σ: about 6 in a 2D crystal, 4–5 in a liquid, under 1 in a gas */
  function coordination(M) {
    let n = 0;
    for (let i = 0; i < M.N; i++) for (let j = i + 1; j < M.N; j++) { const s = (M.sp[M.k[i]].s + M.sp[M.k[j]].s) / 2, dx = M.x[i] - M.x[j], dy = M.y[i] - M.y[j]; if (dx * dx + dy * dy < 2.25 * s * s) n += 2; }
    return n / M.N;
  }
  function msd(M) { let s = 0; for (let i = 0; i < M.N; i++) { const dx = M.x[i] - M.x0[i], dy = M.y[i] - M.y0[i]; s += dx * dx + dy * dy; } return s / M.N; }
  /* the phase, read from what the particles do: neighbours and wandering */
  /* m: the mean-square distance (σ²) a particle strays in a 1.6 τ window — under 0.08 σ² it only vibrates round one place */
  function phaseOf(coord, m) { return m < 0.08 ? 'solid' : coord >= 3.6 ? 'liquid' : coord >= 2.4 ? 'liquid + gas' : 'gas'; }

  const MD0 = { mdNew, mdStep, mdForces, kinetic, tempOf, energy, coordination, msd, phaseOf, count, TAU_LJ, AR, KB, NA, U };
  /* ============================================================
     PARTICLES — a sealed syringe under load (Boyle, and the bulk moduli)
     ============================================================ */
  const P0 = 101.325, SYR = { r: 0.0145, plunger: 0.06 };              // kPa; the barrel's bore (m); the plunger and plate (kg)
  const SYR_A = Math.PI * SYR.r * SYR.r;
  const FILLS = {
    air: { name: 'air', K: null, gamma: 1.40, M: 0.029, rho: null, d: 0.37e-9, colour: '#BFD8F0' },
    co2: { name: 'carbon dioxide', K: null, gamma: 1.29, M: 0.044, rho: null, d: 0.40e-9, colour: '#D8E0E8' },
    water: { name: 'water', K: 2.2e6, beta: 2.1e-4, M: 0.018, rho: 998, d: 0.28e-9, colour: '#5FA8E8' },
    oil: { name: 'olive oil', K: 1.6e6, beta: 7.0e-4, M: 0.885, rho: 910, d: 1.2e-9, colour: '#D8B040' },
    bubble: { name: 'water with a 2 mL air bubble', K: 2.2e6, beta: 2.1e-4, M: 0.018, rho: 998, d: 0.28e-9, colour: '#5FA8E8', bubble: 2 }
  };                                                                        // K in kPa (2.2 GPa for water)
  const pressureOf = load => P0 + (load + SYR.plunger) * 9.81 / SYR_A / 1000;
  /* the volume after the load has been on for t seconds: a gas first squeezes adiabatically, then cools back to the room and shrinks to Boyle */
  function syringeV(fill, V0, load, Tc, t) {
    const F = FILLS[fill], P = pressureOf(load), P1 = pressureOf(0), Tk = Tc + 273.15, T0 = 293.15, tau = 18;
    const g = (F.gamma || FILLS.air.gamma);
    const gasV = Vg => { const iso = Vg * (P1 / P) * (Tk / T0), ad = Vg * Math.pow(P1 / P, 1 / g) * (Tk / T0); return iso + (ad - iso) * Math.exp(-t / tau); };
    if (!F.K) return gasV(V0);
    const Vb = F.bubble || 0, Vl = V0 - Vb;
    return Vl * (1 - (P - P1) / F.K) * (1 + F.beta * (Tc - 20)) + (Vb ? gasV(Vb) : 0);
  }
  function syringeOf(p, t) {
    const F = FILLS[p.fill], V = syringeV(p.fill, p.V0, p.load, p.Tc, t), P = pressureOf(p.load);
    let N, dGap;
    if (!F.K) { N = P1N(p.V0, p.Tc); dGap = Math.cbrt(V * 1e-6 / N); }
    else { N = F.rho * (p.V0 - (F.bubble || 0)) * 1e-6 / F.M * NA; dGap = Math.cbrt(F.M / (F.rho * NA)); }
    return { V, P, N, dGap, dV: p.V0 - V, F };
  }
  const P1N = (V0, Tc) => pressureOf(0) * 1000 * V0 * 1e-6 / (KB * (Tc + 273.15));

  /* ============================================================
     BROWNIAN — beads in a liquid: D = kT ÷ 6πηr (Stokes–Einstein)
     ============================================================ */
  const etaWater = Tc => 2.414e-5 * Math.pow(10, 247.8 / (Tc + 273.15 - 140));        // Pa·s (Vogel)
  const LIQUIDS = { water: { eta20: 1.002e-3, k: 1, name: 'water' }, g50: { eta20: 6.0e-3, k: 1.5, name: '50 % glycerol' }, g80: { eta20: 60.1e-3, k: 2.4, name: '80 % glycerol' } };
  const etaOf = (liq, Tc) => LIQUIDS[liq].eta20 * Math.pow(etaWater(Tc) / etaWater(20), LIQUIDS[liq].k);
  const Dof = (dUm, Tc, liq) => KB * (Tc + 273.15) / (6 * Math.PI * etaOf(liq, Tc) * dUm * 0.5e-6);   // m²/s
  const FRAME = 1 / 30;                                                                      // the camera's frame time, s
  /* n beads tracked for frames camera frames: positions in µm */
  function beadTracks(dUm, Tc, liq, n, frames, seed) {
    const r = rng(seed || 11), s = Math.sqrt(2 * Dof(dUm, Tc, liq) * FRAME) * 1e6, out = [];
    for (let b = 0; b < n; b++) { let x = 0, y = 0; const tr = new Float64Array(2 * (frames + 1)); for (let f = 1; f <= frames; f++) { x += gauss(r) * s; y += gauss(r) * s; tr[2 * f] = x; tr[2 * f + 1] = y; } out.push(tr); }
    return out;
  }
  /* the mean-square displacement of the tracks against lag, in µm², at lags in frames */
  function msdOf(tracks, lag) { let s = 0, n = 0; tracks.forEach(tr => { const F = tr.length / 2 - 1; for (let f = 0; f + lag <= F; f += Math.max(1, lag >> 1)) { const dx = tr[2 * (f + lag)] - tr[2 * f], dy = tr[2 * (f + lag) + 1] - tr[2 * f + 1]; s += dx * dx + dy * dy; n++; } }); return n ? s / n : 0; }
  /* Perrin's count: N_A = 4RT·t ÷ (6πηr·⟨r²⟩) */
  function perrin(dUm, Tc, liq, tracks, lagFrames) { const m = msdOf(tracks, lagFrames) * 1e-12, t = lagFrames * FRAME; return 4 * 8.314 * (Tc + 273.15) * t / (6 * Math.PI * etaOf(liq, Tc) * dUm * 0.5e-6 * m); }

  /* ============================================================
     PHASES and TEMPERATURE — the substances and gases, in argon's units
     ============================================================ */
  const SUBST = {
    ne: { name: 'neon', sigma: 0.2782e-9, epsK: 34.9, m: 20.18, melt: 24.6, boil: 27.1, colour: '#FF8A6A' },
    ar: { name: 'argon', sigma: 0.3405e-9, epsK: 119.8, m: 39.95, melt: 83.8, boil: 87.3, colour: '#8FB8FF' },
    kr: { name: 'krypton', sigma: 0.3633e-9, epsK: 167.0, m: 83.80, melt: 115.8, boil: 119.9, colour: '#B79CFF' },
    xe: { name: 'xenon', sigma: 0.3961e-9, epsK: 225.3, m: 131.29, melt: 161.4, boil: 165.1, colour: '#7FE0C0' }
  };
  const GASES = {
    he: { name: 'helium', m: 4.00, s: 0.2556 / 0.3405, e: 10.2 / 119.8, colour: '#FFD36B' },
    ne: { name: 'neon', m: 20.18, s: 0.2782 / 0.3405, e: 34.9 / 119.8, colour: '#FF8A6A' },
    ar: { name: 'argon', m: 39.95, s: 1, e: 1, colour: '#8FB8FF' },
    xe: { name: 'xenon', m: 131.29, s: 0.3961 / 0.3405, e: 225.3 / 119.8, colour: '#7FE0C0' }
  };
  const E2 = sb => sb.melt / 0.40;                                          // the model's ε/k: its 2D triple point (T* ≈ 0.40) put at the real melting point
  const tauOf = sb => sb.sigma * Math.sqrt(sb.m * U / (E2(sb) * KB));
  const vrms3 = (mU, Tk) => Math.sqrt(3 * KB * Tk / (mU * U));                 // a real gas, 3 dimensions
  const V_AR = AR.sigma / TAU_LJ;                                              // 158 m/s: argon's unit of speed

  /* ============================================================
     TOTAL — a hot object into an ice calorimeter
     ============================================================ */
  const OBJECTS = {
    spark: { name: 'a sparkler spark', c: 450, m: 4e-9, T: 1500, tau: 0.05, mat: 'iron' },
    nail: { name: 'a red-hot nail', c: 470, m: 0.005, T: 800, tau: 6, mat: 'steel' },
    tea: { name: 'a mug of tea', c: 4186, m: 0.25, T: 70, tau: 90, mat: 'water' },
    bath: { name: 'a bucket of bathwater', c: 4186, m: 10, T: 40, tau: 240, mat: 'water' }
  };
  const LF_ICE = 334000;
  function iceRun(o) {
    // o = { obj, T, logm, ice (kg) }: heat Q = mc(T − 0) flows into ice at 0 °C until the object is at 0 °C (or the ice is gone)
    const O = OBJECTS[o.obj], m = Math.pow(10, o.logm), Q = m * O.c * Math.max(0, o.T), melt = Math.min(o.ice, Q / LF_ICE);
    const left = Q - melt * LF_ICE, Tend = left > 0 ? left / (m * O.c + o.ice * 4186) : 0;
    const tau = O.tau * Math.cbrt(m / O.m);
    return { m, Q, melt, Tend, tau, abs: m * O.c * (o.T + 273.15), O };
  }

  /* ============================================================
     THERMOMETER — a probe with its own heat capacity
     ============================================================ */
  const THERMS = {
    glass: { name: 'liquid-in-glass', C: 1.2, tau: 8, res: 0.5 },
    probe: { name: 'digital probe', C: 2.5, tau: 4, res: 0.1 },
    tc: { name: 'fine thermocouple', C: 0.002, tau: 0.15, res: 0.1 },
    ir: { name: 'infrared gun', C: 0, tau: 0.5, res: 0.1 }
  };
  const SURFACES = { water: { eps: 0.96, name: 'open water' }, steel: { eps: 0.16, name: 'a shiny steel cup' } };
  function thermoRun(o) {
    // o = { th, V (mL), Ts, Tp0, surf, epsSet }: two nodes, sample and probe, and the sample cooling to a 20 °C room
    const Th = THERMS[o.th], Cs = o.V * 4.186 + (o.surf === 'steel' ? 0.05 * 500 : 0), hA = 0.012 * Math.pow(o.V / 100, 2 / 3) + 0.0004, G = Th.C > 0 ? Th.C / Th.tau : 0;
    let Ts = o.Ts, Tp = o.Tp0, Tr = o.Tp0, t = 0;
    const dt = Math.min(0.02, Th.tau / 8), rows = [], tEnd = o.tEnd || 60, eps = SURFACES[o.surf].eps;
    let n = 0;
    while (t <= tEnd + 1e-9) {
      if (n % Math.max(1, Math.round(0.1 / dt)) === 0) rows.push({ t, Ts, Tr });
      const q = G * (Ts - Tp);
      Ts += (-hA * (Ts - 20) - q) / Cs * dt;
      if (Th.C > 0) Tp += q / Th.C * dt;
      // what it shows: the probe's own temperature, or for the gun the radiance it sees, through its own lag
      const target = Th.C > 0 ? Tp : apparentT(Ts, eps, o.epsSet, 20);
      Tr += (target - Tr) * (o.th === 'ir' ? dt / Th.tau : 1);
      t += dt; n++;
    }
    const last = rows[rows.length - 1];
    const eq = Th.C > 0 ? (Cs * o.Ts + Th.C * o.Tp0) / (Cs + Th.C) : o.Ts;
    let t05 = null; for (const r of rows) if (Math.abs(r.Tr - r.Ts) < 0.5) { t05 = r.t; break; }
    return { rows, eq, t05, last, Cs };
  }
  /* an IR thermometer set for emissivity epsSet looking at a surface of emissivity eps at T, in a room at Tr */
  function apparentT(T, eps, epsSet, Tr) {
    const a = Math.pow(T + 273.15, 4), r = Math.pow(Tr + 273.15, 4), W = eps * a + (1 - eps) * r;
    return Math.pow((W - (1 - epsSet) * r) / epsSet, 0.25) - 273.15;
  }
  const toUnit = (Tc, u) => u === 'F' ? Tc * 9 / 5 + 32 : u === 'K' ? Tc + 273.15 : Tc;
  const uName = u => u === 'F' ? '°F' : u === 'K' ? 'K' : '°C';

  /* ============================================================
     SET-UPS, STATE
     ============================================================ */
  const SETUPS = [
    { value: 'particles', label: 'Squeeze it: the space between particles', teaches: ['C2.1'] },
    { value: 'brownian', label: 'A bead that will not keep still', teaches: ['C2.2'] },
    { value: 'phases', label: 'Solid, liquid, gas: one substance', teaches: ['C2.3'] },
    { value: 'temperature', label: 'Two gases, one temperature', teaches: ['C2.4'] },
    { value: 'total', label: 'A spark against a bucket of bathwater', teaches: ['C2.5'] },
    { value: 'thermometer', label: 'A thermometer changes what it measures', teaches: ['C2.6'] }
  ];
  const BASE = {
    setup: 'phases', fill: 'air', V0: 40, load: 4, Tc: 20,
    bead: 1.0, bT: 20, liq: 'water', trail: true,
    subst: 'ar', TK: 70, N: 140, mode: 'hold', power: 'gentle',
    gasA: 'he', gasB: 'xe', TG: 300, fracB: 0.5, start: 'same',
    obj: 'tea', objFor: 'tea', objT: 70, logm: Math.log10(0.25), ice: 1.0,
    th: 'glass', sV: 10, sT: 80, Tp0: 20, surf: 'water', epsSet: 0.95, unit: 'C'
  };
  function preset(o) { const q = Object.assign({}, BASE, o); if (o.obj) q.objFor = o.obj; return q; }
  const is = (...v) => S => v.indexOf(S.p.setup) >= 0;
  const POWER = { gentle: 0.004, strong: 0.012 };                  // ε per τ per particle

  function mdFor(S) {
    const p = S.p;
    if (p.setup === 'phases') {
      const T = p.TK / E2(SUBST[p.subst]);
      return mdNew({ N: p.N, W: 24, H: 28, T: p.mode === 'heat' ? T : T, seed: 5, andersen: p.mode === 'hold' ? 2 : 0, gravity: 0.004, jitter: 0.04 });
    }
    if (p.setup === 'temperature') {
      const A = GASES[p.gasA], B = GASES[p.gasB], fB = p.gasA === p.gasB ? 0 : p.fracB, T = p.TG / 119.8;
      const sp = [{ frac: 1 - fB, m: A.m / 39.95, s: A.s, e: A.e }, { frac: fB, m: B.m / 39.95, s: B.s, e: B.e }];
      const M = mdNew({ N: 110, W: 30, H: 30, T, seed: 13, species: sp, spacing: 2.6, jitter: 0.5, andersen: p.start === 'same' ? 0.4 : 0 });
      if (p.start === 'hot-heavy') for (let i = 0; i < M.N; i++) { const f = M.k[i] === 1 ? Math.sqrt(2) : Math.sqrt(0.5); M.vx[i] *= f; M.vy[i] *= f; }
      return M;
    }
    if (p.setup === 'brownian') {
      // one big particle among small ones: put it in the middle and move the small ones it would overlap to the edges
      const M = mdNew({ N: 90, W: 16, H: 16, T: 2.0, seed: 21, species: [{ frac: 1 / 90, m: 25, s: 4.0, e: 1 }, { frac: 89 / 90, m: 1, s: 1, e: 1 }], spacing: 1.45, jitter: 0.2, andersen: 0.6 });
      let big = 0; for (let i = 0; i < M.N; i++) if (M.k[i] === 0) big = i;
      M.x[big] = 8; M.y[big] = 8; M.vx[big] = 0; M.vy[big] = 0;
      const r = rng(5);
      for (let i = 0; i < M.N; i++) {
        if (i === big) continue;
        let tries = 0;
        while (tries++ < 400) {
          const near = Math.hypot(M.x[i] - 8, M.y[i] - 8) < 2.9;
          let clash = false; for (let j = 0; j < i && !clash; j++) if (j !== big && Math.hypot(M.x[i] - M.x[j], M.y[i] - M.y[j]) < 0.95) clash = true;
          if (!near && !clash) break;
          M.x[i] = 1.2 + r() * 13.6; M.y[i] = 1.2 + r() * 13.6;
        }
      }
      mdForces(M); M.x0.set(M.x); M.y0.set(M.y);
      return M;
    }
    if (p.setup === 'total') return mdNew({ N: 64, W: 14, H: 14, T: 1.2, seed: 31, spacing: 1.6, jitter: 0.3 });
    if (p.setup === 'particles') {
      const R = syringeOf(p, 0), F = FILLS[p.fill];
      if (!F.K) { const B = 22, n = clamp(Math.round(Math.pow(B * F.d / R.dGap, 2)), 3, 40); return mdNew({ N: n, W: B, H: B, T: (p.Tc + 273.15) / 119.8, seed: 41, spacing: B / Math.sqrt(n), jitter: 1.5 }); }
      return mdNew({ N: 130, W: 12.5, H: 12.5, T: (p.Tc + 273.15) / 119.8 * 0.35, seed: 41, spacing: 1.05, jitter: 0.02, andersen: 1 });
    }
    return null;
  }
  const SUBSTEPS = { phases: 8, temperature: 16, brownian: 6, total: 4, particles: 4 };
  const DT_MD = { phases: 0.005, temperature: 0.003, brownian: 0.004, total: 0.004, particles: 0.004 };
  function setup(S) {
    const p = S.p;
    // choosing a new object brings its own temperature and mass (p.objFor remembers which object they belong to)
    if (p.objFor !== p.obj) { p.objT = OBJECTS[p.obj].T; p.logm = Math.log10(OBJECTS[p.obj].m); p.objFor = p.obj; }
    p.N = clamp(Math.round(p.N / 10) * 10, 60, 200);
    S.ts = 0; S.ta = S.ta || 0; S.frame = 0; S.tags = null; S.bigTr = null; S.hist = null; S.heatRows = []; S.qIn = 0; S.mdTrack = [];
    S.md = mdFor(S); S.md2 = p.setup === 'total' ? mdNew({ N: 16, W: 14, H: 14, T: 1.2, seed: 32, spacing: 3.2, jitter: 0.3 }) : null;
    if (S.md && p.setup === 'phases') { S.md.x0.set(S.md.x); S.md.y0.set(S.md.y); S._dWin = []; }
    S._tr = null; S._bt = null; S._th = null;
    const want3D = p.setup === 'particles' || p.setup === 'total' || p.setup === 'thermometer';
    if (!want3D) { S.cam = null; S.camFor = null; return; }
    if (!S.cam || S.camFor !== p.setup) {
      const H = { particles: { theta: -1.40, phi: 0.18, dist: 0.72, target: [0.10, 0, 0.19] }, total: { theta: -1.35, phi: 0.30, dist: 0.95, target: [0.10, 0, 0.12] }, thermometer: { theta: -1.30, phi: 0.26, dist: 0.62, target: [0.10, 0, 0.11] } }[p.setup];
      S.cam = Camera({ theta: H.theta, phi: H.phi, dist: H.dist, target: H.target.slice(), fov: 0.72 });
      S.cam.minDist = 0.3; S.cam.maxDist = 4; S.camFor = p.setup; S._nar = null;
    }
  }
  /* the run's own clock: what each set-up advances */
  function step(S, dt) {
    const p = S.p;
    S.ta = (S.ta || 0) + dt;
    if (S.md) {
      const n = SUBSTEPS[p.setup] || 4, h = DT_MD[p.setup] || 0.004;
      const P = p.setup === 'phases' && p.mode !== 'hold' ? (p.mode === 'heat' ? 1 : -1) * POWER[p.power] * S.md.N : 0;
      for (let k = 0; k < n; k++) {
        if (P && p.mode === 'cool' && tempOf(S.md) < 0.05) break;
        mdStep(S.md, h, P ? { P } : {});
        if (P) S.qIn += P * h;
      }
      if (S.md2) for (let k = 0; k < n; k++) mdStep(S.md2, h);
      if (p.setup === 'brownian') { let b = 0; for (let i = 0; i < S.md.N; i++) if (S.md.k[i] === 0) b = i; (S.bigTr = S.bigTr || []).push([S.md.x[b], S.md.y[b]]); if (S.bigTr.length > 400) S.bigTr.shift(); }
      if (p.setup === 'temperature') {
        if (!S.hist) S.hist = { A: new Float64Array(40), B: new Float64Array(40), n: 0 };
        const vmax = histMax(p);
        for (let i = 0; i < S.md.N; i++) { const v = Math.hypot(S.md.vx[i], S.md.vy[i]), b = Math.min(39, Math.floor(v / vmax * 40)); (S.md.k[i] ? S.hist.B : S.hist.A)[b]++; }
        S.hist.n++;
        S.mdTrack.push({ t: S.md.t, A: tempOf(S.md, 0), B: tempOf(S.md, 1) }); if (S.mdTrack.length > 600) S.mdTrack.shift();
      }
      if (p.setup === 'phases') {
        S.frame++;
        if (S.frame % 4 === 0) {
          const c = coordination(S.md), D = msd(S.md);
          S.heatRows.push({ q: S.qIn / S.md.N, T: tempOf(S.md), c, t: S.md.t });
          if (S.heatRows.length > 900) S.heatRows.shift();
          if (S.frame % 40 === 0) { S._dLast = D; S.md.x0.set(S.md.x); S.md.y0.set(S.md.y); S._t0 = S.md.t; }
          S._cLast = c;
        }
        if (!S.tags) S.tags = [5, Math.floor(S.md.N / 2), S.md.N - 3].map(i => ({ i, pts: [] }));
        S.tags.forEach(tg => { tg.pts.push([S.md.x[tg.i], S.md.y[tg.i]]); if (tg.pts.length > 160) tg.pts.shift(); });
      }
    }
    S.ts += dt * (p.setup === 'thermometer' ? 1 : p.setup === 'total' ? Math.max(1, iceOf(S).tau / 8) : 1);
    if (p.setup === 'brownian') S.frame = Math.min(BEAD_FRAMES, Math.floor(S.ts / FRAME));
  }
  const histMax = p => { const ml = Math.min(GASES[p.gasA].m, GASES[p.gasB].m) / 39.95; return 4.2 * Math.sqrt((p.TG / 119.8) * (p.start === 'hot-heavy' ? 2 : 1) / ml); };
  const BEAD_FRAMES = 1800;
  function beadsOf(S) {
    const p = S.p, key = [p.bead, p.bT, p.liq].join('|');
    if (S._bt && S._bt.key === key) return S._bt;
    S._bt = { key, field: beadTracks(p.bead, p.bT, p.liq, 7, BEAD_FRAMES, 7), many: beadTracks(p.bead, p.bT, p.liq, 300, 600, 5) };
    return S._bt;
  }
  function iceOf(S) { const p = S.p; return iceRun({ obj: p.obj, T: p.objT, logm: p.logm, ice: p.ice }); }
  function thermOf(S) {
    const p = S.p, key = [p.th, p.sV, p.sT, p.Tp0, p.surf, p.epsSet].join('|');
    if (S._th && S._th.key === key) return S._th.R;
    const R = thermoRun({ th: p.th, V: p.sV, Ts: p.sT, Tp0: p.Tp0, surf: p.surf, epsSet: p.epsSet, tEnd: 60 });
    S._th = { key, R }; return R;
  }
  const thRow = (R, t) => R.rows[clamp(Math.round(t / 0.1), 0, R.rows.length - 1)];

  /* ============================================================
     HELPERS
     ============================================================ */
  let NAR = false;                                                    // set each frame: callouts lead out less far on a phone
  const co = (F, at, dx, dy, t, c, o) => window.R3.callout(F, at, NAR ? dx * 0.45 : dx, dy, t, c, o);
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  function tag(ctx, x, y, text, col, o) {
    o = o || {};
    ctx.save(); ctx.font = mono(o.size || 9.5, 600);
    const w = ctx.measureText(text).width + 10, h = (o.size || 9.5) + 7;
    let X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    if (o.W) X = clamp(X, 4, o.W - w - 4);
    ctx.fillStyle = o.fill || 'rgba(6,10,20,.82)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X, y - h / 2, w, h, 3); else ctx.rect(X, y - h / 2, w, h); ctx.fill();
    ctx.fillStyle = col || '#E8EEF8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + 5, y + 0.5);
    ctx.restore();
  }
  const fJ = J => { const a = Math.abs(J); if (a < 1e-12) return '0 J'; return a >= 1e6 ? (J / 1e6).toFixed(a >= 1e7 ? 1 : 2) + ' MJ' : a >= 1e3 ? (J / 1e3).toFixed(a >= 1e4 ? 1 : 2) + ' kJ' : a >= 1 ? J.toFixed(a >= 100 ? 0 : 2) + ' J' : a >= 1e-3 ? (J * 1e3).toFixed(2) + ' mJ' : (J * 1e6).toFixed(2) + ' µJ'; };
  const sci = v => { if (!isFinite(v) || v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return m.toFixed(2) + ' × 10^' + e; };
  const fNm = m => m >= 1e-6 ? (m * 1e6).toFixed(2) + ' µm' : (m * 1e9).toFixed(2) + ' nm';
  function scene(S, g, x0, x1, y0, y1, wall) {
    const ctx = g.ctx, W = g.w, H = g.h, M = window.MEAS, R3 = window.R3;
    S.cam.setViewport(W, H); S.cam.update();
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9FAAB6'); bg.addColorStop(1, '#CDD4DA');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const F0 = R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
    if (S.cam.eye[1] < y1) M.tileWall(F0, x0 - 0.3, x1 + 0.3, y1 + 0.01, 0, wall || 0.8);
    M.bench(F0, x0, x1, y0, y1, {});
    F0.render();
    return R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
  }
  /* the particles of an MD box laid into a pixel rectangle */
  function mdPts(M, box, colours, o) {
    o = o || {};
    const k = Math.min(box.w / M.W, box.h / M.H), out = [];
    for (let i = 0; i < M.N; i++) {
      const s = M.sp[M.k[i]].s;
      out.push({ x: box.x + M.x[i] * k, y: box.y + box.h - M.y[i] * k, r: s * 0.5 * k * (o.shrink || 0.96), c: colours[M.k[i]] || colours[0], i });
    }
    return { pts: out.sort((a, b) => a.r - b.r), k };
  }
  function darkPlate(g) {
    const ctx = g.ctx, W = g.w, H = g.h;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0B1222'); bg.addColorStop(1, '#141E33');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  }
  function scaleBar(ctx, x, y, px, label) {
    ctx.save(); ctx.strokeStyle = '#E8EEF8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + px, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.moveTo(x + px, y - 4); ctx.lineTo(x + px, y + 4); ctx.stroke();
    ctx.fillStyle = '#E8EEF8'; ctx.font = mono(9.5, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, x + px / 2, y - 5); ctx.restore();
  }
  function cardTitle(g, at, text) { const ctx = g.ctx; ctx.save(); ctx.textAlign = 'left'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText(text, at.x + 10, at.y + 8); ctx.restore(); }

  /* ============================================================
     THE STAGE — particles: the syringe
     ============================================================ */
  function drawParticles(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, BENCH = window.BENCH;
    const R = syringeOf(p, S.ts), F = scene(S, g, -0.35, 0.45, -0.25, 0.25, 0.8);
    const top = BENCH.clampStand(F, [0.12, 0.10, 0], 0.30, {});
    BENCH.bossClamp(F, [top[0], top[1], 0.08], {});
    R3.cylinder(F, [top[0], top[1], 0.08], [0.0, 0.02, 0.08], 0.004, '#A8B2C0', { segments: 6, shadow: false });
    const Sy = A.syringe(F, [0.0, 0.02, 0.0], R.V, { fill: R.F.colour, load: p.load, cap: 60 });
    if (R.F.bubble) {
      const bz = Sy.zV - 0.004 - (R.V - (p.V0 - R.F.bubble)) * 1e-6 / (Math.PI * Sy.r * Sy.r) / 2;
      R3.sphere(F, [0.0, 0.02 - Sy.r * 0.4, Math.max(Sy.z0 + 0.003, bz)], Math.cbrt((R.V - (p.V0 - R.F.bubble)) * 1e-6 * 3 / (4 * Math.PI)), '#EAF4FF', { shadow: false, rim: 0.9, bias: -0.02 });
    }
    window.MEAS.mat(F, [0.0, 0.02], 0.10, {});
    const q = S.cam.project([0.0, -0.02, Sy.zV]);
    F.render();
    if (q.ok) tag(ctx, q.x - 26, q.y, R.V.toFixed(R.V < 10 ? 3 : 2) + ' mL', '#FFE9A8', { align: 'right', W });
    const qt = S.cam.project([0.0, 0.02, Sy.topZ + 0.02]);
    if (qt.ok) tag(ctx, qt.x, qt.y - 12, p.load.toFixed(1) + ' kg on the plunger', '#E8EEF8', { align: 'center', W });
    // the close-up: the particles at this spacing
    const cw = Math.min(260, W * 0.3), at = K.cardSlot(g, S, 'the particles inside', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at && S.md) {
      const h = cw + 80; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' }); cardTitle(g, at, 'Inside, magnified ~ 50 million ×');
      const box = { x: at.x + 14, y: at.y + 30, w: at.w - 28, h: at.w - 28 };
      A.cellPlate(ctx, box, 0, { stageLabel: ' ', lid: true });
      const D = mdPts(S.md, box, [R.F.colour]);
      ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); A.particles(ctx, D.pts); ctx.restore();
      const sig = R.F.d, nmPx = D.k / (sig * 1e9);
      scaleBar(ctx, box.x + 10, box.y + box.h - 10, nmPx * (R.F.K ? 1 : 2), R.F.K ? '1 nm' : '2 nm');
      ctx.save(); ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('spacing ' + fNm(R.dGap) + ' · particle ' + fNm(R.F.d), at.x + 12, box.y + box.h + 32);
      ctx.fillText('gaps: ' + (R.dGap / R.F.d).toFixed(1) + ' × the particle’s own size', at.x + 12, box.y + box.h + 46);
      ctx.restore();
    }
    K.header(g, R.F.K ? (R.F.bubble ? 'Water with a bubble: only the bubble gives — ' + R.dV.toFixed(3) + ' mL less' : 'Squeezed by ' + (R.P - pressureOf(0)).toFixed(0) + ' kPa, the ' + R.F.name + ' shrinks by only ' + (R.dV * 1000).toFixed(2) + ' µL')
        : 'Squeezed by ' + (R.P - pressureOf(0)).toFixed(0) + ' kPa, the ' + R.F.name + ' gives way: ' + p.V0.toFixed(0) + ' → ' + R.V.toFixed(1) + ' mL',
      'pressure ' + R.P.toFixed(1) + ' kPa · volume ' + R.V.toFixed(3) + ' mL · ' + sci(R.N) + ' particles · t = ' + S.ts.toFixed(1) + ' s',
      R.F.K ? 'liquid particles already touch: there is almost no space to squeeze out' : 'gas particles are ~' + (R.dGap / R.F.d).toFixed(0) + ' of their own widths apart: the space is what you squeeze');
  }

  /* ============================================================
     THE STAGE — brownian: the microscope field
     ============================================================ */
  function drawBrownian(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW;
    darkPlate(g);
    const Bt = beadsOf(S), f = S.frame, fieldUm = 40;
    const R = Math.max(30, Math.min(narrow ? W * 0.44 : W * 0.30, (H - K.HDR - 50) / 2)), cx = narrow ? W / 2 : W * 0.34, cy = K.HDR + 18 + R;
    A.microField(ctx, cx, cy, R, { bright: p.liq === 'water' ? '#E9EFE6' : '#ECE8D8' });
    const pxUm = 2 * R / fieldUm, starts = [[-9, -6], [6, -10], [12, 4], [-4, 9], [-14, 5], [2, 1], [9, 13]];
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    Bt.field.forEach((tr, b) => {
      const ox = cx + starts[b][0] * pxUm, oy = cy + starts[b][1] * pxUm;
      if (p.trail) {
        ctx.strokeStyle = 'rgba(200,60,40,.65)'; ctx.lineWidth = 1.1; ctx.beginPath();
        for (let k = Math.max(0, f - 600); k <= f; k += 2) { const X = ox + tr[2 * k] * pxUm, Y = oy + tr[2 * k + 1] * pxUm; k === Math.max(0, f - 600) ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
        ctx.stroke();
      }
      const X = ox + tr[2 * f] * pxUm, Y = oy + tr[2 * f + 1] * pxUm, r = Math.max(2.2, p.bead / 2 * pxUm);
      const gr = ctx.createRadialGradient(X - r * 0.3, Y - r * 0.3, 0, X, Y, r * 1.6);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.5, 'rgba(120,128,120,.75)'); gr.addColorStop(0.75, 'rgba(40,46,40,.85)'); gr.addColorStop(1, 'rgba(40,46,40,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, r * 1.6, 0, TAU); ctx.fill();
    });
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#2A3040'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, TAU); ctx.stroke(); ctx.restore();
    scaleBar(ctx, cx - R * 0.25, cy + R - 16, 10 * pxUm, '10 µm');
    tag(ctx, cx, cy - R + 14, '100× oil · ' + LIQUIDS[p.liq].name + ' · ' + p.bT + ' °C · t = ' + (f * FRAME).toFixed(1) + ' s', '#E8EEF8', { align: 'center', W });
    // the card: what the microscope cannot show — the molecules doing the kicking
    const cw = Math.min(250, W * 0.3), at = K.cardSlot(g, S, 'what kicks it', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at && S.md) {
      const h = cw + 64; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' }); cardTitle(g, at, 'The cause, a thousand times closer');
      const box = { x: at.x + 14, y: at.y + 30, w: at.w - 28, h: at.w - 28 };
      A.cellPlate(ctx, box, 0, { stageLabel: ' ', lid: true });
      const D = mdPts(S.md, box, ['#E0B860', '#5FA8E8']);
      ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); A.particles(ctx, D.pts);
      if (S.bigTr) { ctx.strokeStyle = '#FFD36B'; ctx.lineWidth = 1.5; ctx.beginPath(); S.bigTr.forEach((q, i) => { const X = box.x + q[0] * D.k, Y = box.y + box.h - q[1] * D.k; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.fillStyle = g.theme['text-2']; ctx.font = mono(9, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      K.wrapText(ctx, 'molecules (blue) hit the big particle unevenly — more from one side than the other, every instant', at.x + 12, box.y + box.h + 32, at.w - 24, 12, 2);
      ctx.restore();
    }
    const D = Dof(p.bead, p.bT, p.liq);
    K.header(g, 'A ' + p.bead.toFixed(2) + ' µm bead in ' + LIQUIDS[p.liq].name + ' wanders: D = ' + (D * 1e12).toFixed(3) + ' µm²/s, about ' + Math.sqrt(4 * D * 10).toExponential(1).replace('e-6', ' µm').replace(/e-(\d+)/, ' × 10⁻$1 m') + ' in 10 s',
      'kT ÷ 6πηr: T = ' + (p.bT + 273.15).toFixed(1) + ' K · η = ' + (etaOf(p.liq, p.bT) * 1000).toFixed(2) + ' mPa·s · r = ' + (p.bead / 2).toFixed(2) + ' µm · nothing alive pushes it',
      'Brown (1827) saw pollen grains do this; Einstein (1905) explained it; Perrin (1908) counted molecules with it');
  }

  /* ============================================================
     THE STAGE — phases and temperature: the particle cell
     ============================================================ */
  function drawPhases(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, H = g.h, sb = SUBST[p.subst], narrow = W < K.NARROW;
    darkPlate(g);
    const M = S.md, Tk = tempOf(M) * E2(sb), c = S._cLast != null ? S._cLast : coordination(M), D = S._dLast != null ? S._dLast : 0, ph = phaseOf(c, D);
    const availH = Math.max(80, H - K.HDR - 70), availW = Math.max(80, narrow ? W - 70 : W * 0.62), side = Math.min(availW, availH / M.H * M.W), k = side / M.W;
    const box = { x: narrow ? 20 : 40, y: K.HDR + 18, w: M.W * k, h: M.H * k };
    const heat = p.mode === 'heat' ? 0.8 : p.mode === 'cool' ? -0.8 : clamp((p.TK / E2(sb) - 0.6) * 1.2, -1, 1) * 0.6;
    A.cellPlate(ctx, box, heat, { stageLabel: p.mode === 'hold' ? 'HELD AT ' + p.TK.toFixed(0) + ' K' : p.mode === 'heat' ? 'HEATER ON' : 'COOLER ON' });
    const Dp = mdPts(M, box, [sb.colour]);
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); A.particles(ctx, Dp.pts);
    // three tagged atoms and the paths they have taken: a scribble in place, or a wander
    const TC = ['#FFD36B', '#FF7AA8', '#7CF0B0'];
    (S.tags || []).forEach((tg, j) => {
      ctx.strokeStyle = TC[j]; ctx.lineWidth = 1.6; ctx.beginPath();
      tg.pts.forEach((q, i) => { const X = box.x + q[0] * k, Y = box.y + box.h - q[1] * k; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      const X = box.x + M.x[tg.i] * k, Y = box.y + box.h - M.y[tg.i] * k; ctx.beginPath(); ctx.arc(X, Y, k * 0.5, 0, TAU); ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.restore();
    scaleBar(ctx, box.x + 12, box.y + box.h - 12, k * 1e-9 / sb.sigma * 2, '2 nm');
    // the card: how the phase is measured
    const cw = Math.min(250, W * 0.3), at = K.cardSlot(g, S, 'how the phase is measured', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) {
      const h = 168; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' }); cardTitle(g, at, 'How the lab decides the phase');
      const bar = (y, label, v, max, marks, col) => {
        const x0 = at.x + 12, w = at.w - 24;
        ctx.save(); ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(label, x0, y);
        ctx.fillStyle = '#1C2434'; ctx.fillRect(x0, y + 16, w, 10); ctx.fillStyle = col; ctx.fillRect(x0, y + 16, w * clamp(v / max, 0, 1), 10);
        ctx.font = mono(8.5, 500); marks.forEach(([m, s]) => { const X = x0 + w * m / max; ctx.strokeStyle = '#E8EEF8'; ctx.beginPath(); ctx.moveTo(X, y + 13); ctx.lineTo(X, y + 29); ctx.stroke(); ctx.fillStyle = g.theme['text-2']; ctx.fillText(s, Math.min(X + 2, x0 + w - 40), y + 31); });
        ctx.restore();
      };
      bar(at.y + 30, 'neighbours each: ' + c.toFixed(2), c, 6.5, [[2.4, 'gas|'], [3.6, 'liquid']], '#9FE0F8');
      bar(at.y + 80, 'strays: ' + Math.sqrt(D).toFixed(2) + ' σ in ' + (1.6 * tauOf(sb) * 1e12).toFixed(1) + ' ps', Math.sqrt(D), 1.4, [[Math.sqrt(0.08), 'solid below']], '#FFB27A');
      ctx.save(); ctx.fillStyle = g.theme['text-2']; ctx.font = mono(9, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      K.wrapText(ctx, 'the coloured trails are three atoms followed for the last ' + (160 * 0.04 * tauOf(sb) * 1e12).toFixed(0) + ' ps', at.x + 12, at.y + 130, at.w - 24, 12, 2); ctx.restore();
    }
    // the thermometer column beside the cell, with this substance's melting and boiling points
    const gx = box.x + box.w + 24, gy0 = box.y + 6, gy1 = box.y + box.h - 6, Tmax = Math.max(200, sb.boil * 2.2);
    const yT = T => gy1 - (gy1 - gy0) * clamp(T / Tmax, 0, 1);
    ctx.save();
    ctx.fillStyle = '#1C2434'; ctx.fillRect(gx - 4, gy0, 8, gy1 - gy0);
    const gg = ctx.createLinearGradient(0, gy1, 0, yT(Tk)); gg.addColorStop(0, '#5FA8E8'); gg.addColorStop(1, '#FF7A45');
    ctx.fillStyle = gg; ctx.fillRect(gx - 3, yT(Tk), 6, gy1 - yT(Tk));
    ctx.beginPath(); ctx.arc(gx, gy1 + 6, 8, 0, TAU); ctx.fillStyle = '#5FA8E8'; ctx.fill();
    ctx.font = mono(9, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    [[sb.melt, 'melts ' + sb.melt + ' K', '#9FE0A8'], [sb.boil, 'boils ' + sb.boil + ' K', '#FFD27A']].forEach(([T, s, col], i) => { const y = yT(T) + (i ? -7 : 7); ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(gx - 8, yT(T)); ctx.lineTo(gx + 10, yT(T)); ctx.stroke(); ctx.fillStyle = col; if (!narrow) ctx.fillText(s, gx + 13, y); });
    ctx.fillStyle = '#E8EEF8'; ctx.textAlign = 'right'; ctx.fillText(Tk.toFixed(0) + ' K', gx - 9, Math.max(gy0 + 8, Math.min(gy1 - 8, yT(Tk))));
    ctx.restore();
    tag(ctx, box.x + box.w / 2, box.y + 14, 'measured: ' + ph.toUpperCase() + ' · ' + c.toFixed(1) + ' neighbours each', ph === 'solid' ? '#9FE0F8' : ph === 'gas' ? '#FFD27A' : '#B8F0C0', { align: 'center', W });
    K.header(g, sb.name[0].toUpperCase() + sb.name.slice(1) + ' at ' + Tk.toFixed(0) + ' K: ' + (ph === 'solid' ? 'the particles vibrate in place — still moving' : ph === 'liquid' ? 'they slide past each other but stay close' : ph === 'gas' ? 'they fly apart and fill the box' : 'a liquid pool under its own vapour'),
      'rms speed ' + Math.sqrt(2 * KB * Tk / (sb.m * U)).toFixed(0) + ' m/s · ' + c.toFixed(2) + ' neighbours · wandering D = ' + (D / (4 * 1.6) * sb.sigma * sb.sigma / tauOf(sb) * 1e9).toFixed(3) + ' × 10⁻⁹ m²/s',
      'real molecular dynamics: Lennard-Jones ' + sb.name + ', σ = ' + (sb.sigma * 1e9).toFixed(3) + ' nm, 2D, gravity on — no rule says which phase to be');
  }
  function drawTemperature(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW, GA = GASES[p.gasA], GB = GASES[p.gasB];
    darkPlate(g);
    const M = S.md, availH = Math.max(80, H - K.HDR - 70), side = Math.max(80, Math.min(narrow ? W - 40 : W * 0.56, availH)), k = side / M.W;
    const box = { x: narrow ? 20 : 40, y: K.HDR + 18, w: side, h: side };
    A.cellPlate(ctx, box, p.start === 'same' ? 0.2 : 0, { stageLabel: p.start === 'same' ? 'HEAT BATH ' + p.TG + ' K' : 'INSULATED' });
    const Dp = mdPts(M, box, [GA.colour, GB.colour]);
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
    Dp.pts.forEach(q => { const vx = M.vx[q.i], vy = M.vy[q.i], s = 2.2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - vx * s * k * 0.12, q.y + vy * s * k * 0.12); ctx.stroke(); });
    A.particles(ctx, Dp.pts); ctx.restore();
    scaleBar(ctx, box.x + 12, box.y + box.h - 12, k * 2e-9 / 0.3405e-9, '2 nm');
    const TA = tempOf(M, 0) * 119.8, TB = tempOf(M, 1) * 119.8, two = p.gasA !== p.gasB && p.fracB > 0;
    const cw = Math.min(250, W * 0.32), at = K.cardSlot(g, S, 'each kind', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) {
      const h = two ? 132 : 76; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' }); cardTitle(g, at, 'Average kinetic energy, as a temperature');
      const row = (y, G, T, kind) => { ctx.save(); ctx.fillStyle = G.colour; ctx.beginPath(); ctx.arc(at.x + 18, y + 6, 5, 0, TAU); ctx.fill(); ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(G.name + ' (' + G.m.toFixed(0) + ' u): ' + T.toFixed(0) + ' K', at.x + 30, y); ctx.fillStyle = g.theme['text-2']; ctx.font = mono(9, 500); ctx.fillText('rms speed ' + (Math.sqrt(2 * kinetic(M, kind) / Math.max(1, count(M, kind)) / (G.m / 39.95)) * V_AR).toFixed(0) + ' m/s in the box', at.x + 30, y + 14); ctx.restore(); };
      row(at.y + 30, GA, TA, 0); if (two) row(at.y + 72, GB, TB, 1);
    }
    K.header(g, two ? (Math.abs(TA - TB) < 0.12 * (TA + TB) / 2 ? 'Same temperature, same average kinetic energy — the ' + GA.name + ' atoms simply move faster' : 'Not yet the same: the ' + (TA > TB ? GA.name : GB.name) + ' is hotter — collisions are sharing its energy out') : 'One gas at ' + TA.toFixed(0) + ' K: every atom a different speed, the average fixed by the temperature',
      (two ? GA.name + ' ' + TA.toFixed(0) + ' K · ' + GB.name + ' ' + TB.toFixed(0) + ' K' : GA.name + ' ' + TA.toFixed(0) + ' K') + ' · temperature = average kinetic energy per atom ÷ k',
      'the bath is at ' + p.TG + ' K · tails show each atom’s velocity · in the box (2D) KE = kT per atom; in 3D it is 3/2 kT');
  }

  /* ============================================================
     THE STAGE — total: the ice calorimeter
     ============================================================ */
  function drawTotal(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS;
    const I = iceOf(S), f = 1 - Math.exp(-S.ts / Math.max(1e-3, I.tau)), melted = I.melt * f, O = I.O;
    const F = scene(S, g, -0.35, 0.45, -0.25, 0.25, 0.8);
    const jr = 0.075, jh = 0.14, jc = [-0.08, 0.03, 0.10];
    // the stand legs under the jar
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => R3.cylinder(F, [jc[0] + a * 0.06, jc[1] + b * 0.06, 0], [jc[0] + a * 0.06, jc[1] + b * 0.06, jc[2]], 0.004, '#8E98A6', { segments: 6, shadow: false }));
    const J = A.iceJar(F, jc, jr, jh, clamp(1 - melted / Math.max(1e-9, p.ice) * 0.9, 0.08, 1) * clamp(Math.cbrt(p.ice / 5), 0.25, 1), {});
    // meltwater into a 100 mL or 2 L measuring cylinder
    const G = I.melt > 0.24 ? { cap: 2000, div: 20, big: 200, mid: 100, d: 0.085 } : I.melt > 0.09 ? { cap: 250, div: 2, big: 50, mid: 10, d: 0.039 } : { cap: 100, div: 1, big: 10, mid: 5, d: 0.029 };
    const mlNow = melted * 1000;
    M.gradCylinder(F, [0.17, 0.0, 0.0], G, Math.min(mlNow, G.cap), { tint: '#CFE8F6' });
    R3.tube(F, [[jc[0], jc[1], jc[2] - 0.004], [jc[0], jc[1], jc[2] - 0.03], [0.09, 0.01, jc[2] - 0.02], [0.17, 0.0, Math.max(0.13, G.cap * 1e-6 / (Math.PI * G.d * G.d / 4) + 0.03)]], 0.004, '#C9D4DE', { segments: 6, round: false });
    if (mlNow > G.cap) R3.label(F, [0.17, -0.05, 0.06], 'overflowing: ' + mlNow.toFixed(0) + ' mL', '#FF9A8E', { size: 9 });
    // the object, on the ice
    const oc = [jc[0], jc[1], J.top + 0.012], glow = clamp((p.objT - 500) / 900, 0, 1) * (1 - f);
    if (p.obj === 'spark') R3.sphere(F, oc, 0.004, glow > 0.05 ? '#FFE08A' : '#5A4A3A', { shadow: false, vivid: true });
    else if (p.obj === 'nail') R3.cylinder(F, [oc[0] - 0.035, oc[1], oc[2]], [oc[0] + 0.035, oc[1], oc[2]], 0.003, glow > 0.05 ? window.RX.mix('#FF5A20', '#FFD27A', glow) : '#7A7F88', { segments: 10, shadow: false, vivid: glow > 0.05 });
    else if (p.obj === 'tea') M.beaker(F, [oc[0], oc[1], J.top - 0.02], 0.04, 0.09, 0.07 * (1 - f * 0.0), { T: p.objT * (1 - f), tint: '#C88A4A' });
    else { R3.cylinder(F, [oc[0] - 0.22, oc[1] + 0.05, 0], [oc[0] - 0.22, oc[1] + 0.05, 0.20], 0.10, '#C9D0D8', { segments: 30, caps: false, ambient: 0.45 }); R3.label(F, [oc[0] - 0.22, oc[1] - 0.06, 0.24], 'poured over the ice', '#E8EEF8', { size: 9 }); }
    if (glow > 0.02) F.push(oc, () => { const q = S.cam.project(oc); if (!q.ok) return; const r = 30 * (0.3 + glow), gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); gr.addColorStop(0, 'rgba(255,190,90,' + (0.8 * glow).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,140,40,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); ctx.restore(); }, -0.03);
    co(F, oc, -70, -40, O.name + ' · ' + p.objT.toFixed(0) + ' °C · ' + (I.m < 1e-3 ? (I.m * 1e6).toFixed(I.m < 1e-5 ? 3 : 1) + ' mg' : I.m < 1 ? (I.m * 1000).toFixed(0) + ' g' : I.m.toFixed(1) + ' kg'), '#FFD27A', { keep: true });
    F.render();
    // the card: two particle boxes at the same temperature
    const cw = Math.min(270, W * 0.31), at = K.cardSlot(g, S, 'same temperature, more particles', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at && S.md && S.md2) {
      const bw = (at.w - 40) / 2, h = bw + 90; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' }); cardTitle(g, at, 'Same temperature, not the same energy');
      [[S.md2, at.x + 14], [S.md, at.x + 26 + bw]].forEach(([Mm, x], i) => {
        const box = { x, y: at.y + 30, w: bw, h: bw };
        A.cellPlate(ctx, box, 0.4, { stageLabel: ' ' });
        const D = mdPts(Mm, box, ['#FF9A5A']);
        ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); A.particles(ctx, D.pts); ctx.restore();
        ctx.save(); ctx.fillStyle = g.theme.text; ctx.font = mono(9, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(Mm.N + ' particles', x + bw / 2, at.y + 34 + bw + 30); ctx.fillStyle = g.theme['text-2'];
        ctx.fillText('T ' + (tempOf(Mm) * 119.8).toFixed(0) + ' K · Σ KE ×' + (kinetic(Mm) / kinetic(S.md2)).toFixed(1), x + bw / 2, at.y + 34 + bw + 43); ctx.restore();
        void i;
      });
    }
    K.header(g, O.name[0].toUpperCase() + O.name.slice(1) + ' at ' + p.objT.toFixed(0) + ' °C melts ' + (I.melt >= 1 ? I.melt.toFixed(2) + ' kg' : (I.melt * 1000).toFixed(I.melt < 1e-3 ? 4 : 1) + ' g') + ' of ice',
      'it gives up Q = mcΔT = ' + fJ(I.Q) + ' cooling to 0 °C · melted so far ' + (mlNow < 1 ? mlNow.toFixed(4) : mlNow.toFixed(1)) + ' mL · ice ' + p.ice.toFixed(1) + ' kg',
      'temperature says how hard each particle jiggles; the thermal energy also counts how many particles there are');
  }

  /* ============================================================
     THE STAGE — thermometer
     ============================================================ */
  function drawThermo(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS, BENCH = window.BENCH;
    const R = thermOf(S), row = thRow(R, Math.min(60, S.ts)), Th = THERMS[p.th];
    const F = scene(S, g, -0.30, 0.40, -0.25, 0.25, 0.7);
    // the sample: a vial, a beaker or a big beaker, by volume
    const r = p.sV <= 3 ? 0.007 : p.sV <= 30 ? 0.016 : p.sV <= 300 ? 0.036 : 0.06, Hh = p.sV <= 3 ? 0.05 : p.sV <= 30 ? 0.07 : p.sV <= 300 ? 0.10 : 0.16;
    const lv = (p.sV * 1e-6) / (Math.PI * (r - 0.0015) * (r - 0.0015));
    const base = [0.0, 0.02, 0.0];
    M.beaker(F, base, r, Hh, Math.min(lv, Hh * 0.9), { steel: p.surf === 'steel', T: row.Ts, tint: '#CFE8F6' });
    if (p.sV <= 3) R3.box(F, [0, 0.02, 0.006], [0.04, 0.03, 0.012], '#2F3744', { shadow: false });
    const tip = [base[0] + r * 0.3, base[1], base[2] + Math.min(lv, Hh * 0.9) * 0.4 + 0.004];
    let reading = row.Tr;
    if (p.th === 'glass') A.glassThermometer(F, tip, [0.15, -0.05, 1], row.Tr, { len: 0.24 });
    else if (p.th === 'probe' || p.th === 'tc') {
      const e = A.probe(F, tip, [0.25, -0.05, 1], 0.12, p.th === 'tc' ? 0.0007 : 0.002);
      R3.tube(F, [e, [e[0] + 0.05, e[1] - 0.05, e[2] + 0.02], [0.16, -0.12, 0.05], [0.18, -0.13, 0.01]], 0.0018, '#2A2F38', { segments: 5, round: false });
    } else A.irGun(F, [0.20, -0.14, 0.18], [base[0], base[1], base[2] + Math.min(lv, Hh * 0.9)], {});
    if (p.th !== 'glass') BENCH.meter(F, [0.20, -0.16, 0.05], [0, -1, 0.35], 0.10, 0.05, { title: Th.name.toUpperCase().slice(0, 14), value: toUnit(reading, p.unit).toFixed(1), unit: uName(p.unit), colour: '#FFB27A', depth: 0.03 });
    F.render();
    const q = S.cam.project([base[0] - r, base[1], base[2] + Hh * 0.5]);
    if (q.ok) tag(ctx, q.x - 10, q.y, 'sample really ' + toUnit(row.Ts, p.unit).toFixed(1) + ' ' + uName(p.unit), '#9FE0F8', { align: 'right', W });
    const err = row.Tr - row.Ts;
    K.header(g, Th.name[0].toUpperCase() + Th.name.slice(1) + ' in ' + (p.sV < 10 ? p.sV.toFixed(1) : p.sV.toFixed(0)) + ' mL: reads ' + toUnit(row.Tr, p.unit).toFixed(1) + ' ' + uName(p.unit) + ', ' + (Math.abs(err) < 0.3 ? 'right' : (err < 0 ? 'low' : 'high') + ' by ' + Math.abs(err).toFixed(1) + ' K'),
      'started at ' + p.sT + ' °C · t = ' + Math.min(60, S.ts).toFixed(1) + ' s · probe heat capacity ' + Th.C + ' J/K against the sample’s ' + R.Cs.toFixed(1) + ' J/K · settles at ' + R.eq.toFixed(1) + ' °C',
      p.th === 'ir' ? 'an infrared gun reads radiance: set for ε = ' + p.epsSet + ', looking at ' + SURFACES[p.surf].name + ' (ε = ' + SURFACES[p.surf].eps + ')' : 'a thermometer only ever reports its own temperature — it has to become the sample’s');
  }

  function drawStage(S, g) {
    const p = S.p;
    const nar = g.w < kit().NARROW; NAR = nar;                          // a phone: step back so the labels fit
    if (S.cam && S._nar !== nar) { if (S._nar != null || nar) S.cam.dist *= nar ? 1.4 : 1 / 1.4; S._nar = nar; }
    if (p.setup === 'particles') return drawParticles(S, g);
    if (p.setup === 'brownian') return drawBrownian(S, g);
    if (p.setup === 'phases') return drawPhases(S, g);
    if (p.setup === 'temperature') return drawTemperature(S, g);
    if (p.setup === 'total') return drawTotal(S, g);
    return drawThermo(S, g);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'particles') {
      const Kk = K.plotKey(g, [{ c: FILLS[p.fill].colour, label: FILLS[p.fill].name }, { c: '#9AB0C8', label: 'before the load', dash: [4, 3] }]);
      const pts = []; for (let t = 0; t <= 90; t += 1) pts.push([t, syringeV(p.fill, p.V0, p.load, p.Tc, t)]);
      const lo = Math.min(...pts.map(q => q[1])), span = Math.max(1e-4, p.V0 - lo);
      const P = g.Plot({ xmin: 0, xmax: 90, ymin: lo - span * 0.15, ymax: p.V0 + span * 0.15, pad: { t: Kk.t, l: 62 }, xlabel: 't since the load went on (s)', ylabel: 'mL', xfmt: v => v.toFixed(0), yfmt: v => span < 0.01 ? v.toFixed(4) : span < 1 ? v.toFixed(2) : v.toFixed(1) }).frame();
      P.clip(() => { P.hline(p.V0, '#9AB0C8', [4, 3]); P.line(pts, FILLS[p.fill].colour, 2); P.vline(Math.min(90, S.ts), g.alpha(T['text-2'], 0.6), [2, 3]); });
      if (!FILLS[p.fill].K) P.tag(4, pts[1][1], 'squeezed fast: it warms, then cools and shrinks more', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'brownian') {
      const Bt = beadsOf(S), D = Dof(p.bead, p.bT, p.liq) * 1e12, lags = [];
      for (let l = 3; l <= 300; l += 9) lags.push([l * FRAME, msdOf(Bt.many, l)]);
      const ymax = Math.max(4 * D * 10, ...lags.map(q => q[1])) * 1.1;
      const Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'measured ⟨r²⟩, 300 beads', dot: true }, { c: '#9DB6FF', label: '4Dt (Einstein)', dash: [5, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'time t (s)', ylabel: 'mean-square displacement (µm²)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(ymax < 5 ? 2 : 0) }).frame();
      P.clip(() => { P.line([[0, 0], [10, 40 * D]], '#9DB6FF', 1.6, [5, 3]); lags.forEach(q => P.dot(q[0], q[1], 3, '#FF8A5A')); });
      P.tag(6, 4 * D * 6 + ymax * 0.06, 'a straight line: ⟨r²⟩ ∝ t, not ∝ t²', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'phases') {
      const sb = SUBST[p.subst], rows = S.heatRows, heating = p.mode !== 'hold';
      const Kk = K.plotKey(g, [{ c: '#FF7A45', label: 'temperature (K)' }, { c: '#9FE0A8', label: 'melts', dash: [4, 3] }, { c: '#FFD27A', label: 'boils', dash: [4, 3] }]);
      const xs = rows.map(r => heating ? Math.abs(r.q) * E2(sb) * KB * NA / 1000 : r.t * tauOf(sb) * 1e12);
      const xmax = Math.max(heating ? 0.5 : 5, ...xs, 0) * 1.05, ymax = Math.max(sb.boil * 1.8, ...rows.map(r => r.T * E2(sb))) * 1.05;
      const P = g.Plot({ xmin: 0, xmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: heating ? (p.mode === 'heat' ? 'heat put in (kJ per mole)' : 'heat taken out (kJ per mole)') : 'time (ps)', ylabel: 'K', xfmt: v => v.toFixed(heating ? 2 : 0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(sb.melt, '#9FE0A8', [4, 3]); P.hline(sb.boil, '#FFD27A', [4, 3]); P.line(rows.map((r, i) => [xs[i], r.T * E2(sb)]), '#FF7A45', 2); });
      if (heating) P.tag(xmax * 0.05, ymax * 0.92, 'where the line goes flat, the heat is pulling particles apart, not speeding them up', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'temperature') {
      const vmax = histMax(p), H = S.hist, GA = GASES[p.gasA], GB = GASES[p.gasB], two = p.gasA !== p.gasB && p.fracB > 0;
      const Kk = K.plotKey(g, [{ c: GA.colour, label: GA.name, box: true }].concat(two ? [{ c: GB.colour, label: GB.name, box: true }] : []).concat([{ c: '#E8EEF8', label: 'Maxwell–Boltzmann at the bath T', dash: [4, 3] }]));
      const vr = vmax * V_AR, bins = 40, bw = vr / bins;
      const nA = count(S.md, 0), nB = count(S.md, 1), fr = (h, n) => { const tot = H ? h.reduce((u, v) => u + v, 0) : 0; return tot ? Array.from(h).map(v => v / tot / bw) : null; };
      const a = H && fr(H.A, nA), b = H && fr(H.B, nB);
      const mb = (mU, Tk) => { const out = []; for (let i = 0; i <= 80; i++) { const v = i / 80 * vr, m = mU * U; out.push([v, m * v / (KB * Tk) * Math.exp(-m * v * v / (2 * KB * Tk))]); } return out; };
      const cA = mb(GA.m, p.TG), cB = two ? mb(GB.m, p.TG) : [];
      const ymax = Math.max(...cA.map(q => q[1]), ...cB.map(q => q[1]), ...(a || [0]), ...(b || [0])) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: vr, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'speed (m/s) in the box', ylabel: 'share per m/s', xfmt: v => v.toFixed(0), yfmt: v => (v * 1000).toFixed(2) }).frame();
      P.clip(() => {
        if (a) P.area(a.map((v, i) => [(i + 0.5) * bw, v]), 0, g.alpha(GA.colour, 0.45));
        if (b && two) P.area(b.map((v, i) => [(i + 0.5) * bw, v]), 0, g.alpha(GB.colour, 0.45));
        P.line(cA, '#E8EEF8', 1.5, [4, 3]); if (two) P.line(cB, '#E8EEF8', 1.5, [4, 3]);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'total') {
      const I = iceOf(S), Kk = K.plotKey(g, [{ c: '#9DD8FF', label: 'ice melted (g)' }]);
      const tEnd = I.tau * 6, ymax = Math.max(1e-6, I.melt * 1000) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: tEnd, ymin: 0, ymax, pad: { t: Kk.t, l: 62 }, xlabel: 't (s)', ylabel: 'g', xfmt: v => tEnd < 2 ? v.toFixed(2) : v.toFixed(0), yfmt: v => ymax < 0.01 ? v.toExponential(0) : ymax < 10 ? v.toFixed(2) : v.toFixed(0) }).frame();
      const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60 * tEnd; pts.push([t, I.melt * 1000 * (1 - Math.exp(-t / I.tau))]); }
      P.clip(() => { P.line(pts, '#9DD8FF', 2); P.vline(Math.min(S.ts, tEnd), g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    const R = thermOf(S), Kk = K.plotKey(g, [{ c: '#9FE0F8', label: 'the sample, really' }, { c: '#FFB27A', label: 'what the thermometer reads' }]);
    const lo = Math.min(...R.rows.map(r => Math.min(r.Tr, r.Ts))), hi = Math.max(...R.rows.map(r => Math.max(r.Tr, r.Ts)));
    const P = g.Plot({ xmin: 0, xmax: 60, ymin: toUnit(lo - 2, p.unit), ymax: toUnit(hi + 2, p.unit), pad: { t: Kk.t }, xlabel: 't (s)', ylabel: uName(p.unit), xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line(R.rows.map(r => [r.t, toUnit(r.Ts, p.unit)]), '#9FE0F8', 2); P.line(R.rows.map(r => [r.t, toUnit(r.Tr, p.unit)]), '#FFB27A', 2); P.vline(Math.min(60, S.ts), g.alpha(T['text-2'], 0.6), [2, 3]); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'particles') {
      const ks = Object.keys(FILLS), Kk = K.plotKey(g, ks.map(k => ({ c: FILLS[k].colour, label: FILLS[k].name.replace('water with a 2 mL air bubble', 'water + bubble') })).concat([{ c: '#FFD36B', label: 'yours', dot: true }]));
      const P = g.Plot({ xmin: 100, xmax: 260, ymin: 0.3, ymax: 1.05, pad: { t: Kk.t }, xlabel: 'pressure (kPa)', ylabel: 'V ÷ V before', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { ks.forEach(k => { const pts = []; for (let L = 0; L <= 10.001; L += 0.25) pts.push([pressureOf(L), syringeV(k, p.V0, L, 20, 1e9) / p.V0]); P.line(pts, FILLS[k].colour, 2); }); P.dot(pressureOf(p.load), syringeOf(p, 1e9).V / p.V0, 5, '#FFD36B', '#05080F'); });
      P.tag(210, 0.6, 'gases: PV stays the same', T['text-3']); P.tag(210, 1.01, 'liquids: hardly at all', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'brownian') {
      const ks = Object.keys(LIQUIDS), cols = ['#5FA8E8', '#D8B040', '#C9A2FF'];
      const Kk = K.plotKey(g, ks.map((k, i) => ({ c: cols[i], label: LIQUIDS[k].name })).concat([{ c: '#FFD36B', label: 'your bead', dot: true }]));
      const P = g.Plot({ xmin: -1, xmax: 1, ymin: -4, ymax: 1, pad: { t: Kk.t }, xlabel: 'bead diameter (log₁₀ µm)', ylabel: 'D (log₁₀ µm²/s)', xfmt: v => Math.pow(10, v).toFixed(v < 0 ? 1 : 0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { ks.forEach((k, i) => { const pts = []; for (let x = -1; x <= 1.001; x += 0.05) pts.push([x, Math.log10(Dof(Math.pow(10, x), p.bT, k) * 1e12)]); P.line(pts, cols[i], 2); }); P.dot(Math.log10(p.bead), Math.log10(Dof(p.bead, p.bT, p.liq) * 1e12), 5, '#FFD36B', '#05080F'); });
      P.tag(-0.9, -3.6, 'twice as big: half as fast to wander', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'phases') {
      const ks = Object.keys(SUBST), sb = SUBST[p.subst], Tk = tempOf(S.md) * E2(sb);
      const P = g.Plot({ xmin: 0, xmax: 260, ymin: -0.5, ymax: ks.length - 0.5, pad: { l: 70, t: 10 }, xlabel: 'temperature (K)', ylabel: '', xfmt: v => v.toFixed(0), yfmt: () => '' }).frame();
      P.clip(() => ks.forEach((k, i) => { const s = SUBST[k]; P.line([[0, i], [s.melt, i]], g.alpha('#9FE0F8', 0.8), 8); P.line([[s.melt, i], [s.boil, i]], g.alpha('#9FE0A8', 0.9), 8); P.line([[s.boil, i], [260, i]], g.alpha('#FFD27A', 0.5), 8); }));
      ks.forEach((k, i) => P.tag(2, i + 0.32, SUBST[k].name + ': solid · liquid · gas', T['text-2'], 'left', 0));
      P.clip(() => { P.vline(Tk, '#FF7A45', [4, 3]); P.dot(Tk, ks.indexOf(p.subst), 5, '#FF7A45', '#05080F'); });
      return;
    }
    if (p.setup === 'temperature') {
      const tr = S.mdTrack, GA = GASES[p.gasA], GB = GASES[p.gasB], two = p.gasA !== p.gasB && p.fracB > 0;
      const Kk = K.plotKey(g, [{ c: GA.colour, label: GA.name + ' (K)' }].concat(two ? [{ c: GB.colour, label: GB.name + ' (K)' }] : []).concat([{ c: '#E8EEF8', label: 'bath', dash: [4, 3] }]));
      const t0 = tr.length ? tr[0].t : 0, t1 = tr.length ? Math.max(t0 + 1, tr[tr.length - 1].t) : 1, ymax = Math.max(p.TG * 2.4, ...tr.map(r => Math.max(r.A, r.B) * 119.8)) * 1.05;
      const ps = tauOf(SUBST.ar) * 1e12;
      const P = g.Plot({ xmin: t0 * ps, xmax: t1 * ps, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'time (ps)', ylabel: 'K', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(p.TG, '#E8EEF8', [4, 3]); P.line(tr.map(r => [r.t * ps, r.A * 119.8]), GA.colour, 2); if (two) P.line(tr.map(r => [r.t * ps, r.B * 119.8]), GB.colour, 2); });
      Kk.draw(P); return;
    }
    if (p.setup === 'total') {
      const ks = Object.keys(OBJECTS), Kk = K.plotKey(g, [{ c: '#FFB27A', label: 'each object, as set by default', dot: true }, { c: '#FFD36B', label: 'yours', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 1700, ymin: -4, ymax: 7, pad: { t: Kk.t }, xlabel: 'temperature (°C)', ylabel: 'heat to the ice (log₁₀ J)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { ks.forEach(k => { const O = OBJECTS[k]; P.dot(O.T, Math.log10(O.m * O.c * O.T), 5, '#FFB27A'); }); const I = iceOf(S); P.dot(p.objT, Math.log10(Math.max(1e-4, I.Q)), 6, '#FFD36B', '#05080F'); });
      ks.forEach(k => { const O = OBJECTS[k]; P.tag(O.T + 30, Math.log10(O.m * O.c * O.T) + 0.35, O.name.replace('a ', ''), T['text-2'], O.T > 1300 ? 'right' : 'left'); });
      Kk.draw(P); return;
    }
    const ks = ['glass', 'probe', 'tc'], cols = ['#D8302A', '#C9D0D8', '#FFD36B'];
    const Kk = K.plotKey(g, ks.map((k, i) => ({ c: cols[i], label: THERMS[k].name })).concat([{ c: '#FF7A45', label: 'yours', dot: true }]));
    const err = (k, V) => { const C = THERMS[k].C, Cs = V * 4.186; return (Cs * p.sT + C * p.Tp0) / (Cs + C) - p.sT; };
    const P = g.Plot({ xmin: -1, xmax: 3, ymin: Math.min(-30, err('probe', 0.1) * 1.05), ymax: 2, pad: { t: Kk.t }, xlabel: 'sample volume (log₁₀ mL)', ylabel: 'error once settled (K)', xfmt: v => Math.pow(10, v) >= 1 ? Math.pow(10, v).toFixed(0) : Math.pow(10, v).toFixed(1), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { ks.forEach((k, i) => { const pts = []; for (let x = -1; x <= 3.001; x += 0.05) pts.push([x, err(k, Math.pow(10, x))]); P.line(pts, cols[i], 2); }); if (p.th !== 'ir') P.dot(Math.log10(p.sV), err(p.th, p.sV), 5, '#FF7A45', '#05080F'); P.hline(0, g.alpha(T['text-2'], 0.5), [3, 3]); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'particles') {
      const R = syringeOf(p, S.ts), Rf = syringeOf(p, 1e9);
      return [
        { label: 'Pressure P₀ + mg/A', value: R.P.toFixed(1), unit: 'kPa', flag: 'accent', hint: (p.load + SYR.plunger).toFixed(2) + ' kg on ' + (SYR_A * 1e4).toFixed(2) + ' cm²' },
        { label: 'Volume now', value: R.V.toFixed(R.F.K ? 4 : 2), unit: 'mL' },
        { label: 'Settles at', value: Rf.V.toFixed(R.F.K ? 4 : 2), unit: 'mL', hint: R.F.K ? 'ΔV = V·ΔP/K' : 'Boyle: PV constant' },
        { label: 'Squeezed out', value: R.F.K ? (Rf.dV * 1000).toFixed(2) : Rf.dV.toFixed(2), unit: R.F.K ? 'µL' : 'mL', hint: (100 * Rf.dV / p.V0).toFixed(R.F.K ? 4 : 1) + ' %' },
        { label: 'P × V', value: (R.P * R.V / 1000).toFixed(3), unit: 'J', hint: R.F.K ? 'not constant: a liquid' : 'stays the same once cool' },
        { label: 'Particles N', value: sci(R.N) },
        { label: 'Spacing (V/N)^⅓', value: fNm(R.dGap), hint: (R.dGap / R.F.d).toFixed(1) + ' × the particle' }
      ];
    }
    if (p.setup === 'brownian') {
      const D = Dof(p.bead, p.bT, p.liq), Bt = beadsOf(S), m10 = msdOf(Bt.many, 300);
      return [
        { label: 'D = kT/6πηr', value: (D * 1e12).toFixed(4), unit: 'µm²/s', flag: 'accent' },
        { label: 'Viscosity η', value: (etaOf(p.liq, p.bT) * 1000).toFixed(2), unit: 'mPa·s' },
        { label: '⟨r²⟩ at 10 s, measured', value: m10.toFixed(2), unit: 'µm²', hint: '4Dt = ' + (4 * D * 1e12 * 10).toFixed(2) },
        { label: 'rms step in 10 s', value: Math.sqrt(m10).toFixed(2), unit: 'µm' },
        { label: 'Perrin: N_A = 4RTt/6πηr⟨r²⟩', value: sci(perrin(p.bead, p.bT, p.liq, Bt.many, 300)), unit: '/mol', flag: 'ok', hint: 'true 6.022 × 10^23' },
        { label: 'Time watched', value: (S.frame * FRAME).toFixed(1), unit: 's' }
      ];
    }
    if (p.setup === 'phases') {
      const sb = SUBST[p.subst], M = S.md, Tk = tempOf(M) * E2(sb), c = S._cLast != null ? S._cLast : coordination(M), D = S._dLast != null ? S._dLast : 0;
      return [
        { label: 'Temperature from ½mv²', value: Tk.toFixed(1), unit: 'K', flag: 'accent', hint: p.mode === 'hold' ? 'bath at ' + p.TK + ' K' : 'heater ' + p.mode },
        { label: 'Phase, measured', value: phaseOf(c, D), flag: 'ok' },
        { label: 'Neighbours within 1.5σ', value: c.toFixed(2), hint: '6 crystal · 4–5 liquid · <2 gas' },
        { label: 'Strays in ' + (1.6 * tauOf(sb) * 1e12).toFixed(1) + ' ps', value: (Math.sqrt(D) * sb.sigma * 1e9).toFixed(3), unit: 'nm', hint: 'under ' + (Math.sqrt(0.08) * sb.sigma * 1e9).toFixed(3) + ' nm: vibrating in place' },
        { label: 'rms speed √(2kT/m)', value: Math.sqrt(2 * KB * tempOf(M) * E2(sb) / (sb.m * U)).toFixed(0), unit: 'm/s', hint: 'never zero: solids vibrate' },
        { label: 'Heat in so far', value: (S.qIn / M.N * E2(sb) * KB * NA / 1000).toFixed(3), unit: 'kJ/mol' },
        { label: 'Particles', value: String(M.N), hint: sb.name + ', σ = ' + (sb.sigma * 1e9).toFixed(3) + ' nm' }
      ];
    }
    if (p.setup === 'temperature') {
      const M = S.md, GA = GASES[p.gasA], GB = GASES[p.gasB], two = p.gasA !== p.gasB && p.fracB > 0;
      const out = [
        { label: 'Bath', value: p.start === 'same' ? String(p.TG) : 'off', unit: p.start === 'same' ? 'K' : '', flag: 'accent' },
        { label: GA.name + ': ⟨KE⟩/k', value: (tempOf(M, 0) * 119.8).toFixed(0), unit: 'K' },
        { label: GA.name + ' real gas √(3kT/m)', value: vrms3(GA.m, p.TG).toFixed(0), unit: 'm/s', hint: 'at the bath T, in 3D' }];
      if (two) out.push({ label: GB.name + ': ⟨KE⟩/k', value: (tempOf(M, 1) * 119.8).toFixed(0), unit: 'K' }, { label: GB.name + ' real gas √(3kT/m)', value: vrms3(GB.m, p.TG).toFixed(0), unit: 'm/s' }, { label: 'Speed ratio √(m_B/m_A)', value: Math.sqrt(GB.m / GA.m).toFixed(2), hint: 'kinetic energies equal' });
      out.push({ label: 'Mean KE per atom (3D) 3/2 kT', value: (1.5 * KB * p.TG * 1e21).toFixed(2), unit: 'zJ' });
      return out;
    }
    if (p.setup === 'total') {
      const I = iceOf(S);
      return [
        { label: 'Temperature', value: p.objT.toFixed(0), unit: '°C', flag: 'accent' },
        { label: 'Mass', value: I.m < 1e-3 ? (I.m * 1e6).toFixed(4) : I.m < 1 ? (I.m * 1000).toFixed(1) : I.m.toFixed(2), unit: I.m < 1e-3 ? 'mg' : I.m < 1 ? 'g' : 'kg' },
        { label: 'Heat to 0 °C, Q = mcΔT', value: fJ(I.Q), flag: 'ok', hint: 'c = ' + I.O.c + ' J/kg·K (' + I.O.mat + ')' },
        { label: 'Ice melted Q ÷ 334 J/g', value: I.melt * 1000 < 0.01 ? sci(I.melt * 1000) : (I.melt * 1000).toFixed(1), unit: 'g' },
        { label: 'Thermal energy above 0 K ≈ mcT', value: fJ(I.abs), hint: 'roughly: c changes in the cold' },
        { label: 'Ends at', value: I.Tend.toFixed(1), unit: '°C', hint: I.Tend > 0 ? 'all the ice melted' : 'ice left over' }
      ];
    }
    const R = thermOf(S), row = thRow(R, Math.min(60, S.ts)), u = uName(p.unit);
    return [
      { label: 'Reading', value: toUnit(row.Tr, p.unit).toFixed(1), unit: u, flag: 'accent' },
      { label: 'The sample, really', value: toUnit(row.Ts, p.unit).toFixed(1), unit: u },
      { label: 'Error now', value: (row.Tr - row.Ts).toFixed(2), unit: 'K', flag: Math.abs(row.Tr - row.Ts) > 1 ? 'warn' : 'ok' },
      { label: 'Settles at (C_sT_s + C_pT_p)/(C_s + C_p)', value: toUnit(R.eq, p.unit).toFixed(1), unit: u, hint: p.th === 'ir' ? 'no contact: no disturbance' : 'the probe cooled the sample' },
      { label: 'Within 0.5 K after', value: R.t05 == null ? 'never' : R.t05.toFixed(1), unit: R.t05 == null ? '' : 's' },
      { label: 'In °C · °F · K', value: row.Tr.toFixed(1) + ' · ' + toUnit(row.Tr, 'F').toFixed(1) + ' · ' + toUnit(row.Tr, 'K').toFixed(1) }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'particles') {
      const R = syringeOf(p, 1e9), P1 = pressureOf(0);
      if (!R.F.K) return E.v('P') + E.sub('1') + E.v('V') + E.sub('1') + ' ' + E.op('=') + ' ' + E.v('P') + E.sub('2') + E.v('V') + E.sub('2') + '  →  ' + E.n(P1.toFixed(1), 'kPa') + ' × ' + E.n(p.V0, 'mL') + ' ' + E.op('=') + ' ' + E.n(R.P.toFixed(1), 'kPa') + ' × ' + E.n(R.V.toFixed(2), 'mL');
      return 'Δ' + E.v('V') + ' ' + E.op('=') + ' ' + E.v('V') + ' · ' + E.frac('Δ' + E.v('P'), E.v('K')) + ' ' + E.op('=') + ' ' + E.n(p.V0, 'mL') + ' × ' + E.frac(E.n((R.P - P1).toFixed(1), 'kPa'), E.n((R.F.K / 1e6).toFixed(1), 'GPa')) + ' ' + E.op('=') + ' ' + E.n((p.V0 * (R.P - P1) / R.F.K * 1000).toFixed(3), 'µL') + (R.F.bubble ? ' — plus the bubble, which obeys Boyle' : '');
    }
    if (p.setup === 'brownian') return E.v('D') + ' ' + E.op('=') + ' ' + E.frac(E.v('kT'), '6π' + E.v('ηr')) + ' ' + E.op('=') + ' ' + E.frac('1.381×10⁻²³ × ' + (p.bT + 273.15).toFixed(1), '6π × ' + etaOf(p.liq, p.bT).toExponential(2) + ' × ' + (p.bead / 2 * 1e-6).toExponential(2)) + ' ' + E.op('=') + ' ' + E.n((Dof(p.bead, p.bT, p.liq) * 1e12).toFixed(4), 'µm²/s') + ';   ⟨' + E.v('r') + '²⟩ ' + E.op('=') + ' 4' + E.v('Dt');
    if (p.setup === 'phases') { const sb = SUBST[p.subst]; return E.v('T') + ' ' + E.op('=') + ' ' + E.frac('⟨½' + E.v('mv') + '²⟩', E.v('k')) + ' (2D) ' + E.op('=') + ' ' + E.n((tempOf(S.md) * E2(sb)).toFixed(1), 'K') + ';   ' + E.v('F') + '(' + E.v('r') + ') from ' + E.v('U') + ' ' + E.op('=') + ' 4ε[(σ/' + E.v('r') + ')¹² − (σ/' + E.v('r') + ')⁶], ε/' + E.v('k') + ' ' + E.op('=') + ' ' + E.n(E2(sb).toFixed(0), 'K') + ' (2D)'; }
    if (p.setup === 'temperature') { const GA = GASES[p.gasA], GB = GASES[p.gasB]; return '⟨½' + E.v('mv') + '²⟩ ' + E.op('=') + ' 3/2 ' + E.v('kT') + '  →  ' + E.v('v') + E.sub('rms') + ' ' + E.op('=') + ' √(3' + E.v('kT') + '/' + E.v('m') + '):  ' + GA.name + ' ' + E.n(vrms3(GA.m, p.TG).toFixed(0), 'm/s') + ', ' + GB.name + ' ' + E.n(vrms3(GB.m, p.TG).toFixed(0), 'm/s') + ' at ' + E.n(p.TG, 'K'); }
    if (p.setup === 'total') { const I = iceOf(S); return E.v('Q') + ' ' + E.op('=') + ' ' + E.v('mc') + 'Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.n(I.m.toExponential(2), 'kg') + ' × ' + E.n(I.O.c, 'J/kg·K') + ' × ' + E.n(p.objT, 'K') + ' ' + E.op('=') + ' ' + E.n(fJ(I.Q)) + '  →  ice ' + E.op('=') + ' ' + E.frac(E.v('Q'), E.n('334', 'J/g')) + ' ' + E.op('=') + ' ' + E.n((I.melt * 1000).toPrecision(3), 'g'); }
    const R = thermOf(S), Th = THERMS[p.th];
    return E.v('T') + E.sub('settled') + ' ' + E.op('=') + ' ' + E.frac(E.v('C') + E.sub('s') + E.v('T') + E.sub('s') + ' + ' + E.v('C') + E.sub('p') + E.v('T') + E.sub('p'), E.v('C') + E.sub('s') + ' + ' + E.v('C') + E.sub('p')) + ' ' + E.op('=') + ' ' + E.frac(R.Cs.toFixed(2) + ' × ' + p.sT + ' + ' + Th.C + ' × ' + p.Tp0, (R.Cs + Th.C).toFixed(2)) + ' ' + E.op('=') + ' ' + E.n(R.eq.toFixed(1), '°C') + ';   °F ' + E.op('=') + ' 9/5 °C + 32,  K ' + E.op('=') + ' °C + 273.15';
  }
  const EQ_NOTE = {
    particles: 'Boyle’s law is about the space between gas particles: halve it and the particles hit the walls twice as often. A liquid’s particles already touch; squeezing them closer fights their repulsion, so its bulk modulus K is about 20 000 times the pressure of the air. A gas squeezed fast warms up first (it is squeezed “adiabatically”) and shrinks a little more as it cools back to the room.',
    brownian: 'The bead is a thousand times bigger than a water molecule and never feels a single hit: it feels the imbalance of trillions each second. The distance it wanders grows as √t, not t — that is the fingerprint of random kicks — and ⟨r²⟩ = 4Dt gives D, from which Perrin counted the molecules in a mole.',
    phases: 'The temperature is computed from the particles’ speeds alone; the phase is measured from their neighbours and how far they stray. A flat (2D) box melts at about 0.40 ε/k, a lower share of the attraction than real 3D crystals, so the model’s ε is set to put its melting point at the substance’s real one (argon 83.8 K). Its liquid then lasts further above the real boiling point than a real liquid would — boiling is not calibrated. The scale bar is real: σ is a third of a nanometre.',
    temperature: 'Temperature fixes the average kinetic energy per particle, not the speed. At the same temperature a light helium atom moves √(131/4) ≈ 5.7 times faster than a xenon atom. The box is two-dimensional, where the average is kT; real gases have 3/2 kT.',
    total: 'Temperature is an average per particle; thermal energy is a total. The spark is hotter than anything else on the bench and carries less energy than a fingertip’s worth of warm water. The “above absolute zero” figure is rough: heat capacities fall in the deep cold.',
    thermometer: 'Every contact thermometer reports its own temperature, so it must exchange heat with the sample until they agree — and that heat comes out of the sample. A small sample, a big probe and a large difference make a big error. An infrared gun touches nothing but must be told the surface’s emissivity: shiny metal fools it.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  L.register({
    id: 'g6c-particle-box',
    grade: 6, unit: '6C', topics: ['C2'],
    subject: 'physics',
    chapter: 'Energy, Heat and Thermal Systems',
    name: 'The Particle Box — Matter, Motion and Temperature',
    exams: ['NGSS MS-PS1-4', 'NGSS MS-PS3-4', 'NGSS MS-PS3-5', 'CAST'],
    weight: 'Core model',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the bench (syringe, ice, thermometer) · the particle boxes are real molecular dynamics',
    lede: 'Everything here is made of particles, and the particles are computed: a <b>molecular-dynamics</b> box of Lennard-Jones atoms with real σ and ε becomes a vibrating <b>crystal</b>, a pooled <b>liquid</b> or a <b>gas</b> as you cool or heat it — no rule tells it which. ' +
      'Squeeze a sealed <b>syringe</b> of air and of water and measure the space between particles; watch a bead wander under the microscope and count molecules as <b>Perrin</b> did; mix light and heavy gases at one temperature; melt ice with a spark and with a bucket of bathwater; and catch a thermometer changing the very temperature it measures.',
    params: preset({}),
    presets: [
      { name: 'Argon held at 70 K: a crystal', params: preset({}) },
      { name: 'Argon at 85 K: a liquid pool', params: preset({ TK: 86 }) },
      { name: 'Argon at 300 K: a gas', params: preset({ TK: 300, N: 80 }) },
      { name: 'Heat argon from 40 K: the heating curve', params: preset({ mode: 'heat', TK: 40, power: 'gentle' }) },
      { name: 'Xenon at 86 K is still solid', params: preset({ subst: 'xe', TK: 86 }) },
      { name: 'A syringe of air under 8 kg', params: preset({ setup: 'particles', load: 8 }) },
      { name: 'A syringe of water under 8 kg', params: preset({ setup: 'particles', fill: 'water', load: 8 }) },
      { name: 'Water with a trapped bubble', params: preset({ setup: 'particles', fill: 'bubble', load: 8 }) },
      { name: 'A 1 µm bead in water', params: preset({ setup: 'brownian' }) },
      { name: 'The same bead in 80 % glycerol', params: preset({ setup: 'brownian', liq: 'g80' }) },
      { name: 'Helium and xenon at 300 K', params: preset({ setup: 'temperature' }) },
      { name: 'Hot xenon, cold helium: let them share', params: preset({ setup: 'temperature', start: 'hot-heavy' }) },
      { name: 'A spark on the ice', params: preset({ setup: 'total', obj: 'spark', objT: 1500, logm: Math.log10(4e-9) }) },
      { name: 'Bathwater on 20 kg of ice', params: preset({ setup: 'total', obj: 'bath', objT: 40, logm: 1, ice: 20 }) },
      { name: 'A glass thermometer in a 1 mL drop', params: preset({ setup: 'thermometer', sV: 1 }) },
      { name: 'An infrared gun on a shiny steel cup', params: preset({ setup: 'thermometer', th: 'ir', surf: 'steel', sV: 200 }) }
    ],
    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS }] },
      { group: 'The syringe', when: is('particles'), items: [
        { key: 'fill', type: 'select', label: 'Sealed inside', restructure: true, options: Object.keys(FILLS).map(k => ({ value: k, label: FILLS[k].name[0].toUpperCase() + FILLS[k].name.slice(1) })) },
        { key: 'V0', label: 'Volume before', min: 10, max: 55, step: 1, unit: 'mL', fmt: v => v.toFixed(0), restructure: true },
        { key: 'load', label: 'Load on the plunger', min: 0, max: 10, step: 0.5, unit: 'kg', fmt: v => v.toFixed(1), restructure: true },
        { key: 'Tc', label: 'Room temperature', min: 0, max: 50, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'The microscope', when: is('brownian'), items: [
        { key: 'bead', label: 'Bead diameter', min: 0.2, max: 5, step: 0.1, unit: 'µm', fmt: v => v.toFixed(1), restructure: true },
        { key: 'liq', type: 'select', label: 'Liquid', restructure: true, options: Object.keys(LIQUIDS).map(k => ({ value: k, label: LIQUIDS[k].name[0].toUpperCase() + LIQUIDS[k].name.slice(1) })) },
        { key: 'bT', label: 'Temperature', min: 5, max: 80, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'trail', type: 'toggle', label: 'Draw each bead’s path', display: true }] },
      { group: 'The substance', when: is('phases'), items: [
        { key: 'subst', type: 'select', label: 'Atoms', restructure: true, options: Object.keys(SUBST).map(k => ({ value: k, label: SUBST[k].name[0].toUpperCase() + SUBST[k].name.slice(1) + ' (melts at ' + SUBST[k].melt + ' K)' })) },
        { key: 'N', label: 'How many atoms', min: 60, max: 200, step: 10, unit: '', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'Heat', when: is('phases'), items: [
        { key: 'mode', type: 'select', label: 'The stage', restructure: true, options: [{ value: 'hold', label: 'Hold a temperature' }, { value: 'heat', label: 'Heat steadily' }, { value: 'cool', label: 'Cool steadily' }] },
        { key: 'TK', label: 'Temperature (start)', min: 10, max: 400, step: 1, unit: 'K', fmt: v => v.toFixed(0), restructure: true },
        { key: 'power', type: 'select', label: 'Heater power', restructure: true, when: S => S.p.mode !== 'hold', options: [{ value: 'gentle', label: 'Gentle' }, { value: 'strong', label: 'Strong' }] }] },
      { group: 'The gases', when: is('temperature'), items: [
        { key: 'gasA', type: 'select', label: 'Gas A', restructure: true, options: Object.keys(GASES).map(k => ({ value: k, label: GASES[k].name[0].toUpperCase() + GASES[k].name.slice(1) + ' (' + GASES[k].m.toFixed(0) + ' u)' })) },
        { key: 'gasB', type: 'select', label: 'Gas B', restructure: true, options: Object.keys(GASES).map(k => ({ value: k, label: GASES[k].name[0].toUpperCase() + GASES[k].name.slice(1) + ' (' + GASES[k].m.toFixed(0) + ' u)' })) },
        { key: 'fracB', label: 'Share of gas B', min: 0, max: 1, step: 0.1, unit: '', fmt: v => Math.round(v * 100) + ' %', restructure: true },
        { key: 'TG', label: 'Temperature', min: 50, max: 600, step: 10, unit: 'K', fmt: v => v.toFixed(0), restructure: true },
        { key: 'start', type: 'select', label: 'Start', restructure: true, options: [{ value: 'same', label: 'In a heat bath' }, { value: 'hot-heavy', label: 'Insulated: B hot, A cold' }] }] },
      { group: 'The hot object', when: is('total'), items: [
        { key: 'obj', type: 'select', label: 'Object', restructure: true, options: Object.keys(OBJECTS).map(k => ({ value: k, label: OBJECTS[k].name[0].toUpperCase() + OBJECTS[k].name.slice(1) })) },
        { key: 'objT', label: 'Its temperature', min: 10, max: 1600, step: 10, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'logm', label: 'Its mass', min: -9, max: 2, step: 0.1, unit: 'kg', fmt: v => { const m = Math.pow(10, v); return m < 1e-3 ? (m * 1e6).toPrecision(2) + ' mg' : m < 1 ? (m * 1000).toPrecision(3) + ' g' : m.toPrecision(3) + ' kg'; }, restructure: true },
        { key: 'ice', label: 'Ice at 0 °C', min: 0.1, max: 20, step: 0.1, unit: 'kg', fmt: v => v.toFixed(1), restructure: true }] },
      { group: 'The thermometer', when: is('thermometer'), items: [
        { key: 'th', type: 'select', label: 'Thermometer', restructure: true, options: Object.keys(THERMS).map(k => ({ value: k, label: THERMS[k].name[0].toUpperCase() + THERMS[k].name.slice(1) })) },
        { key: 'Tp0', label: 'It starts at', min: 0, max: 40, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true, when: S => S.p.th !== 'ir' },
        { key: 'epsSet', label: 'Emissivity it is set to', min: 0.1, max: 1, step: 0.01, unit: '', fmt: v => v.toFixed(2), restructure: true, when: S => S.p.th === 'ir' }] },
      { group: 'The sample', when: is('thermometer'), items: [
        { key: 'sV', label: 'Volume', min: 0.5, max: 1000, step: 0.5, unit: 'mL', fmt: v => v.toFixed(v < 10 ? 1 : 0), restructure: true },
        { key: 'sT', label: 'Starts at', min: 0, max: 95, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'surf', type: 'select', label: 'In', restructure: true, options: Object.keys(SURFACES).map(k => ({ value: k, label: SURFACES[k].name[0].toUpperCase() + SURFACES[k].name.slice(1) })) },
        { key: 'unit', type: 'select', label: 'Read it in', restructure: false, options: [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }, { value: 'K', label: 'K' }] }] }
    ],
    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    plots: [
      { title: S => ({ particles: 'The volume after the load goes on', brownian: 'Mean-square displacement against time', phases: S.p.mode === 'hold' ? 'This run: temperature against time' : 'The heating (or cooling) curve, as it happens', temperature: 'How fast the atoms go: the speed histogram', total: 'Ice melting, second by second', thermometer: 'What it reads, and what is really there' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ particles: 'Every filling: volume against pressure', brownian: 'Wandering against bead size, in three liquids', phases: 'Where each substance melts and boils', temperature: 'Each gas’s temperature, collision by collision', total: 'Hotter is not more energy', thermometer: 'The settled error against the sample’s size' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],
    problems: [
      { source: 'NGSS MS-PS1-4 · CAST pattern: using a model to predict',
        q: 'A sealed syringe holds 40 mL of air at 102.2 kPa (the plunger’s own weight). A 4.0 kg load is put on its 6.6 cm² plunger. What volume does the air settle at once it has cooled back to the room?',
        params: preset({ setup: 'particles', load: 4 }),
        predict: { label: 'volume', unit: 'mL', tol: 0.02 },
        measure: S => syringeOf(S.p, 1e9).V,
        working: 'The load adds mg/A = 4.0 × 9.81 ÷ 6.6 × 10⁻⁴ m² ≈ 59 kPa, so P = 161.6 kPa. Boyle: V₂ = V₁P₁/P₂ = 40 × 102.2 ÷ 161.6 = <b>25.3 mL</b>. The air gave up a third of its volume because most of it was empty space between particles.' },
      { source: 'NGSS MS-PS1-4 · CAST pattern: comparing models',
        q: 'Now the syringe holds 40 mL of water under the same 4.0 kg. Water’s bulk modulus is 2.2 GPa. By how many microlitres does it shrink?',
        params: preset({ setup: 'particles', fill: 'water', load: 4 }),
        predict: { label: 'shrinks by', unit: 'µL', tol: 0.03 },
        measure: S => syringeOf(S.p, 1e9).dV * 1000,
        working: 'ΔV = V·ΔP/K = 40 mL × 59.4 kPa ÷ 2.2 × 10⁶ kPa = 0.00108 mL = <b>1.08 µL</b> — a 25 000th of what the air gave. Water’s particles already touch.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: evidence from data',
        q: 'Track 300 one-micrometre beads in water at 20 °C for 10 s. From their mean-square displacement, Perrin’s equation N_A = 4RTt ÷ (6πηr⟨r²⟩) gives Avogadro’s number. What do you get?',
        params: preset({ setup: 'brownian' }),
        predict: { label: 'N_A', unit: 'per mole', tol: 0.08 },
        measure: S => perrin(S.p.bead, S.p.bT, S.p.liq, beadsOf(S).many, 300),
        working: 'D = kT ÷ 6πηr = 1.381 × 10⁻²³ × 293.15 ÷ (6π × 1.002 × 10⁻³ × 0.5 × 10⁻⁶) = 0.428 µm²/s, so ⟨r²⟩ at 10 s should be 4Dt ≈ 17 µm². The 300 tracks give about that, and Perrin’s equation returns about <b>6.0 × 10^23</b> per mole — within the scatter of 300 random walks. Perrin got 6.8 × 10²³ in 1908.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: temperature and speed',
        q: 'At 300 K, how fast (rms, in 3D) do xenon atoms move, if helium atoms move at 1368 m/s?',
        params: preset({ setup: 'temperature' }),
        predict: { label: 'xenon rms speed', unit: 'm/s', tol: 0.02 },
        measure: S => vrms3(GASES.xe.m, S.p.TG),
        working: 'The same temperature means the same average kinetic energy, ½mv², so v ∝ 1/√m: 1368 × √(4.00 ÷ 131.3) = <b>239 m/s</b>. The box shows the same ratio in its histograms.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: temperature vs thermal energy',
        q: 'A 250 g mug of tea at 70 °C is set on crushed ice at 0 °C. How much ice melts as the tea cools to 0 °C? (c_water 4186 J/kg·K; ice needs 334 J per gram.)',
        params: preset({ setup: 'total' }),
        predict: { label: 'ice melted', unit: 'g', tol: 0.02 },
        measure: S => iceOf(S).melt * 1000,
        working: 'Q = mcΔT = 0.25 × 4186 × 70 = 73.3 kJ, and 73 300 ÷ 334 = <b>219 g</b>. A 1500 °C spark of 4 µg melts 8 µg: twenty times hotter, 27 million times less ice.' },
      { source: 'NGSS SEP · CAST pattern: evaluating a measurement',
        q: 'A glass thermometer at room temperature (20 °C, heat capacity 1.2 J/K) is put in a 1.0 mL drop of water at 80 °C (4.19 J/K). Ignoring heat lost to the room, what temperature do they settle at?',
        params: preset({ setup: 'thermometer', sV: 1 }),
        predict: { label: 'settled', unit: '°C', tol: 0.01 },
        measure: S => thermOf(S).eq,
        working: '(4.19 × 80 + 1.2 × 20) ÷ (4.19 + 1.2) = <b>66.6 °C</b>. The thermometer pulled 13 K out of the drop before it could read it. In a 1 L beaker the same thermometer is off by 0.02 K.' }
    ],
    walkthrough: [
      { title: 'Do particles in a solid move?', ask: 'Argon is held at 70 K and has formed a crystal. Are its atoms still?',
        reveal: '<b>No — they vibrate in place at about 170 m/s.</b> The temperature is computed from those speeds. Solid means the neighbours stay the same (about 6 each), not that nothing moves.', params: preset({}) },
      { title: 'Melt it', ask: 'Heat the crystal steadily from 40 K. What does the temperature do while it melts?',
        reveal: '<b>It nearly stops rising.</b> The heat goes into pulling neighbours apart — the potential energy of the particles — rather than speeding them up. The flat part of the heating curve is the melting.', params: preset({ mode: 'heat', TK: 40 }) },
      { title: 'Why can you squeeze air but not water?', ask: 'Put 8 kg on the syringe of air, then of water. Which gives way, and why?',
        reveal: '<b>The air, by about 40 %; the water by about two microlitres.</b> Air’s particles are about nine times their own width apart; water’s touch. You can only squeeze out empty space.', params: preset({ setup: 'particles', load: 8 }) },
      { title: 'Something alive?', ask: 'The beads jiggle without stopping. Brown thought pollen might be alive. Is something pushing them?',
        reveal: '<b>Water molecules are — from every side, unevenly.</b> Dead dust and latex beads do it too. Thicker liquid (glycerol) or a bigger bead: slower. Hotter: faster.', params: preset({ setup: 'brownian' }) },
      { title: 'Same temperature, different speeds', ask: 'Helium and xenon at 300 K in one box. Which atoms are faster? Which have more kinetic energy?',
        reveal: '<b>Helium is ~5.7 times faster; the kinetic energies are equal on average.</b> Temperature measures the average kinetic energy, so heavy atoms move slower at the same temperature.', params: preset({ setup: 'temperature' }) },
      { title: 'The spark and the bucket', ask: 'A 1500 °C spark and a 40 °C bucket of bathwater on ice. Which melts more?',
        reveal: '<b>The bathwater, by about 10¹⁰ times.</b> The spark’s particles are far more energetic, but there are very few of them. Thermal energy depends on temperature and on how much stuff.', params: preset({ setup: 'total', obj: 'bath', objT: 40, logm: 1, ice: 20 }) },
      { title: 'Measuring changes the measured', ask: 'Put the glass thermometer into a 1 mL drop at 80 °C. Does it read 80?',
        reveal: '<b>It settles at about 66 °C.</b> The thermometer had to warm up from 20 °C, and took that heat from the drop. Use a small probe (a thermocouple) for small samples.', params: preset({ setup: 'thermometer', sV: 1 }) }
    ],
    quiz: [
      { q: 'In a solid, the particles…', options: ['do not move', 'vibrate around fixed places', 'move freely past each other', 'are bigger than in a liquid'], answer: 1,
        why: 'The crystal at 70 K is full of motion; the neighbours just stay the same.' },
      { q: 'Temperature is a measure of…', options: ['the total heat in an object', 'the average kinetic energy of its particles', 'how big the particles are', 'how many particles there are'], answer: 1,
        why: 'A spark is hotter than a bathtub but holds far less thermal energy — temperature is an average per particle.' },
      { q: 'A bead under a microscope jiggles. This is evidence that…', options: ['the bead is alive', 'the liquid’s particles are moving and hitting it', 'light pushes it', 'the microscope shakes'], answer: 1,
        why: 'Einstein showed the wandering matches random molecular kicks, and Perrin used it to count molecules.' },
      { q: 'Air in a sealed syringe can be squeezed but water cannot (much), because…', options: ['air particles are smaller', 'gas particles have large spaces between them', 'water particles are heavier', 'air is not made of particles'], answer: 1,
        why: 'Air’s particles are about nine of their own widths apart; water’s are in contact.' },
      { q: 'A cold thermometer is put into a tiny drop of hot water. Its reading will be…', options: ['exactly right', 'too high', 'too low — it cooled the drop', 'zero'], answer: 2,
        why: 'The thermometer warms up by taking heat from the drop, so the drop ends cooler than it started.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Molecular dynamics</b> — this is how chemists and materials scientists simulate matter; the Lennard-Jones model of argon is the classic first test (Rahman, 1964).</li>' +
      '<li><b>Brownian motion</b> — Einstein (1905) and Perrin (1908, Nobel 1926) turned a jiggling grain into the decisive evidence that atoms are real.</li>' +
      '<li><b>Syringes and tyres</b> — air is compressible because it is mostly empty space; hydraulic brakes work because brake fluid is not.</li>' +
      '<li><b>Thermometers</b> — doctors use small fast probes; chemists use thermocouples on small samples; infrared guns must be set for the surface’s emissivity.</li></ul>' +
      '<b>What the lab assumes.</b> The particle boxes are two-dimensional Lennard-Jones molecular dynamics (velocity Verlet, a 2.5σ cut-off, walls, gentle gravity, a heat bath of Andersen collisions or a constant-power heater); 2D melting and boiling temperatures differ from real 3D ones, so the substance’s real values are shown beside them. The syringe uses Boyle’s law with an adiabatic first squeeze relaxing over 18 s, and bulk moduli for the liquids. The beads use Stokes–Einstein with a Vogel viscosity for water. The thermometer is two lumped heat capacities and the sample’s loss to a 20 °C room.' +
      '<div class="pyq"><em>Misconception to catch</em> “The particles of a solid don’t move” and “a hotter object has more heat.” Solids vibrate; temperature is an average per particle, while thermal energy also counts how many particles there are.</div>'
  });

  const MODEL = Object.assign({}, MD0, { BASE: () => preset({}), syringeV, syringeOf, pressureOf, FILLS, Dof, etaOf, beadTracks, msdOf, perrin, iceRun, OBJECTS, thermoRun, apparentT, toUnit, vrms3, GASES, SUBST, tauOf, SETUPS });
  L.models = L.models || {};
  L.models['g6c-particle-box'] = MODEL;
})(window.InsightLab);
