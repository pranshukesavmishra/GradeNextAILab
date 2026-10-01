/* ============================================================
   TERRAIN — a block of landscape, cut open.

   A heightfield drawn cell by cell, lit by the sun and coloured by what
   covers the ground (forest, farmland, marsh, ash, burned soil); water
   wherever a level stands above the ground, with a smooth shoreline, its
   colour set by its depth and a glint where the sun catches it; the two
   near sides cut away like a geologist's block model, showing the layers
   under the ground — soil, sand and gravel holding groundwater, clay,
   bedrock — and the water column where the land goes under the sea.
   Trees, houses and poles stand on it and sort in depth with the cells.
   Everything here draws what a lab computed; nothing here computes science.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const css = (c, al) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al == null ? 1 : al) + ')';
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* a block of land: n × n cells over size × size, centred on the origin; heights from height(x, y) */
  function block(o) {
    const n = o.n, N1 = n + 1, d = o.size / n, x0 = -o.size / 2, y0 = -o.size / 2;
    const B = { n, N1, d, x0, y0, size: o.size, zBase: o.zBase, H: new Float32Array(N1 * N1), P: new Float32Array(N1 * N1 * 3) };
    B.set = fn => { for (let j = 0; j < N1; j++) for (let i = 0; i < N1; i++) B.H[j * N1 + i] = fn(x0 + i * d, y0 + j * d, i, j); return B; };
    B.zAt = (x, y) => {
      const fi = clamp((x - x0) / d, 0, n - 1e-6), fj = clamp((y - y0) / d, 0, n - 1e-6), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, H = B.H;
      return H[j * N1 + i] * (1 - u) * (1 - v) + H[j * N1 + i + 1] * u * (1 - v) + H[(j + 1) * N1 + i] * (1 - u) * v + H[(j + 1) * N1 + i + 1] * u * v;
    };
    B.set(o.height);
    return B;
  }

  /* patterns for the cut faces: gravel speckle, clay laminae, rock joints — made once */
  const PAT = {};
  function pattern(ctx, kind) {
    if (PAT[kind] || typeof document === 'undefined') return PAT[kind] || null;
    const c = document.createElement('canvas'); c.width = 24; c.height = 24;
    const x = c.getContext('2d');
    let s = kind.length * 977 + 13;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (kind === 'gravel') { for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(0,0,0,' + (0.10 + 0.18 * rnd()).toFixed(2) + ')'; x.beginPath(); x.arc(rnd() * 24, rnd() * 24, 0.6 + rnd() * 1.4, 0, TAU); x.fill(); } }
    else if (kind === 'clay') { x.strokeStyle = 'rgba(0,0,0,.16)'; x.lineWidth = 1; for (let y = 3; y < 24; y += 5) { x.beginPath(); x.moveTo(0, y + rnd()); x.lineTo(24, y + rnd()); x.stroke(); } }
    else if (kind === 'rock') { x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { x.beginPath(); const a = rnd() * 24, b = rnd() * 24; x.moveTo(a, b); x.lineTo(a + 6 - rnd() * 12, b + 8); x.stroke(); } }
    else if (kind === 'soil') { for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(40,24,10,' + (0.12 + 0.15 * rnd()).toFixed(2) + ')'; x.fillRect(rnd() * 24, rnd() * 24, 1.5, 1.5); } }
    PAT[kind] = ctx.createPattern(c, 'repeat');
    return PAT[kind];
  }

  /* clip a 3D polygon to z < level (Sutherland–Hodgman against one plane) */
  function clipBelow(pts, level) {
    const out = [];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length], ina = a[2] < level, inb = b[2] < level;
      if (ina) out.push(a);
      if (ina !== inb) { const t = (level - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, level]); }
    }
    return out;
  }

  /* draw the block.
     o.cover(i, j, x, y, z, nz) → [r, g, b] the ground's colour
     o.water(i, j, x, y) → the water level over the cell, or null
     o.items [{ at: [x, y, z], draw(ctx, q) }] trees, houses, poles — sorted with the cells
     o.layers [{ col, pat, top(x, y, zs) }] under the ground, surface first; o.table(x, y) the water table
     o.sea the sea level (for the cut face), o.light [x, y, z], o.ambient */
  function draw(ctx, cam, B, o) {
    const n = B.n, N1 = B.N1, H = B.H, P = B.P, d = B.d;
    const L = o.light || [-0.5, -0.45, 0.74], ll = Math.hypot(L[0], L[1], L[2]), Lx = L[0] / ll, Ly = L[1] / ll, Lz = L[2] / ll;
    const amb = o.ambient == null ? 0.34 : o.ambient;
    for (let j = 0; j < N1; j++) for (let i = 0; i < N1; i++) {
      const k = j * N1 + i, q = cam.project([B.x0 + i * d, B.y0 + j * d, H[k]]);
      P[k * 3] = q.x; P[k * 3 + 1] = q.y; P[k * 3 + 2] = q.ok ? q.z : -1;
    }
    const eye = cam.eye, f = cam.f;
    const depth = p => (p[0] - eye[0]) * f[0] + (p[1] - eye[1]) * f[1] + (p[2] - eye[2]) * f[2];
    const list = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * N1 + i, zc = (H[k] + H[k + 1] + H[k + N1] + H[k + N1 + 1]) / 4;
      list.push({ d: depth([B.x0 + (i + 0.5) * d, B.y0 + (j + 0.5) * d, zc]), i, j });
    }
    (o.items || []).forEach(it => list.push({ d: depth(it.at) - (it.bias || 0), it }));
    list.sort((a, b) => b.d - a.d);
    const hx = -eye[0], hy = -eye[1], hz = -eye[2];
    ctx.save();
    ctx.lineJoin = 'round';
    for (const e of list) {
      if (e.it) { const q = cam.project(e.it.at); if (q.ok) e.it.draw(ctx, q); continue; }
      const i = e.i, j = e.j, k00 = j * N1 + i, k10 = k00 + 1, k01 = k00 + N1, k11 = k01 + 1;
      if (P[k00 * 3 + 2] < 0 || P[k10 * 3 + 2] < 0 || P[k01 * 3 + 2] < 0 || P[k11 * 3 + 2] < 0) continue;
      const z00 = H[k00], z10 = H[k10], z01 = H[k01], z11 = H[k11];
      let nx = (z00 - z10 + z01 - z11) / (2 * d), ny = (z00 + z10 - z01 - z11) / (2 * d), nz = 1;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const x = B.x0 + (i + 0.5) * d, y = B.y0 + (j + 0.5) * d, zc = (z00 + z10 + z01 + z11) / 4;
      const lam = amb + (1 - amb) * Math.max(0, nx * Lx + ny * Ly + nz * Lz) * 1.12;
      const c = o.cover(i, j, x, y, zc, nz), col = css([c[0] * lam, c[1] * lam, c[2] * lam]);
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(P[k00 * 3], P[k00 * 3 + 1]); ctx.lineTo(P[k10 * 3], P[k10 * 3 + 1]); ctx.lineTo(P[k11 * 3], P[k11 * 3 + 1]); ctx.lineTo(P[k01 * 3], P[k01 * 3 + 1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // water standing on the cell, cut to a smooth shoreline
      const wl = o.water ? o.water(i, j, x, y) : null;
      if (wl != null && wl > Math.min(z00, z10, z01, z11)) {
        const x0 = B.x0 + i * d, y0 = B.y0 + j * d;
        const poly = clipBelow([[x0, y0, z00], [x0 + d, y0, z10], [x0 + d, y0 + d, z11], [x0, y0 + d, z01]], wl);
        if (poly.length >= 3) {
          const dep = Math.max(0, wl - zc), deep = clamp(dep / (o.deepAt || 40), 0, 1);
          const base = o.waterCol ? o.waterCol(dep, i, j) : mixc([88, 170, 190], [14, 52, 96], deep);
          // the sky in it, and the sun's glint
          const vx = x - eye[0], vy = y - eye[1], vz = wl - eye[2], vl = Math.hypot(vx, vy, vz);
          const hxw = Lx - vx / vl, hyw = Ly - vy / vl, hzw = Lz - vz / vl, hl = Math.hypot(hxw, hyw, hzw);
          const spec = Math.pow(Math.max(0, hzw / hl), 90) * 0.9, fres = Math.pow(1 - Math.abs(vz / vl), 4) * 0.35;
          const wc = mixc(mixc(base, [190, 214, 236], fres), [255, 252, 240], spec);
          ctx.fillStyle = css(wc, o.waterAlpha == null ? 0.9 : o.waterAlpha); ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath();
          poly.forEach((p, m) => { const q = cam.project([p[0], p[1], wl]); m ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
    ctx.restore();
    sides(ctx, cam, B, o);
    void hx; void hy; void hz;
  }

  /* the cut faces on the near sides: layers under the ground, the water table, the sea over the sea floor */
  function sides(ctx, cam, B, o) {
    const n = B.n, N1 = B.N1, d = B.d, eye = cam.eye;
    const faces = [];
    if (eye[1] < B.y0) faces.push({ fixed: 'y', v: B.y0, row: 0 });
    if (eye[1] > B.y0 + B.size) faces.push({ fixed: 'y', v: B.y0 + B.size, row: n });
    if (eye[0] < B.x0) faces.push({ fixed: 'x', v: B.x0, col: 0 });
    if (eye[0] > B.x0 + B.size) faces.push({ fixed: 'x', v: B.x0 + B.size, col: n });
    const layers = o.layers || [{ col: [120, 96, 70], pat: 'soil', top: (x, y, zs) => zs }];
    ctx.save();
    for (const F of faces) {
      const pt = m => F.fixed === 'y' ? [B.x0 + m * d, F.v, B.H[F.row * N1 + m]] : [F.v, B.y0 + m * d, B.H[m * N1 + F.col]];
      const shade = F.fixed === 'y' ? 0.92 : 0.78;
      for (let m = 0; m < n; m++) {
        const a = pt(m), b = pt(m + 1);
        const tops = L => [L.top(a[0], a[1], a[2]), L.top(b[0], b[1], b[2])];
        for (let k = 0; k < layers.length; k++) {
          const Lk = layers[k], ta = tops(Lk), bb = k + 1 < layers.length ? tops(layers[k + 1]) : [B.zBase, B.zBase];
          const za = Math.min(ta[0], a[2]), zb = Math.min(ta[1], b[2]), wa = Math.max(bb[0], B.zBase), wb = Math.max(bb[1], B.zBase);
          if (za <= wa && zb <= wb) continue;
          quad(ctx, cam, [a[0], a[1], za], [b[0], b[1], zb], [b[0], b[1], Math.min(zb, wb)], [a[0], a[1], Math.min(za, wa)], css(mixc([0, 0, 0], Lk.col, shade)), Lk.pat);
          // groundwater: the part of a permeable layer below the water table
          if (Lk.wet && o.table) {
            const ya = Math.min(za, o.table(a[0], a[1])), yb = Math.min(zb, o.table(b[0], b[1]));
            if (ya > wa || yb > wb) {
              quad(ctx, cam, [a[0], a[1], Math.max(ya, wa)], [b[0], b[1], Math.max(yb, wb)], [b[0], b[1], wb], [a[0], a[1], wa], 'rgba(70,140,230,.34)', null);
              const qa = cam.project([a[0], a[1], Math.max(ya, wa)]), qb = cam.project([b[0], b[1], Math.max(yb, wb)]);
              if (qa.ok && qb.ok) { ctx.strokeStyle = 'rgba(140,200,255,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(qa.x, qa.y); ctx.lineTo(qb.x, qb.y); ctx.stroke(); }
            }
          }
        }
        // the sea over the sea floor
        if (o.sea != null && (a[2] < o.sea || b[2] < o.sea)) {
          const sa = Math.max(a[2], o.sea), sb = Math.max(b[2], o.sea);
          quad(ctx, cam, [a[0], a[1], sa], [b[0], b[1], sb], [b[0], b[1], b[2]], [a[0], a[1], a[2]], 'rgba(40,110,170,.62)', null);
        }
        // the ground's own edge line
        const qa = cam.project(a), qb = cam.project(b);
        if (qa.ok && qb.ok) { ctx.strokeStyle = 'rgba(20,14,8,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qa.x, qa.y); ctx.lineTo(qb.x, qb.y); ctx.stroke(); }
      }
      // the block's bottom edge
      const b0 = cam.project(F.fixed === 'y' ? [B.x0, F.v, B.zBase] : [F.v, B.y0, B.zBase]), b1 = cam.project(F.fixed === 'y' ? [B.x0 + B.size, F.v, B.zBase] : [F.v, B.y0 + B.size, B.zBase]);
      if (b0.ok && b1.ok) { ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); }
    }
    ctx.restore();
  }
  function quad(ctx, cam, a, b, c, d, fill, pat) {
    const qa = cam.project(a), qb = cam.project(b), qc = cam.project(c), qd = cam.project(d);
    if (!qa.ok || !qb.ok || !qc.ok || !qd.ok) return;
    ctx.beginPath(); ctx.moveTo(qa.x, qa.y); ctx.lineTo(qb.x, qb.y); ctx.lineTo(qc.x, qc.y); ctx.lineTo(qd.x, qd.y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = fill; ctx.lineWidth = 0.6; ctx.stroke();
    const P = pat ? pattern(ctx, pat) : null;
    if (P) { ctx.fillStyle = P; ctx.fill(); }
  }

  /* ---------------- what stands on the land ---------------- */
  /* a tree at its base point: kind 'conifer' | 'broad'; state 'live' | 'dry' | 'scorched' | 'burning' | 'burnt' | 'sprout' */
  function tree(ctx, x, y, h, o) {
    o = o || {};
    const kind = o.kind || 'conifer', st = o.state || 'live', w = h * (kind === 'conifer' ? 0.42 : 0.62), t = o.t || 0, seed = o.seed || 0;
    ctx.save();
    if (st === 'sprout') {
      ctx.fillStyle = '#7BC45A'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.08, h * 0.16, h * 0.08, 0, 0, TAU); ctx.fill();
      ctx.restore(); return;
    }
    // the trunk
    ctx.strokeStyle = st === 'burnt' ? '#161210' : '#4A3322'; ctx.lineWidth = Math.max(1, h * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * (st === 'burnt' ? 0.92 : 0.35)); ctx.stroke();
    if (st === 'burnt') {
      ctx.lineWidth = Math.max(0.8, h * 0.035);
      for (let k = 0; k < 3; k++) { const yy = y - h * (0.45 + k * 0.16), s = (k % 2 ? 1 : -1) * w * (0.35 - k * 0.07); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + s, yy - h * 0.06); ctx.stroke(); }
      ctx.restore(); return;
    }
    const green = st === 'live' ? ['#1F5A2E', '#3E8A45'] : st === 'dry' ? ['#6B6A2A', '#9A9442'] : ['#6A4020', '#9C6A30'];
    if (kind === 'conifer') {
      for (let k = 0; k < 3; k++) {
        const yb = y - h * (0.22 + k * 0.22), ww = w * (1 - k * 0.24), yt = yb - h * 0.40;
        const g = ctx.createLinearGradient(x - ww / 2, 0, x + ww / 2, 0); g.addColorStop(0, green[1]); g.addColorStop(1, green[0]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - ww / 2, yb); ctx.lineTo(x, yt); ctx.lineTo(x + ww / 2, yb); ctx.closePath(); ctx.fill();
      }
    } else {
      const g = ctx.createRadialGradient(x - w * 0.18, y - h * 0.72, w * 0.05, x, y - h * 0.62, w * 0.6);
      g.addColorStop(0, green[1]); g.addColorStop(1, green[0]);
      ctx.fillStyle = g;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.7 + seed) * w * 0.18, y - h * (0.62 + 0.08 * Math.sin(k * 2.3 + seed)), w * 0.34, 0, TAU); ctx.fill(); }
    }
    if (st === 'burning') flames(ctx, x, y - h * 0.3, w * 0.9, h * 0.95, t + seed);
    ctx.restore();
  }
  /* flames: tongues of fire that flicker, with a glow */
  function flames(ctx, x, y, w, h, t) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y - h * 0.3, 1, x, y - h * 0.3, h * 0.9);
    g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - h * 0.3, h * 0.9, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) {
      const ph = t * 9 + k * 1.9, hh = h * (0.55 + 0.35 * Math.abs(Math.sin(ph))), xx = x + (k - 1.5) * w * 0.22 + Math.sin(ph * 1.3) * w * 0.05;
      const fg = ctx.createLinearGradient(0, y, 0, y - hh);
      fg.addColorStop(0, 'rgba(255,80,20,.95)'); fg.addColorStop(0.55, 'rgba(255,170,40,.9)'); fg.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(xx - w * 0.14, y); ctx.quadraticCurveTo(xx - w * 0.1, y - hh * 0.6, xx, y - hh); ctx.quadraticCurveTo(xx + w * 0.12, y - hh * 0.55, xx + w * 0.14, y); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  /* a house with a pitched roof, drawn from its 3D corners so it sits in the view like the land does */
  function house(ctx, cam, at, s, o) {
    o = o || {};
    const [x, y, z] = at, w = s, dd = s * 0.8, hh = s * 0.55, rh = s * 0.35, rot = o.rot || 0, c = Math.cos(rot), sn = Math.sin(rot);
    const P = (u, v, h) => cam.project([x + u * c - v * sn, y + u * sn + v * c, z + h]);
    const pts = { a: P(-w / 2, -dd / 2, 0), b: P(w / 2, -dd / 2, 0), cc: P(w / 2, dd / 2, 0), d: P(-w / 2, dd / 2, 0),
      A: P(-w / 2, -dd / 2, hh), B: P(w / 2, -dd / 2, hh), C: P(w / 2, dd / 2, hh), D: P(-w / 2, dd / 2, hh), r1: P(-w / 2, 0, hh + rh), r2: P(w / 2, 0, hh + rh) };
    if (Object.values(pts).some(q => !q.ok)) return;
    const eye = cam.eye, facing = (nx, ny) => (eye[0] - x) * nx + (eye[1] - y) * ny > 0;
    const wall = o.flooded ? '#8FA3B5' : (o.wall || '#E6DCC8'), roof = o.roof || '#A5452F';
    const face = (ps, col) => { ctx.fillStyle = col; ctx.beginPath(); ps.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = 0.6; ctx.stroke(); };
    ctx.save();
    const nY = [-sn, c], nX = [c, sn];
    if (facing(-nY[0], -nY[1])) face([pts.a, pts.b, pts.B, pts.A], css(mixc(hex(wall), [0, 0, 0], 0.05)));
    if (facing(nY[0], nY[1])) face([pts.d, pts.cc, pts.C, pts.D], css(mixc(hex(wall), [0, 0, 0], 0.2)));
    if (facing(-nX[0], -nX[1])) face([pts.a, pts.d, pts.D, pts.r1, pts.A], css(mixc(hex(wall), [0, 0, 0], 0.12)));
    if (facing(nX[0], nX[1])) face([pts.b, pts.cc, pts.C, pts.r2, pts.B], css(mixc(hex(wall), [0, 0, 0], 0.28)));
    face([pts.A, pts.B, pts.r2, pts.r1], css(mixc(hex(roof), [255, 255, 255], 0.08)));
    face([pts.D, pts.C, pts.r2, pts.r1], css(mixc(hex(roof), [0, 0, 0], 0.25)));
    ctx.restore();
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  /* rising smoke or ash: soft puffs from a base, drifting with the wind, seeded so a frame is repeatable */
  function plume(ctx, cam, base, o) {
    const n = o.n || 40, rise = o.rise, drift = o.drift || [0, 0], t = o.t || 0, col = o.col || [120, 118, 116];
    ctx.save();
    for (let k = 0; k < n; k++) {
      const u = ((k / n) + t * (o.speed || 0.05)) % 1, jitter = Math.sin(k * 12.9898) * 0.5;
      const p = [base[0] + drift[0] * u + (o.spread || 0) * u * jitter, base[1] + drift[1] * u + (o.spread || 0) * u * Math.cos(k * 7.1), base[2] + rise * Math.pow(u, o.bend || 0.7)];
      const q = cam.project(p);
      if (!q.ok) continue;
      const r = Math.max(2, (o.r0 || 0.2) * (1 + (o.grow || 4) * u) * q.s), a = (o.alpha || 0.5) * Math.sin(Math.PI * Math.min(1, u * 1.2)) * (1 - u * 0.4);
      const g = ctx.createRadialGradient(q.x - r * 0.3, q.y - r * 0.3, r * 0.1, q.x, q.y, r);
      g.addColorStop(0, css(mixc(col, [255, 255, 255], 0.25), a)); g.addColorStop(1, css(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  /* rain across a box on the screen */
  function rain(ctx, x, y, w, h, rate, t, slant) {
    if (rate <= 0) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(190,210,235,' + clamp(0.15 + rate * 0.02, 0.15, 0.55).toFixed(2) + ')'; ctx.lineWidth = 1;
    const n = Math.round(clamp(rate * 6, 10, 260));
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const fx = (Math.sin(k * 91.7) * 0.5 + 0.5), sp = 0.8 + 0.4 * (Math.sin(k * 3.3) * 0.5 + 0.5), fy = ((t * sp * 1.4) + k * 0.137) % 1;
      const px = x + fx * w, py = y + fy * h, l = 10 + 6 * sp;
      ctx.moveTo(px, py); ctx.lineTo(px + (slant || 0) * l, py + l);
    }
    ctx.stroke();
    ctx.restore();
  }
  /* a benchmark pole with marks where the ground stood in earlier years (after Poland's photograph) */
  function pole(ctx, cam, at, height, marks) {
    const q0 = cam.project(at), q1 = cam.project([at[0], at[1], at[2] + height]);
    if (!q0.ok || !q1.ok) return;
    ctx.save();
    ctx.strokeStyle = '#6B4A2A'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
    (marks || []).forEach(m => {
      const q = cam.project([at[0], at[1], at[2] + m.z]);
      if (!q.ok) return;
      ctx.fillStyle = '#F2EAD8'; ctx.strokeStyle = '#2A2A2A'; ctx.lineWidth = 0.8;
      ctx.fillRect(q.x + 2, q.y - 5, 30, 10); ctx.strokeRect(q.x + 2, q.y - 5, 30, 10);
      ctx.fillStyle = '#1A1A1A'; ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.label, q.x + 17, q.y);
    });
    ctx.restore();
  }

  window.TERRAIN = { block, draw, sides, tree, flames, house, plume, rain, pole, clipBelow, css, mixc, hex };
})();
