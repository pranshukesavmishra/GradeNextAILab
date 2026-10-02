/* ============================================================
   GRADE 6 · UNIT E · REGIONAL CLIMATE, ORGANISMS AND HEREDITY
   6E-4  Nature and Nurture Growth Chambers
   (E4.1 Environmental factors in growth; E4.2 Testing an environmental
    factor; E4.3 Genetic differences and growth; E4.4 Comparing individuals
    across conditions; E4.5 Separating genetic from environmental influence)

   Growth chambers of rapid-cycling Brassica rapa (Wisconsin Fast Plants),
   each plant grown day by day:
     dW/dt = RUE · PAR absorbed · light-use efficiency · f(T) · f(water) · f(N)
             − maintenance
     PAR absorbed = PAR · pot area · (1 − e^{−0.65 LAI}), LAI from leaf mass and
     specific leaf area (thinner leaves in dim light); efficiency (Psat/PPFD)(1 − e^{−PPFD/Psat}), 1.6 g/mol in dim light;
     f(T) a beta function (4, 24, 36 °C), f(water) = 1 − e^{−w/w₀},
     f(N) = N/(N + 40 mg/L); height with shade-avoidance stretching; flowering
     at 250 degree-days above 4 °C; each plant its own small random vigour.
   Five genotypes that differ in one or two parameters, as real mutants and
   cultivars do (rosette dwarf; sun and shade types; anthocyanin-rich).
   Two classic cases where one genotype gives different phenotypes:
     coat      — the Himalayan rabbit: its tyrosinase works only below about
                 33.5 °C, so fur grows dark only where the skin is cool; shave
                 the back and strap on an ice pack, and the new fur grows black.
     hydrangea — Hydrangea macrophylla: the same plant is blue in acid soil
                 (aluminium dissolves and colours the delphinidin) and pink in
                 alkaline soil; a white cultivar stays white in any soil.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6L, G6E, R3, MEAS and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, LF = () => window.G6L, ART = () => window.G6E;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003 + 0.5) / 1000003.5; }; }
  const gaussOf = r => () => { const a = r(), b = r(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(TAU * b); };

  /* ============================================================
     1. THE PLANT MODEL
     ============================================================ */
  const GENO = {
    wt: { name: 'standard (wild type)', rue: 1.0, psat: 450, maint: 0.035, hgt: 1.0, purple: 0.1, col: '#C9D4EA' },
    dwarf: { name: 'rosette dwarf', rue: 0.95, psat: 450, maint: 0.035, hgt: 0.35, purple: 0.1, col: '#8FD18B' },
    sun: { name: 'sun type', rue: 1.0, psat: 1100, maint: 0.06, sla: 0.85, hgt: 1.05, purple: 0.1, col: '#FFC85A' },
    shade: { name: 'shade type', rue: 0.97, psat: 160, maint: 0.006, sla: 1.5, hgt: 1.1, purple: 0.1, col: '#7FB7F2' },
    purple: { name: 'purple stem (anthocyanin)', rue: 0.98, psat: 450, maint: 0.035, hgt: 1.0, purple: 0.9, col: '#C78AE0' }
  };
  const POT_A = 0.01, RUEQ = 1.6;                        // g dry mass per mol of absorbed PAR, at low light                                     // m² of light each pot gets
  const DAYS = 28;
  const fTemp = T => { const Tmin = 4, Topt = 24, Tmax = 36; if (T <= Tmin || T >= Tmax) return 0; return ((Tmax - T) / (Tmax - Topt)) * Math.pow((T - Tmin) / (Topt - Tmin), (Topt - Tmin) / (Tmax - Topt)); };
  const fWater = (w, lai) => 1 - Math.exp(-w / (4 + 4.5 * Math.min(4, lai)));
  const fN = N => N / (N + 40);
  /* one plant, day by day. env: { ppfd µmol/m²/s, photo h, water mL/day, N mg/L, T °C }. vig: the plant's own vigour (×) */
  function growPlant(gk, env, vig, days) {
    const g = GENO[gk], hist = [];
    let W = 0.002, dd = 0, h = 0.5, minW = 1;
    const parMol = env.ppfd * env.photo * 3600e-6;
    for (let d = 0; d <= (days == null ? DAYS : days); d++) {
      const sla = 0.045 * (g.sla || 1) * (1 + 0.8 * 150 / (150 + env.ppfd)), lai = sla * 0.6 * W / POT_A;
      const fw = fWater(env.water, lai), ft = fTemp(env.T), fn = fN(env.N);
      const absorbed = parMol * POT_A * (1 - Math.exp(-0.65 * lai));
      // the same quantum efficiency in dim light for every genotype; each saturates at its own light (psat)
      const eff = RUEQ * g.rue * (env.ppfd > 1 ? g.psat / env.ppfd * (1 - Math.exp(-env.ppfd / g.psat)) : 1);
      const gross = eff * vig * absorbed * ft * fw * fn;
      const maint = g.maint * W * Math.pow(2, (env.T - 20) / 10);
      if (d > 0) W = Math.max(0.0005, W + gross - maint);
      dd += Math.max(0, env.T - 4);
      // stretching: dim light makes a plant taller and spindlier for its mass
      h = g.hgt * (4 + 22 * W / (W + 0.25)) * (1 + 0.9 * 120 / (120 + env.ppfd)) * (0.6 + 0.4 * ft);
      minW = Math.min(minW, fw);
      hist.push({ d, W, h, lai, fw, ft, fn, fl: clamp((dd - 250) / 120, 0, 1), leaves: Math.min(9, 2 + Math.floor(W * 6 + d / 5)), purple: clamp(g.purple * (0.4 + 0.6 * env.ppfd / 800) + (env.T < 12 ? 0.25 : 0), 0, 1) });
    }
    return hist;
  }
  /* a chamber of n plants of one genotype, each with its own vigour (lognormal, σ = noise) */
  function chamberRun(gk, env, n, noise, seed) {
    const r = rng(seed), g = gaussOf(r), plants = [];
    for (let i = 0; i < n; i++) { const vig = Math.exp(noise * g()); plants.push({ gk, vig, hist: growPlant(gk, env, vig) }); }
    const final = plants.map(p => p.hist[DAYS].W), mean = final.reduce((a, b) => a + b, 0) / n;
    const sd = n > 1 ? Math.sqrt(final.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n - 1)) : 0;
    const hs = plants.map(p => p.hist[DAYS].h), hmean = hs.reduce((a, b) => a + b, 0) / n;
    return { plants, mean, sd, se: n > 1 ? sd / Math.sqrt(n) : 0, hmean, final };
  }
  /* Welch's t for two groups, and a two-sided p from the t distribution (normal approximation corrected for df) */
  function welch(a, b) {
    const ma = a.mean, mb = b.mean, va = a.sd * a.sd / a.final.length, vb = b.sd * b.sd / b.final.length, se = Math.sqrt(va + vb) || 1e-9, t = (ma - mb) / se;
    const df = Math.pow(va + vb, 2) / ((va * va) / Math.max(1, a.final.length - 1) + (vb * vb) / Math.max(1, b.final.length - 1) || 1);
    return { t, df, p: tTwoSided(t, Math.max(1, df)) };
  }
  /* two-sided p of Student's t: the regularised incomplete beta I_{df/(df+t²)}(df/2, 1/2), by Lentz's continued fraction */
  function lgamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015; for (let j = 0; j < 6; j++) ser += c[j] / ++y; return -tmp + Math.log(2.5066282746310005 * ser / x); }
  function betacf(a, b, x) { let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break; } return h; }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const tTwoSided = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);
  /* two-way analysis of a 2 × 2 design with n per cell: shares of the variation from G, E, G×E and the rest */
  function anova2(cells) {
    const all = cells.flat(), n = cells[0].length, grand = all.reduce((a, b) => a + b, 0) / all.length;
    const m = cells.map(c => c.reduce((a, b) => a + b, 0) / c.length);           // [g0e0, g0e1, g1e0, g1e1]
    const gm = [(m[0] + m[1]) / 2, (m[2] + m[3]) / 2], em = [(m[0] + m[2]) / 2, (m[1] + m[3]) / 2];
    const ssG = 2 * n * gm.reduce((s, v) => s + (v - grand) ** 2, 0), ssE = 2 * n * em.reduce((s, v) => s + (v - grand) ** 2, 0);
    const ssCells = n * m.reduce((s, v) => s + (v - grand) ** 2, 0), ssGE = ssCells - ssG - ssE;
    const ssR = cells.reduce((s, c, i) => s + c.reduce((q, v) => q + (v - m[i]) ** 2, 0), 0), tot = ssG + ssE + ssGE + ssR || 1;
    return { G: ssG / tot, E: ssE / tot, GE: Math.max(0, ssGE) / tot, R: ssR / tot, means: m };
  }

  /* ============================================================
     2. THE HIMALAYAN RABBIT — a temperature-sensitive enzyme
     Skin temperature of each region: T = Tair + (39 − Tair)·k, k the region's
     insulation (back 0.86, the shaved patch 0.45, nose 0.55, tail 0.5, feet
     0.45, ears 0.38); an ice pack holds the patch at 12 °C. The c^h allele's
     tyrosinase makes melanin only below ~33.5 °C: dark fraction
     1/(1 + e^{(T − 33.5)/0.6}). New fur grows in over four weeks.
     ============================================================ */
  const REGIONS = { back: 0.86, patch: 0.45, nose: 0.55, tail: 0.5, feet: 0.45, ears: 0.38 };
  function skinT(region, Tair, ice) { if (region === 'patch' && ice) return 12; return Tair + (39 - Tair) * REGIONS[region]; }
  function darkness(geno, T) { if (geno === 'CC') return 1; if (geno === 'cc') return 0; return 1 / (1 + Math.exp((T - 33.5) / 0.6)); }
  function coatOf(p, weeks) {
    const out = {}, grow = clamp(weeks / 4, 0, 1);
    Object.keys(REGIONS).forEach(r => {
      // the old fur stays as it grew (raised at 20 °C); the shaved patch regrows under today's conditions
      const now = darkness(p.geno, skinT(r, p.Tair, p.ice && p.shave)), before = darkness(p.geno, skinT(r, 20, false));
      out[r] = r === 'patch' ? (p.shave ? now * grow : before) : before + (now - before) * grow;
    });
    return out;
  }

  /* ============================================================
     3. THE HYDRANGEA — soil chemistry colours a flower
     Dissolved aluminium rises steeply as soil acidifies (gibbsite
     solubility ∝ 10^{3(pKs − pH)}, here 0.3 mg/kg at pH 6.5 rising ×10 a
     unit), plus what aluminium sulphate adds; phosphate locks it up. Sepal Al
     (µg/g fresh) = 180·Al/(Al + 12)·1/(1 + 2P), blue where it passes
     ~40 µg/g (it forms the blue Al–delphinidin complex), pink where it is
     low. A white cultivar makes no delphinidin and stays white.
     ============================================================ */
  function soilAl(pH, sulf) { return 0.3 * Math.pow(10, 1.0 * (6.5 - pH)) + sulf * 2.5 * Math.pow(10, 0.5 * (6.5 - pH)) / (1 + Math.pow(10, 0.5 * (6.5 - pH))); }
  function sepalAl(p) { const al = soilAl(p.pH, p.sulf); return 180 * al / (al + 12) / (1 + 2 * p.phos); }
  const blueness = alS => 1 / (1 + Math.exp(-(alS - 40) / 8));
  function flowerColour(p) {
    if (p.cultivar === 'white') return '#F2F0E6';
    const b = blueness(sepalAl(p)), pink = [232, 120, 168], blue = [88, 120, 216], mixc = [pink[0] + (blue[0] - pink[0]) * b, pink[1] + (blue[1] - pink[1]) * b, pink[2] + (blue[2] - pink[2]) * b];
    return '#' + mixc.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
  }

  /* ============================================================
     4. THE EXPERIMENT — chambers per set-up
     ============================================================ */
  const SETUPS = [
    { value: 'environment', label: 'What a plant needs', teaches: ['E4.1'] },
    { value: 'test', label: 'Test one factor fairly', teaches: ['E4.2'] },
    { value: 'genes', label: 'Same chamber, different seeds', teaches: ['E4.3'] },
    { value: 'compare', label: 'Every seed in every chamber', teaches: ['E4.4'] },
    { value: 'separate', label: 'Genes or environment? A 2 × 2', teaches: ['E4.5'] },
    { value: 'coat', label: 'The Himalayan rabbit', teaches: ['E4.3', 'E4.5'] },
    { value: 'hydrangea', label: 'Blue or pink hydrangeas', teaches: ['E4.1', 'E4.4'] }
  ];
  const is = (...a) => S => a.indexOf(S.p.setup) >= 0;
  const STD = { ppfd: 400, photo: 16, water: 40, N: 200, T: 22 };
  const FACTORS = {
    ppfd: { name: 'light', unit: 'µmol/m²/s', levels: [100, 250, 500, 900] },
    water: { name: 'water', unit: 'mL a day', levels: [5, 12, 25, 50] },
    N: { name: 'nitrogen', unit: 'mg/L', levels: [10, 40, 120, 300] },
    T: { name: 'temperature', unit: '°C', levels: [10, 16, 22, 30] }
  };
  const BASE = { setup: 'environment', geno: 'wt', ppfd: 400, photo: 16, water: 40, N: 200, T: 22, factor: 'ppfd', reps: 4, noise: 0.12, confound: false, seed: 1, pace: 10,
    gpair: 'sunshade', dim: 120, bright: 800,
    rgeno: 'chch', Tair: 20, shave: true, ice: true, weeks: 4,
    cultivar: 'mop', pH: 5.0, sulf: 0, phos: 0 };
  const SETUP_DEFAULTS = { environment: {}, test: { reps: 4 }, genes: {}, compare: { factor: 'ppfd' }, separate: { reps: 4 }, coat: {}, hydrangea: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const growSetup = p => ['environment', 'test', 'genes', 'compare', 'separate'].indexOf(p.setup) >= 0;
  const envOf = p => ({ ppfd: p.ppfd, photo: p.photo, water: p.water, N: p.N, T: p.T });
  /* the chambers a set-up uses: [{ label, env, plants:[{gk}], run }] */
  function chambersOf(p) {
    const reps = Math.round(clamp(p.reps, 1, 6)), seed = p.seed * 97;
    if (p.setup === 'environment') return [
      { label: 'Your chamber', env: envOf(p), gk: p.geno, run: chamberRun(p.geno, envOf(p), 4, p.noise, seed + 1) },
      { label: 'Standard chamber', env: Object.assign({}, STD), gk: p.geno, run: chamberRun(p.geno, STD, 4, p.noise, seed + 2) }];
    if (p.setup === 'test') {
      const F = FACTORS[p.factor];
      return F.levels.map((v, i) => { const env = Object.assign({}, STD, { [p.factor]: v }); if (p.confound && i === 3) env.T = p.factor === 'T' ? env.T : 30; if (p.confound && i === 3 && p.factor === 'T') env.ppfd = 900; return { label: String.fromCharCode(65 + i) + ': ' + v + ' ' + F.unit, env, gk: 'wt', run: chamberRun('wt', env, reps, p.noise, seed + 10 + i) }; });
    }
    if (p.setup === 'genes') return ['wt', 'dwarf', 'sun', 'shade'].map((gk, i) => ({ label: GENO[gk].name, env: envOf(p), gk, run: chamberRun(gk, envOf(p), reps, p.noise, seed + 20 + i) }));
    if (p.setup === 'compare') {
      const F = FACTORS[p.factor];
      return F.levels.map((v, i) => { const env = Object.assign({}, STD, { [p.factor]: v }); return { label: v + ' ' + F.unit, env, multi: ['wt', 'dwarf', 'sun', 'shade'].map((gk, j) => ({ gk, run: chamberRun(gk, env, 1, p.noise * 0.3, seed + 30 + i * 7 + j) })) }; });
    }
    const pair = p.gpair === 'sunshade' ? ['sun', 'shade'] : ['wt', 'dwarf'];
    const out = [];
    pair.forEach((gk, gi) => [p.dim, p.bright].forEach((L_, ei) => { const env = Object.assign({}, STD, { ppfd: L_ }); out.push({ label: GENO[gk].name.split(' ')[0] + ', ' + L_ + ' µmol', env, gk, run: chamberRun(gk, env, reps, p.noise, seed + 40 + gi * 2 + ei) }); }));
    return out;
  }
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (!p.pre && (first ? p.setup !== BASE.setup : S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    p.reps = Math.round(clamp(p.reps, 1, 6)); p.seed = Math.round(p.seed);
    S.t = 0; S.day = 0; S.ts = 0;
    if (growSetup(p)) {
      S.ch = chambersOf(p);
      if (p.setup === 'separate') S.av = anova2(S.ch.map(c => c.run.final));
      if (p.setup === 'test') S.tt = welch(S.ch[3].run, S.ch[0].run);
      const n = S.ch.length;
      if (!S.cam || S.camKey !== 'ch' + n) { S.cam = Camera({ theta: -1.5708, phi: 0.16, dist: n === 2 ? 1.75 : 3.8, target: [0, 0, n === 2 ? 0.36 : 0.6], fov: 0.62 }); S.cam.minDist = 0.8; S.cam.maxDist = 8; S.camKey = 'ch' + n; }
    } else if (!S.cam || S.camKey !== 'flat') { S.cam = Camera({ theta: -1.5, phi: 0.2, dist: 3, target: [0, 0, 0] }); S.camKey = 'flat'; }
  }
  function step(S, dt) {
    const p = S.p;
    S.ts += dt;
    if (growSetup(p)) S.day = Math.min(DAYS, S.day + dt * p.pace);
  }

  /* ============================================================
     5. THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const LIGHT = '#EAF1FF', DIM = '#9FB0CC';
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), f3 = v => v.toFixed(3);
  function lay(g) { const W = g.w, narrow = W < 640, cardW = narrow ? W - 20 : Math.min(340, Math.max(270, W * 0.28)); return { W, H: g.h, narrow, cardW, sw: narrow ? W : W - cardW - 24, HD: 58 }; }
  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !LF() || !ART()) return;
    const Ly = lay(g);
    if (growSetup(p)) stageChambers(S, g, Ly);
    else if (p.setup === 'coat') stageRabbit(S, g, Ly);
    else stageHydrangea(S, g, Ly);
    const H = headerOf(S); K.header(g, H[0], H[1], H[2]);
  }
  function headerOf(S) {
    const p = S.p, d = Math.floor(S.day);
    if (p.setup === 'environment') { const a = S.ch[0].run, b = S.ch[1].run; return ['Day ' + d + ': your plants weigh ' + Math.round(a.mean / b.mean * 100) + ' % of the standard chamber’s at day 28', 'light ' + p.ppfd + ' µmol/m²/s for ' + p.photo + ' h · water ' + p.water + ' mL a day · nitrogen ' + p.N + ' mg/L · ' + p.T + ' °C', GENO[p.geno].name + ' · dry mass after 28 days: ' + f2(a.mean) + ' g against ' + f2(b.mean) + ' g']; }
    if (p.setup === 'test') { const F = FACTORS[p.factor], tt = S.tt; return ['Testing ' + F.name + ': chamber D grows ' + f2(S.ch[3].run.mean) + ' g, A ' + f2(S.ch[0].run.mean) + ' g' + (p.confound ? ' — but D was also changed in another way' : ''), p.reps + ' plants a chamber · plant-to-plant spread ±' + Math.round(p.noise * 100) + ' % · everything else held at the standard', 'D against A: t = ' + f1(tt.t) + ', p = ' + (tt.p < 0.001 ? '< 0.001' : f3(tt.p)) + (tt.p < 0.05 ? ' — a real difference' : ' — could be chance')]; }
    if (p.setup === 'genes') { const m = S.ch.map(c => c.run); return ['One environment, four kinds of seed: ' + S.ch.map((c, i) => GENO[c.gk].name.split(' ')[0] + ' ' + f2(m[i].mean) + ' g').join(' · '), 'every chamber the same: ' + p.ppfd + ' µmol/m²/s, ' + p.water + ' mL, ' + p.N + ' mg/L N, ' + p.T + ' °C', 'the differences are in the seeds — their genes']; }
    if (p.setup === 'compare') { const F = FACTORS[p.factor]; return ['Every kind of seed at four levels of ' + F.name + ': the reaction norms cross', 'lowest ' + F.levels[0] + ' → highest ' + F.levels[3] + ' ' + F.unit + ' · no single genotype is best everywhere', 'best at the lowest: ' + GENO[bestAt(S, 0)].name + ' · best at the highest: ' + GENO[bestAt(S, 3)].name]; }
    if (p.setup === 'separate') { const a = S.av; return ['Of all the variation in mass: genes ' + Math.round(a.G * 100) + ' %, light ' + Math.round(a.E * 100) + ' %, genes × light ' + Math.round(a.GE * 100) + ' %, plant-to-plant ' + Math.round(a.R * 100) + ' %', '2 × 2: ' + (p.gpair === 'sunshade' ? 'sun type and shade type' : 'standard and rosette dwarf') + ' × ' + p.dim + ' and ' + p.bright + ' µmol/m²/s · ' + p.reps + ' plants in each', 'a two-way analysis of variance on the day-28 dry mass']; }
    if (p.setup === 'coat') { const c = coatOf(p, p.weeks); return ['Himalayan rabbit, week ' + p.weeks + ': ' + (p.shave && p.ice ? 'the shaved patch under the ice pack grows ' + (c.patch > 0.5 ? 'black fur' : 'white fur') : 'dark fur on the cold parts only'), 'genotype ' + p.rgeno.replace('chch', 'cʰcʰ') + ' · room ' + p.Tair + ' °C · ears ' + f1(skinT('ears', p.Tair, false)) + ' °C, back ' + f1(skinT('back', p.Tair, false)) + ' °C', 'its tyrosinase makes black pigment only below ~33.5 °C — the gene sets the rule, the temperature sets the pattern']; }
    const al = sepalAl(p);
    return [(p.cultivar === 'white' ? 'A white cultivar: white at pH ' + f1(p.pH) + ', as in any soil' : 'pH ' + f1(p.pH) + ': the flowers are ' + (blueness(al) > 0.66 ? 'blue' : blueness(al) < 0.33 ? 'pink' : 'mauve')), 'soil aluminium ' + f2(soilAl(p.pH, p.sulf)) + ' mg/kg in solution · aluminium sulphate ' + p.sulf + ' g/m² · phosphate ' + p.phos.toFixed(1), 'sepal aluminium ' + f1(al) + ' µg/g (blue above ~40) · same genes, different soil, different colour'];
  }
  function bestAt(S, i) { const m = S.ch[i].multi; return m.reduce((b, q) => q.run.mean > b.run.mean ? q : b, m[0]).gk; }

  /* ---------- the growth chambers ---------- */
  function stageChambers(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, A = LF(), sw = Ly.sw, Me = window.MEAS, d = Math.floor(S.day), fd = S.day - d;
    cam.fov = Ly.narrow ? 0.9 : 0.62; cam.setViewport(sw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.34 });
    const n = S.ch.length, W = 0.62, D = 0.42, H = 0.62, gap = 0.12, x0 = -(n * W + (n - 1) * gap) / 2 + W / 2;
    if (Me) { Me.bench(F, x0 - W / 2 - 0.2, -x0 + W / 2 + 0.2, -0.4, 0.4, { cabinet: '#A9B2BC' }); Me.tileWall(F, x0 - W / 2 - 0.2, -x0 + W / 2 + 0.2, 0.4, 0, 1.0); }
    const labels = [];
    S.ch.forEach((c, i) => {
      const cx = x0 + i * (W + gap), env = c.env, Lrel = clamp(env.ppfd / 900, 0.05, 1), tint = env.T < 14 ? '#D8E8FF' : env.T > 27 ? '#FFE0C0' : '#FFF4E0';
      const C = A.chamber(F, [cx, 0, 0.02], W, D, H, { light: Lrel, tint });
      // the pots and plants: rows of up to three, each plant at today's computed size
      const list = c.multi ? c.multi.map(m => ({ gk: m.gk, hist: m.run.plants[0].hist })) : c.run.plants.map(pl => ({ gk: c.gk, hist: pl.hist }));
      const m = list.length, rows = m > 3 ? 2 : 1, perRow = Math.ceil(m / rows);
      list.forEach((pl, k) => {
        const row = Math.floor(k / perRow), col = k % perRow, px = cx - W / 2 + (col + 0.5) * W / perRow, py = rows === 2 ? (row ? -0.08 : 0.1) : 0.02, pz = 0.02;
        const at = [px, py, pz + 0.09];
        F.push(at, () => {
          const q = cam.project(at), qt = cam.project([px, py, pz + 0.09 + 0.01]); if (!q.ok || !qt.ok) return;
          const pxPerM = q.s, hd = pl.hist[d], hn = pl.hist[Math.min(DAYS, d + 1)], h = (hd.h + (hn.h - hd.h) * fd) / 100;
          A.pot(ctx, q.x, q.y, 0.085 * pxPerM, { label: c.multi ? GENO[pl.gk].name[0].toUpperCase() : null });
          A.brassica(ctx, q.x, q.y - 0.006 * pxPerM, Math.max(4, h * pxPerM), { leaves: hd.leaves, leafS: Math.max(3, Math.sqrt(hd.W + 0.01) * 0.075 * pxPerM), green: hd.fn * 0.6 + 0.4, purple: hd.purple, flowers: hd.fl, wilt: clamp(1 - hd.fw, 0, 0.8) * 1.2, thin: clamp(120 / (120 + env.ppfd), 0, 1), seed: i * 7 + k });
        });
      });
      labels.push([C.top, c.label]);
      // the chamber's own display: its settings
      F.push([cx + W / 2 - 0.08, -D / 2 - 0.03, H + 0.06], () => {
        const q = cam.project([cx + W / 2 - 0.1, -D / 2 - 0.03, H - 0.02]); if (!q.ok) return;
        const s = q.s * 0.001, w = Math.max(56, 90 * s * 1.6), h = 30;
        ctx.fillStyle = '#0E1620'; ctx.fillRect(q.x - w, q.y - h, w, h); ctx.strokeStyle = '#3A4A5A'; ctx.strokeRect(q.x - w, q.y - h, w, h);
        ctx.font = mono(Ly.narrow ? 7 : 8.5, 600); ctx.fillStyle = '#7CF0A0'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(env.T + '°C ' + env.ppfd + 'µ', q.x - w + 4, q.y - h + 4); ctx.fillText(env.water + 'mL N' + env.N, q.x - w + 4, q.y - h + 16);
      }, -0.02);
    });
    F.render();
    // chamber names above each cabinet
    labels.forEach(([at, t]) => { const q = cam.project(at); if (!q.ok) return; ctx.font = sans(Ly.narrow ? 10 : 12, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; const tt = kit().fitText(ctx, t, Math.max(60, sw / n - 16)), tw = ctx.measureText(tt).width, xx = clamp(q.x, tw / 2 + 6, sw - tw / 2 - 6); ctx.strokeText(tt, xx, q.y - 4); ctx.fillStyle = LIGHT; ctx.fillText(tt, xx, q.y - 4); });
    ctx.restore();
    // the lab notebook
    const K = kit(), sl = K.cardSlot(g, S, 'Notebook', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const rows = notebook(S);
      const h = 34 + rows.length * 19 + 10; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Notebook — dry mass on day 28', sl.x + 10, sl.y + 8);
      rows.forEach((r, i) => { const yy = sl.y + 30 + i * 19; ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(kit().fitText(ctx, r[0], sl.w * 0.58), sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = r[2] || LIGHT; ctx.textAlign = 'right'; ctx.fillText(r[1], sl.x + sl.w - 10, yy); });
    }
  }
  function notebook(S) {
    const p = S.p;
    if (p.setup === 'compare') { const rows = []; S.ch.forEach(c => { rows.push([c.label, '', '#FFD38A']); c.multi.forEach(m => rows.push(['  ' + GENO[m.gk].name, f2(m.run.mean) + ' g', GENO[m.gk].col])); }); return rows.slice(0, 20); }
    const rows = S.ch.map(c => [c.label, f2(c.run.mean) + ' ± ' + f2(c.run.se) + ' g', c.gk ? GENO[c.gk].col : LIGHT]);
    if (p.setup === 'test') rows.push(['D vs A: p', S.tt.p < 0.001 ? '< 0.001' : f3(S.tt.p), S.tt.p < 0.05 ? '#4FD18B' : '#E8907F']);
    if (p.setup === 'separate') { const a = S.av; rows.push(['genes', Math.round(a.G * 100) + ' %', '#FFC85A'], ['environment', Math.round(a.E * 100) + ' %', '#7FB7F2'], ['genes × environment', Math.round(a.GE * 100) + ' %', '#C78AE0'], ['plant to plant', Math.round(a.R * 100) + ' %', DIM]); }
    if (p.setup === 'environment') { const h = S.ch[0].run.plants[0].hist[DAYS]; rows.push(['height, yours', f1(S.ch[0].run.hmean) + ' cm'], ['temperature factor f(T)', f2(h.ft)], ['water factor', f2(h.fw)], ['nitrogen factor', f2(h.fn)], ['ratio, yours ÷ standard', Math.round(S.ch[0].run.mean / S.ch[1].run.mean * 100) + ' %', '#FFD38A']); }
    return rows;
  }

  /* ---------- the rabbit hutch ---------- */
  function stageRabbit(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), sw = Ly.sw, H = g.h;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const wall = ctx.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#3A4250'); wall.addColorStop(1, '#232830'); ctx.fillStyle = wall; ctx.fillRect(0, 0, sw, H);
    const fy = H * 0.72; const fl = ctx.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, '#B8A060'); fl.addColorStop(1, '#7A6838'); ctx.fillStyle = fl; ctx.fillRect(0, fy, sw, H - fy);
    // straw
    ctx.strokeStyle = 'rgba(230,210,140,.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 120; k++) { const x = (k * 53) % sw, y = fy + 6 + (k * 31) % (H - fy - 10); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14 * Math.cos(k), y + 4 * Math.sin(k * 2)); ctx.stroke(); }
    // the hutch's wire front behind
    ctx.strokeStyle = 'rgba(160,170,180,.25)'; ctx.lineWidth = 1; for (let x = 0; x < sw; x += 16) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, fy); ctx.stroke(); } for (let y = 70; y < fy; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sw, y); ctx.stroke(); }
    const s = Math.max(60, Math.min(sw * 0.46, (fy - 150) * 1.35)), cx = sw * 0.46, cy = fy - s * 0.32;
    const c = coatOf(p, p.weeks);
    A.rabbit(ctx, cx, cy, s, { points: c, patch: p.shave });
    // the ice pack, strapped over the shaved patch
    if (p.shave && p.ice) { const ix = cx + (-12) * s / 100, iy = cy + (-20) * s / 100; ctx.save(); ctx.translate(ix, iy); ctx.rotate(-0.1); const ig = ctx.createLinearGradient(0, -s * 0.05, 0, s * 0.05); ig.addColorStop(0, '#9AD8F8'); ig.addColorStop(1, '#3A9AD8'); ctx.fillStyle = ig; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(0, -s * 0.03, s * 0.13, s * 0.05, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(220,240,255,.8)'; ctx.stroke(); ctx.restore(); }
    // a wall thermometer
    const tx = sw - 50, t0 = 100, t1 = fy - 40, Ty = v => t1 - (v + 10) / 50 * (t1 - t0);
    ctx.fillStyle = '#E8ECF0'; ctx.fillRect(tx - 14, t0 - 14, 28, t1 - t0 + 34); ctx.fillStyle = '#C83A2A'; ctx.fillRect(tx - 2, Ty(p.Tair), 4, t1 - Ty(p.Tair)); RX_ball(ctx, tx, t1 + 6, 7, '#C83A2A');
    ctx.font = mono(8); ctx.fillStyle = '#333'; ctx.textAlign = 'right'; [-10, 0, 10, 20, 30, 40].forEach(v => { ctx.fillRect(tx + 3, Ty(v), 5, 1); ctx.fillText(String(v), tx - 4, Ty(v) + 3); });
    ctx.font = mono(10, 700); ctx.fillStyle = '#FFD38A'; ctx.textAlign = 'center'; ctx.fillText(p.Tair + ' °C', tx, t0 - 20);
    // region temperatures as leader labels
    if (g.labels && !Ly.narrow) {
      const lab = (lx, ly, r, txt) => { const X = cx + lx * s / 100, Y = cy + ly * s / 100, t = skinT(r, p.Tair, r === 'patch' && p.ice && p.shave); ctx.strokeStyle = 'rgba(220,230,245,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + 40, Y - 30); ctx.stroke(); ctx.font = mono(10, 600); ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; const tt = txt + ' ' + f1(t) + ' °C'; ctx.strokeText(tt, X + 44, Y - 30); ctx.fillStyle = t < 33.5 ? '#9CC8FF' : '#FFB27A'; ctx.fillText(tt, X + 44, Y - 30); };
      lab(26, -64, 'ears', 'ear skin'); lab(-10, -6, 'back', 'back skin'); if (p.shave) lab(-12, -16, 'patch', p.ice ? 'patch, under ice' : 'shaved patch'); lab(46, -12, 'nose', 'nose'); lab(-24, 36, 'feet', 'foot');
    }
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'Fur, region by region', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const regs = ['ears', 'nose', 'feet', 'tail', 'back', 'patch'], h = 36 + regs.length * 22 + 10; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Skin temperature and the fur it grows', sl.x + 10, sl.y + 8);
      regs.forEach((r, i) => {
        const yy = sl.y + 32 + i * 22, t = skinT(r, p.Tair, r === 'patch' && p.ice && p.shave), dk = c[r];
        ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r === 'patch' ? 'shaved patch' : r, sl.x + 10, yy);
        ctx.fillStyle = t < 33.5 ? '#9CC8FF' : '#FFB27A'; ctx.fillText(f1(t) + ' °C', sl.x + sl.w * 0.42, yy);
        const v = Math.round(242 - dk * 214); ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + (v - 4) + ')'; ctx.fillRect(sl.x + sl.w - 70, yy - 1, 56, 13); ctx.strokeStyle = '#555'; ctx.strokeRect(sl.x + sl.w - 70, yy - 1, 56, 13);
      });
    }
  }
  const RX_ball = (ctx, x, y, r, c) => window.RX && window.RX.ball(ctx, x, y, r, c, { shadow: false });

  /* ---------- the hydrangea bed ---------- */
  function stageHydrangea(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), sw = Ly.sw, H = g.h;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#5A86B8'); sky.addColorStop(1, '#C8DCE8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, sw, H);
    const gy = H * 0.62; ctx.fillStyle = '#5A7A3A'; ctx.fillRect(0, gy, sw, H - gy);
    // a pH series of the same plant across the bed; the one you set is the big one in front
    const series = [4.5, 5.25, 6.0, 6.75, 7.5];
    series.forEach((pH, i) => {
      const x = sw * [0.07, 0.19, 0.31, 0.82, 0.94][i], y = gy + 6, col = flowerColour(Object.assign({}, p, { pH, sulf: 0, phos: 0 }));
      ctx.fillStyle = '#3A2A1E'; ctx.beginPath(); ctx.ellipse(x, y + 10, sw * 0.07, 8, 0, 0, TAU); ctx.fill();
      A.hydrangea(ctx, x, y - 28, Math.min(30, sw * 0.04), { colour: col, seed: i + 1 });
      ctx.font = mono(9.5, 700); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.8)'; ctx.strokeText('pH ' + pH, x, y + 28); ctx.fillText('pH ' + pH, x, y + 28);
    });
    // your plant, in a big pot, with a soil pH probe in it
    const px = sw * 0.565, py = H - 40, w = Math.min(sw * 0.28, 190);
    A.pot(ctx, px, py - w * 0.85, w, { colour: '#9A6A44', soil: mix('#3A2A1E', p.pH < 5.5 ? '#2A1A10' : '#5A4A3A', 0.5) });
    A.hydrangea(ctx, px, py - w * 0.85 - w * 0.55, w * 0.42, { colour: flowerColour(p), seed: 9 });
    ctx.strokeStyle = '#B8C0C8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + w * 0.32, py - w * 0.85 + 4); ctx.lineTo(px + w * 0.42, py - w * 1.3); ctx.stroke();
    ctx.fillStyle = '#2A3240'; ctx.fillRect(px + w * 0.36, py - w * 1.48, w * 0.26, w * 0.18); ctx.fillStyle = '#7CF0A0'; ctx.font = mono(Math.max(9, w * 0.07), 700); ctx.textAlign = 'center'; ctx.fillText('pH ' + f1(p.pH), px + w * 0.49, py - w * 1.36);
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'Soil to sepal', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const al = sepalAl(p), rows = [['soil pH', f1(p.pH)], ['dissolved Al', f2(soilAl(p.pH, p.sulf)) + ' mg/kg'], ['aluminium sulphate', p.sulf + ' g/m²'], ['phosphate', p.phos.toFixed(1)], ['Al in the sepals', f1(al) + ' µg/g'], ['colour', p.cultivar === 'white' ? 'white (no pigment)' : blueness(al) > 0.66 ? 'blue' : blueness(al) < 0.33 ? 'pink' : 'mauve']];
      const h = 34 + rows.length * 19 + 10; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('From the soil to the sepals', sl.x + 10, sl.y + 8);
      rows.forEach((r, i) => { const yy = sl.y + 30 + i * 19; ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r[0], sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = i === rows.length - 1 ? flowerColour(p) : LIGHT; ctx.textAlign = 'right'; ctx.fillText(r[1], sl.x + sl.w - 10, yy); });
    }
  }
  const mix = (a, b, t) => window.RX ? window.RX.mix(a, b, t) : a;
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     6. PLOTS, READOUTS, EQUATION
     ============================================================ */
  function keyBand(g, items, note) { const K = kit(); return K ? K.plotKey(g, items, note) : { t: 14, draw() {} }; }
  const GK4 = ['wt', 'dwarf', 'sun', 'shade'];
  function normCurve(p, gk, factor) { const F = factor === 'ppfd' ? [50, 1000] : factor === 'water' ? [2, 80] : factor === 'N' ? [5, 400] : [6, 34], out = []; for (let k = 0; k <= 30; k++) { const v = F[0] + (F[1] - F[0]) * k / 30; out.push([v, growPlant(gk, Object.assign({}, STD, { [factor]: v }), 1)[DAYS].W]); } return out; }
  const NCACHE = {};
  const norms = (p, factor) => { const key = factor; if (!NCACHE[key]) NCACHE[key] = Object.fromEntries(Object.keys(GENO).map(gk => [gk, normCurve(p, gk, factor)])); return NCACHE[key]; };
  const plot1 = {
    title: S => ({ environment: 'Dry mass day by day: your chamber against the standard', test: 'Dry mass on day 28 in each chamber, every plant', genes: 'Dry mass on day 28, by kind of seed', compare: 'Reaction norms: mass against ' + FACTORS[S.p.factor].name + ', each kind of seed', separate: 'The 2 × 2: mass in dim and bright light', coat: 'Dark fur against skin temperature', hydrangea: 'How blue, against soil pH' })[S.p.setup],
    draw(S, g) {
      const p = S.p;
      if (p.setup === 'environment') {
        const Kk = keyBand(g, [{ c: '#FFC85A', label: 'your chamber' }, { c: '#8FA3C0', label: 'standard', dash: [4, 3] }]);
        const a = S.ch[0].run.plants[0].hist, b = S.ch[1].run.plants[0].hist, hi = Math.max(0.2, ...a.map(q => q.W), ...b.map(q => q.W)) * 1.1;
        const P = g.Plot({ xmin: 0, xmax: DAYS, ymin: 0, ymax: hi, xlabel: 'day', ylabel: 'dry mass (g)', yfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(b.map(q => [q.d, q.W]), '#8FA3C0', 1.8, [4, 3]); P.line(a.map(q => [q.d, q.W]), '#FFC85A', 2.6); P.vline(S.day, 'rgba(255,255,255,.4)', [2, 3]); });
        return;
      }
      if (p.setup === 'test' || p.setup === 'genes' || p.setup === 'separate') {
        const Kk = keyBand(g, [{ c: '#FFFFFF', dot: true, label: 'one plant' }, { c: '#FFD38A', box: true, label: 'mean' }, { c: '#E8E8E8', label: '± 2 standard errors' }]);
        const all = S.ch.flatMap(c => c.run.final), hi = Math.max(0.2, ...all) * 1.15, n = S.ch.length;
        const P = g.Plot({ xmin: 0, xmax: n, ymin: 0, ymax: hi, xlabel: p.setup === 'test' ? FACTORS[p.factor].name : p.setup === 'genes' ? 'kind of seed' : 'genotype, light', ylabel: 'dry mass (g)', xticks: S.ch.map((_, i) => i + 0.5), xfmt: v => { const c = S.ch[Math.floor(v)]; return c ? (p.setup === 'test' ? String.fromCharCode(65 + Math.floor(v)) : c.label.split(',')[0].split(' ')[0] + (p.setup === 'separate' ? (Math.floor(v) % 2 ? ' ☀' : ' ☁') : '')) : ''; }, yfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => S.ch.forEach((c, i) => {
          P.bar(i + 0.5, c.run.mean, 0.3, 0, g.alpha(c.gk ? GENO[c.gk].col : '#FFD38A', 0.5));
          c.run.final.forEach((v, j) => P.dot(i + 0.3 + j * 0.4 / Math.max(1, c.run.final.length - 1), v, 3, '#FFFFFF'));
          P.line([[i + 0.5, c.run.mean - 2 * c.run.se], [i + 0.5, c.run.mean + 2 * c.run.se]], '#E8E8E8', 2);
        }));
        return;
      }
      if (p.setup === 'compare') {
        const N = norms(p, p.factor);
        const Kk = keyBand(g, GK4.map(gk => ({ c: GENO[gk].col, label: GENO[gk].name.split(' (')[0] })));
        const hi = Math.max(...GK4.flatMap(gk => N[gk].map(q => q[1]))) * 1.08, F = FACTORS[p.factor];
        const P = g.Plot({ xmin: N.wt[0][0], xmax: N.wt[N.wt.length - 1][0], ymin: 0, ymax: hi, xlabel: F.name + ' (' + F.unit + ')', ylabel: 'dry mass (g)', yfmt: v => v.toFixed(1), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { GK4.forEach(gk => P.line(N[gk], GENO[gk].col, 2.2)); S.ch.forEach(c => c.multi.forEach(m => P.dot(c.env[p.factor], m.run.mean, 4, GENO[m.gk].col, '#FFFFFF'))); });
        return;
      }
      if (p.setup === 'coat') {
        const Kk = keyBand(g, [{ c: '#E8E8E8', label: 'cʰ tyrosinase: share of dark fur' }, { c: '#9CC8FF', dot: true, label: 'each body region' }]);
        const P = g.Plot({ xmin: 10, xmax: 40, ymin: 0, ymax: 1.05, xlabel: 'skin temperature (°C)', ylabel: 'dark fur', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const pts = []; for (let t = 10; t <= 40; t += 0.25) pts.push([t, darkness(p.rgeno, t)]);
        P.clip(() => { P.vline(33.5, 'rgba(255,211,138,.6)', [3, 3]); P.line(pts, '#E8E8E8', 2.4); Object.keys(REGIONS).forEach(r => { if (r === 'patch' && !p.shave) return; const t = skinT(r, p.Tair, r === 'patch' && p.ice); P.dot(t, darkness(p.rgeno, t), 4.5, t < 33.5 ? '#9CC8FF' : '#FFB27A', '#FFFFFF'); P.tag(t, darkness(p.rgeno, t), r, '#C9D4EA', 'left', -9); }); });
        return;
      }
      const Kk = keyBand(g, [{ c: '#7A9AE8', label: 'no phosphate' }, { c: '#E07AA8', label: 'with your phosphate', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'your soil' }]);
      const P = g.Plot({ xmin: 4, xmax: 8, ymin: 0, ymax: 1.05, xlabel: 'soil pH', ylabel: 'blueness', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
      const a = [], b = []; for (let pH = 4; pH <= 8; pH += 0.05) { a.push([pH, blueness(sepalAl({ pH, sulf: p.sulf, phos: 0 }))]); b.push([pH, blueness(sepalAl({ pH, sulf: p.sulf, phos: p.phos }))]); }
      P.clip(() => { P.line(a, '#7A9AE8', 2.4); P.line(b, '#E07AA8', 1.8, [4, 3]); P.dot(p.pH, p.cultivar === 'white' ? 0 : blueness(sepalAl(p)), 5.5, flowerColour(p), '#FFFFFF'); });
    },
    hover(S, x) {
      const p = S.p;
      if (p.setup === 'environment') { const d = clamp(Math.round(x), 0, DAYS), a = S.ch[0].run.plants[0].hist[d], b = S.ch[1].run.plants[0].hist[d]; return [{ label: 'day', value: String(d) }, { label: 'yours', value: f3(a.W) + ' g' }, { label: 'standard', value: f3(b.W) + ' g' }]; }
      if (p.setup === 'compare') { const N = norms(p, p.factor); return GK4.map(gk => { const q = N[gk].reduce((b, v) => Math.abs(v[0] - x) < Math.abs(b[0] - x) ? v : b, N[gk][0]); return { label: GENO[gk].name.split(' (')[0], value: f2(q[1]) + ' g', color: GENO[gk].col }; }); }
      if (p.setup === 'coat') return [{ label: 'skin', value: f1(x) + ' °C' }, { label: 'dark fur', value: Math.round(darkness(p.rgeno, x) * 100) + ' %' }];
      if (p.setup === 'hydrangea') return [{ label: 'pH', value: f2(x) }, { label: 'sepal Al', value: f1(sepalAl({ pH: x, sulf: p.sulf, phos: p.phos })) + ' µg/g' }];
      const c = S.ch[clamp(Math.floor(x), 0, S.ch.length - 1)]; return [{ label: c.label, value: f2(c.run.mean) + ' ± ' + f2(c.run.se) + ' g' }, { label: 'plants', value: String(c.run.final.length) }];
    }
  };
  const plot2 = {
    title: S => ({ environment: 'Growth against each factor, the rest at the standard', test: 'How sure? The standard error against the number of plants', genes: 'Height against mass, every plant', compare: 'Height against ' + FACTORS[S.p.factor].name + ': stretching in dim light', separate: 'Where the variation comes from', coat: 'Skin temperature of each region against the room', hydrangea: 'Dissolved aluminium against soil pH' })[S.p.setup],
    draw(S, g) {
      const p = S.p;
      if (p.setup === 'environment') {
        const cols = { ppfd: '#FFC85A', water: '#7FB7F2', N: '#8FD18B', T: '#FF8A5C' };
        const Kk = keyBand(g, Object.keys(FACTORS).map(k => ({ c: cols[k], label: FACTORS[k].name })).concat([{ c: '#FFFFFF', dot: true, label: 'your setting' }]));
        const P = g.Plot({ xmin: 0, xmax: 100, ymin: 0, ymax: 1.2, xlabel: '% of each factor’s range (light 50–1000, water 2–80, N 5–400, T 6–34)', ylabel: 'mass ÷ standard', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const std = growPlant(p.geno, STD, 1)[DAYS].W, rng_ = { ppfd: [50, 1000], water: [2, 80], N: [5, 400], T: [6, 34] };
        P.clip(() => Object.keys(FACTORS).forEach(k => { const pts = []; for (let i = 0; i <= 25; i++) { const v = rng_[k][0] + (rng_[k][1] - rng_[k][0]) * i / 25; pts.push([i * 4, growPlant(p.geno, Object.assign({}, STD, { [k]: v }), 1)[DAYS].W / std]); } P.line(pts, cols[k], 2); const cur = (p[k] - rng_[k][0]) / (rng_[k][1] - rng_[k][0]) * 100; P.dot(clamp(cur, 0, 100), growPlant(p.geno, Object.assign({}, STD, { [k]: p[k] }), 1)[DAYS].W / std, 4, cols[k], '#FFFFFF'); }));
        return;
      }
      if (p.setup === 'test') {
        const Kk = keyBand(g, [{ c: '#FFD38A', label: 'standard error σ/√n' }, { c: '#FFFFFF', dot: true, label: 'your plants per chamber' }, { c: '#4FD18B', label: 'half of the A–D difference', dash: [4, 3] }]);
        const sd = Math.max(1e-4, S.ch[0].run.sd || S.ch[0].run.mean * p.noise), pts = []; for (let n = 1; n <= 12; n++) pts.push([n, sd / Math.sqrt(n)]);
        const diff = Math.abs(S.ch[3].run.mean - S.ch[0].run.mean);
        const P = g.Plot({ xmin: 1, xmax: 12, ymin: 0, ymax: Math.max(sd, diff / 2) * 1.2, xlabel: 'plants in each chamber', ylabel: 'standard error (g)', yfmt: v => v.toFixed(3), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(pts, '#FFD38A', 2.4); P.hline(diff / 2, '#4FD18B', [4, 3]); P.dot(p.reps, sd / Math.sqrt(p.reps), 5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'genes') {
        const Kk = keyBand(g, S.ch.map(c => ({ c: GENO[c.gk].col, dot: true, label: GENO[c.gk].name.split(' (')[0] })));
        const pts = S.ch.flatMap(c => c.run.plants.map(pl => [pl.hist[DAYS].W, pl.hist[DAYS].h, GENO[c.gk].col]));
        const P = g.Plot({ xmin: 0, xmax: Math.max(...pts.map(q => q[0])) * 1.15, ymin: 0, ymax: 35, xlabel: 'dry mass (g)', ylabel: 'height (cm)', xfmt: v => v.toFixed(2), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => pts.forEach(q => P.dot(q[0], q[1], 4, q[2], '#FFFFFF')));
        return;
      }
      if (p.setup === 'compare') {
        const Kk = keyBand(g, GK4.map(gk => ({ c: GENO[gk].col, label: GENO[gk].name.split(' (')[0] })));
        const F = FACTORS[p.factor], range = p.factor === 'ppfd' ? [50, 1000] : p.factor === 'water' ? [2, 80] : p.factor === 'N' ? [5, 400] : [6, 34];
        const P = g.Plot({ xmin: range[0], xmax: range[1], ymin: 0, ymax: 35, xlabel: F.name + ' (' + F.unit + ')', ylabel: 'height (cm)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => GK4.forEach(gk => { const pts = []; for (let k = 0; k <= 25; k++) { const v = range[0] + (range[1] - range[0]) * k / 25; pts.push([v, growPlant(gk, Object.assign({}, STD, { [p.factor]: v }), 1)[DAYS].h]); } P.line(pts, GENO[gk].col, 2); }));
        return;
      }
      if (p.setup === 'separate') {
        const a = S.av, items = [['genes', a.G, '#FFC85A'], ['light', a.E, '#7FB7F2'], ['genes × light', a.GE, '#C78AE0'], ['plant to plant', a.R, '#8FA3C0']];
        const Kk = keyBand(g, items.map(q => ({ c: q[2], box: true, label: q[0] })));
        const P = g.Plot({ xmin: 0, xmax: 4, ymin: 0, ymax: 100, xlabel: 'source', ylabel: '% of variation', xticks: [0.5, 1.5, 2.5, 3.5], xfmt: v => items[Math.floor(v)][0], pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => items.forEach((q, i) => P.bar(i + 0.5, q[1] * 100, 0.35, 0, q[2])));
        return;
      }
      if (p.setup === 'coat') {
        const regs = ['back', 'nose', 'tail', 'feet', 'ears'], cols = { back: '#FFB27A', nose: '#E8E8E8', tail: '#C9D4EA', feet: '#8FD18B', ears: '#9CC8FF' };
        const Kk = keyBand(g, regs.map(r => ({ c: cols[r], label: r })).concat([{ c: '#FFD38A', label: '33.5 °C', dash: [3, 3] }]));
        const P = g.Plot({ xmin: -10, xmax: 35, ymin: 0, ymax: 40, xlabel: 'room temperature (°C)', ylabel: 'skin (°C)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.hline(33.5, '#FFD38A', [3, 3]); regs.forEach(r => P.line([[-10, skinT(r, -10, false)], [35, skinT(r, 35, false)]], cols[r], 2)); P.vline(p.Tair, 'rgba(255,255,255,.5)', [2, 3]); });
        return;
      }
      const Kk = keyBand(g, [{ c: '#9CC8FF', label: 'dissolved Al (log)' }, { c: '#FFFFFF', dot: true, label: 'your soil' }]);
      const P = g.Plot({ xmin: 4, xmax: 8, ymin: -2, ymax: 2, xlabel: 'soil pH', ylabel: 'Al, mg/kg', yticks: [-2, -1, 0, 1, 2], yfmt: v => String(Math.pow(10, v)), pad: { t: Kk.t } }).frame(); Kk.draw(P);
      const pts = []; for (let pH = 4; pH <= 8; pH += 0.05) pts.push([pH, Math.log10(Math.max(0.01, soilAl(pH, p.sulf)))]);
      P.clip(() => { P.line(pts, '#9CC8FF', 2.4); P.dot(p.pH, Math.log10(Math.max(0.01, soilAl(p.pH, p.sulf))), 5.5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
    },
    hover(S, x) { return [{ label: 'x', value: x.toFixed(2) }]; }
  };

  function readouts(S) {
    const p = S.p;
    if (p.setup === 'environment') { const a = S.ch[0].run, h = a.plants[0].hist[DAYS]; return [
      { label: 'Day', value: String(Math.floor(S.day)), unit: 'of 28' },
      { label: 'Dry mass, your chamber', value: f3(a.mean), unit: 'g', flag: 'accent' },
      { label: 'Dry mass, standard', value: f3(S.ch[1].run.mean), unit: 'g' },
      { label: 'Height', value: f1(a.hmean), unit: 'cm' },
      { label: 'Temperature factor f(T)', value: f2(h.ft), unit: '' },
      { label: 'Water factor 1 − e^(−w/w₀)', value: f2(h.fw), unit: '' },
      { label: 'Nitrogen factor N/(N + 40)', value: f2(h.fn), unit: '' },
      { label: 'Daily light', value: f1(p.ppfd * p.photo * 3600e-6), unit: 'mol/m²' },
      { label: 'Leaf area index', value: f2(h.lai), unit: '' }]; }
    if (p.setup === 'test') { const F = FACTORS[p.factor]; return S.ch.map((c, i) => ({ label: String.fromCharCode(65 + i) + ': ' + F.levels[i] + ' ' + F.unit + (p.confound && i === 3 ? ' (and changed)' : ''), value: f3(c.run.mean) + ' ± ' + f3(c.run.se), unit: 'g' })).concat([
      { label: 'D − A', value: f3(S.ch[3].run.mean - S.ch[0].run.mean), unit: 'g', flag: 'accent' },
      { label: 'Welch t', value: f2(S.tt.t), unit: '' },
      { label: 'p (chance alone)', value: S.tt.p < 0.001 ? '< 0.001' : f3(S.tt.p), unit: '', flag: S.tt.p < 0.05 ? 'ok' : 'warn' },
      { label: 'A fair test?', value: p.confound ? 'no — two things changed' : 'yes — one factor', unit: '', flag: p.confound ? 'crit' : 'ok' }]); }
    if (p.setup === 'genes') return S.ch.map(c => ({ label: GENO[c.gk].name, value: f3(c.run.mean), unit: 'g · ' + f1(c.run.hmean) + ' cm' })).concat([{ label: 'Best here', value: GENO[S.ch.reduce((b, c) => c.run.mean > b.run.mean ? c : b, S.ch[0]).gk].name, unit: '', flag: 'accent' }, { label: 'Light in every chamber', value: String(p.ppfd), unit: 'µmol/m²/s' }]);
    if (p.setup === 'compare') { const F = FACTORS[p.factor]; return [
      { label: 'Factor', value: F.name, unit: F.levels.join(' / ') + ' ' + F.unit },
      ...GK4.map(gk => ({ label: GENO[gk].name, value: S.ch.map(c => f2(c.multi.find(m => m.gk === gk).run.mean)).join(' · '), unit: 'g' })),
      { label: 'Best at the lowest level', value: GENO[bestAt(S, 0)].name, unit: '', flag: 'accent' },
      { label: 'Best at the highest level', value: GENO[bestAt(S, 3)].name, unit: '', flag: 'accent' }]; }
    if (p.setup === 'separate') { const a = S.av; return [
      ...S.ch.map(c => ({ label: c.label, value: f3(c.run.mean), unit: 'g' })),
      { label: 'Genes', value: Math.round(a.G * 100), unit: '% of variation' }, { label: 'Light', value: Math.round(a.E * 100), unit: '%' },
      { label: 'Genes × light', value: Math.round(a.GE * 100), unit: '%', flag: 'accent' }, { label: 'Plant to plant', value: Math.round(a.R * 100), unit: '%' }]; }
    if (p.setup === 'coat') { const c = coatOf(p, p.weeks); return [
      { label: 'Genotype', value: p.rgeno === 'chch' ? 'cʰcʰ (Himalayan)' : p.rgeno === 'CC' ? 'CC (full colour)' : 'cc (albino)', unit: '' },
      { label: 'Room', value: String(p.Tair), unit: '°C' },
      { label: 'Ear skin', value: f1(skinT('ears', p.Tair, false)), unit: '°C' },
      { label: 'Back skin', value: f1(skinT('back', p.Tair, false)), unit: '°C' },
      { label: 'Patch skin', value: p.shave ? f1(skinT('patch', p.Tair, p.ice)) : '—', unit: '°C' },
      { label: 'Dark fur on the patch', value: Math.round(c.patch * 100), unit: '%', flag: 'accent' },
      { label: 'Dark fur on the ears', value: Math.round(c.ears * 100), unit: '%' },
      { label: 'Weeks of regrowth', value: String(p.weeks), unit: '' }]; }
    const al = sepalAl(p);
    return [
      { label: 'Soil pH', value: f1(p.pH), unit: '' },
      { label: 'Dissolved aluminium', value: f2(soilAl(p.pH, p.sulf)), unit: 'mg/kg' },
      { label: 'Sepal aluminium', value: f1(al), unit: 'µg/g', flag: 'accent' },
      { label: 'Blueness', value: p.cultivar === 'white' ? '—' : Math.round(blueness(al) * 100), unit: '%' },
      { label: 'Colour', value: p.cultivar === 'white' ? 'white' : blueness(al) > 0.66 ? 'blue' : blueness(al) < 0.33 ? 'pink' : 'mauve', unit: '' },
      { label: 'Cultivar', value: p.cultivar === 'white' ? 'white mophead (no delphinidin)' : 'blue/pink mophead', unit: '' }];
  }
  const { E } = L;
  function equation(S) {
    const p = S.p;
    if (growSetup(p) && p.setup !== 'separate') { const c0 = S.ch[0], h = (c0.run ? c0.run.plants[0] : c0.multi[0].run.plants[0]).hist[DAYS]; return E.v('dW') + '/' + E.v('dt') + ' = RUE · PAR · (1 − e' + E.sup('−0.65 LAI') + ') · ' + E.v('f') + '(' + E.v('T') + ') · ' + E.v('f') + '(water) · ' + E.v('f') + '(N) − maintenance &nbsp; = … × ' + f2(h.ft) + ' × ' + f2(h.fw) + ' × ' + f2(h.fn); }
    if (p.setup === 'separate') { const a = S.av; return 'SS' + E.sub('total') + ' = SS' + E.sub('genes') + ' + SS' + E.sub('light') + ' + SS' + E.sub('G×E') + ' + SS' + E.sub('within') + ' → ' + Math.round(a.G * 100) + ' + ' + Math.round(a.E * 100) + ' + <b>' + Math.round(a.GE * 100) + '</b> + ' + Math.round(a.R * 100) + ' %'; }
    if (p.setup === 'coat') { const t = skinT('patch', p.Tair, p.ice && p.shave); return E.v('T') + E.sub('skin') + ' = ' + E.v('T') + E.sub('air') + ' + (39 − ' + E.v('T') + E.sub('air') + ')·' + E.v('k') + ' &nbsp; dark = ' + E.frac('1', '1 + e' + E.sup('(T − 33.5)/0.6')) + ' → patch at ' + f1(t) + ' °C: <b>' + Math.round(darkness(p.rgeno, t) * 100) + ' % dark</b>'; }
    return 'sepal Al = ' + E.frac('180 · Al', 'Al + 12') + ' · ' + E.frac('1', '1 + 2P') + ' = ' + E.n(f1(sepalAl(p)) + ' µg/g') + ' &nbsp; → <b>' + (p.cultivar === 'white' ? 'white' : blueness(sepalAl(p)) > 0.66 ? 'blue' : blueness(sepalAl(p)) < 0.33 ? 'pink' : 'mauve') + '</b>';
  }
  const EQ_NOTE = S => ({
    environment: '<b>A plant is built from light, air and water — the soil gives only a little nitrogen and minerals.</b> Each factor multiplies the others: one in short supply caps growth however generous the rest (Liebig’s law of the minimum, in multiplied form).',
    test: '<b>A fair test changes one thing.</b> If chamber D is brighter and also warmer, nobody can say which made the difference. And with a few plants, chance alone can make two chambers differ: more plants shrink the standard error as 1/√n.',
    genes: '<b>Same light, same water, same food — and still different plants.</b> In one environment the differences between kinds of seed are genetic. Each genotype here differs in one or two numbers: how far its photosynthesis saturates, how much it spends on upkeep, how tall it grows.',
    compare: '<b>No genotype is best everywhere.</b> The sun type wins in bright light and loses in dim; the shade type the reverse. The lines cross: that crossing is a genotype–environment interaction, and it is why “Which seed is better?” has no answer without “Where?”.',
    separate: '<b>Genes and environment do not simply add.</b> A two-way design measures how much of the variation comes from each, and how much from their interaction — the part that belongs to neither alone.',
    coat: '<b>The gene sets a rule; the environment applies it.</b> The Himalayan allele makes an enzyme that works only when cool, so the coat pattern is a map of skin temperature. The rabbit inherited the rule, not the pattern.',
    hydrangea: '<b>One genome, two colours.</b> The pigment (delphinidin) is genetic; aluminium from acid soil turns it blue. A white cultivar lacks the pigment and stays white in any soil — the environment can only change what the genes allow.'
  })[S.p.setup];

  /* ============================================================
     7. REGISTRATION
     ============================================================ */
  const R_ = true;
  const gOpts = Object.keys(GENO).map(k => ({ value: k, label: GENO[k].name }));
  L.register({
    id: 'g6e-nurture',
    grade: 6, unit: '6E', topics: ['E4'],
    subject: 'biology',
    name: 'Nature and Nurture Growth Chambers',
    chapter: 'Regional Climate, Organisms and Heredity',
    exams: ['NGSS MS-LS1-5', 'NGSS Science and Engineering Practice 3: planning and carrying out investigations', 'CAST'],
    weight: 'Growth',
    is3D: true,
    autoplay: true,
    bloom: 0.05,
    stageHint: 'Drag to walk along the chambers · every plant is grown day by day from its genes and its chamber',
    lede: 'Rows of <b>growth chambers</b>, each holding Wisconsin Fast Plants grown day by day from light, water, nitrogen and temperature. Find what a plant needs; run a <b>fair test</b> with replicates and a t-test; grow five <b>genotypes</b> in one chamber and every genotype in every chamber, and watch their <b>reaction norms</b> cross; split the variation in a 2 × 2 design. ' +
      'Then two classic cases: the <b>Himalayan rabbit</b>, whose fur turns black wherever its skin is cooled, and the <b>hydrangea</b> that is blue in acid soil and pink in chalk.',

    params: preset({}),
    presets: [
      { name: 'Dim light', params: preset({ ppfd: 120 }) },
      { name: 'Thirsty plants', params: preset({ water: 8 }) },
      { name: 'Too cold', params: preset({ T: 10 }) },
      { name: 'Starved of nitrogen', params: preset({ N: 15 }) },
      { name: 'A fair test of light', params: preset({ setup: 'test', factor: 'ppfd', reps: 6 }) },
      { name: 'One plant a chamber: is it chance?', params: preset({ setup: 'test', factor: 'water', reps: 2, noise: 0.25 }) },
      { name: 'Not a fair test', params: preset({ setup: 'test', factor: 'ppfd', confound: true }) },
      { name: 'Four seeds, one chamber', params: preset({ setup: 'genes' }) },
      { name: 'Four seeds in dim light', params: preset({ setup: 'genes', ppfd: 120 }) },
      { name: 'Reaction norms across light', params: preset({ setup: 'compare', factor: 'ppfd' }) },
      { name: 'Reaction norms across temperature', params: preset({ setup: 'compare', factor: 'T' }) },
      { name: 'Sun and shade, dim and bright', params: preset({ setup: 'separate', gpair: 'sunshade' }) },
      { name: 'Standard and dwarf, dim and bright', params: preset({ setup: 'separate', gpair: 'dwarf' }) },
      { name: 'A Himalayan rabbit with an ice pack', params: preset({ setup: 'coat' }) },
      { name: 'Raised in a cold hutch', params: preset({ setup: 'coat', Tair: 2, shave: false, ice: false }) },
      { name: 'Raised in a warm room', params: preset({ setup: 'coat', Tair: 30, shave: false, ice: false }) },
      { name: 'An albino with an ice pack', params: preset({ setup: 'coat', rgeno: 'cc' }) },
      { name: 'Acid soil: blue', params: preset({ setup: 'hydrangea', pH: 5.0 }) },
      { name: 'Chalky soil: pink', params: preset({ setup: 'hydrangea', pH: 7.2 }) },
      { name: 'Neutral soil plus aluminium sulphate', params: preset({ setup: 'hydrangea', pH: 6.2, sulf: 40 }) },
      { name: 'A white cultivar in acid soil', params: preset({ setup: 'hydrangea', pH: 5.0, cultivar: 'white' }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The seeds', when: is('environment'), items: [
        { key: 'geno', type: 'select', label: 'Seed', restructure: R_, options: gOpts } ] },
      { group: 'The chamber', when: is('environment', 'genes'), items: [
        { key: 'ppfd', label: 'Light', min: 30, max: 1000, step: 10, unit: 'µmol/m²/s', restructure: R_ },
        { key: 'photo', label: 'Day length', min: 8, max: 24, step: 1, unit: 'h', restructure: R_, when: is('environment') },
        { key: 'water', label: 'Water', min: 2, max: 80, step: 1, unit: 'mL a day', restructure: R_ },
        { key: 'N', label: 'Nitrogen', min: 5, max: 400, step: 5, unit: 'mg/L', restructure: R_ },
        { key: 'T', label: 'Temperature', min: 6, max: 34, step: 1, unit: '°C', restructure: R_ } ] },
      { group: 'The test', when: is('test', 'compare'), items: [
        { key: 'factor', type: 'select', label: 'Vary', restructure: R_, options: Object.keys(FACTORS).map(k => ({ value: k, label: FACTORS[k].name })) },
        { key: 'confound', type: 'toggle', label: 'Also change something else in D', restructure: R_, when: is('test') } ] },
      { group: 'The design', when: is('separate'), items: [
        { key: 'gpair', type: 'select', label: 'Genotypes', restructure: R_, options: [{ value: 'sunshade', label: 'sun type and shade type' }, { value: 'dwarf', label: 'standard and dwarf' }] },
        { key: 'dim', label: 'Dim chambers', min: 50, max: 400, step: 10, unit: 'µmol/m²/s', restructure: R_ },
        { key: 'bright', label: 'Bright chambers', min: 400, max: 1000, step: 10, unit: 'µmol/m²/s', restructure: R_ } ] },
      { group: 'The plants', when: is('test', 'genes', 'separate', 'compare'), items: [
        { key: 'reps', label: 'Plants in each chamber', min: 1, max: 6, step: 1, unit: '', restructure: R_, when: is('test', 'genes', 'separate') },
        { key: 'noise', label: 'Plant-to-plant variation', min: 0, max: 0.4, step: 0.01, unit: '', restructure: R_, fmt: v => '±' + Math.round(v * 100) + ' %' },
        { key: 'seed', label: 'Another batch of seed', min: 1, max: 9, step: 1, restructure: R_ } ] },
      { group: 'Time', when: S => growSetup(S.p), items: [
        { key: 'pace', type: 'select', label: 'Days pass', restructure: false, options: [{ value: 1, label: 'a day a second' }, { value: 4, label: '4 a second' }, { value: 10, label: '10 a second' }] } ] },
      { group: 'The rabbit', when: is('coat'), items: [
        { key: 'rgeno', type: 'select', label: 'Genotype', restructure: R_, options: [{ value: 'chch', label: 'cʰcʰ Himalayan' }, { value: 'CC', label: 'CC full colour' }, { value: 'cc', label: 'cc albino' }] },
        { key: 'Tair', label: 'Room temperature', min: -5, max: 35, step: 1, unit: '°C', restructure: R_ },
        { key: 'shave', type: 'toggle', label: 'Shave a patch on the back', restructure: R_ },
        { key: 'ice', type: 'toggle', label: 'Ice pack on the patch', restructure: R_, when: S => S.p.shave },
        { key: 'weeks', label: 'Weeks of regrowth', min: 0, max: 6, step: 1, unit: '', restructure: R_ } ] },
      { group: 'The hydrangea', when: is('hydrangea'), items: [
        { key: 'cultivar', type: 'select', label: 'Cultivar', restructure: R_, options: [{ value: 'mop', label: 'blue/pink mophead' }, { value: 'white', label: 'white mophead' }] },
        { key: 'pH', label: 'Soil pH', min: 4, max: 8, step: 0.05, unit: '', restructure: R_, fmt: v => v.toFixed(2) },
        { key: 'sulf', label: 'Aluminium sulphate', min: 0, max: 60, step: 1, unit: 'g/m²', restructure: R_ },
        { key: 'phos', label: 'Phosphate fertiliser', min: 0, max: 2, step: 0.1, unit: '', restructure: R_ } ] }
    ],

    setup, step, drawStage, onPointer,
    plots: [plot1, plot2],
    readouts,
    equation,
    eqNote: EQ_NOTE,
    problems: [
      { source: 'CAST pattern · light as a resource', params: preset({}),
        q: 'The chamber’s LEDs give 400 µmol of light per square metre per second for 16 hours a day. How many moles of light reach a square metre each day?',
        predict: { label: 'Daily light', unit: 'mol/m²', tol: 0.01 },
        measure: S => S.p.ppfd * S.p.photo * 3600e-6,
        working: '400 × 10⁻⁶ mol/s × 16 h × 3,600 s/h = <b>23.0 mol/m²</b> a day — about half a sunny June day outdoors. Halve the light or the hours and the plants have half the energy to build with.' },
      { source: 'CAST pattern · a limiting factor', params: preset({ N: 200 }),
        q: 'Growth scales with the nitrogen factor N ÷ (N + 40). The nutrient solution holds 200 mg/L. What is the factor — and what if you doubled the nitrogen?',
        predict: { label: 'Nitrogen factor', unit: '', tol: 0.01 },
        measure: S => fN(S.p.N),
        working: 'At 400 mg/L: 400 ÷ 440 = 0.91 — doubling the nitrogen buys only 9 % more. At 200 mg/L: 200 ÷ 240 = <b>0.83</b>. Near saturation, more of a factor helps little; growth is limited by something else.' },
      { source: 'CAST pattern · how sure is a mean?', params: preset({ setup: 'test', factor: 'ppfd', reps: 6 }),
        q: 'Chamber C’s six plants weigh 1.84, 2.09, 1.53, 2.68, 2.37 and 1.77 g: a standard deviation of 0.42 g. What is the standard error of their mean, s ÷ √n?',
        predict: { label: 'Standard error', unit: 'g', tol: 0.04 },
        measure: S => S.ch[2].run.se,
        working: '0.42 ÷ √6 = 0.42 ÷ 2.45 = <b>0.17 g</b>. The chambers’ means (0.06, 0.91, 2.05 and 3.33 g) are many standard errors apart: the light, not chance, made the difference.' },
      { source: 'CAST pattern · a gene and its environment', params: preset({ setup: 'coat' }),
        q: 'A rabbit’s ear skin sits at T_air + (39 − T_air) × 0.38. In a 20 °C room, how warm is it — and will the Himalayan tyrosinase (active below 33.5 °C) work there?',
        predict: { label: 'Ear skin', unit: '°C', tol: 0.01 },
        measure: S => skinT('ears', S.p.Tair, false),
        working: '20 + 19 × 0.38 = <b>27.2 °C</b> — well below 33.5 °C, so the enzyme makes pigment and the ears grow black fur. The back is 36.3 °C: white. Shave it and cool it with an ice pack and black fur grows there too.' },
      { source: 'CAST pattern · soil chemistry and phenotype', params: preset({ setup: 'hydrangea', pH: 5.0 }),
        q: 'Dissolved aluminium in this soil is 0.3 mg/kg at pH 6.5 and rises tenfold for each pH unit more acid. How much is there at pH 5.0?',
        predict: { label: 'Dissolved Al', unit: 'mg/kg', tol: 0.02 },
        measure: S => soilAl(S.p.pH, S.p.sulf),
        working: '1.5 units more acid: 0.3 × 10¹·⁵ = 0.3 × 31.6 = <b>9.5 mg/kg</b>. The sepals take up about 80 µg/g, twice the ~40 µg/g that turns the pigment blue. The same plant at pH 7 has 0.09 mg/kg and flowers pink.' }
    ],

    walkthrough: [
      { title: '1 · What does a plant need?', ask: 'Turn the light down to 120. Which do you expect: a smaller plant, or a taller one?', reveal: 'Both: much less mass (a tenth or less) — but taller and spindlier for its mass, stretching toward light it cannot find. <b>An environmental factor can change the whole form, not just the size.</b>', params: preset({ ppfd: 120 }) },
      { title: '2 · One factor at a time', ask: 'In chamber D the light is brightest — and, in this test, it is also warmer. Can you say light made D grow most?', reveal: 'No. Two things changed, so the test cannot separate them. Switch the extra change off: a <b>fair test</b> changes one factor and holds the rest, and repeats each condition on several plants.', params: preset({ setup: 'test', factor: 'ppfd', confound: true }) },
      { title: '3 · Is it chance?', ask: 'With two plants a chamber and a lot of plant-to-plant variation, the water test shows a difference. Is it real?', reveal: 'Read p. With few plants the standard error is large, and chance alone can make chambers differ. Add plants: the error falls as 1/√n and real effects stand out.', params: preset({ setup: 'test', factor: 'water', reps: 2, noise: 0.25 }) },
      { title: '4 · Same chamber, different seeds', ask: 'Four kinds of seed in identical chambers. Why do they differ?', reveal: 'Their genes. The dwarf is short whatever you do; the sun and shade types use light differently. In one environment, differences are genetic.', params: preset({ setup: 'genes' }) },
      { title: '5 · Which seed is best?', ask: 'Grow every seed at four light levels. Is the sun type always the biggest?', reveal: 'Only in bright light. In dim light the shade type wins. The reaction norms cross: <b>the best genotype depends on the environment</b>.', params: preset({ setup: 'compare', factor: 'ppfd' }) },
      { title: '6 · How much is genes, how much is environment?', ask: 'In the 2 × 2, can you split the variation into a “genes” part and an “environment” part that add up?', reveal: 'Not entirely: a large share is genes × light — the sun type gains far more from bright light than the shade type does. Where genes and environment interact, “how much of it is genetic?” has no single answer.', params: preset({ setup: 'separate' }) },
      { title: '7 · A rabbit with an ice pack', ask: 'Shave a white patch on a Himalayan rabbit’s back and keep it cold. What colour grows back?', reveal: 'Black. Its tyrosinase works only below about 33.5 °C; the back is usually 36 °C, so white. Cool it and the same gene makes pigment. <b>Same genes, different environment, different phenotype.</b>', params: preset({ setup: 'coat' }) }
    ],

    quiz: [
      { q: 'A student grows beans in sunlight and in a cupboard, and waters the cupboard ones less. The cupboard beans are smaller. What can she conclude?', options: ['Nothing certain: two factors changed', 'Light makes beans grow', 'Water makes beans grow', 'Cupboards stop growth'], answer: 0, why: 'A fair test changes one factor. Here light and water both changed.' },
      { q: 'Identical seeds grown in different soils differ in size. The differences are caused by', options: ['the environment', 'their genes', 'chance only', 'the seeds’ age'], answer: 0, why: 'Same genes, so the differences come from the environment (and some plant-to-plant chance).' },
      { q: 'Reaction norms that cross mean that', options: ['which genotype grows best depends on the conditions', 'one genotype is best everywhere', 'genes have no effect', 'the environment has no effect'], answer: 0, why: 'Crossing lines are a genotype × environment interaction.' },
      { q: 'A Himalayan rabbit’s ears are black and its back white because', options: ['its pigment enzyme works only where the skin is cool', 'its ears have different genes', 'the sun bleaches its back', 'it was born that way regardless of temperature'], answer: 0, why: 'Every cell has the same genes; the enzyme is temperature-sensitive, and the ears are colder.' },
      { q: 'A white-flowered hydrangea planted in acid soil will flower', options: ['white', 'blue', 'pink', 'mauve'], answer: 0, why: 'It lacks the pigment; soil aluminium can only change the colour of a pigment that is there.' }
    ],

    notes: '<p><b>Environmental factors.</b> Plants need light, water, carbon dioxide, mineral nutrients (nitrogen above all) and a suitable temperature. Any one in short supply limits growth however much there is of the others. Animals’ growth depends likewise on food, temperature and space.</p>' +
      '<p><b>Testing a factor.</b> Change one factor, hold the rest, and repeat each condition on several individuals; then ask whether the difference is larger than the scatter between individuals (the standard error, s/√n).</p>' +
      '<p><b>Genes.</b> In one environment, genetic differences show: dwarf and tall, sun and shade types, purple and green stems. Across environments, genotypes respond differently — their reaction norms can cross.</p>' +
      '<p><b>Nature and nurture together.</b> Most traits come from both. The Himalayan rabbit’s coat pattern is a gene acting on temperature; a hydrangea’s colour is a gene acting on soil aluminium. A 2 × 2 experiment measures genes, environment and their interaction.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “A trait is either genetic or environmental.” Nearly every trait is both: the genes set what is possible and how the organism responds; the environment decides which of those possibilities appears.</div>'
  });

  L.models = L.models || {};
  L.models['g6e-nurture'] = { GENO, fTemp, fWater, fN, growPlant, chamberRun, welch, anova2, REGIONS, skinT, darkness, coatOf, soilAl, sepalAl, blueness, flowerColour, DAYS };
})(window.InsightLab);
