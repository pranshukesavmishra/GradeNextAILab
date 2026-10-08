/* ============================================================
   GRADE 6 · UNIT B · CELLS, BODIES AND SENSES
   6B-6  Stimulus, Signal, Response, Memory
   (B6.1 Sensory receptors and stimuli; B6.2 The path of a signal to the brain;
    B6.3 Processing information; B6.4 Voluntary and reflex responses;
    B6.5 Memory and stored information; B6.6 Stimulus to response to memory)

   Six benches, each a classic experiment of the senses and the nervous system:
     receptors — the two-point caliper on fingertip, lip, palm, forearm and back
                 (Weinstein 1968), receptive fields from receptor spacing, and
                 Weber's law for weights in the hand (a JND of ~5 % of the load).
     pathway   — a nerve conduction study: touch, sharp pain and dull pain race to
                 the brain at their real speeds (Aβ, Aδ, C fibres), cooled limbs
                 and damaged myelin slow them — the "first and second pain".
     processing— a choice-reaction board: Hick's law, RT = a + b·log₂(n + 1),
                 compatible mappings and practice.
     reflex    — the knee jerk and the withdrawal reflex against a voluntary kick;
                 the arc goes through the spinal cord, not the brain (cut the cord).
     memory    — a word list: the serial-position curve (primacy, recency, and a
                 delay that wipes recency), the DRM false memory, and Ebbinghaus's
                 forgetting curve with spaced reviews.
     together  — a ball thrown at you: every stage's time against its flight; can
                 you catch it, and what does practice buy?
   Registration and every model load without a page; only drawing uses G6B, R3.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, GA = () => window.G6B;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2); const pr = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - pr : pr; };
  const gauss = r => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(0.5); };

  /* ============================================================
     B6.1 · RECEPTORS
     ============================================================ */
  /* two-point thresholds, mm (Weinstein 1968, men, rounded); receptive fields are about threshold ÷ 1.6 apart */
  const SITES = {
    finger: { name: 'index fingertip', T: 2.5, ridges: true, part: 'hand', at: [0.18, 0.0, 0.035] },
    lip: { name: 'upper lip', T: 5.5, ridges: false, part: 'face', at: [0.087, 0.0, 0.205] },
    palm: { name: 'palm', T: 10, ridges: true, part: 'hand', at: [0.07, 0.0, 0.046] },
    forearm: { name: 'forearm', T: 38, ridges: false, part: 'hand', at: [-0.12, 0.0, 0.074] },
    back: { name: 'middle of the back', T: 42, ridges: false, part: 'back', at: [0.0, 0.0, 0.165] }
  };
  const fieldSpacing = s => SITES[s].T / 1.6;                        // mm
  const density = s => Math.pow(10 / fieldSpacing(s), 2);            // fields per cm²
  const dens = s => { const d = density(s); return d < 10 ? d.toFixed(1) : String(Math.round(d)); };
  /* volunteers differ: each one's thresholds are the population's times a factor (volunteer 1 is typical) */
  const VOL = [1, 0.85, 1.2, 0.95, 1.1, 0.8, 1.25, 0.9, 1.05], vol = p => VOL[(Math.round(p.seed) - 1) % 9] || 1;
  const pTwo = (site, sep, f) => { const T = SITES[site].T * (f || 1); return Phi((sep - T) / (0.22 * T)); };
  const WEBER = 0.05;                                                 // just-noticeable difference ÷ load, lifted weights
  const pHeavier = (I, d, f) => Phi(d / (WEBER * (f || 1) * I) * 0.674);   // 2-choice: 75 % correct at Δ = 0.05·I
  function touchTrials(p) {
    const r = rng(300 + p.seed * 97), n = Math.round(p.trials), out = [];
    for (let i = 0; i < n; i++) { const pr = p.tmode === 'weight' ? pHeavier(p.base, p.added, vol(p)) : pTwo(p.site, p.sep, vol(p)); out.push(r() < (p.tmode === 'weight' ? 0.5 + 0.5 * (2 * pr - 1) : pr)); }
    return out;
  }
  /* receptor firing (Fechner's law at the nerve): impulses a second against pressure */
  const firing = (kPa, adapt, t) => Math.max(0, 8 + 22 * Math.log(1 + kPa / 5)) * (adapt ? Math.exp(-t / 0.25) + 0.05 : 1);

  /* ============================================================
     B6.2 · PATHWAY — conduction at real speeds
     ============================================================ */
  const FIBRES = {
    Ab: { name: 'touch (Aβ, myelinated)', v: 50, col: '#8FD4FA', my: true },
    Ad: { name: 'sharp pain (Aδ, thin myelin)', v: 15, col: '#FFD66B', my: true },
    C: { name: 'dull pain (C, unmyelinated)', v: 1, col: '#FF8A80', my: false }
  };
  const ROUTE = { toe: { name: 'big toe', limb: 1.0, cord: 0.45 }, finger: { name: 'fingertip', limb: 0.85, cord: 0.25 }, back: { name: 'the back', limb: 0.15, cord: 0.35 } };
  const SYN = 0.0007;                                                // s per synapse; two on the way (cord, thalamus)
  function arrival(p, f) {
    const R = ROUTE[p.from], k = p.height / 170, F = FIBRES[f];
    let v = F.v * Math.pow(1.6, (p.limbT - 37) / 10);                // a cold limb conducts slower (Q10 ≈ 1.6)
    if (F.my) v *= 1 - 0.65 * p.demy / 100;
    if (F.my && p.demy >= 85) return Infinity;                       // too much myelin lost: the signal fails
    return (R.limb * k) / v + (R.cord * k) / F.v + 2 * SYN;          // the limb's own nerve, then the spinal cord's tracts at their usual speed
  }
  const STIM = { touch: ['Ab'], prick: ['Ab', 'Ad', 'C'], heat: ['Ad', 'C'] };

  /* ============================================================
     B6.3 · PROCESSING — Hick's law
     ============================================================ */
  const HICK = { a: 0.2, b: 0.15 };
  function hickRT(p, n) { const b = HICK.b * (p.compat ? 0.35 : 1) / (1 + 0.25 * (Math.round(p.practice) - 1)); return HICK.a + b * Math.log2(n + 1); }
  function choiceTrials(p) {
    const r = rng(700 + p.seed * 13), n = Math.round(p.n), m = hickRT(p, n), out = [];
    for (let i = 0; i < Math.round(p.ctrials); i++) { const light = Math.floor(r() * n), rt = Math.max(0.12, m * (1 + 0.12 * gauss(r))); out.push({ light, rt, wrong: r() < 0.02 * Math.log2(n + 1) * (p.compat ? 0.3 : 1) }); }
    return out;
  }

  /* ============================================================
     B6.4 · REFLEX — through the spinal cord, or round by the brain
     ============================================================ */
  const REFLEX = {
    knee: { name: 'knee jerk (one synapse)', fibre: 80, syn: 1, nmj: 0.001, emd: 0.008, path: 0.55 },
    withdraw: { name: 'withdrawal from heat (three synapses)', fibre: 15, syn: 3, nmj: 0.001, emd: 0.01, path: 0.55, motorV: 60 }
  };
  function reflexTimes(p) {
    const R = REFLEX[p.rx], k = p.height / 170, path = R.path * k, motorV = R.motorV || R.fibre;
    const reflex = path / R.fibre + path / motorV + R.syn * SYN + R.nmj + R.emd;
    const toBrain = path / R.fibre + 0.45 * k / R.fibre + 2 * SYN, felt = toBrain + 0.05;
    const voluntary = p.cut ? Infinity : toBrain + 0.1 + 0.45 * k / 60 + path / motorV + R.nmj + R.emd + 0.02;
    return { reflex, felt: p.cut ? Infinity : felt, voluntary, gain: (p.jend ? 2 : 1) * (p.cut ? 1.6 : 1) };
  }

  /* ============================================================
     B6.5 · MEMORY — serial position, false memory, forgetting
     ============================================================ */
  const RANDOM = ['river', 'candle', 'button', 'mirror', 'garden', 'pencil', 'ocean', 'ladder', 'violin', 'basket', 'planet', 'hammer', 'saddle', 'window', 'tiger', 'pocket', 'rocket', 'carpet', 'lemon', 'bridge', 'castle', 'needle', 'wallet', 'island', 'kettle', 'forest', 'helmet', 'anchor', 'feather', 'camera'];
  const DRM = ['bed', 'rest', 'awake', 'tired', 'dream', 'wake', 'snooze', 'blanket', 'doze', 'slumber', 'snore', 'nap', 'peace', 'yawn', 'drowsy', 'pillow', 'night', 'cot', 'quilt', 'lullaby', 'alarm', 'sheet', 'dozing', 'bedtime', 'siesta', 'restful', 'nod', 'hammock', 'mattress', 'pyjamas'];
  /* probability of recalling item i of N: an asymptote that rises with study time, primacy, and recency that a delay erases */
  function pRecall(p, i, N) {
    const asym = clamp(0.18 + 0.08 * Math.log2(p.rate / 0.5), 0.12, 0.5), prim = 0.38 * Math.exp(-(i) / 2.2), rec = 0.55 * Math.exp(-(N - 1 - i) / 1.8) * Math.exp(-p.delay / 10);
    return clamp(asym + prim + rec, 0, 0.98);
  }
  const LURE_P = 0.44;                                               // Roediger & McDermott 1995: the critical lure "sleep" recalled ~40–55 %
  function listRun(p) {
    const r = rng(900 + p.seed * 17), N = Math.round(p.N), words = (p.list === 'drm' ? DRM : RANDOM).slice(0, N), rec = words.map((_, i) => r() < pRecall(p, i, N));
    return { words, rec, lure: p.list === 'drm' && r() < LURE_P * (0.8 + 0.4 * Math.min(1, N / 15)) };
  }
  /* Ebbinghaus (1885): savings b = 100k / ((log t)^c + k), t in minutes, k = 1.84, c = 1.25 — gives 57 % at 20 min, 47 % at 1 h,
     30 % at 1 day, 25 % at 6 days, 21 % at 31 days against his 58, 44, 34, 25 and 21 %. A review resets it and multiplies its stability, more so
     the more had been forgotten (the spacing effect). */
  const ebb = tm => tm <= 1 ? 1 : Math.min(1, 1.84 / (Math.pow(Math.log10(tm), 1.25) + 1.84));
  const MEANING = 10, BOOST = 12;    // verse needed about a tenth of the repetitions of nonsense (Ebbinghaus); a review multiplies stability by 1 + 12 × (fraction forgotten)
  function forgetRun(p) {
    const meaning = p.meaning ? MEANING : 1, reviews = [];
    let S = meaning, t0 = 0;
    for (let k = 1; k <= Math.round(p.reviews); k++) { const tr = k * p.gap * 60, R = ebb((tr - t0) / S); S *= 1 + BOOST * (1 - R); t0 = tr; reviews.push({ t: tr, R }); }
    const at = tm => { let s = meaning, z = 0; for (const rv of reviews) { if (tm <= rv.t) break; s *= 1 + BOOST * (1 - rv.R); z = rv.t; } return ebb((tm - z) / s); };   // a test at the moment of a review comes before it
    return { at, reviews };
  }

  /* ============================================================
     B6.6 · TOGETHER — a ball thrown at you
     ============================================================ */
  const STAGES = [['retina', 0.025], ['eye to visual cortex', 0.03], ['judging where it goes', 0.09], ['deciding to catch', 0.05], ['brain to spinal cord', 0.015], ['nerve to the arm', 0.015], ['moving the hand', 0.12]];
  function budget(p) {
    const st = STAGES.map(([n, t]) => [n, t]);
    st[2][1] *= 1 - 0.5 * p.skill; st[3][1] *= 1 - 0.6 * p.skill;            // practice: the judgement comes from memory of past throws
    if (p.distract) st[3][1] += 0.08;
    st[6][1] *= p.hand === 'ready' ? 0.6 : 1;
    return { st, total: st.reduce((u, s) => u + s[1], 0) };
  }
  const flightOf = p => p.dist / (p.speed / 3.6);
  const pCatch = p => Phi((flightOf(p) * (p.view === 'late' ? 0.6 : 1) - budget(p).total) / 0.035);

  /* ============================================================
     SET-UPS AND PARAMETERS
     ============================================================ */
  const SETUPS = [
    { value: 'receptors', label: 'Receptors: how fine is your touch?', teaches: ['B6.1'] },
    { value: 'pathway', label: 'The path to the brain: first and second pain', teaches: ['B6.2'] },
    { value: 'processing', label: 'Processing: more choices, more time', teaches: ['B6.3'] },
    { value: 'reflex', label: 'Reflex or voluntary?', teaches: ['B6.4'] },
    { value: 'memory', label: 'Memory: what stays, what goes, what is made up', teaches: ['B6.5'] },
    { value: 'together', label: 'A ball thrown at you: every stage', teaches: ['B6.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'receptors',
    tmode: 'twopoint', site: 'forearm', sep: 30, base: 200, added: 10, trials: 20, seed: 1,
    from: 'toe', stim: 'prick', height: 160, limbT: 37, demy: 0,
    n: 4, compat: false, practice: 1, ctrials: 20,
    rx: 'knee', jend: false, cut: false,
    mexp: 'list', list: 'random', N: 15, rate: 1.5, delay: 0, reviews: 0, gap: 24, meaning: false,
    speed: 60, dist: 10, skill: 0.3, distract: false, view: 'all', hand: 'ready'
  };
  function preset(o) { return Object.assign({}, BASE, o, { pre: 1 }); }
  const HOMES = {
    receptors: { theta: -1.2, phi: 0.6, dist: 0.75, target: [0.02, 0, 0.04] },
    pathway: { theta: -1.25, phi: 0.45, dist: 1.6, target: [0, -0.05, 0.08] },
    processing: { theta: -1.25, phi: 0.65, dist: 0.85, target: [0.04, 0, 0.04] },
    reflex: { theta: -1.45, phi: 0.12, dist: 1.25, target: [0, 0, 0.18] },
    memory: { theta: -1.2, phi: 0.35, dist: 0.9, target: [0, 0, 0.1] },
    together: { theta: -1.5708, phi: 0.12, dist: 12, target: [5, 0, 0.9] }
  };

  /* ============================================================
     SETTING UP AND RUNNING
     ============================================================ */
  function setup(S) {
    const p = S.p; p.pre = 0;
    S.ts = 0; S.touch = null; S.choice = null; S.list = null; S.forget = null;
    if (p.setup === 'receptors') S.touch = touchTrials(p);
    if (p.setup === 'processing') S.choice = choiceTrials(p);
    if (p.setup === 'memory') { S.list = listRun(p); S.forget = forgetRun(p); }
    if (p.setup === 'together') p.dist = clamp(p.dist, 3, 20);
    if (p.setup === 'together' && S.camFor === 'together' && S.camD !== p.dist) S.camFor = null;   // the view frames the whole throw
    const part = p.tmode === 'weight' ? 'hand' : SITES[p.site].part;
    if (p.setup === 'receptors' && S.camFor === 'receptors' && S.camPart !== part) S.camFor = null;   // and the head or back being touched
    if (!S.cam || S.camFor !== p.setup) { const h = HOMES[p.setup]; if (p.setup === 'together') { h.target = [p.dist / 2, 0, 0.9]; h.dist = 3 + p.dist * 1.15; S.camD = p.dist; }
      if (p.setup === 'receptors') { h.target = part === 'face' ? [0.02, 0, 0.14] : part === 'back' ? [0.02, 0, 0.08] : [0.02, 0, 0.04]; h.phi = part === 'face' ? 0.28 : 0.6; S.camPart = part; } S.cam = Camera({ theta: h.theta, phi: h.phi, dist: h.dist, target: h.target.slice(), fov: 0.72 }); S.cam.minDist = 0.3; S.cam.maxDist = 20; S.camFor = p.setup; }
  }
  function step(S, dt) { S.ts += dt; }
  /* the animated cycles, in display seconds */
  const CYC = { pathway: 4, reflex: 3, together: 4, processing: 1.2, memory: 0.8 };
  const SLOW_PATH = 1.5, SLOW_RX = 6, SLOW_BALL = 5;               // how much each is slowed to be seen

  /* ============================================================
     THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const lcdCache = {};
  function lcd(title, value, unit, col) { const key = [title, value, unit].join('|'); if (!lcdCache[key]) { if (Object.keys(lcdCache).length > 60) Object.keys(lcdCache).forEach(k => delete lcdCache[k]); lcdCache[key] = BENCH.lcdTex(title, value, unit, col || '#7CF0C0'); } return lcdCache[key]; }
  function lay(g) {
    const W = g.w, H = g.h, narrow = W < 640;
    if (narrow) return { narrow, W, H, px: 10, py: 102, pw: W - 20, ph: H - 102 - 56, bw: 0 };
    const pw = Math.min(W * 0.48, 540);
    return { narrow, W, H, px: W - pw - 12, py: 84, pw, ph: H - 84 - 30, bw: W - pw - 26 };
  }
  const fmtMs = s => !isFinite(s) ? 'never' : s < 1 ? Math.round(s * 1000) + ' ms' : s.toFixed(2) + ' s';
  let scopeCv = null;
  function capScreen(p) {
    if (typeof document === 'undefined') return null;
    const fs = STIM[p.stim], tmax = 2.0, series = [];
    const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * tmax; let v = 0; fs.forEach(f => { const a = arrival(p, f); if (isFinite(a)) v += (f === 'C' ? 0.25 : 0.8) * Math.exp(-Math.pow((t - a) / (f === 'C' ? 0.12 : 0.01), 2)); }); pts.push([t / tmax, 0.1 + 0.8 * Math.min(1, v)]); }
    series.push({ col: '#7CF0C0', pts });
    scopeCv = GA().traceTex(scopeCv, series, { text: ['at the cord, 0–2 s'] });
    return scopeCv;
  }
  /* Weber at the nerve: firing grows with the log of the load, so equal ratios give equal steps */
  function weberChart(ctx, x, y, w, h, p) {
    const G = GA(), X = m => x + 40 + (w - 56) * m / 1000, Fm = m => firing(m / 20, false, 0), Y = f => y + h - 26 - (h - 44) * f / 90;
    G.plate(ctx, x, y, w, h, () => {
      ctx.save(); ctx.strokeStyle = 'rgba(201,212,234,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1000), Y(0)); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(90)); ctx.stroke();
      ctx.strokeStyle = '#FFD66B'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let m = 0; m <= 1000; m += 5) { m ? ctx.lineTo(X(m), Y(Fm(m))) : ctx.moveTo(X(m), Y(Fm(m))); } ctx.stroke();
      const a = p.base, b = p.base + p.added, j = a * (1 + WEBER), g0 = 50;
      if (Math.abs(a - g0) > 40) { [[g0, 'rgba(201,212,234,.6)'], [g0 + p.added, 'rgba(201,212,234,.6)']].forEach(([m, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(m), Y(Fm(m)), 3.5, 0, TAU); ctx.fill(); }); ctx.font = mono(9); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('the same +' + p.added + ' g on 50 g: Δ ' + (Fm(g0 + p.added) - Fm(g0)).toFixed(1) + '/s', X(g0) + 10, Y(Fm(g0)) - 12); }
      [[a, '#8FD4FA'], [b, '#FF8A80']].forEach(([m, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(m), Y(Fm(m)), 4.5, 0, TAU); ctx.fill(); });
      ctx.fillStyle = 'rgba(159,224,184,.25)'; ctx.fillRect(X(a), Y(Fm(j)), Math.max(1, X(j) - X(a)), Y(Fm(a)) - Y(Fm(j)));
      ctx.font = mono(9); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      [0, 250, 500, 750, 1000].forEach(m => ctx.fillText(m + (m === 1000 ? ' g' : ''), X(m), Y(0) + 4));
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('impulses/s', x + 6, Y(88));
      ctx.fillStyle = '#C9D4EA'; ctx.fillText(kit().fitText(ctx, 'Δ firing ' + (Fm(b) - Fm(a)).toFixed(1) + '/s for +' + p.added + ' g · need ≈ ' + (Fm(j) - Fm(a)).toFixed(1) + '/s to notice', w - 60), x + 46, Y(72));
      ctx.restore();
    });
    G.caption(ctx, x, y - 4, w, 'a pressure receptor’s firing', 'equal ratios, equal steps');
  }
  function drawBench(S, g, Ly) {
    const p = S.p, ctx = g.ctx, cam = S.cam, G = GA(), bw = Ly.bw;
    if (!cam || bw < 200) return;
    cam.setViewport(bw, g.h); cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bw + 14, g.h); ctx.clip();
    const F = R3.Frame(ctx, cam, { floorZ: 0, ambient: 0.3 }), lab = [];
    if (p.setup !== 'together') { MEAS.bench(F, -0.5, 0.5, -0.32, 0.3, { cabinet: '#A9B2BC' }); MEAS.tileWall(F, -0.5, 0.5, 0.3, 0, 0.6); }
    if (p.setup === 'receptors') {
      const part = p.tmode === 'weight' ? 'hand' : SITES[p.site].part, site = p.tmode === 'weight' ? SITES.palm.at : SITES[p.site].at;
      G.touchBench(F, [0, 0], { part, site, sep: p.sep, mode: p.tmode, mass: p.base + p.added });
      lab.push([site, p.tmode === 'weight' ? p.base + ' g, then ' + (p.base + p.added) + ' g on the palm' : 'caliper ' + p.sep + ' mm apart on the ' + SITES[p.site].name, 20, -50], [part === 'face' ? [0.0, -0.09, 0.25] : part === 'back' ? [-0.15, 0, 0.16] : [-0.2, 0, 0.06], p.tmode === 'weight' ? 'eyes closed: is the second heavier?' : 'eyes closed: one point or two?', -20, 40]);
    } else if (p.setup === 'pathway') {
      const u = (S.ts % CYC.pathway), t = u / SLOW_PATH, R = ROUTE[p.from], stimAt = p.from === 'toe' ? [0.36, 0, 0.1] : p.from === 'finger' ? [0.1, 0, 0.09] : [-0.3, 0, 0.12];
      const beads = STIM[p.stim].map(f => ({ f: clamp(t / (arrival(p, f) * (R.limb / (R.limb + R.cord))), 0, 1), col: FIBRES[f].col })).filter(b => b.f < 1 && t > 0);
      G.conductionBench(F, [0, 0], { stimAt, screen: capScreen(p), beads, cold: (37 - p.limbT) / 20 });
      if (p.limbT < 33) lab.push([[0.3, 0, 0.06], 'limb cooled to ' + p.limbT + ' °C', 40, -70]);
      lab.push([stimAt, 'stimulus: ' + { touch: 'a light touch', prick: 'a pin prick', heat: 'a hot probe' }[p.stim], 20, -40], [[-0.36, -0.09, 0.14], 'recording at the spinal cord', -20, -40], [[-0.1, -0.25, 0.13], 'what arrives, and when', -20, 50]);
    } else if (p.setup === 'processing') {
      const C = S.choice, k = Math.floor(S.ts / CYC.processing) % C.length, u = S.ts % CYC.processing, tr = C[k];
      G.reactionBoard(F, [0, 0], { n: Math.round(p.n), lit: u > 0.2 ? tr.light : -1, pressed: u > 0.2 + tr.rt * 1.5 ? tr.light : -1, lcd: lcd('RT ms', u > 0.2 + tr.rt * 1.5 ? String(Math.round(tr.rt * 1000)) : '---', '') });
      lab.push([[-0.18, 0.05, 0.05], Math.round(p.n) + ' lights: one comes on', -20, -40], [[-0.18, -0.04, 0.05], 'press the button under it', -20, 40]);
    } else if (p.setup === 'reflex') {
      const T = reflexTimes(p), u = S.ts % CYC.reflex, t = (u - 0.4) / SLOW_RX;
      const kick = t > T.reflex ? clamp(Math.sin(Math.min(Math.PI, (t - T.reflex) / 0.12 * Math.PI)) * 0.35 * T.gain, 0, 0.8) : 0;
      if (p.rx === 'knee') {
        G.kneeBench(F, [0, 0], { kick, hammer: u < 0.4 ? 1 - u / 0.4 : 0 });
        lab.push([[0.11, 0, 0.19], 'tap below the kneecap', 30, 30], [[-0.1, 0, 0.27], 'leg hanging free', -30, -40]);
      } else {
        const lift = t > T.reflex ? clamp((t - T.reflex) / 0.12, 0, 1) * 0.12 * Math.min(1, T.gain) : 0;
        G.hotplateBench(F, [0, 0.02], { lift, heat: 1 });
        lab.push([[0.1, 0.02, 0.05], 'hot plate', 30, 40], [[0.1, 0.02, 0.05 + lift], 'the hand snatched away', -30, -50]);
      }
    } else if (p.setup === 'memory') {
      R3.box(F, [0, 0.12, 0.13], [0.3, 0.02, 0.2], '#20242C', {});
      if (typeof document !== 'undefined') { const L0 = S.list, i = Math.min(L0.words.length - 1, Math.floor(S.ts / CYC.memory)), c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#0A1018'; x.fillRect(0, 0, 320, 200); x.fillStyle = '#EAF1FF'; x.font = '700 44px "IBM Plex Sans",sans-serif'; x.textAlign = 'center'; x.fillText(p.mexp === 'forget' ? (p.meaning ? ['the', 'moon', 'was', 'a', 'ghostly', 'galleon'] : ['DAX', 'BOK', 'YAT', 'ZEP', 'KIV', 'MUR'])[Math.floor(S.ts / CYC.memory) % 6] : S.ts / CYC.memory < L0.words.length ? L0.words[i] : 'recall!', 160, 112); S._wordTex = c; R3.texPlane(F, [0, 0.109, 0.14], [0.13, 0, 0], [0, 0, -0.08], c, { grid: 1, bias: -0.03 }); }
      R3.box(F, [0.02, -0.12, 0.002], [0.14, 0.2, 0.002], '#F4F4EE', { shadow: false });
      R3.cylinder(F, [0.12, -0.1, 0.004], [0.19, -0.15, 0.006], 0.003, '#E8C040', { segments: 6 });
      lab.push([[0, 0.12, 0.24], p.mexp === 'forget' ? (p.meaning ? 'learning a poem' : 'nonsense syllables, as Ebbinghaus learned') : 'one word every ' + p.rate + ' s', 20, -30], [[0.02, -0.12, 0.01], p.mexp === 'forget' ? 'relearn later: how much was saved?' : 'write down every word you can', -20, 40]);
    } else {
      const fl = flightOf(p), u = S.ts % CYC.together, t = (u - 0.3) / SLOW_BALL, f = clamp(t / fl, 0, 1);
      const B = budget(p), caught = pCatch(p) > 0.5;
      const ball = [p.dist * (1 - f), 0, 1.6 - 0.3 * f + Math.sin(f * Math.PI) * 0.4];
      const ready = p.hand === 'ready', hp = ready ? [0.3, -0.25, 1.45] : [0.1, -0.3, 0.85], start = [p.dist - 0.25, -0.25, 1.75];
      const path = q => [lerp(start[0], hp[0] + 0.04, q), lerp(start[1], hp[1], q), lerp(start[2], hp[2], q) + Math.sin(q * Math.PI) * 0.25 * p.dist / 10];
      const miss = q => { const a = path(1); return [a[0] - (q - 1) * (p.dist - 0.3), a[1] - (q - 1) * 0.6, a[2] - (q - 1) * 1.2]; };
      const ff = t / fl, pos = ff < 1 ? path(ff) : caught ? path(1) : miss(Math.min(ff, 1.4));
      G.catchBench(F, [0, 0], { dist: p.dist, ready, ball: t >= 0 ? pos : null, closed: t > fl && caught, trail: t > 0 ? [0.2, 0.4, 0.6, 0.8].filter(q => q < ff).map(path) : [] });
      lab.push([[p.dist + 0.05, 0, 1.9], 'thrown at ' + p.speed + ' km/h from ' + p.dist + ' m', -20, -40], [hp, ready ? 'your hand, up and ready' : 'your hand, at your side', 30, 50]);
    }
    F.render();
    if (g.labels) G.benchLabels(ctx, cam, lab, bw, g.h);
    ctx.restore();
  }
  function drawPanel(S, g, Ly) {
    const p = S.p, ctx = g.ctx, G = GA(), { px, py, pw, ph } = Ly;
    if (p.setup === 'receptors') {
      const sh = ph * 0.42;
      G.plate(ctx, px, py, pw, sh, () => { const fr = p.tmode === 'weight' ? { merkel: 0.8, pacinian: 0.2, meissner: 0.3 } : { meissner: 0.9, merkel: 0.6 }; const A = G.receptorSkin(ctx, px, py, pw, sh, { firing: fr, t: S.t || 0, press: 1, at: 0.45 });
        if (g.labels) G.sideLabels(ctx, [{ x: A.meissner[0], y: A.meissner[1], text: 'Meissner: light touch' }, { x: A.merkel[0], y: A.merkel[1], text: 'Merkel: pressure' }, { x: A.free[0], y: A.free[1], text: 'free endings: pain, heat' }, { x: A.pacinian[0], y: A.pacinian[1], text: 'Pacinian: vibration' }].map(it => Object.assign(it, { side: 'R' })), { mid: 0, xL: px, xR: px + pw - 6 - 150, top: py + 10, bottom: py + sh - 8, maxW: 150, size: 9 }); });
      G.caption(ctx, px, py - 4, pw, 'the skin and its receptors', 'the probe presses');
      if (p.tmode === 'weight') { weberChart(ctx, px, py + sh + 26, pw, ph - sh - 26, p); return; }
      const R = Math.min(pw, ph - sh - 30) / 2 - 6, cx = px + pw / 2, cy = py + sh + 22 + R, fov = Math.max(SITES[p.site].T * 2.2, p.sep * 1.5);
      const k = R / fov, s = p.sep;
      G.circle(ctx, cx, cy, R, () => G.fieldMap(ctx, cx, cy, R, { spacing: fieldSpacing(p.site), fov, ridges: SITES[p.site].ridges, p1: [cx - s / 2 * k, cy], p2: [cx + s / 2 * k, cy] }));
      { const hx = cx + s / 2 * k; g.handle(hx, cy, 12, 'sep'); S._sepK = k; }
      G.scaleBar(ctx, cx - R * 0.4, cy + R * 0.8, 10 * k >= 20 ? 10 * k : 1 * k * 10, 10 * k >= 20 ? '10 mm' : '10 mm');
      G.caption(ctx, px, cy - R - 6, pw, 'receptive fields under the caliper', dens(p.site) + ' per cm²');
    } else if (p.setup === 'pathway') {
      const u = (S.ts % CYC.pathway), t = u / SLOW_PATH;
      G.plate(ctx, px, py, pw, ph, () => {
        const H = ph * 0.96, cx = px + pw * 0.3, A = G.body(ctx, cx, py + 6, H, { show: { nerv: true, circ: false, resp: false, dig: false, exc: false }, focus: 'nerv' });
        const X = v => cx + v * H, Y = v => py + 6 + v * H;
        const start = p.from === 'toe' ? [X(0.05), Y(0.97)] : p.from === 'finger' ? [X(0.17), Y(0.56)] : [X(0.03), Y(0.3)];
        const cord = p.from === 'back' ? [X(0), Y(0.3)] : p.from === 'finger' ? [X(0), Y(0.22)] : [X(0), Y(0.46)], brain = [X(0), Y(0.06)];
        const route = spline([start, [lerp(start[0], cord[0], 0.5), lerp(start[1], cord[1], 0.6)], cord, [X(0), Y(0.2)], brain], 10);
        STIM[p.stim].forEach(f => { const a = arrival(p, f); if (!isFinite(a)) return; const fr = clamp(t / a, 0, 1), P = route[Math.min(route.length - 1, Math.floor(fr * (route.length - 1)))]; ctx.save(); ctx.shadowColor = FIBRES[f].col; ctx.shadowBlur = 14; ctx.fillStyle = FIBRES[f].col; ctx.beginPath(); ctx.arc(P[0], P[1], 5, 0, TAU); ctx.fill(); ctx.restore(); });
        if (g.labels) G.sideLabels(ctx, STIM[p.stim].map(f => ({ x: start[0], y: start[1], text: FIBRES[f].name.split(' (')[0] + ': ' + fmtMs(arrival(p, f)), col: FIBRES[f].col, side: 'R' })).concat([{ x: brain[0], y: brain[1], text: 'brain: you feel it', side: 'R' }, { x: cord[0], y: cord[1], text: 'spinal cord', side: 'R' }]), { mid: 0, xL: px, xR: px + pw * 0.58, top: py + 12, bottom: py + ph - 10, maxW: pw * 0.4 });
      });
      G.caption(ctx, px, py - 4, pw, 'the signals racing to the brain', 'slowed ' + SLOW_PATH + '×');
      function spline(pts, per) { return G.spline(pts, per); }
    } else if (p.setup === 'processing' || p.setup === 'memory' && p.mexp === 'forget') {
      const lit = p.setup === 'processing' ? (() => { const u = S.ts % CYC.processing; return { visual: u > 0.2 ? 1 : 0, assoc: u > 0.3 ? 1 : 0, motor: u > 0.45 ? 1 : 0 }; })() : { hippo: 1, assoc: 0.5 };
      G.plate(ctx, px, py, pw, ph, () => { const R = Math.min(pw * 0.27, ph * 0.3), cx = px + pw * 0.5, P = G.brainSide(ctx, cx, py + ph * 0.42, R, { lit });
        if (g.labels) G.sideLabels(ctx, [{ x: P.visual[0], y: P.visual[1], text: 'visual cortex', side: 'L' }, { x: P.assoc[0], y: P.assoc[1], text: 'front: choice', side: 'R' }, { x: P.motor[0], y: P.motor[1], text: 'motor strip', side: 'R' }, { x: P.sensory[0], y: P.sensory[1], text: 'touch strip', side: 'L' }, { x: P.hippo[0], y: P.hippo[1], text: 'hippocampus', side: 'L' }, { x: P.cerebellum[0], y: P.cerebellum[1], text: 'cerebellum', side: 'L' }], { mid: cx, xL: cx - R * 1.12, xR: cx + R * 1.12, top: py + 10, bottom: py + ph - 10, maxW: Math.max(60, pw * 0.5 - R * 1.12 - 8), size: 9 });
        G.tag(ctx, cx, py + ph - 18, p.setup === 'processing' ? 'eye → visual cortex → front chooses → motor strip → hand' : 'new memories pass through the hippocampus; old ones live in the cortex', { size: 9 }); });
      G.caption(ctx, px, py - 4, pw, p.setup === 'processing' ? 'the brain choosing which button' : 'memories are made in the hippocampus', p.setup === 'processing' ? 'log₂(' + (Math.round(p.n) + 1) + ') = ' + Math.log2(Math.round(p.n) + 1).toFixed(2) + ' bits' : '');
    } else if (p.setup === 'reflex') {
      const T = reflexTimes(p), u = S.ts % CYC.reflex, t = (u - 0.4) / SLOW_RX, phase = t < 0 ? null : t / T.reflex;
      G.plate(ctx, px, py, pw, ph, () => { const A = G.reflexArc(ctx, px + 6, py + 6, pw - 12, ph - 12, { cut: p.cut, phase: phase != null && phase <= 1 ? phase : null, kick: t > T.reflex && t < T.reflex + 0.15 ? 1 : 0, relay: p.rx === 'withdraw' });
        if (g.labels) G.sideLabels(ctx, [{ x: A.spindle[0], y: A.spindle[1], text: p.rx === 'knee' ? 'stretch receptor' : 'heat receptor (skin)', side: 'R' }, { x: A.sens[0], y: A.sens[1], text: 'sensory neuron in', side: 'R' }, { x: A.cord[0], y: A.cord[1], text: 'spinal cord: ' + REFLEX[p.rx].syn + ' synapse' + (REFLEX[p.rx].syn > 1 ? 's' : ''), side: 'L' }, { x: A.mot[0], y: A.mot[1], text: 'motor neuron out', side: 'R' }, { x: A.brain[0], y: A.brain[1], text: p.cut ? 'to the brain: cut' : 'to the brain (later)', side: 'R' }], { mid: px + pw * 0.3, xL: px + pw * 0.14, xR: px + pw * 0.64, top: py + 10, bottom: py + ph - 10, maxW: pw * 0.34, size: 9.5 }); });
      G.caption(ctx, px, py - 4, pw, p.rx === 'knee' ? 'the reflex arc' : 'the withdrawal arc', fmtMs(T.reflex) + ' vs ' + fmtMs(T.voluntary));
    } else if (p.setup === 'memory') {
      const L0 = S.list, now = Math.floor(S.ts / CYC.memory);
      G.plate(ctx, px, py, pw, ph, () => { const h = G.wordGrid(ctx, px + 8, py + 10, pw - 16, ph * 0.45, L0.words, { recalled: L0.rec, shown: L0.words.length, done: true, now: now < L0.words.length ? now : -1 });
        G.tag(ctx, px + pw / 2, py + h + 22, L0.rec.filter(Boolean).length + ' of ' + L0.words.length + ' written down (green) · numbers: the order shown', { size: 9.5 });
        if (p.list === 'drm') G.tag(ctx, px + pw / 2, py + h + 40, L0.lure ? 'also written down: SLEEP — never on the list' : 'the lure SLEEP was not written down this time', { size: 10, col: L0.lure ? '#FF8A80' : '#9FE0B8' });
        const N = L0.words.length, tail = Math.min(4, N), sy = py + h + 62, inSTM = i => i >= N - tail && p.delay < 15;
        const stm = L0.words.map((wd, i) => ({ t: wd, i })).filter(q => L0.rec[q.i] && inSTM(q.i)).map(q => ({ t: q.t, alpha: Math.exp(-p.delay / 10) }));
        const ltm = L0.words.map((wd, i) => ({ t: wd, i })).filter(q => L0.rec[q.i] && !inSTM(q.i)).map(q => ({ t: q.t, col: q.i < 3 ? '#9FE0B8' : '#EAF1FF' }));
        if (py + ph - 8 - sy > 90) G.memoryStores(ctx, px + 10, sy, pw - 20, py + ph - 8 - sy, { now: now < N ? L0.words[now] : 'recall!', stm, ltm, lure: p.list === 'drm' && L0.lure ? 'sleep' : '', delay: p.delay }); });
      G.caption(ctx, px, py - 4, pw, 'the list, and what was recalled', p.delay > 0 ? p.delay + ' s counting first' : 'recall at once');
    } else {
      const B = budget(p), fl = flightOf(p), u = S.ts % CYC.together, t = (u - 0.3) / SLOW_BALL;
      G.plate(ctx, px, py, pw, ph, () => { const R = Math.min(pw, ph) * 0.24; const P = G.brainSide(ctx, px + pw * 0.5, py + ph * 0.3, R, { lit: { visual: t > 0.025 ? 1 : 0, assoc: t > 0.055 ? 1 : 0, motor: t > 0.055 + B.st[2][1] + B.st[3][1] ? 1 : 0, cerebellum: 1 } });
        // the time budget against the flight
        const bx = px + 14, bw = pw - 28, by = py + ph * 0.66, sc = bw / Math.max(fl, B.total) / 1.05; let x0 = bx;
        const cols = ['#8FD4FA', '#9FE0B8', '#FFD66B', '#FFB35C', '#FF8A80', '#C89BFF', '#E8A0D8'];
        B.st.forEach(([n, tt], i) => { ctx.fillStyle = cols[i]; ctx.fillRect(x0, by, tt * sc - 1, 14); x0 += tt * sc; });
        ctx.save(); ctx.strokeStyle = '#EAF1FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + fl * sc, by - 10); ctx.lineTo(bx + fl * sc, by + 26); ctx.stroke(); ctx.restore();
        if (t >= 0) { ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(bx + Math.min(t, fl) * sc, by - 6); ctx.lineTo(bx + Math.min(t, fl) * sc, by + 20); ctx.stroke(); ctx.restore(); }
        G.tag(ctx, Math.min(bx + fl * sc, px + pw - 70), by + 36, 'ball arrives: ' + fmtMs(fl), { size: 10 });
        if (p.view === 'late') { ctx.save(); ctx.fillStyle = 'rgba(255,138,128,.18)'; ctx.fillRect(bx, by - 8, fl * 0.4 * sc, 30); ctx.restore(); G.tag(ctx, bx + fl * 0.2 * sc, by + 30, 'not seen', { size: 9, col: '#FF8A80' }); }
        G.tag(ctx, bx, by - 16, 'your stages: ' + fmtMs(B.total), { size: 10, align: 'left' });
        if (g.labels && by + 58 + 3 * 14 + 6 < py + ph) B.st.forEach(([n, tt], i) => { const yy = by + 58 + (i % 4) * 14, xx = bx + Math.floor(i / 4) * bw / 2; ctx.save(); ctx.fillStyle = cols[i]; ctx.fillRect(xx, yy - 4, 10, 8); ctx.font = mono(9, 500); ctx.fillStyle = '#C9D4EA'; ctx.textBaseline = 'middle'; ctx.fillText(kit().fitText(ctx, n + ' ' + Math.round(tt * 1000), bw / 2 - 16), xx + 14, yy); ctx.restore(); });
      });
      G.caption(ctx, px, py - 4, pw, 'every stage, against the ball', 'slowed ' + SLOW_BALL + '×');
    }
  }
  function drawStage(S, g) {
    const p = S.p, K = kit(); if (!K || !GA() || g.w < 160 || g.h < 200) return;      // a stage still being laid out has no room for a plate
    const Ly = lay(g);
    if (!Ly.narrow) drawBench(S, g, Ly);
    drawPanel(S, g, Ly);
    cards(S, g, Ly);
    const Hd = headerOf(S); K.header(g, Hd[0], Hd[1], Hd[2]);
  }
  function cards(S, g, Ly) {
    const p = S.p, G = GA(), at = { x: 10, w: Ly.narrow ? 0 : Math.min(330, Ly.bw - 10) };
    if (p.setup === 'receptors') { const T = S.touch, yes = T.filter(Boolean).length; G.rowsCard(g, S, p.tmode === 'weight' ? 'Is the second one heavier?' : 'One point or two?', [[{ t: 'trials', bold: true }, T.length + ' with eyes closed'], [{ t: p.tmode === 'weight' ? 'right' : 'felt two', bold: true }, { t: yes + ' of ' + T.length + ' (' + Math.round(yes / T.length * 100) + ' %)', col: '#FFD66B' }], [{ t: 'expected', bold: true }, Math.round((p.tmode === 'weight' ? pHeavier(p.base, p.added, vol(p)) : pTwo(p.site, p.sep, vol(p))) * 100) + ' %'], [{ t: 'threshold', bold: true }, p.tmode === 'weight' ? 'about ' + (WEBER * p.base).toFixed(1) + ' g on ' + p.base + ' g (5 %)' : SITES[p.site].T + ' mm on the ' + SITES[p.site].name]], at, { cols: [0, 0.28], chip: 'trials' }); return; }
    if (p.setup === 'pathway') { G.rowsCard(g, S, 'Arrival at the brain', STIM[p.stim].map(f => [{ t: FIBRES[f].name.split(' (')[0], bold: true, col: FIBRES[f].col }, fmtMs(arrival(p, f)), (FIBRES[f].v * Math.pow(1.6, (p.limbT - 37) / 10) * (FIBRES[f].my ? 1 - 0.65 * p.demy / 100 : 1)).toFixed(FIBRES[f].v < 5 ? 1 : 0) + ' m/s']), at, { cols: [0, 0.42, 0.72], chip: 'arrival' }); return; }
    if (p.setup === 'processing') { const C = S.choice, m = C.reduce((u, q) => u + q.rt, 0) / C.length; G.rowsCard(g, S, Math.round(p.n) + ' choices', [[{ t: 'mean RT', bold: true }, { t: Math.round(m * 1000) + ' ms', col: '#FFD66B' }], [{ t: 'Hick', bold: true }, Math.round(hickRT(p, Math.round(p.n)) * 1000) + ' ms = 200 + b × ' + Math.log2(Math.round(p.n) + 1).toFixed(2) + ' bits'], [{ t: 'errors', bold: true }, C.filter(q => q.wrong).length + ' of ' + C.length]], at, { cols: [0, 0.26], chip: 'choices' }); return; }
    if (p.setup === 'reflex') { const T = reflexTimes(p); G.rowsCard(g, S, REFLEX[p.rx].name, [[{ t: 'reflex', bold: true }, { t: fmtMs(T.reflex), col: '#9FE0B8' }], [{ t: 'you feel it', bold: true }, fmtMs(T.felt)], [{ t: 'kick on purpose', bold: true }, { t: fmtMs(T.voluntary), col: '#FFB35C' }], [{ t: 'spinal cord', bold: true }, p.cut ? 'cut above: the reflex still works' : 'intact']], at, { cols: [0, 0.36], chip: 'times' }); return; }
    if (p.setup === 'memory') { if (p.mexp === 'forget') { const Fr = S.forget; G.rowsCard(g, S, 'Remembered (Ebbinghaus savings)', [[1, 24, 7 * 24, 30 * 24].map(h => h < 24 ? h + ' h' : (h / 24) + ' d')].concat([[1, 24, 7 * 24, 30 * 24].map(h => ({ t: Math.round(Fr.at(h * 60) * 100) + ' %', col: '#FFD66B' }))]), at, { cols: [0, 0.25, 0.5, 0.75], chip: 'kept' }); } else { const L0 = S.list, N = L0.words.length, third = Math.ceil(N / 3); G.rowsCard(g, S, 'Recall by position', [['first third', 'middle', 'last third'], [0, 1, 2].map(k => { const sl = L0.rec.slice(k * third, (k + 1) * third); return { t: Math.round(sl.filter(Boolean).length / Math.max(1, sl.length) * 100) + ' %', col: '#FFD66B' }; })], at, { cols: [0, 0.34, 0.67], chip: 'recall' }); } return; }
    const B = budget(p), fl = flightOf(p); G.rowsCard(g, S, 'Can you catch it?', [[{ t: 'flight', bold: true }, fmtMs(fl) + (p.view === 'late' ? ' (you see only the last 60 %)' : '')], [{ t: 'your stages', bold: true }, fmtMs(B.total)], [{ t: 'chance', bold: true }, { t: Math.round(pCatch(p) * 100) + ' %', col: pCatch(p) > 0.5 ? '#9FE0B8' : '#FF8A80' }]], at, { cols: [0, 0.3], chip: 'catch' });
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'receptors') { const T = S.touch, yes = T.filter(Boolean).length; return p.tmode === 'weight' ? [p.base + ' g, then ' + (p.base + p.added) + ' g: right ' + yes + ' times in ' + T.length, 'Weber: the smallest difference you notice is ~5 % of what you hold — ' + (WEBER * p.base).toFixed(1) + ' g here', 'the same 10 g is easy on 50 g and invisible on 1 kg'] : ['Two points ' + p.sep + ' mm apart on the ' + SITES[p.site].name + ': felt as two ' + yes + ' times in ' + T.length, 'threshold here ' + SITES[p.site].T + ' mm · receptive fields ~' + fieldSpacing(p.site).toFixed(1) + ' mm apart · ' + dens(p.site) + ' per cm²', 'two points feel like two only if they fall on different receptors — the hand does not feel, it detects']; }
    if (p.setup === 'pathway') { const fs = STIM[p.stim], a = fs.map(f => arrival(p, f)); return ['A ' + { touch: 'touch', prick: 'pin prick', heat: 'hot probe' }[p.stim] + ' on the ' + ROUTE[p.from].name + ': ' + fs.map((f, i) => FIBRES[f].name.split(' (')[0] + ' ' + fmtMs(a[i])).join(' · '), (p.height) + ' cm tall · limb at ' + p.limbT + ' °C' + (p.demy ? ' · ' + p.demy + ' % of myelin lost' : ''), p.stim === 'touch' ? 'touch arrives in tens of milliseconds' : 'a sharp first pain, then a dull second pain up to a second later']; }
    if (p.setup === 'processing') { const C = S.choice, m = C.reduce((u, q) => u + q.rt, 0) / C.length; return [Math.round(p.n) + ' lights, ' + Math.round(p.n) + ' buttons: mean reaction ' + Math.round(m * 1000) + ' ms', 'Hick: 200 ms + ' + Math.round(hickRT(p, Math.round(p.n)) * 1000 - 200) + ' ms for ' + Math.log2(Math.round(p.n) + 1).toFixed(2) + ' bits' + (p.compat ? ' · button right under its light' : '') + ' · practice ' + Math.round(p.practice), 'the brain spends the time choosing — the nerves are fast']; }
    if (p.setup === 'reflex') { const T = reflexTimes(p); return [REFLEX[p.rx].name + ': ' + fmtMs(T.reflex) + ' — you kick on purpose after ' + fmtMs(T.voluntary), 'you feel the tap at ' + fmtMs(T.felt) + (p.cut ? ' (not at all: the cord is cut)' : '') + (p.jend ? ' · hands clenched (Jendrassik)' : '') + ' · ' + p.height + ' cm tall', p.cut ? 'no brain in the loop — and the reflex still works' : 'the reflex never goes to the brain: the spinal cord answers']; }
    if (p.setup === 'memory') { if (p.mexp === 'forget') { const Fr = S.forget; return ['Ebbinghaus: ' + Math.round(Fr.at(24 * 60) * 100) + ' % kept after a day, ' + Math.round(Fr.at(30 * 24 * 60) * 100) + ' % after a month', Math.round(p.reviews) + ' reviews, ' + p.gap + ' h apart' + (p.meaning ? ' · meaningful material' : ' · nonsense syllables'), 'each review after some forgetting makes the memory last much longer']; } const L0 = S.list; return ['A list of ' + L0.words.length + (p.list === 'drm' ? ' words about sleep' : ' words') + ': ' + L0.rec.filter(Boolean).length + ' recalled', 'one every ' + p.rate + ' s · ' + (p.delay ? p.delay + ' s counting backwards before recall' : 'recall at once'), p.list === 'drm' ? 'memory rebuilds: words that fit the theme get “remembered” too' : 'first words rehearsed most (primacy), last still in mind (recency)']; }
    return ['A ball at ' + p.speed + ' km/h from ' + p.dist + ' m: ' + fmtMs(flightOf(p)) + ' in the air, your stages ' + fmtMs(budget(p).total), 'chance of a catch ' + Math.round(pCatch(p) * 100) + ' %' + (p.distract ? ' · distracted' : '') + ' · practice ' + Math.round(p.skill * 100) + ' %', 'eye → brain → spinal cord → hand, with memory of past throws to predict'];
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'receptors') {
      if (p.tmode === 'weight') { const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'right, % (2 choices)' }, { c: '#8FB4FF', label: 'your trials', dot: true }]); const P = g.Plot({ xmin: 0, xmax: Math.max(40, p.base * 0.2), ymin: 40, ymax: 100, pad: { t: Kk.t }, xlabel: 'added, g', ylabel: '%', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame(); P.clip(() => { const xs = []; for (let d = 0; d <= Math.max(40, p.base * 0.2); d += 0.5) xs.push(d); P.line(xs.map(d => [d, 50 + 50 * (2 * pHeavier(p.base, d, vol(p)) - 1)]), '#FFD66B', 2.4); P.hline(75, 'rgba(201,212,234,.4)', [3, 3]); P.vline(WEBER * p.base, 'rgba(201,212,234,.4)', [3, 3]); const T = S.touch; P.dot(p.added, T.filter(Boolean).length / T.length * 100, 5.5, '#8FB4FF', '#0B0F18'); }); Kk.draw(P); return; }
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'felt as two, % (' + SITES[p.site].name + ')' }, { c: '#8FB4FF', label: 'your trials', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 60, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'points apart, mm', ylabel: '%', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const xs = []; for (let d = 0; d <= 60; d += 0.25) xs.push(d); P.line(xs.map(d => [d, pTwo(p.site, d, vol(p)) * 100]), '#FFD66B', 2.4); P.hline(50, 'rgba(201,212,234,.4)', [3, 3]); const T = S.touch; P.dot(p.sep, T.filter(Boolean).length / T.length * 100, 5.5, '#8FB4FF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'pathway') {
      const fs = STIM[p.stim], Kk = K.plotKey(g, fs.map(f => ({ c: FIBRES[f].col, label: FIBRES[f].name.split(' (')[0] })));
      const P = g.Plot({ xmin: 0, xmax: 2, ymin: 0, ymax: 1.1, pad: { t: Kk.t }, xlabel: 's after the stimulus', ylabel: 'signal at the cord', xfmt: v => v.toFixed(1), yfmt: () => '' }).frame();
      P.clip(() => fs.forEach(f => { const a = arrival(p, f); if (!isFinite(a)) return; const pts = []; for (let i = 0; i <= 400; i++) { const t = i / 200; pts.push([t, (f === 'C' ? 0.35 : 1) * Math.exp(-Math.pow((t - a) / (f === 'C' ? 0.12 : 0.012), 2))]); } P.line(pts, FIBRES[f].col, 2.2); P.tag(a, f === 'C' ? 0.42 : 1.03, fmtMs(a), FIBRES[f].col, 'left', 0); }));
      Kk.draw(P); return;
    }
    if (p.setup === 'processing') {
      const C = S.choice, m = C.reduce((u, q) => u + q.rt, 0) / C.length, Kk = K.plotKey(g, [{ c: '#8FD4FA', label: 'each trial', dot: true }, { c: '#FFD66B', label: 'mean', dash: [4, 3] }, { c: '#FF8A80', label: 'wrong button', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: C.length + 1, ymin: 0, ymax: Math.max(0.8, ...C.map(q => q.rt)) * 1.1, pad: { t: Kk.t }, xlabel: 'trial', ylabel: 's', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { C.forEach((q, i) => P.dot(i + 1, q.rt, 4, q.wrong ? '#FF8A80' : '#8FD4FA')); P.hline(m, '#FFD66B', [4, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'reflex') {
      const T = reflexTimes(p), Kk = K.plotKey(g, [{ c: '#9FE0B8', label: 'reflex kick (leg angle)' }, { c: '#FFB35C', label: 'kick on purpose', dash: [4, 3] }, { c: 'rgba(201,212,234,.6)', label: 'felt', dash: [2, 3] }]);
      const P = g.Plot({ xmin: 0, xmax: 0.5, ymin: 0, ymax: 40, pad: { t: Kk.t }, xlabel: 's after the tap', ylabel: 'degrees', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(0) }).frame();
      const kick = (t0, g0) => { const pts = []; for (let t = 0; t <= 0.5; t += 0.002) pts.push([t, t < t0 ? 0 : 18 * g0 * Math.sin(Math.min(Math.PI, (t - t0) / 0.15 * Math.PI))]); return pts; };
      P.clip(() => { P.line(kick(T.reflex, T.gain), '#9FE0B8', 2.4); if (isFinite(T.voluntary)) P.line(kick(T.voluntary, 1.6), '#FFB35C', 1.8, [4, 3]); if (isFinite(T.felt)) P.vline(T.felt, 'rgba(201,212,234,.6)', [2, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'memory') {
      if (p.mexp === 'forget') {
        const Fr = S.forget, Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'kept, with your reviews' }, { c: 'rgba(201,212,234,.5)', label: 'no reviews (Ebbinghaus)', dash: [4, 3] }, { c: '#8FB4FF', label: 'Ebbinghaus 1885', dot: true }]);
        const P = g.Plot({ xmin: 0, xmax: Math.log10(60 * 24 * 60), ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'time since learning (log)', ylabel: '% kept', xticks: [0, 1, 2, 3, 4, 5], xfmt: v => ['1 min', '10 min', '1.7 h', '17 h', '7 d', '69 d'][Math.round(v)], yfmt: v => v.toFixed(0) }).frame();
        P.clip(() => { const xs = []; for (let l = 0; l <= Math.log10(60 * 24 * 60); l += 0.02) xs.push(l); P.line(xs.map(l => [l, ebb(Math.pow(10, l) / (p.meaning ? MEANING : 1)) * 100]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(xs.map(l => [l, Fr.at(Math.pow(10, l)) * 100]), '#FFD66B', 2.4); [[20, 58.2], [60, 44.2], [526, 35.8], [1440, 33.7], [2880, 27.8], [8640, 25.4], [44640, 21.1]].forEach(q => P.dot(Math.log10(q[0]), q[1], 3.5, '#8FB4FF')); });
        Kk.draw(P); return;
      }
      const L0 = S.list, N = L0.words.length, Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'expected' }, { c: '#8FB4FF', label: 'this list', dot: true }, { c: 'rgba(201,212,234,.5)', label: 'after 30 s of counting', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 0.5, xmax: N + 0.5, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'position in the list', ylabel: '% recalled', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const d30 = Object.assign({}, p, { delay: 30 }); P.line(L0.words.map((_, i) => [i + 1, pRecall(d30, i, N) * 100]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); P.line(L0.words.map((_, i) => [i + 1, pRecall(p, i, N) * 100]), '#FFD66B', 2.4); L0.rec.forEach((r, i) => P.dot(i + 1, r ? 100 : 0, 3.5, r ? '#9FE0B8' : '#FF8A80')); });
      Kk.draw(P); return;
    }
    const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'your stages' }, { c: '#8FD4FA', label: 'ball’s flight', dash: [4, 3] }]);
    const sp = []; for (let v = 10; v <= 160; v += 2) sp.push(v);
    const P = g.Plot({ xmin: 10, xmax: 160, ymin: 0, ymax: 1.5, pad: { t: Kk.t }, xlabel: 'throw, km/h', ylabel: 's', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
    P.clip(() => { P.hline(budget(p).total, '#FFD66B', [0, 0]); P.line(sp.map(v => [v, p.dist / (v / 3.6) * (p.view === 'late' ? 0.6 : 1)]), '#8FD4FA', 2.2, [4, 3]); P.dot(p.speed, flightOf(p) * (p.view === 'late' ? 0.6 : 1), 5.5, '#8FD4FA', '#0B0F18'); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'receptors') {
      const ks = Object.keys(SITES), Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'two-point threshold, mm', box: true }, { c: '#8FD4FA', label: 'fields per cm² (right, ÷10)', dot: true }]);
      const P = g.Plot({ xmin: -0.6, xmax: ks.length - 0.4, ymin: 0, ymax: 50, pad: { t: Kk.t }, xticks: ks.map((_, i) => i), xfmt: i => (ks[Math.round(i)] || ''), ylabel: 'mm', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => ks.forEach((k, i) => { P.bar(i, SITES[k].T, 0.3, 0, k === p.site ? '#FFD66B' : 'rgba(255,214,107,.4)'); P.dot(i, Math.min(49, density(k) / 10), 4.5, '#8FD4FA'); }));
      Kk.draw(P); return;
    }
    if (p.setup === 'pathway') {
      const Kk = K.plotKey(g, Object.keys(FIBRES).map(f => ({ c: FIBRES[f].col, label: FIBRES[f].name.split(' (')[0] })));
      const P = g.Plot({ xmin: 15, xmax: 37, ymin: 0, ymax: 2.5, pad: { t: Kk.t }, xlabel: 'limb temperature, °C', ylabel: 's to the brain', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { Object.keys(FIBRES).forEach(f => { const pts = []; for (let T = 15; T <= 37; T += 0.5) pts.push([T, Math.min(2.5, arrival(Object.assign({}, p, { limbT: T }), f))]); P.line(pts, FIBRES[f].col, 2); }); P.vline(p.limbT, 'rgba(201,212,234,.5)', [3, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'processing') {
      const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'Hick: 0.2 + b·log₂(n+1)' }, { c: 'rgba(201,212,234,.5)', label: 'compatible / practised', dash: [4, 3] }, { c: '#8FB4FF', label: 'your mean', dot: true }]);
      const P = g.Plot({ xmin: 0, xmax: 3.6, ymin: 0, ymax: 1, pad: { t: Kk.t }, xlabel: 'bits = log₂(choices + 1)', ylabel: 's', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(1) }).frame();
      P.clip(() => { const ns = []; for (let n = 1; n <= 10; n++) ns.push(n); P.line(ns.map(n => [Math.log2(n + 1), hickRT(Object.assign({}, p, { compat: false, practice: 1 }), n)]), '#FFD66B', 2.4); P.line(ns.map(n => [Math.log2(n + 1), hickRT(Object.assign({}, p, { compat: true }), n)]), 'rgba(201,212,234,.5)', 1.3, [4, 3]); const C = S.choice; P.dot(Math.log2(Math.round(p.n) + 1), C.reduce((u, q) => u + q.rt, 0) / C.length, 5.5, '#8FB4FF', '#0B0F18'); });
      Kk.draw(P); return;
    }
    if (p.setup === 'reflex') {
      const Kk = K.plotKey(g, [{ c: '#9FE0B8', label: 'reflex' }, { c: 'rgba(201,212,234,.6)', label: 'felt' }, { c: '#FFB35C', label: 'on purpose' }]);
      const P = g.Plot({ xmin: 120, xmax: 200, ymin: 0, ymax: 0.4, pad: { t: Kk.t }, xlabel: 'height, cm', ylabel: 's', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => { const hs = []; for (let h = 120; h <= 200; h += 2) hs.push(h); P.line(hs.map(h => [h, reflexTimes(Object.assign({}, p, { height: h })).reflex]), '#9FE0B8', 2.4); if (!p.cut) { P.line(hs.map(h => [h, reflexTimes(Object.assign({}, p, { height: h })).felt]), 'rgba(201,212,234,.6)', 1.6); P.line(hs.map(h => [h, reflexTimes(Object.assign({}, p, { height: h })).voluntary]), '#FFB35C', 2); } P.vline(p.height, 'rgba(201,212,234,.4)', [3, 3]); });
      Kk.draw(P); return;
    }
    if (p.setup === 'memory') {
      if (p.mexp === 'forget') { const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'kept after 30 days, %' }]); const P = g.Plot({ xmin: 0, xmax: 5, ymin: 0, ymax: 100, pad: { t: Kk.t }, xlabel: 'reviews', ylabel: '%', xticks: [0, 1, 2, 3, 4, 5], xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame(); P.clip(() => { for (let k = 0; k <= 5; k++) { const v = forgetRun(Object.assign({}, p, { reviews: k })).at(30 * 24 * 60) * 100; P.bar(k, v, 0.3, 0, k === Math.round(p.reviews) ? '#FFD66B' : 'rgba(255,214,107,.4)'); } }); Kk.draw(P); return; }
      const Kk = K.plotKey(g, [{ c: '#FF8A80', label: 'the lure “sleep”', box: true }, { c: '#9FE0B8', label: 'words really on the list', box: true }]);
      const P = g.Plot({ xmin: -0.6, xmax: 1.6, ymin: 0, ymax: 100, pad: { t: Kk.t }, xticks: [0, 1], xfmt: i => ['list words (mean)', 'never shown: “sleep”'][Math.round(i)] || '', ylabel: '% recalled', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { const N = Math.round(p.N), m = Array.from({ length: N }, (_, i) => pRecall(p, i, N)).reduce((u, v) => u + v, 0) / N; P.bar(0, m * 100, 0.3, 0, '#9FE0B8'); P.bar(1, p.list === 'drm' ? LURE_P * 100 : 0, 0.3, 0, '#FF8A80'); });
      Kk.draw(P); return;
    }
    const Kk = K.plotKey(g, [{ c: '#FFD66B', label: 'your practice' }, { c: 'rgba(201,212,234,.5)', label: 'beginner · expert', dash: [4, 3] }]);
    const sp = []; for (let v = 10; v <= 160; v += 2) sp.push(v);
    const P = g.Plot({ xmin: 10, xmax: 160, ymin: 0, ymax: 105, pad: { t: Kk.t }, xlabel: 'throw, km/h', ylabel: '% caught', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(0) }).frame();
    P.clip(() => { [0, 1].forEach(s => P.line(sp.map(v => [v, pCatch(Object.assign({}, p, { speed: v, skill: s })) * 100]), 'rgba(201,212,234,.5)', 1.3, [4, 3])); P.line(sp.map(v => [v, pCatch(Object.assign({}, p, { speed: v })) * 100]), '#FFD66B', 2.4); P.dot(p.speed, pCatch(p) * 100, 5.5, '#FFD66B', '#0B0F18'); });
    Kk.draw(P);
  }

  /* ============================================================
     READOUTS, EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'receptors') { const T = S.touch, yes = T.filter(Boolean).length; return p.tmode === 'weight' ? [
      { label: 'Held', value: p.base + ' → ' + (p.base + p.added), unit: 'g' },
      { label: 'JND = 0.05 × load', value: (WEBER * p.base).toFixed(1), unit: 'g', flag: 'accent', hint: 'Weber’s law' },
      { label: 'Right, expected', value: Math.round((0.5 + 0.5 * (2 * pHeavier(p.base, p.added, vol(p)) - 1)) * 100), unit: '%' },
      { label: 'Right, your trials', value: Math.round(yes / T.length * 100), unit: '%', hint: yes + ' of ' + T.length },
      { label: 'Receptor firing', value: firing(p.base / 20, false, 0).toFixed(0), unit: '/s', hint: '∝ log of the pressure' },
      { label: 'This volunteer’s JND', value: (WEBER * vol(p) * p.base).toFixed(1), unit: 'g', hint: 'volunteer ' + Math.round(p.seed) }] : [
      { label: 'Two-point threshold', value: SITES[p.site].T, unit: 'mm', flag: 'accent', hint: 'Weinstein 1968' },
      { label: 'Receptive fields apart', value: fieldSpacing(p.site).toFixed(1), unit: 'mm', hint: '≈ threshold ÷ 1.6' },
      { label: 'Fields per cm²', value: dens(p.site), hint: 'fingertip ≈ ' + dens('finger') },
      { label: 'Felt as two, expected', value: Math.round(pTwo(p.site, p.sep, vol(p)) * 100), unit: '%' },
      { label: 'Felt as two, your trials', value: Math.round(yes / T.length * 100), unit: '%', hint: yes + ' of ' + T.length },
      { label: 'This volunteer’s threshold', value: (SITES[p.site].T * vol(p)).toFixed(1), unit: 'mm', hint: 'volunteer ' + Math.round(p.seed) }]; }
    if (p.setup === 'pathway') return STIM[p.stim].map(f => ({ label: FIBRES[f].name.split(' (')[0] + ' at the brain', value: fmtMs(arrival(p, f)), flag: f === 'C' ? 'warn' : 'accent', hint: FIBRES[f].name.replace(/.*\(/, '(') })).concat([{ label: 'Path length', value: ((ROUTE[p.from].limb + ROUTE[p.from].cord) * p.height / 170).toFixed(2), unit: 'm' }, { label: 'Synapses on the way', value: '2', hint: 'cord, thalamus' }]);
    if (p.setup === 'processing') { const C = S.choice, m = C.reduce((u, q) => u + q.rt, 0) / C.length; return [
      { label: 'Choices', value: String(Math.round(p.n)), hint: Math.log2(Math.round(p.n) + 1).toFixed(2) + ' bits' },
      { label: 'Hick RT = a + b·log₂(n+1)', value: Math.round(hickRT(p, Math.round(p.n)) * 1000), unit: 'ms', flag: 'accent' },
      { label: 'Your mean', value: Math.round(m * 1000), unit: 'ms' },
      { label: 'b (per bit)', value: Math.round((hickRT(p, 1) - HICK.a) * 1000), unit: 'ms', hint: p.compat ? 'compatible mapping' : 'Hick: ~150' },
      { label: 'Errors', value: String(C.filter(q => q.wrong).length), unit: 'of ' + C.length }]; }
    if (p.setup === 'reflex') { const T = reflexTimes(p); return [
      { label: 'Reflex latency', value: fmtMs(T.reflex), flag: 'accent', hint: 'through the cord only' },
      { label: 'Felt at the brain', value: fmtMs(T.felt), hint: p.cut ? 'cord cut' : 'after the kick' },
      { label: 'Voluntary kick', value: fmtMs(T.voluntary), flag: p.cut ? 'crit' : 'warn' },
      { label: 'Reflex ÷ voluntary', value: isFinite(T.voluntary) ? (T.reflex / T.voluntary * 100).toFixed(0) : '—', unit: '%' },
      { label: 'Kick size', value: (18 * T.gain).toFixed(0), unit: '°', hint: p.jend ? 'reinforced' : '' }]; }
    if (p.setup === 'memory') { if (p.mexp === 'forget') { const Fr = S.forget; return [
      { label: 'After 20 min', value: Math.round(Fr.at(20) * 100), unit: '%', hint: 'Ebbinghaus 58 %' },
      { label: 'After 1 day', value: Math.round(Fr.at(1440) * 100), unit: '%', hint: 'Ebbinghaus 34 %' },
      { label: 'After 30 days', value: Math.round(Fr.at(43200) * 100), unit: '%', flag: 'accent' },
      { label: 'Reviews', value: String(Math.round(p.reviews)), hint: p.gap + ' h apart' }]; }
      const L0 = S.list; return [
      { label: 'Recalled', value: L0.rec.filter(Boolean).length, unit: 'of ' + L0.words.length, flag: 'accent' },
      { label: 'First 3', value: L0.rec.slice(0, 3).filter(Boolean).length, unit: 'of 3', hint: 'primacy' },
      { label: 'Last 3', value: L0.rec.slice(-3).filter(Boolean).length, unit: 'of 3', hint: p.delay >= 20 ? 'recency gone' : 'recency' },
      { label: 'False “sleep”', value: p.list === 'drm' ? (L0.lure ? 'yes' : 'no') : '—', flag: L0.lure ? 'crit' : '', hint: 'expected ~44 %' }]; }
    const B = budget(p), fl = flightOf(p); return [
      { label: 'Flight time = d ÷ v', value: fmtMs(fl), hint: p.dist + ' m at ' + (p.speed / 3.6).toFixed(1) + ' m/s' },
      { label: 'Your stages', value: fmtMs(B.total), flag: 'accent' },
      { label: 'Margin', value: Math.round((fl * (p.view === 'late' ? 0.6 : 1) - B.total) * 1000), unit: 'ms', flag: fl * (p.view === 'late' ? 0.6 : 1) > B.total ? 'ok' : 'crit' },
      { label: 'Chance of a catch', value: Math.round(pCatch(p) * 100), unit: '%' },
      { label: 'Deciding', value: Math.round((B.st[2][1] + B.st[3][1]) * 1000), unit: 'ms', hint: 'practice shrinks it' }];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'receptors') return p.tmode === 'weight' ? E.frac('Δ' + E.v('I'), E.v('I')) + ' ' + E.op('=') + ' ' + E.v('k') + ' ' + E.op('≈') + ' 0.05  →  Δ' + E.v('I') + ' ' + E.op('=') + ' 0.05 × ' + E.n(p.base, 'g') + ' ' + E.op('=') + ' ' + E.n((WEBER * p.base).toFixed(1), 'g') : 'two points feel like two when they fall on different receptive fields: threshold ' + E.op('≈') + ' 1.6 × spacing ' + E.op('=') + ' 1.6 × ' + E.n(fieldSpacing(p.site).toFixed(1), 'mm') + ' ' + E.op('=') + ' ' + E.n(SITES[p.site].T, 'mm');
    if (p.setup === 'pathway') return E.v('t') + ' ' + E.op('=') + ' ' + E.frac(E.v('L'), E.v('v')) + ' + synapses:  ' + STIM[p.stim].map(f => FIBRES[f].name.split(' (')[0] + ' ' + fmtMs(arrival(p, f))).join(',  ');
    if (p.setup === 'processing') return E.v('RT') + ' ' + E.op('=') + ' ' + E.v('a') + ' + ' + E.v('b') + ' log₂(' + E.v('n') + ' + 1) ' + E.op('=') + ' 0.20 + ' + (hickRT(p, 1) - HICK.a).toFixed(3) + ' × ' + Math.log2(Math.round(p.n) + 1).toFixed(2) + ' ' + E.op('=') + ' ' + E.n(hickRT(p, Math.round(p.n)).toFixed(3), 's');
    if (p.setup === 'reflex') { const T = reflexTimes(p); return E.v('t') + E.sub('reflex') + ' ' + E.op('=') + ' ' + E.frac(E.v('L') + E.sub('in'), E.v('v')) + ' + synapse + ' + E.frac(E.v('L') + E.sub('out'), E.v('v')) + ' + muscle ' + E.op('=') + ' ' + E.n(fmtMs(T.reflex), '') + '   ·   voluntary adds the brain: ' + E.n(fmtMs(T.voluntary), ''); }
    if (p.setup === 'memory') return p.mexp === 'forget' ? E.v('b') + ' ' + E.op('=') + ' ' + E.frac('1.84', '(log ' + E.v('t') + ')<sup>1.25</sup> + 1.84') + '   (Ebbinghaus 1885, ' + E.v('t') + ' in minutes) ' + E.op('→') + ' ' + E.n(Math.round(S.forget.at(1440) * 100), '%') + ' after a day' : E.v('P') + '(' + E.v('i') + ') ' + E.op('=') + ' asymptote + primacy·' + E.v('e') + '<sup>−i/2.2</sup> + recency·' + E.v('e') + '<sup>−(N−i)/1.8</sup>·' + E.v('e') + '<sup>−delay/10 s</sup>';
    return E.v('t') + E.sub('flight') + ' ' + E.op('=') + ' ' + E.frac(E.v('d'), E.v('v')) + ' ' + E.op('=') + ' ' + E.frac(E.n(p.dist, 'm'), E.n((p.speed / 3.6).toFixed(1), 'm/s')) + ' ' + E.op('=') + ' ' + E.n(fmtMs(flightOf(p)), '') + ' ' + (flightOf(p) * (p.view === 'late' ? 0.6 : 1) > budget(p).total ? E.op('>') : E.op('<')) + ' stages ' + E.n(fmtMs(budget(p).total), '');
  }
  const EQ_NOTE = S => {
    const p = S.p;
    if (p.setup === 'receptors') return 'A receptor only tells the brain “something here”. Two points feel like two only if they excite different receptors, so the fingertip, crowded with them, resolves 2–3 mm and the back about 4 cm. Weber: the brain compares by ratio, so the difference you notice grows with what you already hold.';
    if (p.setup === 'pathway') return 'Every signal is the same kind of impulse; what differs is the fibre. Thick myelinated fibres carry touch at ~50 m/s; thin ones carry the sharp first pain at ~15 m/s; bare C fibres bring the dull second pain at ~1 m/s — up to a second later from the toe. Cold and lost myelin slow them all.';
    if (p.setup === 'processing') return 'Each doubling of the choices adds the same time (one bit, ~150 ms): the brain is narrowing down possibilities. A button right under its light, or a lot of practice, makes the choice nearly free.';
    if (p.setup === 'reflex') return 'A reflex goes receptor → sensory neuron → spinal cord → motor neuron → muscle and never waits for the brain. The brain hears about it afterwards. Cut the cord above and the reflex still works — the person just does not feel it, and cannot kick on purpose.';
    if (p.setup === 'memory') return 'Memory is rebuilt each time, not played back. First words get rehearsed most; the last are still in mind unless a delay pushes them out; words that fit a theme can be “remembered” although they were never there. Forgetting is steep at first, then slow — and every review after some forgetting makes a memory last longer.';
    return 'Catching joins everything: receptors in the eye, nerves to the brain, a choice made faster by memory of past throws, signals down the cord to the arm. The ball does not wait: what can be caught is set by the slowest link.';
  };

  /* ============================================================
     DRAGGING
     ============================================================ */
  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }
  function onDrag(S, e) {
    if (e.id === 'sep' && S._sepK) { S.p.sep = Math.round(clamp(S.p.sep + 2 * e.dx / S._sepK, 0.5, 60) * 2) / 2; this.setup(S); }   // the right tip moves half the change: the pair is centred
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const R_ = true;
  L.register({
    id: 'g6b-senses',
    grade: 6, unit: '6B', topics: ['B6'],
    subject: 'biology',
    name: 'Stimulus, Signal, Response, Memory',
    chapter: 'Cells, Bodies and Senses',
    exams: ['NGSS MS-LS1-8', 'CAST'],
    weight: 'Senses',
    is3D: true,
    autoplay: true,
    bloom: 0.06,
    stageHint: 'Drag the bench to look round it · with the caliper, drag its right tip on the skin map · on a phone, tap a chip to open its card',
    lede: 'Find how fine your <b>touch</b> is with a two-point caliper, and how much weight you must add before you notice. Race touch, sharp pain and dull pain up a leg at their real <b>speeds</b>. ' +
      'Time a <b>choice</b> as the options double. Tap a knee and see a <b>reflex</b> beat the brain. Learn a list and watch <b>memory</b> keep, lose — and invent. Then catch a ball and add up every stage.',

    params: preset({}),
    presets: [
      { name: 'Two points 3 mm apart on a fingertip', params: preset({ site: 'finger', sep: 3 }) },
      { name: 'The same 3 mm on the forearm', params: preset({ site: 'forearm', sep: 3 }) },
      { name: 'Weber: 10 g added to 50 g', params: preset({ tmode: 'weight', base: 50, added: 10 }) },
      { name: 'Weber: 10 g added to 1 kg', params: preset({ tmode: 'weight', base: 1000, added: 10 }) },
      { name: 'Stub a toe: first and second pain', params: preset({ setup: 'pathway', from: 'toe', stim: 'prick' }) },
      { name: 'A cold foot at 20 °C', params: preset({ setup: 'pathway', from: 'toe', stim: 'prick', limbT: 20 }) },
      { name: 'Myelin damaged (multiple sclerosis)', params: preset({ setup: 'pathway', from: 'toe', stim: 'touch', demy: 60 }) },
      { name: 'One light, one button', params: preset({ setup: 'processing', n: 1 }) },
      { name: 'Eight lights', params: preset({ setup: 'processing', n: 8 }) },
      { name: 'Eight, button under its light', params: preset({ setup: 'processing', n: 8, compat: true }) },
      { name: 'Knee jerk', params: preset({ setup: 'reflex', rx: 'knee' }) },
      { name: 'Spinal cord cut above', params: preset({ setup: 'reflex', rx: 'knee', cut: true }) },
      { name: 'Hand on a hot plate', params: preset({ setup: 'reflex', rx: 'withdraw' }) },
      { name: 'A 15-word list, recall at once', params: preset({ setup: 'memory', mexp: 'list', delay: 0 }) },
      { name: 'Count backwards 30 s first', params: preset({ setup: 'memory', mexp: 'list', delay: 30 }) },
      { name: 'Words about sleep (false memory)', params: preset({ setup: 'memory', mexp: 'list', list: 'drm' }) },
      { name: 'Ebbinghaus: no reviews', params: preset({ setup: 'memory', mexp: 'forget', reviews: 0 }) },
      { name: 'Three reviews a day apart', params: preset({ setup: 'memory', mexp: 'forget', reviews: 3, gap: 24 }) },
      { name: 'A gentle throw: 30 km/h', params: preset({ setup: 'together', speed: 30 }) },
      { name: 'A cricket ball: 130 km/h', params: preset({ setup: 'together', speed: 130, dist: 18 }) },
      { name: 'Too fast, too close: 110 km/h from 7 m', params: preset({ setup: 'together', speed: 110, dist: 7 }) },
      { name: 'Same throw, hand at your side, distracted', params: preset({ setup: 'together', speed: 110, dist: 7, hand: 'down', distract: true }) },
      { name: 'Same throw, seen only late, but expert', params: preset({ setup: 'together', speed: 110, dist: 7, view: 'late', skill: 1 }) },
      { name: 'Two points 40 mm apart on the back', params: preset({ site: 'back', sep: 40 }) },
      { name: 'Upper lip at 6 mm', params: preset({ site: 'lip', sep: 6 }) },
      { name: 'Meaningful verse, reviewed once', params: preset({ setup: 'memory', mexp: 'forget', meaning: true, reviews: 1, gap: 24 }) }
    ],

    controls: [
      { group: 'Set-up', items: [{ key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS }] },
      { group: 'The touch test', when: is('receptors'), items: [
        { key: 'tmode', type: 'select', label: 'Test', restructure: R_, rebuild: true, options: [{ value: 'twopoint', label: 'two-point caliper' }, { value: 'weight', label: 'weights (Weber)' }] },
        { key: 'site', type: 'select', label: 'Where', restructure: R_, options: Object.keys(SITES).map(k => ({ value: k, label: SITES[k].name })) },
        { key: 'sep', label: 'Caliper points apart', min: 0.5, max: 60, step: 0.5, unit: 'mm', restructure: R_, when: S => S.p.tmode !== 'weight' },
        { key: 'base', label: 'First weight', min: 20, max: 1000, step: 10, unit: 'g', restructure: R_, when: S => S.p.tmode === 'weight' },
        { key: 'added', label: 'Added to the second', min: 0, max: 200, step: 1, unit: 'g', restructure: R_, when: S => S.p.tmode === 'weight' },
        { key: 'trials', label: 'Trials', min: 10, max: 40, step: 1, restructure: R_ },
        { key: 'seed', label: 'Another volunteer', min: 1, max: 9, step: 1, restructure: R_ }] },
      { group: 'The signal', when: is('pathway'), items: [
        { key: 'stim', type: 'select', label: 'Stimulus', restructure: R_, options: [{ value: 'touch', label: 'light touch' }, { value: 'prick', label: 'pin prick' }, { value: 'heat', label: 'hot probe' }] },
        { key: 'from', type: 'select', label: 'On the', restructure: R_, options: Object.keys(ROUTE).map(k => ({ value: k, label: ROUTE[k].name })) },
        { key: 'height', label: 'Height', min: 120, max: 200, step: 1, unit: 'cm', restructure: R_ },
        { key: 'limbT', label: 'Limb temperature', min: 15, max: 37, step: 0.5, unit: '°C', restructure: R_ },
        { key: 'demy', label: 'Myelin lost', min: 0, max: 90, step: 5, unit: '%', restructure: R_ }] },
      { group: 'The choice', when: is('processing'), items: [
        { key: 'n', label: 'Lights and buttons', min: 1, max: 10, step: 1, restructure: R_ },
        { key: 'compat', type: 'toggle', label: 'Button right under its light', restructure: R_ },
        { key: 'practice', label: 'Practice sessions', min: 1, max: 10, step: 1, restructure: R_ },
        { key: 'ctrials', label: 'Trials', min: 10, max: 40, step: 1, restructure: R_ }] },
      { group: 'The reflex', when: is('reflex'), items: [
        { key: 'rx', type: 'select', label: 'Reflex', restructure: R_, options: [{ value: 'knee', label: 'knee jerk' }, { value: 'withdraw', label: 'withdrawal from heat' }] },
        { key: 'height', label: 'Height', min: 120, max: 200, step: 1, unit: 'cm', restructure: R_ },
        { key: 'jend', type: 'toggle', label: 'Clench the hands (Jendrassik)', restructure: R_ },
        { key: 'cut', type: 'toggle', label: 'Spinal cord cut above', restructure: R_ }] },
      { group: 'The memory test', when: is('memory'), items: [
        { key: 'mexp', type: 'select', label: 'Test', restructure: R_, rebuild: true, options: [{ value: 'list', label: 'learn a list' }, { value: 'forget', label: 'forgetting over weeks' }] },
        { key: 'list', type: 'select', label: 'List', restructure: R_, when: S => S.p.mexp === 'list', options: [{ value: 'random', label: 'unrelated words' }, { value: 'drm', label: 'words about sleep' }] },
        { key: 'N', label: 'Words', min: 8, max: 30, step: 1, restructure: R_, when: S => S.p.mexp === 'list' },
        { key: 'rate', label: 'Seconds per word', min: 0.5, max: 4, step: 0.5, unit: 's', restructure: R_, when: S => S.p.mexp === 'list' },
        { key: 'delay', label: 'Counting backwards before recall', min: 0, max: 30, step: 1, unit: 's', restructure: R_, when: S => S.p.mexp === 'list' },
        { key: 'reviews', label: 'Reviews', min: 0, max: 5, step: 1, restructure: R_, when: S => S.p.mexp === 'forget' },
        { key: 'gap', label: 'Hours between reviews', min: 1, max: 96, step: 1, unit: 'h', restructure: R_, when: S => S.p.mexp === 'forget' },
        { key: 'meaning', type: 'toggle', label: 'Meaningful material (not nonsense)', restructure: R_, when: S => S.p.mexp === 'forget' },
        { key: 'seed', label: 'Another volunteer', min: 1, max: 9, step: 1, restructure: R_, when: S => S.p.mexp === 'list' }] },
      { group: 'The throw', when: is('together'), items: [
        { key: 'speed', label: 'Throw', min: 10, max: 160, step: 1, unit: 'km/h', restructure: R_ },
        { key: 'dist', label: 'Distance', min: 3, max: 20, step: 0.5, unit: 'm', restructure: R_ },
        { key: 'skill', label: 'Practice (memory of past throws)', min: 0, max: 1, step: 0.05, restructure: R_, fmt: v => Math.round(v * 100) + ' %' },
        { key: 'distract', type: 'toggle', label: 'Distracted', restructure: R_ },
        { key: 'view', type: 'select', label: 'You see', restructure: R_, options: [{ value: 'all', label: 'the whole flight' }, { value: 'late', label: 'only the last 60 %' }] },
        { key: 'hand', type: 'select', label: 'Hand', restructure: R_, options: [{ value: 'ready', label: 'up and ready' }, { value: 'down', label: 'at your side' }] }] }
    ],

    setup, step, drawStage, onPointer, onDrag,
    plots: [
      { title: S => ({ receptors: S.p.tmode === 'weight' ? 'Telling the heavier one' : 'One point or two: the psychometric curve', pathway: 'What reaches the spinal cord, and when', processing: 'Each trial’s reaction time', reflex: 'The leg after the tap', memory: S.p.mexp === 'forget' ? 'The forgetting curve' : 'Recall by position in the list', together: 'The ball’s flight against your stages' })[S.p.setup], draw: plot1 },
      { title: S => ({ receptors: 'Thresholds and receptor density, site by site', pathway: 'Arrival against limb temperature', processing: 'Hick’s law: time against bits', reflex: 'Times against body size', memory: S.p.mexp === 'forget' ? 'Kept after 30 days, by number of reviews' : 'Words recalled — and one that was never there', together: 'Chance of a catch against speed' })[S.p.setup], draw: plot2 }
    ],
    readouts,
    equation,
    eqNote: EQ_NOTE,

    problems: [
      { source: 'CAST pattern · analysing data', params: preset({ tmode: 'weight', base: 400, added: 10 }),
        q: 'Weber found the smallest change in a lifted weight a person notices is about 5 % of the weight. Holding 400 g, what is the smallest extra weight they will notice?',
        predict: { label: 'Just-noticeable difference', unit: 'g', tol: 0.02 },
        measure: S => WEBER * S.p.base,
        working: '5 % of 400 g = <b>20 g</b>. On 50 g, just 2.5 g would do — the brain compares by ratio, not by difference.' },
      { source: 'CAST pattern · using mathematics', params: preset({ setup: 'pathway', from: 'toe', stim: 'prick', height: 170, limbT: 37 }),
        q: 'Dull pain travels in C fibres at about 1 m/s. From the big toe to the brain is about 1.45 m. Roughly how long after stubbing the toe does the dull pain arrive?',
        predict: { label: 'Dull pain arrives', unit: 's', tol: 0.03 },
        measure: S => arrival(S.p, 'C'),
        working: 't = 1.45 m ÷ 1 m/s ≈ <b>1.45 s</b> — while the sharp first pain (Aδ, 15 m/s) arrived after about a tenth of a second.' },
      { source: 'CAST pattern · developing a model', params: preset({ setup: 'processing', n: 7, compat: false, practice: 1 }),
        q: 'Hick’s law: RT = 0.20 s + 0.15 s × log₂(n + 1). With 7 lights and buttons, what is the reaction time?',
        predict: { label: 'Reaction time', unit: 's', tol: 0.01 },
        measure: S => hickRT(S.p, Math.round(S.p.n)),
        working: 'log₂ 8 = 3 bits: 0.20 + 0.15 × 3 = <b>0.65 s</b> — three times the single-light 0.35 s.' },
      { source: 'CAST pattern · cause and effect', params: preset({ setup: 'reflex', rx: 'knee', height: 170 }),
        q: 'In a knee jerk the signal runs about 0.55 m to the spinal cord and 0.55 m back at 80 m/s, crosses one synapse (0.7 ms), and the muscle takes ~9 ms to start. What is the reflex time?',
        predict: { label: 'Reflex latency', unit: 'ms', tol: 0.04 },
        measure: S => reflexTimes(S.p).reflex * 1000,
        working: '1.1 m ÷ 80 m/s = 13.75 ms, + 0.7 + 9 ≈ <b>23 ms</b>. A kick on purpose takes ~0.2 s: the reflex never waits for the brain.' },
      { source: 'CAST pattern · analysing data', params: preset({ setup: 'together', speed: 90, dist: 10, skill: 0.3, distract: false, view: 'all', hand: 'ready' }),
        q: 'A ball is thrown at 90 km/h from 10 m. How long is it in the air?',
        predict: { label: 'Flight time', unit: 's', tol: 0.01 },
        measure: S => flightOf(S.p),
        working: '90 km/h = 25 m/s; 10 ÷ 25 = <b>0.40 s</b> — just enough for a practised catcher’s ~0.3 s of stages.' }
    ],

    walkthrough: [
      { title: 'Where is touch finest?', ask: 'Put two points 3 mm apart on a fingertip, then on the forearm. One point or two?', reveal: '<b>Two on the fingertip, one on the forearm.</b> The fingertip has ~40 receptive fields per cm²; the forearm under 1. Two points feel like two only if they fall on different receptors.', params: preset({ site: 'forearm', sep: 3 }) },
      { title: 'Weber’s law', ask: 'Add 10 g to 50 g, then to 1 kg. Can you tell in both cases?', reveal: '<b>Only with 50 g.</b> The difference you notice is ~5 % of what you hold: 2.5 g on 50 g, 50 g on 1 kg.', params: preset({ tmode: 'weight', base: 1000, added: 10 }) },
      { title: 'First pain, second pain', ask: 'Stub your toe. Why does the ache come after the sharp pain?', reveal: '<b>Two kinds of fibre.</b> Thin myelinated Aδ fibres bring the sharp pain in ~0.1 s; bare C fibres bring the dull ache at 1 m/s — about 1.4 s from the toe.', params: preset({ setup: 'pathway', from: 'toe', stim: 'prick' }) },
      { title: 'Choosing takes time', ask: 'Go from 1 light to 8. How much slower are you?', reveal: '<b>About a third of a second slower</b> — 0.35 s → 0.68 s. Each doubling of the choices adds ~150 ms: the time goes into deciding, not into the nerves.', params: preset({ setup: 'processing', n: 8 }) },
      { title: 'Does a reflex go through the brain?', ask: 'Cut the spinal cord above the knee’s nerves and tap the knee. Does it kick?', reveal: '<b>Yes — even harder.</b> The arc runs receptor → spinal cord → muscle. The brain only hears about it later, and cannot now send a kick of its own.', params: preset({ setup: 'reflex', rx: 'knee', cut: true }) },
      { title: 'Is memory a recording?', ask: 'Learn the 15 words about sleep and write down all you can. Was “sleep” on the list?', reveal: '<b>No — but nearly half of people write it.</b> Memory rebuilds what fits the theme (Roediger & McDermott 1995).', params: preset({ setup: 'memory', mexp: 'list', list: 'drm' }) },
      { title: 'Can you catch it?', ask: 'A cricket ball at 130 km/h from 18 m. Is there time?', reveal: '<b>Yes.</b> 0.50 s of flight against ~0.28 s of stages. Now try 110 km/h from 7 m: 0.23 s. A beginner has no chance; an expert, hand up, judging from memory of past throws, catches it about half the time.', params: preset({ setup: 'together', speed: 130, dist: 18 }) }
    ],

    quiz: [
      { q: 'Two caliper points 5 mm apart feel like one point on the back because', options: ['both press inside the same receptive field', 'the back has no receptors', 'the brain ignores the back', 'skin on the back is thicker'], answer: 0, why: 'Receptors on the back are ~25 mm apart; both points excite the same one.' },
      { q: 'You feel a stubbed toe as a sharp pain and then a dull ache because', options: ['the signals travel in fibres of different speeds', 'the toe sends two separate injuries', 'the brain repeats the message', 'the ache comes from the heart'], answer: 0, why: 'Aδ fibres (~15 m/s) then C fibres (~1 m/s).' },
      { q: 'In the knee-jerk reflex, the signal goes', options: ['to the spinal cord and straight back to the muscle', 'to the brain and back', 'only along the skin', 'through the heart'], answer: 0, why: 'One synapse in the spinal cord. Cut the cord above and it still works.' },
      { q: 'With more choices to pick from, reaction time', options: ['rises by about the same amount each time the choices double', 'stays the same', 'falls', 'doubles each time one choice is added'], answer: 0, why: 'Hick’s law: time ∝ log₂(choices + 1).' },
      { q: 'Remembering a word that was never on a list shows that memory', options: ['is rebuilt from meaning, not replayed', 'is a perfect recording', 'stores only the first word', 'cannot hold words'], answer: 0, why: 'The DRM effect: the theme “sleep” is filled in.' }
    ],

    notes: '<p><b>Receptors</b> turn a stimulus into nerve impulses; each kind answers one stimulus (touch, pressure, vibration, heat, pain) and each covers a small patch of skin. The more receptors, the finer the sense.</p>' +
      '<p><b>Signals</b> travel along sensory neurons to the spinal cord and brain at speeds set by the fibre: up to ~100 m/s in thick myelinated fibres, ~1 m/s in bare ones.</p>' +
      '<p><b>The brain processes</b> the signal, decides, and sends a response down motor neurons to muscles. Deciding takes most of the time.</p>' +
      '<p><b>Reflexes</b> are automatic responses that go through the spinal cord without waiting for the brain; voluntary responses go through the brain and are slower.</p>' +
      '<p><b>Memory</b> stores information so it can change later responses; it fades fast and then slowly, is strengthened by spaced practice, and is rebuilt each time it is recalled.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Reflexes pass through the brain”, “the hand does the feeling”, and “memory is a recording”. Reflexes are answered in the spinal cord; the hand only detects — feeling happens in the brain; and memory rebuilds, sometimes adding what was never there.</div>'
  });

  L.models = L.models || {};
  L.models['g6b-senses'] = { SITES, VOL, vol, fieldSpacing, density, pTwo, pHeavier, WEBER, touchTrials, firing, FIBRES, ROUTE, arrival, STIM, HICK, hickRT, choiceTrials, REFLEX, reflexTimes, pRecall, listRun, LURE_P, ebb, forgetRun, budget, flightOf, pCatch, BASE: () => preset({}) };
})(window.InsightLab);
