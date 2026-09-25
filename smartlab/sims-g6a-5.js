/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-5  The Measurement Bench — Safety, SI Units and Honest Numbers
   (A5.1 Lab safety and working like a scientist; A5.3 SI units and
   measurement; A5.4 Organizing and graphing data)

   Five experiments on one bench, each rule of the laboratory computed
   rather than recited:
     hot     — a beaker heated on a hot plate looks exactly like a cold one.
               The skin under a touch is a heat-conduction problem (the
               contact temperature follows from the two materials'
               effusivities, then heat soaks in); the burn is Moritz and
               Henriques's measured threshold. Gloves, tongs, glass or steel,
               water or empty, the plate or the mat, how long you hold on.
     acid    — sulfuric acid and water release heat as they mix (Thomsen's
               heat of dilution). Pour water into acid and the mixture passes
               100 °C before much water is in; pour acid into water and the
               same heat warms a large mass slowly. Same final liquid.
     density — a mineral weighed on a balance and measured by displacement,
               every reading with its uncertainty: parallax, the meniscus, the
               tare, the cylinder's divisions. Can this cylinder tell pyrite
               from hematite? Is the nugget gold?
     timing  — a ball falls through two light gates while a stopwatch times
               it by hand: human reaction time, repeated trials, the spread,
               and what averaging can and cannot fix. Air drag is the
               difference the gates can see and the stopwatch cannot.
     graph   — the lab's own data put into a table and a graph: which
               variable goes where, points or a line, the best fit, the
               outlier, the curve that straightens, the axis that lies.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.MEAS, BENCH, HYDRO, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ME = () => window.MEAS;

  /* ============================================================
     A5.1 — HOT GLASS LOOKS LIKE COLD GLASS
     The touch: layers [object | glove | skin] in one dimension, finite
     volumes graded toward the contact, Crank–Nicolson in time. The object's
     back is held at its temperature when water or the plate stands behind
     it, insulated when an empty beaker's thin wall has only air behind it.
     The skin starts at 33 °C at the surface and 37 °C six millimetres down.
     The burn is Moritz and Henriques's threshold (the scald table: 68.3 °C
     for 1 s … 48.9 °C for 5 min … 44 °C for 6 h), accumulated as a dose so
     a changing temperature counts correctly.
     ============================================================ */
  const MAT = {
    skin: { k: 0.37, rho: 1100, c: 3400 },
    glass: { k: 1.14, rho: 2230, c: 830 },          // borosilicate
    steel: { k: 16.0, rho: 7900, c: 500 },          // stainless
    ceramic: { k: 1.6, rho: 2500, c: 800 },         // a hot plate's glass-ceramic top
    nitrile: { k: 0.24, rho: 1100, c: 1900 },
    fabric: { k: 0.06, rho: 250, c: 1300 }          // a padded heat glove: fibres and trapped air
  };
  const eff = m => Math.sqrt(m.k * m.rho * m.c);
  const SETTLE = 0.01;
  const GLOVES = { bare: null, nitrile: { mat: MAT.nitrile, L: 0.0001 }, heat: { mat: MAT.fabric, L: 0.003 }, tongs: 'tongs' };
  const BURN = [[44, 21600], [48.9, 300], [51.7, 120], [54.4, 30], [57.2, 10], [60, 5], [62.8, 3], [65.6, 2], [68.3, 1]];
  function burnTime(T) {
    if (T < 44) return Infinity;
    for (let i = 0; i < BURN.length - 1; i++) {
      const [a, ta] = BURN[i], [b, tb] = BURN[i + 1];
      if (T <= b) return Math.exp(Math.log(ta) + (T - a) / (b - a) * (Math.log(tb) - Math.log(ta)));
    }
    const [a, ta] = BURN[BURN.length - 2], [b, tb] = BURN[BURN.length - 1], s = (Math.log(tb) - Math.log(ta)) / (b - a);
    return Math.max(0.005, Math.exp(Math.log(tb) + s * (T - b)));
  }
  function tdma(a, b, c, d) {
    const n = d.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
    x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  }
  /* layers [{ mat, L, n, grade, toward, T0 }] from the object's back to the skin's depth.
     Returns the skin-surface temperature and burn dose through time, and the final profile. */
  function contact(layers, Tback, backFixed, tEnd, skinIndex) {
    const cells = [];
    layers.forEach((Ly, li) => {
      const g = Ly.grade || 1, w = []; for (let i = 0; i < Ly.n; i++) w.push(Math.pow(g, i));
      const tot = w.reduce((u, v) => u + v, 0), dxs = w.map(v => v / tot * Ly.L);
      if (Ly.toward === 'end') dxs.reverse();
      let x = 0;
      dxs.forEach(dx => { const f = (x + dx / 2) / Ly.L; x += dx; cells.push({ m: Ly.mat, dx, T: typeof Ly.T0 === 'function' ? Ly.T0(f) : Ly.T0, layer: li }); });
    });
    const N = cells.length, G = new Float64Array(N + 1), C = new Float64Array(N);
    G[0] = backFixed ? 1 / (cells[0].dx / 2 / cells[0].m.k) : 0;
    for (let i = 1; i < N; i++) G[i] = 1 / (cells[i - 1].dx / 2 / cells[i - 1].m.k + cells[i].dx / 2 / cells[i].m.k);
    G[N] = 1 / (cells[N - 1].dx / 2 / cells[N - 1].m.k);
    for (let i = 0; i < N; i++) C[i] = cells[i].m.rho * cells[i].m.c * cells[i].dx;
    let T = Float64Array.from(cells.map(q => q.T));
    const s0 = cells.findIndex(q => q.layer === skinIndex);
    const ga = cells[s0 - 1].m.k / (cells[s0 - 1].dx / 2), gb = cells[s0].m.k / (cells[s0].dx / 2);
    const surf = () => (ga * T[s0 - 1] + gb * T[s0]) / (ga + gb);
    const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
    let t = 0, dt = 2e-4, dose = 0, pain = null, burn = null;
    const path = [{ t: 0, Ts: surf() }];
    const Tcore = 37;
    while (t < tEnd - 1e-12) {
      const h = Math.min(dt, tEnd - t);
      for (let i = 0; i < N; i++) {
        const gl = G[i], gr = G[i + 1], Tl = i === 0 ? Tback : T[i - 1], Tr = i === N - 1 ? Tcore : T[i + 1];
        a[i] = i === 0 ? 0 : -0.5 * h * gl; c[i] = i === N - 1 ? 0 : -0.5 * h * gr;
        b[i] = C[i] + 0.5 * h * (gl + gr);
        d[i] = C[i] * T[i] + 0.5 * h * (gl * (Tl - T[i]) + gr * (Tr - T[i])) + (i === 0 ? 0.5 * h * gl * Tback : 0) + (i === N - 1 ? 0.5 * h * gr * Tcore : 0);
      }
      const T0 = surf();
      T = tdma(a, b, c, d); t += h;
      const T1 = surf(), Tm = 0.5 * (T0 + T1);
      if (t > SETTLE) {                    // the first 10 ms are the grid settling onto the contact temperature
        dose += h / burnTime(Tm);
        if (pain == null && T1 >= 45) pain = t;
        if (burn == null && dose >= 1) burn = t;
      }
      if (path.length < 400 && (t - path[path.length - 1].t > Math.max(0.004, t * 0.02))) path.push({ t, Ts: T1 });
      dt = Math.min(dt * 1.04, 0.02);
    }
    path.push({ t, Ts: surf() });
    let x = 0; const prof = { x: [], T: [] };
    cells.forEach((q, i) => { prof.x.push(x + q.dx / 2); prof.T.push(T[i]); x += q.dx; });
    return { path: path.filter(q => q.t === 0 || q.t > SETTLE), dose, pain, burn, Ts: surf(), peak: path.filter(q => q.t > SETTLE).reduce((m, q) => Math.max(m, q.Ts), 0), prof, depth: layers.slice(0, skinIndex).reduce((u, Ly) => u + Ly.L, 0) };
  }
  /* what is touched: { mat, L (its wall), back: fixed | insulated } */
  function targetOf(p) {
    if (p.target === 'plate') return { mat: MAT.ceramic, L: 0.005, fixed: true, name: 'the plate’s ceramic top', eps: 0.9 };
    const steel = p.beaker === 'steel';
    return { mat: steel ? MAT.steel : MAT.glass, L: steel ? 0.0009 : 0.0018, fixed: p.contents === 'water', name: steel ? 'the steel beaker' : 'the glass beaker', eps: steel ? 0.16 : 0.92 };
  }
  function touch(tg, Tobj, protection, hold) {
    if (protection === 'tongs') return { tongs: true, path: [{ t: 0, Ts: 33 }, { t: hold, Ts: 33 }], dose: 0, pain: null, burn: null, Ts: 33, peak: 33, prof: null };
    const gl = GLOVES[protection], layers = [{ mat: tg.mat, L: tg.L, n: 30, grade: 1.14, toward: 'end', T0: Tobj }];
    if (gl) layers.push({ mat: gl.mat, L: gl.L, n: 12, T0: 33 });
    layers.push({ mat: MAT.skin, L: 0.006, n: 40, grade: 1.12, T0: f => 33 + 4 * f });
    return contact(layers, Tobj, tg.fixed, hold, layers.length - 1);
  }
  /* the hottest this object can be for this touch to leave no burn (bisection on the model itself) */
  function thresholdT(tg, protection, hold) {
    if (protection === 'tongs') return Infinity;
    let lo = 34, hi = 400;
    if (touch(tg, hi, protection, hold).dose < 1) return Infinity;
    for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (touch(tg, mid, protection, hold).dose >= 1) hi = mid; else lo = mid; }
    return lo;
  }

  /* The hot plate and the beaker, lumped. The plate: 800 W under a thermostat, a
     1050 J/K top and block, losing heat by convection (hot face up) and radiation.
     The beaker takes heat through its base (200 W/m²K of contact); it loses heat
     from its wetted side and, if it holds water, by evaporation from the surface
     (the Lewis analogy) — the biggest loss when the water is hot. Water holds the
     beaker at 100 °C while it boils; an empty beaker has no such limit. */
  const SIG = 5.670e-8, TA = 20;
  const PLATE = { A: 0.18 * 0.18, C: 1050, P: 800, band: 4, body: 1.5 };
  const BEAKER = { glass: { m: 0.100, c: 830, eps: 0.92 }, steel: { m: 0.160, c: 500, eps: 0.30 } };
  const BASE_D = 0.070, HEAT_MIN = 15, END_MIN = 60, WATER_G = 200;
  const psat = T => 610.94 * Math.exp(17.625 * T / (T + 243.04));
  const rhov = T => psat(T) * 0.018015 / (8.314 * (T + 273.15));
  const hV = (dT, Lh) => 1.42 * Math.pow(Math.max(0.1, Math.abs(dT)) / Lh, 0.25);
  const hUp = (dT, Lh) => 1.32 * Math.pow(Math.max(0.1, Math.abs(dT)) / Lh, 0.25);
  const hRad = (T, e) => { const a = T + 273.15, b = TA + 273.15; return e * SIG * (a * a + b * b) * (a + b); };
  function thermalRun(p) {
    const B = BEAKER[p.beaker], Ab = Math.PI * BASE_D * BASE_D / 4, water = p.contents === 'water';
    let Tp = TA, Tb = TA, mw = water ? WATER_G / 1000 : 0, boiling = 0;
    const rows = [];
    for (let s = 0; s <= END_MIN * 60; s += 1) {
      const on = s < HEAT_MIN * 60, onPlate = on || p.after === 'plate';
      const Pin = on ? PLATE.P * clamp((p.set - Tp) / PLATE.band, 0, 1) : 0;
      const lossP = PLATE.body * (PLATE.A - (onPlate ? Ab : 0)) * (hUp(Tp - TA, 0.045) + hRad(Tp, 0.9)) * (Tp - TA);
      const toB = onPlate ? 200 * Ab * (Tp - Tb) : 12 * Ab * (TA - Tb);          // on the mat: a little heat into cold fibre board
      const hw = water ? mw / 1000 / Ab : 0;
      const side = Math.PI * BASE_D * (water ? Math.max(hw, 0.01) : 0.095);
      const lossS = side * (hV(Tb - TA, Math.max(hw, 0.02)) + hRad(Tb, B.eps)) * (Tb - TA) * (water ? 1 : 2);
      let lossT = 0, ev = 0;
      if (water) {
        const hc = hUp(Tb - TA, BASE_D), hm = hc / (1.2 * 1005 * Math.pow(0.85, 2 / 3));
        ev = Math.max(0, hm * (rhov(Tb) - 0.5 * rhov(TA)) * Ab);
        lossT = Ab * (hc + hRad(Tb, 0.96)) * (Tb - TA) + ev * 2.26e6;
      }
      if (s % 15 === 0) rows.push({ t: s / 60, Tp, Tb, mw: mw * 1000, ev, boil: boiling });
      const Cb = B.m * B.c + mw * 4186;
      Tp += (Pin - lossP - (onPlate ? toB : 0)) / PLATE.C;
      let dQ = toB - lossS - lossT;
      boiling = 0;
      if (water && Tb >= 99.999 && dQ > 0) { const m = dQ / 2.26e6; mw = Math.max(0, mw - m); boiling = dQ; dQ = 0; }
      Tb = Math.min(water ? 100 : 1e9, Tb + dQ / Cb);
      mw = Math.max(0, mw - ev);
    }
    return rows;
  }
  const rowAt = (rows, tMin) => { const i = clamp(Math.floor(tMin * 4), 0, rows.length - 2), a = rows[i], b = rows[i + 1], f = clamp((tMin - a.t) / (b.t - a.t), 0, 1); const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f; return o; };
  function hotOf(S) {
    const p = S.p, key = [p.set, p.beaker, p.contents, p.after].join('|');
    if (S._hot && S._hot.key === key) return S._hot;
    S._hot = { key, rows: thermalRun(p) };
    return S._hot;
  }
  const targetT = (p, r) => p.target === 'plate' ? r.Tp : r.Tb;
  function touchOf(S, Tobj) {
    const p = S.p, tg = targetOf(p), Tq = Math.round(Tobj * 4) / 4, key = [p.target, p.beaker, p.contents, p.protect, p.hold, Tq].join('|');
    S._touch = S._touch || {};
    if (!S._touch[key]) { const ks = Object.keys(S._touch); if (ks.length > 60) S._touch = {}; S._touch[key] = touch(tg, Tq, p.protect, p.hold); }
    return S._touch[key];
  }
  function safeOf(S) {
    const p = S.p, H = hotOf(S), key = [H.key, p.target, p.protect, p.hold].join('|');
    if (S._safe && S._safe.key === key) return S._safe;
    const Tstar = thresholdT(targetOf(p), p.protect, p.hold);
    let last = -1;
    H.rows.forEach((r, i) => { if (targetT(p, r) > Tstar) last = i; });
    S._safe = { key, Tstar, at: last < 0 ? 0 : last >= H.rows.length - 1 ? null : H.rows[last + 1].t };
    return S._safe;
  }

  /* ============================================================
     A5.1 — ACID INTO WATER
     Thomsen's heat of dilution: mixing 1 mol of H₂SO₄ with n mol of water
     releases 74.73·n/(n + 1.798) kJ (within about 5 % of modern tables to
     n = 100). The heat capacity of the mixture by its acid fraction (4.18
     J/g·K for water, 1.42 for the pure acid). A stirred beaker, losing heat
     to the air (0.25 W/K) or to an ice bath (2.2 W/K at 0 °C). Water that
     lands on liquid hotter than 100 °C boils as it lands and throws acid.
     ============================================================ */
  const MA = 98.079, MW = 18.015;
  const QTH = n => 74.73 * n / (n + 1.798);
  const cpOf = w => 4.184 - 3.50 * w + 0.74 * w * w;
  const RHO_ACID = { 98: 1.836, 70: 1.610, 40: 1.303 };
  const BP = [[0, 100], [0.2, 102], [0.3, 104.5], [0.4, 109], [0.5, 118], [0.6, 133], [0.7, 158], [0.78, 190], [0.85, 225], [0.9, 262], [0.95, 305], [0.983, 338]];
  const bpOf = w => { for (let i = 0; i < BP.length - 1; i++) if (w <= BP[i + 1][0]) return BP[i][1] + (w - BP[i][0]) / (BP[i + 1][0] - BP[i][0]) * (BP[i + 1][1] - BP[i][1]); return 338; };
  function liquidOf(kind, V, strength) {
    if (kind === 'water') { const m = V * 0.998; return { na: 0, nw: m / MW, m }; }
    const m = V * RHO_ACID[strength], w = strength / 100;
    return { na: m * w / MA, nw: m * (1 - w) / MW, m };
  }
  const hMix = s => s.na > 0 ? -s.na * QTH(s.nw / s.na) * 1000 : 0;
  const wOf = s => s.m > 0 ? s.na * MA / s.m : 0;
  /* Water is lighter than the acid, so it lands on top and mixes first with the liquid just under it:
     a gram of water with a gram of the solution. The heat of that little mixing warms those two grams —
     on strong acid by about 100 K, so the water boils where it lands even when the beaker is cold.
     Acid is denser than water: it sinks, and its heat is given up below the surface. */
  function dropRise(S) {
    if (S.na <= 0) return 0;
    const f = 1 / S.m, under = { na: S.na * f, nw: S.nw * f, m: 1 }, drop = { na: 0, nw: 1 / MW, m: 1 }, both = { na: under.na, nw: under.nw + drop.nw, m: 2 };
    return (hMix(under) + hMix(drop) - hMix(both)) / (2 * cpOf(wOf(both)));
  }
  function dilute(o) {
    const intoWater = o.order === 'acid-into-water';
    const first = intoWater ? liquidOf('water', o.waterV) : liquidOf('acid', o.acidV, o.strength);
    const kind = intoWater ? 'acid' : 'water', addV = intoWater ? o.acidV : o.waterV;
    let S = { na: first.na, nw: first.nw, m: first.m }, T = 20, added = 0, peak = 20, above = 0, t = 0, over = 0, firstAbove = null, surf = 20, peakBulk = 20;
    const UA = o.bath === 'ice' ? 2.2 : 0.25, Tenv = o.bath === 'ice' ? 0 : 20, dt = Math.max(0.05, Math.min(0.5, addV / o.rate / 400));
    let H = hMix(S);
    const rows = [{ t: 0, V: 0, T, w: wOf(S), Ts: T }], tEnd = addV / o.rate + 60;
    while (t < tEnd) {
      const dv = Math.min(o.rate * dt, addV - added);
      surf = T;
      if (dv > 0) {
        if (kind === 'water') surf = T + dropRise(S);                 // where each drop lands
        const inc = liquidOf(kind, dv, o.strength);
        H += hMix(inc);
        S = { na: S.na + inc.na, nw: S.nw + inc.nw, m: S.m + inc.m };
        added += dv;
        if (kind === 'water' && surf > 100) { above += dv; if (firstAbove == null) firstAbove = added; }
      }
      H -= UA * (T - Tenv) * dt;
      const w = wOf(S);
      T = 20 + (H - hMix(S)) / (S.m * cpOf(w));
      over = Math.max(over, T - bpOf(w));
      peakBulk = Math.max(peakBulk, T);
      peak = Math.max(peak, T, surf);
      t += dt;
      if (t - rows[rows.length - 1].t >= Math.max(dt, tEnd / 300)) rows.push({ t, V: added, T, w, Ts: dv > 0 ? surf : T });
    }
    rows.push({ t, V: added, T, w: wOf(S), Ts: T });
    return { rows, peak, peakBulk, above, firstAbove, final: T, over, w: wOf(S), tPour: addV / o.rate, addV, kind, mass: S.m };
  }
  function acidOf(S) {
    const p = S.p, key = [p.order, p.acidV, p.waterV, p.strength, p.rate, p.bath].join('|');
    if (S._acid && S._acid.key === key) return S._acid;
    const run = dilute({ order: p.order, acidV: p.acidV, waterV: p.waterV, strength: p.strength, rate: p.rate, bath: p.bath });
    const other = dilute({ order: p.order === 'acid-into-water' ? 'water-into-acid' : 'acid-into-water', acidV: p.acidV, waterV: p.waterV, strength: p.strength, rate: p.rate, bath: p.bath });
    S._acid = { key, run, other };
    return S._acid;
  }
  const acidAt = (R, t) => { const rows = R.rows; let i = 0; while (i < rows.length - 2 && rows[i + 1].t < t) i++; const a = rows[i], b = rows[i + 1] || a, f = b.t > a.t ? clamp((t - a.t) / (b.t - a.t), 0, 1) : 0; return { t, V: a.V + (b.V - a.V) * f, T: a.T + (b.T - a.T) * f, w: a.w + (b.w - a.w) * f, Ts: a.Ts + (b.Ts - a.Ts) * f }; };

  /* ============================================================
     A5.3 — DENSITY BY DISPLACEMENT, AND WHAT EACH READING CAN CLAIM
     A digital balance reads to 0.01 g (±0.005). A cylinder is read to one
     estimated digit beyond its divisions and claimed to ± half a division
     (ISO 4788 graduations: 10 mL / 0.2, 25 / 0.5, 100 / 1, 250 / 2).
     Parallax: the scale is on the glass, the meniscus's lowest point is at
     the axis a radius behind it, so an eye h above it reads high by h·r/D·A.
     Read the meniscus's top edge and the reading is high by its climb
     (2.2 mm). The two readings of before-and-after share these offsets and
     they cancel in the difference; the overflow can's single reading keeps
     them. Densities: the handbook values.
     ============================================================ */
  const MINERALS = [['quartz', 2.65], ['calcite', 2.71], ['fluorite', 3.18], ['chalcopyrite', 4.19], ['pyrite', 5.01], ['magnetite', 5.18],
    ['hematite', 5.26], ['galena', 7.58], ['copper', 8.96], ['silver', 10.49], ['gold', 19.32]];
  const SPECIMENS = {
    A: { mineral: 'pyrite', look: 'a brassy cube' }, B: { mineral: 'gold', look: 'a golden nugget' }, C: { mineral: 'hematite', look: 'a steel-grey lump' },
    D: { mineral: 'magnetite', look: 'a black eight-sided crystal' }, E: { mineral: 'quartz', look: 'a clear six-sided crystal' }, F: { mineral: 'galena', look: 'a heavy grey cube' }
  };
  const CYL = { 10: { div: 0.2, d: 1.30 }, 25: { div: 0.5, d: 1.90 }, 100: { div: 1, d: 2.90 }, 250: { div: 2, d: 3.90 } };
  const SIZES = { tiny: 0.52, small: 2.13, medium: 6.31, large: 14.87 };
  const widthOf = V => 1.22 * Math.cbrt(V);
  const BOAT = 1.87, MENISCUS = 0.22, EYE_D = 25, DRIP = 0.05, BUBBLE = 0.12;
  const rnd = (v, q) => Math.round(v / q) * q;
  const densityOf = name => MINERALS.find(m => m[0] === name)[1];
  function measure(p) {
    const sp = SPECIMENS[p.specimen], rho = densityOf(sp.mineral), V = SIZES[p.size], m = rho * V;
    const over = p.method === 'overflow', cy = over ? p.catchCyl : p.cyl, C = CYL[cy], A = Math.PI * C.d * C.d / 4;
    const w = widthOf(V), fits = over ? true : w <= CYL[p.cyl].d - 0.1;
    const start = over ? 0 : p.fill * p.cyl;
    // a lump about as tall as it is wide, in a column of water: how much of it is under the surface
    let Vsub = V;
    if (!over) { const Ah = A * w; if (Ah > V) Vsub = Math.min(V, V * start / (Ah - V)); }
    const covered = Vsub >= V - 1e-9;
    // reading the edge where water meets the scale: no parallax, but high by the climb; the lowest point: parallax
    const off = p.readAt === 'top' ? MENISCUS * A * 0.9 : p.eye * (C.d / 2) / EYE_D * A;
    const bub = p.bubbles ? BUBBLE : 0, q = C.div / 10;
    let V1 = null, V2, Vm, dV, spill = false, trueLevel;
    if (!over) {
      trueLevel = start + Vsub + bub;
      spill = trueLevel > p.cyl;
      V1 = rnd(start + off, q); V2 = rnd(Math.min(trueLevel, p.cyl + C.div * 3) + off, q);
      Vm = V2 - V1; dV = Math.SQRT2 * C.div / 2;
    } else {
      trueLevel = V + bub - DRIP;
      spill = trueLevel > p.catchCyl;
      V2 = rnd(Math.min(trueLevel, p.catchCyl + C.div * 3) + off, q); Vm = V2; dV = Math.hypot(C.div / 2, DRIP);
    }
    const mr = rnd(m + (p.tared ? 0 : BOAT), 0.01), dm = 0.005;
    const r = mr / Math.max(1e-6, Vm), dr = r * Math.hypot(dm / mr, dV / Math.max(1e-6, Vm));
    const cands = MINERALS.filter(([, d]) => d >= r - dr && d <= r + dr).map(([n]) => n);
    return { rho, V, m, A, C, cy, V1, V2, Vm, dV, mr, dm, r, dr, rel: dr / r, cands, fits, covered, spill, mineral: sp.mineral, off, start, trueLevel, Vsub, over, bub };
  }
  /* the relative uncertainty of a method, before any systematic slip */
  function relOf(method, cyl, V) {
    const C = CYL[cyl], dV = method === 'overflow' ? Math.hypot(C.div / 2, DRIP) : Math.SQRT2 * C.div / 2;
    return dV / V;
  }

  /* ============================================================
     A5.3 · A5.4 — TIMING A FALL
     The ball falls from rest with quadratic air drag and buoyancy; the time
     to fall h is exact: t = (v_t/g′)·arccosh(e^(g′h/v_t²)). The light gates'
     timer counts 0.1 ms. The stopwatch: whoever starts it on seeing the
     release is late by a reaction time (0.19 ± 0.03 s — the ruler-drop
     test's number); stopping on the landing is anticipated (± 0.045 s);
     the display shows hundredths.
     ============================================================ */
  const G = 9.81, RHO_AIR = 1.20;
  const BALLS = { steel: { m: 0.0642, d: 0.025, cd: 0.47, name: 'steel ball' }, marble: { m: 0.0055, d: 0.016, cd: 0.47, name: 'glass marble' }, pingpong: { m: 0.0027, d: 0.040, cd: 0.50, name: 'ping-pong ball' } };
  function ballOf(k) { const B = BALLS[k], A = Math.PI * B.d * B.d / 4, Vb = Math.PI * B.d ** 3 / 6, g1 = G * (1 - RHO_AIR * Vb / B.m); return { B, g1, vt: Math.sqrt(2 * B.m * g1 / (RHO_AIR * B.cd * A)) }; }
  function fallTime(k, h) { const b = ballOf(k); return (b.vt / b.g1) * Math.acosh(Math.exp(b.g1 * h / (b.vt * b.vt))); }
  function fallDist(k, t) { const b = ballOf(k); return (b.vt * b.vt / b.g1) * Math.log(Math.cosh(b.g1 * t / b.vt)); }
  function lcg(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function normal(r) { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const REACT = { partner: [0.19, 0.03], self: [0.0, 0.03] }, ANTICIPATE = 0.045;
  function trialsOf(o) {
    const t = fallTime(o.ball, o.h), r = lcg(o.set * 7919 + Math.round(o.h * 1000) + (o.ball === 'steel' ? 0 : o.ball === 'marble' ? 31 : 57) + (o.who === 'self' ? 101 : 0));
    const out = [];
    for (let k = 0; k < o.n; k++) {
      const s = REACT[o.who], st = s[0] + s[1] * normal(r), sp = ANTICIPATE * normal(r);
      out.push({ watch: Math.round(Math.max(0.05, t - st + sp) * 100) / 100, gate: Math.round((t + 0.00005 * normal(r)) * 10000) / 10000 });
    }
    return { t, out };
  }
  function stats(a) {
    if (!a.length) return { n: 0, mean: NaN, sd: NaN, se: NaN, min: NaN, max: NaN };
    const m = a.reduce((u, v) => u + v, 0) / a.length, sd = a.length > 1 ? Math.sqrt(a.reduce((u, v) => u + (v - m) ** 2, 0) / (a.length - 1)) : 0;
    return { n: a.length, mean: m, sd, se: sd / Math.sqrt(a.length), min: Math.min(...a), max: Math.max(...a) };
  }
  function timingOf(S) {
    const p = S.p, key = [p.ball, p.h, p.who, p.trials, p.set2].join('|');
    if (S._tim && S._tim.key === key) return S._tim;
    const T = trialsOf({ ball: p.ball, h: p.h, n: p.trials, who: p.who, set: p.set2 });
    S._tim = { key, t: T.t, out: T.out };
    return S._tim;
  }
  const TRIAL_S = 3.0, SLOW = 4;                    // seconds of stage time per trial; the fall shown four times slower

  /* ============================================================
     A5.4 — FROM THE TABLE TO THE GRAPH
     The lab's own measurements as datasets. Least squares for a line and
     for a line through zero; an outlier is a point whose residual is more
     than three times the scatter of the rest (leave-one-out).
     ============================================================ */
  function fit(P, origin) {
    const n = P.length;
    if (n < 2) return null;
    if (origin) { const sxy = P.reduce((u, [x, y]) => u + x * y, 0), sxx = P.reduce((u, [x]) => u + x * x, 0); const b = sxy / sxx; return { a: 0, b, res: P.map(([x, y]) => y - b * x) }; }
    const mx = P.reduce((u, [x]) => u + x, 0) / n, my = P.reduce((u, [, y]) => u + y, 0) / n;
    const sxy = P.reduce((u, [x, y]) => u + (x - mx) * (y - my), 0), sxx = P.reduce((u, [x]) => u + (x - mx) ** 2, 0);
    const b = sxy / sxx; return { a: my - b * mx, b, res: P.map(([x, y]) => y - (my - b * mx) - b * x) };
  }
  function outlierOf(P, origin) {
    let worst = null;
    P.forEach((pt, i) => {
      const rest = P.filter((_, j) => j !== i), f = fit(rest, origin);
      if (!f) return;
      const sd = Math.sqrt(f.res.reduce((u, r) => u + r * r, 0) / Math.max(1, rest.length - (origin ? 1 : 2)));
      const z = Math.abs(pt[1] - f.a - f.b * pt[0]) / Math.max(sd, 1e-9);
      if (!worst || z > worst.z) worst = { i, z };
    });
    return worst && worst.z > 3 ? worst : null;
  }
  const PIECES = [1.62, 3.05, 4.48, 7.31, 9.86, 12.9];
  const DATASETS = {
    mass: { name: 'Six pieces of pyrite: volume and mass', x: { name: 'Volume', unit: 'cm³', dp: 2 }, y: { name: 'Mass', unit: 'g', dp: 2 },
      rows: PIECES.map((V, i) => { const m = Math.round(5.01 * V * 100) / 100; let r = Math.round((V + 0.03 * Math.sin(i * 2.3)) * 20) / 20; if (i === 3) r += 1.0; return [r, m]; }),
      err: [0.25, 0.005], kind: 'scatter', note: 'piece 4: the cylinder was read one division high' },
    fall: { name: 'A steel ball dropped from seven heights, timed by light gates', x: { name: 'Drop height', unit: 'm', dp: 2 }, y: { name: 'Fall time', unit: 's', dp: 4 },
      rows: [0.20, 0.40, 0.60, 0.80, 1.00, 1.20, 1.40].map(h => [h, Math.round(fallTime('steel', h) * 10000) / 10000]), err: [0.001, 0.0001], kind: 'scatter' },
    cool: { name: 'A beaker of water cooling on the bench', x: { name: 'Time', unit: 'min', dp: 0 }, y: { name: 'Temperature', unit: '°C', dp: 1 },
      rows: null, err: [0, 0.5], kind: 'scatter' },
    balls: { name: 'Mean fall time over 1 m, twenty drops each', x: { name: 'Ball', unit: '', dp: 0 }, y: { name: 'Mean fall time', unit: 's', dp: 4 },
      rows: [[0, Math.round(fallTime('steel', 1) * 10000) / 10000], [1, Math.round(fallTime('marble', 1) * 10000) / 10000], [2, Math.round(fallTime('pingpong', 1) * 10000) / 10000]],
      cats: ['steel', 'marble', 'ping-pong'], err: [0, 0.0001], kind: 'bars' }
  };
  (function coolRows() {                              // from the hot bench's own model: 200 mL just off the boil, lifted onto the mat
    const rows = thermalRun({ set: 350, beaker: 'glass', contents: 'water', after: 'mat' }), t0 = HEAT_MIN;
    DATASETS.cool.rows = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map(m => [m, Math.round(rowAt(rows, t0 + m).Tb * 2) / 2]);
  })();
  function graphOf(S) {
    const p = S.p, D = DATASETS[p.data];
    let P = D.rows.map(r => r.slice());
    const lin = p.data === 'fall' && p.linear;
    if (lin) P = P.map(([h, t]) => [h, t * t]);
    const origin = p.fit === 'zero';
    const out = D.kind === 'scatter' && p.fit !== 'none' ? outlierOf(P, origin) : null;
    const used = out && p.outlier === 'drop' ? P.filter((_, i) => i !== out.i) : P;
    const F = D.kind === 'scatter' && p.fit !== 'none' ? fit(used, origin) : null;
    return { D, P, lin, out, used, F, swapped: p.axes === 'swapped' };
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'hot', label: 'Hot glass looks like cold glass', teaches: ['A5.1'] },
    { value: 'acid', label: 'Acid into water — never water into acid', teaches: ['A5.1'] },
    { value: 'density', label: 'Weigh it, measure it, name it', teaches: ['A5.3'] },
    { value: 'timing', label: 'Stopwatch against light gates', teaches: ['A5.3', 'A5.4'] },
    { value: 'graph', label: 'From the table to the graph', teaches: ['A5.4'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'hot',
    set: 250, beaker: 'glass', contents: 'water', after: 'plate', target: 'beaker', protect: 'bare', hold: 2, view: 'eye',
    order: 'acid-into-water', strength: 98, acidV: 20, waterV: 100, rate: 1, bath: 'air',
    specimen: 'A', size: 'medium', method: 'before', cyl: 100, catchCyl: 25, fill: 0.5, eye: 0, readAt: 'bottom', tared: true, bubbles: false, units: 'gcm3',
    ball: 'steel', h: 1.0, who: 'partner', trials: 10, set2: 1,
    data: 'mass', gtype: 'points', axes: 'normal', fit: 'zero', linear: false, yfrom: 'zero', outlier: 'keep'
  };
  function preset(o) { return Object.assign({}, BASE, o); }

  function setup(S) {
    const p = S.p;
    p.set2 = clamp(Math.round(p.set2 || 1), 1, 5);
    S.th = 0; S.tq = 0; S.tdn = 0; S.ttr = 0; S.tgr = 0; S.ta = S.ta || 0;
    S._hot = null; S._safe = null; S._acid = null; S._tim = null;
    const home = homeFor(p.setup, !!S._narrow);
    if (p.setup === 'graph') S.cam = null;
    else if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera({ theta: home.theta, phi: home.phi, dist: home.dist, target: home.target.slice(), fov: home.fov });
      S.cam.minDist = home.min; S.cam.maxDist = home.max; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
  }
  function step(S, dt) {
    const p = S.p;
    S.ta = (S.ta || 0) + dt;
    if (p.setup === 'hot') S.th = Math.min(END_MIN, S.th + dt * 1.0);
    else if (p.setup === 'acid') { const A = acidOf(S).run, span = A.tPour + 60, k = Math.max(1, span / 30); S.tq = Math.min(span, S.tq + dt * k); S.tqk = k; }
    else if (p.setup === 'density') S.tdn = Math.min(DEN_END, S.tdn + dt);
    else if (p.setup === 'timing') S.ttr = Math.min(p.trials * TRIAL_S + 0.5, S.ttr + dt);
    else if (p.setup === 'graph') S.tgr = Math.min(12, S.tgr + dt);
  }
  const DEN_END = 11;

  /* ---------------- cameras ---------------- */
  const HOMES = {
    hot: { theta: -1.22, phi: 0.36, dist: 0.78, target: [0.04, 0.02, 0.10], fov: 0.72, min: 0.3, max: 2.4 },
    acid: { theta: -1.30, phi: 0.30, dist: 0.95, target: [0.0, 0.05, 0.20], fov: 0.72, min: 0.3, max: 2.6 },
    density: { theta: -1.35, phi: 0.26, dist: 0.62, target: [0.02, 0.0, 0.10], fov: 0.72, min: 0.25, max: 2.0 },
    timing: { theta: -1.22, phi: 0.12, dist: 2.05, target: [-0.1, 0.0, 0.66], fov: 0.72, min: 0.6, max: 5 }
  };
  const homeFor = (su, narrow) => { const h = HOMES[su] || HOMES.hot; return narrow ? Object.assign({}, h, { dist: h.dist * 1.25 }) : h; };
  function placeView(S, g, fx, fy) {
    const cam = S.cam, W = g.w, H = g.h;
    cam.setViewport(W, H);
    cam.offX = fx * W; cam.offY = fy;
  }

  /* ---------------- helpers ---------------- */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const th = g => g.theme;
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  function tag(ctx, x, y, text, col, o) {
    o = o || {};
    ctx.save(); ctx.font = mono(o.size || 9.5, 600);
    const w = ctx.measureText(text).width + 10, h = (o.size || 9.5) + 7;
    let X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    if (o.W) X = clamp(X, 4, o.W - w - 4);                         // never off the stage
    ctx.fillStyle = o.fill || 'rgba(6,10,20,.8)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X, y - h / 2, w, h, 3); else ctx.rect(X, y - h / 2, w, h); ctx.fill();
    ctx.fillStyle = col || '#E8EEF8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + 5, y + 0.5);
    ctx.restore();
    return { x: X, w, h };
  }
  const minSay = m => m < 1 ? Math.round(m * 60) + ' s' : m.toFixed(m < 10 ? 1 : 0) + ' min';
  const sSay = s => s == null ? '—' : s < 1 ? (s * 1000).toFixed(0) + ' ms' : s < 100 ? s.toFixed(s < 10 ? 1 : 0) + ' s' : (s / 60).toFixed(1) + ' min';

  /* ============================================================
     THE STAGE — hot
     ============================================================ */
  const PLATE_AT = [-0.05, 0.06], MAT_AT = [0.24, 0.02], BEAKER_RIN = 0.0332;          // the 250 mL beaker's inner radius (m)
  function drawHot(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), M = ME(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const Hr = hotOf(S), r = rowAt(Hr.rows, S.th), on = S.th < HEAT_MIN, onPlate = on || p.after === 'plate';
    const ir = p.view === 'ir' ? { lo: 15, hi: Math.max(120, Math.min(400, p.set + 20)), room: TA } : null;
    // the room and the bench
    ctx.fillStyle = ir ? '#07040F' : '#C9CFD6'; ctx.fillRect(0, 0, W, H);
    placeView(S, g, narrow ? 0 : -0.16, narrow ? 10 : 30);
    const F = R3.Frame(ctx, cam, { ambient: 0.34, floorZ: 0 });
    if (!ir && cam.eye[1] < 0.3) M.tileWall(F, -0.9, 0.9, 0.36, 0, 0.75);
    M.bench(F, -0.62, 0.62, -0.32, 0.36, { cabinet: ir ? '#0E0820' : undefined, tone: ir ? M.irc(ir, TA, 0.95, '#000') : undefined });
    // the hot plate, the mat, the beaker where it stands now
    const HP = M.hotplate(F, [PLATE_AT[0], PLATE_AT[1], 0], { top: r.Tp, set: (p.set - 20) / 330, on, hot: r.Tp > 50, ir });
    M.mat(F, [MAT_AT[0], MAT_AT[1]], 0.16, { ir, T: TA + (onPlate ? 0 : (r.Tb - TA) * 0.25) });
    const bb = onPlate ? [HP.centre[0], HP.centre[1], HP.topZ + 0.002] : [MAT_AT[0], MAT_AT[1], 0.009];
    const water = p.contents === 'water', level = water ? (r.mw / 1e6) / (Math.PI * BEAKER_RIN * BEAKER_RIN) : 0;
    const boil = water && r.Tb > 99.5 && r.boil > 0 ? 1 : 0;
    M.beaker(F, bb, 0.035, 0.095, level, { steel: p.beaker === 'steel', T: r.Tb, ir, tint: '#D2EBF8', marks: { perM: Math.PI * BEAKER_RIN * BEAKER_RIN * 1e6, max: 250 }, bubbles: boil ? 1 : water && r.Tb > 80 ? 0.15 : 0, boil: boil ? 1 : 0, phase: S.ta });
    if (water && !ir) M.steam(F, [bb[0], bb[1], bb[2] + level + 0.004], clamp((r.Tb - 55) / 45, 0, 1) * (boil ? 1.3 : 0.8), S.ta, { rise: 0.18 });
    // a thermometer probe in the water, its readout on a little meter
    if (water) {
      const tip = [bb[0] + 0.012, bb[1] + 0.008, bb[2] + 0.012], top = [bb[0] + 0.022, bb[1] + 0.02, bb[2] + 0.16];
      R3.cylinder(F, tip, top, 0.0022, M.irc(ir, r.Tb, 0.2, '#D0D6DE'), { segments: 8, shadow: false, ambient: 0.5 });
      const m0 = [0.16, -0.16, 0.03];
      R3.tube(F, [top, [top[0] + 0.03, top[1] - 0.02, top[2] + 0.015], [top[0] + 0.07, top[1] - 0.08, 0.08], [m0[0] - 0.03, m0[1] + 0.02, 0.008], [m0[0], m0[1] + 0.03, 0.006]], 0.0021, M.irc(ir, TA, 0.95, '#23262E'), { segments: 6, round: false });
      window.BENCH.meter(F, m0, [-0.25, -0.97, 0.35], 0.08, 0.042, { title: 'PROBE', value: r.Tb.toFixed(1), unit: '°C', colour: '#FFB27A', depth: 0.028 });
    }
    // what the touch is made with: tongs gripping the beaker, or gloves beside it
    const touchAt = p.target === 'plate' ? [HP.centre[0] + 0.06, HP.centre[1] - 0.06, HP.topZ + 0.001] : [bb[0] - 0.02, bb[1] - 0.03, bb[2] + 0.05];
    if (p.protect === 'tongs') M.tongs(F, [bb[0], bb[1], bb[2] + 0.055], { ir, rb: 0.035, dir: [0.62, -0.78, 0] });
    else M.tongs(F, [0.43, 0.20, 0.005], { ir, dir: [-0.62, -0.78, 0] });
    if (!ir || cam.eye[1] < 0.3) {                                   // heat mitts hang on the rail behind the bench
      M.rail(F, -0.52, -0.16, 0.36, 0.34, { ir });
      M.mitt(F, [-0.42, 0.33, 0.16], 0.1, { ir, colour: p.protect === 'heat' ? '#E0922E' : '#B98A4A' });
      M.mitt(F, [-0.27, 0.33, 0.16], -0.1, { ir, colour: p.protect === 'heat' ? '#E0922E' : '#B98A4A' });
    }
    M.gloveBox(F, [-0.40, 0.20], 0.12, { ir });
    F.render();
    // the touch: a ring where the skin meets the target, and what the skin reaches
    const tq = cam.project(touchAt), Tt = targetT(p, r), T1 = touchOf(S, Tt);
    if (tq.ok) {
      ctx.save();
      const burnt = T1.burn != null;
      ctx.strokeStyle = p.protect === 'tongs' ? '#9FE0A8' : burnt ? '#FF6A5A' : T1.pain != null ? '#FFC04A' : '#9FE0A8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tq.x, tq.y, 9, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(tq.x, tq.y, 2.5, 0, TAU); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
      const say = p.protect === 'tongs' ? 'tongs: no skin touches it' : 'touch: skin reaches ' + T1.peak.toFixed(0) + ' °C' + (burnt ? ' — burnt at ' + sSay(T1.burn) : T1.pain != null ? ' — it hurts, no burn' : ' — safe');
      tag(ctx, tq.x - 14, tq.y - 18, say, burnt ? '#FFB0A8' : '#E8EEF8', { align: 'right', W });
      ctx.restore();
    }
    if (ir) {                                       // the camera's own overlay: its span, and the spot reading on the target
      M.irScale(ctx, W - 36, K.HDR + 30, 12, Math.min(180, H * 0.4), ir.lo, ir.hi);
      if (tq.ok) { const tg = targetOf(p), Tap = M.apparent(Tt, tg.eps, TA); tag(ctx, tq.x + 14, tq.y + 16, 'camera reads ' + Tap.toFixed(1) + ' °C (ε ' + tg.eps.toFixed(2) + ')', '#FFE9A8', { W }); }
    }
    // the card: the skin under the touch
    const at = K.cardSlot(g, S, 'under the fingertip', Math.min(250, W * 0.27), { x: W - Math.min(250, W * 0.27) - (ir ? 58 : 10), y: K.HDR + 4 });
    if (at) skinCard(g, S, at.x, at.y, at.w, T1, Tt);
    const safe = safeOf(S);
    K.header(g, on ? minSay(S.th) + ' on the hot plate: the ' + (water ? 'water is ' + r.Tb.toFixed(0) + ' °C' : 'empty beaker is ' + r.Tb.toFixed(0) + ' °C') + ' — the glass looks exactly as it did cold'
        : 'Switched off ' + minSay(S.th - HEAT_MIN) + ' ago: the plate’s top is still ' + r.Tp.toFixed(0) + ' °C, the beaker ' + r.Tb.toFixed(0) + ' °C',
      'plate top ' + r.Tp.toFixed(0) + ' °C · beaker ' + r.Tb.toFixed(1) + ' °C · a ' + p.hold + ' s touch ' + (p.protect === 'tongs' ? 'with tongs never reaches the skin' : (T1.burn != null ? 'burns in ' + sSay(T1.burn) : 'leaves no burn')) + ' · safe to touch this way ' + (safe.at == null ? 'not within the hour' : safe.at <= HEAT_MIN ? 'the whole time' : 'from ' + safe.at.toFixed(0) + ' min'),
      'nothing glows below about 525 °C · ' + (ir ? 'the thermal camera sees the heat — but shiny steel reflects the cold room' : 'switch to the thermal camera to see the heat'));
  }
  function skinCard(g, S, x, y, w, T1, Tt) {
    const ctx = g.ctx, K = kit(), M = ME(), p = S.p, T = th(g), h = Math.min(250, w * 1.0);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Under the fingertip, after ' + p.hold + ' s', x + 10, y + 8); ctx.restore();
    if (!T1.prof) {
      ctx.save(); ctx.font = mono(9.5, 500); ctx.fillStyle = T.text; ctx.textBaseline = 'top';
      K.wrapText(ctx, 'Tongs hold the beaker 13 cm from the hand. Steel carries heat slowly: warming the handle would take hours. The skin stays at 33 °C.', x + 10, y + 30, w - 20, 13);
      ctx.restore();
      return;
    }
    const tg = targetOf(p), gl = GLOVES[p.protect];
    const layers = [{ name: tg.name.replace('the ', ''), d: 0.0012, col: p.target === 'plate' ? '#DAD8CF' : tg.mat === MAT.steel ? '#9AA3AE' : '#9CC6DE' }];
    if (gl) layers.push({ name: p.protect === 'heat' ? 'heat mitt' : 'nitrile glove', d: p.protect === 'heat' ? 0.0022 : 0.00035, col: p.protect === 'heat' ? '#C99A4E' : '#6F8FD8' });
    layers.push({ name: 'epidermis', d: 0.0008, col: '#E3B69A', cells: true }, { name: 'dermis', d: 0.0022, col: '#D8958A', vessels: true, cells: true }, { name: 'fat', d: 0.0015, col: '#EFD9A6' });
    // map the model's depths onto the drawing: the last 1.2 mm of the object, the glove, 4.5 mm of skin
    const total = layers.reduce((u, Lr) => u + Lr.d, 0), objEnd = T1.depth, skin0 = 0.0012 + (gl ? layers[1].d : 0);
    const xs = [], Ts = [];
    T1.prof.x.forEach((d, i) => {
      let dd;
      if (d < objEnd - (gl ? gl.L : 0)) dd = Math.max(0, 0.0012 - (objEnd - (gl ? gl.L : 0) - d)); else if (d < objEnd) dd = 0.0012 + (d - (objEnd - gl.L)) / gl.L * layers[1].d; else dd = skin0 + (d - objEnd);
      if (dd >= 0 && dd <= total) { xs.push(dd); Ts.push(T1.prof.T[i]); }
    });
    M.skinPlate(ctx, x + 10, y + 26, w - 20, h - 76, { layers, x: xs, T: Ts }, { surface: skin0 });
    ctx.save(); ctx.font = mono(9.5, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const burnt = T1.burn != null;
    ctx.fillStyle = burnt ? '#FF9A8E' : T1.pain != null ? '#FFD27A' : '#9FE0A8';
    ctx.fillText(burnt ? 'BURN after ' + sSay(T1.burn) : T1.pain != null ? 'Pain at ' + sSay(T1.pain) + ' — no burn yet' : 'No pain, no burn', x + 10, y + h - 44);
    ctx.font = mono(9, 500); ctx.fillStyle = T['text-2'];
    ctx.fillText('surface ' + Tt.toFixed(0) + ' °C → skin ' + T1.peak.toFixed(1) + ' °C', x + 10, y + h - 29);
    ctx.fillText(T1.dose < 1 ? 'burn dose ' + (Math.floor(T1.dose * 100) / 100).toFixed(2) + ' — a burn at 1' : 'burn dose ' + (T1.dose < 10 ? T1.dose.toFixed(1) : fmtN(T1.dose)) + '× the burn threshold', x + 10, y + h - 16);
    ctx.restore();
  }

  /* ============================================================
     THE STAGE — acid: a fume cupboard, a stirrer, a dropping funnel
     ============================================================ */
  const FUNNEL_R = 0.022, FUNNEL_H = 0.10, FUNNEL_PER_M = Math.PI * 0.022 * 0.022 * 0.93 * 0.93 * 1e6;
  const ACID_TINT = '#EFE3BE', WATER_TINT = '#D2EBF8';
  function drawAcid(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), M = ME(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const A = acidOf(S), R = A.run, now = acidAt(R, S.tq), pouring = S.tq < R.tPour, into = p.order === 'acid-into-water';
    ctx.fillStyle = '#B7C0C8'; ctx.fillRect(0, 0, W, H);
    placeView(S, g, narrow ? 0 : -0.16, narrow ? 10 : 30);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    M.bench(F, -0.62, 0.62, -0.34, 0.34, { tone: '#E3E6E8', cabinet: '#9AA3AC' });
    M.fumeCupboard(F, -0.52, 0.52, -0.30, 0.32, 0.9, 0.5, { air: true, phase: S.ta });
    // the stirrer, with the beaker on it (in an ice bath if chosen)
    const HP = M.hotplate(F, [0, 0.06, 0], { top: 20, set: 0, stir: 0.6, on: true, hot: false });
    const ice = p.bath === 'ice', bz = HP.topZ + (ice ? 0.006 : 0.002), bb = [HP.centre[0], HP.centre[1], bz];
    if (ice) M.iceBath(F, [bb[0], bb[1], HP.topZ], 0.075, 0.075, {});
    const firstV = into ? p.waterV : p.acidV, inBeaker = firstV + now.V, level = inBeaker / (Math.PI * BEAKER_RIN * BEAKER_RIN * 1e6);
    const tint = RX.mix(into ? WATER_TINT : ACID_TINT, into ? ACID_TINT : WATER_TINT, clamp(now.V / Math.max(1, firstV + R.addV), 0, 0.5));
    const hot = !into && pouring && now.Ts > 100, boiling = hot;
    M.beaker(F, bb, 0.035, 0.095, level, { T: now.T, tint, marks: { perM: Math.PI * BEAKER_RIN * BEAKER_RIN * 1e6, max: 250 }, vortex: 1, swirl: pouring ? 1 : 0.2, bubbles: boiling ? 0.8 : 0, boil: boiling ? 0.8 : 0, phase: S.ta });
    M.stirBar(F, [bb[0], bb[1], bz + 0.005], 0.025, S.ta * 9, {});
    if (now.T > 60) M.steam(F, [bb[0], bb[1], bz + level + 0.004], clamp((now.T - 60) / 50, 0, 1) * (boiling ? 1.4 : 0.6), S.ta, { rise: 0.2 });
    if (boiling) M.spatter(F, [bb[0], bb[1], bz + level], 0.03, clamp((now.Ts - 100) / 40, 0.25, 1), S.ta, {});
    // the funnel on its stand, the stopcock open while it pours
    const stand = window.BENCH.clampStand(F, [-0.16, 0.16, 0], 0.62, {});
    const tipZ = bb[2] + 0.105, fTop = [bb[0], bb[1], tipZ + 0.07 + 0.008 + 0.03 + FUNNEL_H];
    R3.tube(F, [[stand[0], stand[1], fTop[2] - 0.03], [fTop[0] - 0.02, fTop[1] + 0.03, fTop[2] - 0.03], [fTop[0], fTop[1], fTop[2] - 0.03]], 0.004, '#A8B2C0', { segments: 6, round: false });
    window.BENCH.bossClamp(F, [stand[0], stand[1], fTop[2] - 0.03], {});
    const left = Math.max(0, R.addV - now.V), open = pouring ? clamp(0.25 + 0.2 * Math.log10(p.rate / 0.1), 0.2, 1) : 0;
    const FN = M.droppingFunnel(F, fTop, FUNNEL_R, FUNNEL_H, left / FUNNEL_PER_M, { tint: into ? ACID_TINT : WATER_TINT, open, marks: { perM: FUNNEL_PER_M, step: 10, label: 50, max: Math.min(140, Math.floor(FUNNEL_H * FUNNEL_PER_M / 10) * 10) } });
    if (pouring) M.dropsFall(F, FN.tip, bz + level, p.rate, S.ta, {});
    // the probe and its meter
    const tip = [bb[0] + 0.014, bb[1] - 0.008, bz + 0.015], top = [bb[0] + 0.024, bb[1] - 0.02, bz + 0.2];
    R3.cylinder(F, tip, top, 0.0022, '#D0D6DE', { segments: 8, shadow: false, ambient: 0.5 });
    const m0 = [0.2, -0.16, 0.03];
    R3.tube(F, [top, [top[0] + 0.04, top[1] - 0.03, top[2] + 0.01], [m0[0] - 0.02, m0[1] + 0.05, 0.06], [m0[0], m0[1] + 0.03, 0.006]], 0.0021, '#23262E', { segments: 6, round: false });
    window.BENCH.meter(F, m0, [-0.25, -0.97, 0.35], 0.08, 0.042, { title: 'PROBE', value: now.T.toFixed(1), unit: '°C', colour: now.T > 100 ? '#FF7A6A' : '#FFB27A', depth: 0.028 });
    // the bottles: the acid in amber glass with its hazard label; water in a wash bottle
    M.bottle(F, [0.30, 0.16, 0], { label: 'SULFURIC ACID', detail: p.strength + ' % H₂SO₄' });
    M.washBottle(F, [0.36, 0.0, 0], {});
    F.render();
    // callouts: what is in the funnel, and what is in the beaker
    const cf = cam.project([fTop[0] + FUNNEL_R, fTop[1], fTop[2] - FUNNEL_H * 0.5]), cb = cam.project([bb[0] - 0.04, bb[1], bz + 0.03]);
    if (cf.ok) tag(ctx, cf.x + 12, cf.y, (into ? p.strength + ' % acid' : 'water') + ': ' + left.toFixed(0) + ' mL left', '#E8EEF8', { W });
    if (cb.ok) tag(ctx, cb.x - 10, cb.y, (into ? 'water' : p.strength + ' % acid') + ' + ' + now.V.toFixed(0) + ' mL: ' + now.T.toFixed(0) + ' °C', now.T > 100 ? '#FFB0A8' : '#E8EEF8', { align: 'right', W });
    const what = into ? 'Acid into water' : 'Water into acid';
    K.header(g, pouring ? what + ': ' + now.V.toFixed(0) + ' mL in — ' + (hot ? 'each drop lands on acid and heats to ' + now.Ts.toFixed(0) + ' °C: it boils where it lands' + (now.T < 100 ? ', though the beaker is ' + now.T.toFixed(0) + ' °C' : '') : now.T.toFixed(0) + ' °C' + (into ? ', the acid sinks and its heat spreads through ' + p.waterV + ' mL of water' : ', each drop lands at ' + now.Ts.toFixed(0) + ' °C')) :
        'All in: ' + R.mass.toFixed(0) + ' g of ' + (100 * R.w).toFixed(0) + ' % acid — ' + (R.above > 0 ? 'on the way it passed 100 °C, and ' + R.above.toFixed(0) + ' mL of water boiled as it landed' : 'it never boiled; the hottest was ' + R.peak.toFixed(0) + ' °C'),
      'peak ' + R.peak.toFixed(0) + ' °C · now ' + now.T.toFixed(1) + ' °C · the other way round the peak is ' + A.other.peak.toFixed(0) + ' °C · the same liquid at the end either way',
      'pouring ' + p.rate.toFixed(1) + ' mL a second · ' + (ice ? 'in an ice bath' : 'in air') + ' · stirred · ×' + (S.tqk || 1).toFixed(0) + ' speed');
  }

  /* ============================================================
     THE STAGE — density: a balance, a cylinder or an overflow can, a tray of minerals
     ============================================================ */
  const CYL_G = { 10: { cap: 10, div: 0.2, big: 1, mid: 0, d: 0.013 }, 25: { cap: 25, div: 0.5, big: 5, mid: 1, d: 0.019 }, 100: { cap: 100, div: 1, big: 10, mid: 5, d: 0.029 }, 250: { cap: 250, div: 2, big: 50, mid: 10, d: 0.039 } };
  const BAL_AT = [-0.21, 0.03], CYL_AT = [0.08, 0.07], CAN_AT = [0.04, 0.08];
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const KIND = { A: 'pyrite', B: 'gold', C: 'hematite', D: 'magnetite', E: 'quartz', F: 'galena' };
  function denFrame(S) {                      // where the procedure is: weighing, carrying, lowering, reading
    const t = S.tdn;
    return { weigh: t < 2.6, carry: smooth(2.6, 4.6, t), lower: smooth(4.8, 7.6, t), read: t >= 7.6, t };
  }
  function drawDensity(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), M = ME(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const R = measure(p), Fr = denFrame(S), over = R.over, kind = KIND[p.specimen];
    ctx.fillStyle = '#C9CFD6'; ctx.fillRect(0, 0, W, H);
    placeView(S, g, narrow ? 0 : -0.15, narrow ? 10 : 30);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    if (cam.eye[1] < 0.3) M.tileWall(F, -0.9, 0.9, 0.36, 0, 0.75);
    M.bench(F, -0.62, 0.62, -0.32, 0.36);
    // the balance with its boat, and its reading as the load settles
    const pan = M.balance(F, [BAL_AT[0], BAL_AT[1], 0], { text: balanceText(S, R, Fr), settled: Fr.t > 1.6 && Fr.t < 2.6 });
    M.boat(F, pan, {});
    // the tray of mystery specimens: the one in use has left its hollow
    const slots = M.tray(F, [-0.02, -0.19], 6, ['A', 'B', 'C', 'D', 'E', 'F']);
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach((k, i) => { if (k !== p.specimen) M.mineral(F, KIND[k], slots[i], 2.2, { seed: i + 2 }); });
    // the vessel: a cylinder read before and after, or an overflow can pouring into a small cylinder
    let top, G, geo, level;
    const lowered = Fr.lower, sub = R.Vsub * lowered;
    S._armZ = (over ? 0.14 : CYL_G[p.cyl].cap * 1e-6 / (Math.PI * CYL_G[p.cyl].d * CYL_G[p.cyl].d / 4) + 0.03) + 0.09;   // the arm a little above the vessel's rim
    if (!over) {
      G = CYL_G[p.cyl]; level = R.start + sub + (Fr.read ? R.bub : 0);
      geo = M.gradCylinder(F, [CYL_AT[0], CYL_AT[1], 0], G, Math.min(level, p.cyl + G.div * 4), { menisc: 0.0022, inner: (F2, gg) => hangSpecimen(F2, S, R, Fr, [CYL_AT[0], CYL_AT[1]], gg.zOf(R.start), kind) });
      top = geo.topZ;
    } else {
      G = CYL_G[p.catchCyl];
      const can = M.eurekaCan(F, [CAN_AT[0], CAN_AT[1], 0], { bulge: lowered > 0 && lowered < 1 ? 0.001 : 0 });
      const catchAt = [can.spout[0] + 0.004, can.spout[1], 0];
      level = Math.max(0, R.trueLevel * smooth(5.2, 8.6, Fr.t));
      geo = M.gradCylinder(F, catchAt, G, Math.min(level, p.catchCyl + G.div * 4), { menisc: 0.0022 });
      if (Fr.t > 5.2 && Fr.t < 8.6) M.dropsFall(F, can.spout, geo.zOf(level), 1.2, S.ta, {});
      hangSpecimen(F, S, R, Fr, [CAN_AT[0], CAN_AT[1]], can.waterZ - 0.012, kind);
      top = 0.16;
    }
    // the stand and its arm, from which the specimen hangs on its thread
    window.BENCH.clampStand(F, [(over ? CAN_AT[0] : CYL_AT[0]) + 0.02, 0.24, 0], S._armZ + 0.03, {});
    F.render();
    // the reading, magnified: the card, with the eye that can be dragged up and down
    const cw = Math.min(250, W * 0.27), at = K.cardSlot(g, S, 'the reading, magnified', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) loupeCard(g, S, R, G, at.x, at.y, at.w, level);
    const sp = SPECIMENS[p.specimen], unit = p.units === 'kgm3' ? 'kg/m³' : 'g/cm³', k = p.units === 'kgm3' ? 1000 : 1;
    const ok = R.fits && R.covered && !R.spill;
    K.header(g, !ok ? (!R.fits ? 'Specimen ' + p.specimen + ' does not fit the ' + p.cyl + ' mL cylinder — choose a wider one, or the overflow can' : R.spill ? 'The water runs over the top — too much water to start with, or too big a specimen' : 'The specimen is not all under water: part of its volume is missed') :
        Fr.read ? 'Specimen ' + p.specimen + ', ' + sp.look + ': ' + fmtD(R.r * k, R.dr * k) + ' ' + unit + (R.cands.length === 1 ? ' — it is ' + R.cands[0] : R.cands.length ? ' — it could be ' + R.cands.join(', ') : ' — no mineral matches: look for a mistake') :
        Fr.weigh ? 'Weighing specimen ' + p.specimen + ' on the balance…' : 'Lowering it into the ' + (over ? 'overflow can' : 'cylinder') + '…',
      'mass ' + R.mr.toFixed(2) + ' ± 0.005 g · volume ' + fmtV(R.Vm, R.C.div) + ' ± ' + R.dV.toFixed(R.C.div < 0.5 ? 2 : R.C.div < 2 ? 2 : 1) + ' mL · density ± ' + (100 * R.rel).toFixed(1) + ' %',
      (over ? 'overflow can → ' + p.catchCyl + ' mL cylinder (one reading)' : p.cyl + ' mL cylinder, read before and after') + ' · 1 mL = 1 cm³ · 1 g/cm³ = 1000 kg/m³');
    if (at && Fr.read && ok) g.handle(S._eyeAt ? S._eyeAt.x : at.x + at.w - 30, S._eyeAt ? S._eyeAt.y : at.y + 80, 12, 'eye');
  }
  const fmtV = (v, div) => v.toFixed(div < 0.5 ? 2 : div < 2 ? 1 : 1);
  const fmtD = (r, dr) => { const dp = dr >= 1 ? 0 : dr >= 0.1 ? 1 : 2; return r.toFixed(dp) + ' ± ' + dr.toFixed(dp); };
  function balanceText(S, R, Fr) {
    const boat = S.p.tared ? 0 : BOAT;
    if (Fr.t < 2.6) { const f = smooth(0, 1.4, Fr.t), jit = Fr.t < 1.6 ? Math.sin(Fr.t * 37) * 0.03 * (1.6 - Fr.t) : 0; return (boat + (R.mr - boat) * f + jit).toFixed(2); }
    return boat.toFixed(2);
  }
  function hangSpecimen(F, S, R, Fr, over, waterTopZ, kind) {
    const M = ME(), V = R.V, a = Math.cbrt(V) * 0.01, p = S.p;
    const from = [BAL_AT[0], BAL_AT[1] + 0.04, 0.088], to = [over[0], over[1], waterTopZ + 0.05 + a];
    let c;
    if (Fr.t < 2.6) { M.mineral(F, kind, from, V, { seed: 3 }); return; }
    const u = Fr.carry, lift = Math.sin(Math.PI * u) * 0.1;
    c = [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u + lift + 0.02];
    if (u >= 1) c = [to[0], to[1], to[2] - (to[2] - (waterTopZ - a * 1.2 - 0.004)) * Fr.lower];
    const armZ = S._armZ || 0.3, hook = [c[0], c[1], c[2] + 0.002];
    R3.polyline(F, [hook, [c[0], c[1], armZ]], '#E8E2D0', { width: 1, alpha: 0.9, bias: -0.01 });
    R3.cylinder(F, [c[0], c[1], armZ], [c[0] + 0.02, 0.24, armZ], 0.004, '#A8B2C0', { segments: 6, shadow: false });
    M.mineral(F, kind, [c[0], c[1], c[2]], V, { seed: 3, hang: true });
  }
  function loupeCard(g, S, R, G, x, y, w, level) {
    const ctx = g.ctx, K = kit(), M = ME(), p = S.p, T = th(g), h = Math.min(250, w * 0.98);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('The reading, magnified', x + 10, y + 8); ctx.restore();
    const A = Math.PI * (G.d * 100) * (G.d * 100) / 4, menML = MENISCUS * A * 0.9;
    const trueLv = Math.max(0, level), hit = trueLv + R.off;
    const r = Math.min(w * 0.4, (h - 80) / 2), cx = x + w / 2, cy = y + 28 + r;
    const L = M.loupe(ctx, cx, cy, r, { div: G.div, big: G.big, mid: G.mid, center: trueLv + menML / 2, true: trueLv, menisc: menML, hit, readAt: p.readAt, span: G.div <= 0.2 ? 5 : 4, bore: G.d * 1000 });
    S._eyeAt = { x: L.eyeX, y: L.eyeY, Y: L.Y, pxPer: L.pxPer, cy, trueLv, A: A };
    ctx.save(); ctx.font = mono(9.5, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = Math.abs(R.off) > G.div / 4 ? '#FFB0A8' : '#9FE0A8';
    ctx.fillText('you read ' + (Math.round(hit / (G.div / 10)) * (G.div / 10)).toFixed(G.div < 0.5 ? 2 : 1) + ' mL', x + 10, y + h - 44);
    ctx.font = mono(9, 500); ctx.fillStyle = T['text-2'];
    ctx.fillText('lowest point of the meniscus: ' + trueLv.toFixed(G.div < 0.5 ? 2 : 1) + ' mL', x + 10, y + h - 30);
    ctx.fillText(p.readAt === 'top' ? 'reading the edge: high by the climb' : 'eye ' + (p.eye === 0 ? 'level with it' : Math.abs(p.eye).toFixed(1) + ' cm ' + (p.eye > 0 ? 'above' : 'below')) + ' · drag the eye', x + 10, y + h - 17);
    ctx.restore();
  }

  /* ============================================================
     THE STAGE — timing: a drop tower, two light gates, a stopwatch
     ============================================================ */
  const DROP = [-0.08, -0.02], ROD_AT = [-0.2, 0.05];
  function trialAt(S) {
    const p = S.p, k = Math.min(p.trials - 1, Math.floor(S.ttr / TRIAL_S)), u = S.ttr - k * TRIAL_S, done = S.ttr >= p.trials * TRIAL_S;
    return { k, u: done ? TRIAL_S : u, done, tau: Math.max(0, ((done ? TRIAL_S : u) - 0.4) / SLOW) };
  }
  function drawTiming(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), M = ME(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const Tm = timingOf(S), Tr = trialAt(S), B = BALLS[p.ball], rb = B.d / 2;
    ctx.fillStyle = '#C9CFD6'; ctx.fillRect(0, 0, W, H);
    placeView(S, g, narrow ? 0 : -0.17, narrow ? 16 : 34);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    if (cam.eye[1] < 0.3) M.tileWall(F, -1.2, 1.2, 0.4, 0, 1.9);
    M.bench(F, -0.7, 0.7, -0.34, 0.4);
    const sandTop = M.sandBox(F, [DROP[0], DROP[1]], { dimples: Tr.k > 0 || Tr.tau * SLOW > 0 ? [[DROP[0] + 0.01, DROP[1] - 0.005]] : [] });
    const z2 = sandTop + 0.06, z1 = z2 + p.h;
    const rod = M.towerStand(F, [DROP[0] - 0.02, DROP[1] + 0.06, 0], z1 + 0.2);
    // where the ball is: held, falling (shown four times slower), or at rest in the sand
    const dMax = z1 - sandTop, fell = Math.min(dMax, fallDist(p.ball, Tr.tau)), landed = fell >= dMax - 1e-6;
    const bottom = z1 - fell, bz = bottom + rb;
    const block1 = bottom < z1 + 0.001 && bottom + 2 * rb > z1 - 0.001 && Tr.u > 0.4, block2 = bottom < z2 && bottom + 2 * rb > z2;
    M.releaseClamp(F, [DROP[0], DROP[1], z1 + 2 * rb], rod, Tr.u > 0.4, {});
    M.dropGate(F, [DROP[0], DROP[1], z1], rod, { blocked: block1 });
    M.dropGate(F, [DROP[0], DROP[1], z2], rod, { blocked: block2 });
    window.BENCH.rule(F, [DROP[0] + 0.06, DROP[1] + 0.02, z2], [0, 0, 1], p.h, { up: [0, -1, 0], width: 0.03 });
    // the stroboscope: where the ball was every twentieth of a second
    for (let tt = 0.05; tt < Tr.tau - 1e-6; tt += 0.05) { const d = fallDist(p.ball, tt); if (d > dMax) break; M.ball(F, [DROP[0], DROP[1], z1 - d + rb], p.ball, rb, { ghost: 0.28, bias: 0.02 }); }
    M.ball(F, [DROP[0], DROP[1], landed ? sandTop + rb * 0.6 : bz], p.ball, rb, {});
    // the instruments: the gate timer and the stopwatch
    const trial = Tm.out[Tr.k] || { watch: 0, gate: 0 }, tGate = fallTime(p.ball, p.h);
    const gateShown = Tr.u <= 0.4 ? 0 : Math.min(Tr.tau, tGate) >= tGate - 1e-9 ? trial.gate : Tr.tau;
    const react = p.who === 'partner' ? 0.19 : 0, watchRun = Math.max(0, Tr.tau - react), watchShown = Tr.u <= 0.4 ? 0 : Tr.tau >= tGate + 0.1 ? trial.watch : Math.min(trial.watch, watchRun);
    window.BENCH.meter(F, [-0.46, -0.04, 0.07], [0.3, -0.95, 0.25], 0.12, 0.06, { title: 'LIGHT GATES', value: gateShown.toFixed(4), unit: 's', colour: '#7CF0B0', depth: 0.035 });
    if (window.HYDRO) window.HYDRO.stopwatch(F, [-0.36, -0.13, 0], watchShown.toFixed(2), { running: Tr.u > 0.4 && Tr.tau < tGate + 0.1 });
    R3.tube(F, [[rod[0], rod[1], z2], [rod[0] - 0.08, rod[1] - 0.04, 0.03], [-0.36, -0.02, 0.01], [-0.42, -0.03, 0.03]], 0.003, '#23262E', { segments: 5, round: false });
    F.render();
    // the release clamp is a handle: drag it up or down the rod
    const hq = cam.project([DROP[0], DROP[1], z1 + 2 * rb + 0.03]);
    if (hq.ok) g.handle(hq.x, hq.y, 14, 'release');
    const w = Tm.out.slice(0, Tr.done ? p.trials : Tr.k + (Tr.tau >= tGate + 0.1 ? 1 : 0));
    const sw = stats(w.map(q => q.watch)), sg = stats(w.map(q => q.gate)), bias = sw.mean - Tm.t;
    const cw = Math.min(250, W * 0.28), at = K.cardSlot(g, S, 'the table of drops', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) dropTable(g, S, Tm, w, at.x, at.y, at.w, Math.min(H - at.y - 50, 300));
    K.header(g, Tr.done ? p.trials + ' drops from ' + p.h.toFixed(2) + ' m: gates ' + sg.mean.toFixed(4) + ' s, stopwatch ' + sw.mean.toFixed(2) + ' ± ' + sw.sd.toFixed(2) + ' s' + (Math.abs(bias) > 0.05 ? ' — ' + Math.abs(bias).toFixed(2) + ' s ' + (bias < 0 ? 'short' : 'long') + ', however many you average' : '')
        : 'Drop ' + (Tr.k + 1) + ' of ' + p.trials + (Tr.u <= 0.4 ? ': the ' + B.name + ' is held above the top gate' : landed || Tr.tau >= tGate ? ': gates ' + trial.gate.toFixed(4) + ' s, stopwatch ' + trial.watch.toFixed(2) + ' s' : ': falling — shown four times slower'),
      'true fall time ' + Tm.t.toFixed(4) + ' s · the gates read to 0.1 ms · the stopwatch to 0.01 s, but ' + (p.who === 'partner' ? 'your finger starts it about 0.19 s late' : 'your hands start and stop it' ) + (sw.n > 1 ? ' · spread ± ' + sw.sd.toFixed(2) + ' s' : ''),
      'g from the gates: ' + (2 * p.h / (tGate * tGate)).toFixed(2) + ' m/s² · every 1/20 s the strobe leaves an image');
  }

  /* the notebook: every drop in a row, then the mean, the spread and the range */
  function dropTable(g, S, Tm, w, x, y, cw, h) {
    const ctx = g.ctx, K = kit(), T = th(g), p = S.p;
    K.card(ctx, x, y, cw, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('The table of drops', x + 10, y + 8);
    const c1 = x + 12, c2 = x + cw * 0.36, c3 = x + cw * 0.68, row = 14, top = y + 28;
    ctx.font = mono(9, 600); ctx.fillStyle = T['text-2'];
    ctx.fillText('drop', c1, top); ctx.fillText('stopwatch', c2, top); ctx.fillText('gates', c3, top);
    ctx.fillStyle = 'rgba(160,175,200,.6)'; ctx.fillText('', c1, top + 11); ctx.fillText('s', c2, top + 11); ctx.fillText('s', c3, top + 11);
    ctx.strokeStyle = 'rgba(160,175,200,.35)'; ctx.beginPath(); ctx.moveTo(x + 8, top + 24); ctx.lineTo(x + cw - 8, top + 24); ctx.stroke();
    const room = Math.max(1, Math.floor((h - 110) / row)), from = Math.max(0, w.length - room);
    ctx.font = mono(9.5, 500);
    w.slice(from).forEach((q, i) => {
      const yy = top + 30 + i * row;
      ctx.fillStyle = T['text-2']; ctx.fillText(String(from + i + 1), c1, yy);
      ctx.fillStyle = '#FFB35C'; ctx.fillText(q.watch.toFixed(2), c2, yy);
      ctx.fillStyle = '#5FE0A8'; ctx.fillText(q.gate.toFixed(4), c3, yy);
    });
    const yb = y + h - 58;
    ctx.strokeStyle = 'rgba(160,175,200,.35)'; ctx.beginPath(); ctx.moveTo(x + 8, yb - 4); ctx.lineTo(x + cw - 8, yb - 4); ctx.stroke();
    if (w.length) {
      const sw = stats(w.map(q => q.watch)), sg = stats(w.map(q => q.gate));
      [['mean', sw.mean.toFixed(3), sg.mean.toFixed(4)], ['spread (sd)', w.length > 1 ? sw.sd.toFixed(3) : '—', w.length > 1 ? (sg.sd * 1000).toFixed(2) + ' ms' : '—'], ['range', sw.min.toFixed(2) + '–' + sw.max.toFixed(2), (1000 * (sg.max - sg.min)).toFixed(1) + ' ms']].forEach((r, i) => {
        const yy = yb + i * row;
        ctx.fillStyle = T.text; ctx.font = mono(9, 600); ctx.fillText(r[0], c1, yy);
        ctx.fillStyle = '#FFB35C'; ctx.fillText(r[1], c2, yy); ctx.fillStyle = '#5FE0A8'; ctx.fillText(r[2], c3, yy);
      });
    } else { ctx.fillStyle = T['text-3']; ctx.fillText('the first drop is on its way', c1, yb); }
    ctx.restore();
  }

  /* ============================================================
     THE STAGE — graph: the notebook page and the graph paper
     ============================================================ */
  const paperCache = {};
  function ruledPaper(w, h) {
    const key = 'r' + w + 'x' + h;
    if (paperCache[key]) return paperCache[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#F6F1E4'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(90,140,200,.35)'; x.lineWidth = 1;
    for (let y = 40; y < h; y += 18) { x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(w, y + 0.5); x.stroke(); }
    x.strokeStyle = 'rgba(210,80,80,.45)'; x.beginPath(); x.moveTo(34.5, 0); x.lineTo(34.5, h); x.stroke();
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(120,90,40,.08)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    return (paperCache[key] = c);
  }
  function drawGraphDesk(S, g) {
    const ctx = g.ctx, p = S.p, K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const Gd = graphOf(S), D = Gd.D;
    // the desk: dark wood under the paper
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#3A2A1E'); bg.addColorStop(1, '#241A12'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,220,180,.04)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.moveTo(0, i * H / 40 + Math.sin(i) * 3); ctx.bezierCurveTo(W / 3, i * H / 40 + 6, W * 2 / 3, i * H / 40 - 6, W, i * H / 40 + Math.cos(i) * 3); ctx.stroke(); }
    const top = K.HDR + 10, bottom = H - 40;
    const nbW = narrow ? 0 : Math.min(250, W * 0.3), gx0 = narrow ? 10 : nbW + 26, gx1 = W - 12;
    // the notebook: the table as it was written, the outlier ringed or struck out
    if (!narrow) {
      const nx = 12, ny = top, nh = bottom - top;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.drawImage(ruledPaper(Math.round(nbW), Math.round(nh)), nx, ny); ctx.restore();
      ctx.save(); ctx.fillStyle = '#243A6A'; ctx.font = '600 11px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.textBaseline = 'alphabetic';
      K.wrapText(ctx, D.name, nx + 40, ny + 22, nbW - 50, 13, 2);
      const cx1 = nx + 40, cx2 = nx + 40 + (nbW - 50) * 0.5, y0 = ny + 58 + 18;
      ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.fillStyle = '#1F2F52';
      const hx = p.axes === 'swapped' ? D.y : D.x, hy = p.axes === 'swapped' ? D.x : D.y;
      ctx.fillText(D.x.name + (D.x.unit ? ' (' + D.x.unit + ')' : ''), cx1, y0); ctx.fillText(D.y.name + (D.y.unit ? ' (' + D.y.unit + ')' : ''), cx2, y0);
      void hx; void hy;
      ctx.font = '500 11px "IBM Plex Mono",monospace';
      D.rows.forEach((r, i) => {
        const y = y0 + 18 * (i + 1), outl = Gd.out && Gd.out.i === i;
        ctx.fillStyle = '#23334F';
        ctx.fillText(D.cats ? D.cats[r[0]] : r[0].toFixed(D.x.dp), cx1, y); ctx.fillText(r[1].toFixed(D.y.dp), cx2, y);
        if (outl) {
          ctx.strokeStyle = 'rgba(200,40,40,.85)'; ctx.lineWidth = 1.4;
          if (p.outlier === 'drop') { ctx.beginPath(); ctx.moveTo(cx1 - 4, y - 4); ctx.lineTo(cx2 + 44, y - 4); ctx.stroke(); }
          else { ctx.beginPath(); ctx.ellipse((cx1 + cx2 + 44) / 2, y - 4, (cx2 + 48 - cx1) / 2, 8, 0, 0, TAU); ctx.stroke(); }
          ctx.fillStyle = 'rgba(190,40,40,.9)'; ctx.font = 'italic 600 9px "IBM Plex Sans",sans-serif'; ctx.fillText(p.outlier === 'drop' ? '← left out' : '← check?', cx2 + 52, y); ctx.font = '500 11px "IBM Plex Mono",monospace';
        }
      });
      if (D.note && Gd.out && p.outlier === 'drop') { ctx.fillStyle = 'rgba(160,40,40,.9)'; ctx.font = 'italic 500 9px "IBM Plex Sans",sans-serif'; K.wrapText(ctx, 'Note: ' + D.note, cx1, y0 + 18 * (D.rows.length + 2), nbW - 50, 11, 3); }
      ctx.restore();
    }
    // the graph paper, and the chart drawn on it the way the student chose
    const gy0 = top, gyEnd = bottom - 52, gy1 = gyEnd - 40;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.fillStyle = '#F7F8F2'; ctx.fillRect(gx0, gy0, gx1 - gx0, gyEnd - gy0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(gx0, gy0, gx1 - gx0, gyEnd - gy0); ctx.clip();
    for (let x = gx0; x < gx1; x += 5) { ctx.strokeStyle = (Math.round((x - gx0) / 5) % 10 === 0) ? 'rgba(70,150,110,.45)' : Math.round((x - gx0) / 5) % 2 === 0 ? 'rgba(70,150,110,.18)' : 'rgba(70,150,110,.1)'; ctx.beginPath(); ctx.moveTo(x + 0.5, gy0); ctx.lineTo(x + 0.5, gyEnd); ctx.stroke(); }
    for (let y = gy0; y < gyEnd; y += 5) { ctx.strokeStyle = (Math.round((y - gy0) / 5) % 10 === 0) ? 'rgba(70,150,110,.45)' : Math.round((y - gy0) / 5) % 2 === 0 ? 'rgba(70,150,110,.18)' : 'rgba(70,150,110,.1)'; ctx.beginPath(); ctx.moveTo(gx0, y + 0.5); ctx.lineTo(gx1, y + 0.5); ctx.stroke(); }
    ctx.restore();
    const view = chartOnPaper(ctx, S, Gd, gx0 + 58, gy0 + 22, gx1 - 22, gy1);
    // what a reader sees, and what the numbers say — on a card under the paper
    const cy = bottom - 44;
    K.card(ctx, gx0, cy, gx1 - gx0, 40);
    ctx.save(); ctx.font = mono(10, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = view.misleads ? '#FFB0A8' : '#9FE0A8'; ctx.fillText(fitW(ctx, 'A reader sees: ' + view.reader, gx1 - gx0 - 20), gx0 + 10, cy + 13);
    ctx.fillStyle = '#C9D4EA'; ctx.font = mono(9.5, 500); ctx.fillText(fitW(ctx, 'The numbers say: ' + view.truth, gx1 - gx0 - 20), gx0 + 10, cy + 28);
    ctx.restore();
    K.header(g, D.name, view.what, view.rule);
  }
  const fitW = (ctx, t, w) => kit().fitText(ctx, t, w);
  /* the chart itself: axes with names and units, ticks, points appearing one by one, the chosen line */
  function chartOnPaper(ctx, S, Gd, x0, y0, x1, y1) {
    const p = S.p, D = Gd.D, sw = Gd.swapped && D.kind === 'scatter', ink = '#1D2B4A', pencil = '#2A3F6E';
    const P = Gd.P, used = Gd.used;
    const xs = P.map(q => sw ? q[1] : q[0]), ys = P.map(q => sw ? q[0] : q[1]);
    const xName = sw ? D.y : D.x, yName = sw ? D.x : D.y, yLab = Gd.lin && !sw ? 'Fall time²' : yName.name, yUnit = Gd.lin && !sw ? 's²' : yName.unit, xLab = Gd.lin && sw ? 'Fall time²' : xName.name, xUnit = Gd.lin && sw ? 's²' : xName.unit;
    const bars = D.kind === 'bars' || p.gtype === 'bars';
    let xmin = D.kind === 'bars' ? -0.6 : 0, xmax = D.kind === 'bars' ? D.rows.length - 0.4 : niceMax(Math.max(...xs));
    let ymin = 0, ymax = niceMax(Math.max(...ys) * 1.05);
    if (p.yfrom === 'data') { const lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo) * 0.25 || lo * 0.02; ymin = Math.max(0, niceFloor(lo - pad, hi - lo)); ymax = hi + pad; }
    const X = v => x0 + (v - xmin) / (xmax - xmin) * (x1 - x0), Y = v => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
    ctx.save();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0 - 6); ctx.lineTo(x0, y1); ctx.lineTo(x1 + 6, y1); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    niceTicksFor(ymin, ymax, 5).forEach(v => { ctx.beginPath(); ctx.moveTo(x0 - 4, Y(v)); ctx.lineTo(x0, Y(v)); ctx.stroke(); ctx.fillText(fmtTick(v, ymax - ymin), x0 - 6, Y(v)); });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (D.kind === 'bars') D.cats.forEach((c, i) => ctx.fillText(c, X(i), y1 + 5));
    else niceTicksFor(xmin, xmax, 6).forEach(v => { ctx.beginPath(); ctx.moveTo(X(v), y1); ctx.lineTo(X(v), y1 + 4); ctx.stroke(); ctx.fillText(fmtTick(v, xmax - xmin), X(v), y1 + 5); });
    ctx.font = '600 10.5px "IBM Plex Sans",sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(xLab + (xUnit ? ' (' + xUnit + ')' : ''), x1 + 4, y1 + 30);
    ctx.save(); ctx.translate(x0 - 44, y0); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(yLab + (yUnit ? ' (' + yUnit + ')' : ''), 0, 0); ctx.restore();
    // the marks, drawn in pencil one at a time
    const shown = Math.min(P.length, Math.floor(S.tgr / 0.55) + 1);
    if (bars) {
      P.slice(0, shown).forEach((q, i) => { const bx = D.kind === 'bars' ? i : (sw ? q[1] : q[0]), bw = D.kind === 'bars' ? 0.55 : (xmax - xmin) / (P.length * 2.5); const yy = sw ? q[0] : q[1]; ctx.fillStyle = 'rgba(60,110,190,.55)'; ctx.strokeStyle = pencil; ctx.lineWidth = 1.2; const a = X(bx - bw / 2), b = X(bx + bw / 2), t = Y(yy), bb = Y(ymin); ctx.fillRect(a, Math.min(t, bb), b - a, Math.abs(bb - t)); ctx.strokeRect(a, Math.min(t, bb), b - a, Math.abs(bb - t)); });
    } else {
      if (p.gtype === 'joined') { ctx.strokeStyle = 'rgba(40,60,110,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); P.slice(0, shown).forEach((q, i) => { const a = X(sw ? q[1] : q[0]), b = Y(sw ? q[0] : q[1]); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); }
      P.slice(0, shown).forEach((q, i) => {
        const a = X(sw ? q[1] : q[0]), b = Y(sw ? q[0] : q[1]), off = Gd.out && Gd.out.i === i;
        ctx.strokeStyle = off ? '#C02828' : pencil; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a - 4, b - 4); ctx.lineTo(a + 4, b + 4); ctx.moveTo(a - 4, b + 4); ctx.lineTo(a + 4, b - 4); ctx.stroke();
        if (off) { ctx.beginPath(); ctx.arc(a, b, 9, 0, TAU); ctx.stroke(); if (p.outlier === 'drop') { ctx.beginPath(); ctx.moveTo(a - 9, b + 9); ctx.lineTo(a + 9, b - 9); ctx.stroke(); } }
      });
    }
    // the line of best fit, ruled in ink once the points are down
    let fitLine = null;
    if (Gd.F && shown >= P.length && S.tgr > P.length * 0.55 + 0.4) {
      const f = Gd.F; ctx.strokeStyle = '#B02A2A'; ctx.lineWidth = 1.8;
      const xa = sw ? Math.min(...xs) * 0 : 0, xb = xmax;
      const line = sw ? [[f.a + f.b * 0, 0], [f.a + f.b * (ymax), ymax]] : [[xa, f.a + f.b * xa], [xb, f.a + f.b * xb]];
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      ctx.beginPath(); ctx.moveTo(X(line[0][0]), Y(line[0][1])); ctx.lineTo(X(line[1][0]), Y(line[1][1])); ctx.stroke(); ctx.restore();
      fitLine = f;
    }
    ctx.restore();
    return readerOf(S, Gd, fitLine, { ymin, ymax, bars });
  }
  function niceMax(v) { v *= 1.06; const m = Math.pow(10, Math.floor(Math.log10(v))), f = v / m; return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(k => f <= k + 1e-9)) * m; }
  function niceFloor(v, span) { const st = Math.pow(10, Math.floor(Math.log10(Math.max(1e-9, span)))) / 2; return Math.floor(v / st) * st; }
  function niceTicksFor(a, b, n) { const span = b - a, raw = span / n, m = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / m, st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * m, out = []; for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + st * 1e-6; v += st) out.push(+v.toFixed(10)); return out; }
  function fmtTick(v, span) { const dp = span < 0.05 ? 3 : span < 0.5 ? 2 : span < 5 ? 1 : 0; return v.toFixed(dp); }
  /* the naive reader: what the drawn chart says, and what the numbers say */
  function readerOf(S, Gd, F, v) {
    const p = S.p, D = Gd.D, rule = 'the thing you change goes along the bottom; the thing you measure goes up the side';
    if (p.data === 'balls') {
      const a = D.rows[0][1], b = D.rows[2][1], trueR = b / a, visR = (b - v.ymin) / (a - v.ymin);
      return { what: 'a bar for each ball · the axis starts at ' + (v.ymin ? v.ymin.toFixed(3) : '0') + ' s', rule: 'bars compare amounts only when they start from zero',
        reader: visR > 1.2 ? 'the ping-pong ball takes ' + visR.toFixed(1) + '× as long as the steel ball' : 'the three balls take almost the same time', truth: 'the ping-pong ball takes ' + (100 * (trueR - 1)).toFixed(1) + ' % longer (' + a.toFixed(4) + ' against ' + b.toFixed(4) + ' s)', misleads: visR > 1.2 };
    }
    if (p.gtype === 'bars') return { what: 'bars for measured points', rule, reader: 'separate blocks — no pattern between them', truth: 'these are measurements along a scale: points and a line of best fit show the pattern', misleads: true };
    if (p.gtype === 'joined') return { what: 'the dots joined up', rule, reader: 'the value wiggles between the measurements', truth: 'each dot is a separate measurement; a single best-fit line through them shows the trend', misleads: true };
    const sw = Gd.swapped;
    if (p.data === 'mass') {
      if (!F) return { what: 'points only', rule, reader: 'bigger pieces are heavier', truth: 'mass is proportional to volume — draw the best-fit line to find the density', misleads: false };
      const slope = sw ? 1 / F.b : F.b;
      return { what: 'best-fit line ' + (p.fit === 'zero' ? 'through zero' : 'with an intercept') + (Gd.out ? (p.outlier === 'drop' ? ' · the misread piece left out' : ' · one point is far off the line') : ''), rule,
        reader: (sw ? 'the slope is ' + F.b.toFixed(3) + ' cm³ per g' : 'the slope is ' + F.b.toFixed(2) + ' g per cm³') + (p.fit === 'line' ? ', and the line misses zero by ' + Math.abs(F.a).toFixed(2) : ''),
        truth: 'the slope of mass against volume is the density: ' + slope.toFixed(2) + ' g/cm³' + (Gd.out && p.outlier === 'keep' ? ' — pulled from 5.03 by one misread point' : ' (pyrite 5.01)'), misleads: !!(Gd.out && p.outlier === 'keep') || sw };
    }
    if (p.data === 'fall') {
      if (!Gd.lin) return { what: F ? 'a straight line through time against height' : 'fall time against drop height', rule, reader: F ? 'time grows steadily with height' : 'the higher the drop, the longer — the points bend over', truth: 'time grows with the square root of height: plot time² instead and the points fall on a straight line', misleads: !!F };
      return { what: 'time² against height' + (F ? ', best-fit line' + (p.fit === 'zero' ? ' through zero' : '') : ''), rule, reader: F ? 'a straight line: time² is proportional to height' : 'the points lie on a straight line', truth: F ? 'slope ' + F.b.toFixed(4) + ' s²/m = 2/g → g = ' + (2 / F.b).toFixed(2) + ' m/s²' : 'draw the line: its slope is 2/g', misleads: false };
    }
    return { what: 'temperature against time' + (F ? ', a straight line' : ''), rule, reader: F ? 'it cools at a steady ' + Math.abs(F.b).toFixed(2) + ' °C a minute' : 'it cools fast at first, then slowly', truth: 'the hotter it is, the faster it cools — a curve, not a straight line; the line misses the start and the end', misleads: !!F };
  }

  /* ============================================================
     THE STAGE — placeholders for the set-ups still to be drawn
     ============================================================ */
  function drawBenchOnly(S, g, title) {
    const ctx = g.ctx, cam = S.cam, K = kit(), M = ME(), W = g.w, H = g.h;
    ctx.fillStyle = '#C9CFD6'; ctx.fillRect(0, 0, W, H);
    placeView(S, g, 0, 20);
    const F = R3.Frame(ctx, cam, { ambient: 0.34, floorZ: 0 });
    M.bench(F, -0.62, 0.62, -0.32, 0.36);
    F.render();
    K.header(g, title, '', '');
  }
  function drawStage(S, g) {
    const p = S.p, K = kit();
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) {
      const h = homeFor(p.setup, S._narrow);
      S.cam.dist = h.dist; S._narrowCam = S._narrow;
    }
    if (p.setup === 'hot') return drawHot(S, g);
    if (p.setup === 'acid') return drawAcid(S, g);
    if (p.setup === 'density') return drawDensity(S, g);
    if (p.setup === 'timing') return drawTiming(S, g);
    if (p.setup === 'graph') return drawGraphDesk(S, g);
    return drawBenchOnly(S, g, SETUPS.find(s => s.value === p.setup).label);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, T = th(g);
    if (p.setup === 'hot') {
      const Hr = hotOf(S), safe = safeOf(S), K = kit();
      const Kk = K.plotKey(g, [{ label: 'plate top', c: '#FF9A5A' }, { label: 'beaker', c: '#5FB4FF' }, { label: 'burn line for this touch', c: '#FF5A5A', dash: [5, 3] }]);
      const ymax = Math.max(120, Math.ceil(Math.max(...Hr.rows.map(q => q.Tp)) / 50) * 50 + 10);
      const P = g.Plot({ xmin: 0, xmax: END_MIN, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'minutes since switching on', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.area([[0, ymax], [HEAT_MIN, ymax]], 0, g.alpha('#FF9A5A', 0.07));
        P.line(Hr.rows.map(q => [q.t, q.Tp]), '#FF9A5A', 2);
        P.line(Hr.rows.map(q => [q.t, q.Tb]), '#5FB4FF', 2);
        if (isFinite(safe.Tstar)) P.hline(safe.Tstar, '#FF5A5A', [5, 3]);
        P.vline(S.th, g.alpha(T['text-2'], 0.6), [2, 3]);
        if (safe.at != null && safe.at > HEAT_MIN) P.vline(safe.at, '#9FE0A8', [3, 3]);
      });
      P.tag(HEAT_MIN, ymax * 0.93, 'switched off', T['text-2']);
      if (safe.at != null && safe.at > HEAT_MIN) P.tag(safe.at, ymax * 0.8, 'safe from ' + safe.at.toFixed(0) + ' min', '#9FE0A8');
      if (isFinite(safe.Tstar)) P.tag(END_MIN * 0.72, safe.Tstar + ymax * 0.04, 'burns above ' + safe.Tstar.toFixed(0) + ' °C', '#FF8A80');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'acid') {
      const K = kit(), A = acidOf(S), R = A.run, O = A.other, now = acidAt(R, S.tq), into = p.order === 'acid-into-water';
      const items = [{ c: into ? '#5FB4FF' : '#FF8A5A', label: into ? 'acid poured into water' : 'water poured into acid: the beaker' }].concat(into ? [] : [{ c: '#FFD27A', label: 'where each drop lands', w: 1.5 }]).concat([{ c: g.alpha(into ? '#FF8A5A' : '#5FB4FF', 0.7), label: 'the other way round', dash: [5, 4] }, { c: '#FF5A5A', label: 'water boils', dash: [3, 3] }]);
      const Kk = K.plotKey(g, items);
      const ymax = Math.max(110, Math.ceil(Math.max(R.peak, O.peakBulk) / 20) * 20 + 10), f1 = R.addV, f2 = O.addV;
      // both runs on one scale: the fraction of the second liquid that is in
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: '% of the second liquid poured in', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        const oth = O.rows.filter(q => q.V < f2 - 1e-9), end = O.rows.find(q => q.V >= f2 - 1e-9);
        P.line(oth.concat(end ? [end] : []).map(q => [100 * q.V / f2, q.T]), g.alpha(into ? '#FF8A5A' : '#5FB4FF', 0.7), 2, [5, 4]);
        P.hline(100, '#FF5A5A', [3, 3]);
        const done = R.rows.filter(q => q.t <= S.tq && q.V <= f1 + 1e-9);
        if (!into) P.line(done.filter(q => q.V < f1 - 1e-9).map(q => [100 * q.V / f1, q.Ts]), '#FFD27A', 1.5);
        P.line(done.map(q => [100 * q.V / f1, q.T]), into ? '#5FB4FF' : '#FF8A5A', 2.5);
        P.dot(100 * now.V / f1, now.T, 4.5, '#FFFFFF');
      });
      P.tag(2, 100 + ymax * 0.03, '100 °C', '#FF8A80');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'density') {
      const K = kit(), R = measure(p), k = p.units === 'kgm3' ? 1000 : 1, lx = v => Math.log10(v);
      const items = [{ c: '#C9D4EA', label: 'handbook densities' }, { c: '#FFD27A', label: 'your measurement ± its uncertainty', w: 3 }, { c: '#9FE0A8', label: 'minerals it could be', dot: true }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: lx(2.2), xmax: lx(22), ymin: 0, ymax: 1, pad: { t: Kk.t, l: 20 }, xticks: [2.5, 3, 4, 5, 6, 8, 10, 15, 20].map(lx), yticks: [], xlabel: 'density, ' + (k > 1 ? 'kg/m³' : 'g/cm³') + ' (a log scale)', xfmt: v => fmtN(Math.pow(10, v) * k * (k > 1 ? 1 : 100) / (k > 1 ? 1 : 100)) === 'NaN' ? '' : (k > 1 ? fmtN(Math.pow(10, v) * 1000) : (+Math.pow(10, v).toFixed(1)).toString()), yfmt: () => '' }).frame();
      const ctx = g.ctx;
      P.clip(() => {
        // labels stacked in rows so neighbours (pyrite, magnetite, hematite) never overwrite each other
        ctx.save(); ctx.font = mono(9, 600);
        const rows = [];
        MINERALS.forEach(([n, d]) => {
          const x = P.X(lx(d)), w = ctx.measureText(n).width + 8;
          let r = 0; while (rows[r] != null && rows[r] > x - w / 2) r++;
          rows[r] = x + w / 2;
          const c = R.cands.includes(n) ? '#9FE0A8' : 'rgba(201,212,234,.6)', y1 = 0.36 + r * 0.1;
          P.line([[lx(d), 0.06], [lx(d), y1]], c, R.cands.includes(n) ? 2 : 1.2);
          ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(n, x, P.Y(y1) - 2);
        });
        ctx.restore();
        if (R.fits && R.covered && !R.spill) {
          const lo = Math.max(2.2, R.r - R.dr), hi = Math.min(22, R.r + R.dr);
          P.area([[lx(lo), 0.86], [lx(hi), 0.86]], 0.72, g.alpha('#FFD27A', 0.25));
          P.line([[lx(lo), 0.79], [lx(hi), 0.79]], '#FFD27A', 3);
          P.line([[lx(lo), 0.74], [lx(lo), 0.84]], '#FFD27A', 2); P.line([[lx(hi), 0.74], [lx(hi), 0.84]], '#FFD27A', 2);
          P.dot(lx(clamp(R.r, 2.2, 22)), 0.79, 5, '#FFD27A', 'rgba(0,0,0,.6)');
        }
      });
      if (R.fits && R.covered && !R.spill) P.tag(lx(clamp(R.r, 2.3, 16)), 0.93, fmtD(R.r * k, R.dr * k) + (k > 1 ? ' kg/m³' : ' g/cm³'), '#FFD27A', 'center');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'timing') {
      const K = kit(), Tm = timingOf(S), Tr = trialAt(S), n = Tr.done ? p.trials : Tr.k + (Tr.tau >= fallTime(p.ball, p.h) + 0.1 ? 1 : 0), w = Tm.out.slice(0, n);
      const items = [{ c: '#FFB35C', dot: true, label: 'stopwatch' }, { c: '#5FE0A8', dot: true, label: 'light gates' }, { c: '#FFFFFF', label: 'the true fall time', dash: [5, 4] }, { c: 'rgba(255,179,92,.35)', box: true, label: 'stopwatch mean ± spread' }];
      const Kk = K.plotKey(g, items);
      const ys = Tm.out.map(q => q.watch).concat([Tm.t]), y0 = Math.max(0, Math.floor((Math.min(...ys) - 0.05) * 20) / 20), y1 = Math.ceil((Math.max(...ys) + 0.05) * 20) / 20;
      const P = g.Plot({ xmin: 0.5, xmax: p.trials + 0.5, ymin: y0, ymax: y1, pad: { t: Kk.t }, xlabel: 'drop number', ylabel: 'time, s', xfmt: v => Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : '', yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => {
        if (n > 1) { const st = stats(w.map(q => q.watch)); P.area([[0.5, st.mean + st.sd], [p.trials + 0.5, st.mean + st.sd]], st.mean - st.sd, g.alpha('#FFB35C', 0.12)); P.hline(st.mean, g.alpha('#FFB35C', 0.8), [2, 3]); }
        P.hline(Tm.t, '#FFFFFF', [5, 4]);
        w.forEach((q, i) => { P.dot(i + 1, q.watch, 4, '#FFB35C'); P.dot(i + 1, q.gate, 3.2, '#5FE0A8'); });
      });
      P.tag(0.6, Tm.t, 'true ' + Tm.t.toFixed(4) + ' s', '#FFFFFF', null, -8);
      Kk.draw(P);
      return;
    }
    if (p.setup === 'graph') {
      const K = kit(), Gd = graphOf(S), D = Gd.D;
      if (D.kind === 'bars') {                                   // the honest version: bars from zero
        const items = [{ c: 'rgba(95,180,255,.7)', box: true, label: 'mean fall time, the axis from zero' }];
        const Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: -0.6, xmax: 2.6, ymin: 0, ymax: 0.5, pad: { t: Kk.t }, xticks: [0, 1, 2], xfmt: v => D.cats[Math.round(v)] || '', ylabel: 's', yfmt: v => v.toFixed(1) }).frame();
        D.rows.forEach((r, i) => { P.bar(i, r[1], 0.28, 0, 'rgba(95,180,255,.7)'); P.tag(i, r[1] + 0.02, r[1].toFixed(4) + ' s', '#C9D4EA', 'center'); });
        Kk.draw(P);
        return;
      }
      // the residuals: what the line leaves over — a scatter about zero is a good fit, a pattern is not
      const F = Gd.F, P0 = Gd.P;
      const items = [{ c: '#FFB35C', dot: true, label: 'measured − line' }, { c: '#FF5A5A', dot: true, label: 'the outlier' }, { c: 'rgba(201,212,234,.5)', label: 'zero: on the line', dash: [4, 3] }];
      const Kk = K.plotKey(g, items, F ? '' : 'draw a best-fit line to see its residuals');
      const res = F ? P0.map(([x, y]) => [x, y - F.a - F.b * x]) : [];
      const m = Math.max(1e-9, ...res.map(r => Math.abs(r[1]))) * 1.25;
      const xmax = Math.max(...P0.map(q => q[0])) * 1.08;
      const P = g.Plot({ xmin: 0, xmax, ymin: -m, ymax: m, pad: { t: Kk.t }, xlabel: D.x.name + (D.x.unit ? ', ' + D.x.unit : ''), ylabel: 'residual', xfmt: v => v.toFixed(xmax < 3 ? 1 : 0), yfmt: v => v.toFixed(m < 0.01 ? 4 : m < 1 ? 2 : 1) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.5)', [4, 3]); res.forEach((r, i) => { P.line([[r[0], 0], [r[0], r[1]]], 'rgba(255,179,92,.5)', 1); P.dot(r[0], r[1], 4, Gd.out && Gd.out.i === i ? '#FF5A5A' : '#FFB35C'); }); });
      Kk.draw(P);
      return;
    }
    g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 1 }).frame();
  }
  function plot2(S, g) {
    const p = S.p, T = th(g);
    if (p.setup === 'hot') {
      const K = kit(), r = rowAt(hotOf(S).rows, S.th), Tt = targetT(p, r), T1 = touchOf(S, Tt);
      const items = [{ label: 'burn threshold (Moritz–Henriques)', c: '#FF5A5A' }, { label: 'skin under this touch', c: '#FFD27A', w: 3 }];
      const Kk = K.plotKey(g, items);
      const lx = v => Math.log10(v);
      const P = g.Plot({ xmin: -1, xmax: lx(300), ymin: 30, ymax: 100, pad: { t: Kk.t }, xticks: [0.1, 0.3, 1, 3, 10, 30, 100, 300].map(lx), xlabel: 'seconds in contact', ylabel: 'skin °C', xfmt: v => { const s = Math.pow(10, v); return s < 1 ? s.toFixed(1) : s.toFixed(0); }, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        const curve = [];
        for (let T0 = 44.2; T0 <= 100; T0 += 0.4) { const tb = burnTime(T0); if (tb < 400 && tb > 0.08) curve.push([lx(tb), T0]); }
        P.area(curve, 100, g.alpha('#FF5A5A', 0.10));
        P.line(curve, '#FF5A5A', 2);
        P.hline(45, g.alpha('#FFD27A', 0.5), [3, 3]);
        const pts = T1.path.filter(q => q.t > 0.09).map(q => [lx(q.t), q.Ts]);
        if (pts.length > 1) P.line(pts, '#FFD27A', 3);
        if (T1.burn != null) P.dot(lx(Math.max(0.1, T1.burn)), T1.path.find(q => q.t >= T1.burn - 1e-9) ? T1.path.find(q => q.t >= T1.burn - 1e-9).Ts : T1.peak, 5, '#FF5A5A');
      });
      P.tag(lx(0.15), 47, 'pain 45 °C', '#FFD27A');
      P.tag(lx(30), 88, 'burn', '#FF8A80');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'acid') {
      const K = kit(), L2 = rateLandscape(S);
      const items = [{ c: '#FF8A5A', label: 'water into acid' }, { c: '#5FB4FF', label: 'acid into water' }, { c: '#C9D4EA', label: 'dashed: in an ice bath', dash: [5, 4] }, { c: '#FFFFFF', dot: true, label: 'this pour' }];
      const Kk = K.plotKey(g, items);
      const ymax = Math.max(120, Math.ceil(Math.max(...L2.curves.flatMap(c => c.pts.map(q => q[1]))) / 20) * 20 + 10), lx = v => Math.log10(v);
      const P = g.Plot({ xmin: lx(0.1), xmax: lx(5), ymin: 0, ymax, pad: { t: Kk.t }, xticks: [0.1, 0.2, 0.5, 1, 2, 5].map(lx), xlabel: 'pouring rate, mL a second', ylabel: 'hottest °C', xfmt: v => { const r = Math.pow(10, v); return r < 1 ? r.toFixed(1) : r.toFixed(0); }, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.hline(100, g.alpha('#FF5A5A', 0.7), [3, 3]);
        L2.curves.forEach(c => P.line(c.pts.map(q => [lx(q[0]), q[1]]), c.order === 'water-into-acid' ? '#FF8A5A' : '#5FB4FF', 2, c.bath === 'ice' ? [5, 4] : null));
        P.dot(lx(p.rate), acidOf(S).run.peak, 5, '#FFFFFF', 'rgba(0,0,0,.5)');
      });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'density') {
      const K = kit(), R = measure(p), lx = v => Math.log10(v);
      const lines = [['before', 10, '#7FD4FF'], ['before', 25, '#5FB4FF'], ['before', 100, '#3F84D8'], ['before', 250, '#2A5AA8'], ['overflow', 10, '#FFB35C'], ['overflow', 25, '#FF8A4C']];
      const items = [{ c: '#5FB4FF', label: 'before-and-after in a 10 / 25 / 100 / 250 mL cylinder' }, { c: '#FF8A4C', label: 'overflow can into a 10 / 25 mL cylinder' }, { c: '#9FE0A8', label: 'fine enough to tell pyrite from hematite', dash: [4, 3] }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: lx(0.4), xmax: lx(20), ymin: 0, ymax: 40, pad: { t: Kk.t }, xticks: [0.5, 1, 2, 5, 10, 20].map(lx), xlabel: 'specimen volume, cm³', ylabel: 'uncertainty in density, %', xfmt: v => (+Math.pow(10, v).toFixed(1)).toString(), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.hline(2.4, '#9FE0A8', [4, 3]);
        lines.forEach(([m, c, col]) => {
          const pts = []; for (let v = 0.4; v <= 20.01; v *= 1.08) if (m === 'overflow' ? v <= c : v <= c * 0.9 && widthOf(v) <= CYL[c].d - 0.1) pts.push([lx(v), 100 * relOf(m, c, v)]);
          P.line(pts, col, 2);
          const last = pts[pts.length - 1];                      // name each curve where it ends: the biggest specimen that fits
          if (last) {
            const ctx = g.ctx, X = P.X(last[0]), edge = X > P.x1 - 70;
            ctx.save(); ctx.font = mono(9, 600); ctx.fillStyle = col; ctx.textAlign = edge ? 'right' : 'left'; ctx.textBaseline = 'middle';
            ctx.fillText((m === 'overflow' ? 'can → ' : '') + c + ' mL', edge ? X - 4 : X + 4, P.Y(clamp(last[1], 1.5, 38)) - (edge ? 9 : 0)); ctx.restore();
          }
        });
        if (R.fits && R.covered && !R.spill) P.dot(lx(R.V), 100 * R.rel, 5.5, '#FFFFFF', 'rgba(0,0,0,.6)');
      });
      P.tag(lx(0.45), 4.2, 'enough to tell pyrite (5.01) from hematite (5.26)', '#9FE0A8');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'timing') {
      const K = kit(), Tm = timingOf(S), Tr = trialAt(S), n = Tr.done ? p.trials : Tr.k + (Tr.tau >= fallTime(p.ball, p.h) + 0.1 ? 1 : 0), w = Tm.out.slice(0, n);
      const items = [{ c: '#FFB35C', label: 'stopwatch: the average so far' }, { c: 'rgba(255,179,92,.3)', box: true, label: '± its uncertainty (spread ÷ √n)' }, { c: '#5FE0A8', label: 'light gates' }, { c: '#FFFFFF', label: 'true', dash: [5, 4] }];
      const Kk = K.plotKey(g, items);
      const run = [], band = [];
      for (let i = 1; i <= n; i++) { const st = stats(w.slice(0, i).map(q => q.watch)); run.push([i, st.mean]); band.push([i, st.mean, i > 1 ? st.se : 0.05]); }
      const lo = Math.min(Tm.t, ...band.map(b => b[1] - b[2])) - 0.03, hi = Math.max(Tm.t, ...band.map(b => b[1] + b[2])) + 0.03;
      const P = g.Plot({ xmin: 1, xmax: Math.max(2, p.trials), ymin: Math.max(0, lo), ymax: hi, pad: { t: Kk.t }, xlabel: 'number of drops averaged', ylabel: 'time, s', xfmt: v => Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : '', yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => {
        if (band.length > 1) { const ctx = g.ctx; ctx.save(); ctx.fillStyle = g.alpha('#FFB35C', 0.18); ctx.beginPath(); band.forEach((b, i) => { const X = P.X(b[0]), Y = P.Y(b[1] + b[2]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); for (let i = band.length - 1; i >= 0; i--) ctx.lineTo(P.X(band[i][0]), P.Y(band[i][1] - band[i][2])); ctx.closePath(); ctx.fill(); ctx.restore(); }
        P.hline(Tm.t, '#FFFFFF', [5, 4]);
        if (n) P.hline(stats(w.map(q => q.gate)).mean, '#5FE0A8');
        P.line(run, '#FFB35C', 2.5);
        run.forEach(q => P.dot(q[0], q[1], 2.5, '#FFB35C'));
      });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'graph') {
      const K = kit(), Gd = graphOf(S), D = Gd.D;
      if (p.data === 'mass') {                                  // each piece's own density: the misread one stands out
        const items = [{ c: '#FFB35C', dot: true, label: 'mass ÷ volume, piece by piece' }, { c: '#9FE0A8', label: 'pyrite 5.01 g/cm³', dash: [4, 3] }];
        const Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: 0.5, xmax: 6.5, ymin: 3.5, ymax: 5.8, pad: { t: Kk.t }, xticks: [1, 2, 3, 4, 5, 6], xlabel: 'piece', ylabel: 'g/cm³', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
        P.hline(5.01, '#9FE0A8', [4, 3]);
        D.rows.forEach((r, i) => P.dot(i + 1, r[1] / r[0], 5, Gd.out && Gd.out.i === i ? '#FF5A5A' : '#FFB35C'));
        Kk.draw(P);
        return;
      }
      if (p.data === 'fall') {                                  // the same drops, plotted both ways
        const items = [{ c: '#5FB4FF', dot: true, label: 'time against height: a curve' }, { c: '#FFB35C', dot: true, label: 'time² against height: a line' }];
        const Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: 0, xmax: 1.5, ymin: 0, ymax: 0.6, pad: { t: Kk.t }, xlabel: 'drop height, m', ylabel: 's  and  s²', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(1) }).frame();
        P.clip(() => { const c = []; for (let h = 0; h <= 1.5; h += 0.02) c.push([h, fallTime('steel', h)]); P.line(c, g.alpha('#5FB4FF', 0.5), 1.5); P.line([[0, 0], [1.5, 1.5 * 2 / 9.81]], g.alpha('#FFB35C', 0.5), 1.5); D.rows.forEach(([h, t]) => { P.dot(h, t, 4, '#5FB4FF'); P.dot(h, t * t, 4, '#FFB35C'); }); });
        Kk.draw(P);
        return;
      }
      if (p.data === 'cool') {                                  // how fast it cools, against how hot it is: Newton's law is a straight line
        const R = D.rows, pts = [];
        for (let i = 0; i < R.length - 1; i++) pts.push([(R[i][1] + R[i + 1][1]) / 2, -(R[i + 1][1] - R[i][1]) / (R[i + 1][0] - R[i][0])]);
        const items = [{ c: '#FFB35C', dot: true, label: 'cooling rate between readings' }, { c: 'rgba(201,212,234,.6)', label: 'room temperature, 20 °C', dash: [4, 3] }];
        const Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: 15, xmax: 100, ymin: 0, ymax: Math.max(...pts.map(q => q[1])) * 1.2, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: '°C per min', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
        P.vline(20, 'rgba(201,212,234,.6)', [4, 3]);
        pts.forEach(q => P.dot(q[0], q[1], 4.5, '#FFB35C'));
        Kk.draw(P);
        return;
      }
      // balls: how tall the ping-pong bar looks, against where the axis starts
      const a = D.rows[0][1], b = D.rows[2][1], items = [{ c: '#FF8A80', label: 'how many times taller its bar looks' }, { c: '#9FE0A8', label: 'how many times longer it really takes', dash: [4, 3] }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 0, xmax: 0.45, ymin: 0.9, ymax: 4, pad: { t: Kk.t }, xlabel: 'the axis starts at, s', ylabel: 'ratio', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { const c = []; for (let lo = 0; lo <= 0.449; lo += 0.002) c.push([lo, (b - lo) / (a - lo)]); P.line(c, '#FF8A80', 2); P.hline(b / a, '#9FE0A8', [4, 3]); });
      Kk.draw(P);
      return;
    }
    g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 1 }).frame();
  }
  const RATES = [0.1, 0.15, 0.25, 0.4, 0.6, 1, 1.5, 2.5, 4, 5];
  function rateLandscape(S) {
    const p = S.p, key = [p.acidV, p.waterV, p.strength].join('|');
    if (S._rl && S._rl.key === key) return S._rl;
    const curves = [];
    ['water-into-acid', 'acid-into-water'].forEach(order => ['air', 'ice'].forEach(bath => curves.push({ order, bath, pts: RATES.map(r => [r, dilute({ order, acidV: p.acidV, waterV: p.waterV, strength: p.strength, rate: r, bath }).peak]) })));
    S._rl = { key, curves };
    return S._rl;
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'hot') {
      const r = rowAt(hotOf(S).rows, S.th), Tt = targetT(p, r), T1 = touchOf(S, Tt), safe = safeOf(S), tg = targetOf(p);
      return [
        { label: 'Time', value: S.th.toFixed(1), unit: 'min', hint: S.th < HEAT_MIN ? 'heating' : 'switched off at 15' },
        { label: 'Plate top', value: r.Tp.toFixed(0), unit: '°C', flag: r.Tp > 50 ? 'warn' : '', hint: 'looks the same at 20 and at 350' },
        { label: 'Beaker', value: r.Tb.toFixed(1), unit: '°C', flag: r.Tb > 55 ? 'warn' : '', hint: p.contents === 'water' ? 'water holds it at ≤ 100' : 'empty: no limit' },
        { label: 'Skin reaches', value: T1.peak.toFixed(1), unit: '°C', flag: T1.burn != null ? 'crit' : T1.pain != null ? 'warn' : '', hint: p.protect === 'tongs' ? 'no contact' : 'contact ' + ((eff(tg.mat) * Tt + eff(MAT.skin) * 33) / (eff(tg.mat) + eff(MAT.skin))).toFixed(0) + ' °C bare' },
        { label: 'Burn', value: T1.burn != null ? sSay(T1.burn) : 'none', flag: T1.burn != null ? 'crit' : 'accent', hint: 'in a ' + p.hold + ' s hold' },
        { label: 'Safe from', value: safe.at == null ? '> 60' : safe.at <= HEAT_MIN ? 'always' : safe.at.toFixed(0), unit: safe.at == null || safe.at > HEAT_MIN ? 'min' : '', hint: isFinite(safe.Tstar) ? 'below ' + safe.Tstar.toFixed(0) + ' °C' : 'never burns' }
      ];
    }
    if (p.setup === 'acid') {
      const A = acidOf(S), R = A.run, now = acidAt(R, S.tq), into = p.order === 'acid-into-water';
      const q = now.V > 0 ? (() => { const f = liquidOf(into ? 'water' : 'acid', into ? p.waterV : p.acidV, p.strength), a = liquidOf(into ? 'acid' : 'water', now.V, p.strength); const m = { na: f.na + a.na, nw: f.nw + a.nw, m: f.m + a.m }; return (hMix(f) + hMix(a) - hMix(m)) / 1000; })() : 0;
      return [
        { label: 'Poured in', value: now.V.toFixed(1), unit: 'mL', hint: 'of ' + R.addV + ' mL of ' + (into ? 'acid' : 'water') },
        { label: 'Temperature', value: now.T.toFixed(1), unit: '°C', flag: now.T > 100 ? 'crit' : now.T > 60 ? 'warn' : '', hint: 'the probe' },
        { label: 'Hottest', value: R.peak.toFixed(0), unit: '°C', flag: R.peak > 100 ? 'crit' : '', hint: into ? 'the other way: ' + A.other.peak.toFixed(0) + ' °C' : 'where drops land · the beaker ' + R.peakBulk.toFixed(0) },
        { label: 'Boiled on landing', value: R.above.toFixed(1), unit: 'mL', flag: R.above > 0 ? 'crit' : 'accent', hint: into ? 'acid sinks: its heat stays under water' : 'water that heated past 100 °C where it landed' },
        { label: 'Acid in the mix', value: (100 * now.w).toFixed(0), unit: '% by mass', hint: 'ends at ' + (100 * R.w).toFixed(0) + ' %' },
        { label: 'Heat released', value: q.toFixed(1), unit: 'kJ', hint: 'Thomsen’s heat of dilution' }
      ];
    }
    if (p.setup === 'density') {
      const R = measure(p), k = p.units === 'kgm3' ? 1000 : 1, unit = k > 1 ? 'kg/m³' : 'g/cm³', ok = R.fits && R.covered && !R.spill;
      return [
        { label: 'Mass', value: R.mr.toFixed(2), unit: 'g', hint: p.tared ? '± 0.005 · tared' : 'includes the 1.87 g boat!' , flag: p.tared ? '' : 'warn' },
        { label: R.over ? 'Overflow' : 'Before → after', value: R.over ? fmtV(R.V2, R.C.div) : fmtV(R.V1, R.C.div) + ' → ' + fmtV(R.V2, R.C.div), unit: 'mL', hint: '± ' + (R.C.div / 2) + ' mL a reading' },
        { label: 'Volume', value: ok ? fmtV(R.Vm, R.C.div) : '—', unit: 'cm³', hint: '± ' + R.dV.toFixed(2) + ' · 1 mL = 1 cm³' },
        { label: 'Density', value: ok ? fmtD(R.r * k, R.dr * k) : '—', unit, flag: 'accent', hint: '± ' + (100 * R.rel).toFixed(1) + ' %' },
        { label: 'It could be', value: ok ? (R.cands.length ? R.cands.slice(0, 3).join(', ') + (R.cands.length > 3 ? '…' : '') : 'nothing') : '—', flag: ok && R.cands.length === 1 ? 'accent' : ok && !R.cands.length ? 'crit' : 'warn', hint: ok && R.cands.length === 1 ? 'identified' : ok && !R.cands.length ? 'a systematic error?' : 'not precise enough' },
        { label: 'True density', value: (densityOf(R.mineral) * k).toFixed(k > 1 ? 0 : 2), unit, hint: 'handbook: ' + R.mineral }
      ];
    }
    if (p.setup === 'timing') {
      const Tm = timingOf(S), Tr = trialAt(S), n = Tr.done ? p.trials : Tr.k + (Tr.tau >= fallTime(p.ball, p.h) + 0.1 ? 1 : 0), w = Tm.out.slice(0, n), sw = stats(w.map(q => q.watch)), sg = stats(w.map(q => q.gate));
      return [
        { label: 'Drops done', value: n + ' of ' + p.trials, hint: 'from ' + p.h.toFixed(2) + ' m' },
        { label: 'Light gates', value: n ? sg.mean.toFixed(4) : '—', unit: 's', flag: 'accent', hint: n > 1 ? 'spread ± ' + (sg.sd * 1000).toFixed(2) + ' ms' : 'reads to 0.1 ms' },
        { label: 'Stopwatch', value: n ? sw.mean.toFixed(2) : '—', unit: 's', flag: n && Math.abs(sw.mean - Tm.t) > 0.05 ? 'warn' : '', hint: n > 1 ? '± ' + sw.sd.toFixed(2) + ' spread · ± ' + sw.se.toFixed(3) + ' mean' : 'reads to 0.01 s' },
        { label: 'Stopwatch range', value: n ? sw.min.toFixed(2) + '–' + sw.max.toFixed(2) : '—', unit: 's', hint: 'lowest to highest' },
        { label: 'True fall time', value: Tm.t.toFixed(4), unit: 's', hint: 'with air drag: +' + ((Tm.t - Math.sqrt(2 * p.h / G)) * 1000).toFixed(1) + ' ms' },
        { label: 'g from the gates', value: n ? (2 * p.h / (sg.mean * sg.mean)).toFixed(2) : '—', unit: 'm/s²', hint: 'true 9.81 · 2h/t²' }
      ];
    }
    if (p.setup === 'graph') {
      const Gd = graphOf(S), D = Gd.D, F = Gd.F;
      const r2 = F ? (() => { const ys = Gd.used.map(q => q[1]), my = ys.reduce((u, v) => u + v, 0) / ys.length, ssr = Gd.used.reduce((u, [x, y]) => u + (y - F.a - F.b * x) ** 2, 0), sst = ys.reduce((u, v) => u + (v - my) ** 2, 0); return 1 - ssr / sst; })() : null;
      return [
        { label: 'Rows', value: String(D.rows.length), hint: Gd.out ? (p.outlier === 'drop' ? '1 left out' : '1 far off the line') : 'all in' },
        { label: 'Slope', value: F ? F.b.toFixed(Math.abs(F.b) < 1 ? 4 : 2) : '—', unit: F ? (Gd.lin ? 's²/m' : (D.y.unit + '/' + D.x.unit)) : '', flag: F ? 'accent' : '', hint: p.data === 'mass' && F ? 'the density' : Gd.lin && F ? 'g = ' + (2 / F.b).toFixed(2) + ' m/s²' : '' },
        { label: 'Intercept', value: F ? F.a.toFixed(Math.abs(F.a) < 1 ? 3 : 1) : '—', hint: p.fit === 'zero' ? 'forced through zero' : 'where the line meets the axis' },
        { label: 'How well it fits', value: r2 == null ? '—' : r2.toFixed(4), hint: 'R²: 1 is perfect' },
        { label: 'Outlier', value: Gd.out ? 'row ' + (Gd.out.i + 1) : 'none', flag: Gd.out ? 'warn' : '', hint: Gd.out ? Gd.out.z.toFixed(0) + '× the scatter of the rest' : '> 3× the scatter' }
      ];
    }
    return [{ label: 'Set-up', value: p.setup }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'hot') {
      const r = rowAt(hotOf(S).rows, S.th), Tt = targetT(p, r), tg = targetOf(p), eo = eff(tg.mat), es = eff(MAT.skin);
      return E.v('T') + E.sub('contact') + ' ' + E.op('=') + ' ' + E.frac(E.v('e') + E.sub('obj') + '·' + E.v('T') + E.sub('obj') + ' + ' + E.v('e') + E.sub('skin') + '·' + E.v('T') + E.sub('skin'), E.v('e') + E.sub('obj') + ' + ' + E.v('e') + E.sub('skin')) +
        ' ' + E.op('=') + ' ' + E.frac(E.n(eo, '') + '·' + E.n(Tt, '°C') + ' + ' + E.n(es, '') + '·33', E.n(eo + es, '')) + ' ' + E.op('=') + ' ' + E.n((eo * Tt + es * 33) / (eo + es), '°C');
    }
    if (p.setup === 'acid') {
      const A = acidOf(S), now = acidAt(A.run, S.tq), into = p.order === 'acid-into-water';
      const f = liquidOf(into ? 'water' : 'acid', into ? p.waterV : p.acidV, p.strength), a = liquidOf(into ? 'acid' : 'water', now.V, p.strength);
      const na = f.na + a.na, nw = f.nw + a.nw, n = na > 0 ? nw / na : 0;
      return E.v('Q') + ' ' + E.op('=') + ' 74.73 ' + E.frac(E.v('n'), E.v('n') + ' + 1.798') + ' kJ per mol of acid,  ' + E.v('n') + ' ' + E.op('=') + ' ' + E.frac('water, mol', 'acid, mol') + ' ' + E.op('=') + ' ' + E.n(n, '') + '  →  ' + E.v('Q') + ' ' + E.op('=') + ' ' + E.n(QTH(n), 'kJ/mol');
    }
    if (p.setup === 'density') {
      const R = measure(p), k = p.units === 'kgm3' ? 1000 : 1;
      return E.v('ρ') + ' ' + E.op('=') + ' ' + E.frac(E.v('m'), E.v('V')) + ' ' + E.op('=') + ' ' + E.frac(E.n(R.mr, 'g'), E.n(R.Vm, 'cm³')) + ' ' + E.op('=') + ' ' + E.n(R.r * k, k > 1 ? 'kg/m³' : 'g/cm³') +
        ',   ' + E.frac('δ' + E.v('ρ'), E.v('ρ')) + ' ' + E.op('=') + ' √(' + E.frac('δ' + E.v('m'), E.v('m')) + '² + ' + E.frac('δ' + E.v('V'), E.v('V')) + '²) ' + E.op('=') + ' ' + E.n(100 * R.rel, '%');
    }
    if (p.setup === 'timing') {
      const t = fallTime(p.ball, p.h);
      return E.v('h') + ' ' + E.op('=') + ' ½' + E.v('g') + E.v('t') + '²  →  ' + E.v('g') + ' ' + E.op('=') + ' ' + E.frac('2' + E.v('h'), E.v('t') + '²') + ' ' + E.op('=') + ' ' + E.frac('2 × ' + E.n(p.h, 'm'), '(' + E.n(t, 's') + ')²') + ' ' + E.op('=') + ' ' + E.n(2 * p.h / (t * t), 'm/s²');
    }
    if (p.setup === 'graph') {
      const Gd = graphOf(S), F = Gd.F;
      if (!F) return 'a best-fit line:  ' + E.v('y') + ' ' + E.op('=') + ' ' + E.v('a') + ' + ' + E.v('b') + E.v('x') + '  (choose one on the deck)';
      return E.v('y') + ' ' + E.op('=') + ' ' + E.n(F.a, '') + ' + ' + E.n(F.b, '') + '·' + E.v('x') + ',   ' + E.v('b') + ' ' + E.op('=') + ' ' + E.frac('Σ(' + E.v('x') + ' − x̄)(' + E.v('y') + ' − ȳ)', 'Σ(' + E.v('x') + ' − x̄)²') + '  — the least-squares slope';
    }
    return '';
  }
  const EQ_NOTE = {
    hot: 'e = √(kρc), the effusivity: how fast a material can hand over heat at its surface (glass 1453, steel 7950, skin 1176). The touch settles between the two temperatures, nearer the one with more effusivity — steel almost at its own temperature, glass about halfway.',
    acid: 'Thomsen measured the heat released as sulfuric acid takes up water. The first water a strong acid meets releases the most: 41.6 kJ for every mole of water — 2.3 kJ a gram, almost enough to boil that gram. Pour water in and each drop meets strong acid; pour acid in and each drop meets a lot of water. The total is the same; where it goes is not.',
    density: 'A reading is claimed to half its smallest division; two readings subtracted add their uncertainties (in quadrature). The balance’s 0.005 g hardly matters — the volume decides. One reading in a fine cylinder beats two in a coarse one. And 1 cm³ of water is 1 mL; 1 g/cm³ is 1000 kg/m³, the same density in SI units.',
    timing: 'Averaging many drops shrinks the random scatter (by √n) but not a steady mistake: if your finger always starts the watch 0.19 s late, the average is 0.19 s short however many drops you time. Light gates have no reaction time. Air drag is real: it slows the ping-pong ball enough for the gates — not the stopwatch — to see.',
    graph: 'The line of best fit makes the squared distances of the points from it as small as they can be. Its slope carries the physics: mass against volume gives the density; time² against height gives 2/g. A point far from the line is checked, not deleted — and left out only with its reason written down.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const RESTART = true;
  L.register({
    id: 'g6a-measurement-bench',
    grade: 6, unit: '6A', topics: ['A5'],
    subject: 'engineering',
    name: 'The Measurement Bench — Safety, SI Units and Honest Numbers',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS Science and Engineering Practices 3–5', 'NGSS MS-PS1-2 · supporting', 'CAST'],
    weight: 'Investigation',
    is3D: true,
    autoplay: true,
    bloom: 0.12,
    stageHint: 'Drag to turn the bench · scroll to zoom · every reading is computed',
    lede: 'The rules of a laboratory are physics. <b>Hot glass</b> looks exactly like cold glass — the lab computes what your skin would reach. <b>Acid into water</b>: the same heat, poured the other way round, boils the water it meets. ' +
      'A <b>density</b> is two readings and a division, and each reading has an uncertainty the instrument decides. A <b>stopwatch</b> carries your reaction time; light gates do not. And a <b>graph</b> can tell the truth or lie about the same numbers.',

    params: preset({}),
    presets: [
      { name: 'Boiling water in a glass beaker, grabbed bare-handed', params: preset({ set: 350, hold: 2 }) },
      { name: 'The same, with a heat glove', params: preset({ set: 350, protect: 'heat', hold: 10 }) },
      { name: 'An empty beaker dried on the plate', params: preset({ set: 300, contents: 'empty' }) },
      { name: 'A steel beaker through the thermal camera', params: preset({ set: 250, beaker: 'steel', view: 'ir' }) },
      { name: 'Acid into water, the safe way', params: preset({ setup: 'acid' }) },
      { name: 'Water into concentrated acid', params: preset({ setup: 'acid', order: 'water-into-acid' }) },
      { name: 'Water into acid, slowly, in ice — still boils', params: preset({ setup: 'acid', order: 'water-into-acid', rate: 0.2, bath: 'ice' }) },
      { name: 'Water into 40 % acid', params: preset({ setup: 'acid', order: 'water-into-acid', strength: 40 }) },
      { name: 'Is it gold? A golden nugget in a 25 mL cylinder', params: preset({ setup: 'density', specimen: 'B', size: 'small', cyl: 25 }) },
      { name: 'Pyrite or hematite? Before-and-after cannot tell', params: preset({ setup: 'density', specimen: 'C', size: 'medium', cyl: 100 }) },
      { name: 'Pyrite or hematite? The overflow can can', params: preset({ setup: 'density', specimen: 'C', size: 'large', method: 'overflow', catchCyl: 25 }) },
      { name: 'The balance was not zeroed', params: preset({ setup: 'density', specimen: 'A', size: 'large', method: 'overflow', catchCyl: 25, tared: false }) },
      { name: 'Reading from above', params: preset({ setup: 'density', specimen: 'A', size: 'large', method: 'overflow', catchCyl: 25, eye: 3 }) },
      { name: 'Ten drops, a partner drops the ball', params: preset({ setup: 'timing' }) },
      { name: 'Ten drops, you drop and start it', params: preset({ setup: 'timing', who: 'self' }) },
      { name: 'Can the stopwatch see air drag? Ping-pong ball', params: preset({ setup: 'timing', ball: 'pingpong', who: 'self', trials: 20 }) },
      { name: 'Thirty drops still cannot fix a late start', params: preset({ setup: 'timing', trials: 30 }) },
      { name: 'Pyrite: the slope is the density', params: preset({ setup: 'graph' }) },
      { name: 'The same graph, the misread piece left out', params: preset({ setup: 'graph', outlier: 'drop' }) },
      { name: 'A curve that straightens: time² against height', params: preset({ setup: 'graph', data: 'fall', linear: true }) },
      { name: 'The bar chart that lies', params: preset({ setup: 'graph', data: 'balls', gtype: 'bars', fit: 'none', yfrom: 'data' }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS } ] },
      { group: 'The hot plate', when: is('hot'), items: [
        { key: 'set', label: 'Hot plate setting', min: 60, max: 350, step: 5, unit: '°C', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'after', type: 'select', label: 'At 15 min, switch off and', restructure: RESTART, options: [{ value: 'plate', label: 'Leave it there' }, { value: 'mat', label: 'Move it to the mat' }] } ] },
      { group: 'The beaker', when: is('hot'), items: [
        { key: 'beaker', type: 'select', label: 'Made of', restructure: RESTART, options: [{ value: 'glass', label: 'Borosilicate glass' }, { value: 'steel', label: 'Stainless steel' }] },
        { key: 'contents', type: 'select', label: 'Holding', restructure: RESTART, options: [{ value: 'water', label: '200 mL of water' }, { value: 'empty', label: 'Nothing (drying)' }] } ] },
      { group: 'The touch', when: is('hot'), items: [
        { key: 'target', type: 'select', label: 'Touch', restructure: false, options: [{ value: 'beaker', label: 'The beaker' }, { value: 'plate', label: 'The plate’s top' }] },
        { key: 'protect', type: 'select', label: 'With', restructure: false, options: [{ value: 'bare', label: 'Bare fingers' }, { value: 'nitrile', label: 'Nitrile gloves' }, { value: 'heat', label: 'Heat mitts' }, { value: 'tongs', label: 'Beaker tongs' }] },
        { key: 'hold', label: 'Hold on for', min: 0.5, max: 30, step: 0.5, unit: 's', fmt: v => v.toFixed(1) } ] },
      { group: 'What you pour', when: is('acid'), items: [
        { key: 'order', type: 'select', label: 'Order', restructure: RESTART, options: [{ value: 'acid-into-water', label: 'Acid into water' }, { value: 'water-into-acid', label: 'Water into acid' }] },
        { key: 'strength', type: 'select', label: 'The acid', restructure: RESTART, options: [{ value: 98, label: '98 % (concentrated)' }, { value: 70, label: '70 %' }, { value: 40, label: '40 %' }] } ] },
      { group: 'How much', when: is('acid'), items: [
        { key: 'acidV', label: 'Acid', min: 5, max: 40, step: 1, unit: 'mL', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'waterV', label: 'Water', min: 50, max: 140, step: 5, unit: 'mL', fmt: v => v.toFixed(0), restructure: RESTART } ] },
      { group: 'How you pour', when: is('acid'), items: [
        { key: 'rate', label: 'Pouring rate', min: 0.1, max: 5, step: 0.1, unit: 'mL/s', fmt: v => v.toFixed(1), restructure: RESTART },
        { key: 'bath', type: 'select', label: 'The beaker stands', restructure: RESTART, options: [{ value: 'air', label: 'In air' }, { value: 'ice', label: 'In an ice bath' }] } ] },
      { group: 'The specimen', when: is('density'), items: [
        { key: 'specimen', type: 'select', label: 'Mystery specimen', restructure: RESTART, options: Object.keys(SPECIMENS).map(k => ({ value: k, label: k + ': ' + SPECIMENS[k].look })) },
        { key: 'size', type: 'select', label: 'Size', restructure: RESTART, options: [{ value: 'tiny', label: 'Tiny (½ cm³)' }, { value: 'small', label: 'Small (2 cm³)' }, { value: 'medium', label: 'Medium (6 cm³)' }, { value: 'large', label: 'Large (15 cm³)' }] } ] },
      { group: 'Measuring its volume', when: is('density'), items: [
        { key: 'method', type: 'select', label: 'Method', restructure: RESTART, options: [{ value: 'before', label: 'Cylinder: before and after' }, { value: 'overflow', label: 'Overflow can' }] },
        { key: 'cyl', type: 'select', label: 'Cylinder', restructure: RESTART, when: S => S.p.method !== 'overflow', options: [10, 25, 100, 250].map(v => ({ value: v, label: v + ' mL' })) },
        { key: 'catchCyl', type: 'select', label: 'Catch it in', restructure: RESTART, when: S => S.p.method === 'overflow', options: [10, 25, 100].map(v => ({ value: v, label: v + ' mL' })) },
        { key: 'fill', label: 'Water to start', min: 0.1, max: 0.9, step: 0.05, unit: 'of it', fmt: v => Math.round(v * 100) + ' %', restructure: RESTART, when: S => S.p.method !== 'overflow' } ] },
      { group: 'Reading it', when: is('density'), items: [
        { key: 'eye', label: 'Your eye, above the meniscus', min: -4, max: 4, step: 0.5, unit: 'cm', fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
        { key: 'readAt', type: 'select', label: 'Read the meniscus at', restructure: false, options: [{ value: 'bottom', label: 'Its lowest point' }, { value: 'top', label: 'The edge on the glass' }] },
        { key: 'tared', type: 'toggle', label: 'Zero (tare) the balance with the boat on it' },
        { key: 'bubbles', type: 'toggle', label: 'Air bubbles cling to the specimen' },
        { key: 'units', type: 'select', label: 'Report the density in', display: true, options: [{ value: 'gcm3', label: 'g/cm³' }, { value: 'kgm3', label: 'kg/m³ (SI)' }] } ] },
      { group: 'The drop', when: is('timing'), items: [
        { key: 'ball', type: 'select', label: 'Ball', restructure: RESTART, options: [{ value: 'steel', label: 'Steel ball' }, { value: 'marble', label: 'Glass marble' }, { value: 'pingpong', label: 'Ping-pong ball' }] },
        { key: 'h', label: 'Drop height', min: 0.2, max: 1.5, step: 0.05, unit: 'm', fmt: v => v.toFixed(2), restructure: RESTART } ] },
      { group: 'The timing', when: is('timing'), items: [
        { key: 'who', type: 'select', label: 'The stopwatch', restructure: RESTART, options: [{ value: 'partner', label: 'A partner drops; you react' }, { value: 'self', label: 'You drop and start it' }] },
        { key: 'trials', label: 'Drops to time', min: 1, max: 30, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'set2', label: 'Class (a new set of drops)', min: 1, max: 5, step: 1, unit: '', fmt: v => '#' + v.toFixed(0), restructure: RESTART } ] },
      { group: 'The data', when: is('graph'), items: [
        { key: 'data', type: 'select', label: 'Table', restructure: RESTART, options: [{ value: 'mass', label: 'Pyrite: volume and mass' }, { value: 'fall', label: 'Drop height and fall time' }, { value: 'cool', label: 'A beaker cooling' }, { value: 'balls', label: 'Three balls, mean times' }] },
        { key: 'outlier', type: 'select', label: 'A point far off the line', restructure: false, options: [{ value: 'keep', label: 'Keep it' }, { value: 'drop', label: 'Leave it out (misread)' }] } ] },
      { group: 'The graph', when: is('graph'), items: [
        { key: 'gtype', type: 'select', label: 'Draw it as', restructure: false, options: [{ value: 'points', label: 'Points' }, { value: 'joined', label: 'Dot to dot' }, { value: 'bars', label: 'Bars' }] },
        { key: 'axes', type: 'select', label: 'Along the bottom', restructure: false, options: [{ value: 'normal', label: 'What was changed' }, { value: 'swapped', label: 'What was measured' }] },
        { key: 'fit', type: 'select', label: 'Line of best fit', restructure: false, options: [{ value: 'none', label: 'None' }, { value: 'line', label: 'Straight line' }, { value: 'zero', label: 'Through zero' }] },
        { key: 'linear', type: 'toggle', label: 'Plot time² instead of time', when: S => S.p.data === 'fall' },
        { key: 'yfrom', type: 'select', label: 'The side axis starts at', restructure: false, options: [{ value: 'zero', label: 'Zero' }, { value: 'data', label: 'Just below the data' }] } ] },
      { group: 'Look with', when: is('hot'), items: [
        { key: 'view', type: 'select', label: 'Look with', display: true, options: [{ value: 'eye', label: 'Your eyes' }, { value: 'ir', label: 'A thermal camera' }] } ] }
    ],

    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) {
      if (type !== 'pointerdown') return;
      if (window.KITMS && window.KITMS.chipHit(S, x, y)) return;
    },
    onDrag(S, d) {
      const p = S.p;
      if (d.id === 'eye' && S._eyeAt) {                       // up and down beside the magnified meniscus: the eye's height
        const E0 = S._eyeAt, R = measure(p), G = CYL_G[R.cy], off = (E0.Y(E0.trueLv) - d.y) / E0.pxPer;   // mL of line-of-sight offset the drag asks for
        const perCm = (G.d * 100 / 2) / EYE_D * E0.A;
        p.eye = clamp(Math.round(off / Math.max(1e-6, perCm) * 2 * 0.35) / 2, -4, 4);
      } else if (d.id === 'release' && S.cam) {              // the release clamp slides up and down the rod
        let best = p.h, bd = 1e9;
        for (let h = 0.2; h <= 1.5001; h += 0.05) { const q = S.cam.project([DROP[0], DROP[1], 0.126 + h + BALLS[p.ball].d + 0.03]); if (!q.ok) continue; const dd = Math.abs(q.y - d.y); if (dd < bd) { bd = dd; best = Math.round(h * 20) / 20; } }
        if (best !== p.h) { p.h = best; setup(S); }
      }
    },

    plots: [
      { title: S => ({ hot: 'The hour on the bench: how hot, and when a touch stops burning', acid: 'The temperature as the second liquid goes in — this way, and the other way round', density: 'Where the measurement lands among the minerals', timing: 'Every drop, timed two ways', graph: 'The check: what the line leaves over' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ hot: 'The touch on the burn chart: skin temperature against time in contact', acid: 'The hottest it gets: how fast you pour, which way round, and an ice bath', density: 'How precise can it be? Method, cylinder and specimen size', timing: 'What averaging can and cannot fix', graph: 'The same numbers another way' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],

    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'NGSS SEP 3 · lab safety: a hot beaker',
        q: 'A glass beaker of water is at 90 °C. You grab it with bare fingers. What temperature does the skin under your fingertips reach?',
        params: preset({ set: 350, protect: 'bare', hold: 2 }),
        predict: { label: 'skin', unit: '°C', tol: 0.04 },
        measure: () => touch(targetOf({ target: 'beaker', beaker: 'glass', contents: 'water' }), 90, 'bare', 2).peak,
        working: 'Two bodies touching settle at a temperature weighted by their effusivities e = √(kρc): glass 1453, skin 1176. (1453 × 90 + 1176 × 33) ÷ 2629 ≈ 64.5 °C at first, creeping past 65 °C as heat arrives from the water behind the glass. ' +
          'Moritz and Henriques measured that skin held at 65.6 °C burns in 2 s — so a two-second grab is right at the edge of a burn. Glass that looks cold can do that.' },
      { source: 'NGSS SEP 3 · lab safety: how hot is too hot',
        q: 'How hot can a glass beaker of water be for you to hold it bare-handed for 5 seconds without a burn?',
        params: preset({ set: 350, protect: 'bare', hold: 5 }),
        predict: { label: 'the hottest safe beaker', unit: '°C', tol: 0.04 },
        measure: () => thresholdT(targetOf({ target: 'beaker', beaker: 'glass', contents: 'water' }), 'bare', 5),
        working: 'Five seconds burns skin held at 60 °C. The contact temperature is 0.553 × T + 14.8 for glass on skin, so 60 °C at the skin needs a beaker of about (60 − 14.8) ÷ 0.553 ≈ 82 °C; ' +
          'the model, which follows the heat soaking in, gives about 80 °C. Water just off the boil is 20 °C hotter than that.' },
      { source: 'NGSS SEP 3 · lab safety: acid into water',
        q: 'You pour 20 mL of 98 % sulfuric acid into 100 mL of water, 1 mL a second, stirring. How hot does the mixture get?',
        params: preset({ setup: 'acid' }),
        predict: { label: 'hottest', unit: '°C', tol: 0.06 },
        measure: () => dilute({ order: 'acid-into-water', acidV: 20, waterV: 100, strength: 98, rate: 1, bath: 'air' }).peak,
        working: '20 mL of 98 % acid is 36.8 g, 0.368 mol of H₂SO₄. With 100 mL of water that is 15 mol of water per mol of acid; Thomsen gives 74.73 × 15.2 ÷ 17.0 ≈ 67 kJ per mol — about 23 kJ in all ' +
          '(less what the 2 % water already released). 23 kJ into 137 g at about 3.3 J/g·K warms it about 50 K: from 20 °C to about 70 °C. Hot, but spread through all the water.' },
      { source: 'NGSS SEP 3 · lab safety: never water into acid',
        q: 'Now pour the 100 mL of water into the 20 mL of acid instead. How hot is the spot where each early drop lands?',
        params: preset({ setup: 'acid', order: 'water-into-acid' }),
        predict: { label: 'hottest where drops land', unit: '°C', tol: 0.08 },
        measure: () => dilute({ order: 'water-into-acid', acidV: 20, waterV: 100, strength: 98, rate: 1, bath: 'air' }).peak,
        working: 'Water is lighter than the acid, so it lands on top and mixes first with its own mass of acid: that small mixing releases enough heat to warm the two about 100 K. ' +
          'As the beaker itself heats towards 146 °C, the landing spots pass 180 °C. The water boils as it lands and throws acid out. Same liquids, same final mixture — only the order changed.' },
      { source: 'NGSS SEP 4 · a density from two measurements',
        q: 'A golden nugget reads 41.15 g on the balance and raises the water in a 25 mL cylinder by 2.15 mL. What is its density?',
        params: preset({ setup: 'density', specimen: 'B', size: 'small', cyl: 25 }),
        predict: { label: 'density', unit: 'g/cm³', tol: 0.02 },
        measure: S => measure(S.p).r,
        working: 'ρ = m ÷ V = 41.15 g ÷ 2.15 cm³ ≈ 19.1 g/cm³. Even with ± 0.35 mL on the volume (± 16 %), only gold (19.3) is that dense; pyrite, fool’s gold, is 5.0.' },
      { source: 'NGSS SEP 4 · how precise is a measurement',
        q: 'A 15 cm³ lump is measured in the overflow can, the water caught in a 25 mL cylinder (0.5 mL divisions). What is the uncertainty in its density, in percent?',
        params: preset({ setup: 'density', specimen: 'C', size: 'large', method: 'overflow', catchCyl: 25 }),
        predict: { label: 'uncertainty', unit: '%', tol: 0.1 },
        measure: S => 100 * measure(S.p).rel,
        working: 'One reading, ± half a division = ± 0.25 mL, and a drop left on the spout (0.05 mL): √(0.25² + 0.05²) ≈ 0.255 mL on 14.8 mL is 1.7 %. The balance adds almost nothing. ' +
          'Pyrite (5.01) and hematite (5.26) are 5 % apart — 1.7 % is enough to tell them apart; the 100 mL cylinder’s two readings (± 11 %) are not.' },
      { source: 'NGSS SEP 4 · timing a fall',
        q: 'A steel ball falls 1.00 m between two light gates. What time do the gates read?',
        params: preset({ setup: 'timing' }),
        predict: { label: 'time', unit: 's', tol: 0.01 },
        measure: () => fallTime('steel', 1),
        working: 'From rest, h = ½gt², so t = √(2h ÷ g) = √(2 ÷ 9.81) = 0.4515 s. Air drag adds 0.2 ms for a steel ball: the gates read 0.4517 s.' },
      { source: 'NGSS SEP 4 · what averaging cannot fix',
        q: 'A partner drops the ball; you start the stopwatch when you see it go. Averaged over thirty drops, how much shorter than the true time is your stopwatch?',
        params: preset({ setup: 'timing', trials: 30 }),
        predict: { label: 'shorter by', unit: 's', tol: 0.25 },
        measure: () => { const T = trialsOf({ ball: 'steel', h: 1, n: 30, who: 'partner', set: 1 }); return T.t - stats(T.out.map(q => q.watch)).mean; },
        working: 'Your finger starts the watch one reaction time late — about 0.19 s, the ruler-drop test’s number — while the stop, which you can see coming, is on time. Averaging shrinks the scatter by √30 but keeps the 0.19 s.' },
      { source: 'NGSS SEP 4 · the slope carries the physics',
        q: 'Six pieces of pyrite: plot mass against volume and draw the best line through zero, leaving out the misread piece. What is the slope?',
        params: preset({ setup: 'graph', outlier: 'drop' }),
        predict: { label: 'slope', unit: 'g/cm³', tol: 0.02 },
        measure: S => graphOf(S).F.b,
        working: 'Mass = density × volume, so a line through zero whose slope is the density. With the misread piece left out (its volume read one division high) the five pieces give 5.03 g/cm³ — pyrite is 5.01.' }
    ],
    walkthrough: [
      { title: 'Which beaker is hot?', ask: 'A beaker has been on the hot plate for 15 minutes. Look at it. Can you tell how hot it is?',
        reveal: 'No — hot glass looks exactly like cold glass. Nothing glows until it passes about 525 °C. The water is 91 °C and the plate’s top 250 °C; only a thermometer or a thermal camera shows it.', params: preset({}) },
      { title: 'An instrument that can lie', ask: 'Point a thermal camera at a steel beaker of 100 °C water. What does it read?',
        reveal: 'About 37 °C. Shiny steel gives out little heat radiation and mirrors the cold room instead (its emissivity is 0.16). Knowing how an instrument works is part of using it.', params: preset({ beaker: 'steel', view: 'ir' }) },
      { title: 'Two seconds', ask: 'Grab a beaker of 90 °C water with bare fingers for two seconds. Burn or not? And with a steel beaker?',
        reveal: 'The glass puts your skin at 64 °C — two seconds is right at the burn threshold. Steel hands its heat over five times faster: the skin reaches 83 °C and burns in a few hundredths of a second. Tongs never let the heat reach you.', params: preset({ set: 350, hold: 2 }) },
      { title: 'The order matters', ask: 'Pour water into strong acid, slowly, with the beaker in ice. Is it safe?',
        reveal: 'No. Each drop of water lands on the denser acid and mixes with its own mass of it, heating that little spot about 100 K — it boils where it lands and throws acid, even though the beaker stays cool. Pour acid into water: the acid sinks, and its heat spreads through the water.', params: preset({ setup: 'acid', order: 'water-into-acid', rate: 0.2, bath: 'ice' }) },
      { title: 'Is it gold?', ask: 'The golden nugget in a 25 mL cylinder. Gold or fool’s gold?',
        reveal: 'About 19 g/cm³ — gold. Pyrite, fool’s gold, is 5.0. Even a rough measurement settles it when the candidates are that far apart.', params: preset({ setup: 'density', specimen: 'B', size: 'small', cyl: 25 }) },
      { title: 'Precise enough?', ask: 'Specimen C in the 100 mL cylinder, read before and after. Pyrite or hematite?',
        reveal: '± 11 %: the measurement covers pyrite, magnetite and hematite. Weigh the large piece and catch its overflow in the 25 mL cylinder: ± 1.7 % — it is hematite. The method decides how many digits you can claim.', params: preset({ setup: 'density', specimen: 'C' }) },
      { title: 'What averaging fixes', ask: 'Ten drops timed by stopwatch and by light gates. What does averaging more drops fix — and what not?',
        reveal: 'Averaging shrinks the scatter (the band narrows as √n) but not the steady 0.19 s your finger loses at the start. The gates read to a tenth of a millisecond, every time.', params: preset({ setup: 'timing' }) },
      { title: 'The graph that lies', ask: 'The bar chart of the three balls. How much longer does the ping-pong ball take?',
        reveal: '3.1 % longer — 0.4656 s against 0.4517. The side axis starts at 0.445 s, so its bar looks three times as tall. Bars compare amounts only when they start from zero.', params: preset({ setup: 'graph', data: 'balls', gtype: 'bars', fit: 'none', yfrom: 'data' }) }
    ],
    quiz: [
      { q: 'A beaker has been on a hot plate. How can you tell whether it is safe to pick up?', options: ['It would glow if it were hot', 'Touch it quickly with a fingertip', 'Measure it — or treat it as hot and use tongs', 'Hot glass turns a different colour'], answer: 2,
        explain: 'Nothing glows below about 525 °C, and 90 °C glass burns in a couple of seconds. Measure, or assume it is hot.' },
      { q: 'Why is acid poured into water and never water into acid?', options: ['Acid into water makes less heat', 'Water is lighter: poured on acid it stays on top, heats where it lands and boils, throwing acid', 'Water into acid makes a different liquid', 'Acid is more expensive'], answer: 1,
        explain: 'Both orders release the same heat and make the same final liquid. Water on top of the denser acid boils where it lands; acid sinks through water and its heat spreads.' },
      { q: 'You read a cylinder from above the meniscus. Your reading is…', options: ['Too low', 'Too high', 'Correct', 'Too high only for mercury'], answer: 1,
        explain: 'The scale is on the glass in front of the meniscus; a line of sight from above crosses it higher up.' },
      { q: 'Your density is 5.0 ± 0.6 g/cm³. Pyrite is 5.01, hematite 5.26. Which is it?', options: ['Pyrite', 'Hematite', 'You cannot tell from this measurement', 'Neither'], answer: 2,
        explain: 'Both lie inside 4.4–5.6. A finer method is needed — the overflow can into a small cylinder gets to ± 1.7 %.' },
      { q: 'Averaging thirty stopwatch times…', options: ['removes all error', 'shrinks the random scatter but not a steady late start', 'makes no difference', 'makes the time longer'], answer: 1,
        explain: 'Random errors average out; a mistake made the same way every time (a reaction delay) does not.' },
      { q: 'Mass against volume for pieces of one mineral gives a straight line through zero. Its slope is…', options: ['the mineral’s density', 'its volume', 'zero', 'the balance’s error'], answer: 0,
        explain: 'Mass = density × volume: the slope is the density.' },
      { q: 'A bar chart’s side axis starts at 0.445 s and one bar looks three times taller. The real difference is…', options: ['three times', 'about 3 %', 'nothing', 'impossible to know'], answer: 1,
        explain: '0.4656 against 0.4517 s is 3 % longer. Cutting off the bottom of the axis exaggerates differences.' },
      { q: '1 g/cm³ is the same as…', options: ['1 kg/m³', '100 kg/m³', '1000 kg/m³', '0.001 kg/m³'], answer: 2,
        explain: 'A cubic metre is a million cubic centimetres and a kilogram a thousand grams: 1 g/cm³ = 1000 kg/m³ — water’s density in SI units.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Burns</b> — Moritz and Henriques (1947) measured how long skin can bear each temperature before it burns through. ISO 13732-1 sets limits for touching hot surfaces a little lower, at the first sign of a burn (bare metal: 65–70 °C for one second); by the scald table the lab uses, bare steel burns through at about 73 °C.</li>' +
      '<li><b>Acid spills</b> — every chemistry lab’s first rule, “do what you oughta, add acid to water”, is Thomsen’s heat of dilution (1880s) and the density of sulfuric acid, 1.84 g/cm³.</li>' +
      '<li><b>Assaying</b> — Archimedes told the king’s gold crown from silver by its density; prospectors still tell gold from pyrite the same way.</li>' +
      '<li><b>Timing</b> — hand-timed races were reported to a tenth of a second and are about 0.24 s faster than electronic ones; that is why athletics went to light gates.</li>' +
      '<li><b>Graphs</b> — a truncated axis is the most common way a chart misleads; the slope of a best-fit line is how most constants in science are measured.</li></ul>' +
      '<b>What the lab assumes.</b> The touch is one-dimensional: the object, a glove, and 6 mm of skin warming from 33 °C, the burn as a dose on Moritz and Henriques’s table. The hot plate is lumped: 800 W, a thermostat, convection and radiation; the water loses heat mostly by evaporation. ' +
      'The acid is stirred; its heat capacity is interpolated between water (4.18 J/g·K) and the pure acid (1.42). A drop of water mixes first with its own mass of the liquid under it. A cylinder is read to ± half a division, the meniscus climbs 2.2 mm, the eye is 25 cm away. ' +
      'The stopwatch starts one reaction time (0.19 ± 0.03 s) late when you react to a partner, and stops within ± 0.045 s when you can see the landing coming.'
  });

  const MODEL = { MAT, eff, burnTime, contact, touch, targetOf, thresholdT, thermalRun, rowAt, QTH, cpOf, bpOf, liquidOf, dilute, MINERALS, SPECIMENS, CYL, SIZES, measure, relOf,
    BALLS, fallTime, fallDist, trialsOf, stats, fit, outlierOf, DATASETS, BASE: () => preset({}) };
  L.models = L.models || {};
  L.models['g6a-measurement-bench'] = MODEL;
})(window.InsightLab);
