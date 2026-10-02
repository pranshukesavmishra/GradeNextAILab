/* ============================================================
   GRADE 6 · UNIT C · ENERGY, HEAT AND THERMAL SYSTEMS
   6C-4  The Specific Heat Investigation — Planning, Data and Explanation
   (C4.1 Effect of material type; C4.2 Effect of mass; C4.3 Planning a fair
    test; C4.4 Collecting and organizing temperature–time data; C4.5 Analyzing
    and interpreting data; C4.6 Constructing an explanation from evidence)

   The school calorimetry bench, done as a real investigation: a 12 V
   immersion heater on a joulemeter, a sample (water, oil, an aluminium or a
   copper block, dry sand) in an insulated cup or a bare glass beaker, a
   temperature probe on a data logger. Every run is integrated: the heater's
   power into the sample and its container, Newton's-law losses to the room,
   the probe's own lag, the logger's interval, resolution and noise.
     material  — two samples of equal mass on identical heaters.
     mass      — the same material, two masses.
     plan      — a fair test, and every way to spoil one: each confound is
                 computed into the conclusion it would lead to.
     collect   — the logger: interval, resolution, probe; a table of readings.
     analyze   — fit the heating line, correct it with the cooling line:
                 c = (P/(s_heat − s_cool) − C_cup)/m, against the book value.
     explain   — why beach sand burns and the sea does not: trays of sand and
                 water under one heat lamp, and a real beach over a day; a
                 claim to back with evidence and reasoning.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6C, MEAS, BENCH, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6C;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  function gauss(r) { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  /* specific heat capacities, J/kg·K (book values), and densities */
  const MATS = {
    water: { name: 'water', c: 4186, rho: 998, liquid: true, colour: '#7FC0F0' },
    oil: { name: 'sunflower oil', c: 1970, rho: 920, liquid: true, colour: '#E8C450' },
    alu: { name: 'aluminium block', c: 897, rho: 2700, colour: '#C9D0D8' },
    copper: { name: 'copper block', c: 385, rho: 8960, colour: '#D2793F' },
    sand: { name: 'dry sand', c: 830, rho: 1600, colour: '#D8C08A' }
  };
  /* the container: its own heat capacity (J/K) and its leak to the room (W/K) */
  const CONTS = { foam: { name: 'foam cup with a lid (or foam lagging)', C: 8, UA: 0.10 }, glass: { name: 'bare glass beaker (or a bare block)', C: 95, UA: 0.65 } };
  const PROBES = { digital: { name: 'digital probe', tau: 3, res: 0.1, noise: 0.05 }, glass: { name: 'glass thermometer', tau: 8, res: 0.5, noise: 0.15 }, tc: { name: 'thermocouple', tau: 0.3, res: 0.1, noise: 0.08 } };
  const HEATER_C = 6;                                                     // the immersion heater's own heat capacity, J/K

  /* one run: heat for tOn seconds, then off; o = { mat, m, P, tOn, tEnd, cont, T0, Ta, stir, probe, dts, res, seed } */
  function sampleRun(o) {
    const M = MATS[o.mat], Ct = CONTS[o.cont], Pr = PROBES[o.probe || 'digital'], Ta = o.Ta == null ? 20 : o.Ta, r = rng(o.seed || 5);
    const C = o.m * M.c + Ct.C + HEATER_C, dt = 0.25, tEnd = o.tEnd || 600;
    // unstirred liquids layer: the probe sits in water hotter than the mean (warm water rises past it) — a 12 % overshoot of the rise
    const strat = M.liquid && !o.stir ? 1.12 : 1;
    let T = o.T0 == null ? Ta : o.T0, Tp = T, t = 0, E = 0, lost = 0;
    const truth = [], reads = [], res = o.res || Pr.res, dts = o.dts || 10;
    let nextRead = 0;
    while (t <= tEnd + 1e-9) {
      const Tlocal = Ta + (T - Ta) * 1 + (strat - 1) * (T - (o.T0 == null ? Ta : o.T0));
      if (Math.round(t / dt) % 4 === 0) truth.push({ t, T, Tp, E, lost });
      if (t >= nextRead - 1e-9) { const v = Tp + gauss(r) * Pr.noise; reads.push({ t, T: Math.round(v / res) * res }); nextRead += dts; }
      const P = t < o.tOn ? o.P : 0, L = Ct.UA * (T - Ta) * (o.lid === false ? 1.6 : 1);
      T += (P - L) / C * dt; E += P * dt; lost += L * dt;
      Tp += (Tlocal - Tp) * Math.min(1, dt / Pr.tau);
      t += dt;
    }
    return { truth, reads, C, Ccont: Ct.C + HEATER_C };
  }
  /* least-squares slope of readings between t1 and t2 */
  function fit(reads, t1, t2) {
    const pts = reads.filter(q => q.t >= t1 - 1e-9 && q.t <= t2 + 1e-9);
    if (pts.length < 2) return null;
    const n = pts.length, mx = pts.reduce((u, q) => u + q.t, 0) / n, my = pts.reduce((u, q) => u + q.T, 0) / n;
    let sxy = 0, sxx = 0; pts.forEach(q => { sxy += (q.t - mx) * (q.T - my); sxx += (q.t - mx) * (q.t - mx); });
    const b = sxx > 0 ? sxy / sxx : 0;
    return { b, a: my - b * mx, n, Tmean: my };
  }
  /* c from the heating slope alone, and corrected with the cooling slope at the same temperature */
  function analyse(R, o, w) {
    const H = fit(R.reads, w.t1, w.t2);
    if (!H) return null;
    const raw = o.P / (o.m * H.b);
    // the cooling line: the first stretch after switch-off at about the same mean temperature
    const C = fit(R.reads, o.tOn + 30, o.tEnd);
    let corr = null, sc = 0;
    if (C) { sc = C.b * (H.Tmean - 20) / Math.max(0.01, C.Tmean - 20); corr = (o.P / (H.b - sc) - R.Ccont) / o.m; }
    return { H, C, raw, corr, sc };
  }

  /* ============================================================
     PLAN — confounds, computed
     ============================================================ */
  const CONFOUNDS = {
    power: { label: 'B’s heater is 20 % stronger', apply: o => { o.P *= 1.2; } },
    start: { label: 'B starts 10 K warmer', apply: o => { o.T0 = 30; } },
    cont: { label: 'B is in a bare glass beaker', apply: o => { o.cont = 'glass'; } },
    stir: { label: 'B is not stirred', apply: o => { o.stir = false; } },
    mass: { label: 'B has 40 % less mass', apply: o => { o.m *= 0.6; } }
  };

  /* ============================================================
     EXPLAIN — sand and water under a lamp; a beach over a day
     ============================================================ */
  const SAND = { k: 0.30, rho: 1600, c: 830, a: 0.75 }, WATERT = { a: 0.90 };
  function traysRun(o) {
    // o = { I (W/m²), depth (m), tEnd }: a sand column (1D conduction) and a stirred-by-convection water tray, the same area and depth
    const n = 31, dz = o.depth / (n - 1), alpha = SAND.k / (SAND.rho * SAND.c), dt = Math.min(0.5, 0.4 * dz * dz / alpha), h = 12, Ta = 20;
    const Ts = new Float64Array(n).fill(Ta); let Tw = Ta, t = 0, next = 0;
    const rows = [], Cw = 1000 * 4186 * o.depth;                                   // per m² of tray
    while (t <= (o.tEnd || 900) + 1e-9) {
      if (t >= next - 1e-9) { rows.push({ t, sandTop: Ts[0], sand5: Ts[Math.min(n - 1, Math.round(0.005 / dz))], sandBot: Ts[n - 1], water: Tw }); next += 10; }
      const q = o.I * SAND.a - h * (Ts[0] - Ta) - 5.67e-8 * 0.9 * (Math.pow(Ts[0] + 273.15, 4) - Math.pow(Ta + 273.15, 4));
      const T2 = Float64Array.from(Ts);
      for (let i = 0; i < n; i++) {
        const up = i ? Ts[i - 1] : Ts[i], dn = i < n - 1 ? Ts[i + 1] : Ts[i];
        T2[i] = Ts[i] + dt * alpha * (up - 2 * Ts[i] + dn) / (dz * dz);
      }
      T2[0] += q * dt / (SAND.rho * SAND.c * dz / 2);
      Ts.set(T2);
      Tw += (o.I * WATERT.a - h * (Tw - Ta) - 5.67e-8 * 0.96 * (Math.pow(Tw + 273.15, 4) - Math.pow(Ta + 273.15, 4)) - 30 * Math.max(0, Tw - Ta) * 0) / Cw * dt;
      t += dt;
    }
    return { rows };
  }
  function beachDay(o) {
    // o = { S (peak W/m²), mix (m of sea that mixes) }: the day's heating of the sand's top 8 cm (its daily thermal skin) and the sea's mixed layer
    const hours = 72, dt = 60, rows = [], Ta0 = 24;
    const Csand = SAND.rho * SAND.c * 0.08, Csea = 1025 * 3990 * o.mix;
    let Ts = Ta0, Tw = Ta0;
    for (let t = 0; t <= hours * 3600; t += dt) {
      const hr = (t / 3600) % 24, sun = Math.max(0, Math.sin(Math.PI * (hr - 6) / 12)) * o.S, Ta = Ta0 + 3 * Math.sin(Math.PI * (hr - 9) / 12);
      if (t >= 48 * 3600 && t % 600 === 0) rows.push({ h: hr + (t >= 71.99 * 3600 ? 24 : 0), sand: Ts, sea: Tw, air: Ta });
      Ts += (sun * 0.70 - 15 * (Ts - Ta) - 6 * (Ts - Ta)) / Csand * dt;
      Tw += (sun * 0.93 - 15 * (Tw - Ta) - 6 * (Tw - Ta)) / Csea * dt;
    }
    const sand = rows.map(r => r.sand), sea = rows.map(r => r.sea);
    return { rows, sandSwing: Math.max(...sand) - Math.min(...sand), seaSwing: Math.max(...sea) - Math.min(...sea) };
  }

  const MODEL0 = { MATS, CONTS, PROBES, HEATER_C, sampleRun, fit, analyse, CONFOUNDS, traysRun, beachDay, SAND };

  /* ============================================================
     SET-UPS, STATE
     ============================================================ */
  const SETUPS = [
    { value: 'material', label: 'Same mass, same heater, two materials', teaches: ['C4.1'] },
    { value: 'mass', label: 'Same material, two masses', teaches: ['C4.2'] },
    { value: 'plan', label: 'Plan a fair test — and spoil it', teaches: ['C4.3'] },
    { value: 'collect', label: 'Log the data: interval, probe, resolution', teaches: ['C4.4'] },
    { value: 'analyze', label: 'Fit the lines, find c', teaches: ['C4.5'] },
    { value: 'explain', label: 'Why the sand burns and the sea does not', teaches: ['C4.6'] }
  ];
  const BASE = {
    setup: 'material', matA: 'water', matB: 'oil', m: 0.5, mB: 1.0, P: 50, cont: 'foam', tOn: 300,
    cP: false, cS: false, cC: false, cSt: false, cM: false,
    probe: 'digital', dts: 10, res: 0.1, t1: 60, t2: 300,
    I: 600, depth: 0.03, S: 900, mix: 5, claim: 'none'
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const is = (...v) => S => v.indexOf(S.p.setup) >= 0;
  const TWO = { material: 1, mass: 1, plan: 1 };
  const CLAIMS = {
    none: { label: 'Choose a claim…', ok: null },
    absorb: { label: 'Sand absorbs more of the sunlight, so it heats more', ok: false, why: 'Partly backwards: the water absorbs more of the light (93 % against 75 %) and still warms less.' },
    capacity: { label: 'Each kilogram of water needs about five times the energy per kelvin, and the sea spreads its heat through metres of water', ok: true, why: 'Supported: c_water ÷ c_sand ≈ 5; the sand’s heat stays in its top few millimetres while the water mixes.' },
    wet: { label: 'Water stays cool because it is wet', ok: false, why: 'Not supported: “wet” is not a quantity — the evidence is the energy each kelvin costs, and how deep the heat goes.' }
  };

  function optsOf(p, which) {
    const o = { mat: which === 'B' ? p.matB : p.matA, m: which === 'B' && p.setup === 'mass' ? p.mB : p.m, P: p.P, tOn: p.tOn, tEnd: p.tOn + 300, cont: p.cont, stir: true, probe: p.probe, dts: p.dts, res: p.res, seed: which === 'B' ? 7 : 5 };
    if (p.setup === 'mass') o.mat = p.matA;
    if (p.setup === 'plan' && which === 'B') { if (p.cP) CONFOUNDS.power.apply(o); if (p.cS) CONFOUNDS.start.apply(o); if (p.cC) CONFOUNDS.cont.apply(o); if (p.cSt) CONFOUNDS.stir.apply(o); if (p.cM) CONFOUNDS.mass.apply(o); }
    if (p.setup !== 'collect') { o.probe = 'digital'; o.dts = 10; o.res = 0.1; }
    return o;
  }
  function runOf(S, which) {
    const o = optsOf(S.p, which), key = which + JSON.stringify(o);
    S._runs = S._runs || {};
    if (S._runs[which] && S._runs[which].key === key) return S._runs[which];
    const R = sampleRun(o); S._runs[which] = { key, R, o }; return S._runs[which];
  }
  function traysOf(S) { const p = S.p, key = [p.I, p.depth].join('|'); if (S._tr && S._tr.key === key) return S._tr.R; S._tr = { key, R: traysRun({ I: p.I, depth: p.depth, tEnd: 900 }) }; return S._tr.R; }
  function beachOf(S) { const p = S.p, key = [p.S, p.mix].join('|'); if (S._bd && S._bd.key === key) return S._bd.R; S._bd = { key, R: beachDay({ S: p.S, mix: p.mix }) }; return S._bd.R; }
  const tEndOf = p => p.setup === 'explain' ? 900 : p.tOn + 300;
  function setup(S) {
    const p = S.p;
    // the same material (or mass) on both sides is allowed: it is the control run
    p.t2 = Math.min(p.t2, p.tOn); p.t1 = Math.min(p.t1, p.t2 - 30);
    S.ts = 0; S.ta = 0; S._runs = null; S._tr = null; S._bd = null;
    const card = p.setup === 'plan' || p.setup === 'collect' || p.setup === 'analyze' || p.setup === 'explain';
    const H = { theta: -1.40, phi: 0.36, dist: p.setup === 'explain' ? 0.95 : TWO[p.setup] ? 0.85 : 0.66, target: [(p.setup === 'explain' ? 0.04 : 0.08) + (card ? 0.12 : 0), 0.0, p.setup === 'explain' ? 0.10 : 0.08] };
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera({ theta: H.theta, phi: H.phi, dist: H.dist, target: H.target.slice(), fov: 0.72 });
      S.cam.minDist = 0.3; S.cam.maxDist = 4; S.camFor = p.setup; S._nar = null;
    }
  }
  function step(S, dt) { S.ta += dt; S.ts = Math.min(tEndOf(S.p), S.ts + dt * 20); }

  /* ============================================================
     HELPERS
     ============================================================ */
  let NAR = false;
  const co = (F, at, dx, dy, t, c, o) => window.R3.callout(F, at, NAR ? dx * 0.45 : dx, dy, t, c, o);
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const fJ = J => { const a = Math.abs(J); return a >= 1e6 ? (J / 1e6).toFixed(2) + ' MJ' : a >= 1e3 ? (J / 1e3).toFixed(a >= 1e4 ? 1 : 2) + ' kJ' : J.toFixed(0) + ' J'; };
  const fT = s => s >= 120 ? (s / 60).toFixed(1) + ' min' : s.toFixed(0) + ' s';
  const rowAt = (rows, t) => { let lo = 0, hi = rows.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m].t <= t) lo = m; else hi = m; } return rows[lo]; };
  function scene(S, g, x0, x1, y0, y1) {
    const ctx = g.ctx, W = g.w, H = g.h, M = window.MEAS, R3 = window.R3;
    S.cam.setViewport(W, H); S.cam.update();
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9FAAB6'); bg.addColorStop(1, '#CDD4DA');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const F0 = R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
    if (S.cam.eye[1] < y1) M.tileWall(F0, x0 - 0.3, x1 + 0.3, y1 + 0.01, 0, 0.8);
    M.bench(F0, x0, x1, y0, y1, {});
    F0.render();
    return R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
  }
  /* one station: sample, container, heater, probe, joulemeter and logger reading */
  function station(F, S, x, run, label) {
    const A = ART(), R3 = window.R3, M = window.MEAS, BENCH = window.BENCH, o = run.o, Mt = MATS[o.mat], tr = rowAt(run.R.truth, S.ts);
    const rd = run.R.reads.filter(q => q.t <= S.ts + 1e-9).pop() || run.R.reads[0], on = S.ts < o.tOn;
    let top;
    if (Mt.liquid || o.mat === 'sand') {
      const r = 0.042, H = 0.10, V = o.m / Mt.rho, lv = clamp(V / (Math.PI * (r - 0.003) * (r - 0.003)) / H, 0.05, 0.95);
      if (o.cont === 'foam') A.foamCup(F, [x, 0, 0], r, H, lv, o.mat === 'sand' ? '#D8C08A' : Mt.colour, {});
      else M.beaker(F, [x, 0, 0], r, H + 0.02, lv * H, { tint: o.mat === 'sand' ? '#D8C08A' : Mt.colour, T: tr.T });
      top = 0.012 + lv * H * 0.3;
    } else {
      const r = 0.038, H = clamp(o.m / (Mt.rho * Math.PI * r * r), 0.02, 0.16);
      A.shcBlock(F, [x, 0, 0], r, H, Mt.colour, o.cont === 'foam');
      top = H - 0.05;
    }
    const meterAt = [x + 0.075, -0.11, 0.035];
    A.immersionHeater(F, [x - 0.012, 0, Math.max(0.012, top)], 0.13, on, [x - 0.06, -0.09, 0.03], {});
    const pe = A.probe(F, [x + 0.016, 0.004, Math.max(0.015, top + 0.01)], [0.12, 0.05, 1], 0.12, 0.002);
    R3.tube(F, [pe, [pe[0] + 0.03, pe[1] + 0.02, pe[2]], [x + 0.06, 0.06, 0.05], [x + 0.06, 0.06, 0.004]], 0.0018, '#2A2F38', { segments: 5, round: false });
    BENCH.meter(F, meterAt, [0, -1, 0.35], 0.085, 0.045, { title: 'LOGGER ' + label, value: rd.T.toFixed(o.res < 0.5 ? 1 : 1), unit: '°C', colour: '#FFB27A', depth: 0.03 });
    BENCH.meter(F, [x - 0.06, -0.11, 0.03], [0, -1, 0.35], 0.07, 0.035, { title: 'JOULEMETER', value: (tr.E / 1000).toFixed(2), unit: 'kJ', colour: '#7CF0B0', depth: 0.02 });
    co(F, [x, 0, 0.12], label === 'A' ? -50 : -10, label === 'A' ? -42 : -86, label + ': ' + (o.m * 1000).toFixed(0) + ' g ' + Mt.name + ' · ' + o.P.toFixed(0) + ' W', '#E8EEF8');
    return { tr, rd };
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  function drawStage(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, A = ART(), R3 = window.R3;
    NAR = g.w < K.NARROW;
    if (S.cam && S._nar !== NAR) {                                       // a phone: no card beside the bench, so step back and re-centre
      const sh = ['plan', 'collect', 'analyze', 'explain'].indexOf(p.setup) >= 0 ? 0.12 : 0;
      if (S._nar != null || NAR) { S.cam.dist *= NAR ? 1.4 : 1 / 1.4; S.cam.target[0] += NAR ? -sh : sh; }
      S._nar = NAR;
    }
    if (p.setup === 'explain') return drawExplain(S, g);
    const F = scene(S, g, -0.30, 0.45, -0.24, 0.22);
    if (TWO[p.setup]) {
      const a = station(F, S, -0.10, runOf(S, 'A'), 'A'), b = station(F, S, 0.21, runOf(S, 'B'), 'B');
      F.render();
      const dA = a.tr.T - (runOf(S, 'A').o.T0 || 20), dB = b.tr.T - (runOf(S, 'B').o.T0 || 20);
      if (p.setup === 'plan') planCard(S, g);
      const rA = runOf(S, 'A').o, rB = runOf(S, 'B').o;
      K.header(g, p.setup === 'mass' ? 'The same heater, ' + (rA.m * 1000).toFixed(0) + ' g and ' + (rB.m * 1000).toFixed(0) + ' g of ' + MATS[rA.mat].name + ': risen ' + dA.toFixed(1) + ' K and ' + dB.toFixed(1) + ' K'
        : p.setup === 'plan' ? 'Is it a fair test? ' + MATS[rA.mat].name + ' risen ' + dA.toFixed(1) + ' K, ' + MATS[rB.mat].name + ' ' + dB.toFixed(1) + ' K'
          : 'The same energy into ' + (rA.m * 1000).toFixed(0) + ' g each: ' + MATS[rA.mat].name + ' up ' + dA.toFixed(1) + ' K, ' + MATS[rB.mat].name + ' up ' + dB.toFixed(1) + ' K',
        (S.ts < p.tOn ? 'heating: ' : 'heaters off at ' + fT(p.tOn) + ': ') + 't = ' + fT(S.ts) + ' · joulemeters ' + fJ(rowAt(runOf(S, 'A').R.truth, S.ts).E) + ' and ' + fJ(rowAt(runOf(S, 'B').R.truth, S.ts).E),
        'the same energy makes a smaller temperature rise in the material with the larger specific heat capacity');
      return;
    }
    const a = station(F, S, 0.06, runOf(S, 'A'), 'A');
    F.render();
    if (p.setup === 'collect') tableCard(S, g); else fitCard(S, g);
    const R = runOf(S, 'A');
    K.header(g, p.setup === 'collect' ? 'Logging every ' + p.dts + ' s with a ' + PROBES[p.probe].name + ' to ' + p.res + ' K: ' + R.R.reads.filter(q => q.t <= S.ts + 1e-9).length + ' readings so far' : 'Find c for ' + MATS[p.matA].name + ' from the slope of the line',
      'reading ' + a.rd.T.toFixed(1) + ' °C · true ' + a.tr.T.toFixed(2) + ' °C · ' + fJ(a.tr.E) + ' in · ' + fJ(a.tr.lost) + ' lost to the room',
      p.setup === 'collect' ? 'a reading is a sample of a moving temperature: interval, lag and resolution decide what you can see' : 'the heating line overestimates c (heat leaks out while you heat); the cooling line measures the leak');
  }
  function planCard(S, g) {
    const ctx = g.ctx, K = kit(), p = S.p, W = g.w, cw = Math.min(280, W * 0.32), at = K.cardSlot(g, S, 'fair test checklist', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (!at) return;
    const items = [['cP', 'Same heater power'], ['cS', 'Same starting temperature'], ['cC', 'Same container'], ['cSt', 'Both stirred'], ['cM', 'Same mass']];
    const h = 34 + items.length * 18 + 52; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('Controlled variables', at.x + 10, at.y + 8);
    items.forEach(([k, s], i) => { const bad = p[k]; ctx.fillStyle = bad ? '#FF8A80' : '#9FE0A8'; ctx.font = mono(10, 700); ctx.fillText(bad ? '✗' : '✓', at.x + 12, at.y + 30 + i * 18); ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 500); ctx.fillText(s + (bad ? ' — NOT controlled' : ''), at.x + 28, at.y + 30 + i * 18); });
    const ra = appRatio(S), truth = MATS[p.matB].c / MATS[p.matA].c, err = (ra / truth - 1) * 100;
    ctx.font = mono(9.5, 600); ctx.fillStyle = Math.abs(err) > 5 ? '#FFB0A8' : '#9FE0A8';
    const y0 = at.y + 34 + items.length * 18;
    ctx.fillText('c_B ÷ c_A from the rises: ' + ra.toFixed(2), at.x + 10, y0 + 4);
    ctx.fillStyle = g.theme['text-2']; ctx.fillText('true ' + truth.toFixed(2) + ' · ' + (err >= 0 ? '+' : '') + err.toFixed(0) + ' % off', at.x + 10, y0 + 20);
    ctx.restore();
  }
  /* the conclusion a student would draw: c_B/c_A = (rise_A/rise_B)·(m_A/m_B) assuming equal energy — taken at switch-off */
  function appRatio(S) {
    const a = runOf(S, 'A'), b = runOf(S, 'B'), p = S.p;
    const rise = r => { const e = r.R.reads.filter(q => q.t <= p.tOn + 1e-9).pop(); return e.T - r.R.reads[0].T; };
    return (rise(a) / rise(b)) * (p.m / p.m);
  }
  function tableCard(S, g) {
    const ctx = g.ctx, K = kit(), W = g.w, cw = Math.min(220, W * 0.26), at = K.cardSlot(g, S, 'the data table', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (!at) return;
    const R = runOf(S, 'A').R, rows = R.reads.filter(q => q.t <= S.ts + 1e-9).slice(-12), h = 38 + 12 * 15 + 8;
    K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('time (s)      temperature (°C)', at.x + 10, at.y + 8);
    ctx.strokeStyle = 'rgba(160,176,206,.35)'; ctx.beginPath(); ctx.moveTo(at.x + 8, at.y + 26); ctx.lineTo(at.x + at.w - 8, at.y + 26); ctx.stroke();
    ctx.font = mono(10, 500);
    rows.forEach((q, i) => { ctx.fillStyle = i === rows.length - 1 ? '#FFE9A8' : g.theme.text; ctx.fillText(q.t.toFixed(0).padStart(5, ' '), at.x + 12, at.y + 32 + i * 15); ctx.fillText(q.T.toFixed(S.p.res < 0.5 ? 1 : 1).padStart(8, ' '), at.x + 100, at.y + 32 + i * 15); });
    ctx.restore();
  }
  function fitCard(S, g) {
    const ctx = g.ctx, K = kit(), W = g.w, p = S.p, cw = Math.min(270, W * 0.31), at = K.cardSlot(g, S, 'the analysis', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (!at) return;
    const r = runOf(S, 'A'), An = analyse(r.R, r.o, { t1: p.t1, t2: p.t2 }), h = 128;
    K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('c = P ÷ (m × slope)', at.x + 10, at.y + 8);
    if (An) {
      const book = MATS[p.matA].c, lines = [['heating slope', (An.H.b * 60).toFixed(3) + ' K/min', g.theme.text], ['c from heating alone', An.raw.toFixed(0) + ' J/kg·K (' + ((An.raw / book - 1) * 100).toFixed(0) + ' %)', '#FFB0A8'],
        ['cooling slope', An.C ? (An.sc * 60).toFixed(3) + ' K/min' : '—', g.theme.text], ['corrected for the leak', An.corr ? An.corr.toFixed(0) + ' J/kg·K (' + ((An.corr / book - 1) * 100).toFixed(1) + ' %)' : '—', '#9FE0A8'], ['book value', book + ' J/kg·K', g.theme['text-2']]];
      ctx.font = mono(9.5, 500);
      lines.forEach((l, i) => { ctx.fillStyle = g.theme['text-2']; ctx.fillText(l[0], at.x + 10, at.y + 28 + i * 19); ctx.fillStyle = l[2]; ctx.textAlign = 'right'; ctx.fillText(l[1], at.x + at.w - 10, at.y + 28 + i * 19); ctx.textAlign = 'left'; });
    }
    ctx.restore();
  }
  function drawExplain(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, A = ART(), R3 = window.R3, BENCH = window.BENCH;
    const T = traysOf(S), r = rowAt(T.rows, S.ts);
    const F = scene(S, g, -0.35, 0.45, -0.24, 0.24);
    A.tray(F, [-0.10, 0.02, 0], 0.16, 0.12, p.depth, 'sand', r.sandTop, {});
    A.tray(F, [0.14, 0.02, 0], 0.16, 0.12, p.depth, 'water', r.water, {});
    A.floodlight(F, [0.02, 0.18, 0.42], [0, -0.55, -1], clamp(p.I / 1000, 0.1, 1), { to: [0.02, 0.02, p.depth], spread: 0.22 });
    A.probe(F, [-0.10, 0.0, p.depth - 0.005], [0.1, -0.3, 1], 0.10, 0.0015);
    A.probe(F, [0.14, 0.0, p.depth - 0.005], [0.1, -0.3, 1], 0.10, 0.0015);
    BENCH.meter(F, [-0.10, -0.15, 0.035], [0, -1, 0.35], 0.09, 0.045, { title: 'SAND', value: r.sand5.toFixed(1), unit: '°C', colour: '#FFB27A', depth: 0.03 });
    BENCH.meter(F, [0.14, -0.15, 0.035], [0, -1, 0.35], 0.09, 0.045, { title: 'WATER', value: r.water.toFixed(1), unit: '°C', colour: '#7CC8FF', depth: 0.03 });
    F.render();
    // the claim–evidence–reasoning card
    const cw = Math.min(300, W * 0.34), at = K.cardSlot(g, S, 'claim, evidence, reasoning', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) {
      const B = beachOf(S), C = CLAIMS[p.claim], h = 168; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('Your claim', at.x + 10, at.y + 8);
      ctx.font = mono(9.5, 500); ctx.fillStyle = g.theme.text; K.wrapText(ctx, C.label, at.x + 10, at.y + 24, at.w - 20, 12, 3);
      ctx.fillStyle = g.theme.accent; ctx.font = mono(10, 600); ctx.fillText('Evidence', at.x + 10, at.y + 66);
      ctx.fillStyle = g.theme['text-2']; ctx.font = mono(9, 500);
      ctx.fillText('tray: sand +' + (r.sand5 - 20).toFixed(1) + ' K, water +' + (r.water - 20).toFixed(1) + ' K', at.x + 10, at.y + 82);
      ctx.fillText('beach: sand swings ' + B.sandSwing.toFixed(0) + ' K a day, sea ' + B.seaSwing.toFixed(1) + ' K', at.x + 10, at.y + 96);
      ctx.fillText('c: water 4186, sand 830 J/kg·K', at.x + 10, at.y + 110);
      if (C.ok != null) { ctx.fillStyle = C.ok ? '#9FE0A8' : '#FFB0A8'; ctx.font = mono(9.5, 600); K.wrapText(ctx, (C.ok ? '✓ ' : '✗ ') + C.why, at.x + 10, at.y + 128, at.w - 20, 12, 3); }
      ctx.restore();
    }
    K.header(g, 'Under one lamp for ' + fT(S.ts) + ': the sand 5 mm down is ' + r.sand5.toFixed(1) + ' °C, the water ' + r.water.toFixed(1) + ' °C',
      'sand surface ' + r.sandTop.toFixed(1) + ' °C, its bottom ' + r.sandBot.toFixed(1) + ' °C — the heat stays near the top · lamp ' + p.I + ' W/m² · trays ' + (p.depth * 100).toFixed(1) + ' cm deep',
      'water needs five times the energy per kilogram per kelvin, and convection spreads it through the whole tray');
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  const COLS = { water: '#5FA8E8', oil: '#E8C450', alu: '#C9D0D8', copper: '#D2793F', sand: '#D8B06A' };
  function plot1(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'explain') {
      const R = traysOf(S), Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'sand surface' }, { c: '#D8B06A', label: 'sand 5 mm down' }, { c: '#8E7A50', label: 'sand bottom' }, { c: '#5FA8E8', label: 'water' }]);
      const ymax = Math.max(...R.rows.map(r => r.sandTop)) + 2;
      const P = g.Plot({ xmin: 0, xmax: 15, ymin: 18, ymax, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(R.rows.map(r => [r.t / 60, r.sandTop]), '#FF8A5A', 2); P.line(R.rows.map(r => [r.t / 60, r.sand5]), '#D8B06A', 2); P.line(R.rows.map(r => [r.t / 60, r.sandBot]), '#8E7A50', 2); P.line(R.rows.map(r => [r.t / 60, r.water]), '#5FA8E8', 2); P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]); });
      Kk.draw(P); return;
    }
    const runs = TWO[p.setup] ? ['A', 'B'] : ['A'], cs = runs.map(w => { const r = runOf(S, w); return p.setup === 'mass' ? (w === 'A' ? '#5FA8E8' : '#2C6FB0') : COLS[r.o.mat]; });
    const Kk = K.plotKey(g, runs.map((w, i) => ({ c: cs[i], label: w + ': ' + (runOf(S, w).o.m * 1000).toFixed(0) + ' g ' + MATS[runOf(S, w).o.mat].name })).concat([{ c: '#E8EEF8', label: 'logger readings', dot: true }]));
    const tEnd = p.tOn + 300, ymax = Math.max(...runs.map(w => Math.max(...runOf(S, w).R.truth.map(q => q.T)))) + 2;
    const P = g.Plot({ xmin: 0, xmax: tEnd / 60, ymin: 18, ymax, pad: { t: Kk.t }, xlabel: 't (min)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => {
      P.area([[0, ymax], [p.tOn / 60, ymax]], 18, g.alpha('#FF8A5A', 0.06));
      runs.forEach((w, i) => { const R = runOf(S, w).R; P.line(R.truth.map(q => [q.t / 60, q.T]), g.alpha(cs[i], 0.55), 1.5); R.reads.filter(q => q.t <= S.ts + 1e-9).forEach(q => P.dot(q.t / 60, q.T, 2.6, cs[i])); });
      if (p.setup === 'analyze') { const r = runOf(S, 'A'), An = analyse(r.R, r.o, { t1: p.t1, t2: p.t2 }); if (An) { P.line([[p.t1 / 60, An.H.a + An.H.b * p.t1], [p.t2 / 60, An.H.a + An.H.b * p.t2]], '#FFD36B', 2.4); if (An.C) P.line([[(p.tOn + 30) / 60, An.C.a + An.C.b * (p.tOn + 30)], [tEnd / 60, An.C.a + An.C.b * tEnd]], '#9FE0A8', 2.4); P.vline(p.t1 / 60, '#FFD36B', [3, 3]); P.vline(p.t2 / 60, '#FFD36B', [3, 3]); } }
      P.vline(S.ts / 60, g.alpha(T['text-2'], 0.6), [2, 3]);
    });
    P.tag(p.tOn / 120, ymax - 1, 'heater on', T['text-3'], 'center');
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'explain') {
      const B = beachOf(S), Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'beach sand (top 8 cm)' }, { c: '#5FA8E8', label: 'sea (' + p.mix + ' m mixed)' }, { c: '#E8EEF8', label: 'air', dash: [4, 3] }]);
      const ymax = Math.max(...B.rows.map(r => r.sand)) + 3, ymin = Math.min(...B.rows.map(r => Math.min(r.sand, r.air))) - 2;
      const P = g.Plot({ xmin: 0, xmax: 24, ymin, ymax, pad: { t: Kk.t }, xlabel: 'hour of the day', ylabel: '°C', xticks: [0, 6, 12, 18, 24], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const rr = B.rows.filter(r => r.h <= 24.001);
      P.clip(() => { P.line(rr.map(r => [r.h, r.air]), '#E8EEF8', 1.4, [4, 3]); P.line(rr.map(r => [r.h, r.sand]), '#FF8A5A', 2.2); P.line(rr.map(r => [r.h, r.sea]), '#5FA8E8', 2.2); });
      Kk.draw(P); return;
    }
    if (p.setup === 'mass') {
      const mat = p.matA, pts = []; for (let m = 0.1; m <= 2.001; m += 0.05) pts.push([m, p.P * p.tOn / (m * MATS[mat].c + CONTS[p.cont].C + HEATER_C)]);
      const Kk = K.plotKey(g, [{ c: '#5FA8E8', label: 'rise with no losses: E ÷ (mc + C_cup)' }, { c: '#FFD36B', label: 'your two samples', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 2, ymin: 0, ymax: Math.min(80, pts[0][1] * 1.1), pad: { t: Kk.t }, xlabel: 'mass (kg)', ylabel: 'temperature rise at switch-off (K)', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#5FA8E8', 2); ['A', 'B'].forEach(w => { const r = runOf(S, w), e = r.R.truth.find(q => q.t >= p.tOn - 1e-9); P.dot(r.o.m, e.T - 20, 5, '#FFD36B', '#05080F'); }); });
      P.tag(1.0, pts[0][1] * 0.6, 'twice the mass, half the rise', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'plan') {
      const ks = Object.keys(CONFOUNDS), truth = MATS[p.matB].c / MATS[p.matA].c;
      const one = k => { const q = Object.assign({}, p, { cP: false, cS: false, cC: false, cSt: false, cM: false }); q[{ power: 'cP', start: 'cS', cont: 'cC', stir: 'cSt', mass: 'cM' }[k]] = true; const SS = { p: q }; return appRatio(SS); };
      const vals = ks.map(one), ymax = Math.max(truth * 1.6, ...vals) * 1.1;
      const P = g.Plot({ xmin: -0.5, xmax: ks.length + 0.5, ymin: 0, ymax, pad: { t: 14 }, xlabel: 'one variable left uncontrolled', ylabel: 'c_B ÷ c_A you would conclude', xticks: ks.map((_, i) => i).concat([ks.length]), xfmt: v => (['power', 'start T', 'container', 'stirring', 'mass', 'yours'][Math.round(v)] || ''), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.hline(truth, '#9FE0A8', [4, 3]); vals.forEach((v, i) => P.area([[i - 0.3, v], [i + 0.3, v]], 0, g.alpha('#FF8A5A', 0.7))); P.area([[ks.length - 0.3, appRatio(S)], [ks.length + 0.3, appRatio(S)]], 0, g.alpha('#FFD36B', 0.85)); });
      P.tag(ks.length + 0.4, truth + ymax * 0.03, 'truth ' + truth.toFixed(2), '#9FE0A8', 'right');
      return;
    }
    if (p.setup === 'collect') {
      const ks = Object.keys(PROBES), cols = ['#FFB27A', '#D8302A', '#FFD36B'];
      const Kk = K.plotKey(g, ks.map((k, i) => ({ c: cols[i], label: PROBES[k].name })).concat([{ c: '#E8EEF8', label: 'the sample, really', dash: [4, 3] }]));
      const key = [p.matA, p.m, p.P, p.tOn, p.cont, p.dts].join('|');
      if (!S._pr || S._pr.key !== key) S._pr = { key, R: ks.map(k => sampleRun(Object.assign({}, runOf(S, 'A').o, { probe: k, res: PROBES[k].res, dts: p.dts }))) };
      const R0 = S._pr.R[0], t0 = Math.max(0, p.tOn - 60), t1 = p.tOn + 90, sl = R0.truth.filter(q => q.t >= t0 && q.t <= t1);
      const lo = Math.min(...sl.map(q => q.T)) - 1, hi = Math.max(...sl.map(q => q.T)) + 1;
      const P = g.Plot({ xmin: t0, xmax: t1, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 't (s) — around switch-off', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line(sl.map(q => [q.t, q.T]), '#E8EEF8', 1.4, [4, 3]); S._pr.R.forEach((R, i) => P.line(R.reads.filter(q => q.t >= t0 && q.t <= t1).map(q => [q.t, q.T]), cols[i], 1.8)); });
      Kk.draw(P); return;
    }
    // material and analyze: every material, c from heating alone and corrected, against the book
    const ks = Object.keys(MATS), key = [p.m, p.P, p.tOn, p.cont, p.t1, p.t2].join('|');
    if (!S._all || S._all.key !== key) S._all = { key, A: ks.map(k => { const o = { mat: k, m: p.m, P: p.P, tOn: p.tOn, tEnd: p.tOn + 300, cont: p.cont, stir: true, probe: 'digital', dts: 10, res: 0.1, seed: 5 }; return analyse(sampleRun(o), o, { t1: p.t1, t2: Math.min(p.t2, p.tOn) }); }) };
    const Kk = K.plotKey(g, [{ c: '#FFB0A8', label: 'from the heating line alone', dot: true }, { c: '#9FE0A8', label: 'corrected with the cooling line', dot: true }, { c: '#E8EEF8', label: 'equal to the book', dash: [4, 3] }]);
    const P = g.Plot({ xmin: 0, xmax: 4800, ymin: 0, ymax: Math.max(5000, ...S._all.A.map(a => a ? a.raw : 0)) * 1.05, pad: { t: Kk.t }, xlabel: 'book value of c (J/kg·K)', ylabel: 'measured c (J/kg·K)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line([[0, 0], [4800, 4800]], '#E8EEF8', 1.2, [4, 3]); S._all.A.forEach((a, i) => { if (!a) return; const c = MATS[ks[i]].c, hl = ks[i] === p.matA || (p.setup === 'material' && ks[i] === p.matB); P.dot(c, a.raw, hl ? 6 : 4, '#FFB0A8', hl ? '#05080F' : null); if (a.corr) P.dot(c, a.corr, hl ? 6 : 4, '#9FE0A8', hl ? '#05080F' : null); }); });
    ks.forEach(k => P.tag(MATS[k].c + 60, MATS[k].c - 260, k === 'alu' ? 'Al' : k === 'copper' ? 'Cu' : k, T['text-2'], 'left'));
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'explain') {
      const r = rowAt(traysOf(S).rows, S.ts), B = beachOf(S);
      return [{ label: 'Sand, 5 mm down', value: r.sand5.toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Sand surface', value: r.sandTop.toFixed(1), unit: '°C' }, { label: 'Water', value: r.water.toFixed(2), unit: '°C' },
        { label: 'c water ÷ c sand', value: (4186 / 830).toFixed(2), unit: '×' }, { label: 'Beach sand daily swing', value: B.sandSwing.toFixed(1), unit: 'K', flag: 'warn' }, { label: 'Sea daily swing', value: B.seaSwing.toFixed(2), unit: 'K', flag: 'ok' },
        { label: 'Claim', value: CLAIMS[p.claim].ok == null ? '—' : CLAIMS[p.claim].ok ? 'supported' : 'not supported', flag: CLAIMS[p.claim].ok == null ? '' : CLAIMS[p.claim].ok ? 'ok' : 'crit' }];
    }
    const A = runOf(S, 'A'), ra = rowAt(A.R.truth, S.ts), out = [{ label: 'Time', value: fT(S.ts), flag: 'accent', hint: S.ts < p.tOn ? 'heater on' : 'heater off' }, { label: 'Energy in, A', value: fJ(ra.E) }];
    if (TWO[p.setup]) {
      const B = runOf(S, 'B'), rb = rowAt(B.R.truth, S.ts);
      out.push({ label: 'A: ' + MATS[A.o.mat].name, value: ra.T.toFixed(2), unit: '°C' }, { label: 'B: ' + MATS[B.o.mat].name, value: rb.T.toFixed(2), unit: '°C' },
        { label: 'Rise A ÷ rise B', value: ((ra.T - (A.o.T0 || 20)) / Math.max(1e-6, rb.T - (B.o.T0 || 20))).toFixed(2), hint: p.setup === 'mass' ? 'mass ratio ' + (B.o.m / A.o.m).toFixed(2) : 'c ratio ' + (MATS[B.o.mat].c / MATS[A.o.mat].c).toFixed(2) },
        { label: 'c book: A · B', value: MATS[A.o.mat].c + ' · ' + MATS[B.o.mat].c, unit: 'J/kg·K' });
      if (p.setup === 'plan') out.push({ label: 'Conclusion c_B/c_A', value: appRatio(S).toFixed(2), flag: Math.abs(appRatio(S) / (MATS[p.matB].c / MATS[p.matA].c) - 1) > 0.05 ? 'crit' : 'ok' });
      return out;
    }
    const rd = A.R.reads.filter(q => q.t <= S.ts + 1e-9).pop(), An = analyse(A.R, A.o, { t1: p.t1, t2: p.t2 });
    out.push({ label: 'Logger reads', value: rd.T.toFixed(1), unit: '°C' }, { label: 'Really', value: ra.T.toFixed(2), unit: '°C', hint: 'error ' + (rd.T - ra.T).toFixed(2) + ' K' }, { label: 'Readings so far', value: String(A.R.reads.filter(q => q.t <= S.ts + 1e-9).length) });
    if (An) out.push({ label: 'c heating alone P/(m·s)', value: An.raw.toFixed(0), unit: 'J/kg·K', flag: 'warn' }, { label: 'c corrected', value: An.corr ? An.corr.toFixed(0) : '—', unit: 'J/kg·K', flag: 'ok', hint: 'book ' + MATS[p.matA].c });
    return out;
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'explain') return E.v('Q') + ' ' + E.op('=') + ' ' + E.v('mc') + 'Δ' + E.v('T') + '  →  Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.frac(E.v('Q'), E.v('mc') + ':') + ' the same ' + E.v('Q') + ' on a kilogram gives sand ' + E.n((4186 / 830).toFixed(1)) + '× the rise of water';
    const A = runOf(S, 'A'), An = analyse(A.R, A.o, { t1: p.t1, t2: Math.min(p.t2, p.tOn) });
    if (!An) return '';
    return E.v('c') + ' ' + E.op('=') + ' ' + E.frac(E.v('P'), E.v('m') + '·' + E.v('s')) + ' ' + E.op('=') + ' ' + E.frac(E.n(A.o.P, 'W'), E.n(A.o.m, 'kg') + ' × ' + E.n((An.H.b).toFixed(5), 'K/s')) + ' ' + E.op('=') + ' ' + E.n(An.raw.toFixed(0), 'J/kg·K') + (An.corr ? ';  corrected ' + E.v('c') + ' ' + E.op('=') + ' ' + E.frac('[' + E.v('P') + '/(' + E.v('s') + E.sub('heat') + ' − ' + E.v('s') + E.sub('cool') + ') − ' + E.v('C') + E.sub('cup') + ']', E.v('m')) + ' ' + E.op('=') + ' ' + E.n(An.corr.toFixed(0), 'J/kg·K') : '');
  }
  const EQ_NOTE = {
    material: 'With the same energy and the same mass, the temperature rise is inversely proportional to c: oil’s c is less than half water’s, so it rises more than twice as far. The cup and heater soak up a little energy too, so a heavy-c sample is slightly favoured — a small systematic error.',
    mass: 'Q = mcΔT: for the same Q and the same material, doubling m halves ΔT. The line is not quite 1/m because the cup and heater (14 J/K) are heated whatever the mass.',
    plan: 'A fair test changes one variable (the material) and keeps every other one the same. Each confound on its own pushes the conclusion one way: a stronger heater or a smaller mass makes B look like it has a lower c; a leaky container hides some of the rise.',
    collect: 'Every reading is a sample: a long interval misses the shape near switch-off; a glass thermometer lags 8 s behind and reads to half a degree; a thermocouple follows almost instantly. The table is the data; the plot is the same data, organized.',
    analyze: 'The heating line’s slope is the energy rate divided by everything being heated, minus the leak. Measuring how fast it cools at the same temperature tells you the leak, and subtracting the cup’s heat capacity leaves the sample’s own c — within about a percent of the book.',
    explain: 'A claim is only as strong as the evidence and the reasoning that connect it. Here the evidence is two temperature records under one lamp and the c values; the reasoning is Q = mcΔT plus where the heat can go (the sand’s top millimetres; the whole of a mixed tray of water).'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const matOpts = keys => keys.map(k => ({ value: k, label: MATS[k].name[0].toUpperCase() + MATS[k].name.slice(1) + ' (c ' + MATS[k].c + ')' }));
  L.register({
    id: 'g6c-specific-heat',
    grade: 6, unit: '6C', topics: ['C4'],
    subject: 'physics',
    chapter: 'Energy, Heat and Thermal Systems',
    name: 'The Specific Heat Investigation — Planning, Data and Explanation',
    exams: ['NGSS MS-PS3-4', 'NGSS SEP 3 · planning investigations', 'NGSS SEP 4 · analysing data', 'CAST'],
    weight: 'Investigation',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the bench · scroll to zoom · every reading is a sample of a computed temperature',
    lede: 'A real calorimetry investigation from start to finish. Two identical <b>immersion heaters on joulemeters</b>, samples of water, oil, aluminium, copper and sand, a <b>data logger</b> with its interval, resolution and probe lag. Compare materials and masses; plan a <b>fair test</b> and watch each uncontrolled variable bend the conclusion; ' +
      'fit the heating line and correct it with the cooling line to recover the book value of <b>c</b>; then explain, with evidence, why beach sand burns your feet while the sea stays cool.',
    params: preset({}),
    presets: [
      { name: 'Water against sunflower oil', params: preset({}) },
      { name: 'Aluminium against copper blocks', params: preset({ matA: 'alu', matB: 'copper', m: 1.0 }) },
      { name: 'Water against dry sand', params: preset({ matB: 'sand' }) },
      { name: '0.5 kg and 1 kg of water', params: preset({ setup: 'mass' }) },
      { name: 'A fair test', params: preset({ setup: 'plan' }) },
      { name: 'B has a stronger heater', params: preset({ setup: 'plan', cP: true }) },
      { name: 'B is in a bare beaker and unstirred', params: preset({ setup: 'plan', cC: true, cSt: true }) },
      { name: 'Logging every second with a thermocouple', params: preset({ setup: 'collect', probe: 'tc', dts: 1 }) },
      { name: 'A glass thermometer read every minute', params: preset({ setup: 'collect', probe: 'glass', dts: 60, res: 0.5 }) },
      { name: 'Find c for water', params: preset({ setup: 'analyze' }) },
      { name: 'Find c for copper in a bare block', params: preset({ setup: 'analyze', matA: 'copper', cont: 'glass', m: 1.0 }) },
      { name: 'Sand and water under the lamp', params: preset({ setup: 'explain', claim: 'capacity' }) },
      { name: 'A weak claim', params: preset({ setup: 'explain', claim: 'absorb' }) }
    ],
    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS }] },
      { group: 'The samples', when: is('material', 'mass', 'plan', 'collect', 'analyze'), items: [
        { key: 'matA', type: 'select', label: 'Sample A', restructure: true, options: matOpts(Object.keys(MATS)) },
        { key: 'matB', type: 'select', label: 'Sample B', restructure: true, when: is('material', 'plan'), options: matOpts(Object.keys(MATS)) },
        { key: 'm', label: 'Mass of each', min: 0.1, max: 2, step: 0.05, unit: 'kg', fmt: v => (v * 1000).toFixed(0) + ' g', restructure: true },
        { key: 'mB', label: 'Mass of B', min: 0.1, max: 2, step: 0.05, unit: 'kg', fmt: v => (v * 1000).toFixed(0) + ' g', restructure: true, when: is('mass') },
        { key: 'cont', type: 'select', label: 'Held in', restructure: true, options: Object.keys(CONTS).map(k => ({ value: k, label: CONTS[k].name[0].toUpperCase() + CONTS[k].name.slice(1) })) }] },
      { group: 'The heater', when: is('material', 'mass', 'plan', 'collect', 'analyze'), items: [
        { key: 'P', label: 'Heater power (V × I)', min: 10, max: 60, step: 1, unit: 'W', fmt: v => v.toFixed(0), restructure: true },
        { key: 'tOn', label: 'Heat for', min: 120, max: 600, step: 30, unit: 's', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'What B does differently', when: is('plan'), items: [
        { key: 'cP', type: 'toggle', label: 'A 20 % stronger heater', restructure: true },
        { key: 'cS', type: 'toggle', label: 'Starts 10 K warmer', restructure: true },
        { key: 'cC', type: 'toggle', label: 'A bare glass beaker', restructure: true },
        { key: 'cSt', type: 'toggle', label: 'Not stirred', restructure: true },
        { key: 'cM', type: 'toggle', label: '40 % less mass', restructure: true }] },
      { group: 'The data logger', when: is('collect'), items: [
        { key: 'probe', type: 'select', label: 'Probe', restructure: true, options: Object.keys(PROBES).map(k => ({ value: k, label: PROBES[k].name[0].toUpperCase() + PROBES[k].name.slice(1) + ' (lag ' + PROBES[k].tau + ' s)' })) },
        { key: 'dts', label: 'Reading every', min: 1, max: 60, step: 1, unit: 's', fmt: v => v.toFixed(0), restructure: true },
        { key: 'res', type: 'select', label: 'Resolution', restructure: true, options: [{ value: 0.1, label: '0.1 K' }, { value: 0.5, label: '0.5 K' }, { value: 1, label: '1 K' }] }] },
      { group: 'The fit', when: is('analyze'), items: [
        { key: 't1', label: 'Fit the heating line from', min: 0, max: 540, step: 10, unit: 's', fmt: v => v.toFixed(0), restructure: true },
        { key: 't2', label: 'to', min: 30, max: 600, step: 10, unit: 's', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'Lamp and trays', when: is('explain'), items: [
        { key: 'I', label: 'Lamp on the trays', min: 200, max: 1000, step: 10, unit: 'W/m²', fmt: v => v.toFixed(0), restructure: true },
        { key: 'depth', label: 'Tray depth', min: 0.01, max: 0.06, step: 0.005, unit: 'm', fmt: v => (v * 100).toFixed(1) + ' cm', restructure: true }] },
      { group: 'A real beach', when: is('explain'), items: [
        { key: 'S', label: 'Midday sunshine', min: 300, max: 1100, step: 10, unit: 'W/m²', fmt: v => v.toFixed(0), restructure: true },
        { key: 'mix', label: 'Sea mixed by waves to', min: 0.5, max: 30, step: 0.5, unit: 'm', fmt: v => v.toFixed(1), restructure: true }] },
      { group: 'Your explanation', when: is('explain'), items: [
        { key: 'claim', type: 'select', label: 'Claim', restructure: false, options: Object.keys(CLAIMS).map(k => ({ value: k, label: CLAIMS[k].label })) }] }
    ],
    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    plots: [
      { title: S => ({ material: 'Temperature against time, both samples', mass: 'Temperature against time, both masses', plan: 'Temperature against time: is it fair?', collect: 'The readings, and the truth behind them', analyze: 'The data, the heating line and the cooling line', explain: 'Sand and water under the lamp' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ material: 'Every material: measured c against the book', mass: 'Rise against mass', plan: 'What each uncontrolled variable does to the conclusion', collect: 'The same run, three probes', analyze: 'Every material: measured c against the book', explain: 'A real beach: sand and sea over a day' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],
    problems: [
      { source: 'NGSS MS-PS3-4 · CAST pattern: predicting from c',
        q: 'A 50 W heater runs for 300 s in 500 g of water in a foam cup (cup and heater: 14 J/K). Ignoring the small leak, how much does the water warm?',
        params: preset({}),
        predict: { label: 'rise', unit: 'K', tol: 0.03 },
        measure: S => rowAt(runOf(S, 'A').R.truth, S.p.tOn).T - 20,
        working: 'E = Pt = 50 × 300 = 15 000 J; the water, cup and heater take 0.5 × 4186 + 14 = 2107 J per kelvin: ΔT = 15 000 ÷ 2107 = 7.1 K, and the leak trims it to <b>7.07 K</b>.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: comparing materials',
        q: 'The same heater and time on 500 g of sunflower oil (c = 1970 J/kg·K). How much does it warm?',
        params: preset({}),
        predict: { label: 'rise', unit: 'K', tol: 0.03 },
        measure: S => rowAt(runOf(S, 'B').R.truth, S.p.tOn).T - 20,
        working: '15 000 ÷ (0.5 × 1970 + 14) = 15.0 K before the leak; the hotter oil leaks a little more: <b>14.8 K</b> — about twice the water’s rise, because its c is less than half.' },
      { source: 'NGSS SEP 3 · CAST pattern: evaluating an investigation',
        q: 'In the fair test of water (A) against oil (B), B’s heater is 20 % stronger. What c_oil ÷ c_water would the student conclude from the two rises? (The truth is 0.47.)',
        params: preset({ setup: 'plan', cP: true }),
        predict: { label: 'concluded ratio', unit: '', tol: 0.04 },
        measure: S => appRatio(S),
        working: 'B gets 1.2 times the energy, so its rise is 1.2 times larger and its c looks 1.2 times smaller: 0.47 ÷ 1.2 ≈ <b>0.39</b>. An uncontrolled variable changed the answer by 17 %.' },
      { source: 'NGSS SEP 4 · CAST pattern: analysing data',
        q: 'Fit the heating line of 500 g of water between 60 s and 300 s and correct it with the cooling line. What c do you get? (Book: 4186 J/kg·K.)',
        params: preset({ setup: 'analyze' }),
        predict: { label: 'c', unit: 'J/kg·K', tol: 0.02 },
        measure: S => { const r = runOf(S, 'A'); return analyse(r.R, r.o, { t1: S.p.t1, t2: S.p.t2 }).corr; },
        working: 'The heating slope alone gives 50 ÷ (0.5 × slope) ≈ 4220 J/kg·K (the cup and leak inflate it). The cooling slope at the same temperature measures the leak; c = [P ÷ (s_heat − s_cool) − 14] ÷ 0.5 = <b>4141 J/kg·K</b>, 1 % from the book.' },
      { source: 'NGSS MS-PS3-4 · CAST pattern: constructing an explanation',
        q: 'Midday sun of 900 W/m² on a beach. By how many kelvin does the sand’s top 8 cm swing over a day? (The sea, mixed 5 m deep, swings about 1 K.)',
        params: preset({ setup: 'explain' }),
        predict: { label: 'daily swing', unit: 'K', tol: 0.05 },
        measure: S => beachOf(S).sandSwing,
        working: 'The sand stores the day’s sunshine in about 8 cm (c 830 J/kg·K, ρ 1600 kg/m³): about 106 kJ per m² per kelvin. The sea stores it in metres of water: 20 MJ per m² per kelvin. The sand swings <b>33 K</b> between dawn and mid-afternoon, the sea about 1 K.' }
    ],
    walkthrough: [
      { title: 'Same energy, different rise', ask: 'Water and oil, 500 g each, the same 50 W heater for 5 minutes. Which gets hotter?',
        reveal: '<b>The oil — about twice as much.</b> Each kilogram of oil needs 1970 J per kelvin; water needs 4186. The joulemeters show the same energy went into both.', params: preset({}) },
      { title: 'Double the mass', ask: '0.5 kg and 1 kg of water on identical heaters. How do the rises compare?',
        reveal: '<b>The 1 kg rises about half as much.</b> Q = mcΔT: twice the m, half the ΔT for the same Q.', params: preset({ setup: 'mass' }) },
      { title: 'Spoil the test', ask: 'Give B a 20 % stronger heater. What would you wrongly conclude about oil?',
        reveal: '<b>That its c is about 0.39 of water’s instead of 0.47.</b> Only one variable may change; the checklist marks the one you let slip.', params: preset({ setup: 'plan', cP: true }) },
      { title: 'How often to read?', ask: 'Read a glass thermometer once a minute. What do you miss?',
        reveal: '<b>The moment of switch-off and the first part of the cooling — and the lag makes every reading late.</b> A thermocouple read every second follows the truth.', params: preset({ setup: 'collect', probe: 'glass', dts: 60, res: 0.5 }) },
      { title: 'From slope to c', ask: 'Fit the heating line for water. Is P ÷ (m × slope) the true c?',
        reveal: '<b>It is about 1 % high in a foam cup, 10 % high in a bare beaker.</b> Heat leaks while you heat. The cooling line measures the leak and the corrected value lands on the book.', params: preset({ setup: 'analyze', cont: 'glass' }) },
      { title: 'The beach', ask: 'Sand and water trays under one lamp. Which is hotter after 15 minutes, and why?',
        reveal: '<b>The sand — its surface tens of kelvin hotter.</b> Water’s c is five times sand’s, and convection spreads the water’s heat through the tray while the sand keeps it in its top few millimetres.', params: preset({ setup: 'explain', claim: 'capacity' }) }
    ],
    quiz: [
      { q: 'The same energy goes into 1 kg of water and 1 kg of oil. The oil gets hotter because…', options: ['oil is thicker', 'oil has a lower specific heat capacity', 'oil absorbs more energy', 'oil has more particles'], answer: 1,
        why: 'Each kelvin costs oil 1970 J/kg against water’s 4186: the same energy makes about twice the rise.' },
      { q: 'In a fair test comparing two materials, which must change?', options: ['the heater power', 'the mass', 'only the material', 'the starting temperature'], answer: 2,
        why: 'Everything else — power, mass, start, container, stirring — must be kept the same.' },
      { q: 'c calculated from the heating slope alone, in a leaky container, is usually…', options: ['too low', 'too high', 'exactly right', 'zero'], answer: 1,
        why: 'Some energy leaks out, so the sample warms more slowly than it would: the slope is too small and c too large.' },
      { q: 'Beach sand gets much hotter than the sea in the same sunshine mainly because…', options: ['sand absorbs more light', 'water has a much higher specific heat capacity and mixes its heat deep', 'water reflects all sunlight', 'sand is closer to the Sun'], answer: 1,
        why: 'Water absorbs more of the light, yet warms less: c and mixing depth decide.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>School calorimetry</b> — immersion heaters, joulemeters and 1 kg blocks are the standard kit for measuring c; the cooling correction is how good students beat the leak.</li>' +
      '<li><b>Climate</b> — the oceans’ enormous heat capacity is why coastal climates are mild and why the sea breeze blows onshore on a hot afternoon.</li>' +
      '<li><b>Cooking and engines</b> — water is the coolant of choice because each kilogram soaks up so much energy per kelvin.</li></ul>' +
      '<b>What the lab assumes.</b> Each sample is well mixed (or a well-conducting block), heated at constant power, with its container and heater’s heat capacity and a Newton’s-law leak to a 20 °C room (0.10 W/K insulated, 0.65 W/K bare). An unstirred liquid layers, so the probe reads 12 % more rise than the mean. The logger samples a probe with a first-order lag, noise and a resolution. The trays: sand by 1D conduction, water stirred by convection. The beach: the sand’s daily thermal skin (8 cm) and a sea mixed by waves.' +
      '<div class="pyq"><em>Misconception to catch</em> “Hotter means more heat went in” and “the sand absorbs more sunlight.” The same energy gives different rises in different materials and masses; water actually absorbs more of the sunlight — it simply needs far more energy per kelvin.</div>'
  });

  const MODEL = Object.assign({}, MODEL0, { BASE: () => preset({}), SETUPS, CLAIMS });
  L.models = L.models || {};
  L.models['g6c-specific-heat'] = MODEL;
})(window.InsightLab);
