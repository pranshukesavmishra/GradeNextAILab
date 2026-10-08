/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-3  The Weather Station
   (D3.1 Temperature; D3.2 Air pressure and the barometer; D3.3 Humidity
    and dew point; D3.4 Precipitation; D3.5 Wind: speed and direction;
    D3.6 Reading a weather station together)

   A real station on a lawn, every instrument modelled as an instrument —
   with the errors that make meteorologists build them the way they do —
   all reading one computed weather: a diurnal cycle under a sky whose
   cloud cuts the sunshine (Kasten & Czeplak), and a cold front that
   arrives on the second day with falling pressure, rain, a wind shift and
   colder, drier air behind it.
     temperature — a thermometer has a time constant and catches sunshine:
                   in the Stevenson screen it reads the air; in the sun it
                   reads high, painted black higher still, less in a wind.
     barometer   — an aneroid and its barograph; station pressure falls
                   with height, and must be reduced to sea level before two
                   stations can be compared; the needle falls as the front
                   comes.
     humidity    — a sling psychrometer: dry and wet bulbs whirled, the
                   psychrometric equation, the error of not whirling; and a
                   polished mirror cooled until dew appears.
     precipitation — a tipping-bucket gauge counting 0.2 mm tips beside a
                   standard gauge; wind blows rain and snow past the funnel
                   (the WMO intercomparison's catch curves); an Alter shield
                   and a lower rim help.
     wind        — cups turn at wind ÷ the anemometer factor; the vane points
                   to where the wind comes FROM; wind grows with height over
                   rough ground (the log law, Davenport's roughness).
     station     — every instrument together for four days, and the station
                   model a forecaster plots from them.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.R3, TERRAIN, GEO, G6D and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));
  function dewOf(e) { if (e <= 1) return -60; let lo = -60, hi = 60; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (es(m) > e) hi = m; else lo = m; } return (lo + hi) / 2; }
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hashN = (i, s) => { const h = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return h - Math.floor(h); };
  function noise(t, s) { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return (hashN(i, s) * (1 - u) + hashN(i + 1, s) * u) * 2 - 1; }

  /* ============================================================
     THE WEATHER — four days at 40° N near the equinox; a cold front at hour tf
     ============================================================ */
  const LAT = 40 * Math.PI / 180;
  const PATTERNS = {
    fair: { name: 'fair weather under a high', front: false, P0: 1024, Tm: 16, A: 7, Td: 6, cloud: 1.5, u: 3 },
    front: { name: 'a cold front on day 2', front: true, P0: 1014, Tm: 17, A: 6, Td: 12, cloud: 3, u: 5 },
    muggy: { name: 'a humid summer spell', front: false, P0: 1012, Tm: 26, A: 6, Td: 22.5, cloud: 4, u: 2.5 }
  };
  const TF = 42;                                                    // hours: when the cold front crosses the station
  function sunElev(t) { const h = ((t % 24) - 12) / 24 * TAU; return Math.asin(clamp(Math.cos(LAT) * Math.cos(h), -1, 1)); }   // equinox: declination 0
  function weather(p, t) {
    const W = PATTERNS[p.pattern], fr = W.front ? smooth(TF - 1, TF + 2, t) : 0, near = W.front ? Math.exp(-Math.pow((t - TF) / 7, 2)) : 0;
    const oktas = clamp(W.cloud + 5.5 * near * (t < TF + 3 ? 1 : 0.6) + (W.front ? 2.5 * Math.exp(-Math.pow((t - TF + 14) / 10, 2)) : 0) + 1.2 * noise(t / 5, 3) - 2 * fr * (1 - near), 0, 8);
    const el = sunElev(t), Sclr = el > 0 ? 1361 * 0.75 * Math.sin(el) : 0;
    const S = Sclr * (1 - 0.75 * Math.pow(oktas / 8, 3.4));          // Kasten & Czeplak (1980): cloud cuts the sunshine
    const Tm = W.Tm - 7 * fr, A = W.A * (1 - 0.6 * oktas / 8);
    const T = Tm + A * Math.sin(TAU * (t - 9) / 24) + 0.4 * noise(t * 2, 7);
    const Td = Math.min(T - 0.3, W.Td - 9 * fr + 2 * near + 0.6 * noise(t / 3, 9));
    // pressure: a trough as the front comes, rising sharply behind it; a small twice-daily tide
    const Psl = W.P0 - (W.front ? 11 * Math.exp(-Math.pow((t - TF) / (t < TF ? 16 : 6), 2)) - 7 * fr : 0) + 0.6 * Math.cos(TAU * (t - 10) / 12) + 0.3 * noise(t / 6, 4);
    // wind at 10 m: veering from the south-west to the north-west through the front, gusty behind it
    const dir0 = W.front ? 205 + 95 * fr : p.pattern === 'fair' ? 40 : 160, gust = 1 + (0.25 + 0.2 * fr) * Math.abs(noise(t * 30, 11));
    const u10 = Math.max(0, (W.u + 6 * near + 3 * fr) * (0.75 + 0.35 * Math.max(0, Math.sin(el))) * (0.9 + 0.2 * noise(t * 4, 5)));
    const dir = (dir0 + 18 * noise(t * 3, 13) + 360) % 360;
    // rain: ahead of and on the front; showers behind it; a summer spell gets afternoon thunderstorms
    let R = 0;
    if (W.front) R = 14 * Math.exp(-Math.pow((t - TF + 0.5) / 1.6, 2)) + 1.5 * Math.exp(-Math.pow((t - TF + 5) / 3, 2)) + Math.max(0, 3 * noise(t * 1.5, 17) - 2) * fr;
    if (p.pattern === 'muggy') R = 22 * Math.max(0, Math.exp(-Math.pow(((t % 24) - 16.5) / 1.2, 2)) * (Math.floor(t / 24) % 2 ? 1 : 0.2));
    const snow = T < 1;
    return { T, Td, Psl, u10, gust: u10 * gust, dir, R, snow, oktas, S, el, rh: 100 * es(Td) / es(T) };
  }

  /* ============================================================
     TEMPERATURE — a thermometer's time constant and its radiation error
     ============================================================ */
  const SENSORS = { glass: { name: 'liquid-in-glass', tau: 60, alpha: 0.30 }, thermistor: { name: 'thermistor bead', tau: 8, alpha: 0.35 }, black: { name: 'glass bulb painted black', tau: 75, alpha: 0.95 } };
  const EXPOSE = { screen: { name: 'in the Stevenson screen', sun: 0.03, wind: 0.35 }, sun: { name: 'in full sun', sun: 1, wind: 1 }, shade: { name: 'in a tree’s shade', sun: 0.12, wind: 0.8 } };
  const hConv = u => 6 + 9 * Math.sqrt(Math.max(0.2, u));              // W/(m²·K) over a small bulb
  function radErr(p, w, u) {
    const S = SENSORS[p.sensor], E = EXPOSE[p.expose];
    return S.alpha * w.S * E.sun * 0.22 / hConv(u * E.wind);             // K: absorbed sunshine ÷ how fast the air carries it off
  }
  function sensorTau(p, u) { return SENSORS[p.sensor].tau / Math.sqrt(Math.max(0.3, u * EXPOSE[p.expose].wind)); }   // s

  /* ============================================================
     PRESSURE — station pressure at a height, and its reduction to sea level
     ============================================================ */
  const stationP = (Psl, z, Tc) => Psl * Math.pow(1 - 0.0065 * z / (Tc + 273.15 + 0.0065 * z), 5.2559);
  const toSeaLevel = (Pst, z, Tc) => Pst / Math.pow(1 - 0.0065 * z / (Tc + 273.15 + 0.0065 * z), 5.2559);
  function tendency(p, t) { const a = weather(p, t).Psl, b = weather(p, Math.max(0, t - 3)).Psl; return a - b; }    // hPa in 3 h

  /* ============================================================
     HUMIDITY — the psychrometer and the dew-point mirror
     ============================================================ */
  const PSY = { whirled: 6.6e-4, still: 1.2e-3 };                    // K⁻¹: the psychrometer coefficient, aspirated (WMO) and still air
  function wetBulb(T, Td, P, A) {                                    // solve es(Tw) − A·P·(T − Tw) = e by bisection
    const e = es(Td); let lo = Td - 1, hi = T + 0.01;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (es(m) - A * P * (T - m) > e) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  function fromBulbs(T, Tw, P) { const e = es(Tw) - PSY.whirled * P * (T - Tw); return { e, rh: 100 * e / es(T), Td: dewOf(e) }; }   // what the tables give

  /* ============================================================
     PRECIPITATION — catch efficiency in wind (WMO Solid Precipitation Intercomparison, Goodison et al. 1998)
     ============================================================ */
  const TIP = 0.2;                                                    // mm per tip
  function windAt(u10, z, z0) { return u10 * Math.log(Math.max(z, z0 * 1.01) / z0) / Math.log(10 / z0); }   // the log law
  const TERRAINS = { grass: { name: 'open grass', z0: 0.03 }, crops: { name: 'farmland with hedges', z0: 0.1 }, suburb: { name: 'suburb', z0: 0.5 }, city: { name: 'city centre', z0: 1.5 } };
  function catchEff(p, u10, snow) {
    const u = windAt(u10, p.rim, TERRAINS[p.site].z0) * (p.shield ? 0.55 : 1);
    if (snow) return clamp((100 - 23.24 * u + 1.07 * u * u) / 100, 0.15, 1);   // a Hellmann gauge, unshielded, in snow
    return clamp(1 - 0.014 * u, 0.8, 1);                             // rain: a few per cent per m/s (Sevruk)
  }

  /* ============================================================
     WIND — cups and a vane
     ============================================================ */
  const CUP = { R: 0.07, k: 2.6, start: 0.3 };                        // arm radius m; wind ÷ cup speed; starting speed m/s
  const cupRPM = u => u < CUP.start ? 0 : (u - CUP.start * 0.5) / CUP.k / (TAU * CUP.R) * 60;
  const beaufort = u => Math.round(clamp(Math.pow(u / 0.836, 2 / 3), 0, 12));
  const BFT = ['calm', 'light air', 'light breeze', 'gentle breeze', 'moderate breeze', 'fresh breeze', 'strong breeze', 'near gale', 'gale', 'strong gale', 'storm', 'violent storm', 'hurricane force'];
  const compass = d => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(((d % 360) + 360) % 360 / 22.5) % 16];

  /* ============================================================
     THE STATION — integrate every instrument along the weather
     ============================================================ */
  function stationStart(p) {
    const w = weather(p, p.t0), u = windAt(w.u10, 1.5, 0.03);
    return { t: p.t0, Tr: w.T + radErr(p, w, u), Tw: wetBulb(w.T, w.Td, stationP(w.Psl, p.alt, w.T) * 100, PSY.whirled), rain: 0, caught: 0, tips: 0, whirl: 0, tmax: w.T, tmin: w.T, hist: [] };
  }
  function stationStep(St, p, dtH) {
    const n = Math.max(1, Math.ceil(dtH * 3600 / 20)), h = dtH * 3600 / n;
    for (let k = 0; k < n; k++) {
      const w = weather(p, St.t), u = windAt(w.u10, 1.5, TERRAINS[p.site].z0);
      const target = w.T + radErr(p, w, u), tau = sensorTau(p, u);
      St.Tr += (target - St.Tr) * (1 - Math.exp(-h / tau));
      const Pst = stationP(w.Psl, p.alt, w.T) * 100, A = p.whirl ? PSY.whirled : PSY.still;
      St.Tw += (wetBulb(w.T, w.Td, Pst, A) - St.Tw) * (1 - Math.exp(-h / (p.whirl ? 25 : 120)));
      St.rain += w.R * h / 3600;
      const got = w.R * h / 3600 * catchEff(p, w.u10, w.snow);
      St.caught += got; St.tips = Math.floor(St.caught / TIP);
      St.tmax = Math.max(St.tmax, St.Tr); St.tmin = Math.min(St.tmin, St.Tr);
      St.t += h / 3600;
    }
    return St;
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'temperature', label: 'The thermometer: in the screen or in the sun?', teaches: ['D3.1'] },
    { value: 'barometer', label: 'The aneroid barometer and the falling glass', teaches: ['D3.2'] },
    { value: 'humidity', label: 'Wet and dry bulbs: the psychrometer', teaches: ['D3.3'] },
    { value: 'precipitation', label: 'Rain gauges, and the rain they miss', teaches: ['D3.4'] },
    { value: 'wind', label: 'Cups and a vane', teaches: ['D3.5'] },
    { value: 'station', label: 'Four days at the station', teaches: ['D3.6'] }
  ];
  const BASE = {
    setup: 'temperature', pattern: 'front', t0: 10, lapse: 1,
    sensor: 'glass', expose: 'screen',
    alt: 0, reduce: true,
    whirl: true, mirrorT: 20,
    rim: 0.5, shield: false, site: 'grass',
    mast: 10,
    units: 'metric'
  };
  const preset = o => Object.assign({}, BASE, o);
  /* each instrument gets the view a student would walk up to: close to the screen, beside the gauges, back from the mast */
  const HOMES = {
    temperature: { theta: -1.75, phi: 0.16, dist: 4.6, target: [0.3, 0, 1.25] },
    humidity: { theta: -1.75, phi: 0.16, dist: 4.6, target: [0.3, 0, 1.25] },
    barometer: { theta: -1.62, phi: 0.22, dist: 2.4, target: [-5.0, 5.6, 1.05] },
    precipitation: { theta: -2.0, phi: 0.3, dist: 4.2, target: [-2.6, -1.4, 0.55] },
    wind: { theta: -1.8, phi: 0.12, dist: 15, target: [3.2, 2.2, 5.2] },
    station: { theta: -1.95, phi: 0.2, dist: 15, target: [0.2, 1.2, 3.4] }
  };
  const homeOf = (p, narrow) => { const h = HOMES[p.setup]; return Object.assign({}, h, { dist: h.dist * (narrow ? 1.35 : 1) }); };
  let HOME = HOMES.station;
  function setup(S) {
    const p = S.p;
    HOME = HOMES[p.setup];
    if (!S.cam || S.camFor !== p.setup) { const h = homeOf(p, !!S._narrow); S.cam = Camera(Object.assign({ fov: 0.9 }, h, { target: h.target.slice() })); S.cam.minDist = h.dist * 0.4; S.cam.maxDist = h.dist * 3; S.camFor = p.setup; S._narrowCam = !!S._narrow; }
    S.St = stationStart(p); S.ta = 0; S.hist = [];
    record(S);
  }
  function record(S) {
    const p = S.p, St = S.St, w = weather(p, St.t), Pst = stationP(w.Psl, p.alt, w.T), u = windAt(w.u10, p.mast, TERRAINS[p.site].z0);
    S.hist.push([St.t, w.T, St.Tr, w.Td, St.Tw, w.Psl, Pst, w.u10, w.dir, w.R, St.rain, St.caught, u, w.gust * u / Math.max(0.01, w.u10)]);
    while (S.hist.length > 1600) S.hist.splice(0, 1);
  }
  function step(S, dt) {
    const p = S.p, St = S.St;
    S.ta += dt;
    if (St.t >= 96) return;
    stationStep(St, p, Math.min(96 - St.t, dt * p.lapse));
    if (St.t - S.hist[S.hist.length - 1][0] >= 0.1) record(S);
  }

  /* ---------------- helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const clock = t => 'day ' + (Math.floor(t / 24) + 1) + ', ' + String(Math.floor(t % 24)).padStart(2, '0') + ':' + String(Math.floor((t % 1) * 60)).padStart(2, '0');
  let G3 = null;
  function placeView(S, g, fx, fy) {
    const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = HOME.target;
    cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy];
    cam.update();
  }
  function cardBox(g, x, y, w, h, title) {
    const ctx = g.ctx, K = kit(); K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13); ctx.restore();
  }
  const textAt = (ctx, s, x, y, col, o) => { ctx.save(); ctx.font = (o && o.font) || mono(9.5); ctx.fillStyle = col || '#C9D4EA'; ctx.textAlign = (o && o.align) || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore(); };
  const pressCode = P => String(Math.round(P * 10) % 1000).padStart(3, '0');

  /* ---------------- the station on its lawn ---------------- */
  let LAWN = null;
  function lawn() {
    if (LAWN) return LAWN;
    LAWN = window.TERRAIN.block({ n: 30, size: 44, zBase: -1.2, height: (x, y) => 0.08 * Math.sin(x * 0.3) * Math.cos(y * 0.25) + (y > 12 ? (y - 12) * 0.25 : 0) });
    return LAWN;
  }
  const BARO = [-5.0, 5.6, 0];                                     // a table by the hut: the aneroid and its barograph
  const POS = { screen: [0, 0, 0], mast: [3.6, 2.4, 0], gauge: [-3.0, -1.1, 0], tipper: [-2.3, -1.6, 0], hut: [-7.5, 8.5, 0] };
  function drawScene(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, K = kit(), W = g.w, narrow = W < K.NARROW, St = S.St, w = weather(p, St.t);
    const day = clamp(Math.sin(w.el) * 3 + 0.2, 0, 1), grey = w.oktas / 8;
    const gr = ctx.createLinearGradient(0, 0, 0, g.h);
    gr.addColorStop(0, RX.mix(RX.mix('#0A1020', '#3E70B8', day), '#6A7482', grey * 0.8 * day));
    gr.addColorStop(1, RX.mix(RX.mix('#1A2234', '#B8D0E8', day), '#A8B0BA', grey * 0.7 * day));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    placeView(S, g, narrow ? 0 : -0.14, narrow ? 20 : 10);
    // the Sun, where it is in the sky (east to the left of the view, south behind)
    if (w.el > 0 && w.oktas < 7.5) {
      const az = ((St.t % 24) - 12) / 24 * TAU, sp = cam.project([60 * Math.sin(az), 60 * Math.cos(az) + 20, 60 * Math.tan(w.el) * 0.6 + 4]);
      if (sp.ok) { const sg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 50); sg.addColorStop(0, 'rgba(255,250,220,' + (1 - grey * 0.8).toFixed(2) + ')'); sg.addColorStop(0.2, 'rgba(255,230,150,' + (0.6 * (1 - grey)).toFixed(2) + ')'); sg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = sg; ctx.fillRect(sp.x - 50, sp.y - 50, 100, 100); }
    }
    // clouds: as many as the oktas
    const GX = window.GEO, nC = Math.round(w.oktas * 1.6), rr = G3.rng(Math.floor(St.t / 6) + 3);
    for (let k = 0; k < nC; k++) { const q = cam.project([-30 + rr() * 60, 10 + rr() * 30, 14 + rr() * 6]); if (!q.ok) continue; const ww = (90 + 80 * rr()) * (w.oktas > 6 ? 1.6 : 1); const shade = 255 - 110 * grey; GX.cloud(ctx, q.x, q.y, ww, ww * 0.45, k + 1, 0.85, [shade, shade, shade + 6]); }
    const B = lawn(), T = window.TERRAIN, items = [];
    const tr = G3.rng(30); for (let k = 0; k < 26; k++) { const x = -20 + tr() * 40, y = 6 + tr() * 14; items.push({ at: [x, y, B.zAt(x, y)], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(3, 7 * q.s), { kind: k % 2 ? 'broad' : 'conifer', seed: k, state: w.T < 3 ? 'dry' : 'live' }) }); }
    items.push({ at: POS.hut, draw: () => T.house(ctx, cam, POS.hut, 2.6, { roof: '#6A4A3A', wall: '#E8E2D2' }) });
    T.draw(ctx, cam, B, { cover: (i, j, x, y) => { const wet = clamp(St.rain / 10, 0, 1); return TERRAIN.mixc([96, 150, 70], [60, 110, 56], wet * 0.5 + 0.15 * Math.sin(x * 2.1 + y * 1.3)); }, items, layers: [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }] });
    const F = R3.Frame(ctx, cam, { floorZ: 0.0, ambient: 0.32 });
    const scr = G3.stevenson(F, POS.screen, { dry: St.Tr, wet: St.Tw });
    if (p.setup === 'temperature' && p.expose !== 'screen') {               // the experiment's own thermometer, on a post out in the open or in the shade
      const at = p.expose === 'sun' ? [2.2, -1.6, 0] : [-1.4, 3.2, 0];
      R3.cylinder(F, at, add3(at, 0, 0, 1.4), 0.04, '#7A5A3A', {});
      G3.glassTube(F, [add3(at, 0, -0.06, 1.15), add3(at, 0, -0.06, 1.55)], 0.012, { fill: [{ from: 0, to: 0.06 + 0.32 * clamp((St.Tr + 20) / 70, 0, 1), col: p.sensor === 'black' ? '#202020' : '#D8302C' }], inner: 0.55 });
      R3.sphere(F, add3(at, 0, -0.06, 1.15), 0.02, p.sensor === 'black' ? '#1A1A1A' : '#D8302C', { shadow: false });
      S._probeAt = add3(at, 0, -0.06, 1.35);
    } else S._probeAt = null;
    const u = windAt(w.u10, p.mast, TERRAINS[p.site].z0);
    S.cupPhase = (S.cupPhase || 0);
    const mast = G3.windMast(F, POS.mast, p.mast, (St.t * 3600 * cupRPM(u) / 60 * TAU / 400) % TAU, w.dir);
    G3.rainGauges(F, POS.gauge, POS.tipper, p.rim);
    // the barometer table: an aneroid on its stand and a barograph whose pen draws on a turning drum
    R3.box(F, [BARO[0], BARO[1], 0.86], [0.9, 0.5, 0.05], '#8A6440', { ambient: 0.5 });
    [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].forEach(([dx, dy]) => R3.box(F, [BARO[0] + dx, BARO[1] + dy, 0.42], [0.04, 0.04, 0.84], '#6A4A2E', { ambient: 0.5 }));
    R3.box(F, [BARO[0] + 0.18, BARO[1] + 0.02, 0.96], [0.36, 0.2, 0.15], '#2A2E36', { ambient: 0.45 });
    R3.cylinder(F, [BARO[0] + 0.1, BARO[1] - 0.02, 1.035], [BARO[0] + 0.1, BARO[1] - 0.02, 1.16], 0.055, '#F2F0E6', { shadow: false });
    const Pst0 = stationP(w.Psl, p.alt, w.T), penZ = 1.04 + 0.11 * clamp((Pst0 - 990) / 40, 0, 1);
    R3.tube(F, [[BARO[0] + 0.32, BARO[1] - 0.02, 1.06], [BARO[0] + 0.16, BARO[1] - 0.075, penZ]], 0.003, '#B8902C', { shadow: false });
    R3.box(F, [BARO[0] - 0.2, BARO[1] + 0.05, 1.02], [0.06, 0.06, 0.28], '#5A3A1C', { ambient: 0.5 });
    const dialAt = [BARO[0] - 0.2, BARO[1] + 0.02, 1.2];
    F.push(dialAt, () => { const q = cam.project(dialAt); if (!q.ok) return; const R = 0.11 * q.s; if (R < 6) return; const then = weather(p, Math.max(0, St.t - 3)); G3.aneroid(ctx, q.x, q.y, R, p.reduce ? w.Psl : Pst0, p.reduce ? then.Psl : stationP(then.Psl, p.alt, then.T)); }, -0.05);
    S._baroAt = dialAt;
    if (p.shield) G3.alterShield(F, POS.tipper, p.rim);
    F.render();
    if (w.R > 0.1) {
      const q0 = cam.project([-20, 0, 12]), q1 = cam.project([20, 0, 0]);
      if (w.snow) { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 160; k++) { const x = (Math.sin(k * 91.7) * 0.5 + 0.5) * W, y = ((S.ta * 0.15 + k * 0.137) % 1) * g.h; ctx.beginPath(); ctx.arc(x + Math.sin(S.ta + k) * 6, y, 1.6, 0, TAU); ctx.fill(); } }
      else T.rain(ctx, 0, 0, W, g.h, clamp(w.R * 2, 1, 40), S.ta, -0.15 - w.u10 * 0.03);
      void q0; void q1;
    }
    // labels on the instruments
    if (g.labels) {
      const tagAt = (pt, txt, dx, dy, col) => { const q = cam.project(pt); if (!q.ok) return; ctx.save(); ctx.strokeStyle = 'rgba(210,222,240,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + dx, q.y + dy); ctx.stroke(); ctx.restore(); G3.tag(ctx, q.x + dx + (dx < 0 ? -2 : 2), q.y + dy, txt, col || '#E6EEF8', { align: dx < 0 ? 'right' : 'left' }); };
      const all = narrow || p.setup !== 'station' ? [p.setup] : ['temperature', 'precipitation', 'wind', 'barometer'];
      if (all.includes('temperature') || p.setup === 'humidity' || p.setup === 'station') tagAt(scr.door, 'Stevenson screen · ' + St.Tr.toFixed(1) + ' °C', 50, -60);
      if (S._probeAt) tagAt(S._probeAt, 'thermometer ' + EXPOSE[p.expose].name + ' · ' + St.Tr.toFixed(1) + ' °C', 40, -40, '#FFC56B');
      if (all.includes('precipitation') || p.setup === 'station') tagAt(add3(POS.tipper, 0, 0, p.rim), 'gauges · ' + St.caught.toFixed(1) + ' mm caught', -40, -50);
      if (all.includes('wind') || p.setup === 'station') tagAt(mast.top, p.mast + ' m mast · ' + u.toFixed(1) + ' m/s from ' + compass(w.dir), 40, -20);
      if (all.includes('barometer') || p.setup === 'station') tagAt(add3(BARO, -0.2, 0.02, 1.32), 'aneroid and barograph · ' + fmtN(stationP(w.Psl, p.alt, w.T), 1) + ' hPa', -30, -40);
    }
    return w;
  }
  const add3 = (a, x, y, z) => [a[0] + x, a[1] + y, a[2] + z];

  /* ---------------- the instrument cards ---------------- */
  function instrumentCard(S, g, w) {
    const p = S.p, K = kit(), W = g.w, St = S.St, titles = { temperature: 'the thermometer', barometer: 'the aneroid', humidity: 'the psychrometer', precipitation: 'the tipping bucket', wind: 'cups and vane', station: 'the station model' };
    const at = K.cardSlot(g, S, titles[p.setup], 270, { x: W - 280, y: K.HDR + 6 });
    if (!at) return;
    const ctx = g.ctx, x = at.x, y = at.y, cw = at.w;
    if (p.setup === 'temperature') {
      const h = 300; cardBox(g, x, y, cw, h, 'Thermometer ' + EXPOSE[p.expose].name);
      G3.thermoFace(ctx, x + 6, y + 26, cw * 0.5, h - 40, { lo: Math.floor(Math.min(w.T, St.Tr) - 6), hi: Math.ceil(Math.max(w.T, St.Tr) + 6), T: St.Tr, truth: w.T, col: p.sensor === 'black' ? '#E0E0E0' : '#D8302C', label: SENSORS[p.sensor].name });
      const rx = x + cw * 0.56;
      [['reads', St.Tr.toFixed(1) + ' °C', '#FFC56B'], ['the air', w.T.toFixed(1) + ' °C', '#7CF0B0'], ['error', (St.Tr - w.T >= 0 ? '+' : '') + (St.Tr - w.T).toFixed(1) + ' °C', Math.abs(St.Tr - w.T) > 1 ? '#FF9A8A' : '#C9D4EA'], ['sunshine', w.S.toFixed(0) + ' W/m²', '#FFD27A'], ['lag τ', sensorTau(p, windAt(w.u10, 1.5, 0.03)).toFixed(0) + ' s', '#C9D4EA'], ['max today', St.tmax.toFixed(1) + ' °C', '#FF9A8A'], ['min today', St.tmin.toFixed(1) + ' °C', '#8FC8FF'], [St.Tr.toFixed(1) + ' °C =', (St.Tr * 9 / 5 + 32).toFixed(1) + ' °F', '#C9D4EA'], ['', (St.Tr + 273.15).toFixed(1) + ' K', '#C9D4EA']].forEach((r, i) => { textAt(ctx, r[0], rx, y + 44 + i * 26, '#98A6C6', { font: mono(9) }); textAt(ctx, r[1], rx, y + 57 + i * 26, r[2], { font: mono(11, 700) }); });
    } else if (p.setup === 'barometer') {
      const h = 290, Pst = stationP(w.Psl, p.alt, w.T), shown = p.reduce ? toSeaLevel(Pst, p.alt, w.T) : Pst, then = weather(p, Math.max(0, St.t - 3));
      cardBox(g, x, y, cw, h, p.reduce ? 'Aneroid, set to sea level' : 'Aneroid, reading the station');
      const R = Math.min(cw * 0.36, 98);
      G3.aneroid(ctx, x + cw / 2, y + 30 + R, R, shown, p.reduce ? then.Psl : stationP(then.Psl, p.alt, then.T));
      textAt(ctx, fmtN(shown, 1) + ' hPa · ' + (shown * 0.02953).toFixed(2) + ' inHg', x + cw / 2, y + 48 + 2 * R, '#F2F6FF', { align: 'center', font: mono(11, 700) });
      const td = tendency(p, St.t); textAt(ctx, 'gold hand: 3 hours ago · ' + (td >= 0 ? 'rising ' : 'falling ') + Math.abs(td).toFixed(1) + ' hPa', x + cw / 2, y + 66 + 2 * R, td < -1 ? '#FF9A8A' : td > 1 ? '#7CF0B0' : '#C9D4EA', { align: 'center', font: mono(9) });
    } else if (p.setup === 'humidity') {
      const h = 300, B = fromBulbs(St.Tr, St.Tw, stationP(w.Psl, p.alt, w.T) * 100);
      cardBox(g, x, y, cw, h, 'Sling psychrometer' + (p.whirl ? ', whirled' : ', not whirled'));
      const lo = Math.floor(Math.min(St.Tw, w.Td) - 4), hi = Math.ceil(St.Tr + 4);
      G3.thermoFace(ctx, x + 2, y + 24, cw * 0.34, h - 120, { lo, hi, T: St.Tr, label: 'dry ' + St.Tr.toFixed(1) });
      G3.thermoFace(ctx, x + cw * 0.3, y + 24, cw * 0.34, h - 120, { lo, hi, T: St.Tw, wick: true, label: 'wet ' + St.Tw.toFixed(1) });
      const rx = x + cw * 0.66;
      [['difference', (St.Tr - St.Tw).toFixed(1) + ' °C'], ['tables say RH', B.rh.toFixed(0) + ' %'], ['true RH', w.rh.toFixed(0) + ' %'], ['dew point', B.Td.toFixed(1) + ' °C']].forEach((r, i) => { textAt(ctx, r[0], rx, y + 40 + i * 30, '#98A6C6', { font: mono(9) }); textAt(ctx, r[1], rx, y + 54 + i * 30, i === 2 ? '#7CF0B0' : '#FFC56B', { font: mono(11, 700) }); });
      // the dew-point mirror: polished, cooled to the setting — fogged below the dew point
      const my = y + h - 82, fog = p.mirrorT < w.Td;
      const mg = ctx.createLinearGradient(x + 14, my, x + cw - 14, my + 50); mg.addColorStop(0, '#C8D0D8'); mg.addColorStop(0.5, '#F4F8FC'); mg.addColorStop(1, '#9AA4AE');
      ctx.save(); ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(x + 60, my + 30, 42, 26, 0, 0, TAU); ctx.fill();
      if (fog) { const pat = ctx.createPattern(G3.mistTex(), 'repeat'); ctx.globalAlpha = clamp((w.Td - p.mirrorT) / 3, 0.3, 0.95); ctx.fillStyle = pat || 'rgba(240,244,248,.7)'; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.restore();
      textAt(ctx, 'mirror at ' + p.mirrorT + ' °C', x + 112, my + 18, '#C9D4EA', { font: mono(9.5, 600) });
      textAt(ctx, fog ? 'dew on it: below the dew point' : 'clear: above the dew point', x + 112, my + 34, fog ? '#9FD4FF' : '#C9D4EA', { font: mono(9) });
      textAt(ctx, 'true dew point ' + w.Td.toFixed(1) + ' °C', x + 112, my + 50, '#7CF0B0', { font: mono(9) });
    } else if (p.setup === 'precipitation') {
      const h = 300; cardBox(g, x, y, cw, h, 'Tipping bucket: 0.2 mm a tip');
      G3.tippingBucket(ctx, x + 10, y + 26, cw - 20, 170, St.tips, w.R, S.ta);
      const rx = x + 12;
      [['rain that fell', St.rain.toFixed(1) + ' mm', '#8FC8FF'], ['the gauge caught', St.caught.toFixed(1) + ' mm', '#FFC56B'], ['tips × 0.2 mm', (St.tips * TIP).toFixed(1) + ' mm', '#7CF0B0'], ['catching now', (catchEff(p, w.u10, w.snow) * 100).toFixed(0) + ' % of the ' + (w.snow ? 'snow' : 'rain'), '#C9D4EA']].forEach((r, i) => { textAt(ctx, r[0], rx + (i % 2) * cw / 2, y + 208 + Math.floor(i / 2) * 34, '#98A6C6', { font: mono(9) }); textAt(ctx, r[1], rx + (i % 2) * cw / 2, y + 222 + Math.floor(i / 2) * 34, r[2], { font: mono(11, 700) }); });
    } else if (p.setup === 'wind') {
      const h = 300, u = windAt(w.u10, p.mast, TERRAINS[p.site].z0); cardBox(g, x, y, cw, h, 'From above: the vane points into the wind');
      G3.windRose(ctx, x + cw / 2, y + 120, Math.min(cw * 0.34, 86), w.dir, u, (St.t * 3600 * cupRPM(u) / 60 * TAU / 400) % TAU + S.ta * 2);
      textAt(ctx, 'from the ' + compass(w.dir) + ' (' + w.dir.toFixed(0) + '°) · ' + u.toFixed(1) + ' m/s · ' + cupRPM(u).toFixed(0) + ' rpm', x + cw / 2, y + 236, '#F2F6FF', { align: 'center', font: mono(10, 600) });
      textAt(ctx, 'Beaufort ' + beaufort(u) + ': ' + BFT[beaufort(u)], x + cw / 2, y + 256, '#FFD27A', { align: 'center', font: mono(10, 600) });
      textAt(ctx, 'a ' + compass(w.dir) + ' wind blows TOWARD the ' + compass(w.dir + 180), x + cw / 2, y + 276, '#98A6C6', { align: 'center', font: mono(9) });
    } else {
      const h = 260, Pst = stationP(w.Psl, p.alt, w.T), td = tendency(p, St.t), us = p.units === 'us';
      cardBox(g, x, y, cw, h, 'Station model, ' + clock(St.t));
      G3.stationModel(ctx, x + cw / 2, y + 120, Math.min(cw * 0.75, 200), { oktas: w.oktas, u: w.u10, dir: w.dir, Tlab: us ? (w.T * 9 / 5 + 32).toFixed(0) : w.T.toFixed(0), Tdlab: us ? (w.Td * 9 / 5 + 32).toFixed(0) : w.Td.toFixed(0), Pcode: pressCode(w.Psl), tend: (td >= 0 ? '+' : '−') + String(Math.round(Math.abs(td) * 10)).padStart(2, '0'), rain: w.R });
      textAt(ctx, 'T ' + (us ? '°F' : '°C') + ' upper left · dew point lower left · ' + pressCode(w.Psl) + ' = ' + fmtN(w.Psl, 1) + ' hPa · barb: ' + (w.u10 * 1.944).toFixed(0) + ' kt from ' + compass(w.dir), x + cw / 2, y + h - 20, '#98A6C6', { align: 'center', font: mono(8) });
      void Pst;
    }
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = window.G6D;
    if (!K || !G3 || !window.TERRAIN) return;
    S._narrow = g.w < K.NARROW;
    HOME = HOMES[p.setup];
    if (S.cam && S._narrowCam !== S._narrow) { S.cam.dist = HOME.dist * (S._narrow ? 1.35 : 1); S.cam.home = { theta: HOME.theta, phi: HOME.phi, dist: S.cam.dist }; S._narrowCam = S._narrow; }
    const w = drawScene(S, g);
    instrumentCard(S, g, w);
    headerOf(S, g, w);
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function headerOf(S, g, w) {
    const p = S.p, St = S.St, K = kit(); let a = '', b = '';
    const Pst = stationP(w.Psl, p.alt, w.T);
    if (p.setup === 'temperature') { const e = St.Tr - w.T; a = Math.abs(e) > 1 ? 'The thermometer reads ' + St.Tr.toFixed(1) + ' °C — ' + Math.abs(e).toFixed(1) + ' °C ' + (e > 0 ? 'too warm: it is soaking up sunshine' : 'too cold: it has not caught up') : 'The thermometer reads the air: ' + St.Tr.toFixed(1) + ' °C'; b = SENSORS[p.sensor].name + ' ' + EXPOSE[p.expose].name + ' · sunshine ' + w.S.toFixed(0) + ' W/m² · wind ' + w.u10.toFixed(1) + ' m/s'; }
    else if (p.setup === 'barometer') { const td = tendency(p, St.t); a = (td < -1.5 ? 'The glass is falling: ' : td > 1.5 ? 'The glass is rising: ' : 'The glass is steady: ') + fmtN(p.reduce ? w.Psl : Pst, 1) + ' hPa' + (td < -1.5 ? ' — weather is on its way' : td > 1.5 ? ' — clearing behind the front' : ''); b = 'station ' + fmtN(Pst, 1) + ' hPa at ' + fmtN(p.alt) + ' m · sea-level ' + fmtN(w.Psl, 1) + ' hPa · 3-hour change ' + (td >= 0 ? '+' : '') + td.toFixed(1); }
    else if (p.setup === 'humidity') { const B = fromBulbs(St.Tr, St.Tw, Pst * 100); a = 'Dry ' + St.Tr.toFixed(1) + ' °C, wet ' + St.Tw.toFixed(1) + ' °C: the tables give ' + B.rh.toFixed(0) + ' % humidity' + (p.whirl ? '' : ' — but the bulb was not whirled'); b = 'true humidity ' + w.rh.toFixed(0) + ' % · dew point ' + w.Td.toFixed(1) + ' °C · the drier the air, the more the wet bulb cools'; }
    else if (p.setup === 'precipitation') { a = w.R > 0.1 ? (w.snow ? 'Snowing ' : 'Raining ') + w.R.toFixed(1) + ' mm an hour — the bucket tips every ' + (TIP / Math.max(0.01, w.R * catchEff(p, w.u10, w.snow)) * 60).toFixed(1) + ' minutes' : 'Dry just now: ' + St.caught.toFixed(1) + ' mm caught so far'; b = 'fell ' + St.rain.toFixed(1) + ' mm · caught ' + St.caught.toFixed(1) + ' mm · ' + St.tips + ' tips · rim ' + p.rim.toFixed(1) + ' m' + (p.shield ? ' with an Alter shield' : ''); }
    else if (p.setup === 'wind') { const u = windAt(w.u10, p.mast, TERRAINS[p.site].z0); a = 'Wind from the ' + compass(w.dir) + ' at ' + u.toFixed(1) + ' m/s on the ' + p.mast + ' m mast: ' + BFT[beaufort(u)]; b = 'cups ' + cupRPM(u).toFixed(0) + ' rpm · gusts ' + (w.gust * u / Math.max(0.01, w.u10)).toFixed(1) + ' m/s · at 10 m over open grass it would be ' + windAt(w.u10, 10, 0.03).toFixed(1) + ' m/s'; }
    else { a = clock(St.t) + ': ' + w.T.toFixed(0) + ' °C, ' + w.rh.toFixed(0) + ' % humid, ' + fmtN(w.Psl, 0) + ' hPa, wind ' + compass(w.dir) + ' ' + w.u10.toFixed(0) + ' m/s' + (w.R > 0.1 ? ', ' + (w.snow ? 'snow' : 'rain') : ''); b = PATTERNS[p.pattern].name + ' · cloud ' + Math.round(w.oktas) + ' oktas · rain so far ' + St.rain.toFixed(1) + ' mm'; }
    K.header(g, a, b, clock(St.t) + ' · ' + (p.lapse < 1 ? '10 minutes' : p.lapse + ' hour' + (p.lapse > 1 ? 's' : '')) + ' a second · ' + PATTERNS[p.pattern].name);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  function timeAxis(S) { const H = S.hist, t0 = H[0][0], t1 = Math.max(t0 + 6, H[H.length - 1][0]); return { t0, t1, xfmt: v => String(Math.round(v % 24)).padStart(2, '0') + 'h' }; }
  function plot1(S, g) {
    const p = S.p, K = kit(), H = S.hist, A = timeAxis(S);
    const frame = (items, ymin, ymax, ylabel, note) => { const Kk = K.plotKey(g, items, note); const P = g.Plot({ xmin: A.t0, xmax: A.t1, ymin, ymax, pad: { t: Kk.t }, xlabel: 'time of day', ylabel, xfmt: A.xfmt, yfmt: v => v.toFixed(Math.abs(ymax - ymin) < 6 ? 1 : 0) }).frame(); return [P, Kk]; };
    const col = i => H.map(q => [q[0], q[i]]), span = (...is) => { const v = H.flatMap(q => is.map(i => q[i])); return [Math.min(...v), Math.max(...v)]; };
    if (p.setup === 'temperature') { const [a, b] = span(1, 2); const [P, Kk] = frame([{ c: '#7CF0B0', label: 'the air (truth)' }, { c: '#FFC56B', label: 'what the thermometer reads' }], Math.floor(a - 1), Math.ceil(b + 1), '°C'); P.clip(() => { P.line(col(1), '#7CF0B0', 1.8, [4, 3]); P.line(col(2), '#FFC56B', 2.4); }); Kk.draw(P); return; }
    if (p.setup === 'barometer') { const [a, b] = span(5, 6); const [P, Kk] = frame([{ c: '#F2F6FF', label: 'sea-level pressure' }, { c: '#8FC8FF', label: 'at the station', dash: [4, 3] }], Math.floor(a - 2), Math.ceil(b + 2), 'hPa', 'a barograph'); P.clip(() => { P.line(col(5), '#F2F6FF', 2.2); P.line(col(6), '#8FC8FF', 1.6, [4, 3]); if (PATTERNS[p.pattern].front) { P.vline(TF, 'rgba(255,138,122,.6)', [3, 3]); P.tag(TF, b + 1, 'cold front', '#FF8A7A', 'left', 0); } }); Kk.draw(P); return; }
    if (p.setup === 'humidity') { const [a, b] = span(1, 3, 4); const [P, Kk] = frame([{ c: '#FFC56B', label: 'dry bulb' }, { c: '#8FC8FF', label: 'wet bulb' }, { c: '#7CF0B0', label: 'dew point', dash: [4, 3] }], Math.floor(a - 1), Math.ceil(b + 1), '°C'); P.clip(() => { P.line(col(2), '#FFC56B', 2.2); P.line(col(4), '#8FC8FF', 2.2); P.line(col(3), '#7CF0B0', 1.6, [4, 3]); }); Kk.draw(P); return; }
    if (p.setup === 'precipitation') { const ym = Math.max(2, ...H.map(q => q[10])) * 1.15; const [P, Kk] = frame([{ c: '#8FC8FF', label: 'rain that fell' }, { c: '#FFC56B', label: 'caught by the gauge' }, { c: 'rgba(143,200,255,.35)', box: true, label: 'rate, mm/h' }], 0, ym, 'mm'); P.clip(() => { H.forEach(q => { if (q[9] > 0.05) P.bar(q[0], Math.min(ym, q[9]), 0.04, 0, 'rgba(143,200,255,.35)'); }); P.line(col(10), '#8FC8FF', 2.2); P.line(col(11), '#FFC56B', 2.2); }); Kk.draw(P); return; }
    if (p.setup === 'wind') { const ym = Math.max(6, ...H.map(q => q[13])) * 1.15; const [P, Kk] = frame([{ c: '#7CF0B0', label: 'on the mast' }, { c: 'rgba(124,240,176,.4)', label: 'gusts', dash: [2, 3] }, { c: '#FFD27A', dot: true, label: 'direction (right, 0–360°)' }], 0, ym, 'm/s'); P.clip(() => { P.line(col(13), 'rgba(124,240,176,.4)', 1, [2, 3]); P.line(col(12), '#7CF0B0', 2.2); H.forEach((q, i) => { if (i % 4 === 0) P.dot(q[0], q[8] / 360 * ym, 1.8, '#FFD27A'); }); }); Kk.draw(P); return; }
    const [a, b] = span(1, 3); const lo = Math.floor(a - 2), hi = Math.ceil(b + 2); const Pr = span(5);
    const [P, Kk] = frame([{ c: '#FF9A8A', label: 'temperature' }, { c: '#7CF0B0', label: 'dew point' }, { c: '#F2F6FF', label: 'pressure (right)', dash: [4, 3] }, { c: 'rgba(143,200,255,.5)', box: true, label: 'rain' }], lo, hi, '°C', 'a meteogram');
    const pmap = v => lo + (v - (Pr[0] - 2)) / (Pr[1] - Pr[0] + 4) * (hi - lo);
    P.clip(() => { H.forEach(q => { if (q[9] > 0.05) P.bar(q[0], lo + Math.min(1, q[9] / 15) * (hi - lo) * 0.5, 0.04, lo, 'rgba(143,200,255,.5)'); }); P.line(col(1), '#FF9A8A', 2.2); P.line(col(3), '#7CF0B0', 2.2); P.line(H.map(q => [q[0], pmap(q[5])]), '#F2F6FF', 1.4, [4, 3]); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit(), St = S.St, w = weather(p, St.t);
    if (p.setup === 'temperature') {
      const S0 = Math.max(200, w.S), cols = { screen: '#7CF0B0', shade: '#8FC8FF', sun: '#FFC56B' };
      const Kk = K.plotKey(g, Object.keys(EXPOSE).map(k => ({ c: cols[k], label: EXPOSE[k].name, w: k === p.expose ? 3 : 1.5 })), SENSORS[p.sensor].name + ', ' + S0.toFixed(0) + ' W/m²');
      const ym = Math.max(2, radErr(Object.assign({}, p, { expose: 'sun' }), { S: S0 }, 0.2)) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'wind, m/s', ylabel: 'reads too warm by, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { Object.keys(EXPOSE).forEach(k => { const pts = []; for (let u = 0.2; u <= 10; u += 0.2) pts.push([u, radErr(Object.assign({}, p, { expose: k }), { S: S0 }, u)]); P.line(pts, cols[k], k === p.expose ? 3 : 1.4, k === p.expose ? null : [4, 3]); }); const u = windAt(w.u10, 1.5, 0.03); P.dot(u, radErr(p, w, u), 5.5, cols[p.expose], '#FFFFFF'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'barometer') {
      const Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'what a barometer reads at each height, today' }, { c: '#F2F6FF', label: 'sea-level value', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: 3000, ymin: 680, ymax: 1050, pad: { t: Kk.t }, xlabel: 'station height, m', ylabel: 'hPa', xfmt: v => fmtN(v), yfmt: v => v.toFixed(0) }).frame();
      const pts = []; for (let z = 0; z <= 3000; z += 50) pts.push([z, stationP(w.Psl, z, w.T)]);
      P.clip(() => { P.line(pts, '#8FC8FF', 2.4); P.hline(w.Psl, 'rgba(242,246,255,.6)', [4, 3]); [[0, 'London'], [1609, 'Denver'], [2240, 'Mexico City']].forEach(([z, n]) => { P.vline(z, 'rgba(201,212,234,.25)', [2, 4]); P.tag(z, 700, n, '#AFC0D8', 'left', 0); }); P.dot(p.alt, stationP(w.Psl, p.alt, w.T), 5.5, '#FFE0A0', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'humidity') {
      const T = w.T, Pa = stationP(w.Psl, p.alt, T) * 100, Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'whirled (aspirated)' }, { c: '#C9D4EA', label: 'not whirled', dash: [4, 3] }], 'at ' + T.toFixed(1) + ' °C');
      const P = g.Plot({ xmin: 0, xmax: 100, ymin: 0, ymax: Math.max(4, T - wetBulb(T, -40, Pa, PSY.whirled)) * 1.05, pad: { t: Kk.t }, xlabel: 'relative humidity, %', ylabel: 'dry − wet bulb, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const line = A => { const pts = []; for (let rh = 5; rh <= 100; rh += 2.5) pts.push([rh, T - wetBulb(T, dewOf(rh / 100 * es(T)), Pa, A)]); return pts; };
      P.clip(() => { P.line(line(PSY.whirled), '#8FC8FF', 2.4); P.line(line(PSY.still), '#C9D4EA', 1.4, [4, 3]); P.dot(w.rh, St.Tr - St.Tw, 5.5, '#FFC56B', '#FFFFFF'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'precipitation') {
      const Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'rain' }, { c: '#F2F6FF', label: 'snow' }, { c: '#F2F6FF', label: 'snow, Alter shield', dash: [4, 3] }], 'wind at 10 m · rim ' + p.rim + ' m');
      const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'wind, m/s', ylabel: 'caught, %', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const ce = (snow, sh) => { const pts = []; for (let u = 0; u <= 12; u += 0.25) pts.push([u, 100 * catchEff(Object.assign({}, p, { shield: sh }), u, snow)]); return pts; };
      P.clip(() => { P.line(ce(false, p.shield), '#8FC8FF', 2.4); P.line(ce(true, false), '#F2F6FF', 1.8); P.line(ce(true, true), '#F2F6FF', 1.4, [4, 3]); P.dot(w.u10, 100 * catchEff(p, w.u10, w.snow), 5.5, '#FFC56B', '#FFFFFF'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'wind') {
      const cols = { grass: '#7CF0B0', crops: '#B6E07A', suburb: '#FFC56B', city: '#FF8A7A' };
      const Kk = K.plotKey(g, Object.keys(TERRAINS).map(k => ({ c: cols[k], label: TERRAINS[k].name, w: k === p.site ? 3 : 1.5 })), 'same weather');
      const top = Math.max(8, windAt(w.u10, 40, 0.03) * 1.1), P = g.Plot({ xmin: 0, xmax: top, ymin: 0, ymax: 40, pad: { t: Kk.t }, xlabel: 'wind, m/s', ylabel: 'height, m', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      /* the same weather above the ground's influence (at 60 m the wind is set by the weather, not the surface) */
      const u60 = windAt(w.u10, 60, 0.03);
      P.clip(() => { Object.keys(TERRAINS).forEach(k => { const z0 = TERRAINS[k].z0, u10k = u60 * Math.log(10 / z0) / Math.log(60 / z0), pts = []; for (let z = Math.max(0.3, z0 * 1.5); z <= 40; z += 0.25) pts.push([windAt(u10k, z, z0), z]); P.line(pts, cols[k], k === p.site ? 3 : 1.4, k === p.site ? null : [4, 3]); }); P.hline(10, 'rgba(201,212,234,.35)', [3, 3]); P.tag(top, 10, '10 m: the standard height', '#AFC0D8', 'right', -8); P.dot(windAt(w.u10, p.mast, TERRAINS[p.site].z0), p.mast, 5.5, cols[p.site], '#FFFFFF'); });
      Kk.draw(P); return;
    }
    const H = S.hist, A = timeAxis(S), Kk = K.plotKey(g, [{ c: '#FFD27A', dot: true, label: 'wind from, degrees' }, { c: '#7CF0B0', label: 'speed ×20 (right)' }], 'N 0 · E 90 · S 180 · W 270');
    const P = g.Plot({ xmin: A.t0, xmax: A.t1, ymin: 0, ymax: 360, pad: { t: Kk.t }, xlabel: 'time of day', ylabel: 'degrees', xfmt: A.xfmt, yticks: [0, 90, 180, 270, 360], yfmt: v => ({ 0: 'N', 90: 'E', 180: 'S', 270: 'W', 360: 'N' })[v] }).frame();
    P.clip(() => { P.line(H.map(q => [q[0], Math.min(360, q[7] * 20)]), '#7CF0B0', 1.6); H.forEach((q, i) => { if (i % 3 === 0) P.dot(q[0], q[8], 2, '#FFD27A'); }); if (PATTERNS[p.pattern].front) P.vline(TF, 'rgba(255,138,122,.6)', [3, 3]); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p, St = S.St, w = weather(p, St.t), Pst = stationP(w.Psl, p.alt, w.T), u = windAt(w.u10, p.mast, TERRAINS[p.site].z0);
    if (p.setup === 'temperature') return [
      { label: 'Thermometer reads', value: St.Tr.toFixed(1), unit: '°C', flag: 'accent' },
      { label: 'The air', value: w.T.toFixed(1), unit: '°C' },
      { label: 'Error', value: (St.Tr - w.T).toFixed(2), unit: '°C', flag: Math.abs(St.Tr - w.T) > 1 ? 'warn' : 'ok' },
      { label: 'Sunshine S', value: w.S.toFixed(0), unit: 'W/m²' },
      { label: 'Radiation error αS·k/h', value: radErr(p, w, windAt(w.u10, 1.5, 0.03)).toFixed(2), unit: '°C' },
      { label: 'Time constant τ', value: sensorTau(p, windAt(w.u10, 1.5, 0.03)).toFixed(0), unit: 's' },
      { label: 'Max / min', value: St.tmax.toFixed(1) + ' / ' + St.tmin.toFixed(1), unit: '°C' },
      { label: 'In °F', value: (St.Tr * 9 / 5 + 32).toFixed(1), unit: '°F' }
    ];
    if (p.setup === 'barometer') { const td = tendency(p, St.t); return [
      { label: 'Station pressure', value: fmtN(Pst, 1), unit: 'hPa', flag: 'accent' },
      { label: 'Reduced to sea level', value: fmtN(toSeaLevel(Pst, p.alt, w.T), 1), unit: 'hPa' },
      { label: 'Change in 3 hours', value: (td >= 0 ? '+' : '') + td.toFixed(1), unit: 'hPa', flag: td < -1.5 ? 'warn' : td > 1.5 ? 'ok' : null },
      { label: 'Station height', value: fmtN(p.alt), unit: 'm' },
      { label: 'In inches of mercury', value: (Pst * 0.02953).toFixed(2), unit: 'inHg' },
      { label: 'Station code', value: pressCode(w.Psl), unit: '', hint: 'tens, units, tenths' }
    ]; }
    if (p.setup === 'humidity') { const B = fromBulbs(St.Tr, St.Tw, Pst * 100); return [
      { label: 'Dry bulb', value: St.Tr.toFixed(1), unit: '°C' },
      { label: 'Wet bulb', value: St.Tw.toFixed(1), unit: '°C' },
      { label: 'Depression', value: (St.Tr - St.Tw).toFixed(1), unit: '°C' },
      { label: 'RH from the tables', value: B.rh.toFixed(0), unit: '%', flag: 'accent' },
      { label: 'True RH', value: w.rh.toFixed(0), unit: '%', flag: Math.abs(B.rh - w.rh) > 4 ? 'warn' : 'ok' },
      { label: 'Dew point', value: B.Td.toFixed(1), unit: '°C', hint: 'true ' + w.Td.toFixed(1) },
      { label: 'Mirror', value: p.mirrorT < w.Td ? 'dewy' : 'clear', unit: '', hint: p.mirrorT + ' °C' }
    ]; }
    if (p.setup === 'precipitation') return [
      { label: 'Rate now', value: w.R.toFixed(1), unit: 'mm/h', hint: w.snow ? 'snow' : 'rain' },
      { label: 'Fell', value: St.rain.toFixed(1), unit: 'mm' },
      { label: 'Caught', value: St.caught.toFixed(1), unit: 'mm', flag: 'accent' },
      { label: 'Tips × 0.2 mm', value: (St.tips * TIP).toFixed(1), unit: 'mm', hint: St.tips + ' tips' },
      { label: 'Catching', value: (catchEff(p, w.u10, w.snow) * 100).toFixed(0), unit: '%' },
      { label: 'Wind at the rim', value: windAt(w.u10, p.rim, TERRAINS[p.site].z0).toFixed(1), unit: 'm/s' }
    ];
    if (p.setup === 'wind') return [
      { label: 'Wind on the mast', value: u.toFixed(1), unit: 'm/s', flag: 'accent' },
      { label: 'From', value: compass(w.dir), unit: '', hint: w.dir.toFixed(0) + '°' },
      { label: 'Cups', value: cupRPM(u).toFixed(0), unit: 'rpm', hint: 'v = 2πRf × 2.6' },
      { label: 'Beaufort', value: String(beaufort(u)), unit: '', hint: BFT[beaufort(u)] },
      { label: 'Gusts', value: (w.gust * u / Math.max(0.01, w.u10)).toFixed(1), unit: 'm/s' },
      { label: 'In knots', value: (u * 1.94384).toFixed(0), unit: 'kt' },
      { label: 'At 10 m over grass', value: windAt(w.u10, 10, 0.03).toFixed(1), unit: 'm/s' }
    ];
    return [
      { label: 'Temperature', value: w.T.toFixed(1), unit: '°C' }, { label: 'Dew point', value: w.Td.toFixed(1), unit: '°C' }, { label: 'Humidity', value: w.rh.toFixed(0), unit: '%' },
      { label: 'Pressure (sea level)', value: fmtN(w.Psl, 1), unit: 'hPa', flag: 'accent' }, { label: 'Wind', value: compass(w.dir) + ' ' + w.u10.toFixed(1), unit: 'm/s' },
      { label: 'Cloud', value: Math.round(w.oktas) + '/8', unit: 'oktas' }, { label: 'Rain so far', value: St.rain.toFixed(1), unit: 'mm' }, { label: 'Sunshine', value: w.S.toFixed(0), unit: 'W/m²' }
    ];
  }
  function equation(S) {
    const p = S.p, St = S.St, w = weather(p, St.t), Pst = stationP(w.Psl, p.alt, w.T);
    if (p.setup === 'temperature') { const u = windAt(w.u10, 1.5, 0.03); return 'Δ<i>T</i> = α<i>S</i>·0.22 ÷ <i>h</i> = ' + SENSORS[p.sensor].alpha + ' × ' + (w.S * EXPOSE[p.expose].sun).toFixed(0) + ' W/m² × 0.22 ÷ ' + hConv(u * EXPOSE[p.expose].wind).toFixed(1) + ' W/(m²·K) = <b>' + radErr(p, w, u).toFixed(2) + ' °C</b> too warm'; }
    if (p.setup === 'barometer') return '<i>P</i><sub>sea</sub> = <i>P</i><sub>stn</sub> ÷ (1 − 0.0065<i>z</i>/<i>T</i>)<sup>5.256</sup> = ' + fmtN(Pst, 1) + ' ÷ (1 − 0.0065 × ' + p.alt + ' / ' + (w.T + 273.15 + 0.0065 * p.alt).toFixed(1) + ')<sup>5.256</sup> = <b>' + fmtN(toSeaLevel(Pst, p.alt, w.T), 1) + ' hPa</b>';
    if (p.setup === 'humidity') { const B = fromBulbs(St.Tr, St.Tw, Pst * 100); return '<i>e</i> = <i>e</i><sub>s</sub>(<i>T</i><sub>w</sub>) − <i>AP</i>(<i>T</i> − <i>T</i><sub>w</sub>) = ' + (es(St.Tw) / 100).toFixed(2) + ' − 0.00066 × ' + fmtN(Pst, 0) + ' × ' + (St.Tr - St.Tw).toFixed(1) + ' = ' + (B.e / 100).toFixed(2) + ' hPa → RH = <i>e</i>/<i>e</i><sub>s</sub>(<i>T</i>) = <b>' + B.rh.toFixed(0) + ' %</b>'; }
    if (p.setup === 'precipitation') return 'caught = fell × catch efficiency; tips = caught ÷ 0.2 mm = ' + St.caught.toFixed(2) + ' ÷ 0.2 = <b>' + St.tips + ' tips</b> · now catching <b>' + (catchEff(p, w.u10, w.snow) * 100).toFixed(0) + ' %</b>';
    if (p.setup === 'wind') { const u = windAt(w.u10, p.mast, TERRAINS[p.site].z0); return '<i>u</i>(<i>z</i>) = <i>u</i><sub>10</sub> ln(<i>z</i>/<i>z</i><sub>0</sub>) ÷ ln(10/<i>z</i><sub>0</sub>) = ' + w.u10.toFixed(1) + ' × ln(' + p.mast + '/' + TERRAINS[p.site].z0 + ') ÷ ln(10/' + TERRAINS[p.site].z0 + ') = <b>' + u.toFixed(1) + ' m/s</b> → cups <b>' + cupRPM(u).toFixed(0) + ' rpm</b>'; }
    return 'RH = <i>e</i><sub>s</sub>(<i>T</i><sub>d</sub>) ÷ <i>e</i><sub>s</sub>(<i>T</i>) = ' + (es(w.Td) / 100).toFixed(1) + ' ÷ ' + (es(w.T) / 100).toFixed(1) + ' hPa = <b>' + w.rh.toFixed(0) + ' %</b> · pressure ' + fmtN(w.Psl, 1) + ' hPa plots as <b>' + pressCode(w.Psl) + '</b>';
  }
  const EQ_NOTE = S => ({
    temperature: '<b>A thermometer measures itself</b>, not the air: it settles where the heat it gains (from the air, and from sunshine) balances what it loses. The white louvred screen shades it while letting air through, so the only heat it gets is the air’s. The 0.22 lumps the bulb’s shape and its view of the sky.',
    barometer: '<b>A station high up always reads low</b>; forecasters reduce every reading to sea level so that the differences left are the weather. The reduction here uses the standard lapse rate; real offices use the station’s own 12-hour mean temperature.',
    humidity: '<b>The wet bulb is cooled by evaporation</b> — the drier the air, the colder it gets. The tables assume it is whirled (WMO’s A = 6.6 × 10⁻⁴ per K); still air around it cools it less, so it reads too warm and the humidity comes out too high.',
    precipitation: '<b>Wind lifts drops over the funnel</b>: the gauge itself disturbs the airflow. Rain loses a few per cent; light, slow snow can lose most of it. The snow curve is the WMO intercomparison’s unshielded Hellmann gauge; the shield is modelled as halving the wind at the rim.',
    wind: '<b>Wind is named for where it comes from.</b> The cups turn at about the wind speed ÷ 2.6 (the anemometer factor) and stall below 0.3 m/s. Near the ground the wind slows by friction — more over a city than over grass — which is why wind is measured at 10 m on open ground.',
    station: '<b>One station is a point.</b> A forecaster plots hundreds of these models on a map and draws the isobars and fronts between them — which is the next lab. Pressure is coded as its last three figures: 1013.2 hPa → 132.'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = v => S => S.p.setup === v;
  L.register({
    id: 'g6d-weather-station',
    grade: 6, unit: '6D', topics: ['D3'],
    subject: 'earth',
    name: 'The Weather Station',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-5 (data)', 'NGSS SEP 4: analysing and interpreting data', 'CAST'],
    weight: 'Core',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to walk round the station · the card on the right is the instrument up close',
    lede: 'A real weather station on a lawn, and four days of computed weather — a cold front arrives on the second. Every instrument is modelled as the instrument it is, with the error that explains its design: a thermometer <b>in the sun</b> reads several degrees too warm, an <b>unwhirled</b> wet bulb gives the wrong humidity, a gauge in <b>wind</b> misses the snow, cups at the wrong <b>height</b> read the wrong wind. ' +
      'Read the <b>aneroid</b> as the glass falls before the front, and plot it all as a forecaster’s <b>station model</b>.',

    params: preset({}),
    presets: [
      { name: 'Noon: in the screen', params: preset({ t0: 11 }) },
      { name: 'Noon: the same thermometer in full sun', params: preset({ t0: 11, expose: 'sun' }) },
      { name: 'Painted black, in the sun', params: preset({ t0: 11, expose: 'sun', sensor: 'black' }) },
      { name: 'A fast thermistor at dawn', params: preset({ t0: 5, sensor: 'thermistor', lapse: 0.1667 }) },
      { name: 'The glass falls before the front', params: preset({ setup: 'barometer', t0: 26, lapse: 3 }) },
      { name: 'A barometer in Denver, not reduced', params: preset({ setup: 'barometer', alt: 1609, reduce: false }) },
      { name: 'A high: fair and steady', params: preset({ setup: 'barometer', pattern: 'fair' }) },
      { name: 'Whirl the psychrometer', params: preset({ setup: 'humidity', t0: 13 }) },
      { name: 'Forget to whirl it', params: preset({ setup: 'humidity', t0: 13, whirl: false }) },
      { name: 'A humid summer morning: the bulbs nearly agree', params: preset({ setup: 'humidity', pattern: 'muggy', t0: 7 }) },
      { name: 'Cool the mirror to 11 °C: dew forms', params: preset({ setup: 'humidity', mirrorT: 11 }) },
      { name: 'The front’s rain', params: preset({ setup: 'precipitation', t0: 38, lapse: 0.1667 }) },
      { name: 'Gauge on a 2 m post, no shield', params: preset({ setup: 'precipitation', t0: 38, rim: 2, lapse: 0.1667 }) },
      { name: 'A thunderstorm afternoon', params: preset({ setup: 'precipitation', pattern: 'muggy', t0: 39, lapse: 0.1667 }) },
      { name: 'The wind veers as the front passes', params: preset({ setup: 'wind', t0: 39, lapse: 1 }) },
      { name: 'A 2 m pole in a city', params: preset({ setup: 'wind', site: 'city', mast: 2, t0: 39 }) },
      { name: 'Four days at the station', params: preset({ setup: 'station', t0: 0, lapse: 3 }) },
      { name: 'The station model, as the front arrives', params: preset({ setup: 'station', t0: 41, lapse: 0.1667, units: 'us' }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Instrument', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The weather', items: [
        { key: 'pattern', type: 'select', label: 'Weather', restructure: true, options: Object.keys(PATTERNS).map(k => ({ value: k, label: PATTERNS[k].name })) },
        { key: 't0', label: 'Start at hour', min: 0, max: 90, step: 1, unit: 'h', restructure: true, fmt: v => clock(v) },
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.1667, label: '10 minutes a second' }, { value: 1, label: 'an hour a second' }, { value: 3, label: '3 hours a second' }] } ] },
      { group: 'The thermometer', when: is('temperature'), items: [
        { key: 'sensor', type: 'select', label: 'Sensor', restructure: true, options: Object.keys(SENSORS).map(k => ({ value: k, label: SENSORS[k].name })) },
        { key: 'expose', type: 'select', label: 'Where', restructure: true, options: Object.keys(EXPOSE).map(k => ({ value: k, label: EXPOSE[k].name.replace(/^in (the |a )?/, '') })) } ] },
      { group: 'The barometer', when: is('barometer'), items: [
        { key: 'alt', label: 'Station height', min: 0, max: 3000, step: 10, unit: 'm', restructure: true },
        { key: 'reduce', type: 'toggle', label: 'Set to read sea-level pressure', restructure: true } ] },
      { group: 'The psychrometer', when: is('humidity'), items: [
        { key: 'whirl', type: 'toggle', label: 'Whirl it', restructure: true },
        { key: 'mirrorT', label: 'Cool the mirror to', min: -10, max: 30, step: 0.5, unit: '°C', restructure: true } ] },
      { group: 'The gauge', when: is('precipitation'), items: [
        { key: 'rim', label: 'Rim height', min: 0.3, max: 2, step: 0.1, unit: 'm', restructure: true, fmt: v => v.toFixed(1) },
        { key: 'shield', type: 'toggle', label: 'Alter wind shield', restructure: true } ] },
      { group: 'The site', when: S => S.p.setup === 'precipitation' || S.p.setup === 'wind', items: [
        { key: 'site', type: 'select', label: 'Ground around it', restructure: true, options: Object.keys(TERRAINS).map(k => ({ value: k, label: TERRAINS[k].name })) },
        { key: 'mast', label: 'Mast', min: 2, max: 30, step: 1, unit: 'm', restructure: true, when: is('wind') } ] },
      { group: 'Display', when: is('station'), items: [
        { key: 'units', type: 'select', label: 'Plot in', display: true, options: [{ value: 'metric', label: '°C (most of the world)' }, { value: 'us', label: '°F (US maps)' }] } ] }
    ],

    setup, step, drawStage, onPointer,
    plots: [
      { title: S => ({ temperature: 'The air and the thermometer', barometer: 'The barograph', humidity: 'Dry bulb, wet bulb, dew point', precipitation: 'Rain that fell, rain that was caught', wind: 'Wind on the mast', station: 'Meteogram' })[S.p.setup], draw: plot1 },
      { title: S => ({ temperature: 'Radiation error against wind', barometer: 'Pressure against the station’s height', humidity: 'The psychrometer’s table', precipitation: 'Catch against wind', wind: 'Wind against height, over different ground', station: 'Wind direction through the front' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · using a model', params: preset({ setup: 'temperature' }),
        q: 'A glass thermometer (absorbs 30 % of sunshine) hangs in full sun of 800 W/m² with a 1 m/s breeze, which carries heat off it at 15 W/(m²·K). With the model ΔT = αS × 0.22 ÷ h, how much too warm does it read?',
        predict: { label: 'Too warm by', unit: '°C', tol: 0.02 },
        measure: S => radErr(Object.assign({}, S.p, { sensor: 'glass', expose: 'sun' }), { S: 800 }, 1),
        working: 'ΔT = 0.30 × 800 × 0.22 ÷ 15 = <b>3.5 °C</b> — why official thermometers live in a white, louvred, shaded screen.' },
      { source: 'NGSS MS-ESS2-5 · measuring humidity', params: preset({ setup: 'humidity' }),
        q: 'On a 20 °C day with 50 % relative humidity, what does the whirled wet bulb read?',
        predict: { label: 'Wet bulb', unit: '°C', tol: 0.02 },
        measure: () => wetBulb(20, dewOf(0.5 * es(20)), 101325, PSY.whirled),
        working: 'Solve e_s(Tw) − 0.00066 × 1013 × (20 − Tw) = 11.7 hPa: <b>13.8 °C</b>, a depression of 6.2 °C.' },
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'humidity' }),
        q: 'The dry bulb reads 20.0 °C and the whirled wet bulb 14.0 °C at sea level. What is the relative humidity?',
        predict: { label: 'Relative humidity', unit: '%', tol: 0.03 },
        measure: () => fromBulbs(20, 14, 101325).rh,
        working: 'e = 16.0 − 0.00066 × 1013 × 6.0 = 12.0 hPa; RH = 12.0 ÷ 23.4 = <b>51 %</b>, and the dew point is 9.6 °C.' },
      { source: 'CAST pattern · comparing stations', params: preset({ setup: 'barometer', alt: 1609, reduce: false }),
        q: 'A barometer in Denver (1,609 m, 15 °C) reads 840 hPa. Reduced to sea level, what would it read — to compare with a coastal station?',
        predict: { label: 'Sea-level pressure', unit: 'hPa', tol: 0.005 },
        measure: () => toSeaLevel(840, 1609, 15),
        working: 'P_sea = 840 ÷ (1 − 0.0065 × 1609 ÷ 298.6)^5.256 = <b>1,013 hPa</b>: an ordinary day. The 173 hPa difference is the height, not the weather.' },
      { source: 'CAST pattern · counting data', params: preset({ setup: 'precipitation', t0: 0 }),
        q: 'Over the four days the tipping bucket at 0.5 m tipped as the model records. Each tip is 0.2 mm. How much rain did it catch?',
        predict: { label: 'Rain caught', unit: 'mm', tol: 0.02 },
        measure: S => { const St = stationStart(S.p); stationStep(St, S.p, 96 - S.p.t0); return St.tips * TIP; },
        working: '227 tips × 0.2 mm = <b>45.4 mm</b> — about 3 mm less than fell, lost to the wind round the funnel.' },
      { source: 'WMO Solid Precipitation Intercomparison', params: preset({ setup: 'precipitation' }),
        q: 'An unshielded gauge in a 3 m/s wind catches snow at CE = 100 − 23.24u + 1.07u² per cent. What share of the snow does it catch?',
        predict: { label: 'Catch', unit: '%', tol: 0.02 },
        measure: () => 100 * catchEff({ rim: 10, site: 'grass', shield: false }, 3, true),
        working: '100 − 69.7 + 9.6 = <b>40 %</b>. Six of every ten snowflakes blow past — why snow is measured with shields, or on a board.' },
      { source: 'CAST pattern · an instrument', params: preset({ setup: 'wind' }),
        q: 'Cups on 7 cm arms turn at the wind ÷ 2.6. In a 5 m/s wind, about how many turns a minute? (they need 0.15 m/s just to keep turning)',
        predict: { label: 'Turns', unit: 'rpm', tol: 0.02 },
        measure: () => cupRPM(5),
        working: 'cup speed = (5 − 0.15) ÷ 2.6 = 1.87 m/s; one turn is 2π × 0.07 = 0.44 m; 1.87 ÷ 0.44 × 60 = <b>254 rpm</b>.' },
      { source: 'CAST pattern · wind and height', params: preset({ setup: 'wind', site: 'grass', mast: 2 }),
        q: 'The wind is 10 m/s at the standard 10 m over open grass (z₀ = 0.03 m). With u ∝ ln(z/z₀), what is it at 2 m?',
        predict: { label: 'Wind at 2 m', unit: 'm/s', tol: 0.02 },
        measure: () => windAt(10, 2, 0.03),
        working: 'u = 10 × ln(2/0.03) ÷ ln(10/0.03) = 10 × 4.20 ÷ 5.81 = <b>7.2 m/s</b>. A thermometer’s breeze, a gauge’s rim and an anemometer all feel different winds.' },
      { source: 'The Beaufort scale', params: preset({ setup: 'wind' }),
        q: 'Beaufort’s force B relates to wind speed as v = 0.836 B^1.5 m/s. What force is a 10 m/s wind?',
        predict: { label: 'Beaufort force', unit: '', tol: 0.01 },
        measure: () => beaufort(10),
        working: 'B = (10 ÷ 0.836)^(2/3) = 5.2, so <b>5</b>: a fresh breeze — small trees sway.' }
    ],

    walkthrough: [
      { title: 'Why a white box?', ask: 'Put the same thermometer in the screen and then in full sun at noon. Which reads the air temperature?', reveal: 'The screen. In the sun the bulb absorbs sunshine and settles several degrees above the air. The screen shades it and lets the wind through — so it measures the air.', params: preset({ t0: 11, expose: 'sun' }) },
      { title: 'Does a thermometer react at once?', ask: 'A liquid-in-glass thermometer at dawn, and a thermistor. Which follows the warming first?', reveal: 'The thermistor: a tiny bead settles in seconds; a glass bulb takes a minute or more. Its readings lag the air, more so in still air.', params: preset({ t0: 5, sensor: 'thermistor', lapse: 0.1667 }) },
      { title: 'What does a falling glass mean?', ask: 'Watch the aneroid through day 2. What happens to the pressure before the rain?', reveal: 'It falls for a day, fastest just before the front, then jumps up behind it. A falling barometer means a low or a front is coming — the old dial says RAIN.', params: preset({ setup: 'barometer', t0: 26, lapse: 3 }) },
      { title: 'Why does the wet bulb read lower?', ask: 'Whirl the psychrometer. Why is the wet thermometer colder than the dry one?', reveal: 'Water evaporates from the wick and takes heat with it. Drier air lets more evaporate, so the gap is bigger. On a muggy day the two nearly agree.', params: preset({ setup: 'humidity', t0: 13 }) },
      { title: 'Does a gauge catch all the rain?', ask: 'Raise the gauge to 2 m in the front’s wind. Does it catch more or less?', reveal: 'Less: the wind is stronger higher up, and it lifts drops over the funnel. Gauges stand low, in sheltered clearings, and in snow they wear shields.', params: preset({ setup: 'precipitation', t0: 38, rim: 2, lapse: 0.1667 }) },
      { title: 'Which way is a west wind going?', ask: 'Behind the front the vane points north-west. Which way is the air moving?', reveal: 'Toward the south-east. Winds are named for where they come from, and the vane’s arrow points into the wind.', params: preset({ setup: 'wind', t0: 46 }) },
      { title: 'Read the station model', ask: 'As the front arrives: what do the filled circle, the long barb and the falling three figures say?', reveal: 'Overcast; a strong wind from the south-west (each full feather 10 knots); pressure low and falling. Behind the front: clearing, a north-west wind, rising pressure, a big drop in dew point.', params: preset({ setup: 'station', t0: 41, lapse: 0.1667 }) }
    ],

    quiz: [
      { q: 'Official thermometers are kept in a white, louvred screen so that they', options: ['are shaded but the air can reach them', 'stay dry in the rain only', 'warm up faster', 'read the ground temperature'], answer: 0, why: 'In the sun a thermometer reads its own warmth from sunshine. Try the black bulb in the sun.' },
      { q: 'A barometer falls steadily for six hours. The most likely weather to come is', options: ['clouds and rain', 'clear and dry', 'calm and cold', 'no change'], answer: 0, why: 'Falling pressure means a low or a front approaching; rising means clearing.' },
      { q: 'The wet bulb reads much lower than the dry bulb. The air is', options: ['dry', 'humid', 'saturated', 'raining'], answer: 0, why: 'More evaporation, more cooling: a big depression means dry air. Equal readings mean 100 %.' },
      { q: 'A north wind blows', options: ['from the north toward the south', 'from the south toward the north', 'along the north side of hills', 'only in winter'], answer: 0, why: 'Winds are named for where they come from; the vane points into them.' },
      { q: 'A rain gauge in a strong wind usually', options: ['catches less than fell', 'catches more than fell', 'catches exactly what fell', 'stops working'], answer: 0, why: 'Wind lifts drops past the funnel — a few per cent of rain, much more of snow.' }
    ],

    notes: '<p><b>Temperature</b> is measured in the shade, 1.25–2 m above grass, in a ventilated white screen; °C, °F (= 1.8 °C + 32) and K (= °C + 273.15).</p>' +
      '<p><b>Air pressure</b> is measured by an aneroid (a sealed metal capsule that flexes) or a mercury barometer, and reduced to sea level so stations can be compared. Falling pressure brings clouds and rain; rising brings clearing.</p>' +
      '<p><b>Humidity</b>: a psychrometer’s wet bulb is cooled by evaporation, more in drier air; tables (or the psychrometric equation) turn the two readings into relative humidity and dew point — the temperature at which dew forms.</p>' +
      '<p><b>Precipitation</b> is caught in a gauge: a standard gauge’s measuring tube, or a tipping bucket that counts 0.2 mm at a time. Wind makes every gauge catch too little.</p>' +
      '<p><b>Wind</b>: speed from a cup anemometer, direction — where it comes from — from a vane, both at 10 m over open ground.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “A thermometer in the sun tells you how hot the air is.” It tells you how hot the thermometer is. And “a west wind blows toward the west” — it blows from the west.</div>'
  });


  L.models = L.models || {};
  L.models['g6d-weather-station'] = { es, dewOf, weather, sunElev, PATTERNS, TF, SENSORS, EXPOSE, hConv, radErr, sensorTau, stationP, toSeaLevel, tendency,
    PSY, wetBulb, fromBulbs, TIP, windAt, TERRAINS, catchEff, CUP, cupRPM, beaufort, BFT, compass, stationStart, stationStep };
})(window.InsightLab);
