/* ============================================================
   GRADE 6 · UNIT E · REGIONAL CLIMATE, ORGANISMS AND HEREDITY
   6E-3  Making the Next Generation
   (E3.1 Courtship behavior; E3.2 Nesting and parental care; E3.3 Flower
    structures and pollen; E3.4 Pollination; E3.5 Seeds and dispersal)

   Five field and bench experiments, each run, not told:
     courtship — Andersson's (1982) long-tailed widowbirds in Kenya: four
                 groups of nine males, tails cut, cut and glued back, left,
                 or lengthened; females choose among the males they visit
                 (choice ∝ e^{βL}), a kite takes males at a rate that grows
                 with tail length and display; nests counted day by day.
     care      — great tit broods in a nest box: each chick grows (logistic,
                 18 days to ~20 g) on the caterpillars its parents can bring,
                 shared by begging; heavier fledglings survive their first
                 winter (Perrins 1965) — Lack's (1947) most productive clutch.
     flower    — a lily and a grass floret, dissected in 3D; pollen grains
                 under the microscope; Stokes' law for how fast each falls,
                 and how far the wind carries it.
     pollinate — honeybees working a meadow of buttercups and cranesbills:
                 each bee an agent with its own flight, handling time,
                 flower constancy and pollen carryover; ovules fertilised
                 only by pollen from another plant of the same species.
     seeds     — sycamore samaras and dandelion achenes in a turbulent wind
                 (terminal speed from mass and area, a logarithmic wind
                 profile, random gusts), acorns cached by jays, cherries
                 carried in a thrush's gut.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6L, G6E, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, LF = () => window.G6L, ART = () => window.G6E;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003 + 0.5) / 1000003.5; }; }
  const G = 9.81, RHO_AIR = 1.2, MU_AIR = 1.81e-5;

  /* ============================================================
     1. COURTSHIP — the widowbird experiment
     Four groups of nine males (Andersson 1982: tails shortened to 14 cm,
     cut and glued back, left alone, lengthened by 25 cm to ~75 cm). Each day
     F/45 females arrive; each visits k living males at random and builds in
     the territory of one, chosen with weight e^{β·L/50·(display/10)^0.3},
     β = 2. Each day a male is taken by a kite with chance
     h = 0.004 · risk · (display/10) · (L/50)^1.5. The four groups' nests per
     male reproduce the paper's order and spread: shortened ≈ ⅓, controls ≈ 1,
     lengthened ≈ 1.7.
     ============================================================ */
  const WB = { per: 9, days: 45, beta: 2.0, h0: 0.004 };
  const GROUPS = [{ g: 'short', name: 'shortened' }, { g: 'ctrl1', name: 'cut and glued back' }, { g: 'ctrl2', name: 'untouched' }, { g: 'long', name: 'lengthened' }];
  const tailOf = (p, g) => g === 'short' ? p.shortTo : g === 'long' ? 50 + p.add : 50;
  function attract(p, L) { return Math.exp(WB.beta * L / 50 * Math.pow(p.display / 10, 0.3)); }
  function hazard(p, L) { return WB.h0 * p.risk * (p.display / 10) * Math.pow(L / 50, 3); }
  function courtSeason(p, seed) {
    const r = rng(seed * 7919 + 17), males = [];
    GROUPS.forEach(({ g }) => { for (let k = 0; k < WB.per; k++) males.push({ g, L: tailOf(p, g) + (g === 'ctrl2' ? (r() - 0.5) * 8 : (r() - 0.5) * 3), alive: true, died: -1, nests: [] }); });
    const daily = [];
    for (let d = 0; d < WB.days; d++) {
      males.forEach(m => { if (m.alive && r() < hazard(p, m.L)) { m.alive = false; m.died = d; } });
      const arr = p.females / WB.days, n = Math.floor(arr) + (r() < arr % 1 ? 1 : 0);
      for (let f = 0; f < n; f++) {
        const alive = males.filter(m => m.alive); if (!alive.length) break;
        const set = []; for (let k = 0; k < Math.round(p.choosy); k++) set.push(alive[Math.floor(r() * alive.length)]);
        const w = set.map(m => attract(p, m.L)), ws = w.reduce((a, b) => a + b, 0); let u = r() * ws;
        for (let i = 0; i < set.length; i++) { u -= w[i]; if (u <= 0) { set[i].nests.push(d); break; } }
      }
      daily.push(GROUPS.map(({ g }) => { const ms = males.filter(m => m.g === g); return [ms.reduce((s, m) => s + m.nests.length, 0) / ms.length, ms.filter(m => m.alive).length]; }));
    }
    return { males, daily };
  }
  const CCACHE = {};
  function courtExpected(p, n) {
    const key = [p.shortTo, p.add, p.risk, p.display, p.choosy, p.females, n].join('|');
    if (CCACHE[key]) return CCACHE[key];
    const acc = GROUPS.map(() => ({ nests: 0, alive: 0 }));
    for (let s = 1; s <= n; s++) { const R = courtSeason(p, 1000 + s), last = R.daily[R.daily.length - 1]; last.forEach((v, i) => { acc[i].nests += v[0] / n; acc[i].alive += v[1] / WB.per / n; }); }
    const ks = Object.keys(CCACHE); if (ks.length > 40) delete CCACHE[ks[0]];
    return (CCACHE[key] = acc);
  }
  /* one male of tail L among ordinary males: nests this season plus, if he lives, next season's — computed, not simulated */
  function tailFitness(p, L) {
    const N = 4 * WB.per, k = Math.round(p.choosy), pin = 1 - Math.pow(1 - 1 / N, k), w = attract(p, L), wb = attract(p, 50), h = hazard(p, L);
    let nests = 0, S = 1; for (let d = 0; d < WB.days; d++) { S *= 1 - h; nests += p.females / WB.days * pin * w / (w + (k - 1) * wb) * S; }
    const overWinter = 0.55;
    return { nests, survive: S, total: nests * (1 + S * overWinter) };
  }

  /* ============================================================
     2. CARE — a great tit brood, chick by chick
     Caterpillars the pair can bring in a day: D = 430 f/(f + 0.5), f the
     caterpillar supply (1 = an ordinary Wytham Wood spring); a lone parent
     brings 60 % of a pair's. A chick needs 60 caterpillars a day when grown,
     less while small; the day's catch is shared by begging (∝ mass), no chick
     taking more than it needs. Growth: dm/dt = 0.42 m (1 − m/20.5) q, q the
     share of its need it got; starved for four days, it dies. Chance of
     surviving the first year: 0.32/(1 + e^{−(m − 17.8)/0.8}) — heavier
     fledglings survive, as Perrins (1965) found. Lack's clutch: the number of
     eggs that raises the most young that live.
     ============================================================ */
  const TIT = { need: 60, mmax: 20.5, m0: 1.4, r: 0.42, days: 18 };
  const delivery = (f, parents) => 430 * f / (f + 0.5) * (parents === 2 ? 1 : 0.6);
  const recruitP = m => 0.32 / (1 + Math.exp(-(m - 17.8) / 0.8));
  function brood(n, f, parents) {
    const ch = []; for (let i = 0; i < n; i++) ch.push({ m: TIT.m0 * (1 - 0.03 * i), alive: true, hunger: 0, hist: [TIT.m0 * (1 - 0.03 * i)], q: [] });
    const D = delivery(f, parents), need = c => TIT.need * Math.min(1, 0.15 + c.m / TIT.mmax);
    for (let day = 0; day < TIT.days; day++) {
      const alive = ch.filter(c => c.alive), got = new Map(); let left = D, open = alive.slice();
      for (let it = 0; it < 6 && open.length && left > 1e-9; it++) {
        const ws = open.reduce((s, c) => s + c.m, 0), nxt = []; let used = 0;
        open.forEach(c => { const want = need(c) - (got.get(c) || 0), give = Math.min(want, left * c.m / ws); got.set(c, (got.get(c) || 0) + give); used += give; if (give < want - 1e-9) nxt.push(c); });
        left -= used; open = nxt;
      }
      ch.forEach(c => {
        if (!c.alive) { c.hist.push(null); c.q.push(0); return; }
        const q = (got.get(c) || 0) / need(c);
        c.m += TIT.r * c.m * (1 - c.m / TIT.mmax) * q - (q < 0.5 ? (0.5 - q) * 0.12 * c.m : 0);
        c.hunger = q < 0.3 ? c.hunger + 1 : Math.max(0, c.hunger - 1);
        if (c.hunger >= 4 || c.m < 0.6) c.alive = false;
        c.hist.push(c.alive ? c.m : null); c.q.push(q);
      });
    }
    const fl = ch.filter(c => c.alive);
    return { chicks: ch, D, fledged: fl.length, mean: fl.length ? fl.reduce((s, c) => s + c.m, 0) / fl.length : 0, recruits: fl.reduce((s, c) => s + recruitP(c.m), 0) };
  }
  function lackCurve(f, parents) { const out = []; for (let n = 1; n <= 16; n++) out.push([n, brood(n, f, parents).recruits]); return out; }
  const bestClutch = (f, parents) => lackCurve(f, parents).reduce((b, q) => q[1] > b[1] ? q : b, [0, -1])[0];

  /* ============================================================
     3. POLLEN — Stokes' law. A grain falling through still air reaches
     v = (ρ_p − ρ_air) g d² / (18 μ) within a millisecond (Re ≪ 1); released
     at height H in a wind U it lands about H·U/v downwind.
     ============================================================ */
  const POLLEN = {
    lily: { name: 'lily (insects)', d: 70, rho: 1100, carrier: 'insects', note: 'big, oily and sticky' },
    sun: { name: 'sunflower (insects)', d: 30, rho: 1300, carrier: 'insects', note: 'spiny, clumps on hairs' },
    grass: { name: 'grass (wind)', d: 35, rho: 1000, carrier: 'wind', note: 'smooth, dry, one pore' },
    pine: { name: 'pine (wind)', d: 60, rho: 450, carrier: 'wind', note: 'two air sacs' },
    rag: { name: 'ragweed (wind)', d: 20, rho: 1300, carrier: 'wind', note: 'small: the hay-fever grain' }
  };
  const settle = k => (POLLEN[k].rho - RHO_AIR) * G * Math.pow(POLLEN[k].d * 1e-6, 2) / (18 * MU_AIR);
  const reynolds = k => RHO_AIR * settle(k) * POLLEN[k].d * 1e-6 / MU_AIR;
  const carried = (k, H, U) => H * U / settle(k);
  const PARTS = {
    lily: [['tepals', 6, 'three petals and three sepals, alike'], ['stamens', 6, 'filament and anther'], ['carpels', 3, 'fused into one pistil'], ['ovules', 180, 'in three chambers']],
    grass: [['petals', 0, 'none: no insect to attract'], ['stamens', 3, 'anthers hang outside'], ['stigmas', 2, 'feathery, to comb the air'], ['ovules', 1, 'one seed, the grain']]
  };

  /* ============================================================
     4. POLLINATION — agents in a meadow
     Flowers on a 12 × 9 m patch, two species (buttercup A, cranesbill B).
     A honeybee flies at 3 m/s and spends 4 s on a flower (about 10 flowers
     a minute). It next goes to a flower within 3 m it has not just visited,
     the nearer the likelier, of the same species with chance `constancy`.
     On each flower it leaves a fraction d of every packet of pollen it
     carries (carryover: a grain from one flower reaches the next few) and
     picks up 200 grains × what the anthers still hold. Each flower has 12
     ovules, self-incompatible: only pollen from another plant of its own
     species fertilises, ovules = 12(1 − e^{−g/12}) for g such grains.
     With the wind instead, each flower catches pollen in proportion to how
     many flowers of its species stand within 4 m.
     ============================================================ */
  const MW = { W: 12, H: 9, speed: 3, handle: 4, ovules: 30, pick: 25, eff: 0.15 };
  function meadowStart(p) {
    const r = rng(31 + p.seed * 101), fl = [], n = Math.round(p.nFlowers);
    for (let i = 0; i < n; i++) fl.push({ x: 0.4 + r() * (MW.W - 0.8), y: 0.4 + r() * (MW.H - 0.8), sp: r() < p.fracB ? 'B' : 'A', anther: 1, out: 0, het: 0, self: 0, visits: 0, rot: r() * TAU });
    const bees = [];
    const nb = Math.round(p.bees * (p.pesticide ? 0.5 : 1));
    for (let b = 0; b < nb; b++) { const f = Math.floor(r() * n); bees.push({ x: fl[f].x, y: fl[f].y, at: f, tgt: f, hold: r() * MW.handle, load: [], recent: [f], ang: 0 }); }
    return { fl, bees, r, t: 0, visits: 0, deposited: 0, wasted: 0 };
  }
  function pickNext(M, b, p) {
    const fl = M.fl, cur = fl[b.at], r = M.r, cand = [];
    const want = r() < p.constancy ? cur.sp : null;
    for (let i = 0; i < fl.length; i++) {
      if (b.recent.indexOf(i) >= 0) continue;
      const d = Math.hypot(fl[i].x - cur.x, fl[i].y - cur.y); if (d > 3) continue;
      if (want && fl[i].sp !== want) continue;
      cand.push([i, Math.exp(-d / 1.2)]);
    }
    if (!cand.length) { for (let i = 0; i < fl.length; i++) if (b.recent.indexOf(i) < 0 && (!want || fl[i].sp === want)) cand.push([i, Math.exp(-Math.hypot(fl[i].x - cur.x, fl[i].y - cur.y) / 2)]); }
    if (!cand.length) return Math.floor(r() * fl.length);
    let u = r() * cand.reduce((s, c) => s + c[1], 0);
    for (const c of cand) { u -= c[1]; if (u <= 0) return c[0]; }
    return cand[cand.length - 1][0];
  }
  function visit(M, b, p) {
    const f = M.fl[b.at];
    f.visits++; M.visits++;
    // leave a fraction of every packet on the stigma
    b.load.forEach(pk => {
      const g = pk.n * p.carry; pk.n -= g;
      if (pk.sp !== f.sp) { f.het += g; M.wasted += g; }
      else if (pk.from === b.at) f.self += g;
      else { f.out += g; M.deposited += g; }
    });
    b.load = b.load.filter(pk => pk.n > 0.5);
    // pick up from the anthers
    const take = MW.pick * f.anther; f.anther *= 0.85;
    b.load.push({ from: b.at, sp: f.sp, n: take });
    b.recent.push(b.at); if (b.recent.length > 5) b.recent.shift();
  }
  function meadowStep(M, dt, p) {
    if (p.mode === 'wind') {
      // wind: every flower sheds into the air; each catches from its own kind nearby
      M.fl.forEach(f => {
        let near = 0; M.fl.forEach(g => { if (g !== f && g.sp === f.sp && Math.hypot(g.x - f.x, g.y - f.y) < 4) near += g.anther; });
        const gin = 0.001 * near * dt; f.out += gin; M.deposited += gin; f.anther = Math.max(0.05, f.anther - 0.00002 * dt);
      });
      M.t += dt; return;
    }
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(0.5, left);
      M.bees.forEach(b => {
        if (b.hold > 0) { b.hold -= h; if (b.hold <= 0) { b.tgt = pickNext(M, b, p); } return; }
        const t = M.fl[b.tgt], dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy), step = MW.speed * h;
        if (d > 1e-6) b.ang = Math.atan2(dy, dx);
        if (d <= step) { b.x = t.x; b.y = t.y; b.at = b.tgt; visit(M, b, p); b.hold = MW.handle; }
        else { b.x += dx / d * step; b.y += dy / d * step; }
      });
      left -= h; M.t += h;
    }
  }
  const fert = g => MW.ovules * (1 - Math.exp(-MW.eff * g / MW.ovules));
  function seedSet(M, sp) { const fs = M.fl.filter(f => f.sp === sp); return fs.length ? fs.reduce((s, f) => s + fert(f.out), 0) / (fs.length * MW.ovules) : 0; }
  const MCACHE = {};
  function meadowRun(p, secs) {
    const key = [p.bees, p.constancy, p.fracB, p.nFlowers, p.carry, p.mode, p.pesticide, p.seed, secs].join('|');
    if (MCACHE[key]) return MCACHE[key];
    const M = meadowStart(p); meadowStep(M, secs, p);
    const out = { A: seedSet(M, 'A'), B: seedSet(M, 'B'), visits: M.visits, het: M.wasted / Math.max(1, M.wasted + M.deposited) };
    const ks = Object.keys(MCACHE); if (ks.length > 80) delete MCACHE[ks[0]];
    return (MCACHE[key] = out);
  }

  /* ============================================================
     5. SEEDS — how far they go
     Terminal speed v = √(2mg/(ρ C A)): a sycamore samara autorotating
     (A the disc its wing sweeps, C = 0.23 fitted to the measured 1.0 m/s;
     Azuma & Yasuda 1989), a dandelion achene under its pappus (0.39 m/s;
     Cummins et al. 2018). Wind U(z) = U₁₀ ln(z/z₀)/ln(10/z₀), z₀ = 0.1 m;
     gusts: vertical air velocity w a random process with σ_w = 1.25u*·turb
     and a memory of 2 s. An acorn drops, and a jay carries half the crop to
     caches up to a few hundred metres away; a cherry is eaten by a thrush
     and its stone dropped after the time it takes to pass the gut, the bird
     moving between trees meanwhile.
     ============================================================ */
  const SEEDS = {
    maple: { name: 'sycamore samara', m: 0.09e-3, C: 0.23, carrier: 'wind', H: 12 },
    dandelion: { name: 'dandelion achene', m: 0.6e-6, C: 0.42, R: 0.007, carrier: 'wind', H: 0.4 },
    acorn: { name: 'acorn', m: 3e-3, C: 0.5, R: 0.01, carrier: 'jay', H: 10 },
    cherry: { name: 'cherry', m: 5e-3, C: 0.5, R: 0.009, carrier: 'thrush', H: 6 }
  };
  const discR = (k, wing) => k === 'maple' ? 0.012 + wing / 100 : SEEDS[k].R;
  const terminal = (k, wing) => Math.sqrt(2 * SEEDS[k].m * G / (RHO_AIR * SEEDS[k].C * Math.PI * Math.pow(discR(k, wing), 2)));
  const Z0 = 0.1;
  const windAt = (U10, z) => U10 * Math.log(Math.max(z, Z0 * 1.01) / Z0) / Math.log(10 / Z0);
  function disperse(p) {
    const r = rng(77 + p.seed * 131), k = p.stype, v = terminal(k, p.wing), n = Math.round(p.nSeeds), land = [], paths = [];
    const ustar = 0.4 * p.wind / Math.log(10 / Z0), sw = 1.25 * ustar * p.turb, tau = 2;
    const gauss = () => { const a = r(), b = r(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(TAU * b); };
    for (let i = 0; i < n; i++) {
      const keep = i < 24, path = keep ? [] : null;
      if (k === 'acorn') {
        // most fall under the crown; a jay takes about half and caches each one
        let x = (r() - 0.5) * 8; if (r() < 0.5) x += -p.jay * Math.log(r()) * (r() < 0.5 ? -1 : 1) * 0.5 + p.jay * 0.25 * (r() < 0.5 ? -1 : 1);
        land.push(x); if (keep) path.push([0, p.relH], [x, 0]); paths.push(path); continue;
      }
      if (k === 'cherry') {
        // eaten by a thrush (seven in ten), carried for the gut time while it hops between trees ~40 m at a time
        if (r() < 0.3) { const x = (r() - 0.5) * 6; land.push(x); if (keep) path.push([0, p.relH], [x, 0]); paths.push(path); continue; }
        const T = -p.gut * Math.log(r()), hops = Math.floor(T / 4); let x = 0;
        if (keep) path.push([0, p.relH]);
        for (let h = 0; h < hops; h++) { x += (r() - 0.5) * 2 * 40; if (keep) path.push([x, p.relH * (0.6 + r() * 0.6)]); }
        land.push(x); if (keep) path.push([x, 0]); paths.push(path); continue;
      }
      let x = (r() - 0.5) * (k === 'maple' ? 6 : 0.1), z = p.relH * (k === 'maple' ? 0.75 + r() * 0.25 : 1), w = 0, t = 0;
      if (keep) path.push([x, z]);
      const dt = k === 'dandelion' ? 0.05 : 0.04;
      while (z > 0 && t < 900) {
        w = w * Math.exp(-dt / tau) + sw * Math.sqrt(1 - Math.exp(-2 * dt / tau)) * gauss();
        x += windAt(p.wind, z) * dt; z += (w - v) * dt; t += dt;
        if (keep && (path.length < 400) && Math.round(t / dt) % 5 === 0) path.push([x, Math.max(0, z)]);
      }
      land.push(x); if (keep) path.push([x, 0]); paths.push(path);
    }
    const s = land.map(Math.abs).sort((a, b) => a - b), med = s[Math.floor(s.length / 2)], far = s[Math.floor(s.length * 0.95)];
    return { land, paths, v, median: med, p95: far, mean: s.reduce((a, b) => a + b, 0) / s.length };
  }

  /* ============================================================
     6. THE EXPERIMENT
     ============================================================ */
  const SETUPS = [
    { value: 'courtship', label: 'Long tails and choosy females', teaches: ['E3.1'] },
    { value: 'care', label: 'How many eggs?', teaches: ['E3.2'] },
    { value: 'flower', label: 'Take a flower apart', teaches: ['E3.3'] },
    { value: 'pollinate', label: 'Bees in a meadow', teaches: ['E3.4'] },
    { value: 'seeds', label: 'How far do seeds go?', teaches: ['E3.5'] }
  ];
  const is = (...a) => S => a.indexOf(S.p.setup) >= 0;
  const BASE = { setup: 'courtship', shortTo: 14, add: 25, risk: 1, display: 10, choosy: 4, females: 36, pace: 3, seed: 1,
    clutch: 9, food: 1, parents: 2, cpace: 1,
    flower: 'lily', dissect: 0, ptype: 'lily', wind: 5, relH: 1,
    mode: 'bees', bees: 8, constancy: 0.8, fracB: 0.3, nFlowers: 60, carry: 0.25, pesticide: false, lapse: 60,
    stype: 'maple', swind: 6, turb: 1, sH: 12, wing: 3.5, jay: 250, gut: 25, nSeeds: 300 };
  const SETUP_DEFAULTS = { courtship: {}, care: {}, flower: { ptype: 'lily' }, pollinate: {}, seeds: {} };
  const SEED_H = { maple: 12, dandelion: 0.4, acorn: 10, cherry: 6 };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (!p.pre && (first ? p.setup !== BASE.setup : S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    // a new kind of seed is released from its own plant's height unless a preset says otherwise
    if (p.setup === 'seeds' && !p.pre && S._lastStype !== undefined && S._lastStype !== p.stype) p.sH = SEED_H[p.stype];
    S._lastStype = p.stype;
    p.pre = 0; S._lastSetup = p.setup;
    p.clutch = Math.round(clamp(p.clutch, 1, 16)); p.dissect = Math.round(clamp(p.dissect, 0, 3)); p.seed = Math.round(p.seed);
    S.t = 0; S.ts = 0;
    if (p.setup === 'courtship') { S.C = courtSeason(p, p.seed); S.day = 0; }
    if (p.setup === 'care') { S.B = brood(p.clutch, p.food, p.parents); S.day = 0; S.lack = lackCurve(p.food, p.parents); }
    if (p.setup === 'flower') { S.puffs = []; S._puffT = 0; S._r = rng(5); }
    if (p.setup === 'pollinate') {
      S.M = meadowStart(p); S.hist = [[0, 0, 0]]; S._rec = 0;
      S.landQ = []; [1, 2, 4, 8, 16, 30].forEach(b => [0.2, 0.9].forEach(c => S.landQ.push({ b, c, M: null, done: false, A: 0 })));
    }
    if (p.setup === 'seeds') { S.D = disperse({ stype: p.stype, wing: p.wing, wind: p.swind, turb: p.turb, relH: p.sH, nSeeds: p.nSeeds, jay: p.jay, gut: p.gut, seed: p.seed }); }
    if (p.setup === 'flower') {
      if (!S.cam || S.camKey !== 'flower') { S.cam = Camera({ theta: -1.25, phi: 0.22, dist: 0.36, target: [0, 0.02, 0.15], fov: 0.66 }); S.cam.minDist = 0.2; S.cam.maxDist = 3; S.camKey = 'flower'; }
    } else if (!S.cam || S.camKey !== 'flat') { S.cam = Camera({ theta: -1.5, phi: 0.2, dist: 3, target: [0, 0, 0], fov: 0.66 }); S.camKey = 'flat'; }
  }
  const MEADOW_DT = 30;
  function step(S, dt) {
    const p = S.p;
    S.ts += dt;
    if (p.setup === 'courtship') S.day = Math.min(WB.days, S.day + dt * p.pace);
    if (p.setup === 'care') S.day = Math.min(TIT.days, S.day + dt * p.cpace);
    if (p.setup === 'flower') {
      // a tap on the stem every 1.5 s shakes a puff of pollen from the anthers into the wind
      S._puffT += dt;
      if (S._puffT > 1.5) { S._puffT = 0; for (let k = 0; k < 14; k++) S.puffs.push({ x: (S._r() - 0.5) * 0.01, y: (S._r() - 0.5) * 0.01, z: 0, age: 0 }); }
      const v = settle(p.ptype), slow = 0.25;           // a quarter of real speed, so the eye can follow
      S.puffs.forEach(q => { q.x += p.wind * dt * slow * 0.06; q.z -= v * dt * slow * 6; q.y += (S._r() - 0.5) * 0.002; q.age += dt; });
      S.puffs = S.puffs.filter(q => q.age < 8 && q.z > -0.4);
    }
    if (p.setup === 'pollinate') {
      if (S.M.t < 4 * 3600) meadowStep(S.M, dt * p.lapse, p);
      const m = Math.floor(S.M.t / MEADOW_DT); if (m !== S._rec) { S._rec = m; S.hist.push([S.M.t / 60, seedSet(S.M, 'A'), seedSet(S.M, 'B')]); if (S.hist.length > 600) S.hist.shift(); }
      const q = S.landQ.find(x => !x.done);
      if (q) { const pp = Object.assign({}, p, { bees: q.b, constancy: q.c, mode: 'bees' }); if (!q.M) q.M = meadowStart(pp); meadowStep(q.M, 300, pp); if (q.M.t >= 1800) { q.done = true; q.A = (seedSet(q.M, 'A') * (1 - p.fracB) + seedSet(q.M, 'B') * p.fracB); q.M = null; } }
    }
  }

  /* ============================================================
     7. THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const LIGHT = '#EAF1FF', DIM = '#9FB0CC';
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
  function lay(g) { const W = g.w, narrow = W < 640, cardW = narrow ? W - 20 : Math.min(360, Math.max(280, W * 0.30)); return { W, H: g.h, narrow, cardW, sw: narrow ? W : W - cardW - 24, HD: 58 }; }
  function drawStage(S, g) {
    const p = S.p, K = kit(), A = LF();
    if (!K || !A || !ART()) return;
    const Ly = lay(g);
    if (p.setup === 'courtship') stageCourt(S, g, Ly);
    if (p.setup === 'care') stageCare(S, g, Ly);
    if (p.setup === 'flower') stageFlower(S, g, Ly);
    if (p.setup === 'pollinate') stageMeadow(S, g, Ly);
    if (p.setup === 'seeds') stageSeeds(S, g, Ly);
    const H = headerOf(S); K.header(g, H[0], H[1], H[2]);
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'courtship') {
      const d = Math.min(WB.days - 1, Math.floor(S.day)), row = S.C.daily[d];
      return ['Day ' + (d + 1) + ' of ' + WB.days + ': lengthened males ' + f2(row[3][0]) + ' nests each, shortened ' + f2(row[0][0]),
        'tails: ' + p.shortTo + ' cm · 50 cm · 50 cm · ' + (50 + p.add) + ' cm · ' + p.females + ' females, each visits ' + Math.round(p.choosy) + ' males · kites ×' + p.risk,
        'alive: ' + row.map((r, i) => r[1] + '/9').join(' · ') + ' · after Andersson 1982, Nature 299: 818'];
    }
    if (p.setup === 'care') {
      const d = Math.min(TIT.days, Math.floor(S.day)), al = S.B.chicks.filter(c => c.hist[d] != null), mm = al.length ? al.reduce((s, c) => s + c.hist[d], 0) / al.length : 0;
      return [p.clutch + ' eggs, day ' + d + ' of ' + TIT.days + ': ' + al.length + ' chicks alive, ' + f1(mm) + ' g on average',
        'parents bring ' + Math.round(S.B.D) + ' caterpillars a day · caterpillar supply × ' + f2(p.food) + ' · ' + (p.parents === 2 ? 'both parents' : 'one parent'),
        'expected to live a year: ' + f2(S.B.recruits) + ' young · the best clutch this spring: ' + bestClutch(p.food, p.parents) + ' eggs (Lack 1947)'];
    }
    if (p.setup === 'flower') {
      const k = p.ptype, v = settle(k);
      return [(p.flower === 'lily' ? 'A lily: ' : 'A grass floret: ') + ['whole', 'tepals folded back', 'stamens laid out', 'ovary cut across'][p.dissect],
        POLLEN[k].name + ' pollen, ' + POLLEN[k].d + ' µm: falls ' + (v * 100).toFixed(2) + ' cm/s in still air (Stokes) · Re = ' + reynolds(k).toExponential(1),
        'from ' + f1(p.relH) + ' m in a ' + p.wind + ' m/s wind it lands ~' + Math.round(carried(k, p.relH, p.wind)) + ' m away · ' + POLLEN[k].note];
    }
    if (p.setup === 'pollinate') {
      const M = S.M, A_ = seedSet(M, 'A'), B_ = seedSet(M, 'B');
      return [(p.mode === 'wind' ? 'Wind alone: ' : M.bees.length + ' bees: ') + Math.round(A_ * 100) + ' % of buttercup ovules and ' + Math.round(B_ * 100) + ' % of cranesbill ovules fertilised',
        Math.floor(M.t / 60) + ' min · ' + M.visits + ' visits · constancy ' + p.constancy.toFixed(2) + ' · carryover ' + p.carry.toFixed(2) + (p.pesticide ? ' · half the bees lost to pesticide' : ''),
        'pollen on the wrong species: ' + Math.round(M.wasted / Math.max(1, M.wasted + M.deposited) * 100) + ' % · self-pollen cannot fertilise these flowers'];
    }
    const D = S.D, k = p.stype;
    return [SEEDS[k].name + ': half land within ' + f1(D.median) + ' m, one in twenty beyond ' + f1(D.p95) + ' m',
      (SEEDS[k].carrier === 'wind' ? 'falls at ' + f2(D.v) + ' m/s · wind ' + p.swind + ' m/s at 10 m · gusts × ' + p.turb.toFixed(1) : SEEDS[k].carrier === 'jay' ? 'jays carry half the crop up to ' + p.jay + ' m (typical) to bury' : 'thrushes swallow seven in ten; the stone passes in about ' + p.gut + ' min'),
      'released from ' + f1(p.sH) + ' m · ' + Math.round(p.nSeeds) + ' seeds · rule of thumb: distance ≈ height × wind ÷ fall speed'];
  }

  /* ---------- the widowbird grassland ---------- */
  function stageCourt(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), sw = Ly.sw, H = g.h, gy = H * 0.66;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#3E6EA8'); sky.addColorStop(1, '#C8D8E0'); ctx.fillStyle = sky; ctx.fillRect(0, 0, sw, gy);
    // the far Kinangop plateau and its acacias
    ctx.fillStyle = '#7A8A6A'; ctx.beginPath(); ctx.moveTo(0, gy - 30); for (let x = 0; x <= sw; x += 20) ctx.lineTo(x, gy - 30 - 14 * Math.sin(x * 0.012) - 8 * Math.sin(x * 0.031)); ctx.lineTo(sw, gy); ctx.lineTo(0, gy); ctx.closePath(); ctx.fill();
    [0.08, 0.3, 0.55, 0.77, 0.95].forEach((fx, i) => A.tree(ctx, fx * sw, gy - 6, 40 + (i % 2) * 14, { leaf: '#4A6030', seed: i + 2 }));
    const gr = ctx.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, '#9A9450'); gr.addColorStop(1, '#5E6A2E'); ctx.fillStyle = gr; ctx.fillRect(0, gy, sw, H - gy);
    A.grassTufts(ctx, 0, sw, gy + 4, 22, { seed: 3 });
    const d = Math.min(WB.days - 1, Math.floor(S.day)), row = S.C.daily[d];
    const s = clamp(sw / 14, 30, 70);
    GROUPS.forEach((G_, gi) => {
      const cx = sw * (0.13 + gi * 0.245), males = S.C.males.filter(m => m.g === G_.g), m0 = males[0], alive = males.filter(m => m.died < 0 || m.died > d).length;
      // the territory: a tall stem the male perches on
      ctx.strokeStyle = '#8A8040'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, H - 30); ctx.quadraticCurveTo(cx + 4, gy - s * 0.4, cx + 2, gy - s * 1.6); ctx.stroke();
      ctx.fillStyle = '#C8B070'; ctx.beginPath(); ctx.ellipse(cx + 2, gy - s * 1.6 - 6, 3, 9, 0.1, 0, TAU); ctx.fill();
      const L_ = tailOf(p, G_.g), tail = L_ / 19;
      const shown = males.find(m => m.died < 0 || m.died > d);
      if (shown) {
        const disp = ((S.ts * 0.6 + gi * 0.37) % 1) < 0.35;
        if (disp) A.birdSide(ctx, cx - s * 0.2, gy - s * 2.4 - Math.sin(S.ts * 3 + gi) * 6, s, { kind: 'widowM', pose: 'display', phase: S.ts * 9 + gi, tail, facing: gi % 2 ? -1 : 1 });
        else A.birdSide(ctx, cx + 2, gy - s * 1.6 - s * 0.36, s, { kind: 'widowM', pose: 'perch', tail, facing: gi % 2 ? -1 : 1 });
      } else { ctx.fillStyle = '#16161A'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(cx - 10 + k * 5, H - 40 + (k % 2) * 4, 7, 2, k, 0, TAU); ctx.fill(); } }
      // the nests in the grass: one for every female that settled here
      const nests = Math.round(row[gi][0] * WB.per);
      for (let k = 0; k < Math.min(nests, 12); k++) {
        const nx = cx - s * 0.85 + (k % 4) * s * 0.55, ny = gy + 40 + Math.floor(k / 4) * s * 0.5;
        // each nest slung between grass stems, the stems in front of it
        ctx.strokeStyle = '#8A8040'; ctx.lineWidth = 1.5; [-0.3, 0.3].forEach(o => { ctx.beginPath(); ctx.moveTo(nx + o * s * 0.5, H - 30); ctx.lineTo(nx + o * s * 0.4, ny - s * 0.5); ctx.stroke(); });
        A.wovenNest(ctx, nx, ny, s * 0.5, { facing: k % 2 ? 1 : -1 });
        A.grassTufts(ctx, nx - s * 0.3, nx + s * 0.3, ny + s * 0.32, s * 0.4, { seed: k + gi * 7 });
      }
      // a female arriving in the last days
      if (nests > 0 && males[0].nests.some(n => Math.abs(n - S.day) < 1.2)) A.birdSide(ctx, cx + s * 0.6, gy + 6, s * 0.75, { kind: 'widowF', pose: 'fly', phase: S.ts * 10, facing: -1 });
      // the label
      ctx.font = sans(Ly.narrow ? 10 : 11.5, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
      const t1 = Ly.narrow ? Math.round(L_) + ' cm' : G_.name + ', ' + Math.round(L_) + ' cm', t2 = Ly.narrow ? nests + ' nests' : nests + ' nests · ' + alive + '/9 alive', yb = Ly.narrow ? H - 100 : H - 52;
      ctx.strokeText(t1, cx, yb); ctx.fillStyle = '#FFFFFF'; ctx.fillText(t1, cx, yb);
      ctx.font = mono(10, 600); ctx.strokeText(t2, cx, yb + 16); ctx.fillStyle = '#FFD38A'; ctx.fillText(t2, cx, yb + 16);
      void m0;
    });
    // the kite, quartering the grassland
    if (p.risk > 0) { const kx = (S.ts * 40) % (sw + 200) - 100; A.birdSide(ctx, kx, 90 + Math.sin(S.ts) * 10, s * 0.9, { kind: 'kite', pose: 'fly', phase: S.ts * 5 }); }
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'The experiment', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const h = 200; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Andersson’s tail experiment', sl.x + 10, sl.y + 8);
      ctx.font = mono(9.5); ctx.fillStyle = DIM;
      ['36 males, nine in each group, before', 'any female had chosen. Count the new', 'nests in each territory after.'].forEach((t, i) => ctx.fillText(t, sl.x + 10, sl.y + 26 + i * 13));
      const E = courtExpected(p, 120), mx = Math.max(2, ...E.map(e => e.nests));
      E.forEach((e, i) => {
        const yy = sl.y + 76 + i * 28, w = (sl.w - 150) * e.nests / mx;
        ctx.font = mono(10, 600); ctx.fillStyle = LIGHT; ctx.fillText(GROUPS[i].name, sl.x + 10, yy);
        ctx.fillStyle = ['#8FA3C0', '#C9D4EA', '#C9D4EA', '#FFD38A'][i]; ctx.fillRect(sl.x + 10, yy + 13, Math.max(2, w), 8);
        ctx.font = mono(9.5); ctx.fillStyle = DIM; ctx.fillText(f2(e.nests) + ' nests/male · ' + Math.round(e.alive * 100) + ' % alive', sl.x + 18 + w, yy + 11);
      });
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('bars: the average of 120 seasons like this one', sl.x + 10, sl.y + h - 16);
    }
  }

  /* ---------- the nest box ---------- */
  function stageCare(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), sw = Ly.sw, H = g.h;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2E4A36'); bg.addColorStop(1, '#16241A'); ctx.fillStyle = bg; ctx.fillRect(0, 0, sw, H);
    // oak leaves behind, out of focus
    for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(90,140,70,' + (0.15 + (k % 4) * 0.05) + ')'; ctx.beginPath(); ctx.ellipse((k * 97) % sw, (k * 53) % H, 18, 9, k, 0, TAU); ctx.fill(); }
    const w = Math.min(sw * 0.5, (H - 120) / 1.6), bx = sw * 0.42, by = H - 50;
    const NB = A.nestBox(ctx, bx, by, w, {});
    const d = Math.min(TIT.days, Math.floor(S.day)), frac = S.day - Math.floor(S.day);
    // the chicks, as heavy as the model says they are today
    const alive = S.B.chicks.map((c, i) => ({ c, i, m: c.hist[d] })).filter(o => o.m != null);
    const n = alive.length, beg = (k) => 0.5 + 0.5 * Math.sin(S.ts * 6 + k * 1.3);
    alive.forEach((o, k) => {
      const sz = w * (0.15 + 0.2 * o.m / TIT.mmax), row = k % 2, x = NB.cx + (k - (n - 1) / 2) * w * 0.7 / Math.max(1, n) * 1.15, y = NB.cy - sz * 0.25 - row * sz * 0.25;
      A.chick(ctx, x, y, sz, { beg: beg(k) > 0.6 ? 1 : 0.2, thin: o.c.q[Math.max(0, d - 1)] < 0.6 ? 1 - o.c.q[Math.max(0, d - 1)] : 0, ang: (k - n / 2) * 0.05 });
    });
    // a parent arriving with a caterpillar, as often as the pair's catch allows
    const visitsPerHour = S.B.D / 15, cyc = clamp(60 / visitsPerHour, 0.6, 4), ph = (S.ts % cyc) / cyc;
    if (ph < 0.55) {
      const t = ph / 0.55, x = sw * 0.95 - t * (sw * 0.95 - (bx + w * 0.62)), y = NB.top + w * 0.4 - Math.sin(t * Math.PI) * 30;
      A.birdSide(ctx, x, y, w * 0.32, { kind: 'tit', pose: 'fly', phase: S.ts * 14, facing: -1 });
      A.caterpillar(ctx, x - w * 0.2, y - w * 0.05, w * 0.12, 0.3);
    }
    // the other parent waiting on an oak twig
    ctx.strokeStyle = '#4A3A2A'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, NB.top + w * 0.32); ctx.quadraticCurveTo(bx - w * 0.7, NB.top + w * 0.28, bx - w * 0.5, NB.top + w * 0.36); ctx.stroke();
    for (let k = 0; k < 4; k++) { ctx.fillStyle = '#4C7A3A'; ctx.beginPath(); ctx.ellipse(bx - w * (1.1 - k * 0.18), NB.top + w * 0.28 + (k % 2) * 8, 12, 6, k, 0, TAU); ctx.fill(); }
    if (p.parents === 2) A.birdSide(ctx, bx - w * 0.75, NB.top + w * 0.32 - w * 0.13, w * 0.3, { kind: 'tit', pose: 'perch', facing: 1 });
    if (g.labels && !Ly.narrow) {
      ctx.font = mono(10, 600); ctx.fillStyle = '#E8E0D0'; ctx.textAlign = 'left';
      ctx.fillText('nest box, front cut away', bx + w * 0.55, NB.top + 12);
      ctx.fillText('moss cup lined with hair', bx + w * 0.55, NB.cy + 20);
      ctx.fillText('parent with a winter-moth caterpillar', Math.min(sw - 230, bx + w * 0.7), NB.top - 14);
    }
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'The brood', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const B = S.B, al = B.chicks.filter(c => c.hist[d] != null), need = al.reduce((s, c) => s + TIT.need * Math.min(1, 0.15 + c.hist[d] / TIT.mmax), 0);
      const rows = [['day', d + ' of ' + TIT.days], ['eggs laid', String(p.clutch)], ['chicks alive', String(al.length)], ['caterpillars brought a day', String(Math.round(B.D))], ['the brood needs today', String(Math.round(need))], ['mean chick mass', f1(al.length ? al.reduce((s, c) => s + c.hist[d], 0) / al.length : 0) + ' g'], ['young alive in a year', f2(B.recruits)]];
      const h = 34 + rows.length * 19 + 8; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('The brood, weighed every day', sl.x + 10, sl.y + 8);
      rows.forEach((r, i) => { const yy = sl.y + 30 + i * 19; ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r[0], sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = i === rows.length - 1 ? '#FFD38A' : LIGHT; ctx.textAlign = 'right'; ctx.fillText(r[1], sl.x + sl.w - 10, yy); });
    }
    void frac;
  }

  /* ---------- the flower on the bench ---------- */
  function stageFlower(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), cam = S.cam, sw = Ly.sw, Me = window.MEAS;
    cam.fov = Ly.narrow ? 0.9 : 0.66; cam.setViewport(sw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.34 });
    if (Me) { Me.bench(F, -0.4, 0.4, -0.25, 0.3, { cabinet: '#A9B2BC' }); Me.tileWall(F, -0.4, 0.4, 0.3, 0, 0.6); }
    // the white dissecting tile the parts are laid on
    R3.box(F, [0.0, -0.02, 0.004], [0.32, 0.22, 0.008], '#F2F2EE', { shadow: false, bias: F.GROUND - 1 });
    const at = [0, 0.02, 0.12], s = 0.055;
    // a clamp holding the stem
    R3.cylinder(F, [0.0, 0.08, 0.008], [0.0, 0.08, 0.10], 0.005, '#8A939E', { shadow: false });
    R3.box(F, [0.0, 0.05, 0.075], [0.012, 0.06, 0.012], '#6A7480', { shadow: false });
    let parts;
    if (p.flower === 'lily') parts = A.lily3D(F, at, s, { open: p.dissect >= 1 ? 1 : 0, layStamens: p.dissect >= 2 ? 1 : 0, cut: p.dissect >= 3, pollen: 0.3 });
    else parts = A.grass3D(F, at, s * 0.9, { t: S.ts });
    // the pollen puff from the anthers, carried by the wind, falling at the computed speed (slowed for the eye)
    const src = parts.anther || at;
    ART().dots(F, src, S.puffs.map(q => ({ w: [src[0] + q.x, src[1] + q.y, src[2] + q.z], a: clamp(0.9 - q.age / 8, 0.1, 0.9) })), p.ptype === 'lily' ? '#C84A12' : '#F0D060', 0.0022, { bias: -0.01 });
    if (g.labels && !Ly.narrow) {
      const lab = (pt, dx, dy, t) => pt && R3.callout(F, pt, dx, dy, t, '#DDE7F7');
      if (p.flower === 'lily') { lab(parts.tepal, -70, 30, 'tepal (petal or sepal)'); lab(parts.anther, 60, -40, 'anther on its filament: the stamen'); lab(parts.stigma, -50, -50, 'stigma'); lab(parts.style, -80, -10, 'style'); lab(parts.ovary, 60, 30, p.dissect >= 3 ? 'ovary cut: three chambers of ovules' : 'ovary'); }
      else { lab(parts.anther, 60, 30, 'anthers hang out in the wind'); lab(parts.stigma, -60, -30, 'feathery stigma'); }
    }
    F.render();
    ctx.restore();
    // the microscope's view of the pollen
    const K = kit(), sl = K.cardSlot(g, S, 'Pollen ×400', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const h = Math.min(sl.w, 300); K.card(ctx, sl.x, sl.y, sl.w, h + 40);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Under the microscope: ' + POLLEN[p.ptype].name, sl.x + 10, sl.y + 8);
      const R = (h - 30) / 2, cx = sl.x + sl.w / 2, cy = sl.y + 30 + R;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      const bgc = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R); bgc.addColorStop(0, '#F4F0E4'); bgc.addColorStop(1, '#BDB6A2'); ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const pxPerUm = R / 120, d = POLLEN[p.ptype].d * pxPerUm, r = rng(9);
      for (let k = 0; k < 9; k++) A.pollenGrain(ctx, cx + (r() - 0.5) * R * 1.4, cy + (r() - 0.5) * R * 1.4, d, p.ptype);
      ctx.restore();
      ctx.strokeStyle = '#3A3A44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 25 * pxPerUm, cy + R * 0.78); ctx.lineTo(cx + 25 * pxPerUm, cy + R * 0.78); ctx.stroke();
      ctx.font = mono(9, 700); ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.fillText('50 µm', cx, cy + R * 0.78 + 3);
      ctx.font = mono(9.5); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(POLLEN[p.ptype].note + ' · falls ' + (settle(p.ptype) * 100).toFixed(1) + ' cm/s', sl.x + 10, sl.y + h + 14);
    }
  }

  /* ---------- the meadow from above ---------- */
  function stageMeadow(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), M = S.M, sw = Ly.sw, H = g.h;
    const top = Ly.narrow ? 90 : 66, sc = Math.min((sw - 24) / MW.W, (H - top - 40) / MW.H), ox = (sw - MW.W * sc) / 2, oy = top;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const pat = ctx.createPattern(ART().grassTex(false), 'repeat'); ctx.fillStyle = pat; ctx.save(); ctx.translate(ox, oy); ctx.scale(0.35, 0.35); ctx.fillRect(0, 0, MW.W * sc / 0.35, MW.H * sc / 0.35); ctx.restore();
    ctx.fillStyle = 'rgba(10,30,10,.18)'; ctx.fillRect(ox, oy, MW.W * sc, MW.H * sc);
    const fs = clamp(sc * 0.42, 14, 46);
    M.fl.forEach(f => A.meadowFlower(ctx, ox + f.x * sc, oy + f.y * sc, fs, f.sp === 'A' ? 'butter' : 'crane', { rot: f.rot, anther: f.anther, seeded: fert(f.out) / MW.ovules, dusted: clamp((f.out + f.het) / 40, 0, 1), dustColour: f.het > f.out ? '#B060F0' : '#F2B830' }));
    if (p.mode === 'bees') M.bees.forEach((b, i) => {
      const load = b.load.reduce((s, k) => s + k.n, 0);
      A.bee(ctx, ox + b.x * sc, oy + b.y * sc, clamp(sc * 0.16, 10, 26), b.ang, { load: clamp(load / 120, 0, 1), colour: M.fl[b.at].sp === 'A' ? '#F2B830' : '#B87AE0', phase: S.ts * 60 + i });
    });
    else { ctx.strokeStyle = 'rgba(255,240,180,.35)'; ctx.lineWidth = 1; for (let k = 0; k < 40; k++) { const x = ((k * 61 + S.ts * 60) % (MW.W * sc)) + ox, y = oy + (k * 37) % (MW.H * sc); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y + 2); ctx.stroke(); } }
    // a 1 m scale bar
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + 8, oy + MW.H * sc - 10); ctx.lineTo(ox + 8 + sc, oy + MW.H * sc - 10); ctx.stroke();
    ctx.font = mono(10, 700); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'left'; ctx.fillText('1 m', ox + 12 + sc, oy + MW.H * sc - 14);
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'Counts', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const A_ = M.fl.filter(f => f.sp === 'A'), B_ = M.fl.filter(f => f.sp === 'B');
      const rows = [['buttercups / cranesbills', A_.length + ' / ' + B_.length], ['bees working', p.mode === 'wind' ? 'none: wind only' : String(M.bees.length)], ['visits so far', String(M.visits)], ['visits per bee per minute', M.bees.length && M.t > 0 ? f1(M.visits / M.bees.length / (M.t / 60)) : '—'],
        ['buttercup ovules fertilised', Math.round(seedSet(M, 'A') * 100) + ' %'], ['cranesbill ovules fertilised', Math.round(seedSet(M, 'B') * 100) + ' %'], ['grains on the wrong species', Math.round(M.wasted).toLocaleString('en-US')]];
      const h = 34 + rows.length * 19 + 10; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('The meadow, ' + Math.floor(M.t / 60) + ' minutes in', sl.x + 10, sl.y + 8);
      rows.forEach((r, i) => { const yy = sl.y + 30 + i * 19; ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r[0], sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = i >= 4 ? '#FFD38A' : LIGHT; ctx.textAlign = 'right'; ctx.fillText(r[1], sl.x + sl.w - 10, yy); });
    }
  }

  /* ---------- the seed field, side on ---------- */
  function stageSeeds(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = LF(), D = S.D, sw = Ly.sw, H = g.h, k = p.stype;
    const gy = H - (Ly.narrow ? 120 : 70), xmax = Math.max(15, Math.min(1000, D.p95 * 1.25)), x0 = sw * 0.14, sx = (sw - x0 - 20) / xmax;
    const hTop = Math.max(p.sH * 1.3, 14), sy = (gy - 80) / hTop;
    const X = x => x0 + x * sx, Y = z => gy - z * sy;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#4A7AB8'); sky.addColorStop(1, '#D0E0EA'); ctx.fillStyle = sky; ctx.fillRect(0, 0, sw, gy);
    ctx.fillStyle = '#7E9A5E'; ctx.beginPath(); ctx.moveTo(0, gy - 20); for (let x = 0; x <= sw; x += 24) ctx.lineTo(x, gy - 20 - 10 * Math.sin(x * 0.01)); ctx.lineTo(sw, gy); ctx.lineTo(0, gy); ctx.closePath(); ctx.fill();
    const gr = ctx.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, '#6A8A3A'); gr.addColorStop(1, '#3A5222'); ctx.fillStyle = gr; ctx.fillRect(0, gy, sw, H - gy);
    // the parent plant
    if (k === 'dandelion') {
      const hx = X(0), hy = Y(p.sH);
      ctx.strokeStyle = '#7AA048'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, gy); ctx.lineTo(hx, hy); ctx.stroke();
      for (let a = 0; a < 18; a++) { ctx.strokeStyle = 'rgba(240,240,236,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(a / 18 * TAU) * 14, hy + Math.sin(a / 18 * TAU) * 14); ctx.stroke(); }
      for (let a = 0; a < 5; a++) { ctx.fillStyle = '#4C8030'; ctx.beginPath(); ctx.ellipse(hx + (a - 2) * 8, gy - 3, 12, 3, (a - 2) * 0.4, 0, TAU); ctx.fill(); }
    } else A.tree(ctx, X(0), gy, p.sH * sy * 1.12, { leaf: k === 'maple' ? '#4A8A3A' : k === 'acorn' ? '#3E6A2A' : '#4A7A34', seed: 4 });
    // the wind, stronger with height (log profile)
    for (let z = 2; z <= hTop; z += hTop / 6) { const u = windAt(p.swind, z), l = clamp(u * 6, 0, 80); if (l < 2) continue; const yy = Y(z); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(8, yy); ctx.lineTo(8 + l, yy); ctx.stroke(); ART().arrowHead(ctx, 8 + l, yy, 0, 5, 'rgba(255,255,255,.7)'); }
    // landed seeds and their spread along the ground
    const bins = new Array(40).fill(0); D.land.forEach(x => { const b = Math.floor(Math.abs(x) / xmax * 40); if (b < 40) bins[b]++; }); const bm = Math.max(...bins, 1);
    bins.forEach((c, i) => { ctx.fillStyle = 'rgba(255,211,138,.75)'; const h = c / bm * 40; ctx.fillRect(X(i / 40 * xmax), gy + 26 - h, xmax / 40 * sx - 1, h); });
    // seeds in flight: each of the first two dozen along its own computed path, one after another
    const anim = S.ts * (k === 'cherry' || k === 'acorn' ? 6 : 1.4);
    D.paths.forEach((path, i) => {
      if (!path || path.length < 2) return;
      const t = (anim - i * 0.35); if (t < 0) return;
      const pos = Math.min(path.length - 1, t * (path.length / 6)), j = Math.floor(pos), f = pos - j, a = path[j], b = path[Math.min(path.length - 1, j + 1)];
      const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
      if (x * sx > sw) return;
      if (k === 'maple') A.samara(ctx, X(x), Y(z), 14, S.ts * 20 + i);
      else if (k === 'dandelion') A.dandelionSeed(ctx, X(x), Y(z), 16, Math.sin(S.ts + i) * 0.2);
      else if (k === 'acorn') { if (z > 0.3 && j > 0) A.birdSide(ctx, X(x), Y(z) - 6, 26, { kind: 'jay', pose: 'fly', phase: S.ts * 12 + i, facing: b[0] >= a[0] ? 1 : -1 }); A.acorn(ctx, X(x), Y(z), 9); }
      else { if (z > 0.3 && j > 0) A.birdSide(ctx, X(x), Y(z) - 6, 24, { kind: 'thrush', pose: 'fly', phase: S.ts * 12 + i, facing: b[0] >= a[0] ? 1 : -1 }); A.cherry(ctx, X(x), Y(z), 9); }
    });
    // the tape along the ground
    ctx.strokeStyle = '#F2E6A0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), gy + 30); ctx.lineTo(X(xmax), gy + 30); ctx.stroke();
    const stepM = xmax > 400 ? 100 : xmax > 150 ? 50 : xmax > 60 ? 20 : xmax > 25 ? 10 : 5;
    ctx.font = mono(9.5); ctx.fillStyle = '#F2E6A0'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let m = 0; m <= xmax; m += stepM) { ctx.fillRect(X(m) - 0.5, gy + 26, 1, 8); ctx.fillText(m + ' m', X(m), gy + 36); }
    ctx.strokeStyle = '#FF8A5C'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(D.median), gy - 10); ctx.lineTo(X(D.median), gy + 26); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#FF8A5C'; ctx.textBaseline = 'bottom'; ctx.fillText('half land inside ' + f1(D.median) + ' m', X(D.median), gy - 12);
    ctx.restore();
    const K = kit(), sl = K.cardSlot(g, S, 'The seed', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (sl) {
      const h = 170; K.card(ctx, sl.x, sl.y, sl.w, h);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(SEEDS[k].name[0].toUpperCase() + SEEDS[k].name.slice(1) + ', life size ×3', sl.x + 10, sl.y + 8);
      const cx = sl.x + 70, cy = sl.y + 90;
      if (k === 'maple') A.samara(ctx, cx - 40, cy, 30 + p.wing * 18, -0.2);
      if (k === 'dandelion') A.dandelionSeed(ctx, cx, cy, 110, 0);
      if (k === 'acorn') A.acorn(ctx, cx, cy, 70);
      if (k === 'cherry') A.cherry(ctx, cx, cy, 70);
      const rows = SEEDS[k].carrier === 'wind' ? [['mass', (SEEDS[k].m * 1e6 < 1000 ? (SEEDS[k].m * 1e6).toFixed(SEEDS[k].m < 1e-5 ? 1 : 0) + ' mg' : '')], ['falls at', f2(D.v) + ' m/s'], k === 'maple' ? ['wing', f1(p.wing) + ' cm'] : ['pappus', '14 mm across']] : [['mass', (SEEDS[k].m * 1e3).toFixed(1) + ' g'], ['carried by', SEEDS[k].carrier], k === 'acorn' ? ['caches', 'up to ~' + p.jay + ' m'] : ['gut passage', p.gut + ' min']];
      rows.forEach((r, i) => { const yy = sl.y + 40 + i * 34; ctx.font = mono(9.5); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(r[0], sl.x + sl.w * 0.52, yy); ctx.font = mono(11, 700); ctx.fillStyle = LIGHT; ctx.fillText(r[1], sl.x + sl.w * 0.52, yy + 13); });
    }
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     8. PLOTS, READOUTS, EQUATION
     ============================================================ */
  function keyBand(g, items, note) { const K = kit(); return K ? K.plotKey(g, items, note) : { t: 14, draw() {} }; }
  const GCOL = ['#8FA3C0', '#C9D4EA', '#E8E8E8', '#FFD38A'];
  const plot1 = {
    title: S => ({ courtship: 'New nests per male, this season', care: 'Each chick’s mass, day by day', flower: 'Pollen falling from 1 m in still air', pollinate: 'Ovules fertilised as the bees work', seeds: 'Where the seeds land' })[S.p.setup],
    draw(S, g) {
      const p = S.p, ctx = g.ctx;
      if (p.setup === 'courtship') {
        const Kk = keyBand(g, [{ c: '#FFFFFF', dot: true, label: 'one male' }, { c: '#FFD38A', box: true, label: 'group mean' }, { c: '#8FA3C0', label: 'average of 120 seasons', dash: [3, 3] }]);
        const P = g.Plot({ xmin: 0, xmax: 4, ymin: 0, ymax: Math.max(5, ...S.C.males.map(m => m.nests.length)) + 0.5, xlabel: 'treatment', ylabel: 'nests per male', xticks: [0.5, 1.5, 2.5, 3.5], xfmt: v => ['shortened', 'glued', 'untouched', 'lengthened'][Math.floor(v)], pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const d = Math.min(WB.days - 1, Math.floor(S.day)), E = courtExpected(p, 120);
        P.clip(() => {
          GROUPS.forEach((G_, i) => {
            const ms = S.C.males.filter(m => m.g === G_.g), counts = ms.map(m => m.nests.filter(n => n <= d).length), mean = counts.reduce((a, b) => a + b, 0) / ms.length;
            P.bar(i + 0.5, mean, 0.3, 0, g.alpha('#FFD38A', 0.55));
            counts.forEach((c, j) => P.dot(i + 0.3 + j * 0.05, c + (j % 2) * 0.06, 3, ms[j].died >= 0 && ms[j].died <= d ? '#E05A4A' : '#FFFFFF'));
            P.line([[i + 0.15, E[i].nests], [i + 0.85, E[i].nests]], '#8FA3C0', 2, [3, 3]);
          });
        });
        return;
      }
      if (p.setup === 'care') {
        const Kk = keyBand(g, [{ c: '#FFB27A', label: 'a chick' }, { c: '#E05A4A', label: 'starved', dash: [3, 3] }, { c: '#8FA3C0', label: '17.8 g: half the best survival', dash: [4, 3] }]);
        const P = g.Plot({ xmin: 0, xmax: TIT.days, ymin: 0, ymax: 22, xlabel: 'days since hatching', ylabel: 'mass (g)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const d = Math.min(TIT.days, Math.floor(S.day));
        P.clip(() => {
          P.hline(17.8, '#8FA3C0', [4, 3]);
          S.B.chicks.forEach((c, i) => { const pts = []; c.hist.forEach((m, k) => { if (k <= d && m != null) pts.push([k, m]); }); const dead = !c.alive && c.hist.indexOf(null) <= d && c.hist.indexOf(null) >= 0; P.line(pts, dead ? '#E05A4A' : RX_mix('#FFB27A', '#FFE8C8', i / 16), dead ? 1.4 : 1.8, dead ? [3, 3] : null); });
          P.vline(d, 'rgba(255,255,255,.5)', [2, 3]);
        });
        return;
      }
      if (p.setup === 'flower') {
        const keys = Object.keys(POLLEN), cols = { lily: '#E89A3A', sun: '#F0C030', grass: '#E8D8A0', pine: '#C8A060', rag: '#9AD07A' };
        const Kk = keyBand(g, keys.map(k => ({ c: cols[k], label: POLLEN[k].name.split(' ')[0], w: k === p.ptype ? 3 : 1.5 })));
        const tmax = 1 / settle('rag') * 1.05;
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: 1, xlabel: 'time (s)', ylabel: 'height (m)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => keys.forEach(k => P.line([[0, 1], [1 / settle(k), 0]], cols[k], k === p.ptype ? 3 : 1.4)));
        return;
      }
      if (p.setup === 'pollinate') {
        const Kk = keyBand(g, [{ c: '#F2C830', label: 'buttercups' }, { c: '#B87AE0', label: 'cranesbills' }]);
        const tm = Math.max(10, S.M.t / 60);
        const P = g.Plot({ xmin: 0, xmax: tm, ymin: 0, ymax: 100, xlabel: 'minutes', ylabel: '% of ovules', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(S.hist.map(h => [h[0], h[1] * 100]), '#F2C830', 2.4); P.line(S.hist.map(h => [h[0], h[2] * 100]), '#B87AE0', 2.4); });
        return;
      }
      const D = S.D, xmax = Math.max(10, D.p95 * 1.3), nb = 30, bins = new Array(nb).fill(0);
      D.land.forEach(x => { const b = Math.floor(Math.abs(x) / xmax * nb); if (b < nb) bins[b]++; });
      const Kk = keyBand(g, [{ c: '#FFD38A', box: true, label: 'seeds per band' }, { c: '#FF8A5C', label: 'median', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: xmax, ymin: 0, ymax: Math.max(...bins) * 1.1 + 1, xlabel: 'distance from the parent (m)', ylabel: 'seeds', pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => { bins.forEach((c, i) => P.bar((i + 0.5) * xmax / nb, c, xmax / nb / 2, 0, 'rgba(255,211,138,.75)')); P.vline(D.median, '#FF8A5C', [4, 3]); });
    },
    hover(S, x) {
      const p = S.p;
      if (p.setup === 'care') { const d = clamp(Math.round(x), 0, TIT.days), ms = S.B.chicks.map(c => c.hist[d]).filter(m => m != null); return [{ label: 'day', value: String(d) }, { label: 'alive', value: String(ms.length) }, { label: 'mean mass', value: f1(ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)) + ' g' }]; }
      if (p.setup === 'flower') return Object.keys(POLLEN).map(k => ({ label: POLLEN[k].name.split(' ')[0], value: f1(Math.max(0, 1 - settle(k) * x) * 100) + ' cm up' }));
      if (p.setup === 'seeds') { const n = S.D.land.filter(v => Math.abs(v) <= x).length; return [{ label: 'within', value: f1(x) + ' m' }, { label: 'seeds', value: Math.round(n / S.D.land.length * 100) + ' %' }]; }
      if (p.setup === 'pollinate') { const h = S.hist.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, S.hist[0]); return [{ label: 'minute', value: f1(h[0]) }, { label: 'buttercups', value: Math.round(h[1] * 100) + ' %' }, { label: 'cranesbills', value: Math.round(h[2] * 100) + ' %' }]; }
      const i = clamp(Math.floor(x), 0, 3), E = courtExpected(p, 120)[i]; return [{ label: GROUPS[i].name, value: f2(E.nests) + ' nests' }, { label: 'alive at the end', value: Math.round(E.alive * 100) + ' %' }];
    }
  };
  const RX_mix = (a, b, t) => window.RX ? window.RX.mix(a, b, t) : a;
  const plot2 = {
    title: S => ({ courtship: 'A male’s two-season success against tail length, at each level of danger', care: 'Young alive a year later, against the number of eggs (Lack’s curve)', flower: 'How far the wind carries each pollen, from ' + S.p.relH.toFixed(1) + ' m', pollinate: 'Ovules fertilised in 30 minutes, against the number of bees', seeds: 'Median distance against wind speed' })[S.p.setup],
    draw(S, g) {
      const p = S.p;
      if (p.setup === 'courtship') {
        const risks = [0, 1, 3, 8], cols = ['#4FD18B', '#FFD38A', '#FF8A5C', '#E05A4A'];
        const Kk = keyBand(g, risks.map((r, i) => ({ c: cols[i], label: 'kites ×' + r, w: r === p.risk ? 3 : 1.5 })).concat([{ c: '#FFFFFF', dot: true, label: 'now' }]));
        const curves = risks.map(r => { const pts = []; for (let L_ = 5; L_ <= 100; L_ += 2.5) pts.push([L_, tailFitness(Object.assign({}, p, { risk: r }), L_).total]); return pts; });
        const now = []; for (let L_ = 5; L_ <= 100; L_ += 2.5) now.push([L_, tailFitness(p, L_).total]);
        const hi = Math.max(2, ...curves.flat().map(q => q[1]), ...now.map(q => q[1])) * 1.05;
        const P = g.Plot({ xmin: 5, xmax: 100, ymin: 0, ymax: hi, xlabel: 'tail length (cm)', ylabel: 'nests, this year + next', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { curves.forEach((c, i) => P.line(c, cols[i], 1.4)); P.line(now, '#FFFFFF', 2.6); const best = now.reduce((b, q) => q[1] > b[1] ? q : b, now[0]); P.dot(best[0], best[1], 5, '#FFFFFF', 'rgba(0,0,0,.5)'); P.tag(best[0], best[1], 'best ' + best[0].toFixed(0) + ' cm', '#FFFFFF', 'left', -10); P.vline(50, 'rgba(255,255,255,.35)', [2, 3]); });
        return;
      }
      if (p.setup === 'care') {
        const Kk = keyBand(g, [{ c: '#FFB27A', label: 'this spring' }, { c: '#8FA3C0', label: 'a poor spring (× 0.4)', dash: [4, 3] }, { c: '#4FD18B', label: 'a rich spring (× 2)', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'this clutch' }]);
        const poor = lackCurve(0.4, p.parents), rich = lackCurve(2, p.parents), hi = Math.max(3.2, ...S.lack.map(q => q[1]), ...rich.map(q => q[1])) * 1.08;
        const P = g.Plot({ xmin: 0.5, xmax: 16.5, ymin: 0, ymax: hi, xlabel: 'eggs in the clutch', ylabel: 'young alive next year', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(poor, '#8FA3C0', 1.4, [4, 3]); P.line(rich, '#4FD18B', 1.4, [4, 3]); P.line(S.lack, '#FFB27A', 2.6); P.dot(p.clutch, S.B.recruits, 5.5, '#FFFFFF', 'rgba(0,0,0,.5)'); const b = S.lack.reduce((x, q) => q[1] > x[1] ? q : x, S.lack[0]); P.vline(b[0], 'rgba(255,178,122,.5)', [2, 3]); P.tag(b[0], b[1], 'most: ' + b[0] + ' eggs', '#FFB27A', 'left', -10); });
        return;
      }
      if (p.setup === 'flower') {
        const keys = Object.keys(POLLEN), cols = { lily: '#E89A3A', sun: '#F0C030', grass: '#E8D8A0', pine: '#C8A060', rag: '#9AD07A' };
        const Kk = keyBand(g, keys.map(k => ({ c: cols[k], label: POLLEN[k].name.split(' ')[0], w: k === p.ptype ? 3 : 1.5 })).concat([{ c: '#FFFFFF', dot: true, label: 'now' }]));
        const hi = carried('rag', p.relH, 10) * 1.05;
        const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: hi, xlabel: 'wind (m/s)', ylabel: 'distance (m)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { keys.forEach(k => P.line([[0, 0], [10, carried(k, p.relH, 10)]], cols[k], k === p.ptype ? 3 : 1.4)); P.dot(p.wind, carried(p.ptype, p.relH, p.wind), 5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'pollinate') {
        const Kk = keyBand(g, [{ c: '#4FD18B', label: 'bees faithful (0.9)' }, { c: '#E8907F', label: 'bees fickle (0.2)' }, { c: '#FFFFFF', dot: true, label: 'this meadow now' }]);
        const P = g.Plot({ xmin: 0, xmax: 31, ymin: 0, ymax: 100, xlabel: 'bees', ylabel: '% fertilised, 30 min', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => {
          [[0.9, '#4FD18B'], [0.2, '#E8907F']].forEach(([c, col]) => { const pts = S.landQ.filter(q => q.c === c && q.done).map(q => [q.b, q.A * 100]); if (pts.length > 1) P.line(pts, col, 2.2); pts.forEach(q => P.dot(q[0], q[1], 3.5, col)); });
          if (S.M.t >= 1) P.dot(S.M.bees.length, (seedSet(S.M, 'A') * (1 - p.fracB) + seedSet(S.M, 'B') * p.fracB) * 100, 5, '#FFFFFF', 'rgba(0,0,0,.5)');
        });
        P.tag(1, 95, S.landQ.filter(q => q.done).length + ' of ' + S.landQ.length + ' meadows run alongside', '#9FB0CC', 'left', 0);
        return;
      }
      const Kk = keyBand(g, [{ c: '#D8B070', label: 'samara: H·U/v' }, { c: '#F0F0E8', label: 'dandelion: H·U/v' }, { c: '#FFFFFF', dot: true, label: 'this release (simulated median)' }]);
      const sam = [], dan = []; for (let u = 0; u <= 15; u += 0.5) { sam.push([u, p.sH * windAt(u, p.sH * 0.6) / terminal('maple', p.wing)]); dan.push([u, p.sH * windAt(u, p.sH * 0.6) / terminal('dandelion', 0)]); }
      const hi = Math.max(10, S.D.median * 1.3, ...sam.map(q => q[1]).slice(0, 25));
      const P = g.Plot({ xmin: 0, xmax: 15, ymin: 0, ymax: hi, xlabel: 'wind at 10 m (m/s)', ylabel: 'median distance (m)', pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => { P.line(sam, '#D8B070', 2.2); P.line(dan, '#F0F0E8', 2.2); P.dot(p.swind, S.D.median, 5.5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
    },
    hover(S, x) {
      const p = S.p;
      if (p.setup === 'courtship') { const f = tailFitness(p, clamp(x, 5, 100)); return [{ label: 'tail', value: Math.round(x) + ' cm' }, { label: 'nests this year', value: f2(f.nests) }, { label: 'survives the season', value: Math.round(f.survive * 100) + ' %' }]; }
      if (p.setup === 'care') { const n = clamp(Math.round(x), 1, 16); return [{ label: 'eggs', value: String(n) }, { label: 'young alive in a year', value: f2(S.lack[n - 1][1]) }]; }
      if (p.setup === 'flower') return [{ label: 'wind', value: f1(x) + ' m/s' }, { label: POLLEN[p.ptype].name, value: Math.round(carried(p.ptype, p.relH, clamp(x, 0, 10))) + ' m' }];
      return [{ label: 'x', value: f1(x) }];
    }
  };

  function readouts(S) {
    const p = S.p;
    if (p.setup === 'courtship') {
      const E = courtExpected(p, 120), d = Math.min(WB.days - 1, Math.floor(S.day)), row = S.C.daily[d];
      return [
        { label: 'Day', value: String(d + 1), unit: 'of 45' },
        { label: 'Shortened (' + p.shortTo + ' cm): nests/male', value: f2(row[0][0]), unit: '' },
        { label: 'Controls (50 cm)', value: f2((row[1][0] + row[2][0]) / 2), unit: 'nests/male' },
        { label: 'Lengthened (' + (50 + p.add) + ' cm)', value: f2(row[3][0]), unit: 'nests/male', flag: 'accent' },
        { label: 'Lengthened ÷ shortened, 120 seasons', value: f1(E[3].nests / Math.max(0.01, E[0].nests)), unit: '×' },
        { label: 'Lengthened males alive at the end', value: Math.round(E[3].alive * 100), unit: '%' },
        { label: 'Daily risk, lengthened: 0.004·risk·(L/50)³', value: (hazard(p, 50 + p.add) * 1000).toFixed(1), unit: '‰ a day' },
        { label: 'Best tail, two seasons', value: (() => { let b = [0, -1]; for (let L_ = 5; L_ <= 100; L_ += 2.5) { const v = tailFitness(p, L_).total; if (v > b[1]) b = [L_, v]; } return String(b[0]); })(), unit: 'cm' }
      ];
    }
    if (p.setup === 'care') {
      const B = S.B, d = Math.min(TIT.days, Math.floor(S.day)), al = B.chicks.filter(c => c.hist[d] != null);
      return [
        { label: 'Eggs', value: String(p.clutch), unit: '' },
        { label: 'Day', value: String(d), unit: 'of 18' },
        { label: 'Chicks alive', value: String(al.length), unit: '' },
        { label: 'Caterpillars a day D = 430f/(f+0.5)', value: String(Math.round(B.D)), unit: '' },
        { label: 'Mean fledging mass', value: f1(B.mean), unit: 'g', flag: B.mean < 17.8 ? 'warn' : 'ok' },
        { label: 'Fledged', value: String(B.fledged), unit: 'of ' + p.clutch },
        { label: 'Young alive in a year', value: f2(B.recruits), unit: '', flag: 'accent' },
        { label: 'The most productive clutch', value: String(bestClutch(p.food, p.parents)), unit: 'eggs' }
      ];
    }
    if (p.setup === 'flower') {
      const k = p.ptype, v = settle(k), parts = PARTS[p.flower];
      return [
        { label: 'Grain diameter', value: String(POLLEN[k].d), unit: 'µm' },
        { label: 'Fall speed (ρ−ρa)gd²/18μ', value: (v * 100).toFixed(2), unit: 'cm/s', flag: 'accent' },
        { label: 'Reynolds number', value: reynolds(k).toExponential(1), unit: '', hint: 'below 1: Stokes holds' },
        { label: 'Time to fall ' + f1(p.relH) + ' m', value: f1(p.relH / v), unit: 's' },
        { label: 'Carried in ' + p.wind + ' m/s, H·U/v', value: String(Math.round(carried(k, p.relH, p.wind))), unit: 'm' },
        ...parts.map(q => ({ label: q[0][0].toUpperCase() + q[0].slice(1), value: String(q[1]), unit: q[2] }))
      ];
    }
    if (p.setup === 'pollinate') {
      const M = S.M;
      return [
        { label: 'Minutes', value: f1(M.t / 60), unit: '' },
        { label: 'Bees', value: p.mode === 'wind' ? '0' : String(M.bees.length), unit: p.mode === 'wind' ? '(wind only)' : '' },
        { label: 'Visits', value: String(M.visits), unit: '' },
        { label: 'Buttercup ovules fertilised', value: Math.round(seedSet(M, 'A') * 100), unit: '%', flag: 'accent' },
        { label: 'Cranesbill ovules fertilised', value: Math.round(seedSet(M, 'B') * 100), unit: '%', flag: 'accent' },
        { label: 'Pollen on the wrong species', value: Math.round(M.wasted / Math.max(1, M.wasted + M.deposited) * 100), unit: '%' },
        { label: 'Anthers still full', value: Math.round(M.fl.reduce((s, f) => s + f.anther, 0) / M.fl.length * 100), unit: '%' }
      ];
    }
    const D = S.D, k = p.stype;
    return [
      { label: 'Seed', value: SEEDS[k].name, unit: '' },
      { label: 'Fall speed √(2mg/ρCA)', value: SEEDS[k].carrier === 'wind' ? f2(D.v) : '—', unit: 'm/s' },
      { label: 'Released from', value: f1(p.sH), unit: 'm' },
      { label: 'Median distance', value: f1(D.median), unit: 'm', flag: 'accent' },
      { label: '1 in 20 beyond', value: f1(D.p95), unit: 'm' },
      { label: 'Mean distance', value: f1(D.mean), unit: 'm' },
      { label: 'Rule of thumb H·U/v', value: SEEDS[k].carrier === 'wind' ? f1(p.sH * windAt(p.swind, p.sH * 0.6) / D.v) : '—', unit: 'm' }
    ];
  }
  const { E } = L;
  function equation(S) {
    const p = S.p;
    if (p.setup === 'courtship') return E.v('P') + '(choose a male) ∝ ' + E.v('e') + E.sup('βL/50') + ' &nbsp; ' + E.v('h') + ' = 0.004 × ' + p.risk + ' × (' + (50 + p.add) + '/50)³ = ' + E.n((hazard(p, 50 + p.add) * 1000).toFixed(1) + '‰') + ' a day → survives 45 days: <b>' + Math.round(Math.pow(1 - hazard(p, 50 + p.add), 45) * 100) + ' %</b>';
    if (p.setup === 'care') return E.v('R') + '(n) = Σ ' + E.v('p') + '(' + E.v('m') + E.sub('i') + '), ' + E.v('p') + '(' + E.v('m') + ') = ' + E.frac('0.32', '1 + e' + E.sup('−(m − 17.8)/0.8')) + ' &nbsp; ' + p.clutch + ' eggs → <b>' + f2(S.B.recruits) + '</b> young in a year';
    if (p.setup === 'flower') { const k = p.ptype; return E.v('v') + ' = ' + E.frac('(ρ' + E.sub('p') + ' − ρ' + E.sub('a') + ') ' + E.v('g') + E.v('d') + '²', '18μ') + ' = ' + E.frac('(' + POLLEN[k].rho + ' − 1.2) × 9.81 × (' + POLLEN[k].d + '×10⁻⁶)²', '18 × 1.81×10⁻⁵') + ' = <b>' + (settle(k) * 100).toFixed(2) + ' cm/s</b>'; }
    if (p.setup === 'pollinate') return 'ovules = 30(1 − ' + E.v('e') + E.sup('−0.15g/30') + ') &nbsp; ' + E.v('g') + ' = grains from another plant of the same species · each visit leaves ' + Math.round(p.carry * 100) + ' % of every packet';
    const D = S.D, k = p.stype;
    return SEEDS[k].carrier === 'wind' ? E.v('x') + ' ≈ ' + E.frac(E.v('H') + E.v('U'), E.v('v')) + ' = ' + E.frac(f1(p.sH) + ' × ' + f1(windAt(p.swind, p.sH * 0.6)), f2(D.v)) + ' = ' + E.n(f1(p.sH * windAt(p.swind, p.sH * 0.6) / D.v) + ' m') + ' &nbsp; simulated median <b>' + f1(D.median) + ' m</b>' : 'carried by a ' + SEEDS[k].carrier + ': median <b>' + f1(D.median) + ' m</b>, 1 in 20 beyond ' + f1(D.p95) + ' m';
  }
  const EQ_NOTE = S => ({
    courtship: '<b>A long tail is a cost as well as a lure.</b> Females prefer the longest tail they see, so lengthened males win more nests — but a kite catches a long-tailed male more easily. Raise the danger and the best tail shortens. Andersson’s experiment showed the preference; the cost is the other half of the balance.',
    care: '<b>More eggs do not always mean more young.</b> Parents can bring only so many caterpillars; the more mouths, the less each chick gets and the lighter it leaves the nest — and light fledglings rarely survive the winter. The best clutch moves with the food supply, which is why great tits lay fewer eggs in poor springs.',
    flower: '<b>A flower is built for the way its pollen travels.</b> Insect flowers spend on petals, scent and nectar and make big, sticky grains that ride on a bee; wind flowers make no petals, hang their anthers in the air and make small, smooth, light grains — in vast numbers, because almost all are lost.',
    pollinate: '<b>Pollen on the wrong flower is wasted.</b> A bee that switches species carries buttercup pollen to cranesbills, where it can fertilise nothing — that is why flower constancy matters, and why plants self-incompatible to their own pollen need visitors from other plants.',
    seeds: '<b>A seed has no legs; its shape is its travel plan.</b> A wing or a parachute slows the fall so the wind can carry it; a fruit pays an animal to carry it. Most seeds still land near the parent — the few that go far are what spreads a species.'
  })[S.p.setup];

  /* ============================================================
     9. REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6e-generation',
    grade: 6, unit: '6E', topics: ['E3'],
    subject: 'biology',
    name: 'Making the Next Generation',
    chapter: 'Regional Climate, Organisms and Heredity',
    exams: ['NGSS MS-LS1-4', 'NGSS Science and Engineering Practice 7: engaging in argument from evidence', 'CAST'],
    weight: 'Reproduction',
    is3D: true,
    autoplay: true,
    bloom: 0.05,
    stageHint: 'Drag to look round the flower · every bird, bee and seed moves as the model computes',
    lede: 'Five experiments on how animals and plants raise the next generation. Repeat <b>Andersson’s widowbird experiment</b>: cut or lengthen 36 males’ tails and count the nests females build. Lay more or fewer eggs in a <b>great tit</b>’s box and weigh every chick until it fledges. ' +
      'Take a <b>lily</b> and a grass flower apart and see why their pollen differs; let <b>bees</b> work a meadow, one agent each; and throw <b>samaras, dandelion seeds, acorns and cherries</b> to the wind, to jays and to thrushes.',

    params: preset({}),
    presets: [
      { name: 'Andersson’s experiment', params: preset({}) },
      { name: 'Many kites: long tails cost lives', params: preset({ risk: 6 }) },
      { name: 'Females who look at only one male', params: preset({ choosy: 1 }) },
      { name: 'A great tit in an ordinary spring', params: preset({ setup: 'care', clutch: 9 }) },
      { name: 'Fourteen eggs: more eggs, fewer young', params: preset({ setup: 'care', clutch: 14 }) },
      { name: 'A poor spring', params: preset({ setup: 'care', clutch: 9, food: 0.4 }) },
      { name: 'One parent left', params: preset({ setup: 'care', clutch: 9, parents: 1 }) },
      { name: 'A lily, whole', params: preset({ setup: 'flower' }) },
      { name: 'The lily’s ovary cut open', params: preset({ setup: 'flower', dissect: 3 }) },
      { name: 'Grass: pollen on the wind', params: preset({ setup: 'flower', flower: 'grass', ptype: 'grass', wind: 6 }) },
      { name: 'Pine pollen and its air sacs', params: preset({ setup: 'flower', flower: 'grass', ptype: 'pine', relH: 15, wind: 4 }) },
      { name: 'Eight faithful bees', params: preset({ setup: 'pollinate' }) },
      { name: 'Fickle bees', params: preset({ setup: 'pollinate', constancy: 0.1 }) },
      { name: 'One bee', params: preset({ setup: 'pollinate', bees: 1 }) },
      { name: 'No bees, only wind', params: preset({ setup: 'pollinate', mode: 'wind' }) },
      { name: 'Sycamore samaras in a breeze', params: preset({ setup: 'seeds' }) },
      { name: 'Dandelion clocks', params: preset({ setup: 'seeds', stype: 'dandelion', sH: 0.4, swind: 6 }) },
      { name: 'Acorns and jays', params: preset({ setup: 'seeds', stype: 'acorn', sH: 10 }) },
      { name: 'Cherries and thrushes', params: preset({ setup: 'seeds', stype: 'cherry', sH: 6 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The tails', when: is('courtship'), items: [
        { key: 'shortTo', label: 'Shortened to', min: 5, max: 45, step: 1, unit: 'cm', restructure: R_ },
        { key: 'add', label: 'Lengthened by', min: 0, max: 40, step: 1, unit: 'cm', restructure: R_ },
        { key: 'display', label: 'Display flights', min: 2, max: 30, step: 1, unit: 'an hour', restructure: R_ } ] },
      { group: 'The grassland', when: is('courtship'), items: [
        { key: 'females', label: 'Females nesting', min: 9, max: 90, step: 1, unit: '', restructure: R_ },
        { key: 'choosy', label: 'Males each female visits', min: 1, max: 10, step: 1, unit: '', restructure: R_ },
        { key: 'risk', label: 'Kites (predation risk)', min: 0, max: 8, step: 0.5, unit: '×', restructure: R_ },
        { key: 'seed', label: 'Another season', min: 1, max: 9, step: 1, restructure: R_ },
        { key: 'pace', type: 'select', label: 'Days pass', restructure: false, options: [{ value: 1, label: 'a day a second' }, { value: 3, label: '3 a second' }, { value: 10, label: '10 a second' }] } ] },
      { group: 'The nest', when: is('care'), items: [
        { key: 'clutch', label: 'Eggs laid', min: 1, max: 16, step: 1, unit: '', restructure: R_ },
        { key: 'food', label: 'Caterpillar supply', min: 0.2, max: 2.5, step: 0.05, unit: '× ordinary', restructure: R_ },
        { key: 'parents', type: 'select', label: 'Feeding', restructure: R_, options: [{ value: 2, label: 'both parents' }, { value: 1, label: 'one parent' }] },
        { key: 'cpace', type: 'select', label: 'Days pass', restructure: false, options: [{ value: 0.5, label: 'a day in 2 s' }, { value: 1, label: 'a day a second' }, { value: 4, label: '4 a second' }] } ] },
      { group: 'The flower', when: is('flower'), items: [
        { key: 'flower', type: 'select', label: 'Flower', restructure: R_, options: [{ value: 'lily', label: 'lily (insect)' }, { value: 'grass', label: 'grass (wind)' }] },
        { key: 'dissect', type: 'select', label: 'Dissect', restructure: R_, when: S => S.p.flower === 'lily', options: [{ value: 0, label: 'whole' }, { value: 1, label: 'fold back the tepals' }, { value: 2, label: 'lay out the stamens' }, { value: 3, label: 'cut the ovary' }] },
        { key: 'ptype', type: 'select', label: 'Pollen to examine', restructure: R_, options: Object.keys(POLLEN).map(k => ({ value: k, label: POLLEN[k].name })) },
        { key: 'wind', label: 'Wind', min: 0, max: 10, step: 0.5, unit: 'm/s', restructure: R_ },
        { key: 'relH', label: 'Released from', min: 0.2, max: 30, step: 0.1, unit: 'm', restructure: R_ } ] },
      { group: 'The meadow', when: is('pollinate'), items: [
        { key: 'mode', type: 'select', label: 'Pollen carried by', restructure: R_, options: [{ value: 'bees', label: 'honeybees' }, { value: 'wind', label: 'the wind alone' }] },
        { key: 'bees', label: 'Bees', min: 1, max: 30, step: 1, unit: '', restructure: R_, when: S => S.p.mode === 'bees' },
        { key: 'constancy', label: 'Flower constancy', min: 0, max: 1, step: 0.05, unit: '', restructure: R_, when: S => S.p.mode === 'bees' },
        { key: 'carry', label: 'Pollen left at each visit', min: 0.05, max: 0.6, step: 0.05, unit: '', restructure: R_, when: S => S.p.mode === 'bees' },
        { key: 'pesticide', type: 'toggle', label: 'Pesticide sprayed nearby', restructure: R_, when: S => S.p.mode === 'bees' },
        { key: 'fracB', label: 'Share of cranesbills', min: 0.05, max: 0.6, step: 0.05, unit: '', restructure: R_ },
        { key: 'nFlowers', label: 'Flowers', min: 20, max: 120, step: 5, unit: '', restructure: R_ },
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 10, label: '10 s a second' }, { value: 60, label: 'a minute a second' }, { value: 300, label: '5 minutes a second' }] } ] },
      { group: 'The seeds', when: is('seeds'), items: [
        { key: 'stype', type: 'select', label: 'Seed', restructure: R_, options: Object.keys(SEEDS).map(k => ({ value: k, label: SEEDS[k].name })) },
        { key: 'swind', label: 'Wind at 10 m', min: 0, max: 15, step: 0.5, unit: 'm/s', restructure: R_, when: S => SEEDS[S.p.stype].carrier === 'wind' },
        { key: 'turb', label: 'Gustiness', min: 0, max: 2, step: 0.1, unit: '×', restructure: R_, when: S => SEEDS[S.p.stype].carrier === 'wind' },
        { key: 'sH', label: 'Released from', min: 0.2, max: 30, step: 0.1, unit: 'm', restructure: R_ },
        { key: 'wing', label: 'Samara wing length', min: 1.5, max: 6, step: 0.1, unit: 'cm', restructure: R_, when: S => S.p.stype === 'maple' },
        { key: 'jay', label: 'How far jays carry', min: 20, max: 1000, step: 10, unit: 'm', restructure: R_, when: S => S.p.stype === 'acorn' },
        { key: 'gut', label: 'Time in the thrush’s gut', min: 5, max: 90, step: 1, unit: 'min', restructure: R_, when: S => S.p.stype === 'cherry' },
        { key: 'nSeeds', label: 'Seeds released', min: 50, max: 600, step: 10, unit: '', restructure: R_ } ] }
    ],

    setup, step, drawStage, onPointer,
    plots: [plot1, plot2],
    readouts,
    equation,
    eqNote: EQ_NOTE,
    problems: [
      { source: 'CAST pattern · a model of mate choice', params: preset({}),
        q: 'A female widowbird picks between two males with weights e^(2L/50). One has a 75 cm tail, the other 50 cm. In what share of such choices does she pick the long-tailed male?',
        predict: { label: 'Picks the long tail', unit: '%', tol: 0.02 },
        measure: S => attract(S.p, 75) / (attract(S.p, 75) + attract(S.p, 50)) * 100,
        working: 'e³ ÷ (e³ + e²) = e ÷ (e + 1) = 2.718 ÷ 3.718 = <b>73 %</b>. Not every time — she sometimes picks the other — but over a season that preference is what doubles the lengthened males’ nests.' },
      { source: 'CAST pattern · the cost of a trait', params: preset({}),
        q: 'A lengthened male (75 cm) is taken by a kite with a chance of 1.35 % each day. What is his chance of surviving the 45-day season?',
        predict: { label: 'Survives', unit: '%', tol: 0.03 },
        measure: S => Math.pow(1 - hazard(S.p, 50 + S.p.add), WB.days) * 100,
        working: '(1 − 0.0135)⁴⁵ = 0.9865⁴⁵ = <b>54 %</b>, against 84 % for a 50 cm male. The extra nests are bought with nearly twice the risk of dying.' },
      { source: 'CAST pattern · parental care', params: preset({ setup: 'care' }),
        q: 'In an ordinary spring (supply f = 1) a pair of great tits can bring D = 430 f ÷ (f + 0.5) caterpillars a day. How many is that?',
        predict: { label: 'Caterpillars a day', unit: '', tol: 0.01 },
        measure: S => S.B.D,
        working: '430 × 1 ÷ 1.5 = <b>287</b> a day — about 19 an hour through a 15-hour day. Nine grown chicks need about 540: the parents cannot feed more than they bring, so each extra chick takes food from the others.' },
      { source: 'CAST pattern · Lack’s clutch', params: preset({ setup: 'care', clutch: 9 }),
        q: 'Run the clutch from 1 to 16 eggs in an ordinary spring. Which clutch raises the most young that live a year?',
        predict: { label: 'Best clutch', unit: 'eggs', tol: 0.01 },
        measure: S => bestClutch(S.p.food, S.p.parents),
        working: 'The curve rises, peaks and falls: <b>9 eggs</b> (2.53 young). With 14 eggs all the chicks still fledge but at 16–17 g, too light to survive the winter: about 0.7 young. Great tits at Wytham lay 8–9.' },
      { source: 'CAST pattern · pollen and wind', params: preset({ setup: 'flower', flower: 'grass', ptype: 'grass', wind: 5, relH: 1 }),
        q: 'A grass pollen grain is 35 µm across and as dense as water. Stokes: v = (ρ − 1.2) g d² ÷ (18 × 1.81 × 10⁻⁵). How fast does it fall?',
        predict: { label: 'Fall speed', unit: 'cm/s', tol: 0.02 },
        measure: S => settle(S.p.ptype) * 100,
        working: '998.8 × 9.81 × (35 × 10⁻⁶)² ÷ (3.26 × 10⁻⁴) = 0.0368 m/s = <b>3.7 cm/s</b>. From 1 m in a 5 m/s wind it travels 1 × 5 ÷ 0.0368 ≈ 136 m; a sticky lily grain falls 16 cm/s and goes only 31 m.' },
      { source: 'CAST pattern · seeds in the wind', params: preset({ setup: 'seeds' }),
        q: 'A sycamore samara falls at 0.96 m/s. Released 12 m up where the wind averages 5.6 m/s, about how far does it go?',
        predict: { label: 'Distance', unit: 'm', tol: 0.03 },
        measure: S => S.p.sH * windAt(S.p.swind, S.p.sH * 0.6) / S.D.v,
        working: 'Time to fall: 12 ÷ 0.96 = 12.5 s; in that time the wind carries it 12.5 × 5.6 = <b>70 m</b>. The simulated median is a little less, because the wind is slower near the ground.' }
    ],

    walkthrough: [
      { title: '1 · Lengthen a tail', ask: 'Andersson cut 25 cm from some males’ tails and glued it to others’. Which males got the most nests?', reveal: 'The lengthened ones — about 1.5 nests each against 1 for the controls and 0.4 for the shortened. And the controls, cut and glued back, did as well as the untouched: the cutting itself did nothing. <b>Females chose the tails.</b>', params: preset({}) },
      { title: '2 · Add kites', ask: 'If long tails win mates, why aren’t all tails a metre long?', reveal: 'Turn the kites up. Long-tailed males die faster; at high danger the lengthened males lose their lead and the best tail in the second plot moves back toward 50 cm. <b>A display is a balance of mates won and lives lost.</b>', params: preset({ risk: 6 }) },
      { title: '3 · Lay more eggs', ask: 'A great tit lays 14 eggs instead of 9. Does she raise more young?', reveal: 'No — fewer that live. All fourteen fledge, but at 16–17 g; light fledglings rarely survive their first winter. Nine eggs give 2.5 surviving young, fourteen about 0.7. <b>More eggs is not more young raised.</b>', params: preset({ setup: 'care', clutch: 14 }) },
      { title: '4 · Lose a parent', ask: 'With one parent feeding, what is the best clutch now?', reveal: 'About six. Parental care is the limit: the food a pair can bring decides how many chicks can be raised well.', params: preset({ setup: 'care', clutch: 9, parents: 1 }) },
      { title: '5 · Grass has no petals', ask: 'Why does a grass flower have no petals, while a lily has six big coloured tepals?', reveal: 'The lily pays insects (colour, scent, nectar) to carry its big sticky pollen. Grass uses the wind: its anthers hang out on long filaments, its stigmas are feathery brushes, its pollen small and dry — 3.7 cm/s against the lily’s 16. <b>Structure follows the way pollen travels.</b>', params: preset({ setup: 'flower', flower: 'grass', ptype: 'grass' }) },
      { title: '6 · Fickle bees', ask: 'The bees no longer stick to one kind of flower. What happens to the seed set?', reveal: 'It falls, most in the rarer cranesbills: bees carry buttercup pollen to them, where it fertilises nothing. Nearly half the pollen lands on the wrong species. <b>Constancy makes pollination work.</b>', params: preset({ setup: 'pollinate', constancy: 0.1 }) },
      { title: '7 · Seeds on the move', ask: 'A dandelion seed falls at 0.39 m/s, a samara at 1 m/s. Which goes further?', reveal: 'From the same height the dandelion goes about 2.5 times as far — but it starts at 40 cm, not 12 m. Released low, most dandelion seeds land within a metre or two; a gust takes a few kilometres. <b>Height, wind and fall speed together set the distance.</b>', params: preset({ setup: 'seeds', stype: 'dandelion', sH: 0.4, swind: 6 }) }
    ],

    quiz: [
      { q: 'In Andersson’s experiment, why were some tails cut and glued back on?', options: ['to show that cutting itself did not change the result', 'to make them longer', 'to hurt the birds', 'to attract kites'], answer: 0, why: 'A control: those males were handled exactly like the others but kept normal tails — and did as well as untouched males.' },
      { q: 'A great tit lays 14 eggs in an ordinary spring. Compared with 9 eggs, she will most likely raise', options: ['fewer young that survive the winter', 'more surviving young', 'exactly the same', 'no young at all'], answer: 0, why: 'The parents cannot bring more food; the chicks fledge lighter and fewer survive.' },
      { q: 'Which is a structure of a wind-pollinated flower?', options: ['feathery stigmas held out in the air', 'bright petals and nectar', 'large sticky pollen', 'a strong scent'], answer: 0, why: 'Wind flowers comb pollen from the air; they spend nothing on attracting animals.' },
      { q: 'A bee that visits buttercups and then a cranesbill', options: ['wastes the buttercup pollen it carries', 'fertilises the cranesbill', 'makes a hybrid', 'helps both equally'], answer: 0, why: 'Pollen fertilises only flowers of its own species.' },
      { q: 'Which change makes a samara travel further?', options: ['a longer wing, so it falls more slowly', 'a heavier seed', 'releasing it lower', 'calmer air'], answer: 0, why: 'x ≈ H·U/v: lower fall speed, higher release or more wind carry it further.' }
    ],

    notes: '<p><b>Courtship.</b> Displays — long tails, bright patches, songs, dances — raise an animal’s chance of mating. Andersson (1982) cut and lengthened the tails of long-tailed widowbirds in Kenya: lengthened males attracted the most females. Displays cost energy and draw predators, so their size is a balance.</p>' +
      '<p><b>Nests and care.</b> Parents that build nests, guard and feed their young raise more of them. But care is limited: a great tit pair can bring only so many caterpillars, and Lack (1947) argued birds lay the number of eggs that raises the most surviving young — fewer in poor years.</p>' +
      '<p><b>Flowers and pollen.</b> A flower’s sepals and petals protect and advertise; stamens (filament and anther) make pollen; the pistil (stigma, style, ovary) receives it, and its ovules become seeds. Insect-pollinated flowers offer colour, scent and nectar and make sticky pollen; wind-pollinated flowers make light pollen in vast amounts.</p>' +
      '<p><b>Pollination and seeds.</b> Pollen must reach a stigma of the same species. Seeds are dispersed by wind (wings, parachutes), by animals (eaten fruits, caches, hooks) and by water; most land near the parent, a few far away.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “More eggs always means more young raised.” Each extra chick shares the same food; past the best clutch, the brood fledges lighter and fewer survive. The same balance governs displays: showier is not always better when predators are watching.</div>'
  });

  L.models = L.models || {};
  L.models['g6e-generation'] = { WB, GROUPS, courtSeason, courtExpected, tailFitness, hazard, attract, TIT, brood, lackCurve, bestClutch, delivery, recruitP, POLLEN, settle, reynolds, carried, meadowStart, meadowStep, meadowRun, seedSet, fert, SEEDS, terminal, windAt, disperse };
})(window.InsightLab);
