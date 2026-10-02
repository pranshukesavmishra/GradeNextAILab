/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-4  Air Masses and Fronts
   (D4.1 Air masses and source regions; D4.2 High- and low-pressure
    systems; D4.3 Cold fronts; D4.4 Warm fronts; D4.5 Occluded and
    stationary fronts; D4.6 Collecting data to track a front)

     masses   — North America's air masses at their sources (Bergeron's
                classes, by season), sent along real paths over land, sea
                and the Great Lakes; the surface warms or cools them and
                water moistens them. Cold air over a warm lake grows the
                lake-effect snow (the 13 °C rule).
     highs    — a pressure map with a high and a low you can drag: the
                wind is the geostrophic balance of the pressure gradient
                and the Coriolis force, turned toward the low by friction;
                in flows into lows (clouds, rain) and out of highs (clear).
                Change the hemisphere and the spin reverses.
     cold, warm, occluded/stationary — a vertical section through a front,
                its slope from Margules' formula, the warm air lifted to its
                condensation level (Espy: 125 m a degree of dew-point
                depression), stable layers or towering cumulonimbus by the
                warm air's lapse rate, and rain from the moisture the lift
                condenses.
     track    — three stations in a line; the front passes each; time its
                arrivals in the records and find its speed.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.EARTH, GEO, G6D and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));
  function dewOf(e) { if (e <= 1) return -80; let lo = -80, hi = 60; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (es(m) > e) hi = m; else lo = m; } return (lo + hi) / 2; }
  const qOf = (Td, P) => 0.622 * es(Td) / (P - 0.378 * es(Td));          // kg/kg
  const G = 9.81, OMEGA = 7.2921e-5;

  /* ============================================================
     AIR MASSES — source properties at the surface (Ahrens, Meteorology Today; NWS)
     ============================================================ */
  const MASSES = {
    cA: { name: 'continental arctic', at: [72, -110], winter: [-38, -43], summer: [2, -4], col: '#B8D8FF' },
    cP: { name: 'continental polar', at: [58, -100], winter: [-18, -24], summer: [14, 6], col: '#7FB0F0' },
    mP: { name: 'maritime polar', at: [52, -150], winter: [5, 2], summer: [12, 9], col: '#7FE0D0' },
    mT: { name: 'maritime tropical', at: [24, -90], winter: [21, 18], summer: [28, 24], col: '#FF9A7A' },
    cT: { name: 'continental tropical', at: [29, -108], winter: [16, -2], summer: [35, 4], col: '#F0C070' }
  };
  /* paths: waypoints [lat, lon, surface]; the surface's temperature by season */
  const SURF = { snow: { winter: -18, summer: 12, water: false }, prairie: { winter: -6, summer: 24, water: false }, gulf: { winter: 22, summer: 29, water: true },
    lakes: { winter: 4, summer: 18, water: true }, pacific: { winter: 10, summer: 15, water: true }, desert: { winter: 12, summer: 38, water: false }, mountains: { winter: -10, summer: 8, water: false, high: true }, plains: { winter: -2, summer: 26, water: false } };
  const PATHS = {
    lakes: { name: 'cP over the Great Lakes', mass: 'cP', pts: [[54, -98, 'snow'], [48, -92, 'prairie'], [47.5, -88, 'lakes'], [45, -83, 'lakes'], [43.5, -79, 'lakes'], [42.5, -75, 'plains']] },
    gulf: { name: 'cP down to the Gulf', mass: 'cP', pts: [[55, -102, 'snow'], [48, -100, 'prairie'], [40, -98, 'plains'], [32, -96, 'plains'], [27, -94, 'gulf'], [23, -92, 'gulf']] },
    mtnorth: { name: 'mT north into the Midwest', mass: 'mT', pts: [[24, -90, 'gulf'], [29, -92, 'gulf'], [33, -92, 'plains'], [38, -90, 'plains'], [43, -88, 'plains'], [47, -86, 'lakes']] },
    mprockies: { name: 'mP over the Rockies', mass: 'mP', pts: [[46, -140, 'pacific'], [47, -125, 'pacific'], [46, -118, 'mountains'], [44, -112, 'mountains'], [42, -104, 'plains'], [40, -96, 'plains']] },
    arctic: { name: 'a cA outbreak', mass: 'cA', pts: [[72, -110, 'snow'], [62, -105, 'snow'], [52, -100, 'snow'], [45, -97, 'plains'], [38, -95, 'plains'], [32, -95, 'plains']] }
  };
  const kmBetween = (a, b) => { const r = Math.PI / 180, d = Math.acos(clamp(Math.sin(a[0] * r) * Math.sin(b[0] * r) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.cos((a[1] - b[1]) * r), -1, 1)); return 6371 * d; };
  function pathLen(path) { let s = 0; const segs = []; for (let i = 0; i < path.pts.length - 1; i++) { const l = kmBetween(path.pts[i], path.pts[i + 1]); segs.push({ s0: s, l, a: path.pts[i], b: path.pts[i + 1] }); s += l; } return { total: s, segs }; }
  function pathAt(path, s) {
    const P = pathLen(path);
    for (const g of P.segs) if (s <= g.s0 + g.l || g === P.segs[P.segs.length - 1]) { const u = clamp((s - g.s0) / g.l, 0, 1); return { lat: g.a[0] + (g.b[0] - g.a[0]) * u, lon: g.a[1] + (g.b[1] - g.a[1]) * u, surf: u < 0.5 ? g.a[2] : g.b[2] }; }
    return { lat: path.pts[0][0], lon: path.pts[0][1], surf: path.pts[0][2] };
  }
  /* the air mass's lowest kilometre travelling at speed U: warmed from below fast (it overturns), cooled from below slowly
     (it goes stable); water evaporates into it toward 80 % of the surface's saturation */
  const TAU_H = { warming: 0.6, cooling: 2.5, moisten: 1.0, mountains: 0.4 };   // days
  function airStart(p) { const M = MASSES[PATHS[p.path].mass][p.season]; return { s: 0, T: M[0], Td: M[1], snow: 0, t: 0, lake: 0, Tin: null }; }
  function airStep(A, p, dtDays) {
    const path = PATHS[p.path], total = pathLen(path).total;
    const n = Math.max(1, Math.ceil(dtDays / 0.02)), h = dtDays / n;
    for (let k = 0; k < n; k++) {
      if (A.s >= total) break;
      const here = pathAt(path, A.s), Sf = SURF[here.surf], Ts = Sf[p.season];
      const tau = Sf.high ? TAU_H.mountains : Ts > A.T ? TAU_H.warming : TAU_H.cooling;
      A.T += (Ts - A.T) * (1 - Math.exp(-h / tau));
      let q = qOf(A.Td, 100000);
      if (Sf.water) { const qs = 0.8 * qOf(Ts, 100000); if (qs > q) q += (qs - q) * (1 - Math.exp(-h / TAU_H.moisten)); }
      if (Sf.high) q *= Math.exp(-h / 1.2);                         // forced up the slopes, it rains out its water
      const qmax = qOf(A.T, 100000); if (q > qmax) q = qmax;
      A.Td = dewOf(q * 100000 / (0.622 + 0.378 * q));
      /* lake-effect snow: forecasters compare the lake with the air at 850 hPa, about 1.5 km up — taken here as the air that
         reached the shore, 8 °C colder aloft. 13 °C or more and the lake drives snow bands downwind (NWS rule of thumb). */
      if (here.surf === 'lakes') { if (A.Tin == null) A.Tin = A.T; const d = Ts - (A.Tin - 8); A.lake = d; if (d >= 13) A.snow += 0.15 * (d - 13) * h * 24; }
      A.s += p.speed * 3.6 * 24 * h; A.t += h;
    }
    return A;
  }

  /* ============================================================
     HIGHS AND LOWS — geostrophic wind turned by friction
     ============================================================ */
  const RHO = 1.2;
  function fieldOf(p) { return [{ x: p.lx, y: p.ly, A: p.low - 1013, R: 700 }, { x: p.hx, y: p.hy, A: p.high - 1013, R: 900 }]; }
  function pressureAt(p, x, y) { let P = 1013; fieldOf(p).forEach(c => { P += c.A * Math.exp(-(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2)) / (c.R * c.R)); }); return P; }   // hPa; x, y in km
  function gradAt(p, x, y) { const d = 5; return [(pressureAt(p, x + d, y) - pressureAt(p, x - d, y)) / (2 * d), (pressureAt(p, x, y + d) - pressureAt(p, x, y - d)) / (2 * d)]; }   // hPa/km
  const fOf = p => 2 * OMEGA * Math.sin(p.lat * Math.PI / 180) * (p.hemi === 'south' ? -1 : 1);
  const FRICT = { ocean: { angle: 12, slow: 0.8 }, land: { angle: 32, slow: 0.55 } };
  function windAt(p, x, y) {
    const gr = gradAt(p, x, y), f = fOf(p), gx = gr[0] * 100 / 1000, gy = gr[1] * 100 / 1000;      // Pa/m
    // geostrophic: v = (1/ρf) k × ∇P  →  (−∂P/∂y, ∂P/∂x)/(ρf)
    let u = -gy / (RHO * f), v = gx / (RHO * f);
    const sp = Math.hypot(u, v); if (sp > 60) { u *= 60 / sp; v *= 60 / sp; }
    // friction turns it toward low pressure (down the gradient) and slows it
    const Fr = FRICT[p.surface], a = Fr.angle * Math.PI / 180 * Math.sign(f), ca = Math.cos(a), sa = Math.sin(a);
    return { u: (u * ca - v * sa) * Fr.slow, v: (u * sa + v * ca) * Fr.slow, ug: u, vg: v };
  }
  function divAt(p, x, y) { const d = 20, a = windAt(p, x + d, y), b = windAt(p, x - d, y), c = windAt(p, x, y + d), e = windAt(p, x, y - d); return ((a.u - b.u) + (c.v - e.v)) / (2 * d * 1000); }   // 1/s
  const geostrophic = (dPhPa, dnKm, latDeg) => dPhPa * 100 / (dnKm * 1000 * RHO * 2 * OMEGA * Math.sin(latDeg * Math.PI / 180));

  /* ============================================================
     FRONTS — a vertical section
     ============================================================ */
  /* Margules: the slope of a frontal surface in balance, tan α = (f T̄ / g) Δv / ΔT */
  function margules(p) { const f = 2 * OMEGA * Math.sin(45 * Math.PI / 180), Tbar = (p.Tw + p.Tc) / 2 + 273.15, dT = Math.max(0.5, p.Tw - p.Tc); return f * Tbar / G * p.shear / dT; }
  const LCL = (T, Td) => 125 * Math.max(0, T - Td);                 // m, Espy's rule
  const MOIST = 6.0;                                                  // K/km: a typical saturated (moist-adiabatic) lapse rate low down
  function frontOf(p) {
    const kind = p.setup === 'warm' ? 'warm' : p.setup === 'occluded' ? (p.occl === 'stationary' ? 'stationary' : 'occluded') : 'cold';
    const slope = margules(p) * (kind === 'cold' ? 1 : 1), speed = kind === 'stationary' ? 0 : p.fspeed;
    const lift = (kind === 'stationary' ? 2.5 : speed) * slope;      // m/s: the warm air climbing the frontal surface
    const base = LCL(p.Tw, p.Tdw), unstable = p.lapse > MOIST;
    const top = unstable ? 11000 : Math.min(9000, base + 4500);
    const qw = qOf(p.Tdw, 95000), qTop = qOf(p.Tdw - MOIST * (top - base) / 1000, 95000 * Math.exp(-(top) / 8000));
    const R = 3600 * 1.0 * lift * Math.max(0, qw - qTop) * (unstable ? 3 : 1);     // mm/h: the moisture the lift condenses; storm cells gather it into cores
    const width = kind === 'warm' || kind === 'stationary' ? Math.min(600, (top - base) / Math.max(1e-4, slope) / 1000) : unstable ? 40 : 120;   // km of rain
    const hours = speed > 0 ? width / (speed * 3.6) : Infinity;
    return { kind, slope, speed, lift, base, top, unstable, R, width, hours, total: isFinite(hours) ? R * hours : Infinity };
  }

  /* ============================================================
     TRACKING — three stations in a line
     ============================================================ */
  function stationRecord(p, k, t) {                                  // the record at station k (0, 1, 2) at hour t
    const x = k * p.spacing, xf = p.x0 + p.trackSpeed * t;           // km along the line; where the front is
    const d = xf - x, past = 1 / (1 + Math.exp(-d / 15));              // 0 before, 1 after
    const T = 18 - 10 * past + 1.5 * Math.sin(TAU * (t - 9) / 24), Td = 14 - 12 * past;
    const P = 1008 - 6 * Math.exp(-d * d / (2 * 120 * 120)) + 6 * past + 0.004 * Math.max(0, -d);
    const dir = 200 + 100 * past, u = 6 + 5 * Math.exp(-d * d / (2 * 60 * 60));
    const R = 8 * Math.exp(-Math.pow((d - 10) / 25, 2));
    return { T, Td, P, dir, u, R };
  }
  function arrival(p, k) { return (k * p.spacing - p.x0) / p.trackSpeed; }   // hours

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'masses', label: 'Air masses on the move', teaches: ['D4.1'] },
    { value: 'highs', label: 'Highs, lows and the wind between', teaches: ['D4.2'] },
    { value: 'cold', label: 'A cold front, in section', teaches: ['D4.3'] },
    { value: 'warm', label: 'A warm front, in section', teaches: ['D4.4'] },
    { value: 'occluded', label: 'Occluded and stationary fronts', teaches: ['D4.5'] },
    { value: 'track', label: 'Track a front from three stations', teaches: ['D4.6'] }
  ];
  const FRONT_DEF = { cold: { Tw: 18, Tdw: 15, Tc: 4, shear: 40, fspeed: 12, lapse: 7.5 }, warm: { Tw: 16, Tdw: 13, Tc: 2, shear: 25, fspeed: 7, lapse: 4.5 }, occluded: { Tw: 14, Tdw: 12, Tc: 0, shear: 25, fspeed: 7, lapse: 4.5 } };
  const BASE = {
    setup: 'masses', path: 'lakes', season: 'winter', speed: 10, mLapse: 0.25,
    lx: -650, ly: 0, hx: 750, hy: 50, low: 990, high: 1030, lat: 45, hemi: 'north', surface: 'land',
    occl: 'occluded', fLapse: 1,
    trackSpeed: 40, spacing: 300, x0: -200, tLapse: 1
  };
  /* each front keeps its own air masses: c… for the cold front, w… for the warm, o… for the occluded and stationary */
  const FPRE = { cold: 'c', warm: 'w', occluded: 'o' }, FKEYS = ['Tw', 'Tdw', 'Tc', 'shear', 'fspeed', 'lapse'];
  Object.keys(FPRE).forEach(k => FKEYS.forEach(f => { BASE[FPRE[k] + f] = FRONT_DEF[k][f]; }));
  function fp(p) { const pre = FPRE[p.setup]; if (!pre) return p; const q = Object.assign({}, p); FKEYS.forEach(f => { q[f] = p[pre + f]; }); return q; }
  const preset = o => Object.assign({}, BASE, o);
  function setup(S) {
    const p = S.p;
    Object.keys(FPRE).forEach(k => { const a = FPRE[k];
      if (p[a + 'Tdw'] > p[a + 'Tw']) p[a + 'Tdw'] = p[a + 'Tw'];             // a dew point cannot exceed the temperature
      if (p[a + 'Tc'] >= p[a + 'Tw']) p[a + 'Tc'] = p[a + 'Tw'] - 1; });      // the cold air must be colder
    S.cam = null; S.ta = 0; S.t = 0; S.hist = [];
    if (p.setup === 'masses') { S.A = airStart(p); S.hist.push([0, S.A.T, S.A.Td]); }
    if (p.setup === 'highs') { S.parts = []; const rr = rngOf(5); for (let i = 0; i < 260; i++) S.parts.push({ x: -1500 + rr() * 3000, y: -1000 + rr() * 2000, age: rr() * 40 }); }
    if (p.setup === 'track') { for (let k = 0; k < 3; k++) S.hist.push(null); S.hist = [[0].concat([0, 1, 2].map(k => stationRecord(p, k, 0).T))]; }
  }
  function rngOf(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }; }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'masses') {
      const total = pathLen(PATHS[p.path]).total;
      if (S.A.s < total) { airStep(S.A, p, dt * p.mLapse); S.hist.push([S.A.s, S.A.T, S.A.Td]); }
    } else if (p.setup === 'highs') {
      const h = dt * 3;                                               // hours of flow per second
      S.parts.forEach((q, i) => { const w = windAt(p, q.x, q.y); q.x += w.u * 3.6 * h; q.y += w.v * 3.6 * h; q.age += h; if (q.age > 40 || Math.abs(q.x) > 1700 || Math.abs(q.y) > 1150) { const rr = rngOf(i * 7 + Math.floor(S.ta * 10)); q.x = -1500 + rr() * 3000; q.y = -1000 + rr() * 2000; q.age = 0; } });
    } else if (p.setup === 'track') {
      S.t += dt * p.tLapse;
      if (S.t <= 48) S.hist.push([S.t].concat([0, 1, 2].map(k => stationRecord(p, k, S.t).T)));
    } else {
      S.t += dt * p.fLapse;
    }
    while (S.hist.length > 1500) S.hist.splice(0, 1);
  }

  /* ---------------- helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const rhOf = (T, Td) => 100 * es(Td) / es(T);
  let G3 = null;
  function cardRows(g, x, y, w, title, rows, o) {
    o = o || {};
    const ctx = g.ctx, K = kit(), lh = 15, h = 26 + rows.length * lh + (o.foot ? 26 : 6);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13);
    rows.forEach((r, i) => { const yy = y + 30 + i * lh; ctx.font = mono(9.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], w * 0.56), x + 9, yy); ctx.font = mono(9.5, 600); ctx.fillStyle = r[2] || '#F2F6FF'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], w * 0.42), x + w - 9, yy); });
    if (o.foot) { ctx.font = mono(8.5); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; K.wrapText(ctx, o.foot, x + 9, y + h - 20, w - 18, 11, 2); }
    ctx.restore(); return h;
  }

  /* ---------------- the map: North America from NASA's Blue Marble, through EARTH ---------------- */
  const MAP = { lat0: 14, lat1: 76, lon0: -168, lon1: -48 };
  let MAPC = null;
  function mapCanvas() {
    if (MAPC) return MAPC;
    const E = window.EARTH; if (!E) return null;
    if (!E.ready()) { E.load(); return null; }
    const W = 480, H = Math.round(480 * (MAP.lat1 - MAP.lat0) / ((MAP.lon1 - MAP.lon0) * Math.cos(45 * Math.PI / 180))), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), img = x.createImageData(W, H), D = img.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const lat = MAP.lat1 - (j + 0.5) / H * (MAP.lat1 - MAP.lat0), lon = MAP.lon0 + (i + 0.5) / W * (MAP.lon1 - MAP.lon0), col = E.colourAt(lat, lon) || [20, 40, 80], k = (j * W + i) * 4;
      D[k] = col[0] * 0.78; D[k + 1] = col[1] * 0.78; D[k + 2] = col[2] * 0.82; D[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return (MAPC = c);
  }
  /* lay the map into a rectangle (keeping its aspect) and return the projection */
  function mapPlate(g, x, y, w, h, view) {
    const ctx = g.ctx, v = view || MAP, c = mapCanvas();
    const ar = (v.lon1 - v.lon0) * Math.cos(((v.lat0 + v.lat1) / 2) * Math.PI / 180) / (v.lat1 - v.lat0);
    let pw = w, ph = w / ar; if (ph > h) { ph = h; pw = h * ar; }
    const px = x + (w - pw) / 2, py = y + (h - ph) / 2;
    const proj = (lat, lon) => ({ x: px + (lon - v.lon0) / (v.lon1 - v.lon0) * pw, y: py + (v.lat1 - lat) / (v.lat1 - v.lat0) * ph });
    ctx.save(); ctx.fillStyle = '#0C1830'; ctx.fillRect(px, py, pw, ph);
    if (c) {
      const sx = (v.lon0 - MAP.lon0) / (MAP.lon1 - MAP.lon0) * c.width, sw = (v.lon1 - v.lon0) / (MAP.lon1 - MAP.lon0) * c.width, sy = (MAP.lat1 - v.lat1) / (MAP.lat1 - MAP.lat0) * c.height, sh = (v.lat1 - v.lat0) / (MAP.lat1 - MAP.lat0) * c.height;
      ctx.imageSmoothingEnabled = true; ctx.drawImage(c, sx, sy, sw, sh, px, py, pw, ph);
    } else { ctx.font = mono(11); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'center'; ctx.fillText('loading the map…', px + pw / 2, py + ph / 2); }
    // graticule
    ctx.strokeStyle = 'rgba(200,220,255,.12)'; ctx.lineWidth = 1;
    for (let la = Math.ceil(v.lat0 / 10) * 10; la <= v.lat1; la += 10) { const a = proj(la, v.lon0), b = proj(la, v.lon1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    for (let lo = Math.ceil(v.lon0 / 10) * 10; lo <= v.lon1; lo += 10) { const a = proj(v.lat0, lo), b = proj(v.lat1, lo); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.strokeRect(px, py, pw, ph);
    ctx.restore();
    return { proj, px, py, pw, ph };
  }

  /* ---------------- masses ---------------- */
  function drawMasses(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW, A = S.A;
    ctx.fillStyle = '#070B14'; ctx.fillRect(0, 0, W, H);
    const M = mapPlate(g, 10, K.HDR + (narrow ? 34 : 6), narrow ? W - 20 : W - 300, H - K.HDR - (narrow ? 44 : 16));
    // the source regions: soft discs where each mass forms, labelled with its class
    Object.keys(MASSES).forEach(k => {
      const m = MASSES[k], c = M.proj(m.at[0], m.at[1]), r = M.pw * 0.07, v = m[p.season];
      const gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r); gr.addColorStop(0, RX.rgba(m.col, 0.55)); gr.addColorStop(1, RX.rgba(m.col, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill();
      ctx.save(); ctx.font = sans(narrow ? 12 : 15, 700); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.8)'; ctx.strokeText(k, c.x, c.y - 6); ctx.fillText(k, c.x, c.y - 6);
      if (!narrow) { ctx.font = mono(8.5); ctx.strokeText(v[0] + ' °C · Td ' + v[1], c.x, c.y + 9); ctx.fillText(v[0] + ' °C · Td ' + v[1], c.x, c.y + 9); }
      ctx.restore();
    });
    // the path, and the air mass on it, coloured by its temperature
    const path = PATHS[p.path], total = pathLen(path).total;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath();
    path.pts.forEach((q, i) => { const c = M.proj(q[0], q[1]); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.stroke(); ctx.setLineDash([]);
    const done = []; for (let s = 0; s <= Math.min(A.s, total); s += total / 80) done.push(pathAt(path, s));
    ctx.strokeStyle = tempCol(A.T); ctx.lineWidth = 4; ctx.beginPath(); done.forEach((q, i) => { const c = M.proj(q.lat, q.lon); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.stroke();
    const here = pathAt(path, Math.min(A.s, total)), c = M.proj(here.lat, here.lon), rr = M.pw * 0.035;
    const gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr * 2); gr.addColorStop(0, RX.rgba(tempCol(A.T), 0.95)); gr.addColorStop(1, RX.rgba(tempCol(A.T), 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, rr * 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, rr * 0.6, 0, TAU); ctx.stroke();
    // lake-effect snow bands downwind of the lakes
    if (A.snow > 0.5) { const L1 = M.proj(43.2, -78.5), L2 = M.proj(44, -84.5); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; [[L1, 1], [L2, 0.7]].forEach(([q, k]) => { for (let b = 0; b < 3; b++) { ctx.globalAlpha = clamp(A.snow / 30, 0.2, 0.8) * k; ctx.beginPath(); ctx.moveTo(q.x - 8, q.y - 4 + b * 7); ctx.lineTo(q.x + 34, q.y + 6 + b * 7); ctx.stroke(); } }); ctx.globalAlpha = 1; }
    ctx.restore();
    if (g.labels) G3.tag(ctx, c.x + rr + 6, c.y, A.T.toFixed(0) + ' °C · dew point ' + A.Td.toFixed(0) + ' °C · over ' + here.surf, '#FFFFFF');
    const at = K.cardSlot(g, S, 'the air mass', 270, { x: W - 280, y: K.HDR + 6 });
    if (at) {
      const m = MASSES[path.mass], v = m[p.season];
      cardRows(g, at.x, at.y, at.w, path.name + ', ' + p.season, [
        ['set out as', path.mass + ' · ' + m.name, '#F2F6FF'], ['at its source', v[0] + ' °C, dew point ' + v[1] + ' °C', '#C9D4EA'], ['now', A.T.toFixed(1) + ' °C, dew point ' + A.Td.toFixed(1) + ' °C', tempCol(A.T)],
        ['humidity', rhOf(A.T, A.Td).toFixed(0) + ' %', '#7CF0B0'], ['travelled', fmtN(Math.min(A.s, total)) + ' of ' + fmtN(total) + ' km', '#C9D4EA'], ['over', here.surf + ' at ' + SURF[here.surf][p.season] + ' °C', '#FFD27A'],
        ['lake − air aloft', here.surf === 'lakes' || A.lake ? A.lake.toFixed(1) + ' °C' : '—', A.lake >= 13 ? '#FF9A8A' : '#C9D4EA'], ['lake-effect snow', A.snow.toFixed(0) + ' cm', A.snow > 1 ? '#FFFFFF' : '#C9D4EA']],
        { foot: 'An air mass takes on its source’s temperature and moisture — and the ground it crosses slowly changes it.' });
    }
  }
  const tempCol = T => { const k = clamp((T + 35) / 70, 0, 1); return RX.mix(RX.mix('#7FB0FF', '#F2F2F2', clamp(k * 2, 0, 1)), '#FF6A4A', clamp(k * 2 - 1, 0, 1)); };

  /* ---------------- highs and lows ---------------- */
  const CEN = { lat: 40, lon: -95 };
  const kmToLL = (x, y) => ({ lat: CEN.lat + y / 111, lon: CEN.lon + x / (111 * Math.cos(CEN.lat * Math.PI / 180)) });
  function drawHighs(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW;
    ctx.fillStyle = '#070B14'; ctx.fillRect(0, 0, W, H);
    const v = { lat0: 40 - 1150 / 111, lat1: 40 + 1150 / 111, lon0: -95 - 1700 / (111 * Math.cos(0.698)), lon1: -95 + 1700 / (111 * Math.cos(0.698)) };
    const M = mapPlate(g, 10, K.HDR + (narrow ? 34 : 6), narrow ? W - 20 : W - 290, H - K.HDR - (narrow ? 44 : 16), v);
    const toS = (x, y) => { const ll = kmToLL(x, y); return M.proj(ll.lat, ll.lon); };
    const fromS = (sx, sy) => ({ x: (sx - M.px) / M.pw * 3400 - 1700, y: (M.py + M.ph - sy) / M.ph * 2300 - 1150 });
    S._fromS = fromS;
    // clouds where the air converges and rises; clear where it sinks
    const nx = 34, ny = 23;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = -1700 + (i + 0.5) / nx * 3400, y = -1150 + (j + 0.5) / ny * 2300, d = divAt(p, x, y), a = clamp(-d / 3e-5, 0, 1);
      if (a < 0.08) continue;
      const c = toS(x, y), r = M.pw / nx * 1.1, gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      gr.addColorStop(0, 'rgba(240,244,250,' + (0.55 * a).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(240,244,250,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill();
    }
    // isobars every 4 hPa, by marching squares on a grid
    const gx = 68, gy = 46, grid = [];
    for (let j = 0; j <= gy; j++) { grid.push([]); for (let i = 0; i <= gx; i++) grid[j].push(pressureAt(p, -1700 + i / gx * 3400, -1150 + j / gy * 2300)); }
    ctx.save(); ctx.lineWidth = 1.3;
    for (let lev = 952; lev <= 1060; lev += 4) {
      ctx.strokeStyle = lev % 8 === 0 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)'; ctx.beginPath();
      for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
        const v0 = grid[j][i], v1 = grid[j][i + 1], v2 = grid[j + 1][i + 1], v3 = grid[j + 1][i], pts = [];
        const e = (a, b, ia, ja, ib, jb) => { if ((a - lev) * (b - lev) < 0) { const t = (lev - a) / (b - a); pts.push(toS(-1700 + (ia + (ib - ia) * t) / gx * 3400, -1150 + (ja + (jb - ja) * t) / gy * 2300)); } };
        e(v0, v1, i, j, i + 1, j); e(v1, v2, i + 1, j, i + 1, j + 1); e(v2, v3, i + 1, j + 1, i, j + 1); e(v3, v0, i, j + 1, i, j);
        if (pts.length >= 2) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); }
        if (pts.length === 4) { ctx.moveTo(pts[2].x, pts[2].y); ctx.lineTo(pts[3].x, pts[3].y); }
      }
      ctx.stroke();
    }
    ctx.restore();
    // the wind: tracers carried by it, and arrows on a coarse grid
    ctx.save(); ctx.fillStyle = 'rgba(255,230,160,.85)';
    S.parts.forEach(q => { const c = toS(q.x, q.y); ctx.globalAlpha = clamp(Math.min(q.age, 40 - q.age) / 6, 0, 1); ctx.beginPath(); ctx.arc(c.x, c.y, 1.6, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.strokeStyle = '#FFD27A'; ctx.fillStyle = '#FFD27A'; ctx.lineWidth = 1.4;
    for (let j = 0; j < 9; j++) for (let i = 0; i < 13; i++) {
      const x = -1550 + i * 260, y = -1000 + j * 250, w = windAt(p, x, y), sp = Math.hypot(w.u, w.v); if (sp < 0.8) continue;
      const c = toS(x, y), L0 = clamp(sp * 1.6, 6, 26), ux = w.u / sp, uy = -w.v / sp;
      ctx.beginPath(); ctx.moveTo(c.x - ux * L0 / 2, c.y - uy * L0 / 2); ctx.lineTo(c.x + ux * L0 / 2, c.y + uy * L0 / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x + ux * L0 / 2, c.y + uy * L0 / 2); ctx.lineTo(c.x + ux * L0 / 2 - ux * 5 - uy * 3, c.y + uy * L0 / 2 - uy * 5 + ux * 3); ctx.lineTo(c.x + ux * L0 / 2 - ux * 5 + uy * 3, c.y + uy * L0 / 2 - uy * 5 - ux * 3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // H and L, draggable
    [['L', p.lx, p.ly, '#FF5A4A', p.low, 'low'], ['H', p.hx, p.hy, '#4A9AFF', p.high, 'high']].forEach(([t, x, y, col, P, id]) => {
      const c = toS(x, y); ctx.save(); ctx.font = sans(30, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(5,8,15,.8)'; ctx.strokeText(t, c.x, c.y); ctx.fillStyle = col; ctx.fillText(t, c.x, c.y);
      ctx.font = mono(10, 700); ctx.strokeText(String(P), c.x, c.y + 22); ctx.fillStyle = '#FFFFFF'; ctx.fillText(String(P), c.x, c.y + 22); ctx.restore();
      g.handle(c.x, c.y, 20, id);
    });
    const at = K.cardSlot(g, S, 'the wind between', 260, { x: W - 270, y: K.HDR + 6 });
    if (at) {
      const mid = windAt(p, (p.lx + p.hx) / 2, (p.ly + p.hy) / 2), gr = gradAt(p, (p.lx + p.hx) / 2, (p.ly + p.hy) / 2), sp = Math.hypot(mid.u, mid.v), spg = Math.hypot(mid.ug, mid.vg);
      cardRows(g, at.x, at.y, at.w, 'Halfway from H to L', [
        ['pressure gradient', (Math.hypot(gr[0], gr[1]) * 100).toFixed(2) + ' hPa / 100 km', '#F2F6FF'], ['geostrophic wind', spg.toFixed(1) + ' m/s', '#FFD27A'],
        ['with friction', sp.toFixed(1) + ' m/s, ' + FRICT[p.surface].angle + '° toward the low', '#FFD27A'], ['Coriolis f', fOf(p).toExponential(2) + ' /s', '#C9D4EA'],
        ['around the L', p.hemi === 'north' ? 'anticlockwise, inward' : 'clockwise, inward', '#FF8A7A'], ['around the H', p.hemi === 'north' ? 'clockwise, outward' : 'anticlockwise, outward', '#8FB8FF']],
        { foot: 'Air flows in to a low and rises (clouds, rain); it sinks out of a high (clear skies).' });
    }
  }

  /* ---------------- fronts in section ---------------- */
  const SEC = { x0: -700, x1: 700, z1: 12 };
  function frontX(S) { const p = fp(S.p), F = frontOf(p); return F.kind === 'stationary' ? 0 : -350 + F.speed * 3.6 * S.t; }   // km
  function drawSection(S, g) {
    const p = fp(S.p), ctx = g.ctx, K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW, F = frontOf(p), xf = frontX(S);
    const x0 = 12, x1 = narrow ? W - 12 : W - 290, y0 = K.HDR + (narrow ? 36 : 8), y1 = H - 64;
    const sx = x => x0 + (x - SEC.x0) / (SEC.x1 - SEC.x0) * (x1 - x0), sz = z => y1 - z / SEC.z1 * (y1 - y0);
    // the frontal surfaces: height of the cold air at x (km)
    const sl = F.slope, warmSide = F.kind === 'cold' ? 1 : -1;                // the warm air is ahead (+x) of a cold front, behind a warm front
    const coldTop = x => {
      if (F.kind === 'cold') return x < xf ? (xf - x) * sl : 0;
      if (F.kind === 'warm' || F.kind === 'stationary') return x > xf ? (x - xf) * sl : 0;
      // occluded: a cold front (behind, colder) has caught a warm front; the warm air is lifted off the ground
      const xo = xf, xc = xo - 120; return x < xc ? (xo - x) * sl * 1.8 : x < xo ? (xo - x) * sl * 1.8 : (x - xo) * sl;
    };
    // sky and air: warm air orange, cold air blue, their temperatures shading them
    for (let i = 0; i <= 140; i++) {
      const x = SEC.x0 + i / 140 * (SEC.x1 - SEC.x0), ct = Math.min(SEC.z1, coldTop(x)), xa = sx(x) - 1, xb = sx(x + (SEC.x1 - SEC.x0) / 140) + 1;
      const cold = F.kind === 'occluded' && x < xf - 120 ? '#3E6FB8' : '#5A8ED0';
      let gr = ctx.createLinearGradient(0, sz(SEC.z1), 0, sz(ct)); gr.addColorStop(0, '#2A3E64'); gr.addColorStop(1, '#C88A5A'); ctx.fillStyle = gr; ctx.fillRect(xa, sz(SEC.z1), xb - xa, sz(ct) - sz(SEC.z1));
      if (ct > 0) { gr = ctx.createLinearGradient(0, sz(ct), 0, y1); gr.addColorStop(0, RX.mix(cold, '#1A2A4A', 0.3)); gr.addColorStop(1, cold); ctx.fillStyle = gr; ctx.fillRect(xa, sz(ct), xb - xa, y1 - sz(ct)); }
    }
    // the frontal surface
    ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const x = SEC.x0 + i / 200 * (SEC.x1 - SEC.x0), ct = coldTop(x); if (ct <= 0 && !(F.kind === 'occluded')) continue; const X = sx(x), Y = sz(Math.min(SEC.z1, ct)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke(); ctx.restore();
    // clouds where the warm air has been lifted above its condensation level
    const GX = window.GEO, base = F.base / 1000, top = F.top / 1000;
    const cloudAt = (x, z, w, h, seed, a, grey) => { if (GX) GX.cloud(ctx, sx(x), sz(z), w, h, seed, a, grey || [244, 246, 250]); };
    if (F.kind === 'cold') {
      if (F.unstable) {                                                // a towering cumulonimbus at the front: a dark base, cauliflower flanks, the anvil spread at the tropopause
        const cx = xf + 30, rr = G3.rng(17);
        const tw = sx(cx + 45) - sx(cx - 45), base0 = sz(base), top0 = sz(top);
        const body = ctx.createLinearGradient(0, top0, 0, base0); body.addColorStop(0, 'rgba(250,250,252,.96)'); body.addColorStop(0.6, 'rgba(214,218,228,.96)'); body.addColorStop(1, 'rgba(112,118,132,.96)');
        ctx.save(); ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(sx(cx) - tw * 0.55, base0);
        for (let k = 0; k <= 10; k++) { const u = k / 10, y = base0 + (top0 - base0) * u, w = tw * (0.55 - 0.12 * Math.sin(u * Math.PI)); ctx.lineTo(sx(cx) - w + (rr() - 0.5) * 8, y); }
        ctx.lineTo(sx(cx) - tw * 0.9, top0 + 30); ctx.quadraticCurveTo(sx(cx) - tw * 2.4, top0 + 20, sx(cx) - tw * 2.6, top0 + 8); ctx.quadraticCurveTo(sx(cx), top0 - 24, sx(cx) + tw * 4.2, top0 + 2); ctx.quadraticCurveTo(sx(cx) + tw * 4.4, top0 + 22, sx(cx) + tw * 2.4, top0 + 26); ctx.lineTo(sx(cx) + tw * 0.8, top0 + 34);
        for (let k = 10; k >= 0; k--) { const u = k / 10, y = base0 + (top0 - base0) * u, w = tw * (0.55 - 0.12 * Math.sin(u * Math.PI)); ctx.lineTo(sx(cx) + w + (rr() - 0.5) * 8, y); }
        ctx.closePath(); ctx.fill(); ctx.restore();
        for (let k = 0; k < 14; k++) { const u = rr(), z = base + (top - base) * (0.1 + 0.85 * u), side = rr() < 0.5 ? -1 : 1; cloudAt(cx + side * (30 - 10 * u) * (0.6 + 0.4 * rr()), z, 34 + 20 * rr(), 26, k + 2, 0.9, [246 - 40 * (1 - u), 248 - 38 * (1 - u), 252 - 30 * (1 - u)]); }
      } else { for (let k = 0; k < 6; k++) cloudAt(xf - k * 40 + 30, base + 0.4 + k * 0.6, 120, 40, k + 3, 0.9, [200, 205, 215]); }
    } else {
      // the warm-front sequence: nimbostratus at the surface front, altostratus, cirrostratus and cirrus far ahead
      /* the cloud shield rides up the frontal surface: thick, low and dark (nimbostratus) at the surface front, thinner and
         higher ahead (altostratus), then the ice-cloud veil and the cirrus wisps far ahead */
      const thick = x => Math.max(0, (top - base) * (1 - (x - xf) / Math.max(200, F.width)) * 0.7);
      ctx.save(); ctx.beginPath();
      const pts = []; for (let x = xf; x <= SEC.x1; x += 10) pts.push([x, Math.min(SEC.z1 - 0.2, coldTop(x) + base)]);
      pts.forEach(([x, z], i) => i ? ctx.lineTo(sx(x), sz(z)) : ctx.moveTo(sx(x), sz(z)));
      for (let i = pts.length - 1; i >= 0; i--) { const [x, z] = pts[i]; ctx.lineTo(sx(x), sz(Math.min(SEC.z1 - 0.1, z + 0.2 + thick(x)))); }
      ctx.closePath();
      const gr2 = ctx.createLinearGradient(sx(xf), 0, sx(Math.min(SEC.x1, xf + F.width)), 0); gr2.addColorStop(0, 'rgba(120,126,140,.95)'); gr2.addColorStop(0.4, 'rgba(190,196,208,.9)'); gr2.addColorStop(1, 'rgba(236,240,246,.55)');
      ctx.fillStyle = gr2; ctx.fill(); ctx.restore();
      for (let k = 0; k < 8; k++) { const x = xf + 30 + k * 70, z = coldTop(x) + base + 0.2 + thick(x); if (x < SEC.x1) cloudAt(x, Math.min(SEC.z1 - 0.3, z), 120, 22, k + 5, 0.75, [226, 230, 238]); }
      ctx.save(); ctx.strokeStyle = 'rgba(245,248,255,.75)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 12; k++) { const x = xf + 380 + k * 35; if (x > SEC.x1) break; const z = Math.min(SEC.z1 - 0.5, coldTop(x) + base + 1.2 + (k % 3) * 0.4); ctx.beginPath(); ctx.moveTo(sx(x), sz(z)); ctx.quadraticCurveTo(sx(x + 12), sz(z + 0.25), sx(x + 30), sz(z + 0.1)); ctx.stroke(); }
      ctx.restore();
      if (F.kind === 'occluded') for (let k = 0; k < 5; k++) cloudAt(xf - 80 + k * 30, base + 1 + k * 0.8, 70, 40, k + 20, 0.9, [200, 204, 214]);
    }
    // rain beneath the clouds
    const rainX0 = F.kind === 'cold' ? xf - (F.unstable ? 10 : 80) : F.kind === 'occluded' ? xf - 120 : xf, rainX1 = F.kind === 'cold' ? xf + (F.unstable ? 40 : 40) : xf + F.width;
    if (F.R > 0.05 && window.TERRAIN) { const a = sx(Math.max(SEC.x0, rainX0)), b = sx(Math.min(SEC.x1, rainX1)); if (b > a) window.TERRAIN.rain(ctx, a, sz(base), b - a, y1 - sz(base), clamp(F.R * 4, 2, 60), S.ta, F.kind === 'cold' ? 0.15 : 0.05); }
    // the ground, a town at x = 0 and its weather
    ctx.fillStyle = '#3A5A2E'; ctx.fillRect(x0, y1, x1 - x0, 6); ctx.fillStyle = '#2A2018'; ctx.fillRect(x0, y1 + 6, x1 - x0, H - y1 - 6);
    const tx = sx(0); ctx.fillStyle = '#E6DCC8'; ctx.fillRect(tx - 7, y1 - 8, 14, 8); ctx.fillStyle = '#A5452F'; ctx.beginPath(); ctx.moveTo(tx - 9, y1 - 8); ctx.lineTo(tx, y1 - 15); ctx.lineTo(tx + 9, y1 - 8); ctx.closePath(); ctx.fill();
    // flow arrows: warm air climbing the surface, cold air pushing under
    ctx.save(); ctx.strokeStyle = 'rgba(255,220,180,.9)'; ctx.fillStyle = 'rgba(255,220,180,.9)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const xs = xf + warmSide * (60 + k * 120), xe = xf + warmSide * (k * 120 - 40), zs = Math.max(0.3, coldTop(xs) + 0.3), ze = Math.min(SEC.z1 - 0.5, coldTop(xe) + 1.5 + k * 0.5);
      if (F.kind === 'occluded') continue;
      ctx.beginPath(); ctx.moveTo(sx(xs), sz(zs)); ctx.quadraticCurveTo(sx((xs + xe) / 2), sz(zs), sx(xe), sz(ze)); ctx.stroke();
      const ang = Math.atan2(sz(ze) - sz(zs), sx(xe) - sx((xs + xe) / 2)); ctx.beginPath(); ctx.moveTo(sx(xe), sz(ze)); ctx.lineTo(sx(xe) - 8 * Math.cos(ang - 0.4), sz(ze) - 8 * Math.sin(ang - 0.4)); ctx.lineTo(sx(xe) - 8 * Math.cos(ang + 0.4), sz(ze) - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // the front's symbol on the ground: triangles (cold), half-discs (warm), both alternating (occluded/stationary)
    const fxs = sx(xf); ctx.save();
    if (F.kind === 'cold') { ctx.fillStyle = '#3A7AFF'; ctx.beginPath(); ctx.moveTo(fxs - 9, y1); ctx.lineTo(fxs + 9, y1); ctx.lineTo(fxs + 9, y1 - 14); ctx.closePath(); ctx.fill(); }
    else if (F.kind === 'warm') { ctx.fillStyle = '#FF4A3A'; ctx.beginPath(); ctx.arc(fxs, y1, 9, Math.PI, 0); ctx.fill(); }
    else if (F.kind === 'occluded') { ctx.fillStyle = '#B04AE0'; ctx.beginPath(); ctx.arc(fxs, y1, 8, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(fxs - 22, y1); ctx.lineTo(fxs - 8, y1); ctx.lineTo(fxs - 8, y1 - 12); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = '#3A7AFF'; ctx.beginPath(); ctx.moveTo(fxs - 18, y1); ctx.lineTo(fxs - 4, y1); ctx.lineTo(fxs - 11, y1 + 11); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FF4A3A'; ctx.beginPath(); ctx.arc(fxs + 11, y1, 7, Math.PI, 0); ctx.fill(); }
    ctx.restore();
    // scales and names
    ctx.save(); ctx.font = mono(8.5); ctx.fillStyle = '#C9D4EA'; ctx.textBaseline = 'middle';
    [0, 2, 4, 6, 8, 10, 12].forEach(z => { ctx.fillRect(x1 - 4, sz(z), 4, 1); ctx.textAlign = 'right'; ctx.fillText(z + ' km', x1 - 6, sz(z)); });
    ctx.textAlign = 'center'; [-600, -300, 0, 300, 600].forEach(x => ctx.fillText(x + ' km', sx(x), y1 + 18));
    ctx.font = sans(narrow ? 11 : 13, 700); ctx.fillStyle = 'rgba(255,255,255,.9)';
    const warmLabelX = F.kind === 'cold' ? Math.min(SEC.x1 - 150, xf + 260) : Math.max(SEC.x0 + 150, xf - 260), coldLabelX = F.kind === 'cold' ? Math.max(SEC.x0 + 120, xf - 260) : Math.min(SEC.x1 - 110, xf + 420);
    if (F.kind !== 'occluded') { ctx.fillText('WARM AIR ' + p.Tw + ' °C', sx(warmLabelX), sz(1.2)); ctx.fillText('COLD AIR ' + p.Tc + ' °C', sx(coldLabelX), sz(Math.max(0.5, coldTop(coldLabelX) * 0.4))); }
    else { ctx.fillText('WARM AIR, LIFTED', sx(xf - 60), sz(Math.min(10, coldTop(xf - 60) + 2.4))); ctx.fillText('COLDEST AIR', sx(xf - 420), sz(0.8)); ctx.fillText('COOL AIR', sx(xf + 380), sz(0.6)); }
    ctx.restore();
    if (g.labels) {
      G3.tag(ctx, sx(xf) + 12, sz(base), 'cloud base ' + F.base.toFixed(0) + ' m = 125 × (T − Td)', '#E6EEF8');
      G3.tag(ctx, sx(xf) + 12, sz(Math.min(top, SEC.z1 - 0.4)), F.unstable ? 'cumulonimbus to ' + top.toFixed(0) + ' km' : 'layered cloud to ' + top.toFixed(1) + ' km', '#E6EEF8');
      G3.tag(ctx, tx - 10, y1 - 26, 'town · ' + (xf > 0 === (F.kind === 'cold') ? 'warm side' : 'cold side'), '#FFE0A0', { align: 'right' });
    }
    const at = K.cardSlot(g, S, 'the front, computed', 260, { x: W - 270, y: K.HDR + 6 });
    if (at) cardRows(g, at.x, at.y, at.w, { cold: 'Cold front', warm: 'Warm front', occluded: 'Occluded front', stationary: 'Stationary front' }[F.kind], [
      ['slope (Margules)', '1 : ' + fmtN(1 / F.slope), '#F2F6FF'], ['moving', F.speed ? (F.speed * 3.6).toFixed(0) + ' km/h' : 'not moving', '#F2F6FF'], ['warm air lifted at', (F.lift * 100).toFixed(1) + ' cm/s', '#FFD27A'],
      ['cloud base', fmtN(F.base) + ' m', '#E6EEF8'], ['cloud', F.unstable ? 'cumulonimbus (unstable)' : 'layered (stable)', '#E6EEF8'], ['rain', F.R.toFixed(1) + ' mm/h for ' + (isFinite(F.hours) ? F.hours.toFixed(1) + ' h' : 'as long as it stays'), '#8FC8FF'],
      ['after it passes', F.kind === 'cold' ? 'colder, drier, wind veers' : F.kind === 'warm' ? 'warmer, humid, wind veers' : F.kind === 'occluded' ? 'cooler; rain eases' : 'little changes', '#C9D4EA']],
      { foot: F.kind === 'cold' ? 'A steep, fast front: brief, heavy showers along a narrow band.' : 'A gentle slope: cloud thickens for hundreds of km ahead; long, steady rain.' });
  }

  /* ---------------- track a front ---------------- */
  function drawTrack(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), W = g.w, H = g.h, narrow = W < K.NARROW;
    ctx.fillStyle = '#070B14'; ctx.fillRect(0, 0, W, H);
    const v = { lat0: 34.5, lat1: 45.5, lon0: -103, lon1: -84 };
    const M = mapPlate(g, 10, K.HDR + (narrow ? 34 : 6), narrow ? W - 20 : W - 290, H - K.HDR - (narrow ? 44 : 16), v);
    // stations along a line from west to east at 40° N, starting near Denver's longitude east of the mountains
    const st = [0, 1, 2].map(k => { const lon = -100 + (k * p.spacing) / (111 * Math.cos(40 * Math.PI / 180)); return { k, lat: 40, lon, c: M.proj(40, lon) }; });
    const xf = p.x0 + p.trackSpeed * S.t, fl = -100 + xf / (111 * Math.cos(0.698));
    // the front: a line across the map with the cold-front triangles on its forward side
    const a = M.proj(48, fl + 1.5), b = M.proj(32, fl - 1.5);
    ctx.save(); ctx.strokeStyle = '#3A7AFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const n = 9; ctx.fillStyle = '#3A7AFF';
    for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, dx = (b.x - a.x), dy = (b.y - a.y), L = Math.hypot(dx, dy), tx = dx / L, ty = dy / L; let nx = -ty, ny = tx; if (nx < 0) { nx = -nx; ny = -ny; }   // the triangles point the way it moves: east
      ctx.beginPath(); ctx.moveTo(x - tx * 7, y - ty * 7); ctx.lineTo(x + tx * 7, y + ty * 7); ctx.lineTo(x + nx * 11, y + ny * 11); ctx.closePath(); ctx.fill(); }
    // rain along it
    if (window.TERRAIN) { const m = M.proj(40, fl); window.TERRAIN.rain(ctx, m.x - 10, a.y, 40, b.y - a.y, 10, S.ta, 0.1); }
    ctx.restore();
    st.forEach(s => {
      const r = stationRecord(p, s.k, S.t), sm = Math.min(76, M.pw * 0.12);
      G3.stationModel(ctx, s.c.x, s.c.y, sm, { oktas: clamp(8 * Math.exp(-Math.pow((xf - s.k * p.spacing + 80) / 200, 2)) + 1, 0, 8), u: r.u, dir: r.dir, Tlab: r.T.toFixed(0), Tdlab: r.Td.toFixed(0), Pcode: String(Math.round(r.P * 10) % 1000).padStart(3, '0'), tend: '', rain: r.R });
      if (g.labels) G3.tag(ctx, s.c.x, s.c.y + sm * 0.55, 'station ' + 'ABC'[s.k] + ' · ' + s.k * p.spacing + ' km', '#FFE0A0', { align: 'center' });
    });
    const at = K.cardSlot(g, S, 'the station records', 260, { x: W - 270, y: K.HDR + 6 });
    if (at) {
      const rows = [0, 1, 2].map(k => { const t = arrival(p, k), seen = S.t >= t; return ['station ' + 'ABC'[k] + ' (' + k * p.spacing + ' km)', seen ? 'front at ' + t.toFixed(1) + ' h' : 'waiting…', seen ? '#7CF0B0' : '#98A6C6']; });
      rows.push(['now', S.t.toFixed(1) + ' h', '#F2F6FF']);
      cardRows(g, at.x, at.y, at.w, 'When did the front arrive?', rows, { foot: 'Find each arrival in the records: the temperature drops, the wind veers, the pressure turns up. Speed = distance ÷ time.' });
    }
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = window.G6D;
    if (!K || !G3) return;
    if (p.setup === 'masses') drawMasses(S, g);
    else if (p.setup === 'highs') drawHighs(S, g);
    else if (p.setup === 'track') drawTrack(S, g);
    else drawSection(S, g);
    headerOf(S, g);
  }
  function onDrag(S, e) {
    const p = S.p;
    if ((e.id === 'low' || e.id === 'high') && S._fromS) {
      const w = S._fromS(e.x, e.y);
      if (e.id === 'low') { p.lx = clamp(Math.round(w.x / 10) * 10, -1500, 1500); p.ly = clamp(Math.round(w.y / 10) * 10, -1000, 1000); }
      else { p.hx = clamp(Math.round(w.x / 10) * 10, -1500, 1500); p.hy = clamp(Math.round(w.y / 10) * 10, -1000, 1000); }
    }
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function headerOf(S, g) {
    const p = fp(S.p), K = kit(); let a = '', b = '', c = '';
    if (p.setup === 'masses') { const A = S.A, path = PATHS[p.path], here = pathAt(path, A.s); a = path.name + ': now ' + A.T.toFixed(0) + ' °C with a ' + A.Td.toFixed(0) + ' °C dew point' + (A.snow > 1 ? ' — lake-effect snow downwind' : ''); b = 'set out ' + MASSES[path.mass][p.season][0] + ' °C / ' + MASSES[path.mass][p.season][1] + ' °C · over ' + here.surf + ' · ' + fmtN(A.s) + ' km in ' + A.t.toFixed(1) + ' days at ' + p.speed + ' m/s'; c = p.season + ' · source properties after Ahrens, Meteorology Today'; }
    else if (p.setup === 'highs') { const m = windAt(p, (p.lx + p.hx) / 2, (p.ly + p.hy) / 2); a = 'Wind blows from high to low — turned by Earth’s spin into a ' + (p.hemi === 'north' ? 'counter-clockwise' : 'clockwise') + ' swirl round the low'; b = 'low ' + p.low + ' hPa · high ' + p.high + ' hPa · ' + Math.hypot(m.u, m.v).toFixed(1) + ' m/s between them · latitude ' + p.lat + '° ' + (p.hemi === 'north' ? 'N' : 'S') + ' · over ' + p.surface; c = 'isobars every 4 hPa · drag the H and the L'; }
    else if (p.setup === 'track') { const done = [0, 1, 2].filter(k => S.t >= arrival(p, k)).length; a = done < 2 ? 'Watch the records: the front has reached ' + done + ' of 3 stations' : 'From B and ' + (done > 2 ? 'C' : 'A') + ': the front moves ' + p.spacing + ' km in ' + (p.spacing / p.trackSpeed).toFixed(1) + ' h'; b = 'stations ' + p.spacing + ' km apart · ' + S.t.toFixed(1) + ' hours since the start'; c = 'a cold front crossing the Plains'; }
    else { const F = frontOf(p); a = { cold: 'A cold front: cold air shoves under the warm, lifting it fast and steeply', warm: 'A warm front: warm air slides gently up over the retreating cold air', occluded: 'Occluded: the cold front has caught the warm front and lifted the warm air off the ground', stationary: 'Stationary: neither air mass moves the other — the front stalls and it keeps raining' }[F.kind]; b = 'slope 1:' + fmtN(1 / F.slope) + ' · lift ' + (F.lift * 100).toFixed(1) + ' cm/s · cloud base ' + fmtN(F.base) + ' m · rain ' + F.R.toFixed(1) + ' mm/h'; c = 'section 1,400 km wide, 12 km tall (heights ×' + fmtN(1400 / 12 / 2) + ') · ' + S.t.toFixed(1) + ' h'; }
    K.header(g, a, b, c);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  function plot1(S, g) {
    const p = fp(S.p), K = kit();
    if (p.setup === 'masses') {
      const path = PATHS[p.path], total = pathLen(path).total, H = S.hist, surf = [];
      for (let s = 0; s <= total; s += total / 120) surf.push([s, SURF[pathAt(path, s).surf][p.season]]);
      const all = H.flatMap(q => [q[1], q[2]]).concat(surf.map(q => q[1])), lo = Math.floor(Math.min(...all) - 3), hi = Math.ceil(Math.max(...all) + 3);
      const Kk = K.plotKey(g, [{ c: '#FF8A6A', label: 'air temperature' }, { c: '#7CF0B0', label: 'dew point' }, { c: '#C9D4EA', label: 'the ground or water below', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: total, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'km along the path', ylabel: '°C', xfmt: v => fmtN(v), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(surf, 'rgba(201,212,234,.6)', 1.4, [4, 3]); P.line(H.map(q => [q[0], q[1]]), '#FF8A6A', 2.4); P.line(H.map(q => [q[0], q[2]]), '#7CF0B0', 2.2); P.hline(0, 'rgba(143,200,255,.3)', [2, 4]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'highs') {
      const pts = [], sp = [], dx = p.hx - p.lx, dy = p.hy - p.ly, L = Math.hypot(dx, dy) || 1;
      for (let k = -0.3; k <= 1.3; k += 0.02) { const x = p.lx + dx * k, y = p.ly + dy * k, w = windAt(p, x, y); pts.push([k * L, pressureAt(p, x, y)]); sp.push([k * L, Math.hypot(w.u, w.v)]); }
      const lo = Math.min(...pts.map(q => q[1])) - 4, hi = Math.max(...pts.map(q => q[1])) + 4, sm = Math.max(5, ...sp.map(q => q[1]));
      const Kk = K.plotKey(g, [{ c: '#F2F6FF', label: 'pressure from L to H' }, { c: '#FFD27A', label: 'wind speed (right, max ' + sm.toFixed(0) + ' m/s)', dash: [4, 3] }]);
      const P = g.Plot({ xmin: -0.3 * L, xmax: 1.3 * L, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'km from the low toward the high', ylabel: 'hPa', xfmt: v => fmtN(v), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#F2F6FF', 2.4); P.line(sp.map(q => [q[0], lo + q[1] / sm * (hi - lo) * 0.95]), '#FFD27A', 1.8, [4, 3]); P.vline(0, 'rgba(255,90,74,.5)', [3, 3]); P.vline(L, 'rgba(74,154,255,.5)', [3, 3]); P.tag(0, hi - 2, 'L', '#FF5A4A', 'left', 0); P.tag(L, hi - 2, 'H', '#4A9AFF', 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'track') {
      const H = S.hist, cols = ['#FF8A6A', '#FFD27A', '#7CF0B0'];
      const Kk = K.plotKey(g, [0, 1, 2].map(k => ({ c: cols[k], label: 'station ' + 'ABC'[k] + ' temperature' })));
      const P = g.Plot({ xmin: 0, xmax: 48, ymin: 4, ymax: 22, pad: { t: Kk.t }, xlabel: 'hours', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { [0, 1, 2].forEach(k => { P.line(H.map(q => [q[0], q[k + 1]]), cols[k], 2.2); const t = arrival(p, k); if (S.t >= t && t >= 0) { P.vline(t, RX.rgba(cols[k], 0.5), [3, 3]); P.tag(t, 21, 'ABC'[k] + ' ' + t.toFixed(1) + ' h', cols[k], 'left', 0); } }); });
      Kk.draw(P); return;
    }
    // a section: the rain along it, and where the cloud is
    const F = frontOf(p), xf = frontX(S), pts = [];
    for (let x = SEC.x0; x <= SEC.x1; x += 5) {
      let r = 0;
      if (F.kind === 'cold') r = F.R * Math.exp(-Math.pow((x - xf - 10) / (F.unstable ? 20 : 60), 2));
      else if (F.kind === 'occluded') r = F.R * (x > xf - 140 && x < xf + 100 ? 1 : 0);
      else r = x > xf && x < xf + F.width ? F.R * (1 - 0.6 * (x - xf) / F.width) : 0;
      pts.push([x, r]);
    }
    const ym = Math.max(2, F.R * 1.25), Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'rain, mm an hour' }, { c: '#FFE0A0', label: 'the town', dash: [3, 3] }]);
    const P = g.Plot({ xmin: SEC.x0, xmax: SEC.x1, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'km across the section', ylabel: 'mm/h', xfmt: v => fmtN(v), yfmt: v => v.toFixed(ym < 4 ? 1 : 0) }).frame();
    P.clip(() => { P.area(pts, 0, 'rgba(143,200,255,.25)'); P.line(pts, '#8FC8FF', 2.2); P.vline(0, 'rgba(255,224,160,.7)', [3, 3]); P.vline(xf, 'rgba(255,255,255,.4)', [2, 4]); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = fp(S.p), K = kit();
    if (p.setup === 'masses') {
      const Kk = K.plotKey(g, [{ c: '#FFFFFF', dot: true, label: 'the air mass now' }], p.season + ' sources');
      const P = g.Plot({ xmin: -50, xmax: 40, ymin: -50, ymax: 30, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'dew point, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line([[-50, -50], [30, 30]], 'rgba(201,212,234,.35)', 1, [3, 3]); P.tag(22, 24, 'saturated', '#AFC0D8', 'right', 0); Object.keys(MASSES).forEach(k => { const v = MASSES[k][p.season]; P.dot(v[0], v[1], 6, MASSES[k].col, '#0B0F18'); P.tag(v[0], v[1], k, MASSES[k].col, 'left', -10); }); const H = S.hist; P.line(H.map(q => [q[1], q[2]]), 'rgba(255,255,255,.6)', 1.4); P.dot(S.A.T, S.A.Td, 5, '#FFFFFF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'highs') {
      const mid = gradAt(p, (p.lx + p.hx) / 2, (p.ly + p.hy) / 2), gh = Math.hypot(mid[0], mid[1]) * 100, pts = [], fr = [];
      for (let la = 8; la <= 80; la += 1) { const v = geostrophic(gh, 100, la); pts.push([la, Math.min(80, v)]); fr.push([la, Math.min(80, v * FRICT[p.surface].slow)]); }
      const Kk = K.plotKey(g, [{ c: '#FFD27A', label: 'geostrophic' }, { c: '#FF8A6A', label: 'with ' + p.surface + ' friction', dash: [4, 3] }], gh.toFixed(2) + ' hPa per 100 km');
      const P = g.Plot({ xmin: 0, xmax: 80, ymin: 0, ymax: 60, pad: { t: Kk.t }, xlabel: 'latitude, °', ylabel: 'wind, m/s', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#FFD27A', 2.4); P.line(fr, '#FF8A6A', 1.8, [4, 3]); P.dot(p.lat, Math.min(60, geostrophic(gh, 100, p.lat)), 5.5, '#FFD27A', '#FFFFFF'); P.tag(8, 56, 'near the equator, no balance: f → 0', '#AFC0D8', 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'track') {
      const Kk = K.plotKey(g, [{ c: '#7CF0B0', dot: true, label: 'arrival seen' }, { c: 'rgba(124,240,176,.5)', label: 'best line: slope = 1/speed', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: 2.2 * p.spacing, ymin: -10, ymax: 48, pad: { t: Kk.t }, xlabel: 'km from station A', ylabel: 'arrival, hours', xfmt: v => fmtN(v), yfmt: v => v.toFixed(0) }).frame();
      const seen = [0, 1, 2].filter(k => S.t >= arrival(p, k));
      P.clip(() => { seen.forEach(k => P.dot(k * p.spacing, arrival(p, k), 5.5, '#7CF0B0', '#0B0F18')); if (seen.length >= 2) P.line([[0, arrival(p, 0)], [2.2 * p.spacing, arrival(p, 0) + 2.2 * p.spacing / p.trackSpeed]], 'rgba(124,240,176,.5)', 1.6, [4, 3]); });
      Kk.draw(P); return;
    }
    const F = frontOf(p), Kk = K.plotKey(g, [10, 25, 40].map((s, i) => ({ c: ['#8FC8FF', '#FFD27A', '#FF8A6A'][i], label: 'shear ' + s + ' m/s', w: Math.abs(s - p.shear) < 1 ? 3 : 1.5 })), 'Margules, 45° N');
    const P = g.Plot({ xmin: 1, xmax: 25, ymin: 0, ymax: 0.03, pad: { t: Kk.t }, xlabel: 'warm − cold air, °C', ylabel: 'slope (rise ÷ run)', xfmt: v => v.toFixed(0), yfmt: v => v === 0 ? '0' : '1:' + Math.round(1 / v) }).frame();
    P.clip(() => { [10, 25, 40].forEach((s, i) => { const pts = []; for (let d = 1; d <= 25; d += 0.25) pts.push([d, Math.min(0.03, margules(Object.assign({}, p, { shear: s, Tc: p.Tw - d })))]); P.line(pts, ['#8FC8FF', '#FFD27A', '#FF8A6A'][i], Math.abs(s - p.shear) < 1 ? 3 : 1.4); }); P.dot(p.Tw - p.Tc, F.slope, 5.5, '#FFFFFF', '#0B0F18'); P.hline(1 / 100, 'rgba(201,212,234,.35)', [2, 4]); P.tag(25, 1 / 100, 'cold fronts: about 1:100', '#AFC0D8', 'right', -8); P.hline(1 / 200, 'rgba(201,212,234,.35)', [2, 4]); P.tag(25, 1 / 200, 'warm fronts: about 1:200', '#AFC0D8', 'right', -8); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = fp(S.p);
    if (p.setup === 'masses') { const A = S.A, path = PATHS[p.path], here = pathAt(path, A.s); return [
      { label: 'Temperature', value: A.T.toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Dew point', value: A.Td.toFixed(1), unit: '°C' }, { label: 'Humidity', value: rhOf(A.T, A.Td).toFixed(0), unit: '%' },
      { label: 'Travelled', value: fmtN(Math.min(A.s, pathLen(path).total)), unit: 'km' }, { label: 'Days on the move', value: A.t.toFixed(1), unit: 'd' }, { label: 'Surface below', value: String(SURF[here.surf][p.season]), unit: '°C', hint: here.surf },
      { label: 'Lake − air aloft', value: A.lake ? A.lake.toFixed(1) : '—', unit: A.lake ? '°C' : '', flag: A.lake >= 13 ? 'warn' : null, hint: '13 °C makes snow' }, { label: 'Lake-effect snow', value: A.snow.toFixed(0), unit: 'cm' }]; }
    if (p.setup === 'highs') { const mx = (p.lx + p.hx) / 2, my = (p.ly + p.hy) / 2, gr = gradAt(p, mx, my), w = windAt(p, mx, my); return [
      { label: 'Low', value: String(p.low), unit: 'hPa' }, { label: 'High', value: String(p.high), unit: 'hPa' }, { label: 'Gradient between', value: (Math.hypot(gr[0], gr[1]) * 100).toFixed(2), unit: 'hPa/100 km' },
      { label: 'Geostrophic V = ΔP/ρfΔn', value: Math.hypot(w.ug, w.vg).toFixed(1), unit: 'm/s', flag: 'accent' }, { label: 'With friction', value: Math.hypot(w.u, w.v).toFixed(1), unit: 'm/s' },
      { label: 'Coriolis f = 2Ω sin φ', value: fOf(p).toExponential(2), unit: '/s' }, { label: 'Air rising at the low', value: (-divAt(p, p.lx + 150, p.ly) * 1e5).toFixed(2), unit: '×10⁻⁵/s', hint: 'convergence' }]; }
    if (p.setup === 'track') { const seen = [0, 1, 2].filter(k => S.t >= arrival(p, k)), sp = seen.length >= 2 ? (seen[seen.length - 1] - seen[0]) * p.spacing / (arrival(p, seen[seen.length - 1]) - arrival(p, seen[0])) : null; return [
      { label: 'Hours', value: S.t.toFixed(1), unit: 'h' }].concat([0, 1, 2].map(k => ({ label: 'Front at ' + 'ABC'[k], value: S.t >= arrival(p, k) ? arrival(p, k).toFixed(1) : '—', unit: S.t >= arrival(p, k) ? 'h' : '' }))).concat([
      { label: 'Speed = distance ÷ time', value: sp ? sp.toFixed(0) : '—', unit: sp ? 'km/h' : '', flag: sp ? 'accent' : null }, { label: 'Station spacing', value: String(p.spacing), unit: 'km' }]); }
    const F = frontOf(p); return [
      { label: 'Slope tan α (Margules)', value: '1:' + fmtN(1 / F.slope), unit: '' }, { label: 'Front speed', value: (F.speed * 3.6).toFixed(0), unit: 'km/h' }, { label: 'Lift w = U tan α', value: (F.lift * 100).toFixed(1), unit: 'cm/s' },
      { label: 'Cloud base 125(T − Td)', value: fmtN(F.base), unit: 'm' }, { label: 'Cloud top', value: (F.top / 1000).toFixed(1), unit: 'km', hint: F.unstable ? 'cumulonimbus' : 'layered' },
      { label: 'Rain', value: F.R.toFixed(1), unit: 'mm/h', flag: 'accent' }, { label: 'Lasting', value: isFinite(F.hours) ? F.hours.toFixed(1) : '∞', unit: 'h' }, { label: 'Total', value: isFinite(F.total) ? F.total.toFixed(0) : '—', unit: 'mm' }];
  }
  function equation(S) {
    const p = fp(S.p);
    if (p.setup === 'masses') { const A = S.A, here = pathAt(PATHS[p.path], A.s); return 'd<i>T</i>/d<i>t</i> = (<i>T</i><sub>surface</sub> − <i>T</i>) ÷ τ: (' + SURF[here.surf][p.season] + ' − ' + A.T.toFixed(1) + ') ÷ ' + (SURF[here.surf][p.season] > A.T ? '0.6 d (warmed from below: fast)' : '2.5 d (cooled from below: slow)') + ' → <b>' + A.T.toFixed(1) + ' °C</b>'; }
    if (p.setup === 'highs') { const mx = (p.lx + p.hx) / 2, my = (p.ly + p.hy) / 2, gr = gradAt(p, mx, my), gp = Math.hypot(gr[0], gr[1]) * 100; return '<i>V</i><sub>g</sub> = Δ<i>P</i> ÷ (ρ <i>f</i> Δ<i>n</i>) = ' + gp.toFixed(2) + ' hPa ÷ (1.2 × ' + Math.abs(fOf(p)).toExponential(2) + ' × 100 km) = <b>' + geostrophic(gp, 100, p.lat).toFixed(1) + ' m/s</b>, along the isobars'; }
    if (p.setup === 'track') return 'speed = distance ÷ time = ' + p.spacing + ' km ÷ ' + (p.spacing / p.trackSpeed).toFixed(1) + ' h = <b>' + p.trackSpeed + ' km/h</b> (found from the records)';
    const F = frontOf(p); return 'tan α = (<i>f</i> <i>T̄</i> / <i>g</i>) · Δ<i>v</i>/Δ<i>T</i> = (1.03×10⁻⁴ × ' + ((p.Tw + p.Tc) / 2 + 273.15).toFixed(0) + ' / 9.81) × ' + p.shear + ' / ' + (p.Tw - p.Tc) + ' = <b>1:' + fmtN(1 / F.slope) + '</b> · base = 125 × (' + p.Tw + ' − ' + p.Tdw + ') = <b>' + fmtN(F.base) + ' m</b>';
  }
  const EQ_NOTE = S => ({
    masses: '<b>An air mass is a large body of air with the same temperature and moisture throughout</b>, set by where it sat. It changes slowly as it moves: warmed from below it overturns and changes fast; cooled from below it goes still and changes slowly. The time constants here are the model’s, chosen to match typical day-scale changes; the lake-effect rule is the forecasters’.',
    highs: '<b>Wind does not blow straight from high to low.</b> Away from the ground the pressure push and the Coriolis effect balance and the wind runs along the isobars; friction near the ground slows it and turns it in toward the low. Near the equator f → 0 and there is no balance.',
    cold: '<b>Margules’ slope</b> is the balance of a sloping front between two air masses; real cold fronts are steepened near the ground by friction. The rain rate is the moisture the lift condenses — a lower bound: storm cells gather it into heavier cores.',
    warm: '<b>A warm front is shallow</b> — 1 km up for every 200 km — so its cloud arrives a day ahead as cirrus, thickens through altostratus to nimbostratus, and rain falls steadily for many hours before the front reaches the ground.',
    occluded: '<b>In an occlusion the faster cold front overtakes the warm front</b> and lifts the warm air off the ground; the storm is ageing. A stationary front moves neither way; the warm air slides up it for as long as it stays, and rain can go on for days.',
    track: '<b>A front is found in the data</b>: the moment the temperature falls, the dew point drops, the wind veers and the pressure turns from falling to rising. Three stations in a line give two time differences — and the front’s speed.'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = (...v) => S => v.includes(S.p.setup);
  L.register({
    id: 'g6d-fronts',
    grade: 6, unit: '6D', topics: ['D4'],
    subject: 'earth',
    name: 'Air Masses and Fronts',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-5', 'CAST'],
    weight: 'Core',
    stageHint: 'Drag the H and the L on the map · the sections are drawn with heights stretched ×58',
    autoplay: true,
    lede: 'Weather changes when air masses move and meet. Send <b>continental polar</b> air over the Great Lakes and watch it pick up the water that falls as <b>lake-effect snow</b>; send Gulf air north in winter and watch it turn to fog. Drag a <b>high</b> and a <b>low</b> across a real map of North America and see the wind spiral between them. ' +
      'Then cut through a <b>cold</b>, a <b>warm</b> and an <b>occluded</b> front: their slopes from Margules’ balance, the cloud base from the dew point, the rain from the moisture the lift condenses — and track a front across three stations to find its speed.',

    params: preset({}),
    presets: [
      { name: 'cP over the Great Lakes: lake-effect snow', params: preset({}) },
      { name: 'The same air in summer', params: preset({ season: 'summer' }) },
      { name: 'Gulf air north in winter: fog', params: preset({ path: 'mtnorth' }) },
      { name: 'Pacific air over the Rockies: wrung dry', params: preset({ path: 'mprockies', mLapse: 1 }) },
      { name: 'An arctic outbreak', params: preset({ path: 'arctic', mLapse: 1 }) },
      { name: 'A deep low and a strong high', params: preset({ setup: 'highs', low: 970, high: 1040 }) },
      { name: 'Over the ocean: less friction', params: preset({ setup: 'highs', surface: 'ocean' }) },
      { name: 'The southern hemisphere', params: preset({ setup: 'highs', hemi: 'south' }) },
      { name: 'Near the equator', params: preset({ setup: 'highs', lat: 10 }) },
      { name: 'A squall-line cold front', params: preset({ setup: 'cold' }) },
      { name: 'A cold front into stable air', params: preset({ setup: 'cold', clapse: 4 }) },
      { name: 'A warm front: a day of steady rain', params: preset({ setup: 'warm' }) },
      { name: 'A warm front with dry warm air', params: preset({ setup: 'warm', wTdw: 6 }) },
      { name: 'An occlusion', params: preset({ setup: 'occluded' }) },
      { name: 'A stationary front', params: preset({ setup: 'occluded', occl: 'stationary' }) },
      { name: 'Track a cold front, 40 km/h', params: preset({ setup: 'track' }) },
      { name: 'A fast front, stations 200 km apart', params: preset({ setup: 'track', trackSpeed: 65, spacing: 200, tLapse: 2 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The air mass', when: is('masses'), items: [
        { key: 'path', type: 'select', label: 'Send', restructure: true, options: Object.keys(PATHS).map(k => ({ value: k, label: PATHS[k].name })) },
        { key: 'season', type: 'select', label: 'Season', restructure: true, options: [{ value: 'winter', label: 'winter' }, { value: 'summer', label: 'summer' }] },
        { key: 'speed', label: 'Moving at', min: 3, max: 20, step: 1, unit: 'm/s', restructure: true },
        { key: 'mLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.25, label: '6 hours a second' }, { value: 1, label: 'a day a second' }] } ] },
      { group: 'The pressure map', when: is('highs'), items: [
        { key: 'low', label: 'The low', min: 950, max: 1010, step: 1, unit: 'hPa', restructure: true },
        { key: 'high', label: 'The high', min: 1016, max: 1050, step: 1, unit: 'hPa', restructure: true },
        { key: 'lat', label: 'Latitude', min: 5, max: 70, step: 1, unit: '°', restructure: true },
        { key: 'hemi', type: 'select', label: 'Hemisphere', restructure: true, options: [{ value: 'north', label: 'northern' }, { value: 'south', label: 'southern' }] },
        { key: 'surface', type: 'select', label: 'Over', restructure: true, options: [{ value: 'land', label: 'land' }, { value: 'ocean', label: 'ocean' }] } ] },
      ...['cold', 'warm', 'occluded'].map(su => { const a = FPRE[su]; return { group: 'The air masses', when: is(su), items: [
        { key: 'occl', type: 'select', label: 'Front', restructure: true, when: is('occluded'), options: [{ value: 'occluded', label: 'occluded' }, { value: 'stationary', label: 'stationary' }] },
        { key: a + 'Tw', label: 'Warm air', min: 5, max: 32, step: 1, unit: '°C', restructure: true },
        { key: a + 'Tdw', label: 'Its dew point', min: -10, max: 30, step: 1, unit: '°C', restructure: true },
        { key: a + 'Tc', label: 'Cold air', min: -25, max: 25, step: 1, unit: '°C', restructure: true },
        { key: a + 'lapse', label: 'Warm air cools with height', min: 3, max: 9.5, step: 0.5, unit: '°C/km', restructure: true },
        { key: a + 'shear', label: 'Wind change across the front', min: 5, max: 50, step: 1, unit: 'm/s', restructure: true },
        { key: a + 'fspeed', label: 'Front moves at', min: 2, max: 20, step: 1, unit: 'm/s', restructure: true, when: S => !(S.p.setup === 'occluded' && S.p.occl === 'stationary') },
        { key: 'fLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'an hour a second' }, { value: 4, label: '4 hours a second' }] } ] }; }),
      { group: 'The stations', when: is('track'), items: [
        { key: 'trackSpeed', label: 'Front speed (to find!)', min: 10, max: 80, step: 1, unit: 'km/h', restructure: true },
        { key: 'spacing', label: 'Stations apart', min: 100, max: 500, step: 10, unit: 'km', restructure: true },
        { key: 'x0', label: 'Front starts', min: -400, max: 0, step: 10, unit: 'km', restructure: true },
        { key: 'tLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'an hour a second' }, { value: 2, label: '2 hours a second' }, { value: 4, label: '4 hours a second' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ masses: 'The air mass along its path', highs: 'Pressure and wind from L to H', track: 'Temperature at the three stations', cold: 'Rain across the section', warm: 'Rain across the section', occluded: 'Rain across the section' })[S.p.setup], draw: plot1 },
      { title: S => ({ masses: 'Every source region', highs: 'Wind for this gradient, at every latitude', track: 'Arrival against distance', cold: 'Front slope against the temperature contrast', warm: 'Front slope against the temperature contrast', occluded: 'Front slope against the temperature contrast' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · a weather map', params: preset({ setup: 'highs' }),
        q: 'Isobars are 4 hPa apart and 300 km apart at 45° N. With V = ΔP ÷ (ρ f Δn), ρ = 1.2 kg/m³ and f = 2Ω sin 45° = 1.03 × 10⁻⁴ /s, how fast is the wind above the friction layer?',
        predict: { label: 'Geostrophic wind', unit: 'm/s', tol: 0.02 },
        measure: () => geostrophic(4, 300, 45),
        working: 'V = 400 Pa ÷ (1.2 × 1.03×10⁻⁴ × 300,000 m) = <b>10.8 m/s</b>, blowing along the isobars. Closer isobars, stronger wind.' },
      { source: 'NGSS MS-ESS2-5 · clouds at a front', params: preset({ setup: 'cold', cTw: 18, cTdw: 15 }),
        q: 'The warm air is 18 °C with a dew point of 15 °C. Lifted, it cools about 8 °C a kilometre faster than its dew point drops — about 125 m for each degree of difference. How high is the cloud base?',
        predict: { label: 'Cloud base', unit: 'm', tol: 0.02 },
        measure: S => LCL(fp(S.p).Tw, fp(S.p).Tdw),
        working: '125 m × (18 − 15) = <b>375 m</b>. Damp air makes low cloud; with a dew point of 6 °C the base would be 1.5 km up.' },
      { source: 'Margules (1906) · the slope of a front', params: preset({ setup: 'cold' }),
        q: 'At 45° N, warm air at 18 °C meets cold air at 4 °C, and the wind changes by 40 m/s across the front. With tan α = (f T̄ ÷ g)(Δv ÷ ΔT), what is the slope?',
        predict: { label: 'Slope 1 :', unit: '', tol: 0.02 },
        measure: S => 1 / margules(fp(S.p)),
        working: 'tan α = (1.03×10⁻⁴ × 284 ÷ 9.81) × 40 ÷ 14 = 0.0085, a rise of 1 in <b>117</b>: 1 km up for every 117 km across.' },
      { source: 'CAST pattern · tracking a front', params: preset({ setup: 'track' }),
        q: 'The front reaches station B at 12.5 h and station C, 300 km further east, at 20.0 h. How fast is it moving?',
        predict: { label: 'Front speed', unit: 'km/h', tol: 0.02 },
        measure: S => S.p.spacing / (arrival(S.p, 2) - arrival(S.p, 1)),
        working: '300 km ÷ 7.5 h = <b>40 km/h</b>. A town 200 km beyond C can expect it 5 hours later.' },
      { source: 'CAST pattern · predicting rainfall', params: preset({ setup: 'warm' }),
        q: 'Ahead of a warm front, steady rain of about 1.0 mm an hour falls across a band 600 km wide moving at 25 km/h. Roughly how much rain does a town get?',
        predict: { label: 'Total rain', unit: 'mm', tol: 0.05 },
        measure: S => frontOf(fp(S.p)).total,
        working: 'The band takes 600 ÷ 25 = 24 hours to pass: about 1.0 mm/h × 24 h, the rate easing toward the band’s far edge — <b>23–24 mm</b>, twice a squall line’s heavy but brief burst.' }
    ],

    walkthrough: [
      { title: 'Where does a cold wave come from?', ask: 'Continental polar air leaves northern Canada at −18 °C. Is it still that cold when it reaches the Great Lakes?', reveal: 'Warmer, but still well below freezing: the ground it crosses is frozen too. Its dew point stays very low — it is dry air.', params: preset({ mLapse: 0.25 }) },
      { title: 'Snow from a lake', ask: 'The lakes are 4 °C. What happens to −20 °C air crossing them?', reveal: 'The warm water heats it from below and evaporates into it; the air overturns and dumps the water as snow on the downwind shores — lake-effect snow, when the lake is 13 °C or more warmer than the air 1.5 km up.', params: preset({ mLapse: 1 }) },
      { title: 'Which way round the low?', ask: 'Watch the tracers. Do they blow straight into the L?', reveal: 'No — they spiral in, counter-clockwise in the northern hemisphere. Earth’s rotation turns moving air to the right; friction lets it drift in toward low pressure, where it rises into cloud.', params: preset({ setup: 'highs' }) },
      { title: 'Flip the hemisphere', ask: 'Switch to the southern hemisphere. What changes?', reveal: 'The swirl reverses: clockwise round a low, anticlockwise round a high. The physics is the same; the Coriolis effect turns air to the left there.', params: preset({ setup: 'highs', hemi: 'south' }) },
      { title: 'Why are cold fronts violent?', ask: 'Compare the cold front with the warm front. Which lifts the warm air faster?', reveal: 'The cold front: steeper (1:117 against 1:187) and faster, so the warm air rises several times faster — a narrow band of towering cumulonimbus and brief, heavy rain.', params: preset({ setup: 'cold' }) },
      { title: 'Signs of a warm front', ask: 'A warm front is 500 km away. What do you see in the sky already?', reveal: 'High, thin cirrus and cirrostratus, then thickening altostratus — the frontal surface is hundreds of km ahead of the front on the ground.', params: preset({ setup: 'warm' }) },
      { title: 'Find the front in the data', ask: 'Look at station B’s record. How do you know the moment the front passed?', reveal: 'The temperature dropped about 8 °C, the dew point fell, the wind swung from south-west to north-west, and the pressure stopped falling and rose.', params: preset({ setup: 'track', tLapse: 2 }) }
    ],

    quiz: [
      { q: 'An air mass that formed over the Gulf of Mexico is', options: ['warm and humid (mT)', 'cold and dry (cP)', 'warm and dry (cT)', 'cold and humid (mP)'], answer: 0, why: 'Maritime (m) = over water, humid; tropical (T) = warm.' },
      { q: 'In the northern hemisphere, surface winds around a low-pressure centre blow', options: ['counter-clockwise and inward', 'clockwise and outward', 'straight inward', 'clockwise and inward'], answer: 0, why: 'Coriolis turns them right; friction lets them drift in toward the low.' },
      { q: 'A cold front usually brings', options: ['a narrow band of heavy showers and then cooler, drier air', 'a day of light drizzle and warmer air', 'no clouds', 'fog that lasts for days'], answer: 0, why: 'Steep and fast: rapid lift, cumulonimbus, a brief downpour; the cold air behind is drier.' },
      { q: 'High pressure usually brings clear skies because the air', options: ['sinks and warms', 'rises and cools', 'is full of water', 'moves very fast'], answer: 0, why: 'Air flows out of a high at the ground and sinks from above; sinking air warms and its clouds evaporate.' },
      { q: 'Three stations in a line, 300 km apart, record a front at 2 pm, 9 pm and 4 am. The front moves at about', options: ['43 km/h', '300 km/h', '7 km/h', '100 km/h'], answer: 0, why: '300 km in 7 hours ≈ 43 km/h — distance ÷ time between arrivals.' }
    ],

    notes: '<p><b>Air masses</b> take the temperature and moisture of their source: maritime (humid) or continental (dry), tropical (warm), polar or arctic (cold). Moving, they are slowly changed by what they cross.</p>' +
      '<p><b>Highs and lows.</b> Air flows from high to low pressure, but Earth’s rotation turns it: in the northern hemisphere it spirals counter-clockwise into lows (rising air, clouds, rain) and clockwise out of highs (sinking air, clear skies).</p>' +
      '<p><b>Fronts</b> are boundaries between air masses. At a cold front cold air pushes under warm air steeply: towering clouds, brief heavy rain, then cooler, drier air. At a warm front warm air slides up over cold air gently: a long sequence of cloud and steady rain, then warmer, humid air. An occluded front forms when a cold front catches a warm front; a stationary front stops moving.</p>' +
      '<p><b>Tracking.</b> A front shows in station records as a sudden change in temperature, dew point, wind direction and pressure tendency; arrival times at known distances give its speed.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “A front is a wall of air.” It is a gently sloping surface — 1 km up for every 100–200 km across. And “cold fronts make it cold because cold air comes down from the sky” — the cold air arrives sideways, along the ground, wedging under the warm air.</div>'
  });


  L.models = L.models || {};
  L.models['g6d-fronts'] = { es, dewOf, qOf, MASSES, SURF, PATHS, kmBetween, pathLen, pathAt, airStart, airStep, TAU_H,
    fieldOf, pressureAt, gradAt, windAt, divAt, fOf, geostrophic, FRICT, margules, LCL, MOIST, frontOf, stationRecord, arrival };
})(window.InsightLab);
