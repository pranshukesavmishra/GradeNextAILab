/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-4  The Body Systems Bench
   (B4.1 Digestive; B4.2 Excretory; B4.3 Circulatory; B4.4 Respiratory;
    B4.5 Muscular; B4.6 Nervous)

   One classic experiment for each system, on one bench:
     digestive   — amylase on starch in a water bath, sampled onto a spotting
                   tile of iodine every half minute (Michaelis–Menten, Q10,
                   thermal denaturation, pH): where is the optimum, and why?
     excretory   — drink a litre and collect urine every 30 minutes; plasma
                   osmolality sets ADH, ADH sets how concentrated the urine is
                   (water vs saline; no ADH; too much ADH). A urinometer reads it.
     circulatory — the heart as a pump (output = rate × stroke volume) and
                   a narrowed artery: Poiseuille resistance ∝ L/r⁴ in series
                   with the bed it feeds. Two branches fill two cylinders.
     respiratory — the bell-jar lung: pull the rubber sheet, the jar's air
                   expands (Boyle), the balloons fill; puncture it and they
                   don't. The same law in a real chest, and the spirometer.
     muscular    — the forearm as a lever: the biceps pulls ~9 times the load,
                   muscles only pull, so the triceps pushes for you.
     nervous     — the ruler-drop test: catch distance → reaction time by
                   d = ½gt², a class of trials, and the path the signal takes.
   Registration and every model load without a page; only drawing uses G6B, R3.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, GA = () => window.G6B;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const gauss = r => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(0.5); };
  const g0 = 9.81;

  /* ============================================================
     1 · DIGESTIVE — amylase and starch
     rate = V37 · Q10^((T−37)/10) · e^(−((pH−opt)/w)²) · E · S/(Km + S) · active,
     active falls with a half-life that halves every 4 °C above 45 °C
     ============================================================ */
  const ENZ = {
    saliva: { name: 'salivary amylase', opt: 6.8, w: 1.5, V37: 0.3, half45: 300, slope: 4 },
    pancreas: { name: 'pancreatic amylase', opt: 7.1, w: 1.5, V37: 0.3, half45: 420, slope: 4 }
  };
  const AMY_KM = 0.4, Q10 = 2.0, T_END = 1800;
  const halfLife = (e, T) => e.half45 * Math.pow(2, -(T - 45) / e.slope);
  function amyRate(p, S, a) { const e = ENZ[p.enz]; return e.V37 * Math.pow(Q10, (p.temp - 37) / 10) * Math.exp(-Math.pow((p.pH - e.opt) / e.w, 2)) * p.enzC * S / (AMY_KM + S) * a; }   // % starch a minute
  function amyRun(p) {
    const e = ENZ[p.enz], out = []; let S = p.starch, a = p.boiled ? 0 : 1, t = 0; const dt = 0.5, kd = Math.LN2 / halfLife(e, p.temp);
    while (t <= T_END + 1e-9) { out.push([t, S, a]); S = Math.max(0, S - amyRate(p, S, a) / 60 * dt); a *= Math.exp(-kd * dt); t += dt; }
    const end = out.find(q => q[1] < 0.02);
    return { out, end: end ? end[0] : Infinity, at: s => out[clamp(Math.round(s / dt), 0, out.length - 1)] };
  }
  /* the colour iodine gives a drop with this much starch in it */
  const IODINE = [[0.3, '#16152E', 'blue-black'], [0.12, '#30285A', 'dark purple'], [0.05, '#6A3E5C', 'purple-brown'], [0.02, '#9A5A3A', 'red-brown'], [-1, '#B87A2A', 'orange-brown: no starch']];
  const iodineOf = S => IODINE.find(q => S > q[0]);

  /* ============================================================
     2 · EXCRETORY — a water load and ADH
     plasma osm = solute ÷ body water; ADH = 0.4 pg/mL per mOsm above 282;
     urine osm = 50 + 1150·ADH/(ADH + 0.6); urine flow = 0.6 mOsm/min ÷ urine osm
     ============================================================ */
  const KID = { W0: 42, osm0: 285, GFR: 125, excr: 0.6, thresh: 282, gain: 0.4, tauADH: 10, tauGut: 20, minutes: 240 };
  function kidneyRun(p) {
    const sol0 = KID.osm0 * KID.W0, salt = p.kind === 'saline' ? 286 : 0, out = [], dt = 0.5;
    let W = KID.W0, gut = p.kind === 'none' ? 0 : p.drink, gutSol = gut * salt, sol = sol0, adh = KID.gain * (KID.osm0 - KID.thresh), urine = 0, uSol = 0, t = 0;
    while (t <= KID.minutes + 1e-9) {
      const Posm = sol / W, target = p.adh === 'none' ? 0 : p.adh === 'max' ? 10 : Math.max(0, KID.gain * (Posm - KID.thresh));
      adh += (target - adh) * (1 - Math.exp(-dt / KID.tauADH));
      const Uosm = 50 + 1150 * adh / (adh + 0.6), excr = KID.excr + (p.kind === 'saline' ? Math.max(0, sol - sol0) / 1440 : 0), V = excr / Uosm;
      const abs = gut * (1 - Math.exp(-dt / KID.tauGut)), absSol = gut > 0 ? gutSol * abs / gut : 0;
      out.push({ t, V: V * 1000, Uosm, Posm, adh, urine: urine * 1000, uSol, W });
      gut -= abs; gutSol -= absSol; W += abs - V * dt; sol += absSol + KID.excr * dt - excr * dt;   /* the body makes 0.6 mOsm of waste a minute and must excrete it */ urine += V * dt; uSol += excr * dt; t += dt;
    }
    const at = m => out[clamp(Math.round(m / dt), 0, out.length - 1)];
    // what each 30-minute collection holds
    const samples = []; for (let k = 1; k <= 8; k++) { const a = at((k - 1) * 30), b = at(k * 30), v = b.urine - a.urine, s = b.uSol - a.uSol; samples.push({ vol: v, osm: v > 0 ? s / (v / 1000) : 0 }); }
    return { out, at, samples };
  }
  const sgOf = osm => 1 + 0.000026 * osm;                // specific gravity a urinometer reads (≈ 1.026 at 1000 mOsm/kg)

  /* ============================================================
     3 · CIRCULATORY — pump and pipes
     output = HR × SV; mean pressure = output × resistance; a narrowing's resistance ∝ η L / r⁴
     ============================================================ */
  const CIRC = { TPR: 93 / 4.9, comp: 1.5, coronary: 250, segFrac: 0.002 };    // mmHg·min/L; mL/mmHg; mL/min; a 1 cm segment's share of its branch
  const eta = h => 1.2 * (1 + 2.5 * h + 7.35 * h * h);                         // blood viscosity, mPa·s, from haematocrit (plasma 1.2)
  const relEta = h => eta(h) / eta(0.45);
  const cardiacOut = p => p.hr * p.sv / 1000;                                  // L/min
  /* muscle vessels open as output rises, so resistance falls: R = R0·(4.9/CO)^0.85, and mean pressure rises only gently (93 → ~110 mmHg at 15 L/min) */
  const meanP = p => cardiacOut(p) * CIRC.TPR * Math.pow(4.9 / cardiacOut(p), 0.85) * relEta(p.hct / 100);
  const pulseP = p => p.sv / CIRC.comp;
  function branchFlow(p, narrow) {
    const n = clamp(narrow == null ? p.narrow / 100 : narrow, 0, 0.99), seg = CIRC.segFrac * p.slen * relEta(p.hct / 100) / Math.pow(1 - n, 4), bed = relEta(p.hct / 100) * 4.9 / cardiacOut(p);   // the heart muscle's own vessels open as it works harder: the narrowing then matters more
    return CIRC.coronary * (meanP(p) / 93) * (1 + CIRC.segFrac) / (bed + seg);
  }
  const poiseuilleRatio = p => Math.pow(1 - p.narrow / 100, -4);

  /* ============================================================
     4 · RESPIRATORY — Boyle in a jar
     the air between the jar and the balloons: P·V = const; the balloons fill until
     the pressure difference across them equals their stiffness × volume
     ============================================================ */
  const RESP = { jar: { A: 113, V0: 2.0, C: 0.05, name: 'bell jar', maxPull: 6 }, chest: { A: 250, V0: 2.4, C: 2.0, name: 'a real chest', maxPull: 6 } };
  const COMP = { stiff: 0.3, normal: 1, floppy: 3 };
  const P_ATM = 101.325;                                                        // kPa
  function boyle(p, pull) {
    const m = RESP[p.model], C = m.C * COMP[p.comp], dV = m.A * pull / 1000;
    if (p.hole || dV <= 0) return { vb: 0, dP: 0, dV };
    let lo = 0, hi = dV;
    for (let k = 0; k < 60; k++) { const vb = (lo + hi) / 2, Pj = P_ATM * m.V0 / (m.V0 + dV - vb); if (vb < C * (P_ATM - Pj)) lo = vb; else hi = vb; }
    const vb = (lo + hi) / 2; return { vb, dP: (P_ATM * m.V0 / (m.V0 + dV - vb) - P_ATM) * 1000, dV };
  }
  const pullAt = (p, t) => p.pull * (0.5 - 0.5 * Math.cos(TAU * p.rate / 60 * t));

  /* ============================================================
     5 · MUSCULAR — the forearm lever
     torques about the elbow: biceps × its moment arm = load × 35 cm × sin + forearm 1.5 kg × 15 cm × sin
     ============================================================ */
  const ARM = { L: 0.35, Lh: 0.30, mf: 1.5, Lcg: 0.15, tri: 0.025 };
  function armForces(p) {
    const th = p.angle * Math.PI / 180, u = [Math.sin(th), Math.cos(th)],      /* the angle is measured from the humerus, which points up from the elbow */ I = [u[0] * p.ins / 100, u[1] * p.ins / 100];
    const d = [0 - I[0], ARM.Lh - I[1]], len = Math.hypot(d[0], d[1]), mArm = Math.abs(I[0] * d[1] / len - I[1] * d[0] / len);
    const hz = Math.abs(u[0]);                                                  // the horizontal reach of the forearm
    const tLoad = p.mode === 'hold' ? (p.mass * ARM.L + ARM.mf * ARM.Lcg) * g0 * hz : ARM.mf * ARM.Lcg * g0 * hz;
    const tPush = p.mode === 'push' ? p.mass * g0 * ARM.L * hz : 0;            // pushing down with the hand on a scale reading mass
    const bic = tLoad / Math.max(1e-6, mArm), tri = tPush > 0 ? Math.max(0, tPush - tLoad) / ARM.tri : 0;
    return { bic: p.mode === 'push' ? Math.max(0, tLoad - tPush) / Math.max(1e-6, mArm) : bic, tri, mArm, tLoad, tPush, load: p.mass * g0, hz };
  }

  /* ============================================================
     6 · NERVOUS — the ruler drop
     reaction time from catch distance: t = √(2d / g); each trial a person's own time
     ============================================================ */
  const CUE = { sight: { name: 'seeing it fall', base: 0.2, stages: [['retina', 0.025], ['optic nerve to the visual cortex', 0.03], ['deciding', 0.08], ['motor cortex to the spinal cord', 0.015], ['nerve to the hand', 0.015], ['muscle and fingers', 0.035]] },
    sound: { name: 'a clap as it drops', base: 0.16, stages: [['cochlea', 0.008], ['auditory nerve to the cortex', 0.012], ['deciding', 0.075], ['motor cortex to the spinal cord', 0.015], ['nerve to the hand', 0.015], ['muscle and fingers', 0.035]] },
    touch: { name: 'a tap on the arm as it drops', base: 0.15, stages: [['skin receptor', 0.005], ['sensory nerve to the cortex', 0.02], ['deciding', 0.06], ['motor cortex to the spinal cord', 0.015], ['nerve to the hand', 0.015], ['muscle and fingers', 0.035]] } };
  const meanRT = p => CUE[p.cue].base + (p.distract ? 0.08 : 0) + Math.max(0, 7 - p.sleep) * 0.012 - (Math.round(p.practice) - 1) * 0.006;
  function trialsOf(p) {
    const r = rng(1000 + p.seed * 7919), n = Math.round(p.trials), m = meanRT(p), sd = 0.022 + (p.distract ? 0.03 : 0), Lr = p.ruler / 100, out = [];
    for (let i = 0; i < n; i++) { const t = Math.max(0.09, m + sd * gauss(r)), d = 0.5 * g0 * t * t; out.push({ t, d, caught: d <= Lr }); }
    return out;
  }
  const tOfD = d => Math.sqrt(2 * d / g0);

  /* ============================================================
     SET-UPS AND PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'digestive', label: 'Digestive: amylase in a water bath', teaches: ['B4.1'] },
    { value: 'excretory', label: 'Excretory: drink a litre, collect the urine', teaches: ['B4.2'] },
    { value: 'circulatory', label: 'Circulatory: the pump and a narrowed artery', teaches: ['B4.3'] },
    { value: 'respiratory', label: 'Respiratory: the bell-jar lung', teaches: ['B4.4'] },
    { value: 'muscular', label: 'Muscular: the forearm lever', teaches: ['B4.5'] },
    { value: 'nervous', label: 'Nervous: the ruler-drop test', teaches: ['B4.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'digestive',
    temp: 37, pH: 6.8, enzC: 1, starch: 1, boiled: false, enz: 'saliva', every: 30, lapseD: 10,
    drink: 1, kind: 'water', adh: 'normal', lapseK: 600,
    hr: 70, sv: 70, narrow: 0, slen: 1, hct: 45,
    model: 'jar', pull: 3, comp: 'normal', hole: false, rate: 12,
    mass: 5, angle: 90, ins: 4, mode: 'hold',
    cue: 'sight', distract: false, sleep: 8, practice: 1, trials: 10, ruler: 30, seed: 1
  };
  const SETUP_DEFAULTS = { digestive: {}, excretory: {}, circulatory: {}, respiratory: {}, muscular: {}, nervous: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const HOMES = {
    digestive: { theta: -1.0, phi: 0.42, dist: 0.95, target: [0.08, 0, 0.1] },
    excretory: { theta: -1.2, phi: 0.3, dist: 0.95, target: [-0.04, 0, 0.09] },
    circulatory: { theta: -1.1, phi: 0.45, dist: 0.85, target: [0.02, 0, 0.08] },
    respiratory: { theta: -1.25, phi: 0.18, dist: 0.7, target: [0.02, 0, 0.13] },
    muscular: { theta: -1.35, phi: 0.16, dist: 1.05, target: [0.04, 0, 0.3] },
    nervous: { theta: -1.3, phi: 0.14, dist: 0.85, target: [-0.04, 0, 0.24] }
  };

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (first ? p.setup !== BASE.setup : (!p.pre && S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    if (p.model && p.pull > RESP[p.model].maxPull) p.pull = RESP[p.model].maxPull;
    S.ts = 0; S.amy = null; S.kid = null; S.trials = null; S.spiro = []; S._lastRec = -1;
    if (p.setup === 'digestive') S.amy = amyRun(p);
    if (p.setup === 'excretory') S.kid = kidneyRun(p);
    if (p.setup === 'nervous') S.trials = trialsOf(p);
    if (!S.cam || S.camFor !== p.setup) { const h = HOMES[p.setup]; S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: 0.72 }); S.cam.minDist = 0.25; S.cam.maxDist = 3; S.camFor = p.setup; }
  }
  const TRIAL_T = 2.4;                    // s of display each ruler trial takes
  function step(S, dt) {
    const p = S.p;
    if (p.setup === 'digestive') S.ts = Math.min(T_END, S.ts + dt * p.lapseD);
    else if (p.setup === 'excretory') S.ts = Math.min(KID.minutes * 60, S.ts + dt * p.lapseK);
    else if (p.setup === 'respiratory') { S.ts += dt; const m = Math.floor(S.ts * 10); if (m !== S._lastRec) { S._lastRec = m; S.spiro.push([S.ts, boyle(p, pullAt(p, S.ts)).vb * 1000]); while (S.spiro.length > 400) S.spiro.shift(); } }
    else S.ts += dt;
  }

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const lcdCache = {};
  function lcd(title, value, unit, col) { const key = [title, value, unit].join('|'); if (!lcdCache[key]) { if (Object.keys(lcdCache).length > 60) Object.keys(lcdCache).forEach(k => delete lcdCache[k]); lcdCache[key] = BENCH.lcdTex(title, value, unit, col || '#7CF0C0'); } return lcdCache[key]; }
  function lay(g) {
    const W = g.w, H = g.h, narrow = W < 640;
    if (narrow) return { narrow, W, H, px: 10, py: 102, pw: W - 20, ph: H - 102 - 56, bw: 0 };
    const pw = Math.min(W * 0.46, 520);
    return { narrow, W, H, px: W - pw - 12, py: 84, pw, ph: H - 84 - 30, bw: W - pw - 26 };
  }
  function grip(ctx, x, y, ch) { ctx.save(); ctx.fillStyle = 'rgba(255,214,107,.92)'; ctx.strokeStyle = '#05080F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#05080F'; ctx.font = mono(11, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x, y); ctx.restore(); }
  /* the time within a ruler trial: which trial, and how far into it */
  function trialNow(S) { const n = S.trials.length, k = Math.floor(S.ts / TRIAL_T) % n, u = S.ts % TRIAL_T; return { k, u, tr: S.trials[k] }; }
  const SLOW = 4;                         // the drop is shown four times slower than real
  function dropState(S) { const { k, u, tr } = trialNow(S), tf = Math.max(0, (u - 0.6) / SLOW), reacted = tf >= tr.t; const fallT = Math.min(tf, tr.t); return { k, tr, released: u >= 0.6, fall: tr.caught ? 0.5 * g0 * fallT * fallT : 0.5 * g0 * tf * tf, closed: reacted, tf }; }

  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, G = GA(), bw = Ly.bw;
    if (!cam || bw < 200) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 14, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 });
    MEAS.bench(F, -0.42, 0.42, -0.26, 0.26, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.42, 0.42, 0.26, 0, 0.6);
    const lab = [];
    if (p.setup === 'digestive') {
      const A = S.amy, now = A.at(S.ts), wells = [];
      for (let k = 0; k < 12; k++) { const tk = (k + 1) * p.every; wells.push(tk <= S.ts ? iodineOf(A.at(tk)[1])[1] : null); }
      G.waterBath(F, [-0.08, 0.02], { T: p.temp, wells, tubeCol: '#F0EEE6', cloud: clamp(now[1] / 2, 0.05, 0.5) });
      lab.push([[-0.08, 0.0, 0.2], 'water bath at ' + p.temp + ' °C', -30, -30], [[-0.09, -0.01, 0.2], 'starch + ' + ENZ[p.enz].name + (p.boiled ? ' (boiled)' : ''), -40, 30], [[0.12, -0.06, 0.01], 'a drop every ' + p.every + ' s into iodine', 20, -40]);
    } else if (p.setup === 'excretory') {
      const K = S.kid, m = S.ts / 60, k = Math.floor(m / 30), cur = K.at(m), prev = K.at(k * 30);
      const samples = K.samples.slice(0, k).concat(k < 8 ? [{ vol: cur.urine - prev.urine, osm: cur.Uosm }] : []);
      G.urineBench(F, [0, 0], { samples: samples.map(s => ({ vol: s.vol, osm: s.osm, sg: sgOf(s.osm) })), jug: 1 - clamp(m / 20, 0, 1), saline: p.kind === 'saline' });
      lab.push([[-0.21, 0, 0.2], 'one cylinder for each half hour', -20, -30], [[0.2, 0.05, 0.08], p.kind === 'none' ? 'nothing drunk' : p.drink.toFixed(1) + ' L of ' + (p.kind === 'saline' ? '0.9 % saline' : 'water') + ', drunk at 0 min', 20, -30]);
      if (samples.length) lab.push([[-0.21 + (samples.length - 1) * 0.06, 0, 0.06], 'urinometer: ' + sgOf(cur.Uosm).toFixed(3), 30, 40]);
    } else if (p.setup === 'circulatory') {
      const beat = (S.ts * p.hr / 60) % 1, sq = beat < 0.35 ? Math.sin(beat / 0.35 * Math.PI) : 0, sec = S.ts % 60;
      const qo = branchFlow(p, 0), qc = branchFlow(p);
      G.circuitBench(F, [0, 0], { squeeze: sq, narrow: p.narrow / 100, volOpen: Math.min(245, qo * sec / 60), volClamp: Math.min(245, qc * sec / 60), lcd: lcd('PUMP', String(p.hr), 'bpm'), gauge: G.gaugeTex(meanP(p) + pulseP(p) * (sq - 0.5), 200) });
      lab.push([[-0.16, 0, 0.16], 'the pump: ' + p.sv + ' mL a beat', -30, -30], [[0.2, -0.05, 0.12], 'open artery: ' + qo.toFixed(0) + ' mL/min', 20, -26], [[0.2, 0.05, 0.12], 'narrowed ' + p.narrow + ' %: ' + qc.toFixed(0) + ' mL/min', 20, 30], [[0.08, 0.05, 0.15], 'screw clamp', -20, -36]);
    } else if (p.setup === 'respiratory') {
      const pl = pullAt(p, S.ts), B = boyle(p, pl);
      G.bellJar(F, [0, 0], { pull: pl, vb: B.vb / Math.max(0.05, boyle(Object.assign({}, p, { hole: false }), RESP[p.model].maxPull).vb || 0.05), hole: p.hole, dP: B.dP });
      lab.push([[0, 0, 0.16], 'balloons: the lungs', -40, -26], [[0, 0, 0.05], 'rubber sheet: the diaphragm', -40, 30], [[0.11, 0, 0.18], 'water manometer', 20, -30]);
      if (p.hole) lab.push([[0, -0.066, 0.17], 'a hole in the jar', 30, 20]);
      const q = cam.project([0, 0, 0.058 - pl * 0.01 - 0.025]); if (q.ok) { g.handle(q.x, q.y, 14, 'pull'); S._pullAx = q; }
    } else if (p.setup === 'muscular') {
      const A = armForces(p);
      const geo = G.armModel(F, [0, 0], { angle: p.angle, ins: p.ins / 100, mass: p.mode === 'hold' ? p.mass : 0, lcd: lcd('BICEPS', A.bic.toFixed(0), 'N') });
      lab.push([[0.02, 0, 0.55], 'spring balance as the biceps', 30, -30], [[geo.hand[0], 0, geo.hand[2]], p.mode === 'hold' ? p.mass + ' kg in the hand' : 'pushing down', 20, 30], [[0, 0, 0.32], 'elbow: the pivot', -30, 30]);
      const q = cam.project(geo.hand); if (q.ok) { g.handle(q.x, q.y, 14, 'hand'); S._elbow = cam.project([0, 0, 0.32]); }
    } else {
      const D = dropState(S);
      G.rulerDrop(F, [0, 0], { len: p.ruler / 100, fall: Math.min(D.fall, p.ruler / 100 + 0.1), closed: D.closed && D.tr.caught, released: D.released });
      lab.push([[0, 0, 0.08 + p.ruler / 100], 'ruler, zero at the fingers', 30, -20], [[-0.04, 0, 0.075], 'catch it when you ' + { sight: 'see it fall', sound: 'hear the clap', touch: 'feel the tap' }[p.cue], -30, 34]);
    }
    F.render();
    if (g.labels) G.benchLabels(ctx, cam, lab, bw, g.h);
    ctx.restore();
  }

  function drawPanel(S, g, Ly) {
    const p = S.p, ctx = g.ctx, G = GA(), { px, py, pw, ph } = Ly;
    if (p.setup === 'digestive') {
      const now = S.amy.at(S.ts);
      G.plate(ctx, px, py, pw, ph * 0.55, () => G.starchCut(ctx, px, py, pw, ph * 0.55, { left: now[1] / Math.max(0.01, p.starch), active: now[2] > 0.05 && !p.boiled, t: S.t || 0 }));
      G.caption(ctx, px, py - 4, pw, 'in the tube: starch chains being cut', Math.round(now[2] * 100) + ' % of the enzyme still active');
      // the dig system in a small plate, mouth to small intestine
      const bh = ph * 0.42;
      G.plate(ctx, px, py + ph * 0.58, pw, bh, () => { const A = G.body(ctx, px + pw * 0.22, py + ph * 0.58 + 6, bh * 1.7, { show: { dig: true, circ: false, resp: false, exc: false, nerv: false }, focus: 'dig' }); if (g.labels) G.sideLabels(ctx, [{ x: A.oesophagus[0], y: A.oesophagus[1], text: 'mouth: salivary amylase', side: 'R' }, { x: A.stomach[0], y: A.stomach[1], text: 'stomach: too acid for it', side: 'R' }, { x: A.pancreas[0], y: A.pancreas[1], text: 'pancreas: amylase again', side: 'R' }], { mid: 0, xL: px + 10, xR: px + pw * 0.42, top: py + ph * 0.58 + 10, bottom: py + ph - 6, maxW: pw * 0.55 }); });
    } else if (p.setup === 'excretory') {
      const cur = S.kid.at(S.ts / 60), A = { a: 0 };
      G.plate(ctx, px, py, pw, ph, () => { const N = G.nephron(ctx, px + 8, py + 8, pw - 16, ph - 16, { adh: clamp(cur.adh / 4, 0, 1), medulla: clamp(cur.adh / (cur.adh + 0.6), 0, 1) }); A.N = N;
        if (g.labels) G.sideLabels(ctx, [{ x: N.glom[0], y: N.glom[1], text: 'glomerulus: filters 125 mL/min', side: 'L' }, { x: N.pct[0], y: N.pct[1], text: 'takes back 2/3', side: 'R' }, { x: N.loop[0], y: N.loop[1], text: 'loop: salts the medulla', side: 'L' }, { x: N.duct[0], y: N.duct[1], text: 'ADH opens it', side: 'R' }, { x: N.urine[0], y: N.urine[1], text: 'urine ' + cur.V.toFixed(1) + ' mL/min', side: 'R' }], { mid: px + pw / 2, xL: px + pw * 0.3, xR: px + pw * 0.7, top: py + 12, bottom: py + ph - 10, maxW: pw * 0.3, size: 9.5 }); });
      G.caption(ctx, px, py - 4, pw, 'one of a million nephrons', 'ADH ' + cur.adh.toFixed(1) + ' pg/mL');
    } else if (p.setup === 'circulatory') {
      const beat = (S.ts * p.hr / 60) % 1, con = beat < 0.35 ? Math.sin(beat / 0.35 * Math.PI) : 0;
      G.plate(ctx, px, py, pw, ph * 0.5, () => { if (window.BIOART) BIOART.heart(ctx, px + pw * 0.5, py + ph * 0.25, Math.min(pw, ph * 0.5) * 0.4, { contraction: con, labels: false, leaders: false }); });
      G.caption(ctx, px, py - 4, pw, 'the heart: ' + p.hr + ' beats a minute', (cardiacOut(p)).toFixed(2) + ' L/min out');
      const ay = py + ph * 0.56, ah = ph * 0.44;
      G.plate(ctx, px, ay, pw, ah, () => { const A = G.artery(ctx, px, ay, pw, ah, { narrow: p.narrow / 100, flow: branchFlow(p) / CIRC.coronary, t: S.ts }); if (g.labels) G.sideLabels(ctx, [{ x: A.media[0], y: A.media[1], text: 'muscle wall', side: 'L' }, ...(p.narrow > 5 ? [{ x: A.plaque[0], y: A.plaque[1], text: 'fatty plaque: ' + p.narrow + ' % narrower', side: 'R' }] : [])], { mid: px + pw / 2, xL: px + pw * 0.3, xR: px + pw * 0.75, top: ay + 10, bottom: ay + ah - 8, maxW: pw * 0.3 }); });
      G.caption(ctx, px, ay - 4, pw, 'an artery to the heart muscle, cut along', branchFlow(p).toFixed(0) + ' mL/min');
    } else if (p.setup === 'respiratory') {
      const pl = pullAt(p, S.ts), B = boyle(Object.assign({}, p, { model: 'chest' }), Math.min(pl, RESP.chest.maxPull)), mx = boyle(Object.assign({}, p, { model: 'chest', hole: false }), RESP.chest.maxPull).vb || 1;
      G.plate(ctx, px, py, pw, ph, () => { const A = G.chest(ctx, px, py, pw, ph, { d: pl / RESP.chest.maxPull, inf: B.vb / mx, hole: p.hole }); if (g.labels) G.sideLabels(ctx, [{ x: A.diaphragm[0], y: A.diaphragm[1], text: 'diaphragm', side: 'R' }, { x: A.lungL[0], y: A.lungL[1], text: 'lung', side: 'L' }, { x: A.trachea[0], y: A.trachea[1], text: 'windpipe', side: 'R' }, { x: A.ribs[0], y: A.ribs[1], text: 'ribs', side: 'R' }], { mid: px + pw / 2, xL: px + 70, xR: px + pw - 70, top: py + 10, bottom: py + ph - 10, maxW: pw * 0.3 }); });
      G.caption(ctx, px, py - 4, pw, 'the same in a real chest', (B.vb * 1000).toFixed(0) + ' mL in · ' + (B.dP / 98.1).toFixed(1) + ' cmH₂O');
    } else if (p.setup === 'muscular') {
      const A = armForces(p);
      G.plate(ctx, px, py, pw, ph, () => { const P = G.armPlate(ctx, px, py, pw, ph, { angle: p.angle, ins: p.ins / 100, mass: p.mass, mode: p.mode, F: p.mode === 'hold' ? A.bic : A.tri, bic: A.bic / 1200, tri: A.tri / 1200, load: A.load }); if (g.labels) G.sideLabels(ctx, [{ x: P.biceps[0], y: P.biceps[1], text: 'biceps ' + A.bic.toFixed(0) + ' N', side: 'R' }, { x: P.triceps[0], y: P.triceps[1], text: 'triceps ' + A.tri.toFixed(0) + ' N', side: 'R' }, { x: P.elbow[0], y: P.elbow[1], text: 'elbow: the pivot', side: 'R' }, { x: P.ins[0], y: P.ins[1], text: 'biceps tendon ' + p.ins + ' cm from it', side: 'R' }], { mid: px + pw * 0.4, xL: px + 60, xR: px + pw * 0.56, top: py + 12, bottom: py + ph - 12, maxW: pw * 0.42 }); });
      G.caption(ctx, px, py - 4, pw, 'the arm: bones are levers, muscles pull', 'elbow at ' + p.angle + '°');
    } else {
      const D = dropState(S), st = CUE[p.cue].stages, sum = st.reduce((u, s) => u + s[1], 0), scale = D.tr.t / sum;
      G.plate(ctx, px, py, pw, ph, () => { const A = G.pathway(ctx, px, py, pw, ph, { stages: st.map(s => ({ name: s[0], t: s[1] * scale })), now: D.released ? D.tf : -1 }); if (g.labels) G.sideLabels(ctx, [{ x: A.eye[0], y: A.eye[1], text: p.cue === 'sight' ? 'eye' : p.cue === 'sound' ? 'ear' : 'skin', side: 'R' }, { x: A.vis[0], y: A.vis[1], text: 'senses', side: 'L' }, { x: A.mot[0], y: A.mot[1], text: 'movement', side: 'L' }, { x: A.cord[0], y: A.cord[1], text: 'spinal cord', side: 'L' }, { x: A.arm[0], y: A.arm[1], text: 'fingers', side: 'R' }], { mid: px + pw * 0.4, xL: px + pw * 0.2, xR: px + pw * 0.72, top: py + 12, bottom: py + ph - 46, maxW: pw * 0.2 }); });
      G.caption(ctx, px, py - 4, pw, 'the path of the signal', 'trial ' + (D.k + 1) + ': ' + Math.round(D.tr.t * 1000) + ' ms');
    }
  }

  function drawStage(S, g) {
    const p = S.p, K = kit(); if (!K || !GA() || g.w < 160 || g.h < 200) return;     // a stage still being laid out has no room for a plate
    const Ly = lay(g);
    if (!Ly.narrow) drawBench(S, g, Ly);
    drawPanel(S, g, Ly);
    cards(S, g, Ly);
    const Hd = headerOf(S); K.header(g, Hd[0], Hd[1], Hd[2]);
  }
  const fmtT = s => s < 60 ? s.toFixed(0) + ' s' : (s / 60).toFixed(s < 600 ? 1 : 0) + ' min';
  function cards(S, g, Ly) {
    const p = S.p, G = GA(), at = { x: 10, w: Ly.narrow ? 0 : Math.min(340, Ly.bw - 10) };
    if (p.setup === 'digestive') {
      const rows = []; for (let k = 0; k < 12; k += 2) { const ta = (k + 1) * p.every, tb = (k + 2) * p.every; rows.push([{ t: fmtT(ta), bold: true }, { t: ta <= S.ts ? iodineOf(S.amy.at(ta)[1])[2] : '—', col: ta <= S.ts ? G.mix(iodineOf(S.amy.at(ta)[1])[1], '#FFFFFF', 0.45) : '#5A6A84' }, { t: fmtT(tb), bold: true }, { t: tb <= S.ts ? iodineOf(S.amy.at(tb)[1])[2] : '—', col: tb <= S.ts ? G.mix(iodineOf(S.amy.at(tb)[1])[1], '#FFFFFF', 0.45) : '#5A6A84' }]); }
      G.rowsCard(g, S, 'The spotting tile', rows, at, { cols: [0, 0.16, 0.5, 0.66], chip: 'tile' });
    } else if (p.setup === 'excretory') {
      const K = S.kid, n = Math.min(8, Math.floor(S.ts / 1800));
      const rows = [[{ t: 'sample', bold: true }, { t: 'volume', bold: true }, { t: 'mOsm/kg', bold: true }, { t: 'SG', bold: true }]].concat(K.samples.slice(0, Math.max(1, n)).slice(-5).map((s, i) => [{ t: ((Math.max(1, n) > 5 ? Math.max(1, n) - 5 : 0) + i) * 30 + '–' + ((Math.max(1, n) > 5 ? Math.max(1, n) - 5 : 0) + i + 1) * 30, bold: true }, s.vol.toFixed(0) + ' mL', { t: s.osm.toFixed(0), col: G.urineCol(s.osm) }, sgOf(s.osm).toFixed(3)]));
      G.rowsCard(g, S, 'Urine, every half hour', rows, at, { cols: [0, 0.27, 0.52, 0.78], chip: 'urine' });
    } else if (p.setup === 'circulatory') {
      G.rowsCard(g, S, 'The pump and the pipes', [[{ t: 'output', bold: true }, p.hr + ' × ' + p.sv + ' mL = ' + cardiacOut(p).toFixed(2) + ' L/min'], [{ t: 'pressure', bold: true }, Math.round(meanP(p) + pulseP(p) / 2) + '/' + Math.round(meanP(p) - pulseP(p) / 2) + ' mmHg (mean ' + meanP(p).toFixed(0) + ')'], [{ t: 'narrowing', bold: true }, p.narrow + ' % of the width → ' + poiseuilleRatio(p).toFixed(poiseuilleRatio(p) < 10 ? 1 : 0) + '× the resistance'], [{ t: 'flow', bold: true }, { t: branchFlow(p).toFixed(0) + ' of ' + branchFlow(p, 0).toFixed(0) + ' mL/min (' + Math.round(branchFlow(p) / branchFlow(p, 0) * 100) + ' %)', col: branchFlow(p) / branchFlow(p, 0) < 0.6 ? '#FF8A80' : '#FFD66B' }]], at, { cols: [0, 0.24], chip: 'pump' });
    } else if (p.setup === 'respiratory') {
      const B = boyle(p, p.pull);
      G.rowsCard(g, S, 'Pull the sheet ' + p.pull + ' cm down', [[{ t: 'space made', bold: true }, (B.dV * 1000).toFixed(0) + ' mL'], [{ t: 'jar pressure', bold: true }, (B.dP).toFixed(0) + ' Pa (' + (B.dP / 98.1).toFixed(1) + ' cmH₂O)'], [{ t: 'into the lungs', bold: true }, { t: (B.vb * 1000).toFixed(0) + ' mL' + (p.hole ? ': none — air came in through the hole' : ''), col: p.hole ? '#FF8A80' : '#FFD66B' }], [{ t: 'a minute', bold: true }, (B.vb * p.rate).toFixed(2) + ' L at ' + p.rate + ' breaths']], at, { cols: [0, 0.3], chip: 'jar' });
    } else if (p.setup === 'muscular') {
      const A = armForces(p);
      G.rowsCard(g, S, p.mode === 'hold' ? 'Holding ' + p.mass + ' kg' : 'Pushing down with ' + (p.mass * g0).toFixed(0) + ' N', [[{ t: 'load', bold: true }, (A.load).toFixed(0) + ' N at ' + (ARM.L * 100) + ' cm from the elbow'], [{ t: 'biceps', bold: true }, { t: A.bic.toFixed(0) + ' N at ' + (A.mArm * 100).toFixed(1) + ' cm', col: '#FF8A80' }], [{ t: 'triceps', bold: true }, { t: A.tri.toFixed(0) + ' N' + (p.mode === 'push' ? ' — it does the pushing' : ' (resting)'), col: '#C89BFF' }], [{ t: 'ratio', bold: true }, (p.mode === 'hold' ? (A.bic / Math.max(1, A.load)).toFixed(1) : (A.tri / Math.max(1, A.load)).toFixed(1)) + '× the load: the hand moves that much further']], at, { cols: [0, 0.22], chip: 'lever' });
    } else {
      const T = S.trials, caught = T.filter(t => t.caught), rows = T.slice(0, 10).map((t, i) => [{ t: '#' + (i + 1), bold: true }, t.caught ? (t.d * 100).toFixed(1) + ' cm' : 'dropped', Math.round(t.t * 1000) + ' ms']);
      const half = Math.ceil(rows.length / 2), two = rows.slice(0, half).map((r, i) => r.concat(rows[half + i] || ['', '', '']));
      G.rowsCard(g, S, 'Catches (' + caught.length + ' of ' + T.length + ')', two, at, { cols: [0, 0.1, 0.32, 0.5, 0.6, 0.82], chip: 'trials' });
    }
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'digestive') { const A = S.amy, now = A.at(S.ts); return ['Amylase on starch at ' + p.temp + ' °C, pH ' + p.pH.toFixed(1) + ': ' + (isFinite(A.end) ? 'no starch left after ' + fmtT(A.end) : 'starch still there after 30 min'), fmtT(S.ts) + ' · starch ' + now[1].toFixed(2) + ' % · enzyme ' + Math.round(now[2] * 100) + ' % active' + (p.boiled ? ' · boiled first' : ''), p.temp > 50 ? 'too hot: the enzyme’s shape falls apart before it finishes' : p.temp < 15 ? 'cold: molecules meet slowly — the enzyme is not dead, just slow' : 'iodine stays orange-brown once the starch is all cut into sugar']; }
    if (p.setup === 'excretory') { const c = S.kid.at(S.ts / 60); return ['After ' + (p.kind === 'none' ? 'drinking nothing' : p.drink.toFixed(1) + ' L of ' + (p.kind === 'saline' ? 'saline' : 'water')) + ': urine ' + c.V.toFixed(1) + ' mL/min at ' + c.Uosm.toFixed(0) + ' mOsm/kg', (S.ts / 60).toFixed(0) + ' min · blood ' + c.Posm.toFixed(1) + ' mOsm/kg · ADH ' + c.adh.toFixed(1) + ' pg/mL · ' + c.urine.toFixed(0) + ' mL collected', p.adh === 'none' ? 'no ADH: the ducts stay shut to water — litres of dilute urine (diabetes insipidus)' : 'the kidneys filter 180 L a day and keep 99 %: ADH decides how much water to keep']; }
    if (p.setup === 'circulatory') return ['The heart pumps ' + cardiacOut(p).toFixed(2) + ' L/min; the narrowed artery carries ' + Math.round(branchFlow(p) / branchFlow(p, 0) * 100) + ' % of its flow', p.hr + ' beats × ' + p.sv + ' mL · ' + Math.round(meanP(p) + pulseP(p) / 2) + '/' + Math.round(meanP(p) - pulseP(p) / 2) + ' mmHg · blood ' + eta(p.hct / 100).toFixed(1) + ' mPa·s', p.narrow >= 70 ? 'past ~70 % narrower, r⁴ wins: the flow collapses' : 'flow ∝ r⁴: halving the width cuts a long pipe’s flow 16 times'];
    if (p.setup === 'respiratory') { const B = boyle(p, p.pull); return ['The ' + RESP[p.model].name + ': pull ' + p.pull + ' cm → ' + (B.vb * 1000).toFixed(0) + ' mL of air in', 'pressure in the jar ' + B.dP.toFixed(0) + ' Pa · ' + p.rate + ' breaths a minute · ' + p.comp + ' lungs', p.hole ? 'with a hole, air rushes into the jar instead: the lungs stay empty' : 'the lungs do not suck: the space round them grows, its pressure falls, outside air pushes in']; }
    if (p.setup === 'muscular') { const A = armForces(p); return [p.mode === 'hold' ? 'Holding ' + p.mass + ' kg, the biceps pulls ' + A.bic.toFixed(0) + ' N — ' + (A.bic / Math.max(1, A.load)).toFixed(1) + ' times the load' : 'Pushing down: the triceps pulls ' + A.tri.toFixed(0) + ' N', 'elbow at ' + p.angle + '° · biceps tendon ' + p.ins + ' cm from the pivot · load 35 cm out', 'a muscle can only pull; the other muscle of the pair pulls the bone back']; }
    const T = S.trials, c = T.filter(t => t.caught), md = c.reduce((u, t) => u + t.d, 0) / Math.max(1, c.length);
    return ['Ruler drop, ' + CUE[p.cue].name + ': mean catch ' + (md * 100).toFixed(1) + ' cm → ' + Math.round(tOfD(md) * 1000) + ' ms', c.length + ' of ' + T.length + ' caught on a ' + p.ruler + ' cm ruler' + (p.distract ? ' · texting at the same time' : '') + ' · ' + p.sleep + ' h sleep', 'd = ½gt²: the ruler is a clock — 5 cm is 0.10 s, 20 cm is 0.20 s'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'digestive') {
      const A = S.amy, Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'starch left' }, { c: '#8FD4FA', label: 'enzyme active', dash: [4, 3] }, { c: '#C9D4EA', label: 'samples', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 30, ymin: 0, ymax: Math.max(1.05, p.starch * 1.05), pad: { t: Kk.t }, xlabel: 'minutes', ylabel: 'starch, %', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { P.line(A.out.filter((_, i) => i % 6 === 0).map(q => [q[0] / 60, q[2] * Math.max(1, p.starch)]), '#8FD4FA', 1.3, [4, 3]); P.line(A.out.filter((q, i) => i % 4 === 0 && q[0] <= S.ts).map(q => [q[0] / 60, q[1]]), '#FFD66B', 2.5); P.line(A.out.filter((q, i) => i % 8 === 0 && q[0] > S.ts).map(q => [q[0] / 60, q[1]]), 'rgba(255,214,107,.3)', 1.2); for (let k = 1; k <= 12; k++) { const t = k * p.every; if (t <= S.ts) P.dot(t / 60, A.at(t)[1], 4, iodineOf(A.at(t)[1])[1], '#C9D4EA'); } P.hline(0.02, 'rgba(255,138,128,.5)', [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'excretory') {
      const K2 = S.kid, ghost = p.kind === 'water' ? kidneyRun(Object.assign({}, p, { kind: 'saline' })) : kidneyRun(Object.assign({}, p, { kind: 'water' })), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'urine flow' }, { c: 'rgba(201,212,234,.5)', label: p.kind === 'water' ? 'same volume of saline' : 'same volume of water', dash: [4, 3] }]);
      const top = Math.max(2, ...K2.out.map(q => q.V), ...ghost.out.map(q => q.V)) * 1.1;
      const P = g.Plot({ xmin: 0, xmax: 240, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'minutes after drinking', ylabel: 'urine, mL/min', xticks: [0, 30, 60, 90, 120, 150, 180, 210, 240], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(ghost.out.filter((_, i) => i % 4 === 0).map(q => [q.t, q.V]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(K2.out.filter((q, i) => i % 2 === 0 && q.t <= S.ts / 60).map(q => [q.t, q.V]), '#FFD66B', 2.5); const c = K2.at(S.ts / 60); P.dot(c.t, c.V, 5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'circulatory') {
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'pressure in the aorta' }, { c: 'rgba(201,212,234,.5)', label: 'mean', dash: [4, 3] }]);
      const per = 60 / p.hr, ts = []; for (let t = 0; t <= 3; t += 0.01) ts.push(t);
      const wave = t => { const u = (t % per) / per, sys = 0.35; return meanP(p) - pulseP(p) / 2 + pulseP(p) * (u < sys ? Math.sin(u / sys * Math.PI / 2) : Math.exp(-(u - sys) / 0.35) * (1 - 0.08 * Math.exp(-Math.pow((u - sys - 0.04) / 0.02, 2)))); };
      const P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 220, pad: { t: Kk.t }, xlabel: 's', ylabel: 'mmHg', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(ts.map(t => [t, wave(t)]), '#FF8A80', 2.4); P.hline(meanP(p), 'rgba(201,212,234,.5)', [4, 3]); P.hline(120, 'rgba(255,214,107,.25)', [2, 3]); P.hline(80, 'rgba(255,214,107,.25)', [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'respiratory') {
      const Kk = K.plotKey(g, [{ c: '#8FD4FA', label: 'air into the ' + (p.model === 'jar' ? 'balloons' : 'lungs') + ' (spirometer)' }]);
      const top = Math.max(50, boyle(Object.assign({}, p, { hole: false }), p.pull).vb * 1000 * 1.3), t1 = Math.max(10, S.ts);
      const P = g.Plot({ xmin: t1 - 10, xmax: t1, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 's', ylabel: 'mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(S.spiro.map(q => [q[0], q[1]]), '#8FD4FA', 2.4); });
      Kk.draw(P); return;
    }
    if (p.setup === 'muscular') {
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'biceps force, ' + p.mass + ' kg held' }, { c: '#8FB4FF', label: 'the load', dash: [4, 3] }]);
      const as = []; for (let a = 20; a <= 175; a += 2.5) as.push(a);
      const hold = Object.assign({}, p, { mode: 'hold' }), top = Math.max(200, ...as.map(a => armForces(Object.assign({}, hold, { angle: a })).bic)) * 1.1;
      const P = g.Plot({ xmin: 20, xmax: 175, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'elbow angle, °', ylabel: 'N', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(as.map(a => [a, armForces(Object.assign({}, hold, { angle: a })).bic]), '#FF8A80', 2.4); P.hline(p.mass * g0, '#8FB4FF', [4, 3]); P.dot(p.angle, armForces(hold).bic, 5.5, '#FF8A80', '#0B0F18'); });
      Kk.draw(P); return;
    }
    const T = S.trials, Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'd = ½gt²' }, { c: '#8FD4FA', label: 'your catches', dot: true }]);
    const ts = []; for (let t = 0; t <= 0.45; t += 0.005) ts.push(t);
    const P = g.Plot({ xmin: 0, xmax: 0.45, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'reaction time, s', ylabel: 'ruler fallen, cm', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { P.line(ts.map(t => [t, 50 * g0 * t * t]), '#FFD66B', 2.2); P.hline(p.ruler, 'rgba(255,138,128,.6)', [3, 3]); P.tag(0.01, p.ruler, 'end of the ruler', '#FF8A80', 'left', -8); T.forEach(t => P.dot(t.t, Math.min(99, t.d * 100), 4, t.caught ? '#8FD4FA' : '#FF8A80')); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'digestive') {
      if (!S._tcurve || S._tcurve.key !== JSON.stringify([p.pH, p.enzC, p.starch, p.enz, p.boiled])) { const pts = []; for (let T = 0; T <= 75; T += 2.5) { const A = amyRun(Object.assign({}, p, { temp: T })); pts.push([T, isFinite(A.end) ? 60 / A.end : 0]); } S._tcurve = { key: JSON.stringify([p.pH, p.enzC, p.starch, p.enz, p.boiled]), pts }; }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'speed = 1 ÷ time to clear the starch' }]);
      const top = Math.max(0.3, ...S._tcurve.pts.map(q => q[1])) * 1.15;
      const P = g.Plot({ xmin: 0, xmax: 75, ymin: 0, ymax: top, pad: { t: Kk.t }, xlabel: 'water bath, °C', ylabel: 'per minute', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => { P.line(S._tcurve.pts, '#FFD66B', 2.4); P.dot(p.temp, isFinite(S.amy.end) ? 60 / S.amy.end : 0, 5.5, '#FFD66B', '#0B0F18'); P.vline(37, 'rgba(255,138,128,.4)', [2, 3]); P.tag(37, top * 0.93, 'body 37 °C', '#FF8A80', 'left', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'excretory') {
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'urine flow ÷ ADH' }, { c: '#C89BFF', label: 'urine strength', dash: [4, 3] }]);
      const xs = []; for (let a = 0; a <= 8; a += 0.1) xs.push(a);
      const P = g.Plot({ xmin: 0, xmax: 8, ymin: 0, ymax: 13, pad: { t: Kk.t }, xlabel: 'ADH, pg/mL', ylabel: 'mL/min', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.line(xs.map(a => [a, KID.excr / (50 + 1150 * a / (a + 0.6)) * 1000]), '#FFD66B', 2.4); P.line(xs.map(a => [a, (50 + 1150 * a / (a + 0.6)) / 100]), '#C89BFF', 1.4, [4, 3]); const c = S.kid.at(S.ts / 60); P.dot(c.adh, c.V, 5.5, '#FFD66B', '#0B0F18'); P.tag(7.5, 12, '× 100 mOsm/kg', '#C89BFF', 'right', 0); });
      Kk.draw(P); return;
    }
    if (p.setup === 'circulatory') {
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'flow, % of normal' }, { c: 'rgba(201,212,234,.5)', label: 'haematocrit 60 %', dash: [4, 3] }]);
      const xs = []; for (let n = 0; n <= 95; n += 1) xs.push(n);
      const P = g.Plot({ xmin: 0, xmax: 95, ymin: 0, ymax: 110, pad: { t: Kk.t }, xlabel: 'artery narrowed by, %', ylabel: '% flow', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const q0 = branchFlow(p, 0), thick = Object.assign({}, p, { hct: 60 }); P.line(xs.map(n => [n, branchFlow(thick, n / 100) / q0 * 100]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(xs.map(n => [n, branchFlow(p, n / 100) / q0 * 100]), '#FFD66B', 2.4); P.dot(p.narrow, branchFlow(p) / q0 * 100, 5.5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'respiratory') {
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: p.comp + ' (yours)' }, { c: 'rgba(201,212,234,.5)', label: 'stiff · floppy', dash: [4, 3] }]);
      const m = RESP[p.model], xs = []; for (let d = 0; d <= m.maxPull; d += 0.1) xs.push(d);
      const top = boyle(Object.assign({}, p, { comp: 'floppy', hole: false }), m.maxPull).vb * 1000 * 1.1;
      const P = g.Plot({ xmin: 0, xmax: m.maxPull, ymin: 0, ymax: Math.max(10, top), pad: { t: Kk.t }, xlabel: 'sheet pulled down, cm', ylabel: 'air in, mL', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { ['stiff', 'floppy'].forEach(c => P.line(xs.map(d => [d, boyle(Object.assign({}, p, { comp: c }), d).vb * 1000]), 'rgba(201,212,234,.5)', 1.2, [4, 3])); P.line(xs.map(d => [d, boyle(p, d).vb * 1000]), '#FFD66B', 2.4); P.line(xs.map(d => [d, m.A * d]), 'rgba(143,212,250,.35)', 1, [2, 3]); P.dot(p.pull, boyle(p, p.pull).vb * 1000, 5.5, '#FFD66B', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'muscular') {
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'tendon ' + p.ins + ' cm (yours)' }, { c: 'rgba(201,212,234,.5)', label: '2 · 6 cm', dash: [4, 3] }]);
      const ms = []; for (let m = 0; m <= 20; m += 0.5) ms.push(m);
      const f = (ins, m) => armForces(Object.assign({}, p, { ins, mass: m, mode: 'hold' })).bic;
      const P = g.Plot({ xmin: 0, xmax: 20, ymin: 0, ymax: f(2, 20) * 1.05, pad: { t: Kk.t }, xlabel: 'load in the hand, kg', ylabel: 'biceps, N', xfmt: v => v.toFixed(0), yfmt: v => (v / 1000).toFixed(1) + 'k' }).frame();
      P.clip(() => { [2, 6].forEach(i => P.line(ms.map(m => [m, f(i, m)]), 'rgba(201,212,234,.5)', 1.2, [4, 3])); P.line(ms.map(m => [m, f(p.ins, m)]), '#FF8A80', 2.4); P.dot(p.mass, f(p.ins, p.mass), 5.5, '#FF8A80', '#0B0F18'); });
      Kk.draw(P); return;
    }
    const T = S.trials, Kk = K.plotKey(g, [{ c: '#8FD4FA', label: 'trials', box: true }, { c: '#FFD66B', label: 'mean', dash: [4, 3] }]);
    const bins = []; for (let b = 0.08; b < 0.5; b += 0.02) bins.push([b, T.filter(t => t.t >= b && t.t < b + 0.02).length]);
    const P = g.Plot({ xmin: 0.08, xmax: 0.5, ymin: 0, ymax: Math.max(3, ...bins.map(q => q[1])) + 1, pad: { t: Kk.t }, xlabel: 'reaction time, s', ylabel: 'trials', xfmt: v => v.toFixed(2), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { bins.forEach(q => P.bar(q[0] + 0.01, q[1], 0.009, 0, '#8FD4FA')); P.vline(T.reduce((u, t) => u + t.t, 0) / T.length, '#FFD66B', [4, 3]); P.vline(tOfD(p.ruler / 100), 'rgba(255,138,128,.6)', [2, 3]); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'digestive') { const A = S.amy, now = A.at(S.ts), e = ENZ[p.enz]; return [
      { label: 'Time to clear the starch', value: isFinite(A.end) ? fmtT(A.end) : '> 30 min', flag: 'accent', hint: 'iodine stays orange-brown' },
      { label: 'Starch left now', value: now[1].toFixed(2), unit: '%', hint: iodineOf(now[1])[2] },
      { label: 'Rate at the start', value: amyRate(p, p.starch, p.boiled ? 0 : 1).toFixed(3), unit: '% a minute', hint: 'Vmax·S/(Km+S)' },
      { label: 'Q10 factor', value: Math.pow(Q10, (p.temp - 37) / 10).toFixed(2), unit: '× 37 °C', hint: 'doubles every 10 °C' },
      { label: 'Enzyme half-life', value: fmtT(halfLife(e, p.temp)), hint: 'its shape unfolding in the heat' },
      { label: 'Enzyme active now', value: Math.round(now[2] * 100), unit: '%', flag: now[2] < 0.5 ? 'warn' : '' },
      { label: 'pH factor', value: Math.round(Math.exp(-Math.pow((p.pH - e.opt) / e.w, 2)) * 100), unit: '%', hint: 'best at ' + e.opt } ]; }
    if (p.setup === 'excretory') { const c = S.kid.at(S.ts / 60); return [
      { label: 'Filtered (GFR)', value: KID.GFR, unit: 'mL/min', hint: '180 L a day' },
      { label: 'Urine flow', value: c.V.toFixed(2), unit: 'mL/min', flag: 'accent', hint: (c.V / KID.GFR * 100).toFixed(1) + ' % of what is filtered' },
      { label: 'Urine strength', value: c.Uosm.toFixed(0), unit: 'mOsm/kg', hint: 'SG ' + sgOf(c.Uosm).toFixed(3) },
      { label: 'Blood strength', value: c.Posm.toFixed(1), unit: 'mOsm/kg', hint: 'set point 282–285' },
      { label: 'ADH', value: c.adh.toFixed(2), unit: 'pg/mL', hint: p.adh === 'normal' ? '0.4 per mOsm above 282' : p.adh === 'none' ? 'none made' : 'injected' },
      { label: 'Collected', value: c.urine.toFixed(0), unit: 'mL', hint: 'in ' + (S.ts / 60).toFixed(0) + ' min' } ]; }
    if (p.setup === 'circulatory') return [
      { label: 'Output = HR × SV', value: cardiacOut(p).toFixed(2), unit: 'L/min', flag: 'accent' },
      { label: 'Blood pressure', value: Math.round(meanP(p) + pulseP(p) / 2) + '/' + Math.round(meanP(p) - pulseP(p) / 2), unit: 'mmHg', hint: 'pulse = SV ÷ 1.5 mL/mmHg' },
      { label: 'Resistance of the narrowing', value: poiseuilleRatio(p).toFixed(poiseuilleRatio(p) < 10 ? 2 : 0), unit: '× normal', hint: '1 ÷ (1 − narrowing)⁴' },
      { label: 'Artery flow', value: branchFlow(p).toFixed(0), unit: 'mL/min', flag: branchFlow(p) / branchFlow(p, 0) < 0.6 ? 'crit' : 'ok', hint: Math.round(branchFlow(p) / branchFlow(p, 0) * 100) + ' % of open' },
      { label: 'Blood viscosity', value: eta(p.hct / 100).toFixed(2), unit: 'mPa·s', hint: 'haematocrit ' + p.hct + ' %' },
      { label: 'Blood round the body', value: (5 / cardiacOut(p) * 60).toFixed(0), unit: 's', hint: '5 L ÷ output' } ];
    if (p.setup === 'respiratory') { const B = boyle(p, p.pull); return [
      { label: 'Space made A × d', value: (B.dV * 1000).toFixed(0), unit: 'mL', hint: RESP[p.model].A + ' cm² × ' + p.pull + ' cm' },
      { label: 'Pressure in the jar', value: B.dP.toFixed(0), unit: 'Pa', flag: 'accent', hint: 'P₁V₁ = P₂V₂' },
      { label: 'Air into the lungs', value: (B.vb * 1000).toFixed(0), unit: 'mL', flag: p.hole ? 'crit' : 'ok' },
      { label: 'Breathing a minute', value: (B.vb * p.rate).toFixed(2), unit: 'L/min', hint: p.rate + ' breaths' },
      { label: 'Lung stiffness', value: (1 / (RESP[p.model].C * COMP[p.comp])).toFixed(2), unit: 'kPa per L' } ]; }
    if (p.setup === 'muscular') { const A = armForces(p); return [
      { label: 'Load', value: A.load.toFixed(0), unit: 'N', hint: p.mass + ' kg × 9.81' },
      { label: 'Biceps moment arm', value: (A.mArm * 100).toFixed(2), unit: 'cm', hint: 'tendon ' + p.ins + ' cm from the elbow' },
      { label: 'Biceps', value: A.bic.toFixed(0), unit: 'N', flag: 'accent', hint: (A.bic / Math.max(1, A.load)).toFixed(1) + ' × the load' },
      { label: 'Triceps', value: A.tri.toFixed(0), unit: 'N', hint: p.mode === 'push' ? '2.5 cm behind the elbow' : 'not needed' },
      { label: 'Speed gain', value: (ARM.L * 100 / p.ins).toFixed(1), unit: '×', hint: 'the hand moves this much faster' } ]; }
    const T = S.trials, c = T.filter(t => t.caught), md = c.reduce((u, t) => u + t.d, 0) / Math.max(1, c.length);
    return [
      { label: 'Mean catch distance', value: (md * 100).toFixed(1), unit: 'cm' },
      { label: 'Reaction time √(2d/g)', value: Math.round(tOfD(md) * 1000), unit: 'ms', flag: 'accent' },
      { label: 'Fastest · slowest', value: Math.round(Math.min(...T.map(t => t.t)) * 1000) + ' · ' + Math.round(Math.max(...T.map(t => t.t)) * 1000), unit: 'ms' },
      { label: 'Dropped', value: String(T.length - c.length), unit: 'of ' + T.length, flag: T.length - c.length ? 'warn' : '', hint: 'slower than ' + Math.round(tOfD(p.ruler / 100) * 1000) + ' ms' },
      { label: 'Person’s true mean', value: Math.round(meanRT(p) * 1000), unit: 'ms', hint: 'what many trials would find' } ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'digestive') return E.v('rate') + ' ' + E.op('=') + ' ' + E.v('V') + ' × 2<sup>(' + E.v('T') + '−37)/10</sup> × ' + E.frac(E.v('S'), E.v('K') + E.sub('m') + ' + ' + E.v('S')) + ' × ' + E.v('a') + '(' + E.v('t') + ') ' + E.op('=') + ' 0.3 × ' + Math.pow(Q10, (p.temp - 37) / 10).toFixed(2) + ' × ' + E.frac(p.starch.toFixed(1), (AMY_KM + p.starch).toFixed(1)) + ' × ' + p.enzC.toFixed(1) + ' ' + E.op('=') + ' ' + E.n(amyRate(p, p.starch, p.boiled ? 0 : 1).toFixed(3), '% /min');
    if (p.setup === 'excretory') { const c = S.kid.at(S.ts / 60); return E.v('V') + E.sub('urine') + ' ' + E.op('=') + ' ' + E.frac('solute to excrete', E.v('U') + E.sub('osm')) + ' ' + E.op('=') + ' ' + E.frac(E.n('0.6', 'mOsm/min'), E.n(c.Uosm.toFixed(0), 'mOsm/kg')) + ' ' + E.op('=') + ' ' + E.n(c.V.toFixed(2), 'mL/min') + ',   ' + E.v('U') + E.sub('osm') + ' ' + E.op('=') + ' 50 + 1150 × ' + E.frac('ADH', 'ADH + 0.6'); }
    if (p.setup === 'circulatory') return E.v('Q') + ' ' + E.op('=') + ' ' + E.frac('Δ' + E.v('P'), E.v('R')) + ',  ' + E.v('R') + ' ' + E.op('=') + ' ' + E.frac('8' + E.v('ηL'), 'π' + E.v('r') + '⁴') + ' ' + E.op('→') + ' ' + E.v('R') + E.sub('narrowed') + ' ' + E.op('=') + ' ' + E.frac(E.v('R') + E.sub('0'), '(1 − ' + (p.narrow / 100).toFixed(2) + ')⁴') + ' ' + E.op('=') + ' ' + E.n(poiseuilleRatio(p).toFixed(1), '×') + ' ' + E.op('→') + ' ' + E.n(branchFlow(p).toFixed(0), 'mL/min');
    if (p.setup === 'respiratory') { const B = boyle(p, p.pull); return E.v('P') + E.sub('1') + E.v('V') + E.sub('1') + ' ' + E.op('=') + ' ' + E.v('P') + E.sub('2') + E.v('V') + E.sub('2') + ':  101 325 Pa × ' + RESP[p.model].V0 + ' L ' + E.op('=') + ' ' + E.n((101325 + B.dP).toFixed(0), 'Pa') + ' × ' + E.n((RESP[p.model].V0 + B.dV - B.vb).toFixed(3), 'L') + ',  lungs fill until ' + E.v('V') + ' ' + E.op('=') + ' ' + E.v('C') + 'Δ' + E.v('P') + ' ' + E.op('=') + ' ' + E.n((B.vb * 1000).toFixed(0), 'mL'); }
    if (p.setup === 'muscular') { const A = armForces(p); return E.v('F') + E.sub('biceps') + ' × ' + E.v('d') + ' ' + E.op('=') + ' ' + E.v('W') + ' × ' + E.v('L') + ' + forearm  →  ' + E.v('F') + ' ' + E.op('=') + ' ' + E.frac(E.n(A.tLoad.toFixed(1), 'N·m'), E.n((A.mArm * 100).toFixed(2), 'cm')) + ' ' + E.op('=') + ' ' + E.n(A.bic.toFixed(0), 'N'); }
    const T = S.trials, c = T.filter(t => t.caught), md = c.reduce((u, t) => u + t.d, 0) / Math.max(1, c.length);
    return E.v('d') + ' ' + E.op('=') + ' ½' + E.v('gt') + '²  →  ' + E.v('t') + ' ' + E.op('=') + ' √(' + E.frac('2' + E.v('d'), E.v('g')) + ') ' + E.op('=') + ' √(' + E.frac('2 × ' + md.toFixed(3) + ' m', '9.81 m/s²') + ') ' + E.op('=') + ' ' + E.n(Math.round(tOfD(md) * 1000), 'ms');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'digestive') return 'Two things happen at once as the bath warms: molecules collide faster (the rate doubles every 10 °C) and the enzyme’s folded shape starts to fall apart (faster every degree past ~45 °C). The “optimum” is where the two cross — for a 10-minute test it sits near body temperature. Cold slows the enzyme; heat destroys it.';
    if (p.setup === 'excretory') return 'The kidneys filter 180 L of plasma a day and take back all but about 1.5 L. What they keep is set by ADH: low blood strength (after drinking water) means little ADH, and the collecting ducts stay closed to water. Saline adds salt with the water, so the blood’s strength hardly changes — and little urine follows.';
    if (p.setup === 'circulatory') return 'Resistance grows as 1/r⁴, but the narrowing is a short piece of a long branch: its share of the resistance only matters once it is 70 % or more narrower. In exercise the heart muscle’s own small vessels open wide, so the same plaque takes a bigger share — which is why chest pain from a narrowed artery comes on with effort (a stress test). Thicker blood (more red cells) raises every resistance — the heart must push harder for the same flow.';
    if (p.setup === 'respiratory') return 'The lungs have no muscle of their own. The diaphragm pulls down, the space round the lungs grows, its pressure drops a few hundred pascals below the air outside, and the outside air pushes the lungs open. Make a hole in the jar and the air enters the jar instead.';
    if (p.setup === 'muscular') return 'The biceps is attached only 4 cm from the elbow, so it must pull about 9 times the weight in the hand — but the hand moves 9 times as far and as fast. Muscles can only pull; to push down, the triceps on the back of the arm pulls on the elbow’s other side.';
    return 'The ruler is a clock: it falls d = ½gt², so the distance it drops before you pinch it is your reaction time. Most of that time is spent deciding in the brain, not in the nerves — which is why texting, sleep and practice change it.';
  };

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function onDrag(S, e) {
    const p = S.p;
    if (e.id === 'pull') { p.pull = Math.round(clamp(p.pull + e.dy * RESP[p.model].maxPull / 200, 0, RESP[p.model].maxPull) * 10) / 10; return; }   // 200 px spans the sheet's whole travel
    if (e.id === 'hand' && S._elbow) { const a = Math.atan2(e.x - S._elbow.x, e.y - S._elbow.y); p.angle = Math.round(clamp(180 - Math.abs(a) * 180 / Math.PI, 20, 175)); }        // the hand's direction from the elbow sets the angle
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6b-systems-bench',
    grade: 6, unit: '6B', topics: ['B4'],
    subject: 'biology',
    name: 'The Body Systems Bench',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-3', 'NGSS MS-LS1-8', 'CAST'],
    weight: 'Bodies',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag the bench to look round it · drag the rubber sheet’s knob or the model hand · on a phone, tap a chip to open its card',
    lede: 'Six systems, six classic experiments on one bench. Time <b>amylase</b> cutting starch in a water bath and find its optimum. Drink a litre and collect your <b>urine</b> every half hour. Pump blood through a <b>narrowed artery</b> and watch r⁴ at work. ' +
      'Pull the sheet of the <b>bell-jar lung</b> — then puncture it. Hang a load on the <b>forearm lever</b>. Drop a ruler between your fingers and turn the catch into a <b>reaction time</b>.',

    params: preset({}),
    presets: [
      { name: 'Amylase at body temperature', params: preset({ setup: 'digestive', temp: 37 }) },
      { name: 'In ice water: slow, not dead', params: preset({ setup: 'digestive', temp: 5 }) },
      { name: 'At 60 °C: denatured', params: preset({ setup: 'digestive', temp: 60 }) },
      { name: 'In stomach acid, pH 2', params: preset({ setup: 'digestive', pH: 2 }) },
      { name: 'Drink a litre of water', params: preset({ setup: 'excretory', kind: 'water', drink: 1 }) },
      { name: 'Drink a litre of saline', params: preset({ setup: 'excretory', kind: 'saline', drink: 1 }) },
      { name: 'No ADH: diabetes insipidus', params: preset({ setup: 'excretory', kind: 'none', adh: 'none' }) },
      { name: 'A healthy artery at rest', params: preset({ setup: 'circulatory', narrow: 0 }) },
      { name: 'A 75 % narrowing', params: preset({ setup: 'circulatory', narrow: 75 }) },
      { name: 'Exercise with a 70 % narrowing: angina', params: preset({ setup: 'circulatory', hr: 150, sv: 100, narrow: 70 }) },
      { name: 'Pull the sheet 3 cm', params: preset({ setup: 'respiratory', model: 'jar', pull: 3 }) },
      { name: 'A hole in the jar', params: preset({ setup: 'respiratory', model: 'jar', pull: 3, hole: true }) },
      { name: 'A real chest, quiet breathing', params: preset({ setup: 'respiratory', model: 'chest', pull: 1.5 }) },
      { name: 'Stiff lungs (fibrosis)', params: preset({ setup: 'respiratory', model: 'chest', pull: 1.5, comp: 'stiff' }) },
      { name: 'Hold 5 kg, elbow at 90°', params: preset({ setup: 'muscular', mass: 5, angle: 90 }) },
      { name: 'Arm almost straight', params: preset({ setup: 'muscular', mass: 5, angle: 160 }) },
      { name: 'Push down: the triceps works', params: preset({ setup: 'muscular', mode: 'push', mass: 5 }) },
      { name: 'Ruler drop, watching', params: preset({ setup: 'nervous', cue: 'sight' }) },
      { name: 'Texting at the same time', params: preset({ setup: 'nervous', cue: 'sight', distract: true }) },
      { name: 'On 4 hours of sleep', params: preset({ setup: 'nervous', sleep: 4 }) }
    ],

    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'System', restructure: true, rebuild: true, options: SETUPS }] },
      { group: 'The water bath', when: is('digestive'), items: [
        { key: 'temp', label: 'Water bath', min: 0, max: 80, step: 1, unit: '°C', restructure: R_ },
        { key: 'pH', label: 'Buffer', min: 2, max: 10, step: 0.1, unit: 'pH', restructure: R_, fmt: v => v.toFixed(1) },
        { key: 'enzC', label: 'Amylase', min: 0.1, max: 2, step: 0.05, unit: '%', restructure: R_, fmt: v => v.toFixed(2) },
        { key: 'starch', label: 'Starch', min: 0.2, max: 2, step: 0.1, unit: '%', restructure: R_, fmt: v => v.toFixed(1) },
        { key: 'enz', type: 'select', label: 'Enzyme', restructure: R_, options: [{ value: 'saliva', label: 'saliva' }, { value: 'pancreas', label: 'pancreatic juice' }] },
        { key: 'boiled', type: 'toggle', label: 'Boil the enzyme first', restructure: R_ },
        { key: 'every', type: 'select', label: 'Sample every', restructure: false, options: [{ value: 15, label: '15 s' }, { value: 30, label: '30 s' }, { value: 60, label: '60 s' }, { value: 120, label: '2 min' }] },
        { key: 'lapseD', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 1, label: 'real time' }, { value: 10, label: '×10' }, { value: 30, label: '×30' }] }] },
      { group: 'The drink', when: is('excretory'), items: [
        { key: 'kind', type: 'select', label: 'Drink', restructure: R_, options: [{ value: 'water', label: 'water' }, { value: 'saline', label: '0.9 % saline' }, { value: 'none', label: 'nothing' }] },
        { key: 'drink', label: 'Volume', min: 0.2, max: 2, step: 0.1, unit: 'L', restructure: R_, when: S => S.p.kind !== 'none', fmt: v => v.toFixed(1) },
        { key: 'adh', type: 'select', label: 'ADH', restructure: R_, options: [{ value: 'normal', label: 'made as needed' }, { value: 'none', label: 'none made' }, { value: 'max', label: 'injected (desmopressin)' }] },
        { key: 'lapseK', type: 'select', label: 'Time-lapse', restructure: false, options: [{ value: 300, label: '5 min a second' }, { value: 600, label: '10 min a second' }, { value: 1200, label: '20 min a second' }] }] },
      { group: 'The pump and the artery', when: is('circulatory'), items: [
        { key: 'hr', label: 'Heart rate', min: 40, max: 200, step: 1, unit: 'beats/min' },
        { key: 'sv', label: 'Stroke volume', min: 30, max: 130, step: 1, unit: 'mL' },
        { key: 'narrow', label: 'Artery narrowed by', min: 0, max: 95, step: 1, unit: '%' },
        { key: 'slen', label: 'Length of the narrowing', min: 0.5, max: 5, step: 0.1, unit: 'cm', fmt: v => v.toFixed(1) },
        { key: 'hct', label: 'Red cells (haematocrit)', min: 20, max: 70, step: 1, unit: '%' }] },
      { group: 'The lung model', when: is('respiratory'), items: [
        { key: 'model', type: 'select', label: 'Model', restructure: R_, options: [{ value: 'jar', label: 'bell jar' }, { value: 'chest', label: 'real chest' }] },
        { key: 'pull', label: 'Sheet (diaphragm) pulled down', min: 0, max: 6, step: 0.1, unit: 'cm', fmt: v => v.toFixed(1) },
        { key: 'comp', type: 'select', label: 'Lungs', options: [{ value: 'stiff', label: 'stiff' }, { value: 'normal', label: 'normal' }, { value: 'floppy', label: 'floppy' }] },
        { key: 'hole', type: 'toggle', label: 'Puncture the jar (pneumothorax)' },
        { key: 'rate', label: 'Breaths a minute', min: 6, max: 40, step: 1 }] },
      { group: 'The arm', when: is('muscular'), items: [
        { key: 'mode', type: 'select', label: 'Doing', options: [{ value: 'hold', label: 'holding a load' }, { value: 'push', label: 'pushing down' }] },
        { key: 'mass', label: 'Load', min: 0, max: 20, step: 0.5, unit: 'kg', fmt: v => v.toFixed(1) },
        { key: 'angle', label: 'Elbow angle', min: 20, max: 175, step: 1, unit: '°' },
        { key: 'ins', label: 'Biceps tendon from the elbow', min: 2, max: 8, step: 0.1, unit: 'cm', fmt: v => v.toFixed(1) }] },
      { group: 'The test', when: is('nervous'), items: [
        { key: 'cue', type: 'select', label: 'Catch it on', restructure: R_, options: [{ value: 'sight', label: 'sight' }, { value: 'sound', label: 'a clap' }, { value: 'touch', label: 'a tap' }] },
        { key: 'distract', type: 'toggle', label: 'Texting at the same time', restructure: R_ },
        { key: 'sleep', label: 'Sleep last night', min: 3, max: 9, step: 0.5, unit: 'h', restructure: R_ },
        { key: 'practice', label: 'Practice sessions', min: 1, max: 5, step: 1, restructure: R_ },
        { key: 'trials', label: 'Trials', min: 5, max: 20, step: 1, restructure: R_ },
        { key: 'ruler', type: 'select', label: 'Ruler', restructure: R_, options: [{ value: 30, label: '30 cm' }, { value: 50, label: '50 cm' }] },
        { key: 'seed', label: 'Another person', min: 1, max: 9, step: 1, restructure: R_ }] }
    ],

    setup, step, drawStage, onPointer, onDrag,
    plots: [
      { title: S => ({ digestive: 'Starch left in the tube', excretory: 'Urine flow, minute by minute', circulatory: 'Pressure in the aorta, beat by beat', respiratory: 'The spirometer', muscular: 'Biceps force against elbow angle', nervous: 'The ruler as a clock' })[S.p.setup], draw: plot1 },
      { title: S => ({ digestive: 'Speed against temperature: the optimum', excretory: 'What ADH does to the urine', circulatory: 'Flow against narrowing', respiratory: 'Air in against the pull', muscular: 'Biceps force against load', nervous: 'Reaction times of the trials' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'digestive', temp: 27 }),
        q: 'At 37 °C the amylase cleared 1 % starch in 9.4 minutes. With Q10 = 2, how fast is the starting rate at 27 °C compared with 37 °C?',
        predict: { label: 'Rate at 27 °C ÷ rate at 37 °C', unit: '', tol: 0.02 },
        measure: S => amyRate(S.p, S.p.starch, 1) / amyRate(Object.assign({}, S.p, { temp: 37 }), S.p.starch, 1),
        working: '10 °C cooler with Q10 = 2: the rate halves, <b>0.5</b>. The enzyme is not damaged — warm it back and it speeds up again.' },
      { source: 'CAST pattern · systems and system models', params: preset({ setup: 'excretory', kind: 'water', drink: 1 }),
        q: 'The kidneys filter 125 mL of plasma a minute. How many litres is that in a day?',
        predict: { label: 'Filtered a day', unit: 'L', tol: 0.02 },
        measure: () => KID.GFR * 1440 / 1000,
        working: '125 mL × 1440 min = <b>180 L</b> a day — about four times the water in the body. All but ~1.5 L is taken back.' },
      { source: 'CAST pattern · cause and effect', params: preset({ setup: 'circulatory', narrow: 50 }),
        q: 'Resistance to flow in a pipe goes as 1/r⁴. A plaque halves an artery’s width. By what factor does the narrowed piece’s resistance rise?',
        predict: { label: 'Resistance factor', unit: '×', tol: 0.01 },
        measure: S => poiseuilleRatio(S.p),
        working: '(1 ÷ 0.5)⁴ = <b>16</b>. The flow to the heart muscle falls only 3 % here, because the narrowing is short — at 80 % it falls by half.' },
      { source: 'CAST pattern · developing a model', params: preset({ setup: 'respiratory', model: 'jar', pull: 3, hole: false }),
        q: 'The jar holds 2.0 L of air outside the balloons. Pulling the sheet adds 0.34 L of space. If the balloons did not fill at all, what would the pressure become (Boyle, from 101 325 Pa)?',
        predict: { label: 'Pressure', unit: 'Pa', tol: 0.002 },
        measure: S => 101325 * RESP.jar.V0 / (RESP.jar.V0 + RESP.jar.A * S.p.pull / 1000),
        working: 'P = 101 325 × 2.0 ÷ 2.339 ≈ <b>86,640 Pa</b> — 15 kPa below the air outside, so air pushes into the balloons until the difference is only what their rubber can hold back.' },
      { source: 'CAST pattern · structure and function', params: preset({ setup: 'muscular', mass: 5, angle: 90, ins: 4, mode: 'hold' }),
        q: 'A 5 kg mass is held 35 cm from the elbow; the forearm (1.5 kg) acts 15 cm out; the biceps pulls 4 cm from the elbow, almost straight up. What force does it pull with?',
        predict: { label: 'Biceps', unit: 'N', tol: 0.03 },
        measure: S => armForces(S.p).bic,
        working: '(49.05 × 0.35 + 14.7 × 0.15) ÷ ~0.0397 m ≈ <b>488 N</b> — the weight of a 50 kg person, to hold 5 kg.' },
      { source: 'CAST pattern · using mathematics', params: preset({ setup: 'nervous', cue: 'sight', seed: 1 }),
        q: 'A ruler falls 19.6 cm before it is caught. Using d = ½gt², what is the reaction time?',
        predict: { label: 'Reaction time', unit: 's', tol: 0.01 },
        measure: () => tOfD(0.196),
        working: 't = √(2 × 0.196 ÷ 9.81) = <b>0.200 s</b>. A 30 cm ruler times anything up to 0.247 s; slower, and it falls through.' }
    ],

    walkthrough: [
      { title: 'Where is the optimum?', ask: 'Raise the bath from 37 to 60 °C. Molecules move faster when hot — will the starch go faster?', reveal: '<b>No: it never clears.</b> The rate starts faster, but the enzyme’s shape unfolds within seconds at 60 °C (half-life about 20 s). Plot 2 shows the trade: speeding up, then destroyed.', params: preset({ setup: 'digestive', temp: 60 }) },
      { title: 'Cold is not dead', ask: 'At 5 °C nothing seems to happen. Is the enzyme destroyed?', reveal: '<b>No — just slow.</b> Q10 = 2: 32 °C colder is about 9 times slower. Warm it up and it works. Heat is different: it cannot be undone.', params: preset({ setup: 'digestive', temp: 5 }) },
      { title: 'Water or saline?', ask: 'Drink a litre of water, then a litre of saline. Which makes more urine?', reveal: '<b>Water, about four times more.</b> Water dilutes the blood, ADH falls and the ducts close to water. Saline brings its own salt, the blood’s strength barely moves, and the body keeps it.', params: preset({ setup: 'excretory', kind: 'saline' }) },
      { title: 'r to the fourth', ask: 'Narrow the artery 50 %, then 80 %. Does the flow fall in step?', reveal: '<b>Hardly at 50 %, by half at 80 %.</b> The narrow piece’s resistance is 16 times, then 625 times, normal — but it is only a small part of the branch until it dominates.', params: preset({ setup: 'circulatory', narrow: 80 }) },
      { title: 'Who does the sucking?', ask: 'Puncture the jar and pull the sheet. Do the balloons still fill?', reveal: '<b>No.</b> Air comes in through the hole and the jar’s pressure never drops. The lungs never sucked: the pressure difference across them did the work.', params: preset({ setup: 'respiratory', hole: true, pull: 3 }) },
      { title: 'Muscles only pull', ask: 'Push down on a scale with your hand. Which muscle is working?', reveal: '<b>The triceps</b>, on the back of the arm. The biceps cannot push; it relaxes while the triceps pulls the elbow straight. Every joint has a pair.', params: preset({ setup: 'muscular', mode: 'push', mass: 5 }) },
      { title: 'The ruler as a clock', ask: 'Text while you catch. How far does the ruler fall?', reveal: '<b>Further — often off the end.</b> Most of a reaction is decision time in the brain; split attention adds ~80 ms, which is 9 cm more ruler.', params: preset({ setup: 'nervous', distract: true }) }
    ],

    quiz: [
      { q: 'Amylase in a 60 °C water bath stops working because', options: ['its shape is changed by the heat', 'the starch is used up', 'the molecules move too slowly', 'iodine destroys it'], answer: 0, why: 'Heat unfolds the enzyme’s active site. Watch “enzyme active” fall within seconds at 60 °C.' },
      { q: 'After drinking a lot of water, urine becomes pale and plentiful because', options: ['less ADH is released, so the kidneys keep less water', 'the kidneys filter less', 'more ADH is released', 'water skips the kidneys'], answer: 0, why: 'Dilute blood switches ADH off; without it the collecting ducts stay shut to water.' },
      { q: 'Air enters the lungs because', options: ['the chest’s pressure drops below the air outside', 'the lungs suck it in', 'the diaphragm pushes air in', 'the windpipe pumps it'], answer: 0, why: 'Boyle’s law: more space, lower pressure. Puncture the jar and nothing fills.' },
      { q: 'To hold a 5 kg mass with the elbow at 90°, the biceps pulls about', options: ['490 N', '49 N', '5 N', '4900 N'], answer: 0, why: 'Its tendon is ~4 cm from the elbow against the load’s 35 cm: about 9 times the weight, plus the forearm.' },
      { q: 'A ruler falls 5 cm before being caught. The reaction time is about', options: ['0.10 s', '0.05 s', '0.50 s', '1 s'], answer: 0, why: 't = √(2 × 0.05 ÷ 9.81) ≈ 0.10 s.' }
    ],

    notes: '<p><b>Digestive.</b> Enzymes speed up the breakdown of food: amylase (saliva, pancreas) cuts starch into sugar. It works fastest near body temperature and a near-neutral pH; cold slows it, heat and strong acid change its shape for good.</p>' +
      '<p><b>Excretory.</b> The kidneys filter the blood (180 L a day), take back what the body needs and leave waste and extra water as urine. ADH from the brain controls how much water is kept.</p>' +
      '<p><b>Circulatory.</b> The heart pumps about 5 L a minute (rate × stroke volume). Flow through a vessel depends hugely on its width (r⁴), which is why a narrowed artery can starve the heart muscle.</p>' +
      '<p><b>Respiratory.</b> The diaphragm and rib muscles make the chest bigger; its pressure falls, and outside air pushes into the lungs.</p>' +
      '<p><b>Muscular.</b> Muscles pull on bones across joints, which act as levers. Muscles only pull, so they work in pairs (biceps and triceps).</p>' +
      '<p><b>Nervous.</b> Senses detect, nerves carry the signal to the brain, the brain decides and sends a signal back to the muscles. Reaction time can be measured with a falling ruler.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Muscles push”, “the lungs suck air in”, and “the biceps only has to pull as hard as the load weighs”. Muscles only pull; the lungs are pushed open by the outside air; and the biceps pulls about nine times the load because it is fixed so close to the elbow.</div>'
  });

  L.models = L.models || {};
  L.models['g6b-systems-bench'] = { ENZ, amyRun, amyRate, halfLife, iodineOf, kidneyRun, sgOf, KID, cardiacOut, meanP, pulseP, branchFlow, poiseuilleRatio, eta, boyle, RESP, COMP, armForces, ARM, meanRT, trialsOf, tOfD, CUE, BASE: () => preset({}) };
})(window.InsightLab);
