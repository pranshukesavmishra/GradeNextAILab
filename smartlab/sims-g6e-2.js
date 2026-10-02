/* ============================================================
   GRADE 6 · UNIT E · REGIONAL CLIMATE, ORGANISMS AND HEREDITY
   6E-2  Circulation of Air and Ocean
   (E2.1 Convection cells from unequal heating; E2.2 Circulation cells and
    prevailing winds; E2.3 An introductory Coriolis effect; E2.4 Surface ocean
    currents; E2.5 Temperature, salinity and density in ocean water; E2.6 Heat
    redistribution: one combined model)

   Six benches, each a real computation:
     convection — a glass tank of water on a hot plate, ice at the other end:
                  the Boussinesq equations (vorticity, stream function,
                  temperature) solved on a 65 × 25 grid, water's real density
                  from the UNESCO equation (densest at 4 °C), permanganate dye
                  carried by the computed flow;
     cells      — the Hadley cell's width from Held & Hou (1980),
                  φ_H = √(5gHΔ/3Ω²a²), the cells that fit between it and the
                  pole, the winds the turning Earth makes of their flow, air
                  parcels carried round a globe;
     coriolis   — a puck on a turntable: a straight line in the room, a curve
                  on the disc, computed exactly; Rossby numbers for a sink,
                  a tornado, a hurricane and an ocean;
     currents   — Stommel's (1948) wind-driven ocean: R∇²ψ + βψx = curl τ/ρ,
                  solved exactly; the Gulf Stream appears on the west side only
                  when β ≠ 0; Sverdrup's transport;
     density    — seawater density from the UNESCO 1981 equation of state; a
                  lock-exchange tank where the denser water runs under the
                  lighter at Benjamin's ½√(g′H);
     heat       — a diffusive energy-balance model (North 1975) of the whole
                  planet: what the air and sea carry poleward, and the world
                  without them.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.EARTH, R3, MEAS, G6E and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6E, MEAS = () => window.MEAS;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003 + 0.5) / 1000003.5; }; }
  const G = 9.81, OMEGA = 7.2921e-5, A_E = 6.371e6, RHO_C = 4.18e6;

  /* ============================================================
     1. SEAWATER — UNESCO (1981) one-atmosphere equation of state, EOS-80.
     ρ(S, T) in kg/m³, S in g/kg (PSU), T in °C. Checks: ρ(35, 25) = 1023.343,
     fresh water densest at 3.98 °C, 999.975. Freezing point (Millero 1978).
     ============================================================ */
  function rhoSW(S, T) {
    const rw = 999.842594 + 6.793952e-2 * T - 9.095290e-3 * T * T + 1.001685e-4 * T ** 3 - 1.120083e-6 * T ** 4 + 6.536332e-9 * T ** 5;
    if (!S) return rw;
    const a = 8.24493e-1 - 4.0899e-3 * T + 7.6438e-5 * T * T - 8.2467e-7 * T ** 3 + 5.3875e-9 * T ** 4;
    const b = -5.72466e-3 + 1.0227e-4 * T - 1.6546e-6 * T * T;
    return rw + a * S + b * Math.pow(S, 1.5) + 4.8314e-4 * S * S;
  }
  const freezeT = S => -0.0575 * S + 1.710523e-3 * Math.pow(S, 1.5) - 2.154996e-4 * S * S;
  /* a gravity current let go from a lock: each front runs at ½√(g′H) (Benjamin 1968; Shin et al. 2004) */
  const lockSpeed = (rho1, rho2, H) => 0.5 * Math.sqrt(G * Math.abs(rho1 - rho2) / Math.min(rho1, rho2) * H);

  /* ============================================================
     2. THE CONVECTION TANK
     A 40 × 15 cm slice of water, 10 cm front to back. Vorticity ω, stream
     function ψ (∇²ψ = −ω), temperature T:
       ∂T/∂t + u·∇T = κ∇²T + heating − cooling
       ∂ω/∂t + u·∇ω = ν∇²ω + ∂b/∂x,   b = −g(ρ(T) − ρ₀)/ρ₀
     No-slip glass walls (Thom's wall vorticity), a free surface; the hot
     plate puts its power into the water over it; the ice takes heat at
     h = 300 W/m²K and melts at 334 J/g; the surface loses to the room at
     8 W/m²K. On a 6 mm grid the eddies smaller than a cell are mixed: ν and κ
     are 1.2 × 10⁻⁵ m²/s for water (twelve times the molecular ν), ten times
     that for syrup. Upwind advection, SOR for ψ.
     ============================================================ */
  const TK = { L: 0.40, H: 0.15, D: 0.10, NX: 65, NY: 25, ROOM: 20, ICE0: 75 };
  TK.dx = TK.L / (TK.NX - 1); TK.dy = TK.H / (TK.NY - 1);
  const FLUID = { water: { nu: 1.2e-5, name: 'water' }, syrup: { nu: 1.2e-4, name: 'sugar syrup' } };
  function convStart(p) {
    const N = TK.NX * TK.NY, C = { T: new Float64Array(N).fill(p.waterT), w: new Float64Array(N), s: new Float64Array(N), u: new Float64Array(N), v: new Float64Array(N),
      t: 0, ice: p.ice ? TK.ICE0 : 0, heatIn: 0, rho0: rhoSW(0, p.waterT), dye: [], rel: 0, r: rng(7 + Math.round(p.power)), umax: 0 };
    return C;
  }
  const IX = (i, j) => j * TK.NX + i;
  function heaterSpan(p) { return p.heatAt === 'middle' ? [0.14, 0.26] : [0.02, 0.14]; }
  function convStep(C, dt, p) {
    const { NX, NY, dx, dy } = TK, T = C.T, w = C.w, s = C.s, u = C.u, v = C.v, nu = FLUID[p.fluid].nu, ka = nu;
    // velocities from the stream function
    let um = 0;
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
      const k = IX(i, j);
      u[k] = (s[k + NX] - s[k - NX]) / (2 * dy); v[k] = -(s[k + 1] - s[k - 1]) / (2 * dx);
      const sp = Math.hypot(u[k], v[k]); if (sp > um) um = sp;
    }
    C.umax = um;
    const Tn = new Float64Array(T), wn = new Float64Array(w), RH = C.RH || (C.RH = new Float64Array(T.length));
    for (let k = 0; k < T.length; k++) RH[k] = rhoSW(0, T[k]);
    const [h0, h1] = heaterSpan(p), nh = Math.max(1, Math.round((h1 - h0) / dx));
    const qCell = p.power / nh / (RHO_C * dx * dy * TK.D);                  // K/s in each cell over the plate
    const iceArea = C.ice > 0 ? Math.pow(C.ice / TK.ICE0, 2 / 3) : 0, iceX = TK.L - 0.11;
    let iceQ = 0;
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
      const k = IX(i, j), uu = u[k], vv = v[k];
      const Tx = uu > 0 ? (T[k] - T[k - 1]) / dx : (T[k + 1] - T[k]) / dx, Ty = vv > 0 ? (T[k] - T[k - NX]) / dy : (T[k + NX] - T[k]) / dy;
      const lapT = (T[k + 1] - 2 * T[k] + T[k - 1]) / (dx * dx) + (T[k + NX] - 2 * T[k] + T[k - NX]) / (dy * dy);
      let src = 0;
      const x = i * dx;
      if (j === 1 && x >= h0 && x <= h1) src += qCell;
      if (j === NY - 2) {
        src -= 8 * (T[k] - TK.ROOM) / (RHO_C * dy);
        if (iceArea > 0 && x >= iceX && x <= iceX + 0.09) { const q = 300 * iceArea * Math.max(0, T[k]) / (RHO_C * dy); src -= q; iceQ += q * RHO_C * dx * dy * TK.D; }
      }
      Tn[k] = T[k] + dt * (-uu * Tx - vv * Ty + ka * lapT + src);
      const wx = uu > 0 ? (w[k] - w[k - 1]) / dx : (w[k + 1] - w[k]) / dx, wy = vv > 0 ? (w[k] - w[k - NX]) / dy : (w[k + NX] - w[k]) / dy;
      const lapW = (w[k + 1] - 2 * w[k] + w[k - 1]) / (dx * dx) + (w[k + NX] - 2 * w[k] + w[k - NX]) / (dy * dy);
      const bx = -G * (RH[k + 1] - RH[k - 1]) / (2 * dx * C.rho0);
      wn[k] = w[k] + dt * (-uu * wx - vv * wy + nu * lapW + bx);
    }
    // insulated walls for heat
    for (let i = 0; i < NX; i++) { Tn[IX(i, 0)] = Tn[IX(i, 1)]; Tn[IX(i, NY - 1)] = Tn[IX(i, NY - 2)]; }
    for (let j = 0; j < NY; j++) { Tn[IX(0, j)] = Tn[IX(1, j)]; Tn[IX(NX - 1, j)] = Tn[IX(NX - 2, j)]; }
    C.T = Tn; C.w = wn;
    C.heatIn += p.power * dt;
    if (C.ice > 0) C.ice = Math.max(0, C.ice - iceQ * dt / 334);
    // ψ from ω (SOR), ψ = 0 on every wall
    const W = C.w, S = C.s, om = 1.7, cx = 1 / (dx * dx), cy = 1 / (dy * dy), cc = 2 * (cx + cy);
    for (let it = 0; it < 22; it++) for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
      const k = IX(i, j), ns = ((S[k + 1] + S[k - 1]) * cx + (S[k + NX] + S[k - NX]) * cy + W[k]) / cc;
      S[k] += om * (ns - S[k]);
    }
    // wall vorticity: no-slip glass on the floor and the ends (Thom), a free surface on top
    for (let i = 1; i < NX - 1; i++) { W[IX(i, 0)] = -2 * S[IX(i, 1)] / (dy * dy); W[IX(i, NY - 1)] = 0; }
    for (let j = 1; j < NY - 1; j++) { W[IX(0, j)] = -2 * S[IX(1, j)] / (dx * dx); W[IX(NX - 1, j)] = -2 * S[IX(NX - 2, j)] / (dx * dx); }
    C.t += dt;
  }
  /* one step of the class's clock, cut into steps the grid can take stably (diffusion and flow) */
  function convAdvance(C, dt, p) {
    const lim = Math.min(0.25, 0.2 * TK.dx * TK.dx / FLUID[p.fluid].nu, 0.5 * TK.dx / Math.max(1e-4, C.umax));
    let left = dt; while (left > 1e-9) { const h = Math.min(lim, left); convStep(C, h, p); dyeStep(C, h, p); left -= h; }
  }
  function velAt(C, x, y) {
    const { NX, NY, dx, dy } = TK, fi = clamp(x / dx, 1, NX - 2.001), fj = clamp(y / dy, 1, NY - 2.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    const f = A => (A[IX(i, j)] * (1 - a) + A[IX(i + 1, j)] * a) * (1 - b) + (A[IX(i, j + 1)] * (1 - a) + A[IX(i + 1, j + 1)] * a) * b;
    return [f(C.u), f(C.v)];
  }
  const tempAt = (C, x, y) => { const i = clamp(Math.round(x / TK.dx), 0, TK.NX - 1), j = clamp(Math.round(y / TK.dy), 0, TK.NY - 1); return C.T[IX(i, j)]; };
  function dyeStep(C, dt, p) {
    const r = C.r;
    // the crystal of permanganate dissolves for the first minute, at the bottom by the heater
    const cx = (heaterSpan(p)[0] + heaterSpan(p)[1]) / 2 + 0.03;
    if (C.t < 60 && C.dye.length < 700) { C.rel += dt * 10; while (C.rel >= 1) { C.rel -= 1; C.dye.push({ x: cx + (r() - 0.5) * 0.01, y: 0.004 + r() * 0.004, z: (r() - 0.5) * 0.06, age: 0 }); } }
    const dd = Math.sqrt(2 * 2e-6 * dt);
    C.dye.forEach(d => {
      const V = velAt(C, d.x, d.y);
      d.x = clamp(d.x + V[0] * dt + (r() - 0.5) * 3.4 * dd, 0.003, TK.L - 0.003);
      d.y = clamp(d.y + V[1] * dt + (r() - 0.5) * 3.4 * dd, 0.003, TK.H - 0.003);
      d.age += dt;
    });
  }
  /* the experiment run to a near-steady state: what a class would measure after 5 minutes */
  const SCACHE = {};
  function convRun(p, secs) {
    const key = [p.power, p.ice, p.heatAt, p.fluid, p.waterT, secs].join('|');
    if (SCACHE[key]) return SCACHE[key];
    const C = convStart(p);
    let um = 0;
    const lim = Math.min(0.25, 0.2 * TK.dx * TK.dx / FLUID[p.fluid].nu);
    while (C.t < secs) { convStep(C, Math.min(lim, 0.5 * TK.dx / Math.max(1e-4, C.umax)), p); if (C.t > secs * 0.6) um = Math.max(um, C.umax); }
    const out = { umax: um, Tl: tempAt(C, 0.05, 0.12), Tr: tempAt(C, TK.L - 0.05, 0.12), Tb: tempAt(C, TK.L / 2, 0.02), Tt: tempAt(C, TK.L / 2, 0.13), ice: C.ice };
    const ks = Object.keys(SCACHE); if (ks.length > 60) delete SCACHE[ks[0]];
    return (SCACHE[key] = out);
  }
  /* the Rayleigh number with water's molecular ν and κ: gαΔT·H³/(νκ) */
  const alphaW = T => -(rhoSW(0, T + 0.5) - rhoSW(0, T - 0.5)) / rhoSW(0, T);
  const rayleigh = (dT, T) => G * Math.abs(alphaW(T)) * dT * Math.pow(TK.H, 3) / (1.0e-6 * 1.43e-7);

  /* ============================================================
     3. THE GLOBAL CELLS
     Held & Hou (1980): an angular-momentum-conserving Hadley cell reaches
       φ_H = √(5 g H Δ_H / (3 Ω² a²)),   H = 10 km, Δ_H = ΔT/288 K
     — 28.8° for Earth with ΔT = 96 K. Between it and the pole fit
     n = round(90°/φ_H) cells, alternately direct (rising on the warm side)
     and indirect. Air moving toward the equator is turned west by the
     Coriolis effect (easterly trades), air moving poleward east
     (westerlies): the surface wind of each cell. Upper-air wind of the
     Hadley cell: u_M = Ωa sin²φ / cos φ. The pattern follows the Sun a third
     of its latitude.
     ============================================================ */
  function hadleyLat(dayH, dT) {
    const Om = TAU / (dayH * 3600) * (dayH === 24 ? 1.00274 : 1), D = dT / 288;
    return Math.sqrt(5 / 3 * G * 1e4 * D / (Om * Om * A_E * A_E)) * 180 / Math.PI;
  }
  function cellsOf(p) {
    const phH = hadleyLat(p.dayH, p.dT), shift = 0.35 * p.sunLat;
    const n = clamp(Math.round(90 / Math.min(90, phH)), 1, 8), out = [];
    // north and south, from the equator (shifted toward the summer hemisphere) to each pole
    [1, -1].forEach(h => {
      const bounds = [shift];
      const first = Math.min(90, phH + h * shift * 0.5) , e = h > 0 ? clamp(shift + first, shift + 5, 90) : clamp(shift - first, -90, shift - 5);
      bounds.push(e);
      for (let k = 1; k < n; k++) bounds.push(e + (h * 90 - e) * k / (n - 1));
      for (let k = 0; k < n; k++) {
        const a = bounds[k], b = bounds[k + 1]; if (Math.abs(b - a) < 0.5) continue;
        out.push({ a: Math.min(a, b), b: Math.max(a, b), k, h, direct: k % 2 === 0, name: n === 1 ? 'one cell' : k === 0 ? 'Hadley' : (n === 3 && k === 1) ? 'Ferrel' : (n === 3 && k === 2) ? 'Polar' : '' });
      }
    });
    return { phH, n, shift, cells: out };
  }
  /* surface wind (u east, v north) in m/s at a latitude */
  function surfaceWind(CF, lat, dT) {
    const c = CF.cells.find(q => lat >= q.a && lat <= q.b); if (!c) return [0, 0];
    const f = Math.sin(Math.PI * (lat - c.a) / (c.b - c.a)), amp = 7 * Math.min(1.6, dT / 96);
    // flow along the surface toward the equator in direct cells, toward the pole in indirect ones
    const toPole = c.direct ? -1 : 1, v = toPole * c.h * amp * 0.35 * f;
    const sinl = Math.sin(lat * Math.PI / 180), u = (CF.n === 1 ? 0.25 : 1) * (c.direct ? -1 : 1) * amp * f * Math.min(1, Math.abs(sinl) * 4 + 0.15);
    return [u, v];
  }
  const uM = (Om, lat) => { const r = lat * Math.PI / 180; return Om * A_E * Math.sin(r) ** 2 / Math.cos(r); };
  const coriolisF = lat => 2 * OMEGA * Math.sin(lat * Math.PI / 180);

  /* ============================================================
     4. THE TURNTABLE — exact kinematics. A puck slides without friction in
     a straight line at speed v across a disc turning at Ω. On the disc its
     position is the room position turned back by Ωt; drawn there, the
     straight path is a curve bending to the right when the disc turns
     anticlockwise (as the Northern Hemisphere does, seen from above).
     ============================================================ */
  const TT = { R: 0.30 };
  function puckAt(p, t) {
    const Om = (p.sense === 'cw' ? -1 : 1) * p.rpm * TAU / 60, a = p.aim * Math.PI / 180;
    const x0 = -TT.R * 0.95, y0 = 0, x = x0 + p.speed * Math.cos(a) * t, y = y0 + p.speed * Math.sin(a) * t;
    const ca = Math.cos(-Om * t), sa = Math.sin(-Om * t);
    return { room: [x, y], disc: [x * ca - y * sa, x * sa + y * ca], on: x * x + y * y <= TT.R * TT.R + 1e-9 };
  }
  /* the whole crossing: time on the disc, where it leaves the disc in the disc's frame, and how far round from where it was aimed */
  function crossing(p) {
    const a = p.aim * Math.PI / 180, x0 = -TT.R * 0.95, dx = Math.cos(a), dy = Math.sin(a);
    const bq = 2 * x0 * dx, cq = x0 * x0 - TT.R * TT.R, tExit = (-bq + Math.sqrt(bq * bq - 4 * cq)) / 2 / p.speed;
    const e = puckAt(p, tExit), aimed = [x0 + dx * tExit * p.speed, dy * tExit * p.speed];
    let dAng = Math.atan2(e.disc[1], e.disc[0]) - Math.atan2(aimed[1], aimed[0]); while (dAng > Math.PI) dAng -= TAU; while (dAng < -Math.PI) dAng += TAU;
    const pts = []; for (let k = 0; k <= 80; k++) pts.push(puckAt(p, tExit * k / 80).disc);
    return { t: tExit, exit: e.disc, aimed, miss: dAng * TT.R, dAng, pts };
  }
  /* Rossby number U/(fL) at 45°: below about 1 the turning Earth steers the flow */
  const SCALES = {
    sink: { name: 'a draining sink', U: 0.1, L: 0.3 },
    tub: { name: 'a bathtub vortex', U: 0.3, L: 1 },
    tornado: { name: 'a tornado', U: 100, L: 300 },
    shell: { name: 'an artillery shell, 20 km', U: 800, L: 2e4 },
    hurricane: { name: 'a hurricane', U: 40, L: 5e5 },
    gulf: { name: 'the Gulf Stream', U: 1.5, L: 1e5 },
    gyre: { name: 'an ocean gyre', U: 0.1, L: 3e6 }
  };
  const rossby = k => SCALES[k].U / (coriolisF(45) * SCALES[k].L);

  /* ============================================================
     5. THE WIND-DRIVEN OCEAN — Stommel (1948), exactly.
     A basin λ wide (west → east) and b long (south → north), wind stress
     τ = −τ₀cos(πy/b) (easterly trades in the south, westerlies in the north),
     bottom friction R, β = df/dy. Volume-transport stream function:
       ψ = Ψ₀ sin(πy/b) (p e^{Ax} + q e^{Bx} − 1),   Ψ₀ = τ₀b/(ρRπ),
       A, B = −α/2 ± √(α²/4 + (π/b)²),  α = β/R,  p = (1 − e^{Bλ})/(e^{Aλ} − e^{Bλ}),  q = 1 − p.
     With β = 0 the gyre is symmetric; with β the return flow crowds into a
     western boundary current R/β wide carrying Sverdrup's τ₀πλ/(ρβb).
     ============================================================ */
  const OC = { b: 5.0e6, rho: 1025, Dm: 500, betaE: 2.0e-11 };
  function stommel(p) {
    const lam = p.width * 1e3, b = OC.b, R = Math.pow(10, p.logR), beta = OC.betaE * p.beta, al = beta / R, k2 = Math.pow(Math.PI / b, 2);
    const rt = Math.sqrt(al * al / 4 + k2), A = -al / 2 + rt, B = -al / 2 - rt;
    // scaled exponentials so that a large Bλ cannot overflow
    const eA = x => Math.exp(A * (x - lam)), eB = x => Math.exp(B * x);
    const EAl = 1, EB = Math.exp(B * lam), EA0 = Math.exp(-A * lam);
    // p e^{Ax} = p' e^{A(x−λ)} with p' = p e^{Aλ} = (1 − e^{Bλ}) / (1 − e^{Bλ}e^{−Aλ})
    const pp = (1 - EB) / (EAl - EB * EA0), qq = 1 - pp * EA0;
    const S = x => pp * eA(x) + qq * eB(x) - 1;
    const Psi0 = -p.tau * b / (OC.rho * R * Math.PI);
    return { lam, b, R, beta, A, B, S, Psi0, psi: (x, y) => Psi0 * S(x) * Math.sin(Math.PI * y / b), sverdrup: beta > 0 ? p.tau * Math.PI * lam / (OC.rho * beta * b) : null, delta: beta > 0 ? R / beta : null };
  }
  function oceanField(M, nx, ny) {
    let mn = 0, mx = 0, xmin = 0; const out = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const v = M.psi((i + 0.5) / nx * M.lam, (j + 0.5) / ny * M.b); out[j * nx + i] = v; if (v < mn) { mn = v; xmin = (i + 0.5) / nx * M.lam; } if (v > mx) mx = v; }
    return { f: out, mn, mx, xmin };
  }
  /* velocity (m/s) in the upper layer, D deep: v = ∂ψ/∂x / D, u = −∂ψ/∂y / D */
  function oceanVel(M, x, y) {
    const h = 2000, hx = Math.min(h, M.lam * 1e-4 + 200);
    const v = (M.psi(x + hx, y) - M.psi(x - hx, y)) / (2 * hx) / OC.Dm, u = -(M.psi(x, y + h) - M.psi(x, y - h)) / (2 * h) / OC.Dm;
    return [u, v];
  }
  /* the strongest northward current along the middle of the basin, and where */
  function boundary(M) {
    let best = 0, at = 0, west = 0;
    for (let k = 1; k < 400; k++) { const x = M.lam * k / 400, v = oceanVel(M, x, M.b / 2)[1]; if (Math.abs(v) > Math.abs(best)) { best = v; at = x; } }
    const Ttot = Math.max(...Array.from({ length: 400 }, (_, k) => Math.abs(M.psi(M.lam * (k + 0.5) / 400, M.b / 2))));
    void west;
    return { vmax: best, at, transport: Ttot / 1e6 };
  }

  /* ============================================================
     6. THE WHOLE PLANET — a diffusive energy-balance model (North 1975):
       C ∂T/∂t = Q s(x)(1 − a) − (A + BT) + D ∂/∂x[(1 − x²) ∂T/∂x],  x = sin φ
     Q = S₀/4, s = 1 − 0.482 P₂(x), A = 203.3 W/m², B = 2.09 W/m²K,
     albedo 0.32 + 0.16 P₂(x), 0.62 over ice (T < −10 °C) when ice is allowed;
     D = 0.55 W/m²K reproduces today: a 15 °C world, a peak poleward
     transport of 5 PW near 35° (Trenberth & Caron 2001 measure 5.8 PW).
     Poleward heat flow F = −2πa²D(1 − x²)∂T/∂x.
     ============================================================ */
  const EBM = { N: 60, A: 203.3, B: 2.09, S2: -0.482, a0: 0.32, a2: 0.16, aIce: 0.62, C: 4e7 };
  EBM.x = Array.from({ length: EBM.N }, (_, i) => -1 + (i + 0.5) * 2 / EBM.N); EBM.dx = 2 / EBM.N;
  const P2 = x => (3 * x * x - 1) / 2;
  function ebmStep(T, dt, p) {
    const N = EBM.N, dx = EBM.dx, Q = p.S0 / 4, Tn = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const xi = EBM.x[i], s = 1 + EBM.S2 * P2(xi), alb = p.iceAlb && T[i] < -10 ? EBM.aIce : EBM.a0 + EBM.a2 * P2(xi);
      const xp = xi + dx / 2, xm = xi - dx / 2;
      const fp = i < N - 1 ? (1 - xp * xp) * (T[i + 1] - T[i]) / dx : 0, fm = i > 0 ? (1 - xm * xm) * (T[i] - T[i - 1]) / dx : 0;
      Tn[i] = T[i] + dt / EBM.C * (Q * s * (1 - alb) - (EBM.A + EBM.B * T[i]) + p.Dt * (fp - fm) / dx);
    }
    return Tn;
  }
  const ECACHE = {};
  function ebmSteady(p) {
    const key = p.Dt + '|' + p.S0 + '|' + p.iceAlb;
    if (ECACHE[key]) return ECACHE[key];
    let T = new Float64Array(EBM.N).fill(14);
    const dt = Math.min(8000, 0.4 * EBM.C * EBM.dx * EBM.dx / Math.max(1e-6, 2 * p.Dt));
    for (let k = 0, n = Math.ceil(5 * 3.156e7 / dt); k < n; k++) T = ebmStep(T, dt, p);
    const ks = Object.keys(ECACHE); if (ks.length > 30) delete ECACHE[ks[0]];
    return (ECACHE[key] = T);
  }
  function ebmFlux(T, Dt) {
    const out = [];
    for (let i = 0; i < EBM.N - 1; i++) { const xp = EBM.x[i] + EBM.dx / 2; out.push([Math.asin(xp) * 180 / Math.PI, -2 * Math.PI * A_E * A_E * Dt * (1 - xp * xp) * (T[i + 1] - T[i]) / EBM.dx / 1e15]); }
    return out;
  }
  const latOf = i => Math.asin(EBM.x[i]) * 180 / Math.PI;
  function ebmSummary(T, Dt) {
    let gm = 0; for (let i = 0; i < EBM.N; i++) gm += T[i] / EBM.N;
    const F = ebmFlux(T, Dt); let pk = [0, 0]; F.forEach(f => { if (f[0] > 0 && f[1] > pk[1]) pk = f; });
    let iceLat = 90; for (let i = EBM.N - 1; i >= EBM.N / 2; i--) if (T[i] < -10) iceLat = latOf(i); else break;
    return { mean: gm, eq: (T[EBM.N / 2 - 1] + T[EBM.N / 2]) / 2, pole: T[EBM.N - 1], peak: pk[1], peakLat: pk[0], iceLat, gradient: (T[EBM.N / 2 - 1] + T[EBM.N / 2]) / 2 - T[EBM.N - 1] };
  }
  /* the measured zonal-mean surface temperature (ERA5 1991–2020, rounded), for comparison */
  const OBS_T = [[-85, -45], [-75, -30], [-65, -12], [-55, 1], [-45, 8], [-35, 15], [-25, 21], [-15, 25], [-5, 26.5], [5, 26.8], [15, 26], [25, 23], [35, 17], [45, 10], [55, 3], [65, -5], [75, -14], [85, -20]];

  /* ============================================================
     7. THE EXPERIMENT
     ============================================================ */
  const SETUPS = [
    { value: 'convection', label: 'Heat one end of a tank', teaches: ['E2.1'] },
    { value: 'cells', label: 'Three cells and the prevailing winds', teaches: ['E2.2'] },
    { value: 'coriolis', label: 'A puck on a turntable', teaches: ['E2.3'] },
    { value: 'currents', label: 'Wind drives an ocean', teaches: ['E2.4'] },
    { value: 'density', label: 'Warm, cold, fresh, salty', teaches: ['E2.5'] },
    { value: 'heat', label: 'The planet moves its heat', teaches: ['E2.6'] }
  ];
  const is = (...a) => S => a.indexOf(S.p.setup) >= 0;
  const BASE = { setup: 'convection', power: 60, heatAt: 'end', ice: true, fluid: 'water', waterT: 20, view: 'dye', lapse: 20,
    logDay: Math.log10(24), dT: 96, sunLat: 0, rpm: 10, sense: 'ccw', speed: 1.0, aim: 0, frame: 'ceiling', scale: 'sink',
    tau: 0.1, beta: 1, logR: -6, width: 6000, TA: 20, SA: 0, TB: 20, SB: 35, Hd: 0.2, lift: true, Dt: 0.55, S0: 1361, iceAlb: true, seed: 1 };
  const SETUP_DEFAULTS = { convection: { lapse: 20 }, cells: {}, coriolis: {}, currents: {}, density: {}, heat: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const HOMES = {
    convection: { theta: -1.40, phi: 0.26, dist: 0.86, target: [0.0, 0.0, 0.18], fov: 0.66 },
    coriolis: { theta: -1.30, phi: 0.62, dist: 1.25, target: [0, 0, 0.08], fov: 0.66 },
    currents: { theta: -1.45, phi: 0.72, dist: 2.3, target: [0, 0.05, 0], fov: 0.66 },
    density: { theta: -1.42, phi: 0.25, dist: 1.0, target: [0, 0, 0.13], fov: 0.66 },
    cells: { theta: 0.3, phi: 0.25, dist: 3.5, target: [0, 0, 0], fov: 0.66 },
    heat: { theta: 0.3, phi: 0.35, dist: 3.5, target: [0, 0, 0], fov: 0.66 }
  };
  const p2 = p => ({ dayH: Math.pow(10, p.logDay), dT: p.dT, sunLat: p.sunLat });
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (!p.pre && (first ? p.setup !== BASE.setup : S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    S.t = 0; S.ts = 0;
    if (p.setup === 'convection') { S.C = convStart(p); S.hist = []; S._rec = -1; S.landQ = [0, 40, 80, 150].map(P => ({ P, C: null, u: 0, done: false })); record(S); }
    if (p.setup === 'cells') {
      S.CF = cellsOf(p2(p)); const r = rng(11 + p.seed);
      S.parcels = Array.from({ length: 360 }, () => ({ lat: Math.asin(r() * 2 - 1) * 180 / Math.PI, lon: r() * 360 - 180, trail: [] }));
    }
    if (p.setup === 'coriolis') { S.cr = crossing(p); S.tp = 0; }
    if (p.setup === 'currents') {
      S.M = stommel(p); S.B = boundary(S.M); const r = rng(5 + p.seed);
      S.tracers = Array.from({ length: 260 }, () => ({ x: r() * S.M.lam, y: r() * S.M.b }));
      S._field = null;
    }
    if (p.setup === 'density') { S.rA = rhoSW(p.SA, p.TA); S.rB = rhoSW(p.SB, p.TB); S.U = lockSpeed(S.rA, S.rB, p.Hd); S.front = 0; S.hist = [[0, 0]]; S._rec = -1; }
    if (p.setup === 'heat') { S.T = ebmSteady(p); S.T0 = ebmSteady(Object.assign({}, p, { Dt: 0 })); S.sum = ebmSummary(S.T, p.Dt); S.sum0 = ebmSummary(S.T0, 0); S.Tt = new Float64Array(EBM.N).fill(14); S.ty = 0; }
    const ck = p.setup;
    if (!S.cam || S.camKey !== ck) { const h = HOMES[p.setup]; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: h.fov }); S.cam.minDist = 0.3; S.cam.maxDist = 9; S.camKey = ck; }
  }
  function record(S) {
    const C = S.C, m = Math.floor(C.t / 5); if (m === S._rec) return; S._rec = m;
    S.hist.push([C.t, tempAt(C, 0.04, 0.12), tempAt(C, TK.L - 0.04, 0.12), C.umax * 1000, C.ice]);
    if (S.hist.length > 400) S.hist.shift();
  }
  const MAXT = 900;
  function step(S, dt) {
    const p = S.p;
    if (p.setup === 'convection') {
      if (S.C.t < MAXT) convAdvance(S.C, dt * p.lapse, p);
      record(S);
      // the landscape: four more tanks, at other powers, run in the background a little each step
      const q = S.landQ.find(x => !x.done);
      if (q) { if (!q.C) q.C = convStart(Object.assign({}, p, { power: q.P })); const pp = Object.assign({}, p, { power: q.P }); for (let k = 0; k < 8 && q.C.t < 150; k++) { convStep(q.C, 0.25, pp); if (q.C.t > 90) q.u = Math.max(q.u, q.C.umax); } if (q.C.t >= 150) { q.done = true; q.C = null; } }
    } else if (p.setup === 'cells') {
      S.ts += dt;
      const day = dt * 1.0;                // a day of the planet each second
      S.parcels.forEach(pc => {
        const w = surfaceWind(S.CF, pc.lat, p.dT), cl = Math.max(0.2, Math.cos(pc.lat * Math.PI / 180));
        pc.lon += w[0] * 86400 * day / (A_E * cl) * 180 / Math.PI; pc.lat += w[1] * 86400 * day / A_E * 180 / Math.PI;
        if (pc.lon > 180) pc.lon -= 360; if (pc.lon < -180) pc.lon += 360; pc.lat = clamp(pc.lat, -88, 88);
        pc.trail.push([pc.lat, pc.lon]); if (pc.trail.length > 10) pc.trail.shift();
      });
    } else if (p.setup === 'coriolis') {
      S.ts += dt; const cyc = S.cr.t + 0.8;
      S.tp = S.ts % cyc;
    } else if (p.setup === 'currents') {
      S.ts += dt; const M = S.M, h = dt * 86400 * 6;     // six days of ocean a second
      S.tracers.forEach(tr => {
        const V = oceanVel(M, tr.x, tr.y);
        tr.x += V[0] * h; tr.y += V[1] * h;
        if (tr.x < 2e3 || tr.x > M.lam - 2e3 || tr.y < 2e3 || tr.y > M.b - 2e3) { tr.x = clamp(tr.x, 3e3, M.lam - 3e3); tr.y = clamp(tr.y, 3e3, M.b - 3e3); }
      });
    } else if (p.setup === 'density') {
      S.ts += dt;
      const go = p.lift ? Math.max(0, S.ts - 0.5) : 0;
      S.front = Math.min(0.3, S.U * go);
      const m = Math.floor(S.ts / 0.1); if (m !== S._rec) { S._rec = m; S.hist.push([S.ts, S.front]); if (S.hist.length > 300) S.hist.shift(); }
    } else if (p.setup === 'heat') {
      // the planet settling from a uniform 14 °C, a year a second
      let left = dt * 3.156e7, h = Math.min(8000, 0.4 * EBM.C * EBM.dx * EBM.dx / Math.max(1e-6, 2 * p.Dt));
      let n = 0; while (left > 1e-6 && n < 6000 && S.ty < 15) { const hh = Math.min(h, left); S.Tt = ebmStep(S.Tt, hh, p); left -= hh; n++; }
      if (S.ty < 15) S.ty += dt;
    }
  }

  /* ============================================================
     8. THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const LIGHT = '#EAF1FF', DIM = '#9FB0CC';
  function lay(g) { const W = g.w, narrow = W < 640, cardW = narrow ? W - 20 : Math.min(380, Math.max(290, W * 0.32)); return { W, H: g.h, narrow, cardW, sw: narrow ? W : W - cardW - 24, HD: 58 }; }
  function drawStage(S, g) {
    const p = S.p, K = kit(), A = ART();
    if (!K || !A || !window.R3) return;
    const Ly = lay(g);
    if (p.setup === 'cells' || p.setup === 'heat') drawGlobe(S, g, Ly);
    else drawBench(S, g, Ly);
    cards(S, g, Ly);
    const H = headerOf(S); K.header(g, H[0], H[1], H[2]);
  }
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'convection') {
      const C = S.C, Tl = tempAt(C, 0.04, 0.12), Tr = tempAt(C, TK.L - 0.04, 0.12);
      return [(p.power > 0 ? 'Water rises over the hot plate' : 'No heat from below') + (C.ice > 0 ? ', sinks under the ice' : '') + ' — a convection cell, ' + f1(C.umax * 1000) + ' mm/s',
        'hot plate ' + p.power + ' W · ' + FLUID[p.fluid].name + ' · ' + Math.floor(C.t / 60) + ' min ' + Math.floor(C.t % 60) + ' s · ice left ' + Math.round(C.ice) + ' g',
        'thermometers: ' + f1(Tl) + ' °C by the plate, ' + f1(Tr) + ' °C by the ice · water is densest at 4 °C'];
    }
    if (p.setup === 'cells') {
      const CF = S.CF, d = Math.pow(10, p.logDay);
      return [CF.n === 1 ? 'One great cell from equator to pole — the planet turns too slowly to break it' : CF.n + ' cells in each hemisphere — the Hadley cell reaches ' + f1(CF.phH) + '°',
        'a day of ' + (d < 48 ? f1(d) + ' h' : f1(d / 24) + ' days') + ' · equator–pole ΔT ' + p.dT + ' K · the Sun overhead at ' + f1(Math.abs(p.sunLat)) + '°' + (p.sunLat >= 0 ? 'N' : 'S'),
        'Held & Hou: φ_H = √(5gHΔ/3Ω²a²) · surface wind from the turning Earth: trades, westerlies, polar easterlies'];
    }
    if (p.setup === 'coriolis') {
      const cr = S.cr;
      return [p.rpm === 0 ? 'The disc is still: the puck’s line on it is straight' : 'A straight line in the room, a curve on the disc — bent to the ' + ((p.sense === 'ccw') === true ? 'right' : 'left'),
        p.rpm + ' rpm ' + (p.sense === 'ccw' ? 'anticlockwise (like the north)' : 'clockwise (like the south)') + ' · puck ' + f2(p.speed) + ' m/s · across in ' + f2(cr.t) + ' s',
        'it lands ' + Math.abs(cr.miss * 100).toFixed(1) + ' cm from the mark it was aimed at · f = 2Ω = ' + f2(2 * p.rpm * TAU / 60) + ' s⁻¹'];
    }
    if (p.setup === 'currents') {
      const M = S.M, B = S.B;
      return [M.beta > 0 ? 'A narrow, fast current hugs the western shore — the Gulf Stream, from the wind and a round, turning Earth' : 'β = 0: the gyre is symmetric, no western current',
        'wind stress ' + f2(p.tau) + ' N/m² · basin ' + p.width + ' km · friction R = ' + Math.pow(10, p.logR).toExponential(0) + ' s⁻¹ · β = ' + p.beta.toFixed(1) + ' × Earth’s',
        'gyre carries ' + f1(B.transport) + ' Sv · fastest ' + f2(Math.abs(B.vmax)) + ' m/s, ' + Math.round(B.at / 1e3) + ' km from ' + (B.at < M.lam / 2 ? 'the west' : 'the east') + ' coast' + (M.sverdrup ? ' · Sverdrup ' + f1(M.sverdrup / 1e6) + ' Sv' : '')];
    }
    if (p.setup === 'density') {
      const hv = S.rA > S.rB ? 'A' : 'B';
      return ['Water ' + hv + ' is denser — ' + (Math.abs(S.rA - S.rB) < 0.01 ? 'they are the same: nothing moves' : 'it runs underneath at ' + (S.U * 100).toFixed(1) + ' cm/s'),
        'A: ' + p.TA + ' °C, ' + p.SA + ' g/kg → ' + S.rA.toFixed(2) + ' kg/m³ · B: ' + p.TB + ' °C, ' + p.SB + ' g/kg → ' + S.rB.toFixed(2) + ' kg/m³',
        'UNESCO equation of state · front speed ½√(g′H) · freezing point of B ' + f2(freezeT(p.SB)) + ' °C'];
    }
    const s = S.sum;
    return [p.Dt === 0 ? 'No winds, no currents: the tropics bake, the poles freeze' : 'Air and sea carry ' + f1(s.peak) + ' PW poleward — the tropics cool, the poles warm',
      'world mean ' + f1(s.mean) + ' °C · equator ' + f1(s.eq) + ' °C · pole ' + f1(s.pole) + ' °C · ice from ' + (s.iceLat < 89 ? f1(s.iceLat) + '°' : 'nowhere'),
      'without transport: equator ' + f1(S.sum0.eq) + ' °C, pole ' + f1(S.sum0.pole) + ' °C · North (1975) energy balance, D = ' + f2(p.Dt) + ' W/m²K'];
  }

  /* ---------- the benches ---------- */
  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Me = MEAS(), A = ART(), sw = Ly.sw;
    cam.fov = Ly.narrow ? 0.9 : 0.66; cam.setViewport(sw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    S._nar = Ly.narrow;
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.32 });
    if (p.setup === 'currents') benchOcean(S, F, g, Ly);
    else {
      if (Me) { Me.bench(F, -0.75, 0.75, -0.35, 0.40, { cabinet: '#A9B2BC' }); Me.tileWall(F, -0.75, 0.75, 0.40, 0, 0.8); }
      if (p.setup === 'convection') benchTank(S, F, g);
      if (p.setup === 'coriolis') benchTurntable(S, F, g);
      if (p.setup === 'density') benchLock(S, F, g);
    }
    F.render();
    if (p.setup === 'coriolis') turntableOverlay(S, g, Ly);
    if (p.setup === 'currents') oceanOverlay(S, g, Ly);
    ctx.restore();
  }
  /* the convection tank */
  function benchTank(S, F, g) {
    const p = S.p, C = S.C, A = ART(), Me = MEAS(), ctx = g.ctx, cam = S.cam;
    const z0 = 0.105, x0 = -TK.L / 2;
    // two wooden blocks carry the tank; the hot plate sits under the heated part
    const [h0, h1] = heaterSpan(p), hc = x0 + (h0 + h1) / 2;
    [[x0 + 0.03], [x0 + TK.L - 0.03]].forEach(([bx]) => { if (Math.abs(bx - hc) > 0.13) R3.box(F, [bx, 0, z0 / 2], [0.05, 0.09, z0], '#B08A5A', { shadowK: 0.6 }); });
    if (Me) Me.hotplate(F, [hc, -0.02, 0], { w: 0.17, d: 0.22, topSize: 0.14, top: 20 + p.power * 1.4, on: p.power > 0, hot: p.power > 0, set: p.power / 150 });
    const T = A.glassTank(F, [0, 0, z0], TK.L, TK.D, TK.H + 0.03, TK.H);
    const W = (x, y, z) => [x0 + x, z == null ? 0 : z, z0 + y];
    // the temperature in the mid-plane, painted as a thermal camera would see it
    if (p.view !== 'dye') {
      const key = 'conv' + Math.floor(C.t * 4);
      const img = A.raster('R:' + key + p.power + p.ice + p.heatAt + p.waterT, TK.NX, TK.NY, (i, j) => { const t = C.T[IX(i, TK.NY - 1 - j)], c = A.tempRGB(clamp(-30 + 60 * (t - p.waterT + 4) / 8, -40, 40)); return [c[0], c[1], c[2], 200]; });
      R3.texPlane(F, W(TK.L / 2, TK.H / 2, 0.002), [TK.L / 2, 0, 0], [0, 0, -TK.H / 2], img, { grid: 4, alpha: p.view === 'thermal' ? 0.85 : 0.5 });
    }
    // permanganate dye, carried by the computed flow
    if (p.view !== 'thermal') A.dots(F, W(TK.L / 2, TK.H / 2, 0), C.dye.map(d => ({ w: W(d.x, d.y, d.z * 0.7), a: clamp(0.55 - d.age / 900, 0.18, 0.55) })), '#8A1F9E', 0.0025);
    // the crystal at the start, and the ice
    if (C.t < 60) R3.sphere(F, W((h0 + h1) / 2 + 0.03, 0.004, 0), 0.004, '#5A1060', { shadow: false });
    if (C.ice > 0) { const s = 0.026 * Math.cbrt(C.ice / TK.ICE0); [-0.075, -0.045, -0.015].forEach((dx, k) => A.iceCube(F, W(TK.L + dx - 0.01, TK.H - s * 0.4, (k - 1) * 0.025), s)); }
    // thermometers at each end
    const tl = tempAt(C, 0.04, 0.12), tr = tempAt(C, TK.L - 0.04, 0.12);
    const topL = A.dipThermo(F, W(0.04, 0.06, 0.03), 0.16, tl), topR = A.dipThermo(F, W(TK.L - 0.04, 0.06, 0.03), 0.16, tr);
    if (g.labels && !S._nar) {
      R3.callout(F, topL, -40, -16, f1(tl) + ' °C', '#FFD38A', { size: 11 });
      R3.callout(F, topR, 40, -16, f1(tr) + ' °C', '#8EC9FF', { size: 11 });
      R3.callout(F, W(TK.L * 0.35, TK.H + 0.03, -TK.D / 2), -20, -36, 'glass tank, 40 × 15 cm of water', '#C9D4EA');
      R3.callout(F, [hc + 0.07, -0.12, 0.07], 40, 30, 'hot plate, ' + p.power + ' W', '#C9D4EA');
      if (C.ice > 0) R3.callout(F, W(TK.L - 0.05, TK.H + 0.01, -0.03), 46, 40, 'ice, ' + Math.round(C.ice) + ' g left', '#C9D4EA');
    }
    S._tank = T;
  }
  /* the turntable */
  function benchTurntable(S, F, g) {
    const p = S.p, A = ART(), cam = S.cam, Om = (p.sense === 'cw' ? -1 : 1) * p.rpm * TAU / 60, t = S.tp, ride = p.frame === 'riding';
    const tOn = Math.min(t, S.cr.t), ang = ride ? 0 : Om * S.ts;
    const trace = []; for (let k = 0; k <= 60; k++) trace.push(puckAt(p, tOn * k / 60).disc);
    // on the disc, the trace is fixed to the disc; seen from the room, the disc (and its trace) has turned by Ωt since the launch
    const discAng = ride ? 0 : Om * tOn + (t > S.cr.t ? Om * (t - S.cr.t) : 0);
    const TTd = A.turntable(F, [0, 0.02, 0], TT.R, discAng, { trace });
    const pk = puckAt(p, tOn), pos = ride ? pk.disc : pk.room;
    const rot = ride ? 0 : 0;
    void ang; void rot;
    const W = (x, y) => [x, y + 0.02, TTd.zt + 0.006];
    // the puck: on the disc while it crosses, then waiting at the rim where it left
    R3.cylinder(F, W(pos[0], pos[1]), add3(W(pos[0], pos[1]), [0, 0, 0.012]), 0.016, '#D8463A', { segments: 18, shadow: false });
    // the launcher: a spring plunger on a post at the rim, fixed to the room
    const lx = -TT.R * 1.02, la = p.aim * Math.PI / 180;
    const Lw = ride ? rotXY([lx, 0], -Om * tOn) : [lx, 0];
    R3.box(F, [Lw[0] - 0.05, Lw[1] + 0.02, 0.06], [0.06, 0.05, 0.12], '#5A6472', {});
    R3.cylinder(F, [Lw[0] - 0.05, Lw[1] + 0.02, 0.12], [Lw[0] - 0.05 + 0.06 * Math.cos(la), Lw[1] + 0.02 + 0.06 * Math.sin(la), 0.12], 0.008, '#C9CED6', { shadow: false });
    // the aim: where a straight line would leave the disc, marked on the room's floor ring
    const am = S.cr.aimed;
    R3.polyline(F, [W(-TT.R * 0.95, 0), W(am[0], am[1])], '#FFD38A', { dash: [6, 5], alpha: 0.55, width: 1.4 });
    if (g.labels && !S._nar) {
      R3.callout(F, W(am[0], am[1]), 30, -20, 'aimed here', '#FFD38A');
      R3.callout(F, [0, 0.02 - TT.R * 0.8, TTd.zt], -50, 40, (p.sense === 'ccw' ? 'turning anticlockwise' : 'turning clockwise') + ', ' + p.rpm + ' rpm', '#C9D4EA');
    }
    S._tt = { zt: TTd.zt, W };
  }
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const rotXY = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  function turntableOverlay(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, W = S._tt && S._tt.W; if (!W) return;
    // the launch handle: drag to aim and to set the speed
    const a = p.aim * Math.PI / 180, base = cam.project(W(-TT.R * 0.95, 0)), tip = cam.project(W(-TT.R * 0.95 + 0.05 * p.speed * Math.cos(a), 0.05 * p.speed * Math.sin(a)));
    if (base.ok && tip.ok) {
      ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      ART().arrowHead(ctx, tip.x, tip.y, Math.atan2(tip.y - base.y, tip.x - base.x), 8, '#FFFFFF'); ctx.restore();
      g.handle(tip.x, tip.y, 12, 'launch');
      S._lt = { base, perPx: 0.05 / Math.max(10, Math.hypot(tip.x - base.x, tip.y - base.y) / p.speed) };
    }
  }
  /* the lock-exchange tank */
  function benchLock(S, F, g) {
    const p = S.p, A = ART(), ctx = g.ctx, cam = S.cam, Lt = 0.60, D = 0.08, H = p.Hd, z0 = 0.0;
    const T = A.glassTank(F, [0, 0, z0 + 0.006], Lt, D, H + 0.03, H, { water: 'rgba(0,0,0,0)', waterBack: 'rgba(0,0,0,0)' });
    const heavyLeft = S.rA > S.rB, same = Math.abs(S.rA - S.rB) < 0.01, f = S.front, x0 = -Lt / 2;
    const colA = '#E0533F', colB = '#2F7FD9';
    // the two waters, drawn on the mid-plane: before the lift, each in its half; after, the dense one slides under
    F.push([0, 0.0, z0 + H / 2], () => {
      const P = (x, z) => cam.project([x, 0, z0 + 0.006 + z]);
      const poly = (pts, col) => { const q = pts.map(v => P(v[0], v[1])); if (q.some(v => !v.ok)) return; ctx.fillStyle = col; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill(); };
      const shade = c => window.RX.mix(c, '#05080F', 0.15);
      ctx.save(); ctx.globalAlpha = 0.62;
      // the interface: from the light front at the top to the dense front at the bottom, with billows where they shear
      const xmid = 0, xl = heavyLeft ? xmid - f : xmid + f, xh = heavyLeft ? xmid + f : xmid - f;
      const iface = []; const n = 40;
      for (let k = 0; k <= n; k++) {
        const s = k / n, x = xl + (xh - xl) * s, z = H * (1 - s) + (same ? 0 : Math.sin(s * 9 + S.ts * 3) * 0.006 * Math.sin(Math.PI * s) * Math.min(1, f / 0.05));
        iface.push([x, clamp(z, 0, H)]);
      }
      const L0 = [x0, 0], R0 = [x0 + Lt, 0], L1 = [x0, H], R1 = [x0 + Lt, H];
      if (same || f < 1e-4) { poly([L0, [0, 0], [0, H], L1], colA); poly([[0, 0], R0, R1, [0, H]], colB); }
      else if (heavyLeft) {          // A dense: A under; region of A is left of the interface, below it
        poly([L0, [xh, 0]].concat(iface.slice().reverse()).concat([[xl, H], L1]), shade(colA));
        poly([[xh, 0], R0, R1, [xl, H]].concat(iface.slice(1, -1)), colB);
      } else {
        poly([R0, [xh, 0]].concat(iface.slice().reverse()).concat([[xl, H], R1]), shade(colB));
        poly([[xh, 0], L0, L1, [xl, H]].concat(iface.slice(1, -1)), colA);
      }
      ctx.restore();
    }, 0.001);
    // the divider: in the slot, or lifted clear
    const up = p.lift ? clamp((S.ts - 0.1) / 0.4, 0, 1) * (H + 0.06) : 0;
    R3.box(F, [0, 0, z0 + H / 2 + 0.02 + up], [0.004, D + 0.012, H + 0.04], '#596372', { shadow: false });
    // hydrometers and thermometers, one in each end
    const sinkOf = r => clamp(0.09 - (r - 998) * 0.0022, 0.02, 0.12);
    A.hydrometer(F, [x0 + 0.06, 0.0, z0 + H], sinkOf(S.rA));
    A.hydrometer(F, [x0 + Lt - 0.06, 0.0, z0 + H], sinkOf(S.rB));
    A.dipThermo(F, [x0 + 0.12, 0.015, z0 + 0.03], H + 0.05, p.TA);
    A.dipThermo(F, [x0 + Lt - 0.12, 0.015, z0 + 0.03], H + 0.05, p.TB);
    if (g.labels && !S._nar) {
      R3.callout(F, [x0 + 0.06, 0, z0 + H + 0.06], 26, -26, 'A ' + S.rA.toFixed(1) + ' kg/m³', '#FFB3A6', { size: 10.5 });
      R3.callout(F, [x0 + Lt - 0.06, 0, z0 + H + 0.06], -26, -26, 'B ' + S.rB.toFixed(1) + ' kg/m³', '#9CC8FF', { size: 10.5 });
      R3.callout(F, [0, 0, z0 + H + 0.03 + up], 20, -36, p.lift ? 'divider lifted' : 'divider in', '#C9D4EA');
    }
  }
  /* the ocean basin: a block of sea between two coasts, coloured by the height of its surface */
  const OB = { W: 1.5, Hh: 1.15, depth: 0.10 };
  function benchOcean(S, F, g, Ly) {
    const p = S.p, M = S.M, A = ART(), ctx = g.ctx, cam = S.cam, sx = OB.W / M.lam, sy = OB.Hh / M.b;
    const Wp = (x, y, z) => [-OB.W / 2 + x * sx, -OB.Hh / 2 + y * sy, z || 0];
    // the sea floor and the water's sides
    R3.box(F, [0, 0, -OB.depth / 2], [OB.W, OB.Hh, OB.depth], '#173A5C', { shadow: false, ambient: 0.45, bias: F.GROUND });
    // the coasts: the Americas to the west, Europe and Africa to the east
    R3.box(F, [-OB.W / 2 - 0.09, 0, -0.02], [0.18, OB.Hh + 0.1, OB.depth + 0.04], '#6B7A44', { shadow: false, ambient: 0.5 });
    R3.box(F, [OB.W / 2 + 0.09, 0, -0.02], [0.18, OB.Hh + 0.1, OB.depth + 0.04], '#8A7A4E', { shadow: false, ambient: 0.5 });
    // the land itself, grassed and sandy, on top of each coast
    R3.texPlane(F, [-OB.W / 2 - 0.09, 0, 0.0005], [0.09, 0, 0], [0, OB.Hh / 2 + 0.05, 0], A.grassTex(false), { grid: 4 });
    R3.texPlane(F, [OB.W / 2 + 0.09, 0, 0.0005], [0.09, 0, 0], [0, OB.Hh / 2 + 0.05, 0], A.grassTex(false, true), { grid: 4 });
    // the surface: sea-surface height from ψ (geostrophic: η ∝ fψ), as an image, with the streamlines on it
    if (!S._field) {
      const nx = 120, ny = 90, Fd = oceanField(M, nx, ny), mx = Math.max(Math.abs(Fd.mn), Math.abs(Fd.mx)) || 1;
      S._field = A.raster('R:ocean' + [p.tau, p.beta, p.logR, p.width].join('|'), nx, ny, (i, j) => {
        const v = Fd.f[(ny - 1 - j) * nx + i] / mx, lv = v * 8, iso = Math.abs(lv - Math.round(lv)) < 0.035 && Math.abs(v) > 0.03;
        const c = A.mixc([30, 90, 150], v < 0 ? [70, 190, 210] : [40, 60, 160], Math.min(1, Math.abs(v)));
        return iso ? [150, 205, 235, 255] : [c[0], c[1], c[2], 255];
      });
    }
    R3.texPlane(F, [0, 0, 0.0005], [OB.W / 2, 0, 0], [0, -OB.Hh / 2, 0], S._field, { grid: 6, bias: F.GROUND - 1 });
    // the drifters
    A.dots(F, [0, 0, 0.002], S.tracers.map(tr => ({ w: Wp(tr.x, tr.y, 0.003), a: 0.95 })), '#F4F1E6', 0.0045, { bias: F.GROUND - 2 });
    // the wind over the sea: easterly trades in the south, westerlies in the north
    for (let k = 0; k < 7; k++) {
      const y = (k + 0.5) / 7 * M.b, tx = -Math.cos(Math.PI * y / M.b), len = 0.25 * tx * p.tau / 0.1;
      if (Math.abs(len) < 0.01) continue;
      const a = Wp(M.lam / 2 - len / sx / 2, y, 0.12), b = add3(a, [len, 0, 0]);
      R3.arrow(F, a, b, 0.006, tx > 0 ? '#F2C14E' : '#E8E8E8', { shadow: false });
    }
    if (g.labels && !S._nar) {
      R3.label(F, Wp(M.lam / 2, M.b * 0.08, 0.2), 'trade winds blow west', '#E8E8E8', { size: 10 });
      R3.label(F, Wp(M.lam / 2, M.b * 0.92, 0.2), 'westerlies blow east', '#F2C14E', { size: 10 });
      R3.label(F, [-OB.W / 2 - 0.09, -OB.Hh / 2 + 0.1, 0.05], 'west coast', '#DDE7C0', { size: 10 });
      R3.label(F, [OB.W / 2 + 0.09, -OB.Hh / 2 + 0.1, 0.05], 'east coast', '#E8DCC0', { size: 10 });
    }
    S._ob = { Wp };
  }
  function oceanOverlay(S, g, Ly) {
    const ctx = g.ctx, cam = S.cam, M = S.M, Wp = S._ob && S._ob.Wp; if (!Wp) return;
    // a scale bar of 1,000 km along the south edge, and the compass
    const a = cam.project(Wp(M.lam * 0.65, -M.b * 0.04, 0)), b = cam.project(Wp(M.lam * 0.65 + 1e6, -M.b * 0.04, 0)), n0 = cam.project(Wp(M.lam * 0.95, M.b * 0.85, 0.02)), n1 = cam.project(Wp(M.lam * 0.95, M.b * 0.97, 0.02));
    ctx.save();
    if (a.ok && b.ok) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.font = mono(10); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('1,000 km', (a.x + b.x) / 2, a.y + 4); }
    if (n0.ok && n1.ok) { ART().arrowHead(ctx, n1.x, n1.y, Math.atan2(n1.y - n0.y, n1.x - n0.x), 9, '#FFFFFF'); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(n0.x, n0.y); ctx.lineTo(n1.x, n1.y); ctx.stroke(); ctx.font = sans(11, 700); ctx.fillStyle = '#FFF'; ctx.textAlign = 'center'; ctx.fillText('N', n1.x, n1.y - 12); }
    ctx.restore();
    // drag the westerlies arrow to change the wind
    const w = cam.project(Wp(M.lam / 2, M.b * 0.79, 0.12));
    if (w.ok) { g.handle(w.x, w.y, 13, 'wind'); S._wind = { perPx: 0.002 }; }
  }

  /* ---------- the globes ---------- */
  function drawGlobe(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = ART(), cam = S.cam, E = window.EARTH, sw = Ly.sw;
    cam.fov = Ly.narrow ? 0.8 : 0.66; cam.setViewport(sw, g.h); cam.update();
    if (!E || !E.ready()) { if (E) E.load(); ctx.font = sans(13); ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.fillText(E && E.failed() ? 'the Earth image could not be loaded' : 'loading the Earth…', sw / 2, g.h / 2); return; }
    const sun = R3.norm(R3.add(R3.add(R3.norm(cam.eye), R3.scale(cam.r, -0.5)), R3.scale(cam.u, 0.4)));
    let ov = null;
    if (p.setup === 'cells') {
      const CF = S.CF;
      // cloud where air rises (the ITCZ, the polar front), clear skies where it sinks
      ov = (la) => { const c = CF.cells.find(q => la >= q.a && la <= q.b); if (!c) return [0, 0, 0, 0]; const edge = c.direct ? (c.h > 0 ? c.a : c.b) : (c.h > 0 ? c.b : c.a); const d = Math.abs(la - edge); return d < 6 ? [245, 248, 255, 0.55 * (1 - d / 6)] : [0, 0, 0, 0]; };
    } else {
      const T = S.ty < 15 ? S.Tt : S.T;
      ov = (la) => { const x = Math.sin(la * Math.PI / 180), i = clamp(Math.floor((x + 1) / 2 * EBM.N), 0, EBM.N - 1), c = A.tempRGB(T[i]); return [c[0], c[1], c[2], 0.62]; };
    }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    E.draw(ctx, cam, [0, 0, 0], 1, { spin: 0, sun, ambient: 0.35, overlay: ov, budget: Ly.narrow ? 60000 : 110000 });
    const vis = P => (cam.eye[0] - P[0]) * P[0] + (cam.eye[1] - P[1]) * P[1] + (cam.eye[2] - P[2]) * P[2] > 0.02;
    const sph = (la, lo, r) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180, R = r || 1; return [R * Math.cos(a) * Math.cos(b), R * Math.cos(a) * Math.sin(b), R * Math.sin(a)]; };
    if (p.setup === 'cells') {
      // air parcels at the surface, each with a short trail, coloured by the way the wind blows
      S.parcels.forEach(pc => {
        const P = sph(pc.lat, pc.lon, 1.01); if (!vis(P)) return;
        const w = surfaceWind(S.CF, pc.lat, p.dT), col = w[0] < -0.5 ? '#FFD38A' : w[0] > 0.5 ? '#8EC9FF' : '#E0E6F0';
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85; ctx.beginPath();
        let ok = false; pc.trail.forEach((t, k) => { const q = cam.project(sph(t[0], t[1], 1.01)); if (!q.ok) return; if (k && ok && Math.abs(t[1] - pc.trail[k - 1][1]) < 30) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); ok = true; });
        ctx.stroke(); ctx.globalAlpha = 1;
        const q = cam.project(P); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, TAU); ctx.fill();
      });
      // the cell boundaries as latitude lines, named by what the surface wind does between them
      if (g.labels && !Ly.narrow) S.CF.cells.forEach(c => {
        const mid = (c.a + c.b) / 2, w = surfaceWind(S.CF, mid, p.dT)[0], name = c.h > 0 && S.CF.n === 3 ? (c.k === 0 ? 'NE trade winds' : c.k === 1 ? 'westerlies' : 'polar easterlies') : c.h < 0 && S.CF.n === 3 ? (c.k === 0 ? 'SE trade winds' : c.k === 1 ? 'westerlies' : 'polar easterlies') : (w < 0 ? 'easterlies' : 'westerlies');
        let best = null; for (let lo = -180; lo < 180; lo += 4) { const P = sph(mid, lo); if (!vis(P)) continue; const q = cam.project(P); if (!best || q.x > best.x) best = q; }
        if (best) { ctx.font = sans(10.5, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.9)'; ctx.strokeText(name, best.x + 6, best.y); ctx.fillStyle = w < 0 ? '#FFD38A' : '#8EC9FF'; ctx.fillText(name, best.x + 6, best.y); }
      });
    } else {
      // poleward heat flow: an arrow up each side of the globe at its latitude, as thick as the flow
      const T = S.T, Fx = ebmFlux(T, p.Dt);
      [-50, -35, -20, 20, 35, 50].forEach(la => {
        const f = Fx.reduce((b, q) => Math.abs(q[0] - la) < Math.abs(b[0] - la) ? q : b, Fx[0])[1];
        if (Math.abs(f) < 0.05) return;
        for (const lo0 of [-150, -60, 30, 120]) {
          const lo = lo0 + 0, P0 = sph(la - Math.sign(la) * 6, lo, 1.02), P1 = sph(la + Math.sign(la) * 6, lo, 1.02);
          if (!vis(P0) || !vis(P1)) continue;
          const q0 = cam.project(P0), q1 = cam.project(P1);
          ctx.strokeStyle = 'rgba(255,240,220,.92)'; ctx.lineWidth = 1 + Math.abs(f) * 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
          A.arrowHead(ctx, q1.x, q1.y, Math.atan2(q1.y - q0.y, q1.x - q0.x), 5 + Math.abs(f) * 1.6, 'rgba(255,240,220,.95)');
        }
      });
    }
    ctx.restore();
  }

  /* ---------- the cards ---------- */
  function cards(S, g, Ly) {
    const p = S.p, ctx = g.ctx, K = kit(), A = ART(), W = Ly.cardW, x = g.w - W - 12;
    if (p.setup === 'convection') {
      const sl = K.cardSlot(g, S, 'Inside the water', W, { x, y: Ly.HD + 6 });
      if (!sl) return;
      const C = S.C, h = Math.round((sl.w - 20) * TK.H / TK.L) + 64;
      K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Inside the water: temperature and streamlines', sl.x + 10, sl.y + 8);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('the solver’s own field, front view · lines are paths of the water', sl.x + 10, sl.y + 24);
      const x0 = sl.x + 10, y0 = sl.y + 42, w = sl.w - 20, hh = w * TK.H / TK.L;
      // a fixed scale, 4 °C either side of where the water started, so a still tank looks still
      const tmin = p.waterT - 4, tmax = p.waterT + 4, span = 8;
      const img = A.raster('R:cv' + Math.floor(C.t * 4) + p.power + p.ice + p.heatAt + p.fluid + p.waterT, TK.NX, TK.NY, (i, j) => { const t = C.T[IX(i, TK.NY - 1 - j)], c = A.tempRGB(clamp(-30 + 60 * (t - tmin) / span, -40, 40)); return c; });
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, x0, y0, w, hh); ctx.restore();
      // streamlines: contours of ψ by marching squares
      let smx = 0; for (let k = 0; k < C.s.length; k++) smx = Math.max(smx, Math.abs(C.s[k]));
      if (smx > 1e-9) {
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.1; ctx.beginPath();
        const X = i => x0 + i / (TK.NX - 1) * w, Y = j => y0 + hh - j / (TK.NY - 1) * hh;
        for (let lev = -0.9; lev <= 0.9; lev += 0.2) {
          const L0 = lev * smx;
          for (let j = 0; j < TK.NY - 1; j++) for (let i = 0; i < TK.NX - 1; i++) {
            const a = C.s[IX(i, j)] - L0, b = C.s[IX(i + 1, j)] - L0, c = C.s[IX(i + 1, j + 1)] - L0, d = C.s[IX(i, j + 1)] - L0, pts = [];
            if ((a > 0) !== (b > 0)) pts.push([X(i + a / (a - b)), Y(j)]);
            if ((b > 0) !== (c > 0)) pts.push([X(i + 1), Y(j + b / (b - c))]);
            if ((c > 0) !== (d > 0)) pts.push([X(i + 1 - c / (c - d)), Y(j + 1)]);
            if ((d > 0) !== (a > 0)) pts.push([X(i), Y(j + 1 - d / (d - a))]);
            if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
          }
        }
        ctx.stroke();
        // which way they turn: an arrow on the strongest loop
        const top = velAt(C, TK.L / 2, TK.H * 0.85)[0];
        A.arrowHead(ctx, x0 + w / 2, y0 + hh * 0.15, top >= 0 ? 0 : Math.PI, 7, '#FFFFFF');
        A.arrowHead(ctx, x0 + w / 2, y0 + hh * 0.85, top >= 0 ? Math.PI : 0, 7, '#FFFFFF');
      }
      ctx.strokeStyle = 'rgba(200,215,240,.6)'; ctx.strokeRect(x0, y0, w, hh);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(f1(tmin) + ' °C', x0, y0 + hh + 6); ctx.textAlign = 'right'; ctx.fillText(f1(tmax) + ' °C', x0 + w, y0 + hh + 6);
      const cb = A.css(A.tempRGB(-30)), ch = A.css(A.tempRGB(30)); ctx.fillStyle = cb; ctx.fillRect(x0 + 50, y0 + hh + 8, 8, 6); ctx.fillStyle = ch; ctx.fillRect(x0 + w - 58, y0 + hh + 8, 8, 6);
      return;
    }
    if (p.setup === 'cells') {
      const sl = K.cardSlot(g, S, 'Pole to pole', W, { x, y: Ly.HD + 6 });
      if (!sl) return;
      const h = 250; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('The atmosphere, cut from pole to pole', sl.x + 10, sl.y + 8);
      const CF = S.CF, rising = CF.cells.filter(c => c.direct).map(c => c.h > 0 ? c.a : c.b);
      A.cellSection(ctx, sl.x + 10, sl.y + 22, sl.w - 20, 170, CF.cells.map(c => ({ a: c.a, b: c.b, dir: (c.direct ? 1 : -1) * (c.h > 0 ? 1 : -1), name: c.name })), { t: S.ts, names: !Ly.narrow, rising, wet: la => { const c = CF.cells.find(q => la >= q.a && la <= q.b); if (!c) return 0.5; const up = c.direct ? (c.h > 0 ? c.a : c.b) : (c.h > 0 ? c.b : c.a); return clamp(1 - Math.abs(la - up) / 14, 0, 1) * 0.9 + 0.1; } });
      ctx.font = mono(9.5); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const rows = ['warm air rises at the equator: cloud and rain', 'it sinks near ' + f1(Math.min(90, CF.phH)) + '°: dry, the great deserts', 'returning air is turned by the spinning Earth'];
      rows.forEach((r, i) => ctx.fillText(K.fitText(ctx, r, sl.w - 20), sl.x + 10, sl.y + 200 + i * 14));
      return;
    }
    if (p.setup === 'coriolis') {
      const sl = K.cardSlot(g, S, 'Does it matter?', W, { x, y: Ly.HD + 6 });
      if (!sl) return;
      const keys = Object.keys(SCALES), h = 56 + keys.length * 24 + 30; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('When does Earth’s turning steer the flow?', sl.x + 10, sl.y + 8);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('Rossby number U ÷ fL at 45°: below 1, it steers', sl.x + 10, sl.y + 24);
      const lx = v => sl.x + 120 + (Math.log10(v) + 4) / 8 * (sl.w - 140);
      ctx.strokeStyle = 'rgba(255,211,138,.7)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(lx(1), sl.y + 44); ctx.lineTo(lx(1), sl.y + 48 + keys.length * 24); ctx.stroke(); ctx.setLineDash([]);
      keys.forEach((k, i) => {
        const yy = sl.y + 46 + i * 24, r = rossby(k), sel = k === p.scale;
        ctx.font = mono(9.5, sel ? 700 : 500); ctx.fillStyle = sel ? '#FFFFFF' : DIM; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, SCALES[k].name, 112), sl.x + 10, yy + 4);
        ctx.fillStyle = r < 1 ? (sel ? '#4FD18B' : 'rgba(79,209,139,.6)') : (sel ? '#E8907F' : 'rgba(232,144,127,.5)');
        ctx.fillRect(lx(1e-4), yy + 2, Math.max(2, lx(clamp(r, 1e-4, 1e4)) - lx(1e-4)), 14);
        ctx.font = mono(9); ctx.fillStyle = '#FFFFFF'; ctx.fillText(r < 0.01 ? r.toExponential(0) : r < 10 ? r.toFixed(2) : Math.round(r).toLocaleString('en-US'), Math.min(sl.x + sl.w - 46, lx(clamp(r, 1e-4, 1e4)) + 4), yy + 4);
      });
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.fillText('steered ← 1 → not steered', lx(1), sl.y + h - 22);
      return;
    }
    if (p.setup === 'density') {
      const sl = K.cardSlot(g, S, 'Two samples', W, { x, y: Ly.HD + 6 });
      if (!sl) return;
      const rows = [['', 'A', 'B'], ['temperature', p.TA + ' °C', p.TB + ' °C'], ['salinity', p.SA + ' g/kg', p.SB + ' g/kg'], ['density ρ', S.rA.toFixed(2), S.rB.toFixed(2)], ['σ = ρ − 1000', (S.rA - 1000).toFixed(2), (S.rB - 1000).toFixed(2)], ['freezes at', f2(freezeT(p.SA)) + ' °C', f2(freezeT(p.SB)) + ' °C']];
      const h = 36 + rows.length * 20 + 24; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Two samples of water', sl.x + 10, sl.y + 8);
      rows.forEach((r, i) => { const yy = sl.y + 30 + i * 20; ctx.font = mono(10, i ? 500 : 700); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r[0], sl.x + 10, yy); ctx.textAlign = 'right'; ctx.fillStyle = i ? '#FFB3A6' : '#E0533F'; ctx.fillText(r[1], sl.x + sl.w * 0.68, yy); ctx.fillStyle = i ? '#9CC8FF' : '#2F7FD9'; ctx.fillText(r[2], sl.x + sl.w - 12, yy); });
      ctx.font = mono(10, 700); ctx.fillStyle = '#FFD38A'; ctx.textAlign = 'left'; ctx.fillText(Math.abs(S.rA - S.rB) < 0.01 ? 'equal: neither sinks' : (S.rA > S.rB ? 'A' : 'B') + ' is denser by ' + Math.abs(S.rA - S.rB).toFixed(2) + ' kg/m³ — it sinks', sl.x + 10, sl.y + h - 22);
      return;
    }
    if (p.setup === 'heat') {
      const sl = K.cardSlot(g, S, 'In and out', W, { x, y: Ly.HD + 6 });
      if (!sl) return;
      const h = 220; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Sunlight in, heat out, by latitude', sl.x + 10, sl.y + 8);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('W/m² · the gap is what winds and currents carry', sl.x + 10, sl.y + 24);
      const x0 = sl.x + 36, x1 = sl.x + sl.w - 12, y0 = sl.y + h - 26, y1 = sl.y + 46, Y = v => y0 - v / 350 * (y0 - y1), T = S.T;
      ctx.strokeStyle = 'rgba(150,165,190,.3)'; [0, 100, 200, 300].forEach(v => { ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke(); ctx.fillStyle = DIM; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(v), x0 - 4, Y(v)); });
      const bw = (x1 - x0) / EBM.N;
      for (let i = 0; i < EBM.N; i++) {
        const xi = EBM.x[i], s = 1 + EBM.S2 * P2(xi), alb = p.iceAlb && T[i] < -10 ? EBM.aIce : EBM.a0 + EBM.a2 * P2(xi), sin = p.S0 / 4 * s * (1 - alb), out = EBM.A + EBM.B * T[i];
        ctx.fillStyle = 'rgba(255,200,90,.85)'; ctx.fillRect(x0 + i * bw, Y(sin), bw * 0.5, y0 - Y(sin));
        ctx.fillStyle = 'rgba(255,110,90,.75)'; ctx.fillRect(x0 + i * bw + bw * 0.5, Y(out), bw * 0.5, y0 - Y(out));
      }
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      [['S pole', 0], ['Eq', 0.5], ['N pole', 1]].forEach(([t, f]) => ctx.fillText(t, x0 + f * (x1 - x0), y0 + 4));
      ctx.textAlign = 'left'; ctx.fillStyle = '#FFC85A'; ctx.fillText('▮ sunlight absorbed', x0, y1 - 12); ctx.fillStyle = '#FF7A5C'; ctx.fillText('▮ heat radiated', x0 + 130, y1 - 12);
    }
  }

  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'launch' && S._lt) {
      const b = S._lt.base, dx = e.x - b.x, dy = e.y - b.y;
      // the aim follows the drag's direction on screen relative to the launcher's line toward the centre
      const c = S.cam.project([0, 0.02, S._tt.zt]); if (!c.ok) return;
      const a0 = Math.atan2(c.y - b.y, c.x - b.x), a1 = Math.atan2(dy, dx);
      let d = (a1 - a0) * 180 / Math.PI; while (d > 180) d -= 360; while (d < -180) d += 360;
      p.aim = Math.round(clamp(-d, -60, 60)); p.speed = Math.round(clamp(Math.hypot(dx, dy) * S._lt.perPx / 0.05 * 1.0, 0.2, 3) * 20) / 20;
      this.setup(S); return;
    }
    if (e.id === 'wind') { p.tau = Math.round(clamp(p.tau + e.dx * 0.0012, 0, 0.3) * 200) / 200; if (e.phase !== 'move' || Math.abs(e.dx) > 0) this.setup(S); }
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     9. PLOTS, READOUTS, EQUATION
     ============================================================ */
  function keyBand(g, items, note) { const K = kit(); return K ? K.plotKey(g, items, note) : { t: 14, draw() {} }; }
  const plot1 = {
    title: S => ({ convection: 'The two thermometers and the fastest water, as it runs', cells: 'Surface wind against latitude', coriolis: 'The puck’s path, drawn on the disc', currents: 'Northward current along the middle of the basin', density: 'The two samples on a T–S diagram', heat: 'Temperature against latitude' })[S.p.setup],
    draw(S, g) {
      const p = S.p, ctx = g.ctx;
      if (p.setup === 'convection') {
        const H = S.hist, Kk = keyBand(g, [{ c: '#FF8A5C', label: 'by the plate °C' }, { c: '#7FB7F2', label: 'by the ice °C' }, { c: '#E8E8E8', label: 'fastest, mm/s', dash: [4, 3] }]);
        const tmax = Math.max(60, H.length ? H[H.length - 1][0] : 60), ts = H.flatMap(h => [h[1], h[2]]), lo = Math.floor(Math.min(...ts, 18)) - 1, hi = Math.ceil(Math.max(...ts, 22)) + 1;
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: lo, ymax: hi, xlabel: 'time (s)', ylabel: '°C', pad: { t: Kk.t, r: 40 } }).frame(); Kk.draw(P);
        const um = Math.max(5, ...H.map(h => h[3])), toY = v => lo + v / um * (hi - lo);
        P.clip(() => { P.line(H.map(h => [h[0], h[1]]), '#FF8A5C', 2.2); P.line(H.map(h => [h[0], h[2]]), '#7FB7F2', 2.2); P.line(H.map(h => [h[0], toY(h[3])]), '#E8E8E8', 1.4, [4, 3]); });
        ctx.font = mono(9); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; [0, um / 2, um].forEach(v => ctx.fillText(v.toFixed(0), P.x1 + 3, P.Y(toY(v))));
        return;
      }
      if (p.setup === 'cells') {
        const CF = S.CF, Kk = keyBand(g, [{ c: '#FFD38A', label: 'east–west wind u (− from the east)' }, { c: '#8EC9FF', label: 'north–south v', dash: [4, 3] }]);
        const P = g.Plot({ xmin: -90, xmax: 90, ymin: -12, ymax: 12, xlabel: 'latitude', ylabel: 'wind, m/s', xticks: [-90, -60, -30, 0, 30, 60, 90], xfmt: v => v === 0 ? 'Eq' : Math.abs(v) + (v > 0 ? 'N' : 'S'), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const u = [], v = []; for (let la = -89; la <= 89; la += 1) { const w = surfaceWind(CF, la, p.dT); u.push([la, w[0]]); v.push([la, w[1]]); }
        P.clip(() => { P.hline(0, 'rgba(200,210,230,.4)'); CF.cells.forEach(c => { P.vline(c.a, 'rgba(200,210,230,.25)', [2, 3]); }); P.area(u, 0, 'rgba(255,211,138,.18)'); P.line(u, '#FFD38A', 2.4); P.line(v, '#8EC9FF', 1.6, [4, 3]); });
        return;
      }
      if (p.setup === 'coriolis') {
        const cr = S.cr, Kk = keyBand(g, [{ c: '#2A6FD6', label: 'chalk line on the disc' }, { c: '#FFD38A', label: 'the aim (a straight line)', dash: [5, 4] }]);
        const P = g.Plot({ xmin: -0.34, xmax: 0.34, ymin: -0.34, ymax: 0.34, xlabel: 'x on the disc (m)', ylabel: 'y (m)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => {
          const ring = []; for (let k = 0; k <= 80; k++) ring.push([TT.R * Math.cos(k / 80 * TAU), TT.R * Math.sin(k / 80 * TAU)]); P.line(ring, 'rgba(200,210,230,.5)', 1.2);
          P.line([[-TT.R * 0.95, 0], cr.aimed], '#FFD38A', 1.4, [5, 4]); P.line(cr.pts, '#2A6FD6', 2.6);
          P.dot(cr.exit[0], cr.exit[1], 4.5, '#D8463A', '#FFFFFF');
        });
        return;
      }
      if (p.setup === 'currents') {
        const M = S.M, Kk = keyBand(g, [{ c: '#4FD1C5', label: 'v, m/s (north +)' }, { c: '#8FA3C0', label: 'β = 0 for comparison', dash: [4, 3] }]);
        const M0 = stommel(Object.assign({}, p, { beta: 0 })), xs = [], x0 = [];
        let vm = 0.05; for (let k = 1; k < 300; k++) { const x = M.lam * k / 300, v = oceanVel(M, x, M.b / 2)[1], v0 = oceanVel(M0, x, M.b / 2)[1]; xs.push([x / 1e3, v]); x0.push([x / 1e3, v0]); vm = Math.max(vm, Math.abs(v), Math.abs(v0)); }
        const P = g.Plot({ xmin: 0, xmax: M.lam / 1e3, ymin: -vm * 1.1, ymax: vm * 1.1, xlabel: 'distance from the west coast (km)', ylabel: 'current, m/s', yfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.hline(0, 'rgba(200,210,230,.4)'); P.line(x0, '#8FA3C0', 1.4, [4, 3]); P.area(xs, 0, 'rgba(79,209,197,.15)'); P.line(xs, '#4FD1C5', 2.2); });
        return;
      }
      if (p.setup === 'density') {
        const Kk = keyBand(g, [{ c: '#8FA3C0', label: 'σ lines (ρ − 1000)', dash: [3, 3] }, { c: '#E0533F', dot: true, label: 'A' }, { c: '#2F7FD9', dot: true, label: 'B' }, { c: '#B7E3FF', label: 'freezing', dash: [2, 2] }]);
        const P = g.Plot({ xmin: 0, xmax: 40, ymin: -2, ymax: 32, xlabel: 'salinity (g/kg)', ylabel: 'temperature °C', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => {
          for (let sg = -4; sg <= 30; sg += 2) {   // isopycnals: walk T for each S
            const pts = []; for (let s = 0; s <= 40; s += 0.5) { let lo = -2, hi = 40; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (rhoSW(s, m) - 1000 > sg) lo = m; else hi = m; } if (lo > -1.99 && lo < 39.9) pts.push([s, lo]); }
            if (pts.length > 1) { P.line(pts, 'rgba(143,163,192,.55)', 1, [3, 3]); const l = pts[Math.floor(pts.length * 0.8)]; P.tag(l[0], l[1], String(sg), 'rgba(170,185,210,.8)', 'left', -6); }
          }
          const fz = []; for (let s = 0; s <= 40; s += 1) fz.push([s, freezeT(s)]); P.line(fz, '#B7E3FF', 1.4, [2, 2]);
          P.line([[p.SA, p.TA], [p.SB, p.TB]], 'rgba(255,255,255,.5)', 1.2, [5, 4]);
          P.dot(p.SA, p.TA, 6, '#E0533F', '#FFFFFF'); P.dot(p.SB, p.TB, 6, '#2F7FD9', '#FFFFFF');
        });
        return;
      }
      const Kk = keyBand(g, [{ c: '#FF8A5C', label: 'with winds and currents' }, { c: '#8FA3C0', label: 'none (D = 0)', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'measured (ERA5)' }]);
      const P = g.Plot({ xmin: -90, xmax: 90, ymin: -80, ymax: 60, xlabel: 'latitude', ylabel: '°C', xticks: [-90, -60, -30, 0, 30, 60, 90], xfmt: v => v === 0 ? 'Eq' : Math.abs(v) + (v > 0 ? 'N' : 'S'), pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => {
        P.hline(-10, 'rgba(180,220,255,.35)', [2, 3]);
        P.line(Array.from(S.T0, (t, i) => [latOf(i), t]), '#8FA3C0', 1.6, [4, 3]);
        P.line(Array.from(S.T, (t, i) => [latOf(i), t]), '#FF8A5C', 2.6);
        OBS_T.forEach(o => P.dot(o[0], o[1], 3, '#FFFFFF'));
      });
    },
    hover(S, x) {
      const p = S.p;
      if (p.setup === 'convection') { const h = S.hist.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, S.hist[0]); return [{ label: 'time', value: Math.round(h[0]) + ' s' }, { label: 'by the plate', value: f2(h[1]) + ' °C' }, { label: 'by the ice', value: f2(h[2]) + ' °C' }, { label: 'fastest', value: f1(h[3]) + ' mm/s' }]; }
      if (p.setup === 'cells') { const w = surfaceWind(S.CF, x, p.dT); return [{ label: 'latitude', value: f1(x) + '°' }, { label: 'u', value: f1(w[0]) + ' m/s' }, { label: 'v', value: f1(w[1]) + ' m/s' }]; }
      if (p.setup === 'currents') { const v = oceanVel(S.M, x * 1e3, S.M.b / 2)[1]; return [{ label: 'from the west', value: Math.round(x) + ' km' }, { label: 'current', value: v.toFixed(3) + ' m/s' }]; }
      if (p.setup === 'density') return [{ label: 'salinity', value: f1(x) + ' g/kg' }, { label: 'ρ at ' + p.TA + ' °C', value: rhoSW(x, p.TA).toFixed(2) }];
      if (p.setup === 'heat') { const i = clamp(Math.floor((Math.sin(x * Math.PI / 180) + 1) / 2 * EBM.N), 0, EBM.N - 1); return [{ label: 'latitude', value: f1(x) + '°' }, { label: 'with transport', value: f1(S.T[i]) + ' °C' }, { label: 'without', value: f1(S.T0[i]) + ' °C' }]; }
      return [{ label: 'x', value: x.toFixed(3) + ' m' }];
    }
  };
  const plot2 = {
    title: S => ({ convection: 'Fastest water against the hot plate’s power (other tanks, run alongside)', cells: 'How wide the Hadley cell is, against the length of the day', coriolis: 'How far it lands from its aim, against the turning rate', currents: 'Gyre transport against the wind, with β and without', density: 'Where the dense water’s front has got to', heat: 'Heat carried poleward, petawatts' })[S.p.setup],
    draw(S, g) {
      const p = S.p, ctx = g.ctx;
      if (p.setup === 'convection') {
        const Kk = keyBand(g, [{ c: '#FFFFFF', dot: true, label: 'one tank, after 90–150 s' }, { c: '#FF8A5C', dot: true, label: 'this tank now' }]);
        const P = g.Plot({ xmin: 0, xmax: 160, ymin: 0, ymax: 20, xlabel: 'hot plate (W)', ylabel: 'fastest water, mm/s', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { const pts = S.landQ.filter(q => q.done).map(q => [q.P, q.u * 1000]); if (pts.length > 1) P.line(pts, 'rgba(255,255,255,.6)', 1.4); pts.forEach(q => P.dot(q[0], q[1], 4, '#FFFFFF')); P.dot(p.power, S.C.umax * 1000, 5, '#FF8A5C', '#FFFFFF'); });
        P.tag(4, 18.5, S.landQ.filter(q => q.done).length + ' of 4 tanks run', '#9FB0CC', 'left', 0);
        return;
      }
      if (p.setup === 'cells') {
        const Kk = keyBand(g, [{ c: '#FF8A5C', label: 'Held–Hou φ_H' }, { c: '#FFFFFF', dot: true, label: 'this planet' }, { c: '#8FA3C0', dot: true, label: 'Earth, Mars, Venus, Titan' }]);
        const P = g.Plot({ xmin: 0, xmax: 3.4, ymin: 0, ymax: 90, xlabel: 'length of day (log: 1 h … 100 days)', ylabel: 'Hadley edge °', xticks: [0, 1, 1.38, 2, 3], xfmt: v => v === 1.38 ? '24 h' : Math.pow(10, v) < 48 ? Math.round(Math.pow(10, v)) + ' h' : Math.round(Math.pow(10, v) / 24) + ' d', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const pts = []; for (let lv = 0; lv <= 3.4; lv += 0.02) pts.push([lv, Math.min(90, hadleyLat(Math.pow(10, lv), p.dT))]);
        P.clip(() => { P.line(pts, '#FF8A5C', 2.4); [['Earth', 24.0], ['Mars', 24.6], ['Titan', 383], ['Venus', 2802]].forEach(([n, d]) => { const v = Math.min(90, hadleyLat(d, p.dT)); P.dot(Math.log10(d), v, 3.5, '#8FA3C0'); P.tag(Math.log10(d), v, n, '#AEBBD3', 'left', -8); }); P.dot(p.logDay, Math.min(90, S.CF.phH), 5.5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'coriolis') {
        const Kk = keyBand(g, [{ c: '#2A6FD6', label: 'miss, cm (− to the right)' }, { c: '#FFFFFF', dot: true, label: 'this run' }]);
        const pts = []; for (let r = 0; r <= 30; r += 0.5) pts.push([r, crossing(Object.assign({}, p, { rpm: r })).miss * 100]);
        const ys = pts.map(q => q[1]), lo = Math.min(-5, ...ys), hi = Math.max(5, ...ys);
        const P = g.Plot({ xmin: 0, xmax: 30, ymin: lo, ymax: hi, xlabel: 'turntable, rpm', ylabel: 'lands off its aim, cm', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.hline(0, 'rgba(200,210,230,.4)'); P.line(pts, '#2A6FD6', 2.4); P.dot(p.rpm, S.cr.miss * 100, 5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'currents') {
        const Kk = keyBand(g, [{ c: '#4FD1C5', label: 'gyre transport (Sv)' }, { c: '#FFD38A', label: 'Sverdrup τ₀πλ/ρβb', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'this run' }]);
        const pts = [], sv = []; for (let t = 0; t <= 0.3; t += 0.015) { const pp = Object.assign({}, p, { tau: t }), M = stommel(pp); pts.push([t, boundary(M).transport]); if (M.sverdrup != null) sv.push([t, M.sverdrup / 1e6]); }
        const hi = Math.max(10, ...pts.map(q => q[1]), ...sv.map(q => q[1])) * 1.1;
        const P = g.Plot({ xmin: 0, xmax: 0.3, ymin: 0, ymax: hi, xlabel: 'wind stress τ₀ (N/m²)', ylabel: 'transport, Sv', xfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { if (sv.length) P.line(sv, '#FFD38A', 1.6, [4, 3]); P.line(pts, '#4FD1C5', 2.4); P.dot(p.tau, S.B.transport, 5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'density') {
        const Kk = keyBand(g, [{ c: '#FFD38A', label: 'front position' }, { c: '#8FA3C0', label: '½√(g′H) · t', dash: [4, 3] }]);
        const P = g.Plot({ xmin: 0, xmax: Math.max(4, S.ts), ymin: 0, ymax: 0.32, xlabel: 'time (s)', ylabel: 'front from the lock (m)', yfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { const t0 = 0.5, pred = [[t0, 0], [t0 + 0.3 / Math.max(1e-6, S.U), 0.3]]; if (S.U > 0 && p.lift) P.line(pred, '#8FA3C0', 1.4, [4, 3]); P.line(S.hist, '#FFD38A', 2.4); });
        return;
      }
      const Kk = keyBand(g, [{ c: '#FF8A5C', label: 'carried by air and sea (model)' }, { c: '#FFFFFF', dot: true, label: 'measured peak 5.8 PW (Trenberth & Caron)' }]);
      const Fx = ebmFlux(S.T, p.Dt), hi = Math.max(7, ...Fx.map(q => Math.abs(q[1])) ) * 1.1;
      const P = g.Plot({ xmin: -90, xmax: 90, ymin: -hi, ymax: hi, xlabel: 'latitude', ylabel: 'northward, PW', xticks: [-90, -60, -30, 0, 30, 60, 90], xfmt: v => v === 0 ? 'Eq' : Math.abs(v) + (v > 0 ? 'N' : 'S'), pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => { P.hline(0, 'rgba(200,210,230,.4)'); P.area(Fx, 0, 'rgba(255,138,92,.18)'); P.line(Fx, '#FF8A5C', 2.4); P.dot(35, 5.8, 4, '#FFFFFF'); P.dot(-35, -5.8, 4, '#FFFFFF'); });
    },
    hover(S, x) {
      const p = S.p;
      if (p.setup === 'coriolis') return [{ label: 'rpm', value: f1(x) }, { label: 'miss', value: f1(crossing(Object.assign({}, p, { rpm: clamp(x, 0, 30) })).miss * 100) + ' cm' }];
      if (p.setup === 'cells') return [{ label: 'day', value: f1(Math.pow(10, x)) + ' h' }, { label: 'Hadley edge', value: f1(Math.min(90, hadleyLat(Math.pow(10, x), p.dT))) + '°' }];
      if (p.setup === 'heat') { const Fx = ebmFlux(S.T, p.Dt), q = Fx.reduce((b, v) => Math.abs(v[0] - x) < Math.abs(b[0] - x) ? v : b, Fx[0]); return [{ label: 'latitude', value: f1(q[0]) + '°' }, { label: 'northward', value: f2(q[1]) + ' PW' }]; }
      return [{ label: 'x', value: f2(x) }];
    }
  };

  function readouts(S) {
    const p = S.p;
    if (p.setup === 'convection') {
      const C = S.C, Tl = tempAt(C, 0.04, 0.12), Tr = tempAt(C, TK.L - 0.04, 0.12), Tt = tempAt(C, TK.L / 2, 0.13), Tb = tempAt(C, TK.L / 2, 0.02);
      return [
        { label: 'Time', value: Math.floor(C.t / 60) + ':' + String(Math.floor(C.t % 60)).padStart(2, '0'), unit: 'min:s' },
        { label: 'Thermometer by the plate', value: f2(Tl), unit: '°C' },
        { label: 'Thermometer by the ice', value: f2(Tr), unit: '°C' },
        { label: 'Fastest water', value: f1(C.umax * 1000), unit: 'mm/s', flag: 'accent' },
        { label: 'Top − bottom, mid-tank', value: (Tt - Tb >= 0 ? '+' : '') + f2(Tt - Tb), unit: '°C', hint: 'warm water floats' },
        { label: 'Heat put in', value: (C.heatIn / 1000).toFixed(1), unit: 'kJ' },
        { label: 'Ice left', value: Math.round(C.ice), unit: 'g' },
        { label: 'Water’s expansion α at 20 °C', value: (alphaW(20) * 1e4).toFixed(2) + ' × 10⁻⁴', unit: '/K' },
        { label: 'Rayleigh number gαΔT·H³/νκ', value: rayleigh(Math.max(0.01, Math.abs(Tl - Tr)), 20).toExponential(1), unit: '', hint: 'above ~10³ it must overturn' }
      ];
    }
    if (p.setup === 'cells') {
      const CF = S.CF, Om = TAU / (Math.pow(10, p.logDay) * 3600);
      return [
        { label: 'Length of day', value: f1(Math.pow(10, p.logDay)), unit: 'h' },
        { label: 'Hadley edge φ_H', value: f1(Math.min(90, CF.phH)), unit: '°', flag: 'accent' },
        { label: 'Cells in each hemisphere', value: String(CF.n), unit: '' },
        { label: 'Trade winds at 15°', value: f1(surfaceWind(CF, 15 + CF.shift, p.dT)[0]), unit: 'm/s', hint: '− blows from the east' },
        { label: 'Wind at 45°', value: f1(surfaceWind(CF, 45, p.dT)[0]), unit: 'm/s' },
        { label: 'High wind at the Hadley edge, Ωa sin²φ/cos φ', value: CF.phH < 89 ? Math.round(uM(Om, CF.phH)).toString() : '—', unit: 'm/s', hint: 'eddies cut it to ~40 m/s' },
        { label: 'Rain belt (ITCZ)', value: f1(Math.abs(CF.shift)) + '°' + (CF.shift >= 0 ? 'N' : 'S'), unit: '' },
        { label: 'Coriolis f at 45°', value: (2 * Om * Math.sin(Math.PI / 4)).toExponential(2), unit: 's⁻¹' }
      ];
    }
    if (p.setup === 'coriolis') {
      const cr = S.cr, Om = p.rpm * TAU / 60;
      return [
        { label: 'Turning rate Ω', value: f2(Om), unit: 'rad/s' },
        { label: 'Coriolis parameter f = 2Ω', value: f2(2 * Om), unit: 's⁻¹' },
        { label: 'Time across the disc', value: f2(cr.t), unit: 's' },
        { label: 'Lands off its aim', value: f1(Math.abs(cr.miss) * 100), unit: 'cm ' + (cr.miss < 0 ? 'right' : cr.miss > 0 ? 'left' : ''), flag: 'accent' },
        { label: 'The disc turns meanwhile', value: f1(Math.abs(Om * cr.t) * 180 / Math.PI), unit: '°' },
        { label: 'Coriolis acceleration 2Ωv', value: f2(2 * Om * p.speed), unit: 'm/s²' },
        { label: 'Rossby number: ' + SCALES[p.scale].name, value: rossby(p.scale) < 0.01 ? rossby(p.scale).toExponential(1) : rossby(p.scale).toPrecision(3), unit: rossby(p.scale) < 1 ? 'steered' : 'not steered' },
        { label: 'Earth’s f at 45°', value: coriolisF(45).toExponential(2), unit: 's⁻¹' }
      ];
    }
    if (p.setup === 'currents') {
      const M = S.M, B = S.B;
      return [
        { label: 'Wind stress τ₀', value: f2(p.tau), unit: 'N/m²' },
        { label: 'Gyre transport', value: f1(B.transport), unit: 'Sv', flag: 'accent', hint: '1 Sv = 10⁶ m³/s' },
        { label: 'Sverdrup τ₀πλ/(ρβb)', value: M.sverdrup ? f1(M.sverdrup / 1e6) : '—', unit: 'Sv' },
        { label: 'Fastest current', value: f2(Math.abs(B.vmax)), unit: 'm/s' },
        { label: 'It runs', value: Math.round(B.at / 1e3) + ' km from the ' + (B.at < M.lam / 2 ? 'west' : 'east'), unit: '' },
        { label: 'Western current width R/β', value: M.delta ? Math.round(M.delta / 1e3).toString() : '—', unit: 'km' },
        { label: 'Interior drift at mid-basin', value: (oceanVel(M, M.lam / 2, M.b / 2)[1] * 100).toFixed(2), unit: 'cm/s' },
        { label: 'β = df/dy', value: (M.beta * 1e11).toFixed(1) + ' × 10⁻¹¹', unit: '/(m·s)' }
      ];
    }
    if (p.setup === 'density') {
      const gp = G * Math.abs(S.rA - S.rB) / Math.min(S.rA, S.rB);
      return [
        { label: 'ρ of A', value: S.rA.toFixed(2), unit: 'kg/m³' },
        { label: 'ρ of B', value: S.rB.toFixed(2), unit: 'kg/m³' },
        { label: 'Difference', value: Math.abs(S.rA - S.rB).toFixed(2), unit: 'kg/m³', flag: 'accent' },
        { label: 'Reduced gravity g′ = gΔρ/ρ', value: (gp * 100).toFixed(2), unit: 'cm/s²' },
        { label: 'Front speed ½√(g′H)', value: (S.U * 100).toFixed(1), unit: 'cm/s' },
        { label: 'Front has run', value: (S.front * 100).toFixed(1), unit: 'cm' },
        { label: 'Sinks', value: Math.abs(S.rA - S.rB) < 0.01 ? 'neither' : S.rA > S.rB ? 'A' : 'B', unit: '' },
        { label: 'B freezes at', value: f2(freezeT(p.SB)), unit: '°C' }
      ];
    }
    const s = S.sum;
    return [
      { label: 'World mean', value: f1(s.mean), unit: '°C', flag: 'accent' },
      { label: 'Equator', value: f1(s.eq), unit: '°C' },
      { label: 'North Pole', value: f1(s.pole), unit: '°C' },
      { label: 'Equator − pole', value: f1(s.gradient), unit: '°C', hint: 'without transport ' + f1(S.sum0.gradient) },
      { label: 'Peak poleward flow', value: f2(s.peak), unit: 'PW', hint: 'measured 5.8 PW' },
      { label: 'At latitude', value: s.peak > 0 ? f1(s.peakLat) + '°' : '—', unit: '' },
      { label: 'Ice edge (T < −10 °C)', value: s.iceLat < 89 ? f1(s.iceLat) + '°' : 'no ice', unit: '' },
      { label: 'Sunlight S₀', value: String(p.S0), unit: 'W/m²' }
    ];
  }
  const { E } = L;
  function equation(S) {
    const p = S.p;
    if (p.setup === 'convection') { const C = S.C, Tl = tempAt(C, 0.04, 0.12); return E.v('ρ') + '(' + f1(Tl) + ' °C) = ' + E.n(rhoSW(0, Tl).toFixed(3)) + ' &nbsp; ' + E.v('ρ') + '(4 °C) = 999.975 kg/m³ &nbsp; buoyancy ' + E.v('b') + ' = −' + E.v('g') + E.frac('ρ − ρ₀', 'ρ₀') + ' → <b>warm water rises</b>'; }
    if (p.setup === 'cells') return E.v('φ') + E.sub('H') + ' = √(' + E.frac('5' + E.v('gH') + 'Δ', '3Ω²' + E.v('a') + '²') + ') = √(' + E.frac('5 × 9.81 × 10⁴ × ' + (p.dT / 288).toFixed(3), '3 × (' + (TAU / (Math.pow(10, p.logDay) * 3600) * 1e5).toFixed(2) + '×10⁻⁵)² × (6.371×10⁶)²') + ') = <b>' + f1(Math.min(90, S.CF.phH)) + '°</b>';
    if (p.setup === 'coriolis') { const Om = p.rpm * TAU / 60; return 'miss ≈ ' + E.v('R') + 'Ω' + E.v('t') + ' = 0.30 × ' + f2(Om) + ' × ' + f2(S.cr.t) + ' = ' + E.n((0.3 * Om * S.cr.t * 100).toFixed(1) + ' cm') + ' &nbsp; (exact: <b>' + f1(Math.abs(S.cr.miss) * 100) + ' cm</b>)'; }
    if (p.setup === 'currents') { const M = S.M; return E.v('R') + '∇²ψ + β' + E.frac('∂ψ', '∂x') + ' = ' + E.frac('curl τ', 'ρ') + ' &nbsp; Sverdrup: ' + E.frac('τ₀πλ', 'ρβb') + ' = ' + (M.sverdrup ? E.n(f1(M.sverdrup / 1e6) + ' Sv') : '— (β = 0)') + ' &nbsp; width ' + E.v('R') + '/β = <b>' + (M.delta ? Math.round(M.delta / 1e3) + ' km' : '∞') + '</b>'; }
    if (p.setup === 'density') { const gp = G * Math.abs(S.rA - S.rB) / Math.min(S.rA, S.rB); return E.v('U') + ' = ½√(' + E.v('g′H') + ') = ½√(' + (gp).toFixed(4) + ' × ' + p.Hd.toFixed(2) + ') = <b>' + (S.U * 100).toFixed(1) + ' cm/s</b>'; }
    const s = S.sum; return E.v('F') + ' = −2π' + E.v('a') + '²' + E.v('D') + '(1 − ' + E.v('x') + '²)' + E.frac('∂T', '∂x') + ' → peak ' + E.n(f2(s.peak) + ' PW') + ' at ' + f1(s.peakLat) + '° &nbsp; (measured 5.8 PW)';
  }
  const EQ_NOTE = S => ({
    convection: '<b>Heat does not rise; warm water does</b> — because it is less dense, and gravity pulls the denser water under it. Water is odd: it is densest at 4 °C, so water cooled by the ice below 4 °C stops sinking. The solver uses eddy-mixed ν and κ (a 6 mm grid cannot resolve the smallest swirls), so its speeds are those of a gentle classroom tank, not a turbulent one.',
    cells: '<b>The cells are not drawn in; they come from two numbers.</b> Heating unequal by latitude drives air up at the equator; the turning Earth limits how far poleward it can go before it spins too fast (angular momentum). Held–Hou is the simplest theory of that limit; the real Ferrel cell is driven by storms, which the model takes as given.',
    coriolis: '<b>The Coriolis effect is not a force anyone pushes with.</b> The puck goes straight; the ground turns under it. Earth turns once a day, so f is only 10⁻⁴ s⁻¹: it steers hurricanes and oceans (Rossby number below 1) but not your sink, where the shape of the basin and the way it was filled win by a factor of thousands.',
    currents: '<b>Wind alone makes a symmetric gyre.</b> The Gulf Stream, Kuroshio and Brazil Current all run along western shores because the Coriolis parameter grows toward the pole (β). Stommel’s model has one layer and simple friction; real western boundary currents are narrower, faster and swirl off eddies.',
    density: '<b>Temperature and salt both decide.</b> Cold water is denser, salty water is denser — but neither always wins: warm salty Mediterranean water sinks under the cooler Atlantic. Near freezing, temperature hardly matters and salt rules, which is why the densest water on Earth forms when sea ice freezes out fresh water and leaves brine behind.',
    heat: '<b>The tropics take in more sunlight than they radiate; the poles radiate more than they take in.</b> Winds and currents carry the difference — about 5–6 PW across 35°. Turn the transport off and the equator would be over 50 °C and the poles near −60 °C. The model lumps air and sea into one diffusion; in reality the ocean carries most in the tropics, the air most at mid-latitudes.'
  })[S.p.setup];

  /* ============================================================
     10. REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6e-circulation',
    grade: 6, unit: '6E', topics: ['E2'],
    subject: 'earth',
    name: 'Circulation of Air and Ocean',
    chapter: 'Regional Climate, Organisms and Heredity',
    exams: ['NGSS MS-ESS2-6', 'NGSS Science and Engineering Practice 2: developing and using models', 'CAST'],
    weight: 'Climate',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag to look round the bench or turn the globe · drag the puck’s launch arrow · drag the westerlies to change the wind',
    lede: 'Six experiments on one idea: <b>unequal heating, a spinning Earth and the density of water move heat around the planet</b>. Heat one end of a tank and watch permanganate trace a <b>convection cell</b> computed from the fluid equations. ' +
      'Change the length of the day and see the <b>Hadley cell</b> grow or shrink (Held & Hou). Roll a puck across a <b>turntable</b>; blow wind over an ocean and watch the <b>Gulf Stream</b> appear on the west side only (Stommel); let salty and fresh water race; and run the whole planet’s <b>energy balance</b> with and without its winds and currents.',

    params: preset({}),
    presets: [
      { name: 'Hot plate at one end, ice at the other', params: preset({}) },
      { name: 'No heat, only ice', params: preset({ power: 0, ice: true }) },
      { name: 'Heat in the middle: two cells', params: preset({ heatAt: 'middle', power: 80, ice: false }) },
      { name: 'Syrup instead of water', params: preset({ fluid: 'syrup', power: 80 }) },
      { name: 'Earth: three cells', params: preset({ setup: 'cells' }) },
      { name: 'A slow planet (Venus-like): one cell', params: preset({ setup: 'cells', logDay: Math.log10(2400) }) },
      { name: 'A fast planet: many bands', params: preset({ setup: 'cells', logDay: Math.log10(6) }) },
      { name: 'July: the rain belt goes north', params: preset({ setup: 'cells', sunLat: 20 }) },
      { name: 'Turntable at 10 rpm', params: preset({ setup: 'coriolis' }) },
      { name: 'Turning clockwise (the south)', params: preset({ setup: 'coriolis', sense: 'cw', rpm: 15 }) },
      { name: 'Riding the turntable', params: preset({ setup: 'coriolis', rpm: 15, frame: 'riding' }) },
      { name: 'A fast puck hardly bends', params: preset({ setup: 'coriolis', rpm: 15, speed: 3 }) },
      { name: 'The North Atlantic gyre', params: preset({ setup: 'currents' }) },
      { name: 'No β: a symmetric gyre', params: preset({ setup: 'currents', beta: 0 }) },
      { name: 'Twice the wind', params: preset({ setup: 'currents', tau: 0.2 }) },
      { name: 'Salty under fresh', params: preset({ setup: 'density' }) },
      { name: 'Cold fresh against warm salty', params: preset({ setup: 'density', TA: 2, SA: 34.5, TB: 25, SB: 36.5 }) },
      { name: 'The Mediterranean outflow', params: preset({ setup: 'density', TA: 13, SA: 38.4, TB: 11, SB: 35.6 }) },
      { name: 'Brine under sea ice', params: preset({ setup: 'density', TA: -1.9, SA: 34.0, TB: -1.9, SB: 34.6 }) },
      { name: 'Today’s planet', params: preset({ setup: 'heat' }) },
      { name: 'Switch off every wind and current', params: preset({ setup: 'heat', Dt: 0 }) },
      { name: 'A world with twice the transport', params: preset({ setup: 'heat', Dt: 1.1 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The tank', when: is('convection'), items: [
        { key: 'power', label: 'Hot plate', min: 0, max: 150, step: 5, unit: 'W', restructure: R_ },
        { key: 'heatAt', type: 'select', label: 'Under', restructure: R_, options: [{ value: 'end', label: 'one end' }, { value: 'middle', label: 'the middle' }] },
        { key: 'ice', type: 'toggle', label: 'Ice cubes at the far end', restructure: R_ },
        { key: 'fluid', type: 'select', label: 'Fill with', restructure: R_, options: [{ value: 'water', label: 'water' }, { value: 'syrup', label: 'sugar syrup (10 × as viscous)' }] },
        { key: 'waterT', label: 'Starting temperature', min: 6, max: 35, step: 1, unit: '°C', restructure: R_ },
        { key: 'view', type: 'select', label: 'See', display: true, options: [{ value: 'dye', label: 'the dye' }, { value: 'thermal', label: 'a thermal camera' }, { value: 'both', label: 'both' }] },
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 5, label: '× 5' }, { value: 20, label: '× 20' }, { value: 60, label: '× 60' }] } ] },
      { group: 'The planet', when: is('cells'), items: [
        { key: 'logDay', label: 'Length of day', min: 0.3, max: 3.4, step: 0.01, restructure: R_, fmt: v => { const d = Math.pow(10, v); return d < 48 ? d.toFixed(1) + ' h' : (d / 24).toFixed(1) + ' days'; } },
        { key: 'dT', label: 'Equator–pole heating difference', min: 20, max: 160, step: 2, unit: 'K', restructure: R_ },
        { key: 'sunLat', label: 'Sun overhead at', min: -23.4, max: 23.4, step: 0.2, unit: '°', restructure: R_, fmt: v => Math.abs(v).toFixed(1) + (v >= 0 ? 'N' : 'S') } ] },
      { group: 'The turntable', when: is('coriolis'), items: [
        { key: 'rpm', label: 'Turning rate', min: 0, max: 30, step: 0.5, unit: 'rpm', restructure: R_ },
        { key: 'sense', type: 'select', label: 'Direction', restructure: R_, options: [{ value: 'ccw', label: 'anticlockwise (north)' }, { value: 'cw', label: 'clockwise (south)' }] },
        { key: 'speed', label: 'Puck speed', min: 0.2, max: 3, step: 0.05, unit: 'm/s', restructure: R_ },
        { key: 'aim', label: 'Aim, off the centre', min: -60, max: 60, step: 1, unit: '°', restructure: R_ },
        { key: 'frame', type: 'select', label: 'Watch from', display: true, options: [{ value: 'ceiling', label: 'the ceiling (still)' }, { value: 'riding', label: 'riding the disc' }] },
        { key: 'scale', type: 'select', label: 'Compare with', display: true, options: Object.keys(SCALES).map(k => ({ value: k, label: SCALES[k].name })) } ] },
      { group: 'The ocean', when: is('currents'), items: [
        { key: 'tau', label: 'Wind stress τ₀', min: 0, max: 0.3, step: 0.005, unit: 'N/m²', restructure: R_, fmt: v => v.toFixed(3) },
        { key: 'beta', label: 'β, how fast the spin changes north', min: 0, max: 2, step: 0.1, unit: '× Earth', restructure: R_ },
        { key: 'logR', label: 'Friction R', min: -7, max: -5, step: 0.05, unit: 's⁻¹', restructure: R_, fmt: v => Math.pow(10, v).toExponential(1) },
        { key: 'width', label: 'Ocean width', min: 2000, max: 9000, step: 100, unit: 'km', restructure: R_ } ] },
      { group: 'The two waters', when: is('density'), items: [
        { key: 'TA', label: 'A: temperature', min: -2, max: 30, step: 0.5, unit: '°C', restructure: R_ },
        { key: 'SA', label: 'A: salt', min: 0, max: 40, step: 0.1, unit: 'g/kg', restructure: R_ },
        { key: 'TB', label: 'B: temperature', min: -2, max: 30, step: 0.5, unit: '°C', restructure: R_ },
        { key: 'SB', label: 'B: salt', min: 0, max: 40, step: 0.1, unit: 'g/kg', restructure: R_ },
        { key: 'Hd', label: 'Depth of water', min: 0.08, max: 0.25, step: 0.01, unit: 'm', restructure: R_ },
        { key: 'lift', type: 'toggle', label: 'Lift the divider', restructure: R_ } ] },
      { group: 'The planet’s energy', when: is('heat'), items: [
        { key: 'Dt', label: 'Heat carried by winds and currents, D', min: 0, max: 1.5, step: 0.05, unit: 'W/m²K', restructure: R_ },
        { key: 'S0', label: 'Sunlight S₀', min: 1250, max: 1450, step: 5, unit: 'W/m²', restructure: R_ },
        { key: 'iceAlb', type: 'toggle', label: 'Ice reflects sunlight', restructure: R_ } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [plot1, plot2],
    readouts,
    equation,
    eqNote: EQ_NOTE,
    problems: [
      { source: 'CAST pattern · density drives convection', params: preset({ waterT: 20 }),
        q: 'Water at 20 °C expands by about 2.07 × 10⁻⁴ of its volume for each degree. The hot plate warms a patch of it by 5 °C. By what percentage does that water get lighter, per litre?',
        predict: { label: 'Lighter by', unit: '%', tol: 0.05 },
        measure: S => (rhoSW(0, S.p.waterT) - rhoSW(0, S.p.waterT + 5)) / rhoSW(0, S.p.waterT) * 100,
        working: '5 × 2.07 × 10⁻⁴ ≈ 0.10 % by the straight-line estimate; the UNESCO equation gives 998.206 → 997.047 kg/m³, <b>0.12 %</b>, because water expands faster as it warms. A tenth of a percent is enough: the lighter water is pushed up, and denser water slides in under it.' },
      { source: 'CAST pattern · a model of the atmosphere', params: preset({ setup: 'cells', logDay: Math.log10(12) }),
        q: 'Held and Hou’s theory puts Earth’s Hadley cell edge at about 29°, and its width goes as 1 ÷ Ω. If Earth turned twice as fast — a 12-hour day — where would the edge be?',
        predict: { label: 'Hadley edge', unit: '°', tol: 0.03 },
        measure: S => S.CF.phH,
        working: 'Twice Ω, half the width: 28.8° ÷ 2 = <b>14.4°</b>. The deserts would sit near 14°, and six cells would fit between the equator and each pole — like the bands of fast-spinning Jupiter.' },
      { source: 'CAST pattern · the Coriolis effect on a turntable', params: preset({ setup: 'coriolis', rpm: 10, speed: 1, aim: 0 }),
        q: 'A puck crosses a 30 cm-radius turntable at 1 m/s, taking 0.58 s. The disc turns at 10 rpm (Ω = 1.05 rad/s). How far from the mark it was aimed at does it leave the disc?',
        predict: { label: 'Miss', unit: 'cm', tol: 0.04 },
        measure: S => Math.abs(S.cr.miss) * 100,
        working: 'While the puck crosses, the mark turns away by Ωt = 1.05 × 0.58 = 0.61 rad; along the rim that is R × 0.61 = 0.30 × 0.61 = <b>18.4 cm</b> — to the right, for an anticlockwise disc. The puck went straight; the disc moved.' },
      { source: 'CAST pattern · a wind-driven ocean', params: preset({ setup: 'currents' }),
        q: 'Wind stress τ₀ = 0.1 N/m² over an ocean λ = 6,000 km wide and b = 5,000 km long; ρ = 1,025 kg/m³, β = 2 × 10⁻¹¹ /(m·s). Sverdrup’s transport is τ₀πλ ÷ (ρβb). How much water does the gyre carry (1 Sv = 10⁶ m³/s)?',
        predict: { label: 'Transport', unit: 'Sv', tol: 0.02 },
        measure: S => S.M.sverdrup / 1e6,
        working: '0.1 × π × 6 × 10⁶ ÷ (1,025 × 2 × 10⁻¹¹ × 5 × 10⁶) = 1.885 × 10⁶ ÷ 0.1025 = <b>18.4 Sv</b> — a hundred times the flow of every river on Earth, and it all comes back north in the narrow western current.' },
      { source: 'CAST pattern · salt water and fresh', params: preset({ setup: 'density' }),
        q: 'Fresh water (998.21 kg/m³) and seawater of 35 g/kg (1,024.76 kg/m³), both 20 °C, 20 cm deep, are let go from a lock. g′ = 9.81 × 26.56 ÷ 998.21 = 0.261 m/s², and the front runs at ½√(g′H). How fast?',
        predict: { label: 'Front speed', unit: 'cm/s', tol: 0.02 },
        measure: S => S.U * 100,
        working: '½ × √(0.261 × 0.20) = ½ × 0.228 = <b>11.4 cm/s</b>. The salt water runs under the fresh along the floor; the fresh runs over the top the other way at the same speed.' },
      { source: 'CAST pattern · a world without circulation', params: preset({ setup: 'heat', Dt: 0 }),
        q: 'At the equator the ground absorbs 321 W/m² of sunlight. With no winds or currents it must radiate all of it away; it radiates 203.3 + 2.09·T W/m² at T °C. How hot must the equator get?',
        predict: { label: 'Equator', unit: '°C', tol: 0.02 },
        measure: S => S.sum0.eq,
        working: '203.3 + 2.09 T = 321 → T = (321 − 203.3) ÷ 2.09 = <b>56 °C</b>. With today’s winds and currents the equator is near 27 °C (31 °C in this model): they carry the surplus away toward the poles.' }
    ],

    walkthrough: [
      { title: '1 · Heat one end', ask: 'The hot plate warms the water at the left end. Which way will the purple dye go?', reveal: 'Up over the plate, along the surface to the far end, down under the ice and back along the floor: a <b>convection cell</b>. Warm water is less dense and is pushed up by the denser water around it; cold water sinks.', params: preset({}) },
      { title: '2 · Make it sluggish', ask: 'Fill the tank with syrup ten times as viscous. Faster or slower — and does the loop still form?', reveal: 'Slower, and broader — friction holds it back — but it still turns over. What drives it is the density difference; viscosity only resists. That is the Rayleigh number: driving over damping.', params: preset({ fluid: 'syrup', power: 80 }) },
      { title: '3 · Three cells', ask: 'Air rises at the equator and sinks at the poles. Why doesn’t one great loop go all the way?', reveal: 'Because the Earth turns. Air moving poleward keeps its spin and races east; by about 29° it can go no further and sinks — the deserts. Make the day 100 days long and <b>one cell</b> reaches the pole.', params: preset({ setup: 'cells' }) },
      { title: '4 · The puck goes straight', ask: 'On the turntable the chalk line curves. Did anything push the puck sideways?', reveal: 'No. Watch from the ceiling: the puck runs straight; the disc turns under it. Ride the disc and the same path curves — <b>to the right on an anticlockwise disc</b>, as winds do in the Northern Hemisphere.', params: preset({ setup: 'coriolis', rpm: 15, frame: 'riding' }) },
      { title: '5 · The sink myth', ask: 'Does the Coriolis effect decide which way your sink drains?', reveal: 'No. Its Rossby number is over 3,000: Earth turns once a day, a sink drains in seconds. The basin’s shape and how the water was swirling decide. Hurricanes (0.8) and oceans (0.0003) are different — big and slow, they are steered.', params: preset({ setup: 'coriolis', scale: 'sink' }) },
      { title: '6 · Why the Gulf Stream is on the west', ask: 'Trade winds and westerlies blow across the whole Atlantic. Why is the fast current only along America’s coast?', reveal: 'Set β to 0 and the gyre is symmetric. With β — the spin growing toward the pole — the slow southward drift fills the ocean and the return flow is squeezed into a current <b>R/β ≈ 50 km</b> wide on the west: Stommel’s 1948 answer.', params: preset({ setup: 'currents', beta: 0 }) },
      { title: '7 · Which water sinks?', ask: 'Cold fresh water at 2 °C or warm salty water at 25 °C, 36.5 g/kg: which is denser?', reveal: 'The cold one only if it is salty enough. Try it: 2 °C at 34.5 g/kg (1,027.6) beats 25 °C at 36.5 (1,024.5). Both temperature and salt decide — read it off the <b>T–S diagram</b>.', params: preset({ setup: 'density', TA: 2, SA: 34.5, TB: 25, SB: 36.5 }) },
      { title: '8 · Switch the circulation off', ask: 'If no wind blew and no current flowed, how hot would the equator be?', reveal: 'About 56 °C, and the poles near −64 °C. Winds and oceans carry about <b>5 PW</b> poleward and shrink that difference from 120 °C to 44 °C.', params: preset({ setup: 'heat', Dt: 0 }) }
    ],

    quiz: [
      { q: 'In the tank, the water over the hot plate rises because', options: ['it is less dense than the water around it', 'heat rises', 'the plate pushes it', 'it boils'], answer: 0, why: 'Warmed water expands; denser water around it sinks and pushes it up. “Heat rises” is shorthand that hides the cause.' },
      { q: 'The trade winds blow from the east because', options: ['air flowing toward the equator is turned west by Earth’s rotation', 'the Sun rises in the east', 'the oceans push them', 'mountains steer them'], answer: 0, why: 'The surface branch of the Hadley cell heads for the equator; the Coriolis effect turns it toward the west, so it arrives from the east.' },
      { q: 'A ball rolled across a spinning merry-go-round seems to curve. In fact it', options: ['goes straight while the platform turns', 'is pushed by a sideways force', 'speeds up', 'follows a circle in the air'], answer: 0, why: 'Seen from above, nothing pushes it. The curve is the platform turning beneath it.' },
      { q: 'Which is most strongly steered by the Coriolis effect?', options: ['an ocean gyre', 'a draining sink', 'a tornado', 'a bathtub vortex'], answer: 0, why: 'Big and slow: the gyre’s Rossby number is 0.0003. A sink’s is over 3,000.' },
      { q: 'Without winds and ocean currents, Earth’s equator would be', options: ['much hotter and the poles much colder', 'the same', 'colder', 'hotter at the poles'], answer: 0, why: 'They carry heat from where the Sun puts in more than escapes to where more escapes than comes in.' }
    ],

    notes: '<p><b>Convection.</b> Heating a fluid from below or at one side makes it less dense; gravity pulls denser fluid under it and a loop forms. The same loop, on the scale of the planet, carries warm air up at the equator and moves heat poleward.</p>' +
      '<p><b>Cells and winds.</b> The Hadley cell rises at the equator (rain, rainforests) and sinks near 30° (high pressure, deserts); the Ferrel and polar cells complete each hemisphere. The Coriolis effect turns air moving toward the equator westward (trade winds, polar easterlies) and air moving poleward eastward (westerlies).</p>' +
      '<p><b>Ocean currents.</b> Winds drag the sea surface into great gyres; the turning Earth piles the return flow against western coasts (the Gulf Stream, Kuroshio). Deep currents are driven by density: cold, salty water sinks near the poles and spreads along the ocean floor.</p>' +
      '<p><b>One system.</b> The tropics absorb more sunlight than they radiate; the poles radiate more than they absorb. Winds and currents carry about 5–6 PW across the mid-latitudes and keep both habitable.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “The Coriolis effect makes your sink drain clockwise in one hemisphere and anticlockwise in the other.” It is a thousand times too weak at that size: it steers only things that are big and last long — storms, winds, oceans. And “heat rises”: warm fluid rises because it is less dense; heat itself flows in every direction.</div>'
  });

  L.models = L.models || {};
  L.models['g6e-circulation'] = { rhoSW, freezeT, lockSpeed, TK, convStart, convStep, convRun, rayleigh, alphaW, hadleyLat, cellsOf, surfaceWind, uM, coriolisF, puckAt, crossing, rossby, SCALES, stommel, boundary, oceanVel, EBM, ebmSteady, ebmFlux, ebmSummary, OMEGA };
})(window.InsightLab);
