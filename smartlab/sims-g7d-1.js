/* ============================================================
   GRADE 7 · UNIT D · MATTER AND ENERGY IN ECOSYSTEMS
   7D-1  Populations and Limits
   (D1.1 Limiting resources · D1.2 Carrying capacity · D1.3 Reading real
    population data · D1.4 Predicting the response to scarcity ·
    D1.5 Competition for the same limiting resource)

   Five experiments, each a real model integrated as it runs:
     limits      — duckweed (Lemna minor) in a jar under a grow light. Each
                   frond is built from nitrogen and phosphorus taken out of
                   the water and needs its own patch of surface; growth is
                   the maximum rate × temperature (cardinal model) × light
                   (saturation) × the SCARCEST of nitrogen, phosphorus and
                   space (Liebig). The ceiling is whichever runs out first.
     capacity    — Gause's Paramecium cultures: the animals eat bacteria
                   that are renewed every day; growth slows as food per
                   animal falls (a consumer–resource model), so the S-curve
                   and the carrying capacity K emerge — set to Gause's
                   measured r and K (P. aurelia 1.124 a day and 105, P.
                   caudatum 0.794 and 64 in 0.5 cm³). Counts are real
                   samples, with Poisson scatter.
     data        — real counts: Carlson's yeast (1913), the St Matthew
                   Island reindeer (Klein 1968), or your own jar; fit a
                   logistic curve by hand, and read r and K off a plot of
                   growth per individual against numbers.
     scarcity    — the St Matthew Island reindeer: 29 landed in 1944, about
                   6 000 by 1963, 42 in 1966. Lichen grows back a few % a
                   year; the herd eats and tramples it faster than that,
                   and one hard winter finds nothing under the snow.
     competition — Gause's tubes: two species alone and together. Both eat
                   the same bacteria; the one that can live on less food
                   (the lower R*) takes it all. Give one a second food on
                   the bottom (yeast, as P. bursaria uses) and they share.
   Registration and every model load without a page (the tests run them in
   a bare VM); only the drawing uses window.G7D, CELL, MEAS, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, G = () => window.G7D, CE = () => window.CELL, ME = () => window.MEAS;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  function poisson(lam, r) {                       // Knuth for small means, normal approximation above 40
    if (lam <= 0) return 0;
    if (lam > 40) { const u = Math.max(1e-9, r()), v = r(); return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v))); }
    let k = 0, p = 1; const Lm = Math.exp(-lam); do { k++; p *= r(); } while (p > Lm); return k - 1;
  }

  /* ============================================================
     LIMITS — duckweed in a jar
     ============================================================ */
  const LEM = {
    area: 0.09,      // cm² of water surface one frond covers (4 × 3 mm)
    qN: 4.0,         // µg of nitrogen in one frond (0.1 mg dry mass × 4 % N)
    qP: 0.6,         // µg of phosphorus (0.6 %)
    rmax: 0.35,      // per day: a frond doubles in 2 days at best (Lemna minor, 25 °C)
    KN: 0.05, KP: 0.008,   // mg/L at which uptake runs at half speed
    KI: 60,          // µmol photons m⁻² s⁻¹ for half the light-limited rate
    I10: 1000,       // the panel's light at 10 cm
    Tmin: 5, Topt: 26, Tmax: 34
  };
  const lampI = h => LEM.I10 * Math.pow(10 / Math.max(3, h), 2);
  /* the cardinal temperature model (Rosso 1993): 0 at Tmin and Tmax, 1 at Topt */
  function ctmi(T, a, o, b) {
    if (T <= a || T >= b) return 0;
    const num = (T - b) * (T - a) * (T - a), den = (o - a) * ((o - a) * (T - o) - (o - b) * (o + a - 2 * T));
    return clamp(num / den, 0, 1);
  }
  const jarArea = d => Math.PI * d * d / 4;        // cm²
  function lemCeil(p) {
    return { N: p.start + p.nit * p.vol * 1000 / LEM.qN, P: p.start + p.phos * p.vol * 1000 / LEM.qP, S: jarArea(p.dia) / LEM.area };
  }
  function lemStart(p) { return { t: 0, F: p.start, N: p.nit * p.vol, P: p.phos * p.vol }; }
  function lemFactors(p, J) {
    const cN = J.N / p.vol, cP = J.P / p.vol, cover = J.F * LEM.area / jarArea(p.dia), I = lampI(p.lampH);
    const fN = cN / (cN + LEM.KN), fP = cP / (cP + LEM.KP), fS = Math.max(0, 1 - cover * cover * cover), fI = I / (I + LEM.KI), fT = ctmi(p.temp, LEM.Tmin, LEM.Topt, LEM.Tmax);
    const m = Math.min(fN, fP, fS), lim = m === fS ? 'space' : m === fN ? 'nitrogen' : 'phosphorus';
    return { fN, fP, fS, fI, fT, m, lim, cover, I, r: LEM.rmax * fT * fI * m };
  }
  function lemStep(J, p, dt) {
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(0.05, left), f = lemFactors(p, J);
      let dF = f.r * J.F * h;
      dF = Math.min(dF, J.N * 1000 / LEM.qN, J.P * 1000 / LEM.qP);
      J.F += dF; J.N = Math.max(0, J.N - dF * LEM.qN / 1000); J.P = Math.max(0, J.P - dF * LEM.qP / 1000);
      J.t += h; left -= h;
    }
    return J;
  }
  function lemRun(p, days) { const J = lemStart(p); lemStep(J, p, days); return J; }

  /* ============================================================
     CAPACITY and COMPETITION — Gause's Paramecium cultures
     A consumer–resource model: bacteria B (millions per mL) are renewed at
     D a day toward the supply Bs; yeast Y settles on the bottom. Each
     species i eats at c·f with f = w·B/(B+h) + (1−w)·Y/(Y+h), and grows at
     µ·f − m. Its R* = h·m/(µ − m) is the food it can just live on.
     aurelia and caudatum are set so that, alone in Gause's standard medium,
     they grow at r = 1.124 and 0.794 a day to K = 105 and 64 (Gause 1934).
     ============================================================ */
  const B_STD = 30, D_STD = 1;
  function calib(r0, K, h, m) { const mu = (r0 + m) * (B_STD + h) / B_STD, f = m / mu, Rs = h * m / (mu - m); return { mu, m, h, c: D_STD * (B_STD - Rs) / (f * K), w: 1 }; }
  const SPEC = {
    aurelia: Object.assign(calib(1.124, 105, 2, 0.5), { name: 'P. aurelia', len: 120, col: '#F2D29A' }),
    caudatum: Object.assign(calib(0.794, 64, 3.2, 0.5), { name: 'P. caudatum', len: 220, col: '#8FD4FA' }),
    bursaria: { mu: 1.3, m: 0.32, h: 4, c: 2.2, w: 0.15, name: 'P. bursaria', len: 110, col: '#7CDB8A' }
  };
  const PAIRS = { ac: ['aurelia', 'caudatum'], cb: ['caudatum', 'bursaria'], ab: ['aurelia', 'bursaria'] };
  const q10 = T => Math.pow(2, (T - 26) / 10);
  /* the bacteria level at which the species just replaces its deaths, living on bacteria alone (P. bursaria cannot: it needs its yeast) */
  const rStar = (k, T, H) => { const s = SPEC[k], th = q10(T), x = (s.m * th + (H || 0)) / (s.mu * th * s.w); return x < 1 ? s.h * x / (1 - x) : Infinity; };
  const fmtR = v => isFinite(v) ? v.toFixed(2) : '∞ (needs yeast)';
  function supply(p, t) { const cut = p.cut > 0 && t >= p.cut ? 0.5 : 1, food = B_STD * p.food * cut; return { Bs: food * (1 - p.settle), Ys: food * p.settle }; }
  function culStart(p, names, N0) { const s0 = supply(p, 0); return { t: 0, B: s0.Bs, Y: s0.Ys, N: N0.slice(), names: names.slice(), eaten: 0 }; }
  function culStep(C, p, dt, H) {
    const th = q10(p.temp), D = p.renew;
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(0.01, left), s = supply(p, C.t);
      let dB = D * (s.Bs - C.B), dY = D * (s.Ys - C.Y);
      const dN = C.names.map((k, i) => {
        const sp = SPEC[k], fb = C.B / (C.B + sp.h), fy = C.Y / (C.Y + sp.h), f = sp.w * fb + (1 - sp.w) * fy;
        dB -= sp.c * sp.w * fb * C.N[i]; dY -= sp.c * (1 - sp.w) * fy * C.N[i];
        return C.N[i] * (sp.mu * th * f - sp.m * th - (H || 0));
      });
      C.B = Math.max(0, C.B + dB * h); C.Y = Math.max(0, C.Y + dY * h);
      C.N = C.N.map((v, i) => Math.max(0, v + dN[i] * h));
      if (H) C.eaten += C.N.reduce((a, v) => a + v, 0) * H * h;
      C.t += h; left -= h;
    }
    return C;
  }
  function culRun(p, names, N0, days, H) { const C = culStart(p, names, N0); culStep(C, p, days, H); return C; }
  /* one species alone on bacteria: the equilibrium K, and the growth rate at N (food in quasi-steady state) */
  const KMEMO = {};
  function kAlone(k, p, H) {
    const s = SPEC[k], th = q10(p.temp), Bs = supply(p, 0).Bs, D = p.renew;
    if (s.w < 1) { const key = [k, p.food, p.settle, p.renew, p.temp, H].join('|'); if (!(key in KMEMO)) KMEMO[key] = culRun(p, [k], [10], 200, H).N[0]; return KMEMO[key]; }   // two foods: find where it settles
    const Rs = rStar(k, p.temp, H); if (!(Rs < Bs)) return 0;
    const f = (s.m * th + (H || 0)) / (s.mu * th);
    return D * (Bs - Rs) / (s.c * s.w * f);
  }
  function growthAt(k, p, N, H) {
    const s = SPEC[k], th = q10(p.temp), Bs = supply(p, 0).Bs, D = p.renew, c = s.c * s.w * N;
    const b = D * Bs - D * s.h - c, R = (b + Math.sqrt(b * b + 4 * D * D * Bs * s.h)) / (2 * D);
    return N * (s.mu * th * R / (R + s.h) - s.m * th - (H || 0));
  }
  /* exclusion: the day the loser's count falls below 1 in 0.5 cm³, in the mixed tube */
  function exclusionDay(p) {
    const C = culStart(p, PAIRS[p.pair], [p.nA, p.nB]);
    for (let d = 1; d <= 60; d++) { culStep(C, p, 1); if (C.N[0] < 1 || C.N[1] < 1) return d; }
    return Infinity;
  }

  /* ============================================================
     DATA — real counts
     ============================================================ */
  const CARLSON = [9.6, 18.3, 29.0, 47.2, 71.1, 119.1, 174.6, 257.3, 350.7, 441.0, 513.3, 559.7, 594.8, 629.4, 640.8, 651.1, 655.9, 659.6, 661.8].map((y, t) => [t, y]);
  const KLEIN = [[1944, 29], [1957, 1350], [1963, 6000], [1966, 42]];
  function dataset(p) {
    if (p.dset === 'yeast') return { pts: CARLSON, t0: 0, unit: 'h', what: 'yeast (amount)', x: 'hours' };
    if (p.dset === 'reindeer') return { pts: KLEIN, t0: 1944, unit: 'yr', what: 'reindeer', x: 'year' };
    // your own jar: count the fronds every 2 days (each count ±√n)
    const r = rng(77 + p.seed * 31), J = lemStart(p), pts = [[0, poisson(p.start, r)]];
    for (let d = 2; d <= 40; d += 2) { lemStep(J, p, 2); pts.push([d, poisson(J.F, r)]); }
    return { pts, t0: 0, unit: 'd', what: 'fronds', x: 'days' };
  }
  const logi = (K, r, N0, t) => K / (1 + (K / N0 - 1) * Math.exp(-r * t));
  function sse(D, K, r) { const N0 = D.pts[0][1]; return D.pts.reduce((s, [t, y]) => s + Math.pow(y - logi(K, r, N0, t - D.t0), 2), 0); }
  function bestFit(D) {
    const ys = D.pts.map(q => q[1]), kmax = Math.max(...ys);
    let best = { K: kmax, r: 0.1, e: Infinity };
    for (let i = 0; i <= 120; i++) { const K = kmax * (0.6 + 1.4 * i / 120); for (let j = 0; j <= 160; j++) { const r = 0.02 * Math.pow(60, j / 160); const e = sse(D, K, r); if (e < best.e) best = { K, r, e }; } }
    // polish
    for (let it = 0; it < 4; it++) { const dk = best.K * 0.02 / (it + 1), dr = best.r * 0.03 / (it + 1); for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) { const K = best.K + a * dk, r = best.r + b * dr, e = sse(D, K, r); if (r > 0 && K > 0 && e < best.e) best = { K, r, e }; } }
    best.rms = Math.sqrt(best.e / D.pts.length);
    return best;
  }

  /* ============================================================
     SCARCITY — St Matthew Island (Klein 1968)
     A year at a time: lichen L grows back logistically (g a year toward its
     full cover); in winter each reindeer needs about a tonne of it and
     tramples as much again; it can dig out at most 35 % of what lies under
     the snow, and in the winter of 1963–64 only a fraction of that. A
     well-fed cow calves; a hungry one does not and may starve — bulls,
     spent from the rut, starve first.
     ============================================================ */
  const REIN = { need: 1.0, cover: 0.6, tha: 2.4, b: 0.74, d0: 0.05, dig: 0.35, maleX: 1.6, mate: 0.04, year0: 1944, years: 36 };
  const lichenMax = p => p.area * 100 * REIN.cover * REIN.tha;          // tonnes
  function reinStart(p) { const N0 = Math.max(1, Math.round(p.herd0)); return { y: REIN.year0, F: N0 * 0.6, M: N0 * 0.4, L: lichenMax(p), phi: 1, hist: [] }; }
  function reinYear(R, p) {
    const Lmax = lichenMax(p), N = R.F + R.M;
    R.hist.push([R.y, N, R.L / Lmax, R.F, R.M, R.phi]);
    const access = R.y === 1963 ? p.snowK / 100 : 1;
    const avail = R.L * REIN.dig * access, want = N * REIN.need, eaten = Math.min(avail, want), phi = want > 0 ? eaten / want : 1;
    const cond = clamp((phi - 0.5) / 0.5, 0, 1), mated = Math.min(1, R.M / Math.max(1e-9, REIN.mate * R.F));
    const births = R.F * REIN.b * cond * mated;
    const sF = phi >= 1 ? 0 : Math.min(1, Math.pow(1 - phi, 0.6) * 1.05), sM = Math.min(1, sF * REIN.maleX);
    const h = p.hunt / 100;
    R.F = Math.max(0, R.F * (1 - REIN.d0 - sF - h) + births * 0.5);
    R.M = Math.max(0, R.M * (1 - REIN.d0 - sM - h) + births * 0.5);
    if (R.F + R.M < 0.5) { R.F = 0; R.M = 0; }
    R.L = Math.max(0, R.L - eaten * (1 + p.trample));
    R.L = R.L + p.regrow / 100 * R.L * (1 - R.L / Lmax) + 0.001 * Lmax;
    R.phi = phi; R.y++;
    return R;
  }
  function reinRun(p, toYear) { const R = reinStart(p); while (R.y <= toYear) reinYear(R, p); return R; }
  const reinAt = (p, y) => { const R = reinRun(p, y); return R.hist[R.hist.length - 1]; };
  /* the herd the lichen can feed for ever: its fastest regrowth (g·Lmax/4) ÷ what one animal removes */
  const sustainable = p => p.regrow / 100 * lichenMax(p) / 4 / (REIN.need * (1 + p.trample));

  /* ============================================================
     PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'limits', label: 'What runs out first? Duckweed in a jar', teaches: ['D1.1'] },
    { value: 'capacity', label: 'Carrying capacity: Gause’s Paramecium', teaches: ['D1.2', 'D1.4'] },
    { value: 'data', label: 'Reading real counts', teaches: ['D1.3'] },
    { value: 'scarcity', label: 'St Matthew Island: boom and crash', teaches: ['D1.4'] },
    { value: 'competition', label: 'Two species, one food', teaches: ['D1.5'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'limits', lapse: 2, seed: 1,
    nit: 2, phos: 0.5, lampH: 20, temp: 24, dia: 12, vol: 1, start: 10,
    sp: 'aurelia', food: 1, settle: 0, renew: 1, n0: 2, harvest: 0, cut: 0, sample: 0.5,
    dset: 'yeast', fitK: 500, fitR: 0.4, showFit: false,
    area: 332, regrow: 6, herd0: 29, snowK: 30, hunt: 0, trample: 1,
    pair: 'ac', nA: 2, nB: 2
  };
  const SETUP_DEFAULTS = {
    limits: { lapse: 2, temp: 24 }, capacity: { lapse: 2, temp: 26, settle: 0 }, data: {},
    scarcity: { lapse: 2 }, competition: { lapse: 2, temp: 26 }
  };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const DAYS = { limits: 40, capacity: 24, competition: 40 };

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  const HOMES = {
    limits: { theta: -1.25, phi: 0.4, dist: 0.66, target: [-0.03, 0, 0.15], fov: 0.72 },
    capacity: { theta: -1.3, phi: 0.28, dist: 0.36, target: [-0.02, 0, 0.07], fov: 0.72 },
    competition: { theta: -1.3, phi: 0.28, dist: 0.4, target: [-0.01, 0, 0.07], fov: 0.72 }
  };
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    p.start = Math.max(1, Math.round(p.start)); p.n0 = Math.max(1, Math.round(p.n0)); p.nA = Math.max(1, Math.round(p.nA)); p.nB = Math.max(1, Math.round(p.nB)); p.herd0 = Math.max(2, Math.round(p.herd0)); p.seed = Math.max(1, Math.round(p.seed));
    S._rng = rng(1000 + p.seed * 7919 + SETUPS.findIndex(s => s.value === p.setup) * 131);
    S.t = 0; S.ts = 0; S.hist = []; S.counts = []; S._lastRec = -1; S._cache = null;
    S.jar = null; S.cul = null; S.cA = null; S.cB = null; S.mix = null; S.rein = null; S.yr = REIN.year0;
    if (p.setup === 'limits') { S.jar = lemStart(p); S.frondSeed = rng(4242); S.fronds = frondLayout(); record(S, true); }
    if (p.setup === 'capacity') { S.cul = culStart(p, [p.sp], [p.n0]); record(S, true); }
    if (p.setup === 'competition') { const pr = PAIRS[p.pair]; S.cA = culStart(p, [pr[0]], [p.nA]); S.cB = culStart(p, [pr[1]], [p.nB]); S.mix = culStart(p, pr, [p.nA, p.nB]); record(S, true); }
    if (p.setup === 'scarcity') { S.rein = reinStart(p); S.yr = REIN.year0; S.full = reinRun(p, REIN.year0 + REIN.years); }
    if (p.setup === 'data') { S.D = dataset(p); S.fit = bestFit(S.D); }
    const h = HOMES[p.setup];
    if (h && (!S.cam || S.camFor !== p.setup)) { S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: h.fov }); S.cam.minDist = 0.2; S.cam.maxDist = 2.5; S.camFor = p.setup; }
    if (!h && !S.cam) { S.cam = Camera({ theta: -1.2, phi: 0.3, dist: 1, target: [0, 0, 0] }); S.camFor = null; }
  }
  /* where the colonies float: a fixed scatter, filled in order, so the mat grows the same way every run */
  function frondLayout() {
    const r = rng(4242), out = [];
    for (let i = 0; i < 1400; i++) { const a = i * 2.39996 + r() * 0.5, d = Math.sqrt((i + 0.5) / 1400) * 0.97 + (r() - 0.5) * 0.04; out.push({ u: Math.cos(a) * d, v: Math.sin(a) * d, a: r() * TAU, n: 1 + Math.floor(r() * 3), age: r() }); }
    // shuffle so the first colonies are spread over the whole surface, not packed in the middle
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }
  function record(S, force) {
    const p = S.p;
    if (p.setup === 'limits') { const d = Math.floor(S.jar.t * 2); if (!force && d === S._lastRec) return; S._lastRec = d; const f = lemFactors(p, S.jar); S.hist.push([S.jar.t, S.jar.F, S.jar.N / p.vol, S.jar.P / p.vol, f.r]); }
    if (p.setup === 'capacity') {
      const C = S.cul, d = Math.floor(C.t * 4); if (!force && d === S._lastRec) return; S._lastRec = d; S.hist.push([C.t, C.N[0], C.B]);
      // a sample is taken and counted once a day, at noon
      const day = Math.floor(C.t + 1e-9); if (!S.counts.length || S.counts[S.counts.length - 1][0] < day) { const k = p.sample / 0.5, n = poisson(C.N[0] * k, S._rng); S.counts.push([day, n / k, n]); }
    }
    if (p.setup === 'competition') { const d = Math.floor(S.mix.t * 4); if (!force && d === S._lastRec) return; S._lastRec = d; S.hist.push([S.mix.t, S.cA.N[0], S.cB.N[0], S.mix.N[0], S.mix.N[1], S.cA.B, S.cB.B, S.mix.B, S.mix.Y]); }
  }
  function step(S, dt) {
    const p = S.p;
    S.t += dt;
    if (p.setup === 'limits') { if (S.jar.t < DAYS.limits) { lemStep(S.jar, p, Math.min(dt * p.lapse, DAYS.limits - S.jar.t)); record(S); } }
    else if (p.setup === 'capacity') { if (S.cul.t < DAYS.capacity) { culStep(S.cul, p, Math.min(dt * p.lapse, DAYS.capacity - S.cul.t), p.harvest / 100); record(S); } }
    else if (p.setup === 'competition') { if (S.mix.t < DAYS.competition) { const h = Math.min(dt * p.lapse, DAYS.competition - S.mix.t); culStep(S.cA, p, h); culStep(S.cB, p, h); culStep(S.mix, p, h); record(S); } }
    else if (p.setup === 'scarcity') {
      const end = REIN.year0 + REIN.years;
      if (S.yr < end) { S.yr = Math.min(end, S.yr + dt * p.lapse); while (S.rein.y <= Math.floor(S.yr) && S.rein.y <= end) reinYear(S.rein, p); }
    }
  }

  /* ============================================================
     DRAWING
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const fmtN = v => v >= 9999.5 ? Math.round(v).toLocaleString('en-US') : v >= 99.5 ? v.toFixed(0) : v >= 9.95 ? v.toFixed(1) : v.toFixed(2);
  function lay(g) { const narrow = g.w < 640; return { narrow, W: g.w, H: g.h, bw: narrow ? g.w : Math.round(g.w * 0.58) }; }

  function benchLabels(S, g, lab, bw) {
    const ctx = g.ctx, cam = S.cam;
    if (g.labels === false || bw < 260) return;
    lab.forEach(([at, text, dx, dy]) => {
      const q = cam.project(at); if (!q.ok || q.y + dy < 70 || q.y + dy > g.h - 30 || q.x < 0 || q.x > bw) return;
      ctx.save(); ctx.font = mono(10, 600);
      const tw = ctx.measureText(text).width, ex = q.x + dx; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > bw - 6) left = true;
      const t = kit().fitText(ctx, text, Math.max(40, left ? ex - 9 : bw - 6 - ex - 3));
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, q.y + dy); ctx.stroke();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
      ctx.strokeText(t, ex + (left ? -3 : 3), q.y + dy); ctx.fillStyle = '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), q.y + dy); ctx.restore();
    });
  }
  /* ---------- the duckweed bench ---------- */
  function benchLimits(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gd = G(), M = ME(), C = CE(), bw = Ly.bw, bh = Ly.narrow ? Math.round(g.h * 0.56) : g.h;
    cam.setViewport(bw, bh); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw, bh); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    M.bench(F, -0.42, 0.42, -0.24, 0.26, { cabinet: '#A9B2BC' });
    M.tileWall(F, -0.42, 0.42, 0.26, 0, 0.6);
    const r = p.dia / 200, lvl = p.vol * 1000 / jarArea(p.dia) / 100, Hj = lvl + 0.035, f = lemFactors(p, S.jar);
    M.beaker(F, [0, 0, 0], r, Hj, lvl, { tint: Gd.mix('#CFE8F6', '#D8E6B0', 0.25 * (1 - S.jar.N / Math.max(1e-9, p.nit * p.vol))) });
    const n = Math.min(S.fronds.length, Math.round(S.jar.F / 2.4));
    Gd.frondMat(F, [0, 0, lvl], r - 0.002, S.fronds.slice(0, n), 0.0055, clamp(f.fN * 1.25, 0, 1));
    const lh = p.lampH / 100 + lvl;
    const panel = Gd.growLight(F, [-0.2, 0.06, 0], lh, 0.26, clamp(f.I / 400, 0.15, 1));
    Gd.lightCone(F, [panel[0], panel[1], panel[2]], 0.26, [0, 0, lvl], r, clamp(f.I / 600, 0, 0.9));
    C.smallBottle(F, [0.16, -0.05, 0], 'nitrate', { glass: '#3A5A7A' });
    C.smallBottle(F, [0.21, 0.03, 0], 'phosphate', { glass: '#6A4A2A' });
    F.render();
    const lab = [[[r * 0.7, -r * 0.7, lvl], 'Lemna minor on the water', 70, -40], [[r, 0, lvl * 0.4], (p.vol).toFixed(2) + ' L of nutrient solution', 60, 34], [[panel[0] + 0.1, panel[1], panel[2]], 'grow light, ' + p.lampH.toFixed(0) + ' cm up', 40, -30]];
    benchLabels(S, g, lab, bw);
    // the panel is a handle: drag it up or down
    const q = cam.project([panel[0] + 0.13, panel[1], panel[2]]);
    if (q.ok) { g.handle(q.x, q.y, 16, 'lamp'); const q2 = cam.project([panel[0] + 0.13, panel[1], panel[2] + 0.01]); S._lampAx = { pxPerCm: Math.abs(q2.y - q.y) || 1 }; }
    ctx.restore();
  }
  /* ---------- the culture tubes (capacity, competition) ---------- */
  function benchTubes(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, M = ME(), C = CE(), bw = Ly.bw, bh = Ly.narrow ? Math.round(g.h * 0.5) : g.h;
    cam.setViewport(bw, bh); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw, bh); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    M.bench(F, -0.3, 0.3, -0.18, 0.2, { cabinet: '#A9B2BC' });
    M.tileWall(F, -0.3, 0.3, 0.2, 0, 0.45);
    const tube = (Cx, k) => ({ level: 0.62, liquid: '#E8E2C4', cloud: clamp(0.1 + 0.5 * (Cx.B / 30), 0, 0.8), label: k });
    let tubes, names;
    if (p.setup === 'capacity') { tubes = [tube(S.cul, SPEC[p.sp].name)]; names = [SPEC[p.sp].name]; }
    else { const pr = PAIRS[p.pair]; tubes = [tube(S.cA, SPEC[pr[0]].name + ' alone'), tube(S.mix, 'together'), tube(S.cB, SPEC[pr[1]].name + ' alone')]; names = []; }
    const at = G().wireRack(F, [0, 0, 0], tubes, { pitch: 0.045 });
    if (p.settle > 0) at.forEach(b => F.push([b[0], b[1], b[2] + 0.004], () => { const q = cam.project([b[0], b[1], b[2] + 0.009]); if (!q.ok) return; ctx.fillStyle = 'rgba(214,196,150,.85)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.s * 0.0062, q.s * 0.003 + 1, 0, 0, TAU); ctx.fill(); }, -0.01));
    // the culture's own pipette and a slide, as used to take the daily sample
    C.glassRod(F, [0.12, -0.08, 0.004], [0.2, -0.04, 0.004]);
    R3.box(F, [-0.13, -0.07, 0.0015], [0.075, 0.026, 0.002], '#DDEEF4', { ambient: 0.7 });
    F.render();
    const lab = tubes.map((t, i) => [[at[i][0], at[i][1], 0.13], t.label, (i - (tubes.length - 1) / 2) * 30, -26 - 16 * (i % 2)]);
    lab.push([[at[0][0], at[0][1], 0.05], 'bacteria in hay infusion, renewed ' + (p.renew).toFixed(1) + '× a day', -50, 40], [[-0.13, -0.07, 0.003], 'a sample, ' + (p.setup === 'capacity' ? p.sample.toFixed(2) : '0.50') + ' cm³', -20, 30]);
    benchLabels(S, g, lab, bw);
    ctx.restore();
  }
  /* ---------- a microscope field holding the sample's animals ---------- */
  const FIELDS = 6;            // the counted drop spreads over six fields of view; the card shows one of them
  function sampleField(S, g, cx, cy, R, groups, note) {
    const Gd = G(), ctx = g.ctx;
    Gd.field(ctx, cx, cy, R, c => {
      Gd.bacteria(c, cx, cy, Math.round(80 + 200 * (groups.food || 0.5)), R, 9);
      if (groups.yeast) for (let i = 0; i < Math.round(groups.yeast * 40); i++) { const rr = rng(i + 5); Gd.yeast(c, cx + (rr() - 0.5) * 1.6 * R, cy + R * (0.35 + 0.5 * rr()), R * 0.03, rr() * 3, {}); }
      groups.list.forEach((gp, gi) => {
        const r = rng(31 + gi * 17), n = Math.min(60, Math.round(gp.n / FIELDS)), L0 = R * 0.36 * SPEC[gp.sp].len / 220;
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = Math.sqrt(r()) * R * 0.92, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
          const yb = gp.sp === 'bursaria' && groups.yeast ? cy + R * (0.2 + 0.6 * r()) : y;
          Gd.paramecium(c, x, yb, L0, r() * TAU + S.t * 0.3 * (r() - 0.5), gp.sp, S.t + i, { seed: i });
        }
      });
    });
    if (note) { ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'center'; ctx.fillText(note, cx, cy + R + 16); ctx.restore(); }
    Gd.scaleBar(ctx, cx + R * 0.3, cy + R * 0.84, R * 0.36 * 100 / 220, '100 µm');
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !G()) return;
    const Ly = lay(g);
    if (p.setup === 'limits') drawLimits(S, g, Ly);
    else if (p.setup === 'capacity' || p.setup === 'competition') drawCulture(S, g, Ly);
    else if (p.setup === 'data') drawData(S, g, Ly);
    else drawIsland(S, g, Ly);
    const H = headerOf(S);
    K.header(g, H[0], H[1], H[2]);
  }
  /* rows of text in a card: rows of [label, value, colour] */
  function rowsCard(S, g, title, rows, at, wideW, o) {
    const K = kit(), ctx = g.ctx; o = o || {};
    const h = 30 + rows.length * 16 + (o.extra || 0) + 4, r = K.cardSlot(g, S, title, wideW, at(h));
    if (!r) return null;
    K.card(ctx, r.x, r.y, r.w, h);
    ctx.save(); ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF';
    ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
    rows.forEach((row, i) => {
      const y = r.y + 28 + i * 16;
      ctx.font = mono(10, 600); ctx.fillStyle = '#9FB0CC'; ctx.fillText(K.fitText(ctx, row[0], r.w * 0.5 - 14), r.x + 10, y);
      ctx.fillStyle = row[2] || '#DCE6F6'; ctx.font = mono(10, row[3] ? 700 : 500); ctx.fillText(K.fitText(ctx, row[1], r.w * 0.5 - 6), r.x + r.w * 0.5, y);
    });
    ctx.restore();
    return Object.assign({ h }, r);
  }

  function drawLimits(S, g, Ly) {
    const p = S.p, ctx = g.ctx, Gd = G(), J = S.jar, f = lemFactors(p, J), Kc = lemCeil(p);
    benchLimits(S, g, Ly);
    // looking down into the jar: the mat at frond scale
    const R = Ly.narrow ? Math.min(g.w * 0.22, 80) : Math.min((g.w - Ly.bw) * 0.36, (g.h - 120) * 0.3, 150);
    const cx = Ly.narrow ? g.w - R - 14 : Ly.bw + (g.w - Ly.bw) / 2, cy = Ly.narrow ? Math.round(g.h * 0.56) + R + 22 : 76 + R;
    ctx.save();
    const wg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R);
    wg.addColorStop(0, '#3E6A78'); wg.addColorStop(1, '#16303A'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    // the card shows a 3 cm wide patch at the centre: fronds at their real 4 mm, as many as the cover says
    const span = 3.0, pxcm = 2 * R / span, cover = clamp(f.cover, 0, 1), nf = Math.round(cover * Math.PI * (span / 2) * (span / 2) / LEM.area / 2.4 * 1.0);
    const rr = rng(99);
    for (let i = 0; i < Math.min(220, nf); i++) { const a = rr() * TAU, d = Math.sqrt(rr()) * R * 1.05; Gd.lemna(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.4 * pxcm, rr() * TAU, { n: 1 + Math.floor(rr() * 3), age: rr(), chl: clamp(f.fN * 1.25, 0, 1) }); }
    ctx.restore();
    ctx.strokeStyle = '#C8D8E4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1.5, 0, TAU); ctx.stroke();
    ctx.restore();
    Gd.scaleBar(ctx, cx - pxcm / 2, cy + R - 10, pxcm, '1 cm');
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'center'; ctx.fillText('looking down · ' + (cover * 100).toFixed(0) + ' % of the water covered', cx, cy + R + 16); ctx.restore();
    // what runs out first
    const lim = [['nitrogen', Kc.N], ['phosphorus', Kc.P], ['space', Kc.S]], kmin = Math.min(Kc.N, Kc.P, Kc.S);
    const rows = lim.map(([k, v]) => [k + ' allows', fmtN(v) + ' fronds', v === kmin ? '#FFD66B' : '#DCE6F6', v === kmin]);
    rows.push(['growing now', (f.r).toFixed(3) + ' a day', '#9FE0B8']);
    rows.push(['held back by', f.r < 0.01 && J.t > 1 ? f.lim + ' (used up)' : f.lim, '#FF9E80']);
    const wideW = Math.min(300, g.w - Ly.bw - 20);
    rowsCard(S, g, 'Which resource sets the ceiling?', rows, h => ({ x: Ly.bw + 10, y: g.h - 30 - h }), wideW);
  }

  function drawCulture(S, g, Ly) {
    const p = S.p, ctx = g.ctx;
    benchTubes(S, g, Ly);
    const R = Ly.narrow ? Math.min(g.w * 0.24, 86) : Math.min((g.w - Ly.bw) * 0.38, (g.h - 150) * 0.32, 150);
    const cx = Ly.narrow ? g.w - R - 14 : Ly.bw + (g.w - Ly.bw) / 2, cy = Ly.narrow ? Math.round(g.h * 0.5) + R + 24 : 80 + R;
    const wideW = Math.min(300, g.w - Ly.bw - 20);
    if (p.setup === 'capacity') {
      const C = S.cul, cnt = S.counts.length ? S.counts[S.counts.length - 1] : [0, 0, 0];
      sampleField(S, g, cx, cy, R, { food: C.B / 30, yeast: p.settle > 0 ? C.Y / 30 : 0, list: [{ sp: p.sp, n: cnt[2] }] }, 'one field of six · day ' + cnt[0] + ': ' + cnt[2] + ' counted in ' + p.sample.toFixed(2) + ' cm³');
      const Kn = kAlone(p.sp, p, p.harvest / 100);
      rowsCard(S, g, 'The culture, day ' + C.t.toFixed(1), [
        ['animals (0.5 cm³)', fmtN(C.N[0]), SPEC[p.sp].col, true],
        ['carrying capacity K', Kn > 0 ? fmtN(Kn) : 'none: dies out', '#FFD66B'],
        ['bacteria left', C.B.toFixed(1) + ' M/mL', '#E8E2C4'],
        ['food it can live on, R*', fmtR(rStar(p.sp, p.temp, p.harvest / 100)) + ' M/mL', '#9FE0B8'],
        p.harvest > 0 ? ['harvested so far', fmtN(C.eaten) + ' animals', '#FF9E80'] : ['food halved', p.cut > 0 ? 'on day ' + p.cut : 'never', '#FF9E80']
      ], h => ({ x: Ly.bw + 10, y: g.h - 30 - h }), wideW);
    } else {
      const pr = PAIRS[p.pair], M = S.mix, last = S.hist[S.hist.length - 1];
      sampleField(S, g, cx, cy, R, { food: M.B / 30, yeast: p.settle > 0 ? M.Y / 30 : 0, list: [{ sp: pr[0], n: M.N[0] }, { sp: pr[1], n: M.N[1] }] }, 'the mixed tube · one field of six · day ' + M.t.toFixed(0));
      const ex = S._ex && S._exKey === exKey(p) ? S._ex : (S._exKey = exKey(p), S._ex = exclusionDay(p));
      rowsCard(S, g, 'Alone and together', [
        [SPEC[pr[0]].name + ' alone', fmtN(last[1]), SPEC[pr[0]].col],
        [SPEC[pr[1]].name + ' alone', fmtN(last[2]), SPEC[pr[1]].col],
        ['together', fmtN(M.N[0]) + ' + ' + fmtN(M.N[1]), '#FFD66B', true],
        ['R*: ' + SPEC[pr[0]].name.slice(3), fmtR(rStar(pr[0], p.temp)) + ' M/mL', SPEC[pr[0]].col],
        ['R*: ' + SPEC[pr[1]].name.slice(3), fmtR(rStar(pr[1], p.temp)) + ' M/mL', SPEC[pr[1]].col],
        ['one dies out by', isFinite(ex) ? 'day ' + ex : 'never — they share', '#FF9E80']
      ], h => ({ x: Ly.bw + 10, y: g.h - 30 - h }), wideW);
    }
  }
  const exKey = p => [p.pair, p.food, p.settle, p.renew, p.temp, p.nA, p.nB].join('|');

  function drawData(S, g, Ly) {
    const p = S.p, ctx = g.ctx, Gd = G(), D = S.D, last = D.pts[D.pts.length - 1];
    const W = g.w, H = g.h, top = 64, foot = 30;
    if (p.dset === 'reindeer') {
      const gy = Gd.tundra(ctx, [0, 0, W, H], { lichen: 0.25, snow: 0, seed: 3 });
      const n = 14, rr = rng(5);
      for (let i = 0; i < n; i++) { const x = W * (0.08 + 0.84 * rr()), yb = gy(x) + (H - gy(x)) * (0.1 + 0.6 * rr()); Gd.reindeer(ctx, x, yb, 26 + (yb - gy(x)) * 0.25, rr() < 0.5 ? 1 : -1, { sex: rr() < 0.3 ? 'm' : 'f', cond: 0.5, phase: rr() * 6 }); }
    } else if (p.dset === 'yeast') {
      ctx.save(); const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1A2232'); bg.addColorStop(1, '#0C111C'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.restore();
      const R = Math.min(W * 0.3, (H - top - foot) * 0.46), cx = Ly.narrow ? W / 2 : W * 0.3, cy = top + 10 + R;
      Gd.field(ctx, cx, cy, R, c => {
        Gd.haemo(c, cx, cy, R * 1.6, true);
        const n = Math.round(last[1] / 8), rr = rng(12);
        for (let i = 0; i < Math.min(110, n); i++) Gd.yeast(c, cx + (rr() - 0.5) * R * 1.8, cy + (rr() - 0.5) * R * 1.8, R * 0.035, rr() * 3, { bud: rr() < 0.25 ? rr() : 0 });
      }, { light: '#F2F0E6', mid: '#DCDACC' });
      Gd.scaleBar(ctx, cx - R * 0.16, cy + R * 0.86, R * 0.32, '0.05 mm');
      ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'center'; ctx.fillText('a counting chamber: yeast at 18 h', cx, cy + R + 16); ctx.restore();
    } else {
      ctx.save(); ctx.fillStyle = '#0E1420'; ctx.fillRect(0, 0, W, H); ctx.restore();
      const R = Math.min(W * 0.28, (H - top - foot) * 0.46), cx = Ly.narrow ? W / 2 : W * 0.3, cy = top + 10 + R;
      const wg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R); wg.addColorStop(0, '#3E6A78'); wg.addColorStop(1, '#16303A');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      const n = Math.min(500, Math.round(last[1] / 2.4)), L0 = layoutCache(S);
      L0.slice(0, n).forEach(fr => Gd.lemna(ctx, cx + fr.u * R, cy + fr.v * R, Math.max(4, R * 0.06), fr.a, { n: fr.n, age: fr.age, shadow: 0 }));
      ctx.restore(); ctx.strokeStyle = '#C8D8E4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1.5, 0, TAU); ctx.stroke();
      ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'center'; ctx.fillText('your jar on day 40 (from the duckweed set-up)', cx, cy + R + 16); ctx.restore();
    }
    // the counts, as a table: what was measured, and what your curve says
    const N0 = D.pts[0][1], rows = D.pts.filter((q, i) => D.pts.length <= 10 || i % 2 === 0).map(([t, y]) => [D.x === 'year' ? String(t) : t + ' ' + D.unit, fmtN(y) + '  ·  curve ' + fmtN(logi(p.fitK, p.fitR, N0, t - D.t0)), '#DCE6F6']);
    const wideW = Math.min(300, W * 0.36);
    rowsCard(S, g, 'Counted, and your logistic curve', rows.slice(0, 10), h => ({ x: W - wideW - 10, y: Math.max(66, H - 30 - h) }), wideW);
  }
  function layoutCache(S) { if (!S._lay) S._lay = frondLayout(); return S._lay; }

  function drawIsland(S, g, Ly) {
    const p = S.p, ctx = g.ctx, Gd = G(), R = S.rein, W = g.w, H = g.h;
    const h = R.hist.length ? R.hist[R.hist.length - 1] : [R.y, R.F + R.M, R.L / lichenMax(p), R.F, R.M, 1];
    const frac = S.yr - Math.floor(S.yr), winter = frac > 0.62, hard = Math.floor(S.yr) === 1963 && winter;
    const gy = Gd.tundra(ctx, [0, 0, W, H], { lichen: h[2], snow: winter ? (hard ? 1 : 0.6) : 0, seed: 7 });
    // the herd: up to 48 animals drawn, each standing for N/48 when the herd is big
    const N = h[1], shown = Math.min(48, Math.round(N)), per = N > 48 ? N / 48 : 1, rr = rng(21), cond = clamp((h[5] - 0.4) / 0.6, 0, 1);
    const pos = [];
    for (let i = 0; i < 48; i++) { const x = W * (0.05 + 0.9 * rr()), d = rr(); pos.push({ x, d, dir: rr() < 0.5 ? 1 : -1, m: rr() < h[4] / Math.max(1, N), ph: rr() * 6 }); }
    pos.slice(0, shown).sort((a, b) => a.d - b.d).forEach(q => { const yb = gy(q.x) + (H - gy(q.x)) * (0.06 + 0.7 * q.d); Gd.reindeer(ctx, q.x, yb, 18 + 42 * q.d * (Ly.narrow ? 0.6 : 1), q.dir, { sex: q.m ? 'm' : 'f', cond, phase: q.ph + S.t * 2, winter, snow: winter }); });
    if (!shown) { ctx.save(); ctx.font = sans(14, 700); ctx.fillStyle = '#FFE0D0'; ctx.textAlign = 'center'; ctx.fillText('no reindeer left', W / 2, H * 0.7); ctx.restore(); }
    const wideW = Math.min(290, W * 0.36);
    const r = rowsCard(S, g, 'St Matthew Island, ' + Math.floor(S.yr), [
      ['reindeer', fmtN(N) + (per > 1 ? '  (1 drawn = ' + per.toFixed(0) + ')' : ''), '#FFD66B', true],
      ['cows · bulls', fmtN(h[3]) + ' · ' + fmtN(h[4]), '#DCE6F6'],
      ['lichen left', (h[2] * 100).toFixed(0) + ' % of the untouched mat', '#C8D8B8'],
      ['winter food found', (h[5] * 100).toFixed(0) + ' % of what they need', h[5] < 0.7 ? '#FF9E80' : '#9FE0B8'],
      ['the lichen can feed', fmtN(sustainable(p)) + ' for ever', '#8FD4FA']
    ], hh => ({ x: W - wideW - 10, y: H - 30 - hh }), wideW, { extra: 0 });
    // the lichen mat itself, cut through: how thick it is now
    if (!Ly.narrow) {
      const x0 = 14, y0 = H - 128, w = Math.min(240, W * 0.3), hh = 92;
      kit().card(ctx, x0, y0, w, hh);
      ctx.save(); ctx.font = sans(11, 700); ctx.fillStyle = '#EAF1FF'; ctx.textBaseline = 'top'; ctx.fillText('The lichen mat, cut through', x0 + 10, y0 + 7);
      const base = y0 + hh - 12, thick = 11 * h[2];         // cm: an untouched Cladonia mat is about 11 cm deep
      ctx.fillStyle = '#4A3826'; ctx.fillRect(x0 + 10, base, w - 60, 6);
      Gd.lichen(ctx, x0 + 10 + (w - 60) / 2, base, w - 64, thick * 5.2, { seed: 4 });
      ctx.strokeStyle = '#DCE6F6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + w - 40, base); ctx.lineTo(x0 + w - 40, base - 57); ctx.stroke();
      ctx.font = mono(9, 500); ctx.fillStyle = '#9FB0CC'; for (let k = 0; k <= 10; k += 5) { ctx.fillText(k + ' cm', x0 + w - 36, base - k * 5.2 - 5); ctx.beginPath(); ctx.moveTo(x0 + w - 44, base - k * 5.2); ctx.lineTo(x0 + w - 40, base - k * 5.2); ctx.stroke(); }
      ctx.restore();
    }
  }

  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'limits') { const J = S.jar, f = lemFactors(p, J), K = lemCeil(p), kmin = Math.min(K.N, K.P, K.S); return [J.t >= DAYS.limits - 1e-6 ? 'Day 40: ' + fmtN(J.F) + ' fronds — the ' + f.lim + ' ran out' : 'Day ' + J.t.toFixed(1) + ': ' + fmtN(J.F) + ' fronds, ' + (f.r > 0.005 ? 'growing ' + (f.r * 100).toFixed(0) + ' % a day' : 'no longer growing'), 'nitrate ' + p.nit.toFixed(2) + ' mg N/L · phosphate ' + p.phos.toFixed(3) + ' mg P/L · light ' + f.I.toFixed(0) + ' µmol/m²/s · ' + p.temp.toFixed(0) + ' °C', 'the scarcest resource allows ' + fmtN(kmin) + ' fronds: that is where it stops']; }
    if (p.setup === 'capacity') { const C = S.cul, Kn = kAlone(p.sp, p, p.harvest / 100); return [SPEC[p.sp].name + ', day ' + C.t.toFixed(1) + ': ' + fmtN(C.N[0]) + ' in 0.5 cm³', 'food ' + p.food.toFixed(2) + '× Gause’s · renewed ' + p.renew.toFixed(1) + '× a day · ' + p.temp.toFixed(0) + ' °C' + (p.harvest > 0 ? ' · harvest ' + p.harvest + ' % a day' : ''), 'carrying capacity K = ' + fmtN(Kn) + ' — set by the food, not by the animals']; }
    if (p.setup === 'competition') { const pr = PAIRS[p.pair], M = S.mix; return [SPEC[pr[0]].name + ' and ' + SPEC[pr[1]].name + ', day ' + M.t.toFixed(0), 'together: ' + fmtN(M.N[0]) + ' and ' + fmtN(M.N[1]) + ' in 0.5 cm³ · food ' + p.food.toFixed(2) + '× · ' + (p.settle * 100).toFixed(0) + ' % settles as yeast', 'R*: ' + fmtR(rStar(pr[0], p.temp)) + ' against ' + fmtR(rStar(pr[1], p.temp)) + ' million bacteria per mL']; }
    if (p.setup === 'data') { const D = S.D, e = Math.sqrt(sse(D, p.fitK, p.fitR) / D.pts.length); return [p.dset === 'yeast' ? 'Carlson’s yeast culture, 1913' : p.dset === 'reindeer' ? 'The St Matthew Island reindeer, 1944–1966' : 'Your duckweed jar, counted every 2 days', 'your curve: K = ' + fmtN(p.fitK) + ', r = ' + p.fitR.toFixed(3) + ' per ' + D.unit + ' · typical miss ' + fmtN(e), 'the best logistic: K = ' + fmtN(S.fit.K) + ', r = ' + S.fit.r.toFixed(3) + ' · typical miss ' + fmtN(S.fit.rms)]; }
    const R = S.rein, h = R.hist.length ? R.hist[R.hist.length - 1] : [R.y, R.F + R.M, 1];
    return ['St Matthew Island, ' + Math.floor(S.yr) + ': ' + fmtN(h[1]) + ' reindeer', 'lichen ' + (h[2] * 100).toFixed(0) + ' % · regrows ' + p.regrow.toFixed(1) + ' % a year · ' + p.area.toFixed(0) + ' km² · hunting ' + p.hunt.toFixed(0) + ' % a year', 'the lichen could feed ' + fmtN(sustainable(p)) + ' reindeer for ever'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'limits') {
      const Kc = lemCeil(p), items = [{ c: '#7CDB8A', label: 'fronds' }, { c: '#8FD4FA', label: 'N ceiling', dash: [5, 3] }, { c: '#E8B87A', label: 'P ceiling', dash: [5, 3] }, { c: '#C9D4EA', label: 'space', dash: [2, 3] }];
      const Kk = K.plotKey(g, items), ymax = Math.max(50, ...S.hist.map(q => q[1])) * 1.15, top = Math.max(ymax, Math.min(Kc.N, Kc.P, Kc.S) * 1.15);
      const P = g.Plot({ xmin: 0, xmax: DAYS.limits, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'days', ylabel: 'fronds', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { [[Kc.N, '#8FD4FA', [5, 3]], [Kc.P, '#E8B87A', [5, 3]], [Kc.S, '#C9D4EA', [2, 3]]].forEach(([v, c, d]) => { if (v < top) P.hline(v, c, d); }); P.line(S.hist.map(q => [q[0], q[1]]), '#7CDB8A', 2.4); const l = S.hist[S.hist.length - 1]; P.dot(l[0], l[1], 4.5, '#7CDB8A', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'capacity') {
      const Kn = kAlone(p.sp, p, p.harvest / 100), items = [{ c: SPEC[p.sp].col, label: SPEC[p.sp].name }, { c: '#FFD66B', label: 'K', dash: [5, 3] }, { c: '#DCE6F6', label: 'daily count', dot: true }];
      const Kk = K.plotKey(g, items), ymax = Math.max(20, Kn, ...S.hist.map(q => q[1])) * 1.18;
      const P = g.Plot({ xmin: 0, xmax: DAYS.capacity, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'days', ylabel: 'in 0.5 cm³', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(Kn, '#FFD66B', [5, 3]); if (p.cut > 0) P.vline(p.cut, 'rgba(255,158,128,.7)', [3, 3]); P.line(S.hist.map(q => [q[0], q[1]]), SPEC[p.sp].col, 2.4); S.counts.forEach(c => P.dot(c[0], c[1], 3.2, '#DCE6F6', '#0B0F18')); });
      Kk.draw(P); return;
    }
    if (p.setup === 'competition') {
      const pr = PAIRS[p.pair], items = [{ c: SPEC[pr[0]].col, label: SPEC[pr[0]].name + ' together' }, { c: SPEC[pr[1]].col, label: SPEC[pr[1]].name + ' together' }, { c: '#9FB0CC', label: 'each alone', dash: [5, 3] }];
      const Kk = K.plotKey(g, items), ymax = Math.max(20, ...S.hist.flatMap(q => [q[1], q[2], q[3], q[4]])) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: DAYS.competition, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'days', ylabel: 'in 0.5 cm³', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(S.hist.map(q => [q[0], q[1]]), g.alpha(SPEC[pr[0]].col, 0.6), 1.4, [5, 3]); P.line(S.hist.map(q => [q[0], q[2]]), g.alpha(SPEC[pr[1]].col, 0.6), 1.4, [5, 3]); P.line(S.hist.map(q => [q[0], q[3]]), SPEC[pr[0]].col, 2.4); P.line(S.hist.map(q => [q[0], q[4]]), SPEC[pr[1]].col, 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'data') {
      const D = S.D, N0 = D.pts[0][1], t1 = D.pts[D.pts.length - 1][0], items = [{ c: '#FFD66B', label: 'counted', dot: true }, { c: '#7CDB8A', label: 'your curve' }];
      if (p.showFit) items.push({ c: '#C9D4EA', label: 'best logistic', dash: [5, 3] });
      const Kk = K.plotKey(g, items), ymax = Math.max(...D.pts.map(q => q[1]), p.fitK) * 1.15, xs = []; for (let i = 0; i <= 160; i++) xs.push(D.t0 + (t1 - D.t0) * i / 160);
      const P = g.Plot({ xmin: D.t0, xmax: t1, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: D.x, ylabel: D.what, xfmt: v => v.toFixed(0), yfmt: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0) }).frame();
      P.clip(() => { P.line(xs.map(t => [t, logi(p.fitK, p.fitR, N0, t - D.t0)]), '#7CDB8A', 2.2); if (p.showFit) P.line(xs.map(t => [t, logi(S.fit.K, S.fit.r, N0, t - D.t0)]), '#C9D4EA', 1.4, [5, 3]); P.hline(p.fitK, 'rgba(124,219,138,.4)', [2, 3]); D.pts.forEach(q => P.dot(q[0], q[1], 4, '#FFD66B', '#0B0F18')); });
      Kk.draw(P); return;
    }
    // scarcity: the herd and the lichen through the years, with Klein's counts
    const F = S.full.hist, R = S.rein.hist, items = [{ c: '#FFD66B', label: 'reindeer' }, { c: '#C8D8B8', label: 'lichen (right scale)' }, { c: '#FF9E80', label: 'Klein’s counts', dot: true }];
    const Kk = K.plotKey(g, items), ymax = Math.max(1000, ...F.map(q => q[1])) * 1.12, y0 = REIN.year0, y1 = REIN.year0 + REIN.years;
    const P = g.Plot({ xmin: y0, xmax: y1, ymin: 0, ymax, pad: { t: Kk.t, r: 40 }, xlabel: 'year', ylabel: 'reindeer', xfmt: v => v.toFixed(0), yfmt: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0) }).frame();
    P.clip(() => {
      P.line(F.map(q => [q[0], q[1]]), 'rgba(255,214,107,.25)', 1.2, [3, 3]); P.line(F.map(q => [q[0], q[2] * ymax]), 'rgba(200,216,184,.25)', 1.2, [3, 3]);
      P.line(R.map(q => [q[0], q[1]]), '#FFD66B', 2.4); P.line(R.map(q => [q[0], q[2] * ymax]), '#C8D8B8', 2);
      P.hline(sustainable(p), 'rgba(143,212,250,.6)', [5, 3]);
      KLEIN.forEach(q => P.dot(q[0], q[1], 4, '#FF9E80', '#0B0F18'));
      P.vline(S.yr, 'rgba(220,230,246,.35)', [2, 3]);
    });
    P.tag(y0 + 1, sustainable(p), 'lichen feeds this many for ever', '#8FD4FA', 'left', -8);
    const ctx = g.ctx; ctx.save(); ctx.font = mono(9, 500); ctx.fillStyle = '#C8D8B8'; ctx.textAlign = 'left'; [0, 0.5, 1].forEach(v => ctx.fillText((v * 100).toFixed(0) + '%', P.x1 + 4, P.Y(v * ymax) + 3)); ctx.restore();
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'limits') {
      // the landscape: yield after 40 days as the nitrate is varied, everything else as set (Liebig's law of the minimum)
      const key = ['phos', 'lampH', 'temp', 'dia', 'vol', 'start'].map(k => p[k]).join('|');
      if (!S._cache || S._cache.key !== key) { const pts = []; for (let i = 0; i <= 24; i++) { const n = 0.1 * Math.pow(200, i / 24); pts.push([n, lemRun(Object.assign({}, p, { nit: n }), DAYS.limits).F]); } S._cache = { key, pts }; }
      const Kc = lemCeil(p), items = [{ c: '#7CDB8A', label: 'fronds after 40 days' }, { c: '#FFD66B', label: 'this jar', dot: true }];
      const Kk = K.plotKey(g, items, 'nitrate varied, the rest as set'), ymax = Math.max(...S._cache.pts.map(q => q[1])) * 1.15;
      const P = g.Plot({ xmin: -1, xmax: Math.log10(20), ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'nitrate, mg N/L (log scale)', ylabel: 'fronds', xticks: [-1, Math.log10(0.3), 0, Math.log10(3), 1, Math.log10(20)], xfmt: v => String(+Math.pow(10, v).toPrecision(1)), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(S._cache.pts.map(q => [Math.log10(q[0]), q[1]]), '#7CDB8A', 2.2); P.hline(Math.min(Kc.P, Kc.S), 'rgba(232,184,122,.5)', [4, 3]); P.dot(Math.log10(p.nit), lemRun(p, DAYS.limits).F, 5, '#FFD66B', '#0B0F18'); });
      P.tag(-0.95, Math.min(Kc.P, Kc.S), 'then ' + (Kc.P < Kc.S ? 'phosphorus' : 'space') + ' limits', '#E8B87A', 'left', -8);
      Kk.draw(P); return;
    }
    if (p.setup === 'capacity') {
      const H = p.harvest / 100, Kn = kAlone(p.sp, p, 0), items = [{ c: SPEC[p.sp].col, label: 'growth a day, dN/dt' }, { c: '#FF9E80', label: 'harvest taken', dash: [5, 3] }, { c: '#FFD66B', label: 'now', dot: true }];
      const Kk = K.plotKey(g, items), pts = []; for (let i = 0; i <= 80; i++) { const N = Kn * 1.1 * i / 80; pts.push([N, growthAt(p.sp, p, N, 0)]); }
      const ymax = Math.max(2, ...pts.map(q => q[1])) * 1.2, now = S.cul.N[0];
      const P = g.Plot({ xmin: 0, xmax: Math.max(10, Kn * 1.1), ymin: -ymax * 0.25, ymax, pad: { t: Kk.t }, xlabel: 'animals in 0.5 cm³', ylabel: 'new a day', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.35)'); P.line(pts, SPEC[p.sp].col, 2.2); if (H > 0) P.line([[0, 0], [Kn * 1.1, H * Kn * 1.1]], '#FF9E80', 1.6, [5, 3]); const top = pts.reduce((a, b) => b[1] > a[1] ? b : a); P.vline(top[0], 'rgba(255,214,107,.4)', [2, 3]); P.vline(Kn / 2, 'rgba(201,212,234,.3)', [1, 4]); P.dot(now, growthAt(p.sp, p, now, 0), 5, '#FFD66B', '#0B0F18'); });
      const top2 = pts.reduce((a, b) => b[1] > a[1] ? b : a); P.tag(top2[0], ymax * 0.9, 'fastest at ' + (top2[0] / Kn).toFixed(2) + ' K (a logistic: 0.5 K)', '#FFD66B', 'left', 4);
      Kk.draw(P); return;
    }
    if (p.setup === 'competition') {
      const pr = PAIRS[p.pair], items = [{ c: SPEC[pr[0]].col, label: 'bacteria, ' + SPEC[pr[0]].name.slice(3) + ' alone' }, { c: SPEC[pr[1]].col, label: 'bacteria, ' + SPEC[pr[1]].name.slice(3) + ' alone' }, { c: '#FFD66B', label: 'together' }];
      if (p.settle > 0) items.push({ c: '#D6C496', label: 'yeast, together', dash: [4, 3] });
      const Kk = K.plotKey(g, items, 'dashed: each one’s R*'), sup = supply(p, 0), ymax = Math.max(sup.Bs, sup.Ys, 1) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: DAYS.competition, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'days', ylabel: 'food, million/mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { [0, 1].forEach(i => { const v = rStar(pr[i], p.temp); if (isFinite(v)) P.hline(v, SPEC[pr[i]].col, [4, 3]); }); P.line(S.hist.map(q => [q[0], q[5]]), SPEC[pr[0]].col, 1.6); P.line(S.hist.map(q => [q[0], q[6]]), SPEC[pr[1]].col, 1.6); P.line(S.hist.map(q => [q[0], q[7]]), '#FFD66B', 2.4); if (p.settle > 0) P.line(S.hist.map(q => [q[0], q[8]]), '#D6C496', 1.6, [4, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'data') {
      // growth per individual against numbers: a logistic population falls on a straight line from r down to K
      const D = S.D, pts = []; for (let i = 0; i + 1 < D.pts.length; i++) { const [t0, a] = D.pts[i], [t1, b] = D.pts[i + 1]; if (a > 0 && b > 0) pts.push([(a + b) / 2, Math.log(b / a) / (t1 - t0)]); }
      const items = [{ c: '#FFD66B', label: 'from the counts', dot: true }, { c: '#7CDB8A', label: 'your r·(1 − N/K)' }];
      const Kk = K.plotKey(g, items), xmax = Math.max(p.fitK, ...pts.map(q => q[0])) * 1.1, ys = pts.map(q => q[1]).concat([p.fitR]), ymax = Math.max(...ys) * 1.2, ymin = Math.min(0, ...ys) * 1.2 - 0.02;
      const P = g.Plot({ xmin: 0, xmax, ymin, ymax, pad: { t: Kk.t }, xlabel: D.what + ' (N)', ylabel: 'growth per one, per ' + D.unit, xfmt: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.35)'); P.line([[0, p.fitR], [xmax, p.fitR * (1 - xmax / p.fitK)]], '#7CDB8A', 2); pts.forEach(q => P.dot(q[0], q[1], 4, '#FFD66B', '#0B0F18')); });
      P.tag(p.fitK, 0, 'K', '#7CDB8A', 'left', -8);
      Kk.draw(P); return;
    }
    // scarcity: the herd against its food, year by year — a loop, not a balance
    const R = S.rein.hist, items = [{ c: '#FFD66B', label: 'each year' }, { c: '#8FD4FA', label: 'what the lichen can feed', dash: [5, 3] }];
    const Kk = K.plotKey(g, items), xmax = Math.max(1000, ...S.full.hist.map(q => q[1])) * 1.1;
    const P = g.Plot({ xmin: 0, xmax, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'reindeer', ylabel: 'lichen left, %', xfmt: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.vline(sustainable(p), '#8FD4FA', [5, 3]); P.line(R.map(q => [q[1], q[2] * 100]), '#FFD66B', 2); R.forEach((q, i) => { if (i % 5 === 0 || q[0] === 1963 || q[0] === 1966) P.tag(q[1], q[2] * 100, String(q[0]), '#9FB0CC', 'left', -6); }); const l = R[R.length - 1]; if (l) P.dot(l[1], l[2] * 100, 5, '#FFD66B', '#0B0F18'); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'limits') {
      const J = S.jar, f = lemFactors(p, J), K = lemCeil(p), kmin = Math.min(K.N, K.P, K.S);
      return [
        { label: 'Day', value: J.t.toFixed(1), hint: p.lapse + ' days a second' },
        { label: 'Fronds', value: fmtN(J.F), flag: 'accent', hint: (f.cover * 100).toFixed(0) + ' % of the surface' },
        { label: 'Growth r = r_max·f_T·f_I·min(…)', value: f.r.toFixed(3), unit: '/day', hint: f.r > 0.01 ? 'doubles in ' + (Math.LN2 / f.r).toFixed(1) + ' days' : 'stopped' },
        { label: 'Nitrogen left', value: (J.N / p.vol).toFixed(3), unit: 'mg/L', flag: J.N / p.vol < 0.05 ? 'crit' : undefined },
        { label: 'Phosphorus left', value: (J.P / p.vol).toFixed(4), unit: 'mg/L', flag: J.P / p.vol < 0.008 ? 'crit' : undefined },
        { label: 'Light at the water', value: f.I.toFixed(0), unit: 'µmol/m²/s', hint: 'f_I = ' + f.fI.toFixed(2) },
        { label: 'Temperature factor f_T', value: f.fT.toFixed(2), hint: 'best at 26 °C, none below 5 or above 34' },
        { label: 'Ceilings N · P · space', value: fmtN(K.N) + ' · ' + fmtN(K.P) + ' · ' + fmtN(K.S), unit: 'fronds' },
        { label: 'Limiting resource', value: kmin === K.S ? 'space' : kmin === K.N ? 'nitrogen' : 'phosphorus', flag: 'warn', hint: 'the scarcest one, not the sum' }
      ];
    }
    if (p.setup === 'capacity') {
      const C = S.cul, H = p.harvest / 100, Kn = kAlone(p.sp, p, H), s = SPEC[p.sp], th = q10(p.temp), r0 = s.mu * th * supply(p, 0).Bs / (supply(p, 0).Bs + s.h) - s.m * th - H;
      const last = S.counts[S.counts.length - 1] || [0, 0, 0];
      return [
        { label: 'Day', value: C.t.toFixed(1), hint: p.lapse + ' days a second' },
        { label: 'Animals in 0.5 cm³', value: fmtN(C.N[0]), flag: 'accent' },
        { label: 'Your count, scaled to 0.5 cm³', value: fmtN(last[1]), hint: last[2] + ' seen in ' + p.sample.toFixed(2) + ' cm³ (±' + Math.sqrt(Math.max(1, last[2])).toFixed(0) + ')' },
        { label: 'Carrying capacity K', value: Kn > 0 ? fmtN(Kn) : '0', flag: 'warn', hint: 'where births = deaths' },
        { label: 'Growth when few, r', value: r0.toFixed(3), unit: '/day', hint: r0 > 0 ? 'doubles in ' + (Math.LN2 / r0).toFixed(1) + ' days' : 'shrinks even when few' },
        { label: 'Bacteria in the tube', value: C.B.toFixed(1), unit: 'M/mL', hint: 'supplied at ' + supply(p, C.t).Bs.toFixed(1) },
        { label: 'Food it can just live on, R*', value: fmtR(rStar(p.sp, p.temp, H)), unit: 'M/mL' },
        { label: 'Harvest a day', value: (H * C.N[0]).toFixed(1), unit: 'animals', hint: 'most when N sits near the peak of plot 2' }
      ];
    }
    if (p.setup === 'competition') {
      const pr = PAIRS[p.pair], M = S.mix, ex = exclusionDay(p);
      return [
        { label: 'Day', value: M.t.toFixed(1) },
        { label: SPEC[pr[0]].name + ' together', value: fmtN(M.N[0]), flag: 'accent', hint: 'alone: ' + fmtN(S.cA.N[0]) },
        { label: SPEC[pr[1]].name + ' together', value: fmtN(M.N[1]), flag: 'accent', hint: 'alone: ' + fmtN(S.cB.N[0]) },
        { label: 'R* = h·m/(µ − m), ' + SPEC[pr[0]].name.slice(3), value: fmtR(rStar(pr[0], p.temp)), unit: 'M/mL' },
        { label: 'R*, ' + SPEC[pr[1]].name.slice(3), value: fmtR(rStar(pr[1], p.temp)), unit: 'M/mL' },
        { label: 'Bacteria left together', value: M.B.toFixed(2), unit: 'M/mL', hint: 'pulled down to the lower R*' },
        { label: 'Yeast left together', value: M.Y.toFixed(2), unit: 'M/mL' },
        { label: 'One dies out by', value: isFinite(ex) ? 'day ' + ex : 'never', flag: isFinite(ex) ? 'crit' : 'ok' }
      ];
    }
    if (p.setup === 'data') {
      const D = S.D, e = Math.sqrt(sse(D, p.fitK, p.fitR) / D.pts.length);
      return [
        { label: 'Your K', value: fmtN(p.fitK), flag: 'accent' },
        { label: 'Your r', value: p.fitR.toFixed(3), unit: '/' + D.unit, hint: 'doubles in ' + (Math.LN2 / p.fitR).toFixed(1) + ' ' + D.unit + ' when few' },
        { label: 'Typical miss (rms)', value: fmtN(e), flag: e < 2 * S.fit.rms + 1e-9 ? 'ok' : 'warn' },
        { label: 'Best logistic K', value: fmtN(S.fit.K) },
        { label: 'Best logistic r', value: S.fit.r.toFixed(3), unit: '/' + D.unit },
        { label: 'Best fit misses by', value: fmtN(S.fit.rms), hint: p.dset === 'reindeer' ? 'no S-curve can follow a crash' : 'how good an S-curve can be' }
      ];
    }
    const R = S.rein, h = R.hist.length ? R.hist[R.hist.length - 1] : [R.y, R.F + R.M, 1, R.F, R.M, 1];
    const peak = R.hist.reduce((a, q) => q[1] > a[1] ? q : a, [0, 0]);
    return [
      { label: 'Year', value: String(Math.floor(S.yr)) },
      { label: 'Reindeer', value: fmtN(h[1]), flag: 'accent' },
      { label: 'Lichen left', value: (h[2] * 100).toFixed(0), unit: '%' },
      { label: 'Winter food found φ', value: (h[5] * 100).toFixed(0), unit: '%', flag: h[5] < 0.7 ? 'crit' : 'ok' },
      { label: 'Peak so far', value: fmtN(peak[1]), hint: peak[0] ? 'in ' + peak[0] : '' },
      { label: 'Lichen can feed for ever', value: fmtN(sustainable(p)), hint: 'g·L_max/4 ÷ (1 + trampling) t each' },
      { label: 'Bulls', value: fmtN(h[4]), hint: 'calves need bulls' }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'limits') { const f = lemFactors(p, S.jar); return E.v('dF') + '/' + E.v('dt') + ' ' + E.op('=') + ' ' + E.v('r') + E.sub('max') + '·' + E.v('f') + E.sub('T') + '·' + E.v('f') + E.sub('I') + '·min(' + E.v('f') + E.sub('N') + ', ' + E.v('f') + E.sub('P') + ', ' + E.v('f') + E.sub('space') + ')·' + E.v('F') + ' ' + E.op('=') + ' 0.35 × ' + f.fT.toFixed(2) + ' × ' + f.fI.toFixed(2) + ' × min(' + f.fN.toFixed(2) + ', ' + f.fP.toFixed(2) + ', ' + f.fS.toFixed(2) + ') × ' + fmtN(S.jar.F) + ' ' + E.op('=') + ' ' + E.n((f.r * S.jar.F).toFixed(1), 'fronds/day'); }
    if (p.setup === 'capacity') { const Kn = kAlone(p.sp, p, p.harvest / 100); return E.v('dN') + '/' + E.v('dt') + ' ' + E.op('=') + ' ' + E.v('N') + '(' + E.v('µ') + E.frac(E.v('B'), E.v('B') + '+' + E.v('h')) + ' − ' + E.v('m') + ')  →  ' + E.v('K') + ' ' + E.op('=') + ' ' + E.frac(E.v('D') + '(' + E.v('B') + E.sub('s') + ' − ' + E.v('R') + '*)', E.v('c') + '·' + E.v('m') + '/' + E.v('µ')) + ' ' + E.op('=') + ' ' + E.n(fmtN(Kn), 'per 0.5 cm³'); }
    if (p.setup === 'competition') { const pr = PAIRS[p.pair], a = rStar(pr[0], p.temp), b = rStar(pr[1], p.temp); return E.v('R') + '* ' + E.op('=') + ' ' + E.frac(E.v('h') + E.v('m'), E.v('µ') + ' − ' + E.v('m')) + ':  ' + E.n(fmtR(a), '') + ' (' + SPEC[pr[0]].name.slice(3) + ') ' + E.op(a < b ? '<' : '>') + ' ' + E.n(fmtR(b), '') + ' (' + SPEC[pr[1]].name.slice(3) + ')  →  on one food, ' + SPEC[a < b ? pr[0] : pr[1]].name + ' wins'; }
    if (p.setup === 'data') { const D = S.D; return E.v('N') + '(' + E.v('t') + ') ' + E.op('=') + ' ' + E.frac(E.v('K'), '1 + (' + E.v('K') + '/' + E.v('N') + E.sub('0') + ' − 1)' + E.v('e') + '<sup>−' + E.v('rt') + '</sup>') + ' with ' + E.v('K') + ' ' + E.op('=') + ' ' + E.n(fmtN(p.fitK), '') + ', ' + E.v('r') + ' ' + E.op('=') + ' ' + E.n(p.fitR.toFixed(3), '/' + D.unit) + ', ' + E.v('N') + E.sub('0') + ' ' + E.op('=') + ' ' + E.n(fmtN(D.pts[0][1]), ''); }
    const R = S.rein, h = R.hist.length ? R.hist[R.hist.length - 1] : [0, 0, 1, 0, 0, 1];
    return E.v('φ') + ' ' + E.op('=') + ' ' + E.frac('min(0.35·' + E.v('L') + '·access, ' + E.v('N') + '·1 t)', E.v('N') + '·1 t') + ' ' + E.op('=') + ' ' + E.n((h[5] * 100).toFixed(0), '%') + '   ·   ' + E.v('N') + E.sub('safe') + ' ' + E.op('=') + ' ' + E.frac(E.v('g') + E.v('L') + E.sub('max') + '/4', '(1 + trampling) t') + ' ' + E.op('=') + ' ' + E.n(fmtN(sustainable(p)), 'reindeer');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'limits') return 'Growth is set by the scarcest resource, not by the total: double the nitrogen in a jar that has run out of phosphorus and you get no more duckweed at all (Liebig’s law of the minimum). Each frond is made of nitrogen and phosphorus taken out of the water and needs its own patch of light: the ceiling is whichever runs out first.';
    if (p.setup === 'capacity') return 'K is not a number the animals carry: it is where the food supplied each day just feeds the deaths. Double the food and K nearly doubles; harvest some and K falls. The growth curve is steepest part-way up (K/2 for a logistic) — the most a population can give each day without shrinking.';
    if (p.setup === 'competition') return 'Two species living on exactly the same food cannot both last: the one that can still grow at a lower food level (lower R*) keeps eating it below what the other needs. Gause’s P. aurelia beat P. caudatum this way. Give one of them a food or a place the other does not use and both stay.';
    if (p.setup === 'data') return 'A logistic population grows by the same share each day only when it is small; the share falls in a straight line as N rises, reaching zero at K. Plot growth per individual against N and the line hits the axis at K — a scientist’s way to read K off messy counts. Data that overshoot and crash do not fit any S-curve.';
    return 'A herd landed with no predators on untouched lichen grows by about 30 % a year. Lichen grows back a few % a year, so for years the herd lives on the past. When the stock runs out the crash is sudden — the hard winter only chose the year. The lichen could have fed a few hundred for ever.';
  };

  function onDrag(S, e) {
    if (e.id !== 'lamp' || !S._lampAx) return;
    // dragging the panel up raises it: 1 px of drag is 1 px of panel, so the lamp follows the hand
    S.p.lampH = clamp(Math.round((S.p.lampH - e.dy / S._lampAx.pxPerCm) * 2) / 2, 5, 60);
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g7d-populations',
    grade: 7, unit: '7D', topics: ['D1'],
    subject: 'biology',
    name: 'Populations and Limits',
    chapter: 'Matter and Energy in Ecosystems',
    exams: ['NGSS MS-LS2-1', 'CAST'],
    weight: 'Populations',
    is3D: true, autoplay: true,
    stageHint: 'Every count is computed · drag the grow light up and down · drag the bench to look round it',
    lede: 'Five experiments on what stops a population growing. Grow <b>duckweed</b> in a jar and find which resource runs out first. Culture <b>Paramecium</b> as Gause did and watch the carrying capacity appear from the daily food. ' +
      'Fit an S-curve to <b>real counts</b>. Follow the <b>St Matthew Island reindeer</b> from 29 to 6 000 to 42. And put two species on <b>one food</b> to see which wins — or how they share.',
    params: preset({}),
    presets: [
      { name: 'Little nitrogen: the jar stops at 500', params: preset({ nit: 2 }) },
      { name: 'Plenty of nitrogen, scarce phosphorus', params: preset({ nit: 15, phos: 0.1 }) },
      { name: 'Everything plenty: space runs out', params: preset({ nit: 15, phos: 2, dia: 10 }) },
      { name: 'Too far from the light', params: preset({ nit: 15, phos: 2, lampH: 55 }) },
      { name: 'A cold room, 10 °C', params: preset({ nit: 15, phos: 2, temp: 10 }) },
      { name: 'Gause’s P. aurelia', params: preset({ setup: 'capacity', sp: 'aurelia' }) },
      { name: 'Gause’s P. caudatum', params: preset({ setup: 'capacity', sp: 'caudatum' }) },
      { name: 'Twice the food', params: preset({ setup: 'capacity', sp: 'caudatum', food: 2 }) },
      { name: 'The food halved on day 10', params: preset({ setup: 'capacity', sp: 'aurelia', cut: 10 }) },
      { name: 'Harvest a quarter every day', params: preset({ setup: 'capacity', sp: 'aurelia', harvest: 25 }) },
      { name: 'P. bursaria, with yeast on the bottom', params: preset({ setup: 'capacity', sp: 'bursaria', settle: 0.5 }) },
      { name: 'Carlson’s yeast, 1913', params: preset({ setup: 'data', dset: 'yeast', fitK: 500, fitR: 0.4 }) },
      { name: 'The reindeer counts', params: preset({ setup: 'data', dset: 'reindeer', fitK: 3000, fitR: 0.3 }) },
      { name: 'St Matthew Island, as it happened', params: preset({ setup: 'scarcity' }) },
      { name: 'No hard winter in 1963', params: preset({ setup: 'scarcity', snowK: 100 }) },
      { name: 'Hunt 15 % a year', params: preset({ setup: 'scarcity', hunt: 15 }) },
      { name: 'Gause: P. aurelia against P. caudatum', params: preset({ setup: 'competition', pair: 'ac' }) },
      { name: 'Gause: P. caudatum and P. bursaria share', params: preset({ setup: 'competition', pair: 'cb', settle: 0.5 }) },
      { name: 'No yeast: P. bursaria loses too', params: preset({ setup: 'competition', pair: 'cb', settle: 0 }) }
    ],
    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The jar', when: is('limits'), items: [
        { key: 'nit', label: 'Nitrate (as N)', min: 0.2, max: 20, step: 0.1, unit: 'mg/L', restructure: R_, fmt: v => v.toFixed(1) },
        { key: 'phos', label: 'Phosphate (as P)', min: 0.02, max: 2, step: 0.01, unit: 'mg/L', restructure: R_, fmt: v => v.toFixed(2) },
        { key: 'dia', label: 'Jar width', min: 6, max: 20, step: 0.5, unit: 'cm', restructure: R_ },
        { key: 'vol', label: 'Water', min: 0.25, max: 2, step: 0.05, unit: 'L', restructure: R_, fmt: v => v.toFixed(2) },
        { key: 'start', label: 'Fronds put in', min: 2, max: 60, step: 1, restructure: R_ } ] },
      { group: 'Light and warmth', when: is('limits'), items: [
        { key: 'lampH', label: 'Grow light height', min: 5, max: 60, step: 0.5, unit: 'cm', restructure: R_ },
        { key: 'temp', label: 'Room temperature', min: 2, max: 38, step: 1, unit: '°C', restructure: R_ } ] },
      { group: 'The culture', when: S => S.p.setup === 'capacity' || S.p.setup === 'competition', items: [
        { key: 'sp', type: 'select', label: 'Species', restructure: R_, when: is('capacity'), options: [{ value: 'aurelia', label: 'P. aurelia' }, { value: 'caudatum', label: 'P. caudatum' }, { value: 'bursaria', label: 'P. bursaria' }] },
        { key: 'pair', type: 'select', label: 'The pair', restructure: R_, when: is('competition'), options: [{ value: 'ac', label: 'aurelia + caudatum' }, { value: 'cb', label: 'caudatum + bursaria' }, { value: 'ab', label: 'aurelia + bursaria' }] },
        { key: 'food', label: 'Food (× Gause’s daily loop)', min: 0.2, max: 3, step: 0.05, restructure: R_, fmt: v => v.toFixed(2) + '×' },
        { key: 'settle', label: 'Share of food as yeast on the bottom', min: 0, max: 0.9, step: 0.05, restructure: R_, fmt: v => (v * 100).toFixed(0) + ' %' },
        { key: 'renew', label: 'Medium renewed', min: 0.2, max: 3, step: 0.1, unit: '× a day', restructure: R_ },
        { key: 'temp', label: 'Temperature', min: 15, max: 32, step: 0.5, unit: '°C', restructure: R_ },
        { key: 'n0', label: 'Animals put in', min: 1, max: 40, step: 1, restructure: R_, when: is('capacity') },
        { key: 'nA', label: 'First species put in', min: 1, max: 40, step: 1, restructure: R_, when: is('competition') },
        { key: 'nB', label: 'Second species put in', min: 1, max: 40, step: 1, restructure: R_, when: is('competition') } ] },
      { group: 'Scarcity and harvest', when: is('capacity'), items: [
        { key: 'cut', label: 'Halve the food on day', min: 0, max: 20, step: 1, restructure: R_, fmt: v => v > 0 ? 'day ' + v.toFixed(0) : 'never' },
        { key: 'harvest', label: 'Take out each day', min: 0, max: 80, step: 1, unit: '%', restructure: R_ },
        { key: 'sample', label: 'Sample counted', min: 0.05, max: 1, step: 0.05, unit: 'cm³', restructure: R_, fmt: v => v.toFixed(2) } ] },
      { group: 'The counts', when: is('data'), items: [
        { key: 'dset', type: 'select', label: 'Data', restructure: R_, options: [{ value: 'yeast', label: 'Carlson’s yeast, 1913' }, { value: 'reindeer', label: 'St Matthew reindeer' }, { value: 'jar', label: 'Your duckweed jar' }] },
        { key: 'fitK', label: 'Your K', min: 10, max: 8000, step: 1, restructure: R_, fmt: v => v.toFixed(0) },
        { key: 'fitR', label: 'Your r', min: 0.02, max: 1.2, step: 0.005, restructure: R_, fmt: v => v.toFixed(3) },
        { key: 'showFit', type: 'toggle', label: 'Show the best fit', display: true } ] },
      { group: 'The island', when: is('scarcity'), items: [
        { key: 'herd0', label: 'Reindeer landed in 1944', min: 2, max: 200, step: 1, restructure: R_ },
        { key: 'area', label: 'Island area', min: 50, max: 1000, step: 1, unit: 'km²', restructure: R_ },
        { key: 'regrow', label: 'Lichen regrowth', min: 1, max: 20, step: 0.5, unit: '% a year', restructure: R_ },
        { key: 'trample', label: 'Trampled for each tonne eaten', min: 0, max: 3, step: 0.1, unit: 't', restructure: R_ },
        { key: 'snowK', label: 'Lichen reachable in winter 1963–64', min: 5, max: 100, step: 1, unit: '%', restructure: R_ },
        { key: 'hunt', label: 'Hunted each year', min: 0, max: 40, step: 1, unit: '%', restructure: R_ } ] },
      { group: 'Time', when: S => S.p.setup !== 'data', items: [
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.5, label: 'slow' }, { value: 2, label: '2 a second' }, { value: 6, label: '6 a second' }] },
        { key: 'seed', label: 'Another set of samples', min: 1, max: 9, step: 1, restructure: R_, when: is('capacity') } ] }
    ],
    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ limits: 'Fronds in the jar, and the three ceilings', capacity: 'The culture: an S-curve to K', data: 'The counts and your logistic curve', scarcity: 'The herd and its lichen, 1944–1980', competition: 'Alone and together (Gause’s experiment)' })[S.p.setup], draw: plot1 },
      { title: S => ({ limits: 'Yield against nitrate: Liebig’s law of the minimum', capacity: 'Growth a day against numbers', data: 'Growth per individual against numbers', scarcity: 'Herd against lichen: a loop, not a balance', competition: 'The food left: who can live on less?' })[S.p.setup], draw: plot2 }
    ],
    readouts, equation, eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · limiting resources', params: preset({ nit: 2, phos: 0.5, dia: 12, vol: 1, start: 10 }),
        q: 'A litre of water holds 2 mg of nitrogen. Each duckweed frond is built with 4 µg of nitrogen. The jar starts with 10 fronds and has room for about 1 250. How many fronds can it hold in the end?',
        predict: { label: 'Fronds at the end', unit: 'fronds', tol: 0.04 },
        measure: S => lemRun(S.p, 60).F,
        working: '2 mg = 2 000 µg; 2 000 ÷ 4 = 500 new fronds, plus the 10 put in: <b>510</b>. Space would allow 1 250 and phosphorus 840, but the nitrogen runs out first — the scarcest resource sets the ceiling.' },
      { source: 'CAST pattern · carrying capacity', params: preset({ setup: 'capacity', sp: 'caudatum', food: 2 }),
        q: 'P. caudatum reaches 64 in 0.5 cm³ on Gause’s standard food of 30 million bacteria per mL. It eats the bacteria down to 1.7 million per mL — the least it can live on — and no further. What K do you expect with twice the food?',
        predict: { label: 'K with twice the food', unit: 'in 0.5 cm³', tol: 0.04 },
        measure: S => kAlone('caudatum', S.p, 0),
        working: 'K is the food eaten ÷ what one animal needs. The food eaten goes from 30 − 1.7 to 60 − 1.7: (58.3 ÷ 28.3) × 64 ≈ <b>132</b> — almost exactly double. K belongs to the food, not to the species.' },
      { source: 'CAST pattern · reading population data', params: preset({ setup: 'data', dset: 'yeast', fitK: 665, fitR: 0.535 }),
        q: 'Carlson’s yeast grew from 9.6 to 661.8 units in 18 hours, levelling off. Pearl fitted a logistic curve to it in 1920. What carrying capacity does the best logistic curve give?',
        predict: { label: 'K', unit: 'units', tol: 0.02 },
        measure: S => bestFit(dataset(S.p)).K,
        working: 'The counts level off at 660 and are still creeping up, so K is a little above the last count: the best fit is <b>665</b> (Pearl’s 1920 value), with r ≈ 0.54 an hour.' },
      { source: 'CAST pattern · predicting the response to scarcity', params: preset({ setup: 'capacity', sp: 'aurelia', cut: 10 }),
        q: 'A P. aurelia culture holds 105 in 0.5 cm³. On day 10 its daily food is halved. Where does the population settle?',
        predict: { label: 'New K', unit: 'in 0.5 cm³', tol: 0.05 },
        measure: S => { const C = culRun(S.p, ['aurelia'], [S.p.n0], 40, 0); return C.N[0]; },
        working: 'Half the food feeds about half as many: (15 − 0.8) ÷ (30 − 0.8) × 105 ≈ <b>51</b>. The animals do not change; the food does — the population falls until births again balance deaths.' },
      { source: 'CAST pattern · overshoot and crash', params: preset({ setup: 'scarcity' }),
        q: 'The lichen on St Matthew Island (about 48 000 t when untouched) regrows at most 6 % × 48 000 ÷ 4 a year. Each reindeer removes about 2 t a winter, eating and trampling. How many reindeer could it feed for ever?',
        predict: { label: 'Sustainable herd', unit: 'reindeer', tol: 0.04 },
        measure: S => sustainable(S.p),
        working: '6 % × 47 808 ÷ 4 ≈ 717 t a year; 717 ÷ 2 ≈ <b>359</b> reindeer. The herd reached about 6 000 — seventeen times that — by living on lichen grown over centuries; then it crashed to 42.' },
      { source: 'CAST pattern · competition', params: preset({ setup: 'competition', pair: 'ac' }),
        q: 'Gause grew P. aurelia and P. caudatum together on the same bacteria, two of each to start. P. aurelia can live on 0.81 million bacteria per mL; P. caudatum needs 1.72. Both grow at first. By about which day is P. caudatum down to fewer than one in 0.5 cm³?',
        predict: { label: 'Day P. caudatum is gone', unit: 'day', tol: 0.12 },
        measure: S => exclusionDay(S.p),
        working: 'Both grow while the bacteria are plentiful. Once P. aurelia has pulled them below 1.72, every P. caudatum dies faster than it divides; from its peak of about 15 it takes some two weeks to fade: by about <b>day 19</b>. Gause saw it vanish in about three weeks.' }
    ],

    walkthrough: [
      { title: 'More of everything?', ask: 'The jar has run out of nitrogen. You double the phosphate. What happens to the final number of fronds?', reveal: '<b>Nothing.</b> Growth is limited by the scarcest resource. Adding a resource that is not scarce changes nothing — only more nitrogen raises the ceiling, until something else (phosphorus, space) runs out instead.', params: preset({ nit: 2, phos: 1 }) },
      { title: 'Light and warmth set the pace', ask: 'Raise the grow light to 55 cm. Will the jar end with fewer fronds?', reveal: 'In 40 days, yes — but only because it grows more slowly. Light and temperature set how fast; the nutrients and the space set how far. Given long enough, a dim jar reaches the same ceiling.', params: preset({ nit: 15, phos: 2, lampH: 55 }) },
      { title: 'Where does K come from?', ask: 'Gause’s P. caudatum stops at 64. Is 64 a property of P. caudatum?', reveal: 'No. Double the daily food and it reaches about 130. K is set by the food supplied: the animals multiply until there is just enough food per animal to balance births and deaths.', params: preset({ setup: 'capacity', sp: 'caudatum', food: 2 }) },
      { title: 'The fastest growth', ask: 'When is a population adding the most animals a day — when it is small, half-full or nearly at K?', reveal: '<b>Half-full</b>. When small, there are few to breed; near K, food is short. The curve of growth a day against numbers peaks part-way up — at K/2 for a perfect logistic, a little lower here because food per animal falls quickly — which is why fishery managers keep stocks well below K.', params: preset({ setup: 'capacity', sp: 'aurelia', harvest: 25 }) },
      { title: 'Read K from the data', ask: 'On the second plot each dot is how fast each yeast cell was multiplying. What happens to that rate as the culture grows?', reveal: 'It falls in a straight line. Where the line meets zero growth is K. Fit the line and you have r (where it starts) and K (where it ends) — without waiting for the culture to level off.', params: preset({ setup: 'data', dset: 'yeast', fitK: 665, fitR: 0.54 }) },
      { title: 'The hard winter', ask: 'Turn off the hard winter of 1963–64. Do the reindeer survive?', reveal: 'Only a year or two longer. By 1963 the herd was eating its lichen far faster than it regrew; the winter only chose the year of the crash. Scarcity was built up for twenty years.', params: preset({ setup: 'scarcity', snowK: 100 }) },
      { title: 'One food, two species', ask: 'P. aurelia and P. caudatum both eat the same bacteria. Can they share forever?', reveal: 'No. The one that can live on less food (lower R*) keeps the bacteria too scarce for the other. Give P. bursaria yeast on the bottom, which P. caudatum does not use, and the two coexist.', params: preset({ setup: 'competition', pair: 'cb', settle: 0.5 }) }
    ],

    quiz: [
      { q: 'A jar of duckweed stops growing. Adding nitrate makes no difference. The most likely explanation is that', options: ['another resource — phosphate, light or space — is now the scarcest', 'duckweed cannot use nitrate', 'the plants are too old', 'the water is too warm'], answer: 0, why: 'Liebig’s law: the scarcest resource limits growth. Once nitrogen is plenty, something else runs out first. Set nitrate to 15 mg/L and watch the phosphorus or space ceiling take over.' },
      { q: 'The carrying capacity of a Paramecium culture depends mostly on', options: ['how much food is supplied each day', 'how fast each animal swims', 'how many animals were put in', 'how long the culture has run'], answer: 0, why: 'Double the food and K nearly doubles. The starting number only changes how soon it gets there.' },
      { q: 'A population grows fastest (most new individuals a day) when it is', options: ['about half its carrying capacity', 'very small', 'at its carrying capacity', 'above its carrying capacity'], answer: 0, why: 'dN/dt = rN(1 − N/K) is largest at N = K/2. Check the second plot of the capacity set-up.' },
      { q: 'The St Matthew Island reindeer crashed from 6 000 to 42 in about three years. The main cause was', options: ['the herd had eaten and trampled its lichen faster than it grows back', 'a disease brought by wolves', 'hunters from the mainland', 'the island sinking'], answer: 0, why: 'There were no predators and no hunting. Lichen regrows a few % a year; 6 000 reindeer remove far more. The hard winter of 1963–64 was the trigger, not the cause.' },
      { q: 'Gause grew P. aurelia and P. caudatum together on one kind of food. The result was that', options: ['one species died out', 'both settled at half their usual numbers', 'they took turns', 'both died out'], answer: 0, why: 'Two species that use exactly the same limiting resource cannot coexist: the better competitor (lower R*) wins — competitive exclusion.' }
    ],

    notes: '<p><b>Limiting resources.</b> A population grows by turning resources into more of itself. Each resource it needs — nitrogen, phosphorus, light, space, food — can support some number of individuals; the smallest of these numbers is the ceiling (<b>Liebig’s law of the minimum</b>). Light and temperature set how fast, the resources how far.</p>' +
      '<p><b>Carrying capacity</b> (<i>K</i>) is the population an environment can support for as long as its supply lasts: where births balance deaths because each individual gets only just enough. Growth draws an S-curve: slow when few, fastest at <i>K</i>/2, levelling at <i>K</i>. Gause (1934) measured r = 1.124 and K = 105 for P. aurelia and r = 0.794 and K = 64 for P. caudatum in 0.5 cm³.</p>' +
      '<p><b>Reading real data.</b> Carlson’s yeast (1913) follows a logistic curve almost exactly (K ≈ 665, r ≈ 0.54 an hour; Pearl 1920). Many real populations do not: a herd with a slowly renewed food can overshoot K and crash, as the St Matthew Island reindeer did (Klein 1968).</p>' +
      '<p><b>Competition.</b> Two species that need the same limiting resource cannot both persist on it: the one that can live on less wins (<b>competitive exclusion</b>, Gause). Species coexist when each uses something the other does not.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Carrying capacity is the most animals that can fit.” It is set by the resource that runs short — food, nitrogen, lichen — and moves when that supply moves. And a population can go above it for a while, at the cost of the resource that sets it.</div>'
  });

  L.models = L.models || {};
  L.models['g7d-populations'] = { LEM, lampI, ctmi, lemCeil, lemStart, lemFactors, lemStep, lemRun, SPEC, PAIRS, calib, rStar, kAlone, growthAt, culStart, culStep, culRun, exclusionDay, supply,
    CARLSON, KLEIN, dataset, logi, sse, bestFit, REIN, lichenMax, reinStart, reinYear, reinRun, reinAt, sustainable, poisson, BASE: () => preset({}), preset };
})(window.InsightLab);
