/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-5  Unequal Heating
   (D5.1 Angle of sunlight and latitude; D5.2 Land versus water heating
    rates; D5.3 Altitude; D5.4 Albedo; D5.5 Day, night and the combined
    pattern)

     angle     — a lamp on a tilting black card: the same beam spread over
                 more card at a slant (the cosine law) and the card's own
                 energy balance; then the Sun on the curved Earth — daily
                 insolation for any latitude and date (the textbook
                 formula), with the air's longer path at low sun (Meinel).
     landwater — two trays under identical heat lamps: dry sand, heated in
                 a thin skin and conducting slowly down (a 1-D conduction
                 grid), against water mixed through its depth and cooled by
                 evaporation; read them with thermometers, and with a
                 thermal camera.
     altitude  — climb a mountain with a thermometer: the air cools at the
                 lapse rate; the freezing level and the snowline; why the
                 equator's mountains wear snow.
     albedo    — patches of snow, sand, grass, asphalt, water and black
                 card under the lamp, each settling where absorbed sunlight
                 balances what it loses — through a thermal camera.
     combined  — four surfaces through three days of sunshine and night:
                 the force-restore surface model (Deardorff 1978), with each
                 surface's albedo, heat capacity and evaporation, under a
                 chosen latitude, date and cloud.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.R3, MEAS, BENCH, TERRAIN, G6D, KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;
  const SIG = 5.670e-8, S0 = 1361;
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));
  const rhoSat = Tc => es(Tc) / (461.5 * (Tc + 273.15));            // kg/m³
  const K4 = Tc => Math.pow(Tc + 273.15, 4);

  /* ============================================================
     ANGLE — the cosine law, and daily insolation on the curved Earth
     ============================================================ */
  const declination = day => 23.44 * Math.sin(TAU * (284 + day) / 365);   // degrees (Cooper 1969)
  function dailyInsolation(latDeg, day) {                          // W/m², 24-hour mean at the top of the atmosphere
    const phi = latDeg * Math.PI / 180, d = declination(day) * Math.PI / 180, dist = 1 + 0.033 * Math.cos(TAU * day / 365);
    const x = -Math.tan(phi) * Math.tan(d), h0 = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x);
    return S0 * dist / Math.PI * (h0 * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(h0));
  }
  const noonElev = (latDeg, day) => 90 - Math.abs(latDeg - declination(day));
  const airMass = elevDeg => elevDeg <= 0 ? Infinity : 1 / (Math.sin(elevDeg * Math.PI / 180) + 0.50572 * Math.pow(elevDeg + 6.07995, -1.6364));   // Kasten & Young (1989)
  const beamAtGround = elevDeg => elevDeg <= 0 ? 0 : S0 * Math.pow(0.7, Math.pow(airMass(elevDeg), 0.678)) * Math.sin(elevDeg * Math.PI / 180);   // Meinel & Meinel: on level ground
  /* the lamp on the card: power per unit card area at incidence θ (from the card's normal); the card's steady temperature */
  const LAMP = { I0: 900 };                                         // W/m² straight on, the card at 30 cm
  function cardTemp(alpha, flux, Ta, h, wet) {                     // solve (1 − α)·flux = h(T − Ta) + εσ(T⁴ − Ta⁴) [+ evaporation] by bisection
    let lo = Ta - 15, hi = Ta + 300;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, f = (1 - alpha) * flux - h * (m - Ta) - 0.95 * SIG * (K4(m) - K4(Ta)) - (wet ? 2.45e6 * (h / 1100) * Math.max(0, rhoSat(m) - 0.5 * rhoSat(Ta)) : 0); if (f > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ============================================================
     LAND AND WATER — two trays under heat lamps
     ============================================================ */
  const SAND = { k: 0.30, c: 830, rho: 1540, rc: 1.28e6, alpha: 0.35, depth: 0.05, n: 20 };   // dry sand: W/(m·K), J/(m³·K)
  const WATER = { c: 4186, rc: 4.18e6, alpha: 0.08, depth: 0.05 };
  const hOf = u => 6 + 4 * u;                                         // W/(m²·K)
  function traysStart(p) { const Ta = p.room; return { t: 0, sand: new Array(SAND.n).fill(Ta), water: Ta, E: 0, hist: [] }; }
  function traysStep(T, p, dt) {
    const Ta = p.room, on = t => t < p.lampMin * 60, h = hOf(p.fan), dz = SAND.depth / SAND.n;
    const n = Math.max(1, Math.ceil(dt / 2)), step = dt / n, kap = SAND.k / SAND.rc, sub = Math.max(1, Math.ceil(step * kap / (0.4 * dz * dz)));
    for (let k = 0; k < n; k++) {
      const I1 = on(T.t) ? p.lampI : 0;
      for (let s = 0; s < sub; s++) {
        const hh = step / sub, S = T.sand, Ts = S[0];
        const q0 = (1 - (p.wetSand ? 0.2 : SAND.alpha)) * I1 - h * (Ts - Ta) - 0.95 * SIG * (K4(Ts) - K4(Ta)) - (p.wetSand ? 2.45e6 * (h / 1100) * Math.max(0, rhoSat(Ts) - 0.5 * rhoSat(Ta)) : 0);
        const rc = SAND.rc * (p.wetSand ? 2 : 1), k2 = SAND.k * (p.wetSand ? 4 : 1);
        const nw = S.slice();
        nw[0] += hh * (q0 / (dz) + k2 * (S[1] - S[0]) / (dz * dz)) / rc;
        for (let i = 1; i < SAND.n - 1; i++) nw[i] += hh * k2 * (S[i + 1] - 2 * S[i] + S[i - 1]) / (dz * dz) / rc;
        nw[SAND.n - 1] += hh * k2 * (S[SAND.n - 2] - S[SAND.n - 1]) / (dz * dz) / rc;   // an insulated tray bottom
        T.sand = nw;
      }
      // the water: mixed through its depth (convection), absorbing almost all the lamp, cooled by air, radiation and evaporation
      const Tw = T.water, E = (h / 1100) * Math.max(0, rhoSat(Tw) - p.rh / 100 * rhoSat(Ta));   // kg/(m²·s), Chilton–Colburn
      const q = (1 - WATER.alpha) * I1 - h * (Tw - Ta) - 0.96 * SIG * (K4(Tw) - K4(Ta)) - 2.45e6 * E;
      T.water += q * step / (WATER.rc * WATER.depth);
      T.E = E; T.t += step;
    }
    return T;
  }
  const sandAt = (T, depthCm) => { const i = clamp(Math.round(depthCm / 100 / (SAND.depth / SAND.n)), 0, SAND.n - 1); return T.sand[i]; };

  /* ============================================================
     ALTITUDE — the lapse rate up a mountain
     ============================================================ */
  const LAPSE = { dry: 9.8, standard: 6.5, moist: 5.0 };             // K/km
  const tempAt = (p, zKm) => p.T0 - LAPSE[p.lapseKind] * zKm;
  const freezingLevel = p => p.T0 / LAPSE[p.lapseKind];             // km
  const MOUNTAINS = { kilimanjaro: { name: 'Kilimanjaro', h: 5.895, lat: -3.1, T0: 25 }, everest: { name: 'Everest', h: 8.849, lat: 28, T0: 22 }, whitney: { name: 'Mount Whitney', h: 4.421, lat: 36.6, T0: 18 }, rainier: { name: 'Mount Rainier', h: 4.392, lat: 46.9, T0: 10 } };

  /* ============================================================
     ALBEDO — patches under the lamp
     ============================================================ */
  const SURFACES = {
    snow: { name: 'fresh snow', a: 0.85, col: '#F4F8FC', eps: 0.98 },
    sand: { name: 'dry sand', a: 0.40, col: '#D8BE8A', eps: 0.90 },
    grass: { name: 'grass', a: 0.25, col: '#5E9A3C', eps: 0.97 },
    soil: { name: 'dark soil', a: 0.10, col: '#4A3626', eps: 0.95 },
    asphalt: { name: 'asphalt', a: 0.05, col: '#2A2C30', eps: 0.95 },
    water: { name: 'water', a: 0.06, col: '#2E6A9A', eps: 0.96 }
  };
  const PATCH_C = 4500;                                                // J/(m²·K): a thin sample on a foam backing
  function patchesStart(p) { const o = {}; Object.keys(SURFACES).forEach(k => { o[k] = p.room; }); return { t: 0, T: o }; }
  function patchesStep(P, p, dt) {
    const n = Math.max(1, Math.ceil(dt / 2)), h = dt / n, H = hOf(0.3);
    for (let k = 0; k < n; k++) {
      Object.keys(SURFACES).forEach(s => {
        const S = SURFACES[s], T = P.T[s], a = s === 'snow' ? S.a : S.a;
        let q = (1 - a) * p.lampI2 - H * (T - p.room) - S.eps * SIG * (K4(T) - K4(p.room));
        if (s === 'water') q -= 2.45e6 * (H / 1100) * Math.max(0, rhoSat(T) - 0.5 * rhoSat(p.room));
        const C = s === 'water' ? 4.18e6 * 0.01 : PATCH_C;            // the water dish is 1 cm deep
        P.T[s] = T + q * h / C;
      });
      P.t += h;
    }
    return P;
  }
  const patchSteady = (s, I, Ta) => cardTemp(SURFACES[s].a, I, Ta, hOf(0.3), s === 'water');

  /* ============================================================
     COMBINED — force-restore surface temperatures through day and night (Deardorff 1978)
     ============================================================ */
  const LAND = {
    /* evap: the share of the available energy that goes into evaporation (a Bowen ratio of 0.05–20); hH: how well the
       surface hands heat to the air — a rough forest canopy far better than smooth sand */
    desert: { name: 'desert sand', a: 0.35, k: 0.3, rc: 1.3e6, evap: 0.05, hH: 8, col: '#D8BE8A' },
    grass: { name: 'grassland', a: 0.23, k: 1.0, rc: 2.2e6, evap: 0.75, hH: 14, col: '#6AA048' },
    forest: { name: 'forest', a: 0.13, k: 1.2, rc: 2.4e6, evap: 0.8, hH: 30, col: '#2E6A3A' },
    ocean: { name: 'ocean (top 5 m stirred by waves)', a: 0.07, mixed: 5, evap: 0.9, hH: 12, col: '#2E6A9A' }
  };
  function sunAt(p, tHours) {                                      // W/m² on level ground at hour t of day p.day
    const phi = p.lat * Math.PI / 180, d = declination(p.day) * Math.PI / 180, h = (tHours % 24 - 12) / 24 * TAU;
    const sinE = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h), e = Math.asin(clamp(sinE, -1, 1)) * 180 / Math.PI;
    return beamAtGround(e) * 1.15 * (1 - 0.75 * Math.pow(p.cloud / 8, 3.4));   // direct + about 15 % diffuse; Kasten–Czeplak cloud
  }
  function dayRun(p, kind) {                                         // three days, the last one returned hour by hour
    const S = LAND[kind], tau = 86400, Ta0 = p.airT, out = [];
    let Ts = Ta0, Td = Ta0;
    const dt = 90;                                                  // divides 900 s, so a row every 15 minutes
    for (let t = 0; t < 3 * 86400; t += dt) {
      const hr = t / 3600, Sg = sunAt(p, hr), Ta = Ta0 + 3 * Math.sin(TAU * (hr - 9) / 24);
      const eAir = 0.7 + 0.02 * p.cloud;                             // the sky's emissivity: clouds send heat back down
      const Rn = (1 - S.a) * Sg + eAir * SIG * K4(Ta) - 0.97 * SIG * K4(Ts);
      const H = S.hH * (Ts - Ta), avail = Math.max(0, Rn - H);
      // land: evaporation takes a fixed share of the available energy; the sea evaporates day and night by the bulk formula (wind 6 m/s, air 75 % humid)
      const LE = S.mixed ? Math.max(0, 2.45e6 * 1.2 * 1.3e-3 * 6 * 0.622 / 101325 * (es(Ts) - 0.75 * es(Ta))) : S.evap * avail;
      const G = Rn - H - LE;
      if (S.mixed) Ts += G * dt / (4.18e6 * S.mixed) - (Ts - Ta0) * dt / 86400;   // the stirred top mixes with the cooler water below over about a day
      else {
        const d1 = Math.sqrt(S.k / S.rc * tau / Math.PI);           // the depth the daily wave reaches
        Ts += (2 * Math.sqrt(Math.PI) / (S.rc * d1) * G - TAU / tau * (Ts - Td)) * dt;
        Td += G * dt / (S.rc * d1 * Math.sqrt(365 * Math.PI)) * 0;      // the deep soil holds its temperature over three days
      }
      if (t >= 2 * 86400 && t % 900 === 0) out.push([hr - 48, Ts, Ta, Sg, H, LE, (1 - S.a) * Sg]);
    }
    return out;
  }
  const DAYC = {};
  function dayOf(p, kind) { const key = [kind, p.lat, p.day, p.cloud, p.airT].join('|'); return DAYC[key] || (DAYC[key] = dayRun(p, kind)); }
  const rangeOf = rows => { const v = rows.map(r => r[1]); return Math.max(...v) - Math.min(...v); };

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'angle', label: 'A lamp at a slant, the Sun on a sphere', teaches: ['D5.1'] },
    { value: 'landwater', label: 'Sand and water under the same lamp', teaches: ['D5.2'] },
    { value: 'altitude', label: 'Climb a mountain with a thermometer', teaches: ['D5.3'] },
    { value: 'albedo', label: 'Six surfaces through a thermal camera', teaches: ['D5.4'] },
    { value: 'combined', label: 'Three days, four surfaces', teaches: ['D5.5'] }
  ];
  const BASE = {
    setup: 'angle', tilt: 0, cardA: 0.05, lat: 40, day: 172, aLapse: 10,
    room: 20, lampI: 600, lampMin: 30, fan: 0, rh: 50, wetSand: false, lwLapse: 60, view: 'eye',
    mountain: 'kilimanjaro', T0: 25, lapseKind: 'standard', hike: 2.5,
    lampI2: 600, abLapse: 30,
    cloud: 1, airT: 25, cLapse: 2
  };
  const preset = o => Object.assign({}, BASE, o);
  const HOMES = {
    angle: { theta: -1.2, phi: 0.62, dist: 0.8, target: [0.0, -0.1, 0.1] },
    landwater: { theta: -1.8, phi: 0.42, dist: 0.95, target: [0.0, 0, 0.12] },
    altitude: { theta: -1.75, phi: 0.25, dist: 30, target: [0, 0, 3.6] },
    albedo: { theta: -1.75, phi: 0.62, dist: 0.95, target: [0.0, 0, 0.08] },
    combined: { theta: -1.85, phi: 0.5, dist: 30, target: [0, 0, 0.5] }
  };
  const homeOf = (p, narrow) => { const h = HOMES[p.setup]; return Object.assign({}, h, { dist: h.dist * (narrow ? 1.35 : 1) }); };
  function setup(S) {
    const p = S.p;
    if (!S.cam || S.camFor !== p.setup) { const h = homeOf(p, !!S._narrow); S.cam = Camera(Object.assign({ fov: 0.9 }, h, { target: h.target.slice() })); S.cam.minDist = h.dist * 0.4; S.cam.maxDist = h.dist * 3; S.camFor = p.setup; S._narrowCam = !!S._narrow; }
    S.ta = 0; S.t = 0; S.hist = [];
    if (p.setup === 'angle') { S.Tc = p.room; S.hist.push([0, S.Tc]); }
    if (p.setup === 'landwater') { S.tr = traysStart(p); S.hist.push([0, S.tr.sand[0], sandAt(S.tr, 1), S.tr.water]); }
    if (p.setup === 'combined') S.t = 8;
    if (p.setup === 'albedo') { S.pa = patchesStart(p); S.hist.push([0].concat(Object.keys(SURFACES).map(k => S.pa.T[k]))); }
  }
  const cardFlux = p => LAMP.I0 * Math.cos(p.tilt * Math.PI / 180);
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'angle') {
      const h = dt * p.aLapse, eq = cardTemp(p.cardA, cardFlux(p), p.room, hOf(0.2));
      S.Tc += (eq - S.Tc) * (1 - Math.exp(-h / 90)); S.t += h;                // a thin card settles in about a minute and a half
      if (S.t - S.hist[S.hist.length - 1][0] >= 5) S.hist.push([S.t, S.Tc]);
    } else if (p.setup === 'landwater') {
      if (S.tr.t < 7200) traysStep(S.tr, p, dt * p.lwLapse);
      if (S.tr.t - S.hist[S.hist.length - 1][0] >= 15) S.hist.push([S.tr.t, S.tr.sand[0], sandAt(S.tr, 1), S.tr.water]);
    } else if (p.setup === 'albedo') {
      if (S.pa.t < 7200) patchesStep(S.pa, p, dt * p.abLapse);
      if (S.pa.t - S.hist[S.hist.length - 1][0] >= 10) S.hist.push([S.pa.t].concat(Object.keys(SURFACES).map(k => S.pa.T[k])));
    } else if (p.setup === 'combined') S.t = (S.t + dt * p.cLapse) % 24;
    else S.t += dt;
    while (S.hist.length > 1200) S.hist.splice(1, 1);
  }

  /* ---------------- helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const dateSay = d => { const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], L0 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let k = 0, dd = Math.round(d); while (k < 11 && dd > L0[k]) { dd -= L0[k]; k++; } return dd + ' ' + m[k]; };
  let G3 = null;
  function placeView(S, g, fx, fy) { const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = HOMES[S.p.setup].target; cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy]; cam.update(); }
  function room(g) { const ctx = g.ctx, gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, '#1B2230'); gr.addColorStop(0.55, '#141A25'); gr.addColorStop(1, '#0C1018'); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h); }
  function drawLabels(g, cam, lab, xMax) {
    if (!g.labels) return;
    const ctx = g.ctx, K = kit(), boxes = [], narrow = g.w < K.NARROW;
    (narrow ? lab.slice(0, 3) : lab).forEach(([at, text, dx, dy, col]) => {
      const q = cam.project(at); if (!q.ok || q.x < 4 || q.x > xMax) return;
      const ey = clamp(q.y + dy * (narrow ? 0.6 : 1), K.HDR + (narrow ? 40 : 14), g.h - 34), ex = q.x + dx * (narrow ? 0.6 : 1);
      ctx.save(); ctx.font = mono(9.5, 600); const tw = ctx.measureText(text).width; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > xMax - 4) left = true;
      const t = K.fitText(ctx, text, Math.max(40, left ? ex - 9 : xMax - 9 - ex)), w2 = ctx.measureText(t).width, bx0 = left ? ex - 3 - w2 : ex + 3;
      let yy = ey; for (let k = 0; k < 6 && boxes.some(b => bx0 < b[2] && bx0 + w2 > b[0] && Math.abs(yy - b[1]) < 12); k++) yy += 13; boxes.push([bx0, yy, bx0 + w2]);
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, yy); ctx.stroke();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.88)'; ctx.strokeText(t, ex + (left ? -3 : 3), yy); ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), yy); ctx.restore();
    });
  }
  function cardRows(g, x, y, w, title, rows, o) {
    o = o || {};
    const ctx = g.ctx, K = kit(), lh = 15, h = 26 + rows.length * lh + (o.foot ? 26 : 6);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13);
    rows.forEach((r, i) => { const yy = y + 30 + i * lh; ctx.font = mono(9.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], w * 0.56), x + 9, yy); ctx.font = mono(9.5, 600); ctx.fillStyle = r[2] || '#F2F6FF'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], w * 0.42), x + w - 9, yy); });
    if (o.foot) { ctx.font = mono(8.5); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; K.wrapText(ctx, o.foot, x + 9, y + h - 20, w - 18, 11, 2); }
    ctx.restore(); return h;
  }
  const IRSPAN = { lo: 15, hi: 65, room: 20 };
  function irText(ctx, T, big, small, x, y) {
    const light = (T - IRSPAN.lo) / (IRSPAN.hi - IRSPAN.lo) > 0.6;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = light ? '#05080F' : '#FFFFFF'; ctx.strokeStyle = light ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.6)'; ctx.lineWidth = 2.5;
    ctx.font = mono(11, 700); ctx.strokeText(big, x, y); ctx.fillText(big, x, y); ctx.font = mono(8.5); ctx.strokeText(small, x, y + 14); ctx.fillText(small, x, y + 14); ctx.restore();
  }

  /* ---------------- angle ---------------- */
  function benchAngle(S, F, lab) {
    const p = S.p, th = p.tilt * Math.PI / 180;
    MEAS.bench(F, -0.45, 0.45, -0.3, 0.3, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.45, 0.45, 0.3, 0, 0.6);
    // a hinged board: its near edge on the bench, tilted back by θ from facing the lamp straight on
    const W = 0.24, Hb = 0.2, hinge = [0, -0.05, 0.02], up = [0, Math.sin(th), Math.cos(th)];
    const c0 = [hinge[0] - W / 2, hinge[1], hinge[2]], c1 = [hinge[0] + W / 2, hinge[1], hinge[2]], c2 = [c1[0], c1[1] + up[1] * Hb, c1[2] + up[2] * Hb], c3 = [c0[0], c0[1] + up[1] * Hb, c0[2] + up[2] * Hb];
    R3.box(F, [0, -0.05, 0.01], [0.3, 0.06, 0.02], '#6A4A2E', { ambient: 0.5 });
    G3.face(F, [c0, c1, c2, c3], p.cardA < 0.2 ? '#1A1C20' : '#E8E6E0', { ambient: 0.5 });
    // the beam's footprint: one lamp beam, spread over more card the more the card turns away
    const ctr = [0, hinge[1] + up[1] * Hb / 2, hinge[2] + up[2] * Hb / 2], rx = 0.05, ry = 0.05 / Math.max(0.12, Math.cos(th));
    F.push(ctr, () => {
      const ctx = F.ctx, pts = [];
      for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, v = [Math.cos(a) * rx, Math.sin(a) * ry]; pts.push(F.cam.project([ctr[0] + v[0], ctr[1] + up[1] * v[1], ctr[2] + up[2] * v[1]])); }
      if (pts.some(q => !q.ok)) return;
      ctx.save(); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath();
      const c = F.cam.project(ctr), k = Math.cos(th), gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(...pts.map(q => Math.hypot(q.x - c.x, q.y - c.y))));
      gr.addColorStop(0, 'rgba(255,240,190,' + (0.5 * k).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,220,150,' + (0.25 * k).toFixed(2) + ')'); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.restore();
    }, -0.02);
    const lampAt = [0.0, -0.32, 0], aim = ctr;
    G3.lamp(F, lampAt, aim, 0.9);
    // a protractor at the hinge, and the infrared thermometer pointed at the card
    F.push([0.14, -0.05, 0.1], () => { const ctx = F.ctx, o = F.cam.project([0.13, -0.05, 0.02]); if (!o.ok) return; ctx.save(); ctx.strokeStyle = 'rgba(230,236,250,.8)'; ctx.lineWidth = 1; for (let d = 0; d <= 90; d += 10) { const a = d * Math.PI / 180, q = F.cam.project([0.13, -0.05 + Math.sin(a) * 0.07, 0.02 + Math.cos(a) * 0.07]); if (q.ok) { ctx.beginPath(); ctx.moveTo(o.x + (q.x - o.x) * 0.85, o.y + (q.y - o.y) * 0.85); ctx.lineTo(q.x, q.y); ctx.stroke(); } } ctx.restore(); }, -0.03);
    BENCH.meter(F, [0.25, -0.2, 0.06], [0, -1, 0.35], 0.1, 0.05, { title: 'IR thermometer', value: S.Tc.toFixed(1), unit: '°C', colour: '#FFC56B' });
    lab.push([ctr, 'beam spread over ' + (1 / Math.max(0.01, Math.cos(th))).toFixed(2) + '× the area', 50, -50, '#FFE0A0']);
    lab.push([[0.13, -0.05, 0.08], 'card tilted ' + p.tilt + '° from facing the lamp', 40, 20]);
  }
  /* the Sun's parallel rays on the round Earth: equal beams cover more ground toward the poles */
  function sphereCard(S, g, x, y, w) {
    const p = S.p, ctx = g.ctx, K = kit(), h = w * 0.98;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText('Sunlight on a sphere, ' + dateSay(p.day), x + 9, y + 13);
    const cx = x + w * 0.6, cy = y + 30 + (h - 92) / 2, R = Math.min(w * 0.3, (h - 100) / 2), d = declination(p.day) * Math.PI / 180;
    const ax = [-Math.sin(d), -Math.cos(d)], pr = [Math.cos(d), -Math.sin(d)];              // the axis (north up, leaning to the Sun in June) and across it
    const at = (la, side) => { const f = la * Math.PI / 180; return [cx + R * (Math.sin(f) * ax[0] + side * Math.cos(f) * pr[0]), cy + R * (Math.sin(f) * ax[1] + side * Math.cos(f) * pr[1])]; };
    const gr = ctx.createRadialGradient(cx - R * 0.5, cy - R * 0.3, R * 0.1, cx, cy, R); gr.addColorStop(0, '#5AA0E0'); gr.addColorStop(1, '#0E2E5A');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,10,.6)'; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();   // night: the half away from the Sun
    ctx.lineWidth = 1;
    [-66.5, -23.4, 0, 23.4, 66.5].forEach(la => { const a = at(la, -1), b = at(la, 1); ctx.strokeStyle = la === 0 ? 'rgba(255,214,107,.6)' : 'rgba(255,255,255,.22)'; ctx.setLineDash(la === 0 ? [] : [2, 3]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(cx + ax[0] * R * 1.2, cy + ax[1] * R * 1.2); ctx.lineTo(cx - ax[0] * R * 1.2, cy - ax[1] * R * 1.2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = mono(8.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'center'; ctx.fillText('N', cx + ax[0] * R * 1.32, cy + ax[1] * R * 1.32);
    // two equal bundles of parallel rays: one at the sub-solar point, one at the chosen latitude; the lit ground they cover
    const bundle = (yy, col) => {
      const band = R * 0.16, ys = [yy - band / 2, yy + band / 2]; if (ys.some(v => Math.abs(v - cy) >= R)) return null;
      const hit = v => cx - Math.sqrt(R * R - (v - cy) * (v - cy));
      ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      for (let k = 0; k <= 4; k++) { const v = ys[0] + (ys[1] - ys[0]) * k / 4; ctx.beginPath(); ctx.moveTo(x + 8, v); ctx.lineTo(hit(v), v); ctx.stroke(); }
      const nA = v => v < 0 ? v + TAU : v, a0 = nA(Math.atan2(ys[0] - cy, hit(ys[0]) - cx)), a1 = nA(Math.atan2(ys[1] - cy, hit(ys[1]) - cx));   // the left limb sits near π: no wrap-around
      ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
      return Math.abs(a1 - a0) * R;
    };
    const ss = at(p.day ? declination(p.day) : 0, -1), here = at(p.lat, -1);
    const l0 = bundle(ss[1], 'rgba(255,236,160,.9)'), lit = Math.abs(p.lat) <= 90 && here[0] <= cx + 0.5 ? bundle(here[1], 'rgba(255,150,80,.95)') : null;
    ctx.fillStyle = '#FF9650'; ctx.beginPath(); ctx.arc(here[0], here[1], 3.5, 0, TAU); ctx.fill();
    ctx.font = mono(9); ctx.textAlign = 'left'; ctx.fillStyle = '#C9D4EA';
    const ne = noonElev(p.lat, p.day);
    ctx.fillText(ne > 0 ? 'the same beam lights ' + (l0 && lit ? (lit / l0).toFixed(2) : (1 / Math.max(0.01, Math.sin(ne * Math.PI / 180))).toFixed(2)) + '× the ground at ' + p.lat + '°' : 'at ' + p.lat + '° the Sun stays below the horizon', x + 9, y + h - 48);
    ctx.fillText('noon Sun at ' + p.lat + '°: ' + Math.max(0, ne).toFixed(0) + '° up', x + 9, y + h - 34);
    ctx.fillText('a day’s sunlight: ' + dailyInsolation(p.lat, p.day).toFixed(0) + ' W/m² (equator ' + dailyInsolation(0, p.day).toFixed(0) + ')', x + 9, y + h - 20);
    ctx.fillText('the Sun is overhead at ' + Math.abs(declination(p.day)).toFixed(1) + '° ' + (declination(p.day) >= 0 ? 'N' : 'S'), x + 9, y + h - 6);
    ctx.restore();
  }

  /* ---------------- land and water ---------------- */
  function benchLandWater(S, F, lab, ir) {
    const p = S.p, T = S.tr, on = T.t < p.lampMin * 60;
    MEAS.bench(F, -0.45, 0.45, -0.3, 0.3, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.45, 0.45, 0.3, 0, 0.6);
    const trays = [[-0.13, 'sand'], [0.13, 'water']];
    trays.forEach(([x, k]) => {
      const Tt = k === 'sand' ? T.sand[0] : T.water, col = k === 'sand' ? (p.wetSand ? '#A0784A' : '#D8BE8A') : '#3A7AB8';
      R3.box(F, [x, 0, 0.03], [0.18, 0.13, 0.06], ir ? MEAS.irc(ir, Tt - 4, 0.9, '#888') : '#E8ECEF', { ambient: 0.5 });
      G3.face(F, [[x - 0.085, -0.06, 0.061], [x + 0.085, -0.06, 0.061], [x + 0.085, 0.06, 0.061], [x - 0.085, 0.06, 0.061]], ir ? MEAS.irc(ir, Tt, k === 'water' ? 0.96 : 0.9, col) : col, { ambient: 0.6, flat: !!ir });
      G3.glassTube(F, [[x + 0.05, -0.02, 0.05], [x + 0.06, -0.02, 0.2]], 0.004, { fill: [{ from: 0, to: 0.03 + 0.1 * clamp((Tt - 10) / 50, 0, 1), col: '#D8302C' }], inner: 0.55 });
      G3.lamp(F, [x, 0.22, 0], [x, 0, 0.065], on ? 0.85 : 0);
      lab.push([[x - 0.05, -0.06, 0.06], (k === 'sand' ? (p.wetSand ? 'wet sand' : 'dry sand') : 'water') + ' · ' + Tt.toFixed(1) + ' °C', k === 'sand' ? -40 : 40, 40, k === 'sand' ? '#FFC56B' : '#8FC8FF']);
    });
    if (p.fan > 0) G3.fan(F, [0, -0.25, 0], [0, 1, 0], p.fan, S.ta * 20, { R: 0.05, h: 0.1 });
    lab.push([[0, 0.22, 0.3], on ? 'two identical lamps, ' + p.lampI + ' W/m² each' : 'lamps off: cooling', 40, -30]);
  }
  function traysCard(S, g, x, y, w) {
    const T = S.tr, ctx = g.ctx, K = kit(), h = 236;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('Thermal camera, and the sand cut open', x + 9, y + 13);
    const iw = (w - 30) / 2, ih = 70, iy = y + 26;
    [['sand', T.sand[0], x + 10], ['water', T.water, x + 20 + iw]].forEach(([k, Tt, xx]) => {
      ctx.fillStyle = MEAS.irc(IRSPAN, Tt, k === 'water' ? 0.96 : 0.9); ctx.fillRect(xx, iy, iw, ih);
      irText(ctx, Tt, Tt.toFixed(1) + ' °C', k, xx + iw / 2, iy + ih / 2);
    });
    // the sand's temperature with depth: the heat stays near the top
    const px = x + 10, py = iy + ih + 22, pw = w - 30, ph = h - (py - y) - 14;
    ctx.fillStyle = '#C9D4EA'; ctx.font = mono(8.5); ctx.textAlign = 'left'; ctx.fillText('sand, top to 5 cm down', px, py - 8);
    T.sand.forEach((Tt, i) => { ctx.fillStyle = MEAS.irc(IRSPAN, Tt, 0.9); ctx.fillRect(px, py + i * ph / T.sand.length, pw * 0.7, ph / T.sand.length + 0.5); });
    [0, 1, 2, 3, 4, 5].forEach(cm => { const yy = py + cm / 5 * ph; ctx.fillStyle = '#C9D4EA'; ctx.fillText(cm + ' cm · ' + sandAt(T, cm).toFixed(1) + ' °C', px + pw * 0.72 + 4, Math.min(py + ph - 4, yy + 4)); });
    MEAS.irScale(ctx, x + w - 18, iy, 8, ih, IRSPAN.lo, IRSPAN.hi);
    ctx.restore();
  }

  /* ---------------- altitude ---------------- */
  let PEAK = {};
  function peakBlock(m) {
    if (PEAK[m]) return PEAK[m];
    const H = MOUNTAINS[m].h;
    PEAK[m] = window.TERRAIN.block({ n: 46, size: 40, zBase: -0.6, height: (x, y) => { const r = Math.hypot(x, y * 1.2); return Math.max(0, H * Math.exp(-r * r / 70) + 0.25 * Math.sin(x * 0.7) * Math.cos(y * 0.6) * Math.exp(-r * r / 200)) + 0.2; } });
    return PEAK[m];
  }
  function drawAltitude(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), W = g.w, narrow = W < K.NARROW, M = MOUNTAINS[p.mountain], fl = freezingLevel(p);
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, '#2C5A9A'); gr.addColorStop(1, '#AFC8E2'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 20 : 14);
    const B = peakBlock(p.mountain), T = window.TERRAIN, items = [], rr = G3.rng(4);
    for (let k = 0; k < 80; k++) { const x = -18 + rr() * 36, y = -18 + rr() * 36, z = B.zAt(x, y); if (tempAt(p, z) < 6 || z > 4) continue; items.push({ at: [x, y, z], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(3, 0.6 * q.s), { kind: 'conifer', seed: k }) }); }
    T.draw(ctx, cam, B, { cover: (i, j, x, y, z) => { const Tz = tempAt(p, z); return Tz < 0 ? [240, 244, 250] : Tz < 4 ? [140, 132, 120] : Tz < 10 ? TERRAIN.mixc([120, 130, 80], [140, 132, 120], 0.5) : [96, 140, 64]; }, items, layers: [{ col: [110, 96, 82], pat: 'rock', top: (x, y, zs) => zs }] });
    // the freezing level: a faint plane across the mountain
    const plane = [[-20, -20, fl], [20, -20, fl], [20, 20, fl], [-20, 20, fl]].map(q => cam.project(q));
    if (fl > 0 && fl < 9 && plane.every(q => q.ok)) { ctx.save(); ctx.fillStyle = 'rgba(160,210,255,.12)'; ctx.strokeStyle = 'rgba(160,210,255,.6)'; ctx.setLineDash([6, 4]); ctx.beginPath(); plane.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // the hiker: a flag on the slope at the chosen height, with a thermometer reading
    const hz = Math.min(p.hike, M.h), hx = -Math.sqrt(Math.max(0, -70 * Math.log(Math.max(1e-6, (hz - 0.2) / M.h)))), hp = [hx, 0, B.zAt(hx, 0)];
    const q = cam.project(hp), qt = cam.project([hx, 0, hp[2] + 1.2]);
    if (q.ok && qt.ok) { ctx.save(); ctx.strokeStyle = '#2A2A2A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(qt.x, qt.y); ctx.stroke(); ctx.fillStyle = '#E8402C'; ctx.beginPath(); ctx.moveTo(qt.x, qt.y); ctx.lineTo(qt.x + 14, qt.y + 5); ctx.lineTo(qt.x, qt.y + 10); ctx.closePath(); ctx.fill(); ctx.restore(); g.handle(qt.x, qt.y + 5, 16, 'hiker'); S._hikeAxis = { y0: cam.project([0, 0, 0]).y, y1: cam.project([0, 0, M.h]).y }; }
    if (g.labels) {
      if (qt.ok) G3.tag(ctx, hz > M.h - 0.6 ? qt.x - 6 : qt.x + 18, hz > M.h - 0.6 ? qt.y + 24 : qt.y, fmtN(hz * 1000) + ' m · ' + tempAt(p, hz).toFixed(1) + ' °C', '#FFE0A0');
      const qs = cam.project([0, 0, M.h + 0.2]); if (qs.ok) G3.tag(ctx, qs.x + 10, qs.y - 6, M.name + ' summit ' + fmtN(M.h * 1000) + ' m · ' + tempAt(p, M.h).toFixed(1) + ' °C', '#E6EEF8');
      const qf = cam.project([0, -20, fl]); if (qf.ok && fl > 0 && fl < 9) G3.tag(ctx, clamp(qf.x, 120, W - (narrow ? 20 : 290)), clamp(qf.y, K.HDR + 30, g.h - 40), 'freezing level ' + fmtN(fl * 1000) + ' m', '#BFE0FF', { align: 'right' });
    }
    const at = K.cardSlot(g, S, 'a thermometer every kilometre', 240, { x: W - 250, y: K.HDR + 6 });
    if (at) { const rows = []; for (let z = 0; z <= Math.ceil(M.h); z++) rows.push([fmtN(z * 1000) + ' m', tempAt(p, z).toFixed(1) + ' °C', tempAt(p, z) < 0 ? '#BFE0FF' : '#FFC56B']); cardRows(g, at.x, at.y, at.w, M.name + ', ' + Math.abs(M.lat) + '° ' + (M.lat >= 0 ? 'N' : 'S'), rows.reverse(), { foot: 'The air is heated from the ground: the higher you go, the further from the heater and the thinner the blanket of air above.' }); }
  }

  /* ---------------- albedo ---------------- */
  function benchAlbedo(S, F, lab, ir) {
    const p = S.p, keys = Object.keys(SURFACES);
    MEAS.bench(F, -0.45, 0.45, -0.3, 0.3, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.45, 0.45, 0.3, 0, 0.6);
    keys.forEach((k, i) => {
      const x = -0.22 + (i % 3) * 0.22, y = i < 3 ? 0.07 : -0.09, T = S.pa.T[k], Sf = SURFACES[k];
      R3.box(F, [x, y, 0.012], [0.16, 0.12, 0.024], ir ? MEAS.irc(ir, (T + p.room) / 2, 0.9, '#888') : '#C8CCD0', { ambient: 0.5 });
      G3.face(F, [[x - 0.075, y - 0.055, 0.0245], [x + 0.075, y - 0.055, 0.0245], [x + 0.075, y + 0.055, 0.0245], [x - 0.075, y + 0.055, 0.0245]], ir ? MEAS.irc(ir, T, Sf.eps, Sf.col) : Sf.col, { ambient: 0.6, flat: !!ir });
      lab.push([[x, y - 0.055, 0.025], Sf.name + ' · reflects ' + (Sf.a * 100).toFixed(0) + ' % · ' + T.toFixed(1) + ' °C', i % 3 === 0 ? -70 : i % 3 === 2 ? 70 : 0, i < 3 ? (i % 3 === 1 ? -95 : -50) : 50]);
    });
    G3.lamp(F, [0, 0.36, 0], [0, 0, 0.03], 0.9);
  }

  /* ---------------- combined: four surfaces through the day ---------------- */
  let STRIP = null;
  function stripBlock() { if (STRIP) return STRIP; STRIP = window.TERRAIN.block({ n: 40, size: 40, zBase: -1.5, height: (x, y) => x > 10 ? -0.4 : 0.1 * Math.sin(x * 0.5) * Math.cos(y * 0.4) }); return STRIP; }
  const zoneOf = x => x < -10 ? 'desert' : x < 0 ? 'grass' : x < 10 ? 'forest' : 'ocean';
  function drawCombined(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), W = g.w, narrow = W < K.NARROW, hr = S.t, ir = p.view === 'ir' ? IRSPAN : null;
    const Sg = sunAt(p, hr), day = clamp(Sg / 600, 0, 1);
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, RX.mix('#070C18', '#3E70B8', day)); gr.addColorStop(1, RX.mix('#121A2A', '#B8D0E8', day)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 20 : 20);
    const at = k => { const rows = dayOf(p, k); return rows[Math.min(rows.length - 1, Math.floor(hr * 4))][1]; };
    const Ts = { desert: at('desert'), grass: at('grass'), forest: at('forest'), ocean: at('ocean') };
    const span = { lo: Math.min(...Object.values(Ts)) - 3, hi: Math.max(...Object.values(Ts)) + 3, room: p.airT };
    const B = stripBlock(), T = window.TERRAIN, items = [], rr = G3.rng(9);
    for (let k = 0; k < 140; k++) { const x = 0.5 + rr() * 9, y = -19 + rr() * 38; items.push({ at: [x, y, B.zAt(x, y)], draw: (c2, q) => { if (ir) { c2.fillStyle = MEAS.irc(span, Ts.forest, 0.97); c2.beginPath(); c2.arc(q.x, q.y - 0.5 * q.s, 0.35 * q.s, 0, TAU); c2.fill(); } else T.tree(c2, q.x, q.y, Math.max(3, 1.3 * q.s), { kind: k % 2 ? 'conifer' : 'broad', seed: k }); } }); }
    T.draw(ctx, cam, B, {
      cover: (i, j, x) => { const z = zoneOf(x); if (ir) { const c = MEAS.irc(span, Ts[z], 0.95); return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; } return z === 'desert' ? [216, 190, 138] : z === 'grass' ? [106, 160, 72] : z === 'forest' ? [46, 100, 52] : [46, 106, 154]; },
      water: (i, j, x) => x > 10 ? 0 : null, waterCol: () => { if (ir) { const c = MEAS.irc(span, Ts.ocean, 0.96); return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; } return [40, 100, 150]; },
      items, sea: 0, layers: [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }]
    });
    // the Sun on its arc across the sky
    const h = (hr - 12) / 24 * TAU, el = Math.asin(clamp(Math.sin(p.lat * Math.PI / 180) * Math.sin(declination(p.day) * Math.PI / 180) + Math.cos(p.lat * Math.PI / 180) * Math.cos(declination(p.day) * Math.PI / 180) * Math.cos(h), -1, 1));
    if (el > 0) { const q = cam.project([-30 * Math.sin(h), 30, 3 + 16 * Math.sin(el)]); if (q.ok) { const sg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 40); sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.25, 'rgba(255,230,150,.7)'); sg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = sg; ctx.fillRect(q.x - 40, q.y - 40, 80, 80); } }
    if (p.cloud > 0 && window.GEO) { const cr = G3.rng(2); for (let k = 0; k < p.cloud * 2; k++) { const q = cam.project([-30 + cr() * 60, -10 + cr() * 30, 10 + cr() * 4]); if (q.ok) window.GEO.cloud(ctx, q.x, q.y, 120, 50, k + 1, 0.8, [230 * (0.5 + 0.5 * day), 232 * (0.5 + 0.5 * day), 240 * (0.5 + 0.5 * day)]); } }
    if (g.labels) ['desert', 'grass', 'forest', 'ocean'].forEach((z, i) => { const q = cam.project([-15 + i * 10, -9, 0.3]); if (q.ok) G3.tag(ctx, clamp(q.x, 70, g.w - 70), Math.min(q.y + 14, g.h - 48), LAND[z].name.split(' (')[0] + ' · ' + Ts[z].toFixed(1) + ' °C', '#FFE0A0', { align: 'center' }); });
    // the energy each surface takes in and hands on, now
    ['desert', 'grass', 'forest', 'ocean'].forEach((z, i) => {
      const rw = dayOf(p, z), r = rw[Math.min(rw.length - 1, Math.floor(hr * 4))], q = cam.project([-15 + i * 10, 2, 0.3]); if (!q.ok) return;
      const k = 70 / 600, arrow = (x0, v, col, down) => { const L = Math.min(110, Math.abs(v) * k); if (L < 3) return; const y0 = down ? q.y - L - 8 : q.y - 6, y1 = down ? q.y - 8 : q.y - 6 - L; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1 + (down ? -6 : 6)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 - 6, y1 + (down ? -7 : 7)); ctx.lineTo(x0 + 6, y1 + (down ? -7 : 7)); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill(); };
      ctx.save(); arrow(q.x - 14, r[6], 'rgba(255,214,107,.95)', true); arrow(q.x, Math.max(0, r[4]), 'rgba(255,110,90,.95)', false); arrow(q.x + 14, r[5], 'rgba(120,190,255,.95)', false); ctx.restore();
    });
    // the breeze the contrast drives: land warmer than the sea by day draws sea air in; at night it reverses
    { const dT = (Ts.forest + Ts.grass) / 2 - Ts.ocean, a = cam.project([16, -2, 1.2]), b = cam.project([4, -2, 1.2]);
      if (a.ok && b.ok && Math.abs(dT) > 0.5) {
        const [f, t] = dT > 0 ? [a, b] : [b, a], an = Math.atan2(t.y - f.y, t.x - f.x);
        ctx.save(); ctx.strokeStyle = ctx.fillStyle = 'rgba(235,245,255,.92)'; ctx.lineWidth = clamp(2 + Math.abs(dT) / 3, 2, 7); ctx.setLineDash([10, 6]); ctx.lineDashOffset = -S.ta * 30;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(t.x + Math.cos(an) * 10, t.y + Math.sin(an) * 10); ctx.lineTo(t.x + Math.cos(an + 2.5) * 13, t.y + Math.sin(an + 2.5) * 13); ctx.lineTo(t.x + Math.cos(an - 2.5) * 13, t.y + Math.sin(an - 2.5) * 13); ctx.closePath(); ctx.fill(); ctx.restore();
        if (g.labels) G3.tag(ctx, (a.x + b.x) / 2, Math.min(a.y, b.y) - 16, (dT > 0 ? 'sea breeze' : 'land breeze') + ': the land is ' + Math.abs(dT).toFixed(1) + ' °C ' + (dT > 0 ? 'warmer' : 'cooler'), '#EAF4FF', { align: 'center' });
      } }
    if (ir && !narrow) MEAS.irScale(ctx, 20, K.HDR + 20, 10, 140, span.lo, span.hi);
    const cs = K.cardSlot(g, S, 'the surfaces now', 250, { x: W - 260, y: K.HDR + 6 });
    if (cs) cardRows(g, cs.x, cs.y, cs.w, String(Math.floor(hr)).padStart(2, '0') + ':' + String(Math.floor(hr % 1 * 60)).padStart(2, '0') + ' · now · day range', ['desert', 'grass', 'forest', 'ocean'].map(z => [LAND[z].name.split(' (')[0], Ts[z].toFixed(1) + ' · ' + rangeOf(dayOf(p, z)).toFixed(0) + ' °C', z === 'ocean' ? '#8FC8FF' : z === 'desert' ? '#FFC56B' : '#7CF0B0']), { foot: 'Arrows: sunlight absorbed (yellow), heat to the air (red), evaporation (blue). Sunshine ' + Sg.toFixed(0) + ' W/m².' });
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = window.G6D;
    if (!K || !G3) return;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { const h = homeOf(p, S._narrow); S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist }; S._narrowCam = S._narrow; }
    if (p.setup === 'altitude') { drawAltitude(S, g); headerOf(S, g); return; }
    if (p.setup === 'combined') { drawCombined(S, g); headerOf(S, g); return; }
    room(g);
    const narrow = S._narrow, cam = S.cam, ir = p.view === 'ir' ? IRSPAN : null;
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 24 : 16);
    const F = R3.Frame(g.ctx, cam, { floorZ: 0, ambient: 0.3 }), lab = [];
    if (p.setup === 'angle') benchAngle(S, F, lab);
    else if (p.setup === 'landwater') benchLandWater(S, F, lab, ir);
    else benchAlbedo(S, F, lab, ir);
    F.render();
    drawLabels(g, cam, lab, narrow ? g.w : g.w - 285);
    const W = g.w;
    if (p.setup === 'angle') { const at = K.cardSlot(g, S, 'sunlight on a sphere', 260, { x: W - 270, y: K.HDR + 6 }); if (at) sphereCard(S, g, at.x, at.y, at.w); }
    else if (p.setup === 'landwater') { const at = K.cardSlot(g, S, 'thermal camera', 260, { x: W - 270, y: K.HDR + 6 }); if (at) traysCard(S, g, at.x, at.y, at.w); }
    else { const at = K.cardSlot(g, S, 'thermal camera', 260, { x: W - 270, y: K.HDR + 6 }); if (at) albedoCard(S, g, at.x, at.y, at.w); }
    headerOf(S, g);
  }
  function albedoCard(S, g, x, y, w) {
    const p = S.p, ctx = g.ctx, K = kit(), keys = Object.keys(SURFACES), h = 220;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('Through a thermal camera', x + 9, y + 13);
    const cw = (w - 40) / 3, ch = 66;
    keys.forEach((k, i) => { const xx = x + 10 + (i % 3) * (cw + 5), yy = y + 26 + Math.floor(i / 3) * (ch + 6), T = S.pa.T[k]; ctx.fillStyle = MEAS.irc(IRSPAN, T, SURFACES[k].eps); ctx.fillRect(xx, yy, cw, ch); irText(ctx, T, T.toFixed(1) + ' °C', SURFACES[k].name, xx + cw / 2, yy + ch / 2 - 6); });
    MEAS.irScale(ctx, x + w - 22, y + 26, 8, 2 * ch + 6, IRSPAN.lo, IRSPAN.hi);
    ctx.fillStyle = '#98A6C6'; ctx.font = mono(8.5); ctx.textAlign = 'left'; K.wrapText(ctx, 'Light surfaces reflect the lamp and stay cool; dark ones absorb it. Water absorbs well but evaporates and stores heat.', x + 9, y + h - 34, w - 18, 11, 3);
    ctx.restore();
  }
  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'hiker' && S._hikeAxis) { const M = MOUNTAINS[p.mountain], dz = -e.dy / Math.max(20, S._hikeAxis.y0 - S._hikeAxis.y1) * M.h * 0.7; p.hike = clamp(Math.round((p.hike + dz) * 100) / 100, 0, M.h); }
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function headerOf(S, g) {
    const p = S.p, K = kit(); let a = '', b = '', c = '';
    if (p.setup === 'angle') { a = 'At ' + p.tilt + '° the same beam spreads over ' + (1 / Math.max(0.01, Math.cos(p.tilt * Math.PI / 180))).toFixed(2) + '× the card: each square cm gets ' + (Math.cos(p.tilt * Math.PI / 180) * 100).toFixed(0) + ' % as much'; b = 'card ' + S.Tc.toFixed(1) + ' °C (it settles at ' + cardTemp(p.cardA, cardFlux(p), p.room, hOf(0.2)).toFixed(1) + ') · on Earth at ' + p.lat + '° on ' + dateSay(p.day) + ': noon Sun ' + noonElev(p.lat, p.day).toFixed(0) + '° up, ' + dailyInsolation(p.lat, p.day).toFixed(0) + ' W/m² a day'; c = 'flux on the card = I₀ cos θ · ×' + p.aLapse + ' time-lapse'; }
    else if (p.setup === 'landwater') { const T = S.tr, on = T.t < p.lampMin * 60; a = (on ? 'Lamps on: ' : 'Lamps off: ') + 'sand ' + T.sand[0].toFixed(1) + ' °C at its surface, water ' + T.water.toFixed(1) + ' °C — ' + (on ? 'the sand races ahead' : 'the sand cools fastest too'); b = 'sand 1 cm down ' + sandAt(T, 1).toFixed(1) + ' °C, 4 cm down ' + sandAt(T, 4).toFixed(1) + ' °C · water evaporating ' + (T.E * 3600 * 1000).toFixed(0) + ' g/m² an hour'; c = Math.floor(T.t / 60) + ' min · lamps ' + p.lampMin + ' min at ' + p.lampI + ' W/m² · ×' + p.lwLapse; }
    else if (p.setup === 'altitude') { const M = MOUNTAINS[p.mountain]; a = 'At ' + fmtN(Math.min(p.hike, M.h) * 1000) + ' m it is ' + tempAt(p, Math.min(p.hike, M.h)).toFixed(1) + ' °C — ' + (LAPSE[p.lapseKind] * Math.min(p.hike, M.h)).toFixed(1) + ' °C colder than at sea level'; b = 'sea level ' + p.T0 + ' °C · cooling ' + LAPSE[p.lapseKind] + ' °C per km · freezing level ' + fmtN(freezingLevel(p) * 1000) + ' m · summit ' + tempAt(p, M.h).toFixed(1) + ' °C'; c = M.name + ', latitude ' + M.lat + '° · drag the flag up the slope'; }
    else if (p.setup === 'albedo') { const ks = Object.keys(SURFACES), T = S.pa.T, hot = ks.reduce((u, k) => T[k] > T[u] ? k : u, ks[0]), cold = ks.reduce((u, k) => T[k] < T[u] ? k : u, ks[0]); a = 'Same lamp, six surfaces: ' + SURFACES[hot].name + ' ' + T[hot].toFixed(1) + ' °C, ' + SURFACES[cold].name + ' ' + T[cold].toFixed(1) + ' °C'; b = 'each settles where the light it absorbs, (1 − albedo) × ' + p.lampI2 + ' W/m², equals what it loses'; c = Math.floor(S.pa.t / 60) + ' min · ×' + p.abLapse; }
    else { const Sg = sunAt(p, S.t); a = String(Math.floor(S.t)).padStart(2, '0') + ':00 — ' + (Sg > 10 ? 'the Sun heats every surface, but not equally' : 'night: every surface cools, the desert fastest') + ' — so the air moves: ' + ((dayOf(p, 'grass')[Math.min(95, Math.floor(S.t * 4))][1] > dayOf(p, 'ocean')[Math.min(95, Math.floor(S.t * 4))][1]) ? 'a sea breeze blows in' : 'a land breeze blows out'); b = 'latitude ' + p.lat + '° · ' + dateSay(p.day) + ' · cloud ' + p.cloud + '/8 · desert ' + rangeOf(dayOf(p, 'desert')).toFixed(0) + ' °C day-to-night, ocean ' + rangeOf(dayOf(p, 'ocean')).toFixed(1) + ' °C'; c = 'force-restore surface model (Deardorff 1978) · ' + p.cLapse + ' hours a second'; }
    K.header(g, a, b, c);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  const SCOL = { snow: '#F4F8FC', sand: '#FFC56B', grass: '#7CF0B0', soil: '#C08A5A', asphalt: '#FF6A5A', water: '#8FC8FF' };
  const LCOL = { desert: '#FFC56B', grass: '#7CF0B0', forest: '#3EB86A', ocean: '#8FC8FF' };
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'angle') {
      const H = S.hist, eq = cardTemp(p.cardA, cardFlux(p), p.room, hOf(0.2)), e0 = cardTemp(p.cardA, LAMP.I0, p.room, hOf(0.2)), tm = Math.max(600, S.t * 1.05), hi = Math.ceil((e0 + 5) / 5) * 5;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: 'the card now' }, { c: 'rgba(255,197,107,.55)', label: 'it settles at', dash: [4, 3] }, { c: 'rgba(201,212,234,.5)', label: 'facing the lamp (0°)', dash: [2, 3] }], (p.cardA < 0.2 ? 'black' : 'white') + ' card');
      const P = g.Plot({ xmin: 0, xmax: tm, ymin: Math.min(p.room - 2, 15), ymax: hi, pad: { t: Kk.t }, xlabel: 'seconds', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(e0, 'rgba(201,212,234,.5)', [2, 3]); P.hline(eq, 'rgba(255,197,107,.55)', [4, 3]); P.line(H.map(q => [q[0], q[1]]), '#FFC56B', 2.4); P.dot(S.t, S.Tc, 5, '#FFC56B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'landwater') {
      const H = S.hist, tm = Math.max(p.lampMin * 2, 60), all = H.flatMap(q => [q[1], q[3]]), hi = Math.ceil((Math.max(p.room + 10, ...all) + 3) / 5) * 5;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: 'sand surface' }, { c: '#C08A5A', label: 'sand 1 cm down', dash: [4, 3] }, { c: '#8FC8FF', label: 'water' }]);
      const P = g.Plot({ xmin: 0, xmax: tm, ymin: Math.floor(p.room - 3), ymax: hi, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.vline(p.lampMin, 'rgba(255,224,160,.45)', [3, 3]); P.tag(p.lampMin, hi - 1, 'lamps off', '#FFE0A0', 'left', 0); P.line(H.map(q => [q[0] / 60, q[1]]), '#FFC56B', 2.4); P.line(H.map(q => [q[0] / 60, q[2]]), '#C08A5A', 1.8, [4, 3]); P.line(H.map(q => [q[0] / 60, q[3]]), '#8FC8FF', 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'altitude') {
      const M = MOUNTAINS[p.mountain], zt = Math.max(9, M.h + 0.5), hz = Math.min(p.hike, M.h), cols = { dry: '#FF8A6A', standard: '#FFD27A', moist: '#7CF0B0' };
      const Kk = K.plotKey(g, Object.keys(LAPSE).map(k => ({ c: cols[k], label: k + ' ' + LAPSE[k] + ' °C/km', w: k === p.lapseKind ? 3 : 1.4 })), 'sea level ' + p.T0 + ' °C');
      const P = g.Plot({ xmin: p.T0 - 9.8 * zt - 2 < -60 ? -60 : p.T0 - 9.8 * zt - 2, xmax: p.T0 + 5, ymin: 0, ymax: zt, pad: { t: Kk.t }, xlabel: 'air temperature, °C', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.vline(0, 'rgba(143,200,255,.5)', [3, 3]); P.hline(M.h, 'rgba(230,238,248,.45)', [4, 3]); P.tag(p.T0 + 4, M.h, M.name, '#E6EEF8', 'right', -8); Object.keys(LAPSE).forEach(k => P.line([[p.T0, 0], [p.T0 - LAPSE[k] * zt, zt]], cols[k], k === p.lapseKind ? 3 : 1.4)); P.dot(tempAt(p, hz), hz, 6, '#E8402C', '#FFFFFF'); P.dot(0, freezingLevel(p), 4.5, '#BFE0FF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'albedo') {
      const H = S.hist, ks = Object.keys(SURFACES), tm = Math.max(30, S.pa.t / 60 * 1.05), hi = Math.ceil((patchSteady('asphalt', p.lampI2, p.room) + 4) / 5) * 5;
      const Kk = K.plotKey(g, ks.map(k => ({ c: SCOL[k], label: SURFACES[k].name })));
      const P = g.Plot({ xmin: 0, xmax: tm, ymin: Math.floor(p.room - 2), ymax: hi, pad: { t: Kk.t }, xlabel: 'minutes under the lamp', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => ks.forEach((k, i) => P.line(H.map(q => [q[0] / 60, q[i + 1]]), SCOL[k], 2.2)));
      Kk.draw(P); return;
    }
    const zs = ['desert', 'grass', 'forest', 'ocean'], rows = zs.map(z => dayOf(p, z)), all = rows.flatMap(r => r.map(q => q[1])).concat(rows[0].map(q => q[2]));
    const lo = Math.floor(Math.min(...all) - 2), hi = Math.ceil(Math.max(...all) + 2);
    const Kk = K.plotKey(g, zs.map(z => ({ c: LCOL[z], label: LAND[z].name.split(' (')[0] })).concat([{ c: 'rgba(201,212,234,.6)', label: 'air', dash: [4, 3] }]));
    const P = g.Plot({ xmin: 0, xmax: 24, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'hour of the day', ylabel: 'surface, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line(rows[0].map(q => [q[0], q[2]]), 'rgba(201,212,234,.6)', 1.4, [4, 3]); rows.forEach((r, i) => P.line(r.map(q => [q[0], q[1]]), LCOL[zs[i]], 2.4)); P.vline(S.t, 'rgba(255,255,255,.45)', [2, 3]); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'angle') {
      const days = [[80, 'Mar 21', '#7CF0B0'], [172, 'Jun 21', '#FFC56B'], [355, 'Dec 21', '#8FC8FF']], cur = [];
      for (let la = -90; la <= 90; la += 1) cur.push([la, dailyInsolation(la, p.day)]);
      const Kk = K.plotKey(g, days.map(d => ({ c: d[2], label: d[1], w: 1.2 })).concat([{ c: '#FFFFFF', label: dateSay(p.day), w: 3 }]), 'top of the air, 24-hour mean');
      const P = g.Plot({ xmin: -90, xmax: 90, ymin: 0, ymax: 600, pad: { t: Kk.t }, xlabel: 'latitude, ° (S − / N +)', ylabel: 'W/m²', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { days.forEach(d => { const pts = []; for (let la = -90; la <= 90; la += 1) pts.push([la, dailyInsolation(la, d[0])]); P.line(pts, d[2], 1.2, [4, 3]); }); P.line(cur, '#FFFFFF', 2.6); P.dot(p.lat, dailyInsolation(p.lat, p.day), 5.5, '#FFC56B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'landwater') {
      const T = S.tr, pts = T.sand.map((v, i) => [i * SAND.depth / SAND.n * 100, v]), hi = Math.ceil((Math.max(p.room + 10, ...T.sand, T.water) + 3) / 5) * 5;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: 'sand, top to bottom' }, { c: '#8FC8FF', label: 'water (stirred by convection)' }], Math.floor(T.t / 60) + ' min');
      const P = g.Plot({ xmin: 0, xmax: 5, ymin: Math.floor(p.room - 3), ymax: hi, pad: { t: Kk.t }, xlabel: 'depth, cm', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.area(pts, Math.floor(p.room - 3), 'rgba(255,197,107,.18)'); P.line(pts, '#FFC56B', 2.4); P.line([[0, T.water], [5, T.water]], '#8FC8FF', 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'altitude') {
      const cols = { dry: '#FF8A6A', standard: '#FFD27A', moist: '#7CF0B0' };
      const Kk = K.plotKey(g, Object.keys(LAPSE).map(k => ({ c: cols[k], label: k, w: k === p.lapseKind ? 3 : 1.4 })), 'freezing level = T₀ ÷ lapse rate');
      const P = g.Plot({ xmin: 0, xmax: 35, ymin: 0, ymax: 9.5, pad: { t: Kk.t }, xlabel: 'sea-level temperature, °C', ylabel: 'freezing level, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { Object.keys(MOUNTAINS).forEach(m => { P.hline(MOUNTAINS[m].h, m === p.mountain ? 'rgba(230,238,248,.7)' : 'rgba(201,212,234,.25)', [4, 3]); P.tag(1, MOUNTAINS[m].h, MOUNTAINS[m].name, m === p.mountain ? '#E6EEF8' : '#8C9AB8', 'left', -7); }); Object.keys(LAPSE).forEach(k => P.line([[0, 0], [35, 35 / LAPSE[k]]], cols[k], k === p.lapseKind ? 3 : 1.4)); P.dot(p.T0, freezingLevel(p), 5.5, '#BFE0FF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'albedo') {
      const pts = []; for (let a = 0; a <= 0.95; a += 0.01) pts.push([a, cardTemp(a, p.lampI2, p.room, hOf(0.3))]);
      const Kk = K.plotKey(g, [{ c: 'rgba(255,255,255,.7)', label: 'a dry surface settles at' }, { c: '#8FC8FF', dot: true, label: 'water: evaporation cools it' }], p.lampI2 + ' W/m²');
      const P = g.Plot({ xmin: 0, xmax: 1, ymin: Math.floor(p.room - 2), ymax: Math.ceil((pts[0][1] + 4) / 5) * 5, pad: { t: Kk.t }, xlabel: 'albedo (share of light reflected)', ylabel: 'steady °C', xfmt: v => (v * 100).toFixed(0) + '%', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, 'rgba(255,255,255,.7)', 2); Object.keys(SURFACES).forEach(k => { const v = patchSteady(k, p.lampI2, p.room); P.dot(SURFACES[k].a, v, 5.5, SCOL[k], '#0B0F18'); P.tag(SURFACES[k].a, v, SURFACES[k].name, SCOL[k], k === 'water' ? 'left' : 'left', k === 'water' ? 12 : -10); }); });
      Kk.draw(P); return;
    }
    const zs = ['desert', 'grass', 'ocean'], cs = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const Kk = K.plotKey(g, zs.map(z => ({ c: LCOL[z], label: LAND[z].name.split(' (')[0] })), 'latitude ' + p.lat + '°, ' + dateSay(p.day));
    const P = g.Plot({ xmin: 0, xmax: 8, ymin: 0, ymax: Math.max(10, Math.ceil(rangeOf(dayOf(Object.assign({}, p, { cloud: 0 }), 'desert')) / 10) * 10 + 5), pad: { t: Kk.t }, xlabel: 'cloud cover, eighths', ylabel: 'day − night range, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => zs.forEach(z => { const pts = cs.map(c => [c, rangeOf(dayOf(Object.assign({}, p, { cloud: c }), z))]); P.line(pts, LCOL[z], 2.2); P.dot(p.cloud, rangeOf(dayOf(p, z)), 5, LCOL[z], '#0B0F18'); }));
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'angle') { const ne = noonElev(p.lat, p.day); return [
      { label: 'Card tilted', value: String(p.tilt), unit: '°' }, { label: 'cos θ', value: (Math.cos(p.tilt * Math.PI / 180) * 100).toFixed(0), unit: '%' },
      { label: 'Light on the card', value: cardFlux(p).toFixed(0), unit: 'W/m²', flag: 'accent' }, { label: 'Card now', value: S.Tc.toFixed(1), unit: '°C' },
      { label: 'Card settles at', value: cardTemp(p.cardA, cardFlux(p), p.room, hOf(0.2)).toFixed(1), unit: '°C' },
      { label: 'Noon Sun at ' + p.lat + '°', value: Math.max(0, ne).toFixed(0), unit: '° up' }, { label: 'Air the noon beam crosses', value: ne > 0 ? airMass(ne).toFixed(2) : '—', unit: ne > 0 ? '× overhead' : '' },
      { label: 'Noon sunshine at the ground', value: beamAtGround(ne).toFixed(0), unit: 'W/m²' }, { label: 'A day’s sunlight (24-h mean)', value: dailyInsolation(p.lat, p.day).toFixed(0), unit: 'W/m²', flag: 'accent' }]; }
    if (p.setup === 'landwater') { const T = S.tr, on = T.t < p.lampMin * 60; return [
      { label: 'Minutes', value: (T.t / 60).toFixed(0), unit: 'min', hint: on ? 'lamps on' : 'lamps off' }, { label: 'Sand surface', value: T.sand[0].toFixed(1), unit: '°C', flag: 'accent' },
      { label: 'Sand 1 cm down', value: sandAt(T, 1).toFixed(1), unit: '°C' }, { label: 'Sand 4 cm down', value: sandAt(T, 4).toFixed(1), unit: '°C' },
      { label: 'Water', value: T.water.toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Sand − water', value: (T.sand[0] - T.water).toFixed(1), unit: '°C' },
      { label: 'Water evaporating', value: (T.E * 3600 * 1000).toFixed(0), unit: 'g/m²·h' }, { label: 'Specific heat: water ÷ sand', value: (WATER.c / SAND.c).toFixed(1), unit: '×' }]; }
    if (p.setup === 'altitude') { const M = MOUNTAINS[p.mountain], hz = Math.min(p.hike, M.h); return [
      { label: 'Hiker at', value: fmtN(hz * 1000), unit: 'm' }, { label: 'Air there', value: tempAt(p, hz).toFixed(1), unit: '°C', flag: 'accent' },
      { label: 'Colder than sea level by', value: (LAPSE[p.lapseKind] * hz).toFixed(1), unit: '°C' }, { label: 'Lapse rate', value: String(LAPSE[p.lapseKind]), unit: '°C/km' },
      { label: 'Freezing level', value: fmtN(freezingLevel(p) * 1000), unit: 'm', flag: 'accent' }, { label: M.name + ' summit', value: tempAt(p, M.h).toFixed(1), unit: '°C' },
      { label: 'Summit height', value: fmtN(M.h * 1000), unit: 'm' }]; }
    if (p.setup === 'albedo') return Object.keys(SURFACES).map(k => ({ label: SURFACES[k].name + ' (' + (SURFACES[k].a * 100).toFixed(0) + ' %)', value: S.pa.T[k].toFixed(1), unit: '°C', flag: k === 'asphalt' || k === 'snow' ? 'accent' : null })).concat([
      { label: 'Lamp', value: String(p.lampI2), unit: 'W/m²' }, { label: 'Minutes', value: (S.pa.t / 60).toFixed(0), unit: 'min' }]);
    const r = { desert: dayOf(p, 'desert'), grass: dayOf(p, 'grass'), forest: dayOf(p, 'forest'), ocean: dayOf(p, 'ocean') }, at = z => r[z][Math.min(r[z].length - 1, Math.floor(S.t * 4))][1];
    return [{ label: 'Time', value: String(Math.floor(S.t)).padStart(2, '0') + ':' + String(Math.floor(S.t % 1 * 60)).padStart(2, '0'), unit: '' }, { label: 'Sunshine', value: sunAt(p, S.t).toFixed(0), unit: 'W/m²' }]
      .concat(['desert', 'grass', 'forest', 'ocean'].map(z => ({ label: LAND[z].name.split(' (')[0], value: at(z).toFixed(1), unit: '°C', hint: 'range ' + rangeOf(r[z]).toFixed(1) }))).concat([
        { label: 'Desert day − night', value: rangeOf(r.desert).toFixed(1), unit: '°C', flag: 'accent' }, { label: 'Ocean day − night', value: rangeOf(r.ocean).toFixed(1), unit: '°C', flag: 'accent' }]);
  }
  function equation(S) {
    const p = S.p;
    if (p.setup === 'angle') return '<i>I</i> = <i>I</i>₀ cos θ = 900 × cos ' + p.tilt + '° = <b>' + cardFlux(p).toFixed(0) + ' W/m²</b> · the card settles where (1 − α)<i>I</i> = <i>h</i>(<i>T</i> − <i>T</i><sub>air</sub>) + εσ(<i>T</i>⁴ − <i>T</i><sub>air</sub>⁴): <b>' + cardTemp(p.cardA, cardFlux(p), p.room, hOf(0.2)).toFixed(1) + ' °C</b>';
    if (p.setup === 'landwater') return 'Δ<i>T</i> = <i>Q</i> ÷ (<i>m c</i>): 1 kg of water needs 4,186 J per °C, dry sand only 830 J — <b>' + (WATER.c / SAND.c).toFixed(1) + '×</b> less; and the sand keeps its heat in a skin about √(κ<i>t</i>) = <b>' + (Math.sqrt(SAND.k / SAND.rc * Math.max(60, S.tr.t)) * 100).toFixed(1) + ' cm</b> deep, while the water mixes it through all 5 cm';
    if (p.setup === 'altitude') { const M = MOUNTAINS[p.mountain], hz = Math.min(p.hike, M.h); return '<i>T</i> = <i>T</i>₀ − Γ<i>z</i> = ' + p.T0 + ' − ' + LAPSE[p.lapseKind] + ' × ' + hz.toFixed(2) + ' km = <b>' + tempAt(p, hz).toFixed(1) + ' °C</b> · freezing level <i>T</i>₀ ÷ Γ = <b>' + freezingLevel(p).toFixed(2) + ' km</b>'; }
    if (p.setup === 'albedo') return 'absorbed = (1 − albedo) × <i>I</i>: fresh snow (1 − 0.85) × ' + p.lampI2 + ' = <b>' + (0.15 * p.lampI2).toFixed(0) + ' W/m²</b>, asphalt (1 − 0.05) × ' + p.lampI2 + ' = <b>' + (0.95 * p.lampI2).toFixed(0) + ' W/m²</b>';
    const Sg = sunAt(p, S.t);
    return '<i>R</i><sub>n</sub> = (1 − α)<i>S</i> + <i>L</i>↓ − <i>L</i>↑ = <i>H</i> + λ<i>E</i> + <i>G</i>: sunshine <b>' + Sg.toFixed(0) + ' W/m²</b> · desert sends 5 % into evaporation, grass 75 %, forest 80 %; the ocean evaporates day and night and stirs the rest through its top 5 m';
  }
  const EQ_NOTE = S => ({
    angle: '<b>The cosine law.</b> A beam of fixed power spread over a surface tilted by θ covers 1/cos θ more area, so each square metre gets cos θ as much. On Earth the Sun is high near the equator and low toward the poles; its beam also crosses more air at a low angle (Kasten & Young air mass; Meinel’s clear-sky beam). The daily insolation is the textbook top-of-atmosphere formula; at the summer pole the 24-hour day beats the equator.',
    landwater: '<b>Why land heats and cools faster than water:</b> water’s specific heat is about five times dry sand’s; light goes metres into water but stops at sand’s surface; water mixes (convection) and evaporates, sand only conducts slowly. The sand is a 20-layer conduction model (k = 0.30 W/m·K); the water tray is well mixed, cooled by air, radiation and evaporation (Chilton–Colburn).',
    altitude: '<b>Air is heated from the ground</b>, and rising air expands and cools. The standard atmosphere cools 6.5 °C a kilometre; dry rising air 9.8 °C; cloudy, saturated air about 5 °C. Real mountains vary with weather and season — the freezing level here is the simple T₀ ÷ Γ.',
    albedo: '<b>Albedo</b> is the share of light a surface reflects: fresh snow 0.8–0.9, sand 0.3–0.4, grass 0.2–0.25, asphalt 0.05 (textbook values). Each patch settles where the absorbed light balances what it loses to the air and as infrared; water, absorbing well, stays cool by evaporating.',
    combined: '<b>Everything at once.</b> Each surface’s skin temperature from the force-restore model (Deardorff 1978): the Sun through the day and cloud, the sky’s infrared, sensible heat to the air, evaporation (a fixed share of the available energy on land, the bulk formula at sea), and storage in the ground (a daily heat wave about √(κτ/π) deep) or the ocean’s wave-stirred top 5 m (deeper still over a season).'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = (...v) => S => v.includes(S.p.setup);
  const traysAfter = (p, sec) => { const T = traysStart(p); traysStep(T, p, sec); return T; };
  L.register({
    id: 'g6d-unequal-heating',
    grade: 6, unit: '6D', topics: ['D5'],
    subject: 'earth',
    name: 'Unequal Heating',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-6 (foundation)', 'CAST'],
    weight: 'Core',
    is3D: true,
    stageHint: 'Drag to look around · in the mountain set-up, drag the red flag up the slope',
    autoplay: true,
    lede: 'The Sun shines on the whole Earth, yet the Earth is not heated evenly — and that unevenness drives every wind and weather. Tilt a card under a lamp and watch the <b>same beam</b> spread and cool it; then see why the <b>equator</b> gets more sunlight than the poles, and why the summer pole briefly beats it. ' +
      'Heat <b>sand and water</b> under identical lamps and look at them through a thermal camera; climb <b>Kilimanjaro</b> with a thermometer; line up snow, sand, grass and asphalt under one lamp; and finally run <b>three days</b> over a desert, a grassland, a forest and the ocean.',

    params: preset({}),
    presets: [
      { name: 'A black card facing the lamp', params: preset({}) },
      { name: 'The same card at 60°: half the light', params: preset({ tilt: 60 }) },
      { name: 'A white card', params: preset({ cardA: 0.8 }) },
      { name: 'The equator at the equinox', params: preset({ lat: 0, day: 80 }) },
      { name: 'The North Pole in June', params: preset({ lat: 90, day: 172, tilt: 67 }) },
      { name: 'Winter at 50° N', params: preset({ lat: 50, day: 355, tilt: 75 }) },
      { name: 'Sand against water, 30 minutes', params: preset({ setup: 'landwater' }) },
      { name: '…through the thermal camera', params: preset({ setup: 'landwater', view: 'ir' }) },
      { name: 'Wet sand against water', params: preset({ setup: 'landwater', wetSand: true }) },
      { name: 'A breeze over the trays', params: preset({ setup: 'landwater', fan: 3 }) },
      { name: 'Kilimanjaro: snow on the equator', params: preset({ setup: 'altitude' }) },
      { name: 'Everest in dry air', params: preset({ setup: 'altitude', mountain: 'everest', T0: 22, lapseKind: 'dry', hike: 8.849 }) },
      { name: 'Mount Rainier in spring', params: preset({ setup: 'altitude', mountain: 'rainier', T0: 10, hike: 1.6 }) },
      { name: 'Six surfaces, one lamp', params: preset({ setup: 'albedo' }) },
      { name: '…through the thermal camera', params: preset({ setup: 'albedo', view: 'ir' }) },
      { name: 'Summer day, 35° N, clear sky', params: preset({ setup: 'combined' }) },
      { name: 'The same day under cloud', params: preset({ setup: 'combined', cloud: 7 }) },
      { name: 'A thermal-camera day', params: preset({ setup: 'combined', view: 'ir' }) },
      { name: 'Winter at 50° N', params: preset({ setup: 'combined', lat: 50, day: 355, airT: 3 }) },
      { name: 'The tropics', params: preset({ setup: 'combined', lat: 5, day: 80, airT: 27 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The lamp and the card', when: is('angle'), items: [
        { key: 'tilt', label: 'Card tilted from the lamp', min: 0, max: 85, step: 5, unit: '°', restructure: false },
        { key: 'cardA', type: 'select', label: 'Card', restructure: true, options: [{ value: 0.05, label: 'black (reflects 5 %)' }, { value: 0.8, label: 'white (reflects 80 %)' }] },
        { key: 'aLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 10, label: '×10' }, { value: 30, label: '×30' }] } ] },
      { group: 'The Sun on the Earth', when: is('angle', 'combined'), items: [
        { key: 'lat', label: 'Latitude', min: -90, max: 90, step: 1, unit: '°', restructure: false },
        { key: 'day', label: 'Day of the year', min: 1, max: 365, step: 1, unit: '', restructure: false } ] },
      { group: 'The trays', when: is('landwater'), items: [
        { key: 'lampI', label: 'Each lamp', min: 200, max: 1000, step: 50, unit: 'W/m²', restructure: true },
        { key: 'lampMin', label: 'Lamps on for', min: 5, max: 60, step: 5, unit: 'min', restructure: true },
        { key: 'room', label: 'Room', min: 10, max: 35, step: 1, unit: '°C', restructure: true },
        { key: 'fan', label: 'Breeze', min: 0, max: 3, step: 0.5, unit: 'm/s', restructure: true },
        { key: 'rh', label: 'Room humidity', min: 10, max: 95, step: 5, unit: '%', restructure: true },
        { key: 'wetSand', type: 'toggle', label: 'Wet the sand', restructure: true },
        { key: 'lwLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 30, label: '×30' }, { value: 60, label: 'a minute a second' }, { value: 120, label: '2 minutes a second' }] } ] },
      { group: 'The mountain', when: is('altitude'), items: [
        { key: 'mountain', type: 'select', label: 'Climb', restructure: true, options: Object.keys(MOUNTAINS).map(k => ({ value: k, label: MOUNTAINS[k].name + ' (' + fmtN(MOUNTAINS[k].h * 1000) + ' m)' })) },
        { key: 'T0', label: 'Sea-level air', min: -10, max: 35, step: 1, unit: '°C', restructure: false },
        { key: 'lapseKind', type: 'select', label: 'The air cools', restructure: false, options: [{ value: 'standard', label: '6.5 °C/km (standard)' }, { value: 'dry', label: '9.8 °C/km (dry, rising)' }, { value: 'moist', label: '5 °C/km (cloudy)' }] },
        { key: 'hike', label: 'Hiker at', min: 0, max: 8.85, step: 0.05, unit: 'km', restructure: false } ] },
      { group: 'The patches', when: is('albedo'), items: [
        { key: 'lampI2', label: 'Lamp', min: 200, max: 1000, step: 50, unit: 'W/m²', restructure: true },
        { key: 'room', label: 'Room', min: 10, max: 35, step: 1, unit: '°C', restructure: true },
        { key: 'abLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 10, label: '×10' }, { value: 30, label: '×30' }, { value: 60, label: 'a minute a second' }] } ] },
      { group: 'The day', when: is('combined'), items: [
        { key: 'cloud', label: 'Cloud', min: 0, max: 8, step: 1, unit: '/8', restructure: false },
        { key: 'airT', label: 'Mean air temperature', min: -10, max: 40, step: 1, unit: '°C', restructure: false },
        { key: 'cLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'an hour a second' }, { value: 2, label: '2 hours a second' }, { value: 4, label: '4 hours a second' }] } ] },
      { group: 'Look', when: is('landwater', 'albedo', 'combined'), items: [
        { key: 'view', type: 'select', label: 'See with', display: true, options: [{ value: 'eye', label: 'your eyes' }, { value: 'ir', label: 'a thermal camera' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ angle: 'The card warming', landwater: 'Sand and water under the lamps', altitude: 'Temperature up the mountain', albedo: 'Six surfaces warming', combined: 'Surface temperature through the day' })[S.p.setup], draw: plot1 },
      { title: S => ({ angle: 'A day’s sunlight at every latitude', landwater: 'Inside the trays now', altitude: 'Where the snow starts', albedo: 'Steady temperature against albedo', combined: 'Day-to-night range against cloud' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'NGSS MS-ESS2-6 · the cosine law', params: preset({ tilt: 60 }),
        q: 'A lamp gives 900 W/m² on a card facing it. The card is tilted 60° away. How much light falls on each square metre of card now?',
        predict: { label: 'Light on the card', unit: 'W/m²', tol: 0.02 },
        measure: S => cardFlux(S.p),
        working: 'The beam spreads over 1 ÷ cos 60° = 2 times the area: 900 × cos 60° = <b>450 W/m²</b>. The same is true of sunlight at 30° above the horizon.' },
      { source: 'Textbook formula · daily insolation', params: preset({ lat: 0, day: 80 }),
        q: 'On the March equinox the Sun is overhead at noon on the equator. Averaged over 24 hours (night included), how much sunlight reaches the top of the atmosphere there? Use S₀ = 1361 W/m² (×1.012 for the Earth–Sun distance in March) ÷ π.',
        predict: { label: 'A day’s sunlight', unit: 'W/m²', tol: 0.02 },
        measure: S => dailyInsolation(S.p.lat, S.p.day),
        working: '1361 × 1.012 ÷ π ≈ <b>436 W/m²</b>: day and night together, the equator gets a third of the full overhead Sun.' },
      { source: 'Textbook formula · the midnight Sun', params: preset({ lat: 90, day: 172 }),
        q: 'At the North Pole on 21 June the Sun circles all day at 23.4° above the horizon. With S₀ = 1361 W/m² and the Earth 3 % further from the Sun than average (×0.968), what is the 24-hour mean sunlight at the top of the atmosphere?',
        predict: { label: 'A day’s sunlight', unit: 'W/m²', tol: 0.02 },
        measure: S => dailyInsolation(S.p.lat, S.p.day),
        working: '1361 × 0.968 × sin 23.4° = <b>524 W/m²</b> — more than the equator’s 436 that day! Yet the pole stays cold: snow reflects most of it, and the winter months get none.' },
      { source: 'Kasten & Young (1989) · the air the beam crosses', params: preset({}),
        q: 'When the Sun is 30° above the horizon, how many times as much air does its beam cross as when it is overhead?',
        predict: { label: 'Air mass', unit: '× overhead', tol: 0.02 },
        measure: () => airMass(30),
        working: 'About 1 ÷ sin 30° = <b>2.0</b> times — twice the air to scatter and absorb the light, on top of the spreading.' },
      { source: 'NGSS MS-ESS2-6 · specific heat', params: preset({ setup: 'landwater' }),
        q: 'Water’s specific heat is 4,186 J/(kg·°C); dry sand’s about 830. The same energy goes into 1 kg of each. How many times more does the sand warm?',
        predict: { label: 'Sand warms more by', unit: '×', tol: 0.02 },
        measure: () => WATER.c / SAND.c,
        working: '4,186 ÷ 830 = <b>5.0</b> times. That is why the land heats up by day and cools off by night far more than the sea.' },
      { source: 'This lab · sand and water', params: preset({ setup: 'landwater' }),
        q: 'Both trays start at 20 °C under 600 W/m² lamps. After 30 minutes, how much hotter is the sand’s surface than the water?',
        predict: { label: 'Sand − water', unit: '°C', tol: 0.05 },
        measure: S => { const T = traysAfter(S.p, 1800); return T.sand[0] - T.water; },
        working: 'Sand about 36.6 °C, water about 23.4 °C: <b>13.2 °C</b> hotter — the sand gets about 16.6 °C warmer, the water only 3.4 °C.' },
      { source: 'Kilimanjaro · the lapse rate', params: preset({ setup: 'altitude', hike: 5.895 }),
        q: 'At the foot of Kilimanjaro, near sea level, the air is 25 °C. The air cools 6.5 °C for every kilometre up. How cold is it at the 5,895 m summit?',
        predict: { label: 'Summit air', unit: '°C', tol: 0.02 },
        measure: S => tempAt(S.p, 5.895),
        working: '25 − 6.5 × 5.895 = 25 − 38.3 = <b>−13.3 °C</b>. Glaciers on the equator.' },
      { source: 'Kilimanjaro · the freezing level', params: preset({ setup: 'altitude' }),
        q: 'With 25 °C at sea level and 6.5 °C/km, at what height does the air reach 0 °C?',
        predict: { label: 'Freezing level', unit: 'km', tol: 0.02 },
        measure: S => freezingLevel(S.p),
        working: '25 ÷ 6.5 = <b>3.85 km</b>: above 3,850 m, rain falls as snow.' },
      { source: 'NGSS MS-ESS2-6 · albedo', params: preset({ setup: 'albedo' }),
        q: 'Fresh snow reflects 85 % of a 600 W/m² lamp, asphalt 5 %. How much more power does each square metre of asphalt absorb?',
        predict: { label: 'Extra absorbed', unit: 'W/m²', tol: 0.02 },
        measure: S => (SURFACES.snow.a - SURFACES.asphalt.a) * S.p.lampI2,
        working: '(0.95 − 0.15) × 600 = <b>480 W/m²</b> more — enough to make asphalt about 34 °C hotter than snow under the same lamp.' }
    ],

    walkthrough: [
      { title: 'Spread the beam', ask: 'Tilt the black card from 0° to 60°. Does the lamp give it less light?', reveal: 'The lamp gives the same power, but it spreads over twice the area; each square centimetre gets half as much, and the card settles much cooler.', params: preset({ tilt: 60, aLapse: 30 }) },
      { title: 'The equator and the poles', ask: 'Look at the curve for 21 March. Where is a day’s sunlight greatest, and where least?', reveal: 'Greatest at the equator, where the Sun is overhead at noon; it falls to zero at the poles, where it skims the horizon.', params: preset({ lat: 0, day: 80 }) },
      { title: 'The summer pole', ask: 'Move to 21 June and latitude 90°. Does the North Pole get less than the equator?', reveal: 'No — about 524 W/m² against 436: the Sun never sets. It still stays cold, because snow reflects most of the light and the winter months get none.', params: preset({ lat: 90, day: 172 }) },
      { title: 'Sand against water', ask: 'Which tray heats up faster? Which cools faster when the lamps go off?', reveal: 'The sand, both ways. It needs five times less energy per degree, keeps the heat in a thin top layer, and cannot evaporate. Water mixes the heat through and evaporates.', params: preset({ setup: 'landwater', view: 'ir' }) },
      { title: 'Snow on the equator', ask: 'Kilimanjaro is 3° from the equator. Why does it have snow?', reveal: 'The air is heated from the ground and cools about 6.5 °C a kilometre as you climb; above about 3.9 km it is below freezing.', params: preset({ setup: 'altitude', hike: 5.895 }) },
      { title: 'Light and dark', ask: 'Which patch is hottest? Which is coolest? Is water where you expected?', reveal: 'Asphalt hottest, snow coolest — the dark patch absorbs 95 % of the light. Water absorbs just as well but stays cool: it evaporates.', params: preset({ setup: 'albedo', abLapse: 60 }) },
      { title: 'Desert nights', ask: 'Run the day. Which surface has the biggest swing between afternoon and dawn?', reveal: 'The desert: dry sand, no evaporation, a thin skin of heat. The ocean barely changes; the forest stays cool by evaporating.', params: preset({ setup: 'combined', cLapse: 2 }) },
      { title: 'A cloudy day', ask: 'Turn the cloud up to 7/8. What happens to the desert’s range?', reveal: 'It shrinks: clouds block the Sun by day and send infrared back down at night.', params: preset({ setup: 'combined', cloud: 7 }) }
    ],

    quiz: [
      { q: 'The equator is hotter than the poles mainly because there', options: ['sunlight strikes nearly straight on, concentrated on less area', 'the Earth is closer to the Sun', 'the days are always longer', 'there is less air'], answer: 0, why: 'Toward the poles the same beam spreads over more ground at a low angle and crosses more air.' },
      { q: 'On a sunny day, a beach’s sand is much hotter than the sea because', options: ['sand has a lower specific heat and keeps the heat near its surface', 'sand gets more sunlight', 'sea water reflects all the light', 'sand is darker than any water'], answer: 0, why: 'The same energy warms sand about five times as much; water mixes and evaporates.' },
      { q: 'At night, the land near the coast is usually', options: ['cooler than the sea', 'warmer than the sea', 'the same as the sea', 'warmer only in winter'], answer: 0, why: 'Land loses its heat quickly; water holds it.' },
      { q: 'Air at the top of a 4 km mountain is usually about how much colder than at sea level?', options: ['26 °C', '4 °C', '65 °C', 'no colder: it is closer to the Sun'], answer: 0, why: '6.5 °C per km × 4 km = 26 °C. The air is heated from the ground below, not from the Sun above.' },
      { q: 'Which surface absorbs the most sunlight?', options: ['asphalt', 'fresh snow', 'dry sand', 'grass'], answer: 0, why: 'It reflects only about 5 %; snow reflects 80–90 %.' },
      { q: 'A desert has much bigger day-to-night temperature swings than a forest at the same latitude because', options: ['it is dry: no evaporation, clear skies and a thin layer of heated sand', 'it gets more hours of sunlight', 'its air is thinner', 'it is closer to the equator'], answer: 0, why: 'Forests send much of their energy into evaporation; deserts heat a thin skin and lose it fast at night.' }
    ],

    notes: '<p><b>Angle.</b> The same sunlight spread over more ground heats it less: overhead Sun near the equator, low Sun toward the poles. A low Sun’s light also crosses more air. That is the main reason the tropics are warm and the poles cold, and why summer is warmer than winter.</p>' +
      '<p><b>Land and water.</b> Land heats and cools quickly: low specific heat, the heat stays in a thin top layer, little evaporation. Water heats and cools slowly: high specific heat, sunlight reaches deep, it mixes and evaporates. So coasts have mild climates and continents extreme ones.</p>' +
      '<p><b>Altitude.</b> The air is heated from the ground and cools about 6.5 °C for every kilometre up, so mountains are cold — even on the equator.</p>' +
      '<p><b>Albedo.</b> Light surfaces (snow, ice, sand) reflect much of the sunlight; dark ones (forest, asphalt, ocean) absorb it.</p>' +
      '<p><b>Together</b>, these differences make unequal heating — the source of winds, sea breezes and the global circulation.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Mountain tops are cold because they are far from the Sun” — a few km is nothing beside 150 million km; it is cold up there because the air is heated from the ground and cools as it expands. And “summer is warmer because the Earth is closer to the Sun” — the Earth is closest in January; it is the angle and length of the day.</div>'
  });


  L.models = L.models || {};
  L.models['g6d-unequal-heating'] = { declination, dailyInsolation, noonElev, airMass, beamAtGround, LAMP, cardTemp, SAND, WATER, hOf, traysStart, traysStep, sandAt,
    LAPSE, tempAt, freezingLevel, MOUNTAINS, SURFACES, patchesStart, patchesStep, patchSteady, LAND, sunAt, dayRun, dayOf, rangeOf, S0 };
})(window.InsightLab);
