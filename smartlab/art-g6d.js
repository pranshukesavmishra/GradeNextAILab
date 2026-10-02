/* ============================================================
   G6D — the apparatus of Grade 6 Unit D (water, air and weather).
   Drawn as the real things on R3, beside MEAS (bench, hot plate, beakers,
   cylinders), BENCH (rules, meters), TERRAIN (landscape blocks), GEO
   (clouds, flux arrows) and EARTH (the globe):
     glass chamber — four float-glass walls in an aluminium frame, misting
                     with dew, holding a cloud of real drops;
     a sloping glass lid with a tray of ice, beads of condensate under it,
                     a gutter, and the pipe that drains it;
     a desk fan; a glass tube of any path with water, air and a bubble;
     a rainfall simulator — a frame, a manifold of nozzles, falling drops;
     a tilted soil tray seen through its acrylic side: dry soil, the wet
                     zone above the wetting front, ponded water, grass or
                     straw on top, and the lip that pours the runoff;
     a leafy shoot (sunflower, bean, oak, maize leaves drawn to shape),
                     a polythene bag round it, a desk lamp and its beam;
     a leaf's skin under the microscope — pavement cells and stomata with
                     their guard cells and pore, and a coat of petroleum jelly;
     a porcelain spot plate with drops of water counted out.
   Every 3D function takes world metres (Z up, the bench top at z = 0) and
   draws through the caller's R3 frame. Nothing here computes science.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale, norm, cross } = R3;
  const cache = {};
  const mono = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Mono",monospace';
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const P = (cam, pts) => { const q = pts.map(p => cam.project(p)); return q.some(v => !v.ok) ? null : q; };
  const path = (ctx, q) => { ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); };
  const centroid = pts => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
  function hull2(Pt) {
    const pts = Pt.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    if (pts.length < 3) return pts;
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  /* a flat polygon, lit by its own normal */
  function face(F, pts, colour, o) {
    o = o || {};
    const n = norm(cross(sub(pts[1], pts[0]), sub(pts[pts.length - 1], pts[0])));
    const nn = R3.dot(n, sub(F.cam.eye, pts[0])) < 0 ? scale(n, -1) : n;
    const col = o.flat ? colour : F.shade(colour, nn, { ambient: o.ambient == null ? 0.45 : o.ambient });
    F.push(o.at || centroid(pts), () => {
      const q = P(F.cam, pts); if (!q) return;
      const ctx = F.ctx; ctx.save(); path(ctx, q); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.fillStyle = col; ctx.fill();
      if (o.edge) { ctx.globalAlpha = 1; ctx.strokeStyle = o.edge; ctx.lineWidth = o.edgeW || 1; ctx.stroke(); } else { ctx.strokeStyle = col; ctx.lineWidth = 0.5; ctx.stroke(); }
      ctx.restore();
    }, o.bias);
  }

  /* ---------------- glass ---------------- */
  /* condensation on glass: thousands of tiny beads, a few larger runs */
  function mistTex() {
    if (cache.mist) return cache.mist;
    const c = canvas(256, 256), x = c.getContext('2d'), r = rng(41);
    for (let i = 0; i < 1400; i++) {
      const px = r() * 256, py = r() * 256, rr = 0.6 + Math.pow(r(), 3) * 3.2;
      const g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.3, 0, px, py, rr);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.6, 'rgba(225,238,248,.55)'); g.addColorStop(1, 'rgba(120,150,180,.15)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill();
    }
    for (let i = 0; i < 9; i++) { const px = r() * 256; x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px, r() * 120); x.lineTo(px + (r() - 0.5) * 6, 256); x.stroke(); }
    cache.mist = c; return c;
  }
  /* one pane of glass: P0, P1 (along), P3 (up); tint, mist 0..1, a reflection band */
  function pane(F, P0, P1, P3, o) {
    o = o || {};
    const P2 = add(P1, sub(P3, P0));
    F.push(o.at || centroid([P0, P1, P2, P3]), () => {
      const q = P(F.cam, [P0, P1, P2, P3]); if (!q) return;
      const ctx = F.ctx; ctx.save();
      path(ctx, q); ctx.fillStyle = o.tint || 'rgba(190,225,235,.06)'; ctx.fill();
      ctx.clip();
      const m = o.mist || 0;
      if (m > 0.01) {
        ctx.fillStyle = 'rgba(232,242,250,' + (0.05 + 0.32 * m).toFixed(3) + ')'; ctx.fill();
        const pat = ctx.createPattern(mistTex(), 'repeat');
        if (pat) { ctx.globalAlpha = clamp(m * 1.3, 0, 0.9); ctx.fillStyle = pat; ctx.fillRect(-1e4, -1e4, 2e4, 2e4); ctx.globalAlpha = 1; }
      }
      const gx = ctx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
      gx.addColorStop(0.0, 'rgba(255,255,255,0)'); gx.addColorStop(0.2, 'rgba(255,255,255,.10)'); gx.addColorStop(0.26, 'rgba(255,255,255,.02)');
      gx.addColorStop(0.64, 'rgba(255,255,255,0)'); gx.addColorStop(0.71, 'rgba(255,255,255,.06)'); gx.addColorStop(0.76, 'rgba(255,255,255,0)');
      ctx.fillStyle = gx; ctx.fillRect(-1e4, -1e4, 2e4, 2e4);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = o.edge || 'rgba(140,205,190,.55)'; ctx.lineWidth = 1.2; path(ctx, q); ctx.stroke(); ctx.restore();
    }, o.bias);
  }
  /* a glass chamber on the bench: c the centre of its base, s = [w, d, h]; an aluminium angle on every edge */
  function chamber(F, c, s, o) {
    o = o || {};
    const [w, d, h] = s, x0 = c[0] - w / 2, x1 = c[0] + w / 2, y0 = c[1] - d / 2, y1 = c[1] + d / 2, z0 = c[2], z1 = c[2] + h;
    const m = o.mist || 0;
    pane(F, [x0, y0, z0], [x1, y0, z0], [x0, y0, z1], { mist: m });          // front
    pane(F, [x0, y1, z0], [x1, y1, z0], [x0, y1, z1], { mist: m * 0.8 });    // back
    pane(F, [x0, y0, z0], [x0, y1, z0], [x0, y0, z1], { mist: m * 0.9 });    // left
    pane(F, [x1, y0, z0], [x1, y1, z0], [x1, y0, z1], { mist: m * 0.9 });    // right
    const al = '#B9C2CC', t = 0.008;
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => R3.box(F, [x, y, (z0 + z1) / 2], [t, t, h], al, { shadow: false, ambient: 0.5 }));
    [[y0], [y1]].forEach(([y]) => { R3.box(F, [c[0], y, z0 + t / 2], [w, t, t], al, { shadow: false, ambient: 0.5 }); R3.box(F, [c[0], y, z1 - t / 2], [w, t, t], al, { shadow: false, ambient: 0.5 }); });
    [[x0], [x1]].forEach(([x]) => { R3.box(F, [x, c[1], z0 + t / 2], [t, d, t], al, { shadow: false, ambient: 0.5 }); R3.box(F, [x, c[1], z1 - t / 2], [t, d, t], al, { shadow: false, ambient: 0.5 }); });
    return { x0, x1, y0, y1, z0, z1 };
  }
  /* the lid: a glass sheet over the chamber, from zHi at x0 down to zLo at x1; ice on it (o.ice), beads under it
     (o.film 0..1 of what glass can hold), a gutter at the low edge */
  function lid(F, B, zHi, zLo, o) {
    o = o || {};
    const { x0, x1, y0, y1 } = B, zAt = x => zHi + (zLo - zHi) * (x - x0) / (x1 - x0);
    pane(F, [x0, y0, zHi], [x1, y0, zLo], [x0, y1, zHi], { tint: 'rgba(200,230,240,.12)', mist: (o.film || 0) * 0.7, edge: 'rgba(170,220,210,.8)' });
    if (o.ice) {                                        // an aluminium tray of ice cubes
      const tx0 = x0 + 0.05, tx1 = x1 - 0.05, ty0 = y0 + 0.04, ty1 = y1 - 0.04, th = 0.03;
      const tray = [[tx0, ty0, zAt(tx0) + 0.004], [tx1, ty0, zAt(tx1) + 0.004], [tx1, ty1, zAt(tx1) + 0.004], [tx0, ty1, zAt(tx0) + 0.004]];
      face(F, tray, '#9AA6B2', { ambient: 0.5 });
      face(F, [tray[0], tray[1], add(tray[1], [0, 0, th]), add(tray[0], [0, 0, th])], '#B6C0CA', { ambient: 0.5 });
      face(F, [tray[3], tray[2], add(tray[2], [0, 0, th]), add(tray[3], [0, 0, th])], '#8E9AA6', { ambient: 0.5 });
      const r = rng(7), melt = clamp(o.melt || 0, 0, 1), n = 26;
      for (let i = 0; i < n; i++) {
        const x = tx0 + 0.02 + r() * (tx1 - tx0 - 0.04), y = ty0 + 0.02 + r() * (ty1 - ty0 - 0.04), sz = 0.026 * (1 - 0.35 * melt) * (0.85 + 0.3 * r());
        const a = r() * TAU;
        R3.box(F, [x, y, zAt(x) + 0.006 + sz / 2], [sz, sz, sz * 0.9], o.warm ? '#D7E9F2' : '#E4F3FB', { shadow: false, ambient: 0.62, axes: [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]] });
      }
    }
    // beads of condensate hanging under the glass
    const f = o.film || 0;
    if (f > 0.02) {
      const r = rng(19), n = Math.round(30 + 160 * f);
      F.push([(x0 + x1) / 2, (y0 + y1) / 2, zAt((x0 + x1) / 2) - 0.003], () => {
        const ctx = F.ctx; ctx.save();
        for (let i = 0; i < n; i++) {
          const x = x0 + 0.01 + r() * (x1 - x0 - 0.02), y = y0 + 0.01 + r() * (y1 - y0 - 0.02), q = F.cam.project([x, y, zAt(x) - 0.002]);
          if (!q.ok) continue;
          const rr = Math.max(0.6, q.s * (0.0012 + 0.0028 * f * r()));
          const g = ctx.createRadialGradient(q.x - rr * 0.3, q.y - rr * 0.3, 0, q.x, q.y, rr);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.7, 'rgba(170,205,230,.7)'); g.addColorStop(1, 'rgba(60,90,120,.4)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }, -0.01);
    }
    // the gutter along the low edge
    R3.box(F, [x1 - 0.012, (y0 + y1) / 2, zLo - 0.008], [0.02, y1 - y0 - 0.02, 0.012], '#A9B4BE', { shadow: false, ambient: 0.5 });
    return { zAt };
  }

  /* ---------------- a glass tube along a path, with what is in it ----------------
     pts: the centre line; r: outer radius; o.fill: [{ from, to, col }] in metres along the path (water, a bubble) */
  function glassTube(F, pts, r, o) {
    o = o || {};
    const segs = []; let L = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(...sub(pts[i + 1], pts[i])); segs.push({ a: pts[i], b: pts[i + 1], s0: L, l }); L += l; }
    const at = s => { for (const g of segs) if (s <= g.s0 + g.l + 1e-9) { const u = clamp((s - g.s0) / g.l, 0, 1); return add(g.a, scale(sub(g.b, g.a), u)); } return pts[pts.length - 1]; };
    segs.forEach(g => {
      F.push(scale(add(g.a, g.b), 0.5), () => {
        const ctx = F.ctx, qa = F.cam.project(g.a), qb = F.cam.project(g.b);
        if (!qa.ok || !qb.ok) return;
        const dx = qb.x - qa.x, dy = qb.y - qa.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const ra = Math.max(1.2, r * qa.s), rb = Math.max(1.2, r * qb.s);
        const band = (k, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(qa.x + nx * ra * k, qa.y + ny * ra * k); ctx.lineTo(qb.x + nx * rb * k, qb.y + ny * rb * k); ctx.lineTo(qb.x - nx * rb * k, qb.y - ny * rb * k); ctx.lineTo(qa.x - nx * ra * k, qa.y - ny * ra * k); ctx.closePath(); ctx.fill(); };
        ctx.save();
        band(1, 'rgba(200,228,240,.16)');
        (o.fill || []).forEach(fl => {                    // the contents, clipped to this segment
          const s0 = Math.max(fl.from, g.s0), s1 = Math.min(fl.to, g.s0 + g.l);
          if (s1 <= s0) return;
          const p0 = F.cam.project(at(s0)), p1 = F.cam.project(at(s1));
          if (!p0.ok || !p1.ok) return;
          const k = o.inner || 0.62, r0 = Math.max(0.8, r * p0.s * k), r1 = Math.max(0.8, r * p1.s * k);
          ctx.fillStyle = fl.col; ctx.beginPath(); ctx.moveTo(p0.x + nx * r0, p0.y + ny * r0); ctx.lineTo(p1.x + nx * r1, p1.y + ny * r1); ctx.lineTo(p1.x - nx * r1, p1.y - ny * r1); ctx.lineTo(p0.x - nx * r0, p0.y - ny * r0); ctx.closePath(); ctx.fill();
          if (fl.bubble) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.stroke(); }
          if (fl.metal) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, (r0 + r1) * 0.25); ctx.beginPath(); ctx.moveTo(p0.x + nx * r0 * 0.35, p0.y + ny * r0 * 0.35); ctx.lineTo(p1.x + nx * r1 * 0.35, p1.y + ny * r1 * 0.35); ctx.stroke(); }
        });
        ctx.strokeStyle = 'rgba(225,242,250,.75)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(qa.x + nx * ra, qa.y + ny * ra); ctx.lineTo(qb.x + nx * rb, qb.y + ny * rb); ctx.moveTo(qa.x - nx * ra, qa.y - ny * ra); ctx.lineTo(qb.x - nx * rb, qb.y - ny * rb); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(qa.x + nx * ra * 0.45, qa.y + ny * ra * 0.45); ctx.lineTo(qb.x + nx * rb * 0.45, qb.y + ny * rb * 0.45); ctx.stroke();
        ctx.restore();
      }, o.bias == null ? -0.005 : o.bias);
    });
    return { L, at };
  }

  /* ---------------- a desk fan: base, stem, motor, a wire guard and three blades ---------------- */
  function fan(F, at, dir, speed, phase, o) {
    o = o || {};
    const R = o.R || 0.07, d = norm(dir), hub = add(at, [0, 0, o.h || 0.13]);
    R3.cylinder(F, at, add(at, [0, 0, 0.012]), 0.05, '#2C323C', { segments: 24 });
    R3.cylinder(F, add(at, [0, 0, 0.012]), add(hub, [0, 0, -0.02]), 0.007, '#9AA4AE', { shadow: false });
    R3.cylinder(F, add(hub, scale(d, -0.06)), add(hub, scale(d, -0.005)), 0.03, '#3A414C', { shadow: false });
    const u = norm(cross(d, [0, 0, 1])), v = cross(u, d);
    F.push(add(hub, scale(d, 0.01)), () => {
      const ctx = F.ctx, c = F.cam.project(add(hub, scale(d, 0.01)));
      if (!c.ok) return;
      ctx.save();
      const blades = 3, spin = speed > 0.05;
      for (let b = 0; b < blades; b++) {
        const a0 = phase + b * TAU / blades;
        const pts = [];
        for (let k = 0; k <= 10; k++) { const a = a0 + (k / 10 - 0.5) * 0.9, rr = R * (0.25 + 0.75 * Math.sin(Math.PI * k / 10) * 0.9 + 0.1); pts.push(add(add(hub, scale(u, Math.cos(a) * rr)), scale(v, Math.sin(a) * rr))); }
        pts.push(hub);
        const q = pts.map(p => F.cam.project(p)); if (q.some(z => !z.ok)) continue;
        path(ctx, q); ctx.fillStyle = spin ? 'rgba(150,175,200,' + clamp(0.55 - speed * 0.1, 0.18, 0.55).toFixed(2) + ')' : '#8FA6BC'; ctx.fill();
      }
      if (spin) { const rp = R * c.s; const g = ctx.createRadialGradient(c.x, c.y, rp * 0.2, c.x, c.y, rp); g.addColorStop(0, 'rgba(170,190,215,.25)'); g.addColorStop(1, 'rgba(170,190,215,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, rp, 0, TAU); ctx.fill(); }
      // the guard: rings and spokes of wire
      ctx.strokeStyle = 'rgba(205,214,226,.85)'; ctx.lineWidth = 0.9;
      [1.05, 0.7, 0.35].forEach(k => { const q = []; for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU; q.push(F.cam.project(add(add(add(hub, scale(d, 0.02)), scale(u, Math.cos(a) * R * k)), scale(v, Math.sin(a) * R * k)))); } if (q.some(z => !z.ok)) return; ctx.beginPath(); q.forEach((z, i) => i ? ctx.lineTo(z.x, z.y) : ctx.moveTo(z.x, z.y)); ctx.stroke(); });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, q0 = F.cam.project(add(hub, scale(d, 0.025))), q1 = F.cam.project(add(add(add(hub, scale(d, 0.02)), scale(u, Math.cos(a) * R * 1.05)), scale(v, Math.sin(a) * R * 1.05))); if (q0.ok && q1.ok) { ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke(); } }
      ctx.restore();
    });
    return hub;
  }

  /* ---------------- a cloud of drops in a box: soft, lit puffs, as dense as the liquid in the air ---------------- */
  function fog(F, box, density, phase, o) {
    o = o || {};
    if (density < 0.01) return;
    const r = rng(o.seed || 77), n = 46;
    for (let i = 0; i < n; i++) {
      const u = r(), v = r(), w = r(), drift = Math.sin(phase * 0.3 + i) * 0.02;
      const p = [box.x0 + (box.x1 - box.x0) * (0.08 + 0.84 * u) + drift, box.y0 + (box.y1 - box.y0) * (0.1 + 0.8 * v), box.z0 + (box.z1 - box.z0) * (0.25 + 0.7 * Math.sqrt(w))];
      const rad = (o.r || 0.07) * (0.6 + 0.8 * r());
      F.push(p, () => {
        const q = F.cam.project(p); if (!q.ok) return;
        const rp = rad * q.s, a = clamp(density, 0, 1) * 0.42;
        const g = F.ctx.createRadialGradient(q.x - rp * 0.2, q.y - rp * 0.3, rp * 0.1, q.x, q.y, rp);
        g.addColorStop(0, 'rgba(250,252,255,' + a.toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(225,232,242,' + (a * 0.6).toFixed(3) + ')'); g.addColorStop(1, 'rgba(210,220,235,0)');
        F.ctx.fillStyle = g; F.ctx.beginPath(); F.ctx.arc(q.x, q.y, rp, 0, TAU); F.ctx.fill();
      });
    }
  }

  /* ---------------- a rainfall simulator ----------------
     a square-tube frame over the tray, a manifold with nozzles at zTop; o.drops [[x, y, zFrom, zTo]] streaks to draw */
  function rainRig(F, x0, x1, y0, y1, zTop, o) {
    o = o || {};
    const al = '#AEB8C3', t = 0.022;
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => R3.box(F, [x, y, zTop / 2], [t, t, zTop], al, { ambient: 0.5 }));
    [y0, y1].forEach(y => R3.box(F, [(x0 + x1) / 2, y, zTop], [x1 - x0 + t, t, t], al, { shadow: false, ambient: 0.5 }));
    [x0, x1].forEach(x => R3.box(F, [x, (y0 + y1) / 2, zTop], [t, y1 - y0, t], al, { shadow: false, ambient: 0.5 }));
    const ym = (y0 + y1) / 2, n = o.nozzles || 4;
    R3.cylinder(F, [x0, ym, zTop - 0.02], [x1, ym, zTop - 0.02], 0.012, '#C9A15A', { shadow: false });         // the brass manifold
    R3.cylinder(F, [x0 - 0.12, ym, zTop - 0.02], [x0, ym, zTop - 0.02], 0.009, '#2B3240', { shadow: false });     // the hose in
    const noz = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / n;
      R3.cylinder(F, [x, ym, zTop - 0.02], [x, ym, zTop - 0.055], 0.008, '#B8892F', { shadow: false });
      noz.push([x, ym, zTop - 0.06]);
    }
    // the pressure gauge on the manifold
    R3.cylinder(F, [x0 + 0.04, ym - 0.015, zTop], [x0 + 0.04, ym - 0.04, zTop], 0.022, '#E9ECEF', { shadow: false });
    if (o.drops) F.push([(x0 + x1) / 2, ym, zTop * 0.5], () => {
      const ctx = F.ctx; ctx.save(); ctx.lineCap = 'round';
      o.drops.forEach(dp => {
        const a = F.cam.project([dp[0], dp[1], dp[2]]), b = F.cam.project([dp[0], dp[1], dp[3]]);
        if (!a.ok || !b.ok) return;
        ctx.strokeStyle = 'rgba(200,226,250,.75)'; ctx.lineWidth = Math.max(0.8, (o.dropW || 0.002) * a.s); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.restore();
    }, -0.02);
    return noz;
  }

  /* ---------------- the soil tray ----------------
     o: { x0, x1 (downhill end), y0, y1, zLip (top of soil at the lip), slope (rad), D (soil depth),
          soil (colour), wetDepth (m below the surface), pond (m of water, drawn ×20), cover: 'bare'|'grass'|'mulch'|'paved', t } */
  function soilTray(F, o) {
    const { x0, x1, y0, y1, zLip, D } = o, tn = Math.tan(o.slope), top = x => zLip + (x1 - x) * tn;
    const eye = F.cam.eye, front = eye[1] < (y0 + y1) / 2 ? y0 : y1, back = front === y0 ? y1 : y0;
    const wall = 0.006, rim = 0.025;
    const steel = '#8C97A3';
    // the steel box: floor and walls (the side facing the camera is clear acrylic)
    const pts = (y, z0f, z1f) => [[x0, y, z0f(x0)], [x1, y, z0f(x1)], [x1, y, z1f(x1)], [x0, y, z1f(x0)]];
    face(F, pts(back, x => top(x) - D, x => top(x) + rim), steel, { ambient: 0.45 });
    face(F, [[x0, y0, top(x0) - D], [x0, y1, top(x0) - D], [x0, y1, top(x0) + rim], [x0, y0, top(x0) + rim]], steel, { ambient: 0.45 });
    // the soil, seen through the acrylic: dry below the wetting front, dark and wet above it
    const soil = RX.mix(o.soil, '#000000', 0), wetC = RX.mix(o.soil, '#1A120C', 0.45);
    F.push([(x0 + x1) / 2, front, top((x0 + x1) / 2) - D / 2], () => {
      const ctx = F.ctx, cam = F.cam;
      const q = P(cam, [[x0, front, top(x0)], [x1, front, top(x1)], [x1, front, top(x1) - D], [x0, front, top(x0) - D]]); if (!q) return;
      ctx.save(); path(ctx, q); ctx.fillStyle = soil; ctx.fill(); ctx.clip();
      // grains and pebbles
      const r = rng(11);
      for (let i = 0; i < 260; i++) { const u = r(), v = r(), p = cam.project([x0 + u * (x1 - x0), front, top(x0 + u * (x1 - x0)) - v * D]); if (!p.ok) continue; ctx.fillStyle = 'rgba(' + (r() < 0.5 ? '30,20,12' : '235,215,180') + ',' + (0.12 + 0.2 * r()).toFixed(2) + ')'; ctx.fillRect(p.x, p.y, 1.4 + r() * 1.6, 1.2 + r()); }
      const wd = clamp(o.wetDepth || 0, 0, D);
      if (wd > 0.0005) {
        const w = P(cam, [[x0, front, top(x0)], [x1, front, top(x1)], [x1, front, top(x1) - wd], [x0, front, top(x0) - wd]]);
        if (w) {
          ctx.globalAlpha = 0.85; path(ctx, w); ctx.fillStyle = wetC; ctx.fill(); ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(120,190,255,.95)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(w[3].x, w[3].y); ctx.lineTo(w[2].x, w[2].y); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(210,235,245,.6)'; ctx.lineWidth = 1; path(ctx, q); ctx.stroke(); ctx.restore();
      o.frontAt = { a: cam.project([x0 + (x1 - x0) * 0.25, front, top(x0 + (x1 - x0) * 0.25) - clamp(o.wetDepth || 0, 0, D)]) };
    }, 0.0);
    // the surface, its cover, and water standing on it
    const surf = [[x0, y0, top(x0)], [x1, y0, top(x1)], [x1, y1, top(x1)], [x0, y1, top(x0)]];
    const sCol = o.cover === 'paved' ? '#5E6168' : RX.mix(o.soil, '#1A120C', clamp((o.wetDepth || 0) > 0.001 ? 0.35 : 0, 0, 0.5));
    face(F, surf, sCol, { ambient: 0.55, at: [(x0 + x1) / 2, (y0 + y1) / 2, top((x0 + x1) / 2) - 0.02] });
    F.push([(x0 + x1) / 2, (y0 + y1) / 2, top((x0 + x1) / 2) - 0.015], () => {
      const ctx = F.ctx, cam = F.cam, r = rng(23);
      ctx.save();
      if (o.cover === 'grass') {
        ctx.lineCap = 'round';
        for (let i = 0; i < 520; i++) {
          const x = x0 + 0.01 + r() * (x1 - x0 - 0.02), y = y0 + 0.01 + r() * (y1 - y0 - 0.02), a = cam.project([x, y, top(x)]), b = cam.project([x + (r() - 0.5) * 0.01, y + (r() - 0.5) * 0.01, top(x) + 0.018 + 0.02 * r()]);
          if (!a.ok || !b.ok) continue;
          ctx.strokeStyle = r() < 0.5 ? '#4E8A3A' : '#78AE4E'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      } else if (o.cover === 'mulch') {
        for (let i = 0; i < 220; i++) {
          const x = x0 + 0.01 + r() * (x1 - x0 - 0.02), y = y0 + 0.01 + r() * (y1 - y0 - 0.02), an = r() * TAU, l = 0.02 + 0.03 * r();
          const a = cam.project([x, y, top(x) + 0.003]), b = cam.project([x + Math.cos(an) * l, y + Math.sin(an) * l, top(x + Math.cos(an) * l) + 0.003]);
          if (!a.ok || !b.ok) continue;
          ctx.strokeStyle = r() < 0.5 ? '#D8B860' : '#B8954A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      } else if (o.cover !== 'paved') {
        for (let i = 0; i < 160; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), q = cam.project([x, y, top(x)]); if (!q.ok) continue; ctx.fillStyle = 'rgba(30,20,12,' + (0.15 + 0.25 * r()).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 0.6 + r() * 1.4, 0, TAU); ctx.fill(); }
      }
      // ponded water: a sheet over the hollows, drawn twenty times thicker than it is
      const pond = o.pond || 0;
      if (pond > 0.00002) {
        const zz = Math.min(0.012, pond * 20), sh = [[x0, y0, top(x0) + zz], [x1, y0, top(x1) + zz], [x1, y1, top(x1) + zz], [x0, y1, top(x0) + zz]];
        const q = P(cam, sh);
        if (q) { path(ctx, q); ctx.fillStyle = 'rgba(120,175,215,' + clamp(0.25 + pond * 400, 0.25, 0.7).toFixed(2) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,.6)'; ctx.lineWidth = 1; ctx.stroke(); }
        // rings where drops land in the puddle
        if (o.rain) for (let i = 0; i < 24; i++) { const ph = ((o.t || 0) * 1.7 + i * 0.37) % 1, x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), c = cam.project([x, y, top(x) + zz]); if (!c.ok) continue; ctx.strokeStyle = 'rgba(235,248,255,' + (0.7 * (1 - ph)).toFixed(2) + ')'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(c.x, c.y, 1 + 6 * ph, 0.5 + 2.4 * ph, 0, 0, TAU); ctx.stroke(); }
      }
      ctx.restore();
    }, -0.01);
    // the acrylic side, the near end wall and the rim
    pane(F, [x0, front, top(x0) - D], [x1, front, top(x1) - D], [x0, front, top(x0) + rim], { tint: 'rgba(200,230,240,.05)', at: [(x0 + x1) / 2, front - 0.001, top((x0 + x1) / 2) - D / 2], bias: -0.005 });
    // the lip and the spout at the downhill end
    face(F, [[x1, y0, top(x1) - D], [x1, y1, top(x1) - D], [x1, y1, top(x1) - 0.003], [x1, y0, top(x1) - 0.003]], steel, { ambient: 0.45 });
    const ym = (y0 + y1) / 2, sp = [x1 + 0.07, ym, top(x1) - 0.03];
    face(F, [[x1, y0 + 0.02, top(x1)], [x1, y1 - 0.02, top(x1)], [sp[0], ym + 0.03, sp[2]], [sp[0], ym - 0.03, sp[2]]], '#A8B3BE', { ambient: 0.5 });
    // legs: the uphill legs are longer
    [[x0 + 0.02, y0 + 0.02], [x0 + 0.02, y1 - 0.02], [x1 - 0.02, y0 + 0.02], [x1 - 0.02, y1 - 0.02]].forEach(([x, y]) => R3.box(F, [x, y, (top(x) - D) / 2], [0.018, 0.018, Math.max(0.01, top(x) - D)], '#6A747F', { ambient: 0.45 }));
    return { top, spout: sp };
  }
  /* a stream of water from a lip into a vessel: q is its flow (0..1 of the widest) */
  function stream(F, from, toZ, q, t) {
    if (q <= 0.002) return;
    F.push([from[0] + 0.02, from[1], (from[2] + toZ) / 2], () => {
      const ctx = F.ctx, pts = [];
      for (let k = 0; k <= 12; k++) { const u = k / 12, z = from[2] - (from[2] - toZ) * u; pts.push(F.cam.project([from[0] + 0.035 * Math.sqrt(u) * (0.4 + q), from[1], z])); }
      if (pts.some(p => !p.ok)) return;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(150,195,225,.75)'; ctx.lineWidth = Math.max(1, 1 + 5 * q);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,.7)'; ctx.lineWidth = Math.max(0.6, 1.4 * q); ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 60;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.restore();
    }, -0.01);
  }

  /* ---------------- leaves, a shoot, a bag, a lamp ---------------- */
  /* a leaf's outline in its own frame: u along the midrib 0..1, v across, ±(half width) */
  function leafShape(kind) {
    const out = [], n = 26;
    for (let i = 0; i <= n; i++) {
      const u = i / n; let w;
      if (kind === 'sunflower') w = 0.62 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.8) * (1 - 0.45 * u) + (u < 0.1 ? 0.25 * (u / 0.1) : 0);
      else if (kind === 'bean') w = 0.42 * Math.pow(Math.sin(Math.PI * u), 0.75) * (1 - 0.2 * u);
      else if (kind === 'oak') w = (0.30 + 0.12 * Math.max(0, Math.sin(u * Math.PI * 5.5 - 0.6))) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.02)), 0.6);
      else w = 0.07 * (1 - 0.6 * u) + 0.02;                                  // maize: a long strap
      out.push([u, w]);
    }
    return out;
  }
  /* a leaf: base point, the midrib direction, its length; lit by the angle its blade faces */
  function leaf(F, base, dir, len, kind, o) {
    o = o || {};
    const d = norm(dir), s0 = norm(cross([0, 0, 1], d).every(v => Math.abs(v) < 1e-6) ? [1, 0, 0] : cross([0, 0, 1], d)), u0 = norm(cross(d, s0));
    /* a leaf turns its blade toward the light: roll it about the midrib, whichever way faces the room */
    const toward = o.face || [-0.35, -0.8, 0.5];
    const roll = r => { const sd = add(scale(s0, Math.cos(r)), scale(u0, Math.sin(r))); return { side: sd, up: norm(cross(d, sd)) }; };
    const A = roll(0.75), Bq = roll(-0.75), pick = Math.abs(R3.dot(A.up, toward)) >= Math.abs(R3.dot(Bq.up, toward)) ? A : Bq;
    const side = pick.side, up = pick.up;
    const shp = leafShape(kind), wscale = kind === 'maize' ? len : len * 0.55, droop = kind === 'maize' ? 0.35 : 0.12;
    const pt = (u, v) => add(add(add(base, scale(d, u * len)), scale(side, v * wscale)), scale(up, -droop * len * u * u + Math.abs(v) * wscale * 0.12));
    const L = shp.map(([u, w]) => pt(u, w)), R = shp.map(([u, w]) => pt(u, -w)).reverse();
    const n = up[2] >= 0 ? up : scale(up, -1);
    const lit = F.shade(o.col || (kind === 'oak' ? '#3F7A34' : kind === 'maize' ? '#5E9A3C' : '#4C9140'), n, { ambient: 0.45 });
    F.push(pt(0.5, 0), () => {
      const ctx = F.ctx, q = P(F.cam, L.concat(R)); if (!q) return;
      ctx.save(); path(ctx, q);
      const a = F.cam.project(pt(0, 0)), b = F.cam.project(pt(1, 0));
      const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, RX.mix(lit, '#000000', 0.15)); g.addColorStop(0.5, lit); g.addColorStop(1, RX.mix(lit, '#D8F0A0', 0.15));
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      if (o.gloss) { ctx.fillStyle = 'rgba(255,255,240,.28)'; ctx.fill(); }
      ctx.strokeStyle = 'rgba(220,245,190,.55)'; ctx.lineWidth = 1.1;          // the midrib and the veins
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(210,240,180,.4)';
      if (kind === 'maize') { for (const v of [-0.5, 0.5]) { const p0 = F.cam.project(pt(0.02, v * 0.07)), p1 = F.cam.project(pt(0.95, v * 0.03)); if (p0.ok && p1.ok) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); } } }
      else for (let k = 1; k < 7; k++) { const u = k / 7.5; for (const s of [-1, 1]) { const p0 = F.cam.project(pt(u, 0)), p1 = F.cam.project(pt(Math.min(1, u + 0.12), s * 0.36)); if (p0.ok && p1.ok) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); } } }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = RX.mix(lit, '#000000', 0.35); ctx.lineWidth = 0.8; path(ctx, q); ctx.stroke(); ctx.restore();
    });
    return pt(1, 0);
  }
  /* a leafy shoot rising from base: n leaves of a kind, sized to its leaf area (m² of one side) */
  function shoot(F, base, kind, area, o) {
    o = o || {};
    const H = o.H || 0.2, stem = [base, add(base, [0.004, 0, H * 0.5]), add(base, [-0.003, 0.002, H])];
    R3.tube(F, stem, kind === 'oak' ? 0.0035 : 0.004, kind === 'oak' ? '#6A5038' : '#5C8E3A', { shadow: false });
    const nL = { sunflower: 4, bean: 3, oak: 5, maize: 3 }[kind] || 4, perLeaf = area / nL;
    const fill = { sunflower: 0.62, bean: 0.55, oak: 0.45, maize: 0.7 }[kind];
    const len = kind === 'maize' ? Math.sqrt(perLeaf / (0.16 * fill)) : Math.sqrt(perLeaf / (0.55 * 2 * 0.5 * fill));
    const tips = [];
    for (let i = 0; i < nL; i++) {
      const f = (i + 1) / (nL + 0.5), at = add(base, [0, 0, H * (0.25 + 0.7 * f)]), a = i * 2.4 + 0.6;
      const dir = [Math.cos(a), Math.sin(a), kind === 'maize' ? 0.7 : 0.25];
      tips.push(leaf(F, at, dir, clamp(len, 0.02, 0.2) * (1 - 0.2 * f), kind, { gloss: o.gloss }));
    }
    return { top: stem[2], tips };
  }
  /* a polythene bag round the shoot, misting as the air in it fills with vapour */
  function bag(F, c, r, h, mist) {
    F.push(add(c, [0, -r * 0.2, h * 0.5]), () => {
      const ctx = F.ctx, pts = [];
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; pts.push(F.cam.project([c[0] + Math.cos(a) * r * 0.55, c[1] + Math.sin(a) * r * 0.55, c[2]])); pts.push(F.cam.project([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2] + h * 0.55])); pts.push(F.cam.project([c[0] + Math.cos(a) * r * 0.8, c[1] + Math.sin(a) * r * 0.8, c[2] + h])); }
      if (pts.some(p => !p.ok)) return;
      const H = hull2(pts);
      ctx.save(); path(ctx, H);
      ctx.fillStyle = 'rgba(235,242,248,' + (0.10 + 0.35 * mist).toFixed(3) + ')'; ctx.fill(); ctx.clip();
      const pat = ctx.createPattern(mistTex(), 'repeat'); if (pat && mist > 0.05) { ctx.globalAlpha = clamp(mist, 0, 0.85); ctx.fillStyle = pat; ctx.fillRect(-1e4, -1e4, 2e4, 2e4); ctx.globalAlpha = 1; }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(235,245,252,.55)'; ctx.lineWidth = 1; path(ctx, H); ctx.stroke();
      const t0 = F.cam.project([c[0], c[1], c[2] + 0.004]); if (t0.ok) { ctx.fillStyle = '#C8302C'; ctx.fillRect(t0.x - 10, t0.y - 2, 20, 4); }   // the tie
      ctx.restore();
    }, -0.03);
  }
  /* a desk lamp at `at`, its shade aimed at `aim`; level 0..1 lights the bulb and the beam */
  function lamp(F, at, aim, level) {
    R3.cylinder(F, at, add(at, [0, 0, 0.015]), 0.06, '#23282F', { segments: 26 });
    const elbow = add(at, [0.02, 0, 0.30]), head = add(aim, scale(norm(sub(elbow, aim)), 0.18));
    R3.tube(F, [add(at, [0, 0, 0.015]), elbow], 0.006, '#4A525E', { shadow: false });
    R3.tube(F, [elbow, head], 0.006, '#4A525E', { shadow: false });
    const d = norm(sub(aim, head)), mouth = add(head, scale(d, 0.07));
    F.push(head, () => {
      const ctx = F.ctx, cam = F.cam, u = norm(cross(d, [0, 0, 1])), v = cross(u, d);
      const ring = (c, r) => { const q = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; q.push(cam.project(add(add(c, scale(u, Math.cos(a) * r)), scale(v, Math.sin(a) * r)))); } return q.some(z => !z.ok) ? null : q; };
      const r0 = ring(head, 0.018), r1 = ring(mouth, 0.055); if (!r0 || !r1) return;
      ctx.save();
      // the beam, before the shade
      if (level > 0.01) {
        const m = cam.project(mouth), t = cam.project(aim);
        if (m.ok && t.ok) {
          const g = ctx.createLinearGradient(m.x, m.y, t.x, t.y); g.addColorStop(0, 'rgba(255,240,190,' + (0.32 * level).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,190,0)');
          const rr = 0.055 * m.s, rt = 0.14 * t.s, dx = t.x - m.x, dy = t.y - m.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(m.x + nx * rr, m.y + ny * rr); ctx.lineTo(t.x + nx * rt, t.y + ny * rt); ctx.lineTo(t.x - nx * rt, t.y - ny * rt); ctx.lineTo(m.x - nx * rr, m.y - ny * rr); ctx.closePath(); ctx.fill();
        }
      }
      const H = hull2(r0.concat(r1)); path(ctx, H);
      const gs = ctx.createLinearGradient(H[0].x, H[0].y, H[Math.floor(H.length / 2)].x, H[Math.floor(H.length / 2)].y); gs.addColorStop(0, '#8E1E22'); gs.addColorStop(0.5, '#C7353A'); gs.addColorStop(1, '#6A1418');
      ctx.fillStyle = gs; ctx.fill();
      path(ctx, r1); ctx.fillStyle = level > 0.01 ? 'rgba(255,246,214,' + (0.4 + 0.6 * level).toFixed(2) + ')' : '#3A3A3A'; ctx.fill();
      if (level > 0.01) { const m = cam.project(mouth); if (m.ok) { const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 40); g.addColorStop(0, 'rgba(255,240,200,' + (0.5 * level).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(m.x - 40, m.y - 40, 80, 80); } }
      ctx.restore();
    });
    return mouth;
  }

  /* ---------------- a leaf's skin under the microscope (2D) ----------------
     density: stomata per mm²; field: the field's width in mm; open 0..1; coated: petroleum jelly over it */
  function skinTex(w, h, density, field, seed) {
    const key = ['skin', w, h, density, field, seed].join(':');
    if (cache[key]) return cache[key];
    const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed), mmPerPx = field / w;
    const cellUm = 55, nCells = Math.round(w * h * mmPerPx * mmPerPx * 1e6 / (cellUm * cellUm));
    const pts = []; for (let i = 0; i < nCells; i++) pts.push([r() * w, r() * h]);
    const img = x.createImageData(w, h), D = img.data, own = new Int32Array(w * h);
    // nearest seed, with a wobble: pavement cells interlock like a jigsaw
    const grid = {}, gsz = 24;
    pts.forEach((p, i) => { const k = Math.floor(p[0] / gsz) + ',' + Math.floor(p[1] / gsz); (grid[k] = grid[k] || []).push(i); });
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const wob = 3.2 * Math.sin(xx * 0.31 + y * 0.12) * Math.cos(y * 0.27 - xx * 0.09), gx = Math.floor(xx / gsz), gy = Math.floor(y / gsz);
      let best = 1e9, bi = 0;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const L = grid[(gx + a) + ',' + (gy + b)]; if (!L) continue; for (const i of L) { const dx = xx - pts[i][0], dy = y - pts[i][1], dd = Math.sqrt(dx * dx + dy * dy) + wob; if (dd < best) { best = dd; bi = i; } } }
      own[y * w + xx] = bi;
    }
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const k = y * w + xx, o = own[k], edge = (xx > 0 && own[k - 1] !== o) || (y > 0 && own[k - w] !== o);
      const sh = 0.92 + 0.08 * Math.sin(o * 12.9);
      D[k * 4] = edge ? 96 : 214 * sh; D[k * 4 + 1] = edge ? 120 : 232 * sh; D[k * 4 + 2] = edge ? 88 : 196 * sh; D[k * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const nS = Math.round(density * field * field * h / w), stom = [];
    for (let i = 0; i < nS; i++) stom.push([12 + r() * (w - 24), 12 + r() * (h - 24), r() * Math.PI]);
    cache[key] = { c, stom, mmPerPx };
    return cache[key];
  }
  function stomata(ctx, x, y, w, h, o) {
    const T = skinTex(Math.round(w), Math.round(h), o.density, o.field, o.seed || 3);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(T.c, x, y);
    const L = 26 / (T.mmPerPx * 1000), open = clamp(o.open, 0, 1);        // a guard-cell pair is about 26 µm long
    T.stom.forEach(([sx, sy, a]) => {
      ctx.save(); ctx.translate(x + sx, y + sy); ctx.rotate(a);
      const gw = L * 0.32;
      for (const s of [-1, 1]) {
        const g = ctx.createLinearGradient(0, s * gw * 0.2, 0, s * gw * 1.1); g.addColorStop(0, '#5F9A48'); g.addColorStop(1, '#3E7A30');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, s * (gw * 0.55 + open * gw * 0.2), L / 2, gw * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(40,110,40,.9)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * L * 0.13, s * (gw * 0.6 + open * gw * 0.2), Math.max(0.6, L * 0.04), 0, TAU); ctx.fill(); }   // chloroplasts
      }
      ctx.fillStyle = '#10180E'; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.34, Math.max(0.4, gw * 0.08 + open * gw * 0.5), 0, 0, TAU); ctx.fill();   // the pore
      ctx.restore();
    });
    if (o.coated) {
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(240,232,190,.55)'); g.addColorStop(0.5, 'rgba(255,250,225,.35)'); g.addColorStop(1, 'rgba(230,220,170,.55)');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + h * 0.3); ctx.bezierCurveTo(x + w * 0.3, y + h * 0.2, x + w * 0.6, y + h * 0.45, x + w, y + h * 0.35); ctx.stroke();
    }
    ctx.restore();
    // the scale bar: 50 µm
    const bar = 0.05 / T.mmPerPx;
    ctx.save(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + w - bar - 8, y + h - 10, bar, 2.5); ctx.font = mono(8.5); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText('50 µm', x + w - 8, y + h - 12); ctx.fillText('50 µm', x + w - 8, y + h - 12); ctx.restore();
    return T.stom.length;
  }

  /* ---------------- a porcelain spot plate with drops counted into its wells ---------------- */
  function spotPlate(F, c, wells, o) {
    o = o || {};
    const n = wells.length, pitch = 0.036, w = n * pitch + 0.02, d = 0.06;
    R3.box(F, [c[0], c[1], 0.007], [w, d, 0.014], '#F1F2F0', { ambient: 0.6 });
    wells.forEach((wl, i) => {
      const at = [c[0] - w / 2 + 0.01 + (i + 0.5) * pitch, c[1], 0.0142];
      F.push(at, () => {
        const ctx = F.ctx, q = F.cam.project(at); if (!q.ok) return;
        const rr = 0.013 * q.s, g = ctx.createRadialGradient(q.x, q.y - rr * 0.3, rr * 0.1, q.x, q.y, rr);
        g.addColorStop(0, '#C9CCCA'); g.addColorStop(0.8, '#E8EAE8'); g.addColorStop(1, '#FFFFFF');
        ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q.x, q.y, rr, rr * 0.55, 0, 0, TAU); ctx.fill();
        // the drops: whole ones as beads, the last part-drop smaller by the cube root of its share
        const whole = Math.floor(wl.drops), part = wl.drops - whole, show = Math.min(whole, 24), rr2 = rng(i * 31 + 5);
        const bead = (x, y, k) => { RX.ball(ctx, x, y, Math.max(1.2, 0.0032 * q.s * k), '#5AA8E0', { rim: 0.6 }); };
        for (let k = 0; k < show; k++) { const a = rr2() * TAU, dd = Math.sqrt(rr2()) * rr * 0.6; bead(q.x + Math.cos(a) * dd, q.y + Math.sin(a) * dd * 0.5, 1); }
        if (part > 0.001 && show < 24) bead(q.x + 2, q.y, Math.cbrt(part));
        ctx.restore();
      }, -0.004);
    });
    return { pitch, w, x0: c[0] - w / 2 + 0.01 };
  }

  /* a label on a dark pill, in screen space */
  function tag(ctx, x, y, text, col, o) {
    o = o || {};
    ctx.save(); ctx.font = o.font || mono(9.5);
    const pw = ctx.measureText(text).width + 10, ph = o.h || 16;
    const x0 = o.align === 'right' ? x - pw : o.align === 'center' ? x - pw / 2 : x;
    ctx.fillStyle = o.bg || 'rgba(6,10,20,.86)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y - ph / 2, pw, ph, 4); else ctx.rect(x0, y - ph / 2, pw, ph); ctx.fill();
    ctx.fillStyle = col || '#DCE6F6'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + 5, y + 0.5);
    ctx.restore();
    return { x0, x1: x0 + pw };
  }


  /* ================= 6D-2: the air ================= */
  /* a glass cylinder (or bell) as a lit transparent hull between two rings: rim highlights, a reflection band */
  function glassHull(F, c0, c1, r0, r1, o) {
    o = o || {};
    F.push(scale(add(c0, c1), 0.5), () => {
      const ctx = F.ctx, cam = F.cam, ring = (c, r) => { const q = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; q.push(cam.project([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]])); } return q.some(z => !z.ok) ? null : q; };
      const a = ring(c0, r0), b = ring(c1, r1); if (!a || !b) return;
      const H = hull2(a.concat(b)); let x0 = 1e9, x1 = -1e9; H.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      ctx.save(); path(ctx, H); ctx.fillStyle = o.tint || 'rgba(200,228,245,.07)'; ctx.fill(); ctx.clip();
      const gr = ctx.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.1, 'rgba(255,255,255,.32)'); gr.addColorStop(0.17, 'rgba(255,255,255,.04)'); gr.addColorStop(0.82, 'rgba(255,255,255,.03)'); gr.addColorStop(0.9, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x0, -1e4, x1 - x0, 2e4);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = o.strong ? 'rgba(225,244,255,.85)' : 'rgba(215,238,255,.55)'; ctx.lineWidth = o.strong ? 1.5 : 1; path(ctx, H); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,.8)'; ctx.lineWidth = 1.2; path(ctx, o.openTop ? b : a); ctx.stroke(); if (o.strong) path(ctx, b), ctx.stroke(); ctx.restore();
    }, o.bias == null ? -0.03 : o.bias);
  }
  /* a liquid column inside a round vessel, from z0 to z1 */
  function liquid(F, c, r, z0, z1, col, o) {
    o = o || {};
    if (z1 - z0 < 1e-5) return;
    F.push([c[0], c[1], (z0 + z1) / 2], () => {
      const ctx = F.ctx, cam = F.cam, ring = (z, rr) => { const q = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; q.push(cam.project([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, z])); } return q.some(v => !v.ok) ? null : q; };
      const a = ring(z0, r), b = ring(z1, r); if (!a || !b) return;
      const H = hull2(a.concat(b)); let x0 = 1e9, x1 = -1e9; H.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      ctx.save(); path(ctx, H); const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, RX.mix(col, '#000000', 0.35)); g.addColorStop(0.35, RX.mix(col, '#FFFFFF', o.metal ? 0.45 : 0.15)); g.addColorStop(1, RX.mix(col, '#000000', 0.45));
      ctx.globalAlpha = o.alpha == null ? 0.85 : o.alpha; ctx.fillStyle = g; ctx.fill(); ctx.globalAlpha = 1;
      path(ctx, b); ctx.fillStyle = RX.mix(col, '#FFFFFF', 0.3); ctx.fill(); ctx.restore();
    }, o.bias == null ? -0.02 : o.bias);
  }
  /* iron wool: a tangle of fine brown-grey strands, rusting orange as it works */
  function ironWool(F, c, r, h, rust) {
    F.push(c, () => {
      const ctx = F.ctx, cam = F.cam, rr = rng(61);
      ctx.save(); ctx.lineWidth = 0.7;
      for (let i = 0; i < 90; i++) {
        const a = rr() * TAU, d = rr() * r, z = c[2] + (rr() - 0.5) * h, p0 = cam.project([c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, z]);
        const a2 = a + (rr() - 0.5) * 2, d2 = rr() * r, p1 = cam.project([c[0] + Math.cos(a2) * d2, c[1] + Math.sin(a2) * d2, z + (rr() - 0.5) * h * 0.6]);
        if (!p0.ok || !p1.ok) continue;
        ctx.strokeStyle = RX.mix('#8A8F96', '#B8561E', clamp(rust * (0.6 + 0.6 * rr()), 0, 1));
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo((p0.x + p1.x) / 2 + (rr() - 0.5) * 8, (p0.y + p1.y) / 2 + (rr() - 0.5) * 8, p1.x, p1.y); ctx.stroke();
      }
      ctx.restore();
    }, -0.01);
  }
  /* granules (soda lime, calcium chloride) in a little wire basket */
  function granules(F, c, r, col) {
    const rr = rng(13);
    for (let i = 0; i < 26; i++) { const a = rr() * TAU, d = rr() * r; R3.sphere(F, [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, c[2] + rr() * r * 0.8], r * 0.16, col, { shadow: false }); }
  }
  /* a vertical scale board with ticks every `step` metres and a label every `big` */
  function scaleBoard(F, base, H, o) {
    o = o || {};
    const w = o.w || 0.05, step = o.step || 0.01, big = o.big || 0.1;
    R3.box(F, [base[0], base[1] + 0.006, base[2] + H / 2], [w, 0.008, H], o.wood || '#C9A46A', { shadow: false, ambient: 0.55 });
    F.push([base[0], base[1] - 0.001, base[2] + H / 2], () => {
      const ctx = F.ctx, cam = F.cam; ctx.save(); ctx.font = mono(o.font || 8); ctx.textBaseline = 'middle';
      const n = Math.round(H / step);
      for (let k = 0; k <= n; k++) {
        const z = base[2] + k * step, isBig = Math.abs(k * step / big - Math.round(k * step / big)) < 1e-6;
        const a = cam.project([base[0] - w / 2, base[1], z]), b = cam.project([base[0] - w / 2 + w * (isBig ? 0.55 : 0.28), base[1], z]);
        if (!a.ok || !b.ok) continue;
        ctx.strokeStyle = 'rgba(30,20,10,.85)'; ctx.lineWidth = isBig ? 1.2 : 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (isBig && k > 0 && (o.every == null || Math.round(k * step / big) % o.every === 0)) { ctx.fillStyle = '#20140A'; ctx.fillText(o.fmt ? o.fmt(k * step) : String(Math.round(k * step * 1000)), b.x + 2, b.y); }
      }
      ctx.restore();
    }, -0.02);
  }
  /* a round-bottomed flask with a stopper and tap */
  function flask(F, base, r, o) {
    o = o || {};
    const c = [base[0], base[1], base[2] + r];
    F.push(c, () => {
      const ctx = F.ctx, q = F.cam.project(c); if (!q.ok) return;
      const rp = r * q.s, g = ctx.createRadialGradient(q.x - rp * 0.35, q.y - rp * 0.4, rp * 0.05, q.x, q.y, rp);
      g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(0.3, 'rgba(210,232,248,.10)'); g.addColorStop(0.85, 'rgba(160,200,230,.12)'); g.addColorStop(1, 'rgba(230,245,255,.55)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, rp, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(225,242,255,.7)'; ctx.lineWidth = 1.1; ctx.stroke();
      if (o.vacuum != null) { ctx.fillStyle = 'rgba(160,200,240,' + (0.10 * (1 - o.vacuum)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, rp * 0.96, 0, TAU); ctx.fill(); }
      ctx.restore();
    }, -0.02);
    glassHull(F, [c[0], c[1], c[2] + r * 0.85], [c[0], c[1], c[2] + r * 1.6], r * 0.28, r * 0.28, { bias: -0.025 });
    R3.cylinder(F, [c[0], c[1], c[2] + r * 1.55], [c[0], c[1], c[2] + r * 1.75], r * 0.3, '#B5462E', { shadow: false });
    R3.cylinder(F, [c[0], c[1], c[2] + r * 1.75], [c[0], c[1], c[2] + r * 1.95], r * 0.07, '#D8DDE2', { shadow: false });
    R3.cylinder(F, [c[0] - r * 0.12, c[1], c[2] + r * 1.85], [c[0] + r * 0.12, c[1], c[2] + r * 1.85], r * 0.05, o.open ? '#3A9A5A' : '#C83A2A', { shadow: false });
    return [c[0], c[1], c[2] + r * 1.95];
  }
  /* a hand vacuum pump: barrel, handle, gauge */
  function pump(F, at, stroke) {
    R3.cylinder(F, at, add(at, [0, 0, 0.16]), 0.02, '#3A4A62', { segments: 18 });
    R3.cylinder(F, add(at, [0, 0, 0.16]), add(at, [0, 0, 0.2 + 0.05 * stroke]), 0.005, '#C9D2DC', { shadow: false });
    R3.box(F, add(at, [0, 0, 0.205 + 0.05 * stroke]), [0.09, 0.016, 0.014], '#1E242C', { shadow: false });
    R3.cylinder(F, add(at, [0.02, 0, 0.11]), add(at, [0.035, 0, 0.11]), 0.022, '#E9ECEF', { shadow: false });
  }
  /* a bell jar on its plate */
  function bellJar(F, base, r, h) {
    R3.cylinder(F, base, add(base, [0, 0, 0.012]), r * 1.2, '#8A949E', { segments: 32 });
    F.push(add(base, [0, 0, h * 0.55]), () => {
      const ctx = F.ctx, cam = F.cam, pts = [];
      for (let k = 0; k <= 10; k++) { const u = k / 10, z = base[2] + 0.012 + h * (u < 0.7 ? u / 0.7 * 0.7 : 0.7 + 0.3 * Math.sin((u - 0.7) / 0.3 * Math.PI / 2)), rr = u < 0.7 ? r : r * Math.cos((u - 0.7) / 0.3 * Math.PI / 2); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; pts.push(cam.project([base[0] + Math.cos(a) * rr, base[1] + Math.sin(a) * rr, z])); } }
      if (pts.some(p => !p.ok)) return;
      const H = hull2(pts); let x0 = 1e9, x1 = -1e9; H.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      ctx.save(); path(ctx, H); ctx.fillStyle = 'rgba(200,228,245,.06)'; ctx.fill(); ctx.clip();
      const gr = ctx.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.12, 'rgba(255,255,255,.28)'); gr.addColorStop(0.2, 'rgba(255,255,255,.03)'); gr.addColorStop(0.85, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x0, -1e4, x1 - x0, 2e4); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(215,238,255,.6)'; ctx.lineWidth = 1.1; path(ctx, H); ctx.stroke(); ctx.restore();
    }, -0.04);
  }
  /* a gas syringe standing upright: barrel with its scale, the plunger at the gas's volume */
  function gasSyringe(F, base, o) {
    const r = 0.015, L = o.len || 0.2, zTop = base[2] + L, zP = base[2] + 0.012 + clamp(o.frac, 0, 1.15) * (L - 0.02);
    R3.cylinder(F, base, add(base, [0, 0, 0.012]), 0.006, '#D8DDE2', { shadow: false });              // the sealed nozzle
    liquid(F, base.slice(0, 2).concat([0]), r * 0.92, base[2] + 0.012, zP, '#B8DCFF', { alpha: 0.42 });   // the gas, tinted so it can be seen
    R3.cylinder(F, [base[0], base[1], zP], [base[0], base[1], zP + 0.01], r * 0.95, '#1A1D22', { shadow: false });   // plunger seal
    R3.cylinder(F, [base[0], base[1], zP + 0.008], [base[0], base[1], Math.max(zTop + 0.05, zP + 0.06)], 0.004, '#EEF2F6', { shadow: false });
    R3.cylinder(F, [base[0], base[1], Math.max(zTop + 0.05, zP + 0.06)], [base[0], base[1], Math.max(zTop + 0.056, zP + 0.066)], 0.012, '#EEF2F6', { shadow: false });
    glassHull(F, [base[0], base[1], base[2] + 0.004], [base[0], base[1], zTop], r, r, { bias: -0.035 });
    F.push([base[0], base[1] - r, (base[2] + zTop) / 2], () => {
      const ctx = F.ctx, cam = F.cam; ctx.save(); ctx.font = mono(7.5); ctx.textBaseline = 'middle';
      for (let v = 0; v <= o.cap; v += 5) {
        const z = base[2] + 0.012 + v / o.cap * (L - 0.02), a = cam.project([base[0] - r * 0.7, base[1] - r * 0.7, z]), b = cam.project([base[0] - r * 0.2, base[1] - r, z]);
        if (!a.ok || !b.ok) continue;
        ctx.strokeStyle = 'rgba(245,250,255,.8)'; ctx.lineWidth = v % 20 === 0 ? 1.1 : 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + (v % 20 === 0 ? 4 : 0), b.y); ctx.stroke();
        if (v % 20 === 0) { ctx.fillStyle = '#F4F8FF'; ctx.fillText(String(v), b.x + 6, b.y); }
      }
      ctx.restore();
    }, -0.045);
    return { zP };
  }
  /* a hot-air balloon: an envelope of twelve gores, its mouth, the burner's flame, the basket and its ropes.
     c is the basket floor's centre; r the envelope's radius (m) */
  function balloon(F, c, r, o) {
    o = o || {};
    const nG = 16, nV = 14, cols = o.cols || ['#D8342C', '#F2C230', '#2A6FC0', '#F4F0E6'];
    const mouthZ = c[2] + 1.6 + r * 0.55, ctrZ = mouthZ + r * 1.2;
    const prof = t => {                                       // t 0 (mouth) .. 1 (crown): radius and height
      if (t < 0.45) { const u = t / 0.45; return [r * (0.28 + 0.72 * Math.sin(u * Math.PI / 2)), mouthZ + u * (ctrZ - mouthZ)]; }
      const a = (t - 0.45) / 0.55 * Math.PI / 2; return [r * Math.cos(a), ctrZ + r * Math.sin(a)];
    };
    for (let i = 0; i < nG; i++) {
      const a0 = i / nG * TAU, a1 = (i + 1) / nG * TAU, col = cols[i % cols.length];
      for (let j = 0; j < nV; j++) {
        const [r0, z0] = prof(j / nV), [r1, z1] = prof((j + 1) / nV);
        const P = [[c[0] + Math.cos(a0) * r0, c[1] + Math.sin(a0) * r0, z0], [c[0] + Math.cos(a1) * r0, c[1] + Math.sin(a1) * r0, z0], [c[0] + Math.cos(a1) * r1, c[1] + Math.sin(a1) * r1, z1], [c[0] + Math.cos(a0) * r1, c[1] + Math.sin(a0) * r1, z1]];
        const am = (a0 + a1) / 2, slope = Math.atan2(r0 - r1, z1 - z0), n = [Math.cos(am) * Math.cos(slope), Math.sin(am) * Math.cos(slope), Math.sin(slope)];
        const view = sub(F.cam.eye, centroid(P)); if (R3.dot(view, n) < 0) continue;      // only the faces that look at us
        const lit = F.shade(col, n, { ambient: 0.42 }), glow = o.glow || 0;
        F.push(centroid(P), () => {
          const q = P.map(p => F.cam.project(p)); if (q.some(v => !v.ok)) return;
          const ctx = F.ctx; ctx.fillStyle = glow > 0 && j < 4 ? RX.mix(lit, '#FFB050', glow * (1 - j / 4) * 0.4) : lit; path(ctx, q); ctx.fill(); ctx.strokeStyle = 'rgba(30,20,10,.25)'; ctx.lineWidth = 0.5; ctx.stroke();
        });
      }
    }
    // ropes from the mouth's load ring to the basket's corners
    const bw = 0.75, bz = c[2] + 1.1;
    const load = [];
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; load.push([[c[0] + Math.cos(a) * r * 0.28, c[1] + Math.sin(a) * r * 0.28, mouthZ], [c[0] + Math.cos(a) * bw * 0.7, c[1] + Math.sin(a) * bw * 0.7, bz]]); }
    F.push([c[0], c[1], (mouthZ + bz) / 2], () => { const ctx = F.ctx; ctx.save(); ctx.strokeStyle = 'rgba(60,50,40,.85)'; ctx.lineWidth = 1; load.forEach(([a, b]) => { const p = F.cam.project(a), q = F.cam.project(b); if (p.ok && q.ok) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }); ctx.restore(); });
    // the burner and its flame
    R3.cylinder(F, [c[0], c[1], bz + 0.15], [c[0], c[1], bz + 0.45], 0.16, '#9AA4AE', { shadow: false });
    if (o.flame > 0.02) F.push([c[0], c[1], bz + 0.9], () => {
      const ctx = F.ctx, a = F.cam.project([c[0], c[1], bz + 0.5]), b = F.cam.project([c[0], c[1], bz + 0.5 + 1.2 + 2.2 * o.flame]);
      if (!a.ok || !b.ok) return;
      const w = Math.max(3, 0.35 * a.s), fl = 0.85 + 0.15 * Math.sin((o.t || 0) * 23);
      const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, 'rgba(120,170,255,.95)'); g.addColorStop(0.25, 'rgba(255,200,90,.95)'); g.addColorStop(0.7, 'rgba(255,120,30,.75)'); g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a.x - w, a.y); ctx.quadraticCurveTo(a.x - w * 1.4, (a.y + b.y) / 2, b.x, a.y + (b.y - a.y) * fl); ctx.quadraticCurveTo(a.x + w * 1.4, (a.y + b.y) / 2, a.x + w, a.y); ctx.closePath(); ctx.fill();
      const gl = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, w * 6); gl.addColorStop(0, 'rgba(255,190,90,.45)'); gl.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = gl; ctx.fillRect(a.x - w * 6, a.y - w * 6, w * 12, w * 12); ctx.restore();
    }, -0.05);
    // the wicker basket
    window.BENCH.texBox(F, [c[0], c[1], c[2] + 0.55], [bw * 1.4, bw * 1.4, 1.1], wickerTex(), { ambient: 0.5 });
    return { mouthZ, topZ: ctrZ + r, ctrZ };
  }
  function wickerTex() {
    if (cache.wicker) return cache.wicker;
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#8A5E2E'; x.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 6) for (let k = 0; k < 128; k += 12) { x.fillStyle = (y / 6 + k / 12) % 2 ? '#B07A40' : '#9A6634'; x.fillRect(k, y, 12, 5); }
    x.strokeStyle = 'rgba(40,24,10,.6)'; for (let k = 0; k < 128; k += 12) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 128); x.stroke(); }
    x.fillStyle = '#5A3A1C'; x.fillRect(0, 0, 128, 8);
    cache.wicker = c; return c;
  }


  const sans = (px, w) => (w || 600) + ' ' + px + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
  /* ================= 6D-3: the weather station ================= */
  /* a Stevenson screen: a white louvred box on four legs, its door open toward the viewer to show the thermometers */
  function stevenson(F, c, o) {
    o = o || {};
    const w = 0.8, d = 0.55, h = 0.62, z0 = c[2] + 1.05, white = '#F2F2EE';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => R3.box(F, [c[0] + sx * (w / 2 - 0.04), c[1] + sy * (d / 2 - 0.04), c[2] + z0 / 2 - c[2] / 2], [0.05, 0.05, z0 - c[2]], white, { ambient: 0.55 }));
    const slats = (P0, P1, P3) => {                                     // a louvred face: a lit panel with dark slat lines
      const n = norm(cross(sub(P1, P0), sub(P3, P0))), col = F.shade(white, R3.dot(n, sub(F.cam.eye, P0)) > 0 ? n : scale(n, -1), { ambient: 0.55 });
      F.push(centroid([P0, P1, add(P1, sub(P3, P0)), P3]), () => {
        const q = P(F.cam, [P0, P1, add(P1, sub(P3, P0)), P3]); if (!q) return;
        const ctx = F.ctx; ctx.save(); path(ctx, q); ctx.fillStyle = col; ctx.fill(); ctx.clip();
        ctx.strokeStyle = 'rgba(60,60,60,.45)'; ctx.lineWidth = 1;
        for (let k = 1; k < 14; k++) { const u = k / 14, a = F.cam.project(add(P0, scale(sub(P3, P0), u))), b = F.cam.project(add(P1, scale(sub(P3, P0), u))); if (a.ok && b.ok) { ctx.beginPath(); ctx.moveTo(a.x, a.y + 1.5); ctx.lineTo(b.x, b.y - 1); ctx.stroke(); } }
        ctx.restore(); ctx.save(); ctx.strokeStyle = 'rgba(40,40,40,.6)'; ctx.lineWidth = 1; path(ctx, q); ctx.stroke(); ctx.restore();
      });
    };
    const x0 = c[0] - w / 2, x1 = c[0] + w / 2, y0 = c[1] - d / 2, y1 = c[1] + d / 2, z1 = z0 + h;
    slats([x0, y1, z0], [x1, y1, z0], [x0, y1, z1]);
    slats([x0, y0, z0], [x0, y1, z0], [x0, y0, z1]);
    slats([x1, y0, z0], [x1, y1, z0], [x1, y0, z1]);
    face(F, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], '#E6E6E0', { ambient: 0.5 });
    // the open door, swung out to the right
    slats([x1, y0, z0], [x1 + 0.05, y0 - w * 0.95, z0], [x1, y0, z1]);
    // a double roof
    face(F, [[x0 - 0.05, y0 - 0.05, z1 + 0.02], [x1 + 0.05, y0 - 0.05, z1 + 0.02], [x1 + 0.05, c[1], z1 + 0.14], [x0 - 0.05, c[1], z1 + 0.14]], white, { ambient: 0.6 });
    face(F, [[x0 - 0.05, y1 + 0.05, z1 + 0.02], [x1 + 0.05, y1 + 0.05, z1 + 0.02], [x1 + 0.05, c[1], z1 + 0.14], [x0 - 0.05, c[1], z1 + 0.14]], '#DADAD4', { ambient: 0.6 });
    // the thermometers inside: dry bulb, wet bulb with its wick and water pot, a max and a min lying flat
    const th = (x, col, reading) => {
      const a = [x, c[1] + 0.05, z0 + 0.1], b = [x, c[1] + 0.05, z0 + 0.5];
      glassTube(F, [a, b], 0.006, { fill: [{ from: 0, to: 0.06 + 0.32 * clamp((reading + 20) / 70, 0, 1), col }], inner: 0.5, bias: -0.06 });
      R3.sphere(F, a, 0.008, col, { shadow: false });
    };
    th(c[0] - 0.12, '#D8302C', o.dry == null ? 15 : o.dry);
    th(c[0] + 0.02, '#D8302C', o.wet == null ? 12 : o.wet);
    R3.cylinder(F, [c[0] + 0.02, c[1] + 0.05, z0 + 0.0], [c[0] + 0.02, c[1] + 0.05, z0 + 0.05], 0.025, '#E4EEF4', { shadow: false });
    return { door: [x1, y0, z0 + h / 2], inside: [c[0], c[1], z0 + 0.3] };
  }
  /* a mast with three cups on arms and a vane; dir is where the wind comes FROM (degrees, 0 = north = +y) */
  function windMast(F, base, H, rpmPhase, dir) {
    R3.cylinder(F, base, add(base, [0, 0, H]), 0.04, '#B9C2CC', { segments: 14 });
    [[0.6, 0], [-0.3, 0.52], [-0.3, -0.52]].forEach(([x, y]) => R3.tube(F, [add(base, [0, 0, H * 0.25]), add(base, [x * H * 0.35, y * H * 0.35, 0])], 0.006, '#7A828C', { shadow: false }));
    const top = add(base, [0, 0, H]);
    R3.cylinder(F, add(top, [-0.5, 0, 0]), add(top, [0.5, 0, 0]), 0.025, '#9AA4AE', { shadow: false });
    // cups on the left end of the cross-arm
    const cu = add(top, [-0.5, 0, 0.12]);
    R3.cylinder(F, add(top, [-0.5, 0, 0]), cu, 0.012, '#5A626C', { shadow: false });
    for (let k = 0; k < 3; k++) {
      const a = rpmPhase + k * TAU / 3, tip = add(cu, [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.02]);
      R3.tube(F, [add(cu, [0, 0, 0.02]), tip], 0.005, '#4A525C', { shadow: false });
      R3.sphere(F, tip, 0.055, '#2A2E34', { shadow: false });
    }
    // the vane on the right end: its arrow points into the wind
    const vc = add(top, [0.5, 0, 0.12]), rad = dir * Math.PI / 180, toward = [Math.sin(rad), Math.cos(rad), 0];
    R3.cylinder(F, add(top, [0.5, 0, 0]), vc, 0.012, '#5A626C', { shadow: false });
    const head = add(vc, scale(toward, 0.28)), tail = add(vc, scale(toward, -0.3));
    R3.tube(F, [tail, head], 0.008, '#2A2E34', { shadow: false });
    face(F, [add(head, [0, 0, 0]), add(head, add(scale(toward, -0.1), [toward[1] * 0.05, -toward[0] * 0.05, 0])), add(head, add(scale(toward, -0.1), [-toward[1] * 0.05, toward[0] * 0.05, 0]))], '#2A2E34', { ambient: 0.5 });
    face(F, [add(tail, [0, 0, -0.08]), add(tail, [0, 0, 0.1]), add(tail, add(scale(toward, 0.14), [0, 0, 0.06])), add(tail, add(scale(toward, 0.14), [0, 0, -0.04]))], '#C8302C', { ambient: 0.5 });
    return { cups: cu, vane: vc, top };
  }
  /* a standard copper rain gauge and a white tipping-bucket gauge, rims at their heights */
  function rainGauges(F, a, b, rim) {
    R3.cylinder(F, a, add(a, [0, 0, rim]), 0.065, '#B87A44', { segments: 24 });
    R3.cylinder(F, add(a, [0, 0, rim - 0.01]), add(a, [0, 0, rim + 0.012]), 0.066, '#D49A60', { segments: 24, shadow: false });
    R3.cylinder(F, b, add(b, [0, 0, rim]), 0.11, '#ECEEEC', { segments: 26 });
    R3.cylinder(F, add(b, [0, 0, rim - 0.01]), add(b, [0, 0, rim + 0.015]), 0.112, '#D8DCDE', { segments: 26, shadow: false });
  }
  /* an Alter shield: hanging slats round the gauge */
  function alterShield(F, c, rim) {
    for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; face(F, [[c[0] + Math.cos(a) * 0.32, c[1] + Math.sin(a) * 0.32, rim + 0.05], [c[0] + Math.cos(a + 0.25) * 0.32, c[1] + Math.sin(a + 0.25) * 0.32, rim + 0.05], [c[0] + Math.cos(a + 0.25) * 0.24, c[1] + Math.sin(a + 0.25) * 0.24, rim - 0.35], [c[0] + Math.cos(a) * 0.24, c[1] + Math.sin(a) * 0.24, rim - 0.35]], '#8A949E', { ambient: 0.5 }); }
  }
  /* ---- 2D instrument faces for the cards ---- */
  function thermoFace(ctx, x, y, w, h, o) {                       // a liquid-in-glass thermometer and its scale, lo..hi °C
    const lo = o.lo, hi = o.hi, bx = x + w * 0.38, top = y + 10, bot = y + h - 26, yOf = T => bot - (T - lo) / (hi - lo) * (bot - top);
    ctx.save();
    const gb = ctx.createLinearGradient(bx - 9, 0, bx + 9, 0); gb.addColorStop(0, 'rgba(200,225,240,.25)'); gb.addColorStop(0.4, 'rgba(255,255,255,.55)'); gb.addColorStop(1, 'rgba(160,190,210,.25)');
    ctx.fillStyle = gb; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - 7, top - 8, 14, bot - top + 16, 7); else ctx.rect(bx - 7, top - 8, 14, bot - top + 16); ctx.fill();
    ctx.fillStyle = o.col || '#D8302C'; ctx.fillRect(bx - 2, clamp(yOf(o.T), top, bot), 4, bot - clamp(yOf(o.T), top, bot) + 6);
    RX.ball(ctx, bx, bot + 12, 11, o.col || '#D8302C', { rim: 0.6 });
    if (o.wick) { ctx.fillStyle = 'rgba(245,245,235,.85)'; ctx.beginPath(); ctx.ellipse(bx, bot + 12, 13, 14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(160,150,120,.8)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(bx + k * 4, bot); ctx.lineTo(bx + k * 4, bot + 25); ctx.stroke(); } }
    ctx.font = mono(8.5); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (let T = Math.ceil(lo); T <= hi; T++) { const yy = yOf(T), big = T % 5 === 0; ctx.strokeStyle = 'rgba(230,236,246,.85)'; ctx.lineWidth = big ? 1.2 : 0.6; ctx.beginPath(); ctx.moveTo(bx + 9, yy); ctx.lineTo(bx + (big ? 20 : 14), yy); ctx.stroke(); if (big) { ctx.fillStyle = '#DCE6F6'; ctx.fillText(String(T), bx + 23, yy); } }
    if (o.truth != null) { const yy = yOf(o.truth); ctx.strokeStyle = '#7CF0B0'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(bx - 26, yy); ctx.lineTo(bx + 8, yy); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#7CF0B0'; ctx.textAlign = 'right'; ctx.fillText('air', bx - 28, yy); }
    if (o.label) { ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'center'; ctx.fillText(o.label, bx, y + h - 4); }
    ctx.restore();
  }
  function aneroid(ctx, cx, cy, R, P, set) {                      // a barometer dial, 950–1050 hPa, with the setting hand
    const ang = v => Math.PI * 0.75 + (clamp(v, 950, 1050) - 950) / 100 * Math.PI * 1.5;
    ctx.save();
    const rim = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R * 1.08); rim.addColorStop(0, '#E8C878'); rim.addColorStop(1, '#8A6420');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, TAU); ctx.fill();
    const fc = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.1, cx, cy, R); fc.addColorStop(0, '#FBF7EC'); fc.addColorStop(1, '#E4DCC8');
    ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2A2418'; ctx.fillStyle = '#2A2418'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let v = 950; v <= 1050; v += 2) { const a = ang(v), big = v % 10 === 0, r0 = R * (big ? 0.78 : 0.84); ctx.lineWidth = big ? 1.4 : 0.6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); ctx.stroke(); if (big && v % 20 === 0) { ctx.font = mono(Math.max(7, R * 0.11), 600); ctx.fillText(String(v), cx + Math.cos(a) * R * 0.64, cy + Math.sin(a) * R * 0.64); } }
    ctx.font = sans(Math.max(7, R * 0.105), 700); [['STORMY', 960], ['RAIN', 983], ['CHANGE', 1000], ['FAIR', 1018], ['VERY DRY', 1040]].forEach(([w2, v]) => { const a = ang(v); ctx.fillStyle = '#6A2018'; ctx.fillText(w2, cx + Math.cos(a) * R * 0.36, cy + Math.sin(a) * R * 0.36); });
    if (set != null) { const a = ang(set); ctx.strokeStyle = '#B8902C'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); ctx.stroke(); }
    const a = ang(P); ctx.strokeStyle = '#141414'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * R * 0.15, cy - Math.sin(a) * R * 0.15); ctx.lineTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); ctx.stroke();
    ctx.fillStyle = '#B8902C'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function tippingBucket(ctx, x, y, w, h, tips, rate, t) {        // a cutaway: funnel, the see-saw, its magnet and counter
    ctx.save();
    ctx.strokeStyle = '#C9D4EA'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + 6); ctx.lineTo(x + w * 0.46, y + h * 0.36); ctx.lineTo(x + w * 0.46, y + h * 0.42); ctx.moveTo(x + w * 0.9, y + 6); ctx.lineTo(x + w * 0.54, y + h * 0.36); ctx.lineTo(x + w * 0.54, y + h * 0.42); ctx.stroke();
    if (rate > 0.05) { ctx.fillStyle = 'rgba(140,200,255,.9)'; for (let k = 0; k < 4; k++) { const yy = y + h * 0.43 + ((t * 3 + k * 0.25) % 1) * h * 0.1; ctx.beginPath(); ctx.arc(x + w * 0.5, yy, 2, 0, TAU); ctx.fill(); } }
    const tilt = (tips % 2 ? 1 : -1) * 0.32, cx = x + w * 0.5, cy = y + h * 0.66;
    ctx.translate(cx, cy); ctx.rotate(tilt);
    ctx.fillStyle = '#E6E8EC'; ctx.strokeStyle = '#6A7480'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-w * 0.32, -h * 0.12); ctx.lineTo(-w * 0.32, 0); ctx.lineTo(w * 0.32, 0); ctx.lineTo(w * 0.32, -h * 0.12); ctx.lineTo(w * 0.29, -h * 0.12); ctx.lineTo(w * 0.29, -h * 0.02); ctx.lineTo(w * 0.02, -h * 0.02); ctx.lineTo(0, -h * 0.16); ctx.lineTo(-w * 0.02, -h * 0.02); ctx.lineTo(-w * 0.29, -h * 0.02); ctx.lineTo(-w * 0.29, -h * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
    const fillK = clamp((tips % 1 === 0 ? 0.5 : 0), 0, 1);
    ctx.fillStyle = 'rgba(120,180,240,.8)'; ctx.fillRect(tilt < 0 ? w * 0.03 : -w * 0.28, -h * 0.07, w * 0.25, h * 0.05 * (0.3 + fillK));
    ctx.fillStyle = '#C83A2A'; ctx.fillRect(-4, 1, 8, 6);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
    ctx.save(); ctx.fillStyle = '#4A525C'; ctx.beginPath(); ctx.moveTo(cx - 8, cy + 10); ctx.lineTo(cx + 8, cy + 10); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0A1410'; ctx.fillRect(x + w * 0.25, y + h - 26, w * 0.5, 20); ctx.fillStyle = '#7CF0B0'; ctx.font = mono(12, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(tips).padStart(4, '0') + ' tips', x + w * 0.5, y + h - 16);
    ctx.restore();
  }
  function windRose(ctx, cx, cy, R, dir, u, phase) {              // a top view: compass, the vane into the wind, the cups
    ctx.save();
    ctx.strokeStyle = 'rgba(201,212,234,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.font = mono(10, 700); ctx.fillStyle = '#DCE6F6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([n, a]) => { const r = a * Math.PI / 180; ctx.fillText(n, cx + Math.sin(r) * (R + 11), cy - Math.cos(r) * (R + 11)); });
    for (let a = 0; a < 360; a += 22.5) { const r = a * Math.PI / 180; ctx.beginPath(); ctx.moveTo(cx + Math.sin(r) * R * 0.92, cy - Math.cos(r) * R * 0.92); ctx.lineTo(cx + Math.sin(r) * R, cy - Math.cos(r) * R); ctx.stroke(); }
    // the wind itself: streaks blowing across from where it comes from
    const r = dir * Math.PI / 180, fx = Math.sin(r), fy = -Math.cos(r);
    ctx.strokeStyle = 'rgba(143,200,255,.55)'; ctx.lineWidth = 1.2;
    for (let k = -3; k <= 3; k++) { const off = k * R * 0.22, ph = ((phase * (0.2 + u * 0.05)) % 1) * 2 - 1; const sx = cx + fx * R * (1 - ph) - fy * off, sy = cy + fy * R * (1 - ph) + fx * off; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - fx * R * 0.25, sy - fy * R * 0.25); ctx.stroke(); }
    // the vane: arrow pointing FROM where the wind blows, tail fin downwind
    ctx.strokeStyle = '#F2F6FF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + fx * R * 0.7, cy + fy * R * 0.7); ctx.lineTo(cx - fx * R * 0.6, cy - fy * R * 0.6); ctx.stroke();
    ctx.fillStyle = '#F2F6FF'; ctx.beginPath(); ctx.moveTo(cx + fx * R * 0.8, cy + fy * R * 0.8); ctx.lineTo(cx + fx * R * 0.6 - fy * 8, cy + fy * R * 0.6 + fx * 8); ctx.lineTo(cx + fx * R * 0.6 + fy * 8, cy + fy * R * 0.6 - fx * 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#C8302C'; ctx.beginPath(); ctx.moveTo(cx - fx * R * 0.45 - fy * 12, cy - fy * R * 0.45 + fx * 12); ctx.lineTo(cx - fx * R * 0.7 - fy * 12, cy - fy * R * 0.7 + fx * 12); ctx.lineTo(cx - fx * R * 0.7 + fy * 12, cy - fy * R * 0.7 - fx * 12); ctx.lineTo(cx - fx * R * 0.45 + fy * 12, cy - fy * R * 0.45 - fx * 12); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 3; k++) { const a = phase + k * TAU / 3, px = cx + Math.cos(a) * R * 0.3, py = cy + Math.sin(a) * R * 0.3; ctx.strokeStyle = '#8A949E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); RX.ball(ctx, px, py, 6, '#2A2E34', { rim: 0.5 }); }
    ctx.restore();
  }
  /* the station model a forecaster plots: cloud cover in the circle, a wind barb from where the wind comes, temperature and
     dew point on the left, pressure (three figures) and its 3-hour change on the right, the present weather between */
  function stationModel(ctx, cx, cy, s, m) {
    ctx.save(); ctx.strokeStyle = '#F2F6FF'; ctx.fillStyle = '#F2F6FF'; ctx.lineWidth = 1.6;
    const r = s * 0.16;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    const ok = Math.round(m.oktas);
    if (ok >= 8) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
    else if (ok > 0) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * ok / 8); ctx.closePath(); ctx.fill(); }
    // the barb: a shaft toward where the wind comes from, a full feather per 10 knots, a half per 5, a pennant per 50
    const kt = m.u * 1.94384, a = m.dir * Math.PI / 180, fx = Math.sin(a), fy = -Math.cos(a), L = s * 0.62;
    if (kt >= 2.5) {
      ctx.beginPath(); ctx.moveTo(cx + fx * r, cy + fy * r); ctx.lineTo(cx + fx * L, cy + fy * L); ctx.stroke();
      let k5 = Math.round(kt / 5), pos = L; const px = fy, py = -fx;   // feathers on the clockwise side
      while (k5 >= 10) { ctx.beginPath(); ctx.moveTo(cx + fx * pos, cy + fy * pos); ctx.lineTo(cx + fx * (pos - s * 0.05) + px * s * 0.22, cy + fy * (pos - s * 0.05) + py * s * 0.22); ctx.lineTo(cx + fx * (pos - s * 0.1), cy + fy * (pos - s * 0.1)); ctx.fill(); pos -= s * 0.13; k5 -= 10; }
      while (k5 >= 2) { ctx.beginPath(); ctx.moveTo(cx + fx * pos, cy + fy * pos); ctx.lineTo(cx + fx * (pos + s * 0.05) + px * s * 0.24, cy + fy * (pos + s * 0.05) + py * s * 0.24); ctx.stroke(); pos -= s * 0.07; k5 -= 2; }
      if (k5 === 1) { if (pos === L) pos -= s * 0.07; ctx.beginPath(); ctx.moveTo(cx + fx * pos, cy + fy * pos); ctx.lineTo(cx + fx * (pos + s * 0.025) + px * s * 0.12, cy + fy * (pos + s * 0.025) + py * s * 0.12); ctx.stroke(); }
    } else { ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0, TAU); ctx.stroke(); }
    ctx.font = mono(s * 0.13, 700); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillStyle = '#FF9A8A'; ctx.fillText(m.Tlab, cx - r * 1.5, cy - r * 1.3); ctx.fillStyle = '#7CF0B0'; ctx.fillText(m.Tdlab, cx - r * 1.5, cy + r * 1.3);
    ctx.textAlign = 'left'; ctx.fillStyle = '#F2F6FF'; ctx.fillText(m.Pcode, cx + r * 1.5, cy - r * 1.3); ctx.fillStyle = '#FFD27A'; ctx.fillText(m.tend, cx + r * 1.5, cy + r * 0.2);
    if (m.rain) { ctx.fillStyle = '#7FC4FF'; for (let k = 0; k < (m.rain > 4 ? 3 : m.rain > 1 ? 2 : 1); k++) { ctx.beginPath(); ctx.arc(cx - r * 2.2 - k * s * 0.05, cy, s * 0.022, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }

  window.G6D = { face, pane, chamber, lid, glassTube, fan, fog, rainRig, soilTray, stream, leafShape, leaf, shoot, bag, lamp, stomata, skinTex, spotPlate, tag, hull2, mistTex, rng,
                 glassHull, liquid, ironWool, granules, scaleBoard, flask, pump, bellJar, gasSyringe, balloon,
                 stevenson, windMast, rainGauges, alterShield, thermoFace, aneroid, tippingBucket, windRose, stationModel };
})();
