/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-3  Earth's Four Spheres — Rock, Water, Air and Life
   (A4 Earth as a system)

   One planet, five experiments, each on a published model of one sphere:
     geo    — set off an earthquake and time its waves at seismometers
              round the world. The waves travel through PREM, the reference
              Earth seismologists use; S waves cannot cross a liquid, so the
              outer core casts a shadow. Make the core solid and the shadow
              goes (A4.1).
     hydro  — the planet's water in the four balls the USGS drew, and
              tagged molecules released into the water cycle: where they go,
              and how long each store holds them (A4.2).
     atmo   — a radiosonde on a latex balloon climbs through a real
              atmosphere; its own readings reveal the layers, and the helium
              swells until the balloon bursts (A4.3).
     bio    — the Miami model: how much plants can grow for a climate, and
              whether warmth or water is what limits it (A4.4).
     links  — carbon through all four spheres since 1850, driven by the
              recorded emissions and checked against the Mauna Loa record;
              switch off an interaction and see what it was doing (A4.5, A4.6).
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.EARTH, GEO and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, GE = () => window.GEO;

  /* ============================================================
     THE GEOSPHERE — seismic rays through PREM
     The Preliminary Reference Earth Model (Dziewonski & Anderson 1981),
     isotropic, as published polynomials in x = r/6371 km. A ray from a
     surface quake keeps p = r·sin(i)/v along its whole path (Snell's law on a
     sphere); its angular distance and time are the exact integrals
         Δ(p) = 2∫ p dr / (r·√(η²−p²)),  T(p) = 2∫ η² dr / (r·√(η²−p²)),  η = r/v
     from its deepest point to the surface, taken shell by shell with r = r₀ + L·u²
     so the turning point's singularity integrates cleanly. S waves have no speed
     in a liquid: they stop at the outer core. Nothing here is fitted: the
     shadow zones, the times and the Earth's mass come out of the published model.
     ============================================================ */
  const RE = 6371, R_CMB = 3480, R_ICB = 1221.5;              // km
  const poly = c => x => { let s = 0, xp = 1; for (let k = 0; k < c.length; k++) { s += c[k] * xp; xp *= x; } return s; };
  const LM_RHO = poly([7.9565, -6.4761, 5.5283, -3.0807]);
  const PREM = [
    { r0: 0, r1: R_ICB, vp: poly([11.2622, 0, -6.3640]), vs: poly([3.6678, 0, -4.4475]), rho: poly([13.0885, 0, -8.8381]) },
    { r0: R_ICB, r1: R_CMB, vp: poly([11.0487, -4.0362, 4.8023, -13.5732]), vs: () => 0, rho: poly([12.5815, -1.2638, -3.6426, -5.5281]) },
    { r0: R_CMB, r1: 3630, vp: poly([15.3891, -5.3181, 5.5242, -2.5514]), vs: poly([6.9254, 1.4672, -2.0834, 0.9783]), rho: LM_RHO },
    { r0: 3630, r1: 5600, vp: poly([24.9520, -40.4673, 51.4832, -26.6419]), vs: poly([11.1671, -13.7818, 17.4575, -9.2777]), rho: LM_RHO },
    { r0: 5600, r1: 5701, vp: poly([29.2766, -23.6027, 5.5242, -2.5514]), vs: poly([22.3459, -17.2473, -2.0834, 0.9783]), rho: LM_RHO },
    { r0: 5701, r1: 5771, vp: poly([19.0957, -9.8672]), vs: poly([9.9839, -4.9324]), rho: poly([5.3197, -1.4836]) },
    { r0: 5771, r1: 5971, vp: poly([39.7027, -32.6166]), vs: poly([22.3512, -18.5856]), rho: poly([11.2494, -8.0298]) },
    { r0: 5971, r1: 6151, vp: poly([20.3926, -12.2569]), vs: poly([8.9496, -4.4597]), rho: poly([7.1089, -3.8045]) },
    { r0: 6151, r1: 6346.6, vp: poly([4.1875, 3.9382]), vs: poly([2.1519, 2.3481]), rho: poly([2.6910, 0.6924]) },
    { r0: 6346.6, r1: 6356, vp: () => 6.8, vs: () => 3.9, rho: () => 2.9 },
    { r0: 6356, r1: RE, vp: () => 5.8, vs: () => 3.2, rho: () => 2.6 }       // PREM's 3 km of ocean left out: the quake is on land
  ];
  /* what if the core were solid rock? Its speeds carry on smoothly from the bottom of the mantle */
  const xC = R_CMB / RE, xI = R_ICB / RE;
  const SOLID_OUTER = { vp: x => 13.72 + 0.48 * (xC - x) / (xC - xI), vs: x => 7.26 + 0.29 * (xC - x) / (xC - xI) };
  const SOLID_INNER = { vp: x => 14.20 + 0.40 * (1 - x / xI), vs: x => 7.55 + 0.10 * (1 - x / xI) };
  function earthOf(outer, inner) {                             // the layered Earth for a choice of core
    return PREM.map((g, i) => {
      if (outer === 'solid' && i === 1) return Object.assign({}, g, SOLID_OUTER);
      if (outer === 'solid' && i === 0) return Object.assign({}, g, SOLID_INNER);
      if (inner === 'liquid' && i === 0) return Object.assign({}, g, { vp: PREM[1].vp, vs: PREM[1].vs });
      return g;
    });
  }
  const vSurf = w => w === 'P' ? 5.8 : 3.2;
  const pOf = (i0, w) => RE * Math.sin(i0 * Math.PI / 180) / vSurf(w);
  /* one ray, from the surface down to where it turns (or stops): [r, θ, t] points */
  function leg(p, w, M, N) {
    N = N || 24;
    const pts = [[RE, 0, 0]];
    let th = 0, t = 0;
    for (let k = M.length - 1; k >= 0; k--) {
      const g = M[k], v = w === 'P' ? g.vp : g.vs, rt = g.r1, rb = g.r0, vt = v(rt / RE);
      if (vt <= 0) return { pts, th, t, stop: rt, k };                         // S meets liquid: it goes no further
      if (rt / vt <= p) return { pts, th, t, turn: rt, reflect: true, k };      // it cannot enter: it reflects off the top
      let lo = rb, turned = false;
      if (p > 0 && (rb === 0 || rb / v(rb / RE) < p)) {                         // it turns inside this shell
        let a = rb, b = rt;
        for (let it = 0; it < 48; it++) { const c = (a + b) / 2; if (c / v(c / RE) < p) a = c; else b = c; }
        lo = b; turned = true;
      }
      const Lr = rt - lo;
      let u1 = 1;
      for (let i = 0; i < N; i++) {
        const u0 = 1 - (i + 1) / N, um = (u0 + u1) / 2, r = lo + Lr * um * um, dr = 2 * Lr * um / N;
        const eta = r / v(r / RE), q = Math.sqrt(Math.max(1e-9, eta * eta - p * p));
        th += p * dr / (r * q); t += eta * eta * dr / (r * q);
        pts.push([lo + Lr * u0 * u0, th, t]);
        u1 = u0;
      }
      if (turned) return { pts, th, t, turn: lo, k };
    }
    return { pts, th, t, turn: 0, k: 0 };
  }
  /* the whole ray: down to its deepest point, then the mirror image back up.
     dist is the angle it travels (it can pass the far pole: > 180°); land is where it comes up, 0–180° */
  function ray(i0, w, M, N) {
    const p = pOf(i0, w), Lg = leg(p, w, M, N);
    if (Lg.stop != null) return { i0, p, w, stop: Lg.stop, pts: Lg.pts, t: Lg.t, k: Lg.k };
    const pts = Lg.pts.slice(), n = Lg.pts.length;
    for (let j = n - 2; j >= 0; j--) { const q = Lg.pts[j]; pts.push([q[0], 2 * Lg.th - q[1], 2 * Lg.t - q[2]]); }
    const dist = 2 * Lg.th * 180 / Math.PI, m = ((dist % 360) + 360) % 360;
    return { i0, p, w, pts, dist, land: m > 180 ? 360 - m : m, t: 2 * Lg.t, turn: Lg.turn, reflect: !!Lg.reflect, k: Lg.k };
  }
  /* what kind of wave a ray is, from where it turned */
  function branchOf(r, outer) {
    if (r.stop != null) return 'Sx';
    const deep = r.k <= 1;
    if (r.w === 'S') return deep ? 'Sc' : 'S';
    if (!deep) return 'P';
    if (outer === 'solid') return 'Pc';
    return r.k === 1 ? 'PKP' : r.reflect ? 'PKiKP' : 'PKIKP';
  }
  const BRANCH = {
    P: { name: 'P', long: 'P through the mantle' }, PKP: { name: 'PKP', long: 'P bent through the outer core' },
    PKiKP: { name: 'PKiKP', long: 'P bounced off the inner core' }, PKIKP: { name: 'PKIKP', long: 'P through the inner core' },
    Pc: { name: 'P', long: 'P through the solid core' }, S: { name: 'S', long: 'S through the mantle' },
    Sc: { name: 'S', long: 'S through the solid core' }, Sx: { name: 'S', long: 'S stopped by the liquid core' }
  };
  /* a dense fan of rays for one wave: every arrival at every distance comes from this table */
  function fanTable(w, outer, inner) {
    const M = earthOf(outer, inner), rows = [];
    const add = i0 => { const r = ray(i0, w, M, 16); r.b = branchOf(r, outer); rows.push(r); };
    for (let i0 = 0.04; i0 < 24; i0 += 0.04) add(i0);            // dense where the core rays leave
    for (let i0 = 24; i0 < 89.5; i0 += 0.25) add(i0);
    rows.forEach(r => { r.pts = null; });                           // the table keeps numbers, not paths
    return rows;
  }
  /* every wave that reaches a station at land° from the quake: time and relative strength.
     Strength is geometric spreading: the energy the rays between two take-off angles carry, spread
     over the ring of surface they land on (∝ sin i₀·di₀ / (sin Δ·dΔ·cos i₀)) */
  function arrivalsAt(T, land) {
    const out = [];
    for (let j = 1; j < T.length; j++) {
      const a = T[j - 1], b = T[j];
      if (a.stop != null || b.stop != null || a.b !== b.b || Math.abs(b.i0 - a.i0) > 0.3) continue;
      if (Math.abs(b.land - a.land) > 12) continue;                  // the far-pole fold, not a real bracket
      const lo = Math.min(a.land, b.land), hi = Math.max(a.land, b.land);
      if (land < lo || land > hi || hi === lo) continue;
      const f = (land - a.land) / (b.land - a.land), i0 = (a.i0 + (b.i0 - a.i0) * f) * Math.PI / 180;
      const dD = Math.abs(b.land - a.land) * Math.PI / 180, di = Math.abs(b.i0 - a.i0) * Math.PI / 180;
      const amp = Math.sqrt(Math.sin(i0) * di / (Math.max(0.03, Math.sin(land * Math.PI / 180)) * Math.max(dD, di * 0.05) * Math.cos(i0)));
      out.push({ t: a.t + (b.t - a.t) * f, amp, b: a.b, i0: i0 * 180 / Math.PI });
    }
    out.sort((x, y) => x.t - y.t);
    // one arrival per branch and time: neighbouring brackets of one branch are the same wave
    return out.filter((q, i) => !out.slice(0, i).some(o => o.b === q.b && Math.abs(o.t - q.t) < 4));
  }
  const firstOf = (A, pred) => { const a = A.find(pred || (() => true)); return a ? a.t : null; };
  /* the surface waves: along the ground at 3.7 km/s */
  const V_SURF = 3.7;
  const surfaceTime = land => land * Math.PI / 180 * RE / V_SURF;
  /* the Earth's mass, gravity and pressure, from PREM's densities alone */
  function interior() {
    const G = 6.674e-11, n = 6371, dr = 1000;                        // 1 km shells
    const rho = r => { const g = PREM.find(s => r >= s.r0 && r <= s.r1) || PREM[PREM.length - 1]; return g.rho(r / RE) * 1000; };
    const m = new Float64Array(n + 1);
    for (let i = 1; i <= n; i++) { const r = (i - 0.5) * dr; m[i] = m[i - 1] + 4 * Math.PI * r * r * rho(r / 1000) * dr; }
    const g = r => r > 0 ? G * m[Math.round(r)] / Math.pow(r * 1000, 2) : 0;
    const P = new Float64Array(n + 1);
    for (let i = n - 1; i >= 0; i--) { const r = i + 0.5; P[i] = P[i + 1] + rho(r) * g(r) * dr; }
    return { mass: m[n], gSurf: g(n), P: r => P[Math.round(clamp(r, 0, n))], rho: r => rho(r) / 1000, g };
  }

  /* ============================================================
     THE HYDROSPHERE — where Earth's water is, and how long it stays
     Volumes from Gleick (1996), the table the USGS publishes; yearly flows
     from Trenberth et al. (2007), with the land's share split into soil,
     plants, groundwater, rivers and lakes so every reservoir balances.
     A reservoir's residence time is its volume over its outflow.
     ============================================================ */
  const RES = [                                                // thousand km³
    { k: 'ocean', name: 'Oceans', v: 1338000, fresh: false, col: '#2E7FD0' },
    { k: 'ice', name: 'Ice sheets and glaciers', v: 24064, fresh: true, col: '#DCEBFA' },
    { k: 'ground', name: 'Groundwater', v: 23400, fresh: 'half', col: '#7D6A55' },
    { k: 'lakes', name: 'Lakes', v: 176.4, fresh: 'half', col: '#3FA7C9' },
    { k: 'soil', name: 'Soil moisture', v: 16.5, fresh: true, col: '#8C6F3E' },
    { k: 'air', name: 'The air (vapour and clouds)', v: 12.9, fresh: true, col: '#CFE6FF' },
    { k: 'rivers', name: 'Rivers', v: 2.12, fresh: true, col: '#57C3E8' },
    { k: 'life', name: 'Living things', v: 1.12, fresh: true, col: '#6FC46A' }
  ];
  const RESK = {}; RES.forEach((r, i) => { RESK[r.k] = i; });
  const WFLUX = [                                              // thousand km³ a year
    ['ocean', 'air', 413, 'evaporation'], ['air', 'ocean', 373, 'rain and snow on the sea'], ['air', 'soil', 110.5, 'rain on land'],
    ['air', 'ice', 2.5, 'snow on the ice sheets'], ['ice', 'ocean', 2.5, 'icebergs and meltwater'],
    ['soil', 'air', 24, 'evaporation from soil'], ['soil', 'life', 45, 'roots drink'], ['life', 'air', 45, 'leaves breathe out (transpiration)'],
    ['soil', 'ground', 13, 'soaks down (recharge)'], ['soil', 'rivers', 28.5, 'runs off'], ['ground', 'rivers', 12, 'springs and seepage'],
    ['ground', 'ocean', 1, 'seeps into the sea'], ['rivers', 'lakes', 10, 'fills lakes'], ['lakes', 'rivers', 6, 'drains out'],
    ['lakes', 'air', 4, 'evaporation from lakes'], ['rivers', 'ocean', 36.5, 'rivers reach the sea']
  ];
  const WOUT = RES.map(r => WFLUX.filter(f => f[0] === r.k).reduce((s, f) => s + f[2], 0));
  const residence = k => RES[RESK[k]].v / WOUT[RESK[k]];      // years
  const WATER_TOTAL = RES.reduce((s, r) => s + r.v, 0);        // thousand km³
  const OCEAN_AREA = 3.618e8;                                  // km²
  /* sea-level equivalents of the land ice (m): BedMachine Antarctica (Morlighem 2020) and Greenland
     (Morlighem 2017), and all other glaciers (Farinotti 2019) */
  const SLE = { antarctica: 57.9, greenland: 7.42, glaciers: 0.32 };
  const SLE_ALL = SLE.antarctica + SLE.greenland + SLE.glaciers;
  const riseByVolume = f => f * RES[RESK.ice].v * 1000 / OCEAN_AREA * 1000;     // m: melted volume spread over the ocean
  const ballD = kkm3 => 2 * Math.cbrt(3 * kkm3 * 1000 / (4 * Math.PI));        // km across, for a volume in thousand km³
  /* the balls the USGS drew: all water; all fresh water; liquid fresh water; lakes and rivers.
     Fresh groundwater is 10.53 of the 23.4 million km³; fresh lakes 91 of 176 thousand; swamps 11.47 thousand */
  function ballsOf(melt) {
    const ice = RES[RESK.ice].v * (1 - melt);
    const liquidFresh = 10530 + 91 + 11.47 + 2.12;
    return [
      { k: 'all', name: 'All the water on Earth', v: WATER_TOTAL + 300 + 11.47, col: '#3F8FE0' },
      { k: 'fresh', name: 'All the fresh water', v: ice + 300 * (1 - melt) + liquidFresh + 16.5 + 12.9 + 1.12, col: '#9FD4FF' },
      { k: 'liquid', name: 'Fresh liquid water', v: liquidFresh, col: '#6FC1F2' },
      { k: 'surface', name: 'Fresh lakes and rivers', v: 91 + 2.12, col: '#B6F0FF' }
    ].map(b => Object.assign(b, { d: ballD(b.v) }));
  }
  /* the expected share of tagged water in each reservoir after t years: p(t) = p(0)·e^{Qt},
     by scaling and squaring (the rates span nine days to ten thousand years, so no simple stepping) */
  const WQ = (() => {
    const n = RES.length, Q = RES.map(() => new Float64Array(n));
    WFLUX.forEach(([a, b, f]) => { const i = RESK[a], j = RESK[b]; Q[i][j] += f / RES[i].v; Q[i][i] -= f / RES[i].v; });
    return Q;
  })();
  function mmul(A, B) {
    const n = A.length, C = A.map(() => new Float64Array(n));
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i][k]; if (a) for (let j = 0; j < n; j++) C[i][j] += a * B[k][j]; }
    return C;
  }
  function expQ(t) {
    const n = WQ.length;
    let s = 0; const nrm = Math.max(...WQ.map(r => r.reduce((a, b) => a + Math.abs(b), 0))) * t;
    while (nrm / Math.pow(2, s) > 0.5) s++;
    const X = WQ.map(r => r.map(v => v * t / Math.pow(2, s)));
    let E = X.map((r, i) => r.map((_, j) => i === j ? 1 : 0)), term = E.map(r => Float64Array.from(r));
    for (let k = 1; k <= 12; k++) { term = mmul(term, X).map(r => r.map(v => v / k)); E = E.map((r, i) => r.map((v, j) => v + term[i][j])); }
    for (let i = 0; i < s; i++) E = mmul(E, E);
    return E;
  }
  const expected = (from, t) => Array.from(expQ(t)[RESK[from]]);
  /* one tagged molecule's next hop: an exponential wait, then a destination in proportion to the flows out */
  function hop(rng, k) {
    const i = RESK[k], outs = WFLUX.filter(f => f[0] === k), tot = WOUT[i];
    let u = rng() * tot, to = outs[outs.length - 1][1];
    for (const f of outs) { if (u < f[2]) { to = f[1]; break; } u -= f[2]; }
    return { to, wait: -Math.log(1 - rng()) * RES[i].v / tot };
  }

  /* ============================================================
     THE ATMOSPHERE — a radiosonde through a layered sky
     Temperature against height for three climates: the US Standard Atmosphere
     (1976) for the middle latitudes, and the AFGL tropical and subarctic-winter
     profiles (Anderson et al. 1986). Pressure follows from the hydrostatic law,
     layer by layer: dP/dz = −ρg with ρ = PM/(RT).
     ============================================================ */
  const G0 = 9.80665, M_AIR = 0.0289644, R_GAS = 8.31446, M_HE = 0.0040026, P0 = 101325;
  const CLIMATES = {
    tropics: { name: 'Singapore, near the equator', short: 'the tropics', nodes: [[0, 299.7], [17, 194.8], [20, 206.7], [25, 221.4], [30, 232.3], [40, 254.0], [47.5, 269.6], [50, 270.2]] },
    mid: { name: 'Denver, in the middle latitudes', short: 'the middle latitudes', nodes: [[0, 288.15], [11, 216.65], [20, 216.65], [32, 228.65], [47, 270.65], [50, 270.65]] },
    polar: { name: 'Svalbard in winter, near the pole', short: 'a polar winter', nodes: [[0, 257.2], [1, 259.1], [9, 217.2], [25, 214.0], [30, 217.4], [40, 243.2], [50, 265.7]] }
  };
  const AIRC = {};
  function airOf(site) {
    if (AIRC[site]) return AIRC[site];
    const N = CLIMATES[site].nodes, lay = [];
    let P = P0;
    for (let i = 0; i < N.length - 1; i++) {
      const [z0, T0] = N[i], [z1, T1] = N[i + 1], Lr = (T1 - T0) / ((z1 - z0) * 1000);
      lay.push({ z0, z1, T0, L: Lr, P0: P });
      const dz = (z1 - z0) * 1000;
      P = Math.abs(Lr) < 1e-9 ? P * Math.exp(-G0 * M_AIR * dz / (R_GAS * T0)) : P * Math.pow((T0 + Lr * dz) / T0, -G0 * M_AIR / (R_GAS * Lr));
    }
    const at = z => {
      z = clamp(z, 0, 50);
      const l = lay.find(q => z <= q.z1) || lay[lay.length - 1];
      const dz = (z - l.z0) * 1000, T = l.T0 + l.L * dz;
      const P = Math.abs(l.L) < 1e-9 ? l.P0 * Math.exp(-G0 * M_AIR * dz / (R_GAS * l.T0)) : l.P0 * Math.pow(T / l.T0, -G0 * M_AIR / (R_GAS * l.L));
      return { T, P, rho: P * M_AIR / (R_GAS * T) };
    };
    return (AIRC[site] = at);
  }
  const heightWhereP = (site, frac) => { const A = airOf(site); let a = 0, b = 50; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (A(c).P > P0 * frac) a = c; else b = c; } return (a + b) / 2; };
  /* the tropopause, as the WMO defines it: the lowest height, above any inversion at the ground, where the
     air stops cooling by more than 2 °C per km */
  function tropopause(site) {
    const N = CLIMATES[site].nodes;
    for (let i = 1; i < N.length - 1; i++) {
      if (N[i][0] < 2) continue;
      const lapse = -(N[i + 1][1] - N[i][1]) / (N[i + 1][0] - N[i][0]);
      if (lapse <= 2) return N[i];
    }
    return N[1];
  }
  /* latex sounding balloons (Totex's published burst diameters), filled with helium */
  const BALLOONS = { 350: { m: 0.35, burst: 4.72 }, 600: { m: 0.60, burst: 6.02 }, 1200: { m: 1.20, burst: 8.63 } };
  const PAYLOAD = 0.25;                                        // kg: radiosonde, string and parachute
  /* the drag of a balloon across the drag crisis: 0.47 at low Reynolds number, 0.25 above it */
  const cdBalloon = Re => 0.25 + 0.22 / (1 + Math.pow(Re / 2.5e5, 4));
  const MU_AIR = T => 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4);  // Sutherland's law
  function balloon(site, type, D0) {
    const a0 = airOf(site)(0), V0 = Math.PI / 6 * D0 * D0 * D0;
    return { site, type, D0, mHe: a0.P * M_HE / (R_GAS * a0.T) * V0, z: 0, v: 0, t: 0, D: D0, burst: null, landed: null, up: true };
  }
  /* a balloon rises at the speed where its drag balances its free lift; its helium swells as the
     pressure falls (V ∝ T/P), and it bursts at its rated diameter. Then the sonde falls under its parachute */
  function flyTo(B, tEnd) {
    const A = airOf(B.site), bt = BALLOONS[B.type];
    while (B.t < tEnd - 1e-9) {
      const dt = Math.min(1, tEnd - B.t), q = A(B.z / 1000);
      if (B.up) {
        const V = B.mHe * R_GAS * q.T / (q.P * M_HE);
        B.D = Math.cbrt(6 * V / Math.PI);
        if (B.D >= bt.burst) { B.up = false; B.burst = { z: B.z, t: B.t, D: B.D }; continue; }
        const lift = (q.rho * V - B.mHe - bt.m - PAYLOAD) * G0, Ar = Math.PI * B.D * B.D / 4;
        if (lift <= 0 && B.z <= 0) { B.grounded = true; B.v = 0; B.t = tEnd; break; }
        let v = 5;
        for (let it = 0; it < 6; it++) { const Cd = cdBalloon(q.rho * v * B.D / MU_AIR(q.T)); v = lift > 0 ? Math.sqrt(2 * lift / (q.rho * Cd * Ar)) : 0; }
        B.v = v;
      } else {
        const m = PAYLOAD + 0.1, Ac = 0.2;                     // the sonde, a shred of balloon, a half-metre parachute
        B.v = -Math.sqrt(2 * m * G0 / (q.rho * 1.3 * Ac));
        if (B.z <= 0) { B.z = 0; B.v = 0; if (B.landed == null) B.landed = B.t; B.t = tEnd; break; }
      }
      B.z = Math.max(0, B.z + B.v * dt); B.t += dt;
    }
    return B;
  }
  const ascentRate = (site, type, D0) => { const B = flyTo(balloon(site, type, D0), 1); return B.v; };
  function burstOf(site, type, D0) { const B = balloon(site, type, D0); while (!B.burst && B.t < 20000) flyTo(B, B.t + 60); return B.burst; }

  /* ============================================================
     THE BIOSPHERE — the Miami model (Lieth 1975)
     Net primary productivity in grams of dry plant matter per square metre
     per year is the smaller of a temperature-limited and a rain-limited value,
     each fitted by Lieth to measured productivity across the world's biomes.
     ============================================================ */
  const nppT = T => 3000 / (1 + Math.exp(1.315 - 0.119 * T));
  const nppP = P => 3000 * (1 - Math.exp(-0.000664 * P));
  const npp = (T, P) => Math.min(nppT(T), nppP(P));
  const limitOf = (T, P) => { const a = nppT(T), b = nppP(P); return Math.abs(a - b) / Math.max(a, b) < 0.06 ? 'both' : a < b ? 'warmth' : 'water'; };
  /* annual mean temperature (°C) and rainfall (mm) from each place's climate normals */
  const PLACES = [
    { k: 'manaus', name: 'Manaus, Brazil', lat: -3.1, lon: -60.0, T: 27.6, P: 2300, biome: 'tropical rainforest' },
    { k: 'kisangani', name: 'Kisangani, DR Congo', lat: 0.5, lon: 25.2, T: 25.3, P: 1750, biome: 'tropical rainforest' },
    { k: 'mumbai', name: 'Mumbai, India', lat: 19.1, lon: 72.9, T: 27.4, P: 2200, biome: 'tropical seasonal forest' },
    { k: 'nairobi', name: 'Nairobi, Kenya', lat: -1.3, lon: 36.8, T: 19.0, P: 900, biome: 'savanna' },
    { k: 'delhi', name: 'Delhi, India', lat: 28.6, lon: 77.2, T: 25.3, P: 800, biome: 'dry forest and scrub' },
    { k: 'timbuktu', name: 'Timbuktu, Mali', lat: 16.8, lon: -3.0, T: 29.0, P: 200, biome: 'semi-desert' },
    { k: 'cairo', name: 'Cairo, Egypt', lat: 30.0, lon: 31.2, T: 22.5, P: 25, biome: 'hot desert' },
    { k: 'death', name: 'Death Valley, USA', lat: 36.5, lon: -116.9, T: 25.1, P: 60, biome: 'hot desert' },
    { k: 'forks', name: 'Forks, Washington, USA', lat: 47.9, lon: -124.4, T: 10.0, P: 3000, biome: 'temperate rainforest' },
    { k: 'london', name: 'London, UK', lat: 51.5, lon: -0.1, T: 11.3, P: 620, biome: 'temperate forest' },
    { k: 'chicago', name: 'Chicago, USA', lat: 41.9, lon: -87.6, T: 10.4, P: 950, biome: 'temperate forest and prairie' },
    { k: 'moscow', name: 'Moscow, Russia', lat: 55.8, lon: 37.6, T: 5.8, P: 700, biome: 'mixed and boreal forest' },
    { k: 'ulaanbaatar', name: 'Ulaanbaatar, Mongolia', lat: 47.9, lon: 106.9, T: -0.4, P: 270, biome: 'cold steppe' },
    { k: 'yakutsk', name: 'Yakutsk, Russia', lat: 62.0, lon: 129.7, T: -8.8, P: 240, biome: 'taiga (boreal forest)' },
    { k: 'utqiagvik', name: 'Utqiaġvik, Alaska', lat: 71.3, lon: -156.8, T: -11.2, P: 115, biome: 'tundra' },
    { k: 'vostok', name: 'Vostok Station, Antarctica', lat: -78.5, lon: 106.8, T: -55.0, P: 22, biome: 'ice sheet' }
  ];
  const PLACEK = {}; PLACES.forEach(q => { PLACEK[q.k] = q; });
  /* how far life reaches: the deepest and highest living things found (km from sea level) */
  const LIFE_RANGE = { deepRock: -5.0, trench: -10.9, bird: 11.3, spider: 6.7 };

  /* ============================================================
     LINKS — carbon through the four spheres
     Five stores: the air; land plants and soil (the biosphere); the ocean's
     mixed layer, its middle and its deep water (the hydrosphere); the
     geosphere's fossil fuels feed the air. Plants take up more CO₂ as it
     rises (β); the ocean's surface buffers what it takes (the Revelle factor,
     10). Emissions are the Global Carbon Budget's. The air–sea exchange (0.12 a
     year, from the gross flux) and the deep ocean's ventilation (a thousand
     years) are physical; the mixing into the ocean's middle and β were fitted
     once to the ice-core and Mauna Loa record and the measured sinks.
     ============================================================ */
  const PPM = 2.124;                                           // GtC in the air per ppm of CO₂
  const FOSSIL = [[1750, 0.003], [1800, 0.008], [1850, 0.054], [1860, 0.091], [1870, 0.147], [1880, 0.236], [1890, 0.356], [1900, 0.534],
    [1910, 0.819], [1920, 0.932], [1930, 1.053], [1940, 1.299], [1950, 1.63], [1960, 2.57], [1970, 4.05], [1980, 5.29], [1990, 6.13],
    [2000, 6.75], [2010, 9.06], [2015, 9.63], [2019, 9.9], [2020, 9.46], [2023, 10.1]];
  const LANDUSE = [[1750, 0.35], [1800, 0.5], [1850, 0.9], [1900, 1.0], [1950, 1.6], [1960, 1.6], [1970, 1.5], [1980, 1.5], [1990, 1.6], [2000, 1.5], [2010, 1.4], [2020, 1.2], [2023, 1.1]];
  const CO2_OBS = [[1750, 277], [1800, 283], [1850, 285.2], [1900, 295.7], [1925, 305], [1950, 311.3], [1959, 315.98], [1965, 320.04], [1970, 325.68], [1975, 331.11],
    [1980, 338.75], [1985, 346.12], [1990, 354.39], [1995, 360.82], [2000, 369.71], [2005, 379.98], [2010, 389.90], [2015, 401.01], [2020, 414.21], [2023, 421.08]];
  const lerpT = (T, y) => { if (y <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const [a, va] = T[i - 1], [b, vb] = T[i]; return va + (vb - va) * (y - a) / (b - a); } return T[T.length - 1][1]; };
  const CARB = { ka: 0.12, kmi: 0.07862, kid: 0.0015, beta: 0.10800, xi: 10, A0: 277 * PPM, V0: 550, L0: 1500, M0: 900, I0: 9000, D0: 28100, NPP0: 60, VOLC: 0.1 };
  const FUTURE = {
    hold: y => 10.1, stop: y => y < 2030 ? 10.1 : 0,
    double: y => 10.1 * (1 + clamp((y - 2023) / 57, 0, 1)), none: () => 0
  };
  function carbonStart() {
    const c = CARB;
    return { y: 1750, A: c.A0, V: c.V0, Ls: c.L0, M: c.M0, I: c.I0, D: c.D0, fossilOut: 0, cumE: 0, cumOcean: 0, cumLand: 0, f: null };
  }
  function carbonRates(C, o) {
    const c = CARB, y = C.y;
    const ef = o.fossil === 'none' ? 0 : y <= 2023 ? lerpT(FOSSIL, y) : FUTURE[o.fossil](y);
    const el = o.clearing ? (y <= 2023 ? lerpT(LANDUSE, y) : o.fossil === 'stop' && y >= 2030 ? 0 : 1.1) : 0;
    const npp = c.NPP0 * (1 + (o.plants ? c.beta : 0) * Math.log(C.A / c.A0));
    const Aeq = c.A0 * (1 + c.xi * (C.M - c.M0) / c.M0);
    const fas = o.ocean ? c.ka * (C.A - Aeq) : 0;
    const fmi = c.kmi * (C.M / c.M0 - C.I / c.I0) * c.M0, fid = c.kid * (C.I / c.I0 - C.D / c.D0) * c.I0;
    const litter = C.V * c.NPP0 / c.V0, decay = C.Ls * c.NPP0 / c.L0;
    return { ef, el, npp, fas, fmi, fid, litter, decay, volc: c.VOLC, weather: c.VOLC };
  }
  function carbonStep(C, dt, o) {
    const r = carbonRates(C, o);
    C.A += (r.ef + r.el - r.npp + r.decay - r.fas + r.volc - r.weather) * dt;
    C.V += (r.npp - r.litter - r.el) * dt; C.Ls += (r.litter - r.decay) * dt;
    C.M += (r.fas - r.fmi) * dt; C.I += (r.fmi - r.fid) * dt; C.D += r.fid * dt;
    C.fossilOut += r.ef * dt;
    if (C.y >= 1850) { C.cumE += (r.ef + r.el) * dt; C.cumOcean += r.fas * dt; C.cumLand += (r.npp - r.decay) * dt; }
    C.y += dt; C.f = r;
    return C;
  }
  function carbonRun(o, y1) {
    const C = carbonStart(), rows = [];
    while (C.y < y1 - 1e-9) {
      carbonStep(C, 0.1, o);
      if (Math.abs(C.y - Math.round(C.y)) < 0.05) rows.push({ y: Math.round(C.y), ppm: C.A / PPM, cumE: C.cumE, cumOcean: C.cumOcean, cumLand: C.cumLand, air: C.A - CARB.A0, f: C.f });
    }
    return rows;
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'geo', label: 'Find the core without digging', teaches: ['A4.1'] },
    { value: 'hydro', label: 'Where the water is, and how long it stays', teaches: ['A4.2'] },
    { value: 'atmo', label: 'Climb through the air', teaches: ['A4.3'] },
    { value: 'bio', label: 'What limits life here?', teaches: ['A4.4'] },
    { value: 'links', label: 'Carbon through the four spheres', teaches: ['A4.5', 'A4.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'geo',
    wave: 'both', outer: 'liquid', inner: 'solid', fan: 'many', aim: 12, station: 60, labels: true,
    release: 'air', melt: 0,
    site: 'mid', bal: 600, fill: 1.5, names: false,
    place: 'yakutsk', warm: 0, wet: 0, reach: false,
    fossil: 'hold', clearing: true, ocean: true, plants: true
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  function rnd(S) { S.seed = (S.seed * 16807) % 2147483647; return (S.seed - 1) / 2147483646; }
  function gauss(S) { let u = 0; for (let i = 0; i < 6; i++) u += rnd(S); return (u - 3) * Math.SQRT2; }

  /* ---------------- geo: the quake's rays, cached by the core chosen ---------------- */
  const QUAKE_RATE = 60;                                       // seconds after the quake per second on screen
  const T_END = 34 * 60;
  const STATION_MIN = 12;                                      // closer than this the rays stay in the crust and upper mantle
  const coreKey = p => p.outer === 'solid' ? 'solid|solid' : 'liquid|' + p.inner;
  const FANS = {};
  function fansOf(p) {
    const key = coreKey(p);
    if (!FANS[key]) { const [o, i] = key.split('|'); FANS[key] = { P: fanTable('P', o, i), S: fanTable('S', o, i) }; }
    return FANS[key];
  }
  const range = (a, b, st) => { const out = []; for (let v = a; v <= b + 1e-9; v += st) out.push(+v.toFixed(3)); return out; };
  const FAN_I0 = { many: range(0.4, 13.3, 0.75).concat(range(13.8, 33, 1.9)), few: range(1.0, 13.3, 2.0).concat(range(14.5, 33, 4.5)) };
  const SHOWN = {};
  function shownRays(p) {
    const key = coreKey(p) + '|' + p.fan;
    if (SHOWN[key]) return SHOWN[key];
    const [o, i] = coreKey(p).split('|'), M = earthOf(o, i), out = { P: [], S: [] };
    for (const w of ['P', 'S']) FAN_I0[p.fan].forEach(i0 => { const r = ray(i0, w, M, 14); r.b = branchOf(r, o); out[w].push(r); });
    return (SHOWN[key] = out);
  }
  function aimRay(S) {
    const p = S.p, w = p.wave === 'S' ? 'S' : 'P', key = coreKey(p) + '|' + w + '|' + p.aim;
    if (S._aim && S._aim.key === key) return S._aim.r;
    const [o, i] = coreKey(p).split('|'), r = ray(p.aim, w, earthOf(o, i), 20);
    r.b = branchOf(r, o); r.hl = true;
    S._aim = { key, r };
    return r;
  }
  /* what reaches a station: body waves from the fan tables, surface waves along the ground */
  function stationArrivals(p, land) {
    const F = fansOf(p);
    const P = arrivalsAt(F.P, land).map(a => Object.assign(a, { w: 'P' }));
    const Sw = arrivalsAt(F.S, land).map(a => Object.assign(a, { w: 'S' }));
    return { P, S: Sw, surf: surfaceTime(land), all: P.concat(Sw).sort((a, b) => a.t - b.t) };
  }
  /* the distances no wave of a kind reaches: the shadow zones, measured off the fan */
  function shadowsOf(p) {
    const key = coreKey(p);
    if (shadowsOf.c[key]) return shadowsOf.c[key];
    const F = fansOf(p), out = {};
    for (const w of ['P', 'S']) {
      const gaps = []; let a = null;
      for (let d = STATION_MIN; d <= 180; d += 0.5) {
        const hit = arrivalsAt(F[w], Math.min(179.9, d)).length > 0;
        if (!hit && a == null) a = d;
        if (hit && a != null) { gaps.push([a, d - 0.5]); a = null; }
      }
      if (a != null) gaps.push([a, 180]);
      out[w] = gaps.filter(g => g[1] - g[0] >= 2);
    }
    return (shadowsOf.c[key] = out);
  }
  shadowsOf.c = {};
  /* the ground's motion at a station: each arrival a wave packet, S larger and slower than P,
     the surface waves last and largest; sizes from each ray bundle's geometric spreading */
  function motionAt(A, land, t) {
    let m = 0.012 * (Math.sin(t * 0.73) + 0.6 * Math.sin(t * 1.91 + 1.3));
    for (const a of A.all) {
      const tau = t - a.t;
      if (tau < 0) continue;
      const S_ = a.w === 'S', amp = Math.min(1.6, a.amp * (S_ ? 5.5 : 3.2)), per = S_ ? 15 : 9;
      m += amp * (1 - Math.exp(-tau / (S_ ? 6 : 4))) * Math.exp(-tau / (S_ ? 110 : 70)) * Math.sin(TAU * tau / per + a.i0);
    }
    const ts = t - A.surf;
    if (ts > -200) {
      const env = Math.exp(-Math.pow((ts - 100) / 120, 2)), amp = 1.1 / Math.sqrt(Math.max(0.12, Math.sin(land * Math.PI / 180)));
      m += amp * env * Math.sin(TAU * ts / (22 + ts * 0.02));
    }
    return m;
  }

  /* ---------------- hydro: tagged water in the cycle ---------------- */
  const HY_N = 300, HY_T0 = 1e-3, HY_T1 = 1e5, HY_DEC = 2.5;   // molecules; the clock runs 9 hours → 100,000 years, a decade every 2.5 s
  const HY_LOG0 = Math.log10(HY_T0), HY_LOG1 = Math.log10(HY_T1);
  const EXP = {};
  function expectedCurves(from) {
    if (EXP[from]) return EXP[from];
    const out = [];
    for (let lg = HY_LOG0; lg <= HY_LOG1 + 1e-9; lg += 0.1) out.push({ lg, p: expected(from, Math.pow(10, lg)) });
    return (EXP[from] = out);
  }
  function hydroStart(S) {
    const from = S.p.release, rng = () => rnd(S), hy = { clock: HY_T0, mol: [], flights: [], hist: [], nextLog: HY_LOG0 };
    for (let i = 0; i < HY_N; i++) { const h = hop(rng, from); hy.mol.push({ k: from, t: h.wait, to: h.to }); }
    S.hy = hy;
    hydroAdvance(S, 0);
  }
  function hydroCounts(hy) { const c = RES.map(() => 0); hy.mol.forEach(m => { c[RESK[m.k]]++; }); return c; }
  function hydroAdvance(S, dt) {
    const hy = S.hy, rng = () => rnd(S);
    hy.clock = Math.min(HY_T1, hy.clock * Math.pow(10, dt / HY_DEC));
    for (const m of hy.mol) {
      while (m.t <= hy.clock) {
        if (hy.flights.length < 90) hy.flights.push({ a: m.k, b: m.to, t0: S.ta });
        m.k = m.to;
        const h = hop(rng, m.k); m.t += h.wait; m.to = h.to;
      }
    }
    hy.flights = hy.flights.filter(f => S.ta - f.t0 < 0.7);
    const lg = Math.log10(hy.clock);
    while (hy.nextLog <= lg + 1e-9) { hy.hist.push({ lg: hy.nextLog, c: hydroCounts(hy) }); hy.nextLog += 0.04; }
  }

  /* ---------------- atmo: the flight ---------------- */
  const FLIGHT_RATE = 60;                                      // flight seconds per second on screen
  const READ_EVERY = 20;                                       // s between the sonde's reports
  function atmoStart(S) {
    const p = S.p;
    S.at = { B: balloon(p.site, p.bal, p.fill), rec: [], next: 0 };
    atmoRead(S);
  }
  function atmoRead(S) {
    const at = S.at, B = at.B;
    while (at.next <= B.t + 1e-9) {
      const q = airOf(B.site)(B.z / 1000);
      at.rec.push({ t: at.next, z: B.z / 1000, T: q.T - 273.15 + 0.15 * gauss(S), P: q.P / 100 + 0.2 * gauss(S), up: B.up, D: B.D });
      at.next += READ_EVERY;
      if (at.rec.length > 2000) at.rec.shift();
    }
  }
  const airAbove = (site, z) => airOf(site)(z).P / P0;

  /* ---------------- links: the carbon clock ---------------- */
  const LINK_RATE = 6;                                         // years per second on screen
  const linkOpts = p => ({ fossil: p.fossil, clearing: p.clearing, ocean: p.ocean, plants: p.plants });
  const allOn = p => p.clearing && p.ocean && p.plants;
  const GHOST = {};
  function ghostRun(p) {                                       // every interaction on, the same fossil path: what the switches take away
    const key = p.fossil;
    if (!GHOST[key]) GHOST[key] = carbonRun({ fossil: p.fossil, clearing: true, ocean: true, plants: true }, 2100);
    return GHOST[key];
  }
  const snapRow = C => ({ y: Math.round(C.y), ppm: C.A / PPM, cumE: C.cumE, cumOcean: C.cumOcean, cumLand: C.cumLand, air: C.A - CARB.A0, f: C.f });
  function linksStart(S) {
    const o = linkOpts(S.p), C = carbonStart();
    while (C.y < 1850 - 1e-6) carbonStep(C, 0.1, o);
    C.y = 1850;
    const r0 = snapRow(C);
    S.ln = { C, rows: [r0], base: { A: C.A, cumE: C.cumE, cumOcean: C.cumOcean, cumLand: C.cumLand } };
  }
  function linksAdvance(S, dt) {
    const ln = S.ln, C = ln.C, o = linkOpts(S.p);
    let years = Math.min(dt * LINK_RATE, 2100 - C.y);
    while (years > 1e-9) {
      const h = Math.min(0.1, years);
      carbonStep(C, h, o); years -= h;
      if (C.y >= ln.rows[ln.rows.length - 1].y + 1 - 1e-6) ln.rows.push(snapRow(C));
    }
  }

  /* ---------------- set up and step ---------------- */
  const HOMES = {
    geo: { theta: -1.36, phi: 0.12, dist: 4.4, target: [0, 0, 0], fov: 0.66, min: 1.8, max: 10 },
    hydro: { theta: -1.62, phi: 0.52, dist: 3.9, target: [0, 0, 0.05], fov: 0.66, min: 1.5, max: 9 },
    bio: { theta: -1.57, phi: 0.30, dist: 4.5, target: [0, 0, 0], fov: 0.66, min: 1.6, max: 10 },
    links: { theta: -1.57, phi: 0.22, dist: 4.6, target: [0, 0, 0], fov: 0.66, min: 2, max: 10 }
  };
  function homeFor(su, narrow) {
    const h = HOMES[su];
    if (!h) return null;
    return narrow ? Object.assign({}, h, { dist: h.dist * 1.25 }) : h;
  }
  function setup(S) {
    const p = S.p, home = homeFor(p.setup, !!S._narrow);
    if (!home) { S.cam = null; S.camFor = p.setup; }
    else if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera(Object.assign({}, home, { target: home.target.slice() }));
      S.cam.minDist = home.min; S.cam.maxDist = home.max; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
    S.seed = 20260925; S.ta = 0;
    S.tq = 0;
    S._aim = null;
    if (p.setup === 'hydro') hydroStart(S);
    if (p.setup === 'atmo') atmoStart(S);
    if (p.setup === 'links') linksStart(S);
    if (p.setup === 'bio') { S.spin = null; S._placeShown = null; S._aimView = null; }
  }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'geo') S.tq = Math.min(T_END, S.tq + dt * QUAKE_RATE);
    else if (p.setup === 'hydro') hydroAdvance(S, dt);
    else if (p.setup === 'atmo') {
      const B = S.at.B;
      if (B.landed == null && !B.grounded) { flyTo(B, B.t + dt * FLIGHT_RATE); atmoRead(S); }
    } else if (p.setup === 'links') linksAdvance(S, dt);
    else if (p.setup === 'bio') bioAim(S, dt);
  }
  /* bio: a new place turns the globe to it — longitude by spinning the planet, latitude by tilting the
     view — and then leaves the view to the student */
  function bioAim(S, dt) {
    const p = S.p, cam = S.cam, q0 = PLACEK[p.place];
    if (!cam) return;
    if (S._placeShown !== p.place) {
      S._placeShown = p.place;
      S._aimView = { spin: cam.theta - q0.lon * Math.PI / 180, phi: clamp(q0.lat * Math.PI / 180 * 0.75, -0.95, 0.95) };
      if (S.spin == null) { S.spin = S._aimView.spin; cam.phi = S._aimView.phi; S._aimView = null; return; }
    }
    if (!S._aimView) return;
    const k = 1 - Math.exp(-dt * 5), dsp = ((S._aimView.spin - S.spin + Math.PI) % TAU + TAU) % TAU - Math.PI, dph = S._aimView.phi - cam.phi;
    S.spin += dsp * k; cam.phi += dph * k;
    if (Math.abs(dsp) < 0.002 && Math.abs(dph) < 0.002) S._aimView = null;
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const AX = { n: [0, -1, 0], e1: [1, 0, 0], e2: [0, 0, 1] };        // the cut faces −Y; the quake stands at the top
  const SUN = [-0.35, -0.80, 0.49];
  const th = g => g.theme;
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const fmtN = (v, d) => v.toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  /* keep the globe where the stage has room for it: its centre at (W/2 + fx·W, H/2 + fy) on screen,
     however the student turns the view */
  function placeGlobe(S, g, fx, fy) {
    const cam = S.cam, k = cam.dist / cam._k;
    const sx = -fx * g.w * k, sy = fy * k;
    cam.target = [cam.r[0] * sx + cam.u[0] * sy, cam.r[1] * sx + cam.u[1] * sy, cam.r[2] * sx + cam.u[2] * sy];
    cam.update();
  }
  function earthReady(g, x, y) {
    if (window.EARTH && EARTH.ready()) return true;
    if (window.EARTH) EARTH.load();
    const ctx = g.ctx;
    ctx.save(); ctx.font = mono(11); ctx.fillStyle = th(g)['text-3']; ctx.textAlign = 'center';
    ctx.fillText(window.EARTH && EARTH.failed() ? 'the Earth image could not be loaded' : 'loading the Earth…', x, y);
    ctx.restore();
    return false;
  }
  function tag(ctx, x, y, text, col, o) {                     // a label on a dark pill
    o = o || {};
    ctx.save(); ctx.font = o.font || mono(9, 600);
    const tw = ctx.measureText(text).width, pw = tw + 10, ph = o.h || 15;
    let x0 = o.align === 'right' ? x - pw : o.align === 'center' ? x - pw / 2 : x;
    ctx.fillStyle = o.bg || 'rgba(6,10,20,.84)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y - ph / 2, pw, ph, 4); else ctx.rect(x0, y - ph / 2, pw, ph); ctx.fill();
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + 5, y + 0.5);
    ctx.restore();
    return { x0, x1: x0 + pw };
  }

  /* ---------------- geo ---------------- */
  const LAYER_TEXT = [
    { r: 6358, th: -0.20, name: 'crust', sub: '0–35 km · solid rock' },
    { r: 4750, th: -0.33, name: 'mantle', sub: 'solid rock · to 2,891 km' },
    { r: 2650, th: -0.80, name: 'outer core', sub: 'liquid iron · to 5,150 km', solid: 'made solid (what if?)' },
    { r: 0, th: 0, name: 'inner core', sub: 'solid iron · 5,200 °C', liquid: 'made liquid (what if?)' }
  ];
  function drawGeo(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), GX = GE(), W = g.w, H = g.h, narrow = W < K.NARROW;
    const C = [0, 0, 0], t = S.tq;
    placeGlobe(S, g, narrow ? 0 : -0.15, narrow ? 40 : 28);
    const faceOn = cam.eye[0] * AX.n[0] + cam.eye[1] * AX.n[1] + cam.eye[2] * AX.n[2] > 0;
    const c0 = cam.project(C), fp = (r, a) => GX.facePoint(cam, C, 1, AX, r, a);
    if (earthReady(g, c0.x, c0.y)) {
      EARTH.draw(ctx, cam, C, 1, { spin: 2.2, sun: SUN, ambient: 0.28,
        cut: { n: AX.n, e1: AX.e1, e2: AX.e2, face: GX.interiorFace({ outer: p.outer, inner: p.inner, phase: S.ta }) } });
    }
    const A = stationArrivals(p, p.station), sh = shadowsOf(p);
    if (faceOn) {
      // the layers named in the left half, out of the rays' way
      if (p.labels) {
        ctx.save();
        LAYER_TEXT.forEach(L0 => {
          const q = L0.r ? fp(L0.r - (L0.name === 'crust' ? 0 : 0), L0.th * Math.PI) : c0;
          if (!q.ok) return;
          const sub = p.outer === 'solid' && L0.solid ? L0.solid : p.outer === 'solid' && L0.name === 'inner core' ? 'solid (what if?)' :
            p.inner === 'liquid' && L0.liquid ? L0.liquid : L0.sub;
          if (L0.name === 'crust') {
            const at = fp(6371, -0.22 * Math.PI), tx = at.x - 18, ty = at.y - 16;
            ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(at.x, at.y); ctx.lineTo(tx, ty); ctx.stroke();
            tag(ctx, tx, ty, 'crust · 0–35 km', '#F0DCC0', { align: 'right' });
            return;
          }
          ctx.font = sans(narrow ? 11 : 12, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const nw = ctx.measureText(L0.name.toUpperCase()).width;
          ctx.font = mono(8.5, 600);
          const sw2 = narrow ? 0 : ctx.measureText(sub).width, bw2 = Math.max(nw, sw2) + 12, bh2 = narrow ? 18 : 30;
          ctx.fillStyle = 'rgba(12,8,6,.66)';
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(q.x - bw2 / 2, q.y - 9, bw2, bh2, 5); else ctx.rect(q.x - bw2 / 2, q.y - 9, bw2, bh2); ctx.fill();
          ctx.font = sans(narrow ? 11 : 12, 700); ctx.fillStyle = L0.name === 'mantle' ? '#FFB48A' : L0.name === 'outer core' ? '#FFD27A' : '#FFF0C0';
          ctx.fillText(L0.name.toUpperCase(), q.x, q.y);
          if (!narrow) { ctx.font = mono(8.5, 600); ctx.fillStyle = 'rgba(255,236,214,.88)'; ctx.fillText(sub, q.x, q.y + 13); }
        });
        ctx.restore();
      }
      // the shadow zones on the rim, once the waves have had time to show them
      ctx.save();
      [['S', 27 * 60, '#FF8BD8', 'no S waves'], ['P', 21 * 60, '#6FE7FF', 'no direct P']].forEach(([w, tShow, col, name], wi) => {
        if (t < tShow || (w === 'S' && p.wave === 'P') || (w === 'P' && p.wave === 'S')) return;
        const rr = 6371 * (1.045 + wi * 0.05);
        sh[w].forEach(([a, b]) => {
          for (const side of [1, -1]) {
            ctx.strokeStyle = col; ctx.globalAlpha = 0.85; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let d = a; d <= b + 1e-6; d += 1) { const q = fp(rr, side * d * Math.PI / 180); if (q.ok) (d === a ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)); }
            ctx.stroke(); ctx.globalAlpha = 1;
            if (side === 1) {
              const m = fp(rr * 1.02, (a + b) / 2 * Math.PI / 180);
              tag(ctx, m.x + 6, m.y, name + ' ' + a.toFixed(0) + '–' + b.toFixed(0) + '°', col);
            }
          }
        });
      });
      ctx.restore();
      // the fan, then the ray the student aims, drawn whole
      const rays = shownRays(p), list = [];
      if (p.wave !== 'S') list.push(...rays.P);
      if (p.wave !== 'P') list.push(...rays.S);
      GX.rayFan(ctx, cam, C, 1, AX, list, t, {});
      const ar = aimRay(S);
      GX.rayFan(ctx, cam, C, 1, AX, [ar], 1e9, { oneSide: true });
      if (ar.stop == null) {
        const q = fp(6371, ar.dist * Math.PI / 180);
        if (q.ok) { ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, TAU); ctx.stroke(); ctx.restore(); }
      }
    }
    // the quake, and the student's seismometer on the rim
    const qk = fp(6371, 0);
    if (qk.ok) GX.quakeStar(ctx, qk.x, qk.y - 2, 9, t / 60);
    const st = fp(6371, p.station * Math.PI / 180), st2 = fp(6371 * 1.07, p.station * Math.PI / 180);
    if (st.ok && st2.ok) {
      let flash = 0, col = null;
      for (const a of A.all) { const age = t - a.t; if (age >= 0 && age < 50) { const k = 1 - age / 50; if (k > flash) { flash = k; col = GX.WAVE[a.w]; } } }
      GX.seismometer(ctx, st.x, st.y, Math.atan2(st2.y - st.y, st2.x - st.x), narrow ? 8 : 10, { flash, col, held: g.dragging === 'station' });
      g.handle(st.x + (st2.x - st.x) * 0.6, st.y + (st2.y - st.y) * 0.6, 16, 'station');
      tag(ctx, st2.x + (st2.x > c0.x ? 8 : -8), st2.y + 14, p.station.toFixed(0) + '°', '#FFFFFF', { align: st2.x > c0.x ? 'left' : 'right' });
    }
    // the header
    const fP = firstOf(A.P), fS = firstOf(A.S);
    const liquid = p.outer === 'liquid';
    let line;
    if (t < 30) line = 'The quake strikes: P and S waves set off into the planet';
    else if (t < T_END - 1) line = mmss(t) + ' after the quake — ' + (p.wave === 'S' ? 'S' : p.wave === 'P' ? 'P' : 'P and S') + ' waves spreading through the Earth';
    else line = liquid ? 'No S wave reaches beyond ' + sh.S.map(z => z[0].toFixed(0)).concat(['180'])[0] + '°: something liquid stops them' : 'A solid core lets S waves reach every station';
    const sayT = v => v == null ? 'none' : mmss(v);
    K.header(g, line,
      'seismometer at ' + p.station.toFixed(0) + '°: P ' + sayT(fP) + ' · S ' + sayT(fS) + (fP != null && fS != null ? ' · S − P ' + mmss(fS - fP) : '') + ' (min:s)',
      (liquid ? 'the outer core liquid, as measured' : 'the core made solid (what if?)') + (liquid ? ' · inner core ' + (p.inner === 'solid' ? 'solid, as measured' : 'made liquid (what if?)') : '') + ' · one minute passes each second');
    // the seismometer's record
    const at = K.cardSlot(g, S, 'the seismogram at ' + p.station.toFixed(0) + '°', Math.min(330, W * 0.36), { x: W - Math.min(330, W * 0.36) - 10, y: H - 150 });
    if (at) seismoCard(g, S, A, at.x, at.y, at.w);
  }
  function seismoCard(g, S, A, x, y, w) {
    const ctx = g.ctx, T = th(g), p = S.p, t = S.tq, K = kit(), h = 138, GX = GE();
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Seismometer ' + p.station.toFixed(0) + '° from the quake', x + 10, y + 8);
    const x0 = x + 10, x1 = x + w - 10, ym = y + 72, amp = 30, tMax = 35 * 60, X = s => x0 + s / tMax * (x1 - x0);
    ctx.strokeStyle = 'rgba(140,160,190,.25)'; ctx.lineWidth = 1;
    for (let m = 0; m <= 35; m += 5) { ctx.beginPath(); ctx.moveTo(X(m * 60), y + 28); ctx.lineTo(X(m * 60), y + 116); ctx.stroke(); }
    ctx.fillStyle = T['text-3']; ctx.font = mono(8); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let m = 0; m <= 35; m += 5) ctx.fillText(String(m), X(m * 60), y + 119);
    ctx.textAlign = 'right'; ctx.fillText('minutes after the quake', x1, y + 8 + 12);
    // the trace, drawn as far as the drum has turned
    ctx.strokeStyle = '#E8EDF5'; ctx.lineWidth = 1; ctx.beginPath();
    const tEnd = Math.min(t, tMax);
    for (let px = 0; px <= (x1 - x0) * tEnd / tMax; px += 0.7) {
      const s = px / (x1 - x0) * tMax, m = motionAt(A, p.station, s), yy = ym - amp * Math.sign(m) * Math.log(1 + 3 * Math.abs(m)) / Math.log(4);
      px ? ctx.lineTo(x0 + px, yy) : ctx.moveTo(x0 + px, yy);
    }
    ctx.stroke();
    // the arrivals, named once they have come
    const seen = A.all.filter(a => a.t <= t && a.t < tMax);
    let lastX = -99;
    seen.forEach(a => {
      const xx = X(a.t);
      ctx.strokeStyle = GX.css(GX.WAVE[a.w], 0.9); ctx.lineWidth = 1.2; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(xx, y + 30); ctx.lineTo(xx, y + 112); ctx.stroke(); ctx.setLineDash([]);
      if (xx - lastX > 26) { tag(ctx, xx + 2, y + 36, BRANCH[a.b].name, GX.css(GX.WAVE[a.w])); lastX = xx; }
    });
    if (A.surf <= Math.min(t, tMax)) { const xs = Math.min(X(A.surf) + 2, x1 - 84); tag(ctx, xs, y + 104, 'surface waves', '#F0DCA0'); }
    if (t > (p.outer === 'liquid' ? 27 * 60 : 33 * 60) && !A.S.length) tag(ctx, x0, y + 104, 'no S wave ever came', '#FF8BD8');
    ctx.restore();
  }

  /* ---------------- hydro ---------------- */
  const BALL_AT = { all: [41, -104], fresh: [37, -86], liquid: [44.5, -76], surface: [32.5, -81.5] };
  const BALL_TAG = { all: [-1, -1], fresh: [0.2, -1], liquid: [1, -0.4], surface: [1, 1] };     // which way each ball's label leans
  function surfPoint(lat, lon, h) {                          // a world point h globe-radii above (lat, lon)
    const la = lat * Math.PI / 180, lo = lon * Math.PI / 180, r = 1 + h;
    return [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)];
  }
  const facing = (cam, pt) => (cam.eye[0] - pt[0]) * pt[0] + (cam.eye[1] - pt[1]) * pt[1] + (cam.eye[2] - pt[2]) * pt[2] > 0;
  const kmSay = d => d >= 100 ? fmtN(Math.round(d)) : d.toFixed(0);
  function drawHydro(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), GX = GE(), W = g.w, H = g.h, narrow = W < K.NARROW;
    placeGlobe(S, g, narrow ? 0 : -0.21, narrow ? -30 : 20);
    const c0 = cam.project([0, 0, 0]);
    if (earthReady(g, c0.x, c0.y)) EARTH.draw(ctx, cam, [0, 0, 0], 1, { spin: 0, sun: [-0.25, -0.85, 0.60], ambient: 0.10 });
    // the balls of water, to scale, standing on North America as the USGS drew them
    const balls = ballsOf(p.melt / 100);
    balls.forEach(b => {
      const [lat, lon] = BALL_AT[b.k], rw = b.d / 2 / 6371, gnd = surfPoint(lat, lon, 0);
      if (!facing(cam, gnd)) return;
      const q = cam.project(surfPoint(lat, lon, rw)), qg = cam.project(gnd);
      if (!q.ok || !qg.ok) return;
      const rpx = Math.max(1.8, rw * q.s);
      GX.waterBall(ctx, q.x, q.y, rpx, b.col, { ground: { x: qg.x, y: qg.y } });
      const [ux, uy] = BALL_TAG[b.k], lx = clamp(q.x + ux * (rpx + 26), narrow ? 60 : 200, W - 60), ly = clamp(q.y + uy * (rpx + 20), K.HDR + 10, H - 30);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(q.x + ux * rpx * 0.7, q.y + uy * rpx * 0.7); ctx.lineTo(lx, ly); ctx.stroke(); ctx.restore();
      tag(ctx, lx, ly, (narrow ? '' : b.name + ' · ') + kmSay(b.d) + ' km', GX.css(GX.mixc(GX.hex(b.col), [255, 255, 255], 0.35)),
        { align: ux < 0 ? 'right' : ux > 0.5 ? 'left' : 'center' });
    });
    const hy = S.hy, cnt = hydroCounts(hy), oceanPc = 100 * cnt[RESK.ocean] / HY_N, where = RES[RESK[p.release]].name.toLowerCase();
    K.header(g, 'Water tagged in ' + where + ': after ' + ageSay(hy.clock) + ', ' + oceanPc.toFixed(0) + ' % of it is in the ocean',
      'the air holds 12,900 km³ and passes it on in ' + (residence('air') * 365.25).toFixed(1) + ' days · the ocean holds 1.34 billion km³ for ' + fmtN(residence('ocean')) + ' years',
      p.melt > 0 ? 'melting ' + p.melt.toFixed(0) + ' % of the land ice raises the sea ' + riseByVolume(p.melt / 100).toFixed(1) + ' m — the water moves from fresh ice to salty sea' :
        'all of Earth’s water would make a ball ' + kmSay(balls[0].d) + ' km across; the time runs a tenfold each 2.5 s');
    const cw = Math.min(372, W * 0.44), at = K.cardSlot(g, S, 'the water cycle, molecule by molecule', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) hydroNet(g, S, at.x, at.y, at.w, Math.min(312, H - at.y - 10));
    if (p.melt > 0 && !narrow) seaCard(g, S, 10, H - 124, Math.min(250, W * 0.3));
  }
  function ageSay(y) {
    const d = y * 365.25;
    if (d < 1) return (d * 24).toFixed(0) + ' hours';
    if (d < 60) return d.toFixed(d < 10 ? 1 : 0) + ' days';
    if (y < 2) return (y * 12).toFixed(0) + ' months';
    return fmtN(y < 10 ? Math.round(y * 10) / 10 : Math.round(y), y < 10 ? 1 : 0) + ' years';
  }
  const NET = { air: [0.50, 0.10], ice: [0.15, 0.36], life: [0.85, 0.36], soil: [0.72, 0.60], rivers: [0.44, 0.60],
                lakes: [0.44, 0.86], ground: [0.84, 0.86], ocean: [0.15, 0.86] };
  const NET_SHORT = { ocean: 'Oceans', ice: 'Ice', ground: 'Groundwater', lakes: 'Lakes', soil: 'Soil', air: 'The air', rivers: 'Rivers', life: 'Plants, animals' };
  function hydroNet(g, S, x, y, w, h) {
    const ctx = g.ctx, T = th(g), K = kit(), GX = GE(), hy = S.hy, cnt = hydroCounts(hy);
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(HY_N + ' tagged molecules · ' + ageSay(hy.clock), x + 10, y + 8);
    const nw = Math.min(96, w * 0.26), nh = 34, top = y + 30, hh = h - 44;
    const pos = {}; RES.forEach(r => { const f = NET[r.k]; pos[r.k] = { x: x + f[0] * w, y: top + f[1] * hh - 10 }; });
    // the flows between stores, faint; each molecule that moves lights its path
    const edge = (a, b) => {
      const A = pos[a], B = pos[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const sa = Math.min(nw / 2 / Math.max(1e-6, Math.abs(dx / L)), nh / 2 / Math.max(1e-6, Math.abs(dy / L)));
      return { a: { x: A.x + dx / L * sa, y: A.y + dy / L * sa }, b: { x: B.x - dx / L * sa, y: B.y - dy / L * sa } };
    };
    WFLUX.forEach(([a, b, f]) => {
      const E = edge(a, b), wv = 0.8 + Math.log10(1 + f) * 0.9;
      GX.fluxArrow(ctx, E.a, E.b, 10, { w: wv, col: 'rgba(140,190,240,.9)', alpha: 0.35, rate: 0 });
    });
    hy.flights.forEach(fl => {
      const E = edge(fl.a, fl.b), u = clamp((S.ta - fl.t0) / 0.7, 0, 1);
      const mx = (E.a.x + E.b.x) / 2, my = (E.a.y + E.b.y) / 2, dx = E.b.x - E.a.x, dy = E.b.y - E.a.y, L = Math.hypot(dx, dy) || 1;
      const cx = mx - dy / L * 10, cy = my + dx / L * 10;
      const px = (1 - u) * (1 - u) * E.a.x + 2 * (1 - u) * u * cx + u * u * E.b.x, py = (1 - u) * (1 - u) * E.a.y + 2 * (1 - u) * u * cy + u * u * E.b.y;
      ctx.fillStyle = '#FFE38A'; ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px, py, 2.2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    });
    // the stores: name, how many tagged molecules are in each, how long water stays there
    RES.forEach((r, i) => {
      const P = pos[r.k], n = cnt[i], x0 = P.x - nw / 2, y0 = P.y - nh / 2, col = GX.hex(r.col);
      ctx.fillStyle = GX.css(GX.mixc(col, [8, 12, 22], 0.72), 0.95); ctx.strokeStyle = GX.css(col, n ? 0.95 : 0.45); ctx.lineWidth = n ? 1.4 : 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y0, nw, nh, 5); else ctx.rect(x0, y0, nw, nh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = mono(9, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(K.fitText(ctx, NET_SHORT[r.k], nw - 10), x0 + 5, y0 + 4);
      ctx.fillStyle = T['text-3']; ctx.font = mono(8);
      ctx.fillText(K.fitText(ctx, 'stays ' + ageSay(residence(r.k)).replace(' years', ' yr').replace(' days', ' d').replace(' months', ' mo'), nw - 26), x0 + 5, y0 + 19);
      ctx.fillStyle = '#FFE38A'; ctx.font = mono(9, 700); ctx.textAlign = 'right'; ctx.fillText(String(n), x0 + nw - 5, y0 + 19);
      // a dot per tagged molecule, as many as fit
      const cap = Math.floor((nw - 8) / 4), show = Math.min(n, cap);
      ctx.fillStyle = '#FFE38A';
      for (let k = 0; k < show; k++) { ctx.beginPath(); ctx.arc(x0 + 5 + k * 4, y0 + nh + 3, 1.3, 0, TAU); ctx.fill(); }
    });
    ctx.restore();
  }
  /* a coast and a twenty-storey tower (3 m a storey): where the sea stands after the melt */
  function seaCard(g, S, x, y, w) {
    const ctx = g.ctx, T = th(g), K = kit(), h = 112, rise = riseByVolume(S.p.melt / 100);
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('The sea rises ' + rise.toFixed(1) + ' m', x + 10, y + 8);
    const gy = y + h - 12, m = (h - 40) / 70, X0 = x + 12, X1 = x + w - 12;
    // land sloping up from the shore, a tower of twenty storeys and a person
    ctx.fillStyle = '#5B4A36'; ctx.beginPath(); ctx.moveTo(X0, gy); ctx.lineTo(X0 + (X1 - X0) * 0.35, gy); ctx.lineTo(X1, gy - 8 * m); ctx.lineTo(X1, gy + 2); ctx.lineTo(X0, gy + 2); ctx.fill();
    const tx = X0 + (X1 - X0) * 0.55, tw = 26;
    ctx.fillStyle = '#9AA6B8'; ctx.fillRect(tx, gy - 60 * m, tw, 60 * m);
    ctx.fillStyle = '#6B7788';
    for (let f = 0; f < 20; f++) ctx.fillRect(tx + 3, gy - (f + 1) * 3 * m + 1, tw - 6, Math.max(0.6, 3 * m - 1.6));
    ctx.fillStyle = T['text-3']; ctx.font = mono(8); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('20 storeys, 60 m', tx + tw + 5, gy - 56 * m);
    // the sea, up to its new level
    const sy = gy - rise * m;
    ctx.fillStyle = 'rgba(64,150,220,.72)'; ctx.fillRect(X0, sy, X1 - X0, gy - sy + 2);
    ctx.strokeStyle = '#9FE0FF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, sy); ctx.lineTo(X1, sy); ctx.stroke();
    ctx.fillStyle = '#9FE0FF'; ctx.textAlign = 'left'; ctx.fillText('+' + rise.toFixed(1) + ' m', X0 + 2, sy - 7);
    ctx.restore();
  }

  /* ---------------- atmo ---------------- */
  const DECKS = {
    tropics: [{ z: 1.2, kind: 'cumulus', cover: 0.75, seed: 0.1 }, { z: 5.5, kind: 'cumulus', cover: 0.35, seed: 0.5 }, { z: 15.5, kind: 'cirrus', cover: 0.6, seed: 0.8 }],
    mid: [{ z: 1.6, kind: 'cumulus', cover: 0.6, seed: 0.2 }, { z: 4.5, kind: 'cumulus', cover: 0.3, seed: 0.6 }, { z: 9.5, kind: 'cirrus', cover: 0.55, seed: 0.9 }],
    polar: [{ z: 0.7, kind: 'cumulus', cover: 0.8, seed: 0.3 }, { z: 6.5, kind: 'cirrus', cover: 0.35, seed: 0.7 }]
  };
  const SUN_AT = { tropics: [20, 0.80], mid: [16, 0.78], polar: [3, 0.74] };
  function drawAtmo(S, g) {
    const ctx = g.ctx, p = S.p, K = kit(), GX = GE(), W = g.w, H = g.h, narrow = W < K.NARROW, B = S.at.B, T = th(g);
    const z = B.z / 1000, q = airOf(p.site)(z), bt = BALLOONS[p.bal];
    const top = K.HDR + 2, sw = narrow ? W - 116 : Math.round(W * 0.60) - 14, sh = H - top - 10;
    GX.skyView(ctx, 10, top, sw, sh, {
      z, airAbove: q.P / P0, decks: DECKS[p.site], phase: S.ta, sun: SUN_AT[p.site],
      balloon: { D: B.D, burst: !!B.burst, age: B.burst ? (B.t - B.burst.t) / FLIGHT_RATE : 0, scale: sh * 0.58 / bt.burst }
    });
    // a metre, to read the balloon by
    ctx.save();
    const s1 = sh * 0.58 / bt.burst, bx = 10 + sw - 22, by = top + sh - 22;
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - s1, by); ctx.lineTo(bx, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - s1, by - 4); ctx.lineTo(bx - s1, by + 4); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.stroke();
    ctx.restore();
    tag(ctx, bx, by - 13, '1 m · the string is shortened', '#FFFFFF', { align: 'right' });
    altitudeStrip(g, S, 10 + sw + 8, top, W - sw - 28, sh);
    const burst = B.burst;
    const line = B.grounded ? 'Not enough helium: a ' + p.bal + ' g balloon filled to ' + p.fill.toFixed(2) + ' m cannot lift the sonde' :
      B.landed != null ? 'The sonde has landed ' + fmtN(B.landed / 60) + ' minutes after launch — its readings are the profile' :
      burst ? 'The balloon burst at ' + (burst.z / 1000).toFixed(1) + ' km, ' + burst.D.toFixed(1) + ' m across — the sonde falls under its parachute' :
      'The sonde reads ' + (q.T - 273.15).toFixed(1) + ' °C and ' + (q.P / 100).toFixed(q.P < 10000 ? 1 : 0) + ' hPa at ' + z.toFixed(1) + ' km';
    K.header(g, line,
      (burst ? 'falling at ' + Math.abs(B.v).toFixed(1) + ' m/s' : 'rising at ' + B.v.toFixed(1) + ' m/s · the balloon is ' + B.D.toFixed(2) + ' m across, ' + (Math.pow(B.D / B.D0, 3)).toFixed(1) + '× its launch volume') +
        ' · ' + (100 * (1 - q.P / P0)).toFixed(0) + ' % of the air is below it',
      CLIMATES[p.site].name + ' · a ' + p.bal + ' g balloon, bursts at ' + bt.burst.toFixed(2) + ' m · one minute of flight each second');
  }
  function altitudeStrip(g, S, x, y, w, h) {
    const ctx = g.ctx, p = S.p, T = th(g), GX = GE(), B = S.at.B, zMax = 50;
    const Y = z => y + h - 14 - z / zMax * (h - 28), site = p.site, tp = tropopause(site);
    ctx.save();
    // the sky at each height
    for (let i = 0; i < 50; i++) {
      const z0 = i, c = GX.skyColours(airAbove(site, z0 + 0.5));
      ctx.fillStyle = GX.css(GX.mixc(c.zenith, c.horizon, 0.55)); ctx.fillRect(x, Y(z0 + 1), w, Y(z0) - Y(z0 + 1) + 0.5);
    }
    ctx.strokeStyle = 'rgba(80,100,140,.5)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // the ozone layer: most of it between 15 and 35 km
    const oz = ctx.createLinearGradient(0, Y(35), 0, Y(15));
    oz.addColorStop(0, 'rgba(170,120,255,0)'); oz.addColorStop(0.5, 'rgba(170,120,255,.30)'); oz.addColorStop(1, 'rgba(170,120,255,0)');
    ctx.fillStyle = oz; ctx.fillRect(x + w * 0.52, Y(35), w * 0.46, Y(15) - Y(35));
    ctx.fillStyle = 'rgba(214,190,255,.9)'; ctx.font = mono(8, 600); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('ozone', x + w - 5, Y(25));
    // Everest, a storm cloud whose top flattens at the tropopause, an airliner
    ctx.fillStyle = '#3B4150';
    ctx.beginPath(); ctx.moveTo(x + 2, Y(0)); ctx.lineTo(x + w * 0.10, Y(5.5)); ctx.lineTo(x + w * 0.16, Y(8.85)); ctx.lineTo(x + w * 0.24, Y(6.2)); ctx.lineTo(x + w * 0.34, Y(0)); ctx.fill();
    ctx.fillStyle = '#E8ECF2'; ctx.beginPath(); ctx.moveTo(x + w * 0.13, Y(7.3)); ctx.lineTo(x + w * 0.16, Y(8.85)); ctx.lineTo(x + w * 0.195, Y(7.4)); ctx.fill();
    ctx.fillStyle = T['text-2']; ctx.font = mono(8); ctx.textAlign = 'left';
    ctx.fillText('Everest 8.8 km', x + w * 0.18, Y(9.6));
    const cbx = x + w * 0.64, ztp = tp[0];
    for (let k = 0; k <= 26; k++) {                            // a storm cloud: puffs boiling up to the tropopause, then the anvil spreads
      const u = k / 26, zz = 1.2 + (ztp - 1.8 - 1.2) * u, kmpx = Y(0) - Y(1);
      const rr = kmpx * (1.3 + 0.5 * Math.sin(k * 2.1) + 0.6 * (1 - u)), cx2 = cbx + kmpx * 1.6 * Math.sin(k * 2.7) * (1 - 0.5 * u);
      const gp = ctx.createRadialGradient(cx2 - rr * 0.35, Y(zz) - rr * 0.35, rr * 0.1, cx2, Y(zz), rr);
      gp.addColorStop(0, 'rgba(252,253,255,.96)'); gp.addColorStop(0.6, 'rgba(214,222,236,.85)'); gp.addColorStop(1, 'rgba(170,182,204,0)');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(cx2, Y(zz), rr, 0, TAU); ctx.fill();
    }
    const ag = ctx.createLinearGradient(0, Y(ztp), 0, Y(ztp - 2.2));
    ag.addColorStop(0, 'rgba(245,248,252,.95)'); ag.addColorStop(1, 'rgba(210,218,232,.55)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(cbx - 12, Y(ztp - 2.2)); ctx.quadraticCurveTo(cbx - 30, Y(ztp - 0.6), cbx - 44, Y(ztp - 0.1));
    ctx.lineTo(cbx + 50, Y(ztp - 0.1)); ctx.quadraticCurveTo(cbx + 32, Y(ztp - 0.7), cbx + 12, Y(ztp - 2.2)); ctx.fill();
    ctx.fillStyle = '#DDE3EE'; ctx.beginPath(); ctx.ellipse(x + w * 0.80, Y(10.7), 9, 2, -0.08, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w * 0.80 - 2, Y(10.7)); ctx.lineTo(x + w * 0.80 + 3, Y(10.7) - 6); ctx.lineTo(x + w * 0.80 + 5, Y(10.7)); ctx.fill();
    // the layers — named only when the student asks; the sonde's own data should say where they are first
    const L0 = [[0, ztp, 'troposphere', 'weather; colder with height'], [ztp, 50, 'stratosphere', 'warmer with height']];
    ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, Y(ztp)); ctx.lineTo(x + w, Y(ztp)); ctx.stroke(); ctx.setLineDash([]);
    L0.forEach(([a, b, name, what], i) => {
      const ym = Y(i ? Math.min(44, (a + 40) / 2 + 4) : Math.max(3, a + (b - a) * 0.28));
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = mono(9, 600); ctx.textAlign = 'right';
      ctx.fillText(p.names ? name : 'layer ' + (i + 1) + ' ?', x + w - 5, ym);
      if (p.names) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = mono(8); ctx.fillText(what, x + w - 5, ym + 11); }
    });
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = mono(8, 600); ctx.textAlign = 'left';
    ctx.fillText(p.names ? 'tropopause ' + ztp.toFixed(0) + ' km' : '?', x + 4, Y(ztp) - 6);
    // the scale
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = mono(8); ctx.textAlign = 'left';
    for (let k = 10; k < 50; k += 10) { ctx.fillRect(x, Y(k), 5, 1); ctx.fillText(k + ' km', x + 7, Y(k)); }
    ctx.fillText('mesosphere above 50 km · space at 100 km ↑', x + 4, y + 8);
    // where the balloon is, and where it burst
    if (B.burst) {
      const yb = Y(B.burst.z / 1000);
      ctx.strokeStyle = '#E8553F'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x + w * 0.5, yb); ctx.stroke();
      ctx.fillStyle = '#FF9A88'; ctx.textAlign = 'left'; ctx.fillText('burst ' + (B.burst.z / 1000).toFixed(1) + ' km', x + w * 0.5 + 6, yb);
    }
    const yz = Y(B.z / 1000), bx = x + w * 0.42;
    ctx.fillStyle = B.burst ? '#E8553F' : '#FFFFFF'; ctx.strokeStyle = '#0B1020'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, yz - 6, B.burst ? 3.5 : 5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.moveTo(bx, yz - 1); ctx.lineTo(bx, yz + 5); ctx.stroke();
    const q = airOf(site)(B.z / 1000);
    tag(ctx, bx + 9, yz - 4, (B.z / 1000).toFixed(1) + ' km · ' + (q.T - 273.15).toFixed(0) + ' °C', '#FFFFFF');
    ctx.restore();
  }

  /* ---------------- bio ---------------- */
  const NPP_STOPS = [[0, [214, 190, 140]], [250, [196, 186, 110]], [700, [150, 176, 80]], [1300, [86, 150, 60]], [2000, [36, 118, 50]], [2700, [12, 84, 42]]];
  function nppColour(v) {
    let i = 1; while (i < NPP_STOPS.length - 1 && v > NPP_STOPS[i][0]) i++;
    const [a, ca] = NPP_STOPS[i - 1], [b, cb] = NPP_STOPS[i], f = clamp((v - a) / (b - a), 0, 1);
    return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
  }
  const WH = { T0: -30, T1: 32, P0: 0, P1: 4000 };
  let WH_IMG = null;
  function whittakerImage() {                                  // the Miami model over every climate, drawn once
    if (WH_IMG || typeof document === 'undefined') return WH_IMG;
    const n = 160, c = document.createElement('canvas'); c.width = n; c.height = n;
    const x = c.getContext('2d'), im = x.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const T = WH.T0 + (i + 0.5) / n * (WH.T1 - WH.T0), P = WH.P1 - (j + 0.5) / n * (WH.P1 - WH.P0), col = nppColour(npp(T, P)), k = (j * n + i) * 4;
      im.data[k] = col[0]; im.data[k + 1] = col[1]; im.data[k + 2] = col[2]; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return (WH_IMG = c);
  }
  /* the climate under test: the place's own, warmed and made wetter or drier */
  const climateOf = p => { const q = PLACEK[p.place]; return { T: q.T + p.warm, P: Math.max(0, q.P * (1 + p.wet / 100)) }; };
  const atPlace = p => Math.abs(p.warm) < 0.01 && Math.abs(p.wet) < 0.01;
  const changeSay = p => [p.warm ? (p.warm > 0 ? '+' : '') + p.warm.toFixed(1) + ' °C' : null, p.wet ? (p.wet > 0 ? '+' : '') + p.wet.toFixed(0) + ' % rain' : null].filter(Boolean).join(', ');
  function drawBio(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), GX = GE(), W = g.w, H = g.h, narrow = W < K.NARROW;
    if (S.spin == null) bioAim(S, 0);
    placeGlobe(S, g, narrow ? 0 : -0.24, narrow ? -40 : 18);
    const q0 = PLACEK[p.place];
    const c0 = cam.project([0, 0, 0]);
    if (earthReady(g, c0.x, c0.y)) EARTH.draw(ctx, cam, [0, 0, 0], 1, { spin: S.spin, sun: [-0.3, -0.85, 0.45], ambient: 0.14 });
    // every place, pinned where it is, coloured by how much grows there
    const pins = [];
    PLACES.forEach(q => {
      const la = q.lat * Math.PI / 180, lo = q.lon * Math.PI / 180 + S.spin;
      const gp = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
      if (!facing(cam, gp)) return;
      const hp = [gp[0] * 1.07, gp[1] * 1.07, gp[2] * 1.07], a = cam.project(gp), b = cam.project(hp);
      if (!a.ok || !b.ok) return;
      pins.push({ q, a, b, sel: q.k === p.place });
    });
    pins.sort((u, v) => u.sel - v.sel).forEach(o => {
      const v = o.sel ? npp(climateOf(p).T, climateOf(p).P) : npp(o.q.T, o.q.P), col = GX.css(nppColour(v));
      GX.pin(ctx, o.a.x, o.a.y, o.b.x, o.b.y, col, { sel: o.sel, r: o.sel ? 6.5 : 4.5 });
      if (o.sel) tag(ctx, o.b.x + 10, o.b.y - 2, o.q.name, '#FFFFFF');
    });
    const cl = climateOf(p), v = npp(cl.T, cl.P), lim = limitOf(cl.T, cl.P);
    const here = q0.name.split(',')[0] + (atPlace(p) ? '' : ' (' + changeSay(p) + ')');
    K.header(g, here + ': ' + fmtN(v) + ' g of plant growth per m² a year — ' + (lim === 'both' ? 'warmth and water limit it together' : lim + ' limits it'),
      'warmth allows ' + fmtN(nppT(cl.T)) + ' · water allows ' + fmtN(nppP(cl.P)) + ' · the smaller wins (the Miami model)',
      q0.biome + ' · ' + cl.T.toFixed(1) + ' °C, ' + fmtN(cl.P) + ' mm a year · drag the point to change the climate');
    const cw = Math.min(360, W * 0.42), at = K.cardSlot(g, S, 'the climate chart', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) whittakerCard(g, S, at.x, at.y, at.w, Math.min(H - at.y - 10, 330));
    if (p.reach && !narrow) reachCard(g, S, 10, H - 150, 210);
  }
  function whittakerCard(g, S, x, y, w, h) {
    const ctx = g.ctx, T = th(g), K = kit(), GX = GE(), p = S.p;
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Plant growth for every climate', x + 10, y + 8);
    const x0 = x + 44, x1 = x + w - 12, y0 = y + h - 30, y1 = y + 28;
    const X = t => x0 + (t - WH.T0) / (WH.T1 - WH.T0) * (x1 - x0), Yp = P => y0 - (P - WH.P0) / (WH.P1 - WH.P0) * (y0 - y1);
    S._wh = { x0, x1, y0, y1 };
    const img = whittakerImage();
    if (img) { ctx.imageSmoothingEnabled = true; ctx.drawImage(img, x0, y1, x1 - x0, y0 - y1); }
    // where warmth and water allow the same: left of it the cold limits, below it the dry
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4; ctx.beginPath();
    let first = true;
    for (let t = WH.T0; t <= WH.T1; t += 0.25) {
      const a = nppT(t); if (a >= 2999) break;
      const P = -Math.log(1 - a / 3000) / 0.000664; if (P > WH.P1) break;
      first ? ctx.moveTo(X(t), Yp(P)) : ctx.lineTo(X(t), Yp(P)); first = false;
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.font = mono(8, 600); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.textAlign = 'left';
    ctx.fillText('warmth limits', X(-27), Yp(3500)); ctx.textAlign = 'right'; ctx.fillText('water limits', X(30), Yp(350));
    // axes
    ctx.fillStyle = T['text-3']; ctx.font = mono(8); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let t = -30; t <= 30; t += 10) ctx.fillText(t + '°', X(t), y0 + 3);
    ctx.fillText('mean temperature, °C', (x0 + x1) / 2, y0 + 14);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let P = 1000; P <= 4000; P += 1000) ctx.fillText(P / 1000 + 'k', x0 - 4, Yp(P));
    ctx.save(); ctx.translate(x + 10, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('rain, mm a year', 0, 0); ctx.restore();
    // the places, warmed if the student warms the world
    PLACES.forEach(q => {
      const px = X(clamp(q.T, WH.T0, WH.T1)), py = Yp(q.P), sel = q.k === p.place;
      ctx.fillStyle = sel ? '#FFFFFF' : 'rgba(255,255,255,.75)'; ctx.strokeStyle = '#0B1020'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, sel ? 3.5 : 2.4, 0, TAU); ctx.fill(); ctx.stroke();
    });
    // the climate the student is testing: a crosshair to drag
    const cl = climateOf(p), cx = X(clamp(cl.T, WH.T0, WH.T1)), cy = Yp(clamp(cl.P, WH.P0, WH.P1)), q0 = PLACEK[p.place];
    if (!atPlace(p)) {
      const bx = X(clamp(q0.T, WH.T0, WH.T1)), by = Yp(q0.P);
      ctx.strokeStyle = 'rgba(255,200,120,.9)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 11, cy); ctx.lineTo(cx - 4, cy); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 11, cy); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 11); ctx.stroke();
    g.handle(cx, cy, 12, 'climate');
    tag(ctx, cx + 12, cy - 12, fmtN(npp(cl.T, cl.P)) + ' g/m²/yr', '#FFFFFF');
    ctx.restore();
  }
  /* the thin film of life: from microbes in deep rock to vultures over Africa, against the planet */
  function reachCard(g, S, x, y, w) {
    const ctx = g.ctx, T = th(g), K = kit(), h = 140;
    K.card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Where life reaches', x + 10, y + 8);
    const y0 = y + 28, y1 = y + h - 12, Y = z => y0 + (12 - z) / 24 * (y1 - y0), bx = x + 20;
    ctx.fillStyle = 'rgba(64,150,220,.35)'; ctx.fillRect(bx, Y(0), 24, Y(-11) - Y(0));
    ctx.fillStyle = 'rgba(120,96,70,.6)'; ctx.fillRect(bx + 26, Y(0), 24, Y(-12) - Y(0));
    ctx.fillStyle = 'rgba(150,200,255,.25)'; ctx.fillRect(bx, Y(12), 50, Y(0) - Y(12));
    ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(bx - 4, Y(0)); ctx.lineTo(bx + 54, Y(0)); ctx.stroke();
    const mark = (z, text) => { ctx.fillStyle = '#9FF08A'; ctx.fillRect(bx - 4, Y(z) - 1, 58, 2); ctx.fillStyle = T['text-2']; ctx.font = mono(8); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 60, Y(z)); };
    mark(LIFE_RANGE.bird, 'vulture 11.3 km');
    mark(LIFE_RANGE.spider, 'spiders on Everest 6.7 km');
    mark(LIFE_RANGE.trench, 'trench shrimp −10.9 km');
    mark(LIFE_RANGE.deepRock, 'microbes in rock −5 km');
    ctx.fillStyle = T['text-3']; ctx.fillText('about 22 km of 12,742: a film', bx + 60, Y(0));
    ctx.restore();
  }

  /* ---------------- links ---------------- */
  function drawLinks(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), GX = GE(), W = g.w, H = g.h, narrow = W < K.NARROW, T = th(g);
    placeGlobe(S, g, 0, narrow ? 0 : 14);
    const c0 = cam.project([0, 0, 0]);
    if (earthReady(g, c0.x, c0.y)) EARTH.draw(ctx, cam, [0, 0, 0], 1, { spin: S.ta * 0.05 + 1.2, sun: [-0.4, -0.8, 0.45], ambient: 0.12 });
    const ln = S.ln, C = ln.C, f = C.f || carbonRates(C, linkOpts(p)), rp = 1 / cam.dist * cam._k;
    const cx = c0.x, cy = c0.y, dx = Math.min(W * (narrow ? 0.33 : 0.36), rp * 1.9), dy = Math.min((H - K.HDR) * (narrow ? 0.30 : 0.36), rp * 1.25);
    const nodes = {
      air: { x: cx, y: cy - dy, name: 'ATMOSPHERE', col: '#9FD4FF', lines: ['air · ' + fmtN(C.A) + ' GtC', 'CO₂ ' + (C.A / PPM).toFixed(0) + ' ppm'] },
      bio: { x: cx + dx, y: cy, name: 'BIOSPHERE', col: '#8EE07A', lines: ['plants ' + fmtN(C.V) + ' GtC', 'soils ' + fmtN(C.Ls) + ' GtC'] },
      hydro: { x: cx, y: cy + dy, name: 'HYDROSPHERE', col: '#5FB4FF', lines: ['ocean ' + fmtN(C.M + C.I + C.D) + ' GtC', 'surface ' + fmtN(C.M) + ' · deep ' + fmtN(C.I + C.D)] },
      geo: { x: cx - dx, y: cy, name: 'GEOSPHERE', col: '#E0B070', lines: ['fossil fuels burned', fmtN(C.fossilOut) + ' GtC so far'] }
    };
    const bw = narrow ? 118 : 150, bh = 46;
    const side = (a, b) => { const A = nodes[a], B = nodes[b], vx = B.x - A.x, vy = B.y - A.y, L = Math.hypot(vx, vy) || 1;
      const s = Math.min(bw / 2 / Math.max(1e-6, Math.abs(vx / L)), bh / 2 / Math.max(1e-6, Math.abs(vy / L))) + 4;
      return { a: { x: A.x + vx / L * s, y: A.y + vy / L * s }, b: { x: B.x - vx / L * s, y: B.y - vy / L * s } }; };
    const flow = (a, b, v, bend, col, label, dash, at) => {
      if (!(v > 0.005)) return;
      const E = side(a, b);
      GX.fluxArrow(ctx, E.a, E.b, bend, { w: 1 + 1.6 * Math.log10(1 + v * 3), col, rate: 0.25 + 0.2 * Math.log10(1 + v), phase: S.ta, label: narrow ? null : label + ' ' + (v < 1 ? v.toFixed(2) : v.toFixed(1)), dash, at });
    };
    flow('air', 'bio', f.npp, -30, '#8EE07A', 'plants grow');
    flow('bio', 'air', f.decay + f.el, -30, '#C9A06A', 'rot, breathe' + (f.el > 0.005 ? ', clearing' : ''));
    if (f.fas >= 0) flow('air', 'hydro', f.fas, narrow ? 0 : -80, '#5FB4FF', 'dissolves in the sea');
    else flow('hydro', 'air', -f.fas, narrow ? 0 : 80, '#5FB4FF', 'the sea gives back');
    flow('geo', 'air', f.ef, 0, '#FF8A5C', 'burning');
    flow('geo', 'air', f.volc, 46, '#E0B070', 'volcanoes', [3, 3], 0.56);
    flow('air', 'geo', f.weather, 46, '#B0A090', 'weathering', [3, 3], 0.44);
    // the stores
    Object.keys(nodes).forEach(k => {
      const N = nodes[k];
      ctx.save();
      ctx.fillStyle = 'rgba(8,12,22,.86)'; ctx.strokeStyle = N.col; ctx.lineWidth = 1.4;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(N.x - bw / 2, N.y - bh / 2, bw, bh, 7); else ctx.rect(N.x - bw / 2, N.y - bh / 2, bw, bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = N.col; ctx.font = mono(9, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(N.name, N.x, N.y - bh / 2 + 5);
      ctx.fillStyle = T.text; ctx.font = mono(8.5, 500);
      N.lines.forEach((s, i) => ctx.fillText(K.fitText(ctx, s, bw - 10), N.x, N.y - bh / 2 + 18 + i * 11));
      ctx.restore();
    });
    const r0 = ln.base, sinceE = C.cumE - r0.cumE, inAir = C.A - r0.A, ocean = C.cumOcean - r0.cumOcean, land = C.cumLand - r0.cumLand;
    const yr = Math.round(C.y), obs = CO2_OBS.find(o => o[0] === yr);
    K.header(g, yr + ': CO₂ ' + (C.A / PPM).toFixed(0) + ' ppm' + (obs ? ' — measured ' + obs[1].toFixed(0) : '') + (yr > 2023 ? ' — ' + FUTURE_NAME[p.fossil] : ''),
      'since 1850 we have added ' + fmtN(sinceE) + ' GtC: the air kept ' + (sinceE > 0 ? (100 * inAir / sinceE).toFixed(0) : '0') + ' %, the ocean took ' + (sinceE > 0 ? (100 * ocean / sinceE).toFixed(0) : '0') + ' %, land plants ' + (sinceE > 0 ? (100 * land / sinceE).toFixed(0) : '0') + ' %',
      [p.ocean ? null : 'the ocean switched off', p.plants ? null : 'plants not growing more', p.clearing ? null : 'no land clearing'].filter(Boolean).join(' · ') || 'every interaction on · six years each second · flows in GtC a year');
  }
  const FUTURE_NAME = { hold: 'emissions held at the 2023 rate', stop: 'emissions stopped in 2030', double: 'emissions doubling by 2080', none: 'a world that never burned fossil fuels' };

  function drawStage(S, g) {
    const K = kit(), p = S.p;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) {
      const h = homeFor(p.setup, S._narrow);
      if (h) { S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist }; }
      S._narrowCam = S._narrow;
    }
    if (p.setup === 'geo') drawGeo(S, g);
    else if (p.setup === 'hydro') drawHydro(S, g);
    else if (p.setup === 'atmo') drawAtmo(S, g);
    else if (p.setup === 'bio') drawBio(S, g);
    else drawLinks(S, g);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  const BCOL = { P: '#6FE7FF', Pc: '#6FE7FF', PKP: '#A8F2FF', PKiKP: '#D8C890', PKIKP: '#FFE38A', S: '#FF8BD8', Sc: '#FF8BD8' };
  /* the travel-time curves of one fan: for each kind of wave, its earliest arrival at every distance —
     the curve a seismologist draws — broken wherever that wave does not arrive */
  function ttCurves(Tb, land0) {
    const byB = {};
    for (let d = land0; d <= 180; d += 0.5) {
      const A = arrivalsAt(Tb, Math.min(179.9, d)), seen = {};
      A.forEach(a => { if (!seen[a.b] || a.t < seen[a.b]) seen[a.b] = a.t; });
      Object.keys(byB).concat(Object.keys(seen)).filter((k, i, arr) => arr.indexOf(k) === i).forEach(k => {
        const L0 = byB[k] || (byB[k] = [[]]), cur = L0[L0.length - 1];
        if (seen[k] != null) cur.push([d, seen[k] / 60]); else if (cur.length) L0.push([]);
      });
    }
    const out = [];
    Object.keys(byB).forEach(k => byB[k].forEach(pts => { if (pts.length > 1) out.push({ b: k, pts }); }));
    return out;
  }
  const TT = {};
  function ttOf(p, w) { const key = coreKey(p) + '|' + w; return TT[key] || (TT[key] = ttCurves(fansOf(p)[w], 10)); }
  const otherCore = p => p.outer === 'liquid' ? Object.assign({}, p, { outer: 'solid' }) : Object.assign({}, p, { outer: 'liquid', inner: 'solid' });
  function travelPlot(S, g) {
    const K = kit(), p = S.p, T = th(g), ctx = g.ctx, A = stationArrivals(p, p.station), sh = shadowsOf(p), alt = otherCore(p);
    const items = [];
    if (p.wave !== 'S') items.push({ c: '#6FE7FF', label: 'P' }, { c: '#A8F2FF', label: 'P bent by the outer core', w: 1.6 }, { c: '#FFE38A', label: 'P through the inner core' });
    if (p.wave !== 'P') items.push({ c: '#FF8BD8', label: 'S' });
    items.push({ c: 'rgba(220,225,235,.55)', label: p.outer === 'liquid' ? 'if the core were solid' : 'the real, liquid core', dash: [5, 4] });
    const Kk = K.plotKey(g, items);
    const P = g.Plot({ xmin: 0, xmax: 180, ymin: 0, ymax: 35, pad: { t: Kk.t }, xticks: [0, 30, 60, 90, 120, 150, 180], xfmt: v => v + '°',
      xlabel: 'distance from the quake, degrees round the Earth', ylabel: 'time after the quake, min', yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      // the shadow zones of this Earth
      [['S', 'rgba(255,139,216,.12)'], ['P', 'rgba(111,231,255,.10)']].forEach(([w, c]) => {
        if ((w === 'S' && p.wave === 'P') || (w === 'P' && p.wave === 'S')) return;
        sh[w].forEach(([a, b]) => { ctx.fillStyle = c; ctx.fillRect(P.X(a), P.y1, P.X(b) - P.X(a), P.y0 - P.y1); });
      });
      const waves = p.wave === 'both' ? ['P', 'S'] : [p.wave];
      waves.forEach(w => ttOf(alt, w).forEach(c => P.line(c.pts, 'rgba(220,225,235,.40)', 1.3, [5, 4])));
      waves.forEach(w => ttOf(p, w).forEach(c => P.line(c.pts, BCOL[c.b] || '#FFFFFF', c.b === 'PKiKP' ? 1.2 : 2.2)));
      P.hline(S.tq / 60, g.alpha(T['text-2'], .5), [2, 3]);
      P.vline(p.station, g.alpha('#FFFFFF', .55), [3, 3]);
      A.all.filter(a => (p.wave === 'both' || a.w === p.wave)).forEach(a => P.dot(p.station, a.t / 60, 4.5, BCOL[a.b] || '#FFFFFF', g.alpha('#0B1020', .9)));
    });
    ctx.save(); ctx.font = mono(9, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let yy = P.y1 + 4;
    [['S', '#FF8BD8', 'no S'], ['P', '#6FE7FF', 'no direct P']].forEach(([w, c, n]) => {
      if ((w === 'S' && p.wave === 'P') || (w === 'P' && p.wave === 'S')) return;
      sh[w].forEach(([a, b]) => { ctx.fillStyle = c; ctx.fillText(n + ' ' + a.toFixed(0) + '–' + b.toFixed(0) + '°', P.X(a) + 4, yy); yy += 12; });
    });
    ctx.restore();
  }
  function landPlot(S, g) {
    const K = kit(), p = S.p, T = th(g), ctx = g.ctx, w = p.wave === 'S' ? 'S' : 'P', alt = otherCore(p);
    const Kk = K.plotKey(g, [{ c: BCOL[w], dot: true, label: w + ' rays of this Earth' }, { c: 'rgba(220,225,235,.55)', label: p.outer === 'liquid' ? 'if the core were solid' : 'the real core', dash: [5, 4] },
      { c: '#FFFFFF', dot: true, edge: '#0B1020', label: 'the ray you aim' }]);
    const P = g.Plot({ xmin: 0, xmax: 33, ymin: 0, ymax: 180, pad: { t: Kk.t, l: 56 }, xticks: [0, 5, 10, 15, 20, 25, 30], xfmt: v => v + '°', yticks: [0, 30, 60, 90, 120, 150, 180], yfmt: v => v + '°',
      xlabel: 'angle the ray leaves at, from straight down', ylabel: 'comes up at' }).frame();
    Kk.draw(P);
    const mine = fansOf(p)[w], theirs = fansOf(alt)[w];
    P.clip(() => {
      const seg = (rows, fn) => { let cur = []; rows.forEach(r => { if (r.i0 > 33) return; if (r.stop != null) { if (cur.length > 1) fn(cur); cur = []; return; }
        if (cur.length && Math.abs(r.land - cur[cur.length - 1][1]) > 8) { if (cur.length > 1) fn(cur); cur = []; } cur.push([r.i0, r.land]); }); if (cur.length > 1) fn(cur); };
      seg(theirs, c => P.line(c, 'rgba(220,225,235,.45)', 1.3, [5, 4]));
      // the S rays that hit the liquid core and stop: a band along the bottom
      const stops = mine.filter(r => r.stop != null && r.i0 <= 33);
      if (stops.length) { const a = stops[0].i0, b = stops[stops.length - 1].i0; ctx.fillStyle = 'rgba(255,139,216,.22)'; ctx.fillRect(P.X(a), P.Y(12), P.X(b) - P.X(a), P.Y(0) - P.Y(12)); }
      mine.forEach(r => { if (r.i0 <= 33 && r.stop == null) { ctx.fillStyle = BCOL[r.b] || '#FFFFFF'; ctx.fillRect(P.X(r.i0) - 1, P.Y(r.land) - 1, 2, 2); } });
      const ar = aimRay(S);
      if (ar.stop == null) P.dot(ar.i0, ar.land, 5, '#FFFFFF', g.alpha('#0B1020', .9));
      else P.dot(ar.i0, 3, 5, '#FF8BD8', g.alpha('#0B1020', .9));
    });
    const stops = mine.filter(r => r.stop != null && r.i0 <= 33);
    if (stops.length) { ctx.save(); ctx.font = mono(9, 600); ctx.fillStyle = '#FF8BD8'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('these S rays stop at the core', P.X(0.5), P.Y(14)); ctx.restore(); }
  }
  /* hydro */
  const HCOL = { ocean: '#3F8FE0', ice: '#DCEBFA', ground: '#B08A62', lakes: '#3FC9C0', soil: '#C9A26A', air: '#AFC8FF', rivers: '#57C3E8', life: '#6FC46A' };
  const LOG_TICKS = [[-2.562, '1 d'], [-1.719, '1 wk'], [-1, '1 mo'], [0, '1 yr'], [1, '10 yr'], [2, '100'], [3, '1,000'], [4, '10⁴'], [5, '10⁵ yr']];
  function tracerPlot(S, g) {
    const K = kit(), p = S.p, T = th(g), hy = S.hy, E = expectedCurves(p.release);
    const Kk = K.plotKey(g, RES.map(r => ({ c: HCOL[r.k], label: NET_SHORT[r.k] })), 'dashed: expected');
    const P = g.Plot({ xmin: HY_LOG0, xmax: HY_LOG1, ymin: 0, ymax: 100, pad: { t: Kk.t }, xticks: LOG_TICKS.map(t => t[0]).concat([-1]).filter((v, i, a) => a.indexOf(v) === i),
      xfmt: v => { const t = LOG_TICKS.find(q => Math.abs(q[0] - v) < 1e-6); return t ? t[1] : ''; }, xlabel: 'time since release (each step ten times longer)', ylabel: '% of the tagged water', yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      RES.forEach((r, i) => P.line(E.map(q => [q.lg, 100 * q.p[i]]), g.alpha(HCOL[r.k], .75), 1.1, [4, 3]));
      RES.forEach((r, i) => P.line(hy.hist.map(q => [q.lg, 100 * q.c[i] / HY_N]), HCOL[r.k], 2.2));
      P.vline(Math.log10(hy.clock), g.alpha(T['text-2'], .5), [2, 3]);
    });
  }
  function storePlot(S, g) {
    const K = kit(), p = S.p, T = th(g), ctx = g.ctx;
    const Kk = K.plotKey(g, [{ c: '#FFE38A', dot: true, label: 'where the tagged water started' }, { c: 'rgba(200,210,230,.6)', label: 'equal flow through, km³ a year', dash: [3, 3] }]);
    const P = g.Plot({ xmin: -2.5, xmax: 4.5, ymin: 3, ymax: 9.6, pad: { t: Kk.t, l: 56 }, xticks: [-2, -1, 0, 1, 2, 3, 4], xfmt: v => ({ '-2': '4 d', '-1': '1 mo', 0: '1 yr', 1: '10', 2: '100', 3: '1,000', 4: '10⁴ yr' })[v] || '',
      yticks: [3, 4, 5, 6, 7, 8, 9], yfmt: v => '10' + ['³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][v - 3], xlabel: 'how long water stays (volume ÷ flow out)', ylabel: 'volume, km³' }).frame();
    Kk.draw(P);
    P.clip(() => {
      [3, 4, 5, 6].forEach(lf => { P.line([[-2.5, lf - 2.5], [4.5, lf + 4.5]], 'rgba(200,210,230,.35)', 1, [3, 3]); });
      RES.forEach(r => {
        const x = Math.log10(residence(r.k)), y = Math.log10(r.v * 1000), me = r.k === p.release;
        P.dot(x, y, me ? 6.5 : 5, HCOL[r.k], me ? '#FFE38A' : g.alpha('#0B1020', .9));
        P.tag(x, y, NET_SHORT[r.k], T['text-2'], x > 3 ? 'right' : 'left', r.k === 'life' ? 10 : -10);
      });
    });
    ctx.save(); ctx.font = mono(8); ctx.fillStyle = 'rgba(200,210,230,.8)'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    [[3, '1,000'], [4, '10,000'], [5, '100,000'], [6, 'a million']].forEach(([lf, s]) => {
      const x = Math.min(4.5, 9.4 - lf), y = x + lf;
      ctx.fillText(s + ' km³ a year', P.X(x) - 4, P.Y(y) - 3);
    });
    ctx.restore();
  }
  /* atmo */
  function tempPlot(S, g) {
    const K = kit(), p = S.p, T = th(g), at = S.at, A = airOf(p.site), tp = tropopause(p.site);
    const items = [{ c: '#FFB35C', dot: true, label: 'sonde going up' }, { c: '#6FE7FF', dot: true, label: 'coming down' }];
    if (p.names) items.push({ c: 'rgba(220,225,235,.7)', label: 'the standard profile', dash: [5, 4] });
    const Kk = K.plotKey(g, items);
    const P = g.Plot({ xmin: -90, xmax: 40, ymin: 0, ymax: 36, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      if (p.names) {
        const pts = []; for (let z = 0; z <= 36; z += 0.25) pts.push([A(z).T - 273.15, z]); P.line(pts, 'rgba(220,225,235,.55)', 1.4, [5, 4]);
        P.hline(tp[0], g.alpha('#FFFFFF', .45), [4, 3]); P.tag(-88, tp[0] + 0.8, 'tropopause ' + tp[0].toFixed(0) + ' km', T['text-2']);
        P.tag(-88, tp[0] / 2, 'troposphere', T['text-2']); P.tag(-88, Math.min(33, tp[0] + 8), 'stratosphere', T['text-2']);
      }
      at.rec.forEach(r => P.dot(r.T, r.z, 2.2, r.up ? '#FFB35C' : '#6FE7FF'));
    });
  }
  function pressPlot(S, g) {
    const K = kit(), p = S.p, T = th(g), at = S.at, zh = heightWhereP(p.site, 0.5), passed = S.at.B.z / 1000 > zh || S.at.B.burst;
    const Kk = K.plotKey(g, [{ c: '#FFB35C', dot: true, label: 'sonde going up' }, { c: '#6FE7FF', dot: true, label: 'coming down' }]);
    const P = g.Plot({ xmin: 0, xmax: 1050, ymin: 0, ymax: 36, pad: { t: Kk.t }, xlabel: 'pressure, hPa (the weight of the air above)', ylabel: 'height, km', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      if (passed || p.names) {
        P.hline(zh, g.alpha('#FFE38A', .6), [4, 3]); P.vline(P0 / 200, g.alpha('#FFE38A', .35), [2, 3]);
        P.tag(560, zh + 1, 'half the air is below ' + zh.toFixed(1) + ' km', '#FFE38A');
      }
      at.rec.forEach(r => P.dot(r.P, r.z, 2.2, r.up ? '#FFB35C' : '#6FE7FF'));
    });
  }
  /* bio */
  function nppTPlot(S, g) {
    const K = kit(), p = S.p, cl = climateOf(p);
    const Kk = K.plotKey(g, [{ c: '#FF9A5C', label: 'what warmth allows' }, { c: '#6FB8FF', label: 'what this rain allows (' + fmtN(cl.P) + ' mm)' }, { c: '#7BE08A', label: 'the smaller: growth', w: 4 }]);
    const P = g.Plot({ xmin: -30, xmax: 32, ymin: 0, ymax: 3000, pad: { t: Kk.t, l: 62 }, xlabel: 'mean temperature, °C', ylabel: 'growth, g/m² a year', xfmt: v => v.toFixed(0), yfmt: v => fmtN(v) }).frame();
    Kk.draw(P);
    const a = [], b = [], m = [];
    for (let t = -30; t <= 32; t += 0.25) { a.push([t, nppT(t)]); b.push([t, nppP(cl.P)]); m.push([t, npp(t, cl.P)]); }
    P.clip(() => {
      P.line(m, '#7BE08A', 5); P.line(a, '#FF9A5C', 2); P.line(b, '#6FB8FF', 2);
      if (!atPlace(p)) { const q0 = PLACEK[p.place]; P.dot(q0.T, npp(q0.T, cl.P), 4, 'rgba(255,255,255,.35)', g.alpha('#0B1020', .8)); }
      P.dot(cl.T, npp(cl.T, cl.P), 6, '#FFFFFF', g.alpha('#0B1020', .9));
    });
  }
  function nppPPlot(S, g) {
    const K = kit(), p = S.p, cl = climateOf(p);
    const Kk = K.plotKey(g, [{ c: '#6FB8FF', label: 'what rain allows' }, { c: '#FF9A5C', label: 'what this warmth allows (' + cl.T.toFixed(1) + ' °C)' }, { c: '#7BE08A', label: 'the smaller: growth', w: 4 }]);
    const P = g.Plot({ xmin: 0, xmax: 4000, ymin: 0, ymax: 3000, pad: { t: Kk.t, l: 62 }, xlabel: 'rain, mm a year', ylabel: 'growth, g/m² a year', xfmt: v => fmtN(v), yfmt: v => fmtN(v) }).frame();
    Kk.draw(P);
    const a = [], b = [], m = [];
    for (let r = 0; r <= 4000; r += 20) { a.push([r, nppP(r)]); b.push([r, nppT(cl.T)]); m.push([r, npp(cl.T, r)]); }
    P.clip(() => {
      P.line(m, '#7BE08A', 5); P.line(a, '#6FB8FF', 2); P.line(b, '#FF9A5C', 2);
      P.dot(cl.P, npp(cl.T, cl.P), 6, '#FFFFFF', g.alpha('#0B1020', .9));
    });
  }
  /* links */
  function co2Plot(S, g) {
    const K = kit(), p = S.p, T = th(g), ln = S.ln, ghost = allOn(p) ? null : ghostRun(p);
    const items = [{ c: '#FFB35C', label: 'the model' }, { c: '#FFFFFF', dot: true, label: 'measured: ice cores, then Mauna Loa' }];
    if (ghost) items.push({ c: 'rgba(220,225,235,.6)', label: 'with every interaction on', dash: [5, 4] });
    const Kk = K.plotKey(g, items);
    const top = Math.max(450, ...ln.rows.map(r => r.ppm), ghost ? Math.max(...ghost.filter(r => r.y <= ln.C.y).map(r => r.ppm)) : 0) + 20;
    const P = g.Plot({ xmin: 1850, xmax: 2100, ymin: 260, ymax: Math.ceil(top / 50) * 50, pad: { t: Kk.t }, xticks: [1850, 1900, 1950, 2000, 2050, 2100], xfmt: v => v.toFixed(0),
      xlabel: 'year', ylabel: 'CO₂ in the air, ppm', yfmt: v => v.toFixed(0) }).frame();
    Kk.draw(P);
    P.clip(() => {
      if (ghost) P.line(ghost.filter(r => r.y >= 1850 && r.y <= ln.C.y).map(r => [r.y, r.ppm]), 'rgba(220,225,235,.55)', 1.5, [5, 4]);
      P.line(ln.rows.map(r => [r.y, r.ppm]), '#FFB35C', 2.4);
      CO2_OBS.forEach(([y, c]) => { if (y >= 1850) P.dot(y, c, 2.6, '#FFFFFF'); });
      P.vline(ln.C.y, g.alpha(T['text-2'], .5), [2, 3]);
    });
  }
  function sinkPlot(S, g) {
    const K = kit(), p = S.p, ln = S.ln, b = ln.base;
    const Kk = K.plotKey(g, [{ c: '#FFB35C', box: true, label: 'stayed in the air' }, { c: '#5FB4FF', box: true, label: 'into the ocean' }, { c: '#8EE07A', box: true, label: 'into land plants and soil' }]);
    const tot = ln.rows.map(r => r.cumE - b.cumE), ymax = Math.max(100, ...tot) * 1.08;
    const P = g.Plot({ xmin: 1850, xmax: 2100, ymin: 0, ymax: Math.ceil(ymax / 100) * 100, pad: { t: Kk.t, l: 58 }, xticks: [1850, 1900, 1950, 2000, 2050, 2100], xfmt: v => v.toFixed(0),
      xlabel: 'year', ylabel: 'carbon added since 1850, GtC', yfmt: v => fmtN(v) }).frame();
    Kk.draw(P);
    const air = ln.rows.map(r => [r.y, r.air - (b.A - CARB.A0)]), oc = ln.rows.map((r, i) => [r.y, air[i][1] + (r.cumOcean - b.cumOcean)]), la = ln.rows.map((r, i) => [r.y, oc[i][1] + (r.cumLand - b.cumLand)]);
    P.clip(() => { P.area(la, 0, 'rgba(142,224,122,.75)'); P.area(oc, 0, 'rgba(95,180,255,.8)'); P.area(air, 0, 'rgba(255,179,92,.9)'); });
  }

  function plot1(S, g) { const s = S.p.setup; (s === 'geo' ? travelPlot : s === 'hydro' ? tracerPlot : s === 'atmo' ? tempPlot : s === 'bio' ? nppTPlot : co2Plot)(S, g); }
  function plot2(S, g) { const s = S.p.setup; (s === 'geo' ? landPlot : s === 'hydro' ? storePlot : s === 'atmo' ? pressPlot : s === 'bio' ? nppPPlot : sinkPlot)(S, g); }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'geo') {
      const A = stationArrivals(p, p.station), fP = firstOf(A.P), fS = firstOf(A.S), ar = aimRay(S);
      return [
        { label: 'Since the quake', value: mmss(S.tq), unit: 'min', hint: 'a minute a second' },
        { label: 'Seismometer', value: p.station.toFixed(0), unit: '°', flag: 'accent', hint: fmtN(p.station * Math.PI / 180 * RE) + ' km round the surface' },
        { label: 'First P', value: fP != null ? mmss(fP) : 'none', unit: fP != null ? 'min' : '', flag: fP != null ? '' : 'warn', hint: fP != null ? BRANCH[A.P[0].b].long : 'in the P shadow' },
        { label: 'First S', value: fS != null ? mmss(fS) : 'none', unit: fS != null ? 'min' : '', flag: fS != null ? '' : 'crit', hint: fS != null ? BRANCH[A.S[0].b].long : 'the liquid core stops S' },
        { label: 'S − P', value: fP != null && fS != null ? mmss(fS - fP) : '—', unit: fP != null && fS != null ? 'min' : '', hint: 'grows with distance' },
        { label: 'Aimed ray', value: ar.stop != null ? 'stops' : ar.land.toFixed(1), unit: ar.stop != null ? '' : '°', flag: 'accent', hint: 'leaves at ' + p.aim.toFixed(1) + '° · ' + (ar.stop != null ? 'at the core' : BRANCH[ar.b].long) }
      ];
    }
    if (p.setup === 'hydro') {
      const c = hydroCounts(S.hy), pc = k => (100 * c[RESK[k]] / HY_N).toFixed(0);
      return [
        { label: 'Since release', value: ageSay(S.hy.clock), hint: 'the clock speeds up ×10 every 2.5 s' },
        { label: 'In the ocean', value: pc('ocean'), unit: '%', flag: 'accent', hint: 'holds 96.6 % of all water' },
        { label: 'In the air', value: pc('air'), unit: '%', hint: 'stays ' + (residence('air') * 365.25).toFixed(1) + ' days' },
        { label: 'Underground', value: pc('ground'), unit: '%', hint: 'stays ' + fmtN(residence('ground')) + ' years' },
        { label: 'In ice', value: pc('ice'), unit: '%', hint: 'stays ' + fmtN(residence('ice')) + ' years' },
        { label: 'Sea rise', value: riseByVolume(p.melt / 100).toFixed(1), unit: 'm', hint: p.melt.toFixed(0) + ' % of the land ice melted' }
      ];
    }
    if (p.setup === 'atmo') {
      const B = S.at.B, q = airOf(p.site)(B.z / 1000);
      return [
        { label: 'Height', value: (B.z / 1000).toFixed(2), unit: 'km', flag: 'accent', hint: fmtN(B.t / 60) + ' min into the flight' },
        { label: 'Temperature', value: (q.T - 273.15).toFixed(1), unit: '°C' },
        { label: 'Pressure', value: (q.P / 100).toFixed(q.P < 10000 ? 1 : 0), unit: 'hPa', hint: 'sea level: 1013' },
        { label: 'Air below', value: (100 * (1 - q.P / P0)).toFixed(1), unit: '%', hint: 'by weight' },
        { label: 'Balloon', value: B.D.toFixed(2), unit: 'm', flag: B.burst ? 'crit' : '', hint: B.burst ? 'burst at ' + B.burst.D.toFixed(2) + ' m' : 'bursts at ' + BALLOONS[p.bal].burst + ' m' },
        { label: B.burst ? 'Falling' : 'Rising', value: Math.abs(B.v).toFixed(1), unit: 'm/s' }
      ];
    }
    if (p.setup === 'bio') {
      const cl = climateOf(p), lim = limitOf(cl.T, cl.P);
      return [
        { label: 'Temperature', value: cl.T.toFixed(1), unit: '°C', hint: p.warm ? (p.warm > 0 ? 'warmed ' : 'cooled ') + Math.abs(p.warm).toFixed(1) + ' °C' : 'yearly mean' },
        { label: 'Rain', value: fmtN(cl.P), unit: 'mm', hint: p.wet ? (p.wet > 0 ? '+' : '') + p.wet.toFixed(0) + ' % on its own' : 'a year' },
        { label: 'Warmth allows', value: fmtN(nppT(cl.T)), unit: 'g/m²', flag: lim === 'warmth' ? 'warn' : '' },
        { label: 'Water allows', value: fmtN(nppP(cl.P)), unit: 'g/m²', flag: lim === 'water' ? 'warn' : '' },
        { label: 'Plants grow', value: fmtN(npp(cl.T, cl.P)), unit: 'g/m²', flag: 'accent', hint: 'dry matter a year' },
        { label: 'Limited by', value: lim === 'both' ? 'both' : lim, hint: 'the smaller wins' }
      ];
    }
    const C = S.ln.C, f = C.f || carbonRates(C, linkOpts(p)), b = S.ln.base, E = C.cumE - b.cumE;
    return [
      { label: 'Year', value: String(Math.round(C.y)), hint: 'six years a second' },
      { label: 'CO₂', value: (C.A / PPM).toFixed(0), unit: 'ppm', flag: 'accent', hint: 'was 285 in 1850' },
      { label: 'Burning', value: f.ef.toFixed(1), unit: 'GtC/yr', hint: 'fossil fuels' },
      { label: 'Ocean takes', value: f.fas.toFixed(1), unit: 'GtC/yr', hint: p.ocean ? 'net' : 'switched off' },
      { label: 'Land takes', value: (f.npp - f.decay).toFixed(1), unit: 'GtC/yr', hint: p.plants ? 'growth − decay' : 'no growth response' },
      { label: 'Air keeps', value: E > 0 ? (100 * (C.A - b.A) / E).toFixed(0) : '—', unit: E > 0 ? '%' : '', hint: 'of all we added' }
    ];
  }
  function equation(S) {
    const p = S.p, Eq = L.E, note = s => '<br><span style="font-size:12px;color:var(--text-3)">' + s + '</span>';
    if (p.setup === 'geo') {
      const ar = aimRay(S);
      return Eq.frac(Eq.v('r') + ' sin ' + Eq.v('i'), Eq.v('v')) + ' ' + Eq.op('=') + ' ' + Eq.v('p') + ' ' + Eq.op('=') + ' ' + Eq.n(ar.p, 's') + ' along the whole aimed ray' +
        note('Snell’s law on a sphere: as a ray goes deeper the rock is faster, so sin ' + Eq.v('i') + ' grows until the ray turns back up. ' +
          (ar.stop != null ? 'This S ray meets liquid at ' + fmtN(RE - ar.stop) + ' km down and stops.' : 'It turns ' + fmtN(RE - ar.turn) + ' km down and comes up ' + ar.land.toFixed(1) + '° away after ' + mmss(ar.t) + '.'));
    }
    if (p.setup === 'hydro') {
      const k = p.release, v = RES[RESK[k]].v, out = WOUT[RESK[k]];
      return 'residence time ' + Eq.op('=') + ' ' + Eq.frac('volume', 'flow out') + ' ' + Eq.op('=') + ' ' + Eq.frac(fmtN(v * 1000) + ' km³', fmtN(out * 1000) + ' km³/yr') + ' ' + Eq.op('=') + ' ' + ageSay(v / out) +
        note('each tagged molecule waits a random time with that average, then goes where the flows go, in proportion to their size');
    }
    if (p.setup === 'atmo') {
      const B = S.at.B, q = airOf(p.site)(B.z / 1000);
      return Eq.frac(Eq.v('dP'), Eq.v('dz')) + ' ' + Eq.op('=') + ' ' + Eq.op('−') + Eq.v('ρ') + Eq.v('g') + ',  ' + Eq.v('ρ') + ' ' + Eq.op('=') + ' ' + Eq.frac(Eq.v('PM'), Eq.v('RT')) + ' ' + Eq.op('=') + ' ' + Eq.n(q.rho, 'kg/m³') +
        note('the helium swells as the pressure falls: ' + Eq.v('V') + ' ∝ ' + Eq.v('T') + '/' + Eq.v('P') + ', so the balloon is now ' + (Math.pow(B.D / B.D0, 3)).toFixed(1) + ' times its launch volume');
    }
    if (p.setup === 'bio') {
      const cl = climateOf(p);
      return 'growth ' + Eq.op('=') + ' min( ' + Eq.frac('3000', '1 + e<sup>1.315 − 0.119' + Eq.v('T') + '</sup>') + ', 3000(1 − e<sup>−0.000664' + Eq.v('P') + '</sup>) ) ' + Eq.op('=') + ' ' + Eq.n(npp(cl.T, cl.P), 'g/m²') +
        note('Lieth’s Miami model: each curve is fitted to productivity measured across the world’s biomes; the smaller limit is the one that binds');
    }
    const C = S.ln.C, f = C.f || carbonRates(C, linkOpts(p));
    return Eq.frac(Eq.v('d') + '(air)', Eq.v('dt')) + ' ' + Eq.op('=') + ' ' + Eq.n(f.ef, '') + Eq.sub('burning') + ' ' + Eq.op('+') + ' ' + Eq.n(f.el, '') + Eq.sub('clearing') + ' ' + Eq.op('+') + ' ' + Eq.n(f.decay, '') + Eq.sub('decay') +
      ' ' + Eq.op('−') + ' ' + Eq.n(f.npp, '') + Eq.sub('growth') + ' ' + Eq.op('−') + ' ' + Eq.n(f.fas, '') + Eq.sub('sea') + ' GtC/yr' +
      note('one stock per sphere and a flow for every way carbon crosses between them; the rates were fitted once to the record since 1750');
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  L.register({
    id: 'g6a-four-spheres',
    grade: 6, unit: '6A', topics: ['A4'],
    subject: 'earth',
    name: 'Earth’s Four Spheres — Rock, Water, Air and Life',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS MS-ESS2 · Earth’s Systems', 'NGSS CCC · Systems and System Models', 'CAST'],
    weight: 'Earth systems',
    is3D: true,
    autoplay: true,
    bloom: 0.16,
    stageHint: 'Drag to turn the view · drag the seismometer or the climate point',
    lede: 'The planet as four systems that trade matter and energy, each run on a published model. <b>Set off an earthquake</b> and time its waves ' +
      'through PREM, the Earth model seismologists use: the liquid outer core casts a shadow no S wave crosses. <b>Tag water</b> and follow it round ' +
      'the cycle. <b>Launch a weather balloon</b> and find the layers of the air in its own readings. <b>Ask what limits plant growth</b> in any ' +
      'climate. <b>Run the carbon cycle since 1850</b> against the Mauna Loa record, and switch off the ocean to see what it has been doing.',

    params: preset({}),
    presets: [
      { name: 'An earthquake: P and S waves through the real Earth', params: preset({}) },
      { name: 'Find the S-wave shadow: a seismometer at 120°', params: preset({ station: 120, wave: 'S' }) },
      { name: 'What if the outer core were solid?', params: preset({ outer: 'solid', station: 140, wave: 'S' }) },
      { name: 'Lehmann’s faint waves: aim a ray into the inner core', params: preset({ wave: 'P', aim: 5.2, station: 130 }) },
      { name: 'Tag water in the air', params: preset({ setup: 'hydro' }) },
      { name: 'Tag water in an ice sheet', params: preset({ setup: 'hydro', release: 'ice' }) },
      { name: 'Melt all the land ice', params: preset({ setup: 'hydro', melt: 100 }) },
      { name: 'A weather balloon over the middle latitudes', params: preset({ setup: 'atmo' }) },
      { name: 'A weather balloon in the tropics', params: preset({ setup: 'atmo', site: 'tropics' }) },
      { name: 'The tundra warms by 4 °C', params: preset({ setup: 'bio', place: 'utqiagvik', warm: 4 }) },
      { name: 'The Sahara’s edge gets twice the rain', params: preset({ setup: 'bio', place: 'timbuktu', wet: 100 }) },
      { name: 'Carbon since 1850: every sphere at work', params: preset({ setup: 'links' }) },
      { name: 'Switch off the ocean', params: preset({ setup: 'links', ocean: false }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS } ] },
      { group: 'The quake', when: is('geo'), items: [
        { key: 'wave', type: 'select', label: 'Waves to show', display: true, options: [
          { value: 'both', label: 'P and S' }, { value: 'P', label: 'P only' }, { value: 'S', label: 'S only' }] },
        { key: 'fan', type: 'select', label: 'Rays', display: true, options: [{ value: 'few', label: 'A few' }, { value: 'many', label: 'Many' }] },
        { key: 'aim', label: 'Aim one ray: it leaves at', min: 0.5, max: 33, step: 0.1, unit: '°', fmt: v => v.toFixed(1) },
        { key: 'station', label: 'Seismometer at', min: STATION_MIN, max: 180, step: 1, unit: '°', fmt: v => v.toFixed(0) } ] },
      { group: 'Inside the Earth', when: is('geo'), items: [
        { key: 'outer', type: 'select', label: 'Outer core', restructure: true, options: [
          { value: 'liquid', label: 'Liquid (measured)' }, { value: 'solid', label: 'Solid (what if?)' }] },
        { key: 'inner', type: 'select', label: 'Inner core', restructure: true, when: S => S.p.outer === 'liquid', options: [
          { value: 'solid', label: 'Solid (measured)' }, { value: 'liquid', label: 'Liquid (what if?)' }] },
        { key: 'labels', type: 'toggle', label: 'Name the layers', display: true } ] },
      { group: 'Tagged water', when: is('hydro'), items: [
        { key: 'release', type: 'select', label: 'Release it into', restructure: true, options: [
          { value: 'air', label: 'The air' }, { value: 'ocean', label: 'The ocean' }, { value: 'ice', label: 'An ice sheet' },
          { value: 'ground', label: 'Groundwater' }, { value: 'lakes', label: 'A lake' }] },
        { key: 'melt', label: 'Melt the land ice', min: 0, max: 100, step: 1, unit: '%', fmt: v => v.toFixed(0) } ] },
      { group: 'The launch', when: is('atmo'), items: [
        { key: 'site', type: 'select', label: 'Launch site', restructure: true, options: [
          { value: 'tropics', label: 'Tropics' }, { value: 'mid', label: 'Middle latitudes' }, { value: 'polar', label: 'Polar winter' }] },
        { key: 'bal', type: 'select', label: 'Balloon', restructure: true, options: [
          { value: 350, label: '350 g' }, { value: 600, label: '600 g' }, { value: 1200, label: '1200 g' }] },
        { key: 'fill', label: 'Filled with helium to', min: 1.2, max: 2.2, step: 0.05, unit: 'm', fmt: v => v.toFixed(2), restructure: true },
        { key: 'names', type: 'toggle', label: 'Name the layers', display: true } ] },
      { group: 'The climate', when: is('bio'), items: [
        { key: 'place', type: 'select', label: 'Place', restructure: false, options: PLACES.map(q => ({ value: q.k, label: q.name.split(',')[0] })) },
        { key: 'warm', label: 'Make it warmer by', min: -10, max: 10, step: 0.5, unit: '°C', fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
        { key: 'wet', label: 'Change its rain by', min: -80, max: 150, step: 5, unit: '%', fmt: v => (v > 0 ? '+' : '') + v.toFixed(0) },
        { key: 'reach', type: 'toggle', label: 'Show how far life reaches', display: true } ] },
      { group: 'Fossil fuels', when: is('links'), items: [
        { key: 'fossil', type: 'select', label: 'After 2023', restructure: true, options: [
          { value: 'hold', label: 'Keep burning' }, { value: 'stop', label: 'Stop in 2030' }, { value: 'double', label: 'Double by 2080' }, { value: 'none', label: 'Never burned' }] } ] },
      { group: 'Interactions between the spheres', when: is('links'), items: [
        { key: 'ocean', type: 'toggle', label: 'The ocean dissolves CO₂', restructure: true },
        { key: 'plants', type: 'toggle', label: 'Plants grow more with more CO₂', restructure: true },
        { key: 'clearing', type: 'toggle', label: 'People clear forests', restructure: true } ] }
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
      if (d.id === 'station' && S.cam && window.GEO) {
        let best = p.station, bd = 1e9;
        for (let a = STATION_MIN; a <= 180; a += 0.5) {
          const q = GEO.facePoint(S.cam, [0, 0, 0], 1, AX, RE, a * Math.PI / 180);
          if (!q.ok) continue;
          const dd = Math.hypot(q.x - d.x, q.y - d.y);
          if (dd < bd) { bd = dd; best = a; }
        }
        p.station = Math.round(best);
      } else if (d.id === 'climate' && S._wh) {
        const W0 = S._wh, T = WH.T0 + (d.x - W0.x0) / (W0.x1 - W0.x0) * (WH.T1 - WH.T0), P = WH.P0 + (W0.y0 - d.y) / (W0.y0 - W0.y1) * (WH.P1 - WH.P0), q = PLACEK[p.place];
        p.warm = clamp(Math.round((T - q.T) * 2) / 2, -10, 10);
        p.wet = clamp(Math.round((P / Math.max(1, q.P) - 1) * 20) * 5, -80, 150);
      }
    },

    plots: [
      { title: S => ({ geo: 'Arrival time against distance — every wave the quake sends', hydro: 'Where the tagged water is, as the years run on',
          atmo: 'Temperature against height, read by the sonde', bio: 'Plant growth against temperature, at this rainfall',
          links: 'CO₂ in the air, 1850–2100 — the model against the measurements' })[S.p.setup],
        draw(S, g) { plot1(S, g); } },
      { title: S => ({ geo: 'Where each ray comes up — aim one and see', hydro: 'How much each store holds, and how long water stays',
          atmo: 'Pressure against height — the weight of the air above', bio: 'Plant growth against rainfall, at this temperature',
          links: 'Where the carbon we added went' })[S.p.setup],
        draw(S, g) { plot2(S, g); } }
    ],

    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'NGSS MS-ESS2 · evidence for Earth’s layers',
        q: 'A seismometer stands 60° round the Earth from a quake. How many minutes after the quake does the first P wave reach it?',
        params: preset({ station: 60 }),
        predict: { label: 'minutes', unit: 'min', tol: 0.05 },
        measure: S => firstOf(stationArrivals(S.p, 60).P) / 60,
        working: 'The first P wave dives through the mantle, where rock gets faster with depth, and comes up 60° away after 10 minutes 7 seconds. ' +
          'That is 6,670 km round the surface — an average of 11 km every second, faster than any rock at the surface, because the wave ' +
          'took the deep, fast road. Real seismograms agree with PREM’s time to within a few seconds.' },
      { source: 'Counterfactual · what the S shadow proves',
        q: 'Make the outer core solid. How many minutes after the quake does the first S wave reach a seismometer 150° away?',
        params: preset({ outer: 'solid', station: 150, wave: 'S' }),
        predict: { label: 'minutes', unit: 'min', tol: 0.05 },
        measure: S => firstOf(stationArrivals(S.p, 150).S) / 60,
        working: 'About 30 minutes. In a solid core S waves travel on and reach the far side. In the real Earth no S wave ever reaches 150° — the ' +
          'seismometers there wait in vain. A liquid cannot be sheared, so it carries no S wave: that missing arrival is how we know the outer ' +
          'core is molten iron, 2,900 km under our feet.' },
      { source: 'NGSS MS-ESS2-4 · the water cycle',
        q: 'Water evaporates into the air. On average, how many days does it stay there before it falls as rain or snow?',
        params: preset({ setup: 'hydro', release: 'air' }),
        predict: { label: 'days', unit: 'd', tol: 0.1 },
        measure: S => residence('air') * 365.25,
        working: 'Residence time is volume ÷ flow out. The air holds 12,900 km³ of water; 486,000 km³ leaves it each year as rain and snow. ' +
          '12,900 ÷ 486,000 of a year is about 9.7 days. The ocean, by the same sum, keeps its water for about 3,200 years.' },
      { source: 'Ideal gas · the atmosphere thins with height',
        q: 'A 600 g balloon is filled to 1.5 m across and launched in the middle latitudes. At what height does it burst?',
        params: preset({ setup: 'atmo', site: 'mid', bal: 600, fill: 1.5 }),
        predict: { label: 'height', unit: 'km', tol: 0.08 },
        measure: S => { const b = burstOf(S.p.site, S.p.bal, S.p.fill); return b ? b.z / 1000 : 0; },
        working: 'Its helium swells as the pressure falls (V ∝ T/P). The balloon bursts when it reaches its rated 6.02 m across: (6.02/1.5)³ ≈ 65 times ' +
          'its launch volume. That happens where the pressure is about 1/65 of sea level with the cold of the stratosphere — near 30 km, ' +
          'above 98 % of the air.' },
      { source: 'NGSS MS-LS2 · limits on growth',
        q: 'Yakutsk has a mean temperature of −8.8 °C and 240 mm of rain a year. Warm it by 4 °C. How many grams of plant matter grow per square metre a year?',
        params: preset({ setup: 'bio', place: 'yakutsk', warm: 4 }),
        predict: { label: 'growth', unit: 'g/m²', tol: 0.06 },
        measure: S => { const c = climateOf(S.p); return npp(c.T, c.P); },
        working: 'Warmth limits Yakutsk: at −8.8 °C it allows only 258 g, while its rain would allow 442. At −4.8 °C warmth allows 395 g — still the ' +
          'smaller, so growth rises by half. A desert warmed the same way gains nothing: water limits it, not warmth.' },
      { source: 'NGSS MS-ESS3-5 · modelling an Earth-system change',
        q: 'Suppose the world stops burning fossil fuels and clearing forests in 2030. What does the model say CO₂ will be in 2100?',
        params: preset({ setup: 'links', fossil: 'stop' }),
        predict: { label: 'CO₂', unit: 'ppm', tol: 0.03 },
        measure: S => carbonRun(linkOpts(S.p), 2100).find(r => r.y === 2100).ppm,
        working: 'CO₂ does not stay at its 2030 peak: the ocean and the land keep taking up carbon, so it falls — to about 380 ppm by 2100. Slowly, ' +
          'because the deep ocean mixes over centuries; it would take thousands of years to return to 280.' }
    ],

    walkthrough: [
      { title: '1 · Nobody has been there',
        ask: 'The deepest hole ever drilled is 12 km. The centre of the Earth is 6,371 km down. How can anyone know what is at the centre?',
        reveal: '<b>By listening to earthquakes.</b> Every large quake sends waves through the whole planet, and thousands of seismometers time ' +
          'them. Where the waves arrive, and when, and which ones never arrive, carry the answer.', params: preset({}) },
      { title: '2 · Two kinds of wave',
        ask: 'P waves push and pull the rock; S waves shake it side to side. Watch them leave the quake. Which is faster?',
        reveal: '<b>P, always</b> — about 1.7 times faster. That is why the first shaking at a seismometer is P, and the gap to S grows with ' +
          'distance: the S − P time tells you how far away the quake was.', params: preset({ station: 40 }) },
      { title: '3 · The shadow',
        ask: 'Move the seismometer round to 120°. What does it record?',
        reveal: '<b>No S wave, ever, beyond about 103°.</b> Something at the centre stops them. A liquid cannot be sheared, so it cannot carry an S ' +
          'wave: the outer core is liquid. Oldham saw the first hints in 1906; Jeffreys proved it in 1926.', params: preset({ station: 120, wave: 'S' }) },
      { title: '4 · What if it were solid?',
        ask: 'Switch the outer core to solid. Does the shadow stay?',
        reveal: '<b>It disappears.</b> S waves pass through a solid core and reach every station. The shadow in the real record is the evidence.', params: preset({ outer: 'solid', station: 140, wave: 'S' }) },
      { title: '5 · The faint waves',
        ask: 'Aim a P ray steeply, at about 5°. Where does it come up?',
        reveal: '<b>Inside the P shadow, weakly.</b> In 1936 Inge Lehmann noticed faint P waves where there should be none, and explained them with ' +
          'a small solid inner core in which waves travel faster. Make the inner core liquid and they vanish.', params: preset({ wave: 'P', aim: 5.2, station: 130 }) },
      { title: '6 · Where the water is',
        ask: 'Which holds more water: all the world’s rivers, or the air?',
        reveal: '<b>The air, six times over</b> — 12,900 km³ against 2,120. And nearly all fresh water is ice or deep groundwater; the lakes and ' +
          'rivers we drink from would make a ball just 56 km across.', params: preset({ setup: 'hydro' }) },
      { title: '7 · How long it stays',
        ask: 'Tagged water starts in the air. Where is most of it after a year? After a thousand?',
        reveal: '<b>In the ocean — and still there.</b> Water leaves the air in about ten days but stays in the ocean for 3,200 years. Where water is at any ' +
          'moment is set by how long each store keeps it.', params: preset({ setup: 'hydro' }) },
      { title: '8 · Launch',
        ask: 'Predict: will the air get colder and colder all the way up?',
        reveal: '<b>No.</b> It cools about 6.5 °C per km for the first 11 km, stops, then warms again: ozone in the stratosphere absorbs the ' +
          'Sun’s ultraviolet. The sonde’s own readings show the turn — that is where one layer ends and the next begins.', params: preset({ setup: 'atmo' }) },
      { title: '9 · The balloon swells',
        ask: 'The balloon was 1.5 m across at launch. Why does it burst?',
        reveal: '<b>The air around it thins.</b> With less pressure outside, the helium spreads out (V ∝ T/P) until the latex tears — near 30 km, ' +
          'with 98 % of the air below it. Half of all the air is within 5.5 km of the ground.', params: preset({ setup: 'atmo' }) },
      { title: '10 · What limits life',
        ask: 'A desert and the tundra both grow very little. Is it for the same reason?',
        reveal: '<b>No.</b> The desert is short of water, the tundra of warmth. Warm them both by 4 °C: the tundra grows more; the desert does not. ' +
          'A system is limited by whichever supply runs short first.', params: preset({ setup: 'bio', place: 'utqiagvik', warm: 4 }) },
      { title: '11 · Switch off the ocean',
        ask: 'The ocean takes up some of the carbon we emit. Without it, what would CO₂ be today?',
        reveal: '<b>About 490 ppm instead of 421.</b> The hydrosphere has been quietly absorbing a fifth of our emissions, and the biosphere about ' +
          'a third. Switch each off and see how much each sphere does.', params: preset({ setup: 'links', ocean: false }) },
      { title: '12 · Stop in 2030',
        ask: 'If emissions stopped in 2030, would CO₂ stay where it was?',
        reveal: '<b>It would slowly fall</b> — to about 380 ppm by 2100 — because the ocean and plants keep taking up carbon. An event in one sphere ' +
          'plays out through all four, over decades to centuries.', params: preset({ setup: 'links', fossil: 'stop' }) }
    ],

    quiz: [
      { q: 'How do scientists know that Earth’s outer core is liquid?',
        options: ['Drills have reached it', 'S waves from earthquakes never arrive on the far side of the Earth', 'Volcanoes erupt liquid iron', 'The core is hot'],
        answer: 1, why: 'S waves cannot travel through a liquid. Seismometers more than about 103° from a quake never record them: the outer core casts an S-wave shadow.' },
      { q: 'Where is most of Earth’s fresh water?',
        options: ['In rivers and lakes', 'In the air', 'In ice sheets, glaciers and groundwater', 'In living things'],
        answer: 2, why: 'About 69 % of fresh water is ice and 30 % groundwater. All the lakes and rivers together are less than 1 %.' },
      { q: 'Going up through the stratosphere, the temperature…',
        options: ['keeps falling', 'rises, because ozone absorbs sunlight', 'stays at 0 °C', 'falls faster than in the troposphere'],
        answer: 1, why: 'Ozone absorbs the Sun’s ultraviolet and warms the stratosphere, so temperature rises with height there — the reverse of the troposphere.' },
      { q: 'A hot desert and the Arctic tundra both have little plant growth. Why?',
        options: ['Both are too cold', 'Both are too dry', 'The desert is too dry; the tundra is too cold', 'Neither has soil'],
        answer: 2, why: 'In the Miami model growth is the smaller of what warmth and water allow. The desert is limited by water, the tundra by warmth.' },
      { q: 'Of the carbon we have emitted since 1850, about how much is still in the air?',
        options: ['All of it', 'A bit under half', 'About a tenth', 'None: plants took it all'],
        answer: 1, why: 'About 42 % stayed in the air; the ocean took about a fifth, and land plants and soil about a third.' },
      { q: 'Half of all the air on Earth lies below about…',
        options: ['500 m', '5.5 km', '50 km', '500 km'],
        answer: 1, why: 'Pressure halves by about 5.5 km. The atmosphere has no top, but it is mostly very thin: 99 % of it is below 31 km.' }
    ],

    notes: '<b>Where this shows up.</b><ul>' +
      '<li>NGSS <b>MS-ESS2-1, MS-ESS2-4, MS-ESS2-6</b>: Earth’s materials and processes; the water cycle driven by the Sun and gravity; the atmosphere and ocean.</li>' +
      '<li>NGSS <b>MS-LS2-1</b> and <b>MS-ESS3-5</b>: what limits populations and growth; how human activity changes the global system.</li>' +
      '<li>NGSS cross-cutting concepts <b>Systems and System Models</b> and <b>Energy and Matter</b>: the four spheres are subsystems that exchange matter and energy.</li></ul>' +
      '<div class="pyq"><em>Misconception to catch</em> “We know what is inside the Earth because people dug there.” The deepest hole is 12 km; ' +
      'everything below is known from waves.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “Most fresh water is in rivers and lakes.” It is ice and groundwater; lakes and rivers are under 1 %.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “Air has no weight.” The air above each square metre weighs about ten tonnes.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “Deserts and tundra are unproductive for the same reason.” One lacks water, the other warmth.</div>'
  });

  const EQ_NOTE = {
    geo: 'The waves follow <b>Snell’s law on a sphere</b>: ' + 'r·sin(i)/v stays the same all along a ray. Speeds come from PREM, the reference Earth ' +
      'built from millions of travel times; S waves have no speed in a liquid. Nothing is fitted to the shadow: it falls out of the layers.',
    hydro: 'A store’s <b>residence time</b> is its volume divided by the flow through it. Tagged molecules each wait a random time with that average, ' +
      'then move on in proportion to the flows — and over long times they spread out exactly as the water itself is spread.',
    atmo: 'Each layer of air is pressed by the weight of the air above it: <b>dP/dz = −ρg</b>, with the density from the gas law. The temperature profile is ' +
      'the measured climatology; the balloon’s size follows from <b>V ∝ T/P</b> until it reaches its rated burst diameter.',
    bio: 'The <b>Miami model</b> (Lieth, 1975) fits measured productivity across the world’s biomes with two curves — one for warmth, one for rain — ' +
      'and takes the smaller. It is a model of limits: the scarcer resource sets the growth.',
    links: 'One stock of carbon per sphere, one flow for every way carbon crosses between them. Emissions are the recorded ones; the exchange rates were ' +
      'fitted once to the ice-core and Mauna Loa record. <b>Switch an interaction off</b> to see what that sphere has been doing.'
  };

  const MODEL = { PREM, earthOf, ray, leg, fanTable, arrivalsAt, firstOf, surfaceTime, interior, stationArrivals, shadowsOf, RE,
    RES, WFLUX, residence, riseByVolume, SLE, SLE_ALL, ballsOf, expected, hop, WATER_TOTAL,
    airOf, heightWhereP, tropopause, balloon, flyTo, burstOf, ascentRate, BALLOONS,
    nppT, nppP, npp, limitOf, PLACES, carbonRun, carbonStart, carbonStep, CO2_OBS, CARB, PPM, BASE: () => BASE };
  L.models = L.models || {};
  L.models['g6a-four-spheres'] = MODEL;
})(window.InsightLab);
