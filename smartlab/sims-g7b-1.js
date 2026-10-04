/* ============================================================
   GRADE 7 · UNIT B · CHEMICAL REACTIONS AND CONSERVATION OF MATTER
   7B-1  The Change Detective — Physical Change, Chemical Change and the
         Evidence for a Reaction
   (B1 Physical versus chemical change: B1.1–B1.5;
    B2 Evidence that a reaction happened: B2.1–B2.5)

   Seven benches, one chemistry and one set of instruments:
     physical   — ice and wax melt, salt and sugar dissolve, water boils:
                  an enthalpy model on a hot plate, dissolution against
                  solubility; then reverse it and get the same substance back
                  (same melting point, same density).
     chemical   — eight reactions in a conical flask, a gas syringe and a probe:
                  each integrated from its rate law and its ΔH (Hess, from
                  NIST/CRC enthalpies of formation), the gas pushing the
                  plunger out at 24.05 L/mol; on the particle card the atoms
                  themselves change partners — and are all still there.
     signs      — the same reactions against what an instrument can detect:
                  bubbles, a temperature change bigger than the thermometer's
                  resolution, a colour change, a precipitate hiding a cross,
                  light. Make it dilute and a real reaction shows nothing.
     confusing  — five look-alike pairs side by side (bubbles, cold, green,
                  cloudy, glowing); one is physical, one chemical, and only the
                  right test tells them apart.
     properties — iron and sulfur: a mixture at any ratio, a compound at one
                  (1.742 g of iron per gram of sulfur); magnet, density,
                  colour and acid before and after. Also Mg → MgO, Cu → CuO,
                  sugar → carbon.
     reversible — hydrated copper sulfate (and cobalt chloride, ammonium
                  chloride, wax, egg white, sugar) heated, then cooled or wetted:
                  a chemical change that goes back, physical ones that do, and
                  chemical ones that never will.
     unknown    — six mystery reactions: test the gas, measure the solid,
                  match it in a property table — then name the reaction.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G7B, MEAS, BENCH, R3, RX and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, Camera } = L;
  const kit = () => window.KITMS, G = () => window.G7B, ME = () => window.MEAS;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const R = 8.314, FAR = 96485, TROOM = 20;
  const VM = R * 293.15 / 101325 * 1000;            // molar volume of a gas at 20 °C, 1 atm: 24.05 L/mol
  const CW = 4.18;                                  // J/(g·K), water and dilute solutions
  const C_FLASK = 92;                               // a 250 mL conical flask: ~110 g of borosilicate glass × 0.84 J/(g·K)
  const lossH = mL => 0.011 * Math.pow(Math.max(1, mL), 2 / 3);   // W/K to the room (a 250 mL beaker loses ~1 °C a minute at 60 °C)
  const arr = (Ea, Tc) => Math.exp(-Ea / R * (1 / (Tc + 273.15) - 1 / 293.15));
  const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mixHex = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * clamp(t, 0, 1))); };
  const dE = (a, b) => { const A = hexToRgb(a), B = hexToRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

  /* ============================================================
     1. SUBSTANCES — the property table (CRC Handbook values, 20 °C)
     rho g/cm³ · mp °C (dec = decomposes there) · sol g per 100 g water · cond (solid) · mag
     ============================================================ */
  const SUB = {
    water: { name: 'water', f: 'H₂O', M: 18.015, col: '#DDEFF8', rho: 0.998, mp: 0, bp: 100, sol: null, cond: 'no', mag: false },
    ice: { name: 'ice', f: 'H₂O', M: 18.015, col: '#EAF5FB', rho: 0.917, mp: 0, sol: null, cond: 'no', mag: false },
    wax: { name: 'paraffin wax', f: 'C₂₅H₅₂', M: 352.7, col: '#F1ECD8', rho: 0.90, mp: 58, sol: 0, cond: 'no', mag: false },
    nacl: { name: 'sodium chloride', f: 'NaCl', M: 58.44, col: '#FBFBFB', rho: 2.165, mp: 801, sol: 36.0, cond: 'no', mag: false },
    sucrose: { name: 'sucrose (sugar)', f: 'C₁₂H₂₂O₁₁', M: 342.30, col: '#FAF8F2', rho: 1.587, mp: 186, dec: true, sol: 203.9, cond: 'no', mag: false },
    mg: { name: 'magnesium', f: 'Mg', M: 24.305, col: '#C7CDD4', rho: 1.738, mp: 650, sol: 0, cond: 'yes', mag: false },
    mgcl2: { name: 'magnesium chloride', f: 'MgCl₂', M: 95.21, col: '#F6F6F4', rho: 2.32, mp: 714, sol: 54.3, cond: 'no', mag: false },
    nahco3: { name: 'sodium hydrogen carbonate', f: 'NaHCO₃', M: 84.007, col: '#F7F7F4', rho: 2.20, mp: 50, dec: true, sol: 9.6, cond: 'no', mag: false },
    naac: { name: 'sodium acetate', f: 'CH₃COONa', M: 82.03, col: '#F5F5F2', rho: 1.528, mp: 324, sol: 123.3, cond: 'no', mag: false },
    fe: { name: 'iron', f: 'Fe', M: 55.845, col: '#7E848C', rho: 7.874, mp: 1538, sol: 0, cond: 'yes', mag: true },
    cu: { name: 'copper', f: 'Cu', M: 63.546, col: '#B8653A', rho: 8.96, mp: 1085, sol: 0, cond: 'yes', mag: false },
    feso4: { name: 'iron(II) sulfate', f: 'FeSO₄·7H₂O', M: 278.01, col: '#B9DDA8', rho: 1.895, mp: 64, sol: 25.6, cond: 'no', mag: false },
    cuso4: { name: 'copper(II) sulfate', f: 'CuSO₄·5H₂O', M: 249.69, col: '#2F7FD9', rho: 2.286, mp: 110, dec: true, sol: 32.0, cond: 'no', mag: false },
    caco3: { name: 'calcium carbonate', f: 'CaCO₃', M: 100.09, col: '#F4F3EE', rho: 2.71, mp: 825, dec: true, sol: 0.0013, cond: 'no', mag: false },
    cacl2: { name: 'calcium chloride', f: 'CaCl₂', M: 110.98, col: '#F6F6F3', rho: 2.15, mp: 772, sol: 74.5, cond: 'no', mag: false },
    mno2: { name: 'manganese(IV) oxide', f: 'MnO₂', M: 86.94, col: '#26221F', rho: 5.03, mp: 535, dec: true, sol: 0, cond: 'weak', mag: false },
    mgo: { name: 'magnesium oxide', f: 'MgO', M: 40.30, col: '#F7F7F5', rho: 3.58, mp: 2852, sol: 0.0086, cond: 'no', mag: false },
    s: { name: 'sulfur', f: 'S', M: 32.06, col: '#E9CF3A', rho: 2.07, mp: 115.2, sol: 0, cond: 'no', mag: false },
    fes: { name: 'iron(II) sulfide', f: 'FeS', M: 87.91, col: '#2B2A2C', rho: 4.84, mp: 1194, sol: 0, cond: 'weak', mag: false },
    cuo: { name: 'copper(II) oxide', f: 'CuO', M: 79.55, col: '#1F1C1B', rho: 6.31, mp: 1326, sol: 0, cond: 'no', mag: false },
    carbon: { name: 'carbon (char)', f: 'C', M: 12.011, col: '#151414', rho: 1.5, mp: 3640, dec: true, sol: 0, cond: 'weak', mag: false },
    nh4no3: { name: 'ammonium nitrate', f: 'NH₄NO₃', M: 80.04, col: '#F8F8F6', rho: 1.725, mp: 169.6, sol: 192, cond: 'no', mag: false },
    nh4cl: { name: 'ammonium chloride', f: 'NH₄Cl', M: 53.49, col: '#F8F8F8', rho: 1.527, mp: 338, dec: true, sol: 37.2, cond: 'no', mag: false },
    nichrome: { name: 'nichrome', f: 'Ni–Cr', M: 57, col: '#9DA3AA', rho: 8.4, mp: 1400, sol: 0, cond: 'yes', mag: false }
  };
  const GAS = {
    H2: { name: 'hydrogen', f: 'H₂', M: 2.016, sat: 0.00080, lit: 'pop', glow: 'out', lime: false, litmus: 'none' },
    O2: { name: 'oxygen', f: 'O₂', M: 31.998, sat: 0.00138, lit: 'brighter', glow: 'relights', lime: false, litmus: 'none' },
    CO2: { name: 'carbon dioxide', f: 'CO₂', M: 44.009, sat: 0.0390, lit: 'out', glow: 'out', lime: true, litmus: 'red' },
    N2: { name: 'nitrogen', f: 'N₂', M: 28.014, sat: 0.00068, lit: 'out', glow: 'out', lime: false, litmus: 'none' },
    H2S: { name: 'hydrogen sulfide', f: 'H₂S', M: 34.08, sat: 0.1, lit: 'burns blue', glow: 'out', lime: false, litmus: 'red' }
  };
  const gasMassPer100 = k => 0.1 / VM * GAS[k].M;  // g in 100 mL at 20 °C

  /* ============================================================
     2. THE REACTIONS — stoichiometry, ΔH from enthalpies of formation,
     and rate laws tuned to what a class sees (Mg ribbon gone in about a
     minute in 1 M acid, baking soda's fizz over in seconds, iron and copper
     sulfate a few minutes, a precipitate at once).
       ΔfH (kJ/mol, aq ions): Mg²⁺ −466.85; Cu²⁺ +64.77; Fe²⁺ −89.1; Ca²⁺ −542.83;
       CO₃²⁻ −677.14; CaCO₃(calcite) −1207.6; NaHCO₃(s) −950.81; CH₃COOH(aq) −485.76;
       CH₃COO⁻ −486.01; H₂O(l) −285.83; CO₂(g) −393.51; H₂O₂(aq) −191.17; OH⁻ −229.99;
       MgO(s) −601.6.
     ============================================================ */
  const RXN = {
    mg: { name: 'Magnesium ribbon in hydrochloric acid', word: 'magnesium + hydrochloric acid → magnesium chloride + hydrogen', sym: 'Mg + 2HCl → MgCl₂ + H₂',
      type: 'displacement: the metal pushes hydrogen out of the acid', solid: 'mg', sol: 'hydrochloric acid', solF: 'HCl', nuA: 2, dH: -466.85, gas: 'H2', nuG: 1,
      products: ['mgcl2', 'H2'], k: 1.19e-5, Ea: 35000, law: 'ribbon', tint: '#E7F2F9' },
    soda: { name: 'Baking soda in vinegar', word: 'sodium hydrogen carbonate + ethanoic acid → sodium ethanoate + water + carbon dioxide', sym: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂',
      type: 'acid + carbonate: a salt, water and carbon dioxide', solid: 'nahco3', sol: 'vinegar (ethanoic acid)', solF: 'CH₃COOH', nuA: 1, dH: 31.1, gas: 'CO2', nuG: 1,
      products: ['naac', 'CO2'], k: 0.2, Ea: 30000, law: 'powder', tint: '#F1EEDF' },
    marble: { name: 'Marble chips in hydrochloric acid', word: 'calcium carbonate + hydrochloric acid → calcium chloride + water + carbon dioxide', sym: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',
      type: 'acid + carbonate: a salt, water and carbon dioxide', solid: 'caco3', sol: 'hydrochloric acid', solF: 'HCl', nuA: 2, dH: -14.6, gas: 'CO2', nuG: 1,
      products: ['cacl2', 'CO2'], k: 2.25e-5, Ea: 40000, law: 'chips', tint: '#E7F2F9' },
    cu: { name: 'Iron powder in copper sulfate solution', word: 'iron + copper sulfate → iron sulfate + copper', sym: 'Fe + CuSO₄ → FeSO₄ + Cu',
      type: 'displacement: the more reactive metal takes the less reactive one’s place', solid: 'fe', sol: 'copper(II) sulfate solution', solF: 'CuSO₄', nuA: 1, dH: -153.9, gas: null,
      products: ['cu', 'feso4'], k: 1.0e-3, Ea: 40000, law: 'powder2', tint: '#2F7FD9' },
    ppt: { name: 'Calcium chloride and sodium carbonate solutions', word: 'calcium chloride + sodium carbonate → calcium carbonate + sodium chloride', sym: 'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl',
      type: 'precipitation: two solutions swap partners and an insoluble solid forms', solid: null, sol: 'calcium chloride solution', solF: 'CaCl₂', sol2: 'sodium carbonate solution', sol2F: 'Na₂CO₃', nuA: 1, dH: 12.4, gas: null,
      products: ['caco3', 'nacl'], k: 50, Ksp: 3.36e-9, law: 'ionic', tint: '#E9F2F7' },
    perox: { name: 'Hydrogen peroxide with manganese(IV) oxide', word: 'hydrogen peroxide → water + oxygen (manganese oxide is a catalyst)', sym: '2H₂O₂ → 2H₂O + O₂',
      type: 'decomposition: one substance breaks into simpler ones', solid: 'mno2', sol: 'hydrogen peroxide solution', solF: 'H₂O₂', nuA: 1, dH: -94.7, gas: 'O2', nuG: 0.5,
      products: ['water', 'O2'], k: 0.069, k0: 2e-7, Ea: 58000, law: 'catalyst', tint: '#E9F2F7' },
    neut: { name: 'Hydrochloric acid and sodium hydroxide', word: 'hydrochloric acid + sodium hydroxide → sodium chloride + water', sym: 'HCl + NaOH → NaCl + H₂O',
      type: 'neutralisation: an acid and an alkali cancel', solid: null, sol: 'hydrochloric acid', solF: 'HCl', sol2: 'sodium hydroxide solution', sol2F: 'NaOH', nuA: 1, dH: -55.84, gas: null,
      products: ['nacl', 'water'], k: 50, law: 'ionic', tint: '#E9F2F7' },
    burn: { name: 'Burning magnesium ribbon in air', word: 'magnesium + oxygen → magnesium oxide', sym: '2Mg + O₂ → 2MgO',
      type: 'combustion, and synthesis: two elements become one compound', solid: 'mg', sol: null, dH: -601.6, gas: null, products: ['mgo'], law: 'burn', tint: '#E9F2F7' },
    elec: { name: 'Splitting water with electricity (Hofmann voltameter)', word: 'water → hydrogen + oxygen', sym: '2H₂O → 2H₂ + O₂',
      type: 'decomposition by electricity (electrolysis)', solid: null, sol: 'water with a little sodium sulfate', dH: 285.83, gas: 'H2', nuG: 1, products: ['H2', 'O2'], law: 'elec', tint: '#E3EEF6' }
  };
  const RXN_KEYS = Object.keys(RXN);
  const SOLID_KEY = { mg: 'mMg', soda: 'mSoda', marble: 'mChips', cu: 'mFe', perox: 'mCat', burn: 'mMg' };
  const MG_G_PER_CM = 0.0104;                       // 3 mm × 0.2 mm ribbon, ρ 1.738 g/cm³

  /* universal indicator colours, pH 0..14 */
  const UI = ['#C81E2A', '#E0332B', '#EE5A2A', '#F5862C', '#F6B22F', '#EBD537', '#B9D33A', '#5FBF45', '#2EA06A', '#2C8FA6', '#2D64C2', '#3346B8', '#4B35A8', '#5C2A98', '#5E2390'];
  const uiCol = pH => { const x = clamp(pH, 0, 14), i = Math.min(13, Math.floor(x)); return mixHex(UI[i], UI[i + 1], x - i); };

  /* the liquid's colour from what is dissolved in it (Beer–Lambert, ~4 cm of liquid seen through) */
  function liquidColour(st) {
    let c = '#E6F1F8';
    if (st.cCu > 0) c = mixHex(c, '#1E73D2', 1 - Math.pow(10, -12 * st.cCu * 0.35));
    if (st.cFe > 0) c = mixHex(c, '#A9D98C', 1 - Math.pow(10, -2.2 * st.cFe));
    if (st.ind) c = mixHex(c, uiCol(st.pH), 0.85);
    return c;
  }
  /* a suspended precipitate: transmission through L cm of liquid, mass extinction ~5.5 × 10³ cm²/g for ~2 µm CaCO₃ */
  const K_EXT = 5535;
  const transmit = (gPerL, Lcm) => Math.exp(-K_EXT * gPerL * 1e-3 * Lcm);

  /* ---- one reaction, integrated from its rate law; the whole run, cached ---- */
  function chemRun(p) {
    const X = RXN[p.rxn], key = 'c' + JSON.stringify([p.rxn, p.mMg, p.mSoda, p.mChips, p.mFe, p.mCat, p.conc, p.vol, p.conc2, p.vol2, p.T0, p.amps, p.ind]);
    if (chemRun.c[key]) return chemRun.c[key];
    const V1 = p.vol, two = X.law === 'ionic', V2 = two ? p.vol2 : 0, VmL = X.law === 'burn' ? 0 : X.law === 'elec' ? 300 : V1 + V2;
    const C = X.law === 'burn' ? 1 : VmL * CW + C_FLASK, h = lossH(VmL);
    const mS0 = X.solid ? p[SOLID_KEY[p.rxn]] : 0;
    let nS = X.solid && X.law !== 'catalyst' ? mS0 / SUB[X.solid].M : 0, nS0 = nS;
    let nA = X.law === 'elec' ? 1e9 : X.law === 'burn' ? 1e9 : p.conc * V1 / 1000, nB = two ? p.conc2 * V2 / 1000 : 0;
    const nA0 = nA, nB0 = nB;
    let T = p.T0, xi = 0, nd = 0, nOut = 0, nO2 = 0, nPpt = 0, nCuUsed = 0, light = 0, Q = 0, burnt = 0;
    const lim = X.law === 'catalyst' ? nA : X.law === 'ionic' ? Math.min(nA, nB) : X.law === 'burn' ? nS : X.law === 'elec' ? 1e9 : Math.min(nS, nA / X.nuA);
    const dt = 0.05, rows = [], tMax = X.law === 'elec' ? 900 : 600;
    const sat = X.gas && X.law !== 'elec' ? GAS[X.gas].sat * VmL / 1000 : 0;   // the voltameter's water is run until saturated before readings start
    let t = 0, doneAt = null, lastRec = -1;
    const rec = () => {
      const st = { cCu: X.law === 'powder2' ? Math.max(0, nA) / (VmL / 1000) : 0, cFe: X.law === 'powder2' ? nCuUsed / (VmL / 1000) : 0, ind: !!p.ind, pH: 7 };
      if (X.law === 'ionic' && p.rxn === 'neut') { const ex = (nA - nB) / (VmL / 1000); st.pH = Math.abs(ex) < 1e-7 ? 7 : ex > 0 ? -Math.log10(ex) : 14 + Math.log10(-ex); }
      if (p.rxn === 'neut' && t === 0) st.pH = -Math.log10(Math.max(1e-7, p.conc));        // before the alkali goes in: the acid alone
      if (X.sol && /acid|vinegar/.test(X.sol) && X.law !== 'ionic') { const cH = Math.max(0, nA) / (VmL / 1000); st.pH = p.rxn === 'soda' ? (cH > 1e-6 ? 2.38 - 0.5 * Math.log10(cH / 0.83) + 0 : 7) : (cH > 1e-7 ? -Math.log10(cH) : 7); if (p.rxn === 'soda' && nA < 1e-7) st.pH = 8.3; }
      const ppt = X.law === 'ionic' && p.rxn === 'ppt' ? nPpt * 100.09 / (VmL / 1000) : 0;   // g/L suspended
      const settle = doneAt != null ? Math.exp(-(t - doneAt) / 1700) : 1;                     // Stokes: 2 µm grains fall 4 cm in ~30 min
      const vol = nOut * VM * 1000 * (X.law === 'elec' ? 1 : 1);
      rows.push({ t, T, xi: lim > 0 ? xi / lim : 0, gas: vol, o2: nO2 * VM * 1000, col: liquidColour(st), pH: st.pH, cloud: 1 - transmit(ppt * settle, 4), cross: transmit(ppt * settle, 4),
        settled: ppt * (1 - settle), ppt: nPpt * 100.09, light, left: X.law === 'catalyst' ? mS0 : nS * (X.solid ? SUB[X.solid].M : 0), nA, nB, Q, burnt });
    };
    rec();
    while (t < tMax) {
      const f = arr(X.Ea || 30000, T);
      let r = 0;
      if (X.law === 'ribbon') { const A = 57.7 * mS0 * Math.pow(Math.max(0, nS / nS0), 0.5); r = X.k * f * A * Math.max(0, nA) / (VmL / 1000); }
      else if (X.law === 'chips') { const A = 2.2 * mS0 * Math.pow(Math.max(0, nS / nS0), 2 / 3); r = X.k * f * A * Math.max(0, nA) / (VmL / 1000); }
      else if (X.law === 'powder') r = X.k * f * nS * Math.max(0, nA) / (VmL / 1000);
      else if (X.law === 'powder2') r = X.k * f * Math.pow(mS0, 2 / 3) * Math.pow(Math.max(0, nS / Math.max(1e-12, nS0)), 2 / 3) * Math.max(0, nA) / (VmL / 1000);
      else if (X.law === 'catalyst') r = (X.k * p.mCat + X.k0) * f * Math.max(0, nA);
      else if (X.law === 'ionic') { const cA = nA / (VmL / 1000), cB = nB / (VmL / 1000); r = X.k * Math.max(0, cA * cB - (X.Ksp || 0)) * VmL / 1000; }
      else if (X.law === 'burn') r = nS > 0 ? MG_G_PER_CM / SUB.mg.M : 0;
      else if (X.law === 'elec') r = p.amps / (2 * FAR);
      // advance, never past what is there
      let d = r * dt;
      if (X.law === 'ribbon' || X.law === 'chips' || X.law === 'powder' || X.law === 'powder2') d = Math.min(d, nS, nA / X.nuA);
      else if (X.law === 'catalyst') d = Math.min(d, nA);
      else if (X.law === 'ionic') d = Math.min(d, nA, nB);
      else if (X.law === 'burn') d = Math.min(d, nS);
      d = Math.max(0, d);
      xi += d;
      if (X.solid && X.law !== 'catalyst') nS -= d;
      if (X.law !== 'elec' && X.law !== 'burn') nA -= d * (X.nuA || 1);
      if (X.law === 'ionic') { nB -= d; if (p.rxn === 'ppt') nPpt += d; }
      if (X.law === 'powder2') nCuUsed += d;
      if (X.law === 'elec') nOut += d;                                                 // gas forms on the electrode and rises straight into the limb
      else if (X.gas) { nd += d * X.nuG; const hold = nS > 1e-9 && X.law !== 'catalyst' ? 0.25 * sat : sat;      // gas nucleates as bubbles on the solid's surface: little stays dissolved while it is there
        const out = Math.max(0, nd - hold) * Math.min(1, 2 * dt); nd -= out; nOut += out; }
      if (X.law === 'elec') { nO2 += d * 0.5; }
      light = X.law === 'burn' && nS > 1e-9 ? 1 : 0;
      if (X.law === 'burn') burnt += d;
      // heat: the reaction's own, minus what leaks to the room
      const q = X.law === 'elec' ? p.amps * p.amps * 6 : -X.dH * 1000 * d / dt;      // electrolysis: only the cell's I²R (6 Ω) warms it
      Q += (X.law === 'elec' ? 0 : -X.dH * 1000 * d);
      if (X.law !== 'burn') T += (q - h * (T - TROOM)) * dt / C;
      t += dt;
      const fin = X.law === 'elec' ? false : (X.law === 'catalyst' ? nA < 1e-4 * nA0 + 1e-12 : lim - xi < Math.max(1e-9, 1e-4 * lim)) || r * dt < 1e-12 && t > 2;
      if (fin && doneAt == null) doneAt = t;
      if (Math.floor(t * 2) !== lastRec) { lastRec = Math.floor(t * 2); rec(); }
      if (doneAt != null && t > doneAt + Math.max(60, doneAt * 0.6) && X.law !== 'ionic') break;
      if (doneAt != null && X.law === 'ionic' && t > Math.max(120, doneAt + 120)) break;
    }
    const tEnd = rows[rows.length - 1].t;
    const Tx = rows.reduce((m, q) => Math.abs(q.T - p.T0) > Math.abs(m - p.T0) ? q.T : m, p.T0);
    const out = { rows, doneAt: doneAt == null ? tEnd : doneAt, tEnd, lim, Tx, dTx: Tx - p.T0, gasEnd: rows[rows.length - 1].gas, C, nS0, nA0, nB0, mS0, VmL,
      limiting: X.law === 'ionic' ? (nA0 < nB0 ? X.solF : nB0 < nA0 ? X.sol2F : 'neither') : X.solid && X.nuA ? (nS0 < nA0 / X.nuA ? SUB[X.solid].f : X.solF) : '' };
    chemRun.c[key] = out; const ks = Object.keys(chemRun.c); if (ks.length > 120) delete chemRun.c[ks[0]];
    return out;
  }
  chemRun.c = {};
  const rowAt = (rows, t) => { if (t <= rows[0].t) return rows[0]; for (let i = 1; i < rows.length; i++) if (rows[i].t >= t) { const a = rows[i - 1], b = rows[i], u = (t - a.t) / (b.t - a.t || 1); const o = {}; for (const k in b) o[k] = typeof b[k] === 'number' ? a[k] + (b[k] - a[k]) * u : b[k]; return o; } return rows[rows.length - 1]; };

  /* the stoichiometric end-point, with no kinetics: what the landscape plot shows */
  function yieldOf(rxn, p) {
    const X = RXN[rxn], q = Object.assign({}, p);
    if (X.law === 'ionic') { const n = Math.min(q.conc * q.vol, q.conc2 * q.vol2) / 1000; return { n, gas: 0, ppt: rxn === 'ppt' ? n * 100.09 : 0, dT: -X.dH * 1000 * n / ((q.vol + q.vol2) * CW + C_FLASK) }; }
    if (X.law === 'catalyst') { const n = q.mCat > 0 ? q.conc * q.vol / 1000 : 0; return { n, gas: Math.max(0, n * 0.5 - GAS.O2.sat * q.vol / 1000) * VM * 1000, dT: -X.dH * 1000 * n / (q.vol * CW + C_FLASK) }; }
    if (X.law === 'elec') return { n: 0, gas: 0, dT: 0 };
    const nS = q[SOLID_KEY[rxn]] / SUB[X.solid].M;
    if (X.law === 'burn') return { n: nS, gas: 0, mgo: nS * SUB.mgo.M, dT: 0 };
    const n = Math.min(nS, q.conc * q.vol / 1000 / X.nuA);
    return { n, gas: X.gas ? Math.max(0, n * X.nuG - GAS[X.gas].sat * q.vol / 1000) * VM * 1000 : 0, dT: -X.dH * 1000 * n / (q.vol * CW + C_FLASK) };
  }

  /* ---- the evidence: what an instrument (or an eye) can pick up ---- */
  const THERMO = { glass: { name: 'liquid-in-glass thermometer', res: 1 }, probe: { name: 'digital probe', res: 0.1 }, hand: { name: 'a hand on the glass', res: 3 } };
  function signsOf(p, run) {
    const X = RXN[p.rxn], R0 = run.rows[0], last = run.rows[run.rows.length - 1];
    const res = THERMO[p.thermo || 'probe'].res;
    let maxRate = 0; for (let i = 1; i < run.rows.length; i++) maxRate = Math.max(maxRate, (run.rows[i].gas - run.rows[i - 1].gas) / (run.rows[i].t - run.rows[i - 1].t || 1));
    const colourChange = dE(R0.col, last.col);
    const minCross = Math.min(...run.rows.map(q => q.cross));
    const S = [
      { k: 'gas', name: 'bubbles of gas', v: maxRate, thr: 0.02, unit: 'mL/s', seen: maxRate > 0.02 },
      { k: 'temp', name: 'a temperature change', v: Math.abs(run.dTx), thr: res, unit: '°C', seen: Math.abs(run.dTx) >= res },
      { k: 'colour', name: 'a colour change', v: colourChange, thr: 12, unit: 'ΔE', seen: colourChange > 12 },
      { k: 'ppt', name: 'a precipitate (cloudy)', v: -Math.log(Math.max(1e-9, minCross)), thr: 0.1, unit: 'OD', seen: -Math.log(Math.max(1e-9, minCross)) > 0.1 },
      { k: 'light', name: 'light and flame', v: X.law === 'burn' && run.lim > 0 ? 1 : 0, thr: 0.5, unit: '', seen: X.law === 'burn' && run.lim > 0 }
    ];
    return { list: S, n: S.filter(s => s.seen).length, maxRate };
  }

  /* ============================================================
     3. PHYSICAL CHANGES on a hot plate — the enthalpy method
     ============================================================ */
  const PHYS = {
    ice: { name: 'Ice melting', sub: 'ice', liq: 'water', cs: 2.09, cl: 4.18, mp: 0, Lf: 334, bp: 100, Lv: 2257, T0: -10 },
    wax: { name: 'Candle wax melting', sub: 'wax', liq: 'molten wax', cs: 2.14, cl: 2.9, mp: 58, Lf: 200, bp: 370, Lv: 300, T0: 20 },
    boil: { name: 'Water boiling', sub: 'water', liq: 'water', cs: 4.18, cl: 4.18, mp: -1e9, Lf: 0, bp: 100, Lv: 2257, T0: 20, startLiquid: true },
    salt: { name: 'Salt dissolving', sub: 'nacl', dissolve: true, dHs: 3.88, rho: 2.165 },
    sugar: { name: 'Sugar dissolving', sub: 'sucrose', dissolve: true, dHs: 5.4, rho: 1.587 }
  };
  const C_BEAKER = 84;                                  // a 250 mL beaker: 100 g of glass × 0.84 J/(g·K)
  const PLATE_EFF = 0.6;                                // share of the hot plate's power that reaches the beaker
  /* electrical conductivity of a NaCl solution (mS/cm), from its molar conductivity (Kohlrausch, to ~3 % up to 1 M) */
  const kappaNaCl = c => c * (126.45 - 76 * Math.sqrt(c) / (1 + Math.sqrt(c)));
  function physRun(p) {
    const key = 'p' + JSON.stringify([p.phys, p.pmass, p.pwater, p.power, p.grain, p.stir, p.undo]);
    if (physRun.c[key]) return physRun.c[key];
    const X = PHYS[p.phys], rows = [], dt = 0.1;
    let t = 0, T, rev = null;
    if (!X.dissolve) {
      const m0 = p.phys === 'boil' ? p.pwater : p.pmass, Cg = C_BEAKER;
      let m = m0, T0 = X.T0;
      const H1 = X.startLiquid ? 0 : (Cg + m * X.cs) * (X.mp - T0), Hm = X.startLiquid ? 0 : H1 + m * X.Lf;
      let H = 0, f = X.startLiquid ? 1 : 0, vap = 0;
      const Tof = () => {
        if (!X.startLiquid && H < H1) { f = 0; return T0 + H / (Cg + m * X.cs); }
        if (!X.startLiquid && H < Hm) { f = (H - H1) / (m * X.Lf); return X.mp; }
        f = 1; const base = X.startLiquid ? T0 : X.mp, Hb = X.startLiquid ? 0 : Hm;
        const Tl = base + (H - Hb) / (Cg + m * X.cl);
        return Math.min(Tl, X.bp);
      };
      T = Tof();
      let phase = 'heat', tHeatEnd = null, doneAt = null;
      const tMax = 3600;
      const target = p.phys === 'boil' ? 0.3 * m0 : null;
      while (t < tMax) {
        let qin = phase === 'heat' ? PLATE_EFF * p.power : 0;
        let bath = phase === 'reverse' ? (p.phys === 'ice' ? -12 : TROOM) : TROOM, hh = phase === 'reverse' ? (p.phys === 'ice' ? 2.5 : p.phys === 'wax' ? 0.6 : 0) : lossH(m);
        if (p.phys === 'boil' && phase === 'reverse') { hh = lossH(m); }
        let q = qin - hh * (T - bath);
        if (f >= 1 && T >= X.bp - 1e-6 && q > 0) { const dm = q * dt / X.Lv; if (p.phys === 'boil') { m -= dm; vap += dm; } q = 0; }
        H += q * dt;
        if (!X.startLiquid && H < -((Cg + m * X.cs) * (T0 - (p.phys === 'ice' ? -12 : TROOM)))) H = H;   // no lower clamp needed
        T = Tof();
        t += dt;
        if (Math.round(t * 10) % 10 === 0) rows.push({ t, T, f, m, vap, phase });
        if (phase === 'heat') {
          const done = p.phys === 'boil' ? vap >= target : f >= 1 && T >= (X.mp + 10);
          if (done) { doneAt = t; if (p.undo) { phase = 'reverse'; tHeatEnd = t; } else break; }
        } else if (phase === 'reverse') {
          const back = p.phys === 'boil' ? t > tHeatEnd + 240 : f <= 0 && T < X.mp - 3;
          if (back) { rev = t; break; }
          if (t > tHeatEnd + 2400) break;
        }
        if (t > 3000) break;
      }
      // a watch glass held in the steam collects water drops: the same substance, back
      const out = { rows, doneAt: doneAt || t, tEnd: t, rev, tHeatEnd, m0, X, vapor: vap };
      physRun.c[key] = out; return out;
    }
    // dissolving: solid into water against solubility, then (undo) evaporate the water away
    const S0 = SUB[X.sub], ms0 = p.pmass, W0 = p.pwater, solMax = S0.sol / 100;
    const area0 = (p.grain === 'powder' ? 6 / (S0.rho * 0.01) : 6 / (S0.rho * 0.05)) * ms0;    // cm²: 0.1 mm powder or 0.5 mm crystals
    const kd = (p.stir ? 3.0e-4 : 0.6e-4);                                                       // g/(cm²·s) per unit undersaturation
    let ms = ms0, W = W0, md = 0, H = 0, phase = 'dissolve', tHeat = null, rec = null, doneAt = null;
    T = TROOM;
    const C = () => W * CW + ms * 0.85 + C_BEAKER;
    while (t < 3600) {
      if (phase === 'dissolve') {
        const sat = solMax * W, under = Math.max(0, 1 - md / Math.max(1e-9, sat));
        const A = ms > 0 ? area0 * Math.pow(ms / ms0, 2 / 3) : 0;
        const dm = Math.min(ms, kd * arr(20000, T) * A * under * dt);
        ms -= dm; md += dm;
        T += (-X.dHs * 1000 * dm / S0.M - lossH(W) * (T - TROOM) * dt) / C();
        if ((ms < 1e-4 || under < 1e-3) && doneAt == null) { doneAt = t; if (p.undo) { phase = 'evap'; tHeat = t; } }
        if (doneAt != null && !p.undo && t > doneAt + 60) break;
      } else {
        const q = PLATE_EFF * p.power - lossH(W) * (T - TROOM);
        if (T < 100) T += q * dt / C(); else { const dm = Math.max(0, q) * dt / 2257; W = Math.max(0, W - dm); }
        const sat = solMax * W; if (md > sat) { ms += md - sat; md = sat; }
        if (W <= 0.02 * W0) { rec = t; break; }
      }
      t += dt;
      if (Math.round(t * 10) % 10 === 0) rows.push({ t, T, ms, md, W, phase, c: (md / S0.M) / Math.max(1e-6, W / 1000 + md / S0.rho / 1000) });
      if (t > 3500) break;
    }
    const out = { rows, doneAt: doneAt || t, tEnd: t, rev: rec, tHeatEnd: tHeat, X, ms0, W0 };
    physRun.c[key] = out; return out;
  }
  physRun.c = {};
  const condOf = (p, row) => p.phys === 'salt' ? kappaNaCl(Math.max(0, row.c)) : p.phys === 'sugar' ? 0.06 : p.phys === 'ice' || p.phys === 'boil' ? 0.05 : 0;

  /* ============================================================
     4. LOOK-ALIKE PAIRS — tube A physical, tube B chemical
     ============================================================ */
  const PAIRS = {
    bubbles: { name: 'Bubbles', A: 'Water heated to boiling', B: 'Magnesium ribbon in acid', look: 'Both tubes fill with rising bubbles.' },
    cold: { name: 'It gets cold', A: 'Ammonium nitrate dissolving', B: 'Baking soda and citric acid', look: 'Both tubes go cold to the touch.' },
    green: { name: 'It turns green', A: 'Blue dye added to yellow dye', B: 'Iron in copper sulfate', look: 'Both liquids turn green.' },
    cloudy: { name: 'It goes cloudy', A: 'Limewater warmed to 70 °C', B: 'Breath bubbled into limewater', look: 'Both clear liquids turn milky white.' },
    glow: { name: 'It glows', A: 'Nichrome wire in a flame', B: 'Magnesium ribbon in a flame', look: 'Both give off light in the flame.' }
  };
  const TESTS = { look: 'Just look', gas: 'Test the gas', cool: 'Stop heating or cool it', leftover: 'Look at what is left', mass: 'Weigh before and after' };
  /* limewater (Ca(OH)₂) solubility, g per 100 mL (CRC): it falls as it warms */
  const LIME = [[0, 0.189], [20, 0.173], [40, 0.141], [60, 0.121], [80, 0.094], [100, 0.077]];
  const limeSol = T => { for (let i = 1; i < LIME.length; i++) if (T <= LIME[i][0]) { const [a, b] = [LIME[i - 1], LIME[i]]; return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]); } return LIME[LIME.length - 1][1]; };
  function pairOf(p) {
    const k = p.pair, r = {};
    if (k === 'bubbles') {
      const mg = chemRun({ rxn: 'mg', mMg: 0.05, conc: 1, vol: 10, T0: 20 });
      r.A = { T: 100, bub: 1, gas: 'steam (water vapour)', gasTest: 'A cold watch glass held over it mists with drops of water; a lit splint is not popped', coolTest: 'The bubbles stop within a second of taking the flame away', left: 'Still water: boils at 100 °C, freezes at 0 °C', massA: 25.00, massB: 25.00 - 0.6, kind: 'physical' };
      r.B = { T: 20 + mg.dTx, bub: 1, gas: 'hydrogen', gasTest: 'A lit splint at the mouth goes out with a squeaky pop: hydrogen', coolTest: 'In an ice bath the bubbles slow but carry on, for ' + Math.round(mg.doneAt) + ' s, until the ribbon is gone', left: 'Evaporated: ' + (0.05 / 24.305 * 95.21).toFixed(3) + ' g of white crystals (MgCl₂, melts at 714 °C); the metal has gone', massB: 0.05 + 10.17, massA: 0.05 + 10.17 - 0.05 / 24.305 * 2.016, kind: 'chemical', t: mg.doneAt };
    } else if (k === 'cold') {
      const n = 5 / 80.04, dT = -25.69 * 1000 * n / (20 * CW + 17 + 5 * 1.7);          // 5 g NH₄NO₃ in 20 mL, a boiling tube
      const n2 = Math.min(2 / 84.007, 1 / 192.12 * 3), dT2 = -(+29) * 1000 * n2 / (20 * CW + 17);   // NaHCO₃ + citric acid ~ +29 kJ per mol of NaHCO₃
      r.A = { T: 20 + dT, bub: 0, gas: 'none', gasTest: 'No gas comes off', coolTest: 'It warms back to room temperature; nothing more happens', left: 'Evaporated: 5.00 g of white crystals that melt at 170 °C — ammonium nitrate, unchanged', massA: 25.0, massB: 25.0, kind: 'physical' };
      r.B = { T: 20 + dT2, bub: 1, gas: 'carbon dioxide', gasTest: 'Bubbled through limewater, it turns it milky: carbon dioxide', coolTest: 'The fizzing goes on until one reactant is used up', left: 'Evaporated: sodium citrate, a new white solid that does not fizz with acid', massA: 23.0, massB: 23.0 - n2 * 44.01, kind: 'chemical' };
    } else if (k === 'green') {
      const cu = chemRun({ rxn: 'cu', mFe: 1, conc: 0.2, vol: 20, T0: 20 });
      r.A = { T: 20, bub: 0, gas: 'none', gasTest: 'No gas', coolTest: 'Nothing changes', left: 'A drop on chromatography paper splits into a blue spot and a yellow spot: the two dyes, unchanged', massA: 20, massB: 20, kind: 'physical' };
      r.B = { T: 20 + cu.dTx, bub: 0, gas: 'none', gasTest: 'No gas', coolTest: 'Nothing changes', left: 'Red-brown copper coats the iron; the paper shows one pale green spot (iron sulfate), no blue', massA: 21, massB: 21, kind: 'chemical' };
    } else if (k === 'cloudy') {
      const ppt70 = (limeSol(20) - limeSol(70)) * 10;           // g per litre that comes out of saturated limewater at 70 °C
      const nCO2 = 0.0011, caco3 = nCO2 * 100.09 * 1000 / 20;     // ~25 mL of breath CO₂ (4 %) into 20 mL
      r.A = { T: 70, bub: 0, gas: 'none', gasTest: 'No gas', coolTest: 'Cooled back to 20 °C it clears again: the calcium hydroxide re-dissolves', left: 'Filtered hot: calcium hydroxide, the same substance that was dissolved (' + ppt70.toFixed(2) + ' g/L came out)', cloud: 1 - transmit(ppt70 / 5, 1.8), massA: 20, massB: 20, kind: 'physical' };
      r.B = { T: 20, bub: 0, gas: 'none', gasTest: 'No gas comes off', coolTest: 'Cooled, it stays milky', left: 'Filtered: a white solid that fizzes in acid — calcium carbonate, a new substance', cloud: 1 - transmit(Math.min(caco3, 1.73 / 74.09 * 100.09), 1.8), massA: 20, massB: 20 + nCO2 * 44.01, kind: 'chemical' };
    } else {
      r.A = { T: 900, bub: 0, gas: 'none', gasTest: 'Nothing to test', coolTest: 'Out of the flame it fades from orange to grey and is the same wire again', left: 'The same silvery wire: 0.500 g, still conducts', massA: 0.5, massB: 0.5, kind: 'physical' };
      r.B = { T: 3100, bub: 0, gas: 'white smoke', gasTest: 'White smoke of magnesium oxide drifts up', coolTest: 'Out of the flame it keeps burning on its own until it is all gone', left: 'A crumbly white ash that does not conduct, MgO', massA: 0.1, massB: 0.1 * SUB.mgo.M / SUB.mg.M, kind: 'chemical' };
    }
    return r;
  }
  /* does this test separate the pair? */
  function decides(pair, test) {
    const D = { bubbles: { gas: 1, cool: 1, leftover: 1, mass: 0, look: 0 }, cold: { gas: 1, cool: 0, leftover: 1, mass: 1, look: 0 }, green: { gas: 0, cool: 0, leftover: 1, mass: 0, look: 0 },
      cloudy: { gas: 0, cool: 1, leftover: 1, mass: 0, look: 0 }, glow: { gas: 1, cool: 1, leftover: 1, mass: 1, look: 0 } };
    return !!D[pair][test];
  }

  /* ============================================================
     5. PROPERTIES BEFORE AND AFTER — Fe + S and three more
     ============================================================ */
  const PMAT = {
    fes: { name: 'Iron and sulfur, heated', word: 'iron + sulfur → iron(II) sulfide', A: 'fe', B: 's', P: 'fes', ratio: SUB.fe.M / SUB.s.M, Tign: 460, dH: -100.0 },
    mgo: { name: 'Magnesium, burned in air', word: 'magnesium + oxygen → magnesium oxide', A: 'mg', P: 'mgo', gain: SUB.mgo.M / SUB.mg.M, Tign: 520, dH: -601.6 },
    cuo: { name: 'Copper powder, heated in air', word: 'copper + oxygen → copper(II) oxide', A: 'cu', P: 'cuo', gain: SUB.cuo.M / SUB.cu.M, Tign: 300, dH: -157.3 },
    sugar: { name: 'Sugar, heated strongly', word: 'sucrose → carbon + water', A: 'sucrose', P: 'carbon', gain: 12 * SUB.carbon.M / SUB.sucrose.M, Tign: 190, dH: 0 }
  };
  const FLAME = { blue: { name: 'roaring blue flame', P: 30, Tmax: 900 }, low: { name: 'small blue flame', P: 18, Tmax: 780 }, yellow: { name: 'yellow (air hole shut)', P: 12, Tmax: 620 } };
  function propRun(p) {
    const key = 'r' + JSON.stringify([p.pmat, p.mA, p.mB, p.flame]);
    if (propRun.c[key]) return propRun.c[key];
    const X = PMAT[p.pmat], Fl = FLAME[p.flame], rows = [], dt = 0.1;
    const mA = p.mA, mB = X.B ? p.mB : 0;
    const vol = mA / SUB[X.A].rho + (X.B ? mB / SUB[X.B].rho : 0), Lcm = vol / 0.55 / 2.54;   // packed powder in an 18 mm tube
    const Cloc = 3 + 0.3 * (mA + mB) / Math.max(1, Lcm);             // J/K: the glass and powder in the bottom centimetre, where the flame plays
    let T = 20, t = 0, front = 0, ign = null, xi = 0;
    const nA = mA / SUB[X.A].M, nB = X.B ? mB / SUB[X.B].M : 0;
    while (t < 400) {
      T += (Fl.P * (1 - T / (Fl.Tmax + 100)) - 0.01 * (T - 20)) * dt / Cloc;
      T = Math.min(T, Fl.Tmax);
      if (ign == null && T >= X.Tign) ign = t;
      if (ign != null) {
        const v = p.pmat === 'fes' ? 0.15 : p.pmat === 'mgo' ? 0.4 : p.pmat === 'cuo' ? 0.02 : 0.05;    // cm/s: the reaction front
        front = Math.min(Lcm, front + v * dt);
        xi = p.pmat === 'cuo' ? Math.min(0.82, front / Lcm * 0.82) : front / Lcm;                     // copper: only the outside of each grain oxidises (~80 %)
      }
      t += dt;
      if (Math.round(t * 10) % 5 === 0) rows.push({ t, T: ign != null && front < Lcm && p.pmat !== 'cuo' && p.pmat !== 'sugar' ? Math.max(T, 820) : T, front, xi, glow: ign != null && front < Lcm ? 1 : 0 });
      if (ign != null && front >= Lcm && t > ign + 15) break;
    }
    let after = {};
    if (p.pmat === 'fes') {
      const n = Math.min(nA, nB);
      after = { P: n * SUB.fes.M, A: (nA - n) * SUB.fe.M, B: (nB - n) * SUB.s.M };
    } else {
      after = { P: mA * xi * X.gain, A: mA * (1 - xi), B: 0 };
    }
    const out = { rows, ign, Lcm, after, nA, nB, tEnd: t, X };
    propRun.c[key] = out; return out;
  }
  propRun.c = {};
  /* properties of a mixture of solids (by mass) */
  function mixProps(parts) {
    const m = parts.reduce((s, q) => s + q.m, 0) || 1e-9, V = parts.reduce((s, q) => s + q.m / SUB[q.k].rho, 0) || 1e-9;
    return { rho: m / V, magFrac: parts.filter(q => SUB[q.k].mag).reduce((s, q) => s + q.m, 0) / m, m };
  }
  const PTEST = { magnet: 'Hold a magnet over it', density: 'Measure its density', colour: 'Look at its colour', acid: 'Add dilute acid', melt: 'Heat it gently (melting point)', conduct: 'Does it conduct?' };
  function propTable(p, R) {
    const X = R.X, mA = p.mA, mB = X.B ? p.mB : 0;
    const before = mixProps([{ k: X.A, m: mA }].concat(X.B ? [{ k: X.B, m: mB }] : []));
    const parts = [{ k: X.P, m: R.after.P }, { k: X.A, m: R.after.A }].concat(X.B ? [{ k: X.B, m: R.after.B }] : []).filter(q => q.m > 1e-6);
    const after = mixProps(parts);
    const acidB = p.pmat === 'fes' ? 'iron fizzes: hydrogen (no smell)' : p.pmat === 'mgo' ? 'fizzes fast: hydrogen' : p.pmat === 'cuo' ? 'no reaction' : 'dissolves, no gas';
    const acidA = p.pmat === 'fes' ? (R.after.P > 0 ? 'rotten-egg gas, H₂S' + (R.after.A > 1e-3 ? ' + hydrogen from left-over iron' : '') : acidB) : p.pmat === 'mgo' ? (R.after.A > 1e-3 ? 'a little fizz from unburnt metal' : 'dissolves, no gas') : p.pmat === 'cuo' ? 'black solid dissolves: a blue solution' : 'nothing happens to the black solid';
    const mpB = X.B ? SUB.s.mp + ' (the sulfur melts out)' : SUB[X.A].mp + (SUB[X.A].dec ? ' (decomposes)' : '');
    const mpA = SUB[X.P].mp + (SUB[X.P].dec ? ' (decomposes)' : '');
    return {
      before, after,
      rows: [
        ['magnet', before.magFrac > 0 ? (100 * before.magFrac).toFixed(0) + ' % pulled out' : 'nothing pulled out', after.magFrac > 0.001 ? (100 * after.magFrac).toFixed(0) + ' % pulled out' : 'nothing pulled out'],
        ['density', before.rho.toFixed(2) + ' g/cm³', after.rho.toFixed(2) + ' g/cm³'],
        ['colour', X.B ? 'grey and yellow specks' : SUB[X.A].name === 'magnesium' ? 'shiny silver' : SUB[X.A].name === 'copper' ? 'salmon-pink' : 'white crystals', SUB[X.P].name === 'iron(II) sulfide' ? 'black, all one solid' : SUB[X.P].col === '#F7F7F5' ? 'white powder' : 'black'],
        ['acid', acidB, acidA],
        ['melts at', mpB + ' °C', mpA + ' °C'],
        ['conducts', X.B ? 'barely (grains apart)' : SUB[X.A].cond, SUB[X.P].cond]
      ]
    };
  }

  /* ============================================================
     6. REVERSIBLE? — heat it, then cool it or wet it again
     ============================================================ */
  const RSAMP = {
    cuso4: { name: 'Blue copper sulfate crystals', from: 'CuSO₄·5H₂O', M: 249.69, steps: [{ lose: 2, T: 92 }, { lose: 2, T: 115 }, { lose: 1, T: 230 }], waterM: 18.015, dHre: -79.1, cols: ['#2F7FD9', '#6FA6E3', '#C9D9EA', '#E9ECEC'], kind: 'chemical', reverses: true, by: 'water' },
    cocl2: { name: 'Pink cobalt chloride', from: 'CoCl₂·6H₂O', M: 237.93, steps: [{ lose: 4, T: 55 }, { lose: 2, T: 120 }], waterM: 18.015, dHre: -87.9, cols: ['#E58AA8', '#9B5BB8', '#3A56C8'], kind: 'chemical', reverses: true, by: 'water' },
    nh4cl: { name: 'Ammonium chloride', from: 'NH₄Cl', M: 53.49, Tdec: 300, kind: 'chemical', reverses: true, by: 'cooling', cols: ['#F5F5F5'] },
    wax: { name: 'Candle wax', from: 'paraffin', mp: 58, kind: 'physical', reverses: true, by: 'cooling', cols: ['#EFE8D2'] },
    egg: { name: 'Egg white', from: 'albumen protein', Tden: 72, kind: 'chemical', reverses: false, by: 'cooling', cols: ['#F2EFD8'] },
    sugar: { name: 'Sugar', from: 'C₁₂H₂₂O₁₁', Tdec: 190, kind: 'chemical', reverses: false, by: 'water', cols: ['#FAF8F2', '#C88A2E', '#2A1A10'] }
  };
  function revRun(p) {
    const key = 'v' + JSON.stringify([p.rsamp, p.rmass, p.rtemp, p.rtime, p.back]);
    if (revRun.c[key]) return revRun.c[key];
    const X = RSAMP[p.rsamp], rows = [], dt = 0.1, m0 = p.rmass;
    let T = 20, t = 0, x = 0, water = 0, ring = 0, mass = m0, den = 0, wet = null, Tpeak = 20, added = 0, Twet = null;
    const nTot = X.steps ? X.steps.reduce((s, q) => s + q.lose, 0) : 0;
    const prog = X.steps ? X.steps.map(() => 0) : [];
    const Ctube = 17 + 0.9 * m0;
    const tAdd = p.rtime + 150;                                       // wet it once it has cooled near room temperature
    while (t < p.rtime + (p.back ? 260 : 40)) {
      const heating = t < p.rtime;
      const bath = p.rsamp === 'wax' || p.rsamp === 'egg';           // these go in a beaker of hot water, which cannot pass 100 °C
      const Tset = heating ? (bath ? Math.min(p.rtemp, 98) : p.rtemp) : 20;
      let q = (Tset - T) * (heating ? 0.6 : 0.25);                     // W: the flame (or the room) drives the tube toward Tset
      if (X.steps && wet == null) {
        X.steps.forEach((s, i) => {
          if (i > 0 && prog[i - 1] < 0.999) return;
          const k = 0.03 * Math.exp(-11000 * (1 / (T + 273.15) - 1 / (s.T + 273.15)));
          const d = Math.min(1 - prog[i], k * (1 - prog[i]) * dt);
          prog[i] += d;
          const dn = d * s.lose * m0 / X.M;                            // mol of water driven off
          water += dn * X.waterM; q -= (Math.abs(X.dHre) / nTot + 44) * 1000 * dn / dt;   // dehydration is endothermic: it holds the temperature back
        });
        x = X.steps.reduce((s2, st, i) => s2 + prog[i] * st.lose, 0) / nTot;
        mass = m0 - water;
      } else if (p.rsamp === 'nh4cl') {
        const k = T > X.Tdec - 60 ? 0.02 * Math.exp((T - X.Tdec) / 25) : 0;
        const d = Math.min(1 - x, k * (1 - x) * dt); x += d; ring += d * 0.93; mass = m0 * (1 - x);
      } else if (p.rsamp === 'wax') {
        x = clamp((T - (X.mp - 2)) / 4, 0, 1); mass = m0;
      } else if (p.rsamp === 'egg') {
        const k = 0.05 * Math.exp((T - X.Tden) / 4);
        den += Math.min(1 - den, k * (1 - den) * dt); x = den; mass = m0;
      } else if (p.rsamp === 'sugar') {
        const k = T > X.Tdec - 20 ? 0.01 * Math.exp((T - X.Tdec) / 30) : 0;
        const d = Math.min(1 - x, k * (1 - x) * dt); x += d; water += d * m0 * (11 * 18.015 / 342.30); mass = m0 * (1 - x * (1 - 12 * 12.011 / 342.30));
      }
      if (p.back && !heating && t >= tAdd && wet == null && X.by === 'water') {          // drops of water back on the cooled solid
        wet = t;
        if (X.steps) { const nW = x * nTot * m0 / X.M, qre = Math.abs(X.dHre) / nTot * 1000 * nW; T = Math.min(100, T + qre / (Ctube + 1.2 * CW)); X.steps.forEach((s, i) => { prog[i] = 0; }); mass = m0; x = 0; added = nW * X.waterM; }
      }
      if (p.back && !heating && X.by === 'cooling' && p.rsamp === 'wax') x = clamp((T - (X.mp - 2)) / 4, 0, 1);
      if (!heating && p.rsamp === 'egg') { /* denatured protein stays so */ }
      if (wet != null && Twet == null) Twet = T;
      T += q * dt / Ctube;
      Tpeak = Math.max(Tpeak, T);
      t += dt;
      if (Math.round(t * 10) % 5 === 0) rows.push({ t, T, x, water, mass, ring, wet: wet != null ? 1 : 0 });
    }
    const out = { rows, tEnd: t, wet, Twet, added, X, m0, waterMax: X.steps ? m0 * nTot * X.waterM / X.M : p.rsamp === 'sugar' ? m0 * 11 * 18.015 / 342.30 : 0 };
    revRun.c[key] = out; return out;
  }
  revRun.c = {};
  /* the slow-heating thermogram (mass % against temperature) — the landscape plot */
  function thermogram(k) {
    const X = RSAMP[k], pts = [];
    for (let T = 20; T <= 400; T += 2) {
      let m = 100;
      if (X.steps) { let lost = 0; X.steps.forEach(s => { lost += s.lose * (1 / (1 + Math.exp(-(T - s.T - 8) / 4))); }); m = 100 * (1 - lost * 18.015 / X.M); }
      else if (k === 'nh4cl') m = 100 / (1 + Math.exp((T - X.Tdec - 30) / 12));
      else if (k === 'sugar') m = 100 - (100 - 42.1) / (1 + Math.exp(-(T - X.Tdec - 40) / 15));
      pts.push([T, m]);
    }
    return pts;
  }

  /* ============================================================
     7. THE UNKNOWN — six mystery reactions, tested and matched
     ============================================================ */
  const MYST = {
    A: { rxn: 'mg', look: 'a grey metal strip + a colourless liquid', gas: 'H2', solid: 'mgcl2', how: 'evaporate the liquid', reacts: ['magnesium', 'hydrochloric acid'] },
    B: { rxn: 'soda', look: 'a white powder + a colourless liquid that smells sharp', gas: 'CO2', solid: 'naac', how: 'evaporate the liquid', reacts: ['sodium hydrogen carbonate', 'ethanoic acid'] },
    C: { rxn: 'perox', look: 'a black powder + a colourless liquid', gas: 'O2', solid: 'mno2', how: 'filter off the black powder', reacts: ['hydrogen peroxide'] },
    D: { rxn: 'ppt', look: 'two colourless solutions', gas: null, solid: 'caco3', how: 'filter off the white solid', reacts: ['calcium chloride', 'sodium carbonate'] },
    E: { rxn: 'cu', look: 'a grey powder + a blue solution', gas: null, solid: 'cu', how: 'filter off the solid', reacts: ['iron', 'copper sulfate'] },
    F: { rxn: 'marble', look: 'white chips + a colourless liquid', gas: 'CO2', solid: 'cacl2', how: 'evaporate the liquid', reacts: ['calcium carbonate', 'hydrochloric acid'] }
  };
  const CANDS = ['cu', 'fe', 'mgcl2', 'nacl', 'naac', 'caco3', 'cacl2', 'mno2', 'mgo', 'feso4'];
  const GTEST = { lit: 'A lit splint at the mouth', glow: 'A glowing splint inside', lime: 'Bubble it through limewater', litmus: 'Damp blue litmus paper', weigh: 'Weigh 100 mL of it' };
  const SIG = { rho: 0.08, mp: 4, sol: 0.08 };                 // a class's spread: density of a powder by displacement ±8 %, melting point ±4 °C, solubility ±8 %
  function measured(p) {
    const Mx = MYST[p.mystery], s = SUB[Mx.solid], r = rng(1000 + (p.sample | 0) * 7 + Mx.solid.length);
    const n = () => (r() + r() + r() - 1.5) * 1.4;   // ≈ a normal deviate, σ ≈ 1
    return { rho: s.rho * (1 + SIG.rho * n()), mp: s.mp + SIG.mp * n(), sol: s.sol * (1 + SIG.sol * n()), cond: s.cond, mag: s.mag, col: s.col, dec: !!s.dec };
  }
  function matchScores(p) {
    const m = measured(p), out = CANDS.map(k => {
      const c = SUB[k]; let chi = 0, used = 0;
      if (p.tDen) { chi += Math.pow((m.rho - c.rho) / (SIG.rho * c.rho), 2); used++; }
      if (p.tMelt) { chi += Math.pow((m.mp - c.mp) / SIG.mp, 2) + (m.dec !== !!c.dec ? 25 : 0); used++; }
      if (p.tSol) { const a = Math.log10(m.sol + 0.001), b = Math.log10(c.sol + 0.001); chi += Math.pow((a - b) / 0.06, 2); used++; }
      if (p.tLook) { chi += dE(m.col, c.col) > 60 ? 30 : dE(m.col, c.col) > 25 ? 6 : 0; chi += m.mag !== c.mag ? 30 : 0; chi += m.cond !== c.cond ? 20 : 0; used++; }
      return { k, chi, used };
    }).sort((a, b) => a.chi - b.chi);
    const best = out[0], next = out[1];
    const sure = best.used > 0 && next.chi - best.chi > 9;          // the runner-up is three standard deviations worse
    return { m, list: out, best: best.used ? best.k : null, sure, gap: next.chi - best.chi };
  }
  function gasResult(k, test) {
    if (!k) return 'no gas was given off';
    const g = GAS[k];
    if (test === 'lit') return g.lit === 'pop' ? 'a squeaky pop' : g.lit === 'brighter' ? 'the flame flares brighter' : 'the flame goes out';
    if (test === 'glow') return g.glow === 'relights' ? 'the splint bursts back into flame' : 'the glow dies';
    if (test === 'lime') return g.lime ? 'the limewater turns milky' : 'the limewater stays clear';
    if (test === 'litmus') return g.litmus === 'red' ? 'the blue litmus turns faintly red' : 'the litmus stays blue';
    return (gasMassPer100(k) * 1000).toFixed(1) + ' mg (air: ' + (0.1 / VM * 28.96 * 1000).toFixed(0) + ' mg)';
  }
  function gasGuess(k, test) {
    if (!k) return null;
    if (test === 'lit') return k === 'H2' ? 'H2' : k === 'O2' ? 'O2' : 'CO2 or N2';
    if (test === 'glow') return k === 'O2' ? 'O2' : 'H2, CO2 or N2';
    if (test === 'lime') return k === 'CO2' ? 'CO2' : 'H2, O2 or N2';
    if (test === 'litmus') return k === 'CO2' ? 'CO2' : 'H2, O2 or N2';
    const mg = gasMassPer100(k) * 1000; return Object.keys(GAS).filter(q => q !== 'H2S').sort((a, b) => Math.abs(gasMassPer100(a) * 1000 - mg) - Math.abs(gasMassPer100(b) * 1000 - mg))[0];
  }

  /* ============================================================
     8. THE PARTICLE CARD — atoms that keep their identity and change partners.
     Each event lists its atoms: [element, x, y, charge] before and after (in
     atom-radius units, y up negative), the bonds each way, and which atoms
     leave as gas or sit in a solid. The card plays N events as the measured
     extent of reaction passes each one.
     ============================================================ */
  const EV = {
    mg: { at: [['Mg', 0, 1.6, 0, 0, 1.6, 2], ['H', -1.7, -0.6, 1, -0.38, -2.4, 0], ['H', 1.7, -0.6, 1, 0.38, -2.4, 0], ['Cl', -2.6, 1.2, -1, -2.6, 0.9, -1], ['Cl', 2.6, 1.2, -1, 2.6, 0.9, -1]],
      bR: [], bP: [[1, 2]], gas: [1, 2], solidR: [0], solidP: [] },
    soda: { at: [['Na', -3.6, 1.6, 1, -3.2, 1.3, 1], ['C', -1.6, 0.4, 0, -0.6, -2.6, 0], ['O', -1.6, -0.9, -1, -1.75, -2.6, 0], ['O', -2.8, 1.1, 0, 0.55, -2.6, 0], ['O', -0.4, 1.1, 0, 0.4, 1.7, 0], ['H', 0.3, 1.8, 0, -0.3, 2.3, 0],
        ['C', 2.0, -0.6, 0, 2.4, -0.8, 0], ['C', 3.0, 0.5, 0, 3.3, 0.4, 0], ['O', 4.2, 0.2, 0, 4.5, 0.1, 0], ['O', 2.8, 1.7, 0, 3.1, 1.6, -1], ['H', 3.5, 2.3, 0, 1.1, 2.3, 0], ['H', 1.6, -1.6, 0, 2.0, -1.8, 0], ['H', 3.0, -1.2, 0, 3.4, -1.4, 0], ['H', 1.2, -0.1, 0, 1.5, -0.2, 0]],
      bR: [[1, 2], [1, 3], [1, 4], [4, 5], [6, 7], [6, 11], [6, 12], [6, 13], [7, 8], [7, 9], [9, 10]], bP: [[1, 2], [1, 3], [4, 5], [4, 10], [6, 7], [6, 11], [6, 12], [6, 13], [7, 8], [7, 9]], gas: [1, 2, 3], solidR: [0, 1, 2, 3, 4, 5], solidP: [] },
    marble: { at: [['Ca', -2.4, 1.5, 2, -2.4, 1.2, 2], ['C', 0.2, 1.6, 0, 0, -2.6, 0], ['O', 0.2, 0.3, -1, -1.15, -2.6, 0], ['O', 1.4, 2.3, -1, 1.15, -2.6, 0], ['O', -1.0, 2.3, 0, 0.6, 1.5, 0], ['H', -1.6, -1.2, 1, -0.1, 2.1, 0], ['H', 2.4, -0.6, 1, 1.3, 2.1, 0], ['Cl', -3.4, -0.6, -1, -3.4, -0.4, -1], ['Cl', 3.4, 0.6, -1, 3.3, 0.6, -1]],
      bR: [[1, 2], [1, 3], [1, 4]], bP: [[1, 2], [1, 3], [4, 5], [4, 6]], gas: [1, 2, 3], solidR: [0, 1, 2, 3, 4], solidP: [] },
    cu: { at: [['Fe', -2.4, 1.8, 0, -2.2, 0.4, 2], ['Cu', 0.8, -0.4, 2, -2.4, 2.4, 0], ['S', 3.0, 1.3, -2, 3.0, 1.3, -2], ['O', 3.0, 0.0, 0, 3.0, 0.0, 0], ['O', 4.3, 1.3, 0, 4.3, 1.3, 0], ['O', 1.7, 1.3, 0, 1.7, 1.3, 0], ['O', 3.0, 2.6, 0, 3.0, 2.6, 0]],
      bR: [[2, 3], [2, 4], [2, 5], [2, 6]], bP: [[2, 3], [2, 4], [2, 5], [2, 6]], gas: [], solidR: [0], solidP: [1] },
    ppt: { at: [['Ca', -2.4, -0.6, 2, -0.6, 2.4, 2], ['Cl', -3.6, 1.2, -1, -3.4, 0.0, -1], ['Cl', -1.2, 1.4, -1, -2.0, -1.2, -1], ['Na', 1.4, -1.5, 1, 2.4, -1.4, 1], ['Na', 3.8, -1.0, 1, 3.9, 0.2, 1],
        ['C', 2.6, 1.0, 0, 1.2, 2.4, 0], ['O', 2.6, -0.3, -1, 1.2, 1.1, -1], ['O', 3.75, 1.65, -1, 2.35, 3.05, -1], ['O', 1.45, 1.65, 0, 0.05, 3.05, 0]],
      bR: [[5, 6], [5, 7], [5, 8]], bP: [[5, 6], [5, 7], [5, 8]], gas: [], solidR: [], solidP: [0, 5, 6, 7, 8] },
    perox: { at: [['O', -2.2, 0.0, 0, -2.4, 1.3, 0], ['O', -1.0, 0.5, 0, -0.55, -2.4, 0], ['H', -2.8, -0.9, 0, -3.0, 0.4, 0], ['H', -0.4, 1.4, 0, -1.8, 2.2, 0], ['O', 1.2, 0.2, 0, 0.55, -2.4, 0], ['O', 2.4, 0.7, 0, 2.4, 1.3, 0], ['H', 0.6, -0.7, 0, 1.8, 2.2, 0], ['H', 3.0, 1.6, 0, 3.0, 0.4, 0]],
      bR: [[0, 1], [0, 2], [1, 3], [4, 5], [4, 6], [5, 7]], bP: [[0, 2], [0, 3], [5, 6], [5, 7], [1, 4]], gas: [1, 4], solidR: [], solidP: [] },
    neut: { at: [['H', -1.6, -0.4, 1, -0.75, 1.2, 0], ['Cl', -3.2, 1.0, -1, -3.0, 0.8, -1], ['Na', 3.0, 1.0, 1, 3.0, 0.8, 1], ['O', 1.2, -0.2, -1, 0, 0.6, 0], ['H', 1.8, -1.0, 0, 0.75, 1.2, 0]],
      bR: [[3, 4]], bP: [[3, 0], [3, 4]], gas: [], solidR: [], solidP: [] },
    burn: { at: [['Mg', -1.1, 1.6, 0, -2.0, 1.5, 2], ['Mg', 1.1, 1.6, 0, 0.8, 1.5, 2], ['O', -0.55, -1.6, 0, -0.8, 1.5, -2], ['O', 0.55, -1.6, 0, 2.0, 1.5, -2]],
      bR: [[2, 3]], bP: [], gas: [], gasR: [2, 3], solidR: [0, 1], solidP: [0, 1, 2, 3] },
    elec: { at: [['O', -1.6, 1.2, 0, 1.9, -2.0, 0], ['H', -2.3, 1.9, 0, -3.0, -2.0, 0], ['H', -0.9, 1.9, 0, -2.3, -2.0, 0], ['O', 1.6, 1.2, 0, 3.0, -2.0, 0], ['H', 0.9, 1.9, 0, -3.0, -0.8, 0], ['H', 2.3, 1.9, 0, -2.3, -0.8, 0]],
      bR: [[0, 1], [0, 2], [3, 4], [3, 5]], bP: [[1, 2], [4, 5], [0, 3]], gas: [0, 1, 2, 3, 4, 5], solidR: [], solidP: [] }
  };
  EV.mystA = EV.mg;
  /* how many of each element in one event (before and after must agree) */
  function atomCount(k) { const o = {}; EV[k].at.forEach(a => { o[a[0]] = (o[a[0]] || 0) + 1; }); return o; }
  const ease = u => u * u * (3 - 2 * u);
  function drawEvents(ctx, box, key, xi, ph, o) {
    o = o || {};
    const T = EV[key], N = o.n || 6, cols = N > 4 ? 3 : N > 1 ? 2 : 1, rows = Math.ceil(N / cols), cw = box.w / cols, ch = box.h / rows;
    const s = Math.min(cw / 8.2, ch / 6.6);
    const gl = G();
    for (let k = 0; k < N; k++) {
      const cx = box.x + (k % cols + 0.5) * cw, cy = box.y + (Math.floor(k / cols) + 0.5) * ch;
      const u = ease(clamp(xi * N - k, 0, 1)), j = (a, b) => Math.sin(ph * (2.1 + 0.37 * ((a * 7 + k * 3) % 5)) + b) * 0.12;
      const pos = T.at.map((a, i) => ({ el: a[0], x: cx + s * (a[1] + (a[4] - a[1]) * u + j(i, 1)), y: cy + s * (a[2] + (a[5] - a[2]) * u + j(i, 2)), q: u < 0.5 ? a[3] : a[6] }));
      // a hint of the surroundings: the solid's surface below, the gas leaving above
      ctx.save(); ctx.strokeStyle = 'rgba(140,160,200,.12)'; ctx.strokeRect(cx - cw / 2 + 2, cy - ch / 2 + 2, cw - 4, ch - 4); ctx.restore();
      const bonds = u < 0.5 ? T.bR : T.bP, fade = Math.abs(u - 0.5) * 2;
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * fade;
      bonds.forEach(([a, b]) => gl.bond(ctx, pos[a].x, pos[a].y, pos[b].x, pos[b].y, Math.max(1.5, s * 0.22)));
      ctx.restore();
      pos.slice().sort((a, b) => a.y - b.y).forEach(q => gl.atom(ctx, q.x, q.y, s * gl.EL[q.el].r * 0.92, q.el, q.q, { letters: s * 0.9 >= 6 }));
    }
  }
  /* the physical card: the same molecules arranged as a solid, a liquid, a gas, or dissolved */
  function drawPhysParticles(ctx, box, p, row, ph) {
    const gl = G(), r = rng(77), pts = [];
    const X = PHYS[p.phys];
    if (!X.dissolve) {
      const n = 48, f = p.phys === 'boil' ? 1 : row.f, gasF = p.phys === 'boil' ? clamp(row.vap / Math.max(1, p.pwater) * 3, 0, 0.5) : 0;
      const cols = 8, s = Math.min(box.w / (cols + 2), box.h / 9);
      for (let i = 0; i < n; i++) {
        const lat = { x: box.x + box.w / 2 + ((i % cols) - cols / 2 + 0.5 + (Math.floor(i / cols) % 2) * 0.5) * s * 1.05, y: box.y + box.h - s * (0.9 + Math.floor(i / cols) * 0.95) };
        const melted = (i / n) > 1 - f, gas = (i / n) < gasF;
        const liq = { x: box.x + s + r() * (box.w - 2 * s), y: box.y + box.h * 0.35 + r() * (box.h * 0.6 - s) };
        const gq = { x: box.x + s + r() * (box.w - 2 * s), y: box.y + s + r() * box.h * 0.25 };
        const sp = gas ? 1.5 : melted ? 0.5 : 0.08, jx = Math.sin(ph * (3 + i % 5) + i) * s * sp * 0.4, jy = Math.cos(ph * (2.6 + i % 4) + i * 1.3) * s * sp * 0.4;
        const P = gas ? gq : melted ? liq : lat;
        pts.push({ x: P.x + jx, y: P.y + jy, kind: p.phys === 'wax' ? 'wax' : 'water' });
      }
      pts.forEach(q => {
        if (q.kind === 'water') { const rr = s * 0.36; gl.atom(ctx, q.x, q.y, rr, 'O', 0, { letters: false }); gl.atom(ctx, q.x - rr * 0.8, q.y + rr * 0.55, rr * 0.55, 'H', 0, { letters: false }); gl.atom(ctx, q.x + rr * 0.8, q.y + rr * 0.55, rr * 0.55, 'H', 0, { letters: false }); }
        else { for (let k = 0; k < 4; k++) gl.atom(ctx, q.x - s * 0.36 + k * s * 0.24, q.y + (k % 2 ? -1 : 1) * s * 0.08, s * 0.16, 'C', 0, { letters: false }); }
      });
      return;
    }
    // dissolving: the crystal at the bottom, its particles spread through the water
    const tot = 40, dis = Math.round(tot * clamp(row.md / Math.max(1e-9, row.md + row.ms), 0, 1));
    const s = Math.min(box.w / 11, box.h / 8);
    for (let i = 0; i < 26; i++) { const x = box.x + box.w * 0.15 + r() * box.w * 0.7, y = box.y + box.h * 0.12 + r() * box.h * 0.8; const rr = s * 0.28; gl.atom(ctx, x, y, rr, 'O', 0, { letters: false }); gl.atom(ctx, x - rr * 0.8, y + rr * 0.55, rr * 0.55, 'H', 0, { letters: false }); gl.atom(ctx, x + rr * 0.8, y + rr * 0.55, rr * 0.55, 'H', 0, { letters: false }); }
    for (let i = 0; i < tot; i++) {
      const inLat = i >= dis, cl = i % 2;
      const x = inLat ? box.x + box.w / 2 + ((i % 8) - 3.5) * s * 0.75 : box.x + s + r() * (box.w - 2 * s) + Math.sin(ph * 2 + i) * 3;
      const y = inLat ? box.y + box.h - s * 0.6 - Math.floor((i % 40) / 8) * s * 0.72 : box.y + s + r() * (box.h - 2.5 * s) + Math.cos(ph * 1.7 + i) * 3;
      if (p.phys === 'salt') gl.atom(ctx, x, y, s * (cl ? 0.42 : 0.3), cl ? 'Cl' : 'Na', cl ? -1 : 1, { letters: false });
      else { for (let k = 0; k < 3; k++) gl.atom(ctx, x + (k - 1) * s * 0.26, y + (k % 2) * s * 0.12, s * 0.2, k === 1 ? 'O' : 'C', 0, { letters: false }); }
    }
  }

  /* ============================================================
     9. THE LAB — set-ups, parameters, the run
     ============================================================ */
  const SETUPS = [
    { value: 'physical', label: 'Physical change: same substance', teaches: ['B1.1'] },
    { value: 'chemical', label: 'Chemical change: new substances', teaches: ['B1.2', 'B2.5'] },
    { value: 'signs', label: 'The signs, and the instruments', teaches: ['B2.1'] },
    { value: 'confusing', label: 'Look-alikes side by side', teaches: ['B1.3', 'B2.4'] },
    { value: 'properties', label: 'Properties before and after', teaches: ['B1.4', 'B2.2'] },
    { value: 'reversible', label: 'Can you get it back?', teaches: ['B1.5'] },
    { value: 'unknown', label: 'Identify it, then name it', teaches: ['B2.3', 'B2.5'] }
  ];
  const is = v => S => S.p.setup === v;
  const isAny = (...v) => S => v.includes(S.p.setup);
  const LAPSE = { physical: 20, chemical: 5, signs: 5, confusing: 1, properties: 5, reversible: 20, unknown: 5 };
  const RXN_DEF = { mg: { mMg: 0.1, conc: 1, vol: 50 }, soda: { mSoda: 1, conc: 0.83, vol: 50 }, marble: { mChips: 1, conc: 1, vol: 50 }, cu: { mFe: 1, conc: 0.5, vol: 50 },
    ppt: { conc: 0.5, vol: 25, conc2: 0.5, vol2: 25 }, perox: { mCat: 0.5, conc: 0.5, vol: 15 }, neut: { conc: 1, vol: 25, conc2: 1, vol2: 25 }, burn: { mMg: 0.1 }, elec: { amps: 0.5 } };
  const BASE = {
    setup: 'chemical', lapse: 5,
    phys: 'ice', pmass: 50, pwater: 100, power: 300, grain: 'crystals', stir: true, undo: false,
    rxn: 'mg', mMg: 0.1, mSoda: 1, mChips: 1, mFe: 1, mCat: 0.5, conc: 1, vol: 50, conc2: 1, vol2: 25, T0: 20, amps: 0.5, ind: false, thermo: 'probe', zoom: 'atoms',
    pair: 'bubbles', dtest: 'look',
    pmat: 'fes', mA: 3.5, mB: 2, flame: 'blue', ptest: 'magnet',
    rsamp: 'cuso4', rmass: 2.5, rtemp: 300, rtime: 240, back: true,
    mystery: 'A', gtest: 'lit', tLook: true, tDen: false, tMelt: false, tSol: false, sample: 1
  };
  function preset(o) { return Object.assign({}, BASE, { lapse: LAPSE[o.setup || BASE.setup] }, o, { pre: 1 }); }
  /* the mystery reaction's bench amounts */
  const mystP = p => Object.assign({}, p, RXN_DEF[MYST[p.mystery].rxn], { rxn: MYST[p.mystery].rxn, T0: 20, ind: false });
  function runOf(S) {
    const p = S.p;
    if (p.setup === 'physical') return physRun(p);
    if (p.setup === 'chemical' || p.setup === 'signs') return chemRun(p);
    if (p.setup === 'unknown') return chemRun(mystP(p));
    if (p.setup === 'properties') return propRun(p);
    if (p.setup === 'reversible') return revRun(p);
    return null;
  }
  function tEndOf(S) {
    const R = runOf(S);
    if (!R) return 30;
    return R.tEnd;
  }
  function setup(S) {
    const p = S.p;
    p.sample = clamp(Math.round(p.sample || 1), 1, 9);
    if (S._su !== p.setup) { if (!p.pre) p.lapse = LAPSE[p.setup]; S._su = p.setup; }
    delete p.pre;
    S.tr = 0; S.ta = 0;
    const home = homeFor(p.setup, !!S._narrow, p.rxn);
    if (!S.cam || S.camFor !== p.setup + p.rxn) {
      S.cam = Camera({ theta: home.theta, phi: home.phi, dist: home.dist, target: home.target.slice(), fov: 0.72 });
      S.cam.minDist = home.dist * 0.4; S.cam.maxDist = home.dist * 3; S.camFor = p.setup + p.rxn; S._narrowCam = !!S._narrow;
    }
    S.tEnd = tEndOf(S);
  }
  function step(S, dt) {
    S.ta = (S.ta || 0) + dt;
    S.tr = Math.min(S.tEnd || 30, (S.tr || 0) + dt * (+S.p.lapse || 1));
  }
  /* ---------------- cameras ---------------- */
  const HOMES = {
    physical: { theta: -1.36, phi: 0.32, dist: 0.7, target: [-0.02, 0.02, 0.13] },
    chemical: { theta: -1.30, phi: 0.26, dist: 0.8, target: [-0.04, 0.04, 0.13] },
    burn: { theta: -1.30, phi: 0.30, dist: 0.6, target: [0.06, 0.04, 0.13] },
    elec: { theta: -1.32, phi: 0.18, dist: 0.85, target: [0.08, 0.04, 0.22] },
    signs: { theta: -1.30, phi: 0.30, dist: 0.8, target: [-0.04, 0.04, 0.12] },
    confusing: { theta: -1.45, phi: 0.24, dist: 0.66, target: [0.0, 0.03, 0.15] },
    properties: { theta: -1.30, phi: 0.26, dist: 0.64, target: [-0.03, 0.03, 0.14] },
    reversible: { theta: -1.40, phi: 0.25, dist: 0.68, target: [-0.05, 0.04, 0.14] },
    unknown: { theta: -1.30, phi: 0.26, dist: 0.74, target: [-0.06, 0.04, 0.13] }
  };
  const homeFor = (su, narrow, rxn) => { const h = (su === 'chemical' || su === 'signs') && (rxn === 'burn' || rxn === 'elec') ? HOMES[rxn] : HOMES[su] || HOMES.chemical; return narrow ? Object.assign({}, h, { dist: h.dist * 1.3 }) : h; };
  function placeView(S, g, fx) { const cam = S.cam; cam.setViewport(g.w, g.h); cam.offX = fx * g.w; cam.offY = 24; }

  /* ---------------- shared drawing helpers ---------------- */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans",sans-serif';
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
  const sSay = s => s < 60 ? s.toFixed(0) + ' s' : (s / 60).toFixed(1) + ' min';
  function room(F) {
    const M = ME();
    M.bench(F, -0.5, 0.62, -0.30, 0.34, { tone: '#2B2F36' });
    M.tileWall(F, -0.5, 0.62, 0.34, 0, 0.75);
  }
  function labels(F, list) { list.forEach(([at, dx, dy, text, col]) => R3.callout(F, at, dx, dy, text, col || '#DCE6F6', { size: 9.5 })); }
  function sidePanel(g, S, title, h, wideW) {
    const K = kit(), w = wideW || 300;
    return K.cardSlot(g, S, title, w, { x: g.w - w - 10, y: (S._cardY || K.HDR + 6) });
  }
  /* a titled card on the right column, stacked; returns its inner box or null (folded on a phone) */
  function card(g, S, title, h, note) {
    const K = kit(), ctx = g.ctx, w = Math.min(S._left ? 290 : 310, g.w * (S._left ? 0.34 : 0.36)), H = h;
    const r = K.cardSlot(g, S, title, w, S._left ? { x: 10, y: S._cyT } : { x: g.w - w - 10, y: S._cy });
    if (!r) return null;
    if (S._left && g.w >= K.NARROW) S._cyT = r.y + H + 8;
    ctx.textAlign = 'left';
    K.card(ctx, r.x, r.y, r.w, H);
    ctx.save(); ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
    if (note) { ctx.font = mono(9, 500); ctx.fillStyle = '#93A3C2'; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, note, r.w * 0.45), r.x + r.w - 10, r.y + 10); }
    ctx.restore();
    if (g.w >= K.NARROW && !S._left) S._cy = r.y + H + 8;
    return { x: r.x + 8, y: r.y + 26, w: r.w - 16, h: H - 32 };
  }
  function rowsIn(ctx, b, rows, cols, o) {
    o = o || {};
    const K = kit(), lh = o.lh || 14;
    ctx.save(); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    rows.forEach((row, i) => row.forEach((cell, j) => {
      const c = typeof cell === 'object' && cell ? cell : { t: String(cell) };
      const x = b.x + cols[j] * b.w, wj = ((j + 1 < cols.length ? cols[j + 1] : 1) - cols[j]) * b.w;
      ctx.font = c.bold || i === 0 && o.head ? mono(9.5, 700) : mono(9.5, 500); ctx.fillStyle = c.col || (i === 0 && o.head ? '#8FA4CE' : j === 0 ? '#DCE6F6' : '#B4C3DC');
      ctx.fillText(K.fitText(ctx, c.t, wj - 4), x, b.y + i * lh);
    }));
    ctx.restore();
  }
  function atomsCard(g, S, key, xi, title) {
    const N = g.w < kit().NARROW ? 4 : 6, b = card(g, S, title || 'Zoom in: the atoms', 236, 'xi ' + (100 * xi).toFixed(0) + ' %');
    if (!b) return;
    const ctx = g.ctx, gl = G(), cnt = atomCount(key);
    ctx.save(); ctx.fillStyle = 'rgba(10,16,30,.6)'; ctx.fillRect(b.x, b.y, b.w, b.h - 26); ctx.restore();
    drawEvents(ctx, { x: b.x, y: b.y, w: b.w, h: b.h - 28 }, key, xi, S.ta, { n: N });
    const els = Object.keys(cnt), xs = b.w / Math.max(1, els.length);
    ctx.save(); ctx.font = mono(9, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    els.forEach((e, i) => { const x = b.x + i * xs, y = b.y + b.h - 12; gl.atom(ctx, x + 7, y, 5.5, e, 0, { letters: false }); ctx.fillStyle = '#C9D6EC'; ctx.fillText(e + ' ' + cnt[e] * N + '→' + cnt[e] * N, x + 15, y); });
    ctx.restore();
  }


  /* ============================================================
     THE MAGNIFIER — a round inset beside the bench (the plate standard):
     what the particles are doing in the part of the apparatus the dashed
     leader comes from.
     ============================================================ */
  EV.lime = { at: [['Ca', -1.6, 1.2, 2, -1.6, 2.2, 2], ['O', -3.0, 0.2, -1, -2.6, -0.4, 0], ['H', -3.6, -0.5, 0, -3.3, 0.2, 0], ['O', -0.2, 0.2, -1, 0.6, 1.0, -1], ['H', 0.4, -0.5, 0, -1.9, 0.2, 0], ['C', 2.4, -1.8, 0, 0.6, 2.2, 0], ['O', 1.3, -1.8, 0, -0.5, 2.9, -1], ['O', 3.5, -1.8, 0, 1.7, 2.9, 0]],
    bR: [[1, 2], [3, 4], [5, 6], [5, 7]], bP: [[1, 2], [1, 4], [5, 3], [5, 6], [5, 7]], gas: [], solidR: [], solidP: [0, 3, 5, 6, 7] };
  const PAIR_EV = { bubbles: 'mg', cold: 'soda', green: 'cu', cloudy: 'lime', glow: 'burn' };
  function lens(g, S, title, note, src, fn) {
    const K = kit(), ctx = g.ctx, narrow = g.w < K.NARROW;
    let cx, cy, R;
    if (!narrow) { R = Math.min(g.w * 0.205, (g.h - K.HDR - 60) / 2); cx = g.w - R - 18; cy = K.HDR + 22 + R; }
    else { const r = K.cardSlot(g, S, title, 0, {}); if (!r) return null; R = Math.min((r.w - 24) / 2, 118); K.card(ctx, r.x, r.y, r.w, 2 * R + 46); cx = r.x + r.w / 2; cy = r.y + 26 + R; }
    if (src && !narrow) {                                   // the dashed leader from the source on the bench to the lens
      ctx.save(); ctx.strokeStyle = 'rgba(225,235,250,.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(src.x, src.y, 9, 0, Math.PI * 2); ctx.stroke();
      const a = Math.atan2(cy - src.y, cx - src.x); ctx.beginPath(); ctx.moveTo(src.x + Math.cos(a) * 9, src.y + Math.sin(a) * 9); ctx.lineTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R); ctx.stroke(); ctx.restore();
    }
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R); bg.addColorStop(0, '#1A2742'); bg.addColorStop(1, '#070C18');
    ctx.fillStyle = bg; ctx.fill(); ctx.clip();
    fn({ x: cx - R * 0.74, y: cy - R * 0.74, w: R * 1.48, h: R * 1.48, cx, cy, R });
    const vg = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
    ctx.save(); ctx.lineWidth = 4; const rg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rg.addColorStop(0, '#C9D2DE'); rg.addColorStop(0.5, '#5A6474'); rg.addColorStop(1, '#AEB8C6');
    ctx.strokeStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.font = mono(10, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    if (!narrow) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(title, cx, cy - R - 7); ctx.fillText(title, cx, cy - R - 7); }
    if (note) { ctx.font = mono(9, 500); ctx.fillStyle = '#A9B8D2'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(note, cx, cy + R + 7); ctx.fillText(note, cx, cy + R + 7); }
    ctx.restore();
    return { cx, cy, R };
  }
  /* the physical member of a look-alike pair, at the particle scale */
  function drawSame(ctx, b, pair, ph, u) {
    const gl = G(), r = rng(91), s = Math.min(b.w, b.h) / 9;
    const jig = (i, k) => Math.sin(ph * (2 + (i % 5) * 0.4) + i * k) * s * 0.18;
    if (pair === 'bubbles') { drawPhysParticles(ctx, b, { phys: 'boil', pwater: 100 }, { vap: 15 * u, f: 1, m: 100 }, ph); return; }
    if (pair === 'glow') {
      const amp = 0.05 + 0.3 * u;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const k = i * 6 + j; gl.atom(ctx, b.x + (i + 0.5 + (j % 2) * 0.5) * b.w / 6.5 + Math.sin(ph * 9 + k) * s * amp, b.y + (j + 0.5) * b.h / 6 + Math.cos(ph * 8 + k * 1.7) * s * amp, s * 0.42, k % 5 ? 'Zn' : 'Co', 0, { letters: false }); }
      return;
    }
    if (pair === 'green') {
      for (let i = 0; i < 18; i++) {
        const blue = i % 2, x = b.x + s + r() * (b.w - 2 * s), y = b.y + s + r() * (b.h - 2 * s), sep = (1 - u) * (blue ? -1 : 1) * b.w * 0.22;
        for (let k = 0; k < 4; k++) { const xx = x * u + (b.x + b.w / 2 + sep + (r() - 0.5) * b.w * 0.3) * (1 - u) + k * s * 0.38 + jig(i, 1), yy = y + jig(i, 2) + (k % 2) * s * 0.2; ctx.fillStyle = blue ? '#3A6FE0' : '#F2CE2E'; RXb(ctx, xx, yy, s * 0.22, blue ? '#3A6FE0' : '#F2CE2E'); }
      }
      for (let i = 0; i < 20; i++) { const x = b.x + r() * b.w, y = b.y + r() * b.h; gl.atom(ctx, x + jig(i, 3), y, s * 0.2, 'O', 0, { letters: false }); }
      return;
    }
    if (pair === 'cold') {
      for (let i = 0; i < 22; i++) {
        const inL = i / 22 > u, x = inL ? b.x + b.w / 2 + ((i % 5) - 2) * s * 0.9 : b.x + s + r() * (b.w - 2 * s), y = inL ? b.y + b.h - s - Math.floor(i / 5) * s * 0.9 : b.y + s + r() * (b.h - 2 * s);
        if (i % 2) { gl.atom(ctx, x + jig(i, 1), y + jig(i, 2), s * 0.32, 'N', 1, { letters: false }); for (let k = 0; k < 4; k++) gl.atom(ctx, x + jig(i, 1) + Math.cos(k * 1.57 + 0.6) * s * 0.34, y + jig(i, 2) + Math.sin(k * 1.57 + 0.6) * s * 0.34, s * 0.16, 'H', 0, { letters: false }); }
        else { gl.atom(ctx, x + jig(i, 1), y + jig(i, 2), s * 0.3, 'N', -1, { letters: false }); for (let k = 0; k < 3; k++) gl.atom(ctx, x + jig(i, 1) + Math.cos(k * 2.09) * s * 0.36, y + jig(i, 2) + Math.sin(k * 2.09) * s * 0.36, s * 0.2, 'O', 0, { letters: false }); }
      }
      return;
    }
    // cloudy: Ca²⁺ and OH⁻ crowd together into small grains as the water warms
    for (let i = 0; i < 30; i++) {
      const clump = i / 30 < 0.45 * u, gx = b.x + b.w * (0.3 + 0.4 * ((i * 0.37) % 1)), gy = b.y + b.h * (0.3 + 0.4 * ((i * 0.61) % 1));
      const x = clump ? gx + (i % 3) * s * 0.5 : b.x + s + r() * (b.w - 2 * s), y = clump ? gy + Math.floor((i % 6) / 3) * s * 0.5 : b.y + s + r() * (b.h - 2 * s);
      if (i % 3 === 0) gl.atom(ctx, x + jig(i, 1), y + jig(i, 2), s * 0.36, 'Ca', 2, { letters: false });
      else { gl.atom(ctx, x + jig(i, 1), y + jig(i, 2), s * 0.26, 'O', -1, { letters: false }); gl.atom(ctx, x + jig(i, 1) + s * 0.24, y + jig(i, 2) - s * 0.14, s * 0.14, 'H', 0, { letters: false }); }
    }
  }
  function RXb(ctx, x, y, r, c) { window.RX.ball(ctx, x, y, r, c, { rim: 0.45, sub: 0.25, shadow: false }); }
  /* close-up of a heated powder: grains, the reacted zone and the glowing front */
  function closePowder(ctx, b, p, R, row, ph) {
    const gl = G(), rr = rng(5), X = PMAT[p.pmat], fr = R.Lcm > 0 ? clamp(row.front / R.Lcm, 0, 1) : 0, s = b.w / 18;
    ctx.save();
    const wall = 'rgba(210,230,250,.55)';
    ctx.strokeStyle = wall; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(b.x - 10, b.y + b.h * 0.12); ctx.lineTo(b.x + b.w + 10, b.y + b.h * 0.12); ctx.moveTo(b.x - 10, b.y + b.h * 0.95); ctx.lineTo(b.x + b.w + 10, b.y + b.h * 0.95); ctx.stroke();
    const n = 150;
    for (let i = 0; i < n; i++) {
      const x = b.x + rr() * b.w, y = b.y + b.h * (0.18 + 0.74 * rr()), along = 1 - (x - b.x) / b.w;   // the flame end is on the right
      const reacted = along < fr ? false : true, done = (x - b.x) / b.w > 1 - fr;
      let col, el;
      if (p.pmat === 'fes') { const isFe = rr() < (p.mA / SUB.fe.rho) / (p.mA / SUB.fe.rho + p.mB / SUB.s.rho); col = done ? '#2B2A2C' : isFe ? '#7E848C' : '#E9CF3A'; if (done && isFe && R.after.A > 0.02 && rr() < R.after.A / (R.after.A + R.after.P)) col = '#7E848C'; }
      else if (p.pmat === 'cuo') col = done ? '#B87050' : '#C87A55';
      else if (p.pmat === 'mgo') col = done ? '#F4F4F2' : '#C7CDD4';
      else col = done ? '#1E1612' : '#FAF8F2';
      RXb(ctx, x, y, s * (0.32 + 0.25 * rr()), col);
      if (p.pmat === 'cuo' && done) { ctx.strokeStyle = '#141212'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.arc(x, y, s * 0.36, 0, Math.PI * 2); ctx.stroke(); }   // only the outside skin oxidises
      void reacted; void el;
    }
    if (row.glow) {
      const fx = b.x + b.w * (1 - fr), g2 = ctx.createLinearGradient(fx - s * 3, 0, fx + s * 3, 0);
      g2.addColorStop(0, 'rgba(255,120,30,0)'); g2.addColorStop(0.5, 'rgba(255,190,90,.75)'); g2.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g2; ctx.fillRect(fx - s * 3, b.y + b.h * 0.12, s * 6, b.h * 0.83); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.font = mono(9, 600); ctx.fillStyle = '#C9D6EC'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('glass', b.x + b.w / 2, b.y + b.h * 0.12 - 3);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(b.x + b.w * 0.1, b.y + b.h + 4, b.w * 0.25, 2); ctx.textBaseline = 'top'; ctx.fillText('1 mm', b.x + b.w * 0.225, b.y + b.h + 8);
    ctx.restore();
  }
  /* close-up of the solid in the reversible tube */
  function closeRev(ctx, b, p, row, ph) {
    const gl = G(), X = RSAMP[p.rsamp], s = Math.min(b.w, b.h) / 8.5, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const jig = (i, k) => Math.sin(ph * (2.4 + (i % 5) * 0.4) + i * k) * s * 0.06;
    if (X.steps) {
      const metal = p.rsamp === 'cuso4' ? 'Cu' : 'Co', nW = p.rsamp === 'cuso4' ? 5 : 6, kept = Math.round(nW * (1 - row.x));
      for (let c = 0; c < 4; c++) {
        const ox = cx + ((c % 2) - 0.5) * b.w * 0.5, oy = cy + (Math.floor(c / 2) - 0.5) * b.h * 0.5;
        gl.atom(ctx, ox, oy, s * 0.42, metal, 2, { letters: s * 0.42 >= 6 });
        if (p.rsamp === 'cuso4') { const sx = ox + s * 1.25, sy = oy + s * 1.0; gl.atom(ctx, sx, sy, s * 0.36, 'S', -2, { letters: false }); for (let k = 0; k < 4; k++) gl.atom(ctx, sx + Math.cos(k * 1.57 + 0.8) * s * 0.42, sy + Math.sin(k * 1.57 + 0.8) * s * 0.42, s * 0.22, 'O', 0, { letters: false }); }
        else { gl.atom(ctx, ox + s * 1.3, oy + s * 0.9, s * 0.4, 'Cl', -1, { letters: false }); gl.atom(ctx, ox - s * 1.3, oy - s * 0.9, s * 0.4, 'Cl', -1, { letters: false }); }
        for (let k = 0; k < nW; k++) {
          const there = k < kept, a = k / nW * Math.PI * 2 + 0.3, d = there ? s * 0.95 : s * (2.2 + 0.6 * ((k + c) % 3)) + (row.x * s * 2);
          const wx = ox + Math.cos(a) * d + jig(k + c * 7, 1) * (there ? 1 : 4), wy = oy + Math.sin(a) * d - (there ? 0 : s * 0.8) + jig(k + c * 7, 2) * (there ? 1 : 4);
          if (!there && row.x > 0.98 && row.wet === 0) continue;
          gl.atom(ctx, wx, wy, s * 0.26, 'O', 0, { letters: false }); gl.atom(ctx, wx - s * 0.2, wy + s * 0.15, s * 0.14, 'H', 0, { letters: false }); gl.atom(ctx, wx + s * 0.2, wy + s * 0.15, s * 0.14, 'H', 0, { letters: false });
        }
      }
      return;
    }
    if (p.rsamp === 'nh4cl') {
      for (let i = 0; i < 24; i++) {
        const gone = i / 24 < row.x, ring = i / 24 < row.ring, x = b.x + ((i % 6) + 0.5) * b.w / 6, y0 = b.y + b.h - ((Math.floor(i / 6)) + 0.6) * s;
        const y = !gone ? y0 : ring ? b.y + s * (0.6 + Math.floor(i / 6) * 0.9) : cy + jig(i, 3) * 20;
        if (gone && !ring) { gl.atom(ctx, x - s * 0.5, y, s * 0.3, 'N', 0, { letters: false }); gl.atom(ctx, x + s * 0.5, y + s * 0.3, s * 0.38, 'Cl', 0, { letters: false }); gl.atom(ctx, x + s * 0.18, y + s * 0.3, s * 0.15, 'H', 0, { letters: false }); }
        else { gl.atom(ctx, x - s * 0.3, y, s * 0.3, 'N', 1, { letters: false }); gl.atom(ctx, x + s * 0.35, y, s * 0.4, 'Cl', -1, { letters: false }); }
      }
      return;
    }
    if (p.rsamp === 'egg' || p.rsamp === 'wax') {
      const n = p.rsamp === 'egg' ? 4 : 7, rr = rng(17);
      for (let k = 0; k < n; k++) {
        const pts = [], u = row.x, oy = b.y + (k + 0.5) * b.h / n;
        for (let i = 0; i < 16; i++) {
          const t = i / 15, fold = p.rsamp === 'egg' ? [cx + Math.cos(t * 9 + k) * s * 0.9 * (1 - t * 0.3), oy + Math.sin(t * 9 + k) * s * 0.5] : [b.x + t * b.w, oy + (i % 2 ? 0.25 : -0.25) * s];
          const loose = [b.x + t * b.w + (rr() - 0.5) * s * 1.2, oy + (rr() - 0.5) * s * 2.2];
          pts.push([fold[0] + (loose[0] - fold[0]) * u + jig(i + k, 1), fold[1] + (loose[1] - fold[1]) * u + jig(i + k, 2)]);
        }
        window.RX.tube(ctx, pts, s * 0.16, p.rsamp === 'egg' ? '#E6C27A' : '#B9C1CA', {});
      }
      return;
    }
    // sugar: molecules give up their water; carbon is left
    const rr = rng(23);
    for (let i = 0; i < 14; i++) {
      const x = b.x + s + rr() * (b.w - 2 * s), y = b.y + s + rr() * (b.h - 2 * s), gone = i / 14 < row.x;
      if (!gone) { for (let k = 0; k < 6; k++) gl.atom(ctx, x + Math.cos(k * 1.05) * s * 0.4, y + Math.sin(k * 1.05) * s * 0.4, s * 0.17, k % 2 ? 'O' : 'C', 0, { letters: false }); }
      else { for (let k = 0; k < 3; k++) gl.atom(ctx, x + k * s * 0.3, y, s * 0.2, 'C', 0, { letters: false }); gl.atom(ctx, x, y - s * (1 + row.x), s * 0.2, 'O', 0, { letters: false }); gl.atom(ctx, x - s * 0.17, y - s * (1 + row.x) + s * 0.12, s * 0.11, 'H', 0, { letters: false }); gl.atom(ctx, x + s * 0.17, y - s * (1 + row.x) + s * 0.12, s * 0.11, 'H', 0, { letters: false }); }
    }
  }

  /* ---------------- the flask bench (chemical, signs, unknown) ---------------- */
  const FLASK_AT = [-0.02, 0.02, 0.008];
  function drawFlaskBench(S, g, p, X, run, row, o) {
    const ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const fa = FLASK_AT;
    M.mat(F, [fa[0], fa[1]], 0.16);
    if (o.cross) Gl.crossCard(F, [fa[0], fa[1]], 0.05);
    const prev = rowAt(run.rows, Math.max(0, S.tr - 1)), rate = Math.max(0, row.gas - prev.gas);
    const VmL = run.VmL;
    const solidC = [fa[0], fa[1], fa[2] + 0.002];
    const left = row.left, solidKey = X.solid;
    if (X.law === 'ribbon' && left > 1e-4) Gl.ribbon(F, [solidC[0] - 0.02 * left / run.mS0 * (run.mS0 / 0.1), solidC[1] - 0.005, solidC[2] + 0.002], [solidC[0] + 0.02 * left / run.mS0 * (run.mS0 / 0.1), solidC[1] + 0.006, solidC[2] + 0.003], {});
    if (X.law === 'powder' && left > 1e-3) Gl.heap(F, solidC, 0.012 * Math.cbrt(left), 0.006 * Math.cbrt(left), '#F4F3EE', {});
    if (X.law === 'chips' && left > 1e-3) Gl.lumps(F, solidC, 0.018, Math.max(1, Math.round(8 * left)), '#E9E4DA', { size: 0.008 });
    if (X.law === 'powder2') { const cu = row.xi; Gl.heap(F, solidC, 0.016 * Math.cbrt(run.mS0), 0.006 * Math.cbrt(run.mS0), RX.mix('#6E747C', '#B5623A', clamp(cu * 1.4, 0, 1)), { col2: RX.mix('#3A3D42', '#8C4428', cu) }); }
    if (X.law === 'catalyst' && p.mCat > 0) Gl.heap(F, solidC, 0.011 * Math.cbrt(p.mCat * 2), 0.004, '#2A2622', {});
    Gl.flask(F, fa, VmL, { tint: row.col, alpha: p.rxn === 'cu' || p.ind ? 0.62 : 0.3, cloud: row.cloud * 0.95, settled: row.settled > 0 ? Math.min(0.004, row.settled * 0.0002) : 0,
      bubbles: { n: clamp(rate * 10, 0, 70), ph: S.ta * 0.8, from: 0.004 }, foam: p.rxn === 'soda' ? clamp(rate / 6, 0, 1) : 0 });
    // the bung, the delivery tube to the syringe, the probe to its meter
    const neck = [fa[0], fa[1], fa[2] + 0.145];
    Gl.bung(F, add(neck, [0, 0, 0.012]), 0.0185, 0.0155, 0.026);
    const syN = [-0.07, 0.04, 0.2];
    Gl.hose(F, [add(neck, [-0.006, 0, 0.012]), add(neck, [-0.006, 0, 0.05]), [-0.05, 0.04, 0.215], [syN[0] + 0.01, syN[1], syN[2]]], { r: 0.0028, col: '#E8EEF4' });
    const st = Gl.stand(F, [-0.2, 0.19, 0], 0.3);
    Gl.clampArm(F, [st[0], st[1], 0.2], [-0.17, 0.06, 0.2]);
    const full = row.gas > 100;
    Gl.gasSyringe(F, syN, [-1, 0, 0], Math.min(100, row.gas), { gasCol: X.gas === 'O2' ? '#CFE6FF' : '#E8F4FF' });
    if (o.thermo === 'glass') window.G6C.glassThermometer(F, [fa[0] + 0.006, fa[1], fa[2] + 0.012], [0, 0, 1], row.T, { len: 0.26, lo: -10, hi: 110 });
    else if (o.thermo !== 'hand') {
      R3.cylinder(F, [fa[0] + 0.006, fa[1] - 0.002, fa[2] + 0.012], add(neck, [0.006, -0.002, 0.06]), 0.0022, '#C9D0D8', { segments: 8, shadow: false, ambient: 0.5 });
      Gl.hose(F, [add(neck, [0.006, -0.002, 0.06]), [0.0, -0.06, 0.2], [-0.16, -0.12, 0.08], [-0.19, -0.13, 0.03]], { r: 0.0022, col: '#22262E' });
      window.BENCH.meter(F, [-0.2, -0.14, 0.045], [0.2, -0.97, 0.35], 0.08, 0.042, { title: 'TEMP', value: (o.thermo === 'glass' ? Math.round(row.T) : row.T.toFixed(1)), unit: '°C', colour: '#FFB27A', depth: 0.028 });
    }
    if (o.indicator && p.ind) Gl.pipette(F, [fa[0] + 0.05, fa[1] - 0.04, 0.0], { col: '#5E7F3A' });
    Gl.reagent(F, [0.11, 0.17, 0], X.sol ? X.sol.split(' (')[0].replace(' solution', '') : 'water', X.solF || 'H₂O', { band: X.law === 'ionic' || /acid/.test(X.sol || '') ? '#B03A2E' : '#2F5FB0', hazard: /acid|hydroxide/.test(X.sol || '') ? 'IRRITANT' : '' });
    if (X.sol2) Gl.reagent(F, [0.18, 0.21, 0], X.sol2.replace(' solution', ''), X.sol2F, { band: '#2F5FB0', hazard: /hydroxide/.test(X.sol2) ? 'IRRITANT' : '' });
    F.render();
    if (SOLID_KEY[p.rxn] && !o.mystery) { const hq = cam.project(solidC); if (hq.ok) g.handle(hq.x, hq.y + 10, 12, 'amount'); }
    if (full) { const q = cam.project([-0.3, 0.04, 0.24]); if (q.ok) tagTxt(ctx, q.x, q.y - 18, 'syringe full: gas escapes', '#FF8A80'); }
    const lab = [[add(neck, [0, 0, -0.06]), -70, -20, X.sol ? (X.sol2 ? 'mixed solutions' : X.sol) : '', '#C9D6EC'], [[-0.18, 0.04, 0.19], -20, 36, 'gas syringe: ' + Math.min(100, row.gas).toFixed(1) + ' mL', '#9FD8FF']];
    if (solidKey && X.law !== 'catalyst') lab.push([solidC, -60, 30, SUB[solidKey].name + ' ' + (left > 0 ? left.toFixed(2) + ' g left' : 'all used'), '#C9D6EC']);
    if (X.law === 'catalyst') lab.push([solidC, -60, 30, 'manganese(IV) oxide ' + p.mCat.toFixed(2) + ' g (unchanged)', '#C9D6EC']);
    if (o.cross) lab.push([[fa[0] + 0.04, fa[1] - 0.04, 0.001], 40, 26, row.cross < 0.05 ? 'the cross has gone' : 'black cross: ' + (100 * row.cross).toFixed(0) + ' % visible', '#C9D6EC']);
    lab.forEach(([at, dx, dy, t, c]) => { if (!t) return; const q = cam.project(at); if (!q.ok) return; leader(ctx, q.x, q.y, dx, dy, t, c, g.w); });
  }
  function drawBurnBench(S, g, p, run, row) {
    const ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    M.mat(F, [0.02, 0.0], 0.2);
    const B = Gl.bunsen(F, [0.1, 0.06, 0], { on: true, air: 1, gas: 0.7, ph: S.ta });
    const burning = row.light > 0.5, frac = run.mS0 > 0 ? row.left / run.mS0 : 0;
    const tip = [0.1, 0.06, 0.19], L = 0.1 * clamp(frac, 0, 1) * (run.mS0 / 0.1);
    tongsArm(F, [tip[0] - 0.13, tip[1] - 0.05, tip[2] + 0.02], tip);
    if (frac > 0.002) Gl.ribbon(F, add(tip, [-0.004, 0, 0]), add(tip, [L * 0.5, 0.004, -L * 0.85]), {});
    const end = add(tip, [L * 0.5, 0.004, -L * 0.85]);
    if (burning) Gl.glare(F, end, 0.95, S.ta);
    const ash = run.mS0 * (1 - frac) * SUB.mgo.M / SUB.mg.M;
    if (ash > 0.002) Gl.heap(F, [0.1, 0.03, 0.008], 0.012 * Math.cbrt(ash / 0.1), 0.006 * Math.cbrt(ash / 0.1), '#F4F4F2', { seed: 3 });
    F.render();
    const q = cam.project([0.1, 0.03, 0.01]); if (q.ok && ash > 0.002) leader(ctx, q.x, q.y, 60, 30, 'white ash, MgO: ' + ash.toFixed(3) + ' g', '#DCE6F6', g.w);
    const qr = cam.project(tip); if (qr.ok) leader(ctx, qr.x, qr.y, -80, -30, frac > 0.002 ? 'magnesium ribbon: ' + row.left.toFixed(3) + ' g' : 'all burned', '#DCE6F6', g.w);
    if (burning) { const qe = cam.project(end); if (qe.ok) leader(ctx, qe.x, qe.y, 70, -50, 'never look straight at it: 3100 °C', '#FFD27A', g.w); }
  }
  function drawElecBench(S, g, p, run, row) {
    const ctx = g.ctx, cam = S.cam, Gl = G(), F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const H = Gl.hofmann(F, [0.0, 0.04, 0], Math.min(50, row.gas), Math.min(50, row.o2), { on: true, ph: S.ta, rate: p.amps / 0.5 });
    window.BENCH.meter(F, [0.25, -0.05, 0.06], [0.2, -0.98, 0.3], 0.09, 0.045, { title: 'CURRENT', value: p.amps.toFixed(2), unit: 'A', colour: '#7CF0B0', depth: 0.04 });
    Gl.hose(F, [[-0.05, 0.04, 0.04], [0.06, -0.06, 0.01], [0.21, -0.05, 0.03]], { r: 0.002, col: '#2A2F38' });
    Gl.hose(F, [[0.05, 0.04, 0.04], [0.14, -0.02, 0.01], [0.23, -0.04, 0.03]], { r: 0.002, col: '#C8463A' });
    F.render();
  }
  function tongsArm(F, from, to) {
    R3.tube(F, [from, add(from, [0.06, 0.02, -0.004]), to], 0.0025, '#C4CBD4', { segments: 6, round: false });
    R3.tube(F, [add(from, [0, 0.01, 0]), add(from, [0.06, 0.03, 0.006]), add(to, [0, 0.003, 0.002])], 0.0025, '#C4CBD4', { segments: 6, round: false });
  }
  function tagTxt(ctx, x, y, t, col) { G6tag(ctx, x, y, t, col); }
  function G6tag(ctx, x, y, t, col) {
    ctx.save(); ctx.font = mono(10, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(5,8,15,.88)'; ctx.lineJoin = 'round';
    ctx.strokeText(t, x, y); ctx.fillStyle = col || '#EAF1FF'; ctx.fillText(t, x, y); ctx.restore();
  }
  /* a leader from a projected point to a caption, flipped to whichever side has room */
  function leader(ctx, x, y, dx, dy, text, col, W) {
    const K = kit();
    ctx.save(); ctx.font = mono(9.5, 600);
    let left = dx < 0; const tw = ctx.measureText(text).width;
    if (left && x + dx - tw - 6 < 4) left = false; else if (!left && x + Math.abs(dx) + tw + 6 > W - 4) left = true;
    const ex = x + (left ? -Math.abs(dx) : Math.abs(dx)), ey = clamp(y + dy, 72, 9999);
    const room = left ? ex - 8 : W - ex - 8, t = K.fitText(ctx, text, Math.max(50, room));
    ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = 'rgba(220,232,250,.9)'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
    ctx.strokeText(t, ex + (left ? -3 : 3), ey); ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), ey);
    ctx.restore();
  }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const R3 = new Proxy({}, { get: (_, k) => window.R3[k] }), RX = new Proxy({}, { get: (_, k) => window.RX[k] });   // the render layers, looked up when drawing (the tests load this file without them)

  /* ============================================================
     10. THE STAGES
     ============================================================ */
  const BK_R = 0.035, BK_RIN = 0.0332, BK_AREA = Math.PI * BK_RIN * BK_RIN * 1e4;     // a 250 mL beaker: 34.6 cm² inside
  const lvlOf = cm3 => cm3 / BK_AREA / 100;
  function drawPhysical(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), K = kit(), narrow = g.w < K.NARROW;
    const R = physRun(p), row = rowAt(R.rows, S.tr), X = PHYS[p.phys], rev = row.phase === 'reverse' || row.phase === 'evap';
    placeView(S, g, narrow ? 0 : -0.225);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const at = [0, 0.04], plateOn = row.phase === 'heat' || row.phase === 'evap' || (X.dissolve && row.phase === 'dissolve');
    let base;
    if (p.phys === 'ice' && row.phase === 'reverse') {
      M.hotplate(F, [0.2, 0.08, 0], { top: 20, set: 0, on: false });
      M.iceBath(F, [at[0], at[1], 0.004], 0.075, 0.07, {});
      base = [at[0], at[1], 0.012];
    } else {
      const hot = X.dissolve ? (row.phase === 'evap' ? 1 : 0) : row.phase === 'heat' ? 1 : 0;
      const HP = M.hotplate(F, [at[0], at[1], 0], { top: hot ? clamp(row.T + 30, 20, 300) : 20 + (row.T - 20) * 0.3, set: hot ? clamp(p.power / 600, 0.1, 1) : 0, on: !!hot || (X.dissolve && p.stir), hot: hot && row.T > 50, stir: X.dissolve && p.stir ? 0.7 : 0 });
      base = [HP.centre[0], HP.centre[1], HP.topZ + 0.002];
    }
    let level = 0, tint = '#D8ECF6', cloud = 0, alpha = 0.32, bub = 0;
    if (p.phys === 'ice') {
      level = lvlOf(p.pmass * row.f);
      const n = Math.max(1, Math.round(p.pmass / 10)), s = 0.022 * Math.cbrt(Math.min(1, p.pmass / n / 10));
      for (let i = 0; i < n; i++) { const a = i * 2.4, rr = i ? 0.016 : 0; window.G6C.iceCube(F, [base[0] + rr * Math.cos(a), base[1] + rr * Math.sin(a), base[2] + Math.max(0, level - s * 0.9) * (row.f > 0.5 ? 1 : 0)], s, 1 - row.f); }
    } else if (p.phys === 'wax') {
      const vol = p.pmass / 0.9;
      if (row.phase === 'heat') { level = lvlOf(vol * row.f); if (row.f < 0.999) Gl.lumps(F, [base[0], base[1], base[2] + level], 0.018, Math.max(1, Math.round(6 * (1 - row.f) * p.pmass / 20)), '#EFE6CC', { size: 0.012 }); }
      else { level = lvlOf(vol); cloud = 1 - row.f; }
      tint = '#F3E3A6'; alpha = 0.5;
    } else if (p.phys === 'boil') {
      level = lvlOf(row.m); bub = row.T > 99 ? 40 : row.T > 85 ? 6 : 0;
    } else {
      level = lvlOf(row.W + row.md / 1.6);
      if (row.ms > 0.01) Gl.heap(F, [base[0], base[1], base[2] + 0.001], 0.012 + 0.016 * Math.cbrt(row.ms / 50), 0.004 + 0.01 * Math.cbrt(row.ms / 50), '#FBFBF8', { col2: '#D8DDE2', bias: -0.001 });
      if (p.stir && row.phase === 'dissolve') M.stirBar(F, [base[0], base[1], base[2] + 0.004], 0.025, S.ta * 9, {});
      bub = row.phase === 'evap' && row.T > 99 ? 30 : 0;
    }
    M.beaker(F, base, BK_R, 0.095, level, { T: row.T, tint, marks: { perM: BK_AREA * 100, max: 250 }, bubbles: bub ? bub / 40 : 0, boil: bub ? 0.6 : 0, phase: S.ta });
    if (cloud > 0.02) Gl.vessel(F, base, [0, 0, 1], [[0, BK_RIN - 0.0005], [level, BK_RIN - 0.0005]], { level: level - 0.0003, tint: '#EFE6CC', alpha: 0.2, cloud: cloud, cloudCol: '#EFE7CF', glassFill: 'rgba(0,0,0,0)' });
    if ((p.phys === 'boil' || row.phase === 'evap') && row.T > 95) M.steam(F, [base[0], base[1], base[2] + level], 1, S.ta, { rise: 0.18 });
    if (p.phys === 'boil' && p.undo) { const wg = [base[0] + 0.01, base[1], base[2] + 0.16]; Gl.watchGlass(F, wg, 0.045, { drops: Math.round(clamp(row.vap * 4, 0, 60)) }); tongsArm(F, [wg[0] - 0.16, wg[1] - 0.06, wg[2] + 0.01], [wg[0] - 0.045, wg[1], wg[2] + 0.005]); }
    // the probe and its meter; the conductivity cell for a solution
    R3.cylinder(F, [base[0] + 0.016, base[1] - 0.006, base[2] + 0.006], [base[0] + 0.03, base[1] - 0.02, base[2] + 0.2], 0.0022, '#C9D0D8', { segments: 8, shadow: false });
    Gl.hose(F, [[base[0] + 0.03, base[1] - 0.02, base[2] + 0.2], [-0.08, -0.08, 0.16], [-0.14, -0.12, 0.03]], { r: 0.0021, col: '#22262E' });
    window.BENCH.meter(F, [-0.15, -0.13, 0.045], [0.25, -0.97, 0.35], 0.08, 0.042, { title: 'TEMP', value: row.T.toFixed(1), unit: '°C', colour: '#FFB27A', depth: 0.028 });
    if (X.dissolve || p.phys === 'ice' || p.phys === 'boil') {
      const cond = condOf(p, row);
      R3.cylinder(F, [base[0] - 0.016, base[1] - 0.004, base[2] + 0.01], [base[0] - 0.03, base[1] - 0.02, base[2] + 0.2], 0.004, '#2A2F38', { segments: 10, shadow: false });
      Gl.hose(F, [[base[0] - 0.03, base[1] - 0.02, base[2] + 0.2], [-0.12, 0.04, 0.16], [-0.17, 0.03, 0.03]], { r: 0.0021, col: '#2A2F38' });
      window.BENCH.meter(F, [-0.18, 0.02, 0.045], [0.35, -0.94, 0.3], 0.08, 0.042, { title: 'COND', value: cond.toFixed(cond < 1 ? 2 : 1), unit: 'mS/cm', colour: '#7CF0B0', depth: 0.028 });
    }
    F.render();
    if (!(p.phys === 'ice' && row.phase === 'reverse') && (!X.dissolve || p.undo)) { const kq = cam.project([at[0] - 0.045, at[1] - 0.13, 0.04]); if (kq.ok) g.handle(kq.x, kq.y, 12, 'power'); }
    const q = cam.project([base[0] - BK_R, base[1], base[2] + Math.max(0.01, level * 0.6)]);
    const what = p.phys === 'ice' ? (row.f < 0.001 ? 'ice' : row.f > 0.999 ? 'water' : 'ice and water') : p.phys === 'wax' ? (row.f > 0.999 ? 'molten wax' : row.f < 0.001 ? 'solid wax' : 'wax, melting') : p.phys === 'boil' ? 'water, ' + row.m.toFixed(1) + ' g' : row.phase === 'evap' ? 'crystals coming back' : SUB[X.sub].name + ' solution';
    if (q.ok) leader(ctx, q.x, q.y, -70, -30, what, '#DCE6F6', g.w);
    // cards: the particles, and the substance before and after
    S._cy = K.HDR + 6; S._cyT = K.HDR + 6; S._left = true;
    const src = cam.project([base[0], base[1], base[2] + Math.max(0.01, level * 0.5)]);
    lens(g, S, 'Ten million times: the particles', X.dissolve ? 'dissolved ' + (100 * row.md / Math.max(1e-9, row.md + row.ms)).toFixed(0) + ' % · the same particles, spread out' : (p.phys === 'boil' ? 'boiling: molecules escape as gas' : 'melted ' + (100 * row.f).toFixed(0) + ' % · the same molecules, freed'), src.ok ? src : null, bx => drawPhysParticles(ctx, bx, p, row, S.ta));
    const t = physTable(p, R);
    const b2 = card(g, S, 'Same substance?', 30 + 14 * t.length + 6);
    if (b2) rowsIn(ctx, b2, t, [0, 0.36, 0.68], { head: true });
    K.header(g, X.name + ': ' + (rev ? (X.dissolve ? 'boiling the water away' : p.phys === 'ice' ? 'in an ice–salt bath at −12 °C' : 'cooling') : row.phase === 'dissolve' ? (row.ms > 0.01 ? 'dissolving' : 'all dissolved') : 'heating at ' + p.power + ' W'),
      't = ' + sSay(S.tr) + ' · ' + row.T.toFixed(1) + ' °C' + (X.dissolve ? ' · ' + row.md.toFixed(1) + ' g dissolved of ' + p.pmass + ' g' : ' · melted ' + (100 * row.f).toFixed(0) + ' %'),
      'no new substance: the particles are the same, only arranged differently');
  }
  function physTable(p, R) {
    const X = PHYS[p.phys], s = SUB[X.sub];
    const last = R.rows[R.rows.length - 1];
    if (X.dissolve) {
      const back = R.rev != null, c = last.c || 0;
      return [['', 'before', back ? 'got back' : 'in solution'], ['substance', s.f, back ? s.f : s.f + '(aq)'], ['melts at', s.mp + (s.dec ? ' dec' : '') + ' °C', back ? s.mp + (s.dec ? ' dec' : '') + ' °C' : '—'],
        ['mass', p.pmass.toFixed(1) + ' g', back ? (last.ms + last.md).toFixed(1) + ' g' : last.md.toFixed(1) + ' g + ' + last.ms.toFixed(1) + ' g'], ['conducts', '0.05 mS/cm', (p.phys === 'salt' ? kappaNaCl(c) : 0.06).toFixed(2) + ' mS/cm'], ['new atoms?', '', 'none']];
    }
    const m = p.phys === 'boil' ? p.pwater : p.pmass;
    return [['', 'before', 'after'], ['substance', s.f, s.f], ['melts at', s.mp + ' °C', s.mp + ' °C'], ['density', s.rho.toFixed(3), p.phys === 'ice' ? '0.998 (liquid)' : p.phys === 'wax' ? '0.78 (liquid)' : '0.958 at 100 °C'],
      ['mass', m.toFixed(1) + ' g', p.phys === 'boil' ? last.m.toFixed(1) + ' g + ' + last.vap.toFixed(1) + ' g steam' : m.toFixed(1) + ' g'], ['new atoms?', '', 'none']];
  }

  function drawChemical(S, g, signs) {
    const p = S.p, ctx = g.ctx, K = kit(), narrow = g.w < K.NARROW, X = RXN[p.rxn], run = chemRun(p), row = rowAt(run.rows, S.tr);
    placeView(S, g, narrow ? 0 : -0.225);
    if (X.law === 'burn') drawBurnBench(S, g, p, run, row);
    else if (X.law === 'elec') drawElecBench(S, g, p, run, row);
    else drawFlaskBench(S, g, p, X, run, row, { cross: signs || p.rxn === 'ppt', thermo: signs ? p.thermo : 'probe', indicator: true });
    S._cy = K.HDR + 6; S._cyT = K.HDR + 6; S._left = true;
    if (signs || p.zoom === 'atoms') {
      const cnt = atomCount(p.rxn), src = S.cam.project(X.law === 'burn' ? [0.1, 0.06, 0.15] : X.law === 'elec' ? [-0.05, 0.04, 0.1] : [FLASK_AT[0], FLASK_AT[1], FLASK_AT[2] + 0.02]);
      lens(g, S, signs ? 'The atoms react, seen or not' : 'Zoom in: atoms change partners', Object.keys(cnt).map(e => e + ' ' + cnt[e] * 4 + '→' + cnt[e] * 4).join(' · ') + ' · reacted ' + (100 * row.xi).toFixed(0) + ' %', src.ok ? src : null, bx => drawEvents(ctx, bx, p.rxn, row.xi, S.ta, { n: 4 }));
    }
    if (signs) {
      const sg = signsOf(p, run), b = card(g, S, 'The evidence, as measured', 30 + 16 * sg.list.length + 20, sg.n + ' of 5 signs');
      if (b) {
        ctx.save(); ctx.textBaseline = 'middle';
        sg.list.forEach((s2, i) => {
          const y = b.y + 6 + i * 16, live = s2.v * (S.tr >= run.doneAt ? 1 : clamp(S.tr / Math.max(1, run.doneAt), 0, 1));
          K.led(ctx, b.x + 6, y, s2.seen && S.tr > 0.5, s2.k === 'temp' ? '#FFB27A' : s2.k === 'gas' ? '#9FD8FF' : s2.k === 'colour' ? '#7CF0B0' : s2.k === 'ppt' ? '#F2F1EA' : '#FFF3B0');
          ctx.font = mono(9.5, 600); ctx.fillStyle = s2.seen ? '#E6EEFA' : '#7D8BA6'; ctx.textAlign = 'left'; ctx.fillText(s2.name, b.x + 16, y);
          ctx.textAlign = 'right'; ctx.fillStyle = '#9FB0CC'; ctx.fillText(s2.v.toFixed(s2.v < 10 ? 2 : 0) + ' ' + s2.unit + ' / ' + s2.thr + (s2.seen ? '  seen' : '  below'), b.x + b.w, y);
        });
        ctx.font = mono(9, 500); ctx.fillStyle = '#93A3C2'; ctx.textAlign = 'left';
        ctx.fillText(K.fitText(ctx, 'a sign counts only past what the instrument can show', b.w), b.x, b.y + 6 + sg.list.length * 16 + 4);
        ctx.restore();
      }
    }
    const b2 = card(g, S, 'Naming it', 98, X.type.split(':')[0]);
    if (b2) {
      ctx.save(); ctx.textBaseline = 'top'; ctx.fillStyle = '#E6EEFA'; ctx.font = sans(10.5, 600);
      K.wrapText(ctx, X.word, b2.x, b2.y, b2.w, 13, 2);
      ctx.font = mono(10.5, 700); ctx.fillStyle = '#FFD27A'; ctx.fillText(K.fitText(ctx, X.sym, b2.w), b2.x, b2.y + 30);
      ctx.font = mono(9, 500); ctx.fillStyle = '#9FB0CC'; K.wrapText(ctx, X.type, b2.x, b2.y + 46, b2.w, 11, 2);
      ctx.restore();
    }
    const gasTxt = X.gas ? ' · gas ' + Math.min(100, row.gas).toFixed(1) + ' mL' + (X.law === 'elec' ? ' H₂, ' + row.o2.toFixed(1) + ' mL O₂' : '') : '';
    K.header(g, X.name + (S.tr < run.doneAt ? (X.law === 'elec' ? ': current flowing' : ': reacting') : ': finished — ' + (run.limiting ? run.limiting + ' ran out' : 'done')),
      't = ' + sSay(S.tr) + (X.law === 'burn' ? '' : ' · ' + row.T.toFixed(1) + ' °C (ΔT ' + (row.T - p.T0 >= 0 ? '+' : '') + (row.T - p.T0).toFixed(2) + ')') + gasTxt + (p.rxn === 'ppt' ? ' · precipitate ' + row.ppt.toFixed(2) + ' g' : '') + (p.rxn === 'neut' || p.ind ? ' · pH ' + row.pH.toFixed(1) : ''),
      signs ? 'thermometer: ' + THERMO[p.thermo].name + ' (±' + THERMO[p.thermo].res + ' °C)' : X.sym);
  }

  /* ---------------- look-alikes: two stations, A and B ---------------- */
  function drawConfusing(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), K = kit(), narrow = g.w < K.NARROW, P = pairOf(p), Pd = PAIRS[p.pair];
    placeView(S, g, narrow ? 0 : -0.225);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const tt = clamp(S.tr / 20, 0, 1), cooled = p.dtest === 'cool' && S.tr > 8;
    const stations = [{ k: 'A', x: -0.1, d: P.A }, { k: 'B', x: 0.1, d: P.B }];
    stations.forEach(st => {
      const heated = (p.pair === 'bubbles' && st.k === 'A') || p.pair === 'glow';
      const bath = p.pair === 'cloudy' && st.k === 'A';
      let bottom = [st.x, 0.04, 0.03];
      if (p.pair === 'glow') {
        Gl.bunsen(F, [st.x, 0.06, 0], { on: !cooled, air: 1, gas: 0.7, ph: S.ta + st.x });
        const tip = [st.x, 0.06, 0.19];
        tongsArm(F, [st.x - 0.13, 0.0, 0.21], tip);
        if (st.k === 'A') { R3.tube(F, [tip, add(tip, [0.01, 0, -0.03]), add(tip, [0.0, 0, -0.05])], 0.0012, cooled ? '#9DA3AA' : '#FF8A3A', { segments: 6 }); if (!cooled) Gl.glare(F, add(tip, [0, 0, -0.04]), 0.35, S.ta); }
        else { const frac = cooled ? 0 : clamp(1 - tt, 0, 1); if (frac > 0.02) Gl.ribbon(F, tip, add(tip, [0.01, 0, -0.06 * frac]), {}); Gl.glare(F, add(tip, [0.01, 0, -0.06 * frac]), frac > 0.02 ? 0.95 : 0, S.ta); Gl.heap(F, [st.x + 0.02, 0.02, 0.0], 0.012 * Math.min(1, tt + (cooled ? 1 : 0)), 0.005, '#F4F4F2', {}); M.mat(F, [st.x + 0.02, 0.02], 0.1); }
      } else {
        if (heated && !cooled) Gl.bunsen(F, [st.x, 0.04, 0], { on: true, air: 1, gas: 0.5, ph: S.ta });
        if (heated) { const s2 = Gl.stand(F, [st.x - 0.02, 0.16, 0], 0.32); Gl.clampArm(F, [s2[0], s2[1], 0.24], [st.x, 0.04, 0.24]); bottom = [st.x, 0.04, 0.17]; }
        else if (bath) { const HP = M.hotplate(F, [st.x, 0.06, 0], { top: 90, set: 0.5, on: !cooled, hot: !cooled }); M.beaker(F, [HP.centre[0], HP.centre[1], HP.topZ + 0.002], BK_R, 0.095, 0.06, { T: cooled ? 20 : 70, tint: '#D8ECF6' }); bottom = [HP.centre[0], HP.centre[1], HP.topZ + 0.012]; }
        else if (cooled) { M.iceBath(F, [st.x, 0.04, 0.0], 0.06, 0.07, {}); bottom = [st.x, 0.04, 0.012]; }
        else Gl.rack(F, [st.x, 0.04, 0], 1, 0.03, {});
        if (!heated && !bath && !cooled) bottom = [st.x, 0.04, 0.012];
        const d = st.d, green = p.pair === 'green', cold = p.pair === 'cold';
        const tint = green ? RX.mix(st.k === 'A' ? '#3A7FD6' : '#2F7FD9', st.k === 'A' ? '#58B84A' : '#B9DDA8', tt) : cold ? '#E8F1F6' : '#DDEFF8';
        const bubN = d.bub && !(cooled && st.k === 'A' && p.pair === 'bubbles') ? (st.k === 'B' && p.pair === 'bubbles' ? 30 * clamp(1 - S.tr / Math.max(5, d.t || 60), 0, 1) : 30) * (cooled && st.k === 'B' ? 0.5 : 1) : 0;
        const cl = p.pair === 'cloudy' ? (st.k === 'A' ? (cooled ? 0 : d.cloud * tt) : d.cloud * tt) : 0;
        Gl.tube(F, bottom, [0, 0, 1], 0.15, 0.0125, { mL: 20, tint, alpha: green ? 0.6 : 0.3, bubbles: { n: bubN, ph: S.ta, from: 0.006, size: 0.0012 }, cloud: cl * 0.9, solid: green && st.k === 'B' ? { to: 0.012, col: RX.mix('#6E747C', '#B5623A', tt), seed: 4 } : cold ? { to: 0.01 * (1 - tt * 0.8), col: '#F6F6F2', seed: 3 } : p.pair === 'bubbles' && st.k === 'B' ? { to: 0.004 * (1 - tt), col: '#C7CDD4' } : null });
        if (p.dtest === 'gas') { const m = add(bottom, [0, 0, 0.16]); Gl.splint(F, add(m, [0.004, 0, 0.004]), [0.6, -0.7, 0.4], st.d.gas === 'hydrogen' ? (S.tr % 6 < 1.2 ? 'pop' : 'lit') : st.d.gas === 'carbon dioxide' ? 'out' : st.d.gas === 'steam (water vapour)' ? 'lit' : 'lit', S.ta); }
      }
      if (p.dtest === 'leftover') Gl.dish(F, [st.x, -0.13, 0], 0.04, { fill: 0.1, crust: 1, crustCol: p.pair === 'green' ? (st.k === 'A' ? '#58B84A' : '#B5623A') : p.pair === 'glow' ? (st.k === 'A' ? '#9DA3AA' : '#F4F4F2') : '#FFFFFF', tint: '#DDEFF8' });
      if (p.dtest === 'mass') M.balance(F, [st.x, -0.13], { text: (S.tr > 10 ? d.massB : d.massA).toFixed(2), settled: true });
    });
    F.render();
    stations.forEach(st => { const q = cam.project([st.x, -0.05, 0.0]); if (q.ok) G6tag(ctx, q.x, q.y + 12, 'TUBE ' + st.k, '#FFD27A'); });
    S._cy = K.HDR + 6; S._cyT = K.HDR + 6; S._left = true;
    const srcA = cam.project([-0.1, 0.04, 0.2]);
    lens(g, S, 'A: the same particles  ·  B: new partners', 'tube A left, tube B right', srcA.ok ? srcA : null, bx => {
      const half = { x: bx.cx - bx.R, y: bx.y, w: bx.R, h: bx.h }, half2 = { x: bx.cx + 4, y: bx.y, w: bx.R * 0.9, h: bx.h };
      drawSame(ctx, { x: half.x + bx.R * 0.12, y: half.y, w: bx.R * 0.85, h: half.h }, p.pair, S.ta, tt);
      drawEvents(ctx, half2, PAIR_EV[p.pair], tt, S.ta, { n: 1 });
      ctx.save(); ctx.strokeStyle = 'rgba(220,230,250,.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx.cx, bx.cy - bx.R); ctx.lineTo(bx.cx, bx.cy + bx.R); ctx.stroke(); ctx.restore();
      G6tag(ctx, bx.cx - bx.R * 0.5, bx.cy + bx.R * 0.78, 'A', '#9FD8FF'); G6tag(ctx, bx.cx + bx.R * 0.5, bx.cy + bx.R * 0.78, 'B', '#FFB27A');
    });
    const show = S.tr > 3 || p.dtest === 'look';
    const tell = decides(p.pair, p.dtest);
    ['A', 'B'].forEach(k => {
      const d = P[k], b = card(g, S, 'Tube ' + k + ': ' + (tell && S.tr > 8 ? (d.kind === 'physical' ? 'physical change' : 'chemical change') : 'physical or chemical?'), 92);
      if (!b) return;
      ctx.save(); ctx.textBaseline = 'top'; ctx.font = sans(10.5, 600); ctx.fillStyle = '#E6EEFA'; ctx.fillText(K.fitText(ctx, (k === 'A' ? Pd.A : Pd.B), b.w), b.x, b.y);
      ctx.font = mono(9.5, 500); ctx.fillStyle = '#B4C3DC';
      const res = p.dtest === 'look' ? Pd.look : p.dtest === 'gas' ? d.gasTest : p.dtest === 'cool' ? d.coolTest : p.dtest === 'leftover' ? d.left : 'before ' + d.massA.toFixed(2) + ' g → after ' + d.massB.toFixed(2) + ' g (open tube)';
      if (show) K.wrapText(ctx, res, b.x, b.y + 16, b.w, 12, 4);
      ctx.restore();
    });
    const b3 = card(g, S, tell ? 'This test tells them apart' : 'This test cannot tell them apart', 52);
    if (b3) { ctx.save(); ctx.textBaseline = 'top'; ctx.font = mono(9.5, 500); ctx.fillStyle = tell ? '#9FE0A8' : '#FFB0A8'; K.wrapText(ctx, tell ? 'Only a chemical change makes a new substance with new properties — and this test sees one.' : 'Appearance alone is not proof. Try a test that asks: is there a new substance?', b3.x, b3.y, b3.w, 12, 2); ctx.restore(); }
    K.header(g, Pd.name + ': ' + Pd.look.toLowerCase().replace(/\.$/, ''), 'test: ' + TESTS[p.dtest] + ' · A ' + (typeof P.A.T === 'number' ? P.A.T.toFixed(0) : '') + ' °C · B ' + P.B.T.toFixed(0) + ' °C', 'A: ' + Pd.A + ' · B: ' + Pd.B);
  }

  /* ---------------- properties: Fe + S in a tube, or a crucible ---------------- */
  function drawProperties(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), K = kit(), narrow = g.w < K.NARROW, R = propRun(p), row = rowAt(R.rows, S.tr), X = PMAT[p.pmat], T = propTable(p, R);
    placeView(S, g, narrow ? 0 : -0.225);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const Fl = FLAME[p.flame], burning = S.tr < R.tEnd - 10;
    const B = Gl.bunsen(F, [0.0, 0.06, 0], { on: burning, air: p.flame === 'yellow' ? 0 : 1, gas: p.flame === 'low' ? 0.4 : 0.8, ph: S.ta });
    const xiF = row.xi;
    if (p.pmat === 'fes' || p.pmat === 'sugar') {
      const st = Gl.stand(F, [-0.2, 0.18, 0], 0.34);
      const ax = [0.55, 0, 0.83], bottom = [-0.005, 0.06, 0.155];
      Gl.clampArm(F, [st[0], st[1], 0.26], add(bottom, [0.06, 0, 0.09]));
      const L = Math.min(0.06, R.Lcm / 100), fr = R.Lcm > 0 ? row.front / R.Lcm : 0;
      const before = p.pmat === 'fes' ? '#9C9A6A' : '#FAF8F2', after = p.pmat === 'fes' ? '#2B2A2C' : '#1E1612';
      const col = RX.mix(before, after, clamp(fr, 0, 1));
      Gl.tube(F, bottom, ax, 0.15, 0.009, { solid: { to: L, col, col2: p.pmat === 'fes' ? RX.mix('#E9CF3A', '#111', fr) : '#C88A2E', seed: 6, glow: row.glow ? { s: L * clamp(fr, 0.05, 1), k: 0.9 } : null },
        ring: p.pmat === 'fes' && R.after.B > 0.01 && fr > 0.5 ? { s0: 0.09, s1: 0.12, col: '#E9CF3A', a: 0.75 } : null, drops: p.pmat === 'sugar' && fr > 0.2 ? { s0: 0.1, s1: 0.14, n: Math.round(40 * fr) } : null });
    } else {
      Gl.tripod(F, [0, 0.06], 0.17, { hot: burning });
      const cc = [0, 0.06, 0.17];
      Gl.crucible(F, cc, { lid: true, lift: burning ? 0.006 : 0, hot: burning && row.T > 500, solid: { to: 0.008, col: RX.mix(p.pmat === 'mgo' ? '#C7CDD4' : '#C87A55', p.pmat === 'mgo' ? '#F4F4F2' : '#1F1C1B', xiF), seed: 9 } });
    }
    // the before / after samples on a white tile, and the test being done
    const tile = [0.13, -0.1];
    window.R3.box(F, [tile[0], tile[1], 0.003], [0.16, 0.08, 0.006], '#ECEEF0', { ambient: 0.6 });
    const bcol = p.pmat === 'fes' ? '#9C9A6A' : p.pmat === 'mgo' ? '#C7CDD4' : p.pmat === 'cuo' ? '#C87A55' : '#FAF8F2';
    const done = S.tr >= R.tEnd - 1;
    Gl.heap(F, [tile[0] - 0.04, tile[1], 0.006], 0.018, 0.008, bcol, { col2: p.pmat === 'fes' ? '#E9CF3A' : undefined, mixFrac: 0.45, seed: 2 });
    if (done) Gl.heap(F, [tile[0] + 0.04, tile[1], 0.006], 0.018, 0.008, SUB[X.P].col, { seed: 5 });
    if (p.ptest === 'magnet') {
      Gl.magnet(F, [tile[0] - 0.04 + (done ? 0.08 : 0) * 0, tile[1] + 0.035, 0.03], [1, 0, 0]);
      const fr = T.before.magFrac; if (fr > 0) Gl.lumps(F, [tile[0] - 0.072, tile[1] + 0.035, 0.03], 0.006, Math.round(10 * fr), '#6E747C', { size: 0.003 });
    }
    F.render();
    const labs = [[[tile[0] - 0.04, tile[1], 0.014], -50, 40, 'before: ' + (X.B ? p.mA.toFixed(1) + ' g Fe + ' + p.mB.toFixed(1) + ' g S, mixed' : p.mA.toFixed(2) + ' g ' + SUB[X.A].name)],
      [[tile[0] + 0.04, tile[1], 0.014], 50, 40, done ? 'after: ' + R.after.P.toFixed(2) + ' g ' + SUB[X.P].f + (R.after.A > 0.005 ? ' + ' + R.after.A.toFixed(2) + ' g ' + SUB[X.A].f : '') + (R.after.B > 0.005 ? ' + ' + R.after.B.toFixed(2) + ' g S' : '') : 'after: (still heating)']];
    labs.forEach(([at, dx, dy, t]) => { const q = cam.project(at); if (q.ok) leader(ctx, q.x, q.y, dx, dy, t, '#DCE6F6', g.w); });
    if (row.glow) { const q = cam.project([0.02, 0.06, 0.18]); if (q.ok) leader(ctx, q.x, q.y, -90, -40, 'the glow spreads on its own: the reaction gives out heat', '#FFD27A', g.w); }
    S._cy = K.HDR + 6; S._cyT = K.HDR + 6; S._left = true;
    const srcP = cam.project(p.pmat === 'fes' || p.pmat === 'sugar' ? [0.0, 0.06, 0.16] : [0, 0.06, 0.18]);
    lens(g, S, 'Close-up: the grains', p.pmat === 'fes' ? 'iron grey, sulfur yellow, FeS black' : p.pmat === 'cuo' ? 'only each grain’s outside turns to CuO' : SUB[X.P].name + ' forming', srcP.ok ? srcP : null, bx => closePowder(ctx, bx, p, R, row, S.ta));
    const b = card(g, S, 'Properties: before and after', 30 + 7 * 14 + 6, PTEST[p.ptest]);
    if (b) {
      const map = { magnet: 'magnet', density: 'density', colour: 'colour', acid: 'acid', melt: 'melts at', conduct: 'conducts' };
      const rows = [['', 'before', done ? 'after' : 'after (heating…)']].concat(T.rows.map(r => r[0] === map[p.ptest] ? r.map(c => ({ t: c, col: '#FFD27A', bold: true })) : [r[0], r[1], done ? r[2] : '…']));
      rowsIn(ctx, b, rows, [0, 0.22, 0.6], { head: true });
    }
    const b2 = card(g, S, 'A mixture or a compound?', 64);
    if (b2) { ctx.save(); ctx.font = mono(9.5, 500); ctx.fillStyle = '#B4C3DC'; ctx.textBaseline = 'top'; K.wrapText(ctx, X.B ? 'A mixture can be any ratio; FeS always forms 1.742 g of iron for every 1 g of sulfur — the rest is left over: ' + (R.after.A > 0.005 ? R.after.A.toFixed(2) + ' g iron.' : R.after.B > 0.005 ? R.after.B.toFixed(2) + ' g sulfur.' : 'nothing.') : X.word + ': the product is ' + (X.gain > 1 ? 'heavier' : 'lighter') + ' by a fixed factor, ×' + X.gain.toFixed(3) + '.', b2.x, b2.y, b2.w, 12, 3); ctx.restore(); }
    K.header(g, X.name + ': ' + (R.ign == null ? 'never hot enough to start' : S.tr < R.ign ? 'heating — not hot enough yet (' + row.T.toFixed(0) + ' °C)' : row.glow ? 'reacting' : 'finished'),
      't = ' + sSay(S.tr) + ' · flame: ' + Fl.name + (R.ign != null ? ' · starts at ' + R.ign.toFixed(0) + ' s' : ''), X.word);
  }

  /* ---------------- reversible: heat it, then cool it or wet it ---------------- */
  function drawReversible(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gl = G(), M = ME(), K = kit(), narrow = g.w < K.NARROW, R = revRun(p), row = rowAt(R.rows, S.tr), X = RSAMP[p.rsamp];
    placeView(S, g, narrow ? 0 : -0.225);
    const F = R3.Frame(ctx, cam, { ambient: 0.36, floorZ: 0 });
    room(F);
    const heating = S.tr < p.rtime, bath = p.rsamp === 'wax' || p.rsamp === 'egg';
    const cols = X.cols, ci = clamp(row.x * (cols.length - 1), 0, cols.length - 1), i0 = Math.floor(ci), col = RX.mix(cols[i0], cols[Math.min(cols.length - 1, i0 + 1)], ci - i0);
    const ax = p.rsamp === 'nh4cl' ? [0.25, 0, 0.97] : [0.9, 0, 0.44];
    let bottom = [-0.12, 0.06, 0.14];
    if (bath) {
      const HP = M.hotplate(F, [-0.06, 0.06, 0], { top: heating ? 110 : 20, set: heating ? 0.6 : 0, on: heating, hot: heating });
      M.beaker(F, [HP.centre[0], HP.centre[1], HP.topZ + 0.002], BK_R, 0.095, 0.07, { T: row.T, tint: '#D8ECF6', bubbles: heating && row.T > 95 ? 0.6 : 0, phase: S.ta });
      bottom = [HP.centre[0], HP.centre[1], HP.topZ + 0.012];
      const st = Gl.stand(F, [-0.24, 0.18, 0], 0.36); Gl.clampArm(F, [st[0], st[1], 0.26], add(bottom, [0, 0, 0.13]));
      const eggCol = RX.mix('#E9E6CF', '#FBFBF8', row.x);
      Gl.tube(F, bottom, [0, 0, 1], 0.15, 0.009, p.rsamp === 'egg' ? { mL: 5, tint: eggCol, alpha: 0.3, cloud: row.x * 0.97, cloudCol: '#FBFBF8' } : { mL: p.rmass / 0.9, tint: '#F3E3A6', alpha: 0.5, cloud: 1 - row.x, cloudCol: '#EFE7CF' });
    } else {
      if (heating) Gl.bunsen(F, [-0.08, 0.06, 0], { on: true, air: 1, gas: clamp(p.rtemp / 400, 0.2, 1), ph: S.ta });
      else Gl.bunsen(F, [-0.08, 0.06, 0], { on: false });
      const st = Gl.stand(F, [-0.26, 0.18, 0], 0.34);
      bottom = p.rsamp === 'nh4cl' ? [-0.09, 0.06, 0.15] : [-0.14, 0.06, 0.16];
      Gl.clampArm(F, [st[0], st[1], 0.24], add(bottom, scale3(ax, 0.1)));
      const Lfill = 0.012 + 0.02 * Math.cbrt(row.mass / 2.5);
      Gl.tube(F, bottom, ax, 0.15, 0.0125, { solid: { to: Lfill, col, col2: RX.mix(col, '#000', 0.25), seed: 8 },
        ring: p.rsamp === 'nh4cl' && row.ring > 0.02 ? { s0: 0.1, s1: 0.13, col: '#F8F8F8', a: clamp(row.ring, 0, 0.9) } : null,
        drops: X.steps || p.rsamp === 'sugar' ? { s0: 0.09, s1: 0.145, n: Math.round(clamp(row.water * 40, 0, 60)) } : null });
      if (X.steps || p.rsamp === 'sugar') {          // the delivery tube to a cooled test tube that catches the water
        const mouth = add(bottom, scale3(ax, 0.15));
        Gl.bung(F, mouth, 0.013, 0.011, 0.012);
        const rcv = [0.12, 0.0, 0.02];
        M.beaker(F, [rcv[0], rcv[1], 0.0], BK_R, 0.095, 0.06, { tint: '#D8ECF6' });
        for (let k = 0; k < 5; k++) window.R3.box(F, [rcv[0] + 0.015 * Math.cos(k * 1.3), rcv[1] + 0.015 * Math.sin(k * 1.3), 0.06], [0.014, 0.014, 0.012], '#E6F4FB', { shadow: false, ambient: 0.7 });
        Gl.tube(F, [rcv[0], rcv[1], 0.012], [0, 0, 1], 0.15, 0.009, { mL: row.water, tint: '#DDEFF8' });
        Gl.hose(F, [add(mouth, scale3(ax, 0.01)), add(mouth, [0.06, 0, 0.02]), [rcv[0], rcv[1], 0.2], [rcv[0], rcv[1], 0.08]], { r: 0.0025, col: '#E8EEF4' });
      }
      if (p.rsamp === 'nh4cl') {                        // damp litmus at the mouth: ammonia (blue) arrives before hydrogen chloride (red)
        const mouth = add(bottom, scale3(ax, 0.155)), t1 = R.rows.find(q => q.x > 0.05), blue = t1 && S.tr > t1.t, red = t1 && S.tr > t1.t * 1.46;
        window.R3.box(F, add(mouth, [0.01, 0, 0.01]), [0.004, 0.02, 0.03], red ? '#D8484A' : blue ? '#4A6CD8' : '#C9A0D0', { shadow: false, ambient: 0.6 });
      }
      if (p.back && R.wet != null && S.tr > R.wet - 6) Gl.pipette(F, add(add(bottom, scale3(ax, 0.02)), [0, 0, 0.05]), {});
    }
    F.render();
    if (!bath) { const fq = cam.project([-0.08, 0.06, 0.06]); if (fq.ok) g.handle(fq.x, fq.y, 12, 'flame'); }
    const q = cam.project(bottom);
    if (q.ok) leader(ctx, q.x, q.y, -60, 40, X.name + ': ' + row.mass.toFixed(2) + ' g', '#DCE6F6', g.w);
    S._cy = K.HDR + 6; S._cyT = K.HDR + 6; S._left = true;
    const srcR = cam.project(bottom);
    lens(g, S, X.steps ? 'Inside the crystal: water joins and leaves' : 'Close-up: the particles', X.steps ? 'waters held: ' + (100 * (1 - row.x)).toFixed(0) + ' %' : X.kind + ' change', srcR.ok ? srcR : null, bx => closeRev(ctx, bx, p, row, S.ta));
    const back = p.back ? (X.reverses ? 'yes — ' + (X.by === 'water' ? 'add water' : 'cool it') : 'no — ' + (X.by === 'water' ? 'water does not undo it' : 'cooling does not undo it')) : '(turn on “then try to reverse it”)';
    const rows = [['', 'start', heating ? 'now' : 'after heating'], ['colour', X.cols[0] === '#2F7FD9' ? 'blue' : X.cols[0] === '#E58AA8' ? 'pink' : 'white', colourName(p.rsamp, row.x)],
      ['mass', p.rmass.toFixed(2) + ' g', row.mass.toFixed(2) + ' g'], ['water out', '', row.water.toFixed(3) + ' g'], ['tube', '20 °C', row.T.toFixed(0) + ' °C'], ['reversed?', '', back], ['kind', '', X.kind + ' change']];
    const b = card(g, S, 'What happened, and can it go back?', 30 + rows.length * 14 + 6);
    if (b) rowsIn(ctx, b, rows, [0, 0.26, 0.55], { head: true });
    const b2 = card(g, S, 'Reversibility is a clue, not a rule', 64);
    if (b2) { ctx.save(); ctx.font = mono(9.5, 500); ctx.fillStyle = '#B4C3DC'; ctx.textBaseline = 'top'; K.wrapText(ctx, X.kind === 'chemical' && X.reverses ? 'A chemical change that goes back: new substances form both ways (here, water joins and leaves the crystal).' : X.kind === 'physical' ? 'A physical change: the same substance, melted and set again.' : 'A chemical change that cannot be undone: the new substance stays.', b2.x, b2.y, b2.w, 12, 3); ctx.restore(); }
    K.header(g, X.name + ' (' + X.from + '): ' + (heating ? 'heating, flame set for ' + p.rtemp + ' °C' + (bath ? ' (a water bath stops at 100)' : '') : R.wet != null && S.tr >= R.wet ? 'water dripped back on' : 'cooling'),
      't = ' + sSay(S.tr) + ' · ' + row.T.toFixed(0) + ' °C · mass ' + row.mass.toFixed(3) + ' g · water given off ' + row.water.toFixed(3) + ' g', R.waterMax > 0 ? 'all the water it can lose: ' + R.waterMax.toFixed(3) + ' g (' + (100 * R.waterMax / p.rmass).toFixed(1) + ' % of its mass)' : X.kind + ' change');
  }
  const scale3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  function colourName(k, x) {
    if (k === 'cuso4') return x < 0.3 ? 'blue' : x < 0.7 ? 'pale blue' : 'white-grey';
    if (k === 'cocl2') return x < 0.4 ? 'pink' : x < 0.8 ? 'violet' : 'blue';
    if (k === 'egg') return x < 0.5 ? 'clear' : 'white, opaque';
    if (k === 'sugar') return x < 0.2 ? 'white' : x < 0.6 ? 'brown, melted' : 'black';
    if (k === 'wax') return x > 0.5 ? 'clear liquid' : 'solid, cream';
    return 'white';
  }

  /* ---------------- the unknown ---------------- */
  function drawUnknown(S, g) {
    const p = S.p, ctx = g.ctx, cam = S.cam, Gl = G(), K = kit(), narrow = g.w < K.NARROW, Mx = MYST[p.mystery], q = mystP(p), X = RXN[q.rxn], run = chemRun(q), row = rowAt(run.rows, S.tr);
    placeView(S, g, narrow ? 0 : -0.17);
    const fake = Object.assign({}, X, { sol: 'unknown ' + p.mystery + '2', solF: '?', sol2: X.sol2 ? 'unknown ' + p.mystery + '3' : null, sol2F: '?' });
    const solidKey = X.solid;
    drawFlaskBench(S, g, q, Object.assign(fake, { solid: solidKey }), run, row, { cross: false, thermo: 'probe', indicator: false, mystery: true });
    const M = matchScores(p);
    S._cy = K.HDR + 6; S._left = false;
    const gk = Mx.gas, b = card(g, S, 'Test the gas: ' + GTEST[p.gtest].toLowerCase(), 46);
    if (b) { ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = '#E6EEFA'; ctx.textBaseline = 'top'; K.wrapText(ctx, gk ? gasResult(gk, p.gtest) + ' → ' + gasGuess(gk, p.gtest) : 'no gas came off', b.x, b.y, b.w, 12, 2); ctx.restore(); }
    const top = M.list.slice(0, 4), b2 = card(g, S, 'The solid (' + Mx.how + '): best matches', 30 + 14 * 6 + 6, M.best ? (M.sure ? 'sure' : 'not sure yet') : 'no tests');
    if (b2) {
      const m = M.m;
      const rows = [['measured', (p.tDen ? m.rho.toFixed(2) + ' g/cm³' : '—'), (p.tMelt ? (m.dec ? 'dec ' : '') + m.mp.toFixed(0) + ' °C' : '—'), (p.tSol ? (m.sol < 0.1 ? m.sol.toFixed(4) : m.sol.toFixed(1)) + ' g' : '—')]].concat(top.map((c, i) => [{ t: SUB[c.k].name, col: i === 0 && M.best ? '#FFD27A' : '#C9D6EC', bold: i === 0 }, SUB[c.k].rho.toFixed(2), (SUB[c.k].dec ? 'dec ' : '') + SUB[c.k].mp, String(SUB[c.k].sol)]));
      rows.unshift(['', 'density', 'melts', 'dissolves/100 g']);
      rowsIn(ctx, b2, rows, [0, 0.42, 0.62, 0.8], { head: true });
    }
    const nm = nameOf(p), b3 = card(g, S, 'Name the reaction', 58);
    if (b3) { ctx.save(); ctx.font = mono(9.5, 600); ctx.textBaseline = 'top'; ctx.fillStyle = nm.right ? '#9FE0A8' : '#FFB0A8'; K.wrapText(ctx, nm.text, b3.x, b3.y, b3.w, 12, 3); ctx.restore(); }
    K.header(g, 'Mystery ' + p.mystery + ': ' + Mx.look, 't = ' + sSay(S.tr) + ' · gas ' + Math.min(100, row.gas).toFixed(1) + ' mL · ' + row.T.toFixed(1) + ' °C', 'tests on the solid: ' + ['tLook', 'tDen', 'tMelt', 'tSol'].filter(k => p[k]).map(k => ({ tLook: 'look/magnet/conduct', tDen: 'density', tMelt: 'melting point', tSol: 'solubility' })[k]).join(', ') || 'none');
  }
  function nameOf(p) {
    const Mx = MYST[p.mystery], M = matchScores(p), gk = Mx.gas, gg = gk ? gasGuess(gk, p.gtest) : null;
    const gasName = gg && GAS[gg] ? GAS[gg].name : gg ? '(' + gg.replace(/2/g, '₂') + ')' : null;
    const solid = M.best ? SUB[M.best].name : '?';
    const prods = [solid].concat(gasName ? [gasName] : []);
    const right = M.best === Mx.solid && (!gk || gg === gk);
    return { text: Mx.reacts.join(' + ') + ' → ' + prods.join(' + ') + (right ? '  ✓' : M.best ? '  — check: the evidence is not enough yet' : ''), right };
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { const h = homeFor(p.setup, S._narrow, p.rxn); S.cam.dist = h.dist; S._narrowCam = S._narrow; }
    const ctx = g.ctx; ctx.fillStyle = '#B9C1C9'; ctx.fillRect(0, 0, g.w, g.h);
    if (p.setup === 'physical') return drawPhysical(S, g);
    if (p.setup === 'chemical') return drawChemical(S, g, false);
    if (p.setup === 'signs') return drawChemical(S, g, true);
    if (p.setup === 'confusing') return drawConfusing(S, g);
    if (p.setup === 'properties') return drawProperties(S, g);
    if (p.setup === 'reversible') return drawReversible(S, g);
    return drawUnknown(S, g);
  }

  /* ============================================================
     11. PLOTS
     ============================================================ */
  const C1 = '#5FB4FF', C2 = '#FFB27A', C3 = '#7CF0B0', C4 = '#F2F1EA', C5 = '#FF8A80', C6 = '#C9A7FF';
  function timeAxis(t1) { return kit().secAxis(0, t1); }
  function plotThisRun(S, g) {
    const p = S.p, T = g.theme, K = kit();
    if (p.setup === 'physical') {
      const R = physRun(p), t1 = R.tEnd, ax = timeAxis(t1), ys = R.rows.map(q => q.T), lo = Math.min(-15, ...ys), hi = Math.max(30, ...ys) + 5;
      const Kk = K.plotKey(g, [{ label: 'temperature', c: C2 }].concat(PHYS[p.phys].dissolve ? [{ label: 'g dissolved (right scale ×' + (hi - lo > 0 ? '' : '') + ')', c: C1 }] : [{ label: 'fraction melted', c: C1 }]));
      const P = g.Plot({ xmin: 0, xmax: t1, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: '°C', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.line(R.rows.map(q => [q.t, q.T]), C2, 2);
        const fr = PHYS[p.phys].dissolve ? R.rows.map(q => [q.t, lo + (hi - lo) * q.md / Math.max(1, p.pmass)]) : R.rows.map(q => [q.t, lo + (hi - lo) * (p.phys === 'boil' ? q.vap / Math.max(1, p.pwater) : q.f)]);
        P.line(fr, C1, 1.6, [4, 3]);
        if (R.tHeatEnd) P.vline(R.tHeatEnd, g.alpha(T['text-2'], 0.5), [3, 3]);
        P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]);
      });
      if (!PHYS[p.phys].dissolve && p.phys !== 'boil') P.tag(t1 * 0.02, PHYS[p.phys].mp + (hi - lo) * 0.05, 'flat at ' + PHYS[p.phys].mp + ' °C while it melts', T['text-2']);
      Kk.draw(P); return;
    }
    if (p.setup === 'chemical' || p.setup === 'signs' || p.setup === 'unknown') {
      const q = p.setup === 'unknown' ? mystP(p) : p, X = RXN[q.rxn], run = chemRun(q), t1 = Math.max(10, run.tEnd), ax = timeAxis(t1);
      if (p.setup === 'signs') {
        const sg = signsOf(p, run), res = THERMO[p.thermo].res, Kk = K.plotKey(g, [{ label: 'ΔT ÷ resolution', c: C2 }, { label: 'gas rate ÷ 0.02 mL/s', c: C1 }, { label: 'colour ΔE ÷ 12', c: C3 }, { label: 'cloudiness ÷ 0.1', c: C4 }], 'seen above 1');
        const lg = v => Math.log10(Math.max(1e-3, v));
        const P = g.Plot({ xmin: 0, xmax: t1, ymin: -3, ymax: 3, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: 'signal ÷ threshold', xticks: ax.xticks, xfmt: ax.xfmt, yticks: [-3, -2, -1, 0, 1, 2, 3], yfmt: v => v === 0 ? '1' : '10' + (v < 0 ? '⁻' : '') + '⁰¹²³'[Math.abs(v)] }).frame();
        P.clip(() => {
          P.hline(0, '#FFD27A', [5, 3]);
          P.line(run.rows.map(r => [r.t, lg(Math.abs(r.T - p.T0) / res)]), C2, 2);
          const gr = run.rows.map((r, i) => [r.t, lg(i ? (r.gas - run.rows[i - 1].gas) / (r.t - run.rows[i - 1].t || 1) / 0.02 : 0)]); P.line(gr, C1, 1.6);
          P.line(run.rows.map(r => [r.t, lg(dE(run.rows[0].col, r.col) / 12)]), C3, 1.6);
          P.line(run.rows.map(r => [r.t, lg(-Math.log(Math.max(1e-9, r.cross)) / 0.1)]), C4, 1.6);
          P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]);
        });
        Kk.draw(P); return;
      }
      if (X.law === 'ionic' && q.rxn === 'ppt') {
        const Kk = K.plotKey(g, [{ label: 'cross still visible, %', c: C4 }, { label: 'precipitate formed, % of final', c: C1 }]);
        const P = g.Plot({ xmin: 0, xmax: t1, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: '%', xticks: ax.xticks, xfmt: ax.xfmt }).frame();
        const pm = Math.max(1e-9, run.rows[run.rows.length - 1].ppt);
        P.clip(() => { P.line(run.rows.map(r => [r.t, 100 * r.cross]), C4, 2); P.line(run.rows.map(r => [r.t, 100 * r.ppt / pm]), C1, 1.6, [4, 3]); P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]); });
        Kk.draw(P); return;
      }
      if (q.rxn === 'neut' || (!X.gas && X.law !== 'burn')) {
        const ys = run.rows.map(r => r.T), lo = Math.min(...ys, p.T0) - 1, hi = Math.max(...ys, p.T0) + 1;
        const Kk = K.plotKey(g, [{ label: 'temperature', c: C2 }].concat(q.rxn === 'neut' ? [{ label: 'pH (right: 0–14)', c: C6 }] : [{ label: 'reacted, %', c: C1 }]));
        const P = g.Plot({ xmin: 0, xmax: t1, ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: '°C', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(1) }).frame();
        P.clip(() => { P.line(run.rows.map(r => [r.t, r.T]), C2, 2); P.line(run.rows.map(r => [r.t, lo + (hi - lo) * (q.rxn === 'neut' ? r.pH / 14 : r.xi)]), q.rxn === 'neut' ? C6 : C1, 1.6, [4, 3]); P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]); });
        Kk.draw(P); return;
      }
      if (X.law === 'burn') {
        const Kk = K.plotKey(g, [{ label: 'magnesium left, g', c: '#C7CDD4' }, { label: 'oxide made, g', c: C4 }]);
        const top = run.mS0 * 1.7 + 0.01;
        const P = g.Plot({ xmin: 0, xmax: t1, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: 'g', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(2) }).frame();
        P.clip(() => { P.line(run.rows.map(r => [r.t, r.left]), '#C7CDD4', 2); P.line(run.rows.map(r => [r.t, (run.mS0 - r.left) * SUB.mgo.M / SUB.mg.M]), C4, 2); P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]); });
        Kk.draw(P); return;
      }
      const gmax = Math.max(20, ...run.rows.map(r => r.gas)) * 1.08;
      const Kk = K.plotKey(g, [{ label: (X.law === 'elec' ? 'hydrogen' : GAS[X.gas].name) + ', mL', c: C1 }].concat(X.law === 'elec' ? [{ label: 'oxygen, mL', c: C5 }] : [{ label: 'temperature (right, °C)', c: C2 }]), gmax > 100 && X.law !== 'elec' ? 'syringe holds 100 mL' : '');
      const P = g.Plot({ xmin: 0, xmax: t1, ymin: 0, ymax: gmax, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: 'mL', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => {
        P.line(run.rows.map(r => [r.t, r.gas]), C1, 2);
        if (X.law === 'elec') P.line(run.rows.map(r => [r.t, r.o2]), C5, 2);
        else { const ys = run.rows.map(r => r.T), lo = Math.min(...ys) - 1, hi = Math.max(...ys) + 1; P.line(run.rows.map(r => [r.t, (r.T - lo) / (hi - lo) * gmax]), C2, 1.4, [4, 3]); }
        if (gmax > 100 && X.law !== 'elec') P.hline(100, C5, [5, 3]);
        P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'confusing') {
      const Kk = K.plotKey(g, [{ label: 'tube A', c: C1 }, { label: 'tube B', c: C2 }], 'the test starts at 8 s');
      const P = g.Plot({ xmin: 0, xmax: 30, ymin: 0, ymax: 1.1, pad: { t: Kk.t }, xlabel: 'time, s', ylabel: confQty(p.pair), xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { [['A', C1], ['B', C2]].forEach(([k, c]) => { const pts = []; for (let t = 0; t <= 30; t += 0.5) pts.push([t, confSig(p, k, t)]); P.line(pts, c, 2); }); P.vline(8, g.alpha(T['text-2'], 0.5), [3, 3]); P.vline(Math.min(30, S.tr), g.alpha(T['text-2'], 0.7), [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'properties') {
      const R = propRun(p), t1 = R.tEnd, ax = timeAxis(t1), Kk = K.plotKey(g, [{ label: 'temperature at the flame', c: C2 }, { label: 'how far the change has spread, %', c: C1 }], PMAT[p.pmat].Tign + ' °C to start');
      const P = g.Plot({ xmin: 0, xmax: t1, ymin: 0, ymax: 1000, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: '°C', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(R.rows.map(r => [r.t, r.T]), C2, 2); P.line(R.rows.map(r => [r.t, 10 * 100 * r.front / Math.max(1e-6, R.Lcm)]), C1, 1.6, [4, 3]); P.hline(PMAT[p.pmat].Tign, C5, [5, 3]); P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'reversible') {
      const R = revRun(p), t1 = R.tEnd, ax = timeAxis(t1), Kk = K.plotKey(g, [{ label: 'tube temperature', c: C2 }, { label: 'mass of solid, % of start (×4)', c: C1 }]);
      const P = g.Plot({ xmin: 0, xmax: t1, ymin: 0, ymax: 450, pad: { t: Kk.t }, xlabel: 'time, ' + ax.unit, ylabel: '°C', xticks: ax.xticks, xfmt: ax.xfmt, yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(R.rows.map(r => [r.t, r.T]), C2, 2); P.line(R.rows.map(r => [r.t, 4 * 100 * r.mass / p.rmass]), C1, 1.6, [4, 3]); P.vline(p.rtime, g.alpha(T['text-2'], 0.5), [3, 3]); if (R.wet != null) P.vline(R.wet, C3, [3, 3]); P.vline(S.tr, g.alpha(T['text-2'], 0.7), [2, 3]); });
      P.tag(p.rtime, 430, 'flame off', T['text-2']); if (R.wet != null) P.tag(R.wet, 400, 'water added', C3);
      Kk.draw(P); return;
    }
  }
  /* the look-alike traces: what each tube shows, through the test */
  function confQty(pair) { return { bubbles: 'bubbling', cold: 'cooling (norm.)', green: 'green colour', cloudy: 'cloudiness', glow: 'light' }[pair]; }
  function confSig(p, k, t) {
    const P = pairOf(p)[k], test = p.dtest, after = t > 8, u = clamp(t / 6, 0, 1);
    if (p.pair === 'bubbles') return k === 'A' ? (test === 'cool' && after ? Math.exp(-(t - 8) * 3) : u) : (test === 'cool' && after ? 0.5 : 1) * clamp(1 - t / Math.max(10, P.t || 60), 0, 1) * u;
    if (p.pair === 'cold') return u * (test === 'cool' && after ? Math.exp(-(t - 8) / 8) : 1) * (k === 'A' ? 1 : 0.6);
    if (p.pair === 'green') return u;
    if (p.pair === 'cloudy') return k === 'A' ? u * 0.73 * (test === 'cool' && after ? Math.exp(-(t - 8) / 4) : 1) : u;
    return k === 'A' ? (test === 'cool' && after ? Math.exp(-(t - 8) * 2) * 0.35 : 0.35 * u) : (t < 6 ? u : Math.max(0, 1 - (t - 6) / 4));
  }
  function plotLandscape(S, g) {
    const p = S.p, T = g.theme, K = kit();
    if (p.setup === 'physical') {
      const lgK = c => Math.log10(c + 273.15), Kk = K.plotKey(g, [{ label: 'physical changes', c: C3, dot: true }, { label: 'chemical changes', c: C5, dot: true }], 'same substance: on the line');
      const P = g.Plot({ xmin: lgK(-20), xmax: lgK(3700), ymin: lgK(-20), ymax: lgK(3700), pad: { t: Kk.t }, xlabel: 'melting point before, °C', ylabel: 'after, °C', xticks: [0, 100, 500, 1000, 3000].map(lgK), yticks: [0, 100, 500, 1000, 3000].map(lgK), xfmt: v => (Math.pow(10, v) - 273.15).toFixed(0), yfmt: v => (Math.pow(10, v) - 273.15).toFixed(0) }).frame();
      const pts = [['ice → water', 0, 0, 1], ['wax', 58, 58, 1], ['salt', 801, 801, 1], ['sugar', 186, 186, 1], ['iron + sulfur → FeS', 115, 1194, 0], ['Mg → MgO', 650, 2852, 0], ['Cu → CuO', 1085, 1326, 0], ['sugar → carbon', 186, 3640, 0]];
      P.clip(() => { P.line([[lgK(-20), lgK(-20)], [lgK(3700), lgK(3700)]], g.alpha(T['text-2'], 0.5), 1, [4, 3]); pts.forEach(([n, a, b, ph]) => P.dot(lgK(a), lgK(b), ph ? 4 : 3.5, ph ? C3 : C5)); const cur = { ice: 0, wax: 58, salt: 801, sugar: 186, boil: 0 }[p.phys]; P.dot(lgK(cur), lgK(cur), 6, C3, '#FFFFFF'); });
      pts.filter(q => !q[3]).forEach(([n, a, b]) => P.tag(lgK(a), lgK(b), n, C5));
      P.tag(lgK({ ice: 0, wax: 58, salt: 801, sugar: 186, boil: 0 }[p.phys]), lgK({ ice: 0, wax: 58, salt: 801, sugar: 186, boil: 0 }[p.phys]) - 0.12, 'this run', '#FFFFFF');
      Kk.draw(P); return;
    }
    if (p.setup === 'chemical' || p.setup === 'unknown') {
      const q = p.setup === 'unknown' ? mystP(p) : p, X = RXN[q.rxn];
      if (X.law === 'elec') {
        const Kk = K.plotKey(g, [{ label: 'hydrogen', c: C1 }, { label: 'oxygen', c: C5 }], 'after 10 minutes'), P = g.Plot({ xmin: 0, xmax: 2, ymin: 0, ymax: 160, pad: { t: Kk.t }, xlabel: 'current, A', ylabel: 'mL in 10 min', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line([[0, 0], [2, 2 * 600 / (2 * FAR) * VM * 1000]], C1, 2); P.line([[0, 0], [2, 600 / (2 * FAR) * VM * 1000]], C5, 2); P.dot(q.amps, q.amps * 600 / (2 * FAR) * VM * 1000, 5, C1, '#fff'); P.dot(q.amps, q.amps * 300 / (2 * FAR) * VM * 1000, 5, C5, '#fff'); });
        Kk.draw(P); return;
      }
      const ionic = X.law === 'ionic', key = ionic ? 'conc2' : X.law === 'catalyst' ? 'conc' : SOLID_KEY[q.rxn];
      const xmax = ionic ? 2 : X.law === 'catalyst' ? 2 : key === 'mMg' ? 0.5 : key === 'mFe' ? 4 : 5;
      const yOf = v => { const o = Object.assign({}, q, { [key]: v }), Y = yieldOf(q.rxn, o); return X.gas ? Y.gas : q.rxn === 'ppt' ? Y.ppt : X.law === 'burn' ? Y.mgo : Y.dT; };
      const pts = []; for (let i = 0; i <= 80; i++) pts.push([xmax * i / 80, yOf(xmax * i / 80)]);
      const ymax = Math.max(1, ...pts.map(z => z[1])) * 1.12, ymin = Math.min(0, ...pts.map(z => z[1])) * 1.12;
      const yl = X.gas ? GAS[X.gas].name + ', mL' : q.rxn === 'ppt' ? 'precipitate, g' : X.law === 'burn' ? 'MgO, g' : 'ΔT, °C';
      const Kk = K.plotKey(g, [{ label: yl + ' at the end', c: C1 }], 'the kink: the other reactant runs out');
      const P = g.Plot({ xmin: 0, xmax, ymin, ymax, pad: { t: Kk.t }, xlabel: ionic ? (X.sol2F + ' strength, M') : X.law === 'catalyst' ? 'H₂O₂ strength, M' : SUB[X.solid].name + ', g', ylabel: yl, xfmt: v => v.toFixed(xmax < 1 ? 2 : 1), yfmt: v => Math.abs(v) < 10 ? v.toFixed(1) : v.toFixed(0) }).frame();
      P.clip(() => { P.line(pts, C1, 2); P.dot(q[key], yOf(q[key]), 5, C1, '#FFFFFF'); if (X.gas) P.hline(100, C5, [5, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'signs') {
      const run = chemRun(p), X = RXN[p.rxn], res = THERMO[p.thermo].res;
      const Kk = K.plotKey(g, [{ label: 'temperature change ÷ ' + res + ' °C', c: C2 }, { label: 'gas, mL', c: C1 }, { label: 'precipitate cloudiness ÷ 0.1', c: C4 }], 'the strongest each sign gets');
      const cs = []; for (let i = 0; i <= 60; i++) cs.push(Math.pow(10, -4 + 4.3 * i / 60));
      const lg = v => Math.log10(Math.max(1e-3, v));
      const P = g.Plot({ xmin: -4, xmax: 0.3, ymin: -3, ymax: 3, pad: { t: Kk.t }, xlabel: 'strength of the solution, M (log)', ylabel: 'signal ÷ threshold', xticks: [-4, -3, -2, -1, 0], xfmt: v => '10' + (v < 0 ? '⁻' : '') + '⁰¹²³⁴'[Math.abs(v)], yticks: [-3, -2, -1, 0, 1, 2, 3], yfmt: v => v === 0 ? '1' : '10' + (v < 0 ? '⁻' : '') + '⁰¹²³'[Math.abs(v)] }).frame();
      P.clip(() => {
        P.hline(0, '#FFD27A', [5, 3]);
        const two = X.law === 'ionic';
        const Y = c => yieldOf(p.rxn, Object.assign({}, p, two ? { conc: c, conc2: c } : { conc: c }));
        if (X.law !== 'burn' && X.law !== 'elec') {
          P.line(cs.map(c => [Math.log10(c), lg(Math.abs(Y(c).dT) / res)]), C2, 2);
          if (X.gas) P.line(cs.map(c => [Math.log10(c), lg(Y(c).gas / 0.5)]), C1, 2);
          if (p.rxn === 'ppt') P.line(cs.map(c => { const cc = c * p.vol / (p.vol + p.vol2), c2 = c * p.vol2 / (p.vol + p.vol2), n = cc * c2 > RXN.ppt.Ksp ? Math.min(cc, c2) - Math.sqrt(RXN.ppt.Ksp) : 0; return [Math.log10(c), lg(K_EXT * Math.max(0, n) * 100.09 * 1e-3 * 4 / 0.1)]; }), C4, 2);
        }
        P.vline(Math.log10(Math.max(1e-4, p.conc)), g.alpha(T['text-2'], 0.7), [2, 3]);
      });
      Kk.draw(P); return;
    }
    if (p.setup === 'confusing') {
      const ctx = g.ctx, keys = Object.keys(PAIRS), tests = Object.keys(TESTS), x0 = 120, y0 = 30, cw = (g.w - x0 - 12) / tests.length, ch = Math.min(26, (g.h - y0 - 10) / keys.length);
      ctx.save(); ctx.font = mono(9.5, 600); ctx.textBaseline = 'middle';
      tests.forEach((t, j) => { ctx.fillStyle = t === p.dtest ? '#FFD27A' : '#9FB0CC'; ctx.textAlign = 'center'; ctx.fillText(kit().fitText(ctx, TESTS[t].split(' ').slice(0, 3).join(' '), cw - 4), x0 + (j + 0.5) * cw, y0 - 14); });
      keys.forEach((k, i) => {
        ctx.fillStyle = k === p.pair ? '#FFD27A' : '#C9D6EC'; ctx.textAlign = 'right'; ctx.fillText(PAIRS[k].name, x0 - 8, y0 + (i + 0.5) * ch);
        tests.forEach((t, j) => { const ok = decides(k, t); ctx.fillStyle = ok ? 'rgba(124,240,176,.55)' : 'rgba(255,138,128,.25)'; ctx.fillRect(x0 + j * cw + 2, y0 + i * ch + 2, cw - 4, ch - 4); if (k === p.pair && t === p.dtest) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(x0 + j * cw + 2, y0 + i * ch + 2, cw - 4, ch - 4); } ctx.fillStyle = '#0A1020'; ctx.textAlign = 'center'; ctx.fillText(ok ? 'tells' : 'no', x0 + (j + 0.5) * cw, y0 + (i + 0.5) * ch); });
      });
      ctx.restore(); return;
    }
    if (p.setup === 'properties') {
      const X = PMAT[p.pmat];
      if (X.B) {
        const Kk = K.plotKey(g, [{ label: 'FeS made, g', c: '#9AA3B4' }, { label: 'iron left, g', c: C1 }, { label: 'sulfur left, g', c: '#EBCB34' }], 'fixed ratio 1.742 : 1');
        const xs = []; for (let i = 0; i <= 80; i++) xs.push(i / 80 * 8);
        const P = g.Plot({ xmin: 0, xmax: 8, ymin: 0, ymax: 12, pad: { t: Kk.t }, xlabel: 'iron, g (sulfur ' + p.mB.toFixed(1) + ' g)', ylabel: 'g', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        const f = mFe => { const nA = mFe / SUB.fe.M, nB = p.mB / SUB.s.M, n = Math.min(nA, nB); return [n * SUB.fes.M, (nA - n) * SUB.fe.M, (nB - n) * SUB.s.M]; };
        P.clip(() => { P.line(xs.map(x => [x, f(x)[0]]), '#9AA3B4', 2); P.line(xs.map(x => [x, f(x)[1]]), C1, 2); P.line(xs.map(x => [x, f(x)[2]]), '#EBCB34', 2); P.vline(p.mB * X.ratio, g.alpha(T['text-2'], 0.5), [3, 3]); P.dot(p.mA, f(p.mA)[0], 5, '#9AA3B4', '#fff'); });
        Kk.draw(P); return;
      }
      const Kk = K.plotKey(g, [{ label: SUB[X.P].f + ' if it all reacts', c: C1 }, { label: 'what this run made', c: C2, dot: true }], '×' + X.gain.toFixed(3));
      const P = g.Plot({ xmin: 0, xmax: 6, ymin: 0, ymax: 8, pad: { t: Kk.t }, xlabel: SUB[X.A].name + ' at the start, g', ylabel: 'g after', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const R = propRun(p);
      P.clip(() => { P.line([[0, 0], [6, 6 * X.gain]], C1, 2); P.line([[0, 0], [6, 6]], g.alpha(T['text-2'], 0.4), 1, [4, 3]); P.dot(p.mA, R.after.P + R.after.A, 5, C2, '#fff'); });
      P.tag(4.6, 4.6, 'no change', T['text-2']);
      Kk.draw(P); return;
    }
    if (p.setup === 'reversible') {
      const Kk = K.plotKey(g, Object.keys(RSAMP).filter(k => k !== 'wax' && k !== 'egg').map((k, i) => ({ label: RSAMP[k].from, c: [C1, C6, C4, '#C88A2E'][i] })), 'slow heating');
      const P = g.Plot({ xmin: 20, xmax: 400, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'temperature, °C', ylabel: 'mass left, %', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { Object.keys(RSAMP).filter(k => k !== 'wax' && k !== 'egg').forEach((k, i) => P.line(thermogram(k), [C1, C6, C4, '#C88A2E'][i], k === p.rsamp ? 2.6 : 1.2)); const R = revRun(p); P.line(R.rows.filter(r => r.t <= p.rtime).map(r => [r.T, 100 * r.mass / p.rmass]), C2, 1.6, [3, 2]); const r = rowAt(R.rows, S.tr); P.dot(clamp(r.T, 20, 400), 100 * r.mass / p.rmass, 5, C2, '#fff'); });
      if (p.rsamp === 'cuso4') { P.tag(160, 85.6 + 4, '−2 H₂O', T['text-2']); P.tag(300, 63.9 + 4, '−5 H₂O: 63.9 %', T['text-2']); }
      Kk.draw(P); return;
    }
    if (p.setup === 'unknown') return;
  }
  function plotUnknown2(S, g) {
    const p = S.p, K = kit(), M = matchScores(p), T = g.theme;
    const Kk = K.plotKey(g, [{ label: 'mismatch χ² (lower fits better)', c: C1, box: true }], M.best ? (M.sure ? 'identified' : 'not sure yet') : 'run a test');
    const n = M.list.length, P = g.Plot({ xmin: -0.5, xmax: n - 0.5, ymin: 0, ymax: 40, pad: { t: Kk.t, b: 44 }, xlabel: '', ylabel: 'χ²', xticks: [], yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { M.list.forEach((c, i) => P.bar(i, Math.min(40, c.chi), 0.35, 0, c.k === M.best ? '#FFD27A' : C1)); P.hline(9, C5, [4, 3]); });
    const ctx = g.ctx; ctx.save(); ctx.font = mono(8.5, 500); ctx.fillStyle = T['text-2']; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    M.list.forEach((c, i) => { ctx.save(); ctx.translate(P.X(i), P.y0 + 6); ctx.rotate(-0.6); ctx.fillText(SUB[c.k].f, 0, 0); ctx.restore(); });
    ctx.restore();
    Kk.draw(P);
  }

  /* ============================================================
     12. READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'physical') {
      const R = physRun(p), row = rowAt(R.rows, S.tr), X = PHYS[p.phys];
      if (X.dissolve) {
        const last = R.rows[R.rows.length - 1];
        return [
          { label: 'Time', value: sSay(S.tr), hint: row.phase === 'evap' ? 'boiling the water off' : 'dissolving' },
          { label: 'Temperature', value: row.T.toFixed(1), unit: '°C', hint: 'ΔH of solution +' + X.dHs + ' kJ/mol: it cools' },
          { label: 'Dissolved', value: row.md.toFixed(1), unit: 'g', flag: 'accent', hint: 'of ' + p.pmass + ' g' },
          { label: 'Can dissolve', value: (SUB[X.sub].sol * p.pwater / 100).toFixed(1), unit: 'g', hint: SUB[X.sub].sol + ' g per 100 g of water', flag: p.pmass > SUB[X.sub].sol * p.pwater / 100 ? 'warn' : '' },
          { label: 'Conductivity', value: condOf(p, row).toFixed(2), unit: 'mS/cm', hint: p.phys === 'salt' ? 'ions free to move' : 'sugar makes no ions' },
          { label: 'All in solution at', value: R.doneAt ? sSay(R.doneAt) : '—', hint: (p.stir ? 'stirred' : 'not stirred') + ', ' + p.grain },
          { label: 'Got back', value: R.rev != null ? (last.ms + last.md).toFixed(1) : '—', unit: R.rev != null ? 'g' : '', hint: R.rev != null ? 'same crystals, melt at ' + SUB[X.sub].mp + ' °C' : 'turn on “then reverse it”' }
        ];
      }
      const m = p.phys === 'boil' ? p.pwater : p.pmass, Q = p.phys === 'boil' ? 0.3 * m * X.Lv : m * X.Lf;
      return [
        { label: 'Time', value: sSay(S.tr), hint: row.phase === 'reverse' ? 'reversing it' : 'heating at ' + p.power + ' W' },
        { label: 'Temperature', value: row.T.toFixed(1), unit: '°C', flag: 'accent', hint: p.phys === 'boil' ? 'stops at 100 while it boils' : 'flat at ' + X.mp + ' °C while it melts' },
        { label: p.phys === 'boil' ? 'Boiled off' : 'Melted', value: p.phys === 'boil' ? row.vap.toFixed(1) : (100 * row.f).toFixed(0), unit: p.phys === 'boil' ? 'g' : '%' },
        { label: p.phys === 'boil' ? 'Energy to boil 30 % away m·L' : 'Energy to melt m·L', value: (Q / 1000).toFixed(1), unit: 'kJ', hint: p.phys === 'boil' ? 'L = 2257 J/g' : 'L = ' + X.Lf + ' J/g' },
        { label: 'Mass of substance', value: (p.phys === 'boil' ? row.m + row.vap : m).toFixed(1), unit: 'g', hint: 'none made, none destroyed' },
        { label: 'Melting point', value: String(SUB[X.sub].mp), unit: '°C', hint: 'the same before and after' },
        { label: 'Back again', value: R.rev != null ? sSay(R.rev) : '—', hint: R.rev != null ? (p.phys === 'ice' ? 'frozen in ice and salt' : p.phys === 'wax' ? 'set again on cooling' : 'drops on the glass') : 'turn on “then reverse it”' }
      ];
    }
    if (p.setup === 'chemical' || p.setup === 'signs') {
      const X = RXN[p.rxn], run = chemRun(p), row = rowAt(run.rows, S.tr), out = [];
      out.push({ label: 'Time', value: sSay(S.tr), hint: S.tr >= run.doneAt ? 'finished at ' + sSay(run.doneAt) : 'reacting' });
      if (X.law !== 'burn') out.push({ label: 'Temperature change', value: (row.T - p.T0 >= 0 ? '+' : '') + (row.T - p.T0).toFixed(2), unit: '°C', flag: X.dH < 0 ? 'warn' : 'accent', hint: 'most ' + (run.dTx >= 0 ? '+' : '') + run.dTx.toFixed(2) + ' °C' });
      if (X.gas) out.push({ label: X.law === 'elec' ? 'Hydrogen · oxygen' : GAS[X.gas].name + ' collected', value: X.law === 'elec' ? row.gas.toFixed(1) + ' · ' + row.o2.toFixed(1) : Math.min(100, row.gas).toFixed(1), unit: 'mL', flag: row.gas > 100 && X.law !== 'elec' ? 'crit' : 'accent', hint: X.law === 'elec' ? 'ratio ' + (row.o2 > 0.05 ? (row.gas / row.o2).toFixed(2) : '—') + ' : 1' : row.gas > 100 ? 'syringe full: ' + row.gas.toFixed(0) + ' mL made' : 'at the end ' + run.gasEnd.toFixed(1) + ' mL' });
      if (p.rxn === 'ppt') out.push({ label: 'Precipitate', value: row.ppt.toFixed(3), unit: 'g', flag: 'accent', hint: 'CaCO₃, insoluble' });
      if (X.law === 'burn') out.push({ label: 'Magnesium oxide', value: ((run.mS0 - row.left) * SUB.mgo.M / SUB.mg.M).toFixed(3), unit: 'g', flag: 'accent', hint: 'heavier than the metal: ×1.658' });
      if (X.law !== 'elec') out.push({ label: 'Reacted', value: (100 * row.xi).toFixed(0), unit: '%', hint: 'of the reactant that runs out first' });
      if (run.limiting) out.push({ label: 'Runs out first', value: run.limiting, hint: X.law === 'ionic' ? 'mol: ' + (run.nA0 * 1000).toFixed(1) + ' vs ' + (run.nB0 * 1000).toFixed(1) + ' mmol' : 'mmol: ' + (run.nS0 * 1000).toFixed(2) + ' solid, ' + (run.nA0 * 1000).toFixed(1) + ' ' + (X.solF || '') });
      if (p.rxn === 'neut' || p.ind) out.push({ label: 'pH', value: row.pH.toFixed(1), hint: p.ind ? 'universal indicator in' : 'no indicator: it looks the same' });
      out.push({ label: 'ΔH', value: (X.dH > 0 ? '+' : '') + X.dH.toFixed(1), unit: 'kJ/mol', hint: X.dH < 0 ? 'gives out heat' : 'takes in heat' });
      if (p.setup === 'signs') { const sg = signsOf(p, run); out.unshift({ label: 'Signs seen', value: sg.n + ' of 5', flag: sg.n ? 'ok' : 'crit', hint: sg.n ? sg.list.filter(s => s.seen).map(s => s.k).join(', ') : 'it still reacted' }); }
      return out;
    }
    if (p.setup === 'confusing') {
      const P = pairOf(p), tell = decides(p.pair, p.dtest);
      return [
        { label: 'Tube A', value: typeof P.A.T === 'number' ? P.A.T.toFixed(1) : '', unit: '°C', hint: PAIRS[p.pair].A },
        { label: 'Tube B', value: P.B.T.toFixed(1), unit: '°C', hint: PAIRS[p.pair].B },
        { label: 'Looks the same?', value: 'yes', hint: PAIRS[p.pair].look },
        { label: 'This test', value: tell ? 'tells them apart' : 'cannot tell', flag: tell ? 'ok' : 'warn', hint: TESTS[p.dtest] },
        { label: 'Mass A · B', value: P.A.massB.toFixed(2) + ' · ' + P.B.massB.toFixed(2), unit: 'g', hint: 'from ' + P.A.massA.toFixed(2) + ' · ' + P.B.massA.toFixed(2) + ' g, open tubes' },
        { label: 'Verdict', value: tell && S.tr > 8 ? 'A ' + P.A.kind + ', B ' + P.B.kind : '?', flag: tell && S.tr > 8 ? 'accent' : '' }
      ];
    }
    if (p.setup === 'properties') {
      const R = propRun(p), row = rowAt(R.rows, S.tr), X = PMAT[p.pmat], T = propTable(p, R);
      return [
        { label: 'Time', value: sSay(S.tr) },
        { label: 'At the flame', value: row.T.toFixed(0), unit: '°C', hint: 'starts at ' + X.Tign + ' °C' },
        { label: 'Started at', value: R.ign != null ? sSay(R.ign) : 'never', flag: R.ign == null ? 'crit' : '', hint: FLAME[p.flame].name },
        { label: SUB[X.P].f + ' made', value: R.after.P.toFixed(2), unit: 'g', flag: 'accent', hint: X.B ? 'from ' + p.mA.toFixed(1) + ' g Fe + ' + p.mB.toFixed(1) + ' g S' : '×' + X.gain.toFixed(3) + ' of what reacted' },
        { label: 'Left over', value: R.after.A > 0.005 ? R.after.A.toFixed(2) + ' g ' + SUB[X.A].f : R.after.B > 0.005 ? R.after.B.toFixed(2) + ' g S' : 'none', hint: X.B ? 'iron : sulfur 1.742 : 1 by mass' : '' },
        { label: 'Density', value: T.before.rho.toFixed(2) + ' → ' + T.after.rho.toFixed(2), unit: 'g/cm³' },
        { label: 'Magnet pulls out', value: (100 * T.before.magFrac).toFixed(0) + ' → ' + (100 * T.after.magFrac).toFixed(0), unit: '%' },
        { label: PTEST[p.ptest], value: T.rows.find(r => r[0] === { magnet: 'magnet', density: 'density', colour: 'colour', acid: 'acid', melt: 'melts at', conduct: 'conducts' }[p.ptest])[2], flag: 'accent' }
      ];
    }
    if (p.setup === 'reversible') {
      const R = revRun(p), row = rowAt(R.rows, S.tr), X = RSAMP[p.rsamp], atEnd = rowAt(R.rows, p.rtime);
      return [
        { label: 'Time', value: sSay(S.tr), hint: S.tr < p.rtime ? 'heating' : 'off the flame' },
        { label: 'Tube', value: row.T.toFixed(0), unit: '°C', flag: 'accent' },
        { label: 'Mass of solid', value: row.mass.toFixed(3), unit: 'g', hint: 'from ' + p.rmass.toFixed(2) + ' g' },
        { label: 'Lost on heating', value: (100 * (1 - atEnd.mass / p.rmass)).toFixed(1), unit: '%', hint: R.waterMax > 0 ? 'all the water: ' + (100 * R.waterMax / p.rmass).toFixed(1) + ' %' : '' },
        { label: 'Water collected', value: atEnd.water.toFixed(3), unit: 'g' },
        { label: 'When wetted', value: R.Twet != null ? '+' + (R.Twet - (rowAt(R.rows, R.wet - 0.5).T)).toFixed(0) + ' °C' : '—', hint: R.Twet != null ? 'rehydration gives the heat back' : X.by === 'water' ? 'turn on “then try to reverse it”' : 'reversed by cooling, not water' },
        { label: 'Reversed?', value: !p.back ? '—' : X.reverses ? 'yes' : 'no', flag: !p.back ? '' : X.reverses ? 'ok' : 'crit', hint: X.kind + ' change' }
      ];
    }
    const Mx = MYST[p.mystery], q = mystP(p), run = chemRun(q), row = rowAt(run.rows, S.tr), M = matchScores(p), nm = nameOf(p);
    return [
      { label: 'Gas collected', value: Math.min(100, row.gas).toFixed(1), unit: 'mL', hint: Mx.gas ? 'at the end ' + Math.min(100, run.gasEnd).toFixed(0) + ' mL' : 'no gas' },
      { label: 'Gas test', value: Mx.gas ? gasResult(Mx.gas, p.gtest) : '—', hint: GTEST[p.gtest] },
      { label: 'Temperature change', value: (row.T - 20 >= 0 ? '+' : '') + (row.T - 20).toFixed(1), unit: '°C' },
      { label: 'Density measured', value: p.tDen ? M.m.rho.toFixed(2) : '—', unit: p.tDen ? 'g/cm³' : '', hint: '±8 % by displacement' },
      { label: 'Best match', value: M.best ? SUB[M.best].name : '—', flag: M.best ? (M.sure ? 'ok' : 'warn') : '', hint: M.best ? (M.sure ? 'runner-up ' + M.gap.toFixed(0) + ' χ² worse' : 'too close to call') : 'run a test' },
      { label: 'Named', value: nm.right ? 'right' : 'not yet', flag: nm.right ? 'ok' : 'warn' }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'physical') {
      const X = PHYS[p.phys];
      if (X.dissolve) { const n = p.pmass / SUB[X.sub].M; return E.v('Q') + ' ' + E.op('=') + ' ' + E.v('n') + 'Δ' + E.v('H') + E.sub('sol') + ' ' + E.op('=') + ' ' + E.n(n, 'mol') + ' × ' + E.n(X.dHs, 'kJ/mol') + ' ' + E.op('=') + ' ' + E.n(n * X.dHs, 'kJ') + ' taken in → Δ' + E.v('T') + ' ≈ −' + E.n(n * X.dHs * 1000 / (p.pwater * CW + C_BEAKER), '°C'); }
      const m = p.phys === 'boil' ? p.pwater : p.pmass, L2 = p.phys === 'boil' ? X.Lv : X.Lf;
      return E.v('Q') + ' ' + E.op('=') + ' ' + E.v('m') + E.v('L') + ' ' + E.op('=') + ' ' + E.n(m, 'g') + ' × ' + E.n(L2, 'J/g') + ' ' + E.op('=') + ' ' + E.n(m * L2 / 1000, 'kJ') + ',  ' + E.v('t') + ' ≈ ' + E.frac(E.v('Q'), E.n(PLATE_EFF * p.power, 'W')) + ' ' + E.op('=') + ' ' + E.n(m * L2 / (PLATE_EFF * p.power), 's');
    }
    if (p.setup === 'chemical' || p.setup === 'signs' || p.setup === 'unknown') {
      const q = p.setup === 'unknown' ? mystP(p) : p, X = RXN[q.rxn], run = chemRun(q);
      if (X.law === 'elec') { const n = q.amps * 600 / (2 * FAR); return E.v('n') + E.sub('H₂') + ' ' + E.op('=') + ' ' + E.frac(E.v('I') + E.v('t'), '2' + E.v('F')) + ' ' + E.op('=') + ' ' + E.frac(E.n(q.amps, 'A') + ' × 600 s', '2 × 96 485') + ' ' + E.op('=') + ' ' + E.n(n * 1000, 'mmol') + ' → ' + E.n(n * VM * 1000, 'mL') + ' H₂ in 10 min, half as much O₂'; }
      if (X.law === 'burn') { const m = q.mMg; return E.v('m') + E.sub('MgO') + ' ' + E.op('=') + ' ' + E.frac(E.n(m, 'g'), '24.305') + ' × 40.30 ' + E.op('=') + ' ' + E.n(m * SUB.mgo.M / SUB.mg.M, 'g') + '  (the oxygen from the air adds ' + E.n(m * (SUB.mgo.M / SUB.mg.M - 1), 'g') + ')'; }
      const n = run.lim, dT = -X.dH * 1000 * n / run.C;
      const part1 = X.gas ? E.v('V') + ' ' + E.op('=') + ' ' + E.v('n') + E.v('V') + E.sub('m') + ' ' + E.op('=') + ' ' + E.n(n * X.nuG * 1000, 'mmol') + ' × 24.05 L/mol ' + E.op('=') + ' ' + E.n(n * X.nuG * VM * 1000, 'mL') + ',  ' : q.rxn === 'ppt' ? E.v('m') + ' ' + E.op('=') + ' ' + E.n(n * 1000, 'mmol') + ' × 100.09 ' + E.op('=') + ' ' + E.n(n * 100.09, 'g') + ' CaCO₃,  ' : '';
      return part1 + 'Δ' + E.v('T') + ' ' + E.op('=') + ' ' + E.frac('−' + E.v('n') + 'Δ' + E.v('H'), E.v('C')) + ' ' + E.op('=') + ' ' + E.frac(E.n(n * 1000, 'mmol') + ' × ' + E.n(-X.dH, 'kJ/mol'), E.n(run.C, 'J/K')) + ' ' + E.op('=') + ' ' + E.n(dT, '°C');
    }
    if (p.setup === 'confusing') { const tell = decides(p.pair, p.dtest); return 'new substance? ' + E.op('→') + ' ' + (tell ? 'the test can show it ' + E.op('→') + ' A ' + pairOf(p).A.kind + ', B ' + pairOf(p).B.kind : 'this test cannot show it'); }
    if (p.setup === 'properties') {
      const X = PMAT[p.pmat], R = propRun(p);
      if (X.B) { const nA = p.mA / SUB.fe.M, nB = p.mB / SUB.s.M; return E.v('n') + E.sub('Fe') + ' ' + E.op('=') + ' ' + E.n(nA * 1000, 'mmol') + ', ' + E.v('n') + E.sub('S') + ' ' + E.op('=') + ' ' + E.n(nB * 1000, 'mmol') + ' → FeS ' + E.op('=') + ' ' + E.n(Math.min(nA, nB) * 1000, 'mmol') + ' × 87.91 ' + E.op('=') + ' ' + E.n(R.after.P, 'g'); }
      return E.v('m') + E.sub('after') + ' ' + E.op('=') + ' ' + E.n(p.mA * (1 - rowAt(R.rows, 1e9).xi), 'g') + ' unreacted + ' + E.n(R.after.P, 'g') + ' ' + SUB[X.P].f + ' ' + E.op('=') + ' ' + E.n(R.after.P + R.after.A, 'g');
    }
    const X = RSAMP[p.rsamp];
    if (X.steps) { const n = X.steps.reduce((s, q) => s + q.lose, 0); return 'water ' + E.op('=') + ' ' + E.frac(n + ' × 18.015', String(X.M)) + ' ' + E.op('=') + ' ' + E.n(100 * n * 18.015 / X.M, '%') + ' → ' + E.n(p.rmass, 'g') + ' gives ' + E.n(p.rmass * n * 18.015 / X.M, 'g'); }
    return X.name + ': ' + X.kind + ' change, ' + (X.reverses ? 'reverses by ' + X.by : 'does not reverse');
  }
  const EQ_NOTE = {
    physical: '<b>Melting, boiling and dissolving make no new substance.</b> The energy goes into pulling the particles apart, so the temperature stays flat while the state changes. Dissolving salt does change a property — the solution conducts — yet boil the water away and the same crystals, melting at 801 °C, come back.',
    chemical: '<b>The volume of gas and the heat both follow from the moles of the reactant that runs out first</b>, not from the one you have most of. The gas volume ignores the little that stays dissolved; the heat is shared by the liquid and the glass of the flask (92 J/K), and some leaks to the room.',
    signs: '<b>A sign is only a sign if an instrument (or your eye) can see it.</b> A dilute reaction still happens, but its temperature change can be smaller than the thermometer’s smallest step, and a precipitate does not form at all until the ions pass their solubility product (3.4 × 10⁻⁹ for calcium carbonate).',
    confusing: '<b>The question is never “did something change?” but “is there a new substance?”</b> Boiling, dissolving, mixing dyes and warming limewater all look like reactions; only a test of what is there afterwards decides.',
    properties: '<b>A compound has one fixed composition; a mixture has any.</b> Whatever ratio of iron and sulfur you heat, iron(II) sulfide forms in 55.85 : 32.06 by mass, and whatever is in excess is left over — still magnetic iron, or yellow sulfur.',
    reversible: '<b>Reversibility is a clue, not a rule.</b> Copper sulfate loses its water (a chemical change) and takes it back with heat; egg white and sugar never go back; wax goes back because nothing new was made.',
    unknown: '<b>One test rarely identifies a substance.</b> The lab scores each candidate by how many standard deviations each measured property lies from its table value (χ²); only when the runner-up is clearly worse is the identification sure — and only then is the word equation right.'
  };

  /* ============================================================
     13. REGISTRATION
     ============================================================ */
  const dissolveOn = S => !!PHYS[S.p.phys].dissolve;
  const rx = (...k) => S => k.includes(S.p.rxn);
  const notRx = (...k) => S => !k.includes(S.p.rxn);
  const AMT = { mMg: [0.02, 0.5, 0.01], mSoda: [0.1, 5, 0.1], mChips: [0.2, 5, 0.1], mFe: [0.1, 4, 0.1], mCat: [0, 2, 0.05] };
  const PMAT_DEF = { fes: { mA: 3.5, mB: 2 }, mgo: { mA: 0.24 }, cuo: { mA: 2 }, sugar: { mA: 2 } };

  L.register({
    id: 'g7b-change-detective',
    grade: 7, unit: '7B', topics: ['B1', 'B2'],
    subject: 'chemistry',
    name: 'The Change Detective — Physical Change, Chemical Change and the Evidence',
    chapter: 'Chemical Reactions and Conservation of Matter',
    exams: ['NGSS MS-PS1-2', 'NGSS Science and Engineering Practice 4: analysing and interpreting data', 'CAST'],
    weight: 'Unit anchor',
    is3D: true,
    autoplay: true,
    stageHint: 'Drag to walk round the bench · drag the hot-plate knob, the solid in the flask or the flame · every reading is computed',
    lede: 'Is it a <b>new substance</b>, or the same one changed? Melt ice and wax, dissolve salt and sugar, boil water — then get each back. Run <b>eight real reactions</b> in a flask with a gas syringe and a probe: every millilitre of gas and every degree comes from the moles that react and their <b>enthalpy</b>. ' +
      'Zoom in and watch the <b>atoms change partners</b> — and all stay. Make a reaction so dilute that no sign shows, set <b>look-alikes</b> side by side, test <b>properties before and after</b>, try to <b>reverse</b> it, and finally <b>identify an unknown</b> and name the reaction.',

    params: preset({}),
    presets: [
      { name: 'Ice melting: flat at 0 °C', params: preset({ setup: 'physical', phys: 'ice', pmass: 50, power: 300 }) },
      { name: 'Freeze it back, in ice and salt', params: preset({ setup: 'physical', phys: 'ice', pmass: 30, power: 300, undo: true, lapse: 60 }) },
      { name: 'Wax melts, then sets again', params: preset({ setup: 'physical', phys: 'wax', pmass: 20, power: 150, undo: true }) },
      { name: 'Salt dissolves — and conducts', params: preset({ setup: 'physical', phys: 'salt', pmass: 10, pwater: 100, stir: true }) },
      { name: 'Too much salt: 50 g in 100 mL', params: preset({ setup: 'physical', phys: 'salt', pmass: 50, pwater: 100, stir: true }) },
      { name: 'Boil the water off: the salt comes back', params: preset({ setup: 'physical', phys: 'salt', pmass: 10, pwater: 40, power: 600, undo: true, lapse: 60 }) },
      { name: 'Sugar dissolves, but makes no ions', params: preset({ setup: 'physical', phys: 'sugar', pmass: 20, pwater: 100, stir: true }) },
      { name: 'Boiling: the steam is still water', params: preset({ setup: 'physical', phys: 'boil', pwater: 100, power: 500, undo: true, lapse: 60 }) },
      { name: 'Magnesium, 0.10 g, in 1 M acid', params: preset({ setup: 'chemical', rxn: 'mg', mMg: 0.1, conc: 1, vol: 50 }) },
      { name: 'Twice the acid: faster, the same gas', params: preset({ setup: 'chemical', rxn: 'mg', mMg: 0.1, conc: 2, vol: 50 }) },
      { name: 'Baking soda in vinegar: it gets colder', params: preset({ setup: 'chemical', rxn: 'soda', mSoda: 0.3, conc: 0.83, vol: 50 }) },
      { name: 'Iron in copper sulfate: copper appears', params: preset({ setup: 'chemical', rxn: 'cu', mFe: 1, conc: 0.5, vol: 50, lapse: 20 }) },
      { name: 'Two clear solutions make a solid', params: preset({ setup: 'chemical', rxn: 'ppt', conc: 0.5, vol: 25, conc2: 0.5, vol2: 25, lapse: 1 }) },
      { name: 'Hydrogen peroxide and a catalyst', params: preset({ setup: 'chemical', rxn: 'perox', mCat: 0.5, conc: 0.5, vol: 15 }) },
      { name: 'Burning magnesium in air', params: preset({ setup: 'chemical', rxn: 'burn', mMg: 0.1, lapse: 1 }) },
      { name: 'Splitting water: 2 : 1', params: preset({ setup: 'chemical', rxn: 'elec', amps: 0.5, lapse: 60 }) },
      { name: 'Dilute neutralisation: no sign you can see', params: preset({ setup: 'signs', rxn: 'neut', conc: 0.01, vol: 25, conc2: 0.01, vol2: 25, thermo: 'glass', lapse: 1 }) },
      { name: 'The same, with a 0.1 °C probe', params: preset({ setup: 'signs', rxn: 'neut', conc: 0.05, vol: 25, conc2: 0.05, vol2: 25, thermo: 'probe', lapse: 1 }) },
      { name: 'Add universal indicator: now it shows', params: preset({ setup: 'signs', rxn: 'neut', conc: 0.01, vol: 25, conc2: 0.01, vol2: 25, thermo: 'glass', ind: true, lapse: 1 }) },
      { name: 'Too dilute to precipitate', params: preset({ setup: 'signs', rxn: 'ppt', conc: 0.0001, vol: 25, conc2: 0.0001, vol2: 25, lapse: 1 }) },
      { name: 'Felt by hand: the cold of baking soda', params: preset({ setup: 'signs', rxn: 'soda', mSoda: 2, conc: 0.83, vol: 50, thermo: 'hand' }) },
      { name: 'Bubbles: boiling, or hydrogen? Test the gas', params: preset({ setup: 'confusing', pair: 'bubbles', dtest: 'gas' }) },
      { name: 'It got cold: dissolving, or reacting?', params: preset({ setup: 'confusing', pair: 'cold', dtest: 'leftover' }) },
      { name: 'Both turned green: what is left?', params: preset({ setup: 'confusing', pair: 'green', dtest: 'leftover' }) },
      { name: 'Both went cloudy: cool them', params: preset({ setup: 'confusing', pair: 'cloudy', dtest: 'cool' }) },
      { name: 'Both glow: weigh them', params: preset({ setup: 'confusing', pair: 'glow', dtest: 'mass' }) },
      { name: 'Iron and sulfur in the right ratio', params: preset({ setup: 'properties', pmat: 'fes', mA: 3.5, mB: 2, ptest: 'magnet' }) },
      { name: 'Too much iron: the magnet still finds some', params: preset({ setup: 'properties', pmat: 'fes', mA: 7, mB: 2, ptest: 'magnet' }) },
      { name: 'Too much sulfur: a yellow ring', params: preset({ setup: 'properties', pmat: 'fes', mA: 2, mB: 4, ptest: 'colour' }) },
      { name: 'Add acid: hydrogen before, H₂S after', params: preset({ setup: 'properties', pmat: 'fes', mA: 3.5, mB: 2, ptest: 'acid' }) },
      { name: 'A sooty yellow flame: slow to start', params: preset({ setup: 'properties', pmat: 'fes', mA: 3.5, mB: 2, flame: 'yellow' }) },
      { name: 'Magnesium burned in a crucible', params: preset({ setup: 'properties', pmat: 'mgo', mA: 0.24, ptest: 'density' }) },
      { name: 'Copper heated in air', params: preset({ setup: 'properties', pmat: 'cuo', mA: 2, ptest: 'conduct' }) },
      { name: 'Sugar heated strongly', params: preset({ setup: 'properties', pmat: 'sugar', mA: 2, ptest: 'melt' }) },
      { name: 'Copper sulfate: heat, then add water', params: preset({ setup: 'reversible', rsamp: 'cuso4', rmass: 2.5, rtemp: 300, rtime: 240, back: true }) },
      { name: 'Not hot enough: only some water leaves', params: preset({ setup: 'reversible', rsamp: 'cuso4', rmass: 2.5, rtemp: 110, rtime: 240, back: false }) },
      { name: 'Cobalt chloride: pink to blue to pink', params: preset({ setup: 'reversible', rsamp: 'cocl2', rmass: 2, rtemp: 200, rtime: 200, back: true }) },
      { name: 'Ammonium chloride: it re-forms up the tube', params: preset({ setup: 'reversible', rsamp: 'nh4cl', rmass: 1, rtemp: 400, rtime: 240, back: true }) },
      { name: 'Wax: melts and sets', params: preset({ setup: 'reversible', rsamp: 'wax', rmass: 2, rtemp: 98, rtime: 180, back: true }) },
      { name: 'Egg white: it never goes back', params: preset({ setup: 'reversible', rsamp: 'egg', rmass: 3, rtemp: 98, rtime: 180, back: true }) },
      { name: 'Sugar: water drops, then black', params: preset({ setup: 'reversible', rsamp: 'sugar', rmass: 2, rtemp: 350, rtime: 240, back: true }) },
      { name: 'Mystery A, every test', params: preset({ setup: 'unknown', mystery: 'A', gtest: 'lit', tLook: true, tDen: true, tMelt: true, tSol: true }) },
      { name: 'Mystery B: weigh the gas', params: preset({ setup: 'unknown', mystery: 'B', gtest: 'weigh', tLook: true, tDen: true, tMelt: true }) },
      { name: 'Mystery C: a glowing splint', params: preset({ setup: 'unknown', mystery: 'C', gtest: 'glow', tLook: true, tDen: true }) },
      { name: 'Mystery F: density alone fools you', params: preset({ setup: 'unknown', mystery: 'F', gtest: 'lime', tLook: false, tDen: true, tMelt: false, tSol: false }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'On the hot plate', when: is('physical'), items: [
        { key: 'phys', type: 'select', label: 'The change', rebuild: true, options: Object.keys(PHYS).map(k => ({ value: k, label: PHYS[k].name })) },
        { key: 'pmass', label: 'Mass of the solid', min: 5, max: 100, step: 1, unit: 'g', restructure: true, when: S => S.p.phys !== 'boil' },
        { key: 'pwater', label: 'Water', min: 20, max: 200, step: 5, unit: 'mL', restructure: true, when: S => ['salt', 'sugar', 'boil'].includes(S.p.phys) },
        { key: 'power', label: 'Hot plate power', min: 50, max: 600, step: 10, unit: 'W', restructure: true, when: S => !dissolveOn(S) || S.p.undo },
        { key: 'grain', type: 'select', label: 'Grain size', when: dissolveOn, options: [{ value: 'crystals', label: 'crystals, 0.5 mm' }, { value: 'powder', label: 'powder, 0.1 mm' }] },
        { key: 'stir', type: 'toggle', label: 'Magnetic stirrer on', restructure: true, when: dissolveOn },
        { key: 'undo', type: 'toggle', label: 'Then reverse it (cool it, or boil the water off)', restructure: true, rebuild: true } ] },
      { group: 'The reaction', when: isAny('chemical', 'signs'), items: [
        { key: 'rxn', type: 'select', label: 'Reaction', rebuild: true, onChange: S => Object.assign(S.p, RXN_DEF[S.p.rxn]), options: RXN_KEYS.map(k => ({ value: k, label: RXN[k].name })) } ] },
      { group: 'Amounts', when: isAny('chemical', 'signs'), items: [
        { key: 'mMg', label: 'Magnesium ribbon', min: AMT.mMg[0], max: AMT.mMg[1], step: AMT.mMg[2], unit: 'g', restructure: true, when: rx('mg', 'burn'), fmt: v => v.toFixed(2) + ' (' + (v / MG_G_PER_CM).toFixed(1) + ' cm)' },
        { key: 'mSoda', label: 'Baking soda', min: AMT.mSoda[0], max: AMT.mSoda[1], step: AMT.mSoda[2], unit: 'g', restructure: true, when: rx('soda'), fmt: f1 },
        { key: 'mChips', label: 'Marble chips', min: AMT.mChips[0], max: AMT.mChips[1], step: AMT.mChips[2], unit: 'g', restructure: true, when: rx('marble'), fmt: f1 },
        { key: 'mFe', label: 'Iron powder', min: AMT.mFe[0], max: AMT.mFe[1], step: AMT.mFe[2], unit: 'g', restructure: true, when: rx('cu'), fmt: f1 },
        { key: 'mCat', label: 'Manganese(IV) oxide (catalyst)', min: AMT.mCat[0], max: AMT.mCat[1], step: AMT.mCat[2], unit: 'g', restructure: true, when: rx('perox'), fmt: f2 },
        { key: 'conc', label: 'Strength of the solution', min: 0.0001, max: 2, step: 0.0001, unit: 'M', restructure: true, when: notRx('burn', 'elec'), fmt: v => v < 0.01 ? v.toFixed(4) : v.toFixed(2) },
        { key: 'vol', label: 'Volume of the solution', min: 10, max: 100, step: 5, unit: 'mL', restructure: true, when: notRx('burn', 'elec') },
        { key: 'conc2', label: 'Strength of the second solution', min: 0.0001, max: 2, step: 0.0001, unit: 'M', restructure: true, when: rx('ppt', 'neut'), fmt: v => v < 0.01 ? v.toFixed(4) : v.toFixed(2) },
        { key: 'vol2', label: 'Volume of the second solution', min: 10, max: 100, step: 5, unit: 'mL', restructure: true, when: rx('ppt', 'neut') },
        { key: 'amps', label: 'Current', min: 0.05, max: 2, step: 0.05, unit: 'A', restructure: true, when: rx('elec'), fmt: f2 },
        { key: 'T0', label: 'Starting temperature', min: 5, max: 60, step: 1, unit: '°C', restructure: true, when: notRx('burn', 'elec') } ] },
      { group: 'Instruments', when: is('signs'), items: [
        { key: 'thermo', type: 'select', label: 'Read the temperature with', restructure: false, options: [{ value: 'glass', label: 'a thermometer (1 °C)' }, { value: 'probe', label: 'a probe (0.1 °C)' }, { value: 'hand', label: 'your hand (≈3 °C)' }] },
        { key: 'ind', type: 'toggle', label: 'Add universal indicator', restructure: true, when: notRx('burn', 'elec') } ] },
      { group: 'Display', when: is('chemical'), items: [
        { key: 'zoom', type: 'select', label: 'Particle card', display: true, options: [{ value: 'atoms', label: 'atoms' }, { value: 'off', label: 'hidden' }] } ] },
      { group: 'The look-alikes', when: is('confusing'), items: [
        { key: 'pair', type: 'select', label: 'The pair', restructure: true, options: Object.keys(PAIRS).map(k => ({ value: k, label: PAIRS[k].name })) },
        { key: 'dtest', type: 'select', label: 'The test', restructure: true, options: Object.keys(TESTS).map(k => ({ value: k, label: TESTS[k] })) } ] },
      { group: 'The sample', when: is('properties'), items: [
        { key: 'pmat', type: 'select', label: 'Heat', rebuild: true, onChange: S => Object.assign(S.p, PMAT_DEF[S.p.pmat]), options: Object.keys(PMAT).map(k => ({ value: k, label: PMAT[k].name })) },
        { key: 'mA', label: 'Mass of the first substance', min: 0.1, max: 8, step: 0.05, unit: 'g', restructure: true, fmt: f2 },
        { key: 'mB', label: 'Sulfur', min: 0.5, max: 6, step: 0.1, unit: 'g', restructure: true, when: S => S.p.pmat === 'fes', fmt: f1 },
        { key: 'flame', type: 'select', label: 'Bunsen flame', options: Object.keys(FLAME).map(k => ({ value: k, label: FLAME[k].name })) },
        { key: 'ptest', type: 'select', label: 'Test it', restructure: false, options: Object.keys(PTEST).map(k => ({ value: k, label: PTEST[k] })) } ] },
      { group: 'The tube', when: is('reversible'), items: [
        { key: 'rsamp', type: 'select', label: 'In the tube', rebuild: true, options: Object.keys(RSAMP).map(k => ({ value: k, label: RSAMP[k].name })) },
        { key: 'rmass', label: 'Mass', min: 0.5, max: 5, step: 0.1, unit: 'g', restructure: true, fmt: f1 },
        { key: 'rtemp', label: 'Flame set for', min: 40, max: 450, step: 5, unit: '°C', restructure: true },
        { key: 'rtime', label: 'Heat for', min: 30, max: 600, step: 10, unit: 's', restructure: true },
        { key: 'back', type: 'toggle', label: 'Then try to reverse it (cool it, or add water)', restructure: true } ] },
      { group: 'The mystery', when: is('unknown'), items: [
        { key: 'mystery', type: 'select', label: 'Mystery', options: Object.keys(MYST).map(k => ({ value: k, label: k })) },
        { key: 'gtest', type: 'select', label: 'Test the gas with', restructure: false, options: Object.keys(GTEST).map(k => ({ value: k, label: GTEST[k] })) },
        { key: 'tLook', type: 'toggle', label: 'Look, magnet, conducts?' },
        { key: 'tDen', type: 'toggle', label: 'Measure density' },
        { key: 'tMelt', type: 'toggle', label: 'Measure melting point' },
        { key: 'tSol', type: 'toggle', label: 'Measure solubility' },
        { key: 'sample', label: 'Another sample (repeat the measurements)', min: 1, max: 9, step: 1 } ] },
      { group: 'Time', items: [
        { key: 'lapse', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 5, label: '×5' }, { value: 20, label: '×20' }, { value: 60, label: '×60' }] } ] }
    ],

    setup, step, drawStage,
    onPointer(S, x, y, down, type) { if (type === 'pointerdown' && window.KITMS) window.KITMS.chipHit(S, x, y); },
    onDrag(S, d) {
      const p = S.p;
      if (d.id === 'power') p.power = clamp(Math.round((p.power - d.dy * 2) / 10) * 10, 50, 600);
      else if (d.id === 'amount') { const k = SOLID_KEY[p.rxn]; if (k) { const a = AMT[k], r = (a[1] - a[0]) / 250; p[k] = clamp(Math.round((p[k] - d.dy * r) / a[2]) * a[2], a[0], a[1]); } }
      else if (d.id === 'flame') p.rtemp = clamp(Math.round((p.rtemp - d.dy * 1.5) / 5) * 5, 40, 450);
      else return;
      setup(S);
    },
    plots: [
      { title: S => ({ physical: 'Temperature as it changes state', chemical: 'What the instruments read, this run', signs: 'Each sign against what can be seen (log)', confusing: 'Tube A and tube B, through the test', properties: 'The flame end, and the change spreading', reversible: 'Heating, then reversing', unknown: 'Gas from the mystery reaction' })[S.p.setup],
        draw: plotThisRun },
      { title: S => ({ physical: 'Melting point before and after: every change on the bench', chemical: 'How much is made, against how much goes in', signs: 'How strong the solution must be for each sign', confusing: 'Which test tells which pair apart', properties: S.p.pmat === 'fes' ? 'A compound’s fixed ratio: iron against sulfur' : 'Mass after, against mass before', reversible: 'Thermograms: mass left as each sample is heated slowly', unknown: 'How well each candidate fits the measurements' })[S.p.setup],
        draw: (S, g) => S.p.setup === 'unknown' ? plotUnknown2(S, g) : plotLandscape(S, g) }
    ],
    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'CAST pattern · predicting from a model', params: preset({ setup: 'chemical', rxn: 'mg', mMg: 0.1, conc: 1, vol: 50, lapse: 60 }),
        q: '0.100 g of magnesium ribbon reacts completely with excess hydrochloric acid at 20 °C. One mole of gas fills 24.05 L at 20 °C. How much hydrogen does the gas syringe collect?',
        predict: { label: 'Hydrogen', unit: 'mL', tol: 0.03 },
        measure: S => chemRun(S.p).gasEnd,
        working: 'Moles of Mg = 0.100 ÷ 24.305 = 4.11 mmol, and Mg + 2HCl → MgCl₂ + H₂ makes one H₂ for each Mg: 4.11 mmol × 24.05 mL/mmol = 98.9 mL. About 1 mL stays dissolved in the acid, so the syringe reads <b>98–99 mL</b>.' },
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'chemical', rxn: 'elec', amps: 0.5, lapse: 60 }),
        q: 'A Hofmann voltameter passes 0.50 A for 10 minutes. Each H₂ needs 2 electrons; a mole of electrons is 96 485 C. What volume of hydrogen collects at 20 °C?',
        predict: { label: 'Hydrogen in 10 min', unit: 'mL', tol: 0.03 },
        measure: S => rowAt(chemRun(S.p).rows, 600).gas,
        working: 'Charge = 0.50 × 600 = 300 C = 3.11 mmol of electrons → 1.555 mmol H₂ × 24.05 = <b>37.4 mL</b>, and 18.7 mL of oxygen: 2 : 1, as the formula H₂O says.' },
      { source: 'CAST pattern · a compound’s fixed ratio', params: preset({ setup: 'properties', pmat: 'fes', mA: 7, mB: 3.2 }),
        q: '7.0 g of iron filings and 3.2 g of sulfur are heated until the glow has spread through. Iron(II) sulfide is FeS (Fe 55.85, S 32.06). What mass of FeS forms?',
        predict: { label: 'FeS', unit: 'g', tol: 0.02 },
        measure: S => propRun(S.p).after.P,
        working: 'Sulfur: 3.2 ÷ 32.06 = 0.0998 mol; iron: 7.0 ÷ 55.85 = 0.125 mol — the sulfur runs out first. FeS = 0.0998 × 87.91 = <b>8.77 g</b>, and 1.43 g of iron is left over: the magnet still finds it.' },
      { source: 'CAST pattern · a reversible chemical change', params: preset({ setup: 'reversible', rsamp: 'cuso4', rmass: 2.5, rtemp: 300, rtime: 240, back: false }),
        q: 'Blue copper sulfate is CuSO₄·5H₂O (249.69 g/mol). Heated strongly, all five waters leave. What mass of water comes off 2.50 g of crystals?',
        predict: { label: 'Water lost', unit: 'g', tol: 0.02 },
        measure: S => rowAt(revRun(S.p).rows, S.p.rtime).water,
        working: 'Five waters weigh 5 × 18.015 = 90.08 g in every 249.69 g, or 36.07 %. 2.50 × 0.3607 = <b>0.902 g</b>. Add it back and the white powder turns blue and hot.' },
      { source: 'CAST pattern · energy in a reaction', params: preset({ setup: 'chemical', rxn: 'neut', conc: 1, vol: 25, conc2: 1, vol2: 25, lapse: 5 }),
        q: '25 mL of 1.0 M hydrochloric acid and 25 mL of 1.0 M sodium hydroxide are mixed in a flask. ΔH = −55.8 kJ per mole of water; the liquid takes 4.18 J/(g·K) and the flask 92 J/K. How much does the temperature rise?',
        predict: { label: 'Temperature rise', unit: '°C', tol: 0.04 },
        measure: S => chemRun(S.p).dTx,
        working: '0.025 mol × 55.84 kJ = 1.396 kJ, shared by 50 g × 4.18 + 92 = 301 J/K: 1396 ÷ 301 = <b>4.6 °C</b>. In a foam cup, without the glass to warm, it would be 6.7 °C.' },
      { source: 'CAST pattern · identifying a substance', params: preset({ setup: 'unknown', mystery: 'B', gtest: 'weigh' }),
        q: 'The gas from mystery B is weighed: 100 mL at 20 °C. If it is carbon dioxide (44.01 g/mol, 24.05 L/mol), what should 100 mL weigh?',
        predict: { label: 'Mass of 100 mL', unit: 'mg', tol: 0.02 },
        measure: S => gasMassPer100(MYST[S.p.mystery].gas) * 1000,
        working: '100 mL is 0.1 ÷ 24.05 = 4.16 mmol; × 44.01 = <b>183 mg</b> — half as heavy again as air (120 mg), so it pours downward and puts out a flame.' },
      { source: 'CAST pattern · solubility', params: preset({ setup: 'physical', phys: 'salt', pmass: 50, pwater: 100, stir: true }),
        q: 'At 20 °C, 100 g of water dissolves at most 36.0 g of salt. 50 g of salt is stirred into 100 mL of water. How much stays on the bottom?',
        predict: { label: 'Undissolved', unit: 'g', tol: 0.03 },
        measure: S => { const R = physRun(S.p); return R.rows[R.rows.length - 1].ms; },
        working: '50 − 36.0 = <b>14.0 g</b> stays solid, however long you stir. The rest is still salt — boil the water off and all 50 g come back.' },
      { source: 'CAST pattern · a precipitate', params: preset({ setup: 'chemical', rxn: 'ppt', conc: 0.5, vol: 25, conc2: 0.5, vol2: 25, lapse: 20 }),
        q: '25 mL of 0.50 M calcium chloride is mixed with 25 mL of 0.50 M sodium carbonate. Calcium carbonate (100.09 g/mol) is insoluble. What mass of precipitate forms?',
        predict: { label: 'Precipitate', unit: 'g', tol: 0.02 },
        measure: S => { const r = chemRun(S.p); return r.rows[r.rows.length - 1].ppt; },
        working: 'Each solution holds 0.025 × 0.50 = 12.5 mmol; they react 1 : 1, so 12.5 mmol × 100.09 = <b>1.25 g</b> of white CaCO₃ — the cross under the flask disappears at once.' }
    ],

    walkthrough: [
      { title: '1 · Melt it', ask: 'You heat ice steadily. Does its temperature keep rising while it melts?', reveal: 'No — it sits at 0 °C until the last of the ice is gone. The energy goes into pulling the molecules out of their lattice, not into making them faster. Same molecules before and after: a physical change.', params: preset({ setup: 'physical', phys: 'ice' }) },
      { title: '2 · Dissolve it', ask: 'Salt dissolves and the water now conducts electricity. Is that a new substance?', reveal: 'No. The ions were there in the crystal; water just lets them move. Boil the water away and the same cubic crystals, melting at 801 °C, come back.', params: preset({ setup: 'physical', phys: 'salt', pmass: 10, pwater: 40, power: 600, undo: true, lapse: 60 }) },
      { title: '3 · React it', ask: 'Magnesium disappears in acid. Where did its atoms go?', reveal: 'Into the solution, as Mg²⁺ ions — and the hydrogen ions of the acid paired up as H₂ gas. Count the atoms on the card: the same number of each before and after. New substances, the same atoms.', params: preset({ setup: 'chemical', rxn: 'mg', mMg: 0.1, conc: 1, vol: 50 }) },
      { title: '4 · No sign at all', ask: 'Mix very dilute acid and alkali. Nothing bubbles, nothing changes colour. Did they react?', reveal: 'Yes — the water rose by 0.04 °C, below the thermometer’s 1 °C step. Add universal indicator and the colour change shows it. No visible sign is not proof of no reaction.', params: preset({ setup: 'signs', rxn: 'neut', conc: 0.01, vol: 25, conc2: 0.01, vol2: 25, thermo: 'glass', lapse: 1 }) },
      { title: '5 · Look-alikes', ask: 'Warmed limewater and limewater with breath in it both go milky. Same change?', reveal: 'No. Warm limewater dissolves less calcium hydroxide, so some comes out — cool it and it clears. Breath makes calcium carbonate, a new substance that stays and fizzes in acid.', params: preset({ setup: 'confusing', pair: 'cloudy', dtest: 'cool' }) },
      { title: '6 · Properties', ask: 'Iron and sulfur are heated together. Can a magnet still pull the iron out?', reveal: 'Only what was left over. The black solid is iron(II) sulfide, a new substance with its own density (4.84) and melting point (1194 °C), and it gives rotten-egg gas with acid instead of hydrogen.', params: preset({ setup: 'properties', pmat: 'fes', mA: 7, mB: 2, ptest: 'magnet' }) },
      { title: '7 · Back again?', ask: 'Blue copper sulfate turns white when heated. Is turning it back blue proof that it was physical?', reveal: 'No. Water leaves the crystal and rejoins it — new substances both ways, with heat taken in and given out. Reversibility is a clue, never a rule; egg white is chemical and never goes back.', params: preset({ setup: 'reversible', rsamp: 'cuso4', rmass: 2.5, rtemp: 300, rtime: 240, back: true }) },
      { title: '8 · Name it', ask: 'Mystery F gives a gas that puts out a flame. Is it carbon dioxide?', reveal: 'Not yet — nitrogen puts out a flame too. Only limewater turning milky says carbon dioxide. Then measure the solid more than one way before naming the reaction.', params: preset({ setup: 'unknown', mystery: 'F', gtest: 'lit', tDen: true, tMelt: false, tSol: false, tLook: false }) }
    ],

    quiz: [
      { q: 'Which of these is a chemical change?', options: ['iron rusting', 'ice melting', 'salt dissolving', 'water boiling'], answer: 0, why: 'Rust is iron oxide, a new substance. The other three leave the same substance, arranged differently.' },
      { q: 'A reaction mixture gets cold. What does that show, on its own?', options: ['energy moved — but dissolving can do that too', 'a chemical change happened', 'no reaction happened', 'a gas was made'], answer: 0, why: 'Ammonium nitrate dissolving gets just as cold. Test what is there afterwards.' },
      { q: 'Heating 7 g of iron with 2 g of sulfur leaves', options: ['iron sulfide and some iron', 'only iron sulfide', 'iron sulfide and some sulfur', 'a mixture of iron and sulfur'], answer: 0, why: '2 g of sulfur needs only 3.5 g of iron. The rest stays as iron — the magnet finds it.' },
      { q: 'Blue copper sulfate turns white on heating and blue again with water. The heating was', options: ['a chemical change that can be reversed', 'a physical change, because it reverses', 'not a change at all', 'melting'], answer: 0, why: 'Water leaves and rejoins the crystal; heat is taken in and given back.' },
      { q: 'A gas relights a glowing splint. It is', options: ['oxygen', 'hydrogen', 'carbon dioxide', 'nitrogen'], answer: 0, why: 'Only oxygen makes the ember burst into flame; hydrogen pops with a lit splint.' },
      { q: 'Two solutions are mixed and nothing visible happens. Which is true?', options: ['a reaction might still have happened', 'no reaction happened', 'they must be the same', 'they are both water'], answer: 0, why: 'Dilute acid and alkali neutralise with no visible sign; only a thermometer or an indicator shows it.' }
    ],

    notes: '<p><b>Physical or chemical?</b> A physical change (melting, boiling, dissolving, crushing) leaves the same substance: the same particles, arranged differently, with the same melting point and density when you get it back. A chemical change makes new substances: the atoms change partners, and the new substance has new properties.</p>' +
      '<p><b>The evidence.</b> Gas given off, a temperature change, a colour change, a precipitate, light — each is a clue, and each can be faked by a physical change (boiling bubbles, dissolving gets cold, dyes mix green, warm limewater clouds, a hot wire glows). And a real reaction can be too weak to show any sign at all.</p>' +
      '<p><b>Decide by testing.</b> Test the gas (pop: hydrogen; relights: oxygen; limewater milky: carbon dioxide), weigh, filter, evaporate, and measure the properties of what is left. Match them in a property table — more than one property — and only then name the reaction: reactants → products.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “If you can get it back, it was a physical change.” Copper sulfate and ammonium chloride go back — by chemical changes. Ask whether a new substance formed, not whether it reverses.</div>'
  });

  L.models = L.models || {};
  L.models['g7b-change-detective'] = { chemRun, rowAt, yieldOf, signsOf, physRun, kappaNaCl, condOf, pairOf, decides, limeSol, propRun, propTable, revRun, thermogram, matchScores, gasResult, gasGuess, gasMassPer100, nameOf,
    RXN, SUB, GAS, PMAT, RSAMP, MYST, EV, atomCount, VM, FAR, BASE: () => preset({}) };
})(window.InsightLab);
