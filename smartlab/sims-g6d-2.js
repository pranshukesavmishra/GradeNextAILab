/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-2  The Atmosphere Column
   (D2.1 Composition; D2.2 Layers; D2.3 Air pressure; D2.4 Pressure,
    temperature and density together; D2.5 Why warm air rises)

   Five experiments on the air itself:
     composition — take a sample of air apart on the bench: iron wool
                   rusting in an upturned cylinder over water takes out
                   the oxygen (the water climbs a fifth of the way), soda
                   lime takes the CO₂ (you can hardly see it), a drying
                   tube the vapour; what is left is nitrogen and argon. The
                   CO₂ dial runs from the ice ages to a doubled world.
     layers      — a sounding rocket's falling sphere reads the temperature
                   from the ground to 120 km. The profile is the U.S.
                   Standard Atmosphere (1976), its pressure integrated
                   hydrostatically; take the ozone out and the stratosphere
                   loses its warmth; move to the tropics or the poles and
                   the tropopause moves; a quiet or an active Sun heats the
                   thermosphere.
     pressure    — Torricelli's barometer in mercury, water or wine, taken
                   up a mountain or into a storm; a flask of air weighed,
                   then pumped empty.
     ptrho       — a sealed gas syringe in a water bath under a bell jar:
                   change the temperature, the pressure outside, or clamp
                   the piston, and PV = nRT is what the scales read.
     rise        — a hot-air balloon: heat the air inside with the burner,
                   load the basket, choose a cold dawn or a hot afternoon;
                   lift = V(ρ_out − ρ_in)g, the envelope's heat balance and
                   drag fly it to its floating height.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.R3, MEAS, BENCH, TERRAIN, EARTH,
   G6D and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;

  const R = 8.314462, M_AIR = 0.0289644, G0 = 9.80665, RD = R / M_AIR;          // RD = 287.05 J/(kg·K)
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));

  /* ============================================================
     COMPOSITION — dry air by volume (NOAA, CRC Handbook); CO₂ is the student's
     ============================================================ */
  const GASES = [
    { k: 'N2', name: 'nitrogen', f: 0.78084, M: 28.013, col: '#7FA8E8' },
    { k: 'O2', name: 'oxygen', f: 0.20946, M: 31.999, col: '#FF8A7A' },
    { k: 'Ar', name: 'argon', f: 0.00934, M: 39.948, col: '#C9A0F0' },
    { k: 'CO2', name: 'carbon dioxide', f: 0.00042, M: 44.01, col: '#B8C0A0' },
    { k: 'Ne', name: 'neon', f: 18.18e-6, M: 20.18, col: '#FFB060' },
    { k: 'He', name: 'helium', f: 5.24e-6, M: 4.003, col: '#F0E080' },
    { k: 'CH4', name: 'methane', f: 1.9e-6, M: 16.04, col: '#90D090' }
  ];
  /* air of a given CO₂ and humidity: mole fractions, molar mass, density */
  function airOf(p) {
    const co2 = p.co2 * 1e-6, dryOther = 1 - 0.00042;               // CO₂ takes its share from nitrogen
    const x = {}; GASES.forEach(g => { x[g.k] = g.f; });
    x.CO2 = co2; x.N2 = 0.78084 - (co2 - 0.00042);
    const P = p.press * 100, e = clamp(p.hum / 100, 0, 1) * es(p.T), w = e / P;     // water vapour's share
    const out = {}; let M = 0;
    Object.keys(x).forEach(k => { out[k] = x[k] * (1 - w); M += out[k] * GASES.find(g => g.k === k).M; });
    out.H2O = w; M += w * 18.015;
    void dryOther;
    return { x: out, M, rho: P * M / 1000 / (R * (p.T + 273.15)) };
  }
  /* the upturned cylinder: V0 mL of air over water; the absorber takes its gas out at a rate (iron wool rusts with a time
     constant; soda lime and the drying tube are fast) */
  const ABS = {
    iron: { name: 'damp iron wool', gas: 'O2', tau: 7200 },        // vinegar-washed wool: most O₂ gone in a few hours
    soda: { name: 'soda lime', gas: 'CO2', tau: 300 },
    dry: { name: 'calcium chloride', gas: 'H2O', tau: 600 },
    candle: { name: 'a burning candle', gas: 'O2', tau: 6 }     // the classroom trap: see candleState
  };
  /* a candle under the cylinder (Birk & Lawson 1999; Vitz 2000): it goes out with about 15.5 % oxygen left. Paraffin
     (C₂₅H₅₂) makes 25 CO₂ for every 38 O₂ it burns, so the gas hardly shrinks; the water climbs because the air it
     heated by ~40 K bubbled out as the cylinder went over, and shrinks back as the rest cools */
  const CANDLE = { out: 0.155, burn: 6, dT: 40, cool: 60, co2PerO2: 25 / 38 };
  function candleState(p, t) {
    const A = airOf({ co2: p.co2, hum: p.hum, T: p.T, press: 1013.25 }), O20 = A.x.O2, used = (O20 - CANDLE.out) * Math.min(1, t / CANDLE.burn);
    const T0 = p.T + 273.15, b = 1 - T0 / (T0 + CANDLE.dT);                          // the share that bubbled out while hot
    const dT = t < CANDLE.burn ? CANDLE.dT : CANDLE.dT * Math.exp(-(t - CANDLE.burn) / CANDLE.cool);
    const n = (1 - b) * (1 - used + used * CANDLE.co2PerO2);                            // moles left, per mole trapped at the start
    const V = n * (T0 + dT) / T0;
    const x = {}; Object.keys(A.x).forEach(k => { x[k] = A.x[k]; }); x.O2 = O20 - used; x.CO2 = A.x.CO2 + used * CANDLE.co2PerO2;
    const tot = Object.keys(x).reduce((s2, k) => s2 + x[k], 0); Object.keys(x).forEach(k => { x[k] /= tot; });
    return { rise: Math.max(0, 1 - V), x, burning: t < CANDLE.burn };
  }
  function absorbed(p, t) {
    const A = air0(p), a = ABS[p.absorber], f = A.x[a.gas], tau = a.tau * Math.pow(2, -(p.T - 20) / 10);   // Q10 = 2
    return f * (1 - Math.exp(-t / tau));                            // share of the original volume taken out
  }
  const air0 = p => airOf({ co2: p.co2, hum: p.hum, T: p.T, press: 1013.25 });
  const CO2_RECORD = [[-20000, 190], [-10000, 260], [1000, 279], [1750, 278], [1850, 285], [1900, 296], [1950, 311], [1959, 315.98], [1970, 325.7], [1980, 338.8], [1990, 354.4], [2000, 369.7], [2010, 389.9], [2020, 414.2], [2023, 421.1]];

  /* ============================================================
     LAYERS — the U.S. Standard Atmosphere (1976), extended by latitude, ozone and the Sun
     ============================================================ */
  const STD = [[0, -6.5], [11, 0], [20, 1.0], [32, 2.8], [47, 0], [51, -2.8], [71, -2.0], [84.852, 0]];   // km, K/km
  /* the profile: a tropopause and surface for the latitude; the stratosphere's warming scaled by the ozone; a thermosphere
     that climbs from the mesopause toward T∞ (Bates' profile) set by the Sun */
  const LAT = { tropics: { T0: 299.7, zt: 17, name: 'the tropics' }, mid: { T0: 288.15, zt: 11, name: 'mid-latitudes' }, polar: { T0: 265, zt: 8, name: 'the polar regions' } };
  const SUNA = { quiet: 700, average: 1000, active: 1400 };
  function profile(p) {
    const L0 = LAT[p.lat], T0 = L0.T0 + (p.dTs || 0), zt = L0.zt, oz = p.ozone / 100;
    const Ttrop = T0 - 6.5 * zt;
    const pts = [];
    /* above the tropopause the standard's shape, stretched so the stratopause stays at 47 km; everything it adds to the
       tropopause's temperature is the ozone's heating (and the cooling that follows it), so it scales with the ozone */
    const Tsp = Ttrop + oz * (270.65 - Ttrop);                         // the stratopause: as warm as the ozone makes it
    const mid = z => z <= 51 ? Ttrop + (Tsp - Ttrop) * (stdT(z < 47 ? 11 + (z - zt) * 36 / (47 - zt) : z) - 216.65) / 54 : Tsp + oz * (stdT(z) - 270.65);
    const Tm = mid(84.852), Tinf = SUNA[p.sun], T110 = Tm + 53 * Tinf / 1000;
    const T = z => {
      if (z <= zt) return T0 - 6.5 * z;
      if (z <= 84.852) return mid(z);
      if (z <= 110) return Tm + (z - 84.852) * (T110 - Tm) / (110 - 84.852);
      return Tinf - (Tinf - T110) * Math.exp(-0.035 * (z - 110));       // Bates: the thermosphere climbs toward T∞
    };
    return { T, T0, zt, Ttrop };
  }
  function stdT(z) {                                                // the 1976 standard, K, geopotential km, to 84.852 km
    let T = 288.15;
    for (let i = 0; i < STD.length - 1; i++) {
      const [z0, lr] = STD[i], z1 = STD[i + 1][0];
      if (z <= z1) return T + lr * (z - z0);
      T += lr * (z1 - z0);
    }
    return T;
  }
  /* hydrostatic pressure: dP/dz = −Pg/(R_d T), integrated in 50 m steps */
  const PCACHE = {};
  function column(p) {
    const key = [p.lat, p.dTs, p.ozone, p.sun, p.P0].join('|');
    if (PCACHE[key]) return PCACHE[key];
    const pr = profile(p), dz = 0.05, n = Math.round(120 / dz) + 1, Tz = new Float64Array(n), Pz = new Float64Array(n);
    let P = (p.P0 || 1013.25) * 100;
    for (let i = 0; i < n; i++) {
      const z = i * dz; Tz[i] = pr.T(z); Pz[i] = P;
      const Tm = (pr.T(z) + pr.T(z + dz)) / 2;                      // heights are geopotential km, as the standard's are: g stays g₀
      P *= Math.exp(-G0 * dz * 1000 / (RD * Tm));
    }
    const out = { Tz, Pz, dz, n, at: z => { const f = clamp(z / dz, 0, n - 1.001), i = Math.floor(f), u = f - i; return { T: Tz[i] * (1 - u) + Tz[i + 1] * u, P: Pz[i] * Math.pow(Pz[i + 1] / Pz[i], u) }; }, pr };
    const keys = Object.keys(PCACHE); if (keys.length > 40) delete PCACHE[keys[0]];
    return (PCACHE[key] = out);
  }
  /* the layers' boundaries, found from the profile itself: where the temperature turns */
  /* a "-pause" is where cooling with height stops (tropopause, mesopause) or warming stops (stratopause) */
  function boundaries(C) {
    const out = [], T = C.Tz, dz = C.dz, sg = i => { const d = (T[i] - T[i - 1]) / dz; return d < -0.05 ? -1 : d > 0.05 ? 1 : 0; };
    let last = sg(1);
    for (let i = 2; i < C.n; i++) {
      const s = sg(i);
      if ((last === -1 && s >= 0) || (last === 1 && s <= 0)) out.push({ z: (i - 1) * dz, T: T[i - 1], kind: last === -1 ? 'cold' : 'warm' });
      last = s;
    }
    return out;
  }

  /* ============================================================
     PRESSURE — a barometer and a flask of air
     ============================================================ */
  const FLUIDS = { mercury: { name: 'mercury', rho: 13595.1, vap: () => 0.17, col: '#C8CCD2' }, water: { name: 'water', rho: 998.2, vap: Tc => es(Tc), col: '#8FC8EA' }, wine: { name: 'red wine', rho: 990, vap: Tc => es(Tc) * 1.15, col: '#8A1E3A' } };
  function stdP(zKm) { return column({ lat: 'mid', dTs: 0, ozone: 100, sun: 'average', P0: 1013.25 }).at(zKm).P; }
  function baroOf(p) {
    const P = stdP(p.alt / 1000) * (1 + p.wx / 1013.25), F = FLUIDS[p.fluid];
    const h = (P - F.vap(20)) / (F.rho * G0);                       // the column the air holds up, above the vapour that fills the "vacuum"
    const Tair = 288.15 - 6.5 * p.alt / 1000, rho = P / (RD * Tair);
    return { P, h, len: h / Math.cos(p.tilt * Math.PI / 180), rho, Tair, hand: P * 0.015 };
  }
  function flaskOf(p) {
    const B = baroOf(p), left = 1 - p.pump / 100;                    // the share of the air still in the flask
    return { mAir: B.rho * p.flask / 1000, mNow: B.rho * p.flask / 1000 * left, rho: B.rho };   // grams: kg/m³ × litres
  }

  /* ============================================================
     P, T AND ρ — a sealed gas syringe
     ============================================================ */
  const SYR = { cap: 100, A: 7.07e-4 };                            // mL; the barrel's bore (30 mm)
  function syrStart(p) {
    const n = (101325 * p.v0 * 1e-6) / (R * 293.15);              // sealed at 20 °C and one atmosphere
    const T = p.Tb + 273.15, Pout = p.pout * 1000;
    const g = { n, T, V: p.v0, P: 101325, t: 0, path: [] };
    syrEq(g, p, T, Pout);
    return g;
  }
  function syrEq(g, p, T, Pout) {
    if (p.clamp) { g.V = p.v0; g.P = g.n * R * T / (p.v0 * 1e-6); }
    else { g.P = Pout; g.V = clamp(g.n * R * T / Pout * 1e6, 5, 400); }
  }
  function syrStep(g, p, dt) {
    const Tb = p.Tb + 273.15, Pout = p.pout * 1000;
    g.T += (Tb - g.T) * (1 - Math.exp(-dt / 25));                  // the gas comes to the bath's temperature
    syrEq(g, p, g.T, Pout);
    g.t += dt;
    return g;
  }
  const syrRho = g => g.n * M_AIR / (g.V * 1e-6);                  // kg/m³

  /* ============================================================
     RISE — a hot-air balloon
     ============================================================ */
  const ENV = { cd: 0.5, U: 5.5, cp: 1005, tMax: 120 };              // drag; envelope heat loss W/(m²·K); fabric limit °C
  function atmT(p, z) { return p.Tg + 273.15 - 6.5 * z / 1000; }    // the day's air: its ground temperature, the standard lapse
  function atmP(p, z) { const T0 = p.Tg + 273.15; return 101325 * Math.pow(1 - 0.0065 * z / T0, G0 / (RD * 0.0065)); }
  const atmRho = (p, z) => atmP(p, z) / (RD * atmT(p, z));
  function balloonDims(V) { const r = Math.cbrt(3 * V / (4 * Math.PI)) * 1.05; return { r, A: 4.2 * r * r * Math.PI, front: Math.PI * r * r }; }
  function balStart(p) {
    /* the crew has filled the envelope with the fan and warmed it until it stands up: it starts just past lift-off (1.5 °C over the float temperature), or held at 115 °C if it never can */
    const Tf = tempToFloat(p, 0), B = { z: 0, v: 0, Tin: Math.min(ENV.tMax - 5, isFinite(Tf) ? Tf + 1.5 : ENV.tMax - 5) + 273.15, t: 0, fuel: 0, ground: true, over: false, hist: [] };
    return B;
  }
  function balRates(B, p) {
    const z = B.z, To = atmT(p, z), Po = atmP(p, z), ro = Po / (RD * To), ri = Po / (RD * B.Tin);
    const D = balloonDims(p.vol), lift = p.vol * (ro - ri) * G0, W = p.mass * G0;
    return { To, Po, ro, ri, lift, W, net: lift - W, D };
  }
  function balStep(B, p, dt) {
    const n = Math.max(1, Math.ceil(dt / 0.2)), h = dt / n;
    for (let k = 0; k < n; k++) {
      const Rt = balRates(B, p), D = Rt.D;
      // the air inside: the burner heats it, the envelope loses heat through its fabric
      const mIn = p.vol * Rt.ri, Q = p.burner * 1000 - ENV.U * D.A * (B.Tin - Rt.To);
      B.Tin += Q * h / (mIn * ENV.cp);
      if (B.Tin < Rt.To) B.Tin = Rt.To;
      if (B.Tin - 273.15 > ENV.tMax) B.over = true;
      // the whole balloon: buoyancy − weight − drag; it carries its own air and a share of the air it pushes aside
      const mTot = p.mass + mIn + 0.5 * p.vol * Rt.ro, drag = 0.5 * Rt.ro * ENV.cd * D.front * B.v * Math.abs(B.v);
      let a = (Rt.net - drag) / mTot;
      if (B.z <= 0 && a < 0 && B.v <= 0) { a = 0; B.v = 0; B.ground = true; } else B.ground = false;
      B.v += a * h; B.z = Math.max(0, B.z + B.v * h);
      B.t += h;
    }
    return B;
  }
  /* the inside temperature for lift to just equal weight, at height z (the float condition) */
  function tempToFloat(p, z) { const ro = atmRho(p, z), need = ro - p.mass / p.vol; return need > 0 ? atmP(p, z) / (RD * need) - 273.15 : Infinity; }
  function floatHeight(p, TinC) {                                   // where lift = weight for a fixed inside temperature (bisection)
    const f = z => p.vol * (atmRho(p, z) - atmP(p, z) / (RD * (TinC + 273.15))) - p.mass;
    if (f(0) <= 0) return 0;
    let lo = 0, hi = 12000; if (f(hi) > 0) return hi;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return lo;
  }

  /* ============================================================
     THE LAB — set-ups, the clock, the stage
     ============================================================ */
  const SETUPS = [
    { value: 'composition', label: 'Take a sample of air apart', teaches: ['D2.1'] },
    { value: 'layers', label: 'A rocket through the layers', teaches: ['D2.2'] },
    { value: 'pressure', label: 'The weight of the air: Torricelli’s barometer', teaches: ['D2.3'] },
    { value: 'ptrho', label: 'Squeeze, heat, seal: a syringe of gas', teaches: ['D2.4'] },
    { value: 'rise', label: 'Will the balloon fly?', teaches: ['D2.5'] }
  ];
  const BASE = {
    setup: 'composition', absorber: 'iron', vinegar: true, co2: 420, hum: 50, T: 20, cpLapse: 600, control: true,
    lat: 'mid', dTs: 0, ozone: 100, sun: 'average', probe: 30,
    alt: 0, wx: 0, fluid: 'mercury', tilt: 0, flask: 1000, pump: 0,
    v0: 50, Tb: 20, pout: 101.3, clamp: false,
    vol: 2800, mass: 600, burner: 420, Tg: 15, riseLapse: 20
  };
  const preset = o => Object.assign({}, BASE, o);
  const camKey = p => p.setup + (p.setup === 'pressure' ? '|' + (p.fluid === 'mercury' ? 'hg' : 'tall') : '');
  function homeOf(p, narrow) {
    const H = {
      composition: { theta: -1.78, phi: 0.34, dist: 0.44, target: [0.03, 0, 0.08] },
      pressure: p.fluid === 'mercury' ? { theta: -1.85, phi: 0.22, dist: 1.4, target: [0.08, 0, 0.42] } : { theta: -1.85, phi: 0.16, dist: 15, target: [0.4, 0, 5.2] },
      ptrho: { theta: -1.8, phi: 0.3, dist: 0.82, target: [0.04, 0, 0.22] },
      rise: { theta: -1.75, phi: 0.18, dist: 62, target: [0, 0, 14] }
    }[p.setup];
    if (!H) return null;
    return narrow ? Object.assign({}, H, { dist: H.dist * 1.3 }) : H;
  }
  function setup(S) {
    const p = S.p, home = homeOf(p, !!S._narrow);
    if (!home) { S.cam = null; S.camFor = camKey(p); }
    else if (!S.cam || S.camFor !== camKey(p)) {
      S.cam = Camera(Object.assign({ fov: 0.9 }, home, { target: home.target.slice() }));
      S.cam.minDist = home.dist * 0.4; S.cam.maxDist = home.dist * 3; S.camFor = camKey(p); S._narrowCam = !!S._narrow;
    }
    S.ta = 0; S.tc = 0;
    if (p.setup === 'composition') S.hist = [[0, 0]];
    if (p.setup === 'ptrho') { S.g = syrStart(p); S.hist = [[S.g.T, S.g.V, S.g.P]]; }
    if (p.setup === 'rise') { S.B = balStart(p); S.hist = [[0, 0, S.B.Tin - 273.15]]; }
  }
  const absTau = p => ABS[p.absorber].tau * (p.absorber === 'iron' && !p.vinegar ? 12 : 1);
  function absorbedNow(p, t) { if (p.absorber === 'candle') return candleState(p, t).rise; const A = air0(p), a = ABS[p.absorber], f = A.x[a.gas], tau = absTau(p) * Math.pow(2, -(p.T - 20) / 10); return f * (1 - Math.exp(-t / tau)); }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'composition') {
      S.tc += dt * p.cpLapse;
      if (S.tc - S.hist[S.hist.length - 1][0] >= (p.absorber === 'candle' ? 2 : 60)) S.hist.push([S.tc, absorbedNow(p, S.tc) * 100]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'ptrho') {
      syrStep(S.g, p, dt); const last = S.hist[S.hist.length - 1];
      if (Math.abs(S.g.T - last[0]) > 0.2 || Math.abs(S.g.V - last[1]) > 0.2) S.hist.push([S.g.T, S.g.V, S.g.P]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'rise') {
      if (S.B.t < 3600) balStep(S.B, p, dt * p.riseLapse);
      if (S.B.t - S.hist[S.hist.length - 1][0] >= 5) S.hist.push([S.B.t, S.B.z, S.B.Tin - 273.15]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    }
  }

  /* ---------------- helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const sig = (v, n) => { if (!isFinite(v)) return '∞'; if (v === 0) return '0'; const d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(Math.abs(v)))); return fmtN(v, Math.min(d, 6)); };
  const hhmm = s => Math.floor(s / 3600) + ' h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ' min';
  const pSay = Pa => Pa >= 100 ? fmtN(Pa / 100, Pa >= 10000 ? 0 : 1) + ' hPa' : Pa >= 1 ? sig(Pa, 3) + ' Pa' : sig(Pa * 1000, 3) + ' mPa';
  let G3 = null;
  function placeView(S, g, fx, fy) {
    const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = homeOf(S.p, S._narrow).target;
    cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy];
    cam.update();
  }
  function room(g) { const ctx = g.ctx, gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, '#1B2230'); gr.addColorStop(0.55, '#141A25'); gr.addColorStop(1, '#0C1018'); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h); }
  function drawLabels(g, cam, lab, xMax) {
    if (!g.labels) return;
    const ctx = g.ctx, K = kit(), boxes = [], narrow = g.w < K.NARROW;
    (narrow ? lab.slice(0, 3) : lab).forEach(([at, text, dx, dy, col]) => {
      const q = cam.project(at); if (!q.ok || q.x < 4 || q.x > xMax) return;
      const ey = clamp(q.y + dy * (narrow ? 0.6 : 1), K.HDR + (narrow ? 40 : 14), g.h - 34), ex = q.x + dx * (narrow ? 0.6 : 1);
      ctx.save(); ctx.font = mono(9.5, 600);
      const tw = ctx.measureText(text).width; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > xMax - 4) left = true;
      const t = K.fitText(ctx, text, Math.max(40, left ? ex - 9 : xMax - 9 - ex)), w2 = ctx.measureText(t).width, bx0 = left ? ex - 3 - w2 : ex + 3;
      let yy = ey; for (let k = 0; k < 6 && boxes.some(b => bx0 < b[2] && bx0 + w2 > b[0] && Math.abs(yy - b[1]) < 12); k++) yy += 13;
      boxes.push([bx0, yy, bx0 + w2]);
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, yy); ctx.stroke();
      ctx.fillStyle = 'rgba(210,222,240,.9)'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, TAU); ctx.fill();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.88)';
      ctx.strokeText(t, ex + (left ? -3 : 3), yy); ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), yy); ctx.restore();
    });
  }
  function cardRows(g, x, y, w, title, rows, o) {
    o = o || {};
    const ctx = g.ctx, K = kit(), lh = 15, h = 26 + rows.length * lh + (o.foot ? 26 : 6);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13);
    rows.forEach((r, i) => { const yy = y + 30 + i * lh; ctx.font = mono(9.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], w * 0.6), x + 9, yy); ctx.font = mono(9.5, 600); ctx.fillStyle = r[2] || '#F2F6FF'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], w * 0.38), x + w - 9, yy); });
    if (o.foot) { ctx.font = mono(8.5); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; K.wrapText(ctx, o.foot, x + 9, y + h - 20, w - 18, 11, 2); }
    ctx.restore();
    return h;
  }

  /* ---------------- composition ---------------- */
  function sampleNow(p, t) {                                       // what is in the cylinder: the absorbed gas removed
    if (p.absorber === 'candle') { const C = candleState(p, t); return { x: C.x, gone: C.rise }; }
    const A = air0(p), gas = ABS[p.absorber].gas, gone = absorbedNow(p, t), x = {};
    Object.keys(A.x).forEach(k => { x[k] = (k === gas ? A.x[k] - gone : A.x[k]) / (1 - gone); });
    return { x, gone };
  }
  const CYL = { r: 0.021, air: 100 };                              // mL of air trapped at the start
  function benchComposition(S, F, lab) {
    const p = S.p, gone = absorbedNow(p, S.tc), A = Math.PI * CYL.r * CYL.r, zw = 0.05, h0 = CYL.air * 1e-6 / A, top = zw + h0;
    MEAS.bench(F, -0.4, 0.4, -0.25, 0.25, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.4, 0.4, 0.25, 0, 0.5);
    const rows = p.control ? [[-0.07, true], [0.07, false]] : [[0, true]];
    rows.forEach(([x, live]) => {
      MEAS.beaker(F, [x, 0, 0], 0.055, 0.075, zw, { tint: '#BFE0F2' });
      const g2 = live ? gone : 0, zl = zw + g2 * CYL.air * 1e-6 / A;
      G3.liquid(F, [x, 0, 0], CYL.r - 0.001, zw - 0.02, zl, '#9CCBEA', { alpha: 0.5 });
      G3.glassHull(F, [x, 0, 0.012], [x, 0, top + 0.004], CYL.r + 0.002, CYL.r + 0.002, { bias: -0.03, tint: 'rgba(205,232,250,.16)', strong: true });
      R3.cylinder(F, [x, 0, top + 0.004], [x, 0, top + 0.008], CYL.r + 0.002, '#DCE8F0', { shadow: false });
      G3.scaleBoard(F, [x + CYL.r + 0.012, -0.004, zw], h0, { w: 0.012, step: h0 / 20, big: h0 / 4, font: 7, fmt: v => String(Math.round(100 - v / h0 * 100)) });
      if (live) {
        if (p.absorber === 'candle') {
          R3.cylinder(F, [x, 0, zl], [x, 0, zl + 0.004], 0.012, '#C8A060', { shadow: false });                      // a cork float
          R3.cylinder(F, [x, 0, zl + 0.004], [x, 0, zl + 0.03], 0.0055, '#F4EEDC', { shadow: false });               // the candle
          if (candleState(p, S.tc).burning) F.push([x, 0, zl + 0.04], () => { const q = F.cam.project([x, 0, zl + 0.038]); if (!q.ok) return; const ctx = F.ctx, r2 = 0.006 * q.s; const gg = ctx.createRadialGradient(q.x, q.y + r2 * 0.4, 0, q.x, q.y, r2 * 2.2); gg.addColorStop(0, 'rgba(255,250,220,1)'); gg.addColorStop(0.4, 'rgba(255,190,80,.9)'); gg.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(q.x, q.y, r2 * 0.9, r2 * 2.2, 0, 0, TAU); ctx.fill(); }, -0.06);
        } else if (p.absorber === 'iron') G3.ironWool(F, [x, 0, top - 0.012], CYL.r * 0.85, 0.016, clamp(gone / 0.2, 0, 1));
        else G3.granules(F, [x, 0, top - 0.018], CYL.r * 0.75, p.absorber === 'soda' ? '#EDEFE8' : '#F6F4EE');
        lab.push([[x - CYL.r, 0, zl], 'water risen ' + (g2 * CYL.air).toFixed(1) + ' mL', -40, 30, '#9FD4FF']);
        lab.push([[x, -CYL.r, top - 0.012], p.absorber === 'candle' ? 'a candle on a cork: does it use up the oxygen?' : ABS[p.absorber].name + ' takes out the ' + GASES.concat([{ k: 'H2O', name: 'water vapour' }]).find(q => q.k === ABS[p.absorber].gas).name, -30, -40]);
      } else lab.push([[x + CYL.r, 0, top - 0.02], 'control: nothing inside, level unchanged', 40, -30]);
    });
    BENCH.meter(F, [0.22, -0.12, 0.05], [0, -1, 0.35], 0.09, 0.045, { title: 'air', value: p.T.toFixed(0), unit: '°C', colour: '#FFC56B' });
  }
  /* a thousand molecules of the sample, each drawn as what it is: N₂ and O₂ pairs, a lone argon atom, CO₂ in a line, bent H₂O */
  const MCOL = { N2: '#7FA8E8', O2: '#FF7A6A', Ar: '#C9A0F0', CO2: '#4A4A4A', H2O: '#8FE0F0', Ne: '#FFB060', He: '#F0E080', CH4: '#90D090' };
  function counts(x, N) {
    const keys = Object.keys(x), raw = keys.map(k => x[k] * N), out = {}; let left = N;
    keys.forEach((k, i) => { out[k] = Math.floor(raw[i]); left -= out[k]; });
    keys.map((k, i) => [k, raw[i] - Math.floor(raw[i])]).sort((a, b) => b[1] - a[1]).slice(0, left).forEach(([k]) => out[k]++);
    return out;
  }
  function moleculeCard(S, g) {
    const p = S.p, K = kit(), W = g.w, at = K.cardSlot(g, S, '1,000 molecules', 270, { x: W - 280, y: K.HDR + 6 });
    if (!at) return;
    const ctx = g.ctx, x = at.x, y = at.y, w = at.w, Sm = sampleNow(p, S.tc), N = 1000, c = counts(Sm.x, N);
    const cols = 40, rows = 25, cw = (w - 20) / cols, ch = Math.min(cw, 8), h = 34 + rows * ch + 74;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('1,000 molecules in the cylinder', x + 9, y + 13);
    const order = ['N2', 'O2', 'Ar', 'H2O', 'CO2', 'Ne', 'He', 'CH4'], list = [];
    order.forEach(k => { for (let i = 0; i < (c[k] || 0); i++) list.push(k); });
    const rr = G3.rng(9); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }   // mixed, as air is
    list.forEach((k, i) => {
      const cx = x + 10 + (i % cols + 0.5) * cw, cy = y + 28 + (Math.floor(i / cols) + 0.5) * ch, r = ch * 0.24;
      ctx.fillStyle = MCOL[k];
      if (k === 'N2' || k === 'O2') { ctx.beginPath(); ctx.arc(cx - r * 0.6, cy, r, 0, TAU); ctx.arc(cx + r * 0.6, cy, r, 0, TAU); ctx.fill(); }
      else if (k === 'CO2') { ctx.fillStyle = '#FF7A6A'; ctx.beginPath(); ctx.arc(cx - r * 1.1, cy, r * 0.8, 0, TAU); ctx.arc(cx + r * 1.1, cy, r * 0.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A3A3A'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.stroke(); }
      else if (k === 'H2O') { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx - r * 0.8, cy + r * 0.6, r * 0.5, 0, TAU); ctx.arc(cx + r * 0.8, cy + r * 0.6, r * 0.5, 0, TAU); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(cx, cy, r * 1.15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.8; ctx.stroke(); }
    });
    const ly = y + 34 + rows * ch + 6;
    [['N2', 'nitrogen'], ['O2', 'oxygen'], ['Ar', 'argon'], ['H2O', 'water'], ['CO2', 'CO₂']].forEach(([k, nm], i) => {
      const cx = x + 12 + (i % 3) * (w - 20) / 3, cy = ly + Math.floor(i / 3) * 16;
      ctx.fillStyle = MCOL[k === 'CO2' ? 'O2' : k]; ctx.beginPath(); ctx.arc(cx + 4, cy, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C9D4EA'; ctx.font = mono(9); ctx.textAlign = 'left'; ctx.fillText(nm + ' ' + (c[k] || 0), cx + 12, cy);
    });
    ctx.fillStyle = '#98A6C6'; ctx.font = mono(8.5); K.wrapText(ctx, 'CO₂ at ' + p.co2 + ' ppm is ' + (p.co2 / 1000).toFixed(2) + ' molecules in a thousand: most cards show none. Find it in a sample of 10,000.', x + 9, ly + 38, w - 18, 11, 2);
    ctx.restore();
  }

  /* ---------------- layers: the column, painted ---------------- */
  const ZMAP = z => z <= 20 ? z / 20 * 0.36 : z <= 50 ? 0.36 + (z - 20) / 30 * 0.30 : 0.66 + (z - 50) / 70 * 0.34;   // compressed: the busy lower air gets room
  const ZMAP_INV = f => f <= 0.36 ? f / 0.36 * 20 : f <= 0.66 ? 20 + (f - 0.36) / 0.30 * 30 : 50 + (f - 0.66) / 0.34 * 70;
  function drawLayers(S, g) {
    const p = S.p, K = kit(), ctx = g.ctx, W = g.w, H = g.h, narrow = W < K.NARROW, C = column(p), bd = boundaries(C);
    const x0 = 12, x1 = narrow ? W - 52 : Math.min(W - 300, W * 0.64), y0 = K.HDR + (narrow ? 34 : 10), y1 = H - 30, yOf = z => y1 - ZMAP(z) * (y1 - y0);
    ctx.fillStyle = '#05070C'; ctx.fillRect(0, 0, W, H);
    // the sky at each height: blue where the air is thick, black where it is not
    for (let yy = y0; yy < y1; yy += 2) {
      const z = ZMAP_INV((y1 - yy) / (y1 - y0)), P = C.at(z).P, f = clamp(Math.pow(P / 101325, 0.35), 0, 1);
      ctx.fillStyle = 'rgb(' + Math.round(8 + 90 * f) + ',' + Math.round(10 + 150 * f) + ',' + Math.round(22 + 210 * f) + ')';
      ctx.fillRect(x0, yy, x1 - x0, 2.2);
    }
    // the ozone layer glows faintly with the UV it absorbs
    const oz = p.ozone / 100;
    if (oz > 0.02) { const ya = yOf(35), yb = yOf(15), gr = ctx.createLinearGradient(0, ya, 0, yb); gr.addColorStop(0, 'rgba(255,170,90,0)'); gr.addColorStop(0.5, 'rgba(255,170,90,' + (0.22 * oz).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = gr; ctx.fillRect(x0, ya, x1 - x0, yb - ya); }
    // the aurora at 100–120 km, green curtains
    for (let k = 0; k < 7; k++) { const xx = x0 + (x1 - x0) * (0.45 + k * 0.07), gr = ctx.createLinearGradient(0, yOf(120), 0, yOf(100)); gr.addColorStop(0, 'rgba(120,255,160,0)'); gr.addColorStop(0.7, 'rgba(120,255,160,' + (0.18 + 0.1 * Math.sin(S.ta + k)).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(120,255,160,0)'); ctx.fillStyle = gr; ctx.fillRect(xx, yOf(120), (x1 - x0) * 0.05, yOf(100) - yOf(120)); }
    // meteors burning up at 80–100 km
    ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) { const ph = (S.ta * 0.4 + k * 0.27) % 1, xx = x0 + (x1 - x0) * (0.15 + 0.2 * k), z = 100 - 20 * ph; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(xx + 30 * ph, yOf(z)); ctx.lineTo(xx + 30 * ph - 16, yOf(z + 4)); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // noctilucent clouds at 83 km
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = 'rgba(170,215,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); const yy = yOf(83) + k * 1.5; ctx.moveTo(x0 + (x1 - x0) * 0.05, yy); for (let xx = 0; xx <= 1; xx += 0.05) ctx.lineTo(x0 + (x1 - x0) * (0.05 + xx * 0.35), yy + Math.sin(xx * 20 + k) * 2); ctx.stroke(); }
    // the ground, a mountain, a thunderstorm reaching the tropopause
    ctx.fillStyle = '#2E3A28'; ctx.fillRect(x0, y1 - 3, x1 - x0, 3);
    const mx = x0 + (x1 - x0) * 0.16, mw = (x1 - x0) * 0.16, my = yOf(8.85);
    const mg = ctx.createLinearGradient(mx - mw, 0, mx + mw, 0); mg.addColorStop(0, '#5A5550'); mg.addColorStop(0.5, '#7A746C'); mg.addColorStop(1, '#3A3632');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(mx - mw, y1); ctx.lineTo(mx - mw * 0.35, my + (y1 - my) * 0.35); ctx.lineTo(mx - mw * 0.12, my + 6); ctx.lineTo(mx, my); ctx.lineTo(mx + mw * 0.2, my + 10); ctx.lineTo(mx + mw * 0.5, my + (y1 - my) * 0.45); ctx.lineTo(mx + mw, y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F2F6FA'; ctx.beginPath(); ctx.moveTo(mx - mw * 0.16, my + 9); ctx.lineTo(mx, my); ctx.lineTo(mx + mw * 0.16, my + 12); ctx.lineTo(mx + mw * 0.05, my + 7); ctx.closePath(); ctx.fill();
    const zt = C.pr.zt, cbx = x0 + (x1 - x0) * 0.42, GX = window.GEO;
    if (GX) { for (let k = 0; k < 6; k++) { const zz = 1.5 + k * (zt - 2) / 5, ww = 40 + 10 * k; GX.cloud(ctx, cbx, yOf(zz), ww, ww * 0.5, k + 3, 0.9, [245, 245, 248]); } GX.cloud(ctx, cbx + 30, yOf(zt) + 6, 170, 26, 9, 0.85, [240, 242, 248]); }
    // an airliner at its cruising height, a weather balloon, the rocket and its falling sphere
    const plane = (px, py, s) => { ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#E6EAF0'; ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 2.4 * s, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2 * s, 0); ctx.lineTo(4 * s, 9 * s); ctx.lineTo(7 * s, 9 * s); ctx.lineTo(4 * s, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-11 * s, 0); ctx.lineTo(-14 * s, -6 * s); ctx.lineTo(-12 * s, -6 * s); ctx.lineTo(-8 * s, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(-15 * s, 1 * s); ctx.lineTo(-60 * s, 3 * s); ctx.stroke(); ctx.restore(); };
    plane(x0 + (x1 - x0) * 0.72, yOf(11), 1.1);
    if (GX) GX.balloonGlyph(ctx, x0 + (x1 - x0) * 0.58, yOf(33), 7, S.ta);
    const rx = x0 + (x1 - x0) * 0.86, pz = clamp(p.probe, 0, 120), apo = Math.max(pz, 1);
    ctx.strokeStyle = 'rgba(255,230,190,.45)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(rx, y1 - 6); ctx.lineTo(rx, yOf(Math.min(120, apo + 8))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#C8CCD2'; ctx.beginPath(); ctx.moveTo(rx - 3, y1 - 4); ctx.lineTo(rx - 3, y1 - 18); ctx.lineTo(rx, y1 - 24); ctx.lineTo(rx + 3, y1 - 18); ctx.lineTo(rx + 3, y1 - 4); ctx.closePath(); ctx.fill();
    const sy = yOf(pz), at = C.at(pz);
    RX.ball(ctx, rx, sy, 6, '#E8ECF0', { rim: 0.7 });
    g.handle(rx, sy, 16, 'probe');
    // the layers, from the profile: their names and the heights where the temperature turns
    const nm = bd.length >= 3 ? [['troposphere', 0, bd[0].z], ['stratosphere', bd[0].z, bd[1].z], ['mesosphere', bd[1].z, bd[2].z], ['thermosphere', bd[2].z, 120]] : [['troposphere', 0, bd.length ? bd[0].z : 11], ['above: no ozone, no stratosphere', bd.length ? bd[0].z : 11, 120]];
    ctx.save(); ctx.font = sans(narrow ? 11 : 13, 700); ctx.textBaseline = 'middle';
    nm.forEach(([name, a, b], i) => {
      const ya = yOf(a), yb = yOf(b);
      if (i > 0) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, ya); ctx.stroke(); ctx.setLineDash([]); ctx.font = mono(9); ctx.fillStyle = '#E6EEF8'; ctx.textAlign = 'right'; ctx.fillText(['tropopause', 'stratopause', 'mesopause'][i - 1] + ' · ' + a.toFixed(1) + ' km · ' + (C.at(a).T - 273.15).toFixed(0) + ' °C', x1 - 6, ya - 7); ctx.font = sans(narrow ? 11 : 13, 700); }
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.textAlign = 'left'; ctx.fillText(name.toUpperCase(), x0 + 10, (ya + yb) / 2);
    });
    ctx.restore();
    // the height scale
    ctx.save(); ctx.font = mono(8.5); ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [0, 5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 120].forEach(z => { const yy = yOf(z); ctx.fillRect(x1, yy, 5, 1); ctx.fillText(z + ' km', x1 + 7, yy); });
    ctx.restore();
    G3.tag(ctx, rx - 14, sy, 'falling sphere · ' + pz.toFixed(0) + ' km · ' + (at.T - 273.15).toFixed(1) + ' °C · ' + pSay(at.P), '#FFE0A0', { align: 'right' });
    if (g.labels && !narrow) {
      G3.tag(ctx, mx + mw * 0.3, my - 10, 'Everest 8.8 km · ' + pSay(C.at(8.85).P), '#E6EEF8');
      G3.tag(ctx, x0 + (x1 - x0) * 0.72 + 20, yOf(11) + 14, 'airliner 11 km', '#E6EEF8');
      G3.tag(ctx, x0 + (x1 - x0) * 0.58 + 12, yOf(33), 'weather balloon bursts ~33 km', '#E6EEF8');
      if (oz > 0.02) G3.tag(ctx, x0 + (x1 - x0) * 0.3, yOf(24), 'ozone layer ×' + oz.toFixed(2), '#FFC890');
      G3.tag(ctx, x0 + (x1 - x0) * 0.1, yOf(90), 'meteors burn up', '#FFF0C8');
      if (p.probe < 95) G3.tag(ctx, x0 + (x1 - x0) * 0.45, yOf(112), 'aurora', '#A8FFC8');
    }
    if (!narrow) limbCard(S, g, x1 + 46, K.HDR + 8, W - x1 - 56, C);
  }
  /* the thin blue line: Earth's limb seen from orbit, with the atmosphere at true scale */
  function limbCard(S, g, x, y, w, C) {
    const ctx = g.ctx, K = kit(), h = Math.min(g.h - y - 40, w * 1.05);
    if (w < 150) return;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('From orbit, at true scale', x + 9, y + 13);
    const bx = x + 8, by = y + 24, bw = w - 16, bh = h - 60;
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.fillStyle = '#020308'; ctx.fillRect(bx, by, bw, bh);
    const Rpx = bw * 2.2, cx = bx + bw * 0.5, cy = by + bh * 0.52 + Rpx, km = Rpx / 6371;
    // the air, layer by layer, its glow following its density
    for (let z = 120; z >= 0; z -= 1) {
      const P = C.at(z).P, f = Math.pow(P / 101325, 0.3), col = z < (C.pr.zt) ? [200, 150 + 60 * f, 120 + 100 * f] : [70 + 60 * f, 120 + 120 * f, 230];
      ctx.fillStyle = 'rgba(' + col.map(Math.round).join(',') + ',' + clamp(0.08 + 0.9 * f, 0, 1).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(cx, cy, Rpx + z * km, 0, TAU); ctx.fill();
    }
    const eg = ctx.createRadialGradient(cx, cy - Rpx, 0, cx, cy - Rpx, bw); eg.addColorStop(0, '#2A5A8A'); eg.addColorStop(0.4, '#123A62'); eg.addColorStop(1, '#06182C');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, TAU); ctx.fill();
    const rr = G3.rng(5); ctx.fillStyle = 'rgba(240,244,250,.55)';
    for (let k = 0; k < 40; k++) { const a = -Math.PI / 2 + (rr() - 0.5) * 0.5, d = Rpx - rr() * bh * 0.4; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 + rr() * 14, 2 + rr() * 3, a + Math.PI / 2, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.font = mono(9); ctx.fillStyle = '#C9D4EA'; ctx.textBaseline = 'middle';
    K.wrapText(ctx, 'All the weather fits in the thin bright band: 100 km of air on a 6,371 km planet — thinner, for its size, than an apple’s skin.', x + 9, y + h - 28, w - 18, 11, 3);
    ctx.restore();
  }

  /* ---------------- pressure ---------------- */
  function benchPressure(S, F, lab) {
    const p = S.p, B = baroOf(p), Fl = FLUIDS[p.fluid], tall = p.fluid !== 'mercury', tube = B.h + (tall ? 0.6 : 0.12);
    MEAS.bench(F, -0.5, 0.6, -0.3, 0.3, { cabinet: '#A9B2BC' });
    if (tall) {                                                    // a stairwell wall, three storeys of it, as Pascal needed
      G3.face(F, [[-0.9, 0.32, 0], [1.4, 0.32, 0], [1.4, 0.32, tube + 0.6], [-0.9, 0.32, tube + 0.6]], '#6A6E78', { ambient: 0.55, bias: F.GROUND });
      for (let fl = 1; fl <= Math.floor((tube + 0.6) / 3.2); fl++) R3.box(F, [0.25, 0.25, fl * 3.2], [2.3, 0.14, 0.18], '#8A8F98', { shadow: false, ambient: 0.5 });
    } else MEAS.tileWall(F, -0.5, 0.6, 0.3, 0, 1.2);
    // the barometer: a dish of the liquid, a tube standing in it (tilted if you like), the column the air holds up
    const bx = -0.2, tl = p.tilt * Math.PI / 180, dir = [Math.sin(tl), 0, Math.cos(tl)];
    MEAS.beaker(F, [bx, 0, 0], tall ? 0.09 : 0.05, 0.05, 0.035, { tint: Fl.col, steel: false });
    const base = [bx, 0, 0.012], L = tube / Math.cos(tl) + 0.02, colL = B.len;
    G3.glassTube(F, [base, add3(base, dir, L)], tall ? 0.03 : 0.014, { inner: 0.82, fill: [{ from: 0, to: colL + 0.023 / Math.cos(tl), col: p.fluid === 'mercury' ? '#7E8894' : RX.rgba(Fl.col, 1), metal: p.fluid === 'mercury' }], bias: -0.05 });
    /* the board stands right behind the tube, so the column reads against wood, its zero at the dish's surface */
    G3.scaleBoard(F, [bx + (tall ? 0.045 : 0.022), 0.03, 0.035], tube - 0.03, tall ? { w: 0.12, step: 0.1, big: 1, font: 9, fmt: v => v.toFixed(0) + ' m' } : { w: 0.07, step: 0.01, big: 0.1, font: 8, fmt: v => Math.round(v * 1000) + ' mm' });
    const topAt = add3(base, dir, colL + 0.023 / Math.cos(tl));
    lab.push([topAt, Fl.name + ' column ' + (tall ? B.h.toFixed(2) + ' m' : (B.h * 1000).toFixed(0) + ' mm') + (p.tilt ? ' high (' + (B.len * (tall ? 1 : 1000)).toFixed(tall ? 2 : 0) + (tall ? ' m' : ' mm') + ' along the tube)' : ''), 40, -20, '#FFE0A0']);
    lab.push([add3(base, dir, L - 0.02), p.fluid === 'mercury' ? 'Torricelli vacuum: almost nothing' : 'not empty: ' + Fl.name + ' vapour, ' + (Fl.vap(20) / 1000).toFixed(1) + ' kPa', 40, 10]);
    if (!tall) {
      // the flask of air on the balance, and the pump that empties it
      const Fk = flaskOf(p), bal = MEAS.balance(F, [0.28, -0.02, 0], { text: (Fk.mNow + 180).toFixed(2) + ' g', settled: true });
      const rF = Math.cbrt(3 * p.flask * 1e-6 / (4 * Math.PI));
      const neck = G3.flask(F, [bal[0], bal[1], bal[2]], rF, { vacuum: p.pump / 100, open: false });
      G3.pump(F, [0.45, 0.08, 0], p.pump / 100);
      R3.tube(F, [neck, [neck[0] + 0.06, neck[1], neck[2] + 0.03], [0.45, 0.06, 0.2]], 0.004, '#2B2F36', { shadow: false });
      lab.push([[bal[0], bal[1] - rF, bal[2] + rF], p.flask + ' mL flask · air in it ' + Fk.mNow.toFixed(2) + ' g', 40, 40]);
      lab.push([[0.45, 0.08, 0.18], 'vacuum pump · ' + p.pump + ' % of the air out', 30, -40]);
    }
  }
  const add3 = (a, d, k) => [a[0] + d[0] * k, a[1] + d[1] * k, a[2] + d[2] * k];

  /* ---------------- ptrho ---------------- */
  function benchPtrho(S, F, lab) {
    const p = S.p, gs = S.g;
    MEAS.bench(F, -0.5, 0.5, -0.3, 0.3, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.5, 0.5, 0.3, 0, 0.8);
    const hp = MEAS.hotplate(F, [0, 0, 0.012], { top: p.Tb, set: p.Tb / 100, on: p.Tb > 25, hot: p.Tb > 45 });
    MEAS.beaker(F, [0, 0, hp.topZ], 0.06, 0.2, 0.17, { tint: '#BFE0F2', T: p.Tb, bubbles: p.Tb > 85 });
    const sy = G3.gasSyringe(F, [0, 0, hp.topZ + 0.012], { frac: gs.V / SYR.cap, cap: SYR.cap, len: 0.2 });
    if (p.clamp) BENCH.bossClamp(F, [0.0, 0.03, Math.max(hp.topZ + 0.27, sy.zP + 0.07)]);
    G3.bellJar(F, [0, 0, 0], 0.13, 0.58);
    G3.pump(F, [0.32, 0.12, 0], clamp((101.3 - p.pout) / 80, 0, 1));
    R3.tube(F, [[0.12, 0.08, 0.015], [0.32, 0.12, 0.02]], 0.004, '#2B2F36', { shadow: false });
    BENCH.meter(F, [-0.24, -0.16, 0.06], [0, -1, 0.35], 0.1, 0.05, { title: 'gas P', value: (gs.P / 1000).toFixed(1), unit: 'kPa', colour: '#7CF0B0' });
    BENCH.meter(F, [0.22, -0.18, 0.06], [0, -1, 0.35], 0.1, 0.05, { title: 'gas T', value: (gs.T - 273.15).toFixed(1), unit: '°C', colour: '#FFC56B' });
    lab.push([[0, -0.016, sy.zP - 0.02], 'sealed gas · ' + gs.V.toFixed(1) + ' mL', -50, -30, '#DCEEFF']);
    lab.push([[0, -0.06, hp.topZ + 0.1], 'water bath · ' + p.Tb + ' °C', -60, 40]);
    lab.push([[0.1, -0.08, 0.45], 'bell jar · air outside ' + p.pout.toFixed(1) + ' kPa', 40, -40]);
    if (p.clamp) lab.push([[0, 0.03, Math.max(hp.topZ + 0.27, sy.zP + 0.07)], 'plunger clamped: the volume cannot change', 40, -20]);
  }

  /* ---------------- rise: the balloon over a field ---------------- */
  let FIELD = null;
  function fieldBlock() {
    if (FIELD) return FIELD;
    const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
    FIELD = window.TERRAIN.block({ n: 36, size: 700, zBase: -40, height: (x, y) => 4 * Math.sin(x * 0.01) * Math.cos(y * 0.012) + 2 * hash(Math.floor(x / 60), Math.floor(y / 60)) });
    return FIELD;
  }
  function drawRise(S, g) {
    const p = S.p, K = kit(), ctx = g.ctx, W = g.w, narrow = W < K.NARROW, B = S.B, Rt = balRates(B, p), cam = S.cam, D = balloonDims(p.vol);
    const zb = B.z, sk = clamp(zb / 4000, 0, 1);
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, RX.mix(p.Tg < 5 ? '#6A88B8' : '#4C7EC0', '#1C3A78', sk)); gr.addColorStop(1, RX.mix(p.Tg < 5 ? '#F2D8B8' : '#BCD6EE', '#7AA0D0', sk)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    // the camera rides with the balloon
    const h0 = homeOf(p, S._narrow);
    cam.target = [h0.target[0], h0.target[1], h0.target[2] + zb]; cam.update();
    const k = cam.dist / cam._k, sx = (narrow ? 0 : 0.14) * W * k;
    cam.target = [cam.target[0] + cam.r[0] * sx, cam.target[1] + cam.r[1] * sx, cam.target[2] + cam.r[2] * sx]; cam.update();
    const Bk = fieldBlock(), T = window.TERRAIN;
    const items = []; const rr = G3.rng(21);
    for (let i = 0; i < 90; i++) { const x = -330 + rr() * 660, y = -330 + rr() * 660; if (Math.hypot(x, y) < 40) continue; items.push({ at: [x, y, Bk.zAt(x, y)], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(2, 14 * q.s), { kind: i % 3 ? 'broad' : 'conifer', seed: i }) }); }
    T.draw(ctx, cam, Bk, { cover: (i, j, x, y) => { const h = Math.sin(Math.floor(x / 90) * 3.1 + Math.floor(y / 90) * 1.7); return h > 0.3 ? [150, 170, 80] : h > -0.4 ? [96, 140, 64] : [180, 160, 96]; }, items, layers: [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }] });
    const F = R3.Frame(ctx, cam, { floorZ: null, ambient: 0.32 });
    const bb = G3.balloon(F, [0, 0, zb + 0.5], D.r, { flame: clamp(p.burner / 1000, 0, 1), t: S.ta, glow: clamp(p.burner / 1200, 0, 1) });
    F.render();
    const qf = cam.project([0, 0, zb + 2.6]); if (qf.ok) g.handle(qf.x, qf.y, 16, 'burner');
    if (g.labels) {
      const qe = cam.project([D.r, 0, bb.ctrZ]); if (qe.ok && !narrow) G3.tag(ctx, qe.x + 14, qe.y, 'envelope ' + fmtN(p.vol) + ' m³ · inside ' + (B.Tin - 273.15).toFixed(0) + ' °C', B.over ? '#FF9A8A' : '#FFE0A0');
      const qb = cam.project([0.6, 0, zb + 1]); if (qb.ok) G3.tag(ctx, narrow ? Math.min(qb.x + 14, W - 230) : qb.x + 14, qb.y + 10, 'basket, burner, people · ' + fmtN(p.mass) + ' kg', '#E6EEF8');
    }
    // the instruments: altimeter, variometer, envelope thermometer, lift
    const at = K.cardSlot(g, S, 'the pilot’s instruments', 240, { x: W - 250, y: K.HDR + 6 });
    if (at) cardRows(g, at.x, at.y, at.w, 'Instruments', [
      ['altimeter', fmtN(zb) + ' m', '#F2F6FF'], ['variometer', (B.v >= 0 ? '+' : '') + B.v.toFixed(1) + ' m/s', B.v > 0.2 ? '#7CF0B0' : B.v < -0.2 ? '#FF9A8A' : '#F2F6FF'],
      ['envelope air', (B.Tin - 273.15).toFixed(0) + ' °C', B.over ? '#FF6A5A' : '#FFC56B'], ['outside air', (Rt.To - 273.15).toFixed(1) + ' °C', '#8FC8FF'],
      ['ρ outside / inside', Rt.ro.toFixed(3) + ' / ' + Rt.ri.toFixed(3), '#C9D4EA'], ['lift − weight', fmtN(Rt.net / G0) + ' kg', Rt.net > 0 ? '#7CF0B0' : '#FF9A8A'], ['burner', p.burner + ' kW', '#FFD27A']],
      { foot: B.over ? 'Over 120 °C: the nylon weakens — the pilot must not burn this hard.' : 'Lift comes from the difference in density, not from the heat itself.' });
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = window.G6D;
    if (!K || !G3) return;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { const h = homeOf(p, S._narrow); if (h) { S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist }; } S._narrowCam = S._narrow; }
    if (p.setup === 'layers') { drawLayers(S, g); headerOf(S, g); return; }
    if (p.setup === 'rise') { drawRise(S, g); headerOf(S, g); return; }
    room(g);
    const narrow = S._narrow, cam = S.cam;
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 24 : 16);
    const F = R3.Frame(g.ctx, cam, { floorZ: 0, ambient: 0.3 }), lab = [];
    if (p.setup === 'composition') benchComposition(S, F, lab);
    else if (p.setup === 'pressure') benchPressure(S, F, lab);
    else benchPtrho(S, F, lab);
    F.render();
    drawLabels(g, cam, lab, narrow ? g.w : g.w - 285);
    if (p.setup === 'composition') moleculeCard(S, g);
    else if (p.setup === 'pressure') {
      const B = baroOf(p), at = K.cardSlot(g, S, 'what the air pushes', 250, { x: g.w - 260, y: K.HDR + 6 });
      if (at) cardRows(g, at.x, at.y, at.w, 'The air at ' + fmtN(p.alt) + ' m pushes', [
        ['on 1 cm²', (B.P / 1e4 / G0 * 1000).toFixed(0) + ' g of weight', '#FFE0A0'], ['on your hand (150 cm²)', fmtN(B.hand) + ' N', '#FFE0A0'], ['on a door (2 m²)', fmtN(B.P * 2 / 1000) + ' kN', '#FFE0A0'],
        ['holds up mercury', (B.P / (13595.1 * G0) * 1000).toFixed(0) + ' mm', '#C8CCD2'], ['holds up water', ((B.P - es(20)) / (998.2 * G0)).toFixed(2) + ' m', '#8FC8EA'], ['a litre of air weighs', B.rho.toFixed(3) + ' g', '#C9D4EA']],
        { foot: 'You do not feel it because the air inside you pushes back just as hard.' });
    } else {
      const gs = S.g, at = K.cardSlot(g, S, 'P, V, T and ρ', 240, { x: g.w - 250, y: K.HDR + 6 });
      if (at) cardRows(g, at.x, at.y, at.w, 'The gas in the syringe', [['amount n', (gs.n * 1000).toFixed(3) + ' mmol', '#F2F6FF'], ['pressure P', (gs.P / 1000).toFixed(1) + ' kPa', '#7CF0B0'], ['volume V', gs.V.toFixed(1) + ' mL', '#DCEEFF'], ['temperature T', (gs.T).toFixed(1) + ' K', '#FFC56B'], ['density ρ', syrRho(gs).toFixed(3) + ' kg/m³', '#C9D4EA'], ['PV ÷ nT', (gs.P * gs.V * 1e-6 / (gs.n * gs.T)).toFixed(3) + ' J/(mol·K)', '#C9D4EA']],
        { foot: 'PV ÷ nT stays at R = 8.314, whatever you do: that is the gas law.' });
    }
    headerOf(S, g);
  }
  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'probe') { const f = clamp(ZMAP(p.probe) - e.dy / 600, 0, 1); p.probe = Math.round(ZMAP_INV(f)); }
    else if (e.id === 'burner') p.burner = clamp(Math.round((p.burner - e.dy * 4) / 10) * 10, 0, 1200);
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function headerOf(S, g) {
    const p = S.p, K = kit(); let a = '', b = '', c = '';
    if (p.setup === 'composition') {
      const Sm = sampleNow(p, S.tc), gas = ABS[p.absorber].gas, nm = { O2: 'oxygen', CO2: 'carbon dioxide', H2O: 'water vapour' }[gas];
      a = p.absorber === 'candle' ? (candleState(p, S.tc).burning ? 'The candle burns — and goes out with ' + (Sm.x.O2 * 100).toFixed(1) + ' % oxygen still in the air' : 'The candle went out with ' + (Sm.x.O2 * 100).toFixed(1) + ' % oxygen left; the water climbs as the air cools') : 'The ' + ABS[p.absorber].name + ' has taken out ' + (Sm.gone * 100).toFixed(2) + ' % of the air: the ' + nm;
      b = 'nitrogen ' + (Sm.x.N2 * 100).toFixed(1) + ' % · oxygen ' + (Sm.x.O2 * 100).toFixed(1) + ' % · argon ' + (Sm.x.Ar * 100).toFixed(2) + ' % · CO₂ ' + fmtN(Sm.x.CO2 * 1e6) + ' ppm · water ' + (Sm.x.H2O * 100).toFixed(2) + ' %';
      c = hhmm(S.tc) + ' since the cylinder was set up · ×' + p.cpLapse + ' time-lapse · ' + p.T + ' °C';
    } else if (p.setup === 'layers') {
      const C = column(p), at = C.at(p.probe), bd = boundaries(C);
      a = 'At ' + p.probe + ' km: ' + (at.T - 273.15).toFixed(1) + ' °C and ' + pSay(at.P) + ' — ' + (100 * at.P / C.at(0).P).toFixed(at.P / C.at(0).P < 0.01 ? 3 : 1) + ' % of the air is above';
      b = LAT[p.lat].name + ' · surface ' + (C.at(0).T - 273.15).toFixed(1) + ' °C · ' + bd.map((q, i) => ['tropopause', 'stratopause', 'mesopause'][i] + ' ' + q.z.toFixed(1) + ' km').join(' · ');
      c = 'U.S. Standard Atmosphere 1976 · ozone ×' + (p.ozone / 100).toFixed(2) + ' · ' + p.sun + ' Sun: thermosphere toward ' + SUNA[p.sun] + ' K';
    } else if (p.setup === 'pressure') {
      const B = baroOf(p);
      a = 'At ' + fmtN(p.alt) + ' m the air holds up ' + (p.fluid === 'mercury' ? (B.h * 1000).toFixed(0) + ' mm' : B.h.toFixed(2) + ' m') + ' of ' + FLUIDS[p.fluid].name;
      b = 'pressure ' + fmtN(B.P / 100, 1) + ' hPa · h = P ÷ ρg · ρ_air ' + B.rho.toFixed(3) + ' kg/m³ · weather ' + (p.wx >= 0 ? '+' : '') + p.wx + ' hPa';
      c = p.tilt ? 'tube tilted ' + p.tilt + '°: the column is longer, its height the same' : 'the column’s height depends only on the pressure and the liquid';
    } else if (p.setup === 'ptrho') {
      const gs = S.g;
      a = p.clamp ? 'Clamped: the volume is fixed, so heating raises the pressure to ' + (gs.P / 1000).toFixed(1) + ' kPa' : 'The gas fills ' + gs.V.toFixed(1) + ' mL: its pressure matches the air outside, ' + (gs.P / 1000).toFixed(1) + ' kPa';
      b = 'n ' + (gs.n * 1000).toFixed(3) + ' mmol · T ' + (gs.T - 273.15).toFixed(1) + ' °C · density ' + syrRho(gs).toFixed(3) + ' kg/m³ · PV = nRT';
      c = 'sealed at 20 °C and 101.3 kPa · bath ' + p.Tb + ' °C · bell jar ' + p.pout + ' kPa';
    } else {
      const B = S.B, Rt = balRates(B, p);
      a = B.over ? 'Too hot: the envelope is above 120 °C' : B.ground ? (Rt.net > 0 ? 'Lift-off!' : 'Still on the ground: the hot air is not yet light enough') : B.v > 0.3 ? 'Climbing at ' + B.v.toFixed(1) + ' m/s: the warm air is less dense than the air around it' : B.v < -0.3 ? 'Sinking: the envelope has cooled' : 'Floating at ' + fmtN(B.z) + ' m, where lift equals weight';
      b = 'lift ' + fmtN(Rt.lift / G0) + ' kg · weight ' + fmtN(p.mass) + ' kg · inside ' + (B.Tin - 273.15).toFixed(0) + ' °C, outside ' + (Rt.To - 273.15).toFixed(1) + ' °C';
      c = Math.floor(B.t / 60) + ' min ' + Math.floor(B.t % 60) + ' s · ×' + p.riseLapse + ' · a ' + p.Tg + ' °C day · needs ' + tempToFloat(p, 0).toFixed(0) + ' °C inside to leave the ground';
    }
    K.header(g, a, b, c);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  const FLUID_BARS = [['mercury', 13595.1, 0.17, '#C8CCD2'], ['seawater', 1025, 2300, '#5FA8D8'], ['water', 998.2, 2339, '#8FC8EA'], ['red wine', 990, 2690, '#B03050'], ['olive oil', 911, 1, '#C8B040']];
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'composition' && p.absorber === 'candle') {
      const H = S.hist, tmax = Math.max(300, H[H.length - 1][0] * 1.15), A = air0(p), pts = [];
      for (let i = 0; i <= 120; i++) { const t = i / 120 * tmax; pts.push([t / 60, candleState(p, t).rise * 100]); }
      const Kk = K.plotKey(g, [{ c: '#9FD4FF', label: 'water risen, mL of 100' }, { c: '#FF8A7A', label: 'if all the oxygen were used', dash: [4, 3] }, { c: '#FFD66B', label: 'oxygen left in the cylinder, %', dash: [2, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: tmax / 60, ymin: 0, ymax: 25, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'mL · %', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const o2 = []; for (let i = 0; i <= 120; i++) { const t = i / 120 * tmax; o2.push([t / 60, candleState(p, t).x.O2 * 100]); }
      P.clip(() => { P.hline(A.x.O2 * 100, 'rgba(255,138,122,.7)', [4, 3]); P.line(o2, '#FFD66B', 1.6, [2, 3]); P.line(pts, 'rgba(159,212,255,.35)', 1.2, [2, 3]); P.line(H.map(q => [q[0] / 60, q[1]]), '#9FD4FF', 2.4); P.tag(tmax / 60, candleState(p, 1e6).rise * 100, 'rise ' + (candleState(p, 1e6).rise * 100).toFixed(1) + ' mL — mostly cooling', '#9FD4FF', 'right', -9); });
      Kk.draw(P); return;
    }
    if (p.setup === 'composition') {
      const H = S.hist, tmax = Math.max(3600, H[H.length - 1][0] * 1.15), A = air0(p), f = A.x[ABS[p.absorber].gas] * 100, tau = absTau(p) * Math.pow(2, -(p.T - 20) / 10);
      const Kk = K.plotKey(g, [{ c: '#9FD4FF', label: 'water risen, mL of 100' }, { c: '#FFD66B', label: 'all of the ' + ABS[p.absorber].gas.replace('2', '₂') + ' gone', dash: [4, 3] }]);
      const ym = Math.max(f * 1.25, 0.05), P = g.Plot({ xmin: 0, xmax: tmax / 3600, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'hours', ylabel: 'mL', xfmt: v => v.toFixed(tmax < 7200 ? 1 : 0), yfmt: v => v.toFixed(ym < 1 ? 2 : 0) }).frame();
      const ex = []; for (let i = 0; i <= 60; i++) { const t = i / 60 * tmax; ex.push([t / 3600, f * (1 - Math.exp(-t / tau))]); }
      P.clip(() => { P.hline(f, 'rgba(255,214,107,.7)', [4, 3]); P.tag(tmax / 3600, f, f.toFixed(ym < 1 ? 3 : 1) + ' mL', '#FFD66B', 'right', -8); P.line(ex, 'rgba(159,212,255,.35)', 1.2, [2, 3]); P.line(H.map(q => [q[0] / 3600, q[1]]), '#9FD4FF', 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'layers') {
      const C = column(p), Cs = column({ lat: 'mid', dTs: 0, ozone: 100, sun: 'average', P0: 1013.25 }), pts = [], ps = [];
      for (let z = 0; z <= 120; z += 0.5) { pts.push([C.at(z).T - 273.15, z]); ps.push([Cs.at(z).T - 273.15, z]); }
      const Kk = K.plotKey(g, [{ c: '#FF8A6A', label: 'this sky' }, { c: 'rgba(201,212,234,.6)', label: 'U.S. Standard Atmosphere', dash: [4, 3] }]);
      const P = g.Plot({ xmin: -120, xmax: Math.max(300, SUNA[p.sun] - 273 + 20), ymin: 0, ymax: 120, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { boundaries(C).forEach(q => P.hline(q.z, 'rgba(255,255,255,.18)', [3, 4])); P.vline(0, 'rgba(201,212,234,.25)', [2, 4]); P.line(ps, 'rgba(201,212,234,.5)', 1.4, [4, 3]); P.line(pts, '#FF8A6A', 2.4); const a = C.at(p.probe); P.dot(a.T - 273.15, p.probe, 5.5, '#FFE0A0', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'pressure') {
      const pts = []; for (let z = 0; z <= 9; z += 0.1) pts.push([z, stdP(z) / 100 * (1 + p.wx / 1013.25)]);
      const B = baroOf(p), Kk = K.plotKey(g, [{ c: '#7CF0B0', label: 'pressure, the standard atmosphere' + (p.wx ? ' ' + (p.wx > 0 ? '+' : '') + p.wx + ' hPa' : '') }]);
      const P = g.Plot({ xmin: 0, xmax: 9, ymin: 250, ymax: 1080, pad: { t: Kk.t }, xlabel: 'height above sea level, km', ylabel: 'hPa', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, '#7CF0B0', 2.4); [[1.609, 'Denver'], [3.64, 'La Paz'], [5.364, 'Everest base camp'], [8.849, 'Everest']].forEach(([z, n]) => { P.vline(z, 'rgba(201,212,234,.25)', [2, 4]); P.tag(z, 1040, n, '#AFC0D8', 'left', 0); }); P.dot(p.alt / 1000, B.P / 100, 5.5, '#FFE0A0', '#0B0F18'); P.tag(p.alt / 1000, B.P / 100, fmtN(B.P / 100) + ' hPa', '#FFE0A0', 'left', -10); });
      Kk.draw(P); return;
    }
    if (p.setup === 'ptrho') {
      const gs = S.g, H = S.hist, cl = p.clamp;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: cl ? 'pressure as the gas warms' : 'volume as the gas warms' }, { c: 'rgba(201,212,234,.6)', label: 'straight back to absolute zero', dash: [4, 3] }]);
      const ym = cl ? 160 : Math.max(120, gs.V * 1.3), P = g.Plot({ xmin: 0, xmax: 400, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'temperature, K', ylabel: cl ? 'kPa' : 'mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const k = cl ? gs.P / 1000 / gs.T : gs.V / gs.T;
      P.clip(() => { P.line([[0, 0], [400, 400 * k]], 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.vline(273.15, 'rgba(143,200,255,.35)', [2, 4]); P.tag(273.15, ym * 0.95, '0 °C', '#8FC8FF', 'left', 0); P.line(H.map(q => [q[0], cl ? q[2] / 1000 : q[1]]), '#FFC56B', 2.4); P.dot(gs.T, cl ? gs.P / 1000 : gs.V, 5.5, '#FFC56B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    const H = S.hist, tmax = Math.max(300, H[H.length - 1][0] * 1.15), zm = Math.max(500, ...H.map(q => q[1])) * 1.2;
    const Kk = K.plotKey(g, [{ c: '#7CF0B0', label: 'height' }, { c: '#FFC56B', label: 'envelope air, °C (right)', dash: [4, 3] }]);
    const P = g.Plot({ xmin: 0, xmax: tmax / 60, ymin: 0, ymax: zm, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'm', xfmt: v => v.toFixed(0), yfmt: v => fmtN(v) }).frame();
    P.clip(() => { P.line(H.map(q => [q[0] / 60, q[1]]), '#7CF0B0', 2.4); P.line(H.map(q => [q[0] / 60, q[2] / 150 * zm]), '#FFC56B', 1.6, [4, 3]); P.hline(120 / 150 * zm, 'rgba(255,106,90,.5)', [2, 4]); P.tag(tmax / 60, 120 / 150 * zm, '120 °C: fabric limit', '#FF9A8A', 'right', -8); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'composition') {
      const Kk = K.plotKey(g, [{ c: '#B8C0A0', label: 'CO₂ in the air (ice cores, then Mauna Loa)' }, { c: '#FFD66B', label: 'this sample', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 1700, xmax: 2030, ymin: 150, ymax: 1050, pad: { t: Kk.t }, xlabel: 'year', ylabel: 'ppm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(CO2_RECORD.filter(q => q[0] >= 1700), '#B8C0A0', 2.4); P.hline(190, 'rgba(143,200,255,.4)', [2, 4]); P.tag(1705, 190, 'ice ages: 190', '#8FC8FF', 'left', -8); P.hline(p.co2, 'rgba(255,214,107,.8)', [4, 3]); P.tag(1705, p.co2, p.co2 + ' ppm', '#FFD66B', 'left', -8); P.dot(2023, 421.1, 4, '#B8C0A0', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'layers') {
      const C = column(p), pts = []; for (let z = 0; z <= 120; z += 0.5) pts.push([Math.log10(C.at(z).P / 100), z]);
      const Kk = K.plotKey(g, [{ c: '#7CF0B0', label: 'pressure (log scale)' }], 'halves every ~5.5 km');
      const P = g.Plot({ xmin: -6, xmax: 3.1, ymin: 0, ymax: 120, pad: { t: Kk.t }, xlabel: 'hPa (log)', ylabel: 'height, km', xticks: [-6, -4, -2, 0, 1, 2, 3], xfmt: v => v === 0 ? '1' : v > 0 ? String(Math.pow(10, v)) : '10' + '⁻' + '⁰¹²³⁴⁵⁶'[-v], yfmt: v => v.toFixed(0) }).frame();
      const a = C.at(p.probe);
      P.clip(() => { P.line(pts, '#7CF0B0', 2.4); [[0.5, '50 % of the air above'], [0.1, '10 %'], [0.01, '1 %'], [0.001, '0.1 %']].forEach(([f, n]) => { const P0 = C.at(0).P / 100; P.vline(Math.log10(P0 * f), 'rgba(201,212,234,.25)', [2, 4]); P.tag(Math.log10(P0 * f), 112 - f * 20, n, '#AFC0D8', 'right', 0); }); P.dot(Math.log10(a.P / 100), p.probe, 5.5, '#FFE0A0', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'pressure') {
      const B = baroOf(p), Kk = K.plotKey(g, FLUID_BARS.map(f => ({ c: f[3], box: true, label: f[0] })), 'h = (P − p_vapour) ÷ ρg');
      const P = g.Plot({ xmin: -0.6, xmax: FLUID_BARS.length - 0.4, ymin: 0, ymax: 13, pad: { t: Kk.t }, xticks: [], ylabel: 'column the air holds up, m', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => FLUID_BARS.forEach((f, i) => { const h = (B.P - f[2]) / (f[1] * G0); P.bar(i, h, 0.34, 0, f[3]); P.tag(i, h, h < 1 ? (h * 1000).toFixed(0) + ' mm' : h.toFixed(2) + ' m', '#F2F6FF', 'center', -8); }));
      Kk.draw(P); return;
    }
    if (p.setup === 'ptrho') {
      const gs = S.g, Kk = K.plotKey(g, [[273.15, '#8FC8FF'], [293.15, '#7CF0B0'], [353.15, '#FFC56B']].map(([T, c]) => ({ c, label: (T - 273.15).toFixed(0) + ' °C' })).concat([{ c: '#FFFFFF', dot: true, label: 'the gas now' }]), 'Boyle: PV constant');
      const P = g.Plot({ xmin: 0, xmax: 200, ymin: 0, ymax: 200, pad: { t: Kk.t }, xlabel: 'volume, mL', ylabel: 'pressure, kPa', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { [[273.15, '#8FC8FF'], [293.15, '#7CF0B0'], [353.15, '#FFC56B']].forEach(([T, c]) => { const pts = []; for (let V = 8; V <= 200; V += 2) pts.push([V, gs.n * R * T / (V * 1e-6) / 1000]); P.line(pts, c, 1.8); }); P.dot(gs.V, gs.P / 1000, 6, '#FFFFFF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    const temps = [p.Tg - 15, p.Tg, p.Tg + 15], cols = ['#8FC8FF', '#FFC56B', '#FF8A6A'];
    const Kk = K.plotKey(g, temps.map((t, i) => ({ c: cols[i], label: 'a ' + t + ' °C day', w: i === 1 ? 3 : 1.6 })).concat([{ c: '#E6EEF8', label: 'weight', dash: [4, 3] }]));
    const P = g.Plot({ xmin: 20, xmax: 140, ymin: 0, ymax: Math.max(1600, p.mass * 1.4), pad: { t: Kk.t }, xlabel: 'air inside, °C', ylabel: 'lift at the ground, kg', xfmt: v => v.toFixed(0), yfmt: v => fmtN(v) }).frame();
    P.clip(() => {
      temps.forEach((t, i) => { const q = Object.assign({}, p, { Tg: t }), pts = []; for (let T = 20; T <= 140; T += 2) pts.push([T, Math.max(0, p.vol * (atmRho(q, 0) - atmP(q, 0) / (RD * (T + 273.15))))]); P.line(pts, cols[i], i === 1 ? 2.6 : 1.4, i === 1 ? null : [4, 3]); });
      P.hline(p.mass, 'rgba(230,238,248,.7)', [4, 3]); P.vline(120, 'rgba(255,106,90,.5)', [2, 4]);
      const Tin = S.B.Tin - 273.15; P.dot(Tin, Math.max(0, p.vol * (atmRho(p, 0) - atmP(p, 0) / (RD * S.B.Tin))), 5.5, '#FFC56B', '#FFFFFF');
    });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'composition') {
      const Sm = sampleNow(p, S.tc), A = air0(p);
      return [
        { label: 'Water risen = gas taken', value: (Sm.gone * 100).toFixed(2), unit: 'mL', flag: 'accent', hint: 'of 100 mL of air' },
        { label: 'Nitrogen', value: (A.x.N2 * 100).toFixed(2), unit: '%' },
        { label: 'Oxygen', value: (A.x.O2 * 100).toFixed(2), unit: '%' },
        { label: 'Argon', value: (A.x.Ar * 100).toFixed(3), unit: '%' },
        { label: 'Carbon dioxide', value: fmtN(A.x.CO2 * 1e6), unit: 'ppm', hint: (A.x.CO2 * 100).toFixed(3) + ' %' },
        { label: 'Water vapour', value: (A.x.H2O * 100).toFixed(2), unit: '%', hint: 'changes with the weather' },
        { label: 'Mean molar mass', value: A.M.toFixed(2), unit: 'g/mol' },
        { label: 'Density ρ = PM/RT', value: A.rho.toFixed(3), unit: 'kg/m³', hint: 'damp air is lighter' }
      ];
    }
    if (p.setup === 'layers') {
      const C = column(p), a = C.at(p.probe), rho = a.P / (RD * a.T);
      return [
        { label: 'Probe height', value: String(p.probe), unit: 'km', flag: 'accent' },
        { label: 'Temperature', value: (a.T - 273.15).toFixed(1), unit: '°C' },
        { label: 'Pressure', value: pSay(a.P), unit: '' },
        { label: 'Air above it', value: a.P / C.at(0).P < 1e-4 ? (100 * a.P / C.at(0).P).toExponential(2) : (100 * a.P / C.at(0).P).toPrecision(3), unit: '%' },
        { label: 'Density ρ = P/RT', value: rho < 1e-3 ? rho.toExponential(2) : sig(rho, 3), unit: 'kg/m³' },
        { label: 'Tropopause', value: (boundaries(C)[0] || { z: 0 }).z.toFixed(1), unit: 'km', hint: (C.at((boundaries(C)[0] || { z: 0 }).z).T - 273.15).toFixed(0) + ' °C' },
        { label: 'Surface', value: (C.at(0).T - 273.15).toFixed(1), unit: '°C' },
        { label: 'Thermosphere at 120 km', value: (C.at(120).T - 273.15).toFixed(0), unit: '°C', hint: 'hot, but almost no air' }
      ];
    }
    if (p.setup === 'pressure') {
      const B = baroOf(p), Fk = flaskOf(p), r = [
        { label: 'Pressure', value: fmtN(B.P / 100, 1), unit: 'hPa', flag: 'accent' },
        { label: 'Column h = P/ρg', value: p.fluid === 'mercury' ? (B.h * 1000).toFixed(1) : B.h.toFixed(3), unit: p.fluid === 'mercury' ? 'mm' : 'm' },
        { label: 'Along the tube', value: p.fluid === 'mercury' ? (B.len * 1000).toFixed(1) : B.len.toFixed(3), unit: p.fluid === 'mercury' ? 'mm' : 'm', hint: p.tilt ? 'tilted ' + p.tilt + '°' : 'upright' },
        { label: 'Air density', value: B.rho.toFixed(3), unit: 'kg/m³' },
        { label: 'Push on a hand', value: fmtN(B.hand), unit: 'N' }
      ];
      if (p.fluid === 'mercury') r.push({ label: 'Air in the flask', value: Fk.mNow.toFixed(3), unit: 'g', hint: 'full: ' + Fk.mAir.toFixed(3) + ' g' }, { label: 'Mass lost pumping', value: (Fk.mAir - Fk.mNow).toFixed(3), unit: 'g', flag: p.pump > 0 ? 'ok' : null });
      return r;
    }
    if (p.setup === 'ptrho') {
      const gs = S.g;
      return [
        { label: 'Volume V', value: gs.V.toFixed(1), unit: 'mL', flag: p.clamp ? null : 'accent' },
        { label: 'Pressure P', value: (gs.P / 1000).toFixed(1), unit: 'kPa', flag: p.clamp ? 'accent' : null },
        { label: 'Temperature T', value: (gs.T - 273.15).toFixed(1), unit: '°C', hint: gs.T.toFixed(1) + ' K' },
        { label: 'Density ρ = m/V', value: syrRho(gs).toFixed(3), unit: 'kg/m³' },
        { label: 'Amount n (sealed)', value: (gs.n * 1000).toFixed(3), unit: 'mmol' },
        { label: 'PV ÷ nT', value: (gs.P * gs.V * 1e-6 / (gs.n * gs.T)).toFixed(3), unit: 'J/(mol·K)', hint: 'R = 8.314' }
      ];
    }
    const B = S.B, Rt = balRates(B, p);
    return [
      { label: 'Height', value: fmtN(B.z), unit: 'm', flag: 'accent' },
      { label: 'Climb', value: B.v.toFixed(2), unit: 'm/s' },
      { label: 'Air inside', value: (B.Tin - 273.15).toFixed(0), unit: '°C', flag: B.over ? 'crit' : null },
      { label: 'Lift V(ρout − ρin)g', value: fmtN(Rt.lift / G0), unit: 'kg' },
      { label: 'Weight', value: fmtN(p.mass), unit: 'kg' },
      { label: 'Lift − weight', value: fmtN(Rt.net / G0), unit: 'kg', flag: Rt.net > 0 ? 'ok' : 'warn' },
      { label: 'Needed to leave the ground', value: tempToFloat(p, 0).toFixed(0), unit: '°C' },
      { label: 'Float height at 100 °C', value: fmtN(floatHeight(p, 100)), unit: 'm' }
    ];
  }
  function equation(S) {
    const p = S.p;
    if (p.setup === 'composition') { const A = air0(p); return 'ρ = <i>PM</i>/<i>RT</i> = 101,325 Pa × ' + (A.M / 1000).toFixed(5) + ' kg/mol ÷ (8.314 × ' + (p.T + 273.15).toFixed(2) + ' K) = <b>' + A.rho.toFixed(3) + ' kg/m³</b> · oxygen = <b>' + (A.x.O2 * 100).toFixed(2) + ' %</b>'; }
    if (p.setup === 'layers') { const C = column(p), a = C.at(p.probe); return '<i>dP</i>/<i>dz</i> = −ρ<i>g</i> = −<i>Pg</i>/<i>R</i><sub>d</sub><i>T</i>, integrated up from ' + fmtN(C.at(0).P / 100, 1) + ' hPa: at ' + p.probe + ' km <i>P</i> = <b>' + pSay(a.P) + '</b>, <i>T</i> = <b>' + (a.T - 273.15).toFixed(1) + ' °C</b>'; }
    if (p.setup === 'pressure') { const B = baroOf(p), F = FLUIDS[p.fluid]; return '<i>h</i> = (<i>P</i> − <i>p</i><sub>vap</sub>) ÷ ρ<i>g</i> = (' + fmtN(B.P, 0) + ' − ' + F.vap(20).toFixed(F.vap(20) < 1 ? 2 : 0) + ') Pa ÷ (' + fmtN(F.rho, 1) + ' × 9.807) = <b>' + (p.fluid === 'mercury' ? (B.h * 1000).toFixed(1) + ' mm' : B.h.toFixed(3) + ' m') + '</b>'; }
    if (p.setup === 'ptrho') { const gs = S.g; return '<i>PV</i> = <i>nRT</i>: ' + (gs.P / 1000).toFixed(1) + ' kPa × ' + gs.V.toFixed(1) + ' mL = ' + (gs.n * 1000).toFixed(3) + ' mmol × 8.314 × ' + gs.T.toFixed(1) + ' K → <b>' + (p.clamp ? 'P = ' + (gs.P / 1000).toFixed(1) + ' kPa' : 'V = ' + gs.V.toFixed(1) + ' mL') + '</b>'; }
    const B = S.B, Rt = balRates(B, p); return '<i>L</i> = <i>V</i>(ρ<sub>out</sub> − ρ<sub>in</sub>)<i>g</i> = ' + fmtN(p.vol) + ' m³ × (' + Rt.ro.toFixed(3) + ' − ' + Rt.ri.toFixed(3) + ') kg/m³ = <b>' + fmtN(Rt.lift / G0) + ' kg</b> against <b>' + fmtN(p.mass) + ' kg</b> → ' + (Rt.net > 0 ? 'rises' : 'stays down');
  }
  const EQ_NOTE = S => ({
    composition: '<b>The iron wool takes only the oxygen</b>, so the water climbs to replace exactly that share. A burning candle under a jar is not the same test: it goes out with about 16 % oxygen still left, and the air it heated shrinks as it cools — the water rise there is mostly temperature, not oxygen.',
    layers: '<b>Heights are geopotential</b>, as the 1976 Standard defines them (within 1 % of metres below 50 km). The layers are named by the temperature, not the composition: the air is the same mixture up to about 85 km. The ozone slider scales the stratosphere’s warming — the model does not compute the ozone chemistry.',
    pressure: '<b>Only the height matters</b>, not the tube’s width or tilt — that is how Torricelli knew the air, not the tube, held the column. A water barometer is short of 10.33 m because water evaporates into its “vacuum” and pushes down.',
    ptrho: '<b>PV = nRT is the whole story for a sealed gas.</b> Charles’s line runs back to −273.15 °C, absolute zero. Real air near room conditions follows it within 0.1 %; the plunger’s friction, which the model leaves out, is what a real syringe fights.',
    rise: '<b>Lift comes from a difference of densities</b>, which is why balloonists fly at dawn: cold, dense air outside gives the same lift with a cooler envelope. The model keeps the envelope’s volume fixed and the burner’s heat steady; real pilots blast in pulses.'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = v => S => S.p.setup === v;
  L.register({
    id: 'g6d-atmosphere',
    grade: 6, unit: '6D', topics: ['D2'],
    subject: 'earth',
    name: 'The Atmosphere Column',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-6 (foundation)', 'NGSS MS-PS1-4', 'CAST'],
    weight: 'Core',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the view · drag the falling sphere up and down · drag the burner’s flame',
    lede: 'Five experiments on the air itself. Trap 100 mL of air over water with <b>damp iron wool</b> and watch the water climb as the oxygen rusts away. Send a <b>falling sphere</b> up on a rocket and read the temperature to 120 km — then take the ozone away and see the stratosphere go cold. ' +
      'Stand <b>Torricelli’s</b> tube in mercury, water or wine and carry it up a mountain; weigh a flask of air and pump it empty. Heat and squeeze a <b>sealed syringe</b> until PV = nRT is what the meters say, and fly a <b>hot-air balloon</b> on a cold morning and a hot afternoon.',

    params: preset({}),
    presets: [
      { name: 'Iron wool in 100 mL of air', params: preset({}) },
      { name: 'Iron wool without vinegar: a slow day', params: preset({ vinegar: false, cpLapse: 3600 }) },
      { name: 'Soda lime takes the CO₂: can you see it?', params: preset({ absorber: 'soda', cpLapse: 60 }) },
      { name: 'A drying tube on a humid day', params: preset({ absorber: 'dry', hum: 90, T: 30, cpLapse: 60 }) },
      { name: 'Ice-age air, 190 ppm', params: preset({ co2: 190 }) },
      { name: 'The candle trap: does it use up the oxygen?', params: preset({ absorber: 'candle', cpLapse: 60 }) },
      { name: 'The standard atmosphere', params: preset({ setup: 'layers' }) },
      { name: 'No ozone: no warm stratosphere', params: preset({ setup: 'layers', ozone: 0, probe: 40 }) },
      { name: 'Over the tropics', params: preset({ setup: 'layers', lat: 'tropics', probe: 17 }) },
      { name: 'An active Sun', params: preset({ setup: 'layers', sun: 'active', probe: 110 }) },
      { name: 'Torricelli at sea level', params: preset({ setup: 'pressure' }) },
      { name: 'The barometer on Everest', params: preset({ setup: 'pressure', alt: 8849 }) },
      { name: 'Pascal’s water barometer', params: preset({ setup: 'pressure', fluid: 'water' }) },
      { name: 'Tilt the tube', params: preset({ setup: 'pressure', tilt: 45 }) },
      { name: 'Weigh a flask, then pump it empty', params: preset({ setup: 'pressure', flask: 5000, pump: 90 }) },
      { name: 'Heat the syringe to 80 °C', params: preset({ setup: 'ptrho', Tb: 80 }) },
      { name: 'Up a 3,000 m mountain', params: preset({ setup: 'ptrho', pout: 70.1 }) },
      { name: 'Clamp it, then heat it', params: preset({ setup: 'ptrho', clamp: true, Tb: 80 }) },
      { name: 'Ice bath', params: preset({ setup: 'ptrho', Tb: 0 }) },
      { name: 'Dawn launch, 5 °C', params: preset({ setup: 'rise', Tg: 5 }) },
      { name: 'A hot afternoon, 35 °C', params: preset({ setup: 'rise', Tg: 35 }) },
      { name: 'Too heavy to fly', params: preset({ setup: 'rise', mass: 1200 }) },
      { name: 'Burning too hard', params: preset({ setup: 'rise', burner: 1100 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The sample', when: is('composition'), items: [
        { key: 'absorber', type: 'select', label: 'In the cylinder', restructure: true, options: Object.keys(ABS).map(k => ({ value: k, label: ABS[k].name })) },
        { key: 'vinegar', type: 'toggle', label: 'Iron wool washed in vinegar', restructure: true, when: S => S.p.absorber === 'iron' },
        { key: 'control', type: 'toggle', label: 'A control cylinder beside it', restructure: true, display: true },
        { key: 'co2', label: 'CO₂ in the air', min: 180, max: 1000, step: 10, unit: 'ppm', restructure: true },
        { key: 'hum', label: 'Humidity', min: 0, max: 100, step: 5, unit: '%', restructure: true },
        { key: 'T', label: 'Room', min: 5, max: 35, step: 1, unit: '°C', restructure: true },
        { key: 'cpLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 60, label: 'a minute a second' }, { value: 600, label: '10 minutes a second' }, { value: 3600, label: 'an hour a second' }] } ] },
      { group: 'The sky', when: is('layers'), items: [
        { key: 'lat', type: 'select', label: 'Where', restructure: true, options: [{ value: 'tropics', label: 'tropics' }, { value: 'mid', label: 'mid-latitudes' }, { value: 'polar', label: 'polar' }] },
        { key: 'dTs', label: 'Surface warmer by', min: -20, max: 20, step: 1, unit: 'K', restructure: true },
        { key: 'ozone', label: 'Ozone', min: 0, max: 150, step: 5, unit: '% of today', restructure: true },
        { key: 'sun', type: 'select', label: 'The Sun', restructure: true, options: [{ value: 'quiet', label: 'quiet' }, { value: 'average', label: 'average' }, { value: 'active', label: 'active' }] },
        { key: 'probe', label: 'Falling sphere at', min: 0, max: 120, step: 1, unit: 'km', restructure: true } ] },
      { group: 'The barometer', when: is('pressure'), items: [
        { key: 'fluid', type: 'select', label: 'Liquid', restructure: true, options: Object.keys(FLUIDS).map(k => ({ value: k, label: FLUIDS[k].name })) },
        { key: 'alt', label: 'Height above sea level', min: 0, max: 9000, step: 50, unit: 'm', restructure: true },
        { key: 'wx', label: 'Weather', min: -50, max: 40, step: 1, unit: 'hPa', restructure: true },
        { key: 'tilt', label: 'Tilt the tube', min: 0, max: 60, step: 1, unit: '°', restructure: true } ] },
      { group: 'The flask on the balance', when: S => S.p.setup === 'pressure' && S.p.fluid === 'mercury', items: [
        { key: 'flask', label: 'Flask', min: 250, max: 5000, step: 250, unit: 'mL', restructure: true },
        { key: 'pump', label: 'Pump out', min: 0, max: 100, step: 5, unit: '% of the air', restructure: true } ] },
      { group: 'The syringe', when: is('ptrho'), items: [
        { key: 'v0', label: 'Sealed at 20 °C with', min: 10, max: 90, step: 5, unit: 'mL', restructure: true },
        { key: 'Tb', label: 'Water bath', min: 0, max: 95, step: 1, unit: '°C', restructure: false },
        { key: 'pout', label: 'Air in the bell jar', min: 20, max: 110, step: 0.5, unit: 'kPa', restructure: false, fmt: v => v.toFixed(1) },
        { key: 'clamp', type: 'toggle', label: 'Clamp the plunger', restructure: true } ] },
      { group: 'The balloon', when: is('rise'), items: [
        { key: 'vol', label: 'Envelope', min: 600, max: 6000, step: 100, unit: 'm³', restructure: true },
        { key: 'mass', label: 'Everything it carries', min: 200, max: 1500, step: 10, unit: 'kg', restructure: true },
        { key: 'burner', label: 'Burner, average', min: 0, max: 1200, step: 10, unit: 'kW', restructure: false },
        { key: 'Tg', label: 'Air at the ground', min: -10, max: 40, step: 1, unit: '°C', restructure: true },
        { key: 'riseLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 5, label: '×5' }, { value: 20, label: '×20' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ composition: 'Water climbing into the cylinder', layers: 'Temperature against height', pressure: 'Pressure against height', ptrho: S.p.clamp ? 'Pressure against temperature' : 'Volume against temperature', rise: 'The flight' })[S.p.setup], draw: plot1 },
      { title: S => ({ composition: 'CO₂ in the air since 1700', layers: 'Pressure against height', pressure: 'What the air holds up, liquid by liquid', ptrho: 'Pressure against volume: Boyle’s curves', rise: 'Lift against the air inside' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · analysing data', params: preset({ hum: 0 }),
        q: 'Damp iron wool rusts in an upturned cylinder holding 100 mL of dry air over water. When it stops, how many millilitres has the water risen?',
        predict: { label: 'Water risen', unit: 'mL', tol: 0.02 },
        measure: S => air0(S.p).x.O2 * 100,
        working: 'Rusting takes only the oxygen, 20.9 % of dry air by volume: the water climbs <b>20.9 mL</b> — about a fifth. The other 79 mL (nitrogen and argon) are untouched.' },
      { source: 'CAST pattern · air has mass', params: preset({ hum: 0, T: 20 }),
        q: 'A classroom is 5 m × 4 m × 3 m. Dry air at 20 °C and 1013 hPa has a density of ρ = PM/RT. What mass of air fills the room?',
        predict: { label: 'Air in the room', unit: 'kg', tol: 0.02 },
        measure: S => air0(S.p).rho * 60,
        working: 'ρ = 101,325 × 0.02897 ÷ (8.314 × 293.15) = 1.204 kg/m³; 60 m³ × 1.204 = <b>72 kg</b> — about as much as an adult.' },
      { source: 'U.S. Standard Atmosphere · the lapse rate', params: preset({ setup: 'layers', probe: 11 }),
        q: 'The ground is at 15 °C and the air cools 6.5 °C for every kilometre up. What is the temperature at the tropopause, 11 km up?',
        predict: { label: 'Tropopause', unit: '°C', tol: 0.02 },
        measure: S => column(S.p).at(11).T - 273.15,
        working: '15 − 6.5 × 11 = 15 − 71.5 = <b>−56.5 °C</b>. Above it the air stops cooling: ozone absorbing ultraviolet warms the stratosphere.' },
      { source: 'CAST pattern · a model of the atmosphere', params: preset({ setup: 'layers', probe: 5.5 }),
        q: 'Pressure halves roughly every 5.5 km. What share of the atmosphere’s air lies above 5.5 km?',
        predict: { label: 'Air above', unit: '%', tol: 0.03 },
        measure: S => 100 * column(S.p).at(5.5).P / column(S.p).at(0).P,
        working: 'Pressure is the weight of the air above. At 5.5 km it is 505 hPa, half of 1013: <b>50 %</b> of the air is above you — and half below, in the lowest 5.5 km.' },
      { source: 'Pascal, 1647 · a water barometer', params: preset({ setup: 'pressure', fluid: 'water' }),
        q: 'At sea level (101,325 Pa) and 20 °C, water’s vapour fills the top of the tube at 2.34 kPa. How tall a water column does the air hold up? (ρ = 998 kg/m³)',
        predict: { label: 'Water column', unit: 'm', tol: 0.02 },
        measure: S => baroOf(S.p).h,
        working: 'h = (101,325 − 2,339) ÷ (998.2 × 9.807) = <b>10.11 m</b> — three storeys. Mercury, 13.6 times denser, needs only 760 mm.' },
      { source: 'CAST pattern · pressure and height', params: preset({ setup: 'pressure', alt: 1609 }),
        q: 'Denver is 1,609 m up, where the standard atmosphere gives 834 hPa. How high does a mercury barometer read there?',
        predict: { label: 'Mercury column', unit: 'mm', tol: 0.02 },
        measure: S => baroOf(S.p).h * 1000,
        working: 'h = 83,430 Pa ÷ (13,595 × 9.807) = <b>626 mm</b>, against 760 at the sea: a sixth of the air is below Denver.' },
      { source: 'Boyle’s law · a sealed bag up a mountain', params: preset({ setup: 'ptrho', pout: 70.1 }),
        q: '50 mL of air is sealed at sea level (101.3 kPa). At 3,000 m the air pushes with 70.1 kPa. At the same temperature, what is its volume?',
        predict: { label: 'Volume', unit: 'mL', tol: 0.02 },
        measure: S => syrStart(S.p).V,
        working: 'P₁V₁ = P₂V₂: 50 × 101.3 ÷ 70.1 = <b>72 mL</b>. That is why a sealed crisp packet swells on a mountain road.' },
      { source: 'Charles’s law · warm a gas', params: preset({ setup: 'ptrho', Tb: 80 }),
        q: '50 mL of gas at 20 °C is warmed to 80 °C at constant pressure. What is its new volume?',
        predict: { label: 'Volume', unit: 'mL', tol: 0.02 },
        measure: S => syrStart(S.p).V,
        working: 'V ∝ T in kelvin: 50 × 353.15 ÷ 293.15 = <b>60.2 mL</b>. The same mass in a bigger volume: the warm gas is less dense — the start of why warm air rises.' },
      { source: 'CAST pattern · density and buoyancy', params: preset({ setup: 'rise', vol: 2800, Tg: 15 }),
        q: 'A 2,800 m³ balloon is heated to 100 °C on a 15 °C day at sea level. Air outside is 1.225 kg/m³; inside, ρ falls as 1/T. How many kilograms can it lift?',
        predict: { label: 'Lift', unit: 'kg', tol: 0.02 },
        measure: S => S.p.vol * (atmRho(S.p, 0) - atmP(S.p, 0) / (RD * 373.15)),
        working: 'ρ_in = 1.225 × 288.15 ÷ 373.15 = 0.946 kg/m³; 2,800 × (1.225 − 0.946) = <b>781 kg</b> — envelope, basket, burner, fuel and people together.' },
      { source: 'CAST pattern · why warm air rises', params: preset({ setup: 'rise', vol: 2800, mass: 600, Tg: 15 }),
        q: 'The balloon and everything it carries weigh 600 kg. How warm must the air inside be for it to leave the ground on a 15 °C day?',
        predict: { label: 'Air inside', unit: '°C', tol: 0.02 },
        measure: S => tempToFloat(S.p, 0),
        working: 'It needs ρ_in = 1.225 − 600 ÷ 2,800 = 1.011 kg/m³, so T_in = 1.225 × 288.15 ÷ 1.011 = 349 K = <b>76 °C</b>. On a 35 °C afternoon it would need about 99 °C.' }
    ],

    walkthrough: [
      { title: 'What is air made of?', ask: 'The iron wool rusts in 100 mL of air. Will the water rise all the way to the top?', reveal: 'No — about 21 mL. Rust takes only the oxygen; four-fifths of the air is nitrogen, with a little argon, and they stay.', params: preset({ hum: 0, cpLapse: 3600 }) },
      { title: 'Can you see the CO₂?', ask: 'Soda lime takes out the carbon dioxide. How far will the water rise this time?', reveal: 'About 0.04 mL — too little to see. CO₂ is 420 parts per million; small as it is, it controls how much heat the air holds.', params: preset({ absorber: 'soda', cpLapse: 60 }) },
      { title: 'Where does it stop getting colder?', ask: 'Move the falling sphere up from the ground. Does the air keep cooling as you rise?', reveal: 'Only to the tropopause, about 11 km here. Then it warms again — ozone absorbs the Sun’s ultraviolet in the stratosphere — then cools, then warms far up where the thin gas absorbs the Sun’s hardest rays.', params: preset({ setup: 'layers', probe: 30 }) },
      { title: 'Take the ozone away', ask: 'Set the ozone to zero. What happens to the stratosphere?', reveal: 'Its warmth vanishes — the temperature stays at the tropopause’s all the way up. The stratosphere is defined by that warming, and the warming is the ozone’s.', params: preset({ setup: 'layers', ozone: 0, probe: 40 }) },
      { title: 'What holds the mercury up?', ask: 'Tilt the tube. Does the mercury’s height change?', reveal: 'No: the column gets longer along the tube, but its height stays 760 mm. The air pushing on the dish holds it up, and only height measures that push.', params: preset({ setup: 'pressure', tilt: 45 }) },
      { title: 'Does air weigh anything?', ask: 'Pump the air out of a 5 L flask on the balance. Does the reading change?', reveal: 'Yes — by about 5.5 g at 90 % pumped. A litre of air has a mass of about 1.2 g.', params: preset({ setup: 'pressure', flask: 5000, pump: 90 }) },
      { title: 'Why does warm air rise?', ask: 'Heat the syringe. Does the gas get heavier, lighter, or neither?', reveal: 'Neither — the same mass. But it takes more room, so it is less dense. Less dense air is pushed up by the denser air around it: a balloon, a thermal, a cloud.', params: preset({ setup: 'ptrho', Tb: 80 }) },
      { title: 'Dawn or afternoon?', ask: 'Fly the same balloon at 5 °C and at 35 °C. Which needs the hotter envelope?', reveal: 'The afternoon. Lift depends on the difference in density; cold dense air outside gives more lift for the same envelope temperature. Pilots fly at dawn.', params: preset({ setup: 'rise', Tg: 5 }) }
    ],

    quiz: [
      { q: 'The two gases that make up about 99 % of dry air are', options: ['nitrogen and oxygen', 'oxygen and carbon dioxide', 'nitrogen and carbon dioxide', 'oxygen and water vapour'], answer: 0, why: '78 % nitrogen and 21 % oxygen. CO₂ is 0.04 %. Watch the water rise only a fifth in the iron-wool cylinder.' },
      { q: 'In the troposphere, going up a mountain, the air usually', options: ['gets colder', 'gets warmer', 'stays the same temperature', 'gets denser'], answer: 0, why: 'About 6.5 °C colder each kilometre, because the ground warms the air from below. Above the tropopause that stops.' },
      { q: 'A mercury barometer reads less on a mountain because', options: ['there is less air above pushing down', 'the mercury is colder', 'gravity is weaker there', 'the tube is shorter'], answer: 0, why: 'Air pressure is the weight of the air above. Climb, and there is less of it.' },
      { q: 'A sealed bag of air is heated. Its', options: ['mass stays the same and its density falls', 'mass goes up', 'density goes up', 'volume falls'], answer: 0, why: 'Nothing gets in or out, so the mass is fixed; the gas expands, so it is less dense.' },
      { q: 'A hot-air balloon rises because', options: ['the air inside is less dense than the air outside', 'heat rises by itself', 'the burner pushes it up', 'hot air has no weight'], answer: 0, why: 'Lift = V(ρ_out − ρ_in)g. Heat matters only by lowering the density inside.' }
    ],

    notes: '<p><b>Composition.</b> Dry air is 78.08 % nitrogen, 20.95 % oxygen, 0.93 % argon and 0.04 % carbon dioxide, with traces of neon, helium and methane; water vapour adds 0 to 4 %, depending on the weather. The mixture is the same up to about 85 km.</p>' +
      '<p><b>Layers.</b> Named by temperature: the troposphere cools upward (heated from the ground; all the weather); the stratosphere warms (ozone absorbs ultraviolet); the mesosphere cools; the thermosphere heats to hundreds of degrees (absorbing the Sun’s X-rays), though its air is so thin it would not warm you.</p>' +
      '<p><b>Pressure.</b> The weight of the air above: 101.3 kPa at sea level, half that at 5.5 km. A barometer measures it as the height of a liquid the air can hold up — 760 mm of mercury.</p>' +
      '<p><b>P, T and ρ.</b> For a fixed amount of gas, PV = nRT. Heat it and it expands (at fixed pressure) or pushes harder (at fixed volume); either way warm air is less dense than cold air at the same pressure.</p>' +
      '<p><b>Why warm air rises.</b> Less dense air is pushed up by denser air around it, as a cork is by water: lift = V(ρ_out − ρ_in)g.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Heat rises.” Heat does not rise; warm <b>air</b> is pushed up because it is less dense than the air around it. With no denser air around — in orbit — a candle flame is round. And “air weighs nothing”: a litre has a mass of 1.2 g, and the air on your hand pushes with 1,500 N.</div>'
  });


  L.models = L.models || {};
  L.models['g6d-atmosphere'] = { GASES, airOf, air0, absorbed, ABS, CANDLE, candleState, CO2_RECORD, STD, stdT, profile, column, boundaries, LAT, SUNA,
    FLUIDS, stdP, baroOf, flaskOf, SYR, syrStart, syrStep, syrRho, ENV, atmT, atmP, atmRho, balloonDims, balStart, balRates, balStep, tempToFloat, floatHeight, R, RD, M_AIR };
})(window.InsightLab);
