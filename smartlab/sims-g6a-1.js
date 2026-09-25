/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-1  The Living Tank — Parts, Boundaries and Flows
   (A1 Systems and subsystems · A2 Boundaries, inputs and outputs)

   A planted 54-litre aquarium, integrated as the coupled system it is:
     · dissolved O₂ — plants and algae make it in the light, everything
       respires it, bacteria burn it oxidising ammonia, the surface trades it
       with the air (published solubility, Benson & Krause);
     · carbon — the full carbonate system (DIC and alkalinity → CO₂, HCO₃⁻,
       CO₃²⁻, pH, with the Harned constants), so plants drive pH up by day and
       respiration pulls it down by night;
     · nitrogen — fish excrete ammonia, two bacterial populations on the
       filter media turn it to nitrite and nitrate (Monod kinetics, growing
       from a seed in a new filter), plants and algae take it up; the toxic
       free-NH₃ fraction follows pH and temperature (Emerson);
     · heat — heater and thermostat, lamp light absorbed as heat, losses to
       the room and to evaporation;
     · a shoal — every fish an agent following three local rules.
   Nothing is keyframed: every number on the stage was integrated.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, fmt, E, Camera } = L;

  /* ---------------- physical constants and chemistry ---------------- */
  const MW_O2 = 31.998, MW_CO2 = 44.009, MW_C = 12.011, MW_N = 14.007, MW_NH3 = 17.031;
  const CP_W = 4186;                         // J kg⁻¹ K⁻¹
  const LV = 2.44e6;                         // J kg⁻¹, latent heat at ~25 °C
  const E_PHOTON = 0.2175;                   // J per µmol of PAR photons (mean ~550 nm)
  const E_O2 = 478e3;                        // J stored per mol O₂ evolved (glucose: 2870 kJ / 6)
  const PPM_CO2 = 420e-6;                    // atm, today's air

  /* O₂ solubility in fresh water at 1 atm, mg/L (Benson & Krause 1984) */
  function o2sat(Tc) {
    const T = Tc + 273.15;
    return Math.exp(-139.34411 + 1.575701e5 / T - 6.642308e7 / (T * T) +
                    1.2438e10 / (T * T * T) - 8.621949e11 / (T * T * T * T));
  }
  /* CO₂ solubility, mol L⁻¹ atm⁻¹ (Weiss 1974, fresh water) */
  function kHco2(Tc) {
    const T = Tc + 273.15;
    return Math.exp(-58.0931 + 90.5069 * (100 / T) + 22.294 * Math.log(T / 100));
  }
  /* carbonic acid and water constants (Harned & Davis 1943; Harned & Scholes 1941) */
  const pK1 = Tk => 3404.71 / Tk + 0.032786 * Tk - 14.8435;
  const pK2 = Tk => 2902.39 / Tk + 0.02379 * Tk - 6.4980;
  const pKw = Tk => 4470.99 / Tk - 6.0875 + 0.01706 * Tk;
  /* ammonium ⇌ ammonia (Emerson et al. 1975) */
  const pKa = Tk => 0.09018 + 2729.92 / Tk;
  /* saturation vapour pressure, kPa (Tetens) */
  const esat = Tc => 0.6108 * Math.exp(17.27 * Tc / (Tc + 237.3));

  /* Carbonate speciation: given DIC (mmol/L) and carbonate alkalinity
     (meq/L), find [H⁺] by bisection on the charge balance
       Alk = HCO₃⁻ + 2 CO₃²⁻ + OH⁻ − H⁺ .
     Returns pH and CO₂, HCO₃⁻, CO₃²⁻ in mmol/L. */
  function speciate(DIC, Alk, Tc) {
    const Tk = Tc + 273.15;
    const K1 = Math.pow(10, -pK1(Tk)), K2 = Math.pow(10, -pK2(Tk)), Kw = Math.pow(10, -pKw(Tk));
    const dic = Math.max(1e-9, DIC) * 1e-3, alk = Alk * 1e-3;
    let lo = 2, hi = 12;
    for (let it = 0; it < 46; it++) {
      const pH = 0.5 * (lo + hi), H = Math.pow(10, -pH);
      const den = H * H + K1 * H + K1 * K2;
      const a1 = K1 * H / den, a2 = K1 * K2 / den;
      const f = dic * (a1 + 2 * a2) + Kw / H - H - alk;
      if (f > 0) hi = pH; else lo = pH;          // f rises with pH
    }
    const pH = 0.5 * (lo + hi), H = Math.pow(10, -pH);
    const den = H * H + K1 * H + K1 * K2;
    return { pH, co2: dic * H * H / den * 1e3, hco3: dic * K1 * H / den * 1e3, co3: dic * K1 * K2 / den * 1e3 };
  }
  /* DIC (mmol/L) of water at air equilibrium for a given alkalinity */
  function dicAtAir(Alk, Tc) {
    const co2eq = kHco2(Tc) * PPM_CO2 * 1e3;      // mmol/L
    let lo = 0, hi = 20;
    for (let it = 0; it < 50; it++) {
      const m = 0.5 * (lo + hi);
      if (speciate(m, Alk, Tc).co2 > co2eq) hi = m; else lo = m;
    }
    return 0.5 * (lo + hi);
  }
  function freeNH3frac(pH, Tc) { return 1 / (1 + Math.pow(10, pKa(Tc + 273.15) - pH)); }

  /* ---------------- the tank ---------------- */
  const TANK = { L: 0.60, W: 0.30, H: 0.36, water: 0.33, gravel: 0.05, glass: 0.006 };
  const AREA = TANK.L * TANK.W;                                   // m², the free surface
  const VOL = TANK.L * TANK.W * (TANK.water - TANK.gravel) * 1000  // L of open water
            + TANK.L * TANK.W * TANK.gravel * 0.40 * 1000;          // + pore water in the gravel
  const UA = 4.0;              // W/K through glass and surface (a 54 L tank loses ~20 W at 5 K)
  const HEATER_W = 50;
  const PPE = 2.4;             // µmol PAR per joule of LED input (typical white LED fixture)
  const F_INTO = 0.55;         // fraction of the lamp's light that reaches the water
  const K_WATER = 0.8;         // m⁻¹, clear aquarium water
  const EPS_ALG = 0.25;        // m⁻¹ per (mg DW/L) of suspended algae
  const Z_PLANT = 0.15;        // m, mean depth of the leaves
  const EVAP_K = 0.018;        // kg h⁻¹ m⁻² kPa⁻¹ — about a litre a week from an open 60 cm tank

  /* biology — per gram dry weight, at 25 °C; C and N contents of each pool */
  const PLANT = { pmax: 10, ik: 90, resp: 0.6, kn: 0.05, kc: 1.0, bic: 0.40, cfrac: 0.40, nc: 0.075, turn: 0.0004 };
  // suspended algae: ~0.15 mg C per mg C per hour at saturation (1–2 doublings a day), Redfield N:C
  const ALGA  = { pmax: 150, ik: 60, resp: 7.5, kn: 1.0, kc: 0.8, bic: 0.30, cfrac: 0.45, nc: 0.176, loss: 0.012 };
  /* Redox bookkeeping, per mol: fixing C releases 1 O₂ and respiring it takes 1 back; assimilating
     nitrate-N releases 2 O₂ more (NO₃⁻ → NH₃), and nitrifying that N back takes 1.5 + 0.5. So
     Ω = O₂ + 1.5·NO₂⁻ + 2·NO₃⁻ − organic C is conserved in a sealed vessel — checked, not assumed. */
  const O2_PER_NO3N = 2 * MW_O2 / MW_N;     // 4.57 mg O₂ per mg nitrate-N assimilated
  const FISH = { wet: 0.40, cPerFish: 45, rO2: 0.45, q10: 2.2, nc: 0.24 };  // neon tetra: 0.4 g, 45 mg C
  const FOOD = { c: 0.45, n: 0.072 };        // flake food: 45 % C, 45 % protein → 7.2 % N
  const ASSIM = 0.8;
  // nitrifiers in a biofilm: slow maintenance losses, so a mature filter holds ammonia near 0.02 mg N/L
  const BACT = { mu1: 0.045, b1: 0.002, K1: 0.5, mu2: 0.030, b2: 0.002, K2: 0.5, Ko: 0.5, FAi: 0.5 };
  const DECAY = 0.02;          // h⁻¹, detritus at 25 °C
  const q10 = (T, q) => Math.pow(q, (T - 25) / 10);

  /* state layout */
  const O2 = 0, DIC = 1, TAN = 2, NO2 = 3, NO3 = 4, TW = 5, PC = 6, AC = 7, FC = 8,
        DC = 9, DN = 10, V1 = 11, V2 = 12, ALK = 13, HO2 = 14, HC = 15, NF = 16, SC = 17, NS = 18;
  /* The gravel of an established tank holds organic mulm that rots for months: a slow,
     steady source of CO₂ and ammonia and a steady O₂ demand, day and night. */
  const MULM = { k: 0.0003, nc: 0.10 };      // h⁻¹ at 25 °C (a ~140-day life), and its N:C

  /* ---------------- one vessel: the tank, or the sealed sphere ----------------
     cfg: vol (L), area (m²), open (air above) or closed (headspace air, L),
     parts switched on or off, the light it receives, what feeds its consumers. */
  function vessel(cfg) {
    const y = new Float64Array(NS);
    const V = cfg.vol, T0 = cfg.T0;
    y[O2] = o2sat(T0);
    y[ALK] = cfg.kh * 0.357;                              // meq/L per dKH
    y[DIC] = dicAtAir(y[ALK], T0) * MW_C;                 // mg C/L
    y[TAN] = 0.02; y[NO2] = 0.01; y[NO3] = cfg.no3 == null ? 2.5 : cfg.no3;   // mg N/L
    y[TW] = T0;
    y[PC] = cfg.plantsG * 1000 * PLANT.cfrac;              // mg C
    y[AC] = cfg.algaeC;                                   // mg C
    y[FC] = cfg.consumers * cfg.cEach;                    // mg C
    y[NF] = cfg.consumers;                                // how many are alive
    y[DC] = cfg.detC || 50; y[DN] = (cfg.detC || 50) * 0.10;
    y[V1] = cfg.v1; y[V2] = cfg.v2;
    y[SC] = cfg.mulm || 0;                                // mg C of mulm in the gravel
    if (cfg.headspace) {                                  // closed: the air inside is part of the system
      const nAir = 101.325 * cfg.headspace / (8.314 * (T0 + 273.15));   // mol of gas in the headspace
      y[HO2] = nAir * 0.2095 * MW_O2 * 1000;              // mg O₂
      y[HC] = nAir * PPM_CO2 * MW_C * 1000;               // mg C as CO₂
    }
    return { cfg, y, t: 0, heatOn: false, flux: {}, deaths: 0, dead: 0 };
  }

  /* the light the vessel's producers see, µmol m⁻² s⁻¹, at clock time tod (h) */
  function lightAt(cfg, tod) {
    if (cfg.window) {                                     // a windowsill: a sine day, 07:00–19:00
      const d = Math.sin((tod - 7) / 12 * Math.PI);
      return d > 0 ? cfg.window * d : 0;
    }
    const lampOn = cfg.lamp && cfg.photo > 0 && ((tod - 9 + 24) % 24) < cfg.photo;
    const surf = lampOn ? PPE * cfg.lampW * F_INTO / cfg.area : 0;
    const day = (tod >= 7 && tod < 19) ? cfg.roomLight : 0;   // a little daylight from the room
    return surf + day;
  }

  /* the derivatives, and every flux the ledger shows, for state y at clock time */
  function derive(v, y, tod, dy, keep) {
    const c = v.cfg, V = c.vol;
    const T = y[TW], fT = q10(T, 2), fTf = q10(T, FISH.q10);
    const hot = T > 30 ? Math.max(0, 1 - (T - 30) / 8) : 1;
    const sp = speciate(y[DIC] / MW_C, y[ALK], T);
    const co2 = sp.co2 * MW_CO2;                         // mg/L
    const hco3 = sp.hco3;                                // mmol/L
    const o2 = Math.max(0, y[O2]);
    const tan = Math.max(0, y[TAN]), no2 = Math.max(0, y[NO2]), no3 = Math.max(0, y[NO3]);
    const nav = tan + no3;

    /* light: through the water and any suspended algae */
    const algMgL = Math.max(0, y[AC]) / ALGA.cfrac / V;  // mg DW/L
    const I0 = lightAt(c, tod);
    const att = Math.exp(-(K_WATER + EPS_ALG * algMgL) * (c.depth || Z_PLANT));
    const Ip = I0 * att;

    /* producers */
    const pdw = Math.max(0, y[PC]) / PLANT.cfrac / 1000; // g DW
    const adw = Math.max(0, y[AC]) / ALGA.cfrac / 1000;
    const fCp = (1 - PLANT.bic) * co2 / (PLANT.kc + co2) + PLANT.bic * hco3 / (0.5 + hco3);
    const fCa = (1 - ALGA.bic) * co2 / (ALGA.kc + co2) + ALGA.bic * hco3 / (0.5 + hco3);
    let Pg = PLANT.pmax * pdw * Math.tanh(Ip / PLANT.ik) * fT * hot * fCp * (nav / (PLANT.kn + nav));
    // quantum cap: no more O₂ than the photons the leaves actually absorb, at 10 per O₂
    const photonsIn = I0 * c.area * att;                 // µmol/s reaching leaf depth
    const absP = 1 - Math.exp(-0.05 * pdw);
    Pg = Math.min(Pg, photonsIn * absP / 10 * MW_O2 * 3.6);   // mg O₂/h
    const Ag = ALGA.pmax * adw * Math.tanh(Ip / ALGA.ik) * fT * hot * fCa * (nav / (ALGA.kn + nav));
    const Rp = PLANT.resp * pdw * fT, Ra = ALGA.resp * adw * fT;           // mg O₂/h
    const fixP = Pg / MW_O2 * MW_C, fixA = Ag / MW_O2 * MW_C;       // mg C/h, one O₂ per C
    const resP = Rp / MW_O2 * MW_C, resA = Ra / MW_O2 * MW_C;
    const turnP = PLANT.turn * Math.max(0, y[PC]);
    // settling, microbes, the filter sponge — attached algae (the sphere's) barely settle
    const lossA = ((c.algLoss == null ? ALGA.loss : c.algLoss) + (c.filter ? 0.004 : 0)) * Math.max(0, y[AC]);
    // nitrogen for growth, ammonium first
    const gP = Math.max(0, fixP - resP) * PLANT.nc, gA = Math.max(0, fixA - resA) * ALGA.nc;
    const needN = gP + gA;
    const fromTAN = Math.min(needN, needN * tan / Math.max(1e-9, nav)), fromNO3 = needN - fromTAN;
    // a starving producer (respiration > fixation) releases its nitrogen
    const relN = Math.max(0, resP - fixP) * PLANT.nc + Math.max(0, resA - fixA) * ALGA.nc;

    /* consumers: fish fed flakes, or shrimp grazing algae */
    const nAlive = Math.max(0, y[NF]);
    const cnd = y[FC] / Math.max(1e-9, nAlive * c.cEach);           // body condition of the living, 1 = normal
    const nCons = Math.max(0, y[FC]) / c.cEach;                     // in normal-sized animals, for metabolism
    const wet = nCons * c.wetEach;
    const Rf = FISH.rO2 * wet * fTf * c.metab;                     // mg O₂/h
    const resF = Rf / MW_O2 * MW_C;
    let ingC = 0, ingN = 0, uneatenC = 0, uneatenN = 0, grazeC = 0;
    if (c.food > 0) {
      const inC = c.food * 1000 * FOOD.c / 24, inN = c.food * 1000 * FOOD.n / 24;   // mg/h offered
      const maxC = 0.03 * nAlive * c.wetEach * 1000 * FOOD.c / 24 * clamp((1.5 - cnd) / 0.5, 0, 1); // 3 % body weight a day
      const eat = nAlive > 0.5 ? Math.min(inC, maxC) : 0;
      ingC = eat; ingN = eat * inN / inC; uneatenC = inC - eat; uneatenN = inN - ingN;
    }
    if (c.graze) {                                                  // Holling type II on algae, until full
      const aC = Math.max(0, y[AC]) / V;
      grazeC = 0.04 * Math.max(0, y[FC]) * aC / (2 + aC) * fT * clamp((1.5 - cnd) / 0.5, 0, 1);
      ingC += grazeC; ingN += grazeC * ALGA.nc;
    }
    const assC = ASSIM * ingC, assN = ASSIM * ingN;
    // tissue can only be built as far as the nitrogen eaten allows (flakes carry less N per C
    // than fish flesh); carbon beyond that is burned, which is what an overfed animal does
    let growF = assC - resF;                                        // mg C/h into (or out of) tissue
    let extraC = 0;
    if (growF > 0 && growF * FISH.nc > assN) { extraC = growF - assN / FISH.nc; growF -= extraC; }
    const exN = growF >= 0 ? assN - growF * FISH.nc : assN - growF * FISH.nc;   // the rest leaves as ammonia
    const egC = ingC - assC, egN = ingN - assN;

    /* water quality and the fish's fate */
    const fa = tan * freeNH3frac(sp.pH, T) * MW_NH3 / MW_N;        // mg NH₃/L
    const no2ion = no2 * 46.006 / MW_N;                             // mg NO₂⁻/L
    let mort = 0;
    if (o2 < 1.3) mort += 0.25 * (1.3 - o2) / 1.3;
    if (fa > 0.3) mort += 0.02 * (fa / 0.3 - 1);
    if (no2ion > 5) mort += 0.004 * (no2ion / 5 - 1);
    if (T > 33 || T < 16) mort += 0.08;
    if (cnd < 0.6 && nAlive > 0.01) mort += 0.02;                   // starving
    const dieC = mort * Math.max(0, y[FC]);

    /* decomposition and nitrification */
    const dec = DECAY * fT * o2 / (1 + o2);
    const mulC = MULM.k * fT * o2 / (0.5 + o2) * Math.max(0, y[SC]);
    const decC = dec * Math.max(0, y[DC]) + mulC, decN = dec * Math.max(0, y[DN]) + mulC * MULM.nc;
    const flow = c.filter ? 1 : 0.12;                               // no flow → the media starve
    const fo = o2 / (BACT.Ko + o2);
    const s1 = tan / (BACT.K1 + tan) * fo * fT * flow;
    const inhib = 1 / (1 + fa / BACT.FAi);                          // free ammonia inhibits nitrite oxidisers
    const s2 = no2 / (BACT.K2 + no2) * fo * fT * flow * inhib;
    const r1 = Math.max(0, y[V1]) * s1 * V / 54, r2 = Math.max(0, y[V2]) * s2 * V / 54;   // mg N/h

    /* exchange with the air: open surface, or the sealed headspace */
    const kO2 = c.kx, kCO2 = 0.9 * c.kx;
    let exO2, exC;                                                  // mg/h INTO the water
    if (c.headspace) {
      const nAir = 101.325 * c.headspace / (8.314 * (T + 273.15));
      const pO2 = (y[HO2] / 1000 / MW_O2) / nAir, pCO2 = (y[HC] / 1000 / MW_C) / nAir;   // atm
      exO2 = kO2 * (o2sat(T) * pO2 / 0.2095 - o2) * V;
      exC = kCO2 * (kHco2(T) * pCO2 * MW_CO2 * 1e3 - co2) * V * MW_C / MW_CO2;
    } else {
      exO2 = kO2 * (o2sat(T) - o2) * V;
      exC = kCO2 * (kHco2(T) * PPM_CO2 * MW_CO2 * 1e3 - co2) * V * MW_C / MW_CO2;
    }

    /* heat */
    let heat = 0;
    if (c.heater && v.heatOn) heat += HEATER_W;
    const lightW = photonsInW(c, tod);
    // an agitated surface (pump, filter return) evaporates about 40 % faster
    const evap = c.headspace ? 0 : Math.max(0, EVAP_K * c.area * (esat(T) - 0.5 * esat(c.roomT)) * (c.agitate ? 1.4 : 1));
    const evapW = evap * LV / 3600;
    const lossW = c.ua * (T - c.roomT);
    const bioW = (Rp + Ra + Rf) / 1000 / MW_O2 * E_O2 / 3600 + decC / 1000 / MW_C * E_O2 / 3600;
    const storeW = (Pg + Ag) / 1000 / MW_O2 * E_O2 / 3600;          // light held as chemical energy

    /* water changes: continuous dilution toward tap water */
    const wc = c.change / 100 / 168;                                // h⁻¹
    const tapKey = c.kh + '|' + c.roomT;                            // solving for it is costly: cache it
    if (c._tapKey !== tapKey) { c._tapKey = tapKey; c._tapDIC = dicAtAir(c.kh * 0.357, c.roomT) * MW_C; }
    const tapDIC = c._tapDIC;

    /* assemble */
    const RfAll = Rf + extraC / MW_C * MW_O2;                       // O₂ for the extra burning too
    const o2use = Rp + Ra + RfAll + decC * MW_O2 / MW_C + 1.5 * MW_O2 / MW_N * r1 + 0.5 * MW_O2 / MW_N * r2;
    const o2make = Pg + Ag + O2_PER_NO3N * fromNO3;                 // nitrate reduction frees O₂ too
    dy[O2] = (o2make - o2use + exO2) / V - wc * (y[O2] - o2sat(c.roomT));
    dy[DIC] = (resP + resA + resF + extraC + decC - fixP - fixA + exC) / V - wc * (y[DIC] - tapDIC);
    dy[TAN] = (exN + decN + relN - fromTAN - r1) / V - wc * y[TAN];
    dy[NO2] = (r1 - r2) / V - wc * y[NO2];
    dy[NO3] = (r2 - fromNO3) / V - wc * (y[NO3] - 0.2);
    dy[TW] = 3600 * (heat + lightW + bioW - storeW - lossW - evapW) / (V * CP_W);
    dy[PC] = fixP - resP - turnP;
    dy[AC] = fixA - resA - lossA - grazeC;
    dy[FC] = growF - dieC;
    dy[NF] = -mort * nAlive;
    dy[SC] = -mulC;
    dy[DC] = uneatenC + egC + turnP + lossA + dieC - decC;
    dy[DN] = uneatenN + egN + turnP * PLANT.nc + lossA * ALGA.nc + dieC * FISH.nc - decN;
    dy[V1] = Math.max(0, y[V1]) * (BACT.mu1 * s1 - BACT.b1);
    dy[V2] = Math.max(0, y[V2]) * (BACT.mu2 * s2 - BACT.b2);
    // alkalinity, eq per mol N: ammonia released +1 (NH₃ takes up H⁺), nitrified −2,
    // nitrate taken up +1, ammonium taken up −1 — a closed nitrogen loop leaves it unchanged
    dy[ALK] = ((exN + decN + relN) - 2 * r1 + fromNO3 - fromTAN) / MW_N / V - wc * (y[ALK] - c.kh * 0.357);
    dy[HO2] = c.headspace ? -exO2 : 0;
    dy[HC] = c.headspace ? -exC : 0;

    if (keep) {
      const f = v.flux;
      f.Pg = Pg; f.Ag = Ag; f.Rp = Rp; f.Ra = Ra; f.Rf = RfAll; f.o2use = o2use; f.o2make = o2make; f.extraC = extraC; f.exO2 = exO2; f.exC = exC;
      f.fixP = fixP; f.fixA = fixA; f.resP = resP; f.resA = resA; f.resF = resF + extraC; f.decC = decC; f.decN = decN;
      f.r1 = r1; f.r2 = r2; f.exN = exN; f.upN = needN; f.fromTAN = fromTAN; f.fromNO3 = fromNO3;
      f.ingC = ingC; f.uneatenC = uneatenC; f.egC = egC; f.turnP = turnP; f.lossA = lossA; f.grazeC = grazeC; f.dieC = dieC;
      f.foodC = c.food > 0 ? c.food * 1000 * FOOD.c / 24 : 0;
      f.heat = heat; f.lightW = lightW; f.lossW = lossW; f.evapW = evapW; f.evap = evap; f.bioW = bioW; f.storeW = storeW;
      f.lampW = lampOn(c, tod) ? c.lampW : 0;
      f.I0 = I0; f.Ip = Ip; f.att = att; f.pH = sp.pH; f.co2 = co2; f.hco3 = hco3; f.fa = fa; f.no2ion = no2ion;
      f.mort = mort; f.cond = cnd; f.algMgL = algMgL; f.nCons = nCons; f.alive = nAlive;
    }
  }
  function lampOn(c, tod) { return !c.window && c.lamp && c.photo > 0 && ((tod - 9 + 24) % 24) < c.photo; }
  /* radiant power of the light entering the water, W */
  function photonsInW(c, tod) { return lightAt(c, tod) * c.area * E_PHOTON; }

  const NONNEG = [O2, TAN, NO2, NO3, PC, AC, FC, DC, DN, HO2, HC, NF, SC];
  /* advance a vessel by dt hours, RK4 in substeps of at most 0.05 h */
  const K1 = new Float64Array(NS), K2 = new Float64Array(NS), K3 = new Float64Array(NS),
        K4 = new Float64Array(NS), TMP = new Float64Array(NS);
  function advance(v, dt, t0, hmax) {
    const n = Math.max(1, Math.ceil(dt / (hmax || 0.05))), h = dt / n, y = v.y;
    for (let s = 0; s < n; s++) {
      const tod = ((t0 + s * h) % 24 + 24) % 24;
      // the thermostat is a switch, decided once per substep with a quarter-degree dead band
      if (v.cfg.heater) {
        if (y[TW] < v.cfg.setT - 0.25) v.heatOn = true;
        else if (y[TW] > v.cfg.setT + 0.25) v.heatOn = false;
      } else v.heatOn = false;
      derive(v, y, tod, K1, false);
      for (let i = 0; i < NS; i++) TMP[i] = y[i] + h / 2 * K1[i];
      derive(v, TMP, tod + h / 2, K2, false);
      for (let i = 0; i < NS; i++) TMP[i] = y[i] + h / 2 * K2[i];
      derive(v, TMP, tod + h / 2, K3, false);
      for (let i = 0; i < NS; i++) TMP[i] = y[i] + h * K3[i];
      derive(v, TMP, tod + h, K4, false);
      for (let i = 0; i < NS; i++) y[i] += h / 6 * (K1[i] + 2 * K2[i] + 2 * K3[i] + K4[i]);
      for (let k = 0; k < NONNEG.length; k++) if (y[NONNEG[k]] < 0) y[NONNEG[k]] = 0;
      if (y[V1] < 0.001) y[V1] = 0.001;                    // bacteria always drift in
      if (y[V2] < 0.001) y[V2] = 0.001;
    }
    v.t = t0 + dt;
    derive(v, y, ((v.t % 24) + 24) % 24, K1, true);          // leave the fluxes of "now" for the display
  }
  /* Ω, mmol: O₂ (water + headspace) + 1.5·NO₂⁻-N + 2·NO₃⁻-N − organic C — conserved when sealed */
  function omega(v) {
    const y = v.y, V = v.cfg.vol;
    const org = y[PC] + y[AC] + y[FC] + y[DC] + y[SC];
    return (y[O2] * V + y[HO2]) / MW_O2 + (1.5 * y[NO2] + 2 * y[NO3]) * V / MW_N - org / MW_C;
  }
  /* total carbon inside a vessel, mg — the sealed sphere's conserved quantity */
  function carbon(v) {
    const y = v.y;
    return y[DIC] * v.cfg.vol + y[PC] + y[AC] + y[FC] + y[DC] + y[HC] + y[SC];
  }

  /* exported to the lab below, and to the numerical checks */
  const MODEL = { o2sat, kHco2, speciate, dicAtAir, freeNH3frac, vessel, advance, derive, carbon, omega,
                  blindOrder: (p, n, st) => blindOrder(p, n, st), runTank: (p, h) => runTank(p, h), BASE: () => BASE,
                  lightAt, TANK, VOL, AREA,
                  idx: { O2, DIC, TAN, NO2, NO3, TW, PC, AC, FC, DC, DN, V1, V2, ALK, HO2, HC, NF, SC } };
  L.models = L.models || {};
  L.models['g6a-living-tank'] = MODEL;

  /* =====================================================================
     THE BENCH — scene geometry, in metres. Z is up; the front glass is y = −0.15.
     ===================================================================== */
  const R3 = window.R3, RX = window.RX, BENCH = window.BENCH, LIFE = window.LIFE, LAB = window.LAB;
  const X0 = -0.30, X1 = 0.30, Y0 = -0.15, Y1 = 0.15, ZT = 0.36;
  const gravelZ = (x, y) => 0.045 + 0.03 * (y - Y0) / (Y1 - Y0);
  const FISH_L = 0.030;                       // a neon tetra is about 3 cm
  const FILTER_AT = [0.17, Y1 + 0.006, ZT];
  const HEATER_A = [-0.255, 0.118, 0.085], HEATER_B = [-0.255, 0.118, 0.300];
  const STONE_AT = [0.215, 0.100, 0.072];
  const PUMP_AT = [0.43, -0.02, 0];

  /* deterministic randomness: the state is a number on S, never a function */
  function rnd(S) {
    let x = S.seed >>> 0 || 1;
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    S.seed = x;
    return x / 4294967296;
  }
  const gauss = S => { const u = Math.max(1e-9, rnd(S)), v = rnd(S); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

  /* ---------------- the vessels, from the control deck ---------------- */
  const MEDIA = { mature: 6, new: 0.002, tap: 0.3, tank: 5.4 };   // nitrifier capacity, mg N/h per 54 L
  function tankCfg(p) {
    return {
      vol: VOL, area: AREA, depth: Z_PLANT, T0: p.heater ? p.setT : p.roomT, kh: p.kh,
      plantsG: p.plants, algaeC: 5, consumers: p.fish, cEach: FISH.cPerFish, wetEach: FISH.wet, metab: 1,
      food: p.food, graze: false, filter: p.filter, agitate: p.filter || p.pump,
      kx: 0.03 + (p.filter ? 0.25 : 0) + (p.pump ? 0.35 : 0),
      lamp: p.lamp, lampW: p.lampW, photo: p.photo, roomLight: 6,
      heater: p.heater, setT: p.setT, roomT: p.roomT, ua: UA, change: p.change,
      v1: MEDIA[p.media], v2: MEDIA[p.media], no3: p.media === 'new' ? 0.2 : 2.5,
      mulm: p.media === 'new' ? 0 : 8000
    };
  }
  /* the live switches follow the deck without restarting the run */
  function syncCfg(S) {
    const p = S.p, c = S.tank.cfg;
    c.food = p.food; c.filter = p.filter; c.agitate = p.filter || p.pump;
    c.kx = 0.03 + (p.filter ? 0.25 : 0) + (p.pump ? 0.35 : 0);
    c.lamp = p.lamp; c.lampW = p.lampW; c.photo = p.photo;
    c.heater = p.heater; c.setT = p.setT; c.roomT = p.roomT; c.kh = p.kh; c.change = p.change;
    if (S.sphere) { S.sphere.cfg.window = p.window; S.sphere.cfg.roomT = p.roomT; S.dark.cfg.roomT = p.roomT; }
  }
  function sphereCfg(p, dark) {
    return { vol: 1.7, area: 0.012, depth: 0.04, T0: p.roomT, kh: 3, plantsG: 0, algaeC: 20, consumers: p.shrimp,
             cEach: 1.7, wetEach: 0.015, metab: 1, food: 0, graze: true, filter: false, agitate: false, kx: 0.5,
             window: dark ? 0 : p.window, lamp: false, lampW: 0, photo: 0, roomLight: 0, heater: false,
             setT: p.roomT, roomT: p.roomT, ua: 0.5, change: 0, v1: 0.5, v2: 0.5, no3: 0.3,
             headspace: 0.3, detC: 5, algLoss: 0.002 };
  }

  /* ---------------- the shoal: every fish an agent ----------------
     Positions in metres, velocities in m/s, advanced in real seconds so a
     fish swims at its real speed (~1.7 body lengths a second) however fast
     the chemistry's clock runs. */
  function makeFish(S, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = rnd(S) * TAU;
      out.push({ p: [-0.12 + rnd(S) * 0.24, -0.08 + rnd(S) * 0.16, 0.14 + rnd(S) * 0.12],
                 v: [Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0], ph: rnd(S) * TAU, id: i, tag: i === 0 });
    }
    return out;
  }
  function stemsOf(S) { return S.stems || []; }
  function shoalStep(S, dt) {
    const p = S.p, F = S.fish, n = F.length, zw = surfaceZ(S);
    if (!n) return;
    const o2 = S.tank.y[O2], lampLit = S.tank.flux.lampW > 0;
    const shoal = p.setup === 'shoal';
    const wA = shoal ? p.align : 1.0, wC = shoal ? p.cohere : 1.0, sep = (shoal ? p.sepCm : 3.2) / 100;
    const noise = shoal ? p.noise : 0.6, R = 0.10;
    const leader = shoal && p.leader, gone = shoal && p.removeTag;
    const tagged = F.find(f => f.tag);
    const pred = shoal && p.predator ? S.pred : null;
    for (let i = 0; i < n; i++) {
      const f = F[i];
      if (gone && f.tag) continue;
      let ax = 0, ay = 0, az = 0, cx = 0, cy = 0, cz = 0, vx = 0, vy = 0, vz = 0, k = 0;
      const sp = Math.hypot(f.v[0], f.v[1], f.v[2]) || 1e-6;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const g = F[j];
        if (gone && g.tag) continue;
        const dx = g.p[0] - f.p[0], dy = g.p[1] - f.p[1], dz = g.p[2] - f.p[2];
        const d = Math.hypot(dx, dy, dz);
        if (d > R || d < 1e-6) continue;
        k++; cx += g.p[0]; cy += g.p[1]; cz += g.p[2];
        const vl = Math.hypot(g.v[0], g.v[1], g.v[2]) || 1;
        vx += g.v[0] / vl; vy += g.v[1] / vl; vz += g.v[2] / vl;
        if (d < sep) { const w = (sep - d) / sep / d; ax -= dx * w * 3.0; ay -= dy * w * 3.0; az -= dz * w * 3.0; }
      }
      if (leader) {                                       // everyone steers at one fish instead
        if (tagged && !gone && !f.tag) {
          ax += (tagged.p[0] - f.p[0]) * 1.2; ay += (tagged.p[1] - f.p[1]) * 1.2; az += (tagged.p[2] - f.p[2]) * 1.2;
        }
      } else if (k) {
        ax += ((cx / k - f.p[0]) * 0.6) * wC; ay += ((cy / k - f.p[1]) * 0.6) * wC; az += ((cz / k - f.p[2]) * 0.6) * wC;
        const vl = Math.hypot(vx, vy, vz) || 1;
        ax += (vx / vl - f.v[0] / sp) * 0.08 * wA; ay += (vy / vl - f.v[1] / sp) * 0.08 * wA; az += (vz / vl - f.v[2] / sp) * 0.04 * wA;
      }
      // random turning: rotational diffusion of the heading. A turning rate with standard deviation
      // √(2·D/dt), D = (0.35·noise)² rad²/s, applied across the direction of travel
      const sw = gauss(S) * noise * 0.35 * Math.sqrt(2 / Math.max(dt, 1e-3)) * sp, sz = gauss(S) * noise * 0.12 * Math.sqrt(2 / Math.max(dt, 1e-3)) * sp;
      ax += -f.v[1] / sp * sw; ay += f.v[0] / sp * sw; az += sz;
      // walls, gravel and the surface: steer away before touching
      const m = 0.035;
      if (f.p[0] < X0 + m) ax += (X0 + m - f.p[0]) * 6; if (f.p[0] > X1 - m) ax -= (f.p[0] - X1 + m) * 6;
      if (f.p[1] < Y0 + m) ay += (Y0 + m - f.p[1]) * 6; if (f.p[1] > Y1 - m) ay -= (f.p[1] - Y1 + m) * 6;
      const zg = gravelZ(f.p[0], f.p[1]);
      if (f.p[2] < zg + m) az += (zg + m - f.p[2]) * 6; if (f.p[2] > zw - 0.02) az -= (f.p[2] - zw + 0.02) * 8;
      // plants: a light push off each stem
      for (const st of stemsOf(S)) {
        const dx = f.p[0] - st[0], dy = f.p[1] - st[1], d = Math.hypot(dx, dy);
        if (d < 0.018 && f.p[2] < st[2]) { ax += dx / (d + 1e-4) * 0.05; ay += dy / (d + 1e-4) * 0.05; }
      }
      // low oxygen: aquatic surface respiration — gulping the film of water at the surface
      const gasp = o2 < 2.5;
      if (gasp) az += (zw - 0.012 - f.p[2]) * 3;
      // neons cruise the open water in front of the planting; at night they settle lower and slow
      if (!gasp) {
        const hy = -0.045 - f.p[1], hx = f.p[0] < -0.12 ? (-0.12 - f.p[0]) : 0;
        ay += hy * 0.35; ax += hx * 0.5;
        if (!lampLit) az += (zg + 0.06 - f.p[2]) * 0.4;
        else az += (0.17 - f.p[2]) * 0.15;
      }
      // the predator: flee
      if (pred) {
        const dx = f.p[0] - pred.p[0], dy = f.p[1] - pred.p[1], dz = f.p[2] - pred.p[2], d = Math.hypot(dx, dy, dz);
        if (d < 0.12) { const w = (0.12 - d) / 0.12 * 3.5 / (d + 1e-3); ax += dx * w; ay += dy * w; az += dz * w; }
      }
      // neons patrol the tank's length and turn before swimming head-on at the glass
      ay -= f.v[1] * 0.45;
      f.a = [ax, ay, az];
    }
    const v0 = lampLit ? 0.05 : 0.025, vmax = 0.25;
    for (const f of F) {
      if (!f.a) continue;
      f.v[0] += f.a[0] * dt; f.v[1] += f.a[1] * dt; f.v[2] += f.a[2] * dt;
      let sp = Math.hypot(f.v[0], f.v[1], f.v[2]) || 1e-6;
      const want = sp + (v0 - sp) * Math.min(1, dt * 1.5);          // relax toward cruising speed
      const cap = Math.min(vmax, Math.max(0.008, want));
      f.v[0] *= cap / sp; f.v[1] *= cap / sp; f.v[2] *= cap / sp;
      if (Math.abs(f.v[2]) > cap * 0.34) f.v[2] = Math.sign(f.v[2]) * cap * 0.34;   // fish swim level: pitch under 20°
      f.p[0] += f.v[0] * dt; f.p[1] += f.v[1] * dt; f.p[2] += f.v[2] * dt;
      f.p[0] = clamp(f.p[0], X0 + 0.01, X1 - 0.01); f.p[1] = clamp(f.p[1], Y0 + 0.01, Y1 - 0.01);
      f.p[2] = clamp(f.p[2], gravelZ(f.p[0], f.p[1]) + 0.008, zw - 0.006);
      sp = Math.hypot(f.v[0], f.v[1], f.v[2]);
      f.ph += dt * TAU * ((4 * sp / FISH_L + 1) / 0.75);              // tail beat (Bainbridge)
      f.a = null;
    }
  }
  function surfaceZ(S) { return 0.33 - (S.lostL || 0) / (AREA * 1000); }

  /* the shoal's order, measured */
  function shoalOrder(S) {
    const F = S.fish.filter(f => !(S.p.setup === 'shoal' && S.p.removeTag && f.tag));
    const n = F.length;
    if (n < 2) return { phi: 0, nnd: 0, group: 0 };
    let sx = 0, sy = 0, sz = 0, nsum = 0;
    for (const f of F) { const l = Math.hypot(f.v[0], f.v[1], f.v[2]) || 1; sx += f.v[0] / l; sy += f.v[1] / l; sz += f.v[2] / l; }
    for (const f of F) {
      let best = 1e9;
      for (const g of F) if (g !== f) best = Math.min(best, Math.hypot(g.p[0] - f.p[0], g.p[1] - f.p[1], g.p[2] - f.p[2]));
      nsum += best;
    }
    // the largest connected group, joined at three body lengths
    const seen = new Array(n).fill(false);
    let big = 0;
    for (let i = 0; i < n; i++) {
      if (seen[i]) continue;
      let size = 0; const st = [i]; seen[i] = true;
      while (st.length) {
        const a = st.pop(); size++;
        for (let j = 0; j < n; j++) if (!seen[j] && Math.hypot(F[a].p[0] - F[j].p[0], F[a].p[1] - F[j].p[1], F[a].p[2] - F[j].p[2]) < 3 * FISH_L) { seen[j] = true; st.push(j); }
      }
      big = Math.max(big, size);
    }
    return { phi: Math.hypot(sx, sy, sz) / n, nnd: nsum / n / FISH_L, group: big / n };
  }

  /* =====================================================================
     DRAWING THE TANK
     Painted in passes the camera decides, because a glass box with things
     inside it cannot be depth-sorted as one list (§2.12): the far glass and
     the water's colour first, then everything inside sorted on its own depth,
     then the surface, then the near glass. Which panes are near is asked of
     the camera every frame.
     ===================================================================== */
  const hexA = (c, a) => RX.rgba(c, clamp(a, 0, 1));
  function waterLook(S) {
    const f = S.tank.flux, A = f.algMgL || 0;
    const lit = f.lampW > 0 ? 1 : (f.I0 > 1 ? 0.42 : 0.13);         // lamp, the room's daylight, night
    const base = RX.mix(RX.mix('#0F4D5A', '#44702A', clamp(A / 22, 0, 1)), '#03101A', 1 - lit);
    return { lit, base, c: K_WATER + EPS_ALG * A, A };
  }
  /* length of the sight line that runs through water before reaching p */
  function wetPath(eye, p, zw) {
    const d = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
    const lo = [X0, Y0, 0], hi = [X1, Y1, zw];
    let t0 = 0, t1 = 1;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-12) { if (eye[k] < lo[k] || eye[k] > hi[k]) return 0; continue; }
      let a = (lo[k] - eye[k]) / d[k], b = (hi[k] - eye[k]) / d[k];
      if (a > b) { const t = a; a = b; b = t; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    return t1 > t0 ? Math.hypot(d[0], d[1], d[2]) * (t1 - t0) : 0;
  }
  function hull(pts) {
    const P = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const q of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const polyPath = (ctx, q) => { ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); };

  /* plants: laid out once per run from the planted mass, grown from the model after that */
  function layPlants(S) {
    const g0 = S.p.plants, r = { seed: 77 };
    const out = { cab: [], val: [] };
    if (g0 <= 0) { S.plants = out; S.stems = []; return; }
    const nc = Math.round(3 + 8 * clamp(g0 / 20, 0, 1.6)), nv = Math.round(2 + 5 * clamp(g0 / 20, 0, 1.6));
    for (let i = 0; i < nc; i++) out.cab.push({ x: -0.25 + 0.17 * rnd(r) + (i % 3) * 0.012, y: 0.02 + 0.11 * rnd(r), seed: 1 + i * 1.37, h: 0.8 + 0.4 * rnd(r) });
    for (let i = 0; i < nv; i++) out.val.push({ x: 0.03 + 0.24 * rnd(r), y: 0.05 + 0.08 * rnd(r), seed: 3 + i * 2.1, h: 0.8 + 0.4 * rnd(r) });
    S.plants = out;
    S.stems = out.cab.map(c => [c.x, c.y, 0.30]);
  }

  function drawTankScene(S, g, o) {
    o = o || {};
    const ctx = g.ctx, cam = S.cam, p = S.p, T = S.tank, y = T.y, f = T.flux;
    const zw = surfaceZ(S), W = waterLook(S), eye = cam.eye;
    const P = (x, yy, z) => cam.project([x, yy, z]);
    const fogAt = pt => clamp(1 - Math.exp(-W.c * wetPath(eye, pt, zw) * 1.15), 0, 0.92);
    const tint = (c, fg, a) => hexA(RX.mix(RX.mix(c, '#03080E', 1 - W.lit * 0.92), W.base, fg), a == null ? 1 : a);
    const lampLit = f.lampW > 0;

    /* ---- pass A: the cabinet and anything behind the tank ---- */
    const FA = R3.Frame(ctx, cam, { ambient: 0.32, floorZ: null });
    BENCH.texBox(FA, [0.06, 0, -0.30], [0.80, 0.42, 0.60], { top: BENCH.wood('#5E3A22', 17), side: BENCH.wood('#4E311C', 23), end: BENCH.wood('#4E311C', 29) },
                 { bias: FA.GROUND, tiles: 3, ambient: 0.45 });
    const filterBehind = eye[1] < Y1;
    if (filterBehind) LAB.hobFilter(FA, FILTER_AT, 0.20, { on: p.filter, cut: o.cutFilter, film: clamp(y[V1] / 8, 0, 1) });
    LAB.airPump(FA, PUMP_AT, p.pump, S.ta);
    if (p.pump) LAB.airline(FA, [[PUMP_AT[0] - 0.02, PUMP_AT[1], 0.044], [0.34, 0.04, 0.15], [0.305, 0.09, ZT + 0.012], [0.28, 0.10, ZT + 0.02]]);
    FA.render();

    /* ---- pass B: far panes, the background film, the water's colour ---- */
    const faces = [
      { n: [0, -1, 0], P0: [X0, Y0, 0], P1: [X1, Y0, 0], P3: [X0, Y0, ZT] },
      { n: [0, 1, 0], P0: [X1, Y1, 0], P1: [X0, Y1, 0], P3: [X1, Y1, ZT], film: true },
      { n: [-1, 0, 0], P0: [X0, Y1, 0], P1: [X0, Y0, 0], P3: [X0, Y1, ZT] },
      { n: [1, 0, 0], P0: [X1, Y0, 0], P1: [X1, Y1, 0], P3: [X1, Y0, ZT] }
    ];
    faces.forEach(F => {
      const c = [(F.P0[0] + F.P1[0]) / 2, (F.P0[1] + F.P1[1]) / 2, ZT / 2];
      F.near = (eye[0] - c[0]) * F.n[0] + (eye[1] - c[1]) * F.n[1] + (eye[2] - c[2]) * F.n[2] > 0;
    });
    faces.filter(F => !F.near).forEach(F => LAB.pane(ctx, cam, F.P0, F.P1, F.P3,
      F.film ? { dark: [RX.mix('#0A1E2A', '#04090F', 0.4), '#020508'], edge: 'rgba(110,190,160,.35)' } : { tint: 'rgba(160,210,200,.04)' }));
    const FB = R3.Frame(ctx, cam, { ambient: 0.35, floorZ: null });
    trims(FB, faces, false);
    FB.render();
    // the water, as a volume: its projected outline filled with depth-graded colour
    const corners = [];
    for (const xx of [X0, X1]) for (const yy of [Y0, Y1]) for (const zz of [0, zw]) { const q = P(xx, yy, zz); if (q.ok) corners.push(q); }
    if (corners.length === 8) {
      const H = hull(corners);
      let ytop = Infinity, ybot = -Infinity;
      H.forEach(q => { ytop = Math.min(ytop, q.y); ybot = Math.max(ybot, q.y); });
      const gr = ctx.createLinearGradient(0, ytop, 0, ybot);
      gr.addColorStop(0, hexA(RX.mix(W.base, '#9FE3E0', 0.18 * W.lit), 0.50 + 0.25 * clamp(W.A / 20, 0, 1)));
      gr.addColorStop(1, hexA(RX.mix(W.base, '#02070B', 0.45), 0.70 + 0.2 * clamp(W.A / 20, 0, 1)));
      ctx.fillStyle = gr; polyPath(ctx, H); ctx.fill();
    }

    /* ---- pass C: everything under water, sorted on its own depth ---- */
    const FC = R3.Frame(ctx, cam, { ambient: 0.30, floorZ: null });
    // the gravel bed: top, then its section against the front glass
    const gtex = LAB.gravelTex(5);
    FC.push([0, 0, 0.05], () => {
      const cN = 6;
      for (let j = 0; j < cN; j++) for (let i = 0; i < cN; i++) {
        const xa = X0 + (X1 - X0) * i / cN, xb = X0 + (X1 - X0) * (i + 1) / cN;
        const ya = Y0 + (Y1 - Y0) * j / cN, yb = Y0 + (Y1 - Y0) * (j + 1) / cN;
        const q = [P(xa, ya, gravelZ(xa, ya)), P(xb, ya, gravelZ(xb, ya)), P(xb, yb, gravelZ(xb, yb)), P(xa, yb, gravelZ(xa, yb))];
        if (q.some(v => !v.ok)) continue;
        const u0 = i / cN * gtex.width, u1 = (i + 1) / cN * gtex.width, v0 = gtex.height - (j + 1) / cN * gtex.height, v1 = gtex.height - j / cN * gtex.height;
        texTri(ctx, gtex, [u0, v1, u1, v1, u1, v0], [q[0].x, q[0].y, q[1].x, q[1].y, q[2].x, q[2].y]);
        texTri(ctx, gtex, [u0, v1, u1, v0, u0, v0], [q[0].x, q[0].y, q[2].x, q[2].y, q[3].x, q[3].y]);
      }
      // light and water over the gravel: dim at night, tinted and fogged with distance
      const q = [P(X0, Y0, gravelZ(X0, Y0)), P(X1, Y0, gravelZ(X1, Y0)), P(X1, Y1, gravelZ(X1, Y1)), P(X0, Y1, gravelZ(X0, Y1))];
      if (q.every(v => v.ok)) {
        ctx.save();
        const gr = ctx.createLinearGradient(q[0].x, q[0].y, q[3].x, q[3].y);
        gr.addColorStop(0, hexA(W.base, 0.18 + 0.55 * (1 - W.lit)));
        gr.addColorStop(1, hexA(W.base, 0.42 + 0.45 * (1 - W.lit) + 0.3 * clamp(W.A / 20, 0, 1)));
        ctx.fillStyle = gr; polyPath(ctx, q); ctx.fill();
        // caustics: the rippling surface focuses the lamp into a moving net of light
        if (lampLit && W.A < 30) {
          const ag = (p.filter ? 0.5 : 0) + (p.pump ? 0.5 : 0) + 0.12;
          const ct = LAB.causticTex(S.ta, ag, zw - 0.05);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.34 * clamp(p.lampW / 25, 0.2, 1.4) * (1 - clamp(W.A / 30, 0, 1));
          const cN = 4;
          for (let j = 0; j < cN; j++) for (let i = 0; i < cN; i++) {
            const xa = X0 + (X1 - X0) * i / cN, xb = X0 + (X1 - X0) * (i + 1) / cN;
            const ya = Y0 + (Y1 - Y0) * j / cN, yb = Y0 + (Y1 - Y0) * (j + 1) / cN;
            const qq = [P(xa, ya, gravelZ(xa, ya)), P(xb, ya, gravelZ(xb, ya)), P(xb, yb, gravelZ(xb, yb)), P(xa, yb, gravelZ(xa, yb))];
            if (qq.some(v => !v.ok)) continue;
            const u0 = i / cN * ct.width, u1 = (i + 1) / cN * ct.width, v0 = j / cN * ct.height, v1 = (j + 1) / cN * ct.height;
            texTri(ctx, ct, [u0, v0, u1, v0, u1, v1], [qq[0].x, qq[0].y, qq[1].x, qq[1].y, qq[2].x, qq[2].y]);
            texTri(ctx, ct, [u0, v0, u1, v1, u0, v1], [qq[0].x, qq[0].y, qq[2].x, qq[2].y, qq[3].x, qq[3].y]);
          }
        }
        ctx.restore();
      }
    }, FC.GROUND);
    if (eye[1] < Y0) {                                 // the gravel's section, seen through the front glass
      const gs = LAB.gravelSideTex(5);
      FC.push([0, Y0, 0.02], () => {
        const q0 = P(X0, Y0 + 0.001, gravelZ(X0, Y0)), q1 = P(X1, Y0 + 0.001, gravelZ(X1, Y0)), q3 = P(X0, Y0 + 0.001, 0);
        if (!q0.ok || !q1.ok || !q3.ok) return;
        ctx.save();
        ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([(q1.x - q0.x) / gs.width, (q1.y - q0.y) / gs.width, (q3.x - q0.x) / gs.height, (q3.y - q0.y) / gs.height, q0.x, q0.y])));
        ctx.drawImage(gs, 0, 0);
        ctx.restore();
        const q2 = P(X1, Y0 + 0.001, 0);
        ctx.fillStyle = hexA(W.base, 0.25 + 0.5 * (1 - W.lit)); polyPath(ctx, [q0, q1, q2, q3]); ctx.fill();
      }, FC.GROUND - 1);
    }
    // two river stones
    [[-0.03, 0.015, 0.050, 0.036, 0.030, 0.6, '#6F6A60'], [0.115, 0.065, 0.034, 0.026, 0.022, 2.1, '#5E5A55'],
     [0.20, -0.02, 0.020, 0.016, 0.014, 1.2, '#77716A']].forEach(([sx, sy, rx, ry, rz, rot, colr]) => {
      const c = [sx, sy, gravelZ(sx, sy) + rz * 0.45];
      FC.push(c, () => drawStone(ctx, P, c, rx, ry, rz, rot, colr, fogAt(c), W, tint));
    });
    // the heater, the airstone and its stream, the filter's intake reaching in
    LAB.heater(FC, HEATER_A, HEATER_B, T.heatOn && p.heater);
    LAB.airstone(FC, STONE_AT);
    if (!filterBehind) LAB.hobFilter(FC, FILTER_AT, 0.20, { on: p.filter, cut: o.cutFilter, film: clamp(y[V1] / 8, 0, 1) });
    // plants
    const plantG = Math.max(0, y[PC]) / PLANT.cfrac / 1000, g0 = Math.max(0.1, p.plants);
    const grow = clamp(plantG / g0, 0, 2.2), nav = y[TAN] + y[NO3];
    const starve = clamp(1 - nav / (PLANT.kn + nav) + (1 - Math.min(1, f.Ip / 25)) * 0.35 * (lampLit ? 0 : 0.2), 0, 1);
    const health = clamp(grow / 0.5, 0.15, 1);
    const sway = (p.filter ? 0.010 : 0.002) + (p.pump ? 0.004 : 0);
    const Pw = (xx, yy, zz) => P(xx, yy, zz);
    for (const c of S.plants.cab) {
      const base = [c.x, c.y, gravelZ(c.x, c.y)];
      const hgt = clamp((0.08 + 0.17 * grow) * c.h, 0.02, zw - base[2] - 0.004);
      const mid = [c.x, c.y, base[2] + hgt / 2], fg = fogAt(mid);
      FC.push(mid, () => LIFE.cabomba(ctx, Pw, base, hgt, { seed: c.seed, phase: S.ta * 0.9 + c.seed, sway, health, starve },
        (col, extra, a) => tint(col, clamp(fg + (extra || 0), 0, 0.95), a)));
    }
    for (const c of S.plants.val) {
      const base = [c.x, c.y, gravelZ(c.x, c.y)];
      const len = (0.10 + 0.20 * grow) * c.h, mid = [c.x, c.y, base[2] + Math.min(len, zw - base[2]) / 2], fg = fogAt(mid);
      FC.push(mid, () => LIFE.vallisneria(ctx, Pw, base, len, zw, { seed: c.seed, phase: S.ta * 0.7 + c.seed, sway: sway * 1.5, health, starve, leaves: 5 },
        (col, extra, a) => tint(col, clamp(fg + (extra || 0), 0, 0.95), a)));
    }
    // bubbles from the airstone: they rise at ~0.23 m/s, the terminal speed of a 3 mm bubble
    if (p.pump) {
      const rise = zw - STONE_AT[2] - 0.018, N = 22;
      for (let k = 0; k < N; k++) {
        const ph = ((S.ta * 0.23 / rise + k / N) % 1 + 1) % 1;
        const z = STONE_AT[2] + 0.018 + ph * rise;
        const bx = STONE_AT[0] + 0.006 * Math.sin(k * 2.1 + S.ta * 5 + ph * 9), by = STONE_AT[1] + 0.006 * Math.cos(k * 1.3 + S.ta * 4);
        const bp = [bx, by, z], q = P(bx, by, z);
        if (!q.ok) continue;
        FC.push(bp, () => LAB.bubble(ctx, q.x, q.y, Math.max(1, 0.0016 * (1 + ph * 0.6) * q.s), W.lit * (1 - fogAt(bp))));
      }
    }
    // pearling: when the water is supersaturated with O₂ under the lamp, it leaves the leaves as bubbles
    const sat = o2sat(y[TW]);
    for (const b of S.pearls) {
      const q = P(b.p[0], b.p[1], b.p[2]);
      if (q.ok) FC.push(b.p, () => LAB.bubble(ctx, q.x, q.y, Math.max(0.8, 0.0009 * q.s), W.lit));
    }
    void sat;
    // the shoal
    const light = W.lit;
    const stress = fishStress(S);
    for (const fsh of S.fish) {
      if (S.p.setup === 'shoal' && S.p.removeTag && fsh.tag) continue;
      const pos = fsh.p, sp = Math.hypot(fsh.v[0], fsh.v[1], fsh.v[2]) || 1e-6;
      const h = [fsh.v[0] / sp, fsh.v[1] / sp, fsh.v[2] / sp];
      FC.push(pos, () => poseFish(ctx, cam, pos, h, FISH_L, LIFE.tetra, {
        phase: fsh.ph, beat: clamp(sp / 0.1, 0.1, 1), fog: fogAt(pos), fogColour: W.base, light,
        stress, tag: S.p.setup === 'shoal' && fsh.tag }));
    }
    for (const d of S.dead) {
      FC.push(d.p, () => poseFish(ctx, cam, d.p, d.h, FISH_L, LIFE.tetra, { dead: true, fog: fogAt(d.p), fogColour: W.base, light, side: true }));
    }
    if (S.pred && S.p.setup === 'shoal' && S.p.predator) {
      const pr = S.pred, sp = Math.hypot(pr.v[0], pr.v[1], pr.v[2]) || 1e-6;
      FC.push(pr.p, () => poseFish(ctx, cam, pr.p, [pr.v[0] / sp, pr.v[1] / sp, pr.v[2] / sp], 0.075, LIFE.angelfish,
        { phase: pr.ph, fog: fogAt(pr.p), fogColour: W.base, light }, 0.5, 0.05));
    }
    if (o.inside) o.inside(FC, { P, fogAt, tint, W, zw });
    FC.render();

    /* ---- pass D: the surface, the filter's return, the near glass, the rims ---- */
    const ripple = (p.filter ? 1 : 0) + (p.pump ? 0.8 : 0);
    const sq = [P(X0, Y0, zw), P(X1, Y0, zw), P(X1, Y1, zw), P(X0, Y1, zw)];
    if (sq.every(v => v.ok)) {
      ctx.save();
      polyPath(ctx, sq);
      if (eye[2] > zw) {                              // from above: a thin bright film, the lamp's glints
        ctx.fillStyle = hexA(RX.mix(W.base, '#BFEFF2', 0.35), 0.16 + 0.08 * W.lit); ctx.fill();
        ctx.clip();
        if (lampLit) {
          ctx.strokeStyle = 'rgba(255,252,235,' + (0.10 + 0.05 * ripple).toFixed(3) + ')';
          ctx.lineWidth = 1;
          for (let k = 0; k < 16; k++) {
            const u = (k + 0.5) / 16, wob = Math.sin(S.ta * (1.3 + ripple) + k * 1.7) * 0.012 * (0.3 + ripple);
            const a = P(X0 + 0.02, Y0 + (Y1 - Y0) * u + wob, zw), b = P(X1 - 0.02, Y0 + (Y1 - Y0) * u - wob, zw);
            if (!a.ok || !b.ok) continue;
            ctx.beginPath(); ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + Math.sin(S.ta * 2 + k) * 2 * ripple, b.x, b.y); ctx.stroke();
          }
        }
      } else {                                         // from below: total internal reflection — a silver mirror
        const gr = ctx.createLinearGradient(0, Math.min(...sq.map(v => v.y)), 0, Math.max(...sq.map(v => v.y)));
        gr.addColorStop(0, hexA('#DDEFF5', 0.35 * W.lit + 0.05)); gr.addColorStop(1, hexA('#8FB6C4', 0.18 * W.lit + 0.04));
        ctx.fillStyle = gr; ctx.fill();
      }
      ctx.restore();
      // the waterline where the surface meets the glass
      ctx.save(); ctx.strokeStyle = 'rgba(210,240,250,' + (0.35 + 0.35 * W.lit).toFixed(3) + ')'; ctx.lineWidth = 1.2;
      polyPath(ctx, sq); ctx.stroke(); ctx.restore();
    }
    if (p.filter) {                                   // the return spilling over the lip, and the foam it raises
      const lip = [FILTER_AT[0] + 0.02, Y1 - 0.02, ZT + 0.006];
      const a = P(lip[0] - 0.03, lip[1], lip[2]), b = P(lip[0] + 0.03, lip[1], lip[2]);
      const c = P(lip[0] + 0.03, lip[1] - 0.012, zw), d = P(lip[0] - 0.03, lip[1] - 0.012, zw);
      if (a.ok && b.ok && c.ok && d.ok) {
        ctx.save();
        const gr = ctx.createLinearGradient(0, a.y, 0, d.y);
        gr.addColorStop(0, 'rgba(220,245,250,.55)'); gr.addColorStop(1, 'rgba(220,245,250,.18)');
        ctx.fillStyle = gr; polyPath(ctx, [a, b, c, d]); ctx.fill();
        for (let k = 0; k < 9; k++) {
          const q = P(lip[0] - 0.03 + 0.06 * ((k * 0.37 + S.ta * 0.8) % 1), lip[1] - 0.02 - 0.02 * Math.sin(k + S.ta), zw);
          if (q.ok) LAB.bubble(ctx, q.x, q.y, Math.max(1, 0.0022 * q.s), 1);
        }
        ctx.restore();
      }
    }
    faces.filter(F => F.near).forEach(F => LAB.pane(ctx, cam, F.P0, F.P1, F.P3, { tint: 'rgba(170,220,215,.035)', streak: 1 }));
    // black trim along the near top and bottom edges (the far ones went in before the water)
    const FD = R3.Frame(ctx, cam, { ambient: 0.35, floorZ: null });
    trims(FD, faces, true);
    // the LED bar across the top, on its legs
    LAB.hood(FD, X0 + 0.01, X1 - 0.01, -0.028, 0.028, ZT + 0.004, lampLit, { power: clamp(p.lampW / 25, 0.3, 1.5) });
    if (!filterBehind) { /* already drawn inside */ } else if (eye[1] >= Y1) LAB.hobFilter(FD, FILTER_AT, 0.20, { on: p.filter, film: clamp(y[V1] / 8, 0, 1) });
    FD.render();
    // light shafts under the lamp: scattered by whatever floats in the water, so green water glows
    if (lampLit) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) {
        const u = -0.24 + k * 0.08 + 0.01 * Math.sin(S.ta * 0.4 + k);
        const a = P(u, 0, zw), b = P(u + 0.02, 0, zw), c = P(u + 0.05, 0.04, gravelZ(u, 0) + 0.01), d = P(u - 0.03, 0.04, gravelZ(u, 0) + 0.01);
        if (![a, b, c, d].every(v => v.ok)) continue;
        const gr = ctx.createLinearGradient(0, a.y, 0, d.y);
        const k2 = (0.035 + 0.05 * clamp(W.A / 15, 0, 1)) * clamp(p.lampW / 25, 0.3, 1.4) * (0.6 + 0.4 * Math.sin(S.ta * 0.7 + k * 1.9));
        gr.addColorStop(0, 'rgba(230,255,240,' + k2.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(230,255,240,0)');
        ctx.fillStyle = gr; polyPath(ctx, [a, b, c, d]); ctx.fill();
      }
      ctx.restore();
    }
    // the thermometer strip on the front glass
    if (eye[1] < Y0) LAB.thermoStrip(ctx, cam, [0.12, Y0 - 0.0015, 0.075], [1, 0, 0], [0, 0, 1], y[TW], { from: 20 });
  }

  /* an affine-mapped textured triangle (s: source uv, d: screen) */
  function texTri(ctx, img, s, d) {
    const [sx0, sy0, sx1, sy1, sx2, sy2] = s;
    let [x0, y0, x1, y1, x2, y2] = d;
    const gx = (x0 + x1 + x2) / 3, gy = (y0 + y1 + y2) / 3, k = 1.02;
    x0 = gx + (x0 - gx) * k; y0 = gy + (y0 - gy) * k; x1 = gx + (x1 - gx) * k; y1 = gy + (y1 - gy) * k; x2 = gx + (x2 - gx) * k; y2 = gy + (y2 - gy) * k;
    const den = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
    if (!den) return;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.clip();
    ctx.transform(
      -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / den,
       (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / den,
       (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / den,
      -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / den,
       (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / den,
       (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / den);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  /* pose an animal from its 3D position and heading */
  function poseFish(ctx, cam, pos, h, L, draw, o, hRatio, wRatio) {
    const up0 = [0, 0, 1];
    let u = [up0[0] - h[2] * h[0], up0[1] - h[2] * h[1], up0[2] - h[2] * h[2]];
    const ul = Math.hypot(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
    const sd = [h[1] * u[2] - h[2] * u[1], h[2] * u[0] - h[0] * u[2], h[0] * u[1] - h[1] * u[0]];
    if (o.dead) { u = [sd[0], sd[1], sd[2]]; }                    // a dead fish lies on its side
    const q = cam.project(pos);
    if (!q.ok) return;
    const hd = cam.project([pos[0] + h[0] * L / 2, pos[1] + h[1] * L / 2, pos[2] + h[2] * L / 2]);
    const tl = cam.project([pos[0] - h[0] * L / 2, pos[1] - h[1] * L / 2, pos[2] - h[2] * L / 2]);
    const hr = (hRatio || 0.15) * L, wr = (wRatio || 0.065) * L;
    const up = cam.project([pos[0] + u[0] * hr, pos[1] + u[1] * hr, pos[2] + u[2] * hr]);
    const si = cam.project([pos[0] + sd[0] * wr, pos[1] + sd[1] * wr, pos[2] + sd[2] * wr]);
    if (!hd.ok || !tl.ok || !up.ok || !si.ok) return;
    draw(ctx, { head: hd, tail: tl, up: { x: up.x - q.x, y: up.y - q.y }, side: { x: si.x - q.x, y: si.y - q.y } }, o);
  }

  /* how badly the water is treating the fish, 0 … 1 — the neons' colour fades with it */
  function fishStress(S) {
    const y = S.tank.y, f = S.tank.flux;
    let s = 0;
    s = Math.max(s, clamp((4 - y[O2]) / 3, 0, 1));
    s = Math.max(s, clamp((f.fa - 0.02) / 0.2, 0, 1));
    s = Math.max(s, clamp(((f.no2ion || 0) - 0.5) / 4, 0, 1));
    s = Math.max(s, clamp((Math.abs(y[TW] - 25) - 4) / 6, 0, 1));
    return s;
  }

  /* =====================================================================
     TIME, HISTORY, DEATHS AND BUBBLES — the step that ties it together
     ===================================================================== */
  const HIST_DT = 0.2;                                   // hours between history samples
  function sample(S) {
    const T = S.tank, y = T.y, f = T.flux;
    return { t: S.hours, o2: y[O2], sat: o2sat(y[TW]), ph: f.pH, co2: f.co2,
             tan: y[TAN] * MW_NH3 / MW_N, no2: y[NO2] * 46.006 / MW_N, no3: y[NO3] * 62.004 / MW_N,
             T: y[TW], alive: y[NF], plants: y[PC] / PLANT.cfrac / 1000, alg: f.algMgL || 0, fa: f.fa };
  }
  function tick(S, dt) {
    const p = S.p;
    syncCfg(S);
    S.ta += dt;
    const hrs = dt * p.clock;
    const h0 = S.hours;
    MODEL.advance(S.tank, hrs, S.hours);
    if (p.setup === 'sealed') { MODEL.advance(S.sphere, hrs, S.hours); MODEL.advance(S.dark, hrs, S.hours); }
    S.hours += hrs;
    // evaporation takes water; the weekly change tops it back up
    S.lostL += (S.tank.flux.evap || 0) * hrs;
    if (p.change > 0 && Math.floor(S.hours / 168) > Math.floor(h0 / 168)) S.lostL = 0;
    while (S.nextSample <= S.hours) {
      S.hist.push(sample(S)); S.nextSample += HIST_DT;
      if (S.hist.length > 2400) S.hist.shift();
      if (p.setup === 'sealed') {
        S.sHist.push({ t: S.hours, open: MODEL.carbon(S.tank), win: MODEL.carbon(S.sphere), dark: MODEL.carbon(S.dark),
                       o2w: S.sphere.y[O2], o2d: S.dark.y[O2] });
        if (S.sHist.length > 2400) S.sHist.shift();
      }
    }
    // the model says how many fish are alive; the shoal follows it
    const want = Math.round(S.tank.y[NF]);
    let alive = S.fish.length;
    while (alive > want && S.fish.length) {
      let worst = 0;
      S.fish.forEach((fs, i) => { if (fs.p[2] > S.fish[worst].p[2]) worst = i; });
      const d = S.fish.splice(worst, 1)[0];
      S.dead.push({ p: d.p.slice(), h: [d.v[0], d.v[1], 0].map((v, k, a) => v / (Math.hypot(a[0], a[1]) || 1)), sink: true });
      alive--;
    }
    for (const d of S.dead) if (d.sink) {
      d.p[2] -= dt * 0.02;
      const zg = gravelZ(d.p[0], d.p[1]) + 0.004;
      if (d.p[2] <= zg) { d.p[2] = zg; d.sink = false; }
    }
    shoalStep(S, Math.min(dt, 0.05));
    if (p.setup === 'shoal') predatorStep(S, Math.min(dt, 0.05));
    // pearling: O₂ above saturation under the lamp comes off the leaves as fine bubbles
    const y = S.tank.y, sat = o2sat(y[TW]), zw = surfaceZ(S);
    const over = y[O2] / sat - 1.02;
    if (over > 0 && S.tank.flux.lampW > 0 && S.stems.length) {
      S.pearlAcc += dt * over * 60 * clamp(p.plants / 20, 0.2, 2);
      while (S.pearlAcc > 1 && S.pearls.length < 90) {
        S.pearlAcc -= 1;
        const st = S.stems[Math.floor(rnd(S) * S.stems.length)];
        S.pearls.push({ p: [st[0] + (rnd(S) - 0.5) * 0.03, st[1] + (rnd(S) - 0.5) * 0.03, gravelZ(st[0], st[1]) + 0.03 + rnd(S) * 0.18] });
      }
    }
    S.pearls.forEach(b => { b.p[2] += dt * 0.10; });
    S.pearls = S.pearls.filter(b => b.p[2] < zw);
    if (p.setup === 'trace') traceStep(S, hrs);
  }

  /* ---------------- the clock ---------------- */
  function clockStr(h) {
    const day = Math.floor(h / 24) + 1, tod = ((h % 24) + 24) % 24;
    const hh = Math.floor(tod), mm = Math.floor((tod - hh) * 60);
    return { day, tod, text: 'Day ' + day + ' · ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') };
  }

  /* ---------------- the predator (shoal set-up) ----------------
     An angelfish hunts the shoal. It locks onto the nearest neon and strikes if it
     can hold that lock for 0.8 s at close range. Every other neon within 4 cm of its
     target can steal its attention — the confusion effect — so a tight, aligned
     school is a defence no single fish has. */
  function predatorStep(S, dt) {
    const pr = S.pred, F = S.fish;
    if (!S.p.predator || !pr) return;
    const live = F.filter(f => !(S.p.removeTag && f.tag));
    if (!live.length) return;
    let tgt = live.find(f => f.id === pr.lock);
    if (!tgt) { tgt = nearest(live, pr.p); pr.lock = tgt.id; pr.held = 0; }
    const dx = tgt.p[0] - pr.p[0], dy = tgt.p[1] - pr.p[1], dz = tgt.p[2] - pr.p[2], d = Math.hypot(dx, dy, dz);
    // confusion: neighbours of the target break the lock at a rate that grows with their number
    const crowd = live.filter(f => f !== tgt && Math.hypot(f.p[0] - tgt.p[0], f.p[1] - tgt.p[1], f.p[2] - tgt.p[2]) < 0.04).length;
    if (rnd(S) < crowd * 0.9 * dt) { const c = nearest(live.filter(f => f !== tgt), pr.p); if (c) { pr.lock = c.id; pr.held = 0; S.confused++; } }
    pr.held += dt;
    const want = d < 0.12 ? 0.16 : 0.05;
    const k = Math.min(1, dt * 2.5);
    pr.v[0] += ((dx / (d + 1e-6)) * want - pr.v[0]) * k; pr.v[1] += ((dy / (d + 1e-6)) * want - pr.v[1]) * k;
    pr.v[2] += ((dz / (d + 1e-6)) * want * 0.5 - pr.v[2]) * k;
    pr.p = pr.p.map((v, i) => v + pr.v[i] * dt);
    pr.p[0] = clamp(pr.p[0], X0 + 0.05, X1 - 0.05); pr.p[1] = clamp(pr.p[1], Y0 + 0.04, Y1 - 0.04);
    pr.p[2] = clamp(pr.p[2], gravelZ(pr.p[0], pr.p[1]) + 0.05, surfaceZ(S) - 0.04);
    pr.ph += dt * TAU * 2.2;
    if (d < 0.012 && pr.held > 0.8) {                  // a strike that lands: the model loses one fish
      const i = F.indexOf(tgt);
      if (i >= 0) {
        F.splice(i, 1);
        const y = S.tank.y, per = y[FC] / Math.max(1, y[NF]);
        y[NF] = Math.max(0, y[NF] - 1); y[FC] = Math.max(0, y[FC] - per); y[DC] += per;   // eaten: its carbon passes on
        S.caught++;
      }
      pr.lock = -1; pr.held = 0;
    }
  }
  function nearest(list, p) {
    let b = null, bd = 1e9;
    for (const f of list) { const d = Math.hypot(f.p[0] - p[0], f.p[1] - p[1], f.p[2] - p[2]); if (d < bd) { bd = d; b = f; } }
    return b;
  }

  /* =====================================================================
     OVERLAYS — header, clock strip, parts panel, the interaction web
     ===================================================================== */
  const HDR = 58, FOOT = 30;
  /* each set-up's home view; on a phone-width stage the view steps back and centres the tank */
  const HOMES = { sealed: { theta: -1.68, phi: 0.16, dist: 0.74, target: [0.02, 0.02, 0.10], fov: 0.72 },
                  shoal: { theta: -1.64, phi: 0.09, dist: 0.46, target: [0.0, -0.03, 0.18], fov: 0.72 },
                  tank: { theta: -1.78, phi: 0.02, dist: 0.74, target: [-0.105, 0, 0.19], fov: 0.72 } };
  function homeFor(su, narrow) {
    const h = HOMES[su] || HOMES.tank;
    if (!narrow) return h;
    return Object.assign({}, h, { dist: h.dist * (su === 'shoal' ? 1.2 : 1.28), target: [su === 'sealed' ? h.target[0] : 0, h.target[1], h.target[2]] });
  }
  /* fit a line of canvas text to a width, ending it with an ellipsis if it must be cut */
  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 3 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }
  /* on a phone the set-up's card folds into a chip under the header; a tap opens it full width.
     Returns where the open card goes, or null while it is folded. */
  function cardSlot(g, S, title, wideW) {
    if (g.w >= 640) { S._chip = null; return { x: 10, y: HDR + 4, w: wideW }; }
    const ctx = g.ctx, th = g.theme, x = 10, y = HDR + 2;
    ctx.save(); ctx.font = '600 10px "IBM Plex Mono",monospace';
    const label = (S.cardOpen ? '▾ ' : '▸ ') + title, w = Math.min(g.w - 20, ctx.measureText(label).width + 22), h = 24;
    card(ctx, x, y, w, h);
    ctx.fillStyle = th.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, label, w - 20), x + 10, y + 12);
    ctx.restore();
    S._chip = { x0: x, y0: y, x1: x + w, y1: y + h };
    return S.cardOpen ? { x: 10, y: y + h + 4, w: g.w - 20 } : null;
  }
  function header(g, S, line, sub1, sub2) {
    const ctx = g.ctx, th = g.theme;
    ctx.save();
    const hb = (sub2 ? 58 : 45) + 14;
    const hg = ctx.createLinearGradient(0, 0, 0, hb);
    hg.addColorStop(0, 'rgba(5,8,15,.86)'); hg.addColorStop((hb - 14) / hb, 'rgba(5,8,15,.70)'); hg.addColorStop(1, 'rgba(5,8,15,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, g.w, hb);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const narrow = g.w < 640, mw = g.w - 28;
    ctx.font = '700 ' + (narrow ? 14 : 17) + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
    ctx.fillStyle = th.text; ctx.fillText(fitText(ctx, line, mw), 14, 9);
    ctx.font = '500 ' + (narrow ? 9 : 10) + 'px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
    ctx.fillText(fitText(ctx, sub1, mw), 14, 31);
    if (sub2) { ctx.fillStyle = th['text-3']; ctx.fillText(fitText(ctx, sub2, mw), 14, 44); }
    ctx.restore();
  }
  /* 24 h strip: when the lamp is on, where the clock is now, and the day */
  function clockStrip(g, S) {
    const ctx = g.ctx, th = g.theme, W = g.w, H = g.h, p = S.p;
    const narrow = W < 700;                          // on a phone the strip runs full width, above the hint
    const x0 = narrow ? 14 : Math.min(360, W * 0.42), x1 = W - 14, yb = narrow ? H - 48 : H - 16, h = 6;
    const X = t => x0 + (x1 - x0) * t / 24;
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,22,.72)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0 - 8, yb - h - 15, x1 - x0 + 16, h + 29, 6); else ctx.rect(x0 - 8, yb - h - 15, x1 - x0 + 16, h + 29); ctx.fill();
    ctx.fillStyle = 'rgba(20,29,46,.9)'; ctx.fillRect(x0, yb - h, x1 - x0, h);
    ctx.fillStyle = 'rgba(255,214,120,.12)'; ctx.fillRect(X(7), yb - h, X(19) - X(7), h);      // daylight in the room
    if (p.lamp && p.photo > 0) {
      ctx.fillStyle = 'rgba(255,236,160,.75)';
      const a = 9, b = 9 + p.photo;
      if (b <= 24) ctx.fillRect(X(a), yb - h, X(b) - X(a), h);
      else { ctx.fillRect(X(a), yb - h, X(24) - X(a), h); ctx.fillRect(X(0), yb - h, X(b - 24) - X(0), h); }
    }
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textBaseline = 'bottom';
    for (let t = 0; t <= 24; t += 6) { ctx.textAlign = t === 0 ? 'left' : t === 24 ? 'right' : 'center'; ctx.fillText(String(t).padStart(2, '0') + ':00', X(t), yb - h - 2); }
    const c = clockStr(S.hours);
    ctx.fillStyle = th.accent; ctx.fillRect(X(c.tod) - 1, yb - h - 3, 2, h + 6);
    ctx.textAlign = 'left'; ctx.fillStyle = th['text-2'];
    ctx.fillText('lamp', X(9) + 2, yb + 11);
    ctx.restore();
  }
  function card(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,22,.78)'; ctx.strokeStyle = 'rgba(80,100,140,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function led(ctx, x, y, on, col) {
    ctx.save();
    ctx.fillStyle = on ? col : '#3A4254';
    if (on) { ctx.shadowColor = col; ctx.shadowBlur = 6; }
    ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill(); ctx.restore();
  }
  const fmtFlux = (v, u) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + u;

  /* the parts, what each is doing right now, and whether it is running */
  function partsPanel(g, S, x, y, w) {
    const ctx = g.ctx, th = g.theme, p = S.p, f = S.tank.flux, T = S.tank;
    const rows = [
      ['Lamp', p.lamp, f.lampW > 0 ? fmtFlux(f.lightW, 'W of light in') : (p.lamp ? 'timer: off' : 'unplugged'), '#FFE08A'],
      ['Plants', p.plants > 0, p.plants > 0 ? (f.Pg > 0.5 ? 'make ' + fmtFlux(f.Pg, 'mg O₂/h') : 'use ' + fmtFlux(f.Rp, 'mg O₂/h')) : 'none planted', '#7BE08A'],
      ['Fish', f.alive > 0.5, Math.round(f.alive) + ' neons · use ' + fmtFlux(f.Rf, 'mg O₂/h'), '#3AF0E0'],
      ['Filter bacteria', p.filter, (p.filter ? '' : 'no flow · ') + 'oxidise ' + fmtFlux(f.r1, 'mg N/h'), '#FF8FB0'],
      ['Air pump', p.pump, p.pump ? 'stirring the surface' : 'unplugged', '#C9D6E8'],
      ['Heater', p.heater, p.heater ? (T.heatOn ? 'heating · ' + HEATER_W + ' W' : 'resting · set ' + p.setT + ' °C') : 'unplugged', '#FF9A5A']
    ];
    const rh = 17, h = rows.length * rh + 22;
    card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('THE PARTS', x + 9, y + 10);
    rows.forEach(([name, on, what, col], i) => {
      const yy = y + 24 + i * rh;
      led(ctx, x + 12, yy, on, col);
      ctx.font = '600 10.5px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on ? th.text : th['text-3'];
      ctx.fillText(name, x + 22, yy);
      ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = on ? th['text-2'] : th['text-3'];
      ctx.fillText(what, x + 22 + Math.min(96, w * 0.33), yy);
    });
    ctx.restore();
  }

  /* the interaction web: every arrow is a flux the model is computing now */
  function webAnchors(S, zw) {
    const F = S.fish.length ? S.fish : [{ p: [0, 0, 0.18] }];
    const c = [0, 0, 0]; F.forEach(f => { c[0] += f.p[0]; c[1] += f.p[1]; c[2] += f.p[2]; });
    const plant = S.stems.length ? [S.stems.reduce((a, s) => a + s[0], 0) / S.stems.length, S.stems.reduce((a, s) => a + s[1], 0) / S.stems.length, 0.15] : [-0.16, 0.08, 0.10];
    return {
      lamp: [0, 0, ZT + 0.03], plants: plant, fish: [c[0] / F.length, c[1] / F.length, c[2] / F.length],
      bact: [FILTER_AT[0], FILTER_AT[1] + 0.03, ZT - 0.05], air: [-0.12, -0.05, zw + 0.02], heater: [HEATER_A[0], HEATER_A[1], 0.2]
    };
  }
  function drawWeb(g, S) {
    const ctx = g.ctx, cam = S.cam, f = S.tank.flux, p = S.p, zw = surfaceZ(S);
    const A = webAnchors(S, zw);
    const edges = [
      ['lamp', 'plants', f.lightW * (1 - Math.exp(-0.05 * Math.max(0, S.tank.y[PC]) / 400)), 'W', '#FFE08A', 'light'],
      ['plants', 'fish', f.Pg - f.Rp, 'mg O₂/h', '#9FF0FF', 'O₂'],
      ['fish', 'plants', f.resF / MW_C * MW_CO2, 'mg CO₂/h', '#FFB35C', 'CO₂'],
      ['fish', 'bact', f.exN, 'mg N/h', '#FF8FB0', 'ammonia'],
      ['bact', 'plants', f.r2, 'mg N/h', '#8FE388', 'nitrate'],
      ['air', 'fish', f.exO2, 'mg O₂/h', '#DDEBFF', 'O₂ from air'],
      ['heater', 'fish', f.heat, 'W', '#FF9A5A', 'heat']
    ];
    ctx.save();
    for (const [a, b, v, unit, col, name] of edges) {
      let from = A[a], to = A[b], val = v;
      if (val < 0) { const t = from; from = to; to = t; val = -val; }      // a flux that has reversed flips its arrow
      const qa = cam.project(from), qb = cam.project(to);
      if (!qa.ok || !qb.ok) continue;
      const on = val > 1e-3;
      const wdt = on ? clamp(1 + Math.log10(1 + val) * 2.2, 1, 7) : 1;
      const mx = (qa.x + qb.x) / 2, my = (qa.y + qb.y) / 2, nx = -(qb.y - qa.y), ny = qb.x - qa.x, nl = Math.hypot(nx, ny) || 1;
      const cx = mx + nx / nl * 26, cy = my + ny / nl * 26;
      ctx.strokeStyle = on ? RX.rgba(col, 0.85) : 'rgba(120,130,150,.35)';
      ctx.lineWidth = wdt; ctx.lineCap = 'round';
      if (!on) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(qa.x, qa.y); ctx.quadraticCurveTo(cx, cy, qb.x, qb.y); ctx.stroke();
      if (on) {                                             // arrowhead at 85 % along the curve
        const t = 0.86, u = 1 - t;
        const px = u * u * qa.x + 2 * u * t * cx + t * t * qb.x, py = u * u * qa.y + 2 * u * t * cy + t * t * qb.y;
        const tx = 2 * u * (cx - qa.x) + 2 * t * (qb.x - cx), ty = 2 * u * (cy - qa.y) + 2 * t * (qb.y - cy), tl = Math.hypot(tx, ty) || 1;
        const hx = tx / tl, hy = ty / tl, s2 = 5 + wdt;
        ctx.fillStyle = RX.rgba(col, 0.95);
        ctx.beginPath(); ctx.moveTo(px + hx * s2, py + hy * s2); ctx.lineTo(px - hy * s2 * 0.6, py + hx * s2 * 0.6); ctx.lineTo(px + hy * s2 * 0.6, py - hx * s2 * 0.6); ctx.closePath(); ctx.fill();
      }
      g.label(cx, cy, name + ' ' + (on ? fmtFlux(val, unit) : '0'), { colour: on ? col : '#63729A', size: 9.5 });
    }
    ctx.setLineDash([]);
    ctx.restore();
    void p;
  }

  /* =====================================================================
     THE LANDSCAPE — dawn O₂ against stocking, for every plant mass.
     Each point is a four-day run of the same model with the deck's other
     settings, filled in a few milliseconds a frame so the lab never stalls.
     ===================================================================== */
  const LAND_FISH = [0, 10, 20, 30, 40, 50, 60, 70, 80], LAND_PLANTS = [0, 10, 20, 40];
  function landKey(p) {
    return [p.lamp, p.lampW, p.photo, p.food, p.filter, p.pump, p.media, p.heater, p.setT, p.roomT, p.kh, p.change].join('|');
  }
  function landStep(S, budget) {
    const p = S.p, key = landKey(p);
    if (!S.land || S.land.key !== key) S.land = { key, res: {}, next: 0 };
    const L2 = S.land, total = LAND_FISH.length * LAND_PLANTS.length;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t0 = now();
    while (L2.next < total && now() - t0 < budget) {
      const i = L2.next, nf = LAND_FISH[i % LAND_FISH.length], pg = LAND_PLANTS[Math.floor(i / LAND_FISH.length)];
      const cfg = tankCfg(Object.assign({}, p, { fish: nf, plants: pg }));
      cfg.food = p.food * (p.fish > 0 ? nf / p.fish : nf / 20);        // feed in proportion to the fish
      const v = MODEL.vessel(cfg);
      let t = 8, lo = 1e9;
      for (let k = 0; k < 96; k++) {
        MODEL.advance(v, 1, t, 0.1); t += 1;
        if (t > 72 + 12) lo = Math.min(lo, v.y[O2]);
      }
      L2.res[nf + '|' + pg] = lo;
      L2.next++;
    }
  }

  /* =====================================================================
     REGISTRATION
     ===================================================================== */
  /* ---------------- presets start from the full default state ---------------- */
  const BASE = {
    setup: 'unplug', clock: 1, start: 8, lamp: true, lampW: 20, photo: 8, plants: 20, fish: 20, food: 0.08,
    filter: true, pump: true, media: 'mature', heater: true, setT: 25, roomT: 22, kh: 4, change: 20,
    align: 1.0, cohere: 1.0, sepCm: 3.2, noise: 0.6, leader: false, removeTag: false, predator: false,
    bound: 'water', question: 'dawn', window: 180, shrimp: 3, tracer: 'carbon', tracers: 12, level: 'tank',
    graph: 'o2', web: true, cutFilter: false
  };
  function preset(o) { return Object.assign({}, BASE, o); }

  const SETUPS = [
    { value: 'unplug', label: 'Unplug a part', teaches: ['A1.1', 'A1.3'] },
    { value: 'zoom', label: 'Systems inside systems', teaches: ['A1.2', 'A1.5'] },
    { value: 'shoal', label: 'No fish in charge', teaches: ['A1.4'] },
    { value: 'boundary', label: 'Draw the boundary', teaches: ['A2.1', 'A2.5'] },
    { value: 'sealed', label: 'Open, closed, sealed', teaches: ['A2.2'] },
    { value: 'trace', label: 'Follow an atom and a joule', teaches: ['A2.3', 'A2.4'] }
  ];
  const is = v => S => S.p.setup === v;
  // the tank's parts are the experiment in these set-ups; in the shoal only the rules, the fish and the lamp are
  const tankRun = S => S.p.setup !== 'zoom' && S.p.setup !== 'shoal';
  const among = (...v) => S => v.includes(S.p.setup);

  L.register({
    id: 'g6a-living-tank',
    grade: 6, unit: '6A', topics: ['A1', 'A2'],
    subject: 'engineering',
    name: 'The Living Tank — Parts, Boundaries and Flows',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS CCC · Systems and System Models', 'NGSS MS-LS2-3', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    bloom: 0.22,
    stageHint: 'Drag to turn · scroll to zoom · every number is live',
    lede: 'A planted 54-litre aquarium, <b>integrated as the system it is</b>: plants and algae make oxygen ' +
      'in the light and burn it in the dark, twenty neon tetras breathe and excrete ammonia, two bacterial ' +
      'populations on the filter media turn that ammonia into nitrite and nitrate, the surface trades ' +
      'gases with the room, and a thermostat fights the room for the temperature. <b>Nothing here is ' +
      'animated from a script</b> — dissolved O₂, pH, every nitrogen form, the heat and the shoal itself are ' +
      'computed as they happen. Switch a part off and watch which other parts fail; draw a boundary and ' +
      'read what crosses it; seal a world in glass and see what it cannot live without.',

    params: {
      setup: 'unplug', clock: 1, start: 8,
      lamp: true, lampW: 20, photo: 8,
      plants: 20,
      fish: 20, food: 0.08,
      filter: true, pump: true, media: 'mature',
      heater: true, setT: 25, roomT: 22,
      kh: 4, change: 20,
      align: 1.0, cohere: 1.0, sepCm: 3.2, noise: 0.6, leader: false, removeTag: false, predator: false,
      bound: 'water', question: 'dawn',
      window: 180, shrimp: 3,
      tracer: 'carbon', tracers: 12,
      level: 'tank',
      graph: 'o2', web: true, cutFilter: false
    },

    presets: [
      { name: 'Balanced planted tank', params: preset({}) },
      { name: 'Power cut on a hot night', params: preset({ start: 20, roomT: 31, setT: 26, filter: false, pump: false, heater: false, lamp: false }) },
      { name: 'New tank, fish added on day one', params: preset({ media: 'new', plants: 0, clock: 24, graph: 'nitrogen' }) },
      { name: 'Filter rinsed under the tap', params: preset({ media: 'tap', clock: 6, graph: 'nitrogen' }) },
      { name: 'Green water: bright, long days, no plants', params: preset({ plants: 0, lampW: 40, photo: 14, change: 0, clock: 72 }) },
      { name: 'A school under attack', params: preset({ setup: 'shoal', predator: true }) },
      { name: 'Two sealed worlds', params: preset({ setup: 'sealed', clock: 24 }) },
      { name: 'Follow a carbon atom from the food', params: preset({ setup: 'trace', tracer: 'carbon', clock: 6 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Experiment', restructure: true, options: SETUPS } ] },
      { group: 'Clock', items: [
        { key: 'clock', type: 'select', label: 'Simulated time per second', restructure: false, options: [
          { value: 1, label: '1 hour' }, { value: 6, label: '6 hours' }, { value: 24, label: '1 day' }, { value: 72, label: '3 days' }] } ] },
      { group: 'Light', when: tankRun, items: [
        { key: 'lamp', type: 'toggle', label: 'Lamp plugged in (timer on at 09:00)' },
        { key: 'lampW', label: 'LED power', min: 0, max: 40, step: 1, unit: 'W', fmt: v => v.toFixed(0) },
        { key: 'photo', label: 'Hours of light a day', min: 0, max: 16, step: 0.5, unit: 'h', fmt: v => v.toFixed(1) } ] },
      { group: 'Plants', when: tankRun, items: [
        { key: 'plants', label: 'Plants planted (dry mass)', min: 0, max: 40, step: 1, unit: 'g', fmt: v => v.toFixed(0), restructure: true } ] },
      { group: 'Fish', when: tankRun, items: [
        { key: 'fish', label: 'Neon tetras', min: 0, max: 80, step: 1, fmt: v => v.toFixed(0), restructure: true },
        { key: 'food', label: 'Flake food a day', min: 0, max: 0.6, step: 0.01, unit: 'g', fmt: v => v.toFixed(2) } ] },
      { group: 'Filter and air', when: tankRun, items: [
        { key: 'filter', type: 'toggle', label: 'Filter running' },
        { key: 'pump', type: 'toggle', label: 'Air pump running' },
        { key: 'media', type: 'select', label: 'Filter media', restructure: true, options: [
          { value: 'mature', label: 'Mature' }, { value: 'new', label: 'Brand new' },
          { value: 'tap', label: 'Rinsed in tap water' }, { value: 'tank', label: 'Rinsed in tank water' }] } ] },
      { group: 'Heater and room', when: tankRun, items: [
        { key: 'heater', type: 'toggle', label: 'Heater plugged in' },
        { key: 'setT', label: 'Thermostat set to', min: 18, max: 32, step: 0.5, unit: '°C', fmt: v => v.toFixed(1) },
        { key: 'roomT', label: 'Room temperature', min: 10, max: 35, step: 0.5, unit: '°C', fmt: v => v.toFixed(1) } ] },
      { group: 'Water', when: tankRun, items: [
        { key: 'kh', label: 'Carbonate hardness', min: 1, max: 12, step: 0.5, unit: 'dKH', fmt: v => v.toFixed(1) },
        { key: 'change', label: 'Water changed each week', min: 0, max: 60, step: 5, unit: '%', fmt: v => v.toFixed(0) } ] },
      { group: 'The shoal', when: is('shoal'), items: [
        { key: 'fish', label: 'Fish in the shoal', min: 2, max: 80, step: 1, fmt: v => v.toFixed(0), restructure: true },
        { key: 'lamp', type: 'toggle', label: 'Lamp plugged in (at night the shoal slows and sinks)' } ] },
      { group: 'Shoal rules — what each fish does', when: is('shoal'), items: [
        { key: 'align', label: 'Match your neighbours’ heading', min: 0, max: 2, step: 0.05, fmt: v => v.toFixed(2) },
        { key: 'cohere', label: 'Steer toward your neighbours', min: 0, max: 2, step: 0.05, fmt: v => v.toFixed(2) },
        { key: 'sepCm', label: 'Keep at least this far apart', min: 0.5, max: 5, step: 0.1, unit: 'cm', fmt: v => v.toFixed(1) },
        { key: 'noise', label: 'Random turning', min: 0, max: 4, step: 0.05, fmt: v => v.toFixed(2) },
        { key: 'leader', type: 'toggle', label: 'Instead: everyone follows the tagged fish' },
        { key: 'removeTag', type: 'toggle', label: 'Net out the tagged fish' },
        { key: 'predator', type: 'toggle', label: 'Add an angelfish' } ] },
      { group: 'Boundary', when: is('boundary'), items: [
        { key: 'bound', type: 'select', label: 'Boundary drawn around', restructure: false, options: [
          { value: 'fish', label: 'One fish' }, { value: 'plants', label: 'The plants' }, { value: 'filter', label: 'The filter' },
          { value: 'water', label: 'The water' }, { value: 'tank', label: 'Tank and air above' }, { value: 'room', label: 'The room' }] },
        { key: 'question', type: 'select', label: 'Question to answer', restructure: false, options: [
          { value: 'dawn', label: 'Why do fish gasp at dawn?' }, { value: 'ammonia', label: 'Where does the ammonia go?' },
          { value: 'level', label: 'Why does the water level drop?' }, { value: 'food', label: 'What does one fish use?' },
          { value: 'warm', label: 'Why is the room warmer?' }] } ] },
      { group: 'Sealed sphere', when: is('sealed'), items: [
        { key: 'window', label: 'Window light at noon', min: 0, max: 400, step: 10, unit: 'µmol/m²/s', fmt: v => v.toFixed(0) },
        { key: 'shrimp', label: 'Shrimp in each sphere', min: 0, max: 10, step: 1, fmt: v => v.toFixed(0), restructure: true } ] },
      { group: 'Tracer', when: is('trace'), items: [
        { key: 'tracer', type: 'select', label: 'Follow', restructure: false, onChange: S => initTracers(S),
          options: [{ value: 'carbon', label: 'Carbon atoms' }, { value: 'energy', label: 'Joules of light' }] },
        { key: 'tracers', label: 'How many to follow', min: 1, max: 40, step: 1, fmt: v => v.toFixed(0), restructure: true } ] },
      { group: 'Zoom', when: is('zoom'), items: [
        { key: 'level', type: 'select', label: 'Look at', restructure: false, options: [
          { value: 'planet', label: 'The planet' }, { value: 'tank', label: 'The tank' }, { value: 'fish', label: 'One fish' },
          { value: 'gill', label: 'A gill' }, { value: 'cell', label: 'A cell' }, { value: 'mito', label: 'A mitochondrion' }] } ] },
      { group: 'Display', items: [
        { key: 'graph', type: 'select', label: 'Graph the tank’s', display: true, when: among('unplug', 'boundary', 'zoom'), options: [
          { value: 'o2', label: 'Oxygen' }, { value: 'nitrogen', label: 'Nitrogen' }, { value: 'ph', label: 'pH' }, { value: 'heat', label: 'Temperature' }] },
        { key: 'web', type: 'toggle', label: 'Show the interaction web', display: true, when: is('unplug') },
        { key: 'cutFilter', type: 'toggle', label: 'Cut the filter open', display: true, when: is('unplug') } ] }
    ],

    setup(S) {
      const p = S.p;
      // each set-up has its own home view; the camera keeps the student's orbit until the set-up changes
      const home = homeFor(p.setup, !!S._narrow);
      if (!S.cam || S.camFor !== p.setup) {
        S.cam = Camera(Object.assign({}, home, { target: home.target.slice() }));
        S.cam.minDist = 0.36; S.cam.maxDist = 3.0; S.camFor = p.setup; S._narrowCam = !!S._narrow;
      }
      S.seed = 20260925;
      S.hist = []; S.vref = [MEDIA.mature, MEDIA.mature];
      S.tank = MODEL.vessel(tankCfg(p));
      if (p.media !== 'new') {
        // an established tank: three days run first with mature media, so the run opens on
        // the chemistry of a lived-in morning — then the media's state takes over
        // — and those three days are recorded, so every graph opens on the tank's recent past
        const mat = tankCfg(Object.assign({}, p, { media: 'mature', lamp: true, filter: true, pump: true, heater: true }));
        S.tank = MODEL.vessel(mat);
        for (let k = 0; k < 360; k++) {
          MODEL.advance(S.tank, 0.2, p.start + k * 0.2, 0.1);
          S.hours = p.start + (k + 1) * 0.2;
          if (k < 359) S.hist.push(sample(S));
        }
        S.tank.cfg = tankCfg(p);
        S.vref = [S.tank.y[V1], S.tank.y[V2]];             // a mature filter's two populations: the cutaway's yardstick
        S.tank.y[V1] = MEDIA[p.media] * (p.media === 'mature' ? S.tank.y[V1] / 6 : 1);
        S.tank.y[V2] = MEDIA[p.media] * (p.media === 'mature' ? S.tank.y[V2] / 6 : 1);
        S.tank.y[NF] = p.fish;
      }
      S.hours = p.start + (p.media !== 'new' ? 72 : 0); S.t0h = S.hours; S.ta = 0; S.lostL = 0;
      S.fish = makeFish(S, p.fish); S.dead = []; S.pearls = []; S.pearlAcc = 0;
      layPlants(S);
      S.pred = { p: [0.22, 0.02, 0.21], v: [-0.03, 0, 0], ph: 0, lock: -1, held: 0 };
      S.caught = 0; S.confused = 0;
      if (p.setup === 'sealed') { S.sphere = MODEL.vessel(sphereCfg(p, false)); S.dark = MODEL.vessel(sphereCfg(p, true)); }
      else { S.sphere = null; S.dark = null; }
      S.sHist = [];
      MODEL.advance(S.tank, 1e-6, S.hours);
      if (S.sphere) { MODEL.advance(S.sphere, 1e-6, S.hours); MODEL.advance(S.dark, 1e-6, S.hours); }
      S.hist.push(sample(S)); S.nextSample = S.hours + HIST_DT;
      if (p.setup === 'sealed') S.sHist.push({ t: S.hours, open: MODEL.carbon(S.tank), win: MODEL.carbon(S.sphere), dark: MODEL.carbon(S.dark), o2w: S.sphere.y[O2], o2d: S.dark.y[O2] });
      S.c0 = S.sphere ? { win: MODEL.carbon(S.sphere), dark: MODEL.carbon(S.dark), wWin: MODEL.omega(S.sphere), wDark: MODEL.omega(S.dark) } : null;
      S.cOpen0 = MODEL.carbon(S.tank);
      if (p.setup === 'sealed') sphereAgents(S); else S.shr = null;
      S.tr = null;
      if (p.setup === 'trace') initTracers(S);
      S.order = shoalOrder(S); S.oHist = []; S.oNext = 0; S.speedBL = 0;
      if (p.setup === 'zoom' && window.EARTH) EARTH.load();
    },

    step(S, dt) {
      tick(S, dt);
      const p = S.p;
      if (p.setup === 'unplug') landStep(S, 4);
      if (p.setup === 'shoal') {
        S.order = shoalOrder(S);
        const F = S.fish.filter(f => !(p.removeTag && f.tag));
        S.speedBL = F.length ? F.reduce((a, f) => a + Math.hypot(f.v[0], f.v[1], f.v[2]), 0) / F.length / FISH_L : 0;
        // the view drifts with the shoal so the shoal stays the subject; orbiting and zooming still work
        if (S.cam && F.length) {
          let cx = 0, cz = 0; F.forEach(f => { cx += f.p[0]; cz += f.p[2]; }); cx /= F.length; cz /= F.length;
          const k = 1 - Math.exp(-Math.min(dt, 0.1) * 0.8);
          S.cam.target[0] += (clamp(cx, -0.13, 0.13) - S.cam.target[0]) * k;
          S.cam.target[2] += (clamp(cz, 0.11, 0.24) - S.cam.target[2]) * k;
        }
        if (S.ta >= S.oNext) { S.oHist.push({ t: S.ta, phi: S.order.phi, group: S.order.group }); S.oNext = S.ta + 0.25; if (S.oHist.length > 400) S.oHist.shift(); }
        orderStep(S, 3);
      }
      if (p.setup === 'trace') traceAnimate(S, dt);
      if (p.setup === 'sealed') shrimpStep(S, Math.min(dt, 0.05));
    },

    drawStage(S, g) { drawStageAll(S, g); },

    /* the boundary's grip: drag out for a bigger boundary, in for a smaller one */
    onDrag(S, e) {
      if (e.id !== 'bound') return;
      if (e.phase === 'start') { S.dragAcc = 0; return; }
      S.dragAcc = (S.dragAcc || 0) + e.dx - e.dy;
      const i = BOUNDS.indexOf(S.p.bound);
      if (S.dragAcc > 55 && i < BOUNDS.length - 1) { S.p.bound = BOUNDS[i + 1]; S.dragAcc = 0; }
      else if (S.dragAcc < -55 && i > 0) { S.p.bound = BOUNDS[i - 1]; S.dragAcc = 0; }
    },
    /* a click on the zoom ladder moves to that level */
    onPointer(S, x, y, down, type) {
      if (type !== 'pointerdown') return;
      const C = S._chip;
      if (C && x >= C.x0 && x <= C.x1 && y >= C.y0 && y <= C.y1) { S.cardOpen = !S.cardOpen; return; }
      if (S.p.setup !== 'zoom' || !S._rungs) return;
      const r = S._rungs.find(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
      if (r) S.p.level = r.lv;
    },

    plots: [
      { title: S => titleOne(S),
        draw(S, g) { plotOne(S, g); },
        hover(S, x) { return (S.p.setup === 'unplug' || S.p.setup === 'boundary' || S.p.setup === 'zoom') ? historyHover(S, x) : null; } },
      { title: S => titleTwo(S),
        draw(S, g) { plotTwo(S, g); },
        hover(S, x) { return S.p.setup === 'unplug' ? landHover(S, x) : null; } }
    ],

    readouts(S) { return readoutsAll(S); },
    equation(S) { return equationAll(S); },

    problems: [
      { source: 'CAST pattern · a system with a part removed',
        q: 'A planted 54 L tank with 20 neons loses power at 20:00 on a hot night (room 31 °C): no filter, no air pump, ' +
           'no lamp. What will the dissolved O₂ be at 07:00 the next morning, in mg/L?',
        params: preset({ start: 20, roomT: 31, setT: 26, filter: false, pump: false, heater: false, lamp: false }),
        predict: { label: 'O₂ at 07:00', unit: 'mg/L', tol: 0.15 },
        measure: S => runTank(S.p, 11).y[O2],
        working: 'At 31 °C water holds only 7.4 mg/L. With the surface still, the air returns O₂ very slowly, while the plants, ' +
          'fish, bacteria and decay all keep breathing through the night — more than 20 mg of O₂ an hour, from 54 L. ' +
          'The level falls by roughly 0.5 mg/L an hour, and by dawn the fish are gasping at the surface. The plants that ' +
          'made O₂ all afternoon are now the biggest users of it.' },
      { source: 'NGSS · interactions in a system',
        q: 'The filter media of a healthy tank are rinsed under the tap. The filter keeps running. About how many hours ' +
           'until a test kit reads 0.5 mg/L of ammonia — the level at which fish start to suffer?',
        params: preset({ media: 'tap', clock: 6, graph: 'nitrogen' }),
        predict: { label: 'hours', unit: 'h', tol: 0.35 },
        measure: S => hoursUntil(S.p, v => v.y[TAN] * MW_NH3 / MW_N > 0.5, 240),
        working: 'The filter was never a sieve: its job is done by bacteria living on the media, and the chlorine in tap water ' +
          'kills about 95 % of them. The fish go on excreting ammonia, the few surviving bacteria cannot keep up, and it ' +
          'builds until the population regrows — the pump running all the while.' },
      { source: 'NGSS · open and closed systems',
        q: 'The sealed sphere on the window holds 52.171 mg of carbon when it is sealed. How much carbon is inside after 30 days?',
        params: preset({ setup: 'sealed', clock: 24 }),
        predict: { label: 'carbon', unit: 'mg', tol: 0.001 },
        measure: S => { const v = MODEL.vessel(sphereCfg(S.p, false)); for (let k = 0; k < 720; k++) MODEL.advance(v, 1, 8 + k, 0.1); return MODEL.carbon(v); },
        working: 'Exactly 52.171 mg. Only light and heat cross the glass, so no carbon can enter or leave: it moves between the ' +
          'dissolved CO₂, the algae, the shrimp, the debris and the air bubble, but the total stays. The model conserves it to ' +
          'fourteen decimal places — carbon is not created or destroyed, only moved.' },
      { source: 'NGSS · the parts of a system and their interactions',
        q: 'Draw the boundary around one neon tetra at 25 °C. How many milligrams of O₂ cross that boundary each hour?',
        params: preset({ setup: 'boundary', bound: 'fish', question: 'food' }),
        predict: { label: 'O₂', unit: 'mg/h', tol: 0.1 },
        measure: S => S.tank.flux.Rf / Math.max(1, S.tank.flux.alive),
        working: 'A small tropical fish uses about 0.45 mg of O₂ per gram of body each hour at 25 °C; a neon weighs 0.4 g, so ' +
          '0.45 × 0.4 ≈ 0.18 mg/h. Warm the water and it rises (roughly doubling per 10 °C) — the boundary is the same, the flow is not.' },
      { source: 'NGSS · emergent properties',
        q: 'With the shoal rules at their starting values, the order Φ is close to 1. Raise the random turning to 3.0. What will Φ be?',
        params: preset({ setup: 'shoal', noise: 3.0 }),
        predict: { label: 'Φ', unit: '', tol: 0.25 },
        measure: S => blindOrder(S.p, 3.0, S.stems),
        working: 'Order falls as each fish’s own random turning grows against the pull of its neighbours — but not steadily. It holds ' +
          'near 0.9 up to a noise of about 2, then collapses: at 3.0 the school is only loosely aligned, and a little more breaks it up. ' +
          'No fish measures Φ or aims for it, and no fish has a tipping point — both belong to the group, which is what emergent means.' }
    ],

    walkthrough: [
      { title: '1 · The parts, and what joins them',
        body: 'Every part of this tank is doing something to every other part. The web shows each interaction as an arrow whose ' +
              'width is the flow the model is computing now.',
        ask: 'Which part makes the oxygen the fish breathe?',
        reveal: '<b>Two parts do.</b> The plants make it in the light, and the surface takes it in from the air — faster when the pump ' +
                'and filter stir it. Watch the “O₂ from air” arrow turn round in the afternoon, when the plants overfill the water.',
        params: preset({}) },
      { title: '2 · Unplug the parts that stir the surface, on a hot night',
        body: 'A power cut at 20:00, the room at 31 °C. Run it to dawn with the clock at 1 hour a second.',
        ask: 'Do the plants protect the fish overnight?',
        reveal: '<b>No — they make it worse.</b> In the dark a plant only breathes. The tank’s biggest O₂ producer becomes one of its ' +
                'biggest users, the still surface cannot keep up, and by 06:00 the fish are gasping at the top. <b>A part’s effect ' +
                'depends on the other parts.</b>',
        params: preset({ start: 20, roomT: 31, setT: 26, filter: false, pump: false, heater: false, lamp: false }) },
      { title: '3 · The filter that is not a sieve',
        body: 'The media have just been rinsed under the tap. The filter is running exactly as before.',
        ask: 'What will happen to the ammonia?',
        reveal: '<b>It climbs.</b> The filter’s work is done by bacteria living on the media, and tap-water chlorine killed most of them. ' +
                'Switch the graph to nitrogen: ammonia peaks, then nitrite, as the two bacterial populations regrow in turn.',
        params: preset({ media: 'tap', clock: 6, graph: 'nitrogen' }) },
      { title: '4 · Systems inside systems',
        body: 'Climb the ladder: the planet, the tank, one fish, one gill arch, one cell, one mitochondrion.',
        ask: 'What stays the same at every level?',
        reveal: '<b>The exchange itself: O₂ in, CO₂ out.</b> The rate spans more than thirty powers of ten, from tonnes a year to a few ' +
                'thousand molecules a second, but each level is made of the one below and does what its parts do.',
        params: preset({ setup: 'zoom', level: 'gill' }) },
      { title: '5 · No fish is in charge',
        body: 'Each neon follows three rules about its nearest neighbours. Nothing tells the school where to go.',
        ask: 'Net out the tagged fish. Will the school fall apart?',
        reveal: '<b>No.</b> Remove any fish and the rest carry on — the order was never kept by one fish. Now switch on “everyone ' +
                'follows the tagged fish” and net it out again: <b>that</b> school collapses. Order made by interactions is ' +
                'emergent; order that needs a leader is not.',
        params: preset({ setup: 'shoal', removeTag: true }) },
      { title: '6 · A boundary is a choice',
        body: 'The same tank, five questions. Change the question and see which boundary answers it.',
        ask: 'Which boundary answers “why is the room warmer?”',
        reveal: '<b>The tank and the air above it, or the whole room.</b> Every watt of electricity that goes in — lamp, heater, pump, ' +
                'filter — comes out as heat. A boundary round the water misses most of it.',
        params: preset({ setup: 'boundary', bound: 'water', question: 'warm' }) },
      { title: '7 · Sealed in glass',
        body: 'Two sealed spheres: one in the sun, one in a cupboard. Run a few weeks at a day a second.',
        ask: 'Which sphere keeps its carbon?',
        reveal: '<b>Both, exactly.</b> Carbon cannot cross glass. But only the sunny one stays alive: it has an energy input, so the ' +
                'cycle keeps turning. In the dark the same atoms are still there, but the living system runs down. <b>A closed ' +
                'system still needs energy to cross its boundary.</b>',
        params: preset({ setup: 'sealed', clock: 24 }) },
      { title: '8 · Follow an atom, then a joule',
        body: 'Tag the carbon in a pinch of food, and watch where it goes. Then tag light from the lamp instead.',
        ask: 'Does carbon ever come back to where it has been? Does energy?',
        reveal: '<b>Carbon does, again and again:</b> fish, water, plant, debris, water, plant… until the air or a water change takes it. ' +
                '<b>Energy does not:</b> light becomes sugar or warmth, and every joule ends as heat leaving through the glass. ' +
                'Matter cycles; energy flows through.',
        params: preset({ setup: 'trace', tracer: 'carbon', clock: 6 }) }
    ],

    quiz: [
      { q: 'A filter is rinsed under the tap. It keeps running, yet two days later the ammonia is dangerously high. Why?',
        options: ['The pump slowed down', 'Tap-water chlorine killed the bacteria that live on the media', 'Rinsing added ammonia to the tank', 'The fish ate more food'],
        answer: 1, why: 'The filter’s real work is biological. Set the media to “rinsed in tap water” and switch the graph to nitrogen: ammonia rises while the pump runs normally.' },
      { q: 'When is the dissolved oxygen in a planted tank lowest?',
        options: ['At noon', 'Just before the lamp comes on', 'Right after feeding', 'It stays the same all day'],
        answer: 1, why: 'All night every living part only uses O₂. The minimum comes at the end of the dark — see the dips on the oxygen graph just before 09:00.' },
      { q: 'What can cross the glass of a sealed sphere?',
        options: ['Oxygen and carbon dioxide', 'Food', 'Light and heat', 'Nothing at all'],
        answer: 2, why: 'A closed system exchanges energy but not matter. That is why the carbon stays at exactly 52.171 mg while the sunny sphere lives and the dark one runs down.' },
      { q: 'A school of neons turns as one. Which is true?',
        options: ['One leader fish decides', 'Each fish follows simple rules about its neighbours; the school’s order emerges', 'The fish signal each other by sound', 'The biggest fish steers'],
        answer: 1, why: 'Net out the tagged fish in self-organised mode and the school carries on. Only in follow-the-leader mode does removing one fish break it.' },
      { q: 'Carbon atoms in the tank ___, but energy ___.',
        options: ['are used up … is recycled', 'go round and round between parts … passes through once and leaves as heat', 'stay in the fish … stays in the plants', 'leave as heat … cycles'],
        answer: 1, why: 'Follow a carbon atom and it returns to the water again and again; follow a joule and it only ever runs downhill into warmth that leaves the tank.' }
    ],

    notes: '<b>Where this shows up.</b><ul>' +
      '<li>NGSS cross-cutting concept <b>Systems and System Models</b>: a system is parts <i>and</i> interactions; removing one part changes the others.</li>' +
      '<li>CAST items show a system diagram and ask what happens when one part is removed or a boundary is drawn somewhere else.</li>' +
      '<li>MS-LS2-3: matter cycles among living and non-living parts while energy flows through.</li></ul>' +
      '<div class="pyq"><em>Misconception to catch</em> “Plants make oxygen, so a planted tank can never run short.” In the dark every ' +
      'plant is an oxygen user — and in a heavily planted tank on a hot, still night, the biggest one.</div>' +
      '<div class="pyq"><em>Misconception to catch</em> “A closed system has nothing crossing its boundary.” Energy does — the sealed ' +
      'sphere lives only because light gets in.</div>',
    eqNote: S => EQ_NOTE[S.p.setup] || EQ_NOTE.unplug
  });

  const EQ_NOTE = {
    unplug: 'The equation is the whole tank’s oxygen budget, summed over every part. <b>Temperature enters twice</b>: warm ' +
      'water holds less O₂ (saturation falls from 9.09 mg/L at 20 °C to 7.54 at 30 °C) and every animal and microbe ' +
      'breathes faster (roughly doubling per 10 °C). The plants’ term is zero in the dark — then they only take away.',
    zoom: 'One fish’s oxygen use, shared out level by level: eight gill arches, about 4 × 10⁸ cells, some 300 mitochondria ' +
      'in each cell. <b>The number shrinks at every rung, the process does not</b> — O₂ in, CO₂ out, heat given off — ' +
      'because each level is made of the one below it.',
    shoal: 'Φ is 1 when every fish points the same way and near 0 when their headings are random. <b>No fish computes it.</b> ' +
      'Each one only turns toward its neighbours’ heading, drifts toward their centre and keeps its distance — the ' +
      'order belongs to the shoal, not to any fish in it.',
    boundary: 'Whatever the boundary, what builds up inside equals what is made or used inside plus what crosses the line. ' +
      '<b>The two sides agree to the model’s precision</b> — move the boundary and the flows change, the bookkeeping does not.',
    sealed: 'Carbon moves between five stores inside the glass — dissolved, algae, shrimp, debris, the air bubble — but ' +
      '<b>the total cannot change</b>, because no matter crosses a sealed boundary. Light gets in and heat gets out: ' +
      'the sphere is closed to matter, open to energy.',
    trace: 'A residence time is store ÷ flow out. A carbon atom waits about τ in the water before a plant, an alga or the ' +
      'air takes it — and then it comes back. <b>A joule waits too, but it never comes back</b>: it leaves through the ' +
      'glass as heat.'
  };

  /* ---------------- plots ----------------
     Every graph's key sits in a band above its frame, never on the data. plotKey lays the
     entries out in rows for the canvas width first, so the plot can reserve the height. */
  function plotKey(g, items, note) {
    const ctx = g.ctx;
    ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace';
    const nw = note ? ctx.measureText(note).width + 18 : 0, avail = g.w - 50 - 16;
    const rows = [[]]; let x = 0;
    items.forEach(it => {
      const w = 19 + ctx.measureText(it.label).width + 16;
      const lim = rows.length === 1 ? avail - nw : avail;
      if (x + w > lim && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      rows[rows.length - 1].push({ it, x }); x += w;
    });
    ctx.restore();
    const K = { t: 14 + rows.length * 14 };
    K.draw = function (P) {
      const th = g.theme;
      ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle';
      rows.forEach((row, r) => row.forEach(({ it, x: dx }) => {
        const x0 = P.x0 + dx, y = 9 + r * 14;
        ctx.fillStyle = it.c; ctx.strokeStyle = it.c;
        if (it.box) { ctx.fillRect(x0, y - 4, 14, 8); if (it.edge) { ctx.strokeStyle = it.edge; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y - 3.5, 13, 7); } }
        else if (it.dot) { ctx.beginPath(); ctx.arc(x0 + 7, y, 4, 0, TAU); ctx.fill(); if (it.edge) { ctx.strokeStyle = it.edge; ctx.lineWidth = 1.5; ctx.stroke(); } }
        else { ctx.lineWidth = it.w || 2.5; ctx.setLineDash(it.dash || []); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 14, y); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = th['text-2']; ctx.textAlign = 'left'; ctx.fillText(it.label, x0 + 19, y);
      }));
      if (note) { ctx.fillStyle = th['text-3']; ctx.textAlign = 'right'; ctx.fillText(note, P.x1, 9); }
      ctx.restore();
    };
    return K;
  }
  /* a time axis in days: whole days when there are several, quarter days (as clock times or
     hours) when there is less than two — never two ticks with the same label */
  function dayAxis(x0, x1, rel) {
    const span = x1 - x0, step = span > 10 ? 2 : span >= 2 ? 1 : span >= 1 ? 0.25 : 0.125;
    const xticks = [];
    for (let v = Math.ceil(x0 / step - 1e-9) * step; v <= x1 + 1e-9; v += step) xticks.push(+v.toFixed(6));
    const xfmt = v => {
      const r = Math.round(v);
      if (Math.abs(v - r) < 1e-6) return String(r);
      const hh = Math.round((v - Math.floor(v)) * 24);
      return rel ? Math.round(v * 24) + ' h' : String(hh).padStart(2, '0') + ':00';
    };
    return { xticks, xfmt };
  }
  function historyPlot(S, g) {
    const H = S.hist, th = g.theme, p = S.p;
    if (H.length < 2) { g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 1 }).frame(); return; }
    // the axis is the tank's calendar: an established tank shows the three days it lived before this run
    const t0h = S.t0h != null ? S.t0h : p.start;
    const tEnd = H[H.length - 1].t, span = Math.max(24, Math.min(24 * 14, tEnd - H[0].t));
    const tS = tEnd - span;
    const X = h => h / 24 + 1;
    const series = {
      o2: [['o2', '#3DD6F5', 'dissolved O₂'], ['sat', '#8A96BA', 'what the water can hold']],
      nitrogen: [['tan', '#9ED86A', 'ammonia'], ['no2', '#E07AD8', 'nitrite'], ['no3', '#FF9A5A', 'nitrate']],
      ph: [['ph', '#A98BFF', 'pH']],
      heat: [['T', '#FF9A5A', 'water']]
    }[p.graph];
    let lo = Infinity, hi = -Infinity;
    const vis = H.filter(h => h.t >= tS);
    vis.forEach(h => series.forEach(([k]) => { lo = Math.min(lo, h[k]); hi = Math.max(hi, h[k]); }));
    if (p.graph === 'heat') { lo = Math.min(lo, p.setT, p.roomT); hi = Math.max(hi, p.setT, p.roomT); }
    if (p.graph === 'o2' || p.graph === 'nitrogen') lo = 0;
    const pad = (hi - lo) * 0.12 || 0.5;
    const items = series.map(([k, col, name]) => ({ c: col, label: name, dash: k === 'sat' ? [5, 4] : null }));
    items.push({ c: 'rgba(22,30,52,1)', edge: 'rgba(120,140,190,.45)', label: 'lamp off', box: true });
    const K = plotKey(g, items);
    const x0 = X(tS), x1 = X(tEnd);
    const P = g.Plot(Object.assign({ xmin: x0, xmax: x1, ymin: lo - (lo === 0 ? 0 : pad), ymax: hi + pad, pad: { t: K.t },
                       xlabel: 'day', ylabel: { o2: 'mg/L', nitrogen: 'mg/L', ph: 'pH', heat: '°C' }[p.graph],
                       yfmt: v => v.toFixed(1) }, dayAxis(x0, x1, false))).frame();
    K.draw(P);
    P.clip(() => {
      // night bands: the lamp off
      for (let d = Math.floor(tS / 24) - 1; d <= Math.ceil(tEnd / 24); d++) {
        const on = d * 24 + 9, off = on + (p.lamp ? p.photo : 0);
        const a = Math.max(X(off), x0), b = Math.min(X(on + 24), x1);
        if (b > a) { g.ctx.fillStyle = 'rgba(10,16,30,.55)'; g.ctx.fillRect(P.X(a), P.y1, P.X(b) - P.X(a), P.y0 - P.y1); }
      }
      if (p.graph === 'o2') { P.hline(2.5, g.alpha(th.crit, .55), [4, 3]); P.hline(1.3, g.alpha(th.crit, .9), [2, 2]); }
      if (p.graph === 'heat') { P.hline(p.setT, g.alpha(th.accent, .6), [4, 3]); P.hline(p.roomT, g.alpha(th['text-3'], .7), [2, 3]); }
      if (tS < t0h) P.vline(X(t0h), g.alpha(th['text-2'], .55), [2, 3]);
      series.forEach(([k, col], i) => P.line(vis.map(h => [X(h.t), h[k]]), col, i === 0 ? 2 : 1.5, k === 'sat' ? [5, 4] : null));
    });
    const ctx = g.ctx;
    ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'bottom';
    if (p.graph === 'o2') {
      ctx.fillStyle = th.crit; ctx.textAlign = 'right';
      ctx.fillText('fish gasp below 2.5', P.x1 - 4, P.Y(2.5) - 3); ctx.fillText('and die below 1.3', P.x1 - 4, P.Y(1.3) - 3);
    }
    if (p.graph === 'heat') {
      ctx.textAlign = 'right';
      ctx.fillStyle = th.accent; ctx.fillText('thermostat ' + p.setT.toFixed(0) + ' °C', P.x1 - 4, P.Y(p.setT) - 3);
      ctx.fillStyle = th['text-3']; ctx.fillText('room ' + p.roomT.toFixed(0) + ' °C', P.x1 - 4, P.Y(p.roomT) + (p.roomT < p.setT ? 13 : -3));
    }
    if (tS < t0h) {
      const vx = P.X(X(t0h)), room = P.x1 - vx > ctx.measureText('you took over').width + 8;
      ctx.fillStyle = th['text-2']; ctx.textAlign = room ? 'left' : 'right'; ctx.fillText('you took over', vx + (room ? 4 : -4), P.y0 - 4);
    }
    ctx.restore();
  }
  function historyHover(S, xd) {
    const H = S.hist; if (H.length < 2) return null;
    const t = (xd - 1) * 24;
    let b = H[0]; for (const h of H) if (Math.abs(h.t - t) < Math.abs(b.t - t)) b = h;
    return [{ label: 'time', value: clockStr(b.t).text }, { label: 'O₂', value: b.o2.toFixed(2) + ' mg/L', color: '#3DD6F5' },
            { label: 'pH', value: b.ph.toFixed(2) }, { label: 'NH₃/NH₄⁺', value: b.tan.toFixed(2) + ' mg/L' },
            { label: 'NO₂⁻', value: b.no2.toFixed(2) + ' mg/L' }, { label: 'T', value: b.T.toFixed(1) + ' °C' }];
  }
  function landPlot(S, g) {
    const th = g.theme, L2 = S.land, p = S.p;
    const cols = ['#8A93A8', '#7BE08A', '#3FC06A', '#1E8F4A'];
    const done = L2 ? L2.next : 0, tot = LAND_FISH.length * LAND_PLANTS.length;
    const K = plotKey(g, LAND_PLANTS.map((pg, j) => ({ c: cols[j], label: pg + ' g of plants' }))
      .concat([{ c: th.accent, edge: '#FFFFFF', dot: true, label: 'this tank, last night' }]), done < tot ? 'computing ' + done + ' / ' + tot : '');
    const P = g.Plot({ xmin: 0, xmax: 80, ymin: 0, ymax: 10, xlabel: 'neon tetras', ylabel: 'lowest O₂ at dawn, mg/L', pad: { t: K.t },
                       xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    K.draw(P);
    P.clip(() => {
      g.ctx.fillStyle = 'rgba(251,113,133,.10)'; g.ctx.fillRect(P.x0, P.Y(2.5), P.x1 - P.x0, P.y0 - P.Y(2.5));
      P.hline(2.5, g.alpha(th.crit, .55), [4, 3]); P.hline(1.3, g.alpha(th.crit, .9), [2, 2]);
      if (L2) LAND_PLANTS.forEach((pg, j) => {
        const pts = LAND_FISH.filter(n => L2.res[n + '|' + pg] != null).map(n => [n, L2.res[n + '|' + pg]]);
        P.line(pts, cols[j], 2);
        pts.forEach(q => P.dot(q[0], q[1], 2.4, cols[j]));
      });
      // where this tank sits: its own lowest O₂ over the last night
      const H = S.hist, last = H.filter(h => h.t > S.hours - 24);
      if (last.length) P.dot(p.fish, Math.min(...last.map(h => h.o2)), 5, th.accent, g.alpha('#FFFFFF', .9));
    });
    const ctx = g.ctx; ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = th.crit; ctx.textAlign = 'right';
    ctx.fillText('fish gasp below 2.5', P.x1 - 4, P.Y(2.5) - 3); ctx.fillText('and die below 1.3', P.x1 - 4, P.Y(1.3) - 3);
    ctx.restore();
  }
  function landHover(S, xd) {
    if (!S.land) return null;
    const n = LAND_FISH.reduce((a, b) => Math.abs(b - xd) < Math.abs(a - xd) ? b : a);
    return [{ label: 'fish', value: String(n) }].concat(LAND_PLANTS.map(pg => ({ label: pg + ' g plants', value: S.land.res[n + '|' + pg] != null ? S.land.res[n + '|' + pg].toFixed(2) + ' mg/L' : '…' })));
  }

  /* ---------------- readouts and the equation ---------------- */
  function tankReadouts(S) {
    const y = S.tank.y, f = S.tank.flux, p = S.p, sat = o2sat(y[TW]), c = clockStr(S.hours);
    const o2f = y[O2] < 2.5 ? 'crit' : y[O2] < 4 ? 'warn' : 'accent';
    const faF = f.fa > 0.2 ? 'crit' : f.fa > 0.02 ? 'warn' : 'ok';
    const n2 = y[NO2] * 46.006 / MW_N, n3 = y[NO3] * 62.004 / MW_N, tan = y[TAN] * MW_NH3 / MW_N;
    const H = S.hist, day = H.filter(h => h.t > S.hours - 24);
    const dg = day.length > 1 ? (day[day.length - 1].plants - day[0].plants) / day[0].plants * 100 * 24 / Math.max(1e-6, day[day.length - 1].t - day[0].t) : 0;
    return [
      { label: 'Dissolved O₂', value: y[O2].toFixed(2), unit: 'mg/L', flag: o2f, hint: (100 * y[O2] / sat).toFixed(0) + ' % of the ' + sat.toFixed(2) + ' mg/L the water can hold' },
      { label: 'O₂ made − O₂ used', value: (f.o2make - f.o2use).toFixed(1), unit: 'mg/h', hint: 'the air adds ' + f.exO2.toFixed(1) + ' mg/h' },
      { label: 'pH · free CO₂', value: f.pH.toFixed(2), hint: f.co2.toFixed(2) + ' mg/L CO₂' },
      { label: 'Free ammonia NH₃', value: f.fa.toFixed(3), unit: 'mg/L', flag: faF, hint: 'the toxic share of ' + tan.toFixed(2) + ' mg/L total — more at high pH and warmth' },
      { label: 'Nitrite NO₂⁻', value: n2.toFixed(2), unit: 'mg/L', flag: n2 > 5 ? 'crit' : n2 > 0.5 ? 'warn' : 'ok' },
      { label: 'Nitrate NO₃⁻', value: n3.toFixed(1), unit: 'mg/L', flag: n3 > 80 ? 'warn' : '' },
      { label: 'Water temperature', value: y[TW].toFixed(1), unit: '°C', hint: p.heater ? (S.tank.heatOn ? 'heater on' : 'heater resting') : 'no heater' },
      { label: 'Fish alive', value: Math.round(f.alive) + ' / ' + p.fish, flag: f.alive < p.fish - 0.5 ? 'crit' : y[O2] < 2.5 ? 'warn' : 'ok', hint: y[O2] < 2.5 ? 'gasping at the surface' : fishStress(S) > 0.3 ? 'stressed — colours fading' : 'comfortable' },
      { label: 'Plants (dry mass)', value: (y[PC] / PLANT.cfrac / 1000).toFixed(1), unit: 'g', hint: (dg >= 0 ? '+' : '') + dg.toFixed(1) + ' % a day' },
      { label: 'Clock', value: c.text, hint: f.lampW > 0 ? 'lamp on' : 'lamp off' }
    ];
  }
  function o2Equation(S) {
    const f = S.tank.flux, y = S.tank.y, V = S.tank.cfg.vol, sat = o2sat(y[TW]);
    const made = f.o2make, used = f.o2use, air = f.exO2, rate = (made - used + air) / V;
    return E.v('dO₂/dt') + ' ' + E.op('=') + ' ' +
      E.frac(E.n(made, 'mg/h') + ' ' + E.op('−') + ' ' + E.n(used, 'mg/h'), E.n(V, 'L')) + ' ' + E.op('+') + ' ' +
      E.v('k') + '(' + E.n(sat, 'mg/L') + ' ' + E.op('−') + ' ' + E.n(y[O2], 'mg/L') + ') ' + E.op('=') + ' ' + E.n(rate, 'mg/L per h') +
      '<br><span style="font-size:12px;color:var(--text-3)">made by plants ' + f.Pg.toFixed(1) + ' + algae ' + f.Ag.toFixed(1) +
      ' + nitrate reduction ' + (f.o2make - f.Pg - f.Ag).toFixed(1) + ' · used by fish ' + f.Rf.toFixed(1) + ', plants ' + f.Rp.toFixed(1) +
      ', algae ' + f.Ra.toFixed(1) + ', bacteria ' + (1.5 * MW_O2 / MW_N * f.r1 + 0.5 * MW_O2 / MW_N * f.r2).toFixed(1) +
      ', decay ' + (f.decC * MW_O2 / MW_C).toFixed(1) + ' mg/h</span>';
  }

  /* the outline of a cloud of screen points (Andrew's monotone chain) */
  function hull2(pts) {
    const Q = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const q of Q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = Q.length - 1; i >= 0; i--) { const q = Q[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  /* a river stone: a lumpy ellipsoid half sunk in the gravel, lit from the lamp above, matte, grained.
     Its outline is the hull of the projected surface, so it holds its shape from any side. */
  function drawStone(ctx, P, c, rx, ry, rz, rot, colr, fog, W, tint) {
    const gz = gravelZ(c[0], c[1]), cr = Math.cos(rot), sr = Math.sin(rot);
    const lump = (ph, th) => 1 + 0.07 * Math.sin(ph * 3 + rot) + 0.04 * Math.sin(ph * 5 + rot * 2) + 0.03 * Math.sin(th * 2 + rot);
    const world = (ph, th) => {
      const w = lump(ph, th), lx = Math.cos(th) * Math.cos(ph) * rx * w, ly = Math.cos(th) * Math.sin(ph) * ry * w;
      return [c[0] + lx * cr - ly * sr, c[1] + lx * sr + ly * cr, Math.max(gz, c[2] + Math.sin(th) * rz * w)];
    };
    const pts = [];
    for (let i = 0; i < 16; i++) for (let j = 0; j <= 6; j++) {
      const q = P(...world(i / 16 * TAU, -Math.PI / 2 + j / 6 * Math.PI));
      if (!q.ok) return;
      pts.push(q);
    }
    const out = hull2(pts);
    const top = P(c[0], c[1], c[2] + rz), foot = [];
    for (let i = 0; i < 16; i++) { const ph = i / 16 * TAU; const q = P(c[0] + Math.cos(ph) * rx * 1.15 * cr - Math.sin(ph) * ry * 1.15 * sr, c[1] + Math.cos(ph) * rx * 1.15 * sr + Math.sin(ph) * ry * 1.15 * cr, gz); if (!q.ok) return; foot.push(q); }
    if (!top.ok || out.length < 3) return;
    const yTop = Math.min(...out.map(q => q.y)), yBot = Math.max(...out.map(q => q.y));
    const xL = Math.min(...out.map(q => q.x)), xR = Math.max(...out.map(q => q.x));
    ctx.save();
    // contact shadow on the gravel: the stone's footprint, blurred
    ctx.fillStyle = 'rgba(0,0,0,' + (0.32 * W.lit + 0.12).toFixed(3) + ')';
    if (RX.canFilter) ctx.filter = 'blur(3px)';
    ctx.beginPath(); foot.forEach((q, i) => i ? ctx.lineTo(q.x + 2, q.y + 1) : ctx.moveTo(q.x + 2, q.y + 1)); ctx.closePath(); ctx.fill();
    ctx.filter = 'none';
    ctx.beginPath(); out.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath();
    const gr = ctx.createLinearGradient(0, yTop, 0, yBot);
    gr.addColorStop(0, tint(RX.mix(colr, '#E8E2D6', 0.30), fog));
    gr.addColorStop(0.45, tint(colr, fog));
    gr.addColorStop(1, tint(RX.mix(colr, '#05080F', 0.55), fog));
    ctx.fillStyle = gr; ctx.fill();
    ctx.clip();
    // the lamp's soft sheen on the upper side
    const hl = ctx.createRadialGradient(top.x - (xR - xL) * 0.12, yTop + (yBot - yTop) * 0.22, 1, top.x, yTop + (yBot - yTop) * 0.3, (xR - xL) * 0.55);
    hl.addColorStop(0, 'rgba(255,250,235,' + (0.16 * W.lit).toFixed(3) + ')'); hl.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = hl; ctx.fillRect(xL, yTop, xR - xL, yBot - yTop);
    // grain and a few mineral flecks
    for (let k = 0; k < 110; k++) {
      const u = Math.abs((Math.sin(k * 12.9898 + rot) * 43758.5453) % 1), v = Math.abs((Math.sin(k * 78.233 + rot) * 12543.2331) % 1);
      ctx.fillStyle = k % 7 === 0 ? tint('#D8D2C4', fog, 0.35) : tint('#2E2B27', fog, 0.25);
      ctx.fillRect(xL + u * (xR - xL), yTop + v * (yBot - yTop), 1.2, 1.2);
    }
    ctx.restore();
    ctx.strokeStyle = tint('#1E1C19', fog, 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); out.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.stroke();
  }

  /* the filter cut open: water in through the sponge, over the ceramic rings, back to the tank —
     and on the rings the film of bacteria, as thick as the model's two populations are large */
  function filterInset(g, S, x, y, w, h) {
    const ctx = g.ctx, th = g.theme, p = S.p, T = S.tank, f = T.flux;
    const f1 = clamp(T.y[V1] / Math.max(1e-6, S.vref[0]), 0, 1.5), f2 = clamp(T.y[V2] / Math.max(1e-6, S.vref[1]), 0, 1.5);
    ctx.save(); ctx.fillStyle = 'rgba(6,9,17,.86)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6); else ctx.rect(x, y, w, h); ctx.fill(); ctx.restore();
    card(ctx, x, y, w, h);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3'];
    ctx.fillText('THE FILTER, CUT OPEN' + (p.filter ? '' : ' — PUMP OFF, NOTHING FLOWS'), x + 9, y + 11);
    // the housing in section: sponge chamber, ring chamber
    const bx = x + 12, by = y + 24, bw = w - 24, bh = h - 104, split = bx + bw * 0.42;
    ctx.fillStyle = 'rgba(38,48,63,.9)'; ctx.strokeStyle = 'rgba(120,140,180,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 5); else ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(split, by + 6); ctx.lineTo(split, by + bh - 14); ctx.stroke();
    // sponge: a porous block that catches debris — the flakes that never reached a fish darken it
    const sp = [bx + 6, by + 6, split - bx - 12, bh - 12];
    ctx.fillStyle = RX.mix('#3A5A8C', '#4A3A2A', clamp(T.y[DC] / 4000, 0, 0.6)); ctx.fillRect(...sp);
    ctx.fillStyle = 'rgba(8,14,26,.55)';
    for (let k = 0; k < 60; k++) {
      const u = Math.abs(Math.sin(k * 12.99) * 437.5) % 1, v = Math.abs(Math.sin(k * 78.23) * 125.4) % 1;
      ctx.beginPath(); ctx.arc(sp[0] + 3 + u * (sp[2] - 6), sp[1] + 3 + v * (sp[3] - 6), 1 + (k % 3) * 0.6, 0, TAU); ctx.fill();
    }
    // ceramic rings, each wearing the film: clean biscuit when bare, brown and thick when mature
    const rx0 = split + 8, rw = bx + bw - 8 - rx0, cols = 4, rows = 3, rr = Math.min(rw / cols, (bh - 16) / rows) * 0.38;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const cx = rx0 + (i + 0.5) * rw / cols, cy = by + 8 + (j + 0.5) * (bh - 16) / rows;
      const film = clamp((f1 + f2) / 2, 0, 1.2);
      ctx.fillStyle = '#D8CFBE'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill();
      if (film > 0.02) { ctx.strokeStyle = RX.rgba(RX.mix('#B0864A', '#5A3A1A', clamp(film, 0, 1)), 0.9); ctx.lineWidth = 1 + film * rr * 0.45; ctx.beginPath(); ctx.arc(cx, cy, rr - ctx.lineWidth / 2, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = 'rgba(20,28,40,.95)'; ctx.beginPath(); ctx.arc(cx, cy, rr * 0.42, 0, TAU); ctx.fill();
    }
    // the water's path, moving while the pump runs
    const path = [[bx + 10, by - 4], [bx + 10, by + bh * 0.5], [split - 8, by + bh - 8], [split + 8, by + bh - 8], [bx + bw - 10, by + bh * 0.5], [bx + bw - 10, by - 4]];
    ctx.strokeStyle = p.filter ? 'rgba(159,240,255,.85)' : 'rgba(120,130,150,.5)'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]); ctx.lineDashOffset = p.filter ? -S.ta * 30 : 0;
    ctx.beginPath(); path.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = '#9FF0FF';
    ctx.fillText('in', bx + 14, by - 1); ctx.textAlign = 'right'; ctx.fillText('back to the tank', bx + bw - 14, by - 1);
    // each chamber named under itself
    ctx.textAlign = 'center'; ctx.font = '600 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text;
    ctx.fillText('sponge', (bx + split) / 2, by + bh + 9); ctx.fillText('ceramic rings', (split + bx + bw) / 2, by + bh + 9);
    ctx.font = '500 8px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
    ctx.fillText('traps debris', (bx + split) / 2, by + bh + 20); ctx.fillText('the bacteria live here', (split + bx + bw) / 2, by + bh + 20);
    // the two populations against a mature filter, and what each is doing now
    // name and number on one line, the bar under them; the tick is a mature filter
    const bar = (yy, frac, col, name, rate) => {
      ctx.textAlign = 'left'; ctx.fillStyle = col; ctx.font = '600 8.5px "IBM Plex Mono",monospace';
      ctx.fillText(name, x + 12, yy);
      ctx.textAlign = 'right'; ctx.fillStyle = th.text;
      ctx.fillText((100 * frac).toFixed(0) + ' % · ' + rate.toFixed(2) + ' mg N/h', x + w - 12, yy);
      const x0 = x + 12, bw2 = w - 24, full = bw2 / 1.25;
      ctx.fillStyle = 'rgba(60,72,98,.7)'; ctx.fillRect(x0, yy + 7, bw2, 5);
      ctx.fillStyle = col; ctx.fillRect(x0, yy + 7, full * clamp(frac, 0, 1.25), 5);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x0 + full - 1, yy + 5, 1.5, 9);
    };
    ctx.font = '500 8px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'left';
    ctx.fillText('bacteria on the media, against a mature filter (│)', x + 12, y + h - 50);
    bar(y + h - 36, f1, '#FF8FB0', 'ammonia → nitrite', f.r1);
    bar(y + h - 15, f2, '#8FE388', 'nitrite → nitrate', f.r2);
    ctx.restore();
  }

  /* the interaction web as a diagram — the parts as nodes, every arrow a live flux —
     and under it what each part is doing, as numbers */
  function webCard(g, S, x, y, w, h) {
    const ctx = g.ctx, th = g.theme, f = S.tank.flux, p = S.p, T = S.tank;
    const DH = h - 108;                                   // the diagram's height; the table of six parts takes the rest
    card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('THE PARTS AND HOW THEY INTERACT — NOW', x + 9, y + 11);
    // node: [x px from the card's left, y px from its top, name, colour, running, where the name goes]
    const N = {
      lamp: [30, 0.213 * DH, 'Lamp', '#FFE08A', f.lampW > 0, 'r'], air: [w - 30, 0.213 * DH, 'Air', '#DDEBFF', true, 'l'],
      plants: [30, 0.553 * DH, 'Plants', '#7BE08A', p.plants > 0, 'b'], bact: [w - 34, 0.553 * DH, 'Bacteria', '#FF8FB0', p.filter, 'b'],
      fish: [w * 0.56, 0.798 * DH, 'Fish', '#3AF0E0', f.alive > 0.5, 'b'], heater: [30, 0.851 * DH, 'Heater', '#FF9A5A', p.heater, 'b']
    };
    const X = k => x + N[k][0], Y = k => y + N[k][1];
    const dh = DH;
    const plantLight = f.lightW * (1 - Math.exp(-0.05 * Math.max(0, T.y[PC]) / 400));
    const edges = [
      ['lamp', 'plants', plantLight, 'W', '#FFE08A', 'light', 0, 0.5],
      ['plants', 'fish', f.Pg - f.Rp, 'mg/h', '#9FF0FF', 'O₂', 18, 0.5],
      ['fish', 'plants', f.resF / MW_C * MW_CO2, 'mg/h', '#FFB35C', 'CO₂', 18, 0.5],
      ['fish', 'bact', f.exN, 'mg N/h', '#FF8FB0', 'ammonia', -12, 0.5],
      ['bact', 'plants', f.r2, 'mg N/h', '#8FE388', 'nitrate', -14, 0.5],
      ['air', 'fish', f.exO2, 'mg/h', '#DDEBFF', 'O₂', 0, 0.4],
      ['heater', 'fish', f.heat, 'W', '#FF9A5A', 'heat', 0, 0.5]
    ];
    // obstacles the labels must clear: every node disc and every node name
    const placed = [];
    ctx.font = '600 9.5px "IBM Plex Sans",sans-serif';
    for (const k in N) {
      const [, , name, , , side] = N[k], nx = X(k), ny = Y(k), tw = ctx.measureText(name).width;
      placed.push([nx - 11, ny - 11, 22, 22]);
      placed.push(side === 'r' ? [nx + 13, ny - 7, tw + 2, 14] : side === 'l' ? [nx - 15 - tw, ny - 7, tw + 2, 14] : [nx - tw / 2 - 1, ny + 10, tw + 2, 14]);
    }
    const overlap = r => placed.reduce((a, q) => a + Math.max(0, Math.min(r[0] + r[2], q[0] + q[2]) - Math.max(r[0], q[0])) *
                                                      Math.max(0, Math.min(r[1] + r[3], q[1] + q[3]) - Math.max(r[1], q[1])), 0);
    const jobs = [];
    ctx.textBaseline = 'middle';
    for (const [a2, b2, v, unit, col, name, bend, lt0] of edges) {
      let A = a2, B = b2, val = v, bd = bend, lt = lt0;
      if (val < 0) { A = b2; B = a2; val = -val; bd = -bend; lt = 1 - lt0; }
      const on = val > 1e-3, x1 = X(A), y1 = Y(A), x2 = X(B), y2 = Y(B);
      const dx = x2 - x1, dy = y2 - y1, L0 = Math.hypot(dx, dy) || 1, ux = dx / L0, uy = dy / L0;
      const sx = x1 + ux * 12, sy = y1 + uy * 12, ex = x2 - ux * 14, ey = y2 - uy * 14;
      const cx = (sx + ex) / 2 - uy * bd, cy = (sy + ey) / 2 + ux * bd;
      const wd = on ? clamp(1 + Math.log10(1 + val) * 1.5, 1, 5) : 1;
      ctx.strokeStyle = on ? RX.rgba(col, 0.85) : 'rgba(110,120,140,.35)';
      ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.setLineDash(on ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.setLineDash([]);
      if (on) {
        const tx = ex - cx, ty = ey - cy, tl = Math.hypot(tx, ty) || 1, hx = tx / tl, hy = ty / tl, s2 = 4 + wd;
        ctx.fillStyle = RX.rgba(col, 0.95);
        ctx.beginPath(); ctx.moveTo(ex + hx * 2, ey + hy * 2); ctx.lineTo(ex - hx * s2 - hy * s2 * 0.55, ey - hy * s2 + hx * s2 * 0.55);
        ctx.lineTo(ex - hx * s2 + hy * s2 * 0.55, ey - hy * s2 - hx * s2 * 0.55); ctx.closePath(); ctx.fill();
      }
      jobs.push({ sx, sy, cx, cy, ex, ey, lt, on, col, txt: name + ' ' + (on ? (val >= 10 ? val.toFixed(0) : val.toFixed(1)) + ' ' + unit : '0') });
    }
    for (const k in N) {
      const [, , name, col, on, side] = N[k], nx = X(k), ny = Y(k);
      ctx.fillStyle = on ? RX.rgba(col, 0.22) : 'rgba(60,70,90,.4)';
      ctx.strokeStyle = on ? col : '#4A5568'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(nx, ny, 9, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.font = '600 9.5px "IBM Plex Sans",sans-serif';
      ctx.fillStyle = on ? th.text : th['text-3'];
      if (side === 'r') { ctx.textAlign = 'left'; ctx.fillText(name, nx + 14, ny); }
      else if (side === 'l') { ctx.textAlign = 'right'; ctx.fillText(name, nx - 14, ny); }
      else { ctx.textAlign = 'center'; ctx.fillText(name, nx, ny + 17); }
      if (!on) { ctx.strokeStyle = '#FB7185'; ctx.beginPath(); ctx.moveTo(nx - 6, ny - 6); ctx.lineTo(nx + 6, ny + 6); ctx.stroke(); }
    }
    // each flow's label: the first place along its own arrow that clears the nodes and the labels already set
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
    for (const J of jobs) {
      const tw = ctx.measureText(J.txt).width + 8, hh = 13;
      const at = t => { const u = 1 - t; return [u * u * J.sx + 2 * u * t * J.cx + t * t * J.ex, u * u * J.sy + 2 * u * t * J.cy + t * t * J.ey]; };
      let best = null, bestA = Infinity;
      search: for (const dt of [0, 0.1, -0.1, 0.2, -0.2, 0.3, -0.3, 0.38, -0.38]) {
        const t = clamp(J.lt + dt, 0.1, 0.9), q = at(t), q2 = at(Math.min(1, t + 0.02));
        const nl = Math.hypot(q2[0] - q[0], q2[1] - q[1]) || 1, nx = -(q2[1] - q[1]) / nl, ny = (q2[0] - q[0]) / nl;
        for (const off of [0, 9, -9, 16, -16]) {
          const r = [q[0] + nx * off - tw / 2, q[1] + ny * off - hh / 2, tw, hh];
          if (r[0] < x + 3 || r[0] + r[2] > x + w - 3 || r[1] < y + 19 || r[1] + r[3] > y + dh - 6) continue;
          const A = overlap(r) + Math.abs(off) * 0.5 + Math.abs(dt) * 20;     // prefer clear, then close to the arrow
          if (A < bestA) { best = r; bestA = A; }
          if (overlap(r) === 0 && off === 0) break search;
        }
      }
      if (!best) { const q = at(J.lt); best = [q[0] - tw / 2, q[1] - hh / 2, tw, hh]; }
      placed.push(best);
      ctx.fillStyle = 'rgba(8,12,22,.9)'; ctx.strokeStyle = J.on ? RX.rgba(J.col, 0.35) : 'rgba(110,120,140,.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(best[0], best[1], best[2], best[3], 4); else ctx.rect(best[0], best[1], best[2], best[3]);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = J.on ? J.col : th['text-3']; ctx.fillText(J.txt, best[0] + best[2] / 2, best[1] + best[3] / 2 + 0.5);
    }
    // the table: what each part is doing
    const rows = [
      ['Lamp', f.lampW > 0 ? f.lightW.toFixed(1) + ' W of light in' : (p.lamp ? 'timer: off' : 'unplugged'), '#FFE08A', p.lamp],
      ['Plants', p.plants > 0 ? (f.Pg > 0.5 ? 'make ' + f.Pg.toFixed(0) + ' mg O₂/h' : 'use ' + f.Rp.toFixed(1) + ' mg O₂/h') : 'none planted', '#7BE08A', p.plants > 0],
      ['Fish', Math.round(f.alive) + ' alive · use ' + f.Rf.toFixed(1) + ' mg O₂/h', '#3AF0E0', f.alive > 0.5],
      ['Bacteria', (p.filter ? '' : 'no flow · ') + 'oxidise ' + f.r1.toFixed(2) + ' mg N/h', '#FF8FB0', p.filter],
      ['Air pump', p.pump ? 'stirring the surface' : 'unplugged', '#DDEBFF', p.pump],
      ['Heater', p.heater ? (T.heatOn ? 'heating · 50 W' : 'resting · set ' + p.setT + ' °C') : 'unplugged', '#FF9A5A', p.heater]
    ];
    const ty0 = y + dh + 2;
    ctx.strokeStyle = 'rgba(80,100,140,.25)'; ctx.beginPath(); ctx.moveTo(x + 8, ty0 - 4); ctx.lineTo(x + w - 8, ty0 - 4); ctx.stroke();
    rows.forEach(([name, what, col, on], i) => {
      const yy = ty0 + 8 + i * 17;
      led(ctx, x + 13, yy, on, col);
      ctx.textAlign = 'left'; ctx.font = '600 10px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on ? th.text : th['text-3'];
      ctx.fillText(name, x + 22, yy);
      ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = on ? th['text-2'] : th['text-3'];
      ctx.fillText(what, x + 84, yy);
    });
    ctx.restore();
  }

  /* the black trim on the tank's edges; `near` picks the beams on the camera's side */
  function trims(F, faces, near) {
    const tr = 0.012, col = '#15181E', o = { shadow: false, ambient: 0.4 };
    const beams = [
      [0, [0, Y0 - tr / 2], [X1 - X0 + 2 * tr, tr]], [1, [0, Y1 + tr / 2], [X1 - X0 + 2 * tr, tr]],
      [2, [X0 - tr / 2, 0], [tr, Y1 - Y0]], [3, [X1 + tr / 2, 0], [tr, Y1 - Y0]]
    ];
    for (const [fi, c, sz] of beams) {
      if (!!faces[fi].near !== near) continue;
      R3.box(F, [c[0], c[1], ZT - tr / 2], [sz[0], sz[1], tr], col, o);
      R3.box(F, [c[0], c[1], tr / 2], [sz[0], sz[1], tr], col, o);
    }
  }

  /* =====================================================================
     SET-UP · NO FISH IN CHARGE (A1.4 emergent properties)
     ===================================================================== */
  const NOISES = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  function orderKey(p) { return [p.align, p.cohere, p.sepCm, p.leader, p.fish].join('|'); }
  /* one blind run: the same rules from a scattered start; mean order over its last 16 s */
  const ORDER_SEEDS = [777, 1777, 2777, 3777];
  function orderRun(p, noise, seed, stems) {
    const T = { p: Object.assign({}, p, { setup: 'shoal', noise, removeTag: false, predator: false }),
                tank: { y: [8], flux: { lampW: 20 } }, stems: stems || [], pred: null, seed, lostL: 0 };
    T.fish = makeFish(T, Math.max(2, p.fish));
    let acc = 0, n = 0;
    for (let k = 0; k < 520; k++) { shoalStep(T, 0.05); if (k >= 200 && k % 4 === 0) { acc += shoalOrder(T).phi; n++; } }
    return acc / n;
  }
  /* the same rules run blind in the background at every noise level, one start after another —
     the curve appears after the first pass and settles as each further start is averaged in */
  function orderStep(S, budget) {
    const p = S.p, key = orderKey(p);
    if (!S.ord || S.ord.key !== key) S.ord = { key, res: {}, sum: {}, next: 0 };
    const O = S.ord, jobs = NOISES.length * ORDER_SEEDS.length;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t0 = now();
    while (O.next < jobs && now() - t0 < budget) {
      const i = O.next % NOISES.length, s2 = Math.floor(O.next / NOISES.length), nz = NOISES[i];
      O.sum[nz] = (O.sum[nz] || 0) + orderRun(p, nz, ORDER_SEEDS[s2], S.stems);
      O.res[nz] = O.sum[nz] / (s2 + 1);
      O.next++;
    }
  }
  function shoalCard(g, S, x, y, w) {
    const ctx = g.ctx, th = g.theme, o = S.order || { phi: 0, nnd: 0, group: 0 };
    const h = 132;
    card(ctx, x, y, w, h);
    ctx.save();
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('THE SHOAL, MEASURED — NO FISH COMPUTES THESE', x + 9, y + 11);
    // a polarisation dial: 0 (every fish its own way) … 1 (all as one)
    const cx = x + 52, cy = y + 70, r = 32;
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(60,72,98,.8)'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    ctx.strokeStyle = th.accent; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * clamp(o.phi, 0, 1))); ctx.stroke();
    ctx.font = '700 18px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text; ctx.textAlign = 'center';
    ctx.fillText(o.phi.toFixed(2), cx, cy + 1);
    ctx.font = '500 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
    ctx.fillText('polarisation Φ', cx, cy + r + 12);
    ctx.textAlign = 'left';
    const rows = [
      ['nearest neighbour', o.nnd.toFixed(2) + ' body lengths'],
      ['largest group', (100 * o.group).toFixed(0) + ' % of the fish'],
      ['swimming', (S.speedBL || 0).toFixed(1) + ' body lengths/s'],
      ['angelfish', S.p.predator ? S.caught + ' caught · lost its target ' + S.confused + '×' : 'not in the tank']
    ];
    rows.forEach(([a, b], i) => {
      const yy = y + 36 + i * 22;
      ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.fillText(a, x + 100, yy);
      ctx.font = '600 10.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text; ctx.fillText(b, x + 100, yy + 10);
    });
    ctx.restore();
  }
  function orderPlot(S, g) {
    const th = g.theme, O = S.ord, jobs = NOISES.length * ORDER_SEEDS.length;
    const K = plotKey(g, [{ c: th.accent, label: S.p.leader ? 'blind runs, rule: follow the tagged fish' : 'blind runs, rules: align · cohere · keep apart' },
                          { c: '#FFD36B', edge: '#FFFFFF', dot: true, label: 'this shoal, now' }],
                      O && O.next < jobs ? 'averaging ' + Math.min(ORDER_SEEDS.length, Math.floor(O.next / NOISES.length) + 1) + ' / ' + ORDER_SEEDS.length + ' starts' : 'mean of ' + ORDER_SEEDS.length + ' starts');
    const P = g.Plot({ xmin: 0, xmax: 4, ymin: 0, ymax: 1, xlabel: 'random turning (noise)', ylabel: 'order Φ', pad: { t: K.t },
                       xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(1) }).frame();
    K.draw(P);
    P.clip(() => {
      if (O) {
        const pts = NOISES.filter(n => O.res[n] != null).map(n => [n, O.res[n]]);
        P.area(pts, 0, g.alpha(th.accent, 0.12)); P.line(pts, th.accent, 2);
        pts.forEach(q => P.dot(q[0], q[1], 2.6, th.accent));
      }
      P.dot(S.p.noise, (S.order || { phi: 0 }).phi, 5, '#FFD36B', g.alpha('#FFFFFF', .9));
    });
  }
  function orderHistPlot(S, g) {
    const th = g.theme, H = S.oHist || [];
    const tEnd = S.ta, span = 60;
    const K = plotKey(g, [{ c: th.accent, label: 'polarisation Φ' }, { c: '#7BE08A', label: 'share in the largest group', dash: [4, 3], w: 2 }]);
    const P = g.Plot({ xmin: -span, xmax: 0, ymin: 0, ymax: 1, xlabel: 'seconds ago', ylabel: 'Φ', pad: { t: K.t },
                       xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
    K.draw(P);
    P.clip(() => {
      P.line(H.filter(h => h.t > tEnd - span).map(h => [h.t - tEnd, h.phi]), th.accent, 2);
      P.line(H.filter(h => h.t > tEnd - span).map(h => [h.t - tEnd, h.group]), '#7BE08A', 1.5, [4, 3]);
    });
  }

  /* =====================================================================
     SET-UP · DRAW THE BOUNDARY (A2.1 drawing a boundary, A2.5 choosing one for a purpose)
     ===================================================================== */
  const BOUNDS = ['fish', 'plants', 'filter', 'water', 'tank', 'room'];
  const BOUND_NAME = { fish: 'one fish', plants: 'the plants', filter: 'the filter', water: 'the water', tank: 'the tank and the air over it', room: 'the room' };
  const J_PER_MG_O2 = 14.1;                          // J released per mg O₂ respired (oxycalorific value)
  /* every flow across the chosen boundary, from the fluxes the model is computing now */
  function ledger(S) {
    const f = S.tank.flux, y = S.tank.y, p = S.p, n = Math.max(1, f.alive), V = S.tank.cfg.vol;
    const co2 = c => c / MW_C * MW_CO2;                // mg C → mg CO₂
    const pumpW = p.pump ? 2.5 : 0, filtW = p.filter ? 4 : 0;
    const plantLight = f.lightW * (1 - Math.exp(-0.05 * Math.max(0, y[PC]) / 400));
    const rows = [];
    const add = (q, unit, inn, out, note) => rows.push({ q, unit, inn: Math.max(0, inn), out: Math.max(0, out), note });
    switch (p.bound) {
      case 'fish':
        add('O₂', 'mg/h', f.Rf / n, 0, 'breathed in through the gills');
        add('CO₂', 'mg/h', 0, co2(f.resF) / n, 'breathed out');
        add('food', 'mg/h', f.ingC / FOOD.c / n, 0, 'flakes eaten');
        add('ammonia', 'mg N/h', 0, f.exN / n, 'excreted through the gills');
        add('faeces', 'mg/h', 0, f.egC / FOOD.c / n, 'the part of the food not absorbed');
        add('heat', 'mW', 0, f.Rf / n * J_PER_MG_O2 / 3.6, 'from its own metabolism');
        break;
      case 'plants':
        add('light', 'W', plantLight, 0, 'absorbed by the leaves');
        add('CO₂', 'mg/h', co2(f.fixP), co2(f.resP), 'taken in to build sugar · given out by respiration');
        add('O₂', 'mg/h', f.Rp, f.Pg, 'used by respiration · made by photosynthesis');
        add('nitrogen', 'mg N/h', f.upN * (f.fixP / Math.max(1e-9, f.fixP + f.fixA)), 0, 'ammonium and nitrate, for protein');
        add('dead leaves', 'mg/h', 0, f.turnP / PLANT.cfrac, 'shed to the gravel');
        add('heat', 'W', 0, Math.max(0, plantLight - f.storeW * f.Pg / Math.max(1e-9, f.Pg + f.Ag)), 'the light not stored as sugar');
        break;
      case 'filter':
        add('water', 'L/h', p.filter ? 200 : 0, p.filter ? 200 : 0, 'pumped through the media');
        add('ammonia', 'mg N/h', f.r1, 0, 'arrives in the water');
        add('nitrate', 'mg N/h', 0, f.r2, 'leaves in the water');
        add('O₂', 'mg/h', 1.5 * MW_O2 / MW_N * f.r1 + 0.5 * MW_O2 / MW_N * f.r2, 0, 'used by the bacteria');
        add('electricity', 'W', filtW, 0, 'the motor');
        add('heat', 'W', 0, filtW, 'all of it, in the end');
        break;
      case 'water':
        add('light', 'W', f.lightW, 0, 'from the lamp and the room');
        add('heat', 'W', f.heat, f.lossW + f.evapW, 'heater in · through the glass and by evaporation out');
        add('food', 'mg/h', f.foodC / FOOD.c, 0, 'flakes dropped in');
        add('O₂', 'mg/h', f.exO2, -f.exO2, 'across the surface — the sign flips with the day');
        add('CO₂', 'mg/h', co2(f.exC), -co2(f.exC), 'across the surface');
        add('water', 'g/h', 0, f.evap * 1000, 'evaporation');
        add('nitrogen', 'mg N/h', 0, S.tank.cfg.change / 100 / 168 * (y[TAN] + y[NO2] + y[NO3]) * V, 'thrown away in water changes');
        break;
      case 'tank':
        add('electricity', 'W', f.lampW + (p.heater && S.tank.heatOn ? HEATER_W : 0) + pumpW + filtW, 0, 'lamp, heater, pump, filter');
        add('heat', 'W', 0, f.lossW + f.evapW + (f.lampW - f.lightW) + pumpW + filtW, 'every watt in leaves as heat');
        add('food', 'mg/h', f.foodC / FOOD.c, 0, 'flakes');
        add('water vapour', 'g/h', 0, f.evap * 1000, 'into the room');
        add('O₂', 'mg/h', f.exO2, -f.exO2, 'with the room air');
        add('CO₂', 'mg/h', co2(f.exC), -co2(f.exC), 'with the room air');
        break;
      case 'room':
        add('electricity', 'W', f.lampW + (p.heater && S.tank.heatOn ? HEATER_W : 0) + pumpW + filtW, 0, 'through the plug');
        add('food', 'mg/h', f.foodC / FOOD.c, 0, 'carried in');
        add('heat', 'W', 0, f.lampW + (p.heater && S.tank.heatOn ? HEATER_W : 0) + pumpW + filtW, 'through the walls, eventually');
        break;
    }
    return rows;
  }
  /* does the chosen boundary answer the question? */
  const FIT = {
    dawn: { good: ['water', 'tank'], partial: ['fish', 'plants', 'room'],
            say: { good: 'It contains the plants that use O₂ all night, the fish, and the surface where air comes in — the whole story.',
                   partial: 'You can see part of it, but not the other O₂ users or the surface that refills the water.',
                   no: 'Nothing that makes or uses O₂ crosses this boundary.' } },
    ammonia: { good: ['filter', 'tank'], partial: ['water', 'fish'],
               say: { good: 'Ammonia goes in, nitrate comes out: the change happens inside this boundary.',
                      partial: 'You can see ammonia leave, but not what becomes of it.',
                      no: 'No ammonia crosses this boundary.' } },
    level: { good: ['water', 'tank'], partial: ['room'],
             say: { good: 'Water crosses the surface as vapour — the level falls by the grams per hour shown.',
                    partial: 'The vapour stays inside a boundary this big.',
                    no: 'No water crosses this boundary.' } },
    food: { good: ['fish'], partial: ['water', 'tank'],
            say: { good: 'Exactly one fish: what it eats, breathes, excretes and gives off as heat.',
                   partial: 'Every fish is inside, together with everything else — one fish is lost in the total.',
                   no: 'This boundary does not contain a fish.' } },
    warm: { good: ['tank', 'room'], partial: ['water'],
            say: { good: 'Electricity goes in and leaves as heat: every watt the plug supplies warms the room.',
                   partial: 'The heater’s heat crosses, but the lamp, pump and filter are outside.',
                   no: 'This boundary misses where the electricity goes.' } }
  };
  function fitOf(p) {
    const F = FIT[p.question];
    return F.good.includes(p.bound) ? 'good' : F.partial.includes(p.bound) ? 'partial' : 'no';
  }
  function boundBox(S, which) {
    const zw = surfaceZ(S);
    switch (which) {
      case 'fish': { const fsh = S.fish.find(f => f.tag) || S.fish[0]; const c = fsh ? fsh.p : [0, 0, 0.18];
        return [[c[0] - 0.028, c[1] - 0.02, c[2] - 0.018], [c[0] + 0.028, c[1] + 0.02, c[2] + 0.018]]; }
      case 'plants': return [[-0.27, 0.0, 0.045], [0.285, 0.14, zw - 0.01]];
      case 'filter': return [[FILTER_AT[0] - 0.075, Y1 - 0.035, ZT - 0.20], [FILTER_AT[0] + 0.075, Y1 + 0.082, ZT + 0.035]];
      case 'water': return [[X0, Y0, 0.0], [X1, Y1, zw]];
      case 'tank': return [[X0 - 0.03, Y0 - 0.03, -0.01], [X1 + 0.03, Y1 + 0.10, ZT + 0.06]];
      default: return null;
    }
  }
  function drawBoundary(g, S) {
    const ctx = g.ctx, cam = S.cam, th = g.theme, b = boundBox(S, S.p.bound);
    const fit = fitOf(S.p), col = fit === 'good' ? '#4ADE80' : fit === 'partial' ? '#FBBF24' : '#FB7185';
    ctx.save();
    if (!b) {                                         // the room: its walls are off the edge of the picture
      ctx.strokeStyle = RX.rgba(col, 0.9); ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -S.ta * 20;
      ctx.strokeRect(6, HDR + 2, g.w - 12, g.h - HDR - FOOT - 4);
      ctx.restore();
      return;
    }
    const [a, c] = b, C = [];
    for (const xx of [a[0], c[0]]) for (const yy of [a[1], c[1]]) for (const zz of [a[2], c[2]]) C.push(cam.project([xx, yy, zz]));
    if (C.some(q => !q.ok)) { ctx.restore(); return; }
    const E2 = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.strokeStyle = RX.rgba(col, 0.95); ctx.lineWidth = 2; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -S.ta * 20;
    ctx.shadowColor = col; ctx.shadowBlur = 6;
    E2.forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(C[i].x, C[i].y); ctx.lineTo(C[j].x, C[j].y); ctx.stroke(); });
    ctx.setLineDash([]); ctx.shadowBlur = 0;
    // the grip: drag out to draw a bigger boundary, in to draw a smaller one
    const q = C[7];
    ctx.fillStyle = RX.rgba(col, 0.25); ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, TAU); ctx.fill(); ctx.stroke();
    g.handle(q.x, q.y, 12, 'bound');
    ctx.restore();
  }
  function ledgerCard(g, S, x, y, w) {
    const ctx = g.ctx, th = g.theme, rows = ledger(S), fit = fitOf(S.p);
    const col = fit === 'good' ? '#4ADE80' : fit === 'partial' ? '#FBBF24' : '#FB7185';
    const RH = 27, h = 52 + rows.length * RH + 46;
    card(ctx, x, y, w, h);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3'];
    ctx.fillText('WHAT CROSSES THE BOUNDARY AROUND', x + 9, y + 11);
    ctx.font = '700 13px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.fillStyle = th.text;
    ctx.fillText(BOUND_NAME[S.p.bound], x + 9, y + 27);
    // two number columns on the right; each row's note runs the full width underneath
    const cIn = x + w - 62, cOut = x + w - 10;
    ctx.font = '600 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'right';
    ctx.fillText('IN', cIn, y + 44); ctx.fillText('OUT', cOut, y + 44);
    const fv = v => v === 0 ? '—' : (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
    rows.forEach((r, i) => {
      const yy = y + 60 + i * RH;
      ctx.textAlign = 'left';
      ctx.font = '600 10px "IBM Plex Sans",sans-serif'; ctx.fillStyle = th.text; ctx.fillText(r.q, x + 9, yy - 5);
      const nw = ctx.measureText(r.q).width;
      ctx.font = '500 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.fillText(r.unit, x + 15 + nw, yy - 5);
      let note = r.note;
      while (ctx.measureText(note).width > w - 18 && note.length > 4) note = note.slice(0, -2).trimEnd() + '…';
      ctx.fillText(note, x + 9, yy + 8);
      ctx.textAlign = 'right'; ctx.font = '600 10px "IBM Plex Mono",monospace';
      ctx.fillStyle = r.inn > 0 ? '#7BE08A' : th['text-3']; ctx.fillText(fv(r.inn), cIn, yy - 5);
      ctx.fillStyle = r.out > 0 ? '#FFB35C' : th['text-3']; ctx.fillText(fv(r.out), cOut, yy - 5);
    });
    ctx.textAlign = 'left';
    const yq = y + 60 + rows.length * RH + 2;
    ctx.fillStyle = RX.rgba(col, 0.15); ctx.fillRect(x + 6, yq - 8, w - 12, 44);
    ctx.fillStyle = col; ctx.font = '700 10px "IBM Plex Sans",sans-serif';
    ctx.fillText((fit === 'good' ? 'ANSWERS' : fit === 'partial' ? 'ONLY PARTLY ANSWERS' : 'DOES NOT ANSWER') + ' — ' +
      ({ dawn: 'why fish gasp at dawn', ammonia: 'where the ammonia goes', level: 'why the level drops', food: 'what one fish uses', warm: 'why the room is warmer' })[S.p.question], x + 12, yq);
    ctx.font = '500 9px "IBM Plex Sans",sans-serif'; ctx.fillStyle = th['text-2'];
    wrapText(ctx, FIT[S.p.question].say[fit], x + 12, yq + 13, w - 24, 11);
    ctx.restore();
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
    }
    if (line) ctx.fillText(line, x, yy);
  }
  function ledgerPlot(S, g) {
    const th = g.theme, rows = ledger(S);
    const K = plotKey(g, [{ c: 'rgba(255,179,92,.85)', box: true, label: 'out across the boundary' }, { c: 'rgba(123,224,138,.85)', box: true, label: 'in across it' }],
                      'each row on its own scale');
    const P = g.Plot({ xmin: -1, xmax: 1, ymin: 0, ymax: rows.length, xlabel: '← out    in →', ylabel: '',
                       xticks: [-1, 0, 1], yticks: [], xfmt: v => v === 0 ? '0' : '', pad: { l: 92, t: K.t } }).frame();
    K.draw(P);
    const ctx = g.ctx;
    rows.forEach((r, i) => {
      const m = Math.max(r.inn, r.out, 1e-9), yy = rows.length - i - 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(123,224,138,.8)'; ctx.fillRect(P.X(0), P.Y(yy + 0.3), P.X(r.inn / m) - P.X(0), P.Y(yy - 0.3) - P.Y(yy + 0.3));
      ctx.fillStyle = 'rgba(255,179,92,.8)'; ctx.fillRect(P.X(-r.out / m), P.Y(yy + 0.3), P.X(0) - P.X(-r.out / m), P.Y(yy - 0.3) - P.Y(yy + 0.3));
      ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2']; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(r.q + ' ' + r.unit, P.x0 - 6, P.Y(yy));
      ctx.restore();
    });
  }

  /* =====================================================================
     SET-UP · FOLLOW AN ATOM AND A JOULE (A2.3 inputs and outputs, A2.4 tracing matter and energy)
     A tracer is a real sample of where carbon or energy goes: from its pool it leaves at the
     rate the model is computing now, to a destination in proportion to each outgoing flow.
     ===================================================================== */
  const CP = ['food', 'fish', 'water', 'plant', 'algae', 'det', 'air', 'out'];
  const CP_NAME = { food: 'flake of food', fish: 'fish body', water: 'dissolved CO₂', plant: 'plant tissue', algae: 'algae',
                    det: 'debris on gravel', air: 'left to the air', out: 'left in a water change' };
  const CP_COL = { food: '#E0B070', fish: '#3AF0E0', water: '#9FCBFF', plant: '#7BE08A', algae: '#B6D94A', det: '#B08A5A', air: '#DDEBFF', out: '#8A93A8' };
  const EP = ['light', 'chem', 'cdet', 'heat', 'room'];
  const EP_NAME = { light: 'light in the water', chem: 'sugar in a plant', cdet: 'in dead leaves', heat: 'warmth in the water', room: 'left as heat' };
  const EP_COL = { light: '#FFE08A', chem: '#7BE08A', cdet: '#B08A5A', heat: '#FF8A5A', room: '#8A93A8' };
  function rates(S, kind, pool) {
    const f = S.tank.flux, y = S.tank.y, V = S.tank.cfg.vol;
    const per = (flow, store) => store > 1e-9 ? Math.max(0, flow) / store : 0;
    if (kind === 'carbon') {
      switch (pool) {
        case 'food': {
          const tot = f.ingC + f.uneatenC, pFish = tot > 0 ? ASSIM * f.ingC / tot : 0;
          return [['fish', 20 * pFish], ['det', 20 * (1 - pFish)]];                     // flakes go within minutes
        }
        case 'fish': return [['water', per(f.resF, y[FC])], ['det', per(f.dieC, y[FC])]];
        case 'water': { const m = y[DIC] * V;
          return [['plant', per(f.fixP, m)], ['algae', per(f.fixA, m)], ['air', per(-f.exC, m)], ['out', S.tank.cfg.change / 100 / 168]]; }
        case 'plant': return [['water', per(f.resP, y[PC])], ['det', per(f.turnP, y[PC])]];
        case 'algae': return [['water', per(f.resA, y[AC])], ['det', per(f.lossA, y[AC])]];
        case 'det': return [['water', per(f.decC, y[DC])]];
        default: return [];
      }
    }
    const lightPlant = f.lightW * (1 - Math.exp(-0.05 * Math.max(0, y[PC]) / 400));
    const storeFrac = lightPlant > 1e-9 ? clamp(f.storeW * f.Pg / Math.max(1e-9, f.Pg + f.Ag) / lightPlant, 0, 1) : 0;
    const Q = Math.max(0.5, y[TW] - S.p.roomT) * S.tank.cfg.vol * CP_W;               // J above room temperature
    const eStore = y[PC] / MW_C / 1000 * 478e3;                                        // J held as plant sugar
    switch (pool) {
      case 'light': { const a = f.lightW > 1e-9 ? lightPlant / f.lightW : 0;
        return [['chem', 3600 * a * storeFrac], ['heat', 3600 * (1 - a * storeFrac)]]; }      // absorbed within a second
      case 'chem': return [['heat', per(f.resP, y[PC])], ['cdet', per(f.turnP, y[PC])]];
      case 'cdet': return [['heat', per(f.decC, y[DC])]];
      case 'heat': return [['room', per((f.lossW + f.evapW) * 3600, Q)]];
      default: return [];
    }
    void eStore;
  }
  /* where a tracer sits in the scene while it is in a pool */
  function spot(S, kind, pool, tr) {
    const zw = surfaceZ(S), r = () => rnd(S);
    if (kind === 'carbon') {
      switch (pool) {
        case 'food': return [-0.05 + r() * 0.1, -0.06 + r() * 0.06, zw - 0.005];
        case 'fish': { const k = S.fish.length ? Math.floor(r() * S.fish.length) : -1; tr.fish = k >= 0 ? S.fish[k].id : -1; return S.fish.length ? S.fish[k].p.slice() : [0, 0, 0.18]; }
        case 'plant': { const st = S.stems.length ? S.stems[Math.floor(r() * S.stems.length)] : [-0.16, 0.08, 0.2];
          return [st[0] + (r() - 0.5) * 0.02, st[1] + (r() - 0.5) * 0.02, gravelZ(st[0], st[1]) + 0.03 + r() * 0.16]; }
        case 'det': { const x = X0 + 0.03 + r() * 0.54, yy = Y0 + 0.03 + r() * 0.24; return [x, yy, gravelZ(x, yy) + 0.003]; }
        case 'air': return [-0.2 + r() * 0.4, -0.1 + r() * 0.2, ZT + 0.08];
        case 'out': return [X1 + 0.12, -0.05, 0.1];
        default: return [X0 + 0.04 + r() * 0.52, Y0 + 0.03 + r() * 0.24, 0.07 + r() * (zw - 0.09)];
      }
    }
    switch (pool) {
      case 'light': return [-0.2 + r() * 0.4, -0.02 + r() * 0.04, ZT];
      case 'chem': case 'cdet': return spot(S, 'carbon', pool === 'chem' ? 'plant' : 'det', tr);
      case 'room': { const side = r() < 0.5 ? -1 : 1; return [side * (X1 + 0.10), (r() - 0.5) * 0.2, 0.05 + r() * 0.25]; }
      default: return [X0 + 0.04 + r() * 0.52, Y0 + 0.03 + r() * 0.24, 0.07 + r() * (zw - 0.09)];
    }
  }
  function initTracers(S) {
    const kind = S.p.tracer;
    S.tr = [];
    for (let i = 0; i < S.p.tracers; i++) {
      const t = { pool: kind === 'carbon' ? 'food' : 'light', since: S.hours, fish: -1, anim: 1, stays: [], hops: 0 };
      t.at = spot(S, kind, t.pool, t); t.from = t.at.slice(); t.to = t.at.slice();
      S.tr.push(t);
    }
    S.trKind = kind; S.trHist = []; S.trNext = S.hours;
    S.trDone = {};                                     // completed stays per pool: [total hours, count]
  }
  function traceStep(S, hrs) {
    if (!S.tr || S.trKind !== S.p.tracer) initTracers(S);
    const kind = S.trKind;
    for (const t of S.tr) {
      const R = rates(S, kind, t.pool), tot = R.reduce((a, q) => a + q[1], 0);
      if (tot > 0 && rnd(S) < 1 - Math.exp(-tot * hrs)) {
        let u = rnd(S) * tot, dest = R[0][0];
        for (const [d, v] of R) { if (u < v) { dest = d; break; } u -= v; }
        const stay = S.hours - t.since, D = S.trDone[t.pool] || (S.trDone[t.pool] = [0, 0]);
        D[0] += stay; D[1]++;
        t.stays.push({ pool: t.pool, h: stay });
        t.pool = dest; t.since = S.hours; t.hops++;
        t.from = t.at.slice(); t.to = spot(S, kind, dest, t); t.anim = 0;
      }
    }
    while (S.trNext <= S.hours) {
      const c = {}; (kind === 'carbon' ? CP : EP).forEach(k => { c[k] = 0; });
      S.tr.forEach(t => { c[t.pool]++; });
      S.trHist.push({ t: S.hours, c }); S.trNext += HIST_DT;
      if (S.trHist.length > 2400) S.trHist.shift();
    }
  }
  /* animation between pools runs in real time, and a tracer in a fish rides with it */
  function traceAnimate(S, dt) {
    if (!S.tr) return;
    for (const t of S.tr) {
      if (t.anim < 1) { t.anim = Math.min(1, t.anim + dt / 0.9); }
      const e = t.anim < 1 ? t.anim * t.anim * (3 - 2 * t.anim) : 1;
      if (t.pool === 'fish' && t.fish >= 0) { const fs = S.fish.find(f => f.id === t.fish); if (fs) t.to = fs.p.slice(); }
      if (t.pool === 'water' || t.pool === 'heat') t.to[2] += Math.sin(S.ta * 0.7 + t.hops) * 0.0004;
      t.at = [0, 1, 2].map(k => t.from[k] + (t.to[k] - t.from[k]) * e);
    }
  }
  function drawTracers(FC, S, ctx) {
    if (!S.tr) return;
    const cols = S.trKind === 'carbon' ? CP_COL : EP_COL;
    for (const t of S.tr) {
      const at = t.at.slice(), col = cols[t.pool];
      FC.push(at, () => {
        const q = S.cam.project(at);
        if (!q.ok) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const r = Math.max(2.5, 0.004 * q.s);
        const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 3);
        gr.addColorStop(0, RX.rgba('#FFFFFF', 0.95)); gr.addColorStop(0.25, RX.rgba(col, 0.9)); gr.addColorStop(1, RX.rgba(col, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(q.x, q.y, r * 3, 0, TAU); ctx.fill();
        ctx.restore();
      }, -0.03);
    }
  }
  function traceCard(g, S, x, y, w) {
    const ctx = g.ctx, th = g.theme, kind = S.trKind || S.p.tracer, pools = kind === 'carbon' ? CP : EP;
    const names = kind === 'carbon' ? CP_NAME : EP_NAME, cols = kind === 'carbon' ? CP_COL : EP_COL;
    const counts = {}; pools.forEach(k => { counts[k] = 0; }); (S.tr || []).forEach(t => { counts[t.pool]++; });
    const h = 34 + pools.length * 19 + 34;
    card(ctx, x, y, w, h);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3'];
    ctx.fillText(kind === 'carbon' ? 'WHERE THE TAGGED CARBON ATOMS ARE' : 'WHERE THE TAGGED JOULES ARE', x + 9, y + 11);
    const n = Math.max(1, (S.tr || []).length);
    pools.forEach((k, i) => {
      const yy = y + 30 + i * 19;
      led(ctx, x + 13, yy, counts[k] > 0, cols[k]);
      ctx.font = '500 9.5px "IBM Plex Sans",sans-serif'; ctx.fillStyle = counts[k] ? th.text : th['text-3'];
      ctx.fillText(names[k], x + 22, yy);
      ctx.fillStyle = 'rgba(60,72,98,.6)'; ctx.fillRect(x + w - 92, yy - 4, 60, 8);
      ctx.fillStyle = cols[k]; ctx.fillRect(x + w - 92, yy - 4, 60 * counts[k] / n, 8);
      ctx.font = '600 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text; ctx.textAlign = 'right';
      ctx.fillText(String(counts[k]), x + w - 10, yy); ctx.textAlign = 'left';
    });
    const hops = (S.tr || []).reduce((a, t) => a + t.hops, 0);
    ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
    ctx.fillText(hops + ' moves so far', x + 9, y + h - 27);
    ctx.fillText(kind === 'carbon' ? 'carbon keeps cycling until it leaves' : 'energy only runs downhill, to heat', x + 9, y + h - 14);
    ctx.restore();
  }
  function tracePlot(S, g) {
    const th = g.theme, H = S.trHist || [], kind = S.trKind || S.p.tracer, pools = kind === 'carbon' ? CP : EP;
    const cols = kind === 'carbon' ? CP_COL : EP_COL, n = Math.max(1, (S.tr || []).length);
    if (H.length < 2) { g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: n }).frame(); return; }
    const t0 = H[0].t, t1 = H[H.length - 1].t, span = Math.max(1, t1 - t0);
    const names = kind === 'carbon' ? CP_NAME : EP_NAME;
    const K = plotKey(g, pools.map(k => ({ c: RX.rgba(cols[k], 0.85), box: true, label: names[k] })));
    const P = g.Plot(Object.assign({ xmin: 0, xmax: span / 24, ymin: 0, ymax: n, xlabel: 'days since tagging', ylabel: 'tracers', pad: { t: K.t },
                       yfmt: v => v.toFixed(0) }, dayAxis(0, span / 24, true))).frame();
    K.draw(P);
    P.clip(() => {
      const ctx = g.ctx;
      let base = H.map(() => 0);
      pools.forEach(k => {
        const top = H.map((h, i) => base[i] + h.c[k]);
        ctx.fillStyle = RX.rgba(cols[k], 0.75);
        ctx.beginPath();
        H.forEach((h, i) => { const X = P.X((h.t - t0) / 24), Y = P.Y(top[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        for (let i = H.length - 1; i >= 0; i--) ctx.lineTo(P.X((H[i].t - t0) / 24), P.Y(base[i]));
        ctx.closePath(); ctx.fill();
        base = top;
      });
    });
  }
  /* residence times: measured from the tracers, against the model's store ÷ flow */
  function residencePlot(S, g) {
    const th = g.theme, kind = S.trKind || S.p.tracer, pools = (kind === 'carbon' ? CP : EP).filter(k => !['air', 'out', 'room'].includes(k));
    const K = plotKey(g, [{ c: 'rgba(160,190,230,.85)', box: true, label: 'measured: mean stay of the tracers' }, { c: '#FFFFFF', edge: '#05080F', dot: true, label: 'model: store ÷ flow out' }]);
    const P = g.Plot({ xmin: -0.5, xmax: pools.length - 0.5, ymin: -3, ymax: 4, xlabel: '', ylabel: 'hours (log)',
                       xticks: [], yticks: [-3, -2, -1, 0, 1, 2, 3, 4], yfmt: v => '10' + L.sup(v), pad: { b: 42, t: K.t } }).frame();
    K.draw(P);
    const ctx = g.ctx, cols = kind === 'carbon' ? CP_COL : EP_COL, names = kind === 'carbon' ? CP_NAME : EP_NAME;
    pools.forEach((k, i) => {
      const R = rates(S, kind, k), tot = R.reduce((a, q) => a + q[1], 0), tau = tot > 0 ? 1 / tot : null;
      const D = (S.trDone || {})[k], meas = D && D[1] ? D[0] / D[1] : null;
      P.clip(() => {
        if (meas) { ctx.fillStyle = RX.rgba(cols[k], 0.8); const yv = Math.log10(Math.max(1e-3, meas)); ctx.fillRect(P.X(i - 0.3), P.Y(yv), P.X(i + 0.3) - P.X(i - 0.3), P.Y(-3) - P.Y(yv)); }
        if (tau) P.dot(i, Math.log10(Math.max(1e-3, tau)), 4, '#FFFFFF', g.alpha('#05080F', .8));
      });
      ctx.save(); ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2']; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(names[k].split(' ')[0], P.X(i), P.y0 + 6);
      if (D && D[1]) { ctx.fillStyle = th['text-3']; ctx.fillText('n=' + D[1], P.X(i), P.y0 + 18); }
      ctx.restore();
    });
  }

  /* =====================================================================
     SET-UP · OPEN, CLOSED, SEALED (A2.2)
     Two sealed glass spheres — 1.7 L of water and 0.3 L of air, algae on a twig, a few
     shrimp — one on a sunny windowsill, one in a shut cupboard. Nothing but light and
     heat can cross the glass. The open tank runs beside them for comparison.
     ===================================================================== */
  const SPH_R = 0.0782;                          // m: a 2.0 L sphere
  const SPH_AIR_H = 0.0385;                      // m: the cap that holds 0.3 L of air
  const SPH = { win: [-0.15, 0, SPH_R + 0.012], dark: [0.19, 0.01, SPH_R + 0.012] };
  function sphereAgents(S) {
    S.shr = { win: [], dark: [] };
    for (const k of ['win', 'dark']) for (let i = 0; i < S.p.shrimp; i++) {
      const c = SPH[k], a = rnd(S) * TAU;
      S.shr[k].push({ p: [c[0] + Math.cos(a) * 0.03, c[1] + Math.sin(a) * 0.03, c[2] - 0.02 + rnd(S) * 0.03],
                      v: [Math.cos(a) * 0.01, Math.sin(a) * 0.01, 0], ph: rnd(S) * TAU, dead: false });
    }
  }
  function shrimpStep(S, dt) {
    if (!S.shr) return;
    for (const k of ['win', 'dark']) {
      const v = k === 'win' ? S.sphere : S.dark, alive = Math.round(v.y[NF]), c = SPH[k];
      const L2 = S.shr[k];
      let n = L2.filter(a => !a.dead).length;
      for (const a of L2) if (n > alive && !a.dead) { a.dead = true; n--; }
      const zTop = c[2] + SPH_R - SPH_AIR_H - 0.006;
      for (const a of L2) {
        if (a.dead) { a.p[2] = Math.max(c[2] - SPH_R + 0.022, a.p[2] - dt * 0.01); continue; }
        a.v[0] += gauss(S) * 0.03 * dt; a.v[1] += gauss(S) * 0.03 * dt; a.v[2] += gauss(S) * 0.02 * dt;
        const sp = Math.hypot(a.v[0], a.v[1], a.v[2]) || 1e-6, want = 0.012;
        a.v = a.v.map(u => u * (1 + (want / sp - 1) * Math.min(1, dt * 2)));
        a.p = a.p.map((u, i) => u + a.v[i] * dt);
        const d = [a.p[0] - c[0], a.p[1] - c[1], a.p[2] - c[2]], r = Math.hypot(d[0], d[1], d[2]);
        if (r > SPH_R - 0.014) { a.p = [0, 1, 2].map(i => c[i] + d[i] / r * (SPH_R - 0.014)); a.v = a.v.map((u, i) => u - 2 * d[i] / r * (u * d[i] / r)); }
        if (a.p[2] > zTop) { a.p[2] = zTop; a.v[2] = -Math.abs(a.v[2]); }
        if (a.p[2] < c[2] - SPH_R + 0.024) { a.p[2] = c[2] - SPH_R + 0.024; a.v[2] = Math.abs(a.v[2]); }
        a.ph += dt * 6;
      }
    }
  }
  function drawSealedScene(S, g) {
    const ctx = g.ctx, cam = S.cam, th = g.theme, P = (x, y, z) => cam.project([x, y, z]);
    const F = R3.Frame(ctx, cam, { ambient: 0.32, floorZ: 0 });
    const day = lightAt(S.sphere.cfg, clockStr(S.hours).tod) / Math.max(1, S.p.window);   // 0 … 1 through the day
    // the window: the sky's brightness follows the sun
    F.push([0, 0.26, 0.22], () => {
      const q = [P(-0.44, 0.26, 0.02), P(0.44, 0.26, 0.02), P(0.44, 0.26, 0.46), P(-0.44, 0.26, 0.46)];
      if (q.some(v => !v.ok)) return;
      const gr = ctx.createLinearGradient(0, q[3].y, 0, q[0].y);
      gr.addColorStop(0, RX.mix('#0A1628', '#8FC8F2', day)); gr.addColorStop(1, RX.mix('#0C1320', '#E4F1FA', day));
      ctx.fillStyle = gr; polyPath(ctx, q); ctx.fill();
      ctx.strokeStyle = '#2A2F38'; ctx.lineWidth = 6; polyPath(ctx, q); ctx.stroke();
      const m1 = P(0, 0.26, 0.02), m2 = P(0, 0.26, 0.46); ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
    }, F.GROUND);
    BENCH.texBox(F, [0.02, 0.05, -0.02], [0.92, 0.36, 0.04], BENCH.wood('#8A6440', 31), { bias: F.GROUND, tiles: 3, ambient: 0.5 });
    // the cupboard round the dark sphere: back, sides, top, and its door swung open toward us
    const cb = SPH.dark, wd = '#4A3524';
    R3.box(F, [cb[0], cb[1] + 0.12, 0.13], [0.26, 0.012, 0.26], wd, { shadow: false, ambient: 0.3 });
    R3.box(F, [cb[0] - 0.13, cb[1], 0.13], [0.012, 0.24, 0.26], wd, { shadow: false, ambient: 0.3 });
    R3.box(F, [cb[0] + 0.13, cb[1], 0.13], [0.012, 0.24, 0.26], wd, { shadow: false, ambient: 0.3 });
    R3.box(F, [cb[0], cb[1], 0.265], [0.272, 0.25, 0.012], wd, { shadow: false, ambient: 0.3 });
    R3.box(F, [cb[0] + 0.13, cb[1] - 0.24, 0.13], [0.01, 0.24, 0.26], '#5A4230', { shadow: false, ambient: 0.35 });
    for (const k of ['win', 'dark']) {
      const v = k === 'win' ? S.sphere : S.dark, c = SPH[k], lit = k === 'win' ? 0.25 + 0.75 * day : 0.06;
      F.push(c, () => drawSphere(ctx, cam, S, k, v, c, lit), 0);
    }
    F.render();
    // sunbeams through the window onto the lit sphere
    if (day > 0.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const a = P(-0.36, 0.26, 0.42), b = P(-0.02, 0.26, 0.42), c2 = P(-0.06, -0.08, 0.0), d2 = P(-0.30, -0.08, 0.0);
      if ([a, b, c2, d2].every(v => v.ok)) {
        const gr = ctx.createLinearGradient(a.x, a.y, d2.x, d2.y);
        gr.addColorStop(0, 'rgba(255,244,210,' + (0.10 * day).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,244,210,0)');
        ctx.fillStyle = gr; polyPath(ctx, [a, b, c2, d2]); ctx.fill();
      }
      ctx.restore();
    }
    void th;
  }
  function drawSphere(ctx, cam, S, k, v, c, lit) {
    const q = cam.project(c);
    if (!q.ok) return;
    const R = SPH_R * q.s, y = v.y, f = v.flux;
    const algae = clamp(y[AC] / 20, 0, 2), dead = y[NF] < 0.5 && v.cfg.consumers > 0;
    const water = RX.mix(RX.mix('#2E7C74', '#4F7A2C', clamp(algae * 0.4, 0, 1)), '#05080F', 1 - lit);
    const surfY = q.y - (SPH_R - SPH_AIR_H) * q.s;
    ctx.save();
    ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.clip();
    // air above, water below
    ctx.fillStyle = RX.rgba(RX.mix('#9AB4C8', '#05080F', 1 - lit), 0.18); ctx.fillRect(q.x - R, q.y - R, 2 * R, surfY - (q.y - R));
    const gr = ctx.createLinearGradient(0, surfY, 0, q.y + R);
    gr.addColorStop(0, RX.rgba(RX.mix(water, '#BFEFE8', 0.25 * lit), 0.75)); gr.addColorStop(1, RX.rgba(RX.mix(water, '#02070A', 0.4), 0.9));
    ctx.fillStyle = gr; ctx.fillRect(q.x - R, surfY, 2 * R, q.y + R - surfY);
    // pebbles on the bottom
    for (let i = 0; i < 26; i++) {
      const u = ((i * 0.618) % 1) * 2 - 1, px = q.x + u * R * 0.72, py = q.y + R * (0.80 - 0.12 * (1 - u * u)) + (i % 3) * 2;
      RX.blob(ctx, px, py, R * 0.055, R * 0.04, { fill: RX.mix(['#8A7A66', '#6E6458', '#A08E74'][i % 3], '#05080F', 1 - lit), r: R * 0.05, contour: 0.6, rim: 0.3, ao: 0.2 });
    }
    // a white gorgonian twig, grown over with filamentous green algae
    ctx.strokeStyle = RX.mix('#E8E0D0', '#05080F', 1 - lit); ctx.lineCap = 'round';
    const twig = [[0, 0.78, 0, 0.1], [0.0, 0.1, -0.30, -0.35], [0.0, 0.1, 0.25, -0.30], [-0.2, -0.18, -0.42, -0.10], [0.14, -0.14, 0.38, 0.02]];
    ctx.lineWidth = Math.max(1, R * 0.028);
    twig.forEach(([x0, y0, x1, y1]) => { ctx.beginPath(); ctx.moveTo(q.x + x0 * R, q.y + y0 * R); ctx.lineTo(q.x + x1 * R, q.y + y1 * R); ctx.stroke(); });
    const tufts = Math.round(18 * algae);
    const green = RX.mix(dead ? '#6B5A34' : '#5DBB4A', '#05080F', 1 - lit);
    ctx.strokeStyle = RX.rgba(green, 0.85); ctx.lineWidth = Math.max(0.6, R * 0.008);
    for (let i = 0; i < tufts; i++) {
      const b = twig[1 + (i % 4)], t = ((i * 0.37) % 1);
      const bx = q.x + (b[0] + (b[2] - b[0]) * t) * R, by = q.y + (b[1] + (b[3] - b[1]) * t) * R;
      for (let j = 0; j < 5; j++) {
        const a = -Math.PI / 2 + (j - 2) * 0.35 + Math.sin(S.ta * 0.8 + i + j) * 0.12, len = R * (0.10 + 0.05 * ((i + j) % 3));
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.6 + 2, by + Math.sin(a) * len * 0.6, bx + Math.cos(a) * len, by + Math.sin(a) * len); ctx.stroke();
      }
    }
    // the shrimp
    for (const a of (S.shr ? S.shr[k] : [])) {
      const sp = Math.hypot(a.v[0], a.v[1], a.v[2]) || 1e-6, h = a.dead ? [1, 0, 0] : [a.v[0] / sp, a.v[1] / sp, a.v[2] / sp];
      poseFish(ctx, cam, a.p, h, 0.012, LIFE.shrimp, { phase: a.ph, light: lit, dead: a.dead }, 0.28, 0.1);
    }
    // surface line, then the glass: dark limb, bright rim toward the window, two reflections
    ctx.strokeStyle = RX.rgba('#DDF3F5', 0.25 + 0.4 * lit); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(q.x, surfY, Math.sqrt(Math.max(0, SPH_R * SPH_R - (SPH_R - SPH_AIR_H) ** 2)) * q.s, 3, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    const lg = ctx.createRadialGradient(q.x, q.y, R * 0.75, q.x, q.y, R);
    lg.addColorStop(0, 'rgba(200,230,240,0)'); lg.addColorStop(1, 'rgba(200,230,240,' + (0.10 + 0.25 * lit).toFixed(3) + ')');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(210,240,250,' + (0.35 + 0.35 * lit).toFixed(3) + ')'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.5 * lit).toFixed(3) + ')'; ctx.lineWidth = Math.max(1.5, R * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(q.x, q.y, R * 0.82, -2.6, -1.9); ctx.stroke();
    ctx.lineWidth = Math.max(1, R * 0.02); ctx.beginPath(); ctx.arc(q.x, q.y, R * 0.88, 0.3, 0.6); ctx.stroke();
    // the stand
    ctx.fillStyle = RX.mix('#3A2A1C', '#05080F', 0.2);
    ctx.beginPath(); ctx.ellipse(q.x, q.y + R * 0.98, R * 0.45, R * 0.10, 0, 0, TAU); ctx.fill();
    void f;
  }
  function sealedCards(g, S) {
    const ctx = g.ctx, th = g.theme, W = g.w;
    const rows = [
      ['OPEN TANK', S.tank, S.hist.length ? S.hist[0] : null, '#9FCBFF', null],
      ['SEALED · WINDOW', S.sphere, null, '#FFE08A', S.c0 ? S.c0.win : null],
      ['SEALED · CUPBOARD', S.dark, null, '#8A93A8', S.c0 ? S.c0.dark : null]
    ];
    const narrow = W < 640, cw = Math.min(250, (W - 30) / 3), y = narrow ? g.h - 142 : g.h - FOOT - 104;
    if (narrow) {                                   // a phone: name, carbon, its change, O₂ and who is alive
      rows.forEach(([name, v, , col, c0], i) => {
        const x = 10 + i * (cw + 5), C = MODEL.carbon(v), base = c0 == null ? S.cOpen0 : c0, d = C - base;
        card(ctx, x, y, cw, 68);
        ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.fillStyle = col; ctx.fillText(fitText(ctx, name, cw - 12), x + 6, y + 10);
        ctx.font = '700 11px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text; ctx.fillText(C.toFixed(C > 1000 ? 0 : 3) + ' mg C', x + 6, y + 25);
        ctx.font = '500 8px "IBM Plex Mono",monospace';
        ctx.fillStyle = Math.abs(d) < 1e-6 * Math.max(1, base) ? '#4ADE80' : '#FBBF24';
        ctx.fillText(fitText(ctx, 'change ' + (d >= 0 ? '+' : '') + (Math.abs(d) < 1e-9 ? '0.000000' : d.toFixed(Math.abs(d) < 1 ? 6 : 1)), cw - 12), x + 6, y + 40);
        ctx.fillStyle = th['text-2'];
        ctx.fillText(fitText(ctx, 'O₂ ' + v.y[O2].toFixed(1) + ' · ' + Math.round(v.y[NF]) + (v === S.tank ? ' fish' : ' shrimp'), cw - 12), x + 6, y + 55);
        ctx.restore();
      });
      return;
    }
    rows.forEach(([name, v, , col, c0], i) => {
      const x = 10 + i * (cw + 5);
      card(ctx, x, y, cw, 96);
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = col; ctx.fillText(name, x + 9, y + 11);
      const C = MODEL.carbon(v), base = c0 == null ? S.cOpen0 : c0;
      const d = C - base;
      ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
      ctx.fillText('carbon inside', x + 9, y + 28);
      ctx.font = '700 12px "IBM Plex Mono",monospace'; ctx.fillStyle = th.text;
      ctx.fillText(C.toFixed(C > 1000 ? 0 : 3) + ' mg', x + 9, y + 42);
      ctx.font = '500 9px "IBM Plex Mono",monospace';
      ctx.fillStyle = Math.abs(d) < 1e-6 * Math.max(1, base) ? '#4ADE80' : '#FBBF24';
      ctx.fillText((c0 == null ? 'change since the start: ' : 'change since sealed: ') + (d >= 0 ? '+' : '') + (Math.abs(d) < 1e-9 ? '0.000000' : d.toFixed(Math.abs(d) < 1 ? 6 : 1)) + ' mg', x + 9, y + 56);
      ctx.fillStyle = th['text-2'];
      const o2 = v.y[O2], alive = Math.round(v.y[NF]);
      ctx.fillText('O₂ ' + o2.toFixed(2) + ' mg/L · ' + (v === S.tank ? alive + ' fish' : alive + ' shrimp alive'), x + 9, y + 70);
      ctx.fillText('light in ' + v.flux.lightW.toFixed(2) + ' W', x + 9, y + 84);
      ctx.restore();
    });
  }
  function sealedPlot(S, g) {
    const th = g.theme, H = S.sHist;
    if (!H || H.length < 2) { g.Plot({ xmin: 0, xmax: 1, ymin: -1, ymax: 1 }).frame(); return; }
    const t0 = H[0].t, t1 = H[H.length - 1].t;
    const rel = (h, k, b) => (h[k] - b) / b * 100;
    let lo = -0.5, hi = 0.5;
    H.forEach(h => { const r = rel(h, 'open', H[0].open); lo = Math.min(lo, r); hi = Math.max(hi, r); });
    const K = plotKey(g, [{ c: '#9FCBFF', label: 'open tank' }, { c: '#FFE08A', label: 'sealed, on the window', w: 3 }, { c: '#8A93A8', label: 'sealed, in the cupboard', dash: [5, 4], w: 2 }]);
    const xs = Math.max(1, (t1 - t0) / 24);
    const P = g.Plot(Object.assign({ xmin: 0, xmax: xs, ymin: lo * 1.15, ymax: hi * 1.15, xlabel: 'days sealed', ylabel: 'carbon inside, % change', pad: { t: K.t },
                       yfmt: v => v.toFixed(1) }, dayAxis(0, xs, true))).frame();
    K.draw(P);
    P.clip(() => {
      P.line(H.map(h => [(h.t - t0) / 24, rel(h, 'open', H[0].open)]), '#9FCBFF', 2);
      P.line(H.map(h => [(h.t - t0) / 24, rel(h, 'win', H[0].win)]), '#FFE08A', 2.5);
      P.line(H.map(h => [(h.t - t0) / 24, rel(h, 'dark', H[0].dark)]), '#8A93A8', 1.5, [5, 4]);
    });
  }
  function sphereO2Plot(S, g) {
    const th = g.theme, H = S.sHist;
    if (!H || H.length < 2) { g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 10 }).frame(); return; }
    const t0 = H[0].t, t1 = H[H.length - 1].t;
    const K = plotKey(g, [{ c: '#FFE08A', label: 'sphere on the window' }, { c: '#8A93A8', label: 'sphere in the cupboard', dash: [5, 4] }]);
    const xs = Math.max(1, (t1 - t0) / 24);
    const P = g.Plot(Object.assign({ xmin: 0, xmax: xs, ymin: 0, ymax: 12, xlabel: 'days sealed', ylabel: 'O₂, mg/L', pad: { t: K.t },
                       yfmt: v => v.toFixed(0) }, dayAxis(0, xs, true))).frame();
    K.draw(P);
    P.clip(() => {
      P.line(H.map(h => [(h.t - t0) / 24, h.o2w]), '#FFE08A', 2);
      P.line(H.map(h => [(h.t - t0) / 24, h.o2d]), '#8A93A8', 2, [5, 4]);
      P.hline(2.5, g.alpha(th.crit, .55), [4, 3]); P.hline(1.3, g.alpha(th.crit, .9), [2, 2]);
    });
    const ctx = g.ctx; ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = th.crit; ctx.textAlign = 'right';
    ctx.fillText('shrimp gasp below 2.5', P.x1 - 4, P.Y(2.5) - 3); ctx.fillText('and die below 1.3', P.x1 - 4, P.Y(1.3) - 3);
    ctx.restore();
  }

  /* =====================================================================
     SET-UP · SYSTEMS INSIDE SYSTEMS (A1.2 nested subsystems, A1.5 systems across scales)
     One process — O₂ in, CO₂ out — at six levels, each rate scaled from the live model.
     ===================================================================== */
  const LEVELS = ['planet', 'tank', 'fish', 'gill', 'cell', 'mito'];
  const CELLS_PER_FISH = 4e8;                     // a 0.4 g fish, if its cells average ~1 ng
  const MITO_PER_CELL = 300;                      // typical of an active cell (hundreds to thousands)
  const GILL_ARCHES = 8;                          // bony fish: four arches on each side
  const EARTH_O2_MG_H = 120e15 * (MW_O2 / MW_C) * 1000 / 8766;   // ~120 Gt C a year of gross photosynthesis
  function levelInfo(S, lv) {
    const f = S.tank.flux, n = Math.max(1, f.alive), fishO2 = f.Rf / n;
    const I = {
      planet: { name: 'The planet', size: '12 742 km', o2: EARTH_O2_MG_H, of: 'every living thing on Earth', parts: 'oceans, land, air, life' },
      tank: { name: 'The tank', size: '60 cm', o2: f.o2use, of: Math.round(f.alive) + ' fish, plants, algae, bacteria', parts: 'fish, plants, bacteria, water' },
      fish: { name: 'One neon tetra', size: '3 cm', o2: fishO2, of: 'one of ' + Math.round(f.alive) + ' fish', parts: 'gills, heart, blood, muscles' },
      gill: { name: 'One gill arch', size: '3 mm', o2: fishO2 / GILL_ARCHES, of: 'one of ' + GILL_ARCHES + ' arches', parts: 'filaments, lamellae, blood' },
      cell: { name: 'One muscle cell', size: '30 µm', o2: fishO2 / CELLS_PER_FISH, of: '1 of ~4 × 10⁸ cells', parts: 'mitochondria, myofibrils, nucleus' },
      mito: { name: 'One mitochondrion', size: '1 µm', o2: fishO2 / CELLS_PER_FISH / MITO_PER_CELL, of: '1 of ~' + MITO_PER_CELL + ' in the cell', parts: 'membranes, enzymes' }
    };
    return I[lv];
  }
  /* an O₂ rate in mg/h, said in the unit that suits it */
  const sci = v => { const e = Math.floor(Math.log10(v)); return (v / Math.pow(10, e)).toFixed(1) + ' × 10' + L.sup(e); };
  function o2Say(mgh) {
    if (mgh >= 1e12) return sci(mgh * 8766 / 1e9) + ' t a year';            // mg/h → tonnes a year
    if (mgh >= 10) return mgh.toFixed(0) + ' mg/h';
    if (mgh >= 0.001) return mgh.toPrecision(2) + ' mg/h';
    const molec = mgh / 1000 / MW_O2 * 6.02214e23 / 3600;
    return molec >= 1e5 ? sci(molec) + ' molecules/s' : Math.round(molec).toLocaleString('en') + ' molecules/s';
  }
  /* the gill as a counter-current exchanger with matched capacity rates (NTU = 4) */
  function exchanger() {
    const N = 4, counter = N / (1 + N), parallel = (1 - Math.exp(-2 * N)) / 2;
    const water = [], blood = [], parBlood = [];
    for (let i = 0; i <= 20; i++) {
      const x = i / 20;
      water.push([x, 1 - counter * x]); blood.push([x, counter * (1 - x)]);
      parBlood.push([x, (1 - Math.exp(-2 * N * x)) / 2]);
    }
    return { counter, parallel, water, blood, parBlood };
  }
  function drawZoom(S, g) {
    const ctx = g.ctx, th = g.theme, W = g.w, H = g.h, lv = S.p.level;
    const narrow = W < 640, pw = narrow ? W : W * 0.70, px = 0, py = HDR, ph = narrow ? H - HDR - 150 : H - HDR - FOOT - 36;
    S._chip = null;
    if (lv === 'tank') drawTankScene(S, g, {});
    else {
      ctx.save();
      ctx.fillStyle = 'rgba(5,8,15,.35)'; ctx.fillRect(0, 0, W, H);
      if (lv === 'planet') {
        if (!window.EARTH || !EARTH.ready()) {
          if (window.EARTH) EARTH.load();
          ctx.font = '500 11px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'center';
          ctx.fillText(window.EARTH && EARTH.failed() ? 'the Earth image could not be loaded' : 'loading the Earth…', px + pw / 2, py + ph / 2);
        } else {
          if (!S.camG) S.camG = Camera({ theta: -1.2, phi: 0.25, dist: 4.1, target: [0, 0, 0], fov: 0.62 });
          S.camG.setViewport(W, H);
          S.camG.dist = S.camG._k / (0.46 * Math.min(pw - 20, ph));    // the globe fills the space it has, no more
          S.camG.update();
          ctx.save(); ctx.translate(px + pw / 2 - W / 2, py + ph / 2 - H / 2 + 6);
          // Africa and Europe turn into view first; the Sun stands off to the left, so the terminator shows the round
          EARTH.draw(ctx, S.camG, [0, 0, 0], 1, { spin: S.ta * 0.06 - 1.46, sun: [-0.43, -0.77, 0.49], ambient: 0.06 });
          ctx.restore();
        }
      } else if (lv === 'fish') LIFE.plates.fish(ctx, px + 10, py + 6, pw - 20, ph);
      else if (lv === 'gill') LIFE.plates.gill(ctx, px + 10, py + 6, pw - 20, ph, { eff: exchanger() });
      else if (lv === 'cell') LIFE.plates.cell(ctx, px + 10, py + 6, pw - 20, ph, { t: S.ta });
      else if (lv === 'mito') LIFE.plates.mito(ctx, px + 10, py + 6, pw - 20, ph);
      ctx.restore();
    }
    // the same pattern at every level: what goes in, what comes out
    const info = levelInfo(S, lv), co2 = info.o2 * MW_CO2 / MW_O2;
    const sy = narrow ? H - 108 : H - FOOT - 30;
    card(ctx, 10, sy, pw - 20, 26);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.font = '600 ' + (narrow ? 9 : 10) + 'px "IBM Plex Mono",monospace';
    ctx.fillStyle = '#9FF0FF'; ctx.textAlign = 'left'; ctx.fillText('O₂ in  ' + o2Say(info.o2), 20, sy + 13);
    if (!narrow) { ctx.fillStyle = th['text-2']; ctx.textAlign = 'center'; ctx.fillText('→  ' + info.name.toLowerCase() + '  →', (pw - 20) / 2 + 10, sy + 13); }
    ctx.fillStyle = '#FFB35C'; ctx.textAlign = 'right'; ctx.fillText('CO₂ out  ' + o2Say(co2), pw - 20, sy + 13);
    ctx.restore();
    if (narrow) zoomStrip(g, S, H - 142);
    else zoomLadder(g, S, pw + 4, HDR + 4, W - pw - 14, H - HDR - FOOT - 10);
  }
  /* the ladder on a phone: six rungs in a row, the one in view lit, each a button */
  function zoomStrip(g, S, y) {
    const ctx = g.ctx, th = g.theme, n = LEVELS.length, gap = 4, rw = (g.w - 20 - gap * (n - 1)) / n, rh = 28;
    const SHORT = { planet: 'planet', tank: 'tank', fish: 'fish', gill: 'gill', cell: 'cell', mito: 'mito' };
    S._rungs = [];
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    LEVELS.forEach((lv, i) => {
      const x = 10 + i * (rw + gap), on = S.p.level === lv, I = levelInfo(S, lv);
      ctx.fillStyle = on ? RX.rgba(th.accent, 0.28) : 'rgba(8,12,22,.84)';
      ctx.strokeStyle = on ? th.accent : 'rgba(80,100,140,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, rw, rh, 5); else ctx.rect(x, y, rw, rh); ctx.fill(); ctx.stroke();
      ctx.font = '700 10px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on ? th.text : th['text-2'];
      ctx.fillText(SHORT[lv], x + rw / 2, y + 10);
      ctx.font = '500 8px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3'];
      ctx.fillText(I.size, x + rw / 2, y + 21);
      if (i < n - 1) { ctx.fillStyle = th['text-3']; ctx.fillText('›', x + rw + gap / 2, y + rh / 2); }
      S._rungs.push({ lv, x0: x, y0: y, x1: x + rw, y1: y + rh });
    });
    ctx.restore();
  }
  function zoomLadder(g, S, x, y, w, h) {
    const ctx = g.ctx, th = g.theme, n = LEVELS.length, rh = (h - 26) / n;
    ctx.save(); ctx.fillStyle = 'rgba(6,9,17,.86)';                // a denser card: the scene must not show through the text
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6); else ctx.rect(x, y, w, h); ctx.fill(); ctx.restore();
    card(ctx, x, y, w, h);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.fillText('EACH IS A PART OF THE ONE ABOVE', x + 9, y + 12);
    S._rungs = [];
    LEVELS.forEach((lv, i) => {
      const I = levelInfo(S, lv), ry = y + 24 + i * rh, on = S.p.level === lv;
      if (on) { ctx.fillStyle = RX.rgba(th.accent, 0.16); ctx.fillRect(x + 4, ry, w - 8, rh - 4); ctx.strokeStyle = th.accent; ctx.strokeRect(x + 4, ry, w - 8, rh - 4); }
      ctx.font = '700 11px "IBM Plex Sans",sans-serif'; ctx.fillStyle = on ? th.text : th['text-2']; ctx.fillText(I.name, x + 12, ry + 11);
      ctx.font = '500 9px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-3']; ctx.textAlign = 'right'; ctx.fillText(I.size, x + w - 12, ry + 11); ctx.textAlign = 'left';
      ctx.fillStyle = '#9FF0FF'; ctx.fillText('O₂ ' + o2Say(I.o2), x + 12, ry + 25);
      if (rh > 46) { ctx.fillStyle = th['text-3']; ctx.fillText(I.of, x + 12, ry + 38); }
      if (i < n - 1) { ctx.strokeStyle = 'rgba(120,140,180,.5)'; ctx.beginPath(); ctx.moveTo(x + w / 2, ry + rh - 4); ctx.lineTo(x + w / 2, ry + rh); ctx.stroke(); }
      S._rungs.push({ lv, x0: x + 4, y0: ry, x1: x + w - 4, y1: ry + rh - 4 });
    });
    ctx.restore();
  }
  /* O₂ use against size, from the planet to one mitochondrion — the same process across 20 orders */
  function scalePlot(S, g) {
    const th = g.theme, sizes = { planet: 1.2742e7, tank: 0.6, fish: 0.03, gill: 3e-3, cell: 3e-5, mito: 1e-6 };
    const P = g.Plot({ xmin: -7, xmax: 8, ymin: -18, ymax: 18, xlabel: 'size, m (log)', ylabel: 'O₂ use, mg/h (log)',
                       xticks: [-6, -3, 0, 3, 6], yticks: [-15, -10, -5, 0, 5, 10, 15], xfmt: v => '10' + L.sup(v), yfmt: v => '10' + L.sup(v) }).frame();
    const pts = LEVELS.map(lv => [Math.log10(sizes[lv]), Math.log10(Math.max(1e-30, levelInfo(S, lv).o2)), lv]);
    P.clip(() => {
      P.line(pts.map(q => [q[0], q[1]]), g.alpha(th.accent, .5), 1.5, [4, 3]);
      pts.forEach(q => P.dot(q[0], q[1], q[2] === S.p.level ? 5 : 3.2, q[2] === S.p.level ? '#FFD36B' : th.accent));
    });
    pts.forEach(q => P.tag(q[0], q[1], levelInfo(S, q[2]).name.replace('One ', '').replace('The ', ''), th['text-2'], q[0] > 5 ? 'right' : 'left', -9));
  }

  /* =====================================================================
     THE STAGE, THE PLOTS, THE STRIP — per set-up
     ===================================================================== */
  function drawStageAll(S, g) {
    const p = S.p, W = g.w, H = g.h;
    const c = clockStr(S.hours), y = S.tank.y, f = S.tank.flux;
    S._narrow = W < 640;
    if (S.cam && S._narrowCam !== S._narrow) {             // the stage crossed the phone width: re-home the view once
      const h = homeFor(p.setup, S._narrow);
      S.cam.dist = h.dist; S.cam.target = h.target.slice(); S.cam.home = { theta: h.theta, phi: h.phi, dist: h.dist };
      S._narrowCam = S._narrow;
    }
    if (p.setup === 'zoom') {
      drawZoom(S, g);
      header(g, S, 'Systems inside systems — ' + levelInfo(S, p.level).name.toLowerCase(),
        'the same exchange at every level: O₂ in, CO₂ out · each level is made of the one below',
        'rates scaled from the live tank · ' + c.text);
      clockStrip(g, S);
      return;
    }
    if (p.setup === 'sealed') {
      drawSealedScene(S, g);
      sealedCards(g, S);
      const dC = MODEL.carbon(S.sphere) - S.c0.win;
      header(g, S, 'Sealed: nothing crosses the glass but light and heat',
        c.text + ' · window sphere carbon ' + MODEL.carbon(S.sphere).toFixed(3) + ' mg (change ' + (Math.abs(dC) < 5e-7 ? '0.000000' : (dC >= 0 ? '+' : '') + dC.toFixed(6)) + ' mg) · O₂ ' + S.sphere.y[O2].toFixed(2) + ' mg/L',
        'cupboard sphere O₂ ' + S.dark.y[O2].toFixed(2) + ' mg/L · ' + Math.round(S.dark.y[NF]) + ' of ' + p.shrimp + ' shrimp alive in the dark');
      clockStrip(g, S);
      return;
    }
    const extra = {};
    if (p.setup === 'trace') extra.inside = (FC) => drawTracers(FC, S, g.ctx);
    drawTankScene(S, g, Object.assign({ cutFilter: p.cutFilter }, extra));
    if (p.setup === 'unplug') {
      const gasp = y[O2] < 2.5, lampOn = f.lampW > 0, share = f.o2make / Math.max(1e-9, f.o2use);
      const line = gasp ? 'O₂ ' + y[O2].toFixed(1) + ' mg/L — the fish are gasping at the surface'
        : f.alive < p.fish - 0.5 ? Math.round(p.fish - f.alive) + ' of ' + p.fish + ' fish have died'
        : lampOn ? (share >= 1 ? 'Lamp on: the plants make more O₂ than the whole tank uses'
                               : 'Lamp on, but the tank uses more O₂ than the plants can make')
        : share < 0.05 ? 'Dark: every living part is using O₂ and none is being made'
        : 'Lamp off: the room’s dim light lets the plants make only ' + (100 * share).toFixed(0) + ' % of the O₂ the tank uses';
      header(g, S, line, c.text + ' · O₂ ' + y[O2].toFixed(2) + ' mg/L (' + (100 * y[O2] / o2sat(y[TW])).toFixed(0) + ' % of saturation) · pH ' + f.pH.toFixed(2) + ' · ' + y[TW].toFixed(1) + ' °C',
        'made ' + fmtFlux(f.o2make, 'mg O₂/h') + ' · used ' + fmtFlux(f.o2use, 'mg O₂/h') + ' · ' +
        (f.exO2 >= 0 ? 'in from the air ' + fmtFlux(f.exO2, 'mg O₂/h') : 'lost to the air ' + fmtFlux(-f.exO2, 'mg O₂/h')));
      const at = cardSlot(g, S, p.web ? 'the parts and how they interact' : 'what each part is doing', p.web ? Math.min(292, W * 0.33) : Math.min(300, W * 0.36));
      if (at && p.web) webCard(g, S, at.x, at.y, at.w, S._narrow ? 278 : 296);
      else if (at) partsPanel(g, S, at.x, at.y, at.w);
      if (p.cutFilter && !(S._narrow && S.cardOpen)) {
        // low on the right, clear of the filter it shows, with a leader up to the real one
        const iw = S._narrow ? W - 20 : 262, ih = 206, ix = S._narrow ? 10 : W - iw - 10, iy = S._narrow ? H - 64 - ih : H - 46 - ih;
        const q = S.cam.project([FILTER_AT[0], FILTER_AT[1] + 0.035, FILTER_AT[2] - 0.05]);
        if (q.ok) {
          g.ctx.save(); g.ctx.strokeStyle = 'rgba(159,240,255,.55)'; g.ctx.setLineDash([3, 3]); g.ctx.lineWidth = 1;
          g.ctx.beginPath(); g.ctx.moveTo(q.x, q.y); g.ctx.lineTo(ix + iw * 0.5, iy); g.ctx.stroke();
          g.ctx.setLineDash([]); g.ctx.fillStyle = 'rgba(159,240,255,.9)'; g.ctx.beginPath(); g.ctx.arc(q.x, q.y, 2.5, 0, TAU); g.ctx.fill();
          g.ctx.restore();
        }
        filterInset(g, S, ix, iy, iw, ih);
      }
    } else if (p.setup === 'shoal') {
      const o = S.order || { phi: 0 };
      header(g, S, p.leader ? (p.removeTag ? 'The leader is gone — and the school with it' : 'Everyone follows the tagged fish')
        : (p.removeTag ? 'The tagged fish is gone — the school carries on' : o.phi > 0.6 ? 'Schooling: order no single fish is computing' : 'Milling: the rules are too weak to line the fish up'),
        'each fish sees only neighbours within 10 cm · align ' + p.align.toFixed(2) + ' · cohere ' + p.cohere.toFixed(2) + ' · apart ' + p.sepCm.toFixed(1) + ' cm · noise ' + p.noise.toFixed(2),
        p.predator ? 'angelfish hunting · ' + S.caught + ' caught · ' + S.confused + ' times it lost its target in the crowd' : '');
      const at = cardSlot(g, S, 'the shoal, measured', Math.min(300, W * 0.34));
      if (at) shoalCard(g, S, at.x, at.y, at.w);
    } else if (p.setup === 'boundary') {
      drawBoundary(g, S);
      header(g, S, 'Boundary around ' + BOUND_NAME[p.bound], 'drag the grip outward for a bigger boundary, inward for a smaller one',
        'in − out = what builds up inside · flows are the model’s, now');
      const at = cardSlot(g, S, 'what crosses the boundary', Math.min(300, W * 0.36));
      if (at) ledgerCard(g, S, at.x, at.y, at.w);
    } else if (p.setup === 'trace') {
      header(g, S, p.tracer === 'carbon' ? 'Following ' + p.tracers + ' carbon atoms from a pinch of fish food' : 'Following ' + p.tracers + ' joules of lamp light',
        c.text + ' · each tracer moves at the rates the model computes now',
        p.tracer === 'carbon' ? 'matter goes round and round until it leaves' : 'energy goes through once and leaves as heat');
      const at = cardSlot(g, S, 'where the tracers are', Math.min(290, W * 0.34));
      if (at) traceCard(g, S, at.x, at.y, at.w);
    }
    if (!(S._narrow && S.cardOpen && S._chip)) clockStrip(g, S);     // an open card on a phone has the whole stage
  }

  function plotOne(S, g) {
    switch (S.p.setup) {
      case 'shoal': return orderHistPlot(S, g);
      case 'sealed': return sealedPlot(S, g);
      case 'trace': return tracePlot(S, g);
      default: return historyPlot(S, g);
    }
  }
  function plotTwo(S, g) {
    switch (S.p.setup) {
      case 'shoal': return orderPlot(S, g);
      case 'boundary': return ledgerPlot(S, g);
      case 'sealed': return sphereO2Plot(S, g);
      case 'trace': return residencePlot(S, g);
      case 'zoom': return scalePlot(S, g);
      default: return landPlot(S, g);
    }
  }
  function titleOne(S) {
    switch (S.p.setup) {
      case 'shoal': return 'Order in the shoal, the last minute';
      case 'sealed': return 'Carbon inside each vessel since sealing — % change';
      case 'trace': return S.p.tracer === 'carbon' ? 'Where the tagged carbon has been' : 'Where the tagged energy has been';
      default: return ({ o2: 'Dissolved oxygen, mg/L', nitrogen: 'Ammonia, nitrite and nitrate, mg/L', ph: 'pH', heat: 'Water temperature, °C' })[S.p.graph] + ' — the tank over time';
    }
  }
  function titleTwo(S) {
    switch (S.p.setup) {
      case 'shoal': return 'Order against random turning — the same rules, run blind at each noise';
      case 'boundary': return 'In and out across the boundary, each quantity on its own scale';
      case 'sealed': return 'O₂ inside the two sealed spheres';
      case 'trace': return 'How long a tracer stays in each pool';
      case 'zoom': return 'O₂ use against size, from the planet to a mitochondrion';
      default: return 'Dawn O₂ against the number of fish — for every plant mass';
    }
  }

  /* ---------------- readouts and equations per set-up ---------------- */
  function readoutsAll(S) {
    const p = S.p, f = S.tank.flux, y = S.tank.y;
    if (p.setup === 'shoal') {
      const o = S.order || { phi: 0, nnd: 0, group: 0 };
      return [
        { label: 'Polarisation Φ', value: o.phi.toFixed(2), flag: 'accent', hint: o.phi > 0.8 ? 'swimming as one' : o.phi > 0.4 ? 'loosely aligned' : 'every fish its own way' },
        { label: 'Nearest neighbour', value: o.nnd.toFixed(2), unit: 'body lengths' },
        { label: 'Largest group', value: (100 * o.group).toFixed(0), unit: '%', hint: 'of the fish, chained within 3 body lengths' },
        { label: 'Swimming speed', value: (S.speedBL || 0).toFixed(2), unit: 'BL/s' },
        { label: 'Random turning', value: p.noise.toFixed(2), hint: 'the noise: what each fish does alone' },
        { label: 'Fish in the shoal', value: String(S.fish.filter(f2 => !(p.removeTag && f2.tag)).length), hint: p.removeTag ? 'the tagged fish netted out' : 'the tagged fish ringed' },
        { label: 'Angelfish catches', value: p.predator ? String(S.caught) : '—', flag: p.predator && S.caught ? 'warn' : '', hint: p.predator ? 'lost its target ' + S.confused + ' times' : 'add the angelfish' }
      ];
    }
    if (p.setup === 'boundary') {
      const rows = ledger(S), fit = fitOf(p);
      const out = rows.slice(0, 6).map(r => ({ label: r.q + ' in / out', value: fmtN(r.inn) + ' / ' + fmtN(r.out), unit: r.unit, hint: r.note }));
      out.unshift({ label: 'Fits the question?', value: fit === 'good' ? 'yes' : fit === 'partial' ? 'partly' : 'no', flag: fit === 'good' ? 'ok' : fit === 'partial' ? 'warn' : 'crit', hint: BOUND_NAME[p.bound] });
      if (p.bound === 'water') {
        const d = new Float64Array(NS); derive(S.tank, y, ((S.hours % 24) + 24) % 24, d, false);
        out.push({ label: 'O₂ stored per hour', value: (d[O2] * S.tank.cfg.vol).toFixed(1), unit: 'mg/h', hint: 'made − used + in − out: the ledger closes' });
      }
      return out;
    }
    if (p.setup === 'sealed') {
      const cw = MODEL.carbon(S.sphere), cd = MODEL.carbon(S.dark);
      return [
        { label: 'Carbon · window', value: cw.toFixed(3), unit: 'mg', flag: 'accent', hint: 'change ' + (cw - S.c0.win).toExponential(1) + ' mg since sealing' },
        { label: 'Carbon · cupboard', value: cd.toFixed(3), unit: 'mg', hint: 'change ' + (cd - S.c0.dark).toExponential(1) + ' mg' },
        { label: 'Carbon · open tank', value: MODEL.carbon(S.tank).toFixed(0), unit: 'mg', hint: 'change ' + (MODEL.carbon(S.tank) - S.cOpen0).toFixed(1) + ' mg — food in, CO₂ out' },
        { label: 'O₂ · window', value: S.sphere.y[O2].toFixed(2), unit: 'mg/L', flag: S.sphere.y[O2] < 2.5 ? 'crit' : 'ok' },
        { label: 'O₂ · cupboard', value: S.dark.y[O2].toFixed(2), unit: 'mg/L', flag: S.dark.y[O2] < 2.5 ? 'crit' : S.dark.y[O2] < 5 ? 'warn' : 'ok' },
        { label: 'Shrimp alive', value: Math.round(S.sphere.y[NF]) + ' · ' + Math.round(S.dark.y[NF]), hint: 'window · cupboard, of ' + p.shrimp + ' in each' },
        { label: 'Light in · window', value: S.sphere.flux.lightW.toFixed(3), unit: 'W', hint: 'the only thing that gets in' },
        { label: 'Redox balance Ω', value: MODEL.omega(S.sphere).toFixed(4), unit: 'mmol', hint: 'O₂ + 1.5 NO₂ + 2 NO₃ − organic C, also conserved: drift ' + (MODEL.omega(S.sphere) - S.c0.wWin).toExponential(1) }
      ];
    }
    if (p.setup === 'trace') {
      const kind = S.trKind || p.tracer, names = kind === 'carbon' ? CP_NAME : EP_NAME;
      const counts = {}; (S.tr || []).forEach(t => { counts[t.pool] = (counts[t.pool] || 0) + 1; });
      const gone = kind === 'carbon' ? (counts.air || 0) + (counts.out || 0) : (counts.room || 0);
      const R = rates(S, kind, kind === 'carbon' ? 'water' : 'heat'), tot = R.reduce((a, q) => a + q[1], 0);
      const D = (S.trDone || {})[kind === 'carbon' ? 'water' : 'heat'];
      return [
        { label: 'Tracers inside', value: String((S.tr || []).length - gone), unit: '/ ' + (S.tr || []).length, flag: 'accent' },
        { label: kind === 'carbon' ? 'Left the tank (air, water change)' : 'Left as heat', value: String(gone) },
        { label: 'Moves made so far', value: String((S.tr || []).reduce((a, t) => a + t.hops, 0)) },
        { label: 'Most are in', value: Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ? names[Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]] : '—' },
        { label: kind === 'carbon' ? 'Time in dissolved CO₂ · model τ = store ÷ flow' : 'Time as warmth · model τ = store ÷ flow', value: tot > 0 ? (1 / tot).toFixed(1) : '∞', unit: 'h', hint: D && D[1] ? 'tracers measured ' + (D[0] / D[1]).toFixed(1) + ' h over ' + D[1] + ' stays' : 'no completed stays yet' },
        { label: 'Clock', value: clockStr(S.hours).text }
      ];
    }
    if (p.setup === 'zoom') {
      const I = levelInfo(S, p.level);
      return [
        { label: 'Looking at', value: I.name, flag: 'accent', hint: I.size + ' across' },
        { label: 'O₂ used here', value: o2Say(I.o2), hint: 'scaled from the live tank' },
        { label: 'CO₂ given off here', value: o2Say(I.o2 * MW_CO2 / MW_O2) },
        { label: 'This is part of', value: I.of },
        { label: 'Its own parts', value: I.parts },
        { label: 'One fish now uses', value: (f.Rf / Math.max(1, f.alive)).toFixed(3), unit: 'mg O₂/h', hint: 'at ' + y[TW].toFixed(1) + ' °C — warmer, and every level speeds up' }
      ];
    }
    return tankReadouts(S);
  }
  const fmtN = v => v === 0 ? '—' : (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  function equationAll(S) {
    const p = S.p;
    if (p.setup === 'shoal') {
      const o = S.order || { phi: 0 }, n = S.fish.filter(f => !(p.removeTag && f.tag)).length;
      return E.v('Φ') + ' ' + E.op('=') + ' ' + E.frac('|' + E.v('Σ v̂') + E.sub('i') + '|', E.v('N')) + ' ' + E.op('=') + ' ' +
        E.frac(E.n(o.phi * n, ''), E.n(n, 'fish')) + ' ' + E.op('=') + ' ' + E.n(o.phi, '') +
        '<br><span style="font-size:12px;color:var(--text-3)">each fish steers by ' + E.v('a') + ' = ' + p.align.toFixed(2) + '·(neighbours’ heading − mine) + ' +
        p.cohere.toFixed(2) + '·(neighbours’ centre − me) − keep ' + p.sepCm.toFixed(1) + ' cm apart + noise ' + p.noise.toFixed(2) + '</span>';
    }
    if (p.setup === 'sealed') {
      const v = S.sphere, y = v.y;
      return E.v('C') + E.sub('inside') + ' ' + E.op('=') + ' ' + E.n(y[DIC] * v.cfg.vol, 'mg') + E.sub('dissolved') + ' ' + E.op('+') + ' ' + E.n(y[AC], 'mg') + E.sub('algae') + ' ' +
        E.op('+') + ' ' + E.n(y[FC], 'mg') + E.sub('shrimp') + ' ' + E.op('+') + ' ' + E.n(y[DC], 'mg') + E.sub('debris') + ' ' + E.op('+') + ' ' + E.n(y[HC], 'mg') + E.sub('air') +
        ' ' + E.op('=') + ' ' + E.n(MODEL.carbon(v), 'mg');
    }
    if (p.setup === 'boundary') {
      const y = S.tank.y, f = S.tank.flux, V = S.tank.cfg.vol;
      const d = new Float64Array(NS); derive(S.tank, y, ((S.hours % 24) + 24) % 24, d, false);
      const inside = f.o2make - f.o2use, cross = f.exO2, wc = S.tank.cfg.change / 100 / 168 * (y[O2] - o2sat(S.tank.cfg.roomT)) * V;
      return E.v('stored') + ' ' + E.op('=') + ' ' + E.v('made − used inside') + ' ' + E.op('+') + ' ' + E.v('in − out across') +
        '<br>' + E.n(d[O2] * V, 'mg O₂/h') + ' ' + E.op('=') + ' ' + E.n(inside, 'mg/h') + ' ' + E.op('+') + ' ' + E.n(cross - wc, 'mg/h') +
        '<br><span style="font-size:12px;color:var(--text-3)">for the water boundary; the left side is the model’s own rate of change, the right side the ledger’s sum</span>';
    }
    if (p.setup === 'trace') {
      const kind = S.trKind || p.tracer, pool = kind === 'carbon' ? 'water' : 'heat';
      const R = rates(S, kind, pool), tot = R.reduce((a, q) => a + q[1], 0);
      return E.v('τ') + ' ' + E.op('=') + ' ' + E.frac(E.v('store'), E.v('flow out')) + ' ' + E.op('=') + ' ' + E.frac('1', E.n(tot, 'per h')) + ' ' + E.op('=') + ' ' + E.n(tot > 0 ? 1 / tot : Infinity, 'h') +
        '<br><span style="font-size:12px;color:var(--text-3)">' + (kind === 'carbon' ? 'how long carbon stays dissolved before a plant, an alga, the air or a water change takes it' :
        'how long the warmth stays in the water before it leaves through the glass and the surface') + '</span>';
    }
    if (p.setup === 'zoom') {
      const f = S.tank.flux, n = Math.max(1, f.alive), I = levelInfo(S, p.level);
      return E.v('O₂') + E.sub('level') + ' ' + E.op('=') + ' ' + E.v('O₂') + E.sub('fish') + ' ' + E.op('×') + ' ' + E.v('share') + ' ' + E.op('=') + ' ' +
        E.n(f.Rf / n, 'mg/h') + ' ' + E.op('×') + ' ' + E.n(I.o2 / (f.Rf / n), '') + ' ' + E.op('=') + ' ' + E.n(I.o2, 'mg/h');
    }
    return o2Equation(S);
  }

  /* ---------------- the problems read the apparatus by running it ---------------- */
  function runTank(p, hours) {
    const S = { p: Object.assign({}, p), seed: 1 };
    const cfg = tankCfg(S.p);
    let v = MODEL.vessel(cfg);
    if (p.media !== 'new') {
      v = MODEL.vessel(tankCfg(Object.assign({}, p, { media: 'mature', lamp: true, filter: true, pump: true, heater: true })));
      for (let k = 0; k < 72; k++) MODEL.advance(v, 1, p.start - 72 + k, 0.1);
      v.cfg = cfg; v.y[V1] = MEDIA[p.media] * (p.media === 'mature' ? v.y[V1] / 6 : 1); v.y[V2] = MEDIA[p.media] * (p.media === 'mature' ? v.y[V2] / 6 : 1);
      v.y[NF] = p.fish;
    }
    for (let k = 0; k < hours * 4; k++) MODEL.advance(v, 0.25, p.start + k * 0.25, 0.05);
    return v;
  }
  function hoursUntil(p, test, maxH) {
    const v = runTank(p, 0);
    for (let k = 1; k <= maxH * 2; k++) { MODEL.advance(v, 0.5, p.start + (k - 1) * 0.5, 0.05); if (test(v)) return k * 0.5; }
    return maxH;
  }
  /* the problem reads the same blind runs the background curve is made of */
  function blindOrder(p, noise, stems) {
    const q = Object.assign({}, p, { leader: false });
    return ORDER_SEEDS.reduce((a, sd) => a + orderRun(q, noise, sd, stems), 0) / ORDER_SEEDS.length;
  }
})(window.InsightLab);
