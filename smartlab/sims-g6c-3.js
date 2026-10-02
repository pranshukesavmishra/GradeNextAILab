/* ============================================================
   GRADE 6 · UNIT C · ENERGY, HEAT AND THERMAL SYSTEMS
   6C-3  The Heat Transfer Bench — Conduction, Convection, Radiation
   (C3.1 Energy flows hot to cold; C3.2 Conduction; C3.3 Convection;
    C3.4 Radiation; C3.5 Conductors and insulators; C3.6 Thermal equilibrium)

   Six benches, one energy ledger each:
     direction   — two blocks pressed together on a heat-flux sensor: the flow
                   always runs from the hotter to the colder, whichever side is
                   which; "cold" never flows anywhere.
     conduction  — Ingen-Housz's rods (1789): six rods of real metals and glass
                   and wood, wax beads along each, one end in a hot bath. The
                   heat equation with side losses runs on every rod; the melted
                   lengths squared come out in the ratio of the conductivities.
     convection  — a glass tank of water with a heater: a 2D Boussinesq flow
                   (vorticity–stream function) carries warm water up and dye
                   with it. Heat it from the top and nothing turns over.
     radiation   — Leslie's cube (1804): one hot cube, four faces, a thermopile
                   that reads εσ(T⁴ − T₀⁴); the thermal camera sees the same.
     materials   — why metal feels colder than wood at the same temperature
                   (contact temperature from effusivity), and the ice-melting
                   blocks: aluminium against plastic.
     equilibrium — the method of mixtures in a cup that leaks: heat lost by the
                   hot equals heat gained by the cold, and both end at one
                   temperature.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6C, MEAS, BENCH, R3, RX and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6C;
  const SIGMA = 5.670374e-8, T0K = 273.15;

  /* real room-temperature properties: k W/m·K, ρ kg/m³, c J/kg·K */
  const MAT = {
    copper: { name: 'copper', k: 401, rho: 8960, c: 385, colour: '#D2793F', eps: 0.05 },
    alu: { name: 'aluminium', k: 237, rho: 2700, c: 897, colour: '#C9D0D8', eps: 0.09 },
    brass: { name: 'brass', k: 109, rho: 8530, c: 380, colour: '#D9A441', eps: 0.06 },
    steel: { name: 'stainless steel', k: 16, rho: 8000, c: 500, colour: '#9AA3AE', eps: 0.16 },
    iron: { name: 'iron', k: 80, rho: 7870, c: 450, colour: '#7A7F88', eps: 0.3 },
    glass: { name: 'glass', k: 1.0, rho: 2500, c: 840, colour: '#BFE2F5', eps: 0.92 },
    granite: { name: 'granite', k: 2.8, rho: 2700, c: 790, colour: '#8E8A86', eps: 0.9 },
    acrylic: { name: 'acrylic plastic', k: 0.19, rho: 1180, c: 1470, colour: '#2F3744', eps: 0.9 },
    wood: { name: 'pine wood', k: 0.12, rho: 500, c: 1700, colour: '#B98A4A', eps: 0.9 },
    foam: { name: 'polystyrene foam', k: 0.033, rho: 25, c: 1300, colour: '#ECEEF0', eps: 0.9 },
    water: { name: 'water', k: 0.6, rho: 998, c: 4186, colour: '#5FA8E8', eps: 0.96 },
    skin: { name: 'skin', k: 0.37, rho: 1100, c: 3400 }
  };
  const eff = m => Math.sqrt(m.k * m.rho * m.c);                     // thermal effusivity, J/(m²·K·s^½)

  /* ============================================================
     DIRECTION — two blocks on a heat-flux sensor
     ============================================================ */
  const CONTACT = { paste: { G: 4.0, name: 'thermal paste' }, dry: { G: 0.8, name: 'dry metal on metal' }, card: { G: 0.06, name: 'a card between them' } };
  function blocksRun(o) {
    // o = { mA, TA, matA, mB, TB, matB, contact }: two lumped blocks, conductance G between, each losing to a 20 °C room
    const A = MAT[o.matA], B = MAT[o.matB], CA = o.mA * A.c, CB = o.mB * B.c, G = CONTACT[o.contact].G;
    const hA = m => 10 * 6 * Math.pow(m / 2700, 2 / 3);                           // 10 W/m²K over a cube's surface
    const LA = hA(o.mA) * 0.3, LB = hA(o.mB) * 0.3;                                 // the faces not touching, insulated base: 30 % exposed
    let TA = o.TA, TB = o.TB, Q = 0, t = 0;
    const rows = [], dt = 0.5;
    for (let i = 0; i <= 2400; i++) {
      const q = G * (TA - TB);
      if (i % 4 === 0) rows.push({ t, TA, TB, q, Q });
      TA += (-q - LA * (TA - 20)) / CA * dt; TB += (q - LB * (TB - 20)) / CB * dt; Q += q * dt; t += dt;
    }
    return { rows, CA, CB, G, Tmix: (CA * o.TA + CB * o.TB) / (CA + CB) };
  }

  /* ============================================================
     CONDUCTION — Ingen-Housz's rods: the fin equation on each rod
     ============================================================ */
  const RODS = ['copper', 'alu', 'brass', 'iron', 'steel', 'glass', 'wood'];
  const ROD = { L: 0.60, n: 121, dip: 0.03 };                        // 60 cm rods, 3 cm in the bath
  function rodsRun(o) {
    // o = { Tb, d (mm), h (W/m²K), Tw (wax melt °C), tEnd }: ρc ∂T/∂t = k ∂²T/∂x² − (hP/A)(T − Ta), T = Tb in the bath
    const d = o.d / 1000, PA = 4 / d, Ta = 20, dx = ROD.L / (ROD.n - 1), tEnd = o.tEnd || 900;
    const out = {};
    RODS.forEach(key => {
      const M = MAT[key], a = M.k / (M.rho * M.c), loss = o.h * PA / (M.rho * M.c);
      const dt = Math.min(0.5, 0.4 * dx * dx / a), T = new Float64Array(ROD.n).fill(Ta), T2 = new Float64Array(ROD.n);
      const frames = []; let t = 0, next = 0;
      const melt = () => { for (let i = ROD.n - 1; i >= 0; i--) if (T[i] >= o.Tw) return i < ROD.n - 1 ? (i + (T[i] - o.Tw) / Math.max(1e-9, T[i] - T[i + 1])) * dx : i * dx; return 0; };
      while (t <= tEnd + 1e-9) {
        if (t >= next - 1e-9) { frames.push({ t, T: Float64Array.from(T), x: melt() }); next += 5; }
        for (let i = 0; i < ROD.n; i++) {
          if (i * dx <= ROD.dip) { T2[i] = o.Tb; continue; }
          const l = T[i - 1], r = i < ROD.n - 1 ? T[i + 1] : T[i - 1];          // the far end insulated
          T2[i] = T[i] + dt * (a * (l - 2 * T[i] + r) / (dx * dx) - loss * (T[i] - Ta));
        }
        T.set(T2); t += dt;
      }
      const m = Math.sqrt(o.h * PA / M.k), xs = Math.max(0, Math.log((o.Tb - Ta) / (o.Tw - Ta)) / m) + ROD.dip;
      out[key] = { frames, xSteady: Math.min(ROD.L, xs), m };
    });
    return out;
  }
  const rodFrame = (R, t) => R.frames[clamp(Math.round(t / 5), 0, R.frames.length - 1)];

  /* ============================================================
     CONVECTION — a 2D Boussinesq tank: vorticity, stream function, temperature
     ============================================================ */
  const TANK = { W: 0.30, H: 0.18, D: 0.05, nx: 48, ny: 30 };
  const LIQS = { water: { nu: 1.0e-6, kappa: 1.43e-7, beta: 2.1e-4, name: 'water' }, glycerol: { nu: 1.1e-4, kappa: 0.95e-7, beta: 5.0e-4, name: '85 % glycerol' } };
  const NU_SGS = 3.0e-5, KAPPA_SGS = 6.0e-6;                         // the grid's own mixing: what a 6 mm grid cannot resolve
  function tankNew(o) {
    const n = TANK.nx * TANK.ny, r = rngT(o.seed || 3);
    const T = { w: new Float64Array(n), psi: new Float64Array(n), T: new Float64Array(n).fill(o.T0 == null ? 20 : o.T0), o, t: 0, heat: 0, lost: 0, dye: [] };
    for (let k = 0; k < 220; k++) T.dye.push([0.01 + r() * 0.06 + (o.pos === 'centre' ? 0.11 : o.pos === 'top' ? 0.11 : 0), 0.004 + r() * 0.02 + (o.pos === 'top' ? 0.15 : 0)]);
    return T;
  }
  function rngT(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }; }
  function heaterCells(o) {
    const nx = TANK.nx, ny = TANK.ny, cx = o.pos === 'left' ? 6 : Math.floor(nx / 2), cy = o.pos === 'top' ? ny - 3 : 1, out = [];
    for (let i = cx - 2; i <= cx + 2; i++) for (let j = cy; j <= cy + 1; j++) out.push(j * nx + i);
    return out;
  }
  function tankStep(K, dt) {
    // explicit diffusion is stable only below dx²/4ν: thick liquids take smaller steps
    const Lq0 = LIQS[K.o.liq], nu0 = Lq0.nu + NU_SGS * (K.o.liq === 'water' ? 1 : 0.2), dx0 = TANK.W / TANK.nx, dmax = 0.2 * dx0 * dx0 / nu0;
    if (dt > dmax) { const n = Math.ceil(dt / dmax); for (let i = 0; i < n; i++) tankStep1(K, dt / n); return; }
    tankStep1(K, dt);
  }
  function tankStep1(K, dt) {
    const o = K.o, Lq = LIQS[o.liq], nx = TANK.nx, ny = TANK.ny, dx = TANK.W / nx, dy = TANK.H / ny;
    const nu = Lq.nu + NU_SGS * (o.liq === 'water' ? 1 : 0.2), ka = Lq.kappa + KAPPA_SGS, gb = 9.81 * Lq.beta;
    const w = K.w, psi = K.psi, T = K.T, id = (i, j) => j * nx + i;
    // the stream function from the vorticity: ∇²ψ = −ω (SOR, ψ = 0 on the walls)
    for (let it = 0; it < 24; it++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const k = id(i, j), nw = ((psi[k - 1] + psi[k + 1]) / (dx * dx) + (psi[k - nx] + psi[k + nx]) / (dy * dy) + w[k]) / (2 / (dx * dx) + 2 / (dy * dy));
      psi[k] += 1.7 * (nw - psi[k]);
    }
    // wall vorticity (Thom): no-slip everywhere but the free top
    for (let i = 0; i < nx; i++) { w[id(i, 0)] = -2 * psi[id(i, 1)] / (dy * dy); w[id(i, ny - 1)] = 0; }
    for (let j = 0; j < ny; j++) { w[id(0, j)] = -2 * psi[id(1, j)] / (dx * dx); w[id(nx - 1, j)] = -2 * psi[id(nx - 2, j)] / (dx * dx); }
    const w2 = Float64Array.from(w), T2 = Float64Array.from(T);
    let umax = 0;
    for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const k = id(i, j), u = (psi[k + nx] - psi[k - nx]) / (2 * dy), v = -(psi[k + 1] - psi[k - 1]) / (2 * dx);
      umax = Math.max(umax, Math.hypot(u, v));
      const up = (f) => (u > 0 ? (f[k] - f[k - 1]) : (f[k + 1] - f[k])) / dx * u + (v > 0 ? (f[k] - f[k - nx]) : (f[k + nx] - f[k])) / dy * v;
      const lap = f => (f[k - 1] - 2 * f[k] + f[k + 1]) / (dx * dx) + (f[k - nx] - 2 * f[k] + f[k + nx]) / (dy * dy);
      w2[k] = w[k] + dt * (-up(w) + nu * lap(w) + gb * (T[k + 1] - T[k - 1]) / (2 * dx));
      T2[k] = T[k] + dt * (-up(T) + ka * lap(T));
    }
    // insulated side walls and floor; the free top loses heat to the room air
    for (let i = 0; i < nx; i++) { T2[id(i, 0)] = T2[id(i, 1)]; const k = id(i, ny - 1); T2[k] = T2[k - nx]; }
    for (let j = 0; j < ny; j++) { T2[id(0, j)] = T2[id(1, j)]; T2[id(nx - 1, j)] = T2[id(nx - 2, j)]; }
    const Ccell = 998 * 4186 * dx * dy * TANK.D;
    for (let i = 1; i < nx - 1; i++) { const k = id(i, ny - 2), q = 12 * dx * TANK.D * (T2[k] - 20); T2[k] -= q * dt / Ccell; K.lost += q * dt; }
    const H = heaterCells(o), per = o.P / H.length;
    H.forEach(k => { T2[k] += per * dt / Ccell; }); K.heat += o.P * dt;
    w.set(w2); T.set(T2); K.t += dt; K.umax = umax;
    // dye: carried by the flow, with a little stirring by the unresolved eddies
    const r = K.r || (K.r = rngT(9)), s = Math.sqrt(2 * NU_SGS * dt);
    K.dye.forEach(p => {
      const fi = clamp(p[0] / dx - 0.5, 1, nx - 2.001), fj = clamp(p[1] / dy - 0.5, 1, ny - 2.001), i = Math.floor(fi), j = Math.floor(fj);
      const k = id(i, j), u = (psi[k + nx] - psi[k - nx]) / (2 * dy), v = -(psi[k + 1] - psi[k - 1]) / (2 * dx);
      p[0] = clamp(p[0] + u * dt + (r() - 0.5) * s * 1.7, 0.003, TANK.W - 0.003); p[1] = clamp(p[1] + v * dt + (r() - 0.5) * s * 1.7, 0.003, TANK.H - 0.003);
    });
  }
  function tankStats(K) {
    const nx = TANK.nx, ny = TANK.ny; let top = 0, bot = 0, all = 0;
    for (let i = 1; i < nx - 1; i++) { top += K.T[(ny - 3) * nx + i]; bot += K.T[2 * nx + i]; }
    for (let k = 0; k < K.T.length; k++) all += K.T[k];
    return { top: top / (nx - 2), bot: bot / (nx - 2), mean: all / K.T.length, umax: K.umax || 0 };
  }

  /* ============================================================
     RADIATION — Leslie's cube and a thermopile
     ============================================================ */
  const FACES = { black: { name: 'matt black paint', eps: 0.95, colour: '#16181C' }, white: { name: 'white paint', eps: 0.91, colour: '#F2F2EE' }, dull: { name: 'dull aluminium', eps: 0.20, colour: '#A8AFB8' }, shiny: { name: 'polished aluminium', eps: 0.05, colour: '#E4E9EF' } };
  const LESLIE = { side: 0.10, det: 4e-4, sens: 0.11 };            // a 10 cm cube; a 2 cm × 2 cm thermopile giving 0.11 mV per mW
  function leslie(o) {
    // o = { Tw (°C), face, d (m), Troom }: the face's net radiance to the detector, as a disc source seen at distance d
    const F = FACES[o.face], T = o.Tw + T0K, Tr = (o.Troom == null ? 20 : o.Troom) + T0K;
    const M = F.eps * SIGMA * (Math.pow(T, 4) - Math.pow(Tr, 4));              // W/m² leaving net, as exitance
    const A = LESLIE.side * LESLIE.side, view = A / (Math.PI * (o.d * o.d + A / Math.PI));   // a disc of the face's area, on axis
    const P = M * view * LESLIE.det;                                            // W on the thermopile
    return { M, P, mV: P * 1000 * LESLIE.sens, view };
  }

  /* ============================================================
     MATERIALS — touch, and the ice-melting blocks
     ============================================================ */
  const contactT = (mA, TA, mB, TB) => (eff(mA) * TA + eff(mB) * TB) / (eff(mA) + eff(mB));
  const FILM = 1.0e-4;                                              // a 0.1 mm film of meltwater between the ice and the block
  function iceBlock(o) {
    // o = { mat, Troom, tEnd }: a 9 × 9 × 2 cm block at room temperature, a 10 g ice cube on its top (0 °C, 4 cm² contact);
    // 1D conduction through the block's thickness, heat flowing into the ice, air warming the block's faces
    const M = MAT[o.mat], n = 21, Lb = 0.02, dx = Lb / (n - 1), a = M.k / (M.rho * M.c), Ac = 4e-4, Ab = 0.0081, mIce = 0.010;
    const dt = Math.min(0.5, 0.4 * dx * dx / a), T = new Float64Array(n).fill(o.Troom), tEnd = o.tEnd || 1200;
    let t = 0, melted = 0, next = 0; const rows = [];
    while (t <= tEnd + 1e-9) {
      if (t >= next - 1e-9) { rows.push({ t, melted, Ttop: T[n - 1] }); next += 5; }
      if (melted >= mIce) { t += dt; continue; }
      // the top node under the ice: heat into the ice through the contact (share of the face that the cube covers)
      const T2 = Float64Array.from(T);
      for (let i = 0; i < n; i++) {
        const l = i ? T[i - 1] : T[i + 1], r = i < n - 1 ? T[i + 1] : T[i - 1];
        T2[i] = T[i] + dt * a * (l - 2 * T[i] + r) / (dx * dx);
      }
      // the ice holds the covered part of the top at 0 °C: the flux it draws is k·(T − 0)/(dx/2) over Ac
      const q = (T[n - 1] - 0) / ((dx / 2) / (M.k * Ac) + FILM / (0.6 * Ac)), Cnode = M.rho * M.c * Ab * dx / 2;
      T2[n - 1] -= q * dt / Cnode;
      const air = 8 * (Ab - Ac + 4 * 0.09 * Lb) * (o.Troom - (T[0] + T[n - 1]) / 2), Cb = M.rho * M.c * Ab * Lb;
      for (let i = 0; i < n; i++) T2[i] += air * dt / Cb;
      T.set(T2);
      melted += (q + 3 * 0.0006 * (o.Troom - 0)) * dt / 334000;                 // plus what the air hands the cube itself
      t += dt;
    }
    let tMelt = null; for (const r of rows) if (r.melted >= mIce) { tMelt = r.t; break; }
    return { rows, tMelt, mIce };
  }

  /* ============================================================
     EQUILIBRIUM — the method of mixtures in a leaky cup
     ============================================================ */
  const CUPS = { foam: { name: 'foam cup with a lid', UA: 0.05, C: 6 }, glass: { name: 'glass beaker', UA: 0.45, C: 90 }, steel: { name: 'steel mug', UA: 0.8, C: 150 } };
  function mixRun(o) {
    // o = { mH, TH, add ('cold' water | metal key), mC, TC, cup, tEnd }: two nodes stirred together (G), the cup losing to the room
    const cH = 4186, cC = o.add === 'cold' ? 4186 : MAT[o.add].c, CH = o.mH * cH + CUPS[o.cup].C, CC = o.mC * cC, G = o.add === 'cold' ? 120 : 6, UA = CUPS[o.cup].UA;
    let TH = o.TH, TC = o.TC, t = 0, lostH = 0, gainC = 0, toRoom = 0; const rows = [], dt = 0.05, tEnd = o.tEnd || 600;
    for (let i = 0; t <= tEnd + 1e-9; i++) {
      if (i % 20 === 0) rows.push({ t, TH, TC, lostH, gainC, toRoom });
      const q = G * (TH - TC), l = UA * (TH - 20);
      TH += (-q - l) / CH * dt; TC += q / CC * dt; lostH += (q + l) * dt; gainC += q * dt; toRoom += l * dt; t += dt;
    }
    return { rows, CH, CC, Tideal: (CH * o.TH + CC * o.TC) / (CH + CC) };
  }

  const MODEL0 = { MAT, eff, CONTACT, blocksRun, RODS, ROD, rodsRun, rodFrame, TANK, LIQS, tankNew, tankStep, tankStats, FACES, LESLIE, leslie, contactT, iceBlock, CUPS, mixRun, SIGMA };

  /* ============================================================
     SET-UPS, STATE
     ============================================================ */
  const SETUPS = [
    { value: 'direction', label: 'Which way does the energy go?', teaches: ['C3.1'] },
    { value: 'conduction', label: 'Ingen-Housz’s rods: conduction', teaches: ['C3.2'] },
    { value: 'convection', label: 'A tank of water: convection', teaches: ['C3.3'] },
    { value: 'radiation', label: 'Leslie’s cube: radiation', teaches: ['C3.4'] },
    { value: 'materials', label: 'Metal feels colder: conductors and insulators', teaches: ['C3.5'] },
    { value: 'equilibrium', label: 'Mix them: thermal equilibrium', teaches: ['C3.6'] }
  ];
  const BASE = {
    setup: 'conduction', view: 'eye',
    matA: 'alu', mA: 0.5, TA: 80, matB: 'copper', mB: 0.5, TB: 10, contact: 'paste',
    Tb: 95, d: 6, h: 10, wax: 58,
    P: 30, pos: 'left', liq: 'water', show: 'both',
    Tw: 90, face: 'black', dist: 0.10, Troom: 20,
    mat1: 'alu', mat2: 'acrylic', Tr: 20,
    mH: 0.1, TH: 80, add: 'cold', mC: 0.1, TC: 20, cup: 'foam'
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const is = (...v) => S => v.indexOf(S.p.setup) >= 0;
  const SPAN = { direction: { end: 1200, rate: 20 }, conduction: { end: 1800, rate: 30 }, radiation: { end: 1, rate: 0 }, materials: { end: 1200, rate: 12 }, equilibrium: { end: 600, rate: 10 } };
  const FACE_ORDER = ['black', 'white', 'dull', 'shiny'];
  const WAXES = { 34: 'cocoa butter (34 °C)', 58: 'paraffin wax (58 °C)', 63: 'beeswax (63 °C)' };

  function runOf(S) {
    const p = S.p;
    let key, f;
    if (p.setup === 'direction') { key = ['d', p.matA, p.mA, p.TA, p.matB, p.mB, p.TB, p.contact]; f = () => blocksRun({ mA: p.mA, TA: p.TA, matA: p.matA, mB: p.mB, TB: p.TB, matB: p.matB, contact: p.contact }); }
    else if (p.setup === 'conduction') { key = ['c', p.Tb, p.d, p.h, p.wax]; f = () => rodsRun({ Tb: p.Tb, d: p.d, h: p.h, Tw: p.wax, tEnd: 1800 }); }
    else if (p.setup === 'materials') { key = ['m', p.mat1, p.mat2, p.Tr]; f = () => ({ a: iceBlock({ mat: p.mat1, Troom: p.Tr, tEnd: 1200 }), b: iceBlock({ mat: p.mat2, Troom: p.Tr, tEnd: 1200 }) }); }
    else if (p.setup === 'equilibrium') { key = ['e', p.mH, p.TH, p.add, p.mC, p.TC, p.cup]; f = () => mixRun({ mH: p.mH, TH: p.TH, add: p.add, mC: p.mC, TC: p.TC, cup: p.cup, tEnd: 600 }); }
    else return null;
    key = key.join('|');
    if (S._run && S._run.key === key) return S._run.R;
    S._run = { key, R: f() }; return S._run.R;
  }
  const rowNear = (rows, t) => { let lo = 0, hi = rows.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m].t <= t) lo = m; else hi = m; } return rows[lo]; };

  function setup(S) {
    const p = S.p;
    if (p.matA === p.matB && p.mA === p.mB && p.TA === p.TB) p.TB = p.TA - 1;          // two identical blocks at one temperature teach nothing: offset one by a degree
    if (p.mat1 === p.mat2) p.mat2 = p.mat1 === 'alu' ? 'acrylic' : 'alu';
    S.ts = 0; S.ta = 0; S._run = null; S.tankRows = [];
    S.tank = p.setup === 'convection' ? tankNew({ liq: p.liq, P: p.P, pos: p.pos, seed: 3 }) : null;
    const H = { direction: { theta: -1.30, phi: 0.36, dist: 0.58, target: [0.10, 0, 0.05] }, conduction: { theta: -1.42, phi: 0.78, dist: 1.05, target: [0.24, 0.0, 0.05] }, convection: { theta: -1.52, phi: 0.12, dist: 0.62, target: [0.10, 0, 0.10] },
      radiation: { theta: -0.30, phi: 0.32, dist: 0.80, target: [0.0, -0.10, 0.07] }, materials: { theta: -1.40, phi: 0.50, dist: 0.55, target: [0.08, 0, 0.03] }, equilibrium: { theta: -1.35, phi: 0.32, dist: 0.65, target: [0.06, 0, 0.07] } }[p.setup];
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera({ theta: H.theta, phi: H.phi, dist: H.dist, target: H.target.slice(), fov: 0.72 });
      S.cam.minDist = 0.3; S.cam.maxDist = 4; S.camFor = p.setup; S._nar = null;
    }
  }
  function step(S, dt) {
    const p = S.p;
    S.ta = (S.ta || 0) + dt;
    if (p.setup === 'convection' && S.tank) {
      for (let k = 0; k < 4; k++) tankStep(S.tank, 0.1);
      const st = tankStats(S.tank); S.tankRows.push({ t: S.tank.t, top: st.top, bot: st.bot, u: st.umax }); if (S.tankRows.length > 1500) S.tankRows.shift();
      S.ts = S.tank.t; return;
    }
    const sp = SPAN[p.setup]; S.ts = Math.min(sp.end, S.ts + dt * sp.rate);
  }

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
  const fJ = J => { const a = Math.abs(J); if (a < 1e-9) return '0 J'; return a >= 1e6 ? (J / 1e6).toFixed(2) + ' MJ' : a >= 1e3 ? (J / 1e3).toFixed(a >= 1e4 ? 1 : 2) + ' kJ' : J.toFixed(a >= 100 ? 0 : 1) + ' J'; };
  const fT = s => s >= 120 ? (s / 60).toFixed(1) + ' min' : s.toFixed(0) + ' s';
  function irOf(S, lo, hi) { return S.p.view === 'ir' ? { lo, hi, room: 20 } : null; }
  function scene(S, g, x0, x1, y0, y1, ir) {
    const ctx = g.ctx, W = g.w, H = g.h, M = window.MEAS, R3 = window.R3;
    S.cam.setViewport(W, H); S.cam.update();
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, ir ? '#0A0618' : '#9FAAB6'); bg.addColorStop(1, ir ? '#120A26' : '#CDD4DA');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const F0 = R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
    if (!ir && S.cam.eye[1] < y1) M.tileWall(F0, x0 - 0.3, x1 + 0.3, y1 + 0.01, 0, 0.8);
    M.bench(F0, x0, x1, y0, y1, ir ? { cabinet: '#0E0820', tone: M.irc(ir, 20, 0.95, '#000') } : {});
    F0.render();
    return R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
  }
  /* a heat-flow arrow: width with the power, always pointing from hot to cold */
  function flowArrow(F, a, b, W, col) {
    if (Math.abs(W) < 1e-3) return;
    const R3 = window.R3, from = W > 0 ? a : b, to = W > 0 ? b : a, r = clamp(0.003 + Math.log10(1 + Math.abs(W)) * 0.004, 0.003, 0.014);
    R3.arrow(F, from, to, r, col || '#FF7A45', { bias: -0.04, vivid: true });
  }

  /* ============================================================
     THE STAGES
     ============================================================ */
  function drawDirection(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS, BENCH = window.BENCH;
    const R = runOf(S), r = rowNear(R.rows, S.ts), ir = irOf(S, Math.min(p.TA, p.TB, 15) - 5, Math.max(p.TA, p.TB, 25) + 5);
    const F = scene(S, g, -0.30, 0.42, -0.22, 0.22, ir);
    const side = m => Math.cbrt(m / 2700) * 1.0, sA = side(p.mA), sB = side(p.mB);
    // the heat-flux sensor: a thin plate between the blocks, on an insulating board
    R3.box(F, [0.06, 0, 0.006], [0.36, 0.14, 0.012], ir ? M.irc(ir, 20, 0.9, '#000') : '#ECEEF0', { shadow: false });
    const cA = [0.06 - 0.008 - sA / 2, 0, 0.012 + sA / 2], cB = [0.06 + 0.008 + sB / 2, 0, 0.012 + sB / 2];
    R3.box(F, cA, [sA, sA, sA], ir ? M.irc(ir, r.TA, MAT[p.matA].eps, '#000') : MAT[p.matA].colour, { ambient: 0.45 });
    R3.box(F, cB, [sB, sB, sB], ir ? M.irc(ir, r.TB, MAT[p.matB].eps, '#000') : MAT[p.matB].colour, { ambient: 0.45 });
    R3.box(F, [0.06, 0, 0.012 + Math.min(sA, sB) / 2], [0.016, Math.min(sA, sB) * 0.8, Math.min(sA, sB) * 0.8], ir ? M.irc(ir, (r.TA + r.TB) / 2, 0.9, '#000') : '#2A303A', { shadow: false });
    flowArrow(F, [cA[0], -0.07, 0.012 + Math.max(sA, sB) + 0.04], [cB[0], -0.07, 0.012 + Math.max(sA, sB) + 0.04], r.q, '#FF7A45');
    BENCH.meter(F, [0.27, -0.08, 0.04], [-0.3, -1, 0.35], 0.11, 0.05, { title: 'HEAT FLUX', value: (r.q >= 0 ? '→ ' : '← ') + Math.abs(r.q).toFixed(1), unit: 'W', colour: '#FFB27A', depth: 0.03 });
    co(F, [cA[0], 0, cA[2] + sA / 2], -60, -40, MAT[p.matA].name + ' ' + r.TA.toFixed(1) + ' °C', '#E8EEF8', { keep: true });
    co(F, [cB[0], 0, cB[2] + sB / 2], 50, -40, MAT[p.matB].name + ' ' + r.TB.toFixed(1) + ' °C', '#E8EEF8', { keep: true });
    F.render();
    if (ir) M.irScale(ctx, W - 36, K.HDR + 30, 12, Math.min(180, g.h * 0.4), ir.lo, ir.hi);
    const hot = r.TA > r.TB ? MAT[p.matA].name : MAT[p.matB].name, cold = r.TA > r.TB ? MAT[p.matB].name : MAT[p.matA].name;
    K.header(g, Math.abs(r.TA - r.TB) < 0.3 ? 'Both at ' + ((r.TA + r.TB) / 2).toFixed(1) + ' °C: no more flow — thermal equilibrium' : 'Energy flows from the ' + hot + ' (hotter) into the ' + cold + ' (colder): ' + Math.abs(r.q).toFixed(1) + ' W',
      'after ' + fT(r.t) + ' · ' + fJ(Math.abs(r.Q)) + ' has crossed the sensor · contact: ' + CONTACT[p.contact].name,
      'nothing called “cold” moves: the colder block warms because energy arrives');
  }
  function drawConduction(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS;
    const R = runOf(S), ir = irOf(S, 15, Math.max(100, p.Tb + 5));
    const F = scene(S, g, -0.25, 0.75, -0.24, 0.24, ir);
    A.trough(F, [-0.12, 0, 0], 0.16, 0.30, 0.12, { T: p.Tb, ir, phase: S.ta });
    const r = p.d / 2000, ys = RODS.map((_, i) => -0.13 + i * 0.043);
    const narrow = g.w < K.NARROW;
    RODS.forEach((key, i) => {
      const fr = rodFrame(R[key], S.ts), M2 = MAT[key], Lr = ROD.L - ROD.dip;
      A.waxRod(F, [-0.04, ys[i], 0.085], Lr, r, key, Array.from(fr.T).slice(Math.round(ROD.dip / ROD.L * (ROD.n - 1))), Math.max(0, fr.x - ROD.dip), { ir, eps: M2.eps, colour: M2.colour });
      R3.cylinder(F, [-0.04 - 0.04, ys[i], 0.085], [-0.04, ys[i], 0.085], r, M2.colour, { segments: 10, caps: false, shadow: false });
      if (!narrow || i % 2 === 0) R3.label(F, [-0.04 + Lr + 0.02, ys[i], 0.085], M2.name.replace('stainless ', '').replace('pine ', ''), '#E8EEF8', { size: 9, align: 'left' });
      if (!ir && fr.x > ROD.dip) R3.sphere(F, [-0.04 + fr.x - ROD.dip, ys[i], 0.085 + r + 0.003], 0.0025, '#FF7A45', { shadow: false, vivid: true, bias: -0.02 });
    });
    window.BENCH.rule(F, [-0.04, -0.19, 0.0], [1, 0, 0], 0.6, { up: [0, 1, 0], width: 0.03 });
    F.render();
    if (ir) M.irScale(ctx, W - 36, K.HDR + 30, 12, Math.min(180, g.h * 0.4), ir.lo, ir.hi);
    const cu = rodFrame(R.copper, S.ts).x - ROD.dip, st = rodFrame(R.steel, S.ts).x - ROD.dip;
    K.header(g, 'After ' + fT(S.ts) + ': the wax has melted ' + (cu * 100).toFixed(1) + ' cm along copper, ' + (st * 100).toFixed(1) + ' cm along steel',
      'bath ' + p.Tb + ' °C · rods ' + p.d + ' mm across · ' + WAXES[p.wax] + ' · air h = ' + p.h + ' W/m²K',
      'the particles of a metal hand energy along quickly; glass and wood barely let it through');
  }
  function tankImage(S) {
    const K = S.tank, p = S.p, nx = TANK.nx, ny = TANK.ny;
    const c = S._timg || (S._timg = (() => { const cv = document.createElement('canvas'); cv.width = 240; cv.height = 144; return cv; })());
    const x = c.getContext('2d'), sx = c.width / nx, sy = c.height / ny, M = window.MEAS;
    let lo = 1e9, hi = -1e9; for (let k = 0; k < K.T.length; k++) { lo = Math.min(lo, K.T[k]); hi = Math.max(hi, K.T[k]); }
    hi = Math.max(hi, lo + 0.4);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const T = K.T[j * nx + i];
      const f = (T - lo) / (hi - lo);
      x.fillStyle = p.show === 'temp' ? M.iron(f) : p.show === 'both' ? window.RX.mix('#CFE6F4', '#FF9A5A', clamp(f, 0, 1) * 0.75) : window.RX.mix('#CFE6F4', '#E8F2F8', (j / ny) * 0.4);
      x.fillRect(i * sx, (ny - 1 - j) * sy, sx + 1, sy + 1);
    }
    if (p.show !== 'temp') {
      x.fillStyle = 'rgba(120,20,110,.55)';
      K.dye.forEach(d => { x.beginPath(); x.arc(d[0] / TANK.W * c.width, c.height - d[1] / TANK.H * c.height, 2.2, 0, TAU); x.fill(); });
    }
    // the heater element
    const H = heaterCells(p); x.fillStyle = '#FF5A2A';
    H.forEach(k => { const i = k % nx, j = Math.floor(k / nx); x.fillRect(i * sx, (ny - 1 - j) * sy, sx, sy); });
    return { c, lo, hi };
  }
  function drawConvection(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS;
    const F = scene(S, g, -0.25, 0.40, -0.20, 0.20, null);
    const img = tankImage(S);
    A.glassTank(F, [0.06, 0, 0], TANK.W, TANK.H, TANK.D, img.c, {});
    R3.tube(F, [[0.06 + (p.pos === 'left' ? -0.11 : 0), 0.02, p.pos === 'top' ? 0.17 : 0.02], [0.06 + (p.pos === 'left' ? -0.11 : 0), 0.04, 0.22], [0.25, 0.06, 0.22], [0.27, 0.08, 0.004]], 0.0022, '#2A2F38', { segments: 5, round: false });
    window.BENCH.meter(F, [0.30, -0.10, 0.04], [0, -1, 0.35], 0.10, 0.05, { title: 'HEATER', value: p.P.toFixed(0), unit: 'W', colour: '#FFB27A', depth: 0.03 });
    F.render();
    if (p.show === 'temp') M.irScale(ctx, W - 36, K.HDR + 30, 12, Math.min(180, g.h * 0.4), img.lo, img.hi);
    const st = tankStats(S.tank);
    K.header(g, p.pos === 'top' ? 'Heated from the top: the warm water stays on top — almost nothing turns over' : 'Warm water rises from the heater, spreads under the surface and sinks at the far wall: convection',
      'top ' + st.top.toFixed(2) + ' °C · bottom ' + st.bot.toFixed(2) + ' °C · fastest flow ' + (st.umax * 1000).toFixed(1) + ' mm/s · ' + fJ(S.tank.heat) + ' in · t = ' + fT(S.tank.t),
      'purple dye shows the water moving; warm water is less dense and buoyancy lifts it');
  }
  function drawRadiation(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS;
    const ir = irOf(S, Math.min(p.Troom, 15) - 2, Math.max(p.Tw, 40) + 5);
    const F = scene(S, g, -0.25, 0.55, -0.40, 0.20, ir);
    const k = FACE_ORDER.indexOf(p.face), faces = [0, 1, 2, 3].map(i => FACES[FACE_ORDER[(k + i) % 4]]);
    A.leslieCube(F, [0.0, 0.0, 0], 0.10, faces, 0, { ir, T: p.Tw });
    const det = [0.0, -0.05 - p.dist, 0.062];
    A.thermopile(F, det, [0, 1, 0], {});
    const L = leslie({ Tw: p.Tw, face: p.face, d: p.dist, Troom: p.Troom });
    window.BENCH.meter(F, [0.10, -0.12 - p.dist, 0.05], [0.8, -0.6, 0.35], 0.10, 0.05, { title: 'THERMOPILE', value: L.mV.toFixed(3), unit: 'mV', colour: '#7CF0B0', depth: 0.03 });
    co(F, [0.0, -0.05, 0.07], -70, -50, faces[0].name + ' (ε ' + faces[0].eps + ')', '#E8EEF8', { keep: true });
    if (!ir) {
      // a fan of rays from the face toward the detector, as bright as the face's emission
      const a = Math.min(1, L.M / 900);
      for (let i = -2; i <= 2; i++) R3.polyline(F, [[i * 0.02, -0.052, 0.062 + (i % 2) * 0.02], [i * 0.006, -0.05 - p.dist + 0.03, 0.062]], '#FF7A45', { alpha: 0.15 + 0.6 * a, width: 1.4, bias: -0.03 });
    }
    F.render();
    if (ir) M.irScale(ctx, W - 36, K.HDR + 30, 12, Math.min(180, g.h * 0.4), ir.lo, ir.hi);
    K.header(g, 'The ' + faces[0].name + ' face at ' + p.Tw + ' °C sends ' + L.M.toFixed(0) + ' W/m² net toward the detector: ' + L.mV.toFixed(3) + ' mV',
      'εσ(T⁴ − T₀⁴): ε = ' + faces[0].eps + ' · T = ' + (p.Tw + 273.15).toFixed(1) + ' K · room ' + p.Troom + ' °C · ' + (p.dist * 100).toFixed(0) + ' cm away',
      'radiation needs no particles to carry it — and shiny metal gives out very little, whatever colour you think it is');
  }
  function drawMaterials(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3;
    const R = runOf(S), ra = rowNear(R.a.rows, S.ts), rb = rowNear(R.b.rows, S.ts);
    const F = scene(S, g, -0.25, 0.40, -0.20, 0.20, null);
    [[p.mat1, -0.03, ra, R.a], [p.mat2, 0.15, rb, R.b]].forEach(([m, x, r, Rr]) => {
      R3.box(F, [x, 0, 0.01], [0.09, 0.09, 0.02], MAT[m].colour, { ambient: 0.45 });
      A.iceCube(F, [x, 0, 0.02], 0.0215, 1 - r.melted / Rr.mIce, {});
      co(F, [x, -0.045, 0.02], x < 0.05 ? -40 : 40, 50, MAT[m].name + ': ' + (Rr.tMelt != null && S.ts >= Rr.tMelt ? 'melted in ' + fT(Rr.tMelt) : Math.round(100 * r.melted / Rr.mIce) + ' % melted'), '#E8EEF8', { keep: true });
    });
    F.render();
    // the card: a fingertip on each, at the same room temperature
    const cw = Math.min(250, W * 0.3), at = K.cardSlot(g, S, 'a fingertip on each', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) {
      const h = 120; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('Skin (33 °C) meets each at ' + p.Tr + ' °C', at.x + 10, at.y + 8);
      [[p.mat1, 30], [p.mat2, 70]].forEach(([m, y]) => {
        const Tc = contactT(MAT.skin, 33, MAT[m], p.Tr);
        ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 600); ctx.fillText(MAT[m].name + ': the skin falls to ' + Tc.toFixed(1) + ' °C', at.x + 10, at.y + y);
        ctx.fillStyle = g.theme['text-2']; ctx.font = mono(9, 500); ctx.fillText('effusivity √(kρc) = ' + eff(MAT[m]).toFixed(0), at.x + 10, at.y + y + 14);
      });
      ctx.restore();
    }
    const ta = R.a.tMelt, tb = R.b.tMelt;
    K.header(g, 'Both blocks are at ' + p.Tr + ' °C — the ' + MAT[p.mat1].name + ' still melts its ice ' + (ta && tb ? (tb / ta).toFixed(0) + '× faster' : ta && !tb ? 'long before the other' : 'at its own rate'),
      'ice cubes of 10 g · after ' + fT(S.ts) + ': ' + Math.round(100 * ra.melted / R.a.mIce) + ' % and ' + Math.round(100 * rb.melted / R.b.mIce) + ' % melted',
      'a good conductor feels cold because it carries energy away from your skin fast — not because it is colder');
  }
  function drawEquilibrium(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, M = window.MEAS;
    const R = runOf(S), r = rowNear(R.rows, S.ts);
    const F = scene(S, g, -0.25, 0.40, -0.20, 0.20, null);
    const mixedV = (p.mH + (p.add === 'cold' ? p.mC : 0)) / 1000, cupR = 0.042, lv = mixedV / (Math.PI * (cupR - 0.002) * (cupR - 0.002));
    if (p.cup === 'foam') { R3.cylinder(F, [0, 0, 0], [0, 0, 0.12], cupR + 0.004, '#F2F0EA', { segments: 30, caps: false, ambient: 0.5 }); R3.cylinder(F, [0, 0, 0.12], [0, 0, 0.128], cupR + 0.006, '#E0DCD2', { segments: 30, ambient: 0.5 }); }
    else M.beaker(F, [0, 0, 0], cupR, 0.12, Math.min(lv, 0.11), { steel: p.cup === 'steel', T: r.TH, tint: '#CFE8F6' });
    if (p.add !== 'cold') { const s = Math.cbrt(p.mC / MAT[p.add].rho); R3.box(F, [0, 0, Math.min(lv, 0.11) * 0.4 + s / 2 * 0], [s, s, s], MAT[p.add].colour, { ambient: 0.45, shadow: false, alpha: 0.9 }); }
    // two probes: one in the hot water, one in (or on) what was added
    const pr1 = A.probe(F, [-0.012, 0.01, 0.02], [-0.25, 0.1, 1], 0.14, 0.002), pr2 = A.probe(F, [0.012, -0.01, 0.015], [0.25, -0.1, 1], 0.14, 0.002);
    R3.tube(F, [pr1, [pr1[0] - 0.05, pr1[1], pr1[2]], [-0.18, -0.10, 0.06], [-0.18, -0.12, 0.01]], 0.0018, '#2A2F38', { segments: 5, round: false });
    R3.tube(F, [pr2, [pr2[0] + 0.05, pr2[1], pr2[2]], [0.18, -0.10, 0.06], [0.18, -0.12, 0.01]], 0.0018, '#2A2F38', { segments: 5, round: false });
    window.BENCH.meter(F, [-0.18, -0.15, 0.04], [0, -1, 0.35], 0.09, 0.045, { title: 'HOT WATER', value: r.TH.toFixed(1), unit: '°C', colour: '#FFB27A', depth: 0.03 });
    window.BENCH.meter(F, [0.18, -0.15, 0.04], [0, -1, 0.35], 0.09, 0.045, { title: p.add === 'cold' ? 'COLD WATER' : MAT[p.add].name.toUpperCase().slice(0, 12), value: r.TC.toFixed(1), unit: '°C', colour: '#7CC8FF', depth: 0.03 });
    F.render();
    K.header(g, Math.abs(r.TH - r.TC) < 0.2 ? 'One temperature: ' + ((r.TH + r.TC) / 2).toFixed(1) + ' °C — thermal equilibrium (the ideal mixture was ' + R.Tideal.toFixed(1) + ' °C)' : 'Mixing: the hot water ' + r.TH.toFixed(1) + ' °C, the ' + (p.add === 'cold' ? 'cold water ' : MAT[p.add].name + ' ') + r.TC.toFixed(1) + ' °C',
      'lost by the hot ' + fJ(r.lostH) + ' = gained by the cold ' + fJ(r.gainC) + ' + to the room ' + fJ(r.toRoom) + ' · in a ' + CUPS[p.cup].name,
      'the hot side always cools and the cold side always warms, until they share one temperature');
  }
  function drawStage(S, g) {
    const p = S.p;
    const nar = g.w < kit().NARROW; NAR = nar;                          // a phone: step back so the labels fit
    if (S.cam && S._nar !== nar) { if (S._nar != null || nar) S.cam.dist *= nar ? 1.4 : 1 / 1.4; S._nar = nar; }
    if (p.setup === 'direction') return drawDirection(S, g);
    if (p.setup === 'conduction') return drawConduction(S, g);
    if (p.setup === 'convection') return drawConvection(S, g);
    if (p.setup === 'radiation') return drawRadiation(S, g);
    if (p.setup === 'materials') return drawMaterials(S, g);
    return drawEquilibrium(S, g);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  const ROD_COL = { copper: '#D2793F', alu: '#C9D0D8', brass: '#D9A441', iron: '#8E98A6', steel: '#6F8FD8', glass: '#9FE0F8', wood: '#B98A4A' };
  function plot1(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'direction') {
      const R = runOf(S), Kk = K.plotKey(g, [{ c: MAT[p.matA].colour, label: MAT[p.matA].name }, { c: MAT[p.matB].colour, label: MAT[p.matB].name }, { c: '#E8EEF8', label: 'shared temperature, no losses', dash: [4, 3] }]);
      const lo = Math.min(p.TA, p.TB, 20) - 5, hi = Math.max(p.TA, p.TB, 20) + 5;
      const P = g.Plot({ xmin: 0, xmax: 20, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(R.Tmix, '#E8EEF8', [4, 3]); P.line(R.rows.map(r => [r.t / 60, r.TA]), MAT[p.matA].colour, 2); P.line(R.rows.map(r => [r.t / 60, r.TB]), MAT[p.matB].colour, 2); P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'conduction') {
      const R = runOf(S), Kk = K.plotKey(g, RODS.map(k => ({ c: ROD_COL[k], label: MAT[k].name.replace('stainless ', '') })));
      const P = g.Plot({ xmin: 0, xmax: 30, ymin: 0, ymax: Math.max(25, (R.copper.frames[R.copper.frames.length - 1].x - ROD.dip) * 110), pad: { t: Kk.t }, xlabel: 't (min)', ylabel: 'wax melted (cm)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { RODS.forEach(k => P.line(R[k].frames.map(f => [f.t / 60, Math.max(0, f.x - ROD.dip) * 100]), ROD_COL[k], 2)); P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'convection') {
      const rows = S.tankRows, Kk = K.plotKey(g, [{ c: '#FF7A45', label: 'top layer' }, { c: '#5FA8E8', label: 'bottom layer' }]);
      const t1 = Math.max(60, rows.length ? rows[rows.length - 1].t : 60), lo = 19.9, hi = Math.max(20.6, ...rows.map(r => Math.max(r.top, r.bot))) + 0.1;
      const P = g.Plot({ xmin: 0, xmax: t1, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 't (s)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line(rows.map(r => [r.t, r.top]), '#FF7A45', 2); P.line(rows.map(r => [r.t, r.bot]), '#5FA8E8', 2); });
      Kk.draw(P); return;
    }
    if (p.setup === 'radiation') {
      const vals = FACE_ORDER.map(f => leslie({ Tw: p.Tw, face: f, d: p.dist, Troom: p.Troom }).mV), ymax = Math.max(0.5, ...vals) * 1.15;
      const P = g.Plot({ xmin: -0.5, xmax: 3.5, ymin: 0, ymax, pad: { t: 14 }, xlabel: 'face turned to the detector', ylabel: 'thermopile (mV)', xticks: [0, 1, 2, 3], xfmt: v => ['black', 'white', 'dull Al', 'shiny Al'][Math.round(v)] || '', yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => vals.forEach((v, i) => P.area([[i - 0.3, v], [i + 0.3, v]], 0, g.alpha(FACE_ORDER[i] === p.face ? '#FF7A45' : '#9AA4B4', 0.8))));
      vals.forEach((v, i) => P.tag(i, v + ymax * 0.04, v.toFixed(2), T['text-2'], 'center'));
      return;
    }
    if (p.setup === 'materials') {
      const R = runOf(S), Kk = K.plotKey(g, [{ c: MAT[p.mat1].colour, label: 'ice on ' + MAT[p.mat1].name }, { c: MAT[p.mat2].colour === '#2F3744' ? '#8E98A6' : MAT[p.mat2].colour, label: 'ice on ' + MAT[p.mat2].name }]);
      const P = g.Plot({ xmin: 0, xmax: 20, ymin: 0, ymax: 10.5, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: 'ice melted (g)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(R.a.rows.map(r => [r.t / 60, r.melted * 1000]), MAT[p.mat1].colour, 2); P.line(R.b.rows.map(r => [r.t / 60, r.melted * 1000]), MAT[p.mat2].colour === '#2F3744' ? '#8E98A6' : MAT[p.mat2].colour, 2); P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    const R = runOf(S), Kk = K.plotKey(g, [{ c: '#FFB27A', label: 'hot water' }, { c: '#7CC8FF', label: p.add === 'cold' ? 'cold water' : MAT[p.add].name }, { c: '#E8EEF8', label: 'mixture with no losses', dash: [4, 3] }]);
    const P = g.Plot({ xmin: 0, xmax: 10, ymin: Math.min(p.TC, 20) - 3, ymax: p.TH + 3, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.hline(R.Tideal, '#E8EEF8', [4, 3]); P.line(R.rows.map(r => [r.t / 60, r.TH]), '#FFB27A', 2); P.line(R.rows.map(r => [r.t / 60, r.TC]), '#7CC8FF', 2); P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'direction') {
      const CA = p.mA * MAT[p.matA].c, cB = MAT[p.matB].c, pts = []; for (let m = 0.05; m <= 2.001; m += 0.05) pts.push([m, (CA * p.TA + m * cB * p.TB) / (CA + m * cB)]);
      const Kk = K.plotKey(g, [{ c: '#FFB27A', label: 'where they meet, against the mass of ' + MAT[p.matB].name }, { c: '#FFD36B', label: 'yours', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 2, ymin: Math.min(p.TA, p.TB) - 3, ymax: Math.max(p.TA, p.TB) + 3, pad: { t: Kk.t }, xlabel: 'mass of the ' + MAT[p.matB].name + ' block (kg)', ylabel: '°C', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#FFB27A', 2); P.dot(p.mB, runOf(S).Tmix, 5, '#FFD36B', '#05080F'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'conduction') {
      const R = runOf(S), Kk = K.plotKey(g, [{ c: '#FFD36B', label: 'measured at 30 min', dot: true }, { c: '#9DB6FF', label: 'Ingen-Housz: x² ∝ k', dash: [4, 3] }]);
      const xc = R.copper.frames[R.copper.frames.length - 1].x - ROD.dip, ymax = xc * xc * 1e4 * 1.25;
      const P = g.Plot({ xmin: 0, xmax: 430, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'conductivity k (W/m·K)', ylabel: 'melted length² (cm²)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const sl = R.alu.xSteady - ROD.dip; P.line([[0, 0], [430, 430 / MAT.alu.k * sl * sl * 1e4]], '#9DB6FF', 1.5, [4, 3]); RODS.forEach(k => { const x = R[k].frames[R[k].frames.length - 1].x - ROD.dip; P.dot(MAT[k].k, x * x * 1e4, 5, ROD_COL[k], '#05080F'); }); });
      RODS.slice(0, 5).forEach(k => { const x = R[k].frames[R[k].frames.length - 1].x - ROD.dip; P.tag(MAT[k].k + 6, x * x * 1e4, MAT[k].name.replace('stainless ', ''), T['text-2'], 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'convection') {
      const nx = TANK.nx, ny = TANK.ny, prof = []; for (let j = 0; j < ny; j++) { let s = 0; for (let i = 1; i < nx - 1; i++) s += S.tank.T[j * nx + i]; prof.push([s / (nx - 2), (j + 0.5) / ny * TANK.H * 100]); }
      const lo = Math.min(...prof.map(q => q[0])), hi = Math.max(lo + 0.3, ...prof.map(q => q[0]));
      const P = g.Plot({ xmin: lo - 0.05, xmax: hi + 0.05, ymin: 0, ymax: TANK.H * 100, pad: { t: 14 }, xlabel: 'mean temperature across the tank (°C)', ylabel: 'height (cm)', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => P.line(prof, '#FF7A45', 2.4));
      P.tag(lo, TANK.H * 92, p.pos === 'top' ? 'warm on top, cold below: stable, no turnover' : 'convection mixes it: the profile flattens', T['text-3'], 'left');
      return;
    }
    if (p.setup === 'radiation') {
      const Kk = K.plotKey(g, FACE_ORDER.map(f => ({ c: f === 'black' ? '#8E98A6' : FACES[f].colour, label: FACES[f].name })).concat([{ c: '#FF7A45', label: 'yours', dot: true }]));
      const pts = f => { const out = []; for (let T = 20; T <= 100.001; T += 2) out.push([T, leslie({ Tw: T, face: f, d: p.dist, Troom: p.Troom }).mV]); return out; };
      const ymax = leslie({ Tw: 100, face: 'black', d: p.dist, Troom: p.Troom }).mV * 1.1 + 0.05;
      const P = g.Plot({ xmin: 20, xmax: 100, ymin: Math.min(0, leslie({ Tw: 20, face: 'black', d: p.dist, Troom: p.Troom }).mV), ymax, pad: { t: Kk.t }, xlabel: 'water in the cube (°C)', ylabel: 'thermopile (mV)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { FACE_ORDER.forEach(f => P.line(pts(f), f === 'black' ? '#8E98A6' : FACES[f].colour, 2)); P.dot(p.Tw, leslie({ Tw: p.Tw, face: p.face, d: p.dist, Troom: p.Troom }).mV, 5, '#FF7A45', '#05080F'); });
      P.tag(24, ymax * 0.9, 'it bends upward: T⁴', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'materials') {
      const ks = ['alu', 'steel', 'granite', 'glass', 'acrylic', 'wood', 'foam'], Kk = K.plotKey(g, [{ c: '#FFB27A', label: 'what your skin falls to', dot: true }]);
      const P = g.Plot({ xmin: 1, xmax: 4.6, ymin: p.Tr - 2, ymax: 34, pad: { t: Kk.t }, xlabel: 'effusivity √(kρc) (log₁₀)', ylabel: 'skin on it (°C)', xfmt: v => Math.pow(10, v).toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const pts = []; for (let x = 1; x <= 4.6; x += 0.05) { const e = Math.pow(10, x); pts.push([x, (eff(MAT.skin) * 33 + e * p.Tr) / (eff(MAT.skin) + e)]); } P.line(pts, g.alpha('#FFB27A', 0.6), 1.5); ks.forEach(k => P.dot(Math.log10(eff(MAT[k])), contactT(MAT.skin, 33, MAT[k], p.Tr), k === p.mat1 || k === p.mat2 ? 6 : 4, '#FFB27A', k === p.mat1 || k === p.mat2 ? '#05080F' : null)); });
      ks.forEach(k => P.tag(Math.log10(eff(MAT[k])), contactT(MAT.skin, 33, MAT[k], p.Tr) + 0.9, MAT[k].name.split(' ')[0], T['text-2'], 'center'));
      Kk.draw(P); return;
    }
    const R = runOf(S), e = R.rows[R.rows.length - 1], r = rowNear(R.rows, S.ts);
    const vals = [['lost by the hot', r.lostH, '#FFB27A'], ['gained by the cold', r.gainC, '#7CC8FF'], ['to the room', r.toRoom, '#9AA4B4']], ymax = Math.max(1, e.lostH) * 1.15;
    const P = g.Plot({ xmin: -0.5, xmax: 2.5, ymin: 0, ymax: ymax / 1000, pad: { t: 14 }, xlabel: '', ylabel: 'kJ', xticks: [0, 1, 2], xfmt: v => (vals[Math.round(v)] || [''])[0], yfmt: v => v.toFixed(1) }).frame();
    P.clip(() => vals.forEach((v, i) => P.area([[i - 0.3, v[1] / 1000], [i + 0.3, v[1] / 1000]], 0, g.alpha(v[2], 0.85))));
    vals.forEach((v, i) => P.tag(i, v[1] / 1000 + ymax / 1000 * 0.04, fJ(v[1]), T['text-2'], 'center'));
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'direction') {
      const R = runOf(S), r = rowNear(R.rows, S.ts);
      return [{ label: MAT[p.matA].name, value: r.TA.toFixed(1), unit: '°C', flag: 'accent' }, { label: MAT[p.matB].name, value: r.TB.toFixed(1), unit: '°C' },
        { label: 'Flow G·(T_A − T_B)', value: Math.abs(r.q).toFixed(2), unit: 'W', hint: r.q >= 0 ? 'A → B' : 'B → A' }, { label: 'Crossed so far', value: fJ(Math.abs(r.Q)) },
        { label: 'Heat capacities mc', value: R.CA.toFixed(0) + ' · ' + R.CB.toFixed(0), unit: 'J/K' }, { label: 'Shared temperature ΣmcT/Σmc', value: R.Tmix.toFixed(2), unit: '°C', flag: 'ok', hint: 'if nothing leaked' }];
    }
    if (p.setup === 'conduction') {
      const R = runOf(S), out = [{ label: 'Time', value: fT(S.ts), flag: 'accent' }];
      ['copper', 'alu', 'iron', 'steel', 'glass', 'wood'].forEach(k => out.push({ label: MAT[k].name.replace('stainless ', '') + ' (k ' + MAT[k].k + ')', value: (Math.max(0, rodFrame(R[k], S.ts).x - ROD.dip) * 100).toFixed(1), unit: 'cm', hint: 'steady ' + ((R[k].xSteady - ROD.dip) * 100).toFixed(1) + ' cm' }));
      const a = rodFrame(R.copper, S.ts).x - ROD.dip, b = rodFrame(R.steel, S.ts).x - ROD.dip;
      out.push({ label: '(x_Cu / x_steel)²', value: b > 0.002 ? ((a / b) * (a / b)).toFixed(1) : '—', hint: 'k ratio ' + (MAT.copper.k / MAT.steel.k).toFixed(1) });
      return out;
    }
    if (p.setup === 'convection') {
      const st = tankStats(S.tank);
      return [{ label: 'Heater', value: p.P.toFixed(0), unit: 'W', flag: 'accent' }, { label: 'Top layer', value: st.top.toFixed(2), unit: '°C' }, { label: 'Bottom layer', value: st.bot.toFixed(2), unit: '°C' },
        { label: 'Top − bottom', value: (st.top - st.bot).toFixed(2), unit: 'K', flag: p.pos === 'top' ? 'warn' : '' }, { label: 'Fastest water', value: (st.umax * 1000).toFixed(1), unit: 'mm/s' },
        { label: 'Energy in P·t', value: fJ(S.tank.heat) }, { label: 'Warms 2.7 L by Q/mc', value: (S.tank.heat / (998 * TANK.W * TANK.H * TANK.D * 4186)).toFixed(2), unit: 'K' }];
    }
    if (p.setup === 'radiation') {
      const L0 = leslie({ Tw: p.Tw, face: p.face, d: p.dist, Troom: p.Troom });
      return [{ label: 'Thermopile', value: L0.mV.toFixed(3), unit: 'mV', flag: 'accent' }, { label: 'Emissivity ε', value: FACES[p.face].eps.toFixed(2), hint: FACES[p.face].name },
        { label: 'Net εσ(T⁴ − T₀⁴)', value: L0.M.toFixed(0), unit: 'W/m²' }, { label: 'On the detector', value: (L0.P * 1000).toFixed(2), unit: 'mW' },
        { label: 'Black ÷ shiny', value: (leslie({ Tw: p.Tw, face: 'black', d: p.dist, Troom: p.Troom }).mV / Math.max(1e-9, leslie({ Tw: p.Tw, face: 'shiny', d: p.dist, Troom: p.Troom }).mV)).toFixed(0), unit: '×' },
        { label: 'Black ÷ white', value: (leslie({ Tw: p.Tw, face: 'black', d: p.dist, Troom: p.Troom }).mV / Math.max(1e-9, leslie({ Tw: p.Tw, face: 'white', d: p.dist, Troom: p.Troom }).mV)).toFixed(2), unit: '×', hint: 'white paint glows in infrared too' }];
    }
    if (p.setup === 'materials') {
      const R = runOf(S);
      return [{ label: 'Both blocks at', value: p.Tr.toFixed(0), unit: '°C', flag: 'accent' },
        { label: 'Skin on ' + MAT[p.mat1].name, value: contactT(MAT.skin, 33, MAT[p.mat1], p.Tr).toFixed(1), unit: '°C' }, { label: 'Skin on ' + MAT[p.mat2].name, value: contactT(MAT.skin, 33, MAT[p.mat2], p.Tr).toFixed(1), unit: '°C' },
        { label: 'Ice melts on ' + MAT[p.mat1].name, value: R.a.tMelt == null ? '> 20 min' : fT(R.a.tMelt) }, { label: 'Ice melts on ' + MAT[p.mat2].name, value: R.b.tMelt == null ? '> 20 min' : fT(R.b.tMelt) },
        { label: 'k: ' + MAT[p.mat1].name.split(' ')[0] + ' · ' + MAT[p.mat2].name.split(' ')[0], value: MAT[p.mat1].k + ' · ' + MAT[p.mat2].k, unit: 'W/m·K' }];
    }
    const R = runOf(S), r = rowNear(R.rows, S.ts);
    return [{ label: 'Hot water', value: r.TH.toFixed(1), unit: '°C', flag: 'accent' }, { label: p.add === 'cold' ? 'Cold water' : MAT[p.add].name, value: r.TC.toFixed(1), unit: '°C' },
      { label: 'Ideal ΣmcT/Σmc', value: R.Tideal.toFixed(2), unit: '°C', flag: 'ok' }, { label: 'Lost by the hot', value: fJ(r.lostH) }, { label: 'Gained by the cold', value: fJ(r.gainC) }, { label: 'Leaked to the room', value: fJ(r.toRoom), hint: CUPS[p.cup].name }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'direction') { const R = runOf(S); return E.v('P') + ' ' + E.op('=') + ' ' + E.v('G') + '(' + E.v('T') + E.sub('A') + ' − ' + E.v('T') + E.sub('B') + ');  ' + E.v('T') + E.sub('shared') + ' ' + E.op('=') + ' ' + E.frac(E.v('m') + E.sub('A') + E.v('c') + E.sub('A') + E.v('T') + E.sub('A') + ' + ' + E.v('m') + E.sub('B') + E.v('c') + E.sub('B') + E.v('T') + E.sub('B'), E.v('m') + E.sub('A') + E.v('c') + E.sub('A') + ' + ' + E.v('m') + E.sub('B') + E.v('c') + E.sub('B')) + ' ' + E.op('=') + ' ' + E.n(R.Tmix.toFixed(2), '°C'); }
    if (p.setup === 'conduction') return E.v('ρc') + ' ∂' + E.v('T') + '/∂' + E.v('t') + ' ' + E.op('=') + ' ' + E.v('k') + ' ∂²' + E.v('T') + '/∂' + E.v('x') + '² − ' + E.frac(E.v('hP'), E.v('A')) + '(' + E.v('T') + ' − ' + E.v('T') + E.sub('air') + ');  steady: ' + E.v('x') + E.sub('melt') + ' ' + E.op('=') + ' ' + E.frac('ln[(' + E.v('T') + E.sub('bath') + ' − ' + E.v('T') + E.sub('air') + ')/(' + E.v('T') + E.sub('wax') + ' − ' + E.v('T') + E.sub('air') + ')]', '√(' + E.v('hP') + '/' + E.v('kA') + ')') + '  ∝ √' + E.v('k');
    if (p.setup === 'convection') return '∂ω/∂' + E.v('t') + ' + ' + E.v('u') + '·∇ω ' + E.op('=') + ' ν∇²ω + ' + E.v('gβ') + ' ∂' + E.v('T') + '/∂' + E.v('x') + ';   ∂' + E.v('T') + '/∂' + E.v('t') + ' + ' + E.v('u') + '·∇' + E.v('T') + ' ' + E.op('=') + ' κ∇²' + E.v('T') + ' + heater;   ∇²ψ ' + E.op('=') + ' −ω';
    if (p.setup === 'radiation') { const L0 = leslie({ Tw: p.Tw, face: p.face, d: p.dist, Troom: p.Troom }); return E.v('M') + ' ' + E.op('=') + ' εσ(' + E.v('T') + '⁴ − ' + E.v('T') + E.sub('room') + '⁴) ' + E.op('=') + ' ' + E.n(FACES[p.face].eps) + ' × 5.67×10⁻⁸ × (' + E.n((p.Tw + 273.15).toFixed(1), 'K') + '⁴ − ' + E.n((p.Troom + 273.15).toFixed(1), 'K') + '⁴) ' + E.op('=') + ' ' + E.n(L0.M.toFixed(0), 'W/m²'); }
    if (p.setup === 'materials') return E.v('T') + E.sub('contact') + ' ' + E.op('=') + ' ' + E.frac(E.v('e') + E.sub('skin') + E.v('T') + E.sub('skin') + ' + ' + E.v('e') + E.v('T'), E.v('e') + E.sub('skin') + ' + ' + E.v('e')) + ',  ' + E.v('e') + ' ' + E.op('=') + ' √(' + E.v('kρc') + '):  ' + MAT[p.mat1].name + ' ' + E.n(contactT(MAT.skin, 33, MAT[p.mat1], p.Tr).toFixed(1), '°C') + ', ' + MAT[p.mat2].name + ' ' + E.n(contactT(MAT.skin, 33, MAT[p.mat2], p.Tr).toFixed(1), '°C');
    const R = runOf(S); return E.v('m') + E.sub('h') + E.v('c') + E.sub('h') + '(' + E.v('T') + E.sub('h') + ' − ' + E.v('T') + ') ' + E.op('=') + ' ' + E.v('m') + E.sub('c') + E.v('c') + E.sub('c') + '(' + E.v('T') + ' − ' + E.v('T') + E.sub('c') + ')  →  ' + E.v('T') + ' ' + E.op('=') + ' ' + E.n(R.Tideal.toFixed(2), '°C') + ' (with no leaks)';
  }
  const EQ_NOTE = {
    direction: 'The flow is set by the difference in temperature, never by which object is bigger or which material — they only change how fast and where the two meet. Where they meet is a heat-capacity-weighted average: the block with more mc moves less.',
    conduction: 'Ingen-Housz coated equal rods with wax and dipped one end in hot water. Each rod also loses heat from its sides, so in the end the wax stops melting at a length where conduction along the rod balances the loss: that length grows as √k, so the lengths squared are in the ratio of the conductivities. Copper’s finite 57 cm makes it run a little long.',
    convection: 'The model resolves the tank on a 6 mm grid; flow finer than that is added as extra mixing (an eddy viscosity), so speeds are realistic in size but the plume is smoother than a real one. What it gets exactly right is the direction: heat from below and the water turns over; heat from above and it does not.',
    radiation: 'Every surface above absolute zero radiates; the net flow is εσ(T⁴ − T₀⁴). Leslie found the paint’s colour hardly mattered in the infrared — white paint radiates almost as well as black — while polished metal radiates very little. The thermopile reads ten to twenty times less from shiny aluminium.',
    materials: 'At the instant of touch, the surface settles between the two temperatures, nearer the one whose effusivity √(kρc) is larger. Metals have effusivities twenty times skin’s, so the skin is dragged almost to the metal’s temperature; wood’s is lower than skin’s, so it feels nearly warm. Same temperature, different feel.',
    equilibrium: 'Energy lost by the hot water equals energy gained by the cold one plus what leaks to the room. A foam cup with a lid leaks least; a steel mug soaks up heat itself and leaks fastest. Equilibrium is the moment the flow stops: one temperature.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const matOpts = keys => keys.map(k => ({ value: k, label: MAT[k].name[0].toUpperCase() + MAT[k].name.slice(1) + ' (k ' + MAT[k].k + ')' }));
  L.register({
    id: 'g6c-heat-transfer',
    grade: 6, unit: '6C', topics: ['C3'],
    subject: 'physics',
    chapter: 'Energy, Heat and Thermal Systems',
    name: 'The Heat Transfer Bench — Conduction, Convection, Radiation',
    exams: ['NGSS MS-PS3-3', 'NGSS MS-PS3-4', 'NGSS MS-PS3-5', 'CAST'],
    weight: 'Core model',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the bench · scroll to zoom · switch on the thermal camera to see the heat',
    lede: 'Three ways energy moves, each on the apparatus that first showed it. <b>Ingen-Housz’s rods</b> (1789): seven materials, wax beads, one hot bath — the heat equation runs on every rod and the beads fall where the wax reaches its melting point. ' +
      'A glass <b>convection tank</b> computed as a real buoyant flow, dye and all. <b>Leslie’s cube</b> (1804) with four finishes and a thermopile reading εσ(T⁴ − T₀⁴). And the three ideas they rest on: energy only ever flows from hotter to colder, metal feels cold because it conducts, and mixing ends at one temperature.',
    params: preset({}),
    presets: [
      { name: 'Ingen-Housz’s rods in boiling water', params: preset({}) },
      { name: 'The same rods through the thermal camera', params: preset({ view: 'ir' }) },
      { name: 'A fan blowing on the rods', params: preset({ h: 35 }) },
      { name: 'Hot aluminium on cold copper', params: preset({ setup: 'direction' }) },
      { name: 'Swap them: cold aluminium, hot copper', params: preset({ setup: 'direction', TA: 10, TB: 80 }) },
      { name: 'A card between the blocks', params: preset({ setup: 'direction', contact: 'card' }) },
      { name: 'Heater at the bottom corner', params: preset({ setup: 'convection' }) },
      { name: 'Heater at the top: no turnover', params: preset({ setup: 'convection', pos: 'top' }) },
      { name: 'Thick glycerol: slow convection', params: preset({ setup: 'convection', liq: 'glycerol' }) },
      { name: 'Leslie’s cube: black face', params: preset({ setup: 'radiation' }) },
      { name: 'Leslie’s cube: polished face, thermal camera', params: preset({ setup: 'radiation', face: 'shiny', view: 'ir' }) },
      { name: 'Ice on aluminium and on plastic', params: preset({ setup: 'materials' }) },
      { name: 'Ice on steel and on wood', params: preset({ setup: 'materials', mat1: 'steel', mat2: 'wood' }) },
      { name: 'Hot and cold water in a foam cup', params: preset({ setup: 'equilibrium' }) },
      { name: 'A cold iron block into hot water, in a steel mug', params: preset({ setup: 'equilibrium', add: 'iron', mC: 0.2, cup: 'steel' }) }
    ],
    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS }] },
      { group: 'Block A', when: is('direction'), items: [
        { key: 'matA', type: 'select', label: 'Material', restructure: true, options: matOpts(['copper', 'alu', 'iron', 'granite']) },
        { key: 'mA', label: 'Mass', min: 0.1, max: 2, step: 0.05, unit: 'kg', fmt: v => v.toFixed(2), restructure: true },
        { key: 'TA', label: 'Starts at', min: -20, max: 100, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'Block B', when: is('direction'), items: [
        { key: 'matB', type: 'select', label: 'Material', restructure: true, options: matOpts(['copper', 'alu', 'iron', 'granite']) },
        { key: 'mB', label: 'Mass', min: 0.1, max: 2, step: 0.05, unit: 'kg', fmt: v => v.toFixed(2), restructure: true },
        { key: 'TB', label: 'Starts at', min: -20, max: 100, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'contact', type: 'select', label: 'Between them', restructure: true, options: Object.keys(CONTACT).map(k => ({ value: k, label: CONTACT[k].name[0].toUpperCase() + CONTACT[k].name.slice(1) })) }] },
      { group: 'The bath and rods', when: is('conduction'), items: [
        { key: 'Tb', label: 'Bath temperature', min: 60, max: 150, step: 1, unit: '°C', fmt: v => v.toFixed(0) + (v > 100 ? ' (oil)' : ''), restructure: true },
        { key: 'd', label: 'Rod diameter', min: 3, max: 12, step: 0.5, unit: 'mm', fmt: v => v.toFixed(1), restructure: true },
        { key: 'h', label: 'Air cooling the rods', min: 5, max: 40, step: 1, unit: 'W/m²K', fmt: v => v.toFixed(0) + (v > 20 ? ' (a fan)' : ' (still air)'), restructure: true },
        { key: 'wax', type: 'select', label: 'Coated with', restructure: true, options: Object.keys(WAXES).map(k => ({ value: +k, label: WAXES[k][0].toUpperCase() + WAXES[k].slice(1) })) }] },
      { group: 'The tank', when: is('convection'), items: [
        { key: 'P', label: 'Heater power', min: 5, max: 60, step: 1, unit: 'W', fmt: v => v.toFixed(0), restructure: true },
        { key: 'pos', type: 'select', label: 'Heater at', restructure: true, options: [{ value: 'left', label: 'Bottom, near the left wall' }, { value: 'centre', label: 'Bottom, in the middle' }, { value: 'top', label: 'The top' }] },
        { key: 'liq', type: 'select', label: 'Liquid', restructure: true, options: Object.keys(LIQS).map(k => ({ value: k, label: LIQS[k].name[0].toUpperCase() + LIQS[k].name.slice(1) })) },
        { key: 'show', type: 'select', label: 'Show', display: true, options: [{ value: 'dye', label: 'Purple dye' }, { value: 'temp', label: 'Temperature' }, { value: 'both', label: 'Both' }] }] },
      { group: 'Leslie’s cube', when: is('radiation'), items: [
        { key: 'Tw', label: 'Water in the cube', min: 20, max: 100, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'face', type: 'select', label: 'Face turned to the detector', restructure: true, options: FACE_ORDER.map(k => ({ value: k, label: FACES[k].name[0].toUpperCase() + FACES[k].name.slice(1) })) },
        { key: 'dist', label: 'Detector distance', min: 0.03, max: 0.40, step: 0.01, unit: 'm', fmt: v => (v * 100).toFixed(0) + ' cm', restructure: true },
        { key: 'Troom', label: 'Room', min: 0, max: 35, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'The two blocks', when: is('materials'), items: [
        { key: 'mat1', type: 'select', label: 'Left block', restructure: true, options: matOpts(['alu', 'copper', 'steel', 'granite', 'glass']) },
        { key: 'mat2', type: 'select', label: 'Right block', restructure: true, options: matOpts(['acrylic', 'wood', 'foam', 'glass', 'steel']) },
        { key: 'Tr', label: 'Room (and blocks)', min: -10, max: 40, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'The hot water', when: is('equilibrium'), items: [
        { key: 'mH', label: 'Hot water', min: 0.05, max: 0.3, step: 0.01, unit: 'kg', fmt: v => (v * 1000).toFixed(0) + ' g', restructure: true },
        { key: 'TH', label: 'At', min: 40, max: 95, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'cup', type: 'select', label: 'In', restructure: true, options: Object.keys(CUPS).map(k => ({ value: k, label: CUPS[k].name[0].toUpperCase() + CUPS[k].name.slice(1) })) }] },
      { group: 'Add', when: is('equilibrium'), items: [
        { key: 'add', type: 'select', label: 'What goes in', restructure: true, options: [{ value: 'cold', label: 'Cold water' }].concat(matOpts(['copper', 'alu', 'iron', 'granite'])) },
        { key: 'mC', label: 'Its mass', min: 0.05, max: 0.5, step: 0.01, unit: 'kg', fmt: v => (v * 1000).toFixed(0) + ' g', restructure: true },
        { key: 'TC', label: 'At', min: 0, max: 30, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'Look with', when: is('direction', 'conduction', 'radiation'), items: [
        { key: 'view', type: 'select', label: 'Look with', display: true, options: [{ value: 'eye', label: 'Your eyes' }, { value: 'ir', label: 'A thermal camera' }] }] }
    ],
    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    plots: [
      { title: S => ({ direction: 'Both temperatures, minute by minute', conduction: 'How far the wax has melted along each rod', convection: 'Top and bottom of the tank', radiation: 'The four faces, one temperature', materials: 'Ice melting on each block', equilibrium: 'Hot and cold, meeting' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ direction: 'Where they meet depends on the masses', conduction: 'Ingen-Housz’s law: melted length² against conductivity', convection: 'The temperature from floor to surface', radiation: 'Thermopile against temperature, every face', materials: 'What your skin feels, every material', equilibrium: 'The energy ledger' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],
    problems: [
      { source: 'NGSS MS-PS3-4 · CAST pattern: predicting a final temperature',
        q: 'A 0.50 kg aluminium block at 80 °C (c = 897 J/kg·K) is pressed against a 0.50 kg copper block at 10 °C (c = 385 J/kg·K). If no heat leaks away, what temperature do they share?',
        params: preset({ setup: 'direction' }),
        predict: { label: 'shared', unit: '°C', tol: 0.01 },
        measure: S => runOf(S).Tmix,
        working: '(0.5 × 897 × 80 + 0.5 × 385 × 10) ÷ (0.5 × 897 + 0.5 × 385) = 37 805 ÷ 641 = <b>59.0 °C</b>. Aluminium’s larger heat capacity keeps the shared temperature nearer its own starting point.' },
      { source: 'NGSS MS-PS3-3 · CAST pattern: using a model',
        q: 'A 6 mm copper rod (k = 401 W/m·K) sticks out of boiling water (95 °C) into still air (h = 10 W/m²K, 20 °C). Paraffin wax melts at 58 °C. How far out of the bath does the wax melt, once it stops?',
        params: preset({}),
        predict: { label: 'melted length', unit: 'cm', tol: 0.06 },
        measure: S => (runOf(S).copper.frames[runOf(S).copper.frames.length - 1].x - ROD.dip) * 100,
        working: 'm = √(hP/kA) = √(10 × 667 ÷ 401) = 4.08 per metre; x = ln((95 − 20) ÷ (58 − 20)) ÷ m = 0.680 ÷ 4.08 = 16.7 cm for a long rod. The 57 cm rod’s insulated far end holds a little more heat: after 30 minutes the beads have fallen to <b>17.3 cm</b>.' },
      { source: 'NGSS MS-PS3-3 · CAST pattern: analysing data',
        q: 'Leslie’s cube holds water at 90 °C in a 20 °C room. The thermopile, 10 cm away, reads 5.73 mV from the matt black face. What does it read from the white face (ε 0.91)?',
        params: preset({ setup: 'radiation', face: 'white' }),
        predict: { label: 'reading', unit: 'mV', tol: 0.02 },
        measure: S => leslie({ Tw: S.p.Tw, face: S.p.face, d: S.p.dist, Troom: S.p.Troom }).mV,
        working: 'The reading is proportional to ε: 5.73 × 0.91 ÷ 0.95 = <b>5.49 mV</b>. White paint is as bright as black in the infrared; polished aluminium (ε 0.05) gives only 0.30 mV.' },
      { source: 'NGSS MS-PS3-3 · CAST pattern: explaining a phenomenon',
        q: 'Your fingertip (skin at 33 °C, effusivity 1180) touches an aluminium block at 20 °C (effusivity 24 000). What temperature does the skin surface fall to?',
        params: preset({ setup: 'materials' }),
        predict: { label: 'skin', unit: '°C', tol: 0.01 },
        measure: S => contactT(MAT.skin, 33, MAT[S.p.mat1], S.p.Tr),
        working: '(1180 × 33 + 23 900 × 20) ÷ (1180 + 23 900) = <b>20.6 °C</b>. On pine wood (effusivity 320) the same skin settles at 30.2 °C. Both blocks are at 20 °C; the aluminium carries heat away 70 times faster.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: planning with a model',
        q: 'The same room: a 10 g ice cube is put on the aluminium block. How long until it has all melted?',
        params: preset({ setup: 'materials' }),
        predict: { label: 'time', unit: 's', tol: 0.08 },
        measure: S => runOf(S).a.tMelt,
        working: 'Melting 10 g takes 3340 J. The block’s 20 °C reaches the ice through a thin film of meltwater, at first about 35 W; as the block cools the flow falls. It is all gone in about <b>95 s</b>. On the acrylic block the same cube lasts over half an hour.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: equilibrium',
        q: '100 g of water at 80 °C and 100 g at 20 °C are mixed in a foam cup (heat capacity 6 J/K, starting with the hot water). What temperature do they reach, ignoring the slow leak?',
        params: preset({ setup: 'equilibrium' }),
        predict: { label: 'mixture', unit: '°C', tol: 0.01 },
        measure: S => runOf(S).Tideal,
        working: '(424.6 × 80 + 418.6 × 20) ÷ (424.6 + 418.6) = <b>50.2 °C</b> — the cup’s own 6 J/K, warm with the hot water, nudges it 0.2 K above the plain average of 50 °C.' }
    ],
    walkthrough: [
      { title: 'Does cold flow?', ask: 'A cold aluminium block (10 °C) touches a hot copper one (80 °C). Which way does the heat-flux meter point?',
        reveal: '<b>From the copper to the aluminium — from hot to cold, always.</b> Swap the temperatures and the arrow swaps. There is no flow of “cold”: the cold block warms because energy arrives.', params: preset({ setup: 'direction', TA: 10, TB: 80 }) },
      { title: 'Which rod drops its beads first?', ask: 'Seven rods in the same hot bath. Rank how far the wax melts.',
        reveal: '<b>Copper, aluminium, brass, iron, steel, glass, wood.</b> The melted lengths squared line up with the conductivities (plot 2) — Ingen-Housz’s result.', params: preset({}) },
      { title: 'See it with a thermal camera', ask: 'Switch on the thermal camera. Does a hot copper rod look as hot as it is?',
        reveal: '<b>No — shiny metal glows faintly in the infrared</b> (ε 0.05) and reads cold; the glass and wood rods read true. A thermal camera must know a surface’s emissivity.', params: preset({ view: 'ir' }) },
      { title: 'Heat the top', ask: 'Move the heater to the top of the tank. Will the warm water mix down?',
        reveal: '<b>No — it stays on top.</b> Warm water is less dense and already on top, so buoyancy has nothing to lift. Convection needs heat from below (or cooling from above).', params: preset({ setup: 'convection', pos: 'top' }) },
      { title: 'Is black best?', ask: 'Turn Leslie’s cube: black, white, dull and shiny aluminium. Which faces radiate most?',
        reveal: '<b>Black and white almost equally; shiny aluminium a twentieth as much.</b> In the infrared, paint of any colour is nearly “black”; what matters is paint against bare metal.', params: preset({ setup: 'radiation', face: 'white' }) },
      { title: 'Same temperature, different feel', ask: 'Both blocks have sat in the same room all day. Why does the aluminium feel colder and melt the ice faster?',
        reveal: '<b>It conducts heat away from your hand (and into the ice) far faster.</b> Your skin senses its own temperature: on aluminium it falls to 20.6 °C, on wood only to 30 °C.', params: preset({ setup: 'materials', mat2: 'wood' }) },
      { title: 'Equilibrium', ask: 'Pour 100 g of water at 20 °C into 100 g at 80 °C. Where do they end, and where did the energy go?',
        reveal: '<b>About 50 °C — together.</b> The ledger shows the hot water’s loss equal to the cold water’s gain plus a little to the room.', params: preset({ setup: 'equilibrium' }) }
    ],
    quiz: [
      { q: 'You hold a cold can of drink. What actually moves?', options: ['Cold moves from the can into your hand', 'Energy moves from your hand into the can', 'Nothing moves', 'Cold and heat swap'], answer: 1,
        why: 'Energy flows from hotter to colder. Your hand loses energy; that is what “cold” feels like.' },
      { q: 'Ingen-Housz’s wax melts furthest along a copper rod because copper…', options: ['is a better conductor of heat', 'holds more heat', 'is shinier', 'is heavier'], answer: 0,
        why: 'The melted length grows as √k; copper’s conductivity is the highest of the rods.' },
      { q: 'A heater at the top of a tank of water…', options: ['makes strong convection currents', 'warms only the top layer, with little mixing', 'boils the bottom first', 'works exactly like one at the bottom'], answer: 1,
        why: 'Warm water rises; if it is already on top, there is nothing to drive circulation.' },
      { q: 'Which face of Leslie’s cube radiates least?', options: ['Matt black', 'White paint', 'Polished aluminium', 'They are all the same'], answer: 2,
        why: 'Polished metal has an emissivity near 0.05; paint of any colour is near 0.9 in the infrared.' },
      { q: 'A metal bench and a wooden bench have been outside all night. The metal feels colder because…', options: ['it is colder', 'it conducts heat away from your skin faster', 'metal makes cold', 'wood is warmer inside'], answer: 1,
        why: 'Both are at the air temperature; the metal’s high effusivity pulls your skin’s surface down to its own temperature.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Ingen-Housz (1789)</b> compared metals with wax-coated rods; the same idea measures conductivities today, with thermocouples instead of wax.</li>' +
      '<li><b>Convection</b> drives sea breezes, hot-water heating, the circulation in a pan of soup and the mantle under our feet.</li>' +
      '<li><b>Leslie’s cube (1804)</b> showed that a surface’s finish, not its colour, decides how much it radiates in the infrared: why heat sinks are anodised and space blankets are shiny.</li>' +
      '<li><b>Ice-melting blocks</b> are sold as a classroom puzzle: the “colder-feeling” block melts ice faster.</li></ul>' +
      '<b>What the lab assumes.</b> The blocks are lumped, with a contact conductance and small losses to a 20 °C room. The rods solve the 1D heat equation with side losses (fin equation), the far end insulated. The tank is a 2D Boussinesq flow on a 48 × 30 grid with an eddy viscosity for what the grid cannot resolve. The thermopile sees the cube’s face as a disc on its axis. Touch uses the semi-infinite contact temperature; the ice block conducts through its thickness and a 0.1 mm meltwater film.' +
      '<div class="pyq"><em>Misconception to catch</em> “Cold flows in” and “metal is colder than wood at the same temperature.” Only energy flows, always from hotter to colder; metal only feels colder because it conducts energy away from your skin faster.</div>'
  });

  const MODEL = Object.assign({}, MODEL0, { BASE: () => preset({}), SETUPS });
  L.models = L.models || {};
  L.models['g6c-heat-transfer'] = MODEL;
})(window.InsightLab);
