/* ============================================================
   GRADE 6 · UNIT D · WATER, ATMOSPHERE AND WEATHER
   6D-1  The Water Cycle Machine
   (D1.1 Earth's water reservoirs; D1.2 Evaporation and condensation;
    D1.3 Precipitation, runoff and infiltration; D1.4 Transpiration;
    D1.5 Two drivers: solar energy and gravity; D1.6 Residence time and
    the water cycle as a system)

   Six benches, each a real experiment on one part of the cycle:
     reservoirs — all of Earth's water poured, to scale, into one bottle and
                  a row of cylinders, from Gleick's (1996) inventory. Melt
                  the ice sheets and the ocean rises; count the drops of
                  fresh water in lakes and rivers.
     evaporate  — a sealed glass chamber: a dish of water on a hot plate,
                  an ice-cold lid. The dish's temperature comes out of its
                  energy balance; vapour leaves it at the rate the vapour
                  difference drives (Chilton–Colburn); the air saturates
                  by Clausius–Clapeyron, mists the lid at the dew point,
                  makes a cloud of liquid drops, and drips fresh water out
                  of salt water.
     rain       — a rainfall simulator over a tilted tray of soil. Green–Ampt
                  infiltration on Rawls' soil parameters, a ponded surface
                  that drains by Manning's law, drops sized by Marshall–
                  Palmer and falling at their measured terminal speed.
     transpire  — a potometer: a leafy shoot sealed into a water-filled
                  capillary. Stomata open with light and close in dry air
                  (Jarvis), the boundary layer thins with wind, the leaf
                  warms in its own energy balance; the bubble measures it.
     drivers    — the planet's water as a box model on Trenberth's (2007)
                  fluxes. Turn the Sun down, then gravity, and see which
                  arrows each one powers.
     residence  — dye a real lake and watch it flush: e-folding time =
                  volume ÷ outflow; close its outlet and the salt piles up.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.R3, MEAS, TERRAIN, GEO, G6D, KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS;

  /* ============================================================
     WATER AND VAPOUR — the physics every bench shares
     ============================================================ */
  const RV = 461.5;                                             // J/(kg·K), the gas constant of water vapour
  const es = Tc => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));   // Pa, Buck (1996), over water
  const rhoSat = Tc => es(Tc) / (RV * (Tc + 273.15)) * 1000;      // g/m³
  const latent = Tc => 2.501e6 - 2361 * Tc;                     // J/kg
  function dewOf(e) {                                           // the temperature at which e is the saturation pressure
    if (e <= 1) return -60;
    let lo = -60, hi = 110;
    for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (es(m) > e) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  const dewOfRho = (rho, Tc) => dewOf(rho / 1000 * RV * (Tc + 273.15));   // from vapour density at air temperature Tc
  const aw = Sg => clamp(1 - 0.00054 * Sg - 0.0000017 * Sg * Sg, 0.70, 1);  // water activity of salt water (g of salt per kg)

  /* ============================================================
     RESERVOIRS — Gleick (1996), the inventory the USGS publishes
     ============================================================ */
  const RES = [                                                 // km³
    { k: 'ocean', name: 'Oceans, seas and bays', v: 1338000000, salt: true },
    { k: 'ice', name: 'Ice caps, glaciers, permanent snow', v: 24064000 },
    { k: 'gwSalt', name: 'Groundwater, saline', v: 12870000, salt: true },
    { k: 'gwFresh', name: 'Groundwater, fresh', v: 10530000 },
    { k: 'permafrost', name: 'Ground ice and permafrost', v: 300000 },
    { k: 'lakeFresh', name: 'Lakes, fresh', v: 91000 },
    { k: 'lakeSalt', name: 'Lakes, saline', v: 85400 },
    { k: 'soil', name: 'Soil moisture', v: 16500 },
    { k: 'air', name: 'Atmosphere', v: 12900 },
    { k: 'swamp', name: 'Swamp water', v: 11470 },
    { k: 'river', name: 'Rivers', v: 2120 },
    { k: 'life', name: 'Biological water', v: 1120 }
  ];
  const RESK = {}; RES.forEach(r => { RESK[r.k] = r; });
  const TOTAL = RES.reduce((s, r) => s + r.v, 0);              // 1,385,984,610 km³
  const FRESH = RES.filter(r => !r.salt).reduce((s, r) => s + r.v, 0);
  const OCEAN_AREA = 361.3e6;                                   // km²
  const DROP = 0.05;                                            // mL in one drop from a dropper
  const SLE = { antarctica: 57.9, greenland: 7.42, glaciers: 0.32 };          // m (Fretwell 2013, Morlighem 2017, Farinotti 2019)
  const SLE_ALL = SLE.antarctica + SLE.greenland + SLE.glaciers;
  /* the residence time of each store, volume ÷ the flux through it (thousand km³ a year; Trenberth et al. 2007,
     Döll & Fiedler 2008 for recharge, Shiklomanov for the rest) */
  const THROUGH = { ocean: 413, ice: 2.5, gwSalt: 0.8, gwFresh: 12.7, permafrost: 0.03, lakeFresh: 6.5, lakeSalt: 1.0, soil: 113, air: 486, swamp: 2.3, river: 40, life: 44.5 };
  const residence = k => RESK[k].v / (THROUGH[k] * 1000);     // years
  function bottle(p) {
    /* the litres of the bottle hold all of Earth's water, or (fresh view) all of its fresh water; melting a share of
       the ice moves it into the ocean */
    const melt = clamp(p.melt / 100, 0, 1), L0 = p.bottleL;
    const v = {}; RES.forEach(r => { v[r.k] = r.v; });
    const moved = v.ice * melt; v.ice -= moved; v.ocean += moved;
    const base = p.view === 'fresh' ? RES.filter(r => !r.salt).reduce((s, r) => s + v[r.k], 0) : TOTAL;
    const mL = {}; RES.forEach(r => { mL[r.k] = (p.view === 'fresh' && r.salt) ? 0 : v[r.k] / base * L0 * 1000; });
    const rise = melt * SLE_ALL;                                 // m: what the land ice would add to the sea (its sea-level equivalent; the ice
                                                                 // already below sea level, and the ocean's spreading, are in the published figure)
    return { mL, km3: v, base, rise, freshPct: FRESH / TOTAL * 100, surfacePct: (v.lakeFresh + v.river + v.swamp) / FRESH * 100 };
  }

  /* ============================================================
     EVAPORATION — a sealed chamber, 60 × 30 × 40 cm
     ============================================================ */
  const CH = { V: 0.072, Alid: 0.18, Awall: 0.84, Cdish: 300 * 4.186 + 160, Gside: 0.45, film: 15, sigma: 5.67e-8, vent: 0.004, settle: 90 };
  const hcOf = u => 4 + 4.2 * u;                                // W/(m²·K): still air to a small fan
  const hmOf = u => hcOf(u) / (1.2 * 1005 * Math.pow(0.85, 2 / 3));   // m/s, Chilton–Colburn: mass moves as heat does
  function chamberStart(p) {
    const Aw = Math.PI * Math.pow(p.dish / 200, 2);
    const C = { t: 0, Tw: p.room, mv: p.roomRH / 100 * rhoSat(p.room) * CH.V, fog: 0, film: 0, wall: 0, drip: 0, dishM: 300, salt: 300 * p.salt / 1000, evap: 0, Aw, E: 0, C: 0, P: 0, hist: [] };
    /* the dish was warmed on the hot plate before the chamber was closed: it starts at the temperature where the
       plate's power just balances what it loses (found by bisection on its energy balance) */
    if (p.power > 0) {
      let lo = p.room - 5, hi = 100;
      for (let k = 0; k < 40; k++) { C.Tw = (lo + hi) / 2; if (dishNet(C, p) > 0) lo = C.Tw; else hi = C.Tw; }
    }
    return C;
  }
  function dishNet(C, p) {
    const R = chamberRates(C, p), Tk = C.Tw + 273.15, Tak = R.Ta + 273.15;
    return p.power - (latent(C.Tw) * R.E / 1000 + R.hc * C.Aw * (C.Tw - R.Ta) + 0.95 * CH.sigma * C.Aw * (Tk ** 4 - Tak ** 4) + CH.Gside * (C.Tw - p.room));
  }
  function chamberRates(C, p) {
    const u = p.fan, hc = hcOf(u), hm = hmOf(u), lid = p.lid !== 'open';
    const Tl = p.lid === 'ice' ? p.lidT : p.room;
    const Gw = hc * C.Aw, Gl = lid ? hc * CH.Alid : 0, Gr = 3 * CH.Awall + (lid ? 0 : 6);
    const Ta = (Gw * C.Tw + Gl * Tl + Gr * p.room) / (Gw + Gl + Gr);
    const rv = C.mv / CH.V, S = C.salt / Math.max(1, C.dishM) * 1000;
    const E = C.dishM > 1 ? hm * C.Aw * (aw(S) * rhoSat(C.Tw) - rv) : 0;              // g/s from the dish
    let Cl = lid ? hm * CH.Alid * (rv - rhoSat(Tl)) : 0;                              // g/s onto the lid
    if (Cl < 0 && C.film <= 0) Cl = 0;
    let Cw = hm * CH.Awall * 0.5 * (rv - rhoSat(p.room));                              // the glass walls mist
    if (Cw < 0 && C.wall <= 0) Cw = 0;
    const vent = lid ? 0 : CH.vent * (rv - p.roomRH / 100 * rhoSat(p.room));          // open: the room carries vapour away
    return { Ta, Tl, rv, S, E, Cl, Cw, vent, hc };
  }
  function chamberStep(C, p, dt) {
    const n = Math.max(1, Math.ceil(dt / 0.5)), h = dt / n;
    for (let k = 0; k < n; k++) {
      const R = chamberRates(C, p);
      // the dish's energy: the hot plate in; evaporation, convection, radiation and the glass sides out
      const Tk = C.Tw + 273.15, Tak = R.Ta + 273.15;
      const out = latent(C.Tw) * R.E / 1000 + R.hc * C.Aw * (C.Tw - R.Ta) + 0.95 * CH.sigma * C.Aw * (Tk ** 4 - Tak ** 4) + CH.Gside * (C.Tw - p.room);
      let net = p.power - out, boil = 0;
      C.Tw += net * h / (C.Cdish = CH.Cdish * Math.max(0.15, C.dishM / 300));
      if (C.Tw > 100) { boil = (C.Tw - 100) * C.Cdish / latent(100) * 1000; C.Tw = 100; }  // g boiled off in this step
      const evap = Math.max(-C.dishM, R.E * h) + boil;
      C.dishM = Math.max(0, C.dishM - evap); C.evap += evap;
      C.mv += evap - R.Cl * h - R.Cw * h - R.vent * h;
      C.film = Math.max(0, C.film + R.Cl * h); C.wall = Math.max(0, C.wall + R.Cw * h);
      // drops on the lid run down its slope into the funnel once the film is thicker than glass can hold
      const hold = CH.film * CH.Alid;
      if (C.film > hold) { C.drip += C.film - hold; C.film = hold; }
      // a cloud: vapour beyond saturation at the air's temperature condenses on dust into drops of liquid
      const sat = rhoSat(R.Ta) * CH.V;
      if (C.mv > sat) { C.fog += C.mv - sat; C.mv = sat; }
      else if (C.fog > 0) { const back = Math.min(C.fog, sat - C.mv); C.fog -= back; C.mv += back; }
      const fall = C.fog * h / CH.settle; C.fog -= fall; C.wall += fall;
      if (C.mv < 0) C.mv = 0;
      C.t += h; C.E = R.E; C.C = R.Cl; C.Ta = R.Ta; C.Tl = R.Tl; C.rv = C.mv / CH.V;
    }
    return C;
  }
  function chamberRun(p, secs) { const C = chamberStart(p); chamberStep(C, p, secs); return C; }
  const rhOf = C => 100 * C.rv / rhoSat(C.Ta);

  /* ============================================================
     RAIN — Green–Ampt infiltration on Rawls, Brakensiek & Miller (1983)
     Ks mm/h · ψ wetting-front suction mm · θe effective porosity
     ============================================================ */
  const SOILS = {
    sand: { name: 'Sand', Ks: 117.8, psi: 49.5, te: 0.417, col: '#D9C08A' },
    sandyLoam: { name: 'Sandy loam', Ks: 10.9, psi: 110.1, te: 0.412, col: '#B08A5A' },
    loam: { name: 'Loam', Ks: 3.4, psi: 88.9, te: 0.434, col: '#8A6440' },
    siltLoam: { name: 'Silt loam', Ks: 6.5, psi: 166.8, te: 0.486, col: '#9A7A58' },
    siltyClay: { name: 'Silty clay', Ks: 0.5, psi: 292.2, te: 0.423, col: '#7A6A60' },
    clay: { name: 'Clay', Ks: 0.3, psi: 316.3, te: 0.385, col: '#6E5648' },
    paved: { name: 'Pavement', Ks: 0, psi: 0, te: 0, col: '#6A6C70' }
  };
  const COVER = { bare: { name: 'bare soil', inter: 0, n: 0.02, mac: 1 }, grass: { name: 'grass', inter: 1.5, n: 0.24, mac: 2 }, mulch: { name: 'straw mulch', inter: 3, n: 0.12, mac: 1.4 } };
  const TRAY = { L: 0.6, W: 0.3, depth: 0.16 };                 // m: the soil tray under the nozzles (0.18 m²: 1 mm of water = 180 mL)
  /* Marshall–Palmer: median drop diameter for a rain rate; Atlas et al. (1973): terminal speed of a drop */
  const dropD0 = R => R > 0 ? 3.67 / (4.1 * Math.pow(R, -0.21)) : 0;      // mm
  const dropV = D => Math.max(0, 9.65 - 10.3 * Math.exp(-0.6 * D));      // m/s
  function soilOf(p) {
    const s = SOILS[p.soil], cv = p.soil === 'paved' ? COVER.bare : COVER[p.cover];
    const S = Math.tan(p.slope * Math.PI / 180) * 100, RR = p.soil === 'paved' ? 1 : p.rough;
    const Sd = Math.max(0, 0.243 * RR + 0.010 * RR * RR - 0.012 * RR * S);   // mm held in hollows (Kamphorst et al. 2000)
    return { Ks: s.Ks * cv.mac, psi: s.psi, dth: s.te * (1 - p.wet / 100), te: s.te, n: cv.n, inter: p.soil === 'paved' ? 0 : cv.inter, Sd };
  }
  function trayStart(p) { return { t: 0, F: 0, h: 0, I: 0, rain: 0, run: 0, f: 0, q: 0, ponded: null, can: 0, hist: [] }; }
  function trayStep(T, p, dt) {                                  // dt in seconds of the storm
    const s = soilOf(p), slope = Math.max(0.005, Math.tan(p.slope * Math.PI / 180));
    const n = Math.max(1, Math.ceil(dt / 2)), h = dt / n;
    for (let k = 0; k < n; k++) {
      const raining = T.t < p.dur * 60, i = raining ? p.rate : 0;     // mm/h
      let inflow = i;                                            // the canopy fills first
      if (inflow > 0 && T.I < s.inter) { const take = Math.min(s.inter - T.I, inflow * h / 3600); T.I += take; inflow -= take * 3600 / h; }
      const cap = s.Ks > 0 ? (T.F > 1e-6 ? s.Ks * (1 + s.psi * s.dth / T.F) : 1e9) : 0;     // mm/h, Green–Ampt
      const supply = inflow + T.h * 3600 / h;                    // everything that could soak in this step
      const f = Math.min(cap, supply);
      T.F += f * h / 3600;
      T.h = Math.max(0, T.h + (inflow - f) * h / 3600);
      if (T.h > 0.05 && T.ponded == null) T.ponded = T.t;
      // the ponded sheet drains off the lip once the hollows are full: Manning's law, per metre of width, over the tray's length
      const hm = Math.max(0, T.h - s.Sd) / 1000, q = hm > 0 ? (1 / s.n) * Math.pow(hm, 5 / 3) * Math.sqrt(slope) : 0;   // m²/s
      const out = Math.min(Math.max(0, T.h - s.Sd), q / TRAY.L * 1000 * h);   // mm off the tray
      T.h -= out; T.run += out; T.q = q / TRAY.L * 1000 * 3600; T.f = f; T.cap = cap;
      T.rain += i * h / 3600; T.t += h;
    }
    return T;
  }
  function trayRun(p, mins) { const T = trayStart(p); trayStep(T, p, mins * 60); return T; }
  function ponding(p, i) {                                       // Green–Ampt under steady rain i (mm/h): when the surface ponds
    const s = soilOf(p);
    if (s.Ks <= 0) return { tp: 0, Fp: 0 };
    if (i <= s.Ks) return { tp: Infinity, Fp: Infinity };
    const Fp = s.Ks * s.psi * s.dth / (i - s.Ks);
    return { Fp, tp: Fp / i * 60 };                              // mm, minutes
  }
  const frontOf = (T, p) => { const s = soilOf(p); return s.dth > 0 ? T.F / s.dth : 0; };    // mm, how deep the wet soil reaches

  /* ============================================================
     TRANSPIRATION — a shoot in a potometer
     stomata per mm², upper/lower surface (Weiss, as tabulated in school texts); gmax mol/m²/s for water vapour
     ============================================================ */
  const PLANTS = {
    sunflower: { name: 'Sunflower', up: 85, low: 156, gmax: 0.80, w: 0.10 },
    bean: { name: 'Bean', up: 40, low: 281, gmax: 0.55, w: 0.07 },
    oak: { name: 'Oak', up: 0, low: 450, gmax: 0.30, w: 0.06 },
    maize: { name: 'Maize', up: 52, low: 68, gmax: 0.35, w: 0.06 }
  };
  const PAIR = 101325;
  /* a 100 W lamp gives 1,200 µmol of light a square metre a second at 15 cm; it spreads as the square of the distance */
  const lightOf = p => p.lamp ? Math.min(2400, 1200 * Math.pow(15 / p.lampD, 2)) : 0;
  function leafOf(p, rhAir) {
    const P = PLANTS[p.plant], up = P.up / (P.up + P.low);
    const cover = { none: [1, 1], upper: [0, 1], lower: [1, 0], both: [0, 0] }[p.vas];
    const share = up * cover[0] + (1 - up) * cover[1];
    const I = lightOf(p), fl = Math.min(1, I / (I + 200) * 1.2);
    const ea = (rhAir == null ? p.rh : rhAir) / 100 * es(p.airT);
    const gb = 0.147 * Math.sqrt(Math.max(0.15, p.wind) / P.w) * 2;   // mol/m²/s, both sides (Campbell & Norman)
    const Rabs = 0.5 * I / 2.0 * 0.85 + 30;                // W/m², light absorbed (≈2 µmol of PAR per joule of sunlight) plus the room's heat
    let Tl = p.airT, gs = 0, E = 0;
    for (let k = 0; k < 30; k++) {
      const D = Math.max(0, es(Tl) - ea) / 1000;                 // kPa at the leaf
      gs = P.gmax * Math.max(0.03, share * fl / (1 + D / 1.6)) + P.gmax * 0.02;   // Jarvis: light opens, dry air closes; a little through the cuticle
      const g = gs * gb / (gs + gb);
      E = g * Math.max(0, es(Tl) - ea) / PAIR;                   // mol/m²/s
      const gH = gb * 0.92;                                      // the boundary layer for heat
      const Tn = p.airT + (Rabs - latent(Tl) * E * 0.018015 - 4 * 0.97 * 5.67e-8 * Math.pow(p.airT + 273.15, 3) * 0) / (29.3 * gH + 4 * 0.97 * 5.67e-8 * Math.pow(p.airT + 273.15, 3) * 2);
      Tl = Tl + (Tn - Tl) * 0.5;
    }
    const open = (gs - P.gmax * 0.02) / P.gmax;
    return { E, gs, gb, Tl, open: clamp(open, 0, 1), vpd: Math.max(0, es(Tl) - ea) / 1000, share };
  }
  const CAP = { len: 0.25 };                                    // m of capillary on the scale
  function potStart(p) { return { t: 0, x: 0, resets: 0, rh: p.rh, up: 0, hist: [] }; }
  function potStep(Pt, p, dt) {
    const n = Math.max(1, Math.ceil(dt / 2)), h = dt / n, area = p.area / 1e4, A = Math.PI * Math.pow(p.bore / 1000, 2);
    for (let k = 0; k < n; k++) {
      const Lf = leafOf(p, p.bag ? Pt.rh : null), Q = Lf.E * area * 18.015e-6;   // m³/s of water (1 g = 1 mL)
      Pt.x += Q / A * h; Pt.up += Q * 1e6 * h;
      if (Pt.x > CAP.len) { Pt.x -= CAP.len; Pt.resets++; }
      if (p.bag) {                                              // a polythene bag of 3 L round the shoot: the air inside dampens
        const Vb = 0.003, rho = Pt.rh / 100 * rhoSat(p.airT) + Q * 1e6 / Vb * h, leak = (Pt.rh - p.rh) / 100 * rhoSat(p.airT) * h / 900;
        Pt.rh = clamp((rho - leak) / rhoSat(p.airT) * 100, 0, 100);
      }
      Pt.t += h; Pt.Q = Q; Pt.L = Lf;
    }
    return Pt;
  }
  const bubbleSpeed = p => { const Lf = leafOf(p); return Lf.E * p.area / 1e4 * 18.015e-6 / (Math.PI * Math.pow(p.bore / 1000, 2)) * 1000 * 60; };   // mm/min

  /* ============================================================
     DRIVERS — the world's water as boxes (thousand km³; fluxes thousand km³ a year, Trenberth et al. 2007)
     ============================================================ */
  const W0 = { ocean: 1338000, air: 12.9, soil: 16.5, surf: 104.6, gw: 10530, ice: 24064 };
  const FL0 = { Eo: 413, ETbare: 28.5, ETplant: 44.5, Pland: 113 / 486, snow: 2.5 / 486, run: 24.8, rech: 12.7, ice: 2.5 };
  const TAU_AIR = W0.air / 486;                                 // years: 9.7 days
  function worldStart() { return Object.assign({ t: 0, cumE: 0, cumP: 0 }, W0); }
  function worldRates(W, o) {
    const sun = o.sun, g = o.grav, pl = o.plants;
    const wet = Math.pow(clamp(W.soil / W0.soil, 0, 3), 0.7);   // a drier soil gives up its water less readily
    const Eo = FL0.Eo * sun;                                     // energy-limited: evaporation follows the sunlight
    const ET = (FL0.ETbare + FL0.ETplant * pl) * sun * wet;
    const P = g > 0 ? W.air * Math.sqrt(g) / TAU_AIR : 0;        // drops fall at a speed that grows as √g; none fall with no gravity
    const Pl = P * FL0.Pland, Po = P - Pl, Pice = P * FL0.snow;
    const drain = (FL0.run + FL0.rech) / W0.soil * W.soil * g;  // water seeps and runs downhill: Darcy and Manning both need gravity
    const run = drain * FL0.run / (FL0.run + FL0.rech), rech = drain - run;
    const base = W.gw * g * FL0.rech / W0.gw;                    // springs and seepage feed the rivers
    const river = W.surf * Math.sqrt(g) * (FL0.run + FL0.rech) / W0.surf;   // rivers flow downhill to the sea: 37.5 + 2.5 of ice = 40 back
    const iceOut = (W.ice * FL0.ice / W0.ice) * (0.5 * g + 0.5 * sun);       // glaciers flow (gravity) and melt (sunlight)
    return { Eo, ET, P, Pl, Po, Pice, run, rech, base, river, iceOut, energy: (Eo + ET) * 1e15 * latent(15) / (3.156e7 * 5.101e14) };
  }
  function worldStep(W, o, dtYears) {
    const n = Math.max(1, Math.ceil(dtYears / (TAU_AIR / 4))), h = dtYears / n;
    for (let k = 0; k < n; k++) {
      const R = worldRates(W, o);
      W.air += (R.Eo + R.ET - R.P) * h;
      W.soil += (R.Pl - R.Pice - R.ET - R.run - R.rech) * h;
      W.surf += (R.run + R.base - R.river) * h;
      W.gw += (R.rech - R.base) * h;
      W.ice += (R.Pice - R.iceOut) * h;
      W.ocean += (R.Po + R.river + R.iceOut - R.Eo) * h;
      ['air', 'soil', 'surf', 'gw', 'ice'].forEach(k2 => { if (W[k2] < 0) W[k2] = 0; });
      W.cumE += (R.Eo + R.ET) * h; W.cumP += R.P * h; W.t += h;
    }
    return W;
  }

  /* ============================================================
     RESIDENCE — dye in a lake (volume km³, retention years: published)
     ============================================================ */
  /* V km³ and the hydraulic retention time τ = V ÷ outflow, years, as the lakes' agencies publish them (US EPA Great Lakes
     Atlas; CIPEL; UC Davis TERC); A km² of surface; e, m of water evaporated from it a year */
  const LAKES = {
    erie: { name: 'Lake Erie', V: 484, tau: 2.6, A: 25700, e: 0.9 },
    ontario: { name: 'Lake Ontario', V: 1640, tau: 6, A: 18960, e: 0.75 },
    geneva: { name: 'Lake Geneva', V: 89, tau: 11.4, A: 580, e: 0.6 },
    michigan: { name: 'Lake Michigan', V: 4920, tau: 99, A: 57800, e: 0.65 },
    superior: { name: 'Lake Superior', V: 12100, tau: 191, A: 82100, e: 0.6 },
    tahoe: { name: 'Lake Tahoe', V: 150.7, tau: 650, A: 490, e: 1.1 }
  };
  function lakeOf(p) {
    const Lk = LAKES[p.lake], out0 = Lk.V / Lk.tau, evap = Lk.A * Lk.e / 1000;   // km³ a year
    const inflow = (out0 + evap) * p.inflow / 100;               // rivers and rain on the lake; the student scales it
    const out = p.closed ? 0 : Math.max(0, inflow - evap);       // the outlet passes whatever the lake does not evaporate
    const lost = out + (p.closed ? inflow : Math.min(evap, inflow));
    return { Lk, inflow, evap: p.closed ? inflow : Math.min(evap, inflow), out, out0, tauDye: out > 0 ? Lk.V / out : Infinity, tauWater: lost > 0 ? Lk.V / lost : Infinity };
  }
  function lakeStart(p) { return { t: 0, C: 100, salt: 1, hist: [] }; }
  function lakeStep(Lw, p, years) {
    const o = lakeOf(p);
    Lw.C *= Math.exp(-years * o.out / o.Lk.V);                   // the dye leaves only with the outflow: evaporation leaves it behind
    Lw.salt += years * o.inflow * 1 / o.Lk.V - years * o.out / o.Lk.V * Lw.salt;   // river water carries salt 1 (relative); only the outflow takes any away
    Lw.t += years;
    return Lw;
  }

  /* ============================================================
     THE LAB — set-ups, the clock, the stage
     ============================================================ */
  const SETUPS = [
    { value: 'reservoirs', label: 'All the water on Earth, in one bottle', teaches: ['D1.1'] },
    { value: 'evaporate', label: 'Rain in a box: evaporation and condensation', teaches: ['D1.2'] },
    { value: 'rain', label: 'The rainfall simulator: soak in or run off?', teaches: ['D1.3'] },
    { value: 'transpire', label: 'The potometer: how fast a plant drinks', teaches: ['D1.4'] },
    { value: 'drivers', label: 'Switch off the Sun, then gravity', teaches: ['D1.5', 'D1.6'] },
    { value: 'residence', label: 'Dye a lake: how long does water stay?', teaches: ['D1.6'] }
  ];
  const BASE = {
    setup: 'reservoirs', bottleL: 1, view: 'all', melt: 0,
    power: 40, dish: 15, salt: 0, lid: 'ice', lidT: 0, room: 20, roomRH: 50, fan: 0, evLapse: 300, evView: 'bars',
    rate: 40, dur: 30, soil: 'loam', wet: 30, cover: 'bare', rough: 8, slope: 5, rnLapse: 60,
    plant: 'sunflower', area: 150, vas: 'none', lamp: true, lampD: 30, airT: 25, rh: 50, wind: 0.3, bag: false, bore: 0.75, side: 'lower', tpLapse: 60,
    sun: 100, grav: 1, plants: 100, drLapse: 7,
    lake: 'erie', inflow: 100, closed: false, lkLapse: 1
  };
  const preset = o => Object.assign({}, BASE, o);
  const worldOpts = p => ({ sun: p.sun / 100, grav: p.grav, plants: p.plants / 100 });
  const HOMES = {
    reservoirs: { theta: -1.82, phi: 0.34, dist: 1.05, target: [0.04, 0, 0.11] },
    evaporate: { theta: -1.92, phi: 0.40, dist: 1.12, target: [0.07, 0, 0.2] },
    rain: { theta: -2.02, phi: 0.36, dist: 1.75, target: [0.12, 0, 0.45] },
    transpire: { theta: -1.80, phi: 0.48, dist: 0.78, target: [-0.02, 0, 0.2] },
    drivers: { theta: -1.92, phi: 0.62, dist: 33, target: [0, 0, 0.4] },
    residence: { theta: -2.08, phi: 0.70, dist: 30, target: [0, 0, 0] }
  };
  function homeFor(su, narrow) { const h = HOMES[su]; return narrow ? Object.assign({}, h, { dist: h.dist * 1.3 }) : h; }

  function setup(S) {
    const p = S.p, home = homeFor(p.setup, !!S._narrow);
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera(Object.assign({ fov: 0.9 }, home, { target: home.target.slice() }));
      S.cam.minDist = home.dist * 0.45; S.cam.maxDist = home.dist * 2.6; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
    S.ta = 0; S.cardOpen = S.cardOpen == null ? null : S.cardOpen;
    if (p.setup === 'evaporate') { S.ch = chamberStart(p); S.hist = [[0, 0, 0, p.roomRH]]; }
    if (p.setup === 'rain') { S.tr = trayStart(p); S.hist = [[0, 0, 0, 0]]; }
    if (p.setup === 'transpire') { S.pt = potStart(p); S.hist = [[0, 0]]; }
    if (p.setup === 'drivers') { S.w = worldStart(); S.hist = [[0, 1, 1, 1, 1]]; }
    if (p.setup === 'residence') { S.lk = lakeStart(p); S.hist = [[0, 100, 1]]; }
  }
  function step(S, dt) {
    const p = S.p;
    S.ta += dt;
    if (p.setup === 'evaporate') {
      chamberStep(S.ch, p, dt * p.evLapse);
      const C = S.ch; if (C.t - S.hist[S.hist.length - 1][0] * 60 >= 20) S.hist.push([C.t / 60, C.evap, C.drip, rhOf(C)]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'rain') {
      const T = S.tr; if (T.t < 180 * 60) trayStep(T, p, dt * p.rnLapse);
      if (T.t / 60 - S.hist[S.hist.length - 1][0] >= 0.25) S.hist.push([T.t / 60, T.t <= p.dur * 60 ? p.rate : 0, T.f, T.q]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'transpire') {
      const Pt = S.pt; potStep(Pt, p, dt * p.tpLapse);
      if (Pt.t - S.hist[S.hist.length - 1][0] * 60 >= 10) S.hist.push([Pt.t / 60, (Pt.resets * CAP.len + Pt.x) * 1000]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'drivers') {
      const W = S.w; if (W.t < 60) worldStep(W, worldOpts(p), dt * p.drLapse / 365.25);
      const last = S.hist[S.hist.length - 1][0];
      if (W.t - last >= Math.max(0.002, p.drLapse / 365.25 / 8)) S.hist.push([W.t, W.air / W0.air, W.soil / W0.soil, W.surf / W0.surf, W.gw / W0.gw]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    } else if (p.setup === 'residence') {
      const Lw = S.lk; if (Lw.t < 5000) lakeStep(Lw, p, dt * p.lkLapse);
      if (Lw.t - S.hist[S.hist.length - 1][0] >= p.lkLapse / 8) S.hist.push([Lw.t, Lw.C, Lw.salt]);
      while (S.hist.length > 900) S.hist.splice(1, 1);
    }
  }

  /* ---------------- shared drawing helpers ---------------- */
  const mono = (px, w) => (w || 500) + ' ' + px + 'px "IBM Plex Mono",monospace';
  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  const fmtN = (v, d) => (+v).toLocaleString('en', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  const sig = (v, n) => { if (!isFinite(v)) return '∞'; if (v === 0) return '0'; const d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(Math.abs(v)))); return fmtN(v, Math.min(d, 6)); };
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const ageSay = y => y < 1 / 52 ? (y * 365.25).toFixed(1) + ' days' : y < 0.25 ? (y * 52.18).toFixed(1) + ' weeks' : y < 2 ? (y * 12).toFixed(1) + ' months' : y < 1000 ? sig(y, 3) + ' years' : fmtN(y) + ' years';
  /* keep the scene where the stage has room for it: the home target shifted by (fx·W, fy) on screen */
  function placeView(S, g, fx, fy) {
    const cam = S.cam, k = cam.dist / cam._k, sx = -fx * g.w * k, sy = fy * k, h = HOMES[S.p.setup].target;
    cam.target = [h[0] + cam.r[0] * sx + cam.u[0] * sy, h[1] + cam.r[1] * sx + cam.u[1] * sy, h[2] + cam.r[2] * sx + cam.u[2] * sy];
    cam.update();
  }
  function room(g) {
    const ctx = g.ctx, gr = ctx.createLinearGradient(0, 0, 0, g.h);
    gr.addColorStop(0, '#1B2230'); gr.addColorStop(0.55, '#141A25'); gr.addColorStop(1, '#0C1018');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, g.w, g.h);
  }
  /* leader-line labels: each name goes on the side of its leader that has room, never under the header or a card */
  function drawLabels(g, cam, lab, xMax) {
    if (!g.labels) return;
    const ctx = g.ctx, K = kit(), boxes = [], narrow = g.w < K.NARROW;
    (narrow ? lab.slice(0, 3) : lab).forEach(([at, text, dx, dy, col]) => {
      const q = cam.project(at); if (!q.ok) return;
      const ey = clamp(q.y + dy * (narrow ? 0.6 : 1), K.HDR + (narrow ? 40 : 14), g.h - 34), ex = q.x + dx * (narrow ? 0.6 : 1);
      if (q.x < 4 || q.x > xMax) return;
      ctx.save(); ctx.font = mono(9.5, 600);
      const tw = ctx.measureText(text).width; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > xMax - 4) left = true;
      const room2 = left ? ex - 9 : xMax - 6 - ex - 3, t = K.fitText(ctx, text, Math.max(40, room2)), w2 = ctx.measureText(t).width;
      const bx0 = left ? ex - 3 - w2 : ex + 3; let yy = ey;
      for (let k = 0; k < 6 && boxes.some(b => bx0 < b[2] && bx0 + w2 > b[0] && Math.abs(yy - b[1]) < 12); k++) yy += 13;
      boxes.push([bx0, yy, bx0 + w2]);
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, yy); ctx.stroke();
      ctx.fillStyle = 'rgba(210,222,240,.9)'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, TAU); ctx.fill();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.88)';
      ctx.strokeText(t, ex + (left ? -3 : 3), yy); ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), yy); ctx.restore();
    });
  }
  /* a card of rows: [label, value, colour]; returns its height */
  function cardRows(g, x, y, w, title, rows, o) {
    o = o || {};
    const ctx = g.ctx, K = kit(), lh = 15, h = 26 + rows.length * lh + (o.foot ? 26 : 6);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(K.fitText(ctx, title, w - 16), x + 9, y + 13);
    rows.forEach((r, i) => {
      const yy = y + 30 + i * lh;
      ctx.font = mono(9.5); ctx.fillStyle = r[3] ? '#8C9AB6' : '#C9D4EA'; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], w * 0.62), x + 9, yy);
      ctx.font = mono(9.5, 600); ctx.fillStyle = r[2] || '#F2F6FF'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, r[1], w * 0.36), x + w - 9, yy);
    });
    if (o.foot) { ctx.font = mono(8.5); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; K.wrapText(ctx, o.foot, x + 9, y + h - 20, w - 18, 11, 2); }
    ctx.restore();
    return h;
  }
  const CAPS = [[5, 0.1, 0.5, 1], [10, 0.2, 1, 2], [25, 0.5, 2.5, 5], [50, 1, 5, 10], [100, 1, 10, 20], [250, 5, 25, 50], [500, 5, 50, 100], [1000, 10, 100, 200], [2000, 20, 200, 400], [5000, 50, 500, 1000], [10000, 100, 1000, 2000]];
  function cylFor(mL) {
    const c = CAPS.find(k => k[0] >= mL) || CAPS[CAPS.length - 1];
    return { cap: c[0], div: c[1], mid: c[2], big: c[3], d: 0.062 * Math.cbrt(c[0] / 1000) };
  }

  /* ---------------- reservoirs ---------------- */
  const RCOL = { ocean: '#2F7FC8', ice: '#D8ECF8', gwSalt: '#6F8A86', gwFresh: '#8FC0D8', permafrost: '#B8D4E0', lakeFresh: '#58B8D8', lakeSalt: '#7AA8A0', soil: '#9A7A58', air: '#C8DCF2', swamp: '#6A9070', river: '#4FA8E8', life: '#78C060' };
  const RSHORT = { ocean: 'oceans', ice: 'ice and snow', gwSalt: 'salty groundwater', gwFresh: 'fresh groundwater', permafrost: 'ground ice', lakeFresh: 'fresh lakes', lakeSalt: 'salt lakes', soil: 'soil', air: 'the air', swamp: 'swamps', river: 'rivers', life: 'living things' };
  function benchReservoirs(S, F, lab) {
    const p = S.p, B = bottle(p), items = RES.filter(r => B.mL[r.k] > 0).map(r => ({ k: r.k, mL: B.mL[r.k] })).sort((a, b) => b.mL - a.mL);
    MEAS.bench(F, -0.55, 0.55, -0.3, 0.3, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.55, 0.55, 0.3, 0, 0.6);
    const cyl = items.filter(it => it.mL >= 2), drops = items.filter(it => it.mL < 2 && it.mL / DROP >= 0.0005);
    let x = -0.33;
    cyl.forEach((it, i) => {
      const G = cylFor(it.mL), r = G.d / 2;
      x += r * 2.6 + (i ? 0.02 : 0);
      const tint = it.k === 'ocean' || it.k === 'gwSalt' ? '#6FA9D8' : it.k === 'ice' ? '#E6F2FA' : '#A9D6EE';
      const C = MEAS.gradCylinder(F, [x, 0.02, 0], G, it.mL, { tint, font: i ? 7 : 8 });
      if (it.k === 'ice') {                                     // the ice is drawn frozen: crushed ice up to its level
        const rr = G3.rng(5);
        for (let k = 0; k < 14; k++) { const z = C.z0 + rr() * (C.zOf(it.mL) - C.z0) * 0.95, a = rr() * TAU, dd = r * 0.5 * rr(); R3.box(F, [x + Math.cos(a) * dd, 0.02 + Math.sin(a) * dd, z], [r * 0.5, r * 0.5, Math.min(r * 0.5, (C.zOf(it.mL) - C.z0) * 0.3)], '#F2FAFF', { shadow: false, ambient: 0.7 }); }
        S._iceAt = [x, 0.02, C.zOf(it.mL)];
      }
      lab.push([[x, 0.02 - r, C.zOf(it.mL) * 0.6], RSHORT[it.k] + ' · ' + sig(it.mL, 3) + ' mL', i % 2 ? 30 : -30, -40 - (i % 3) * 18]);
      x += r * 0.4;
    });
    if (!cyl.some(it => it.k === 'ice')) S._iceAt = null;
    if (drops.length) {
      const sp = G3.spotPlate(F, [0.18, -0.16, 0], drops.map(it => ({ drops: it.mL / DROP })));
      drops.forEach((it, i) => lab.push([[sp.x0 + (i + 0.5) * sp.pitch, -0.16, 0.016], RSHORT[it.k] + ' · ' + (it.mL / DROP >= 1 ? sig(it.mL / DROP, 2) + ' drops' : sig(it.mL / DROP, 1) + ' of a drop'), (i - drops.length / 2) * 22, 34 + (i % 2) * 16]));
      MEAS.washBottle(F, [0.42, -0.06, 0]);
    }
  }
  function drawReservoirs(S, g, F) {
    const p = S.p, B = bottle(p), K = kit(), W = g.w, narrow = W < K.NARROW;
    const at = K.cardSlot(g, S, 'where the water is', 268, { x: W - 278, y: K.HDR + 6 });
    if (at) {
      const list = RES.filter(r => B.mL[r.k] > 0).sort((a, b) => B.mL[b.k] - B.mL[a.k]);
      const tot = p.view === 'fresh' ? B.base : TOTAL;
      cardRows(g, at.x, at.y, at.w, (p.view === 'fresh' ? 'Fresh water only' : 'All of Earth’s water') + ' in ' + p.bottleL + ' L', list.map(r => [RSHORT[r.k], B.mL[r.k] >= 2 ? sig(B.mL[r.k], 3) + ' mL' : sig(B.mL[r.k] / DROP, 2) + ' drops', RCOL[r.k], r.salt]),
        { foot: p.view === 'fresh' ? 'Of the fresh water, ' + (B.km3.ice / tot * 100).toFixed(1) + ' % is ice and ' + (B.km3.gwFresh / tot * 100).toFixed(1) + ' % is underground.' : 'Only ' + B.freshPct.toFixed(1) + ' % of it is fresh — and most of that is frozen.' });
    }
    if (p.melt > 0 && !narrow) G3.tag(g.ctx, 14, g.h - 46, 'Ice melted into the ocean: the sea rises ' + B.rise.toFixed(1) + ' m', '#9FD4FF');
  }

  /* ---------------- evaporate ---------------- */
  const BOX = { w: 0.6, d: 0.3, h: 0.4 };
  function benchEvaporate(S, F, lab, g) {
    const p = S.p, C = S.ch, R = chamberRates(C, p);
    MEAS.bench(F, -0.6, 0.72, -0.34, 0.32, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.6, 0.72, 0.32, 0, 0.75);
    const Bx = G3.chamber(F, [0, 0, 0], [BOX.w, BOX.d, BOX.h], { mist: clamp(C.wall / (CH.Awall * 12), 0, 1) });
    // the hot plate and the dish of water on it
    const hp = MEAS.hotplate(F, [-0.15, -0.01, 0], { top: C.Tw, set: p.power / 80, on: p.power > 0, hot: C.Tw > 45 });
    S._knob = hp.knob;
    const r = p.dish / 200, lvl = 0.032 * C.dishM / 300;
    const tint = p.salt > 100 ? '#D6E6EC' : '#BFE0F2';
    MEAS.beaker(F, [-0.15, -0.01, hp.topZ], r, 0.05, Math.max(0.0005, lvl), { tint, T: C.Tw, boil: C.Tw >= 99.9 ? 1 : 0, bubbles: C.Tw > 85 });
    if (R.E > 0.001) MEAS.steam(F, [-0.15, -0.01, hp.topZ + 0.05], clamp(R.E * 1.5, 0.05, 1), S.ta);
    // the lid, its ice, and the gutter that drains it to a cylinder outside
    let L = null;
    if (p.lid !== 'open') L = G3.lid(F, Bx, BOX.h + 0.03, BOX.h + 0.005, { ice: p.lid === 'ice', film: clamp(C.film / (CH.film * CH.Alid), 0, 1), melt: clamp(S.ta / 600, 0, 1), warm: p.lidT > 4 });
    const cyl = { cap: 25, div: 0.5, mid: 2.5, big: 5, d: 0.019 };
    const cylAt = [0.42, -0.02, 0];
    const Cy = MEAS.gradCylinder(F, cylAt, cyl, Math.min(cyl.cap, C.drip), { tint: '#CFE8F6', font: 7 });
    if (p.lid !== 'open') {
      const zG = BOX.h - 0.006, pipe = [[0.29, -0.02, zG], [0.36, -0.02, zG - 0.02], [0.42, -0.02, Cy.topZ + 0.035], [0.42, -0.02, Cy.topZ + 0.01]];
      G3.glassTube(F, pipe, 0.004, { fill: C.drip > 0 ? [{ from: 0, to: 1, col: 'rgba(150,200,235,.35)' }] : [] });
      HYDRO.cone(F, [0.42, -0.02, Cy.topZ + 0.005], 0.022, -0.03, '#D8E4EC', { segments: 20 });
    }
    // the fan, inside at the far end, blowing across the dish
    G3.fan(F, [-0.26, 0.06, 0], [1, -0.25, 0], p.fan, S.ta * p.fan * 25, { R: 0.055, h: 0.11 });
    // a cloud of drops, when the air holds more than it can
    G3.fog(F, Bx, (C.fog / CH.V) / 2.5, S.ta, { r: 0.06 });
    // the digital hygrometer and thermometer, reading the chamber's air
    BENCH.meter(F, [0.08, -0.22, 0.05], [0, -1, 0.35], 0.09, 0.045, { title: 'RH  air', value: rhOf(C).toFixed(0), unit: '%', colour: '#7CF0B0' });
    BENCH.meter(F, [0.22, -0.22, 0.05], [0, -1, 0.35], 0.09, 0.045, { title: 'water', value: C.Tw.toFixed(1), unit: '°C', colour: '#FFC56B' });
    R3.tube(F, [[0.08, -0.2, 0.07], [0.08, -0.16, 0.2], [0.06, -0.1, 0.2]], 0.002, '#2A2E36', { shadow: false });
    lab.push([[-0.15, -0.01 - r, hp.topZ + lvl], 'dish of ' + (p.salt > 0 ? 'salt water, ' + (C.salt / Math.max(1, C.dishM) * 1000).toFixed(0) + ' g/kg' : 'water') + ' · ' + C.dishM.toFixed(0) + ' g', -50, -70]);
    lab.push([[-0.15, -0.12, 0.06], 'hot plate · ' + p.power + ' W', -40, 40]);
    if (p.lid === 'ice') lab.push([[0.12, -0.1, BOX.h + 0.03], 'tray of ice on the lid · ' + p.lidT + ' °C', 30, -46]);
    else if (p.lid === 'glass') lab.push([[0.12, -0.1, BOX.h + 0.02], 'glass lid at room temperature', 30, -46]);
    else lab.push([[0.12, -0.1, BOX.h], 'no lid: open to the room', 30, -46]);
    lab.push([[0.42, -0.03, Cy.zOf(Math.min(cyl.cap, C.drip))], 'collected · ' + C.drip.toFixed(1) + ' mL', 34, 24]);
    if (C.fog > 0.005) lab.push([[0.05, 0.05, 0.3], 'a cloud: drops of liquid, ' + (C.fog / CH.V).toFixed(2) + ' g/m³', 40, -70]);
    if (p.fan > 0) lab.push([[-0.26, 0.06, 0.12], 'fan · ' + p.fan.toFixed(1) + ' m/s', -30, -50]);
    void g;
  }
  function drawEvapCard(S, g) {
    const p = S.p, C = S.ch, K = kit(), W = g.w;
    const at = K.cardSlot(g, S, p.evView === 'molecules' ? 'at the surface' : 'where the vapour goes', 262, { x: W - 272, y: K.HDR + 6 });
    if (!at) return;
    if (p.evView === 'molecules') return moleculeCard(S, g, at.x, at.y, at.w);
    const ctx = g.ctx, x = at.x, y = at.y, w = at.w, h = 196;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('Vapour in the air, g per m³', x + 9, y + 13);
    // three columns: what the warm water's surface holds, what the air holds, what the cold lid allows
    const Sg = C.salt / Math.max(1, C.dishM) * 1000;
    const cols = [['at the water', aw(Sg) * rhoSat(C.Tw), '#FFC56B', C.Tw], ['in the air', C.rv, '#7CF0B0', C.Ta], [p.lid === 'ice' ? 'at the cold lid' : p.lid === 'glass' ? 'at the lid' : 'in the room', p.lid === 'open' ? p.roomRH / 100 * rhoSat(p.room) : rhoSat(C.Tl), '#8FC8FF', p.lid === 'open' ? p.room : C.Tl]];
    const top = Math.max(20, ...cols.map(c => c[1])), bx = x + 20, bw = (w - 40) / 3, by0 = y + h - 40, bh = h - 86;
    cols.forEach((c, i) => {
      const hh = bh * c[1] / top, xx = bx + i * bw + bw * 0.22;
      const gr = ctx.createLinearGradient(0, by0 - hh, 0, by0); gr.addColorStop(0, c[2]); gr.addColorStop(1, RX.mix(c[2], '#0A0F18', 0.55));
      ctx.fillStyle = gr; ctx.fillRect(xx, by0 - hh, bw * 0.56, hh);
      ctx.fillStyle = '#F2F6FF'; ctx.font = mono(9.5, 600); ctx.textAlign = 'center'; ctx.fillText(c[1].toFixed(1), xx + bw * 0.28, by0 - hh - 8);
      ctx.fillStyle = '#C9D4EA'; ctx.font = mono(8.5); ctx.fillText(c[0], xx + bw * 0.28, by0 + 11); ctx.fillStyle = '#8C9AB6'; ctx.fillText(c[3].toFixed(1) + ' °C', xx + bw * 0.28, by0 + 23);
    });
    // arrows: vapour moves from more to less
    const arrow = (i, j) => { const a = cols[i][1], b = cols[j][1]; if (Math.abs(a - b) < 0.05) return; const x0 = bx + (i + 0.78) * bw, x1 = bx + (j + 0.22) * bw, yy = y + 44; ctx.strokeStyle = '#E6EEF8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a > b ? x0 : x1, yy); ctx.lineTo(a > b ? x1 : x0, yy); ctx.stroke(); const xe = a > b ? x1 : x0, s = a > b ? 1 : -1; ctx.beginPath(); ctx.moveTo(xe, yy); ctx.lineTo(xe - s * 6, yy - 4); ctx.lineTo(xe - s * 6, yy + 4); ctx.closePath(); ctx.fillStyle = '#E6EEF8'; ctx.fill(); };
    arrow(0, 1); arrow(1, 2);
    ctx.restore();
    return h;
  }

  /* the water's surface, a few nanometres of it: molecules leave at a rate set by the water's temperature (the
     vapour its surface holds) and come back at a rate set by the vapour in the air; evaporation is the difference */
  function moleculeCard(S, g, x, y, w) {
    const p = S.p, C = S.ch, K = kit(), ctx = g.ctx, h = 214, Sg = C.salt / Math.max(1, C.dishM) * 1000;
    const out = aw(Sg) * rhoSat(C.Tw), back = C.rv, top = Math.max(30, out);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('Molecules at the water’s surface', x + 9, y + 13);
    const bx = x + 10, by = y + 26, bw = w - 20, bh = 140, sy = by + bh * 0.62;
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    const sky = ctx.createLinearGradient(0, by, 0, sy); sky.addColorStop(0, '#0E1726'); sky.addColorStop(1, '#16243A'); ctx.fillStyle = sky; ctx.fillRect(bx, by, bw, sy - by);
    const wat = ctx.createLinearGradient(0, sy, 0, by + bh); wat.addColorStop(0, '#1F5C8C'); wat.addColorStop(1, '#0E2E4E'); ctx.fillStyle = wat; ctx.fillRect(bx, sy, bw, by + bh - sy);
    const t = S.ta, mol = (mx, my, a) => { ctx.globalAlpha = a; ctx.fillStyle = '#E8F2FF'; ctx.beginPath(); ctx.arc(mx, my, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#FF7A7A'; ctx.beginPath(); ctx.arc(mx - 2.4, my + 1.6, 1.4, 0, TAU); ctx.arc(mx + 2.4, my + 1.6, 1.4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; };
    const jig = 0.6 + 0.02 * C.Tw;                                // warmer water jiggles harder
    for (let i = 0; i < 70; i++) { const u = hash2(i, 1, 3), v = hash2(i, 2, 3); mol(bx + 4 + u * (bw - 8) + Math.sin(t * 6 * jig + i) * 2 * jig, sy + 6 + v * (by + bh - sy - 10) + Math.cos(t * 5 * jig + i * 1.3) * 2 * jig, 0.85); }
    const nv = Math.round(clamp(back / top * 26, 0, 40));
    for (let i = 0; i < nv; i++) { const u = hash2(i, 5, 1), sp = 0.08 + 0.1 * hash2(i, 6, 1), ph = (hash2(i, 7, 1) + t * sp) % 1; mol(bx + 4 + ((u + t * 0.03 * (hash2(i, 8, 1) - 0.5)) % 1 + 1) % 1 * (bw - 8), by + 4 + Math.abs(((ph * 2) % 2) - 1) * (sy - by - 10), 0.9); }
    // escapers and returners, as arrows across the surface
    const nOut = Math.round(clamp(out / top * 9, 0, 9)), nBack = Math.round(clamp(back / top * 9, 0, 9));
    ctx.lineWidth = 1.6;
    for (let i = 0; i < nOut; i++) { const xx = bx + 14 + i * (bw / 2 - 20) / 9; ctx.strokeStyle = '#FFC56B'; ctx.beginPath(); ctx.moveTo(xx, sy + 6); ctx.lineTo(xx, sy - 22); ctx.lineTo(xx - 3, sy - 16); ctx.moveTo(xx, sy - 22); ctx.lineTo(xx + 3, sy - 16); ctx.stroke(); }
    for (let i = 0; i < nBack; i++) { const xx = bx + bw / 2 + 10 + i * (bw / 2 - 20) / 9; ctx.strokeStyle = '#7CF0B0'; ctx.beginPath(); ctx.moveTo(xx, sy - 22); ctx.lineTo(xx, sy + 6); ctx.lineTo(xx - 3, sy); ctx.moveTo(xx, sy + 6); ctx.lineTo(xx + 3, sy); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.font = mono(9); ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFC56B'; ctx.fillText('leaving ∝ ' + out.toFixed(1) + ' g/m³ (' + C.Tw.toFixed(0) + ' °C water)', x + 9, y + h - 34);
    ctx.fillStyle = '#7CF0B0'; ctx.fillText('returning ∝ ' + back.toFixed(1) + ' g/m³ in the air', x + 9, y + h - 21);
    ctx.fillStyle = '#F2F6FF'; ctx.font = mono(9, 600); ctx.fillText(out > back ? 'more leave than return: evaporation' : out < back ? 'more return than leave: condensation' : 'as many return as leave: saturated', x + 9, y + h - 8);
    ctx.restore();
    return h;
  }

  /* ---------------- rain ---------------- */
  const RIG = { x0: -0.30, x1: 0.30, y0: -0.15, y1: 0.15, zLip: 0.32, D: 0.16, zTop: 1.05 };
  function benchRain(S, F, lab) {
    const p = S.p, T = S.tr, s = soilOf(p), raining = T.t < p.dur * 60;
    F.push([0, 0, -0.001], () => {}, F.GROUND);
    MEAS.bench(F, -0.75, 0.8, -0.42, 0.42, { cabinet: false, tone: '#4A4F57' });
    const slope = p.slope * Math.PI / 180;
    const TR = G3.soilTray(F, { x0: RIG.x0, x1: RIG.x1, y0: RIG.y0, y1: RIG.y1, zLip: RIG.zLip, slope, D: RIG.D, soil: SOILS[p.soil].col, wetDepth: frontOf(T, p) / 1000, pond: T.h / 1000, cover: p.soil === 'paved' ? 'paved' : p.cover, rain: raining, t: S.ta });
    S._trayTop = TR.top;
    // the drops: Marshall–Palmer's median size, falling at the speed such a drop reaches
    const D0 = dropD0(p.rate), v = dropV(D0), drops = [];
    if (raining) {
      const n = Math.round(clamp(p.rate * 1.6, 8, 180)), rr = G3.rng(3);
      for (let i = 0; i < n; i++) {
        const x = RIG.x0 + 0.02 + rr() * (RIG.x1 - RIG.x0 - 0.04), y = RIG.y0 + 0.02 + rr() * (RIG.y1 - RIG.y0 - 0.04), zs = TR.top(x), H = RIG.zTop - 0.07 - zs;
        const ph = (S.ta * v / Math.max(0.2, H) * 0.12 + rr()) % 1, z = RIG.zTop - 0.07 - ph * H;
        drops.push([x, y, z, Math.max(zs, z - 0.012 * v)]);
      }
    }
    const noz = G3.rainRig(F, RIG.x0 - 0.06, RIG.x1 + 0.06, RIG.y0 - 0.06, RIG.y1 + 0.06, RIG.zTop, { drops, dropW: Math.max(0.0012, D0 / 1000), nozzles: 4 });
    S._valve = [RIG.x0 - 0.02, (RIG.y0 + RIG.y1) / 2 - 0.04, RIG.zTop];
    S._uphill = [RIG.x0, RIG.y0, TR.top(RIG.x0) + 0.02];
    // the runoff: off the lip into a bucket on a balance
    const bal = MEAS.balance(F, [RIG.x1 + 0.2, -0.04, 0], { text: (T.run * TRAY.L * TRAY.W).toFixed(3) + ' kg', settled: true });
    const bz = bal[2], br = 0.075, bH = 0.15, Vb = T.run * TRAY.L * TRAY.W / 1000;
    MEAS.beaker(F, [bal[0], bal[1], bz], br, bH, Math.min(bH - 0.01, Vb / (Math.PI * br * br)), { steel: true, tint: '#9FC6E0' });
    G3.stream(F, TR.spout, bz + bH * 0.6, clamp(T.q / 60, 0, 1), S.ta);
    lab.push([noz[0], 'nozzles · ' + p.rate + ' mm an hour', -40, -40]);
    lab.push([[RIG.x0 + 0.12, RIG.y0, TR.top(RIG.x0 + 0.12) - RIG.D * 0.7], (p.soil === 'paved' ? 'pavement: sealed, nothing soaks in' : SOILS[p.soil].name.toLowerCase() + ', ' + p.wet + ' % wet to start'), -60, 50]);
    if (frontOf(T, p) > 2) lab.push([[RIG.x0 + 0.2, RIG.y0, TR.top(RIG.x0 + 0.2) - frontOf(T, p) / 1000], 'wetting front · ' + (frontOf(T, p) / 10).toFixed(1) + ' cm down', -70, 30, '#9FD4FF']);
    if (T.h > 0.05) lab.push([[0.05, 0, TR.top(0.05) + 0.005], 'ponded water · ' + T.h.toFixed(1) + ' mm', 40, -60, '#9FD4FF']);
    lab.push([[bal[0], bal[1] - br, bz + 0.05], 'runoff · ' + (T.run * TRAY.L * TRAY.W).toFixed(2) + ' L', 30, 40]);
    void s;
  }
  function drawDropCard(S, g) {
    const p = S.p, K = kit(), W = g.w, at = K.cardSlot(g, S, 'the raindrops', 236, { x: W - 246, y: K.HDR + 6 });
    if (!at) return;
    const ctx = g.ctx, x = at.x, y = at.y, w = at.w, h = 150, D0 = dropD0(p.rate);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText('Drops, drawn ×6', x + 9, y + 13);
    // a cloud droplet, drizzle, this rain's median drop, a big drop: each at true relative size, with its fall speed
    const set = [['cloud', 0.02], ['drizzle', 0.4], ['this rain', D0], ['downpour', 5]];
    set.forEach((d, i) => {
      const cx = x + 28 + i * (w - 52) / 3, cy = y + 66, rp = Math.max(0.6, d[1] * 6 / 2 * 1.3);
      if (d[1] > 0) RX.ball ? RX.ball(ctx, cx, cy, rp, i === 2 ? '#6FC0FF' : '#9AC8EA', { rim: 0.6 }) : null;
      ctx.fillStyle = i === 2 ? '#FFFFFF' : '#C9D4EA'; ctx.font = mono(8.5, i === 2 ? 600 : 500); ctx.textAlign = 'center';
      ctx.fillText(d[0], cx, y + 104); ctx.fillText(d[1] < 0.1 ? '0.02 mm' : d[1].toFixed(1) + ' mm', cx, y + 117);
      const v = d[1] < 0.1 ? 0.012 : dropV(d[1]); ctx.fillStyle = '#8C9AB6'; ctx.fillText(v < 0.1 ? '1 cm/s' : v.toFixed(1) + ' m/s', cx, y + 130);
    });
    ctx.restore();
  }

  /* ---------------- transpire ---------------- */
  const POT = { sx: -0.1, base: 0.17, capZ: 0.07, cap0: -0.03 };
  function benchTranspire(S, F, lab) {
    const p = S.p, Pt = S.pt, Lf = Pt.L || leafOf(p);
    MEAS.bench(F, -0.6, 0.55, -0.32, 0.32, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.6, 0.55, 0.32, 0, 0.75);
    // the clamp stand and the glass: the shoot sealed into a tube full of water, bent down into the capillary
    BENCH.clampStand(F, [POT.sx + 0.02, 0.09, 0], 0.42);
    BENCH.bossClamp(F, [POT.sx - 0.02, 0.02, POT.base - 0.02]);
    const wet = 'rgba(150,200,235,.45)', bx = POT.cap0 + Pt.x / CAP.len * 0.25;
    const path = [[POT.sx, 0, POT.base], [POT.sx, 0, POT.capZ + 0.03], [POT.sx + 0.03, 0, POT.capZ], [POT.cap0, 0, POT.capZ], [POT.cap0 + 0.27, 0, POT.capZ]];
    const tube = G3.glassTube(F, path, 0.0045, { fill: [] });
    const sB = tube.L - 0.27 + (bx - POT.cap0) + 0.02;   // where along the glass the bubble sits
    G3.glassTube(F, path, 0.0045, { fill: [{ from: 0, to: sB - 0.004, col: wet }, { from: sB - 0.004, to: sB + 0.004, col: 'rgba(245,250,255,.95)', bubble: true }, { from: sB + 0.004, to: tube.L, col: wet }] });
    BENCH.rule(F, [POT.cap0 + 0.02, -0.022, POT.capZ - 0.015], [1, 0, 0], 0.25, { width: 0.03 });
    // the reservoir with its tap, to push the bubble back
    G3.glassTube(F, [[POT.sx + 0.015, 0, POT.capZ + 0.01], [POT.sx + 0.015, 0, POT.capZ + 0.16]], 0.008, { fill: [{ from: 0, to: 0.12, col: wet }] });
    R3.cylinder(F, [POT.sx + 0.015, -0.012, POT.capZ + 0.05], [POT.sx + 0.015, 0.012, POT.capZ + 0.05], 0.005, '#C84A2C', { shadow: false });
    R3.cylinder(F, [POT.sx, 0, POT.base - 0.006], [POT.sx, 0, POT.base + 0.012], 0.011, '#B5462E', { shadow: false });   // the rubber bung
    const leafArea = p.area / 1e4;
    const sh = G3.shoot(F, [POT.sx, 0, POT.base + 0.012], p.plant, leafArea, { H: 0.17, gloss: p.vas === 'upper' || p.vas === 'both' });
    if (p.bag) G3.bag(F, [POT.sx, 0, POT.base + 0.05], 0.13, 0.26, clamp((Pt.rh - p.rh) / Math.max(1, 100 - p.rh), 0, 1));
    // the lamp, its distance the light; the fan
    const aim = [POT.sx, 0, POT.base + 0.17], dirL = R3.norm([-0.75, -0.55, 0]), d = p.lampD / 100;
    const lp = [aim[0] + dirL[0] * d, aim[1] + dirL[1] * d, 0];
    G3.lamp(F, lp, aim, p.lamp ? clamp(lightOf(p) / 1200, 0.15, 1) : 0);
    S._lampAt = [lp[0], lp[1], 0.3]; S._lampAxis = dirL;
    G3.fan(F, [POT.sx + 0.32, 0.12, 0], [-1, -0.35, 0], p.wind, S.ta * p.wind * 25, { R: 0.06, h: 0.2 });
    lab.push([[POT.cap0 + 0.12, 0, POT.capZ], 'capillary, ' + (p.bore * 2).toFixed(1) + ' mm bore · bubble at ' + ((bx - POT.cap0) * 1000).toFixed(0) + ' mm', 40, 52]);
    lab.push([sh.tips[0], PLANTS[p.plant].name.toLowerCase() + ' shoot · ' + p.area + ' cm² of leaf', 50, -40]);
    lab.push([[POT.sx + 0.015, 0, POT.capZ + 0.15], 'reservoir and tap: resets the bubble', 60, -30]);
    lab.push([[lp[0], lp[1], 0.3], p.lamp ? 'lamp ' + p.lampD + ' cm away · ' + lightOf(p).toFixed(0) + ' µmol/m²/s' : 'lamp off: dark', -40, -40]);
    if (p.wind > 0) lab.push([[POT.sx + 0.32, 0.12, 0.22], 'fan · ' + p.wind.toFixed(1) + ' m/s', 30, -30]);
    if (p.bag) lab.push([[POT.sx + 0.1, 0, POT.base + 0.25], 'polythene bag · ' + Pt.rh.toFixed(0) + ' % humid inside', 40, -60]);
    void Lf;
  }
  function drawStomataCard(S, g) {
    const p = S.p, K = kit(), W = g.w, at = K.cardSlot(g, S, 'the leaf’s skin', 250, { x: W - 260, y: K.HDR + 6 });
    if (!at) return;
    const ctx = g.ctx, x = at.x, y = at.y, w = at.w, Lf = (S.pt && S.pt.L) || leafOf(p), Pl = PLANTS[p.plant];
    const lower = p.side === 'lower', dens = lower ? Pl.low : Pl.up, coated = p.vas === 'both' || (lower ? p.vas === 'lower' : p.vas === 'upper');
    const ih = Math.round(w * 0.62), h = ih + 58;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = g.theme.accent; ctx.textBaseline = 'middle'; ctx.fillText((lower ? 'Lower' : 'Upper') + ' surface, ×400', x + 9, y + 13); ctx.restore();
    const field = 0.35;                                          // mm across the field of view
    const n = G3.stomata(ctx, x + 8, y + 24, w - 16, ih, { density: dens, field, open: coated ? 0 : Lf.open, coated, seed: p.plant.length * 7 + (lower ? 1 : 2) });
    ctx.save(); ctx.font = mono(9); ctx.fillStyle = '#C9D4EA'; ctx.textBaseline = 'middle';
    ctx.fillText(n + ' stomata in ' + (field * field * ih / (w - 16)).toFixed(3) + ' mm² → ' + dens + ' per mm²', x + 9, y + ih + 34);
    ctx.fillStyle = coated ? '#FFC56B' : '#7CF0B0';
    ctx.fillText(coated ? 'sealed with petroleum jelly' : 'pores ' + (Lf.open * 100).toFixed(0) + ' % open', x + 9, y + ih + 48);
    ctx.restore();
  }

  /* ---------------- drivers: a landscape ---------------- */
  const TERR = () => window.TERRAIN, GEOW = () => window.GEO;
  const hash2 = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hash2(xi, yi, s) * (1 - u) + hash2(xi + 1, yi, s) * u) * (1 - v) + (hash2(xi, yi + 1, s) * (1 - u) + hash2(xi + 1, yi + 1, s) * u) * v; }
  const riverY = x => -1.6 + 1.2 * Math.sin(x * 0.45);
  let LANDB = null;
  function landBlock() {
    if (LANDB) return LANDB;
    LANDB = TERR().block({ n: 44, size: 22, zBase: -2.2, height: (x, y) => {
      if (x < -5) return -1.4 + 0.25 * (x + 11) / 6;                                // the sea floor
      const rise = 0.12 + Math.pow(Math.max(0, x + 5), 2) * 0.016 + Math.max(0, x - 4) * 0.42 * (0.7 + 0.6 * vnoise(y * 0.35, 1, 2));
      const ridge = 0.35 * vnoise(x * 0.5, y * 0.5, 4) * Math.min(1, Math.max(0, x + 5) / 4);
      const river = Math.exp(-Math.pow((y - riverY(x)) / 0.55, 2)) * Math.min(0.5, 0.08 + Math.max(0, x) * 0.06);
      const lake = 0.55 * Math.exp(-(Math.pow(x - 1.5, 2) + Math.pow(y - 3.2, 2)) / 2.2);
      return rise + ridge - river - lake + (x < -4.4 ? (x + 4.4) * 0.5 : 0);
    } });
    return LANDB;
  }
  function drawDrivers(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TERR(), GX = GEOW(), W = g.w, narrow = W < K.NARROW;
    const Wd = S.w, R = worldRates(Wd, worldOpts(p)), sun = p.sun / 100;
    const skyTop = RX.mix('#0C1422', '#3F6EA8', clamp(sun, 0, 1)), skyBot = RX.mix('#121A28', '#A9C4DE', clamp(sun, 0, 1));
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, skyTop); gr.addColorStop(1, skyBot); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    placeView(S, g, narrow ? 0 : -0.14, narrow ? 30 : 30);
    // the Sun
    const sx = narrow ? 50 : W * 0.12, sy = K.HDR + 50;
    if (sun > 0.01) { const sr = 16 + 10 * sun, sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5); sg.addColorStop(0, 'rgba(255,248,214,' + clamp(sun, 0, 1) + ')'); sg.addColorStop(0.25, 'rgba(255,226,140,' + (0.6 * clamp(sun, 0, 1.2)).toFixed(2) + ')'); sg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr * 3.5, 0, TAU); ctx.fill(); }
    S._sunAt = { x: sx, y: sy };
    g.handle(sx, sy, 18, 'sun');
    const B = landBlock(), soilWet = clamp(Wd.soil / W0.soil, 0, 2), surfK = clamp(Wd.surf / W0.surf, 0, 2), iceK = clamp(Wd.ice / W0.ice, 0.9, 1.1), plants = p.plants / 100;
    const items = [];
    const rr = G3.rng(8);
    for (let k = 0; k < 70; k++) { const x = -3.5 + rr() * 8, y = -10 + rr() * 20; if (Math.abs(y - riverY(x)) < 0.9 || Math.hypot(x - 1.5, y - 3.2) < 1.6 || rr() > plants) continue; const z = B.zAt(x, y); items.push({ at: [x, y, z], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(4, 0.55 * q.s), { kind: k % 3 ? 'broad' : 'conifer', state: soilWet < 0.25 ? 'dry' : 'live', seed: k }) }); }
    T.draw(ctx, cam, B, {
      cover: (i, j, x, y, z) => {
        if (z > 3.4 * iceK) return [236, 242, 248];                                  // snow and glacier
        if (z > 2.4) return [128, 122, 112];
        const green = clamp(soilWet, 0, 1.3) * (0.4 + 0.6 * plants);
        return TERRAIN.mixc([196, 170, 120], [70, 120, 60], clamp(green, 0, 1)).map((c, k) => c * (0.9 + 0.2 * vnoise(x, y, 6) - (k === 1 ? 0 : 0)));
      },
      water: (i, j, x, y) => {
        if (x < -4.4) return 0;
        if (Math.abs(y - riverY(x)) < 0.5 && x < 7.5 && surfK > 0.05) return B.zAt(x, riverY(x)) + 0.04 + 0.05 * surfK;
        if (Math.hypot(x - 1.5, y - 3.2) < 1.8 && surfK > 0.02) return B.zAt(1.5, 3.2) + 0.32 * clamp(surfK, 0, 1.4);
        return null;
      },
      items, deepAt: 1.2, sea: 0,
      layers: [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }, { col: [150, 140, 120], pat: 'gravel', top: (x, y, zs) => zs - 0.35, wet: true }, { col: [96, 84, 78], pat: 'rock', top: (x, y, zs) => Math.min(zs - 1.0, -0.6) }],
      table: (x, y) => B.zAt(x, y) - 0.25 - 0.6 * (1 - clamp(Wd.gw / W0.gw, 0, 1.2))
    });
    // clouds, as many and as thick as the water in the air
    const airK = Wd.air / W0.air, nC = Math.round(clamp(2 + 5 * Math.sqrt(airK), 0, 14));
    const cr = G3.rng(12);
    for (let k = 0; k < nC; k++) {
      const x = -8 + cr() * 16, y = -8 + cr() * 14, z = 4.6 + cr() * 1.5 + (p.grav < 0.05 ? cr() * 3 : 0), q = cam.project([x, y, z]);
      if (!q.ok) continue;
      const wc = (2.2 + 1.6 * cr()) * q.s * clamp(0.6 + 0.4 * Math.sqrt(airK), 0.5, 2.2), dark = clamp((airK - 1) * 0.2, 0, 0.5);
      if (R.P > 1 && k % 2 === 0) T.rain(ctx, q.x - wc * 0.3, q.y + 6, wc * 0.6, Math.max(20, (z - B.zAt(x, y)) * q.s * 0.9), clamp(R.P / 486 * 12, 1, 30), S.ta, -0.1);
      GX.cloud(ctx, q.x, q.y, wc, wc * 0.45, k + 1, clamp(0.35 + 0.35 * Math.sqrt(airK), 0.2, 0.95), [255 - dark * 120, 255 - dark * 110, 255 - dark * 90]);
    }
    // the arrows: each flux drawn as wide as it flows
    const arr = (a, b, flux, ref, col, label, bend) => { const qa = cam.project(a), qb = cam.project(b); if (!qa.ok || !qb.ok || flux < ref * 0.004) return; GX.fluxArrow(ctx, qa, qb, bend || 20, { col, w: 1.5 + 9 * Math.sqrt(flux / ref), alpha: 0.95 }); if (g.labels && (!narrow || /^(evap|rivers)/.test(label))) G3.tag(ctx, (qa.x + qb.x) / 2 + 8, (qa.y + qb.y) / 2 - 10, label, col); };
    arr([-8, -3, 0.2], [-8, -3, 4.4], R.Eo, 413, '#FFD27A', 'evaporation ' + R.Eo.toFixed(0), -30);
    arr([-1, 2, 0.6], [-1, 2, 4.4], R.ET, 413, '#9FE08A', 'plants and soil ' + R.ET.toFixed(0), 20);
    arr([3, -5, 5.0], [3, -5, 1.0], R.Pl, 413, '#8FC8FF', 'rain on land ' + R.Pl.toFixed(0), 20);
    arr([6, riverY(6), B.zAt(6, riverY(6)) + 0.3], [-4.8, riverY(-4.8), 0.3], R.river, 100, '#5FB0FF', 'rivers ' + R.river.toFixed(1), 30);
    arr([8.5, 6, 4.0], [6.0, 6.5, 2.8], R.iceOut, 30, '#E6F4FF', 'glaciers ' + R.iceOut.toFixed(1), 12);
    const at = K.cardSlot(g, S, 'the world’s water, box by box', 262, { x: W - 272, y: K.HDR + 6 });
    if (at) cardRows(g, at.x, at.y, at.w, 'Stores, thousand km³ (normal)', [
      ['the air', Wd.air.toFixed(1) + ' (12.9)', '#C8DCF2'], ['soil', Wd.soil.toFixed(1) + ' (16.5)', '#C9A26A'], ['lakes and rivers', Wd.surf.toFixed(0) + ' (105)', '#58B8D8'],
      ['groundwater', fmtN(Wd.gw) + ' (10,530)', '#8FC0D8'], ['ice', fmtN(Wd.ice) + ' (24,064)', '#E6F2FA'], ['ocean', fmtN(Wd.ocean / 1000) + ' million', '#2F7FC8'],
      ['evaporation', (R.Eo + R.ET).toFixed(0) + ' a year', '#FFD27A', 1], ['rain and snow', R.P.toFixed(0) + ' a year', '#8FC8FF', 1], ['back to the sea', (R.river + R.iceOut).toFixed(1) + ' a year', '#5FB0FF', 1]],
      { foot: 'Inflow = outflow for every box when nothing changes: that is the steady state of a system.' });
    if (g.labels && !narrow) { const q = cam.project([-8, 4, 0]); if (q.ok) G3.tag(ctx, q.x, q.y, 'ocean', '#BFE0FF'); }
  }

  /* ---------------- residence: dye in a lake ---------------- */
  let LAKEB = null;
  const outY = x => 0.4 * Math.sin(x * 0.6);
  function lakeBlock() {
    if (LAKEB) return LAKEB;
    LAKEB = TERR().block({ n: 44, size: 22, zBase: -3, height: (x, y) => {
      const r = Math.hypot(x / 1.25, y), bowl = -1.6 * Math.exp(-r * r / 22) + 0.04 * r * r * 0.1;
      const hills = 0.9 * vnoise(x * 0.35, y * 0.35, 9) + Math.max(0, r - 7) * 0.25;
      const inflow = Math.exp(-Math.pow((x - 1.2 * Math.sin(y * 0.4)) / 0.5, 2)) * (y > 4 ? 0.35 : 0);
      const outflow = x < -5 ? Math.exp(-Math.pow((y - outY(x)) / 0.5, 2)) * 0.45 : 0;
      return 0.5 + bowl + hills * clamp((r - 3) / 4, 0, 1) - inflow - outflow;
    } });
    return LAKEB;
  }
  function drawResidence(S, g) {
    const ctx = g.ctx, cam = S.cam, p = S.p, K = kit(), T = TERR(), W = g.w, narrow = W < K.NARROW, Lw = S.lk, o = lakeOf(p);
    const gr = ctx.createLinearGradient(0, 0, 0, g.h); gr.addColorStop(0, '#4E7AAE'); gr.addColorStop(1, '#B8CFE2'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, g.h);
    placeView(S, g, narrow ? 0 : -0.14, narrow ? 30 : 34);
    const B = lakeBlock(), lvl = 0.25, dye = clamp(Lw.C / 100, 0, 1), salty = clamp((Lw.salt - 1) / 20, 0, 1);
    const items = []; const rr = G3.rng(4);
    for (let k = 0; k < 60; k++) { const x = -10 + rr() * 20, y = -10 + rr() * 20, z = B.zAt(x, y); if (z < lvl + 0.15 || Math.hypot(x / 1.25, y) < 5) continue; items.push({ at: [x, y, z], draw: (c2, q) => T.tree(c2, q.x, q.y, Math.max(4, 0.6 * q.s), { kind: k % 2 ? 'conifer' : 'broad', seed: k }) }); }
    const sampler = [-1.2, -1.5, lvl];
    T.draw(ctx, cam, B, {
      cover: (i, j, x, y, z) => z < lvl + 0.12 ? (salty > 0.1 ? TERRAIN.mixc([180, 170, 140], [236, 232, 220], salty) : [170, 160, 120]) : TERRAIN.mixc([96, 140, 70], [70, 110, 56], vnoise(x, y, 3)),
      water: (i, j, x, y) => {
        const z = B.zAt(x, y);
        if (z < lvl) return lvl;
        if (y > 3 && Math.abs(x - 1.2 * Math.sin(y * 0.4)) < 0.45 && p.inflow > 0) return z + 0.06;
        if (x < -4 && Math.abs(y - outY(x)) < 0.45 && o.out > 0) return z + 0.05;
        return null;
      },
      waterCol: (dep, i, j) => TERRAIN.mixc(TERRAIN.mixc([70, 140, 170], [20, 70, 110], clamp(dep / 1.6, 0, 1)), [196, 40, 150], dye * 0.85),
      items, deepAt: 1.6, sea: null,
      layers: [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }, { col: [96, 84, 78], pat: 'rock', top: (x, y, zs) => zs - 0.8 }]
    });
    // the sampling buoy and its line
    const q = cam.project(sampler);
    if (q.ok) { ctx.save(); ctx.fillStyle = '#F0B020'; ctx.beginPath(); ctx.arc(q.x, q.y - 4, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2A2A2A'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); if (g.labels) G3.tag(ctx, q.x + 10, q.y - 10, 'sampler · dye ' + Lw.C.toFixed(1) + ' %', '#FFE0A0'); }
    const qi = cam.project([1.2 * Math.sin(8 * 0.4), 8, B.zAt(1.2 * Math.sin(3.2), 8)]), qo = cam.project([-9, outY(-9), B.zAt(-9, outY(-9))]);
    S._inAt = qi.ok ? qi : null;
    if (qi.ok) g.handle(qi.x, qi.y, 14, 'inflow');
    if (g.labels) {
      if (qi.ok) G3.tag(ctx, qi.x + 10, qi.y, 'rivers in · ' + sig(o.inflow, 3) + ' km³/yr', '#BFE0FF');
      if (qo.ok) G3.tag(ctx, Math.max(qo.x - 8, narrow ? 150 : 170), qo.y + 14, o.out > 0 ? 'outflow · ' + sig(o.out, 3) + ' km³/yr' : 'no outlet', '#BFE0FF', { align: 'right' });
      const qe = cam.project([3, -3, lvl + 2.5]); if (qe.ok) G3.tag(ctx, qe.x, qe.y, 'evaporation · ' + sig(o.evap, 3) + ' km³/yr', '#FFD27A');
    }
    const at = K.cardSlot(g, S, 'how long water stays', 262, { x: W - 272, y: K.HDR + 6 });
    if (at) {
      const rows = ['air', 'river', 'soil', 'lakeFresh', 'gwFresh', 'ocean', 'ice'].map(k => [RSHORT[k], ageSay(residence(k)), RCOL[k]]);
      rows.splice(4, 0, [o.Lk.name + ' (dye)', isFinite(o.tauDye) ? ageSay(o.tauDye) : 'never leaves', '#F0A0D8']);
      cardRows(g, at.x, at.y, at.w, 'Residence = volume ÷ flow through', rows, { foot: 'A store that is large compared with its flow keeps its water long — and keeps a pollutant long.' });
    }
  }

  /* ---------------- the stage ---------------- */
  const G3P = () => window.G6D;
  let G3 = null;
  function drawStage(S, g) {
    const p = S.p, K = kit(); G3 = G3P();
    if (!K || !G3) return;
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { const h = homeFor(p.setup, S._narrow); S.cam.dist = h.dist; S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist }; S._narrowCam = S._narrow; }
    const cam = S.cam, narrow = S._narrow;
    if (p.setup === 'drivers') { drawDrivers(S, g); headerOf(S, g); return; }
    if (p.setup === 'residence') { drawResidence(S, g); headerOf(S, g); return; }
    room(g);
    placeView(S, g, narrow ? 0 : -0.13, narrow ? 24 : 18);
    const F = R3.Frame(g.ctx, cam, { floorZ: 0, ambient: 0.3 }), lab = [];
    if (p.setup === 'reservoirs') benchReservoirs(S, F, lab);
    else if (p.setup === 'evaporate') benchEvaporate(S, F, lab, g);
    else if (p.setup === 'rain') benchRain(S, F, lab);
    else benchTranspire(S, F, lab);
    F.render();
    const xMax = narrow ? g.w : g.w - 280;
    drawLabels(g, cam, lab, xMax);
    handles(S, g);
    if (p.setup === 'reservoirs') drawReservoirs(S, g, F);
    else if (p.setup === 'evaporate') drawEvapCard(S, g);
    else if (p.setup === 'rain') drawDropCard(S, g);
    else drawStomataCard(S, g);
    headerOf(S, g);
  }
  /* drag handles, in screen space: each stashes the axis it moves along */
  function handles(S, g) {
    const p = S.p, cam = S.cam, axis = (a, b) => { const qa = cam.project(a), qb = cam.project(b); if (!qa.ok || !qb.ok) return null; const dx = qb.x - qa.x, dy = qb.y - qa.y, l = Math.hypot(dx, dy) || 1; return { ux: dx / l, uy: dy / l, px: l }; };
    S._ax = {};
    if (p.setup === 'evaporate' && S._knob) { const q = cam.project(S._knob); if (q.ok) { g.handle(q.x, q.y, 13, 'knob'); } }
    if (p.setup === 'reservoirs' && S._iceAt) { const q = cam.project(S._iceAt); if (q.ok) { g.handle(q.x, q.y, 13, 'ice'); } }
    if (p.setup === 'rain') {
      const q = cam.project(S._valve); if (q.ok) g.handle(q.x, q.y, 13, 'valve');
      const u = cam.project(S._uphill); if (u.ok) { g.handle(u.x, u.y, 13, 'slope'); }
    }
    if (p.setup === 'transpire' && S._lampAt) {
      const q = cam.project(S._lampAt); if (q.ok) g.handle(q.x, q.y, 14, 'lamp');
      S._ax.lamp = axis([POT.sx, 0, 0.3], [POT.sx + S._lampAxis[0], S._lampAxis[1], 0.3]);
    }
  }
  function onDrag(S, e) {
    const p = S.p;
    /* each handle moves its quantity at about a third of the stage for the whole range (InsightVis §2.13) */
    if (e.id === 'knob') p.power = clamp(Math.round(p.power + e.dx * 0.25), 0, 80);
    else if (e.id === 'ice') { p.melt = clamp(Math.round(p.melt - e.dy * 0.5), 0, 100); }
    else if (e.id === 'valve') { p.rate = clamp(Math.round(p.rate + e.dx * 0.6), 2, 150); this.setup(S); }
    else if (e.id === 'slope') { p.slope = clamp(Math.round(p.slope - e.dy * 0.12), 1, 30); this.setup(S); }
    else if (e.id === 'lamp' && S._ax.lamp) { const along = e.dx * S._ax.lamp.ux + e.dy * S._ax.lamp.uy; p.lampD = clamp(Math.round(p.lampD + along / S._ax.lamp.px * 100 * 0.6), 10, 100); }
    else if (e.id === 'sun') p.sun = clamp(Math.round(p.sun - e.dy * 0.6), 0, 150);
    else if (e.id === 'inflow') p.inflow = clamp(Math.round(p.inflow + e.dx * 0.8), 0, 200);
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  function headerOf(S, g) {
    const p = S.p, K = kit();
    let a = '', b = '', c = '';
    if (p.setup === 'reservoirs') {
      const B = bottle(p);
      a = p.view === 'fresh' ? 'All of Earth’s fresh water in ' + p.bottleL + ' L: ' + (B.mL.ice / (p.bottleL * 10)).toFixed(0) + ' % of it is ice' : 'All of Earth’s water in ' + p.bottleL + ' L: ' + fmtN(B.mL.ocean, 0) + ' mL is ocean';
      b = 'fresh ' + B.freshPct.toFixed(2) + ' % · fresh lakes and rivers ' + sig((B.mL.lakeFresh + B.mL.river) / DROP, 2) + ' drops · the air ' + sig(B.mL.air / DROP, 2) + ' drops';
      c = 'Gleick (1996): 1,386 million km³ in all · ' + (p.melt > 0 ? p.melt + ' % of the land ice melted → sea +' + B.rise.toFixed(1) + ' m' : 'one drop = 0.05 mL');
    } else if (p.setup === 'evaporate') {
      const C = S.ch, rh = rhOf(C), Td = dewOfRho(C.rv, C.Ta);
      a = C.fog > 0.01 ? 'A cloud has formed: the air is saturated and its vapour is condensing into drops' : C.drip > 0.05 ? 'Rain in a box: vapour condenses on the cold lid and drips into the cylinder' : rh > 97 ? 'The air is saturated: it cannot hold any more vapour at ' + C.Ta.toFixed(1) + ' °C' : 'The water evaporates: ' + (C.E * 3600).toFixed(1) + ' g an hour leave the dish';
      b = 'water ' + C.Tw.toFixed(1) + ' °C · air ' + C.Ta.toFixed(1) + ' °C at ' + rh.toFixed(0) + ' % RH · dew point ' + Td.toFixed(1) + ' °C · ' + (p.lid === 'ice' ? 'lid ' + C.Tl.toFixed(1) + ' °C' : p.lid === 'glass' ? 'glass lid' : 'open');
      c = mmss(C.t) + ' elapsed · ×' + p.evLapse + ' time-lapse · evaporated ' + C.evap.toFixed(1) + ' g · collected ' + C.drip.toFixed(1) + ' mL';
    } else if (p.setup === 'rain') {
      const T = S.tr, tp = ponding(p, p.rate);
      a = T.run > 0.05 ? 'Runoff: rain arrives faster than the soil can take it in' : T.ponded != null ? 'Water is pooling on the surface — it will run off when the hollows are full' : 'Every drop is soaking in: the soil can take ' + (T.cap > 1e6 ? 'all of it' : T.cap.toFixed(0) + ' mm an hour');
      b = p.rate + ' mm/h for ' + p.dur + ' min · ' + SOILS[p.soil].name.toLowerCase() + ' · soaked in ' + T.F.toFixed(1) + ' mm · ran off ' + T.run.toFixed(1) + ' mm · ponds after ' + (isFinite(tp.tp) ? tp.tp.toFixed(1) + ' min (Green–Ampt)' : 'never');
      c = mmss(T.t) + ' into the storm · ×' + p.rnLapse + ' · tray 60 × 30 cm, ' + p.slope + '° · drops ' + dropD0(p.rate).toFixed(1) + ' mm falling at ' + dropV(dropD0(p.rate)).toFixed(1) + ' m/s';
    } else if (p.setup === 'transpire') {
      const Pt = S.pt, Lf = Pt.L || leafOf(p), mmMin = (Pt.Q || 0) / (Math.PI * Math.pow(p.bore / 1000, 2)) * 60000;
      a = 'The bubble moves ' + mmMin.toFixed(1) + ' mm a minute: the leaves are pulling water up the stem';
      b = 'transpiration ' + (Lf.E * 1000).toFixed(2) + ' mmol/m²/s · stomata ' + (Lf.open * 100).toFixed(0) + ' % open · leaf ' + Lf.Tl.toFixed(1) + ' °C · air ' + (p.bag ? Pt.rh.toFixed(0) : p.rh) + ' % RH';
      c = mmss(Pt.t) + ' elapsed · ×' + p.tpLapse + ' · ' + (Pt.up).toFixed(2) + ' mL drawn up · bubble reset ' + Pt.resets + '×';
    } else if (p.setup === 'drivers') {
      const W = S.w, R = worldRates(W, worldOpts(p));
      a = p.sun < 1 && p.grav < 0.01 ? 'No Sun and no gravity: the cycle has stopped' : p.sun < 1 ? 'No Sun: nothing evaporates — rain ends, then rivers drain to the sea' : p.grav < 0.01 ? 'No gravity: water evaporates but never falls — the air fills, rivers stop' : 'The cycle runs on two drivers: sunlight lifts water, gravity brings it down';
      b = 'evaporation ' + (R.Eo + R.ET).toFixed(0) + ' · rain ' + R.P.toFixed(0) + ' · rivers ' + R.river.toFixed(1) + ' thousand km³ a year · air holds ' + (W.air / Math.max(1e-6, R.P) * 365.25).toFixed(1) + ' days of rain';
      c = ageSay(W.t) + ' since you changed it · ' + (p.drLapse >= 365 ? p.drLapse / 365 + ' year' + (p.drLapse > 365 ? 's' : '') : p.drLapse + ' days') + ' a second · lifting it takes ' + R.energy.toFixed(0) + ' W/m² of sunlight';
    } else {
      const Lw = S.lk, o = lakeOf(p);
      a = p.closed ? o.Lk.name + ' with no outlet: the dye stays, and the salt piles up' : o.Lk.name + ': ' + Lw.C.toFixed(1) + ' % of the dye is left after ' + ageSay(Lw.t);
      b = 'volume ' + fmtN(o.Lk.V) + ' km³ · outflow ' + sig(o.out, 3) + ' km³/yr · dye halves every ' + (isFinite(o.tauDye) ? ageSay(o.tauDye * Math.LN2) : '—') + ' · salt ×' + Lw.salt.toFixed(2);
      c = p.lkLapse + ' year' + (p.lkLapse === 1 ? '' : 's') + ' a second · residence = volume ÷ outflow = ' + (isFinite(o.tauDye) ? ageSay(o.tauDye) : '∞');
    }
    K.header(g, a, b, c);
  }

  /* ============================================================
     THE GRAPHS
     ============================================================ */
  const LOGT = [[-4, '0.0001'], [-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1,000'], [4, '10⁴']];
  const yearsTick = v => { const y = Math.pow(10, v); return y < 1 / 52 ? Math.round(y * 365.25) + ' d' : y < 1 ? Math.round(y * 12) + ' mo' : y < 1000 ? fmtN(y) + ' yr' : '10' + ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷'][Math.round(v)] + ' yr'; };
  const supN = n => String(n).split('').map(ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)] || (ch === '-' ? '⁻' : ch)).join('');
  function plot1(S, g) {
    const p = S.p, K = kit(), th = g.theme;
    if (p.setup === 'reservoirs') {
      const B = bottle(p), list = RES.filter(r => B.mL[r.k] > 0).sort((a, b) => B.mL[b.k] - B.mL[a.k]);
      const ymax = Math.ceil(Math.log10(p.bottleL * 1000)) + 0.2, Kk = K.plotKey(g, [{ c: '#2F7FC8', box: true, label: 'salt' }, { c: '#9FD4FF', box: true, label: 'fresh' }], 'one drop = 0.05 mL');
      const P = g.Plot({ xmin: -0.6, xmax: list.length - 0.4, ymin: -4, ymax, pad: { t: Kk.t, b: 30 }, xticks: [], ylabel: 'mL in the bottle (log)', yticks: LOGT.filter(t => t[0] <= ymax).map(t => t[0]), yfmt: v => (LOGT.find(t => t[0] === v) || [0, ''])[1] }).frame();
      P.clip(() => {
        list.forEach((r, i) => P.bar(i, Math.max(-4, Math.log10(B.mL[r.k])), 0.36, -4, RCOL[r.k]));
        P.hline(Math.log10(DROP), 'rgba(255,214,107,.7)', [4, 3]);
        P.tag(list.length - 1, Math.log10(DROP), 'one drop', '#FFD66B', 'right', -8);
      });
      g.ctx.save(); g.ctx.font = mono(8.5); g.ctx.fillStyle = th['text-2']; g.ctx.textAlign = 'right';
      list.forEach((r, i) => { const x = P.x0 + (i + 0.6) / (list.length) * (P.x1 - P.x0); g.ctx.save(); g.ctx.translate(x, P.y0 + 6); g.ctx.rotate(-0.6); g.ctx.fillText(RSHORT[r.k], 0, 0); g.ctx.restore(); });
      g.ctx.restore();
      Kk.draw(P); return;
    }
    if (p.setup === 'evaporate') {
      const H = S.hist, tmax = Math.max(10, H[H.length - 1][0] * 1.1), ym = Math.max(5, ...H.map(q => q[1])) * 1.15;
      const Kk = K.plotKey(g, [{ c: '#FFC56B', label: 'evaporated, g' }, { c: '#8FC8FF', label: 'collected, mL' }, { c: '#7CF0B0', label: 'RH, % (right)', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'grams of water', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(ym < 10 ? 1 : 0) }).frame();
      P.clip(() => {
        P.line(H.map(q => [q[0], q[1]]), '#FFC56B', 2.2); P.line(H.map(q => [q[0], q[2]]), '#8FC8FF', 2.2);
        P.line(H.map(q => [q[0], q[3] / 100 * ym]), '#7CF0B0', 1.5, [4, 3]);
        P.hline(ym, 'rgba(124,240,176,.35)', [2, 4]); P.tag(tmax, ym, '100 % RH', '#7CF0B0', 'right', 9);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'rain') {
      const H = S.hist, tmax = Math.max(p.dur * 1.6, 20), tp = ponding(p, p.rate), ym = Math.max(p.rate, 20) * 1.25;
      const Kk = K.plotKey(g, [{ c: '#8FC8FF', label: 'rain' }, { c: '#C9A26A', label: 'soaking in' }, { c: '#5FB0FF', label: 'running off', dash: [5, 3] }, { c: '#FFD66B', label: 'can soak in (Green–Ampt)', dash: [2, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'minutes into the storm', ylabel: 'mm an hour', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const cap = []; const s = soilOf(p);
      if (s.Ks > 0) for (let F = 0.2; F < 200; F *= 1.08) { const T = ponding(p, s.Ks * (1 + s.psi * s.dth / F)); if (isFinite(T.tp) && T.tp < tmax) cap.push([T.tp + 0, s.Ks * (1 + s.psi * s.dth / F)]); }
      P.clip(() => {
        P.area([[0, p.rate], [p.dur, p.rate], [p.dur, 0], [0, 0]], 0, 'rgba(143,200,255,.12)'); P.line([[0, p.rate], [p.dur, p.rate], [p.dur, 0]], '#8FC8FF', 1.6);
        if (s.Ks > 0) P.hline(s.Ks, 'rgba(201,162,106,.5)', [2, 4]);
        P.line(H.map(q => [q[0], q[2]]), '#C9A26A', 2.2); P.line(H.map(q => [q[0], q[3]]), '#5FB0FF', 2, [5, 3]);
        if (isFinite(tp.tp) && tp.tp < tmax) { P.vline(tp.tp, 'rgba(255,214,107,.7)', [3, 3]); P.tag(tp.tp, ym * 0.92, 'ponds at ' + tp.tp.toFixed(1) + ' min', '#FFD66B', 'left', 0); }
        if (s.Ks > 0) P.tag(tmax, s.Ks, 'Ks = ' + s.Ks.toFixed(1), '#C9A26A', 'right', -7);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'transpire') {
      const H = S.hist, tmax = Math.max(10, H[H.length - 1][0] * 1.1), ym = Math.max(50, ...H.map(q => q[1])) * 1.15;
      const Kk = K.plotKey(g, [{ c: '#7CF0B0', label: 'how far the bubble has moved (all its trips)' }]);
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'mm along the capillary', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(H.map(q => [q[0], q[1]]), '#7CF0B0', 2.4); const last = H[H.length - 1]; P.dot(last[0], last[1], 4, '#7CF0B0', '#0B0F18'); P.tag(last[0], last[1], 'slope ' + bubbleSpeed(Object.assign({}, p, p.bag ? { rh: S.pt.rh } : {})).toFixed(1) + ' mm/min', '#7CF0B0', 'right', -10); });
      Kk.draw(P); return;
    }
    if (p.setup === 'drivers') {
      const H = S.hist, tmax = Math.max(H[H.length - 1][0] * 1.1, p.drLapse / 365.25 * 2);
      const all = H.flatMap(q => q.slice(1)), ym = Math.min(40, Math.max(1.5, ...all) * 1.1);
      const Kk = K.plotKey(g, [{ c: '#C8DCF2', label: 'the air' }, { c: '#C9A26A', label: 'soil' }, { c: '#58B8D8', label: 'lakes and rivers' }, { c: '#8FC0D8', label: 'groundwater', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: tmax < 0.3 ? 'days' : 'years', ylabel: '× its normal amount', xfmt: v => tmax < 0.3 ? (v * 365.25).toFixed(0) : v.toFixed(tmax < 3 ? 1 : 0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.hline(1, 'rgba(201,212,234,.4)', [3, 3]); [['#C8DCF2', 1], ['#C9A26A', 2], ['#58B8D8', 3], ['#8FC0D8', 4]].forEach(([c, i]) => P.line(H.map(q => [q[0], Math.min(ym, q[i])]), c, i === 4 ? 1.6 : 2.2, i === 4 ? [4, 3] : null)); });
      Kk.draw(P); return;
    }
    const H = S.hist, o = lakeOf(p), tmax = Math.max(H[H.length - 1][0] * 1.1, isFinite(o.tauDye) ? Math.min(o.tauDye * 3, 4000) : 10);
    const Kk = K.plotKey(g, [{ c: '#F070C8', label: 'dye at the sampler' }, { c: '#FFD66B', label: 'e^(−t/τ)', dash: [4, 3] }].concat(p.closed ? [{ c: '#E6E0C8', label: 'salt, × start (right)', dash: [2, 3] }] : []));
    const smax = Math.max(2, ...H.map(q => q[2])) * 1.1;
    const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'years', ylabel: 'dye left, %', xfmt: v => v < 10 ? v.toFixed(1) : fmtN(v), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => {
      if (isFinite(o.tauDye)) { const pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80 * tmax; pts.push([t, 100 * Math.exp(-t / o.tauDye)]); } P.line(pts, '#FFD66B', 1.4, [4, 3]); P.vline(o.tauDye, 'rgba(255,214,107,.6)', [3, 3]); P.hline(36.8, 'rgba(255,214,107,.4)', [2, 4]); P.tag(o.tauDye, 40, 'τ = ' + ageSay(o.tauDye) + ': 37 % left', '#FFD66B', 'left', 0); }
      P.line(H.map(q => [q[0], q[1]]), '#F070C8', 2.4);
      if (p.closed) P.line(H.map(q => [q[0], q[2] / smax * 105]), '#E6E0C8', 1.6, [2, 3]);
    });
    Kk.draw(P);
  }
  const RAINC = {};
  function runoffCurves(p) {
    const key = [p.dur, p.wet, p.cover, p.rough, p.slope].join('|');
    if (RAINC[key]) return RAINC[key];
    const rates = [5, 10, 20, 30, 45, 60, 80, 100, 125, 150], out = {};
    Object.keys(SOILS).forEach(k => { out[k] = rates.map(r => { const q = Object.assign({}, p, { soil: k, rate: r }), T = trayRun(q, p.dur + 30); return [r, 100 * T.run / Math.max(1e-9, T.rain)]; }); });
    return (RAINC[key] = out);
  }
  const LEAFC = {};
  function leafCurves(p) {
    const key = [p.plant, p.lamp, p.lampD, p.airT, p.wind].join('|');
    if (LEAFC[key]) return LEAFC[key];
    const out = {};
    ['none', 'upper', 'lower', 'both'].forEach(v => { out[v] = []; for (let rh = 10; rh <= 95; rh += 5) out[v].push([rh, leafOf(Object.assign({}, p, { vas: v, rh })).E * 1000]); });
    return (LEAFC[key] = out);
  }
  const SCOL = { sand: '#E8CC90', sandyLoam: '#C8A070', loam: '#A8784C', siltLoam: '#B89870', siltyClay: '#9A8A80', clay: '#86685A', paved: '#9AA0A8' };
  function plot2(S, g) {
    const p = S.p, K = kit(), th = g.theme;
    if (p.setup === 'reservoirs' || p.setup === 'residence') {
      const pts = RES.filter(r => r.k !== 'gwSalt' && r.k !== 'permafrost' && r.k !== 'lakeSalt').map(r => ({ k: r.k, v: Math.log10(r.v), t: Math.log10(residence(r.k)), c: RCOL[r.k], name: RSHORT[r.k] }));
      const lakes = Object.keys(LAKES).map(k => ({ k, v: Math.log10(LAKES[k].V), t: Math.log10(LAKES[k].tau), c: '#F070C8', name: LAKES[k].name.replace('Lake ', '') }));
      const Kk = K.plotKey(g, [{ c: '#9FD4FF', dot: true, label: 'Earth’s stores' }].concat(p.setup === 'residence' ? [{ c: '#F070C8', dot: true, label: 'lakes (dye τ)' }] : []), 'τ = volume ÷ flow');
      const P = g.Plot({ xmin: 2.5, xmax: 9.5, ymin: -2, ymax: 4.3, pad: { t: Kk.t }, xlabel: 'volume, km³ (log)', ylabel: 'residence (log)', xticks: [3, 5, 7, 9], xfmt: v => '10' + supN(v), yticks: [-2, -1, 0, 1, 2, 3, 4], yfmt: yearsTick }).frame();
      P.clip(() => {
        pts.forEach(q => { P.dot(q.v, q.t, 4.5, q.c, '#0B0F18'); P.tag(q.v, q.t, q.name, '#C9D4EA', q.v > 8 ? 'right' : 'left', -9); });
        if (p.setup === 'residence') { const o = lakeOf(p); lakes.forEach(q => P.dot(q.v, q.t, q.k === p.lake ? 6 : 3.5, q.c, q.k === p.lake ? '#FFFFFF' : '#0B0F18')); const cur = lakes.find(q => q.k === p.lake); if (isFinite(o.tauDye)) P.dot(cur.v, Math.log10(o.tauDye), 3, '#FFFFFF'); P.tag(cur.v, cur.t, cur.name, '#F7B0E0', 'left', 10); }
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'evaporate') {
      const C = S.ch, Sg = C.salt / Math.max(1, C.dishM) * 1000, Td = dewOfRho(C.rv, C.Ta);
      const Kk = K.plotKey(g, [{ c: '#9FD4FF', label: 'the most vapour air can hold (Clausius–Clapeyron)' }, { c: '#FFC56B', dot: true, label: 'water' }, { c: '#7CF0B0', dot: true, label: 'air' }, { c: '#8FC8FF', dot: true, label: 'lid' }]);
      const tmax = Math.max(40, Math.ceil((C.Tw + 8) / 10) * 10), ym = rhoSat(tmax) * 1.08, pts = [];
      for (let T = -10; T <= tmax; T += 0.5) pts.push([T, rhoSat(T)]);
      const P = g.Plot({ xmin: -10, xmax: tmax, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'vapour, g/m³', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.area(pts.concat([[tmax, ym], [-10, ym]]), ym, 'rgba(240,112,112,.05)');
        P.line(pts, '#9FD4FF', 2.2);
        P.line([[Td, C.rv], [C.Ta, C.rv]], 'rgba(124,240,176,.6)', 1.2, [3, 3]); P.vline(Td, 'rgba(124,240,176,.35)', [2, 4]);
        P.tag(Td, C.rv, 'dew point ' + Td.toFixed(1) + ' °C', '#7CF0B0', 'right', -9);
        P.dot(C.Tw, aw(Sg) * rhoSat(C.Tw), 5, '#FFC56B', '#0B0F18'); P.dot(C.Ta, C.rv, 5, '#7CF0B0', '#0B0F18');
        if (p.lid !== 'open') P.dot(C.Tl, rhoSat(C.Tl), 5, '#8FC8FF', '#0B0F18');
        P.tag(tmax * 0.55, rhoSat(tmax * 0.55) * 1.35, 'over the curve: it condenses', '#F09090', 'right', 0);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'rain') {
      const cur = runoffCurves(p), T = S.tr;
      const Kk = K.plotKey(g, Object.keys(SOILS).map(k => ({ c: SCOL[k], label: SOILS[k].name.toLowerCase(), w: k === p.soil ? 3 : 1.5 })), p.dur + ' min storms');
      const P = g.Plot({ xmin: 0, xmax: 150, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'rain, mm an hour', ylabel: 'ran off, % of the rain', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        Object.keys(cur).forEach(k => P.line(cur[k], SCOL[k], k === p.soil ? 3 : 1.4, k === p.soil ? null : [4, 3]));
        const fin = trayRun(p, p.dur + 30); P.dot(p.rate, 100 * fin.run / Math.max(1e-9, fin.rain), 5.5, SCOL[p.soil], '#FFFFFF');
        if (T.rain > 0) P.dot(p.rate, 100 * T.run / T.rain, 3, '#FFFFFF');
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'transpire') {
      const cur = leafCurves(p), Lf = (S.pt && S.pt.L) || leafOf(p), ym = Math.max(2, ...cur.none.map(q => q[1])) * 1.15;
      const nm = { none: 'no jelly', upper: 'jelly on top', lower: 'jelly underneath', both: 'jelly on both' }, cl = { none: '#7CF0B0', upper: '#B6E07A', lower: '#FFC56B', both: '#C9D4EA' };
      const Kk = K.plotKey(g, ['none', 'upper', 'lower', 'both'].map(v => ({ c: cl[v], label: nm[v], w: v === p.vas ? 3 : 1.5 })));
      const P = g.Plot({ xmin: 10, xmax: 95, ymin: 0, ymax: ym, pad: { t: Kk.t }, xlabel: 'humidity of the air, %', ylabel: 'mmol of water /m²/s', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { Object.keys(cur).forEach(v => P.line(cur[v], cl[v], v === p.vas ? 3 : 1.4, v === p.vas ? null : [4, 3])); P.dot(p.bag ? S.pt.rh : p.rh, Lf.E * 1000, 5.5, cl[p.vas], '#FFFFFF'); });
      Kk.draw(P); return;
    }
    // drivers: what each driver powers
    const xs = []; for (let k = 0; k <= 150; k += 5) xs.push(k);
    const evap = xs.map(k => [k, (() => { const R = worldRates(W0, { sun: k / 100, grav: p.grav, plants: p.plants / 100 }); return R.Eo + R.ET; })()]);
    const riv = xs.map(k => [k, (() => { const R = worldRates(W0, { sun: p.sun / 100, grav: k / 100, plants: p.plants / 100 }); return (R.river + R.iceOut) * 10; })()]);
    const Kk = K.plotKey(g, [{ c: '#FFD27A', label: 'evaporation, against the Sun' }, { c: '#5FB0FF', label: 'rivers ×10, against gravity', dash: [5, 3] }], 'stores at normal');
    const P = g.Plot({ xmin: 0, xmax: 150, ymin: 0, ymax: 800, pad: { t: Kk.t }, xlabel: '% of today’s Sun · % of Earth’s gravity', ylabel: 'thousand km³ a year', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    const R = worldRates(S.w, worldOpts(p));
    P.clip(() => { P.line(evap, '#FFD27A', 2.4); P.line(riv, '#5FB0FF', 2.2, [5, 3]); P.dot(p.sun, R.Eo + R.ET, 5.5, '#FFD27A', '#FFFFFF'); P.dot(p.grav * 100, (R.river + R.iceOut) * 10, 5.5, '#5FB0FF', '#FFFFFF'); P.vline(100, 'rgba(201,212,234,.35)', [3, 3]); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'reservoirs') {
      const B = bottle(p), r = [];
      if (p.view === 'all') r.push({ label: 'Ocean V/V_total', value: fmtN(B.mL.ocean, 1), unit: 'mL', flag: 'accent', hint: 'salt water' });
      r.push({ label: 'Ice and snow', value: sig(B.mL.ice, 3), unit: 'mL', hint: p.view === 'fresh' ? (B.km3.ice / B.base * 100).toFixed(1) + ' % of fresh' : 'frozen fresh water' });
      r.push({ label: 'Fresh groundwater', value: sig(B.mL.gwFresh, 3), unit: 'mL', hint: 'in rock pores' });
      r.push({ label: 'Fresh lakes + rivers', value: sig((B.mL.lakeFresh + B.mL.river) / DROP, 3), unit: 'drops', flag: 'warn', hint: 'what we see and drink' });
      r.push({ label: 'The air', value: sig(B.mL.air / DROP, 3), unit: 'drops', hint: 'every cloud and all the vapour' });
      r.push({ label: 'Fresh, % of all', value: B.freshPct.toFixed(2), unit: '%' });
      r.push({ label: 'Residence of the air', value: (residence('air') * 365.25).toFixed(1), unit: 'days', hint: '12,900 ÷ 486,000 km³/yr' });
      if (p.melt > 0) r.push({ label: 'Sea level rise', value: B.rise.toFixed(1), unit: 'm', flag: 'crit', hint: p.melt + ' % of land ice melted' });
      return r;
    }
    if (p.setup === 'evaporate') {
      const C = S.ch, R = chamberRates(C, p), Td = dewOfRho(C.rv, C.Ta);
      return [
        { label: 'Water temperature', value: C.Tw.toFixed(1), unit: '°C', hint: 'from its energy balance' },
        { label: 'Evaporation E = h·A·Δρ', value: (C.E * 3600).toFixed(1), unit: 'g/h', flag: 'accent' },
        { label: 'Energy to evaporate L·E', value: (latent(C.Tw) * C.E / 1000).toFixed(1), unit: 'W', hint: 'of ' + p.power + ' W in' },
        { label: 'Air', value: C.Ta.toFixed(1), unit: '°C' },
        { label: 'Relative humidity', value: rhOf(C).toFixed(0), unit: '%', flag: rhOf(C) > 97 ? 'warn' : null },
        { label: 'Dew point', value: Td.toFixed(1), unit: '°C', hint: p.lid === 'ice' ? (C.Tl < Td ? 'lid is colder: dew forms' : 'lid is warmer: no dew') : '' },
        { label: 'Cloud in the air', value: (C.fog / CH.V).toFixed(2), unit: 'g/m³', hint: 'liquid drops, not vapour' },
        { label: 'Collected', value: C.drip.toFixed(1), unit: 'mL', flag: C.drip > 0.05 ? 'ok' : null, hint: 'salt in it: 0 g/kg' },
        { label: 'Vapour onto the lid', value: (Math.max(0, R.Cl) * 3600).toFixed(1), unit: 'g/h' }
      ];
    }
    if (p.setup === 'rain') {
      const T = S.tr, tp = ponding(p, p.rate), s = soilOf(p);
      return [
        { label: 'Rain i', value: String(p.rate), unit: 'mm/h', hint: 'drops ' + dropD0(p.rate).toFixed(1) + ' mm, ' + dropV(dropD0(p.rate)).toFixed(1) + ' m/s' },
        { label: 'Can soak in f = Ks(1+ψΔθ/F)', value: T.cap > 1e6 ? '∞' : (T.cap || 0).toFixed(1), unit: 'mm/h', hint: 'Ks ' + s.Ks.toFixed(1) },
        { label: 'Ponds at tp', value: isFinite(tp.tp) ? tp.tp.toFixed(1) : 'never', unit: isFinite(tp.tp) ? 'min' : '', hint: 'Green–Ampt' },
        { label: 'Soaked in F', value: T.F.toFixed(1), unit: 'mm' },
        { label: 'Ran off', value: T.run.toFixed(1), unit: 'mm', flag: 'accent', hint: (T.run * TRAY.L * TRAY.W).toFixed(2) + ' L off the tray' },
        { label: 'Runoff share', value: T.rain > 0 ? (100 * T.run / T.rain).toFixed(0) : '0', unit: '%' },
        { label: 'Wetting front', value: (frontOf(T, p) / 10).toFixed(1), unit: 'cm', hint: 'F ÷ Δθ' },
        { label: 'Hollows hold', value: s.Sd.toFixed(1), unit: 'mm', hint: 'Kamphorst' }
      ];
    }
    if (p.setup === 'transpire') {
      const Pt = S.pt, Lf = Pt.L || leafOf(p), Q = Pt.Q || 0;
      const r = [
        { label: 'Bubble speed v = Q/πr²', value: (Q / (Math.PI * Math.pow(p.bore / 1000, 2)) * 60000).toFixed(1), unit: 'mm/min', flag: 'accent' },
        { label: 'Water taken up', value: (Q * 1e6 * 3600).toFixed(2), unit: 'mL/h' },
        { label: 'Transpiration E', value: (Lf.E * 1000).toFixed(2), unit: 'mmol/m²/s' },
        { label: 'Light at the leaves', value: lightOf(p).toFixed(0), unit: 'µmol/m²/s', hint: p.lamp ? 'falls as 1/d²' : 'lamp off' },
        { label: 'Stomata open', value: (Lf.open * 100).toFixed(0), unit: '%' },
        { label: 'Vapour deficit', value: Lf.vpd.toFixed(2), unit: 'kPa', hint: 'leaf to air' },
        { label: 'Leaf temperature', value: Lf.Tl.toFixed(1), unit: '°C', hint: 'air ' + p.airT + ' °C' },
        { label: 'A tree, 200 m² of such leaves', value: (Lf.E * 200 * 18.015e-3 * 3600 * 12).toFixed(0), unit: 'L/day', hint: '12 hours of this' }
      ];
      if (p.bag) r.push({ label: 'Humidity in the bag', value: Pt.rh.toFixed(0), unit: '%', flag: Pt.rh > 95 ? 'warn' : null });
      return r;
    }
    if (p.setup === 'drivers') {
      const W = S.w, R = worldRates(W, worldOpts(p));
      return [
        { label: 'Evaporation', value: (R.Eo + R.ET).toFixed(0), unit: 'k km³/yr', flag: 'accent', hint: 'sea 413 + land 73 today' },
        { label: 'Rain and snow', value: R.P.toFixed(0), unit: 'k km³/yr' },
        { label: 'Rivers to the sea', value: R.river.toFixed(1), unit: 'k km³/yr', hint: 'gravity' },
        { label: 'Water in the air', value: W.air.toFixed(1), unit: 'k km³', hint: 'normal 12.9' },
        { label: 'τ_air = air ÷ rain', value: R.P > 0.01 ? (W.air / R.P * 365.25).toFixed(1) : '∞', unit: 'days' },
        { label: 'Sunlight used: L·E', value: R.energy.toFixed(0), unit: 'W/m²', hint: 'of 161 at the ground' },
        { label: 'Soil water', value: (100 * W.soil / W0.soil).toFixed(0), unit: '% of normal' },
        { label: 'Glaciers out', value: R.iceOut.toFixed(2), unit: 'k km³/yr' }
      ];
    }
    const Lw = S.lk, o = lakeOf(p);
    return [
      { label: 'Dye left C = C₀e^(−t/τ)', value: Lw.C.toFixed(1), unit: '%', flag: 'accent' },
      { label: 'Years since the dye', value: Lw.t < 10 ? Lw.t.toFixed(2) : fmtN(Lw.t), unit: 'yr' },
      { label: 'τ = V ÷ outflow', value: isFinite(o.tauDye) ? sig(o.tauDye, 3) : '∞', unit: 'yr', hint: 'how long the dye stays' },
      { label: 'Water residence', value: isFinite(o.tauWater) ? sig(o.tauWater, 3) : '∞', unit: 'yr', hint: 'V ÷ all that leaves' },
      { label: 'Inflow', value: sig(o.inflow, 3), unit: 'km³/yr' },
      { label: 'Outflow', value: sig(o.out, 3), unit: 'km³/yr' },
      { label: 'Evaporation', value: sig(o.evap, 3), unit: 'km³/yr', hint: 'leaves the dye and salt behind' },
      { label: 'Salt, × the start', value: Lw.salt.toFixed(2), unit: '×', flag: Lw.salt > 2 ? 'warn' : null }
    ];
  }
  function equation(S) {
    const p = S.p;
    if (p.setup === 'reservoirs') { const B = bottle(p); return 'share = <i>V</i> ÷ <i>V</i><sub>all</sub>: ocean ' + fmtN(B.km3.ocean) + ' ÷ ' + fmtN(p.view === 'fresh' ? B.base : TOTAL) + ' km³ × ' + p.bottleL + ' L = <b>' + fmtN(B.mL.ocean, 1) + ' mL</b>; fresh lakes + rivers = <b>' + sig((B.mL.lakeFresh + B.mL.river) / DROP, 3) + ' drops</b>'; }
    if (p.setup === 'evaporate') { const C = S.ch, Sg = C.salt / Math.max(1, C.dishM) * 1000; return '<i>E</i> = <i>h</i><sub>m</sub><i>A</i>(<i>a</i><sub>w</sub>ρ<sub>sat</sub>(<i>T</i><sub>w</sub>) − ρ<sub>air</sub>) = ' + hmOf(p.fan).toFixed(4) + ' m/s × ' + (C.Aw * 1e4).toFixed(0) + ' cm² × (' + aw(Sg).toFixed(3) + ' × ' + rhoSat(C.Tw).toFixed(1) + ' − ' + C.rv.toFixed(1) + ') g/m³ = <b>' + (C.E * 3600).toFixed(1) + ' g/h</b>'; }
    if (p.setup === 'rain') { const s = soilOf(p), T = S.tr, tp = ponding(p, p.rate); return '<i>f</i> = <i>K</i><sub>s</sub>(1 + ψΔθ/<i>F</i>) = ' + s.Ks.toFixed(1) + ' × (1 + ' + s.psi.toFixed(0) + ' × ' + s.dth.toFixed(3) + ' / ' + Math.max(0.01, T.F).toFixed(1) + ') = <b>' + (T.cap > 1e6 ? '∞' : (T.cap || 0).toFixed(1)) + ' mm/h</b> · <i>t</i><sub>p</sub> = <i>K</i><sub>s</sub>ψΔθ / <i>i</i>(<i>i</i> − <i>K</i><sub>s</sub>) = <b>' + (isFinite(tp.tp) ? tp.tp.toFixed(1) + ' min' : 'never') + '</b>'; }
    if (p.setup === 'transpire') { const Pt = S.pt, Lf = Pt.L || leafOf(p); return '<i>v</i> = <i>E</i>·<i>A</i><sub>leaf</sub> ÷ π<i>r</i>² = ' + (Lf.E * 1000).toFixed(2) + ' mmol/m²/s × 18 g/mol × ' + p.area + ' cm² ÷ (π × ' + p.bore.toFixed(2) + '² mm²) = <b>' + ((Pt.Q || 0) / (Math.PI * Math.pow(p.bore / 1000, 2)) * 60000).toFixed(1) + ' mm/min</b>'; }
    if (p.setup === 'drivers') { const W = S.w, R = worldRates(W, worldOpts(p)); return 'τ<sub>air</sub> = <i>V</i><sub>air</sub> ÷ <i>P</i> = ' + W.air.toFixed(1) + ' ÷ ' + R.P.toFixed(0) + ' thousand km³/yr = <b>' + (R.P > 0.01 ? (W.air / R.P * 365.25).toFixed(1) + ' days' : '∞') + '</b> · <i>L</i>·<i>E</i> ÷ area = <b>' + R.energy.toFixed(0) + ' W/m²</b>'; }
    const Lw = S.lk, o = lakeOf(p);
    return '<i>C</i> = <i>C</i><sub>0</sub> e<sup>−<i>t</i>/τ</sup>, τ = <i>V</i>/<i>Q</i><sub>out</sub> = ' + fmtN(o.Lk.V, 1) + ' ÷ ' + sig(o.out, 3) + ' km³/yr = <b>' + (isFinite(o.tauDye) ? ageSay(o.tauDye) : '∞') + '</b> → after ' + ageSay(Lw.t) + ': <b>' + Lw.C.toFixed(1) + ' %</b>';
  }
  const EQ_NOTE = S => ({
    reservoirs: '<b>What the shares do not say:</b> the 0.3 % of fresh water in lakes and rivers is renewed every few years or weeks, while the ice and deep groundwater took thousands of years to gather. A store’s size is not its usefulness — its <b>flow</b> is.',
    evaporate: '<b>Δρ, not temperature, moves the vapour</b>: water evaporates whenever the air holds less than the surface does — even cold water into dry air. The curve is Clausius–Clapeyron (Buck’s form): about 7 % more for each degree. The hot plate’s power is what keeps the dish warm; with it off, evaporation <b>cools</b> the water below the air.',
    rain: '<b>Green–Ampt</b> treats the wet zone as a slab with a sharp front, pulled down by suction ψ and gravity. Real soils have cracks, worm holes and crusts, so a field’s Ks can differ several times from Rawls’ averages — but the shape holds: <b>f falls toward Ks</b>, and any rain faster than that must pond and run off.',
    transpire: '<b>A potometer measures uptake, not loss</b>: a few % of the water stays in the shoot. Stomata respond to light, to dry air and to the leaf’s own warmth; the jelly shows where they are. The tree’s figure assumes 12 hours of this rate on 200 m² of leaves.',
    drivers: '<b>Sunlight lifts, gravity returns.</b> Evaporation here is energy-limited — doubling the Sun doubles it — which overstates it; real evaporation also depends on wind and humidity. With no gravity nothing falls: the boxes stop balancing and water piles up in the air.',
    residence: '<b>τ = V/Q</b> holds for a well-mixed store. Real lakes stratify, and a surface spill can leave faster than τ says. Evaporation removes water but not dye or salt, so a lake that loses most of its water to the air keeps what the rivers bring — that is how the sea and salt lakes got salty.'
  })[S.p.setup];

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const is = v => S => S.p.setup === v;
  L.register({
    id: 'g6d-water-cycle',
    grade: 6, unit: '6D', topics: ['D1'],
    subject: 'earth',
    name: 'The Water Cycle Machine',
    chapter: 'Water, Atmosphere and Weather',
    exams: ['NGSS MS-ESS2-4', 'NGSS MS-ESS2-C', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to turn the view · drag the knob, the valve, the tray’s end, the lamp, the Sun or the river',
    lede: 'Six experiments on the water cycle, each worked out from the physics. Pour all of <b>Earth’s water</b> into one bottle and count the drops that are fresh. Seal a dish of water under an ice-cold lid and make <b>rain in a box</b> — the air saturates, a real cloud forms, and fresh water drips out of salt water. ' +
      'Rain on a tray of soil and watch the <b>wetting front</b> sink until the soil can take no more. Put a shoot in a <b>potometer</b> and time the bubble. Then turn down the <b>Sun</b> and <b>gravity</b> on a whole planet, and dye a real lake to see how long its water stays.',

    params: preset({}),
    presets: [
      { name: 'All of Earth’s water in one litre', params: preset({}) },
      { name: 'Only the fresh water: where is it?', params: preset({ view: 'fresh' }) },
      { name: 'Melt every ice sheet and glacier', params: preset({ melt: 100 }) },
      { name: 'Hot water, ice-cold lid: rain in a box', params: preset({ setup: 'evaporate' }) },
      { name: 'No lid: the room takes the vapour', params: preset({ setup: 'evaporate', lid: 'open' }) },
      { name: 'Hot plate off, no lid: evaporation cools the water', params: preset({ setup: 'evaporate', lid: 'open', power: 0, roomRH: 30, evLapse: 300 }) },
      { name: 'Seawater in, fresh water out', params: preset({ setup: 'evaporate', salt: 35, power: 60, evLapse: 300 }) },
      { name: 'Too warm to drip: the lid above the dew point', params: preset({ setup: 'evaporate', lidT: 18, power: 20, evLapse: 300 }) },
      { name: 'A fan over the dish', params: preset({ setup: 'evaporate', fan: 2.5, lid: 'open', power: 30 }) },
      { name: 'Molecules at the surface: two-way traffic', params: preset({ setup: 'evaporate', evView: 'molecules' }) },
      { name: 'Loam in a 40 mm/h storm', params: preset({ setup: 'rain' }) },
      { name: 'Sand: every drop soaks in', params: preset({ setup: 'rain', soil: 'sand', rate: 80 }) },
      { name: 'Clay: it ponds within minutes', params: preset({ setup: 'rain', soil: 'clay' }) },
      { name: 'A car park in the same storm', params: preset({ setup: 'rain', soil: 'paved' }) },
      { name: 'Grass on the loam', params: preset({ setup: 'rain', cover: 'grass' }) },
      { name: 'The same storm on soaked ground', params: preset({ setup: 'rain', wet: 90 }) },
      { name: 'Sunflower under the lamp', params: preset({ setup: 'transpire' }) },
      { name: 'Lamp off: the stomata close', params: preset({ setup: 'transpire', lamp: false }) },
      { name: 'Jelly on the underside', params: preset({ setup: 'transpire', vas: 'lower', plant: 'bean' }) },
      { name: 'A breeze from the fan', params: preset({ setup: 'transpire', wind: 3 }) },
      { name: 'In a polythene bag', params: preset({ setup: 'transpire', bag: true, tpLapse: 300 }) },
      { name: 'Today’s world', params: preset({ setup: 'drivers' }) },
      { name: 'Switch off the Sun', params: preset({ setup: 'drivers', sun: 0, drLapse: 30 }) },
      { name: 'Switch off gravity', params: preset({ setup: 'drivers', grav: 0, drLapse: 30 }) },
      { name: 'A world without plants', params: preset({ setup: 'drivers', plants: 0, drLapse: 365 }) },
      { name: 'Dye in Lake Erie', params: preset({ setup: 'residence' }) },
      { name: 'Dye in Lake Superior', params: preset({ setup: 'residence', lake: 'superior', lkLapse: 100 }) },
      { name: 'Close the outlet: a salt lake', params: preset({ setup: 'residence', lake: 'geneva', closed: true, lkLapse: 10 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The bottle', when: is('reservoirs'), items: [
        { key: 'bottleL', label: 'All the water poured into', min: 0.5, max: 5, step: 0.5, unit: 'L', restructure: true, fmt: v => v.toFixed(1) },
        { key: 'view', type: 'select', label: 'Pour in', restructure: true, options: [{ value: 'all', label: 'all of Earth’s water' }, { value: 'fresh', label: 'only its fresh water' }] },
        { key: 'melt', label: 'Melt the land ice', min: 0, max: 100, step: 5, unit: '%', restructure: true } ] },
      { group: 'The dish', when: is('evaporate'), items: [
        { key: 'power', label: 'Hot plate', min: 0, max: 80, step: 1, unit: 'W', restructure: true },
        { key: 'dish', label: 'Dish across', min: 6, max: 20, step: 1, unit: 'cm', restructure: true },
        { key: 'salt', label: 'Salt in the water', min: 0, max: 260, step: 5, unit: 'g/kg', restructure: true } ] },
      { group: 'The chamber', when: is('evaporate'), items: [
        { key: 'lid', type: 'select', label: 'Lid', restructure: true, options: [{ value: 'ice', label: 'glass with ice' }, { value: 'glass', label: 'plain glass' }, { value: 'open', label: 'none' }] },
        { key: 'lidT', label: 'Lid temperature', min: -10, max: 25, step: 1, unit: '°C', restructure: true, when: S => S.p.lid === 'ice' },
        { key: 'fan', label: 'Fan', min: 0, max: 3, step: 0.1, unit: 'm/s', restructure: true, fmt: v => v.toFixed(1) },
        { key: 'room', label: 'Room', min: 10, max: 35, step: 1, unit: '°C', restructure: true },
        { key: 'roomRH', label: 'Room humidity', min: 10, max: 90, step: 5, unit: '%', restructure: true },
        { key: 'evView', type: 'select', label: 'Look closer at', display: true, options: [{ value: 'bars', label: 'vapour: water, air, lid' }, { value: 'molecules', label: 'molecules at the surface' }] },
        { key: 'evLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 10, label: '×10' }, { value: 60, label: 'a minute a second' }, { value: 300, label: '5 minutes a second' }] } ] },
      { group: 'The storm', when: is('rain'), items: [
        { key: 'rate', label: 'Rain', min: 2, max: 150, step: 1, unit: 'mm/h', restructure: true },
        { key: 'dur', label: 'For', min: 5, max: 120, step: 5, unit: 'min', restructure: true },
        { key: 'rnLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 30, label: '×30' }, { value: 60, label: 'a minute a second' }, { value: 180, label: '3 minutes a second' }] } ] },
      { group: 'The tray of soil', when: is('rain'), items: [
        { key: 'soil', type: 'select', label: 'Soil', restructure: true, options: Object.keys(SOILS).map(k => ({ value: k, label: SOILS[k].name.toLowerCase() })) },
        { key: 'wet', label: 'Already wet', min: 0, max: 95, step: 5, unit: '% of full', restructure: true, when: S => S.p.soil !== 'paved' },
        { key: 'cover', type: 'select', label: 'On top', restructure: true, when: S => S.p.soil !== 'paved', options: [{ value: 'bare', label: 'bare' }, { value: 'grass', label: 'grass' }, { value: 'mulch', label: 'straw mulch' }] },
        { key: 'rough', label: 'Surface roughness', min: 2, max: 25, step: 1, unit: 'mm', restructure: true, when: S => S.p.soil !== 'paved' },
        { key: 'slope', label: 'Slope', min: 1, max: 30, step: 1, unit: '°', restructure: true } ] },
      { group: 'The shoot', when: is('transpire'), items: [
        { key: 'plant', type: 'select', label: 'Plant', restructure: true, options: Object.keys(PLANTS).map(k => ({ value: k, label: PLANTS[k].name.toLowerCase() })) },
        { key: 'area', label: 'Leaf area', min: 20, max: 300, step: 5, unit: 'cm²', restructure: true },
        { key: 'vas', type: 'select', label: 'Petroleum jelly', restructure: true, options: [{ value: 'none', label: 'none' }, { value: 'upper', label: 'on top' }, { value: 'lower', label: 'underneath' }, { value: 'both', label: 'both sides' }] } ] },
      { group: 'Around it', when: is('transpire'), items: [
        { key: 'lamp', type: 'toggle', label: 'Lamp on', restructure: true },
        { key: 'lampD', label: 'Lamp distance', min: 10, max: 100, step: 1, unit: 'cm', restructure: true, when: S => S.p.lamp },
        { key: 'airT', label: 'Air', min: 5, max: 40, step: 1, unit: '°C', restructure: true },
        { key: 'rh', label: 'Humidity', min: 10, max: 95, step: 5, unit: '%', restructure: true },
        { key: 'wind', label: 'Fan', min: 0, max: 4, step: 0.1, unit: 'm/s', restructure: true, fmt: v => v.toFixed(1) },
        { key: 'bag', type: 'toggle', label: 'Polythene bag over it', restructure: true } ] },
      { group: 'The potometer', when: is('transpire'), items: [
        { key: 'bore', type: 'select', label: 'Capillary radius', restructure: true, options: [{ value: 0.25, label: '0.25 mm' }, { value: 0.5, label: '0.5 mm' }, { value: 0.75, label: '0.75 mm' }, { value: 1, label: '1 mm' }] },
        { key: 'side', type: 'select', label: 'Microscope on', display: true, options: [{ value: 'lower', label: 'the underside' }, { value: 'upper', label: 'the top' }] },
        { key: 'tpLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 10, label: '×10' }, { value: 60, label: 'a minute a second' }, { value: 300, label: '5 minutes a second' }] } ] },
      { group: 'The drivers', when: is('drivers'), items: [
        { key: 'sun', label: 'Sunlight', min: 0, max: 150, step: 5, unit: '% of today', restructure: true },
        { key: 'grav', label: 'Gravity', min: 0, max: 1.5, step: 0.05, unit: 'g', restructure: true, fmt: v => v.toFixed(2) },
        { key: 'plants', label: 'Plants', min: 0, max: 150, step: 5, unit: '% of today', restructure: true },
        { key: 'drLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'a day a second' }, { value: 7, label: 'a week a second' }, { value: 30, label: 'a month a second' }, { value: 365, label: 'a year a second' }, { value: 3650, label: '10 years a second' }] } ] },
      { group: 'The lake', when: is('residence'), items: [
        { key: 'lake', type: 'select', label: 'Lake', restructure: true, options: Object.keys(LAKES).map(k => ({ value: k, label: LAKES[k].name.replace('Lake ', '') })) },
        { key: 'inflow', label: 'Rivers in', min: 0, max: 200, step: 5, unit: '% of normal', restructure: true },
        { key: 'closed', type: 'toggle', label: 'Dam the outlet', restructure: true },
        { key: 'lkLapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 0.1, label: 'a month a second' }, { value: 1, label: 'a year a second' }, { value: 10, label: '10 years a second' }, { value: 100, label: '100 years a second' }] } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ reservoirs: 'What is in the bottle', evaporate: 'The chamber, minute by minute', rain: 'Rain in, soaking in, running off', transpire: 'The bubble’s journey', drivers: 'The boxes, against their normal', residence: 'Dye at the sampler' })[S.p.setup], draw: plot1,
        hover: (S, x) => S.p.setup === 'rain' ? [{ label: 'minute', value: x.toFixed(1) }] : null },
      { title: S => ({ reservoirs: 'Residence against size, every store', evaporate: 'How much vapour air can hold', rain: 'Runoff for every soil and storm', transpire: 'Transpiration against humidity', drivers: 'What each driver powers', residence: 'Residence against size: lakes and Earth’s stores' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · analysing data', params: preset({}),
        q: 'Gleick’s inventory: 1,386 million km³ of water on Earth, of which 35.0 million km³ is fresh. If all of it filled a 1 L bottle, how many millilitres would be fresh?',
        predict: { label: 'Fresh water in 1 L', unit: 'mL', tol: 0.02 },
        measure: S => { const B = bottle(S.p); return RES.filter(r => !r.salt).reduce((s, r) => s + B.mL[r.k], 0); },
        working: '35.0 ÷ 1,386 = 2.53 %, and 2.53 % of 1,000 mL = <b>25.3 mL</b> — and 17.4 mL of that is ice, 7.6 mL is underground. Fresh lakes and rivers together are just over one drop.' },
      { source: 'CAST pattern · a model of a system', params: preset({}),
        q: 'The air holds 12,900 km³ of water and 486,000 km³ fall as rain and snow each year. On average, how many days does a water molecule stay in the air?',
        predict: { label: 'Days in the air', unit: 'days', tol: 0.02 },
        measure: () => residence('air') * 365.25,
        working: 'Residence = store ÷ flow = 12,900 ÷ 486,000 = 0.0265 yr × 365 = <b>9.7 days</b>. The air’s water is replaced about 37 times a year.' },
      { source: 'NGSS MS-ESS2-4 · condensation', params: preset({ setup: 'evaporate', room: 20, roomRH: 50 }),
        q: 'The room is at 20 °C and 50 % relative humidity. A glass of iced water is cooled slowly. At what temperature does dew first appear on it?',
        predict: { label: 'Dew point', unit: '°C', tol: 0.03 },
        measure: S => dewOf(S.p.roomRH / 100 * es(S.p.room)),
        working: 'Saturated air at 20 °C holds 17.3 g/m³; at 50 % it holds 8.6 g/m³. Air holding 8.6 g/m³ is saturated at <b>9.3 °C</b> — the dew point. Below it, vapour condenses on the glass.' },
      { source: 'CAST pattern · energy in the water cycle', params: preset({ setup: 'evaporate' }),
        q: 'The chamber holds 0.072 m³ of air, saturated at 30 °C (30.3 g/m³). It cools to 20 °C, where saturated air holds 17.3 g/m³. How much water condenses?',
        predict: { label: 'Water condensed', unit: 'g', tol: 0.03 },
        measure: () => (rhoSat(30) - rhoSat(20)) * CH.V,
        working: '(30.3 − 17.3) g/m³ × 0.072 m³ = <b>0.94 g</b> — about 19 drops, from air you could not see any water in.' },
      { source: 'Chow, Maidment & Mays, Example 4.4.1 · ponding time', params: preset({ setup: 'rain', soil: 'siltyClay', wet: 40, rate: 10, cover: 'bare' }),
        q: 'Silty clay (Ks = 0.5 mm/h, ψ = 292 mm, θe = 0.423), 40 % saturated to start, under rain of 10 mm/h. With Green–Ampt, when does water begin to pond?',
        predict: { label: 'Ponding time', unit: 'min', tol: 0.02 },
        measure: S => ponding(S.p, S.p.rate).tp,
        working: 'Δθ = 0.6 × 0.423 = 0.254; Fp = Ks ψ Δθ ÷ (i − Ks) = 0.5 × 292 × 0.254 ÷ 9.5 = 3.9 mm; tp = Fp ÷ i = 0.39 h = <b>23.4 min</b>. At 30 mm/h it ponds in 2.5 minutes.' },
      { source: 'CAST pattern · human impacts on runoff', params: preset({ setup: 'rain', soil: 'paved', rate: 40, dur: 30 }),
        q: 'A 0.18 m² tray of pavement gets 40 mm/h of rain for 30 minutes. About how many litres run off it?',
        predict: { label: 'Runoff', unit: 'L', tol: 0.03 },
        measure: S => trayRun(S.p, S.p.dur + 30).run * TRAY.L * TRAY.W,
        working: '40 mm/h × 0.5 h = 20 mm; 20 mm × 0.18 m² = 3.6 L. Nearly all of it runs off: <b>3.6 L</b> (a fraction of a millimetre stays in the hollows). The loam beside it sheds about 1.4 L of the same storm.' },
      { source: 'CAST pattern · energy drives the cycle', params: preset({ setup: 'drivers' }),
        q: '486,000 km³ of water evaporate from Earth each year; each kilogram needs 2.47 MJ. Spread over Earth’s 510 million km², how many watts per square metre is that?',
        predict: { label: 'Power', unit: 'W/m²', tol: 0.03 },
        measure: S => worldRates(W0, worldOpts(S.p)).energy,
        working: '4.86 × 10¹⁷ kg × 2.47 × 10⁶ J = 1.2 × 10²⁴ J a year; ÷ 3.16 × 10⁷ s ÷ 5.1 × 10¹⁴ m² = <b>74 W/m²</b> — nearly half the sunlight that reaches the ground.' },
      { source: 'CAST pattern · residence time', params: preset({ setup: 'residence', lake: 'erie' }),
        q: 'Lake Erie holds 484 km³ and its outflow replaces it in 2.6 years. A pulse of dye is mixed through it. What percentage is left after 5.2 years?',
        predict: { label: 'Dye left', unit: '%', tol: 0.02 },
        measure: S => 100 * Math.exp(-5.2 / lakeOf(S.p).tauDye),
        working: '5.2 years is two residence times: e⁻² = <b>13.5 %</b>. Not zero — the outflow carries away a share of what is there, not a fixed amount.' }
    ],

    walkthrough: [
      { title: 'Where is the water?', ask: 'Pour all of Earth’s water into one litre. How much of it could you drink from a lake or river?', reveal: 'About one drop — 0.07 mL in fresh lakes, 0.0015 mL in rivers. 965 mL is ocean, 17 mL is ice, 17 mL is underground. Fresh surface water is 0.3 % of the fresh water, which is itself 2.5 % of the whole.', params: preset({}) },
      { title: 'What is a cloud?', ask: 'Watch the chamber with the ice lid. The white mist inside — is it water vapour?', reveal: 'No. Vapour is invisible. The air has more vapour than it can hold at its temperature, so the extra condenses into tiny drops of <b>liquid</b>. A cloud is liquid water (or ice), not gas.', params: preset({ setup: 'evaporate', power: 60 }) },
      { title: 'Why the cold lid?', ask: 'Set the lid to 18 °C. Does rain still fall into the cylinder?', reveal: 'Not once the lid is above the air’s dew point. Condensation needs a surface colder than the dew point — the cold lid is the top of the atmosphere, where rising air cools.', params: preset({ setup: 'evaporate', lidT: 18, power: 20, evLapse: 300 }) },
      { title: 'Does evaporation need heat?', ask: 'Turn the hot plate off and take the lid away. Does the water still evaporate? What happens to its temperature?', reveal: 'It still evaporates, slowly — and it cools below the room, because every gram carries away 2.45 kJ. That energy, on Earth, comes from the Sun.', params: preset({ setup: 'evaporate', lid: 'open', power: 0, roomRH: 30, evLapse: 300 }) },
      { title: 'Soak in or run off?', ask: 'The same 40 mm/h storm falls on sand, loam and clay. Which runs off first, and why?', reveal: 'Clay, within minutes; sand, never. Each soil can take water in only so fast — Ks plus the pull of the dry soil below the front. As the wet zone thickens, that pull weakens and the rate falls toward Ks.', params: preset({ setup: 'rain', soil: 'clay' }) },
      { title: 'Where do the stomata face?', ask: 'Coat the bean leaves with jelly, first on top, then underneath. Which slows the bubble more?', reveal: 'Underneath: a bean has 281 stomata per mm² below and 40 on top. Water leaves the plant as vapour through those pores — that is transpiration, the biological part of the cycle.', params: preset({ setup: 'transpire', plant: 'bean', vas: 'lower' }) },
      { title: 'Two drivers', ask: 'Switch off the Sun. Do the rivers stop at once?', reveal: 'No. Rain stops within weeks, but rivers keep running for years on what is stored in the soil and underground — gravity still pulls it to the sea. Switch off gravity instead and evaporation goes on, but nothing falls: the air fills up.', params: preset({ setup: 'drivers', sun: 0, drLapse: 30 }) },
      { title: 'How long does water stay?', ask: 'Dye Lake Erie and Lake Superior. Which clears in a lifetime?', reveal: 'Erie: its 484 km³ is replaced in 2.6 years. Superior’s 12,100 km³ takes 191 years. A pollutant stays as long as the water does.', params: preset({ setup: 'residence', lake: 'superior', lkLapse: 100 }) }
    ],

    quiz: [
      { q: 'If all Earth’s water were 100 L, about how much would be fresh water in lakes and rivers?', options: ['less than 10 mL', 'about 1 L', 'about 2.5 L', 'about 30 L'], answer: 0, why: 'Fresh water is 2.5 L, but most is ice and groundwater; lakes and rivers hold about 7 mL of the 100 L. Pour it in the bottle and count.' },
      { q: 'A cloud is made of', options: ['tiny drops of liquid water or ice', 'water vapour', 'steam', 'dust only'], answer: 0, why: 'Vapour is an invisible gas. You see a cloud because the vapour has condensed into drops — watch the chamber when the air passes 100 %.' },
      { q: 'Rain falls at 30 mm an hour on soil that can take in 10 mm an hour. What happens to the rest?', options: ['it ponds and runs off', 'it soaks in later, all of it', 'it evaporates at once', 'the soil takes it in faster'], answer: 0, why: 'Once the rain is faster than the soil can take it, water ponds on the surface; when the hollows fill, it runs off.' },
      { q: 'Which two things power the water cycle?', options: ['energy from the Sun and gravity', 'wind and tides', 'Earth’s heat and the Moon', 'plants and animals'], answer: 0, why: 'Sunlight evaporates water and lifts it; gravity brings it down as rain and runs it downhill to the sea. Switch either off and the cycle stops.' },
      { q: 'Water stays in the atmosphere for about', options: ['9 days', '9 hours', '9 years', '900 years'], answer: 0, why: '12,900 km³ in the air ÷ 486,000 km³ falling a year = 9.7 days. The ocean, by contrast, keeps its water about 3,200 years.' }
    ],

    notes: '<p><b>The reservoirs.</b> 96.5 % of Earth’s water is in the oceans. Of the 2.5 % that is fresh, 69 % is frozen in ice sheets and glaciers and 30 % is underground; lakes, rivers, the soil and the air share the last 1 %.</p>' +
      '<p><b>Evaporation and condensation.</b> Water evaporates when the air holds less vapour than the water’s surface does; warm water and dry, moving air speed it. Air can hold more vapour the warmer it is — about 7 % more each degree. Cool air below its dew point and the extra condenses: dew on a cold surface, or a cloud of drops in the air.</p>' +
      '<p><b>Precipitation, infiltration and runoff.</b> Drops grow until they are too heavy to stay up; a 2 mm drop falls at 6.5 m/s. On the ground, water soaks in as fast as the soil allows; rain faster than that ponds and runs off. Sand takes water fast, clay slowly, pavement not at all.</p>' +
      '<p><b>Transpiration.</b> Plants pull water from the soil and lose it as vapour through stomata, mostly on the undersides of leaves. Over land, transpiration returns more water to the air than evaporation from soil and lakes.</p>' +
      '<p><b>Drivers and residence.</b> The Sun’s energy lifts water; gravity returns it. Each store keeps its water for about its volume ÷ its flow: days in the air, weeks in rivers, years in lakes, thousands of years in the ocean and ice.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “The water cycle is one circle: sea → cloud → rain → river → sea.” Most rain falls straight back into the ocean; a drop can skip steps or wait 10,000 years in ice. The cycle is a set of stores and flows. And “clouds are water vapour” — they are liquid drops.</div>'
  });


  L.models = L.models || {};
  L.models['g6d-water-cycle'] = { es, rhoSat, latent, dewOf, dewOfRho, aw, RES, RESK, TOTAL, FRESH, residence, bottle, THROUGH,
    CH, hcOf, hmOf, chamberStart, chamberStep, chamberRun, chamberRates, rhOf,
    SOILS, COVER, soilOf, trayStart, trayStep, trayRun, ponding, frontOf, dropD0, dropV,
    PLANTS, lightOf, leafOf, potStart, potStep, bubbleSpeed,
    W0, FL0, TAU_AIR, worldStart, worldRates, worldStep,
    LAKES, lakeOf, lakeStart, lakeStep };
})(window.InsightLab);
