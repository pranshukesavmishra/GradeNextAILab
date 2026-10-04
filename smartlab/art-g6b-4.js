/* ============================================================
   ART-G6B-4 — figures for 6B-5 The Body During Exercise: a cycle
   ergometer with a metabolic cart and gas supply, a glucometer
   bench, a grip dynamometer with EMG electrodes and an oscilloscope;
   and the plates — the whole body working (heart, lungs, muscles, skin,
   gut and kidneys drawn at the activity the lab computed), the blood
   flow shared between organs, the motor-neuron pool, the route of
   glucose from gut to cells. Extends window.G6B.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G6B, TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
  const mix = G.mix, rgba = G.rgba, mono = G.mono, rng = G.rng, smooth = G.smooth, spline = G.spline;

  /* ============================================================
     3D: the cycle ergometer, the metabolic cart, the gas
     ============================================================ */
  function ergometer(F, at, o) {
    const [x, y] = at, ph = o.phase || 0, steel = '#C8CED6', frame = '#3A4250';
    // base and frame
    R3.box(F, [x, y, 0.015], [0.5, 0.08, 0.03], frame, {});
    R3.box(F, [x, y, 0.015], [0.06, 0.4, 0.03], frame, {});
    R3.tube(F, [[x - 0.14, y, 0.03], [x - 0.08, y, 0.3], [x - 0.06, y, 0.5]], 0.018, frame, { segments: 12 });           // seat tube
    R3.tube(F, [[x - 0.12, y, 0.08], [x + 0.18, y, 0.42], [x + 0.2, y, 0.55]], 0.016, frame, { segments: 12 });          // down tube to the bars
    R3.box(F, [x - 0.06, y, 0.52], [0.13, 0.07, 0.03], '#20242C', {});                                                    // saddle
    R3.tube(F, [[x + 0.2, y - 0.14, 0.58], [x + 0.2, y, 0.56], [x + 0.2, y + 0.14, 0.58]], 0.01, '#30343C', { segments: 10 });   // handlebars
    // flywheel in front, with a marker that turns with the pedalling
    const fw = [x + 0.12, y, 0.2];
    R3.cylinder(F, [fw[0], fw[1] - 0.02, fw[2]], [fw[0], fw[1] + 0.02, fw[2]], 0.17, '#5A6270', { segments: 36 });
    R3.cylinder(F, [fw[0], fw[1] - 0.022, fw[2]], [fw[0], fw[1] + 0.022, fw[2]], 0.03, steel, { segments: 16, shadow: false });
    for (let k = 0; k < 3; k++) { const a = ph * 3 + k * TAU / 3; R3.box(F, [fw[0] + Math.cos(a) * 0.1, fw[1] - 0.023, fw[2] + Math.sin(a) * 0.1], [0.025, 0.004, 0.025], '#E8C040', { shadow: false, bias: -0.02 }); }
    // crank and pedals
    const ck = [x - 0.03, y, 0.15];
    R3.cylinder(F, [ck[0], ck[1] - 0.04, ck[2]], [ck[0], ck[1] + 0.04, ck[2]], 0.03, steel, { segments: 16 });
    [-1, 1].forEach(s => { const a = ph + (s > 0 ? Math.PI : 0), p = [ck[0] + Math.cos(a) * 0.08, ck[1] + s * 0.05, ck[2] + Math.sin(a) * 0.08]; R3.cylinder(F, [ck[0], ck[1] + s * 0.045, ck[2]], p, 0.007, steel, { segments: 8, shadow: false }); R3.box(F, [p[0], p[1] + s * 0.03, p[2]], [0.06, 0.05, 0.012], '#20242C', {}); });
    // the load display on the handlebars
    if (o.lcd) { R3.box(F, [x + 0.2, y, 0.62], [0.02, 0.1, 0.06], '#20242C', {}); R3.texPlane(F, [x + 0.189, y, 0.62], [0, 0.045, 0], [0, 0, -0.024], o.lcd, { grid: 1, bias: -0.03 }); }
    return { mouth: [x - 0.02, y, 0.85] };
  }
  /* the metabolic cart: analysers in a trolley, a screen, a hose to the mouthpiece */
  function cart(F, at, o) {
    const [x, y] = at;
    R3.box(F, [x, y, 0.3], [0.2, 0.18, 0.5], '#D8DCE2', {});
    [[-0.08, -0.07], [0.08, -0.07], [-0.08, 0.07], [0.08, 0.07]].forEach(([a, b]) => R3.cylinder(F, [x + a, y + b, 0.0], [x + a, y + b, 0.05], 0.022, '#30343C', { segments: 10, shadow: false }));
    R3.box(F, [x, y - 0.02, 0.66], [0.24, 0.03, 0.16], '#20242C', {});
    if (o.screen) R3.texPlane(F, [x, y - 0.0365, 0.66], [0.11, 0, 0], [0, 0, -0.07], o.screen, { grid: 2, bias: -0.03 });
    // the hose to the mouthpiece
    if (o.mouth) R3.tube(F, [[x - 0.08, y, 0.5], [x - 0.2, y, 0.62], [lerp(x, o.mouth[0], 0.6), y, o.mouth[2] + 0.05], o.mouth], 0.012, '#8A9AA8', { segments: 10 });
    if (o.mouth) R3.sphere(F, o.mouth, 0.025, '#5A6878', {});
  }
  function gasCylinder(F, at, col, name) {
    const [x, y] = at;
    R3.cylinder(F, [x, y, 0], [x, y, 0.55], 0.06, col, { segments: 22 });
    R3.sphere(F, [x, y, 0.55], 0.06, col, { shadow: false });
    R3.cylinder(F, [x, y, 0.6], [x, y, 0.66], 0.015, '#C8CED6', { segments: 10 });
    if (name) R3.label(F, [x, y - 0.065, 0.35], name, '#F2F6FF', { size: 10 });
  }
  /* the glucometer bench: a bottle of glucose drink, the meter showing mmol/L, test strips */
  function glucoseBench(F, at, o) {
    const [x, y] = at;
    MEAS.beaker(F, [x - 0.12, y, 0], 0.04, 0.12, 0.12 * clamp(o.drink, 0, 1), { tint: '#F4EAC8' });
    R3.box(F, [x + 0.04, y - 0.02, 0.015], [0.07, 0.12, 0.03], '#E8EAEE', {});
    if (o.lcd) R3.texPlane(F, [x + 0.04, y - 0.035, 0.0305], [0.028, 0, 0], [0, 0.022, 0], o.lcd, { grid: 1, bias: -0.03 });
    R3.box(F, [x + 0.04, y + 0.045, 0.031], [0.008, 0.03, 0.002], '#F0F0F0', { shadow: false });
    R3.box(F, [x + 0.14, y + 0.05, 0.02], [0.05, 0.03, 0.04], '#3A6AA8', {});
    R3.cylinder(F, [x + 0.15, y - 0.07, 0.006], [x + 0.22, y - 0.05, 0.006], 0.006, '#E85A6A', { segments: 8 });
    // a plate and the food
    R3.cylinder(F, [x - 0.02, y + 0.12, 0], [x - 0.02, y + 0.12, 0.008], 0.07, '#F4F4F0', { segments: 28 });
    if (o.food === 'bread') R3.box(F, [x - 0.02, y + 0.12, 0.022], [0.07, 0.06, 0.025], '#D8A860', {});
    if (o.food === 'pasta') for (let k = 0; k < 8; k++) R3.tube(F, [[x - 0.05 + k * 0.008, y + 0.1, 0.013], [x - 0.04 + k * 0.007, y + 0.14, 0.016]], 0.004, '#F0D890', { segments: 5, round: false });
  }
  /* a grip dynamometer: forearm on a pad, the handle, three EMG electrodes on the forearm, an oscilloscope */
  function gripBench(F, at, o) {
    const [x, y] = at;
    R3.box(F, [x - 0.06, y, 0.008], [0.4, 0.14, 0.016], '#3A4A6A', { bias: F.GROUND });
    R3.tube(F, [[x - 0.26, y, 0.05], [x - 0.12, y, 0.048], [x, y, 0.045]], t => 0.038 - 0.01 * t, '#D8A88E', { segments: 16 });
    // the hand round the dynamometer's handle
    R3.box(F, [x + 0.06, y, 0.06], [0.04, 0.09, 0.1], '#5A6474', {});
    R3.box(F, [x + 0.03, y, 0.06], [0.03, 0.06, 0.07], '#D8A88E', {});
    for (let k = 0; k < 4; k++) R3.tube(F, [[x + 0.03, y - 0.03 + k * 0.02, 0.09], [x + 0.08, y - 0.03 + k * 0.02, 0.1 - o.squeeze * 0.012], [x + 0.085, y - 0.03 + k * 0.02, 0.06]], 0.0075, '#D0A088', { segments: 8 });
    if (o.dial) { R3.cylinder(F, [x + 0.06, y - 0.046, 0.12], [x + 0.06, y - 0.052, 0.12], 0.032, '#E8EAEE', { segments: 22 }); R3.texPlane(F, [x + 0.06, y - 0.053, 0.12], [0.028, 0, 0], [0, 0, -0.028], o.dial, { grid: 1, bias: -0.02 }); }
    // EMG electrodes and leads
    [-0.2, -0.15, -0.1].forEach((ex, i) => { R3.cylinder(F, [x + ex, y - 0.01, 0.083 - i * 0.002], [x + ex, y - 0.01, 0.088 - i * 0.002], 0.009, i === 2 ? '#2A2A2A' : '#D8D8D8', { segments: 12, shadow: false }); R3.tube(F, [[x + ex, y - 0.01, 0.088], [x + ex + 0.02, y - 0.1, 0.12], [x - 0.02, y - 0.2, 0.08]], 0.0015, ['#D83030', '#3060D8', '#202020'][i], { segments: 4, round: false }); });
    // the oscilloscope
    R3.box(F, [x - 0.04, y - 0.22, 0.07], [0.22, 0.1, 0.14], '#2E3440', {});
    if (o.screen) R3.texPlane(F, [x - 0.04, y - 0.2705, 0.08], [0.09, 0, 0], [0, 0, -0.05], o.screen, { grid: 2, bias: -0.03 });
  }

  /* ============================================================
     2D: the body at work
     a: { hr, ve, flowMuscle (0..1), sweat (0..1), gutFlow (0..1), kidneyFlow (0..1), hot (0..1), fault }
     ============================================================ */
  function bodyAtWork(ctx, cx, top, H, a) {
    const A = G.body(ctx, cx, top, H, { show: { circ: true, resp: true, dig: true, exc: true, nerv: false, musc: true }, beat: a.beat, flow: a.flow, pulse: true, off: a.off || null });
    const X = v => cx + v * H, Y = v => top + v * H, S = v => v * H;
    // working muscles glow with the blood sent to them
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[-0.057, 0.62, 0.045, 0.09], [0.057, 0.62, 0.045, 0.09], [-0.05, 0.83, 0.028, 0.07], [0.05, 0.83, 0.028, 0.07]].forEach(([u, v, rx, ry]) => { const g = ctx.createRadialGradient(X(u), Y(v), 0, X(u), Y(v), S(rx * 1.4)); g.addColorStop(0, rgba('#FF5040', 0.45 * a.flowMuscle)); g.addColorStop(1, 'rgba(255,80,64,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X(u), Y(v), S(rx * 1.4), S(ry * 1.4), 0, 0, TAU); ctx.fill(); });
    // skin flushing when hot
    const sg = ctx.createRadialGradient(X(0), Y(0.35), S(0.05), X(0), Y(0.4), S(0.3)); sg.addColorStop(0, 'rgba(255,90,90,0)'); sg.addColorStop(1, rgba('#FF6060', 0.2 * a.hot)); ctx.fillStyle = sg; ctx.fillRect(X(-0.3), Y(0), S(0.6), S(1));
    ctx.restore();
    // gut and kidneys dim as their blood is sent to the muscles
    ctx.save(); ctx.fillStyle = rgba('#0A0E18', 0.55 * (1 - a.gutFlow)); ctx.beginPath(); ctx.ellipse(X(0), Y(0.43), S(0.08), S(0.07), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba('#0A0E18', 0.55 * (1 - a.kidneyFlow)); [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(X(s * 0.05), Y(0.38), S(0.022), S(0.032), 0, 0, TAU); ctx.fill(); }); ctx.restore();
    // sweat on the skin
    const r = rng(91), n = Math.round(a.sweat * 40);
    for (let k = 0; k < n; k++) { const u = (r() - 0.5) * 0.22, v = 0.12 + r() * 0.5, f = ((a.t || 0) * 0.3 + r()) % 1; RX.ball(ctx, X(u), Y(v) + f * S(0.03), Math.max(1.4, S(0.005)), '#A8D8F8', { shadow: false }); }
    // breaths: puffs from the mouth, as big as the breathing
    const vb = clamp(a.ve / 120, 0.05, 1), ph = ((a.t || 0) * (0.2 + a.ve / 60)) % 1;
    ctx.save(); ctx.strokeStyle = rgba('#C8E4F8', 0.6 * (1 - ph)); ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(X(0.05 + ph * 0.08 * vb), Y(0.095), S(0.01 + 0.03 * vb * ph) + k * 3, -0.8, 0.8); ctx.stroke(); } ctx.restore();
    return A;
  }
  /* where the blood goes: rest and now, each organ a bar */
  function flowBars(ctx, x, y, w, rows, o) {
    const lh = o.lh || 22, max = o.max;
    ctx.save(); ctx.font = mono(9.5, 600); ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      const yy = y + i * lh;
      ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'left'; ctx.fillText(r.name, x, yy + 8);
      const bx = x + w * 0.3, bw = w * 0.52;
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(bx, yy + 1, bw, 14);
      ctx.fillStyle = 'rgba(201,212,234,.35)'; ctx.fillRect(bx, yy + 2, bw * clamp(r.rest / max, 0, 1), 5);
      ctx.fillStyle = r.col; ctx.fillRect(bx, yy + 8, bw * clamp(r.now / max, 0, 1), 7);
      ctx.fillStyle = '#AFC0D8'; ctx.textAlign = 'right'; ctx.fillText(r.now.toFixed(r.now < 1 ? 2 : 1) + ' L/min', x + w, yy + 8);
    });
    ctx.restore();
    return rows.length * lh;
  }
  /* the motor-neuron pool: small neurons first (size principle); each lit when recruited, flashing as it fires */
  function motorPool(ctx, x, y, w, h, units, o) {
    // the spinal cord's ventral horn on the left, the muscle on the right
    ctx.save(); const cg = ctx.createLinearGradient(x, 0, x + w * 0.3, 0); cg.addColorStop(0, '#3A3044'); cg.addColorStop(1, '#2A2234'); ctx.fillStyle = cg; ctx.fillRect(x, y, w * 0.3, h); ctx.restore();
    ctx.save(); const mg = ctx.createLinearGradient(x + w * 0.62, 0, x + w, 0); mg.addColorStop(0, '#5A2028'); mg.addColorStop(1, '#3A1418'); ctx.fillStyle = mg; ctx.fillRect(x + w * 0.62, y, w * 0.38, h); ctx.restore();
    const n = units.length, show = Math.min(n, 24), step = n / show;
    for (let k = 0; k < show; k++) {
      const u = units[Math.floor(k * step)], yy = y + h * (0.05 + 0.9 * (k + 0.5) / show), rr = 3 + 7 * u.size;
      const fire = u.on && ((o.t || 0) * u.rate % 1) < 0.18;
      const col = u.dead ? '#3A3A44' : u.on ? (fire ? '#FFE070' : '#E8B040') : '#5A5A78';
      RX.ball(ctx, x + w * 0.15, yy, rr, col, { shadow: false });
      RX.tube(ctx, [[x + w * 0.15 + rr, yy], [x + w * 0.62, yy]], Math.max(0.8, 0.8 + u.size * 1.4), u.on ? '#E8C870' : '#4A4A60', {});
      // the fibres it drives: more fibres for a bigger unit, fatigued ones paler
      const nf = 1 + Math.round(u.size * 6);
      for (let j = 0; j < nf; j++) { const fx = x + w * 0.64 + j * (w * 0.34 / 7); RX.tube(ctx, [[fx, yy - 4], [fx + w * 0.03, yy + 4]], 2.2, u.dead ? '#3A2A2A' : u.on ? mix('#E04048', '#8A4048', 1 - u.cap) : '#6A3038', {}); }
    }
    return { pool: [x + w * 0.15, y + 14], fibres: [x + w * 0.8, y + 14] };
  }
  /* glucose from gut to cells, drawn on the body: small intestine → portal vein → liver → heart → muscles and brain;
     insulin from the pancreas. Particles move along the route at the rates the lab computed. */
  function glucoseRoute(ctx, x, y, w, h, o) {
    const t = o.t || 0, H = h * 0.98, cx = x + w * 0.3;
    const A = G.body(ctx, cx, y + 4, H, { show: { circ: true, resp: false, dig: true, exc: false, nerv: false }, focus: 'dig', beat: o.beat || 0, flow: 0, pulse: false });
    const route = (pts, n, rate, col, r) => { const P = spline(pts, 12); for (let k = 0; k < n; k++) { const f = (t * rate + k / n) % 1, i = Math.min(P.length - 1, Math.floor(f * (P.length - 1))); RX.ball(ctx, P[i][0], P[i][1], r, col, { shadow: false }); } };
    const ga = clamp(o.absorb, 0, 1.5), gl = clamp(o.glucose / 10, 0, 1.5);
    const gut = A.smallInt, liv = A.liver, hrt = A.heart, leg = [cx + 0.055 * H, y + 0.66 * H], brain = A.brain, panc = A.pancreas;
    route([gut, [gut[0] - 0.01 * H, gut[1] - 0.05 * H], [liv[0] + 0.02 * H, liv[1] + 0.02 * H], liv], Math.round(2 + ga * 10), 0.45, '#FFE070', 2.6);
    route([liv, [liv[0] + 0.02 * H, liv[1] - 0.05 * H], hrt], Math.round(2 + gl * 5), 0.4, '#FFE070', 2.6);
    route([hrt, [hrt[0] + 0.005 * H, hrt[1] + 0.12 * H], [cx + 0.02 * H, y + 0.48 * H], leg], Math.round(2 + gl * 6), 0.35, '#FFE070', 2.6);
    route([hrt, [hrt[0] + 0.01 * H, hrt[1] - 0.1 * H], brain], 3, 0.35, '#FFE070', 2.4);
    const ni = Math.round(clamp(o.insulin / 60, 0, 1) * 10);
    route([panc, [panc[0] + 0.03 * H, panc[1] + 0.08 * H], leg], ni, 0.5, '#6AA8FF', 2.4);
    return { gut, liver: liv, heart: hrt, body: leg, panc, brain };
  }
  /* a small scope trace on a canvas, for the cart and the oscilloscope */
  function traceTex(cv, series, opts) {
    const c = cv || document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
    x.fillStyle = '#081210'; x.fillRect(0, 0, 320, 200);
    x.strokeStyle = 'rgba(80,200,140,.18)'; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * 40, 0); x.lineTo(i * 40, 200); x.stroke(); } for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(0, i * 40); x.lineTo(320, i * 40); x.stroke(); }
    series.forEach(s => { x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); s.pts.forEach((p, i) => { const px = p[0] * 320, py = 200 - p[1] * 190 - 5; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); });
    if (opts && opts.text) { x.fillStyle = '#7CF0C0'; x.font = '700 22px "IBM Plex Mono",monospace'; opts.text.forEach((t, i) => x.fillText(t, 10, 28 + i * 26)); }
    return c;
  }

  Object.assign(G, { ergometer, cart, gasCylinder, glucoseBench, gripBench, bodyAtWork, flowBars, motorPool, glucoseRoute, traceTex });
})();
