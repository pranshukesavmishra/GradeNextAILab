/* ============================================================
   GEO — the Earth-system figures: the planet cut open, and what the
   four-sphere labs draw on it and around it.

   The face a cutaway globe shows (EARTH.trace's cut option): every layer
   at its PREM radius, coloured from dull red to white-hot with depth,
   solid rock grained, the liquid outer core streaming as it turns. Seismic
   rays drawn in that face, with the wavefronts joining their tips; a
   quake's star and a seismometer on the rim. Balls of water standing on
   the globe; a map pin; an arrow that carries particles at its flow's pace.
   The sky from a rising balloon — its colour set by how much air is left
   above, the horizon dipping and curving as it climbs, cloud decks
   passing below — and the balloon itself, swelling, then bursting.
   Everything here draws what a lab computed; nothing here computes science.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const css = (c, al) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al == null ? 1 : al) + ')';
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------------- a smooth value noise, tiled and periodic ---------------- */
  const NZ = 256;
  let NOISE = null;
  function noiseTex() {
    if (NOISE) return NOISE;
    let s = 1234567;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const base = new Float32Array(32 * 32), fine = new Float32Array(NZ * NZ);
    for (let i = 0; i < base.length; i++) base[i] = rnd();
    for (let i = 0; i < fine.length; i++) fine[i] = rnd();
    const g = (x, y) => base[((y & 31) << 5) + (x & 31)];
    NOISE = new Float32Array(NZ * NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NZ; i++) {
      const fx = i / NZ * 32, fy = j / NZ * 32, x0 = Math.floor(fx), y0 = Math.floor(fy);
      let ax = fx - x0, ay = fy - y0;
      ax = ax * ax * (3 - 2 * ax); ay = ay * ay * (3 - 2 * ay);
      const v = g(x0, y0) * (1 - ax) * (1 - ay) + g(x0 + 1, y0) * ax * (1 - ay) + g(x0, y0 + 1) * (1 - ax) * ay + g(x0 + 1, y0 + 1) * ax * ay;
      NOISE[j * NZ + i] = v * 0.82 + fine[j * NZ + i] * 0.18;
    }
    return NOISE;
  }
  function nz(u, v) {
    const i = ((Math.floor(u * NZ) % NZ) + NZ) % NZ, j = ((Math.floor(v * NZ) % NZ) + NZ) % NZ;
    return NOISE[j * NZ + i];
  }

  /* ---------------- the inside of the Earth ----------------
     PREM's boundaries as fractions of the radius: the Moho, the bottom of the
     upper mantle (670 km), the core–mantle boundary, the inner-core boundary */
  const MOHO = 6346.6 / 6371, TZ = 5701 / 6371, CMB = 3480 / 6371, ICB = 1221.5 / 6371;
  const LAYERS = { MOHO, TZ, CMB, ICB };
  // hotter is brighter: the upper mantle a dull red, the core orange to white
  const UT = [132, 48, 30], UB = [166, 62, 34], LT = [170, 64, 34], LB = [214, 92, 42];
  const OT = [236, 136, 46], OB = [252, 184, 72], IT = [255, 222, 140], IM = [255, 244, 212];
  const ST = [204, 100, 50], SB = [232, 142, 70], SI = [240, 168, 92];      // a what-if solid core: hot rock
  /* the face a cutaway Earth shows. o.outer 'liquid' | 'solid', o.inner 'solid' | 'liquid', o.phase in seconds */
  function interiorFace(o) {
    noiseTex();
    const ph = o.phase || 0, outerSolid = o.outer === 'solid', innerLiquid = !outerSolid && o.inner === 'liquid';
    return function (u, v, out) {
      const r = Math.sqrt(u * u + v * v);
      if (r > MOHO) { out[0] = 150; out[1] = 118; out[2] = 86; return; }             // the crust: a hair's width at this scale
      let a, b, f, tex;
      if (r > TZ) { a = UT; b = UB; f = (MOHO - r) / (MOHO - TZ); tex = 0.90 + 0.18 * nz(u * 2.6 + 0.37, v * 2.6 + 0.11); }
      else if (r > CMB) { a = LT; b = LB; f = (TZ - r) / (TZ - CMB); tex = 0.91 + 0.16 * nz(u * 1.9 + 0.71, v * 1.9 + 0.53); }
      else if (outerSolid) {
        a = r > ICB ? ST : SB; b = r > ICB ? SB : SI; f = r > ICB ? (CMB - r) / (CMB - ICB) : (ICB - r) / ICB;
        tex = 0.90 + 0.18 * nz(u * 2.6 + 0.13, v * 2.6 + 0.29);
      } else if (r > ICB || innerLiquid) {
        // liquid iron streams round: the noise is read along circles that turn, faster deeper down
        const ang = Math.atan2(v, u) / TAU + ph * (0.010 + 0.022 * (CMB - r) / CMB);
        tex = 0.86 + 0.26 * nz(ang * 3, r * 5.5 + 0.2 * nz(ang * 2 + 0.5, r * 2));
        a = OT; b = OB; f = (CMB - r) / (CMB - (innerLiquid ? 0 : ICB));
      } else { a = IT; b = IM; f = (ICB - r) / ICB; tex = 0.95 + 0.09 * nz(u * 6 + 0.3, v * 6 + 0.8); }
      let R = (a[0] + (b[0] - a[0]) * f) * tex, G = (a[1] + (b[1] - a[1]) * f) * tex, B = (a[2] + (b[2] - a[2]) * f) * tex;
      // each boundary a thin dark line: the jumps the waves feel
      const d = Math.min(Math.abs(r - TZ), Math.abs(r - CMB), innerLiquid || outerSolid ? 1 : Math.abs(r - ICB), Math.abs(r - MOHO));
      if (d < 0.004) { const k = 0.55 + 0.45 * d / 0.004; R *= k; G *= k; B *= k; }
      out[0] = R > 255 ? 255 : R; out[1] = G > 255 ? 255 : G; out[2] = B > 255 ? 255 : B;
    };
  }

  /* ---------------- rays in the cut face ----------------
     A point r km from the centre, θ radians round from the quake, sits at
     C + (r/6371)·R·(sin θ·e1 + cos θ·e2). */
  function facePoint(cam, C, R, ax, r, th) {
    const k = r / 6371 * R, s = Math.sin(th), c = Math.cos(th), e1 = ax.e1, e2 = ax.e2;
    return cam.project([C[0] + k * (s * e1[0] + c * e2[0]), C[1] + k * (s * e1[1] + c * e2[1]), C[2] + k * (s * e1[2] + c * e2[2])]);
  }
  const WAVE = { P: [111, 231, 255], S: [255, 139, 216] };
  /* one ray's path up to time tNow: screen points, and its tip (or null when it has not started) */
  function rayUpTo(cam, C, R, ax, ray, tNow, side) {
    const out = [], P = ray.pts;
    let tip = null;
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      if (q[2] <= tNow) { const s = facePoint(cam, C, R, ax, q[0], side * q[1]); if (s.ok) out.push(s); continue; }
      if (i > 0) {
        const a = P[i - 1], f = (tNow - a[2]) / (q[2] - a[2]);
        const s = facePoint(cam, C, R, ax, a[0] + (q[0] - a[0]) * f, side * (a[1] + (q[1] - a[1]) * f));
        if (s.ok) { out.push(s); tip = s; }
      }
      return { pts: out, tip, done: false };
    }
    return { pts: out, tip: null, done: true };
  }
  /* the fan: every ray's path so far, the wavefront joining the tips of neighbouring rays of the
     same kind, and a flash where an S wave dies at the liquid core.
     list: [{ pts: [[r, θ, t]…], w: 'P'|'S', b: branch, i0, stop, hl }] sorted by take-off angle */
  function rayFan(ctx, cam, C, R, ax, list, tNow, o) {
    o = o || {};
    const Rpx = (() => { const a = facePoint(cam, C, R, ax, 6371, 0), c = facePoint(cam, C, R, ax, 0, 0); return a.ok && c.ok ? Math.hypot(a.x - c.x, a.y - c.y) : 200; })();
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const sides = o.oneSide ? [1] : [1, -1];
    for (const side of sides) {
      const tips = { P: [], S: [] };
      for (const ray of list) {
        const col = WAVE[ray.w], U = rayUpTo(cam, C, R, ax, ray, tNow, side);
        if (U.pts.length > 1) {
          // a dark underlay keeps the ray legible on the bright core
          ctx.strokeStyle = 'rgba(10,6,4,' + (ray.hl ? 0.55 : U.done ? 0.10 : 0.30) + ')'; ctx.lineWidth = ray.hl ? 4.6 : 2.6;
          ctx.beginPath(); U.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
          ctx.strokeStyle = css(col, ray.hl ? 1 : U.done ? 0.45 : 0.66); ctx.lineWidth = ray.hl ? 2.4 : U.done ? 1.0 : 1.3;
          ctx.beginPath(); U.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
        }
        if (U.tip) tips[ray.w].push({ q: U.tip, b: ray.b, i0: ray.i0 });
        // an S wave that reaches the liquid core goes no further: a brief flash where it dies
        if (ray.stop != null && U.done) {
          const end = ray.pts[ray.pts.length - 1], age = tNow - end[2];
          if (age >= 0 && age < 90) {
            const s = facePoint(cam, C, R, ax, end[0], side * end[1]);
            if (s.ok) {
              const k = 1 - age / 90;
              ctx.strokeStyle = css(col, 0.8 * k); ctx.lineWidth = 1.4;
              ctx.beginPath(); ctx.arc(s.x, s.y, 2 + 7 * (1 - k), 0, TAU); ctx.stroke();
            }
          }
        }
      }
      // the wavefronts
      for (const w of ['P', 'S']) {
        const T = tips[w];
        if (T.length < 1) continue;
        T.sort((a, b) => a.i0 - b.i0);
        ctx.strokeStyle = css(mixc(WAVE[w], [255, 255, 255], 0.45), 0.92); ctx.lineWidth = 2.2;
        ctx.shadowColor = css(WAVE[w], 0.9); ctx.shadowBlur = 8;
        ctx.beginPath();
        let open = false;
        for (let i = 0; i < T.length; i++) {
          const a = T[i], p = T[i - 1];
          const join = p && p.b === a.b && Math.hypot(a.q.x - p.q.x, a.q.y - p.q.y) < Rpx * 0.16;
          if (!join) { if (open) ctx.stroke(); ctx.beginPath(); ctx.moveTo(a.q.x, a.q.y); open = true; }
          else ctx.lineTo(a.q.x, a.q.y);
        }
        if (open) ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        T.forEach(a => { ctx.beginPath(); ctx.arc(a.q.x, a.q.y, 1.6, 0, TAU); ctx.fill(); });
      }
    }
    ctx.restore();
  }
  /* the quake: a jagged star with a pulse that spreads when it strikes */
  function quakeStar(ctx, x, y, s, age) {
    ctx.save();
    if (age != null && age >= 0 && age < 3) {
      const k = age / 3;
      ctx.strokeStyle = 'rgba(255,214,120,' + (0.8 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, s * (1 + 5 * k), 0, TAU); ctx.stroke();
    }
    ctx.shadowColor = 'rgba(255,170,60,.9)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFD166'; ctx.strokeStyle = '#7A2E0E'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU - Math.PI / 2, rr = i % 2 ? s * 0.45 : s * (i % 4 ? 0.85 : 1.15);
      i ? ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)) : ctx.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
  }
  /* a seismometer on its pier, standing on the rim and facing out (ang: the outward direction on screen).
     o.flash: 0..1 as a wave arrives; o.col: that wave's colour; o.held when the student has it */
  function seismometer(ctx, x, y, ang, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2);
    if (o.flash > 0) {
      ctx.fillStyle = css(o.col || [255, 255, 255], 0.35 * o.flash);
      ctx.beginPath(); ctx.arc(0, -s * 0.9, s * (1.3 + 0.6 * o.flash), 0, TAU); ctx.fill();
    }
    // the concrete pier, the case, the drum with its trace, the pen
    ctx.fillStyle = '#5B6270'; ctx.fillRect(-s * 0.75, -s * 0.28, s * 1.5, s * 0.28);
    const gr = ctx.createLinearGradient(0, -s * 1.7, 0, -s * 0.28);
    gr.addColorStop(0, '#E7EBF1'); gr.addColorStop(1, '#AAB2BF');
    ctx.fillStyle = gr; ctx.strokeStyle = '#1B2230'; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-s * 0.62, -s * 1.7, s * 1.24, s * 1.42, s * 0.18); else ctx.rect(-s * 0.62, -s * 1.7, s * 1.24, s * 1.42);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1B2230';
    ctx.beginPath(); ctx.ellipse(0, -s * 1.0, s * 0.42, s * 0.30, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = o.flash > 0 ? css(o.col || [255, 80, 80], 1) : '#C0392B'; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const xx = -s * 0.34 + i / 12 * s * 0.68, amp = (o.flash || 0) * s * 0.18 * Math.sin(i * 2.3); i ? ctx.lineTo(xx, -s * 1.0 + amp) : ctx.moveTo(xx, -s * 1.0 + amp); }
    ctx.stroke();
    if (o.held) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(0, -s * 0.95, s * 1.25, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  }

  /* ---------------- water, pins and flows on the globe ---------------- */
  /* a ball of water standing on the globe: glassy, lit from the upper left, its shadow on the ground */
  function waterBall(ctx, x, y, r, col, o) {
    o = o || {};
    const c = typeof col === 'string' ? hex(col) : col;
    ctx.save();
    if (o.ground) {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(o.ground.x, o.ground.y, r * 0.95, r * 0.28, o.ground.ang || 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = o.alpha == null ? 0.94 : o.alpha;
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.05, x, y, r);
    g.addColorStop(0, css(mixc(c, [255, 255, 255], 0.65)));
    g.addColorStop(0.45, css(c));
    g.addColorStop(1, css(mixc(c, [4, 12, 30], 0.55)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    // light caught in the far side of the water, and the rim of the glass-like surface
    const g2 = ctx.createRadialGradient(x + r * 0.35, y + r * 0.40, 0, x + r * 0.35, y + r * 0.40, r * 0.65);
    g2.addColorStop(0, css(mixc(c, [255, 255, 255], 0.35), 0.55)); g2.addColorStop(1, css(c, 0));
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = css(mixc(c, [255, 255, 255], 0.6), 0.55); ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, 0, TAU); ctx.stroke();
    if (r > 4) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.40, y - r * 0.46, r * 0.16, r * 0.09, -0.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  /* a map pin: a stick from the ground point, a round head in the pin's colour */
  function pin(ctx, gx, gy, hx, hy, col, o) {
    o = o || {};
    const r = o.r || 5;
    ctx.save();
    ctx.strokeStyle = 'rgba(20,24,32,.85)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(gx, gy, 2.6, 1.2, 0, 0, TAU); ctx.fill();
    if (o.sel) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
    const g = ctx.createRadialGradient(hx - r * 0.35, hy - r * 0.35, 0.5, hx, hy, r);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    if (o.sel) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, hy, r + 2.5, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  /* an arrow along a bend from a to b that carries particles: n and speed from its flow.
     o.w line width, o.col, o.phase (s), o.rate (particles' laps per second), o.label, o.dash */
  function fluxArrow(ctx, a, b, bend, o) {
    o = o || {};
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / L * bend, cy = my + dx / L * bend;
    const at = u => ({ x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y });
    const col = o.col || '#9FD4FF', w = o.w || 2;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.globalAlpha *= 0.55;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha /= 0.55;
    // the head, along the curve's last direction
    const e = at(0.97), hx = b.x - e.x, hy = b.y - e.y, hl = Math.hypot(hx, hy) || 1, ux = hx / hl, uy = hy / hl, hs = 5 + w * 1.4;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - ux * hs - uy * hs * 0.55, b.y - uy * hs + ux * hs * 0.55);
    ctx.lineTo(b.x - ux * hs + uy * hs * 0.55, b.y - uy * hs - ux * hs * 0.55); ctx.closePath(); ctx.fill();
    // particles riding the flow
    if (o.rate > 0) {
      const n = Math.max(2, Math.round(L / 26));
      ctx.fillStyle = o.dot || '#FFFFFF';
      for (let k = 0; k < n; k++) {
        const u = ((o.phase || 0) * o.rate + k / n) % 1, p = at(u * 0.94);
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.95;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.3, w * 0.45), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (o.label) {
      const p = at(o.at == null ? 0.5 : o.at);
      ctx.font = o.font || '600 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(o.label).width + 8;
      ctx.fillStyle = 'rgba(6,10,20,.82)'; ctx.fillRect(p.x - tw / 2, p.y - 7, tw, 14);
      ctx.fillStyle = o.labelCol || col; ctx.fillText(o.label, p.x, p.y);
    }
    ctx.restore();
    return { mid: at(0.5) };
  }

  /* ---------------- the sky seen from a balloon ---------------- */
  /* the sky's colour at a height, from how much of the air is left above (1 at the ground) */
  function skyColours(airAbove) {
    const f = Math.pow(clamp(airAbove, 0, 1), 0.45), g = Math.sqrt(f);
    return { zenith: mixc([4, 6, 20], [66, 136, 228], Math.pow(f, 1.25)), horizon: mixc([44, 72, 138], [186, 214, 248], g), f };
  }
  /* soft cumulus built from overlapping discs, lit from above */
  function cloud(ctx, x, y, w, h, seed, alpha, lit) {
    ctx.save();
    ctx.globalAlpha = alpha;
    let s = seed * 9301 + 49297;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, cx = x - w / 2 + u * w, bump = Math.sin(u * Math.PI);
      const r = h * (0.35 + 0.45 * bump) * (0.8 + 0.4 * rnd()), cy = y - bump * h * 0.25 + (rnd() - 0.5) * h * 0.15;
      const g = ctx.createRadialGradient(cx, cy - r * 0.35, r * 0.1, cx, cy, r);
      g.addColorStop(0, css(lit || [255, 255, 255], 1)); g.addColorStop(0.7, css(mixc(lit || [255, 255, 255], [150, 165, 190], 0.4), 0.9)); g.addColorStop(1, css([150, 165, 190], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  /* ---------------- the ground and clouds, seen from a height ----------------
     A pinhole camera at height z km over a round Earth, pitched up by `pitch`.
     Each ground pixel is a ray to the sphere; the field it lands in comes from
     the noise, and the air between fades it toward the horizon's haze. */
  let GROUND = null;
  function groundLayer(w, h, st, f, cx, cy, pitch) {
    noiseTex();
    const RE = 6371, z = Math.max(0.002, st.z), gw = Math.max(1, Math.round(w / 2)), gh = Math.max(1, Math.round(h / 2));
    if (!GROUND) { GROUND = document.createElement('canvas'); GROUND.ctx = GROUND.getContext('2d'); }
    if (GROUND.width !== gw || GROUND.height !== gh) { GROUND.width = gw; GROUND.height = gh; GROUND.img = null; }
    if (!GROUND.img) GROUND.img = GROUND.ctx.createImageData(gw, gh);
    const px = GROUND.img.data, haze = st.haze, cp = Math.cos(pitch), sp = Math.sin(pitch);
    const drift = (st.phase || 0) * 0.02, oz = RE + z;
    for (let j = 0; j < gh; j++) {
      const v = (cy - (j + 0.5) * 2) / f;                                   // up on screen is +v
      for (let i = 0; i < gw; i++) {
        const u = ((i + 0.5) * 2 - cx) / f, k = (j * gw + i) * 4;
        // the ray in world axes: x across, y ahead, z up — pitched up
        let dx = u, dy = cp - v * sp, dz = sp + v * cp;
        const L = Math.sqrt(dx * dx + dy * dy + dz * dz); dx /= L; dy /= L; dz /= L;
        const b = oz * dz, disc = b * b - (oz * oz - RE * RE);
        if (dz >= 0 || disc <= 0) { px[k + 3] = 0; continue; }
        const t = -b - Math.sqrt(disc);
        const gx = t * dx, gy = t * dy + drift;
        // fields a kilometre or two across, in larger regions of forest, farmland and dry grass
        const reg = nz(gx / 60 + 0.31, gy / 60 + 0.77), fld = nz(gx / 2.2 + 0.13, gy / 2.2 + 0.41), q = Math.floor(fld * 6) / 6;
        let R, G, B;
        if (reg < 0.42) { R = 44 + 30 * q; G = 78 + 26 * q; B = 42 + 10 * q; }             // woodland
        else if (reg < 0.68) { R = 96 + 70 * q; G = 112 + 50 * q; B = 56 + 20 * q; }       // farmland
        else { R = 140 + 40 * q; G = 126 + 30 * q; B = 86 + 16 * q; }                      // dry grass
        const hz = 1 - Math.exp(-t / (22 * (1 + z / 3)));
        px[k] = R + (haze[0] - R) * hz; px[k + 1] = G + (haze[1] - G) * hz; px[k + 2] = B + (haze[2] - B) * hz; px[k + 3] = 255;
      }
    }
    GROUND.ctx.putImageData(GROUND.img, 0, 0);
    return GROUND;
  }
  /* soft cumulus sprites, drawn once: one lit from above (seen from over it), one with a grey base */
  const SPRITES = {};
  function cloudSprite(kind, seed) {
    const key = kind + seed;
    if (SPRITES[key]) return SPRITES[key];
    const c = document.createElement('canvas'); c.width = 160; c.height = 80;
    const x = c.getContext('2d');
    let s = seed * 7919 + 17;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const uu = (i + 0.5) / n, bump = Math.sin(uu * Math.PI);
      const r = 14 + 20 * bump * (0.7 + 0.5 * rnd()), px = 10 + uu * 140 + (rnd() - 0.5) * 10, py = 62 - bump * 22 - rnd() * 8;
      const g = x.createRadialGradient(px, py - r * 0.4, r * 0.1, px, py, r);
      const top = kind === 'below' ? [255, 255, 255] : [236, 240, 246], base = kind === 'below' ? [196, 206, 222] : [150, 160, 178];
      g.addColorStop(0, css(top, 1)); g.addColorStop(0.65, css(mixc(top, base, 0.5), 0.95)); g.addColorStop(1, css(base, 0));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    }
    // a flat base
    const gb = x.createLinearGradient(0, 56, 0, 70);
    gb.addColorStop(0, css(kind === 'below' ? [226, 232, 242] : [150, 160, 178], 0)); gb.addColorStop(1, css(kind === 'below' ? [200, 210, 225] : [132, 142, 160], 0.6));
    x.fillStyle = gb; x.fillRect(12, 56, 136, 10);
    return (SPRITES[key] = c);
  }
  /* a deck of clouds at height d.z, seeded, in perspective from a camera at z */
  function cloudDeck(ctx, d, st, f, cx, cy, pitch, x0, y0, w, h) {
    const RE = 6371, z = Math.max(0.002, st.z), rel = d.z - z;
    if (Math.abs(rel) < 0.05) return;
    let s = Math.round((d.seed || 0) * 1e6) + 11;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const list = [];
    const n = Math.round(70 * d.cover);
    for (let i = 0; i < n; i++) {
      const ahead = 1.5 + Math.pow(rnd(), 1.6) * 140, across = (rnd() * 2 - 1) * ahead * 1.1, size = (d.kind === 'cirrus' ? 6 : 1.4) * (0.6 + rnd() * 0.9);
      const ahead2 = ahead - ((st.phase || 0) * 0.02) % 4;
      if (ahead2 < 0.8) continue;
      // screen position, with the Earth's curve pulling far clouds down
      const drop = ahead2 * ahead2 / (2 * RE), dzv = rel - drop;
      const vy = Math.atan2(dzv, ahead2) - pitch, vx = Math.atan2(across, ahead2);
      const sx = cx + f * Math.tan(vx), sy = cy - f * Math.tan(vy);
      if (sx < x0 - 200 || sx > x0 + w + 200 || sy < y0 - 60 || sy > y0 + h + 60) continue;
      list.push({ sx, sy, ww: f * size / ahead2, ahead: ahead2, k: i % 3 });
    }
    list.sort((a, b) => b.ahead - a.ahead);
    ctx.save();
    list.forEach(c => {
      const fade = Math.exp(-c.ahead / 90);
      if (d.kind === 'cirrus') {
        // mares' tails: a few thin wisps, fading at their ends
        const ww = Math.min(c.ww, w * 0.5);
        ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) {
          const oy = (k - 1.5) * Math.max(1.5, ww * 0.012), a0 = 0.30 * d.cover * (0.4 + 0.6 * fade) * (1 - Math.abs(k - 1.5) / 3);
          const gr = ctx.createLinearGradient(c.sx - ww / 2, 0, c.sx + ww / 2, 0);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a0.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = gr; ctx.lineWidth = Math.max(0.6, ww * 0.008);
          ctx.beginPath(); ctx.moveTo(c.sx - ww / 2, c.sy + oy); ctx.quadraticCurveTo(c.sx + ww * 0.1 * (k - 1.5), c.sy + oy - ww * 0.03, c.sx + ww / 2, c.sy + oy + ww * 0.02); ctx.stroke();
        }
      } else {
        const sp = cloudSprite(rel < 0 ? 'below' : 'above', c.k), wwp = Math.max(4, c.ww), hh = wwp * 0.5;
        ctx.globalAlpha = (0.55 + 0.45 * fade) * (rel < 0 ? 0.95 : 0.85);
        ctx.drawImage(sp, c.sx - wwp / 2, c.sy - hh * 0.8, wwp, hh);
      }
    });
    ctx.restore();
  }
  /* the view from the gondola: looking out, pitched a little upward, 60° high.
     st: { z (km), airAbove (0..1), decks: [{ z, kind: 'cumulus'|'cirrus', cover, seed }], phase,
           balloon: { D (m), burst: bool, age (s since burst), scale (px per m) }, sun: [elev°, x-fraction] } */
  function skyView(ctx, x, y, w, h, st) {
    const RE = 6371, fov = 60 * Math.PI / 180, f = h / 2 / Math.tan(fov / 2), pitch = 5 * Math.PI / 180;
    const z = Math.max(0.002, st.z), dip = Math.acos(RE / (RE + z));
    const cx = x + w / 2, cy = y + h / 2, SK = skyColours(st.airAbove);
    const hy = u => cy + f * Math.tan(dip + pitch) / Math.cos(Math.atan(u / f));    // the horizon's screen height at x offset u (small-angle)
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const hz = hy(0), sg = ctx.createLinearGradient(0, y, 0, hz);
    sg.addColorStop(0, css(SK.zenith)); sg.addColorStop(0.7, css(mixc(SK.zenith, SK.horizon, 0.55))); sg.addColorStop(1, css(SK.horizon));
    ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
    if (st.sun) {
      const sx = x + w * st.sun[1], sy = cy - f * Math.tan(st.sun[0] * Math.PI / 180 - pitch), R0 = 40 + 70 * SK.f;
      const gl = ctx.createRadialGradient(sx, sy, 2, sx, sy, R0);
      gl.addColorStop(0, 'rgba(255,252,236,1)'); gl.addColorStop(0.12, 'rgba(255,246,214,.9)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx, sy, R0, 0, TAU); ctx.fill();
    }
    (st.decks || []).forEach(d => { if (d.z > z) cloudDeck(ctx, d, st, f, cx, cy, pitch, x, y, w, h); });
    // the ground, a round planet under a haze that thins as the balloon climbs
    const haze = mixc(SK.horizon, [214, 226, 244], 0.35);
    const G = groundLayer(w, h, { z, haze, phase: st.phase }, f, w / 2, h / 2, pitch);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(G, x, y, w, h);
    if (z > 4) {
      ctx.strokeStyle = 'rgba(150,196,255,' + clamp((z - 4) / 24, 0, 0.75).toFixed(3) + ')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = -w / 2 + i / 40 * w, yy = hy(u) - 1.5; i ? ctx.lineTo(cx + u, yy) : ctx.moveTo(cx + u, yy); } ctx.stroke();
    }
    (st.decks || []).forEach(d => { if (d.z <= z) cloudDeck(ctx, d, st, f, cx, cy, pitch, x, y, w, h); });
    const B = st.balloon;
    if (B) {
      const bx = x + w * 0.5, by = y + h * 0.30, s = B.scale;
      if (!B.burst) {
        balloonGlyph(ctx, bx, by, B.D * s / 2, st.phase || 0);
        const ny = by + B.D * s / 2 * 1.02;
        ctx.strokeStyle = 'rgba(240,240,240,.85)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx, ny); ctx.lineTo(bx + 1, y + h * 0.80); ctx.stroke();
        parachute(ctx, bx + 1, y + h * 0.66, 7, false);
        sonde(ctx, bx + 1, y + h * 0.80, 9);
      } else {
        const k = clamp(B.age / 2.5, 0, 1);
        ctx.fillStyle = 'rgba(245,240,230,' + (0.9 * (1 - k)).toFixed(3) + ')';
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * TAU + 0.3, rr = B.D * s / 2 * (1 + 1.8 * k);
          ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * rr, by + Math.sin(a) * rr + k * 40, 6 - 3 * k, 2.5, a, 0, TAU); ctx.fill();
        }
        parachute(ctx, bx, by + h * 0.18, 22, true);
        ctx.strokeStyle = 'rgba(240,240,240,.85)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx - 12, by + h * 0.18); ctx.lineTo(bx, by + h * 0.34); ctx.lineTo(bx + 12, by + h * 0.18); ctx.stroke();
        sonde(ctx, bx, by + h * 0.34, 10);
      }
    }
    ctx.restore();
    return { horizonY: hz, dip };
  }
  /* a latex sounding balloon, slightly pear-shaped, translucent, with its neck */
  function balloonGlyph(ctx, x, y, r, phase) {
    ctx.save();
    const wob = Math.sin(phase * 1.3) * 0.02;
    ctx.translate(x, y); ctx.rotate(wob);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.05);
    g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(0.5, 'rgba(236,232,222,.93)'); g.addColorStop(1, 'rgba(170,165,160,.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, r * 1.06);
    ctx.bezierCurveTo(r * 0.55, r * 0.95, r * 1.02, r * 0.45, r, -r * 0.05);
    ctx.bezierCurveTo(r * 0.98, -r * 0.62, r * 0.55, -r * 1.0, 0, -r * 1.0);
    ctx.bezierCurveTo(-r * 0.55, -r * 1.0, -r * 0.98, -r * 0.62, -r, -r * 0.05);
    ctx.bezierCurveTo(-r * 1.02, r * 0.45, -r * 0.55, r * 0.95, 0, r * 1.06);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.5, r * 0.18, r * 0.09, -0.7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#C9C2B4'; ctx.fillRect(-2.5, r * 1.02, 5, 6);
    ctx.restore();
  }
  function parachute(ctx, x, y, r, open) {
    ctx.save();
    ctx.fillStyle = open ? '#E8553F' : '#C4442F';
    if (open) {
      ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y - r * 1.2, x + r, y);
      for (let i = 4; i >= 0; i--) ctx.quadraticCurveTo(x - r + (i + 0.5) / 5 * 2 * r, y - r * 0.12, x - r + i / 5 * 2 * r, y);
      ctx.fill();
    } else { ctx.beginPath(); ctx.ellipse(x, y, r * 0.35, r, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function sonde(ctx, x, y, s) {
    ctx.save();
    ctx.fillStyle = '#F4F4F0'; ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 1;
    ctx.fillRect(x - s * 0.6, y, s * 1.2, s * 1.4); ctx.strokeRect(x - s * 0.6, y, s * 1.2, s * 1.4);
    ctx.strokeStyle = '#D0D4DA'; ctx.beginPath(); ctx.moveTo(x + s * 0.3, y + s * 1.4); ctx.lineTo(x + s * 0.3, y + s * 2.4); ctx.stroke();
    ctx.fillStyle = '#E8553F'; ctx.fillRect(x - s * 0.6, y + s * 0.5, s * 1.2, s * 0.18);
    ctx.restore();
  }

  window.GEO = { LAYERS, WAVE, interiorFace, facePoint, rayFan, rayUpTo, quakeStar, seismometer, waterBall, pin, fluxArrow,
                 skyColours, skyView, cloud, balloonGlyph, parachute, sonde, css, mixc, hex };
})();
