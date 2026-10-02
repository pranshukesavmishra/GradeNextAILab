/* ============================================================
   ART-G6B-3 — figures for 6B-4 The Body Systems Bench: one classic
   experiment per system. 3D bench pieces (a water bath with a spotting
   tile, urine collections with a urinometer, a model circulation with a
   clamped branch, the bell-jar lung, the forearm lever model, the ruler
   drop) and the plates beside them (starch being cut by amylase, a
   nephron, an artery with a plaque, the chest and diaphragm, the arm's
   bones and muscles, the reaction pathway). Extends window.G6B.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G6B, TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
  const mix = G.mix, rgba = G.rgba, mono = G.mono, rng = G.rng, smooth = G.smooth, spline = G.spline;
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ============================================================
     DIGESTIVE — the water bath and the spotting tile
     ============================================================ */
  /* a white tile of 12 wells, each holding a drop of iodine and a drop sampled from the tube: its colour */
  let tileCv = null, tileKey = '';
  function spotTileTex(cols) {
    const key = cols.join('|'); if (tileCv && tileKey === key) return tileCv;
    const c = tileCv || cv(320, 240), x = c.getContext('2d');
    x.fillStyle = '#F4F4F0'; x.fillRect(0, 0, 320, 240);
    for (let i = 0; i < 12; i++) {
      const cx = 46 + (i % 4) * 76, cy = 46 + Math.floor(i / 4) * 74;
      const g = x.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 28); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C8C8C4');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 28, 0, TAU); x.fill();
      if (cols[i]) { const d = x.createRadialGradient(cx - 5, cy - 6, 2, cx, cy, 22); d.addColorStop(0, G.mix(cols[i], '#FFFFFF', 0.35)); d.addColorStop(1, cols[i]); x.fillStyle = d; x.beginPath(); x.arc(cx, cy, 21, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(cx - 7, cy - 8, 6, 3, -0.6, 0, TAU); x.fill(); }
      x.fillStyle = '#7A7A80'; x.font = '600 13px "IBM Plex Mono",monospace'; x.textAlign = 'center'; x.fillText(String(i + 1), cx, cy + 40);
    }
    tileCv = c; tileKey = key; return c;
  }
  function waterBath(F, at, o) {
    const [x, y] = at;
    MEAS.hotplate(F, [x, y, 0], { top: o.T, w: 0.2, d: 0.24 });
    const z0 = 0.095;
    MEAS.beaker(F, [x, y - 0.01, z0], 0.06, 0.13, 0.1, { tint: o.T > 45 ? '#E8EEF0' : '#D8EAF4', T: o.T });
    // the reaction tube in the bath, starch and amylase, and a thermometer beside it
    CELL.testTube(F, [x - 0.012, y - 0.01, z0 + 0.008], { r: 0.009, h: 0.15, level: 0.55, liquid: o.tubeCol || '#F0EEE6', cloud: o.cloud || 0.3 });
    R3.cylinder(F, [x + 0.025, y - 0.01, z0 + 0.01], [x + 0.025, y - 0.01, z0 + 0.2], 0.0028, '#EEF4F8', { segments: 8, shadow: false, ambient: 0.7 });
    R3.cylinder(F, [x + 0.025, y - 0.01, z0 + 0.01], [x + 0.025, y - 0.01, z0 + 0.01 + 0.13 * clamp((o.T + 10) / 110, 0, 1)], 0.0012, '#D8282A', { segments: 6, shadow: false, bias: -0.004 });
    // the spotting tile
    const tx = x + 0.2, ty = y - 0.06;
    CELL.tile(F, [tx, ty, 0], 0.13, 0.1, {});
    R3.texPlane(F, [tx, ty, 0.0062], [0.064, 0, 0], [0, 0.048, 0], spotTileTex(o.wells), { grid: 3 });
    // iodine bottle and a dropper
    CELL.smallBottle(F, [tx + 0.03, ty + 0.1, 0], 'Iodine', { glass: '#5A3A1A' });
    MICRO.dropper(F, [tx - 0.06, ty + 0.085, 0], 'sample', '#F0EEE6');
  }
  /* starch being cut: amylose helices of glucose rings, held blue-black by iodine inside; amylase cuts them into maltose */
  function starchCut(ctx, x, y, w, h, o) {
    const r = rng(61), frac = clamp(o.left, 0, 1), t = o.t || 0, act = o.active;
    ctx.save(); ctx.fillStyle = '#0E1420'; ctx.fillRect(x, y, w, h); ctx.restore();
    const ring = (cx, cy, s, col) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke(); };
    const s = Math.max(4, Math.min(w, h) / 44), nChains = 7;
    for (let c = 0; c < nChains; c++) {
      const y0 = y + h * (0.12 + c * 0.12), len = Math.round(lerp(2, 26, frac * (0.75 + 0.25 * r())));
      let xx = x + w * 0.06 + r() * w * 0.05;
      const blue = len > 6;
      for (let k = 0; k < len; k++) { const yy = y0 + Math.sin(k * 0.9 + c) * s * 0.9; ring(xx, yy, s, blue ? '#E8E4D0' : '#F2EED8'); if (k > 0) { ctx.strokeStyle = '#B8B098'; ctx.beginPath(); ctx.moveTo(xx - s * 1.4, yy); ctx.lineTo(xx - s * 0.9, yy); ctx.stroke(); } if (blue && k % 3 === 1) RX.ball(ctx, xx, yy, s * 0.42, '#3A2A8A', { shadow: false }); xx += s * 2.1; }
    }
    // maltose: pairs of rings scattered, more as starch goes
    const nm = Math.round((1 - frac) * 40);
    for (let k = 0; k < nm; k++) { const mx = x + w * (0.08 + 0.84 * r()), my = y + h * (0.1 + 0.85 * r()); ring(mx, my, s * 0.8, '#F8E8A8'); ring(mx + s * 1.6, my, s * 0.8, '#F8E8A8'); }
    // amylase molecules: lit globular proteins with a cleft
    for (let k = 0; k < 3; k++) {
      const ex = x + w * (0.25 + k * 0.28) + Math.sin(t * 0.7 + k) * w * 0.04, ey = y + h * (0.3 + 0.25 * (k % 2)) + Math.cos(t * 0.9 + k) * h * 0.04, R = s * 3.4;
      if (act) {
        // a folded protein: a dense cluster of residues around a groove where the starch chain lies
        const rr = rng(80 + k), col = '#4A98D0';
        for (let j = 0; j < 26; j++) { const a = rr() * TAU, d = Math.sqrt(rr()) * R; const px = ex + Math.cos(a) * d, py = ey + Math.sin(a) * d * 0.85; if (Math.abs(py - ey) < R * 0.16 && px > ex - R * 0.1) continue; RX.ball(ctx, px, py, R * (0.24 + 0.12 * rr()), j % 5 === 0 ? '#6AB8E8' : col, { shadow: false }); }
        ctx.save(); ctx.strokeStyle = 'rgba(10,20,40,.7)'; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.moveTo(ex - R * 0.1, ey); ctx.lineTo(ex + R * 1.1, ey); ctx.stroke(); ctx.restore();
      } else {
        // boiled: the same residues unfolded into a loose tangle, no groove
        ctx.save(); ctx.strokeStyle = '#7A8088'; ctx.lineWidth = R * 0.2; ctx.lineCap = 'round'; ctx.beginPath(); for (let j = 0; j <= 30; j++) { const u = j / 30; ctx.lineTo(ex - R * 1.6 + u * R * 3.2, ey + Math.sin(u * 19 + k) * R * 0.7); } ctx.stroke(); ctx.restore();
        for (let j = 0; j <= 30; j += 3) { const u = j / 30; RX.ball(ctx, ex - R * 1.6 + u * R * 3.2, ey + Math.sin(u * 19 + k) * R * 0.7, R * 0.2, '#8A9098', { shadow: false }); }
      }
    }
  }

  /* ============================================================
     EXCRETORY — urine collected every half hour, and a nephron
     ============================================================ */
  const urineCol = osm => mix('#FAF6D8', '#C88A1A', clamp((osm - 50) / 1100, 0, 1));
  function urineBench(F, at, o) {
    const [x, y] = at, n = o.samples.length, G100 = { cap: 250, div: 2, big: 50, mid: 10, d: 0.039 };
    o.samples.forEach((sm, i) => {
      const cx = x - 0.21 + i * 0.06;
      MEAS.gradCylinder(F, [cx, y, 0], G100, Math.min(245, sm.vol), { tint: urineCol(sm.osm), menisc: 0.0018 });
    });
    // the urinometer floats in the latest: it sinks deeper in dilute urine
    const last = o.samples[n - 1];
    if (last && last.vol > 30) {
      const cx = x - 0.21 + (n - 1) * 0.06, zl = 0.018 + last.vol * 1e-6 / (Math.PI * 0.0195 * 0.0195), sink = (1.03 - last.sg) * 1.4;
      R3.cylinder(F, [cx, y, zl - 0.03 - sink], [cx, y, zl + 0.05 - sink], 0.0035, '#F4F8FA', { segments: 10, shadow: false, ambient: 0.7, bias: -0.003 });
      R3.sphere(F, [cx, y, zl - 0.04 - sink], 0.009, '#E8EEF2', { shadow: false });
    }
    // the jug of water drunk
    MEAS.beaker(F, [x + 0.2, y + 0.05, 0], 0.05, 0.16, 0.16 * clamp(o.jug, 0, 1), { tint: o.saline ? '#E8EEF0' : '#CFE6F2' });
  }
  /* a nephron: glomerulus in Bowman's capsule, proximal tubule, loop of Henle into the salty medulla,
     distal tubule, collecting duct; flows (mL/min) as arrow widths, water leaving the duct as ADH lets it */
  function nephron(ctx, x, y, w, h, o) {
    const X = u => x + u * w, Y = v => y + v * h;
    // cortex and medulla, the medulla saltier (darker) toward the papilla
    ctx.save(); const mg = ctx.createLinearGradient(0, Y(0.36), 0, Y(1)); mg.addColorStop(0, '#3A2228'); mg.addColorStop(1, mix('#3A2228', '#C86A3A', 0.25 + 0.5 * o.medulla)); ctx.fillStyle = '#2A1C22'; ctx.fillRect(x, y, w, h * 0.36); ctx.fillStyle = mg; ctx.fillRect(x, Y(0.36), w, h * 0.64);
    ctx.fillStyle = 'rgba(220,200,180,.5)'; ctx.font = mono(9.5, 600); ctx.fillText('CORTEX', X(0.02), Y(0.05)); ctx.fillText('MEDULLA', X(0.02), Y(0.42)); ctx.fillText((300 + 900 * o.medulla).toFixed(0) + ' mOsm', X(0.02), Y(0.95)); ctx.restore();
    const tc = '#E8D0B8', tub = (pts, r, col) => RX.tube(ctx, spline(pts.map(q => [X(q[0]), Y(q[1])]), 8), r, col || tc, {});
    // afferent and efferent arterioles and the glomerulus
    RX.tube(ctx, [[X(0.02), Y(0.16)], [X(0.17), Y(0.17)]], 4, '#C82830', {}); RX.tube(ctx, [[X(0.18), Y(0.2)], [X(0.04), Y(0.27)]], 3, '#A82838', {});
    RX.body(ctx, c => { c.beginPath(); c.arc(X(0.22), Y(0.18), Math.min(w, h) * 0.075, 0, TAU); }, { fill: '#F0E0D0', r: 30, ao: 0.3, contour: 1 });
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; RX.tube(ctx, [[X(0.22) + Math.cos(a) * 6, Y(0.18) + Math.sin(a) * 6], [X(0.22) + Math.cos(a + 0.6) * Math.min(w, h) * 0.05, Y(0.18) + Math.sin(a + 0.6) * Math.min(w, h) * 0.05]], 2.6, '#D83038', {}); }
    // proximal tubule, loop, distal tubule, collecting duct
    tub([[0.27, 0.2], [0.33, 0.12], [0.38, 0.22], [0.42, 0.12], [0.46, 0.24], [0.48, 0.32]], 5.5);
    tub([[0.48, 0.32], [0.49, 0.6], [0.5, 0.86], [0.55, 0.9], [0.6, 0.86], [0.6, 0.6], [0.6, 0.34]], 4.5);
    tub([[0.6, 0.34], [0.63, 0.24], [0.68, 0.14], [0.73, 0.22], [0.78, 0.16], [0.82, 0.18]], 4.8);
    tub([[0.82, 0.06], [0.82, 0.3], [0.83, 0.6], [0.84, 0.95]], 6.5, '#E0C8A8');
    // water leaving the collecting duct into the salty medulla: as many arrows as ADH opens it
    const nA = Math.round(clamp(o.adh, 0, 1) * 6);
    for (let k = 0; k < nA; k++) { const yy = Y(0.45 + k * 0.08); G.arrow(ctx, X(0.84) + 6, yy, X(0.93), yy - 4, 'rgba(110,180,255,.85)', 2); }
    for (let k = 0; k < 4; k++) G.arrow(ctx, X(0.36 + k * 0.03), Y(0.22 + (k % 2) * 0.06), X(0.36 + k * 0.03) + 2, Y(0.32 + (k % 2) * 0.06), 'rgba(110,180,255,.6)', 1.6);
    return { glom: [X(0.22), Y(0.18)], pct: [X(0.4), Y(0.14)], loop: [X(0.55), Y(0.9)], dct: [X(0.72), Y(0.15)], duct: [X(0.83), Y(0.62)], urine: [X(0.84), Y(0.95)] };
  }

  /* ============================================================
     CIRCULATORY — the model circulation and an artery with a plaque
     ============================================================ */
  function circuitBench(F, at, o) {
    const [x, y] = at;
    // the pump: a box with a squeezing chamber and an LCD of the beat
    R3.box(F, [x - 0.16, y, 0.05], [0.12, 0.1, 0.1], '#3A4250', {});
    R3.sphere(F, [x - 0.16, y, 0.12 - 0.006 * o.squeeze], 0.035 * (1 - 0.15 * o.squeeze), '#B8303A', {});
    if (o.lcd) R3.texPlane(F, [x - 0.16, y - 0.0505, 0.06], [0.04, 0, 0], [0, 0, -0.018], o.lcd, { grid: 1, bias: -0.03 });
    // the outflow tube splits into two branches, each into a measuring cylinder
    const red = '#B02A30';
    R3.tube(F, [[x - 0.12, y, 0.12], [x - 0.06, y, 0.12], [x - 0.02, y, 0.1]], 0.005, red, { segments: 10 });
    [[-0.05, 'open'], [0.05, 'clamp']].forEach(([dy, kind]) => {
      R3.tube(F, [[x - 0.02, y, 0.1], [x + 0.04, y + dy, 0.1], [x + 0.14, y + dy, 0.1], [x + 0.17, y + dy, 0.13]], 0.0045, red, { segments: 10 });
      MEAS.gradCylinder(F, [x + 0.2, y + dy, 0], { cap: 250, div: 2, big: 50, mid: 10, d: 0.039 }, kind === 'open' ? o.volOpen : o.volClamp, { tint: '#C83038' });
    });
    // the screw clamp on the second branch, closed as far as the narrowing
    const cx = x + 0.08, cy = y + 0.05;
    R3.box(F, [cx, cy, 0.1 + 0.012], [0.02, 0.03, 0.006], '#8A9098', {});
    R3.box(F, [cx, cy, 0.1 - 0.012 + 0.008 * o.narrow], [0.02, 0.03, 0.006], '#8A9098', {});
    R3.cylinder(F, [cx, cy, 0.09], [cx, cy, 0.145], 0.002, '#C8CED6', { segments: 6, shadow: false });
    R3.cylinder(F, [cx, cy, 0.145], [cx, cy, 0.15], 0.009, '#5A6474', { segments: 12, shadow: false });
    // a pressure gauge on the trunk
    R3.cylinder(F, [x - 0.06, y, 0.125], [x - 0.06, y, 0.16], 0.0025, '#C8CED6', { segments: 6, shadow: false });
    R3.cylinder(F, [x - 0.06, y - 0.004, 0.18], [x - 0.06, y + 0.004, 0.18], 0.022, '#E8EAEE', { segments: 22 });
    if (o.gauge) R3.texPlane(F, [x - 0.06, y - 0.0045, 0.18], [0.019, 0, 0], [0, 0, -0.019], o.gauge, { grid: 1, bias: -0.02 });
  }
  let gaugeCv = null;
  function gaugeTex(p, max) {
    const c = gaugeCv || cv(160, 160), x = c.getContext('2d'); gaugeCv = c;
    x.clearRect(0, 0, 160, 160); x.fillStyle = '#F4F4F0'; x.beginPath(); x.arc(80, 80, 78, 0, TAU); x.fill();
    x.strokeStyle = '#30343C'; x.lineWidth = 2; for (let k = 0; k <= 10; k++) { const a = Math.PI * 0.75 + k / 10 * Math.PI * 1.5; x.beginPath(); x.moveTo(80 + Math.cos(a) * 64, 80 + Math.sin(a) * 64); x.lineTo(80 + Math.cos(a) * 74, 80 + Math.sin(a) * 74); x.stroke(); if (k % 2 === 0) { x.fillStyle = '#30343C'; x.font = '600 14px sans-serif'; x.textAlign = 'center'; x.fillText(String(k * max / 10), 80 + Math.cos(a) * 50, 85 + Math.sin(a) * 50); } }
    const a = Math.PI * 0.75 + clamp(p / max, 0, 1) * Math.PI * 1.5; x.strokeStyle = '#C82828'; x.lineWidth = 4; x.beginPath(); x.moveTo(80, 80); x.lineTo(80 + Math.cos(a) * 66, 80 + Math.sin(a) * 66); x.stroke();
    x.fillStyle = '#30343C'; x.font = '600 13px sans-serif'; x.textAlign = 'center'; x.fillText('mmHg', 80, 125);
    return c;
  }
  /* an artery cut along its length: three-layered wall, a plaque narrowing it, red cells flowing at the speed the flow gives */
  function artery(ctx, x, y, w, h, o) {
    const cy = y + h / 2, R = h * 0.32, n = clamp(o.narrow, 0, 0.97), t = o.t || 0, r = rng(71);
    const lumenAt = u => { const d = Math.exp(-Math.pow((u - 0.55) / 0.11, 2)); return R * (1 - n * d); };
    // the wall: adventitia, media (muscle), intima
    ctx.save(); ctx.fillStyle = '#2A1418'; ctx.fillRect(x, y, w, h); ctx.restore();
    const band = (r0, r1, col) => [-1, 1].forEach(s => { ctx.save(); const g = ctx.createLinearGradient(0, cy + s * r0, 0, cy + s * r1); g.addColorStop(0, mix(col, '#FFFFFF', 0.15)); g.addColorStop(1, mix(col, '#000000', 0.25)); ctx.fillStyle = g; ctx.fillRect(x, Math.min(cy + s * r0, cy + s * r1), w, Math.abs(r1 - r0)); ctx.restore(); });
    band(R * 1.55, R * 1.85, '#E0C0A8'); band(R * 1.12, R * 1.55, '#C04848'); band(R, R * 1.12, '#F0D8D0');
    // the plaque: fatty, yellow, under the intima on both sides
    if (n > 0.01) [-1, 1].forEach(s => { ctx.save(); ctx.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(x + u * w, cy + s * lumenAt(u)); } for (let i = 60; i >= 0; i--) ctx.lineTo(x + i / 60 * w, cy + s * R); ctx.closePath(); const g = ctx.createLinearGradient(0, cy + s * R, 0, cy + s * R * (1 - n)); g.addColorStop(0, '#E8C060'); g.addColorStop(1, '#F4E0A0'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(120,80,20,.6)'; ctx.stroke(); for (let k = 0; k < 12; k++) { const u = 0.55 + (r() - 0.5) * 0.18, rr = lumenAt(u); ctx.fillStyle = 'rgba(255,250,220,.7)'; ctx.beginPath(); ctx.arc(x + u * w, cy + s * lerp(rr, R, r()), 2, 0, TAU); ctx.fill(); } ctx.restore(); });
    // the lumen, and the cells moving through it faster in the narrowing (continuity)
    ctx.save(); ctx.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(x + u * w, cy - lumenAt(u)); } for (let i = 60; i >= 0; i--) { const u = i / 60; ctx.lineTo(x + u * w, cy + lumenAt(u)); } ctx.closePath(); ctx.fillStyle = 'rgba(160,30,40,.55)'; ctx.fill(); ctx.clip();
    const N = 46, flow = o.flow;
    for (let k = 0; k < N; k++) {
      const lane = (r() - 0.5) * 1.6, seed = r();
      // position along: the cell's own phase advanced by the flow; slowed where wide, fast where narrow
      let u = (seed + t * 0.08 * flow) % 1;
      const loc = lumenAt(u) / R; u = (u + 0) % 1;
      const yy = cy + lane * lumenAt(u) * 0.8;
      RX.blob(ctx, x + u * w, yy, Math.max(2.5, R * 0.1), Math.max(1.4, R * 0.045) * (loc < 0.5 ? 0.8 : 1), { fill: '#D82A2A', r: Math.max(3, R * 0.08) });
    }
    ctx.restore();
    return { plaque: [x + 0.55 * w, cy - lumenAt(0.55) - (R - lumenAt(0.55)) / 2], media: [x + 0.15 * w, cy - R * 1.33], lumen: [x + 0.15 * w, cy] };
  }

  /* ============================================================
     RESPIRATORY — the bell jar, and the chest
     ============================================================ */
  function bellJar(F, at, o) {
    const [x, y] = at, R = 0.065, H = 0.2, z0 = 0.06, pull = o.pull;
    // the stand: a ring on legs
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => R3.cylinder(F, [x + a * 0.06, y + b * 0.06, 0], [x + a * 0.06, y + b * 0.06, z0], 0.004, '#5A6270', { segments: 6, shadow: false }));
    R3.cylinder(F, [x, y, z0 - 0.004], [x, y, z0], R + 0.012, '#5A6270', { segments: 28 });
    // the rubber sheet pulled down by its knob: a shallow cone
    const tip = [x, y, z0 - 0.002 - pull * 0.01];
    for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU; MEAS.face(F, [[x + Math.cos(a0) * R, y + Math.sin(a0) * R, z0], [x + Math.cos(a1) * R, y + Math.sin(a1) * R, z0], tip], '#A83A2A', { ambient: 0.5 }); }
    R3.cylinder(F, [tip[0], tip[1], tip[2]], [tip[0], tip[1], tip[2] - 0.025], 0.006, '#30343C', { segments: 10 });
    // balloons (the lungs) on a Y-tube through the stopper
    const top = z0 + H, yz = top - 0.04;
    R3.cylinder(F, [x, y, top + 0.02], [x, y, yz], 0.003, '#E8F0F4', { segments: 8, shadow: false, ambient: 0.8 });
    [-1, 1].forEach(s => {
      const bz = yz - 0.03 - o.vb * 0.06, bx = x + s * 0.026, rb = 0.012 + 0.02 * Math.cbrt(clamp(o.vb, 0, 1.5));
      R3.cylinder(F, [x, y, yz], [bx, y, yz - 0.02], 0.0025, '#E8F0F4', { segments: 8, shadow: false, ambient: 0.8 });
      R3.sphere(F, [bx, y, yz - 0.022 - rb * 0.9], rb, '#E86A6A', { shadow: false });
    });
    R3.cylinder(F, [x, y, top], [x, y, top + 0.02], 0.016, '#7A5A3A', { segments: 16 });
    // the jar itself, clear glass drawn last so it overlays what is inside
    MEAS.beaker(F, [x, y, z0], R, H, 0, { tint: '#DDEFF6' });
    if (o.hole) R3.box(F, [x, y - R - 0.001, z0 + H * 0.55], [0.014, 0.002, 0.014], '#20242C', { shadow: false });
    // a water manometer from the jar
    R3.tube(F, [[x + R, y, z0 + 0.12], [x + R + 0.04, y, z0 + 0.12], [x + R + 0.04, y, 0.03], [x + R + 0.07, y, 0.03], [x + R + 0.07, y, 0.2]], 0.003, '#E8F0F4', { segments: 8 });
    const dz = clamp(-o.dP / 9.81 / 1000 * 0.5, -0.06, 0.06);
    R3.cylinder(F, [x + R + 0.04, y, 0.03], [x + R + 0.04, y, 0.08 + dz], 0.0022, '#3A7AD8', { segments: 6, shadow: false, bias: -0.004 });
    R3.cylinder(F, [x + R + 0.07, y, 0.03], [x + R + 0.07, y, 0.08 - dz], 0.0022, '#3A7AD8', { segments: 6, shadow: false, bias: -0.004 });
  }
  /* the chest in section: ribs, the two lungs, the heart between, the diaphragm's dome moving down by d */
  function chest(ctx, x, y, w, h, o) {
    const cx = x + w / 2, top = y + h * 0.1, d = o.d, inf = o.inf;     // d: fraction of the dome's travel, inf: lungs' inflation 0…1
    ctx.save(); ctx.fillStyle = '#1A1218'; ctx.fillRect(x, y, w, h); ctx.restore();
    // ribcage outline
    const rx = w * 0.42 * (1 + 0.04 * inf), ry = h * 0.42;
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(cx, top + ry, rx, ry, 0, Math.PI, TAU); c.lineTo(cx + rx, top + ry * 1.7); c.lineTo(cx - rx, top + ry * 1.7); c.closePath(); }, { fill: '#C89A84', r: rx, cx, cy: top + ry, shadow: 0.2, vivid: false });
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top + ry, rx * 0.92, ry * 0.9, 0, Math.PI, TAU); ctx.lineTo(cx + rx * 0.92, top + ry * 1.65); ctx.lineTo(cx - rx * 0.92, top + ry * 1.65); ctx.closePath(); ctx.fillStyle = '#2A1418'; ctx.fill(); ctx.restore();
    // ribs, cut through at the sides of the chest
    for (let k = 0; k < 7; k++) { const yy = top + ry * (0.35 + k * 0.17); [-1, 1].forEach(s => { const a = Math.acos(clamp((yy - top - ry) / ry, -1, 1)); RX.ball(ctx, cx + s * rx * 0.96 * Math.max(0.3, Math.sin(a)), yy, 4.5, '#E8E0D0', { shadow: false }); }); }
    // diaphragm dome
    const dz = top + ry * (1.12 + 0.28 * d);
    // lungs fill down to the diaphragm
    [-1, 1].forEach(s => { const lx = cx + s * rx * 0.48, lw = rx * (0.4 + 0.04 * inf); RX.volume(ctx, c => { c.beginPath(); c.moveTo(lx, top + ry * 0.25); c.bezierCurveTo(lx + s * lw * 1.1, top + ry * 0.3, lx + s * lw, dz - 6, lx + s * lw * 0.6, dz - 4); c.lineTo(lx - s * lw * 0.8, dz - 8); c.bezierCurveTo(lx - s * lw * 0.9, top + ry * 0.8, lx - s * lw * 0.5, top + ry * 0.3, lx, top + ry * 0.25); c.closePath(); }, { fill: '#E08A90', r: lw, cx: lx, cy: (top + dz) / 2, shadow: 0.2 }); });
    { const hs = rx * 0.024; RX.volume(ctx, c => { c.save(); c.translate(cx + rx * 0.06, top + ry * 0.98); c.rotate(-0.5); c.beginPath(); smooth(c, [[0, -9 * hs], [8 * hs, -7 * hs], [10 * hs, 1 * hs], [4 * hs, 10 * hs], [0, 12 * hs], [-4 * hs, 8 * hs], [-9 * hs, 1 * hs], [-7 * hs, -7 * hs]], true); c.restore(); }, { fill: '#B8423A', r: rx * 0.2, cx: cx, cy: top + ry, shadow: 0.25 }); }
    ctx.save(); ctx.strokeStyle = '#C8504A'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - rx * 0.92, top + ry * 1.5); ctx.quadraticCurveTo(cx, dz - ry * 0.5 + 2 * ry * 0.14 * d, cx + rx * 0.92, top + ry * 1.5); ctx.stroke(); ctx.restore();
    // trachea
    RX.tube(ctx, [[cx, y + 4], [cx, top + ry * 0.3]], 6, '#E6D2C4', {});
    if (o.hole) { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(cx - rx * 0.85, top + ry * 0.9, 12, 0, TAU); ctx.stroke(); ctx.restore(); }
    const qy = (y0, cyy, y1, t) => (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cyy + t * t * y1, dY = qy(top + ry * 1.5, dz - ry * 0.5 + 2 * ry * 0.14 * d, top + ry * 1.5, 0.8);
    return { diaphragm: [cx + rx * 0.92 * 0.6, dY], lungL: [cx - rx * 0.55, top + ry * 0.75], trachea: [cx, top + ry * 0.12], ribs: [cx + rx * 0.85, top + ry * 0.6] };
  }

  /* ============================================================
     MUSCULAR — the arm model on the bench, and the arm's anatomy
     ============================================================ */
  function armModel(F, at, o) {
    const [x, y] = at, th = o.angle * Math.PI / 180, L = 0.3, Lh = 0.3, ins = o.ins;
    // a wooden stand tall enough for the forearm to hang straight down
    R3.box(F, [x - 0.05, y, 0.01], [0.2, 0.16, 0.02], '#5A4A38', {});
    R3.box(F, [x - 0.06, y, 0.17], [0.03, 0.04, 0.3], '#7A6A54', {});
    const elbow = [x, y, 0.32], shoulder = [x, y, 0.32 + Lh];
    R3.box(F, [x - 0.03, y, 0.32], [0.06, 0.03, 0.025], '#7A6A54', {});
    R3.cylinder(F, elbow, shoulder, 0.011, '#E8DCC0', { segments: 12 });                                // humerus
    const dir = [Math.sin(th), 0, Math.cos(th)], hand = [elbow[0] + dir[0] * L, elbow[1], elbow[2] + dir[2] * L];
    R3.cylinder(F, elbow, hand, 0.009, '#E8DCC0', { segments: 12 });                                    // forearm
    R3.sphere(F, elbow, 0.014, '#D8CCB0', {});
    const I = [elbow[0] + dir[0] * ins, elbow[1], elbow[2] + dir[2] * ins];
    // the spring balance standing in for the biceps, shoulder to insertion
    const sb = [shoulder[0] + 0.012, y, shoulder[2] - 0.01];
    R3.cylinder(F, sb, [lerp(sb[0], I[0], 0.55), y, lerp(sb[2], I[2], 0.55)], 0.009, '#C8A040', { segments: 12 });
    R3.cylinder(F, [lerp(sb[0], I[0], 0.55), y, lerp(sb[2], I[2], 0.55)], I, 0.0025, '#C8CED6', { segments: 6, shadow: false });
    if (o.lcd) R3.texPlane(F, [lerp(sb[0], I[0], 0.3), y - 0.0095, lerp(sb[2], I[2], 0.3)], [0.016, 0, 0], [0, 0, -0.008], o.lcd, { grid: 1, bias: -0.03 });
    // the load hanging from the hand
    const m = o.mass, hz = hand[2] - 0.05;
    if (m > 0.05) { R3.cylinder(F, hand, [hand[0], y, hz + 0.01], 0.001, '#C8CED6', { segments: 4, shadow: false }); R3.cylinder(F, [hand[0], y, hz + 0.01], [hand[0], y, hz + 0.01 - 0.008 * Math.cbrt(m) * 3], 0.016 * Math.cbrt(m) * 0.8 + 0.008, '#5A6070', { segments: 16 }); }
    return { hand, I, shoulder, elbow };
  }
  /* the arm drawn: humerus, radius and ulna, biceps and triceps whose bellies bulge when they work; force arrows */
  function armPlate(ctx, x, y, w, h, o) {
    const th = o.angle * Math.PI / 180, s = Math.min(w / 0.62, h / 0.72), ex = x + w * 0.3, ey = y + h * (o.angle > 110 ? 0.5 : 0.62);
    const P = (dx, dy) => [ex + dx * s, ey - dy * s];
    const sh = P(0, 0.3), dir = [Math.sin(th), Math.cos(th)], hand = P(dir[0] * 0.35, dir[1] * 0.35), ins = P(dir[0] * o.ins, dir[1] * o.ins);
    // skin silhouette
    RX.tube(ctx, [sh, [ex, ey]], s * 0.045, '#C99B84', { vivid: false }); RX.tube(ctx, [[ex, ey], hand], t => s * (0.036 - 0.01 * t), '#C99B84', { vivid: false });
    // bones
    RX.tube(ctx, [sh, [ex, ey]], s * 0.012, '#F0E8D4', {}); RX.tube(ctx, [[ex, ey], hand], s * 0.009, '#F0E8D4', {}); RX.tube(ctx, [[ex + 3, ey + 3], [hand[0] + 3, hand[1] + 3]], s * 0.007, '#E8DEC4', {});
    RX.ball(ctx, sh[0], sh[1], s * 0.03, '#E8E0CC', {}); RX.ball(ctx, ex, ey, s * 0.02, '#E8E0CC', {});
    // biceps: shoulder (front) to just below the elbow; thick when it pulls
    const bw = s * (0.022 + 0.022 * clamp(o.bic, 0, 1)), tw = s * (0.02 + 0.022 * clamp(o.tri, 0, 1));
    const bmid = [lerp(sh[0], ins[0], 0.5) + s * 0.03, lerp(sh[1], ins[1], 0.5)];
    RX.tube(ctx, spline([[sh[0] + s * 0.02, sh[1] + s * 0.01], bmid, ins], 10), t => Math.max(2, bw * Math.sin(Math.PI * clamp(t * 1.1, 0.05, 0.95))), o.bic > 0.05 ? '#D8404A' : '#A8484E', {});
    const olec = P(-dir[0] * 0.025, -dir[1] * 0.025), tmid = [lerp(sh[0], olec[0], 0.5) - s * 0.035, lerp(sh[1], olec[1], 0.5)];
    RX.tube(ctx, spline([[sh[0] - s * 0.02, sh[1] + s * 0.02], tmid, olec], 10), t => Math.max(2, tw * Math.sin(Math.PI * clamp(t * 1.1, 0.05, 0.95))), o.tri > 0.05 ? '#D8404A' : '#A8484E', {});
    // the load in the hand, and the forces
    if (o.mass > 0.05) { const r = s * (0.02 + 0.012 * Math.cbrt(o.mass)); RX.ball(ctx, hand[0], hand[1] + r * 0.7, r, '#5A6270', {}); }
    const fk = s * 0.12 / 500;
    if (o.mass > 0.05 && o.mode === 'hold') G.arrow(ctx, hand[0], hand[1], hand[0], hand[1] + clamp(o.load * fk * 8, 14, s * 0.25), '#8FB4FF', 2.4);
    if (o.mode === 'push') G.arrow(ctx, hand[0], hand[1] + s * 0.18, hand[0], hand[1] + 4, '#8FB4FF', 2.4);
    if (o.F > 1) { const u = [sh[0] - ins[0], sh[1] - ins[1]], L = Math.hypot(u[0], u[1]), mag = clamp(o.F * fk, 14, s * 0.3); G.arrow(ctx, ins[0], ins[1], ins[0] + u[0] / L * mag, ins[1] + u[1] / L * mag, o.mode === 'push' ? '#C89BFF' : '#FF8A80', 3); }
    // the pivot
    ctx.save(); ctx.fillStyle = '#FFD66B'; ctx.beginPath(); ctx.moveTo(ex, ey + s * 0.02); ctx.lineTo(ex - s * 0.025, ey + s * 0.06); ctx.lineTo(ex + s * 0.025, ey + s * 0.06); ctx.closePath(); ctx.fill(); ctx.restore();
    return { shoulder: sh, elbow: [ex, ey], hand, ins, biceps: bmid, triceps: tmid };
  }

  /* ============================================================
     NERVOUS — the ruler drop, and the path of the signal
     ============================================================ */
  function rulerDrop(F, at, o) {
    const [x, y] = at, L = o.len, fall = o.fall, z1 = 0.13;
    // the catcher's forearm resting on a block, the hand open around the ruler's zero
    R3.box(F, [x - 0.1, y, 0.045], [0.14, 0.08, 0.09], '#3A4A6A', {});
    R3.tube(F, [[x - 0.2, y, 0.11], [x - 0.07, y, 0.115]], t => 0.03 - 0.006 * t, '#D8A88E', { segments: 14 });
    R3.box(F, [x - 0.045, y, 0.12], [0.035, 0.03, 0.06], '#D8A88E', {});
    const gap = o.closed ? 0.003 : 0.02;
    R3.tube(F, [[x - 0.035, y - 0.012, 0.12], [x - 0.012, y - gap - 0.002, z1]], 0.006, '#D0A088', { segments: 10 });        // thumb
    R3.tube(F, [[x - 0.03, y + 0.012, 0.14], [x - 0.008, y + gap + 0.002, z1 + 0.004]], 0.006, '#D0A088', { segments: 10 }); // index finger
    // the ruler: hanging with its zero between the fingers, then falling
    const zBot = z1 - fall;
    R3.box(F, [x, y, zBot + L / 2], [0.03, 0.003, L], '#D8C88E', { shadow: false });
    BENCH.rule(F, [x - 0.015, y - 0.0016, zBot], [0, 0, 1], L, { up: [0, -1, 0], width: 0.03, bias: -0.004 });
    // the dropper's fingers at the top until the ruler is let go
    if (!o.released) { R3.tube(F, [[x, y - 0.04, zBot + L + 0.015], [x, y - 0.004, zBot + L - 0.01]], 0.006, '#C8987E', { segments: 8 }); R3.tube(F, [[x, y + 0.04, zBot + L + 0.015], [x, y + 0.004, zBot + L - 0.01]], 0.006, '#C8987E', { segments: 8 }); }
  }
  /* the path of a reaction: eye → optic nerve → visual cortex → motor cortex → spinal cord → arm, each stage timed */
  function pathway(ctx, x, y, w, h, o) {
    const stages = o.stages, total = stages.reduce((u, s) => u + s.t, 0), now = o.now;
    // a head in profile with the brain, the cord down the neck, the arm out to the hand
    const hx = x + w * 0.42, hy = y + h * 0.3, R = Math.min(w, h) * 0.19;
    // a head in profile, facing right: cranium, brow, nose, lips, chin, the neck below
    const head = [[-0.95, -0.2], [-0.8, -0.8], [-0.2, -1.12], [0.45, -1.0], [0.85, -0.55], [0.95, -0.2], [1.12, 0.12], [0.98, 0.22], [1.02, 0.45], [0.95, 0.62], [0.92, 0.82], [0.7, 1.02], [0.35, 1.05], [0.25, 1.5], [-0.45, 1.5], [-0.5, 0.95], [-0.9, 0.5]];
    RX.volume(ctx, c => { c.beginPath(); smooth(c, head.map(q => [hx + q[0] * R, hy + q[1] * R]), true); }, { fill: '#C99B84', r: R, cx: hx, cy: hy, shadow: 0.2, vivid: false });
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(hx - R * 0.08, hy - R * 0.12, R * 0.78, R * 0.7, 0, 0, TAU); }, { fill: '#E3A5A0', r: R * 0.7, cx: hx, cy: hy, shadow: 0 });
    ctx.save(); ctx.strokeStyle = 'rgba(80,20,30,.45)'; ctx.lineWidth = 1.4; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 1.6 - 1.4; ctx.beginPath(); ctx.arc(hx - R * 0.08 + Math.cos(a) * R * 0.4, hy - R * 0.12 + Math.sin(a) * R * 0.35, R * 0.22, a, a + 1.6); ctx.stroke(); } ctx.restore();
    const eye = [hx + R * 0.74, hy - R * 0.28], vis = [hx - R * 0.7, hy - R * 0.05], mot = [hx - R * 0.05, hy - R * 0.68], cord = [hx - R * 0.1, hy + R * 1.4], arm = [x + w * 0.85, hy + R * 1.9], hand = [x + w * 0.92, hy + R * 1.55];
    RX.ball(ctx, eye[0], eye[1], R * 0.1, '#F4F4F0', {}); RX.ball(ctx, eye[0] + R * 0.05, eye[1], R * 0.05, '#3A6AA8', { shadow: false });
    RX.tube(ctx, spline([[hx - R * 0.1, hy + R * 1.5], [x + w * 0.55, hy + R * 1.75], arm, hand], 8), t => R * (0.26 - 0.12 * t), '#C99B84', { vivid: false });
    const nerve = (pts, col) => RX.tube(ctx, spline(pts, 8), 2.2, col, {});
    nerve([eye, [hx + R * 0.2, hy + R * 0.1], vis], '#E8C870');
    nerve([vis, [hx - R * 0.5, hy - R * 0.6], mot], '#E8C870');
    nerve([mot, [hx - R * 0.1, hy + R * 0.3], [hx - R * 0.1, hy + R * 1.0], cord], '#E8C870');
    nerve([cord, [x + w * 0.5, hy + R * 1.8], arm, hand], '#E8C870');
    RX.tube(ctx, [[hx - R * 0.1, hy + R * 0.9], [hx - R * 0.1, y + h - 8]], 5, '#F0D890', {});
    // the signal's position along the path
    const pts = [eye, vis, mot, cord, arm, hand]; let acc = 0;
    stages.forEach((s, i) => { const a = pts[i], b = pts[i + 1]; if (!b) return; if (now >= acc && now < acc + s.t) { const u = (now - acc) / s.t; ctx.save(); ctx.shadowColor = '#FFE070'; ctx.shadowBlur = 14; ctx.fillStyle = '#FFE070'; ctx.beginPath(); ctx.arc(lerp(a[0], b[0], u), lerp(a[1], b[1], u), 5, 0, TAU); ctx.fill(); ctx.restore(); } acc += s.t; });
    // the time budget bar
    const bx = x + 12, by = y + h - 30, bw = w - 24; let px = bx;
    const cols = ['#8FD4FA', '#9FE0B8', '#FFD66B', '#FFB35C', '#FF8A80', '#C89BFF'];
    stages.forEach((s, i) => { const ww = s.t / total * bw; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(px, by, ww - 1, 10); if (ww > 34) { ctx.fillStyle = '#05080F'; ctx.font = mono(8.5, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(s.t * 1000) + '', px + ww / 2, by + 5.5); } px += ww; });
    ctx.save(); ctx.fillStyle = '#DCE6F6'; ctx.font = mono(9.5, 600); ctx.textAlign = 'left'; ctx.fillText('ms in each stage →', bx, by - 6); ctx.restore();
    if (now >= 0 && now <= total) { ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + now / total * bw, by - 3); ctx.lineTo(bx + now / total * bw, by + 13); ctx.stroke(); ctx.restore(); }
    return { eye, vis, mot, cord, arm: hand };
  }

  Object.assign(G, { spotTileTex, waterBath, starchCut, urineCol, urineBench, nephron, circuitBench, gaugeTex, artery, bellJar, chest, armModel, armPlate, rulerDrop, pathway });
})();
