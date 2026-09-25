/* ============================================================
   MEAS — the measurement bench.
   The apparatus of a school laboratory drawn as the real things: a dark
   epoxy bench top; a ceramic-topped hot plate with its knobs and hot-top
   light; glass and steel beakers with the liquid as a volume, boiling
   bubbles and steam; tongs, a heat-proof mat and heat gloves; reagent and
   wash bottles with their hazard labels; a magnetic stirrer's spinning bar;
   a dropping funnel with its stopcock; an ice bath; a thermometer probe; a
   top-loading balance with its live display; graduated cylinders with the
   scale printed on the glass and a meniscus that climbs the wall; an
   overflow can; mineral specimens with their real habits and lustres; a
   drop tower with its release, two light gates and a sand box; and the
   thermal-camera palette, which paints what an infrared camera would see
   (shiny metal reads cold — its emissivity is low).
   Every function takes world metres (Z up, the bench top at z = 0) and
   draws through an R3 Frame, so depth, light and the camera are the
   scene's own. The 2D plates (the skin under a fingertip, the magnifier
   on a meniscus) draw straight onto a canvas.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX, BENCH = window.BENCH;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale, norm, cross } = R3;
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  const mix = RX.mix, rgba = RX.rgba;

  /* ---------------- the thermal camera ----------------
     An infrared camera sees radiance, not temperature: a surface of
     emissivity ε at T shows as σT⁴·ε + σT_room⁴·(1−ε) — the reflected room.
     Glass (0.92) and ceramic read almost true; polished steel (0.16) reads
     nearly as cold as the room. The palette is the camera's own "iron". */
  const IRON = [[0, '#05030E'], [0.12, '#1E0A4A'], [0.28, '#5A0E82'], [0.44, '#A8196E'], [0.58, '#E0452C'], [0.72, '#F7871A'], [0.86, '#FDD13A'], [1, '#FFFBE6']];
  function iron(f) {
    f = clamp(f, 0, 1);
    for (let i = 0; i < IRON.length - 1; i++) if (f <= IRON[i + 1][0]) return mix(IRON[i][1], IRON[i + 1][1], (f - IRON[i][0]) / (IRON[i + 1][0] - IRON[i][0]));
    return IRON[IRON.length - 1][1];
  }
  function apparent(T, eps, Troom) {
    const a = T + 273.15, r = (Troom == null ? 20 : Troom) + 273.15;
    return Math.pow(eps * a * a * a * a + (1 - eps) * r * r * r * r, 0.25) - 273.15;
  }
  /* ir: null for the eye's view, or { lo, hi } — the camera's span. Returns the colour to paint. */
  function irc(ir, T, eps, colour) {
    if (!ir) return colour;
    return iron((apparent(T, eps == null ? 0.92 : eps, ir.room) - ir.lo) / (ir.hi - ir.lo));
  }
  function irScale(ctx, x, y, w, h, lo, hi) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y + h, 0, y);
    for (let i = 0; i <= 10; i++) g.addColorStop(i / 10, iron(i / 10));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(230,236,250,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#E8EEF8'; ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(hi.toFixed(0) + ' °C', x + w + 4, y + 4); ctx.fillText(lo.toFixed(0) + ' °C', x + w + 4, y + h - 4);
    ctx.restore();
  }

  /* ---------------- surfaces ---------------- */
  function epoxyTex(tone, seed) {
    const key = 'ep' + tone + seed;
    if (cache[key]) return cache[key];
    const c = canvas(512, 256), x = c.getContext('2d'), r = rng(seed || 3);
    x.fillStyle = tone; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 2600; i++) {                                  // the fine speckle of an epoxy-resin top
      const v = r(); x.fillStyle = v < 0.5 ? 'rgba(255,255,255,' + (0.02 + r() * 0.05).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.04 + r() * 0.08).toFixed(3) + ')';
      x.fillRect(r() * 512, r() * 256, 1 + r() * 1.6, 1 + r() * 1.6);
    }
    const g = x.createLinearGradient(0, 0, 512, 256);                  // a soft sheen from the room lights
    g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.03)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    return (cache[key] = c);
  }
  /* the bench: a dark epoxy top with a rolled front edge on a pale laminate cabinet */
  function bench(F, x0, x1, y0, y1, o) {
    o = o || {};
    const th = 0.03, tone = o.tone || '#2A2E35';
    BENCH.texBox(F, [(x0 + x1) / 2, (y0 + y1) / 2, -th / 2], [x1 - x0, y1 - y0, th], epoxyTex(tone, o.seed || 3), { bias: F.GROUND, tiles: 3, ambient: 0.55 });
    if (o.cabinet !== false) {
      const ch = o.cabinetH || 0.55;
      R3.box(F, [(x0 + x1) / 2, (y0 + y1) / 2 + 0.03, -th - ch / 2], [x1 - x0 - 0.04, y1 - y0 - 0.06, ch], o.cabinet || '#B9C0C8', { shadow: false, ambient: 0.45, bias: F.GROUND });
    }
  }
  function tileWall(F, x0, x1, y, z0, z1) {
    const key = 'tw';
    if (!cache[key]) {
      const c = canvas(256, 256), x = c.getContext('2d');
      x.fillStyle = '#8FA3A8'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#6E8288'; x.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
      const g = x.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.06)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      cache[key] = c;
    }
    const w = x1 - x0, h = z1 - z0, nx = Math.max(1, Math.round(w / 0.6)), nz = Math.max(1, Math.round(h / 0.6));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const cx = x0 + (i + 0.5) * w / nx, cz = z0 + (j + 0.5) * h / nz;
      R3.texPlane(F, [cx, y, cz], [w / nx / 2, 0, 0], [0, 0, -h / nz / 2], cache[key], { bias: F.GROUND + 2, grid: 2 });
    }
  }

  /* a steel rail on the wall with hooks */
  function rail(F, x0, x1, y, z, o) {
    R3.cylinder(F, [x0, y - 0.015, z], [x1, y - 0.015, z], 0.006, irc(o && o.ir, 21, 0.2, '#C9D0D8'), { segments: 10, shadow: false, ambient: 0.5 });
    [x0, x1].forEach(x => R3.box(F, [x, y - 0.007, z], [0.012, 0.016, 0.03], irc(o && o.ir, 21, 0.9, '#8A939E'), { shadow: false }));
  }

  /* ---------------- polygons: one lit face at a time ---------------- */
  function face(F, pts, colour, o) {
    o = o || {};
    const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    const c = pts.reduce((u, p) => add(u, scale(p, 1 / pts.length)), [0, 0, 0]);
    const col = o.flat ? colour : F.shade(colour, n, o);
    F.push(c, () => {
      const q = pts.map(p => F.cam.project(p));
      if (q.some(v => !v.ok)) return;
      const ctx = F.ctx;
      ctx.save();
      if (o.alpha != null) ctx.globalAlpha = o.alpha;
      ctx.fillStyle = col; ctx.beginPath(); q.forEach((v, k) => k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = o.edge || col; ctx.lineWidth = o.edge ? 0.8 : 0.6; ctx.stroke();
      if (o.after) o.after(ctx, q);
      ctx.restore();
    }, o.bias);
  }
  function ringPts(cam, c, r, n, a0, a1) {
    const out = [], A0 = a0 == null ? 0 : a0, A1 = a1 == null ? TAU : a1;
    for (let i = 0; i <= n; i++) { const a = A0 + (A1 - A0) * i / n, q = cam.project([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]]); if (!q.ok) return null; out.push(q); }
    return out;
  }
  function hull2(P) {
    const pts = P.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    hi.pop(); lo.pop(); return lo.concat(hi);
  }
  function path(ctx, P) { ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); }

  /* ---------------- the hot plate ----------------
     at: the centre of its top plate at bench level; o.top °C, o.set knob 0..1, o.on, o.hot (the
     hot-top warning), o.stir (0..1, for a stirrer), o.ir. The front, with its knobs, faces −y. */
  function hotplate(F, at, o) {
    o = o || {};
    const W = o.w || 0.20, D = o.d || 0.28, Hb = 0.095, top = o.topSize || 0.18;
    const cx = at[0], cy = at[1], ir = o.ir, T = o.top == null ? 20 : o.top;
    const body = irc(ir, (T - 20) * 0.35 + 20, 0.9, o.body || '#DCE1E6');
    // the body: a box with a sloped front panel carrying the controls
    R3.box(F, [cx, cy + 0.02, Hb / 2], [W, D - 0.04, Hb], body, { ambient: 0.5, shadowK: 0.8 });
    const fy = cy - D / 2 + 0.02, pz0 = 0.012, pz1 = Hb - 0.01;
    face(F, [[cx - W / 2, fy - 0.035, pz0], [cx + W / 2, fy - 0.035, pz0], [cx + W / 2, fy, pz1], [cx - W / 2, fy, pz1]], irc(ir, 22, 0.9, o.panel || '#2F3744'), { ambient: 0.55 });
    face(F, [[cx - W / 2, fy - 0.035, 0], [cx + W / 2, fy - 0.035, 0], [cx + W / 2, fy - 0.035, pz0], [cx - W / 2, fy - 0.035, pz0]], body, { ambient: 0.5 });
    // the ceramic top in its steel frame
    R3.box(F, [cx, cy + 0.01, Hb + 0.003], [top + 0.012, top + 0.012, 0.006], irc(ir, (T - 20) * 0.8 + 20, 0.3, '#AEB6C0'), { shadow: false, ambient: 0.5 });
    const topCol = irc(ir, T, 0.9, '#F1F1EC');
    face(F, [[cx - top / 2, cy + 0.01 - top / 2, Hb + 0.0065], [cx + top / 2, cy + 0.01 - top / 2, Hb + 0.0065], [cx + top / 2, cy + 0.01 + top / 2, Hb + 0.0065], [cx - top / 2, cy + 0.01 + top / 2, Hb + 0.0065]], topCol,
      { ambient: 0.62, after: ir ? null : (ctx, q) => {               // the printed ring that centres a vessel
        const c = F.cam.project([cx, cy + 0.01, Hb + 0.0066]), e = F.cam.project([cx + top * 0.36, cy + 0.01, Hb + 0.0066]), f2 = F.cam.project([cx, cy + 0.01 + top * 0.36, Hb + 0.0066]);
        if (!c.ok || !e.ok || !f2.ok) return;
        ctx.strokeStyle = 'rgba(120,128,138,.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(c.x, c.y, Math.hypot(e.x - c.x, e.y - c.y), Math.hypot(f2.x - c.x, f2.y - c.y), Math.atan2(e.y - c.y, e.x - c.x), 0, TAU); ctx.stroke();
      } });
    // knobs on the sloped panel: heat (left) and stir (right), each with its pointer
    const knob = (kx, frac, colour) => {
      const p0 = [kx, fy - 0.0175, (pz0 + pz1) / 2];
      const axisOut = norm([0, -(pz1 - pz0), 0.035]), u = norm([0, 0.035, pz1 - pz0]), rgt = [1, 0, 0];   // out of the panel; up along it
      R3.cylinder(F, p0, add(p0, scale(axisOut, 0.016)), 0.017, irc(ir, 22, 0.9, colour), { segments: 22, shadow: false, ambient: 0.45 });
      const tip = add(p0, scale(axisOut, 0.0165));
      F.push(tip, () => {
        const c = F.cam.project(tip); if (!c.ok) return;
        const a = (-0.75 + frac * 1.5) * Math.PI;
        const q = F.cam.project(add(tip, add(scale(u, Math.cos(a) * 0.014), scale(rgt, Math.sin(a) * 0.014))));
        if (!q.ok) return;
        F.ctx.strokeStyle = '#FFFFFF'; F.ctx.lineWidth = 2; F.ctx.lineCap = 'round'; F.ctx.beginPath(); F.ctx.moveTo(c.x, c.y); F.ctx.lineTo(q.x, q.y); F.ctx.stroke();
      }, -0.01);
      return tip;
    };
    const kHeat = knob(cx - W * 0.22, o.set == null ? 0 : o.set, '#1E232C');
    knob(cx + W * 0.22, o.stir == null ? 0 : o.stir, '#1E232C');
    // lights: power (green) and the hot-top warning (red), which stays lit while the top is above 50 °C
    const lamp = (lx, on, col) => { const p = [lx, fy - 0.022, pz1 - 0.012]; R3.sphere(F, p, 0.0045, on ? col : '#3A3F48', { shadow: false, vivid: on, bias: -0.01 }); return p; };
    lamp(cx - 0.012, !!o.on, '#56F08A');
    const warn = lamp(cx + 0.012, !!o.hot, '#FF4A3A');
    if (o.hot && !ir) F.push(warn, () => { const q = F.cam.project(warn); if (!q.ok) return; const g = F.ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 14); g.addColorStop(0, 'rgba(255,90,70,.55)'); g.addColorStop(1, 'rgba(255,90,70,0)'); F.ctx.fillStyle = g; F.ctx.fillRect(q.x - 14, q.y - 14, 28, 28); }, -0.02);
    return { topZ: Hb + 0.0065, knob: kHeat, warn, centre: [cx, cy + 0.01, Hb + 0.0065] };
  }

  /* ---------------- a beaker ----------------
     base: centre of its floor; r: outer radius; H: height; level: liquid height; o.steel (opaque
     brushed steel), o.tint, o.boil 0..1, o.bubbles, o.T (for the camera), o.ir, o.marks (mL per
     cm of height, to print the graduations), o.vortex (a stirred dimple), o.swirl (schlieren). */
  function beaker(F, base, r, H, level, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, ir = o.ir, T = o.T == null ? 20 : o.T;
    const lv = clamp(level, 0, H - 0.004), wall = 0.0018, rin = r - wall;
    const tint = o.tint || '#CFE8F6', steel = !!o.steel;
    const liqCol = irc(ir, T, 0.96, tint);
    // the liquid: a volume inside the glass (drawn only through glass)
    if (lv > 1e-4 && !steel) F.push([base[0], base[1], base[2] + lv / 2], () => {
      const b = ringPts(cam, [base[0], base[1], base[2] + 0.003], rin, 40), t = ringPts(cam, [base[0], base[1], base[2] + lv], rin, 40);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
      Hh.forEach(q => { y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      ctx.save();
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, rgba(mix(liqCol, '#FFFFFF', ir ? 0 : 0.2), ir ? 0.95 : 0.30)); gr.addColorStop(1, rgba(mix(liqCol, '#0A2A48', ir ? 0 : 0.35), ir ? 0.95 : 0.46));
      ctx.fillStyle = gr; path(ctx, Hh); ctx.fill(); ctx.clip();
      if (!ir) {
        const hz = ctx.createLinearGradient(x0, 0, x1, 0);
        hz.addColorStop(0, 'rgba(8,30,56,.22)'); hz.addColorStop(0.35, 'rgba(210,240,255,.12)'); hz.addColorStop(0.6, 'rgba(230,248,255,.16)'); hz.addColorStop(1, 'rgba(8,30,56,.24)');
        ctx.fillStyle = hz; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        if (o.swirl) {                                            // schlieren: where two liquids of different density mix
          const ph = o.phase || 0;
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 * o.swirl).toFixed(3) + ')'; ctx.lineWidth = 1.2;
          for (let k = 0; k < 7; k++) {
            ctx.beginPath();
            for (let i = 0; i <= 24; i++) { const u = i / 24, xx = x0 + (x1 - x0) * (0.15 + 0.7 * u), yy = y0 + (y1 - y0) * (0.2 + 0.1 * k) + Math.sin(u * 9 + ph * 2.3 + k * 1.7) * 4 + Math.sin(u * 23 + ph * 5 + k) * 1.5; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
            ctx.stroke();
          }
        }
        if (o.bubbles) {                                          // boiling: vapour bubbles born on the hot floor, growing as they rise
          const n = Math.round(40 * o.bubbles), ph = o.phase || 0;
          for (let k = 0; k < n; k++) {
            const s = (k * 0.6180339 + 0.13) % 1, a = s * TAU, rr = rin * Math.sqrt((k * 0.3819 + 0.29) % 1) * 0.92;
            const u = ((ph * (0.9 + 0.5 * ((k * 0.7) % 1)) + s) % 1);
            const p = cam.project([base[0] + rr * Math.cos(a), base[1] + rr * Math.sin(a), base[2] + 0.004 + u * (lv - 0.006)]);
            if (!p.ok) continue;
            const rad = (0.6 + 2.6 * u) * p.s * 0.0009 * 400 / 400;
            ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.8; ctx.fillStyle = 'rgba(255,255,255,.12)';
            ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.8, rad), 0, TAU); ctx.fill(); ctx.stroke();
          }
        }
      }
      ctx.restore();
      // the free surface, lit; a bright meniscus line where it meets the glass
      const wob = o.boil ? 1.2 * o.boil : 0, ph = o.phase || 0;
      const ts = t.map((q, i) => ({ x: q.x, y: q.y + (wob ? Math.sin(i / t.length * TAU * 4 + ph * 11) * wob : 0) }));
      ctx.save();
      ctx.fillStyle = rgba(mix(liqCol, '#FFFFFF', ir ? 0 : 0.45), ir ? 1 : 0.5); path(ctx, ts); ctx.fill();
      if (o.vortex && !ir) {                                       // a stirred liquid dips in the middle
        const c = cam.project([base[0], base[1], base[2] + lv]);
        const rx = (Math.max(...ts.map(q => q.x)) - Math.min(...ts.map(q => q.x))) / 2, ry = (Math.max(...ts.map(q => q.y)) - Math.min(...ts.map(q => q.y))) / 2;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx * 0.5);
        g.addColorStop(0, 'rgba(20,40,60,' + (0.35 * o.vortex).toFixed(3) + ')'); g.addColorStop(1, 'rgba(20,40,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx * 0.5, ry * 0.5, 0, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = ir ? 'rgba(255,255,255,.3)' : 'rgba(240,250,255,.9)'; ctx.lineWidth = 1.3; path(ctx, ts); ctx.stroke();
      ctx.restore();
    }, -0.02);
    if (steel) {
      // brushed steel: an opaque body, lit; the liquid seen only over the rim
      R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, irc(ir, T, 0.16, '#B7BEC7'), { segments: 36, caps: false, ambient: 0.42, shadowK: 0.7 });
      R3.cylinder(F, [base[0], base[1], base[2] + H - 0.002], [base[0], base[1], base[2] + H + 0.001], r + 0.0022, irc(ir, T, 0.16, '#D6DCE3'), { segments: 36, inner: r - 0.001, shadow: false, ambient: 0.5 });
      if (lv > 1e-4) F.push([base[0], base[1], base[2] + lv], () => {
        const t = ringPts(cam, [base[0], base[1], base[2] + lv], rin, 36); if (!t) return;
        ctx.save(); ctx.fillStyle = rgba(mix(liqCol, '#1A3050', ir ? 0 : 0.3), 0.9); path(ctx, t); ctx.fill(); ctx.restore();
      }, 0.01);
      return { rimZ: base[2] + H };
    }
    // the glass: nearly clear, the bright streaks a cylinder throws at its silhouette, the rolled rim and the spout
    F.push([base[0], base[1], base[2] + H / 2], () => {
      const b = ringPts(cam, base, r, 44), t = ringPts(cam, [base[0], base[1], base[2] + H], r, 44);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
      Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); });
      ctx.save();
      path(ctx, Hh);
      ctx.fillStyle = ir ? irc(ir, T, 0.92, '#000') : 'rgba(200,228,245,.07)';
      if (ir) { ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1; } else ctx.fill();
      ctx.clip();
      if (!ir) {
        const gr = ctx.createLinearGradient(x0, 0, x1, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.07, 'rgba(255,255,255,.34)'); gr.addColorStop(0.13, 'rgba(255,255,255,.04)');
        gr.addColorStop(0.8, 'rgba(255,255,255,.02)'); gr.addColorStop(0.9, 'rgba(255,255,255,.2)'); gr.addColorStop(0.97, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, 4000);
      }
      ctx.restore();
      ctx.strokeStyle = ir ? 'rgba(255,255,255,.25)' : 'rgba(215,238,255,.55)'; ctx.lineWidth = 1; path(ctx, Hh); ctx.stroke();
      ctx.strokeStyle = ir ? 'rgba(255,255,255,.35)' : 'rgba(240,250,255,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); t.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      // the spout: a small lip pulled out of the rim, on the left
      const sp = cam.project([base[0] - r - 0.006, base[1], base[2] + H + 0.002]), s0 = cam.project([base[0] - r * 0.92, base[1] - r * 0.38, base[2] + H]), s1 = cam.project([base[0] - r * 0.92, base[1] + r * 0.38, base[2] + H]);
      if (sp.ok && s0.ok && s1.ok) { ctx.strokeStyle = ir ? 'rgba(255,255,255,.3)' : 'rgba(240,250,255,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.quadraticCurveTo(sp.x, sp.y, s1.x, s1.y); ctx.stroke(); }
      // printed graduations in white enamel, on the side toward the camera
      if (o.marks && !ir) {
        const e = cam.eye, ang = Math.atan2(e[1] - base[1], e[0] - base[0]) + 0.5;
        const nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny, ty = nx;
        ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle';
        for (let mL = 50; mL <= o.marks.max; mL += 50) {
          const z = mL / o.marks.perM;
          if (z > H - 0.004) break;
          const p0 = [base[0] + nx * r, base[1] + ny * r, base[2] + z], p1 = [p0[0] + tx * r * 0.45, p0[1] + ty * r * 0.45, p0[2]];
          const a = cam.project(p0), bq = cam.project(p1); if (!a.ok || !bq.ok) continue;
          ctx.strokeStyle = 'rgba(250,252,255,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bq.x, bq.y); ctx.stroke();
          ctx.fillStyle = 'rgba(250,252,255,.92)'; ctx.textAlign = bq.x < a.x ? 'right' : 'left'; ctx.fillText(String(mL), bq.x + (bq.x < a.x ? -3 : 3), bq.y);
        }
      }
    }, -0.04);
    return { rimZ: base[2] + H };
  }

  /* ---------------- steam: soft wisps that rise, spread and fade ---------------- */
  function steam(F, at, amount, ph, o) {
    o = o || {};
    if (amount <= 0.01) return;
    const ctx = F.ctx, cam = F.cam, n = Math.round(10 * amount) + 2;
    F.push(add(at, [0, 0, 0.06]), () => {
      ctx.save();
      for (let k = 0; k < n; k++) {
        const u = ((ph * 0.45 + k / n) % 1), sway = Math.sin(ph * 1.3 + k * 2.1) * 0.012 * (0.3 + u);
        const p = cam.project([at[0] + sway + (k % 3 - 1) * 0.008, at[1] + ((k * 7) % 5 - 2) * 0.004, at[2] + u * (o.rise || 0.16)]);
        if (!p.ok) continue;
        const rad = (0.010 + u * 0.026) * p.s, a = Math.min(0.8, amount * 0.95 * Math.sin(Math.PI * Math.pow(u, 0.7)));
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 1.6);          // wisps: taller than wide
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        g.addColorStop(0, 'rgba(244,247,251,' + a.toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(226,232,240,' + (a * 0.42).toFixed(3) + ')'); g.addColorStop(1, 'rgba(226,232,240,0)');
        ctx.fillStyle = g; ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      }
      ctx.restore();
    }, -0.2);
  }

  /* ---------------- an outline pushed up into a solid: mitts, boxes ----------------
     pts: [[x, y], …] in the object's own plane; place: { at: [x, y, z], rot }; the top face lit,
     the sides lit edge by edge. */
  function extrude(F, pts, place, h, colour, o) {
    o = o || {};
    const c = Math.cos(place.rot || 0), s = Math.sin(place.rot || 0), A = place.at;
    const U = place.u || [c, s, 0], V = place.v || [-s, c, 0], N = place.n || [0, 0, 1];     // the outline's plane, and its thickness direction
    const P = (x, y, z) => [A[0] + x * U[0] + y * V[0] + z * N[0], A[1] + x * U[1] + y * V[1] + z * N[1], A[2] + x * U[2] + y * V[2] + z * N[2]];
    const top = pts.map(([x, y]) => P(x, y, h)), bot = pts.map(([x, y]) => P(x, y, 0));
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      face(F, [bot[i], bot[j], top[j], top[i]], mix(colour, '#05080F', 0.12), { ambient: o.ambient == null ? 0.45 : o.ambient });
    }
    face(F, top.slice().reverse(), colour, { ambient: o.ambient == null ? 0.5 : o.ambient, bias: -0.001, after: o.after || null });
    return { P };
  }
  /* a padded heat mitt lying flat: a mitten outline with its thumb and cuff, quilted */
  function mittOutline() {
    const out = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; out.push([0.046 * Math.cos(a), 0.06 + 0.05 * Math.sin(a)]); }
    out.push([-0.047, 0.0], [-0.046, -0.07], [-0.05, -0.075], [-0.05, -0.13], [0.05, -0.13], [0.05, -0.075], [0.047, -0.07], [0.05, -0.03]);
    for (let i = 0; i <= 8; i++) { const a = -Math.PI * 0.6 + Math.PI * 1.1 * i / 8; out.push([0.068 + 0.02 * Math.cos(a), -0.012 + 0.03 * Math.sin(a)]); }
    out.push([0.047, 0.03]);
    return out.reverse();
  }
  /* hung from a wall rail by its loop: the outline stands in the x–z plane, facing −y */
  function mitt(F, at, rot, o) {
    o = o || {};
    const col = irc(o.ir, 21, 0.95, o.colour || '#8FA3B8'), c = Math.cos(rot), s = Math.sin(rot);
    R3.tube(F, [add(at, [-0.012, 0.012, 0.13]), add(at, [0, 0.012, 0.155]), add(at, [0.012, 0.012, 0.13])], 0.0022, irc(o.ir, 21, 0.95, '#3A3F48'), { segments: 5, round: false });
    extrude(F, mittOutline().map(([x, y]) => [x * c - y * s, x * s + y * c]), { at: add(at, [0, 0.022, 0]), u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] }, 0.02, col, { after: o.ir ? null : (ctx, q) => {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1;
      const cx = q.reduce((u, v) => u + v.x, 0) / q.length, cy = q.reduce((u, v) => u + v.y, 0) / q.length;
      ctx.beginPath(); ctx.moveTo(cx - 12, cy - 6); ctx.lineTo(cx + 12, cy - 6); ctx.moveTo(cx - 12, cy + 2); ctx.lineTo(cx + 12, cy + 2); ctx.stroke(); ctx.restore();
    } });
  }
  /* a dispenser box of nitrile gloves: printed card, an oval slot, a glove cuff poking out */
  function gloveBox(F, at, rot, o) {
    o = o || {};
    const W = 0.24, D = 0.125, H = 0.09, ir = o.ir;
    const c = Math.cos(rot), s = Math.sin(rot), axes = [[c, s, 0], [-s, c, 0], [0, 0, 1]];
    R3.box(F, [at[0], at[1], H / 2], [W, D, H], irc(ir, 21, 0.95, '#E9EEF4'), { axes, ambient: 0.55, shadowK: 0.6 });
    R3.box(F, [at[0], at[1], H - 0.012], [W + 0.001, D + 0.001, 0.024], irc(ir, 21, 0.95, '#3E6FD8'), { axes, ambient: 0.5, shadow: false });
    const P = (x, y, z) => [at[0] + x * c - y * s, at[1] + x * s + y * c, z];
    const slot = []; for (let i = 0; i < 20; i++) { const a = -i / 20 * TAU; slot.push(P(0.07 * Math.cos(a), 0.028 * Math.sin(a), H + 0.001)); }
    face(F, slot, irc(ir, 21, 0.95, '#1C2433'), { flat: true, bias: -0.002 });
    const cuff = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; cuff.push(P(-0.03 + 0.06 * i / 10, 0.002, H + 0.004 + 0.024 * Math.sin(a))); }
    face(F, cuff, irc(ir, 21, 0.95, '#6C8BE8'), { ambient: 0.6, bias: -0.004 });
  }

  /* ---------------- beaker tongs: two arms crossing at a pivot, the jaws coated in plastisol ----------------
     grip: the beaker's axis at the jaws' height; o.rb the beaker's radius (0: lying closed on the bench);
     o.dir: from the jaws back toward the handles. */
  function tongs(F, grip, o) {
    o = o || {};
    const ir = o.ir, rb = o.rb || 0, dir = norm(o.dir || [0.55, -0.83, 0]), side = norm(cross([0, 0, 1], dir));
    const steel = irc(ir, 21, 0.16, '#C4CBD4'), coat = irc(ir, 21, 0.95, o.coat || '#B8322C');
    const rj = Math.max(rb + 0.004, 0.012);
    const Q = (u, v, z) => add(add(add(grip, scale(dir, u)), scale(side, v)), [0, 0, z || 0]);
    const pivot = Q(rj + 0.075, 0, 0);
    [-1, 1].forEach(sg => {
      const arc = [];                                                     // the jaw hugs the beaker from its near side round toward the far side
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.15 + 0.62 * i / 12); arc.push(Q(rj * Math.cos(a), sg * rj * Math.sin(a), 0)); }
      arc.reverse();
      R3.tube(F, [pivot, Q(rj + 0.035, sg * (rj * 0.7), 0), arc[0]], 0.0026, steel, { segments: 6, round: false });
      R3.tube(F, arc, 0.004, coat, { segments: 7 });
      const h1 = add(pivot, add(scale(dir, 0.08), scale(side, -sg * 0.013))), h2 = add(pivot, add(scale(dir, 0.19), scale(side, -sg * 0.024)));
      R3.tube(F, [pivot, h1, h2], 0.0031, steel, { segments: 6, round: false });
      R3.tube(F, [h1, add(h2, scale(dir, 0.012))], 0.005, irc(ir, 21, 0.95, '#22262E'), { segments: 8 });
    });
    R3.cylinder(F, add(pivot, [0, 0, -0.004]), add(pivot, [0, 0, 0.004]), 0.0055, steel, { segments: 12, shadow: false });
  }
  /* a heat-proof mat: a square of pale ceramic-fibre board */
  function mat(F, c, s, o) {
    o = o || {};
    R3.box(F, [c[0], c[1], 0.004], [s, s, 0.008], irc(o.ir, o.T == null ? 20 : o.T, 0.95, '#D8D2C4'), { ambient: 0.55, shadowK: 0.4 });
  }

  /* ---------------- the fume cupboard: a lined box with a glass sash ----------------
     The inside of the cupboard is the bench; its back carries the baffle slots the air leaves by. */
  function fumeCupboard(F, x0, x1, y0, y1, h, sash, o) {
    o = o || {};
    const ir = o.ir, wall = irc(ir, 21, 0.95, '#E4E7EA'), lining = irc(ir, 21, 0.95, '#CDD3D8');
    face(F, [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], lining, { ambient: 0.6, bias: F.GROUND + 1, after: ir ? null : (ctx, q) => {
      // the baffle: three horizontal slots the fume leaves through
      [0.12, 0.5, 0.86].forEach(f => {
        const a = F.cam.project([x0 + 0.05, y1 - 0.001, h * f]), b = F.cam.project([x1 - 0.05, y1 - 0.001, h * f]);
        if (!a.ok || !b.ok) return;
        ctx.strokeStyle = 'rgba(40,50,60,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
    } });
    [x0, x1].forEach((x, i) => face(F, i ? [[x, y0, 0], [x, y1, 0], [x, y1, h], [x, y0, h]] : [[x, y1, 0], [x, y0, 0], [x, y0, h], [x, y1, h]], wall, { ambient: 0.55, bias: F.GROUND + 0.5 }));
    face(F, [[x0, y0, h], [x0, y1, h], [x1, y1, h], [x1, y0, h]], mix(wall, '#707880', 0.3), { ambient: 0.5, bias: F.GROUND + 0.5 });
    // the sash: an aluminium frame at the opening's top edge and the glass above it
    R3.box(F, [(x0 + x1) / 2, y0, sash], [x1 - x0, 0.03, 0.025], irc(ir, 21, 0.3, '#B9C1CA'), { shadow: false, ambient: 0.55 });
    F.push([(x0 + x1) / 2, y0, (sash + h) / 2], () => {
      const q = [[x0, y0, sash + 0.012], [x1, y0, sash + 0.012], [x1, y0, h], [x0, y0, h]].map(p => F.cam.project(p));
      if (q.some(v => !v.ok)) return;
      const ctx = F.ctx; ctx.save(); path(ctx, q); ctx.fillStyle = ir ? 'rgba(20,10,40,.4)' : 'rgba(200,225,240,.10)'; ctx.fill(); ctx.clip();
      if (!ir) { const g = ctx.createLinearGradient(q[0].x, q[3].y, q[1].x, q[0].y); g.addColorStop(0.2, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(255,255,255,.16)'); g.addColorStop(0.42, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(q[0].x, q[3].x), Math.min(q[2].y, q[3].y), 4000, 4000); }
      ctx.restore();
    }, -0.3);
    // the air: arrows drawn into the opening, toward the baffle
    if (o.air && !ir) F.push([(x0 + x1) / 2, y0, sash * 0.5], () => {
      const ctx = F.ctx; ctx.save(); ctx.strokeStyle = 'rgba(120,200,255,.45)'; ctx.fillStyle = 'rgba(120,200,255,.45)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 5; k++) {
        const x = x0 + (x1 - x0) * (0.15 + 0.175 * k), ph = ((o.phase || 0) * 0.5 + k * 0.23) % 1;
        const a = F.cam.project([x, y0 - 0.03, sash * 0.82]), b = F.cam.project([x, y0 + 0.08 + ph * 0.05, sash * 0.82]);
        if (!a.ok || !b.ok) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const ang = Math.atan2(b.y - a.y, b.x - a.x); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - 6 * Math.cos(ang - 0.4), b.y - 6 * Math.sin(ang - 0.4)); ctx.lineTo(b.x - 6 * Math.cos(ang + 0.4), b.y - 6 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }, -0.25);
  }

  /* ---------------- a magnetic stirrer's bar, spinning under the liquid ---------------- */
  function stirBar(F, at, len, ang, o) {
    const d = [Math.cos(ang) * len / 2, Math.sin(ang) * len / 2, 0];
    R3.cylinder(F, sub(at, d), add(at, d), 0.0042, irc(o && o.ir, (o && o.T) || 20, 0.95, '#F4F4F0'), { segments: 10, shadow: false, ambient: 0.6, bias: -0.01 });
  }

  /* ---------------- a graduated dropping funnel with its stopcock ----------------
     top: the centre of its open top; the body a cylinder, a cone below it, the stopcock and the stem.
     level: the liquid's height in the body (m); open: 0..1 (the stopcock's key turns). */
  function droppingFunnel(F, top, r, bodyH, level, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, ir = o.ir, cone = 0.03, stem = o.stem || 0.07;
    const base = [top[0], top[1], top[2] - bodyH];
    const tint = o.tint || '#D8ECF6', T = o.T == null ? 20 : o.T;
    // the liquid in the body and the cone
    const lv = clamp(level, 0, bodyH);
    F.push([base[0], base[1], base[2] + lv / 2], () => {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; pts.push(cam.project([base[0] + r * 0.93 * Math.cos(a), base[1] + r * 0.93 * Math.sin(a), base[2] + lv])); }
      const tip = cam.project([base[0], base[1], base[2] - cone]);
      if (pts.some(q => !q.ok) || !tip.ok) return;
      const bot = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; bot.push(cam.project([base[0] + r * 0.93 * Math.cos(a), base[1] + r * 0.93 * Math.sin(a), base[2]])); }
      ctx.save(); ctx.fillStyle = rgba(irc(ir, T, 0.96, tint), ir ? 0.9 : 0.38);
      path(ctx, hull2(pts.concat(bot).concat(lv > 1e-4 ? [tip] : [tip]))); ctx.fill();
      if (lv > 1e-4) { ctx.fillStyle = rgba(mix(irc(ir, T, 0.96, tint), '#FFFFFF', ir ? 0 : 0.4), ir ? 1 : 0.5); path(ctx, pts); ctx.fill(); ctx.strokeStyle = 'rgba(240,250,255,.8)'; ctx.lineWidth = 1; path(ctx, pts); ctx.stroke(); }
      ctx.restore();
    }, -0.02);
    // the glass: body, cone, stem; graduations up the body
    F.push([base[0], base[1], base[2] + bodyH / 2], () => {
      const b = ringPts(cam, base, r, 28), t = ringPts(cam, top, r, 28), tip = cam.project([base[0], base[1], base[2] - cone]);
      if (!b || !t || !tip.ok) return;
      const Hh = hull2(b.concat(t).concat([tip]));
      ctx.save(); path(ctx, Hh); ctx.fillStyle = ir ? rgba(irc(ir, T, 0.92, '#000'), 0.7) : 'rgba(200,228,245,.08)'; ctx.fill();
      ctx.strokeStyle = ir ? 'rgba(255,255,255,.3)' : 'rgba(225,242,255,.65)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); t.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      if (!ir && o.marks) {
        const e = cam.eye, ang = Math.atan2(e[1] - base[1], e[0] - base[0]) + 0.6, nx = Math.cos(ang), ny = Math.sin(ang);
        ctx.font = '600 7.5px "IBM Plex Mono",monospace'; ctx.fillStyle = 'rgba(250,252,255,.9)'; ctx.strokeStyle = 'rgba(250,252,255,.85)'; ctx.lineWidth = 1; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        for (let v = 0; v <= o.marks.max + 1e-9; v += o.marks.step) {
          const z = base[2] + bodyH - v / o.marks.perM;
          if (z < base[2]) break;
          const a = cam.project([base[0] + nx * r, base[1] + ny * r, z]), c = cam.project([base[0] + nx * r - ny * r * 0.5, base[1] + ny * r + nx * r * 0.5, z]);
          if (!a.ok || !c.ok) continue;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
          if (Math.abs(v / o.marks.label - Math.round(v / o.marks.label)) < 1e-6) ctx.fillText(String(v), c.x + 3, c.y);
        }
      }
      ctx.restore();
    }, -0.04);
    const sc = [base[0], base[1], base[2] - cone - 0.008];
    R3.cylinder(F, [base[0], base[1], base[2] - cone], sc, 0.004, irc(ir, T, 0.92, '#DDEAF2'), { segments: 10, shadow: false, ambient: 0.6 });
    // the stopcock: a PTFE key across the barrel, turned by how far it is open
    const ka = (o.open || 0) * Math.PI / 2, kd = [Math.cos(ka) * 0.018, Math.sin(ka) * 0.006, Math.sin(ka) * 0.012];
    R3.cylinder(F, sub(sc, [0.012, 0, 0]), add(sc, [0.012, 0, 0]), 0.0055, irc(ir, 21, 0.95, '#E8ECEF'), { segments: 12, shadow: false, ambient: 0.6 });
    R3.box(F, add(sc, [0.02, 0, 0]), [0.006, 0.004, 0.018], irc(ir, 21, 0.95, '#2E6FD0'), { shadow: false, axes: [[1, 0, 0], norm([0, Math.cos(ka), -Math.sin(ka) * 0.2 + 0.0001]), norm(cross([1, 0, 0], norm([0, Math.cos(ka), -Math.sin(ka) * 0.2 + 0.0001])))] });
    void kd;
    const tipZ = sc[2] - stem;
    R3.cylinder(F, [sc[0], sc[1], sc[2] - 0.004], [sc[0], sc[1], tipZ], 0.0032, irc(ir, T, 0.92, '#DDEAF2'), { segments: 8, shadow: false, ambient: 0.6 });
    return { tip: [sc[0], sc[1], tipZ] };
  }

  /* ---------------- drops and a thin stream falling from a tip onto a surface ---------------- */
  function dropsFall(F, from, toZ, rate, ph, o) {
    o = o || {};
    if (rate <= 0) return;
    const ctx = F.ctx, cam = F.cam, col = o.colour || 'rgba(225,240,250,.9)';
    F.push([from[0], from[1], (from[2] + toZ) / 2], () => {
      const a = cam.project(from), b = cam.project([from[0], from[1], toZ]);
      if (!a.ok || !b.ok) return;
      ctx.save();
      if (rate > 0.8) {                                   // a steady thread
        ctx.strokeStyle = col; ctx.lineWidth = Math.min(3, 0.8 + rate * 0.4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else {                                            // drops: falling, accelerating
        const n = 3;
        for (let k = 0; k < n; k++) {
          const u = ((ph * (0.6 + rate * 2) + k / n) % 1), f = u * u;
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 1.6, 2.4, 0, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }, -0.05);
  }

  /* ---------------- spatter: droplets thrown out of a boiling surface on ballistic arcs ---------------- */
  function spatter(F, at, r, amount, ph, o) {
    if (amount <= 0) return;
    const ctx = F.ctx, cam = F.cam, n = Math.round(6 + 26 * amount);
    F.push(add(at, [0, 0, 0.05]), () => {
      ctx.save();
      for (let k = 0; k < n; k++) {
        const s = (k * 0.618034) % 1, u = ((ph * 1.7 + s) % 1), ang = s * TAU, v = 0.9 + 1.4 * ((k * 0.3819) % 1);
        const tt = u * 0.35, x = at[0] + Math.cos(ang) * (r * 0.5 + v * 0.35 * tt), y = at[1] + Math.sin(ang) * (r * 0.5 + v * 0.35 * tt), z = at[2] + v * tt - 4.9 * tt * tt;
        if (z < at[2] - 0.12) continue;
        const q = cam.project([x, y, z]); if (!q.ok) continue;
        ctx.fillStyle = 'rgba(240,248,255,' + (0.85 * (1 - u)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.4 + 1.2 * ((k * 0.7) % 1), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }, -0.15);
  }

  /* ---------------- reagent bottles ---------------- */
  function ghsTex(name, detail) {
    const key = 'ghs' + name + detail;
    if (cache[key]) return cache[key];
    const c = canvas(256, 200), x = c.getContext('2d');
    x.fillStyle = '#F7F5EE'; x.fillRect(0, 0, 256, 200);
    x.fillStyle = '#1A1A1A'; x.font = '700 22px "IBM Plex Sans",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top';
    x.fillText(name, 128, 12); x.font = '600 16px "IBM Plex Sans",sans-serif'; x.fillText(detail, 128, 40);
    // the GHS corrosion pictogram: a red-bordered diamond; two test tubes pouring onto a bar and a hand
    x.save(); x.translate(128, 128); x.rotate(Math.PI / 4);
    x.fillStyle = '#FFFFFF'; x.fillRect(-44, -44, 88, 88); x.strokeStyle = '#D0161A'; x.lineWidth = 8; x.strokeRect(-44, -44, 88, 88);
    x.restore();
    x.save(); x.translate(128, 128); x.fillStyle = '#111';
    x.save(); x.rotate(-0.5); x.fillRect(-30, -36, 10, 26); x.restore();
    x.save(); x.rotate(0.5); x.fillRect(20, -36, 10, 26); x.restore();
    x.fillRect(-32, 10, 26, 6); x.fillRect(8, 12, 26, 10);
    for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(-24 + k * 4, 0 + k * 3, 1.8, 0, TAU); x.fill(); x.beginPath(); x.arc(18 + k * 4, 2 + k * 3, 1.8, 0, TAU); x.fill(); }
    x.restore();
    x.fillStyle = '#B81418'; x.font = '700 15px "IBM Plex Sans",sans-serif'; x.fillText('DANGER', 128, 176);
    return (cache[key] = c);
  }
  function bottle(F, base, o) {
    o = o || {};
    const ir = o.ir, r = o.r || 0.035, H = o.h || 0.13, col = irc(ir, 21, 0.9, o.glass || '#7A4A1C');
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, col, { segments: 28, ambient: 0.4, shadowK: 0.7 });
    R3.cylinder(F, [base[0], base[1], base[2] + H], [base[0], base[1], base[2] + H + 0.02], r * 0.55, col, { segments: 20, shadow: false, ambient: 0.4 });
    R3.cylinder(F, [base[0], base[1], base[2] + H + 0.02], [base[0], base[1], base[2] + H + 0.045], r * 0.42, irc(ir, 21, 0.95, o.cap || '#D8DCE0'), { segments: 18, shadow: false, ambient: 0.5 });
    if (o.label && !ir) {
      const e = F.cam.eye, a = Math.atan2(e[1] - base[1], e[0] - base[0]), n = [Math.cos(a), Math.sin(a), 0], t = [-Math.sin(a), Math.cos(a), 0];
      const c = add(base, add(scale(n, r + 0.0015), [0, 0, H * 0.48]));
      R3.texPlane(F, c, scale(t, r * 0.82), [0, 0, -H * 0.3], ghsTex(o.label, o.detail || ''), { bias: -0.01, grid: 3 });
    }
  }
  function washBottle(F, base, o) {
    o = o || {};
    const ir = o.ir, r = 0.03, H = 0.12, col = irc(ir, 21, 0.95, '#EEF2F4');
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, col, { segments: 24, ambient: 0.55, shadowK: 0.6 });
    R3.cylinder(F, [base[0], base[1], base[2] + H], [base[0], base[1], base[2] + H + 0.018], 0.018, irc(ir, 21, 0.95, '#2E6FD0'), { segments: 16, shadow: false, ambient: 0.5 });
    R3.tube(F, [[base[0], base[1], base[2] + H + 0.018], [base[0], base[1], base[2] + H + 0.06], [base[0] - 0.03, base[1] - 0.01, base[2] + H + 0.075], [base[0] - 0.06, base[1] - 0.02, base[2] + H + 0.05]], 0.0022, col, { segments: 6 });
  }
  /* an ice bath: a translucent tub with ice cubes and water around whatever stands in it */
  function iceBath(F, c, r, h, o) {
    o = o || {};
    const ir = o.ir, ctx = F.ctx, cam = F.cam;
    F.push([c[0], c[1], c[2] + h * 0.4], () => {
      const b = ringPts(cam, c, r, 36), t = ringPts(cam, [c[0], c[1], c[2] + h], r, 36), w = ringPts(cam, [c[0], c[1], c[2] + h * 0.72], r - 0.002, 36);
      if (!b || !t || !w) return;
      ctx.save();
      path(ctx, hull2(b.concat(w))); ctx.fillStyle = ir ? rgba(iron(0.12), 0.9) : 'rgba(150,200,230,.35)'; ctx.fill();
      path(ctx, hull2(b.concat(t))); ctx.fillStyle = ir ? rgba(iron(0.1), 0.3) : 'rgba(225,238,248,.18)'; ctx.fill();
      ctx.strokeStyle = ir ? 'rgba(255,255,255,.2)' : 'rgba(235,245,255,.6)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }, 0.02);
    const rr = rng(o.seed || 5);
    for (let k = 0; k < 16; k++) {
      const a = rr() * TAU, d = r * (0.62 + 0.32 * rr()), p = [c[0] + d * Math.cos(a), c[1] + d * Math.sin(a), c[2] + h * (0.62 + 0.12 * rr())];
      R3.box(F, p, [0.018, 0.018, 0.016], irc(ir, 0, 0.96, '#E6F4FB'), { shadow: false, ambient: 0.7, axes: [[Math.cos(a * 3), Math.sin(a * 3), 0], [-Math.sin(a * 3), Math.cos(a * 3), 0], [0, 0, 1]] });
    }
  }

  /* ---------------- a top-loading balance ----------------
     at: the centre of its base on the bench; o.text the display (what it reads), o.settled.
     Returns the top of the pan, where a load sits. The display faces −y. */
  function balance(F, at, o) {
    o = o || {};
    const ir = o.ir, W = 0.19, D = 0.26, Hb = 0.075;
    const body = irc(ir, 21, 0.9, '#E3E7EB');
    R3.box(F, [at[0], at[1] + 0.02, Hb / 2], [W, D - 0.04, Hb], body, { ambient: 0.55, shadowK: 0.8 });
    const fy = at[1] - D / 2 + 0.02;
    face(F, [[at[0] - W / 2, fy - 0.03, 0.006], [at[0] + W / 2, fy - 0.03, 0.006], [at[0] + W / 2, fy, Hb - 0.008], [at[0] - W / 2, fy, Hb - 0.008]], irc(ir, 21, 0.9, '#2B3240'), { ambient: 0.55 });
    face(F, [[at[0] - W / 2, fy - 0.03, 0], [at[0] + W / 2, fy - 0.03, 0], [at[0] + W / 2, fy - 0.03, 0.006], [at[0] - W / 2, fy - 0.03, 0.006]], body, { ambient: 0.5 });
    // the display: an LCD set into the sloped panel, and two keys
    const dn = norm([0, -(Hb - 0.014), 0.03]), dc = [at[0] - 0.02, fy - 0.015, (Hb - 0.002) / 2];
    const u = norm([0, 0.03, Hb - 0.014]);
    const P0 = add(add(dc, [-0.045, 0, 0]), scale(u, 0.012)), P1 = add(P0, [0.09, 0, 0]), P3 = add(P0, scale(u, -0.024));
    const key = 'lcd' + (o.text || '') + (o.settled ? 1 : 0);
    if (!cache[key]) {
      const c = canvas(240, 64), x = c.getContext('2d');
      x.fillStyle = '#1B2A20'; x.fillRect(0, 0, 240, 64);
      x.fillStyle = o.settled ? '#9CF5B8' : '#6FCB8C'; x.font = '700 40px "IBM Plex Mono",monospace'; x.textAlign = 'right'; x.textBaseline = 'middle';
      x.fillText(o.text || '0.00', 208, 34); x.font = '600 18px "IBM Plex Mono",monospace'; x.fillText('g', 232, 40);
      if (o.settled) { x.font = '600 14px "IBM Plex Mono",monospace'; x.textAlign = 'left'; x.fillText('●', 8, 14); }
      const ks = Object.keys(cache).filter(k => k.startsWith('lcd')); if (ks.length > 40) ks.forEach(k => delete cache[k]);
      cache[key] = c;
    }
    F.push(add(dc, scale(dn, 0.002)), () => BENCH.faceTex(F.ctx, F.cam, cache[key], P0, P1, P3, 1, null), -0.02);
    [0.045, 0.07].forEach((kx, i) => R3.box(F, add(dc, [kx, 0, 0]), [0.016, 0.004, 0.009], irc(ir, 21, 0.9, i ? '#C8D0DA' : '#3E6FD8'), { shadow: false, ambient: 0.5, axes: [[1, 0, 0], u, dn] }));
    // the pan: a stainless disc on a short post, with a draught ring
    const pz = Hb + 0.012;
    R3.cylinder(F, [at[0], at[1] + 0.04, Hb], [at[0], at[1] + 0.04, pz - 0.002], 0.012, irc(ir, 21, 0.3, '#9AA4B0'), { segments: 12, shadow: false });
    R3.cylinder(F, [at[0], at[1] + 0.04, pz - 0.002], [at[0], at[1] + 0.04, pz], 0.062, irc(ir, 21, 0.2, '#D5DBE2'), { segments: 36, shadow: false, ambient: 0.6 });
    return [at[0], at[1] + 0.04, pz];
  }
  /* a square polystyrene weighing boat */
  function boat(F, c, o) {
    const ir = o && o.ir, s2 = 0.032, h = 0.008, col = irc(ir, 21, 0.95, '#F1F3F4');
    face(F, [[c[0] - s2, c[1] - s2, c[2] + 0.001], [c[0] + s2, c[1] - s2, c[2] + 0.001], [c[0] + s2, c[1] + s2, c[2] + 0.001], [c[0] - s2, c[1] + s2, c[2] + 0.001]], col, { ambient: 0.7 });
    [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]].forEach(([a, b]) =>
      face(F, [[c[0] + a[0] * s2 * 0.8, c[1] + a[1] * s2 * 0.8, c[2] + 0.001], [c[0] + b[0] * s2 * 0.8, c[1] + b[1] * s2 * 0.8, c[2] + 0.001], [c[0] + b[0] * s2, c[1] + b[1] * s2, c[2] + h], [c[0] + a[0] * s2, c[1] + a[1] * s2, c[2] + h]], col, { ambient: 0.65, alpha: 0.9 }));
  }

  /* ---------------- a graduated cylinder ----------------
     base: its foot's centre on the bench; G: { cap (mL), div, mid, big, d (inner, m), scaleH (m) };
     vol: the true water volume (mL) — its lowest meniscus point; o.menisc (m), o.tint, o.inner(F) draws
     what hangs inside. Returns { z0 (the scale's zero), A (m²), r, topZ, zOf(mL) }. */
  function gradCylinder(F, base, G, vol, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, ir = o.ir;
    const r = G.d / 2, wall = Math.max(0.0012, r * 0.08), ro = r + wall, foot = 0.012, z0 = base[2] + foot + 0.006;
    const A = Math.PI * r * r, zOf = v => z0 + v * 1e-6 / A, topZ = zOf(G.cap) + Math.max(0.012, (zOf(G.cap) - z0) * 0.12);
    // the hexagonal foot, translucent blue polypropylene
    const hex = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; hex.push([Math.cos(a) * ro * 2.4, Math.sin(a) * ro * 2.4]); }
    extrude(F, hex, { at: base }, foot, irc(ir, 21, 0.95, '#5E9CD6'), { ambient: 0.55 });
    R3.cylinder(F, [base[0], base[1], base[2] + foot], [base[0], base[1], z0], ro, irc(ir, 21, 0.92, '#CFE3F0'), { segments: 24, shadow: false, ambient: 0.6 });
    const men = o.menisc == null ? 0.0022 : o.menisc, zl = zOf(Math.max(0, vol)), tint = o.tint || '#9CCBEA';
    // the water: a tinted column up to its meniscus, the lens of the meniscus drawn at the top
    if (vol > 0.01) F.push([base[0], base[1], (z0 + zl) / 2], () => {
      const b = ringPts(cam, [base[0], base[1], z0], r, 32), t = ringPts(cam, [base[0], base[1], zl + men], r, 32);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      ctx.save();
      let x0 = Infinity, x1 = -Infinity; Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      path(ctx, Hh); ctx.fillStyle = rgba(ir ? irc(ir, 21, 0.96, '#000') : tint, ir ? 0.9 : 0.42); ctx.fill(); ctx.clip();
      if (!ir) { const hz = ctx.createLinearGradient(x0, 0, x1, 0); hz.addColorStop(0, 'rgba(8,30,56,.25)'); hz.addColorStop(0.45, 'rgba(230,248,255,.18)'); hz.addColorStop(1, 'rgba(8,30,56,.28)'); ctx.fillStyle = hz; ctx.fillRect(x0, 0, x1 - x0, 5000); }
      ctx.restore();
      // the meniscus: the surface dips from the wall (zl + men) to the axis (zl); its front edge is the dark line one reads
      const rim = ringPts(cam, [base[0], base[1], zl + men], r, 32), mid = ringPts(cam, [base[0], base[1], zl + men * 0.35], r * 0.7, 32);
      if (rim && mid) {
        ctx.save(); ctx.fillStyle = rgba(mix(tint, '#FFFFFF', 0.5), 0.55); path(ctx, rim); ctx.fill();
        ctx.strokeStyle = 'rgba(245,252,255,.9)'; ctx.lineWidth = 1; path(ctx, rim); ctx.stroke();
        const lo = cam.project([base[0], base[1], zl]), le = cam.project([base[0] - r, base[1], zl + men]), re = cam.project([base[0] + r, base[1], zl + men]);
        if (lo.ok && le.ok && re.ok) { ctx.strokeStyle = 'rgba(20,50,80,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(le.x, le.y); ctx.quadraticCurveTo(lo.x, lo.y + (lo.y - (le.y + re.y) / 2) * 1.0, re.x, re.y); ctx.stroke(); }
        ctx.restore();
      }
    }, -0.02);
    if (o.inner) o.inner(F, { z0, zOf, r });
    // the glass and its printed scale
    F.push([base[0], base[1], (z0 + topZ) / 2], () => {
      const b = ringPts(cam, [base[0], base[1], z0 - 0.004], ro, 36), t = ringPts(cam, [base[0], base[1], topZ], ro, 36);
      if (!b || !t) return;
      const Hh = hull2(b.concat(t));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity; Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); });
      ctx.save(); path(ctx, Hh); ctx.fillStyle = ir ? 'rgba(20,10,40,.3)' : 'rgba(200,228,245,.07)'; ctx.fill(); ctx.clip();
      if (!ir) { const gr = ctx.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.08, 'rgba(255,255,255,.34)'); gr.addColorStop(0.16, 'rgba(255,255,255,.03)'); gr.addColorStop(0.86, 'rgba(255,255,255,.03)'); gr.addColorStop(0.93, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, 4000); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(215,238,255,.55)'; ctx.lineWidth = 1; path(ctx, Hh); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); t.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      const sp = cam.project([base[0] - ro - 0.005, base[1], topZ + 0.002]), s0 = cam.project([base[0] - ro * 0.9, base[1] - ro * 0.4, topZ]), s1 = cam.project([base[0] - ro * 0.9, base[1] + ro * 0.4, topZ]);
      if (sp.ok && s0.ok && s1.ok) { ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.quadraticCurveTo(sp.x, sp.y, s1.x, s1.y); ctx.stroke(); }
      if (!ir && o.scale !== false) {                     // the scale faces the viewer: ticks every division, numbers on the big ones
        const e = cam.eye, ang = Math.atan2(e[1] - base[1], e[0] - base[0]) + 0.35, nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny, ty = nx;
        ctx.font = '600 ' + (o.font || 8) + 'px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        const n = Math.round(G.cap / G.div);
        for (let k = 0; k <= n; k++) {
          const v = k * G.div, z = zOf(v), big = Math.abs(v / G.big - Math.round(v / G.big)) < 1e-6, mid = G.mid && Math.abs(v / G.mid - Math.round(v / G.mid)) < 1e-6;
          const len = big ? 0.9 : mid ? 0.6 : 0.35;
          const pa = cam.project([base[0] + nx * ro, base[1] + ny * ro, z]), pb = cam.project([base[0] + nx * ro + tx * ro * len, base[1] + ny * ro + ty * ro * len, z]);
          if (!pa.ok || !pb.ok) continue;
          ctx.strokeStyle = big ? 'rgba(252,254,255,.95)' : 'rgba(240,248,255,.72)'; ctx.lineWidth = big ? 1.1 : 0.7;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
          if (big && k > 0) { const lab = String(+v.toFixed(2)); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(5,12,22,.7)'; ctx.strokeText(lab, pb.x + 2, pb.y); ctx.fillStyle = '#F4F8FF'; ctx.fillText(lab, pb.x + 2, pb.y); }
        }
        const q = cam.project([base[0] + nx * ro + tx * ro * 0.4, base[1] + ny * ro + ty * ro * 0.4, zOf(G.cap) + 0.008]);
        if (q.ok) { ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'center'; ctx.fillText(G.cap + ' mL', q.x, q.y); }
      }
    }, -0.04);
    return { z0, zOf, A, r, ro, topZ };
  }

  /* ---------------- an overflow ("eureka") can: water to its spout, and what the spout pours ---------------- */
  function eurekaCan(F, base, o) {
    o = o || {};
    const ir = o.ir, r = 0.042, H = 0.14, spZ = base[2] + 0.118;
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, irc(ir, 21, 0.3, '#C3CAD2'), { segments: 32, caps: false, ambient: 0.45, shadowK: 0.7 });
    R3.cylinder(F, [base[0], base[1], base[2] + H - 0.002], [base[0], base[1], base[2] + H + 0.001], r + 0.002, irc(ir, 21, 0.3, '#DDE3E9'), { segments: 32, inner: r - 0.0015, shadow: false });
    F.push([base[0], base[1], spZ], () => {
      const t = ringPts(F.cam, [base[0], base[1], spZ + (o.bulge || 0)], r - 0.002, 30); if (!t) return;
      F.ctx.save(); F.ctx.fillStyle = ir ? rgba(irc(ir, 21, 0.96, '#000'), 0.9) : 'rgba(120,180,220,.75)'; path(F.ctx, t); F.ctx.fill(); F.ctx.restore();
    }, 0.01);
    const s0 = [base[0] + r, base[1], spZ - 0.004], s1 = [base[0] + r + 0.05, base[1], spZ - 0.03];
    R3.cylinder(F, s0, s1, 0.0055, irc(ir, 21, 0.3, '#C3CAD2'), { segments: 12, shadow: false, ambient: 0.5 });
    return { spout: s1, waterZ: spZ, r };
  }

  /* ---------------- minerals, in their real habits and lustres ----------------
     kind: pyrite | galena | gold | hematite | magnetite | quartz; c: the point it rests on (or hangs
     from, o.hang); V: its volume in cm³ (the drawing's size follows). */
  const LUSTRE = { pyrite: '#CDB262', galena: '#8E949C', gold: '#E6B63A', hematite: '#474A52', magnetite: '#2A2C31', quartz: '#E8F2F8' };
  function icoMesh(seed, rough) {
    const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => norm(v));
    let Fc = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const mid = {}, mp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] == null) { V.push(norm(scale(add(V[a], V[b]), 0.5))); mid[k] = V.length - 1; } return mid[k]; };
    const nf = []; Fc.forEach(([a, b, c]) => { const ab = mp(a, b), bc = mp(b, c), ca = mp(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }); Fc = nf;
    const r = rng(seed);
    const R = V.map(v => 1 + rough * (Math.sin(v[0] * 5.1 + seed) * 0.5 + Math.sin(v[1] * 4.3 - seed) * 0.35 + Math.sin(v[2] * 6.7) * 0.25 + (r() - 0.5) * 0.4));
    return { V: V.map((v, i) => scale(v, R[i])), F: Fc };
  }
  function mineral(F, kind, c, V, o) {
    o = o || {};
    const ir = o.ir, col = irc(ir, o.T || 21, kind === 'quartz' ? 0.92 : 0.5, LUSTRE[kind]), cm = 0.01;
    const up = o.hang ? -1 : 1;                              // hanging: c is the top (the thread's end); resting: c is the bottom
    const glint = (ctx, q, k) => { if (ir) return; const x0 = q.reduce((u, v) => u + v.x, 0) / q.length, y0 = q.reduce((u, v) => u + v.y, 0) / q.length; ctx.fillStyle = 'rgba(255,255,255,' + k + ')'; ctx.beginPath(); ctx.arc(x0 - 1, y0 - 1, 1.3, 0, TAU); ctx.fill(); };
    if (kind === 'pyrite' || kind === 'galena') {
      const a = Math.cbrt(V) * cm, h = a / 2, cc = [c[0], c[1], c[2] + up * h];
      const ax = [[Math.cos(0.4), Math.sin(0.4), 0], [-Math.sin(0.4), Math.cos(0.4), 0], [0, 0, 1]];
      const corner = (i, j, k) => add(cc, add(add(scale(ax[0], i * h), scale(ax[1], j * h)), scale(ax[2], k * h)));
      const faces = [[[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, 1, -1], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1]], [[1, 1, -1], [-1, 1, -1], [-1, 1, 1], [1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]];
      faces.forEach((fc, fi) => face(F, fc.map(v => corner(...v)), col, { ambient: 0.35, after: ir ? null : (ctx, q) => {
        // striations on pyrite (alternating direction face to face); cleavage steps on galena
        ctx.save(); ctx.strokeStyle = kind === 'pyrite' ? 'rgba(90,70,20,.35)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.7;
        for (let k = 1; k < (kind === 'pyrite' ? 7 : 3); k++) { const f = k / (kind === 'pyrite' ? 7 : 3), A = fi % 2 ? q[0] : q[1], B = fi % 2 ? q[1] : q[2], C = fi % 2 ? q[3] : q[0], D = fi % 2 ? q[2] : q[3];
          ctx.beginPath(); ctx.moveTo(A.x + (C.x - A.x) * f, A.y + (C.y - A.y) * f); ctx.lineTo(B.x + (D.x - B.x) * f, B.y + (D.y - B.y) * f); ctx.stroke(); }
        ctx.restore(); glint(ctx, q, 0.5);
      } }));
      return;
    }
    if (kind === 'magnetite') {
      const a = Math.cbrt(3 * V / Math.SQRT2) * cm, e = a / Math.SQRT2, cc = [c[0], c[1], c[2] + up * e];
      const P = [[e, 0, 0], [-e, 0, 0], [0, e, 0], [0, -e, 0], [0, 0, e], [0, 0, -e]].map(v => add(cc, v));
      [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]].forEach(tr => face(F, tr.map(i => P[i]), col, { ambient: 0.3, after: (ctx, q) => glint(ctx, q, 0.35) }));
      return;
    }
    if (kind === 'quartz') {
      const sd = Math.cbrt(V / 7.45) * cm, hp = 2.5 * sd, hy = 1.1 * sd, cc = [c[0], c[1], c[2]];
      const z0 = o.hang ? cc[2] - hp - hy : cc[2], ring = z => { const out = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; out.push([cc[0] + sd * Math.cos(a), cc[1] + sd * Math.sin(a), z]); } return out; };
      const b = ring(z0), t = ring(z0 + hp), apex = [cc[0], cc[1], z0 + hp + hy];
      for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; face(F, [b[i], b[j], t[j], t[i]], col, { ambient: 0.5, alpha: ir ? 1 : 0.42, edge: 'rgba(255,255,255,.55)' }); face(F, [t[i], t[j], apex], col, { ambient: 0.55, alpha: ir ? 1 : 0.5, edge: 'rgba(255,255,255,.6)' }); }
      face(F, t.slice().reverse(), col, { ambient: 0.5, alpha: 0.2 });
      return;
    }
    // gold nugget and botryoidal hematite: rounded, lumpy meshes
    const rad = Math.cbrt(3 * V / (4 * Math.PI)) * cm;
    const blobs = kind === 'hematite' ? [[0, 0, 0, 0.8], [0.55, 0.2, -0.1, 0.55], [-0.5, 0.3, -0.05, 0.5], [0.1, -0.55, -0.1, 0.5], [-0.25, -0.35, 0.3, 0.42], [0.35, 0.35, 0.35, 0.4]] : [[0, 0, 0, 1]];
    blobs.forEach((bl, bi) => {
      const M = icoMesh((o.seed || 3) + bi * 7, kind === 'gold' ? 0.22 : 0.08), rr = rad * bl[3] * (kind === 'hematite' ? 1.05 : 1);
      const cc = [c[0] + bl[0] * rad, c[1] + bl[1] * rad, c[2] + up * (rad * 0.85 + bl[2] * rad)];
      M.F.forEach(tr => {
        const pts = tr.map(i => add(cc, [M.V[i][0] * rr, M.V[i][1] * rr, M.V[i][2] * rr * 0.85]));
        const shade = kind === 'hematite' ? mix(col, ir ? col : '#6E3528', clamp(-pts[0][2] + cc[2], 0, 1) * 30 * 0.4) : col;
        face(F, pts, shade, { ambient: kind === 'gold' ? 0.45 : 0.32, after: kind === 'gold' && !ir ? (ctx, q) => glint(ctx, q, 0.25) : null });
      });
    });
  }
  /* a wooden specimen tray with labelled hollows */
  function tray(F, c, n, labels, o) {
    o = o || {};
    const w = 0.052 * n + 0.02, d = 0.07;
    BENCH.texBox(F, [c[0], c[1], 0.008], [w, d, 0.016], BENCH.wood('#9A6B3E', 4), { ambient: 0.55, tiles: 1, bias: F.GROUND - 1 });
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = c[0] - w / 2 + 0.02 + 0.026 + i * 0.052, y = c[1];
      face(F, [[x - 0.021, y - 0.024, 0.0165], [x + 0.021, y - 0.024, 0.0165], [x + 0.021, y + 0.024, 0.0165], [x - 0.021, y + 0.024, 0.0165]], '#6E4A2A', { ambient: 0.5, bias: F.GROUND - 2 });
      out.push([x, y + 0.004, 0.017]);
      if (labels) F.push([x, y - 0.03, 0.017], () => { const q = F.cam.project([x, y - 0.031, 0.017]); if (!q.ok) return; F.ctx.save(); F.ctx.font = '700 9px "IBM Plex Mono",monospace'; F.ctx.fillStyle = '#F5E9D2'; F.ctx.textAlign = 'center'; F.ctx.textBaseline = 'middle'; F.ctx.fillText(labels[i], q.x, q.y); F.ctx.restore(); }, -0.01);
    }
    return out;
  }

  /* ---------------- the magnifier on a meniscus (a 2D plate) ----------------
     A side view through the glass. The scale is printed on the near wall, between the eye and the water;
     the meniscus's lowest point is on the axis, a radius behind it. o: { div, big, center (mL at the
     plate's middle), true (mL at the lowest point), menisc (mL of the climb), hit (mL where the eye's line
     crosses the scale), readAt }. The eye is placed so its line of sight lands exactly at o.hit. */
  function loupe(ctx, cx, cy, R, o) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = '#0D1520'; ctx.fill(); ctx.clip();
    const span = o.span || 6, pxPer = R * 2 / (span * o.div), Y = v => cy - (v - o.center) * pxPer;
    const wf = cx - R * 0.8, wn = cx + R * 0.32, axis = (wf + wn) / 2;          // far wall, near wall (the scale), the axis
    const yTrue = Y(o.true), yEdge = Y(o.true + o.menisc), lam = (wn - wf) * clamp(1.35 / (o.bore || 29), 0.05, 0.2);   // the climb lives within a capillary length (2.7 mm) of the glass
    const surf = []; for (let i = 0; i <= 40; i++) { const x = wf + (wn - wf) * i / 40, d = Math.min(x - wf, wn - x); surf.push([x, yTrue - (yTrue - yEdge) * Math.exp(-d / lam)]); }
    ctx.fillStyle = 'rgba(120,180,225,.55)';
    ctx.beginPath(); surf.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(wn, cy + R); ctx.lineTo(wf, cy + R); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0E3A64'; ctx.lineWidth = 2.4; ctx.beginPath(); surf.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,235,255,.6)'; ctx.lineWidth = 2; [wf - 2, wn + 2].forEach(x => { ctx.beginPath(); ctx.moveTo(x, cy - R); ctx.lineTo(x, cy + R); ctx.stroke(); });
    // the scale on the near wall
    ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const k0 = Math.floor((o.center - span) / o.div), k1 = Math.ceil((o.center + span) / o.div);
    for (let k = k0; k <= k1; k++) {
      const v = k * o.div, y = Y(v), big = Math.abs(v / o.big - Math.round(v / o.big)) < 1e-6, mid = o.mid && Math.abs(v / o.mid - Math.round(v / o.mid)) < 1e-6;
      ctx.strokeStyle = big ? '#F4F8FF' : 'rgba(230,240,255,.8)'; ctx.lineWidth = big ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(wn + 2, y); ctx.lineTo(wn + 2 - (big ? 22 : mid ? 15 : 10), y); ctx.stroke();
      if (big || mid) { ctx.fillStyle = big ? '#F4F8FF' : 'rgba(230,240,255,.75)'; ctx.font = (big ? '600 10px' : '500 9px') + ' "IBM Plex Mono",monospace'; ctx.fillText(String(+v.toFixed(2)), wn + 6, y); }
    }
    // the eye and its line of sight: to the lowest point (or the edge on the near wall), crossing the scale at o.hit
    const aimX = o.readAt === 'top' ? wn + 2 : axis, aimY = o.readAt === 'top' ? yEdge : yTrue, hitY = Y(o.hit), ex = cx + R * 0.86;
    const f = (ex - (wn + 2)) / Math.max(1e-6, ex - aimX), eyeY = o.readAt === 'top' ? aimY + (Y(o.hit) - aimY) : (hitY - aimY * (1 - f)) / Math.max(1e-6, f);
    const room = Math.sqrt(Math.max(0, R * R - (ex - cx) * (ex - cx))) - 7, ey = clamp(eyeY, cy - room, cy + room);   // the eye stays inside the lens
    ctx.strokeStyle = '#FFD27A'; ctx.setLineDash([5, 3]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(aimX, aimY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#FF6A5A'; ctx.beginPath(); ctx.arc(wn + 2, hitY, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFE6B0'; ctx.beginPath(); ctx.ellipse(ex, ey, 9, 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2A4A7A'; ctx.beginPath(); ctx.arc(ex - 1.5, ey, 3.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#0A0A10'; ctx.beginPath(); ctx.arc(ex - 1.5, ey, 1.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(210,225,245,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.restore();
    return { eyeX: ex, eyeY: ey, pxPer, Y };
  }

  /* ---------------- the drop tower ----------------
     A heavy base and a tall rod; the release clamp; light gates the ball falls through; a sand box. */
  function towerStand(F, base, height, o) {
    o = o || {};
    R3.box(F, [base[0], base[1], base[2] + 0.015], [0.34, 0.24, 0.03], '#2C3445', { ambient: 0.4, shadowK: 0.8 });
    R3.cylinder(F, [base[0] - 0.1, base[1] + 0.05, base[2] + 0.03], [base[0] - 0.1, base[1] + 0.05, base[2] + height], 0.012, '#B8C2D0', { segments: 14, shadow: false, ambient: 0.45 });
    return [base[0] - 0.1, base[1] + 0.05];
  }
  /* an arm from the rod out to the drop line, with a boss clamp on the rod */
  function arm(F, rod, z, to, o) {
    BENCH.bossClamp(F, [rod[0], rod[1], z], o);
    R3.cylinder(F, [rod[0], rod[1], z], [to[0], to[1], z], 0.006, '#A8B2C0', { segments: 8, shadow: false, ambient: 0.5 });
  }
  /* a light gate lying flat: a U-frame around the drop line, the beam across it (red when broken) */
  function dropGate(F, at, rod, o) {
    o = o || {};
    const gap = 0.07, arm0 = [rod[0], rod[1], at[2]];
    arm(F, rod, at[2], [at[0] - gap / 2 - 0.02, at[1], 0], {});
    const col = '#2F3A52', A = [at[0], at[1] - gap / 2, at[2]], B = [at[0], at[1] + gap / 2, at[2]];
    R3.box(F, [at[0] - gap / 2 - 0.012, at[1], at[2]], [0.024, gap + 0.05, 0.03], col, { shadow: false, ambient: 0.45 });
    [A, B].forEach(p => R3.box(F, [p[0] + 0.006, p[1] + (p === A ? -0.012 : 0.012), p[2]], [0.05, 0.024, 0.03], col, { shadow: false, ambient: 0.45 }));
    R3.sphere(F, [A[0] + 0.02, A[1] - 0.001, A[2]], 0.004, o.blocked ? '#FF3B3B' : '#FF8A7A', { shadow: false, vivid: true });
    R3.polyline(F, [[A[0] + 0.02, A[1], A[2]], [B[0] + 0.02, B[1], B[2]]], o.blocked ? 'rgba(255,60,60,.25)' : '#FF4B4B', { alpha: o.blocked ? 0.3 : 0.9, width: 1.6, bias: -0.02 });
    void arm0;
  }
  /* the release: a small clamp with two jaws that open, its cable running to the timer */
  function releaseClamp(F, at, rod, open, o) {
    arm(F, rod, at[2] + 0.03, [at[0] - 0.03, at[1], 0], {});
    R3.box(F, [at[0] - 0.02, at[1], at[2] + 0.03], [0.04, 0.03, 0.03], '#3A4458', { shadow: false, ambient: 0.45 });
    const j = 0.012 + (open ? 0.012 : 0);
    [-1, 1].forEach(sg => R3.box(F, [at[0] + 0.004, at[1] + sg * j, at[2] + 0.012], [0.012, 0.006, 0.03], '#C9A04A', { shadow: false, ambient: 0.5 }));
  }
  /* a wooden box of sand under the drop, with the dimples of earlier landings */
  function sandBox(F, c, o) {
    o = o || {};
    const w = 0.22, d = 0.18, h = 0.07;
    BENCH.texBox(F, [c[0], c[1], h / 2], [w, d, h], BENCH.wood('#9A6B3E', 6), { ambient: 0.5, tiles: 1, skipBottom: true });
    const sandKey = 'sand';
    if (!cache[sandKey]) {
      const cv = canvas(128, 128), x = cv.getContext('2d'), r = rng(9);
      x.fillStyle = '#D9C49A'; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 1400; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,90,50,.25)' : 'rgba(255,245,220,.35)'; x.fillRect(r() * 128, r() * 128, 1, 1); }
      cache[sandKey] = cv;
    }
    R3.texPlane(F, [c[0], c[1], h - 0.004], [w / 2 - 0.008, 0, 0], [0, d / 2 - 0.008, 0], cache[sandKey], { bias: -0.001, grid: 2 });
    (o.dimples || []).forEach(p => F.push([p[0], p[1], h - 0.003], () => { const q = F.cam.project([p[0], p[1], h - 0.003]); if (!q.ok) return; const g = F.ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 7); g.addColorStop(0, 'rgba(90,65,35,.45)'); g.addColorStop(1, 'rgba(90,65,35,0)'); F.ctx.fillStyle = g; F.ctx.fillRect(q.x - 7, q.y - 7, 14, 14); }, -0.002));
    return h - 0.004;
  }
  /* the balls: chrome steel, a glass marble with its coloured twist, a matte ping-pong ball with its seam */
  function ball(F, c, kind, r, o) {
    o = o || {};
    const q = F.cam.project(c);
    if (!q.ok) return;
    const rp = r * q.s;
    F.push(c, () => {
      const ctx = F.ctx;
      ctx.save();
      if (o.ghost) ctx.globalAlpha = o.ghost;
      if (kind === 'steel') {
        const g = ctx.createRadialGradient(q.x - rp * 0.35, q.y - rp * 0.4, rp * 0.05, q.x, q.y, rp);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.25, '#D8DEE6'); g.addColorStop(0.55, '#6E7884'); g.addColorStop(0.8, '#C6CED8'); g.addColorStop(1, '#3A424C');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, rp, 0, TAU); ctx.fill();
      } else if (kind === 'marble') {
        const g = ctx.createRadialGradient(q.x - rp * 0.3, q.y - rp * 0.35, rp * 0.05, q.x, q.y, rp);
        g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.3, 'rgba(190,230,245,.55)'); g.addColorStop(1, 'rgba(60,120,150,.75)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, rp, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(230,80,60,.85)'; ctx.lineWidth = Math.max(1, rp * 0.28); ctx.beginPath(); ctx.moveTo(q.x - rp * 0.5, q.y + rp * 0.3); ctx.bezierCurveTo(q.x - rp * 0.1, q.y - rp * 0.5, q.x + rp * 0.2, q.y + rp * 0.5, q.x + rp * 0.5, q.y - rp * 0.2); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(q.x - rp * 0.3, q.y - rp * 0.35, rp * 0.1, q.x, q.y, rp);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EDEDE8'); g.addColorStop(1, '#B9BCC0');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, rp, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(160,160,160,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(q.x, q.y, rp, rp * 0.28, 0.3, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }, o.bias);
  }

  /* ---------------- a paper helicopter ----------------
     c: the bottom of its body (where the clips hang); d: { L, w (blade length, width, cm), clips, colour,
     paper }; phi: how far it has turned; o.flutter 0..1 bends the blades; o.scale enlarges it (the close-up).
     The body is a creased strip, the blades lie out either way from its top, pitched and coned as they are
     in flight; paper clips hang at the foot. */
  const BLADE = { white: '#F4F3EE', red: '#E0524A', blue: '#4F7FD8' };
  function helicopter(F, c, d, phi, o) {
    o = o || {};
    const k = o.scale || 1, Lb = d.L / 100 * k, wb = d.w / 100 * k, body = 0.07 * k, bw = wb * 0.9, ir = o.ir;
    const paperCol = d.paper === 'card' ? '#E9E1CF' : d.paper === 'tissue' ? '#F6F0F2' : '#F6F5F0';
    const bladeCol = d.colour && d.colour !== 'white' ? BLADE[d.colour] : paperCol;
    const cs = Math.cos(phi), sn = Math.sin(phi);
    const R = (x, y, z) => [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs, c[2] + z];
    const two = (pts, col) => {                               // paper is two-sided: shade whichever face the camera sees
      const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))), toCam = sub(F.cam.eye, pts[0]);
      face(F, (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2]) >= 0 ? pts : pts.slice().reverse(), col, { ambient: 0.55, edge: 'rgba(120,110,90,.55)', bias: o.bias });
    };
    // the body: two halves of a strip folded along its middle, a V seen from below
    const crease = 0.25 * bw;
    two([R(-bw / 2, -crease * 0.3, 0), R(0, crease * 0.3, 0), R(0, crease * 0.3, body), R(-bw / 2, -crease * 0.3, body)], paperCol);
    two([R(0, crease * 0.3, 0), R(bw / 2, -crease * 0.3, 0), R(bw / 2, -crease * 0.3, body), R(0, crease * 0.3, body)], paperCol);
    // the blades: each pitched about its own length and coned up; a long thin blade flutters (bends up at the tip)
    const pitch = 0.18, cone = 0.14 + (o.flutter || 0) * 0.35;
    [-1, 1].forEach(sg => {
      const n = 6, strip = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, bend = (o.flutter || 0) * 0.5 * u * u * Math.sin((o.t || 0) * 23 + sg);
        const x = sg * (bw / 2 + u * Lb * Math.cos(cone)), z = body + u * Lb * Math.sin(cone) + bend * Lb * 0.3;
        const tw = pitch * sg;
        strip.push([R(x, -wb / 2 * Math.cos(tw), z - wb / 2 * Math.sin(tw)), R(x, wb / 2 * Math.cos(tw), z + wb / 2 * Math.sin(tw))]);
      }
      for (let i = 0; i < n; i++) two([strip[i][0], strip[i + 1][0], strip[i + 1][1], strip[i][1]], bladeCol);
    });
    // paper clips at the foot
    for (let q = 0; q < d.clips; q++) {
      const zz = -0.004 * k - q * 0.0025 * k, loop = [];
      for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU; loop.push(R(0.004 * k * Math.cos(a) + (q - (d.clips - 1) / 2) * 0.004 * k, 0.001 * k, zz + 0.012 * k * (0.5 + 0.5 * Math.sin(a)))); }
      R3.polyline(F, loop, '#AEB6C2', { width: Math.max(1, 1.2 * k), bias: (o.bias || 0) - 0.001 });
    }
  }

  /* ---------------- the drop frame: two uprights, a crossbar with the release clip, light gates, a mat ----------------
     x0, x1: the uprights; y: their line; H: the drop height (release to floor); gates: [z…] heights of the beams. */
  function dropFrame(F, x0, x1, y, H, gates, o) {
    o = o || {};
    const post = '#B9C1CB', top = H + 0.12;
    [x0, x1].forEach(x => { R3.box(F, [x, y, 0.02], [0.12, 0.3, 0.04], '#2C3445', { ambient: 0.4 }); R3.cylinder(F, [x, y, 0.04], [x, y, top], 0.014, post, { segments: 12, shadow: false, ambient: 0.45 }); });
    R3.cylinder(F, [x0, y, top], [x1, y, top], 0.012, post, { segments: 10, shadow: false, ambient: 0.5 });
    (o.release || []).forEach(rx => { R3.box(F, [rx, y, top - 0.03], [0.03, 0.03, 0.05], '#3A4458', { shadow: false }); R3.box(F, [rx, y - 0.012, H + 0.02], [0.02, 0.012, 0.04], '#C9A04A', { shadow: false }); });
    gates.forEach(g => {
      const z = g.z, blocked = g.blocked;
      [x0, x1].forEach(x => R3.box(F, [x + (x < (x0 + x1) / 2 ? 0.03 : -0.03), y, z], [0.05, 0.05, 0.035], '#2F3A52', { shadow: false, ambient: 0.45 }));
      R3.sphere(F, [x0 + 0.06, y, z], 0.006, blocked ? '#FF3B3B' : '#FF8A7A', { shadow: false, vivid: true });
      R3.polyline(F, [[x0 + 0.06, y, z], [x1 - 0.06, y, z]], blocked ? 'rgba(255,60,60,.35)' : '#FF4B4B', { alpha: blocked ? 0.35 : 0.85, width: 1.6, bias: -0.02 });
    });
    // the landing mat
    R3.box(F, [(x0 + x1) / 2, y, 0.01], [x1 - x0 - 0.1, 0.5, 0.02], '#3E5F8A', { ambient: 0.45, shadow: false, bias: F.GROUND - 1 });
  }
  /* a tape measure fixed up the wall, numbered in centimetres */
  function wallTape(F, x, y, H) {
    const img = BENCH.ruleTex ? BENCH.ruleTex(Math.round(H * 100), 0) : null;
    if (!img) return;
    const w = 0.028, P0 = [x - w / 2, y, 0], P1 = [x - w / 2, y, H], P3 = [x + w / 2, y, 0];
    F.push([x, y, H / 2], () => BENCH.faceTex(F.ctx, F.cam, img, P0, P1, P3, Math.max(1, Math.round(H / 0.25)), null), F.GROUND + 1);
  }

  /* ---------------- the skin under a fingertip: a textbook plate ----------------
     prof: { layers: [{ name, d (m), col }], x: [depth m], T: [°C] } — the object on top, the
     glove if any, the skin below; the temperature painted as the camera's palette and drawn as
     a profile; the pain line (45 °C) and the depth the heat has reached. */
  function skinPlate(ctx, x, y, w, h, prof, o) {
    o = o || {};
    ctx.save();
    const total = prof.layers.reduce((u, L) => u + L.d, 0), top = y, px = d => top + d / total * h;
    // the layers, drawn as tissue, each tinted by its temperature where it sits
    let d0 = 0;
    prof.layers.forEach(L => {
      const y0 = px(d0), y1 = px(d0 + L.d);
      ctx.fillStyle = L.col; ctx.fillRect(x, y0, w, y1 - y0);
      if (L.cells) {                                              // the living layers: a hint of cells and a capillary loop
        ctx.strokeStyle = 'rgba(120,60,60,.25)'; ctx.lineWidth = 0.7;
        for (let yy = y0 + 4; yy < y1 - 2; yy += 6) for (let xx = x + ((yy / 6) % 2) * 5; xx < x + w; xx += 10) { ctx.beginPath(); ctx.ellipse(xx, yy, 4, 2.4, 0, 0, TAU); ctx.stroke(); }
      }
      if (L.vessels) {
        ctx.strokeStyle = 'rgba(190,40,50,.55)'; ctx.lineWidth = 1.4;
        for (let k = 0; k < 3; k++) { const vx = x + w * (0.2 + 0.3 * k); ctx.beginPath(); ctx.moveTo(vx - 5, y1); ctx.bezierCurveTo(vx - 6, y0 + 4, vx + 6, y0 + 4, vx + 5, y1); ctx.stroke(); }
      }
      d0 += L.d;
    });
    // the temperature: the camera palette as a translucent wash, 30 → 100 °C
    for (let i = 0; i < prof.x.length - 1; i++) {
      const y0 = px(prof.x[i]), y1 = px(prof.x[i + 1]), f = clamp((prof.T[i] - 30) / 70, 0, 1);
      ctx.fillStyle = rgba(iron(0.2 + f * 0.8), 0.18 + 0.5 * f); ctx.fillRect(x, y0, w, Math.max(1, y1 - y0));
    }
    // names of the layers
    d0 = 0; ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    prof.layers.forEach(L => { const yc = px(d0 + L.d / 2); if (px(d0 + L.d) - px(d0) > 9) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,16,.75)'; ctx.strokeText(L.name, x + 6, yc); ctx.fillStyle = '#F4F7FC'; ctx.fillText(L.name, x + 6, yc); } d0 += L.d; });
    // the profile: temperature against depth, 30 °C at the left edge of the curve area to 100 °C at the right
    const cx0 = x + w * 0.52, cx1 = x + w - 8, tx = T => cx0 + (clamp(T, 25, 100) - 25) / 75 * (cx1 - cx0);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    [45].forEach(T => { ctx.beginPath(); ctx.moveTo(tx(T), top); ctx.lineTo(tx(T), top + h); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,200,190,.9)'; ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('45 °C pain', tx(45), top + h - 2);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath();
    prof.x.forEach((d, i) => { const X = tx(prof.T[i]), Y = px(d); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    if (o.surface != null) {
      const Y = px(o.surface);
      ctx.strokeStyle = 'rgba(255,230,120,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, Y); ctx.lineTo(x + w, Y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,210,230,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, top + 0.5, w - 1, h - 1);
    ctx.restore();
  }

  window.MEAS = { iron, apparent, irc, irScale, epoxyTex, bench, tileWall, rail, face, extrude, ringPts, hull2, path, hotplate, beaker, steam, tongs, mat, mitt, gloveBox, fumeCupboard, stirBar, droppingFunnel, dropsFall, spatter, bottle, washBottle, iceBath, balance, boat, gradCylinder, eurekaCan, mineral, tray, loupe, LUSTRE, towerStand, arm, dropGate, releaseClamp, sandBox, ball, helicopter, dropFrame, wallTape, BLADE, skinPlate, rng, canvas };
})();
