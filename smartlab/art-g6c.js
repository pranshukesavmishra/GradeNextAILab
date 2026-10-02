/* ============================================================
   G6C — the figure library of Grade 6 Unit C (energy, heat, thermal systems).
   Built on R3 / RX / BENCH / MEAS so it lights, sorts and reads like the rest
   of the suite. World metres, Z up, the bench top at z = 0.
     the energy bench — an aluminium dynamics track (any profile), a dynamics
       cart with its wheels, flag, mass bars and sail, a spring launcher, a
       block of modelling clay that keeps its dent, a solar simulator, a
       framed solar panel with its cells, a battery pack with its charge
       bar, a motor–pulley unit, a slotted mass on its hanger, a lamp (LED or
       filament), a kettle, a bicycle wheel with its brake, a phone and its
       charger;
     the 2D plates — an energy-flow (Sankey) diagram whose band widths are
       the joules, and an energy bar ledger.
   Nothing here computes science: it draws what the lab computed.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX, BENCH = window.BENCH;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale, norm, cross } = R3;
  const mix = RX.mix, rgba = RX.rgba;
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';

  /* the colours of the energy stores, used by every plate and plot in the unit */
  const FORM = {
    kinetic: '#4FC3F7', gravitational: '#9C7BFF', elastic: '#4DD9A8', thermal: '#FF7A45', chemical: '#F2C744',
    electrical: '#5D8BFF', light: '#FFE98A', sound: '#C9A2FF', heat: '#FF7A45', input: '#E8EEF8'
  };

  /* ---------------- a lit face, with optional depth bias ---------------- */
  function quad(F, P, colour, o) {
    o = o || {};
    const n = norm(cross(sub(P[1], P[0]), sub(P[2], P[0])));
    const c = P.reduce((u, p) => add(u, scale(p, 1 / P.length)), [0, 0, 0]);
    const col = o.flat ? colour : F.shade(colour, n, o);
    F.push(c, () => {
      const q = P.map(p => F.cam.project(p)); if (q.some(v => !v.ok)) return;
      const ctx = F.ctx; ctx.save();
      if (o.alpha != null) ctx.globalAlpha = o.alpha;
      ctx.fillStyle = col; ctx.beginPath(); q.forEach((v, k) => k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = o.edge || col; ctx.lineWidth = o.edge ? 0.8 : 0.6; ctx.stroke();
      if (o.after) o.after(ctx, q);
      ctx.restore();
    }, o.bias);
  }

  /* ============================================================
     THE TRACK — an extruded aluminium profile along any centre line
     pts: [{x, z, th}] in the x–z plane (y = y0); o.off [dx, dy, dz]
     ============================================================ */
  function track(F, pts, o) {
    o = o || {};
    const off = o.off || [0, 0, 0], W = 0.11, step = Math.max(1, Math.round((o.seg || 0.04) / 0.004));
    const P = []; for (let i = 0; i < pts.length; i += step) P.push(pts[i]); if (P[P.length - 1] !== pts[pts.length - 1]) P.push(pts[pts.length - 1]);
    const alu = o.colour || '#B9C3CF', groove = '#47515F', bias = o.bias == null ? F.GROUND : o.bias;
    const w3 = (p, dy, dz) => [p.x + off[0] - Math.sin(p.th) * dz, off[1] + dy, p.z + off[2] + Math.cos(p.th) * dz];
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      // the deck (the slot between the rails is darker), the two rails standing on it, and the side skirts
      quad(F, [w3(a, -W / 2, 0), w3(b, -W / 2, 0), w3(b, W / 2, 0), w3(a, W / 2, 0)], o.surface || groove, { bias, ambient: 0.5 });
      [-1, 1].forEach(sd => {
        const y0 = sd * (W / 2 - 0.004), y1 = sd * (W / 2 - 0.016);
        quad(F, [w3(a, y0, 0.010), w3(b, y0, 0.010), w3(b, y1, 0.010), w3(a, y1, 0.010)], alu, { bias, ambient: 0.55 });
        quad(F, [w3(a, sd * W / 2, -0.022), w3(b, sd * W / 2, -0.022), w3(b, sd * W / 2, 0.010), w3(a, sd * W / 2, 0.010)], mix(alu, '#202836', 0.18), { bias, ambient: 0.45 });
      });
      quad(F, [w3(a, -W / 2, -0.022), w3(b, -W / 2, -0.022), w3(b, W / 2, -0.022), w3(a, W / 2, -0.022)], '#6F7884', { bias, ambient: 0.3 });
    }
    // end stops
    [P[0], P[P.length - 1]].forEach((p, k) => {
      const c = w3(p, 0, 0.022);
      R3.box(F, c, [0.012, W, 0.044], '#2F3744', { shadow: false, ambient: 0.4, bias, axes: [[Math.cos(p.th), 0, Math.sin(p.th)], [0, 1, 0], [-Math.sin(p.th), 0, Math.cos(p.th)]] });
      void k;
    });
    // legs to the bench wherever the track is in the air
    if (o.legs !== false) {
      let last = -1;
      pts.forEach((p, i) => {
        if (i - last < 90 && i !== pts.length - 1) return;
        last = i;
        const top = w3(p, 0, -0.022);
        if (top[2] < 0.03) return;
        [-1, 1].forEach(sd => R3.cylinder(F, [top[0], off[1] + sd * 0.045, 0.004], [top[0], off[1] + sd * 0.045, top[2]], 0.007, '#8E98A6', { segments: 8, shadow: false, ambient: 0.45, bias }));
        R3.box(F, [top[0], off[1], 0.006], [0.05, 0.13, 0.012], '#2C3340', { shadow: false, ambient: 0.4, bias });
      });
    }
  }

  /* ============================================================
     THE CART — a dynamics cart: moulded body, four wheels, a flag,
     mass bars, an optional card sail, a plunger
     c: the point on the track under the cart's middle; th: the slope; o.v
     ============================================================ */
  function cart(F, c, th, o) {
    o = o || {};
    const ex = [Math.cos(th), 0, Math.sin(th)], ey = [0, 1, 0], ez = [-Math.sin(th), 0, Math.cos(th)], ax = [ex, ey, ez];
    const P = (u, v, w) => add(c, add(scale(ex, u), add(scale(ey, v), scale(ez, w))));
    const Lc = 0.17, Wc = 0.085, Hc = 0.032, wr = 0.0145, ph = o.phase || 0;
    R3.box(F, P(0, 0, wr + 0.004 + Hc / 2), [Lc, Wc, Hc], o.colour || '#2F6FD8', { ambient: 0.42, axes: ax, shadowK: 0.6 });
    R3.box(F, P(0, 0, wr + 0.004 + Hc + 0.003), [Lc - 0.02, Wc - 0.012, 0.006], mix(o.colour || '#2F6FD8', '#FFFFFF', 0.18), { shadow: false, ambient: 0.45, axes: ax });
    [-1, 1].forEach(fx => [-1, 1].forEach(fy => {
      const wc = P(fx * 0.055, fy * (Wc / 2 + 0.002), wr + 0.0);
      R3.cylinder(F, add(wc, scale(ey, -fy * 0.004)), add(wc, scale(ey, fy * 0.006)), wr, '#1B1F27', { segments: 16, shadow: false, ambient: 0.35, capColour: '#8D96A3' });
      const sp = add(add(wc, scale(ey, fy * 0.0065)), add(scale(ex, Math.cos(ph) * wr * 0.6), scale(ez, Math.sin(ph) * wr * 0.6)));
      R3.sphere(F, sp, 0.0022, '#E8EEF8', { shadow: false });
    }));
    // the plunger at the front
    R3.cylinder(F, P(Lc / 2, 0, wr + 0.02), P(Lc / 2 + 0.012, 0, wr + 0.02), 0.006, '#C9D0D8', { segments: 12, shadow: false });
    // mass bars: 250 g steel bars stacked crosswise
    const top = wr + 0.004 + Hc + 0.006;
    for (let k = 0; k < (o.bars || 0); k++) R3.box(F, P(-0.02, 0, top + 0.009 + k * 0.0185), [0.06, 0.075, 0.018], k % 2 ? '#8E98A8' : '#A7B1C0', { shadow: false, ambient: 0.45, axes: ax });
    // the flag: a black card standing on the cart's front half, which cuts the gates' beams
    if (o.flag) {
      const fl = o.flag, z0 = top, z1 = top + 0.075;
      quad(F, [P(0.06 - fl, 0.004, z0), P(0.06, 0.004, z0), P(0.06, 0.004, z1), P(0.06 - fl, 0.004, z1)], '#15181E', { ambient: 0.5 });
      quad(F, [P(0.06 - fl, -0.004, z1), P(0.06, -0.004, z1), P(0.06, -0.004, z0), P(0.06 - fl, -0.004, z0)], '#15181E', { ambient: 0.5 });
    }
    if (o.sail) {
      const s = Math.sqrt(o.sail), z0 = top + 0.004;
      quad(F, [P(-0.07, -s / 2, z0), P(-0.07, s / 2, z0), P(-0.07, s / 2, z0 + s), P(-0.07, -s / 2, z0 + s)], '#F2F0E8', { ambient: 0.55, edge: '#9AA3AE' });
      quad(F, [P(-0.071, s / 2, z0), P(-0.071, -s / 2, z0), P(-0.071, -s / 2, z0 + s), P(-0.071, s / 2, z0 + s)], '#E4E1D6', { ambient: 0.55 });
      R3.cylinder(F, P(-0.07, 0, top), P(-0.07, 0, z0 + s), 0.0025, '#8E98A6', { segments: 6, shadow: false });
    }
    if (o.magnet) R3.box(F, P(0, 0, wr * 0.4), [0.12, 0.02, 0.008], '#B83A3A', { shadow: false, axes: ax });
    return { top: P(0, 0, top + 0.02), front: P(Lc / 2 + 0.012, 0, wr + 0.02), back: P(-Lc / 2, 0, wr + 0.02) };
  }

  /* the spring launcher fixed to the track's end: a plate driven by a coil spring */
  function launcher(F, base, comp, free, o) {
    o = o || {};
    const z = base[2] + 0.034;
    R3.box(F, [base[0] - 0.02, base[1], z], [0.03, 0.07, 0.05], '#3A4252', { shadow: false, ambient: 0.4 });
    const xp = base[0] - 0.005 + free - comp;
    BENCH.spring(F, [base[0] - 0.005, base[1], z], [xp, base[1], z], 0.012, 9, { colour: o.colour || '#D8C27A' });
    R3.cylinder(F, [xp, base[1], z], [xp + 0.006, base[1], z], 0.022, '#AEB7C3', { segments: 18, shadow: false, ambient: 0.5 });
    if (o.latch) R3.box(F, [xp + 0.02, base[1] + 0.03, z + 0.02], [0.03, 0.01, 0.01], '#C8463A', { shadow: false });
  }

  /* a block of modelling clay, its near face dented by the cart's nose */
  function clay(F, face, dent, o) {
    o = o || {};
    const c = [face[0] + 0.04, face[1], face[2] + 0.035];
    R3.box(F, c, [0.08, 0.10, 0.07], o.colour || '#7FA36A', { ambient: 0.42, shadowK: 0.7 });
    if (dent > 1e-4) {
      const d = Math.min(0.06, dent), at = [face[0] - 0.0015, face[1], face[2] + 0.034];
      F.push(at, () => {
        const q = F.cam.project(at), e = F.cam.project([at[0], at[1] + 0.012, at[2]]), f = F.cam.project([at[0], at[1], at[2] + 0.012]);
        if (!q.ok || !e.ok || !f.ok) return;
        const ctx = F.ctx, rx = Math.abs(e.x - q.x) + 2 + d * 60, ry = Math.abs(f.y - q.y) + 2 + d * 30;
        const g = ctx.createRadialGradient(q.x - rx * 0.2, q.y - ry * 0.2, 0, q.x, q.y, Math.max(rx, ry));
        g.addColorStop(0, '#2C3B24'); g.addColorStop(0.7, '#4D6A3E'); g.addColorStop(1, 'rgba(127,163,106,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q.x, q.y, Math.max(2, rx), Math.max(2, ry), 0, 0, TAU); ctx.fill();
      }, -0.03);
    }
  }

  /* ============================================================
     THE CHAIN — a solar simulator, a panel, a battery, a motor, a mass, a lamp
     ============================================================ */
  function cellTex() {
    if (cache.cells) return cache.cells;
    const c = canvas(300, 240), x = c.getContext('2d');
    x.fillStyle = '#C9D0D8'; x.fillRect(0, 0, 300, 240);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const X = 8 + i * 48, Y = 8 + j * 57, w = 44, h = 53;
      const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, '#16285A'); g.addColorStop(0.5, '#1E3B86'); g.addColorStop(1, '#122150');
      x.fillStyle = g; x.beginPath(); x.moveTo(X + 5, Y); x.lineTo(X + w - 5, Y); x.lineTo(X + w, Y + 5); x.lineTo(X + w, Y + h - 5); x.lineTo(X + w - 5, Y + h); x.lineTo(X + 5, Y + h); x.lineTo(X, Y + h - 5); x.lineTo(X, Y + 5); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(220,226,236,.75)'; x.lineWidth = 1;
      for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(X + k * w / 4, Y); x.lineTo(X + k * w / 4, Y + h); x.stroke(); }
      x.lineWidth = 0.4; for (let k = 1; k < 14; k++) { x.beginPath(); x.moveTo(X, Y + k * h / 14); x.lineTo(X + w, Y + k * h / 14); x.stroke(); }
    }
    return (cache.cells = c);
  }
  /* a framed panel tilted by tilt (rad) about the y axis, facing −x…+z; returns its centre */
  function solarPanel(F, base, Wp, Hp, tilt, o) {
    o = o || {};
    const n = [-Math.sin(tilt), 0, Math.cos(tilt)], u = [Math.cos(tilt), 0, Math.sin(tilt)], v = [0, 1, 0];
    const c = add(base, [0, 0, 0.06 + Hp / 2 * Math.sin(tilt)]);
    R3.box(F, c, [Hp + 0.012, Wp + 0.012, 0.012], '#9AA4B0', { ambient: 0.45, axes: [u, v, n], shadowK: 0.6 });
    R3.texPlane(F, add(c, scale(n, 0.0065)), scale(u, Hp / 2), scale(v, Wp / 2), cellTex(), { grid: 3, bias: -0.01 });
    if (o.glow) F.push(add(c, scale(n, 0.008)), () => {
      const q = F.cam.project(c); if (!q.ok) return;
      const ctx = F.ctx, r = q.s * Hp * 0.7, g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, 'rgba(255,250,220,' + (0.28 * o.glow).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
    }, -0.02);
    // the stand: two legs and a back strut
    R3.cylinder(F, [base[0], base[1] - Wp * 0.4, 0], add(c, scale(v, -Wp * 0.4)), 0.005, '#596372', { segments: 8, shadow: false });
    R3.cylinder(F, [base[0], base[1] + Wp * 0.4, 0], add(c, scale(v, Wp * 0.4)), 0.005, '#596372', { segments: 8, shadow: false });
    return { c, n, out: add(base, [Hp * 0.3 * Math.cos(tilt), 0, 0.03]) };
  }
  /* a solar simulator: a floodlight on a stand, its beam a soft cone onto the panel */
  function floodlight(F, at, dir, power, o) {
    o = o || {};
    const d = norm(dir), ctx = F.ctx;
    R3.cylinder(F, [at[0], at[1], 0], [at[0], at[1], at[2] - 0.05], 0.008, '#4C5563', { segments: 10, shadow: false });
    R3.box(F, [at[0], at[1], 0.008], [0.12, 0.12, 0.016], '#2A303A', { shadow: false });
    const back = add(at, scale(d, -0.05));
    R3.cylinder(F, back, at, 0.07, '#2B313B', { segments: 24, ambient: 0.4, capColour: power > 0 ? '#FFF6D8' : '#6A7280' });
    if (power > 0) {
      F.push(add(at, scale(d, 0.003)), () => {
        const q = F.cam.project(add(at, scale(d, 0.002))); if (!q.ok) return;
        const r = 0.12 * q.s * (0.9 + power * 0.4), g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        g.addColorStop(0, 'rgba(255,248,214,' + (0.75 * power).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); ctx.restore();
      }, -0.03);
      if (o.to) F.push(scale(add(at, o.to), 0.5), () => {
        const a = F.cam.project(at), b = F.cam.project(o.to); if (!a.ok || !b.ok) return;
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, 'rgba(255,246,200,' + (0.22 * power).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,246,200,0)');
        const nx = -(b.y - a.y), ny = b.x - a.x, l = Math.hypot(nx, ny) || 1, w0 = 0.07 * a.s, w1 = (o.spread || 0.16) * b.s;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(a.x + nx / l * w0, a.y + ny / l * w0); ctx.lineTo(b.x + nx / l * w1, b.y + ny / l * w1); ctx.lineTo(b.x - nx / l * w1, b.y - ny / l * w1); ctx.lineTo(a.x - nx / l * w0, a.y - ny / l * w0); ctx.closePath(); ctx.fill(); ctx.restore();
      }, -0.5);
    }
  }
  /* a battery pack: a box with its terminals and a five-segment charge bar on the top */
  function battery(F, c, frac, o) {
    o = o || {};
    R3.box(F, [c[0], c[1], 0.03], [0.11, 0.07, 0.06], o.colour || '#1F2530', { ambient: 0.4 });
    R3.box(F, [c[0] - 0.03, c[1], 0.063], [0.035, 0.05, 0.006], '#C8463A', { shadow: false });
    R3.cylinder(F, [c[0] + 0.035, c[1] - 0.02, 0.06], [c[0] + 0.035, c[1] - 0.02, 0.07], 0.005, '#D8B04A', { segments: 10, shadow: false });
    R3.cylinder(F, [c[0] + 0.035, c[1] + 0.02, 0.06], [c[0] + 0.035, c[1] + 0.02, 0.07], 0.005, '#C9D0D8', { segments: 10, shadow: false });
    for (let k = 0; k < 5; k++) {
      const on = frac > k / 5 + 0.02, col = !on ? '#2A3140' : frac < 0.2 ? '#FF5A4A' : '#56E08A';
      R3.box(F, [c[0] - 0.045 + k * 0.012, c[1] - 0.036, 0.04], [0.009, 0.002, 0.012], col, { shadow: false, ambient: on ? 0.95 : 0.4, bias: -0.01 });
    }
    return { plus: [c[0] + 0.035, c[1] - 0.02, 0.07], minus: [c[0] + 0.035, c[1] + 0.02, 0.07] };
  }
  /* a motor (a steel can with its end bell) on a clamp at the top of a stand, driving a pulley on its shaft */
  function motorPulley(F, hub, r, ph, o) {
    o = o || {};
    R3.cylinder(F, [hub[0], hub[1] + 0.03, hub[2]], [hub[0], hub[1] + 0.085, hub[2]], 0.02, o.colour || '#B8C0CB', { segments: 22, ambient: 0.45, capColour: '#2E3540', shadow: false });
    R3.cylinder(F, [hub[0], hub[1] + 0.085, hub[2]], [hub[0], hub[1] + 0.092, hub[2]], 0.012, '#2E3540', { segments: 16, shadow: false });
    BENCH.pulley(F, hub, [0, 1, 0], r, { phase: ph, width: 0.022 });
  }
  /* a slotted mass on its hanger, hanging from a string at top; mass in kg sets the stack */
  function slottedMass(F, top, kg, o) {
    o = o || {};
    const n = clamp(Math.round(kg / 0.1), 1, 20), h = 0.006 + 0.0035 * Math.min(n, 20), r = 0.024;
    R3.cylinder(F, [top[0], top[1], top[2] - 0.015], top, 0.0015, '#C9D0D8', { segments: 6, shadow: false });
    R3.cylinder(F, [top[0], top[1], top[2] - 0.02 - h], [top[0], top[1], top[2] - 0.02], r, o.colour || '#C7A24A', { segments: 22, ambient: 0.42 });
    for (let k = 1; k < n; k += Math.max(1, Math.round(n / 8))) {
      const z = top[2] - 0.02 - h + k * h / n;
      R3.cylinder(F, [top[0], top[1], z - 0.0004], [top[0], top[1], z + 0.0004], r + 0.0006, '#8E7230', { segments: 22, caps: false, shadow: false, bias: -0.005 });
    }
    return top[2] - 0.02 - h;
  }
  /* a lamp on its holder: brightness 0..1; kind 'led' (a phosphor dome) or 'filament' */
  function lamp(F, base, bright, kind, o) {
    o = o || {};
    const ctx = F.ctx;
    R3.cylinder(F, base, [base[0], base[1], base[2] + 0.03], 0.018, '#2E3440', { segments: 18, ambient: 0.4 });
    R3.cylinder(F, [base[0], base[1], base[2] + 0.03], [base[0], base[1], base[2] + 0.045], 0.011, '#C9CDD2', { segments: 16, shadow: false });
    const c = [base[0], base[1], base[2] + 0.068], glassCol = kind === 'led' ? (bright > 0.02 ? '#FFF8E0' : '#E8ECEF') : '#E6EEF4';
    R3.sphere(F, c, 0.025, glassCol, { shadow: false, rim: 0.4 });
    F.push(c, () => {
      const q = F.cam.project(c); if (!q.ok) return;
      const R = 0.025 * q.s;
      if (kind === 'filament') {
        ctx.save(); ctx.strokeStyle = bright > 0.02 ? mix('#FFB24A', '#FFFBE6', bright) : '#6A5A48'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = q.x - R * 0.35 + i / 12 * R * 0.7, y = q.y + Math.sin(i * 1.6) * R * 0.08; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      }
      if (bright > 0.01) {
        const r = R * (1.6 + 4 * bright), g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        const col = kind === 'led' ? '255,250,236' : '255,200,120';
        g.addColorStop(0, 'rgba(' + col + ',' + (0.9 * Math.min(1, bright * 1.4)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); ctx.restore();
      }
    }, -0.02);
    return { c, foot: [base[0] + 0.012, base[1], base[2] + 0.004] };
  }
  /* a lead: a sagging insulated wire between points */
  function lead(F, a, b, colour, sag) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, p = add(a, scale(sub(b, a), u)); p[2] = Math.max(0.003, p[2] - (sag == null ? 0.03 : sag) * Math.sin(Math.PI * u)); pts.push(p); }
    R3.tube(F, pts, 0.0022, colour || '#C8463A', { segments: 5, round: false });
  }

  /* ============================================================
     EVERYDAY — a kettle, a bicycle wheel and brake, a phone and charger
     ============================================================ */
  function kettle(F, base, o) {
    o = o || {};
    const r = 0.075, H = 0.19, ctx = F.ctx;
    R3.cylinder(F, base, [base[0], base[1], base[2] + 0.02], r + 0.012, '#2A2F38', { segments: 32, ambient: 0.4 });     // the power base
    const b0 = [base[0], base[1], base[2] + 0.02], b1 = [base[0], base[1], base[2] + 0.02 + H];
    R3.cylinder(F, b0, b1, r, o.colour || '#C9D0D8', { segments: 34, ambient: 0.42, caps: false });
    // the water window, with the level and the boil
    const lv = clamp(o.level || 0, 0, 1) * (H - 0.03), wz = b0[2] + 0.01 + lv;
    F.push([base[0], base[1] - r - 0.002, b0[2] + H / 2], () => {
      const q0 = F.cam.project([base[0] - 0.016, base[1] - r - 0.002, b0[2] + 0.015]), q1 = F.cam.project([base[0] + 0.016, base[1] - r - 0.002, b1[2] - 0.02]), qw = F.cam.project([base[0], base[1] - r - 0.002, wz]);
      if (!q0.ok || !q1.ok || !qw.ok) return;
      const x0 = Math.min(q0.x, q1.x), x1 = Math.max(q0.x, q1.x), y0 = Math.min(q0.y, q1.y), y1 = Math.max(q0.y, q1.y);
      ctx.save(); ctx.fillStyle = 'rgba(20,32,46,.85)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const wy = clamp(qw.y, y0, y1), hot = clamp(((o.T || 20) - 20) / 80, 0, 1);
      const g = ctx.createLinearGradient(0, wy, 0, y1); g.addColorStop(0, mix('#8FCBF2', '#FFB28A', hot * 0.6)); g.addColorStop(1, mix('#2E77B8', '#C2563A', hot * 0.6));
      ctx.fillStyle = g; ctx.fillRect(x0 + 1, wy, x1 - x0 - 2, y1 - wy);
      if (o.boil) { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 10; k++) { const u = ((o.phase || 0) * 0.8 + k * 0.137) % 1; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * ((k * 0.61) % 1), y1 - u * (y1 - wy), 1.4, 0, TAU); ctx.fill(); } }
      ctx.strokeStyle = 'rgba(220,230,240,.7)'; ctx.lineWidth = 0.6; for (let k = 1; k < 5; k++) { const yy = y1 - k * (y1 - y0) / 5; ctx.beginPath(); ctx.moveTo(x1 - 5, yy); ctx.lineTo(x1 - 1, yy); ctx.stroke(); }
      ctx.restore();
    }, -0.01);
    // the lid, open or shut; the spout; the handle
    if (o.lid) R3.cylinder(F, b1, [b1[0], b1[1], b1[2] + 0.012], r * 0.92, '#3A414C', { segments: 30, ambient: 0.45 });
    else R3.cylinder(F, [b1[0] - r * 0.6, b1[1], b1[2] + r * 0.55], [b1[0] - r * 0.6 + 0.012 * 0.5, b1[1], b1[2] + r * 0.55 + 0.012], r * 0.92, '#3A414C', { segments: 30, ambient: 0.45 });
    R3.tube(F, [[b1[0] + r * 0.8, b1[1], b1[2] - 0.05], [b1[0] + r + 0.03, b1[1], b1[2] - 0.01], [b1[0] + r + 0.045, b1[1], b1[2] + 0.012]], 0.012, o.colour || '#C9D0D8', { segments: 10 });
    R3.tube(F, [[b0[0] - r, b0[1], b0[2] + 0.04], [b0[0] - r - 0.045, b0[1], b0[2] + 0.07], [b0[0] - r - 0.05, b0[1], b0[2] + 0.15], [b0[0] - r, b0[1], b1[2] - 0.01]], 0.011, '#2A2F38', { segments: 8 });
    R3.sphere(F, [b0[0] - r - 0.02, b0[1] - 0.03, b0[2] + 0.006], 0.004, o.on ? '#FF5A3A' : '#4A3030', { shadow: false, vivid: o.on });
    return { spout: [b1[0] + r + 0.05, b1[1], b1[2] + 0.015], top: [b1[0], b1[1], b1[2] + 0.015], r, H };
  }
  /* a bicycle wheel (rim, tyre, spokes) on a stand, with a disc or rim brake; glow 0..1 is the brake's heat */
  function bikeWheel(F, c, R, ph, brake, glow, o) {
    o = o || {};
    const ax = [0, 1, 0];
    // tyre and rim as rings of short tubes
    const ring = (rad, rr, col, n) => { const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; pts.push([c[0] + rad * Math.cos(a), c[1], c[2] + rad * Math.sin(a)]); } R3.tube(F, pts, rr, col, { segments: 8, round: false }); };
    ring(R, 0.017, '#1C1E22', 40);
    ring(R - 0.022, 0.008, brake === 'rim' ? mix('#C9D0D8', '#FF7A45', glow * 0.7) : '#C9D0D8', 40);
    for (let k = 0; k < 16; k++) {
      const a = ph + k / 16 * TAU, side = k % 2 ? 0.012 : -0.012;
      R3.cylinder(F, [c[0], c[1] + side, c[2]], [c[0] + (R - 0.03) * Math.cos(a), c[1], c[2] + (R - 0.03) * Math.sin(a)], 0.0012, '#D8DEE6', { segments: 4, caps: false, shadow: false });
    }
    R3.cylinder(F, [c[0], c[1] - 0.03, c[2]], [c[0], c[1] + 0.03, c[2]], 0.018, '#8E98A6', { segments: 16, shadow: false });
    if (brake === 'disc') {
      const dc = add(c, [0, -0.035, 0]);
      R3.cylinder(F, add(dc, [0, -0.0012, 0]), add(dc, [0, 0.0012, 0]), 0.08, mix('#B9C1CB', glow > 0.55 ? '#FF6A2A' : '#8A5A3A', clamp(glow, 0, 1) * 0.85), { segments: 30, inner: 0.03, shadow: false, ambient: 0.5 });
      R3.box(F, add(dc, [0.068 * Math.cos(-0.6), -0.002, 0.068 * Math.sin(-0.6)]), [0.04, 0.018, 0.03], '#2E3440', { shadow: false });
    } else {
      R3.box(F, add(c, [0, 0, R - 0.02]), [0.03, 0.06, 0.02], '#2E3440', { shadow: false });
    }
    // the stand that holds it off the floor, and its fork
    [-1, 1].forEach(sd => R3.cylinder(F, [c[0], c[1] + sd * 0.04, c[2]], [c[0] + sd * 0.0, c[1] + sd * 0.07, 0], 0.008, '#3A4252', { segments: 8, shadow: false }));
  }
  function phone(F, c, soc, o) {
    o = o || {};
    R3.box(F, [c[0], c[1], 0.0045], [0.075, 0.155, 0.009], '#1A1D24', { ambient: 0.4 });
    F.push([c[0], c[1], 0.0095], () => {
      const P = [[c[0] - 0.034, c[1] - 0.073], [c[0] + 0.034, c[1] - 0.073], [c[0] + 0.034, c[1] + 0.073], [c[0] - 0.034, c[1] + 0.073]].map(p => F.cam.project([p[0], p[1], 0.0092]));
      if (P.some(q => !q.ok)) return;
      const ctx = F.ctx; ctx.save(); ctx.fillStyle = '#0B1320'; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill();
      // the battery icon filling with charge
      const m = F.cam.project([c[0], c[1], 0.0093]), w = Math.abs(P[1].x - P[0].x) * 0.5, h = Math.max(6, w * 0.32);
      ctx.strokeStyle = '#DCE4F0'; ctx.lineWidth = 1; ctx.strokeRect(m.x - w / 2, m.y - h / 2, w, h);
      ctx.fillStyle = soc < 0.2 ? '#FF5A4A' : '#56E08A'; ctx.fillRect(m.x - w / 2 + 1.5, m.y - h / 2 + 1.5, (w - 3) * clamp(soc, 0, 1), h - 3);
      ctx.fillStyle = '#DCE4F0'; ctx.font = mono(Math.max(7, h * 0.7), 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(Math.round(soc * 100) + ' %', m.x, m.y + h / 2 + 2);
      ctx.restore();
    }, -0.01);
  }
  function charger(F, c, warm, o) {
    o = o || {};
    // a wall socket on the splashback, the charger plugged into it, its lead dropping to the bench
    R3.box(F, [c[0], c[1] + 0.045, 0.12], [0.086, 0.008, 0.086], '#E6E2D8', { ambient: 0.5, shadow: false });
    R3.box(F, [c[0] + 0.022, c[1] + 0.040, 0.15], [0.012, 0.004, 0.008], '#3A3F48', { shadow: false });
    R3.box(F, [c[0], c[1] + 0.015, 0.12], [0.046, 0.052, 0.046], mix('#ECEEF0', '#FF9A6A', clamp(warm, 0, 1) * 0.5), { ambient: 0.45, shadow: false });
    R3.tube(F, [[c[0], c[1] - 0.012, 0.11], [c[0], c[1] - 0.03, 0.08], [c[0], c[1] - 0.04, 0.004]], 0.0028, '#E8EAEE', { segments: 6, round: false });
    return [c[0], c[1] - 0.04, 0.004];
  }

  /* ============================================================
     2D — a Sankey diagram and an energy-bar ledger
     flows: { input: {label, J, colour}, outs: [{label, J, colour, useful}] }
     ============================================================ */
  function sankey(ctx, x, y, w, h, S, o) {
    o = o || {};
    const tot = Math.max(1e-12, S.input.J), outs = S.outs.filter(f => f.J > tot * 1e-4);
    const maxBand = h * 0.62, k = maxBand / tot, gap = Math.max(6, h * 0.05);
    ctx.save();
    ctx.font = mono(o.size || 9.5, 700);
    const lw = Math.max(...outs.map(f => ctx.measureText(f.label + ' 00.0 %').width), 40);
    const x1 = Math.max(x + w * 0.42, x + w - lw - (o.tip || 14) - 8), x0 = x + 6, xs = x0 + (x1 - x0) * 0.55;
    // the input band
    const yin = y + (h - maxBand) / 2;
    const band = (col, a) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, a * 0.85)); return g; };
    ctx.fillStyle = band(S.input.colour || '#E8EEF8', 0.9); ctx.fillRect(x0, yin, xs - x0, tot * k);
    // the out bands: stacked at the split, fanned out on the right
    const totalH = outs.reduce((u, f) => u + Math.max(1.5, f.J * k), 0) + gap * (outs.length - 1);
    let yr = y + (h - totalH) / 2, ys = yin;
    outs.forEach(f => {
      const bh = Math.max(1.5, f.J * k);
      ctx.fillStyle = band(f.colour, f.useful ? 0.95 : 0.75);
      ctx.beginPath(); ctx.moveTo(xs, ys); ctx.bezierCurveTo((xs + x1) / 2, ys, (xs + x1) / 2, yr, x1, yr);
      ctx.lineTo(x1 + (o.tip || 14), yr + bh / 2); ctx.lineTo(x1, yr + bh);
      ctx.bezierCurveTo((xs + x1) / 2, yr + bh, (xs + x1) / 2, ys + f.J * k, xs, ys + f.J * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = f.useful ? '#F2F6FF' : '#B8C4DA'; ctx.font = mono(o.size || 9.5, f.useful ? 700 : 500); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const pct = 100 * f.J / tot;
      ctx.fillText(f.label + ' ' + (pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + ' %', x1 + (o.tip || 14) + 4, yr + bh / 2);
      ys += f.J * k; yr += bh + gap;
    });
    ctx.fillStyle = '#E8EEF8'; ctx.font = mono(o.size || 9.5, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(S.input.label, x0, yin - 3);
    ctx.restore();
  }
  /* bars: [{label, J, colour}] drawn as columns on a common scale, with the total on the right */
  function energyBars(ctx, x, y, w, h, bars, o) {
    o = o || {};
    const max = o.max || Math.max(1e-9, ...bars.map(b => b.J)), n = bars.length, bw = Math.min(30, (w - 10) / n * 0.62), sp = (w - 10) / n;
    ctx.save();
    ctx.strokeStyle = 'rgba(160,176,206,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + h - 16); ctx.lineTo(x + w, y + h - 16); ctx.stroke();
    bars.forEach((b, i) => {
      const bx = x + 5 + i * sp + (sp - bw) / 2, bh = clamp(b.J / max, 0, 1.05) * (h - 34);
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, mix(b.colour, '#FFFFFF', 0.2)); g.addColorStop(1, mix(b.colour, '#05080F', 0.25));
      ctx.fillStyle = g; ctx.fillRect(bx, y + h - 16 - bh, bw, bh);
      if (b.dash) { ctx.setLineDash([3, 2]); ctx.strokeStyle = b.colour; ctx.strokeRect(bx + 0.5, y + h - 16 - bh, bw - 1, bh); ctx.setLineDash([]); }
      ctx.fillStyle = '#C9D4EA'; ctx.font = mono(8.5, 500); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(b.label, bx + bw / 2, y + h - 13);
      ctx.fillStyle = '#E8EEF8'; ctx.font = mono(8.5, 600); ctx.textBaseline = 'bottom'; ctx.fillText(b.text != null ? b.text : b.J.toFixed(2), bx + bw / 2, y + h - 18 - bh);
    });
    ctx.restore();
  }


  /* ============================================================
     THE PARTICLE BENCH — a Boyle syringe, an ice calorimeter, thermometers
     ============================================================ */
  /* a 60 mL syringe standing nozzle-down in a clamp, sealed, a platform on its plunger carrying slotted masses.
     base: the sealed tip on the bench; V (mL) the gas/liquid volume; o.fill colour, o.load kg, o.cap mL */
  function syringe(F, base, V, o) {
    o = o || {};
    const cap = o.cap || 60, r = 0.0145, Lb = cap * 1e-6 / (Math.PI * r * r), z0 = base[2] + 0.03, ctx = F.ctx;
    const zV = z0 + V * 1e-6 / (Math.PI * r * r);
    // the sealed nozzle and its cap
    R3.cylinder(F, [base[0], base[1], base[2] + 0.012], [base[0], base[1], z0], 0.004, '#E8EEF4', { segments: 12, shadow: false });
    R3.cylinder(F, [base[0], base[1], base[2]], [base[0], base[1], base[2] + 0.014], 0.007, '#C8463A', { segments: 14 });
    // the contents: a column inside the barrel
    if (o.fill) F.push([base[0], base[1] - r * 0.5, (z0 + zV) / 2], () => {
      const a = F.cam.project([base[0] - r * 0.92, base[1], z0]), b = F.cam.project([base[0] + r * 0.92, base[1], zV]);
      if (!a.ok || !b.ok) return;
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgba(o.fill, 0.35)); g.addColorStop(0.45, rgba(mix(o.fill, '#FFFFFF', 0.4), 0.55)); g.addColorStop(1, rgba(o.fill, 0.4));
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
    }, -0.01);
    // the barrel: clear plastic, with its printed scale
    F.push([base[0], base[1] - r, z0 + Lb / 2], () => {
      const a = F.cam.project([base[0] - r, base[1], z0]), b = F.cam.project([base[0] + r, base[1], z0 + Lb]);
      if (!a.ok || !b.ok) return;
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      ctx.save();
      const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(210,225,240,.35)'); g.addColorStop(0.2, 'rgba(255,255,255,.12)'); g.addColorStop(0.7, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(160,180,200,.4)');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = 'rgba(230,240,250,.8)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0, x1 - x0 - 1, y1 - y0);
      ctx.fillStyle = '#1C2230'; ctx.strokeStyle = 'rgba(20,28,40,.85)'; ctx.font = mono(Math.max(7, (x1 - x0) * 0.22), 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (let v = 0; v <= cap + 1e-9; v += 1) {
        const q = F.cam.project([base[0], base[1] - r, z0 + v * 1e-6 / (Math.PI * r * r)]); if (!q.ok) continue;
        const big = v % 10 === 0, mid = v % 5 === 0, w = big ? (x1 - x0) * 0.45 : mid ? (x1 - x0) * 0.32 : (x1 - x0) * 0.2;
        ctx.lineWidth = big ? 1.1 : 0.7; ctx.beginPath(); ctx.moveTo(x0 + 2, q.y); ctx.lineTo(x0 + 2 + w, q.y); ctx.stroke();
        if (big && v > 0 && (x1 - x0) > 18) ctx.fillText(String(v), x0 + 4 + w, q.y);
      }
      ctx.restore();
    }, -0.03);
    // flange, plunger seal (black rubber at the volume), rod, thumb plate and the load platform
    R3.box(F, [base[0], base[1], z0 + Lb + 0.002], [0.07, 0.03, 0.004], '#E8EEF4', { shadow: false, ambient: 0.6 });
    R3.cylinder(F, [base[0], base[1], zV], [base[0], base[1], zV + 0.008], r * 0.96, '#1A1D22', { segments: 20, shadow: false });
    const top = zV + 0.008 + Lb * 0.9;
    R3.box(F, [base[0], base[1], (zV + 0.008 + top) / 2], [0.004, r * 1.4, top - zV - 0.008], '#E8EEF4', { shadow: false, ambient: 0.6 });
    R3.cylinder(F, [base[0], base[1], top], [base[0], base[1], top + 0.004], 0.03, '#E8EEF4', { segments: 22, shadow: false });
    // slotted masses on the plate
    const n = Math.round((o.load || 0) / 0.5);
    for (let k = 0; k < n; k++) R3.cylinder(F, [base[0], base[1], top + 0.004 + k * 0.009], [base[0], base[1], top + 0.012 + k * 0.009], 0.034, k % 2 ? '#8E98A8' : '#A7B1C0', { segments: 22, shadow: false });
    return { topZ: top + 0.004 + n * 0.009, z0, zV, r };
  }
  /* Lavoisier's ice calorimeter, simplified: a jar of crushed ice on a funnel; meltwater drips into a cylinder */
  function iceJar(F, c, r, H, iceFrac, o) {
    o = o || {};
    const ctx = F.ctx, R = r;
    // the jar (insulated: a double wall)
    window.MEAS.beaker(F, c, R + 0.004, H, 0, { tint: '#E8F2FA' });                    // a glass jar, so the ice can be seen
    // the crushed ice: a cloud of facets filling the jar to iceFrac
    const top = c[2] + 0.004 + (H - 0.01) * clamp(iceFrac, 0, 1);
    F.push([c[0], c[1] - R * 0.7, (c[2] + top) / 2], () => {
      const r0 = F.cam.project([c[0] - R, c[1], c[2] + 0.004]), r1 = F.cam.project([c[0] + R, c[1], top]); if (!r0.ok || !r1.ok) return;
      const x0 = Math.min(r0.x, r1.x), x1 = Math.max(r0.x, r1.x), y0 = Math.min(r0.y, r1.y), y1 = Math.max(r0.y, r1.y);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      ctx.fillStyle = 'rgba(214,232,246,.9)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const rr = (function (s) { return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; })(17);
      for (let k = 0; k < 160; k++) {
        const x = x0 + rr() * (x1 - x0), y = y0 + rr() * (y1 - y0 + 6), sz = 3 + rr() * 6;
        ctx.fillStyle = rr() < 0.5 ? 'rgba(255,255,255,.75)' : 'rgba(170,200,226,.6)';
        ctx.beginPath(); ctx.moveTo(x, y - sz); ctx.lineTo(x + sz * 0.8, y); ctx.lineTo(x, y + sz * 0.7); ctx.lineTo(x - sz * 0.9, y + 0.1); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }, -0.02);
    // the funnel under the jar and its drip
    R3.cylinder(F, [c[0], c[1], c[2] - 0.004], [c[0], c[1], c[2]], R + 0.006, '#BFC8D2', { segments: 30, shadow: false });
    return { top };
  }
  /* a liquid-in-glass thermometer: a bulb, a bore with its red column, a scale; tip at the bulb, reading in °C */
  function glassThermometer(F, tip, dir, reading, o) {
    o = o || {};
    const d = norm(dir), L = o.len || 0.26, lo = o.lo == null ? -10 : o.lo, hi = o.hi == null ? 110 : o.hi, ctx = F.ctx;
    const b = add(tip, scale(d, 0.012)), e = add(tip, scale(d, L));
    R3.sphere(F, add(tip, scale(d, 0.006)), 0.0055, '#C8302A', { shadow: false, rim: 0.4 });
    R3.cylinder(F, b, e, 0.0042, '#E8F1F8', { segments: 14, shadow: false, ambient: 0.7 });
    const f = clamp((reading - lo) / (hi - lo), 0, 1), col = add(b, scale(d, (L - 0.02) * f));
    R3.cylinder(F, b, col, 0.0012, '#D8302A', { segments: 8, shadow: false, bias: -0.004, vivid: true });
    if (o.scale !== false) F.push(add(b, scale(d, L / 2)), () => {
      ctx.save(); ctx.strokeStyle = 'rgba(30,36,48,.8)'; ctx.fillStyle = '#1C2230'; ctx.font = mono(7.5, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (let v = Math.ceil(lo / 10) * 10; v <= hi; v += 10) {
        const q = F.cam.project(add(b, scale(d, (L - 0.02) * (v - lo) / (hi - lo)))); if (!q.ok) continue;
        ctx.beginPath(); ctx.moveTo(q.x + 3, q.y); ctx.lineTo(q.x + 7, q.y); ctx.stroke(); if (v % 20 === 0) ctx.fillText(String(v), q.x + 8, q.y);
      }
      ctx.restore();
    }, -0.006);
    return e;
  }
  /* a stainless probe on its lead to a handheld meter */
  function probe(F, tip, dir, len, r, o) {
    o = o || {};
    const d = norm(dir), e = add(tip, scale(d, len));
    R3.cylinder(F, tip, e, r, '#C9D0D8', { segments: 12, shadow: false, ambient: 0.55 });
    R3.cylinder(F, e, add(e, scale(d, 0.06)), r * 2.6, '#2A2F38', { segments: 14, shadow: false });
    return add(e, scale(d, 0.06));
  }
  /* an infrared gun: a pistol body aimed along dir, its red aiming spot on the target */
  function irGun(F, at, target, o) {
    o = o || {};
    const d = norm(sub(target, at)), up = [0, 0, 1], side = norm(cross(d, up)), u2 = cross(side, d);
    R3.box(F, at, [0.12, 0.035, 0.05], '#2C3442', { axes: [d, side, u2], ambient: 0.45 });
    R3.box(F, add(add(at, scale(d, -0.03)), scale(u2, -0.06)), [0.03, 0.03, 0.08], '#C8463A', { axes: [d, side, u2], ambient: 0.45, shadow: false });
    R3.cylinder(F, add(at, scale(d, 0.06)), add(at, scale(d, 0.07)), 0.016, '#596372', { segments: 16, shadow: false });
    R3.polyline(F, [add(at, scale(d, 0.07)), target], '#FF3B3B', { width: 1, alpha: 0.6, bias: -0.02 });
    R3.sphere(F, target, 0.004, '#FF3B3B', { shadow: false, vivid: true, bias: -0.03 });
  }

  /* ============================================================
     2D — the particle cell and the microscope field
     ============================================================ */
  /* a flat glass cell holding the particles, standing on a Peltier stage that glows warm or cool.
     box: {x, y, w, h} in px; heat −1..1 (cold..hot); returns the inner rectangle */
  function cellPlate(ctx, box, heat, o) {
    o = o || {};
    const { x, y, w, h } = box, wall = 7;
    ctx.save();
    // the stage
    const sh = 26, sy = y + h;
    const sg = ctx.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, '#3A4252'); sg.addColorStop(1, '#1C222C');
    ctx.fillStyle = sg; ctx.fillRect(x - 18, sy, w + 36, sh);
    const hc = heat > 0 ? '255,110,60' : '90,170,255', ha = Math.min(1, Math.abs(heat));
    const gl = ctx.createLinearGradient(0, sy - 2, 0, sy + 8); gl.addColorStop(0, 'rgba(' + hc + ',' + (0.85 * ha).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(' + hc + ',0)');
    ctx.fillStyle = gl; ctx.fillRect(x, sy - 2, w, 10);
    ctx.fillStyle = '#9AA4B4'; ctx.font = mono(9, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.stageLabel != null ? o.stageLabel : (heat > 0.02 ? 'HEATER' : heat < -0.02 ? 'COOLER' : 'STAGE'), x + w / 2, sy + sh / 2 + 2);
    // the cell: dark inside, glass walls catching the light
    const bg = ctx.createRadialGradient(x + w * 0.4, y + h * 0.3, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    bg.addColorStop(0, '#16223A'); bg.addColorStop(1, '#070C18');
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    const gw = (x0, y0, ww, hh, horiz) => { const g = horiz ? ctx.createLinearGradient(0, y0, 0, y0 + hh) : ctx.createLinearGradient(x0, 0, x0 + ww, 0); g.addColorStop(0, 'rgba(200,225,245,.55)'); g.addColorStop(0.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(150,180,210,.5)'); ctx.fillStyle = g; ctx.fillRect(x0, y0, ww, hh); };
    gw(x - wall, y - (o.lid === false ? 0 : wall), wall, h + (o.lid === false ? 0 : wall), false); gw(x + w, y - (o.lid === false ? 0 : wall), wall, h + (o.lid === false ? 0 : wall), false);
    if (o.lid !== false) gw(x, y - wall, w, wall, true);
    ctx.restore();
    return { x, y, w, h };
  }
  /* particles as lit spheres: pts [{x, y, r, c}] in px, drawn back to front by size */
  function particles(ctx, pts, o) {
    o = o || {};
    pts.forEach(q => {
      if (q.r < 1.6) { ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.8, q.r), 0, TAU); ctx.fill(); return; }
      RX.ball(ctx, q.x, q.y, q.r, q.c, { rim: 0.5, sub: 0.3, shadow: false });
    });
  }
  /* a round microscope field with a µm scale */
  function microField(ctx, cx, cy, R, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = '#05070C'; ctx.fillRect(cx - R - 20, cy - R - 20, 2 * R + 40, 2 * R + 40);
    const g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.1, cx, cy, R);
    g.addColorStop(0, o.bright || '#E9EFE6'); g.addColorStop(0.8, o.mid || '#CFD8CC'); g.addColorStop(1, '#8D978A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.restore();
  }

  window.G6C = { FORM, quad, track, cart, launcher, clay, cellTex, solarPanel, floodlight, battery, motorPulley, slottedMass, lamp, lead, kettle, bikeWheel, phone, charger, sankey, energyBars, mono, syringe, iceJar, glassThermometer, probe, irGun, cellPlate, particles, microField };
})();
