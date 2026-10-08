/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-5  The Body During Exercise
   (B5.1 Digestion and circulation; B5.2 Circulation and respiration;
    B5.3 Nervous and muscular; B5.4 Excretion and internal balance;
    B5.5 Case study: exercise; B5.6 Interactions, generalised)

   One coupled model of a whole body, worked out second by second:
     muscle O₂ demand from the power on a cycle ergometer (≈ 11.8 mL/min per W),
     O₂ uptake with its 30-s lag, cardiac output and stroke volume to carry it
     (Fick: VO₂ = CO × a-v O₂ difference), heart rate = output ÷ stroke volume,
     ventilation set by CO₂ (a feed-forward plus 2 L/min per mmHg of PaCO₂),
     lactate past ~60 % of VO₂max, heat → sweat → water lost → plasma volume
     → stroke volume, and the blood shared between the organs.
     meal     — a meal's glucose: gut absorption, the portal vein and liver,
                insulin from the pancreas, uptake by muscle (and a walk).
     oxygen   — breathe 5 % CO₂, 12 % O₂ or pure O₂: what really drives breathing.
     move     — a motor-neuron pool driving a muscle (Henneman's size principle),
                rate coding, EMG, and fatigue (Rohmert's endurance curve).
     balance  — a long ride in the heat: core temperature, sweat, water, kidneys.
     exercise — rest → ride → recover, every system on one timeline.
     break    — anaemia, asthma, a blocked leg artery, dehydration, heart failure:
                watch the other systems compensate.
   Registration and every model load without a page; only drawing uses G6B, R3.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, GA = () => window.G6B;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const hill = P => Math.pow(P, 2.7) / (Math.pow(P, 2.7) + Math.pow(26.8, 2.7));

  /* ============================================================
     THE BODY AT WORK — one integrator for oxygen, blood, breath, lactate, heat and water
     ============================================================ */
  const FIT = { untrained: { svMax: 85, name: 'untrained' }, trained: { svMax: 115, name: 'trained (endurance)' } };
  const FAULT = {
    none: { name: 'healthy', hb: 150, veMax: 150, leg: 1, pv: 1, sv: 1 },
    anaemia: { name: 'anaemia (Hb 90 g/L)', hb: 90, veMax: 150, leg: 1, pv: 1, sv: 1 },
    asthma: { name: 'asthma (airways narrowed)', hb: 150, veMax: 25, leg: 1, pv: 1, sv: 1 },
    artery: { name: 'a blocked leg artery', hb: 150, veMax: 150, leg: 0.35, pv: 1, sv: 1 },
    dehyd: { name: 'dehydration (2 L short)', hb: 150, veMax: 150, leg: 1, pv: 0.86, sv: 1 },
    heart: { name: 'a weak heart (heart failure)', hb: 150, veMax: 150, leg: 1, pv: 1, sv: 0.7 }
  };
  const GAS = { air: { name: 'room air', FiO2: 0.21, FiCO2: 0 }, co2: { name: '5 % CO₂ in air', FiO2: 0.2, FiCO2: 0.05 }, hypox: { name: '12 % O₂ (as at 4400 m)', FiO2: 0.12, FiCO2: 0 }, o2: { name: 'pure oxygen', FiO2: 1, FiCO2: 0 } };
  const CO2_GAIN = 2.0, O2_GAIN = 0.6;          // L/min per mmHg of PaCO₂ above 40; per mmHg of PaO₂ below 60
  const VD = 1.3;                               // breathing ÷ alveolar ventilation (dead space)
  /* the subject: age sets HRmax (Tanaka 208 − 0.7·age); fitness the biggest stroke volume */
  function subject(p) {
    const f = FAULT[p.setup === 'break' ? p.fault : 'none'];          // a fault belongs to the break set-up only
    return { HRmax: 208 - 0.7 * p.age, svMax: FIT[p.fit].svMax * f.sv, hb: f.hb, veMax: f.veMax, leg: f.leg, pv0: f.pv, mass: p.mass, vo2rest: 0.0036 * p.mass };
  }
  /* steady-state VO₂ asked for by the muscles at power P (W) */
  const vo2Need = (sub, P) => sub.vo2rest + 0.0118 * P;
  function vo2maxOf(sub, pv) {
    const svMax = sub.svMax * (0.55 + 0.45 * pv), COmax = sub.HRmax * svMax / 1000, CaO2 = sub.hb * 1.34 * 0.975;
    return COmax * Math.max(0, CaO2 - 50) / 1000 * (sub.leg < 1 ? (0.25 + 0.75 * sub.leg) : 1);
  }
  /* run the body for T seconds; power(t) W, gas(t) the gas breathed; env: air °C, humidity %, drink L/h */
  function bodyRun(p, power, gas, T, dt) {
    const sub = subject(p);
    const s = { vo2: sub.vo2rest, L: 1.0, temp: 37, water: 0, pv: sub.pv0, paco2: 40, urine: 0, ve: 6 }, out = [];
    for (let t = 0; t <= T + 1e-9; t += dt) {
      const P = power(t), G = GAS[gas(t)], CaO2Full = sub.hb * 1.34;
      const vmax = vo2maxOf(sub, s.pv), need = vo2Need(sub, P), target = Math.min(need, vmax);
      s.vo2 += (target - s.vo2) * (1 - Math.exp(-dt / (target > s.vo2 ? 30 : 45)));
      // lactate: made past ~60 % of VO₂max (and fast if the need exceeds the max), cleared with a 10-min time constant
      const frac = need / Math.max(0.1, vmax), prod = 2 * Math.max(0, frac - 0.6) ** 2 + 1.5 * Math.max(0, need - vmax) / Math.max(0.1, vmax);
      s.L = clamp(s.L + (prod - (s.L - 1) / 10) * dt / 60, 0.8, 18);
      // breathing: VCO₂ from VO₂ (RER rises with effort) plus CO₂ from buffering lactate; solve for PaCO₂
      const RER = clamp(0.8 + 0.5 * clamp(frac - 0.5, 0, 0.5), 0.8, 1.05), vco2 = RER * s.vo2 + 0.25 * prod;
      // solve VE = drive(PaCO₂(VE), PaO₂(VE)) by bisection: the drive falls as VE rises, so there is one crossing
      const VEff = VD * 863 * vco2 / 40, gasAt = v => { const c = 863 * vco2 * VD / v + G.FiCO2 * 713; return [c, G.FiO2 * 713 - c / 0.8]; };
      const drive = v => { const [c, o] = gasAt(v); return Math.min(sub.veMax, Math.max(3, VEff + CO2_GAIN * (c - 40) + O2_GAIN * Math.max(0, 60 - o))); };
      let lo = 1, hi = 200; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (m < drive(m)) lo = m; else hi = m; }
      let VE = (lo + hi) / 2; const gs = gasAt(VE), pc = gs[0], po = gs[1];
      s.ve = VE; s.paco2 = pc;
      const sat = hill(Math.max(1, Math.min(600, po))), CaO2 = CaO2Full * Math.min(1, sat);
      // the heart: output to carry the oxygen with the venous blood at least ~50 mL/L … (Fick), stroke volume rising, HR = CO ÷ SV
      const svMax = sub.svMax * (0.55 + 0.45 * s.pv), COmax = sub.HRmax * svMax / 1000;
      // … plus the extra blood sent to the skin to shed heat (it competes with the muscles in the heat)
      const skinX = clamp(0.003 * (s.sweat || 0) + 0.08 * Math.max(0, p.airT - 25), 0, 2.7);
      const CO = clamp(Math.max(5 * (p.mass / 70) + 5.5 * (s.vo2 - sub.vo2rest), s.vo2 * 1000 / Math.max(20, (CaO2 - 30) * 0.85)) + skinX, 3, COmax);
      const svRest = svMax * 0.82, SV = svRest + (svMax - svRest) * clamp((CO - 5) / 8, 0, 1), HR = clamp(CO * 1000 / SV, 35, sub.HRmax);
      // heat: 22 % efficient, so ~3.5 W of heat for each watt on the pedals; sweat follows core temperature
      const M = 1.2 * p.mass + P * (1 / 0.22 - 1), dry = 0.075 * p.mass * (s.temp - p.airT), Emax = 1000 * Math.max(0.05, 1 - p.rh / 100) / 0.6;
      const sweat = clamp(600 * (s.temp - 37), 0, Math.min(1000, Emax));
      s.temp += (M - dry - sweat) / (3470 * p.mass) * dt;
      s.sweat = sweat;
      // water: sweat (2.43 MJ per L) + breath; drinking replaces some; plasma volume follows; the kidneys hold water back
      const urine = (1.0 * clamp(1 - s.water * 0.4, 0.25, 1) * (1 - 0.6 * clamp(frac, 0, 1))) / 1000 / 60;   // L/s: ADH and less kidney blood flow cut urine in exercise
      s.water = Math.max(0, s.water + (sweat / 2.43e6 + 0.01 / 3600 * (VE / 10) + urine - p.drink / 3600) * dt);
      s.urine += urine * dt;
      s.pv = clamp(sub.pv0 - s.water * 0.08, 0.55, 1.1);
      // blood shared out: brain fixed, heart 4 %, skin with heat, gut and kidneys squeezed as effort rises, muscle the rest
      const effort = clamp((s.vo2 - sub.vo2rest) / Math.max(0.1, vmax - sub.vo2rest), 0, 1);
      const brain = 0.75, heart = 0.04 * CO, skin = clamp(0.3 + 0.006 * Math.max(0, sweat) + 0.08 * Math.max(0, p.airT - 25), 0.2, 3), gut = 1.4 * (1 - 0.7 * effort), kid = 1.1 * (1 - 0.7 * effort);
      const muscle = Math.max(0.6, CO - brain - heart - skin - gut - kid - 0.5);
      out.push({ t, P, need, vo2: s.vo2, vmax, L: s.L, VE, paco2: pc, pao2: po, sat, CO, SV, HR, temp: s.temp, sweat, water: s.water, pv: s.pv, urine: s.urine * 1000, flow: { brain, heart, skin, gut, kidneys: kid, muscle, other: 0.5 }, effort, frac });
    }
    return out;
  }
  const rowAt = (R, t) => R[clamp(Math.round(t / (R[1] ? R[1].t - R[0].t : 1)), 0, R.length - 1)];
  /* steady state at a power, for the landscape plots */
  function steady(p, P) { const R = bodyRun(p, () => P, () => 'air', 300, 2); return R[R.length - 1]; }

  /* ============================================================
     B5.1 · A MEAL — gut, portal vein, liver, insulin, muscle
     ============================================================ */
  const FOOD = { drink: { name: 'a glucose drink', tau: 30 }, bread: { name: 'white bread', tau: 40 }, pasta: { name: 'pasta', tau: 65 } };
  const DIAB = { none: { name: 'healthy', beta: 1, sens: 1, Ib: 8 }, type2: { name: 'type 2 diabetes', beta: 0.4, sens: 0.18, Ib: 14 }, type1: { name: 'type 1 diabetes', beta: 0, sens: 1, Ib: 0 } };
  const GVOL = 14 * 0.18;                        // g of glucose per mM in the body's 14 L of extracellular water
  function mealRun(p) {
    const f = FOOD[p.food], d = DIAB[p.diab], out = [], dt = 0.5;
    let G = d.Ib ? 5 : 8, I = d.Ib, eaten = 0;
    for (let m = 0; m <= 240 + 1e-9; m += dt) {
      const Ra = p.carbs * (m / (f.tau * f.tau)) * Math.exp(-m / f.tau);                   // g/min from the gut (gamma, all of it absorbed)
      const Itarget = d.Ib + d.beta * 14 * Math.max(0, G - 5) + (p.insulin && d.beta === 0 ? 30 * Math.exp(-m / 90) : 0);
      I += (Itarget - I) * (1 - Math.exp(-dt / 10));
      const walk = m >= p.walkAt && m < p.walkAt + p.walkMin ? p.walkW : 0;
      const brain = 0.083 * G / (G + 1) * 1.2, ins = 0.0052 * d.sens * I * G / 5, ex = 0.0004 * walk * G / 5;
      const renal = 0.06 * Math.max(0, G - 10);                                              // above ~10 mmol/L the kidneys can no longer hold it: glucose in the urine
      const HGO = 0.125 * clamp(1 + 0.6 * (1 - I / 8 * (d.sens < 1 ? d.sens * 1.5 : 1)), -0.3, 1.8);
      G = Math.max(1, G + (Ra * (1 - 0.3 * clamp(I / 40, 0, 1)) + HGO - brain - ins - ex - renal) * dt / GVOL);    // with insulin up, the liver keeps up to 30 % of what passes it
      eaten += Ra * dt;
      out.push({ m, G, I, Ra, HGO, uptake: brain + ins + ex, gutFlow: 1.4 + 1.0 * clamp(Ra / 0.8, 0, 1), eaten, walk });
    }
    const at = m => out[clamp(Math.round(m / dt), 0, out.length - 1)], peak = out.reduce((a, b) => b.G > a.G ? b : a);
    return { out, at, peak, g2h: at(120).G };
  }

  /* ============================================================
     B5.3 · MOTOR UNITS — the size principle, rate coding, EMG, fatigue
     ============================================================ */
  const MU = { N: 120, range: 100, fMin: 8, fMax: 35, gain: 0.6 };
  const MUSCLE = { hand: { name: 'a hand muscle (first dorsal interosseous)', rmax: 0.5 }, thigh: { name: 'a thigh muscle (vastus lateralis)', rmax: 0.8 } };
  function unitsOf(p) {
    const r = rng(500 + p.seed * 31), N = MU.N, out = [];
    for (let i = 0; i < N; i++) {
      const sz = Math.exp(Math.log(MU.range) * i / (N - 1)) / MU.range;                    // twitch force: the smallest 1 %, the largest 100
      const thr = MUSCLE[p.mus].rmax * (Math.exp(Math.log(30) * i / (N - 1)) - 1) / 29;      // recruitment threshold, smallest first
      out.push({ i, P: sz, size: Math.sqrt(sz), thr, dead: r() < p.loss / 100, cap: 1, on: false, rate: 0 });
    }
    if (p.reinn) { const alive = out.filter(u => !u.dead), lost = out.filter(u => u.dead).reduce((u, v) => u + v.P, 0); alive.forEach(u => { u.P += lost / Math.max(1, alive.length) * 1.0; }); }
    return out;
  }
  const rateGain = f => (1 - Math.exp(-Math.pow(f / 15, 2))) / (1 - Math.exp(-Math.pow(MU.fMax / 15, 2)));
  const rateOf = (u, E) => E < u.thr ? 0 : Math.min(MU.fMax, MU.fMin + MU.gain * (E - u.thr) * 100);
  function forceAt(U, E, total) { let F = 0; U.forEach(u => { if (u.dead) return; const f = rateOf(u, E); if (f > 0) F += u.P * u.cap * rateGain(f); }); return F / total; }
  function solveE(U, target, total) { if (forceAt(U, 1, total) < target) return 1.01; let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (forceAt(U, m, total) < target) lo = m; else hi = m; } return hi; }
  /* hold a force for T s: units tire in proportion to how hard they work (bigger, faster units tire faster) */
  const FATIGUE_K = 0.03;
  function holdRun(p, T, dt) {
    const U = unitsOf(p), total = U.reduce((u, v) => u + (v.dead ? 0 : v.P), 0) || 1, fresh = unitsOf(Object.assign({}, p, { loss: 0, reinn: false })).reduce((u, v) => u + v.P, 0);
    const tgt = p.force / 100 * fresh / total, out = []; let fail = null;
    for (let t = 0; t <= T + 1e-9; t += dt) {
      const E = solveE(U, Math.min(tgt, 5), total), Eo = Math.min(E, 1);
      let emg = 0, n = 0;
      U.forEach(u => { u.rate = u.dead ? 0 : rateOf(u, Eo); u.on = u.rate > 0; if (u.on) { emg += Math.sqrt(u.P) * u.rate; n++; } if (p.fatigue) u.cap = Math.max(0.05, u.cap - FATIGUE_K * u.cap * (u.on ? rateGain(u.rate) ** 2 : 0) * (0.3 + 0.7 * u.size) * dt); });
      const F = forceAt(U, Eo, total) * total / fresh * 100;
      if (fail == null && E > 1) fail = t;
      out.push({ t, E: Eo, F, emg, n, need: E });
    }
    return { out, fail, U, total, fresh };
  }
  const emgMax = p => { const U = unitsOf(Object.assign({}, p, { loss: 0 })); return U.reduce((s, u) => s + Math.sqrt(u.P) * MU.fMax, 0); };
  function endurance(p, force) { const R = holdRun(Object.assign({}, p, { force, fatigue: true }), 1200, 2); return R.fail == null ? Infinity : R.fail; }

  /* ============================================================
     SET-UPS AND PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'meal', label: 'A meal: from gut to blood to muscle', teaches: ['B5.1'] },
    { value: 'oxygen', label: 'What makes us breathe harder?', teaches: ['B5.2'] },
    { value: 'move', label: 'Nerves recruit muscle fibres', teaches: ['B5.3'] },
    { value: 'balance', label: 'A long ride in the heat: water and the kidneys', teaches: ['B5.4'] },
    { value: 'exercise', label: 'Rest, ride, recover: every system', teaches: ['B5.5'] },
    { value: 'break', label: 'Break one system: watch the others', teaches: ['B5.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const isAny = (...v) => S => v.includes(S.p.setup);
  const BASE = {
    setup: 'exercise',
    carbs: 75, food: 'drink', diab: 'none', insulin: false, walkW: 0, walkAt: 30, walkMin: 30,
    gas: 'co2', power: 120, fit: 'untrained', age: 15, mass: 60, airT: 20, rh: 50, drink: 0, ride: 6, fault: 'anaemia',
    mus: 'hand', force: 30, fatigue: true, loss: 0, reinn: false, seed: 1,
    lapse: 1, hours: 2
  };
  const SETUP_DEFAULTS = { meal: {}, oxygen: { power: 0 }, move: {}, balance: { airT: 32, rh: 50, power: 80, drink: 0 }, exercise: { power: 100 }, break: { power: 100, fault: 'anaemia' } };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const HOMES = {
    meal: { theta: -1.1, phi: 0.55, dist: 0.65, target: [0, 0.02, 0.03] },
    oxygen: { theta: -1.05, phi: 0.2, dist: 1.9, target: [0.05, 0.05, 0.4] },
    move: { theta: -1.1, phi: 0.5, dist: 0.8, target: [-0.04, -0.06, 0.06] },
    balance: { theta: -1.05, phi: 0.2, dist: 1.9, target: [0.05, 0.05, 0.4] },
    exercise: { theta: -1.05, phi: 0.2, dist: 1.9, target: [0.05, 0.05, 0.4] },
    break: { theta: -1.05, phi: 0.2, dist: 1.9, target: [0.05, 0.05, 0.4] }
  };
  /* each set-up's protocol */
  const PROTO = {
    oxygen: { T: () => 300, power: p => () => p.power, gas: p => t => t < GAS0 ? 'air' : p.gas },
    exercise: { T: p => RIDE0 + p.ride * 60 + 360, power: p => t => t >= RIDE0 && t < RIDE0 + p.ride * 60 ? p.power : 0, gas: () => () => 'air' },
    break: { T: p => RIDE0 + p.ride * 60 + 360, power: p => t => t >= RIDE0 && t < RIDE0 + p.ride * 60 ? p.power : 0, gas: () => () => 'air' },
    balance: { T: () => 3 * 3600, power: p => t => t < p.hours * 3600 ? p.power : 0, gas: () => () => 'air' }
  };

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    S.ts = 0; S.R = null; S.Rh = null; S.meal = null; S.hold = null; S.phase = 0;
    const pr = PROTO[p.setup];
    if (pr) {
      const dt = p.setup === 'balance' ? 10 : 1;
      S.R = bodyRun(p, pr.power(p), pr.gas(p), pr.T(p), dt);
      if (p.setup === 'break') S.Rh = bodyRun(Object.assign({}, p, { fault: 'none' }), pr.power(p), pr.gas(p), pr.T(p), dt);
    }
    if (p.setup === 'break') S.ts = RIDE0 + Math.min(180, p.ride * 60 - 30);       // open three minutes into the ride, where the difference shows; the plot holds the whole run
    if (p.setup === 'meal') S.meal = mealRun(p);
    if (p.setup === 'move') S.hold = holdRun(p, 300, 0.5);
    if (!S.cam || S.camFor !== p.setup) { const h = HOMES[p.setup]; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: 0.72 }); S.cam.minDist = 0.3; S.cam.maxDist = 5; S.camFor = p.setup; }
  }
  const RIDE0 = 15, GAS0 = 20;                   // s of rest before the ride starts; s of room air before the gas                              // s of rest before the ride starts
  const T_OF = { meal: () => 240 * 60, oxygen: () => 300, move: () => 300, balance: () => 3 * 3600, exercise: p => RIDE0 + p.ride * 60 + 360, break: p => RIDE0 + p.ride * 60 + 360 };
  const SPEED = { meal: 600, oxygen: 15, move: 4, balance: 1800, exercise: 15, break: 15 };     // seconds of the experiment per second on screen, before the time-lapse
  function step(S, dt) {
    const p = S.p;
    S.ts = Math.min(T_OF[p.setup](p), S.ts + dt * SPEED[p.setup] * (p.lapse || 1));
    const r = S.R ? rowAt(S.R, S.ts) : null;
    S.phase += dt * (r && r.P > 0 ? TAU * 70 / 60 : 0);
  }
  const now = S => S.R ? rowAt(S.R, S.ts) : null;

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const lcdCache = {};
  function lcd(title, value, unit, col) { const key = [title, value, unit].join('|'); if (!lcdCache[key]) { if (Object.keys(lcdCache).length > 60) Object.keys(lcdCache).forEach(k => delete lcdCache[k]); lcdCache[key] = BENCH.lcdTex(title, value, unit, col || '#7CF0C0'); } return lcdCache[key]; }
  function lay(g) {
    const W = g.w, H = g.h, narrow = W < 640;
    if (narrow) return { narrow, W, H, px: 10, py: 102, pw: W - 20, ph: H - 102 - 56, bw: 0 };
    const pw = Math.min(W * 0.48, 540);
    return { narrow, W, H, px: W - pw - 12, py: 84, pw, ph: H - 84 - 30, bw: W - pw - 26 };
  }
  let screenCv = null, scopeCv = null;
  function cartScreen(S) {
    if (typeof document === 'undefined' || !S.R) return null;
    const R = S.R, i1 = R.findIndex(q => q.t >= S.ts), win = R.slice(Math.max(0, i1 - 120), i1 + 1), n = Math.max(1, win.length - 1);
    const hrS = win.map((q, i) => [i / n, (q.HR - 40) / 180]), veS = win.map((q, i) => [i / n, q.VE / 150]);
    const r = now(S);
    screenCv = G6Btrace(screenCv, [{ col: '#FF6A6A', pts: hrS }, { col: '#8FD4FA', pts: veS }], { text: ['HR ' + r.HR.toFixed(0), 'VE ' + r.VE.toFixed(0) + ' L/min', 'VO2 ' + r.vo2.toFixed(2)] });
    return screenCv;
  }
  const G6Btrace = (cv, s, o) => GA().traceTex(cv, s, o);
  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, G = GA(), bw = Ly.bw;
    if (!cam || bw < 200) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 14, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 }), lab = [];
    if (p.setup === 'meal') {
      MEAS.bench(F, -0.32, 0.32, -0.2, 0.22, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.32, 0.32, 0.22, 0, 0.45);
      const M = S.meal, m = S.ts / 60, r = M.at(m);
      G.glucoseBench(F, [0, 0], { drink: p.food === 'drink' ? 1 - clamp(m / 5, 0, 1) : 0, food: m < 10 ? p.food : null, lcd: lcd('GLUCOSE', r.G.toFixed(1), 'mmol/L') });
      lab.push([[0.04, -0.02, 0.03], 'glucometer: a drop of blood every 15 min', 30, -40], [[-0.12, 0, 0.12], p.carbs + ' g of carbohydrate as ' + FOOD[p.food].name, -30, -30]);
    } else if (p.setup === 'move') {
      MEAS.bench(F, -0.32, 0.32, -0.3, 0.2, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.32, 0.32, 0.2, 0, 0.45);
      const H = S.hold, r = H.out[clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1)];
      if (typeof document !== 'undefined') { const win = H.out.slice(Math.max(0, Math.round(S.ts / 0.5) - 40), Math.round(S.ts / 0.5) + 1), n = Math.max(1, win.length - 1), em = emgMax(p); scopeCv = G.traceTex(scopeCv, [{ col: '#7CF0C0', pts: win.map((q, i) => [i / n, 0.5 + 0.45 * (q.emg / em) * Math.sin(i * 7.3 + q.t * 31) ]) }, { col: '#FFD66B', pts: win.map((q, i) => [i / n, q.F / 100]) }], { text: ['EMG ' + Math.round(r.emg / em * 100) + ' %', 'force ' + r.F.toFixed(0) + ' %'] }); }
      G.gripBench(F, [0.05, 0.02], { squeeze: r.F / 100, screen: scopeCv, dial: G.gaugeTex(r.F, 100) });
      lab.push([[-0.15, 0.01, 0.09], 'EMG electrodes over the muscle', -30, -70], [[0.06, 0.02, 0.15], 'grip dynamometer: % of your best', 40, -20], [[-0.04, -0.22, 0.14], 'the EMG and the force', -30, 50]);
    } else {
      MEAS.bench(F, -0.6, 0.6, -0.45, 0.45, { cabinet: false, tone: '#3A3E46' }); MEAS.tileWall(F, -0.6, 0.6, 0.45, 0, 1.0);
      const r = now(S), e = G.ergometer(F, [0, 0.05], { phase: S.phase, lcd: lcd('LOAD', r.P.toFixed(0), 'W') });
      G.cart(F, [-0.42, 0.25], { screen: cartScreen(S), mouth: e.mouth });
      if (p.setup === 'oxygen') { G.gasCylinder(F, [-0.42, -0.1], p.gas === 'co2' ? '#8A9098' : p.gas === 'o2' ? '#F2F4F6' : p.gas === 'hypox' ? '#3A7AD8' : '#5A6470', GAS[p.gas].name); lab.push([[-0.42, -0.1, 0.6], 'from 20 s on: ' + GAS[p.gas].name, -20, -40]); }
      if (p.setup === 'balance') { R3.cylinder(F, [0.32, -0.32, 0], [0.32, -0.32, 0.2], 0.035, p.drink > 0 ? '#5AA8E8' : '#C8CED6', { segments: 16 }); lab.push([[0.32, -0.32, 0.1], p.drink > 0 ? (p.drink * 1000).toFixed(0) + ' mL an hour to drink' : 'bottle empty: no drink', 30, 40]); }
      lab.push([[0.12, 0.05, 0.3], 'cycle ergometer: ' + r.P.toFixed(0) + ' W', 30, 30], [[-0.42, 0.24, 0.7], 'gas analysers: O₂ in, CO₂ out, litres', -20, -40], [[-0.02, 0.05, 0.85], 'mouthpiece', 20, -30]);
    }
    F.render();
    if (g.labels) G.benchLabels(ctx, cam, lab, bw, g.h);
    ctx.restore();
  }
  function flowRows(r, rest) { const cols = { brain: '#E3A5A0', heart: '#FF6A6A', muscle: '#FF8A80', skin: '#FFB35C', gut: '#E2A68E', kidneys: '#C89BFF' }; return ['muscle', 'gut', 'kidneys', 'skin', 'brain', 'heart'].map(k => ({ name: k, now: r.flow[k], rest: rest.flow[k], col: cols[k] })); }
  function drawPanel(S, g, Ly) {
    const p = S.p, ctx = g.ctx, G = GA(), { px, py, pw, ph } = Ly;
    if (p.setup === 'meal') {
      const r = S.meal.at(S.ts / 60);
      G.plate(ctx, px, py, pw, ph, () => { const A = G.glucoseRoute(ctx, px + 10, py + 10, pw - 20, ph - 20, { t: S.t || 0, absorb: r.Ra / 0.8, glucose: r.G, insulin: r.I });
        if (g.labels) G.sideLabels(ctx, [[A.gut, 'gut: ' + r.Ra.toFixed(2) + ' g/min in'], [A.liver, 'liver: ' + (r.HGO >= 0 ? 'gives ' : 'stores ') + Math.abs(r.HGO).toFixed(2) + ' g/min'], [A.heart, 'heart: pumps it round'], [A.body, 'muscles: take ' + r.uptake.toFixed(2) + ' g/min'], [A.panc, 'pancreas: insulin ' + r.I.toFixed(0) + ' mU/L'], [A.brain, 'brain: 5 g an hour']].map(([a, t]) => ({ x: a[0], y: a[1], text: t, side: 'R' })), { mid: 0, xL: px, xR: px + pw * 0.56, top: py + 12, bottom: py + ph - 10, maxW: pw * 0.42, size: 9.5 }); });
      G.caption(ctx, px, py - 4, pw, 'glucose: gut → liver → heart → cells', 'gut blood ' + r.gutFlow.toFixed(1) + ' L/min');
      return;
    }
    if (p.setup === 'move') {
      const H = S.hold, idx = clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1);
      // replay the unit states at this moment: recompute the fatigue to here
      if (!S._unitsAt || S._unitsAt.k !== idx || S._unitsAt.key !== JSON.stringify(p)) { const R = holdRun(p, idx * 0.5, 0.5); S._unitsAt = { k: idx, key: JSON.stringify(p), U: R.U }; }
      G.plate(ctx, px, py, pw, ph, () => { const A = G.motorPool(ctx, px, py, pw, ph, S._unitsAt.U, { t: S.t || 0 }); if (g.labels) { G.tag(ctx, px + 8, py + 12, 'motor neurons, small → large', { size: 9.5, align: 'left' }); G.tag(ctx, A.fibres[0], py + 12, 'their muscle fibres', { size: 9.5 }); } });
      G.caption(ctx, px, py - 4, pw, 'the motor-neuron pool in the spinal cord', H.out[idx].n + ' of ' + MU.N + ' units firing');
      return;
    }
    const r = now(S), rest = S.R[0];
    const bh = ph * (Ly.narrow ? 0.6 : 0.66);
    G.plate(ctx, px, py, pw, bh, () => { const A = G.bodyAtWork(ctx, px + pw * 0.3, py + 6, bh - 10, { beat: 0.5 - 0.5 * Math.cos((S.t || 0) * TAU * r.HR / 60), flow: ((S.t || 0) * r.HR / 60 * 0.2) % 1, flowMuscle: clamp(r.flow.muscle / 15, 0, 1), sweat: clamp(r.sweat / 600, 0, 1), gutFlow: r.flow.gut / 1.4, kidneyFlow: r.flow.kidneys / 1.1, hot: clamp((r.temp - 37) / 2, 0, 1), ve: r.VE, t: S.t || 0, off: p.setup === 'break' ? ({ asthma: 'lungs', heart: 'heart', anaemia: null, artery: null, dehyd: null, none: null })[p.fault] : null });
      if (g.labels) G.sideLabels(ctx, [{ x: A.heart[0], y: A.heart[1], text: 'heart ' + r.HR.toFixed(0) + '/min', side: 'R' }, { x: A.lungs[0], y: A.lungs[1], text: 'lungs ' + r.VE.toFixed(0) + ' L/min', side: 'R' }, { x: A.muscle[0], y: A.muscle[1], text: 'leg muscles ' + r.flow.muscle.toFixed(1) + ' L/min', side: 'R' }, { x: A.skin[0], y: A.skin[1], text: 'skin ' + r.temp.toFixed(1) + ' °C', side: 'R' }, { x: A.kidneys[0], y: A.kidneys[1], text: 'kidneys, gut: less blood', side: 'R' }], { mid: 0, xL: px + 6, xR: px + pw * 0.56, top: py + 12, bottom: py + bh - 10, maxW: pw * 0.42 }); });
    G.caption(ctx, px, py - 4, pw, 'the body at ' + r.P.toFixed(0) + ' W', 'O₂ ' + r.vo2.toFixed(2) + ' of ' + r.vmax.toFixed(2) + ' L/min');
    const fy = py + bh + 8, fh = ph - bh - 8;
    G.plate(ctx, px, fy, pw, fh, () => { ctx.save(); ctx.font = mono(9.5, 600); ctx.fillStyle = '#98A6C6'; ctx.fillText('blood flow: thin = at rest, thick = now', px + 10, fy + 14); ctx.restore(); G.flowBars(ctx, px + 10, fy + 22, pw - 20, flowRows(r, rest), { max: Math.max(6, r.flow.muscle), lh: Math.max(14, Math.min(22, (fh - 28) / 6)) }); });
  }
  function drawStage(S, g) {
    const p = S.p, K = kit(); if (!K || !GA() || g.w < 160 || g.h < 200) return;      // a stage still being laid out has no room for a plate
    const Ly = lay(g);
    if (!Ly.narrow) drawBench(S, g, Ly);
    drawPanel(S, g, Ly);
    cards(S, g, Ly);
    const Hd = headerOf(S); K.header(g, Hd[0], Hd[1], Hd[2]);
  }
  const fmtClock = s => s < 60 ? s.toFixed(0) + ' s' : s < 3600 ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : (s / 3600).toFixed(2) + ' h';
  function cards(S, g, Ly) {
    const p = S.p, G = GA(), at = { x: 10, w: Ly.narrow ? 0 : Math.min(330, Ly.bw - 10) };
    if (p.setup === 'meal') { const M = S.meal, r = M.at(S.ts / 60); G.rowsCard(g, S, 'Blood glucose, mmol/L', [[{ t: 'now', bold: true }, { t: r.G.toFixed(1) + ' at ' + (S.ts / 60).toFixed(0) + ' min', col: '#FFD66B' }], [{ t: 'peak', bold: true }, M.peak.G.toFixed(1) + ' at ' + M.peak.m.toFixed(0) + ' min'], [{ t: 'at 2 h', bold: true }, { t: M.g2h.toFixed(1) + (M.g2h >= 11.1 ? ' — diabetes (WHO ≥ 11.1)' : M.g2h >= 7.8 ? ' — impaired (7.8–11.1)' : ' — normal (< 7.8)'), col: M.g2h >= 11.1 ? '#FF8A80' : M.g2h >= 7.8 ? '#FFB35C' : '#9FE0B8' }], [{ t: 'insulin', bold: true }, r.I.toFixed(0) + ' mU/L']], at, { cols: [0, 0.24], chip: 'glucose' }); return; }
    if (p.setup === 'move') { const H = S.hold, r = H.out[clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1)]; G.rowsCard(g, S, 'Holding ' + p.force + ' % of your best', [[{ t: 'drive', bold: true }, Math.round(r.E * 100) + ' % of the most the brain can send'], [{ t: 'units', bold: true }, r.n + ' of ' + MU.N + ' firing'], [{ t: 'EMG', bold: true }, Math.round(r.emg / emgMax(p) * 100) + ' % of maximum'], [{ t: 'can hold for', bold: true }, { t: H.fail == null ? 'longer than 5 min' : fmtClock(H.fail), col: '#FFD66B' }]], at, { cols: [0, 0.28], chip: 'grip' }); return; }
    const r = now(S);
    if (p.setup === 'oxygen') G.rowsCard(g, S, 'Breathing ' + (S.ts < GAS0 ? 'room air' : GAS[p.gas].name), [[{ t: 'breathing', bold: true }, { t: r.VE.toFixed(1) + ' L/min', col: '#8FD4FA' }], [{ t: 'CO₂ in blood', bold: true }, r.paco2.toFixed(1) + ' mmHg (normal 40)'], [{ t: 'O₂ in blood', bold: true }, r.pao2.toFixed(0) + ' mmHg · SpO₂ ' + (r.sat * 100).toFixed(0) + ' %']], at, { cols: [0, 0.3], chip: 'gas' });
    else if (p.setup === 'balance') G.rowsCard(g, S, 'The ride, ' + fmtClock(S.ts), [[{ t: 'core', bold: true }, { t: r.temp.toFixed(2) + ' °C', col: r.temp > 39.5 ? '#FF8A80' : '#FFD66B' }], [{ t: 'sweat', bold: true }, (r.sweat / 2430 * 3.6).toFixed(2) + ' L an hour'], [{ t: 'water lost', bold: true }, { t: r.water.toFixed(2) + ' L = ' + (r.water / p.mass * 100).toFixed(1) + ' % of body mass', col: r.water / p.mass > 0.02 ? '#FF8A80' : '#DCE6F6' }], [{ t: 'urine', bold: true }, r.urine.toFixed(0) + ' mL so far']], at, { cols: [0, 0.26], chip: 'heat' });
    else if (p.setup === 'break') { const h = rowAt(S.Rh, S.ts); G.rowsCard(g, S, FAULT[p.fault].name + ' against healthy', [[{ t: '', bold: true }, { t: 'this body', bold: true }, { t: 'healthy', bold: true }], ['heart rate', { t: r.HR.toFixed(0), col: '#FF8A80' }, h.HR.toFixed(0)], ['breathing', { t: r.VE.toFixed(0) + ' L/min', col: '#8FD4FA' }, h.VE.toFixed(0) + ' L/min'], ['lactate', { t: r.L.toFixed(1) + ' mM', col: '#FFD66B' }, h.L.toFixed(1) + ' mM'], ['blood CO₂', r.paco2.toFixed(0) + ' mmHg', h.paco2.toFixed(0) + ' mmHg']], at, { cols: [0, 0.34, 0.68], chip: 'compare' }); }
    else G.rowsCard(g, S, fmtClock(S.ts) + (r.P > 0 ? ' · riding at ' + r.P + ' W' : S.ts < RIDE0 ? ' · resting' : ' · recovering'), [[{ t: 'heart', bold: true }, { t: r.HR.toFixed(0) + '/min × ' + r.SV.toFixed(0) + ' mL = ' + r.CO.toFixed(1) + ' L/min', col: '#FF8A80' }], [{ t: 'lungs', bold: true }, { t: r.VE.toFixed(0) + ' L/min · CO₂ ' + r.paco2.toFixed(0) + ' mmHg', col: '#8FD4FA' }], [{ t: 'muscle', bold: true }, 'O₂ ' + r.vo2.toFixed(2) + ' L/min · lactate ' + r.L.toFixed(1) + ' mM'], [{ t: 'skin', bold: true }, r.temp.toFixed(2) + ' °C · sweat ' + (r.sweat / 2430 * 3.6).toFixed(2) + ' L/h']], at, { cols: [0, 0.2], chip: 'monitor' });
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'meal') { const M = S.meal, r = M.at(S.ts / 60); return [p.carbs + ' g as ' + FOOD[p.food].name + ' (' + DIAB[p.diab].name + '): glucose ' + r.G.toFixed(1) + ' mmol/L at ' + (S.ts / 60).toFixed(0) + ' min', 'peak ' + M.peak.G.toFixed(1) + ' at ' + M.peak.m.toFixed(0) + ' min · 2 h ' + M.g2h.toFixed(1) + ' · insulin ' + r.I.toFixed(0) + ' mU/L' + (p.walkW > 0 ? ' · a ' + p.walkMin + '-min walk at ' + p.walkAt + ' min' : ''), 'digestion puts glucose in the blood; circulation carries it; insulin lets the muscles take it']; }
    if (p.setup === 'move') { const H = S.hold, r = H.out[clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1)]; return ['Holding ' + p.force + ' % of maximum: ' + r.n + ' motor units firing, drive ' + Math.round(r.E * 100) + ' %', MUSCLE[p.mus].name + (p.loss > 0 ? ' · ' + p.loss + ' % of motor neurons lost' : '') + ' · ' + fmtClock(S.ts) + (H.fail != null ? ' · can hold ' + fmtClock(H.fail) : ''), r.E > 0.98 ? 'every unit is firing flat out and the force still falls: fatigue' : 'small units first, big ones later; as units tire, the brain recruits more']; }
    const r = now(S);
    if (p.setup === 'oxygen') return ['Breathing ' + (S.ts < GAS0 ? 'room air' : GAS[p.gas].name) + ': ' + r.VE.toFixed(1) + ' L/min', 'PaCO₂ ' + r.paco2.toFixed(1) + ' mmHg · PaO₂ ' + r.pao2.toFixed(0) + ' mmHg · SpO₂ ' + (r.sat * 100).toFixed(0) + ' % · ' + p.power + ' W', p.gas === 'co2' ? 'a little extra CO₂, with plenty of O₂: breathing triples' : p.gas === 'hypox' ? 'far less O₂ — yet breathing hardly rises until it is very low' : 'the brain watches CO₂ much more closely than O₂'];
    if (p.setup === 'balance') return [p.hours + ' h at ' + p.power + ' W in ' + p.airT + ' °C, ' + p.rh + ' % humidity: core ' + r.temp.toFixed(1) + ' °C', 'sweat ' + (r.sweat / 2430 * 3.6).toFixed(2) + ' L/h · lost ' + r.water.toFixed(2) + ' L (' + (r.water / p.mass * 100).toFixed(1) + ' %) · urine ' + r.urine.toFixed(0) + ' mL · HR ' + r.HR.toFixed(0), r.water / p.mass > 0.02 ? 'over 2 % of body mass lost: the blood thins out, the heart races (cardiac drift)' : 'the kidneys hold water back while the skin spends it'];
    if (p.setup === 'break') { const h = rowAt(S.Rh, S.ts); return [FAULT[p.fault].name + ' at ' + r.P + ' W: heart ' + r.HR.toFixed(0) + ' (healthy ' + h.HR.toFixed(0) + ')', 'O₂ ' + r.vo2.toFixed(2) + ' of a max ' + r.vmax.toFixed(2) + ' L/min · lactate ' + r.L.toFixed(1) + ' mM · breathing ' + r.VE.toFixed(0) + ' L/min', 'one system short: the others work harder to cover it — until they cannot'];
    }
    return [(r.P > 0 ? 'Riding at ' + r.P + ' W' : S.ts < RIDE0 ? 'Resting' : 'Recovering') + ': heart ' + r.HR.toFixed(0) + '/min, breathing ' + r.VE.toFixed(0) + ' L/min', fmtClock(S.ts) + ' · O₂ ' + r.vo2.toFixed(2) + ' L/min (' + Math.round(r.frac * 100) + ' % of max) · lactate ' + r.L.toFixed(1) + ' mM · ' + r.temp.toFixed(2) + ' °C', 'muscles ask for O₂; the heart and lungs deliver it; skin and kidneys deal with the heat and the water'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function timePlot(S, g, series, tmax, xl, ymax, yl) {
    const K = kit(), Kk = K.plotKey(g, series.map(s => ({ c: s.c, label: s.label, dash: s.dash })));
    const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: xl, ylabel: yl, xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { series.forEach(s => P.line(s.pts, s.c, s.w || 2.2, s.dash)); });
    Kk.draw(P); return P;
  }
  function plot1(S, g) {
    const p = S.p;
    if (p.setup === 'meal') {
      const M = S.meal, ref = mealRun(Object.assign({}, p, { diab: 'none', walkW: 0 })), m = S.ts / 60;
      const P = timePlot(S, g, [{ c: 'rgba(201,212,234,.5)', label: 'healthy, no walk', dash: [4, 3], w: 1.3, pts: ref.out.filter((_, i) => i % 4 === 0).map(q => [q.m, q.G]) }, { c: '#FFD66B', label: 'glucose, mmol/L', pts: M.out.filter((q, i) => i % 2 === 0 && q.m <= m).map(q => [q.m, q.G]) }, { c: '#6AA8FF', label: 'insulin ÷ 10', pts: M.out.filter((q, i) => i % 4 === 0 && q.m <= m).map(q => [q.m, q.I / 10]) }], 240, 'minutes after eating', Math.max(12, ...M.out.map(q => q.G)) * 1.1, 'mmol/L');
      P.clip(() => { P.hline(11.1, 'rgba(255,138,128,.5)', [2, 3]); P.hline(7.8, 'rgba(255,179,92,.4)', [2, 3]); P.vline(120, 'rgba(201,212,234,.3)', [2, 3]); });
      return;
    }
    if (p.setup === 'move') {
      const H = S.hold, em = emgMax(p), k = Math.round(S.ts / 0.5);
      const P = timePlot(S, g, [{ c: '#FFD66B', label: 'force, % of max', pts: H.out.filter((q, i) => i <= k).map(q => [q.t, q.F]) }, { c: '#7CF0C0', label: 'EMG, % of max', pts: H.out.filter((q, i) => i <= k).map(q => [q.t, q.emg / em * 100]) }, { c: 'rgba(201,212,234,.45)', label: 'units firing, %', dash: [4, 3], w: 1.3, pts: H.out.filter((q, i) => i <= k).map(q => [q.t, q.n / MU.N * 100]) }], 300, 's', 110, '%');
      if (H.fail != null) P.clip(() => P.vline(H.fail, 'rgba(255,138,128,.7)', [3, 3]));
      return;
    }
    const R = S.R, T = T_OF[p.setup](p), cut = R.filter(q => q.t <= S.ts), step = Math.max(1, Math.floor(R.length / 300)), th = p.setup === 'balance' ? 60 : 1, xl = p.setup === 'balance' ? 'minutes' : 's';
    const pick = (f, all) => (all ? R : cut).filter((_, i) => i % step === 0).map(q => [q.t / th, f(q)]);
    if (p.setup === 'oxygen') { timePlot(S, g, [{ c: '#8FD4FA', label: 'breathing, L/min', pts: pick(q => q.VE) }, { c: '#FF8A80', label: 'PaCO₂, mmHg', pts: pick(q => q.paco2) }, { c: '#9FE0B8', label: 'SpO₂, %', dash: [4, 3], pts: pick(q => q.sat * 100) }], T, 's', 110, ''); return; }
    if (p.setup === 'balance') { timePlot(S, g, [{ c: '#FFB35C', label: 'core °C − 36, ×20', pts: pick(q => (q.temp - 36) * 20) }, { c: '#8FD4FA', label: 'water lost, % mass × 20', pts: pick(q => q.water / p.mass * 2000) }, { c: '#FF8A80', label: 'heart rate', pts: pick(q => q.HR) }], T / 60, xl, 200, ''); return; }
    if (p.setup === 'break') { const Rh = S.Rh; timePlot(S, g, [{ c: 'rgba(201,212,234,.5)', label: 'healthy heart rate', dash: [4, 3], w: 1.3, pts: Rh.filter((_, i) => i % step === 0).map(q => [q.t, q.HR]) }, { c: '#FF8A80', label: 'heart rate', pts: pick(q => q.HR) }, { c: '#8FD4FA', label: 'breathing', pts: pick(q => q.VE) }, { c: '#FFD66B', label: 'lactate ×10', pts: pick(q => q.L * 10) }], T, 's', 220, ''); return; }
    timePlot(S, g, [{ c: '#FF8A80', label: 'heart rate', pts: pick(q => q.HR) }, { c: '#8FD4FA', label: 'breathing, L/min', pts: pick(q => q.VE) }, { c: '#9FE0B8', label: 'O₂ used ×50', pts: pick(q => q.vo2 * 50) }, { c: '#FFD66B', label: 'lactate ×10', pts: pick(q => q.L * 10) }, { c: 'rgba(201,212,234,.35)', label: 'power ÷ 2', dash: [2, 3], w: 1.2, pts: pick(q => q.P / 2, true) }], T, 's', 220, '');
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'meal') {
      if (!S._mland || S._mland.key !== [p.carbs, p.diab, p.insulin, p.walkW, p.walkAt, p.walkMin].join('|')) S._mland = { key: [p.carbs, p.diab, p.insulin, p.walkW, p.walkAt, p.walkMin].join('|'), v: Object.keys(FOOD).map(f => mealRun(Object.assign({}, p, { food: f }))) };
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'glucose drink' }, { c: '#FFB35C', label: 'white bread' }, { c: '#9FE0B8', label: 'pasta' }]);
      const P = g.Plot({ xmin: 0, xmax: 240, ymin: 0, ymax: Math.max(12, ...S._mland.v.flatMap(M => M.out.map(q => q.G))) * 1.1, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'mmol/L', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => S._mland.v.forEach((M, i) => P.line(M.out.filter((_, j) => j % 4 === 0).map(q => [q.m, q.G]), ['#FFD66B', '#FFB35C', '#9FE0B8'][i], Object.keys(FOOD)[i] === p.food ? 2.6 : 1.4)));
      Kk.draw(P); return;
    }
    if (p.setup === 'move') {
      if (!S._rohm || S._rohm.key !== [p.mus, p.loss, p.reinn, p.seed].join('|')) { const fs = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90]; S._rohm = { key: [p.mus, p.loss, p.reinn, p.seed].join('|'), pts: fs.map(f => [f, Math.min(1200, endurance(p, f))]) }; }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'how long it can be held (fatigue on)' }, { c: '#8FB4FF', label: 'this hold', dot: true }]);
      const P = g.Plot({ xmin: 10, xmax: 95, ymin: 0, ymax: 620, pad: { t: Kk.t }, xlabel: '% of maximum force', ylabel: 'seconds', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(S._rohm.pts, '#FFD66B', 2.4); const e = S.hold.fail; P.dot(p.force, e == null ? 600 : e, 5.5, '#8FB4FF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'oxygen') {
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'breathing against CO₂' }, { c: '#9FE0B8', label: 'breathing against O₂', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 20, xmax: 120, ymin: 0, ymax: 60, pad: { t: Kk.t }, xlabel: 'mmHg in the blood', ylabel: 'L/min', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const base = 1.3 * 863 * 0.0036 * p.mass * 0.8 / 40;
      P.clip(() => { const cs = [], os = []; for (let x = 20; x <= 120; x += 1) { if (x >= 35 && x <= 60) cs.push([x, base + CO2_GAIN * (x - 40)]); os.push([x, base + O2_GAIN * Math.max(0, 60 - x)]); } P.line(cs, '#FF8A80', 2.4); P.line(os, '#9FE0B8', 2, [4, 3]); const r = now(S); P.dot(r.paco2, r.VE, 5, '#FF8A80', '#0B0F18'); P.dot(Math.min(118, r.pao2), r.VE, 5, '#9FE0B8', '#0B0F18'); P.tag(40, 2, 'CO₂ 40', '#FF8A80', 'left', -6); P.tag(100, 2, 'O₂ 100', '#9FE0B8', 'right', -6); });
      Kk.draw(P); return;
    }
    if (p.setup === 'balance') {
      if (!S._heat || S._heat.key !== [p.rh, p.power, p.drink, p.hours, p.fit, p.mass].join('|')) { const ts = [10, 15, 20, 25, 30, 35, 40]; S._heat = { key: [p.rh, p.power, p.drink, p.hours, p.fit, p.mass].join('|'), pts: ts.map(T => { const R = bodyRun(Object.assign({}, p, { airT: T }), () => p.power, () => 'air', 3600, 20); const e = R[R.length - 1]; return [T, e.sweat / 2430 * 3.6, e.temp]; }) }; }
      const Kk = K.plotKey(g, [{ c: '#8FD4FA', label: 'sweat, L/h' }, { c: '#FFB35C', label: 'core after 1 h, °C − 36', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 10, xmax: 40, ymin: 0, ymax: 4, pad: { t: Kk.t }, xlabel: 'air, °C', ylabel: '', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line(S._heat.pts.map(q => [q[0], q[1]]), '#8FD4FA', 2.4); P.line(S._heat.pts.map(q => [q[0], q[2] - 36]), '#FFB35C', 2, [4, 3]); const r = now(S); P.dot(p.airT, r.sweat / 2430 * 3.6, 5, '#8FD4FA', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'break') {
      const r = rowAt(S.R, Math.min(S.ts, RIDE0 - 1 + p.ride * 60)), h = rowAt(S.Rh, Math.min(S.ts, RIDE0 - 1 + p.ride * 60));
      const items = [['heart', r.HR / h.HR], ['stroke vol.', r.SV / h.SV], ['breathing', r.VE / h.VE], ['O₂ used', r.vo2 / h.vo2], ['lactate', r.L / h.L], ['blood CO₂', r.paco2 / h.paco2]];
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'this body ÷ healthy, same moment', box: true }]);
      const P = g.Plot({ xmin: -0.6, xmax: items.length - 0.4, ymin: 0, ymax: Math.max(2, ...items.map(q => q[1])) * 1.1, pad: { t: Kk.t }, xticks: items.map((_, i) => i), xfmt: i => (items[Math.round(i)] || [''])[0], ylabel: '× healthy', yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { items.forEach((q, i) => P.bar(i, q[1], 0.3, 0, q[1] > 1.05 ? '#FF8A80' : q[1] < 0.95 ? '#8FB4FF' : '#FFD66B')); P.hline(1, 'rgba(201,212,234,.6)', [3, 3]); });
      Kk.draw(P); return;
    }
    if (!S._ramp || S._ramp.key !== [p.fit, p.age, p.mass, p.airT].join('|')) { const ws = []; for (let w = 0; w <= 300; w += 20) ws.push(w); S._ramp = { key: [p.fit, p.age, p.mass, p.airT].join('|'), pts: ws.map(w => { const e = steady(p, w); return [w, e.HR, e.vo2, e.L, e.VE]; }) }; }
    const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'heart rate' }, { c: '#9FE0B8', label: 'O₂ used ×50' }, { c: '#FFD66B', label: 'lactate ×10' }, { c: '#8FD4FA', label: 'breathing', dash: [4, 3] }]);
    const P = g.Plot({ xmin: 0, xmax: 300, ymin: 0, ymax: 220, pad: { t: Kk.t }, xlabel: 'power, W (after 5 min)', ylabel: '', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { const a = S._ramp.pts; P.line(a.map(q => [q[0], q[1]]), '#FF8A80', 2.2); P.line(a.map(q => [q[0], q[2] * 50]), '#9FE0B8', 2.2); P.line(a.map(q => [q[0], q[3] * 10]), '#FFD66B', 2.2); P.line(a.map(q => [q[0], q[4]]), '#8FD4FA', 1.6, [4, 3]); P.vline(p.power, 'rgba(201,212,234,.5)', [3, 3]); const lt = a.find(q => q[3] > 2); if (lt) P.tag(lt[0], 30, 'lactate threshold ≈ ' + lt[0] + ' W', '#FFD66B', 'left', 0); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'meal') { const M = S.meal, r = M.at(S.ts / 60); return [
      { label: 'Glucose', value: r.G.toFixed(1), unit: 'mmol/L', flag: 'accent', hint: (S.ts / 60).toFixed(0) + ' min after eating' },
      { label: 'Peak', value: M.peak.G.toFixed(1), unit: 'mmol/L', hint: 'at ' + M.peak.m.toFixed(0) + ' min' },
      { label: 'At 2 hours', value: M.g2h.toFixed(1), unit: 'mmol/L', flag: M.g2h >= 11.1 ? 'crit' : M.g2h >= 7.8 ? 'warn' : 'ok', hint: '≥ 11.1 diabetes · 7.8–11.1 impaired' },
      { label: 'From the gut', value: r.Ra.toFixed(2), unit: 'g/min', hint: Math.round(r.eaten) + ' of ' + p.carbs + ' g absorbed' },
      { label: 'Insulin', value: r.I.toFixed(0), unit: 'mU/L' },
      { label: 'Liver', value: (r.HGO >= 0 ? '+' : '') + r.HGO.toFixed(3), unit: 'g/min', hint: r.HGO >= 0 ? 'releasing' : 'storing as glycogen' },
      { label: 'Gut blood flow', value: r.gutFlow.toFixed(1), unit: 'L/min', hint: 'rises after a meal' } ]; }
    if (p.setup === 'move') { const H = S.hold, r = H.out[clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1)]; return [
      { label: 'Force', value: r.F.toFixed(1), unit: '% max', flag: 'accent' },
      { label: 'Drive from the brain', value: Math.round(r.E * 100), unit: '%', flag: r.E > 0.98 ? 'crit' : '' },
      { label: 'Units firing', value: String(r.n), unit: 'of ' + MU.N },
      { label: 'EMG', value: Math.round(r.emg / emgMax(p) * 100), unit: '% max', hint: 'grows as units tire' },
      { label: 'Can be held for', value: H.fail == null ? '> 5 min' : fmtClock(H.fail), hint: 'Rohmert: 50 % ≈ 1 min' },
      { label: 'Strongest grip left', value: Math.round(H.total / H.fresh * 100), unit: '%', hint: p.loss ? p.loss + ' % of neurons lost' : 'all neurons' } ]; }
    const r = now(S);
    const out = [
      { label: 'Heart rate = CO ÷ SV', value: r.HR.toFixed(0), unit: '/min', flag: 'accent', hint: 'max ' + (208 - 0.7 * p.age).toFixed(0) },
      { label: 'Cardiac output', value: r.CO.toFixed(1), unit: 'L/min', hint: 'stroke ' + r.SV.toFixed(0) + ' mL' },
      { label: 'O₂ used (Fick)', value: r.vo2.toFixed(2), unit: 'L/min', hint: Math.round(r.frac * 100) + ' % of max ' + r.vmax.toFixed(2) },
      { label: 'Breathing', value: r.VE.toFixed(1), unit: 'L/min', hint: 'PaCO₂ ' + r.paco2.toFixed(1) },
      { label: 'SpO₂', value: (r.sat * 100).toFixed(0), unit: '%', flag: r.sat < 0.9 ? 'warn' : 'ok' },
      { label: 'Lactate', value: r.L.toFixed(1), unit: 'mM', flag: r.L > 4 ? 'warn' : '' },
      { label: 'Core temperature', value: r.temp.toFixed(2), unit: '°C' }
    ];
    if (p.setup === 'balance') out.push({ label: 'Water lost', value: r.water.toFixed(2), unit: 'L', hint: (r.water / p.mass * 100).toFixed(1) + ' % of mass' }, { label: 'Urine so far', value: r.urine.toFixed(0), unit: 'mL' });
    return out;
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'meal') { const r = S.meal.at(S.ts / 60); return E.v('V') + E.frac('d' + E.v('G'), 'd' + E.v('t')) + ' ' + E.op('=') + ' gut + liver − brain − muscle(insulin) ' + E.op('=') + ' ' + r.Ra.toFixed(2) + ' + ' + r.HGO.toFixed(3) + ' − ' + r.uptake.toFixed(3) + ' g/min ' + E.op('→') + ' ' + E.n(r.G.toFixed(2), 'mmol/L'); }
    if (p.setup === 'move') { const H = S.hold, r = H.out[clamp(Math.round(S.ts / 0.5), 0, H.out.length - 1)]; return E.v('F') + ' ' + E.op('=') + ' Σ ' + E.v('P') + E.sub('i') + ' × gain(' + E.v('f') + E.sub('i') + ') × fresh' + E.sub('i') + ',  ' + E.v('f') + E.sub('i') + ' ' + E.op('=') + ' 8 Hz + 0.6 Hz/% × (drive − threshold' + E.sub('i') + ') ≤ 35 Hz  →  ' + E.n(r.F.toFixed(1), '% max') + ' from ' + r.n + ' units'; }
    const r = now(S);
    return E.v('V̇O₂') + ' ' + E.op('=') + ' ' + E.v('HR') + ' × ' + E.v('SV') + ' × (' + E.v('C') + E.sub('a') + ' − ' + E.v('C') + E.sub('v') + ') ' + E.op('=') + ' ' + E.n(r.HR.toFixed(0), '/min') + ' × ' + E.n(r.SV.toFixed(0), 'mL') + ' × ' + E.n((r.vo2 / r.CO * 1000).toFixed(0), 'mL/L') + ' ' + E.op('=') + ' ' + E.n(r.vo2.toFixed(2), 'L/min') + ';   breathing ' + E.op('=') + ' 1.3 × ' + E.frac('863 × V̇CO₂', '40') + ' + 2 × (PaCO₂ − 40) ' + E.op('=') + ' ' + E.n(r.VE.toFixed(1), 'L/min');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'meal') return 'Glucose from the gut goes first to the liver (the portal vein), then round the body. Insulin from the pancreas lets muscle and fat take it in and tells the liver to store it. A walk uses glucose without needing insulin. Constants are tuned to the classic 75 g test: in health, back under 7.8 mmol/L at 2 hours.';
    if (p.setup === 'move') return 'The brain grades force two ways: recruiting more motor units (always the small ones first) and firing them faster. A tired unit pulls less, so to hold the same force more units are recruited — the EMG grows while the force stays the same, until there are none left to add.';
    if (p.setup === 'oxygen') return 'Breathing is tuned to keep CO₂ at 40 mmHg: each mmHg extra adds about 2 L/min. Oxygen has a weak say until it is well below 60 mmHg — and then breathing harder blows off CO₂, which brakes the breathing again. We breathe harder in exercise because we make more CO₂, not because O₂ runs out.';
    if (p.setup === 'balance') return 'Each watt on the pedals makes about 3.5 W of heat. Sweat removes it only if it evaporates — humid air slows it. Water lost comes from the blood plasma, so each beat pumps less and the heart beats faster to keep the output; the kidneys make less urine to save water.';
    return 'One equation ties the systems together: oxygen used = heart rate × stroke volume × the oxygen each litre of blood gives up (Fick). The muscles set what is needed; the heart, the blood, the lungs and the skin must all keep up. Whichever reaches its limit first sets the limit for the whole body.';
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
    id: 'g6b-exercise',
    grade: 6, unit: '6B', topics: ['B5'],
    subject: 'biology',
    name: 'The Body During Exercise',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-3', 'CAST'],
    weight: 'Bodies',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag the bench to look round it · on a phone, tap a chip to open its card',
    lede: 'One body, worked out second by second. Drink a <b>glucose</b> load and follow it from gut to blood to muscle. Breathe a little <b>CO₂</b>, then thin air, and find what really drives breathing. ' +
      'Grip and hold while <b>motor units</b> are recruited and tire. Ride for two hours in the <b>heat</b>. Then ride, rest and recover with every system on one timeline — and <b>break</b> one to watch the others cover for it.',

    params: preset({}),
    presets: [
      { name: '75 g glucose drink: healthy', params: preset({ setup: 'meal', food: 'drink', diab: 'none' }) },
      { name: 'The same drink: type 2 diabetes', params: preset({ setup: 'meal', food: 'drink', diab: 'type2' }) },
      { name: 'Pasta, then a 30-min walk', params: preset({ setup: 'meal', food: 'pasta', walkW: 80, walkAt: 30 }) },
      { name: 'Breathe 5 % CO₂ at rest', params: preset({ setup: 'oxygen', gas: 'co2', power: 0 }) },
      { name: 'Breathe 12 % O₂ at rest', params: preset({ setup: 'oxygen', gas: 'hypox', power: 0 }) },
      { name: 'Hold 50 % of your best grip', params: preset({ setup: 'move', force: 50 }) },
      { name: 'Hold 15 %: almost no fatigue', params: preset({ setup: 'move', force: 15 }) },
      { name: 'Half the motor neurons lost, regrown', params: preset({ setup: 'move', force: 30, loss: 50, reinn: true }) },
      { name: 'Two hours at 32 °C, nothing to drink', params: preset({ setup: 'balance', airT: 32, drink: 0 }) },
      { name: 'The same ride, drinking 0.8 L an hour', params: preset({ setup: 'balance', airT: 32, drink: 0.8 }) },
      { name: 'Humid heat: sweat cannot evaporate', params: preset({ setup: 'balance', airT: 32, rh: 85 }) },
      { name: 'Ride 100 W for 6 minutes', params: preset({ setup: 'exercise', power: 100 }) },
      { name: 'The same ride, trained', params: preset({ setup: 'exercise', power: 100, fit: 'trained' }) },
      { name: 'A hard ride: 200 W', params: preset({ setup: 'exercise', power: 200 }) },
      { name: 'Anaemia', params: preset({ setup: 'break', fault: 'anaemia' }) },
      { name: 'Asthma', params: preset({ setup: 'break', fault: 'asthma' }) },
      { name: 'A blocked leg artery', params: preset({ setup: 'break', fault: 'artery' }) },
      { name: 'Dehydrated', params: preset({ setup: 'break', fault: 'dehyd' }) }
    ],

    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS }] },
      { group: 'The meal', when: is('meal'), items: [
        { key: 'carbs', label: 'Carbohydrate', min: 10, max: 150, step: 5, unit: 'g', restructure: R_ },
        { key: 'food', type: 'select', label: 'As', restructure: R_, options: [{ value: 'drink', label: 'glucose drink' }, { value: 'bread', label: 'white bread' }, { value: 'pasta', label: 'pasta' }] },
        { key: 'diab', type: 'select', label: 'The person', restructure: R_, rebuild: true, options: [{ value: 'none', label: 'healthy' }, { value: 'type2', label: 'type 2 diabetes' }, { value: 'type1', label: 'type 1 diabetes' }] },
        { key: 'insulin', type: 'toggle', label: 'Inject insulin with the meal', restructure: R_, when: S => S.p.diab === 'type1' },
        { key: 'walkW', label: 'Walk after eating', min: 0, max: 150, step: 10, unit: 'W', restructure: R_ },
        { key: 'walkAt', label: 'Walk starts at', min: 0, max: 120, step: 5, unit: 'min', restructure: R_, when: S => S.p.walkW > 0 },
        { key: 'walkMin', label: 'Walk for', min: 10, max: 90, step: 5, unit: 'min', restructure: R_, when: S => S.p.walkW > 0 }] },
      { group: 'The gas breathed', when: is('oxygen'), items: [
        { key: 'gas', type: 'select', label: 'From 20 s on', restructure: R_, options: Object.keys(GAS).map(k => ({ value: k, label: GAS[k].name })) }] },
      { group: 'The grip', when: is('move'), items: [
        { key: 'force', label: 'Hold this much', min: 5, max: 95, step: 1, unit: '% of max', restructure: R_ },
        { key: 'mus', type: 'select', label: 'Muscle', restructure: R_, options: [{ value: 'hand', label: 'hand' }, { value: 'thigh', label: 'thigh' }] },
        { key: 'fatigue', type: 'toggle', label: 'Units tire', restructure: R_ },
        { key: 'loss', label: 'Motor neurons lost (as in polio)', min: 0, max: 80, step: 5, unit: '%', restructure: R_ },
        { key: 'reinn', type: 'toggle', label: 'Survivors regrow to the orphaned fibres', restructure: R_, when: S => S.p.loss > 0 },
        { key: 'seed', label: 'Which neurons were lost', min: 1, max: 9, step: 1, restructure: R_, when: S => S.p.loss > 0 }] },
      { group: 'The rider', when: isAny('oxygen', 'balance', 'exercise', 'break'), items: [
        { key: 'power', label: 'Power on the pedals', min: 0, max: 300, step: 10, unit: 'W', restructure: R_ },
        { key: 'fit', type: 'select', label: 'Fitness', restructure: R_, options: [{ value: 'untrained', label: 'untrained' }, { value: 'trained', label: 'trained' }] },
        { key: 'age', label: 'Age', min: 10, max: 70, step: 1, unit: 'years', restructure: R_ },
        { key: 'mass', label: 'Body mass', min: 30, max: 100, step: 1, unit: 'kg', restructure: R_ },
        { key: 'ride', label: 'Ride for', min: 2, max: 10, step: 1, unit: 'min', restructure: R_, when: isAny('exercise', 'break') },
        { key: 'fault', type: 'select', label: 'Broken system', restructure: R_, when: is('break'), options: Object.keys(FAULT).filter(k => k !== 'none').map(k => ({ value: k, label: FAULT[k].name.replace(/ \(.*\)/, '') })) }] },
      { group: 'The room and the drink', when: is('balance'), items: [
        { key: 'airT', label: 'Air temperature', min: 10, max: 40, step: 1, unit: '°C', restructure: R_ },
        { key: 'rh', label: 'Humidity', min: 10, max: 95, step: 5, unit: '%', restructure: R_ },
        { key: 'drink', label: 'Drink', min: 0, max: 1.5, step: 0.1, unit: 'L/h', restructure: R_, fmt: v => v.toFixed(1) },
        { key: 'hours', label: 'Ride for', min: 0.5, max: 3, step: 0.5, unit: 'h', restructure: R_ }] },
      { group: 'Time', items: [
        { key: 'lapse', type: 'select', label: 'Pace', restructure: false, options: [{ value: 0.25, label: 'slow' }, { value: 1, label: 'normal' }, { value: 4, label: 'fast' }] }] }
    ],

    setup, step, drawStage, onPointer,
    plots: [
      { title: S => ({ meal: 'Blood glucose and insulin', oxygen: 'Breathing, CO₂ and O₂ as the gas changes', move: 'Force, EMG and units, held', balance: 'Heat, water and heart over the ride', exercise: 'Every system on one timeline', break: 'This body against a healthy one' })[S.p.setup], draw: plot1 },
      { title: S => ({ meal: 'Fast and slow carbohydrate', oxygen: 'What breathing responds to', move: 'How long a force can be held', balance: 'Sweat against air temperature', exercise: 'Five minutes at each power', break: 'How hard the others work to cover it' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · systems and system models', params: preset({ setup: 'exercise', power: 120, fit: 'untrained', age: 15, mass: 60, ride: 6 }),
        q: 'Riding at 120 W uses about 11.8 mL of oxygen a minute for each watt, on top of 0.22 L/min at rest (60 kg). What is the oxygen uptake once it has settled?',
        predict: { label: 'O₂ uptake', unit: 'L/min', tol: 0.02 },
        measure: S => rowAt(S.R, RIDE0 + 350).vo2,
        working: '0.22 + 0.0118 × 120 = 0.22 + 1.42 ≈ <b>1.63 L/min</b> — seven times rest, all of it carried by the blood.' },
      { source: 'CAST pattern · using mathematics', params: preset({ setup: 'exercise', power: 120, fit: 'untrained', age: 15, mass: 60 }),
        q: 'At 120 W the heart pumps about 12.9 L of blood a minute with a stroke volume of about 85 mL. Roughly what is the heart rate?',
        predict: { label: 'Heart rate', unit: 'beats/min', tol: 0.06 },
        measure: S => rowAt(S.R, RIDE0 + 350).HR,
        working: 'HR = output ÷ stroke volume ≈ 12 900 ÷ 85 ≈ <b>152</b> beats a minute — two and a half times rest, and the stroke volume itself went up from 70 mL.' },
      { source: 'CAST pattern · cause and effect', params: preset({ setup: 'oxygen', gas: 'co2', power: 0 }),
        q: 'At rest you breathe about 4.8 L/min. Each mmHg of extra CO₂ in the blood adds about 2 L/min. Breathing 5 % CO₂ settles your blood CO₂ about 6.5 mmHg higher. What is your breathing then?',
        predict: { label: 'Breathing', unit: 'L/min', tol: 0.05 },
        measure: S => rowAt(S.R, 290).VE,
        working: '4.8 + 2 × 6.5 ≈ <b>18 L/min</b> — nearly four times rest, though the blood is full of oxygen.' },
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'meal', food: 'drink', diab: 'type2' }),
        q: 'A doctor’s glucose test: 75 g of glucose to drink, blood tested at 2 hours. At or above 11.1 mmol/L means diabetes. Is this person diabetic? Give their 2-hour value.',
        predict: { label: '2-hour glucose', unit: 'mmol/L', tol: 0.08 },
        measure: S => S.meal.g2h,
        working: 'The model of type 2 diabetes (less insulin, and cells that respond to about a fifth of it) gives about <b>11–12 mmol/L</b> at 2 h — at or above 11.1: diabetes. A healthy person is back near 5.6.' },
      { source: 'CAST pattern · developing a model', params: preset({ setup: 'move', force: 50 }),
        q: 'Rohmert found a person can hold half their maximum force for about a minute. How long does this model’s hand hold 50 %?',
        predict: { label: 'Time', unit: 's', tol: 0.25 },
        measure: S => S.hold.fail,
        working: 'The units tire in proportion to how hard they work; at 50 % the last unit is recruited after about <b>60–80 s</b> — Rohmert’s minute. At 15 % they hardly tire at all.' }
    ],

    walkthrough: [
      { title: 'Why do we breathe harder?', ask: 'Breathe 5 % CO₂ with plenty of oxygen. Will your breathing change?', reveal: '<b>It nearly quadruples.</b> The brain watches CO₂ closely: each mmHg extra adds 2 L/min. Exercise makes more CO₂ — that, not a shortage of O₂, is what drives the breathing.', params: preset({ setup: 'oxygen', gas: 'co2' }) },
      { title: 'And thin air?', ask: 'Breathe 12 % O₂, as on a high mountain. Breathing must shoot up?', reveal: '<b>Only a little.</b> O₂ falls to ~40 mmHg and SpO₂ to ~75 %, yet breathing rises a few L/min: blowing off CO₂ brakes it again.', params: preset({ setup: 'oxygen', gas: 'hypox' }) },
      { title: 'From gut to muscle', ask: 'Drink 75 g of glucose. Where does it go?', reveal: '<b>Gut → portal vein → liver → heart → every cell.</b> Insulin from the pancreas lets muscles take it in; glucose peaks near 8 mmol/L and is back under 7.8 by 2 h.', params: preset({ setup: 'meal' }) },
      { title: 'Small units first', ask: 'Hold 50 % of your best grip. What does the EMG do while you hold?', reveal: '<b>It keeps rising.</b> Tired units pull less, so the brain recruits more to keep the force. After about a minute none are left: the force falls.', params: preset({ setup: 'move', force: 50 }) },
      { title: 'One limit at a time', ask: 'Ride at 100 W, then break the blood with anaemia. Which system works harder?', reveal: '<b>The heart.</b> Each litre carries 40 % less oxygen, so the heart pumps faster to deliver the same — and once it is at its maximum, lactate climbs.', params: preset({ setup: 'break', fault: 'anaemia' }) },
      { title: 'Water and the heat', ask: 'Two hours at 32 °C without drinking: what happens to the heart rate?', reveal: '<b>It drifts up</b> as water lost from the plasma leaves less blood for each beat, while the kidneys make almost no urine to save water.', params: preset({ setup: 'balance', airT: 32, drink: 0 }) }
    ],

    quiz: [
      { q: 'During exercise we breathe faster mainly because', options: ['the muscles make more CO₂', 'the blood runs out of oxygen', 'the lungs get smaller', 'the heart slows down'], answer: 0, why: 'SpO₂ stays near 97 % in exercise; CO₂ production rises and the brain responds to it.' },
      { q: 'Which pair of systems first delivers a meal’s glucose to a muscle?', options: ['digestive and circulatory', 'respiratory and nervous', 'excretory and muscular', 'nervous and digestive'], answer: 0, why: 'The gut absorbs it; the blood carries it (via the liver) to the muscle.' },
      { q: 'To hold a heavy object longer, the nervous system', options: ['recruits more motor units as others tire', 'makes each fibre bigger', 'stops sending signals', 'only uses the biggest units'], answer: 0, why: 'Watch the EMG grow during a hold while the force stays steady.' },
      { q: 'On a long hot ride without drinking, the kidneys', options: ['make less urine to save water', 'make more urine', 'stop working', 'turn sweat into urine'], answer: 0, why: 'ADH rises and less blood reaches the kidneys; urine output falls.' },
      { q: 'A person with anaemia rides at the same power as a healthy friend. Their heart rate is', options: ['higher', 'lower', 'the same', 'zero'], answer: 0, why: 'Less oxygen per litre of blood: more litres must be pumped.' }
    ],

    notes: '<p><b>Systems work together.</b> To exercise, the nervous system recruits muscle fibres; the muscles need oxygen and glucose; the respiratory and circulatory systems deliver them; the digestive system and liver supply the glucose; the skin gets rid of the heat; the kidneys protect the body’s water.</p>' +
      '<p><b>The numbers.</b> Oxygen uptake rises about 12 mL/min for each watt; heart rate and stroke volume rise to carry it (oxygen used = heart rate × stroke volume × oxygen given up per litre). Breathing follows CO₂. Lactate builds above ~60 % of maximum. Blood moves from the gut and kidneys to the muscles and skin.</p>' +
      '<p><b>When one system fails</b> the others compensate — a faster heart for thin blood, more breathing for stiff airways — until one reaches its own limit.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “We breathe harder because oxygen runs out” and “one organ limits exercise”. Breathing follows CO₂ (blood oxygen hardly changes), and the limit is set by whichever link in the chain — heart, blood, lungs, muscle — reaches its maximum first.</div>'
  });

  L.models = L.models || {};
  L.models['g6b-exercise'] = { bodyRun, steady, subject, vo2maxOf, vo2Need, FAULT, GAS, FIT, mealRun, FOOD, DIAB, unitsOf, holdRun, endurance, emgMax, MU, rowAt, PROTO, BASE: () => preset({}) };
})(window.InsightLab);
