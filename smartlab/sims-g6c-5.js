/* ============================================================
   GRADE 6 · UNIT C · ENERGY, HEAT AND THERMAL SYSTEMS
   6C-5  The Thermal Design Studio — Coolers and Solar Cookers
   (C5.1 Choosing materials to control heat transfer; C5.2 Defining the
    design problem; C5.3 Designing and building a device; C5.4 Testing a
    device and collecting data; C5.5 Comparing competing designs;
    C5.6 Redesigning based on evidence)

   Two engineering briefs on one bench — keep ice frozen in a cooler box, or
   heat water in a box solar cooker — designed, built and tested as a
   thermal-resistance network over hours:
     the wall    layers in series (film · liner · insulation · shell · film),
                 each L/(kA); a foil liner cuts the radiation across an air
                 gap; a lid seal leaks air; the lid can sit in the sun.
     the cooler  ice melting at 0 °C with its latent heat (334 kJ/kg), then
                 the drinks warming once it has gone.
     the cooker  sunlight through glazing (transmittance), concentrated by
                 reflector panels, absorbed by a black or a shiny pot; losses
                 through the glazing and the walls; water heating to the boil.
     materials   a hot-plate test rig measuring each panel's U-value.
     define      criteria and constraints; the whole design space plotted.
     build       choose the layers; see where the heat gets in.
     test        run it for hours and log it.
     compare     two designs against the criteria, cost and mass.
     redesign    the biggest leak found from the evidence, and fixed.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6C, MEAS, BENCH, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6C;
  const SIGMA = 5.670374e-8, LF = 334000;

  /* insulation materials: k W/m·K, density kg/m³, cost $ per m² per cm of thickness */
  const INSUL = {
    foam: { name: 'expanded polystyrene', k: 0.035, rho: 20, cost: 1.2, colour: '#ECEEF0' },
    pu: { name: 'polyurethane foam', k: 0.024, rho: 35, cost: 3.0, colour: '#E8D890' },
    wool: { name: 'sheep’s wool batt', k: 0.040, rho: 25, cost: 2.0, colour: '#E0D6C0' },
    card: { name: 'corrugated cardboard', k: 0.065, rho: 120, cost: 0.4, colour: '#C8A070' },
    newspaper: { name: 'crumpled newspaper', k: 0.060, rho: 60, cost: 0.1, colour: '#D8D4CC' },
    wood: { name: 'pine wood', k: 0.12, rho: 500, cost: 4.0, colour: '#B98A4A' },
    air: { name: 'still air gap', k: 0.026, rho: 1.2, cost: 0, colour: '#CFE6F4' },
    alu: { name: 'aluminium sheet', k: 205, rho: 2700, cost: 6.0, colour: '#C9D0D8' }
  };
  const SHELL = { L: 0.003, k: 0.20, rho: 950, cost: 2.0 };                  // a 3 mm polypropylene shell, $2 per m²
  const FOIL = { cost: 1.0, eps: 0.05 };                                       // a foil liner: $1 per m², emissivity 0.05
  /* the wall's conductance per m², inside air to outside air, and its layer temperatures for a given ΔT */
  function wallU(o) {
    // o = { mat, cm, foil, hi, ho, epsOut }
    const I = INSUL[o.mat], Lm = o.cm / 100, hi = o.hi == null ? 6 : o.hi, ho = o.ho == null ? 9 : o.ho;
    let Rins = Lm / I.k;
    if (o.mat === 'air') {                                                      // an air gap passes heat by conduction and by radiation across it
      const e = o.foil ? FOIL.eps : 0.9, eEff = 1 / (2 / e - 1), hr = 4 * SIGMA * Math.pow(288, 3) * eEff;
      Rins = 1 / (I.k / Math.max(1e-3, Lm) + hr);
    } else if (o.foil) Rins += 0.15;                                            // foil facing a thin still-air layer adds a radiant-barrier resistance
    const layers = [{ name: 'inside air film', R: 1 / hi }, { name: I.name, R: Rins }, { name: 'shell', R: SHELL.L / SHELL.k }, { name: 'outside air film', R: 1 / ho }];
    const R = layers.reduce((u, l) => u + l.R, 0);
    return { U: 1 / R, R, layers };
  }

  /* ============================================================
     THE COOLER — 40 × 30 × 30 cm outside, ice and drinks inside
     ============================================================ */
  const BOX = { W: 0.40, D: 0.30, H: 0.30 };
  const SEALS = { poor: { name: 'loose lid, no seal', G: 0.60 }, good: { name: 'rubber gasket', G: 0.06 } };
  const LIDS = { white: { name: 'white', a: 0.25 }, dark: { name: 'dark blue', a: 0.85 } };
  function boxAreas(cm) { const t = cm / 100, w = BOX.W - 2 * t, d = BOX.D - 2 * t, h = BOX.H - 2 * t; return { out: 2 * (BOX.W * BOX.D + BOX.W * BOX.H + BOX.D * BOX.H), lid: BOX.W * BOX.D, inVol: Math.max(0, w * d * h), mean: 2 * ((w + t) * (d + t) + (w + t) * (h + t) + (d + t) * (h + t)) }; }
  function design(o) {
    // o = { mat, cm, foil, seal, lid, glaze, refl, absb } → cost $, mass kg, the conductances
    const A = boxAreas(o.cm), I = INSUL[o.mat];
    const Ws = wallU({ mat: o.mat, cm: o.cm, foil: o.foil });
    const UA = Ws.U * A.mean, seal = SEALS[o.seal].G;
    let cost = A.mean * (I.cost * o.cm + SHELL.cost * 2 + (o.foil ? FOIL.cost : 0)) + (o.seal === 'good' ? 6 : 0);
    let mass = A.mean * (I.rho * o.cm / 100 + SHELL.rho * SHELL.L * 2);
    if (o.device === 'cooker') {
      const G = GLAZE[o.glaze]; cost += G.cost * COOK.ap + REFL[o.refl].cost; mass += G.mass * COOK.ap + REFL[o.refl].mass;
    }
    return { UA, seal, cost, mass, Ws, A };
  }
  /* hours of the test: ambient Ta (°C), the sun on the lid peaking at Gpk at noon (12 h day from 06:00) */
  const sunAt = (hr, Gpk) => Math.max(0, Math.sin(Math.PI * (hr - 6) / 12)) * Gpk;
  function coolerRun(o) {
    // o = { ...design, Ta, ice (kg), drinks (kg), Gpk, start (h), hours }
    const D = design(o), hrs = o.hours || 48, dt = 60, Ta = o.Ta;
    let ice = o.ice, T = 0, t = 0, Qw = 0, Qs = 0, Ql = 0;
    const C = o.drinks * 4000 + 2 * o.ice * 0, rows = [];
    let gone = null;
    while (t <= hrs * 3600 + 1e-9) {
      const hr = ((o.start || 9) + t / 3600) % 24, sun = sunAt(hr, o.Gpk || 0);
      const Tlid = Ta + LIDS[o.lid].a * sun / 15;                                 // the lid's outer face heated by the sun (h_out 15 W/m²K)
      const qWall = D.UA * (Ta - T) * (1 - BOX.W * BOX.D / D.A.out) + D.UA * (Tlid - T) * (BOX.W * BOX.D / D.A.out);
      const qSeal = D.seal * (Ta - T);
      if (t % 600 === 0) rows.push({ t, hr, ice, T, qWall, qSeal, Qw, Ql });
      const q = qWall + qSeal;
      if (ice > 0) { ice = Math.max(0, ice - q * dt / LF); T = 0; if (ice === 0 && gone == null) gone = t; }
      else T += q * dt / C;
      Qw += qWall * dt; Ql += qSeal * dt; Qs += 0; t += dt;
    }
    return { rows, gone, D, hoursIce: gone == null ? Infinity : gone / 3600 };
  }

  /* ============================================================
     THE COOKER — a box with a glazed top and reflector panels
     ============================================================ */
  const COOK = { ap: 0.25, pot: 1.0, potC: 600 };                              // 50 × 50 cm aperture; 1 kg of water in a pot of 600 J/K
  const GLAZE = { none: { name: 'no glazing', tau: 1.0, U: 18, cost: 0, mass: 0 }, single: { name: 'single glass', tau: 0.85, U: 6.0, cost: 20, mass: 10 }, double: { name: 'double glass', tau: 0.74, U: 3.0, cost: 40, mass: 20 } };
  const REFL = { 0: { name: 'no reflector', C: 1.0, cost: 0, mass: 0 }, 1: { name: 'one panel', C: 1.45, cost: 6, mass: 0.6 }, 4: { name: 'four panels', C: 2.3, cost: 24, mass: 2.4 } };
  const ABSB = { black: { name: 'matt black pot', a: 0.95 }, shiny: { name: 'shiny steel pot', a: 0.35 } };
  function cookerRun(o) {
    // o = { ...design, Ta, Gpk, start, hours }: the pot and box air as one node; losses through the glazing and the walls
    const D = design(o), G = GLAZE[o.glaze], R = REFL[o.refl], hrs = o.hours || 6, dt = 30;
    const C = COOK.pot * 4186 + COOK.potC + 2500;                               // water, pot, and the box's tray, liner and air (2.5 kJ/K)
    let T = o.Ta, t = 0, Qin = 0, Qtop = 0, Qwall = 0, boiled = null;
    const rows = [];
    while (t <= hrs * 3600 + 1e-9) {
      const hr = (o.start || 10) + t / 3600, sun = sunAt(hr, o.Gpk), gain = sun * COOK.ap * R.C * G.tau * ABSB[o.absb].a;
      const top = G.U * COOK.ap * (T - o.Ta), wall = (D.UA * 0.6) * (T - o.Ta) + D.seal * (T - o.Ta);
      if (t % 300 === 0) rows.push({ t, hr, T, sun, gain, top, wall, Qin, Qtop, Qwall });
      T += (gain - top - wall) / C * dt;
      if (T >= 100) { T = 100; if (boiled == null) boiled = t; }
      Qin += gain * dt; Qtop += top * dt; Qwall += wall * dt; t += dt;
    }
    const peak = Math.max(...rows.map(r => r.T));
    return { rows, boiled, peak, D };
  }

  /* ============================================================
     MATERIALS — the hot-plate test rig: a 30 × 30 cm panel between 60 °C and 20 °C
     ============================================================ */
  function panelTest(o) { const W = wallU({ mat: o.mat, cm: o.cm, foil: o.foil, hi: 8, ho: 8 }), A = 0.09; return { U: W.U, q: W.U * A * (o.Th - 20), W, flux: W.U * (o.Th - 20) }; }

  const MODEL0 = { INSUL, SHELL, FOIL, wallU, BOX, SEALS, LIDS, design, sunAt, coolerRun, COOK, GLAZE, REFL, ABSB, cookerRun, panelTest, boxAreas };

  /* ============================================================
     SET-UPS, STATE
     ============================================================ */
  const SETUPS = [
    { value: 'materials', label: 'Test the materials: U-values', teaches: ['C5.1'] },
    { value: 'define', label: 'Define it: criteria and constraints', teaches: ['C5.2'] },
    { value: 'build', label: 'Build it: choose every layer', teaches: ['C5.3'] },
    { value: 'test', label: 'Test it for hours', teaches: ['C5.4'] },
    { value: 'compare', label: 'Compare two designs', teaches: ['C5.5'] },
    { value: 'redesign', label: 'Find the leak, redesign', teaches: ['C5.6'] }
  ];
  const BASE = {
    setup: 'build', device: 'cooler',
    pmat: 'foam', pcm: 5, pfoil: false, pTh: 60,
    mat: 'foam', cm: 5, foil: false, seal: 'poor', lid: 'white', glaze: 'single', refl: 1, absb: 'black',
    tH: 24, tT: 90, budget: 20, maxm: 6,
    Ta: 30, ice: 2, Gpk: 0, sunC: 900,
    alt: 'cheap', fix: 'auto'
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const is = (...v) => S => v.indexOf(S.p.setup) >= 0;
  const dev = d => S => S.p.setup !== 'materials' && S.p.device === d;
  const ALTS = {
    cooler: { cheap: { name: 'Cardboard 3 cm, loose lid', d: { mat: 'card', cm: 3, foil: false, seal: 'poor', lid: 'white' } }, standard: { name: 'Polystyrene 5 cm, gasket', d: { mat: 'foam', cm: 5, foil: false, seal: 'good', lid: 'white' } }, premium: { name: 'Polyurethane 6 cm, foil, gasket', d: { mat: 'pu', cm: 6, foil: true, seal: 'good', lid: 'white' } } },
    cooker: { cheap: { name: 'No glass, no reflector', d: { glaze: 'none', refl: 0, absb: 'black', mat: 'card', cm: 2, foil: true, seal: 'poor' } }, standard: { name: 'Single glass, one reflector', d: { glaze: 'single', refl: 1, absb: 'black', mat: 'card', cm: 3, foil: true, seal: 'good' } }, premium: { name: 'Double glass, four reflectors', d: { glaze: 'double', refl: 4, absb: 'black', mat: 'foam', cm: 5, foil: true, seal: 'good' } } }
  };
  function designOf(p, which) {
    const d = { device: p.device, mat: p.mat, cm: p.cm, foil: p.foil, seal: p.seal, lid: p.lid, glaze: p.glaze, refl: p.refl, absb: p.absb };
    if (which === 'B') Object.assign(d, ALTS[p.device][p.alt].d);
    if (which === 'fixed') Object.assign(d, fixOf(p, d));
    return d;
  }
  /* the redesign: the change the evidence points to (auto: the largest heat path) */
  function leaks(p, d) {
    if (p.device === 'cooler') { const D = design(d); return [['walls', D.UA], ['lid seal', D.seal]]; }
    const D = design(d), G = GLAZE[d.glaze]; return [['glazing', G.U * COOK.ap], ['walls', D.UA * 0.6], ['lid seal', D.seal], ['sunlight wasted by the pot', COOK.ap * REFL[d.refl].C * G.tau * (1 - ABSB[d.absb].a) / 10]];
  }
  function fixOf(p, d) {
    let f = p.fix;
    if (f === 'auto') { const L0 = leaks(p, d).slice().sort((a, b) => b[1] - a[1])[0][0]; f = L0 === 'lid seal' ? 'seal' : L0 === 'walls' ? 'thicker' : L0 === 'glazing' ? 'glaze' : 'absb'; }
    if (f === 'seal') return { seal: 'good' };
    if (f === 'thicker') return { cm: Math.min(10, d.cm + 3) };
    if (f === 'foil') return { foil: true };
    if (f === 'lid') return { lid: 'white' };
    if (f === 'glaze') return { glaze: d.glaze === 'none' ? 'single' : 'double' };
    if (f === 'refl') return { refl: d.refl === 0 ? 1 : 4 };
    if (f === 'absb') return { absb: 'black' };
    return {};
  }
  function runFor(S, which) {
    const p = S.p, d = designOf(p, which), key = which + JSON.stringify(d) + [p.Ta, p.ice, p.Gpk, p.sunC].join('|');
    S._r = S._r || {};
    if (S._r[which] && S._r[which].key === key) return S._r[which].R;
    const R = p.device === 'cooler' ? coolerRun(Object.assign({}, d, { Ta: p.Ta, ice: p.ice, drinks: 1, Gpk: p.Gpk, start: 9, hours: 72 })) : cookerRun(Object.assign({}, d, { Ta: p.Ta, Gpk: p.sunC, start: 10, hours: 6 }));
    R.d = d; S._r[which] = { key, R }; return R;
  }
  const scoreOf = (p, R) => p.device === 'cooler' ? R.hoursIce : (R.boiled != null ? 100 + (6 * 3600 - R.boiled) / 3600 : R.peak);
  function meets(p, R) {
    const perf = p.device === 'cooler' ? R.hoursIce >= p.tH : R.peak >= p.tT;
    return { perf, cost: R.D.cost <= p.budget, mass: R.D.mass <= p.maxm };
  }
  const hoursEnd = p => p.device === 'cooler' ? 72 : 6;
  function setup(S) {
    const p = S.p;
    p.refl = +p.refl;
    S.ts = 0; S.ta = 0; S._r = null; S._space = null;
    const two = p.setup === 'compare' || p.setup === 'redesign';
    const ck = p.device === 'cooker';
    const H = p.setup === 'materials' ? { theta: -1.35, phi: 0.40, dist: 0.62, target: [0.08, 0, 0.10] } : { theta: -1.30, phi: ck ? 0.50 : 0.40, dist: (two ? 1.55 : 1.05) * (ck ? 1.45 : 1), target: [two ? 0.12 : 0.10, 0, ck ? 0.26 : 0.16] };
    if (!S.cam || S.camFor !== p.setup + p.device) {
      S.cam = Camera({ theta: H.theta, phi: H.phi, dist: H.dist, target: H.target.slice(), fov: 0.72 });
      S.cam.minDist = 0.3; S.cam.maxDist = 5; S.camFor = p.setup + p.device; S._nar = null;
    }
  }
  function step(S, dt) { S.ta += dt; S.ts = Math.min(hoursEnd(S.p) * 3600, S.ts + dt * (S.p.device === 'cooler' ? 7200 : 900)); }

  /* ============================================================
     HELPERS
     ============================================================ */
  let NAR = false;
  const co = (F, at, dx, dy, t, c, o) => window.R3.callout(F, at, NAR ? dx * 0.45 : dx, dy, t, c, o);
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const rowAt = (rows, t) => rows[clamp(Math.round(t / (rows[1].t - rows[0].t)), 0, rows.length - 1)];
  const hh = h => !isFinite(h) ? '> 72 h' : h >= 1 ? h.toFixed(1) + ' h' : (h * 60).toFixed(0) + ' min';
  function scene(S, g, x0, x1, y0, y1) {
    const ctx = g.ctx, W = g.w, H = g.h, M = window.MEAS, R3 = window.R3;
    S.cam.setViewport(W, H); S.cam.update();
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9FAAB6'); bg.addColorStop(1, '#CDD4DA');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const F0 = R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
    if (S.cam.eye[1] < y1) M.tileWall(F0, x0 - 0.3, x1 + 0.3, y1 + 0.01, 0, 1.0);
    M.bench(F0, x0, x1, y0, y1, {});
    F0.render();
    return R3.Frame(ctx, S.cam, { ambient: 0.34, floorZ: 0 });
  }
  /* one device, as built, at x; its state at time t */
  function device(F, S, x, d, R, label) {
    const A = ART(), R3 = window.R3, M = window.MEAS, p = S.p, t = d.cm / 100, I = INSUL[d.mat];
    if (p.device === 'cooler') {
      const r = rowAt(R.rows, S.ts);
      const B = A.insulatedBox(F, [x, 0, 0], BOX.W, BOX.D, BOX.H, t, { ins: I.colour, foil: d.foil, lid: 'closed', lidCol: d.lid === 'dark' ? '#23407A' : '#F2F2EE', shell: d.lid === 'dark' ? '#2E5AA8' : '#4F86C8' });
      // the ice and two cans inside
      const frac = r.ice / p.ice;
      for (let i = 0; i < 6; i++) A.iceCube(F, [x - B.innerW / 3 + (i % 3) * B.innerW / 3, (Math.floor(i / 3) - 0.5) * B.innerD / 3, t + 0.001], 0.045, frac, {});
      R3.cylinder(F, [x + B.innerW / 3, B.innerD / 4, t], [x + B.innerW / 3, B.innerD / 4, t + 0.12], 0.033, '#C8463A', { segments: 18, shadow: false });
      co(F, [x, -BOX.D / 2, BOX.H * 0.22], 20, label === 'B' || label === 'after' ? 74 : 44, (label ? label + ': ' : '') + I.name + ' ' + d.cm + ' cm' + (d.foil ? ' + foil' : '') + ' · ' + SEALS[d.seal].name, '#E8EEF8');
      co(F, [x, 0, BOX.H + t], label === 'B' ? 30 : -30, -40, 'ice ' + (r.ice * 1000).toFixed(0) + ' g · inside ' + r.T.toFixed(1) + ' °C', '#9FE0F8');
      return r;
    }
    const r = rowAt(R.rows, S.ts), G = GLAZE[d.glaze], H = 0.28, W = 0.5, D = 0.5;
    const B = A.insulatedBox(F, [x, 0, 0], W, D, H, t, { ins: I.colour, foil: d.foil, lid: d.glaze === 'none' ? null : 'glass', double: d.glaze === 'double', shell: '#2A303A', linerCol: '#18181C' });
    // the pot
    R3.cylinder(F, [x, 0.02, t], [x, 0.02, t + 0.11], 0.075, d.absb === 'black' ? '#15161A' : '#C9D0D8', { segments: 24, ambient: 0.4 });
    R3.cylinder(F, [x, 0.02, t + 0.11], [x, 0.02, t + 0.12], 0.08, d.absb === 'black' ? '#22242A' : '#D8DEE6', { segments: 24, shadow: false });
    // reflectors on the top edges
    const n = d.refl, sides = [[[x - W / 2, D / 2, H], [x + W / 2, D / 2, H], [0, 1, 0]], [[x - W / 2, -D / 2, H], [x - W / 2, D / 2, H], [-1, 0, 0]], [[x + W / 2, D / 2, H], [x + W / 2, -D / 2, H], [1, 0, 0]], [[x + W / 2, -D / 2, H], [x - W / 2, -D / 2, H], [0, -1, 0]]];
    for (let i = 0; i < n; i++) A.reflector(F, sides[i][0], sides[i][1], sides[i][2], 0.55, 0.40);
    // sunlight falling into the aperture, as strong as the sun is now
    const sunNow = r.sun / 1000;
    if (sunNow > 0.02) for (let k = -2; k <= 2; k++) R3.polyline(F, [[x + k * 0.08 - 0.1, -0.15 + k * 0.03, H + 0.55], [x + k * 0.05, 0.02 + k * 0.02, t + 0.12]], '#FFE98A', { alpha: 0.25 + 0.6 * sunNow, width: 1.6, bias: -0.06 });
    co(F, [x, -D / 2, H * 0.22], 20, label === 'B' || label === 'after' ? 74 : 44, (label ? label + ': ' : '') + G.name + ' · ' + REFL[d.refl].name + ' · ' + ABSB[d.absb].name, '#E8EEF8');
    co(F, [x, 0.02, t + 0.12], label === 'B' ? 40 : -40, -60, 'water ' + r.T.toFixed(1) + ' °C', '#FFB27A');
    return r;
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  function drawStage(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, A = ART(), R3 = window.R3, BENCH = window.BENCH;
    NAR = g.w < K.NARROW;
    if (S.cam && S._nar !== NAR) { if (S._nar != null || NAR) S.cam.dist *= NAR ? 1.4 : 1 / 1.4; S._nar = NAR; }
    if (p.setup === 'materials') {
      const F = scene(S, g, -0.30, 0.45, -0.24, 0.24);
      const T0 = panelTest({ mat: p.pmat, cm: p.pcm, foil: p.pfoil, Th: p.pTh });
      const top = A.panelRig(F, [0.0, 0.02, 0], p.pcm, INSUL[p.pmat].colour, p.pfoil, p.pTh);
      BENCH.meter(F, [0.22, -0.10, 0.04], [-0.3, -1, 0.35], 0.11, 0.05, { title: 'HEAT FLUX', value: T0.flux.toFixed(1), unit: 'W/m²', colour: '#FFB27A', depth: 0.03 });
      R3.tube(F, [[0.0, 0.03, top], [0.06, 0.0, top + 0.03], [0.18, -0.08, 0.06], [0.2, -0.09, 0.01]], 0.0018, '#2A2F38', { segments: 5, round: false });
      co(F, [0.0, -0.09, top - 0.002], -60, -40, INSUL[p.pmat].name + ' · ' + p.pcm + ' cm' + (p.pfoil ? ' · foil-faced' : ''), '#E8EEF8');
      F.render();
      K.header(g, 'A ' + p.pcm + ' cm panel of ' + INSUL[p.pmat].name + ': U = ' + T0.U.toFixed(3) + ' W/m²K — ' + T0.flux.toFixed(1) + ' W through every square metre',
        'hot side ' + p.pTh + ' °C, room 20 °C · R = ' + T0.W.R.toFixed(3) + ' m²K/W (films included) · k = ' + INSUL[p.pmat].k + ' W/m·K',
        'insulators work by trapping still air: the less the air can move, and the less it radiates, the smaller U');
      return;
    }
    const two = p.setup === 'compare' || p.setup === 'redesign';
    const F = scene(S, g, -0.55, 0.85, -0.40, 0.40);
    if (two) {
      const RA = runFor(S, 'A'), RB = runFor(S, p.setup === 'compare' ? 'B' : 'fixed');
      device(F, S, p.device === 'cooler' ? -0.18 : -0.30, RA.d, RA, p.setup === 'compare' ? 'A' : 'before');
      device(F, S, p.device === 'cooler' ? 0.42 : 0.50, RB.d, RB, p.setup === 'compare' ? 'B' : 'after');
      F.render();
      decisionCard(S, g, RA, RB);
      const sA = scoreOf(p, RA), sB = scoreOf(p, RB);
      K.header(g, p.setup === 'compare' ? (p.device === 'cooler' ? 'A keeps ice ' + hh(RA.hoursIce) + ', B ' + hh(RB.hoursIce) : 'A peaks at ' + RA.peak.toFixed(0) + ' °C, B at ' + RB.peak.toFixed(0) + ' °C') + ' — $' + RA.D.cost.toFixed(0) + ' against $' + RB.D.cost.toFixed(0)
        : 'The biggest leak: ' + leaks(p, RA.d).slice().sort((a, b) => b[1] - a[1])[0][0] + ' — fixed, ' + (p.device === 'cooler' ? hh(RA.hoursIce) + ' becomes ' + hh(RB.hoursIce) : RA.peak.toFixed(0) + ' °C becomes ' + RB.peak.toFixed(0) + ' °C'),
        't = ' + (S.ts / 3600).toFixed(1) + ' h · ' + p.Ta + ' °C air' + (p.device === 'cooker' ? ' · sun ' + p.sunC + ' W/m² at noon' : ''),
        sA === sB ? 'the same performance: compare cost and mass' : 'evidence, not a guess: each design was run for ' + hoursEnd(p) + ' hours');
      return;
    }
    const R = runFor(S, 'A'), r = device(F, S, 0.10, R.d, R, '');
    if (p.setup === 'build') {
      // the heat paths into the box as arrows, thick with their share
      const L0 = leaks(p, R.d), tot = L0.reduce((u, l) => u + l[1], 0);
      if (p.device === 'cooler') {
        R3.arrow(F, [0.10 - BOX.W / 2 - 0.18, 0, 0.15], [0.10 - BOX.W / 2 - 0.02, 0, 0.15], 0.004 + 0.02 * L0[0][1] / tot, '#FF7A45', { bias: -0.04 });
        R3.arrow(F, [0.10, -0.05, BOX.H + 0.13], [0.10, -0.05, BOX.H + 0.04], 0.004 + 0.02 * L0[1][1] / tot, '#FFB27A', { bias: -0.04 });
        co(F, [0.10 - BOX.W / 2 - 0.12, 0, 0.17], -10, -40, 'through the walls ' + (100 * L0[0][1] / tot).toFixed(0) + ' %', '#FF9A6A');
        co(F, [0.10, -0.05, BOX.H + 0.10], 60, 0, 'past the lid seal ' + (100 * L0[1][1] / tot).toFixed(0) + ' %', '#FFC09A');
      }
      // the thickness handle on the wall's top edge
      const t = R.d.cm / 100, xw = 0.10 + (p.device === 'cooler' ? BOX.W : 0.5) / 2, z = p.device === 'cooler' ? BOX.H : 0.28;
      F.render();
      const qa = S.cam.project([xw, 0, z]), qb = S.cam.project([xw - 0.12, 0, z]);
      if (qa.ok && qb.ok) {
        const dx = qb.x - qa.x, dy = qb.y - qa.y, len = Math.hypot(dx, dy) || 1, f = (R.d.cm - 1) / 9, X = qa.x + dx * f * 0.83, Y = qa.y + dy * f * 0.83;
        S._ax = { ux: dx / len, uy: dy / len, len: len * 0.83 }; g.handle(X, Y, 13, 'cm');
        ctx.save(); ctx.strokeStyle = 'rgba(255,211,107,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 9, 0, TAU); ctx.stroke(); ctx.restore();
      }
      void t;
    } else F.render();
    briefCard(S, g, R);
    K.header(g, p.device === 'cooler' ? (r.ice > 0 ? 'Ice left: ' + (r.ice * 1000).toFixed(0) + ' g after ' + (S.ts / 3600).toFixed(1) + ' h — it will last ' + hh(R.hoursIce) : 'The ice is gone (' + hh(R.hoursIce) + '); the drinks are warming: ' + r.T.toFixed(1) + ' °C')
        : 'Water ' + r.T.toFixed(1) + ' °C at ' + (10 + S.ts / 3600).toFixed(1) + ' h' + (R.boiled != null ? ' — boils after ' + (R.boiled / 60).toFixed(0) + ' min' : ' — peaks at ' + R.peak.toFixed(0) + ' °C'),
      'U·A of the walls ' + R.D.UA.toFixed(3) + ' W/K · seal ' + R.D.seal.toFixed(2) + ' W/K · cost $' + R.D.cost.toFixed(2) + ' · mass ' + R.D.mass.toFixed(2) + ' kg',
      p.device === 'cooler' ? 'energy leaks in from the warm air; the ice uses it to melt (334 J every gram)' : 'sunlight in through the glass; the glass and walls leak the heat back out');
  }
  function briefCard(S, g, R) {
    const ctx = g.ctx, K = kit(), p = S.p, W = g.w, cw = Math.min(260, W * 0.3), at = K.cardSlot(g, S, 'the design brief', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (!at) return;
    const m = meets(p, R), rows = [[m.perf, p.device === 'cooler' ? 'ice lasts ≥ ' + p.tH + ' h: ' + hh(R.hoursIce) : 'water reaches ' + p.tT + ' °C: ' + R.peak.toFixed(0) + ' °C'], [m.cost, 'costs ≤ $' + p.budget + ': $' + R.D.cost.toFixed(2)], [m.mass, 'weighs ≤ ' + p.maxm + ' kg: ' + R.D.mass.toFixed(2) + ' kg']];
    const h = 36 + rows.length * 20 + 24; K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('Criterion and constraints', at.x + 10, at.y + 8);
    rows.forEach(([ok, s], i) => { ctx.fillStyle = ok ? '#9FE0A8' : '#FF8A80'; ctx.font = mono(10, 700); ctx.fillText(ok ? '✓' : '✗', at.x + 12, at.y + 30 + i * 20); ctx.fillStyle = g.theme.text; ctx.font = mono(9.5, 500); ctx.fillText(K.fitText(ctx, s, at.w - 40), at.x + 28, at.y + 30 + i * 20); });
    const all = m.perf && m.cost && m.mass; ctx.fillStyle = all ? '#9FE0A8' : '#FFD27A'; ctx.font = mono(9.5, 600); ctx.fillText(all ? 'meets the brief' : 'does not meet the brief yet', at.x + 10, at.y + 36 + rows.length * 20);
    ctx.restore();
  }
  function decisionCard(S, g, RA, RB) {
    const ctx = g.ctx, K = kit(), p = S.p, W = g.w, cw = Math.min(280, W * 0.32), at = K.cardSlot(g, S, 'decision matrix', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (!at) return;
    const names = p.setup === 'compare' ? ['A (yours)', 'B (' + ALTS[p.device][p.alt].name.split(',')[0] + ')'] : ['before', 'after'];
    const perf = R => p.device === 'cooler' ? hh(R.hoursIce) : R.peak.toFixed(0) + ' °C', h = 36 + 4 * 18 + 8;
    K.card(ctx, at.x, at.y, at.w, h, { fill: 'rgba(8,12,22,.95)' });
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.fillText('criterion', at.x + 10, at.y + 8);
    ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, names[0], 80), at.x + at.w - 96, at.y + 8); ctx.fillText(K.fitText(ctx, names[1], 86), at.x + at.w - 10, at.y + 8);
    const mA = meets(p, RA), mB = meets(p, RB);
    const rows = [['performance', perf(RA), perf(RB), mA.perf, mB.perf], ['cost', '$' + RA.D.cost.toFixed(1), '$' + RB.D.cost.toFixed(1), mA.cost, mB.cost], ['mass', RA.D.mass.toFixed(1) + ' kg', RB.D.mass.toFixed(1) + ' kg', mA.mass, mB.mass], ['meets all?', mA.perf && mA.cost && mA.mass ? 'yes' : 'no', mB.perf && mB.cost && mB.mass ? 'yes' : 'no', mA.perf && mA.cost && mA.mass, mB.perf && mB.cost && mB.mass]];
    ctx.font = mono(9.5, 500);
    rows.forEach((r, i) => { const y = at.y + 30 + i * 18; ctx.textAlign = 'left'; ctx.fillStyle = g.theme['text-2']; ctx.fillText(r[0], at.x + 10, y); ctx.textAlign = 'right'; ctx.fillStyle = r[3] ? '#9FE0A8' : '#FF9A8E'; ctx.fillText(r[1], at.x + at.w - 96, y); ctx.fillStyle = r[4] ? '#9FE0A8' : '#FF9A8E'; ctx.fillText(r[2], at.x + at.w - 10, y); });
    ctx.restore();
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  const MCOL = { foam: '#ECEEF0', pu: '#E8D890', wool: '#E0D6C0', card: '#C8A070', newspaper: '#9AA4B4', wood: '#B98A4A', air: '#7FC0F0', alu: '#8E98A6' };
  function spaceOf(S) {
    const p = S.p, key = [p.device, p.Ta, p.ice, p.Gpk, p.sunC, p.seal, p.foil, p.lid, p.glaze, p.refl, p.absb].join('|');
    if (S._space && S._space.key === key) return S._space.pts;
    const pts = [];
    ['foam', 'pu', 'wool', 'card', 'newspaper', 'wood'].forEach(mat => [1, 2, 3, 4, 5, 6, 8, 10].forEach(cm => {
      const d = { device: p.device, mat, cm, foil: p.foil, seal: p.seal, lid: p.lid, glaze: p.glaze, refl: p.refl, absb: p.absb };
      const R = p.device === 'cooler' ? coolerRun(Object.assign({}, d, { Ta: p.Ta, ice: p.ice, drinks: 1, Gpk: p.Gpk, start: 9, hours: 72 })) : cookerRun(Object.assign({}, d, { Ta: p.Ta, Gpk: p.sunC, start: 10, hours: 6 }));
      pts.push({ mat, cm, perf: p.device === 'cooler' ? Math.min(72, R.hoursIce) : R.peak, cost: R.D.cost, mass: R.D.mass });
    }));
    S._space = { key, pts }; return pts;
  }
  function plot1(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'materials') {
      const ks = Object.keys(INSUL).filter(k => k !== 'alu'), Kk = K.plotKey(g, ks.map(k => ({ c: MCOL[k], label: INSUL[k].name.split(' ').slice(-1)[0] })).concat([{ c: '#FFD36B', label: 'yours', dot: true }]));
      const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 4.5, pad: { t: Kk.t }, xlabel: 'thickness (cm)', ylabel: 'U (W/m²K)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { ks.forEach(k => { const pts = []; for (let c = 0.5; c <= 10.001; c += 0.25) pts.push([c, panelTest({ mat: k, cm: c, foil: false, Th: 60 }).U]); P.line(pts, MCOL[k], 2); }); P.dot(p.pcm, panelTest({ mat: p.pmat, cm: p.pcm, foil: p.pfoil, Th: p.pTh }).U, 5, '#FFD36B', '#05080F'); });
      P.tag(5, 3.9, 'the films alone stop U going above 4', T['text-3']);
      Kk.draw(P); return;
    }
    if (p.setup === 'define') {
      const pts = spaceOf(S), Kk = K.plotKey(g, ['foam', 'pu', 'wool', 'card', 'newspaper', 'wood'].map(k => ({ c: MCOL[k], label: INSUL[k].name.split(' ').slice(-1)[0], dot: true })));
      const ymax = p.device === 'cooler' ? 75 : 105, xmax = Math.max(p.budget * 1.4, ...pts.map(q => q.cost)) * 1.05;
      const P = g.Plot({ xmin: 0, xmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'cost ($)', ylabel: p.device === 'cooler' ? 'hours of ice' : 'hottest water (°C)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.area([[0, p.device === 'cooler' ? p.tH : p.tT], [p.budget, p.device === 'cooler' ? p.tH : p.tT]], ymax, g.alpha('#9FE0A8', 0.12)); P.hline(p.device === 'cooler' ? p.tH : p.tT, '#9FE0A8', [4, 3]); P.vline(p.budget, '#FFD27A', [4, 3]); pts.forEach(q => P.dot(q.cost, q.perf, q.mass <= p.maxm ? 4 : 2.5, MCOL[q.mat], q.mass <= p.maxm ? null : '#FF8A80')); const R = runFor(S, 'A'); P.dot(R.D.cost, scoreOf(p, R) > 100 && p.device === 'cooker' ? 100 : Math.min(72, scoreOf(p, R)), 6, '#FFD36B', '#05080F'); });
      P.tag(p.budget, ymax * 0.95, 'budget', '#FFD27A', 'right'); P.tag(xmax * 0.98, (p.device === 'cooler' ? p.tH : p.tT) + ymax * 0.03, 'the green corner meets the brief', '#9FE0A8', 'right');
      Kk.draw(P); return;
    }
    if (p.setup === 'build') {
      const R = runFor(S, 'A'), L0 = leaks(p, R.d), tot = L0.reduce((u, l) => u + l[1], 0);
      const P = g.Plot({ xmin: -0.5, xmax: L0.length - 0.5, ymin: 0, ymax: 100, pad: { t: 14 }, xlabel: 'where the heat goes', ylabel: '% of the heat path', xticks: L0.map((_, i) => i), xfmt: v => (L0[Math.round(v)] || [''])[0], yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => L0.forEach((l, i) => P.area([[i - 0.3, 100 * l[1] / tot], [i + 0.3, 100 * l[1] / tot]], 0, g.alpha(i ? '#FFB27A' : '#FF7A45', 0.85))));
      L0.forEach((l, i) => P.tag(i, 100 * l[1] / tot + 4, l[1].toFixed(3) + ' W/K', T['text-2'], 'center'));
      return;
    }
    const runs = p.setup === 'test' ? [['A', '#5FA8E8']] : [['A', '#FF8A5A'], [p.setup === 'compare' ? 'B' : 'fixed', '#9FE0A8']];
    const Kk = K.plotKey(g, runs.map(([w, c]) => ({ c, label: w === 'A' ? (p.setup === 'redesign' ? 'before' : 'design A') : w === 'B' ? 'design B' : 'after' })).concat(p.device === 'cooker' ? [{ c: '#FFE98A', label: 'sunshine (÷10)', dash: [4, 3] }] : []));
    const tEnd = hoursEnd(p), P = g.Plot({ xmin: 0, xmax: tEnd, ymin: p.device === 'cooler' ? 0 : 0, ymax: p.device === 'cooler' ? p.ice * 1.1 : 110, pad: { t: Kk.t }, xlabel: p.device === 'cooler' ? 'hours' : 'hours from 10:00', ylabel: p.device === 'cooler' ? 'ice left (kg)' : 'water (°C)', xfmt: v => v.toFixed(0), yfmt: v => p.device === 'cooler' ? v.toFixed(1) : v.toFixed(0) }).frame();
    P.clip(() => {
      if (p.device === 'cooker') P.line(runFor(S, 'A').rows.map(r => [r.t / 3600, r.sun / 10]), '#FFE98A', 1.3, [4, 3]);
      runs.forEach(([w, c]) => { const R = runFor(S, w); P.line(R.rows.map(r => [r.t / 3600, p.device === 'cooler' ? r.ice : r.T]), c, 2.2); });
      if (p.device === 'cooker') P.hline(100, g.alpha(T['text-2'], 0.5), [2, 3]);
      P.vline(S.ts / 3600, g.alpha(T['text-2'], 0.6), [2, 3]);
    });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), T = g.theme;
    if (p.setup === 'materials') {
      const ks = Object.keys(INSUL).filter(k => k !== 'alu'), vals = ks.map(k => 0.01 / INSUL[k].k);
      const P = g.Plot({ xmin: -0.5, xmax: ks.length - 0.5, ymin: 0, ymax: Math.max(...vals) * 1.15, pad: { t: 14 }, xlabel: '', ylabel: 'R of 1 cm (m²K/W)', xticks: ks.map((_, i) => i), xfmt: v => (INSUL[ks[Math.round(v)]] || { name: '' }).name.split(' ').slice(-1)[0], yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => vals.forEach((v, i) => P.area([[i - 0.32, v], [i + 0.32, v]], 0, g.alpha(ks[i] === p.pmat ? '#FFD36B' : MCOL[ks[i]], 0.85))));
      vals.forEach((v, i) => P.tag(i, v + Math.max(...vals) * 0.03, 'k ' + INSUL[ks[i]].k, T['text-2'], 'center'));
      return;
    }
    if (p.setup === 'define') {
      const pts = spaceOf(S), Kk = K.plotKey(g, [{ c: '#9FE0A8', label: 'meets the criterion and budget', dot: true }, { c: '#8E98A6', label: 'fails one', dot: true }]);
      const ymax = p.device === 'cooler' ? 75 : 105;
      const P = g.Plot({ xmin: 0, xmax: Math.max(p.maxm * 1.4, ...pts.map(q => q.mass)) * 1.05, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'mass (kg)', ylabel: p.device === 'cooler' ? 'hours of ice' : 'hottest water (°C)', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.vline(p.maxm, '#FFD27A', [4, 3]); P.hline(p.device === 'cooler' ? p.tH : p.tT, '#9FE0A8', [4, 3]); pts.forEach(q => { const ok = q.perf >= (p.device === 'cooler' ? p.tH : p.tT) && q.cost <= p.budget && q.mass <= p.maxm; P.dot(q.mass, q.perf, 3.5, ok ? '#9FE0A8' : '#8E98A6'); }); });
      P.tag(p.maxm, ymax * 0.95, 'mass limit', '#FFD27A', 'right');
      Kk.draw(P); return;
    }
    if (p.setup === 'build') {
      // the temperature through the wall, layer by layer, for the test's ΔT
      const W0 = wallU({ mat: p.mat, cm: p.cm, foil: p.foil }), Tin = p.device === 'cooler' ? 0 : 90, Tout = p.Ta, q = (Tout - Tin) / W0.R;
      let x = 0, T0 = Tout; const pts = [[0, Tout]];
      const thick = [1, p.cm, 0.3, 1], order = W0.layers.slice().reverse();
      order.forEach((l, i) => { T0 -= q * l.R; x += thick[i]; pts.push([x, T0]); });
      const P = g.Plot({ xmin: 0, xmax: x, ymin: Math.min(Tin, Tout) - 3, ymax: Math.max(Tin, Tout) + 3, pad: { t: 14 }, xlabel: 'outside → inside (cm; the films drawn 1 cm wide)', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.area([[1, Math.max(Tin, Tout) + 3], [1 + p.cm, Math.max(Tin, Tout) + 3]], Math.min(Tin, Tout) - 3, g.alpha(MCOL[p.mat], 0.18)); P.line(pts, '#FF7A45', 2.4); pts.forEach(q2 => P.dot(q2[0], q2[1], 3, '#FF7A45')); });
      P.tag(1 + p.cm / 2, (Tin + Tout) / 2, 'most of the drop is in the insulation', T['text-3'], 'center');
      return;
    }
    if (p.setup === 'test') {
      const R = runFor(S, 'A');
      if (p.device === 'cooler') {
        const Kk = K.plotKey(g, [{ c: '#FF7A45', label: 'through the walls (kJ)' }, { c: '#FFB27A', label: 'past the seal (kJ)' }, { c: '#9FE0F8', label: 'inside °C', dash: [4, 3] }]);
        const ymax = Math.max(...R.rows.map(r => Math.max(r.Qw, r.Ql))) / 1000 * 1.1 + 1;
        const P = g.Plot({ xmin: 0, xmax: 72, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'hours', ylabel: 'kJ · °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(R.rows.map(r => [r.t / 3600, r.Qw / 1000]), '#FF7A45', 2); P.line(R.rows.map(r => [r.t / 3600, r.Ql / 1000]), '#FFB27A', 2); P.line(R.rows.map(r => [r.t / 3600, r.T]), '#9FE0F8', 1.4, [4, 3]); P.hline(p.ice * 334, g.alpha(T['text-2'], 0.5), [2, 3]); });
        P.tag(1, p.ice * 334 + ymax * 0.03, 'what melts all the ice', T['text-3']);
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ c: '#FFE98A', label: 'sunlight absorbed' }, { c: '#FF7A45', label: 'lost through the glazing' }, { c: '#B07060', label: 'lost through the walls' }]);
      const ymax = Math.max(...R.rows.map(r => r.Qin)) / 1000 * 1.1;
      const P = g.Plot({ xmin: 0, xmax: 6, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'hours from 10:00', ylabel: 'kJ', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(R.rows.map(r => [r.t / 3600, r.Qin / 1000]), '#FFE98A', 2); P.line(R.rows.map(r => [r.t / 3600, r.Qtop / 1000]), '#FF7A45', 2); P.line(R.rows.map(r => [r.t / 3600, r.Qwall / 1000]), '#B07060', 2); });
      Kk.draw(P); return;
    }
    if (p.setup === 'compare') {
      const RA = runFor(S, 'A'), RB = runFor(S, 'B'), cats = ['performance', 'cheapness', 'lightness'];
      const perfA = Math.min(1, (p.device === 'cooler' ? RA.hoursIce / 72 : RA.peak / 100)), perfB = Math.min(1, (p.device === 'cooler' ? RB.hoursIce / 72 : RB.peak / 100));
      const vA = [perfA, Math.max(0, 1 - RA.D.cost / 60), Math.max(0, 1 - RA.D.mass / 20)], vB = [perfB, Math.max(0, 1 - RB.D.cost / 60), Math.max(0, 1 - RB.D.mass / 20)];
      const Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'design A', box: true }, { c: '#9FE0A8', label: 'design B', box: true }]);
      const P = g.Plot({ xmin: -0.5, xmax: 2.5, ymin: 0, ymax: 1.1, pad: { t: Kk.t }, xlabel: '', ylabel: 'score (1 = best)', xticks: [0, 1, 2], xfmt: v => cats[Math.round(v)] || '', yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => cats.forEach((_, i) => { P.area([[i - 0.32, vA[i]], [i - 0.02, vA[i]]], 0, g.alpha('#FF8A5A', 0.8)); P.area([[i + 0.02, vB[i]], [i + 0.32, vB[i]]], 0, g.alpha('#9FE0A8', 0.8)); }));
      Kk.draw(P); return;
    }
    const RA = runFor(S, 'A'), RB = runFor(S, 'fixed'), LA = leaks(p, RA.d), LB = leaks(p, RB.d);
    const Kk = K.plotKey(g, [{ c: '#FF8A5A', label: 'before', box: true }, { c: '#9FE0A8', label: 'after', box: true }]);
    const ymax = Math.max(...LA.map(l => l[1]), ...LB.map(l => l[1])) * 1.15;
    const P = g.Plot({ xmin: -0.5, xmax: LA.length - 0.5, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'heat path', ylabel: 'W per K of difference', xticks: LA.map((_, i) => i), xfmt: v => (LA[Math.round(v)] || [''])[0], yfmt: v => v.toFixed(2) }).frame();
    P.clip(() => LA.forEach((l, i) => { P.area([[i - 0.32, l[1]], [i - 0.02, l[1]]], 0, g.alpha('#FF8A5A', 0.8)); P.area([[i + 0.02, LB[i][1]], [i + 0.32, LB[i][1]]], 0, g.alpha('#9FE0A8', 0.8)); }));
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'materials') {
      const T0 = panelTest({ mat: p.pmat, cm: p.pcm, foil: p.pfoil, Th: p.pTh });
      return [{ label: 'U = 1/ΣR', value: T0.U.toFixed(3), unit: 'W/m²K', flag: 'accent' }, { label: 'R total', value: T0.W.R.toFixed(3), unit: 'm²K/W' }, { label: 'R of the panel L/k', value: T0.W.layers[1].R.toFixed(3), unit: 'm²K/W' },
        { label: 'Flux U·ΔT', value: T0.flux.toFixed(1), unit: 'W/m²' }, { label: 'Through the 30 cm panel', value: T0.q.toFixed(2), unit: 'W' }, { label: 'Conductivity k', value: INSUL[p.pmat].k, unit: 'W/m·K' }, { label: 'Cost per m²', value: '$' + (INSUL[p.pmat].cost * p.pcm + (p.pfoil ? FOIL.cost : 0)).toFixed(2) }];
    }
    const R = runFor(S, 'A'), m = meets(p, R), out = [];
    if (p.device === 'cooler') out.push({ label: 'Ice lasts', value: hh(R.hoursIce), flag: m.perf ? 'ok' : 'crit', hint: 'target ' + p.tH + ' h' }, { label: 'Walls U·A', value: R.D.UA.toFixed(3), unit: 'W/K' }, { label: 'Seal leak', value: R.D.seal.toFixed(2), unit: 'W/K' }, { label: 'Heat in at 0 °C inside', value: ((R.D.UA + R.D.seal) * p.Ta).toFixed(1), unit: 'W' });
    else out.push({ label: 'Hottest water', value: R.peak.toFixed(1), unit: '°C', flag: m.perf ? 'ok' : 'crit', hint: 'target ' + p.tT + ' °C' }, { label: 'Boils after', value: R.boiled == null ? 'never' : (R.boiled / 60).toFixed(0), unit: R.boiled == null ? '' : 'min' }, { label: 'Gain at noon', value: (p.sunC * COOK.ap * REFL[p.refl].C * GLAZE[p.glaze].tau * ABSB[p.absb].a).toFixed(0), unit: 'W' }, { label: 'Glazing loss', value: (GLAZE[p.glaze].U * COOK.ap).toFixed(2), unit: 'W/K' });
    out.push({ label: 'Cost', value: '$' + R.D.cost.toFixed(2), flag: m.cost ? 'ok' : 'crit' }, { label: 'Mass', value: R.D.mass.toFixed(2), unit: 'kg', flag: m.mass ? 'ok' : 'crit' });
    if (p.setup === 'compare' || p.setup === 'redesign') { const RB = runFor(S, p.setup === 'compare' ? 'B' : 'fixed'); out.push({ label: p.setup === 'compare' ? 'Design B' : 'After the fix', value: p.device === 'cooler' ? hh(RB.hoursIce) : RB.peak.toFixed(1) + ' °C', flag: 'accent', hint: '$' + RB.D.cost.toFixed(2) + ' · ' + RB.D.mass.toFixed(2) + ' kg' }); }
    return out;
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'materials') { const T0 = panelTest({ mat: p.pmat, cm: p.pcm, foil: p.pfoil, Th: p.pTh }); return E.v('U') + ' ' + E.op('=') + ' ' + E.frac('1', '1/' + E.v('h') + E.sub('i') + ' + ' + E.v('L') + '/' + E.v('k') + ' + ' + E.v('L') + E.sub('shell') + '/' + E.v('k') + E.sub('shell') + ' + 1/' + E.v('h') + E.sub('o')) + ' ' + E.op('=') + ' ' + E.frac('1', T0.W.layers.map(l => l.R.toFixed(3)).join(' + ')) + ' ' + E.op('=') + ' ' + E.n(T0.U.toFixed(3), 'W/m²K'); }
    const R = runFor(S, 'A');
    if (p.device === 'cooler') return E.v('t') + E.sub('ice') + ' ' + E.op('=') + ' ' + E.frac(E.v('m') + E.v('L') + E.sub('f'), '(' + E.v('UA') + ' + ' + E.v('G') + E.sub('seal') + ')Δ' + E.v('T')) + ' ' + E.op('=') + ' ' + E.frac(E.n(p.ice, 'kg') + ' × 334 kJ/kg', '(' + E.n(R.D.UA.toFixed(3)) + ' + ' + E.n(R.D.seal.toFixed(2)) + ') W/K × ' + E.n(p.Ta, 'K')) + ' ' + E.op('≈') + ' ' + E.n((p.ice * LF / ((R.D.UA + R.D.seal) * p.Ta) / 3600).toFixed(1), 'h');
    return E.v('T') + E.sub('max') + ' − ' + E.v('T') + E.sub('air') + ' ' + E.op('=') + ' ' + E.frac(E.v('G') + E.v('A') + '·' + E.v('C') + '·τ·α', E.v('U') + E.sub('top') + E.v('A') + ' + ' + E.v('UA') + E.sub('walls')) + ' ' + E.op('=') + ' ' + E.frac(E.n(p.sunC) + ' × 0.25 × ' + REFL[p.refl].C + ' × ' + GLAZE[p.glaze].tau + ' × ' + ABSB[p.absb].a, (GLAZE[p.glaze].U * COOK.ap).toFixed(2) + ' + ' + (R.D.UA * 0.6 + R.D.seal).toFixed(2)) + ' ' + E.op('=') + ' ' + E.n((p.sunC * COOK.ap * REFL[p.refl].C * GLAZE[p.glaze].tau * ABSB[p.absb].a / (GLAZE[p.glaze].U * COOK.ap + R.D.UA * 0.6 + R.D.seal)).toFixed(0), 'K') + ' (if it did not boil)';
  }
  const EQ_NOTE = {
    materials: 'An insulator’s job is done by trapped, still air (k = 0.026 W/m·K); the solid only stops the air from moving. The thin air films on each face add a fixed resistance, so even a metal sheet has U ≈ 4 W/m²K, not infinity.',
    define: 'The criterion is what the device must achieve; the constraints are the limits on how (cost, mass). Every dot is a full run of a design. Only the green corner meets the brief — and usually more than one design does, which is where the trade-offs start.',
    build: 'The walls are resistances in series; the lid seal is a leak in parallel with them. A thick wall with a loose lid is like a strong bucket with a hole: the seal can let in more than all the walls together.',
    test: 'The time the ice lasts is the energy it can absorb (mL_f) divided by the rate heat gets in. That rate is set by the temperature difference and the conductances — not by the ice, which sits at 0 °C until it has all melted.',
    compare: 'A better device usually costs more or weighs more. A decision matrix makes the trade-off visible; the brief decides which criteria matter most.',
    redesign: 'Fix the biggest leak first: a 3 cm thicker wall does little when most of the heat comes past the lid. The evidence (the leak breakdown) tells you which change is worth its cost.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const insOpts = keys => keys.map(k => ({ value: k, label: INSUL[k].name[0].toUpperCase() + INSUL[k].name.slice(1) + ' (k ' + INSUL[k].k + ')' }));
  L.register({
    id: 'g6c-design-studio',
    grade: 6, unit: '6C', topics: ['C5'],
    subject: 'engineering',
    chapter: 'Energy, Heat and Thermal Systems',
    name: 'The Thermal Design Studio — Coolers and Solar Cookers',
    exams: ['NGSS MS-PS3-3', 'NGSS MS-ETS1-1', 'NGSS MS-ETS1-2', 'NGSS MS-ETS1-3', 'NGSS MS-ETS1-4', 'CAST'],
    weight: 'Design challenge',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the bench · scroll to zoom · drag the yellow ring on the wall to change its thickness',
    lede: 'Two engineering briefs, one method. Keep <b>ice frozen in a cooler box</b> for a day, or <b>boil water in a solar cooker</b> by mid-afternoon — within a budget and a mass limit. Test materials on a hot-plate rig and measure their <b>U-values</b>; see the whole design space at once; build the walls layer by layer and watch where the heat gets in; ' +
      'run the device for hours as a real <b>thermal-resistance network</b> with latent heat, sunshine and leaks; compare two designs in a decision matrix; then let the evidence point to the biggest leak and fix it.',
    params: preset({}),
    presets: [
      { name: 'Polystyrene 5 cm, loose lid', params: preset({}) },
      { name: 'Polystyrene 5 cm with a gasket', params: preset({ seal: 'good' }) },
      { name: 'A cardboard cooler', params: preset({ mat: 'card', cm: 3 }) },
      { name: 'Polyurethane 6 cm, foil and gasket', params: preset({ mat: 'pu', cm: 6, foil: true, seal: 'good' }) },
      { name: 'A dark lid in the sun', params: preset({ setup: 'test', seal: 'good', lid: 'dark', Gpk: 900 }) },
      { name: 'Test: the loose-lid cooler for 3 days', params: preset({ setup: 'test' }) },
      { name: 'Compare yours with the premium cooler', params: preset({ setup: 'compare', alt: 'premium' }) },
      { name: 'Redesign: fix the biggest leak', params: preset({ setup: 'redesign' }) },
      { name: 'Define: a 24-hour cooler for $15', params: preset({ setup: 'define', budget: 15, tH: 24 }) },
      { name: 'A box solar cooker', params: preset({ device: 'cooker', mat: 'card', cm: 3, foil: true, seal: 'good' }) },
      { name: 'A cooker with no glass', params: preset({ setup: 'test', device: 'cooker', mat: 'card', cm: 3, foil: true, seal: 'good', glaze: 'none', refl: 0 }) },
      { name: 'A shiny pot in the cooker', params: preset({ setup: 'test', device: 'cooker', mat: 'card', cm: 3, foil: true, seal: 'good', absb: 'shiny' }) },
      { name: 'Test the materials: polystyrene', params: preset({ setup: 'materials' }) },
      { name: 'Test the materials: a foil-lined air gap', params: preset({ setup: 'materials', pmat: 'air', pcm: 2, pfoil: true }) }
    ],
    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Stage of the design', restructure: true, options: SETUPS },
        { key: 'device', type: 'select', label: 'Device', restructure: true, when: S => S.p.setup !== 'materials', options: [{ value: 'cooler', label: 'Cooler box' }, { value: 'cooker', label: 'Box solar cooker' }] }] },
      { group: 'The test panel', when: is('materials'), items: [
        { key: 'pmat', type: 'select', label: 'Material', restructure: true, options: insOpts(Object.keys(INSUL)) },
        { key: 'pcm', label: 'Thickness', min: 0.3, max: 10, step: 0.1, unit: 'cm', fmt: v => v.toFixed(1), restructure: true },
        { key: 'pfoil', type: 'toggle', label: 'Foil facing', restructure: true },
        { key: 'pTh', label: 'Hot side', min: 30, max: 90, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true }] },
      { group: 'The brief', when: is('define'), items: [
        { key: 'tH', label: 'Ice must last', min: 6, max: 72, step: 1, unit: 'h', fmt: v => v.toFixed(0), restructure: true, when: dev('cooler') },
        { key: 'tT', label: 'Water must reach', min: 60, max: 100, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true, when: dev('cooker') },
        { key: 'budget', label: 'Budget', min: 5, max: 60, step: 1, unit: '$', fmt: v => '$' + v.toFixed(0), restructure: true },
        { key: 'maxm', label: 'Mass limit', min: 2, max: 20, step: 0.5, unit: 'kg', fmt: v => v.toFixed(1), restructure: true }] },
      { group: 'The walls', when: is('define', 'build', 'test', 'compare', 'redesign'), items: [
        { key: 'mat', type: 'select', label: 'Insulation', restructure: true, options: insOpts(['foam', 'pu', 'wool', 'card', 'newspaper', 'wood', 'air']) },
        { key: 'cm', label: 'Thickness', min: 1, max: 10, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: true },
        { key: 'foil', type: 'toggle', label: 'Foil liner', restructure: true },
        { key: 'seal', type: 'select', label: 'Lid seal', restructure: true, options: Object.keys(SEALS).map(k => ({ value: k, label: SEALS[k].name[0].toUpperCase() + SEALS[k].name.slice(1) })) },
        { key: 'lid', type: 'select', label: 'Lid colour', restructure: true, when: dev('cooler'), options: Object.keys(LIDS).map(k => ({ value: k, label: LIDS[k].name[0].toUpperCase() + LIDS[k].name.slice(1) })) }] },
      { group: 'The cooker', when: S => S.p.setup !== 'materials' && S.p.device === 'cooker', items: [
        { key: 'glaze', type: 'select', label: 'Glazing', restructure: true, options: Object.keys(GLAZE).map(k => ({ value: k, label: GLAZE[k].name[0].toUpperCase() + GLAZE[k].name.slice(1) })) },
        { key: 'refl', type: 'select', label: 'Reflectors', restructure: true, options: [0, 1, 4].map(k => ({ value: k, label: REFL[k].name[0].toUpperCase() + REFL[k].name.slice(1) })) },
        { key: 'absb', type: 'select', label: 'Pot', restructure: true, options: Object.keys(ABSB).map(k => ({ value: k, label: ABSB[k].name[0].toUpperCase() + ABSB[k].name.slice(1) })) }] },
      { group: 'Test conditions', when: is('define', 'test', 'compare', 'redesign'), items: [
        { key: 'Ta', label: 'Air temperature', min: 15, max: 40, step: 1, unit: '°C', fmt: v => v.toFixed(0), restructure: true },
        { key: 'ice', label: 'Ice', min: 0.5, max: 5, step: 0.1, unit: 'kg', fmt: v => v.toFixed(1), restructure: true, when: dev('cooler') },
        { key: 'Gpk', label: 'Sun on the lid at noon', min: 0, max: 1000, step: 10, unit: 'W/m²', fmt: v => v.toFixed(0) + (v ? '' : ' (shade)'), restructure: true, when: dev('cooler') },
        { key: 'sunC', label: 'Sunshine at noon', min: 300, max: 1100, step: 10, unit: 'W/m²', fmt: v => v.toFixed(0), restructure: true, when: dev('cooker') }] },
      { group: 'Compare with', when: is('compare'), items: [
        { key: 'alt', type: 'select', label: 'Design B', restructure: true, options: ['cheap', 'standard', 'premium'].map(k => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })) }] },
      { group: 'The fix', when: is('redesign'), items: [
        { key: 'fix', type: 'select', label: 'Change', restructure: true, options: [{ value: 'auto', label: 'Fix the biggest leak' }, { value: 'seal', label: 'Fit a gasket' }, { value: 'thicker', label: '3 cm more insulation' }, { value: 'foil', label: 'Add a foil liner' }, { value: 'lid', label: 'Paint the lid white' }, { value: 'glaze', label: 'Better glazing' }, { value: 'refl', label: 'More reflectors' }, { value: 'absb', label: 'A black pot' }] }] }
    ],
    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    onDrag(S, e) {
      if (e.id !== 'cm' || !S._ax) return;
      const along = e.dx * S._ax.ux + e.dy * S._ax.uy;                          // the drawn edge spans 1–10 cm over its length: a direct map, gain 1
      S.p.cm = clamp(Math.round((S.p.cm + along / S._ax.len * 9) * 2) / 2, 1, 10);
      this.setup(S);
    },
    plots: [
      { title: S => ({ materials: 'U-value against thickness, every material', define: 'The design space: performance against cost', build: 'Where the heat gets in', test: S.p.device === 'cooler' ? 'Ice left, hour by hour' : 'The water, hour by hour', compare: 'Two designs, the same test', redesign: 'Before and after the fix' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ materials: 'Resistance of one centimetre', define: 'The design space: performance against mass', build: 'Temperature through the wall', test: 'The energy ledger', compare: 'The decision matrix', redesign: 'Each heat path, before and after' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],
    problems: [
      { source: 'NGSS MS-PS3-3 · CAST pattern: comparing materials with data',
        q: 'A 5 cm panel of expanded polystyrene (k = 0.035 W/m·K) sits on the test rig, with air films of 8 W/m²K on both faces. What is its U-value?',
        params: preset({ setup: 'materials' }),
        predict: { label: 'U', unit: 'W/m²K', tol: 0.02 },
        measure: S => panelTest({ mat: S.p.pmat, cm: S.p.pcm, foil: S.p.pfoil, Th: S.p.pTh }).U,
        working: 'R = 1/8 + 0.05/0.035 + 0.003/0.20 + 1/8 = 0.125 + 1.429 + 0.015 + 0.125 = 1.694 m²K/W, so U = 1/R = <b>0.590 W/m²K</b>.' },
      { source: 'NGSS MS-PS3-3 · CAST pattern: testing a device',
        q: 'The polystyrene cooler (5 cm walls, U·A 0.28 W/K) has a loose lid that leaks 0.60 W/K. It holds 2 kg of ice in 30 °C shade. How long does the ice last?',
        params: preset({ setup: 'test' }),
        predict: { label: 'time', unit: 'h', tol: 0.04 },
        measure: S => runFor(S, 'A').hoursIce,
        working: 'Heat comes in at (0.28 + 0.60) × 30 ≈ 26 W. Melting 2 kg takes 2 × 334 000 = 668 kJ: 668 000 ÷ 26 ≈ 25 000 s ≈ <b>7.0 h</b>.' },
      { source: 'NGSS MS-ETS1-4 · CAST pattern: iterating on evidence',
        q: 'The evidence shows the loose lid lets in more heat than all the walls. With a rubber gasket (0.06 W/K) instead, how long does the ice last?',
        params: preset({ setup: 'redesign' }),
        predict: { label: 'time', unit: 'h', tol: 0.04 },
        measure: S => runFor(S, 'fixed').hoursIce,
        working: '(0.28 + 0.06) × 30 ≈ 10 W, and 668 000 ÷ 10 ≈ 66 000 s ≈ <b>18.4 h</b> — more than twice as long, for a $6 gasket. Adding 3 cm more polystyrene instead would barely help while the lid leaks.' },
      { source: 'NGSS MS-ETS1-3 · CAST pattern: analysing a design',
        q: 'A box solar cooker: single glass, one reflector (×1.45), a black pot, 900 W/m² at noon, starting at 10:00 with 1 kg of water at 30 °C. How long until it boils?',
        params: preset({ setup: 'test', device: 'cooker', mat: 'card', cm: 3, foil: true, seal: 'good' }),
        predict: { label: 'time to boil', unit: 'min', tol: 0.05 },
        measure: S => runFor(S, 'A').boiled / 60,
        working: 'At 10:00 the sun gives 780 W/m²; through the 0.25 m² aperture, ×1.45, ×0.85 for the glass and ×0.95 for the black pot: about 230 W in, rising toward noon. Water, pot and box need about 7.3 kJ per kelvin and lose about 1.6 W/K. It boils after about <b>50 min</b>.' }
    ],
    walkthrough: [
      { title: 'What makes a good insulator?', ask: 'Rank polystyrene, wool, cardboard, wood and an air gap for U at 5 cm.',
        reveal: '<b>Polyurethane and polystyrene best, then wool, cardboard, newspaper, wood.</b> The best all trap still air in tiny cells. A plain air gap convects and radiates — line it with foil and it improves sharply.', params: preset({ setup: 'materials' }) },
      { title: 'Define before you build', ask: 'A 24-hour cooler under $15 and 6 kg. Which dots in the design space qualify?',
        reveal: '<b>Only the green corner: thick polystyrene or polyurethane with a gasket.</b> The criterion and the two constraints together rule out most designs.', params: preset({ setup: 'define', budget: 15, tH: 24, seal: 'good' }) },
      { title: 'Where does the heat get in?', ask: 'The 5 cm polystyrene cooler has a loose lid. Walls or lid — which lets in more?',
        reveal: '<b>The lid: about two-thirds of the heat.</b> The walls are good; the gap around the lid is not. Engineers fix the weakest path first.', params: preset({}) },
      { title: 'Test it', ask: 'Run the loose-lid cooler. How long does 2 kg of ice last at 30 °C?',
        reveal: '<b>About 7 hours.</b> The ice holds the inside at 0 °C while it melts; then the drinks warm quickly.', params: preset({ setup: 'test' }) },
      { title: 'Compare', ask: 'Your cooler against the premium one. Is premium always the right choice?',
        reveal: '<b>Not if the brief caps cost or mass.</b> The decision matrix shows what each gains and gives up.', params: preset({ setup: 'compare', alt: 'premium', seal: 'good' }) },
      { title: 'Redesign from evidence', ask: 'One change, chosen by the evidence. Which, and how much better?',
        reveal: '<b>A gasket: 7 hours becomes 18.</b> Thicker walls with the leak left in would add under an hour.', params: preset({ setup: 'redesign' }) }
    ],
    quiz: [
      { q: 'The best insulating materials work mainly by…', options: ['being heavy', 'trapping still air', 'being shiny', 'being cold'], answer: 1,
        why: 'Still air conducts heat very poorly (k = 0.026 W/m·K); foams and wool keep it from moving.' },
      { q: 'A cooler has thick walls but a loose lid. The best first improvement is…', options: ['thicker walls', 'a better lid seal', 'a darker colour', 'more ice only'], answer: 1,
        why: 'The leak past the lid is the largest heat path; fixing it more than doubles the ice time.' },
      { q: 'In a design brief, “must cost less than $15” is…', options: ['a criterion', 'a constraint', 'a test result', 'a material'], answer: 1,
        why: 'Criteria say what success is; constraints limit the ways you may achieve it.' },
      { q: 'A solar cooker with no glass cover…', options: ['heats faster', 'loses heat to the air quickly and stays cooler', 'works only at night', 'is the same as one with glass'], answer: 1,
        why: 'The glass lets sunlight in and keeps warm air (and much infrared) from escaping.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Building insulation</b> is specified by U-values; the same series-resistance arithmetic sets the thickness of loft insulation and the glazing of windows.</li>' +
      '<li><b>Vaccine carriers and medical cool boxes</b> are designed to keep vaccines between 2 and 8 °C for days, with ice packs and polyurethane walls.</li>' +
      '<li><b>Box solar cookers</b> pasteurise water and cook food across sunny regions; single glazing and one reflector reach 100 °C on a clear day.</li></ul>' +
      '<b>What the lab assumes.</b> Walls are 1D resistances in series (air films 6 and 9 W/m²K, a 3 mm polypropylene shell) over the box’s mean area; an air gap adds radiation across it, a foil liner cuts it; the lid seal is an air leak in parallel. The cooler’s ice stays at 0 °C until it has all melted (334 kJ/kg). The cooker’s pot, water and box are one node; sunlight follows a 12-hour arc; glazing transmits 85 % (single) or 74 % (double) and loses 6 or 3 W/m²K. Costs and masses are typical retail figures.' +
      '<div class="pyq"><em>Misconception to catch</em> “Insulation keeps the cold in” and “thicker is always better.” Insulation slows energy getting in (or out); and the biggest leak — often the lid — matters far more than extra thickness elsewhere.</div>'
  });

  const MODEL = Object.assign({}, MODEL0, { BASE: () => preset({}), SETUPS, ALTS, leaks, fixOf });
  L.models = L.models || {};
  L.models['g6c-design-studio'] = MODEL;
})(window.InsightLab);
