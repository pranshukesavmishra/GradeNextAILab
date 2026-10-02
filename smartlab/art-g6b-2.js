/* ============================================================
   ART-G6B-2 — figures for 6B-3 Levels of Organization:
   specialised cells (a red cell in face and section, squeezing a
   capillary; neurons end to end; a seedling root with its hairs),
   tissues (muscle in section, skin in section, tendon collagen),
   an organ (the stomach and its wall), the whole-body monitor, and
   the 3D bench pieces (organ bath, forearm and probe, tensile tester).
   Extends window.G6B.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G6B, TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
  const mix = G.mix, rgba = G.rgba, mono = G.mono, rng = G.rng, smooth = G.smooth, spline = G.spline;

  /* ============================================================
     A RED CELL — face on (lit, the pale centre where it is thin)
     and cut through the middle (its profile z(r) from the lab's model).
     prof: function u ∈ [0,1] → half-thickness in µm; R in µm; k px per µm.
     ============================================================ */
  function rbcFace(ctx, cx, cy, R, k, prof) {
    const Rp = R * k, zmax = Math.max(...Array.from({ length: 30 }, (_, i) => prof(i / 29)));
    // face on, a red cell is coloured by how much haemoglobin the light passes through: thick rim dark, thin centre pale
    RX.body(ctx, c => { c.beginPath(); c.arc(cx, cy, Rp, 0, TAU); }, { fill: '#D0362F', r: Rp, ao: 0.35, rim: 0.5, stipple: 0.15, shadow: 0.5, contour: 1.2 });
    const th = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rp);
    for (let i = 0; i <= 12; i++) { const u = i / 12, t = prof(Math.min(0.999, u)) / zmax; th.addColorStop(u, t > 0.75 ? 'rgba(90,0,10,' + ((t - 0.75) * 1.2).toFixed(3) + ')' : 'rgba(255,205,195,' + (1.2 * (0.8 - t)).toFixed(3) + ')'); }
    ctx.save(); ctx.fillStyle = th; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, TAU); ctx.fill();
    const sp = ctx.createRadialGradient(cx - Rp * 0.45, cy - Rp * 0.5, 0, cx - Rp * 0.45, cy - Rp * 0.5, Rp * 0.5); sp.addColorStop(0, 'rgba(255,255,255,.45)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, TAU); ctx.fill(); ctx.restore();
  }
  function rbcProfile(ctx, cx, cy, R, k, prof, o) {
    o = o || {};
    const pts = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([u * R, prof(u)]); }
    const path = c => { c.beginPath(); pts.forEach(([r, z], i) => i ? c.lineTo(cx + r * k, cy - z * k) : c.moveTo(cx + r * k, cy - z * k)); for (let i = pts.length - 1; i >= 0; i--) c.lineTo(cx + pts[i][0] * k, cy + pts[i][1] * k); for (let i = 0; i <= 60; i++) c.lineTo(cx - pts[i][0] * k, cy + pts[i][1] * k); for (let i = 60; i >= 0; i--) c.lineTo(cx - pts[i][0] * k, cy - pts[i][1] * k); c.closePath(); };
    RX.body(ctx, path, { fill: '#C8302E', r: Math.max(12, prof(0.6) * k), ao: 0.5, rim: 0.4, stipple: 0.2, contour: 1.2 });
    // oxygen front: shade the part loaded so far
    if (o.loaded != null) {
      ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
      ctx.fillStyle = 'rgba(255,120,100,.0)';
      for (let i = 0; i < 60; i++) {
        const u = (i + 0.5) / 60, h = prof(u), d = o.depth(h);       // depth reached from each face, µm
        const x0 = cx + (i / 60) * R * k, x1 = cx + ((i + 1) / 60) * R * k, xm0 = cx - ((i + 1) / 60) * R * k;
        ctx.fillStyle = 'rgba(255,90,70,.75)';
        [[x0, x1], [xm0, xm0 + (x1 - x0)]].forEach(([a, b]) => { ctx.fillRect(a, cy - h * k, b - a + 0.6, Math.min(h, d) * k); ctx.fillRect(a, cy + h * k - Math.min(h, d) * k, b - a + 0.6, Math.min(h, d) * k); });
      }
      ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = 'rgba(255,220,210,.7)'; ctx.lineWidth = 1.3; ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore();
  }
  /* a capillary wall of endothelial cells, the red cell squeezing through (or stuck at its mouth) */
  function capillary(ctx, x, y, w, h, o) {
    const k = o.k, dc = o.dCap * k, cy = y + h / 2;
    // tissue round it
    ctx.save(); const tg = ctx.createLinearGradient(0, y, 0, y + h); tg.addColorStop(0, '#5A2A30'); tg.addColorStop(0.5, '#3A1A20'); tg.addColorStop(1, '#5A2A30'); ctx.fillStyle = tg; ctx.fillRect(x, y, w, h); ctx.restore();
    // wider vessel on the left, the capillary narrowing to dCap
    const mouth = x + w * 0.3, wide = Math.min(h * 0.8, 11 * k);
    const wall = s => c => { c.beginPath(); c.moveTo(x, cy + s * (wide / 2)); c.bezierCurveTo(mouth - w * 0.1, cy + s * wide / 2, mouth - w * 0.05, cy + s * dc / 2, mouth + 10, cy + s * dc / 2); c.lineTo(x + w, cy + s * dc / 2); c.lineTo(x + w, cy + s * (h / 2 + 4)); c.lineTo(x, cy + s * (h / 2 + 4)); c.closePath(); };
    [-1, 1].forEach(s => RX.body(ctx, wall(s), { fill: '#C87A70', r: 30, ao: 0.4, rim: 0.4, stipple: 0.3, contour: 1 }));
    ctx.save(); ctx.fillStyle = 'rgba(255,220,200,.08)'; ctx.fillRect(mouth, cy - dc / 2, w, dc); ctx.restore();
    // endothelial nuclei along the walls
    for (let xx = mouth + 30; xx < x + w; xx += 70) [-1, 1].forEach(s => RX.blob(ctx, xx + (s > 0 ? 30 : 0), cy + s * (dc / 2 + 4), 10, 3.5, { fill: '#6A4A9A', r: 6 }));
    // the cell
    const u = o.phase;                                     // 0…1 along the way
    if (o.passes) {
      const cxp = lerp(x + 10, x + w + 40, u), inTube = cxp > mouth;
      if (inTube) {
        const r = Math.min(o.tubeR, o.dCap / 2) * k, L = o.tubeL * k;
        const cap = c => { c.beginPath(); if (c.roundRect) c.roundRect(cxp - L / 2 - r, cy - r, L + 2 * r, 2 * r, r); else c.rect(cxp - L / 2 - r, cy - r, L + 2 * r, 2 * r); };
        RX.body(ctx, cap, { fill: '#D0302C', r: Math.max(8, r), ao: 0.4, rim: 0.5, contour: 1 });
        ctx.save(); ctx.strokeStyle = 'rgba(255,200,190,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cxp + L / 2 + r * 0.4, cy - r * 0.6); ctx.quadraticCurveTo(cxp, cy - r * 0.15, cxp - L / 2 - r * 0.4, cy - r * 0.6); ctx.stroke(); ctx.restore();
      } else RX.blob(ctx, cxp, cy, o.Rcell * k * 0.35, o.Rcell * k, { fill: '#D0302C', r: o.Rcell * k });
    } else {
      // stuck at the mouth: the cell piles up where the capillary narrows to its own smallest width
      const stopX = mouth - o.Rcell * k * 0.3 + (o.dCap / Math.max(0.5, o.dMin)) * 8, cxp = lerp(x + 10, stopX, clamp(u * 2.2, 0, 1));
      RX.blob(ctx, cxp, cy, o.Rcell * k * (o.sphere ? 1 : 0.4), o.Rcell * k, { fill: '#D0302C', r: o.Rcell * k });
      if (u > 0.45) { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(cxp, cy, o.Rcell * k + 6, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
  }

  /* ============================================================
     NEURONS END TO END — one long cell, or a chain of short ones,
     with the signal's position drawn on each.
     ============================================================ */
  function neuronTrack(ctx, x0, x1, y, o) {
    const n = o.cells, myel = o.myelin, gap = 6, col = '#4E86DB';
    if (n <= 1) {
      // a single cell from one end to the other: soma at the left, the axon a lit tube, myelin segments if any
      RX.ball(ctx, x0 + 12, y, 11, '#5A8AE0', {});
      for (let i = 0; i < 6; i++) { const a = Math.PI * (0.6 + i * 0.16); RX.tube(ctx, [[x0 + 12 + Math.cos(a) * 10, y + Math.sin(a) * 10], [x0 + 12 + Math.cos(a) * 24, y + Math.sin(a) * 22]], t => 2.2 * (1 - t * 0.6), col, {}); }
      RX.tube(ctx, [[x0 + 22, y], [x1 - 14, y]], 2.2, col, {});
      if (myel) for (let x = x0 + 30; x < x1 - 24; x += 22) RX.tube(ctx, [[x, y], [x + 17, y]], 4.6, '#E8E0C8', {});
      for (let i = -2; i <= 2; i++) RX.tube(ctx, [[x1 - 14, y], [x1, y + i * 5]], 1.2, col, {});
    } else {
      const L = (x1 - x0 - (n - 1) * gap) / n;
      for (let k = 0; k < n; k++) {
        const a = x0 + k * (L + gap), b = a + L;
        if (L > 10) {
          RX.ball(ctx, a + Math.min(6, L * 0.2), y, Math.min(6, L * 0.2), '#5A8AE0', { shadow: false });
          RX.tube(ctx, [[a + Math.min(10, L * 0.35), y], [b - 2, y]], 1.6, col, {});
          RX.ball(ctx, b - 1.5, y, 2.6, '#8AB0F0', { shadow: false });
        } else RX.tube(ctx, [[a, y], [b, y]], 2, col, {});
      }
    }
    // the signal
    if (o.at != null && o.at >= 0) {
      const sx = lerp(x0 + 12, x1, clamp(o.at, 0, 1));
      ctx.save(); ctx.shadowColor = '#FFE070'; ctx.shadowBlur = 14; ctx.fillStyle = '#FFE070'; ctx.beginPath(); ctx.arc(sx, y, 5, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  /* ============================================================
     A SEEDLING ROOT — a germinating root tip with its hair zone, as a
     bean root looks on wet paper; density and length of the hairs from the lab.
     ============================================================ */
  function seedlingRoot(ctx, x, y, L, w, o) {
    const r = rng(17), hairs = o.den, hl = o.len;            // hairs per mm², length in mm; px per mm = L / 20
    const k = L / 20;
    // the root: a tapering cylinder, cap at the tip on the right
    const path = c => { c.beginPath(); c.moveTo(x, y - w / 2); c.lineTo(x + L * 0.88, y - w * 0.42); c.quadraticCurveTo(x + L, y - w * 0.2, x + L * 1.02, y); c.quadraticCurveTo(x + L, y + w * 0.2, x + L * 0.88, y + w * 0.42); c.lineTo(x, y + w / 2); c.closePath(); };
    // wet filter paper in a Petri dish under it, and the bean seed it grew from
    ctx.save(); const pr = L * 0.62, pcx = x + L * 0.45;
    const pg = ctx.createRadialGradient(pcx - pr * 0.3, y - pr * 0.3, pr * 0.1, pcx, y, pr);
    pg.addColorStop(0, '#AEBEC8'); pg.addColorStop(1, '#7A8C98'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pcx, y, pr, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(140,160,175,.25)'; for (let i = 0; i < 400; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * pr; ctx.fillRect(pcx + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.2, 1.2); }
    ctx.restore();
    const sx = x - w * 1.6;
    RX.volume(ctx, c => { c.beginPath(); c.ellipse(sx, y - w * 0.2, w * 2.2, w * 1.5, -0.25, 0, TAU); }, { fill: '#C89A6A', r: w * 2, cx: sx, cy: y, shadow: 0.4 });
    ctx.save(); ctx.strokeStyle = 'rgba(80,50,30,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx + w * 0.9, y + w * 0.3, w * 0.5, w * 0.22, -0.3, 0, TAU); ctx.stroke(); ctx.restore();
    // root hairs first so the root covers their bases: zone from 30 % to 75 % of the length
    const nDraw = Math.round(clamp(hairs / 200, 0, 1) * 260);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < nDraw; i++) {
      const u = lerp(0.3, 0.78, r()), side = r() < 0.5 ? -1 : 1, grow = clamp((0.78 - u) / 0.2, 0.15, 1);
      const len = hl * k * grow * (0.7 + 0.5 * r()), bx = x + u * L, by = y + side * w * 0.45, ang = side * (Math.PI / 2) + (r() - 0.5) * 0.9;
      ctx.strokeStyle = 'rgba(240,236,220,.85)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 6, by + Math.sin(ang) * len * 0.5, bx + Math.cos(ang) * len, by + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.restore();
    // a long thin body is lit across its thickness (InsightVis §2.9: the gradient must span the shape)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3; const rg = ctx.createLinearGradient(0, y - w / 2, 0, y + w / 2); rg.addColorStop(0, '#FFF8E8'); rg.addColorStop(0.3, '#F2E4C4'); rg.addColorStop(0.8, '#C8B088'); rg.addColorStop(1, '#9A8460'); ctx.fillStyle = rg; ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(110,90,60,.8)'; ctx.lineWidth = 1; ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(150,120,80,.28)'; ctx.lineWidth = 0.8; for (let xx = x + 6; xx < x + L; xx += 9) { ctx.beginPath(); ctx.moveTo(xx, y - w / 2); ctx.lineTo(xx + 2, y + w / 2); ctx.stroke(); } ctx.restore();
    RX.blob(ctx, x + L * 0.985, y, w * 0.12, w * 0.32, { fill: '#D8C098', r: w * 0.3 });
    return { zone: [x + 0.3 * L, x + 0.78 * L], k };
  }
  /* the root in cross-section: epidermis with one hair cell drawn out, cortex, endodermis, xylem star */
  function rootSection(ctx, cx, cy, R, o) {
    const r = rng(23);
    RX.body(ctx, c => { c.beginPath(); c.arc(cx, cy, R, 0, TAU); }, { fill: '#E8DCC0', r: R, ao: 0.3, rim: 0.3, contour: 1 });
    for (let ring = 0; ring < 4; ring++) {
      const rr = R * (0.88 - ring * 0.13), n = Math.round(rr * 0.42);
      for (let k = 0; k < n; k++) { const a = k / n * TAU + ring * 0.2; RX.blob(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.06, R * 0.05, { fill: ring === 0 ? '#F0E8D0' : '#DCCFA8', r: R * 0.05 }); }
    }
    RX.body(ctx, c => { c.beginPath(); c.arc(cx, cy, R * 0.3, 0, TAU); }, { fill: '#C8B890', r: R * 0.3, ao: 0.3, contour: 1 });
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; RX.ball(ctx, cx + Math.cos(a) * R * 0.14, cy + Math.sin(a) * R * 0.14, R * 0.06, '#9A6A3A', { shadow: false }); }
    RX.ball(ctx, cx, cy, R * 0.07, '#9A6A3A', { shadow: false });
    // hairs: outgrowths of single epidermal cells
    const n = Math.round(clamp(o.den / 25, 0, 8));
    for (let k = 0; k < n; k++) {
      const a = k / Math.max(1, n) * TAU + 0.7, len = R * 0.25 + o.len * R * 0.9;
      RX.tube(ctx, [[cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96], [cx + Math.cos(a) * (R + len * 0.5), cy + Math.sin(a) * (R + len * 0.5) + 4], [cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len)]], R * 0.035, '#F2EEDC', {});
    }
  }

  /* ============================================================
     MUSCLE IN SECTION — fascicles of fibres; the fibres a motor unit
     recruits light up, and contract with the force.
     ============================================================ */
  function muscleSection(ctx, cx, cy, R, o) {
    const r = rng(31), rec = o.recruit, act = o.active;
    RX.body(ctx, c => { c.beginPath(); c.arc(cx, cy, R, 0, TAU); }, { fill: '#E8E0D0', r: R, ao: 0.3, contour: 1 });   // epimysium
    const fas = [[0, 0], [-0.45, -0.3], [0.42, -0.34], [-0.48, 0.32], [0.44, 0.34], [0, -0.58], [0, 0.6]];
    fas.forEach(([fx, fy], i) => {
      const fr = R * (i === 0 ? 0.36 : 0.29), x = cx + fx * R, y = cy + fy * R;
      RX.body(ctx, c => { c.beginPath(); c.arc(x, y, fr, 0, TAU); }, { fill: '#F0E8DC', r: fr, ao: 0.3, contour: 0.8 });
      const n = Math.max(6, Math.round((fr * fr) / 60));
      for (let k = 0; k < n; k++) {
        const a = k * 2.399 + i, rr = fr * 0.9 * Math.sqrt((k + 0.5) / n), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        const on = r() < rec, s = Math.max(3, fr * 0.13);
        RX.ball(ctx, px, py, s, on ? mix('#C8303A', '#FF7060', act * 0.6) : '#8A4048', { shadow: false });
      }
    });
    // a capillary or two between fascicles
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; RX.ball(ctx, cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74, Math.max(2, R * 0.03), '#E04040', { shadow: false }); }
  }

  /* ============================================================
     SKIN IN SECTION — stratum corneum layers (as many as remain after
     the tape), the living epidermis, dermis with a capillary loop and a
     sweat duct; water vapour leaving at the rate the lab computed.
     ============================================================ */
  function skinSection(ctx, x, y, w, h, o) {
    const left = o.layers, L0 = o.L0, r = rng(41), t = o.t || 0;
    const sc = h * 0.22, ep = h * 0.3, de = h - sc - ep;
    // dermis
    const dg = ctx.createLinearGradient(0, y + sc + ep, 0, y + h); dg.addColorStop(0, '#E8B8A8'); dg.addColorStop(1, '#D8A090');
    ctx.fillStyle = dg; ctx.fillRect(x, y + sc + ep, w, de);
    ctx.save(); ctx.strokeStyle = 'rgba(200,140,120,.6)'; ctx.lineWidth = 1; for (let i = 0; i < 40; i++) { const yy = y + sc + ep + r() * de, xx = x + r() * w; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 20, yy + (r() - 0.5) * 10, xx + 40, yy + (r() - 0.5) * 6); ctx.stroke(); } ctx.restore();
    // capillary loops reaching up into the papillae
    for (let k = 0; k < 4; k++) { const xx = x + w * (0.12 + k * 0.25); RX.tube(ctx, [[xx - 8, y + h - 4], [xx - 6, y + sc + ep + 10], [xx + 6, y + sc + ep + 10], [xx + 8, y + h - 4]], 3, k % 2 ? '#3A4EA8' : '#C82830', {}); }
    // sweat duct, coiled gland at the bottom
    RX.tube(ctx, spline([[x + w * 0.78, y + h - 8], [x + w * 0.74, y + sc + ep + de * 0.4], [x + w * 0.79, y + sc + ep], [x + w * 0.77, y + sc]], 6), 3, '#F0D8C8', {});
    // living epidermis: basal (columnar), spinous, granular (flattening)
    const rows = 7;
    for (let j = 0; j < rows; j++) {
      const yy = y + sc + ep - (j + 0.5) * ep / rows, cw = lerp(14, 34, j / rows), ch = lerp(ep / rows * 1.3, ep / rows * 0.75, j / rows);
      for (let xx = x - (j % 2) * cw / 2; xx < x + w; xx += cw) RX.body(ctx, c => { c.beginPath(); c.ellipse(xx + cw / 2, yy, cw / 2 - 0.5, ch / 2, 0, 0, TAU); }, { fill: j < 1 ? '#D8A8B8' : j > 5 ? '#E8C8B8' : '#E8C0C0', r: Math.max(5, cw / 2), ao: 0.3, contour: 0.6 });
      if (j < 5) for (let xx = x - (j % 2) * cw / 2; xx < x + w; xx += cw) RX.ball(ctx, xx + cw / 2, yy, Math.max(1.6, ch * 0.18), '#6A4A9A', { shadow: false });
    }
    // stratum corneum: flat dead cells in bricks, only as many layers as remain
    const lh = sc / L0;
    for (let j = 0; j < L0; j++) {
      const yy = y + sc - (j + 1) * lh;
      if (j >= left) { ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(x, yy, w, lh); continue; }
      const off = (j % 2) * 18;
      for (let xx = x - off; xx < x + w; xx += 36) { ctx.fillStyle = j % 2 ? '#E8DCC0' : '#DCCEB0'; ctx.fillRect(xx + 1, yy + 0.5, 34, lh - 1); }
    }
    // tape strips peeled off above, each carrying a layer
    // water vapour leaving: dots rising at a rate set by the flux
    const nv = Math.round(clamp(o.flux / 4, 1, 40));
    ctx.save(); ctx.fillStyle = 'rgba(160,210,255,.8)';
    for (let k = 0; k < nv; k++) { const u = ((t * (0.15 + o.flux / 300) + k / nv * 1.7) % 1), xx = x + ((k * 0.618) % 1) * w; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(xx + Math.sin(u * 6 + k) * 4, y + sc - (sc - (L0 - left) * lh) * 0 - u * 40 - (L0 - left) * lh, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
    return { sc: [y, y + sc], ep: [y + sc, y + sc + ep], de: [y + sc + ep, y + h], top: y + sc - left * lh };
  }

  /* ============================================================
     TENDON — the hierarchy of collagen: fascicles, then fibres whose
     crimp straightens as the tendon is stretched; tenocytes in rows.
     ============================================================ */
  function collagen(ctx, x, y, w, h, o) {
    const strain = o.strain, broken = o.broken, crimp = clamp(1 - strain / 0.03, 0, 1), digest = o.digest;
    ctx.save(); ctx.fillStyle = '#2A2028'; ctx.fillRect(x, y, w, h); ctx.restore();
    const n = 12, gap = h / n;
    for (let k = 0; k < n; k++) {
      const yy = y + (k + 0.5) * gap, pts = [];
      for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([x + u * w, yy + Math.sin(u * 28 + k) * gap * 0.22 * crimp]); }
      if (broken && k % 3 !== 1) { const cut = 0.5 + 0.08 * Math.sin(k * 3); RX.tube(ctx, pts.filter(p => p[0] < x + cut * w - 6), gap * 0.3, digest ? '#C8B8A8' : '#F0E6D2', {}); RX.tube(ctx, pts.filter(p => p[0] > x + cut * w + 6), gap * 0.3, digest ? '#C8B8A8' : '#F0E6D2', {}); }
      else RX.tube(ctx, pts, gap * 0.3 * (digest ? 0.65 : 1), digest ? '#C8B8A8' : '#F0E6D2', {});
      ctx.save(); ctx.strokeStyle = 'rgba(120,100,80,.28)'; ctx.lineWidth = 1; for (let i = 2; i < pts.length - 1; i += 2) { const q = pts[i]; if (broken && Math.abs(q[0] - (x + w * 0.5)) < 8) continue; ctx.beginPath(); ctx.moveTo(q[0], q[1] - gap * 0.26); ctx.lineTo(q[0], q[1] + gap * 0.26); ctx.stroke(); } ctx.restore();
      if (k % 3 === 2) for (let xx = x + 30; xx < x + w; xx += 70) RX.blob(ctx, xx + (k * 13) % 30, yy + gap * 0.5, 12, 2.6, { fill: '#6A4A9A', r: 4 });
    }
  }

  /* ============================================================
     THE STOMACH — the organ, with a window cut through its three muscle
     layers, food particles inside (from the lab's run), and the antral
     wave moving to the pylorus. box = {x, y, w, h}.
     ============================================================ */
  function stomachOrgan(ctx, B, o) {
    const X = u => B.x + u * B.w, Y = v => B.y + v * B.h, s = Math.min(B.w, B.h);
    const wave = o.wave;                      // 0…1 position of the ring contraction from body to pylorus, or null
    // outline: fundus top left, greater curvature round the bottom, antrum rising to the pylorus on the right
    const outer = [[0.3, 0.06], [0.18, 0.1], [0.1, 0.24], [0.12, 0.46], [0.22, 0.7], [0.4, 0.86], [0.6, 0.88], [0.76, 0.78], [0.86, 0.62], [0.9, 0.5], [0.83, 0.44], [0.74, 0.56], [0.6, 0.64], [0.46, 0.6], [0.4, 0.46], [0.42, 0.28], [0.4, 0.14]];
    const squeeze = (u, v) => { if (wave == null) return [u, v]; const at = lerp(0.45, 0.86, wave), d = Math.exp(-Math.pow((u - at) / 0.05, 2)) * 0.5 * (o.strength || 1); const cyv = 0.62; return [u, v + (cyv - v) * d]; };
    const path = c => smooth(c, outer.map(([u, v]) => { const q = squeeze(u, v); return [X(q[0]), Y(q[1])]; }), true);
    // oesophagus and duodenum
    RX.tube(ctx, spline([[X(0.4), Y(-0.06)], [X(0.38), Y(0.04)], [X(0.36), Y(0.12)]], 5), s * 0.035, '#D49484', {});
    RX.tube(ctx, spline([[X(0.88), Y(0.5)], [X(0.96), Y(0.52)], [X(1.0), Y(0.66)], [X(0.98), Y(0.86)]], 5), s * 0.03, '#D8A88A', {});
    RX.body(ctx, path, { fill: '#D8907E', r: s * 0.35, ao: 0.4, rim: 0.4, stipple: 0.2, contour: 1.4 });
    // the cavity cut open: a dark lumen with rugae, gastric juice and the meal inside
    const inner = c => { c.save(); c.translate(X(0.5), Y(0.5)); c.scale(0.86, 0.84); c.translate(-X(0.5), -Y(0.5)); c.beginPath(); path(c); c.restore(); };
    ctx.save(); inner(ctx); ctx.clip();
    const lg = ctx.createLinearGradient(0, Y(0.1), 0, Y(0.9)); lg.addColorStop(0, '#5A2A2A'); lg.addColorStop(1, '#3A1818'); ctx.fillStyle = lg; ctx.fillRect(B.x, B.y, B.w, B.h);
    ctx.strokeStyle = 'rgba(230,150,140,.45)'; ctx.lineWidth = s * 0.012;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(X(0.18 + k * 0.03), Y(0.2 + k * 0.06)); ctx.bezierCurveTo(X(0.3 + k * 0.05), Y(0.55 + k * 0.03), X(0.55 + k * 0.03), Y(0.8 - k * 0.02), X(0.8), Y(0.6)); ctx.stroke(); }
    // gastric juice level
    const jg = ctx.createLinearGradient(0, Y(0.35), 0, Y(0.9)); jg.addColorStop(0, 'rgba(230,220,150,.18)'); jg.addColorStop(1, 'rgba(230,220,150,.3)'); ctx.fillStyle = jg; ctx.fillRect(B.x, Y(0.36), B.w, B.h);
    // food particles, sized from the run (mm → px with s/180 px per mm)
    (o.particles || []).forEach(q => { const sz = clamp(q.d * s / 180, 1.2, s * 0.06); RX.ball(ctx, X(q.u), Y(q.v), sz, q.d < 2 ? '#E8D090' : '#C89060', { shadow: false }); });
    ctx.restore();
    // a window through the wall at the greater curvature: three muscle layers
    const wx = X(0.24), wy = Y(0.74);
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(0.62);
    const bw = s * 0.2, bh = s * 0.075;
    [['#B23A3A', 0], ['#C84A44', 1], ['#A83434', 2]].forEach(([c, i]) => { ctx.save(); ctx.beginPath(); ctx.rect(-bw / 2, -bh / 2 + i * bh / 3, bw, bh / 3); ctx.clip(); ctx.fillStyle = c; ctx.fillRect(-bw / 2, -bh / 2 + i * bh / 3, bw, bh / 3); ctx.strokeStyle = 'rgba(60,10,10,.5)'; ctx.lineWidth = 1; for (let k = -10; k < 10; k++) { ctx.beginPath(); if (i === 0) { ctx.moveTo(k * 6, -bh); ctx.lineTo(k * 6 + 12, bh); } else if (i === 1) { ctx.moveTo(k * 6, -bh); ctx.lineTo(k * 6, bh); } else { ctx.moveTo(-bw, -bh / 2 + i * bh / 3 + (k + 10) * 1.2); ctx.lineTo(bw, -bh / 2 + i * bh / 3 + (k + 10) * 1.2); } ctx.stroke(); } ctx.restore(); });
    ctx.strokeStyle = 'rgba(255,230,220,.6)'; ctx.lineWidth = 1; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();
    if (o.off === 'muscle') { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore(); }
    return { pylorus: [X(0.88), Y(0.5)], window: [wx, wy], fundus: [X(0.22), Y(0.14)], body: [X(0.2), Y(0.5)], antrum: [X(0.7), Y(0.7)], oes: [X(0.38), Y(0.02)], wall: [X(0.5), Y(0.86)] };
  }
  /* the stomach wall in section, lumen at the top: mucus gel (coloured by pH), epithelium with pits,
     gastric glands (parietal and chief cells), muscularis mucosae, submucosa with vessels, three muscle
     layers, serosa. prof: function f ∈ [0,1] across the gel (0 lumen, 1 lining) → pH. */
  function stomachWall(ctx, x, y, w, h, o) {
    const r = rng(51), gelH = h * 0.12 * clamp(o.gel / 150, 0, 2), lum = h * 0.06;
    const ph = v => { const t = clamp((v - 1) / 6.5, 0, 1); return t < 0.5 ? mix('#E83A3A', '#F0D040', t * 2) : mix('#F0D040', '#40B0E8', (t - 0.5) * 2); };
    // lumen
    ctx.save(); ctx.fillStyle = mix('#3A1818', ph(o.pHl), 0.25); ctx.fillRect(x, y, w, lum + 1); ctx.restore();
    // gel, coloured by its own pH from lumen to lining
    let yy = y + lum;
    if (gelH > 0.5) { const gg = ctx.createLinearGradient(0, yy, 0, yy + gelH); for (let i = 0; i <= 10; i++) gg.addColorStop(i / 10, rgba(ph(o.prof(i / 10)), 0.85)); ctx.fillStyle = gg; ctx.fillRect(x, yy, w, gelH); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.15)'; for (let k = 0; k < 18; k++) { const xx = x + r() * w; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.bezierCurveTo(xx + 10, yy + gelH * 0.3, xx - 10, yy + gelH * 0.6, xx + 4, yy + gelH); ctx.stroke(); } ctx.restore(); }
    const gelTop = yy; yy += gelH;
    const mucosaH = h * 0.32, epi = yy;
    // mucosa: lamina propria behind the glands
    ctx.fillStyle = '#E8B8B0'; ctx.fillRect(x, epi, w, mucosaH);
    // gastric pits and glands
    const pitW = Math.max(26, w / 9);
    for (let px = x + pitW * 0.5; px < x + w; px += pitW) {
      const gl = c => { c.beginPath(); c.moveTo(px - pitW * 0.38, epi); c.lineTo(px - pitW * 0.12, epi + mucosaH * 0.3); c.lineTo(px - pitW * 0.16, epi + mucosaH * 0.92); c.quadraticCurveTo(px, epi + mucosaH * 1.0, px + pitW * 0.16, epi + mucosaH * 0.92); c.lineTo(px + pitW * 0.12, epi + mucosaH * 0.3); c.lineTo(px + pitW * 0.38, epi); c.closePath(); };
      RX.body(ctx, gl, { fill: '#F0D8D8', r: pitW * 0.4, ao: 0.4, contour: 0.8 });
      // the pit's lumen
      ctx.save(); ctx.strokeStyle = 'rgba(90,40,40,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px, epi); ctx.lineTo(px, epi + mucosaH * 0.88); ctx.stroke(); ctx.restore();
      // cells along the gland: mucous cells near the top, parietal (pink, round) in the middle, chief (purple) at the base
      for (let k = 0; k < 7; k++) {
        const v = 0.12 + k * 0.12, cy = epi + mucosaH * v, wd = lerp(pitW * 0.3, pitW * 0.15, v);
        [-1, 1].forEach(s => {
          const kind = v < 0.3 ? 'mucous' : v < 0.7 ? (k % 2 ? 'parietal' : 'chief') : 'chief';
          const col = kind === 'mucous' ? '#F4F0E8' : kind === 'parietal' ? (o.acidOff ? '#B8A0A8' : '#F06A80') : '#8A6AC0';
          RX.ball(ctx, px + s * wd * 0.55, cy, Math.max(2.4, wd * 0.36), col, { shadow: false });
        });
      }
    }
    // surface epithelium: a row of mucous cells; red where acid reaches them
    const hurt = clamp(o.acidOnLining / 10, 0, 1);
    for (let px = x; px < x + w; px += 9) RX.body(ctx, c => { c.beginPath(); c.rect(px + 0.5, epi - 5, 8, 9); }, { fill: mix('#F4EEE4', '#E03030', hurt), r: 5, ao: 0.2, contour: 0.4 });
    yy = epi + mucosaH;
    // muscularis mucosae
    ctx.fillStyle = '#B8504C'; ctx.fillRect(x, yy, w, h * 0.025); yy += h * 0.025;
    // submucosa with arteries, veins and a nerve plexus
    const smH = h * 0.16; ctx.fillStyle = mix('#F0D8C8', '#C8A0A0', o.bloodOff ? 0.5 : 0); ctx.fillRect(x, yy, w, smH);
    for (let k = 0; k < 4; k++) { const vx = x + w * (0.15 + k * 0.24); RX.ball(ctx, vx, yy + smH * 0.5, smH * 0.17, o.bloodOff ? '#7A6A6A' : '#C82830', {}); RX.ball(ctx, vx + smH * 0.4, yy + smH * 0.55, smH * 0.2, o.bloodOff ? '#6A6A7A' : '#3A4EA8', {}); }
    const smTop = yy; yy += smH;
    // muscularis externa: oblique, circular, longitudinal
    const mH = h - (yy - y) - h * 0.03, layers = [['oblique', 0.25], ['circular', 0.45], ['longitudinal', 0.3]];
    const mY = yy;
    layers.forEach(([nm, f], i) => {
      const lh2 = mH * f; ctx.save(); ctx.beginPath(); ctx.rect(x, yy, w, lh2); ctx.clip();
      const base = o.muscleOff ? '#8A6A68' : ['#B83A3A', '#C84844', '#A83232'][i];
      ctx.fillStyle = base; ctx.fillRect(x, yy, w, lh2);
      ctx.strokeStyle = 'rgba(60,10,10,.45)'; ctx.lineWidth = 1;
      if (i === 0) for (let k = -30; k < 60; k++) { ctx.beginPath(); ctx.moveTo(x + k * 8, yy); ctx.lineTo(x + k * 8 + lh2, yy + lh2); ctx.stroke(); }
      else if (i === 1) for (let k = 0; k < w / 6; k++) { ctx.beginPath(); ctx.ellipse(x + k * 6 + 3, yy + lh2 / 2, 2.5, lh2 * 0.4, 0, 0, TAU); ctx.stroke(); }
      else for (let k = 0; k < lh2 / 4; k++) { ctx.beginPath(); ctx.moveTo(x, yy + k * 4); ctx.lineTo(x + w, yy + k * 4); ctx.stroke(); }
      ctx.restore(); yy += lh2;
    });
    ctx.fillStyle = '#F0E8E0'; ctx.fillRect(x, yy, w, h * 0.03);
    return { lumen: y + lum / 2, gel: [gelTop, gelTop + gelH], epi, glands: epi + mucosaH * 0.55, mm: epi + mucosaH, sub: smTop + smH / 2, musc: [mY, yy], serosa: yy + h * 0.015 };
  }

  /* ============================================================
     THE BODY MONITOR — one bar per danger: how far each reading has
     gone toward the level that kills, and when it gets there.
     ============================================================ */
  function monitor(ctx, x, y, w, rows) {
    const lh = 40;
    rows.forEach((r, i) => {
      const yy = y + i * lh, f = clamp(r.f, 0, 1);
      ctx.save();
      ctx.font = mono(10, 700); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(window.KITMS.fitText(ctx, r.name, w * 0.58), x, yy);
      ctx.font = mono(10, 600); ctx.textAlign = 'right'; ctx.fillStyle = f >= 1 ? '#FF6A60' : f > 0.6 ? '#FFB35C' : '#9FE0B8'; ctx.fillText(r.value, x + w, yy);
      const by = yy + 15; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, by, w, 9);
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3AA870'); g.addColorStop(0.6, '#E8B040'); g.addColorStop(1, '#E83A3A');
      ctx.fillStyle = g; ctx.fillRect(x, by, w * f, 9);
      ctx.fillStyle = '#98A6C6'; ctx.font = mono(9, 500); ctx.textAlign = 'left'; ctx.fillText(window.KITMS.fitText(ctx, r.note || '', w), x, by + 11);
      ctx.restore();
    });
    return rows.length * lh;
  }

  /* ============================================================
     3D BENCH PIECES (R3) — z up, metres.
     ============================================================ */
  /* an organ bath: a jacketed glass chamber of Ringer's solution with an air line, the muscle hung from a
     hook to a force transducer on a clamp stand; a stimulator beside it */
  function organBath(F, at, o) {
    const [x, y] = at, H = 0.16, rOut = 0.035, rIn = 0.026;
    BENCH.clampStand(F, [x - 0.1, y + 0.02, 0], 0.42, {});
    R3.cylinder(F, [x, y, 0.0], [x, y, 0.012], 0.06, '#3A3E46', { segments: 24 });
    MEAS.beaker(F, [x, y, 0.012], rOut, H, H * 0.86, { tint: '#E6F0EA' });
    // the muscle: a lit spindle hanging from the hook at the bottom to the thread at the top
    const top = 0.012 + H * 0.78, bot = 0.012 + H * 0.2, sh = o.shorten || 0;
    R3.tube(F, [[x, y, bot], [x, y, lerp(bot, top, 0.25)], [x, y, lerp(bot, top - sh * 0.02, 0.75)], [x, y, top - sh * 0.02]], t => 0.005 + 0.007 * Math.sin(Math.PI * t) * (1 + sh * 0.25), '#B8404A', { segments: 10 });
    R3.cylinder(F, [x, y, 0.012], [x, y, bot], 0.0012, '#C8CCD4', { segments: 6, shadow: false });
    // thread up to the transducer
    R3.cylinder(F, [x, y, top - sh * 0.02], [x, y, 0.36], 0.0006, '#F0F0F0', { segments: 4, shadow: false });
    R3.box(F, [x - 0.03, y, 0.375], [0.08, 0.026, 0.03], '#C8CCD2', {});
    R3.cylinder(F, [x - 0.16, y + 0.02, 0.375], [x - 0.07, y + 0.01, 0.375], 0.005, '#B8C2D0', { segments: 10, shadow: false });
    R3.box(F, [x - 0.16, y + 0.02, 0.375], [0.03, 0.03, 0.03], '#3A4458', { shadow: false });
    R3.box(F, [x - 0.075, y + 0.01, 0.375], [0.02, 0.02, 0.02], '#4A5060', {});
    // electrodes: two silver wires down beside the muscle
    [-0.006, 0.006].forEach(dx => R3.cylinder(F, [x + dx + 0.012, y, 0.3], [x + dx + 0.012, y, bot + 0.03], 0.0009, '#E8EAF0', { segments: 5, shadow: false }));
    // air line bubbling
    R3.cylinder(F, [x + 0.02, y + 0.012, 0.3], [x + 0.02, y + 0.012, 0.03], 0.0015, '#D8E8F0', { segments: 6, shadow: false });
    // stimulator
    R3.box(F, [x + 0.16, y - 0.04, 0.035], [0.13, 0.09, 0.07], '#2E3440', {});
    if (o.lcd) R3.texPlane(F, [x + 0.16, y - 0.0855, 0.045], [0.045, 0, 0], [0, 0, -0.02], o.lcd, { grid: 1, bias: -0.03 });
    R3.cylinder(F, [x + 0.2, y - 0.086, 0.02], [x + 0.2, y - 0.094, 0.02], 0.008, '#C83030', { segments: 12, shadow: false });
    // recorder screen showing the trace
    if (o.trace) { R3.box(F, [x - 0.18, y + 0.1, 0.11], [0.16, 0.02, 0.11], '#1A1E26', {}); R3.texPlane(F, [x - 0.18, y + 0.0885, 0.115], [0.072, 0, 0], [0, 0, -0.048], o.trace, { grid: 2, bias: -0.03 }); }
  }
  /* a forearm resting on a pad, palm up, the probe of an evaporimeter on its skin */
  function forearm(F, at, o) {
    const [x, y] = at;
    R3.box(F, [x, y, 0.008], [0.42, 0.14, 0.016], '#3A4A6A', { bias: F.GROUND });
    R3.tube(F, [[x - 0.22, y, 0.05], [x - 0.08, y, 0.048], [x + 0.06, y, 0.044], [x + 0.17, y, 0.04]], t => 0.038 - 0.012 * t, '#D8A88E', { segments: 16 });
    R3.tube(F, [[x + 0.165, y, 0.04], [x + 0.2, y + 0.004, 0.036], [x + 0.245, y + 0.008, 0.03]], t => 0.03 - 0.008 * t, '#D8A88E', { segments: 14 });
    R3.tube(F, [[x + 0.19, y - 0.026, 0.04], [x + 0.215, y - 0.04, 0.042]], 0.009, '#D8A88E', { segments: 8 });
    // tape strips applied, as squares on the skin
    for (let k = 0; k < Math.min(o.strips, 6); k++) R3.box(F, [x - 0.05 + k * 0.004, y - 0.008, 0.083 - k * 0.0005], [0.035, 0.03, 0.0008], '#F2F0E6', { alpha: 0.7, shadow: false });
    // the probe: a cylinder with two sensors, held against the skin
    R3.cylinder(F, [x + 0.02, y, 0.085], [x + 0.02, y, 0.17], 0.012, '#C8CED8', { segments: 18 });
    R3.cylinder(F, [x + 0.02, y, 0.17], [x + 0.12, y + 0.06, 0.22], 0.002, '#202630', { segments: 5, shadow: false });
    // the meter
    R3.box(F, [x + 0.2, y + 0.12, 0.045], [0.12, 0.08, 0.09], '#2E3440', {});
    if (o.lcd) R3.texPlane(F, [x + 0.2, y + 0.079, 0.055], [0.045, 0, 0], [0, 0, -0.02], o.lcd, { grid: 1, bias: -0.03 });
    // a roll of tape
    R3.cylinder(F, [x - 0.18, y + 0.13, 0.0], [x - 0.18, y + 0.13, 0.02], 0.03, '#E8E4D8', { segments: 20 });
    R3.cylinder(F, [x - 0.18, y + 0.13, 0.0], [x - 0.18, y + 0.13, 0.021], 0.018, '#8A7A5A', { segments: 16, shadow: false });
  }
  /* a tensile tester: base, two columns, a moving crosshead with a load cell, grips holding the tendon */
  function tensile(F, at, o) {
    const [x, y] = at, sep = 0.06 * (1 + o.strain), broken = o.broken;
    R3.box(F, [x, y, 0.02], [0.3, 0.14, 0.04], '#3A4250', {});
    [-0.11, 0.11].forEach(dx => R3.cylinder(F, [x + dx, y, 0.04], [x + dx, y, 0.46], 0.009, '#C8CED6', { segments: 14 }));
    R3.box(F, [x, y, 0.47], [0.28, 0.06, 0.03], '#3A4250', {});
    const zl = 0.11, zu = zl + 0.03 + sep + 0.03;
    R3.box(F, [x, y, zl], [0.05, 0.04, 0.05], '#7A8496', {});
    R3.box(F, [x, y, zu + 0.06], [0.26, 0.05, 0.03], '#5A6474', {});
    R3.cylinder(F, [x, y, zu + 0.025], [x, y, zu + 0.045], 0.018, '#D8DCE2', { segments: 16 });
    R3.box(F, [x, y, zu], [0.05, 0.04, 0.05], '#7A8496', {});
    // the tendon: a flattened white cord, necked and parted if broken
    const a = zl + 0.025, b = zu - 0.025, mid = (a + b) / 2;
    const tcol = o.digest ? '#D8C8B0' : '#F0E8D8';
    if (broken) { R3.tube(F, [[x, y, a], [x, y, mid - 0.006]], t => 0.007 * (1 - t * 0.5), tcol, {}); R3.tube(F, [[x, y, mid + 0.006], [x, y, b]], t => 0.0035 + 0.0035 * t, tcol, {}); }
    else R3.tube(F, [[x, y, a], [x, y, mid], [x, y, b]], t => 0.007 * (1 - 0.2 * o.strain * Math.sin(Math.PI * t)), tcol, {});
    if (o.lcd) { R3.box(F, [x + 0.22, y - 0.02, 0.06], [0.1, 0.08, 0.12], '#2E3440', {}); R3.texPlane(F, [x + 0.22, y - 0.0605, 0.08], [0.04, 0, 0], [0, 0, -0.022], o.lcd, { grid: 1, bias: -0.03 }); }
    return { grip: [x, y, zu + 0.06] };
  }

  Object.assign(G, { rbcFace, rbcProfile, capillary, neuronTrack, seedlingRoot, rootSection, muscleSection, skinSection, collagen, stomachOrgan, stomachWall, monitor, organBath, forearm, tensile });
})();
