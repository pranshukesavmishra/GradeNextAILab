/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-1  The Microscope — Discovering Cells
   (B1.1 Cell theory; B1.2 Discovering cells; B1.3 Living vs nonliving;
    B1.4 Unicellular organisms; B1.5 Multicellular organisms;
    B1.6 Microscopic scale)

   One microscope on a bench, six investigations. What the eyepiece shows is
   computed: each specimen is drawn in micrometres as the light it lets
   through, and blurred by the blur the optics give — the objective's
   aperture sets the finest detail, 1.22λ ÷ (NA of the objective + NA of the
   condenser), the illuminating cone spreads whatever lies off the focal
   plane, the field is the eyepiece's field stop over the magnification, and
   the image comes out turned round. The living things obey their own
   physics: water molecules jostle small particles (Stokes–Einstein), a cell
   that stops swimming stops within a quarter of a micrometre (Reynolds number
   0.2), water leaks into a freshwater cell as fast as its contractile vacuole
   can bail it out, a colony that stops beating its flagella sinks.
     hooke        — Hooke's cork (1665) and Leeuwenhoek's animalcules (1676),
                    through their own instruments; count cells as Hooke did.
     theory       — cells from cells: count the phases in an onion root tip;
                    plant and animal cells side by side, as Schwann compared them.
     living       — alive or not? yeast, pollen, rock dust, salt: which grow,
                    which feed, which only jiggle.
     unicellular  — one cell that does everything: moves, eats, bails water, senses.
     multicellular — from Chlamydomonas to Volvox: cells that share the work.
     scale        — how small is small: calibrate, measure, and find the limit.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.MICRO, MEAS, R3 and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, MI = () => window.MICRO;

  /* ============================================================
     THE MICROSCOPE — a standard school instrument
     Achromat objectives (Olympus PLN figures): 4×/0.10 (working distance
     18.5 mm), 10×/0.25 (10.6), 40×/0.65 (0.6), 100×/1.25 in oil (0.15).
     Eyepieces 10× (field number 18 mm), 15× (13), 20× (10); an Abbe
     condenser whose iris sets its NA up to 0.9; a camera that can enlarge
     the image further. White light counts as 550 nm.
     ============================================================ */
  const OBJ = {
    4: { NA: 0.10, WD: 18.5, n: 1, ring: 'red' },
    10: { NA: 0.25, WD: 10.6, n: 1, ring: 'yellow' },
    40: { NA: 0.65, WD: 0.6, n: 1, ring: 'light blue' },
    100: { NA: 1.25, WD: 0.15, n: 1.515, ring: 'white', oil: true }
  };
  const EYEPIECE = { 10: 18, 15: 13, 20: 10 };
  const FILTER = { white: 550, blue: 450, green: 546, red: 650 };
  const LAMP_COL = { white: '#FFF6E6', blue: '#C8D8FF', green: '#D4F2C8', red: '#FFD0C4' };
  const NA_COND = 0.9, EYE_RES = 73;                     // the eye resolves about 73 µm at 250 mm (one minute of arc)

  /* everything the optics decide, for the modern microscope */
  function optics(p) {
    const ob = OBJ[p.obj] || OBJ[10], lam = (FILTER[p.filter] || 550) / 1000, zoom = p.zoom || 1, eye = p.eye || 10;
    const noOil = p.obj === 100 && !p.oil;
    let NAo = ob.NA, n = ob.n;
    if (noOil) { NAo = 0.95; n = 1; }                   // through air no ray steeper than 72° gets out of the coverslip
    const NAc = Math.min(NAo, Math.max(0.02, p.cond == null ? 0.2 : p.cond));
    const r0 = 1.22 * lam / (NAo + NAc);                // Abbe, with the condenser
    const ab = noOil ? 0.9 : 0;                         // the objective is corrected for oil: in air, spherical aberration
    const r = Math.sqrt(r0 * r0 + ab * ab);
    const M = p.obj * eye * zoom;
    const field = (EYEPIECE[eye] || 18) * 1000 / (p.obj * zoom);   // µm across the field stop
    // light reaching the eye: the illuminating NA over the magnification, squared; the dimmer is logarithmic
    const lampPow = Math.pow(2, 8 * ((p.lamp == null ? 0.5 : p.lamp) - 0.5));
    const expo = lampPow * Math.pow(NAc / (p.obj * eye), 2) / Math.pow(0.175 / 100, 2) * (noOil ? 0.5 : 1) * (p.filter && p.filter !== 'white' ? 0.5 : 1);
    const bright = clamp(1 + 0.22 * Math.log2(Math.max(1e-6, expo)), 0.03, 1.6);
    const pc = clamp(1.12 - NAc / NAo, 0.1, 1);         // unstained edges show as the iris closes
    const th = Math.asin(Math.min(0.99, NAc / n)), sd = 0.344 * r;
    const sigma = dz => Math.sqrt(sd * sd + Math.pow(Math.abs(dz) * Math.tan(th) / 2, 2));
    return { NAo, NAc, lam, r, M, field, fov: field, expo, bright, pc, sigma, dof: lam * n / (NAo * NAo), useful: [500 * NAo, 1000 * NAo], empty: M > 1000 * NAo, low: M < 500 * NAo, noOil, haze: noOil ? 0.5 : 0, invert: true };
  }

  /* the two instruments that found cells, as a museum would describe them.
     Hooke's is an estimate: a stopped-down objective, about NA 0.06, and colour fringes.
     Leeuwenhoek's best surviving lens (Utrecht): about 270×, finest detail 1.35 µm (van Zuylen, 1981). */
  const INSTR = {
    hooke: { name: "Hooke's microscope, 1665", M: 50, r: 5, field: 2600, invert: true, haze: 0.18, lamp: '#FFE4B0' },
    leeu: { name: "Leeuwenhoek's lens, 1670s", M: 270, r: 1.35, field: 640, invert: false, haze: 0.05, lamp: '#FFF2DA' }
  };
  function instrOptics(p) {
    if (p.instr === 'modern') return optics(p);
    const I = INSTR[p.instr] || INSTR.hooke, sd = 0.344 * I.r;
    return { NAo: 0.61 * 0.55 / I.r, NAc: 0.61 * 0.55 / I.r, lam: 0.55, r: I.r, M: I.M, field: I.field, fov: I.field, bright: 0.95, pc: 0.7, sigma: dz => Math.sqrt(sd * sd + Math.pow(Math.abs(dz) * 0.12, 2)), dof: 8, useful: [I.M, I.M], empty: false, low: false, haze: I.haze, invert: I.invert, historic: I };
  }

  /* ============================================================
     HOOKE'S COUNT — "about threescore of these small Cells placed
     end-ways in the eighteenth part of an Inch": 1080 an inch, so
     1,166,400 in a square inch and 1,259,712,000 in a cubic inch.
     The lab counts the walls the graticule's line crosses.
     ============================================================ */
  const HOOKE = { perInch: 1080, perSqInch: 1166400, perCuInch: 1259712000 };
  function corkCount(slide, cx, cy, len) {
    if (!slide || !slide.cells) return { n: 0, len: 0, perInch: 0, perCu: 0 };
    const x0 = cx - len / 2, x1 = cx + len / 2;
    let n = 0;
    slide.cells.forEach(cl => {
      if (Math.abs(cl.cy - cy) > 30) return;
      const v = cl.v; let hit = false, lo = 1e9, hi = -1e9;
      for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; if ((a[1] - cy) * (b[1] - cy) <= 0 && a[1] !== b[1]) { const x = a[0] + (cy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]); lo = Math.min(lo, x); hi = Math.max(hi, x); hit = true; } }
      if (hit && hi > x0 && lo < x1) n += (Math.min(hi, x1) - Math.max(lo, x0)) / (hi - lo);
    });
    const perInch = n / len * 25400;
    return { n, len, perInch, perSq: perInch * perInch, perCu: perInch * perInch * perInch };
  }

  /* ============================================================
     THE ROOT TIP — cells from cells
     An onion root tip's cells are spread through their cycle; a cell spends
     about 90 % of it in interphase, and mitosis (prophase 50 %, metaphase
     15 %, anaphase 10 %, telophase 25 % of it) takes the rest. The whole
     cycle is about 20 h at 20 °C and halves for every 10 °C warmer (Q10 = 2).
     If the cells are spread evenly through the cycle, the share of cells in
     a phase is the share of time spent in it.
     ============================================================ */
  const PHASES = ['I', 'P', 'M', 'A', 'T'];
  const PHASE_NAME = { I: 'interphase', P: 'prophase', M: 'metaphase', A: 'anaphase', T: 'telophase' };
  const PHASE_FRAC = { I: 0.9, P: 0.05, M: 0.015, A: 0.01, T: 0.025 };
  const cycleHours = Tc => 20 * Math.pow(2, (20 - Tc) / 10);
  function fieldsOf(n, fov) { const out = [[0, 0]]; const step = fov * 0.95; let k = 1; for (let ring = 1; out.length < n; ring++) for (let i = -ring; i <= ring && out.length < n; i++) for (let j = -ring; j <= ring && out.length < n; j++) { if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue; out.push([i * step, j * step * 0.6]); k++; } return out; }
  function rootCount(slide, fields, fov) {
    const tally = { I: 0, P: 0, M: 0, A: 0, T: 0 }, R = fov / 2;
    if (!slide || !slide.cells) return { tally, N: 0 };
    fields.forEach(([fx, fy]) => slide.cells.forEach(cl => { if ((cl.cx - fx) * (cl.cx - fx) + (cl.cy - fy) * (cl.cy - fy) < R * R) tally[cl.phase]++; }));
    const N = PHASES.reduce((u, k) => u + tally[k], 0);
    return { tally, N };
  }
  function rootEstimate(tally, N, Tc) {
    const T = cycleHours(Tc), est = {}, se = {};
    PHASES.forEach(k => { const f = N ? tally[k] / N : 0; est[k] = f * T; se[k] = N ? Math.sqrt(f * (1 - f) / N) * T : 0; });
    const mi = N ? (N - tally.I) / N : 0;
    return { T, est, se, mi, mitosis: mi * T };
  }

  /* ============================================================
     ALIVE OR NOT
     Brownian motion: D = kT ÷ (6πηa), water's viscosity by the Vogel
     equation; a 1 µm particle wanders about 1.3 µm in a second, warm or
     boiled, living or mineral — as Brown found in 1827–28.
     Yeast: buds every 1.5 h at 30–32 °C with sugar (cardinal temperatures
     5, 32, 45 °C; Monod on sugar, Ks 0.2 g/L); ferments the sugar to CO₂;
     a living cell turns methylene blue colourless, a dead one stays blue;
     above 50 °C it dies (boiling: at once).
     Salt: a drop of brine dries by evaporation (Hu and Larson's rate for a
     sessile drop), and NaCl comes out at 0.359 g for every gram of water
     that leaves; above 75 % humidity brine does not dry and salt dissolves.
     ============================================================ */
  const KB = 1.380649e-23;
  const viscosity = Tc => 2.414e-5 * Math.pow(10, 247.8 / (Tc + 273.15 - 140));
  const diffusion = (d_um, Tc, eta) => KB * (Tc + 273.15) / (6 * Math.PI * (eta || viscosity(Tc)) * d_um * 0.5e-6) * 1e12;   // µm²/s
  function cardinal(T, Tmin, Topt, Tmax) { if (T <= Tmin || T >= Tmax) return 0; return (T - Tmax) * (T - Tmin) * (T - Tmin) / ((Topt - Tmin) * ((Topt - Tmin) * (T - Topt) - (Topt - Tmax) * (Topt + Tmin - 2 * T))); }
  const YEAST_MU = Math.LN2 / 1.5;                                  // per hour, at the optimum
  const yeastRate = (Tc, sugar) => YEAST_MU * cardinal(Tc, 5, 32, 45) * sugar / (0.2 + sugar);   // per hour
  const yeastDeath = Tc => Tc < 50 ? 0 : Math.pow(10, (Tc - 60) / 5) * 0.4;   // per second: D(60 °C) ≈ 6 s
  const AW_NACL = 0.753, SOL_NACL = 0.359, RHO_NACL = 2.165;
  function evapRate(Rmm, RH, Tc) {                                  // g/s of water from a sessile brine drop, contact angle 35°
    const Dv = 2.42e-5 * Math.pow((Tc + 273.15) / 293.15, 1.75), psat = 610.94 * Math.exp(17.625 * Tc / (Tc + 243.04));
    const cs = psat * 0.018015 / (8.314 * (Tc + 273.15)), th = 0.61;
    return Math.PI * Rmm * 1e-3 * Dv * cs * (AW_NACL - RH / 100) * (0.27 * th * th + 1.30) * 1000;
  }

  /* ============================================================
     ONE CELL THAT DOES EVERYTHING
     Water leaks into a freshwater protist through its membrane in
     proportion to the difference in dissolved particles (about 64 mOsm
     inside, Stock et al. 2001, against a pond's 5); the contractile vacuole
     bails it out. Calibrated so pond water fires each of Paramecium's two
     vacuoles every 10 s; the period grows with salt and the vacuole stops
     near 0.19 % NaCl, where the cell starts to shrink instead.
     Food vacuoles of Congo-red yeast turn from red to blue as they acidify
     to about pH 3 in five minutes, and back as digestion ends.
     Swimming is at Reynolds number 0.2: speed falls as the water thickens
     (methyl cellulose), and a cell that stops beating stops dead.
     ============================================================ */
  const C_IN = 64, POND = 5;
  const osmOf = pct => POND + pct * 10 / 58.44 * 2 * 0.93 * 1000;  // % NaCl → mOsm, osmotic coefficient 0.93
  const PROTIST = {
    paramecium: { name: 'Paramecium', L: 200, v: 1000, cvV: 700, cvT0: 10, n: 2 },
    euglena: { name: 'Euglena', L: 55, v: 70, cvV: 60, cvT0: 16, n: 1 },
    amoeba: { name: 'Amoeba', L: 400, v: 1.5, cvV: 3000, cvT0: 90, n: 1 },
    chlamy: { name: 'Chlamydomonas', L: 10, v: 110, cvV: 8, cvT0: 12, n: 2 }
  };
  function cvPeriod(org, pct) { const P = PROTIST[org], k = 1 / (P.cvT0 * (C_IN - POND)), J = k * (C_IN - osmOf(pct)); return J > 0 ? 1 / J : Infinity; }
  const VISC = { water: 1, thin: 8, thick: 40 };                   // mPa·s: water, and two strengths of methyl cellulose
  const fvPH = age => { const m = age / 60; const acid = 7 - 4 * (1 - Math.exp(-m / 1.5)); return m < 8 ? acid : acid + (7 - acid) * (1 - Math.exp(-(m - 8) / 5)); };
  const FV_LIFE = 25 * 60, FV_EVERY = 75;                          // a vacuole lasts about 25 min; one forms every 75 s when food is plentiful

  /* ============================================================
     FROM ONE CELL TO MANY — the volvocine algae
     Each colony is a ball (or plate) of Chlamydomonas-like cells in jelly.
     Sinking by Stokes: 2Δρ g R² ÷ 9η, the excess density that of the cells
     (1.05 g/cm³) spread through the jelly; swimming speeds are measured
     values (about). Chlamydomonas, Gonium, Pandorina and Eudorina: every
     cell can divide into a new colony. Pleodorina: the front half cannot.
     Volvox: about 2000 somatic cells that only swim, 16 gonidia that only
     divide — and a cell that stops to divide loses its flagella, so a colony
     whose cells all divided at once would sink.
     ============================================================ */
  const COLONY = {
    chlamy: { name: 'Chlamydomonas', N: 1, R: 5, cellD: 10, germ: 1, swim: 110, shape: 'one cell' },
    gonium: { name: 'Gonium', N: 16, R: 30, cellD: 10, germ: 1, swim: 40, shape: 'a flat plate of 16' },
    pandorina: { name: 'Pandorina', N: 16, R: 25, cellD: 12, germ: 1, swim: 75, shape: 'a tight ball of 16' },
    eudorina: { name: 'Eudorina', N: 32, R: 50, cellD: 13, germ: 1, swim: 100, shape: 'a hollow ball of 32' },
    pleodorina: { name: 'Pleodorina', N: 128, R: 100, cellD: 12, germ: 0.5, swim: 150, shape: 'a hollow ball of 128' },
    volvox: { name: 'Volvox', N: 2016, R: 250, cellD: 5, germ: 16 / 2016, swim: 220, shape: 'a hollow ball of about 2000' }
  };
  function sinkSpeed(c, eta) {
    const C = COLONY[c], Vc = C.N * Math.PI / 6 * Math.pow(C.cellD, 3) + (c === 'volvox' ? 16 * Math.PI / 6 * Math.pow(30, 3) : 0), Vcol = 4 / 3 * Math.PI * Math.pow(C.R, 3);
    const drho = 50 * Math.min(1, Vc / Vcol);
    return 2 * drho * 9.81 * Math.pow(C.R * 1e-6, 2) / (9 * (eta || 1e-3)) * 1e6;   // µm/s
  }

  /* ============================================================
     THE COUNTABLE SLIDES — built here, so the counts are the model's own
     ============================================================ */
  const hash2 = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  function blobIn(x, y, ax, ay, s) { const th = Math.atan2(y / ay, x / ax), r = Math.hypot(x / ax, y / ay); return r < 1 + 0.1 * Math.sin(3 * th + s) + 0.07 * Math.sin(5 * th + 2 * s) + 0.04 * Math.sin(9 * th + s); }
  /* Hooke's cork, cut across: a honeycomb whose corners are shared and shaken a little; 23.5 µm apart along the count */
  function corkCells(seed) {
    const r = rng(seed), a = 25400 / HOOKE.perInch, s = r() * 6, h = a * Math.sqrt(3) / 2, R0 = a / Math.sqrt(3), cells = [];
    const q = 0.01 * a, jit = (x, y) => { const qx = Math.round(x / q), qy = Math.round(y / q); return [x + (hash2(qx, qy, seed) - 0.5) * a * 0.3, y + (hash2(qy, qx, seed + 7) - 0.5) * a * 0.3]; };
    for (let j = -40; j <= 40; j++) for (let i = -70; i <= 70; i++) {
      const cx = i * a + (j & 1 ? a / 2 : 0), cy = j * h;
      if (!blobIn(cx, cy, 1300, 640, s)) continue;
      const v = []; for (let m = 0; m < 6; m++) { const an = Math.PI / 6 + m * Math.PI / 3; v.push(jit(cx + Math.cos(an) * R0, cy + Math.sin(an) * R0)); }
      cells.push({ cx, cy, v, dark: hash2(i, j, seed + 3) < 0.07 });
    }
    return cells;
  }
  /* a squashed root tip: files of small cells, each dealt a phase in proportion to the time spent in it */
  function rootCells(seed) {
    const r = rng(seed), cells = [];
    const pick = u => { let acc = 0; for (const k of PHASES) { acc += PHASE_FRAC[k]; if (u < acc) return k; } return 'I'; };
    let y = -520;
    while (y < 520) {
      const h = 15 + r() * 4; let x = -900 + r() * 10;
      while (x < 900) {
        const w = 16 + r() * 12, cx = x + w / 2, cy = y + h / 2;
        if (blobIn(cx, cy, 880, 500, seed)) {
          const j = 2.6, v = [[x + (r() - 0.5) * j, y + (r() - 0.5) * j], [x + w + (r() - 0.5) * j, y + (r() - 0.5) * j], [x + w + (r() - 0.5) * j, y + h + (r() - 0.5) * j], [x + (r() - 0.5) * j, y + h + (r() - 0.5) * j]];
          cells.push({ cx, cy, w, h, v, a: (r() - 0.5) * 0.12, phase: pick(r()), f: r(), seed: Math.floor(r() * 1e6) });
        }
        x += w;
      }
      y += h;
    }
    return cells;
  }

  /* ============================================================
     SET-UPS, PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'hooke', label: "Hooke's cork and Leeuwenhoek's animalcules", teaches: ['B1.2'] },
    { value: 'theory', label: 'Every cell from a cell', teaches: ['B1.1'] },
    { value: 'living', label: 'Alive or not?', teaches: ['B1.3'] },
    { value: 'unicellular', label: 'One cell that does everything', teaches: ['B1.4'] },
    { value: 'multicellular', label: 'From one cell to many', teaches: ['B1.5'] },
    { value: 'scale', label: 'How small is small?', teaches: ['B1.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const scopeIs = S => S.p.setup !== 'hooke' || S.p.instr === 'modern';
  const BASE = {
    setup: 'hooke', seed: 1,
    obj: 10, eye: 10, zoom: 1, filter: 'white', cond: 0.18, lamp: 0.5, oil: true, focus: 0, sx: 0, sy: 0, grat: false, follow: true,
    instr: 'hooke', hspec: 'cork', countLine: true,
    tspec: 'root', tempR: 20, fields: 4, orcein: true, mark: true,
    lspec: 'yeast', temp: 25, sugar: 20, boil: false, mb: false, rh: 45, lapse: 60,
    org: 'paramecium', salt: 0, food: true, light: 'off', visc: 'thin',
    colony: 'volvox', divide: false, split: false,
    sspec: 'micrometer'
  };
  /* the lamp setting that gives a comfortable image for an objective and an iris (exposure 1) */
  function lampFor(q) { const NAo = (OBJ[q.obj] || OBJ[10]).NA, NAc = Math.min(NAo, Math.max(0.02, q.cond)), e = Math.pow(NAc / (q.obj * (q.eye || 10)), 2) / Math.pow(0.175 / 100, 2) * (q.filter && q.filter !== 'white' ? 0.5 : 1); return clamp(0.5 - Math.log2(e) / 8, 0.05, 1); }
  function preset(o) { const q = Object.assign({}, BASE, o, { pre: 1 }); if (o.lamp == null) q.lamp = +lampFor(q).toFixed(2); return q; }   // pre: set by a preset, so setup keeps its settings
  const SETUP_DEFAULTS = {
    hooke: { instr: 'hooke', hspec: 'cork', obj: 10, cond: 0.18, lamp: 0.5, zoom: 1, eye: 10, grat: false },
    theory: { tspec: 'root', obj: 40, cond: 0.45, lamp: 0.62, zoom: 1, eye: 10, grat: false },
    living: { lspec: 'yeast', obj: 100, cond: 0.6, lamp: 0.8, zoom: 1, eye: 10, oil: true, lapse: 600, temp: 30, grat: false },
    unicellular: { org: 'paramecium', obj: 40, cond: 0.4, lamp: 0.62, zoom: 1, eye: 10, follow: true, grat: false },
    multicellular: { colony: 'volvox', obj: 10, cond: 0.18, lamp: 0.5, zoom: 1, eye: 10, follow: true, grat: false },
    scale: { sspec: 'micrometer', obj: 10, cond: 0.18, lamp: 0.5, zoom: 1, eye: 10, grat: true }
  };
  const setupDefaults = S => { Object.assign(S.p, SETUP_DEFAULTS[S.p.setup] || {}, { focus: 0, sx: 0, sy: 0 }); S.p.lamp = +lampFor(S.p).toFixed(2); };

  /* where each slide is worth looking first, and how it is prepared */
  const SPEC = {
    cork: { stain: 'none', tint: '#B98548' }, pepper: { stain: 'none', tint: '#B8C890' }, plaque: { stain: 'none', tint: '#E4DCCB' },
    root: { stain: 'orcein', tint: '#C0507E' }, elodea: { stain: 'none', tint: '#58A048' }, cheek: { stain: 'mb', tint: '#3E64C0' },
    yeast: { stain: 'none', tint: '#D8C79A' }, pollen: { stain: 'none', tint: '#D8B45A' }, rock: { stain: 'none', tint: '#B8B0A0' }, salt: { stain: 'none', tint: '#E8ECEE' },
    micrometer: { stain: 'none', tint: '#606468' }, letter: { stain: 'none', tint: '#D8CBB0' }, hair: { stain: 'none', tint: '#8A5A30' }, blood: { stain: 'wright', tint: '#D07888' },
    bacteria: { stain: 'cv', tint: '#7A48B0' }, diatoms: { stain: 'none', tint: '#C8CCC4' }, virus: { stain: 'none', tint: '#E0E4E8' }, leaf: { stain: 'sf', tint: '#6A9A50' },
    pond: { stain: 'none', tint: '#B0C890' }
  };
  function specOf(p) {
    switch (p.setup) {
      case 'hooke': return p.hspec;
      case 'theory': return p.tspec;
      case 'living': return p.lspec;
      case 'unicellular': return 'pond';
      case 'multicellular': return p.colony === 'leaf' ? 'leaf' : 'pond';
      default: return p.sspec;
    }
  }
  function stainOf(p) {
    const k = specOf(p);
    if (p.setup === 'theory' && k === 'root') return p.orcein ? 'orcein' : 'none';
    if (p.setup === 'living' && k === 'yeast') return p.mb ? 'mb' : 'none';
    return (SPEC[k] || SPEC.pond).stain;
  }
  const MOUNT = { iodine: '#FBF3DE', mb: '#EEF3FD', orcein: '#FCEFF4', cv: '#F6F1FB', wright: '#FBF4F6', sf: '#F6FAF2', none: '#FFFFFF' };
  function opticsOf(p) { return p.setup === 'hooke' ? instrOptics(p) : optics(p); }

  /* ============================================================
     SETTING UP THE SLIDE AND WHAT LIVES ON IT
     ============================================================ */
  function swimmerOf(kind, x, y, r, extra) { return Object.assign({ kind, x, y, z: (r() - 0.5) * 16, a: r() * TAU, seed: Math.floor(r() * 1e5), turn: 0, back: 0 }, extra || {}); }
  function pondLife(S, r, mix) {
    const out = [];
    const add = (n, f) => { for (let i = 0; i < n; i++) out.push(f(i)); };
    const spread = (R) => { const a = r() * TAU, d = Math.sqrt(r()) * Math.min(R, mix.R || R); return [Math.cos(a) * d, Math.sin(a) * d]; };
    if (mix.para) add(mix.para, () => { const [x, y] = spread(900); return swimmerOf('paramecium', x, y, r, { L: 190 + r() * 40, W: 52 + r() * 8, h: 45, v0: PROTIST.paramecium.v, cv: [r(), r()], fv: [] }); });
    if (mix.eug) add(mix.eug, () => { const [x, y] = spread(700); return swimmerOf('euglena', x, y, r, { L: 50 + r() * 10, W: 11 + r() * 2, h: 12, v0: PROTIST.euglena.v, meta: 0.15 }); });
    if (mix.chl) add(mix.chl, () => { const [x, y] = spread(700); return swimmerOf('chlamy', x, y, r, { r: 5, h: 10, v0: PROTIST.chlamy.v }); });
    if (mix.vort) add(mix.vort, () => { const [x, y] = spread(500); return { kind: 'vorticella', x, y, z: 0, h: 30, a: r() * TAU, snap: 0, t0: r() * 20, seed: Math.floor(r() * 1e5), fixed: true }; });
    if (mix.diat) add(mix.diat, () => { const [x, y] = spread(800); return { kind: 'diatom', x, y, z: -10 + r() * 20, h: 8, a: r() * TAU, L: 50 + r() * 60, W: 10 + r() * 6, striae: 0.6, living: true, fixed: true }; });
    if (mix.bact) add(mix.bact, () => { const [x, y] = spread(mix.bactR || 600); const sp = r() < (mix.spiral || 0); return swimmerOf('swimmer', x, y, r, { L: sp ? 8 + r() * 6 : 2 + r() * 2.5, w: 0.8, spiral: sp, h: 3, v0: sp ? 25 : 20 + r() * 25 }); });
    return out;
  }
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    // a new set-up chosen from the list, from the tabs or from a link opens with its own microscope settings;
    // a preset, a problem or a walkthrough step brings its own
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) setupDefaults(S);
    p.pre = 0; S._lastSetup = p.setup;
    const r = rng(1000 + p.seed * 7919 + SETUPS.findIndex(s => s.value === p.setup) * 131);
    S.t = 0; S.ts = 0; S.hist = []; S.msd = null; S._key = null; S._rng = null; S._lastTrack = 0; S._root = null; S._cork = null; S.shrink = 0;
    const M = MI(), k = specOf(p);
    S.dyn = []; S.slide = null; S.main = null; S.cells = null;
    // the countable slides are the model's own; the rest are mounts for what lives in them
    if (k === 'cork') S.cells = corkCells(p.seed);
    if (k === 'root') S.cells = rootCells(p.seed);
    if (M) S.slide = M.slide(k, p.seed, { cells: S.cells });
    if (p.setup === 'hooke' && k === 'pepper') S.dyn = pondLife(S, r, { para: 5, eug: 10, chl: 24, vort: 4, diat: 6, bact: 260, bactR: 700, R: 420 });
    if (p.setup === 'hooke' && k === 'plaque') S.dyn = pondLife(S, r, { bact: 900, bactR: 420, spiral: 0.12 });
    if (p.setup === 'living') livingSetup(S, r);
    if (p.setup === 'unicellular') protistSetup(S, r);
    if (p.setup === 'multicellular') colonySetup(S, r);
    if (!S.cam || S.camFor !== p.setup) { const h = HOMES[p.setup === 'hooke' ? 'hooke' : 'scope']; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: h.fov }); S.cam.minDist = h.min; S.cam.maxDist = h.max; S.camFor = p.setup; }
  }

  /* ---------- alive or not ---------- */
  function livingSetup(S, r) {
    const p = S.p, k = p.lspec;
    S.live = { yeastN: 0, dead: 0, co2: 0, water: 0, salt: 0, crystals: 0, grew: 0, t0: 0 };
    if (k === 'yeast') {
      for (let i = 0; i < 70; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 110; S.dyn.push({ kind: 'yeast', x: Math.cos(a) * d, y: Math.sin(a) * d, z: -2, h: 6, a: r() * TAU, rx: 2.4 + r() * 0.6, ry: 2 + r() * 0.4, bud: 0, ba: r() * TAU, prog: r(), dead: p.boil || r() < 0.04, track: [] }); }
    } else if (k === 'pollen') {
      for (let i = 0; i < 5; i++) { const a = r() * TAU, d = 60 + r() * 380; S.dyn.push({ kind: 'pollen', x: Math.cos(a) * d, y: Math.sin(a) * d, z: -30, h: 70, a: r() * TAU, s: 95 + r() * 15, seed: i + 1, burst: r() < 0.6, fixed: true }); }
      for (let i = 0; i < 160; i++) { const g = S.dyn[i % 5], a = r() * TAU, d = 55 + r() * 120; S.dyn.push({ kind: 'particle', x: g.x + Math.cos(a) * d, y: g.y + Math.sin(a) * d, z: (r() - 0.5) * 20, h: 3, d: r() < 0.7 ? 1 + r() * 1.5 : 3.5 + r() * 2.5, el: 1 + r() * 0.9, a: r() * TAU, track: [] }); }
    } else if (k === 'rock') {
      const types = ['quartz', 'quartz', 'quartz', 'feldspar', 'mica'];
      for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 700, R = 18 + r() * r() * 110, v = []; const n = 5 + Math.floor(r() * 4); for (let j = 0; j < n; j++) { const b = j / n * TAU + (r() - 0.5) * 0.4; v.push([Math.cos(b) * R * (0.65 + r() * 0.45), Math.sin(b) * R * (0.65 + r() * 0.45)]); } S.dyn.push({ kind: 'grain', type: types[Math.floor(r() * types.length)], x: Math.cos(a) * d, y: Math.sin(a) * d, z: -R, h: 2 * R, a: r() * TAU, r: R, v, fixed: true }); }
      for (let i = 0; i < 180; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 600; S.dyn.push({ kind: 'particle', x: Math.cos(a) * d, y: Math.sin(a) * d, z: (r() - 0.5) * 20, h: 3, d: 0.6 + r() * r() * 4, el: 1 + r() * 0.8, a: r() * TAU, rock: true, track: [] }); }
    } else if (k === 'salt') {
      S.salt = { R: 560, water: 0.12e-3 * 0.736, dissolved: 0.12e-3 * 0.264, xs: [], edge: [], grew: 0 };   // 0.1 µL of saturated brine (1.2 g/mL): grams of water and of salt
      for (let i = 0; i < 9; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 420; S.salt.xs.push({ kind: 'salt', x: Math.cos(a) * d, y: Math.sin(a) * d, z: -2, h: 20, a: (r() - 0.5) * 0.6, m: 2e-9 * (0.5 + r()), e: 0 }); }
      S.dyn.push({ kind: 'dropEdge', x: 0, y: 0, R: 560, z: 0, h: 60, fixed: true }, { kind: 'saltCrust', x: 0, y: 0, pts: S.salt.edge, z: 0, h: 20, r: 700, fixed: true });
      S.salt.xs.forEach(c => { c.e = 1e4 * Math.cbrt(c.m / RHO_NACL); S.dyn.push(c); });
    }
  }
  /* ---------- one cell that does everything ---------- */
  function protistSetup(S, r) {
    const p = S.p, org = p.org;
    const n = { paramecium: 3, euglena: 26, amoeba: 1, chlamy: 34 }[org];
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = i === 0 ? 0 : Math.sqrt(r()) * (org === 'amoeba' ? 0 : 420);
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      let it;
      if (org === 'paramecium') it = swimmerOf('paramecium', x, y, r, { L: 205, W: 56, h: 45, v0: PROTIST.paramecium.v, cv: [0.2, 0.7], fv: [] });
      else if (org === 'euglena') it = swimmerOf('euglena', x, y, r, { L: 55, W: 12, h: 12, v0: PROTIST.euglena.v, meta: 0.15 });
      else if (org === 'chlamy') it = swimmerOf('chlamy', x, y, r, { r: 5, h: 10, v0: PROTIST.chlamy.v });
      else it = { kind: 'amoeba', x, y, z: 0, h: 40, R: 150, seed: 7, a: r() * TAU, pods: [{ a: 0, len: 110, w: 0.35, g: 1 }, { a: 2.3, len: 50, w: 0.4, g: -0.3 }, { a: 4, len: 70, w: 0.32, g: -0.2 }], nuc: [15, -12], cvp: [-55, 35], cv: 0.3, fv: [] };
      it.z = i === 0 ? 0 : (r() - 0.5) * 30;
      S.dyn.push(it);
    }
    S.main = S.dyn[0];
    S.main.cvT = 0; S.fvClock = 0;
    // food, stained with Congo red: the cell has been feeding for half an hour, so vacuoles of every age are inside
    if (p.food && (org === 'paramecium' || org === 'amoeba')) {
      for (let age = 60; age < FV_LIFE; age += FV_EVERY) S.main.fv.push(fvAt(S.main, age, r));
      for (let i = 0; i < 160; i++) { const a = r() * TAU, d = 30 + Math.sqrt(r()) * 500; S.dyn.push({ kind: 'yeast', x: Math.cos(a) * d, y: Math.sin(a) * d, z: (r() - 0.5) * 20, h: 6, a: r() * TAU, rx: 2.4, ry: 2, bud: 0, ba: 0, dye: true, dead: true }); }
    }
    S.photo = [];
  }
  function fvAt(cell, age, r) { return cell.kind === 'amoeba' ? { age, x: (r() - 0.5) * 120, y: (r() - 0.5) * 90, r: 7 + r() * 5, dye: true, pH: fvPH(age) } : { age, u: age / 300 % 1, r: 4 + r() * 2.5, dye: true, pH: fvPH(age) }; }
  /* ---------- colonies ---------- */
  function colonySetup(S, r) {
    const p = S.p, c = p.colony;
    if (c === 'leaf') return;
    const C = COLONY[c], n = c === 'volvox' ? 3 : c === 'pleodorina' ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = i === 0 ? 0 : 200 + Math.sqrt(r()) * 900;
      const it = { kind: c === 'chlamy' ? 'chlamy' : c, x: Math.cos(a) * d, y: Math.sin(a) * d, z: i === 0 ? 0 : (r() - 0.5) * 60, h: c === 'gonium' ? 12 : 2 * C.R, a: r() * TAU, seed: i + 3, spin: r() * TAU, R: C.R, r: c === 'chlamy' ? 5 : undefined, v0: C.swim, n: 1800, turn: 0, back: 0 };
      if (c === 'volvox') it.daughters = Array.from({ length: 10 }, (_, j) => ({ p: [Math.cos(j * 2.39) * 0.55, Math.sin(j * 2.39) * 0.55, 0.2 + 0.5 * (j % 3) / 2], r: 30 + 4 * (j % 4), g: 1 }));
      S.dyn.push(it);
    }
    S.main = S.dyn[0];
    if (p.split) splitColony(S, r);
  }
  function splitColony(S, r) {
    const p = S.p, c = p.colony, C = COLONY[c], m = S.main;
    const cells = [];
    const N = Math.min(C.N, 90);
    for (let i = 0; i < N; i++) {
      const a = r() * TAU, d = C.R * (0.6 + r() * 1.8);
      const germ = c === 'volvox' ? i < 16 : c === 'pleodorina' ? i % 2 === 0 : true;
      cells.push({ kind: germ && c === 'volvox' ? 'gonidium' : 'chlamy', x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, z: (r() - 0.5) * 20, h: 10, a: r() * TAU, r: germ && c === 'volvox' ? 14 : c === 'volvox' ? 2.5 : C.cellD / 2, v0: germ && c === 'volvox' ? 0 : c === 'volvox' ? 40 : 80, seed: i, soma: !germ, turn: 0, back: 0 });
    }
    S.dyn.splice(S.dyn.indexOf(m), 1, ...cells);
    S.main = cells[0];
  }

  /* ============================================================
     STEPPING — real time for the swimmers; the living set-up has a
     time-lapse, since yeast buds in hours and a drop dries in minutes
     ============================================================ */
  const DT_TRACK = 0.5;
  function step(S, dt) {
    const p = S.p;
    S.t += dt;
    const r = S._rng || (S._rng = rng(99 + p.seed));
    if (p.setup === 'living') { const ds = dt * p.lapse; S.ts += ds; livingStep(S, ds, r); }
    else { S.ts += dt; if (p.setup === 'hooke' || p.setup === 'unicellular' || p.setup === 'multicellular') swimStep(S, dt, r); }
    if (p.setup === 'unicellular') protistStep(S, dt, r);
    // the stage follows the one being watched, as a student's hand on the knobs would
    if (p.follow && S.main && (p.setup === 'unicellular' || p.setup === 'multicellular')) { p.sx = clamp(S.main.x, -2500, 2500); p.sy = clamp(S.main.y, -2500, 2500); }
  }
  const normal = r => { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  function brown(it, D, dt, r) {
    const s = Math.sqrt(2 * D * dt);
    it.x += s * normal(r); it.y += s * normal(r); it.z = clamp(it.z + s * normal(r), -40, 40);
  }
  function swimStep(S, dt, r) {
    const p = S.p, eta = (VISC[p.visc] || 1) * 1e-3, rel = eta / 1e-3, T = 20;
    const lightOn = p.setup === 'unicellular' && p.light !== 'off', bright = p.light === 'bright';
    S.dyn.forEach(it => {
      if (it.fixed) { if (it.kind === 'vorticella') { const ph = (S.t + it.t0) % 14; it.snap = ph < 0.25 ? ph / 0.25 : ph < 2.5 ? 1 - (ph - 0.25) / 2.25 : 0; } return; }
      if (it.kind === 'yeast' || it.kind === 'particle') { brown(it, diffusion(it.kind === 'yeast' ? 5 : it.d, T, eta), dt, r); return; }
      if (it.kind === 'gonidium') { it.z -= 20 * dt / rel; return; }
      if (it.kind === 'amoeba') return;
      const colony = COLONY[it.kind] && it.kind !== 'chlamy';
      let v = (it.v0 || 0) / rel;
      if (p.setup === 'multicellular' && p.divide) {                // flagella drawn in to divide: it sinks
        it.stop = true; it.z -= sinkSpeed(it.kind in COLONY ? it.kind : 'chlamy', eta) * dt;
        return;
      }
      it.stop = false;
      // turning: a random walk of heading, a turn toward (or away from) the light for those with an eyespot
      let da = normal(r) * Math.sqrt(2 * (it.kind === 'swimmer' ? 1.2 : 0.35) * dt);
      if (lightOn && (it.kind === 'euglena' || it.kind === 'chlamy')) { const want = bright ? Math.PI : 0; da += 1.6 * Math.sin(want - it.a) * dt; }
      if (it.kind === 'paramecium') {
        if (it.back > 0) { it.back -= dt; v = -v * 0.6; if (it.back <= 0) it.a += (r() < 0.5 ? 1 : -1) * (0.8 + r()); }
        else if (r() < dt * 0.08 || Math.hypot(it.x, it.y) > 1500) it.back = 0.35;
      }
      if (Math.hypot(it.x, it.y) > 1600) da += 2 * dt * Math.sign(Math.sin(Math.atan2(-it.y, -it.x) - it.a) || 1);
      it.a += da;
      it.x += Math.cos(it.a) * v * dt; it.y += Math.sin(it.a) * v * dt;
      it.z = it === S.main ? 0 : it.z + normal(r) * Math.sqrt(2 * 0.6 * dt) - it.z * 0.05 * dt;   // the one watched keeps to the focal plane, as a watcher would keep it
      if (colony) it.spin = (it.spin || 0) + dt * 0.6;
    });
  }
  function protistStep(S, dt, r) {
    const p = S.p, m = S.main, org = p.org, P = PROTIST[org];
    // the contractile vacuoles fill at the rate water leaks in, and empty at once
    const T = cvPeriod(org, p.salt);
    S.cvPeriod = T;
    if (org === 'amoeba') { m.cv = isFinite(T) ? (m.cv + dt / T) % 1 : m.cv; amoebaStep(S, m, dt, r); }
    else if (m.cv) { m.cv = m.cv.map((f, i) => isFinite(T) ? (f + dt / T) % 1 : f); }
    S.dyn.forEach(it => { if (it !== m && it.cv && Array.isArray(it.cv) && isFinite(T)) it.cv = it.cv.map(f => (f + dt / T) % 1); });
    // shrinking in salt: water leaves faster than the vacuole could ever matter
    const over = osmOf(p.salt) - C_IN;
    // the cell loses water until inside matches outside (Boyle–van ’t Hoff, a third of it solids): it shrinks over minutes
    const target = over > 0 ? clamp(0.67 * (1 - C_IN / osmOf(p.salt)), 0, 0.6) : 0;
    S.shrink = (S.shrink || 0) + (target - (S.shrink || 0)) * Math.min(1, dt / 90);
    if (org === 'paramecium' || org === 'euglena') m.shrink = S.shrink * 0.6;
    // food vacuoles: one forms at the mouth every 75 s while food lasts, carried round, acidified, emptied
    if (m.fv) {
      if (p.food && (org === 'paramecium' || org === 'amoeba')) { S.fvClock += dt; if (S.fvClock >= FV_EVERY) { S.fvClock -= FV_EVERY; m.fv.push(fvAt(m, 0, r)); } }
      m.fv.forEach(v => { v.age += dt; v.pH = fvPH(v.age); if (v.u != null) v.u = v.age / 300 % 1; });
      m.fv = m.fv.filter(v => v.age < FV_LIFE);
    }
    // the share of green swimmers in the lit half, for the plot
    if (org === 'euglena' || org === 'chlamy') {
      const sw = S.dyn.filter(it => it.kind === org), lit = sw.filter(it => it.x > 0).length;
      if (!S.photo.length || S.t - S.photo[S.photo.length - 1][0] > 0.5) S.photo.push([S.t, lit / Math.max(1, sw.length)]);
      if (S.photo.length > 400) S.photo.shift();
    }
  }
  function amoebaStep(S, m, dt, r) {
    const v = PROTIST.amoeba.v / (VISC[S.p.visc] || 1);
    m.pods.forEach(pd => { pd.len = clamp(pd.len + pd.g * 6 * dt, 8, 150); if (pd.len >= 150 || (pd.g < 0 && pd.len <= 8)) pd.g = -pd.g * (0.5 + r()); });
    const lead = m.pods.reduce((u, q) => q.len > u.len ? q : u, m.pods[0]);
    m.x += Math.cos(lead.a) * v * dt; m.y += Math.sin(lead.a) * v * dt;
    if (r() < dt * 0.02) m.pods.push({ a: r() * TAU, len: 8, w: 0.3 + r() * 0.15, g: 1 });
    if (m.pods.length > 5) m.pods = m.pods.filter(q => q.len > 9 || q.g > 0).slice(-5);
  }
  function livingStep(S, ds, r) {
    const p = S.p, k = p.lspec, T = p.temp, eta = viscosity(T);
    if (k === 'yeast') {
      const mu = yeastRate(T, p.sugar) / 3600, die = yeastDeath(T);    // per second
      const born = [];
      S.dyn.forEach(c => {
        if (c.kind !== 'yeast') return;
        if (!c.dead && (p.boil || (die > 0 && r() < 1 - Math.exp(-die * ds)))) c.dead = true;
        if (!c.dead && mu > 0) {
          c.prog += ds * mu / Math.LN2;
          c.bud = clamp((c.prog - 0.3) / 0.7, 0, 1);
          if (c.prog >= 1) { c.prog = 0; c.bud = 0; if (S.dyn.length < 700) born.push({ kind: 'yeast', x: c.x + Math.cos(c.ba) * 5.2, y: c.y + Math.sin(c.ba) * 5.2, z: c.z, h: 6, a: r() * TAU, rx: c.rx * 0.92, ry: c.ry * 0.92, bud: 0, ba: c.ba + (r() - 0.5) * 1.4, prog: 0, dead: false, track: [] }); c.ba += 2.2 + r(); }
        }
        brown(c, diffusion(5, T, eta) * 0.3, ds, r);          // resting on the glass: hindered to about a third
      });
      S.dyn.push(...born);
      const live = S.dyn.filter(c => c.kind === 'yeast' && !c.dead).length;
      if (live && mu > 0) { S.live.co2 += live * ds * mu * 0.02; while (S.live.co2 > 1) { S.live.co2 -= 1; const a = r() * TAU, d = Math.sqrt(r()) * 240; S.dyn.push({ kind: 'co2', x: Math.cos(a) * d, y: Math.sin(a) * d, z: 4, h: 30, r: 3, grow: 1, fixed: true }); } }
      S.dyn.forEach(b => { if (b.kind === 'co2' && b.r < 45 && live && mu > 0) b.r += ds * mu * 30; });
      S.live.yeastN = S.dyn.filter(c => c.kind === 'yeast').length; S.live.dead = S.dyn.filter(c => c.kind === 'yeast' && c.dead).length;
    } else if (k === 'pollen' || k === 'rock') {
      S.dyn.forEach(it => { if (it.kind === 'particle') brown(it, diffusion(it.d, T, eta), ds, r); });
    } else if (k === 'salt') {
      const s = S.salt, big = s.xs.reduce((u, c) => Math.max(u, c.e), 0), ew = evapRate(Math.max(s.R, big) / 1000, p.rh, T) * ds;   // grams of water lost (+) or taken from damp air (−)
      let dW = Math.min(s.water, ew);
      if (dW > 0) {                                                      // drying: salt comes out of solution onto the crystals
        s.water -= dW; const out = Math.min(s.dissolved, dW * SOL_NACL); s.dissolved -= out; s.grew += out;
        const area = s.xs.reduce((u, c) => u + c.e * c.e, 0) || 1;
        s.xs.forEach(c => { c.m += out * c.e * c.e / area; c.e = 1e4 * Math.cbrt(c.m / RHO_NACL); });
        if (r() < ds * 0.05 && s.water > 0) { const a = r() * TAU; const c = { kind: 'salt', x: Math.cos(a) * s.R * 0.9, y: Math.sin(a) * s.R * 0.9, z: -2, h: 20, a: (r() - 0.5) * 0.6, m: 1e-10, e: 0 }; c.e = 1e4 * Math.cbrt(c.m / RHO_NACL); s.xs.push(c); S.dyn.push(c); }
      } else if (dW < 0) {                                              // humid air: the brine takes water in and the crystals dissolve
        const take = -dW; s.water += take; const back = Math.min(take * SOL_NACL, s.xs.reduce((u, c) => u + c.m, 0));
        const tot = s.xs.reduce((u, c) => u + c.m, 0) || 1; s.xs.forEach(c => { c.m = Math.max(0, c.m - back * c.m / tot); c.e = 1e4 * Math.cbrt(c.m / RHO_NACL); }); s.dissolved += back;
      }
      const m0 = 0.12e-3, R0 = 560, frac = (s.water + s.dissolved) / m0;
      const R = frac > 0.02 ? R0 * Math.cbrt(frac) : 0;
      if (R < s.R - 20) { for (let i = 0; i < 24; i++) { const a = r() * TAU; s.edge.push([Math.cos(a) * s.R, Math.sin(a) * s.R, 2 + r() * 5]); } }
      s.R = R; S.dyn.forEach(it => { if (it.kind === 'dropEdge') it.R = R; });
    }
    // tracks, for the wandering plot
    if (S.ts - (S._lastTrack || 0) >= DT_TRACK || !S._lastTrack) {
      S._lastTrack = S.ts;
      S.dyn.forEach(it => { if (it.track) { it.track.push([S.ts, it.x, it.y]); if (it.track.length > 80) it.track.shift(); } });
      S.hist.push([S.ts, k === 'yeast' ? S.live.yeastN : k === 'salt' ? S.salt.xs.reduce((u, c) => Math.max(u, c.e), 0) : 0, k === 'yeast' ? S.live.dead : k === 'salt' ? S.salt.water * 1e6 : 0]);
      if (S.hist.length > 600) S.hist.shift();
    }
  }

  /* ============================================================
     THE STAGE — the bench on the left, the eyepiece on the right
     ============================================================ */
  const HOMES = {
    hooke: { theta: -1.3, phi: 0.2, dist: 1.3, target: [-0.12, 0.0, 0.07], fov: 0.72, min: 0.3, max: 3 },
    scope: { theta: -0.78, phi: 0.2, dist: 1.02, target: [0.0, 0.0, 0.1], fov: 0.72, min: 0.3, max: 3 }
  };
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const fmtUm = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 2) + ' mm' : v >= 10 ? v.toFixed(0) + ' µm' : v >= 1 ? v.toFixed(v < 2 ? 2 : 1) + ' µm' : (v * 1000).toFixed(0) + ' nm';
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  function lay(g) {
    const W = g.w, H = g.h, HD = 58, FT = 26, narrow = W < 640;
    if (narrow) { const R = Math.max(70, Math.min((W - 34) / 2, (H - HD - 44 - 64) / 2)); return { narrow, R, cx: W / 2, cy: HD + 40 + R, W, H }; }   // a phone: the hint takes two lines
    const R = Math.max(90, Math.min((H - HD - FT - 58) / 2, W * 0.28));
    return { narrow, R, cx: W - R - 22, cy: HD + 18 + R, W, H, bw: W - 2 * R - 60 };
  }
  function viewOf(S, O) {
    const p = S.p, stain = stainOf(p);
    return {
      slide: S.slide, dyn: S.dyn, at: [p.sx, p.sy], fov: O.field, invert: O.invert, focus: p.focus, sigma: O.sigma,
      lamp: O.historic ? O.historic.lamp : LAMP_COL[p.filter] || LAMP_COL.white, bright: O.bright, haze: O.haze, pc: O.pc, stain,
      t: S.t, mount: MOUNT[stain] || '#FFFFFF', grat: p.grat && scopeIs(S) ? { n: 100 } : null, pointer: p.setup === 'scale',
      optKey: [p.obj, p.cond, p.filter, p.zoom, p.eye, p.oil, p.instr, p.setup].join(',')
    };
  }

  /* ---------- the bench ---------- */
  function drawBench(S, g, Ly, O) {
    const p = S.p, ctx = g.ctx, cam = S.cam, M = MI(), bw = Ly.bw;
    if (!cam || bw < 160) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 20, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    MEAS.bench(F, -0.75, 0.55, -0.34, 0.36, { cabinet: '#A9B2BC' });
    MEAS.tileWall(F, -0.75, 0.55, 0.36, 0, 0.75);
    const spec = specOf(p), tint = (SPEC[spec] || SPEC.pond).tint;
    const pts = {};
    if (p.setup === 'hooke') {
      pts.hooke = M.hookeScope(F, [-0.38, 0.08, 0], { lamp: 1, tint });
      pts.leeu = M.leeuwenhoek(F, [-0.14, -0.1, 0], {});
      pts.modern = M.compound(F, [0.16, 0.04, 0], { obj: p.obj, cond: p.cond, iris: p.cond / 0.9, lamp: p.lamp, focus: p.focus, stage: [p.sx, p.sy], slide: { tint }, oil: p.oil });
      M.pondDish(F, [0.0, -0.22, 0]);
    } else {
      pts.modern = M.compound(F, [0, 0.03, 0], { obj: p.obj, iris: p.cond / 0.9, lamp: p.lamp, focus: p.focus, stage: [p.sx, p.sy], slide: { tint, r: spec === 'leaf' ? 0.007 : 0.005 }, oil: p.oil });
      M.slideBox(F, [0.2, 0.14, 0]);
      const st = stainOf(p);
      if (st === 'orcein') M.dropper(F, [0.17, -0.1, 0], 'Acetic orcein', '#A0325E', { glass: '#4A1830' });
      else if (st === 'mb' || p.setup === 'living') M.dropper(F, [0.17, -0.1, 0], 'Methylene blue', '#2E5AB8', { glass: '#23294A' });
      else M.dropper(F, [0.17, -0.1, 0], 'Iodine', '#A86A1C');
      if (p.setup === 'unicellular' || p.setup === 'multicellular' || spec === 'pond') M.pondDish(F, [-0.19, -0.13, 0]);
      if (p.setup === 'unicellular' && p.light !== 'off') { const L0 = [-0.13, 0.02, 0.13]; R3.cylinder(F, [L0[0], L0[1], 0], L0, 0.004, '#3A3E46', { segments: 8, shadow: false }); R3.sphere(F, L0, 0.018, '#E8E4D8', { shadow: false }); M.glow(F, L0, p.light === 'bright' ? 0.12 : 0.07, '#FFF4D0', 0.8); }
    }
    F.render();
    // the names of the instruments, and the handles that work them
    const lab = (at, text, col) => { const q = cam.project(at); if (!q.ok) return; ctx.font = sans(11, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(text, q.x, q.y - 6); ctx.fillStyle = col || '#EAF1FF'; ctx.fillText(text, q.x, q.y - 6); };
    if (p.setup === 'hooke') {
      const sel = p.instr, col = k => sel === k ? '#FFD66B' : 'rgba(220,228,242,.7)';
      lab([-0.38, 0.08, 0.34], 'Hooke 1665', col('hooke'));
      lab([-0.14, -0.1, 0.13], 'Leeuwenhoek 1670s', col('leeu'));
      lab([0.16, 0.04, 0.37], 'today', col('modern'));
    }
    const Pm = pts.modern;
    if (Pm && (p.setup !== 'hooke' || p.instr === 'modern')) {
      const hq = (at, id, r) => { const q = cam.project(at); if (q.ok) g.handle(q.x, q.y, r || 14, id); return q; };
      hq(Pm.knob, 'focus', 16); hq(Pm.objective, 'turret', 14); hq(Pm.iris, 'iris', 12); hq(Pm.dimmer, 'lamp', 12);
      if (g.labels && bw > 260) {
        const tag = (at, text, dx, dy) => { const q = cam.project(at); if (!q.ok || q.y + dy < 70 || q.y + dy > g.h - 30) return; /* never under the header or the hint */ ctx.save(); ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + dx, q.y + dy); ctx.stroke(); ctx.font = mono(10, 600); ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(text, q.x + dx + (dx < 0 ? -3 : 3), q.y + dy); ctx.fillStyle = '#DCE6F6'; ctx.fillText(text, q.x + dx + (dx < 0 ? -3 : 3), q.y + dy); ctx.restore(); };
        tag(Pm.eyepiece, 'eyepiece ' + p.eye + '×', -34, -8);
        tag(Pm.objective, 'objective ' + p.obj + '×', -46, 4);
        tag(Pm.iris, 'iris NA ' + O.NAc.toFixed(2), -58, 16);
        tag(Pm.knob, 'focus', 34, -14);
      }
    }
    ctx.restore();
  }

  /* ---------- round the eyepiece: power, field, which way up, a scale bar ---------- */
  function rimLabels(S, g, Ly, O) {
    const p = S.p, ctx = g.ctx, { cx, cy, R } = Ly, T = g.theme;
    ctx.save();
    ctx.font = mono(Ly.narrow ? 10 : 11, 600); ctx.textBaseline = 'middle';
    const mag = Math.round(O.M) + '×';
    ctx.textAlign = 'left'; ctx.fillStyle = O.empty ? '#FFB35C' : '#EAF1FF';
    ctx.fillText(mag + (O.empty ? '  empty magnification' : ''), cx - R, cy - R - 6);
    ctx.textAlign = 'right'; ctx.fillStyle = T['text-2'];
    ctx.fillText('field ' + fmtUm(O.field), cx + R, cy - R - 6);
    // a scale bar of a round length, drawn at the image's own scale
    const pxPer = 2 * R / O.field, want = O.field * 0.22, steps = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
    const len = steps.reduce((u, v) => Math.abs(v - want) < Math.abs(u - want) ? v : u, steps[0]), Lpx = len * pxPer;
    const by = cy + R + 13, bx = cx - Lpx / 2;
    ctx.strokeStyle = '#EAF1FF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Lpx, by); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.moveTo(bx + Lpx, by - 4); ctx.lineTo(bx + Lpx, by + 4); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#EAF1FF'; ctx.font = mono(10, 600); ctx.fillText(fmtUm(len), cx, by + 11);
    ctx.textAlign = 'left'; ctx.fillStyle = T['text-3'];
    if (!Ly.narrow) { ctx.textAlign = 'right'; ctx.fillText(O.invert ? 'image turned round' : 'image the right way up', cx + R, by + 1); }
    ctx.restore();
  }

  /* the parts of the watched organism, named with leaders, when it is big enough to see them */
  const PARTS = {
    paramecium: it => [['oral groove', it.L * 0.25, -it.W * 0.25], ['macronucleus', -it.L * 0.02, it.W * 0.04], ['contractile vacuole', it.L * 0.29, it.W * 0.2], ['food vacuole', -it.L * 0.2, -it.W * 0.12], ['cilia', -it.L * 0.48, it.W * 0.12]],
    euglena: it => [['eyespot', it.L * 0.36, it.W * 0.16], ['chloroplasts', -it.L * 0.1, 0], ['flagellum', it.L * 0.75, 0]],
    chlamy: it => [['eyespot', 1.5, 3.1], ['chloroplast', -2.5, 0], ['flagella', 8, 5]],
    amoeba: it => [['nucleus', it.nuc[0], it.nuc[1]], ['contractile vacuole', it.cvp[0], it.cvp[1]], ['pseudopod', Math.cos(it.pods[0].a) * (it.R * 0.62 + it.pods[0].len * 0.8), Math.sin(it.pods[0].a) * (it.R * 0.62 + it.pods[0].len * 0.8)]]
  };
  function partLabels(S, g, Ly, res) {
    const it = S.main, f = it && PARTS[it.kind];
    if (!f || !g.labels) return;
    const size = (it.L || it.R * 2 || 10) * res.pxPerUm;
    if (size < 90) return;
    const ctx = g.ctx, ca = Math.cos(it.a || 0), sa = Math.sin(it.a || 0), [OX, OY] = res.toScreen(it.x, it.y);
    const pts = f(it).map(([name, lx, ly]) => { const [X, Y] = res.toScreen(it.x + lx * ca - ly * sa, it.y + lx * sa + ly * ca); return { name, X, Y }; });
    ctx.save(); ctx.beginPath(); ctx.arc(Ly.cx, Ly.cy, Ly.R, 0, TAU); ctx.clip();
    ctx.font = mono(10, 600); ctx.textBaseline = 'middle';
    [-1, 1].forEach(side => {
      const col = pts.filter(q => side < 0 ? q.X < OX : q.X >= OX).sort((u, v) => u.Y - v.Y);
      if (!col.length) return;
      const tw = Math.max(...col.map(q => ctx.measureText(q.name).width)), want = OX + side * (size * 0.42 + 16);
      const colX = side < 0 ? Math.max(want, Ly.cx - Ly.R + tw + 18) : Math.min(want, Ly.cx + Ly.R - tw - 18);   // the names stay inside the field
      let y = -1e9;
      col.forEach(q => {
        y = clamp(Math.max(q.Y, y + 14), Ly.cy - Ly.R * 0.8, Ly.cy + Ly.R * 0.8);   // where the round field is wide enough for a name
        ctx.strokeStyle = 'rgba(16,20,28,.75)'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(q.X, q.Y, 2.2, 0, TAU); ctx.moveTo(q.X, q.Y); ctx.lineTo(colX, y); ctx.stroke();
        ctx.textAlign = side < 0 ? 'right' : 'left';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.88)'; ctx.strokeText(q.name, colX + side * 4, y);
        ctx.fillStyle = '#10141C'; ctx.fillText(q.name, colX + side * 4, y);
      });
    });
    ctx.restore();
  }

  /* ---------- the stage ---------- */
  function drawStage(S, g) {
    const p = S.p, ctx = g.ctx, K = kit(), M = MI();
    if (!M || !K) return;
    const Ly = lay(g), O = opticsOf(p);
    if (!Ly.narrow) drawBench(S, g, Ly, O);
    const res = M.view(ctx, Ly.cx, Ly.cy, Ly.R, viewOf(S, O));
    S._view = { Ly, res, O };
    g.handle(Ly.cx, Ly.cy, Ly.R - 12, 'view');
    rimLabels(S, g, Ly, O);
    overlays(S, g, Ly, res, O);
    partLabels(S, g, Ly, res);
    cards(S, g, Ly, O);
    const H = headerOf(S, O);
    K.header(g, H[0], H[1], H[2]);
  }

  /* what the lab marks on the field: Hooke's line, the cells counted, the pointer's target */
  function overlays(S, g, Ly, res, O) {
    const p = S.p, ctx = g.ctx;
    ctx.save(); ctx.beginPath(); ctx.arc(Ly.cx, Ly.cy, Ly.R, 0, TAU); ctx.clip();
    if (p.setup === 'hooke' && p.hspec === 'cork' && p.countLine) {
      const C = corkCountView(S, O);
      const [x0, y0] = res.toScreen(p.sx - C.len / 2, C.y), [x1] = res.toScreen(p.sx + C.len / 2, C.y);
      ctx.strokeStyle = 'rgba(255,208,80,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,208,80,.95)';
      C.walls.forEach(x => { const [X] = res.toScreen(x, C.y); ctx.fillRect(X - 1, y0 - 5, 2, 10); });
    }
    if (p.setup === 'theory' && p.tspec === 'root' && p.mark && S.cells) {
      const Rf = O.field / 2, col = { P: '#FFB35C', M: '#6FE0A0', A: '#62C8FF', T: '#D69BFF' };
      S.cells.forEach(cl => {
        if (cl.phase === 'I') return;
        if ((cl.cx - p.sx) ** 2 + (cl.cy - p.sy) ** 2 > Rf * Rf) return;
        const [X, Y] = res.toScreen(cl.cx, cl.cy), rr = Math.max(3.5, cl.w * 0.5 * res.pxPerUm);
        ctx.strokeStyle = col[cl.phase]; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(X, Y, rr, 0, TAU); ctx.stroke();
      });
    }
    ctx.restore();
  }
  /* Hooke counted cells "placed end-ways": along a row, so the line runs through the middle of the nearest row */
  const corkRow = y => { const h = 25400 / HOOKE.perInch * Math.sqrt(3) / 2; return Math.round(y / h) * h; };
  function corkCountView(S, O) {
    const p = S.p, len = O.field * 0.8, y = corkRow(p.sy);
    const key = [p.seed, p.sx.toFixed(1), y.toFixed(1), len.toFixed(1)].join(',');
    if (S._cork && S._cork.key === key) return S._cork;
    const xs = [];
    if (S.cells) S.cells.forEach(cl => { if (Math.abs(cl.cy - y) > 30) return; const v = cl.v; for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; if ((a[1] - y) * (b[1] - y) < 0) { const x = a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]); if (Math.abs(x - p.sx) < len / 2) xs.push(x); } } });
    xs.sort((u, v) => u - v);
    const walls = xs.filter((x, i) => !i || x - xs[i - 1] > 1.5);
    const C = corkCount(S.cells ? { cells: S.cells } : null, p.sx, y, len);
    S._cork = Object.assign(C, { walls, y, key });
    return S._cork;
  }

  /* ============================================================
     CARDS — what the lab has worked out, next to what it shows
     ============================================================ */
  const SEE = {
    pepper: [['Paramecium', 200], ['Vorticella', 60], ['Euglena', 50], ['Chlamydomonas', 10], ['a bacterium', 2]],
    plaque: [['a scrap of cheek', 50], ['a rod bacterium', 3], ['a round bacterium', 1], ['a spiral, its width', 0.8]],
    cork: [['a cork cell', 23.5], ['a cell wall', 1.5]]
  };
  const seenAs = (size, r) => size >= 4 * r ? ['clearly', '#6FE0A0'] : size >= 0.7 * r ? ['a speck', '#FFD66B'] : ['no', '#FF8A80'];   // a speck is seen before its shape is
  function drawRows(ctx, x, y, w, rows, o) {
    o = o || {};
    rows.forEach((row, i) => {
      const yy = y + i * (o.lh || 15);
      row.forEach((cell, j) => {
        const c = typeof cell === 'object' ? cell : { t: String(cell) };
        const cx = x + (o.cols ? o.cols[j] * w : 0);
        ctx.fillStyle = c.col || (j === 0 ? '#DCE6F6' : '#AFC0D8'); ctx.font = c.bold ? mono(10.5, 700) : mono(10, 500);
        ctx.textAlign = o.align && o.align[j] || 'left';
        ctx.fillText(kit().fitText(ctx, c.t, (o.widths ? o.widths[j] : w) - 4), cx, yy);
      });
    });
  }
  function cards(S, g, Ly, O) {
    const p = S.p, K = kit(), ctx = g.ctx;
    const wideW = Ly.narrow ? 0 : Math.min(p.setup === 'living' || p.setup === 'multicellular' ? 340 : 300, Ly.bw - 10);
    const at = h => ({ x: 10, y: g.h - 26 - h - 6 });
    const box = (title, h, fill) => {
      const r = K.cardSlot(g, S, title, wideW, at(h));
      if (!r) return null;
      const H = h; K.card(ctx, r.x, r.y, r.w, H);
      ctx.save(); ctx.textBaseline = 'top'; ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left';
      ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
      fill(r.x + 10, r.y + 28, r.w - 20);
      ctx.restore();
      return r;
    };
    if (p.setup === 'hooke') {
      if (p.hspec === 'cork') {
        const C = corkCountView(S, O);
        box('Counting cells, as Hooke did', 133, (x, y, w) => drawRows(ctx, x, y, w, [
          [{ t: 'Hooke, 1665', bold: true }], ['"about threescore … in the eighteenth', ''], ['part of an Inch": 1,080 an inch', ''],
          [{ t: 'Along the gold line: ' + C.n.toFixed(0) + ' cells in ' + fmtUm(C.len), bold: true, col: '#FFD66B' }],
          ['= ' + fmtN(C.perInch) + ' an inch', ''], ['= ' + (C.perCu / 1e9).toFixed(2) + ' billion in a cubic inch (Hooke: 1.26)', '']
        ], { lh: 15 }));
      } else {
        const list = SEE[p.hspec] || [];
        box('What ' + (p.instr === 'modern' ? 'today’s microscope' : INSTR[p.instr].name.split(',')[0]) + ' can show', 30 + list.length * 15 + 16, (x, y, w) => {
          drawRows(ctx, x, y, w, list.map(([n, s]) => { const v = seenAs(s, O.r); return [n, fmtUm(s), { t: v[0], col: v[1], bold: true }]; }), { cols: [0, 0.6, 0.83], widths: [0.6 * w, 0.23 * w, 0.2 * w].map(v => v + 4) });
          ctx.fillStyle = '#8FA3C0'; ctx.font = mono(9.5, 500); ctx.fillText('finest detail it shows: ' + fmtUm(O.r), x, y + list.length * 15 + 2);
        });
      }
    } else if (p.setup === 'theory') {
      if (p.tspec === 'root') {
        const R = rootOf(S), E = rootEstimate(R.tally, R.N, p.tempR), col = { P: '#FFB35C', M: '#6FE0A0', A: '#62C8FF', T: '#D69BFF', I: '#AFC0D8' };
        box('Counting the phases (' + p.fields + ' field' + (p.fields > 1 ? 's' : '') + ')', 30 + 6 * 15 + 18, (x, y, w) => {
          drawRows(ctx, x, y, w, [[{ t: 'phase', bold: true }, { t: 'cells', bold: true }, { t: 'share', bold: true }, { t: 'hours', bold: true }]].concat(PHASES.map(k => [{ t: PHASE_NAME[k], col: col[k] }, String(R.tally[k]), (R.N ? R.tally[k] / R.N * 100 : 0).toFixed(1) + '%', E.est[k].toFixed(k === 'I' ? 1 : 2)])), { cols: [0, 0.42, 0.6, 0.8], widths: [0.42 * w, 0.18 * w, 0.2 * w, 0.2 * w] });
          ctx.fillStyle = '#8FA3C0'; ctx.font = mono(9.5, 500); ctx.fillText(R.N + ' cells · cycle ' + E.T.toFixed(0) + ' h at ' + p.tempR + ' °C · mitosis ≈ ' + E.mitosis.toFixed(1) + ' h', x, y + 6 * 15 + 2);
        });
      } else {
        const rows = [['cell membrane', '✓', '✓'], ['cytoplasm', '✓', '✓'], ['nucleus', '✓', '✓'], ['cell wall', '✓', '—'], ['chloroplasts', '✓', '—'], ['one big vacuole', '✓', '—']];
        box('A plant cell and an animal cell', 30 + 7 * 15 + 4, (x, y, w) => drawRows(ctx, x, y, w, [[{ t: '', bold: true }, { t: 'Elodea', bold: true, col: '#9FE0A0' }, { t: 'cheek', bold: true, col: '#8FB4FF' }]].concat(rows.map(r => [r[0], { t: r[1], col: '#6FE0A0' }, { t: r[2], col: r[2] === '✓' ? '#6FE0A0' : '#FF8A80' }])), { cols: [0, 0.6, 0.82], widths: [0.6 * w, 0.22 * w, 0.18 * w] }));
      }
    } else if (p.setup === 'living') {
      const V = aliveOf(S);
      box('Is it alive? — ' + V.name, 30 + V.rows.length * 15 + 18, (x, y, w) => {
        drawRows(ctx, x, y, w, V.rows.map(r => [r[0], { t: r[1], col: r[1] === 'yes' ? '#6FE0A0' : r[1] === 'no' ? '#FF8A80' : '#FFD66B', bold: true }, r[2]]), { cols: [0, 0.3, 0.41], widths: [0.3 * w, 0.11 * w, 0.59 * w] });
        ctx.fillStyle = V.verdict.col; ctx.font = mono(10, 700); ctx.fillText(K.fitText(ctx, V.verdict.t, w), x, y + V.rows.length * 15 + 2);
      });
    } else if (p.setup === 'unicellular') {
      const J = jobsOf(S);
      box('One cell, every job — ' + PROTIST[p.org].name, 30 + J.length * 15 + 4, (x, y, w) => drawRows(ctx, x, y, w, J.map(r => [{ t: r[0], bold: true }, r[1]]), { cols: [0, 0.27], widths: [0.27 * w, 0.73 * w] }));
    } else if (p.setup === 'multicellular') {
      const J = shareOf(S);
      box(J.title, 30 + J.rows.length * 15 + 4, (x, y, w) => drawRows(ctx, x, y, w, J.rows.map(r => [{ t: r[0], bold: true }, { t: r[1], col: r[2] || '#AFC0D8' }]), { cols: [0, 0.34], widths: [0.34 * w, 0.66 * w] }));
    } else if (p.setup === 'scale') {
      const Mz = measureOf(S, O);
      box('Measuring with the graticule', 30 + Mz.rows.length * 15 + 4, (x, y, w) => drawRows(ctx, x, y, w, Mz.rows.map(r => [{ t: r[0], bold: true }, { t: r[1], col: r[2] || '#AFC0D8' }]), { cols: [0, 0.36], widths: [0.36 * w, 0.64 * w] }));
    }
  }

  /* ---------- the root tip, counted field by field ---------- */
  function rootOf(S) {
    const p = S.p, O = optics(p), nf = clamp(Math.round(p.fields), 1, 12), key = [p.seed, nf, p.obj, p.eye, p.zoom].join(',');
    if (S._root && S._root.key === key) return S._root;
    const F = fieldsOf(nf, O.field), R = rootCount({ cells: S.cells || rootCells(p.seed) }, F, O.field);
    S._root = Object.assign({ key, fields: F }, R);
    return S._root;
  }

  /* ---------- alive or not: the evidence as it stands ---------- */
  function aliveOf(S) {
    const p = S.p, k = p.lspec, hrs = S.ts / 3600;
    if (k === 'yeast') {
      const L = S.live, live = L.yeastN - L.dead, n0 = 70, mu = yeastRate(p.temp, p.sugar);
      const grew = L.yeastN > n0, gas = S.dyn.some(b => b.kind === 'co2');
      const allDead = live === 0;
      return {
        name: 'yeast', rows: [
          ['made of cells', 'yes', 'ovals 5 µm long'],
          ['grows, breeds', grew ? 'yes' : allDead ? 'no' : '?', grew ? 'budded: ' + n0 + ' → ' + L.yeastN : allDead ? 'no buds: dead' : mu > 0 ? 'wait — a bud takes hours' : p.sugar <= 0 ? 'no sugar, no growth' : 'too cold or hot'],
          ['uses energy', gas ? 'yes' : allDead ? 'no' : '?', gas ? 'sugar in, CO₂ bubbles out' : p.sugar <= 0 ? 'nothing to feed on' : allDead ? 'no bubbles' : 'no bubbles yet'],
          ['keeps order', p.mb ? (live > 0 ? 'yes' : 'no') : '?', p.mb ? (live > 0 ? (L.yeastN - L.dead) + ' clear it, ' + L.dead + ' stay blue' : 'all stay blue') : 'test: add methylene blue'],
          ['moves itself', 'no', 'only jiggles — not needed']
        ], verdict: allDead ? { t: p.boil ? 'Was alive — boiling killed it.' : 'Dead: too hot to live.', col: '#FF8A80' } : { t: grew || gas ? 'Alive: cells that feed, grow and bud.' : 'Cells — watch for buds and gas.', col: grew || gas ? '#6FE0A0' : '#FFD66B' }
      };
    }
    if (k === 'pollen' || k === 'rock') {
      const D1 = diffusion(1, p.temp);
      return {
        name: k === 'pollen' ? 'the specks from pollen' : 'specks of rock', rows: [
          ['made of cells', 'no', k === 'pollen' ? 'specks from inside grains' : 'bits of quartz and clay'],
          ['moves', 'yes', 'jiggles ' + Math.sqrt(4 * D1).toFixed(1) + ' µm a second'],
          ['by itself?', 'no', p.boil ? 'boiled: jiggles the same' : k === 'rock' ? 'rock does it too' : 'boil it, or try rock'],
          ['grows', 'no', 'the specks stay as they are'],
          ['uses energy', 'no', 'the water’s heat pushes them']
        ], verdict: { t: 'Not alive: water molecules push small things.', col: '#FF8A80' }
      };
    }
    const s = S.salt || { R: 0, xs: [] }, big = s.xs.reduce((u, c) => Math.max(u, c.e), 0);
    return {
      name: 'salt', rows: [
        ['made of cells', 'no', 'cubes of sodium and chloride'],
        ['grows', big > 15 ? 'yes' : '?', 'largest cube ' + big.toFixed(0) + ' µm' + (p.rh > 75 ? ' — dissolving' : '')],
        ['by feeding?', 'no', p.rh > 75 ? 'damp air: shrinks back' : 'salt leaves the drying brine'],
        ['breeds', 'no', 'new cubes start in the brine'],
        ['uses energy', 'no', 'the air dries it']
      ], verdict: { t: 'Not alive: it grows only as the water leaves.', col: '#FF8A80' }
    };
  }

  /* ---------- one cell's jobs, live ---------- */
  function jobsOf(S) {
    const p = S.p, org = p.org, P = PROTIST[org], m = S.main, T = cvPeriod(org, p.salt), v = P.v / (VISC[p.visc] || 1);
    const out = [['moves', (org === 'amoeba' ? 'pseudopods · ' : org === 'paramecium' ? 'cilia · ' : 'flagella · ') + (v >= 100 ? (v / 1000).toFixed(2) + ' mm/s' : v.toFixed(1) + ' µm/s')]];
    if (org === 'paramecium' || org === 'amoeba') { const nv = m && m.fv ? m.fv.length : 0; out.push(['eats', p.food ? nv + ' food vacuoles · red → blue as they digest' : 'no food: no new vacuoles']); }
    else out.push(['eats', 'makes its food: green chloroplasts']);
    out.push(['bails water', isFinite(T) ? 'vacuole empties every ' + T.toFixed(T < 20 ? 1 : 0) + ' s' : 'vacuole stopped — the cell shrinks']);
    out.push(['senses', org === 'euglena' || org === 'chlamy' ? (p.light === 'off' ? 'eyespot: no light to swim to' : p.light === 'bright' ? 'eyespot: turns away, too bright' : 'eyespot: swims to the light') : org === 'paramecium' ? 'bumps, backs off, turns' : 'flows towards food']);
    out.push(['divides', org === 'amoeba' ? 'in two, about every 2 days' : org === 'chlamy' ? 'into 2–8 inside its wall, nightly' : 'in two, about once a day']);
    return out;
  }
  /* ---------- colonies ---------- */
  function shareOf(S) {
    const p = S.p;
    if (p.colony === 'leaf') return { title: 'A leaf: tissues, each with a job', rows: [['epidermis', 'a skin of clear cells, waxy on top'], ['palisade', 'tall cells packed with chloroplasts'], ['spongy', 'loose cells, air between them'], ['stomata', 'guard cells open and close a pore'], ['vein', 'xylem brings water (red), phloem takes sugar']] };
    const C = COLONY[p.colony], vs = sinkSpeed(p.colony), repro = C.germ >= 1 ? 'every cell' : C.germ >= 0.5 ? 'half its cells (the back half)' : '16 of ' + fmtN(C.N) + ' cells';
    const rows = [['cells', fmtN(C.N) + ' — ' + C.shape], ['can reproduce', repro, C.germ >= 1 ? '#6FE0A0' : '#FFD66B'], ['one cell alone', C.germ >= 1 ? (C.N === 1 ? 'is the whole organism' : 'swims off, makes a new colony') : 'a swimming cell dies; a gonidium grows a colony']];
    rows.push(['swims', C.swim + ' µm/s (about)']);
    rows.push([p.divide ? 'dividing: sinks' : 'would sink', vs.toFixed(C.R > 20 ? 0 : 1) + ' µm/s · ' + (vs * 3600 / 1e4).toFixed(1) + ' cm an hour', p.divide ? '#FF8A80' : null]);
    return { title: C.name + ': ' + (C.germ >= 1 ? (C.N === 1 ? 'one cell alone' : 'cells all alike') : 'cells that share the work'), rows };
  }
  /* ---------- measuring ---------- */
  const THING = {
    micrometer: ['one division of the micrometer', 10], letter: ['the letter e, top to bottom', 1500], hair: ['the hair, across', 72], cheek: ['a cheek cell, across', 60],
    blood: ['a red blood cell', 7.5], bacteria: ['a rod bacterium, long', 3], diatoms: ['Pleurosigma’s pores, apart', 0.65], virus: ['a tobacco mosaic virus, long', 0.3]
  };
  function measureOf(S, O) {
    const p = S.p, div = 100 / (p.obj * (p.zoom || 1)), T = THING[p.sspec] || THING.micrometer, nd = T[1] / div;
    const rows = [['graticule', '1 division = ' + fmtUm(div) + ' at ' + p.obj + '×' + (p.zoom > 1 ? ' zoomed ' + p.zoom + '×' : '')], [T[0].split(',')[0], fmtUm(T[1]) + ' = ' + (nd >= 10 ? nd.toFixed(0) : nd.toFixed(1)) + ' division' + (Math.abs(nd - 1) < 0.05 ? '' : 's')]];
    rows.push(['finest detail', fmtUm(O.r) + (T[1] < O.r ? ' — the ' + T[0].split(',')[0].split(' ').slice(-1)[0] + ' are finer: not seen' : ''), T[1] < O.r ? '#FF8A80' : '#6FE0A0']);
    rows.push(['useful power', Math.round(O.useful[0]) + '–' + Math.round(O.useful[1]) + '×; this is ' + Math.round(O.M) + '×', O.empty ? '#FFB35C' : '#6FE0A0']);
    if (O.empty) rows.push(['', T[1] >= O.r ? 'empty: bigger, not sharper — already resolved' : 'empty: bigger, and still not resolved', '#FFB35C']);
    if (O.noOil) rows.push(['', 'no oil under the 100×: dim and milky', '#FF8A80']);
    return { rows };
  }

  /* ============================================================
     THE HEADER — what is happening, and its numbers
     ============================================================ */
  function headerOf(S, O) {
    const p = S.p, mag = Math.round(O.M) + '×', det = 'finest detail ' + fmtUm(O.r), fld = 'field ' + fmtUm(O.field);
    if (p.setup === 'hooke') {
      const who = p.instr === 'hooke' ? "Hooke's microscope" : p.instr === 'leeu' ? "Leeuwenhoek's lens" : 'Today’s microscope';
      const line = p.hspec === 'cork' ? who + ' on cork: little boxes Hooke called cells' : p.hspec === 'pepper' ? who + ' on pepper water: Leeuwenhoek’s “animalcules”' : who + ' on scrapings from teeth: bacteria, 1683';
      const C = p.hspec === 'cork' ? corkCountView(S, O) : null;
      return [line, mag + ' · ' + det + ' · ' + fld + ' · ' + (O.invert ? 'image turned round' : 'image the right way up'), C ? 'the gold line crosses ' + C.n.toFixed(0) + ' cells: ' + fmtN(C.perInch) + ' an inch — Hooke counted 1,080' : (p.instr === 'hooke' ? 'Hooke saw nothing smaller than his finest detail — no bacteria' : 'focus up and down: they swim in and out of view')];
    }
    if (p.setup === 'theory') {
      if (p.tspec === 'root') { const R = rootOf(S), E = rootEstimate(R.tally, R.N, p.tempR), div = R.N - R.tally.I; return ['An onion root tip: ' + div + ' of ' + R.N + ' cells caught dividing', 'every new cell comes from a cell that split · the cycle takes about ' + E.T.toFixed(0) + ' h at ' + p.tempR + ' °C', 'prophase ' + R.tally.P + ' · metaphase ' + R.tally.M + ' · anaphase ' + R.tally.A + ' · telophase ' + R.tally.T + ' — share of cells = share of time']; }
      if (p.tspec === 'elodea') return ['Elodea, a pondweed leaf: plant cells, alive', mag + ' · ' + det + ' · a wall round every cell; chloroplasts carried round it', 'the green discs stream at about 5–9 µm a second — the cell is working'];
      return ['Cheek cells, stained blue: animal cells', mag + ' · ' + det + ' · no wall, a nucleus in each', 'Schwann, 1839: animals are made of cells too — the same plan as plants'];
    }
    if (p.setup === 'living') {
      const hrs = S.ts / 3600;
      if (p.lspec === 'yeast') { const L = S.live; return ['Yeast in ' + (p.sugar > 0 ? p.sugar + ' g/L sugar' : 'plain water') + ' at ' + p.temp + ' °C: ' + L.yeastN + ' cells after ' + (hrs < 1 ? (S.ts / 60).toFixed(0) + ' min' : hrs.toFixed(1) + ' h'), mag + ' · time-lapse ×' + p.lapse + ' · doubling ' + (yeastRate(p.temp, p.sugar) > 0 ? (Math.LN2 / yeastRate(p.temp, p.sugar)).toFixed(1) + ' h' : 'never'), p.mb ? L.dead + ' stained blue (dead) · ' + (L.yeastN - L.dead) + ' clear (alive)' : 'add methylene blue: living cells clear it, dead ones stay blue']; }
      if (p.lspec === 'pollen' || p.lspec === 'rock') { const D1 = diffusion(1, p.temp); return [p.lspec === 'pollen' ? 'Pollen in water: its specks jiggle, as Brown saw in 1827' : 'Rock dust jiggles too — Brown’s test, 1828', mag + ' · a 1 µm speck: D = ' + D1.toFixed(2) + ' µm²/s · wanders ' + Math.sqrt(4 * D1).toFixed(1) + ' µm a second at ' + p.temp + ' °C', 'water molecules strike from every side — warm water, faster; living or not, the same']; }
      const s = S.salt, big = s ? s.xs.reduce((u, c) => Math.max(u, c.e), 0) : 0;
      return ['Salt drying on a slide: the cubes grow, nothing is alive', mag + ' · ' + p.rh + ' % humidity · time-lapse ×' + p.lapse + ' · largest cube ' + big.toFixed(0) + ' µm', p.rh > 75 ? 'above 75 % humidity brine takes water from the air: the salt dissolves' : 'every gram of water that leaves drops 0.36 g of salt out of the brine'];
    }
    if (p.setup === 'unicellular') {
      const P = PROTIST[p.org], T = cvPeriod(p.org, p.salt), v = P.v / (VISC[p.visc] || 1);
      return [P.name + ': one cell ' + ({ paramecium: 'swimming, eating, bailing water', euglena: 'swimming to the light, making its own food', amoeba: 'creeping, engulfing, bailing water', chlamy: 'rowing to the light with two flagella' })[p.org], mag + ' · ' + (p.visc === 'water' ? 'plain water' : p.visc === 'thin' ? 'thin methyl cellulose' : 'thick methyl cellulose') + ' · speed ' + (v >= 100 ? (v / 1000).toFixed(2) + ' mm/s' : v.toFixed(1) + ' µm/s') + ' · salt ' + p.salt.toFixed(2) + ' %', isFinite(T) ? 'water leaks in; the contractile vacuole empties every ' + T.toFixed(1) + ' s' : 'salty water: nothing leaks in, the vacuole stops, the cell shrinks'];
    }
    if (p.setup === 'multicellular') {
      if (p.colony === 'leaf') return ['A privet leaf in section: tissues of different cells', mag + ' · stained: lignified walls red, the rest green', 'each tissue a team of alike cells; together, an organ'];
      const C = COLONY[p.colony];
      return [C.name + ': ' + fmtN(C.N) + ' cell' + (C.N > 1 ? 's' : '') + (C.germ < 1 ? ', ' + (C.germ < 0.1 ? '16' : 'half') + ' that make the next generation' : C.N > 1 ? ', every one able to start a colony' : ' that is the whole organism'), mag + ' · ' + C.shape + ' · swims ' + C.swim + ' µm/s', p.divide ? 'every cell stopped to divide: no flagella beat, and it sinks ' + sinkSpeed(p.colony).toFixed(0) + ' µm a second' : p.split ? 'broken apart: which cells can carry on alone?' : 'turn on "every cell divides" and watch it sink out of focus'];
    }
    const T = THING[p.sspec] || THING.micrometer;
    return [({ micrometer: 'The stage micrometer: 1 mm in hundredths', letter: 'A newspaper e: upside down and back to front', hair: 'A human hair', cheek: 'Cheek cells, measured', blood: 'Blood: red cells, a few white', bacteria: 'Bacteria from yoghurt', diatoms: 'The diatom test: rows of pores finer than a micrometre', virus: 'A drop with viruses in it: nothing to see' })[p.sspec], mag + ' · ' + det + ' · ' + fld + ' · useful ' + Math.round(O.useful[0]) + '–' + Math.round(O.useful[1]) + '×', O.empty ? 'empty magnification: past 1000 × NA it grows bigger but no sharper' : T[0] + ': ' + fmtUm(T[1])];
  }

  /* ============================================================
     PLOTS — this microscope, set as it is; and the landscape of all
     ============================================================ */
  const lg = Math.log10;
  const logFmt = v => { const x = Math.pow(10, v); return x >= 1000 ? (x / 1000).toFixed(0) + 'k' : x >= 1 ? x.toFixed(0) : x >= 0.1 ? x.toFixed(1) : x >= 0.01 ? x.toFixed(2) : x.toFixed(3); };
  const umFmt = v => { const x = Math.pow(10, v); return x >= 1000 ? (x / 1000).toFixed(0) + ' mm' : x >= 1 ? x.toFixed(0) + ' µm' : x >= 0.001 ? (x * 1000).toFixed(0) + ' nm' : (x * 1e6).toFixed(0) + ' pm'; };
  const HISTORY = [
    [1665, 5, 'Hooke: cells'], [1676, 1.35, 'Leeuwenhoek: protists, then bacteria'], [1831, 1, 'Brown: the nucleus'],
    [1879, 0.3, 'Flemming: chromosomes dividing'], [1886, 0.2, 'Abbe and Zeiss: the limit of light'], [1933, 0.05, 'Ruska: electrons beat light'], [1939, 0.01, 'viruses seen at last']
  ];
  const LADDER = [['a frog’s egg', 1500], ['an onion skin cell', 250], ['a human hair', 72], ['a cheek cell', 60], ['a pollen grain', 30], ['a red blood cell', 7.5], ['a yeast cell', 5], ['a bacterium', 2], ['a mitochondrion', 1], ['a virus', 0.1], ['a ribosome', 0.025], ['DNA, its width', 0.002], ['an atom', 0.0001]];
  const INSTR_PTS = () => [['eye', 1, EYE_RES], ['hand lens', 10, 10], ['Hooke', 50, 5], ['Leeuwenhoek', 270, 1.35], ['10×/0.25', 100, optics(Object.assign({}, BASE, { obj: 10, cond: 0.25 })).r], ['40×/0.65', 400, optics(Object.assign({}, BASE, { obj: 40, cond: 0.65 })).r], ['100× oil', 1000, optics(Object.assign({}, BASE, { obj: 100, cond: 0.9 })).r]];

  function plot1(S, g) {
    const p = S.p, K = kit(), O = opticsOf(p);
    if (p.setup === 'hooke') {
      const items = [{ c: '#FFD66B', dot: true, label: 'the one in use' }, { c: 'rgba(201,212,234,.7)', dot: true, label: 'other instruments' }, { c: 'rgba(111,224,160,.5)', label: 'sizes of things', dash: [4, 3] }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: -0.1, xmax: 3.4, ymin: -0.7, ymax: 2.5, pad: { t: Kk.t }, xticks: [0, 1, 2, 3], yticks: [-0.5, 0, 1, 2], xfmt: logFmt, yfmt: umFmt, xlabel: 'magnification, ×', ylabel: 'finest detail' }).frame();
      const cur = p.instr === 'hooke' ? 'Hooke' : p.instr === 'leeu' ? 'Leeuwenhoek' : null;
      P.clip(() => {
        [['Paramecium', 200], ['cork cell', 23.5], ['bacterium', 2]].forEach(([n, s]) => { P.line([[-0.1, lg(s)], [3.4, lg(s)]], 'rgba(111,224,160,.5)', 1.2, [4, 3]); P.tag(3.35, lg(s), n, '#9FE0B8', 'right', -7); });
        INSTR_PTS().forEach(([n, M, r]) => { const on = n === cur; P.dot(lg(M), lg(r), on ? 6 : 4, on ? '#FFD66B' : 'rgba(201,212,234,.7)'); P.tag(lg(M), lg(r), n, on ? '#FFD66B' : '#AFC0D8', 'left', 11); });
        if (!cur) P.dot(lg(O.M), lg(O.r), 6, '#FFD66B');
      });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'theory') {
      if (p.tspec === 'root') {
        const R = rootOf(S), keys = ['P', 'M', 'A', 'T'], col = { P: '#FFB35C', M: '#6FE0A0', A: '#62C8FF', T: '#D69BFF' };
        const items = [{ c: '#FFB35C', box: true, label: 'cells counted' }, { c: 'rgba(201,212,234,.8)', label: 'expected, ± 2 standard errors', w: 2 }];
        const Kk = K.plotKey(g, items);
        const exp = keys.map(k => PHASE_FRAC[k] * R.N), top = Math.max(4, ...keys.map(k => R.tally[k]), ...exp.map(e => e + 2 * Math.sqrt(e))) * 1.15;
        const P = g.Plot({ xmin: -0.6, xmax: 3.6, ymin: 0, ymax: top, pad: { t: Kk.t }, xticks: [0, 1, 2, 3], xfmt: v => PHASE_NAME[keys[Math.round(v)]] || '', ylabel: 'cells', yfmt: v => v.toFixed(0) }).frame();
        keys.forEach((k, i) => { P.bar(i, R.tally[k], 0.32, 0, col[k]); const e = exp[i], s = Math.sqrt(e * (1 - PHASE_FRAC[k])); P.line([[i - 0.36, e], [i + 0.36, e]], 'rgba(201,212,234,.9)', 2); P.line([[i, Math.max(0, e - 2 * s)], [i, e + 2 * s]], 'rgba(201,212,234,.6)', 1.5); P.tag(i, R.tally[k], String(R.tally[k]), col[k], 'center', -8); });
        Kk.draw(P);
        return;
      }
      const items = [{ c: '#9FE0A0', dot: true, label: 'plants' }, { c: '#8FB4FF', dot: true, label: 'animals' }, { c: '#FFD66B', dot: true, label: 'the rest' }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 1650, xmax: 1870, ymin: 0, ymax: 6, pad: { t: Kk.t }, yticks: [], xlabel: 'year', xfmt: v => v.toFixed(0) }).frame();
      [[1665, 1, 'Hooke names cells (cork)', '#9FE0A0'], [1676, 2, 'Leeuwenhoek: single-celled life', '#FFD66B'], [1831, 3, 'Brown: a nucleus in every cell', '#9FE0A0'], [1838, 4, 'Schleiden: all plants are cells', '#9FE0A0'], [1839, 5, 'Schwann: all animals too', '#8FB4FF'], [1855, 3.9, 'Virchow: every cell from a cell', '#FFD66B']].forEach(([yr, y, t, c]) => { P.dot(yr, y, 5, c); P.tag(yr, y, t, c, yr > 1800 ? 'right' : 'left', -9); });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'living') {
      const k = p.lspec, H = S.hist;
      if (k === 'yeast') {
        const items = [{ c: '#FFD66B', label: 'cells counted' }, { c: '#8FB4FF', label: 'stained dead' }, { c: 'rgba(111,224,160,.8)', label: 'doubling every ' + (yeastRate(p.temp, p.sugar) > 0 ? (Math.LN2 / yeastRate(p.temp, p.sugar)).toFixed(1) + ' h' : '—'), dash: [4, 3] }];
        const Kk = K.plotKey(g, items);
        const tmax = Math.max(1, S.ts / 3600 * 1.1), mu = yeastRate(p.temp, p.sugar), ymax = Math.max(100, ...H.map(q => q[1])) * 1.15;
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'hours', ylabel: 'cells', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { if (mu > 0 && !p.boil) { const pts = []; for (let t = 0; t <= tmax; t += tmax / 60) pts.push([t, Math.min(ymax * 2, 70 * Math.exp(mu * t))]); P.line(pts, 'rgba(111,224,160,.8)', 1.6, [4, 3]); } P.line(H.map(q => [q[0] / 3600, q[1]]), '#FFD66B', 2.2); P.line(H.map(q => [q[0] / 3600, q[2]]), '#8FB4FF', 1.8); });
        Kk.draw(P);
        return;
      }
      if (k === 'salt') {
        const items = [{ c: '#FFD66B', label: 'largest cube, µm' }, { c: '#62C8FF', label: 'water left, µg' }];
        const Kk = K.plotKey(g, items);
        const tmax = Math.max(2, S.ts / 60 * 1.1);
        const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'µm · µg', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.line(H.map(q => [q[0] / 60, q[1]]), '#FFD66B', 2.2); P.line(H.map(q => [q[0] / 60, q[2]]), '#62C8FF', 2); });
        Kk.draw(P);
        return;
      }
      // the wandering of five specks: random walks
      const tr = S.dyn.filter(it => it.track && it.track.length > 1).slice(0, 5), cols = ['#FFD66B', '#62C8FF', '#FF8A80', '#9FE0A0', '#D69BFF'];
      const items = [{ c: '#FFD66B', label: 'five specks: how far each has wandered along x' }];
      const Kk = K.plotKey(g, items);
      const tmax = Math.max(4, ...tr.map(it => it.track[it.track.length - 1][0] - it.track[0][0]));
      let lim = 3; tr.forEach(it => it.track.forEach(q => { lim = Math.max(lim, Math.abs(q[1] - it.track[0][1]) * 1.2); }));
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: -lim, ymax: lim, pad: { t: Kk.t }, xlabel: 'seconds', ylabel: 'µm', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => tr.forEach((it, i) => P.line(it.track.map(q => [q[0] - it.track[0][0], q[1] - it.track[0][1]]), cols[i], 1.8)));
      Kk.draw(P);
      return;
    }
    if (p.setup === 'unicellular') {
      const items = [{ c: '#62C8FF', label: 'time between emptyings' }, { c: '#FFD66B', dot: true, label: 'this water' }, { c: 'rgba(255,138,128,.25)', box: true, label: 'saltier than the cell: it shrinks' }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 0, xmax: 0.5, ymin: 0, ymax: 80, pad: { t: Kk.t }, xlabel: 'salt in the water, %', ylabel: 'seconds', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(0) }).frame();
      const pts = []; for (let s = 0; s <= 0.5; s += 0.0025) { const T = cvPeriod(p.org, s); if (isFinite(T) && T < 80) pts.push([s, T]); }
      const stop = (C_IN - POND) / (osmOf(1) - POND);
      P.clip(() => { g.ctx.save(); g.ctx.fillStyle = 'rgba(255,138,128,.18)'; g.ctx.fillRect(P.X(stop), P.Y(80), P.X(0.5) - P.X(stop), P.Y(0) - P.Y(80)); g.ctx.restore(); P.line(pts, '#62C8FF', 2.2); const T = cvPeriod(p.org, p.salt); P.dot(p.salt, isFinite(T) ? Math.min(78, T) : 78, 5.5, '#FFD66B'); });
      P.tag(stop, 70, 'stops at ' + (stop * 100).toFixed(0) / 100 + ' %', '#FF8A80', 'left', 0);
      Kk.draw(P);
      return;
    }
    if (p.setup === 'multicellular') {
      const items = [{ c: '#9FE0A0', label: 'swims (measured, about)' }, { c: '#FF8A80', label: 'would sink, if it stopped' }, { c: '#FFD66B', dot: true, label: 'this one' }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 0.5, xmax: 2.6, ymin: -0.5, ymax: 2.7, pad: { t: Kk.t }, xticks: [1, 2], yticks: [0, 1, 2], xfmt: v => logFmt(v) + ' µm', yfmt: v => logFmt(v), xlabel: 'colony radius', ylabel: 'µm/s' }).frame();
      const keys = Object.keys(COLONY);
      P.clip(() => {
        P.line(keys.map(k => [lg(COLONY[k].R), lg(COLONY[k].swim)]), '#9FE0A0', 2);
        P.line(keys.map(k => [lg(COLONY[k].R), lg(sinkSpeed(k))]), '#FF8A80', 2);
        keys.forEach(k => { const on = k === p.colony; P.dot(lg(COLONY[k].R), lg(COLONY[k].swim), on ? 6 : 3.5, on ? '#FFD66B' : '#9FE0A0'); P.dot(lg(COLONY[k].R), lg(sinkSpeed(k)), on ? 6 : 3.5, on ? '#FFD66B' : '#FF8A80'); P.tag(lg(COLONY[k].R), lg(COLONY[k].swim), COLONY[k].name, on ? '#FFD66B' : '#AFC0D8', 'center', -10); });
      });
      Kk.draw(P);
      return;
    }
    // scale: the size ladder against what each way of looking can show
    const items = [{ c: '#FFD66B', dot: true, label: 'things' }, { c: 'rgba(98,200,255,.8)', label: 'this microscope’s limit', w: 2 }, { c: 'rgba(201,212,234,.5)', label: 'the eye · light · electrons', dash: [4, 3] }];
    const Kk = K.plotKey(g, items);
    const P = g.Plot({ xmin: -4.3, xmax: 3.6, ymin: -0.5, ymax: LADDER.length - 0.5, pad: { t: Kk.t, l: 12 }, xticks: [-4, -3, -2, -1, 0, 1, 2, 3], yticks: [], xfmt: umFmt, xlabel: 'size' }).frame();
    P.clip(() => {
      [[lg(EYE_RES), 'eye'], [lg(0.2), 'light'], [lg(0.0002), 'electrons']].forEach(([x, n]) => { P.vline(x, 'rgba(201,212,234,.5)', [4, 3]); P.tag(x, LADDER.length - 0.8, n, '#AFC0D8', 'left', 0); });
      P.vline(lg(O.r), 'rgba(98,200,255,.85)');
      LADDER.forEach(([n, s], i) => { const y = LADDER.length - 1 - i, seen = s >= O.r; P.dot(lg(s), y, 4, seen ? '#FFD66B' : 'rgba(255,138,128,.8)'); P.tag(lg(s), y, n, seen ? '#EAF1FF' : '#FF8A80', lg(s) > 0 ? 'right' : 'left', 0); });
    });
    Kk.draw(P);
  }

  function plot2(S, g) {
    const p = S.p, K = kit(), O = opticsOf(p);
    if (p.setup === 'hooke') {
      const items = [{ c: '#FFD66B', dot: true, label: 'finest detail anyone could see' }];
      const Kk = K.plotKey(g, items);
      const P = g.Plot({ xmin: 1640, xmax: 1960, ymin: -2.3, ymax: 1.1, pad: { t: Kk.t }, yticks: [-2, -1, 0, 1], yfmt: umFmt, xlabel: 'year', xfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(HISTORY.map(q => [q[0], lg(q[1])]), 'rgba(255,214,107,.5)', 1.5); HISTORY.forEach(([yr, r, t], i) => { P.dot(yr, lg(r), 4.5, '#FFD66B'); P.tag(yr, lg(r), t, '#EAF1FF', yr > 1900 ? 'right' : 'left', i % 2 ? 10 : -9); }); });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'theory') {
      if (p.tspec === 'root') {
        const O2 = optics(p), items = [{ c: '#FFD66B', label: 'mitosis, from the count' }, { c: 'rgba(255,214,107,.25)', box: true, label: '± 2 standard errors' }, { c: 'rgba(111,224,160,.8)', label: 'the time it truly takes', dash: [4, 3] }];
        const Kk = K.plotKey(g, items);
        const pts = [], band = [], T = cycleHours(p.tempR), truth = (1 - PHASE_FRAC.I) * T;
        for (let n = 1; n <= 12; n++) { const F = fieldsOf(n, O2.field), R = rootCount({ cells: S.cells || rootCells(p.seed) }, F, O2.field), E = rootEstimate(R.tally, R.N, p.tempR), f = R.N ? 1 - R.tally.I / R.N : 0, se = R.N ? Math.sqrt(f * (1 - f) / R.N) * T : 0; pts.push([R.N, E.mitosis]); band.push([R.N, E.mitosis - 2 * se, E.mitosis + 2 * se]); }
        const xmax = pts[pts.length - 1][0] * 1.05;
        const P = g.Plot({ xmin: 0, xmax, ymin: 0, ymax: truth * 2.2, pad: { t: Kk.t }, xlabel: 'cells counted', ylabel: 'hours', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
        P.clip(() => {
          const ctx = g.ctx; ctx.save(); ctx.fillStyle = 'rgba(255,214,107,.18)'; ctx.beginPath(); band.forEach((q, i) => { const X = P.X(q[0]), Y = P.Y(q[2]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); for (let i = band.length - 1; i >= 0; i--) ctx.lineTo(P.X(band[i][0]), P.Y(band[i][1])); ctx.closePath(); ctx.fill(); ctx.restore();
          P.line([[0, truth], [xmax, truth]], 'rgba(111,224,160,.8)', 1.6, [4, 3]); P.line(pts, '#FFD66B', 2); const cur = pts[clamp(Math.round(p.fields), 1, 12) - 1]; P.dot(cur[0], cur[1], 5.5, '#FFD66B');
        });
        Kk.draw(P);
        return;
      }
      const items = [{ c: '#9FE0A0', box: true, label: 'cell length' }];
      const Kk = K.plotKey(g, items);
      const sizes = [['onion skin', 250], ['Elodea leaf', 80], ['cheek', 60], ['root tip', 22], ['red blood', 7.5], ['yeast', 5], ['bacterium', 2]];
      const P = g.Plot({ xmin: -0.6, xmax: sizes.length - 0.4, ymin: 0, ymax: 2.6, pad: { t: Kk.t }, xticks: sizes.map((_, i) => i), yticks: [0, 1, 2], xfmt: v => (sizes[Math.round(v)] || [''])[0], yfmt: umFmt }).frame();
      sizes.forEach(([n, s], i) => { P.bar(i, lg(s), 0.3, 0, n === 'Elodea leaf' || n === 'onion skin' || n === 'root tip' ? '#9FE0A0' : n === 'cheek' || n === 'red blood' ? '#8FB4FF' : '#FFD66B'); });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'living') {
      const k = p.lspec;
      if (k === 'yeast') {
        const items = [{ c: '#9FE0A0', label: 'growth rate, per hour' }, { c: '#FFD66B', dot: true, label: 'this warmth' }];
        const Kk = K.plotKey(g, items);
        const pts = []; for (let T = 0; T <= 50; T += 0.5) pts.push([T, yeastRate(T, p.sugar)]);
        const P = g.Plot({ xmin: 0, xmax: 60, ymin: 0, ymax: 0.55, pad: { t: Kk.t }, xlabel: '°C', ylabel: 'per hour', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
        P.clip(() => { P.line(pts, '#9FE0A0', 2.2); P.dot(p.temp, yeastRate(p.temp, p.sugar), 5.5, '#FFD66B'); if (p.temp >= 50) P.tag(p.temp, 0.02, 'dies', '#FF8A80', 'right', -6); });
        Kk.draw(P);
        return;
      }
      if (k === 'salt') {
        const items = [{ c: '#62C8FF', label: 'water leaving the drop, µg per min' }, { c: '#FFD66B', dot: true, label: 'this air' }];
        const Kk = K.plotKey(g, items);
        const pts = []; for (let h = 10; h <= 95; h += 1) pts.push([h, evapRate(0.56, h, p.temp) * 60e6]);
        const P = g.Plot({ xmin: 10, xmax: 95, ymin: -8, ymax: 30, pad: { t: Kk.t }, xlabel: 'humidity, %', ylabel: 'µg/min', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { P.hline(0, 'rgba(201,212,234,.5)'); P.vline(75.3, 'rgba(255,138,128,.7)', [4, 3]); P.line(pts, '#62C8FF', 2.2); P.dot(p.rh, evapRate(0.56, p.rh, p.temp) * 60e6, 5.5, '#FFD66B'); });
        P.tag(75.3, 26, 'brine stops drying', '#FF8A80', 'left', 0);
        Kk.draw(P);
        return;
      }
      // mean squared distance against time: a straight line is a random walk
      const D1 = diffusion(1, p.temp), D3 = diffusion(3, p.temp), ms = msdOf(S);
      const items = [{ c: '#FFD66B', dot: true, label: 'measured, from the tracks' }, { c: 'rgba(111,224,160,.8)', label: '4Dt, 1 µm specks', dash: [4, 3] }, { c: 'rgba(98,200,255,.8)', label: '4Dt, 3 µm specks', dash: [4, 3] }];
      const Kk = K.plotKey(g, items);
      const tmax = Math.max(5, ...ms.map(q => q[0])), ymax = Math.max(4 * D1 * tmax, ...ms.map(q => q[1])) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: tmax, ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'seconds', ylabel: 'mean square, µm²', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line([[0, 0], [tmax, 4 * D1 * tmax]], 'rgba(111,224,160,.8)', 1.6, [4, 3]); P.line([[0, 0], [tmax, 4 * D3 * tmax]], 'rgba(98,200,255,.8)', 1.6, [4, 3]); ms.forEach(q => P.dot(q[0], q[1], 4, '#FFD66B')); });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'unicellular') {
      if (p.org === 'euglena' || p.org === 'chlamy') {
        const items = [{ c: '#9FE0A0', label: 'share in the lit half' }];
        const Kk = K.plotKey(g, items);
        const H = S.photo || [], tmax = Math.max(20, S.t);
        const P = g.Plot({ xmin: Math.max(0, tmax - 60), xmax: tmax, ymin: 0, ymax: 1, pad: { t: Kk.t }, xlabel: 'seconds', ylabel: 'share', xfmt: v => v.toFixed(0), yfmt: v => (v * 100).toFixed(0) + '%' }).frame();
        P.clip(() => { P.hline(0.5, 'rgba(201,212,234,.4)', [4, 3]); P.line(H, '#9FE0A0', 2.2); });
        Kk.draw(P);
        return;
      }
      const items = [{ c: '#EAF1FF', label: 'pH inside a food vacuole, by its age' }, { c: '#FFD66B', dot: true, label: 'the vacuoles in this cell' }];
      const Kk = K.plotKey(g, items);
      const pts = []; for (let a = 0; a <= FV_LIFE; a += 10) pts.push([a / 60, fvPH(a)]);
      const P = g.Plot({ xmin: 0, xmax: 25, ymin: 2.5, ymax: 7.5, pad: { t: Kk.t }, xlabel: 'minutes since it was swallowed', ylabel: 'pH', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      const ctx = g.ctx; ctx.save();
      for (let v = 2.5; v < 7.5; v += 0.1) { ctx.fillStyle = RXmix(congoCol(v + 0.05), 0.22); ctx.fillRect(P.X(0), P.Y(v + 0.1), P.X(25) - P.X(0), P.Y(v) - P.Y(v + 0.1) + 1); }
      ctx.restore();
      P.clip(() => { P.line(pts, '#EAF1FF', 2); (S.main && S.main.fv || []).forEach(v => P.dot(v.age / 60, v.pH, 4.5, congoCol(v.pH))); });
      P.tag(24.5, 5.4, 'Congo red: red', '#FF8A80', 'right', 0); P.tag(24.5, 2.9, 'blue below pH 3', '#8FB4FF', 'right', 0);
      Kk.draw(P);
      return;
    }
    if (p.setup === 'multicellular') {
      const items = [{ c: '#FFD66B', dot: true, label: 'share of cells that can make offspring' }];
      const Kk = K.plotKey(g, items);
      const keys = Object.keys(COLONY);
      const P = g.Plot({ xmin: -0.2, xmax: 3.6, ymin: -0.05, ymax: 1.1, pad: { t: Kk.t }, xticks: [0, 1, 2, 3], xfmt: logFmt, yfmt: v => (v * 100).toFixed(0) + '%', xlabel: 'cells in the colony', ylabel: 'share' }).frame();
      P.clip(() => { P.line(keys.map(k => [lg(COLONY[k].N), COLONY[k].germ]), 'rgba(255,214,107,.5)', 1.5); keys.forEach(k => { const on = k === p.colony; P.dot(lg(COLONY[k].N), COLONY[k].germ, on ? 6 : 4, on ? '#FFD66B' : '#AFC0D8'); P.tag(lg(COLONY[k].N), COLONY[k].germ, COLONY[k].name, on ? '#FFD66B' : '#AFC0D8', k === 'volvox' ? 'right' : 'center', -10); }); });
      Kk.draw(P);
      return;
    }
    // scale: detail seen against magnification — flat past 1000 × NA
    const items = [{ c: '#62C8FF', label: 'finest detail seen, this objective' }, { c: '#FFD66B', dot: true, label: 'now' }, { c: 'rgba(111,224,160,.25)', box: true, label: 'useful: 500–1000 × NA' }];
    const Kk = K.plotKey(g, items);
    const P = g.Plot({ xmin: 1, xmax: 4.3, ymin: -0.7, ymax: 1.3, pad: { t: Kk.t }, xticks: [1, 2, 3, 4], yticks: [-0.5, 0, 1], xfmt: logFmt, yfmt: umFmt, xlabel: 'total magnification, ×', ylabel: 'finest detail' }).frame();
    const pts = []; for (let x = 1; x <= 4.3; x += 0.02) { const Mx = Math.pow(10, x); pts.push([x, lg(Math.max(O.r, EYE_RES / Mx * 1.5))]); }
    P.clip(() => { const ctx = g.ctx; ctx.save(); ctx.fillStyle = 'rgba(111,224,160,.14)'; ctx.fillRect(P.X(lg(O.useful[0])), P.Y(1.3), P.X(lg(O.useful[1])) - P.X(lg(O.useful[0])), P.Y(-0.7) - P.Y(1.3)); ctx.restore(); P.line(pts, '#62C8FF', 2.2); P.dot(lg(O.M), lg(Math.max(O.r, EYE_RES / O.M * 1.5)), 6, '#FFD66B'); });
    if (O.empty) P.tag(lg(O.M), lg(O.r), 'empty', '#FFB35C', 'center', -12);
    Kk.draw(P);
  }
  function msdOf(S) {
    const tr = S.dyn.filter(it => it.track && it.track.length > 3 && it.kind === 'particle' && it.d < 2.5);
    const out = [];
    for (let lag = 1; lag <= 12; lag++) {
      let s = 0, n = 0;
      tr.forEach(it => { const T = it.track; for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const d = T[j][0] - T[i][0]; if (Math.abs(d - lag * DT_TRACK) > DT_TRACK / 2) continue; s += (T[j][1] - T[i][1]) ** 2 + (T[j][2] - T[i][2]) ** 2; n++; break; } });
      if (n > 10) out.push([lag * DT_TRACK, s / n]);
    }
    return out;
  }
  function congoCol(pH) { const f = clamp((5.2 - pH) / 2.2, 0, 1); const a = [210, 54, 46], b = [59, 63, 168]; return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',') + ')'; }
  const RXmix = (c, a) => c.replace('rgb(', 'rgba(').replace(')', ',' + a + ')');

  /* ============================================================
     READOUTS, THE EQUATION
     ============================================================ */
  function scopeReadouts(O, p) {
    return [
      { label: 'Magnification', value: Math.round(O.M) + '×', flag: O.empty ? 'warn' : '', hint: p.obj + '× objective × ' + p.eye + '× eyepiece' + (p.zoom > 1 ? ' × ' + p.zoom + ' zoom' : '') },
      { label: 'Finest detail', value: fmtUm(O.r), flag: 'accent', hint: '1.22λ ÷ (NA obj + NA cond)' },
      { label: 'Field of view', value: fmtUm(O.field), hint: 'field stop ' + (EYEPIECE[p.eye] || 18) + ' mm ÷ ' + (p.obj * p.zoom) }
    ];
  }
  function readouts(S) {
    const p = S.p, O = opticsOf(p);
    if (p.setup === 'hooke') {
      const out = [
        { label: 'Instrument', value: p.instr === 'hooke' ? 'Hooke' : p.instr === 'leeu' ? 'Leeuwenhoek' : 'today', hint: p.instr === 'modern' ? p.obj + '× objective' : INSTR[p.instr].name },
        { label: 'Magnification', value: Math.round(O.M) + '×', hint: p.instr === 'leeu' ? '250 mm ÷ a 0.9 mm focal length' : p.instr === 'hooke' ? 'about' : 'objective × eyepiece' },
        { label: 'Finest detail', value: fmtUm(O.r), flag: 'accent', hint: p.instr === 'hooke' ? 'an estimate' : p.instr === 'leeu' ? 'his best lens, measured 1981' : '1.22λ ÷ (NA + NA)' },
        { label: 'Field of view', value: fmtUm(O.field) },
        { label: 'Image', value: O.invert ? 'turned round' : 'upright', hint: O.invert ? 'two lenses: the image crosses over' : 'one lens: no crossing' }
      ];
      if (p.hspec === 'cork') { const C = corkCountView(S, O); out.push({ label: 'Cells an inch', value: fmtN(C.perInch), flag: 'accent', hint: C.n.toFixed(0) + ' along ' + fmtUm(C.len) + ' · Hooke 1,080' }, { label: 'In a cubic inch', value: (C.perCu / 1e9).toFixed(2) + ' billion', hint: 'Hooke: 1,259,712,000' }); }
      return out;
    }
    if (p.setup === 'theory') {
      if (p.tspec === 'root') {
        const R = rootOf(S), E = rootEstimate(R.tally, R.N, p.tempR);
        return [
          { label: 'Cells counted', value: String(R.N), hint: p.fields + ' field' + (p.fields > 1 ? 's' : '') + ' at ' + Math.round(O.M) + '×' },
          { label: 'Dividing', value: (E.mi * 100).toFixed(1), unit: '%', flag: 'accent', hint: 'the mitotic index' },
          { label: 'Cell cycle', value: E.T.toFixed(0), unit: 'h', hint: 'about 20 h at 20 °C, Q10 = 2' },
          { label: 'Mitosis', value: E.mitosis.toFixed(2), unit: 'h', flag: 'accent', hint: 'dividing share × cycle' },
          { label: 'Prophase', value: E.est.P.toFixed(2), unit: 'h' }, { label: 'Metaphase', value: E.est.M.toFixed(2), unit: 'h' },
          { label: 'Anaphase', value: E.est.A.toFixed(2), unit: 'h' }, { label: 'Telophase', value: E.est.T.toFixed(2), unit: 'h' }
        ];
      }
      return scopeReadouts(O, p).concat([{ label: 'Depth in focus', value: fmtUm(O.dof), hint: 'λn ÷ NA²' }, { label: 'Stain', value: p.tspec === 'cheek' ? 'methylene blue' : 'none', hint: p.tspec === 'cheek' ? 'the nucleus takes it up' : 'the chloroplasts are green of themselves' }]);
    }
    if (p.setup === 'living') {
      const k = p.lspec, base = [{ label: 'Magnification', value: Math.round(O.M) + '×', hint: 'finest detail ' + fmtUm(O.r) }, { label: 'Time', value: S.ts < 3600 ? (S.ts / 60).toFixed(1) : (S.ts / 3600).toFixed(2), unit: S.ts < 3600 ? 'min' : 'h', hint: 'time-lapse ×' + p.lapse }];
      if (k === 'yeast') { const L = S.live, mu = yeastRate(p.temp, p.sugar); return base.concat([{ label: 'Yeast cells', value: String(L.yeastN), flag: 'accent', hint: 'from 70' }, { label: 'Doubling time', value: mu > 0 ? (Math.LN2 / mu).toFixed(2) : '—', unit: mu > 0 ? 'h' : '', hint: 'at ' + p.temp + ' °C, ' + p.sugar + ' g/L sugar' }, { label: 'Stained dead', value: p.mb ? String(L.dead) : '—', hint: p.mb ? 'methylene blue' : 'no stain added' }, { label: 'CO₂ bubbles', value: String(S.dyn.filter(b => b.kind === 'co2').length), hint: 'fermenting sugar' }]); }
      if (k === 'salt') { const s = S.salt, big = s.xs.reduce((u, c) => Math.max(u, c.e), 0); return base.concat([{ label: 'Water left', value: (s.water * 1e6).toFixed(1), unit: 'µg', hint: 'of 88' }, { label: 'Largest cube', value: big.toFixed(0), unit: 'µm', flag: 'accent' }, { label: 'Crystals', value: String(s.xs.filter(c => c.e > 2).length) }, { label: 'Drying rate', value: (evapRate(Math.max(0.05, s.R / 1000), p.rh, p.temp) * 60e6).toFixed(1), unit: 'µg/min', hint: p.rh > 75 ? 'negative: taking water in' : 'Hu and Larson' }]); }
      const D1 = diffusion(1, p.temp), eta = viscosity(p.temp);
      return base.concat([{ label: 'D, a 1 µm speck', value: D1.toFixed(3), unit: 'µm²/s', flag: 'accent', hint: 'kT ÷ 6πηa' }, { label: 'Wanders in 1 s', value: Math.sqrt(4 * D1).toFixed(2), unit: 'µm', hint: '√(4Dt)' }, { label: 'Water viscosity', value: (eta * 1000).toFixed(2), unit: 'mPa·s', hint: 'at ' + p.temp + ' °C' }, { label: 'Boiled first?', value: p.boil ? 'yes' : 'no', hint: 'makes no difference to the jiggling' }]);
    }
    if (p.setup === 'unicellular') {
      const P = PROTIST[p.org], v = P.v / (VISC[p.visc] || 1), T = cvPeriod(p.org, p.salt), Re = 1000 * v * 1e-6 * P.L * 1e-6 / (1e-3 * (VISC[p.visc] || 1));
      const m = S.main, nf = m && m.fv ? m.fv.length : 0;
      return [
        { label: 'Magnification', value: Math.round(O.M) + '×', hint: 'finest detail ' + fmtUm(O.r) + ' · field ' + fmtUm(O.field) },
        { label: 'Swimming speed', value: v >= 100 ? (v / 1000).toFixed(2) : v.toFixed(1), unit: v >= 100 ? 'mm/s' : 'µm/s', hint: 'slowed by the methyl cellulose ' + (VISC[p.visc] || 1) + '×' },
        { label: 'Body lengths a second', value: (v / P.L).toFixed(1) },
        { label: 'Reynolds number', value: Re < 0.01 ? Re.toExponential(1) : Re.toFixed(2), hint: 'stops dead when it stops beating' },
        { label: 'Vacuole empties every', value: isFinite(T) ? T.toFixed(1) : 'never', unit: isFinite(T) ? 's' : '', flag: isFinite(T) ? 'accent' : 'crit', hint: 'water leaks in: 64 mOsm inside' },
        { label: 'Outside water', value: osmOf(p.salt).toFixed(0), unit: 'mOsm', hint: p.salt.toFixed(2) + ' % salt' },
        { label: 'Food vacuoles', value: String(nf), hint: p.food ? 'fed Congo-red yeast' : 'unfed' }
      ];
    }
    if (p.setup === 'multicellular') {
      if (p.colony === 'leaf') return scopeReadouts(O, p).concat([{ label: 'Leaf thickness', value: '210', unit: 'µm' }, { label: 'Kinds of cell', value: '6', hint: 'epidermis, guard, palisade, spongy, xylem, phloem' }]);
      const C = COLONY[p.colony], vs = sinkSpeed(p.colony), sunk = S.main ? Math.max(0, -S.main.z) : 0;
      return [
        { label: 'Magnification', value: Math.round(O.M) + '×', hint: 'finest detail ' + fmtUm(O.r) + ' · field ' + fmtUm(O.field) },
        { label: 'Cells', value: fmtN(C.N), hint: C.shape },
        { label: 'Can reproduce', value: C.germ >= 1 ? 'all' : C.germ >= 0.5 ? 'half' : '16', flag: C.germ < 1 ? 'accent' : '', hint: C.germ < 1 ? 'the rest only swim' : 'every cell can start a colony' },
        { label: 'Radius', value: String(C.R), unit: 'µm' },
        { label: 'Swims', value: String(C.swim), unit: 'µm/s', hint: 'measured, about' },
        { label: 'Would sink', value: vs.toFixed(C.R > 20 ? 0 : 1), unit: 'µm/s', flag: p.divide ? 'crit' : '', hint: '2Δρ g R² ÷ 9η' },
        { label: 'In 6 hours', value: (vs * 6 * 3600 / 1e4).toFixed(0), unit: 'cm', hint: 'if every cell stopped to divide' },
        { label: 'Sunk so far', value: sunk.toFixed(0), unit: 'µm', flag: sunk > 20 ? 'crit' : '', hint: sunk > 20 ? 'below the focal plane: blurred' : 'swimming keeps it up' }
      ];
    }
    const Th = THING[p.sspec] || THING.micrometer, dv = 100 / (p.obj * p.zoom);
    return scopeReadouts(O, p).concat([
      { label: 'Measured', value: (Th[1] / dv >= 10 ? (Th[1] / dv).toFixed(0) : (Th[1] / dv).toFixed(1)), unit: 'divisions', flag: Th[1] < O.r ? 'crit' : 'accent', hint: Th[0].split(',')[0] + ', ' + fmtUm(Th[1]) + (Th[1] < O.r ? ' — too fine to see' : '') },
      { label: 'Useful up to', value: Math.round(O.useful[1]) + '×', flag: O.empty ? 'warn' : '', hint: '1000 × NA ' + O.NAo.toFixed(2) + (O.empty ? ' — beyond it, empty' : '') },
      { label: 'Graticule division', value: fmtUm(100 / (p.obj * p.zoom)), hint: '100 µm ÷ objective' },
      { label: 'Depth in focus', value: fmtUm(O.dof), hint: 'λn ÷ NA²' },
      { label: 'Brightness', value: (O.bright * 100 / 1).toFixed(0), unit: '%', flag: O.bright < 0.4 ? 'warn' : '', hint: 'falls as (NA ÷ M)²' }
    ]);
  }
  function equation(S) {
    const p = S.p, E = L.E, O = opticsOf(p);
    if (p.setup === 'hooke' && p.instr === 'leeu') return E.v('M') + ' ' + E.op('=') + ' ' + E.frac('250 mm', E.v('f')) + ' ' + E.op('=') + ' ' + E.frac('250 mm', E.n(0.93, 'mm')) + ' ' + E.op('≈') + ' ' + E.n(270, '×') + '  (a glass bead of a lens, about 1.2 mm across)';
    if (p.setup === 'hooke' && p.hspec === 'cork') { const C = corkCountView(S, O); return E.v('N') + E.sub('inch') + ' ' + E.op('=') + ' ' + E.frac(E.n(Math.round(C.n), 'cells'), E.n(C.len.toFixed(0), 'µm')) + ' × 25 400 ' + E.op('=') + ' ' + E.n(fmtN(C.perInch), '') + '   ·   ' + E.v('N') + E.sub('cubic inch') + ' ' + E.op('=') + ' ' + E.v('N') + E.sub('inch') + '³ ' + E.op('=') + ' ' + E.n((C.perCu / 1e9).toFixed(2), 'billion'); }
    if (p.setup === 'theory' && p.tspec === 'root') { const R = rootOf(S), E2 = rootEstimate(R.tally, R.N, p.tempR); return E.v('t') + E.sub('mitosis') + ' ' + E.op('=') + ' ' + E.frac(E.v('n') + E.sub('dividing'), E.v('N')) + ' × ' + E.v('T') + E.sub('cycle') + ' ' + E.op('=') + ' ' + E.frac(E.n(R.N - R.tally.I, ''), E.n(R.N, '')) + ' × ' + E.n(E2.T.toFixed(0), 'h') + ' ' + E.op('=') + ' ' + E.n(E2.mitosis.toFixed(2), 'h'); }
    if (p.setup === 'living' && (p.lspec === 'pollen' || p.lspec === 'rock')) { const D1 = diffusion(1, p.temp); return E.v('D') + ' ' + E.op('=') + ' ' + E.frac(E.v('k') + E.v('T'), '6π' + E.v('η') + E.v('a')) + ' ' + E.op('=') + ' ' + E.frac('1.38×10⁻²³ × ' + E.n(p.temp + 273, 'K'), '6π × ' + E.n((viscosity(p.temp) * 1000).toFixed(2), 'mPa·s') + ' × 0.5 µm') + ' ' + E.op('=') + ' ' + E.n(D1.toFixed(3), 'µm²/s') + '   ·   ' + E.v('r') + E.sub('rms') + ' ' + E.op('=') + ' √(4' + E.v('D') + E.v('t') + ')'; }
    if (p.setup === 'living' && p.lspec === 'yeast') { const mu = yeastRate(p.temp, p.sugar); return E.v('N') + ' ' + E.op('=') + ' ' + E.v('N') + E.sub('0') + ' × 2' + '<sup>' + E.v('t') + '/' + E.v('T') + '<sub>d</sub></sup>  ' + E.op('·') + '  ' + E.v('T') + E.sub('d') + ' ' + E.op('=') + ' ' + E.n(mu > 0 ? (Math.LN2 / mu).toFixed(2) : '∞', 'h') + ' at ' + E.n(p.temp, '°C') + ', ' + E.n(p.sugar, 'g/L') + ' sugar'; }
    if (p.setup === 'living') return E.v('m') + E.sub('salt') + ' ' + E.op('=') + ' 0.359 × ' + E.v('m') + E.sub('water lost') + '   ·   drying stops when the air is damper than the brine (75 %)';
    if (p.setup === 'unicellular') { const T = cvPeriod(p.org, p.salt), P = PROTIST[p.org]; return E.v('T') + E.sub('vacuole') + ' ' + E.op('=') + ' ' + E.frac(E.v('T') + E.sub('pond') + ' (' + E.v('C') + E.sub('in') + ' − ' + E.v('C') + E.sub('pond') + ')', E.v('C') + E.sub('in') + ' − ' + E.v('C') + E.sub('out')) + ' ' + E.op('=') + ' ' + E.frac(E.n(P.cvT0, 's') + ' × (64 − 5)', '64 − ' + E.n(osmOf(p.salt).toFixed(0), 'mOsm')) + ' ' + E.op('=') + ' ' + (isFinite(T) ? E.n(T.toFixed(1), 's') : 'never: no water leaks in'); }
    if (p.setup === 'multicellular' && p.colony !== 'leaf') { const C = COLONY[p.colony]; return E.v('v') + E.sub('sink') + ' ' + E.op('=') + ' ' + E.frac('2' + E.v('Δρ') + E.v('g') + E.v('R') + '²', '9' + E.v('η')) + ' ' + E.op('=') + ' ' + E.n(sinkSpeed(p.colony).toFixed(1), 'µm/s') + '  (R = ' + C.R + ' µm; the cells, 5 % denser than water, spread through the jelly)'; }
    return E.v('d') + ' ' + E.op('=') + ' ' + E.frac('1.22 ' + E.v('λ'), E.v('NA') + E.sub('obj') + ' + ' + E.v('NA') + E.sub('cond')) + ' ' + E.op('=') + ' ' + E.frac('1.22 × ' + E.n(O.lam.toFixed(3), 'µm'), E.n(O.NAo.toFixed(2), '') + ' + ' + E.n(O.NAc.toFixed(2), '')) + ' ' + E.op('=') + ' ' + E.n(O.r < 1 ? (O.r * 1000).toFixed(0) : O.r.toFixed(2), O.r < 1 ? 'nm' : 'µm');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'hooke') return p.instr === 'leeu' ? 'A single bead of glass: the smaller the bead, the shorter its focal length and the more it magnifies. Leeuwenhoek ground and blew beads so small that his best lens magnified about 270 times — enough to see bacteria in 1683, a detail Hooke’s compound microscope could not show.' : 'Hooke looked at a thin slice of cork and saw little boxes, "much like a Honey-comb", and called them cells. He counted about 60 along an eighteenth of an inch — 1,080 an inch — and cubed that for a cubic inch: 1,259,712,000.';
    if (p.setup === 'theory') return p.tspec === 'root' ? 'If the cells of a root tip are spread evenly through their cycle, the share caught in a phase is the share of time spent in it. Count enough of them and the estimate settles: the ± shrinks as one over the square root of the number counted.' : 'Schleiden (1838) found every plant made of cells; Schwann (1839) found animals made of cells too, each with a nucleus. Virchow (1855) added the third part: every cell comes from a cell.';
    if (p.setup === 'living') return p.lspec === 'yeast' ? 'A living thing takes in energy and uses it to grow, to make more of itself and to keep itself in order. Yeast does all of it: it ferments sugar, buds, and keeps methylene blue out of its working cells.' : p.lspec === 'salt' ? 'A crystal grows because the water it sits in is leaving: salt must come out of the brine and settle on what is already solid. Nothing in it feeds, and in damp air it goes back into solution.' : 'Molecules of water, moving faster the warmer it is, strike a small speck unevenly from every side. It wanders, the square of its distance growing in step with time — whether it came from a flower or a rock.';
    if (p.setup === 'unicellular') return 'Pond water holds fewer dissolved particles than the cell, so water leaks in all the time; the contractile vacuole collects it and pumps it out. Salt in the water makes the difference smaller, the leak slower — and past about 0.19 % the leak turns round and the cell shrinks.';
    if (p.setup === 'multicellular') return 'A cell that divides draws in its flagella. A small colony can stop swimming for a while; a big one sinks faster (as the radius squared), so Volvox keeps swimmer cells that never divide and a few big cells that only divide.';
    return 'Light cannot show detail much finer than about half its wavelength. The objective’s NA sets the limit; the eyepiece and the camera only make the image bigger. Past about 1000 × NA the image grows without anything new to show.';
  };

  /* ============================================================
     DRAGGING — the eyepiece view moves the slide, the knobs work
     ============================================================ */
  const OBJS = [4, 10, 40, 100];
  function onDrag(S, e) {
    const p = S.p, v = S._view;
    if (e.id === 'view' && v) {
      // drag the image and it follows the hand: the slide moves the other way when the image is turned round
      const k = v.O.field / (2 * v.Ly.R), sx = v.O.invert ? -1 : 1, sy = v.O.invert ? 1 : -1;
      p.sx = clamp(p.sx - e.dx * k * sx, -2500, 2500); p.sy = clamp(p.sy - e.dy * k * sy, -2500, 2500); p.follow = false;
    } else if (e.id === 'focus') p.focus = clamp(p.focus - e.dy * 0.8, -120, 120);
    else if (e.id === 'iris') p.cond = clamp(p.cond + e.dx * 0.006, 0.02, 0.9);
    else if (e.id === 'lamp') p.lamp = clamp(p.lamp - e.dy * 0.008, 0, 1);
    else if (e.id === 'turret' && e.phase === 'start') p.obj = OBJS[(OBJS.indexOf(p.obj) + 1) % OBJS.length];
  }
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  const whenScope = S => scopeIs(S);
  const stageFree = S => !((S.p.setup === 'unicellular' || (S.p.setup === 'multicellular' && S.p.colony !== 'leaf')) && S.p.follow);
  L.register({
    id: 'g6b-microscope',
    grade: 6, unit: '6B', topics: ['B1'],
    subject: 'biology',
    name: 'The Microscope — Discovering Cells',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-1', 'NGSS Science and Engineering Practice 3: planning and carrying out investigations', 'CAST'],
    weight: 'Cells',
    is3D: true,
    autoplay: true,
    bloom: 0.08,
    stageHint: 'Drag the eyepiece view to move the slide · drag the knobs on the microscope · every image is computed',
    lede: 'A microscope on a bench, and what its eyepiece shows — worked out from the optics, not painted. Look at <b>Hooke’s cork</b> and <b>Leeuwenhoek’s animalcules</b> through their own instruments. ' +
      'Count the cells of an onion root tip caught <b>dividing</b>. Decide what is <b>alive</b>: yeast, pollen, rock dust, salt. Watch <b>one cell</b> swim, eat and bail out water, and <b>many cells</b> share the work. ' +
      'Then find how <b>small</b> light can see — and where more magnification stops showing more.',

    params: preset({}),
    presets: [
      { name: 'Hooke’s cork, 1665: count the cells', params: preset({ instr: 'hooke', hspec: 'cork' }) },
      { name: 'Leeuwenhoek’s animalcules in pepper water', params: preset({ instr: 'leeu', hspec: 'pepper' }) },
      { name: 'Leeuwenhoek’s bacteria from teeth, 1683', params: preset({ instr: 'leeu', hspec: 'plaque' }) },
      { name: 'Hooke’s microscope cannot see them', params: preset({ instr: 'hooke', hspec: 'plaque' }) },
      { name: 'An onion root tip: count the dividing cells', params: preset({ setup: 'theory', obj: 40, cond: 0.45 }) },
      { name: 'The same onion, grown warmer', params: preset({ setup: 'theory', obj: 40, cond: 0.45, tempR: 30, fields: 8 }) },
      { name: 'Elodea: a living plant cell', params: preset({ setup: 'theory', tspec: 'elodea', obj: 40, cond: 0.35 }) },
      { name: 'Cheek cells: an animal cell, stained', params: preset({ setup: 'theory', tspec: 'cheek', obj: 40, cond: 0.45 }) },
      { name: 'Yeast in warm sugar water, a day in a minute', params: preset({ setup: 'living', lspec: 'yeast', obj: 100, cond: 0.6, temp: 30, lapse: 600 }) },
      { name: 'Boiled yeast in methylene blue', params: preset({ setup: 'living', lspec: 'yeast', obj: 100, cond: 0.6, temp: 30, boil: true, mb: true, lapse: 600 }) },
      { name: 'Brown’s pollen specks, 1827', params: preset({ setup: 'living', lspec: 'pollen', obj: 40, cond: 0.3, lapse: 1 }) },
      { name: 'Brown’s rock dust, 1828', params: preset({ setup: 'living', lspec: 'rock', obj: 40, cond: 0.3, lapse: 1, boil: true }) },
      { name: 'Salt drying on a slide', params: preset({ setup: 'living', lspec: 'salt', obj: 10, cond: 0.18, lapse: 60 }) },
      { name: 'Paramecium fed on red-stained yeast', params: preset({ setup: 'unicellular', obj: 40, cond: 0.4 }) },
      { name: 'Paramecium in salty water', params: preset({ setup: 'unicellular', obj: 40, cond: 0.4, salt: 0.15 }) },
      { name: 'Euglena swims to the light', params: preset({ setup: 'unicellular', org: 'euglena', obj: 10, cond: 0.18, light: 'dim', follow: false }) },
      { name: 'Amoeba creeping', params: preset({ setup: 'unicellular', org: 'amoeba', obj: 40, cond: 0.4, visc: 'water' }) },
      { name: 'Volvox: two kinds of cell', params: preset({ setup: 'multicellular', obj: 10, cond: 0.18 }) },
      { name: 'Volvox with every cell dividing at once', params: preset({ setup: 'multicellular', obj: 10, cond: 0.18, divide: true }) },
      { name: 'Gonium broken apart', params: preset({ setup: 'multicellular', colony: 'gonium', obj: 40, cond: 0.4, split: true }) },
      { name: 'A leaf: tissues of different cells', params: preset({ setup: 'multicellular', colony: 'leaf', obj: 40, cond: 0.4 }) },
      { name: 'Calibrate the graticule on the micrometer', params: preset({ setup: 'scale', sspec: 'micrometer', grat: true }) },
      { name: 'A newspaper e, turned round', params: preset({ setup: 'scale', sspec: 'letter', obj: 4, cond: 0.06 }) },
      { name: 'Measure a red blood cell', params: preset({ setup: 'scale', sspec: 'blood', obj: 100, cond: 0.9, grat: true }) },
      { name: 'Pleurosigma at 1000×: the pores resolved', params: preset({ setup: 'scale', sspec: 'diatoms', obj: 100, cond: 0.9, zoom: 4, sx: 200 }) },
      { name: 'Pleurosigma at 10×, zoomed 16×: empty', params: preset({ setup: 'scale', sspec: 'diatoms', obj: 10, cond: 0.2, zoom: 16, sx: 200 }) },
      { name: 'The 100× without oil', params: preset({ setup: 'scale', sspec: 'blood', obj: 100, cond: 0.9, oil: false }) },
      { name: 'A drop of viruses', params: preset({ setup: 'scale', sspec: 'virus', obj: 100, cond: 0.9 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'The instrument', when: is('hooke'), items: [
        { key: 'instr', type: 'select', label: 'Look through', rebuild: true, options: [{ value: 'hooke', label: 'Hooke’s microscope, 1665' }, { value: 'leeu', label: 'Leeuwenhoek’s lens, 1670s' }, { value: 'modern', label: 'A school microscope today' }] },
        { key: 'hspec', type: 'select', label: 'Specimen', restructure: R_, rebuild: true, options: [{ value: 'cork', label: 'A thin slice of cork' }, { value: 'pepper', label: 'Pepper water, a few days old' }, { value: 'plaque', label: 'Scrapings from between the teeth' }] },
        { key: 'countLine', type: 'toggle', label: 'Count along a line, as Hooke did', display: true, when: S => S.p.hspec === 'cork' } ] },
      { group: 'The specimen', when: is('theory'), items: [
        { key: 'tspec', type: 'select', label: 'Slide', restructure: R_, rebuild: true, options: [{ value: 'root', label: 'Onion root tip, squashed' }, { value: 'elodea', label: 'Elodea leaf (a plant)' }, { value: 'cheek', label: 'Cheek cells (an animal)' }] },
        { key: 'orcein', type: 'toggle', label: 'Stained with acetic orcein', display: true, when: S => S.p.tspec === 'root' },
        { key: 'tempR', label: 'The onion grew at', min: 10, max: 30, step: 1, unit: '°C', when: S => S.p.tspec === 'root' },
        { key: 'fields', label: 'Fields counted', min: 1, max: 12, step: 1, when: S => S.p.tspec === 'root' },
        { key: 'mark', type: 'toggle', label: 'Ring the dividing cells', display: true, when: S => S.p.tspec === 'root' } ] },
      { group: 'The specimen', when: is('living'), items: [
        { key: 'lspec', type: 'select', label: 'Put on the slide', restructure: R_, rebuild: true, options: [{ value: 'yeast', label: 'Yeast in sugar water' }, { value: 'pollen', label: 'Pollen in water (Brown, 1827)' }, { value: 'rock', label: 'Rock dust in water (Brown, 1828)' }, { value: 'salt', label: 'A drop of salty water' }] },
        { key: 'temp', label: 'Temperature', min: 4, max: 60, step: 1, unit: '°C' },
        { key: 'sugar', label: 'Sugar in the water', min: 0, max: 50, step: 1, unit: 'g/L', when: S => S.p.lspec === 'yeast' },
        { key: 'boil', type: 'toggle', label: 'Boil it first', restructure: R_, when: S => S.p.lspec !== 'salt' },
        { key: 'mb', type: 'toggle', label: 'Add methylene blue', when: S => S.p.lspec === 'yeast' },
        { key: 'rh', label: 'Humidity of the room', min: 20, max: 95, step: 1, unit: '%', when: S => S.p.lspec === 'salt' },
        { key: 'lapse', type: 'select', label: 'Time-lapse', options: [{ value: 1, label: 'real time' }, { value: 10, label: '×10' }, { value: 60, label: '×60 (a minute a second)' }, { value: 600, label: '×600 (10 minutes a second)' }] } ] },
      { group: 'The organism', when: is('unicellular'), items: [
        { key: 'org', type: 'select', label: 'Watch', restructure: R_, rebuild: true, options: [{ value: 'paramecium', label: 'Paramecium' }, { value: 'euglena', label: 'Euglena' }, { value: 'amoeba', label: 'Amoeba' }, { value: 'chlamy', label: 'Chlamydomonas' }] },
        { key: 'salt', label: 'Salt in the water', min: 0, max: 0.5, step: 0.01, unit: '%', fmt: v => v.toFixed(2) },
        { key: 'food', type: 'toggle', label: 'Feed it yeast stained with Congo red', restructure: R_, when: S => S.p.org === 'paramecium' || S.p.org === 'amoeba' },
        { key: 'light', type: 'select', label: 'Lamp at one side of the slide', when: S => S.p.org === 'euglena' || S.p.org === 'chlamy', options: [{ value: 'off', label: 'off' }, { value: 'dim', label: 'on, gentle' }, { value: 'bright', label: 'on, glaring' }] },
        { key: 'visc', type: 'select', label: 'Thicken the water', options: [{ value: 'water', label: 'plain water' }, { value: 'thin', label: 'methyl cellulose, thin (8×)' }, { value: 'thick', label: 'methyl cellulose, thick (40×)' }] },
        { key: 'follow', type: 'toggle', label: 'Follow it with the stage', display: true, rebuild: true } ] },
      { group: 'The organism', when: is('multicellular'), items: [
        { key: 'colony', type: 'select', label: 'Watch', restructure: R_, rebuild: true, options: [{ value: 'chlamy', label: 'Chlamydomonas — 1 cell' }, { value: 'gonium', label: 'Gonium — 16' }, { value: 'pandorina', label: 'Pandorina — 16' }, { value: 'eudorina', label: 'Eudorina — 32' }, { value: 'pleodorina', label: 'Pleodorina — 128' }, { value: 'volvox', label: 'Volvox — about 2000' }, { value: 'leaf', label: 'A leaf — true tissues' }] },
        { key: 'divide', type: 'toggle', label: 'Every cell stops to divide', when: S => S.p.colony !== 'leaf' },
        { key: 'split', type: 'toggle', label: 'Break the colony apart', restructure: R_, display: true, when: S => S.p.colony !== 'leaf' && S.p.colony !== 'chlamy' },
        { key: 'follow', type: 'toggle', label: 'Follow it with the stage', display: true, rebuild: true, when: S => S.p.colony !== 'leaf' } ] },
      { group: 'The slide', when: is('scale'), items: [
        { key: 'sspec', type: 'select', label: 'Slide', restructure: R_, rebuild: true, options: [{ value: 'micrometer', label: 'Stage micrometer, 0.01 mm lines' }, { value: 'letter', label: 'A letter e from a newspaper' }, { value: 'hair', label: 'Two hairs' }, { value: 'cheek', label: 'Cheek cells' }, { value: 'blood', label: 'A blood smear' }, { value: 'bacteria', label: 'Bacteria from yoghurt' }, { value: 'diatoms', label: 'Diatom test plate' }, { value: 'virus', label: 'A drop with viruses' }] } ] },
      { group: 'The microscope', when: whenScope, items: [
        { key: 'obj', type: 'select', label: 'Objective', rebuild: true, options: [{ value: 4, label: '4× / 0.10 (red)' }, { value: 10, label: '10× / 0.25 (yellow)' }, { value: 40, label: '40× / 0.65 (blue)' }, { value: 100, label: '100× / 1.25 oil (white)' }] },
        { key: 'eye', type: 'select', label: 'Eyepiece', when: is('scale'), options: [{ value: 10, label: '10×, field 18 mm' }, { value: 15, label: '15×, field 13 mm' }, { value: 20, label: '20×, field 10 mm' }] },
        { key: 'zoom', label: 'Camera zoom', min: 1, max: 16, step: 1, unit: '×', when: is('scale') },
        { key: 'cond', label: 'Condenser iris', min: 0.02, max: 0.9, step: 0.01, unit: 'NA', display: true, fmt: v => v.toFixed(2) },
        { key: 'filter', type: 'select', label: 'Filter over the lamp', when: is('scale'), options: [{ value: 'white', label: 'none (white, 550 nm)' }, { value: 'blue', label: 'blue, 450 nm' }, { value: 'green', label: 'green, 546 nm' }, { value: 'red', label: 'red, 650 nm' }] },
        { key: 'lamp', label: 'Lamp', min: 0, max: 1, step: 0.01, display: true, fmt: v => Math.round(v * 100) + ' %' },
        { key: 'oil', type: 'toggle', label: 'A drop of oil under the 100×', when: S => S.p.obj === 100 },
        { key: 'grat', type: 'toggle', label: 'Graticule in the eyepiece', display: true } ] },
      { group: 'Focus and stage', items: [
        { key: 'focus', label: 'Focus', min: -120, max: 120, step: 0.5, unit: 'µm', display: true, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
        { key: 'sx', label: 'Stage, left–right', min: -2500, max: 2500, step: 5, unit: 'µm', display: true, when: stageFree, fmt: v => v.toFixed(0) },
        { key: 'sy', label: 'Stage, back–front', min: -2500, max: 2500, step: 5, unit: 'µm', display: true, when: stageFree, fmt: v => v.toFixed(0) },
        { key: 'seed', label: 'Another slide', min: 1, max: 9, step: 1, restructure: R_, display: true, when: S => S.p.setup !== 'scale' || !['micrometer', 'diatoms'].includes(S.p.sspec) } ] }
    ],

    setup, step, drawStage, onDrag, onPointer,
    plots: [
      { title: S => ({ hooke: 'What each instrument can show', theory: S.p.tspec === 'root' ? 'Cells counted in each phase' : 'Who showed that life is cells', living: S.p.lspec === 'yeast' ? 'Yeast cells over time' : S.p.lspec === 'salt' ? 'The drop drying, the cubes growing' : 'Five specks, wandering', unicellular: 'How often the vacuole empties', multicellular: 'Swimming against sinking', scale: 'How small things are, and what can see them' })[S.p.setup], draw: plot1 },
      { title: S => ({ hooke: 'Three hundred years of seeing smaller', theory: S.p.tspec === 'root' ? 'The count settles as you count more' : 'How big cells are', living: S.p.lspec === 'yeast' ? 'Growth against temperature' : S.p.lspec === 'salt' ? 'Drying against humidity' : 'Wandering: the square of the distance grows with time', unicellular: S.p.org === 'euglena' || S.p.org === 'chlamy' ? 'Swimmers in the lit half' : 'A food vacuole digesting', multicellular: 'The more cells, the fewer that breed', scale: 'More magnification, and when it stops helping' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · Hooke’s arithmetic', params: preset({ instr: 'hooke', hspec: 'cork' }),
        q: 'Hooke counted about 60 cells in the eighteenth part of an inch. How many cells did he reckon are in a cubic inch of cork? Check it by counting along the gold line.',
        predict: { label: 'Cells in a cubic inch (billions)', unit: 'billion', tol: 0.12 },
        measure: S => { const O = instrOptics(S.p), C = corkCount({ cells: corkCells(S.p.seed) }, S.p.sx, corkRow(S.p.sy), O.field * 0.8); return C.perCu / 1e9; },
        working: '60 × 18 = 1,080 cells an inch; a square inch holds 1,080² = 1,166,400 and a cubic inch 1,080³ = <b>1,259,712,000 — about 1.26 billion</b>. The line in the lab counts the walls it crosses and gets the same figure to within a few per cent, because the model’s cells are 25.4 mm ÷ 1,080 = 23.5 µm across, as Hooke’s were.' },
      { source: 'CAST pattern · the limit of a lens', params: preset({ setup: 'scale', sspec: 'diatoms', obj: 40, cond: 0.52, sx: 200, zoom: 8 }),
        q: 'A 40× objective has NA 0.65. The condenser iris is set to NA 0.52, and the light is white (550 nm). What is the finest detail it can show — and can it show Pleurosigma’s pores, 0.65 µm apart?',
        predict: { label: 'Finest detail', unit: 'µm', tol: 0.05 },
        measure: S => optics(S.p).r,
        working: 'd = 1.22λ ÷ (NA obj + NA cond) = 1.22 × 0.55 ÷ (0.65 + 0.52) = <b>0.57 µm</b>. The pores, 0.65 µm apart, are just resolved — faintly. Close the iris to 0.2 and d grows to 0.79 µm: they vanish.' },
      { source: 'CAST pattern · counting to measure time', params: preset({ setup: 'theory', obj: 40, cond: 0.45, fields: 8 }),
        q: 'An onion root tip grown at 20 °C takes 20 hours to go through its cycle. If about 1 cell in 10 is dividing, how long does mitosis take? Count 8 fields to check.',
        predict: { label: 'Mitosis', unit: 'h', tol: 0.2 },
        measure: S => { const O = optics(S.p), R = rootCount({ cells: rootCells(S.p.seed) }, fieldsOf(S.p.fields, O.field), O.field); return rootEstimate(R.tally, R.N, S.p.tempR).mitosis; },
        working: 'If the cells are spread evenly through the cycle, the share dividing is the share of time spent dividing: 1/10 × 20 h = <b>2 h</b>. The count of 8 fields gives about that, give or take the ± of any count.' },
      { source: 'CAST pattern · Brown’s motion', params: preset({ setup: 'living', lspec: 'pollen', obj: 40, cond: 0.3, lapse: 1, temp: 20 }),
        q: 'At 20 °C a 1 µm speck wanders about 1.3 µm in a second. How far does it wander, on average, in 4 seconds?',
        predict: { label: 'Distance in 4 s', unit: 'µm', tol: 0.08 },
        measure: S => Math.sqrt(4 * diffusion(1, S.p.temp) * 4),
        working: 'A random walk’s distance grows as the square root of time: 4 times as long, √4 = 2 times as far — <b>about 2.6 µm</b>. From the physics: D = kT ÷ 6πηa = 0.43 µm²/s, and √(4 × 0.43 × 4) = 2.62 µm.' },
      { source: 'CAST pattern · a cell bailing water', params: preset({ setup: 'unicellular', obj: 40, cond: 0.4, salt: 0.1 }),
        q: 'In pond water (5 mOsm) a Paramecium’s vacuole empties every 10 s; inside the cell is 64 mOsm. Salt at 0.1 % raises the water to about 37 mOsm. Predict the new time between emptyings.',
        predict: { label: 'Time between emptyings', unit: 's', tol: 0.08 },
        measure: S => cvPeriod('paramecium', S.p.salt),
        working: 'Water leaks in in proportion to the difference: 64 − 5 = 59 before, 64 − 37 = 27 now. The leak is 27/59 as fast, so the vacuole takes 59/27 as long: 10 × 59/27 ≈ <b>22 s</b>.' },
      { source: 'CAST pattern · why Volvox keeps swimmers', params: preset({ setup: 'multicellular', obj: 10, cond: 0.18, divide: true }),
        q: 'If every cell of a Volvox colony stopped beating its flagella, the colony would sink at about 37 µm a second (Stokes’s law, with its cells and gonidia spread through the jelly). How far would it sink in 6 hours?',
        predict: { label: 'Distance sunk', unit: 'cm', tol: 0.1 },
        measure: S => sinkSpeed('volvox') * 6 * 3600 / 1e4,
        working: '37 µm/s × 21,600 s ≈ 800,000 µm = <b>about 80 cm</b> — far below the sunlit water it lives by. So its swimming cells never divide, and a few big cells do all the dividing while the rest keep it up.' },
      { source: 'CAST pattern · empty magnification', params: preset({ setup: 'scale', sspec: 'diatoms', obj: 10, cond: 0.2, zoom: 16, sx: 200 }),
        q: 'A 10×/0.25 objective, a 10× eyepiece and a camera zooming 16×: what is the total magnification, and is it more than is useful (1000 × NA)?',
        predict: { label: 'Total magnification', unit: '×', tol: 0.01 },
        measure: S => optics(S.p).M,
        working: '10 × 10 × 16 = <b>1600×</b>. Useful stops at 1000 × 0.25 = 250×. Everything above is empty: the image is bigger, the blur bigger with it, and Pleurosigma’s pores never appear.' }
    ],

    walkthrough: [
      { title: 'Were Hooke’s cells alive?', ask: 'Hooke called the little boxes in cork "cells". Were they alive when he saw them?', reveal: 'No. Cork is bark: the cells died and only their walls remain — empty boxes full of air. Hooke saw the walls that living cells had built, and named the whole thing after a monk’s small room.', params: preset({ instr: 'hooke', hspec: 'cork' }) },
      { title: 'One lens against three', ask: 'Leeuwenhoek used one tiny lens, Hooke two or three. Whose instrument showed smaller things?', reveal: 'Leeuwenhoek’s: about 270× with detail to 1.35 µm, against Hooke’s 50× and a few micrometres. More lenses meant more colour fringes and blur in 1665. Only his lens saw bacteria.', params: preset({ instr: 'leeu', hspec: 'plaque' }) },
      { title: 'Most cells are not dividing', ask: 'In a root tip, why are most cells not dividing, whenever you look?', reveal: 'Because a cell spends most of its cycle — about 90 % — growing and copying its DNA between divisions. The share caught dividing is the share of time spent dividing.', params: preset({ setup: 'theory', obj: 40, cond: 0.45 }) },
      { title: 'Jiggling is not life', ask: 'Pollen specks jiggle in water. Does that prove they are alive?', reveal: 'No — Brown thought so for a moment in 1827, then found that dust of glass and rock jiggles just the same, and boiling changes nothing. Water molecules push small things about. Living things are made of cells, take in energy, grow and reproduce.', params: preset({ setup: 'living', lspec: 'rock', obj: 40, cond: 0.3, lapse: 1, boil: true }) },
      { title: 'Growing is not life either', ask: 'Salt crystals grow on a drying slide. Why aren’t they alive?', reveal: 'They grow only because water leaves and salt must come out of the brine. They have no cells, take in no food, make no copies of themselves — and in damp air they shrink back into solution.', params: preset({ setup: 'living', lspec: 'salt', obj: 10, cond: 0.18, lapse: 60 }) },
      { title: 'A pump for water', ask: 'Why does a Paramecium need a pump that bails out water?', reveal: 'The pond water holds fewer dissolved particles than the cell, so water leaks in without stopping. Without the contractile vacuole it would swell and burst. Add salt and the leak slows — the vacuole slows with it.', params: preset({ setup: 'unicellular', obj: 40, cond: 0.4, salt: 0.1 }) },
      { title: 'Who does the dividing?', ask: 'Every cell of Gonium can start a new colony. Can every cell of Volvox?', reveal: 'No — only about 16 of its 2000. The rest only swim, and die with the colony. That division of labour is what makes Volvox truly many-celled, and it keeps the colony swimming while its big cells divide.', params: preset({ setup: 'multicellular', obj: 10, cond: 0.18 }) },
      { title: 'Bigger is not sharper', ask: 'Zoom the camera until a diatom fills the screen at 10×. Do its pores appear?', reveal: 'No. The finest detail is set by the objective’s NA — 1.34 µm for a 10×/0.25 — and the pores are 0.65 µm apart. Zooming only enlarges the blur: empty magnification. Only a higher-NA objective shows them.', params: preset({ setup: 'scale', sspec: 'diatoms', obj: 10, cond: 0.2, zoom: 16, sx: 200 }) }
    ],

    quiz: [
      { q: 'Which statement is part of the cell theory?', options: ['All cells come from other cells', 'All cells are the same size', 'Only animals are made of cells', 'Cells form from non-living matter'], answer: 0, explain: 'Schleiden and Schwann: all living things are made of cells; Virchow: every cell comes from a cell.' },
      { q: 'A 40× objective with a 10× eyepiece gives a total magnification of', options: ['50×', '400×', '4000×', '40×'], answer: 1, explain: 'Magnifications multiply: 40 × 10 = 400.' },
      { q: 'Switching from the 10× to the 40× objective, the field of view', options: ['gets 4 times narrower', 'stays the same', 'gets 4 times wider', 'gets 16 times narrower in width'], answer: 0, explain: 'The field is the eyepiece’s field stop ÷ the objective: 1.8 mm becomes 0.45 mm.' },
      { q: 'Moving the slide to the left on a compound microscope makes the image move', options: ['to the right', 'to the left', 'up', 'not at all'], answer: 0, explain: 'The image is turned round (rotated 180°), so it moves the opposite way.' },
      { q: 'Which is the best evidence that yeast is alive?', options: ['It buds into new cells while using sugar', 'It jiggles in water', 'It is small', 'It is round'], answer: 0, explain: 'Growth and reproduction powered by food are signs of life; jiggling is Brownian motion.' },
      { q: 'A Paramecium placed in slightly salty water will', options: ['empty its contractile vacuole less often', 'empty it more often', 'burst', 'stop swimming'], answer: 0, explain: 'Less water leaks in when the outside is saltier, so the vacuole fills more slowly.' },
      { q: 'Volvox is multicellular rather than just a colony because', options: ['its cells are specialised and cannot live alone', 'it is green', 'it swims', 'it is round'], answer: 0, explain: 'Most of its cells only swim and cannot reproduce: a division of labour.' },
      { q: 'Why can no light microscope show a virus 100 nm across?', options: ['It is smaller than about half a wavelength of light', 'Viruses are transparent to electrons', 'Lenses cannot magnify 1000×', 'The virus moves too fast'], answer: 0, explain: 'd = 1.22λ ÷ (NA + NA) ≈ 0.2 µm at best — twice the virus.' }
    ],

    notes: '<p><b>The microscope’s numbers.</b> Magnification multiplies: objective × eyepiece. The field of view is the eyepiece’s field stop divided by the objective (18 mm ÷ 40 = 0.45 mm). The finest detail is set by the objective’s <b>numerical aperture</b>, NA: d = 1.22λ ÷ (NA objective + NA condenser), about 0.2 µm at best. Past about 1000 × NA more magnification is <b>empty</b>: bigger, not sharper.</p>' +
      '<p><b>Discovering cells.</b> Hooke (1665) saw the walls of dead cork cells and named them cells. Leeuwenhoek (1670s), with single lenses up to about 270×, saw living single-celled organisms and, in 1683, bacteria. Schleiden (1838) and Schwann (1839) found every plant and animal made of cells; Virchow (1855): every cell comes from a cell.</p>' +
      '<p><b>Alive or not.</b> Living things are made of cells, take in and use energy, grow, reproduce and keep their insides in order. Movement alone proves nothing: small specks of anything jiggle in water (Brownian motion), and crystals grow as water evaporates.</p>' +
      '<p><b>One cell, many cells.</b> A single-celled organism does every job itself — Paramecium swims with cilia, digests food in vacuoles, bails water with contractile vacuoles. In Volvox most cells only swim and a few only reproduce: specialisation is what many-celled life is built on.</p>' +
      '<p><b>The trap.</b> “More magnification always shows more.” It does not: the objective’s NA sets what can be seen, and magnification beyond about 1000 × NA only enlarges the blur.</p>'
  });

  L.models = L.models || {};
  L.models['g6b-microscope'] = { optics, instrOptics, corkCells, corkCount, rootCells, rootCount, rootEstimate, fieldsOf, cycleHours, PHASE_FRAC, diffusion, viscosity, yeastRate, yeastDeath, evapRate, cvPeriod, osmOf, fvPH, sinkSpeed, COLONY, PROTIST, OBJ, HOOKE, BASE: () => preset({}) };
})(window.InsightLab);
