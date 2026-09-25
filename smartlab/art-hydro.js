/* ============================================================
   HYDRO — the water bench and the town that stores water.
   A clear acrylic column with its printed scale and the water in it drawn as
   a volume; a sharp-edged orifice and the jet it throws — a real parabola
   from the exit speed, necking and breaking into drops as a jet does; a catch
   tray that fills with exactly what drained; a laboratory tap and the stream
   it pours; a float flow-meter; an ultrasonic level sensor; a stopwatch; and,
   for the town, a water tower with its level board and the houses it feeds.
   Every function takes world metres (Z up) and draws through an R3 Frame, so
   depth, light and the camera are the scene's own.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX, BENCH = window.BENCH;
  const TAU = Math.PI * 2, G = 9.81;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale } = R3;
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function ringPts(cam, c, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, q = cam.project([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]]);
      if (!q.ok) return null;
      out.push(q);
    }
    return out;
  }
  function hull2(P) {
    const p = P.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    p.forEach(q => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const polyPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); };
  const WATER = '#4FA8DC';

  /* ---------------- the column ----------------
     base: the centre of its floor; r: inner radius; H: height; level: water
     height above the floor. o.scale: { step, label, unit, from } prints a
     graduated scale on the glass on the side facing the camera; o.wobble
     ripples the free surface (a stream landing on it); o.tint colours the
     water; o.cap draws the dark acrylic foot. */
  function column(F, base, r, H, level, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, wall = o.wall || Math.max(0.002, r * 0.06);
    if (o.cap !== false) {
      R3.cylinder(F, sub(base, [0, 0, 0.012]), base, r + wall + 0.012, o.capColour || '#1E2532', { segments: 40, shadow: false, ambient: 0.4 });
    }
    const lv = clamp(level, 0, H), col = o.tint || WATER;
    // the water: a tinted volume, deeper blue with depth, and its lit free surface
    if (lv > 1e-4) F.push([base[0], base[1], base[2] + lv / 2], () => {
      const b = ringPts(cam, base, r, 44), t = ringPts(cam, [base[0], base[1], base[2] + lv], r, 44);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
      Hh.forEach(q => { y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      ctx.save();
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, RX.rgba(RX.mix(col, '#FFFFFF', 0.25), 0.34)); gr.addColorStop(1, RX.rgba(RX.mix(col, '#0A2A48', 0.45), 0.52));
      ctx.fillStyle = gr; polyPath(ctx, Hh); ctx.fill();
      ctx.clip();
      // refraction: the water body is brighter in the middle of the tube than at its edges
      const hz = ctx.createLinearGradient(x0, 0, x1, 0);
      hz.addColorStop(0, 'rgba(8,30,56,.28)'); hz.addColorStop(0.3, 'rgba(180,225,250,.10)'); hz.addColorStop(0.55, 'rgba(210,240,255,.16)');
      hz.addColorStop(0.8, 'rgba(180,225,250,.06)'); hz.addColorStop(1, 'rgba(8,30,56,.30)');
      ctx.fillStyle = hz; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
      // the free surface: a lit ellipse, a bright meniscus line where it meets the glass
      const wob = o.wobble || 0, ph = o.phase || 0;
      const ts = wob > 0 ? t.map((q, i) => ({ x: q.x, y: q.y + Math.sin(i / t.length * TAU * 3 + ph * 9) * wob })) : t;
      ctx.fillStyle = RX.rgba(RX.mix(col, '#FFFFFF', 0.45), 0.55); polyPath(ctx, ts); ctx.fill();
      ctx.strokeStyle = 'rgba(235,248,255,.85)'; ctx.lineWidth = 1.2; polyPath(ctx, ts); ctx.stroke();
      if (wob > 0) {                                  // rings spreading from where the stream lands
        const cx = ts.reduce((u, q) => u + q.x, 0) / ts.length, cy = ts.reduce((u, q) => u + q.y, 0) / ts.length;
        const rx = (Math.max(...ts.map(q => q.x)) - Math.min(...ts.map(q => q.x))) / 2, ry = (Math.max(...ts.map(q => q.y)) - Math.min(...ts.map(q => q.y))) / 2;
        for (let k = 0; k < 3; k++) {
          const f = ((ph * 1.4 + k / 3) % 1);
          ctx.strokeStyle = 'rgba(235,250,255,' + (0.5 * (1 - f)).toFixed(3) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx * f * 0.9, ry * f * 0.9, 0, 0, TAU); ctx.stroke();
        }
      }
    }, -0.02);
    // the glass: almost clear, with the two bright streaks a tube throws at its silhouette
    F.push([base[0], base[1], base[2] + H / 2], () => {
      const b = ringPts(cam, base, r + wall, 44), t = ringPts(cam, [base[0], base[1], base[2] + H], r + wall, 44);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
      Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); });
      ctx.save();
      polyPath(ctx, Hh);
      ctx.fillStyle = 'rgba(190,225,245,.06)'; ctx.fill();
      ctx.clip();
      const gr = ctx.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.06, 'rgba(255,255,255,.30)'); gr.addColorStop(0.12, 'rgba(255,255,255,.04)');
      gr.addColorStop(0.82, 'rgba(255,255,255,.02)'); gr.addColorStop(0.91, 'rgba(255,255,255,.18)'); gr.addColorStop(0.97, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, 4000);
      ctx.restore();
      ctx.strokeStyle = 'rgba(215,238,255,.55)'; ctx.lineWidth = 1; polyPath(ctx, Hh); ctx.stroke();
      ctx.strokeStyle = 'rgba(235,248,255,.8)'; ctx.lineWidth = 1.3; polyPath(ctx, t); ctx.stroke();
      if (o.scale) drawScale(ctx, cam, base, r + wall, H, o.scale);
    }, -0.04);
  }
  /* the graduated scale printed on the glass, turned a little left of the camera so the water
     behind it stays in view; ticks every o.step, numbers every o.label */
  function drawScale(ctx, cam, base, rr, H, sc) {
    const e = cam.eye, dx = e[0] - base[0], dy = e[1] - base[1], L = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy / L, dx / L) + (sc.turn == null ? 0.55 : sc.turn);
    const nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny, ty = nx;
    const step = sc.step || 0.01, lab = sc.label || 0.05, from = sc.from || 0, top = sc.to == null ? H : sc.to;
    ctx.save();
    ctx.font = '600 ' + (sc.font || 9) + 'px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle';
    for (let k = 0; k * step <= top - from + 1e-9; k++) {
      const z = from + k * step, big = Math.abs((z / lab) - Math.round(z / lab)) < 1e-6, mid = !big && Math.abs((z / (lab / 2)) - Math.round(z / (lab / 2))) < 1e-6;
      const len = big ? 0.55 : mid ? 0.38 : 0.22;
      const p0 = [base[0] + nx * rr, base[1] + ny * rr, base[2] + z];
      const p1 = [p0[0] + tx * rr * len, p0[1] + ty * rr * len, p0[2]];
      const a = cam.project(p0), b = cam.project(p1);
      if (!a.ok || !b.ok) continue;
      ctx.strokeStyle = big ? 'rgba(245,250,255,.92)' : 'rgba(235,245,255,.7)'; ctx.lineWidth = big ? 1.3 : 0.9;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (big) {
        const v = Math.round((z - (sc.zero || 0)) * (sc.mult || 100));
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,12,22,.75)'; ctx.textAlign = b.x < a.x ? 'right' : 'left';
        const tx2 = b.x + (b.x < a.x ? -3 : 3);
        ctx.strokeText(String(v), tx2, b.y); ctx.fillStyle = '#F4F8FF'; ctx.fillText(String(v), tx2, b.y);
      }
    }
    if (sc.unit) {
      const q = cam.project([base[0] + nx * rr + tx * rr * 0.6, base[1] + ny * rr + ty * rr * 0.6, base[2] + top + 0.012]);
      if (q.ok) { ctx.textAlign = 'center'; ctx.fillStyle = '#C9D4EA'; ctx.fillText(sc.unit, q.x, q.y); }
    }
    ctx.restore();
  }

  /* ---------------- a sharp-edged orifice in the wall, as a brass bulkhead fitting ---------------- */
  function orifice(F, at, n, d, o) {
    o = o || {};
    const L = o.length || 0.012, R = d / 2 + Math.max(0.002, d * 0.35);
    R3.cylinder(F, sub(at, scale(n, 0.002)), add(at, scale(n, L)), R, o.colour || '#B08D57', { segments: 18, shadow: false, ambient: 0.45, inner: d / 2 });
    R3.cylinder(F, add(at, scale(n, L * 0.25)), add(at, scale(n, L * 0.55)), R * 1.35, RX.mix(o.colour || '#B08D57', '#3A2A18', 0.25), { segments: 6, shadow: false, ambient: 0.45, inner: R * 0.9 });
    if (o.plug) R3.cylinder(F, add(at, scale(n, L)), add(at, scale(n, L + 0.006)), R * 1.05, '#1E2430', { segments: 16, shadow: false });
  }

  /* ---------------- the jet ----------------
     A horizontal jet from `from` along the unit vector `dir` at speed v (m/s),
     of diameter d at the vena contracta, falling under gravity to the plane
     z = floorZ. The stream stays glassy for its coherent length and then
     necks into drops about twice its width, as a real jet does (Rayleigh–
     Plateau); the drops ride the same parabola. Returns the landing point. */
  function jetPath(from, dir, v, floorZ) {
    const fall = Math.max(0, from[2] - floorZ), T = Math.sqrt(2 * fall / G);
    return { T, land: [from[0] + dir[0] * v * T, from[1] + dir[1] * v * T, floorZ], at: t => [from[0] + dir[0] * v * t, from[1] + dir[1] * v * t, from[2] - G * t * t / 2] };
  }
  function jet(F, from, dir, v, d, floorZ, o) {
    o = o || {};
    if (v <= 0.02 || d <= 0) return null;
    const ctx = F.ctx, cam = F.cam, J = jetPath(from, dir, v, floorZ), N = 28;
    const mid = J.at(J.T * 0.5);
    // coherent length: longer for a fatter, slower jet; the rest breaks into drops
    const coh = clamp(o.coherent == null ? 0.55 + 0.35 * Math.exp(-v / 2.2) : o.coherent, 0.2, 1);
    F.push(mid, () => {
      const pts = [];
      for (let i = 0; i <= N; i++) { const q = cam.project(J.at(J.T * i / N)); if (!q.ok) return; pts.push(q); }
      const wpx = i => Math.max(1.6, d * pts[i].s * (1 - 0.15 * i / N));
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const nC = Math.round(N * coh);
      for (let i = 0; i < nC; i++) {                          // a darker rim first, so the stream reads over anything
        const a = pts[i], b = pts[i + 1], w = wpx(i);
        ctx.strokeStyle = 'rgba(30,70,110,.45)'; ctx.lineWidth = w + 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let i = 0; i < nC; i++) {                          // the glassy stream, tapering as it speeds up
        const a = pts[i], b = pts[i + 1], w = wpx(i);
        ctx.strokeStyle = 'rgba(160,212,242,.82)'; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let i = 0; i < nC; i++) {                          // its bright upper edge
        const a = pts[i], b = pts[i + 1], w = wpx(i);
        ctx.strokeStyle = 'rgba(245,252,255,.75)'; ctx.lineWidth = Math.max(0.6, w * 0.28);
        ctx.beginPath(); ctx.moveTo(a.x, a.y - w * 0.22); ctx.lineTo(b.x, b.y - w * 0.22); ctx.stroke();
      }
      // necking and drops, travelling down the arc
      const ph = ((o.phase || 0) * v * 3) % 1;
      const nd = Math.max(3, Math.round((N - nC) * 1.2));
      for (let k = 0; k < nd; k++) {
        const u = coh + (1 - coh) * ((k + ph) / nd);
        if (u > 1) continue;
        const q = cam.project(J.at(J.T * u));
        if (!q.ok) continue;
        const rr = Math.max(1.1, d * 0.95 * q.s * (0.8 + 0.3 * Math.sin(k * 2.3)));
        ctx.fillStyle = 'rgba(30,70,110,.4)'; ctx.beginPath(); ctx.arc(q.x, q.y, rr + 0.7, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(170,218,245,.85)'; ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(250,253,255,.85)'; ctx.beginPath(); ctx.arc(q.x - rr * 0.3, q.y - rr * 0.35, Math.max(0.4, rr * 0.35), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }, o.bias == null ? -0.01 : o.bias);
    return J.land;
  }

  /* ---------------- a clear catch tray and the water it has caught ----------------
     box: [x0, x1, y0, y1]; z0 the tray floor; h its wall height; depth the water in it;
     o.splash: a world point where a stream lands, o.phase animates its rings */
  function tray(F, box, z0, h, depth, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, [x0, x1, y0, y1] = box;
    const P = (x, y, z) => cam.project([x, y, z]);
    // floor and walls: clear acrylic, faint
    R3.box(F, [(x0 + x1) / 2, (y0 + y1) / 2, z0 - 0.002], [x1 - x0, y1 - y0, 0.004], '#9FB8C8', { shadow: false, ambient: 0.6, alpha: 0.35 });
    const dz = clamp(depth, 0, h);
    if (dz > 1e-4) F.push([(x0 + x1) / 2, (y0 + y1) / 2, z0 + dz / 2], () => {
      const c = [P(x0, y0, z0 + dz), P(x1, y0, z0 + dz), P(x1, y1, z0 + dz), P(x0, y1, z0 + dz)];
      const f = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z0 + dz), P(x0, y0, z0 + dz)];
      if (c.some(q => !q.ok) || f.some(q => !q.ok)) return;
      ctx.save();
      ctx.fillStyle = RX.rgba(RX.mix(WATER, '#0A2A48', 0.35), 0.45); polyPath(ctx, f); ctx.fill();
      ctx.fillStyle = RX.rgba(RX.mix(WATER, '#FFFFFF', 0.35), 0.42); polyPath(ctx, c); ctx.fill();
      ctx.strokeStyle = 'rgba(230,246,255,.6)'; ctx.lineWidth = 1; polyPath(ctx, c); ctx.stroke();
      if (o.splash) {
        const s = o.splash;
        for (let k = 0; k < 4; k++) {
          const u = ((o.phase || 0) * 1.6 + k / 4) % 1, rr = 0.004 + u * 0.05;
          const pts = [];
          for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, q = P(s[0] + Math.cos(a) * rr, s[1] + Math.sin(a) * rr, z0 + dz + 0.0005); if (!q.ok) return; pts.push(q); }
          ctx.strokeStyle = 'rgba(235,250,255,' + (0.55 * (1 - u)).toFixed(3) + ')'; ctx.lineWidth = 1; polyPath(ctx, pts); ctx.stroke();
        }
      }
      ctx.restore();
    }, -0.005);
    // the four walls, as glass edges
    F.push([(x0 + x1) / 2, (y0 + y1) / 2, z0 + h / 2], () => {
      const bot = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], top = [P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)];
      if (bot.some(q => !q.ok) || top.some(q => !q.ok)) return;
      ctx.save();
      ctx.fillStyle = 'rgba(190,225,245,.07)';
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; polyPath(ctx, [bot[i], bot[j], top[j], top[i]]); ctx.fill(); }
      ctx.strokeStyle = 'rgba(215,238,255,.55)'; ctx.lineWidth = 1;
      polyPath(ctx, top); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bot[i].x, bot[i].y); ctx.lineTo(top[i].x, top[i].y); ctx.stroke(); }
      ctx.restore();
    }, -0.03);
  }

  /* ---------------- a laboratory tap, and the stream it pours ----------------
     at: the spout's mouth; the supply comes down from above. Q in m³/s; the
     stream narrows as it falls and speeds up (continuity), to `surfaceZ`. */
  function tap(F, at, Q, surfaceZ, o) {
    o = o || {};
    const chrome = '#C9D2DC';
    const top = [at[0] - 0.07, at[1], at[2] + 0.16];
    R3.cylinder(F, [top[0], top[1], top[2] + 0.18], top, 0.009, chrome, { segments: 16, shadow: false, ambient: 0.5 });
    const neck = [];
    for (let i = 0; i <= 10; i++) {                             // the gooseneck, a half turn down to the mouth
      const a = Math.PI * i / 10;
      neck.push([top[0] + 0.035 - 0.035 * Math.cos(a), at[1], top[2] + 0.035 * Math.sin(a) * 1.1]);
    }
    neck.push([at[0], at[1], at[2] + 0.04]); neck.push([at[0], at[1], at[2]]);
    R3.tube(F, neck, 0.0075, chrome, { segments: 12, ambient: 0.5 });
    // the handle: a lever, turned by how open the tap is
    const open = clamp(o.open == null ? (Q > 0 ? 1 : 0) : o.open, 0, 1), ang = -0.2 + open * 1.1;
    R3.cylinder(F, [top[0], top[1], top[2] + 0.07], [top[0] + Math.cos(ang) * 0.055, top[1] + Math.sin(ang) * 0.055, top[2] + 0.075], 0.004, '#B8342F', { segments: 10, shadow: false });
    if (Q <= 0) return;
    const ctx = F.ctx, cam = F.cam, fall = Math.max(0.001, at[2] - surfaceZ), v0 = 0.6;
    F.push([at[0], at[1], (at[2] + surfaceZ) / 2], () => {
      const N = 14, L = [], Rr = [];
      for (let i = 0; i <= N; i++) {
        const z = at[2] - fall * i / N, v = Math.sqrt(v0 * v0 + 2 * G * (at[2] - z)), rw = Math.sqrt(Q / (Math.PI * v));
        const c = cam.project([at[0], at[1], z]), e = cam.project([at[0] + rw, at[1], z]);
        if (!c.ok || !e.ok) return;
        L.push(c); Rr.push(Math.max(0.7, Math.abs(e.x - c.x)));
      }
      ctx.save();
      ctx.beginPath();
      L.forEach((q, i) => i ? ctx.lineTo(q.x - Rr[i], q.y) : ctx.moveTo(q.x - Rr[i], q.y));
      for (let i = L.length - 1; i >= 0; i--) ctx.lineTo(L[i].x + Rr[i], L[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(160,212,240,.55)'; ctx.fill();
      ctx.strokeStyle = 'rgba(240,250,255,.7)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(q.x - Rr[i] * 0.35, q.y) : ctx.moveTo(q.x - Rr[i] * 0.35, q.y)); ctx.stroke();
      ctx.restore();
    }, -0.015);
  }

  /* ---------------- a float flow-meter (rotameter) ----------------
     A tapered glass tube on a scale plate; the float rides at the height the
     flow holds it, so the reading is where its top edge sits. */
  function rotaTex(Qmax, unit) {
    const key = 'rota' + Qmax + unit;
    if (cache[key]) return cache[key];
    const c = canvas(90, 360), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 90, 0);
    gr.addColorStop(0, '#E4E7EC'); gr.addColorStop(1, '#C9CED6');
    x.fillStyle = gr; x.fillRect(0, 0, 90, 360);
    x.strokeStyle = '#1C2230'; x.fillStyle = '#1C2230'; x.font = '700 17px "IBM Plex Mono",monospace'; x.textBaseline = 'middle';
    const y0 = 330, y1 = 30;
    for (let k = 0; k <= Qmax * 10; k++) {
      const q = k / 10, y = y0 + (y1 - y0) * q / Qmax, big = k % 5 === 0;
      x.lineWidth = big ? 2.5 : 1.2; x.beginPath(); x.moveTo(big ? 30 : 42, y); x.lineTo(62, y); x.stroke();
      if (big) { x.textAlign = 'right'; x.fillText(String(q), 27, y); }
    }
    x.font = '700 13px "IBM Plex Mono",monospace'; x.textAlign = 'center'; x.fillText(unit, 45, 350);
    x.fillText('FLOW', 45, 12);
    return (cache[key] = c);
  }
  function rotameter(F, at, Q, Qmax, o) {
    o = o || {};
    const Hh = o.height || 0.20, w = 0.05, f = clamp(Q / Qmax, 0, 1);
    const n = o.facing || [0, -1, 0];
    const plateC = [at[0], at[1] + 0.006, at[2] + Hh / 2];
    R3.box(F, [plateC[0], plateC[1] + 0.004, plateC[2]], [w + 0.012, 0.006, Hh + 0.04], '#2A3140', { shadow: false, ambient: 0.4 });
    R3.texPlane(F, plateC, [w / 2, 0, 0], [0, 0, -Hh / 2], rotaTex(Qmax, o.unit || 'L/min'), { bias: -0.002 });
    // the glass tube and its fittings
    const tb = [at[0] + 0.008, at[1] - 0.012, at[2] + 0.012], tt = [tb[0], tb[1], at[2] + Hh - 0.012];
    column(F, tb, 0.0055, tt[2] - tb[2], 0, { cap: false, wall: 0.0012 });
    R3.cylinder(F, sub(tb, [0, 0, 0.012]), tb, 0.008, '#9AA4B2', { segments: 14, shadow: false, ambient: 0.5 });
    R3.cylinder(F, tt, add(tt, [0, 0, 0.012]), 0.008, '#9AA4B2', { segments: 14, shadow: false, ambient: 0.5 });
    // the float: a stainless bob with a red top whose edge sits at the reading on the scale
    // (the scale runs from image row 330 at no flow to row 30 at Qmax, over 360 rows of height Hh)
    const zTop = at[2] + Hh * (30 + 300 * f) / 360;
    R3.cylinder(F, [tb[0], tb[1], zTop - 0.008], [tb[0], tb[1], zTop], 0.0045, '#C83A3A', { segments: 14, shadow: false });
    R3.sphere(F, [tb[0], tb[1], zTop - 0.011], 0.0045, '#B8C0CC', { shadow: false });
  }

  /* ---------------- an ultrasonic level sensor on its arm ----------------
     Two transducers facing down on a small blue board: one sends, one hears the echo.
     Returns the point the ping leaves from, so the scene can draw the ping. */
  function sonar(F, at, o) {
    o = o || {};
    R3.box(F, [at[0], at[1], at[2] + 0.004], [0.045, 0.02, 0.0016], '#1F4E9C', { shadow: false, ambient: 0.45 });
    for (const s of [-1, 1]) {
      const c = [at[0] + s * 0.013, at[1], at[2]];
      R3.cylinder(F, [c[0], c[1], c[2] + 0.003], [c[0], c[1], c[2] - 0.012], 0.008, '#C9CED6', { segments: 18, shadow: false, ambient: 0.5 });
      R3.cylinder(F, [c[0], c[1], c[2] - 0.012], [c[0], c[1], c[2] - 0.0125], 0.0068, '#2A2F38', { segments: 18, shadow: false });
    }
    if (o.arm) R3.cylinder(F, [at[0], at[1], at[2] + 0.005], o.arm, 0.004, '#8C96A6', { segments: 10, shadow: false });
    return [at[0], at[1], at[2] - 0.013];
  }

  /* ---------------- a stopwatch lying on the bench ---------------- */
  function watchTex(text, running) {
    const c = canvas(220, 120), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 120);
    gr.addColorStop(0, '#B7C2A0'); gr.addColorStop(1, '#9EAA86');
    x.fillStyle = '#20252E'; x.fillRect(0, 0, 220, 120);
    x.fillStyle = gr; x.fillRect(14, 22, 192, 78);
    x.fillStyle = '#1C2418'; x.font = '700 50px "IBM Plex Mono",monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 110, 63);
    x.font = '700 12px "IBM Plex Mono",monospace'; x.fillStyle = running ? '#7CF0B0' : '#8A93A8'; x.fillText(running ? '● RUN' : 'STOP', 110, 12);
    return c;
  }
  function stopwatch(F, at, text, o) {
    o = o || {};
    const w = 0.07, d = 0.055, h = 0.016;
    R3.box(F, [at[0], at[1], at[2] + h / 2], [w, d, h], '#D8B23A', { shadow: true, ambient: 0.45 });
    R3.cylinder(F, [at[0] - 0.02, at[1] + d / 2, at[2] + h * 0.6], [at[0] - 0.02, at[1] + d / 2 + 0.008, at[2] + h * 0.6], 0.004, '#20252E', { segments: 10, shadow: false });
    R3.cylinder(F, [at[0] + 0.02, at[1] + d / 2, at[2] + h * 0.6], [at[0] + 0.02, at[1] + d / 2 + 0.008, at[2] + h * 0.6], 0.004, '#20252E', { segments: 10, shadow: false });
    R3.texPlane(F, [at[0], at[1], at[2] + h + 0.0005], [w * 0.44, 0, 0], [0, d * 0.4, 0], watchTex(text, !!o.running), { bias: -0.003, grid: 2 });
  }

  /* the lab's back wall: dark slate tiles, so the bench stands in a room and not in space */
  function tileTex() {
    if (cache.tiles) return cache.tiles;
    const c = canvas(512, 256), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#131A26'); gr.addColorStop(1, '#1C2533');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 256);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) {
      const sh = ((i * 7 + j * 13) % 9) / 9;
      x.fillStyle = 'rgba(255,255,255,' + (0.012 + sh * 0.02).toFixed(3) + ')'; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30);
    }
    x.strokeStyle = 'rgba(70,86,110,.55)'; x.lineWidth = 1.5;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 256); x.stroke(); }
    for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * 32); x.lineTo(512, j * 32); x.stroke(); }
    return (cache.tiles = c);
  }
  function wall(F, x0, x1, y, z0, z1) {
    R3.texPlane(F, [(x0 + x1) / 2, y, (z0 + z1) / 2], [(x1 - x0) / 2, 0, 0], [0, 0, -(z1 - z0) / 2], tileTex(), { bias: F.GROUND + 2, grid: 4 });
  }

  /* a flat quad from its centre and two half-edges, lit like everything else — or, with
     o.emissive, its own colour (a lit window) */
  function quad(F, c, e1, e2, colour, o) {
    o = o || {};
    const n = R3.norm(R3.cross(e1, e2)), col = o.emissive ? colour : F.shade(colour, n, o);
    F.push(c, () => {
      const q = [add(add(c, e1), e2), add(sub(c, e1), e2), sub(sub(c, e1), e2), sub(add(c, e1), e2)].map(p => F.cam.project(p));
      if (q.some(x => !x.ok)) return;
      F.ctx.save();
      if (o.glow) { F.ctx.shadowColor = colour; F.ctx.shadowBlur = o.glow; }
      F.ctx.fillStyle = col; polyPath(F.ctx, q); F.ctx.fill();
      if (o.edge) { F.ctx.shadowBlur = 0; F.ctx.strokeStyle = o.edge; F.ctx.lineWidth = 1; F.ctx.stroke(); }
      F.ctx.restore();
    }, o.bias);
  }

  /* ---------------- the town: a water tower and the houses it feeds ----------------
     All in metres at true scale; the scene decides how far away they stand. */
  function cone(F, base, r, hgt, colour, o) {
    o = o || {};
    const n = o.segments || 32, apex = [base[0], base[1], base[2] + hgt];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
      const p0 = [base[0] + r * Math.cos(a0), base[1] + r * Math.sin(a0), base[2]], p1 = [base[0] + r * Math.cos(a1), base[1] + r * Math.sin(a1), base[2]];
      const am = (a0 + a1) / 2, sl = Math.atan2(r, hgt);
      const nrm = [Math.cos(am) * Math.cos(sl), Math.sin(am) * Math.cos(sl), Math.sin(sl)];
      const colr = F.shade(colour, nrm, o);
      F.push([(p0[0] + p1[0] + apex[0]) / 3, (p0[1] + p1[1] + apex[1]) / 3, (p0[2] + p1[2] + apex[2]) / 3], () => {
        const a = F.cam.project(apex), b = F.cam.project(p0), c = F.cam.project(p1);
        if (!a.ok || !b.ok || !c.ok) return;
        F.ctx.fillStyle = colr; F.ctx.beginPath(); F.ctx.moveTo(a.x, a.y); F.ctx.lineTo(b.x, b.y); F.ctx.lineTo(c.x, c.y); F.ctx.closePath(); F.ctx.fill();
        F.ctx.strokeStyle = colr; F.ctx.lineWidth = 0.6; F.ctx.stroke();
      }, o.bias);
    }
  }
  /* the tower: a tapered concrete shaft, a steel tank with a railing and a low cone roof,
     a ladder, and a level board on the tank whose marker stands at `frac` full */
  function tower(F, base, o) {
    o = o || {};
    const shaftH = o.shaftH || 28, tankR = o.tankR || 6, tankH = o.tankH || 10, frac = clamp(o.frac == null ? 1 : o.frac, 0, 1);
    const concrete = '#A8A49C', steel = o.steel || '#C9D0D8';
    // the shaft, widening toward the ground
    const segs = 6;
    for (let k = 0; k < segs; k++) {
      const z0 = shaftH * k / segs, z1 = shaftH * (k + 1) / segs, r = 2.6 - 0.9 * (k + 0.5) / segs;
      R3.cylinder(F, [base[0], base[1], base[2] + z0], [base[0], base[1], base[2] + z1], r, concrete, { segments: 28, shadow: false, ambient: 0.35 });
    }
    // the tank: a flared bowl under a cylinder
    const zT = base[2] + shaftH;
    cone(F, [base[0], base[1], zT + 3], tankR, -3, steel, { segments: 36, ambient: 0.35 });
    R3.cylinder(F, [base[0], base[1], zT + 3], [base[0], base[1], zT + 3 + tankH], tankR, steel, { segments: 40, shadow: false, ambient: 0.38 });
    cone(F, [base[0], base[1], zT + 3 + tankH], tankR + 0.3, 1.6, '#8E969F', { segments: 36, ambient: 0.35 });
    // the railing round the top, and a ladder up the shaft
    const rz = zT + 3 + tankH + 0.05;
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * TAU;
      R3.cylinder(F, [base[0] + Math.cos(a) * (tankR + 0.25), base[1] + Math.sin(a) * (tankR + 0.25), rz], [base[0] + Math.cos(a) * (tankR + 0.25), base[1] + Math.sin(a) * (tankR + 0.25), rz + 1.1], 0.03, '#5E6670', { segments: 4, shadow: false, caps: false });
    }
    const ladX = o.ladder || -1;
    for (const s of [-0.3, 0.3]) R3.cylinder(F, [base[0] + s, base[1] + ladX * 2.2, base[2]], [base[0] + s, base[1] + ladX * 1.75, zT + 3], 0.04, '#5E6670', { segments: 5, shadow: false, caps: false });
    // the level board: a tall white scale on the tank's face, the marker at the level
    const fn = o.facing || [0, -1, 0], bx = base[0] + fn[0] * (tankR + 0.05), by = base[1] + fn[1] * (tankR + 0.05);
    const z0 = zT + 3.4, z1 = zT + 3 + tankH - 0.4;
    R3.box(F, [bx, by, (z0 + z1) / 2], [2.2, 0.12, z1 - z0], '#F2F4F6', { shadow: false, ambient: 0.55, axes: [[-fn[1], fn[0], 0], [fn[0], fn[1], 0], [0, 0, 1]] });
    const zm = z0 + (z1 - z0) * frac;
    R3.box(F, [bx + fn[0] * 0.12, by + fn[1] * 0.12, zm], [2.8, 0.14, 0.55], o.markColour || '#E0503A', { shadow: false, ambient: 0.6, axes: [[-fn[1], fn[0], 0], [fn[0], fn[1], 0], [0, 0, 1]] });
    return { top: [base[0], base[1], zT + 3 + tankH + 1.6], board: [bx, by, (z0 + z1) / 2], mark: [bx, by, zm] };
  }
  /* a house: walls, a pitched roof with its gables, windows (lit after dusk), a door */
  function house(F, c, w, d, h, o) {
    o = o || {};
    const wall = o.wall || '#D8CDBA', roof = o.roof || '#6E3A30', lit = clamp(o.lit || 0, 0, 1), rot = o.rot || 0;
    const ax = [[Math.cos(rot), Math.sin(rot), 0], [-Math.sin(rot), Math.cos(rot), 0], [0, 0, 1]];
    const at = (u, v, z) => [c[0] + ax[0][0] * u + ax[1][0] * v, c[1] + ax[0][1] * u + ax[1][1] * v, c[2] + z];
    R3.box(F, [c[0], c[1], c[2] + h / 2], [w, d, h], wall, { shadow: false, ambient: 0.42, axes: ax });
    const rh = w * 0.32;
    // roof planes, slightly overhanging, lit by which way they face
    const e1 = [ax[1][0] * (d / 2 + 0.3), ax[1][1] * (d / 2 + 0.3), 0];
    for (const s of [-1, 1]) {
      const ridge = at(0, 0, h + rh), eave = at(s * (w / 2 + 0.3), 0, h - 0.15);
      const mid = [(ridge[0] + eave[0]) / 2, (ridge[1] + eave[1]) / 2, (ridge[2] + eave[2]) / 2];
      const e2 = [(ridge[0] - eave[0]) / 2, (ridge[1] - eave[1]) / 2, (ridge[2] - eave[2]) / 2];
      quad(F, mid, s > 0 ? e1 : scale(e1, -1), e2, roof, { ambient: 0.4 });
    }
    // gables
    for (const s of [-1, 1]) {
      const p0 = at(-w / 2, s * d / 2, h), p1 = at(w / 2, s * d / 2, h), p2 = at(0, s * d / 2, h + rh);
      const nrm = [ax[1][0] * s, ax[1][1] * s, 0], colr = F.shade(wall, nrm, { ambient: 0.42 });
      F.push([(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3, (p0[2] + p1[2] + p2[2]) / 3], () => {
        const a = F.cam.project(p0), b = F.cam.project(p1), q = F.cam.project(p2);
        if (!a.ok || !b.ok || !q.ok) return;
        F.ctx.fillStyle = colr; F.ctx.beginPath(); F.ctx.moveTo(a.x, a.y); F.ctx.lineTo(b.x, b.y); F.ctx.lineTo(q.x, q.y); F.ctx.closePath(); F.ctx.fill();
      });
    }
    // windows and a door on the two long faces
    const winCol = RX.mix('#2A3444', '#FFD27A', lit);
    for (const s of [-1, 1]) {
      const nv = s * (d / 2 + 0.03), ws = o.windows || 2;
      const eu = [ax[0][0] * 0.42 * s, ax[0][1] * 0.42 * s, 0];
      for (let k = 0; k < ws; k++) {
        const u = -w / 2 + w * (k + 0.5) / ws;
        quad(F, at(u, nv, h * 0.58), eu, [0, 0, 0.48], winCol, lit > 0.05 ? { emissive: true, glow: 8 * lit, edge: 'rgba(30,24,20,.8)' } : { ambient: 0.5, edge: 'rgba(30,24,20,.8)' });
      }
      if (s < 0) quad(F, at(w * 0.3, nv, 1.0), eu, [0, 0, 1.0], '#5A3A28', { ambient: 0.5 });
    }
  }

  window.HYDRO = { column, drawScale, orifice, jet, jetPath, tray, tap, rotameter, sonar, stopwatch, tower, house, cone, quad, wall, WATER };
})();
