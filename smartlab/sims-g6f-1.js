/* ============================================================
   GRADE 6 · UNIT F · GLOBAL WARMING AND HUMAN IMPACT
   6F-1  Earth's Energy Balance — Sunlight In, Heat Out
   (F1 Earth's climate system; F3 Causes: human activities and natural factors)

   Six experiments, one planet, every number computed:
     budget     — the planet's books: sunlight in, sunlight reflected by each part
                  of the climate system, heat radiated to space; the surface
                  warms until the two balance (F1.1, F1.2).
     tyndall    — Tyndall's 1859 tube: radiant heat from a cube of boiling water
                  through a tube of gas, measured by a thermopile. Nitrogen and
                  oxygen let it through; CO₂, methane, water vapour do not (F3.1, F1.3).
     jars       — the classroom jar demonstration and Wood's 1909 test: what a
                  sealed jar under a lamp really measures (F1.3).
     feedback   — a planet in latitude bands (Budyko, Sellers, North): ice that
                  reflects, water vapour that traps, clouds, winds and currents
                  carrying heat poleward; push it and watch the ice line move,
                  or tip it into a snowball (F1.4, F1.5).
     causes     — 1750 to 2023: every recorded emission and natural change,
                  through the carbon cycle, the gases' chemistry and a two-layer
                  ocean, against the measured warming (F3.2, F3.3, F3.4).
     timescales — an eruption, the Sun's cycle, a pulse of CO₂, an orbit: how
                  long each change lasts and how fast it warms (F3.5).
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.EARTH, TERRAIN, MEAS, R3, G6F, KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ART = () => window.G6F;
  const SIG = 5.670374e-8, YR = 3.15576e7;
  const lerpT = (T, y) => { if (y <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const [a, va] = T[i - 1], [b, vb] = T[i]; return va + (vb - va) * (y - a) / (b - a); } return T[T.length - 1][1]; };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }

  /* ============================================================
     BUDGET — a zero-dimensional planet with a grey atmosphere
     Sunlight: Q = S₀/4 spread over the sphere. Reflected: each part of the
     climate system has its own albedo — open ocean 0.06, forest 0.13, desert
     0.35, ice and snow 0.65 — seen through clear air (Rayleigh 0.065, two-way
     transmission 0.62) or under cloud (0.32 + 0.3 of the surface's). Out:
     one grey layer of emissivity ε radiating up and down at its own radiative
     balance, OLR = (1 − ε/2)σT⁴. Clouds add to ε as well as to the albedo; CO₂
     adds 5.35 ln(C/280) W/m² of trapping at today's cloud; water vapour, when
     it follows the temperature, adds 1.3 W/m² per kelvin (AR6, with lapse rate).
     Calibrated once: 280 ppm, 67 % cloud, 6 % ice → 287 K. What comes out
     unfitted is CERES's planet: albedo 0.29, clear-sky albedo 0.15, a cloud
     effect of −48 W/m² in sunlight and +28 in heat, and the 255 K of a planet
     with no infrared absorbers.
     ============================================================ */
  const BUD = { T0: 287.0, C0: 280, c0: 0.67, i0: 0.06, epsC: 0.542, kC: 0.0436, kWV: 0.0106, aOcean: 0.06, aIce: 0.65, ray: 0.065, t2: 0.62,
    LAND: { forest: 0.13, today: 0.20, crops: 0.18, desert: 0.35 } };
  function albedoOf(o) {
    const i = clamp(o.ice, 0, 1), oc = 0.71 * (1 - i), l = 0.29 * (1 - i), aL = BUD.LAND[o.land] || BUD.LAND.today;
    const as = oc * BUD.aOcean + l * aL + i * BUD.aIce, clr = BUD.ray + BUD.t2 * as, cld = 0.32 + 0.3 * as, c = clamp(o.cloud, 0, 1);
    return { as, clr, cld, ap: c * cld + (1 - c) * clr, parts: { ocean: oc * BUD.aOcean, land: l * aL, ice: i * BUD.aIce }, oc, l, i };
  }
  const EG0 = (() => {
    const a = albedoOf({ ice: BUD.i0, cloud: BUD.c0, land: 'today' }), asr = 1361 / 4 * (1 - a.ap), e = 2 * (1 - asr / (SIG * Math.pow(BUD.T0, 4)));
    return 1 - (1 - e) / (1 - BUD.c0 * BUD.epsC);
  })();
  function epsOf(o, T) {
    if (o.air === 'none') return { eg: 0, e: 0 };
    const eg = clamp(EG0 + BUD.kC * Math.log(o.co2 / BUD.C0) + (o.wv ? BUD.kWV * (T - BUD.T0) : 0), 0, 0.995);
    return { eg, e: 1 - (1 - eg) * (1 - clamp(o.cloud, 0, 1) * BUD.epsC) };
  }
  function fluxes(o, T) {
    const Q = o.S0 / 4, A = albedoOf(o), E = epsOf(o, T), sT4 = SIG * Math.pow(T, 4);
    const asr = Q * (1 - A.ap), olr = (1 - E.e / 2) * sT4, olrClr = (1 - E.eg / 2) * sT4;
    const reflCloud = Q * clamp(o.cloud, 0, 1) * A.cld, reflClear = Q * (1 - clamp(o.cloud, 0, 1)) * A.clr;
    return { Q, A, E, asr, olr, olrClr, N: asr - olr, sT4, G: sT4 - olr, Te: Math.pow(olr / SIG, 0.25),
      reflected: Q * A.ap, reflCloud, reflClear, cloudSW: -Q * (A.ap - A.clr), cloudLW: olrClr - olr,
      window: (1 - E.e) * sT4, airOut: olr - (1 - E.e) * sT4 };
  }
  function budgetEq(o) {
    let lo = 120, hi = 420;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (fluxes(o, m).N > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const heatCap = h => 1025 * 3990 * h * 0.71;           // J/m²/K: the ocean's mixed layer, over 71 % of the planet
  function budgetStep(B, o, dtYr) {
    const n = Math.max(1, Math.ceil(dtYr / 0.05)), h = dtYr / n, C = heatCap(o.mix);
    for (let k = 0; k < n; k++) { const f = fluxes(o, B.T); B.T += f.N * h * YR / C; B.t += h; }
    return B;
  }

  /* ============================================================
     TYNDALL'S TUBE — which gases stop radiant heat
     A blackened cube of hot water radiates a Planck spectrum. Each gas
     absorbs only in its own bands; within a band the absorbed share grows as
     the square root of the amount (strong, pressure-broadened lines), so it
     saturates — and more gas then widens the band's wings, which is why CO₂'s
     warming grows with the logarithm of its amount. Windows of rock salt pass
     the thermal infrared to 16 µm; glass stops everything past 2.7 µm.
     Band strengths k are per atmosphere-metre, chosen so Tyndall's own ratio
     holds: at an inch of mercury, nitrous oxide absorbs about twice what
     carbonic acid does (1860 against 972 in his 1861 table).
     ============================================================ */
  const GASES = {
    N2: { name: 'nitrogen', f: 'N₂', bands: [], RE: 0, tau: null, gwp: 0, col: '#9FB4D8' },
    O2: { name: 'oxygen', f: 'O₂', bands: [], RE: 0, tau: null, gwp: 0, col: '#8FD4FA' },
    Ar: { name: 'argon', f: 'Ar', bands: [], RE: 0, tau: null, gwp: 0, col: '#C3B8F0' },
    CO2: { name: 'carbon dioxide', f: 'CO₂', bands: [[14.0, 16.4, 5.5], [4.2, 4.45, 9], [2.65, 2.8, 0.25]], RE: 1.33e-5, tau: null, gwp: 1, tgppb: 7.81, col: '#FFD66B' },
    CH4: { name: 'methane', f: 'CH₄', bands: [[7.25, 8.1, 7.5], [3.2, 3.45, 3.5]], RE: 5.7e-4, tau: 11.8, gwp: 27.0, tgppb: 2.78, col: '#9FE0B8' },
    N2O: { name: 'nitrous oxide', f: 'N₂O', bands: [[7.35, 8.25, 12], [4.4, 4.62, 30], [8.45, 8.85, 8], [3.85, 3.97, 12], [16.6, 17.3, 26]], RE: 3.2e-3, tau: 109, gwp: 273, tgppb: 7.53, col: '#FF9E7A' },
    H2O: { name: 'water vapour', f: 'H₂O', bands: [[5.2, 7.6, 3.2], [2.55, 2.95, 2.2], [1.82, 1.95, 0.6], [17, 30, 3]], RE: null, tau: 0.025, gwp: null, col: '#7FC8F8' },
    CFC12: { name: 'CFC-12', f: 'CCl₂F₂', bands: [[8.4, 9.4, 260], [10.4, 11.4, 300]], RE: 0.32, tau: 102, gwp: 12500, tgppb: 21.4, col: '#E59BF0' }
  };
  const GAS_KEYS = Object.keys(GASES);
  const WINDOW_CUT = { salt: 16.0, glass: 2.7, none: 30 };
  /* Planck's law, energy per unit wavelength (µm), any units: only shares are used */
  const planck = (um, T) => { const l = um * 1e-6; return 1 / (Math.pow(l, 5) * (Math.exp(1.4388e-2 / (l * T)) - 1)); };
  const PL_CACHE = {};
  function spectrum(Tc) {
    const key = Math.round(Tc * 10); if (PL_CACHE[key]) return PL_CACHE[key];
    const T = Tc + 273.15, out = []; let tot = 0;
    for (let um = 0.5; um <= 40; um += 0.05) { const b = planck(um, T); out.push([um, b]); tot += b * 0.05; }
    return (PL_CACHE[key] = { pts: out, tot, T });
  }
  /* the share of a band absorbed by u atm·m of the gas */
  const bandA = (k, u) => u > 0 ? 1 - Math.exp(-Math.sqrt(k * u)) : 0;
  function tube(o) {      // o: gas, p (atm), len (m), src (°C), win
    const g = GASES[o.gas], sp = spectrum(o.src), cut = WINDOW_CUT[o.win] || 16, u = o.p * o.len;
    let through = 0, absorbed = 0; const perBand = g.bands.map(() => 0);
    sp.pts.forEach(([um, b]) => {
      if (um > cut) return;
      let a = 0; g.bands.forEach((bd, j) => { if (um >= bd[0] && um <= bd[1]) { const aj = bandA(bd[2], u); perBand[j] += aj * b * 0.05; a = 1 - (1 - a) * (1 - aj); } });
      through += b * 0.05; absorbed += a * b * 0.05;
    });
    const reach = through / sp.tot;
    return { reach, frac: through > 0 ? absorbed / through : 0, absorbed: absorbed / sp.tot, perBand: perBand.map(v => through > 0 ? v / through : 0), u };
  }
  /* the thermopile: Tyndall's galvanometer swing ∝ the radiation stopped, for a source of 100 °C */
  const thermopile = o => { const t = tube(o), P = SIG * Math.pow(o.src + 273.15, 4) - SIG * Math.pow(293.15, 4); return { ...t, mV: 0.055 * P * t.reach * (1 - t.frac) / 100, deflect: t.frac * 90 * clamp(t.reach / 0.5, 0, 1) }; };
  /* absolute global warming potential over H years: a kilogram's forcing, integrated */
  const AGWP_CO2_100 = 8.95e-14;
  function gwpOf(key, H) {
    const g = GASES[key]; if (!g.tau || !g.tgppb) return g.gwp;
    const re = g.RE / (g.tgppb * 1e9), agwp = re * g.tau * (1 - Math.exp(-H / g.tau));
    return agwp / (AGWP_CO2_100 * (H === 100 ? 1 : H / 100));
  }

  /* ============================================================
     THE JARS — what a sealed jar under a lamp measures
     Three nodes: the black card at the bottom, the air (or gas) in the jar,
     and the jar's wall and lid. The card is heated by the lamp; it loses heat
     by convection to the gas and by radiation — part absorbed by the gas (its
     band emissivity at the card's temperature), part by the wall (glass is
     opaque past 2.7 µm, rock salt passes it), the rest straight out. The gas
     and the wall radiate back. An open jar also loses its warm gas to the
     room by convection (the plume out of the mouth, ∝ ΔT^1.5).
     ============================================================ */
  const JAR = { A: 0.0133, Ap: 0.03, Aw: 0.075, path: 0.22, Cb: 60, Cw: 520, Ca: 4.2, hb: 6, hw: 2, ho: 4, eb: 0.95, room: 20, kv: 0.1 };
  const LAMP = { W: 100, eta: 0.12 };
  const lampI = (d, W) => (W || LAMP.W) * 0.8 / (TAU * d * d * 0.25 * 4);       // W/m² from a reflector lamp at d m (a quarter-sphere beam)
  const EPS_CACHE = {};
  function gasEps(gas, Tk, u) {         // emissivity of a gas column at temperature Tk, amount u atm·m (cached by half-kelvin)
    const key = gas + '|' + Math.round(Tk * 2) + '|' + u; if (EPS_CACHE[key] != null) return EPS_CACHE[key];
    return (EPS_CACHE[key] = gasEps0(gas, Math.round(Tk * 2) / 2, u));
  }
  function gasEps0(gas, Tk, u) {
    if (gas === 'air') return epsMix([['CO2', 0.00042 * u], ['H2O', 0.01 * u]], Tk);
    if (gas === 'co2') return epsMix([['CO2', u], ['H2O', 0.01 * u]], Tk);
    if (gas === 'humid') return epsMix([['CO2', 0.00042 * u], ['H2O', 0.03 * u]], Tk);
    return 0;
  }
  function epsMix(list, Tk) {
    const sp = spectrum(Tk - 273.15); let a = 0;
    sp.pts.forEach(([um, b]) => { let t = 1; list.forEach(([k, u]) => GASES[k].bands.forEach(bd => { if (um >= bd[0] && um <= bd[1]) t *= 1 - bandA(bd[2], u); })); a += (1 - t) * b * 0.05; });
    return a / sp.tot;
  }
  function jarStart() { const r = JAR.room + 273.15; return { b: r, a: r, w: r, t: 0 }; }
  function jarRates(J, o, side) {        // side: the jar's own settings {gas, lid, wall}
    const Tr = JAR.room + 273.15, I = o.src === 'sun' ? 1000 : o.src === 'lamp' ? lampI(o.dist, o.watts) : 0, sb = T => SIG * Math.pow(T, 4);
    const ew = side.wall === 'glass' ? 0.9 : 0.06;                   // the wall's absorptivity for heat radiation: glass is opaque past 2.7 µm
    const eg = gasEps(side.gas, (J.b + J.a) / 2, JAR.path);
    const lampTrans = side.wall === 'glass' ? 0.86 : 0.92;
    const Pin = I * JAR.A * 0.92 * lampTrans, Pwall = I * JAR.Ap * (side.wall === 'glass' ? (o.src === 'sun' ? 0.05 : 0.14) : 0.01);
    const nearIR = side.gas === 'co2' ? 0.02 : side.gas === 'humid' ? 0.012 : 0.004;          // the lamp's own near-infrared taken by the gas
    const Pgas = I * JAR.A * nearIR * lampTrans * 4;
    /* a column of three partial absorbers over the card: up and down streams, no reflection */
    const U0 = sb(J.b), U1 = (1 - eg) * U0 + eg * sb(J.a), D2 = sb(Tr), D1 = (1 - ew) * D2 + ew * sb(J.w), D0 = (1 - eg) * D1 + eg * sb(J.a);
    const radB = JAR.A * (U0 - D0), radA = JAR.A * eg * (U0 + D1 - 2 * sb(J.a)), radW = JAR.A * ew * (U1 + D2 - 2 * sb(J.w)) - (JAR.Aw - JAR.A) * ew * (sb(J.w) - D2);
    const conv = JAR.hb * JAR.A * (J.b - J.a), aw = JAR.hw * JAR.Aw * (J.a - J.w), wo = JAR.ho * JAR.Aw * (J.w - Tr);
    const dT = Math.max(0, J.a - Tr), vent = side.lid ? 0 : JAR.kv * Math.pow(dT + 0.02, 1.5);
    return { db: Pin - conv - radB, da: Pgas + conv - aw - vent + radA, dw: Pwall + aw - wo + radW, Pwall, Pin, Pgas, radB, radA, conv, vent, eg, out: JAR.A * ((1 - ew) * U1 + ew * sb(J.w) - D2) };
  }
  function jarStep(J, o, side, dt) {
    const n = Math.max(1, Math.ceil(dt / 1)), h = dt / n;
    for (let k = 0; k < n; k++) { const r = jarRates(J, o, side); J.b += r.db * h / JAR.Cb; J.a += r.da * h / (JAR.Ca * (side.gas === 'co2' ? 1.27 : 1)); J.w += r.dw * h / JAR.Cw; J.t += h; }
    return J;
  }
  function jarRun(o, side, sec) { const J = jarStart(); jarStep(J, o, side, sec); return J; }

  /* ============================================================
     FEEDBACK — a planet in latitude bands (Budyko 1969, Sellers 1969, North 1975)
     45 equal-area bands from the equator to the pole (x = sin latitude). Each
     band: C dT/dt = Q s(x)(1 − α) − OLR + D d/dx[(1 − x²) dT/dx] + F.
     Sunlight s(x) = 1 − 0.482 P₂(x), the annual mean. Ice where the band is
     colder than −10 °C reflects 0.62; open ocean and land 0.30. OLR = A + 2.0 T
     across latitudes (the satellite relation); a push away from the starting
     climate meets the feedbacks of AR6 (Table 7.10): Planck 3.22, water vapour
     with lapse rate −1.30, clouds −0.42 W/m²/K. D carries heat poleward (the
     winds and the currents). A and D are tuned once: 14 °C and an ice edge
     at 72°, today's (pre-industrial) planet. Switch a part off and the same
     planet answers the same push without it.
     ============================================================ */
  const EBM = { N: 45, A: 212, B: 2.0, D: 0.44, w: 4, C: 7.3, Tice: -10, aIce: 0.45, aFree: 0.30, planck: 3.22, wv: 1.30, cloud: 0.42, Q: 1361 / 4 };
  const EBX = []; for (let i = 0; i < EBM.N; i++) EBX.push((i + 0.5) / EBM.N);
  const sOf = x => 1 - 0.482 * (3 * x * x - 1) / 2;
  const P2 = x => (3 * x * x - 1) / 2;
  /* open ground and sea look brighter where the Sun is low (the zenith-angle term of North 1975) */
  const iceA = (T, x) => { const free = EBM.aFree + 0.09 * P2(x); return free + (EBM.aIce - free) / (1 + Math.exp((T - EBM.Tice) / EBM.w)); };
  function ebmStep(T, o, base, years) {
    const N = EBM.N, dx = 1 / N, dt = 0.1, n = Math.max(1, Math.round(years / dt)), D = o.transport ? EBM.D : 0;
    const Beff = EBM.planck - (o.wv ? EBM.wv : 0) - (o.clouds ? EBM.cloud : 0), Q = EBM.Q * o.sun / 100, F = 5.35 * Math.log(o.co2 / 280);
    const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), r = new Float64Array(N);
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < N; i++) {
        const xl = i / N, xr = (i + 1) / N, wl = D * (1 - xl * xl) / (dx * dx), wr = D * (1 - xr * xr) / (dx * dx);
        const al = o.ice ? iceA(T[i], EBX[i]) : base.alpha[i], Tb = base ? base.T[i] : 0;
        const R = Q * sOf(EBX[i]) * (1 - al) - (EBM.A + EBM.B * T[i]) - (o.pure ? 0 : (Beff - EBM.B) * (T[i] - Tb)) + F;
        a[i] = i > 0 ? -wl : 0; c[i] = i < N - 1 ? -wr : 0; b[i] = EBM.C / dt + (i > 0 ? wl : 0) + (i < N - 1 ? wr : 0); r[i] = EBM.C / dt * T[i] + R;
      }
      for (let i = 1; i < N; i++) { const m = a[i] / b[i - 1]; b[i] -= m * c[i - 1]; r[i] -= m * r[i - 1]; }
      T[N - 1] = r[N - 1] / b[N - 1]; for (let i = N - 2; i >= 0; i--) T[i] = (r[i] - c[i] * T[i + 1]) / b[i];
    }
    return T;
  }
  const meanOf = T => { let s = 0; for (let i = 0; i < T.length; i++) s += T[i]; return s / T.length; };
  function iceEdge(T) {                       // the latitude where the bands cross −10 °C, degrees (90 if no ice, 0 if all ice)
    if (T[0] < EBM.Tice) return 0;
    for (let i = 1; i < T.length; i++) if (T[i] < EBM.Tice) { const f = (T[i - 1] - EBM.Tice) / (T[i - 1] - T[i]), x = EBX[i - 1] + f * (EBX[i] - EBX[i - 1]); return Math.asin(clamp(x, 0, 1)) * 180 / Math.PI; }
    return 90;
  }
  /* the starting planet: 280 ppm, today's Sun, every part working (the state each push is measured from) */
  const BASES = {};
  function ebmBase(transport) {
    const k = transport ? 't' : 'n'; if (BASES[k]) return BASES[k];
    const T = Float64Array.from(EBX, x => 28 - 40 * x * x), o = { transport, ice: true, wv: true, clouds: true, sun: 100, co2: 280, pure: true };
    ebmStep(T, o, null, 300);
    const base = { T: Float64Array.from(T), alpha: Float64Array.from(T, (v, i) => iceA(v, EBX[i])) };
    base.mean = meanOf(T); base.edge = iceEdge(T);
    return (BASES[k] = base);
  }
  function ebmEq(o, from) {
    const base = ebmBase(o.transport), T = from ? Float64Array.from(from) : Float64Array.from(base.T);
    ebmStep(T, o, base, 120);
    return T;
  }
  /* the climate against the Sun's strength, from a warm start down and from a snowball up */
  const HYST = {};
  function hysteresis(o) {
    const key = [o.transport, o.ice, o.wv, o.clouds, Math.round(o.co2)].join('|'); if (HYST[key]) return HYST[key];
    const base = ebmBase(o.transport), down = [], up = [];
    let T = Float64Array.from(base.T);
    for (let s = 112; s >= 82; s -= 1) { ebmStep(T, Object.assign({}, o, { sun: s }), base, 50); down.push([s, meanOf(T), iceEdge(T)]); }
    for (let s = 82; s <= 140; s += 1) { ebmStep(T, Object.assign({}, o, { sun: s }), base, 50); up.push([s, meanOf(T), iceEdge(T)]); }
    const snow = down.find(q => q[2] < 1), thaw = up.find(q => q[2] > 1);
    return (HYST[key] = { down, up, snowAt: snow ? snow[0] : null, thawAt: thaw ? thaw[0] : null });
  }
  /* warming at equilibrium for a doubling of CO₂, with the parts that are switched on */
  function ecsOf(o) { const base = ebmBase(o.transport), T = ebmEq(Object.assign({}, o, { co2: 560, sun: 100 })); return meanOf(T) - base.mean; }

  /* ============================================================
     CAUSES — 1750 to 2023, from what was emitted to what was measured
     CO₂: each year's emissions (fossil fuel, cement, land clearing; the Global
     Carbon Budget) decay in the air as the Bern impulse response says (Joos et
     al. 2013: 22 % for good, the rest over 394, 37 and 4 years). Methane and
     nitrous oxide: one box each, emissions in, chemistry out (9.1 and 116
     years). Forcing: Myhre et al. 1998, with the CH₄–N₂O overlap; halocarbons
     and ozone, aerosols and the land's brightening from AR6's assessed series;
     the Sun's 11-year cycles; volcanic veils at −20 W/m² per unit optical
     depth. Temperature: a two-layer ocean (Geoffroy et al. 2013), its
     sensitivity the student's. Compared with HadCRUT5, never fitted to it.
     ============================================================ */
  const PPM = 2.124;
  const FOSSIL = [[1750, 0.003], [1800, 0.008], [1850, 0.054], [1860, 0.091], [1870, 0.147], [1880, 0.236], [1890, 0.356], [1900, 0.534],
    [1910, 0.819], [1920, 0.932], [1930, 1.053], [1940, 1.299], [1950, 1.63], [1960, 2.57], [1970, 4.05], [1980, 5.29], [1990, 6.13],
    [2000, 6.75], [2010, 9.06], [2015, 9.63], [2019, 9.9], [2020, 9.46], [2023, 10.1]];
  const CEMENT = [[1750, 0], [1900, 0.002], [1930, 0.008], [1950, 0.018], [1960, 0.043], [1970, 0.078], [1980, 0.12], [1990, 0.157], [2000, 0.2], [2010, 0.41], [2015, 0.43], [2020, 0.44], [2023, 0.45]];
  const LANDUSE = [[1750, 0.35], [1800, 0.5], [1850, 0.9], [1900, 1.0], [1950, 1.6], [1960, 1.6], [1970, 1.5], [1980, 1.5], [1990, 1.6], [2000, 1.5], [2010, 1.4], [2020, 1.2], [2023, 1.1]];
  const CH4_E = [[1750, 15], [1850, 35], [1900, 70], [1950, 140], [1970, 220], [1980, 260], [1990, 295], [2000, 305], [2010, 340], [2020, 370], [2023, 375]];
  const CH4_FOSSIL = [[1750, 0], [1850, 0.05], [1900, 0.15], [1950, 0.25], [1980, 0.33], [2023, 0.35]];
  const N2O_E = [[1750, 0.2], [1850, 0.6], [1900, 1.0], [1950, 1.8], [1970, 3.2], [1980, 4.3], [1990, 5.0], [2000, 5.6], [2010, 6.4], [2020, 7.3], [2023, 7.4]];
  const HALO = [[1750, 0], [1930, 0], [1950, 0.01], [1960, 0.03], [1970, 0.1], [1980, 0.22], [1990, 0.33], [2000, 0.37], [2010, 0.39], [2019, 0.41], [2023, 0.41]];
  const OZONE = [[1750, 0], [1850, 0.03], [1900, 0.07], [1950, 0.15], [1970, 0.27], [1980, 0.33], [1990, 0.38], [2000, 0.42], [2010, 0.45], [2019, 0.47], [2023, 0.47]];
  const AEROSOL = [[1750, 0], [1850, -0.08], [1900, -0.2], [1920, -0.27], [1950, -0.55], [1960, -0.72], [1970, -0.95], [1980, -1.12], [1990, -1.18], [2000, -1.15], [2010, -1.13], [2019, -1.1], [2023, -1.0]];
  const VOLCANOES = [[1815.3, 0.40, 'Tambora'], [1883.6, 0.13, 'Krakatau'], [1886.5, 0.03, 'Tarawera'], [1902.8, 0.06, 'Santa María'], [1912.4, 0.05, 'Katmai'], [1963.2, 0.10, 'Agung'], [1974.8, 0.03, 'Fuego'], [1982.3, 0.10, 'El Chichón'], [1991.5, 0.15, 'Pinatubo']];
  const SOLAR_MIN = [1755.2, 1766.5, 1775.5, 1784.7, 1798.3, 1810.6, 1823.3, 1833.9, 1843.5, 1856.0, 1867.2, 1878.9, 1890.2, 1902.0, 1913.6, 1923.6, 1933.8, 1944.2, 1954.3, 1964.9, 1976.5, 1986.8, 1996.4, 2008.9, 2019.9, 2030.9];
  const HADCRUT = [[1855, 0.02], [1865, 0.0], [1875, 0.06], [1885, -0.04], [1895, -0.04], [1905, -0.09], [1915, -0.09], [1925, 0.06], [1935, 0.16], [1945, 0.30], [1955, 0.26], [1965, 0.31], [1975, 0.31], [1985, 0.48], [1995, 0.66], [2005, 0.86], [2015, 1.06]];
  const JOOS = { a0: 0.217, a: [0.259, 0.338, 0.186], tau: [172.9, 18.51, 1.186] };
  const irf = t => JOOS.a0 + JOOS.a[0] * Math.exp(-t / JOOS.tau[0]) + JOOS.a[1] * Math.exp(-t / JOOS.tau[1]) + JOOS.a[2] * Math.exp(-t / JOOS.tau[2]);
  const aodAt = (y, list) => { let a = 0; (list || VOLCANOES).forEach(([y0, P]) => { const t = y - y0; if (t > 0) a += P * (1 - Math.exp(-t / 0.15)) * Math.exp(-t / 1.0) / 0.80; }); return a; };
  const AOD_BG = (() => { let s = 0, n = 0; for (let y = 1850; y < 2015; y += 1 / 12) { s += aodAt(y); n++; } return s / n; })();
  function tsiAt(y) {                         // the Sun's output, W/m², less 1361
    let k = 0; while (k < SOLAR_MIN.length - 2 && SOLAR_MIN[k + 1] <= y) k++;
    const ph = clamp((y - SOLAR_MIN[k]) / (SOLAR_MIN[k + 1] - SOLAR_MIN[k]), 0, 1), cyc = 0.5 * (1 - Math.cos(TAU * ph)) * Math.sin(Math.PI * Math.pow(ph, 0.8)) * 1.3;
    const trend = y < 1900 ? 0 : y < 1958 ? 0.4 * (y - 1900) / 58 : y < 1985 ? 0.4 : 0.4 - 0.25 * (y - 1985) / 38;
    return cyc + trend - 0.35;
  }
  const solarERF = y => 0.72 * (tsiAt(y) - tsiAt(1750)) * 0.7 / 4;
  /* Myhre et al. 1998 */
  const ovl = (M, N) => 0.47 * Math.log(1 + 2.01e-5 * Math.pow(M * N, 0.75) + 5.31e-15 * M * Math.pow(M * N, 1.52));
  const M0 = 722, N0 = 270, C0 = 277;
  const fCO2 = C => 5.35 * Math.log(C / C0);
  const fCH4 = (M, N) => 0.036 * (Math.sqrt(M) - Math.sqrt(M0)) - (ovl(M, N0) - ovl(M0, N0));
  const fN2O = (M, N) => 0.12 * (Math.sqrt(N) - Math.sqrt(N0)) - (ovl(M0, N) - ovl(M0, N0));
  const F2X = 5.35 * Math.log(2);
  const TWO = { C: 7.3, CD: 106, gamma: 0.73 };
  const ACTS = ['fossil', 'cement', 'farming', 'clearing', 'haze', 'other', 'sun', 'volcano'];
  /* the carbon cycle in five stores (as in 6A-3: air, plants, soil, ocean surface, middle and deep; the Revelle
     factor 10; plants grow more as CO₂ rises, β = 0.108; mixing fitted once to the ice-core and Mauna Loa record) */
  const CARB = { ka: 0.12, kmi: 0.07862, kid: 0.0015, beta: 0.10800, xi: 10, A0: 277 * 2.124, V0: 550, L0: 1500, M0: 900, I0: 9000, D0: 28100, NPP0: 60 };
  function carbStart() { const c = CARB; return { A: c.A0, V: c.V0, Ls: c.L0, M: c.M0, I: c.I0, D: c.D0 }; }
  function carbStep(B, dt, ef, el) {
    const c = CARB, npp = c.NPP0 * (1 + c.beta * Math.log(B.A / c.A0)), Aeq = c.A0 * (1 + c.xi * (B.M - c.M0) / c.M0), fas = c.ka * (B.A - Aeq);
    const fmi = c.kmi * (B.M / c.M0 - B.I / c.I0) * c.M0, fid = c.kid * (B.I / c.I0 - B.D / c.D0) * c.I0, litter = B.V * c.NPP0 / c.V0, decay = B.Ls * c.NPP0 / c.L0;
    B.A += (ef + el - npp + decay - fas) * dt; B.V += (npp - litter - el) * dt; B.Ls += (litter - decay) * dt; B.M += (fas - fmi) * dt; B.I += (fmi - fid) * dt; B.D += fid * dt;
    return B;
  }
  /* every forcing, year by year, split by the activity or natural factor behind it */
  const HIST_CACHE = {};
  function historyOf(o) {
    const key = ACTS.map(k => o[k] ? 1 : 0).join('') + '|' + o.aer.toFixed(2);
    if (HIST_CACHE[key]) return HIST_CACHE[key];
    const Y0 = 1750, Y1 = 2023, n = Y1 - Y0 + 1, rows = [];
    const eF = [], eC = [], eL = [];
    let M = M0, N = N0, cumL = 0, cumL19 = 0; const CB = carbStart();
    for (let y = Y0; y <= 2019; y++) cumL19 += lerpT(LANDUSE, y);
    for (let i = 0; i < n; i++) {
      const y = Y0 + i;
      eF.push(o.fossil ? lerpT(FOSSIL, y) - lerpT(CEMENT, y) : 0); eC.push(o.cement ? lerpT(CEMENT, y) : 0); eL.push(o.clearing ? lerpT(LANDUSE, y) : 0);
      let dF = 0, dC = 0, dL = 0;
      for (let j = 0; j <= i; j++) { const r = irf(i - j + 0.5) / PPM; dF += eF[j] * r; dC += eC[j] * r; dL += eL[j] * r; }
      /* the air's CO₂ itself from the carbon cycle with its sinks (6A-3's box model, fitted to Mauna Loa); the impulse response only shares it out by source */
      for (let s = 0; s < 10; s++) carbStep(CB, 0.1, eF[i] + eC[i], eL[i]);
      const C = CB.A / PPM;
      const ch4 = lerpT(CH4_E, y), fsh = lerpT(CH4_FOSSIL, y), eM = ch4 * ((o.fossil ? fsh : 0) + (o.farming ? 1 - fsh : 0));
      for (let s = 0; s < 4; s++) M += (eM / 2.78 - (M - M0) / 9.1) * 0.25;
      const n2o = lerpT(N2O_E, y), eN = n2o * ((o.fossil ? 0.15 : 0) + (o.farming ? 0.85 : 0));
      for (let s = 0; s < 4; s++) N += (eN / 4.79 - (N - N0) / 116) * 0.25;
      cumL += lerpT(LANDUSE, y);
      const exc = dF + dC + dL, Fc = Math.max(0, fCO2(C)), share = k => exc > 1e-9 ? Fc * k / exc : 0;
      const Fm = fCH4(M, N), Fn = fN2O(M, N);
      const F = {
        co2Fossil: share(dF), co2Cement: share(dC), co2Land: share(dL),
        ch4: Fm, n2o: Fn,
        other: o.other ? lerpT(HALO, y) + lerpT(OZONE, y) : 0,
        aerosol: o.haze ? lerpT(AEROSOL, y) * o.aer / 1.1 : 0,
        albedo: o.clearing ? -0.2 * cumL / cumL19 : 0,
        solar: o.sun ? solarERF(y) : 0,
        volcanic: 0
      };
      rows.push({ y, C, M, N, F, Fch4fossil: o.farming || o.fossil ? Fm * (o.fossil ? (o.farming ? fsh : 1) : 0) : 0 });
    }
    return (HIST_CACHE[key] = { rows, eF, eC, eL });
  }
  /* the two-layer ocean, a month at a time; volcanic veils resolved within the year */
  function twoLayer(Fyear, lam, gam, vol, y0) {
    let T = 0, TD = 0; const out = [];
    for (let i = 0; i < Fyear.length; i++) {
      let s = 0;
      for (let m = 0; m < 12; m++) {
        const y = y0 + i + (m + 0.5) / 12, F = Fyear[i] + (vol ? -20 * (aodAt(y) - AOD_BG) : 0);
        const dT = (F - lam * T - gam * (T - TD)) / TWO.C, dD = gam * (T - TD) / TWO.CD;
        T += dT / 12; TD += dD / 12; s += T;
      }
      out.push(s / 12);
    }
    return out;
  }
  const PARTS = ['co2Fossil', 'co2Cement', 'co2Land', 'ch4', 'n2o', 'other', 'aerosol', 'albedo', 'solar'];
  function causesRun(o) {
    const H = historyOf(o), lam = F2X / o.ecs, gam = o.gamma, Y0 = 1750, rows = H.rows;
    const total = rows.map(r => PARTS.reduce((s, k) => s + r.F[k], 0));
    const T = twoLayer(total, lam, gam, o.volcano, Y0);
    const base = (arr) => { let s = 0, n = 0; rows.forEach((r, i) => { if (r.y >= 1850 && r.y <= 1900) { s += arr[i]; n++; } }); return s / n; };
    const b = base(T);
    const wob = new Float64Array(rows.length);
    if (o.wobble) { const R = rng(97 + o.seed * 7919); let e = 0; for (let i = 0; i < rows.length; i++) { const z = (R() + R() + R() + R() - 2) * Math.sqrt(3); e = 0.45 * e + 0.11 * z; wob[i] = e; } }
    const Tm = T.map((v, i) => v - b + wob[i]);
    /* each part alone: the ocean is linear, so the parts add up to the whole */
    const per = {};
    PARTS.forEach(k => { const t = twoLayer(rows.map(r => r.F[k]), lam, gam, false, Y0), bb = base(t); per[k] = t.map(v => v - bb); });
    const tv = twoLayer(rows.map(() => 0), lam, gam, o.volcano, Y0), bv = base(tv); per.volcanic = tv.map(v => v - bv);
    return { rows, T: Tm, per, total, lam, ecs: o.ecs };
  }
  const meanYears = (rows, arr, a, b) => { let s = 0, n = 0; rows.forEach((r, i) => { if (r.y >= a && r.y <= b) { s += arr[i]; n++; } }); return n ? s / n : 0; };

  /* ============================================================
     TIMESCALES — one push, followed for ten thousand years
     The same two-layer ocean and the same impulse response. A volcano veils
     the sky for a year or two; the Sun swings every 11 years; CO₂ given out
     stays — a fifth of it for longer than civilisation has existed; an orbit
     changes over tens of thousands of years. The question is not only how big
     a change is but how fast, and how long.
     ============================================================ */
  function kickForcing(o) {
    if (o.kick === 'volcano') return t => -20 * o.aod * (t > 0 ? (1 - Math.exp(-t / 0.15)) * Math.exp(-t / 1.0) / 0.80 : 0);
    if (o.kick === 'sun') return t => 0.72 * (o.tsi / 2) * 0.7 / 4 * Math.sin(TAU * t / 11);
    if (o.kick === 'pulse') return t => 5.35 * Math.log((420 + o.gtc / PPM * irf(Math.max(0, t))) / 420);
    if (o.kick === 'steady') {
      const Y = o.years, E = o.rate;
      const cumIrf = (a, b) => { if (b <= a) return 0; let s = JOOS.a0 * (b - a); JOOS.a.forEach((ak, k) => { const tk = JOOS.tau[k]; s += ak * tk * (Math.exp(-a / tk) - Math.exp(-b / tk)); }); return s; };
      return t => { if (t <= 0) return 0; const C = 420 + E / PPM * cumIrf(Math.max(0, t - Y), t); return 5.35 * Math.log(C / 420); };
    }
    return t => o.orb * Math.sin(TAU * t / 41000) * (o.slow ? 2 : 1);
  }
  function kickRun(o) {
    const F = kickForcing(o), lam = F2X / o.ecs, gam = 0.73, pts = [];
    let T = 0, TD = 0, t = 0;
    const tEnd = o.kick === 'orbit' ? 100000 : 10000;
    let peak = 0, peakT = 0, maxRate = 0, lastT = 0, lastt = 0;
    while (t < tEnd) {
      const h = Math.min(t < 3 ? 1 / 48 : t < 30 ? 1 / 12 : t * 0.004, 50), f = F(t + h / 2);
      const dT = (f - lam * T - gam * (T - TD)) / TWO.C, dD = gam * (T - TD) / TWO.CD;
      // an implicit-enough step: halve when the ocean's upper layer would overshoot
      const n = Math.max(1, Math.ceil(h / 0.5)); for (let s = 0; s < n; s++) { const a = (F(t + (s + 0.5) * h / n) - lam * T - gam * (T - TD)) / TWO.C, b = gam * (T - TD) / TWO.CD; T += a * h / n; TD += b * h / n; }
      t += h; void dT; void dD; void f;
      if (Math.abs(T) > Math.abs(peak)) { peak = T; peakT = t; }
      if (t - lastt >= Math.max(1, t * 0.02)) { maxRate = Math.max(maxRate, Math.abs(T - lastT) / (t - lastt) * 100); lastT = T; lastt = t; }
      pts.push([t, T, TD, F(t)]);
    }
    return { pts, peak, peakT, maxRate, lam };
  }
  const kickAt = (R, t) => { const P = R.pts; if (t <= P[0][0]) return P[0]; let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] < t) lo = m; else hi = m; } return P[hi]; };
  /* changes in the record: how long each took, and how big */
  const EVENTS = [
    { k: 'pinatubo', name: 'Pinatubo, 1991', dur: 2, dT: 0.4, col: '#C9D4E8' },
    { k: 'cycle', name: 'one sunspot cycle', dur: 5.5, dT: 0.07, col: '#FFD66B' },
    { k: 'nino', name: 'an El Niño', dur: 1, dT: 0.2, col: '#8FD4FA' },
    { k: 'tambora', name: 'Tambora, 1815', dur: 2, dT: 0.6, col: '#B0B8C8' },
    { k: 'deglacial', name: 'the end of the last ice age', dur: 10000, dT: 6, col: '#9FE0B8' },
    { k: 'petm', name: 'the PETM, 56 million years ago', dur: 5000, dT: 5, col: '#E8A0FF' },
    { k: 'now', name: 'since 1850', dur: 170, dT: 1.2, col: '#FF8A80' },
    { k: 'path', name: 'a 3 °C century ahead', dur: 100, dT: 2, col: '#FF6E6E' }
  ];


  /* ============================================================
     THE LAB — set-ups, parameters, the run
     ============================================================ */
  const SETUPS = [
    { value: 'budget', label: 'Energy in, energy out', teaches: ['F1.1', 'F1.2'] },
    { value: 'tyndall', label: 'Tyndall’s tube: which gases stop heat?', teaches: ['F3.1', 'F1.3'] },
    { value: 'jars', label: 'The jar demonstration — and Wood’s test', teaches: ['F1.3'] },
    { value: 'feedback', label: 'Ice, vapour and clouds: feedbacks', teaches: ['F1.4', 'F1.5'] },
    { value: 'causes', label: 'What warmed the world since 1850?', teaches: ['F3.2', 'F3.3', 'F3.4'] },
    { value: 'timescales', label: 'Fast changes and slow ones', teaches: ['F3.5'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'budget', pace: 1,
    S0: 1361, cloud: 67, ice: 6, land: 'today', co2: 280, air: 'today', wv: true, mix: 70,
    gas: 'CO2', lp: 0, len: 1.2, src: 100, win: 'salt', land2: 'amount',
    src2: 'lamp', dist: 0.3, watts: 150, gasA: 'air', lidA: true, wallA: 'glass', gasB: 'co2', lidB: true, wallB: 'glass', irView: false,
    fco2: 280, sun: 100, iceFb: true, wvFb: true, cloudFb: true, transport: true, start: 'today', tint: true,
    fossil: true, cement: true, farming: true, clearing: true, haze: true, other: true, sunF: true, volcano: true, wobble: true, ecs: 3, aer: 1.1, gamma: 0.73, seed: 1,
    kick: 'volcano', aod: 0.15, tsi: 1.0, gtc: 1000, rate: 10, years: 100, orb: 1, slow: false, ecsK: 3
  };
  const SETUP_DEFAULTS = { budget: { pace: 1 }, tyndall: {}, jars: { pace: 30 }, feedback: { pace: 5 }, causes: { pace: 6 }, timescales: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const budgetOpts = p => ({ S0: p.S0, cloud: p.cloud / 100, ice: p.ice / 100, land: p.land, co2: p.co2, air: p.air, wv: !!p.wv, mix: p.mix });
  const tubeOpts = p => ({ gas: p.gas, p: Math.pow(10, p.lp) / 29.92, len: p.len, src: p.src, win: p.win });
  const jarOpts = p => ({ src: p.src2, dist: p.dist, watts: p.watts });
  const sideA = p => ({ gas: p.gasA, lid: !!p.lidA, wall: p.wallA }), sideB = p => ({ gas: p.gasB, lid: !!p.lidB, wall: p.wallB });
  const fbOpts = p => ({ transport: !!p.transport, ice: !!p.iceFb, wv: !!p.wvFb, clouds: !!p.cloudFb, sun: p.sun, co2: p.fco2 });
  const causeOpts = p => ({ fossil: !!p.fossil, cement: !!p.cement, farming: !!p.farming, clearing: !!p.clearing, haze: !!p.haze, other: !!p.other, sun: !!p.sunF, volcano: !!p.volcano, wobble: !!p.wobble, seed: Math.round(p.seed), ecs: p.ecs, gamma: p.gamma, aer: p.aer });
  const kickOpts = p => ({ kick: p.kick, aod: p.aod, tsi: p.tsi, gtc: p.gtc, rate: p.rate, years: Math.round(p.years), orb: p.orb, slow: !!p.slow, ecs: p.ecsK });
  const HOMES = {
    tyndall: { theta: -1.32, phi: 0.30, dist: 2.0, target: [0.62, 0.05, 0.16], fov: 0.72 },
    jars: { theta: -1.40, phi: 0.26, dist: 1.25, target: [0.0, 0.0, 0.17], fov: 0.72 },
    causes: { theta: -1.95, phi: 0.42, dist: 46, target: [0, 0, 1.0], fov: 0.72 },
    globe: { theta: -1.45, phi: 0.30, dist: 4, target: [0, 0, 0], fov: 0.6 }
  };
  const camFor = s => (s === 'tyndall' || s === 'jars' || s === 'causes') ? s : 'globe';
  const T_CAUSE0 = 1850, T_CAUSE1 = 2023;
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    S.t = 0; S.ts = 0; S.hist = []; S._lastRec = -1; S.anim = 0;
    if (p.setup === 'budget') { S.B = { T: BUD.T0, t: 0 }; S.Teq = budgetEq(budgetOpts(p)); record(S, true); }
    if (p.setup === 'tyndall') { S.tube = thermopile(tubeOpts(p)); S.needle = 0; }
    if (p.setup === 'jars') { S.JA = jarStart(); S.JB = jarStart(); record(S, true); }
    if (p.setup === 'feedback') {
      const o = fbOpts(p), base = ebmBase(o.transport);
      S.base = base;
      S.Tlat = p.start === 'snowball' ? new Float64Array(EBM.N).fill(-45) : Float64Array.from(ebmBase(true).T);
      S.year = 0; record(S, true);
    }
    if (p.setup === 'causes') { S.run = causesRun(causeOpts(p)); S.year = T_CAUSE0; }
    if (p.setup === 'timescales') { S.kick = kickRun(kickOpts(p)); S.logt = -1.5; S.tk = 0; }
    const ck = camFor(p.setup);
    if (!S.cam || S.camFor !== ck) { const h = HOMES[ck]; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: h.fov }); S.cam.minDist = ck === 'causes' ? 20 : 0.5; S.cam.maxDist = ck === 'causes' ? 90 : 6; S.camFor = ck; }
  }
  function record(S, force) {
    const p = S.p;
    if (p.setup === 'budget') { const m = Math.floor(S.B.t * 4); if (!force && m === S._lastRec) return; S._lastRec = m; const f = fluxes(budgetOpts(p), S.B.T); S.hist.push([S.B.t, S.B.T - 273.15, f.N]); }
    if (p.setup === 'jars') { const m = Math.floor(S.JA.t / 15); if (!force && m === S._lastRec) return; S._lastRec = m; S.hist.push([S.JA.t / 60, S.JA.a - 273.15, S.JB.a - 273.15, S.JA.b - 273.15, S.JB.b - 273.15]); }
    if (p.setup === 'feedback') { const m = Math.floor(S.year); if (!force && m === S._lastRec) return; S._lastRec = m; S.hist.push([S.year, meanOf(S.Tlat), iceEdge(S.Tlat)]); }
  }
  function step(S, dt) {
    const p = S.p, pace = +p.pace || 1;
    S.t += dt; S.anim += dt;
    if (p.setup === 'budget') { if (S.B.t < 60) { budgetStep(S.B, budgetOpts(p), Math.min(dt * pace, 0.5)); record(S); } }
    else if (p.setup === 'tyndall') { const want = S.tube.deflect; S.needle += (want - S.needle) * (1 - Math.exp(-dt / 0.6)); S.ts += dt; }
    else if (p.setup === 'jars') { if (S.JA.t < 3600) { const h = Math.min(dt * pace, 60); jarStep(S.JA, jarOpts(p), sideA(p), h); jarStep(S.JB, jarOpts(p), sideB(p), h); record(S); } }
    else if (p.setup === 'feedback') { if (S.year < 200) { const h = Math.min(dt * pace, 2); ebmStep(S.Tlat, fbOpts(p), S.base, h); S.year += h; record(S); } }
    else if (p.setup === 'causes') { S.year = Math.min(T_CAUSE1, S.year + dt * pace); }
    else if (p.setup === 'timescales') { const tEnd = p.kick === 'orbit' ? 5 : 4; S.logt = Math.min(tEnd, S.logt + dt * 0.4); S.tk = Math.pow(10, S.logt); }
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const fmtW = v => (Math.abs(v) < 9.95 ? v.toFixed(1) : v.toFixed(0)) + ' W/m²';
  const cdeg = K => (K - 273.15).toFixed(1) + ' °C';
  /* a name on a leader line, kept on the stage and off the header */
  function tag(ctx, x, y, dx, dy, text, col, W, H) {
    if (y + dy < 64 || y + dy > H - 24) dy = clamp(y + dy, 64, H - 24) - y;
    ctx.save(); ctx.font = mono(10, 600);
    let tw = ctx.measureText(text).width, ex = x + dx, left = dx < 0;
    if (left && ex - 4 - tw < 4) left = false; else if (!left && ex + 4 + tw > W - 4) left = true;
    const room = left ? ex - 8 : W - ex - 8; if (tw > room) { text = kit().fitText(ctx, text, Math.max(50, room)); tw = ctx.measureText(text).width; }
    ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, y + dy); ctx.stroke();
    ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
    ctx.strokeText(text, ex + (left ? -4 : 4), y + dy); ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(text, ex + (left ? -4 : 4), y + dy);
    ctx.restore();
  }
  function loading(g, x, y) {
    const ctx = g.ctx; ctx.save(); ctx.font = mono(11, 600); ctx.fillStyle = '#AFC0D8'; ctx.textAlign = 'center';
    ctx.fillText(window.EARTH && EARTH.failed() ? 'the Earth image could not be loaded' : 'loading the Earth…', x, y); ctx.restore();
  }
  /* the real Earth, turned by the student's drag, lit from the left of the screen */
  function globe(S, g, cx, cy, R, o) {
    if (!window.EARTH) return null;
    if (!EARTH.ready()) { EARTH.load(); loading(g, cx, cy); return null; }
    const cam = S.cam, ctx = g.ctx;
    cam.setViewport(g.w, g.h); cam.target = [0, 0, 0]; cam.dist = cam._k / R; cam.update();
    const sunDir = [-cam.r[0] * 0.85 - cam.f[0] * 0.45 + cam.u[0] * 0.15, -cam.r[1] * 0.85 - cam.f[1] * 0.45 + cam.u[1] * 0.15, -cam.r[2] * 0.85 - cam.f[2] * 0.45 + cam.u[2] * 0.15];
    ctx.save(); ctx.translate(cx - g.w / 2, cy - g.h / 2);
    EARTH.draw(ctx, cam, [0, 0, 0], 1, { spin: (o.spin || 0) + S.anim * 0.04, sun: sunDir, ambient: 0.08, overlay: o.overlay, budget: g.w < 640 ? 50000 : 110000 });
    ctx.restore();
    const spin = (o.spin || 0) + S.anim * 0.04;
    /* a point on (or above) the globe, by latitude and longitude, on the stage */
    const at = (lat, lon, r) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + spin, rr = r || 1, q = cam.project([rr * Math.cos(la) * Math.cos(lo), rr * Math.cos(la) * Math.sin(lo), rr * Math.sin(la)]); return { x: q.x + cx - g.w / 2, y: q.y + cy - g.h / 2, front: (cam.eye[0] * Math.cos(la) * Math.cos(lo) + cam.eye[1] * Math.cos(la) * Math.sin(lo) + cam.eye[2] * Math.sin(la)) > 1 }; };
    return { at, cx, cy, R };
  }

  /* ---------------- budget ---------------- */
  function budgetLayout(g) {
    const W = g.w, H = g.h;
    if (W < 640) return { narrow: true, sec: { x: 8, y: 92, w: W - 16, h: H - 92 - 70 } };
    const R = Math.min(H * 0.2, W * 0.13);
    return { narrow: false, gx: W * 0.25, gy: H * 0.43, R, sx: W * 0.045, sy: H * 0.30, sec: { x: W * 0.47, y: 66, w: W * 0.53 - 12, h: H - 66 - 30 } };
  }
  function drawBudget(S, g) {
    const ctx = g.ctx, p = S.p, A = ART(), W = g.w, H = g.h, Ly = budgetLayout(g), o = budgetOpts(p), f = fluxes(o, S.B.T);
    A.space(ctx, 0, 0, W, H, 3);
    const iceLat = Math.asin(clamp(1 - o.ice, 0, 1)) * 180 / Math.PI;
    if (!Ly.narrow) {
      // the Sun, bigger and closer when its light is stronger
      const sr = clamp(10 + (p.S0 - 1361) / 60, 6, 26);
      A.sun(ctx, Ly.sx, Ly.sy, sr, { spots: 0.3 });
      g.handle(Ly.sx, Ly.sy, sr + 8, 'sun');
      const G = globe(S, g, Ly.gx, Ly.gy, Ly.R, { spin: 1.3, overlay: A.weather({ cloud: o.cloud, iceN: iceLat, iceS: iceLat, shift: S.anim * 2 }) });
      const wq = v => Math.max(0.6, v * 0.08 * Ly.R / 165);
      if (G) {
        A.shell(ctx, G.cx, G.cy, G.R, { trap: f.E.e, th: 0.04 + 0.03 * f.E.e });
        A.swBeam(ctx, Ly.sx + sr + 6, Ly.sy, G.cx - G.R * 0.92, G.cy - G.R * 0.25, wq(f.Q), '#FFD66B');
        A.swBeam(ctx, G.cx - G.R * 0.8, G.cy - G.R * 0.62, G.cx - G.R * 1.35, G.cy - G.R * 1.25, wq(f.reflected), '#F2F4F8');
        for (let i = 0; i < 3; i++) { const a = -0.55 + i * 0.7, r0 = G.R * 1.06, r1 = G.R * 1.55; A.lwBeam(ctx, G.cx + Math.cos(a) * r0, G.cy + Math.sin(a) * r0, G.cx + Math.cos(a) * r1, G.cy + Math.sin(a) * r1, wq(f.olr / 3), '#FF8A5C', { phase: S.anim * 6, lam: 12 }); }
        A.fluxTag(ctx, (Ly.sx + G.cx) / 2 - 24, (Ly.sy + G.cy) / 2 + 22, 'in ' + fmtW(f.Q), '#FFD66B', 'center');
        A.fluxTag(ctx, G.cx - G.R * 1.3, G.cy - G.R * 1.38, 'reflected ' + fmtW(f.reflected), '#E8ECF4', 'center');
        A.fluxTag(ctx, G.cx + G.R * 1.18, G.cy + G.R * 0.95, 'heat out ' + fmtW(f.olr), '#FFA07A', 'left');
        const sx = G.cx + G.R * 1.0, sy = G.cy - G.R * 1.2;
        A.satellite(ctx, sx, sy, Ly.R * 0.15, -0.35, { scan: S.anim * 2 });
        tag(ctx, sx + 6, sy - Ly.R * 0.12, 14, -14, 'CERES measures ' + fmtW(f.olr + f.reflected) + ' leaving', '#AFC0D8', W * 0.47, H);
        // the ice line: a handle on the globe's rim, at the latitude where the ice begins
        const hy = G.cy - G.R * Math.sin(iceLat * Math.PI / 180), hx = G.cx + G.R * Math.cos(iceLat * Math.PI / 180) * 0.15;
        g.handle(hx, hy, 12, 'ice');
        tag(ctx, hx, hy, -G.R * 0.55, -14, 'ice and snow: ' + p.ice.toFixed(0) + ' % of the surface', '#E8F4FF', W * 0.47, H);
      }
    }
    // the climate system in section, each part as wide as its share of the surface
    const s = Ly.sec, an = A.section(ctx, s.x, s.y, s.w, s.h, { cloud: o.cloud, ice: o.ice, land: o.land, trap: f.E.e, t: S.anim });
    ctx.save(); ctx.strokeStyle = 'rgba(120,150,200,.4)'; ctx.lineWidth = 1; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1); ctx.restore();
    const ks = Math.min(s.w / 560, s.h / 420) * 0.11, bw = v => Math.max(0.8, v * ks);
    const x0 = s.x + s.w * 0.12, ground = an.ys, ph = S.anim * 6;
    A.swBeam(ctx, x0, an.toa - 4, x0 + s.w * 0.08, an.cloudY + 4, bw(f.Q), '#FFD66B', { noHead: true });
    A.swBeam(ctx, x0 + s.w * 0.08, an.cloudY + 4, x0 + s.w * 0.12, ground - 4, bw(f.asr), '#FFD66B');
    A.swBeam(ctx, x0 + s.w * 0.07, an.cloudY - 2, x0, an.toa - 2, bw(f.reflCloud), '#F2F4F8');
    A.swBeam(ctx, x0 + s.w * 0.17, ground - 6, x0 + s.w * 0.22, an.toa + 6, bw(f.reflClear), '#DCE8F4', { alpha: 0.7 });
    const xs = s.x + s.w * 0.52, xb = s.x + s.w * 0.66, xo = s.x + s.w * 0.80;
    A.lwBeam(ctx, xs, ground - 4, xs, an.trop + 10, bw(f.sT4), '#FF7A4A', { phase: ph });
    A.lwBeam(ctx, xb, an.trop + 14, xb, ground - 6, bw(f.G), '#FF9E6A', { phase: ph });
    A.lwBeam(ctx, xo, an.trop + 4, xo, s.y + 6, bw(f.olr), '#FF8A5C', { phase: ph });
    const sm = s.w < 420, tg = (x, y, t, c, al) => A.fluxTag(ctx, x, y, t, c, al);
    tg(x0 + 8, an.toa + 14, (sm ? '' : 'sunlight ') + f.Q.toFixed(0), '#FFD66B');
    tg(x0 - 4, an.toa - 12, (sm ? '' : 'reflected ') + f.reflected.toFixed(0), '#E8ECF4');
    tg(x0 + s.w * 0.14, ground - 20, (sm ? '' : 'absorbed ') + f.asr.toFixed(0), '#FFD66B');
    tg(xs + 9, an.trop + 34, (sm ? '' : 'surface glows ') + f.sT4.toFixed(0), '#FFB08A');
    tg(xb + 9, ground - 40, (sm ? 'back ' : 'air glows back ') + f.G.toFixed(0), '#FFC0A0');
    tg(xo - 8, s.y + 22, (sm ? 'out ' : 'heat to space ') + f.olr.toFixed(0), '#FFA07A', 'right');
    // a thermometer standing on the land, reading the surface
    A.thermometer(ctx, s.x + s.w - 20, an.trop + 8, Math.max(60, ground - an.trop - 34), S.B.T - 273.15, -40, 40, { step: 20 });
    // each part of the climate system named inside itself, with what it reflects
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const inside = (k, y, l1, l2, col) => { const a = an.xs[k][0], b = an.xs[k][1]; if (b - a < 34) return; ctx.font = mono(9.5, 700); ctx.fillStyle = col; ctx.fillText(kit().fitText(ctx, l1, b - a - 6), (a + b) / 2, y); ctx.font = mono(9, 500); ctx.fillStyle = 'rgba(220,230,245,.85)'; ctx.fillText(kit().fitText(ctx, l2, b - a - 6), (a + b) / 2, y + 12); };
    const yi = ground + 16;
    inside('sheet', yi, 'cryosphere', 'ice 0.65', '#E8F4FF');
    inside('seaice', yi, 'sea ice', '0.65', '#E8F4FF');
    inside('ocean', yi, 'hydrosphere: ocean', 'reflects 0.06', '#8FD4FA');
    inside('green', yi, 'biosphere', (p.land === 'crops' ? 'farms' : 'forest') + ' ' + BUD.LAND[p.land === 'crops' ? 'crops' : 'forest'].toFixed(2), '#9FE0B8');
    inside('desert', yi, 'desert', '0.35', '#F0D49A');
    ctx.font = mono(9.5, 700); ctx.fillStyle = '#C8B8A8'; ctx.fillText('geosphere: rock and ocean floor', s.x + s.w / 2, s.y + s.h - 16);
    ctx.fillStyle = '#AFC4FF'; ctx.fillText('atmosphere · ' + (o.air === 'none' ? 'no heat-trapping gas' : Math.round(p.co2) + ' ppm CO₂'), s.x + s.w * 0.36, (an.toa + an.trop) / 2 - 2);
    if (an.clouds.length) { ctx.fillStyle = '#F2F4F8'; ctx.fillText('clouds ' + p.cloud.toFixed(0) + ' %', an.clouds[0][0], an.cloudY + s.h * 0.06); }
    ctx.restore();
  }

  /* ---------------- the bench (tyndall, jars) ---------------- */
  function benchFrame(S, g) {
    const cam = S.cam; cam.setViewport(g.w, g.h); cam.update();
    return R3.Frame(g.ctx, cam, { floorZ: 0, ambient: 0.3 });
  }
  function labels3D(S, g, list) {
    if (!g.labels) return;
    const cam = S.cam;
    list.forEach(([at, text, dx, dy, col]) => { const q = cam.project(at); if (!q.ok || q.x < 0 || q.x > g.w) return; tag(g.ctx, q.x, q.y, dx, dy, text, col, g.w, g.h); });
  }
  const tubeDrawn = len => 0.30 + 0.38 * len;        // the tube is drawn shorter than it is: 0.3–2.4 m inside 0.4–1.2 m
  function drawTyndall(S, g) {
    const p = S.p, A = ART(), F = benchFrame(S, g), T = S.tube, ir = !!p.irView, ctx = g.ctx;
    const L = tubeDrawn(p.len), z = 0.17, x0 = 0.09, x1 = x0 + L;
    MEAS.bench(F, -0.25, x1 + 0.45, -0.32, 0.36, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.25, x1 + 0.45, 0.36, 0, 0.8);
    A.leslieCube(F, [-0.01, 0, z], 0.12, p.src, { ir, t: S.anim });
    A.tyndallTube(F, [x0, 0, z], [x1, 0, z], 0.035, { win: p.win, ir });
    A.thermopile(F, [x1 + 0.09, 0, z], { ir });
    A.galvanometer(F, [x1 + 0.2, -0.16, 0], S.needle / 90, { title: 'galvanometer', unit: 'degrees', labels: ['0', '', '45', '', '90'] });
    A.hose(F, [x1 + 0.12, 0, z - 0.02], [x1 + 0.17, -0.13, 0.12], { col: '#B8862C', sag: 0.03 });
    const gc = GASES[p.gas], cyl = [x0 + L * 0.5, 0.22, 0];
    A.gasCylinder(F, cyl, gc.col, { label: gc.f, gauge: clamp(Math.pow(10, p.lp) / 29.92 / 2, 0, 1), unit: 'atm' });
    A.hose(F, [cyl[0], cyl[1] - 0.02, 0.5], [x0 + L * 0.12, 0, z + 0.07], { col: '#C84A2C', sag: 0.04 });
    F.render();
    /* a cutaway along the tube's side: the radiation crossing it, fading as the gas takes its share */
    { const a = S.cam.project([x0 + 0.03, -0.02, z + 0.012]), b = S.cam.project([x1 - 0.03, -0.02, z + 0.012]);
      if (a.ok && b.ok) {
        const Lp = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x), hw = Math.max(4, 0.022 * a.s), keep = 1 - T.frac, reach = T.reach;
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(12,8,6,.92)'; ctx.strokeStyle = '#E8C870'; ctx.lineWidth = 1.2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(0, -hw, Lp, 2 * hw, hw); else ctx.rect(0, -hw, Lp, 2 * hw); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.rect(0, -hw, Lp, 2 * hw); ctx.clip();
        for (let j = -1; j <= 1; j++) for (let x = 0; x < Lp; x += 2) {
          const left = reach * Math.pow(keep, x / Lp), yv = j * hw * 0.5 + hw * 0.32 * Math.sin(x / 6 - S.anim * 8 + j * 2);
          ctx.fillStyle = 'rgba(255,' + (90 + 90 * left | 0) + ',60,' + (0.95 * clamp(left, 0, 1) * clamp((p.src - 20) / 80, 0.25, 1)).toFixed(2) + ')'; ctx.fillRect(x, yv - 1, 2, 2);
        }
        ctx.restore();
        if (g.w >= 640) tag(ctx, a.x + (b.x - a.x) * 0.55, a.y + (b.y - a.y) * 0.55 + hw, 10, 34, 'cutaway: ' + (T.frac * 100).toFixed(1) + ' % absorbed by the time it reaches the end', '#FFB08A', g.w, g.h);
      } }
    const len = p.len;
    labels3D(S, g, [
      [[-0.01, 0, z + 0.07], 'Leslie cube, ' + p.src.toFixed(0) + ' °C', -30, -40, '#FFB08A'],
      [[x0 + L * 0.3, 0, z + 0.035], 'brass tube, ' + len.toFixed(1) + ' m (shortened)', -20, -46, '#E8D08A'],
      [[x0, 0, z - 0.03], p.win === 'salt' ? 'rock-salt window' : 'glass window', -26, 34, '#E8ECF4'],
      [[x1 + 0.09, 0, z + 0.03], 'thermopile', 24, -40, '#DCE6F6'],
      [[cyl[0], cyl[1], 0.36], gc.name + ', ' + Math.pow(10, p.lp).toFixed(Math.pow(10, p.lp) < 3 ? 1 : 0) + ' in of mercury', 20, -30, gc.col],
      [[x1 + 0.2, -0.2, 0.12], 'deflection ' + S.needle.toFixed(1) + '°', 30, 26, '#FFD66B']
    ]);
    // drag the thermopile end to lengthen the tube; drag the cylinder's gauge to let in more gas
    const qe = S.cam.project([x1 + 0.09, 0, z]), qg = S.cam.project([cyl[0], cyl[1], 0.52]);
    if (qe.ok) { g.handle(qe.x, qe.y, 14, 'len'); S._ax = { x: S.cam.project([x1 + 0.09 + 0.1, 0, z]).x - qe.x, y: S.cam.project([x1 + 0.09 + 0.1, 0, z]).y - qe.y }; }
    if (qg.ok) g.handle(qg.x, qg.y, 14, 'gas');
  }
  function drawJars(S, g) {
    const p = S.p, A = ART(), F = benchFrame(S, g), ir = !!p.irView, ctx = g.ctx;
    const r = 0.065, H = 0.24, xA = -0.17, xB = 0.17, lampZ = 0.01 + p.dist;
    MEAS.bench(F, -0.6, 0.6, -0.34, 0.34, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.6, 0.6, 0.34, 0, 0.9);
    [[xA, S.JA, sideA(p)], [xB, S.JB, sideB(p)]].forEach(([x, J, sd]) => A.jar(F, [x, 0, 0.0], r, H, { lid: sd.lid, wall: sd.wall, gas: sd.gas, ir, airT: J.a - 273.15, cardT: J.b - 273.15 }));
    if (p.src2 === 'lamp') A.lamp(F, [0, 0, lampZ], [0, 0, 0.02], { on: true, spread: 0.26 });
    else if (p.src2 === 'off') A.lamp(F, [0, 0, lampZ], null, { on: false });
    A.probe(F, [xA, -0.24, 0], [xA, 0, H * 0.55], S.JA.a - 273.15, { title: 'A' });
    A.probe(F, [xB, -0.24, 0], [xB, 0, H * 0.55], S.JB.a - 273.15, { title: 'B', colour: '#FFD66B' });
    if (p.gasA === 'co2' || p.gasB === 'co2') A.gasCylinder(F, [0.42, 0.18, 0], GASES.CO2.col, { label: 'CO₂', r: 0.04, h: 0.36 });
    F.render();
    if (p.src2 === 'sun') {      // full sunlight from above: a bright sky, as Wood had on his roof
      const g2 = ctx.createLinearGradient(0, 0, 0, g.h * 0.5); g2.addColorStop(0, 'rgba(255,244,210,.28)'); g2.addColorStop(1, 'rgba(255,244,210,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, g.w, g.h * 0.5);
    }
    const d = sd => (sd.gas === 'co2' ? 'CO₂' : sd.gas === 'humid' ? 'humid air' : 'air') + ', ' + (sd.lid ? 'lid on' : 'open') + (sd.wall === 'salt' ? ', rock-salt' : '');
    labels3D(S, g, [
      [[xA - r, 0, H * 0.8], 'jar A: ' + d(sideA(p)), -26, -30, '#7CF0B0'],
      [[xB + r, 0, H * 0.8], 'jar B: ' + d(sideB(p)), 26, -30, '#FFD66B'],
      [[xA, 0, 0.01], 'black card ' + (S.JA.b - 273.15).toFixed(1) + ' °C', -60, 54, '#AFC0D8'],
      [[xB, 0, 0.01], 'black card ' + (S.JB.b - 273.15).toFixed(1) + ' °C', 60, 54, '#AFC0D8'],
      p.src2 === 'lamp' ? [[0, 0, lampZ + 0.05], p.watts + ' W lamp, ' + (p.dist * 100).toFixed(0) + ' cm above the cards', 30, -24, '#FFE6A0'] : [[0, 0, H + 0.1], p.src2 === 'sun' ? 'full sunlight, 1000 W/m²' : 'lamp off', 30, -24, '#FFE6A0']
    ]);
    const q = S.cam.project([0, 0, lampZ + 0.03]);
    if (q.ok && p.src2 === 'lamp') { g.handle(q.x, q.y, 16, 'lamp'); const q2 = S.cam.project([0, 0, lampZ + 0.13]); S._ax = { x: q2.x - q.x, y: q2.y - q.y }; }
  }

  /* ---------------- feedback ---------------- */
  function drawFeedback(S, g) {
    const ctx = g.ctx, p = S.p, A = ART(), W = g.w, H = g.h, narrow = W < 640, T = S.Tlat, base = S.base;
    A.space(ctx, 0, 0, W, H, 5);
    const R = narrow ? Math.min(W * 0.3, (H - 160) * 0.3) : Math.min(H * 0.27, W * 0.18), cx = narrow ? W * 0.55 : W * 0.40, cy = narrow ? 58 + 40 + R + 12 : H * 0.54;
    const edge = iceEdge(T);
    const TC = [[-40, [150, 190, 255]], [-10, [215, 232, 255]], [10, [240, 236, 214]], [30, [255, 176, 112]]], tcol = v => { for (let i = 1; i < TC.length; i++) if (v <= TC[i][0]) { const u = clamp((v - TC[i - 1][0]) / (TC[i][0] - TC[i - 1][0]), 0, 1); return TC[i - 1][1].map((c, k) => c + (TC[i][1][k] - c) * u); } return TC[TC.length - 1][1]; };
    const tint = p.tint ? (lat) => { const x = Math.abs(Math.sin(lat * Math.PI / 180)), i = clamp(Math.floor(x * EBM.N), 0, EBM.N - 1), c = tcol(T[i]); return [c[0], c[1], c[2], 0.30]; } : null;
    const sr = clamp(14 * Math.sqrt(p.sun / 100), 8, 22), sx = narrow ? W * 0.12 : W * 0.08, sy = cy - R * 0.5;
    A.sun(ctx, sx, sy, sr, { spots: 0.2 });
    g.handle(sx, sy, sr + 8, 'fsun');
    const G = globe(S, g, cx, cy, R, { spin: 0.6, overlay: A.weather({ cloud: 0.5, iceN: edge, iceS: edge, tint, shift: S.anim * 2 }) });
    if (G) {
      A.shell(ctx, G.cx, G.cy, G.R, { trap: 0.4 + 0.1 * Math.log(p.fco2 / 280) });
      // heat carried poleward: arrows along the meridians, as wide as the flux at 35°
      if (p.transport) {
        const i35 = Math.round(Math.sin(35 * Math.PI / 180) * EBM.N), x = i35 / EBM.N, flux = -EBM.D * (1 - x * x) * (T[i35] - T[i35 - 1]) * EBM.N, wdt = clamp(flux * 0.22, 0.8, 5), PW = TAU * 6.371e6 * 6.371e6 * flux * 1e-15;
        const vl = (Math.atan2(S.cam.eye[1], S.cam.eye[0]) - 0.6 - S.anim * 0.04) * 180 / Math.PI;
        [-38, 0, 38].forEach(dl => [1, -1].forEach(sg => { const lon = vl + dl;
          const pts = []; for (let la = 12; la <= 62; la += 5) { const q = G.at(sg * la, lon, 1.03); if (!q.front) return; pts.push(q); }
          if (pts.length < 4) return;
          ctx.save(); ctx.strokeStyle = 'rgba(255,170,110,.85)'; ctx.lineWidth = wdt; ctx.lineCap = 'round'; ctx.beginPath(); pts.slice(0, -1).forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); ctx.restore();
          const a = pts[pts.length - 2], b = pts[pts.length - 1]; A.arrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), wdt + 4, '#FFB080');
        }));
        if (!narrow) { const q = G.at(38, vl + 30, 1.05); if (q.front) tag(ctx, q.x, q.y, 70, 30, 'heat carried poleward at 35°: ' + PW.toFixed(1) + ' PW', '#FFB080', W, H); }
      }
      // the ice line, on the side that faces us
      const vl2 = (Math.atan2(S.cam.eye[1], S.cam.eye[0]) - 0.6 - S.anim * 0.04) * 180 / Math.PI, qe = G.at(edge, vl2 + 25, 1.0);
      if (edge > 1 && edge < 89.5) tag(ctx, qe.x, qe.y, narrow ? -20 : -110, -26, 'ice edge ' + edge.toFixed(0) + '° (' + (iceEdge(base.T)).toFixed(0) + '° at the start)', '#E8F4FF', W, H);
      else if (edge <= 1) tag(ctx, G.cx, G.cy, G.R * 0.8, -G.R * 0.6, 'a snowball: ice to the equator', '#E8F4FF', W, H);
      else tag(ctx, G.cx, G.cy - G.R, 30, -10, 'no ice left at all', '#FFB08A', W, H);
      if (!narrow) { const q = G.at(0, vl2 - 25, 1.0); tag(ctx, q.x, q.y, -60, 26, 'equator ' + T[0].toFixed(1) + ' °C', '#FFD66B', W, H); const qp = G.at(84, vl2, 1.0); tag(ctx, qp.x, qp.y, 130, 22, 'pole ' + T[EBM.N - 1].toFixed(1) + ' °C', '#AFC4FF', W, H); }
    }
  }

  /* ---------------- causes: the land since 1850 ---------------- */
  let LAND = null;
  function landBlock() {
    if (LAND || !window.TERRAIN) return LAND;
    LAND = TERRAIN.block({ n: 44, size: 44, zBase: -3, height: (x, y) => {
      const vol = 7.5 * Math.exp(-((x + 13) * (x + 13) + (y - 12) * (y - 12)) / 30), hills = 0.6 * Math.sin(x * 0.35) * Math.cos(y * 0.3) + 0.5;
      const sea = x > 11 ? -(x - 11) * 0.45 : 0;
      return Math.max(-4, vol + (x > 11 ? sea : hills * clamp((11 - x) / 6, 0, 1)) + 0.4);
    } });
    return LAND;
  }
  const noise2 = (i, j) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
  function causeAt(S) {                                        // the year's own numbers, interpolated
    const R = S.run, y = S.year, i = clamp(Math.floor(y - 1750), 0, R.rows.length - 1), j = Math.min(R.rows.length - 1, i + 1), u = y - Math.floor(y);
    const li = (a) => a[i] + (a[j] - a[i]) * u;
    return { i, row: R.rows[i], T: li(R.T), y };
  }
  function drawCauses(S, g) {
    const ctx = g.ctx, p = S.p, A = ART(), W = g.w, H = g.h, cam = S.cam, TR = window.TERRAIN, narrow = W < 640;
    const C = causeAt(S), y = S.year, row = C.row, aer = Math.abs(row.F.aerosol);
    // the sky: hazier as the aerosols thicken
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, '#2E5A9A'); sky.addColorStop(1, RX.mix('#A8C8E8', '#C8BCA8', clamp(aer / 1.3, 0, 1) * 0.6));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const tsi = tsiAt(y), sx = W * (narrow ? 0.5 : 0.56), syy = narrow ? 112 : 96;
    A.sun(ctx, sx, syy, narrow ? 12 : 18, { spots: p.sunF ? clamp((tsi + 0.35) / 1.3, 0, 1) : 0.2 });
    if (!TR) return;
    cam.setViewport(W, narrow ? H * 0.8 : H); cam.update();
    const B = landBlock(), clearFrac = p.clearing ? clamp((y - 1750) / (2023 - 1750), 0, 1) * 0.65 : 0;
    const items = [], t = S.anim;
    const fossilK = p.fossil ? (lerpT(FOSSIL, y) - lerpT(CEMENT, y)) / 9.6 : 0, cementK = p.cement ? lerpT(CEMENT, y) / 0.45 : 0;
    const zAt = (x, yy) => B.zAt(x, yy);
    if (fossilK > 0.004) items.push({ at: [6, 6, zAt(6, 6)], draw: (c, q) => A.powerStation(c, q, 1.6 * q.s * clamp(0.6 + fossilK * 0.4, 0.6, 1), { on: true, t, k: fossilK }) });
    if (cementK > 0.01 || !p.cement) items.push({ at: [3, -9, zAt(3, -9)], draw: (c, q) => A.cementWorks(c, q, 1.3 * q.s, { on: cementK > 0.01, glow: cementK > 0.01, t }) });
    if (p.farming) items.push({ at: [-4, -2, zAt(-4, -2)], draw: (c, q) => A.cattle(c, q, 0.9 * q.s, Math.round(3 + 9 * clamp((y - 1850) / 170, 0, 1)), 5) });
    // the forest, cleared from the lowlands first
    for (let i = 0; i < 70; i++) {
      const fx = -18 + (i % 10) * 2.6 + noise2(i, 1) * 1.6, fy = -18 + Math.floor(i / 10) * 2.4 + noise2(i, 2) * 1.6;
      if (fx > 9 || (Math.hypot(fx + 13, fy - 12) < 6)) continue;
      const cleared = noise2(i, 3) < clearFrac;
      items.push({ at: [fx, fy, zAt(fx, fy)], draw: (c, q) => { if (cleared) { c.fillStyle = '#5A3E26'; c.fillRect(q.x - 1.5, q.y - 2, 3, 2); } else TR.tree(c, q.x, q.y, 1.6 * q.s, { kind: i % 3 ? 'broad' : 'conifer', seed: i }); } });
    }
    // the town by the coast, growing
    const nH = Math.round(4 + 18 * clamp((y - 1850) / 173, 0, 1));
    for (let k = 0; k < nH; k++) { const hx = 7 + (k % 4) * 1.1, hy = -2 - Math.floor(k / 4) * 1.4; items.push({ at: [hx, hy, zAt(hx, hy)], draw: () => TR.house(ctx, cam, [hx, hy, zAt(hx, hy)], 0.7, { rot: 0.2, roof: k % 3 ? '#A5452F' : '#5D6B7C' }) }); }
    // a volcano's veil, when one has just gone off
    let volk = 0, volName = ''; VOLCANOES.forEach(([y0, P, nm]) => { const dt = y - y0; if (dt > -0.05 && dt < 2.5 && p.volcano) { const k = P / 0.15 * Math.exp(-Math.max(0, dt) / 0.6); if (k > volk) { volk = k; volName = nm; } } });
    items.push({ at: [-13, 12, zAt(-13, 12) + 0.2], draw: (c, q) => A.eruption(c, q, 1.6 * q.s, clamp(volk, 0, 1.2), t) });
    TR.draw(ctx, cam, B, {
      cover: (i, j, x, yy, z) => {
        if (z < 0.05 && x > 10.5) return [214, 200, 160];
        if (Math.hypot(x + 13, yy - 12) < 5.5) return z > 5 ? [96, 84, 78] : [118, 104, 88];
        if (p.farming && x > -9 && x < -1 && yy > -14 && yy < -6) return [96, 150, 140];          // paddies, flooded
        if (x < 9 && noise2(i, j) < clearFrac * 1.2 && yy < 8) return [176, 160, 92];
        return [70 + 20 * noise2(i, j), 122 + 16 * noise2(j, i), 64];
      },
      water: (i, j, x) => x > 10.5 ? 0.0 : null, waterCol: dep => [40 + 30 / (1 + dep), 110, 160], deepAt: 3,
      items, sea: 0,
      layers: [{ col: [120, 92, 64], pat: 'soil', top: (x, yy, zs) => zs }, { col: [100, 96, 104], pat: 'rock', top: (x, yy, zs) => zs - 1.2 }]
    });
    // haze over everything, as thick as the aerosol veil
    if (aer > 0.05) { const hz = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.75); hz.addColorStop(0, 'rgba(200,190,170,0)'); hz.addColorStop(1, 'rgba(200,190,170,' + clamp(aer * 0.22, 0, 0.3).toFixed(2) + ')'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H); }
    labels3D(S, g, [
      fossilK > 0.004 ? [[6, 6, zAt(6, 6) + 2.5], 'power station: ' + (lerpT(FOSSIL, y) - lerpT(CEMENT, y)).toFixed(2) + ' GtC a year (all fossil fuel)', 30, -40, '#FFB08A'] : null,
      [[3, -9, zAt(3, -9) + 1.2], p.cement ? 'cement kiln: ' + (lerpT(CEMENT, y) * 1000).toFixed(0) + ' MtC a year' : 'cement: off', -40, -40, '#E8DCC8'],
      p.farming ? [[-5, -10, zAt(-5, -10)], 'paddies and cattle: methane ' + (lerpT(CH4_E, y) * (1 - lerpT(CH4_FOSSIL, y))).toFixed(0) + ' Mt a year', -40, 34, '#9FE0B8'] : null,
      p.clearing ? [[-14, -14, zAt(-14, -14)], 'forest cleared: ' + lerpT(LANDUSE, y).toFixed(2) + ' GtC a year', 30, -50, '#E8D08A'] : null,
      volk > 0.05 ? [[-13, 12, 9], volName + ' erupts', 30, -20, '#E8E2D8'] : null
    ].filter(Boolean));
    // the year's thermometer and the timeline
    const tx = narrow ? W - 44 : W - 70, ty = narrow ? 100 : 80, th = narrow ? 150 : Math.min(240, H - 170);
    A.thermometer(ctx, tx, ty, th, C.T, -0.5, 1.5, { step: 0.5 });
    ctx.save(); ctx.font = mono(narrow ? 9 : 10, 700); ctx.fillStyle = '#FFE0D0'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.8)';
    const tt = (C.T >= 0 ? '+' : '') + C.T.toFixed(2) + ' °C'; ctx.strokeText(tt, tx, ty + th + 14); ctx.fillText(tt, tx, ty + th + 14); ctx.restore();
    const lx = 20, lw = W - 40 - (narrow ? 60 : 110), ly = H - (narrow ? 80 : 52);
    ctx.save(); ctx.fillStyle = 'rgba(5,8,15,.65)'; ctx.fillRect(lx - 8, ly - 14, lw + 16, 26);
    ctx.strokeStyle = 'rgba(200,215,240,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + lw, ly); ctx.stroke();
    ctx.font = mono(9, 500); ctx.fillStyle = '#AFC0D8'; ctx.textAlign = 'center';
    for (let yr = 1850; yr <= 2020; yr += narrow ? 50 : 25) { const xx = lx + (yr - 1850) / 173 * lw; ctx.fillRect(xx - 0.5, ly - 4, 1, 8); ctx.fillText(String(yr), xx, ly + 10); }
    VOLCANOES.forEach(([y0]) => { if (y0 < 1850) return; const xx = lx + (y0 - 1850) / 173 * lw; ctx.fillStyle = '#C8C0B8'; ctx.beginPath(); ctx.moveTo(xx, ly - 3); ctx.lineTo(xx - 3, ly - 9); ctx.lineTo(xx + 3, ly - 9); ctx.closePath(); ctx.fill(); });
    ctx.restore();
    const hx = lx + (y - 1850) / 173 * lw; g.handle(hx, ly, 11, 'year'); S._yr = { lx, lw };
  }

  /* ---------------- timescales ---------------- */
  function drawTimescales(S, g) {
    const ctx = g.ctx, p = S.p, A = ART(), W = g.w, H = g.h, narrow = W < 640, R = S.kick, now = kickAt(R, S.tk);
    const top = 62, oc = A.oceanSection(ctx, 0, top, W, H - top - (narrow ? 92 : 62), { T: now[1], TD: now[2], t: S.anim, flux: 0.73 * (now[1] - now[2]) });
    const skyMid = (top + oc.ys) / 2, cx = narrow ? W * 0.32 : W * 0.3;
    // the push, drawn where it happens
    if (p.kick === 'volcano') {
      const k = clamp(Math.max(0, -now[3]) / 3, 0, 1.2);
      A.volcano(ctx, cx, oc.ys + 2, 200, 70, k);
      A.eruption(ctx, { x: cx, y: oc.ys - 66 }, 40, k, S.anim);
      const veil = clamp(-now[3] / 4, 0, 0.6); if (veil > 0.01) { ctx.fillStyle = 'rgba(220,214,200,' + veil.toFixed(2) + ')'; ctx.fillRect(0, top + 6, W, 18); tag(ctx, W * 0.45, top + 15, 10, 22, 'sulfate veil: optical depth ' + (-now[3] / 20).toFixed(3), '#E8E2D8', W, H); }
    } else if (p.kick === 'sun') {
      const ph = Math.sin(TAU * S.tk / 11); A.sun(ctx, cx, skyMid, 26, { spots: 0.5 + 0.5 * ph, glow: ph * 0.3 });
      tag(ctx, cx + 26, skyMid, 50, -10, 'sunspot cycle: ' + (ph >= 0 ? 'toward maximum' : 'toward minimum'), '#FFD66B', W, H);
    } else if (p.kick === 'pulse' || p.kick === 'steady') {
      const on = p.kick === 'pulse' ? S.tk < 1 : S.tk < p.years;
      A.powerStation(ctx, { x: cx, y: oc.ys - 2 }, 34, { on, t: S.anim, k: 1 });
      const left = p.kick === 'pulse' ? irf(S.tk) : null;
      const gx = W * (narrow ? 0.8 : 0.6), gy = top + 14, gh = oc.ys - top - 28;
      if (left != null) {
        ctx.save(); ctx.fillStyle = 'rgba(5,8,15,.6)'; ctx.fillRect(gx - 10, gy - 4, 34, gh + 8); ctx.fillStyle = '#FFD66B'; ctx.fillRect(gx, gy + gh * (1 - left), 14, gh * left); ctx.strokeStyle = '#DCE6F6'; ctx.strokeRect(gx, gy, 14, gh); ctx.restore();
        tag(ctx, gx, gy + gh * (1 - left), -20, 10, Math.round(left * 100) + ' % of the CO₂ still in the air', '#FFD66B', W, H);
      }
    } else {
      // the orbit: an ellipse, and the Earth's tilt nodding over 41,000 years
      const ox = cx, oy = skyMid, a = narrow ? 60 : 90, b = a * 0.35, tilt = 23.4 + 1.2 * Math.sin(TAU * S.tk / 41000);
      ctx.save(); ctx.strokeStyle = 'rgba(200,215,240,.5)'; ctx.beginPath(); ctx.ellipse(ox, oy, a, b, 0, 0, TAU); ctx.stroke(); ctx.restore();
      A.sun(ctx, ox + a * 0.12, oy, 10, {});
      const ex = ox + a * Math.cos(S.anim * 0.6), ey = oy + b * Math.sin(S.anim * 0.6);
      RX.ball(ctx, ex, ey, 7, '#3A7AC8', {}); ctx.save(); ctx.strokeStyle = '#E8F0FF'; ctx.translate(ex, ey); ctx.rotate(tilt * Math.PI / 180); ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke(); ctx.restore();
      tag(ctx, ex, ey, 40, -16, 'tilt ' + tilt.toFixed(1) + '°', '#AFC4FF', W, H);
    }
    tag(ctx, W * 0.12, (oc.ys + oc.yMix) / 2, 24, 0, 'upper ocean, 70 m: ' + (now[1] >= 0 ? '+' : '') + now[1].toFixed(2) + ' °C', '#FFE0C8', W, H);
    tag(ctx, W * 0.12, oc.yMix + 40, 24, 10, 'deep ocean, 3,000 m: ' + (now[2] >= 0 ? '+' : '') + now[2].toFixed(3) + ' °C', '#C8DCFF', W, H);
    // the clock: time since the push, on a scale of powers of ten
    const lx = 20, lw = W - 40, ly = H - (narrow ? 78 : 48), t0 = -1.5, t1 = p.kick === 'orbit' ? 5 : 4;
    ctx.save(); ctx.fillStyle = 'rgba(5,8,15,.85)'; ctx.fillRect(0, ly - 14, W, 32);
    ctx.strokeStyle = 'rgba(200,215,240,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + lw, ly); ctx.stroke();
    ctx.font = mono(9, 500); ctx.fillStyle = '#AFC0D8'; ctx.textAlign = 'center';
    const lab = { '-1': 'a month', 0: 'a year', 1: '10 years', 2: 'a century', 3: '1,000 y', 4: '10,000 y', 5: '100,000 y' };
    for (let e = -1; e <= t1; e++) { const xx = lx + (e - t0) / (t1 - t0) * lw; ctx.fillRect(xx - 0.5, ly - 4, 1, 8); if (!narrow || e % 2 === 0) ctx.fillText(lab[e], xx, ly + 12); }
    const hx = lx + (S.logt - t0) / (t1 - t0) * lw; ctx.fillStyle = '#FFD66B'; ctx.beginPath(); ctx.arc(hx, ly, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !ART()) return;
    if (p.setup === 'budget') drawBudget(S, g);
    else if (p.setup === 'tyndall') drawTyndall(S, g);
    else if (p.setup === 'jars') drawJars(S, g);
    else if (p.setup === 'feedback') drawFeedback(S, g);
    else if (p.setup === 'causes') drawCauses(S, g);
    else drawTimescales(S, g);
    cards(S, g);
    const Hh = headerOf(S); K.header(g, Hh[0], Hh[1], Hh[2]);
  }

  /* ============================================================
     CARDS AND THE HEADER
     ============================================================ */
  function drawRows(ctx, x, y, w, rows, cols) {
    rows.forEach((row, i) => row.forEach((cell, j) => {
      const c = typeof cell === 'object' ? cell : { t: String(cell) };
      ctx.fillStyle = c.col || (j === 0 ? '#DCE6F6' : '#AFC0D8'); ctx.font = c.bold ? mono(10.5, 700) : mono(10, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const cx = x + cols[j] * w, cw = ((cols[j + 1] == null ? 1 : cols[j + 1]) - cols[j]) * w - 4;
      ctx.fillText(kit().fitText(ctx, c.t, cw), cx, y + i * 15);
    }));
  }
  function box(S, g, title, rows, cols, at) {
    const K = kit(), ctx = g.ctx, wideW = Math.min(330, g.w * 0.3), h = 30 + rows.length * 15 + 4;
    const r = K.cardSlot(g, S, title, wideW, Object.assign({ x: 10, y: g.h - 30 - h - 6 }, at && at(h)));
    if (!r) return;
    K.card(ctx, r.x, r.y, r.w, h);
    ctx.save(); ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
    drawRows(ctx, r.x + 10, r.y + 28, r.w - 20, rows, cols);
    ctx.restore();
  }
  const ROWC = [0, 0.5];
  function cards(S, g) {
    const p = S.p;
    if (p.setup === 'budget') {
      const o = budgetOpts(p), f = fluxes(o, S.B.T), A = f.A;
      box(S, g, 'The planet’s books, W/m²', [
        [{ t: 'by clouds', bold: true }, { t: (o.cloud * A.cld * f.Q).toFixed(0), col: '#F2F4F8' }],
        [{ t: 'by clear air', bold: true }, (BUD.ray * (1 - o.cloud) * f.Q).toFixed(0)],
        [{ t: 'by the ground', bold: true }, ((1 - o.cloud) * BUD.t2 * A.as * f.Q).toFixed(0) + ' (its albedo ' + A.as.toFixed(3) + ')'],
        [{ t: 'absorbed', bold: true }, { t: f.asr.toFixed(0) + ' (planet’s albedo ' + A.ap.toFixed(3) + ')', col: '#FFD66B' }],
        [{ t: 'surface glows', bold: true }, f.sT4.toFixed(0) + ' at ' + cdeg(S.B.T)],
        [{ t: 'heat to space', bold: true }, f.olr.toFixed(0) + ': ' + f.window.toFixed(0) + ' from the ground, ' + f.airOut.toFixed(0) + ' from the air'],
        [{ t: 'kept back', bold: true }, { t: f.G.toFixed(0) + ': the greenhouse effect', col: '#FF9E6A' }],
        [{ t: 'imbalance', bold: true }, { t: (f.N >= 0 ? '+' : '') + f.N.toFixed(2) + ': ' + (Math.abs(f.N) < 0.05 ? 'balanced' : f.N > 0 ? 'warming' : 'cooling'), col: Math.abs(f.N) < 0.05 ? '#9FE0B8' : f.N > 0 ? '#FF8A80' : '#8FB4FF' }]
      ], [0, 0.34], h => ({ x: 10, y: g.h - 34 - h }));
    } else if (p.setup === 'tyndall') {
      const T = S.tube;
      box(S, g, 'What the thermopile reads', [
        [{ t: 'gas', bold: true }, { t: GASES[p.gas].name + ', ' + Math.pow(10, p.lp).toFixed(1) + ' in Hg', col: GASES[p.gas].col }],
        [{ t: 'through the windows', bold: true }, Math.round(T.reach * 100) + ' % of the cube’s radiation'],
        [{ t: 'stopped by the gas', bold: true }, { t: (T.frac * 100).toFixed(1) + ' %', col: '#FFD66B' }],
        [{ t: 'thermopile', bold: true }, (T.mV).toFixed(3) + ' mV'],
        [{ t: 'warming power', bold: true }, GASES[p.gas].gwp == null ? 'short-lived: follows temperature' : GASES[p.gas].gwp ? 'GWP-100 = ' + GASES[p.gas].gwp.toLocaleString('en-US') + ' (CO₂ = 1)' : 'none']
      ], [0, 0.46]);
    } else if (p.setup === 'jars') {
      const rA = S.JA.a - 273.15 - JAR.room, rB = S.JB.a - 273.15 - JAR.room;
      box(S, g, 'After ' + (S.JA.t / 60).toFixed(0) + ' minutes', [
        [{ t: '', bold: true }, { t: 'jar A', bold: true, col: '#7CF0B0' }, { t: 'jar B', bold: true, col: '#FFD66B' }],
        ['gas', sideA(p).gas, sideB(p).gas],
        ['lid', sideA(p).lid ? 'on' : 'off', sideB(p).lid ? 'on' : 'off'],
        ['air rose', '+' + rA.toFixed(1) + ' °C', '+' + rB.toFixed(1) + ' °C'],
        ['difference', '', { t: (rB - rA >= 0 ? '+' : '') + (rB - rA).toFixed(1) + ' °C (B − A)', col: '#FFD66B' }]
      ], [0, 0.34, 0.67]);
    } else if (p.setup === 'feedback') {
      const fb = fbLedger(S);
      box(S, g, 'Each part, per kelvin of warming', [
        [{ t: 'heat radiated', bold: true }, '−3.22 W/m² (always)'],
        [{ t: 'water vapour', bold: true }, { t: p.wvFb ? '+1.30 W/m² kept' : 'switched off', col: p.wvFb ? '#8FD4FA' : '#6A7690' }],
        [{ t: 'clouds', bold: true }, { t: p.cloudFb ? '+0.42 W/m² kept' : 'switched off', col: p.cloudFb ? '#F2F4F8' : '#6A7690' }],
        [{ t: 'ice melting', bold: true }, { t: p.iceFb ? 'the ice line moves' : 'ice fixed in place', col: p.iceFb ? '#E8F4FF' : '#6A7690' }],
        [{ t: '2 × CO₂ gives', bold: true }, { t: '+' + fb.toFixed(2) + ' °C', col: '#FFD66B' }]
      ], [0, 0.42]);
      const T = S.Tlat, m = meanOf(T), e = iceEdge(T), dm = m - S.base.mean, i35 = Math.round(Math.sin(35 * Math.PI / 180) * EBM.N), x35 = i35 / EBM.N;
      const PW = p.transport ? TAU * 6.371e6 * 6.371e6 * EBM.D * (1 - x35 * x35) * (T[i35 - 1] - T[i35]) * EBM.N * 1e-15 : 0;
      box(S, g, 'The subsystems, now', [
        [{ t: 'cryosphere', bold: true }, { t: 'ice on ' + (100 * (1 - Math.sin(e * Math.PI / 180))).toFixed(1) + ' % of the planet', col: '#E8F4FF' }],
        [{ t: 'atmosphere', bold: true }, { t: (p.wvFb ? (dm >= 0 ? '+' : '') + (100 * (Math.exp(0.067 * dm) - 1)).toFixed(0) + ' % water vapour' : 'water vapour held fixed'), col: '#8FD4FA' }],
        [{ t: 'transport', bold: true }, { t: p.transport ? PW.toFixed(1) + ' PW carried past 35°' : 'no heat carried poleward', col: '#FFB080' }],
        [{ t: 'surface', bold: true }, { t: 'absorbs ' + (100 * (1 - (p.iceFb ? iceAlbedoMean(T) : iceAlbedoMean(S.base.T)))).toFixed(1) + ' % of sunlight', col: '#FFD66B' }]
      ], [0, 0.34], h => ({ x: g.w - Math.min(330, g.w * 0.3) - 10, y: 66 }));
    } else if (p.setup === 'causes') {
      const C = causeAt(S), F = C.row.F, hum = F.co2Fossil + F.co2Cement + F.co2Land + F.ch4 + F.n2o + F.other + F.aerosol + F.albedo, nat = F.solar - 20 * (aodAt(S.year) - 0.0);
      box(S, g, Math.floor(S.year) + ': the push on the climate', [
        [{ t: 'CO₂', bold: true }, C.row.C.toFixed(0) + ' ppm → ' + (F.co2Fossil + F.co2Cement + F.co2Land).toFixed(2) + ' W/m²'],
        [{ t: 'methane, N₂O', bold: true }, C.row.M.toFixed(0) + ' ppb, ' + C.row.N.toFixed(0) + ' ppb → ' + (F.ch4 + F.n2o).toFixed(2)],
        [{ t: 'haze', bold: true }, { t: F.aerosol.toFixed(2) + ' W/m² (cools)', col: '#8FB4FF' }],
        [{ t: 'all human', bold: true }, { t: (hum >= 0 ? '+' : '') + hum.toFixed(2) + ' W/m²', col: '#FF8A80' }],
        [{ t: 'Sun and volcanoes', bold: true }, { t: (nat >= 0 ? '+' : '') + nat.toFixed(2) + ' W/m²', col: '#FFD66B' }]
      ], [0, 0.36], h => ({ x: 10, y: 66 }));
    } else if (p.setup === 'timescales') {
      const R = S.kick;
      box(S, g, 'This push, followed', [
        [{ t: 'biggest change', bold: true }, { t: (R.peak >= 0 ? '+' : '') + R.peak.toFixed(2) + ' °C', col: '#FFD66B' }],
        [{ t: 'reached after', bold: true }, ago(R.peakT)],
        [{ t: 'fastest', bold: true }, R.maxRate.toFixed(2) + ' °C a century'],
        [{ t: 'left after 1,000 y', bold: true }, (kickAt(R, 1000)[1] >= 0 ? '+' : '') + kickAt(R, 1000)[1].toFixed(2) + ' °C']
      ], [0, 0.42], h => ({ x: g.w - Math.min(330, g.w * 0.3) - 10, y: 66 }));
    }
  }
  function respTime(o, T) { const lam = -(fluxes(o, T + 0.5).N - fluxes(o, T - 0.5).N); return heatCap(o.mix) / Math.max(0.05, lam) / YR; }
  const ago = t => t < 1 ? Math.round(t * 12) + ' months' : t < 100 ? t.toFixed(t < 10 ? 1 : 0) + ' years' : Math.round(t).toLocaleString('en-US') + ' years';
  function iceAlbedoMean(T) { let s = 0; for (let i = 0; i < EBM.N; i++) s += iceA(T[i], EBX[i]); return s / EBM.N; }
  const FBL = {};
  function fbLedger(S) { const o = fbOpts(S.p), k = [o.transport, o.ice, o.wv, o.clouds].join('|'); if (FBL[k] == null) FBL[k] = ecsOf(o); return FBL[k]; }

  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'budget') {
      const o = budgetOpts(p), f = fluxes(o, S.B.T);
      return ['Sunlight in ' + f.asr.toFixed(0) + ', heat out ' + f.olr.toFixed(0) + ' W/m² — the surface at ' + cdeg(S.B.T),
        'year ' + S.B.t.toFixed(1) + ' · settles at ' + cdeg(S.Teq) + ' · ' + (o.air === 'none' ? 'no heat-trapping gases' : Math.round(p.co2) + ' ppm CO₂') + ' · clouds ' + p.cloud.toFixed(0) + ' % · ice ' + p.ice.toFixed(0) + ' %',
        Math.abs(f.N) < 0.05 ? 'balanced: as much energy leaves as arrives' : f.N > 0 ? 'more arrives than leaves: the planet warms until it glows enough' : 'more leaves than arrives: the planet cools'];
    }
    if (p.setup === 'tyndall') {
      const T = S.tube, g = GASES[p.gas];
      return ['Tyndall’s tube, ' + g.name + ': ' + (T.frac * 100).toFixed(1) + ' % of the radiant heat stopped',
        p.len.toFixed(1) + ' m tube · ' + Math.pow(10, p.lp).toFixed(1) + ' in of mercury · cube at ' + p.src.toFixed(0) + ' °C · ' + (p.win === 'salt' ? 'rock-salt' : p.win === 'glass' ? 'glass' : 'no') + ' windows',
        !g.bands.length ? 'nitrogen, oxygen and argon — 99 % of the air — let the heat through' : p.win === 'glass' ? 'glass windows stop the heat themselves: almost nothing reaches the gas' : 'it absorbs only in its own bands of the infrared'];
    }
    if (p.setup === 'jars') {
      const rA = S.JA.a - 273.15 - JAR.room, rB = S.JB.a - 273.15 - JAR.room;
      return ['Two jars ' + (p.src2 === 'sun' ? 'in full sunlight' : p.src2 === 'lamp' ? 'under a ' + p.watts + ' W lamp' : 'with the lamp off') + ': A +' + rA.toFixed(1) + ' °C, B +' + rB.toFixed(1) + ' °C',
        (S.JA.t / 60).toFixed(1) + ' minutes · room 20 °C · A: ' + sideA(p).gas + (sideA(p).lid ? ', lid' : ', open') + ' · B: ' + sideB(p).gas + (sideB(p).lid ? ', lid' : ', open'),
        sideA(p).lid !== sideB(p).lid ? 'a lid on or off matters more than any gas: it stops the warm air rising away' : 'the jar measures stopped air movement more than trapped heat'];
    }
    if (p.setup === 'feedback') {
      const m = meanOf(S.Tlat), e = iceEdge(S.Tlat);
      return ['A planet in bands, year ' + S.year.toFixed(0) + ': ' + m.toFixed(1) + ' °C on average, ' + (e < 1 ? 'frozen to the equator' : e > 89.5 ? 'no ice' : 'ice from ' + e.toFixed(0) + '°'),
        Math.round(p.fco2) + ' ppm CO₂ · Sun at ' + p.sun.toFixed(0) + ' % · ' + ['iceFb', 'wvFb', 'cloudFb', 'transport'].filter(k => p[k]).length + ' of 4 parts working',
        (m - S.base.mean >= 0 ? '+' : '') + (m - S.base.mean).toFixed(2) + ' °C from the start · ' + (p.iceFb ? 'melting ice darkens the planet, which warms more' : 'the ice is held in place: no ice feedback')];
    }
    if (p.setup === 'causes') {
      const C = causeAt(S), ob = lerpT(HADCRUT, S.year);
      return [Math.floor(S.year) + ': the model ' + (C.T >= 0 ? '+' : '') + C.T.toFixed(2) + ' °C, measured ' + (ob >= 0 ? '+' : '') + ob.toFixed(2) + ' °C (decade mean)',
        'CO₂ ' + C.row.C.toFixed(0) + ' ppm · methane ' + C.row.M.toFixed(0) + ' ppb · climate sensitivity ' + p.ecs.toFixed(1) + ' °C per doubling',
        ACTS.filter(k => !causeOpts(p)[k]).length ? 'switched off: ' + ACTS.filter(k => !causeOpts(p)[k]).map(k => ACT_NAME[k]).join(', ') : 'every human and natural cause on'];
    }
    const R = S.kick, now = kickAt(R, S.tk);
    return [KICK_NAME[p.kick] + ': ' + (now[1] >= 0 ? '+' : '') + now[1].toFixed(2) + ' °C after ' + ago(S.tk),
      'biggest ' + (R.peak >= 0 ? '+' : '') + R.peak.toFixed(2) + ' °C at ' + ago(R.peakT) + ' · climate sensitivity ' + p.ecsK.toFixed(1) + ' °C',
      p.kick === 'pulse' || p.kick === 'steady' ? 'the ocean takes centuries to warm through; the CO₂ stays far longer' : p.kick === 'volcano' ? 'a veil that falls out within two years: the cooling goes with it' : p.kick === 'sun' ? 'eleven years up and down: the ocean averages most of it away' : 'tens of thousands of years: slow enough for the deep ocean to keep up'];
  }
  const ACT_NAME = { fossil: 'fossil fuel', cement: 'cement', farming: 'farming', clearing: 'clearing', haze: 'haze', other: 'CFCs & ozone', sun: 'the Sun', volcano: 'volcanoes' };
  const KICK_NAME = { volcano: 'An eruption', sun: 'The Sun’s cycle', pulse: 'A pulse of CO₂', steady: 'A century of emissions, then none', orbit: 'An orbital cycle' };

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'budget') {
      const H = S.hist, tmax = Math.max(10, S.B.t * 1.1), Tq = S.Teq - 273.15, items = [{ c: '#FF8A5C', label: 'surface temperature' }, { c: '#9FE0B8', label: 'where it settles', dash: [5, 4] }];
      const Kk = K.plotKey(g, items), ys = H.map(q => q[1]).concat([Tq]), lo = Math.min(...ys) - 1, hi = Math.max(...ys) + 1;
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'years', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(Tq, '#9FE0B8', [5, 4]); P.line(H.map(q => [q[0], q[1]]), '#FF8A5C', 2.5); const q = H[H.length - 1]; if (q) P.dot(q[0], q[1], 4.5, '#FF8A5C'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'tyndall') {
      const o = tubeOpts(p), sp = spectrum(o.src), gas = GASES[p.gas], cut = { salt: 16, glass: 2.7, none: 30 }[p.win], u = o.p * o.len, pk = Math.max(...sp.pts.map(q => q[1]));
      const items = [{ c: '#FF8A5C', label: 'the cube’s radiation' }, { c: gas.col, label: 'stopped by ' + gas.f, box: true }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 1, xmax: 30, ymin: 0, ymax: 1.08, pad: { t: Kk.t }, xlabel: 'wavelength, µm', ylabel: 'brightness', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => {
        const pts = sp.pts.filter(q => q[0] >= 1).map(q => [q[0], q[1] / pk]);
        P.area(pts, 0, 'rgba(255,138,92,.12)'); P.line(pts, '#FF8A5C', 2);
        gas.bands.forEach(bd => { const a = bandA(bd[2], u); if (bd[0] > cut) return; const seg = pts.filter(q => q[0] >= bd[0] && q[0] <= Math.min(bd[1], cut)).map(q => [q[0], q[1] * a]); if (seg.length) P.area(seg, 0, RX.rgba(gas.col, 0.75)); });
        if (cut < 30) { P.vline(cut, '#AFC0D8', [3, 3]); P.tag(cut, 1.0, (p.win === 'glass' ? 'glass' : 'rock salt') + ' stops longer waves', '#AFC0D8', 'left', 0); }
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'jars') {
      const H = S.hist, items = [{ c: '#7CF0B0', label: 'jar A air' }, { c: '#FFD66B', label: 'jar B air' }, { c: 'rgba(124,240,176,.5)', label: 'card A', dash: [4, 3] }, { c: 'rgba(255,214,107,.5)', label: 'card B', dash: [4, 3] }];
      const Kk = K.plotKey(g, items), ys = H.flatMap(q => [q[1], q[2], q[3], q[4]]), hi = Math.max(25, ...ys) + 2;
      const P = g.Plot({ xmin: 0, xmax: Math.max(10, S.JA.t / 60 * 1.1), ymin: 18, ymax: hi, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: '°C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(H.map(q => [q[0], q[3]]), 'rgba(124,240,176,.5)', 1.4, [4, 3]); P.line(H.map(q => [q[0], q[4]]), 'rgba(255,214,107,.5)', 1.4, [4, 3]); P.line(H.map(q => [q[0], q[1]]), '#7CF0B0', 2.4); P.line(H.map(q => [q[0], q[2]]), '#FFD66B', 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'feedback') {
      const T = S.Tlat, b = S.base.T, items = [{ c: '#FF8A5C', label: 'now' }, { c: '#8FB4FF', label: 'at the start', dash: [5, 4] }, { c: '#E8F4FF', label: 'ice below −10 °C', dash: [2, 3] }];
      const Kk = K.plotKey(g, items), lat = i => Math.asin(EBX[i]) * 180 / Math.PI;
      const ys = Array.from(T).concat(Array.from(b)), lo = Math.min(-30, ...ys) - 2, hi = Math.max(32, ...ys) + 2;
      const P = g.Plot({ xmin: 0, xmax: 90, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'latitude, °', ylabel: '°C', xticks: [0, 15, 30, 45, 60, 75, 90], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(-10, '#E8F4FF', [2, 3]); P.line(Array.from(b, (v, i) => [lat(i), v]), '#8FB4FF', 1.6, [5, 4]); P.line(Array.from(T, (v, i) => [lat(i), v]), '#FF8A5C', 2.5); const e = iceEdge(T); if (e > 0.5 && e < 89.5) { P.vline(e, '#E8F4FF', [3, 3]); P.tag(e, hi - 4, 'ice edge ' + e.toFixed(0) + '°', '#E8F4FF', 'right', 0); } });
      Kk.draw(P); return;
    }
    if (p.setup === 'causes') {
      const R = S.run, items = [{ c: '#FF8A80', label: 'the model, every cause switched on here' }, { c: '#FFD66B', label: 'HadCRUT5, decade means', dot: true }];
      const Kk = K.plotKey(g, items), rows = R.rows;
      const P = g.Plot({ xmin: 1850, xmax: 2023, ymin: -0.6, ymax: 1.7, pad: { t: Kk.t }, xlabel: 'year', ylabel: '°C above 1850–1900', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => {
        P.hline(0, 'rgba(201,212,234,.35)');
        const pts = rows.filter(r => r.y >= 1850).map(r => [r.y, R.T[r.y - 1750]]);
        P.line(pts, 'rgba(255,138,128,.25)', 1.5); P.line(pts.filter(q => q[0] <= S.year), '#FF8A80', 2.4);
        HADCRUT.forEach(([y, v]) => P.dot(y, v, 4, '#FFD66B', '#0B0F18'));
        P.vline(S.year, 'rgba(255,255,255,.4)', [3, 3]);
      });
      Kk.draw(P); return;
    }
    const R = S.kick, items = [{ c: '#FF8A5C', label: 'upper ocean and air' }, { c: '#8FB4FF', label: 'deep ocean' }];
    const Kk = K.plotKey(g, items), t1 = p.kick === 'orbit' ? 5 : 4, pts = R.pts.filter(q => q[0] >= 0.03), ys = pts.flatMap(q => [q[1], q[2]]), lo = Math.min(0, ...ys), hi = Math.max(0.05, ...ys);
    const lab = v => ({ '-1': '0.1', 0: '1', 1: '10', 2: '100', 3: '1k', 4: '10k', 5: '100k' })[Math.round(v)] || '';
    const P = g.Plot({ xmin: -1.5, xmax: t1, ymin: lo - (hi - lo) * 0.08, ymax: hi + (hi - lo) * 0.12, pad: { t: Kk.t }, xlabel: 'years after the push', ylabel: '°C', xticks: [-1, 0, 1, 2, 3, 4, 5].filter(v => v <= t1), xfmt: lab, yfmt: v => v.toFixed(Math.abs(hi - lo) < 0.2 ? 2 : 1) }).frame();
    P.clip(() => { P.hline(0, 'rgba(201,212,234,.35)'); const lg = q => [Math.log10(q[0]), q[1]]; P.line(pts.map(q => [Math.log10(q[0]), q[2]]), '#8FB4FF', 2); P.line(pts.map(lg), 'rgba(255,138,92,.3)', 1.4); P.line(pts.filter(q => q[0] <= S.tk).map(lg), '#FF8A5C', 2.5); P.vline(S.logt, 'rgba(255,255,255,.4)', [3, 3]); });
    Kk.draw(P);
  }
  const JARBAR = {};
  function jarBars(p) {
    const o = jarOpts(p), key = [o.src, o.dist, o.watts].join('|'); if (JARBAR[key]) return JARBAR[key];
    const cfg = [['air, lid on', { gas: 'air', lid: true, wall: 'glass' }], ['CO₂, lid on', { gas: 'co2', lid: true, wall: 'glass' }], ['air, open', { gas: 'air', lid: false, wall: 'glass' }], ['CO₂, open', { gas: 'co2', lid: false, wall: 'glass' }], ['humid, lid on', { gas: 'humid', lid: true, wall: 'glass' }], ['air, rock salt', { gas: 'air', lid: true, wall: 'salt' }]];
    return (JARBAR[key] = cfg.map(([n, sd]) => ({ n, sd, rise: jarRun(o, sd, 1800).a - 273.15 - JAR.room })));
  }
  const GAS_AMTS = []; for (let v = -1; v <= 1.48; v += 0.08) GAS_AMTS.push(v);
  const TUBE_CURVES = {};
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'budget') {
      const o = budgetOpts(p), items = [{ c: '#FFD66B', label: 'sunlight absorbed' }, { c: '#FF8A5C', label: 'heat radiated to space' }];
      const Kk = K.plotKey(g, items), xs = []; for (let T = -60; T <= 70; T += 1) xs.push(T);
      const P = g.Plot({ xmin: -60, xmax: 70, ymin: 0, ymax: 450, pad: { t: Kk.t }, xlabel: 'surface temperature, °C', ylabel: 'W/m²', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(xs.map(T => [T, fluxes(o, T + 273.15).asr]), '#FFD66B', 2.2); P.line(xs.map(T => [T, fluxes(o, T + 273.15).olr]), '#FF8A5C', 2.2);
        const Te = S.Teq - 273.15; P.vline(Te, '#9FE0B8', [4, 3]); P.tag(Te, 420, 'balance at ' + Te.toFixed(1) + ' °C', '#9FE0B8', 'left', 0);
        const T = S.B.T - 273.15, f = fluxes(o, S.B.T); P.dot(T, f.asr, 4.5, '#FFD66B', '#0B0F18'); P.dot(T, f.olr, 4.5, '#FF8A5C', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'tyndall') {
      if (p.land2 === 'gwp') {
        const keys = ['CO2', 'CH4', 'N2O', 'CFC12'], items = keys.map(k => ({ c: GASES[k].col, label: GASES[k].f, dot: true }));
        const Kk = K.plotKey(g, items);
        const P = g.Plot({ xmin: 0, xmax: 4.4, ymin: 0, ymax: 4.6, pad: { t: Kk.t }, xlabel: 'how long it stays, years', ylabel: 'warming per kg, × CO₂ (100 y)', xticks: [0, 1, 2, 3, 4], xfmt: v => ['1', '10', '100', '1k', '10k'][Math.round(v)], yticks: [0, 1, 2, 3, 4], yfmt: v => ['1', '10', '100', '1k', '10k'][Math.round(v)] }).frame();
        P.clip(() => keys.forEach(k => { const gs = GASES[k], x = Math.log10(gs.tau || 1000), y = Math.log10(Math.max(1, gs.gwp)); P.dot(x, y, k === p.gas ? 7 : 5, gs.col, k === p.gas ? '#FFFFFF' : '#0B0F18'); P.tag(x, y, gs.f + ' ' + gs.gwp.toLocaleString('en-US'), gs.col, 'left', -10); }));
        Kk.draw(P); return;
      }
      const keys = ['CO2', 'CH4', 'N2O', 'H2O', 'CFC12', 'N2'], items = keys.map(k => ({ c: GASES[k].col, label: GASES[k].f }));
      const Kk = K.plotKey(g, items), o = tubeOpts(p), key = [o.len, o.src, o.win].join('|');
      if (!TUBE_CURVES[key]) TUBE_CURVES[key] = keys.map(k => GAS_AMTS.map(v => [v, tube(Object.assign({}, o, { gas: k, p: Math.pow(10, v) / 29.92 })).frac * 100]));
      const C = TUBE_CURVES[key], hi = Math.max(10, ...C.flat().map(q => q[1])) * 1.08;
      const P = g.Plot({ xmin: -1, xmax: 1.48, ymin: 0, ymax: hi, pad: { t: Kk.t }, xlabel: 'gas in the tube, inches of mercury', ylabel: '% stopped', xticks: [-1, 0, 1, Math.log10(29.92)], xfmt: v => v < -0.5 ? '0.1' : v < 0.5 ? '1' : v < 1.2 ? '10' : '30', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { C.forEach((pts, i) => P.line(pts, GASES[keys[i]].col, keys[i] === p.gas ? 2.6 : 1.3)); P.dot(p.lp, S.tube.frac * 100, 5.5, GASES[p.gas].col, '#FFFFFF'); P.vline(0, 'rgba(201,212,234,.3)', [3, 3]); P.tag(0, hi * 0.95, 'Tyndall’s inch of mercury', '#AFC0D8', 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'jars') {
      const B = jarBars(p), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'air in the jar: rise after 30 minutes', box: true }]);
      const hi = Math.max(2, ...B.map(b => b.rise)) * 1.2;
      const P = g.Plot({ xmin: -0.6, xmax: B.length - 0.4, ymin: 0, ymax: hi, pad: { t: Kk.t, b: 42 }, xlabel: '', ylabel: '°C rise', xticks: B.map((b, i) => i), xfmt: i => (B[Math.round(i)] || {}).n || '', yfmt: v => v.toFixed(0) }).frame();
      const mine = [sideA(p), sideB(p)];
      P.clip(() => B.forEach((b, i) => { const on = mine.some(m => m.gas === b.sd.gas && m.lid === b.sd.lid && m.wall === b.sd.wall); P.bar(i, b.rise, 0.32, 0, on ? '#FFD66B' : 'rgba(255,214,107,.35)'); P.tag(i, b.rise, b.rise.toFixed(1), '#DCE6F6', 'center', -8); }));
      Kk.draw(P); return;
    }
    if (p.setup === 'feedback') {
      const Hy = hysteresis(fbOpts(p)), items = [{ c: '#FF8A5C', label: 'turning the Sun down' }, { c: '#8FB4FF', label: 'turning it back up', dash: [5, 3] }, { c: '#FFFFFF', label: 'now', dot: true }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 82, xmax: 140, ymin: -60, ymax: 50, pad: { t: Kk.t }, xlabel: 'the Sun, % of today', ylabel: 'mean °C', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(Hy.down.map(q => [q[0], q[1]]), '#FF8A5C', 2.2); P.line(Hy.up.map(q => [q[0], q[1]]), '#8FB4FF', 2, [5, 3]);
        if (Hy.snowAt) P.tag(Hy.snowAt, -20, 'snowball at ' + Hy.snowAt + ' %', '#E8F4FF', 'left', 0); if (Hy.thawAt) P.tag(Hy.thawAt, 10, 'thaws at ' + Hy.thawAt + ' %', '#8FB4FF', 'right', 0);
        P.dot(p.sun, meanOf(S.Tlat), 5.5, '#FFFFFF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'causes') {
      const R = S.run, parts = [['CO₂ fossil', 'co2Fossil', '#FF8A5C'], ['CO₂ cement', 'co2Cement', '#E8DCC8'], ['CO₂ clearing', 'co2Land', '#E8B870'], ['methane', 'ch4', '#9FE0B8'], ['N₂O', 'n2o', '#FF9E7A'], ['CFCs, ozone', 'other', '#E59BF0'], ['haze', 'aerosol', '#8FB4FF'], ['land brighter', 'albedo', '#C8D4E8'], ['Sun', 'solar', '#FFD66B'], ['volcanoes', 'volcanic', '#B0B8C8']];
      const vals = parts.map(([n, k, c]) => [n, meanYears(R.rows, R.per[k], 2010, 2019), c]), tot = vals.reduce((s, v) => s + v[1], 0);
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'all causes: ' + (tot >= 0 ? '+' : '') + tot.toFixed(2) + ' °C (2010–2019)', box: true }]);
      const P = g.Plot({ xmin: -0.6, xmax: parts.length - 0.4, ymin: Math.min(-0.8, ...vals.map(v => v[1])) - 0.05, ymax: Math.max(1.0, ...vals.map(v => v[1])) + 0.1, pad: { t: Kk.t, b: 42 }, xlabel: '', ylabel: '°C of warming', xticks: parts.map((q, i) => i), xfmt: i => (parts[Math.round(i)] || [''])[0], yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.hline(0, 'rgba(201,212,234,.4)'); vals.forEach(([n, v, c], i) => { P.bar(i, v, 0.32, 0, c); P.tag(i, v, (v >= 0 ? '+' : '') + v.toFixed(2), '#DCE6F6', 'center', v >= 0 ? -8 : 12); }); });
      Kk.draw(P); return;
    }
    const R = S.kick, Kk = K.plotKey(g, EVENTS.slice(0, 4).map(e => ({ c: e.col, label: e.name, dot: true })).concat([{ c: '#FFFFFF', label: 'this push', dot: true }]));
    const P = g.Plot({ xmin: -0.3, xmax: 4.3, ymin: -2.3, ymax: 1.2, pad: { t: Kk.t }, xlabel: 'how long the change took, years', ylabel: 'size of change, °C', xticks: [0, 1, 2, 3, 4], xfmt: v => ['1', '10', '100', '1k', '10k'][Math.round(v)], yticks: [-2, -1, 0, 1], yfmt: v => ['0.01', '0.1', '1', '10'][Math.round(v) + 2] }).frame();
    P.clip(() => { EVENTS.forEach(e => { P.dot(Math.log10(e.dur), Math.log10(e.dT), 5, e.col, '#0B0F18'); P.tag(Math.log10(e.dur), Math.log10(e.dT), e.name, e.col, Math.log10(e.dur) > 3 ? 'right' : 'left', -9); });
      if (Math.abs(R.peak) > 0.005) P.dot(Math.log10(Math.max(0.5, R.peakT)), Math.log10(Math.abs(R.peak)), 6.5, '#FFFFFF', '#FF8A5C'); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'budget') {
      const o = budgetOpts(p), f = fluxes(o, S.B.T);
      return [
        { label: 'Sunlight arriving S₀/4', value: f.Q.toFixed(1), unit: 'W/m²', hint: 'S₀ spread over the whole sphere' },
        { label: 'Reflected α·S₀/4', value: f.reflected.toFixed(1), unit: 'W/m²', hint: 'albedo ' + f.A.ap.toFixed(3) },
        { label: 'Absorbed', value: f.asr.toFixed(1), unit: 'W/m²', flag: 'accent' },
        { label: 'Heat to space (1 − ε/2)σT⁴', value: f.olr.toFixed(1), unit: 'W/m²', hint: 'ε = ' + f.E.e.toFixed(3) },
        { label: 'Imbalance in − out', value: (f.N >= 0 ? '+' : '') + f.N.toFixed(2), unit: 'W/m²', flag: Math.abs(f.N) < 0.05 ? 'ok' : 'warn' },
        { label: 'Surface temperature', value: (S.B.T - 273.15).toFixed(2), unit: '°C', flag: 'accent', hint: 'settles at ' + cdeg(S.Teq) },
        { label: 'Temperature seen from space', value: (f.Te - 273.15).toFixed(1), unit: '°C', hint: '(OLR/σ)^¼' },
        { label: 'Greenhouse effect σT⁴ − OLR', value: f.G.toFixed(0), unit: 'W/m²' },
        { label: 'Response time C/λ', value: respTime(o, S.B.T).toFixed(1), unit: 'years', hint: 'the ocean’s ' + p.mix + ' m must warm too' },
        { label: 'Clouds: sunlight / heat', value: f.cloudSW.toFixed(0) + ' / +' + f.cloudLW.toFixed(0), unit: 'W/m²', hint: 'net ' + (f.cloudSW + f.cloudLW).toFixed(0) }
      ];
    }
    if (p.setup === 'tyndall') {
      const T = S.tube, g2 = GASES[p.gas];
      return [
        { label: 'Gas', value: g2.f, hint: g2.name },
        { label: 'Amount u = p·L', value: (T.u * 1000).toFixed(1), unit: 'atm·mm' },
        { label: 'Radiation through the windows', value: (T.reach * 100).toFixed(1), unit: '%', hint: p.win === 'glass' ? 'glass stops beyond 2.7 µm' : 'rock salt passes to 16 µm' },
        { label: 'Stopped by the gas', value: (T.frac * 100).toFixed(2), unit: '%', flag: 'accent' },
        { label: 'Galvanometer', value: S.needle.toFixed(1), unit: '°' },
        { label: 'Thermopile', value: T.mV.toFixed(3), unit: 'mV' },
        { label: 'Warming potential (100 y)', value: g2.gwp == null ? '—' : g2.gwp.toLocaleString('en-US'), unit: '× CO₂', hint: g2.tau ? 'stays ' + g2.tau + ' years' : '' }
      ];
    }
    if (p.setup === 'jars') {
      const rA = S.JA.a - 273.15 - JAR.room, rB = S.JB.a - 273.15 - JAR.room;
      return [
        { label: 'Time', value: (S.JA.t / 60).toFixed(1), unit: 'min', hint: 'time-lapse ×' + p.pace },
        { label: 'Light on the cards', value: (p.src2 === 'sun' ? 1000 : p.src2 === 'lamp' ? lampI(p.dist, p.watts) : 0).toFixed(0), unit: 'W/m²', hint: p.src2 === 'lamp' ? '∝ 1/d²' : '' },
        { label: 'Jar A air', value: (S.JA.a - 273.15).toFixed(2), unit: '°C', hint: '+' + rA.toFixed(2) },
        { label: 'Jar B air', value: (S.JB.a - 273.15).toFixed(2), unit: '°C', hint: '+' + rB.toFixed(2) },
        { label: 'B − A', value: (rB - rA >= 0 ? '+' : '') + (rB - rA).toFixed(2), unit: '°C', flag: 'accent' },
        { label: 'Card A / card B', value: (S.JA.b - 273.15).toFixed(1) + ' / ' + (S.JB.b - 273.15).toFixed(1), unit: '°C' },
        { label: 'Heat-trapping of B’s gas ε', value: gasEps(p.gasB, S.JB.b, JAR.path).toFixed(3), hint: 'over the 22 cm of the jar' }
      ];
    }
    if (p.setup === 'feedback') {
      const T = S.Tlat, m = meanOf(T);
      return [
        { label: 'Years run', value: S.year.toFixed(0), unit: 'y' },
        { label: 'Global mean', value: m.toFixed(2), unit: '°C', flag: 'accent', hint: (m - S.base.mean >= 0 ? '+' : '') + (m - S.base.mean).toFixed(2) + ' from the start' },
        { label: 'Ice edge', value: iceEdge(T).toFixed(1), unit: '°', hint: 'where it is −10 °C' },
        { label: 'Equator / pole', value: T[0].toFixed(1) + ' / ' + T[EBM.N - 1].toFixed(1), unit: '°C' },
        { label: 'CO₂ push 5.35 ln(C/280)', value: (5.35 * Math.log(p.fco2 / 280)).toFixed(2), unit: 'W/m²' },
        { label: 'Warming for 2 × CO₂', value: fbLedger(S).toFixed(2), unit: '°C', hint: 'with these parts working' }
      ];
    }
    if (p.setup === 'causes') {
      const C = causeAt(S), F = C.row.F;
      return [
        { label: 'Year', value: Math.floor(S.year).toString() },
        { label: 'CO₂', value: C.row.C.toFixed(1), unit: 'ppm' },
        { label: 'Methane / N₂O', value: C.row.M.toFixed(0) + ' / ' + C.row.N.toFixed(0), unit: 'ppb' },
        { label: 'Human push', value: (F.co2Fossil + F.co2Cement + F.co2Land + F.ch4 + F.n2o + F.other + F.aerosol + F.albedo).toFixed(2), unit: 'W/m²', flag: 'accent' },
        { label: 'Model warming', value: (C.T >= 0 ? '+' : '') + C.T.toFixed(2), unit: '°C', flag: 'accent' },
        { label: 'Measured (decade)', value: lerpT(HADCRUT, S.year).toFixed(2), unit: '°C', hint: 'HadCRUT5' },
        { label: 'Model 2011–2020', value: meanYears(S.run.rows, S.run.T, 2011, 2020).toFixed(2), unit: '°C', hint: 'measured 1.09' }
      ];
    }
    const R = S.kick, now = kickAt(R, S.tk);
    return [
      { label: 'Time since the push', value: ago(S.tk) },
      { label: 'Push now', value: now[3].toFixed(2), unit: 'W/m²' },
      { label: 'Upper ocean & air', value: now[1].toFixed(3), unit: '°C', flag: 'accent' },
      { label: 'Deep ocean', value: now[2].toFixed(3), unit: '°C' },
      { label: 'Biggest change', value: R.peak.toFixed(3), unit: '°C', hint: 'after ' + ago(R.peakT) },
      { label: 'Fastest rate', value: R.maxRate.toFixed(2), unit: '°C/century' }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'budget') { const o = budgetOpts(p), f = fluxes(o, S.B.T); return E.frac(E.v('S') + E.sub('0'), '4') + '(1 − ' + E.v('α') + ') ' + E.op('=') + ' ' + E.frac(E.n(p.S0, ''), '4') + ' × (1 − ' + f.A.ap.toFixed(3) + ') ' + E.op('=') + ' ' + E.n(f.asr.toFixed(1), 'W/m²') + '   ·   (1 − ' + E.v('ε') + '/2)' + E.v('σT') + E.sup('4') + ' ' + E.op('=') + ' (1 − ' + f.E.e.toFixed(3) + '/2) × 5.67×10⁻⁸ × ' + S.B.T.toFixed(1) + E.sup('4') + ' ' + E.op('=') + ' ' + E.n(f.olr.toFixed(1), 'W/m²'); }
    if (p.setup === 'tyndall') { const T = S.tube; return E.v('A') + E.sub('band') + ' ' + E.op('=') + ' 1 − e' + E.sup('−√(ku)') + '   ·   stopped ' + E.op('=') + ' Σ ' + E.v('A') + E.sub('band') + ' × (share of the cube’s light in the band) ' + E.op('=') + ' ' + E.n((T.frac * 100).toFixed(2), '%'); }
    if (p.setup === 'jars') { const r = jarRates(S.JB, jarOpts(p), sideB(p)); return 'card B: ' + E.n(r.Pin.toFixed(2), 'W') + ' in ' + E.op('=') + ' ' + E.n(r.conv.toFixed(2), 'W') + ' to the air + ' + E.n(r.radB.toFixed(2), 'W') + ' radiated + storage   ·   air B loses ' + E.n(r.vent.toFixed(2), 'W') + ' out of the mouth'; }
    if (p.setup === 'feedback') { const lam = 3.22 - (p.wvFb ? 1.3 : 0) - (p.cloudFb ? 0.42 : 0); return E.v('ΔT') + ' ' + E.op('≈') + ' ' + E.frac(E.v('F'), E.v('λ')) + ' ' + E.op('=') + ' ' + E.frac('3.71', lam.toFixed(2) + (p.iceFb ? ' − ice' : '')) + ' ' + E.op('=') + ' ' + E.n(fbLedger(S).toFixed(2), '°C') + ' for 2 × CO₂'; }
    if (p.setup === 'causes') { const C = causeAt(S); return E.v('F') + E.sub('CO₂') + ' ' + E.op('=') + ' 5.35 ln(' + E.frac(C.row.C.toFixed(0), '277') + ') ' + E.op('=') + ' ' + E.n((C.row.F.co2Fossil + C.row.F.co2Cement + C.row.F.co2Land).toFixed(2), 'W/m²') + '   ·   ' + E.v('C') + E.frac(E.v('dT'), E.v('dt')) + ' ' + E.op('=') + ' ' + E.v('F') + ' − ' + E.frac('3.71', E.n(p.ecs.toFixed(1), '')) + E.v('T') + ' − ' + p.gamma.toFixed(2) + '(' + E.v('T') + ' − ' + E.v('T') + E.sub('deep') + ')'; }
    const now = kickAt(S.kick, S.tk); return '7.3 ' + E.frac(E.v('dT'), E.v('dt')) + ' ' + E.op('=') + ' ' + E.v('F') + ' − ' + (F2X / p.ecsK).toFixed(2) + E.v('T') + ' − 0.73(' + E.v('T') + ' − ' + E.v('T') + E.sub('deep') + ')   ·   106 ' + E.frac(E.v('dT') + E.sub('deep'), E.v('dt')) + ' ' + E.op('=') + ' 0.73(' + E.v('T') + ' − ' + E.v('T') + E.sub('deep') + ')   ·   now ' + E.v('F') + ' ' + E.op('=') + ' ' + E.n(now[3].toFixed(2), 'W/m²');
  }
  const EQ_NOTE = S => ({
    budget: 'The planet warms until it radiates away as much as it absorbs. Nothing traps heat for ever: the gases slow its escape, so the surface must be warmer to push the same 240 W/m² out. One grey layer is the simplest model that does this; it gets the totals right but not how the heat is shared between surface and air.',
    tyndall: 'A gas stops radiant heat only at the wavelengths its molecules vibrate at. Nitrogen and oxygen, two identical atoms each, have no such bands; CO₂, water, methane and nitrous oxide do. A band soon saturates — but more gas widens its edges, so the effect keeps growing, ever more slowly.',
    jars: 'A closed jar warms mainly because its warm air cannot rise away — the same reason a car or a garden greenhouse gets hot. The planet has no lid; its greenhouse effect is the air’s gases radiating heat back down. That is why the jar demonstration, on its own, proves little.',
    feedback: 'A feedback is a change that changes its own cause. Warming melts ice, the darker ground absorbs more sunlight, and it warms more; warmer air holds more water vapour, which traps more heat. The planet still settles — the extra heat it radiates (3.22 W/m² per kelvin) wins — but further than without them.',
    causes: 'Each cause is computed separately and the ocean model is linear, so the parts add up to the whole. The Sun and volcanoes explain the wiggles; only the human gases explain the rise. The haze from burning hides about half a degree of it.',
    timescales: 'The upper ocean responds within years, the deep ocean over centuries. A volcano’s veil is gone before the deep ocean notices; CO₂ is still in the air for thousands of years, so its warming lasts as long.'
  })[S.p.setup];

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'sun') { p.S0 = clamp(Math.round(p.S0 + e.dx * 4), 500, 2700); this.setup(S); }
    else if (e.id === 'ice') { const lat = Math.asin(clamp(1 - p.ice / 100, 0, 1)) * 180 / Math.PI, nl = clamp(lat - e.dy * 0.35, 0, 90); p.ice = clamp(Math.round((1 - Math.sin(nl * Math.PI / 180)) * 1000) / 10, 0, 100); this.setup(S); }
    else if (e.id === 'len' && S._ax) { const L2 = S._ax.x * S._ax.x + S._ax.y * S._ax.y || 1, along = (e.dx * S._ax.x + e.dy * S._ax.y) / L2 * 0.1; p.len = clamp(Math.round((p.len + along / 0.38) * 20) / 20, 0.3, 2.4); this.setup(S); }
    else if (e.id === 'gas') { p.lp = clamp(Math.round((p.lp - e.dy * 0.01) * 100) / 100, -1, 1.48); this.setup(S); }
    else if (e.id === 'lamp' && S._ax) { const L2 = S._ax.x * S._ax.x + S._ax.y * S._ax.y || 1, along = (e.dx * S._ax.x + e.dy * S._ax.y) / L2 * 0.1; p.dist = clamp(Math.round((p.dist + along) * 100) / 100, 0.3, 0.8); this.setup(S); }
    else if (e.id === 'fsun') { p.sun = clamp(Math.round(p.sun + e.dx * 0.1), 80, 130); this.setup(S); }
    else if (e.id === 'year' && S._yr) { S.year = clamp(1850 + (e.x - S._yr.lx) / S._yr.lw * 173, 1850, 2023); }
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true, PACE = (opts) => ({ key: 'pace', type: 'select', label: 'Time-lapse', restructure: false, options: opts });
  L.register({
    id: 'g6f-energy-balance',
    grade: 6, unit: '6F', topics: ['F1', 'F3'],
    subject: 'earth',
    name: 'Earth’s Energy Balance — Sunlight In, Heat Out',
    chapter: 'Global Warming and Human Impact',
    exams: ['NGSS MS-ESS3-5', 'NGSS Science and Engineering Practice 2: developing and using models', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    bloom: 0.1,
    stageHint: 'Every number is computed · drag the scene to turn it · drag the Sun, the ice line, the lamp, the tube’s end, the gas gauge or the year',
    lede: 'Why is the Earth the temperature it is, and what can change it? Balance the planet’s books: <b>sunlight in</b>, sunlight reflected by each part of the climate system, <b>heat radiated to space</b>. ' +
      'Put gases in <b>Tyndall’s tube</b> of 1859 and find which ones stop heat. Test the classroom <b>jar demonstration</b> against Wood’s experiment of 1909. ' +
      'Melt ice and add water vapour on a planet in latitude bands to see <b>feedbacks</b> — and tip it into a snowball. Then run the world from 1850 with every recorded cause, human and natural, and switch them off one at a time. Last, follow an eruption, the Sun’s cycle and a pulse of CO₂ for ten thousand years.',

    params: preset({}),
    presets: [
      { name: 'Today’s planet before industry', params: preset({}) },
      { name: 'No heat-trapping gases: an icy −18 °C', params: preset({ air: 'none' }) },
      { name: 'Double the CO₂', params: preset({ co2: 560, pace: 2 }) },
      { name: 'Clear skies everywhere', params: preset({ cloud: 0 }) },
      { name: 'An Earth at Mars’s distance', params: preset({ S0: 586, pace: 2 }) },
      { name: 'Tyndall: carbon dioxide at an inch of mercury', params: preset({ setup: 'tyndall', gas: 'CO2', lp: 0 }) },
      { name: 'Tyndall: the gases of the air', params: preset({ setup: 'tyndall', gas: 'N2', lp: 1.476 }) },
      { name: 'Tyndall: glass windows', params: preset({ setup: 'tyndall', gas: 'CO2', lp: 1.476, win: 'glass' }) },
      { name: 'Tyndall: a pinch of CFC-12', params: preset({ setup: 'tyndall', gas: 'CFC12', lp: -1, land2: 'gwp' }) },
      { name: 'Jars: air against CO₂, lids on', params: preset({ setup: 'jars' }) },
      { name: 'Jars: the same gas, lid on and lid off', params: preset({ setup: 'jars', gasB: 'air', lidB: false }) },
      { name: 'Jars through a thermal camera', params: preset({ setup: 'jars', irView: true, pace: 120 }) },
      { name: 'Wood’s test in sunlight: glass against rock salt', params: preset({ setup: 'jars', src2: 'sun', gasA: 'air', gasB: 'air', wallB: 'salt' }) },
      { name: 'Feedbacks: double the CO₂', params: preset({ setup: 'feedback', fco2: 560 }) },
      { name: 'No feedbacks at all', params: preset({ setup: 'feedback', fco2: 560, iceFb: false, wvFb: false, cloudFb: false }) },
      { name: 'Dim the Sun to 88 %: a snowball', params: preset({ setup: 'feedback', sun: 88, pace: 10 }) },
      { name: 'The Sun at 92 %, from a snowball', params: preset({ setup: 'feedback', start: 'snowball', sun: 92, pace: 10 }) },
      { name: 'The Sun at 92 %, from today', params: preset({ setup: 'feedback', sun: 92, pace: 10 }) },
      { name: 'No winds or currents', params: preset({ setup: 'feedback', transport: false }) },
      { name: '1850–2023, every cause', params: preset({ setup: 'causes' }) },
      { name: 'Only the Sun and volcanoes', params: preset({ setup: 'causes', fossil: false, cement: false, farming: false, clearing: false, haze: false, other: false }) },
      { name: 'Clean air: no haze', params: preset({ setup: 'causes', haze: false }) },
      { name: 'A low sensitivity, 1.5 °C', params: preset({ setup: 'causes', ecs: 1.5 }) },
      { name: 'Pinatubo, 1991', params: preset({ setup: 'timescales', kick: 'volcano', aod: 0.15 }) },
      { name: 'Tambora, 1815', params: preset({ setup: 'timescales', kick: 'volcano', aod: 0.45 }) },
      { name: 'A thousand billion tonnes of carbon at once', params: preset({ setup: 'timescales', kick: 'pulse', gtc: 1000 }) },
      { name: 'Ten a year for a century, then stop', params: preset({ setup: 'timescales', kick: 'steady', rate: 10, years: 100 }) },
      { name: 'The tilt cycle, with ice sheets and CO₂', params: preset({ setup: 'timescales', kick: 'orbit', orb: 1.5, slow: true }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The Sun and the planet', when: is('budget'), items: [
        { key: 'S0', label: 'Sunlight at the Earth’s distance <i>S</i>₀', min: 500, max: 2700, step: 1, unit: 'W/m²', restructure: R_ },
        { key: 'cloud', label: 'Cloud cover', min: 0, max: 100, step: 1, unit: '%', restructure: R_ },
        { key: 'ice', label: 'Ice and snow cover', min: 0, max: 100, step: 0.5, unit: '%', restructure: R_ },
        { key: 'land', type: 'select', label: 'The land is', restructure: R_, options: [{ value: 'today', label: 'as today' }, { value: 'forest', label: 'all forest' }, { value: 'crops', label: 'all farmland' }, { value: 'desert', label: 'all desert' }] } ] },
      { group: 'The air and the ocean', when: is('budget'), items: [
        { key: 'air', type: 'select', label: 'Heat-trapping gases', restructure: R_, options: [{ value: 'today', label: 'in the air' }, { value: 'none', label: 'none at all' }] },
        { key: 'co2', label: 'CO₂', min: 100, max: 2000, step: 10, unit: 'ppm', restructure: R_, when: S => S.p.air !== 'none' },
        { key: 'wv', type: 'toggle', label: 'Water vapour follows the temperature', restructure: R_, when: S => S.p.air !== 'none' },
        { key: 'mix', label: 'Depth of the ocean’s mixed layer', min: 5, max: 500, step: 5, unit: 'm', restructure: R_ },
        PACE([{ value: 0.25, label: '3 months a second' }, { value: 1, label: 'a year a second' }, { value: 2, label: '2 years a second' }, { value: 5, label: '5 years a second' }]) ] },
      { group: 'Tyndall’s tube', when: is('tyndall'), items: [
        { key: 'gas', type: 'select', label: 'Gas in the tube', restructure: R_, options: GAS_KEYS.map(k => ({ value: k, label: GASES[k].f + ' · ' + GASES[k].name })) },
        { key: 'lp', label: 'Amount (pressure)', min: -1, max: 1.476, step: 0.02, restructure: R_, fmt: v => Math.pow(10, v).toFixed(Math.pow(10, v) < 3 ? 2 : 1) + ' in Hg' },
        { key: 'len', label: 'Tube length', min: 0.3, max: 2.4, step: 0.05, unit: 'm', restructure: R_ },
        { key: 'src', label: 'Cube temperature', min: 30, max: 250, step: 1, unit: '°C', restructure: R_ },
        { key: 'win', type: 'select', label: 'Windows', restructure: R_, options: [{ value: 'salt', label: 'rock salt' }, { value: 'glass', label: 'glass' }, { value: 'none', label: 'none (open ends)' }] },
        { key: 'land2', type: 'select', label: 'Second plot', display: true, options: [{ value: 'amount', label: 'every gas against amount' }, { value: 'gwp', label: 'warming per kilogram' }] } ] },
      { group: 'The light', when: is('jars'), items: [
        { key: 'src2', type: 'select', label: 'Light', restructure: R_, options: [{ value: 'lamp', label: 'a reflector lamp' }, { value: 'sun', label: 'full sunlight' }, { value: 'off', label: 'off' }] },
        { key: 'dist', label: 'Lamp above the cards', min: 0.3, max: 0.8, step: 0.01, unit: 'm', restructure: R_, when: S => S.p.src2 === 'lamp' },
        { key: 'watts', label: 'Lamp power', min: 40, max: 250, step: 5, unit: 'W', restructure: R_, when: S => S.p.src2 === 'lamp' } ] },
      { group: 'Jar A', when: is('jars'), items: [
        { key: 'gasA', type: 'select', label: 'Filled with', restructure: R_, options: [{ value: 'air', label: 'room air' }, { value: 'co2', label: 'CO₂' }, { value: 'humid', label: 'humid air' }] },
        { key: 'lidA', type: 'toggle', label: 'Lid on', restructure: R_ },
        { key: 'wallA', type: 'select', label: 'Made of', restructure: R_, options: [{ value: 'glass', label: 'glass' }, { value: 'salt', label: 'rock salt (Wood)' }] } ] },
      { group: 'Jar B', when: is('jars'), items: [
        { key: 'gasB', type: 'select', label: 'Filled with', restructure: R_, options: [{ value: 'air', label: 'room air' }, { value: 'co2', label: 'CO₂' }, { value: 'humid', label: 'humid air' }] },
        { key: 'lidB', type: 'toggle', label: 'Lid on', restructure: R_ },
        { key: 'wallB', type: 'select', label: 'Made of', restructure: R_, options: [{ value: 'glass', label: 'glass' }, { value: 'salt', label: 'rock salt (Wood)' }] },
        PACE([{ value: 10, label: '×10' }, { value: 30, label: '×30' }, { value: 120, label: '×120 (2 minutes a second)' }]) ] },
      { group: 'The push', when: is('feedback'), items: [
        { key: 'fco2', label: 'CO₂', min: 100, max: 2000, step: 10, unit: 'ppm', restructure: R_ },
        { key: 'sun', label: 'The Sun’s strength', min: 80, max: 130, step: 1, unit: '% of today', restructure: R_ },
        { key: 'start', type: 'select', label: 'Start from', restructure: R_, options: [{ value: 'today', label: 'today’s planet' }, { value: 'snowball', label: 'a snowball Earth' }] } ] },
      { group: 'The parts that respond', when: is('feedback'), items: [
        { key: 'iceFb', type: 'toggle', label: 'Ice melts and forms', restructure: R_ },
        { key: 'wvFb', type: 'toggle', label: 'Water vapour follows the warmth', restructure: R_ },
        { key: 'cloudFb', type: 'toggle', label: 'Clouds change', restructure: R_ },
        { key: 'transport', type: 'toggle', label: 'Winds and currents carry heat poleward', restructure: R_ },
        { key: 'tint', type: 'toggle', label: 'Colour the globe by temperature', display: true },
        PACE([{ value: 2, label: '2 years a second' }, { value: 5, label: '5 years a second' }, { value: 10, label: '10 years a second' }]) ] },
      { group: 'Human causes', when: is('causes'), items: [
        { key: 'fossil', type: 'toggle', label: 'Burning coal, oil and gas', restructure: R_ },
        { key: 'cement', type: 'toggle', label: 'Making cement', restructure: R_ },
        { key: 'farming', type: 'toggle', label: 'Farming: cattle, rice, fertiliser', restructure: R_ },
        { key: 'clearing', type: 'toggle', label: 'Clearing forests', restructure: R_ },
        { key: 'haze', type: 'toggle', label: 'Smoke and haze (aerosols)', restructure: R_ },
        { key: 'other', type: 'toggle', label: 'CFCs and ozone', restructure: R_ } ] },
      { group: 'Natural causes', when: is('causes'), items: [
        { key: 'sunF', type: 'toggle', label: 'The Sun’s changes', restructure: R_ },
        { key: 'volcano', type: 'toggle', label: 'Volcanic eruptions', restructure: R_ },
        { key: 'wobble', type: 'toggle', label: 'El Niño and La Niña', restructure: R_ },
        { key: 'seed', label: 'Another run of the weather', min: 1, max: 9, step: 1, restructure: R_, when: S => !!S.p.wobble } ] },
      { group: 'What scientists are unsure of', when: is('causes'), items: [
        { key: 'ecs', label: 'Climate sensitivity (2 × CO₂)', min: 1.5, max: 6, step: 0.1, unit: '°C', restructure: R_ },
        { key: 'aer', label: 'How much the haze cools (2019)', min: 0, max: 2, step: 0.05, unit: 'W/m²', restructure: R_, when: S => !!S.p.haze },
        { key: 'gamma', label: 'Heat taken into the deep ocean', min: 0.3, max: 1.5, step: 0.01, unit: 'W/m²/K', restructure: R_ },
        PACE([{ value: 3, label: '3 years a second' }, { value: 6, label: '6 years a second' }, { value: 15, label: '15 years a second' }]) ] },
      { group: 'The push', when: is('timescales'), items: [
        { key: 'kick', type: 'select', label: 'What happens', restructure: R_, options: [{ value: 'volcano', label: 'a volcano erupts' }, { value: 'sun', label: 'the Sun’s 11-year cycle' }, { value: 'pulse', label: 'a pulse of CO₂' }, { value: 'steady', label: 'years of emissions, then none' }, { value: 'orbit', label: 'the tilt of the orbit' }] },
        { key: 'aod', label: 'Veil of droplets (optical depth)', min: 0.01, max: 0.6, step: 0.01, restructure: R_, when: S => S.p.kick === 'volcano' },
        { key: 'tsi', label: 'The Sun’s swing, min to max', min: 0.2, max: 4, step: 0.1, unit: 'W/m²', restructure: R_, when: S => S.p.kick === 'sun' },
        { key: 'gtc', label: 'Carbon released', min: 10, max: 5000, step: 10, unit: 'billion t', restructure: R_, when: S => S.p.kick === 'pulse' },
        { key: 'rate', label: 'Carbon a year', min: 1, max: 20, step: 0.5, unit: 'billion t', restructure: R_, when: S => S.p.kick === 'steady' },
        { key: 'years', label: 'For', min: 10, max: 500, step: 10, unit: 'years', restructure: R_, when: S => S.p.kick === 'steady' },
        { key: 'orb', label: 'Change in sunlight absorbed', min: 0.2, max: 3, step: 0.1, unit: 'W/m²', restructure: R_, when: S => S.p.kick === 'orbit' },
        { key: 'slow', type: 'toggle', label: 'Ice sheets and CO₂ join in', restructure: R_, when: S => S.p.kick === 'orbit' },
        { key: 'ecsK', label: 'Climate sensitivity', min: 1.5, max: 6, step: 0.1, unit: '°C', restructure: R_ } ] }
    ],

    setup, step, drawStage, onPointer, onDrag,
    plots: [
      { title: S => ({ budget: 'The surface warming to its balance', tyndall: 'The cube’s radiation, and what the gas takes', jars: 'The two jars, minute by minute', feedback: 'Temperature from the equator to the pole', causes: 'The model against the thermometers', timescales: 'After the push, on a clock of powers of ten' })[S.p.setup],
        draw: plot1 },
      { title: S => ({ budget: 'In and out against temperature: they cross at the balance', tyndall: S.p.land2 === 'gwp' ? 'How long each gas stays, and how much it warms' : 'Every gas, from a trace to a full tube', jars: 'What decides the jar’s warming', feedback: 'Turn the Sun down, then up: two climates for one Sun', causes: 'What caused the warming of 2010–2019', timescales: 'How long, and how big: changes in the record' })[S.p.setup],
        draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · a model of energy balance', params: preset({ air: 'none' }),
        q: 'The Earth absorbs 241.6 W/m² of sunlight. Suppose its air held no heat-trapping gases, so its surface radiated straight to space as σT⁴ (σ = 5.67 × 10⁻⁸). At what temperature would it balance?',
        predict: { label: 'Surface temperature', unit: '°C', tol: 0.02 },
        measure: S => S.Teq - 273.15,
        working: 'σT⁴ = 241.6, so T = (241.6 ÷ 5.67×10⁻⁸)^¼ = 255.5 K, which is <b>−17.6 °C</b>. The real average is about 14 °C: the gases make the 32 °C difference.' },
      { source: 'CAST pattern · analysing data', params: preset({}),
        q: 'Clouds cover 67 % of the planet and reflect 0.36 of the light that falls on them; clear sky reflects 0.15. What share of sunlight does the whole planet reflect?',
        predict: { label: 'Planet’s albedo', unit: '', tol: 0.02 },
        measure: S => albedoOf(budgetOpts(S.p)).ap,
        working: '0.67 × 0.36 + 0.33 × 0.15 = 0.241 + 0.049 ≈ <b>0.29</b> — the value the CERES satellites measure.' },
      { source: 'Tyndall, 1861 · interpreting results', params: preset({ setup: 'tyndall', gas: 'N2O', lp: 0 }),
        q: 'At an inch of mercury Tyndall found carbonic acid (CO₂) stopped 972 times what air did, and nitrous oxide 1,860 times. How many times as much as CO₂ does nitrous oxide stop?',
        predict: { label: 'N₂O ÷ CO₂', unit: '', tol: 0.06 },
        measure: S => tube(tubeOpts(S.p)).frac / tube(Object.assign(tubeOpts(S.p), { gas: 'CO2' })).frac,
        working: '1,860 ÷ 972 ≈ <b>1.9</b>. The tube’s gases give 1.84: nitrous oxide has strong bands where the warm cube shines brightly.' },
      { source: 'Wood, 1909 · an investigation', params: preset({ setup: 'jars', src2: 'sun', gasA: 'air', gasB: 'air', wallB: 'salt' }),
        q: 'R. W. Wood left a blackened box with a glass lid in full sunlight (1000 W/m²) on a 20 °C day. About what temperature did the air in it reach? (Run jar A for 30 minutes.)',
        predict: { label: 'Air in the glass box', unit: '°C', tol: 0.04 },
        measure: S => jarRun(jarOpts(S.p), sideA(S.p), 1800).a - 273.15,
        working: 'Wood reported about <b>55 °C</b>. His rock-salt box — which lets heat radiation straight out — reached nearly the same: the box is hot because its air cannot rise away, not because the lid traps infrared.' },
      { source: 'CAST pattern · a feedback', params: preset({ setup: 'feedback', fco2: 560, iceFb: false, wvFb: false, cloudFb: false }),
        q: 'Doubling CO₂ adds 3.71 W/m². With no feedbacks, each kelvin of warming sends 3.22 W/m² more to space. How much does the planet warm?',
        predict: { label: 'Warming', unit: '°C', tol: 0.03 },
        measure: S => fbLedger(S),
        working: '3.71 ÷ 3.22 = <b>1.15 °C</b>. Switch the feedbacks back on and it is nearly 3 °C: they more than double it.' },
      { source: 'CAST pattern · evaluating a claim', params: preset({ setup: 'causes' }),
        q: 'The IPCC (2021) assessed human-caused warming in 2010–2019 at 1.07 °C above 1850–1900. Run every cause and add up the human bars. What does the model give?',
        predict: { label: 'Human-caused warming', unit: '°C', tol: 0.05 },
        measure: S => ['co2Fossil', 'co2Cement', 'co2Land', 'ch4', 'n2o', 'other', 'aerosol', 'albedo'].reduce((s, k) => s + meanYears(S.run.rows, S.run.per[k], 2010, 2019), 0),
        working: 'CO₂ about 1.0, methane 0.23, nitrous oxide 0.09, CFCs and ozone 0.44, haze −0.59, brighter land −0.08: together <b>1.07 °C</b>. The Sun and volcanoes add about 0.05.' },
      { source: 'CAST pattern · comparing timescales', params: preset({ setup: 'timescales', kick: 'pulse', gtc: 1000 }),
        q: 'The impulse response says 21.7 % of a pulse of CO₂ stays for many thousands of years, and the rest is taken up over 173, 18.5 and 1.2 years. What share is still in the air after 1,000 years?',
        predict: { label: 'Still in the air', unit: '%', tol: 0.03 },
        measure: () => irf(1000) * 100,
        working: '21.7 % + 25.9 % × e^(−1000/173) ≈ 21.7 + 0.08 = <b>21.8 %</b>. A fifth of today’s CO₂ will still be warming the planet in the year 3000.' }
    ],

    walkthrough: [
      { title: 'Balance the books', ask: 'The planet absorbs 242 W/m² of sunlight. If more sunlight arrived, what would have to happen for it to balance again?', reveal: 'It warms until it radiates the extra away. The red curve on the second plot rises with temperature (σT⁴); where it meets the yellow line is the balance. Drag the Sun closer and watch the crossing move.', params: preset({ S0: 1500, pace: 2 }) },
      { title: 'Take the gases away', ask: 'With no heat-trapping gases, would the Earth be warmer or colder — and by how much?', reveal: 'Colder: about −18 °C, frozen. The gases do not add energy; they slow its escape, so the surface must be warmer to send 240 W/m² out.', params: preset({ air: 'none' }) },
      { title: 'Which gases?', ask: 'Air is 78 % nitrogen and 21 % oxygen. Do they stop radiant heat?', reveal: 'No — Tyndall found them as clear as a vacuum. Molecules of two identical atoms have no bands in the infrared. The trace gases with three or more atoms do the work.', params: preset({ setup: 'tyndall', gas: 'N2', lp: 1.476 }) },
      { title: 'What the jar shows', ask: 'Two closed jars, one of air and one of CO₂, under a lamp. The CO₂ jar ends 1–2 °C warmer. Does that prove the greenhouse effect?', reveal: 'Not on its own. Take the lid off the air jar: it warms far less. Most of a jar’s warming is stopped convection. And Wood (1909) found a box of rock salt, which lets heat radiation out, warmed almost as much as one of glass.', params: preset({ setup: 'jars', gasB: 'air', lidB: false }) },
      { title: 'A feedback', ask: 'Ice reflects sunlight. If the planet warms and ice melts, what happens next?', reveal: 'The darker ocean and land absorb more sunlight, and the planet warms more — a feedback. Water vapour does the same. Turn them off and doubled CO₂ warms only 1.15 °C; on, nearly 3.', params: preset({ setup: 'feedback', fco2: 560 }) },
      { title: 'A tipping point', ask: 'Dim the Sun to 88 % and the planet freezes over. Turn it back up to 92 %. Does it thaw?', reveal: 'No. The white planet reflects so much that it stays frozen until the Sun is back to about 95 %. Between 89 and 95 % there are two climates for the same Sun — a frozen one and a mild one — and the history decides which. Compare the two presets at 92 %.', params: preset({ setup: 'feedback', start: 'snowball', sun: 92, pace: 10 }) },
      { title: 'Is it the Sun?', ask: 'Switch off every human cause. Does the Sun explain the warming since 1950?', reveal: 'No. The Sun’s output has been flat or slightly falling since the 1980s; with only the Sun and volcanoes the model stays near zero while the thermometers rise over a degree.', params: preset({ setup: 'causes', fossil: false, cement: false, farming: false, clearing: false, haze: false, other: false }) },
      { title: 'How long it lasts', ask: 'A volcano cools the world about as much as a century of emissions warms it. Which matters more for the future?', reveal: 'The emissions. A volcano’s veil falls out in two years and its cooling with it. CO₂ stays: a fifth of it for thousands of years.', params: preset({ setup: 'timescales', kick: 'pulse', gtc: 1000 }) }
    ],

    quiz: [
      { q: 'Without heat-trapping gases, the Earth’s average temperature would be about', options: ['−18 °C', '0 °C', '14 °C', '33 °C'], answer: 0, why: 'σT⁴ = 240 W/m² gives 255 K. The gases raise it by about 33 °C to today’s 14–15 °C.' },
      { q: 'Which gas in Tyndall’s tube stops almost no radiant heat?', options: ['nitrogen', 'carbon dioxide', 'water vapour', 'methane'], answer: 0, why: 'N₂ has two identical atoms and no infrared bands. Try it in the tube: the galvanometer barely moves.' },
      { q: 'A closed jar of air under a lamp warms more than an open one mainly because', options: ['its warm air cannot rise away', 'the lid traps infrared light', 'air is a greenhouse gas', 'the lamp is closer'], answer: 0, why: 'Convection carries heat out of the open mouth. Wood’s rock-salt box showed the same thing in 1909.' },
      { q: 'Melting sea ice warms the Arctic further because', options: ['open water absorbs more sunlight than ice', 'ice gives out heat as it melts', 'melting adds CO₂', 'water vapour freezes'], answer: 0, why: 'Ice reflects about 0.6 of sunlight, the ocean 0.06. That is a feedback: the change speeds itself up.' },
      { q: 'Since about 1980 the Sun’s output has', options: ['stayed flat or fallen slightly while temperatures rose', 'risen enough to explain the warming', 'doubled', 'fallen by half'], answer: 0, why: 'Satellites have measured it since 1978. Switch off the human causes in the lab: the Sun alone gives almost no warming.' },
      { q: 'A large eruption cools the world for about', options: ['one to three years', 'a century', 'a thousand years', 'a week'], answer: 0, why: 'The sulfate droplets fall out within a year or two. CO₂, by contrast, lingers for millennia.' }
    ],

    notes: '<p><b>The energy balance.</b> The Earth receives about 340 W/m² of sunlight averaged over its surface, reflects about 30 % of it (clouds most of all), and absorbs about 240. It must radiate the same 240 W/m² back to space as heat. If it radiated straight from the surface it would be at −18 °C; the air’s heat-trapping gases (water vapour, CO₂, methane, nitrous oxide) absorb heat radiation and send part of it back down, so the surface is warmer, about 15 °C. This is the <b>greenhouse effect</b>; it is natural and life depends on it.</p>' +
      '<p><b>The parts of the climate system</b> — atmosphere, hydrosphere, cryosphere (ice), biosphere and geosphere — each reflect, absorb, store or move energy, and each changes the others.</p>' +
      '<p><b>Feedbacks.</b> Warming melts ice (less reflection) and puts more water vapour in the air (more trapping): both add to the warming. Doubling CO₂ alone would warm about 1.2 °C; with feedbacks about 3 °C (IPCC best estimate).</p>' +
      '<p><b>Causes.</b> Since 1850 burning fossil fuels, making cement and clearing forests have raised CO₂ from 280 to over 420 ppm; farming has raised methane and nitrous oxide. Smoke and haze cool, hiding part of the warming. The Sun and volcanoes cause wiggles of a tenth of a degree or so, not the rise.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “The greenhouse effect is the hole in the ozone layer” — they are different problems: the ozone hole lets in ultraviolet; greenhouse gases slow the escape of heat. And “a jar under a lamp proves it” — it mostly shows stopped convection.</div>'
  });

  L.models = L.models || {};
  L.models['g6f-energy-balance'] = { albedoOf, epsOf, fluxes, budgetEq, budgetStep, heatCap, EG0: () => EG0, BUD, GASES, tube, thermopile, gwpOf, spectrum, gasEps, jarStart, jarStep, jarRun, jarRates, lampI, JAR,
    EBM, EBX, ebmStep, ebmBase, ebmEq, meanOf, iceEdge, hysteresis, ecsOf, historyOf, causesRun, twoLayer, meanYears, irf, aodAt, tsiAt, solarERF, fCO2, fCH4, fN2O, F2X, HADCRUT, VOLCANOES, kickRun, kickAt, kickForcing, EVENTS, PARTS };
})(window.InsightLab);
