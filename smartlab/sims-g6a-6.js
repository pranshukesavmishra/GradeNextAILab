/* ============================================================
   GRADE 6 · UNIT A · SYSTEMS AND SUBSYSTEMS
   6A-6  The Fair Test — Variables, Evidence and Investigation Design
   (A5.2 Variables and fair tests; A5.5 Claim, evidence and reasoning;
   A5.6 Designing an investigation of a system)

   One apparatus, four investigations. A paper helicopter falls down a
   stairwell through two light gates. It autorotates: the spinning blades
   sweep a disc that the air must be pushed through, so the steady descent
   speed is √(2mg ÷ ρC·A) with A the disc of the blade length — heavier falls
   faster, longer blades slower, until long thin blades flutter and the
   rotor collapses. Every drop scatters a little (the release, the air).
     fair    — change one thing between two designs; the lab names what you
               changed, what you measured, what you held — and what changed
               anyway: longer blades cut from the same paper are heavier.
     trials  — two designs 5 % apart: how many drops before the difference is
               bigger than its own uncertainty?
     cer     — a class table of 24 helicopters: pick a claim and the evidence;
               the lab tests the claim against the rows you chose.
     design  — plan the question, the range, the steps and the repeats; the
               lab checks the plan, runs it, and shows what it could see.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.MEAS, R3, BENCH and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU, Camera } = L;
  const kit = () => window.KITMS, ME = () => window.MEAS;

  /* ============================================================
     THE HELICOPTER
     A strip of paper: two blades (length L, width w), a fold, a 7 cm body
     folded to thirds, paper clips (0.45 g) at its foot. Autorotating, the rotor
     is a drag disc of radius L, drag coefficient 1.2; the strip falls flat
     (drag 0.5 on a quarter of the disc) until the rotor spins up over its
     first 25 cm. A blade longer than about 3.2 widths (copy paper; stiffer
     card more, tissue less) cannot hold its shape: it flutters and the rotor
     loses up to 65 % of its drag. The tip moves 2.6 times as fast as the fall.
     ============================================================ */
  const G = 9.81, RHO = 1.2;
  const PAPER = { tissue: { gsm: 25, stiff: 0.35, name: 'tissue paper' }, copy: { gsm: 80, stiff: 1, name: 'copy paper' }, card: { gsm: 160, stiff: 4.5, name: 'thin card' } };
  const CLIP = 0.45e-3, CR = 1.2, C0 = 0.5, ZS = 0.25, LAMBDA = 2.6, BODY = 0.07, SCATTER = 0.07;   // the drag scatters 7 % drop to drop: the time about 3.5 %
  const BASE_D = { L: 8, w: 3, clips: 1, paper: 'copy', colour: 'white', extra: 0 };
  function heli(d) {
    const Lb = d.L / 100, wb = d.w / 100;
    const paperArea = 2 * wb * Lb + 2 * wb * 0.02 + BODY * 2 * wb;
    const m = PAPER[d.paper].gsm / 1000 * paperArea + d.clips * CLIP + (d.extra || 0);
    const ar = Lb / wb, arMax = 3.2 * Math.cbrt(PAPER[d.paper].stiff);
    const flutter = clamp((ar - arMax) / 1.5, 0, 1);
    const Cr = CR * (1 - 0.65 * flutter), A = Math.PI * Lb * Lb;
    return { m, A, Cr, flutter, vt: Math.sqrt(2 * m * G / (RHO * Cr * A)), Lb, wb, ar, arMax, paperArea };
  }
  /* one flight from rest over H: k scales the drag (this drop's release and air), up is rising air (m/s).
     With traj, the path every 0.02 s: [t, fallen, speed, turned]. */
  function flight(d, H, k, up, traj) {
    const h = heli(d), dt = 0.002;
    let z = 0, v = 0, t = 0, phi = 0;
    const out = traj ? [[0, 0, 0, 0]] : null;
    while (z < H && t < 30) {
      const s = 1 - Math.exp(-z / ZS), C = (C0 * (1 - s) + h.Cr * s) * (k || 1), Aeff = h.A * (0.25 + 0.75 * s);
      const vr = v + (up || 0), a = G - 0.5 * RHO * C * Aeff * vr * Math.abs(vr) / h.m;
      v += a * dt; z += v * dt; t += dt;
      phi += LAMBDA * Math.max(0, v) * s / Math.max(0.02, h.Lb) * dt;
      if (traj && t - out[out.length - 1][0] >= 0.02 - 1e-9) out.push([t, Math.min(z, H), v, phi]);
    }
    if (traj) out.push([t, H, v, phi]);
    return { t, v, h, traj: out };
  }
  function lcg(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function normal(r) { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const hashD = d => Math.round(d.L * 37 + d.w * 101 + d.clips * 997 + (d.paper === 'card' ? 3001 : d.paper === 'tissue' ? 7001 : 0) + (d.colour === 'red' ? 13 : d.colour === 'blue' ? 29 : 0) + (d.extra || 0) * 1e6);
  /* n drops of one design: the true time of each, what the gates read (1 ms), what a stopwatch reads
     (you drop it and start the watch: ± 0.03 s at the start, ± 0.045 s at the landing, shown to 0.01 s) */
  function drops(d, H, n, seed, o) {
    o = o || {};
    const r = lcg(seed * 7919 + hashD(d) + Math.round(H * 100)), h = heli(d), sd = SCATTER + 0.12 * h.flutter;
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = Math.max(0.6, 1 + sd * normal(r)), st = 0.03 * normal(r), sp = 0.045 * normal(r);
      const t = flight(d, H, k, o.up || 0).t;
      out.push({ t, k, gate: Math.round(t * 1000) / 1000, watch: Math.round(Math.max(0.1, t - st + sp) * 100) / 100 });
    }
    return out;
  }
  function stats(a) {
    if (!a.length) return { n: 0, mean: NaN, sd: NaN, se: NaN, min: NaN, max: NaN };
    const m = a.reduce((u, v) => u + v, 0) / a.length, sd = a.length > 1 ? Math.sqrt(a.reduce((u, v) => u + (v - m) ** 2, 0) / (a.length - 1)) : 0;
    return { n: a.length, mean: m, sd, se: sd / Math.sqrt(a.length), min: Math.min(...a), max: Math.max(...a) };
  }
  const readOf = (q, timing) => timing === 'gates' ? q.gate : q.watch;
  const UP_WINDOW = 0.1;                                   // an open window at the top: warm air rising up the stairwell, m/s

  /* ============================================================
     A5.2 — THE FAIR TEST
     ============================================================ */
  const VARS = {
    length: { name: 'blade length', unit: 'cm', key: 'L' }, width: { name: 'blade width', unit: 'cm', key: 'w' }, clips: { name: 'paper clips', unit: '', key: 'clips' },
    paper: { name: 'paper', unit: '', key: 'paper' }, colour: { name: 'blade colour', unit: '', key: 'colour' }
  };
  function designsOf(p) {
    const A = Object.assign({}, BASE_D), B = Object.assign({}, BASE_D), v = p.vary;
    if (v === 'length') { A.L = p.aL; B.L = p.bL; }
    if (v === 'width') { A.w = p.aW; B.w = p.bW; }
    if (v === 'clips') { A.clips = p.aC; B.clips = p.bC; }
    if (v === 'paper') { A.paper = p.aP; B.paper = p.bP; }
    if (v === 'colour') { A.colour = p.aCol; B.colour = p.bCol; }
    const mA = heli(A).m, mB = heli(B).m;
    if (p.balance && v !== 'clips' && Math.abs(mA - mB) > 1e-6) { if (mA < mB) A.extra = mB - mA; else B.extra = mA - mB; }
    return { A, B };
  }
  function fairOf(S) {
    const p = S.p, key = ['fair', p.vary, p.aL, p.bL, p.aW, p.bW, p.aC, p.bC, p.aP, p.bP, p.aCol, p.bCol, p.balance, p.windowB, p.trials, p.H, p.seed].join('|');
    if (S._fair && S._fair.key === key) return S._fair;
    const { A, B } = designsOf(p);
    const dA = drops(A, p.H, p.trials, p.seed), dB = drops(B, p.H, p.trials, p.seed + 11, { up: p.windowB ? UP_WINDOW : 0 });
    const hA = heli(A), hB = heli(B);
    // what else differs between A and B, beyond the variable chosen
    const also = [];
    if (Math.abs(hA.m - hB.m) / Math.min(hA.m, hB.m) > 0.02 && p.vary !== 'clips') also.push('mass ' + (hA.m * 1000).toFixed(2) + ' g against ' + (hB.m * 1000).toFixed(2) + ' g');
    if (p.windowB) also.push('B was dropped with the window open (air rising 0.1 m/s)');
    const nd = ['length', 'width', 'clips', 'paper', 'colour'].filter(k => k !== p.vary && JSON.stringify(A[VARS[k].key]) !== JSON.stringify(B[VARS[k].key]));
    nd.forEach(k => also.push(VARS[k].name));
    S._fair = { key, A, B, dA, dB, hA, hB, also };
    return S._fair;
  }

  /* ============================================================
     A5.2 · A5.4 — HOW MANY DROPS?
     Two designs, fair (the same mass), B's blades a little longer. After n drops
     of each the difference in the means has an uncertainty √(sA²/n + sB²/n);
     the difference is seen when it is twice that.
     ============================================================ */
  function trialsOf(S) {
    const p = S.p, key = ['tr', p.dL, p.nT, p.timingT, p.H, p.seed].join('|');
    if (S._tr && S._tr.key === key) return S._tr;
    const A = Object.assign({}, BASE_D), B = Object.assign({}, BASE_D, { L: BASE_D.L + p.dL });
    const mA = heli(A).m, mB = heli(B).m; A.extra = Math.max(0, mB - mA);
    const dA = drops(A, p.H, p.nT, p.seed + 3), dB = drops(B, p.H, p.nT, p.seed + 17);
    const rows = [];
    for (let n = 1; n <= p.nT; n++) {
      const a = stats(dA.slice(0, n).map(q => readOf(q, p.timingT))), b = stats(dB.slice(0, n).map(q => readOf(q, p.timingT)));
      const diff = b.mean - a.mean, unc = n > 1 ? Math.sqrt(a.se * a.se + b.se * b.se) : NaN;
      rows.push({ n, a, b, diff, unc, ratio: n > 1 ? Math.abs(diff) / unc : 0 });
    }
    const seen = rows.find(r => r.n >= 3 && r.ratio >= 2);
    S._tr = { key, A, B, dA, dB, rows, seen: seen ? seen.n : null, trueDiff: flight(B, p.H).t - flight(A, p.H).t };
    return S._tr;
  }

  /* ============================================================
     A5.5 — CLAIM, EVIDENCE, REASONING
     The class made 24 helicopters and dropped each three times from 3 m, timed
     by gates. One group made a careful series (blade length 5–14 cm, one clip,
     copy paper); others made the 8 cm design in red and blue, in card, and with
     0, 2 or 3 clips; a few made whatever they liked. Every blade is 3 cm wide.
     ============================================================ */
  const CLASS = (() => {
    const rows = [], add = d => rows.push(Object.assign({ w: 3, extra: 0, colour: 'white', paper: 'copy', clips: 1 }, d));
    for (let L2 = 5; L2 <= 14; L2++) add({ L: L2 });                                         // the careful series
    ['red', 'red', 'blue', 'blue'].forEach(c => add({ L: 8, colour: c }));                   // the colour group
    [0, 1, 2].forEach(() => add({ L: 8, paper: 'card' }));                                    // the card group
    [0, 2, 3].forEach(c => add({ L: 8, clips: c }));                                          // the clip group
    const r = lcg(424242), cols = ['red', 'blue', 'white'];
    for (let i = 0; i < 4; i++) add({ L: 6 + Math.round(r() * 12) / 2, clips: Math.floor(r() * 4), paper: r() < 0.5 ? 'copy' : 'card', colour: cols[Math.floor(r() * 3)] });   // whatever they liked
    return rows.map((d, i) => { const ts = drops(d, 3, 3, 99 + i).map(q => q.gate); return { id: i + 1, d, m: heli(d).m, ts, mean: ts.reduce((u, v) => u + v, 0) / 3 }; });
  })();
  const CLAIMS = {
    longer: { text: 'Longer blades make a helicopter fall more slowly', variable: 'length', expect: +1 },
    heavier: { text: 'Heavier helicopters fall faster', variable: 'mass', expect: -1 },
    red: { text: 'Red helicopters fall more slowly than blue ones', variable: 'colour', expect: +1 },
    card: { text: 'Card helicopters fall more slowly than paper ones', variable: 'paper', expect: +1 },
    wider: { text: 'Wider blades make a helicopter fall more slowly', variable: 'width', expect: +1 }
  };
  function fitLine(P) {
    const n = P.length; if (n < 2) return null;
    const mx = P.reduce((u, [x]) => u + x, 0) / n, my = P.reduce((u, [, y]) => u + y, 0) / n;
    const sxx = P.reduce((u, [x]) => u + (x - mx) ** 2, 0), sxy = P.reduce((u, [x, y]) => u + (x - mx) * (y - my), 0), syy = P.reduce((u, [, y]) => u + (y - my) ** 2, 0);
    if (sxx <= 0) return null;
    const b = sxy / sxx, a = my - b * mx, res = P.map(([x, y]) => y - a - b * x), s2 = res.reduce((u, v) => u + v * v, 0) / Math.max(1, n - 2);
    return { a, b, se: Math.sqrt(s2 / sxx), r: syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0 };
  }
  /* the evidence: helicopters alike in everything but the claim's variable; all 24; or just three */
  const alike8 = r => r.d.L === 8 && r.d.w === 3;
  function evidenceRows(claim, ev) {
    const C = CLAIMS[claim];
    if (ev === 'few') return CLASS.slice(3, 6);
    if (ev === 'all') return CLASS.slice();
    if (C.variable === 'length') return CLASS.filter(r => r.d.clips === 1 && r.d.paper === 'copy');
    if (C.variable === 'mass') return CLASS.filter(r => alike8(r) && r.d.paper === 'copy');
    if (C.variable === 'paper') return CLASS.filter(r => alike8(r) && r.d.clips === 1);
    if (C.variable === 'colour') return CLASS.filter(r => alike8(r) && r.d.clips === 1 && r.d.paper === 'copy');
    return CLASS.slice();
  }
  function judge(claim, ev) {
    const C = CLAIMS[claim], rows = evidenceRows(claim, ev), out = { rows, C };
    if (C.variable === 'width') return Object.assign(out, { verdict: 'no evidence', why: 'every helicopter in the table has 3 cm blades: the data never varied the width, so they cannot say anything about it' });
    if (ev === 'few') return Object.assign(out, { verdict: 'too little evidence', why: 'three helicopters, dropped three times each, cannot separate an effect from the scatter' });
    if (ev === 'all') {
      const fitAll = C.variable === 'length' || C.variable === 'mass' ? fitLine(rows.map(r => [C.variable === 'mass' ? r.m * 1000 : r.d.L, r.mean])) : null;
      Object.assign(out, fitAll ? { P: rows.map(r => [C.variable === 'mass' ? r.m * 1000 : r.d.L, r.mean]), F: fitAll } : {});
      return Object.assign(out, { verdict: 'unfair comparison', why: 'these rows differ in several things at once — blade length, clips, paper, colour — so a difference cannot be pinned on the ' + (C.variable === 'mass' ? 'mass' : C.variable === 'length' ? 'blade length' : C.variable) + (fitAll ? ' (r = ' + fitAll.r.toFixed(2) + ')' : '') + '. Compare helicopters alike in everything else' });
    }
    if (C.variable === 'colour' || C.variable === 'paper') {
      const [ka, kb] = C.variable === 'colour' ? ['red', 'blue'] : ['card', 'copy'], key = C.variable === 'colour' ? 'colour' : 'paper';
      const A = rows.filter(r => r.d[key] === ka).flatMap(r => r.ts), B = rows.filter(r => r.d[key] === kb).flatMap(r => r.ts), a = stats(A), b = stats(B);   // every drop counts
      const diff = a.mean - b.mean, unc = Math.sqrt(a.se * a.se + b.se * b.se);
      Object.assign(out, { diff, unc, a, b, ka, kb });
      if (Math.abs(diff) < 2 * unc) return Object.assign(out, { verdict: 'not supported', why: ka + ' ' + a.mean.toFixed(2) + ' s, ' + kb + ' ' + b.mean.toFixed(2) + ' s: the difference (' + (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' s) is smaller than twice its uncertainty (± ' + unc.toFixed(2) + ' s)' + (C.variable === 'colour' ? ' — colour changes nothing the air can push on' : '') });
      if (Math.sign(diff) !== C.expect) return Object.assign(out, { verdict: 'contradicted', why: ka + ' ' + a.mean.toFixed(2) + ' s against ' + kb + ' ' + b.mean.toFixed(2) + ' s: the data say the opposite — ' + (C.variable === 'paper' ? 'card is heavier, so it falls faster' : 'the difference goes the other way') });
      return Object.assign(out, { verdict: 'supported', why: 'a difference of ' + diff.toFixed(2) + ' ± ' + unc.toFixed(2) + ' s' });
    }
    const xv = r => C.variable === 'mass' ? r.m * 1000 : r.d.L, P = rows.map(r => [xv(r), r.mean]), F = fitLine(P);
    Object.assign(out, { P, F });
    if (C.variable === 'length') {
      const upto = P.filter(q => q[0] <= 11), Fu = fitLine(upto), drp = (lo, hi) => stats(rows.filter(r => r.d.L >= lo && r.d.L <= hi).flatMap(r => r.ts)), long = drp(13, 15), peak = drp(10, 11);
      Object.assign(out, { Fu, F: Fu || F });
      if (long.n >= 2 && peak.n >= 2 && peak.mean - long.mean > 2 * Math.sqrt(long.se ** 2 + peak.se ** 2 + 1e-9))
        return Object.assign(out, { verdict: 'overstated', why: 'true up to about 11 cm (+' + Fu.b.toFixed(2) + ' ± ' + Fu.se.toFixed(2) + ' s per cm); the 13–14 cm blades flutter and fall ' + (peak.mean - long.mean).toFixed(2) + ' s faster than the 10–11 cm ones — “longer is slower” holds only over a range' });
      return Object.assign(out, { verdict: Fu && Fu.b > 2 * Fu.se ? 'supported' : 'not supported', why: 'the drop time rises ' + (Fu || F).b.toFixed(2) + ' ± ' + (Fu || F).se.toFixed(2) + ' s per cm of blade' });
    }
    return Object.assign(out, { verdict: F.b < -2 * F.se ? 'supported' : 'not supported', why: 'the same 8 cm blades with 0–3 clips: the drop time falls ' + (-F.b).toFixed(2) + ' ± ' + F.se.toFixed(2) + ' s per gram of helicopter (r = ' + F.r.toFixed(2) + ')' });
  }

  /* ============================================================
     A5.6 — DESIGN AN INVESTIGATION
     The plan: the variable, its range and steps, the repeats, the timing, the
     height, and whether the mass is kept the same. Checked against five
     criteria before it runs, then run exactly as written.
     ============================================================ */
  function designPlan(p) {
    const v = p.q, pts = [];
    if (v === 'length' || v === 'clips') {
      const lo = v === 'length' ? p.from : Math.round(p.cFrom), hi = v === 'length' ? p.to : Math.round(p.cTo), n = v === 'clips' ? Math.min(p.steps, Math.abs(hi - lo) + 1) : p.steps;
      for (let i = 0; i < n; i++) pts.push(n === 1 ? lo : lo + (hi - lo) * i / (n - 1));
    } else pts.push(0, 1, 2);
    return pts.map(x => {
      const d = Object.assign({}, BASE_D);
      if (v === 'length') d.L = Math.round(x * 2) / 2; if (v === 'clips') d.clips = Math.round(x);
      if (v === 'paper') d.paper = ['tissue', 'copy', 'card'][x];
      if (v === 'colour') d.colour = ['red', 'white', 'blue'][x];
      return { x, d };
    });
  }
  function designOf(S) {
    const p = S.p, key = ['ds', p.q, p.from, p.to, p.cFrom, p.cTo, p.steps, p.nD, p.timingD, p.HD, p.balanceD, p.seed].join('|');
    if (S._ds && S._ds.key === key) return S._ds;
    const plan = designPlan(p);
    // keep the mass the same: every design carries a trimmed clip up to the heaviest one's mass
    if (p.balanceD && p.q === 'length') { const mx = Math.max(...plan.map(q => heli(q.d).m)); plan.forEach(q => { q.d.extra = mx - heli(q.d).m; }); }
    const res = plan.map((q, i) => { const ds = drops(q.d, p.HD, p.nD, p.seed + 31 * i), st = stats(ds.map(r => readOf(r, p.timingD))); return Object.assign({}, q, { ds, st, true: flight(q.d, p.HD).t }); });
    // the checks, before the result is shown
    const checks = [];
    const fair = !(p.q === 'length' && !p.balanceD);
    checks.push({ name: 'Fair: one variable changed', ok: fair, say: fair ? 'only the ' + VARS[p.q].name + ' changes' : 'longer blades use more paper: the mass changes too' });
    const span = p.q === 'length' ? Math.abs(p.to - p.from) : p.q === 'clips' ? Math.abs(p.cTo - p.cFrom) : 2;
    const rangeOK = p.q === 'length' ? span >= 4 : p.q === 'clips' ? span >= 2 : true;
    checks.push({ name: 'Range wide enough', ok: rangeOK, say: rangeOK ? 'wide enough to show a pattern' : 'the change is small next to the scatter' });
    const stepsOK = res.length >= (p.q === 'paper' || p.q === 'colour' ? 3 : 5);
    checks.push({ name: 'Enough steps', ok: stepsOK, say: stepsOK ? res.length + ' values — a curve can show' : 'only ' + res.length + ' values: a curve could hide between them' });
    const sdEst = res.reduce((u, q) => u + (q.st.sd || 0), 0) / res.length, dStep = res.length > 1 ? Math.abs(res[res.length - 1].true - res[0].true) / (res.length - 1) : 0;
    const repOK = p.nD >= 3 && (dStep === 0 || sdEst / Math.sqrt(p.nD) < dStep / 2);
    checks.push({ name: 'Enough repeats', ok: repOK, say: p.nD < 3 ? p.nD + ' drop' + (p.nD > 1 ? 's' : '') + ' a value cannot show the scatter' : repOK ? p.nD + ' drops a value: each mean is sure to ± ' + (sdEst / Math.sqrt(p.nD)).toFixed(2) + ' s' : 'the scatter (± ' + (sdEst / Math.sqrt(p.nD)).toFixed(2) + ' s) is as big as the steps' });
    const timeOK = p.timingD === 'gates' || p.HD >= 2;
    checks.push({ name: 'Timing', ok: timeOK, say: p.timingD === 'gates' ? 'light gates, to a millisecond' : timeOK ? 'stopwatch over ' + p.HD.toFixed(1) + ' m: ± 0.05 s on 2 s or more' : 'a stopwatch on a short drop: ± 0.05 s on barely a second' });
    S._ds = { key, res, checks, score: checks.filter(c => c.ok).length };
    return S._ds;
  }
  /* the true relation across the whole range, for the design check (no scatter) */
  function trueCurve(p) {
    if (p.q === 'length') {
      const plan = designPlan(p), mx = Math.max(...plan.map(q => heli(q.d).m)), out = [];
      for (let L2 = 4; L2 <= 15; L2 += 0.25) { const d = Object.assign({}, BASE_D, { L: L2 }); if (p.balanceD) d.extra = Math.max(0, mx - heli(d).m); out.push([L2, flight(d, p.HD).t]); }
      return out;                                   // with the mass kept at the plan's heaviest, lighter-bladed ones carry trimmed clips
    }
    if (p.q === 'clips') { const out = []; for (let c = 0; c <= 6; c++) out.push([c, flight(Object.assign({}, BASE_D, { clips: c }), p.HD).t]); return out; }
    return [0, 1, 2].map(i => [i, flight(Object.assign({}, BASE_D, p.q === 'paper' ? { paper: ['tissue', 'copy', 'card'][i] } : { colour: ['red', 'white', 'blue'][i] }), p.HD).t]);
  }

  /* ============================================================
     THE LAB
     ============================================================ */
  const SETUPS = [
    { value: 'fair', label: 'A fair test: change one thing', teaches: ['A5.2'] },
    { value: 'trials', label: 'How many drops tell them apart?', teaches: ['A5.2', 'A5.4'] },
    { value: 'cer', label: 'Claim, evidence, reasoning', teaches: ['A5.5'] },
    { value: 'design', label: 'Plan it, check it, run it', teaches: ['A5.6'] }
  ];
  const is = v => S => S.p.setup === v;
  const BASE = {
    setup: 'fair', seed: 1, H: 3,
    vary: 'length', aL: 7, bL: 10, aW: 3, bW: 4.5, aC: 1, bC: 2, aP: 'copy', bP: 'card', aCol: 'white', bCol: 'red', balance: false, windowB: false, trials: 5, timing: 'gates',
    dL: 0.5, nT: 12, timingT: 'watch',
    claim: 'longer', evidence: 'alike',
    q: 'length', from: 6, to: 12, cFrom: 0, cTo: 4, steps: 6, nD: 3, timingD: 'gates', HD: 3, balanceD: true
  };
  function preset(o) { return Object.assign({}, BASE, o); }
  const TRIAL_T = 1.4;                       // stage seconds between drops, beyond the fall itself

  function setup(S) {
    const p = S.p;
    S.tf = 0; S.tt = 0; S.tc = 0; S.td = 0; S.ta = S.ta || 0;
    S._fair = null; S._tr = null; S._ds = null; S._flights = null;
    if (p.setup === 'cer' || p.setup === 'design') { S.cam = null; return; }
    const home = homeFor(p.setup, !!S._narrow);
    if (!S.cam || S.camFor !== p.setup) {
      S.cam = Camera({ theta: home.theta, phi: home.phi, dist: home.dist, target: home.target.slice(), fov: home.fov });
      S.cam.minDist = home.min; S.cam.maxDist = home.max; S.camFor = p.setup; S._narrowCam = !!S._narrow;
    }
  }
  function step(S, dt) {
    const p = S.p;
    S.ta = (S.ta || 0) + dt;
    if (p.setup === 'fair') S.tf = Math.min(scheduleEnd(S), S.tf + dt);
    else if (p.setup === 'trials') S.tt = Math.min(p.nT * 0.9 + 1, S.tt + dt);
    else if (p.setup === 'cer') S.tc = Math.min(8, S.tc + dt);
    else if (p.setup === 'design') S.td = Math.min(DS_END, S.td + dt);
  }
  const DS_END = 12;
  /* the fair test runs drop by drop, A and B released together */
  function scheduleEnd(S) { const F = fairOf(S); let t = 0; for (let i = 0; i < S.p.trials; i++) t += 0.6 + Math.max(F.dA[i].t, F.dB[i].t) + TRIAL_T; return t; }
  function fairNow(S) {
    const F = fairOf(S), p = S.p;
    let t = S.tf;
    for (let i = 0; i < p.trials; i++) {
      const span = 0.6 + Math.max(F.dA[i].t, F.dB[i].t) + TRIAL_T;
      if (t < span || i === p.trials - 1) return { i, u: Math.min(t, span), fallT: Math.max(0, Math.min(t, span) - 0.6), done: t >= span && i === p.trials - 1 };
      t -= span;
    }
    return { i: 0, u: 0, fallT: 0, done: false };
  }
  function flightsOf(S, i) {                  // the two flights of drop i, as paths for the stage
    const F = fairOf(S), p = S.p, key = F.key + '|' + i;
    if (S._flights && S._flights.key === key) return S._flights;
    S._flights = { key, a: flight(F.A, p.H, F.dA[i].k, 0, true), b: flight(F.B, p.H, F.dB[i].k, p.windowB ? UP_WINDOW : 0, true) };
    return S._flights;
  }
  const pathAt = (fl, t) => { const tr = fl.traj; if (t >= fl.t) return tr[tr.length - 1]; const i = clamp(Math.floor(t / 0.02), 0, tr.length - 2), a = tr[i], b = tr[i + 1], f = clamp((t - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1); return [t, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; };

  /* ---------------- cameras ---------------- */
  const HOMES = {
    fair: { theta: -1.35, phi: 0.12, dist: 5.4, target: [0.1, 0, 1.65], fov: 0.7, min: 1.5, max: 12 },
    trials: { theta: -1.35, phi: 0.12, dist: 5.4, target: [0.1, 0, 1.65], fov: 0.7, min: 1.5, max: 12 }
  };
  const homeFor = (su, narrow) => { const h = HOMES[su] || HOMES.fair; return narrow ? Object.assign({}, h, { dist: h.dist * 1.2 }) : h; };
  function placeView(S, g, fx, fy) { const cam = S.cam; cam.setViewport(g.w, g.h); cam.offX = fx * g.w; cam.offY = fy; }
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const th = g => g.theme;
  const dSay = (d) => d.L + ' cm × ' + d.w + ' cm blades · ' + d.clips + ' clip' + (d.clips === 1 ? '' : 's') + ' · ' + PAPER[d.paper].name + (d.colour !== 'white' ? ' · ' + d.colour : '');

  /* ============================================================
     THE STAGE — the stairwell: the frame, two helicopters, the gates
     ============================================================ */
  const FR = { x0: -0.9, x1: 0.9, y: 0.0 };
  function drawStair(S, g, A, B, fa, fb, tA, tB, labels) {
    const ctx = g.ctx, cam = S.cam, p = S.p, M = ME(), W = g.w, H = g.h, K = kit(), narrow = W < K.NARROW;
    const Hd = p.H;
    // the stairwell: a painted wall, the landing's edge, a handrail climbing past
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#D9DDE2'); bg.addColorStop(1, '#AEB6BF'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    placeView(S, g, narrow ? 0 : -0.16, narrow ? 12 : 26);
    const F = R3.Frame(ctx, cam, { ambient: 0.4, floorZ: 0 });
    M.face(F, [[-2.2, 0.6, 0], [2.2, 0.6, 0], [2.2, 0.6, 4.2], [-2.2, 0.6, 4.2]], '#E6E2D8', { ambient: 0.7, bias: F.GROUND + 3 });
    M.face(F, [[-2.2, -1.2, 0], [2.2, -1.2, 0], [2.2, 0.6, 0], [-2.2, 0.6, 0]], '#8E8A82', { ambient: 0.55, bias: F.GROUND + 2 });
    M.wallTape(F, 1.2, 0.59, Hd + 0.2);
    const gates = [{ z: Hd - 0.02, blocked: false }, { z: 0.12, blocked: false }];
    M.dropFrame(F, FR.x0, FR.x1, FR.y, Hd, gates, { release: [-0.35, 0.35] });
    // the two helicopters where their flights have taken them
    const place = (fl, t, x, d) => { const q = pathAt(fl, Math.max(0, t)); const z = Hd - q[1] - BODY; M.helicopter(F, [x, FR.y, Math.max(0.03, z)], d, q[3], { flutter: heli(d).flutter, t: S.ta }); return [x, FR.y, z + BODY]; };
    const pa = place(fa, tA, -0.35, A), pb = place(fb, tB, 0.35, B);
    F.render();
    // labels over each, and the close-up of both
    [[pa, 'A'], [pb, 'B']].forEach(([pt, lab]) => {                     // a ring round each small helicopter, and its letter
      const q = cam.project([pt[0], pt[1], pt[2] - 0.02]), qt = cam.project([pt[0], pt[1], pt[2] + 0.16]); if (!q.ok || !qt.ok) return;
      const col = lab === 'A' ? '#7FD4FF' : '#FFB35C', r = Math.max(12, Math.abs(q.y - qt.y) * 0.9);
      ctx.save(); ctx.strokeStyle = g.alpha(col, 0.75); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.stroke();
      ctx.font = mono(11, 700); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(lab, q.x, q.y - r - 2); ctx.restore();
    });
    return { F, cam };
  }
  /* a close-up card: both designs spinning, drawn with their own camera */
  function closeUp(g, S, x, y, w, h, A, B, phA, phB) {
    const ctx = g.ctx, K = kit(), M = ME(), T = th(g);
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('A and B, close up', x + 10, y + 8); ctx.restore();
    if (!S.camC) S.camC = Camera({ theta: -1.45, phi: 0.32, dist: 1.1, target: [0, 0, 0.09], fov: 0.6 });
    const cam = S.camC; cam.setViewport(g.w, g.h); cam.offX = 0; cam.offY = 0;
    const span = 2 * (Math.max(A.L, B.L) / 100 * 1.25 + 0.04) + 0.06;              // both rotors side by side, a little room
    cam.dist = cam._k * span / Math.max(120, w - 24); cam.update && cam.update();
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 24, w - 4, h - 26); ctx.clip();
    ctx.translate(x + w / 2 - g.w / 2, y + 24 + (h - 90) / 2 - g.h / 2 + 6);
    const F = R3.Frame(ctx, cam, { ambient: 0.5 }), sep = span / 4;
    M.helicopter(F, [-sep, 0, 0], A, phA, { scale: 1.25, flutter: heli(A).flutter, t: S.ta });
    M.helicopter(F, [sep, 0, 0], B, phB, { scale: 1.25, flutter: heli(B).flutter, t: S.ta });
    F.render();
    ctx.restore();
    ctx.save(); ctx.font = mono(9, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const hA = heli(A), hB = heli(B);
    ctx.fillStyle = '#7FD4FF'; ctx.fillText('A ' + dSay(A), x + 10, y + h - 44);
    ctx.fillText('   mass ' + (hA.m * 1000).toFixed(2) + ' g' + (A.extra ? ' (+' + (A.extra * 1000).toFixed(2) + ' g of trimmed clip)' : ''), x + 10, y + h - 33);
    ctx.fillStyle = '#FFB35C'; ctx.fillText('B ' + dSay(B), x + 10, y + h - 20);
    ctx.fillText('   mass ' + (hB.m * 1000).toFixed(2) + ' g' + (B.extra ? ' (+' + (B.extra * 1000).toFixed(2) + ' g of trimmed clip)' : ''), x + 10, y + h - 9);
    ctx.restore();
  }
  function drawFair(S, g) {
    const p = S.p, K = kit(), W = g.w, H = g.h, ctx = g.ctx, T = th(g);
    const Fr = fairOf(S), now = fairNow(S), fl = flightsOf(S, now.i);
    drawStair(S, g, Fr.A, Fr.B, fl.a, fl.b, now.fallT, now.fallT);
    const done = S.tf >= scheduleEnd(S) - 1e-6, n = done ? p.trials : now.i + (now.fallT >= Math.max(fl.a.t, fl.b.t) ? 1 : 0);
    // the variables card: what changed, what was measured, what was held — and what changed anyway
    const cw = Math.min(262, W * 0.3), at = K.cardSlot(g, S, 'the variables', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (at) varsCard(g, S, Fr, at.x, at.y, at.w);
    const ch = K.cardSlot(g, S, 'close up', cw, { x: W - cw - 10, y: K.HDR + 4 + 196 });
    if (ch) closeUp(g, S, ch.x, ch.y, ch.w, Math.min(210, H - ch.y - 44), Fr.A, Fr.B, pathAt(fl.a, now.fallT)[3], pathAt(fl.b, now.fallT)[3]);
    const a = stats(Fr.dA.slice(0, n).map(q => readOf(q, p.timing))), b = stats(Fr.dB.slice(0, n).map(q => readOf(q, p.timing)));
    const v = VARS[p.vary];
    K.header(g, n === 0 ? 'Drop 1 of ' + p.trials + ': A and B let go together from ' + p.H.toFixed(1) + ' m' : (done ? 'After ' + n + ' drops each: ' : 'Drop ' + Math.min(p.trials, now.i + 1) + ' of ' + p.trials + ' · ') + 'A ' + a.mean.toFixed(2) + ' s, B ' + b.mean.toFixed(2) + ' s — ' + (Fr.also.length ? 'but more than the ' + v.name + ' changed' : 'the only difference is the ' + v.name),
      'you changed: ' + v.name + ' · you measured: the drop time (' + (p.timing === 'gates' ? 'light gates' : 'stopwatch') + ') · you held: everything else' + (Fr.also.length ? ' · also changed: ' + Fr.also.join('; ') : ''),
      'a paper helicopter spins as it falls: its blades sweep a disc of air · a drop takes about ' + flight(Fr.A, p.H).t.toFixed(1) + ' s');
    void T; void ctx; void H;
  }
  function varsCard(g, S, Fr, x, y, w) {
    const ctx = g.ctx, K = kit(), T = th(g), p = S.p, v = VARS[p.vary], h = 186;
    K.card(ctx, x, y, w, h);
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.fillText('The variables', x + 10, y + 8);
    const val = d => p.vary === 'length' ? d.L + ' cm' : p.vary === 'width' ? d.w + ' cm' : p.vary === 'clips' ? d.clips + ' clip' + (d.clips === 1 ? '' : 's') : p.vary === 'paper' ? PAPER[d.paper].name : d.colour;
    const rows = [
      ['CHANGED (independent)', v.name + ': A ' + val(Fr.A) + ', B ' + val(Fr.B), '#7FD4FF'],
      ['MEASURED (dependent)', 'the time to fall ' + p.H.toFixed(1) + ' m', '#9FE0A8'],
      ['HELD THE SAME', ['length', 'width', 'clips', 'paper', 'colour'].filter(k => k !== p.vary).map(k => VARS[k].name).join(', ') + ', height, release, timing', T['text-2']]
    ];
    let yy = y + 28;
    rows.forEach(([a, b, c]) => { ctx.font = mono(8.5, 700); ctx.fillStyle = c; ctx.fillText(a, x + 10, yy); ctx.font = mono(9, 500); ctx.fillStyle = T.text; yy = K.wrapText(ctx, b, x + 10, yy + 12, w - 20, 11, 2) + 15; });
    ctx.font = mono(8.5, 700); ctx.fillStyle = Fr.also.length ? '#FF8A80' : '#9FE0A8'; ctx.fillText(Fr.also.length ? 'ALSO CHANGED — NOT A FAIR TEST' : 'NOTHING ELSE CHANGED — A FAIR TEST', x + 10, yy);
    ctx.font = mono(9, 500); ctx.fillStyle = T.text;
    if (Fr.also.length) K.wrapText(ctx, Fr.also.join('; '), x + 10, yy + 12, w - 20, 11, 3);
    ctx.restore();
  }
  function drawTrials(S, g) {
    const p = S.p, K = kit(), W = g.w, H = g.h;
    const Tr = trialsOf(S), n = clamp(Math.floor(S.tt / 0.9) + 1, 1, p.nT), dA = Tr.dA[n - 1], dB = Tr.dB[n - 1];
    const u = S.tt - (n - 1) * 0.9, show = Math.max(0, u * 4);                   // each drop replayed four times faster
    const fa = flight(Tr.A, p.H, dA.k, 0, true), fb = flight(Tr.B, p.H, dB.k, 0, true);
    drawStair(S, g, Tr.A, Tr.B, fa, fb, show, show);
    const cw = Math.min(262, W * 0.3), ch = K.cardSlot(g, S, 'close up', cw, { x: W - cw - 10, y: K.HDR + 4 });
    if (ch) closeUp(g, S, ch.x, ch.y, ch.w, Math.min(210, H - ch.y - 44), Tr.A, Tr.B, pathAt(fa, show)[3], pathAt(fb, show)[3]);
    const r = Tr.rows[n - 1];
    K.header(g, Tr.seen && n >= Tr.seen ? 'After ' + Tr.seen + ' drops each the difference is twice its uncertainty: B is slower by ' + Tr.rows[Tr.seen - 1].diff.toFixed(2) + ' s' : n + ' drop' + (n > 1 ? 's' : '') + ' each: B − A = ' + r.diff.toFixed(2) + (n > 1 ? ' ± ' + r.unc.toFixed(2) : '') + ' s — not yet told apart',
      'B’s blades are ' + p.dL.toFixed(2) + ' cm longer, with the mass kept the same · truly ' + Tr.trueDiff.toFixed(3) + ' s slower · each drop’s time scatters about ± ' + (SCATTER * 50).toFixed(1) + ' %' + (p.timingT === 'watch' ? ', and the stopwatch ± 0.05 s' : ''),
      'the uncertainty of a mean shrinks as 1 ÷ √(number of drops) · drops replayed four times faster');
  }

  /* ============================================================
     THE STAGE — claim, evidence, reasoning: the class table and the argument
     ============================================================ */
  const VERDICT_COL = { supported: '#6FE0A0', 'not supported': '#FF8A80', overstated: '#FFC04A', contradicted: '#FF6A5A', 'no evidence': '#C9D4EA', 'too little evidence': '#C9D4EA', 'unfair comparison': '#FFC04A' };
  function drawCER(S, g) {
    const ctx = g.ctx, p = S.p, K = kit(), T = th(g), W = g.w, H = g.h, narrow = W < K.NARROW;
    const J = judge(p.claim, p.evidence), sel = new Set(J.rows.map(r => r.id));
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2B3140'); bg.addColorStop(1, '#1C212C'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const top = K.HDR + 10, bottom = H - 40, tw = narrow ? 0 : Math.min(300, W * 0.36);
    // the class table on a clipboard: rows used as evidence highlighted
    if (!narrow) {
      const x = 12, y = top, w = tw, h = bottom - top;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.fillStyle = '#8A6A45'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8); ctx.restore();
      ctx.fillStyle = '#F6F4EC'; ctx.fillRect(x, y + 10, w, h - 10);
      ctx.fillStyle = '#B9C0C8'; ctx.fillRect(x + w / 2 - 30, y - 2, 60, 16);
      ctx.save(); ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#243A6A';
      const cols = [x + 8, x + 30, x + 76, x + 108, x + 150, x + 200, x + 244], heads = ['#', 'blade', 'clips', 'paper', 'colour', 'mass', 'time'];
      heads.forEach((hd, i) => ctx.fillText(hd, cols[i], y + 24));
      const rowH = Math.min(14.5, (h - 44) / CLASS.length);
      CLASS.forEach((r, i) => {
        const yy = y + 38 + i * rowH, used = sel.has(r.id);
        if (used) { ctx.fillStyle = 'rgba(111,224,160,.22)'; ctx.fillRect(x + 2, yy - rowH / 2, w - 4, rowH); }
        ctx.fillStyle = used ? '#1D2B4A' : 'rgba(29,43,74,.45)'; ctx.font = (used ? '600 ' : '500 ') + '9px "IBM Plex Mono",monospace';
        [String(r.id), r.d.L.toFixed(1), String(r.d.clips), r.d.paper, r.d.colour, (r.m * 1000).toFixed(2), r.mean.toFixed(2)].forEach((t, k) => ctx.fillText(t, cols[k], yy));
      });
      ctx.restore();
    }
    // the argument: the claim, the evidence, the verdict, the reasoning
    const x = narrow ? 10 : tw + 30, w = W - x - 12, y = top;
    const reveal = clamp(S.tc / 2.2, 0, 1);
    const box = (yy, hh, title, col, body, big) => {
      K.card(ctx, x, yy, w, hh);
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(9, 700); ctx.fillStyle = col; ctx.fillText(title, x + 12, yy + 9);
      ctx.font = big ? '700 15px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif' : mono(10, 500); ctx.fillStyle = T.text;
      K.wrapText(ctx, body, x + 12, yy + 26, w - 24, big ? 18 : 13, 4); ctx.restore();
    };
    box(y, 66, 'CLAIM', '#7FD4FF', '“' + J.C.text + '”', true);
    const evText = p.evidence === 'all' ? 'all 24 helicopters, 3 drops each' : p.evidence === 'few' ? 'three helicopters, 3 drops each' : J.C.variable === 'width' ? 'there are none: no one varied the blade width' : J.rows.length + ' helicopters alike in everything but the ' + (J.C.variable === 'mass' ? 'mass (8 cm blades, copy paper, 0–3 clips)' : J.C.variable === 'length' ? 'blade length (one clip, copy paper)' : J.C.variable === 'paper' ? 'paper (8 cm blades, one clip)' : 'colour (8 cm blades, one clip, copy paper)');
    box(y + 76, 58, 'EVIDENCE', '#9FE0A8', evText);
    if (reveal > 0.3) {
      const col = VERDICT_COL[J.verdict] || T.text, yy = y + 144;
      K.card(ctx, x, yy, w, 86);
      ctx.save(); ctx.globalAlpha = clamp((reveal - 0.3) / 0.4, 0, 1); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = mono(9, 700); ctx.fillStyle = col; ctx.fillText('WHAT THE DATA SAY', x + 12, yy + 9);
      const sw2 = narrow ? 112 : 140, sx = narrow ? x + w - sw2 / 2 - 10 : x + w - 92, sy = narrow ? yy + 14 : yy + 44;   // the stamp; on a phone it sits in the corner
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.12); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(-sw2 / 2, -14, sw2, 28);
      ctx.font = '800 ' + (narrow ? 11 : 14) + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(J.verdict.toUpperCase(), 0, 1); ctx.restore();
      ctx.font = mono(9.5, 500); ctx.fillStyle = T.text; K.wrapText(ctx, J.why, x + 12, yy + (narrow ? 34 : 26), narrow ? w - 24 : w - 190, 12.5, narrow ? 4 : 4);
      ctx.restore();
    }
    if (reveal > 0.9) box(y + 240, Math.min(96, bottom - (y + 240)), 'REASONING — WHY', '#FFC04A', REASON[p.claim]);
    K.header(g, 'Claim, evidence, reasoning: does the class’s data back the claim?', 'claim: ' + J.C.text.toLowerCase() + ' · evidence: ' + J.rows.length + ' of 24 helicopters · verdict: ' + J.verdict, 'a claim is only as good as the evidence chosen for it — and the reasons that connect them');
  }
  const REASON = {
    longer: 'Longer blades sweep a bigger disc of air (area grows as length²); the helicopter has to push more air aside for each metre it falls, so it settles to a slower speed — until the blades are too long and thin to hold their shape.',
    heavier: 'The rotor’s drag must match the weight: drag grows as speed², so a heavier helicopter has to fall faster before the air holds it up (speed grows as √mass).',
    red: 'Colour changes nothing the air can push on: same shape, same size, same mass. Any difference in the table is the scatter of the drops.',
    card: 'Card is twice as heavy as copy paper for the same blades, so a card helicopter falls faster; being stiffer only helps when the blades are long enough to flutter.',
    wider: 'Wider blades add paper (mass) and area to the blades, but the disc they sweep depends on their length. To know, you would have to make helicopters that differ in width — this table never did.'
  };

  /* ============================================================
     THE STAGE — design: the planning board, the checks, the run, the result
     ============================================================ */
  function drawDesign(S, g) {
    const ctx = g.ctx, p = S.p, K = kit(), T = th(g), W = g.w, H = g.h, narrow = W < K.NARROW;
    const D = designOf(S);
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2B3140'); bg.addColorStop(1, '#1C212C'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const top = K.HDR + 10, bottom = H - 40, bw = narrow ? W - 20 : Math.min(330, W * 0.4), x = 12;
    // the board: six slots, each ticked or crossed once the plan is checked (after 2 s)
    const checked = S.td > 1.5, run = clamp((S.td - 3) / 5, 0, 1), shownPts = Math.floor(run * D.res.length + 1e-9);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.fillStyle = '#F2F4F1'; ctx.fillRect(x, top, bw, bottom - top); ctx.restore();
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '700 13px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.fillStyle = '#1D2B4A'; ctx.fillText('Our plan', x + 14, top + 10);
    const v = VARS[p.q];
    const slots = [
      ['QUESTION', 'How does the ' + v.name + ' change the time a paper helicopter takes to fall?'],
      ['CHANGE', p.q === 'length' ? 'blade length from ' + p.from + ' to ' + p.to + ' cm, in ' + p.steps + ' steps' : p.q === 'clips' ? 'paper clips from ' + Math.round(p.cFrom) + ' to ' + Math.round(p.cTo) : p.q === 'paper' ? 'tissue, copy paper, thin card' : 'red, white, blue blades'],
      ['MEASURE', 'the drop time from ' + p.HD.toFixed(1) + ' m, with ' + (p.timingD === 'gates' ? 'light gates' : 'a stopwatch')],
      ['KEEP THE SAME', ['length', 'width', 'clips', 'paper', 'colour'].filter(k => k !== p.q).map(k => VARS[k].name).join(', ') + (p.q === 'length' ? (p.balanceD ? ', and the mass (trimmed clips)' : ' — but not the mass') : '')],
      ['REPEAT', p.nD + ' drop' + (p.nD > 1 ? 's' : '') + ' of each, and average']
    ];
    let yy = top + 34;
    slots.forEach(([a, b]) => {
      ctx.font = '700 9px "IBM Plex Mono",monospace'; ctx.fillStyle = '#4A5A7A'; ctx.fillText(a, x + 14, yy);
      ctx.font = '500 10.5px "IBM Plex Sans",sans-serif'; ctx.fillStyle = '#1D2B4A'; yy = K.wrapText(ctx, b, x + 14, yy + 13, bw - 28, 13, 3) + 18;
    });
    // the checks
    if (checked) {
      ctx.font = '700 9px "IBM Plex Mono",monospace'; ctx.fillStyle = '#4A5A7A'; ctx.fillText('CHECKED BEFORE RUNNING: ' + D.score + ' OF 5', x + 14, yy);
      yy += 14;
      D.checks.forEach(c => {
        ctx.fillStyle = c.ok ? '#1E8A4E' : '#C0392B'; ctx.font = '700 11px "IBM Plex Sans",sans-serif'; ctx.fillText(c.ok ? '✓' : '✗', x + 14, yy);
        ctx.fillStyle = '#1D2B4A'; ctx.font = '600 9.5px "IBM Plex Sans",sans-serif'; ctx.fillText(c.name + ': ', x + 28, yy);
        const w0 = ctx.measureText(c.name + ': ').width; ctx.font = '500 9.5px "IBM Plex Sans",sans-serif'; ctx.fillStyle = '#3A4A6A';
        yy = K.wrapText(ctx, c.say, x + 28 + w0, yy, bw - 42 - w0, 12, 2) + 14;
      });
    }
    ctx.restore();
    // the result, drawn as the drops come in
    if (!narrow) {
      const gx = x + bw + 20, gw = W - gx - 12, gy = top, gh = bottom - top;
      K.card(ctx, gx, gy, gw, gh);
      ctx.save(); ctx.font = mono(10, 600); ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(run <= 0 ? 'The run starts once the plan is checked' : run < 1 ? 'Running the plan…' : 'What the plan found', gx + 12, gy + 10); ctx.restore();
      if (run > 0) resultChart(ctx, S, D, gx + 50, gy + 36, gx + gw - 18, gy + gh - 40, shownPts);
    }
    const r0 = D.res[0], r1 = D.res[D.res.length - 1];
    K.header(g, run >= 1 ? 'The plan scored ' + D.score + ' of 5 — ' + (D.res.length > 1 ? 'from ' + r0.st.mean.toFixed(2) + ' s to ' + r1.st.mean.toFixed(2) + ' s' : '') : 'Plan an investigation, then run it exactly as written',
      'a fair test changes one thing · a wide range with enough steps shows the shape · repeats beat the scatter',
      'the lab checks the plan first, then does the drops');
  }
  function resultChart(ctx, S, D, x0, y0, x1, y1, shown) {
    const p = S.p, cats = p.q === 'paper' ? ['tissue', 'copy', 'card'] : p.q === 'colour' ? ['red', 'white', 'blue'] : null;
    const tc = trueCurve(p), xs = cats ? [0, 1, 2] : tc.map(q => q[0]);
    const xmin = cats ? -0.5 : Math.min(...xs), xmax = cats ? 2.5 : Math.max(...xs);
    const all = D.res.flatMap(q => q.ds.map(r => readOf(r, p.timingD))).concat(tc.map(q => q[1]));
    const ymin = Math.floor(Math.min(...all) * 2) / 2 - 0.25, ymax = Math.ceil(Math.max(...all) * 2) / 2 + 0.25;
    const X = v => x0 + (v - xmin) / (xmax - xmin) * (x1 - x0), Y = v => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
    ctx.save();
    ctx.strokeStyle = 'rgba(200,210,230,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = 'rgba(200,210,230,.8)'; ctx.font = mono(9, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Math.ceil(ymin * 2) / 2; v <= ymax + 1e-9; v += 0.5) { ctx.fillText(v.toFixed(1), x0 - 5, Y(v)); ctx.strokeStyle = 'rgba(200,210,230,.1)'; ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (cats) cats.forEach((c, i) => ctx.fillText(c, X(i), y1 + 5)); else for (let v = Math.ceil(xmin); v <= xmax + 1e-9; v += (xmax - xmin > 8 ? 2 : 1)) ctx.fillText(String(v), X(v), y1 + 5);
    ctx.textAlign = 'right'; ctx.fillText(VARS[p.q].name + (VARS[p.q].unit ? ', ' + VARS[p.q].unit : ''), x1, y1 + 18);
    ctx.save(); ctx.translate(x0 - 36, y0); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText('drop time, s', 0, 0); ctx.restore();
    // the truth over the whole range, faint, once the run is done — what the plan could and could not see
    if (shown >= D.res.length) { ctx.strokeStyle = 'rgba(159,224,168,.45)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); tc.forEach(([a, b], i) => i ? ctx.lineTo(X(a), Y(b)) : ctx.moveTo(X(a), Y(b))); ctx.stroke(); ctx.setLineDash([]); }
    D.res.slice(0, shown).forEach((q, i) => {
      const xx = X(cats ? i : p.q === 'length' ? q.d.L : q.d.clips);
      q.ds.forEach(r => { ctx.fillStyle = 'rgba(255,179,92,.45)'; ctx.beginPath(); ctx.arc(xx, Y(readOf(r, p.timingD)), 2.5, 0, TAU); ctx.fill(); });
      ctx.strokeStyle = '#FFB35C'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xx, Y(q.st.min)); ctx.lineTo(xx, Y(q.st.max)); ctx.stroke();
      ctx.fillStyle = '#FFB35C'; ctx.beginPath(); ctx.arc(xx, Y(q.st.mean), 4.5, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }

  function drawStage(S, g) {
    const p = S.p, K = kit();
    S._narrow = g.w < K.NARROW;
    if (S.cam && S._narrowCam !== S._narrow) { S.cam.dist = homeFor(p.setup, S._narrow).dist; S._narrowCam = S._narrow; }
    if (p.setup === 'fair') return drawFair(S, g);
    if (p.setup === 'trials') return drawTrials(S, g);
    if (p.setup === 'cer') return drawCER(S, g);
    return drawDesign(S, g);
  }

  /* ============================================================
     PLOTS
     ============================================================ */
  function plot1(S, g) {
    const p = S.p, K = kit(), T = th(g);
    if (p.setup === 'fair') {
      const Fr = fairOf(S), now = fairNow(S), fl = flightsOf(S, now.i), done = S.tf >= scheduleEnd(S) - 1e-6, n = done ? p.trials : now.i + (now.fallT >= Math.max(fl.a.t, fl.b.t) ? 1 : 0);
      const items = [{ c: '#7FD4FF', dot: true, label: 'A' }, { c: '#FFB35C', dot: true, label: 'B' }, { c: 'rgba(201,212,234,.6)', label: 'mean, and the range', w: 2 }];
      const Kk = K.plotKey(g, items);
      const all = Fr.dA.concat(Fr.dB).map(q => readOf(q, p.timing)), lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(0.1, (hi - lo) * 0.3);
      const P = g.Plot({ xmin: 0.3, xmax: 2.7, ymin: lo - pad, ymax: hi + pad, pad: { t: Kk.t }, xticks: [1, 2], xfmt: v => v === 1 ? 'A' : v === 2 ? 'B' : '', ylabel: 'drop time, s', yfmt: v => v.toFixed(2) }).frame();
      [[Fr.dA, 1, '#7FD4FF'], [Fr.dB, 2, '#FFB35C']].forEach(([dd, x, c]) => {
        const vals = dd.slice(0, n).map(q => readOf(q, p.timing));
        vals.forEach((v, i) => P.dot(x + (i - (vals.length - 1) / 2) * 0.06, v, 4, c));
        if (vals.length) { const st = stats(vals); P.line([[x - 0.3, st.mean], [x + 0.3, st.mean]], c, 2.5); P.line([[x + 0.36, st.min], [x + 0.36, st.max]], g.alpha(c, 0.7), 2); P.tag(x + 0.4, st.mean, st.mean.toFixed(2) + ' s', c); }
      });
      Kk.draw(P);
      return;
    }
    if (p.setup === 'trials') {
      const Tr = trialsOf(S), n = clamp(Math.floor(S.tt / 0.9) + 1, 1, p.nT), rows = Tr.rows.slice(0, n);
      const items = [{ c: '#7FD4FF', label: 'A: mean so far' }, { c: '#FFB35C', label: 'B: mean so far' }, { c: 'rgba(201,212,234,.35)', box: true, label: '± uncertainty of each mean' }];
      const Kk = K.plotKey(g, items);
      const vals = Tr.rows.flatMap(r => [r.a.mean, r.b.mean]), lo = Math.min(...vals) - 0.12, hi = Math.max(...vals) + 0.12;
      const P = g.Plot({ xmin: 1, xmax: Math.max(2, p.nT), ymin: lo, ymax: hi, pad: { t: Kk.t }, xlabel: 'drops of each', ylabel: 's', xfmt: v => Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : '', yfmt: v => v.toFixed(2) }).frame();
      P.clip(() => {
        [['a', '#7FD4FF'], ['b', '#FFB35C']].forEach(([k, c]) => {
          const band = rows.filter(r => r.n > 1);
          if (band.length > 1) { const ctx = g.ctx; ctx.save(); ctx.fillStyle = g.alpha(c, 0.16); ctx.beginPath(); band.forEach((r, i) => { const X = P.X(r.n), Y = P.Y(r[k].mean + r[k].se); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); for (let i = band.length - 1; i >= 0; i--) ctx.lineTo(P.X(band[i].n), P.Y(band[i][k].mean - band[i][k].se)); ctx.closePath(); ctx.fill(); ctx.restore(); }
          P.line(rows.map(r => [r.n, r[k].mean]), c, 2.2);
        });
        if (Tr.seen && n >= Tr.seen) P.vline(Tr.seen, '#9FE0A8', [4, 3]);
      });
      if (Tr.seen && n >= Tr.seen) P.tag(Tr.seen, hi - 0.03, 'told apart', '#9FE0A8');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'cer') {
      const J = judge(p.claim, p.evidence), C = J.C;
      if (J.P) {
        const items = [{ c: '#FFB35C', dot: true, label: 'the evidence rows' }, { c: 'rgba(201,212,234,.35)', dot: true, label: 'the other rows' }, { c: '#9FE0A8', label: 'best-fit line' }];
        const Kk = K.plotKey(g, items);
        const xv = r => C.variable === 'mass' ? r.m * 1000 : r.d.L, xs = CLASS.map(xv), ys = CLASS.map(r => r.mean);
        const P = g.Plot({ xmin: Math.min(...xs) - 0.3, xmax: Math.max(...xs) + 0.3, ymin: Math.min(...ys) - 0.2, ymax: Math.max(...ys) + 0.2, pad: { t: Kk.t }, xlabel: C.variable === 'mass' ? 'mass, g' : 'blade length, cm', ylabel: 'drop time, s', xfmt: v => v.toFixed(1), yfmt: v => v.toFixed(1) }).frame();
        const sel = new Set(J.rows.map(r => r.id));
        P.clip(() => {
          CLASS.forEach(r => P.dot(xv(r), r.mean, sel.has(r.id) ? 4.5 : 3, sel.has(r.id) ? '#FFB35C' : 'rgba(201,212,234,.35)'));
          if (J.F) { const a = Math.min(...J.P.map(q => q[0])), b = Math.max(...J.P.map(q => q[0])); P.line([[a, J.F.a + J.F.b * a], [b, J.F.a + J.F.b * b]], '#9FE0A8', 2); }
        });
        Kk.draw(P);
        return;
      }
      // colour, paper, width: the groups side by side
      const key = C.variable === 'colour' ? 'colour' : C.variable === 'paper' ? 'paper' : null, groups = key === 'colour' ? ['red', 'blue', 'white'] : key === 'paper' ? ['copy', 'card'] : ['3 cm (all of them)'];
      const items = [{ c: '#FFB35C', dot: true, label: 'each helicopter’s mean time' }, { c: 'rgba(201,212,234,.8)', label: 'group mean', w: 2.5 }];
      const Kk = K.plotKey(g, items);
      const ys = CLASS.map(r => r.mean);
      const P = g.Plot({ xmin: -0.5, xmax: groups.length - 0.5, ymin: Math.min(...ys) - 0.2, ymax: Math.max(...ys) + 0.2, pad: { t: Kk.t }, xticks: groups.map((_, i) => i), xfmt: v => groups[Math.round(v)] || '', ylabel: 'drop time, s', yfmt: v => v.toFixed(1) }).frame();
      const sel = new Set(J.rows.map(r => r.id));
      groups.forEach((gname, i) => {
        const rs = key ? CLASS.filter(r => r.d[key] === gname) : CLASS;
        rs.forEach((r, k) => P.dot(i + (k - (rs.length - 1) / 2) * 0.03, r.mean, sel.has(r.id) ? 4 : 3, sel.has(r.id) ? '#FFB35C' : 'rgba(201,212,234,.35)'));
        const st = stats(rs.filter(r => sel.has(r.id)).map(r => r.mean)); if (st.n) P.line([[i - 0.28, st.mean], [i + 0.28, st.mean]], 'rgba(201,212,234,.85)', 2.5);
      });
      Kk.draw(P);
      return;
    }
    // design: the true relation and the plan's points
    const D = designOf(S), tc = trueCurve(p), cats = p.q === 'paper' || p.q === 'colour';
    const items = [{ c: '#FFB35C', dot: true, label: 'the plan’s means' }, { c: '#9FE0A8', label: 'the truth, over a wider range', dash: [4, 3] }];
    const Kk = K.plotKey(g, items);
    const ys = tc.map(q => q[1]).concat(D.res.map(q => q.st.mean));
    const P = g.Plot({ xmin: cats ? -0.5 : tc[0][0], xmax: cats ? 2.5 : tc[tc.length - 1][0], ymin: Math.min(...ys) - 0.2, ymax: Math.max(...ys) + 0.2, pad: { t: Kk.t }, xticks: cats ? [0, 1, 2] : null, xfmt: v => cats ? (p.q === 'paper' ? ['tissue', 'copy', 'card'] : ['red', 'white', 'blue'])[Math.round(v)] || '' : v.toFixed(0), xlabel: VARS[p.q].name, ylabel: 'drop time, s', yfmt: v => v.toFixed(1) }).frame();
    P.clip(() => { P.line(tc, '#9FE0A8', 1.8, [4, 3]); D.res.forEach((q, i) => P.dot(cats ? i : p.q === 'length' ? q.d.L : q.d.clips, q.st.mean, 4.5, '#FFB35C')); });
    Kk.draw(P);
  }
  function plot2(S, g) {
    const p = S.p, K = kit();
    if (p.setup === 'fair' || p.setup === 'design') {
      // the design space: drop time against blade length for 0–3 clips, with the flutter zone
      const Hh = p.setup === 'design' ? p.HD : p.H, items = [0, 1, 2, 3].map(c => ({ c: ['#7FD4FF', '#9FE0A8', '#FFB35C', '#FF8A80'][c], label: c + ' clip' + (c === 1 ? '' : 's') })).concat([{ c: 'rgba(255,90,90,.25)', box: true, label: 'blades flutter' }]);
      const Kk = K.plotKey(g, items);
      const curves = spaceCurves(S, Hh), all = curves.flatMap(c => c.pts.map(q => q[1]));
      const P = g.Plot({ xmin: 4, xmax: 15, ymin: Math.floor(Math.min(...all) * 2) / 2, ymax: Math.ceil(Math.max(...all) * 2) / 2, pad: { t: Kk.t }, xlabel: 'blade length, cm (3 cm wide, copy paper)', ylabel: 'drop time, s', xfmt: v => v.toFixed(0), yfmt: v => v.toFixed(1) }).frame();
      const flutterFrom = 3.2 * 3;
      P.clip(() => {
        P.area([[flutterFrom, P.cfg.ymax], [15, P.cfg.ymax]], P.cfg.ymin, 'rgba(255,90,90,.10)');
        curves.forEach((c, i) => P.line(c.pts, ['#7FD4FF', '#9FE0A8', '#FFB35C', '#FF8A80'][i], 2));
        if (p.setup === 'fair') { const Fr = fairOf(S); [[Fr.A, '#7FD4FF'], [Fr.B, '#FFB35C']].forEach(([d, c]) => { if (d.paper === 'copy' && d.w === 3) P.dot(d.L, flight(d, Hh).t, 6, c, 'rgba(0,0,0,.6)'); }); }
      });
      P.tag(flutterFrom + 0.2, P.cfg.ymax - 0.12, 'too long for their width: they flutter', '#FF8A80');
      Kk.draw(P);
      return;
    }
    if (p.setup === 'trials') {
      const Tr = trialsOf(S), n = clamp(Math.floor(S.tt / 0.9) + 1, 1, p.nT), rows = Tr.rows.slice(1, n);
      const items = [{ c: '#FFB35C', label: 'difference ÷ its uncertainty' }, { c: '#9FE0A8', label: '2: told apart', dash: [4, 3] }];
      const Kk = K.plotKey(g, items);
      const ymax = Math.max(4, ...Tr.rows.map(r => r.ratio || 0)) * 1.1;
      const P = g.Plot({ xmin: 1, xmax: Math.max(2, p.nT), ymin: 0, ymax, pad: { t: Kk.t }, xlabel: 'drops of each', ylabel: 'signal ÷ noise', xfmt: v => Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : '', yfmt: v => v.toFixed(0) }).frame();
      P.clip(() => { P.hline(2, '#9FE0A8', [4, 3]); P.line(rows.map(r => [r.n, r.ratio]), '#FFB35C', 2.4); rows.forEach(r => P.dot(r.n, r.ratio, 2.5, '#FFB35C')); });
      Kk.draw(P);
      return;
    }
    // cer: the effect with its uncertainty, against zero
    const J = judge(p.claim, p.evidence);
    const items = [{ c: VERDICT_COL[J.verdict] || '#FFFFFF', label: 'the effect, ± twice its uncertainty', w: 3 }, { c: 'rgba(201,212,234,.6)', label: 'no effect', dash: [4, 3] }];
    const Kk = K.plotKey(g, items);
    let eff = null, unc = null, unit = '';
    if (J.F) { eff = J.F.b; unc = J.F.se; unit = J.C.variable === 'mass' ? 's per g' : 's per cm'; }
    else if (J.diff != null) { eff = J.diff; unc = J.unc; unit = 's (' + J.ka + ' − ' + J.kb + ')'; }
    const span = eff == null ? 1 : Math.max(Math.abs(eff) + 2.5 * (unc || 0), 0.05) * 1.4;
    const P = g.Plot({ xmin: -span, xmax: span, ymin: 0, ymax: 1, pad: { t: Kk.t, l: 20 }, yticks: [], xlabel: unit || 'effect', xfmt: v => v.toFixed(2), yfmt: () => '' }).frame();
    P.clip(() => {
      P.vline(0, 'rgba(201,212,234,.6)', [4, 3]);
      if (eff != null && isFinite(unc)) { const c = VERDICT_COL[J.verdict] || '#FFFFFF'; P.line([[eff - 2 * unc, 0.5], [eff + 2 * unc, 0.5]], c, 3); P.dot(eff, 0.5, 6, c, 'rgba(0,0,0,.6)'); }
    });
    if (eff == null) P.tag(-span * 0.9, 0.5, J.verdict === 'no evidence' ? 'nothing in the table varies this' : 'not enough rows to measure an effect', '#C9D4EA');
    Kk.draw(P);
  }
  function spaceCurves(S, Hh) {
    const key = 'sc' + Hh;
    if (S._sc && S._sc.key === key) return S._sc.curves;
    const curves = [0, 1, 2, 3].map(c => ({ c, pts: (() => { const out = []; for (let L2 = 4; L2 <= 15.01; L2 += 0.5) out.push([L2, flight(Object.assign({}, BASE_D, { L: L2, clips: c }), Hh).t]); return out; })() }));
    S._sc = { key, curves };
    return curves;
  }

  /* ============================================================
     READOUTS AND THE EQUATION
     ============================================================ */
  function readouts(S) {
    const p = S.p;
    if (p.setup === 'fair') {
      const Fr = fairOf(S), a = stats(Fr.dA.map(q => readOf(q, p.timing))), b = stats(Fr.dB.map(q => readOf(q, p.timing))), diff = b.mean - a.mean, unc = Math.sqrt(a.se * a.se + b.se * b.se);
      return [
        { label: 'A', value: a.mean.toFixed(2), unit: 's', hint: 'range ' + a.min.toFixed(2) + '–' + a.max.toFixed(2) },
        { label: 'B', value: b.mean.toFixed(2), unit: 's', hint: 'range ' + b.min.toFixed(2) + '–' + b.max.toFixed(2) },
        { label: 'B − A', value: diff.toFixed(2), unit: 's', flag: 'accent', hint: p.trials > 1 ? '± ' + unc.toFixed(2) + ' (the scatter)' : 'one drop each: no scatter known' },
        { label: 'Masses', value: (Fr.hA.m * 1000).toFixed(2) + ' / ' + (Fr.hB.m * 1000).toFixed(2), unit: 'g', flag: Math.abs(Fr.hA.m - Fr.hB.m) / Fr.hA.m > 0.02 && p.vary !== 'clips' ? 'warn' : '', hint: 'A / B' },
        { label: 'Fair test?', value: Fr.also.length ? 'no' : 'yes', flag: Fr.also.length ? 'crit' : 'accent', hint: Fr.also.length ? Fr.also.length + ' other thing' + (Fr.also.length > 1 ? 's' : '') + ' changed' : 'one variable changed' },
        { label: 'Descent speed', value: Fr.hA.vt.toFixed(2) + ' / ' + Fr.hB.vt.toFixed(2), unit: 'm/s', hint: '√(2mg ÷ ρCA)' }
      ];
    }
    if (p.setup === 'trials') {
      const Tr = trialsOf(S), n = clamp(Math.floor(S.tt / 0.9) + 1, 1, p.nT), r = Tr.rows[n - 1];
      return [
        { label: 'Drops of each', value: String(n), hint: 'of ' + p.nT },
        { label: 'B − A', value: r.diff.toFixed(3), unit: 's', flag: 'accent', hint: 'truly ' + Tr.trueDiff.toFixed(3) },
        { label: 'Its uncertainty', value: n > 1 ? r.unc.toFixed(3) : '—', unit: 's', hint: '√(sA²/n + sB²/n)' },
        { label: 'Signal ÷ noise', value: n > 1 ? r.ratio.toFixed(1) : '—', flag: r.ratio >= 2 ? 'accent' : 'warn', hint: 'told apart at 2' },
        { label: 'Told apart after', value: Tr.seen ? String(Tr.seen) : '> ' + p.nT, unit: 'drops', hint: p.timingT === 'watch' ? 'stopwatch' : 'light gates' }
      ];
    }
    if (p.setup === 'cer') {
      const J = judge(p.claim, p.evidence);
      return [
        { label: 'Evidence', value: String(J.rows.length), unit: 'helicopters', hint: 'of 24, 3 drops each' },
        { label: 'Effect', value: J.F ? J.F.b.toFixed(3) : J.diff != null ? J.diff.toFixed(3) : '—', unit: J.F ? (J.C.variable === 'mass' ? 's/g' : 's/cm') : J.diff != null ? 's' : '', hint: J.F ? 'slope of the best-fit line' : J.diff != null ? J.ka + ' − ' + J.kb : '' },
        { label: '± uncertainty', value: J.F ? J.F.se.toFixed(3) : J.unc != null && isFinite(J.unc) ? J.unc.toFixed(3) : '—', hint: 'supported if the effect is 2× this' },
        { label: 'Correlation', value: J.F ? J.F.r.toFixed(2) : '—', hint: '±1 a perfect line, 0 none' },
        { label: 'Verdict', value: J.verdict, flag: J.verdict === 'supported' ? 'accent' : J.verdict === 'overstated' || J.verdict === 'unfair comparison' ? 'warn' : 'crit' }
      ];
    }
    const D = designOf(S);
    return [
      { label: 'Plan score', value: D.score + ' / 5', flag: D.score === 5 ? 'accent' : D.score >= 3 ? 'warn' : 'crit', hint: 'checked before the run' },
      { label: 'Values tested', value: String(D.res.length), hint: VARS[p.q].name },
      { label: 'Drops in all', value: String(D.res.length * p.nD), hint: p.nD + ' of each' },
      { label: 'Time spent', value: (D.res.length * p.nD * 0.75).toFixed(0), unit: 'min', hint: 'about 45 s a drop, with the climb' },
      { label: 'Shortest → longest', value: Math.min(...D.res.map(q => q.st.mean)).toFixed(2) + ' → ' + Math.max(...D.res.map(q => q.st.mean)).toFixed(2), unit: 's' }
    ];
  }
  function equation(S) {
    const p = S.p, E = L.E;
    if (p.setup === 'fair' || p.setup === 'trials') {
      const d = p.setup === 'fair' ? fairOf(S).A : trialsOf(S).A, h = heli(d);
      return E.v('v') + ' ' + E.op('=') + ' √(' + E.frac('2' + E.v('m') + E.v('g'), E.v('ρ') + E.v('C') + E.v('A')) + ') ' + E.op('=') + ' √(' + E.frac('2 × ' + E.n(h.m * 1000, 'g') + ' × 9.81', '1.2 × ' + E.n(h.Cr, '') + ' × ' + E.n(h.A * 1e4, 'cm²')) + ') ' + E.op('=') + ' ' + E.n(h.vt, 'm/s') + '  (A: the disc the blades sweep, π' + E.v('L') + '²)';
    }
    if (p.setup === 'trials') return '';
    if (p.setup === 'cer') return 'supported when ' + E.frac('effect', 'its uncertainty') + ' ' + E.op('>') + ' 2  — and only for what the evidence rows actually varied';
    return 'a mean of ' + E.v('n') + ' drops is uncertain by ' + E.frac(E.v('s'), '√' + E.v('n')) + '  — the step between values must be bigger than that to be seen';
  }
  const EQ_NOTE = {
    fair: 'The spinning blades sweep a disc; to fall one metre the helicopter must push that disc of air aside. Drag grows as the speed squared, so it settles where drag equals weight: heavier falls faster (√m), a bigger disc slower (1/L). That is why longer blades cut from the same paper are not a fair test of length alone — they are heavier too.',
    trials: 'Each drop scatters a little: the release, a breath of air. Averaging n drops shrinks the uncertainty of a mean by √n — four times the drops, half the uncertainty. A difference is believable once it is about twice its own uncertainty.',
    cer: 'A claim needs evidence that varied what the claim is about, with everything else alike — and a reason that connects them. Rows that differ in several ways at once cannot pin an effect on one of them.',
    design: 'A good plan changes one thing, over a range wide enough to show the whole pattern, in enough steps to see its shape, with enough repeats to beat the scatter, timed well enough to see the steps.'
  };

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const RESTART = true;
  L.register({
    id: 'g6a-fair-test',
    grade: 6, unit: '6A', topics: ['A5'],
    subject: 'engineering',
    name: 'The Fair Test — Variables, Evidence and Investigation Design',
    chapter: 'Systems and Subsystems',
    exams: ['NGSS Science and Engineering Practices 3, 4 and 7', 'NGSS MS-ETS1-3 · supporting', 'CAST'],
    weight: 'Investigation',
    is3D: true,
    autoplay: true,
    bloom: 0.1,
    stageHint: 'Drag to turn the stairwell · scroll to zoom · every drop is computed',
    lede: 'A paper helicopter falls down a stairwell through two light gates, spinning as it goes. <b>Change one thing</b> and the lab names what you changed, what you measured, what you held — and what changed anyway. ' +
      '<b>Repeat</b> until a small difference stands clear of the scatter. Test a <b>claim</b> against the class’s data. And <b>plan</b> an investigation: the lab checks it before it runs it.',

    params: preset({}),
    presets: [
      { name: 'Longer blades — but from the same paper, so heavier too', params: preset({}) },
      { name: 'Longer blades, the mass kept the same', params: preset({ balance: true }) },
      { name: 'More paper clips', params: preset({ vary: 'clips' }) },
      { name: 'Red against white: a colour that changes nothing', params: preset({ vary: 'colour' }) },
      { name: 'B dropped with the window open', params: preset({ vary: 'colour', windowB: true }) },
      { name: 'Two designs 5 % apart, timed by stopwatch', params: preset({ setup: 'trials' }) },
      { name: 'The same, timed by light gates', params: preset({ setup: 'trials', timingT: 'gates' }) },
      { name: 'Claim: longer blades are slower', params: preset({ setup: 'cer' }) },
      { name: 'Claim: red helicopters are slower', params: preset({ setup: 'cer', claim: 'red' }) },
      { name: 'Claim: wider blades are slower', params: preset({ setup: 'cer', claim: 'wider' }) },
      { name: 'A careful plan: 5 to 14 cm, mass kept the same', params: preset({ setup: 'design', from: 5, to: 14, steps: 8 }) },
      { name: 'A hasty plan: 8 to 9 cm, one drop each, by stopwatch', params: preset({ setup: 'design', from: 8, to: 9, steps: 2, nD: 1, timingD: 'watch', HD: 1, balanceD: false }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, options: SETUPS } ] },
      { group: 'What you change', when: is('fair'), items: [
        { key: 'vary', type: 'select', label: 'Change', restructure: RESTART, options: [{ value: 'length', label: 'Blade length' }, { value: 'width', label: 'Blade width' }, { value: 'clips', label: 'Paper clips' }, { value: 'paper', label: 'Paper' }, { value: 'colour', label: 'Blade colour' }] },
        { key: 'aL', label: 'A: blade length', min: 4, max: 14, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.vary === 'length' },
        { key: 'bL', label: 'B: blade length', min: 4, max: 14, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.vary === 'length' },
        { key: 'aW', label: 'A: blade width', min: 2, max: 5, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.vary === 'width' },
        { key: 'bW', label: 'B: blade width', min: 2, max: 5, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.vary === 'width' },
        { key: 'aC', label: 'A: paper clips', min: 0, max: 4, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART, when: S => S.p.vary === 'clips' },
        { key: 'bC', label: 'B: paper clips', min: 0, max: 4, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART, when: S => S.p.vary === 'clips' },
        { key: 'aP', type: 'select', label: 'A: paper', restructure: RESTART, when: S => S.p.vary === 'paper', options: [{ value: 'tissue', label: 'Tissue' }, { value: 'copy', label: 'Copy' }, { value: 'card', label: 'Card' }] },
        { key: 'bP', type: 'select', label: 'B: paper', restructure: RESTART, when: S => S.p.vary === 'paper', options: [{ value: 'tissue', label: 'Tissue' }, { value: 'copy', label: 'Copy' }, { value: 'card', label: 'Card' }] },
        { key: 'aCol', type: 'select', label: 'A: blades', restructure: RESTART, when: S => S.p.vary === 'colour', options: [{ value: 'white', label: 'White' }, { value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' }] },
        { key: 'bCol', type: 'select', label: 'B: blades', restructure: RESTART, when: S => S.p.vary === 'colour', options: [{ value: 'white', label: 'White' }, { value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' }] } ] },
      { group: 'Keeping it fair', when: is('fair'), items: [
        { key: 'balance', type: 'toggle', label: 'Keep the mass the same (trim a clip to fit)' },
        { key: 'windowB', type: 'toggle', label: 'Drop B later, with the window open' } ] },
      { group: 'The drops', when: is('fair'), items: [
        { key: 'trials', label: 'Drops of each', min: 1, max: 10, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'timing', type: 'select', label: 'Timed by', restructure: RESTART, options: [{ value: 'gates', label: 'Light gates' }, { value: 'watch', label: 'Stopwatch' }] },
        { key: 'H', label: 'Drop height', min: 1, max: 3.5, step: 0.25, unit: 'm', fmt: v => v.toFixed(2), restructure: RESTART } ] },
      { group: 'Two close designs', when: is('trials'), items: [
        { key: 'dL', label: 'B’s blades longer by', min: 0.25, max: 2, step: 0.25, unit: 'cm', fmt: v => v.toFixed(2), restructure: RESTART },
        { key: 'nT', label: 'Drops of each', min: 2, max: 40, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'timingT', type: 'select', label: 'Timed by', restructure: RESTART, options: [{ value: 'watch', label: 'Stopwatch' }, { value: 'gates', label: 'Light gates' }] },
        { key: 'seed', label: 'Session (a new set of drops)', min: 1, max: 6, step: 1, unit: '', fmt: v => '#' + v.toFixed(0), restructure: RESTART } ] },
      { group: 'The argument', when: is('cer'), items: [
        { key: 'claim', type: 'select', label: 'Claim', restructure: RESTART, options: Object.keys(CLAIMS).map(k => ({ value: k, label: CLAIMS[k].text })) },
        { key: 'evidence', type: 'select', label: 'Evidence', restructure: RESTART, options: [{ value: 'alike', label: 'Helicopters alike in all else' }, { value: 'all', label: 'All 24 helicopters' }, { value: 'few', label: 'Just three helicopters' }] } ] },
      { group: 'The plan', when: is('design'), items: [
        { key: 'q', type: 'select', label: 'Investigate', restructure: RESTART, options: [{ value: 'length', label: 'Blade length' }, { value: 'clips', label: 'Paper clips' }, { value: 'paper', label: 'Paper' }, { value: 'colour', label: 'Blade colour' }] },
        { key: 'from', label: 'From', min: 4, max: 15, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.q === 'length' },
        { key: 'to', label: 'To', min: 4, max: 15, step: 0.5, unit: 'cm', fmt: v => v.toFixed(1), restructure: RESTART, when: S => S.p.q === 'length' },
        { key: 'cFrom', label: 'From', min: 0, max: 6, step: 1, unit: 'clips', fmt: v => v.toFixed(0), restructure: RESTART, when: S => S.p.q === 'clips' },
        { key: 'cTo', label: 'To', min: 0, max: 6, step: 1, unit: 'clips', fmt: v => v.toFixed(0), restructure: RESTART, when: S => S.p.q === 'clips' },
        { key: 'steps', label: 'Steps', min: 2, max: 8, step: 1, unit: 'values', fmt: v => v.toFixed(0), restructure: RESTART, when: S => S.p.q === 'length' || S.p.q === 'clips' },
        { key: 'balanceD', type: 'toggle', label: 'Keep the mass the same', when: S => S.p.q === 'length' } ] },
      { group: 'Measuring', when: is('design'), items: [
        { key: 'nD', label: 'Drops of each', min: 1, max: 10, step: 1, unit: '', fmt: v => v.toFixed(0), restructure: RESTART },
        { key: 'timingD', type: 'select', label: 'Timed by', restructure: RESTART, options: [{ value: 'gates', label: 'Light gates' }, { value: 'watch', label: 'Stopwatch' }] },
        { key: 'HD', label: 'Drop height', min: 1, max: 3.5, step: 0.25, unit: 'm', fmt: v => v.toFixed(2), restructure: RESTART } ] }
    ],

    setup,
    step,
    drawStage,
    onPointer(S, x, y, down, type) {
      if (type !== 'pointerdown') return;
      if (window.KITMS && window.KITMS.chipHit(S, x, y)) return;
    },

    plots: [
      { title: S => ({ fair: 'Every drop of A and B', trials: 'The means as the drops add up', cer: 'The class’s data, and the rows chosen as evidence', design: 'What the plan could see, against the whole pattern' })[S.p.setup], draw(S, g) { plot1(S, g); } },
      { title: S => ({ fair: 'The design space: drop time against blade length and clips', trials: 'How clearly the difference shows', cer: 'The effect, with twice its uncertainty', design: 'The design space: drop time against blade length and clips' })[S.p.setup], draw(S, g) { plot2(S, g); } }
    ],

    readouts,
    equation,
    eqNote: S => EQ_NOTE[S.p.setup],

    problems: [
      { source: 'NGSS SEP 4 · a model of the fall',
        q: 'A copy-paper helicopter with 8 cm blades and one paper clip has a mass of 1.27 g. Once it is spinning, how fast does it fall?',
        params: preset({}),
        predict: { label: 'descent speed', unit: 'm/s', tol: 0.06 },
        measure: () => heli(BASE_D).vt,
        working: 'The blades sweep a disc of area πL² = π × 0.08² = 0.0201 m². It falls steadily when the air’s push, ½ρCAv², equals its weight mg: v = √(2mg ÷ ρCA) = √(2 × 0.00127 × 9.81 ÷ (1.2 × 1.2 × 0.0201)) ≈ 0.93 m/s — about a metre a second, as paper helicopters do.' },
      { source: 'NGSS SEP 3 · a hidden variable',
        q: 'You cut 10 cm blades instead of 7 cm ones, both 3 cm wide, from the same copy paper (80 g/m²). How many milligrams heavier is the 10 cm helicopter?',
        params: preset({}),
        predict: { label: 'extra mass', unit: 'mg', tol: 0.08 },
        measure: () => (heli(Object.assign({}, BASE_D, { L: 10 })).m - heli(Object.assign({}, BASE_D, { L: 7 })).m) * 1e6,
        working: 'Two blades 3 cm wide and 3 cm longer each: 2 × 3 × 3 = 18 cm² more paper, at 80 g per m² (0.008 g per cm²): about 0.14 g, 144 mg. Heavier falls faster — so it hides part of what the longer blades do. Not a fair test of length until the mass is matched.' },
      { source: 'NGSS SEP 4 · predict a drop',
        q: 'How long does the 8 cm, one-clip helicopter take to fall 3 m from rest?',
        params: preset({}),
        predict: { label: 'drop time', unit: 's', tol: 0.04 },
        measure: () => flight(BASE_D, 3).t,
        working: 'At 0.93 m/s, 3 m would take 3.2 s; but it starts from rest and falls fast while the rotor spins up in its first 25 cm, gaining back a little: about 3.14 s.' },
      { source: 'NGSS SEP 4 · how many trials',
        q: 'B’s blades are 0.5 cm longer than A’s, masses matched. Timed by stopwatch, after how many drops of each is the difference at least twice its uncertainty?',
        params: preset({ setup: 'trials' }),
        predict: { label: 'drops of each', unit: '', tol: 0.5 },
        measure: S => trialsOf(S).seen || S.p.nT,
        working: 'The true difference is about 0.18 s; one drop scatters by about 0.12 s (3.5 % of 3.2 s, plus the stopwatch). The difference of two means of n drops is uncertain by 0.12 × √(2 ÷ n): it drops below 0.09 (half of 0.18) once n is about 4.' },
      { source: 'NGSS SEP 7 · evidence against a claim',
        q: 'In the class table, how much faster do the card helicopters fall than the copy-paper ones with the same 8 cm blades and one clip?',
        params: preset({ setup: 'cer', claim: 'card' }),
        predict: { label: 'faster by', unit: 's', tol: 0.15 },
        measure: () => { const J = judge('card', 'alike'); return -J.diff; },
        working: 'Card is twice as heavy as copy paper (160 against 80 g/m²): the card helicopter weighs 2.08 g against 1.27 g, and falls √(2.08 ÷ 1.27) ≈ 1.28 times as fast — 3.15 s becomes about 2.5 s, 0.6 s faster. The claim is contradicted.' },
      { source: 'NGSS SEP 3 · the range of an investigation',
        q: 'At what blade length does a 3 cm-wide, one-clip, copy-paper helicopter take longest to fall 3 m?',
        params: preset({ setup: 'design', from: 5, to: 14, steps: 8, balanceD: false }),
        predict: { label: 'blade length', unit: 'cm', tol: 0.1 },
        measure: () => { let best = 4, bt = 0; for (let L2 = 4; L2 <= 15.001; L2 += 0.25) { const t = flight(Object.assign({}, BASE_D, { L: L2 }), 3).t; if (t > bt) { bt = t; best = L2; } } return best; },
        working: 'Longer blades sweep a bigger disc, until they are about 3.2 times as long as they are wide (9.6 cm here); beyond that thin paper cannot hold the shape and the blades flutter. The slowest fall is just past the onset, at about 10 cm. A plan that stopped at 9 cm would never see the peak.' }
    ],
    walkthrough: [
      { title: 'Is it a fair test?', ask: 'A has 7 cm blades, B 10 cm, cut from the same paper. B falls more slowly. Is that the blade length?',
        reveal: 'Not only. Longer blades use more paper: B is 0.14 g heavier, and heavier falls faster. Two things changed at once — the lab lists the mass as “also changed”. Keep the mass the same with a trimmed clip, and only the length differs.', params: preset({}) },
      { title: 'Now only the length', ask: 'Keep the mass the same. Is B still slower — by more or by less?',
        reveal: 'By more: the extra paper was hiding part of the effect. With the masses matched, the whole difference is the length.', params: preset({ balance: true }) },
      { title: 'A colour that changes nothing', ask: 'Red blades on B, white on A — and B dropped later, with the window open. B is slower. Is red slower?',
        reveal: 'No. Air rising up the stairwell from the open window slowed B. Colour cannot push air; the window can. A variable you did not mean to change changed with the one you did.', params: preset({ vary: 'colour', windowB: true }) },
      { title: 'How many drops?', ask: 'Two designs 5 % apart, timed by stopwatch. How many drops of each before the difference is twice its uncertainty? And with light gates?',
        reveal: 'With the stopwatch, several; with gates, fewer — the gates add no reaction time, but the drops still scatter by a few percent. The uncertainty of a mean shrinks as 1/√n.', params: preset({ setup: 'trials' }) },
      { title: 'Is red slower?', ask: 'Test the claim “red helicopters fall more slowly than blue ones” against the helicopters alike in everything else.',
        reveal: 'Not supported: 3.13 against 3.15 s, a difference smaller than twice its uncertainty. And with all 24 rows it is an unfair comparison — red and blue ones differ in other ways too.', params: preset({ setup: 'cer', claim: 'red' }) },
      { title: 'Always slower?', ask: 'Test “longer blades make a helicopter fall more slowly” with the careful 5–14 cm series.',
        reveal: 'Overstated: true up to about 11 cm, then the long thin blades flutter and fall faster. A claim is only as wide as the evidence behind it.', params: preset({ setup: 'cer', claim: 'longer' }) },
      { title: 'A hasty plan', ask: 'Blades of 8 and 8.5 cm, one drop each, by stopwatch from 1 m. What can this plan find?',
        reveal: 'Almost nothing: the step is smaller than the scatter, one drop shows no scatter at all, the stopwatch’s error is large on a one-second drop, and two values cannot show a curve. It also changes the mass.', params: preset({ setup: 'design', from: 8, to: 8.5, steps: 2, nD: 1, timingD: 'watch', HD: 1, balanceD: false }) },
      { title: 'A careful plan', ask: 'From 5 to 14 cm in 8 steps, three drops each, by gates, the mass kept the same. What shape does it find?',
        reveal: 'A rise, a peak near 11 cm, and a fall where the blades flutter — the whole pattern, each point sure to a few hundredths of a second.', params: preset({ setup: 'design', from: 5, to: 14, steps: 8 }) }
    ],
    quiz: [
      { q: 'In “does blade length change the time a helicopter takes to fall?”, the independent variable is…', options: ['the blade length', 'the time to fall', 'the height of the drop', 'the paper'], answer: 0,
        explain: 'The independent variable is the one you change on purpose.' },
      { q: 'And the dependent variable is…', options: ['the blade length', 'the time to fall', 'the number of clips', 'the colour'], answer: 1,
        explain: 'The dependent variable is the one you measure — it depends on what you changed.' },
      { q: 'Longer blades cut from the same paper are not a fair test of blade length because…', options: ['longer blades are harder to cut', 'the helicopter is heavier too', 'the colour changes', 'the drop is shorter'], answer: 1,
        explain: 'More paper means more mass; two variables changed at once. Match the mass with a trimmed clip.' },
      { q: 'A is dropped in the morning; B in the afternoon with the window open. What is wrong?', options: ['nothing', 'the air in the stairwell may differ — a variable you did not control', 'B needs more clips', 'the timing is too precise'], answer: 1,
        explain: 'Everything except the variable being tested must stay the same — including the air.' },
      { q: 'Why drop each design several times?', options: ['to make it more fun', 'to see the scatter and average it out', 'because the first drop always fails', 'to use up paper'], answer: 1,
        explain: 'Each drop differs a little; repeats show how much, and their average is surer.' },
      { q: 'A claim based on three helicopters, each dropped three times, is…', options: ['proved', 'too little evidence', 'wrong', 'a fair test'], answer: 1,
        explain: 'A few rows cannot separate a real effect from the scatter.' },
      { q: 'Longer blades are slower from 5 to 11 cm and faster beyond. “Longer blades are always slower” is…', options: ['supported', 'overstated', 'contradicted', 'not a claim'], answer: 1,
        explain: 'True over part of the range; the claim says more than the evidence shows.' },
      { q: 'A plan tests 8 cm and 8.5 cm blades once each by stopwatch from 1 m. Its biggest problem is…', options: ['the paper colour', 'the difference is smaller than the scatter and the timing error', 'too many drops', 'the height is too great'], answer: 1,
        explain: 'Widen the range, add steps and repeats, and time a longer drop or use light gates.' }
    ],
    notes: '<b>Where this shows up.</b><ul>' +
      '<li><b>Maple seeds</b> — a samara autorotates exactly as the paper helicopter does; its long fall lets the wind carry it away from its parent tree.</li>' +
      '<li><b>Helicopters</b> — when the engine stops, a helicopter autorotates: the air rushing up through the rotor keeps it spinning, and the pilot uses that spin to land.</li>' +
      '<li><b>Fair tests everywhere</b> — a medicine is tested against a look-alike pill given the same way at the same time, so that the medicine is the only difference; engineers change one design variable at a time, or use designs that separate them.</li>' +
      '<li><b>Claims</b> — scientific papers state how their evidence was chosen and how sure each number is, so readers can check whether the claim is as wide as the evidence.</li></ul>' +
      '<b>What the lab assumes.</b> The spinning rotor is a drag disc of radius the blade length, drag coefficient 1.2; the strip falls with drag 0.5 on a quarter of the disc until the rotor spins up over its first 25 cm. Paper: tissue 25, copy 80, card 160 g/m²; a paper clip 0.45 g. ' +
      'A blade longer than about 3.2 widths (copy paper; card 5.3, tissue 2.3) flutters and the rotor loses up to 65 % of its drag. Each drop’s drag scatters by 7 % — its time by about 3.5 % — more when fluttering; an open window sends air up the stairwell at 0.1 m/s. Gates read to 1 ms; the stopwatch as in the Measurement Bench.'
  });

  const MODEL = { heli, flight, drops, stats, designsOf, CLASS, CLAIMS, judge, evidenceRows, fitLine, designPlan, BASE_D, PAPER, BASE: () => preset({}) };
  L.models = L.models || {};
  L.models['g6a-fair-test'] = MODEL;
})(window.InsightLab);
