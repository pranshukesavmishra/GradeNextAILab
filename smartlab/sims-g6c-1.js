/* ============================================================
   GRADE 6 · UNIT C · ENERGY, HEAT AND THERMAL SYSTEMS
   6C-1  The Energy Chain Bench — Forms, Stores and Transfers
   (C1.1 Forms of energy; C1.2 Kinetic energy; C1.3 Potential energy;
    C1.4 Transfer and transformation; C1.5 Conservation, introduced;
    C1.6 Tracking energy through everyday examples)

   One bench, six experiments, every number in joules:
     forms     — one amount of energy in every form at once: the height it
                 lifts a mass, the speed it gives it, the spring it
                 squeezes, the water it warms, the LED it lights, the sugar
                 that holds it — and where everyday energies sit on a scale
                 of ten decades.
     kinetic   — a spring launcher, a cart on a track, two light gates and a
                 block of modelling clay: ½mv² read off a flag's transit
                 time, and the dent it digs (depth = KE ÷ the clay's yield
                 force).
     potential — the cart released from a height on a ramp of any angle, on
                 any planet: mgh in, ½mv² out, the speed independent of
                 mass and (without friction) of the angle.
     chain     — sunlight → solar panel → battery → motor lifting a mass →
                 the mass falling through a generator → a lamp. Every link
                 has its real efficiency; every lost joule is counted.
     conserve  — the cart rolling to and fro in a valley track: kinetic and
                 gravitational trade, the rest turns to thermal energy in the
                 bearings, the air and a magnetic brake — the ledger sums to
                 the start at every instant.
     everyday  — a kettle, a braking bicycle and a phone on charge, each a
                 computed energy-flow (Sankey) diagram.
   The track is integrated along its own arc length (gravity, rolling
   resistance with the normal force on curves, air drag, eddy braking).
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6C, MEAS, BENCH, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6C;

  /* ---------------- constants ---------------- */
  const G_EARTH = 9.81, RHO_AIR = 1.20, C_WATER = 4186;
  const PLANETS = { earth: { g: 9.81, name: 'Earth' }, moon: { g: 1.62, name: 'the Moon' }, mars: { g: 3.71, name: 'Mars' }, jupiter: { g: 24.79, name: 'Jupiter' } };
  /* rolling-resistance coefficients of the cart's wheels on each surface (and a glider on air) */
  const SURF = { air: { mu: 0.0004, name: 'air track (glider)' }, alu: { mu: 0.004, name: 'aluminium track' }, felt: { mu: 0.035, name: 'felt-lined track' }, sand: { mu: 0.12, name: 'sandpaper strip' } };
  const SPRINGS = { soft: { k: 150, name: 'soft (150 N/m)' }, medium: { k: 400, name: 'medium (400 N/m)' }, stiff: { k: 1000, name: 'stiff (1000 N/m)' } };
  const CART = { m0: 0.25, A: 0.0055, Cd: 1.05, len: 0.17 };     // a dynamics cart: 250 g empty, 5.5 cm² frontal
  const SAILS = { none: 0, small: 0.010, large: 0.040 };            // card sails, m²
  const CLAY_YIELD = 60;                                             // N: modelling clay yields at about 60 N for a 3 cm² nose

  /* ============================================================
     THE TRACK — a centre line z(s), integrated along its arc length
     ============================================================ */
  function profile(kind, o) {
    // returns { pts: [{s,x,z,th,k}], len } sampled every 4 mm
    const P = [], ds = 0.004;
    let x = 0, z = 0, th = 0, s = 0;
    const segs = [];
    if (kind === 'flat') segs.push({ L: o.len || 1.8, k: 0 });
    else if (kind === 'ramp') {
      const a = o.ang * Math.PI / 180, R = 0.25, arc = R * a;
      const hArc = R * (1 - Math.cos(a)), Lr = Math.max(0.02, (o.h - hArc) / Math.sin(a));
      th = -a; z = o.h;
      segs.push({ L: Lr, k: 0 }, { L: arc, k: 1 / R }, { L: o.flat || 1.2, k: 0 });
    } else if (kind === 'valley') {
      const a = (o.ang || 30) * Math.PI / 180, R = 0.35, arc = 2 * R * a, Hs = o.H || 0.45;
      const hArc = R * (1 - Math.cos(a)), Lr = (Hs - hArc) / Math.sin(a);
      th = -a; z = Hs;
      segs.push({ L: Lr, k: 0 }, { L: arc, k: 1 / R }, { L: Lr, k: 0 });
    }
    P.push({ s: 0, x, z, th, k: segs[0].k });
    segs.forEach(sg => {
      const n = Math.max(1, Math.round(sg.L / ds)), h = sg.L / n;
      for (let i = 0; i < n; i++) {
        const th1 = th + sg.k * h;
        x += h * Math.cos((th + th1) / 2); z += h * Math.sin((th + th1) / 2); th = th1; s += h;
        P.push({ s, x, z, th, k: sg.k });
      }
    });
    return { pts: P, len: s };
  }
  function at(pr, s) {
    const P = pr.pts, n = P.length - 1;
    if (s <= 0) { const a = P[0]; return { x: a.x + s * Math.cos(a.th), z: a.z + s * Math.sin(a.th), th: a.th, k: 0 }; }
    if (s >= pr.len) { const a = P[n]; return { x: a.x + (s - pr.len) * Math.cos(a.th), z: a.z + (s - pr.len) * Math.sin(a.th), th: a.th, k: 0 }; }
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].s <= s) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], f = (s - a.s) / (b.s - a.s || 1);
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, th: a.th + (b.th - a.th) * f, k: b.k };
  }

  /* one run of the cart: o = { kind, m, g, mu, sail, brake, h, ang, k, x0, len, gates:[s1,s2], flag, clay, tEnd }
     returns rows {t,s,v,KE,PE,Q,Qroll,Qair,Qbrake,Qclay,Es} and the gate times */
  function cartRun(o) {
    const pr = profile(o.kind, o), g = o.g || G_EARTH, m = o.m, mu = o.mu, Acd = CART.Cd * (CART.A + (o.sail || 0)), b = o.brake || 0;
    const springLen = o.kind === 'flat' ? o.x0 : 0, k = o.k || 0;
    let s = o.s0 || 0, v = 0, t = 0;
    const z0 = at(pr, s).z;
    let Qroll = 0, Qair = 0, Qbrake = 0, Qclay = 0, Es = springLen ? 0.5 * k * springLen * springLen : 0, dent = 0;
    const rows = [], dt = 0.0005, tEnd = o.tEnd || 6, every = 0.01;
    const gates = (o.gates || []).map(sg => ({ s: sg, tIn: null, tOut: null }));
    const flag = o.flag || 0.05, clayAt = o.clay == null ? null : o.clay;
    let stopped = false, next = 0, maxS = 0, peaks = [], lastV = 0, clayHit = null;
    const E0 = m * g * z0 + Es;
    function acc(s, v) {
      const p = at(pr, s), sn = Math.sin(p.th), cs = Math.cos(p.th);
      const N = Math.max(0, m * (g * cs + v * v * p.k));                   // the normal force carries the curve's centripetal part
      let F = -m * g * sn, Fr = 0;
      if (springLen && s < springLen) F += k * (springLen - s);
      const sg = Math.sign(v);
      Fr = mu * N * sg + 0.5 * RHO_AIR * Acd * v * v * sg + b * v;
      return { F, Fr, N, p, roll: mu * N, air: 0.5 * RHO_AIR * Acd * v * v };
    }
    while (t < tEnd) {
      if (t >= next - 1e-12) {
        const p = at(pr, s), PE = m * g * (p.z), KE = 0.5 * m * v * v, Esp = springLen && s < springLen ? 0.5 * k * (springLen - s) * (springLen - s) : 0;
        rows.push({ t, s, v, KE, PE: PE - 0, Esp, Q: Qroll + Qair + Qbrake + Qclay, Qroll, Qair, Qbrake, Qclay, x: p.x, z: p.z, th: p.th, dent });
        next += every;
      }
      if (stopped) { t += dt; continue; }
      // the clay: a constant yield force opposes the cart while it digs in
      const inClay = clayAt != null && s + CART.len / 2 >= clayAt && v > 0;
      if (inClay && clayHit == null) clayHit = { t, v, KE: 0.5 * m * v * v };
      const A1 = acc(s, v), hold = mu * A1.N + (inClay ? CLAY_YIELD : 0);
      if (v === 0) {                                    // at rest: it moves off only if the push beats the resistance
        if (Math.abs(A1.F) <= hold + 1e-12) { stopped = true; t += dt; continue; }
      }
      const dir = v !== 0 ? Math.sign(v) : Math.sign(A1.F);
      const fr = (A, vv) => dir * (A.roll + A.air + (inClay ? CLAY_YIELD : 0)) + b * vv;
      const vh = v + (A1.F - fr(A1, v)) / m * dt / 2, A2 = acc(s + v * dt / 2, vh);     // the midpoint (second-order) step
      let v1 = v + (A2.F - fr(A2, vh)) / m * dt, sNew = s + vh * dt;
      if (v !== 0 && Math.sign(v1) !== Math.sign(v)) {   // turns round, or comes to rest, inside this step
        peaks.push({ t, s, z: at(pr, s).z });
        v1 = 0; sNew = s + v / 2 * dt;                    // pass through rest; the next step decides whether it moves off again
      }
      const dsAbs = Math.abs(sNew - s);
      Qroll += A2.roll * dsAbs; Qair += A2.air * dsAbs; Qbrake += b * vh * vh * dt;
      if (inClay) { Qclay += CLAY_YIELD * dsAbs; dent += dsAbs; }
      // light gates: the flag's leading edge is at the cart's front
      gates.forEach(G => {
        const front0 = s + CART.len / 2 - 0.02, front1 = sNew + CART.len / 2 - 0.02;
        if (G.tIn == null && front0 < G.s && front1 >= G.s) G.tIn = t + dt * (G.s - front0) / (front1 - front0 || 1);
        if (G.tIn != null && G.tOut == null && front0 - flag < G.s && front1 - flag >= G.s) G.tOut = t + dt * (G.s - (front0 - flag)) / ((front1 - front0) || 1);
      });
      s = sNew; v = v1; t += dt; maxS = Math.max(maxS, s);
    }
    gates.forEach(G => { G.dt = G.tIn != null && G.tOut != null ? G.tOut - G.tIn : null; G.v = G.dt ? flag / G.dt : null; });
    return { rows, gates, pr, E0, m, g, dent, clayHit, peaks, z0, Es };
  }
  const rowAt = (rows, t) => rows[clamp(Math.round(t / 0.01), 0, rows.length - 1)];

  /* ============================================================
     FORMS — one amount of energy, every form
     ============================================================ */
  const FOOD_KJ_PER_G_SUGAR = 16.7, AA_J = 2.85 * 3600 * 1, LED_W = 1, SHOUT_W = 0.001;
  function equivalents(E, mRef) {
    return {
      lift: E / (mRef * G_EARTH),                  // m
      speed: Math.sqrt(2 * E / mRef),              // m/s
      spring: Math.sqrt(2 * E / 1000),             // m, a 1000 N/m spring
      warm: E / (0.1 * C_WATER),                   // K, 100 mL of water
      led: E / LED_W,                              // s of a 1 W LED
      sugar: E / (FOOD_KJ_PER_G_SUGAR * 1000),     // g of sugar
      aa: E / AA_J,                                // AA batteries
      shout: E / SHOUT_W                           // s of shouting (1 mW of sound)
    };
  }
  /* everyday energies on a ten-decade scale, J */
  const SCALE = [
    ['A shout for one second', 1e-3], ['Lifting an apple 1 m', 1], ['A thrown baseball (40 m/s)', 116], ['A 1 W LED for a minute', 60],
    ['Climbing one storey (60 kg)', 1.8e3], ['An AA battery', AA_J], ['A phone battery (15 Wh)', 5.4e4], ['A kettle of tea (1 L, 20→100 °C)', 3.35e5],
    ['A chocolate bar (250 kcal)', 1.05e6], ['A car at 100 km/h (1.4 t)', 5.4e5], ['A litre of petrol', 3.4e7], ['A day of a person’s food', 1.0e7]
  ];

  /* ============================================================
     THE CHAIN — sunlight to lamp, link by link
     ============================================================ */
  const PANELS = { mono: { eta: 0.21, name: 'monocrystalline (21 %)' }, poly: { eta: 0.17, name: 'polycrystalline (17 %)' }, thin: { eta: 0.08, name: 'amorphous thin-film (8 %)' } };
  const BATTS = { liion: { eta: 0.95, name: 'lithium-ion (95 %)' }, nimh: { eta: 0.80, name: 'nickel–metal hydride (80 %)' } };
  const MOTORS = { toy: { eta: 0.45, name: 'toy brushed motor (45 %)' }, coreless: { eta: 0.78, name: 'coreless motor (78 %)' } };
  const LAMPS = { led: { eta: 0.35, name: 'LED (35 % light)' }, filament: { eta: 0.05, name: 'filament bulb (5 % light)' } };
  const CHAIN = { A: 0.05, Pm: 3.0, gear: 0.90, vFall: 0.25, E0: 120, Emax: 7200 };   // panel 25 × 20 cm; motor draws 3 W; a 2 Wh battery starting with 120 J in it
  function chainRun(o) {
    // o = { G, tilt, panel, batt, motor, lamp, m, h, tEnd }
    const Pl = o.G * CHAIN.A * Math.cos(o.tilt * Math.PI / 180), ep = PANELS[o.panel].eta, eb = BATTS[o.batt].eta, em = MOTORS[o.motor].eta, eg = CHAIN.gear, el = LAMPS[o.lamp].eta;
    const m = o.m, H = o.h, g = G_EARTH, dt = 0.01, tEnd = o.tEnd || 120;
    let t = 0, E_bat = CHAIN.E0, z = 0, phase = 'lift', Ein = 0, Elight = 0, lifts = 0, flat = false;
    const Q = { panel: 0, batt: 0, motor: 0, gear: 0, gen: 0, lamp: 0 };
    const rows = [];
    const vLift = em * eg * CHAIN.Pm / (m * g);
    for (let i = 0; t <= tEnd + 1e-9; i++) {
      if (i % 25 === 0) rows.push({ t, Ein, Ebat: E_bat - CHAIN.E0, PE: m * g * z, light: Elight, Q: Object.assign({}, Q), z, phase, flat, lifts });
      // sunlight on the panel, every step
      const Pe = ep * Pl; Ein += Pl * dt; Q.panel += (Pl - Pe) * dt;
      let Pin = eb * Pe; Q.batt += (Pe - Pin) * dt; E_bat += Pin * dt;
      if (E_bat > CHAIN.Emax) { Q.batt += E_bat - CHAIN.Emax; E_bat = CHAIN.Emax; }   // full: the controller sheds the rest as heat
      if (phase === 'lift') {
        if (E_bat > CHAIN.Pm * dt) {
          flat = false;
          const Pmech = em * CHAIN.Pm, Pout = eg * Pmech;
          E_bat -= CHAIN.Pm * dt; Q.motor += (CHAIN.Pm - Pmech) * dt; Q.gear += (Pmech - Pout) * dt;
          z += Pout / (m * g) * dt;
          if (z >= H) { Q.gear += (z - H) * m * g * 0; z = H; phase = 'fall'; lifts++; }
        } else flat = true;
      } else {
        // the mass falls at a steady speed through the generator: mg v in, the rest out as light and heat
        const dz = Math.min(z, CHAIN.vFall * dt), Pin2 = m * g * dz;
        const Pmech = eg * Pin2, Pel = em * Pmech, Plight = el * Pel;
        Q.gear += Pin2 - Pmech; Q.gen += Pmech - Pel; Q.lamp += Pel - Plight; Elight += Plight;
        z -= dz;
        if (z <= 1e-9) { z = 0; phase = 'lift'; }
      }
      t += dt;
    }
    const pathEff = eg * em * el;                                             // light out per joule of fall
    const overall = ep * eb * em * eg * eg * em * el;                         // sunlight to lamp light, link by link
    return { rows, Pl, vLift, overall, pathEff, links: [['panel', ep], ['battery', eb], ['motor', em], ['pulley up', eg], ['pulley down', eg], ['generator', em], ['lamp', el]] };
  }

  /* ============================================================
     EVERYDAY — a kettle, a braking bike, a phone on charge
     ============================================================ */
  const KETTLE = { mBody: 0.55, cBody: 500, hA: 1.6, hm: 0.01, Aopen: 0.015, Alid: 0.0012, Lv: 2.26e6 };   // body: 550 g of steel and element; 1.6 W/K from its sides; vapour carried off at 1 cm/s over the open top (or the spout)
  function pSat(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }                        // kPa (Tetens)
  function kettleRun(o) {
    // o = { P, V (L), T0, lid }: lumped water + body; losses by convection from the body and evaporation from the water surface
    const mw = o.V, Ta = 20, dt = 0.5;
    let T = o.T0, t = 0, Ew = 0, Eb = 0, Eloss = 0, Eevap = 0, Ein = 0;
    const rows = [];
    const C = mw * C_WATER + KETTLE.mBody * KETTLE.cBody, frac = mw * C_WATER / C;
    while (T < 100 && t < 1800) {
      if (Math.round(t / dt) % 4 === 0) rows.push({ t, T, Ew, Eb, Eloss: Eloss + Eevap, Ein });
      const loss = KETTLE.hA * (T - Ta);
      const rhoV = pSat(T) * 1000 / (461.5 * (T + 273.15)), rhoA = 0.6 * pSat(Ta) * 1000 / (461.5 * (Ta + 273.15));   // vapour density at the water, and in the room (60 % RH)
      const evap = KETTLE.hm * (o.lid ? KETTLE.Alid : KETTLE.Aopen) * Math.max(0, rhoV - rhoA) * KETTLE.Lv;          // W carried off as steam
      const net = o.P - loss - evap, dT = net / C * dt;
      Ein += o.P * dt; Ew += frac * net * dt; Eb += (1 - frac) * net * dt; Eloss += loss * dt; Eevap += evap * dt;
      T += dT; t += dt;
    }
    rows.push({ t, T: Math.min(T, 100), Ew, Eb, Eloss: Eloss + Eevap, Ein });
    const ideal = mw * C_WATER * (100 - o.T0) / o.P;
    return { rows, t, Ein, Ew, Eb, Eloss, Eevap, eff: Ew / Ein, ideal };
  }
  const BRAKES = { disc: { m: 0.12, c: 490, share: 0.85, name: 'disc (a 120 g steel rotor)' }, rim: { m: 0.45, c: 900, share: 0.85, name: 'rim (a 450 g aluminium rim)' } };
  function bikeRun(o) {
    // o = { m (kg, rider + bike), v0 (m/s), brake, decel (m/s²) }: the brakes supply decel, air drag and rolling help
    const Cd_A = 0.5, Crr = 0.005, g = G_EARTH, dt = 0.002, B = BRAKES[o.brake];
    let v = o.v0, t = 0, x = 0, Qb = 0, Qa = 0, Qr = 0;
    const rows = [];
    const Fb = o.m * o.decel;
    while (v > 0) {
      if (Math.round(t / dt) % 10 === 0) rows.push({ t, v, x, KE: 0.5 * o.m * v * v, Qb, Qa, Qr });
      const Fa = 0.5 * RHO_AIR * Cd_A * v * v, Fr = Crr * o.m * g, a = (Fb + Fa + Fr) / o.m;
      const v1 = Math.max(0, v - a * dt), vm = (v + v1) / 2, dx = vm * dt;
      Qb += Fb * dx; Qa += Fa * dx; Qr += Fr * dx; x += dx; v = v1; t += dt;
    }
    rows.push({ t, v: 0, x, KE: 0, Qb, Qa, Qr });
    const KE0 = 0.5 * o.m * o.v0 * o.v0, dT = Qb * B.share / (B.m * B.c);
    return { rows, t, x, KE0, Qb, Qa, Qr, dT, pads: Qb * (1 - B.share) };
  }
  const CHARGERS = { old: { eta: 0.62, name: 'old linear plug pack (62 %)' }, std: { eta: 0.85, name: 'switch-mode charger (85 %)' }, gan: { eta: 0.92, name: 'GaN fast charger (92 %)' } };
  function phoneRun(o) {
    // o = { W (charger rating), cap (Wh), charger }: constant power to 80 %, then the current tapers (CC–CV)
    const ec = CHARGERS[o.charger].eta, eBat = 0.95, Rcable = 0.15, V = o.W > 18 ? 9 : 5, dt = 5;
    let soc = 0.10, t = 0, Ein = 0, Qc = 0, Qcab = 0, Qb = 0, Es = 0;
    const capJ = o.cap * 3600, rows = [];
    while (soc < 0.995 && t < 5 * 3600) {
      if (Math.round(t / dt) % 12 === 0) rows.push({ t, soc, Ein, Qc, Qcab, Qb, Es });
      const taper = soc < 0.8 ? 1 : Math.max(0.06, (1 - soc) / 0.2);
      const Pout = Math.min(o.W, 4 * o.cap) * taper;                          // the phone accepts at most 4 C
      const I = Pout / V, Pcab = I * I * Rcable, Pbat = Pout - Pcab, Pwall = Pout / ec;
      Ein += Pwall * dt; Qc += (Pwall - Pout) * dt; Qcab += Pcab * dt; Qb += Pbat * (1 - eBat) * dt; Es += Pbat * eBat * dt;
      soc += Pbat * eBat * dt / capJ; t += dt;
    }
    rows.push({ t, soc, Ein, Qc, Qcab, Qb, Es });
    return { rows, t, Ein, Qc, Qcab, Qb, Es, eff: Es / Ein };
  }

  const MODEL0 = { profile, at, cartRun, rowAt, equivalents, SCALE, chainRun, kettleRun, bikeRun, phoneRun, PLANETS, SURF, SPRINGS, CART, SAILS, CLAY_YIELD, PANELS, BATTS, MOTORS, LAMPS, CHAIN, BRAKES, CHARGERS };
  /* ============================================================
     SET-UPS, PARAMETERS, RUNS
     ============================================================ */
  const SETUPS = [
    { value: 'forms', label: 'One amount of energy, every form', teaches: ['C1.1'] },
    { value: 'kinetic', label: 'Speed, mass and ½mv²', teaches: ['C1.2'] },
    { value: 'potential', label: 'Height, gravity and mgh', teaches: ['C1.3'] },
    { value: 'chain', label: 'Sunlight to lamplight, link by link', teaches: ['C1.4', 'C1.1'] },
    { value: 'conserve', label: 'Where did the energy go?', teaches: ['C1.5'] },
    { value: 'everyday', label: 'A kettle, a brake, a charger', teaches: ['C1.6', 'C1.4'] }
  ];
  const MAG = { off: 0, weak: 0.15, strong: 0.6 };                   // eddy-current brake, N per (m/s)
  const BASE = {
    setup: 'chain', logE: 0, mRef: 0.1, wV: 0.1, spring: 'medium', comp: 5, m: 0.5, surf: 'alu', flag: 5,
    h: 0.3, ang: 30, planet: 'earth', G: 1000, tilt: 0, panel: 'mono', batt: 'liion', motor: 'coreless', lamp: 'led', lift: 0.5,
    h0: 0.35, sail: 'none', mag: 'off', device: 'kettle', kP: 2000, kV: 1.0, kT0: 20, lid: true, bm: 80, bv: 8, brake: 'disc', decel: 4,
    cW: 20, cap: 15, charger: 'std', ledger: 'sankey'
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const is = (...v) => S => v.indexOf(S.p.setup) >= 0;
  const isDev = d => S => S.p.setup === 'everyday' && S.p.device === d;
  const TRACKS = { kinetic: 1, potential: 1, conserve: 1 };

  function trackOpts(p) {
    const mu = SURF[p.surf].mu;
    if (p.setup === 'kinetic') return { kind: 'flat', len: 1.8, m: p.m, mu, k: SPRINGS[p.spring].k, x0: p.comp / 100, gates: [0.70, 1.00], flag: p.flag / 100, clay: 1.55, tEnd: 5 };
    if (p.setup === 'potential') {
      const pr = profile('ramp', { h: p.h, ang: p.ang, flat: 1.0 }), sb = pr.len - 1.0 + 0.20;
      return { kind: 'ramp', h: p.h, ang: p.ang, flat: 1.0, m: p.m, g: PLANETS[p.planet].g, mu, gates: [sb, sb + 0.40], flag: 0.05, clay: pr.len - 0.10, tEnd: 7 };
    }
    const a = 30 * Math.PI / 180, s0 = (0.45 - p.h0) / Math.sin(a);
    return { kind: 'valley', H: 0.45, ang: 30, m: p.m, mu, sail: SAILS[p.sail], brake: MAG[p.mag], s0, tEnd: 40 };
  }
  function trackOf(S) {
    const p = S.p, key = [p.setup, p.m, p.surf, p.spring, p.comp, p.flag, p.h, p.ang, p.planet, p.h0, p.sail, p.mag].join('|');
    if (S._tr && S._tr.key === key) return S._tr.R;
    const o = trackOpts(p), R = cartRun(o); R.o = o;
    S._tr = { key, R };
    return R;
  }
  function chainOf(S) {
    const p = S.p, key = [p.G, p.tilt, p.panel, p.batt, p.motor, p.lamp, p.m, p.lift].join('|');
    if (S._ch && S._ch.key === key) return S._ch.R;
    const R = chainRun({ G: p.G, tilt: p.tilt, panel: p.panel, batt: p.batt, motor: p.motor, lamp: p.lamp, m: p.m, h: p.lift, tEnd: 90 });
    S._ch = { key, R };
    return R;
  }
  function devOf(S) {
    const p = S.p, key = [p.device, p.kP, p.kV, p.kT0, p.lid, p.bm, p.bv, p.brake, p.decel, p.cW, p.cap, p.charger].join('|');
    if (S._dv && S._dv.key === key) return S._dv.R;
    const R = p.device === 'kettle' ? kettleRun({ P: p.kP, V: p.kV, T0: p.kT0, lid: p.lid })
      : p.device === 'bike' ? bikeRun({ m: p.bm, v0: p.bv, brake: p.brake, decel: p.decel })
        : phoneRun({ W: p.cW, cap: p.cap, charger: p.charger });
    S._dv = { key, R };
    return R;
  }
  /* how long each set-up's run lasts on screen, and how fast its clock runs */
  function runSpan(S) {
    const p = S.p;
    if (TRACKS[p.setup]) { const R = trackOf(S); return { end: R.o.tEnd, rate: p.setup === 'conserve' ? 1 : 0.4, loop: p.setup !== 'conserve' }; }
    if (p.setup === 'chain') return { end: 90, rate: 3 };
    if (p.setup === 'everyday') { const R = devOf(S); return { end: R.t, rate: p.device === 'kettle' ? 20 : p.device === 'bike' ? 0.5 : 400 }; }
    return { end: 3, rate: 1 };
  }

  const HOMES = {
    forms: { theta: -1.42, phi: 0.24, dist: 1.85, target: [-0.10, 0, 0.30], shift: 0.24 },
    chain: { theta: -1.34, phi: 0.22, dist: 1.70, target: [-0.04, 0.02, 0.36], shift: 0.25 },
    everyday: { theta: -1.30, phi: 0.30, dist: 1.0, target: [0.0, 0.0, 0.16], shift: 0.16 },
    bike: { theta: -1.22, phi: 0.18, dist: 1.75, target: [0.0, 0.0, 0.34], shift: 0.28 },
    phone: { theta: -1.30, phi: 0.42, dist: 0.80, target: [0.02, 0.06, 0.06], shift: 0.12 }
  };
  function trackGeom(S) {
    const p = S.p, R = trackOf(S), pr = R.pr;
    let off;
    if (p.setup === 'kinetic') off = [-0.9, 0, 0.022];
    else if (p.setup === 'potential') off = [-0.25 - at(pr, pr.len - 1.0).x, 0, 0.022];
    else off = [-at(pr, pr.len / 2).x, 0, 0.03];
    const xs = pr.pts.map(q => q.x + off[0]), zs = pr.pts.map(q => q.z + off[2]);
    return { R, pr, off, x0: Math.min(...xs), x1: Math.max(...xs), zTop: Math.max(...zs) };
  }
  function setup(S) {
    const p = S.p;
    p.m = clamp(Math.round(p.m * 4) / 4, 0.25, 2);
    S.tr = 0; S._tr = null; S._ch = null; S._dv = null; S.ta = S.ta || 0;
    if (!S.cam || S.camFor !== p.setup + (TRACKS[p.setup] ? '' : '') || S.camKey !== trackKey(p)) {
      let h;
      if (TRACKS[p.setup]) {
        const T = trackGeom(S), span = T.x1 - T.x0;
        h = { theta: -1.40, phi: 0.22, dist: 0.6 + span * 0.92 + T.zTop * 0.5, target: [(T.x0 + T.x1) / 2 + (S._narrow ? 0 : span * 0.16), 0, 0.06 + T.zTop * 0.3] };
      } else { h = Object.assign({}, HOMES[p.setup === 'everyday' && p.device !== 'kettle' ? p.device : p.setup]); h.target = h.target.slice(); if (!S._narrow) h.target[0] += h.shift; }
      S._shift = TRACKS[p.setup] ? (S._narrow ? 0 : (trackGeom(S).x1 - trackGeom(S).x0) * 0.16) : (S._narrow ? 0 : h.shift);
      const keep = S.cam && S.camFor === p.setup && S.camKey === trackKey(p);
      const th = keep ? S.cam.theta : h.theta, ph = keep ? S.cam.phi : h.phi;
      S.cam = Camera({ theta: th, phi: ph, dist: h.dist * (S._narrow ? 1.3 : 1), target: h.target.slice(), fov: 0.72 });
      S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist * (S._narrow ? 1.3 : 1) };
      S.cam.minDist = 0.35; S.cam.maxDist = 6; S.camFor = p.setup; S.camKey = trackKey(p); S._narrowCam = !!S._narrow;
    }
  }
  const trackKey = p => TRACKS[p.setup] ? [p.setup, p.h, p.ang].join('|') : p.setup === 'everyday' ? p.device : '';
  function step(S, dt) {
    const sp = runSpan(S);
    S.ta = (S.ta || 0) + dt;
    S.tr = (S.tr || 0) + dt * sp.rate;
    if (sp.loop && S.tr > sp.end + 1.0) S.tr = 0;          // a launch is over in a second: run it again, in slow motion
    S.tr = Math.min(S.tr, sp.loop ? sp.end + 1.0 : sp.end);
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  function tag(ctx, x, y, text, col, o) {
    o = o || {};
    ctx.save(); ctx.font = mono(o.size || 9.5, 600);
    const w = ctx.measureText(text).width + 10, h = (o.size || 9.5) + 7;
    let X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    if (o.W) X = clamp(X, 4, o.W - w - 4);
    ctx.fillStyle = o.fill || 'rgba(6,10,20,.82)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X, y - h / 2, w, h, 3); else ctx.rect(X, y - h / 2, w, h); ctx.fill();
    if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = col || '#E8EEF8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + 5, y + 0.5);
    ctx.restore();
    return { x: X, w, h };
  }
  const fJ = J => { const a = Math.abs(J); if (a < 5e-7) return '0 J'; return a >= 1e6 ? (J / 1e6).toFixed(a >= 1e7 ? 1 : 2) + ' MJ' : a >= 1e3 ? (J / 1e3).toFixed(a >= 1e4 ? 1 : 2) + ' kJ' : a >= 1 ? J.toFixed(a >= 100 ? 0 : 2) + ' J' : a >= 1e-3 ? (J * 1e3).toFixed(1) + ' mJ' : J.toExponential(1) + ' J'; };
  const fLen = m => m >= 1000 ? (m / 1000).toFixed(m >= 1e4 ? 0 : 1) + ' km' : m >= 1 ? m.toFixed(m >= 100 ? 0 : 2) + ' m' : m >= 0.01 ? (m * 100).toFixed(1) + ' cm' : m >= 1e-5 ? (m * 1000).toFixed(2) + ' mm' : (m * 1e6).toFixed(2) + ' µm';
  const fT = s => s >= 3600 ? (s / 3600).toFixed(1) + ' h' : s >= 120 ? (s / 60).toFixed(1) + ' min' : s >= 1 ? s.toFixed(s >= 10 ? 0 : 1) + ' s' : (s * 1000).toFixed(0) + ' ms';
  const fK = K => K >= 1 ? K.toFixed(K >= 100 ? 0 : 2) + ' K' : K >= 1e-3 ? (K * 1000).toFixed(1) + ' mK' : (K * 1e6).toFixed(1) + ' µK';
  const fM = g => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g >= 1 ? g.toFixed(1) + ' g' : g >= 1e-3 ? (g * 1000).toFixed(1) + ' mg' : (g * 1e6).toFixed(1) + ' µg';
  /* a stage handle that slides a parameter along a projected world axis (InsightVis §2.13: the drawn map inverted, then a gain) */
  function axisHandle(S, g, id, a, b, lo, hi, key) {
    const qa = S.cam.project(a), qb = S.cam.project(b); if (!qa.ok || !qb.ok) return;
    const dx = qb.x - qa.x, dy = qb.y - qa.y, len = Math.hypot(dx, dy) || 1;
    S._ax = S._ax || {}; S._ax[id] = { ux: dx / len, uy: dy / len, len, lo, hi, key };
    const f = clamp((S.p[key] - lo) / (hi - lo), 0, 1), x = qa.x + dx * f, y = qa.y + dy * f;
    g.handle(x, y, 13, id);
    const ctx = g.ctx; ctx.save(); ctx.strokeStyle = g.dragging === id ? '#FFD36B' : 'rgba(255,211,107,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,211,107,.25)'; ctx.fill(); ctx.restore();
  }
  function scene(S, g, x0, x1, y0, y1, wall) {
    const ctx = g.ctx, W = g.w, H = g.h, M = window.MEAS;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9FAAB6'); bg.addColorStop(1, '#CDD4DA');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const R3 = window.R3, F0 = R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
    if (S.cam.eye[1] < y1) M.tileWall(F0, x0 - 0.3, x1 + 0.3, y1 + 0.01, 0, wall || 1.3);
    M.bench(F0, x0, x1, y0, y1, {});
    F0.render();
    return R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
  }

  /* ============================================================
     THE STAGE — the track set-ups (kinetic, potential, conserve)
     ============================================================ */
  function drawTrack(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, cam = S.cam, R3 = window.R3;
    const T = trackGeom(S), R = T.R, pr = T.pr, off = T.off, row = rowAt(R.rows, S.tr);
    const F = scene(S, g, T.x0 - 0.25, T.x1 + 0.25, -0.32, 0.30, Math.max(1.0, T.zTop + 0.5));
    A.track(F, pr.pts, { off, surface: p.surf === 'felt' ? '#4A3E64' : p.surf === 'sand' ? '#8C7650' : undefined });
    if (p.setup === 'kinetic') {
      const st = at(pr, 0), x0 = st.x + off[0];
      const comp = row.s < R.o.x0 ? R.o.x0 - row.s : 0;
      A.launcher(F, [x0 - 0.065, 0, off[2] + 0.004], comp + 0.0, 0.07, { latch: S.tr < 0.02 });
    }
    // gates
    (R.o.gates || []).forEach((sg, i) => {
      const q = at(pr, sg), gx = q.x + off[0];
      const front = row.s + CART.len / 2 - 0.02, blocked = front >= sg && front - (R.o.flag || 0.05) < sg;
      window.BENCH.photogate(F, [gx, 0, q.z + off[2] - 0.022], [0, 1, 0], 0.17, { height: 0.17, beamZ: 0.105, blocked });
      R3.label(F, [gx, -0.10, q.z + off[2] + 0.20], 'gate ' + (i + 1), '#E8EEF8', { size: 9 });
    });
    // clay
    if (R.o.clay != null) { const q = at(pr, R.o.clay), cx = q.x + off[0]; A.clay(F, [cx + CART.len / 2 - 0.04, 0, q.z + off[2]], row.dent); }
    // the cart where it is now
    const q = at(pr, row.s), c = [q.x + off[0], 0, q.z + off[2]];
    const bars = Math.round((p.m - CART.m0) / 0.25);
    const cr = A.cart(F, c, q.th, { bars, flag: R.o.flag || (p.setup === 'conserve' ? 0 : 0.05), sail: R.o.sail, magnet: (R.o.brake || 0) > 0, phase: row.s / 0.0145 });
    // the magnet brake's poles along the valley floor
    if (p.setup === 'conserve' && R.o.brake > 0) {
      const mid = at(pr, pr.len / 2);
      [-1, 1].forEach(sd => R3.box(F, [mid.x + off[0], sd * 0.075, mid.z + off[2] + 0.005], [0.22, 0.02, 0.05], '#B83A3A', { shadow: false }));
      R3.label(F, [mid.x + off[0], 0.12, mid.z + off[2] + 0.07], 'magnet brake', '#FFB0A8', { size: 9 });
    }
    // every turn-round so far, marked where it happened: each a little lower than the last
    if (p.setup === 'conserve') R.peaks.filter(pk => pk.t <= S.tr).forEach((pk, i) => {
      const q2 = at(pr, pk.s), w = [q2.x + off[0], -0.075, q2.z + off[2] + 0.03];
      R3.sphere(F, w, 0.009, i % 2 ? '#FF9A5A' : '#FFD36B', { shadow: false, bias: -0.02 });
      if (i < 4) R3.label(F, [w[0], w[1] - 0.02, w[2] + 0.035], (q2.z).toFixed(3) + ' m', '#FFE2B0', { size: 8.5 });
    });
    // a ruler for the height on the ramp or valley
    if (p.setup !== 'kinetic') {
      const xr = T.x0 - 0.12;
      window.BENCH.rule(F, [xr, 0.06, 0.0], [0, 0, 1], Math.min(1, Math.ceil((T.zTop + 0.05) * 10) / 10), { up: [1, 0, 0], width: 0.03 });
    }
    // the start height marker and the speed arrow
    if (Math.abs(row.v) > 0.02) {
      const d = [Math.cos(q.th) * Math.sign(row.v), 0, Math.sin(q.th) * Math.sign(row.v)], len = clamp(Math.abs(row.v) * 0.09, 0.03, 0.32), o0 = [c[0], 0.075, c[2] + 0.05];
      R3.arrow(F, o0, [o0[0] + d[0] * len, o0[1], o0[2] + d[2] * len], 0.006, A.FORM.kinetic, { bias: -0.03 });
    }
    F.render();
    // labels in screen space: cart value
    const qc = cam.project(cr.top);
    if (qc.ok) tag(ctx, qc.x, qc.y - 24, (p.m).toFixed(2) + ' kg · ' + Math.abs(row.v).toFixed(2) + ' m/s', '#E8EEF8', { align: 'center', W });
    // handles
    if (p.setup === 'kinetic') { const st = at(pr, 0); axisHandle(S, g, 'comp', [st.x + off[0] - 0.005, 0, off[2] + 0.036], [st.x + off[0] - 0.085, 0, off[2] + 0.036], 1, 8, 'comp'); }
    if (p.setup === 'potential') { const st = at(pr, 0); axisHandle(S, g, 'h', [st.x + off[0], -0.07, off[2]], [st.x + off[0], -0.07, off[2] + 0.6], 0, 0.6, 'h'); }
    if (p.setup === 'conserve') { const a0 = at(pr, 0); const xa = a0.x + off[0]; axisHandle(S, g, 'h0', [xa + (0.45) / Math.tan(Math.PI / 6), -0.07, off[2]], [xa, -0.07, off[2] + 0.45], 0, 0.45, 'h0'); }
    // the ledger card
    const at2 = K.cardSlot(g, S, 'energy ledger', Math.min(280, W * 0.3), { x: W - Math.min(280, W * 0.3) - 10, y: K.HDR + 4 });
    if (at2) ledgerCard(g, S, at2.x, at2.y, at2.w, R, row);
    const lead = p.setup === 'kinetic' ? 'Spring ' + fJ(R.Es) + ' → cart: ' + (R.gates[0].v ? 'gate 1 reads ' + R.gates[0].v.toFixed(3) + ' m/s, so ½mv² = ' + fJ(0.5 * p.m * R.gates[0].v * R.gates[0].v) : 'not yet at the gates')
      : p.setup === 'potential' ? 'From ' + p.h.toFixed(2) + ' m on ' + PLANETS[p.planet].name + ': mgh = ' + fJ(R.E0) + (R.gates[0].v ? ' → ' + R.gates[0].v.toFixed(3) + ' m/s at gate 1' : '')
        : 'Released from ' + p.h0.toFixed(2) + ' m: ' + fJ(R.E0) + ' at the start — still ' + fJ(row.KE + Math.max(0, row.PE) + row.Q) + ' in the ledger';
    K.header(g, lead,
      'KE ' + fJ(row.KE) + ' · PE ' + fJ(Math.max(0, row.PE)) + (row.Esp > 1e-6 ? ' · spring ' + fJ(row.Esp) : '') + ' · thermal ' + fJ(row.Q) + ' · t = ' + S.tr.toFixed(2) + ' s',
      p.setup === 'conserve' ? 'drag the yellow ring to set the release height · thermal energy is the bucket you cannot see' : p.setup === 'potential' ? 'drag the yellow ring up the ramp · the speed at the bottom does not depend on the mass · slow motion 0.4×' : 'drag the yellow ring to squeeze the spring · the gates time the black flag · slow motion 0.4×');
  }
  function ledgerCard(g, S, x, y, w, R, row) {
    const ctx = g.ctx, A = ART(), K = kit(), h = 170;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.94)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText('Where the ' + fJ(R.E0) + ' is now', x + 10, y + 8); ctx.restore();
    const bars = [{ label: 'kinetic', J: row.KE, colour: A.FORM.kinetic }, { label: 'height', J: Math.max(0, row.PE), colour: A.FORM.gravitational }];
    if (S.p.setup === 'kinetic') bars.push({ label: 'spring', J: row.Esp, colour: A.FORM.elastic });
    bars.push({ label: 'thermal', J: row.Q, colour: A.FORM.thermal }, { label: 'total', J: row.KE + row.PE + row.Esp + row.Q, colour: '#DCE4F0', dash: true });
    bars.forEach(b => { b.text = fJ(b.J); });
    A.energyBars(ctx, x + 6, y + 24, w - 12, h - 30, bars, { max: R.E0 * 1.02 });
  }

  /* ============================================================
     THE STAGE — forms
     ============================================================ */
  function drawForms(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, M = window.MEAS, R3 = window.R3, BENCH = window.BENCH;
    const E = Math.pow(10, p.logE), Q = equivalents(E, p.mRef), k = SPRINGS[p.spring].k, xsp = Math.sqrt(2 * E / k), dT = E / (p.wV * C_WATER);
    const F = scene(S, g, -0.80, 0.70, -0.30, 0.28, 1.0);
    const ph = S.ta || 0, mTxt = (p.mRef >= 1 ? p.mRef.toFixed(0) : p.mRef.toFixed(1)) + ' kg', narrow = S._narrow;
    const co = (at, dx, dy, txt, col) => R3.callout(F, at, narrow ? dx * 0.6 : dx, dy, txt, col, { keep: true, size: narrow ? 8.5 : 9.5 });
    // 1. lift: a pulley on a stand, the mass raised by h (drawn up to 0.55 m, the label honest)
    const hl = Q.lift, hz = clamp(hl, 0, 0.55), sx = -0.58, hub = 0.70;
    const top = BENCH.clampStand(F, [sx, 0.12, 0], hub + 0.05, {});
    BENCH.bossClamp(F, [top[0], top[1], hub], {});
    BENCH.pulley(F, [sx + 0.05, 0.12, hub], [0, 1, 0], 0.03, { phase: hz * 20 });
    const mx = sx + 0.08, mz = 0.03 + hz + 0.06;
    BENCH.string(F, [[mx, 0.12, hub], [mx, 0.12, mz]], {});
    A.slottedMass(F, [mx, 0.12, mz], Math.min(p.mRef, 2), { colour: p.mRef >= 50 ? '#8E98A8' : '#C7A24A' });
    BENCH.rule(F, [mx + 0.06, 0.08, 0], [0, 0, 1], 0.6, { up: [-1, 0, 0], width: 0.03 });
    co([mx, 0.12, mz - 0.03], 34, 30, 'gravitational: lifts ' + mTxt + ' ' + fLen(hl) + (hl > 0.55 ? ' ↑' : ''), A.FORM.gravitational);
    // 2. speed: a cart on a short track, its arrow the speed
    const pr = profile('flat', { len: 0.36 }), offx = -0.40;
    A.track(F, pr.pts, { off: [offx, -0.08, 0.022], legs: false, seg: 0.06 });
    const cx = offx + 0.12 + ((ph * Math.min(Q.speed, 3) * 0.05) % 0.12);
    A.cart(F, [cx, -0.08, 0.022], 0, { bars: 0 });
    const al = clamp(0.05 + Math.log10(1 + Q.speed) * 0.10, 0.05, 0.28);
    R3.arrow(F, [cx, -0.08, 0.11], [cx + al, -0.08, 0.11], 0.006, A.FORM.kinetic, { bias: -0.03 });
    co([cx, -0.08, 0.06], -10, 46, 'kinetic: ' + mTxt + ' at ' + (Q.speed >= 100 ? Q.speed.toFixed(0) : Q.speed.toFixed(2)) + ' m/s', A.FORM.kinetic);
    // 3. the spring, squeezed by x between a base and a plate
    const spx = 0.02, free = 0.14, xs = Math.min(xsp, free * 0.85);
    R3.box(F, [spx, 0.02, 0.01], [0.09, 0.09, 0.02], '#2F3744', { shadow: false });
    BENCH.spring(F, [spx, 0.02, 0.02], [spx, 0.02, 0.02 + free - xs], 0.022, 10, { colour: '#4DD9A8' });
    R3.cylinder(F, [spx, 0.02, 0.02 + free - xs], [spx, 0.02, 0.03 + free - xs], 0.035, '#AEB7C3', { segments: 22, shadow: false });
    co([spx, 0.02, 0.03 + free - xs], 8, -60, 'elastic: squeezes ' + fLen(xsp), A.FORM.elastic);
    // 4. warm: a beaker of water and a thermometer
    const bx = 0.19, bh = p.wV >= 1 ? 0.15 : p.wV >= 0.1 ? 0.085 : 0.045, br = p.wV >= 1 ? 0.058 : p.wV >= 0.1 ? 0.034 : 0.016;
    const lv = (p.wV / 1000) / (Math.PI * (br - 0.002) * (br - 0.002));
    M.beaker(F, [bx, -0.04, 0.0], br, bh, Math.min(lv, bh * 0.85), { tint: '#CFE8F6', T: 20 + dT });
    R3.cylinder(F, [bx + br * 0.4, -0.04, 0.01], [bx + br * 0.4 + 0.01, -0.04, bh + 0.10], 0.0025, '#E8EEF2', { segments: 8, shadow: false });
    co([bx, -0.04, bh * 0.5], 30, 56, 'thermal: ' + (p.wV * 1000).toFixed(0) + ' mL warms ' + fK(dT), A.FORM.thermal);
    // 5. light: an LED, lit for E ÷ 1 W
    const lx = 0.40;
    A.lamp(F, [lx, 0.04, 0.0], 0.8, 'led');
    BENCH.meter(F, [lx + 0.10, -0.08, 0.04], [0, -1, 0.3], 0.09, 0.045, { title: 'LED ON', value: Q.led >= 3600 ? (Q.led / 3600).toFixed(1) : Q.led >= 60 ? (Q.led / 60).toFixed(1) : Q.led.toFixed(Q.led < 10 ? 2 : 0), unit: Q.led >= 3600 ? 'h' : Q.led >= 60 ? 'min' : 's', colour: '#FFE98A', depth: 0.03 });
    co([lx, 0.04, 0.08], 10, -64, 'light: a 1 W LED for ' + fT(Q.led), A.FORM.light);
    F.render();
    const cw = Math.min(270, W * 0.29), at2 = K.cardSlot(g, S, 'the same energy as…', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at2) {
      const h = 150; K.card(ctx, at2.x, at2.y, at2.w, h, { fill: 'rgba(8,12,22,.94)' });
      ctx.save(); ctx.textAlign = 'left'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText(fJ(E) + ' is also…', at2.x + 10, at2.y + 8);
      const rows = [[A.FORM.chemical, 'chemical: ' + fM(Q.sugar) + ' of sugar'], [A.FORM.electrical, 'electrical: ' + (Q.aa >= 0.01 ? Q.aa.toFixed(Q.aa >= 10 ? 0 : 2) : Q.aa.toExponential(1)) + ' AA batteries'], [A.FORM.sound, 'sound: a shout for ' + fT(Q.shout)], [A.FORM.thermal, 'thermal: ' + fK(E / (1.0 * C_WATER)) + ' in a litre of water'], [A.FORM.kinetic, 'kinetic: a 60 kg runner at ' + Math.sqrt(2 * E / 60).toFixed(2) + ' m/s']];
      ctx.font = mono(9.5, 500);
      rows.forEach((r, i) => { ctx.fillStyle = r[0]; ctx.fillRect(at2.x + 10, at2.y + 31 + i * 22, 8, 8); ctx.fillStyle = g.theme.text; ctx.fillText(K.fitText(ctx, r[1], at2.w - 34), at2.x + 24, at2.y + 29 + i * 22); });
      ctx.restore();
    }
    K.header(g, fJ(E) + ' lifts ' + mTxt + ' by ' + fLen(Q.lift) + ', or moves it at ' + Q.speed.toFixed(2) + ' m/s, or warms ' + (p.wV * 1000).toFixed(0) + ' mL of water by ' + fK(dT),
      'one energy, many stores: gravitational mgh · kinetic ½mv² · elastic ½kx² · thermal mcΔT · light Pt · chemical',
      'double the energy: the height doubles, the speed grows only ×1.41 — slide the energy and watch');
  }

  /* ============================================================
     THE STAGE — the chain
     ============================================================ */
  const CH = { panel: [-0.40, 0.02, 0], tilt0: 0.30, batt: [-0.14, -0.10, 0], stand: 0.14, hub: 0.80, lamp: [0.42, -0.06, 0] };
  function drawChain(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, R3 = window.R3, BENCH = window.BENCH, narrow = S._narrow;
    const C = chainOf(S), r = C.rows[clamp(Math.round(S.tr / 0.25), 0, C.rows.length - 1)];
    const F = scene(S, g, -0.85, 0.70, -0.32, 0.30, 1.1);
    // the light and the panel: the floodlight stays where it was aimed; the panel turns away from it by the tilt
    const pc = CH.panel, tilt = p.tilt * Math.PI / 180, a0 = CH.tilt0;
    const SP = A.solarPanel(F, pc, 0.25, 0.20, a0 + tilt, { glow: p.G / 1000 * Math.cos(tilt) });
    const n0 = [-Math.sin(a0), 0, Math.cos(a0)], c0 = [pc[0], pc[1], 0.06 + 0.10 * Math.sin(a0)];
    const lampAt = R3.add(c0, R3.scale(n0, 0.48));
    A.floodlight(F, lampAt, R3.sub(c0, lampAt), p.G / 1000, { to: SP.c, spread: 0.13 });
    // the battery, its leads from the panel
    const bc = CH.batt, bt = A.battery(F, bc, clamp((CHAIN.E0 + r.Ebat) / 600, 0, 1), {});
    const route = (a, b, col, via) => R3.tube(F, [a].concat(via || []).concat([b]), 0.0022, col, { segments: 5, round: false });
    route(SP.out, bt.plus, '#C8463A', [[SP.out[0] + 0.05, SP.out[1] - 0.04, 0.004], [bt.plus[0] - 0.02, bt.plus[1] - 0.05, 0.004]]);
    // the stand, the motor/generator and its pulley, the string and the mass
    const sx = CH.stand, hub = CH.hub, rod = [sx - 0.06, 0.14];
    BENCH.clampStand(F, [sx, 0.14, 0], hub + 0.06, {});
    BENCH.bossClamp(F, [rod[0], rod[1], hub], {});
    A.motorPulley(F, [sx + 0.0, 0.10, hub], 0.03, r.z / 0.03, {});
    const mzTop = 0.05 + r.z + 0.09, mx = sx + 0.03;
    BENCH.string(F, [[mx, 0.10, hub], [mx, 0.10, mzTop]], {});
    A.slottedMass(F, [mx, 0.10, mzTop], p.m, {});
    BENCH.rule(F, [mx + 0.06, 0.06, 0], [0, 0, 1], 0.7, { up: [-1, 0, 0], width: 0.03 });
    R3.box(F, [mx, 0.10, 0.05 + p.lift + 0.10], [0.06, 0.012, 0.004], '#FFD36B', { shadow: false });
    // battery to the motor: along the bench and up the rod; the motor to the lamp: down the rod and along
    route(bt.minus, [rod[0] + 0.012, rod[1] - 0.012, hub - 0.03], '#C8463A', [[bt.minus[0] + 0.04, bt.minus[1], 0.004], [rod[0] + 0.012, rod[1] - 0.012, 0.03]]);
    const lpos = CH.lamp, lighting = r.phase === 'fall' && r.z > 0 && !r.flat;
    const Pl = lighting ? LAMPS[p.lamp].eta * MOTORS[p.motor].eta * CHAIN.gear * p.m * G_EARTH * CHAIN.vFall : 0;
    const L0 = A.lamp(F, lpos, clamp(Pl / 0.5, 0, 1), p.lamp);
    route([rod[0] + 0.016, rod[1] + 0.006, hub - 0.03], L0.foot, '#2A2F38', [[rod[0] + 0.016, rod[1] + 0.006, 0.03], [rod[0] + 0.06, rod[1] - 0.05, 0.004]]);
    // the forms, tagged where they are
    const F1 = A.FORM, dxs = narrow ? 0.55 : 1;
    R3.callout(F, lampAt, 24 * dxs, -24, 'light', F1.light, { keep: true });
    R3.callout(F, SP.c, -40 * dxs, 48, 'light → electrical', F1.electrical, { keep: true });
    R3.callout(F, [bc[0], bc[1], 0.06], 10 * dxs, 52, 'chemical store', F1.chemical, { keep: true });
    R3.callout(F, [sx, 0.10, hub], -46 * dxs, -26, r.phase === 'fall' ? 'kinetic → electrical (generator)' : 'electrical → kinetic (motor)', F1.kinetic, { keep: true });
    R3.callout(F, [mx, 0.10, mzTop - 0.04], -40 * dxs, 18, 'gravitational ' + fJ(r.PE), F1.gravitational, { keep: true });
    R3.callout(F, [lpos[0], lpos[1], 0.08], 20 * dxs, 40, lighting ? 'electrical → light + thermal' : 'lamp off', F1.light, { keep: true });
    F.render();
    // the tilt handle on the panel's raised edge
    const ue = [Math.cos(a0 + tilt), 0, Math.sin(a0 + tilt)];
    axisHandle(S, g, 'tilt', R3.add(SP.c, R3.scale([Math.cos(a0), 0, Math.sin(a0)], 0.11)), R3.add(SP.c, R3.scale([Math.cos(a0 + 1.4), 0, Math.sin(a0 + 1.4)], 0.11)), 0, 80, 'tilt');
    void ue;
    const cw = Math.min(330, W * 0.36), at2 = K.cardSlot(g, S, p.ledger === 'sankey' ? 'energy flow' : 'energy ledger', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at2) chainCard(g, S, at2.x, at2.y, at2.w, C, r);
    K.header(g, r.flat ? 'Flat battery: the motor has stopped — the sunlight cannot keep up with it' : r.phase === 'lift' ? 'The motor lifts ' + p.m.toFixed(2) + ' kg at ' + C.vLift.toFixed(2) + ' m/s — ' + fJ(r.PE) + ' stored by height so far' : 'The mass falls through the generator: the lamp is lit',
      'sunlight in ' + fJ(r.Ein) + ' · light out ' + fJ(r.light) + ' · thermal ' + fJ(Object.values(r.Q).reduce((u, v) => u + v, 0)) + ' · stored ' + fJ(r.Ebat + r.PE) + ' · t = ' + S.tr.toFixed(0) + ' s',
      'sunlight to lamplight: ' + (C.overall * 100).toFixed(2) + ' % — every link loses some, none is lost: it is all counted');
  }
  function chainCard(g, S, x, y, w, C, r) {
    const ctx = g.ctx, A = ART(), K = kit(), p = S.p, h = 200, F1 = A.FORM;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.94)' }); ctx.textAlign = 'left';
    const Qs = r.Q;
    if (p.ledger === 'sankey') {
      ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText('Where the sunlight went (first ' + S.tr.toFixed(0) + ' s)', x + 10, y + 8); ctx.restore();
      A.sankey(ctx, x + 4, y + 30, w - 8, h - 36, { input: { label: 'sunlight ' + fJ(r.Ein), J: Math.max(1e-9, r.Ein), colour: F1.light }, outs: [
        { label: 'panel heat', J: Qs.panel, colour: F1.heat }, { label: 'battery store', J: Math.max(0, r.Ebat), colour: F1.chemical, useful: true },
        { label: 'battery heat', J: Qs.batt, colour: F1.heat }, { label: 'motor+pulley heat', J: Qs.motor + Qs.gear, colour: F1.heat },
        { label: 'height store', J: r.PE, colour: F1.gravitational, useful: true }, { label: 'generator heat', J: Qs.gen, colour: F1.heat },
        { label: 'lamp heat', J: Qs.lamp, colour: F1.heat }, { label: 'light', J: r.light, colour: F1.light, useful: true }] }, { size: 8.5, tip: 8 });
    } else {
      ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText('The ledger: in = stored + out + heat', x + 10, y + 8); ctx.restore();
      const heat = Object.values(Qs).reduce((u, v) => u + v, 0);
      A.energyBars(ctx, x + 6, y + 26, w - 12, h - 32, [
        { label: 'in', J: r.Ein, colour: F1.light, text: fJ(r.Ein) }, { label: 'battery', J: Math.max(0, r.Ebat), colour: F1.chemical, text: fJ(r.Ebat) },
        { label: 'height', J: r.PE, colour: F1.gravitational, text: fJ(r.PE) }, { label: 'light', J: r.light, colour: F1.light, text: fJ(r.light) },
        { label: 'heat', J: heat, colour: F1.heat, text: fJ(heat) }, { label: 'sum', J: r.Ebat + r.PE + r.light + heat, colour: '#DCE4F0', dash: true, text: fJ(r.Ebat + r.PE + r.light + heat) }], { max: Math.max(1, r.Ein) });
    }
  }

  /* ============================================================
     THE STAGE — everyday
     ============================================================ */
  function drawEveryday(S, g) {
    const p = S.p, ctx = g.ctx, A = ART(), K = kit(), W = g.w, M = window.MEAS, R3 = window.R3;
    const D = devOf(S), F1 = A.FORM;
    const F = scene(S, g, -0.5, 0.5, -0.30, 0.30, 1.0);
    let row, head, sub1, flows;
    if (p.device === 'kettle') {
      row = D.rows[clamp(Math.round(S.tr / 2), 0, D.rows.length - 1)];
      const done = S.tr >= D.t - 1e-6;
      const kt = A.kettle(F, [-0.05, 0.02, 0], { level: p.kV / 1.7, T: row.T, on: !done, lid: p.lid, boil: row.T > 96 ? 1 : 0, phase: S.ta, colour: '#C9D0D8' });
      if (row.T > 70) M.steam(F, p.lid ? kt.spout : kt.top, clamp((row.T - 70) / 30, 0, 1) * (p.lid ? 0.7 : 1.3), S.ta, { rise: 0.2 });
      window.BENCH.meter(F, [0.22, -0.14, 0.05], [0, -1, 0.35], 0.10, 0.05, { title: 'POWER', value: done ? '0' : (p.kP / 1000).toFixed(2), unit: 'kW', colour: '#7CF0B0', depth: 0.03 });
      R3.callout(F, [-0.05, -0.06, 0.12], -60, 20, 'water ' + row.T.toFixed(1) + ' °C', F1.thermal, { keep: true });
      head = done ? 'Boiled in ' + fT(D.t) + ': ' + (D.eff * 100).toFixed(0) + ' % of the electrical energy warmed the water' : 'Heating ' + p.kV.toFixed(2) + ' L at ' + (p.kP / 1000).toFixed(2) + ' kW: ' + row.T.toFixed(1) + ' °C after ' + fT(row.t);
      sub1 = 'electrical in ' + fJ(row.Ein) + ' · water ' + fJ(row.Ew) + ' · kettle body ' + fJ(row.Eb) + ' · to the room and steam ' + fJ(row.Eloss);
      flows = { input: { label: 'electrical ' + fJ(D.Ein), J: D.Ein, colour: F1.electrical }, outs: [{ label: 'water (useful)', J: D.Ew, colour: F1.thermal, useful: true }, { label: 'kettle body', J: D.Eb, colour: '#C98A6A' }, { label: 'room air', J: D.Eloss, colour: '#B07060' }, { label: 'steam', J: D.Eevap, colour: '#9AB0C8' }] };
    } else if (p.device === 'bike') {
      const n = D.rows.length - 1;
      row = D.rows[clamp(Math.round(S.tr / 0.02), 0, n)];
      const B = BRAKES[p.brake], dTnow = row.Qb * B.share / (B.m * B.c);
      A.bikeWheel(F, [0, 0.02, 0.36], 0.33, -row.x / 0.33, p.brake, clamp(dTnow / 120, 0, 1), {});
      R3.callout(F, [0, -0.04, 0.36], -90, -110, (row.v * 3.6).toFixed(1) + ' km/h · KE ' + fJ(row.KE), F1.kinetic, { keep: true });
      R3.callout(F, p.brake === 'disc' ? [0.05, -0.04, 0.32] : [0, 0.02, 0.69], 70, -40, (p.brake === 'disc' ? 'rotor' : 'rim') + ' +' + dTnow.toFixed(1) + ' K', F1.thermal, { keep: true });
      head = row.v > 0.01 ? 'Braking from ' + (p.bv * 3.6).toFixed(0) + ' km/h: kinetic energy into the ' + (p.brake === 'disc' ? 'disc' : 'rim') + ' as heat' : 'Stopped in ' + D.t.toFixed(2) + ' s and ' + D.x.toFixed(1) + ' m: the ' + (p.brake === 'disc' ? 'rotor' : 'rim') + ' is ' + D.dT.toFixed(1) + ' K hotter';
      sub1 = 'kinetic ' + fJ(D.KE0) + ' at the start · brakes ' + fJ(row.Qb) + ' · air ' + fJ(row.Qa) + ' · tyres ' + fJ(row.Qr);
      flows = { input: { label: 'kinetic ' + fJ(D.KE0), J: D.KE0, colour: F1.kinetic }, outs: [{ label: (p.brake === 'disc' ? 'rotor' : 'rim') + ' heat', J: D.Qb * B.share, colour: F1.thermal }, { label: 'pad heat', J: D.Qb * (1 - B.share), colour: '#C98A6A' }, { label: 'air', J: D.Qa, colour: '#9AB0C8' }, { label: 'tyres', J: D.Qr, colour: '#B07060' }] };
    } else {
      row = D.rows[clamp(Math.round(S.tr / 60), 0, D.rows.length - 1)];
      const warm = clamp((1 - CHARGERS[p.charger].eta) * p.cW / 10, 0, 1);
      const plug = A.charger(F, [0.20, 0.25, 0], warm, {});
      A.phone(F, [-0.12, -0.02, 0], row.soc, {});
      A.lead(F, plug, [-0.12, 0.06, 0.005], '#E8EAEE', 0.0);
      R3.callout(F, [0.20, 0.25, 0.12], -60, -30, 'charger ' + (CHARGERS[p.charger].eta * 100).toFixed(0) + ' % · warm', F1.thermal, { keep: true });
      head = row.soc < 0.99 ? 'Charging: ' + Math.round(row.soc * 100) + ' % after ' + fT(row.t) : 'Full in ' + fT(D.t) + ': ' + (D.eff * 100).toFixed(0) + ' % of the energy from the wall is in the battery';
      sub1 = 'from the wall ' + fJ(row.Ein) + ' (' + (row.Ein / 3600).toFixed(2) + ' Wh) · stored ' + fJ(row.Es) + ' · charger heat ' + fJ(row.Qc) + ' · cable ' + fJ(row.Qcab) + ' · battery heat ' + fJ(row.Qb);
      flows = { input: { label: 'electrical ' + fJ(D.Ein), J: D.Ein, colour: F1.electrical }, outs: [{ label: 'chemical store', J: D.Es, colour: F1.chemical, useful: true }, { label: 'charger heat', J: D.Qc, colour: F1.thermal }, { label: 'cable heat', J: D.Qcab, colour: '#C98A6A' }, { label: 'battery heat', J: D.Qb, colour: '#B07060' }] };
    }
    F.render();
    const at2 = K.cardSlot(g, S, p.ledger === 'sankey' ? 'energy flow' : 'energy ledger', Math.min(320, W * 0.34), { x: W - Math.min(320, W * 0.34) - 10, y: K.HDR + 4 });
    if (at2) {
      const h = 170; K.card(ctx, at2.x, at2.y, at2.w, h, { fill: 'rgba(8,12,22,.94)' });
      ctx.save(); ctx.textAlign = 'left'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'top'; ctx.fillText('The whole run, in joules', at2.x + 10, at2.y + 8); ctx.restore();
      if (p.ledger === 'sankey') A.sankey(ctx, at2.x + 4, at2.y + 28, at2.w - 8, h - 34, flows, { size: 8.5, tip: 8 });
      else A.energyBars(ctx, at2.x + 6, at2.y + 26, at2.w - 12, h - 32, [{ label: 'in', J: flows.input.J, colour: flows.input.colour, text: fJ(flows.input.J) }].concat(flows.outs.map(f => ({ label: f.label.split(' ')[0], J: f.J, colour: f.colour, text: fJ(f.J) }))), { max: flows.input.J });
    }
    K.header(g, head, sub1, 'useful share ' + (100 * flows.outs.filter(f => f.useful).reduce((u, f) => u + f.J, 0) / flows.input.J).toFixed(0) + ' % — the rest is not destroyed: it warms the surroundings');
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) {                   // the phone has no card beside the bench: re-centre and step back
      const sh = TRACKS[p.setup] ? (trackGeom(S).x1 - trackGeom(S).x0) * 0.16 : (HOMES[p.setup === 'everyday' && p.device !== 'kettle' ? p.device : p.setup] || { shift: 0 }).shift;
      S.cam.dist *= S._narrow ? 1.3 : 1 / 1.3; S.cam.target[0] += S._narrow ? -sh : sh; S._narrowCam = S._narrow;
    }
    if (TRACKS[p.setup]) return drawTrack(S, g);
    if (p.setup === 'forms') return drawForms(S, g);
    if (p.setup === 'chain') return drawChain(S, g);
    return drawEveryday(S, g);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit(), A = ART(), T = g.theme, F1 = A.FORM;
    if (p.setup === 'forms') {
      const Kk = K.plotKey(g, [{ c: F1.gravitational, label: 'height lifted (m)' }, { c: F1.kinetic, label: 'speed (m/s)' }, { c: F1.elastic, label: 'spring squeeze (m)' }, { c: F1.thermal, label: 'water warms (K)' }]);
      const P = g.Plot({ xmin: -1, xmax: 6, ymin: -6, ymax: 6, pad: { t: Kk.t }, xlabel: 'energy (log₁₀ J)', ylabel: 'log₁₀ of the quantity', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const k = SPRINGS[p.spring].k, fn = [[F1.gravitational, E => E / (p.mRef * G_EARTH)], [F1.kinetic, E => Math.sqrt(2 * E / p.mRef)], [F1.elastic, E => Math.sqrt(2 * E / k)], [F1.thermal, E => E / (p.wV * C_WATER)]];
      P.clip(() => {
        fn.forEach(([c, f]) => { const pts = []; for (let x = -1; x <= 6.001; x += 0.1) pts.push([x, Math.log10(f(Math.pow(10, x)))]); P.line(pts, c, 2); });
        P.vline(p.logE, g.alpha(T['text-2'], 0.6), [3, 3]);
        fn.forEach(([c, f]) => P.dot(p.logE, Math.log10(f(Math.pow(10, p.logE))), 4, c, '#05080F'));
      });
      P.tag(4.3, 5.2, 'slope 1: doubles', F1.thermal); P.tag(4.3, -1.4, 'slope ½: ×1.41', F1.kinetic);
      Kk.draw(P); return;
    }
    if (TRACKS[p.setup]) {
      const R = trackOf(S), Kk = K.plotKey(g, [{ c: F1.kinetic, label: 'kinetic' }, { c: F1.gravitational, label: 'gravitational' }].concat(p.setup === 'kinetic' ? [{ c: F1.elastic, label: 'spring' }] : []).concat([{ c: F1.thermal, label: 'thermal' }, { c: '#DCE4F0', label: 'total', dash: [5, 3] }]));
      const zMin = Math.min(...R.rows.map(r => r.PE)), base = p.setup === 'kinetic' ? 0 : zMin;
      const tEnd = R.o.tEnd, ymax = (R.E0 - base) * 1.1 || 1;
      const P = g.Plot({ xmin: 0, xmax: tEnd, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 't (s)', ylabel: 'energy (J)', xfmt: v => v.toFixed(0), yfmt: v => v < 0.1 ? v.toFixed(3) : v.toFixed(2) }).frame();
      const rs = R.rows.filter((_, i) => i % 2 === 0);
      P.clip(() => {
        P.area(rs.map(r => [r.t, r.Q]), 0, g.alpha(F1.thermal, 0.18));
        P.line(rs.map(r => [r.t, r.KE]), F1.kinetic, 2);
        P.line(rs.map(r => [r.t, r.PE - base]), F1.gravitational, 2);
        if (p.setup === 'kinetic') P.line(rs.map(r => [r.t, r.Esp]), F1.elastic, 2);
        P.line(rs.map(r => [r.t, r.Q]), F1.thermal, 2);
        P.line(rs.map(r => [r.t, r.KE + r.PE - base + r.Esp + r.Q]), '#DCE4F0', 1.5, [5, 3]);
        P.vline(S.tr, g.alpha(T['text-2'], 0.6), [2, 3]);
      });
      if (base > 0) P.tag(tEnd * 0.6, ymax * 0.95, 'height measured from the lowest point', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'chain') {
      const C = chainOf(S), Kk = K.plotKey(g, [{ c: F1.heat, label: 'thermal (heat)', box: true }, { c: F1.chemical, label: 'battery', box: true }, { c: F1.gravitational, label: 'height', box: true }, { c: F1.light, label: 'light out', box: true }, { c: '#DCE4F0', label: 'sunlight in', dash: [5, 3] }]);
      const last = C.rows[C.rows.length - 1], ymax = Math.max(10, last.Ein * 1.05), base = Math.min(0, ...C.rows.map(r => r.Ebat));
      const P = g.Plot({ xmin: 0, xmax: 90, ymin: base * 1.1, ymax, pad: { t: Kk.t }, xlabel: 't (s)', ylabel: 'energy (J)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        const st = C.rows.map(r => { const h = Object.values(r.Q).reduce((u, v) => u + v, 0); return { t: r.t, a: h, b: h + Math.max(0, r.Ebat), c: h + Math.max(0, r.Ebat) + r.PE, d: h + Math.max(0, r.Ebat) + r.PE + r.light, neg: Math.min(0, r.Ebat) }; });
        P.area(st.map(r => [r.t, r.d]), 0, g.alpha(F1.light, 0.55)); P.area(st.map(r => [r.t, r.c]), 0, g.alpha(F1.gravitational, 0.6)); P.area(st.map(r => [r.t, r.b]), 0, g.alpha(F1.chemical, 0.6)); P.area(st.map(r => [r.t, r.a]), 0, g.alpha(F1.heat, 0.55));
        P.area(st.map(r => [r.t, r.neg]), 0, g.alpha(F1.chemical, 0.3));
        P.line(C.rows.map(r => [r.t, r.Ein]), '#DCE4F0', 1.5, [5, 3]);
        P.vline(S.tr, g.alpha(T['text-2'], 0.6), [2, 3]);
      });
      if (base < 0) P.tag(45, base * 0.5, 'battery running down', F1.chemical);
      Kk.draw(P); return;
    }
    // everyday
    const D = devOf(S);
    if (p.device === 'kettle') {
      const Kk = K.plotKey(g, [{ c: F1.thermal, label: 'water °C' }, { c: '#9AB0C8', label: 'ideal: no losses', dash: [5, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: Math.max(60, D.t * 1.05), ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 't (s)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(D.rows.map(r => [r.t, r.T]), F1.thermal, 2); P.line([[0, p.kT0], [D.ideal, 100]], '#9AB0C8', 1.5, [5, 3]); P.hline(100, g.alpha(T['text-2'], 0.5), [2, 3]); P.vline(S.tr, g.alpha(T['text-2'], 0.6), [2, 3]); });
      P.tag(D.t, 104, 'boils at ' + fT(D.t), F1.thermal, 'right'); Kk.draw(P); return;
    }
    if (p.device === 'bike') {
      const B = BRAKES[p.brake], Kk = K.plotKey(g, [{ c: F1.kinetic, label: 'kinetic energy (J)' }, { c: F1.thermal, label: (p.brake === 'disc' ? 'rotor' : 'rim') + ' heat (J)' }]);
      const P = g.Plot({ xmin: 0, xmax: D.t * 1.05, ymin: 0, ymax: D.KE0 * 1.08, pad: { t: Kk.t }, xlabel: 't (s)', ylabel: 'J', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(D.rows.map(r => [r.t, r.KE]), F1.kinetic, 2); P.line(D.rows.map(r => [r.t, r.Qb * B.share]), F1.thermal, 2); P.vline(S.tr, g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    const Kk = K.plotKey(g, [{ c: F1.chemical, label: 'charge %' }, { c: F1.electrical, label: 'power from the wall (W)' }]);
    const P = g.Plot({ xmin: 0, xmax: D.t / 60 * 1.05, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: '% · W', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => {
      P.line(D.rows.map(r => [r.t / 60, r.soc * 100]), F1.chemical, 2);
      const pw = []; for (let i = 1; i < D.rows.length; i++) { const a = D.rows[i - 1], b = D.rows[i]; pw.push([b.t / 60, (b.Ein - a.Ein) / Math.max(1, b.t - a.t)]); } P.line(pw, F1.electrical, 1.5);
      P.vline(S.tr / 60, g.alpha(T['text-2'], 0.6), [2, 3]);
    });
    P.tag(D.t / 60 * 0.82, 30, 'the last 20 % tapers', T['text-3']);
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), A = ART(), T = g.theme, F1 = A.FORM;
    if (p.setup === 'forms') {
      const P = g.Plot({ xmin: -3.5, xmax: 8, ymin: -0.5, ymax: SCALE.length - 0.5, pad: { l: 12, t: 10 }, xlabel: 'energy (log₁₀ J) — every tick ten times the last', ylabel: '', xfmt: v => v.toFixed(0), yfmt: () => '' }).frame();
      const sorted = SCALE.slice().sort((a, b) => a[1] - b[1]);
      P.clip(() => { sorted.forEach((s, i) => { P.line([[-3.5, i], [Math.log10(s[1]), i]], g.alpha('#5D8BFF', 0.5), 6); P.dot(Math.log10(s[1]), i, 3.5, '#9DB6FF'); }); P.vline(p.logE, '#FFD36B', [4, 3]); });
      sorted.forEach((s, i) => P.tag(Math.log10(s[1]) + 0.15, i, s[0], T['text-2'], 'left', 0));
      P.tag(p.logE, SCALE.length - 0.9, 'your ' + fJ(Math.pow(10, p.logE)), '#FFD36B', p.logE > 5 ? 'right' : 'left');
      return;
    }
    if (p.setup === 'kinetic') {
      const R = trackOf(S), v1 = R.gates[0].v || 0, ms = [0.25, 0.5, 1, 2];
      const Kk = K.plotKey(g, ms.map((m, i) => ({ c: ['#7FD8FF', '#4FC3F7', '#2C8FD8', '#1A5FA8'][i], label: m + ' kg' })).concat([{ c: '#FFD36B', label: 'your run', dot: true }]));
      const P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 4, pad: { t: Kk.t }, xlabel: 'speed v (m/s)', ylabel: 'KE = ½mv² (J)', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { ms.forEach((m, i) => { const pts = []; for (let v = 0; v <= 3.001; v += 0.05) pts.push([v, 0.5 * m * v * v]); P.line(pts, ['#7FD8FF', '#4FC3F7', '#2C8FD8', '#1A5FA8'][i], 2); }); P.dot(v1, 0.5 * p.m * v1 * v1, 5, '#FFD36B', '#05080F'); });
      P.tag(2.2, 0.5 * 0.25 * 4.84 + 0.2, 'double v → four times KE', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'potential') {
      const R = trackOf(S), v1 = R.gates[0].v || 0, keys = Object.keys(PLANETS), cols = ['#4FC3F7', '#C9D0D8', '#FF8A5A', '#F2C744'];
      const Kk = K.plotKey(g, keys.map((k, i) => ({ c: cols[i], label: PLANETS[k].name + ' √(2gh)' })).concat([{ c: '#FFD36B', label: 'gate 1 reading', dot: true }]));
      const P = g.Plot({ xmin: 0, xmax: 0.6, ymin: 0, ymax: 6, pad: { t: Kk.t }, xlabel: 'release height h (m)', ylabel: 'speed at the bottom (m/s)', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { keys.forEach((k, i) => { const pts = []; for (let h = 0; h <= 0.6001; h += 0.01) pts.push([h, Math.sqrt(2 * PLANETS[k].g * h)]); P.line(pts, cols[i], 2); }); P.dot(p.h, v1, 5, '#FFD36B', '#05080F'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'conserve') {
      const keys = Object.keys(SURF), cols = ['#7FD8FF', '#C9D0D8', '#B39DFF', '#D8B06A'];
      const runs = S._peaks && S._peaks.key === [p.m, p.h0, p.sail, p.mag].join('|') ? S._peaks.R : (S._peaks = { key: [p.m, p.h0, p.sail, p.mag].join('|'), R: keys.map(k => cartRun(Object.assign(trackOpts(Object.assign({}, p, { surf: k })), { tEnd: 40 }))) }).R;
      const Kk = K.plotKey(g, keys.map((k, i) => ({ c: cols[i], label: SURF[k].name.split(' (')[0] })));
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 0.45, pad: { t: Kk.t }, xlabel: 'turn-round number', ylabel: 'height reached (m)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => {
        P.hline(p.h0, g.alpha(T['text-2'], 0.6), [4, 3]);
        runs.forEach((R, i) => { const pts = [[0, p.h0]].concat(R.peaks.slice(0, 12).map((q, j) => [j + 1, q.z - 0])); P.line(pts, cols[i], keys[i] === p.surf ? 2.6 : 1.4); if (keys[i] === p.surf) pts.forEach(q => P.dot(q[0], q[1], 3, cols[i])); });
      });
      P.tag(11.8, p.h0 + 0.012, 'start', T['text-3'], 'right');
      Kk.draw(P); return;
    }
    if (p.setup === 'chain') {
      const C = chainOf(S), L = C.links, n = L.length;
      const Kk = K.plotKey(g, [{ c: '#5D8BFF', label: 'this link’s efficiency', box: true }, { c: '#FFD36B', label: 'what is left of the sunlight' }]);
      const P = g.Plot({ xmin: -0.5, xmax: n - 0.5, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'the chain, link by link', ylabel: '%', xfmt: v => (L[Math.round(v)] || [''])[0], xticks: L.map((_, i) => i), yfmt: v => v.toFixed(0) }).frame();
      let left = 100; const cum = [];
      P.clip(() => {
        L.forEach((l, i) => { P.area([[i - 0.32, l[1] * 100], [i + 0.32, l[1] * 100]], 0, g.alpha('#5D8BFF', 0.55)); left *= l[1]; cum.push([i, left]); });
        P.line(cum, '#FFD36B', 2); cum.forEach(c => P.dot(c[0], c[1], 3.5, '#FFD36B'));
      });
      P.tag(n - 1, cum[n - 1][1] + 6, (C.overall * 100).toFixed(2) + ' % reaches the eye', '#FFD36B', 'right');
      Kk.draw(P); return;
    }
    // everyday: the useful share across choices
    if (p.device === 'kettle') {
      const Vs = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.7], Kk = K.plotKey(g, [{ c: F1.thermal, label: 'lid on' }, { c: '#9AB0C8', label: 'lid off' }, { c: '#FFD36B', label: 'your kettle', dot: true }]);
      const key = [p.kP, p.kT0].join('|');
      if (!S._kv || S._kv.key !== key) S._kv = { key, on: Vs.map(V => kettleRun({ P: p.kP, V, T0: p.kT0, lid: true }).eff * 100), off: Vs.map(V => kettleRun({ P: p.kP, V, T0: p.kT0, lid: false }).eff * 100) };
      const P = g.Plot({ xmin: 0.2, xmax: 1.75, ymin: 60, ymax: 100, pad: { t: Kk.t }, xlabel: 'water in the kettle (L)', ylabel: 'useful share (%)', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(Vs.map((V, i) => [V, S._kv.on[i]]), F1.thermal, 2); P.line(Vs.map((V, i) => [V, S._kv.off[i]]), '#9AB0C8', 2); P.dot(p.kV, devOf(S).eff * 100, 5, '#FFD36B', '#05080F'); });
      P.tag(0.3, 64, 'a small fill wastes more: the body still has to heat up', T['text-3']); Kk.draw(P); return;
    }
    if (p.device === 'bike') {
      const vs = []; for (let v = 2; v <= 12.001; v += 1) vs.push(v);
      const Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'disc rotor' }, { c: '#C9D0D8', label: 'rim' }, { c: '#FFD36B', label: 'your stop', dot: true }]);
      const dTof = (b, v) => { const B = BRAKES[b], r = bikeRun({ m: p.bm, v0: v, brake: b, decel: p.decel }); return r.Qb * B.share / (B.m * B.c); };
      const key = [p.bm, p.decel].join('|');
      if (!S._bv || S._bv.key !== key) S._bv = { key, d: vs.map(v => dTof('disc', v)), r: vs.map(v => dTof('rim', v)) };
      const ymax = Math.max(20, Math.ceil(Math.max(...S._bv.d) / 20) * 20);
      const P = g.Plot({ xmin: 0, xmax: 12.5, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'speed before braking (m/s)', ylabel: 'temperature rise (K)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(vs.map((v, i) => [v, S._bv.d[i]]), '#FF8A5A', 2); P.line(vs.map((v, i) => [v, S._bv.r[i]]), '#C9D0D8', 2); P.dot(p.bv, devOf(S).dT, 5, '#FFD36B', '#05080F'); });
      P.tag(3, ymax * 0.85, 'twice the speed: four times the heat', T['text-3']); Kk.draw(P); return;
    }
    const ks = Object.keys(CHARGERS), Kk = K.plotKey(g, [{ c: F1.chemical, label: 'stored', box: true }, { c: F1.thermal, label: 'lost as heat', box: true }]);
    const key = [p.cW, p.cap].join('|');
    if (!S._pc || S._pc.key !== key) S._pc = { key, R: ks.map(c => phoneRun({ W: p.cW, cap: p.cap, charger: c })) };
    const ymax = Math.max(...S._pc.R.map(r => r.Ein / 3600)) * 1.15;
    const P = g.Plot({ xmin: -0.5, xmax: 2.5, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'charger', ylabel: 'Wh from the wall', xticks: [0, 1, 2], xfmt: v => ['old', 'switch-mode', 'GaN'][Math.round(v)] || '', yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { S._pc.R.forEach((r, i) => { P.area([[i - 0.3, r.Es / 3600], [i + 0.3, r.Es / 3600]], 0, g.alpha(F1.chemical, ks[i] === p.charger ? 0.85 : 0.45)); P.area([[i - 0.3, r.Ein / 3600], [i + 0.3, r.Ein / 3600]], r.Es / 3600, g.alpha(F1.thermal, ks[i] === p.charger ? 0.85 : 0.45)); }); });
    S._pc.R.forEach((r, i) => P.tag(i, r.Ein / 3600 + ymax * 0.03, (r.eff * 100).toFixed(0) + ' %', T['text-2'], 'center'));
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'forms') {
      const E = Math.pow(10, p.logE), Q = equivalents(E, p.mRef);
      return [
        { label: 'Energy E', value: fJ(E), flag: 'accent', hint: 'one amount, every form' },
        { label: 'Height h = E/mg', value: fLen(Q.lift), hint: 'for ' + p.mRef + ' kg' },
        { label: 'Speed v = √(2E/m)', value: Q.speed.toFixed(Q.speed < 10 ? 3 : 1), unit: 'm/s', hint: 'grows as √E' },
        { label: 'Spring x = √(2E/k)', value: fLen(Math.sqrt(2 * E / SPRINGS[p.spring].k)), hint: 'k = ' + SPRINGS[p.spring].k + ' N/m' },
        { label: 'Warms ΔT = E/mc', value: fK(E / (p.wV * C_WATER)), hint: (p.wV * 1000).toFixed(0) + ' mL of water' },
        { label: '1 W LED, t = E/P', value: fT(Q.led) },
        { label: 'Sugar, E/16.7 kJ/g', value: fM(Q.sugar), hint: 'the chemical store' }
      ];
    }
    if (TRACKS[p.setup]) {
      const R = trackOf(S), row = rowAt(R.rows, S.tr), g1 = R.gates[0], g2 = R.gates[1];
      const out = [{ label: 'Kinetic ½mv²', value: fJ(row.KE), flag: 'accent', hint: S.tr >= R.o.tEnd - 1e-6 ? 'run over' : 'now' }];
      if (p.setup === 'kinetic') out.push({ label: 'Spring ½kx²', value: fJ(R.Es), hint: SPRINGS[p.spring].k + ' N/m × (' + (p.comp / 100).toFixed(2) + ' m)² ÷ 2' });
      else out.push({ label: 'Start mgh', value: fJ(R.E0), hint: 'g = ' + R.g + ' m/s², h from the track’s floor' });
      if (g1) out.push({ label: 'Gate 1: flag ÷ time', value: g1.v ? g1.v.toFixed(3) : '—', unit: 'm/s', hint: g1.dt ? (R.o.flag * 100).toFixed(1) + ' cm in ' + (g1.dt * 1000).toFixed(1) + ' ms' : 'not reached' });
      if (g2) out.push({ label: 'Gate 2', value: g2.v ? g2.v.toFixed(3) : '—', unit: 'm/s', hint: 'slower: friction and air' });
      if (g1 && g2 && g1.tIn != null && g2.tIn != null) out.push({ label: 'Gate to gate Δs/Δt', value: ((R.o.gates[1] - R.o.gates[0]) / (g2.tIn - g1.tIn)).toFixed(3), unit: 'm/s', hint: ((R.o.gates[1] - R.o.gates[0]) * 100).toFixed(0) + ' cm in ' + ((g2.tIn - g1.tIn) * 1000).toFixed(0) + ' ms: the average between' });
      if (g1 && g1.v) out.push({ label: 'KE at gate 1', value: fJ(0.5 * p.m * g1.v * g1.v), hint: p.setup === 'kinetic' ? (100 * 0.5 * p.m * g1.v * g1.v / R.Es).toFixed(1) + ' % of the spring’s' : (100 * 0.5 * p.m * g1.v * g1.v / (R.m * R.g * p.h)).toFixed(1) + ' % of mgh' });
      if (p.setup === 'potential') out.push({ label: 'Ideal √(2gh)', value: Math.sqrt(2 * R.g * p.h).toFixed(3), unit: 'm/s', hint: 'no mass in it' });
      out.push({ label: 'Thermal so far', value: fJ(row.Q), flag: row.Q > 0.05 * R.E0 ? 'warn' : '', hint: 'rolling ' + fJ(row.Qroll) + ' · air ' + fJ(row.Qair) + (row.Qbrake > 0 ? ' · brake ' + fJ(row.Qbrake) : '') });
      if (R.o.clay != null) out.push({ label: 'Dent in the clay', value: fLen(R.dent), hint: 'depth = KE ÷ ' + CLAY_YIELD + ' N' });
      if (p.setup === 'conserve') out.push({ label: 'Track warms ΔT', value: fK(row.Q / (0.9 * 900)), hint: 'a 900 g aluminium track: too little to feel' }, { label: 'Ledger KE+PE+Q', value: fJ(row.KE + Math.max(0, row.PE) + row.Q), flag: 'ok', hint: 'never changes' });
      return out;
    }
    if (p.setup === 'chain') {
      const C = chainOf(S), r = C.rows[clamp(Math.round(S.tr / 0.25), 0, C.rows.length - 1)], heat = Object.values(r.Q).reduce((u, v) => u + v, 0);
      return [
        { label: 'Sunlight on panel G·A·cosθ', value: C.Pl.toFixed(1), unit: 'W', flag: 'accent' },
        { label: 'Panel out η·P', value: (PANELS[p.panel].eta * C.Pl).toFixed(2), unit: 'W', hint: PANELS[p.panel].name },
        { label: 'Motor draws', value: r.flat ? '0' : CHAIN.Pm.toFixed(1), unit: 'W', flag: r.flat ? 'crit' : '', hint: r.flat ? 'flat battery' : 'lifts at ' + C.vLift.toFixed(2) + ' m/s' },
        { label: 'Battery Δ', value: fJ(r.Ebat), flag: r.Ebat < 0 ? 'warn' : 'ok' },
        { label: 'Lifts so far', value: String(r.lifts), hint: 'mgh = ' + fJ(p.m * G_EARTH * p.lift) + ' each' },
        { label: 'Light out', value: fJ(r.light), flag: 'ok' },
        { label: 'Thermal', value: fJ(heat), hint: 'the biggest share' },
        { label: 'Chain efficiency Πη', value: (C.overall * 100).toFixed(2), unit: '%', hint: 'sunlight → lamplight' }
      ];
    }
    const D = devOf(S);
    if (p.device === 'kettle') return [
      { label: 'Energy to heat mcΔT', value: fJ(p.kV * C_WATER * (100 - p.kT0)), flag: 'accent' },
      { label: 'Ideal time mcΔT/P', value: fT(D.ideal) },
      { label: 'Time to boil', value: fT(D.t), flag: 'ok' },
      { label: 'Electrical in P·t', value: fJ(D.Ein) },
      { label: 'Useful share', value: (D.eff * 100).toFixed(1), unit: '%' },
      { label: 'Kettle body', value: fJ(D.Eb), hint: '550 g of steel and element' },
      { label: 'To the room + steam', value: fJ(D.Eloss + D.Eevap) }];
    if (p.device === 'bike') return [
      { label: 'Kinetic ½mv²', value: fJ(D.KE0), flag: 'accent' },
      { label: 'Stopping time', value: D.t.toFixed(2), unit: 's' },
      { label: 'Stopping distance', value: D.x.toFixed(2), unit: 'm' },
      { label: 'Into the brakes', value: fJ(D.Qb), hint: (100 * D.Qb / D.KE0).toFixed(1) + ' %' },
      { label: (p.brake === 'disc' ? 'Rotor' : 'Rim') + ' ΔT = Q/mc', value: D.dT.toFixed(1), unit: 'K', flag: D.dT > 60 ? 'warn' : 'ok' },
      { label: 'Air + tyres', value: fJ(D.Qa + D.Qr) }];
    return [
      { label: 'Battery holds', value: fJ(p.cap * 3600), flag: 'accent', hint: p.cap + ' Wh × 3600' },
      { label: 'Time to full', value: fT(D.t) },
      { label: 'From the wall', value: (D.Ein / 3600).toFixed(2), unit: 'Wh' },
      { label: 'Stored', value: (D.Es / 3600).toFixed(2), unit: 'Wh' },
      { label: 'Overall efficiency', value: (D.eff * 100).toFixed(1), unit: '%', flag: D.eff < 0.7 ? 'warn' : 'ok' },
      { label: 'Charger heat', value: fJ(D.Qc) },
      { label: 'Cable heat I²R', value: fJ(D.Qcab) }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'forms') {
      const En = Math.pow(10, p.logE), Q = equivalents(En, p.mRef);
      return E.v('E') + ' ' + E.op('=') + ' ' + E.n(fJ(En)) + ' ' + E.op('=') + ' ' + E.v('mgh') + ' (' + E.v('h') + ' ' + E.op('=') + ' ' + E.n(fLen(Q.lift)) + ') ' + E.op('=') + ' ½' + E.v('mv') + '² (' + E.v('v') + ' ' + E.op('=') + ' ' + E.n(Q.speed.toFixed(3), 'm/s') + ') ' + E.op('=') + ' ' + E.v('mc') + 'Δ' + E.v('T') + ' (Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.n(fK(En / (p.wV * C_WATER))) + ')';
    }
    if (p.setup === 'kinetic') {
      const R = trackOf(S), v = R.gates[0].v || 0;
      return '½' + E.v('kx') + '² ' + E.op('=') + ' ½ · ' + E.n(SPRINGS[p.spring].k, 'N/m') + ' · (' + E.n((p.comp / 100).toFixed(3), 'm') + ')² ' + E.op('=') + ' ' + E.n(fJ(R.Es)) + '   →   ½' + E.v('mv') + '² ' + E.op('=') + ' ½ · ' + E.n(p.m.toFixed(2), 'kg') + ' · (' + E.n(v.toFixed(3), 'm/s') + ')² ' + E.op('=') + ' ' + E.n(fJ(0.5 * p.m * v * v));
    }
    if (p.setup === 'potential') {
      const g0 = PLANETS[p.planet].g;
      return E.v('mgh') + ' ' + E.op('=') + ' ½' + E.v('mv') + '²  →  ' + E.v('v') + ' ' + E.op('=') + ' √(2' + E.v('gh') + ') ' + E.op('=') + ' √(2 · ' + E.n(g0, 'm/s²') + ' · ' + E.n(p.h.toFixed(2), 'm') + ') ' + E.op('=') + ' ' + E.n(Math.sqrt(2 * g0 * p.h).toFixed(3), 'm/s') + '  — no ' + E.v('m') + ' left in it';
    }
    if (p.setup === 'chain') {
      const C = chainOf(S);
      return E.v('η') + E.sub('chain') + ' ' + E.op('=') + ' ' + C.links.map(l => E.n((l[1] * 100).toFixed(0) + '%')).join(' × ') + ' ' + E.op('=') + ' ' + E.n((C.overall * 100).toFixed(2), '%');
    }
    if (p.setup === 'conserve') {
      const R = trackOf(S), row = rowAt(R.rows, S.tr), b = 0;
      return E.v('KE') + ' + ' + E.v('PE') + ' + ' + E.v('Q') + ' ' + E.op('=') + ' ' + E.n(fJ(row.KE)) + ' + ' + E.n(fJ(row.PE - b)) + ' + ' + E.n(fJ(row.Q)) + ' ' + E.op('=') + ' ' + E.n(fJ(row.KE + row.PE - b + row.Q)) + '  (' + E.n(fJ(R.E0 - b)) + ' at the start)';
    }
    const D = devOf(S);
    if (p.device === 'kettle') return E.v('Q') + ' ' + E.op('=') + ' ' + E.v('mc') + 'Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.n(p.kV.toFixed(2), 'kg') + ' · ' + E.n(4186, 'J/kg·K') + ' · ' + E.n((100 - p.kT0).toFixed(0), 'K') + ' ' + E.op('=') + ' ' + E.n(fJ(p.kV * C_WATER * (100 - p.kT0))) + ';   ' + E.v('η') + ' ' + E.op('=') + ' ' + E.frac('useful', 'total in') + ' ' + E.op('=') + ' ' + E.n((D.eff * 100).toFixed(1), '%');
    if (p.device === 'bike') return '½' + E.v('mv') + '² ' + E.op('=') + ' ½ · ' + E.n(p.bm, 'kg') + ' · (' + E.n(p.bv, 'm/s') + ')² ' + E.op('=') + ' ' + E.n(fJ(D.KE0)) + ';   Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.frac(E.v('Q'), E.v('mc')) + ' ' + E.op('=') + ' ' + E.n(D.dT.toFixed(1), 'K');
    return E.v('η') + ' ' + E.op('=') + ' ' + E.frac('stored', 'from the wall') + ' ' + E.op('=') + ' ' + E.frac(E.n((D.Es / 3600).toFixed(2), 'Wh'), E.n((D.Ein / 3600).toFixed(2), 'Wh')) + ' ' + E.op('=') + ' ' + E.n((D.eff * 100).toFixed(1), '%');
  }
  const EQ_NOTE = {
    forms: 'Every store has its own formula, and they all give joules. Notice which quantities grow in step with the energy (height, temperature rise, time) and which only as its square root (speed, spring squeeze): to go twice as fast takes four times the energy.',
    kinetic: 'The gates do not measure the speed directly: they time how long the 5 cm flag blocks the beam and divide. A shorter flag gives a speed closer to the instant; a longer one averages more. The cart arrives with a little less than the spring stored — rolling and air have already taken a share as heat.',
    potential: 'The mass cancels: every cart, heavy or light, reaches the same speed from the same height — as long as friction is small. With friction the angle matters too: a shallow ramp is a longer path, with more rolling resistance along it. Heights are measured from the floor of the track.',
    chain: 'Efficiencies multiply, they do not add: seven links of 21, 95, 78, 90, 90, 78 and 35 % leave about 3 % of the sunlight as light. Nothing is destroyed — the other 97 % is thermal energy in the panel, the battery, the motor, the pulley and the lamp.',
    conserve: 'The total never changes. What changes is how much of it is useful: each swing hands a little more to the bearings, the air and the brake as thermal energy, spread so thinly that the track warms by thousandths of a kelvin.',
    everyday: 'The useful share is a choice about what you wanted. For the kettle it is the hot water; for the brakes the “useful” job is to get rid of kinetic energy, so all of it ends up as heat on purpose; for the charger it is the chemical store in the battery.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  L.register({
    id: 'g6c-energy-chain',
    grade: 6, unit: '6C', topics: ['C1'],
    subject: 'physics',
    chapter: 'Energy, Heat and Thermal Systems',
    name: 'The Energy Chain Bench — Forms, Stores and Transfers',
    exams: ['NGSS MS-PS3-1', 'NGSS MS-PS3-2', 'NGSS MS-PS3-5', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn · scroll to zoom · drag a yellow ring to set the spring, the height or the panel',
    lede: 'Every number on this bench is in <b>joules</b>, and every joule is counted. A spring launcher and two <b>light gates</b> measure ½mv²; a cart released down a ramp on <b>any planet</b> turns mgh into speed; a <b>solar panel, battery, motor, falling mass and lamp</b> pass energy along a chain where each link has its real efficiency. ' +
      'Roll the cart in a valley and watch kinetic and gravitational trade while <b>thermal energy</b> — the bucket you cannot see — fills up. The ledger sums to the start at every instant.',
    params: preset({}),
    presets: [
      { name: 'Sunlight to lamplight', params: preset({}) },
      { name: 'A cloudy day with a thin-film panel: the battery runs flat', params: preset({ G: 250, panel: 'thin', tilt: 30 }) },
      { name: 'A filament bulb at the end of the chain', params: preset({ lamp: 'filament', motor: 'toy' }) },
      { name: 'Double the speed: a stiff spring squeezed 8 cm', params: preset({ setup: 'kinetic', spring: 'stiff', comp: 8 }) },
      { name: 'Same spring, four times the mass', params: preset({ setup: 'kinetic', m: 2.0 }) },
      { name: 'Light and heavy carts from the same height', params: preset({ setup: 'potential', m: 2.0 }) },
      { name: 'The same ramp on the Moon', params: preset({ setup: 'potential', planet: 'moon' }) },
      { name: 'A rough track: the angle starts to matter', params: preset({ setup: 'potential', surf: 'sand', ang: 15 }) },
      { name: 'The valley on an air track: hardly any loss', params: preset({ setup: 'conserve', surf: 'air' }) },
      { name: 'A big card sail', params: preset({ setup: 'conserve', sail: 'large' }) },
      { name: 'A magnet brake: kinetic to thermal fast', params: preset({ setup: 'conserve', mag: 'strong' }) },
      { name: 'One joule, every form', params: preset({ setup: 'forms' }) },
      { name: 'A chocolate bar’s worth, lifting yourself', params: preset({ setup: 'forms', logE: 6.02, mRef: 50 }) },
      { name: 'A kettle with the lid off', params: preset({ setup: 'everyday', lid: false }) },
      { name: 'Just one cup in the kettle', params: preset({ setup: 'everyday', kV: 0.25 }) },
      { name: 'A hard stop from 40 km/h', params: preset({ setup: 'everyday', device: 'bike', bv: 11, decel: 6 }) },
      { name: 'Charging on an old plug pack', params: preset({ setup: 'everyday', device: 'phone', charger: 'old', cW: 5 }) }
    ],
    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS }] },
      { group: 'The energy', when: is('forms'), items: [
        { key: 'logE', label: 'Energy', min: -1, max: 6.3, step: 0.05, unit: 'J', fmt: v => fJ(Math.pow(10, v)), restructure: true },
        { key: 'mRef', type: 'select', label: 'The mass it moves', restructure: true, options: [{ value: 0.1, label: 'An apple (0.1 kg)' }, { value: 1, label: 'A bag of sugar (1 kg)' }, { value: 50, label: 'You (50 kg)' }] },
        { key: 'wV', type: 'select', label: 'The water it warms', restructure: true, options: [{ value: 0.01, label: '10 mL' }, { value: 0.1, label: '100 mL' }, { value: 1, label: '1 L' }] }] },
      { group: 'The launcher', when: is('kinetic', 'forms'), items: [
        { key: 'spring', type: 'select', label: 'Spring', restructure: true, options: Object.keys(SPRINGS).map(k => ({ value: k, label: SPRINGS[k].name })) },
        { key: 'comp', label: 'Squeezed by', min: 1, max: 8, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: true, when: is('kinetic') }] },
      { group: 'The ramp', when: is('potential'), items: [
        { key: 'h', label: 'Release height', min: 0.05, max: 0.6, step: 0.01, unit: 'm', fmt: v => v.toFixed(2), restructure: true },
        { key: 'ang', label: 'Ramp angle', min: 15, max: 60, step: 1, unit: '°', fmt: v => v.toFixed(0), restructure: true },
        { key: 'planet', type: 'select', label: 'On', restructure: true, options: Object.keys(PLANETS).map(k => ({ value: k, label: PLANETS[k].name.replace('the ', 'The ') + ' (' + PLANETS[k].g + ' m/s²)' })) }] },
      { group: 'The valley', when: is('conserve'), items: [
        { key: 'h0', label: 'Release height', min: 0.08, max: 0.42, step: 0.01, unit: 'm', fmt: v => v.toFixed(2), restructure: true },
        { key: 'sail', type: 'select', label: 'Card sail', restructure: true, options: [{ value: 'none', label: 'None' }, { value: 'small', label: '10 × 10 cm' }, { value: 'large', label: '20 × 20 cm' }] },
        { key: 'mag', type: 'select', label: 'Magnet brake', restructure: true, options: [{ value: 'off', label: 'Off' }, { value: 'weak', label: 'Weak' }, { value: 'strong', label: 'Strong' }] }] },
      { group: 'The cart and track', when: is('kinetic', 'potential', 'conserve'), items: [
        { key: 'm', label: 'Cart + mass bars', min: 0.25, max: 2.0, step: 0.25, unit: 'kg', fmt: v => v.toFixed(2), restructure: true },
        { key: 'surf', type: 'select', label: 'Track', restructure: true, options: Object.keys(SURF).map(k => ({ value: k, label: SURF[k].name })) },
        { key: 'flag', label: 'Flag width', min: 1, max: 10, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: true, when: is('kinetic') }] },
      { group: 'The light', when: is('chain'), items: [
        { key: 'G', label: 'Light on the panel', min: 100, max: 1000, step: 10, unit: 'W/m²', fmt: v => v.toFixed(0), restructure: true },
        { key: 'tilt', label: 'Panel turned from the light', min: 0, max: 80, step: 1, unit: '°', fmt: v => v.toFixed(0), restructure: true },
        { key: 'panel', type: 'select', label: 'Panel', restructure: true, options: Object.keys(PANELS).map(k => ({ value: k, label: PANELS[k].name })) }] },
      { group: 'Store and motor', when: is('chain'), items: [
        { key: 'batt', type: 'select', label: 'Battery', restructure: true, options: Object.keys(BATTS).map(k => ({ value: k, label: BATTS[k].name })) },
        { key: 'motor', type: 'select', label: 'Motor / generator', restructure: true, options: Object.keys(MOTORS).map(k => ({ value: k, label: MOTORS[k].name })) },
        { key: 'm', label: 'Mass lifted', min: 0.25, max: 2.0, step: 0.25, unit: 'kg', fmt: v => v.toFixed(2), restructure: true },
        { key: 'lift', label: 'Lift height', min: 0.2, max: 0.6, step: 0.05, unit: 'm', fmt: v => v.toFixed(2), restructure: true },
        { key: 'lamp', type: 'select', label: 'Lamp', restructure: true, options: Object.keys(LAMPS).map(k => ({ value: k, label: LAMPS[k].name })) }] },
      { group: 'The device', when: is('everyday'), items: [
        { key: 'device', type: 'select', label: 'Device', restructure: true, options: [{ value: 'kettle', label: 'Electric kettle' }, { value: 'bike', label: 'Braking bicycle' }, { value: 'phone', label: 'Phone on charge' }] }] },
      { group: 'The kettle', when: isDev('kettle'), items: [
        { key: 'kP', label: 'Power', min: 1000, max: 3000, step: 50, unit: 'W', fmt: v => v.toFixed(0), restructure: true },
        { key: 'kV', label: 'Water', min: 0.25, max: 1.7, step: 0.05, unit: 'L', fmt: v => v.toFixed(2), restructure: true },
        { key: 'kT0', label: 'Water from the tap at', min: 5, max: 30, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'lid', type: 'toggle', label: 'Lid on', restructure: true }] },
      { group: 'The bicycle', when: isDev('bike'), items: [
        { key: 'bm', label: 'Rider + bike', min: 40, max: 120, step: 5, unit: 'kg', fmt: v => v.toFixed(0), restructure: true },
        { key: 'bv', label: 'Speed', min: 2, max: 12, step: 0.5, unit: 'm/s', fmt: v => v.toFixed(1) + ' (' + (v * 3.6).toFixed(0) + ' km/h)', restructure: true },
        { key: 'brake', type: 'select', label: 'Brake', restructure: true, options: Object.keys(BRAKES).map(k => ({ value: k, label: BRAKES[k].name })) },
        { key: 'decel', label: 'Braking', min: 1, max: 7, step: 0.5, unit: 'm/s²', fmt: v => v.toFixed(1), restructure: true }] },
      { group: 'The phone', when: isDev('phone'), items: [
        { key: 'cW', label: 'Charger rating', min: 5, max: 65, step: 1, unit: 'W', fmt: v => v.toFixed(0), restructure: true },
        { key: 'cap', label: 'Battery', min: 8, max: 25, step: 0.5, unit: 'Wh', fmt: v => v.toFixed(1), restructure: true },
        { key: 'charger', type: 'select', label: 'Charger', restructure: true, options: Object.keys(CHARGERS).map(k => ({ value: k, label: CHARGERS[k].name })) }] },
      { group: 'Display', when: is('chain', 'everyday'), items: [
        { key: 'ledger', type: 'select', label: 'Show the energy as', display: true, options: [{ value: 'sankey', label: 'A flow diagram' }, { value: 'bars', label: 'A bar ledger' }] }] }
    ],
    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    onDrag(S, e) {
      const A = S._ax && S._ax[e.id]; if (!A) return;
      const along = e.dx * A.ux + e.dy * A.uy, GAIN = 0.8;                      // the drawn axis is to scale; 0.8 keeps the ring under the finger
      const v = clamp(S.p[A.key] + along / A.len * (A.hi - A.lo) * GAIN, A.lo, A.hi);
      const it = { comp: [1, 8, 0.5], h: [0.05, 0.6, 0.01], h0: [0.08, 0.42, 0.01], tilt: [0, 80, 1] }[A.key];
      S.p[A.key] = clamp(Math.round(v / it[2]) * it[2], it[0], it[1]);
      this.setup(S);
    },
    plots: [
      { title: S => ({ forms: 'How each store grows with the energy', kinetic: 'This run: spring → kinetic → thermal', potential: 'This run: height → speed → heat', chain: 'Where the sunlight has gone, second by second', conserve: 'This run: the stores trade, the total stays', everyday: ({ kettle: 'The kettle heating', bike: 'The stop: kinetic energy into the brake', phone: 'The charge, and the power it draws' })[S.p.device] })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ forms: 'Everyday energies, ten decades on one line', kinetic: 'KE against speed for every cart', potential: 'Speed at the bottom against height, on four worlds', chain: 'Each link’s efficiency, and what is left', conserve: 'How high it gets back, on every track', everyday: ({ kettle: 'Useful share against how much you fill', bike: 'Brake temperature against speed', phone: 'Three chargers, one battery' })[S.p.device] })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],
    problems: [
      { source: 'NGSS MS-PS3-1 · CAST pattern: from a measurement to an energy',
        q: 'A medium spring (400 N/m) is squeezed 5.0 cm and launches a 0.50 kg cart on the aluminium track. The 5.0 cm flag blocks gate 1 for how long — and what speed does that give?',
        params: preset({ setup: 'kinetic' }),
        predict: { label: 'speed at gate 1', unit: 'm/s', tol: 0.02 },
        measure: S => trackOf(S).gates[0].v,
        working: 'The spring stores ½kx² = ½ × 400 × 0.05² = 0.50 J. If all of it became kinetic energy, ½mv² = 0.50 J gives v = √(2 × 0.50 ÷ 0.50) = 1.41 m/s. The flag blocks the beam for about 36 ms, and 0.05 m ÷ 0.036 s ≈ <b>1.39 m/s</b> — a little less, because rolling and air took about 3 % as heat before the gate.' },
      { source: 'NGSS MS-PS3-1 · CAST pattern: mass or speed?',
        q: 'Same spring, same squeeze, but the cart now carries mass bars to make 2.0 kg. What speed does gate 1 read?',
        params: preset({ setup: 'kinetic', m: 2.0 }),
        predict: { label: 'speed at gate 1', unit: 'm/s', tol: 0.03 },
        measure: S => trackOf(S).gates[0].v,
        working: 'The spring gives the same 0.50 J. Four times the mass with the same kinetic energy means v² is a quarter, so v halves: √(2 × 0.50 ÷ 2.0) = 0.71 m/s; the heavier cart presses harder on its wheels, loses a larger share to rolling, and the gate reads <b>0.67 m/s</b>. Kinetic energy depends on mass once and on speed twice.' },
      { source: 'NGSS MS-PS3-2 · CAST pattern: predicting from a model',
        q: 'The cart is released from 0.30 m up a 30° ramp on the aluminium track. What speed does gate 1, at the bottom, read?',
        params: preset({ setup: 'potential', h: 0.3, ang: 30 }),
        predict: { label: 'speed', unit: 'm/s', tol: 0.03 },
        measure: S => trackOf(S).gates[0].v,
        working: 'mgh = ½mv², so v = √(2gh) = √(2 × 9.81 × 0.30) = 2.43 m/s — whatever the mass. Rolling resistance on the 0.6 m slope and the 20 cm of flat before the gate take about 1 %: the gate reads <b>2.40 m/s</b>.' },
      { source: 'NGSS MS-PS3-2 · CAST pattern: the same experiment elsewhere',
        q: 'The same 0.30 m release on the Moon (g = 1.62 m/s²), on the air track. What speed at the bottom?',
        params: preset({ setup: 'potential', h: 0.3, planet: 'moon', surf: 'air' }),
        predict: { label: 'speed', unit: 'm/s', tol: 0.03 },
        measure: S => trackOf(S).gates[0].v,
        working: 'v = √(2 × 1.62 × 0.30) = 0.986 m/s, and the gate reads <b>0.982 m/s</b> — within half a percent. Six times less gravity stores six times less energy at the same height, and the speed falls by √6 ≈ 2.45.' },
      { source: 'NGSS MS-PS3-5 · CAST pattern: tracking energy through a system',
        q: 'Sunlight → monocrystalline panel (21 %) → lithium-ion battery (95 %) → coreless motor (78 %) → pulley (90 %) → falling mass → pulley (90 %) → generator (78 %) → LED (35 %). What share of the sunlight comes out as light?',
        params: preset({}),
        predict: { label: 'share', unit: '%', tol: 0.02 },
        measure: S => chainOf(S).overall * 100,
        working: 'Efficiencies multiply: 0.21 × 0.95 × 0.78 × 0.90 × 0.90 × 0.78 × 0.35 = 0.0344, so <b>3.44 %</b>. The other 96.6 % is not lost from the universe: it is thermal energy in the panel, the battery, the motor, the pulley, the generator and the lamp.' },
      { source: 'NGSS MS-PS3-3 · CAST pattern: an everyday transfer',
        q: 'A 2.0 kW kettle heats 1.0 L of water from 20 °C to boiling. Without losses it would take mcΔT ÷ P. How long does it really take?',
        params: preset({ setup: 'everyday' }),
        predict: { label: 'time', unit: 's', tol: 0.04 },
        measure: S => devOf(S).t,
        working: 'mcΔT = 1.0 × 4186 × 80 = 335 kJ; at 2000 W that is 167 s if every joule went into the water. The kettle’s own steel and element must warm too, and its sides lose heat to the room: it boils in about <b>185 s</b> — about 3 minutes, 90 % efficient.' },
      { source: 'NGSS MS-PS3-5 · CAST pattern: energy and temperature',
        q: 'An 80 kg rider at 8 m/s stops with a disc brake (a 120 g steel rotor, c = 490 J/kg·K). The rotor takes 85 % of the brakes’ heat. How much hotter does it get?',
        params: preset({ setup: 'everyday', device: 'bike' }),
        predict: { label: 'rotor ΔT', unit: 'K', tol: 0.04 },
        measure: S => devOf(S).dT,
        working: '½mv² = ½ × 80 × 8² = 2560 J. Air and tyres take about 100 J; the brakes take 2457 J, 85 % of it into the rotor: 2088 J ÷ (0.12 × 490) = <b>35.5 K</b>. Every stop on a long hill adds more — that is why disc brakes fade.' }
    ],
    walkthrough: [
      { title: 'Where does the lamp’s light come from?', ask: 'The lamp lights only while the mass falls. Trace its light back, store by store, to where it began.',
        reveal: '<b>The floodlight.</b> Light → electrical in the panel → chemical in the battery → kinetic in the motor → gravitational in the raised mass → kinetic in the generator → electrical → light. Each arrow on the bench is a transfer; each label is a store.', params: preset({}) },
      { title: 'Is any energy used up?', ask: 'After 90 s, 6000 J of sunlight has gone in and only about 20 J of light came out. Where is the rest?',
        reveal: '<b>All of it is still there, mostly as thermal energy</b> — the flow diagram shows each heat share. The bar ledger adds them up: in = stored + light + heat, to the joule. Energy is never used up; it is spread out where it is no longer useful.', params: preset({ ledger: 'bars' }) },
      { title: 'Mass or speed?', ask: 'Which raises a cart’s kinetic energy more: doubling its mass or doubling its speed?',
        reveal: '<b>Doubling the speed — four times the energy.</b> Run the stiff spring at 8 cm: about 1.6 times the speed of the medium one at 5 cm for 3.2 J against 0.5 J. On the KE–v plot every mass is a parabola.', params: preset({ setup: 'kinetic', spring: 'stiff', comp: 8 }) },
      { title: 'Heavy and light from the same height', ask: 'A 2 kg cart and a 0.25 kg cart roll down the same ramp from 0.3 m. Which is faster at the bottom?',
        reveal: '<b>Neither — both read about 2.4 m/s.</b> The heavier cart stores more energy (mgh) but has more mass to move (½mv²); m cancels. On the Moon both would read 0.99 m/s.', params: preset({ setup: 'potential', m: 2.0 }) },
      { title: 'The valley that never gets back up', ask: 'Release the cart from 0.35 m into the valley. Each time it turns round it is a little lower. Is energy being destroyed?',
        reveal: '<b>No — the total line on the plot is flat.</b> The thermal bar grows by exactly what kinetic and gravitational lose. The track warms by a few thousandths of a kelvin: real, and too small to feel.', params: preset({ setup: 'conserve' }) },
      { title: 'Make it worse on purpose', ask: 'Add the strong magnet brake. Does the total change now?',
        reveal: '<b>The total is still flat;</b> the thermal share rises much faster, almost all of it in the aluminium fin under the cart where eddy currents flow. Brakes are machines for turning kinetic energy into heat.', params: preset({ setup: 'conserve', mag: 'strong' }) },
      { title: 'One cup or a full kettle?', ask: 'Boil just one cup (0.25 L). Is that more or less efficient than boiling a litre?',
        reveal: '<b>Less efficient, but far less energy in total.</b> The kettle’s body needs the same heat whatever the fill, so a small fill wastes a bigger share (plot 2). The cheapest joule is the one you never heat.', params: preset({ setup: 'everyday', kV: 0.25 }) }
    ],
    quiz: [
      { q: 'A 1 kg cart and a 2 kg cart move at the same speed. The 2 kg cart has…', options: ['the same kinetic energy', 'twice the kinetic energy', 'four times the kinetic energy', 'half the kinetic energy'], answer: 1,
        why: 'KE = ½mv²: twice the mass at the same speed is twice the energy. Twice the speed would be four times.' },
      { q: 'A solar-powered lamp chain is 3 % efficient. The other 97 % of the sunlight…', options: ['is destroyed', 'is used up by the battery', 'becomes thermal energy spread through the parts and the air', 'goes back to the Sun'], answer: 2,
        why: 'Energy is conserved. The flow diagram shows each heat share: panel, battery, motor, pulley, generator, lamp.' },
      { q: 'Two balls are dropped from the same height on Earth, one heavy and one light (no air resistance). At the floor…', options: ['the heavy one is faster', 'the light one is faster', 'they have the same speed', 'they have the same energy'], answer: 2,
        why: 'mgh = ½mv², so v = √(2gh): the mass cancels. The heavy ball does carry more energy.' },
      { q: 'A cart rolls to and fro in a valley and finally stops at the bottom. Its energy…', options: ['was used up', 'turned into thermal energy in the wheels, track and air', 'turned into mass', 'is stored in the track as gravitational energy'], answer: 1,
        why: 'The ledger shows thermal energy growing by exactly what the other stores lose.' },
      { q: 'A battery stores energy as…', options: ['electricity', 'chemical energy, released as an electric current flows', 'heat', 'light'], answer: 1,
        why: 'A battery holds no “electricity” — it holds chemicals that release energy as charge moves through the circuit.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Light gates</b> measure speed as a flag’s width over the time it blocks the beam — exactly how school data-loggers and timing systems work.</li>' +
      '<li><b>Solar chains</b> — real panels convert 15–23 % of sunlight; lithium-ion batteries return about 95 % of what goes in; LEDs turn about a third of their electrical energy into light, filament bulbs about 5 %.</li>' +
      '<li><b>Regenerative braking</b> in electric cars and trains runs the motor as a generator — the falling mass on this bench does the same.</li>' +
      '<li><b>Kettles</b> — boiling only what you need is one of the simplest energy savings in a kitchen; a full kettle of 1.7 L takes about 0.16 kWh.</li></ul>' +
      '<b>What the lab assumes.</b> The cart is integrated along the track’s arc length with gravity, rolling resistance (proportional to the normal force, which includes the curve’s centripetal part), air drag ½ρC<sub>d</sub>Av² and an eddy-current brake bv. The chain’s motor draws 3 W and its mass falls at a steady 0.25 m/s through the generator. The kettle is lumped (water plus 550 g of steel) with losses from its sides and evaporation from its top; the bicycle’s brakes supply a constant deceleration; the phone charges at constant power to 80 % and then tapers.' +
      '<div class="pyq"><em>Misconception to catch</em> “Energy gets used up.” It never does: it is transferred and spread out until it is no longer useful — usually as thermal energy in the surroundings. And a battery does not store electricity; it stores chemical energy.</div>'
  });

  const MODEL = Object.assign({}, MODEL0, { BASE: () => preset({}), trackOpts, SETUPS, MAG });
  L.models = L.models || {};
  L.models['g6c-energy-chain'] = MODEL;
})(window.InsightLab);
