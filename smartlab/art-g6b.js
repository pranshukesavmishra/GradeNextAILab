/* ============================================================
   ART-G6B — the figure library of Grade 6 Unit B (labs 3–6):
   the human body as an anatomical plate, its organs and systems,
   tissues and cells at section quality, a bean plant, and the plate
   furniture every stage of the unit shares (circle frames, side labels,
   dashed callouts, scale bars, data cards).
   Everything is drawn through render.js (RX) so it is lit and volumetric.
   Nothing here computes science: each figure draws what a lab worked out.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => RX.mix(a, b, clamp(t, 0, 1));
  const rgba = (c, a) => RX.rgba(c, a);
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const kit = () => window.KITMS;

  /* a smooth closed path through points (Catmull–Rom as Béziers) */
  function smooth(ctx, pts, closed) {
    const n = pts.length; if (n < 2) return;
    const P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
    ctx.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  }
  /* points along a smooth open curve, for RX.tube */
  function spline(pts, per) {
    const out = [], n = pts.length, P = i => pts[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[n - 1].slice());
    return out;
  }
  function solid(ctx, pathFn, fill, r, o) {
    o = o || {};
    RX.volume(ctx, pathFn, { fill, r, cx: o.cx, cy: o.cy, shadow: o.shadow == null ? 0.35 : o.shadow });
    if (o.edge !== false) { ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.strokeStyle = rgba(mix(fill, '#05080F', 0.55), 0.8); ctx.lineWidth = o.lw || Math.max(0.6, r * 0.03); ctx.stroke(); ctx.restore(); }
  }

  /* ============================================================
     PLATE FURNITURE
     ============================================================ */
  /* a round field of view: clip, paint, then a lit bezel ring */
  function circle(ctx, cx, cy, R, paint, o) {
    o = o || {};
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = o.bg || '#0B1220'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    paint();
    const v = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + (o.vignette == null ? 0.45 : o.vignette) + ')');
    ctx.fillStyle = v; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
    ctx.save();
    const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, '#5A6680'); g.addColorStop(0.5, '#1C2436'); g.addColorStop(1, '#0A0F1A');
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,180,215,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  /* a rectangular plate with a soft frame */
  function plate(ctx, x, y, w, h, paint, o) {
    o = o || {};
    ctx.save(); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8); else ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, o.top || '#121A2B'); g.addColorStop(1, o.bottom || '#0A0F1A');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    paint();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(120,140,180,.35)'; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 8); else ctx.rect(x, y, w, h); ctx.stroke(); ctx.restore();
  }
  /* a caption over a frame: title left, note right */
  function caption(ctx, x, y, w, title, note) {
    ctx.save(); ctx.textBaseline = 'bottom';
    ctx.font = mono(10.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left';
    const tw = note ? w * 0.62 : w;
    ctx.fillText(kit().fitText(ctx, title, tw), x, y);
    if (note) { ctx.font = mono(9.5, 500); ctx.fillStyle = '#98A6C6'; ctx.textAlign = 'right'; ctx.fillText(kit().fitText(ctx, note, w - ctx.measureText(title).width - 16 > 60 ? w * 0.36 : w * 0.3), x + w, y); }
    ctx.restore();
  }
  /* a scale bar: a length in metres drawn as px pixels */
  function scaleBar(ctx, x, y, px, text, o) {
    o = o || {};
    ctx.save();
    ctx.strokeStyle = o.col || '#F2F6FF'; ctx.lineWidth = 2.2; ctx.lineCap = 'butt';
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + px, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.moveTo(x + px, y - 4); ctx.lineTo(x + px, y + 4); ctx.stroke();
    ctx.font = mono(10, 700); ctx.fillStyle = o.col || '#F2F6FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(text, x + px / 2, y + 6);
    ctx.restore();
  }
  /* a round number of metres near a target length, and its name */
  function niceLen(m) {
    const e = Math.floor(Math.log10(m)), b = m / Math.pow(10, e), n = b >= 5 ? 5 : b >= 2 ? 2 : 1, v = n * Math.pow(10, e);
    return { v, text: lenText(v) };
  }
  function lenText(v) {
    const a = Math.abs(v);
    if (a >= 1) return +v.toPrecision(3) + ' m';
    if (a >= 1e-2) return +(v * 100).toPrecision(3) + ' cm';
    if (a >= 1e-3) return +(v * 1000).toPrecision(3) + ' mm';
    if (a >= 1e-6) return +(v * 1e6).toPrecision(3) + ' µm';
    return +(v * 1e9).toPrecision(3) + ' nm';
  }
  /* a dashed callout from a point on a figure to an inset */
  function dashedCallout(ctx, x0, y0, r0, x1, y1, r1, col) {
    ctx.save(); ctx.strokeStyle = col || 'rgba(220,230,250,.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(x0, y0, r0, 0, TAU); ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0), b = a + Math.PI;
    ctx.beginPath(); ctx.moveTo(x0 + Math.cos(a) * r0, y0 + Math.sin(a) * r0); ctx.lineTo(x1 + Math.cos(b) * r1, y1 + Math.sin(b) * r1); ctx.stroke();
    ctx.restore();
  }
  /* part labels set in a column beside a figure, leaders to their parts, never overlapping */
  function sideLabels(ctx, items, o) {
    o = o || {};
    const lh = o.lh || 15, col = o.col || '#DCE6F6';
    ['L', 'R'].forEach(side => {
      const its = items.filter(it => (it.side || (it.x < o.mid ? 'L' : 'R')) === side).sort((a, b) => a.y - b.y);
      let prev = -1e9; const top = o.top == null ? -1e9 : o.top, bot = o.bottom == null ? 1e9 : o.bottom;
      its.forEach(it => { it.ly = Math.max(it.y, prev + lh, top); prev = it.ly; });
      // if the column ran off the bottom, push it back up
      for (let i = its.length - 1; i >= 0; i--) { const lim = i === its.length - 1 ? bot : its[i + 1].ly - lh; if (its[i].ly > lim) its[i].ly = lim; }
      const xc = side === 'L' ? o.xL : o.xR;
      ctx.save(); ctx.font = mono(o.size || 10, 600); ctx.textBaseline = 'middle';
      its.forEach(it => {
        ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1;
        const ex = side === 'L' ? xc + 4 : xc - 4;
        ctx.beginPath(); ctx.moveTo(it.x, it.y); ctx.lineTo(ex + (side === 'L' ? 10 : -10), it.ly); ctx.lineTo(ex, it.ly); ctx.stroke();
        ctx.fillStyle = 'rgba(220,232,250,.9)'; ctx.beginPath(); ctx.arc(it.x, it.y, 1.8, 0, TAU); ctx.fill();
        ctx.textAlign = side === 'L' ? 'right' : 'left';
        const t = kit().fitText(ctx, it.text, o.maxW || 160);
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(t, xc, it.ly);
        ctx.fillStyle = it.col || col; ctx.fillText(t, xc, it.ly);
      });
      ctx.restore();
    });
  }
  /* a data card of rows; returns its height. rows: [[cell, …]], cell = string | {t, col, bold} */
  function rowsCard(g, S, title, rows, at, o) {
    o = o || {};
    const K = kit(), ctx = g.ctx, lh = o.lh || 15;
    const h = 30 + rows.length * lh + 4, r = K.cardSlot(g, S, o.chip || title, at.w, { x: at.x, y: at.y != null ? at.y : g.h - 26 - h - 6 });
    if (!r) return 0;
    K.card(ctx, r.x, r.y, r.w, h);
    ctx.save(); ctx.textBaseline = 'top'; ctx.font = sans(11.5, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left';
    ctx.fillText(K.fitText(ctx, title, r.w - 20), r.x + 10, r.y + 8);
    const cols = o.cols || [0, 0.4], W = r.w - 20;
    rows.forEach((row, i) => {
      const yy = r.y + 28 + i * lh;
      row.forEach((cell, j) => {
        const c = typeof cell === 'object' && cell ? cell : { t: String(cell) };
        const x = r.x + 10 + cols[j] * W, wj = ((j + 1 < cols.length ? cols[j + 1] : 1) - cols[j]) * W;
        ctx.fillStyle = c.col || (j === 0 ? '#DCE6F6' : '#AFC0D8'); ctx.font = c.bold ? mono(10.5, 700) : mono(10, 500);
        ctx.fillText(K.fitText(ctx, c.t, wj - 4), x, yy);
      });
    });
    ctx.restore();
    return h;
  }
  /* leaders from 3D points already projected, the 6B-2 way: name on whichever side has room */
  function benchLabels(ctx, cam, lab, bw, H) {
    lab.forEach(([at, text, dx, dy]) => {
      const q = cam.project(at); if (!q.ok || q.y + dy < 70 || q.y + dy > H - 30 || q.x < 0 || q.x > bw) return;
      ctx.save(); ctx.font = mono(10, 600);
      const tw = ctx.measureText(text).width, ex = q.x + dx; let left = dx < 0;
      if (left && ex - 3 - tw < 6) left = false; else if (!left && ex + 3 + tw > bw - 6) left = true;
      const room = left ? ex - 9 : bw - 6 - ex - 3, t = kit().fitText(ctx, text, Math.max(40, room));
      ctx.strokeStyle = 'rgba(210,222,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, q.y + dy); ctx.stroke();
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)';
      ctx.strokeText(t, ex + (left ? -3 : 3), q.y + dy); ctx.fillStyle = '#DCE6F6'; ctx.fillText(t, ex + (left ? -3 : 3), q.y + dy); ctx.restore();
    });
  }
  function tag(ctx, x, y, text, o) {
    o = o || {};
    ctx.save(); ctx.font = o.font || mono(o.size || 10, 700); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.2; ctx.strokeStyle = o.halo || 'rgba(5,8,15,.88)'; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col || '#EAF1FF'; ctx.fillText(text, x, y); ctx.restore();
  }
  function arrow(ctx, x0, y0, x1, y1, col, w) {
    const a = Math.atan2(y1 - y0, x1 - x0), hl = Math.max(6, (w || 2) * 3.2);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * hl * 0.6, y1 - Math.sin(a) * hl * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.42) * hl, y1 - Math.sin(a - 0.42) * hl); ctx.lineTo(x1 - Math.cos(a + 0.42) * hl, y1 - Math.sin(a + 0.42) * hl); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ============================================================
     THE HUMAN BODY — an anatomical plate, front view.
     Units: the figure is H tall, from the top of the head (y = 0) to the soles (y = 1);
     x = 0 on the midline, + to the figure's left (the viewer's right).
     o.show: { circ, resp, dig, exc, nerv, musc } systems drawn; o.focus: one system bright, the rest ghosted;
     o.off: an organ knocked out (greyed, ringed); o.flow: 0…1 phase for moving blood; o.labels.
     Returns the anchor of each organ in pixels.
     ============================================================ */
  const SKIN = '#C99B84', SKIN_D = '#7A5444';
  const ORG = {
    brain: [0, 0.058], lungs: [-0.056, 0.232], lungL: [0.056, 0.236], heart: [0.014, 0.268], liver: [-0.042, 0.336], stomach: [0.05, 0.345],
    pancreas: [0.02, 0.372], kidneys: [-0.05, 0.382], kidneyL: [0.05, 0.378], smallInt: [0, 0.44], largeInt: [-0.068, 0.42], bladder: [0, 0.505],
    trachea: [0, 0.18], cord: [0, 0.3], aorta: [0.01, 0.4], skin: [0.115, 0.3], muscle: [0.06, 0.66], gut: [0, 0.44], oesophagus: [0.004, 0.2]
  };
  function body(ctx, cx, top, H, o) {
    o = o || {};
    const X = x => cx + x * H, Y = y => top + y * H, S = v => v * H;
    const sh = o.show || { circ: true, resp: true, dig: true, exc: true, nerv: true };
    const focus = o.focus || null, off = o.off || null;
    const ghost = sys => focus && focus !== sys;
    const tone = (c, sys, organ) => { let col = c; if (ghost(sys)) col = mix(c, '#2A3248', 0.62); if (off && organ && off === organ) col = mix(c, '#4A4E58', 0.8); return col; };
    const A = {};
    Object.keys(ORG).forEach(k => { A[k] = [X(ORG[k][0]), Y(ORG[k][1])]; });
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    /* ---- limbs: lit tubes, tapering ---- */
    const skin = o.skin || SKIN;
    const limb = (pts, r0, r1) => RX.tube(ctx, spline(pts.map(q => [X(q[0]), Y(q[1])]), 8), t => S(lerp(r0, r1, t)), skin, { vivid: false });
    [-1, 1].forEach(s => {
      limb([[s * 0.118, 0.195], [s * 0.142, 0.29], [s * 0.152, 0.385], [s * 0.162, 0.48], [s * 0.168, 0.53]], 0.03, 0.019);
      limb([[s * 0.058, 0.5], [s * 0.056, 0.62], [s * 0.052, 0.735], [s * 0.048, 0.86], [s * 0.046, 0.955]], 0.056, 0.026);
      // hands and feet
      RX.blob(ctx, X(s * 0.172), Y(0.565), S(0.02), S(0.04), { fill: skin, r: S(0.03) });
      RX.blob(ctx, X(s * 0.06), Y(0.978), S(0.035), S(0.017), { fill: mix(skin, SKIN_D, 0.15), r: S(0.03) });
    });
    if (sh.musc) {     // the big limb muscles, over the skin as if it were drawn back
      const mus = (pts, r0, r1, sys) => RX.tube(ctx, spline(pts.map(q => [X(q[0]), Y(q[1])]), 8), t => S(lerp(r0, r1, Math.sin(t * Math.PI)) ), tone('#B2433C', 'musc', 'muscle'), {});
      [-1, 1].forEach(s => { mus([[s * 0.137, 0.235], [s * 0.145, 0.29], [s * 0.15, 0.36]], 0.008, 0.022); mus([[s * 0.06, 0.53], [s * 0.059, 0.6], [s * 0.054, 0.7]], 0.012, 0.042); mus([[s * 0.05, 0.76], [s * 0.052, 0.82], [s * 0.048, 0.9]], 0.008, 0.026); });
    }
    /* ---- torso and head ---- */
    const torso = c => smooth(c, [[0, 0.165], [0.06, 0.172], [0.118, 0.19], [0.128, 0.23], [0.112, 0.3], [0.092, 0.385], [0.1, 0.45], [0.114, 0.5], [0.08, 0.535], [0, 0.528], [-0.08, 0.535], [-0.114, 0.5], [-0.1, 0.45], [-0.092, 0.385], [-0.112, 0.3], [-0.128, 0.23], [-0.118, 0.19], [-0.06, 0.172]].map(q => [X(q[0]), Y(q[1])]), true);
    RX.volume(ctx, torso, { fill: skin, r: S(0.13), cx: X(0), cy: Y(0.33), shadow: 0.25, vivid: false });
    RX.tube(ctx, [[X(0), Y(0.11)], [X(0), Y(0.18)]], S(0.026), skin, { vivid: false });
    RX.volume(ctx, c => c.ellipse(X(0), Y(0.065), S(0.046), S(0.062), 0, 0, TAU), { fill: skin, r: S(0.05), cx: X(0), cy: Y(0.065), shadow: 0.2, vivid: false });
    /* ---- the opened body: a dark cavity in the trunk and skull, organs inside ---- */
    const cavity = c => smooth(c, [[0, 0.178], [0.085, 0.192], [0.1, 0.25], [0.084, 0.33], [0.074, 0.4], [0.082, 0.47], [0.06, 0.52], [0, 0.522], [-0.06, 0.52], [-0.082, 0.47], [-0.074, 0.4], [-0.084, 0.33], [-0.1, 0.25], [-0.085, 0.192]].map(q => [X(q[0]), Y(q[1])]), true);
    ctx.save(); ctx.beginPath(); cavity(ctx);
    const cg = ctx.createRadialGradient(X(0), Y(0.35), S(0.02), X(0), Y(0.35), S(0.2));
    cg.addColorStop(0, '#2A1418'); cg.addColorStop(1, '#4A2A28'); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = rgba(SKIN_D, 0.9); ctx.lineWidth = S(0.004); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.ellipse(X(0), Y(0.058), S(0.038), S(0.042), 0, 0, TAU); ctx.fillStyle = '#2A1418'; ctx.fill(); ctx.restore();

    /* ---- nervous: brain, spinal cord, nerves (drawn first: they lie deepest) ---- */
    if (sh.nerv) {
      const nc = tone('#E8C870', 'nerv', 'cord');
      RX.tube(ctx, [[X(0), Y(0.1)], [X(0), Y(0.2)], [X(0), Y(0.32)], [X(0), Y(0.46)]], S(0.006), nc, {});
      [-1, 1].forEach(s => {
        RX.tube(ctx, spline([[X(0), Y(0.2)], [X(s * 0.08), Y(0.2)], [X(s * 0.135), Y(0.27)], [X(s * 0.152), Y(0.4)], [X(s * 0.167), Y(0.53)]], 6), S(0.0026), nc, {});
        RX.tube(ctx, spline([[X(0), Y(0.46)], [X(s * 0.045), Y(0.5)], [X(s * 0.056), Y(0.62)], [X(s * 0.05), Y(0.78)], [X(s * 0.047), Y(0.95)]], 6), S(0.003), nc, {});
        for (let k = 0; k < 5; k++) RX.tube(ctx, [[X(0), Y(0.24 + k * 0.045)], [X(s * 0.07), Y(0.27 + k * 0.045)]], S(0.0015), nc, {});
      });
      const bc = tone('#E3A5A0', 'nerv', 'brain');
      solid(ctx, c => c.ellipse(X(0), Y(0.056), S(0.036), S(0.038), 0, 0, TAU), bc, S(0.04), { cx: X(0), cy: Y(0.056), shadow: 0 });
      ctx.save(); ctx.strokeStyle = rgba(mix(bc, '#40141C', 0.6), 0.7); ctx.lineWidth = S(0.0022);
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI; ctx.beginPath(); ctx.moveTo(X(Math.cos(a) * 0.012), Y(0.056 - Math.sin(a) * 0.01)); ctx.quadraticCurveTo(X(Math.cos(a) * 0.03), Y(0.05 - Math.sin(a) * 0.03), X(Math.cos(a + 0.2) * 0.033), Y(0.06 - Math.sin(a + 0.2) * 0.03)); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(X(0), Y(0.02)); ctx.lineTo(X(0), Y(0.09)); ctx.stroke(); ctx.restore();
    }
    /* ---- excretory: kidneys, ureters, bladder (behind the gut) ---- */
    if (sh.exc) {
      [-1, 1].forEach(s => {
        const k = tone('#8E3A30', 'exc', 'kidneys'), kx = s * 0.05, ky = s < 0 ? 0.382 : 0.376;
        solid(ctx, c => { c.save(); c.translate(X(kx), Y(ky)); c.rotate(s * 0.25); c.beginPath(); c.ellipse(0, 0, S(0.017), S(0.028), 0, 0, TAU); c.restore(); }, k, S(0.025), { cx: X(kx), cy: Y(ky) });
        RX.tube(ctx, spline([[X(kx - s * 0.008), Y(ky + 0.01)], [X(s * 0.03), Y(0.44)], [X(s * 0.01), Y(0.5)]], 6), S(0.0022), tone('#E8D8A0', 'exc', 'kidneys'), {});
      });
      solid(ctx, c => c.ellipse(X(0), Y(0.505), S(0.022), S(0.015), 0, 0, TAU), tone('#D8B080', 'exc', 'bladder'), S(0.02), { cx: X(0), cy: Y(0.505) });
    }
    /* ---- circulatory: the great vessels, then the heart ---- */
    const flow = o.flow || 0;
    if (sh.circ) {
      const art = tone('#C8282E', 'circ', 'heart'), ven = tone('#3A4EA8', 'circ', 'heart');
      const ves = (pts, r, col) => RX.tube(ctx, spline(pts.map(q => [X(q[0]), Y(q[1])]), 6), S(r), col, {});
      [-1, 1].forEach(s => {
        ves([[s * 0.02, 0.2], [s * 0.07, 0.195], [s * 0.125, 0.24], [s * 0.145, 0.33], [s * 0.155, 0.45], [s * 0.165, 0.54]], 0.0032, s > 0 ? art : ven);
        ves([[s * 0.006, 0.47], [s * 0.04, 0.5], [s * 0.055, 0.6], [s * 0.05, 0.75], [s * 0.047, 0.94]], 0.0042, s > 0 ? art : ven);
        ves([[s * 0.012, 0.21], [s * 0.016, 0.15], [s * 0.016, 0.1]], 0.0028, s > 0 ? art : ven);
      });
      ves([[-0.012, 0.13], [-0.014, 0.2], [-0.012, 0.27], [-0.01, 0.4], [-0.008, 0.48]], 0.0062, ven);
      ves([[0.02, 0.255], [0.018, 0.21], [0.028, 0.205], [0.012, 0.3], [0.01, 0.4], [0.008, 0.475]], 0.0066, art);
      // pulses of blood moving along the aorta and down the legs
      if (o.pulse) {
        ctx.save(); ctx.fillStyle = rgba('#FFE0D8', 0.75);
        for (let k = 0; k < 4; k++) { const u = ((flow + k / 4) % 1); const yy = lerp(0.3, 0.92, u), xx = yy < 0.475 ? 0.01 : 0.04 + (yy - 0.475) * 0.02; ctx.beginPath(); ctx.arc(X(xx), Y(yy), S(0.004), 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    }
    /* ---- respiratory: trachea, bronchi, lungs ---- */
    if (sh.resp) {
      const lc = tone('#D88A8E', 'resp', 'lungs');
      [-1, 1].forEach(s => {
        const lung = c => smooth(c, (s < 0 ? [[-0.012, 0.19], [-0.05, 0.178], [-0.088, 0.21], [-0.098, 0.28], [-0.09, 0.31], [-0.03, 0.302], [-0.018, 0.25]] : [[0.016, 0.19], [0.05, 0.18], [0.086, 0.215], [0.096, 0.285], [0.086, 0.315], [0.05, 0.31], [0.042, 0.27], [0.03, 0.26], [0.024, 0.22]]).map(q => [X(q[0]), Y(q[1])]), true);
        solid(ctx, lung, lc, S(0.06), { cx: X(s * 0.06), cy: Y(0.24) });
        ctx.save(); ctx.beginPath(); lung(ctx); ctx.clip(); ctx.strokeStyle = rgba(mix(lc, '#4A1418', 0.5), 0.55); ctx.lineWidth = S(0.0022);
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(X(s * 0.012), Y(0.2)); ctx.quadraticCurveTo(X(s * 0.05), Y(0.2 + k * 0.02), X(s * (0.06 + 0.03 * Math.sin(k))), Y(0.21 + k * 0.018)); ctx.stroke(); }
        ctx.restore();
      });
      const tc = tone('#E6D2C4', 'resp', 'lungs');
      RX.tube(ctx, [[X(0), Y(0.135)], [X(0), Y(0.195)]], S(0.0065), tc, {});
      [-1, 1].forEach(s => RX.tube(ctx, spline([[X(0), Y(0.195)], [X(s * 0.02), Y(0.21)], [X(s * 0.04), Y(0.23)]], 5), S(0.0042), tc, {}));
      if (o.off === 'lungs') { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.ellipse(X(0), Y(0.245), S(0.11), S(0.08), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    if (sh.circ) {
      // the heart sits between the lungs, apex to the figure's left
      const hc = tone('#B8423A', 'circ', 'heart'), beat = o.beat || 0;
      const hs = 1 - 0.06 * beat;
      const hp = c => { c.save(); c.translate(X(0.014), Y(0.268)); c.rotate(-0.5); c.scale(hs, hs); c.beginPath(); smooth(c, [[0, -S(0.03)], [S(0.026), -S(0.022)], [S(0.032), S(0.004)], [S(0.012), S(0.034)], [0, S(0.04)], [-S(0.014), S(0.028)], [-S(0.03), S(0.002)], [-S(0.024), -S(0.024)]], true); c.restore(); };
      solid(ctx, hp, hc, S(0.035), { cx: X(0.014), cy: Y(0.268) });
      ctx.save(); ctx.strokeStyle = rgba('#F0D070', 0.55); ctx.lineWidth = S(0.002); ctx.beginPath(); ctx.moveTo(X(0.0), Y(0.25)); ctx.quadraticCurveTo(X(0.02), Y(0.27), X(0.024), Y(0.296)); ctx.stroke(); ctx.restore();
    }
    /* ---- digestive: oesophagus, liver, stomach, pancreas, intestines ---- */
    if (sh.dig) {
      const dcol = (c, organ) => tone(c, 'dig', organ);
      RX.tube(ctx, spline([[X(0.004), Y(0.15)], [X(0.006), Y(0.25)], [X(0.02), Y(0.315)], [X(0.035), Y(0.33)]], 6), S(0.0045), dcol('#D69A88', 'stomach'), {});
      // large intestine: a frame round the coils
      const li = spline([[-0.052, 0.48], [-0.066, 0.45], [-0.068, 0.41], [-0.05, 0.395], [0, 0.4], [0.05, 0.392], [0.068, 0.41], [0.066, 0.46], [0.04, 0.49], [0.012, 0.5], [0.004, 0.515]].map(q => [X(q[0]), Y(q[1])]), 8);
      RX.tube(ctx, li, S(0.011), dcol('#C88A64', 'largeInt'), {});
      ctx.save(); ctx.strokeStyle = rgba('#6A3A24', 0.45); ctx.lineWidth = S(0.0016);
      for (let i = 4; i < li.length - 2; i += 4) { const a = li[i], b = li[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; ctx.beginPath(); ctx.moveTo(a[0] - Math.cos(ang) * S(0.01), a[1] - Math.sin(ang) * S(0.01)); ctx.lineTo(a[0] + Math.cos(ang) * S(0.01), a[1] + Math.sin(ang) * S(0.01)); ctx.stroke(); }
      ctx.restore();
      // small intestine: a coiled tube packed inside
      const si = []; for (let k = 0; k <= 160; k++) { const u = k / 160, a = u * TAU * 6.5; si.push([X(Math.sin(a) * (0.03 + 0.012 * Math.sin(u * 17)) + 0.004 * Math.sin(u * 40)), Y(0.415 + u * 0.06 + Math.cos(a) * 0.014)]); }
      RX.tube(ctx, si, S(0.0062), dcol('#E2A68E', 'smallInt'), {});
      // liver: the big wedge under the right dome of the diaphragm
      solid(ctx, c => smooth(c, [[-0.09, 0.318], [-0.04, 0.304], [0.02, 0.31], [0.05, 0.322], [0.02, 0.338], [-0.03, 0.36], [-0.07, 0.376], [-0.09, 0.36]].map(q => [X(q[0]), Y(q[1])]), true), dcol('#8A3A2C', 'liver'), S(0.06), { cx: X(-0.04), cy: Y(0.335) });
      // stomach: a J under the left dome
      solid(ctx, c => smooth(c, [[0.03, 0.322], [0.062, 0.318], [0.078, 0.34], [0.07, 0.37], [0.04, 0.382], [0.012, 0.376], [0.004, 0.364], [0.03, 0.36], [0.046, 0.348], [0.038, 0.334]].map(q => [X(q[0]), Y(q[1])]), true), dcol('#D99484', 'stomach'), S(0.035), { cx: X(0.05), cy: Y(0.35) });
      solid(ctx, c => c.ellipse(X(0.02), Y(0.376), S(0.028), S(0.006), -0.15, 0, TAU), dcol('#E2B888', 'pancreas'), S(0.02), { cx: X(0.02), cy: Y(0.376), shadow: 0.1 });
      if (off === 'liver' || off === 'stomach' || off === 'gut') {
        const at = off === 'liver' ? [-0.04, 0.338, 0.06, 0.04] : off === 'stomach' ? [0.045, 0.35, 0.045, 0.04] : [0, 0.445, 0.09, 0.065];
        ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.ellipse(X(at[0]), Y(at[1]), S(at[2]), S(at[3]), 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    if (off && ['heart', 'kidneys', 'brain'].includes(off)) {
      const at = off === 'heart' ? [0.014, 0.268, 0.045] : off === 'kidneys' ? [0, 0.38, 0.075] : [0, 0.056, 0.05];
      ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.ellipse(X(at[0]), Y(at[1]), S(at[2]), S(at[2] * (off === 'kidneys' ? 0.45 : 0.9)), 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (off === 'skin') { ctx.save(); ctx.strokeStyle = '#FF6A60'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); torso(ctx); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    return A;
  }

  /* ============================================================
     A BEAN PLANT in a pot of soil cut away to show the roots.
     (cx, base) is the soil surface; h the height of the shoot.
     o.focus: 'shoot' | 'root' to ghost the other system.
     ============================================================ */
  function plant(ctx, cx, base, h, o) {
    o = o || {};
    const ghost = sys => o.focus && o.focus !== sys;
    const g = (c, sys) => ghost(sys) ? mix(c, '#2A3248', 0.6) : c;
    const S = v => v * h, A = {};
    // pot and soil, cut away
    const pw = S(0.42), ph = S(0.36);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - pw * 0.5, base - S(0.02)); ctx.lineTo(cx + pw * 0.5, base - S(0.02)); ctx.lineTo(cx + pw * 0.4, base + ph); ctx.lineTo(cx - pw * 0.4, base + ph); ctx.closePath();
    const sg = ctx.createLinearGradient(0, base, 0, base + ph); sg.addColorStop(0, '#4A3424'); sg.addColorStop(1, '#2E2016'); ctx.fillStyle = sg; ctx.fill();
    const rr = rng(5); ctx.fillStyle = 'rgba(160,130,95,.35)'; for (let i = 0; i < 160; i++) { const u = rr(), v = rr(); ctx.fillRect(cx + (u - 0.5) * pw * (0.95 - 0.2 * v), base + v * ph, 1.4, 1.4); }
    ctx.restore();
    // roots: a tap root and laterals, with a fuzz of root hairs behind the tips
    const rc = g('#E8D8B8', 'root');
    const roots = [[[0, 0], [0.004, 0.08], [-0.006, 0.18], [0.002, 0.3]]];
    for (let k = 0; k < 7; k++) { const y0 = 0.03 + k * 0.035, s = k % 2 ? 1 : -1, L = 0.09 + 0.05 * Math.sin(k * 1.7) + (6 - k) * 0.01; roots.push([[0, y0], [s * L * 0.5, y0 + 0.03], [s * L, y0 + 0.08 + k * 0.006]]); }
    roots.forEach((r, i) => {
      const pts = spline(r.map(q => [cx + S(q[0]), base + S(q[1])]), 6);
      RX.tube(ctx, pts, t => S(i ? 0.0045 * (1 - t * 0.6) : 0.008 * (1 - t * 0.6)), rc, {});
      if (!ghost('root')) { ctx.save(); ctx.strokeStyle = rgba('#F4ECD8', 0.6); ctx.lineWidth = 0.7; for (let j = Math.floor(pts.length * 0.55); j < pts.length - 2; j++) { const a = pts[j], b = pts[j + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + Math.cos(ang) * sd * S(0.012), a[1] + Math.sin(ang) * sd * S(0.012)); ctx.stroke(); }); } ctx.restore(); }
    });
    A.root = [cx + S(0.06), base + S(0.12)];
    // pot rim
    ctx.save(); const rimG = ctx.createLinearGradient(cx - pw * 0.55, 0, cx + pw * 0.55, 0); rimG.addColorStop(0, '#9A4A30'); rimG.addColorStop(0.4, '#C8704A'); rimG.addColorStop(1, '#6A3020');
    ctx.fillStyle = rimG; ctx.fillRect(cx - pw * 0.55, base - S(0.05), pw * 1.1, S(0.045));
    ctx.strokeStyle = 'rgba(40,16,8,.6)'; ctx.strokeRect(cx - pw * 0.55, base - S(0.05), pw * 1.1, S(0.045));
    ctx.strokeStyle = 'rgba(200,120,80,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - pw * 0.5, base - S(0.005)); ctx.lineTo(cx - pw * 0.4, base + ph); ctx.moveTo(cx + pw * 0.5, base - S(0.005)); ctx.lineTo(cx + pw * 0.4, base + ph); ctx.stroke();
    ctx.restore();
    // stem with nodes
    const sc = g('#5E9A3A', 'shoot');
    const stem = spline([[cx, base - S(0.04)], [cx - S(0.015), base - S(0.35)], [cx + S(0.012), base - S(0.65)], [cx - S(0.005), base - S(0.98)]], 8);
    RX.tube(ctx, stem, t => S(0.011 * (1 - 0.45 * t)), sc, {});
    A.stem = stem[Math.floor(stem.length * 0.3)];
    // trifoliate leaves on petioles
    const leaf = (x, y, ang, L) => {
      const lc = g('#3E8A2E', 'shoot');
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const lp = c => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(L * 0.3, -L * 0.36, L * 0.78, -L * 0.24, L, 0); c.bezierCurveTo(L * 0.78, L * 0.24, L * 0.3, L * 0.36, 0, 0); c.closePath(); };
      RX.volume(ctx, lp, { fill: lc, r: L * 0.4, cx: L * 0.45, cy: 0, shadow: 0.25 });
      ctx.strokeStyle = rgba(mix(lc, '#E8F4C0', 0.5), 0.7); ctx.lineWidth = Math.max(0.6, L * 0.018);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * 0.95, 0); ctx.stroke();
      ctx.lineWidth = Math.max(0.4, L * 0.008);
      for (let k = 1; k < 6; k++) { const u = k / 6 * L; ctx.beginPath(); ctx.moveTo(u, 0); ctx.quadraticCurveTo(u + L * 0.08, -L * 0.12, u + L * 0.1, -L * 0.2 * Math.sin(k / 6 * Math.PI)); ctx.moveTo(u, 0); ctx.quadraticCurveTo(u + L * 0.08, L * 0.12, u + L * 0.1, L * 0.2 * Math.sin(k / 6 * Math.PI)); ctx.stroke(); }
      ctx.restore();
    };
    [[0.32, -1, 0.3], [0.55, 1, 0.34], [0.78, -1, 0.3]].forEach(([u, s, L], i) => {
      const p = stem[Math.floor(u * (stem.length - 1))];
      const end = [p[0] + s * S(0.16), p[1] - S(0.05)];
      RX.tube(ctx, [p, [lerp(p[0], end[0], 0.5), p[1] - S(0.04)], end], S(0.004), sc, {});
      leaf(end[0], end[1], s > 0 ? -0.25 : Math.PI + 0.25, S(L * 0.62));
      leaf(end[0], end[1], s > 0 ? -1.15 : Math.PI + 1.15, S(L * 0.5));
      leaf(end[0], end[1], s > 0 ? 0.55 : Math.PI - 0.55, S(L * 0.5));
      if (i === 1) A.leaf = [end[0] + s * S(0.12), end[1] - S(0.02)];
    });
    const tip = stem[stem.length - 1];
    leaf(tip[0], tip[1], -1.75, S(0.16)); leaf(tip[0], tip[1], -1.35, S(0.15));
    return A;
  }

  /* ============================================================
     ZOOM LEVELS — each draws itself into a square field 1000 px on a side,
     centred on (0, 0), and the lab scales it: a level is drawn at
     (its field ÷ the view's field) of the view, so it stays sharp at any
     zoom and keeps its lighting (RX fades shading below ~10 px).
     ============================================================ */
  const LV = {};
  const F0 = c => { c.fillRect(-500, -500, 1000, 1000); };
  LV.body = (ctx, o) => { ctx.fillStyle = '#0B1220'; F0(ctx); body(ctx, 0, -440, 880, { show: { circ: true, resp: true, dig: true, exc: true, nerv: true }, beat: o.beat, flow: o.flow, pulse: true }); };
  LV.circ = (ctx, o) => { ctx.fillStyle = '#0B1220'; F0(ctx); body(ctx, 0, -1150, 3200, { show: { circ: true, resp: true, dig: true, exc: true, nerv: false }, focus: 'circ', beat: o.beat, flow: o.flow, pulse: true }); };
  LV.heart = (ctx, o) => { ctx.fillStyle = '#140C12'; F0(ctx); if (window.BIOART) BIOART.heart(ctx, 20, 20, 330, { contraction: o.beat || 0, labels: false, leaders: false }); };
  // cardiac muscle tissue: branching striated cells joined end to end by intercalated discs, capillaries between
  LV.cardiac = (ctx, o) => {
    const r = rng(11), beat = o.beat || 0;
    ctx.fillStyle = '#3A1C24'; F0(ctx);
    const rows = 7;
    for (let j = 0; j < rows; j++) {
      const y0 = -500 + (j + 0.5) * 1000 / rows, hh = 105 * (1 + 0.08 * beat);
      let x = -620 + r() * 120;
      while (x < 600) {
        const L = (200 + r() * 80) * (1 - 0.06 * beat), y = y0 + Math.sin(x / 160 + j) * 12;
        const cell = c => { c.beginPath(); if (c.roundRect) c.roundRect(x, y - hh / 2, L, hh, 20); else c.rect(x, y - hh / 2, L, hh); };
        RX.body(ctx, cell, { fill: '#B8475A', r: 50, ao: 0.4, rim: 0.4, stipple: 0.15, contour: 1.2 });
        ctx.save(); ctx.beginPath(); cell(ctx); ctx.clip(); ctx.lineWidth = 3;
        for (let s = x + 6; s < x + L; s += 12.5 * (1 - 0.06 * beat)) { ctx.strokeStyle = 'rgba(70,14,30,.5)'; ctx.beginPath(); ctx.moveTo(s, y - hh / 2); ctx.lineTo(s, y + hh / 2); ctx.stroke(); }
        ctx.restore();
        RX.blob(ctx, x + L * 0.5, y, 24, 12, { fill: '#5A3A8A', r: 18 });
        ctx.save(); ctx.strokeStyle = '#2A0A18'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + L, y - hh / 2); ctx.lineTo(x + L, y - hh / 6); ctx.lineTo(x + L + 8, y - hh / 6); ctx.lineTo(x + L + 8, y + hh / 6); ctx.lineTo(x + L, y + hh / 6); ctx.lineTo(x + L, y + hh / 2); ctx.stroke(); ctx.restore();
        x += L + 6;
      }
      if (j < rows - 1) {
        const yc = y0 + 500 / rows;
        RX.tube(ctx, [[-520, yc], [520, yc]], 7, '#D8A098', { vivid: false });
        for (let k = 0; k < 9; k++) { const xx = -520 + ((k / 9 + (o.flow || 0) * 0.3 + j * 0.13) % 1) * 1040; RX.blob(ctx, xx, yc, 9, 5, { fill: '#D02A2A', r: 8 }); }
      }
    }
  };
  // one heart muscle cell: striations, a central nucleus, rows of mitochondria between the fibrils
  LV.cmcell = (ctx, o) => {
    ctx.fillStyle = '#2A1820'; F0(ctx);
    const beat = o.beat || 0, w = 780 * (1 - 0.08 * beat), h = 220 * (1 + 0.08 * beat);
    const cell = c => { c.beginPath(); smooth(c, [[-w / 2, -h / 2], [-w / 4, -h / 2 - 10], [w / 4, -h / 2], [w / 2, -h / 2 - 30], [w / 2 + 40, -h / 2 - 80], [w / 2 + 60, -h / 2 - 20], [w / 2, 0], [w / 2 + 30, h / 2], [w / 4, h / 2 + 10], [-w / 4, h / 2], [-w / 2, h / 2], [-w / 2 - 20, 0]], true); };
    RX.body(ctx, cell, { fill: '#C04E62', r: 120, ao: 0.5, rim: 0.5, stipple: 0.1, contour: 2 });
    ctx.save(); ctx.beginPath(); cell(ctx); ctx.clip();
    for (let k = 0; k < 5; k++) {
      const y = -h / 2 + (k + 0.5) * h / 5;
      ctx.fillStyle = 'rgba(120,30,50,.35)'; ctx.fillRect(-600, y - h / 14, 1200, h / 7);
      for (let s = -600; s < 600; s += 40 * (1 - 0.08 * beat)) { ctx.fillStyle = 'rgba(60,10,30,.55)'; ctx.fillRect(s, y - h / 14, 12, h / 7); ctx.fillStyle = 'rgba(255,220,230,.25)'; ctx.fillRect(s + 18, y - h / 14, 8, h / 7); }
      if (k < 4) for (let s = -550; s < 550; s += 45) RX.blob(ctx, s + 20 * (k % 2), y + h / 10, 16, 6, { fill: '#E2A040', r: 10 });
    }
    ctx.restore();
    RX.blob(ctx, 0, 0, 70, 35, { fill: '#6A4AA0', r: 50 });
    ctx.save(); ctx.fillStyle = 'rgba(30,10,60,.6)'; ctx.beginPath(); ctx.arc(10, 0, 12, 0, TAU); ctx.fill(); ctx.restore();
  };
  // a mitochondrion in section between two myofibrils
  LV.mito = (ctx, o) => {
    ctx.fillStyle = '#3A2A30'; F0(ctx);
    [-360, 360].forEach(y => { ctx.fillStyle = '#5A4048'; ctx.fillRect(-500, y - 100, 1000, 200); for (let s = -500; s < 500; s += 110) { ctx.fillStyle = '#2A1820'; ctx.fillRect(s, y - 100, 30, 200); ctx.fillStyle = 'rgba(200,170,180,.25)'; ctx.fillRect(s + 50, y - 100, 14, 200); } });
    const mp = c => { c.beginPath(); smooth(c, [[-400, 0], [-320, -150], [0, -170], [320, -150], [400, 0], [320, 150], [0, 170], [-320, 150]], true); };
    RX.body(ctx, mp, { fill: '#C8A070', r: 200, ao: 0.4, rim: 0.4, stipple: 0.2, contour: 3 });
    ctx.save(); ctx.beginPath(); mp(ctx); ctx.clip();
    ctx.strokeStyle = '#6A4424'; ctx.lineWidth = 8; ctx.save(); ctx.scale(0.93, 0.86); ctx.beginPath(); smooth(ctx, [[-400, 0], [-320, -150], [0, -170], [320, -150], [400, 0], [320, 150], [0, 170], [-320, 150]], true); ctx.restore(); ctx.stroke();
    for (let k = -6; k <= 6; k++) { const x = k * 50, up = k % 2 === 0; ctx.beginPath(); ctx.moveTo(x, up ? -150 : 150); ctx.quadraticCurveTo(x + 20, 0, x, up ? 60 : -60); ctx.lineWidth = 14; ctx.strokeStyle = '#7A4E2A'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#E8C898'; ctx.stroke(); }
    const r = rng(3); ctx.fillStyle = '#3A2010'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * 600, (r() - 0.5) * 200, 8, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  // ATP synthase in the inner membrane: protons flow through, the rotor turns, ATP leaves
  LV.atp = (ctx, o) => {
    ctx.fillStyle = '#1E2230'; F0(ctx);
    for (let x = -500; x < 520; x += 30) [-70, 70].forEach((y, i) => { if (Math.abs(x) < 130) return; ctx.strokeStyle = '#8A7040'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + (i ? -12 : 12)); ctx.lineTo(x + 4, y + (i ? -55 : 55)); ctx.stroke(); RX.ball(ctx, x, y, 13, '#C8A040', { shadow: false }); });
    const rot = (o.t || 0) * 2.2;
    for (let k = 0; k < 10; k++) { const a = rot + k / 10 * TAU, x = Math.cos(a) * 90; RX.ball(ctx, x, Math.sin(a) * 12, 24, Math.sin(a) > 0 ? '#5A8AD8' : '#3A62A8', { shadow: false }); }
    RX.tube(ctx, [[0, -20], [0, -200]], 20, '#D8D8E8', {});
    RX.tube(ctx, [[130, 20], [140, -200], [100, -330]], 12, '#8AA0B8', {});
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; RX.ball(ctx, Math.cos(a) * 100, -300 + Math.sin(a) * 35, 70, k % 2 ? '#D86A5A' : '#E8B04A', {}); }
    for (let k = 0; k < 5; k++) { const u = ((o.t || 0) * 0.4 + k / 5) % 1; RX.ball(ctx, -50 + 100 * Math.sin(u * 3 + k), lerp(360, 0, u), 14, '#FF7070', { shadow: false }); }
    const u = ((o.t || 0) * 0.3) % 1; RX.ball(ctx, 120 + u * 180, -360 - u * 80, 20, '#F0F0A0', { shadow: false });
  };
  LV.plant = (ctx, o) => { ctx.fillStyle = '#0B1220'; F0(ctx); plant(ctx, 0, 80, 500, {}); };
  LV.shoot = (ctx, o) => { ctx.fillStyle = '#0B1220'; F0(ctx); plant(ctx, 40, 420, 950, { focus: 'shoot' }); };
  LV.leaf = (ctx, o) => { ctx.fillStyle = '#0E1A12'; F0(ctx); if (window.CELL && CELL.leafDraw) { ctx.save(); ctx.scale(4.2, 4.2); CELL.leafDraw(ctx, 0, 0, 100, { foil: false }, 'fresh'); ctx.restore(); } };
  // a leaf in section: cuticle, upper epidermis, palisade, spongy mesophyll with air spaces, lower epidermis, a stoma, a vein
  LV.leafsec = (ctx, o) => {
    ctx.fillStyle = '#0E1A12'; F0(ctx);
    const r = rng(21), top = -320, bot = 340;
    ctx.fillStyle = 'rgba(230,240,180,.7)'; ctx.fillRect(-500, top - 12, 1000, 12);
    for (let x = -500; x < 500; x += 70) RX.body(ctx, c => { c.beginPath(); c.rect(x + 2, top, 66, 50); }, { fill: '#D8E8C0', r: 30, ao: 0.3, rim: 0.3, contour: 1.2 });
    for (let x = -500; x < 500; x += 60) {
      const cp = c => { c.beginPath(); if (c.roundRect) c.roundRect(x + 4, top + 56, 52, 200, 20); else c.rect(x + 4, top + 56, 52, 200); };
      RX.body(ctx, cp, { fill: '#B8DCA0', r: 30, ao: 0.3, rim: 0.3, contour: 1.2 });
      for (let k = 0; k < 9; k++) RX.blob(ctx, x + (k % 2 ? 16 : 44), top + 72 + k * 21, 11, 8, { fill: '#2E9A3A', r: 8 });
    }
    for (let i = 0; i < 27; i++) {
      const x = -480 + (i % 9) * 120 + (r() - 0.5) * 30, y = top + 310 + Math.floor(i / 9) * 85 + (r() - 0.5) * 20;
      RX.body(ctx, c => { c.beginPath(); c.ellipse(x, y, 45 + r() * 10, 30, r(), 0, TAU); }, { fill: '#C8E0A8', r: 30, ao: 0.3, rim: 0.3, contour: 1.2 });
      for (let k = 0; k < 4; k++) RX.blob(ctx, x + (r() - 0.5) * 50, y + (r() - 0.5) * 30, 9, 7, { fill: '#3AA040', r: 7 });
    }
    for (let x = -500; x < 500; x += 65) if (Math.abs(x - 70) > 50) RX.body(ctx, c => { c.beginPath(); c.rect(x + 2, bot - 45, 61, 45); }, { fill: '#D8E8C0', r: 30, ao: 0.3, rim: 0.3, contour: 1.2 });
    [-1, 1].forEach(s => RX.blob(ctx, 70 + s * 22, bot - 25, 20, 24, { fill: '#A8D890', r: 18 }));
    RX.blob(ctx, -250, 80, 70, 60, { fill: '#C8B890', r: 50 });
    for (let k = 0; k < 7; k++) RX.ball(ctx, -250 + Math.cos(k) * 35, 80 + Math.sin(k) * 30, 12, '#8A6A40', { shadow: false });
  };
  // one palisade cell: wall, a thin layer of cytoplasm with chloroplasts round a big vacuole, nucleus
  LV.palisade = (ctx, o) => {
    ctx.fillStyle = '#0E1A12'; F0(ctx);
    const w = 340, h = 840;
    [-420, 420].forEach(x => RX.body(ctx, c => { c.beginPath(); if (c.roundRect) c.roundRect(x - w / 2, -h / 2, w, h, 60); else c.rect(x - w / 2, -h / 2, w, h); }, { fill: '#8AB878', r: 100, ao: 0.4, contour: 2 }));
    ctx.save(); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 70); else ctx.rect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#D8ECC0'; ctx.fill(); ctx.lineWidth = 18; ctx.strokeStyle = '#7AA060'; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-w / 2 + 50, -h / 2 + 50, w - 100, h - 100, 40); else ctx.rect(-w / 2 + 50, -h / 2 + 50, w - 100, h - 100); ctx.fillStyle = 'rgba(190,220,236,.75)'; ctx.fill(); ctx.restore();
    const r = rng(9);
    for (let k = 0; k < 7; k++) [-1, 1].forEach(s => RX.blob(ctx, s * (w / 2 - 32), lerp(-h / 2 + 70, h / 2 - 70, (k + 0.3 + r() * 0.4) / 7), 21, 36, { fill: '#2E9A3A', r: 30 }));
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) RX.blob(ctx, lerp(-w / 2 + 80, w / 2 - 80, (k + 0.5) / 3), s * (h / 2 - 32), 36, 21, { fill: '#2E9A3A', r: 30 }); });
    RX.blob(ctx, -w / 2 + 62, 120, 40, 60, { fill: '#7A5AA8', r: 40 });
  };
  // a chloroplast: envelope, stroma, thylakoids stacked into grana, a starch grain
  LV.chloro = (ctx, o) => {
    ctx.fillStyle = '#16301E'; F0(ctx);
    const pts = [[-420, 0], [-300, -190], [0, -220], [300, -190], [420, 0], [300, 190], [0, 220], [-300, 190]];
    const cp = c => { c.beginPath(); smooth(c, pts, true); };
    RX.body(ctx, cp, { fill: '#8CC070', r: 200, ao: 0.4, rim: 0.4, stipple: 0.15, contour: 3 });
    ctx.save(); ctx.beginPath(); cp(ctx); ctx.clip();
    for (let gx = -300; gx <= 310; gx += 120) for (let gy = -100; gy <= 110; gy += 100) {
      const n = 6 + Math.abs((gx / 120 + gy / 100) | 0) % 3;
      for (let k = 0; k < n; k++) { const yy = gy - n * 6 + k * 12; ctx.fillStyle = k % 2 ? '#1E6A2A' : '#2E8A3A'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(gx - 35, yy, 70, 9, 4); else ctx.rect(gx - 35, yy, 70, 9); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,100,40,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx + 35, gy); ctx.lineTo(gx + 85, gy + 30); ctx.stroke();
    }
    RX.blob(ctx, 50, 130, 60, 30, { fill: '#F0F0E0', r: 40 });
    ctx.restore();
  };
  // chlorophyll a: the porphyrin ring round its magnesium, and its long tail
  LV.chlorophyll = (ctx, o) => {
    ctx.fillStyle = '#10161E'; F0(ctx);
    const atoms = [[-120, -80, 'Mg']], bonds = [];
    const ring = (cx, cy, n, R, a0) => { const ids = []; for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU; atoms.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, 'C']); ids.push(atoms.length - 1); } for (let k = 0; k < n; k++) bonds.push([ids[k], ids[(k + 1) % n]]); return ids; };
    const pyr = [[-120, -270], [70, -80], [-120, 110], [-310, -80]].map(([x, y], i) => { const a0 = Math.atan2(-80 - y, -120 - x); const ids = ring(x, y, 5, 60, a0); atoms[ids[0]][2] = 'N'; bonds.push([0, ids[0]]); return ids; });
    pyr.forEach((ids, i) => bonds.push([ids[2], pyr[(i + 1) % 4][3]]));
    let last = pyr[2][2]; for (let k = 0; k < 14; k++) { atoms.push([-60 + k * 35, 220 + (k % 2) * 30 + k * 12, 'C']); bonds.push([last, atoms.length - 1]); last = atoms.length - 1; }
    ctx.save(); ctx.strokeStyle = '#8A98B0'; ctx.lineWidth = 12; bonds.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(atoms[a][0], atoms[a][1]); ctx.lineTo(atoms[b][0], atoms[b][1]); ctx.stroke(); }); ctx.restore();
    atoms.forEach(([x, y, e]) => RX.ball(ctx, x, y, e === 'Mg' ? 40 : e === 'N' ? 24 : 20, e === 'Mg' ? '#5AD86A' : e === 'N' ? '#5A7AE8' : '#5A5A62', { shadow: false }));
  };

  window.G6B = { smooth, spline, solid, circle, plate, caption, scaleBar, niceLen, lenText, dashedCallout, sideLabels, rowsCard, benchLabels, tag, arrow, body, plant, LV, ORG, mono, sans, mix, rgba, rng };
})();
