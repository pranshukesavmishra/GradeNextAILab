/* ============================================================
   ART-G6B-5 — figures for 6B-6 Stimulus, Signal, Response, Memory:
   skin in section with its touch receptors and a map of receptive fields
   under a two-point caliper; a nerve conduction study; a choice-reaction
   board; a brain in profile with its areas; the knee-jerk reflex arc; a
   word list recalled; a ball thrown at a hand. Extends window.G6B.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G6B, TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
  const mix = G.mix, rgba = G.rgba, mono = G.mono, rng = G.rng, smooth = G.smooth, spline = G.spline;

  /* ============================================================
     RECEPTORS — the skin with its four touch receptors and free endings;
     o.firing (0…1 each) flashes the ones the stimulus drives
     ============================================================ */
  function receptorSkin(ctx, x, y, w, h, o) {
    const r = rng(101), epi = h * 0.18, t = o.t || 0;
    // epidermis ridges and dermis
    ctx.save(); const dg = ctx.createLinearGradient(0, y, 0, y + h); dg.addColorStop(0, '#E8C0B0'); dg.addColorStop(1, '#D89C8C'); ctx.fillStyle = dg; ctx.fillRect(x, y, w, h); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y); for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(x + u * w, y + epi + Math.sin(u * 24) * epi * 0.25); } ctx.lineTo(x + w, y); ctx.closePath(); const eg = ctx.createLinearGradient(0, y, 0, y + epi); eg.addColorStop(0, '#F0DCC8'); eg.addColorStop(1, '#D8A8A0'); ctx.fillStyle = eg; ctx.fill(); ctx.restore();
    const flash = (k, cx, cy, R) => { const f = o.firing[k] || 0; if (f <= 0.01) return; const on = ((t * (5 + 25 * f) + cx * 0.01) % 1) < 0.35; if (!on) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2); g.addColorStop(0, rgba('#FFE070', 0.7 * f)); g.addColorStop(1, 'rgba(255,224,112,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, TAU); ctx.fill(); ctx.restore(); };
    const nerve = (a, b) => RX.tube(ctx, spline([a, [lerp(a[0], b[0], 0.5) + 8, lerp(a[1], b[1], 0.5)], b], 6), 1.6, '#E8C870', {});
    const bottom = [x + w * 0.5, y + h];
    // Meissner corpuscles in the papillae: light touch, fast adapting
    const A = {};
    for (let k = 0; k < 3; k++) { const cx = x + w * (0.12 + k * 0.1), cy = y + epi * 1.25; RX.volume(ctx, c => { c.beginPath(); c.ellipse(cx, cy, 5, 10, 0, 0, TAU); }, { fill: '#F4D8A8', r: 8, cx, cy, shadow: 0.2 }); nerve([cx, cy + 10], [cx + 20, y + h]); flash('meissner', cx, cy, 8); if (!k) A.meissner = [cx, cy]; }
    // Merkel discs at the base of the epidermis: pressure, slowly adapting
    for (let k = 0; k < 4; k++) { const cx = x + w * (0.45 + k * 0.035), cy = y + epi * 0.95; RX.ball(ctx, cx, cy, 3.4, '#8AC8E8', { shadow: false }); nerve([cx, cy + 3], [cx + 10, y + h]); flash('merkel', cx, cy, 4); if (!k) A.merkel = [cx, cy]; }
    // free nerve endings into the epidermis: pain and temperature
    for (let k = 0; k < 4; k++) { const cx = x + w * (0.66 + k * 0.04); RX.tube(ctx, spline([[cx, y + h], [cx - 4, y + epi * 2], [cx + 3, y + epi * 1.1], [cx - 2, y + epi * 0.55]], 6), 1.2, '#E8C870', {}); flash('free', cx - 2, y + epi * 0.6, 5); if (!k) A.free = [cx - 2, y + epi * 0.6]; }
    // Pacinian corpuscle deep in the dermis: vibration, onion-layered
    const pc = [x + w * 0.86, y + h * 0.72];
    for (let k = 6; k >= 1; k--) { ctx.save(); ctx.beginPath(); ctx.ellipse(pc[0], pc[1], 9 + k * 3.2, 5 + k * 2, -0.3, 0, TAU); ctx.fillStyle = mix('#F4E8D8', '#D8C0B0', k / 6); ctx.fill(); ctx.strokeStyle = 'rgba(150,120,100,.6)'; ctx.stroke(); ctx.restore(); }
    nerve([pc[0] - 8, pc[1] + 6], [pc[0] - 40, y + h]); flash('pacinian', pc[0], pc[1], 18); A.pacinian = pc;
    // the probe pressing down
    if (o.press) { const px = x + w * (o.at || 0.5); ctx.save(); ctx.fillStyle = '#C8CED6'; ctx.beginPath(); ctx.moveTo(px - 3, y - 30); ctx.lineTo(px + 3, y - 30); ctx.lineTo(px + 1, y + o.press * 6); ctx.lineTo(px - 1, y + o.press * 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    return A;
  }
  /* a patch of skin seen from above: receptive fields of the touch nerves, two caliper points */
  function fieldMap(ctx, cx, cy, R, o) {
    const sp = o.spacing, k = R / o.fov, r = rng(7);          // spacing in mm; px per mm = R / half-field
    ctx.save(); ctx.fillStyle = '#E8C8B4'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // fingerprint-like ridges where the skin has them
    if (o.ridges) { ctx.strokeStyle = 'rgba(160,110,90,.35)'; ctx.lineWidth = 1.2; for (let j = -30; j <= 30; j++) { ctx.beginPath(); for (let i = -40; i <= 40; i++) { const u = cx + i * R / 40, v = cy + j * 0.5 * k + Math.sin(i * 0.2 + j) * 3; i === -40 ? ctx.moveTo(u, v) : ctx.lineTo(u, v); } ctx.stroke(); } }
    // receptive fields: overlapping circles on a jittered grid
    const n = Math.ceil(o.fov / sp) + 1, fieldsHit = [];
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const fx = cx + (i + (r() - 0.5) * 0.5 + (j % 2) * 0.5) * sp * k, fy = cy + (j * 0.87 + (r() - 0.5) * 0.4) * sp * k;
      if (Math.abs(fx - cx) > R + 20 || Math.abs(fy - cy) > R + 20) continue;
      const rr = sp * 0.75 * k, hitA = Math.hypot(fx - o.p1[0], fy - o.p1[1]) < rr, hitB = Math.hypot(fx - o.p2[0], fy - o.p2[1]) < rr;
      ctx.strokeStyle = hitA || hitB ? 'rgba(255,214,107,.9)' : 'rgba(120,80,90,.35)'; ctx.lineWidth = hitA || hitB ? 1.8 : 1;
      ctx.beginPath(); ctx.arc(fx, fy, rr, 0, TAU); ctx.stroke();
      ctx.fillStyle = hitA || hitB ? '#FFD66B' : 'rgba(100,60,80,.5)'; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // the two caliper tips
    [o.p1, o.p2].forEach(q => { RX.ball(ctx, q[0], q[1], 5, '#C8CED6', {}); });
    ctx.save(); ctx.strokeStyle = 'rgba(200,206,214,.7)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(o.p1[0], o.p1[1]); ctx.lineTo(o.p2[0], o.p2[1]); ctx.stroke(); ctx.restore();
  }
  /* a forearm and hand lying palm-up; lift (m) raises the hand end, pivoting at the elbow */
  const SKIN = '#D8A88E';
  function armHand(F, x, y, lift) {
    const L = v => (v + 0.24) / 0.44 * (lift || 0), z = (v, h) => h + L(v);
    R3.tube(F, [[x - 0.24, y, z(-0.24, 0.045)], [x - 0.08, y, z(-0.08, 0.042)], [x + 0.02, y, z(0.02, 0.04)]], t => 0.036 - 0.01 * t, SKIN, { segments: 16 });
    R3.box(F, [x + 0.07, y, z(0.07, 0.03)], [0.1, 0.085, 0.03], SKIN, {});
    for (let k = 0; k < 4; k++) R3.tube(F, [[x + 0.12, y - 0.032 + k * 0.021, z(0.12, 0.035)], [x + 0.19 - Math.abs(k - 1.5) * 0.012, y - 0.034 + k * 0.022, z(0.19, 0.03)]], 0.0085, SKIN, { segments: 8 });
    R3.tube(F, [[x + 0.05, y - 0.045, z(0.05, 0.03)], [x + 0.09, y - 0.08, z(0.09, 0.03)]], 0.01, SKIN, { segments: 8 });
  }
  /* a volunteer's head on a stand, facing +x: the upper lip at the front */
  function head(F, x, y) {
    R3.cylinder(F, [x - 0.02, y, 0.016], [x - 0.02, y, 0.11], 0.035, SKIN, { segments: 16 });
    R3.sphere(F, [x, y, 0.2], 0.09, SKIN, {});
    R3.sphere(F, [x + 0.088, y, 0.225], 0.016, SKIN, {});                        // nose
    R3.box(F, [x + 0.08, y, 0.19], [0.012, 0.04, 0.006], '#B8706A', {});          // lips
    [-1, 1].forEach(k => R3.sphere(F, [x + 0.07, y + k * 0.032, 0.25], 0.01, '#2A2A30', { shadow: false }));   // eyes, closed by a band
    R3.cylinder(F, [x + 0.004, y, 0.236], [x + 0.004, y, 0.254], 0.08, '#2E3440', { segments: 24 });   // a blindfold
    R3.sphere(F, [x - 0.015, y, 0.23], 0.088, '#3A2A20', {});                    // hair
  }
  /* a volunteer lying face down: the back */
  function backTorso(F, x, y) {
    R3.tube(F, [[x - 0.22, y, 0.09], [x, y, 0.1], [x + 0.2, y, 0.095]], t => 0.075 - 0.01 * Math.abs(t - 0.5), SKIN, { segments: 20 });
    R3.sphere(F, [x + 0.27, y, 0.09], 0.06, '#3A2A20', {});
    R3.box(F, [x, y, 0.163], [0.36, 0.004, 0.004], '#A8705A', { shadow: false });   // the line of the spine
  }
  /* the 3D bench: a hand palm-up on a pad (or a head, or a back), a two-point caliper (or a weight on the palm) */
  function touchBench(F, at, o) {
    const [x, y] = at;
    R3.box(F, [x, y, 0.008], [0.42, 0.16, 0.016], '#3A4A6A', { bias: F.GROUND });
    if (o.part === 'face') head(F, x, y); else if (o.part === 'back') backTorso(F, x, y); else armHand(F, x, y, 0);
    const site = o.site;
    if (o.mode === 'weight') { const m = o.mass; R3.cylinder(F, [site[0], site[1], site[2]], [site[0], site[1], site[2] + 0.008 + 0.004 * Math.cbrt(m)], 0.012 + 0.006 * Math.cbrt(m / 50), '#8A9098', { segments: 18 }); }
    else {
      // the caliper: two steel points, their separation along y, the bar above
      const s = o.sep / 1000 / 2, top = site[2] + 0.07;
      const face = o.part === 'face', d = face ? [1, 0, 0] : [0, 0, 1], tip = k => [site[0], site[1] + k * Math.max(s, 0.0008), site[2]], far = k => { const q = tip(k); return [q[0] + d[0] * 0.07, q[1], q[2] + d[2] * 0.07]; };
      [-1, 1].forEach(k => R3.cylinder(F, tip(k), far(k), 0.0015, '#C8CED6', { segments: 6 }));
      const c = far(0); R3.box(F, [c[0] + d[0] * 0.004, c[1], c[2] + d[2] * 0.004], [face ? 0.008 : 0.01, Math.max(0.02, 2 * s + 0.012), face ? 0.01 : 0.008], '#5A6474', {});
    }
  }

  /* ============================================================
     PATHWAY — a nerve conduction study: stimulator on the foot, recording at the back
     ============================================================ */
  function conductionBench(F, at, o) {
    const [x, y] = at, cold = clamp(o.cold || 0, 0, 1), limb = c => mix(SKIN, '#9AB4DC', cold * c);
    R3.box(F, [x, y, 0.01], [0.9, 0.24, 0.02], '#3A4A6A', { bias: F.GROUND });
    // a leg lying along the couch: thigh, knee, shin, foot — bluer the colder it is
    R3.tube(F, [[x - 0.4, y, 0.08], [x - 0.15, y, 0.075], [x + 0.05, y, 0.06], [x + 0.32, y, 0.045]], t => 0.07 - 0.04 * t, limb(0.5), { segments: 16 });
    R3.box(F, [x + 0.37, y, 0.07], [0.05, 0.08, 0.1], limb(1), {});
    // the stimulating electrode at the stimulus site, recording electrode at the hip
    const s = o.stimAt;
    R3.cylinder(F, [s[0], s[1], s[2]], [s[0], s[1] - 0.06, s[2] + 0.05], 0.006, '#C83030', { segments: 8 });
    R3.cylinder(F, [x - 0.36, y - 0.07, 0.12], [x - 0.36, y - 0.12, 0.16], 0.006, '#3060D8', { segments: 8 });
    R3.box(F, [x - 0.1, y - 0.25, 0.06], [0.2, 0.1, 0.12], '#2E3440', {});
    if (o.screen) R3.texPlane(F, [x - 0.1, y - 0.3005, 0.07], [0.085, 0, 0], [0, 0, -0.045], o.screen, { grid: 2, bias: -0.03 });
    // the signals, as glowing beads moving up the leg
    (o.beads || []).forEach(b => R3.sphere(F, [lerp(s[0], x - 0.36, b.f), y, lerp(s[2], 0.08, b.f) + 0.01], 0.008, b.col, { shadow: false, bias: -0.02 }));
  }

  /* ============================================================
     PROCESSING — a choice-reaction board, and the brain at work
     ============================================================ */
  function reactionBoard(F, at, o) {
    const [x, y] = at, n = o.n;
    R3.box(F, [x, y, 0.02], [0.44, 0.2, 0.04], '#2E3440', {});
    for (let k = 0; k < 10; k++) {
      const px = x - 0.18 + k * 0.04, active = k < n, lit = active && o.lit === k;
      R3.cylinder(F, [px, y + 0.05, 0.04], [px, y + 0.05, 0.048], 0.012, active ? (lit ? '#FFE070' : '#8A8A68') : '#20242C', { segments: 14, shadow: false });
      R3.cylinder(F, [px, y - 0.04, 0.04], [px, y - 0.04, 0.052 - (o.pressed === k ? 0.006 : 0)], 0.014, active ? '#3A6AD8' : '#20242C', { segments: 14, shadow: false });
    }
    if (o.lcd) { R3.box(F, [x + 0.28, y, 0.06], [0.1, 0.08, 0.12], '#2E3440', {}); R3.texPlane(F, [x + 0.28, y - 0.0405, 0.08], [0.04, 0, 0], [0, 0, -0.022], o.lcd, { grid: 1, bias: -0.03 }); }
  }
  /* the brain in profile: lobes, the sensory and motor strips, the visual cortex, the cerebellum,
     hippocampus (for memory), brainstem and cord; o.lit: { visual, sensory, motor, assoc, hippo } 0…1 */
  function brainSide(ctx, cx, cy, R, o) {
    const lit = o.lit || {}, glow = (k, x, y, rr, col) => { const f = lit[k] || 0; if (f <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, rgba(col, 0.6 * f)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.restore(); };
    const out = [[-1, 0.15], [-0.95, -0.35], [-0.6, -0.78], [0, -0.92], [0.55, -0.75], [0.95, -0.3], [1.0, 0.12], [0.8, 0.42], [0.45, 0.5], [0.1, 0.42], [-0.3, 0.55], [-0.75, 0.5]];
    const path = c => smooth(c, out.map(q => [cx + q[0] * R, cy + q[1] * R]), true);
    // cerebellum and brainstem under the back
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(cx - R * 0.55, cy + R * 0.62, R * 0.36, R * 0.22, 0.15, 0, TAU); }, { fill: '#D08890', r: R * 0.3, cx: cx - R * 0.55, cy: cy + R * 0.6, shadow: 0.3 });
    RX.tube(ctx, [[cx - R * 0.05, cy + R * 0.42], [cx - R * 0.15, cy + R * 0.9], [cx - R * 0.2, cy + R * 1.3]], R * 0.1, '#E0B898', {});
    RX.volume(ctx, path, { fill: '#E3A5A0', r: R, cx, cy: cy - R * 0.2, shadow: 0.35 });
    // gyri
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(120,40,50,.4)'; ctx.lineWidth = Math.max(1, R * 0.018);
    const r = rng(3); for (let k = 0; k < 26; k++) { const a = r() * TAU, d = r() * R * 0.8, px = cx + Math.cos(a) * d, py = cy - R * 0.2 + Math.sin(a) * d * 0.7; ctx.beginPath(); ctx.moveTo(px, py); ctx.bezierCurveTo(px + R * 0.12, py - R * 0.1, px + R * 0.05, py + R * 0.15, px + R * 0.2, py + R * 0.05); ctx.stroke(); }
    // central sulcus (motor in front, sensory behind) and the lateral fissure
    ctx.lineWidth = Math.max(1.5, R * 0.03); ctx.strokeStyle = 'rgba(90,20,30,.7)';
    ctx.beginPath(); ctx.moveTo(cx + R * 0.05, cy - R * 0.9); ctx.quadraticCurveTo(cx - R * 0.08, cy - R * 0.4, cx + R * 0.02, cy + R * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + R * 0.55, cy + R * 0.22); ctx.quadraticCurveTo(cx, cy + R * 0.05, cx - R * 0.35, cy - R * 0.05); ctx.stroke();
    ctx.restore();
    const P = { motor: [cx + R * 0.12, cy - R * 0.55], sensory: [cx - R * 0.15, cy - R * 0.55], visual: [cx - R * 0.88, cy + R * 0.0], assoc: [cx + R * 0.6, cy - R * 0.4], hippo: [cx - R * 0.15, cy + R * 0.25], hearing: [cx + R * 0.1, cy + R * 0.25], cerebellum: [cx - R * 0.55, cy + R * 0.62], cord: [cx - R * 0.2, cy + R * 1.25] };
    glow('motor', P.motor[0], P.motor[1], R * 0.35, '#FF6A6A'); glow('sensory', P.sensory[0], P.sensory[1], R * 0.35, '#6AD8FF'); glow('visual', P.visual[0], P.visual[1], R * 0.35, '#9FE0B8'); glow('assoc', P.assoc[0], P.assoc[1], R * 0.45, '#FFD66B'); glow('hippo', P.hippo[0], P.hippo[1], R * 0.3, '#C89BFF'); glow('hearing', P.hearing[0], P.hearing[1], R * 0.3, '#6AD8FF');
    return P;
  }

  /* ============================================================
     REFLEX — the knee on the bench, and the reflex arc
     ============================================================ */
  function kneeBench(F, at, o) {
    const [x, y] = at, kick = o.kick || 0;
    // a stool edge, the thigh on it, the shin hanging and swinging with the kick
    R3.box(F, [x - 0.1, y, 0.2], [0.3, 0.3, 0.04], '#5A4A38', {});
    [[-0.22, -0.12], [-0.22, 0.12], [0.02, -0.12], [0.02, 0.12]].forEach(([a, b]) => R3.cylinder(F, [x + a, y + b, 0], [x + a, y + b, 0.18], 0.012, '#4A3A28', { segments: 8 }));
    const knee = [x + 0.06, y, 0.25];
    R3.tube(F, [[x - 0.24, y, 0.25], [x - 0.08, y, 0.255], knee], t => 0.06 - 0.012 * t, '#D8A88E', { segments: 16 });
    const a = kick * 0.9, foot = [knee[0] + Math.sin(a) * 0.36, y, knee[2] - Math.cos(a) * 0.36];
    R3.tube(F, [knee, [lerp(knee[0], foot[0], 0.5), y, lerp(knee[2], foot[2], 0.5)], foot], t => 0.045 - 0.015 * t, '#D8A88E', { segments: 14 });
    R3.box(F, [foot[0] + 0.04 * Math.cos(a), y, foot[2] + 0.04 * Math.sin(a) - 0.01], [0.1, 0.06, 0.04], '#D8A88E', { axes: [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]] });
    // the reflex hammer at the tendon below the kneecap
    const hz = knee[2] - 0.06, swing = o.hammer || 0;
    R3.cylinder(F, [knee[0] + 0.1 + swing * 0.04, y, hz + 0.12], [knee[0] + 0.045, y, hz], 0.004, '#C8CED6', { segments: 6 });
    R3.box(F, [knee[0] + 0.045, y, hz], [0.03, 0.05, 0.02], '#C83030', {});
    return { knee, foot };
  }
  /* withdrawal: the forearm and hand over a hot plate, snatched up by lift (m) */
  function hotplateBench(F, at, o) {
    const [x, y] = at, heat = o.heat == null ? 1 : o.heat;
    R3.box(F, [x, y, 0.008], [0.42, 0.16, 0.016], '#3A4A6A', { bias: F.GROUND });
    R3.box(F, [x + 0.1, y, 0.03], [0.16, 0.16, 0.028], '#E8ECF0', {});
    R3.cylinder(F, [x + 0.1, y, 0.044], [x + 0.1, y, 0.047], 0.055, mix('#3A3A40', '#E0402A', heat), { segments: 24, shadow: false });
    armHand(F, x - 0.02, y, o.lift || 0);
  }
  /* the arc: stretch receptor in the quadriceps → sensory neuron → spinal cord → motor neuron → muscle; the
     path to and from the brain dashed; o.cut (spinal cord cut above), o.phase (signal position 0…1 round the arc) */
  function reflexArc(ctx, x, y, w, h, o) {
    const X = u => x + u * w, Y = v => y + v * h;
    // spinal cord in section: butterfly grey matter
    const sc = [X(0.25), Y(0.32)], R = Math.min(w, h) * 0.13;
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(sc[0], sc[1], R * 1.2, R, 0, 0, TAU); }, { fill: '#F0E4D0', r: R, cx: sc[0], cy: sc[1], shadow: 0.25 });
    ctx.save(); ctx.fillStyle = '#C8A8B0'; ctx.beginPath(); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], i) => { ctx.ellipse(sc[0] + a * R * 0.35, sc[1] + b * R * 0.35, R * 0.3, R * 0.45, a * b * 0.6, 0, TAU); }); ctx.fill(); ctx.restore();
    // the muscle: quadriceps on a thigh, the tendon, the kneecap
    const mu = [X(0.7), Y(0.62)];
    RX.tube(ctx, spline([[X(0.45), Y(0.55)], [X(0.62), Y(0.6)], [X(0.82), Y(0.64)]], 8), t => R * (0.5 + 0.4 * Math.sin(Math.PI * t)), o.kick > 0.05 ? '#E04850' : '#B8404A', {});
    RX.tube(ctx, [[X(0.82), Y(0.64)], [X(0.92), Y(0.7)]], R * 0.12, '#F0E8D8', {});
    RX.ball(ctx, X(0.92), Y(0.68), R * 0.25, '#E8E0CC', {});
    // the spindle (stretch receptor) inside the muscle
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(mu[0], mu[1], R * 0.3, R * 0.1, 0.1, 0, TAU); }, { fill: '#F4D8A8', r: R * 0.2, cx: mu[0], cy: mu[1], shadow: 0 });
    // sensory neuron (blue) into the dorsal horn; motor neuron (red) out of the ventral horn
    const sens = spline([mu, [X(0.55), Y(0.4)], [X(0.4), Y(0.2)], [sc[0] + R * 0.3, sc[1] - R * 0.4]], 10), mot = spline([[sc[0] + R * 0.3, sc[1] + R * 0.4], [X(0.42), Y(0.5)], [X(0.6), Y(0.66)], [mu[0] - R * 0.2, mu[1] + R * 0.1]], 10);
    RX.tube(ctx, sens, 2.6, '#5A8AE0', {}); RX.tube(ctx, mot, 2.8, '#E05A5A', {});
    RX.ball(ctx, X(0.38), Y(0.18), R * 0.12, '#5A8AE0', {});
    // the path up to the brain and back, dashed, cut if the cord is cut
    ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = o.cut ? 'rgba(255,106,96,.6)' : 'rgba(200,214,234,.6)';
    ctx.beginPath(); ctx.moveTo(sc[0] - R * 0.2, sc[1] - R); ctx.lineTo(sc[0] - R * 0.2, Y(0.02)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sc[0] + R * 0.2, Y(0.02)); ctx.lineTo(sc[0] + R * 0.2, sc[1] - R); ctx.stroke(); ctx.restore();
    if (o.cut) { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sc[0] - R * 0.6, Y(0.1)); ctx.lineTo(sc[0] + R * 0.6, Y(0.14)); ctx.stroke(); ctx.restore(); }
    // the signal's position round the arc
    if (o.phase != null && o.phase >= 0 && o.phase <= 1) { const P = o.phase < 0.5 ? sens[Math.min(sens.length - 1, Math.floor(o.phase * 2 * (sens.length - 1)))] : mot[Math.min(mot.length - 1, Math.floor((o.phase - 0.5) * 2 * (mot.length - 1)))]; ctx.save(); ctx.shadowColor = '#FFE070'; ctx.shadowBlur = 14; ctx.fillStyle = '#FFE070'; ctx.beginPath(); ctx.arc(P[0], P[1], 5, 0, TAU); ctx.fill(); ctx.restore(); }
    // a relay neuron for the withdrawal reflex
    if (o.relay) RX.ball(ctx, sc[0] + R * 0.1, sc[1], R * 0.13, '#9FE0B8', {});
    return { cord: sc, spindle: mu, sens: sens[Math.floor(sens.length * 0.4)], mot: mot[Math.floor(mot.length * 0.5)], brain: [sc[0], Y(0.04)] };
  }

  /* ============================================================
     MEMORY — the word list, recalled
     ============================================================ */
  function wordGrid(ctx, x, y, w, h, words, o) {
    const cols = 4, rows = Math.ceil(words.length / cols), cw = w / cols, ch = Math.min(26, h / rows);
    ctx.save(); ctx.font = mono(Math.min(12, ch * 0.5), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    words.forEach((wd, i) => {
      const cx = x + (i % cols + 0.5) * cw, cy = y + (Math.floor(i / cols) + 0.5) * ch, rec = o.recalled[i], shown = i <= o.shown;
      ctx.fillStyle = !shown ? 'rgba(255,255,255,.04)' : rec ? 'rgba(159,224,184,.18)' : 'rgba(255,138,128,.10)'; ctx.fillRect(cx - cw / 2 + 3, cy - ch / 2 + 2, cw - 6, ch - 4);
      ctx.fillStyle = !shown ? '#3A4458' : rec ? '#9FE0B8' : '#7A6A70'; ctx.fillText(shown ? wd : '·····', cx, cy);
      if (i === o.now) { ctx.save(); ctx.strokeStyle = '#FFE070'; ctx.lineWidth = 2; ctx.strokeRect(cx - cw / 2 + 2, cy - ch / 2 + 1, cw - 4, ch - 2); ctx.restore(); }
      if (shown && o.done) { ctx.font = mono(8.5, 500); ctx.fillStyle = '#98A6C6'; ctx.fillText(String(i + 1), cx - cw / 2 + 10, cy - ch / 2 + 7); ctx.font = mono(Math.min(12, ch * 0.5), 700); }
    });
    ctx.restore();
    return rows * ch;
  }

  /* the stores (Atkinson & Shiffrin 1968): senses → short-term memory (a few items, seconds) → long-term memory, with
     rehearsal looping in short-term memory; o.stm, o.ltm: the recalled words found in each, o.lure: a made-up word */
  function memoryStores(ctx, x, y, w, h, o) {
    const bw = (w - 40) / 3, by = y + 20, bh = h - 30;
    const box = (i, title, sub, col, words, fade) => {
      const bx = x + i * (bw + 20);
      ctx.save(); ctx.fillStyle = rgba(col, 0.1); ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 8) : ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = mono(9.5, 700); ctx.fillStyle = col; ctx.fillText(title, bx + bw / 2, by + 6);
      ctx.font = mono(8.5, 500); ctx.fillStyle = '#98A6C6'; ctx.fillText(sub, bx + bw / 2, by + 19);
      ctx.font = mono(10, 700);
      (words || []).slice(0, Math.floor((bh - 40) / 13)).forEach((wd, k) => { ctx.globalAlpha = wd.alpha == null ? 1 : wd.alpha; ctx.fillStyle = wd.col || '#EAF1FF'; ctx.fillText(wd.t, bx + bw / 2, by + 36 + k * 13); });
      ctx.globalAlpha = 1; if (fade) { ctx.font = mono(8.5, 500); ctx.fillStyle = '#FF8A80'; ctx.fillText(fade, bx + bw / 2, by + bh - 16); }
      ctx.restore(); return bx;
    };
    box(0, 'senses', 'under a second', '#8FD4FA', [{ t: o.now || '…' }]);
    const b1 = box(1, 'short-term', 'a few words, seconds', '#FFD66B', o.stm, o.delay >= 15 ? 'pushed out by counting' : '');
    const b2 = box(2, 'long-term', 'rehearsed in', '#9FE0B8', o.ltm.concat(o.lure ? [{ t: o.lure + ' (never shown)', col: '#FF8A80' }] : []));
    G.arrow(ctx, x + bw + 2, by + bh / 2, b1 - 2, by + bh / 2, '#C9D4EA', 1.6);
    G.arrow(ctx, b1 + bw + 2, by + bh / 2, b2 - 2, by + bh / 2, '#C9D4EA', 1.6);
    // the rehearsal loop over short-term memory
    ctx.save(); ctx.strokeStyle = 'rgba(255,214,107,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(b1 + bw / 2, by - 2, 12, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.restore();
    G.tag(ctx, b1 + bw / 2, by - 20, 'rehearsal', { size: 8.5, col: '#FFD66B' });
  }

  /* ============================================================
     TOGETHER — a ball thrown at a hand
     ============================================================ */
  /* a standing person facing +x (k = 1) or −x (k = −1); hand: where the throwing or catching hand is */
  function person(F, x, y, k, shirt, hand) {
    [-1, 1].forEach(s => R3.tube(F, [[x, y + s * 0.1, 0], [x, y + s * 0.1, 0.45], [x, y + s * 0.09, 0.9]], 0.065, '#2E3A58', { segments: 10 }));
    R3.tube(F, [[x, y, 0.9], [x, y, 1.2], [x, y, 1.42]], t => 0.17 - 0.03 * t, shirt, { segments: 14 });
    R3.sphere(F, [x, y, 1.6], 0.11, SKIN, {});
    R3.sphere(F, [x - k * 0.02, y, 1.64], 0.105, '#3A2A20', {});
    const sh = [x, y - 0.2, 1.38]; R3.tube(F, [sh, [lerp(sh[0], hand[0], 0.5), lerp(sh[1], hand[1], 0.5), lerp(sh[2], hand[2], 0.5) - 0.05], hand], 0.04, shirt, { segments: 10 });
    R3.tube(F, [[x, y + 0.2, 1.38], [x, y + 0.24, 1.1], [x + k * 0.05, y + 0.24, 0.85]], 0.04, shirt, { segments: 10 });
  }
  function catchBench(F, at, o) {
    const [x, y] = at, d = o.dist;
    // the floor of a sports hall, a line every metre, the wall behind
    R3.box(F, [x + d / 2, y, -0.01], [d + 3, 3, 0.02], '#B8895A', { bias: F.GROUND });
    for (let m = 0; m <= d; m++) R3.box(F, [x + m, y, 0.001], [0.025, 2.6, 0.002], '#F4ECD8', { shadow: false, bias: F.GROUND });
    R3.box(F, [x + d / 2, y + 1.5, 1.6], [d + 3, 0.04, 3.2], '#C8D2DC', {});
    // the catcher at x, hand up (or down), the thrower at x + d
    const ready = o.ready !== false, hand = ready ? [x + 0.3, y - 0.25, 1.45] : [x + 0.1, y - 0.3, 0.85];
    person(F, x - 0.05, y, 1, '#C8404A', hand);
    R3.sphere(F, [hand[0] + 0.04, hand[1], hand[2]], o.closed ? 0.06 : 0.075, '#9A6A38', {});      // the glove
    person(F, x + d + 0.05, y, -1, '#3A6AD8', [x + d - 0.25, y - 0.25, 1.75]);
    // the ball, along its path
    if (o.ball) R3.sphere(F, o.ball, 0.08, '#F4F0E4', {});                               // drawn about twice real size, to be seen
    (o.trail || []).forEach(q => R3.sphere(F, q, 0.025, '#B8B0A0', { shadow: false }));
    return { hand };
  }

  Object.assign(G, { receptorSkin, fieldMap, touchBench, hotplateBench, armHand, memoryStores, conductionBench, reactionBoard, brainSide, kneeBench, reflexArc, wordGrid, catchBench });
})();
