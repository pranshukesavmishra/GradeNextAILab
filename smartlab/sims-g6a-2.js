/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-2  The Draining Tank — Building, Testing and Revising a Model
   (A3 Models of systems)

   A clear column drains through a sharp-edged hole into a tray. The
   apparatus obeys Torricelli with everything a real hole adds: the jet
   narrows to 61 % of the hole (the vena contracta), the discharge
   coefficient drifts with the Reynolds number, surface tension holds the
   last of the water, the surface evaporates; a tap fills it and a leak
   halfway up can drain it too:
       A·dh/dt = Q_tap − Cd·a·√(2g(h − h_σ)) − Q_leak − E·A
   An ultrasonic sensor reads the level as a real one does — in whole
   millimetres, with noise. The student's models are separate and simpler,
   and they are only ever judged against what the sensor reads.
   Five set-ups, one apparatus:
     why      — the town's tower loses its pump: a model answers first (A3.1)
     diagram  — a stock-and-flow diagram whose valves are the apparatus (A3.2)
     scale    — a 1:2, 1:4 or 1:10 copy beside the column (A3.3)
     leaves   — switch effects in and out of the model (A3.4)
     revise   — fit, read the residuals, revise, test on new data (A3.5)
   Registration, the model and the fits never touch the page (they run in a
   bare VM for the tests); only the drawing uses window.HYDRO and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, E, Camera } = L;
  const kit = () => window.KITMS, HY = () => window.HYDRO;

  /* ---------------- water, and a real hole ---------------- */
  const G = 9.81, RHO = 998, NU = 1.0e-6, SIGMA = 0.0728;   // water at 20 °C
  const EVAP = 2e-3 / 86400;                                 // m/s: about 2 mm a day off still water indoors
  const CV = 0.98;                                           // velocity coefficient of a sharp edge
  const COL = { r: 0.05, H: 0.60, zo: 0.01, leakZ: 0.30, leakD: 0.002 };   // 10 cm bore, 60 cm tall, hole 1 cm up
  const ALL = { vena: true, visc: true, tension: true, evap: true };        // the apparatus has every effect

  /* the discharge coefficient of a sharp-edged hole: the vena contracta alone gives 0.61; at
     low Reynolds numbers it first rises (the contraction weakens) and then falls (viscosity
     wins) — the shape of Lienhard & Lienhard's curve */
  function cdOf(Re, fx) {
    if (!fx.vena) return 1;
    if (!fx.visc) return 0.61;
    const pk = 0.61 + 0.10 * Math.exp(-Math.pow((Math.log10(Math.max(Re, 1)) - 2.6) / 0.55, 2));
    return pk * Re / (Re + 25);
  }
  /* flow through a hole of diameter d with `head` of water over its centre. Surface tension
     holds back the head the jet's own curvature needs (2σ/d as pressure); below it, no jet. */
  function hole(head, d, fx) {
    const a = Math.PI * d * d / 4, hs = fx.tension ? 2 * SIGMA / (RHO * G * d) : 0, he = head - hs;
    if (he <= 0 || d <= 0) return { Q: 0, v: 0, Cd: 0, Re: 0, hs };
    const v0 = Math.sqrt(2 * G * he), Re = v0 * d / NU, Cd = cdOf(Re, fx);
    return { Q: Cd * a * v0, v: CV * v0, Cd, Re, hs };
  }
  /* a column: s is how many times smaller than the bench column it is */
  function vessel(s, dmm, h0) {
    const V = { s, r: COL.r / s, H: COL.H / s, zo: COL.zo / s, d: dmm / 1000 / s, leakZ: COL.leakZ / s, leakD: COL.leakD / s };
    V.A = Math.PI * V.r * V.r;
    V.h = clamp(h0, 0, V.H); V.h0 = V.h; V.head0 = V.h - V.zo; V.t = 0; V.caught = 0; V.leaked = 0;
    V.half = null; V.stall = null; V.q = { qin: 0, dr: { Q: 0, v: 0 }, lk: { Q: 0, v: 0 }, ev: 0 };
    return V;
  }
  function flowsOf(V, h, fx, fl, Qin) {
    const dr = fl.drain ? hole(h - V.zo, V.d, fx) : { Q: 0, v: 0, Cd: 0, Re: 0, hs: 0 };
    const lk = fl.leak ? hole(h - V.leakZ, V.leakD, fx) : { Q: 0, v: 0, Cd: 0, Re: 0, hs: 0 };
    const ev = fl.evap && fx.evap ? EVAP * V.A : 0;
    const qin = fl.tap ? Qin : 0;
    return { qin, dr, lk, ev, dhdt: (qin - dr.Q - lk.Q - ev) / V.A };
  }
  const OPEN = { tap: true, drain: true, leak: false, evap: true };
  /* advance a column by dt seconds (midpoint steps of at most 10 ms), recording when its head
     falls to half and when its jet stops. A jet stops being a jet — it breaks into drips — once it
     leaves slower than about 5 cm/s (scaled by √size for a copy, so the rule is the same at every
     scale); in the viscous last millimetres the flow would otherwise fade forever */
  const V_JET = 0.05;
  function advance(V, dt, fx, fl, Qin) {
    const n = Math.max(1, Math.ceil(dt / 0.01)), h1 = dt / n;
    for (let i = 0; i < n; i++) {
      const a = flowsOf(V, V.h, fx, fl, Qin);
      const b = flowsOf(V, clamp(V.h + a.dhdt * h1 / 2, 0, V.H), fx, fl, Qin);
      V.h = clamp(V.h + b.dhdt * h1, 0, V.H);
      V.caught += b.dr.Q * h1; V.leaked += b.lk.Q * h1;
      V.t += h1;
      if (V.half == null && V.h - V.zo <= V.head0 / 2) V.half = V.t;
      if (V.stall == null && b.qin === 0 && fl.drain && b.dr.v < V_JET / Math.sqrt(V.s)) V.stall = V.t;
    }
    V.q = flowsOf(V, V.h, fx, fl, Qin);
    return V;
  }
  /* run a column to a condition, headless — the problems, the landscapes and the digital models */
  function runTo(s, dmm, h0, fx, fl, Qin, tmax, stop) {
    const V = vessel(s, dmm, h0);
    while (V.t < tmax) { advance(V, 0.25, fx, fl, Qin); if (stop && stop(V)) break; }
    return V;
  }
  const drainTime = (dmm, h0, fx, s) => runTo(s || 1, dmm, h0, fx, { tap: false, drain: true, leak: false, evap: true }, 0, 4000, V => V.stall != null).stall;
  const halfTime = (dmm, h0, fx, s) => runTo(s || 1, dmm, h0, fx, { tap: false, drain: true, leak: false, evap: true }, 0, 4000, V => V.half != null || V.stall != null).half;
  /* the level at which a tap and the hole balance, cm on the column's scale */
  function steadyLevel(dmm, Qin, fx) {
    const V = vessel(1, dmm, 0.3);
    let lo = V.zo, hi = 5;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (hole(m - V.zo, V.d, fx).Q < Qin) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ---------------- the ultrasonic sensor: whole millimetres, a little noise ---------------- */
  function rnd(S) { S.seed = (S.seed * 16807) % 2147483647; return (S.seed - 1) / 2147483646; }
  function gauss(S) { let u = 0; for (let i = 0; i < 6; i++) u += rnd(S); return (u - 3) * Math.SQRT2; }
  const SAMPLE = 0.5;                                          // s between readings
  function reading(S, h) { return Math.round((h + 0.0008 * gauss(S)) * 1000) / 1000; }

  /* ---------------- the student's three digital models, fitted by least squares ----------------
     y is the head over the hole. constant: y = a − b·t   proportional: y = a·e^(−k·t)
     square root: √y = √a − c·t  — each fitted where it is a straight line, as a student would */
  const FAMILY = {
    const: { name: 'Constant outflow', law: 'the level falls by the same amount every second' },
    prop: { name: 'Outflow ∝ level', law: 'the deeper the water, the faster it leaves' },
    sqrt: { name: 'Outflow ∝ √level', law: 'the outflow grows with the square root of the depth' }
  };
  function ols(xs, ys) {
    const n = xs.length; if (n < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
    const den = n * sxx - sx * sx; if (Math.abs(den) < 1e-12) return null;
    const b = (n * sxy - sx * sy) / den;
    return { b, a: (sy - b * sx) / n };
  }
  function fit(fam, data, zo) {
    const pts = data.map(d => ({ t: d.t, y: d.h - zo })).filter(q => q.y > 0.004);
    if (pts.length < 6) return null;
    const ts = pts.map(q => q.t);
    let F = null;
    if (fam === 'const') { const r = ols(ts, pts.map(q => q.y)); if (r) F = { a: r.a, k: -r.b, pred: t => Math.max(0, r.a + r.b * t), dy: (y, q) => q - (-r.b), empty: -r.b > 0 ? r.a / -r.b : Infinity }; }
    if (fam === 'prop') { const r = ols(ts, pts.map(q => Math.log(q.y))); if (r) { const a = Math.exp(r.a), k = -r.b; F = { a, k, pred: t => a * Math.exp(-k * t), dy: (y, q) => q - k * y, empty: Infinity }; } }
    if (fam === 'sqrt') { const r = ols(ts, pts.map(q => Math.sqrt(q.y))); if (r) { const c = -r.b; F = { a: r.a * r.a, k: c, pred: t => { const u = r.a - c * t; return u > 0 ? u * u : 0; }, dy: (y, q) => q - 2 * c * Math.sqrt(Math.max(0, y)), empty: c > 0 ? r.a / c : Infinity }; } }
    if (!F) return null;
    // residuals, and whether their signs change as noise does or run in long stretches as a wrong shape does
    let ss = 0, runs = 1, prev = 0;
    pts.forEach((q, i) => { const e = q.y - F.pred(q.t); ss += e * e; const sg = Math.sign(e); if (i && sg && prev && sg !== prev) runs++; if (sg) prev = sg; });
    F.rms = Math.sqrt(ss / pts.length); F.n = pts.length; F.runs = runs;
    F.random = runs >= 0.5 * (pts.length / 2 + 1);
    F.fam = fam;
    return F;
  }
  /* a fitted model run forward with a tap it never saw: dy/dt = q/A − (its own outflow) */
  function predictWith(F, y0, qA, T) {
    const out = []; let y = y0, t = 0;
    const dt = 0.1;
    while (t <= T + 1e-9) {
      out.push([t, y]);
      const k1 = F.dy(y, qA), k2 = F.dy(Math.max(0, y + k1 * dt / 2), qA);
      y = Math.max(0, y + k2 * dt); t += dt;
    }
    return out;
  }

  /* ---------------- the town's water tower (why) ----------------
     A 12 m steel tank holding 10 m of water, 1131 m³, feeding a town by gravity. The pump that
     fills it fails at 18:00. The town's use follows the evening; the mains also leak — about an
     eighth of what the town uses, day and night — which a first model leaves out. */
  const TOWER = { r: 6, H: 10 };
  const TOWER_V = Math.PI * TOWER.r * TOWER.r * TOWER.H;
  const PROFILE = [0.50, 0.40, 0.35, 0.35, 0.40, 0.60, 1.00, 1.40, 1.30, 1.10, 1.00, 1.00,
                   1.05, 1.00, 0.95, 0.95, 1.05, 1.25, 1.45, 1.55, 1.45, 1.25, 0.95, 0.70];
  const PMEAN = PROFILE.reduce((a, b) => a + b, 0) / 24;
  const LITRES_PP = 150;                                     // litres per person per day
  const LEAKAGE = 0.12;                                      // of the town's mean use, lost from the mains
  function useFactor(hour) { const h = ((hour % 24) + 24) % 24, i = Math.floor(h), f = h - i; return (PROFILE[i] * (1 - f) + PROFILE[(i + 1) % 24] * f) / PMEAN; }
  const meanUse = p => p.pop * LITRES_PP / 1000 / 24;        // m³/h
  function townUse(tH, p) { return meanUse(p) * useFactor(18 + tH) * (p.saving && tH >= 3 ? 0.75 : 1); }
  /* the real town: people use a little more than the textbook 150 L (3.5 %), their use wanders
     hour to hour, and the mains leak — so even a model with the leaks in it is minutes out */
  function realUse(tH, p) { return townUse(tH, p) * 1.035 * (1 + 0.06 * Math.sin(tH * 2.1 + 1.3) + 0.03 * Math.sin(tH * 5.3 + 0.4)) + LEAKAGE * meanUse(p); }
  function modelUse(tH, p) { return townUse(tH, p) + (p.leakModel ? LEAKAGE * meanUse(p) : 0); }
  /* the model: a stock and one flow, stepped a minute at a time — every step counted */
  function towerModel(p) {
    let V = TOWER_V, t = 0, steps = 0, dry = null;
    const pts = [[0, V]], dt = 1 / 60;
    while (t < 16) {
      V -= modelUse(t, p) * dt; t += dt; steps++;
      if (Math.abs(t * 12 - Math.round(t * 12)) < 1e-6) pts.push([t, Math.max(0, V)]);
      if (V <= 0) { dry = t; pts.push([t, 0]); break; }
    }
    return { pts, dry, steps };
  }
  function modelOf(S) {                                       // the tower model, redone whenever what it contains changes
    const p = S.p, key = [p.pop, p.saving, p.leakModel].join('|');
    if (!S.tm || S.tm.key !== key) { S.tm = towerModel(p); S.tm.key = key; }
    return S.tm;
  }
  const clockOf = tH => { const m = Math.round((18 + tH) * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const TW_RATE = 0.1;                                       // hours of the town's evening per real second

  /* ---------------- set-ups ---------------- */
  const SETUPS = [
    { value: 'why', label: 'Why build a model?', teaches: ['A3.1'] },
    { value: 'diagram', label: 'Diagram, flowchart, equation', teaches: ['A3.2'] },
    { value: 'scale', label: 'Physical and digital models', teaches: ['A3.3'] },
    { value: 'leaves', label: 'What a model leaves out', teaches: ['A3.4'] },
    { value: 'revise', label: 'Build, test and revise', teaches: ['A3.5'] }
  ];
  const is = v => S => S.p.setup === v;
  const among = (...v) => S => v.includes(S.p.setup);
  const bench = S => S.p.setup !== 'why';
  const BASE = {
    setup: 'why', h0: 50, dmm: 6, qin: 1.0,
    tap: true, drain: true, leak: false, evap: true,
    model: 4,
    vena: true, visc: true, tension: true, mEvap: true,
    fam: 'const', validate: false, qv: 2.0, resid: true,
    pop: 20000, saving: false, leakModel: false
  };
  function preset(o) { return Object.assign({}, BASE, o); }

  /* the apparatus's valves for this set-up: the diagram sets them; elsewhere the tap only runs
     for the validation run */
  function valves(p) {
    if (p.setup === 'diagram') return { tap: p.tap, drain: p.drain, leak: p.leak, evap: p.evap };
    if (p.setup === 'revise' && p.validate) return { tap: true, drain: true, leak: false, evap: true };
    return { tap: false, drain: true, leak: false, evap: true };
  }
  const qinOf = p => (p.setup === 'revise' && p.validate ? p.qv : p.setup === 'diagram' ? p.qin : 0) / 60000;   // L/min → m³/s
  const fxModel = p => ({ vena: p.vena, visc: p.visc, tension: p.tension, evap: p.mEvap });

  /* ---------------- the digital models the set-ups compare against ---------------- */
  function leavesModel(S) {                                   // the student's model with its chosen effects
    const p = S.p, key = [p.dmm, p.h0, p.vena, p.visc, p.tension, p.mEvap].join('|');
    if (S.lm && S.lm.key === key) return S.lm;
    const fx = fxModel(p), V = vessel(1, p.dmm, p.h0 / 100), pts = [[0, V.h]];
    while (V.t < 1500 && V.stall == null) { advance(V, 0.5, fx, { tap: false, drain: true, leak: false, evap: true }, 0); pts.push([V.t, V.h]); }
    S.lm = { key, pts, stall: V.stall };
    return S.lm;
  }
  function effects(S) {                                       // how much each effect moves the drain time, alone
    const p = S.p, key = p.dmm + '|' + p.h0;
    if (S.fxd && S.fxd.key === key) return S.fxd;
    const t0 = drainTime(p.dmm, p.h0 / 100, ALL);
    const rows = [['vena', 'the jet narrows to 61 % of the hole'], ['visc', 'viscosity shifts Cd with speed'],
                  ['tension', 'surface tension holds the last few mm'], ['evap', 'evaporation off the surface']].map(([k, what]) => {
      const t = drainTime(p.dmm, p.h0 / 100, Object.assign({}, ALL, { [k]: false }));
      return { k, what, dt: (t - t0) / t0 * 100 };
    });
    S.fxd = { key, t0, rows };
    return S.fxd;
  }
  /* revise: the calibration run a student would have done first (tap off, from the same start),
     with the same sensor — so validation always has a fitted model to test */
  function calibration(S) {
    const p = S.p, key = p.dmm + '|' + p.h0;
    if (S.cal && S.cal.key === key) return S.cal;
    const T = { seed: 99991 }, V = vessel(1, p.dmm, p.h0 / 100), data = [];
    for (let t = 0; V.stall == null && t < 1500; t += SAMPLE) { data.push({ t: V.t, h: reading(T, V.h) }); advance(V, SAMPLE, ALL, { tap: false, drain: true, leak: false, evap: true }, 0); }
    S.cal = { key, data };
    return S.cal;
  }
  function fittedNow(S) {                                     // the fit, redone when the model or the data change
    const p = S.p, data = p.validate ? calibration(S).data : S.data, key = p.fam + '|' + p.validate + '|' + data.length + '|' + (S.cal ? S.cal.key : '');
    if (S._fit && S._fit.key === key) return S._fit.F;
    const F = fit(p.fam, data, COL.zo);
    S._fit = { key, F };
    return F;
  }
  /* drain time against start height, for the apparatus and each law (revise, plot 2) */
  function landscape(S) {
    const p = S.p, key = p.dmm;
    if (S.land && S.land.key === key) return S.land;
    const H0 = [0.06, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5];
    S.land = { key, pts: H0.map(h => [h - COL.zo, drainTime(p.dmm, h, ALL)]) };
    return S.land;
  }
  /* scale: half-times of every size of copy, measured on the apparatus (plot 2) */
  function scaleLand(S) {
    const p = S.p, key = p.dmm;
    if (S.sland && S.sland.key === key) return S.sland;
    S.sland = { key, pts: [1, 2, 4, 10].map(s => ({ s, L: COL.H / s, t: halfTime(p.dmm, 0.5 / s, ALL, s), ideal: halfTime(p.dmm, 0.5 / s, { vena: true }, s) })) };
    return S.sland;
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  function setup(S) {
    const p = S.p;
    const home = homeFor(p.setup, !!S._narrow);
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera(Object.assign({}, home, { target: home.target.slice() }));
      S.cam.minDist = home.min; S.cam.maxDist = home.max; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
    S.seed = 20260925; S.ta = 0;
    S.col = vessel(1, p.dmm, (p.setup === 'scale' ? 50 : p.h0) / 100);
    S.mini = p.setup === 'scale' ? vessel(p.model, p.dmm, 0.5 / p.model) : null;
    S.data = []; S.nextRead = 0; S.miniData = [];
    S._fit = null; S.flowHist = [];
    // the town's evening
    S.tw = { t: 0, V: TOWER_V, dry: null, hist: [[0, TOWER_V]], next: 0.05 };
    S.tm = null;
    if (p.setup === 'revise' && p.validate) calibration(S);
  }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'why') {
      const tw = S.tw;
      if (tw.t < 16) {
        const dh = dt * TW_RATE, n = Math.max(1, Math.ceil(dh / (1 / 60)));
        for (let i = 0; i < n; i++) {
          const h1 = dh / n;
          tw.V = Math.max(0, tw.V - realUse(tw.t + h1 / 2, p) * h1); tw.t += h1;
          if (tw.dry == null && tw.V <= 0) tw.dry = tw.t;
        }
        while (tw.next <= tw.t) { tw.hist.push([tw.next, Math.max(0, tw.V)]); tw.next += 0.05; }
      }
      return;
    }
    const fl = valves(p), q = qinOf(p);
    advance(S.col, dt, ALL, fl, q);
    if (S.mini) advance(S.mini, dt, ALL, fl, 0);
    while (S.nextRead <= S.col.t) {
      S.data.push({ t: S.nextRead, h: reading(S, S.col.h) });
      if (S.mini) S.miniData.push({ t: S.nextRead, h: S.mini.h });
      S.nextRead += SAMPLE;
      if (S.data.length > 4000) S.data.shift();
    }
    // the flows, for the diagram's second graph
    const FH = S.flowHist;
    if (!FH.length || S.col.t - FH[FH.length - 1].t >= 0.25) FH.push({ t: S.col.t, qin: S.col.q.qin, dr: S.col.q.dr.Q, lk: S.col.q.lk.Q });
    if (FH.length > 3000) FH.shift();
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const HOMES = {
    why: { theta: -1.05, phi: 0.11, dist: 100, target: [-4, 47, 21], fov: 0.78, min: 40, max: 320 },
    scale: { theta: -1.36, phi: 0.20, dist: 1.30, target: [0.02, -0.06, 0.30], fov: 0.72, min: 0.4, max: 4 },
    bench: { theta: -1.30, phi: 0.16, dist: 1.40, target: [-0.03, 0.02, 0.43], fov: 0.72, min: 0.4, max: 4 }
  };
  function homeFor(su, narrow) {
    const h = HOMES[su] || HOMES.bench;
    if (!narrow) return h;
    return Object.assign({}, h, { dist: h.dist * 1.3, target: su === 'why' ? [10, 55, 21] : [0.2, h.target[1], h.target[2]] });
  }
  const CX = -0.12, PLAT = 0.13;                             // the column's axis on the bench, its platform's height
  const TRAY = [0.02, 0.78, -0.13, 0.13];

  function drawBench(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, H = HY(), B = window.BENCH;
    const F = R3.Frame(ctx, cam, { ambient: 0.3, floorZ: 0 });
    const V = S.col, fl = valves(p), q = qinOf(p);
    // the room: a tiled wall behind the bench, and the bench itself
    if (cam.eye[1] < 0.40) H.wall(F, -1.4, 1.8, 0.42, -0.05, 1.25);        // cut away when the view goes round behind it
    B.table(F, -0.62, 0.95, -0.36, 0.36, 0, { legs: false, tone: '#6E4A2C', seed: 7, thick: 0.05 });
    // the column on its platform, the hole on the side facing the tray
    B.texBox(F, [CX, 0, PLAT / 2], [0.16, 0.16, PLAT], { top: B.metal('#D8DCE2', 3), side: B.metal('#C8CDD4', 5), end: B.metal('#C8CDD4', 9) }, { ambient: 0.5 });
    const base = [CX, 0, PLAT];
    H.column(F, base, COL.r, COL.H, V.h, { scale: { step: 0.01, label: 0.1, unit: 'cm', turn: 0.62 }, wobble: fl.tap && q > 0 ? 1.2 : 0, phase: S.ta });
    const hn = [1, 0, 0], hAt = [CX + COL.r + 0.003, 0, PLAT + COL.zo];
    H.orifice(F, hAt, hn, V.d, { plug: !fl.drain });
    // the jet, and the tray catching exactly what drained
    const trayWater = V.caught / ((TRAY[1] - TRAY[0]) * (TRAY[3] - TRAY[2]));
    const land = V.q.dr.Q > 0 ? H.jet(F, [hAt[0] + 0.012, 0, hAt[2]], hn, V.q.dr.v, V.d * 0.79, 0.004 + trayWater, { phase: S.ta }) : null;
    H.tray(F, TRAY, 0.004, 0.05, trayWater, { splash: land, phase: S.ta });
    // the leak halfway up (diagram): a smaller jet out of the front, onto the bench
    if (p.setup === 'diagram') {
      const la = [CX - 0.035, -0.036, PLAT + COL.leakZ], ln = [-0.7, -0.714, 0];
      H.orifice(F, la, ln, COL.leakD, { plug: !fl.leak, length: 0.006 });
      if (V.q.lk.Q > 0) H.jet(F, [la[0] + ln[0] * 0.008, la[1] + ln[1] * 0.008, la[2]], ln, V.q.lk.v, COL.leakD * 0.79, 0, { phase: S.ta + 0.3, coherent: 0.7 });
    }
    // the tap over the column and the flow-meter on its stand
    const tapAt = [CX - 0.012, -0.018, PLAT + COL.H + 0.09];
    H.tap(F, tapAt, fl.tap ? q : 0, PLAT + V.h, { open: fl.tap ? clamp(q / 5e-5, 0.1, 1) : 0 });
    // the flow-meter on a stand behind the tray, its hose over to the tap
    B.clampStand(F, [0.50, 0.26, 0], 0.62, {});
    H.rotameter(F, [0.48, 0.22, 0.24], fl.tap ? q * 60000 : 0, 3, { height: 0.22 });
    R3.tube(F, [[0.488, 0.208, 0.47], [0.44, 0.19, 0.66], [0.20, 0.10, 0.93], [tapAt[0] - 0.07, tapAt[1], tapAt[2] + 0.34]], 0.005, '#E8ECF0', { segments: 8, ambient: 0.5 });
    // the ultrasonic sensor on its arm from a stand behind the column, over the water
    B.clampStand(F, [CX, 0.24, 0], PLAT + COL.H + 0.12, {});
    const son = H.sonar(F, [CX + 0.018, 0.022, PLAT + COL.H + 0.03], { arm: [CX, 0.24, PLAT + COL.H + 0.03] });
    // the stopwatch on the bench
    H.stopwatch(F, S.mini ? [0.08, -0.27, 0] : [0.30, -0.25, 0], kit().watch(V.t).replace(' s', ''), { running: V.stall == null });
    // scale: the copy on the bench, with its own tray
    if (S.mini) {
      const M = S.mini, mb = [0.26, -0.235, 0.035], mplat = 0.035;
      B.texBox(F, [mb[0], mb[1], mplat / 2], [0.16 / M.s + 0.02, 0.16 / M.s + 0.02, mplat], { top: B.metal('#D8DCE2', 11), side: B.metal('#C8CDD4', 13), end: B.metal('#C8CDD4', 17) }, { ambient: 0.5 });
      H.column(F, mb, M.r, M.H, M.h, { scale: { step: 0.01 / M.s * (M.s >= 4 ? 2 : 1), label: 0.1 / M.s, unit: '1:' + M.s, mult: 100 * M.s, turn: 0.62, font: 8 }, wall: Math.max(0.0012, M.r * 0.08) });
      const ma = [mb[0] + M.r + 0.0015, mb[1], mb[2] + M.zo];
      H.orifice(F, ma, [1, 0, 0], M.d, { length: Math.max(0.004, 0.012 / M.s) });
      const mtray = [mb[0] + 0.03, mb[0] + 0.03 + 0.5 / M.s + 0.06, mb[1] - 0.05, mb[1] + 0.05];
      const mw = M.caught / ((mtray[1] - mtray[0]) * (mtray[3] - mtray[2]));
      const ml = M.q.dr.Q > 0 ? H.jet(F, [ma[0] + 0.005, mb[1], ma[2]], [1, 0, 0], M.q.dr.v, M.d * 0.79, 0.003 + mw, { phase: S.ta }) : null;
      H.tray(F, mtray, 0.003, 0.02, mw, { splash: ml, phase: S.ta });
      H.stopwatch(F, [0.52, -0.30, 0], kit().watch(M.t).replace(' s', ''), { running: M.stall == null });
      // half marks: where each head is half its start
      halfMark(F, [CX, 0, PLAT + COL.zo + V.head0 / 2], COL.r + 0.006);
      halfMark(F, [mb[0], mb[1], mb[2] + M.zo + M.head0 / 2], M.r + 0.004);
    }
    F.render();
    // the sensor's ping: arcs travelling down to the surface and back
    const top = cam.project(son), surf = cam.project([son[0], son[1], PLAT + V.h]);
    if (top.ok && surf.ok) {
      ctx.save();
      for (let k = 0; k < 3; k++) {
        const u = ((S.ta * 1.6 + k / 3) % 1), y = top.y + (surf.y - top.y) * (u < 0.5 ? u * 2 : 2 - u * 2);
        ctx.strokeStyle = 'rgba(159,240,255,' + (0.5 * (1 - Math.abs(u - 0.5))).toFixed(3) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(top.x, y, 7, 2.2, 0, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    return { cam, son, base };
  }
  function halfMark(F, at, r) {
    F.push(at, () => {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = -Math.PI * 0.95 + i / 24 * Math.PI * 0.9, q = F.cam.project([at[0] + Math.cos(a) * r, at[1] + Math.sin(a) * r, at[2]]); if (!q.ok) return; pts.push(q); }
      F.ctx.save(); F.ctx.strokeStyle = 'rgba(255,120,110,.95)'; F.ctx.lineWidth = 2;
      F.ctx.beginPath(); pts.forEach((q, i) => i ? F.ctx.lineTo(q.x, q.y) : F.ctx.moveTo(q.x, q.y)); F.ctx.stroke();
      F.ctx.fillStyle = '#FF9A90'; F.ctx.font = '600 9px "IBM Plex Mono",monospace'; F.ctx.textAlign = 'right'; F.ctx.textBaseline = 'middle';
      F.ctx.fillText('half', pts[0].x - 4, pts[0].y);
      F.ctx.restore();
    }, -0.06);
  }

  /* ---------------- the town at dusk (why) ---------------- */
  const HOUSES = (() => {
    const out = []; let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const walls = ['#D8CDBA', '#C9B8A0', '#B8C4CC', '#D6C2B0', '#C4B49A', '#E0D6C6'], roofs = ['#6E3A30', '#5A4A42', '#4A5560', '#7A4A36'];
    for (let i = 0; i < 44; i++) {
      const row = Math.floor(i / 11), col = i % 11;
      const x = -70 + col * 14 + (r() - 0.5) * 5 + (row % 2) * 6, y = -10 + row * 22 + (r() - 0.5) * 5;
      if (Math.hypot(x - 10, y - 55) < 16) continue;                // the tower's plot
      out.push({ c: [x, y, 0], w: 8 + r() * 4, d: 7 + r() * 3, h: 5 + r() * 2.5, rot: (r() - 0.5) * 0.3, wall: walls[Math.floor(r() * walls.length)], roof: roofs[Math.floor(r() * roofs.length)], ph: r() });
    }
    return out;
  })();
  function drawTown(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, H = HY(), W = g.w, Hh = g.h, tw = S.tw;
    const hour = 18 + tw.t, dusk = clamp((hour - 18) / 2.2, 0, 1), dawn = clamp((hour - 29.3) / 1.2, 0, 1);
    const dark = clamp(dusk - dawn, 0, 1);
    // the sky: sunset to night and back toward dawn
    const sk = ctx.createLinearGradient(0, 0, 0, Hh);
    sk.addColorStop(0, RX.mix(RX.mix('#6FA3D8', '#0B1428', dark), '#1E3A68', dawn * 0.6));
    sk.addColorStop(0.55, RX.mix(RX.mix('#F2B27A', '#1A2440', dark), '#C98A6A', dawn * 0.5));
    sk.addColorStop(1, RX.mix('#3A2E3A', '#0A0E18', dark));
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, Hh);
    if (dark > 0.4) {                                           // a few stars once it is dark
      ctx.fillStyle = 'rgba(230,236,255,' + (0.6 * (dark - 0.4) / 0.6).toFixed(3) + ')';
      for (let k = 0; k < 60; k++) { const x = (Math.sin(k * 91.7) * 0.5 + 0.5) * W, y = (Math.sin(k * 37.1) * 0.5 + 0.5) * Hh * 0.45; ctx.fillRect(x, y, 1.2, 1.2); }
    }
    const F = R3.Frame(ctx, cam, { ambient: 0.28 + 0.2 * (1 - dark), floorZ: 0 });
    // the ground and a road through the town
    H.quad(F, [0, 40, 0], [220, 0, 0], [0, 160, 0], RX.mix('#4A6A3A', '#141C14', dark * 0.8), { bias: F.GROUND });
    H.quad(F, [-5, 40, 0.02], [220, 0, 0], [0, 4, 0], RX.mix('#3A3E44', '#101216', dark * 0.8), { bias: F.GROUND - 1 });
    H.quad(F, [40, 40, 0.02], [0, 160, 0], [3.5, 0, 0], RX.mix('#3A3E44', '#101216', dark * 0.8), { bias: F.GROUND - 1 });
    // houses: windows light as the evening comes on
    HOUSES.forEach(hs => H.house(F, hs.c, hs.w, hs.d, hs.h, { wall: RX.mix(hs.wall, '#20242C', dark * 0.65), roof: RX.mix(hs.roof, '#15181E', dark * 0.5), rot: hs.rot, lit: dark * (hs.ph > 0.25 ? 1 : 0.2), windows: 2 }));
    // the tower: its board shows what is left
    const T = H.tower(F, [10, 55, 0], { frac: tw.V / TOWER_V, facing: [-0.35, -0.94, 0], steel: RX.mix('#C9D0D8', '#5A6068', dark * 0.6) });
    F.render();
    // the gauge, read off the board: where the real tower is, and where the model said it would be now
    const m = modelOf(S), mv = m.pts.reduce((b, q) => Math.abs(q[0] - tw.t) < Math.abs(b[0] - tw.t) ? q : b, m.pts[0])[1];
    const qt = cam.project(T.top), qb = cam.project(T.board);
    if (qt.ok && qb.ok) {
      const gx = qb.x + 34, gy = qt.y + 6, gh = Math.max(70, (qb.y - qt.y) * 1.2), gw = 16;
      ctx.save();
      kit().card(ctx, gx - 8, gy - 20, 104, gh + 46, { fill: 'rgba(8,12,22,.82)' });
      ctx.fillStyle = 'rgba(60,72,98,.8)'; ctx.fillRect(gx, gy, gw, gh);
      const fr = tw.V / TOWER_V, fm = mv / TOWER_V;
      ctx.fillStyle = 'rgba(79,168,220,.9)'; ctx.fillRect(gx, gy + gh * (1 - fr), gw, gh * fr);
      ctx.strokeStyle = '#C9D4EA'; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
      ctx.strokeStyle = '#9FF0FF'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(gx - 4, gy + gh * (1 - fm)); ctx.lineTo(gx + gw + 4, gy + gh * (1 - fm)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = '#FFD27A'; ctx.fillText('real ' + (100 * fr).toFixed(0) + ' %', gx + gw + 8, gy + gh * (1 - fr));
      ctx.fillStyle = '#9FF0FF'; ctx.fillText('model ' + (100 * fm).toFixed(0) + ' %', gx + gw + 8, gy + gh * (1 - fm) + (Math.abs(fr - fm) * gh < 12 ? 12 : 0));
      ctx.fillStyle = th(g)['text-2']; ctx.fillText('THE TOWER', gx - 2, gy - 10);
      ctx.fillText(clockOf(tw.t), gx - 2, gy + gh + 14);
      ctx.restore();
    }
    return T;
  }

  /* ---------------- cards ---------------- */
  const th = g => g.theme;
  function whyCard(g, S, x, y, w) {
    const K = kit(), ctx = g.ctx, p = S.p, tw = S.tw, m = modelOf(S), h = 176;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.86)' });
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3'];
    ctx.fillText('THE QUESTION', x + 10, y + 12);
    ctx.font = '600 11px "IBM Plex Sans",sans-serif'; ctx.fillStyle = th(g).text;
    K.wrapText(ctx, 'The pump that fills the tower fails at 18:00. When will ' + p.pop.toLocaleString('en') + ' people’s taps run dry?', x + 10, y + 28, w - 20, 14, 2);
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = '#9FF0FF'; ctx.fillText('THE MODEL, AT 18:00', x + 10, y + 66);
    ctx.font = '700 13px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g).text;
    ctx.fillText(m.dry != null ? 'dry at ' + clockOf(m.dry) : 'lasts past 10:00', x + 10, y + 82);
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2'];
    ctx.fillText(m.steps + ' one-minute steps · under a millisecond' + (p.leakModel ? ' · with leaks' : ''), x + 10, y + 97);
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = '#FFD27A'; ctx.fillText('THE REAL TOWN', x + 10, y + 118);
    ctx.font = '700 13px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g).text;
    ctx.fillText(tw.dry != null ? 'ran dry at ' + clockOf(tw.dry) : clockOf(tw.t) + ' · ' + (100 * tw.V / TOWER_V).toFixed(0) + ' % left', x + 10, y + 134);
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2'];
    const verdict = tw.dry != null && m.dry != null ? (Math.abs(tw.dry - m.dry) * 60 < 10 ? 'the model was right to within ' + Math.round(Math.abs(tw.dry - m.dry) * 60) + ' min' :
      'the model was ' + Math.round(Math.abs(tw.dry - m.dry) * 60) + ' min ' + (m.dry > tw.dry ? 'late — it left something out' : 'early')) : 'no one can test this by draining the town';
    K.wrapText(ctx, verdict, x + 10, y + 150, w - 20, 12, 2);
    ctx.restore();
  }
  /* the stock-and-flow diagram: its valves are the apparatus's valves. The stock sits in the
     middle; the tap comes in from the mains on the left, the hole drains to the tray on the right,
     the leak falls to the bench below, evaporation rises to the air above. */
  function diagramCard(g, S, x, y, w) {
    const K = kit(), ctx = g.ctx, p = S.p, V = S.col, q = V.q, h = 262;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.88)' });
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3'];
    ctx.fillText('STOCK AND FLOWS — CLICK A VALVE', x + 10, y + 12);
    const sw = Math.min(96, w * 0.3), sh = 84, sx = x + w / 2 - sw / 2, sy = y + 92;
    const mls = Q => (Q * 1e6 >= 10 ? (Q * 1e6).toFixed(1) : (Q * 1e6).toFixed(2)) + ' mL/s';
    S._valves = [];
    const cloud = (cx, cy, label, below) => {
      ctx.fillStyle = 'rgba(160,175,200,.22)'; ctx.strokeStyle = 'rgba(200,212,234,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx - 8, cy + 2, 7, 0, TAU); ctx.arc(cx + 2, cy - 3, 8.5, 0, TAU); ctx.arc(cx + 10, cy + 3, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.font = '500 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3']; ctx.textAlign = 'center';
      ctx.fillText(label, cx + 1, cy + (below ? 18 : -17));
    };
    /* a flow: a double pipe with an arrowhead, a bow-tie valve at its middle, its name and live value
       placed on the side named by `side` */
    const flow = (key, x0, y0, x1, y1, name, val, on, colr, side) => {
      ctx.lineCap = 'butt';
      ctx.strokeStyle = on ? colr : 'rgba(110,120,140,.5)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(8,12,22,.95)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const ang = Math.atan2(y1 - y0, x1 - x0);
      ctx.fillStyle = on ? colr : 'rgba(110,120,140,.6)';
      ctx.beginPath(); ctx.moveTo(x1 + 4 * Math.cos(ang), y1 + 4 * Math.sin(ang)); ctx.lineTo(x1 - 8 * Math.cos(ang - 0.5), y1 - 8 * Math.sin(ang - 0.5)); ctx.lineTo(x1 - 8 * Math.cos(ang + 0.5), y1 - 8 * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
      const vx = (x0 + x1) / 2, vy = (y0 + y1) / 2, vert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
      ctx.fillStyle = on ? colr : '#4A5568'; ctx.strokeStyle = '#E7EDFB'; ctx.lineWidth = 1;
      ctx.beginPath();
      if (vert) { ctx.moveTo(vx - 8, vy - 7); ctx.lineTo(vx + 8, vy - 7); ctx.lineTo(vx - 8, vy + 7); ctx.lineTo(vx + 8, vy + 7); }
      else { ctx.moveTo(vx - 7, vy - 8); ctx.lineTo(vx - 7, vy + 8); ctx.lineTo(vx + 7, vy - 8); ctx.lineTo(vx + 7, vy + 8); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      S._valves.push({ key, x0: vx - 12, y0: vy - 12, x1: vx + 12, y1: vy + 12 });
      const tx = side === 'left' ? vx - 14 : side === 'right' ? vx + 14 : vx, ty = side === 'above' ? vy - 22 : side === 'below' ? vy + 16 : vy - 7;
      ctx.textAlign = side === 'left' ? 'right' : side === 'right' ? 'left' : 'center';
      ctx.font = '600 9.5px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on ? th(g).text : th(g)['text-3'];
      ctx.fillText(name, tx, ty);
      ctx.font = '500 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = on ? colr : th(g)['text-3'];
      ctx.fillText(on ? val : 'closed', tx, ty + 12);
    };
    // the stock: a box whose water is the column's, and its volume
    ctx.fillStyle = 'rgba(30,44,64,.9)'; ctx.fillRect(sx, sy, sw, sh);
    const f = clamp(V.h / COL.H, 0, 1);
    ctx.fillStyle = 'rgba(79,168,220,.7)'; ctx.fillRect(sx, sy + sh * (1 - f), sw, sh * f);
    ctx.strokeStyle = '#C9D4EA'; ctx.lineWidth = 1.5; ctx.strokeRect(sx, sy, sw, sh);
    ctx.textAlign = 'center'; ctx.fillStyle = th(g).text;
    ctx.font = '700 9.5px "IBM Plex Sans",sans-serif'; ctx.fillText('the column', sx + sw / 2, sy + 12);
    ctx.font = '700 12px "IBM Plex Mono",monospace'; ctx.fillText((V.h * V.A * 1000).toFixed(2) + ' L', sx + sw / 2, sy + sh / 2 + 6);
    cloud(x + 22, sy + 26, 'mains', true);
    flow('tap', x + 36, sy + 26, sx - 3, sy + 26, 'tap', mls(q.qin), p.tap, '#9FF0FF', 'above');
    cloud(x + w - 26, sy + sh - 20, 'tray', true);
    flow('drain', sx + sw + 3, sy + sh - 20, x + w - 42, sy + sh - 20, 'hole', mls(q.dr.Q), p.drain, '#7BE08A', 'above');
    cloud(sx + sw / 2, y + h - 30, 'bench', false);
    flow('leak', sx + sw / 2, sy + sh + 3, sx + sw / 2, y + h - 44, 'leak at 30 cm', mls(q.lk.Q), p.leak, '#FFB35C', 'right');
    cloud(sx + sw / 2, y + 38, 'air', true);
    flow('evap', sx + sw / 2, sy - 3, sx + sw / 2, y + 54, 'evaporation', (q.ev * 1e9).toFixed(2) + ' µL/s', p.evap, '#DDEBFF', 'right');
    ctx.restore();
  }
  function scaleCard(g, S, x, y, w) {
    const K = kit(), ctx = g.ctx, V = S.col, M = S.mini, h = 150;
    if (!M) return;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.86)' });
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3'];
    ctx.fillText('TIME TO FALL TO HALF THE START HEAD', x + 10, y + 12);
    const row = (yy, name, T, col) => {
      ctx.font = '600 10px "IBM Plex Sans",sans-serif'; ctx.fillStyle = col; ctx.fillText(name, x + 10, yy);
      ctx.font = '700 12px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g).text; ctx.textAlign = 'right';
      ctx.fillText(T.half != null ? T.half.toFixed(1) + ' s' : T.stall != null ? 'stopped' : kit().watch(T.t) + ' …', x + w - 10, yy); ctx.textAlign = 'left';
    };
    row(y + 32, 'full column', V, '#9FCBFF');
    row(y + 52, '1:' + M.s + ' copy', M, '#FFD36B');
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2'];
    if (V.half != null && M.half != null) {
      ctx.fillText('full ÷ copy = ' + (V.half / M.half).toFixed(2), x + 10, y + 76);
      ctx.fillText('size ratio ' + M.s + '   √' + M.s + ' = ' + Math.sqrt(M.s).toFixed(2), x + 10, y + 92);
    } else if (M.stall != null && M.half == null) {
      ctx.fillStyle = '#FB7185';
      kit().wrapText(ctx, 'the copy stopped with ' + ((M.h - M.zo) * 100).toFixed(1) + ' cm of head: surface tension holds it — it does not scale', x + 10, y + 76, w - 20, 12, 3);
    } else ctx.fillText('both started together — watch the half marks', x + 10, y + 76);
    ctx.fillStyle = th(g)['text-3'];
    kit().wrapText(ctx, 'a digital model needs no scaling: it runs the full size directly', x + 10, y + 124, w - 20, 11, 2);
    ctx.restore();
  }
  function leavesCard(g, S, x, y, w) {
    const K = kit(), ctx = g.ctx, p = S.p, X = effects(S), lm = leavesModel(S), h = 190;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.86)' });
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3'];
    ctx.fillText('IN THE MODEL — AND HOW MUCH EACH MATTERS', x + 10, y + 12);
    const on = { vena: p.vena, visc: p.visc, tension: p.tension, evap: p.mEvap };
    const maxd = Math.max(...X.rows.map(r => Math.abs(r.dt)), 1e-9);
    X.rows.forEach((r, i) => {
      const yy = y + 34 + i * 30;
      kit().led(ctx, x + 14, yy, on[r.k], '#7BE08A');
      ctx.font = '600 10px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on[r.k] ? th(g).text : th(g)['text-3'];
      ctx.fillText(r.what, x + 24, yy - 6);
      const bw = (w - 110) * Math.max(0.004, Math.abs(r.dt) / maxd);
      ctx.fillStyle = on[r.k] ? 'rgba(123,224,138,.75)' : 'rgba(110,120,140,.5)'; ctx.fillRect(x + 24, yy + 4, bw, 5);
      ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2']; ctx.textAlign = 'right';
      ctx.fillText(Math.abs(r.dt) < 0.001 ? '< 0.001 %' : (r.dt >= 0 ? '+' : '') + (Math.abs(r.dt) >= 1 ? r.dt.toFixed(1) : r.dt.toPrecision(2)) + ' %', x + w - 10, yy + 6); ctx.textAlign = 'left';
    });
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2'];
    ctx.fillText('bars: the drain time changes this much if that effect is left out', x + 10, y + h - 30);
    ctx.fillStyle = th(g).text; ctx.font = '600 10px "IBM Plex Mono",monospace';
    ctx.fillText('model: empty at ' + (lm.stall != null ? lm.stall.toFixed(1) + ' s' : '—') + '   apparatus: ' + X.t0.toFixed(1) + ' s', x + 10, y + h - 13);
    ctx.restore();
  }
  function reviseCard(g, S, x, y, w) {
    const K = kit(), ctx = g.ctx, p = S.p, F = fittedNow(S), h = 150;
    K.card(ctx, x, y, w, h, { fill: 'rgba(8,12,22,.86)' });
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-3'];
    ctx.fillText(p.validate ? 'TESTED ON A RUN IT WAS NOT FITTED TO' : 'FITTED TO THE SENSOR, AS THE DATA COME IN', x + 10, y + 12);
    ctx.font = '700 11px "IBM Plex Sans",sans-serif'; ctx.fillStyle = th(g).text;
    ctx.fillText(FAMILY[p.fam].name, x + 10, y + 30);
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th(g)['text-2'];
    K.wrapText(ctx, FAMILY[p.fam].law, x + 10, y + 45, w - 20, 11, 2);
    if (!F) { ctx.fillText('collecting readings…', x + 10, y + 70); ctx.restore(); return; }
    ctx.fillStyle = th(g).text; ctx.font = '600 10px "IBM Plex Mono",monospace';
    ctx.fillText('misses the data by ' + (F.rms * 1000).toFixed(1) + ' mm (rms)', x + 10, y + 70);
    ctx.fillStyle = F.random ? '#7BE08A' : '#FBBF24';
    K.wrapText(ctx, F.random ? 'residuals scatter like noise: the shape is right' : 'residuals run in long arcs: the shape is wrong', x + 10, y + 86, w - 20, 12, 2);
    ctx.fillStyle = th(g)['text-2']; ctx.font = '500 9px "IBM Plex Mono",monospace';
    if (p.validate) {
      const hs = steadyLevel(p.dmm, p.qv / 60000, ALL), pr = predictWith(F, S.col.h0 - COL.zo, p.qv / 60000 / S.col.A, 600);
      const ps = pr[pr.length - 1][1] + COL.zo;
      K.wrapText(ctx, 'tap on at ' + p.qv.toFixed(1) + ' L/min: the model settles at ' + (p.fam === 'const' ? 'no level (it never balances)' : (ps * 100).toFixed(1) + ' cm') + ' · the column at ' + (hs * 100).toFixed(1) + ' cm', x + 10, y + 118, w - 20, 11, 3);
    } else K.wrapText(ctx, F.empty < Infinity ? 'predicts the jet stops at ' + F.empty.toFixed(0) + ' s' : 'predicts it never empties', x + 10, y + 118, w - 20, 11, 2);
    ctx.restore();
  }

  function drawStage(S, g) {
    const K = kit(), p = S.p, W = g.w, V = S.col;
    S._narrow = W < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) {
      const h = homeFor(p.setup, S._narrow);
      S.cam.dist = h.dist; S.cam.target = h.target.slice(); S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist };
      S._narrowCam = S._narrow;
    }
    S._valves = null;
    if (p.setup === 'why') {
      drawTown(S, g);
      const tw = S.tw;
      K.header(g, tw.dry != null ? 'The taps ran dry at ' + clockOf(tw.dry) + ' — the model said ' + (modelOf(S).dry != null ? clockOf(modelOf(S).dry) : 'later') :
        'The pump has failed: the tower is ' + (100 * tw.V / TOWER_V).toFixed(0) + ' % full at ' + clockOf(tw.t),
        'a 1131 m³ tower · ' + p.pop.toLocaleString('en') + ' people · using ' + realUse(tw.t, p).toFixed(0) + ' m³ an hour now' + (p.saving && tw.t >= 3 ? ' (saving)' : ''),
        'the model answered at 18:00; the real evening runs at 6 minutes a second');
      const at = K.cardSlot(g, S, 'the question, the model, the town', Math.min(300, W * 0.34));
      if (at) whyCard(g, S, at.x, at.y, at.w);
      return;
    }
    drawBench(S, g);
    const fl = valves(p), q = V.q;
    const head = V.h - COL.zo;
    if (p.setup === 'diagram') {
      K.header(g, (fl.tap && q.qin > 0 ? (Math.abs(V.q.dr.Q + V.q.lk.Q + V.q.ev - q.qin) < 1e-7 ? 'In balances out: the level holds' : q.qin > V.q.dr.Q + V.q.lk.Q ? 'More in than out: the level rises' : 'More out than in: the level falls') : 'Only outflows: the level can only fall') + ' — at ' + (V.h * 100).toFixed(1) + ' cm',
        'in ' + (q.qin * 1e6).toFixed(1) + ' mL/s · out ' + ((V.q.dr.Q + V.q.lk.Q + V.q.ev) * 1e6).toFixed(1) + ' mL/s · the level changes by ' + (V.q.dhdt * 1000).toFixed(2) + ' mm/s',
        'the diagram, the equation and the column are one model in three forms');
      const at = K.cardSlot(g, S, 'the stock-and-flow diagram', Math.min(330, W * 0.38));
      if (at) diagramCard(g, S, at.x, at.y, at.w);
    } else if (p.setup === 'scale') {
      const M = S.mini;
      K.header(g, M.stall != null && M.half == null ? 'The 1:' + M.s + ' copy has stopped — surface tension does not shrink with it' : 'Two columns, one shape: the copy is ' + M.s + ' times smaller in every length',
        'full ' + (V.h * 100).toFixed(1) + ' cm · copy ' + (M.h * 100).toFixed(2) + ' cm (reads ' + (M.h * 100 * M.s).toFixed(1) + ' on its own scale) · holes ' + p.dmm + ' mm and ' + (p.dmm / M.s).toFixed(2) + ' mm',
        'the red marks are half of each start head');
      const at = K.cardSlot(g, S, 'the two half-times', Math.min(290, W * 0.33));
      if (at) scaleCard(g, S, at.x, at.y, at.w);
    } else if (p.setup === 'leaves') {
      const lm = leavesModel(S);
      K.header(g, 'The model keeps ' + ['vena', 'visc', 'tension', 'mEvap'].filter(k => p[k]).length + ' of 4 effects — it says empty at ' + (lm.stall != null ? lm.stall.toFixed(0) + ' s' : '—'),
        'the column: ' + (V.h * 100).toFixed(1) + ' cm at ' + kit().watch(V.t) + (V.stall != null ? ' · its jet stopped at ' + V.stall.toFixed(1) + ' s' : '') + ' · Cd now ' + (V.q.dr.Cd || 0).toFixed(3),
        'a model is judged only against what the sensor reads');
      const at = K.cardSlot(g, S, 'what the model keeps', Math.min(320, W * 0.37));
      if (at) leavesCard(g, S, at.x, at.y, at.w);
    } else if (p.setup === 'revise') {
      const F = fittedNow(S);
      K.header(g, (p.validate ? 'Test: the tap runs at ' + p.qv.toFixed(1) + ' L/min' : 'Fit: ' + FAMILY[p.fam].name.toLowerCase()) + (F ? ' — misses by ' + (F.rms * 1000).toFixed(1) + ' mm' : ''),
        'the sensor reads ' + (S.data.length ? (S.data[S.data.length - 1].h * 100).toFixed(1) : '—') + ' cm every half second, in whole millimetres · ' + S.data.length + ' readings',
        F ? (F.random ? 'the residuals look like noise' : 'the residuals bend: revise the model') : 'waiting for readings');
      const at = K.cardSlot(g, S, 'the model and its residuals', Math.min(300, W * 0.34));
      if (at) reviseCard(g, S, at.x, at.y, at.w);
    }
    void head;
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function levelPlot(S, g) {
    const K = kit(), p = S.p, t = th(g);
    if (p.setup === 'why') return towerPlot(S, g);
    const V = S.col, D = S.data;
    const tEnd = Math.max(30, V.t, p.setup === 'leaves' ? (leavesModel(S).stall || 0) * 1.05 : 0, p.setup === 'revise' && p.validate ? 240 : 0);
    const ax = K.secAxis(0, tEnd);
    const items = [{ c: '#E7EDFB', dot: true, label: 'sensor readings' }];
    if (p.setup === 'leaves') items.push({ c: '#FFD36B', label: 'the model' });
    if (p.setup === 'revise') items.push({ c: '#FFD36B', label: FAMILY[p.fam].name.toLowerCase() });
    if (p.setup === 'scale') items.push({ c: '#FFD36B', label: '1:' + p.model + ' copy, its time × √' + p.model });
    const Kk = K.plotKey(g, items);
    const P = g.Plot(Object.assign({ xmin: 0, xmax: tEnd, ymin: 0, ymax: 60, pad: { t: Kk.t },
      xlabel: ax.unit === 'min' ? 'time, minutes' : 'time, s', ylabel: 'level on the scale, cm', yfmt: v => v.toFixed(0) }, ax)).frame();
    Kk.draw(P);
    const ctx = g.ctx;
    P.clip(() => {
      if (p.setup === 'leaves') { const lm = leavesModel(S); P.line(lm.pts.map(q => [q[0], q[1] * 100]), '#FFD36B', 2); }
      if (p.setup === 'revise' && fittedNow(S)) {
        const F = fittedNow(S);
        if (p.validate) P.line(predictWith(F, V.h0 - COL.zo, p.qv / 60000 / V.A, tEnd).map(q => [q[0], (q[1] + COL.zo) * 100]), '#FFD36B', 2);
        else { const pts = []; for (let tt = 0; tt <= tEnd; tt += tEnd / 200) pts.push([tt, (F.pred(tt) + COL.zo) * 100]); P.line(pts, '#FFD36B', 2); }
      }
      if (p.setup === 'scale' && S.mini) {
        const M = S.mini, s = Math.sqrt(M.s);
        P.line(S.miniData.map(q => [q.t * s, (q.h - M.zo) / M.head0 * (V.head0) * 100 + COL.zo * 100]), '#FFD36B', 2);
      }
      ctx.fillStyle = '#E7EDFB';
      const every = Math.max(1, Math.floor(D.length / 400));
      D.forEach((d, i) => { if (i % every === 0) { ctx.beginPath(); ctx.arc(P.X(d.t), P.Y(d.h * 100), 1.6, 0, TAU); ctx.fill(); } });
    });
    // revise: the residual strip under the curve
    if (p.setup === 'revise' && p.resid && fittedNow(S) && !p.validate) {
      const F = fittedNow(S), y0 = P.Y(8), ys = 36;
      ctx.save(); ctx.fillStyle = 'rgba(8,12,22,.75)'; ctx.fillRect(P.x0 + 1, y0 - ys, P.x1 - P.x0 - 2, ys * 2);
      ctx.strokeStyle = 'rgba(120,140,180,.4)'; ctx.beginPath(); ctx.moveTo(P.x0, y0); ctx.lineTo(P.x1, y0); ctx.stroke();
      ctx.fillStyle = F.random ? '#7BE08A' : '#FBBF24';
      D.forEach(d => { const e = d.h - COL.zo - F.pred(d.t); if (d.h - COL.zo > 0.004) ctx.fillRect(P.X(d.t) - 1, y0 - clamp(e * 1000 * 4, -ys, ys) - 1, 2, 2); });
      ctx.fillStyle = t['text-2']; ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('residuals (data − model), ×4: ' + (F.random ? 'noise' : 'a pattern'), P.x0 + 6, y0 - ys + 3);
      ctx.restore();
    }
  }
  function towerPlot(S, g) {
    const K = kit(), p = S.p, tw = S.tw, m = modelOf(S);
    const Kk = K.plotKey(g, [{ c: '#9FF0FF', label: 'the model, made at 18:00' }, { c: '#FFD27A', label: 'the real tower' }]);
    const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'clock', ylabel: 'water in the tower, %',
      xticks: [0, 2, 4, 6, 8, 10, 12], xfmt: v => clockOf(v), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      P.line(m.pts.map(q => [q[0], 100 * q[1] / TOWER_V]), '#9FF0FF', 2, [6, 4]);
      P.line(tw.hist.map(q => [q[0], 100 * q[1] / TOWER_V]), '#FFD27A', 2.5);
      P.vline(tw.t, g.alpha(g.theme['text-2'], .5), [2, 3]);
      if (m.dry != null) P.dot(m.dry, 0, 4, '#9FF0FF');
      if (tw.dry != null) P.dot(tw.dry, 0, 5, '#FFD27A', g.alpha('#FFFFFF', .9));
    });
  }
  function secondPlot(S, g) {
    const K = kit(), p = S.p, t = th(g), ctx = g.ctx;
    if (p.setup === 'why') {
      const Kk = K.plotKey(g, [{ c: '#FFD27A', label: 'what the town uses' }, { c: '#9FF0FF', label: 'what the model thinks it uses', dash: [6, 4] }]);
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: Math.max(50, meanUse(p) * 2.2), pad: { t: Kk.t }, xlabel: 'clock', ylabel: 'm³ an hour',
        xticks: [0, 2, 4, 6, 8, 10, 12], xfmt: v => clockOf(v), yfmt: v => v.toFixed(0) }).frame();
      Kk.draw(P);
      const A = [], B = [];
      for (let x = 0; x <= 12; x += 0.1) { A.push([x, realUse(x, p)]); B.push([x, modelUse(x, p)]); }
      P.clip(() => { P.area(A, 0, g.alpha('#FFD27A', 0.12)); P.line(A, '#FFD27A', 2); P.line(B, '#9FF0FF', 2, [6, 4]); P.vline(S.tw.t, g.alpha(t['text-2'], .5), [2, 3]); });
      ctx.save(); ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = t['text-2']; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('the gap is the mains leaking: ' + (LEAKAGE * meanUse(p)).toFixed(0) + ' m³ an hour' + (p.leakModel ? ' — now in the model' : ' — not in the model'), P.x0 + 6, P.y1 + 4);
      ctx.restore();
      return;
    }
    if (p.setup === 'diagram') {
      // the flows over the run: what comes in, what goes out, and the difference that moves the level
      const D = S.data, V = S.col;
      const Kk = K.plotKey(g, [{ c: '#9FF0FF', label: 'in: tap' }, { c: '#7BE08A', label: 'out: hole' }, { c: '#FFB35C', label: 'out: leak' }, { c: '#E7EDFB', label: 'in − out', dash: [5, 3] }]);
      const tEnd = Math.max(30, V.t), ax = K.secAxis(0, tEnd), FH = S.flowHist;
      const ymax = Math.max(40, ...FH.map(q => Math.max(q.qin, q.dr, q.lk) * 1e6)) * 1.1;
      const ymin = Math.min(-ymax * 0.3, ...FH.map(q => (q.qin - q.dr - q.lk) * 1e6 * 1.15));
      const P = g.Plot(Object.assign({ xmin: 0, xmax: tEnd, ymin, ymax, pad: { t: Kk.t }, xlabel: ax.unit === 'min' ? 'time, minutes' : 'time, s', ylabel: 'mL/s', yfmt: v => v.toFixed(0) }, ax)).frame();
      Kk.draw(P);
      P.clip(() => {
        P.hline(0, g.alpha(t['text-3'], .6));
        P.line(FH.map(q => [q.t, q.qin * 1e6]), '#9FF0FF', 2);
        P.line(FH.map(q => [q.t, q.dr * 1e6]), '#7BE08A', 2);
        P.line(FH.map(q => [q.t, q.lk * 1e6]), '#FFB35C', 2);
        P.line(FH.map(q => [q.t, (q.qin - q.dr - q.lk) * 1e6]), '#E7EDFB', 1.5, [5, 3]);
      });
      void D;
      return;
    }
    if (p.setup === 'scale') {
      const SL = scaleLand(S);
      const Kk = K.plotKey(g, [{ c: '#FFD36B', dot: true, label: 'measured on each copy' }, { c: '#9FCBFF', label: 'time ∝ √size (Froude)', dash: [6, 4] }]);
      const P = g.Plot({ xmin: -1.4, xmax: 0, ymin: 0, ymax: 2.2, pad: { t: Kk.t }, xlabel: 'column height, m (log)', ylabel: 'half-time, s (log)',
        xticks: [-1, -0.5, 0], yticks: [0, 1, 2], xfmt: v => (Math.pow(10, v)).toFixed(v < -0.9 ? 2 : 1), yfmt: v => Math.pow(10, v).toFixed(0) }).frame();
      Kk.draw(P);
      const full = SL.pts[0];
      P.clip(() => {
        const l0 = Math.log10(full.L), t0 = Math.log10(full.t);
        P.line([[-1.4, t0 + 0.5 * (-1.4 - l0)], [0, t0 + 0.5 * (0 - l0)]], '#9FCBFF', 1.5, [6, 4]);
        SL.pts.forEach(q => {
          if (q.t != null) P.dot(Math.log10(q.L), Math.log10(q.t), q.s === S.p.model || q.s === 1 ? 5 : 3.5, '#FFD36B', q.s === S.p.model ? g.alpha('#FFFFFF', .9) : null);
          else P.dot(Math.log10(q.L), 2.1, 4, '#FB7185');
        });
      });
      ctx.save(); ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle';
      SL.pts.forEach(q => { const x = P.X(Math.log10(q.L)), y = q.t != null ? P.Y(Math.log10(q.t)) : P.Y(2.1); ctx.fillStyle = q.t != null ? t['text-2'] : '#FB7185'; ctx.textAlign = 'left'; ctx.fillText(q.s === 1 ? 'full' : '1:' + q.s + (q.t == null ? ' never' : ''), x + 7, y - 8); });
      ctx.restore();
      return;
    }
    if (p.setup === 'leaves') {
      const X = effects(S);
      const Kk = K.plotKey(g, [{ c: 'rgba(123,224,138,.8)', box: true, label: 'change in drain time if left out' }], 'drain time with everything: ' + X.t0.toFixed(1) + ' s');
      // a log axis done by hand: plot log10(|Δ|)
      const P2 = g.Plot({ xmin: -0.5, xmax: 3.5, ymin: -4, ymax: 2, pad: { t: Kk.t, b: 40 }, xlabel: '', ylabel: 'change, % (log)', xticks: [], yticks: [-4, -3, -2, -1, 0, 1, 2], yfmt: v => (Math.pow(10, v) >= 1 ? Math.pow(10, v).toFixed(0) : String(Math.pow(10, v))) }).frame();
      Kk.draw(P2);
      const on = { vena: S.p.vena, visc: S.p.visc, tension: S.p.tension, evap: S.p.mEvap };
      X.rows.forEach((r, i) => {
        const v = Math.log10(Math.max(1e-4, Math.abs(r.dt)));
        P2.clip(() => P2.bar(i, v, 0.32, -4, on[r.k] ? 'rgba(123,224,138,.8)' : 'rgba(110,120,140,.45)'));
        ctx.save(); ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = t['text-2']; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(['vena contracta', 'viscosity', 'surface tension', 'evaporation'][i], P2.X(i), P2.y0 + 6);
        ctx.fillText(Math.abs(r.dt) < 0.001 ? '< 0.001 %' : (Math.abs(r.dt) >= 1 ? Math.abs(r.dt).toFixed(0) : Math.abs(r.dt).toPrecision(1)) + ' %', P2.X(i), P2.y0 + 18);
        ctx.restore();
      });
      return;
    }
    // revise: drain time against start head, log–log — the slope names the law
    const LD = landscape(S), F = fittedNow(S);
    const Kk = K.plotKey(g, [{ c: '#E7EDFB', dot: true, label: 'the column, measured' }, { c: '#FFD36B', label: FAMILY[p.fam].name.toLowerCase() + ', fitted' }]);
    const P = g.Plot({ xmin: -1.4, xmax: -0.2, ymin: 1, ymax: 2.6, pad: { t: Kk.t }, xlabel: 'start head, m (log)', ylabel: 'drain time, s (log)',
      xticks: [-1.3, -1, -0.7, -0.3], yticks: [1, 1.5, 2, 2.5], xfmt: v => Math.pow(10, v).toFixed(2), yfmt: v => Math.pow(10, v).toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      if (F) {
        const law = y0 => p.fam === 'const' ? y0 / F.k : p.fam === 'sqrt' ? Math.sqrt(y0) / F.k : Math.log(y0 / 0.003) / F.k;
        const pts = []; for (let x = -1.4; x <= -0.2; x += 0.02) { const tt = law(Math.pow(10, x)); if (tt > 0) pts.push([x, Math.log10(tt)]); }
        P.line(pts, '#FFD36B', 2);
      }
      LD.pts.forEach(q => { if (q[1]) P.dot(Math.log10(q[0]), Math.log10(q[1]), 3.5, '#E7EDFB'); });
    });
    const a = LD.pts[1], b = LD.pts[LD.pts.length - 1];
    const slope = (Math.log10(b[1]) - Math.log10(a[1])) / (Math.log10(b[0]) - Math.log10(a[0]));
    ctx.save(); ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = t['text-2']; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('measured slope ' + slope.toFixed(2) + ' · constant 1 · √ 0.5 · ∝ level: not a line', P.x1 - 4, P.y0 - 4);
    ctx.restore();
  }

  /* ============================================================
     READOUTS AND EQUATIONS
     ============================================================ */
  const cm = h => (h * 100).toFixed(1);
  function readouts(S) {
    const p = S.p, V = S.col, q = V.q;
    if (p.setup === 'why') {
      const tw = S.tw, m = modelOf(S);
      return [
        { label: 'Tower', value: (100 * tw.V / TOWER_V).toFixed(0), unit: '%', flag: tw.V / TOWER_V < 0.15 ? 'crit' : tw.V / TOWER_V < 0.35 ? 'warn' : 'accent', hint: tw.V.toFixed(0) + ' m³ of 1131' },
        { label: 'Clock', value: clockOf(tw.t), hint: 'the pump failed at 18:00' },
        { label: 'Town uses now', value: realUse(tw.t, p).toFixed(0), unit: 'm³/h', hint: 'of which leaks ' + (LEAKAGE * meanUse(p)).toFixed(0) },
        { label: 'Model: dry at', value: m.dry != null ? clockOf(m.dry) : 'after 10:00', flag: 'accent', hint: m.steps + ' steps of one minute' },
        { label: 'Real: dry at', value: tw.dry != null ? clockOf(tw.dry) : '—', flag: tw.dry != null ? 'crit' : '', hint: tw.dry != null ? 'the taps ran dry' : 'the evening is still running' },
        { label: 'Model error', value: tw.dry != null && m.dry != null ? ((m.dry - tw.dry) * 60).toFixed(0) : '—', unit: 'min', hint: p.leakModel ? 'leaks are in the model' : 'the model leaves out the leaks' }
      ];
    }
    const base = [
      { label: 'Level', value: cm(V.h), unit: 'cm', flag: 'accent', hint: 'the sensor reads ' + (S.data.length ? cm(S.data[S.data.length - 1].h) : '—') + ' cm' },
      { label: 'Stopwatch', value: V.t.toFixed(1), unit: 's', hint: V.stall != null ? 'the jet stopped at ' + V.stall.toFixed(1) + ' s' : 'running' }
    ];
    if (p.setup === 'diagram') return base.concat([
      { label: 'Flow in (tap)', value: (q.qin * 1e6).toFixed(1), unit: 'mL/s', hint: p.tap ? (p.qin).toFixed(1) + ' L/min on the meter' : 'tap closed' },
      { label: 'Out: the hole', value: (q.dr.Q * 1e6).toFixed(1), unit: 'mL/s', hint: 'jet at ' + q.dr.v.toFixed(2) + ' m/s' },
      { label: 'Out: the leak', value: (q.lk.Q * 1e6).toFixed(2), unit: 'mL/s', hint: p.leak ? (V.h > COL.leakZ ? 'water above the leak' : 'water below it: nothing') : 'taped over' },
      { label: 'Evaporation', value: (q.ev * 1e9).toFixed(2), unit: 'µL/s', hint: p.evap ? 'off the surface' : 'lid on' },
      { label: 'Level changes', value: (q.dhdt * 1000).toFixed(2), unit: 'mm/s', flag: q.dhdt > 0 ? 'ok' : '', hint: '(in − out) ÷ area' }
    ]);
    if (p.setup === 'scale') {
      const M = S.mini;
      return base.concat([
        { label: 'Copy scale', value: '1:' + M.s, hint: 'hole ' + (p.dmm / M.s).toFixed(2) + ' mm' },
        { label: 'Full half-time', value: V.half != null ? V.half.toFixed(1) : '—', unit: 's' },
        { label: 'Copy half-time', value: M.half != null ? M.half.toFixed(1) : M.stall != null ? 'never' : '—', unit: M.half != null ? 's' : '', flag: M.stall != null && M.half == null ? 'crit' : '' },
        { label: 'Full ÷ copy', value: V.half != null && M.half != null ? (V.half / M.half).toFixed(2) : '—', flag: 'accent', hint: '√' + M.s + ' = ' + Math.sqrt(M.s).toFixed(2) + ' · ' + M.s + ' would be wrong' },
        { label: 'Held by tension', value: (hole(1, M.d, ALL).hs * 1000).toFixed(1), unit: 'mm', hint: 'of head, in the copy' }
      ]);
    }
    if (p.setup === 'leaves') {
      const lm = leavesModel(S), X = effects(S);
      return base.concat([
        { label: 'Model: empty at', value: lm.stall != null ? lm.stall.toFixed(2) : '—', unit: 's', flag: 'accent' },
        { label: 'Apparatus', value: X.t0.toFixed(2), unit: 's', hint: 'measured, every effect' },
        { label: 'Model error', value: lm.stall != null ? ((lm.stall - X.t0) / X.t0 * 100).toFixed(2) : '—', unit: '%', flag: lm.stall != null && Math.abs(lm.stall - X.t0) / X.t0 > 0.05 ? 'warn' : 'ok' },
        { label: 'Cd now', value: (q.dr.Cd || 0).toFixed(3), hint: 'Re ' + Math.round(q.dr.Re || 0) },
        { label: 'Jet speed', value: q.dr.v.toFixed(2), unit: 'm/s', hint: 'range ' + (q.dr.v * Math.sqrt(2 * (PLAT + COL.zo) / G) * 100).toFixed(0) + ' cm' }
      ]);
    }
    const F = fittedNow(S);
    return base.concat([
      { label: 'Model', value: FAMILY[p.fam].name.replace('Outflow ', ''), hint: FAMILY[p.fam].law },
      { label: 'Misses by', value: F ? (F.rms * 1000).toFixed(1) : '—', unit: 'mm', flag: F ? (F.random ? 'ok' : 'warn') : '', hint: 'rms of the residuals' },
      { label: 'Residuals', value: F ? (F.random ? 'noise' : 'a pattern') : '—', flag: F ? (F.random ? 'ok' : 'warn') : '', hint: F ? F.runs + ' sign changes in ' + F.n : '' },
      { label: 'Predicts empty at', value: F ? (F.empty < Infinity ? F.empty.toFixed(0) : 'never') : '—', unit: F && F.empty < Infinity ? 's' : '', hint: p.validate ? 'fitted to the tap-off run' : 'fitted to this run' },
      { label: 'Tap (validation)', value: p.validate ? p.qv.toFixed(1) : 'off', unit: p.validate ? 'L/min' : '', hint: p.validate ? 'the column settles at ' + cm(steadyLevel(p.dmm, p.qv / 60000, ALL)) + ' cm' : 'switch it on to test the model' }
    ]);
  }
  function equation(S) {
    const p = S.p, V = S.col, q = V.q;
    if (p.setup === 'why') {
      const tw = S.tw;
      return E.v('V') + '(t) ' + E.op('=') + ' ' + E.n(TOWER_V, 'm³') + ' ' + E.op('−') + ' ' + E.v('∫') + E.sub('18:00') + ' ' + E.v('Q') + E.sub('town') + ' ' + E.v('dt') + ' ' + E.op('=') + ' ' +
        E.n(Math.max(0, tw.V), 'm³') + ' at ' + clockOf(tw.t) +
        '<br><span style="font-size:12px;color:var(--text-3)">the model: ' + E.v('Q') + E.sub('town') + ' = ' + p.pop.toLocaleString('en') + ' people × ' + LITRES_PP + ' L a day × the hour’s share' +
        (p.saving ? ' × 0.75 after 21:00' : '') + (p.leakModel ? ' + ' + (LEAKAGE * meanUse(p)).toFixed(0) + ' m³/h of leaks' : '') + '</span>';
    }
    if (p.setup === 'diagram') {
      const fl = valves(p);
      const terms = [];
      if (fl.tap) terms.push(E.n(q.qin * 1e6, 'mL/s') + E.sub('tap'));
      if (fl.drain) terms.push(E.op('−') + ' ' + E.n(q.dr.Q * 1e6, 'mL/s') + E.sub('hole'));
      if (fl.leak) terms.push(E.op('−') + ' ' + E.n(q.lk.Q * 1e6, 'mL/s') + E.sub('leak'));
      if (fl.evap) terms.push(E.op('−') + ' ' + E.n(q.ev * 1e6, 'mL/s') + E.sub('evaporation'));
      return E.v('A') + '·' + E.v('dh/dt') + ' ' + E.op('=') + ' ' + (terms.length ? terms.join(' ') : '0') + ' ' + E.op('=') + ' ' + E.n(q.dhdt * V.A * 1e6, 'mL/s') +
        '<br><span style="font-size:12px;color:var(--text-3)">each arrow in the diagram is one term; ' + E.v('A') + ' = ' + (V.A * 1e4).toFixed(1) + ' cm², so the level moves ' + (q.dhdt * 1000).toFixed(3) + ' mm every second</span>';
    }
    if (p.setup === 'scale') {
      const M = S.mini;
      return E.frac(E.v('t') + E.sub('full'), E.v('t') + E.sub('copy')) + ' ' + E.op('=') + ' ' + E.frac('√' + E.v('L') + E.sub('full'), '√' + E.v('L') + E.sub('copy')) + ' ' + E.op('=') + ' √' + E.n(M.s, '') + ' ' + E.op('=') + ' ' + E.n(Math.sqrt(M.s), '') +
        (V.half != null && M.half != null ? ' · measured ' + E.n(V.half / M.half, '') : '') +
        '<br><span style="font-size:12px;color:var(--text-3)">speeds go as √(depth) — ' + E.v('v') + ' = √(2' + E.v('g') + E.v('h') + ') — so times go as length ÷ speed ∝ √' + E.v('L') + '</span>';
    }
    if (p.setup === 'leaves') {
      const parts = [];
      parts.push(p.vena ? E.v('C') + E.sub('d') + (p.visc ? '(' + E.v('Re') + ')' : '=0.61') : E.v('C') + E.sub('d') + '=1');
      return E.v('A') + '·' + E.v('dh/dt') + ' ' + E.op('=') + ' ' + E.op('−') + ' ' + parts[0] + '·' + E.v('a') + '·√(2' + E.v('g') + '(' + E.v('h') + (p.tension ? ' ' + E.op('−') + ' ' + E.v('h') + E.sub('σ') : '') + '))' +
        (p.mEvap ? ' ' + E.op('−') + ' ' + E.v('E') + '·' + E.v('A') : '') +
        '<br><span style="font-size:12px;color:var(--text-3)">now: ' + E.v('C') + E.sub('d') + ' = ' + (q.dr.Cd || 0).toFixed(3) + ' · ' + E.v('h') + E.sub('σ') + ' = 2σ/(ρ' + E.v('g') + E.v('d') + ') = ' + (hole(1, V.d, ALL).hs * 1000).toFixed(2) + ' mm · ' + E.v('E') + ' = 2 mm a day</span>';
    }
    const F = fittedNow(S);
    const law = p.fam === 'const' ? E.v('dh/dt') + ' ' + E.op('=') + ' ' + E.op('−') + E.n(F ? F.k * 1000 : 0, 'mm/s') :
      p.fam === 'prop' ? E.v('dh/dt') + ' ' + E.op('=') + ' ' + E.op('−') + E.n(F ? F.k : 0, 'per s') + '·' + E.v('h') :
      E.v('dh/dt') + ' ' + E.op('=') + ' ' + E.op('−') + E.n(F ? 2 * F.k : 0, 'm½/s') + '·√' + E.v('h');
    return law + (p.validate ? ' ' + E.op('+') + ' ' + E.frac(E.v('Q') + E.sub('tap'), E.v('A')) : '') +
      '<br><span style="font-size:12px;color:var(--text-3)">' + (F ? 'fitted to ' + F.n + ' readings; misses them by ' + (F.rms * 1000).toFixed(1) + ' mm' : 'waiting for readings') + '</span>';
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  L.register({
    id: 'g6a-draining-tank',
    grade: 6, unit: '6A', topics: ['A3'],
    subject: 'engineering',
    name: 'The Draining Tank — Building, Testing and Revising a Model',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS SEP · Developing and Using Models', 'NGSS CCC · Systems and System Models', 'CAST'],
    weight: 'Models',
    is3D: true,
    autoplay: true,
    bloom: 0.18,
    stageHint: 'Drag to turn · scroll to zoom · every number is live',
    lede: 'A clear column of water drains through a sharp-edged hole into a tray, watched by an ultrasonic sensor. ' +
      '<b>The apparatus obeys the real physics</b> — Torricelli’s law, the jet narrowing to 61 % of the hole, a ' +
      'coefficient that drifts with speed, surface tension holding the last of the water. <b>Your models are simpler</b>, ' +
      'and they are judged only against what the sensor reads: answer the town’s question before the town can, turn a ' +
      'diagram into an equation, shrink the apparatus and see what does not shrink with it, leave things out on purpose, ' +
      'and fit, test and revise.',

    params: preset({}),
    presets: [
      { name: 'The town’s tower: the pump fails at 18:00', params: preset({}) },
      { name: 'Water saving announced at 21:00', params: preset({ saving: true }) },
      { name: 'Tap and hole together: the level settles', params: preset({ setup: 'diagram', qin: 1.5, h0: 30 }) },
      { name: 'A leak halfway up', params: preset({ setup: 'diagram', tap: false, leak: true, h0: 55 }) },
      { name: 'The 1:4 copy', params: preset({ setup: 'scale', model: 4 }) },
      { name: 'Too small: the 1:10 copy', params: preset({ setup: 'scale', model: 10 }) },
      { name: 'Leave out the vena contracta', params: preset({ setup: 'leaves', vena: false }) },
      { name: 'Fit a straight line and test it', params: preset({ setup: 'revise', fam: 'const' }) },
      { name: 'The square-root law, tested with the tap on', params: preset({ setup: 'revise', fam: 'sqrt', validate: true, qv: 2 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS } ] },
      { group: 'The town', when: is('why'), items: [
        { key: 'pop', label: 'People the tower serves', min: 5000, max: 40000, step: 1000, fmt: v => v.toLocaleString('en'), restructure: true },
        { key: 'saving', type: 'toggle', label: 'Ask everyone to save water from 21:00', restructure: true },
        { key: 'leakModel', type: 'toggle', label: 'Put the leaking mains into the model' } ] },
      { group: 'The column', when: among('diagram', 'leaves', 'revise'), items: [
        { key: 'h0', label: 'Start level', min: 10, max: 58, step: 1, unit: 'cm', fmt: v => v.toFixed(0), restructure: true },
        { key: 'dmm', label: 'Hole diameter', min: 3, max: 10, step: 0.5, unit: 'mm', fmt: v => v.toFixed(1), restructure: true } ] },
      { group: 'The column', when: is('scale'), items: [
        { key: 'dmm', label: 'Hole diameter (full size)', min: 3, max: 10, step: 0.5, unit: 'mm', fmt: v => v.toFixed(1), restructure: true },
        { key: 'model', type: 'select', label: 'The copy', restructure: true, options: [
          { value: 2, label: '1:2' }, { value: 4, label: '1:4' }, { value: 10, label: '1:10' }] } ] },
      { group: 'Valves in the diagram', when: is('diagram'), items: [
        { key: 'tap', type: 'toggle', label: 'Tap open' },
        { key: 'qin', label: 'Tap flow', min: 0.2, max: 3, step: 0.1, unit: 'L/min', fmt: v => v.toFixed(1), when: S => S.p.tap },
        { key: 'drain', type: 'toggle', label: 'Hole at the base open' },
        { key: 'leak', type: 'toggle', label: 'Leak at 30 cm open' },
        { key: 'evap', type: 'toggle', label: 'Surface open to the air' } ] },
      { group: 'What the model includes', when: is('leaves'), items: [
        { key: 'vena', type: 'toggle', label: 'The jet narrows (vena contracta)' },
        { key: 'visc', type: 'toggle', label: 'Viscosity changes Cd', when: S => S.p.vena },
        { key: 'tension', type: 'toggle', label: 'Surface tension' },
        { key: 'mEvap', type: 'toggle', label: 'Evaporation' } ] },
      { group: 'The model to fit', when: is('revise'), items: [
        { key: 'fam', type: 'select', label: 'Model', restructure: false, options: [
          { value: 'const', label: 'Constant outflow' }, { value: 'prop', label: 'Outflow ∝ level' }, { value: 'sqrt', label: 'Outflow ∝ √level' }] },
        { key: 'validate', type: 'toggle', label: 'Test it: run again with the tap on', restructure: true },
        { key: 'qv', label: 'Tap flow for the test', min: 0.5, max: 3, step: 0.1, unit: 'L/min', fmt: v => v.toFixed(1), restructure: true, when: S => S.p.validate } ] },
      { group: 'Display', when: is('revise'), items: [
        { key: 'resid', type: 'toggle', label: 'Show the residuals', display: true, when: S => !S.p.validate } ] }
    ],

    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) {
      if (type !== 'pointerdown') return;
      if (window.KITMS && window.KITMS.chipHit(S, x, y)) return;
      const v = (S._valves || []).find(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
      if (v && S.p.setup === 'diagram') S.p[v.key] = !S.p[v.key];
    },

    plots: [
      { title: S => S.p.setup === 'why' ? 'Water in the tower — the model, and the evening as it happens' : 'The level, read by the sensor' + (S.p.setup === 'revise' ? ' — and the model fitted to it' : S.p.setup === 'leaves' ? ' — and the model' : S.p.setup === 'scale' ? ' — and the copy, its time scaled' : ''),
        draw(S, g) { levelPlot(S, g); } },
      { title: S => ({ why: 'What the town uses, hour by hour', diagram: 'The flows: what comes in, what goes out', scale: 'Half-time against size, measured on every copy', leaves: 'How much each effect changes the drain time', revise: 'Drain time against start height — the slope names the law' })[S.p.setup],
        draw(S, g) { secondPlot(S, g); } }
    ],

    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'CAST pattern · using a model to predict',
        q: 'The pump fails at 18:00 with the tower full, serving 20,000 people. How many hours after that does the model say the taps run dry?',
        params: preset({}),
        predict: { label: 'hours', unit: 'h', tol: 0.12 },
        measure: S => towerModel(S.p).dry,
        working: 'The model is one stock and one flow: 1131 m³ in the tower, and the town taking about 125 m³ an hour on average — more in the ' +
          'evening peak, much less overnight. Stepping it a minute at a time gives the answer in under a millisecond, long before 18:00 turns into ' +
          'midnight. Nobody could have tested it on the real tower without leaving the town dry.' },
      { source: 'NGSS · models as diagrams and equations',
        q: 'The tap pours 1.5 L/min into the column and the 6 mm hole drains it. At what level on the scale does the water settle?',
        params: preset({ setup: 'diagram', qin: 1.5, h0: 30 }),
        predict: { label: 'level', unit: 'cm', tol: 0.15 },
        measure: S => steadyLevel(S.p.dmm, S.p.qin / 60000, ALL) * 100,
        working: 'In the diagram the level stops moving when the arrow in equals the arrows out: 25 mL/s = Cd·a·√(2gh). With Cd = 0.61 and a 6 mm hole ' +
          '(0.283 cm²), the jet must leave at 1.45 m/s, which needs about 11 cm of water over the hole — so the level settles near 12 cm on the scale.' },
      { source: 'NGSS · physical and digital models',
        q: 'The full column’s head falls to half in about 42 s. How long does the 1:4 copy take?',
        params: preset({ setup: 'scale', model: 4 }),
        predict: { label: 'half-time', unit: 's', tol: 0.12 },
        measure: S => halfTime(S.p.dmm, 0.5 / 4, ALL, 4),
        working: 'Not 42 ÷ 4. Water leaves at a speed set by √(depth), and the copy is a quarter as deep, so its jet is half as fast while its ' +
          'column is a quarter as tall: time goes as √(size), and √4 = 2. About 21 s — slightly more, because the tiny hole feels ' +
          'viscosity and surface tension that do not shrink with it.' },
      { source: 'NGSS · what a model leaves out',
        q: 'Leave the vena contracta out of the model (the jet as wide as the hole, Cd = 1). By how many percent does the predicted drain time change?',
        params: preset({ setup: 'leaves', vena: false }),
        predict: { label: 'change', unit: '%', tol: 0.12 },
        measure: S => { const t0 = drainTime(S.p.dmm, S.p.h0 / 100, ALL), t1 = drainTime(S.p.dmm, S.p.h0 / 100, Object.assign({}, ALL, { vena: false })); return (t1 - t0) / t0 * 100; },
        working: 'About −39 %. A real jet narrows to 61 % of the hole just outside it, so only 0.61 as much water gets through as a naive model thinks; ' +
          'leave that out and the model drains the column in 0.61 of the time. Evaporation, by contrast, changes the answer by a thousandth of a percent — ' +
          'leaving it out costs nothing.' },
      { source: 'NGSS · build, test and revise',
        q: 'Fit the square-root model to the run from 50 cm, then open the tap at 2 L/min. At what level on the scale does the column settle?',
        params: preset({ setup: 'revise', fam: 'sqrt', validate: true, qv: 2 }),
        predict: { label: 'level', unit: 'cm', tol: 0.1 },
        measure: S => steadyLevel(S.p.dmm, S.p.qv / 60000, ALL) * 100,
        working: 'The square-root model, fitted with the tap off, already knows how fast the hole drains at every depth; add the tap and it ' +
          'balances where 33 mL/s leaves through the hole — about 20 cm on the scale. The straight-line model cannot balance at all and the ' +
          'proportional one settles in the wrong place: a better fit on the first run did not prove them, the new run did.' }
    ],

    walkthrough: [
      { title: '1 · A question you cannot test',
        ask: 'The tower’s pump fails at 18:00. Could the town find out when the taps run dry by waiting to see?',
        reveal: '<b>Only by leaving 20,000 people without water.</b> The model — one stock, one flow — answers at 18:00 in under a millisecond. ' +
          'Then watch the real evening: the taps run dry more than two hours before the model said. Something is missing from it.', params: preset({}) },
      { title: '2 · What the model left out',
        ask: 'Switch on “put the leaking mains into the model”. Why does the prediction move earlier?',
        reveal: '<b>Pipes leak day and night</b> — about an eighth of what the town uses, and at night that is a large share of the flow. ' +
          'With it added the model and the town agree to within minutes. A model is only as good as the flows it contains.', params: preset({ leakModel: true }) },
      { title: '3 · The diagram is the model',
        ask: 'Close the hole and open only the tap. Predict first: what does the level do, and what does the equation become?',
        reveal: '<b>It rises at a steady rate</b>: one arrow in, none out, so A·dh/dt = Q_tap. Each valve you click changes the apparatus, the ' +
          'diagram and the equation together — three forms of one model.', params: preset({ setup: 'diagram', drain: false, h0: 20 }) },
      { title: '4 · Where in balances out',
        ask: 'Open the hole again with the tap running. Does the level rise forever?',
        reveal: '<b>No — it settles.</b> The deeper the water, the faster the hole drains, until out equals in. A stock with an ' +
          'outflow that grows with it always finds a balance.', params: preset({ setup: 'diagram', qin: 1.5, h0: 30 }) },
      { title: '5 · A copy four times smaller',
        ask: 'The copy is a quarter the size in every length. Will it drain four times faster?',
        reveal: '<b>Twice as fast.</b> Time goes as the square root of size, because the jet’s speed does. Try 1:10: the copy stops with ' +
          '2.5 cm left — surface tension does not shrink with the copy. Physical models must be scaled with care; digital ones need no scaling.', params: preset({ setup: 'scale', model: 4 }) },
      { title: '6 · Leave things out on purpose',
        ask: 'Which matters more for the drain time: evaporation, or the jet narrowing as it leaves?',
        reveal: '<b>The narrowing, by a factor of about ten thousand.</b> Leave out evaporation and the answer moves by a thousandth of a percent; ' +
          'leave out the vena contracta and it is 39 % wrong. A good model keeps what matters for its question.', params: preset({ setup: 'leaves' }) },
      { title: '7 · A straight line almost fits',
        ask: 'Fit “constant outflow” to the draining column. It misses by only a few millimetres — is it a good model?',
        reveal: '<b>No.</b> Look at the residuals: they run in one long arc, which noise never does. The shape is wrong. Revise to ' +
          '“outflow ∝ √level” and they scatter like noise.', params: preset({ setup: 'revise', fam: 'const' }) },
      { title: '8 · Test on data it has never seen',
        ask: 'Open the tap at 2 L/min. Which model predicts where the new run settles?',
        reveal: '<b>Only the square-root model</b>, fitted with the tap off, predicts the level with the tap on. A model earns trust by ' +
          'predicting a run it was not fitted to.', params: preset({ setup: 'revise', fam: 'sqrt', validate: true, qv: 2 }) }
    ],

    quiz: [
      { q: 'Why did the town build a model of its water tower instead of testing it?',
        options: ['Models are always more accurate than tests', 'Testing would leave people without water, and the model answers first', 'The tower is too small to measure', 'Water towers cannot be measured'],
        answer: 1, why: 'Some questions cannot be tested safely or in time. A model answers at 18:00 what the real tower would only show at midnight — and costs nobody their water.' },
      { q: 'In a stock-and-flow diagram of the column, what does an arrow into the stock stand for?',
        options: ['The water in the column', 'A flow that adds water, like the tap', 'The height of the column', 'The time it takes to drain'],
        answer: 1, why: 'The stock is what builds up (the water in the column); each arrow is a flow in or out. The equation has one term per arrow.' },
      { q: 'A copy of the column is 1/4 of the size in every length. Its level falls to half in 21 s. About how long does the full column take?',
        options: ['5 s', '21 s', '42 s', '84 s'],
        answer: 2, why: 'Times scale as the square root of size: √4 = 2, so about 42 s. Multiplying by 4 is the trap.' },
      { q: 'Which effect can you leave out of a model of the draining column without changing the answer?',
        options: ['The jet narrowing (vena contracta)', 'Gravity', 'Evaporation from the surface', 'The size of the hole'],
        answer: 2, why: 'Evaporation moves the drain time by about a thousandth of a percent. The narrowing jet changes it by 39 %.' },
      { q: 'A model fits the data closely but its residuals form one long curve. What should you do?',
        options: ['Keep it: it fits well', 'Revise its shape and test the new model on new data', 'Collect less data', 'Delete the points that do not fit'],
        answer: 1, why: 'Residuals from a right model look like noise. A long curve means the shape is wrong — revise, then test on a run the model was not fitted to.' }
    ],

    notes: '<b>Where this shows up.</b><ul>' +
      '<li>NGSS science and engineering practice <b>Developing and Using Models</b>: develop, use and revise a model to predict and explain.</li>' +
      '<li>NGSS cross-cutting concept <b>Systems and System Models</b>: models are tools with limits — they represent some parts and leave others out.</li>' +
      '<li>CAST items give a graph of data and several candidate models and ask which fits, what the model leaves out, or what a model predicts for a new case.</li></ul>' +
      '<div class="pyq"><em>Misconception to catch</em> “A model has to look like the thing.” The stock-and-flow diagram looks nothing like a column, and ' +
      'predicts it exactly.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “A smaller copy drains in proportion to its size.” It drains in proportion to the square ' +
      'root of its size — and a copy that is too small stops altogether.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “The model that fits best is right.” Only a test on data it has not seen shows that.</div>'
  });

  const EQ_NOTE = {
    why: 'A model of the tower is <b>one stock and one flow</b>: the water in the tank, and what the town draws from it. It is a ' +
      'simplification on purpose — no pipes, no houses, no people — and it still answers the question hours before the tower could.',
    diagram: 'Every arrow in the diagram is a term in the equation, and every term is a valve on the bench. The stock changes by ' +
      '<b>everything in minus everything out</b>; divide by the column’s area to get how fast the level moves.',
    scale: 'A copy keeps the shape but not the physics of every effect. Gravity-driven flow scales with <b>√size</b> (the Froude ' +
      'rule); viscosity and surface tension do not scale at all, which is why a copy that is too small stops working like the original.',
    leaves: 'The apparatus always has all four effects. The model has the ones you leave in. <b>A model is simpler than the thing ' +
      'on purpose</b> — the skill is knowing which simplifications change the answer to your question and which do not.',
    revise: 'Fit a model, then look at what it misses. Residuals that scatter like the sensor’s own noise mean the shape is right; ' +
      'residuals that run in long arcs mean it is wrong. <b>Then test it on a run it has never seen.</b>'
  };

  const MODEL = { cdOf, hole, vessel, advance, drainTime, halfTime, steadyLevel, fit, towerModel, TOWER_V, COL, ALL, BASE: () => BASE };
  L.models = L.models || {};
  L.models['g6a-draining-tank'] = MODEL;
})(window.InsightLab);
