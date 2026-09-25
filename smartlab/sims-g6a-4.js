/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-4  One Event, Four Spheres
   (A4.5 Interactions among Earth's four spheres; A4.6 Modeling an
   Earth-system event)

   Four events, each a chain of interactions computed link by link, each
   link a published model, each chain checked against a real event:
     eruption  — SO₂ to the stratosphere → a veil of droplets → less sunlight →
                 a cooler world, a shrinking ocean, soils that breathe out
                 less CO₂; ash and lahars at home. Checked against Pinatubo.
     hurricane — warm sea → the strongest wind it can power → the storm tide
                 on the shelf → floods; marshes take the edge off; slow
                 storms drown the land in rain. Checked against Katrina,
                 Camille, Ike and Andrew.
     wildfire  — heat, dry air and wind → fire danger → a fire that runs with
                 the wind and up the slopes, into the crowns → bare soil → the
                 next storm runs off. Checked against Black Saturday and the
                 NRCS runoff tables.
     drought   — less rain, more evaporation → dry soil, thin crops → wells
                 pumping the aquifer down → the land sinks, for good.
                 Checked against Fresno's evaporation and the San Joaquin
                 Valley's subsidence.
   The landscapes are blocks cut open to show the ground underneath.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.TERRAIN, EARTH, GEO and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, TR = () => window.TERRAIN, GE = () => window.GEO;

  /* ============================================================
     EVENT 1 — A VOLCANO ERUPTS (geosphere → atmosphere → hydrosphere, biosphere)
     SO₂ blasted into the stratosphere becomes sulfuric-acid droplets in about
     a month and falls out over about a year. The droplets' optical depth
     reflects sunlight (−25 W/m² per unit optical depth, Hansen et al.); a
     two-layer ocean (Geoffroy et al. 2013, the CMIP5 models' mean) cools and
     recovers; the ocean shrinks as it cools (0.12 m per 10²⁴ J); cooler soils
     breathe out less CO₂ (Q10 = 2 on 110 GtC a year of respiration).
     ============================================================ */
  const TROPO = 16;                                              // km: the tropopause over the tropics
  function stratFrac(plumeKm) { return clamp((plumeKm - (TROPO - 2)) / 4, 0, 1); }
  /* the eruption column's height from how fast magma erupts (Mastin et al. 2009: H = 2.00 V^0.241, V in m³/s DRE) */
  const plumeHeight = vdre => 2.00 * Math.pow(vdre, 0.241);
  function eruptionRun(o) {
    const M = o.so2 * stratFrac(o.plume), trop = Math.abs(o.lat) < 25;
    const tauC = 35 / 365, tauR = trop ? 1.0 : 0.7, conv = (98 / 64) / 0.75, kAOD = 0.0060, Fper = -25;
    const C = 7.3, CD = 106, lam = 1.13, gam = 0.73, RESP = 110, Q10 = 2;
    let S = M, A = 0, T = 0, TD = 0, H = 0, cumC = 0, t = 0;
    const dt = 1 / 365, rows = [];
    const years = o.years || 6;
    for (let k = 0; k <= 365 * years; k++) {
      const Aeff = A <= 30 ? A : 30 * Math.pow(A / 30, 2 / 3);   // big eruptions grow bigger, less reflective droplets
      const cover = trop ? 1 - 0.65 * Math.exp(-t / 0.3) : 0.5;  // the veil spreads from its latitude band
      const aod = kAOD * Aeff * cover, F = Fper * aod;
      const dR = RESP * (Math.pow(Q10, T / 10) - 1);
      if (k % 15 === 0) rows.push({ t, aod, F, T, TD, sl: H * 0.12e-24 * 0.9 * 1000, dR, dCO2: cumC / 2.124, rain: 3 * T, so2: S, aer: A });
      S += (-S / tauC) * dt; A += (S / tauC * conv - A / tauR) * dt;
      T += (F - lam * T - gam * (T - TD)) / C * dt; TD += gam * (T - TD) / CD * dt;
      H += (F - lam * T) * 5.1e14 * 3.156e7 * dt;
      cumC += dR * dt; t += dt;
    }
    return rows;
  }
  const peakOf = (rows, k) => rows.reduce((m, r) => r[k] < m[k] ? r : m, rows[0]);
  /* ash on the ground: thinning exponentially with distance (Pyle 1989), scaled with the eruption */
  const ashAt = (so2, rKm, down) => 0.6 * Math.pow(so2 / 17, 0.7) * Math.exp(-rKm / (12 * (down ? 1.6 : 0.7)));
  const ERUPTIONS = [                                            // SO₂ to the stratosphere (Mt) and the observed global cooling (°C)
    { name: 'Agung 1963', so2: 7, lat: -8, cool: [0.1, 0.3] },
    { name: 'El Chichón 1982', so2: 7, lat: 17, cool: [0.1, 0.3] },
    { name: 'Pinatubo 1991', so2: 17, lat: 15, cool: [0.3, 0.5] },
    { name: 'Krakatau 1883', so2: 30, lat: -6, cool: [0.3, 0.6] },
    { name: 'Tambora 1815', so2: 60, lat: -8, cool: [0.4, 1.0] }
  ];

  /* ============================================================
     EVENT 2 — A HURRICANE MAKES LANDFALL (hydrosphere → atmosphere → hydrosphere, geosphere, biosphere)
     Warm sea water sets the strongest wind a storm can reach (DeMaria &
     Kaplan 1994); the wind sets the central pressure (Atkinson & Holliday
     1977) and a Holland (1980) wind field. The storm surge is the
     bathystrophic storm tide (Freeman et al. 1957; Bodine 1971): wind stress
     and the Coriolis force on the alongshore current it drives pile water
     against the coast across the shelf, plus 1 cm for every hPa of low
     pressure and the breaking waves' setup. Marshes take ~7 cm off the surge
     per km (USACE); rain totals follow the Kraft rule, ×7 % per °C.
     ============================================================ */
  const PN = 1010, RHOA = 1.15, RHOW = 1025, G = 9.81, OMEGA = 7.292e-5;
  const mpi = sst => 28.2 + 55.8 * Math.exp(0.1813 * (sst - 30));          // m/s, 1-min sustained
  const pcOf = v => PN - Math.pow(v * 1.944 / 6.7, 1 / 0.644);              // hPa
  const catOf = v => v >= 70 ? 5 : v >= 58 ? 4 : v >= 50 ? 3 : v >= 43 ? 2 : v >= 33 ? 1 : 0;   // Saffir–Simpson, m/s
  const cdSea = V => Math.min(2.5e-3, (0.8 + 0.065 * V) * 1e-3);
  function hollandOf(Pc, Rmax, B) {
    const dP = (PN - Pc) * 100;
    return r => { const x = Math.pow(Rmax / Math.max(r, 0.5), B); return { P: Pc + (PN - Pc) * Math.exp(-x), V: Math.sqrt(B * dP / RHOA * x * Math.exp(-x)) }; };
  }
  const SHELVES = { wide: { L: 120, edge: 60, p: 2 }, narrow: { L: 15, edge: 60, p: 1 } };
  /* the storm tide along a line out from the coast, Rmax to the right of the track, as the eye comes in */
  function stormTide(o) {
    const sh = SHELVES[o.shelf], L = sh.L * 1000, N = 80, dx = L / N, h0 = 2;
    const f = 2 * OMEGA * Math.sin(29 * Math.PI / 180), Cb = 0.0025, W = hollandOf(o.Pc, o.Rmax, 1.3), U = o.U;
    const x = [], h = [], Q = new Float64Array(N);
    for (let i = 0; i < N; i++) { x.push((i + 0.5) * dx); h.push(h0 + (sh.edge - h0) * Math.pow((i + 0.5) / N, sh.p)); }
    const yT = o.Rmax * 1000, wave = 0.1 * 0.2 * o.V;               // wave setup: a tenth of the waves' height, ≈ 0.2 V
    const hist = [], dt = 150, t0 = -24 * 3600, t1 = 8 * 3600;
    let best = { eta: -1 }, prof = null;
    for (let t = t0; t <= t1; t += dt) {
      const xc = -U * t, eta = new Float64Array(N);
      let e = 0;
      for (let i = N - 1; i >= 0; i--) {
        const rx = x[i] - xc, ry = yT, rr = Math.hypot(rx, ry), w = W(rr / 1000), V10 = w.V * 0.8;
        const ex = -ry / rr, ey = rx / rr, ix = -rx / rr, iy = -ry / rr, a = 0.35;
        const ux = V10 * (Math.cos(a) * ex + Math.sin(a) * ix), uy = V10 * (Math.cos(a) * ey + Math.sin(a) * iy);
        const s = RHOA * cdSea(V10) * V10, D = Math.max(0.5, h[i] + e);
        Q[i] += dt * (s * uy / RHOW - Cb * Math.abs(Q[i]) * Q[i] / (D * D));
        e -= (s * ux / RHOW + f * Q[i]) / (G * D) * dx; eta[i] = e;
      }
      const pc = W(Math.hypot(xc, yT) / 1000).P, ib = (PN - pc) * 100 / (RHOW * G);
      const near = Math.max(0, 1 - Math.hypot(xc, yT) / (4 * o.Rmax * 1000));
      const tot = e + ib + wave * near;
      if ((t - t0) % 1800 < dt) hist.push({ t: t / 3600, eta: tot, setup: e, ib, wave: wave * near });
      if (tot > best.eta) { best = { eta: tot, setup: e, ib, wave: wave * near, t: t / 3600 }; prof = Array.from(eta).map((v, i) => [x[i] / 1000, v + ib]); }
    }
    return { best, hist, prof, h };
  }
  function hurricaneRun(p) {
    const V = p.sst >= 26 ? mpi(p.sst) : Math.min(32, mpi(p.sst)), Pc = pcOf(V);
    const tide = stormTide({ Pc, Rmax: p.rmax, U: p.speed, V, shelf: p.shelf });
    const atCoast = tide.best.eta, atTown = Math.max(0, atCoast - 0.07 * p.marsh);
    const rain = 2540 / (p.speed * 1.944) * Math.pow(1.07, p.sst - 28.5);    // Kraft: inches = 100 / forward speed (kt)
    return { V, Pc, cat: catOf(V), tide, atCoast, atTown, flood: Math.max(0, atTown - TOWN_Z), rain, overwash: atCoast > DUNE_Z };
  }
  const TOWN_Z = 3, DUNE_Z = 4;                                    // m above mean sea level
  const HURRICANES = [                                             // landfall pressure (hPa), Rmax (km), forward speed (m/s), shelf, peak surge measured (m)
    { name: 'Katrina 2005', Pc: 928, Rmax: 55, U: 6, shelf: 'wide', obs: [7.3, 8.5] },
    { name: 'Camille 1969', Pc: 909, Rmax: 18, U: 7, shelf: 'wide', obs: [6.9, 7.5] },
    { name: 'Ike 2008', Pc: 952, Rmax: 80, U: 5, shelf: 'wide', obs: [4.6, 6.1] },
    { name: 'Andrew 1992 (open coast)', Pc: 922, Rmax: 18, U: 8, shelf: 'narrow', obs: [1.5, 3.0] }
  ];

  /* ============================================================
     EVENT 3 — A WILDFIRE (atmosphere → biosphere → geosphere, hydrosphere)
     Fire weather is the McArthur forest fire danger index (Noble et al.
     1980). The fire spreads over the ground by minimum travel time with
     Rothermel's (1972) wind and slope factors for timber litter; above Van
     Wagner's (1977) intensity threshold it climbs into the crowns and runs
     3.34 times faster (Rothermel 1991). Byram's intensity and flame length.
     After it: bare, water-repellent soil — the NRCS curve number rises from
     55 to 85 — so a storm runs off instead of soaking in.
     ============================================================ */
  const ffdi = (T, RH, V, DF) => 2 * Math.exp(-0.45 + 0.987 * Math.log(Math.max(0.1, DF)) - 0.0345 * RH + 0.0338 * T + 0.0234 * V);
  const dangerOf = F => F >= 100 ? 'catastrophic' : F >= 75 ? 'extreme' : F >= 50 ? 'severe' : F >= 25 ? 'very high' : F >= 12 ? 'high' : 'low to moderate';
  const fuelMoisture = (T, H) => Math.max(1.5, 5.658 + 0.04651 * H + 0.0003151 * H * H * H / T - 0.1854 * Math.pow(T, 0.77));
  const etaM = m => { const r = Math.min(1, m / 25); return Math.max(0, 1 - 2.59 * r + 5.11 * r * r - 3.52 * r * r * r); };
  const RC = (() => { const sig = 1500; return { C: 7.47 * Math.exp(-0.133 * Math.pow(sig, 0.55)), B: 0.02526 * Math.pow(sig, 0.54), E: 0.715 * Math.exp(-3.59e-4 * sig) }; })();
  const phiWind = kmh => RC.C * Math.pow(kmh * 0.4 * 1000 / 60 * 3.281, RC.B) * Math.pow(0.5, -RC.E);
  const phiSlope = tanT => 5.275 * Math.pow(0.012, -0.3) * tanT * tanT;
  const FIRE = { R0: 0.4, fuel: 1.2, crownBase: 4, foliarMC: 100, heat: 18000 };   // m/min, kg/m² burned, m, %, kJ/kg
  const crownThreshold = () => Math.pow(0.010 * FIRE.crownBase * (460 + 25.9 * FIRE.foliarMC), 1.5);   // kW/m (Van Wagner 1977)
  /* head-fire speed (m/min) along a direction with this wind component and upslope */
  function headRos(p, windAlong, tanUp) {
    const base = FIRE.R0 * etaM(fuelMoisture(p.temp, p.rh)) * (0.4 + 0.6 * p.dry / 10);
    return base * (1 + phiWind(Math.max(0, windAlong)) + (tanUp > 0 ? phiSlope(tanUp) : 0));
  }
  const byram = rosMmin => FIRE.heat * FIRE.fuel * rosMmin / 60;                  // kW/m
  const flameLength = I => 0.0775 * Math.pow(I, 0.46);                             // m
  const scsRunoff = (Pmm, CN) => { const S = 25400 / CN - 254, Ia = 0.2 * S; return Pmm <= Ia ? 0 : (Pmm - Ia) * (Pmm - Ia) / (Pmm - Ia + S); };
  const CN_FOREST = 55, CN_BURNED = 85;

  /* ============================================================
     EVENT 4 — A DROUGHT (atmosphere → hydrosphere → biosphere, geosphere)
     A farming valley on Fresno's climate normals. Evaporation demand by
     Hargreaves (1985); the wild land's soil is a 150 mm bucket and its
     plants grow as Lieth's Montreal model says for the water they use;
     the farm's canal water comes from mountain snow and falls as the square
     of the rain; wells make up the rest. Pumping beyond what recharge
     replaces lowers the aquifer (effective storage 0.08), and every new low
     squeezes the clay: 1 m of sinking per 15 m of head, the San Joaquin
     Valley's own ratio (Poland et al. 1975).
     ============================================================ */
  const FRESNO = { P: [55, 52, 48, 25, 11, 5, 1, 1, 5, 17, 29, 45], T: [8.0, 10.6, 13.3, 16.3, 20.8, 24.9, 28.1, 27.4, 24.3, 18.7, 12.1, 7.6],
    TR: [9.5, 11, 13, 15, 16.5, 17.5, 18, 18, 17.5, 16, 12, 9], KC: [0.4, 0.4, 0.6, 0.9, 1.05, 1.1, 1.1, 1.05, 0.9, 0.6, 0.4, 0.4], lat: 36.8 };
  const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MJ = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  function raOf(m, lat) {                                          // extraterrestrial radiation, mm/day equivalent (FAO-56)
    const J = MJ[m], phi = lat * Math.PI / 180, dr = 1 + 0.033 * Math.cos(2 * Math.PI * J / 365), d = 0.409 * Math.sin(2 * Math.PI * J / 365 - 1.39);
    const ws = Math.acos(-Math.tan(phi) * Math.tan(d));
    return 0.408 * 24 * 60 / Math.PI * 0.0820 * dr * (ws * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(ws));
  }
  const et0Month = (m, dT) => 0.0023 * raOf(m, FRESNO.lat) * (FRESNO.T[m] + dT + 17.8) * Math.sqrt(FRESNO.TR[m]) * MDAYS[m];
  const montreal = aet => Math.max(0, 3000 * (1 - Math.exp(-0.0009695 * (aet - 20))));
  const BUCKET = 150, SY = 0.08, SUB_RATIO = 1 / 15;
  function droughtRun(p) {
    const yrs = 10, first = 2, rows = [];
    let W = 60, head = 0, low = 0, sub = 0;
    for (let y = 0; y < yrs; y++) {
      for (let m = 0; m < 12; m++) {
        const dr = y >= first && y < first + p.years, rf = dr ? p.rain / 100 : 1, dT = dr ? p.warm : 0;
        const P = FRESNO.P[m] * rf, e0 = et0Month(m, dT);
        const aet = Math.min(W + P, e0 * Math.min(1, (W + P) / (0.5 * BUCKET)));
        W = Math.min(BUCKET, W + P - aet);
        const need = Math.max(0, FRESNO.KC[m] * e0 - 0.7 * P), canal = 0.6 * need * rf * rf, wells = 0.4 * need;
        const extra = p.pump ? need - canal - wells : 0, got = canal + wells + extra;
        head -= extra / 1000 / SY;
        if (!dr && head < 0) head = Math.min(0, head + 2 / 12 * 0.5);          // the aquifer refills slowly after
        if (head < low) { sub += (low - head) * SUB_RATIO; low = head; }
        rows.push({ t: y + (m + 0.5) / 12, dr, P, e0, aet, W, need, got, extra, head, sub, npp: montreal(aet * 12), crop: need > 0 ? got / need : 1 });
      }
    }
    return rows;
  }
  const yearOf = (rows, y) => { const r = rows.filter(q => Math.floor(q.t) === y); const s = k => r.reduce((a, q) => a + q[k], 0); return { P: s('P'), e0: s('e0'), aet: s('aet'), need: s('need'), got: s('got'), extra: s('extra'), head: r[11].head, sub: r[11].sub }; };

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'eruption', label: 'A volcano erupts', teaches: ['A4.5', 'A4.6'] },
    { value: 'hurricane', label: 'A hurricane comes ashore', teaches: ['A4.5', 'A4.6'] },
    { value: 'wildfire', label: 'A wildfire, and the rain after it', teaches: ['A4.5', 'A4.6'] },
    { value: 'drought', label: 'A drought in a farming valley', teaches: ['A4.5', 'A4.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'eruption',
    so2: 17, plume: 34, band: 'tropics',
    sst: 28.5, rmax: 40, speed: 5, shelf: 'wide', marsh: 10,
    temp: 35, rh: 15, wind: 30, dry: 9, windFrom: 'west', ignite: 'west', storm: 50,
    rain: 55, warm: 1, years: 4, pump: true
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function hash2(i, j, s) { const v = Math.sin(i * 127.1 + j * 311.7 + (s || 0) * 74.7) * 43758.5453; return v - Math.floor(v); }
  function vnoise(x, y, s) {                                     // smooth value noise for the landscapes
    const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    return hash2(i, j, s) * (1 - a) * (1 - b) + hash2(i + 1, j, s) * a * (1 - b) + hash2(i, j + 1, s) * (1 - a) * b + hash2(i + 1, j + 1, s) * a * b;
  }

  /* ---------------- the eruption: the world over six years ---------------- */
  const ER_YEARS = 6;
  const bandLat = p => p.band === 'tropics' ? 15 : 60;
  function eruptionOf(S) {
    const p = S.p, key = [p.so2, p.plume, p.band].join('|');
    if (S._er && S._er.key === key) return S._er;
    const rows = eruptionRun({ so2: p.so2, plume: p.plume, lat: bandLat(p), years: ER_YEARS });
    const pk = peakOf(rows, 'T'), y2 = rows.filter(r => r.t >= 0.5 && r.t < 1.5);
    S._er = { key, rows, peak: pk, co2: y2.reduce((s, r) => s + r.dR, 0) / y2.length / 2.124, sl: peakOf(rows, 'sl').sl };
    return S._er;
  }
  const erAt = (E, t) => { const i = clamp(Math.floor(t / (15 / 365)), 0, E.rows.length - 2), a = E.rows[i], b = E.rows[i + 1], f = clamp((t - a.t) / (b.t - a.t), 0, 1); const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f; return o; };
  /* the eruption's clock: the first days slowly, so the column can be watched, then a month a second */
  const erRate = t => 0.0022 + (1 / 12 - 0.0022) * smooth(0.03, 0.10, t);

  /* ---------------- the hurricane ---------------- */
  const HU_T0 = -24, HU_T1 = 8;
  function hurricaneOf(S) {
    const p = S.p, key = [p.sst, p.rmax, p.speed, p.shelf].join('|');
    if (S._hu && S._hu.key === key) return S._hu;
    S._hu = Object.assign({ key }, hurricaneRun({ sst: p.sst, rmax: p.rmax, speed: p.speed, shelf: p.shelf, marsh: 0 }));
    return S._hu;
  }
  const huAt = (Hh, t) => { const h = Hh.tide.hist; let i = 0; while (i < h.length - 2 && h[i + 1].t < t) i++; const a = h[i], b = h[i + 1], f = clamp((t - a.t) / (b.t - a.t), 0, 1); return a.eta + (b.eta - a.eta) * f; };
  const MARSH_LOSS = 0.07;                                       // m of surge lost per km of marsh (USACE)
  const townLevel = (eta, p) => Math.max(0, eta - MARSH_LOSS * p.marsh);

  /* ---------------- the wildfire: the landscape and the fire's arrival times ---------------- */
  const WF = { size: 8, n: 56, zBase: -0.55 };
  const wfHeight = (x, y) => 0.20 + 0.95 * smooth(0.5, 3.6, Math.abs(y + 0.25 * Math.sin(x * 0.6))) + 0.10 * vnoise(x * 0.9 + 3, y * 0.9 + 7, 1) - 0.06 * Math.exp(-Math.pow((y + 0.25 * Math.sin(x * 0.6)) / 0.18, 2));
  const wfCreek = (x, y) => Math.abs(y + 0.25 * Math.sin(x * 0.6)) < 0.09;
  const wfTown = (x, y) => x > 2.3 && x < 3.8 && Math.abs(y - 0.55) < 0.55;
  const IGNITE = { west: [-3.4, -0.3], slope: [-2.2, 1.5], ridge: [-1.2, -3.3] };
  const WIND_TO = { west: [1, 0], east: [-1, 0], south: [0, 1] };   // the wind blows from … toward …
  /* minimum travel time over the grid: each step between cells takes distance ÷ the fire's speed along it
     (Rothermel's wind and slope factors; backing and flanking fire at the no-wind rate; crowning above
     Van Wagner's threshold) */
  function fireOf(S) {
    const p = S.p, key = [p.temp, p.rh, p.wind, p.dry, p.windFrom, p.ignite].join('|');
    if (S._fire && S._fire.key === key) return S._fire;
    const n = WF.n, d = WF.size / n, N = n * n, x0 = -WF.size / 2;
    const zc = new Float32Array(N), kind = new Uint8Array(N);    // 0 forest, 1 grass, 2 town, 3 water
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * d, y = x0 + (j + 0.5) * d, k = j * n + i;
      zc[k] = wfHeight(x, y);
      kind[k] = wfCreek(x, y) ? 3 : wfTown(x, y) ? 2 : zc[k] < 0.32 ? 1 : 0;
    }
    const T = new Float64Array(N).fill(Infinity), I = new Float64Array(N), crown = new Uint8Array(N), W = WIND_TO[p.windFrom], thr = crownThreshold();
    const [gx, gy] = IGNITE[p.ignite], si = clamp(Math.floor((gx - x0) / d), 0, n - 1), sj = clamp(Math.floor((gy - x0) / d), 0, n - 1);
    T[sj * n + si] = 0;
    const heap = [[0, sj * n + si]];
    const push = (t, k) => { heap.push([t, k]); let c = heap.length - 1; while (c > 0) { const pp = (c - 1) >> 1; if (heap[pp][0] <= heap[c][0]) break; [heap[pp], heap[c]] = [heap[c], heap[pp]]; c = pp; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
    const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [1, 2], [-1, 2], [-2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1]];
    const done = new Uint8Array(N);
    while (heap.length) {
      const [t, k] = pop();
      if (done[k]) continue; done[k] = 1;
      const i = k % n, j = (k - i) / n;
      for (const [di, dj] of NB) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
        const k2 = jj * n + ii; if (done[k2] || kind[k2] === 3) continue;
        const L = Math.hypot(di, dj) * d, ux = di / Math.hypot(di, dj), uy = dj / Math.hypot(di, dj);
        const along = p.wind * (ux * W[0] + uy * W[1]), tanUp = (zc[k2] - zc[k]) / L;
        let r = headRos(p, along, tanUp);                                     // m/min
        if (kind[k2] === 1) r *= 1.8;                                         // grass burns faster, with less fuel
        if (kind[k2] === 2) r *= 0.5;                                         // gardens and roads slow it
        const Ib = byram(r) * (kind[k2] === 1 ? 0.35 : 1);
        if (kind[k2] === 0 && Ib > thr) { r *= 3.34; crown[k2] = 1; }        // it climbs into the crowns
        const tt = t + L * 1000 / r / 60;                                     // hours
        if (tt < T[k2]) { T[k2] = tt; I[k2] = kind[k2] === 0 && crown[k2] ? byram(r / 3.34) * 3.34 : Ib; push(tt, k2); }
      }
    }
    S._fire = { key, T, I, crown, kind, zc, n, d };
    return S._fire;
  }
  const FIRE_H = 10, BURN_H = 0.7;
  const burnedHa = (Fi, t) => { let c = 0; for (let k = 0; k < Fi.T.length; k++) if (Fi.T[k] <= t) c++; return c * Fi.d * Fi.d * 100; };
  /* the wildfire's clock: ten hours of fire, a storm, ten years of regrowth */
  function wfPhase(tw) {
    if (tw < 60) return { phase: 'fire', h: tw / 6 };
    if (tw < 74) return { phase: 'storm', h: FIRE_H, s: (tw - 60) / 14 };
    return { phase: 'recovery', h: FIRE_H, s: 1, y: Math.min(10, (tw - 74) / 2) };
  }

  /* ---------------- the drought ---------------- */
  function droughtOf(S) {
    const p = S.p, key = [p.rain, p.warm, p.years, p.pump].join('|');
    if (S._dr && S._dr.key === key) return S._dr;
    const rows = droughtRun({ rain: p.rain, warm: p.warm, years: p.years, pump: p.pump });
    S._dr = { key, rows, years: Array.from({ length: 10 }, (_, y) => yearOf(rows, y)) };
    return S._dr;
  }
  const drAt = (D, t) => D.rows[clamp(Math.floor(t * 12), 0, D.rows.length - 1)];

  /* ---------------- set up and step ---------------- */
  const HOMES = {
    eruption: { theta: -2.05, phi: 0.36, dist: 84, target: [0, 0, 3], fov: 0.66, min: 25, max: 200 },
    hurricane: { theta: -2.45, phi: 0.36, dist: 80, target: [-2, 0, 0], fov: 0.66, min: 25, max: 200 },
    wildfire: { theta: -1.95, phi: 0.50, dist: 17.5, target: [0, 0, 0.3], fov: 0.66, min: 5, max: 40 },
    drought: { theta: -2.1, phi: 0.36, dist: 64, target: [0, 0, -0.5], fov: 0.66, min: 20, max: 160 }
  };
  const homeFor = (su, narrow) => { const h = HOMES[su]; return narrow ? Object.assign({}, h, { dist: h.dist * 1.3 }) : h; };
  function setup(S) {
    const p = S.p, home = homeFor(p.setup, !!S._narrow);
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera(Object.assign({}, home, { target: home.target.slice() }));
      S.cam.minDist = home.min; S.cam.maxDist = home.max; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
    S.seed = 20260925; S.ta = 0;
    S.te = 0;                                                    // eruption: years since
    S.th = HU_T0;                                                // hurricane: hours to landfall
    S.tw = 0;                                                    // wildfire: the scripted clock, s
    S.td = 0;                                                    // drought: years
    S._block = null;
    if (p.setup === 'eruption') eruptionOf(S);
    if (p.setup === 'hurricane') hurricaneOf(S);
    if (p.setup === 'wildfire') fireOf(S);
    if (p.setup === 'drought') droughtOf(S);
  }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'eruption') S.te = Math.min(ER_YEARS, S.te + dt * erRate(S.te));
    else if (p.setup === 'hurricane') S.th = Math.min(HU_T1, S.th + dt);
    else if (p.setup === 'wildfire') S.tw = Math.min(94, S.tw + dt);
    else S.td = Math.min(10, S.td + dt * 0.25);
  }

  /* ============================================================
     THE LANDSCAPES — each a block of land cut open, in km (heights exaggerated, and said so)
     ============================================================ */
  const ER = { size: 36, n: 60, zBase: -3.0, vex: 3 };
  function erHeight(x, y, collapsed) {
    const r = Math.hypot(x, y), ang = Math.atan2(y, x);
    let z = 0.14 + 0.06 * vnoise(x * 0.25 + 11, y * 0.25 + 5, 2);                 // the plain
    z += 1.55 * Math.exp(-Math.pow(r / 5.2, 1.5));                                  // the stratovolcano
    const dA = Math.abs((((ang * 7 / TAU + 0.3) % 1) + 1) % 1 - 0.5) * TAU / 7;     // to the nearest of seven valleys
    z -= 0.12 * Math.exp(-Math.pow(dA * r / 0.9, 2)) * smooth(1.5, 4, r) * (1 - smooth(11, 17, r));
    if (collapsed) z -= 0.42 * Math.exp(-Math.pow(r / 1.35, 4));                   // the summit falls into a caldera
    z -= 0.32 * smooth(-12.5, -16.5, x);                                            // the coastal plain dips under the sea
    return z * ER.vex;
  }
  const erValley = (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x), dA = Math.abs((((a * 7 / TAU + 0.3) % 1) + 1) % 1 - 0.5) * TAU / 7; return r > 2.2 && r < 16 && dA * r < 0.45; };
  const ASH_TO = [-0.72, -0.69];                                                    // the wind carries the ash to the south-west
  function erAsh(x, y, so2) { const r = Math.hypot(x, y), down = r > 0 && (x * ASH_TO[0] + y * ASH_TO[1]) / r > 0.5; return ashAt(so2, r, down); }
  const HU = { size: 40, n: 64, zBase: -6.8, vex: 0.25 };                          // world km per metre of height: ×250
  function huMetres(x, y, W) {
    if (x > 0) return -(1 + 19 * Math.pow(x / 20, 1.5));                            // the shelf deepens offshore
    let z;
    if (x > -0.6) z = 1.5 * (-x / 0.6) + 4 * Math.exp(-Math.pow((x + 0.35) / 0.2, 2));   // beach, then the dune
    else if (x > -(0.6 + W)) z = 0.4 + 0.25 * vnoise(x * 1.3 + 2, y * 1.3 + 9, 3) - 0.55 * Math.exp(-Math.pow(Math.sin(y * 1.9 + x * 0.7) / 0.12, 2));   // marsh and its creeks
    else z = 2.4 + 0.28 * (-(0.6 + W) - x) + 0.6 * vnoise(x * 0.4, y * 0.4, 4);       // the town's plain rises inland
    return z - 3.2 * Math.exp(-Math.pow((y - 6.5) / 0.35, 2)) * (x < -0.6 ? 1 : 0);   // a river down to the sea
  }
  const WFB = { size: WF.size, n: WF.n, zBase: WF.zBase };
  const DR = { size: 30, n: 56, zBase: -4.4, vex: 4, under: 10 };
  const WELLS = [-3, 2];
  function drHeight(x, y, sub) {
    let z = 0.07 + 0.01 * vnoise(x * 0.3 + 4, y * 0.3 + 2, 5);
    z += 1.05 * smooth(7, 15, x) * (0.85 + 0.3 * vnoise(x * 0.35, y * 0.35, 6));     // the Sierra foothills
    z -= 0.009 * Math.exp(-Math.pow((y + 8.5) / 0.5, 2)) * (1 - smooth(7, 10, x));    // the river
    z -= sub / 1000 * Math.exp(-(Math.pow(x - WELLS[0], 2) + Math.pow(y - WELLS[1], 2)) / 60);   // the bowl that pumping sinks
    return z * DR.vex;
  }
  const drCanal = (x, y) => Math.abs(x - 3.2) < 0.28 && y > -8.5;
  const drField = (x, y) => { const i = Math.floor((x + 15) / 2.2), j = Math.floor((y + 15) / 1.8); return { i, j, h: hash2(i, j, 9) }; };

  function blockOf(S) {
    const p = S.p, T = TR(), su = p.setup;
    const key = su + '|' + (su === 'eruption' ? (S.te > 0.004 ? 'caldera' : 'cone') : su === 'hurricane' ? p.marsh : su === 'drought' ? Math.round((drAt(droughtOf(S), S.td).sub) * 50) : '');
    if (S._block && S._block.key === key) return S._block.B;
    let B;
    if (su === 'eruption') B = T.block({ n: ER.n, size: ER.size, zBase: ER.zBase, height: (x, y) => erHeight(x, y, S.te > 0.004) });
    else if (su === 'hurricane') B = T.block({ n: HU.n, size: HU.size, zBase: HU.zBase, height: (x, y) => huMetres(x, y, p.marsh) * HU.vex });
    else if (su === 'wildfire') B = T.block({ n: WFB.n, size: WFB.size, zBase: WFB.zBase, height: wfHeight });
    else { const sub = drAt(droughtOf(S), S.td).sub; B = T.block({ n: DR.n, size: DR.size, zBase: DR.zBase, height: (x, y) => drHeight(x, y, sub) }); }
    S._block = { key, B };
    return B;
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const th = g => g.theme;
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const fmtN = (v, dd) => v.toLocaleString('en', { maximumFractionDigits: dd || 0, minimumFractionDigits: dd || 0 });
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function tag(ctx, x, y, text, col, o) {
    o = o || {};
    ctx.save(); ctx.font = o.font || mono(9, 600);
    const pw = ctx.measureText(text).width + 10, ph = 15, x0 = o.align === 'right' ? x - pw : o.align === 'center' ? x - pw / 2 : x;
    ctx.fillStyle = o.bg || 'rgba(6,10,20,.84)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y - ph / 2, pw, ph, 4); else ctx.rect(x0, y - ph / 2, pw, ph); ctx.fill();
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + 5, y + 0.5);
    ctx.restore();
  }
  /* keep the block where the stage has room for it: centre at (W/2 + fx·W, H/2 + fy) */
  function placeView(S, g, fx, fy) {
    const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = HOMES[S.p.setup].target;
    cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy];
    cam.update();
  }
  const sky = (g, top, bottom) => { const ctx = g.ctx, gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h); };
  const scaleNote = (g, text) => { const ctx = g.ctx; ctx.save(); ctx.font = mono(8.5); ctx.fillStyle = 'rgba(200,210,230,.75)'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(text, g.w - 12, g.h - 8); ctx.restore(); };

  /* ---------------- eruption ---------------- */
  const VILLAGES = [[8, -6], [-7, 8], [10, 7], [-9, -9], [4, 12]];
  function drawEruption(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TR(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const E = eruptionOf(S), t = S.te, now = erAt(E, t), erupting = t < 0.04, fresh = t > 0.0015;
    sky(g, erupting ? '#3A3A44' : '#6E8FB8', erupting ? '#6B6360' : '#B9CFE3');
    placeView(S, g, narrow ? 0 : -0.19, narrow ? 10 : 34);
    const B = blockOf(S), rainy = (t % 1) > 0.15 && (t % 1) < 0.55, lahar = fresh ? Math.exp(-t / 2.5) : 0;
    const items = [];
    VILLAGES.forEach(([vx, vy], vi) => { for (let k = 0; k < 6; k++) { const hx = vx + (k % 3) * 0.55 - 0.5, hy = vy + Math.floor(k / 3) * 0.6; items.push({ at: [hx, hy, B.zAt(hx, hy)], draw: (c2, q) => T.house(c2, cam, [hx, hy, B.zAt(hx, hy)], 0.42, { rot: vi * 0.7, roof: fresh && erAsh(hx, hy, p.so2) > 0.02 ? '#9A9690' : '#A5452F', wall: '#E3D8C2' }) }); } });
    T.draw(ctx, cam, B, {
      cover: (i, j, x, y, z, nz) => {
        const r = Math.hypot(x, y);
        let c = r < 9.5 ? mix3([40, 86, 44], [70, 110, 60], vnoise(x * 0.8, y * 0.8, 8)) : (hash2(Math.floor(x / 1.6), Math.floor(y / 1.6), 3) > 0.5 ? [120, 150, 70] : [160, 162, 88]);
        if (erValley(x, y)) c = lahar > 0.05 && rainy ? mix3([92, 140, 170], [120, 112, 100], lahar) : fresh ? mix3([92, 140, 170], [150, 146, 138], lahar * 0.8) : [92, 140, 170];
        if (fresh) {
          const ash = erAsh(x, y, p.so2), a = clamp(Math.sqrt(ash / 0.3), 0, 0.92);
          c = mix3(c, [168, 164, 158], a);
          if (erValley(x, y) && r < 12) c = mix3(c, [206, 200, 190], 0.7 * Math.exp(-t / 3));   // pyroclastic flow deposits fill the valleys
          if (r < 1.6 && t > 0.004) c = mix3(c, [70, 60, 56], 0.6);
        }
        return c;
      },
      water: (i, j, x, y) => x < -11 ? 0 : null,
      items, deepAt: 2,
      layers: [
        { col: [150, 140, 128], pat: 'soil', top: (x, y, zs) => zs },
        { col: [120, 116, 112], pat: 'gravel', top: (x, y, zs) => zs - 0.25 },
        { col: [96, 80, 72], pat: 'rock', top: (x, y, zs) => Math.min(zs - 0.9, 0.1) }
      ],
      sea: 0
    });
    // the magma below the volcano on the cut face is not drawn: the block shows what the eruption left on the ground
    const top = [0, 0, B.zAt(0, 0) + 0.1];
    if (t < 0.05) {
      const k = 1 - smooth(0.03, 0.05, t), rise = p.plume * 0.35 * k + 0.5;                    // the column (its height to scale ÷ 3, said below)
      // the column: a dense, boiling jet of ash and gas, then the umbrella where it spreads at its own level
      T.plume(ctx, cam, top, { n: 140, rise, drift: [ASH_TO[0] * 1.5, ASH_TO[1] * 1.5], spread: 0.9, t: S.ta, speed: 0.10, r0: 0.55, grow: 2.2, alpha: 0.9 * k, col: [84, 78, 74], bend: 1.0 });
      T.plume(ctx, cam, [top[0] + ASH_TO[0] * 1.5, top[1] + ASH_TO[1] * 1.5, top[2] + rise * 0.94], { n: 90, rise: 0.5, drift: [ASH_TO[0] * 6, ASH_TO[1] * 6], spread: 16, t: S.ta, speed: 0.03, r0: 0.9, grow: 2.2, alpha: 0.7 * k, col: [128, 122, 116], bend: 1 });
      const qt = cam.project([top[0], top[1], top[2] + rise]);
      if (qt.ok && k > 0.2) tag(ctx, qt.x + 14, Math.max(K.HDR + 12, qt.y), 'column ' + p.plume.toFixed(0) + ' km high (drawn at a third)', '#E8E2D8');
    }
    // the world, months later: the veil on the globe
    const at = K.cardSlot(g, S, 'the world, months later', Math.min(250, W * 0.27), { x: W - Math.min(250, W * 0.27) - 10, y: K.HDR + 4 });
    if (at) {                                                   // on a phone the open card must fit under the chips
      const w = narrow ? Math.min(at.w, (H - at.y - 80) / 0.86) : at.w;   // and end above the stage hint
      worldCard(g, S, narrow ? (W - w) / 2 : at.x, at.y, w, E, now);
    }
    const land = cascadeSlot(g, S);
    if (land) cascade(g, S, land.x, land.y, land.w, land.h, erLinks(S, E, now));
    const cool = now.T;
    K.header(g, t < 0.035 ? 'Eruption: ' + p.so2.toFixed(0) + ' Mt of SO₂ blasted ' + p.plume.toFixed(0) + ' km up' + (stratFrac(p.plume) > 0 ? ', into the stratosphere' : ' — but not above the weather') :
      yearSay(t) + ' after the eruption: ' + (Math.abs(cool) < 0.005 ? (E.peak.T < -0.005 ? (now.aod > 0.005 ? 'less sunlight already — but the ocean is slow to cool' : 'the veil is still forming — no cooling yet') : 'the world is no cooler') : 'the world is ' + Math.abs(cool).toFixed(2) + ' °C ' + (cool < 0 ? 'cooler' : 'warmer')) + (t > 0.3 ? ' — the coldest will be ' + Math.abs(E.peak.T).toFixed(2) + ' °C' : ''),
      'the veil’s optical depth ' + now.aod.toFixed(3) + ' · sunlight blocked ' + Math.abs(now.F).toFixed(2) + ' W/m² · sea level ' + now.sl.toFixed(1) + ' mm · soils breathe out ' + Math.abs(now.dR).toFixed(1) + ' GtC a year less',
      (p.band === 'tropics' ? 'a tropical volcano: the veil spreads over both hemispheres' : 'a high-latitude volcano: the veil stays in one hemisphere') + ' · land heights drawn ×3');
  }
  const yearSay = t => t < 1 / 12 ? Math.round(t * 365) + ' days' : t < 2 ? Math.round(t * 12) + ' months' : t.toFixed(1) + ' years';
  /* a small globe with the veil of droplets spreading from the volcano's latitude */
  function worldCard(g, S, x, y, w, E, now) {
    const ctx = g.ctx, K = kit(), T = th(g), p = S.p, h = w * 0.86 + 30;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('The veil, and the world cooling', x + 10, y + 8); ctx.restore();
    if (!window.EARTH) return;
    if (!EARTH.ready()) { EARTH.load(); return; }
    if (!S.camG) S.camG = Camera({ theta: -1.2, phi: 0.2, dist: 3.9, target: [0, 0, 0], fov: 0.62 });
    S.camG.setViewport(g.w, g.h);
    S.camG.dist = S.camG._k / (0.40 * (w - 30)); S.camG.update();
    const t = S.te, lat0 = bandLat(p), spread = p.band === 'tropics' ? 18 + 72 * (1 - Math.exp(-t / 0.35)) : 12 + 40 * (1 - Math.exp(-t / 0.3));
    const aod = now.aod;
    ctx.save(); ctx.translate(x + w / 2 - g.w / 2, y + 24 + (h - 24) / 2 - g.h / 2);
    EARTH.draw(ctx, S.camG, [0, 0, 0], 1, { spin: -2.2 + S.ta * 0.05, sun: [-0.4, -0.8, 0.45], ambient: 0.1, budget: 60000,
      overlay: (la, lo) => {
        const inBand = p.band === 'tropics' ? Math.abs(la) < spread : Math.abs(la - lat0) < spread;
        if (!inBand || aod <= 0.002) return null;
        return [236, 232, 226, clamp(aod * 4.2, 0, 0.72)];
      } });
    ctx.restore();
    tag(ctx, x + 10, y + h - 14, 'optical depth ' + now.aod.toFixed(3) + ' · ' + (Math.abs(now.T) < 0.005 ? '0.00' : now.T.toFixed(2)) + ' °C', '#E8E2D8');
  }

  /* ---------------- hurricane ---------------- */
  function drawHurricane(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TR(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const Hh = hurricaneOf(S), t = S.th, eta = huAt(Hh, t), U = p.speed * 3.6, eyeKm = -t * U;          // km offshore (negative after landfall)
    const rEye = Math.hypot(Math.max(0, eyeKm), p.rmax), W1 = hollandOf(Hh.Pc, p.rmax, 1.3)(Math.hypot(eyeKm, p.rmax)).V * 0.8;
    const dark = clamp(1 - (Math.hypot(eyeKm, p.rmax) - p.rmax) / 350, 0, 1), inEye = Math.hypot(eyeKm, 0) < p.rmax * 0.4 && Math.abs(eyeKm) < p.rmax * 0.4;
    sky(g, GE() ? GE().css(mix3([110, 150, 200], [48, 54, 66], dark * (inEye ? 0.3 : 1))) : '#556', GE() ? GE().css(mix3([186, 210, 232], [92, 98, 108], dark * (inEye ? 0.3 : 1))) : '#889');
    placeView(S, g, narrow ? 0 : -0.19, narrow ? 10 : 26);
    const B = blockOf(S), x0 = -(0.6 + p.marsh), town = townLevel(eta, p);
    // the water level over each place: the storm tide over the sea, the surge weakening across the marsh on land
    const prof = Hh.tide.prof, peak = Hh.tide.best.eta, scale = peak > 0 ? eta / peak : 0;
    const seaAt = x => { if (!prof) return eta; const i = clamp(Math.round(x / (SHELVES[p.shelf].L) * prof.length), 0, prof.length - 1); return prof[i][1] * scale + Hh.tide.best.wave * scale; };
    const levelAt = x => x >= 0 ? seaAt(x) : x > -0.6 ? eta : x > x0 ? Math.max(0, eta - MARSH_LOSS * (-0.6 - x)) : town - 0.02 * (x0 - x);
    const items = [];
    for (let k = 0; k < 28; k++) {                                // the town's houses
      const hx = x0 - 1.4 - (k % 7) * 1.25, hy = -9 + Math.floor(k / 7) * 3.6 + (k % 2) * 0.6;
      const zg = huMetres(hx, hy, p.marsh), flooded = levelAt(hx) > zg + 0.3;
      items.push({ at: [hx, hy, zg * HU.vex], draw: () => T.house(ctx, cam, [hx, hy, zg * HU.vex], 0.7, { rot: 0.1, flooded, roof: k % 3 ? '#A5452F' : '#5D6B7C' }) });
    }
    const bend = clamp(W1 / 60, 0, 1);
    for (let k = 0; k < 40; k++) {                                // trees along the town, bending in the wind
      const tx = x0 - 0.6 - (k % 10) * 1.6, ty = -13 + Math.floor(k / 10) * 7.2 + 1.1 * Math.sin(k), zg = huMetres(tx, ty, p.marsh) * HU.vex;
      items.push({ at: [tx, ty, zg], draw: (c2, q) => { c2.save(); c2.translate(q.x, q.y); c2.rotate(bend * 0.5 * Math.sin(S.ta * 3 + k) * 0.3 + bend * 0.35); T.tree(c2, 0, 0, 0.9 * q.s, { kind: 'broad', seed: k }); c2.restore(); } });
    }
    T.draw(ctx, cam, B, {
      cover: (i, j, x, y, z) => {
        const zm = z / HU.vex;
        if (x > -0.6 && x < 0 && zm > 0) return [224, 210, 170];                                     // sand
        if (x <= -0.6 && x > x0) return mix3([112, 124, 70], [150, 150, 90], vnoise(x * 2, y * 2, 7));   // marsh grass
        return mix3([96, 132, 72], [128, 150, 84], vnoise(x * 0.6, y * 0.6, 8));
      },
      water: (i, j, x, y) => levelAt(x) * HU.vex,
      waterCol: dep => mix3([96, 168, 170], [26, 70, 110], clamp(dep / 3, 0, 1)), deepAt: 3,
      items,
      layers: [
        { col: [196, 178, 140], pat: 'soil', top: (x, y, zs) => zs },
        { col: [176, 160, 120], pat: 'gravel', top: (x, y, zs) => zs - 1.2 },
        { col: [120, 110, 100], pat: 'clay', top: (x, y, zs) => zs - 3.4 }
      ],
      sea: Math.max(0, seaAt(HU.size / 2)) * HU.vex
    });
    // whitecaps and spray over the sea, and the rain bands
    ctx.save();
    const nw = Math.round(60 * bend);
    for (let k = 0; k < nw; k++) {
      const wx = 0.5 + (hash2(k, 1, 3) * 19.5), wy = -20 + ((hash2(k, 2, 3) * 40 + S.ta * 2.5 * (1 + bend)) % 40), q = cam.project([wx, wy, levelAt(wx) * HU.vex + 0.02]);
      if (!q.ok) continue;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.4 * bend).toFixed(2) + ')'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(q.x - 4, q.y); ctx.quadraticCurveTo(q.x, q.y - 2, q.x + 4, q.y); ctx.stroke();
    }
    ctx.restore();
    const rainRate = inEye ? 0 : clamp(60 * Math.exp(-Math.max(0, Math.hypot(eyeKm, p.rmax) - 2 * p.rmax) / 150) * Math.pow(1.07, p.sst - 28.5), 0, 80);
    T.rain(ctx, 0, K.HDR, W, H - K.HDR, rainRate, S.ta, 0.35 + 0.4 * bend);
    const land = cascadeSlot(g, S);
    if (land) cascade(g, S, land.x, land.y, land.w, land.h, huLinks(S, Hh, t, eta, town));
    K.header(g, t < -0.25 ? 'The eye is ' + Math.round(eyeKm) + ' km offshore: the sea is up ' + eta.toFixed(1) + ' m at the beach' : t < 0.25 ? 'Landfall: the storm tide peaks near ' + Hh.tide.best.eta.toFixed(1) + ' m' : 'After landfall: ' + (Hh.tide.best.eta).toFixed(1) + ' m at the coast, ' + townLevel(Hh.tide.best.eta, p).toFixed(1) + ' m behind the marsh',
      'Category ' + Hh.cat + ' · winds ' + Hh.V.toFixed(0) + ' m/s · ' + Hh.Pc.toFixed(0) + ' hPa · the wind here ' + W1.toFixed(0) + ' m/s · rain ' + Hh.rain.toFixed(0) + ' mm in all',
      (p.shelf === 'wide' ? 'a wide, shallow shelf' : 'a narrow, steep shelf') + ' · ' + p.marsh.toFixed(0) + ' km of marsh · heights ×250 · one hour a second');
  }

  /* ---------------- wildfire ---------------- */
  function drawWildfire(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TR(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const Fi = fireOf(S), ph = wfPhase(S.tw), t = ph.h, n = Fi.n, d = Fi.d, x0 = -WF.size / 2;
    const smoke = ph.phase === 'fire' ? clamp(burnedHa(Fi, t) / 3000, 0, 1) : 0;
    sky(g, GE() ? GE().css(mix3([104, 150, 206], [150, 110, 80], smoke * 0.7)) : '#678', GE() ? GE().css(mix3([196, 214, 234], [214, 160, 110], smoke * 0.8)) : '#aab');
    placeView(S, g, narrow ? 0 : -0.19, narrow ? 10 : 26);
    const B = blockOf(S), regrow = ph.phase === 'recovery' ? ph.y : 0;
    const stateOf = k => { const ta = Fi.T[k]; if (!(ta <= t)) return 'live'; if (t - ta < BURN_H && ph.phase === 'fire') return 'burning'; return 'burnt'; };
    const items = [];
    for (let j = 0; j < n; j += 2) for (let i = 0; i < n; i += 2) {
      const k = j * n + i, kd = Fi.kind[k];
      if (kd === 3 || kd === 2) continue;
      const x = x0 + (i + 0.5 + (hash2(i, j, 1) - 0.5) * 0.8) * d, y = x0 + (j + 0.5 + (hash2(i, j, 2) - 0.5) * 0.8) * d;
      const st = stateOf(k), stDraw = st === 'burnt' && regrow > 0 ? (regrow > 6 ? 'live' : regrow > 1.5 ? 'sprout' : 'burnt') : st;
      if (kd === 1 && st !== 'burning') continue;               // grass: no trees
      items.push({ at: [x, y, B.zAt(x, y)], draw: (c2, q) => T.tree(c2, q.x, q.y, (stDraw === 'live' && regrow > 6 ? 0.12 + 0.012 * regrow : 0.22) * q.s, { kind: 'conifer', state: stDraw, t: S.ta, seed: k }) });
    }
    for (let k = 0; k < 12; k++) {                               // the town at the valley's end
      const hx = 2.5 + (k % 4) * 0.34, hy = 0.15 + Math.floor(k / 4) * 0.33, kk = clamp(Math.floor((hy - x0) / d), 0, n - 1) * n + clamp(Math.floor((hx - x0) / d), 0, n - 1);
      const burnt = Fi.T[kk] <= t;
      items.push({ at: [hx, hy, B.zAt(hx, hy)], draw: () => T.house(ctx, cam, [hx, hy, B.zAt(hx, hy)], 0.12, { rot: 0.2, roof: burnt ? '#2A2622' : '#A5452F', wall: burnt ? '#4A4440' : '#E6DCC8' }) });
    }
    const stormOn = ph.phase === 'storm', runoffNow = stormOn ? ph.s : ph.phase === 'recovery' ? 1 : 0;
    T.draw(ctx, cam, B, {
      cover: (i, j, x, y, z) => {
        const k = clamp(Math.floor((y - x0) / d), 0, n - 1) * n + clamp(Math.floor((x - x0) / d), 0, n - 1), kd = Fi.kind[k], st = stateOf(k);
        let c = kd === 1 ? [150, 150, 84] : kd === 2 ? [128, 140, 110] : mix3([38, 78, 40], [58, 98, 52], vnoise(x * 2, y * 2, 3));
        if (st === 'burning') c = mix3([255, 120, 30], [255, 190, 70], 0.5 + 0.5 * Math.sin(S.ta * 8 + k));
        else if (st === 'burnt') {
          c = Fi.crown[k] ? [34, 30, 28] : [70, 62, 56];
          if (regrow > 0) c = mix3(c, kd === 1 ? [150, 150, 84] : [88, 120, 60], clamp(regrow / 6, 0, 1));
          if (runoffNow > 0 && regrow < 3) c = mix3(c, [120, 88, 60], 0.25 * runoffNow);      // soil washing off
        }
        return c;
      },
      water: (i, j, x, y) => wfCreek(x, y) ? B.zAt(x, y) + 0.02 + (runoffNow > 0 && regrow < 3 ? 0.03 * runoffNow : 0) : null,
      waterCol: () => runoffNow > 0 && regrow < 3 ? [136, 104, 70] : [70, 130, 150], deepAt: 1,
      items,
      layers: [
        { col: [110, 84, 58], pat: 'soil', top: (x, y, zs) => zs },
        { col: [130, 118, 104], pat: 'gravel', top: (x, y, zs) => zs - 0.06 },
        { col: [104, 96, 90], pat: 'rock', top: (x, y, zs) => zs - 0.18 }
      ]
    });
    // smoke from the burning front, leaning downwind
    if (ph.phase === 'fire') {
      const Wv = WIND_TO[p.windFrom], burning = [];
      for (let k = 0; k < n * n; k += 1) if (Fi.T[k] <= t && t - Fi.T[k] < BURN_H) burning.push(k);
      const step = Math.max(1, Math.floor(burning.length / 14));
      for (let m = 0; m < burning.length; m += step) {
        const k = burning[m], i = k % n, j = (k - i) / n, x = x0 + (i + 0.5) * d, y = x0 + (j + 0.5) * d;
        T.plume(ctx, cam, [x, y, B.zAt(x, y) + 0.05], { n: 10, rise: 1.2 + p.wind * 0.01, drift: [Wv[0] * p.wind * 0.06, Wv[1] * p.wind * 0.06], spread: 0.4, t: S.ta + m * 0.37, speed: 0.08, r0: 0.08, grow: 5, alpha: 0.5, col: [96, 88, 84] });
      }
    }
    if (stormOn) T.rain(ctx, 0, K.HDR, W, H - K.HDR, 12 + p.storm * 0.8, S.ta, 0.1);
    const land = cascadeSlot(g, S);
    if (land) cascade(g, S, land.x, land.y, land.w, land.h, wfLinks(S, Fi, ph));
    const F = ffdi(p.temp, p.rh, p.wind, p.dry), ha = burnedHa(Fi, t);
    const post = scsRunoff(p.storm, CN_BURNED), pre = scsRunoff(p.storm, CN_FOREST);
    K.header(g, ph.phase === 'fire' ? (t < 0.05 ? 'A fire starts — fire danger ' + F.toFixed(0) + ', ' + dangerOf(F) : t.toFixed(1) + ' h: ' + fmtN(ha) + ' ha burned' + (townHit(Fi, t) ? ' — the fire has reached the town' : '')) :
      ph.phase === 'storm' ? 'The first storm after the fire: ' + p.storm + ' mm of rain on bare, burned slopes' : 'Years after: ' + ph.y.toFixed(1) + ' years — plants return, and the soil holds the rain again',
      ph.phase === 'fire' ? 'head fire ' + (headRos(p, p.wind, 0) * 0.06).toFixed(2) + ' km/h on the flat · ' + (crownedNow(Fi, t) ? 'burning in the treetops' : 'on the ground') + ' · smoke carries ' + fmtN(ha * FIRE.fuel * 10 * 1.72) + ' t of CO₂' :
        'runoff ' + post.toFixed(1) + ' mm off burned ground, ' + pre.toFixed(1) + ' mm off the forest it was · ' + (pre > 0.05 ? '×' + (post / pre).toFixed(0) : 'where none ran off before'),
      p.temp + ' °C · ' + p.rh + ' % humidity · wind ' + p.wind + ' km/h from the ' + p.windFrom + ' · the block is 8 km across · ten minutes a second');
  }
  const townHit = (Fi, t) => { for (let k = 0; k < Fi.T.length; k++) if (Fi.kind[k] === 2 && Fi.T[k] <= t) return true; return false; };
  const crownedNow = (Fi, t) => { for (let k = 0; k < Fi.T.length; k++) if (Fi.crown[k] && Fi.T[k] <= t && t - Fi.T[k] < BURN_H) return true; return false; };

  /* ---------------- drought ---------------- */
  function drawDrought(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TR(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const D = droughtOf(S), t = S.td, r = drAt(D, t), y = Math.min(9, Math.floor(t)), yr = D.years[y];
    const drought = r.dr;
    sky(g, drought ? '#9CB4CC' : '#7FA6D0', drought ? '#E4D8BE' : '#C8DCEC');
    placeView(S, g, narrow ? 0 : -0.19, narrow ? 10 : 26);
    const B = blockOf(S), crop = r.crop, canalFrac = drought ? Math.pow(p.rain / 100, 2) : 1, month = Math.floor((t % 1) * 12);
    const items = [];
    for (let k = 0; k < 90; k++) {                                // orchard trees in rows
      const fx = -12 + (k % 15) * 0.55, fy = 6 + Math.floor(k / 15) * 0.7;
      items.push({ at: [fx, fy, B.zAt(fx, fy)], draw: (c2, q) => T.tree(c2, q.x, q.y, 0.45 * q.s, { kind: 'broad', seed: k, state: crop < 0.75 && hash2(k, 3, 1) > crop ? 'dry' : 'live' }) });
    }
    [[-3, 2], [-8, -3], [1.5, -5]].forEach(([wx, wy], wi) => items.push({ at: [wx, wy, B.zAt(wx, wy)], draw: () => T.house(ctx, cam, [wx, wy, B.zAt(wx, wy)], 0.5, { rot: 0.4, roof: '#6B7684', wall: '#C8CDD4' }) }));
    const sub = r.sub, pole = [WELLS[0] + 0.9, WELLS[1] - 0.9];
    items.push({ at: [pole[0], pole[1], B.zAt(pole[0], pole[1])], bias: 3, draw: () => {
      // signs where the ground stood: at the start, at the end of each drought year so far (Poland's photograph)
      const marks = [{ z: sub * 0.18, label: 'year 1' }];
      D.years.forEach((q, i) => { if (i >= 2 && i < y && q.sub > 0.02 && sub - q.sub > 0.02 && (i === y - 1 || (i - 2) % 2 === 1)) marks.push({ z: (sub - q.sub) * 0.18, label: 'year ' + (i + 1) }); });
      T.pole(ctx, cam, [pole[0], pole[1], B.zAt(pole[0], pole[1])], Math.max(0.5, sub * 0.18 + 0.25), marks.slice(0, 4));
    } });
    T.draw(ctx, cam, B, {
      cover: (i, j, x, yy, z) => {
        if (x > 8) { const snow = (month < 3 || month > 10) ? (drought ? 0.25 : 0.8) : 0.05; return z / DR.vex > 0.75 ? mix3([120, 116, 100], [240, 244, 250], snow * smooth(0.75, 1.0, z / DR.vex)) : mix3([128, 132, 88], [150, 140, 96], drought ? 0.8 : 0.2); }
        if (drCanal(x, yy)) return canalFrac > 0.15 ? [70, 130, 170] : [150, 140, 120];
        const f = drField(x, yy);
        if (f.h < 0.2) return [196, 178, 128];                                                  // fallow ground
        const green = f.h < 0.5 ? [70, 130, 60] : f.h < 0.75 ? [96, 150, 70] : [120, 150, 60];
        const thirsty = f.h > crop ? 1 : 0;                                                     // fields the water no longer reaches
        const season = month >= 3 && month <= 9 ? 1 : 0.55;
        return mix3(mix3([176, 160, 110], green, season), [190, 170, 120], thirsty * 0.85);
      },
      water: (i, j, x, yy) => Math.abs(yy + 8.5) < 0.35 && x < 8 ? B.zAt(x, yy) + 0.012 * DR.vex * (drought ? 0.35 : 1) : null, deepAt: 0.2,
      items,
      layers: [
        { col: [124, 96, 62], pat: 'soil', top: (x, yy, zs) => zs },
        { col: [176, 152, 104], pat: 'gravel', wet: true, top: (x, yy, zs) => zs - 0.012 * DR.under },
        { col: [96, 112, 118], pat: 'clay', top: (x, yy, zs) => zs - 0.12 * DR.under },
        { col: [164, 142, 100], pat: 'gravel', wet: true, top: (x, yy, zs) => zs - 0.16 * DR.under },
        { col: [92, 84, 80], pat: 'rock', top: (x, yy, zs) => zs - 0.38 * DR.under }
      ],
      table: (x, yy) => B.zAt(x, yy) - (0.025 - Math.max(r.head, -60) / 1000) * DR.under
    });
    const land = cascadeSlot(g, S);
    if (land) cascade(g, S, land.x, land.y, land.w, land.h, drLinks(S, D, t, r));
    // one count of years for the header, the readout and the signs on the pole
    K.header(g, drought ? 'Year ' + (y + 1) + ', dry year ' + (y - 1) + ' of ' + p.years + ': rain at ' + p.rain + ' % of normal — the wells go deeper' : y < 2 ? 'Year ' + (y + 1) + ', a normal year: ' + fmtN(yr.P) + ' mm of rain, ' + fmtN(yr.e0) + ' mm of evaporation demand' : 'Year ' + (y + 1) + ': the rain is back — but the land is ' + (sub * 100).toFixed(0) + ' cm lower, for good',
      'aquifer ' + r.head.toFixed(1) + ' m · land sunk ' + (sub * 100).toFixed(0) + ' cm · crops get ' + (100 * crop).toFixed(0) + ' % of their water · wild grass grows ' + fmtN(montreal(yr.aet)) + ' g/m² this year',
      'Fresno’s climate · canal water falls as the square of the rain · ' + (p.pump ? 'wells make up the rest' : 'no extra pumping') + ' · heights ×4, the ground beneath ×10 · a quarter year a second');
  }

  /* ---------------- the four spheres, link by link ---------------- */
  const SPH = { geo: { name: 'GEOSPHERE', col: '#E0B070' }, hydro: { name: 'HYDROSPHERE', col: '#5FB4FF' }, atm: { name: 'ATMOSPHERE', col: '#9FD4FF' }, bio: { name: 'BIOSPHERE', col: '#8EE07A' } };
  function cascadeSlot(g, S) {
    const K = kit(), W = g.w, H = g.h;
    if (W < K.NARROW) {                                          // the eruption's globe has the first chip, so this one is short
      const at = K.cardSlot(g, S, S.p.setup === 'eruption' ? 'the four spheres' : 'the four spheres, link by link', W - 20);
      return at ? { x: at.x, y: at.y, w: at.w, h: Math.min(300, H - at.y - 50) } : null;   // above the stage hint
    }
    const w = Math.min(310, W * 0.34), top = S.p.setup === 'eruption' ? K.HDR + 4 + Math.min(250, W * 0.27) * 0.86 + 38 : K.HDR + 4;
    return { x: W - w - 10, y: top, w, h: Math.min(320, H - top - 10) };
  }
  /* links: [{ a, b, text, on }] — the diagram numbers each arrow; the list says what crossed and how much */
  function cascade(g, S, x, y, w, h, links) {
    const ctx = g.ctx, K = kit(), T = th(g), GX = GE();
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('The four spheres, link by link', x + 10, y + 8);
    const tight = h < 260, cx = x + w / 2, cy = y + (tight ? 56 : 64), dx = w * 0.33, dy = tight ? 24 : 30;   // a phone's short card
    const pos = { atm: [cx, cy - dy], hydro: [cx, cy + dy], geo: [cx - dx, cy], bio: [cx + dx, cy] };
    const bw = 76, bh = 16;
    links.forEach((L0, k) => {
      if (L0.a === L0.b) return;
      const A = pos[L0.a], Bp = pos[L0.b], vx = Bp[0] - A[0], vy = Bp[1] - A[1], Ln = Math.hypot(vx, vy);
      const s = Math.min(bw / 2 / Math.max(1e-6, Math.abs(vx / Ln)), bh / 2 / Math.max(1e-6, Math.abs(vy / Ln))) + 3;
      const a = { x: A[0] + vx / Ln * s, y: A[1] + vy / Ln * s }, b = { x: Bp[0] - vx / Ln * s, y: Bp[1] - vy / Ln * s };
      const col = L0.on ? SPH[L0.a].col : 'rgba(120,130,150,.35)';
      if (GX) GX.fluxArrow(ctx, a, b, (k % 2 ? 1 : -1) * 10, { w: L0.on ? 1.8 : 1, col, rate: L0.on ? 0.5 : 0, phase: S.ta, alpha: L0.on ? 1 : 0.6 });
      const m = { x: (a.x + b.x) / 2 - vy / Ln * (k % 2 ? 1 : -1) * 10, y: (a.y + b.y) / 2 + vx / Ln * (k % 2 ? 1 : -1) * 10 };
      ctx.fillStyle = L0.on ? '#0B1020' : 'rgba(11,16,32,.8)'; ctx.beginPath(); ctx.arc(m.x, m.y, 6.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = L0.on ? '#FFFFFF' : 'rgba(200,210,230,.5)'; ctx.font = mono(8, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(k + 1), m.x, m.y + 0.5);
    });
    Object.keys(pos).forEach(k => {
      const [px, py] = pos[k];
      ctx.fillStyle = 'rgba(8,12,22,.94)'; ctx.strokeStyle = SPH[k].col; ctx.lineWidth = 1.2;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(px - bw / 2, py - bh / 2, bw, bh, 4); else ctx.rect(px - bw / 2, py - bh / 2, bw, bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = SPH[k].col; ctx.font = mono(8, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SPH[k].name, px, py + 0.5);
    });
    // the list: what crossed, and how much
    let yy = cy + dy + 20;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    links.forEach((L0, k) => {
      if (yy > y + h - 12) return;
      ctx.fillStyle = L0.on ? SPH[L0.a].col : 'rgba(150,160,180,.45)'; ctx.font = mono(8.5, 700);
      ctx.fillText(String(k + 1), x + 10, yy);
      ctx.fillStyle = L0.on ? T.text : 'rgba(170,180,200,.5)'; ctx.font = mono(8.5, L0.on ? 600 : 500);
      const lines = wrapLines(ctx, L0.text, w - 34);
      lines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, x + 22, yy + li * 11));
      yy += Math.min(2, lines.length) * 11 + 4;
    });
    ctx.restore();
  }
  function wrapLines(ctx, text, maxW) {
    const words = String(text).split(' '), out = []; let line = '';
    for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (ctx.measureText(tt).width > maxW && line) { out.push(line); line = wd; } else line = tt; }
    if (line) out.push(line);
    return out;
  }
  function erLinks(S, E, now) {
    const p = S.p, t = S.te, fr = stratFrac(p.plume);
    return [
      { a: 'geo', b: 'atm', on: true, text: p.so2.toFixed(0) + ' Mt of SO₂ ' + (fr > 0 ? (fr < 1 ? 'partly ' : '') + 'into the stratosphere' : 'stays below the stratosphere and rains out within weeks') },
      { a: 'atm', b: 'hydro', on: t > 0.15 && fr > 0, text: 'less sunlight: the ocean cools and shrinks — sea level ' + now.sl.toFixed(1) + ' mm' },
      { a: 'atm', b: 'bio', on: t > 0.25 && fr > 0, text: 'cooler soils breathe out ' + Math.abs(now.dR).toFixed(1) + ' GtC a year less' },
      { a: 'bio', b: 'atm', on: t > 0.5 && fr > 0, text: 'so CO₂ climbs ' + Math.abs(E.co2).toFixed(1) + ' ppm a year more slowly in the second year' },
      { a: 'geo', b: 'hydro', on: t > 0.02, text: 'ash washes into the rivers: mudflows (lahars) for years' },
      { a: 'atm', b: 'hydro', on: t > 0.2 && fr > 0, text: 'a cooler world evaporates less: rain ' + now.rain.toFixed(1) + ' %' }
    ];
  }
  function huLinks(S, Hh, t, eta, town) {
    const p = S.p;
    return [
      { a: 'hydro', b: 'atm', on: true, text: 'a sea at ' + p.sst.toFixed(1) + ' °C can power ' + Hh.V.toFixed(0) + ' m/s winds' + (Hh.cat ? ' (Category ' + Hh.cat + ')' : ' — too cool for a hurricane') },
      { a: 'atm', b: 'hydro', on: t > -18, text: 'wind and low pressure pile the sea up: ' + eta.toFixed(1) + ' m at the coast now' },
      { a: 'bio', b: 'hydro', on: t > -6 && p.marsh > 0, text: p.marsh.toFixed(0) + ' km of marsh take ' + (MARSH_LOSS * p.marsh).toFixed(1) + ' m off the surge before the town' },
      { a: 'hydro', b: 'geo', on: t > -3 && Hh.overwash, text: 'waves over the dune carry its sand inland' },
      { a: 'atm', b: 'hydro', on: t > -8, text: Hh.rain.toFixed(0) + ' mm of rain in all: rivers burst their banks' },
      { a: 'hydro', b: 'bio', on: t > 0 && Hh.tide.best.eta > 1, text: 'salt water drowns the freshwater marsh' }
    ];
  }
  function wfLinks(S, Fi, ph) {
    const p = S.p, F = ffdi(p.temp, p.rh, p.wind, p.dry), ha = burnedHa(Fi, ph.h), fire = ph.phase === 'fire';
    return [
      { a: 'atm', b: 'bio', on: true, text: p.temp + ' °C, ' + p.rh + ' % humidity, ' + p.wind + ' km/h wind: fire danger ' + F.toFixed(0) + ', ' + dangerOf(F) },
      { a: 'geo', b: 'bio', on: ph.h > 0.2, text: 'slopes steer it: a fire runs ×' + (1 + phiSlope(Math.tan(20 * Math.PI / 180))).toFixed(1) + ' faster up a 20° slope' },
      { a: 'bio', b: 'atm', on: ph.h > 0.3, text: fmtN(ha) + ' ha burned: ' + fmtN(ha * FIRE.fuel * 10 * 1.72) + ' t of CO₂ and smoke into the air' },
      { a: 'bio', b: 'geo', on: !fire, text: 'bare, water-repellent soil where the forest stood' },
      { a: 'atm', b: 'hydro', on: !fire, text: 'a ' + p.storm + ' mm storm: ' + scsRunoff(p.storm, CN_BURNED).toFixed(1) + ' mm runs off, not ' + scsRunoff(p.storm, CN_FOREST).toFixed(1) },
      { a: 'hydro', b: 'bio', on: !fire, text: 'mud fills the creek’s gravel, where fish lay eggs' }
    ];
  }
  function drLinks(S, D, t, r) {
    const p = S.p, y = Math.floor(t), yr = D.years[Math.min(9, y)], normal = D.years[0], started = t >= 2;
    const dfire = ffdi(35, 15, 20, clamp(10 - 20 * r.W / BUCKET, 3, 10));
    return [
      { a: 'atm', b: 'hydro', on: started, text: 'rain at ' + p.rain + ' % of normal, ' + p.warm.toFixed(1) + ' °C warmer: the soil dries out' },
      { a: 'hydro', b: 'bio', on: started, text: 'wild grass grows ' + (100 * (1 - montreal(yr.aet) / montreal(normal.aet))).toFixed(0) + ' % less; crops get ' + (100 * r.crop).toFixed(0) + ' % of their water' },
      { a: 'bio', b: 'hydro', on: started && p.pump, text: 'farmers pump ' + fmtN(Math.max(0, yr.extra)) + ' mm more a year from the wells' + (yr.extra < 1 && started ? ' — none now the rain is back' : '') },
      { a: 'hydro', b: 'geo', on: started && p.pump, text: 'the aquifer falls ' + Math.abs(r.head).toFixed(1) + ' m: clay squeezes, the land sinks ' + (r.sub * 100).toFixed(0) + ' cm' },
      { a: 'geo', b: 'hydro', on: r.sub > 0.05, text: 'squeezed clay never holds that water again' },
      { a: 'bio', b: 'atm', on: started, text: 'dry grass: a summer afternoon’s fire danger ' + dfire.toFixed(0) + ', ' + dangerOf(dfire) }
    ];
  }

  function drawStage(S, g) {
    const K = kit(), p = S.p;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) {
      const h = homeFor(p.setup, S._narrow);
      S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist };
      S._narrowCam = S._narrow;
    }
    if (!window.TERRAIN) return;
    if (p.setup === 'eruption') drawEruption(S, g);
    else if (p.setup === 'hurricane') drawHurricane(S, g);
    else if (p.setup === 'wildfire') drawWildfire(S, g);
    else drawDrought(S, g);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  function eruptionPlot(S, g) {
    const K = kit(), E = eruptionOf(S), ctx = g.ctx, T = th(g);
    const Kk = K.plotKey(g, [{ c: '#7FD4FF', label: 'the world’s temperature change, °C' }, { c: 'rgba(236,232,226,.55)', box: true, label: 'sunlight blocked, W/m² (right)' }]);
    const ymin = Math.min(-0.5, Math.floor(E.peak.T * 10 - 1) / 10);
    const P = g.Plot({ xmin: 0, xmax: ER_YEARS, ymin, ymax: 0.1, pad: { t: Kk.t, r: 44 }, xlabel: 'years after the eruption', ylabel: 'change, °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
    Kk.draw(P);
    const Fmax = Math.max(1, ...E.rows.map(r => -r.F)), fy = v => v / Fmax * -ymin;     // W/m² drawn down from zero, the most at the bottom
    P.clip(() => {
      P.area(E.rows.map(r => [r.t, fy(r.F)]), 0, 'rgba(236,232,226,.22)');
      P.hline(0, g.alpha(T['text-2'], .4));
      P.line(E.rows.filter(r => r.t <= S.te).map(r => [r.t, r.T]), '#7FD4FF', 2.4);
      P.line(E.rows.filter(r => r.t > S.te).map(r => [r.t, r.T]), g.alpha('#7FD4FF', .35), 1.4, [4, 3]);
      P.dot(E.peak.t, E.peak.T, 4.5, '#7FD4FF', g.alpha('#0B1020', .9));
      P.vline(S.te, g.alpha(T['text-2'], .5), [2, 3]);
    });
    ctx.save(); ctx.font = mono(9); ctx.fillStyle = 'rgba(236,232,226,.8)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [0, 0.5, 1].forEach(f => ctx.fillText((f * Fmax).toFixed(1), P.x1 + 5, P.Y(f * ymin)));
    ctx.restore();
  }
  /* the landscape: peak cooling against SO₂ for every size of eruption, and the real ones */
  function eruptionLand(S, g) {
    const K = kit(), p = S.p, ctx = g.ctx, E = eruptionOf(S);
    const key = 'land';
    if (!eruptionLand.c) {
      const pts = { tropics: [], high: [] };
      for (let lg = 0; lg <= 2.3; lg += 0.1) { const m = Math.pow(10, lg); pts.tropics.push([lg, -peakOf(eruptionRun({ so2: m, lat: 15, plume: 34, years: 4 }), 'T').T]); pts.high.push([lg, -peakOf(eruptionRun({ so2: m, lat: 60, plume: 34, years: 4 }), 'T').T]); }
      eruptionLand.c = pts;
    }
    void key;
    const Kk = K.plotKey(g, [{ c: '#FFB35C', label: 'the model, a tropical volcano' }, { c: 'rgba(255,179,92,.5)', label: 'high latitude', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'measured (range)' }, { c: '#7FD4FF', dot: true, label: 'this eruption' }]);
    const P = g.Plot({ xmin: 0, xmax: 2.3, ymin: 0, ymax: 1.6, pad: { t: Kk.t }, xticks: [0, 0.5, 1, 1.5, 2], xfmt: v => fmtN(Math.pow(10, v), v < 1 ? 1 : 0), xlabel: 'SO₂ into the stratosphere, Mt (log scale)', ylabel: 'peak cooling, °C', yfmt: v => v.toFixed(1) }).frame();
    Kk.draw(P);
    P.clip(() => {
      P.line(eruptionLand.c.tropics, '#FFB35C', 2.2);
      P.line(eruptionLand.c.high, 'rgba(255,179,92,.5)', 1.4, [4, 3]);
      ERUPTIONS.forEach(e => {
        const x = Math.log10(e.so2);
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.X(x), P.Y(e.cool[0])); ctx.lineTo(P.X(x), P.Y(e.cool[1])); ctx.stroke();
        P.dot(x, (e.cool[0] + e.cool[1]) / 2, 3, '#FFFFFF');
        P.tag(x, e.cool[1], e.name, g.theme['text-2'], e.name.startsWith('Agung') ? 'right' : 'left', e.name.startsWith('Agung') ? -8 : -20);
      });
      const fr = stratFrac(p.plume);
      if (fr > 0) P.dot(Math.log10(Math.max(1, p.so2 * fr)), -E.peak.T, 5.5, '#7FD4FF', g.alpha('#0B1020', .9));
    });
  }
  function hurricanePlot(S, g) {
    const K = kit(), p = S.p, Hh = hurricaneOf(S), T = th(g), h = Hh.tide.hist;
    const Kk = K.plotKey(g, [{ c: '#5FB4FF', label: 'water at the coast' }, { c: '#FFB35C', label: 'at the town, behind the marsh' }, { c: 'rgba(224,210,170,.8)', label: 'dune top', dash: [4, 3] }, { c: 'rgba(160,190,130,.8)', label: 'town ground', dash: [2, 3] }]);
    const top = Math.max(6, Math.ceil(Hh.tide.best.eta + 1));
    const P = g.Plot({ xmin: HU_T0, xmax: HU_T1, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'hours from landfall', ylabel: 'water above normal, m', xfmt: v => (v > 0 ? '+' : '') + v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      P.hline(DUNE_Z, 'rgba(224,210,170,.6)', [4, 3]); P.hline(TOWN_Z, 'rgba(160,190,130,.6)', [2, 3]);
      P.line(h.filter(q => q.t <= S.th).map(q => [q.t, q.eta]), '#5FB4FF', 2.4);
      P.line(h.filter(q => q.t <= S.th).map(q => [q.t, townLevel(q.eta, p)]), '#FFB35C', 2);
      P.line(h.filter(q => q.t > S.th).map(q => [q.t, q.eta]), g.alpha('#5FB4FF', .3), 1.2, [4, 3]);
      P.vline(S.th, g.alpha(T['text-2'], .5), [2, 3]);
    });
  }
  /* the model against four real storms: what it says, and what the high-water marks said */
  function hurricaneCheck(S, g) {
    const K = kit(), ctx = g.ctx, Hh = hurricaneOf(S);
    if (!hurricaneCheck.c) hurricaneCheck.c = HURRICANES.map(hh => { const V = Math.pow(PN - hh.Pc, 0.644) * 6.7 / 1.944; return Object.assign({ model: stormTide({ Pc: hh.Pc, Rmax: hh.Rmax, U: hh.U, V, shelf: hh.shelf }).best.eta }, hh); });
    const Kk = K.plotKey(g, [{ c: '#FFFFFF', dot: true, label: 'a real storm: the model against its high-water marks' }, { c: 'rgba(200,210,230,.6)', label: 'perfect agreement', dash: [4, 3] }, { c: '#5FB4FF', label: 'your storm (model)' }]);
    const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 10, pad: { t: Kk.t }, xlabel: 'the model’s storm tide, m', ylabel: 'measured, m', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      P.line([[0, 0], [10, 10]], 'rgba(200,210,230,.5)', 1.2, [4, 3]);
      hurricaneCheck.c.forEach(c => {
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.X(c.model), P.Y(c.obs[0])); ctx.lineTo(P.X(c.model), P.Y(c.obs[1])); ctx.stroke();
        P.dot(c.model, (c.obs[0] + c.obs[1]) / 2, 3.5, '#FFFFFF');
        P.tag(c.model, c.obs[1], c.name, g.theme['text-2'], 'left', -8);
      });
      P.vline(Hh.tide.best.eta, '#5FB4FF', [3, 3]);
    });
  }
  function wildfirePlot(S, g) {
    const K = kit(), p = S.p, Fi = fireOf(S), ph = wfPhase(S.tw), T = th(g);
    const Kk = K.plotKey(g, [{ c: '#FF8A4C', label: 'area burned, ha' }, { c: 'rgba(255,220,120,.9)', label: 'crown fire', box: true }]);
    const pts = []; for (let h = 0; h <= FIRE_H + 1e-9; h += 0.1) pts.push([h, burnedHa(Fi, h)]);
    const ymax = Math.max(100, Math.ceil(pts[pts.length - 1][1] / 500) * 500);
    const P = g.Plot({ xmin: 0, xmax: FIRE_H, ymin: 0, ymax, pad: { t: Kk.t, l: 58 }, xlabel: 'hours since it started', ylabel: 'burned, ha', xfmt: v => v.toFixed(0), yfmt: v => fmtN(v) }).frame();
    Kk.draw(P);
    P.clip(() => {
      // the hours when the fire was running in the crowns
      const ctx = g.ctx;
      for (let h = 0; h < FIRE_H; h += 0.1) { let c = false; for (let k = 0; k < Fi.T.length && !c; k++) if (Fi.crown[k] && Fi.T[k] >= h && Fi.T[k] < h + 0.1) c = true; if (c) { ctx.fillStyle = 'rgba(255,220,120,.10)'; ctx.fillRect(P.X(h), P.y1, P.X(h + 0.1) - P.X(h), P.y0 - P.y1); } }
      P.line(pts.filter(q => q[0] <= ph.h), '#FF8A4C', 2.6);
      P.line(pts.filter(q => q[0] >= ph.h), g.alpha('#FF8A4C', .3), 1.2, [4, 3]);
      P.vline(ph.h, g.alpha(T['text-2'], .5), [2, 3]);
    });
  }
  function runoffPlot(S, g) {
    const K = kit(), p = S.p, T = th(g);
    const Kk = K.plotKey(g, [{ c: '#6FC46A', label: 'forest (curve number 55)' }, { c: '#FF8A4C', label: 'burned (85)' }, { c: '#FFFFFF', dot: true, label: 'this storm' }]);
    const P = g.Plot({ xmin: 0, xmax: 150, ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 'storm rainfall, mm', ylabel: 'runs off, mm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    const f = [], b = []; for (let r = 0; r <= 150; r += 2) { f.push([r, scsRunoff(r, CN_FOREST)]); b.push([r, scsRunoff(r, CN_BURNED)]); }
    P.clip(() => {
      P.line([[0, 0], [110, 110]], g.alpha(T['text-3'], .5), 1, [2, 3]);
      P.line(f, '#6FC46A', 2.4); P.line(b, '#FF8A4C', 2.4);
      P.dot(p.storm, scsRunoff(p.storm, CN_FOREST), 4.5, '#FFFFFF', g.alpha('#0B1020', .9));
      P.dot(p.storm, scsRunoff(p.storm, CN_BURNED), 5, '#FFFFFF', g.alpha('#0B1020', .9));
      P.tag(104, 104, 'all of it', T['text-3'], 'right');
    });
  }
  function droughtPlot(S, g) {
    const K = kit(), p = S.p, D = droughtOf(S), ctx = g.ctx, T = th(g);
    const Kk = K.plotKey(g, [{ c: '#5FB4FF', label: 'aquifer level, m' }, { c: '#E0B070', label: 'land sunk, cm (right)' }, { c: 'rgba(255,200,120,.14)', box: true, label: 'drought years' }]);
    const low = Math.min(-5, Math.floor(Math.min(...D.rows.map(r => r.head)) / 5) * 5 - 5), subMax = Math.max(20, Math.ceil(D.rows[D.rows.length - 1].sub * 100 / 20) * 20);
    const P = g.Plot({ xmin: 0, xmax: 10, ymin: low, ymax: 2, pad: { t: Kk.t, r: 44 }, xlabel: 'years', ylabel: 'aquifer level, m', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    const sy = cm => 2 + (low - 2) * cm / subMax;
    P.clip(() => {
      ctx.fillStyle = 'rgba(255,200,120,.10)'; ctx.fillRect(P.X(2), P.y1, P.X(2 + p.years) - P.X(2), P.y0 - P.y1);
      const done = D.rows.filter(r => r.t <= S.td);
      P.line(done.map(r => [r.t, r.head]), '#5FB4FF', 2.4);
      P.line(done.map(r => [r.t, sy(r.sub * 100)]), '#E0B070', 2.2);
      P.vline(S.td, g.alpha(T['text-2'], .5), [2, 3]);
    });
    ctx.save(); ctx.font = mono(9); ctx.fillStyle = '#E0B070'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [0, 0.5, 1].forEach(f => ctx.fillText(fmtN(f * subMax), P.x1 + 5, P.Y(sy(f * subMax))));
    ctx.restore();
  }
  /* where the farm's water came from, year by year */
  function waterPlot(S, g) {
    const K = kit(), D = droughtOf(S), T = th(g);
    const Kk = K.plotKey(g, [{ c: '#6FB8FF', box: true, label: 'canal (mountain snow)' }, { c: '#8A9BB0', box: true, label: 'usual pumping' }, { c: '#E0B070', box: true, label: 'extra pumping' }, { c: '#FFFFFF', label: 'what the crops need', w: 1.6 }]);
    const P = g.Plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 1500, pad: { t: Kk.t, l: 56 }, xlabel: 'year', ylabel: 'water, mm', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => v - 0.5), xfmt: v => (v + 0.5).toFixed(0), yfmt: v => fmtN(v) }).frame();
    Kk.draw(P);
    P.clip(() => {
      D.years.forEach((q, y) => {
        if (y > S.td) return;
        const canal = q.got - q.extra - 0.4 * q.need, wells = 0.4 * q.need;
        P.bar(y + 0.5, canal, 0.36, 0, '#6FB8FF'); P.bar(y + 0.5, canal + wells, 0.36, canal, '#8A9BB0'); if (q.extra > 1) P.bar(y + 0.5, canal + wells + q.extra, 0.36, canal + wells, '#E0B070');
      });
      P.line(D.years.map((q, y) => [y + 0.5, q.need]), '#FFFFFF', 1.6, [4, 3]);
      P.vline(S.td, g.alpha(T['text-2'], .5), [2, 3]);
    });
  }
  function plot1(S, g) { const s = S.p.setup; (s === 'eruption' ? eruptionPlot : s === 'hurricane' ? hurricanePlot : s === 'wildfire' ? wildfirePlot : droughtPlot)(S, g); }
  function plot2(S, g) { const s = S.p.setup; (s === 'eruption' ? eruptionLand : s === 'hurricane' ? hurricaneCheck : s === 'wildfire' ? runoffPlot : waterPlot)(S, g); }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'eruption') {
      const E = eruptionOf(S), now = erAt(E, S.te);
      return [
        { label: 'Since the eruption', value: yearSay(S.te), hint: 'days slowly, then a month a second' },
        { label: 'Into the stratosphere', value: (p.so2 * stratFrac(p.plume)).toFixed(0), unit: 'Mt SO₂', flag: stratFrac(p.plume) > 0 ? 'accent' : 'warn', hint: 'of ' + p.so2.toFixed(0) + ' Mt · the column reaches ' + p.plume.toFixed(0) + ' km' },
        { label: 'Sunlight blocked', value: Math.abs(now.F).toFixed(2), unit: 'W/m²', hint: 'optical depth ' + now.aod.toFixed(3) },
        { label: 'Temperature', value: now.T.toFixed(2), unit: '°C', flag: 'accent', hint: 'coldest ' + E.peak.T.toFixed(2) + ' at ' + Math.round(E.peak.t * 12) + ' months' },
        { label: 'Sea level', value: now.sl.toFixed(1), unit: 'mm', hint: 'the ocean shrinks as it cools' },
        { label: 'CO₂ growth', value: E.co2.toFixed(2), unit: 'ppm/yr', hint: 'change in the second year' }
      ];
    }
    if (p.setup === 'hurricane') {
      const Hh = hurricaneOf(S), eta = huAt(Hh, S.th);
      return [
        { label: 'Hours to landfall', value: (-S.th).toFixed(1), unit: 'h', hint: S.th > 0 ? 'the eye is ashore' : 'an hour a second' },
        { label: 'Strongest wind', value: Hh.V.toFixed(0), unit: 'm/s', flag: 'accent', hint: 'Category ' + Hh.cat + ' · ' + Hh.Pc.toFixed(0) + ' hPa' },
        { label: 'Water at the coast', value: eta.toFixed(2), unit: 'm', hint: 'peak ' + Hh.tide.best.eta.toFixed(2) + ' m' },
        { label: 'At the town', value: townLevel(eta, p).toFixed(2), unit: 'm', flag: townLevel(eta, p) > TOWN_Z ? 'crit' : '', hint: 'ground at ' + TOWN_Z + ' m · marsh took ' + (MARSH_LOSS * p.marsh).toFixed(1) + ' m' },
        { label: 'Rain in all', value: fmtN(Hh.rain), unit: 'mm', hint: 'slower storms rain longer' },
        { label: 'Surge parts', value: Hh.tide.best.setup.toFixed(1) + ' + ' + Hh.tide.best.ib.toFixed(1) + ' + ' + Hh.tide.best.wave.toFixed(1), unit: 'm', hint: 'wind + low pressure + waves' }
      ];
    }
    if (p.setup === 'wildfire') {
      const Fi = fireOf(S), ph = wfPhase(S.tw), F = ffdi(p.temp, p.rh, p.wind, p.dry), r = headRos(p, p.wind, 0), I = byram(r);
      return [
        { label: 'Fire danger', value: F.toFixed(0), flag: F >= 50 ? 'crit' : F >= 25 ? 'warn' : '', hint: dangerOf(F) + ' (McArthur)' },
        { label: 'Head fire', value: (r * 0.06).toFixed(2), unit: 'km/h', hint: 'on the flat, with the wind' },
        { label: 'Intensity', value: fmtN(I), unit: 'kW/m', flag: I > crownThreshold() ? 'crit' : '', hint: 'flames ' + flameLength(I).toFixed(1) + ' m · crowns above ' + fmtN(crownThreshold()) },
        { label: 'Burned', value: fmtN(burnedHa(Fi, ph.h)), unit: 'ha', flag: 'accent', hint: ph.h.toFixed(1) + ' h of fire' },
        { label: 'Storm runoff', value: scsRunoff(p.storm, CN_BURNED).toFixed(1), unit: 'mm', hint: 'from ' + p.storm + ' mm · forest ' + scsRunoff(p.storm, CN_FOREST).toFixed(1) + ' mm' },
        { label: 'Fuel moisture', value: fuelMoisture(p.temp, p.rh).toFixed(1), unit: '%', hint: 'dead twigs and needles' }
      ];
    }
    const D = droughtOf(S), r = drAt(D, S.td), yr = D.years[Math.min(9, Math.floor(S.td))];
    return [
      { label: 'Year', value: (Math.min(9, Math.floor(S.td)) + 1).toString(), hint: r.dr ? 'a drought year' : 'a normal year' },
      { label: 'Rain this year', value: fmtN(yr.P), unit: 'mm', hint: 'normal 294' },
      { label: 'Evaporation demand', value: fmtN(yr.e0), unit: 'mm', hint: 'Hargreaves · CIMIS Fresno ≈ 1,450' },
      { label: 'Crops get', value: (100 * r.crop).toFixed(0), unit: '%', flag: r.crop < 0.9 ? 'warn' : '', hint: 'of the water they need' },
      { label: 'Aquifer', value: r.head.toFixed(1), unit: 'm', flag: r.head < -10 ? 'crit' : '', hint: 'below its level before' },
      { label: 'Land sunk', value: (r.sub * 100).toFixed(0), unit: 'cm', flag: 'accent', hint: 'never comes back' }
    ];
  }
  function equation(S) {
    const p = S.p, Eq = L.E, note = s => '<br><span style="font-size:12px;color:var(--text-3)">' + s + '</span>';
    if (p.setup === 'eruption') {
      const E = eruptionOf(S), now = erAt(E, S.te);
      return Eq.v('C') + ' ' + Eq.frac(Eq.v('dT'), Eq.v('dt')) + ' ' + Eq.op('=') + ' ' + Eq.v('F') + ' ' + Eq.op('−') + ' λ' + Eq.v('T') + ' ' + Eq.op('−') + ' γ(' + Eq.v('T') + ' ' + Eq.op('−') + ' ' + Eq.v('T') + Eq.sub('deep') + '),  ' + Eq.v('F') + ' ' + Eq.op('=') + ' ' + Eq.n(now.F, 'W/m²') +
        note('F = −25 × the veil’s optical depth; C = 7.3 and 106 W yr m⁻² K⁻¹ for the upper and deep ocean, λ = 1.13, γ = 0.73 (the CMIP5 models’ mean)');
    }
    if (p.setup === 'hurricane') {
      const Hh = hurricaneOf(S);
      return Eq.v('g') + Eq.v('D') + ' ' + Eq.frac(Eq.v('dη'), Eq.v('dx')) + ' ' + Eq.op('=') + ' ' + Eq.frac('τ' + Eq.sub('x'), 'ρ') + ' ' + Eq.op('+') + ' ' + Eq.v('f') + Eq.v('Q') + Eq.sub('y') + ',  η ' + Eq.op('=') + ' ' + Eq.n(Hh.tide.best.eta, 'm') +
        note('the wind’s push and the Coriolis force on the current running along the coast pile water up across the shelf; plus 1 cm for every hPa of low pressure, and the breaking waves');
    }
    if (p.setup === 'wildfire') {
      return Eq.v('R') + ' ' + Eq.op('=') + ' ' + Eq.v('R') + Eq.sub('0') + ' (1 ' + Eq.op('+') + ' φ' + Eq.sub('wind') + ' ' + Eq.op('+') + ' φ' + Eq.sub('slope') + '),  φ' + Eq.sub('wind') + ' ' + Eq.op('=') + ' ' + Eq.n(phiWind(p.wind), '') + ',  ' + Eq.v('Q') + ' ' + Eq.op('=') + ' ' + Eq.frac('(' + Eq.v('P') + ' − 0.2' + Eq.v('S') + ')²', Eq.v('P') + ' + 0.8' + Eq.v('S')) +
        note('Rothermel’s spread with wind and slope; above ' + fmtN(crownThreshold()) + ' kW/m it crowns. After the fire, runoff by the curve number: S = 25400/CN − 254 mm');
    }
    const D = droughtOf(S), r = drAt(D, S.td);
    return 'Δ' + Eq.v('h') + ' ' + Eq.op('=') + ' ' + Eq.frac('extra pumping', Eq.v('S') + Eq.sub('y')) + ',  sinking ' + Eq.op('=') + ' ' + Eq.frac('new low', '15') + ' ' + Eq.op('=') + ' ' + Eq.n(r.sub * 100, 'cm') +
      note('ET₀ = 0.0023 Ra (T + 17.8) √ΔT (Hargreaves); the aquifer’s effective storage 0.08; every metre of new low squeezes 1/15 m out of the clay');
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const RESTART = true;
  L.register({
    id: 'g6a-one-event',
    grade: 6, unit: '6A', topics: ['A4'],
    subject: 'earth',
    name: 'One Event, Four Spheres — Eruption, Hurricane, Wildfire, Drought',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS MS-ESS3-2 · Natural hazards', 'NGSS MS-ESS2 · Earth’s Systems', 'NGSS CCC · Cause and Effect', 'CAST'],
    weight: 'Earth systems',
    is3D: true,
    autoplay: true,
    bloom: 0.18,
    stageHint: 'Drag to turn the land · scroll to zoom · every link is computed',
    lede: 'Something happens in one sphere, and all four answer. <b>A volcano</b> puts sulfur into the stratosphere and the whole world cools — ' +
      'the model is checked against Pinatubo. <b>A hurricane</b> draws its power from warm water and pushes the sea over the land — checked ' +
      'against Katrina, Camille, Ike and Andrew. <b>A wildfire</b> runs with the wind and up the slopes, and the next storm runs off the bare ' +
      'ground. <b>A drought</b> sends farmers to their wells, and the land itself sinks. Every arrow between the spheres is a number the lab computes.',

    params: preset({}),
    presets: [
      { name: 'Pinatubo, 1991: 17 Mt of SO₂ to 34 km', params: preset({}) },
      { name: 'Tambora, 1815: the year without a summer', params: preset({ so2: 60, plume: 43 }) },
      { name: 'A big eruption whose column stays in the weather', params: preset({ so2: 30, plume: 12 }) },
      { name: 'A Katrina-sized storm on a wide shelf', params: preset({ setup: 'hurricane', sst: 27, rmax: 55, speed: 6, marsh: 2 }) },
      { name: 'The same storm with 10 km of marsh', params: preset({ setup: 'hurricane', sst: 27, rmax: 55, speed: 6, marsh: 10 }) },
      { name: 'A storm that stalls: Harvey’s rain', params: preset({ setup: 'hurricane', sst: 29.5, speed: 1 }) },
      { name: 'A hot, dry, windy day: the fire runs to the town', params: preset({ setup: 'wildfire' }) },
      { name: 'Black Saturday’s weather', params: preset({ setup: 'wildfire', temp: 46.4, rh: 6, wind: 45, dry: 10 }) },
      { name: 'A mild spring day: the fire creeps', params: preset({ setup: 'wildfire', temp: 22, rh: 50, wind: 10, dry: 4 }) },
      { name: 'Four dry years, pumping to save the crops', params: preset({ setup: 'drought' }) },
      { name: 'Four dry years without extra pumping', params: preset({ setup: 'drought', pump: false }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Event', restructure: true, options: SETUPS } ] },
      { group: 'The eruption', when: is('eruption'), items: [
        { key: 'so2', label: 'Sulfur dioxide erupted', min: 1, max: 100, step: 1, unit: 'Mt', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'plume', label: 'Height of the column', min: 8, max: 45, step: 1, unit: 'km', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'band', type: 'select', label: 'The volcano is', restructure: RESTART, options: [{ value: 'tropics', label: 'In the tropics' }, { value: 'high', label: 'Far north' }] } ] },
      { group: 'The storm', when: is('hurricane'), items: [
        { key: 'sst', label: 'Sea-surface temperature', min: 25, max: 31, step: 0.1, unit: '°C', fmt: v => v.toFixed(1), restructure: RESTART },
        { key: 'rmax', label: 'Size (radius of strongest wind)', min: 15, max: 80, step: 1, unit: 'km', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'speed', label: 'Forward speed', min: 1, max: 10, step: 0.5, unit: 'm/s', fmt: v => v.toFixed(1), restructure: RESTART } ] },
      { group: 'The coast', when: is('hurricane'), items: [
        { key: 'shelf', type: 'select', label: 'Sea floor offshore', restructure: RESTART, options: [{ value: 'wide', label: 'Wide and shallow' }, { value: 'narrow', label: 'Narrow and steep' }] },
        { key: 'marsh', label: 'Marsh in front of the town', min: 0, max: 10, step: 0.5, unit: 'km', fmt: v => v.toFixed(1) } ] },
      { group: 'Fire weather', when: is('wildfire'), items: [
        { key: 'temp', label: 'Air temperature', min: 15, max: 47, step: 0.5, unit: '°C', fmt: v => v.toFixed(1), restructure: RESTART },
        { key: 'rh', label: 'Humidity', min: 5, max: 60, step: 1, unit: '%', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'wind', label: 'Wind speed', min: 0, max: 60, step: 1, unit: 'km/h', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'dry', label: 'Dryness (drought factor)', min: 1, max: 10, step: 0.5, unit: '/10', fmt: v => v.toFixed(1), restructure: RESTART },
        { key: 'windFrom', type: 'select', label: 'Wind from the', restructure: RESTART, options: [{ value: 'west', label: 'West' }, { value: 'east', label: 'East' }, { value: 'south', label: 'South' }] },
        { key: 'ignite', type: 'select', label: 'It starts', restructure: RESTART, options: [{ value: 'west', label: 'In the valley' }, { value: 'slope', label: 'At a hill’s foot' }, { value: 'ridge', label: 'On the ridge' }] } ] },
      { group: 'After the fire', when: is('wildfire'), items: [
        { key: 'storm', label: 'The first storm', min: 10, max: 150, step: 5, unit: 'mm', fmt: v => v.toFixed(0) } ] },
      { group: 'The drought', when: is('drought'), items: [
        { key: 'rain', label: 'Rain', min: 20, max: 100, step: 5, unit: '% of normal', fmt: v => v.toFixed(0) },
        { key: 'warm', label: 'Warmer by', min: 0, max: 3, step: 0.5, unit: '°C', fmt: v => v.toFixed(1) },
        { key: 'years', label: 'It lasts', min: 1, max: 6, step: 1, unit: 'years', fmt: v => v.toFixed(0) },
        { key: 'pump', type: 'toggle', label: 'Pump extra groundwater to save the crops' } ] }
    ],

    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) {
      if (type !== 'pointerdown') return;
      if (window.KITMS && window.KITMS.chipHit(S, x, y)) return;
    },

    plots: [
      { title: S => ({ eruption: 'The world after the eruption: temperature, and the sunlight blocked', hurricane: 'The water rising as the storm comes in', wildfire: 'The fire: area burned hour by hour', drought: 'Ten years in the valley: the aquifer, and the land sinking' })[S.p.setup],
        draw(S, g) { plot1(S, g); } },
      { title: S => ({ eruption: 'Every size of eruption — and the real ones', hurricane: 'Checking the model on four real storms', wildfire: 'After the fire: how much of a storm runs off', drought: 'Where the farm’s water came from, year by year' })[S.p.setup],
        draw(S, g) { plot2(S, g); } }
    ],

    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'NGSS MS-ESS2 · one sphere changes the others',
        q: 'Pinatubo put about 17 Mt of SO₂ into the stratosphere in 1991. By how many degrees does the model say the world cooled at its coldest?',
        params: preset({}),
        predict: { label: 'cooling', unit: '°C', tol: 0.1 },
        measure: S => -peakOf(eruptionRun({ so2: S.p.so2, plume: S.p.plume, lat: 15, years: ER_YEARS }), 'T').T,
        working: 'The SO₂ turns into sulfuric-acid droplets within about a month; they block about 3 W/m² of sunlight at their thickest and fall out over ' +
          'a year or so. The ocean’s surface layer takes time to cool, so the coldest comes in the second year: about 0.4 °C. The world measured ' +
          '0.3–0.5 °C of cooling in 1992–93.' },
      { source: 'Systems · a threshold decides',
        q: 'A volcano erupts 30 Mt of SO₂, but its column reaches only 15 km. How much of the SO₂ gets into the stratosphere?',
        params: preset({ so2: 30, plume: 15 }),
        predict: { label: 'SO₂ in the stratosphere', unit: 'Mt', tol: 0.05 },
        measure: S => S.p.so2 * stratFrac(S.p.plume),
        working: 'Over the tropics the stratosphere starts near 16 km. The model lets a column put SO₂ above the weather in proportion as its top clears ' +
          '14–18 km: a 15 km column gets only a quarter of it there, 7.5 Mt. The rest is rained out within weeks and never reaches the whole world.' },
      { source: 'NGSS MS-ESS3-2 · hazards on the coast',
        q: 'A storm the size of Katrina (strongest winds 55 km out) comes ashore over 27 °C water on a wide, shallow shelf. How high does the storm tide reach at the coast?',
        params: preset({ setup: 'hurricane', sst: 27, rmax: 55, speed: 6, marsh: 2 }),
        predict: { label: 'storm tide', unit: 'm', tol: 0.08 },
        measure: S => hurricaneRun({ sst: S.p.sst, rmax: S.p.rmax, speed: S.p.speed, shelf: S.p.shelf }).atCoast,
        working: 'The 27 °C sea can power about 61 m/s winds. Over a wide shallow shelf the wind’s push and the current it drives along the coast pile ' +
          'the water up: about 5.5 m, plus 0.5 m for the low pressure where the transect crosses and 0.9 m of breaking waves — 6.9 m. Katrina’s high-water ' +
          'marks were 7–8.5 m; the model, like the engineers’ method it follows, runs a little low.' },
      { source: 'Interactions · the biosphere protects',
        q: 'Behind 10 km of marsh, how much lower is the water at the town than at the coast?',
        params: preset({ setup: 'hurricane', marsh: 10 }),
        predict: { label: 'lower by', unit: 'm', tol: 0.05 },
        measure: S => MARSH_LOSS * S.p.marsh,
        working: 'Marsh plants and shallow water drag on the surge as it floods inland: about 7 cm for every kilometre (the US Army Corps of Engineers’ ' +
          'rule of thumb, 1 ft per 2.75 miles). Ten kilometres take off about 0.7 m — the difference between a flooded ground floor and a dry one.' },
      { source: 'Modelling · the Kraft rule',
        q: 'A storm stalls at 1 m/s over a 29.5 °C sea, as Harvey did in 2017. How much rain falls in all?',
        params: preset({ setup: 'hurricane', sst: 29.5, speed: 1 }),
        predict: { label: 'rain', unit: 'mm', tol: 0.1 },
        measure: S => hurricaneRun({ sst: S.p.sst, rmax: S.p.rmax, speed: S.p.speed, shelf: S.p.shelf }).rain,
        working: 'A slow storm rains on the same place for longer: forecasters’ Kraft rule gives 100 inches divided by the forward speed in knots, and ' +
          'warmer water holds about 7 % more moisture for every °C. About 1,400 mm — Harvey dropped up to 1,539 mm on Texas.' },
      { source: 'NGSS MS-ESS3-2 · forecasting a hazard',
        q: 'On 7 February 2009 Melbourne reached 46.4 °C with 6 % humidity, a 45 km/h wind and a drought factor of 10. What was the fire danger index?',
        params: preset({ setup: 'wildfire', temp: 46.4, rh: 6, wind: 45, dry: 10 }),
        predict: { label: 'fire danger', unit: '', tol: 0.05 },
        measure: S => ffdi(S.p.temp, S.p.rh, S.p.wind, S.p.dry),
        working: 'McArthur’s index rises with temperature, dryness and wind and falls with humidity: about 138. Anything over 100 is now called ' +
          '“catastrophic” — a category Australia created after that day, Black Saturday.' },
      { source: 'Interactions · fire changes the water cycle',
        q: 'After the fire, a 50 mm storm falls on the burned slopes. How many millimetres run off (curve number 85)?',
        params: preset({ setup: 'wildfire', storm: 50 }),
        predict: { label: 'runoff', unit: 'mm', tol: 0.05 },
        measure: S => scsRunoff(S.p.storm, CN_BURNED),
        working: 'The curve number method: S = 25400/85 − 254 = 45 mm of storage, the first 9 mm soak in, and Q = (50 − 9)²/(50 − 9 + 45) ≈ 19.6 mm. ' +
          'The forest it was (curve number 55) would have shed 0.3 mm — about sixty times less.' },
      { source: 'NGSS MS-ESS3-3 · people change the land',
        q: 'Rain falls to 55 % of normal for four years, 1 °C warmer, and farmers pump extra groundwater. How many centimetres does the land sink?',
        params: preset({ setup: 'drought' }),
        predict: { label: 'sinking', unit: 'cm', tol: 0.08 },
        measure: S => { const d = droughtRun({ rain: S.p.rain, warm: S.p.warm, years: S.p.years, pump: S.p.pump }); return d[d.length - 1].sub * 100; },
        working: 'Each drought year the wells pump about 530 mm more water than recharge replaces. With an effective storage of 0.08 the aquifer falls ' +
          'about 6.6 m a year, 27 m in four; each metre of new low squeezes 1/15 m out of the clay. About 1.8 m — and it does not come back.' }
    ],

    walkthrough: [
      { title: '1 · A volcano in the geosphere',
        ask: 'Can one volcano in the Philippines change the temperature of the whole world?',
        reveal: '<b>Yes — if its column reaches the stratosphere.</b> The SO₂ becomes droplets that spread round the planet and reflect sunlight; the ' +
          'whole world cooled about 0.4 °C after Pinatubo. Watch the veil spread on the globe.', params: preset({}) },
      { title: '2 · The threshold',
        ask: 'Make the eruption bigger but keep its column at 12 km. What happens to the world?',
        reveal: '<b>Almost nothing.</b> Below the stratosphere the rain washes the SO₂ out in weeks. Height, not just size, decides whether an eruption ' +
          'reaches the other spheres.', params: preset({ so2: 30, plume: 12 }) },
      { title: '3 · A loop back',
        ask: 'After Pinatubo, CO₂ rose more slowly for a year. Why would a volcano slow CO₂ down?',
        reveal: '<b>The biosphere answered.</b> Cooler soils breathe out less CO₂, so the air gained about 1 ppm less that year — the atmosphere changed the ' +
          'biosphere, which changed the atmosphere back.', params: preset({}) },
      { title: '4 · What powers a hurricane',
        ask: 'Lower the sea temperature to 25 °C. What happens to the storm?',
        reveal: '<b>It cannot become a hurricane.</b> The storm’s energy is the heat and water the warm sea gives the air: every degree of sea ' +
          'surface adds wind. The hydrosphere powers the atmosphere.', params: preset({ setup: 'hurricane', sst: 25 }) },
      { title: '5 · Size matters for water',
        ask: 'Katrina was Category 3 at landfall, Camille Category 5. Which pushed the higher surge on the same coast?',
        reveal: '<b>Katrina.</b> It was three times wider, so strong winds pushed on far more of the shallow shelf. See the model against both on the ' +
          'second graph — a model worth trusting must match real events.', params: preset({ setup: 'hurricane', sst: 27, rmax: 55, speed: 6, marsh: 2 }) },
      { title: '6 · Marshes as a shield',
        ask: 'Add 10 km of marsh in front of the town. How much does it help?',
        reveal: '<b>About 0.7 m less water at the town.</b> Plants and shallow water slow the surge — the biosphere protecting people from the ' +
          'hydrosphere. Losing coastal wetlands makes storms more dangerous.', params: preset({ setup: 'hurricane', marsh: 10 }) },
      { title: '7 · Fire, then flood',
        ask: 'The fire is out. Why does the first storm after it cause floods and mudslides?',
        reveal: '<b>The burned soil sheds water.</b> With no plants and a water-repellent crust, a 50 mm storm runs off sixty times faster than it ran ' +
          'off the forest, carrying soil into the creek. The biosphere’s loss becomes the hydrosphere’s and the geosphere’s problem.', params: preset({ setup: 'wildfire', storm: 50 }) },
      { title: '8 · The land sinks',
        ask: 'Pumping groundwater saves the crops in a drought. What is the cost?',
        reveal: '<b>The ground itself.</b> As the aquifer falls, clay layers squeeze and the land sinks — about 1.8 m in four dry years here, and it ' +
          'never springs back. In California’s San Joaquin Valley the land has sunk up to 9 m since the 1920s.', params: preset({ setup: 'drought' }) }
    ],

    quiz: [
      { q: 'How can a volcanic eruption cool the whole Earth?',
        options: ['Its ash blocks the sun everywhere for years', 'Sulfur dioxide makes droplets in the stratosphere that reflect sunlight', 'Lava cools the ocean', 'It makes more clouds over the volcano'],
        answer: 1, why: 'Ash falls out in days. SO₂ that reaches the stratosphere forms sulfuric-acid droplets that spread round the world and reflect sunlight for a year or two.' },
      { q: 'Katrina (Category 3) pushed a higher storm surge than Camille (Category 5) on the same coast. Why?',
        options: ['Katrina was faster', 'Katrina was much larger, so its winds pushed on more of the shallow sea floor', 'The tide was higher', 'Categories measure rain, not wind'],
        answer: 1, why: 'Surge depends on how much sea the wind pushes, not only how hard. A wide storm over a wide, shallow shelf piles up the most water.' },
      { q: 'How do coastal marshes protect towns from hurricanes?',
        options: ['They block the wind', 'Their plants and shallow water slow the surge, lowering it by several centimetres per kilometre', 'They absorb all the rain', 'They make the storm weaker at sea'],
        answer: 1, why: 'Marsh plants drag on the flooding water. About 7 cm is lost for every kilometre of marsh — the biosphere shielding people from the hydrosphere.' },
      { q: 'Why can a storm after a wildfire cause floods and mudslides?',
        options: ['Fires make storms stronger', 'Burned soil repels water and nothing holds it, so rain runs off carrying soil', 'Ash makes the rain heavier', 'Firefighting water fills the rivers'],
        answer: 1, why: 'Fire removes plants and litter and can leave a water-repellent layer in the soil. Rain that once soaked in runs off, and takes the soil with it.' },
      { q: 'Why is the land sinking in parts of California’s Central Valley?',
        options: ['Earthquakes', 'Pumping groundwater squeezes clay layers underground', 'Heavy farm machines', 'The sea is rising'],
        answer: 1, why: 'When wells lower the water in an aquifer, the clay between the sand layers is squeezed and compacts for good: the land surface sinks.' },
      { q: 'An event starts in one sphere. Which spheres does it change?',
        options: ['Only that one', 'Only the atmosphere', 'Often all four, and they can change each other back', 'Only the living things'],
        answer: 2, why: 'The spheres are one system. A volcano (geosphere) changes the air, the ocean and the plants — and the plants change the air back.' }
    ],

    notes: '<b>Where this shows up.</b><ul>' +
      '<li>NGSS <b>MS-ESS3-2</b>: analyze and interpret data on natural hazards to forecast future events and inform technologies to lessen them.</li>' +
      '<li>NGSS <b>MS-ESS2</b> and <b>MS-ESS3-3</b>: Earth’s systems interact; human activities (pumping, clearing wetlands) change them.</li>' +
      '<li>NGSS cross-cutting concepts <b>Cause and Effect</b> and <b>Systems and System Models</b>: chains of causes across subsystems, and models checked against real events.</li></ul>' +
      '<div class="pyq"><em>Misconception to catch</em> “A bigger eruption always cools the world more.” Only what reaches the stratosphere counts.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “The category tells you the storm surge.” Size and the sea floor matter as much as the wind.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “After a fire, the danger is over.” The first storms bring floods and debris flows.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “Groundwater refills, so pumping is free.” Squeezed clay never holds that water again, and the land stays sunk.</div>'
  });

  const EQ_NOTE = {
    eruption: 'A <b>two-layer energy balance</b>: the ocean’s upper layer warms or cools with the sunlight it gets and the heat it loses to space and to the ' +
      'deep ocean. The veil of droplets is the forcing; the ocean’s slowness is why the coldest comes a year or more after the eruption.',
    hurricane: 'The <b>bathystrophic storm tide</b>, the method engineers used before today’s computer models: across the shelf, the slope of the water ' +
      'balances the wind’s push and the Coriolis force on the current along the coast. Shallow water piles up the most.',
    wildfire: 'Fire spreads by <b>minimum travel time</b>: from every burning cell to its neighbours, at a speed set by the fuel’s dryness, the wind along ' +
      'that direction and the slope (Rothermel). Where the flames grow intense enough, the fire climbs into the crowns and runs over three times faster.',
    drought: 'A <b>water balance</b>: what the crops need is evaporation demand times the crop’s coefficient; the canal, the usual wells and extra pumping ' +
      'meet it. Extra pumping lowers the aquifer, and the clay it squeezes lowers the land.'
  };

  const MODEL = { eruptionRun, peakOf, stratFrac, ERUPTIONS, stormTide, hurricaneRun, HURRICANES, mpi, pcOf, catOf, ffdi, dangerOf, headRos, byram,
    flameLength, crownThreshold, scsRunoff, droughtRun, yearOf, et0Month, fireOf, burnedHa, FIRE, CN_FOREST, CN_BURNED, MARSH_LOSS, BASE: () => BASE };
  L.models = L.models || {};
  L.models['g6a-one-event'] = MODEL;
})(window.InsightLab);
