/* ============================================================
   GRADE 6 · UNIT E · REGIONAL CLIMATE, ORGANISMS AND HEREDITY
   6E-1  Climate from Weather
   (E1.1 Weather versus climate; E1.2 Building climate from weather data;
    E1.3 Reading climate graphs; E1.4 Reading climate maps; E1.5 Climate zones)

   Twelve real weather stations, each a stochastic daily weather generator
   tuned to its published 1991–2020 normals, run day by day from 1961:
     temperature — the seasonal cycle through the twelve monthly means
                   (trigonometric interpolation, corrected so each month's
                   average IS the normal), a year-to-year swing, a day-to-day
                   anomaly that persists (AR(1), φ = 0.72) with the station's
                   own spread, winter and summer, and an optional warming
                   trend;
     rain        — a two-state Markov chain (wet after wet is likelier) with
                   each month's chance of a wet day and exponentially
                   distributed amounts, so the month's mean total is the
                   normal;
     snow        — a degree-day snowpack.
   From the days come thirty-year statistics, the climograph and the Köppen
   class (Peel, Finlayson & McMahon 2007), which reproduces each station's
   published class. A world climate map comes from a geography model:
   temperature by latitude, the season and how far the air has come over land
   (sea-level temperatures, no mountains); rain from the ITCZ, the subtropical
   highs and the storm track following the Sun, onshore trades and the
   interior's distance from the sea — and the same Köppen key run on every
   point of it.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.EARTH, R3, G6E and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6E;
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MSTART = DAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + DAYS[i - 1] : 0), a), []);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthOf = d => { let m = 11; while (m > 0 && d < MSTART[m]) m--; return m; };
  const Y0 = 1961, Y1 = 2025, NY = Y1 - Y0 + 1;           // the record the generator writes
  const NORMAL = [1991, 2020];                             // the normals the stations are tuned to
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003 + 0.5) / 1000003.5; }; }
  const hash = (...a) => a.reduce((h, v) => Math.imul(h ^ Math.round(v * 1000), 2654435761) >>> 0, 2166136261);

  /* ============================================================
     1. THE STATIONS — 1991–2020 normals (NOAA NCEI; Met Office; BoM;
     IMD; MSS), monthly mean temperature °C and precipitation mm.
     sdW / sdS: the day-to-day spread of the daily mean in winter and in
     summer; dtr: the mean difference between the day's high and low;
     wet: days a year with at least 1 mm; kg: the published Köppen class.
     ============================================================ */
  const STATIONS = {
    sf: { name: 'San Francisco', lat: 37.77, lon: -122.42, elev: 16, kg: 'Csb', dtr: 8, sdW: 1.8, sdS: 2.0, wet: 67,
      T: [11.1, 12.2, 13.1, 13.9, 15.1, 16.4, 16.8, 17.4, 18.1, 17.2, 13.9, 11.2],
      P: [114, 112, 84, 38, 18, 5, 0, 3, 3, 28, 81, 117], land: 'coast', note: 'cool, foggy summers' },
    sac: { name: 'Sacramento', lat: 38.58, lon: -121.49, elev: 8, kg: 'Csa', dtr: 15, sdW: 2.4, sdS: 2.6, wet: 58,
      T: [8.9, 11.0, 13.2, 15.6, 19.4, 22.6, 24.6, 24.2, 22.4, 18.3, 12.4, 8.6],
      P: [97, 91, 71, 30, 15, 5, 0, 3, 5, 25, 53, 86], land: 'valley', note: 'hot, dry summers' },
    dv: { name: 'Death Valley', lat: 36.46, lon: -116.87, elev: -59, kg: 'BWh', dtr: 15, sdW: 3.0, sdS: 2.6, wet: 8,
      T: [11.6, 15.0, 20.1, 24.6, 30.3, 35.8, 39.3, 38.0, 32.8, 24.8, 16.5, 10.6],
      P: [9.4, 12.7, 7.4, 3.3, 1.3, 0.8, 2.8, 3.3, 4.3, 2.3, 4.1, 7.1], land: 'desert', note: 'the hottest place on Earth' },
    denver: { name: 'Denver', lat: 39.85, lon: -104.66, elev: 1655, kg: 'BSk', dtr: 15, sdW: 6.0, sdS: 3.0, wet: 60,
      T: [0.0, 0.9, 4.9, 8.6, 13.9, 19.6, 23.4, 22.3, 17.6, 10.6, 4.3, -0.6],
      P: [10, 11, 28, 44, 58, 49, 54, 45, 30, 26, 17, 11], land: 'plains', note: 'dry high plains' },
    chicago: { name: 'Chicago', lat: 41.96, lon: -87.93, elev: 201, kg: 'Dfa', dtr: 9.5, sdW: 5.5, sdS: 3.0, wet: 120,
      T: [-4.6, -2.3, 3.3, 9.6, 15.6, 21.1, 23.6, 22.7, 18.6, 11.8, 4.9, -1.4],
      P: [51, 48, 64, 97, 114, 112, 99, 107, 84, 86, 61, 53], land: 'interior', note: 'hot summers, cold winters' },
    fairbanks: { name: 'Fairbanks', lat: 64.80, lon: -147.88, elev: 132, kg: 'Dfc', dtr: 10, sdW: 7.0, sdS: 3.2, wet: 95,
      T: [-21.9, -18.8, -11.8, -0.9, 9.0, 15.5, 16.9, 13.8, 7.4, -3.9, -15.1, -19.6],
      P: [15.0, 10.9, 8.4, 7.6, 17.0, 35.1, 54.6, 48.0, 28.2, 22.1, 17.8, 15.7], land: 'interior', note: 'long, bitter winters' },
    utq: { name: 'Utqiaġvik (Barrow)', lat: 71.29, lon: -156.77, elev: 9, kg: 'ET', dtr: 6, sdW: 6.0, sdS: 2.5, wet: 60,
      T: [-24.6, -26.0, -24.9, -16.3, -5.3, 2.1, 5.4, 3.6, -0.6, -8.8, -17.0, -22.4],
      P: [3, 3, 3, 4, 4, 8, 23, 26, 17, 11, 5, 4], land: 'coast', note: 'tundra on the Arctic Ocean' },
    miami: { name: 'Miami', lat: 25.79, lon: -80.32, elev: 9, kg: 'Am', dtr: 8, sdW: 2.6, sdS: 1.0, wet: 135,
      T: [20.1, 21.4, 22.6, 24.6, 26.9, 28.4, 29.1, 29.3, 28.6, 26.9, 23.9, 21.6],
      P: [41, 56, 66, 86, 140, 267, 183, 244, 251, 193, 84, 56], land: 'coast', note: 'a wet summer, a drier winter' },
    singapore: { name: 'Singapore', lat: 1.35, lon: 103.99, elev: 5, kg: 'Af', dtr: 7, sdW: 0.8, sdS: 0.8, wet: 167,
      T: [27.0, 27.6, 28.0, 28.3, 28.6, 28.6, 28.2, 28.2, 28.0, 27.9, 27.2, 26.8],
      P: [242, 162, 185, 179, 172, 162, 158, 176, 169, 194, 256, 288], land: 'coast', note: 'rain every month' },
    mumbai: { name: 'Mumbai', lat: 19.10, lon: 72.85, elev: 14, kg: 'Aw', dtr: 8, sdW: 1.1, sdS: 0.9, wet: 80,
      T: [24.4, 25.2, 27.1, 28.7, 30.1, 29.4, 28.0, 27.6, 27.8, 28.6, 27.6, 25.8],
      P: [1, 0.3, 0.2, 1, 11, 494, 840, 560, 340, 89, 10, 2], land: 'coast', note: 'the monsoon' },
    london: { name: 'London', lat: 51.48, lon: -0.45, elev: 25, kg: 'Cfb', dtr: 8, sdW: 2.8, sdS: 2.2, wet: 110,
      T: [5.6, 6.0, 8.1, 10.4, 13.7, 16.8, 19.0, 18.6, 15.9, 12.4, 8.6, 6.0],
      P: [55, 41, 42, 44, 49, 45, 45, 50, 49, 69, 59, 55], land: 'coast', note: 'mild and damp' },
    sydney: { name: 'Sydney', lat: -33.86, lon: 151.21, elev: 39, kg: 'Cfa', dtr: 7.5, sdW: 1.8, sdS: 2.4, wet: 100,
      T: [23.5, 23.6, 22.4, 19.6, 16.6, 14.2, 13.4, 14.5, 16.9, 18.9, 20.6, 22.4],
      P: [92, 130, 131, 127, 100, 133, 70, 78, 63, 69, 84, 78], land: 'coast', note: 'seasons the other way round' }
  };
  const SK = Object.keys(STATIONS);
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const sum = a => a.reduce((s, v) => s + v, 0);

  /* the seasonal cycle: trigonometric interpolation through the twelve mid-month points, each
     harmonic divided by its month-averaging factor sinc(πk/12), so a month's average of the
     curve is exactly that month's normal */
  function harmonics(T) {
    const A = [mean(T)], B = [0];
    for (let k = 1; k <= 6; k++) {
      let a = 0, b = 0;
      T.forEach((v, m) => { const ph = TAU * k * (m + 0.5) / 12; a += v * Math.cos(ph); b += v * Math.sin(ph); });
      const w = k === 6 ? 1 / 12 : 2 / 12, x = Math.PI * k / 12, damp = Math.sin(x) / x;
      A.push(a * w / damp); B.push(b * w / damp);
    }
    return { A, B };
  }
  function seasonal(H, frac) {                     // frac: fraction of the year, 0 = 1 January
    let v = H.A[0];
    for (let k = 1; k <= 6; k++) v += H.A[k] * Math.cos(TAU * k * frac) + H.B[k] * Math.sin(TAU * k * frac);
    return v;
  }
  /* each month's chance of a wet day (≥ 1 mm): the year's wet days shared out as P^0.6, capped */
  function wetChance(st) {
    const w = st.P.map(p => Math.pow(Math.max(p, 0), 0.6)), ws = sum(w) || 1;
    return w.map((x, m) => clamp(st.wet * x / ws / DAYS[m], st.P[m] > 0 ? 0.004 : 0, 0.82));
  }
  const PERSIST = 0.3, PHI = 0.72, SD_YEAR = 0.5;

  /* ---------- the generator: one year of days, the same whichever window asks for it ---------- */
  const YCACHE = {};
  function genYear(key, y, seed, trend) {
    const st = STATIONS[key], ck = key + '|' + y + '|' + seed + '|' + trend;
    if (YCACHE[ck]) return YCACHE[ck];
    const H = st._H || (st._H = harmonics(st.T)), pw = st._pw || (st._pw = wetChance(st));
    const r = rng(hash(SK.indexOf(key) + 1, seed, y));
    const gauss = () => { const u = r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
    const T = new Float32Array(365), X = new Float32Array(365), N = new Float32Array(365), P = new Float32Array(365);
    const yearAnom = SD_YEAR * gauss(), shift = trend * (y - 2005.5) / 100;
    const south = st.lat < 0;
    let a = gauss(), wet = r() < pw[0];
    for (let d = 0; d < 365; d++) {
      const m = monthOf(d), f = (d + 0.5) / 365;
      // how far into summer: 1 at the warmest time of year, 0 at the coldest
      const summer = 0.5 + 0.5 * Math.cos(TAU * (f - (south ? 0.04 : 0.54)));
      const sd = st.sdW + (st.sdS - st.sdW) * summer;
      a = PHI * a + Math.sqrt(1 - PHI * PHI) * gauss();
      const pi = pw[m], pWet = wet ? pi + PERSIST * (1 - pi) : pi * (1 - PERSIST);
      wet = r() < pWet;
      const mu = pi > 0 ? st.P[m] / (pi * DAYS[m]) : 0;
      P[d] = wet && mu > 0 ? (mu > 1 ? 1 + (mu - 1) * -Math.log(r()) : -mu * Math.log(r())) : 0;      // a wet day is one with at least 1 mm
      if (!wet) r();
      T[d] = seasonal(H, f) + shift + yearAnom + sd * a;
      const h = st.dtr / 2 * (wet ? 0.62 : 1.08);
      X[d] = T[d] + h; N[d] = T[d] - h;
    }
    const out = { T, X, N, P, y };
    YCACHE[ck] = out;
    return out;
  }
  /* the snowpack, millimetres of water, day by day: falls as snow below +0.5 °C, melts 3 mm a degree-day */
  function snowpack(key, y, seed, trend) {
    let swe = 0;
    const prev = y > Y0 ? genYear(key, y - 1, seed, trend) : null;
    if (prev) for (let d = 244; d < 365; d++) swe = snowStep(swe, prev.T[d], prev.P[d]);
    const Y = genYear(key, y, seed, trend), out = new Float32Array(365);
    for (let d = 0; d < 365; d++) { swe = snowStep(swe, Y.T[d], Y.P[d]); out[d] = swe; }
    return out;
  }
  const snowStep = (swe, T, P) => Math.max(0, swe + (T < 0.5 ? P : 0) - (T > 0 ? 3 * T : 0));

  /* ---------- statistics over a run of years ---------- */
  function stats(key, yA, yB, seed, trend) {
    const n = yB - yA + 1, Tm = new Array(12).fill(0), Pm = new Array(12).fill(0), Xm = new Array(12).fill(0), Nm = new Array(12).fill(0);
    const annual = [], hi = { v: -1e9, y: 0, d: 0 }, lo = { v: 1e9, y: 0, d: 0 };
    let wetDays = 0;
    for (let y = yA; y <= yB; y++) {
      const Y = genYear(key, y, seed, trend);
      let at = 0;
      for (let d = 0; d < 365; d++) {
        const m = monthOf(d);
        Tm[m] += Y.T[d] / DAYS[m] / n; Xm[m] += Y.X[d] / DAYS[m] / n; Nm[m] += Y.N[d] / DAYS[m] / n; Pm[m] += Y.P[d] / n;
        at += Y.T[d] / 365; if (Y.P[d] >= 1) wetDays++;
        if (Y.X[d] > hi.v) { hi.v = Y.X[d]; hi.y = y; hi.d = d; }
        if (Y.N[d] < lo.v) { lo.v = Y.N[d]; lo.y = y; lo.d = d; }
      }
      annual.push(at);
    }
    return { T: Tm, P: Pm, X: Xm, N: Nm, MAT: mean(Tm), MAP: sum(Pm), annual, hi, lo, wetDays: wetDays / n, n, range: Math.max(...Tm) - Math.min(...Tm) };
  }
  /* the normal band for each date: the 10th, 50th and 90th percentile of the day's high over the
     normal period, from the fifteen days centred on it */
  const BCACHE = {};
  function band(key, seed, trend) {
    const ck = key + '|' + seed + '|' + trend;
    if (BCACHE[ck]) return BCACHE[ck];
    const Ys = []; for (let y = NORMAL[0]; y <= NORMAL[1]; y++) Ys.push(genYear(key, y, seed, trend));
    const lo = new Float32Array(365), mid = new Float32Array(365), hi = new Float32Array(365), buf = [];
    for (let d = 0; d < 365; d++) {
      buf.length = 0;
      Ys.forEach(Y => { for (let k = -7; k <= 7; k++) buf.push(Y.X[(d + k + 365) % 365]); });
      buf.sort((a, b) => a - b);
      const q = f => buf[Math.round(f * (buf.length - 1))];
      lo[d] = q(0.1); mid[d] = q(0.5); hi[d] = q(0.9);
    }
    return (BCACHE[ck] = { lo, mid, hi });
  }
  /* where one value falls among the normal period's highs for that date (%) */
  function percentile(key, seed, trend, d, v) {
    let below = 0, n = 0;
    for (let y = NORMAL[0]; y <= NORMAL[1]; y++) { const Y = genYear(key, y, seed, trend); for (let k = -7; k <= 7; k++) { n++; if (Y.X[(d + k + 365) % 365] < v) below++; } }
    return below / n * 100;
  }
  /* least-squares slope of a series, per decade */
  function slope(ys, xs) {
    const n = ys.length, mx = mean(xs), my = mean(ys);
    let a = 0, b = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) * (xs[i] - mx); }
    return b > 0 ? a / b : 0;
  }

  /* ============================================================
     2. THE KÖPPEN KEY — Peel, Finlayson & McMahon (2007), with E tested
     first (Kottek et al. 2006). Summer is April–September in the north,
     October–March in the south. Returns the class and the path through the
     key, so the lab can show each question it asked.
     ============================================================ */
  function koppen(T, P, lat) {
    const MAT = mean(T), MAP = sum(P), Thot = Math.max(...T), Tcold = Math.min(...T);
    const sumIdx = lat >= 0 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    const winIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(i => sumIdx.indexOf(i) < 0);
    const Ps = sumIdx.map(i => P[i]), Pw = winIdx.map(i => P[i]);
    const Psum = sum(Ps), Psdry = Math.min(...Ps), Pswet = Math.max(...Ps), Pwdry = Math.min(...Pw), Pwwet = Math.max(...Pw);
    const Pdry = Math.min(...P), Tmon10 = T.filter(t => t >= 10).length;
    const share = MAP > 0 ? Psum / MAP : 0.5;
    const Pth = 2 * MAT + (share >= 0.7 ? 28 : share <= 0.3 ? 0 : 14);       // cm: Peel's threshold, ×10 for mm
    const steps = [];
    const ask = (q, val, yes) => { steps.push({ q, val, yes }); return yes; };
    let code;
    if (ask('Warmest month below 10 °C?', Thot, Thot < 10)) code = ask('Warmest month above 0 °C?', Thot, Thot > 0) ? 'ET' : 'EF';
    else if (ask('Rain below the dry line ' + Math.max(0, 10 * Pth).toFixed(0) + ' mm?', MAP, MAP < 10 * Pth)) {
      code = 'B' + (ask('Below half of it, ' + Math.max(0, 5 * Pth).toFixed(0) + ' mm?', MAP, MAP < 5 * Pth) ? 'W' : 'S');
      code += ask('Year’s mean 18 °C or more?', MAT, MAT >= 18) ? 'h' : 'k';
    } else if (ask('Coldest month 18 °C or more?', Tcold, Tcold >= 18)) {
      if (ask('Driest month 60 mm or more?', Pdry, Pdry >= 60)) code = 'Af';
      else if (ask('Driest month ≥ 100 − rain/25 = ' + (100 - MAP / 25).toFixed(0) + ' mm?', Pdry, Pdry >= 100 - MAP / 25)) code = 'Am';
      else code = Psdry <= Pwdry ? 'As' : 'Aw';
    } else {
      const C = ask('Coldest month above 0 °C?', Tcold, Tcold > 0);
      let second;
      if (ask('Driest summer month under 40 mm and a third of the wettest winter one?', Psdry, Psdry < 40 && Psdry < Pwwet / 3)) second = 's';
      else if (ask('Driest winter month under a tenth of the wettest summer one?', Pwdry, Pwdry < Pswet / 10)) second = 'w';
      else second = 'f';
      let third;
      if (ask('Warmest month 22 °C or more?', Thot, Thot >= 22)) third = 'a';
      else if (ask('Four or more months at 10 °C or above?', Tmon10, Tmon10 >= 4)) third = 'b';
      else third = (!C && Tcold < -38) ? 'd' : 'c';
      code = (C ? 'C' : 'D') + second + third;
    }
    return { code, steps, MAT, MAP, Thot, Tcold, Pdry, Psdry, Pwdry, Pswet, Pwwet, Tmon10, Pth: 10 * Pth, share };
  }
  const KG_NAME = { Af: 'tropical rainforest', Am: 'tropical monsoon', Aw: 'tropical savanna', As: 'tropical savanna, dry summer',
    BWh: 'hot desert', BWk: 'cold desert', BSh: 'hot steppe', BSk: 'cold steppe',
    Csa: 'hot-summer Mediterranean', Csb: 'warm-summer Mediterranean', Csc: 'cool-summer Mediterranean',
    Cwa: 'monsoon-influenced humid subtropical', Cwb: 'subtropical highland', Cwc: 'cold subtropical highland',
    Cfa: 'humid subtropical', Cfb: 'oceanic', Cfc: 'subpolar oceanic',
    Dsa: 'hot-summer continental, dry summer', Dsb: 'warm-summer continental, dry summer', Dsc: 'subarctic, dry summer', Dsd: 'extremely cold subarctic',
    Dwa: 'monsoon continental', Dwb: 'monsoon continental, warm summer', Dwc: 'monsoon subarctic', Dwd: 'extremely cold monsoon subarctic',
    Dfa: 'hot-summer humid continental', Dfb: 'warm-summer humid continental', Dfc: 'subarctic', Dfd: 'extremely cold subarctic',
    ET: 'tundra', EF: 'ice cap' };

  /* ============================================================
     3. THE WORLD MAP — a geography model, sea-level temperatures.
     land(lat, lon) → true/false is passed in (the page's land mask).
       continentality c: the share of land in the 2,500 km the air has just
       crossed — from the west in the westerlies (30–65°), from the east in
       the trades and the polar easterlies — and in the 600 km around;
       T = zonal mean(lat) + oceanic warmth of the high-latitude seas
           + A(lat, c)·cos(season), A = |lat|·(0.075 + 0.30c), at most 21 °C,
           the land peaking in late July, the sea three weeks later;
       P = the ITCZ (following the Sun, further over land) + the storm track
           (poleward in summer, stronger in winter) + onshore trades on east
           coasts, × the interior's dryness.
     ============================================================ */
  const ZONAL = [[-90, -40], [-80, -32], [-70, -14], [-60, -1], [-50, 6], [-40, 14], [-30, 20.5], [-20, 25], [-10, 26], [0, 26.5],
    [10, 26.5], [20, 26], [30, 22], [40, 15], [50, 7], [60, -1], [70, -10], [80, -18], [90, -21]];
  function zonalT(lat) { for (let i = 1; i < ZONAL.length; i++) if (lat <= ZONAL[i][0]) { const a = ZONAL[i - 1], b = ZONAL[i], t = (lat - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return -21; }
  const KM_DEG = 111.2;
  function geoOf(land, lat, lon) {
    const isLand = !!land(lat, lon);
    const al = Math.abs(lat), dir = al >= 30 && al < 65 ? -1 : 1;       // upwind: west in the westerlies, east elsewhere
    let wsum = 0, lsum = 0;
    for (let k = 1; k <= 12; k++) {
      const dkm = k * 210, dlon = dir * dkm / (KM_DEG * Math.max(0.15, Math.cos(lat * Math.PI / 180)));
      const w = Math.exp(-dkm / 1200);
      wsum += w; if (land(lat, ((lon + dlon + 540) % 360) - 180)) lsum += w;
    }
    let near = 0, nn = 0;
    for (let a = 0; a < 8; a++) for (const rk of [300, 600]) {
      const dla = rk / KM_DEG * Math.sin(a / 8 * TAU), dlo = rk / (KM_DEG * Math.max(0.15, Math.cos(lat * Math.PI / 180))) * Math.cos(a / 8 * TAU);
      nn++; if (land(clamp(lat + dla, -89.9, 89.9), ((lon + dlo + 540) % 360) - 180)) near++;
    }
    const up = lsum / wsum, around = near / nn;
    // trade-wind coasts: the air comes from the east; an ocean upwind brings rain
    let east = 0, west = 0; for (let k = 1; k <= 6; k++) { if (!land(lat, ((lon + k * 3 + 540) % 360) - 180)) east++; if (!land(lat, ((lon - k * 2 + 540) % 360) - 180)) west++; }
    return { isLand, up, westSea: west / 6, c: isLand ? clamp(0.7 * up + 0.3 * around, 0, 1) : clamp(0.35 * up, 0, 1), interior: isLand ? around : 0, eastSea: east / 6 };
  }
  function mapT(lat, G, m, dT) {
    const al = Math.abs(lat), sgn = lat >= 0 ? 1 : -1;
    // seas warmed by currents from the tropics keep high-latitude west coasts mild (the North Atlantic most)
    const warmSea = (1 - G.up) * 7 * Math.exp(-Math.pow((al - 56) / 13, 2)) * (lat > 0 ? 1 : 0.35);
    const A = Math.min(20, al * (0.075 + 0.26 * G.c + (G.isLand ? 0.035 : 0))) * (lat < 0 ? 0.75 : 1);
    const peak = (G.isLand ? 6.7 : 7.4) / 12;                 // late July on land, mid-August at sea (north)
    const f = (m + 0.5) / 12;
    return zonalT(lat) + warmSea - 2.5 * G.c * clamp((al - 25) / 15, 0, 1) + A * sgn * Math.cos(TAU * (f - peak)) + (dT || 0);
  }
  function mapP(lat, G, m, pMul) {
    const f = (m + 0.5) / 12, sunLat = 23.4 * Math.sin(TAU * (f - 0.22));   // the Sun's latitude through the year
    const lagLat = 23.4 * Math.sin(TAU * (f - 0.30));                      // the rain belts follow it a month late
    const al = Math.abs(lat), hs = lat >= 0 ? Math.max(0, lagLat) / 23.4 : Math.max(0, -lagLat) / 23.4;
    const hw = lat >= 0 ? Math.max(0, -lagLat) / 23.4 : Math.max(0, lagLat) / 23.4;
    const itcz = 5 + (G.isLand ? 0.75 : 0.35) * lagLat;
    let p = 260 * Math.exp(-Math.pow((lat - itcz) / (G.isLand ? 10 : 8.5), 2)) + 60 * Math.exp(-Math.pow(lat / 8, 2));
    // the monsoon: land in its summer draws in moist air off the sea
    if (G.isLand) p += 330 * hs * hs * Math.exp(-Math.pow((al - 18) / 8, 2)) * (1 - 0.75 * G.interior) * (0.4 + 0.6 * G.eastSea + 0.4 * (1 - G.interior));
    const track = 47 + 7 * hs - 7 * hw;
    p += (75 + 35 * hw) * Math.exp(-Math.pow((al - track) / 12, 2));
    p += 95 * G.eastSea * Math.exp(-Math.pow((al - 26) / 11, 2)) * (G.isLand ? 1 : 0.5) * (0.6 + 0.8 * hs);
    p += 10 + 8 * Math.exp(-Math.pow((al - 60) / 20, 2));
    // summer storms over warm land, fed by moist air from the sea to the south and east
    if (G.isLand) p += 85 * hs * Math.exp(-Math.pow((al - 42) / 13, 2)) * (1 - 0.85 * (G.westSea || 0));
    // the subtropical highs: sinking air, strongest on their eastern flanks (west coasts), poleward in summer
    const hi = 29 + 9 * hs - 4 * hw;
    p *= 1 - 0.92 * Math.exp(-Math.pow((al - hi) / 8, 2)) * clamp(0.4 + 0.6 * (G.westSea == null ? 0.5 : G.westSea) - 0.3 * G.eastSea, 0.15, 1);
    p *= 1 - 0.45 * G.interior * (G.isLand ? 1 : 0);
    if (al > 70) p *= 1 - (al - 70) / 30 * 0.7;
    return Math.max(0.5, p) * (pMul || 1);
  }

  /* ---------- the map on a grid: 2° cells, built once from the land mask ---------- */
  const landFn = () => (typeof window !== 'undefined' && window.EARTH && window.EARTH.ready()) ? window.EARTH.landAt : null;
  const GRID = { G: null, F: {}, K: {} };
  const NJ = 180, NI = 360;
  function geoGrid() {
    if (GRID.G) return GRID.G;
    const land = landFn(); if (!land) return null;
    const G = new Array(NJ * NI);
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) G[j * NI + i] = geoOf(land, -89.5 + j, -179.5 + i);
    return (GRID.G = G);
  }
  function fieldGrid(kind, m, dT, pMul) {
    const key = kind + m + '|' + dT + '|' + pMul;
    if (GRID.F[key]) return GRID.F[key];
    const G = geoGrid(); if (!G) return null;
    const A = new Float32Array(NJ * NI);
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const lat = -89.5 + j, g = G[j * NI + i]; A[j * NI + i] = kind === 'T' ? mapT(lat, g, m, dT) : mapP(lat, g, m, pMul); }
    const ks = Object.keys(GRID.F); if (ks.length > 40) delete GRID.F[ks[0]];
    return (GRID.F[key] = A);
  }
  function kgGrid(dT, pMul) {
    const key = dT + '|' + pMul;
    if (GRID.K[key]) return GRID.K[key];
    const G = geoGrid(); if (!G) return null;
    const out = new Array(NJ * NI), share = { A: 0, B: 0, C: 0, D: 0, E: 0 }; let tot = 0;
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
      const g = G[j * NI + i]; if (!g.isLand) { out[j * NI + i] = null; continue; }
      const lat = -89.5 + j, T = [], P = [];
      for (let m = 0; m < 12; m++) { T.push(mapT(lat, g, m, dT)); P.push(mapP(lat, g, m, pMul)); }
      const c = koppen(T, P, lat).code; out[j * NI + i] = c;
      if (lat > -60) { const w = Math.cos(lat * Math.PI / 180); share[c[0]] += w; tot += w; }
    }
    Object.keys(share).forEach(k => share[k] = tot ? share[k] / tot * 100 : 0);
    out.share = share;
    const ks = Object.keys(GRID.K); if (ks.length > 12) delete GRID.K[ks[0]];
    return (GRID.K[key] = out);
  }
  function sampleGrid(A, lat, lon) {
    const fj = clamp(lat + 89.5, 0, NJ - 1.0001), fi = ((lon + 179.5) + NI) % NI, j = Math.floor(fj), i = Math.floor(fi), u = fi - i, v = fj - j, i2 = (i + 1) % NI;
    return (A[j * NI + i] * (1 - u) + A[j * NI + i2] * u) * (1 - v) + (A[(j + 1) * NI + i] * (1 - u) + A[(j + 1) * NI + i2] * u) * v;
  }
  /* the probe: what the map model says at one point, all year */
  function probeYear(p) {
    const land = landFn() || (() => false), g = geoOf(land, p.plat, p.plon), T = [], P = [];
    for (let m = 0; m < 12; m++) { T.push(mapT(p.plat, g, m, 0)); P.push(mapP(p.plat, g, m, 1)); }
    return { g, T, P };
  }
  const nearestStation = (lat, lon) => {
    let best = null, bd = 1e9;
    SK.forEach(k => { const s = STATIONS[k], d = gcDist(lat, lon, s.lat, s.lon); if (d < bd) { bd = d; best = k; } });
    return { key: best, km: bd };
  };
  function gcDist(a1, o1, a2, o2) {
    const r = Math.PI / 180, x = Math.sin((a2 - a1) * r / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin((o2 - o1) * r / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  /* ============================================================
     4. THE EXPERIMENT — set-ups, parameters, the run
     ============================================================ */
  const SETUPS = [
    { value: 'weathervsclimate', label: 'One day, or thirty years?', teaches: ['E1.1'] },
    { value: 'build', label: 'Build a climate from daily records', teaches: ['E1.2'] },
    { value: 'graphs', label: 'Read two climographs', teaches: ['E1.3'] },
    { value: 'maps', label: 'Read a climate map', teaches: ['E1.4'] },
    { value: 'zones', label: 'Sort the world into climate zones', teaches: ['E1.5'] }
  ];
  const is = (...a) => S => a.indexOf(S.p.setup) >= 0;
  const BASE = { setup: 'weathervsclimate', station: 'chicago', station2: 'sf', year: 2014, day: 23, trend: 2, seed: 1, pace: 0,
    nYears: 30, endYear: 2020, month: 0, mapvar: 'T', plat: 41.9, plon: -87.9, dT: 0, pMul: 1, units: 'C', iso: true };
  const SETUP_DEFAULTS = { weathervsclimate: { station: 'chicago' }, build: { station: 'chicago' }, graphs: { station: 'chicago', station2: 'sf' }, maps: { station: 'chicago' }, zones: { station: 'sac' } };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const HOME_STATION = { theta: -1.22, phi: 0.07, dist: 4.8, target: [0.35, 0, 1.0], fov: 0.66 };
  function globeHome(p) {
    const k = p.setup === 'graphs' ? null : p.station, s = k ? STATIONS[k] : null;
    let lat = s ? s.lat : 0, lon = s ? s.lon : 0;
    if (p.setup === 'graphs') { const a = STATIONS[p.station], b = STATIONS[p.station2]; lat = (a.lat + b.lat) / 2; lon = midLon(a.lon, b.lon); }
    if (p.setup === 'maps') { lat = p.plat; lon = p.plon; }
    return { theta: lon * Math.PI / 180, phi: clamp(lat * Math.PI / 180 * 0.8, -1.1, 1.1), dist: 3.5, target: [0, 0, 0], fov: 0.66 };
  }
  const midLon = (a, b) => { let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return a + d / 2; };
  const globeSetup = p => p.setup === 'graphs' || p.setup === 'maps' || p.setup === 'zones';

  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (!p.pre && (first ? p.setup !== BASE.setup : S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    p.year = Math.round(clamp(p.year, Y0, Y1)); p.day = Math.round(clamp(p.day, 0, 364)); p.seed = Math.round(p.seed);
    p.nYears = Math.round(clamp(p.nYears, 1, 60)); p.endYear = Math.round(clamp(p.endYear, Y0, Y1)); p.month = Math.round(clamp(p.month, 0, 11));
    if (p.endYear - p.nYears + 1 < Y0) p.nYears = p.endYear - Y0 + 1;           // the record starts in 1961
    if (!STATIONS[p.station]) p.station = 'chicago';
    if (!STATIONS[p.station2]) p.station2 = 'sf';
    S.t = 0; S.dayf = p.day; S.reveal = 0;
    const camKey = globeSetup(p) ? 'globe|' + (p.setup === 'graphs' ? p.station + p.station2 : p.setup === 'maps' ? '' : p.station) : 'station';
    if (!S.cam || S.camKey !== camKey) {
      const h = globeSetup(p) ? globeHome(p) : HOME_STATION;
      S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: h.fov });
      S.cam.minDist = globeSetup(p) ? 2.2 : 2.4; S.cam.maxDist = globeSetup(p) ? 8 : 9; S.camKey = camKey;
    }
    S.run = compute(p);
  }
  /* everything the plots and readouts need, computed once per set-up */
  function compute(p) {
    const R = {};
    if (p.setup === 'weathervsclimate') {
      R.Y = genYear(p.station, p.year, p.seed, p.trend);
      R.band = band(p.station, p.seed, p.trend);
      R.annual = []; for (let y = Y0; y <= Y1; y++) R.annual.push([y, mean(Array.from(genYear(p.station, y, p.seed, p.trend).T))]);
      R.fit = slope(R.annual.map(a => a[1]), R.annual.map(a => a[0])) * 10;
      R.n1 = stats(p.station, 1961, 1990, p.seed, p.trend).MAT; R.n2 = stats(p.station, 1991, 2020, p.seed, p.trend).MAT;
    }
    if (p.setup === 'build') {
      const a = p.endYear - p.nYears + 1;
      R.st = stats(p.station, a, p.endYear, p.seed, p.trend);
      R.run = []; let s = 0;
      for (let y = p.endYear; y >= a; y--) { const v = mean(Array.from(genYear(p.station, y, p.seed, p.trend).T)); s += v; R.run.push([p.endYear - y + 1, s / (p.endYear - y + 1), v]); }
      const v = R.run.map(r => r[2]), m = mean(v);
      R.sdYear = v.length > 1 ? Math.sqrt(v.reduce((q, x) => q + (x - m) * (x - m), 0) / (v.length - 1)) : 0.72;
      R.se = (v.length > 1 ? R.sdYear : 0.72) / Math.sqrt(p.nYears);
      R.truth = mean(STATIONS[p.station].T) + p.trend * ((a + p.endYear) / 2 - 2005.5) / 100;
    }
    if (p.setup === 'graphs') { R.A = STATIONS[p.station]; R.B = STATIONS[p.station2]; }
    if (p.setup === 'maps') R.probe = probeYear(p);
    if (p.setup === 'zones') {
      const s = STATIONS[p.station];
      R.base = koppen(s.T, s.P, s.lat);
      R.K = koppen(s.T.map(t => t + p.dT), s.P.map(v => v * p.pMul), s.lat);
    }
    return R;
  }
  function step(S, dt) {
    const p = S.p;
    if (p.setup === 'weathervsclimate' && p.pace > 0) S.dayf = (S.dayf + dt * p.pace) % 365;
    if (p.setup === 'build') S.reveal = Math.min(p.nYears, S.reveal + dt * 40);
  }
  const curDay = S => S.p.setup === 'weathervsclimate' ? Math.floor(S.dayf) % 365 : S.p.day;

  /* ============================================================
     5. THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const fT = (p, v, d) => p.units === 'F' ? (v * 9 / 5 + 32).toFixed(d == null ? 1 : d) + ' °F' : v.toFixed(d == null ? 1 : d) + ' °C';
  const fdT = (p, v, d) => p.units === 'F' ? (v * 9 / 5).toFixed(d == null ? 1 : d) + ' °F' : v.toFixed(d == null ? 1 : d) + ' °C';
  const fP = (p, v) => p.units === 'F' ? (v / 25.4).toFixed(v / 25.4 < 10 ? 2 : 1) + ' in' : (v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')) + ' mm';
  const dateOf = d => { const m = monthOf(d); return (d - MSTART[m] + 1) + ' ' + MON[m]; };
  const LIGHT_TEXT = '#EAF1FF', DIM = '#9FB0CC';
  function lay(g) {
    const W = g.w, H = g.h, narrow = W < 640, cardW = narrow ? W - 20 : Math.min(400, Math.max(300, W * 0.34));
    return { W, H, narrow, cardW, sw: narrow ? W : W - cardW - 24, HD: 58, FT: 26 };
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(), A = ART();
    if (!K || !A) return;
    const Ly = lay(g);
    if (globeSetup(p)) drawGlobe(S, g, Ly); else drawStation(S, g, Ly);
    const H = headerOf(S);
    K.header(g, H[0], H[1], H[2]);
  }
  function headerOf(S) {
    const p = S.p, R = S.run, st = STATIONS[p.station];
    if (p.setup === 'weathervsclimate') {
      const d = curDay(S), x = R.Y.X[d], md = R.band.mid[d];
      return [st.name + ', ' + dateOf(d) + ' ' + p.year + ': a high of ' + fT(p, x) + ' — ' + (x < md ? fdT(p, md - x) + ' below' : fdT(p, x - md) + ' above') + ' the normal',
        'weather is one day · climate is the pattern of thirty years of days · warming ' + p.trend.toFixed(1) + ' °C a century',
        'normal high for ' + dateOf(d) + ' ' + fT(p, md) + ' · 8 days in 10 between ' + fT(p, R.band.lo[d]) + ' and ' + fT(p, R.band.hi[d])];
    }
    if (p.setup === 'build') {
      const r = R.st;
      return [st.name + ': ' + p.nYears + ' year' + (p.nYears > 1 ? 's' : '') + ' of daily records, ' + (p.endYear - p.nYears + 1) + '–' + p.endYear + ' → a mean of ' + fT(p, r.MAT, 2),
        p.nYears * 365 + ' days averaged · one year’s mean wanders by ±' + fdT(p, R.sdYear, 2) + ' · the average of ' + p.nYears + ' by ±' + fdT(p, R.se, 2),
        'warmest month ' + MON[r.T.indexOf(Math.max(...r.T))] + ' ' + fT(p, Math.max(...r.T)) + ' · rain ' + fP(p, r.MAP) + ' a year · ' + Math.round(r.wetDays) + ' wet days'];
    }
    if (p.setup === 'graphs') {
      const a = R.A, b = R.B;
      return [a.name + ' and ' + b.name + ': two climates, read off their graphs',
        a.name + ': ' + fT(p, mean(a.T)) + ' mean, range ' + fdT(p, Math.max(...a.T) - Math.min(...a.T)) + ', ' + fP(p, sum(a.P)) + ' a year',
        b.name + ': ' + fT(p, mean(b.T)) + ' mean, range ' + fdT(p, Math.max(...b.T) - Math.min(...b.T)) + ', ' + fP(p, sum(b.P)) + ' a year'];
    }
    if (p.setup === 'maps') {
      const pr = R.probe, v = p.mapvar === 'T' ? fT(p, pr.T[p.month]) : fP(p, pr.P[p.month]);
      return [MON[p.month] + ' ' + (p.mapvar === 'T' ? 'mean temperature' : 'rainfall') + ' at ' + latS(p.plat) + ', ' + lonS(p.plon) + ': ' + v,
        (pr.g.isLand ? 'over land' : 'over the sea') + ' · the air has crossed ' + Math.round(pr.g.c * 100) + ' % land · sea-level temperatures, no mountains',
        'a model built from latitude, the season, land and sea — check it against the stations’ own records'];
    }
    const Kb = R.base, Kn = R.K;
    return [st.name + ' is ' + Kn.code + ' — ' + KG_NAME[Kn.code] + (p.dT || p.pMul !== 1 ? ' (was ' + Kb.code + ')' : ''),
      'world ' + (p.dT >= 0 ? 'warmer' : 'cooler') + ' by ' + fdT(p, Math.abs(p.dT)) + ' · rain × ' + p.pMul.toFixed(2) + ' · Köppen–Geiger key, Peel et al. 2007',
      'coldest ' + fT(p, Kn.Tcold) + ' · warmest ' + fT(p, Kn.Thot) + ' · rain ' + fP(p, Kn.MAP) + ' · dry line ' + fP(p, Math.max(0, Kn.Pth))];
  }
  const latS = v => Math.abs(v).toFixed(1) + '°' + (v >= 0 ? 'N' : 'S');
  const lonS = v => Math.abs(v).toFixed(1) + '°' + (v >= 0 ? 'E' : 'W');

  /* ---------- the weather station on its lawn ---------- */
  function drawStation(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = ART(), cam = S.cam, R = S.run;
    const d = curDay(S), year = p.setup === 'build' ? p.endYear : p.year;
    const Y = p.setup === 'build' ? genYear(p.station, year, p.seed, p.trend) : R.Y;
    const st = STATIONS[p.station], pw = st._pw || wetChance(st), m = monthOf(d);
    const snow = snowpack(p.station, year, p.seed, p.trend)[d];
    const wet = Y.P[d] >= 1, frozen = Y.T[d] < 0.5;
    const cloud = wet ? 0.92 : clamp(pw[m] * 0.9 + (((hash(d, year) % 100) / 100) - 0.5) * 0.4, 0, 0.7);
    const sw = Ly.sw;
    cam.fov = Ly.narrow ? 0.95 : 0.66; cam.setViewport(sw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    // the horizon: where the far edge of the lawn projects
    const hz = cam.project([cam.target[0] - Math.cos(cam.theta) * 60, cam.target[1] - Math.sin(cam.theta) * 60, 0]);
    A.sky(ctx, sw, g.h, hz.ok ? clamp(hz.y, 40, g.h) : g.h * 0.45, { cloud });
    // the ground runs to the horizon under everything: the textured lawn is laid over it
    const hy = hz.ok ? clamp(hz.y, 40, g.h) : g.h * 0.45, gg = ctx.createLinearGradient(0, hy, 0, g.h);
    const gc = snow > 2 ? ['#CBD6E2', '#E9EEF4'] : st.land === 'desert' ? ['#A88B62', '#C9A877'] : ['#3E6230', '#4E7A34'];
    gg.addColorStop(0, gc[0]); gg.addColorStop(1, gc[1]); ctx.fillStyle = gg; ctx.fillRect(0, hy, sw, g.h - hy);
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.34 });
    A.lawn(F, 60, snow, st.land === 'desert');
    const scr = A.stevenson(F, [0, 0, 0], { tmax: Y.X[d], tmin: Y.N[d] });
    const rg = A.rainGauge(F, [1.25, -0.55, 0], { wet });
    // a line of trees across the far side of the lawn, for scale — leafless in winter, snow-dusted when it lies
    const leafy = (m > 3 && m < 10) === (st.lat >= 0) || Math.abs(st.lat) < 25, T_ = window.TERRAIN, desert = st.land === 'desert', tundra = st.kg === 'ET';
    for (let i = 0; i < (desert ? 16 : tundra ? 0 : 14); i++) {
      const at = [-30 + i * 4.3 + (i % 3) * 1.1, 26 + (i % 4) * 2.2, 0], h = desert ? 0.8 + (i % 3) * 0.3 : 7 + ((i * 7) % 5) * 1.0;
      // evergreens stand bare-season and green alike; broadleaf trees only where it is their season; creosote scrub on a desert
      F.push(at, () => { const q = cam.project(at), q2 = cam.project([at[0], at[1], h]); if (!q.ok || !q2.ok || !T_) return; T_.tree(ctx, q.x, q.y, q.y - q2.y, { kind: desert ? 'broad' : (leafy ? (i % 3 === 1 ? 'conifer' : 'broad') : 'conifer'), state: desert ? 'dry' : 'live', seed: i }); });
    }
    if (g.labels && sw > 300) {
      const co = (at, dx, dy, t, c) => { const q = cam.project(at); if (!q.ok) return; const room = q.x > sw / 2 ? 1 : -1; R3.callout(F, at, (q.x + dx * 6 > sw - 20 || q.x + dx * 6 < 20) ? -dx : dx, dy, t, c); void room; };
      co(scr.top, 40, -26, 'Stevenson screen, double roof', '#DDE7F7');
      if (!Ly.narrow) co([0.39, 0.1, 1.45], 46, 20, 'louvres: air in, sunlight out', '#C9D4EA');
      co(rg.top, 36, -38, 'rain gauge, rim 30 cm up', '#DDE7F7');
      if (!Ly.narrow) co([0, -0.3, 1.27], -50, 46, 'thermometers 1.25 m up', '#C9D4EA');
      if (!Ly.narrow) co([-0.3, -0.5, 0.95], -40, 44, 'door faces the ' + (st.lat >= 0 ? 'north' : 'south') + ' pole', '#C9D4EA');
    }
    F.render();
    A.precip(ctx, sw, g.h, Y.P[d], frozen, S.t);
    const bq = cam.project(scr.bulb);
    ctx.restore();

    if (p.setup === 'weathervsclimate') {
      // the calendar strip: every day of this year, its high against the normal for its date
      const cx0 = 16, cx1 = sw - 16, cy = g.h - (Ly.narrow ? 112 : 88), ch = 18, dx = (cx1 - cx0) / 365;
      ctx.save();
      ctx.fillStyle = 'rgba(5,8,15,.72)'; ctx.fillRect(cx0 - 8, cy - 20, cx1 - cx0 + 16, ch + 40);
      for (let k = 0; k < 365; k++) { ctx.fillStyle = A.css(A.anomRGB(Y.X[k] - R.band.mid[k])); ctx.fillRect(cx0 + k * dx, cy, Math.ceil(dx) + 0.3, ch); }
      for (let k = 0; k < 365; k++) if (Y.P[k] >= 1) { ctx.fillStyle = Y.T[k] < 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(120,190,255,.9)'; ctx.fillRect(cx0 + k * dx, cy + ch + 2, Math.max(1, dx), Math.min(6, 1 + Y.P[k] / 6)); }
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(p.year + ' · each day’s high against the normal for its date', cx0, cy - 4);
      ctx.textAlign = 'right'; ctx.fillStyle = '#7FB7F2'; ctx.fillText('rain ▮  snow ▮', cx1, cy - 4);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = DIM;
      MSTART.forEach((s, k) => { if (Ly.narrow && k % 2) return; ctx.fillText(MON[k][0] + (Ly.narrow ? '' : MON[k].slice(1)), cx0 + (s + DAYS[k] / 2) * dx, cy + ch + 9); });
      const hx = cx0 + (d + 0.5) * dx;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(hx - 2, cy - 3, 4, ch + 6);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(hx, cy - 4); ctx.lineTo(hx - 6, cy - 13); ctx.lineTo(hx + 6, cy - 13); ctx.closePath(); ctx.fill();
      ctx.restore();
      g.handle(hx, cy + ch / 2, 12, 'day');
      S._cal = { x0: cx0, dx };
      stationCards(S, g, Ly, Y, d, bq);
    } else buildCards(S, g, Ly);
  }
  function stationCards(S, g, Ly, Y, d, bq) {
    const p = S.p, ctx = g.ctx, K = kit(), A = ART(), R = S.run;
    const W = Ly.cardW;
    // inside the screen, magnified
    const s1 = K.cardSlot(g, S, 'Inside the screen', W, { x: g.w - W - 12, y: Ly.HD + 6 });
    if (s1) {
      const h1 = 150;
      K.card(ctx, s1.x, s1.y, s1.w, h1);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Inside the screen, ' + dateOf(d), s1.x + 10, s1.y + 8);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('read and reset once a day · bulbs 1.25 m up, in the shade', s1.x + 10, s1.y + 24);
      A.thermoPair(ctx, s1.x + 4, s1.y + 40, s1.w - 10, h1 - 44, { tmax: Y.X[d], tmin: Y.N[d], tnow: (Y.X[d] + Y.N[d]) / 2 + 2, lo: -40, hi: 50, f: p.units === 'F' });
      if (!Ly.narrow && bq && bq.ok && g.labels) { ctx.save(); ctx.strokeStyle = 'rgba(200,215,240,.55)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bq.x, bq.y); ctx.lineTo(s1.x, s1.y + h1 / 2); ctx.stroke(); ctx.restore(); }
    }
    // the normal for this date
    const s2 = K.cardSlot(g, S, 'Normal for the date', W, { x: g.w - W - 12, y: Ly.HD + 6 + 160 });
    if (s2) {
      const rows = [
        ['Today’s high', fT(p, Y.X[d]), '#FFFFFF'],
        ['Normal high (median, 1991–2020)', fT(p, R.band.mid[d]), DIM],
        ['8 days in 10 lie between', fT(p, R.band.lo[d], 0) + ' and ' + fT(p, R.band.hi[d], 0), DIM],
        ['Warmer than', Math.round(percentile(p.station, p.seed, p.trend, d, Y.X[d])) + ' % of days like it', '#FFD38A'],
        ['This year’s mean', fT(p, R.annual[p.year - Y0][1], 2), DIM],
        ['Climate: 1961–90 → 1991–2020', fT(p, R.n1, 2) + ' → ' + fT(p, R.n2, 2), '#FFB27A']
      ];
      const h2 = 22 + rows.length * 19 + 8;
      K.card(ctx, s2.x, s2.y, s2.w, h2);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('One day against thirty years of days', s2.x + 10, s2.y + 8);
      rows.forEach((r, i) => {
        const yy = s2.y + 30 + i * 19;
        ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], s2.w * 0.5), s2.x + 10, yy);
        ctx.font = mono(10, 700); ctx.fillStyle = r[2]; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], s2.w * 0.48), s2.x + s2.w - 10, yy);
      });
    }
  }
  /* ---------- the record, built: years × days ---------- */
  function buildCards(S, g, Ly) {
    const p = S.p, ctx = g.ctx, K = kit(), A = ART(), R = S.run, st = R.st;
    const W = Ly.cardW, a = p.endYear - p.nYears + 1, shown = Math.max(1, Math.ceil(S.reveal));
    const s1 = K.cardSlot(g, S, 'Days × years', W, { x: g.w - W - 12, y: Ly.HD + 6 });
    if (s1) {
      const iw = s1.w - 60, rowH = clamp(200 / p.nYears, 3, 14), ih = rowH * p.nYears, h1 = ih + 150;
      K.card(ctx, s1.x, s1.y, s1.w, h1);
      ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(p.nYears + ' years of daily mean temperature', s1.x + 10, s1.y + 8);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('one row a year, one column a day, coloured by how warm', s1.x + 10, s1.y + 24);
      const key = 'R:' + p.station + p.seed + p.trend + a + p.endYear;
      const img = A.raster(key, 365, p.nYears, (i, j) => A.tempRGB(genYear(p.station, p.endYear - j, p.seed, p.trend).T[i]));
      const x0 = s1.x + 44, y0 = s1.y + 42;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.beginPath(); ctx.rect(x0, y0, iw, Math.min(ih, shown * rowH)); ctx.clip();
      ctx.drawImage(img, x0, y0, iw, ih); ctx.restore();
      ctx.strokeStyle = 'rgba(200,212,230,.5)'; ctx.strokeRect(x0 - 0.5, y0 - 0.5, iw + 1, ih + 1);
      ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(String(p.endYear), x0 - 4, y0 + rowH / 2); if (p.nYears > 1) ctx.fillText(String(a), x0 - 4, y0 + ih - rowH / 2);
      // the average day: the mean of every row
      const avY = y0 + ih + 10, avg = new Float32Array(365);
      for (let j = 0; j < shown; j++) { const Yr = genYear(p.station, p.endYear - j, p.seed, p.trend); for (let i = 0; i < 365; i++) avg[i] += Yr.T[i] / shown; }
      for (let i = 0; i < 365; i++) { ctx.fillStyle = A.css(A.tempRGB(avg[i])); ctx.fillRect(x0 + i * iw / 365, avY, iw / 365 + 0.6, 14); }
      ctx.fillStyle = DIM; ctx.textAlign = 'right'; ctx.fillText('mean', x0 - 4, avY + 7);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      MSTART.forEach((s, k) => { if (k % 2 === 0) ctx.fillText(MON[k], x0 + (s + DAYS[k] / 2) * iw / 365, avY + 17); });
      // the mean day as a curve over the colours, so the seasonal shape is read, not guessed
      const tl = Math.min(...avg) - 2, th = Math.max(...avg) + 2, cy0 = avY + 34, cy1 = s1.y + h1 - 12;
      ctx.strokeStyle = 'rgba(160,175,200,.35)'; ctx.strokeRect(x0, cy0, iw, cy1 - cy0);
      ctx.strokeStyle = '#FF8A5C'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < 365; i++) { const xx = x0 + (i + 0.5) * iw / 365, yy = cy1 - (avg[i] - tl) / (th - tl) * (cy1 - cy0); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
      ctx.font = mono(9); ctx.fillStyle = '#FF9A70'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(fT(p, th, 0), x0 - 4, cy0 + 4); ctx.fillText(fT(p, tl, 0), x0 - 4, cy1 - 4);
      ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('the average day, ' + shown + ' year' + (shown > 1 ? 's' : ''), x0 + 4, cy0 + 3);
      // drag the bottom edge of the record to use more years, or fewer
      const hy = y0 + ih;
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x0 + iw + 4, hy); ctx.lineTo(x0 + iw + 13, hy - 6); ctx.lineTo(x0 + iw + 13, hy + 6); ctx.closePath(); ctx.fill();
      g.handle(x0 + iw + 9, hy, 11, 'years');
      S._rows = { rowH };
    }
  }

  /* ---------- the globe and what is read off it ---------- */
  function drawGlobe(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = ART(), cam = S.cam, E = window.EARTH, sw = Ly.sw;
    cam.fov = Ly.narrow ? 0.8 : 0.66; cam.setViewport(sw, g.h); cam.update();
    if (!E || !E.ready()) {
      if (E) E.load();
      ctx.font = sans(13); ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.fillText(E && E.failed() ? 'the Earth image could not be loaded' : 'loading the Earth…', sw / 2, g.h / 2);
      globeCards(S, g, Ly, null);
      return;
    }
    const sun = R3.norm(R3.add(R3.add(R3.norm(cam.eye), R3.scale(cam.r, -0.55)), R3.scale(cam.u, 0.45)));
    let overlay = null;
    if (p.setup === 'maps') {
      const Fg = fieldGrid(p.mapvar, p.month, 0, 1);
      if (Fg) overlay = p.mapvar === 'T'
        ? (la, lo) => { const v = sampleGrid(Fg, la, lo), c = A.tempRGB(v), iso = p.iso && Math.abs(v / 10 - Math.round(v / 10)) < 0.045; return iso ? [20, 24, 34, 0.9] : [c[0], c[1], c[2], 0.80]; }
        : (la, lo) => { const v = sampleGrid(Fg, la, lo), c = A.rainRGB(v), lv = Math.log(v / 25) / Math.log(2), iso = p.iso && v > 12 && Math.abs(lv - Math.round(lv)) < 0.05; return iso ? [20, 24, 34, 0.85] : [c[0], c[1], c[2], 0.80]; };
    }
    if (p.setup === 'zones') {
      const Kg = kgGrid(p.dT, p.pMul);
      if (Kg) overlay = (la, lo) => { const j = clamp(Math.round(la + 89.5), 0, NJ - 1), i = ((Math.round(lo + 179.5) % NI) + NI) % NI, c = Kg[j * NI + i]; if (!c) return null; const k = A.kgRGB(c); return [k[0], k[1], k[2], 0.78]; };
    }
    const ov = overlay ? (la, lo) => overlay(la, lo) || [0, 0, 0, 0] : null;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sw, g.h); ctx.clip();
    E.draw(ctx, cam, [0, 0, 0], 1, { spin: 0, sun, ambient: overlay ? 0.55 : 0.2, overlay: ov, budget: Ly.narrow ? 70000 : 120000 });
    // the graticule: the equator, the tropics and the polar circles
    [[0, 'equator'], [23.44, 'Tropic of Cancer'], [-23.44, 'Tropic of Capricorn'], [66.56, 'Arctic Circle'], [-66.56, 'Antarctic Circle']].forEach(([la, name]) => {
      ctx.save(); ctx.strokeStyle = la ? 'rgba(230,236,250,.32)' : 'rgba(255,230,160,.55)'; ctx.setLineDash(la ? [3, 4] : []); ctx.lineWidth = 1; ctx.beginPath();
      let on = false, lab = null;
      for (let k = 0; k <= 180; k++) {
        const lo = k * 2 - 180, P = sph(la, lo), q = cam.project(P), vis = visible(cam, P);
        if (q.ok && vis) { on ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); on = true; if (!lab || q.x > lab.x) lab = q; } else on = false;
      }
      ctx.stroke(); ctx.restore();
      if (lab && g.labels && !Ly.narrow) { ctx.font = mono(8.5); ctx.fillStyle = 'rgba(230,236,250,.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(name, lab.x + 4, lab.y - 2); }
    });
    // the stations
    const pinFor = (k, col, lbl, o) => { const s = STATIONS[k], P = sph(s.lat, s.lon); if (!visible(cam, P)) return null; const q = cam.project(P); if (!q.ok) return null; A.pin(ctx, q.x, q.y, col, lbl, o); return q; };
    if (p.setup === 'graphs') {
      const qa = pinFor(p.station, '#FF6A3D', g.labels ? STATIONS[p.station].name : '', { len: 22 }), qb = pinFor(p.station2, '#4FA3FF', g.labels ? STATIONS[p.station2].name : '', { len: 22, left: true });
      if (qb) g.handle(qb.x, qb.y - 22, 11, 'stationB');
      if (qa) g.handle(qa.x, qa.y - 22, 11, 'stationA');
      // a station round the back of the globe: an arrow on the rim pointing the way to turn
      [[p.station, qa, '#FF6A3D'], [p.station2, qb, '#4FA3FF']].forEach(([k, q, col]) => {
        if (q) return;
        const s = STATIONS[k], P = sph(s.lat, s.lon), c0 = cam.project([0, 0, 0]), pq = cam.project(P);
        const dx = cam.r[0] * P[0] + cam.r[1] * P[1] + cam.r[2] * P[2], dy = -(cam.u[0] * P[0] + cam.u[1] * P[1] + cam.u[2] * P[2]), L_ = Math.hypot(dx, dy) || 1;
        const R_ = 1.02 * c0.s, ex = c0.x + dx / L_ * R_, ey = c0.y + dy / L_ * R_;
        ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, TAU); ctx.fill();
        ctx.font = sans(11, 700); ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.9)';
        const t = s.name + ' — round the back, drag to turn'; ctx.strokeText(t, ex + (dx < 0 ? -10 : 10), ey); ctx.fillStyle = '#F2F6FF'; ctx.fillText(t, ex + (dx < 0 ? -10 : 10), ey); ctx.restore();
        void pq;
      });
    }
    if (p.setup === 'zones') SK.forEach(k => {
      const s = STATIONS[k], c = k === p.station ? S.run.K.code : koppen(s.T.map(t => t + p.dT), s.P.map(v => v * p.pMul), s.lat).code;
      const q = pinFor(k, A.css(A.kgRGB(c)), g.labels && (k === p.station || !Ly.narrow) ? (k === p.station ? s.name + ' · ' + c : c) : '', { len: k === p.station ? 24 : 12, r: k === p.station ? 6 : 4, size: k === p.station ? 11 : 9 });
      if (q && k === p.station) g.handle(q.x, q.y - 24, 11, 'stationZ');
    });
    if (p.setup === 'maps') {
      const P = sph(p.plat, p.plon), q = cam.project(P);
      if (q.ok && visible(cam, P)) {
        ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(q.x - 12, q.y); ctx.lineTo(q.x - 4, q.y); ctx.moveTo(q.x + 4, q.y); ctx.lineTo(q.x + 12, q.y); ctx.moveTo(q.x, q.y - 12); ctx.lineTo(q.x, q.y - 4); ctx.moveTo(q.x, q.y + 4); ctx.lineTo(q.x, q.y + 12); ctx.stroke(); ctx.restore();
        g.handle(q.x, q.y, 12, 'probe');
      }
      // each station's own record, in the map's colours: where a pin and the ground under it disagree, the model is missing something
      SK.forEach(k => { const s = STATIONS[k], c = p.mapvar === 'T' ? A.tempRGB(s.T[p.month]) : A.rainRGB(s.P[p.month]); pinFor(k, A.css(c), g.labels && !Ly.narrow ? s.name.split(' ')[0] : '', { len: 14, r: 4.5, size: 9 }); });
    }
    ctx.restore();
    globeCards(S, g, Ly, true);
  }
  const sph = (la, lo) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; };
  const visible = (cam, P) => (cam.eye[0] - P[0]) * P[0] + (cam.eye[1] - P[1]) * P[1] + (cam.eye[2] - P[2]) * P[2] > 0.02;

  function globeCards(S, g, Ly) {
    const p = S.p, ctx = g.ctx, K = kit(), A = ART(), R = S.run, W = Ly.cardW, x = g.w - W - 12;
    if (p.setup === 'graphs') {
      [[R.A, p.station, '#FF6A3D'], [R.B, p.station2, '#4FA3FF']].forEach(([s, k], i) => {
        const chh = Ly.narrow ? 204 : clamp((g.h - Ly.HD - 60) / 2, 150, 204);
        const sl = K.cardSlot(g, S, s.name, W, { x, y: Ly.HD + 6 + i * (chh + 8) });
        if (!sl) return;
        K.card(ctx, sl.x, sl.y, sl.w, chh);
        const lo = Math.min(-30, Math.floor(Math.min(...R.A.T, ...R.B.T) / 10) * 10), hi = 40, pm = Math.max(100, Math.ceil(Math.max(...R.A.P, ...R.B.P) / 100) * 100);
        ctx.font = sans(11, 700);
        A.climograph(ctx, sl.x + 6, sl.y + 6, sl.w - 12, chh - 38, { T: s.T, P: s.P, tmin: lo, tmax: hi, pmax: pm, title: K.fitText(ctx, s.name + ' · ' + latS(s.lat) + ' · ' + s.elev + ' m · ' + s.note, sl.w - 40), f: p.units === 'F' });
        const wm = s.T.indexOf(Math.max(...s.T)), cm = s.T.indexOf(Math.min(...s.T)), pm1 = s.P.indexOf(Math.max(...s.P)), dm = s.P.indexOf(Math.min(...s.P));
        ctx.font = mono(9); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(K.fitText(ctx, 'warmest ' + MON[wm] + ' · coldest ' + MON[cm] + ' · wettest ' + MON[pm1] + ' · driest ' + MON[dm], sl.w - 20), sl.x + 10, sl.y + chh - 28);
        ctx.fillText(K.fitText(ctx, 'mean ' + fT(p, mean(s.T)) + ' · range ' + fdT(p, Math.max(...s.T) - Math.min(...s.T)) + ' · ' + fP(p, sum(s.P)) + ' a year', sl.w - 20), sl.x + 10, sl.y + chh - 15);
      });
    }
    if (p.setup === 'maps') {
      const sl = K.cardSlot(g, S, 'Key', W, { x, y: Ly.HD + 6 });
      if (sl) {
        const pr = R.probe, nst = nearestStation(p.plat, p.plon), s = STATIONS[nst.key];
        K.card(ctx, sl.x, sl.y, sl.w, 196);
        ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(MON[p.month] + ' ' + (p.mapvar === 'T' ? 'mean temperature at sea level' : 'rainfall in the month'), sl.x + 10, sl.y + 8);
        if (p.mapvar === 'T') A.colourBar(ctx, sl.x + 14, sl.y + 32, sl.w - 50, 12, A.tempRGB, -40, 40, [-40, -20, 0, 20, 40], p.units === 'F' ? '°F' : '°C', v => p.units === 'F' ? Math.round(v * 9 / 5 + 32) : v);
        else A.colourBar(ctx, sl.x + 14, sl.y + 32, sl.w - 50, 12, v => A.rainRGB(v), 0, 400, [0, 100, 200, 300, 400], p.units === 'F' ? 'in' : 'mm', v => p.units === 'F' ? (v / 25.4).toFixed(0) : v);
        ctx.font = mono(9); ctx.fillStyle = DIM;
        ctx.fillText(p.iso ? (p.mapvar === 'T' ? 'dark lines: isotherms, every 10 °C' : 'dark lines: 25, 50, 100, 200, 400 mm') : 'isolines off', sl.x + 14, sl.y + 64);
        const rows = [['The probe, ' + latS(p.plat) + ' ' + lonS(p.plon), ''], ['model, ' + MON[p.month], p.mapvar === 'T' ? fT(p, pr.T[p.month]) : fP(p, pr.P[p.month])],
          ['model, all year', fT(p, mean(pr.T)) + ' · ' + fP(p, sum(pr.P))], ['nearest station: ' + s.name, Math.round(nst.km).toLocaleString('en-US') + ' km'],
          ['its record, ' + MON[p.month], p.mapvar === 'T' ? fT(p, s.T[p.month]) : fP(p, s.P[p.month])]];
        rows.forEach((r, i) => { const yy = sl.y + 84 + i * 21; ctx.font = mono(10); ctx.fillStyle = i ? DIM : LIGHT_TEXT; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], sl.w * 0.6), sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = '#FFD38A'; ctx.textAlign = 'right'; ctx.fillText(r[1], sl.x + sl.w - 10, yy); });
      }
    }
    if (p.setup === 'zones') {
      const K0 = R.K, sl = K.cardSlot(g, S, 'Köppen key', W, { x, y: Ly.HD + 6 });
      if (sl) {
        const h = 50 + K0.steps.length * 30 + 44;
        K.card(ctx, sl.x, sl.y, sl.w, h);
        const s = STATIONS[p.station];
        ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('The Köppen key, run on ' + s.name, sl.x + 10, sl.y + 8);
        ctx.font = mono(9); ctx.fillStyle = DIM; ctx.fillText('each question asked of its thirty-year normals, in order', sl.x + 10, sl.y + 24);
        K0.steps.forEach((st, i) => {
          const yy = sl.y + 44 + i * 30;
          K.led(ctx, sl.x + 16, yy + 7, true, st.yes ? '#4FD18B' : '#E05A4A');
          ctx.font = mono(10); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, st.q, sl.w - 40), sl.x + 28, yy);
          ctx.fillStyle = st.yes ? '#4FD18B' : '#E8907F'; ctx.fillText((st.yes ? 'yes' : 'no') + ' — ' + fmtStep(p, st), sl.x + 28, yy + 13);
        });
        const yb = sl.y + 44 + K0.steps.length * 30 + 4, c = A.kgRGB(K0.code);
        ctx.fillStyle = A.css(c); ctx.fillRect(sl.x + 10, yb, 34, 24);
        ctx.font = sans(15, 800); ctx.fillStyle = (c[0] + c[1] + c[2]) > 450 ? '#111' : '#FFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(K0.code, sl.x + 27, yb + 12);
        ctx.font = sans(12, 700); ctx.fillStyle = LIGHT_TEXT; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, KG_NAME[K0.code], sl.w - 70), sl.x + 52, yb + 12);
      }
      // the world's thermostat: drag it to warm or cool every month everywhere
      if (!Ly.narrow) {
        const tx = 26, t0 = Ly.HD + 40, t1 = g.h - 70, ty = t1 - (p.dT + 6) / 12 * (t1 - t0);
        ctx.save(); K.card(ctx, tx - 16, t0 - 26, 52, t1 - t0 + 58);
        ctx.fillStyle = 'rgba(220,235,250,.18)'; ctx.fillRect(tx - 3, t0, 6, t1 - t0);
        const gr = ctx.createLinearGradient(0, t1, 0, t0); gr.addColorStop(0, '#4FA3FF'); gr.addColorStop(0.5, '#E8E8E8'); gr.addColorStop(1, '#FF5A3A');
        ctx.fillStyle = gr; ctx.fillRect(tx - 2, ty, 4, t1 - ty);
        RX.ball(ctx, tx, t1 + 10, 8, p.dT > 0 ? '#FF5A3A' : '#4FA3FF', { shadow: false });
        ctx.font = mono(8.5); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        [-6, -3, 0, 3, 6].forEach(v => { const yy = t1 - (v + 6) / 12 * (t1 - t0); ctx.fillRect(tx + 4, yy, 4, 1); ctx.fillText((v > 0 ? '+' : '') + v, tx + 10, yy); });
        ctx.textAlign = 'center'; ctx.fillStyle = LIGHT_TEXT; ctx.fillText('world', tx + 8, t0 - 16); ctx.fillText('ΔT °C', tx + 8, t0 - 6);
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, TAU); ctx.fill();
        ctx.restore();
        g.handle(tx, ty, 10, 'dT');
        S._thermo = { t0, t1 };
      }
    }
  }
  function fmtStep(p, st) {
    const q = st.q;
    if (/month (below|above|1|0|18|10|22)|Coldest|Warmest|mean/.test(q) && !/Four/.test(q)) return fT(p, st.val);
    if (/Four/.test(q)) return st.val + ' months';
    return fP(p, st.val);
  }

  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'day' && S._cal) { p.day = Math.round(clamp((e.x - S._cal.x0) / S._cal.dx, 0, 364)); S.dayf = p.day; if (e.phase === 'end') this.setup(S); else S.run = S.run; return; }
    if (e.id === 'years' && S._rows) { const n = clamp(p.nYears + e.dy / S._rows.rowH, 1, 60); p.nYears = Math.round(n); if (e.phase !== 'move' || Math.round(n) !== S._lastN) { S._lastN = p.nYears; this.setup(S); S.reveal = p.nYears; } return; }
    if (e.id === 'dT' && S._thermo) { const T = S._thermo; p.dT = Math.round(clamp(6 - (e.y - T.t0) / (T.t1 - T.t0) * 12, -6, 6) * 10) / 10; S.run = compute(p); return; }
    if (e.id === 'probe') { const ll = pick(S, e.x, e.y); if (ll) { p.plat = Math.round(ll[0] * 10) / 10; p.plon = Math.round(ll[1] * 10) / 10; S.run = compute(p); } return; }
    if ((e.id === 'stationB' || e.id === 'stationA' || e.id === 'stationZ') && e.phase === 'end') {
      const ll = pick(S, e.x, e.y + 22); if (!ll) return;
      const n = nearestStation(ll[0], ll[1]).key;
      if (e.id === 'stationB') p.station2 = n; else p.station = n;
      p.pre = 1; this.setup(S);
    }
  }
  /* the point of the globe under a screen position: a ray from the eye, met with the unit sphere */
  function pick(S, x, y) {
    const c = S.cam; if (!c || !c._k) return null;
    const dx = (x - c._w / 2) / c._k, dy = -(y - c._h / 2) / c._k;
    const d = R3.norm([c.f[0] + dx * c.r[0] + dy * c.u[0], c.f[1] + dx * c.r[1] + dy * c.u[1], c.f[2] + dx * c.r[2] + dy * c.u[2]]);
    const b = c.eye[0] * d[0] + c.eye[1] * d[1] + c.eye[2] * d[2], cc = c.eye[0] ** 2 + c.eye[1] ** 2 + c.eye[2] ** 2 - 1, disc = b * b - cc;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc), P = [c.eye[0] + t * d[0], c.eye[1] + t * d[1], c.eye[2] + t * d[2]];
    return [Math.asin(clamp(P[2], -1, 1)) * 180 / Math.PI, Math.atan2(P[1], P[0]) * 180 / Math.PI];
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     6. PLOTS, READOUTS, EQUATION
     ============================================================ */
  const PC = { band: 'rgba(120,150,200,.28)', mid: '#8FA3C0', line: '#FF8A5C', A: '#FF6A3D', B: '#4FA3FF', rain: '#4F8FE0', ok: '#4FD18B' };
  function keyBand(g, items, note) { const K = kit(); return K ? K.plotKey(g, items, note) : { t: 14, draw() {} }; }
  const yT = p => v => p.units === 'F' ? (v * 9 / 5 + 32).toFixed(0) : v.toFixed(0);

  const plot1 = {
    title: S => ({ weathervsclimate: 'Every day’s high in ' + S.p.year + ', against the normal for its date', build: 'The average, as years are added', graphs: 'The two climographs on one frame', maps: 'Along the meridian through the probe', zones: STATIONS[S.p.station].name + ' against the Köppen lines' })[S.p.setup],
    draw(S, g) {
      const p = S.p, R = S.run, th = g.theme;
      if (p.setup === 'weathervsclimate') {
        const Kk = keyBand(g, [{ c: PC.band, box: true, label: '8 days in 10, 1991–2020' }, { c: PC.mid, label: 'normal (median)' }, { c: PC.line, label: p.year + ' highs' }]);
        const lo = Math.floor(Math.min(...R.band.lo, ...R.Y.X) / 5) * 5 - 2, hi = Math.ceil(Math.max(...R.band.hi, ...R.Y.X) / 5) * 5 + 2;
        const P = g.Plot({ xmin: 0, xmax: 365, ymin: lo, ymax: hi, xlabel: 'day of the year', ylabel: p.units === 'F' ? 'high °F' : 'high °C', xticks: MSTART.concat([365]), xfmt: v => v < 365 ? MON[monthOf(v)][0] : '', yfmt: yT(p), pad: { t: Kk.t } }).frame();
        Kk.draw(P);
        P.clip(() => {
          const top = [], bot = [];
          for (let d = 0; d < 365; d++) { top.push([d, R.band.hi[d]]); bot.push([d, R.band.lo[d]]); }
          g.ctx.fillStyle = PC.band; g.ctx.beginPath(); top.forEach((q, i) => i ? g.ctx.lineTo(P.X(q[0]), P.Y(q[1])) : g.ctx.moveTo(P.X(q[0]), P.Y(q[1]))); bot.reverse().forEach(q => g.ctx.lineTo(P.X(q[0]), P.Y(q[1]))); g.ctx.closePath(); g.ctx.fill();
          P.line(Array.from(R.band.mid, (v, d) => [d, v]), PC.mid, 1.6);
          P.line(Array.from(R.Y.X, (v, d) => [d, v]), PC.line, 1.3);
          const d = curDay(S); P.vline(d, 'rgba(255,255,255,.6)', [3, 3]); P.dot(d, R.Y.X[d], 4.5, '#FFFFFF', 'rgba(0,0,0,.5)');
        });
        return;
      }
      if (p.setup === 'build') {
        const Kk = keyBand(g, [{ c: PC.line, label: 'mean of the first N years' }, { c: '#C9D4EA', dot: true, label: 'each year alone' }, { c: PC.band, box: true, label: '± 2 standard errors' }]);
        const v = R.run.map(r => r[2]), lo = Math.floor(Math.min(...v) - 1), hi = Math.ceil(Math.max(...v) + 1);
        const P = g.Plot({ xmin: 0, xmax: Math.max(10, p.nYears) + 0.5, ymin: lo, ymax: hi, xlabel: 'years averaged, counting back from ' + p.endYear, ylabel: p.units === 'F' ? 'mean °F' : 'mean °C', yfmt: v2 => p.units === 'F' ? (v2 * 9 / 5 + 32).toFixed(1) : v2.toFixed(1), pad: { t: Kk.t } }).frame();
        Kk.draw(P);
        P.clip(() => {
          const m = R.run[R.run.length - 1][1], top = [], bot = [];
          for (let n = 1; n <= Math.max(10, p.nYears); n++) { top.push([n, m + 2 * R.sdYear / Math.sqrt(n)]); bot.push([n, m - 2 * R.sdYear / Math.sqrt(n)]); }
          g.ctx.fillStyle = PC.band; g.ctx.beginPath(); top.forEach((q, i) => i ? g.ctx.lineTo(P.X(q[0]), P.Y(q[1])) : g.ctx.moveTo(P.X(q[0]), P.Y(q[1]))); bot.reverse().forEach(q => g.ctx.lineTo(P.X(q[0]), P.Y(q[1]))); g.ctx.closePath(); g.ctx.fill();
          R.run.forEach(r => P.dot(r[0], r[2], 2.4, '#C9D4EA'));
          P.line(R.run.map(r => [r[0], r[1]]), PC.line, 2.2);
          P.dot(p.nYears, R.st.MAT, 5, '#FFFFFF', 'rgba(0,0,0,.5)');
        });
        return;
      }
      if (p.setup === 'graphs') {
        const a = R.A, b = R.B;
        const Kk = keyBand(g, [{ c: PC.A, label: a.name + ' °C' }, { c: PC.B, label: b.name + ' °C' }, { c: 'rgba(255,106,61,.45)', box: true, label: 'rain' }, { c: 'rgba(79,163,255,.45)', box: true, label: 'rain' }]);
        const tl = Math.min(-10, Math.floor(Math.min(...a.T, ...b.T) / 10) * 10), pm = Math.max(100, Math.ceil(Math.max(...a.P, ...b.P) / 100) * 100);
        const P = g.Plot({ xmin: 0, xmax: 12, ymin: tl, ymax: 40, xlabel: 'month', ylabel: p.units === 'F' ? 'temperature °F' : 'temperature °C', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5], xfmt: v => 'JFMAMJJASOND'[Math.floor(v)], yfmt: yT(p), pad: { t: Kk.t, r: 40 } }).frame();
        Kk.draw(P);
        const toY = v => tl + v / pm * (40 - tl);
        P.clip(() => {
          for (let m = 0; m < 12; m++) { P.bar(m + 0.3, toY(a.P[m]), 0.19, tl, 'rgba(255,106,61,.45)'); P.bar(m + 0.7, toY(b.P[m]), 0.19, tl, 'rgba(79,163,255,.45)'); }
          P.line(a.T.map((t, m) => [m + 0.5, t]), PC.A, 2.4); P.line(b.T.map((t, m) => [m + 0.5, t]), PC.B, 2.4);
        });
        g.ctx.font = mono(9); g.ctx.fillStyle = '#7FB7F2'; g.ctx.textAlign = 'left'; g.ctx.textBaseline = 'middle';
        [0, pm / 2, pm].forEach(v => g.ctx.fillText(p.units === 'F' ? (v / 25.4).toFixed(0) + ' in' : v + ' mm', P.x1 + 3, P.Y(toY(v))));
        return;
      }
      if (p.setup === 'maps') {
        const land = landFn() || (() => false), T = p.mapvar === 'T';
        const Kk = keyBand(g, [{ c: T ? '#FF8A5C' : PC.rain, label: MON[p.month] + ' along ' + lonS(p.plon) }, { c: '#8FA3C0', label: 'zonal mean', dash: [4, 3] }, { c: 'rgba(180,150,100,.3)', box: true, label: 'land' }]);
        const P = g.Plot({ xmin: -90, xmax: 90, ymin: T ? -50 : 0, ymax: T ? 40 : 400, xlabel: 'latitude (south ← → north)', ylabel: T ? (p.units === 'F' ? '°F' : '°C') : (p.units === 'F' ? 'rain, in' : 'rain, mm'), xticks: [-90, -60, -30, 0, 30, 60, 90], xfmt: v => v === 0 ? '0' : Math.abs(v) + (v > 0 ? 'N' : 'S'), yfmt: T ? yT(p) : v => p.units === 'F' ? (v / 25.4).toFixed(0) : v, pad: { t: Kk.t } }).frame();
        Kk.draw(P);
        const pts = [], zon = [];
        P.clip(() => {
          for (let la = -88; la <= 88; la += 2) {
            const G = geoOf(land, la, p.plon), v = T ? mapT(la, G, p.month, 0) : mapP(la, G, p.month, 1);
            if (G.isLand) P.bar(la, T ? 40 : 400, 1, T ? -50 : 0, 'rgba(180,150,100,.22)');
            pts.push([la, v]);
            zon.push([la, T ? zonalT(la) : mapP(la, { isLand: false, c: 0.3, interior: 0, eastSea: 0.5 }, p.month, 1)]);
          }
          P.line(zon, '#8FA3C0', 1.4, [4, 3]); P.line(pts, T ? '#FF8A5C' : PC.rain, 2.2);
          if (T) P.hline(0, 'rgba(160,200,255,.5)', [2, 3]);
          P.vline(p.plat, 'rgba(255,255,255,.6)', [3, 3]);
          P.dot(p.plat, T ? R.probe.T[p.month] : R.probe.P[p.month], 4.5, '#FFFFFF', 'rgba(0,0,0,.5)');
        });
        return;
      }
      // zones: the station's climograph with the lines the key draws
      const s = STATIONS[p.station], K0 = R.K, T = s.T.map(t => t + p.dT), Pp = s.P.map(v => v * p.pMul);
      const Kk = keyBand(g, [{ c: '#FF6A3D', label: 'temperature' }, { c: 'rgba(79,143,224,.6)', box: true, label: 'rain' }, { c: '#FFD38A', label: '18 · 10 · 0 °C', dash: [4, 3] }, { c: '#7FDBFF', label: '60 mm', dash: [2, 3] }]);
      const tl = Math.min(-30, Math.floor(Math.min(...T) / 10) * 10), pm = Math.max(100, Math.ceil(Math.max(...Pp) / 100) * 100);
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: tl, ymax: 45, xlabel: 'month', ylabel: p.units === 'F' ? '°F' : '°C', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5], xfmt: v => 'JFMAMJJASOND'[Math.floor(v)], yfmt: yT(p), pad: { t: Kk.t, r: 40 } }).frame();
      Kk.draw(P);
      const toY = v => tl + v / pm * (45 - tl);
      P.clip(() => {
        for (let m = 0; m < 12; m++) P.bar(m + 0.5, toY(Pp[m]), 0.36, tl, 'rgba(79,143,224,.6)');
        [18, 10, 0, 22].forEach(v => P.hline(v, v === 22 ? 'rgba(255,211,138,.4)' : '#FFD38A', [4, 3]));
        P.hline(toY(60), '#7FDBFF', [2, 3]);
        P.line(T.map((t, m) => [m + 0.5, t]), '#FF6A3D', 2.4);
      });
      g.ctx.font = mono(9); g.ctx.fillStyle = '#7FB7F2'; g.ctx.textAlign = 'left'; g.ctx.textBaseline = 'middle';
      [0, pm / 2, pm].forEach(v => g.ctx.fillText(p.units === 'F' ? (v / 25.4).toFixed(0) + ' in' : v + ' mm', P.x1 + 3, P.Y(toY(v))));
      void K0;
    },
    hover(S, x) {
      const p = S.p, R = S.run;
      if (p.setup === 'weathervsclimate') { const d = clamp(Math.floor(x), 0, 364); return [{ label: 'date', value: dateOf(d) }, { label: 'high', value: fT(p, R.Y.X[d]), color: PC.line }, { label: 'normal', value: fT(p, R.band.mid[d]) }, { label: 'usual range', value: fT(p, R.band.lo[d], 0) + ' – ' + fT(p, R.band.hi[d], 0) }]; }
      if (p.setup === 'build') { const n = clamp(Math.round(x), 1, R.run.length), r = R.run[n - 1]; return [{ label: 'years', value: String(n) }, { label: 'mean so far', value: fT(p, r[1], 2), color: PC.line }, { label: 'year ' + (p.endYear - n + 1), value: fT(p, r[2], 2) }]; }
      if (p.setup === 'graphs' || p.setup === 'zones') { const m = clamp(Math.floor(x), 0, 11), a = p.setup === 'graphs' ? R.A : STATIONS[p.station], b = p.setup === 'graphs' ? R.B : null; const out = [{ label: 'month', value: MON[m] }, { label: a.name, value: fT(p, a.T[m] + (b ? 0 : p.dT)) + ' · ' + fP(p, a.P[m] * (b ? 1 : p.pMul)), color: PC.A }]; if (b) out.push({ label: b.name, value: fT(p, b.T[m]) + ' · ' + fP(p, b.P[m]), color: PC.B }); return out; }
      const la = clamp(Math.round(x), -89, 89), G = geoOf(landFn() || (() => false), la, p.plon);
      return [{ label: 'latitude', value: latS(la) }, { label: p.mapvar === 'T' ? 'temperature' : 'rain', value: p.mapvar === 'T' ? fT(p, mapT(la, G, p.month, 0)) : fP(p, mapP(la, G, p.month, 1)) }, { label: 'surface', value: G.isLand ? 'land' : 'sea' }];
    }
  };
  const plot2 = {
    title: S => ({ weathervsclimate: 'Each year’s mean, 1961–2025, and the moving 30-year normal', build: 'The climograph the ' + S.p.nYears + ' years make, against the station’s normals', graphs: 'Every station: how warm, how wet, how much it swings', maps: 'The year at the probe', zones: 'Every station on the dry line' })[S.p.setup],
    draw(S, g) {
      const p = S.p, R = S.run;
      if (p.setup === 'weathervsclimate') {
        const Kk = keyBand(g, [{ c: '#C9D4EA', dot: true, label: 'one year' }, { c: PC.line, label: '30-year normal ending that year' }, { c: '#8FA3C0', label: 'trend fitted, 1961–2025', dash: [4, 3] }]);
        const v = R.annual.map(a => a[1]), lo = Math.floor(Math.min(...v) - 0.5), hi = Math.ceil(Math.max(...v) + 0.5);
        const P = g.Plot({ xmin: Y0 - 1, xmax: Y1 + 1, ymin: lo, ymax: hi, xlabel: 'year', ylabel: p.units === 'F' ? 'mean °F' : 'mean °C', yfmt: v2 => p.units === 'F' ? (v2 * 9 / 5 + 32).toFixed(0) : v2.toFixed(0), pad: { t: Kk.t } }).frame();
        Kk.draw(P);
        P.clip(() => {
          const m = mean(v), mx = mean(R.annual.map(a => a[0])), b = R.fit / 10;
          P.line([[Y0, m + b * (Y0 - mx)], [Y1, m + b * (Y1 - mx)]], '#8FA3C0', 1.4, [4, 3]);
          const run = []; for (let i = 29; i < v.length; i++) run.push([R.annual[i][0], mean(v.slice(i - 29, i + 1))]);
          P.line(run, PC.line, 2.4);
          R.annual.forEach(a => P.dot(a[0], a[1], a[0] === p.year ? 5 : 2.6, a[0] === p.year ? '#FFFFFF' : '#C9D4EA', a[0] === p.year ? 'rgba(0,0,0,.5)' : null));
        });
        return;
      }
      if (p.setup === 'build') {
        const s = STATIONS[p.station], st = R.st;
        const Kk = keyBand(g, [{ c: PC.line, label: p.nYears + ' years °C' }, { c: 'rgba(255,190,150,.8)', label: 'normal', dash: [4, 3] }, { c: PC.rain, box: true, label: p.nYears + ' years rain' }, { c: 'rgba(200,220,255,.8)', box: true, label: 'normal rain' }]);
        const tl = Math.min(-10, Math.floor(Math.min(...st.T, ...s.T) / 10) * 10), pm = Math.max(100, Math.ceil(Math.max(...st.P, ...s.P) / 100) * 100);
        const P = g.Plot({ xmin: 0, xmax: 12, ymin: tl, ymax: 40, xlabel: 'month', ylabel: p.units === 'F' ? '°F' : '°C', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5], xfmt: v => 'JFMAMJJASOND'[Math.floor(v)], yfmt: yT(p), pad: { t: Kk.t, r: 40 } }).frame();
        Kk.draw(P);
        const toY = v => tl + v / pm * (40 - tl);
        P.clip(() => {
          for (let m = 0; m < 12; m++) { P.bar(m + 0.5, toY(st.P[m]), 0.34, tl, 'rgba(79,143,224,.65)'); const y = P.Y(toY(s.P[m])); g.ctx.strokeStyle = 'rgba(200,220,255,.85)'; g.ctx.lineWidth = 1.2; g.ctx.strokeRect(P.X(m + 0.16), y, P.X(m + 0.84) - P.X(m + 0.16), P.y0 - y); }
          P.line(s.T.map((t, m) => [m + 0.5, t]), 'rgba(255,190,150,.8)', 1.6, [4, 3]); P.line(st.T.map((t, m) => [m + 0.5, t]), PC.line, 2.4);
        });
        g.ctx.font = mono(9); g.ctx.fillStyle = '#7FB7F2'; g.ctx.textAlign = 'left'; g.ctx.textBaseline = 'middle';
        [0, pm / 2, pm].forEach(v => g.ctx.fillText(p.units === 'F' ? (v / 25.4).toFixed(0) + ' in' : v + ' mm', P.x1 + 3, P.Y(toY(v))));
        return;
      }
      if (p.setup === 'graphs' || p.setup === 'zones') {
        const zones = p.setup === 'zones';
        const Kk = keyBand(g, zones ? [{ c: '#FFD38A', label: 'dry line 10(2T+28) · 10(2T+14) · 20T', dash: [4, 3] }, { c: '#C9D4EA', dot: true, label: 'station, coloured by class' }]
          : [{ c: '#C9D4EA', dot: true, label: 'station (size = annual range)' }, { c: PC.A, dot: true, label: STATIONS[p.station].name }, { c: PC.B, dot: true, label: STATIONS[p.station2].name }]);
        const P = g.Plot({ xmin: -15, xmax: 32, ymin: 1, ymax: 3.6, xlabel: p.units === 'F' ? 'year’s mean temperature (°F)' : 'year’s mean temperature (°C)', ylabel: 'rain a year', yticks: [1, 2, 3], yfmt: v => p.units === 'F' ? (Math.pow(10, v) / 25.4).toFixed(0) + ' in' : Math.pow(10, v).toFixed(0) + ' mm', xfmt: v => p.units === 'F' ? (v * 9 / 5 + 32).toFixed(0) : v.toFixed(0), pad: { t: Kk.t } }).frame();
        Kk.draw(P);
        const A = ART();
        P.clip(() => {
          if (zones) [28, 14, 0].forEach(c => { const pts = []; for (let t = -15; t <= 32; t += 0.5) { const v = 10 * (2 * t + c); if (v > 10) pts.push([t, Math.log10(v)]); } P.line(pts, '#FFD38A', 1.2, [4, 3]); });
          SK.forEach(k => {
            const s = STATIONS[k], T = zones ? s.T.map(t => t + p.dT) : s.T, Pp = zones ? s.P.map(v => v * p.pMul) : s.P, mt = mean(T), mp = Math.log10(Math.max(10, sum(Pp)));
            const col = zones ? A.css(A.kgRGB(koppen(T, Pp, s.lat).code)) : k === p.station ? PC.A : k === p.station2 ? PC.B : '#C9D4EA';
            const r = zones ? (k === p.station ? 6 : 4) : 2.5 + (Math.max(...s.T) - Math.min(...s.T)) / 6;
            P.dot(mt, mp, r, col, (zones && k === p.station) || (!zones && (k === p.station || k === p.station2)) ? '#FFFFFF' : 'rgba(0,0,0,.45)');
            if (g.w > 420) P.tag(mt, mp, s.name.split(' ')[0], '#AEBBD3', 'left', 0);
          });
        });
        return;
      }
      // maps: the year at the probe, and the nearest station's record beside it
      const pr = R.probe, nst = STATIONS[nearestStation(p.plat, p.plon).key];
      const Kk = keyBand(g, [{ c: '#FF8A5C', label: 'model °C' }, { c: 'rgba(79,143,224,.6)', box: true, label: 'model rain' }, { c: '#FFFFFF', label: nst.name + ' record', dash: [3, 3] }]);
      const tl = Math.min(-30, Math.floor(Math.min(...pr.T, ...nst.T) / 10) * 10), pm = Math.max(100, Math.ceil(Math.max(...pr.P, ...nst.P) / 100) * 100);
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: tl, ymax: 40, xlabel: 'month', ylabel: p.units === 'F' ? '°F' : '°C', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5], xfmt: v => 'JFMAMJJASOND'[Math.floor(v)], yfmt: yT(p), pad: { t: Kk.t, r: 40 } }).frame();
      Kk.draw(P);
      const toY = v => tl + v / pm * (40 - tl);
      P.clip(() => {
        for (let m = 0; m < 12; m++) P.bar(m + 0.5, toY(pr.P[m]), 0.36, tl, 'rgba(79,143,224,.6)');
        P.line(nst.T.map((t, m) => [m + 0.5, t]), '#FFFFFF', 1.4, [3, 3]);
        P.line(pr.T.map((t, m) => [m + 0.5, t]), '#FF8A5C', 2.4);
        P.vline(p.month + 0.5, 'rgba(255,255,255,.5)', [2, 3]);
      });
      g.ctx.font = mono(9); g.ctx.fillStyle = '#7FB7F2'; g.ctx.textAlign = 'left'; g.ctx.textBaseline = 'middle';
      [0, pm / 2, pm].forEach(v => g.ctx.fillText(p.units === 'F' ? (v / 25.4).toFixed(0) + ' in' : v + ' mm', P.x1 + 3, P.Y(toY(v))));
    },
    hover(S, x) {
      const p = S.p, R = S.run;
      if (p.setup === 'weathervsclimate') { const y = clamp(Math.round(x), Y0, Y1), a = R.annual[y - Y0]; return [{ label: 'year', value: String(y) }, { label: 'mean', value: fT(p, a[1], 2) }]; }
      if (p.setup === 'build' || p.setup === 'maps') { const m = clamp(Math.floor(x), 0, 11); const T = p.setup === 'build' ? R.st.T : R.probe.T, P = p.setup === 'build' ? R.st.P : R.probe.P; return [{ label: 'month', value: MON[m] }, { label: 'temperature', value: fT(p, T[m]) }, { label: 'rain', value: fP(p, P[m]) }]; }
      let best = null, bd = 1e9; SK.forEach(k => { const d = Math.abs(mean(STATIONS[k].T) - x); if (d < bd) { bd = d; best = k; } });
      const s = STATIONS[best]; return [{ label: 'nearest', value: s.name }, { label: 'mean', value: fT(p, mean(s.T)) }, { label: 'rain', value: fP(p, sum(s.P)) }, { label: 'class', value: s.kg }];
    }
  };

  function readouts(S) {
    const p = S.p, R = S.run, st = STATIONS[p.station];
    if (p.setup === 'weathervsclimate') {
      const d = curDay(S), x = R.Y.X[d], md = R.band.mid[d];
      return [
        { label: 'Date', value: dateOf(d) + ' ' + p.year, unit: '' },
        { label: 'Day’s high', value: fT(p, x), unit: '', flag: 'accent' },
        { label: 'Normal high for the date', value: fT(p, md), unit: '', hint: 'the median, 1991–2020' },
        { label: 'Anomaly = high − normal', value: (x - md >= 0 ? '+' : '') + fdT(p, x - md), unit: '', flag: Math.abs(x - md) > (R.band.hi[d] - R.band.lo[d]) / 2 ? 'warn' : 'ok' },
        { label: 'Warmer than', value: Math.round(percentile(p.station, p.seed, p.trend, d, x)) + ' %', unit: 'of such days' },
        { label: 'Rain that day', value: fP(p, R.Y.P[d]), unit: '' },
        { label: 'Year’s mean ' + p.year, value: fT(p, R.annual[p.year - Y0][1], 2), unit: '' },
        { label: 'Normal 1961–90 → 1991–2020', value: fT(p, R.n1, 2) + ' → ' + fT(p, R.n2, 2), unit: '', flag: 'accent' },
        { label: 'Trend fitted to 65 years', value: (R.fit >= 0 ? '+' : '') + fdT(p, R.fit, 2), unit: 'a decade', hint: 'set ' + (p.trend / 10).toFixed(2) + ' °C a decade' }
      ];
    }
    if (p.setup === 'build') {
      const r = R.st, wm = r.T.indexOf(Math.max(...r.T));
      return [
        { label: 'Years averaged N', value: String(p.nYears), unit: (p.endYear - p.nYears + 1) + '–' + p.endYear },
        { label: 'Mean temperature', value: fT(p, r.MAT, 2), unit: '', flag: 'accent' },
        { label: 'Uncertainty σ/√N', value: '± ' + fdT(p, R.se, 2), unit: '', hint: 'one year alone: ± ' + fdT(p, R.sdYear, 2) },
        { label: 'Warmest month', value: MON[wm] + ' ' + fT(p, r.T[wm]), unit: '' },
        { label: 'Annual range', value: fdT(p, r.range), unit: '' },
        { label: 'Rain a year', value: fP(p, r.MAP), unit: '' },
        { label: 'Wet days a year', value: r.wetDays.toFixed(0), unit: 'days ≥ 1 mm' },
        { label: 'Hottest day in the record', value: fT(p, r.hi.v), unit: dateOf(r.hi.d) + ' ' + r.hi.y },
        { label: 'Coldest night in the record', value: fT(p, r.lo.v), unit: dateOf(r.lo.d) + ' ' + r.lo.y },
        { label: 'Köppen class of these years', value: koppen(r.T, r.P, st.lat).code, unit: 'published ' + st.kg }
      ];
    }
    if (p.setup === 'graphs') {
      const a = R.A, b = R.B, rng = s => Math.max(...s.T) - Math.min(...s.T);
      return [
        { label: a.name + ': mean', value: fT(p, mean(a.T)), unit: '' },
        { label: b.name + ': mean', value: fT(p, mean(b.T)), unit: '' },
        { label: a.name + ': range Thot − Tcold', value: fdT(p, rng(a)), unit: '', flag: 'accent' },
        { label: b.name + ': range Thot − Tcold', value: fdT(p, rng(b)), unit: '', flag: 'accent' },
        { label: a.name + ': rain a year', value: fP(p, sum(a.P)), unit: '' },
        { label: b.name + ': rain a year', value: fP(p, sum(b.P)), unit: '' },
        { label: a.name + ': months under 30 mm', value: String(a.P.filter(v => v < 30).length), unit: 'dry months' },
        { label: b.name + ': months under 30 mm', value: String(b.P.filter(v => v < 30).length), unit: 'dry months' },
        { label: 'Wettest months', value: MON[a.P.indexOf(Math.max(...a.P))] + ' · ' + MON[b.P.indexOf(Math.max(...b.P))], unit: '' },
        { label: 'Köppen classes', value: a.kg + ' · ' + b.kg, unit: '' }
      ];
    }
    if (p.setup === 'maps') {
      const pr = R.probe, n = nearestStation(p.plat, p.plon), s = STATIONS[n.key];
      return [
        { label: 'Probe', value: latS(p.plat) + ' ' + lonS(p.plon), unit: pr.g.isLand ? 'land' : 'sea' },
        { label: MON[p.month] + ' temperature', value: fT(p, pr.T[p.month]), unit: '', flag: p.mapvar === 'T' ? 'accent' : undefined },
        { label: MON[p.month] + ' rain', value: fP(p, pr.P[p.month]), unit: '', flag: p.mapvar === 'P' ? 'accent' : undefined },
        { label: 'Annual range at the probe', value: fdT(p, Math.max(...pr.T) - Math.min(...pr.T)), unit: '' },
        { label: 'Land the air crossed', value: Math.round(pr.g.c * 100) + ' %', unit: '', hint: 'more land, bigger swing' },
        { label: 'Zonal mean at this latitude', value: fT(p, zonalT(p.plat)), unit: 'year' },
        { label: 'Nearest station', value: s.name, unit: Math.round(n.km) + ' km' },
        { label: 'Its record, ' + MON[p.month], value: p.mapvar === 'T' ? fT(p, s.T[p.month]) : fP(p, s.P[p.month]), unit: '' }
      ];
    }
    const K0 = R.K, Kg = kgGrid(p.dT, p.pMul), sh = Kg ? Kg.share : null;
    const out = [
      { label: st.name, value: K0.code, unit: KG_NAME[K0.code], flag: K0.code !== R.base.code ? 'warn' : 'accent' },
      { label: 'Coldest month', value: fT(p, K0.Tcold), unit: '' },
      { label: 'Warmest month', value: fT(p, K0.Thot), unit: '' },
      { label: 'Rain a year', value: fP(p, K0.MAP), unit: '' },
      { label: 'Dry line 10 × (2T + c)', value: fP(p, Math.max(0, K0.Pth)), unit: K0.share >= 0.7 ? 'summer rain' : K0.share <= 0.3 ? 'winter rain' : 'rain all year' },
      { label: 'Driest month', value: fP(p, K0.Pdry), unit: '' }
    ];
    if (sh) ['A', 'B', 'C', 'D', 'E'].forEach(k => out.push({ label: { A: 'Tropical (A)', B: 'Dry (B)', C: 'Temperate (C)', D: 'Continental (D)', E: 'Polar (E)' }[k] + ' land', value: sh[k].toFixed(0) + ' %', unit: 'of land, 60°S–90°N' }));
    return out;
  }
  function equation(S) {
    const p = S.p, R = S.run;
    if (p.setup === 'weathervsclimate') {
      const d = curDay(S), x = R.Y.X[d], md = R.band.mid[d];
      return E.v('anomaly') + ' = ' + E.v('T') + E.sub('day') + ' − ' + E.v('T') + E.sub('normal') + ' = ' + E.n(fT(p, x)) + ' − (' + E.n(fT(p, md)) + ') = <b>' + (x - md >= 0 ? '+' : '') + fdT(p, x - md) + '</b>';
    }
    if (p.setup === 'build') return E.v('T̄') + ' = ' + E.frac('Σ ' + E.v('T') + E.sub('year'), E.v('N')) + ' = ' + E.n(fT(p, R.st.MAT, 2)) + ' &nbsp; ± ' + E.frac(E.v('σ'), '√' + E.v('N')) + ' = ' + E.frac(fdT(p, R.sdYear, 2), '√' + p.nYears) + ' = <b>± ' + fdT(p, R.se, 2) + '</b>';
    if (p.setup === 'graphs') { const a = R.A; return E.v('range') + ' = ' + E.v('T') + E.sub('warmest') + ' − ' + E.v('T') + E.sub('coldest') + ' = ' + E.n(fT(p, Math.max(...a.T))) + ' − (' + E.n(fT(p, Math.min(...a.T))) + ') = <b>' + fdT(p, Math.max(...a.T) - Math.min(...a.T)) + '</b> &nbsp;(' + a.name + ')'; }
    if (p.setup === 'maps') { const pr = R.probe, A_ = Math.min(21, Math.abs(p.plat) * (0.075 + 0.30 * pr.g.c)); return E.v('T') + ' ≈ ' + E.v('T') + E.sub('zone') + '(' + latS(p.plat) + ') + ' + E.v('A') + ' cos(season) = ' + E.n(fT(p, zonalT(p.plat))) + ' ± ' + E.n(fdT(p, A_)) + ' &nbsp; ' + E.v('A') + ' = |φ|(0.075 + 0.30' + E.v('c') + '), ' + E.v('c') + ' = ' + pr.g.c.toFixed(2); }
    const K0 = R.K; return 'dry line = 10 × (2' + E.v('T̄') + ' + ' + (K0.share >= 0.7 ? 28 : K0.share <= 0.3 ? 0 : 14) + ') = 10 × (2 × ' + K0.MAT.toFixed(1) + ' + ' + (K0.share >= 0.7 ? 28 : K0.share <= 0.3 ? 0 : 14) + ') = ' + E.n(Math.max(0, K0.Pth).toFixed(0) + ' mm') + ' &nbsp; rain ' + K0.MAP.toFixed(0) + ' mm → <b>' + (K0.code[0] === 'B' ? 'dry (B)' : K0.code[0] === 'E' ? 'too cold to ask (E)' : 'not dry') + '</b>';
  }
  const { E } = L;
  const EQ_NOTE = S => ({
    weathervsclimate: '<b>One day’s anomaly says nothing about the climate.</b> The normal band is eight days in ten, so one day in five falls outside it, either way, in any climate. A warming trend of 2 °C a century moves the band by 0.6 °C in thirty years — a tenth of the day-to-day swing in a Chicago winter. Only the average of thousands of days shows it.',
    build: '<b>Climate is not only the average.</b> The thirty-year mean settles to within ±0.13 °C, but the same days also give the range, the wettest month, the record high and how often it rains — the whole climograph. σ/√N assumes the years are independent; a trend in the record makes old years differ from new ones, which is why normals are recomputed every ten years.',
    graphs: '<b>Two climates with the same mean can be nothing alike.</b> A climograph shows the shape of the year: its range, which season is wet, how many months are dry. Rain bars are totals for the month; the temperature line is the month’s average of every day and night.',
    maps: '<b>This map is a model, not a measurement.</b> It knows only latitude, the season, where land and sea are and which way the wind blows — so it misses mountains (the map is reduced to sea level, as atlases do), cold currents and fog. Check it against the stations: where it fails, ask which of those it is missing.',
    zones: '<b>A climate zone is a rule applied to thirty years of numbers.</b> Köppen drew his lines where vegetation changes: 18 °C (no frost — rainforest and savanna), 10 °C in the warmest month (no trees beyond it), and a dry line that rises with temperature because warm air evaporates more. Warm the world, and the zones move toward the poles.'
  })[S.p.setup];

  /* ============================================================
     7. REGISTRATION
     ============================================================ */
  const R_ = true;
  const stOpts = SK.map(k => ({ value: k, label: STATIONS[k].name }));
  L.register({
    id: 'g6e-climate',
    grade: 6, unit: '6E', topics: ['E1'],
    subject: 'earth',
    name: 'Climate from Weather',
    chapter: 'Regional Climate, Organisms and Heredity',
    exams: ['NGSS MS-ESS2-6', 'NGSS Science and Engineering Practice 4: analysing and interpreting data', 'CAST'],
    weight: 'Climate',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag to walk round the station or turn the globe · drag the day, the record’s edge, the probe, a station pin or the world’s thermometer',
    lede: 'Twelve real weather stations, each a <b>weather generator</b> tuned to its published 1991–2020 normals and run <b>day by day from 1961</b>. Read one day off the thermometers in a Stevenson screen, then see it against thirty years of days. ' +
      'Stack sixty years of records and watch a <b>climate</b> emerge from the noise; read two <b>climographs</b>; read a <b>climate map</b> built from latitude, the season, land and sea; and run the <b>Köppen key</b> on every station — then warm the whole world and watch the zones move.',

    params: preset({}),
    presets: [
      { name: 'A bitter January day in a warming climate', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 2 }) },
      { name: 'No warming at all: the same weather, a flat record', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 0 }) },
      { name: 'Fast warming: 6 °C a century', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 6 }) },
      { name: 'A year passing at Fairbanks', params: preset({ station: 'fairbanks', year: 2012, day: 0, pace: 30 }) },
      { name: 'Singapore: weather that hardly changes', params: preset({ station: 'singapore', year: 2015, day: 180, trend: 2 }) },
      { name: 'One year is not a climate', params: preset({ setup: 'build', station: 'chicago', nYears: 1, endYear: 2020 }) },
      { name: 'Thirty years: the normal', params: preset({ setup: 'build', station: 'chicago', nYears: 30, endYear: 2020 }) },
      { name: 'Sixty years of a desert', params: preset({ setup: 'build', station: 'dv', nYears: 60, endYear: 2020 }) },
      { name: 'San Francisco and Sacramento: 140 km apart', params: preset({ setup: 'graphs', station: 'sac', station2: 'sf' }) },
      { name: 'Same mean, different climate: Chicago and Denver', params: preset({ setup: 'graphs', station: 'chicago', station2: 'denver' }) },
      { name: 'Monsoon or rain all year: Mumbai and Singapore', params: preset({ setup: 'graphs', station: 'mumbai', station2: 'singapore' }) },
      { name: 'Seasons the other way round: London and Sydney', params: preset({ setup: 'graphs', station: 'london', station2: 'sydney' }) },
      { name: 'January: the cold heart of a continent', params: preset({ setup: 'maps', month: 0, mapvar: 'T', plat: 62, plon: 110 }) },
      { name: 'July: where the rain belt goes', params: preset({ setup: 'maps', month: 6, mapvar: 'P', plat: 15, plon: 20 }) },
      { name: 'Sacramento under the Köppen key', params: preset({ setup: 'zones', station: 'sac' }) },
      { name: 'Warm the world by 4 °C', params: preset({ setup: 'zones', station: 'fairbanks', dT: 4 }) },
      { name: 'Miami with a tenth less rain', params: preset({ setup: 'zones', station: 'miami', pMul: 0.9 }) },
      { name: 'Denver on the dry line', params: preset({ setup: 'zones', station: 'denver' }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The station', when: is('weathervsclimate', 'build', 'graphs', 'zones'), items: [
        { key: 'station', type: 'select', label: 'Weather station (A)', restructure: R_, options: stOpts },
        { key: 'station2', type: 'select', label: 'Station B', restructure: R_, when: is('graphs'), options: stOpts } ] },
      { group: 'The record', when: is('weathervsclimate', 'build'), items: [
        { key: 'year', label: 'Year', min: Y0, max: Y1, step: 1, restructure: R_, when: is('weathervsclimate'), fmt: v => String(Math.round(v)) },
        { key: 'day', label: 'Day', min: 0, max: 364, step: 1, restructure: R_, when: is('weathervsclimate'), fmt: v => dateOf(Math.round(v)) },
        { key: 'nYears', label: 'Years averaged <i>N</i>', min: 1, max: 60, step: 1, restructure: R_, when: is('build'), fmt: v => String(Math.round(v)) },
        { key: 'endYear', label: 'Ending in', min: 1990, max: Y1, step: 1, restructure: R_, when: is('build'), fmt: v => String(Math.round(v)) },
        { key: 'trend', label: 'Warming trend', min: -2, max: 6, step: 0.5, unit: '°C/century', restructure: R_, fmt: v => v.toFixed(1) },
        { key: 'seed', label: 'Another run of the weather', min: 1, max: 9, step: 1, restructure: R_ },
        { key: 'pace', type: 'select', label: 'Let the days pass', restructure: false, when: is('weathervsclimate'), options: [{ value: 0, label: 'hold the day' }, { value: 1, label: 'a day a second' }, { value: 7, label: 'a week a second' }, { value: 30, label: 'a month a second' }] } ] },
      { group: 'The map', when: is('maps'), items: [
        { key: 'mapvar', type: 'select', label: 'Show', restructure: R_, options: [{ value: 'T', label: 'temperature' }, { value: 'P', label: 'rainfall' }] },
        { key: 'month', label: 'Month', min: 0, max: 11, step: 1, restructure: R_, fmt: v => MON[Math.round(v)] },
        { key: 'plat', label: 'Probe latitude', min: -80, max: 80, step: 0.5, unit: '°', restructure: R_, fmt: v => latS(v) },
        { key: 'plon', label: 'Probe longitude', min: -180, max: 180, step: 0.5, unit: '°', restructure: R_, fmt: v => lonS(v) },
        { key: 'iso', type: 'toggle', label: 'Isolines', display: true } ] },
      { group: 'The world', when: is('zones'), items: [
        { key: 'dT', label: 'Warm or cool every month', min: -6, max: 6, step: 0.1, unit: '°C', restructure: R_, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
        { key: 'pMul', label: 'Rain, times', min: 0.3, max: 2, step: 0.05, restructure: R_, fmt: v => '× ' + v.toFixed(2) } ] },
      { group: 'Display', items: [
        { key: 'units', type: 'select', label: 'Units', display: true, options: [{ value: 'C', label: '°C, mm' }, { value: 'F', label: '°F, inches' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [plot1, plot2],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · weather against climate', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 2 }),
        q: 'On 24 January 2014 the screen’s maximum thermometer read −12.1 °C. The normal high for that date at Chicago (the median of 1991–2020) is 0.4 °C. How far from normal was the day — and does it show that Chicago’s climate is cooling?',
        predict: { label: 'Anomaly', unit: '°C', tol: 0.02 },
        measure: S => S.run.Y.X[S.p.day] - S.run.band.mid[S.p.day],
        working: 'Anomaly = −12.1 − 0.4 = <b>−12.5 °C</b>. No: in this very record the thirty-year normal rose from 9.6 °C (1961–90) to 10.2 °C (1991–2020). One winter day swings by ±6 °C; the climate moved 0.6 °C. A single day is weather.' },
      { source: 'CAST pattern · a trend in the record', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 2 }),
        q: 'The record warms by 2 °C a century. The two thirty-year normals, 1961–1990 and 1991–2020, are centred thirty years apart. By about how much should the second be warmer?',
        predict: { label: 'Change of normal', unit: '°C', tol: 0.1 },
        measure: S => S.run.n2 - S.run.n1,
        working: '2 °C a century × 30 years ÷ 100 = <b>0.6 °C</b>. The lab’s two normals differ by 0.60 °C: the weather’s noise averages out over 10,950 days, and what is left is the trend.' },
      { source: 'CAST pattern · how many years make a climate', params: preset({ setup: 'build', station: 'chicago', nYears: 30, endYear: 2020 }),
        q: 'At Chicago one year’s mean temperature scatters by about 0.65 °C (one standard deviation) about the long-run mean. The uncertainty of an average of N years is σ ÷ √N. How uncertain is a 30-year normal?',
        predict: { label: 'Uncertainty', unit: '°C', tol: 0.06 },
        measure: S => S.run.se,
        working: '0.65 ÷ √30 = 0.65 ÷ 5.48 = <b>0.12 °C</b>. One year alone is uncertain by ±0.65 °C; thirty years pin the mean down five and a half times better. That is why a climate normal uses thirty years.' },
      { source: 'CAST pattern · reading a climograph', params: preset({ setup: 'graphs', station: 'chicago', station2: 'sf' }),
        q: 'Read Chicago’s climograph: July averages 23.6 °C and January −4.6 °C. What is its annual range — and San Francisco’s, whose warmest month is September at 18.1 °C and coldest January at 11.1 °C?',
        predict: { label: 'Chicago’s range', unit: '°C', tol: 0.01 },
        measure: S => Math.max(...S.run.A.T) - Math.min(...S.run.A.T),
        working: 'San Francisco: 18.1 − 11.1 = 7.0 °C. Chicago: 23.6 − (−4.6) = <b>28.2 °C</b>. Their yearly means differ by only 4.5 °C, but one sits in the middle of a continent and the other by a cold ocean.' },
      { source: 'CAST pattern · applying a rule to data', params: preset({ setup: 'zones', station: 'denver' }),
        q: 'Denver’s year averages 10.46 °C, and 73 % of its 383 mm of rain falls in April–September. Köppen’s dry line for summer rain is 10 × (2T + 28) mm. Is Denver dry (B)?',
        predict: { label: 'Dry line', unit: 'mm', tol: 0.01 },
        measure: S => S.run.K.Pth,
        working: 'Denver gets 383 mm; its line is 10 × (2 × 10.46 + 28) = <b>489 mm</b> — it is under the line, so dry; and above half of it (245 mm), so a steppe, not a desert: BSk.' },
      { source: 'CAST pattern · monsoon or savanna', params: preset({ setup: 'zones', station: 'mumbai' }),
        q: 'Mumbai’s coldest month is 24.4 °C, so it is tropical. It gets 2,349 mm a year, but its driest month only 0.2 mm. The monsoon test is: driest month ≥ 100 − (yearly rain ÷ 25). What does the driest month need?',
        predict: { label: 'Threshold', unit: 'mm', tol: 0.03 },
        measure: S => 100 - S.run.K.MAP / 25,
        working: 'Miami, wetter in its dry season (41 mm against 33 mm needed), is Am. Mumbai needs 100 − 2,349 ÷ 25 = <b>6 mm</b>; 0.2 mm is less, so Mumbai is a savanna, Aw — not a monsoon climate, Am, even though it has the monsoon.' }
    ],

    walkthrough: [
      { title: '1 · One cold day', ask: 'Chicago, 24 January 2014: −12 °C, twelve degrees below normal. Does this show the climate is getting colder?', reveal: 'No. Look at the strip under the station: days that cold come every few winters. The band in the first plot — eight days in ten — is 12 °C wide in January. <b>Weather is one day; climate is the pattern of thousands.</b> The second plot shows this record warming the whole time.', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 2 }) },
      { title: '2 · Turn the warming off', ask: 'Set the trend to 0, then to 6 °C a century. Does the cold day change much? Does the normal?', reveal: 'The day hardly changes — the same weather, shifted by a fraction of a degree. The thirty-year normal moves by 0 or 1.8 °C, cleanly. <b>A trend is read from averages, never from a day.</b>', params: preset({ station: 'chicago', year: 2014, day: 23, trend: 0 }) },
      { title: '3 · One year is not enough', ask: 'Average only one year. How far could its mean be from the long-run mean?', reveal: 'About ±0.65 °C at Chicago, and its climograph is ragged: a wet August, a dry May that will not be there next year. Drag the bottom of the record down to 30 rows and watch the average day smooth into a curve. <b>σ/√N: thirty years is five times steadier than one.</b>', params: preset({ setup: 'build', station: 'chicago', nYears: 1 }) },
      { title: '4 · Same mean, different climates', ask: 'Chicago and Denver both average about 10 °C. Will their climographs look alike?', reveal: 'No. Denver gets 383 mm a year, Chicago 976 mm; their wet seasons and ranges differ. <b>A climate is the whole shape of the year</b>: the range, the wet season, the dry months — not one average.', params: preset({ setup: 'graphs', station: 'chicago', station2: 'denver' }) },
      { title: '5 · Read the map, then doubt it', ask: 'In January, where is the coldest air in the Northern Hemisphere: over the Arctic Ocean, or inside Siberia?', reveal: 'Inside the continent. The isotherms dip south over land and bulge north over the sea: land cools fast, water holds its heat. Now move the probe to Death Valley: the map calls it far too wet. It has no mountains — the <b>Sierra Nevada’s rain shadow</b> is missing. A map is a model; check it against the stations.', params: preset({ setup: 'maps', month: 0, mapvar: 'T', plat: 62, plon: 110 }) },
      { title: '6 · Run the key', ask: 'Sacramento: warm, rainy winters, no rain at all in July. Which questions decide its class?', reveal: 'Not too cold (warmest 24.6 °C), not dry (481 mm is above its 335 mm line), not tropical (coldest 8.6 °C), coldest above 0 → C; driest summer month under 40 mm and under a third of the wettest winter month → s; warmest above 22 °C → a. <b>Csa, hot-summer Mediterranean</b> — the climate of the olive and the vine.', params: preset({ setup: 'zones', station: 'sac' }) },
      { title: '7 · Warm the world', ask: 'Drag the world’s thermometer up 4 °C. Which way do the zones move?', reveal: 'Toward the poles: the tundra shrinks, Fairbanks’s subarctic climate (Dfc) becomes Dfb with a fourth month above 10 °C, and the dry line rises with the heat. <b>Climate zones are rules on numbers; change the numbers and the map redraws itself.</b>', params: preset({ setup: 'zones', station: 'fairbanks', dT: 4 }) }
    ],

    quiz: [
      { q: 'Which statement is about climate, not weather?', options: ['Chicago’s Januarys average −4.6 °C', 'It snowed in Chicago this morning', 'Yesterday’s high was 2 °C', 'A storm is coming tonight'], answer: 0, why: 'Climate is the long-run pattern — a thirty-year average and range. The others describe a particular moment: weather.' },
      { q: 'A town has its coldest winter day in twenty years. What can you conclude about its climate?', options: ['Nothing yet: one day is weather', 'The climate is cooling', 'The climate is warming', 'The climate has changed zone'], answer: 0, why: 'Records fall in both directions in any climate. In the lab, a warming record still has bitter days — the trend shows only in averages over decades.' },
      { q: 'Why are climate normals averaged over thirty years rather than one?', options: ['One year’s mean wanders too much; thirty years settle it', 'Thermometers last thirty years', 'Weather repeats every thirty years', 'It is a tradition with no reason'], answer: 0, why: 'The uncertainty of a mean falls as 1/√N. At Chicago one year is ±0.65 °C, thirty years ±0.12 °C.' },
      { q: 'On a climograph, a tall bar in July and a low line in January means', options: ['a wet summer and a cold winter', 'a dry summer and a warm winter', 'the same rain all year', 'snow in July'], answer: 0, why: 'Bars are the month’s rain, the line the month’s mean temperature.' },
      { q: 'Köppen’s dry line rises as the temperature rises because', options: ['warm air evaporates water faster, so more rain is needed to be moist', 'warm places get less rain', 'deserts are always hot', 'it is a rule for the tropics only'], answer: 0, why: 'A hot place loses more water to the air; 400 mm is a steppe in Denver but would be a desert somewhere hotter.' }
    ],

    notes: '<p><b>Weather and climate.</b> Weather is the state of the air at a time and place — today’s high, this afternoon’s rain. Climate is its pattern over many years: the averages, the range, how often each kind of day comes. Meteorologists use thirty-year <b>normals</b>, recomputed every ten years.</p>' +
      '<p><b>How a climate is measured.</b> Thermometers in a white, louvred <b>Stevenson screen</b> 1.25 m above grass, out of the sun but in moving air; a maximum and a minimum thermometer read and reset once a day; a rain gauge with its rim 30 cm up. Thirty years of such days make the station’s climate.</p>' +
      '<p><b>Reading the graphs and maps.</b> A <b>climograph</b> puts the twelve monthly rain totals as bars and the monthly mean temperature as a line. A climate map shows one quantity across a region; its isolines join places with the same value. Land swings more than sea, so isotherms bend over continents.</p>' +
      '<p><b>Zones.</b> Köppen (1884, revised by Geiger and by Peel et al. 2007) sorted climates by where plants change: tropical A (no month below 18 °C), dry B (rain below a line that rises with temperature), temperate C, continental D (a month at or below 0 °C), polar E (no month above 10 °C), then by when the rain falls and how hot the summer is.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “It was freezing last week, so the climate is not warming.” One day, one week or one winter is weather; climate is read from decades of averages. And the reverse: “climate is just the average temperature” — two places with the same average can have climates as different as Chicago and Denver.</div>'
  });

  L.models = L.models || {};
  L.models['g6e-climate'] = { STATIONS, SK, harmonics, seasonal, wetChance, genYear, snowpack, stats, band, percentile, slope, koppen, KG_NAME, zonalT, geoOf, mapT, mapP, NORMAL, Y0, Y1, monthOf, MSTART, DAYS, compute, BASE: () => preset({}) };
})(window.InsightLab);
