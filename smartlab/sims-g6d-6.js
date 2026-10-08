/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-6  California's Weather Machine
   (D6.1 Coastal versus inland; D6.2 The marine layer and fog; D6.3 The
    Sierra Nevada and rain shadow; D6.4 California's deserts; D6.5 The
    Pacific's moderating influence; D6.6 Putting it together)

   One idealised transect of central California, 480 km from the open
   Pacific through San Francisco, the Coast Ranges, the Central Valley
   (Sacramento), the Sierra Nevada (Blue Canyon, the crest), the Owens
   Valley (Bishop), the Inyo–Panamint ranges and Death Valley — the real
   stations at their real heights and distances along the line.

     coastal    — a July day along the transect: the sea breeze holds the
                  coast near the ocean's temperature while the valley bakes.
     fog        — the Bay Area in July: cold upwelled water, the marine
                  layer under the subsidence inversion, stratus and fog at the
                  dew point, flooding in through the Golden Gate and burning
                  off inland through the morning.
     rainshadow — a winter storm crossing the ranges: a parcel lifted dry,
                  then moist, its water rained out on the windward slopes,
                  then descending dry and warm into the lee.
     deserts    — Death Valley: the rain shadow of two ranges, the afternoon
                  mixed layer on a dry adiabat from Telescope Peak to
                  Badwater, the ground's own energy balance.
     pacific    — the ocean's mixed layer against the land under the same
                  seasonal sunshine: a linear energy balance with heat
                  capacity, giving the ocean's small, late swing.
     together   — the whole model month by month against the published
                  1991–2020 climate normals (NOAA) for San Francisco,
                  Sacramento and Death Valley, with what-ifs: no Pacific,
                  no Sierra, no upwelling.
   Registration and models load without a page (the tests run them in a
   bare VM); only the drawing uses window.R3, TERRAIN, GEO, G6D, KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;
  const S0 = 1361;
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));     // Pa (Buck)
  const pAt = zKm => 101325 * Math.exp(-zKm / 8.4);
  const qsOf = (Tc, zKm) => { const e = es(Tc); return 0.622 * e / (pAt(zKm) - 0.378 * e); };   // kg/kg
  const dewOf = q => { const e = q * 101325 / (0.622 + 0.378 * q); const a = Math.log(e / 611.21); return 257.14 * a / (18.678 - a); };   // near sea level, °C
  const moistLapse = (Tc, zKm) => { const T = Tc + 273.15, q = qsOf(Tc, zKm), Lv = 2.5e6, Rd = 287, cp = 1004; return 9.81 * (1 + Lv * q / (Rd * T)) / (cp + Lv * Lv * q * 0.622 / (Rd * T * T)) * 1000; };   // K/km

  /* ============================================================
     SUNSHINE (as in 6D-5)
     ============================================================ */
  const declination = day => 23.44 * Math.sin(TAU * (284 + day) / 365);
  function dailyInsolation(latDeg, day) {
    const phi = latDeg * Math.PI / 180, d = declination(day) * Math.PI / 180, dist = 1 + 0.033 * Math.cos(TAU * day / 365);
    const x = -Math.tan(phi) * Math.tan(d), h0 = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x);
    return S0 * dist / Math.PI * (h0 * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(h0));
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MID = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

  /* ============================================================
     THE TRANSECT — km along the line from the coast, heights in km
     ============================================================ */
  const PROF = [[-60, -0.4], [0, 0], [5, 0.016], [14, 0.25], [22, 0.5], [30, 0.15], [45, 0.02], [125, 0.008], [180, 0.06], [215, 0.4], [250, 1.61], [275, 2.4], [292, 3.0], [300, 2.7], [318, 1.45], [330, 1.26], [345, 1.6], [358, 3.37], [368, 2.0], [385, -0.06], [400, 0.4], [420, 1.0]];
  const SIERRA = [215, 318];
  function zAt(x, o) {                                             // o.sierra (0–1.5) and o.coast (0–2) scale the ranges
    o = o || {};
    let k = 0; while (k < PROF.length - 2 && x > PROF[k + 1][0]) k++;
    const a = PROF[k], b = PROF[k + 1], u = clamp((x - a[0]) / (b[0] - a[0]), 0, 1); let z = a[1] + (b[1] - a[1]) * u;
    if (x > SIERRA[0] && x < SIERRA[1] && o.sierra != null) z = 0.3 + (z - 0.3) * o.sierra;
    if (x > 8 && x < 40 && o.coast != null) z *= o.coast;
    return z;
  }
  const STN = {
    sf: { name: 'San Francisco', x: 5, z: 0.016, lat: 37.77, e: 0.35 },
    sac: { name: 'Sacramento', x: 125, z: 0.008, lat: 38.56, e: 0.45 },
    blue: { name: 'Blue Canyon', x: 250, z: 1.61, lat: 39.28, e: 0.5 },
    bishop: { name: 'Bishop', x: 330, z: 1.26, lat: 37.36, e: 0.08 },
    dv: { name: 'Death Valley', x: 385, z: -0.06, lat: 36.46, e: 0 }
  };
  /* NOAA 1991–2020 monthly normals (mean temperature, °C) and annual precipitation (mm), rounded */
  const NORMALS = {
    sf: { T: [10.8, 12.1, 12.9, 13.6, 14.6, 15.5, 16.1, 16.7, 17.6, 16.8, 14.1, 11.1], P: 600 },
    sac: { T: [8.3, 10.8, 13.1, 15.4, 19.2, 22.4, 24.6, 24.2, 22.4, 18.2, 12.4, 8.3], P: 470 },
    dv: { T: [11.8, 15.4, 20.1, 24.8, 30.6, 35.8, 39.2, 38.1, 33.0, 25.3, 16.9, 10.7], P: 55 },
    blue: { P: 1720 }, bishop: { P: 130 }
  };

  /* ============================================================
     THE SEASONS — a linear energy balance with heat capacity
       C dT/dt = a (Q − Q̄) − B (T − T̄)
     the ocean's mixed layer (C = ρ c h) against the land's thin soil
     ============================================================ */
  const SEA = { a: 0.55, B: 25, mean: 13.6, h: 50 };                // stratus shades the sea; evaporation and the California Current hold it
  const LANDP = { a: 0.65, B: 6.2, C: 1.5e7, mean0: 24.8, cE: 16, kLat: 0.1 };          // a, mean0 fitted to Death Valley; cE (and the valley's e) to Sacramento
  const CAL = { L0: 7.5, L1: 1.3, upw: 2.5 };                                       // the sea-breeze reach (km, km per °C of contrast) fitted to San Francisco
  function cycle(a, B, C, lat) {                                   // the periodic response, day by day over the year
    const Qm = (() => { let s = 0; for (let d = 1; d <= 365; d++) s += dailyInsolation(lat, d); return s / 365; })();
    let T = 0; const out = new Array(365).fill(0);
    for (let yr = 0; yr < 4; yr++) for (let d = 0; d < 365; d++) { T += (a * (dailyInsolation(lat, d + 1) - Qm) - B * T) * 86400 / C; if (yr === 3) out[d] = T; }
    return { anom: out, Qm };
  }
  const CYC = {};
  const cyc = (key, a, B, C, lat) => CYC[key] || (CYC[key] = cycle(a, B, C, lat));
  const monthOf = (arr, m) => { let s = 0; for (let d = MID[m] - 15; d < MID[m] + 15; d++) s += arr[(d + 365) % 365]; return s / 30; };
  const upwelling = m => Math.max(0, Math.cos(TAU * (m - 4.5) / 12));   // strongest in May–June (northwesterlies along the coast)
  function seaT(m, o) {                                            // offshore and coastal sea-surface temperature
    o = o || {};
    const h = o.h || SEA.h, c = cyc('sea' + h, SEA.a, SEA.B, 4.18e6 * h, 37.8), off = SEA.mean + monthOf(c.anom, m);
    return { off, coast: off - (o.upw == null ? CAL.upw : o.upw) * upwelling(m) };
  }
  function eAt(x) {                                                 // the share of the sun's extra heat that goes into evaporation, blended between regions
    const E = [[0, 0.35], [45, 0.35], [70, STN.sac.e], [190, STN.sac.e], [215, 0.5], [285, 0.5], [305, 0.08], [365, 0.08], [380, 0]];
    let k = 0; while (k < E.length - 2 && x > E[k + 1][0]) k++; const a = E[k], b = E[k + 1], u = clamp((x - a[0]) / (b[0] - a[0]), 0, 1); return Math.round((a[1] + (b[1] - a[1]) * u) * 50) / 50;   // 0.02 steps keep the cache small
  }
  const latAt = x => x < 200 ? 37.8 + (x / 125) * 0.76 : 38.56 - (x - 200) / 185 * 2.1;
  function landT(x, z, m) {                                         // the land on its own: no ocean air
    const lat = latAt(x), e = eAt(x), c = cyc('land' + lat.toFixed(1) + e, LANDP.a * (1 - e), LANDP.B, LANDP.C, lat);
    const Qr = cyc('land36.5' + '0', LANDP.a, LANDP.B, LANDP.C, 36.5).Qm;
    return LANDP.mean0 - 6.5 * z - LANDP.cE * e + LANDP.kLat * (c.Qm - Qr) + monthOf(c.anom, m);
  }
  function marineW(x, m, o) {                                      // the share of ocean air at x: the sea breeze reaches further when the land is hotter
    o = o || {};
    if (o.ocean === false || x > 292) return 0;
    const sea = seaT(m, o).coast, contrast = Math.max(0, landT(STN.sac.x, 0, m) - sea), Lb = CAL.L0 + CAL.L1 * contrast;
    return Math.exp(-Math.max(0, x) / Lb);
  }
  function airT(x, m, o) {
    o = o || {};
    const z = o.z != null ? o.z : zAt(x, o), w = marineW(x, m, o), Tl = landT(x, z, m);
    if (o.ocean === false) return Tl;
    return w * (seaT(m, o).coast + 0.5 - 6.5 * Math.max(0, z)) + (1 - w) * Tl;
  }
  const stationT = (k, m, o) => airT(STN[k].x, m, Object.assign({}, o, { z: STN[k].z }));
  const annual = (k, o) => { const v = MONTHS.map((_, m) => stationT(k, m, o)); return { v, mean: v.reduce((a, b) => a + b, 0) / 12, range: Math.max(...v) - Math.min(...v), warmest: v.indexOf(Math.max(...v)) }; };

  /* ============================================================
     A WINTER STORM CROSSING THE RANGES — a parcel along the transect
     lifted dry to its cloud base, then on the moist adiabat; the water it
     condenses falls (a share ε) on the slopes below, drifting downwind;
     going down the far side it warms dry — the rain shadow and the foehn.
     ============================================================ */
  const STORM = { T0: 11, rh: 92, u: 15, eps: 0.7, D: 1.5, hours: 550, Ps: 550, n: 2, drift: 12, mix: 2 };   // D, hours, Ps, n, drift fitted to the five stations' annual totals
  const smoothZ = (x, o) => { let s = 0, k = 0; for (let d = -12; d <= 4; d += 2) { s += Math.max(0, zAt(x + d, o)); k++; } return s / k; };   // the air starts rising before the slope
  function parcelRun(s, o) {
    s = Object.assign({}, STORM, s); o = o || {};
    const dx = 1, out = [], Rcol = new Array(481).fill(0);
    let T = s.T0, z = 0, q = s.rh / 100 * qsOf(s.T0, 0), lw = 0;
    const q0 = q, flux = 1.15 * s.u * s.D * 1000;                     // kg of air per m of front per s, through the lifted layer
    for (let x = 0; x <= 420; x += dx) {
      const zn = smoothZ(x, o), dz = zn - z;
      if (dz > 0) {                                                   // rising: dry until saturated, then moist
        const sat = q >= qsOf(T, z) - 1e-9; T -= (sat ? moistLapse(T, z) : 9.8) * dz;
        const qs = qsOf(T, zn); if (q > qs) { const c = q - qs; q = qs; Rcol[Math.min(480, x)] += s.eps * c * flux * (q / q0) / 1000;   /* a drier storm is a shallower moist layer */ lw += (1 - s.eps) * c; }
      } else if (dz < 0) {                                            // sinking: the cloud evaporates first, then dry warming
        let left = -dz;
        while (left > 1e-6 && lw > 0) { const st = Math.min(left, 0.05); T += moistLapse(T, z) * st; const qs = qsOf(T, z - st); const take = Math.min(lw, Math.max(0, qs - q)); q += take; lw -= take; left -= st; z -= st; }
        T += 9.8 * left; if (x > 292) q *= Math.exp(-left / s.mix);       // east of the crest, sinking air mixes with the dry air of the Great Basin high
      }
      z = zn;
      out.push({ x, z: zn, T, Td: dewOf(q) - 1.8 * zn, q, lw, rh: 100 * q / qsOf(T, zn) });
    }
    // the condensate falls downwind of where it formed (drift), and the storm's own rain, fading as the air dries out
    const P = out.map(r => 0);
    for (let x = 0; x <= 420; x++) if (Rcol[x] > 0) for (let d = 0; d < 60; d++) { if (x + d > 420) break; P[x + d] += Rcol[x] * Math.exp(-d / s.drift) / s.drift; }
    out.forEach((r, i) => { r.oro = P[i] * 3600; r.syn = s.Ps * Math.pow(r.q / q0, s.n) / s.hours; r.rate = r.oro + r.syn; r.year = r.rate * s.hours; });   // mm per storm hour, mm a year
    return out;
  }
  const PC = {};
  const parcelOf = (s, o) => { const k = JSON.stringify([s, o]); return PC[k] || (PC[k] = parcelRun(s, o)); };
  const rainAt = (rows, x) => rows[clamp(Math.round(x), 0, rows.length - 1)];

  /* ============================================================
     A DAY ALONG THE TRANSECT — the monthly mean plus the daily swing,
     small where the sea's air reaches, large inland
     ============================================================ */
  const RANGE = x => x < 45 ? 12 : x < 200 ? 19 : x < 292 ? 13 : x < 375 ? 17 : 15.5;   // °C, a dry inland day's swing (normals: Sacramento July 19, Death Valley 15.5)
  const sunCurve = hr => Math.sin(TAU * (hr - 9) / 24);                                   // warmest mid-afternoon, coolest near dawn
  function dayT(x, m, hr, o) {
    const w = marineW(x, m, o), R = w * 2 + (1 - w) * RANGE(x);
    return airT(x, m, o) + R / 2 * sunCurve(hr);
  }
  const stationDay = (k, m, hr, o) => { const s = STN[k], w = marineW(s.x, m, o), R = w * 2 + (1 - w) * RANGE(s.x); return stationT(k, m, o) + R / 2 * sunCurve(hr); };
  const breeze = (m, hr, o) => (o && o.ocean === false) ? 0 : dayT(STN.sac.x, m, hr, o) - (seaT(m, o).coast + 0.5);   // land − sea: + draws a sea breeze

  /* ============================================================
     THE MARINE LAYER — the Bay Area on a July day
     the air over cold upwelled water is cooled to its dew point; the
     subsiding air of the Pacific High caps it with an inversion; the cool
     layer can only flow inland where the ground is lower than the cap
     ============================================================ */
  const BAY = { n: 46, size: 74 };                                      // km across; the coast at x = 0
  function bayZ(x, y) {                                                  // km
    if (x < -0.5 + 0.6 * Math.sin(y * 0.15)) return -0.05 - 0.004 * Math.abs(x);
    let z = 0.02 + 0.28 * Math.exp(-((x - 6) * (x - 6) / 10 + (y + 5) * (y + 5) / 26)) * (y < -1 ? 1 : 0.3)
      + 0.78 * Math.exp(-((x - 4) * (x - 4) / 12 + (y - 11) * (y - 11) / 30)) + 0.25 * Math.exp(-((y - 16) * (y - 16)) / 60) * (x < 12 ? 1 : 0.2)
      + 0.5 * Math.exp(-(x - 27) * (x - 27) / 7) * (1 - 0.95 * Math.exp(-(y - 15) * (y - 15) / 4))
      + 1.17 * Math.exp(-((x - 45) * (x - 45) + (y + 8) * (y + 8)) / 34) + 0.12 * Math.sin(x * 0.7) * Math.cos(y * 0.5) * Math.exp(-((x - 45) * (x - 45)) / 400);
    z = Math.max(0.01, z);
    if (Math.abs(y) < 1.4 && x < 10) z = -0.05;                                                   // the Golden Gate
    if (((x - 16) * (x - 16)) / 42 + ((y + 3) * (y + 3)) / 230 < 1) z = -0.03;                     // the Bay
    if (Math.abs(y - 15) < 1.1 && x > 18) z = Math.min(z, -0.02);                                  // Carquinez Strait and the Delta
    return z;
  }
  const BAYPTS = {
    beach: { name: 'Ocean Beach', x: 1.2, y: -5 }, downtown: { name: 'Downtown SF', x: 9, y: -1.8 }, bridge: { name: 'Golden Gate', x: 3, y: 0 },
    hills: { name: 'Berkeley Hills crest', x: 27, y: -2 }, valley: { name: 'Walnut Creek', x: 36, y: -4 }, diablo: { name: 'Mt Diablo summit', x: 45, y: -8 }
  };
  const FOG = { sst: 11.5, td: 12.5, hinv: 0.45, dinv: 10, valley: 34 };
  function reachOf(hinv) {                                              // the marine air's path in from the ocean, km, through ground lower than the cap
    const n = BAY.n, d = BAY.size / n, D = new Array((n + 1) * (n + 1)).fill(Infinity), Q = [];
    const xy = (i, j) => [-BAY.size * 0.2 + i * d, -BAY.size / 2 + j * d];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const [x, y] = xy(i, j); if (bayZ(x, y) < 0 && x < 0) { D[j * (n + 1) + i] = 0; Q.push([i, j]); } }
    for (let h = 0; h < Q.length; h++) {
      const [i, j] = Q[h], k = j * (n + 1) + i;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj; if (a < 0 || b < 0 || a > n || b > n) continue;
        const kk = b * (n + 1) + a, [x, y] = xy(a, b); if (D[kk] <= D[k] + d || bayZ(x, y) > hinv - 0.03) continue;
        D[kk] = D[k] + d; Q.push([a, b]);
      }
    }
    return { D, xy, at: (x, y) => { const i = clamp(Math.round((x + BAY.size * 0.2) / d), 0, n), j = clamp(Math.round((y + BAY.size / 2) / d), 0, n); return D[j * (n + 1) + i]; } };
  }
  const RC = {};
  const reach = h => RC[h.toFixed(3)] || (RC[h.toFixed(3)] = reachOf(h));
  const daySun = hr => clamp(Math.sin(Math.PI * (hr - 7.5) / 12.5), 0, 1);   // the sun's heating through the day
  function fogAt(p, x, y, hr) {                                          // the air and cloud over one spot
    const z = Math.max(0, bayZ(x, y)), dist = reach(p.hinv).at(x, y), Tm = p.sst + 0.5, sun = daySun(hr);
    if (!isFinite(dist) || z > p.hinv) {                                   // above the cap, or cut off behind the hills: dry inland air
      const above = z > p.hinv, T = above ? Tm - 9.8 * p.hinv + p.dinv - 6.5 * (z - p.hinv) + 6 * sun : p.valley - 14 + 14 * sun - 6.5 * z;
      return { marine: false, T, Td: 4, base: Infinity, top: p.hinv, cloud: false, fog: false, z, dist };
    }
    const heatMax = (p.valley - Tm) * (1 - Math.exp(-Math.max(0, dist - 2.5) / 16));   // the first few km are the sea's own air
    const warm = 0.3 + 0.7 * sun;                                          // the land keeps some of the day's heat through the night
    let T = Tm + heatMax * warm, base = 0, thick = 0;
    for (let k = 0; k < 6; k++) { base = 125 * Math.max(0, T - p.td) / 1000; thick = Math.max(0, p.hinv - Math.max(z, base)); T = Tm + heatMax * (0.3 + 0.7 * sun * (1 - 0.85 * Math.min(1, thick / 0.25))); }
    return { marine: true, T, Td: Math.min(T, p.td), base, top: p.hinv, cloud: thick > 0.005, fog: thick > 0.005 && base <= z + 0.03, z, dist };
  }
  const fogPt = (p, k, hr) => fogAt(p, BAYPTS[k].x, BAYPTS[k].y, hr);
  function sounding(p) {                                                 // over the coast: the marine layer, the inversion, the air above
    const out = [], Tm = p.sst + 0.5, base = 125 * Math.max(0, Tm - p.td) / 1000;
    let T = Tm;
    for (let z = 0; z <= 2.0001; z += 0.02) {
      if (z <= p.hinv) T = z <= base ? Tm - 9.8 * z : Tm - 9.8 * base - moistLapse(Tm, 0) * (z - base);
      else T = Tm - 9.8 * Math.min(base, p.hinv) - moistLapse(Tm, 0) * Math.max(0, p.hinv - base) + p.dinv - 6.5 * (z - p.hinv);
      const Td = z <= p.hinv ? Math.min(T, p.td - 1.8 * z) : Math.min(T - 15, 2 - 2 * z);
      out.push([z, T, Td]);
    }
    return { rows: out, base: Math.min(base, p.hinv), top: p.hinv };
  }

  /* ============================================================
     DEATH VALLEY — the afternoon mixed layer and the ground
     ============================================================ */
  const DV = { floor: -0.086, telescope: 3.368, furnace: -0.058, dante: 1.669 };
  const airMass = el => el <= 0 ? Infinity : 1 / (Math.sin(el * Math.PI / 180) + 0.50572 * Math.pow(el + 6.07995, -1.6364));
  const beam = el => el <= 0 ? 0 : S0 * Math.pow(0.7, Math.pow(airMass(el), 0.678)) * Math.sin(el * Math.PI / 180);
  const elevAt = (lat, day, hr) => { const f = lat * Math.PI / 180, d = declination(day) * Math.PI / 180, h = (hr - 12) / 24 * TAU; return Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(h)) * 180 / Math.PI; };
  const SURF = { salt: { name: 'salt pan', a: 0.45 }, gravel: { name: 'desert pavement', a: 0.22 }, basalt: { name: 'dark rock', a: 0.1 } };
  function valleyAir(p, zKm, hr) {                                        // the afternoon air is mixed on a dry adiabat up to the mixed-layer top
    const Tf = stationDay('dv', p.dmonth, hr) + p.sink, zf = DV.furnace, mixed = daySun(hr) * p.zi;
    const top = zf + mixed, Gm = mixed > 0.3 ? 9.8 : 3;                  // by night the ground cools the air from below: a gentler lapse
    if (zKm <= top) return Tf - Gm * (zKm - zf);
    return Tf - Gm * (top - zf) - 6.5 * (zKm - top);
  }
  function groundT(p, hr) {                                               // the ground's balance: sunlight absorbed = heat to the air + infrared + into the ground
    const Ta = valleyAir(p, DV.furnace, hr), el = elevAt(36.46, MID[p.dmonth], hr), S = beam(el) * 1.1, a = SURF[p.surface].a, h = 10 + 3 * p.dwind;
    const SIG = 5.67e-8, K4 = t => Math.pow(t + 273.15, 4);
    let lo = Ta - 20, hi = Ta + 80;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, Rn = (1 - a) * S + 0.75 * SIG * K4(Ta) - 0.95 * SIG * K4(m), f = Rn * 0.8 - h * (m - Ta); if (f > 0) lo = m; else hi = m; }   // a fifth of the net goes into the ground
    return (lo + hi) / 2;
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'coastal', label: 'A July day from the coast to the desert', teaches: ['D6.1'] },
    { value: 'fog', label: 'The marine layer: fog through the Golden Gate', teaches: ['D6.2'] },
    { value: 'rainshadow', label: 'A winter storm over the Sierra Nevada', teaches: ['D6.3'] },
    { value: 'deserts', label: 'Death Valley: the hottest place on Earth', teaches: ['D6.4'] },
    { value: 'pacific', label: 'The Pacific’s slow seasons', teaches: ['D6.5'] },
    { value: 'together', label: 'The whole machine against the climate records', teaches: ['D6.6'] }
  ];
  const BASE = {
    setup: 'coastal', cmonth: 6, cStart: 10, cLapse: 1, cUpw: 2.5,
    sst: 11.5, td: 12.5, hinv: 0.45, dinv: 10, valley: 34, fStart: 5, fLapse: 1,
    T0: 11, rh: 92, wind: 15, eps: 0.7, sierra: 1, coast: 1, rLapse: 40,
    dmonth: 6, sink: 0, zi: 4, surface: 'gravel', dwind: 2, dStart: 9, dLapse: 1,
    mixed: 50, dist: 5, pmonth: 0, pOcean: true, pLapse: 0.5,
    tmonth: 6, tOcean: true, tSierra: 1, tUpw: 2.5, tLapse: 0
  };
  const preset = o => Object.assign({}, BASE, o);
  const HOMES = {
    coastal: { theta: -1.72, phi: 0.46, dist: 58, target: [0, -8, 1.5] },
    fog: { theta: -2.25, phi: 0.62, dist: 58, target: [0, 0, 0] },
    rainshadow: { theta: -1.72, phi: 0.46, dist: 58, target: [0, -8, 1.5] },
    deserts: { theta: -1.65, phi: 0.35, dist: 50, target: [0, 0, 2] },
    pacific: { theta: -1.72, phi: 0.46, dist: 58, target: [0, -8, 1.5] },
    together: { theta: -1.72, phi: 0.46, dist: 58, target: [0, -8, 1.5] }
  };
  const homeOf = (p, narrow) => { const h = HOMES[p.setup]; return Object.assign({}, h, { dist: h.dist * (narrow ? 1.35 : 1) }); };
  const optsOf = p => p.setup === 'together' ? { ocean: !!p.tOcean, sierra: p.tSierra, upw: p.tUpw } : p.setup === 'pacific' ? { ocean: !!p.pOcean, h: p.mixed } : p.setup === 'rainshadow' ? { sierra: p.sierra, coast: p.coast } : { upw: p.cUpw };
  const stormOf = p => ({ T0: p.T0, rh: p.rh, u: p.wind, eps: p.eps });
  function setup(S) {
    const p = S.p;
    if (!S.cam || S.camFor !== p.setup) { const h = homeOf(p, !!S._narrow); S.cam = Camera(Object.assign({ fov: 0.9 }, h, { target: h.target.slice() })); S.cam.minDist = h.dist * 0.4; S.cam.maxDist = h.dist * 3; S.camFor = p.setup; S._narrowCam = !!S._narrow; }
    S.ta = 0; S.t = 0;
    S.hr = p.setup === 'fog' ? p.fStart : p.setup === 'deserts' ? p.dStart : p.cStart;
    S.mon = p.setup === 'pacific' ? p.pmonth : p.setup === 'together' ? p.tmonth : p.setup === 'deserts' ? p.dmonth : p.cmonth;
    S.px = 0;
  }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt; S.t += dt;
    if (p.setup === 'coastal') S.hr = (S.hr + dt * p.cLapse) % 24;
    else if (p.setup === 'fog') S.hr = (S.hr + dt * p.fLapse) % 24;
    else if (p.setup === 'deserts') S.hr = (S.hr + dt * p.dLapse) % 24;
    else if (p.setup === 'rainshadow') S.px = (S.px + dt * p.rLapse) % 420;
    else if (p.setup === 'pacific') S.mon = (S.mon + dt * p.pLapse) % 12;
    else if (p.setup === 'together') S.mon = (S.mon + dt * p.tLapse) % 12;
  }
  const monI = S => Math.floor(S.mon) % 12;
  const monF = (fn, mf) => { const a = Math.floor(mf) % 12, b = (a + 1) % 12, u = mf - Math.floor(mf); return fn(a) * (1 - u) + fn(b) * u; };   // smooth between months
  const hhmm = hr => String(Math.floor(hr)).padStart(2, '0') + ':' + String(Math.floor(hr % 1 * 60)).padStart(2, '0');

  /* ---------------- helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  let G3 = null;
  function placeView(S, g, fx, fy) { const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = HOMES[S.p.setup].target; cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy]; cam.update(); }
  function cardRows(g, x, y, w, title, rows, o) {
    o = o || {};
    const ctx = g.ctx, K = kit(), lh = 15, h = 26 + rows.length * lh + (o.foot ? 30 : 6);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13);
    rows.forEach((r, i) => { const yy = y + 30 + i * lh; ctx.font = mono(9.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], w * 0.5), x + 9, yy); ctx.font = mono(9.5, 600); ctx.fillStyle = r[2] || '#F2F6FF'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], w * 0.48), x + w - 9, yy); });
    if (o.foot) { ctx.font = mono(8.5); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; K.wrapText(ctx, o.foot, x + 9, y + h - 24, w - 18, 11, 2); }
    ctx.restore(); return h;
  }
  /* a temperature colour scale: deep blue (−10) through green to red (45) */
  const TSTOPS = [[-10, [60, 70, 200]], [0, [80, 150, 240]], [10, [90, 210, 200]], [18, [130, 220, 110]], [26, [240, 220, 90]], [34, [250, 150, 60]], [45, [220, 50, 50]]];
  function tcol(T, al) { let k = 0; while (k < TSTOPS.length - 2 && T > TSTOPS[k + 1][0]) k++; const a = TSTOPS[k], b = TSTOPS[k + 1], u = clamp((T - a[0]) / (b[0] - a[0]), 0, 1); const c = [0, 1, 2].map(i => Math.round(a[1][i] + (b[1][i] - a[1][i]) * u)); return 'rgba(' + c.join(',') + ',' + (al == null ? 1 : al) + ')'; }
  function sky(g, hr) {
    const ctx = g.ctx, day = hr == null ? 1 : clamp(Math.sin(Math.PI * (hr - 6) / 12) * 1.6, 0, 1), gr = ctx.createLinearGradient(0, 0, 0, g.h);
    gr.addColorStop(0, RX.mix('#060B16', '#2E62A8', day)); gr.addColorStop(1, RX.mix('#121A2A', '#B4CCE4', day)); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h);
  }
  function arrow2(ctx, a, b, col, w, dash, off) {
    const an = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = col; ctx.lineWidth = w; if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = off || 0; }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - Math.cos(an) * 8, b.y - Math.sin(an) * 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(an - 0.45) * (10 + w), b.y - Math.sin(an - 0.45) * (10 + w)); ctx.lineTo(b.x - Math.cos(an + 0.45) * (10 + w), b.y - Math.sin(an + 0.45) * (10 + w)); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ---------------- the California block: 480 km of transect, heights ×16 ---------------- */
  const VZ = 1.6, XU = xk => (xk - 180) / 10, YT = -19;            // the transect runs near the block’s front face
  const coastOff = yk => 6 * Math.sin(yk / 45) + 3 * Math.sin(yk / 17);
  let CAB = {};
  function caBlock(o) {
    const key = [o.sierra == null ? 1 : o.sierra, o.coast == null ? 1 : o.coast].join('|');
    if (CAB[key]) return CAB[key];
    return (CAB[key] = window.TERRAIN.block({ n: 64, size: 48, zBase: -2.2, height: (X, Y) => { const xk = X * 10 + 180, yk = (Y - YT) * 10, xs = xk - coastOff(yk); const z = zAt(xs, o); return (xs > 0 ? z * (1 + 0.2 * Math.sin(yk / 37) * Math.cos(xs / 50)) : z) * VZ; } }));
  }
  const xsOf = (X, Y) => X * 10 + 180 - coastOff((Y - YT) * 10);
  function caCover(m, o) {
    const summer = m >= 4 && m <= 9;
    return (i, j, X, Y, z) => {
      const xs = xsOf(X, Y), zk = z / VZ;
      if (xs < 0) return [194, 180, 150];
      if (zk > 0.9 && airT(xs, m, Object.assign({}, o, { z: zk })) < -1.5) return [244, 246, 250];
      if (xs < 45) return summer ? [200, 172, 104] : [112, 152, 74];
      if (xs < 200) return ((Math.floor(X * 1.6) + Math.floor(Y * 1.6)) % 2) ? (summer ? [128, 150, 70] : [96, 140, 70]) : (summer ? [176, 156, 98] : [120, 128, 76]);
      if (xs < 292) return zk < 1 ? [118, 128, 70] : zk < 2.6 ? [54, 92, 54] : [156, 152, 144];
      if (xs < 372) return zk > 2.2 ? [150, 128, 104] : [166, 150, 112];
      if (xs < 398 && zk < 0.05) return [234, 230, 218];
      return [190, 156, 116];
    };
  }
  function drawCA(S, g, o, m, extra) {
    const ctx = g.ctx, cam = S.cam, B = caBlock(o), T = window.TERRAIN, rr = G3.rng(7), items = [];
    for (let k = 0; k < 260; k++) { const X = XU(205 + rr() * 85), Y = -23 + rr() * 46, zk = B.zAt(X, Y) / VZ, xs = xsOf(X, Y); if (zk < 0.9 || zk > 2.6 || xs < 200 || xs > 292) continue; items.push({ at: [X, Y, B.zAt(X, Y)], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(2.5, 0.5 * q.s), { kind: 'conifer', seed: k }) }); }
    (extra && extra.items || []).forEach(it => items.push(it));
    T.draw(ctx, cam, B, { cover: caCover(m, o), water: (i, j, X, Y) => xsOf(X, Y) < 0.5 ? 0 : null, waterCol: () => [40, 92, 140], items, sea: 0, layers: [{ col: [120, 100, 80], pat: 'rock', top: (x, y, zs) => zs }] });
  }
  /* the stations: a pole and a tag */
  function pins(S, g, o, txt, keys) {
    const ctx = g.ctx, cam = S.cam, B = caBlock(o), out = [];
    (keys || Object.keys(STN)).forEach((k, i) => {
      const s = STN[k], X = XU(s.x), z = B.zAt(X, YT), a = cam.project([X, YT, z]), b = cam.project([X, YT, z + 2.4 + (i % 3) * 1.7]);
      if (!a.ok || !b.ok) return;
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.fillStyle = '#FFE0A0'; ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, TAU); ctx.fill(); ctx.restore();
      if (g.labels) G3.tag(ctx, b.x, b.y - 6, s.name + (txt ? ' · ' + txt(k) : ''), '#F2F6FF', { align: k === 'blue' ? 'right' : k === 'dv' ? 'left' : 'center' });
      out.push(b);
    });
    return out;
  }
  /* the air above the transect, coloured by its temperature */
  function airRibbon(S, g, o, fT, hKm) {
    const ctx = g.ctx, cam = S.cam, B = caBlock(o);
    ctx.save(); ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let x = 0; x < 420; x += 6) {
      const a = cam.project([XU(x), YT, B.zAt(XU(x), YT) + hKm * VZ]), b = cam.project([XU(x + 6), YT, B.zAt(XU(x + 6), YT) + hKm * VZ]);
      if (!a.ok || !b.ok) continue; ctx.strokeStyle = tcol(fT(x + 3), 0.92); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
  function tScale(g, x, y, h, lo, hi) {
    const ctx = g.ctx; ctx.save();
    for (let i = 0; i < h; i++) { ctx.fillStyle = tcol(hi - (hi - lo) * i / h); ctx.fillRect(x, y + i, 9, 1.2); }
    ctx.font = mono(8.5); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(hi + ' °C', x + 13, y + 4); ctx.fillText(lo + ' °C', x + 13, y + h - 4); ctx.restore();
  }

  /* ---------------- coastal ---------------- */
  function drawCoastal(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), o = optsOf(p), m = p.cmonth, hr = S.hr, narrow = g.w < K.NARROW;
    sky(g, hr); placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 16);
    drawCA(S, g, o, m);
    // the marine air: a cool, damp layer pushed in by the sea breeze — as far as the land's heat draws it
    const Lb = CAL.L0 + CAL.L1 * Math.max(0, landT(STN.sac.x, 0, m) - seaT(m, o).coast), reachKm = Lb * 2.3 * (0.6 + 0.4 * daySun(hr));
    const top = 0.45 * VZ, slab = [[XU(-60), -24, top], [XU(reachKm), -24, top], [XU(reachKm), 24, top], [XU(-60), 24, top]].map(q => cam.project(q));
    if (slab.every(q => q.ok)) { ctx.save(); ctx.fillStyle = 'rgba(236,242,250,' + (m >= 4 && m <= 9 ? 0.2 : 0.08) + ')'; ctx.beginPath(); slab.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.restore(); }
    airRibbon(S, g, o, x => dayT(x, m, hr, o), 0.35);
    const br = breeze(m, hr, o), a = cam.project([XU(-40), YT, 0.9 * VZ]), b = cam.project([XU(Math.max(30, reachKm)), YT, 0.9 * VZ]);
    if (a.ok && b.ok && Math.abs(br) > 1) { if (br > 0) arrow2(ctx, a, b, 'rgba(235,245,255,.9)', clamp(2 + br / 5, 2, 7), [10, 6], -S.ta * 30); else arrow2(ctx, b, a, 'rgba(235,245,255,.7)', 2, [10, 6], -S.ta * 30); }
    if (g.labels && a.ok && b.ok && Math.abs(br) > 1) G3.tag(ctx, Math.max(150, (a.x + b.x) / 2), Math.max(a.y, b.y) + 16, (br > 0 ? 'sea breeze: the land is ' : 'land breeze: the land is ') + Math.abs(br).toFixed(0) + ' °C ' + (br > 0 ? 'warmer' : 'cooler') + ' than the sea', '#EAF4FF', { align: 'center' });
    pins(S, g, o, k => stationDay(k, m, hr, o).toFixed(1) + ' °C', ['sf', 'sac', 'blue', 'bishop', 'dv']);
    if (!narrow) tScale(g, 16, K.HDR + 16, 120, 0, 45);
    const cs = K.cardSlot(g, S, 'the stations now', 250, { x: g.w - 260, y: K.HDR + 6 });
    if (cs) cardRows(g, cs.x, cs.y, cs.w, MONTHS[m] + ', ' + hhmm(hr) + ' · now / month mean', ['sf', 'sac', 'blue', 'bishop', 'dv'].map(k => [STN[k].name, stationDay(k, m, hr, o).toFixed(1) + ' / ' + stationT(k, m, o).toFixed(1) + ' °C', tcol(stationDay(k, m, hr, o))]).concat([['coastal sea', (seaT(m, o).coast).toFixed(1) + ' °C', '#8FC8FF'], ['sea breeze reaches', fmtN(reachKm) + ' km', '#EAF4FF']]), { foot: 'The ribbon is the air 350 m above the ground, coloured by its temperature.' });
  }

  /* ---------------- fog: the Bay Area block ---------------- */
  const BS = 48 / BAY.size, BVZ = 6;
  const BX = xk => (xk + BAY.size * 0.2 - BAY.size / 2) * BS, BY = yk => yk * BS;
  let BAYB = null;
  function bayBlock() { if (BAYB) return BAYB; BAYB = window.TERRAIN.block({ n: BAY.n, size: 48, zBase: -1.2, height: (X, Y) => { const xk = X / BS - BAY.size * 0.2 + BAY.size / 2, yk = Y / BS; return bayZ(xk, yk) * BS * BVZ; } }); return BAYB; }
  const bxk = X => X / BS - BAY.size * 0.2 + BAY.size / 2;
  function drawFog(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), hr = S.hr, narrow = g.w < K.NARROW, B = bayBlock(), T = window.TERRAIN, items = [];
    sky(g, hr); placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 16);
    const n = 24, d = 48 / n, u = BS * BVZ;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const X = -24 + (i + 0.5) * d, Y = -24 + (j + 0.5) * d, f = fogAt(p, bxk(X), Y / BS, hr);
      if (!f.cloud) continue;
      const zt = f.top * u, zb = Math.max(f.z, f.base) * u, thick = clamp((f.top - Math.max(f.z, f.base)) / 0.3, 0.25, 1);
      items.push({ at: [X, Y, zt], draw: (c2) => {
        const e = d * 0.62, q = [[X - e, Y - e], [X + e, Y - e], [X + e, Y + e], [X - e, Y + e]].map(v => cam.project([v[0], v[1], zt]));
        if (q.some(v => !v.ok)) return;
        c2.save(); c2.fillStyle = RX.mix('#C9D3E0', '#F2F5FA', thick); c2.beginPath(); q.forEach((v, k) => k ? c2.lineTo(v.x, v.y) : c2.moveTo(v.x, v.y)); c2.closePath(); c2.fill();
        if (f.fog) { const lo = [[X - d / 2, Y - d / 2], [X + d / 2, Y - d / 2]].map(v => cam.project([v[0], v[1], zb])); if (lo.every(v => v.ok)) { c2.fillStyle = 'rgba(230,236,246,.55)'; c2.beginPath(); c2.moveTo(q[0].x, q[0].y); c2.lineTo(q[1].x, q[1].y); c2.lineTo(lo[1].x, lo[1].y); c2.lineTo(lo[0].x, lo[0].y); c2.closePath(); c2.fill(); } }
        c2.restore();
      } });
    }
    // the Golden Gate Bridge: towers 227 m, deck 67 m, across the strait
    const bx = BX(3), tw = [-1.0, 1.0].map(y => [bx, BY(y)]);
    const bridge = (c2) => {
      const top = 0.227 * u, deck = 0.067 * u, P0 = tw.map(t => cam.project([t[0], t[1], 0])), P1 = tw.map(t => cam.project([t[0], t[1], top])), D0 = cam.project([bx, BY(-1.9), deck]), D1 = cam.project([bx, BY(1.9), deck]);
      if (![...P0, ...P1, D0, D1].every(v => v.ok)) return;
      const veiled = fogPt(p, 'bridge', hr).cloud && p.hinv > 0.227; c2.save(); c2.globalAlpha = veiled ? 0.3 : 1; c2.strokeStyle = '#D0402C'; c2.lineWidth = 4; P0.forEach((v, k) => { c2.beginPath(); c2.moveTo(v.x, v.y); c2.lineTo(P1[k].x, P1[k].y); c2.stroke(); });
      c2.lineWidth = 2; c2.beginPath(); c2.moveTo(D0.x, D0.y); c2.lineTo(D1.x, D1.y); c2.stroke();
      c2.lineWidth = 1.2; c2.beginPath(); c2.moveTo(D0.x, D0.y); c2.quadraticCurveTo((P1[0].x + P1[1].x) / 2, (P1[0].y + P1[1].y) / 2 + 14, P1[0].x, P1[0].y); c2.moveTo(P1[0].x, P1[0].y); c2.quadraticCurveTo((P1[0].x + P1[1].x) / 2, (P1[0].y + P1[1].y) / 2 + 22, P1[1].x, P1[1].y); c2.lineTo(D1.x, D1.y); c2.stroke(); c2.restore();
    };
    T.draw(ctx, cam, B, {
      cover: (i, j, X, Y, z) => { const xk = bxk(X), yk = Y / BS, zk = z / u; if (xk < 0) return [194, 180, 150]; if ((xk > 3 && xk < 11 && yk < -1 && yk > -9) || (xk > 19 && xk < 25 && yk > -14 && yk < 10)) return [150, 146, 140]; return zk > 0.3 ? [104, 120, 66] : zk > 0.12 ? [150, 146, 84] : [196, 170, 104]; },
      water: (i, j, X, Y) => bayZ(bxk(X), Y / BS) < 0 ? 0 : null, waterCol: () => [36, 86, 128], items, sea: 0, layers: [{ col: [120, 100, 80], pat: 'rock', top: (x, y, zs) => zs }]
    });
    bridge(ctx);
    if (g.labels) Object.keys(BAYPTS).forEach(k => { const P = BAYPTS[k], f = fogPt(p, k, hr), q = cam.project([BX(P.x), BY(P.y), Math.max(f.z, 0) * u + 0.6]); if (q.ok) G3.tag(ctx, q.x, q.y - (k === 'bridge' ? 34 : 8), P.name + ' · ' + f.T.toFixed(0) + ' °C' + (f.fog ? ' · fog' : f.cloud ? ' · overcast' : ''), f.fog ? '#E6EEF8' : f.cloud ? '#C9D4EA' : '#FFE0A0', { align: k === 'hills' ? 'right' : k === 'valley' || k === 'downtown' ? 'left' : 'center' }); });
    const cs = K.cardSlot(g, S, 'the marine layer', 250, { x: g.w - 260, y: K.HDR + 6 });
    if (cs) { const s = sounding(p); cardRows(g, cs.x, cs.y, cs.w, 'July, ' + hhmm(hr) + ' · the air over the coast', [
      ['upwelled sea', p.sst.toFixed(1) + ' °C', '#8FC8FF'], ['air over it', (p.sst + 0.5).toFixed(1) + ' °C'], ['its dew point', p.td.toFixed(1) + ' °C'],
      ['cloud base 125(T − Td)', s.base <= 0.005 ? 'the sea: fog' : fmtN(s.base * 1000) + ' m', s.base <= 0.005 ? '#E6EEF8' : '#F2F6FF'], ['inversion (cloud top)', fmtN(p.hinv * 1000) + ' m'], ['air above it', (p.sst + 0.5 - 9.8 * Math.min(s.base, p.hinv) - 6 * Math.max(0, p.hinv - s.base) + p.dinv).toFixed(1) + ' °C', '#FFC56B']
    ], { foot: 'The cool layer flows inland only where the ground is lower than its top: through the Golden Gate.' }); }
  }

  /* ---------------- rain shadow ---------------- */
  function drawRain(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), o = optsOf(p), narrow = g.w < K.NARROW, R = parcelOf(stormOf(p), o), B = caBlock(o), rr = G3.rng(3);
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, '#3A4A62'); gr.addColorStop(1, '#8EA2B8'); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h);
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 12);
    drawCA(S, g, o, 0);
    // clouds where the air is saturated; rain under them, as hard as the model says
    for (let x = 0; x <= 400; x += 10) {
      const r = rainAt(R, x); if (r.rh < 98 && r.rate < 0.3) continue;
      const a = cam.project([XU(x), YT + 1 + rr() * 6, (r.z + 0.9) * VZ]), gnd = cam.project([XU(x), YT, B.zAt(XU(x), YT)]);
      if (!a.ok || !gnd.ok) continue;
      if (r.rate > 0.2) window.TERRAIN.rain(ctx, a.x - 22, a.y, 44, Math.max(10, gnd.y - a.y), r.rate * 6, S.ta * 0.8, -0.25);
      if (r.rh >= 98 && window.GEO) window.GEO.cloud(ctx, a.x, a.y - 6, 90, 34, x + 1, 0.85, [200, 206, 216]);
    }
    // the parcel's path above the ground, coloured by its temperature; the parcel itself
    ctx.save(); ctx.lineWidth = 4;
    for (let x = 0; x < 420; x += 4) { const r0 = rainAt(R, x), r1 = rainAt(R, x + 4), a = cam.project([XU(x), YT, (r0.z + 0.25) * VZ]), b = cam.project([XU(x + 4), YT, (r1.z + 0.25) * VZ]); if (a.ok && b.ok) { ctx.strokeStyle = tcol(r0.T); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
    ctx.restore();
    const r = rainAt(R, S.px), q = cam.project([XU(S.px), YT, (r.z + 0.25) * VZ]);
    if (q.ok) { ctx.save(); ctx.fillStyle = tcol(r.T); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); if (g.labels) G3.tag(ctx, q.x + 12, q.y - 18, 'parcel · ' + r.T.toFixed(1) + ' °C, dew point ' + r.Td.toFixed(1) + ' °C' + (r.rh >= 98 ? ' · in cloud' : ''), '#FFE0A0'); }
    pins(S, g, o, k => fmtN(rainAt(R, STN[k].x).year) + ' mm a year');
    const cs = K.cardSlot(g, S, 'the storm along the way', 260, { x: g.w - 270, y: K.HDR + 6 });
    if (cs) cardRows(g, cs.x, cs.y, cs.w, 'Parcel T / dew point · rain a year', ['sf', 'sac', 'blue', 'bishop', 'dv'].map(k => { const v = rainAt(R, STN[k].x); return [STN[k].name, v.T.toFixed(0) + '/' + v.Td.toFixed(0) + ' °C · ' + fmtN(v.year) + ' mm', v.year > 1000 ? '#8FC8FF' : v.year < 200 ? '#FFC56B' : '#F2F6FF']; }).concat([['the crest (' + fmtN(zAt(292, o) * 1000) + ' m)', rainAt(R, 292).T.toFixed(1) + ' °C']]), { foot: 'Climbing, the air cools and rains; sinking on the far side it warms 9.8 °C a km and dries.' });
  }

  /* ---------------- Death Valley ---------------- */
  const DVS = 48 / 60, DVZ = 3;
  const dvZ = (xk, yk) => DV.floor + 3.45 * Math.exp(-Math.pow((xk + 13) / 5.5, 2)) * (0.85 + 0.15 * Math.cos(yk / 9)) + 1.75 * Math.exp(-Math.pow((xk - 11) / 4.5, 2)) * (0.9 + 0.1 * Math.sin(yk / 7)) + 0.25 * Math.max(0, Math.abs(xk) - 3) / 10 + 0.04 * Math.sin(xk * 1.3 + yk * 0.7);
  let DVB = null;
  function dvBlock() { if (DVB) return DVB; DVB = window.TERRAIN.block({ n: 52, size: 48, zBase: -1.5, height: (X, Y) => Math.max(DV.floor, dvZ(X / DVS, Y / DVS)) * DVS * DVZ }); return DVB; }
  const DVPTS = { telescope: { name: 'Telescope Peak', x: -13, y: 0, z: DV.telescope }, dante: { name: 'Dante’s View', x: 11, y: 4, z: DV.dante }, furnace: { name: 'Furnace Creek', x: 2.5, y: 8, z: DV.furnace }, badwater: { name: 'Badwater', x: 0, y: -4, z: DV.floor } };
  function drawDeserts(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), hr = S.hr, narrow = g.w < K.NARROW, B = dvBlock(), u = DVS * DVZ;
    sky(g, hr); placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 14);
    window.TERRAIN.draw(ctx, cam, B, {
      cover: (i, j, X, Y, z) => { const zk = z / u; if (zk < DV.floor + 0.02) return [236, 232, 220]; if (zk < 0.25) return [196, 164, 120]; return zk > 2.5 ? [128, 106, 92] : ((i * 7 + j * 3) % 5 === 0 ? [150, 96, 72] : [164, 128, 98]); },
      items: [], layers: [{ col: [150, 110, 80], pat: 'rock', top: (x, y, zs) => zs }]
    });
    // the mixed layer: air stirred by the hot ground up to its top, on a dry adiabat
    const top = (DV.furnace + daySun(hr) * p.zi) * u, box = [[-24, -24, top], [24, -24, top], [24, 24, top], [-24, 24, top]].map(q => cam.project(q));
    if (daySun(hr) > 0.05 && box.every(q => q.ok)) { ctx.save(); ctx.fillStyle = 'rgba(255,170,90,.10)'; ctx.strokeStyle = 'rgba(255,190,120,.6)'; ctx.setLineDash([6, 4]); ctx.beginPath(); box.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); if (g.labels) G3.tag(ctx, box[0].x + 10, box[0].y - 10, 'top of the mixed layer · ' + fmtN((DV.furnace + daySun(hr) * p.zi) * 1000) + ' m', '#FFD8A8'); }
    // heat shimmer over the floor in the afternoon
    if (valleyAir(p, DV.floor, hr) > 38) { ctx.save(); ctx.strokeStyle = 'rgba(255,230,200,.18)'; ctx.lineWidth = 1; for (let k = 0; k < 14; k++) { const q = cam.project([-3 + k * 0.5, -6 + (k % 4) * 3, 0.4]); if (!q.ok) continue; ctx.beginPath(); for (let s = 0; s < 24; s++) { const yy = q.y - s * 2, xx = q.x + Math.sin(s * 0.8 + S.ta * 6 + k) * 2.5; s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } ctx.restore(); }
    if (g.labels) Object.keys(DVPTS).forEach(k => { const P = DVPTS[k], q = cam.project([P.x * DVS, P.y * DVS, Math.max(P.z, dvZ(P.x, P.y)) * u + 0.4]); if (q.ok) G3.tag(ctx, q.x, q.y - 8, P.name + ' ' + fmtN(P.z * 1000) + ' m · ' + valleyAir(p, P.z, hr).toFixed(1) + ' °C', tcol(valleyAir(p, P.z, hr)), { align: 'center' }); });
    const cs = K.cardSlot(g, S, 'the valley now', 250, { x: g.w - 260, y: K.HDR + 6 });
    if (cs) cardRows(g, cs.x, cs.y, cs.w, MONTHS[p.dmonth] + ', ' + hhmm(hr) + ' · Death Valley', [
      ['air at Badwater', valleyAir(p, DV.floor, hr).toFixed(1) + ' °C', tcol(valleyAir(p, DV.floor, hr))], ['air at Telescope Peak', valleyAir(p, DV.telescope, hr).toFixed(1) + ' °C', tcol(valleyAir(p, DV.telescope, hr))],
      ['the ground (' + SURF[p.surface].name + ')', groundT(p, hr).toFixed(1) + ' °C', '#FF8A6A'], ['sun ' + Math.max(0, elevAt(36.46, MID[p.dmonth], hr)).toFixed(0) + '° up', fmtN(beam(elevAt(36.46, MID[p.dmonth], hr)) * 1.1) + ' W/m²'],
      ['rain a year', fmtN(rainAt(parcelOf({}, {}), STN.dv.x).year) + ' mm', '#8FC8FF'], ['records', '56.7 °C air (1913) · 93.9 °C ground (1972)', '#98A6C6']
    ], { foot: 'Behind two mountain ranges, under sinking air, below sea level: dry, clear and hot.' });
  }

  /* ---------------- the Pacific ---------------- */
  function drawPacific(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), o = optsOf(p), mf = S.mon, m = monI(S), narrow = g.w < K.NARROW;
    sky(g, 12); placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 16);
    drawCA(S, g, o, m);
    // the ocean's mixed layer, cut open on the near face (depth drawn ×20 more than the land)
    const sst = monF(k => seaT(k, o).off, mf), dz = p.mixed / 1000 * VZ * 20, xs0 = XU(-60), xs1 = XU(-1);
    const f = [[xs0, -24, 0], [xs1, -24, 0], [xs1, -24, -dz], [xs0, -24, -dz]].map(q => cam.project(q));
    if (f.every(q => q.ok)) { ctx.save(); ctx.fillStyle = tcol(sst, 0.9); ctx.beginPath(); f.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(); ctx.restore(); if (g.labels) G3.tag(ctx, Math.max(170, (f[2].x + f[3].x) / 2), f[2].y + 14, 'mixed layer ' + p.mixed + ' m · ' + sst.toFixed(1) + ' °C (depth ×20)', '#BFE0FF', { align: 'center' }); }
    airRibbon(S, g, o, x => monF(k => airT(x, k, o), mf), 0.35);
    // the travelling thermometer
    const B = caBlock(o), X = XU(p.dist), z = B.zAt(X, YT), a = cam.project([X, YT, Math.max(0, z)]), b = cam.project([X, YT, Math.max(0, z) + 4.5]);
    if (a.ok && b.ok) { ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.fillStyle = '#E8402C'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, TAU); ctx.fill(); ctx.restore(); g.handle(b.x, b.y, 16, 'probe'); S._probeAxis = [cam.project([XU(0), YT, 0]), cam.project([XU(420), YT, 0])];
      if (g.labels) { const A = probeAnnual(p); G3.tag(ctx, b.x + 12, b.y - 10, fmtN(p.dist) + ' km inland · ' + monF(k => airT(p.dist, k, Object.assign({}, o, { z: Math.max(0, zAt(p.dist, o)) })), mf).toFixed(1) + ' °C · swings ' + A.range.toFixed(1) + ' °C a year', '#FFE0A0'); } }
    if (!narrow) tScale(g, 16, K.HDR + 16, 120, 0, 45);
    const cs = K.cardSlot(g, S, 'heat in the ocean', 250, { x: g.w - 260, y: K.HDR + 6 });
    if (cs) { const C = 4.18e6 * p.mixed, A = probeAnnual(p); cardRows(g, cs.x, cs.y, cs.w, MONTHS[m] + ' · the ocean against the land', [
      ['offshore sea now', sst.toFixed(1) + ' °C', '#8FC8FF'], ['land without the sea', monF(k => landT(150, 0, k), mf).toFixed(1) + ' °C', '#FFC56B'], ['heat per m² per °C', (C / 1e6).toFixed(0) + ' MJ', '#F2F6FF'],
      ['sea swings', (Math.max(...MONTHS.map((_, k) => seaT(k, o).off)) - Math.min(...MONTHS.map((_, k) => seaT(k, o).off))).toFixed(1) + ' °C a year'], ['the thermometer swings', A.range.toFixed(1) + ' °C a year', '#FFE0A0'], ['its warmest month', MONTHS[A.warmest]]
    ], { foot: 'Drag the red thermometer inland. Water stores the summer’s heat and gives it back in autumn.' }); }
  }
  const probeAnnual = p => { const o = optsOf(p), v = MONTHS.map((_, k) => airT(p.dist, k, Object.assign({}, o, { z: Math.max(0, zAt(p.dist, o)) }))); return { v, range: Math.max(...v) - Math.min(...v), warmest: v.indexOf(Math.max(...v)) }; };

  /* ---------------- together ---------------- */
  function drawTogether(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), o = optsOf(p), mf = S.mon, m = monI(S), narrow = g.w < K.NARROW, R = parcelOf(togetherStorm(p), o), B = caBlock(o);
    sky(g, 13); placeView(S, g, narrow ? 0 : -0.13, narrow ? 22 : 16);
    drawCA(S, g, o, m);
    airRibbon(S, g, o, x => monF(k => airT(x, k, o), mf), 0.35);
    // a year's rain at each station: model (blue) against the record (outline)
    ['sf', 'sac', 'blue', 'bishop', 'dv'].forEach(k => {
      const s = STN[k], X = XU(s.x) + 0.9, z = B.zAt(X, YT + 1.5), v = rainAt(R, s.x).year, n = NORMALS[k].P, hm = v / 1000 * 4, hn = n / 1000 * 4;
      const a = cam.project([X, YT + 1.5, z]), b = cam.project([X, YT + 1.5, z + hm]), c = cam.project([X, YT + 1.5, z + hn]);
      if (!a.ok || !b.ok || !c.ok) return;
      ctx.save(); ctx.strokeStyle = 'rgba(110,180,255,.95)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x - 9, c.y); ctx.lineTo(c.x + 9, c.y); ctx.stroke(); ctx.restore();
    });
    pins(S, g, o, k => monF(j => stationT(k, j, o), mf).toFixed(1) + ' °C', ['sf', 'sac', 'blue', 'bishop', 'dv']);
    if (!narrow) tScale(g, 16, K.HDR + 16, 120, 0, 45);
    const cs = K.cardSlot(g, S, 'model and the records', 270, { x: g.w - 280, y: K.HDR + 6 });
    if (cs) cardRows(g, cs.x, cs.y, cs.w, 'Model / NOAA 1991–2020 normals', [].concat(...['sf', 'sac', 'dv'].map(k => { const A = annual(k, o), N = NORMALS[k].T, nm = N.reduce((x, y) => x + y, 0) / 12; return [[STN[k].name + ' mean', A.mean.toFixed(1) + ' / ' + nm.toFixed(1) + ' °C', '#F2F6FF'], ['  coldest–warmest', A.range.toFixed(1) + ' / ' + (Math.max(...N) - Math.min(...N)).toFixed(1) + ' °C', '#C9D4EA']]; })).concat([['rain SF · Sac · DV', ["sf", "sac", "dv"].map(k => fmtN(rainAt(R, STN[k].x).year)).join(' · ') + ' mm', '#8FC8FF']]), { foot: 'Blue bars: the model’s year of rain; white ticks: the records.' });
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = window.G6D;
    if (!K || !G3 || !window.TERRAIN) return;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { const h = homeOf(p, S._narrow); S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist }; S._narrowCam = S._narrow; }
    ({ coastal: drawCoastal, fog: drawFog, rainshadow: drawRain, deserts: drawDeserts, pacific: drawPacific, together: drawTogether })[p.setup](S, g);
    headerOf(S, g);
  }
  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'probe' && S._probeAxis) { const [a, b] = S._probeAxis, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1; p.dist = clamp(Math.round(p.dist + (e.dx * dx + e.dy * dy) / L2 * 420), 0, 420); }
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function headerOf(S, g) {
    const p = S.p, K = kit(), o = optsOf(p); let a = '', b = '', c = '';
    if (p.setup === 'coastal') { const m = p.cmonth, br = breeze(m, S.hr, o); a = MONTHS[m] + ' ' + hhmm(S.hr) + ': San Francisco ' + stationDay('sf', m, S.hr, o).toFixed(0) + ' °C, Sacramento ' + stationDay('sac', m, S.hr, o).toFixed(0) + ' °C, Death Valley ' + stationDay('dv', m, S.hr, o).toFixed(0) + ' °C'; b = (br > 1 ? 'the hot land draws the cool sea air in: a sea breeze' : br < -1 ? 'the land is cooler than the sea: a land breeze' : 'land and sea alike: little breeze') + ' · coastal sea ' + seaT(m, o).coast.toFixed(1) + ' °C'; c = 'monthly means from the energy-balance model · ' + p.cLapse + ' h a second'; }
    else if (p.setup === 'fog') { const bch = fogPt(p, 'beach', S.hr), dn = fogPt(p, 'downtown', S.hr), v = fogPt(p, 'valley', S.hr); a = hhmm(S.hr) + ': ' + (bch.fog ? 'fog on the beach' : bch.cloud ? 'overcast at the beach' : 'sun at the beach') + ', ' + (dn.fog ? 'fog' : dn.cloud ? 'grey skies' : 'sun') + ' downtown, ' + (v.cloud ? 'cloud' : 'sun') + ' at Walnut Creek (' + v.T.toFixed(0) + ' °C)'; b = 'sea ' + p.sst + ' °C, dew point ' + p.td + ' °C → cloud base ' + fmtN(sounding(p).base * 1000) + ' m · the inversion caps it at ' + fmtN(p.hinv * 1000) + ' m'; c = 'Espy: base = 125 m × (T − Td) · ' + p.fLapse + ' h a second'; }
    else if (p.setup === 'rainshadow') { const R = parcelOf(stormOf(p), o), bl = rainAt(R, STN.blue.x), bi = rainAt(R, STN.bishop.x); a = 'Blue Canyon, on the windward slope, gets ' + fmtN(bl.year) + ' mm a year; Bishop, in the lee, ' + fmtN(bi.year) + ' mm — ' + (bl.year / Math.max(1, bi.year)).toFixed(0) + ' times less'; b = 'the parcel leaves the coast at ' + p.T0 + ' °C and reaches Bishop at ' + bi.T.toFixed(1) + ' °C, ' + (bi.T - (p.T0 - 6.5 * STN.bishop.z)).toFixed(1) + ' °C warmer than air that high normally is · dew point ' + bi.Td.toFixed(1) + ' °C'; c = 'dry 9.8 °C/km, moist ' + moistLapse(p.T0, 0).toFixed(1) + ' °C/km at the coast · precipitation efficiency ' + (p.eps * 100).toFixed(0) + ' %'; }
    else if (p.setup === 'deserts') { const Tb = valleyAir(p, DV.floor, S.hr), Tt = valleyAir(p, DV.telescope, S.hr); a = MONTHS[p.dmonth] + ' ' + hhmm(S.hr) + ': Badwater ' + Tb.toFixed(1) + ' °C, Telescope Peak ' + Tt.toFixed(1) + ' °C, the ground ' + groundT(p, S.hr).toFixed(0) + ' °C'; b = daySun(S.hr) > 0.3 ? 'the afternoon air is stirred on a dry adiabat: 9.8 °C warmer for every km lower' : 'by night the ground cools the air from below; the mixing stops'; c = 'rain ' + fmtN(rainAt(parcelOf({}, {}), STN.dv.x).year) + ' mm a year · ' + p.dLapse + ' h a second'; }
    else if (p.setup === 'pacific') { const A = probeAnnual(p); a = MONTHS[monI(S)] + ': ' + fmtN(p.dist) + ' km inland the air swings ' + A.range.toFixed(1) + ' °C over the year and peaks in ' + MONTHS[A.warmest]; b = 'a ' + p.mixed + ' m mixed layer stores ' + (4.18 * p.mixed).toFixed(0) + ' MJ per m² per °C — the land a few MJ · ' + (p.pOcean ? 'the Pacific is there' : 'the Pacific is replaced by land'); c = 'C dT/dt = a(Q − Q̄) − B(T − T̄) for sea and land · ' + p.pLapse + ' months a second'; }
    else { const m = monI(S); a = MONTHS[m] + ': San Francisco ' + stationT('sf', m, o).toFixed(1) + ' °C (record ' + NORMALS.sf.T[m] + '), Sacramento ' + stationT('sac', m, o).toFixed(1) + ' (' + NORMALS.sac.T[m] + '), Death Valley ' + stationT('dv', m, o).toFixed(1) + ' (' + NORMALS.dv.T[m] + ')'; b = (p.tOcean ? 'with the Pacific' : 'no Pacific') + ' · Sierra ×' + p.tSierra + ' · upwelling ' + p.tUpw + ' °C'; c = 'model against NOAA 1991–2020 normals'; }
    K.header(g, a, b, c);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  const SCOL = { sf: '#8FC8FF', sac: '#7CF0B0', blue: '#3EB86A', bishop: '#C9A0FF', dv: '#FF8A6A' };
  const togetherStorm = p => p.tOcean ? {} : { rh: 40, Ps: 100 };     // with no ocean the storms bring dry continental air
  const silhouette = (P, o, lo, hi, zMax) => { const pts = []; for (let x = 0; x <= 420; x += 3) pts.push([x, lo + Math.max(0, zAt(x, o)) / zMax * (hi - lo) * 0.45]); P.area(pts, lo, 'rgba(160,140,110,.28)'); };
  function plot1(S, g) {
    const p = S.p, K = kit(), o = optsOf(p);
    if (p.setup === 'coastal') {
      const m = p.cmonth, pts = []; for (let x = 0; x <= 420; x += 3) pts.push([x, dayT(x, m, S.hr, o)]);
      const all = pts.map(q => q[1]), lo = Math.floor(Math.min(...all) / 5) * 5 - 5, hi = Math.ceil(Math.max(...all) / 5) * 5 + 2;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: 'air near the ground, ' + hhmm(S.hr) }, { c: 'rgba(160,140,110,.6)', label: 'the ground (not to scale)' }], MONTHS[m]);
      const P = g.Plot({ xmin: 0, xmax: 420, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'km from the coast', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { silhouette(P, o, lo, hi, 3.4); P.line(pts, '#FFC56B', 2.6); Object.keys(STN).forEach(k => { P.dot(STN[k].x, stationDay(k, m, S.hr, o), 4.5, SCOL[k], '#0B0F18'); P.tag(STN[k].x, stationDay(k, m, S.hr, o), STN[k].name, SCOL[k], 'left', -10); }); });
      Kk.draw(P); return;
    }
    if (p.setup === 'fog') {
      const ks = ['beach', 'downtown', 'valley'], cols = ['#8FC8FF', '#FFE0A0', '#FF8A6A'], rows = ks.map(k => { const r = []; for (let h = 0; h <= 24; h += 0.25) r.push([h, fogPt(p, k, h)]); return r; });
      const Kk = K.plotKey(g, ks.map((k, i) => ({ c: cols[i], label: BAYPTS[k].name })).concat([{ c: 'rgba(230,236,246,.5)', label: 'in fog or under cloud' }]));
      const P = g.Plot({ xmin: 0, xmax: 24, ymin: 8, ymax: Math.max(30, Math.ceil(p.valley / 5) * 5 + 2), pad: { t: Kk.t }, xlabel: 'hour of the day', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { rows.forEach((r, i) => { r.forEach(q => { if (q[1].cloud) P.bar(q[0], 8 + 1.2 * (i + 0.5), 0.13, 8 + 1.2 * i, 'rgba(230,236,246,.45)'); }); P.line(r.map(q => [q[0], q[1].T]), cols[i], 2.4); }); P.vline(S.hr, 'rgba(255,255,255,.4)', [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'rainshadow' || p.setup === 'together') {
      const R = p.setup === 'together' ? parcelOf(togetherStorm(p), o) : parcelOf(stormOf(p), o), pts = R.map(r => [r.x, r.year]), hi = Math.max(2000, Math.ceil(Math.max(...pts.map(q => q[1])) / 500) * 500);
      const Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'the model' }, { c: '#FFFFFF', dot: true, label: 'NOAA normals' }, { c: 'rgba(160,140,110,.6)', label: 'the ground' }]);
      const P = g.Plot({ xmin: 0, xmax: 420, ymin: 0, ymax: hi, pad: { t: Kk.t }, xlabel: 'km from the coast', ylabel: 'mm a year', xfmt: v => v.toFixed(0), yfmt: v => fmtN(v) }).frame();
      P.clip(() => { silhouette(P, o, 0, hi, 3.4); P.area(pts, 0, 'rgba(143,200,255,.22)'); P.line(pts, '#8FC8FF', 2.4); Object.keys(STN).forEach(k => { P.dot(STN[k].x, NORMALS[k].P, 5, '#FFFFFF', '#0B0F18'); P.tag(STN[k].x, NORMALS[k].P, STN[k].name, '#DCE6F6', 'left', -10); }); if (p.setup === 'rainshadow') P.vline(S.px, 'rgba(255,224,160,.5)', [3, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'deserts') {
      const pts = []; for (let z = DV.floor; z <= 4.5; z += 0.05) pts.push([valleyAir(p, z, S.hr), z]);
      const night = []; for (let z = DV.floor; z <= 4.5; z += 0.05) night.push([valleyAir(p, z, 5), z]);
      const Kk = K.plotKey(g, [{ c: '#FF8A6A', label: 'the air now, ' + hhmm(S.hr) }, { c: 'rgba(143,200,255,.7)', label: 'at dawn', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'the places' }]);
      const P = g.Plot({ xmin: -10, xmax: 55, ymin: -0.2, ymax: 4.5, pad: { t: Kk.t }, xlabel: 'air temperature, °C', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line(night, 'rgba(143,200,255,.7)', 1.6, [4, 3]); P.line(pts, '#FF8A6A', 2.6); P.hline(0, 'rgba(201,212,234,.3)', [2, 4]); Object.keys(DVPTS).forEach(k => { const P0 = DVPTS[k]; P.dot(valleyAir(p, P0.z, S.hr), P0.z, 5, '#FFFFFF', '#0B0F18'); P.tag(valleyAir(p, P0.z, S.hr), P0.z, P0.name, '#DCE6F6', 'left', -10); }); });
      Kk.draw(P); return;
    }
    // pacific: the year at sea, on land, and at the thermometer
    const sea = MONTHS.map((_, k) => [k + 0.5, seaT(k, o).off]), land = MONTHS.map((_, k) => [k + 0.5, landT(150, 0, k)]), pr = probeAnnual(p).v.map((v, k) => [k + 0.5, v]);
    const Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'offshore sea' }, { c: '#FFC56B', label: 'land with no sea air' }, { c: '#FF5A4A', label: 'the thermometer, ' + fmtN(p.dist) + ' km' }]);
    const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 35, pad: { t: Kk.t }, xlabel: 'month', ylabel: '°C', xfmt: v => MONTHS[Math.min(11, Math.floor(v))] ? MONTHS[Math.min(11, Math.floor(v))][0] : '', yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line(sea, '#8FC8FF', 2.4); P.line(land, '#FFC56B', 2.0); P.line(pr, '#FF5A4A', 2.6); P.vline(S.mon, 'rgba(255,255,255,.4)', [2, 3]); const ks = sea.reduce((a, q) => q[1] > a[1] ? q : a), kl = land.reduce((a, q) => q[1] > a[1] ? q : a); P.tag(ks[0], ks[1], 'sea peaks ' + MONTHS[Math.floor(ks[0])], '#8FC8FF', 'left', -10); P.tag(kl[0], kl[1], 'land peaks ' + MONTHS[Math.floor(kl[0])], '#FFC56B', 'left', -10); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), o = optsOf(p);
    if (p.setup === 'coastal' || p.setup === 'together') {
      const m = p.setup === 'coastal' ? p.cmonth : monI(S), ks = ['sf', 'sac', 'dv'];
      if (p.setup === 'coastal') {
        const Kk = K.plotKey(g, ks.map(k => ({ c: SCOL[k], label: STN[k].name })), MONTHS[m] + ', through the day');
        const P = g.Plot({ xmin: 0, xmax: 24, ymin: 0, ymax: 50, pad: { t: Kk.t }, xlabel: 'hour of the day', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { ks.forEach(k => { const pts = []; for (let h = 0; h <= 24; h += 0.25) pts.push([h, stationDay(k, m, h, o)]); P.line(pts, SCOL[k], 2.4); }); P.vline(S.hr, 'rgba(255,255,255,.4)', [2, 3]); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, ks.map(k => ({ c: SCOL[k], label: STN[k].name })).concat([{ c: '#FFFFFF', dot: true, label: 'NOAA normals' }]));
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 45, pad: { t: Kk.t }, xlabel: 'month', ylabel: 'monthly mean, °C', xfmt: v => MONTHS[Math.min(11, Math.floor(v))] ? MONTHS[Math.min(11, Math.floor(v))][0] : '', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { ks.forEach(k => { P.line(MONTHS.map((_, j) => [j + 0.5, stationT(k, j, o)]), SCOL[k], 2.4); NORMALS[k].T.forEach((v, j) => P.dot(j + 0.5, v, 3.5, '#FFFFFF', SCOL[k])); }); P.vline(S.mon, 'rgba(255,255,255,.4)', [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'fog') {
      const s = sounding(p), Kk = K.plotKey(g, [{ c: '#FF8A6A', label: 'temperature' }, { c: '#7CF0B0', label: 'dew point' }, { c: 'rgba(230,236,246,.5)', label: 'cloud' }], 'over the coast');
      const P = g.Plot({ xmin: -10, xmax: 30, ymin: 0, ymax: 2, pad: { t: Kk.t }, xlabel: '°C', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { if (s.base < s.top) P.area([[-10, s.top], [30, s.top]], s.base, 'rgba(230,236,246,.28)'); P.line(s.rows.map(r => [r[1], r[0]]), '#FF8A6A', 2.6); P.line(s.rows.map(r => [r[2], r[0]]), '#7CF0B0', 2.2); P.hline(p.hinv, 'rgba(255,214,107,.6)', [4, 3]); P.tag(29, p.hinv, 'inversion: warm, dry air above', '#FFD27A', 'right', -8); });
      Kk.draw(P); return;
    }
    if (p.setup === 'rainshadow') {
      const R = parcelOf(stormOf(p), o), Kk = K.plotKey(g, [{ c: '#FF8A6A', label: 'parcel temperature' }, { c: '#7CF0B0', label: 'its dew point' }, { c: '#C9D4EA', label: 'air at that height normally', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: 420, ymin: -25, ymax: 20, pad: { t: Kk.t }, xlabel: 'km from the coast', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { silhouette(P, o, -25, 20, 3.4); P.line(R.map(r => [r.x, p.T0 - 6.5 * r.z]), 'rgba(201,212,234,.6)', 1.4, [4, 3]); P.line(R.map(r => [r.x, r.T]), '#FF8A6A', 2.6); P.line(R.map(r => [r.x, r.Td]), '#7CF0B0', 2.2); const r = rainAt(R, S.px); P.dot(S.px, r.T, 5, '#FF8A6A', '#FFFFFF'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'deserts') {
      const a = [], gnd = [], top = [];
      for (let h = 0; h <= 24; h += 0.25) { a.push([h, valleyAir(p, DV.floor, h)]); gnd.push([h, groundT(p, h)]); top.push([h, valleyAir(p, DV.telescope, h)]); }
      const Kk = K.plotKey(g, [{ c: '#FF5A4A', label: 'the ground' }, { c: '#FF8A6A', label: 'air at Badwater' }, { c: '#8FC8FF', label: 'air at Telescope Peak' }], MONTHS[p.dmonth]);
      const P = g.Plot({ xmin: 0, xmax: 24, ymin: -5, ymax: Math.max(60, Math.ceil(Math.max(...gnd.map(q => q[1])) / 10) * 10 + 5), pad: { t: Kk.t }, xlabel: 'hour of the day', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(gnd, '#FF5A4A', 2.4); P.line(a, '#FF8A6A', 2.4); P.line(top, '#8FC8FF', 2.2); P.hline(56.7, 'rgba(255,214,107,.5)', [4, 3]); P.tag(0.5, 56.7, 'air record 56.7 °C (1913)', '#FFD27A', 'left', -8); P.vline(S.hr, 'rgba(255,255,255,.4)', [2, 3]); });
      Kk.draw(P); return;
    }
    // pacific: how much it swings, coast to desert
    const pts = []; for (let x = 0; x <= 420; x += 4) { const v = MONTHS.map((_, k) => airT(x, k, Object.assign({}, o, { z: Math.max(0, zAt(x, o)) }))); pts.push([x, Math.max(...v) - Math.min(...v)]); }
    const Kk = K.plotKey(g, [{ c: '#FF5A4A', label: 'model: coldest to warmest month' }, { c: '#FFFFFF', dot: true, label: 'NOAA normals' }]);
    const P = g.Plot({ xmin: 0, xmax: 420, ymin: 0, ymax: 35, pad: { t: Kk.t }, xlabel: 'km from the coast', ylabel: 'annual range, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line(pts, '#FF5A4A', 2.6); ['sf', 'sac', 'dv'].forEach(k => { const N = NORMALS[k].T, r = Math.max(...N) - Math.min(...N); P.dot(STN[k].x, r, 5, '#FFFFFF', '#0B0F18'); P.tag(STN[k].x, r, STN[k].name, '#DCE6F6', 'left', -10); }); P.vline(p.dist, 'rgba(255,90,74,.5)', [3, 3]); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p, o = optsOf(p);
    if (p.setup === 'coastal') { const m = p.cmonth; return [
      { label: 'Time', value: hhmm(S.hr), unit: MONTHS[m] }, { label: 'San Francisco', value: stationDay('sf', m, S.hr, o).toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Sacramento', value: stationDay('sac', m, S.hr, o).toFixed(1), unit: '°C', flag: 'accent' },
      { label: 'Death Valley', value: stationDay('dv', m, S.hr, o).toFixed(1), unit: '°C' }, { label: 'Coastal sea', value: seaT(m, o).coast.toFixed(1), unit: '°C' }, { label: 'Land − sea', value: breeze(m, S.hr, o).toFixed(1), unit: '°C', hint: breeze(m, S.hr, o) > 1 ? 'sea breeze' : breeze(m, S.hr, o) < -1 ? 'land breeze' : 'calm' },
      { label: 'Ocean air at SF', value: (marineW(STN.sf.x, m, o) * 100).toFixed(0), unit: '%' }]; }
    if (p.setup === 'fog') { const s = sounding(p), b = fogPt(p, 'beach', S.hr), d = fogPt(p, 'downtown', S.hr), v = fogPt(p, 'valley', S.hr); return [
      { label: 'Time', value: hhmm(S.hr), unit: '' }, { label: 'Cloud base over the sea', value: fmtN(s.base * 1000), unit: 'm', flag: 'accent' }, { label: 'Cloud top (inversion)', value: fmtN(p.hinv * 1000), unit: 'm' },
      { label: 'Ocean Beach', value: b.T.toFixed(1), unit: '°C', hint: b.fog ? 'fog' : b.cloud ? 'overcast' : 'sun' }, { label: 'Downtown', value: d.T.toFixed(1), unit: '°C', hint: d.fog ? 'fog' : d.cloud ? 'overcast' : 'sun' }, { label: 'Walnut Creek', value: v.T.toFixed(1), unit: '°C', hint: v.cloud ? 'cloud' : 'sun' },
      { label: 'Golden Gate towers', value: p.hinv < 0.227 && s.base < p.hinv ? 'above the fog' : s.base >= p.hinv ? 'clear' : 'in the fog', unit: '' }]; }
    if (p.setup === 'rainshadow') { const R = parcelOf(stormOf(p), o), r = rainAt(R, S.px), bl = rainAt(R, STN.blue.x), bi = rainAt(R, STN.bishop.x); return [
      { label: 'Parcel at', value: fmtN(S.px), unit: 'km' }, { label: 'Its height', value: fmtN(r.z * 1000), unit: 'm' }, { label: 'Its temperature', value: r.T.toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Dew point', value: r.Td.toFixed(1), unit: '°C' },
      { label: 'Rain here', value: r.rate.toFixed(1), unit: 'mm/h' }, { label: 'Blue Canyon a year', value: fmtN(bl.year), unit: 'mm', flag: 'accent' }, { label: 'Bishop a year', value: fmtN(bi.year), unit: 'mm', flag: 'accent' }, { label: 'Lee warming at Bishop', value: (bi.T - (p.T0 - 6.5 * STN.bishop.z)).toFixed(1), unit: '°C' }]; }
    if (p.setup === 'deserts') return [
      { label: 'Time', value: hhmm(S.hr), unit: MONTHS[p.dmonth] }, { label: 'Badwater air', value: valleyAir(p, DV.floor, S.hr).toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Telescope Peak air', value: valleyAir(p, DV.telescope, S.hr).toFixed(1), unit: '°C' },
      { label: 'Difference / 3.45 km', value: ((valleyAir(p, DV.floor, S.hr) - valleyAir(p, DV.telescope, S.hr)) / 3.454).toFixed(1), unit: '°C/km' }, { label: 'Ground', value: groundT(p, S.hr).toFixed(1), unit: '°C', flag: 'accent' },
      { label: 'Mixed layer top', value: fmtN((DV.furnace + daySun(S.hr) * p.zi) * 1000), unit: 'm' }, { label: 'Rain a year', value: fmtN(rainAt(parcelOf({}, {}), STN.dv.x).year), unit: 'mm' }];
    if (p.setup === 'pacific') { const A = probeAnnual(p), m = monI(S); return [
      { label: 'Month', value: MONTHS[m], unit: '' }, { label: 'Offshore sea', value: seaT(m, o).off.toFixed(1), unit: '°C' }, { label: 'Heat per m² per °C', value: (4.18 * p.mixed).toFixed(0), unit: 'MJ' },
      { label: 'Thermometer at', value: fmtN(p.dist), unit: 'km' }, { label: 'Its yearly swing', value: A.range.toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Its warmest month', value: MONTHS[A.warmest], unit: '' }]; }
    const m = monI(S); return [{ label: 'Month', value: MONTHS[m], unit: '' }].concat(['sf', 'sac', 'dv'].map(k => ({ label: STN[k].name, value: stationT(k, m, o).toFixed(1), unit: '°C', hint: 'record ' + NORMALS[k].T[m] }))).concat(['sf', 'sac', 'dv'].map(k => { const N = NORMALS[k].T; let e = 0; MONTHS.forEach((_, j) => { e += Math.pow(stationT(k, j, o) - N[j], 2); }); return { label: STN[k].name + ' error', value: Math.sqrt(e / 12).toFixed(1), unit: '°C rms' }; }));
  }
  function equation(S) {
    const p = S.p, o = optsOf(p);
    if (p.setup === 'coastal') { const m = p.cmonth, w = marineW(STN.sf.x, m, o); return '<i>T</i><sub>SF</sub> = <i>w</i> <i>T</i><sub>sea air</sub> + (1 − <i>w</i>) <i>T</i><sub>land</sub> = ' + w.toFixed(2) + ' × ' + (seaT(m, o).coast + 0.5).toFixed(1) + ' + ' + (1 - w).toFixed(2) + ' × ' + landT(STN.sf.x, STN.sf.z, m).toFixed(1) + ' = <b>' + stationT('sf', m, o).toFixed(1) + ' °C</b> (month mean)'; }
    if (p.setup === 'fog') { const b = 125 * (p.sst + 0.5 - p.td); return 'cloud base = 125 m × (<i>T</i> − <i>T</i><sub>d</sub>) = 125 × (' + (p.sst + 0.5).toFixed(1) + ' − ' + p.td + ') = <b>' + (b <= 0 ? '0 m: fog' : fmtN(b) + ' m') + '</b> · cloud top = the inversion, <b>' + fmtN(p.hinv * 1000) + ' m</b>'; }
    if (p.setup === 'rainshadow') { const R = parcelOf(stormOf(p), o), c = rainAt(R, 292), bi = rainAt(R, STN.bishop.x); return 'down the lee: <i>T</i> = <i>T</i><sub>crest</sub> + 9.8 °C/km × Δ<i>z</i> = ' + c.T.toFixed(1) + ' + 9.8 × ' + (c.z - bi.z).toFixed(2) + ' km (less the cloud that evaporates) → <b>' + bi.T.toFixed(1) + ' °C</b> at Bishop'; }
    if (p.setup === 'deserts') return '<i>T</i><sub>Badwater</sub> = <i>T</i><sub>peak</sub> + 9.8 °C/km × (3.368 + 0.086) km = ' + valleyAir(p, DV.telescope, S.hr).toFixed(1) + ' + ' + (valleyAir(p, DV.floor, S.hr) - valleyAir(p, DV.telescope, S.hr)).toFixed(1) + ' = <b>' + valleyAir(p, DV.floor, S.hr).toFixed(1) + ' °C</b>';
    if (p.setup === 'pacific') return '<i>C</i> = ρ<i>c</i><i>h</i> = 4.18 MJ/m³K × ' + p.mixed + ' m = <b>' + (4.18 * p.mixed).toFixed(0) + ' MJ/m²K</b>; to warm it 1 °C with a 100 W/m² surplus takes <b>' + (4.18e6 * p.mixed / 100 / 86400).toFixed(0) + ' days</b>';
    const m = monI(S); return 'model <b>' + stationT('dv', m, o).toFixed(1) + ' °C</b> against the record ' + NORMALS.dv.T[m] + ' °C in Death Valley; <b>' + stationT('sf', m, o).toFixed(1) + ' °C</b> against ' + NORMALS.sf.T[m] + ' °C in San Francisco, ' + MONTHS[m];
  }
  const EQ_NOTE = S => ({
    coastal: '<b>The model:</b> each month the land and the sea settle under the season’s sunshine with their own heat capacity (a linear energy balance); the air at a place is a mix of sea air and land air, the share of sea air falling off inland over a reach that grows with the land–sea contrast (the sea breeze). The land response is fitted to Death Valley, the valley’s evaporation to Sacramento and the sea-breeze reach to San Francisco.',
    fog: '<b>The marine layer</b> is air cooled from below by the cold upwelled sea, capped by the warm, dry air sinking in the Pacific High. Cloud forms where the air reaches its dew point (Espy’s 125 m per degree); it can only reach inland where the ground is lower than its top — a flood fill through the Golden Gate. Sun on the land under thin cloud warms it until the base rises above the top and the fog burns off.',
    rainshadow: '<b>A parcel model.</b> The storm air is lifted over the ground (smoothed: it starts rising before the slope), dry until saturated, then on the moist adiabat; a share ε of what it condenses falls, drifting downwind. Sinking on the lee it warms dry, after any cloud left has evaporated, and east of the crest mixes with the dry air of the Great Basin high. The storm hours, background rain and drift are fitted to the five stations’ annual totals.',
    deserts: '<b>Death Valley</b> is dry because the Coast Ranges, the Sierra Nevada and the Panamints wring the storms out first, and because it lies under the sinking air of the subtropical high. In the afternoon the hot ground stirs the air on a dry adiabat, so the lowest place is the hottest — every km lower is 9.8 °C warmer.',
    pacific: '<b>Heat capacity.</b> The ocean’s mixed layer stores about 4 MJ per m² per °C for every metre — 50 m is 200 MJ, a thin layer of land only a few. The same seasonal sunshine swings the sea a couple of degrees, two months late; the land swings ten times as much, almost at once.',
    together: '<b>The whole machine</b>, month by month, against the NOAA 1991–2020 normals (rounded). Three numbers were fitted (Death Valley’s land response, Sacramento’s evaporation, San Francisco’s sea-breeze reach); San Francisco’s September peak and every what-if follow from the physics.'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = (...v) => S => v.includes(S.p.setup);
  const MOPTS = MONTHS.map((m, i) => ({ value: i, label: m }));
  L.register({
    id: 'g6d-california',
    grade: 6, unit: '6D', topics: ['D6'],
    subject: 'earth',
    name: 'California’s Weather Machine',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-6', 'CAST'],
    weight: 'Core',
    is3D: true,
    stageHint: 'Drag to look around · heights are stretched ×16 (×6 in the Bay Area, ×3 in Death Valley) · in the Pacific set-up, drag the red thermometer',
    autoplay: true,
    lede: 'Within 400 km, California has some of the coolest summers and the hottest place on Earth. Follow one line from the open <b>Pacific</b> through <b>San Francisco</b>, the Coast Ranges, <b>Sacramento</b> in the Central Valley, over the <b>Sierra Nevada</b> to <b>Bishop</b> and down into <b>Death Valley</b>. ' +
      'Watch a July sea breeze, the <b>fog</b> pouring through the Golden Gate under its inversion, a winter storm wrung out over the mountains into a <b>rain shadow</b>, the afternoon air of Death Valley, the ocean’s slow seasons — and then test the whole model against the climate records, or take the Pacific away.',

    params: preset({}),
    presets: [
      { name: 'A July day, coast to desert', params: preset({}) },
      { name: 'A January day', params: preset({ cmonth: 0 }) },
      { name: 'July with no upwelling', params: preset({ cUpw: 0 }) },
      { name: 'A foggy July morning', params: preset({ setup: 'fog' }) },
      { name: 'A deep marine layer: fog inland', params: preset({ setup: 'fog', hinv: 0.8, valley: 30 }) },
      { name: 'A shallow layer: the towers poke out', params: preset({ setup: 'fog', hinv: 0.18 }) },
      { name: 'Warm sea, no fog', params: preset({ setup: 'fog', sst: 16 }) },
      { name: 'A winter storm over the Sierra', params: preset({ setup: 'rainshadow' }) },
      { name: 'An atmospheric river: warm, wet, fast', params: preset({ setup: 'rainshadow', T0: 14, rh: 98, wind: 25 }) },
      { name: 'Flatten the Sierra', params: preset({ setup: 'rainshadow', sierra: 0.2 }) },
      { name: 'Efficient rain: a strong foehn', params: preset({ setup: 'rainshadow', eps: 1 }) },
      { name: 'Death Valley in July', params: preset({ setup: 'deserts' }) },
      { name: 'Black rock, no wind', params: preset({ setup: 'deserts', surface: 'basalt', dwind: 0 }) },
      { name: 'Death Valley in January', params: preset({ setup: 'deserts', dmonth: 0 }) },
      { name: 'The Pacific’s seasons', params: preset({ setup: 'pacific' }) },
      { name: 'Thermometer in Sacramento', params: preset({ setup: 'pacific', dist: 125 }) },
      { name: 'A thin ocean layer', params: preset({ setup: 'pacific', mixed: 10 }) },
      { name: 'Take the Pacific away', params: preset({ setup: 'pacific', pOcean: false }) },
      { name: 'Model against the records', params: preset({ setup: 'together' }) },
      { name: 'Run the year', params: preset({ setup: 'together', tLapse: 1 }) },
      { name: 'What if there were no Pacific?', params: preset({ setup: 'together', tOcean: false }) },
      { name: 'What if there were no Sierra?', params: preset({ setup: 'together', tSierra: 0.1 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The day', when: is('coastal'), items: [
        { key: 'cmonth', type: 'select', label: 'Month', restructure: true, options: MOPTS },
        { key: 'cStart', label: 'Start at', min: 0, max: 23, step: 1, unit: 'h', restructure: true },
        { key: 'cUpw', label: 'Upwelling cools the coast by', min: 0, max: 5, step: 0.5, unit: '°C', restructure: false },
        { key: 'cLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.5, label: '30 min a second' }, { value: 1, label: 'an hour a second' }, { value: 2, label: '2 hours a second' }] } ] },
      { group: 'The marine layer', when: is('fog'), items: [
        { key: 'sst', label: 'Upwelled sea', min: 9, max: 18, step: 0.5, unit: '°C', restructure: false },
        { key: 'td', label: 'Dew point of the ocean air', min: 6, max: 16, step: 0.5, unit: '°C', restructure: false },
        { key: 'hinv', label: 'Inversion height', min: 0.1, max: 1.2, step: 0.05, unit: 'km', restructure: false },
        { key: 'dinv', label: 'Inversion strength', min: 2, max: 16, step: 1, unit: '°C', restructure: false },
        { key: 'valley', label: 'Inland afternoon', min: 22, max: 42, step: 1, unit: '°C', restructure: false },
        { key: 'fStart', label: 'Start at', min: 0, max: 23, step: 1, unit: 'h', restructure: true },
        { key: 'fLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.5, label: '30 min a second' }, { value: 1, label: 'an hour a second' }, { value: 2, label: '2 hours a second' }] } ] },
      { group: 'The storm', when: is('rainshadow'), items: [
        { key: 'T0', label: 'Air at the coast', min: 4, max: 18, step: 0.5, unit: '°C', restructure: false },
        { key: 'rh', label: 'Its humidity', min: 50, max: 100, step: 1, unit: '%', restructure: false },
        { key: 'wind', label: 'Wind', min: 5, max: 30, step: 1, unit: 'm/s', restructure: false },
        { key: 'eps', label: 'Share of the cloud that rains out', min: 0.2, max: 1, step: 0.05, unit: '', restructure: false },
        { key: 'sierra', label: 'Sierra Nevada height', min: 0.1, max: 1.5, step: 0.1, unit: '×', restructure: false },
        { key: 'coast', label: 'Coast Ranges height', min: 0, max: 2, step: 0.1, unit: '×', restructure: false },
        { key: 'rLapse', type: 'select', label: 'Parcel speed', restructure: false, options: [{ value: 20, label: 'slow' }, { value: 40, label: 'medium' }, { value: 80, label: 'fast' }] } ] },
      { group: 'Death Valley', when: is('deserts'), items: [
        { key: 'dmonth', type: 'select', label: 'Month', restructure: true, options: MOPTS },
        { key: 'surface', type: 'select', label: 'Ground', restructure: false, options: Object.keys(SURF).map(k => ({ value: k, label: SURF[k].name + ' (reflects ' + (SURF[k].a * 100).toFixed(0) + ' %)' })) },
        { key: 'dwind', label: 'Wind', min: 0, max: 8, step: 0.5, unit: 'm/s', restructure: false },
        { key: 'zi', label: 'Mixed layer grows to', min: 1, max: 5, step: 0.25, unit: 'km', restructure: false },
        { key: 'sink', label: 'Extra warming by sinking air', min: 0, max: 4, step: 0.5, unit: '°C', restructure: false },
        { key: 'dStart', label: 'Start at', min: 0, max: 23, step: 1, unit: 'h', restructure: true },
        { key: 'dLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.5, label: '30 min a second' }, { value: 1, label: 'an hour a second' }, { value: 2, label: '2 hours a second' }] } ] },
      { group: 'Ocean and land', when: is('pacific'), items: [
        { key: 'mixed', label: 'Ocean mixed layer', min: 5, max: 200, step: 5, unit: 'm', restructure: false },
        { key: 'dist', label: 'Thermometer inland', min: 0, max: 420, step: 5, unit: 'km', restructure: false },
        { key: 'pOcean', type: 'toggle', label: 'The Pacific', restructure: false },
        { key: 'pmonth', type: 'select', label: 'Start in', restructure: true, options: MOPTS },
        { key: 'pLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0, label: 'paused' }, { value: 0.5, label: 'a month in 2 s' }, { value: 1, label: 'a month a second' }] } ] },
      { group: 'The machine', when: is('together'), items: [
        { key: 'tmonth', type: 'select', label: 'Month', restructure: true, options: MOPTS },
        { key: 'tOcean', type: 'toggle', label: 'The Pacific', restructure: false },
        { key: 'tSierra', label: 'Sierra Nevada height', min: 0.1, max: 1.5, step: 0.1, unit: '×', restructure: false },
        { key: 'tUpw', label: 'Upwelling', min: 0, max: 5, step: 0.5, unit: '°C', restructure: false },
        { key: 'tLapse', type: 'select', label: 'Run the year', restructure: false, options: [{ value: 0, label: 'paused' }, { value: 0.5, label: 'a month in 2 s' }, { value: 1, label: 'a month a second' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ coastal: 'Temperature along the line, now', fog: 'Through the day: fog and sun', rainshadow: 'A year’s rain along the line', deserts: 'The air from Badwater up', pacific: 'The year: sea, land and the thermometer', together: 'A year’s rain: model and records' })[S.p.setup], draw: plot1 },
      { title: S => ({ coastal: 'Coast, valley and desert through the day', fog: 'The sounding over the coast', rainshadow: 'The parcel crossing the ranges', deserts: 'Ground and air through the day', pacific: 'How much the year swings, coast to desert', together: 'Monthly temperature: model and records' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'Espy’s rule · the marine layer', params: preset({ setup: 'fog', sst: 11.5, td: 10 }),
        q: 'Air over the upwelled water off San Francisco is 12.0 °C with a dew point of 10.0 °C. Lifted, its cloud base is about 125 m for each degree between them. How high is the base of the stratus?',
        predict: { label: 'Cloud base', unit: 'm', tol: 0.02 },
        measure: S => 125 * (S.p.sst + 0.5 - S.p.td),
        working: '125 × (12.0 − 10.0) = <b>250 m</b> — below the inversion at 450 m, so a 200 m deck of stratus. With the dew point at 12 °C the base is the sea itself: fog.' },
      { source: 'The foehn · down the lee of the Sierra', params: preset({ setup: 'rainshadow' }),
        q: 'Having rained out its water, air leaves the Sierra crest at 2,800 m at −6 °C and sinks, without cloud, to Bishop at 1,260 m. Sinking dry air warms 9.8 °C every km. How warm is it at Bishop?',
        predict: { label: 'At Bishop', unit: '°C', tol: 0.03 },
        measure: () => -6 + 9.8 * (2.8 - 1.26),
        working: '−6 + 9.8 × 1.54 = <b>9.1 °C</b> — warmer and much drier than the same air was at that height on the windward side, where it cooled only about 5.5 °C a km in cloud.' },
      { source: 'This model · the rain shadow', params: preset({ setup: 'rainshadow' }),
        q: 'In the storm model, how many times more rain falls in a year at Blue Canyon, on the Sierra’s windward slope, than at Bishop in its lee?',
        predict: { label: 'Times more', unit: '×', tol: 0.05 },
        measure: S => { const R = parcelOf(stormOf(S.p), optsOf(S.p)); return rainAt(R, STN.blue.x).year / rainAt(R, STN.bishop.x).year; },
        working: 'About 1,770 mm against 134 mm: <b>13</b> times. The records say about 1,720 and 130 mm — 13 times too.' },
      { source: 'Death Valley · the dry adiabat', params: preset({ setup: 'deserts' }),
        q: 'On a July afternoon the air over Death Valley is stirred on a dry adiabat (9.8 °C per km). It is 13 °C on Telescope Peak, 3,368 m up. How hot is it at Badwater, 86 m below sea level?',
        predict: { label: 'At Badwater', unit: '°C', tol: 0.02 },
        measure: () => 13 + 9.8 * (DV.telescope - DV.floor),
        working: '13 + 9.8 × 3.454 = <b>46.8 °C</b>: the lowest place is the hottest. The normal July afternoon at Furnace Creek is about 47 °C.' },
      { source: 'Heat capacity · the ocean’s mixed layer', params: preset({ setup: 'pacific', mixed: 50 }),
        q: 'Sea water stores 4.18 MJ per m³ per °C. With a 100 W/m² summer surplus, how many days does it take to warm a 50 m mixed layer by 2 °C?',
        predict: { label: 'Time', unit: 'days', tol: 0.03 },
        measure: S => 4.18e6 * S.p.mixed * 2 / 100 / 86400,
        working: '4.18×10⁶ × 50 × 2 = 4.18×10⁸ J per m², ÷ 100 W/m² = 4.18×10⁶ s = <b>48 days</b>. A few cm of soil warm as much in an afternoon.' },
      { source: 'This model against NOAA 1991–2020 normals', params: preset({ setup: 'together' }),
        q: 'What does the model give for Death Valley’s mean July temperature? (The record says 39.2 °C.)',
        predict: { label: 'Death Valley, July', unit: '°C', tol: 0.02 },
        measure: S => stationT('dv', 6, optsOf(S.p)),
        working: 'The model gives <b>38.7 °C</b>, half a degree under the record: the land’s response was fitted to Death Valley over the whole year.' },
      { source: 'This model · ocean moderation', params: preset({ setup: 'together' }),
        q: 'In the model, how much warmer is San Francisco’s warmest month than its coldest? (The records: 17.6 − 10.8 = 6.8 °C.)',
        predict: { label: 'Annual range', unit: '°C', tol: 0.03 },
        measure: S => annual('sf', optsOf(S.p)).range,
        working: 'The model gives <b>7.1 °C</b>, and its warmest month is September, as in the records — the sea is warmest late and the summer sea breeze holds July down. Sacramento swings 16 °C, Death Valley 28.' },
      { source: 'This model · a July afternoon', params: preset({}),
        q: 'At 3 pm in July, how hot does the model make Sacramento? (The normal July high is 34.2 °C.)',
        predict: { label: 'Sacramento, 3 pm', unit: '°C', tol: 0.03 },
        measure: S => stationDay('sac', 6, 15, optsOf(S.p)),
        working: 'The model gives <b>33.7 °C</b>; San Francisco, 120 km away, about 18.5 °C — the sea breeze keeps the coast near the ocean’s temperature.' }
    ],

    walkthrough: [
      { title: 'One day, three climates', ask: 'It is 3 pm in July. Compare San Francisco, Sacramento and Death Valley.', reveal: 'About 18, 34 and 46 °C. The cold sea and its breeze hold the coast down; the valley bakes; the desert, below sea level and behind two ranges, bakes most.', params: preset({ cStart: 15, cLapse: 0.5 }) },
      { title: 'Why is the sea so cold?', ask: 'Set upwelling to 0. What happens to San Francisco’s summer?', reveal: 'It warms. Northwesterly winds along the coast push surface water offshore, and cold water rises from below — upwelling — strongest in spring and early summer.', params: preset({ cUpw: 0, cStart: 15, cLapse: 0.5 }) },
      { title: 'Where does fog come from?', ask: 'The sea is 11.5 °C and the ocean air’s dew point 12.5 °C. What happens to the air?', reveal: 'Cooled over the cold water to below its dew point, it condenses into fog at the surface. The inversion above stops it rising, so it spreads as a flat layer.', params: preset({ setup: 'fog' }) },
      { title: 'Through the Golden Gate', ask: 'Run the morning. Where does the fog stay, and where does it burn off?', reveal: 'It stays on the coast, fed by the sea; inland the sun heats the ground under thin cloud until the base rises above the inversion and it clears. The hills higher than the inversion stay sunny all day.', params: preset({ setup: 'fog', fLapse: 1 }) },
      { title: 'Climbing the Sierra', ask: 'Follow the parcel. Where does it start to rain?', reveal: 'Where it cools to its dew point: from then on it climbs on the moist adiabat, cooling only about 5–6 °C a km, and rains on the slopes — Blue Canyon gets about 1,700 mm a year.', params: preset({ setup: 'rainshadow', rLapse: 20 }) },
      { title: 'The rain shadow', ask: 'What is the parcel like when it reaches Bishop?', reveal: 'Dry and warm: it lost its water on the way up and warmed 9.8 °C a km on the way down. Bishop gets about 130 mm a year — a desert.', params: preset({ setup: 'rainshadow' }) },
      { title: 'Death Valley', ask: 'Why is the lowest place the hottest?', reveal: 'In the afternoon the hot ground stirs the air up to 4 km on a dry adiabat: every km lower is 9.8 °C warmer. Badwater is 3.45 km below Telescope Peak — about 34 °C hotter.', params: preset({ setup: 'deserts', dStart: 14, dLapse: 0.5 }) },
      { title: 'The ocean’s slow seasons', ask: 'Drag the thermometer from the coast to Death Valley. How does its year change?', reveal: 'Its yearly swing grows from about 7 °C to 28 °C, and its warmest month moves from September to July. The ocean stores heat and gives it back late.', params: preset({ setup: 'pacific', dist: 200 }) },
      { title: 'Take the Pacific away', ask: 'Switch the Pacific off. What happens to San Francisco?', reveal: 'Its summers grow hot and its winters colder: without the sea, San Francisco would have a valley climate. Its rain would vanish too.', params: preset({ setup: 'together', tOcean: false }) }
    ],

    quiz: [
      { q: 'San Francisco’s summers are cool mainly because', options: ['the cold, upwelled Pacific and the sea breeze keep its air near the ocean’s temperature', 'it is far north', 'it is high up', 'the Sun is weaker on the coast'], answer: 0, why: 'Sacramento, at the same latitude 120 km inland, is 15 °C hotter on a July afternoon.' },
      { q: 'Coastal fog forms when', options: ['moist ocean air is cooled over cold water to its dew point', 'warm air rises over mountains', 'the Sun heats the sea', 'dry air sinks'], answer: 0, why: 'Cold upwelled water cools the air from below; an inversion above traps it in a flat layer.' },
      { q: 'The east side of the Sierra Nevada is dry because', options: ['air loses its water rising over the mountains and warms as it sinks on the far side', 'it is too high for rain', 'it is far from the sun', 'the wind blows from the east'], answer: 0, why: 'A rain shadow: rain on the windward slopes, dry, warm, sinking air in the lee.' },
      { q: 'Death Valley is the hottest place in North America partly because', options: ['it is low: afternoon air warms 9.8 °C for every km it is lower', 'it is closest to the equator', 'it is near the ocean', 'its ground is wet'], answer: 0, why: 'It also lies behind several ranges and under the sinking air of the subtropical high.' },
      { q: 'Compared with inland places, a coastal city has', options: ['smaller yearly and daily temperature swings, and its warmest month later', 'bigger swings', 'the same swings', 'hotter summers and colder winters'], answer: 0, why: 'The ocean’s large heat capacity stores and slowly releases heat.' },
      { q: 'Which place gets the most rain in a year?', options: ['Blue Canyon, on the Sierra’s western slope', 'Sacramento', 'Bishop', 'Death Valley'], answer: 0, why: 'About 1,700 mm: the storms are lifted over the mountains there.' }
    ],

    notes: '<p><b>Coast and inland.</b> The cold California Current and upwelling keep the coast cool in summer and mild in winter; inland, the Central Valley has hot, dry summers and cool winters; the deserts have the hottest summers in North America.</p>' +
      '<p><b>The marine layer.</b> Moist ocean air cooled over cold water forms fog and low stratus, capped by an inversion — warm, dry air sinking in the Pacific High. The layer flows inland through gaps like the Golden Gate and burns off in the morning sun.</p>' +
      '<p><b>The rain shadow.</b> Storms from the Pacific rise over the Coast Ranges and the Sierra Nevada, cool and rain on the western slopes; the air sinks and warms on the east side, leaving the Owens Valley and the Great Basin dry.</p>' +
      '<p><b>The deserts</b> (Mojave, Colorado, the Great Basin) are dry because of rain shadows and the sinking air of the subtropical high; low basins like Death Valley are the hottest.</p>' +
      '<p><b>The Pacific</b> moderates the climate: water stores far more heat than land, so coastal places have smaller seasonal swings and later seasons.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “San Francisco is cool because it is far north.” Sacramento, at nearly the same latitude, is 15 °C hotter on a July afternoon; it is the cold sea and the sea breeze. And “mountains are dry on both sides” — the windward side is the wettest place in the state.</div>'
  });

  L.models = L.models || {};
  L.models["g6d-california"] = { es, qsOf, dewOf, moistLapse, dailyInsolation, MONTHS, PROF, zAt, STN, NORMALS, SEA, LANDP, CAL, seaT, landT, marineW, airT, stationT, annual, upwelling, CYC, STORM, parcelRun, parcelOf, rainAt, RANGE, dayT, stationDay, breeze, BAY, bayZ, BAYPTS, FOG, reach, fogAt, fogPt, sounding, daySun, DV, SURF, valleyAir, groundT, elevAt, beam };
})(window.InsightLab);
