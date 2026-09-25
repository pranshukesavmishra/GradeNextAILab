/* ============================================================
   art-cell.js — CELL: the bench and the close-ups of a cell-biology lab
   ------------------------------------------------------------
   The apparatus is drawn as the real thing on the R3 bench, sized and
   coloured by the model that drives it: a Visking-tubing bag in a beaker
   that swells as water comes in and turns blue-black as iodine does; a rack
   of blood in a salt series, cloudy where the cells are whole and clear red
   where they burst; Acetabularia in a tank of seawater; a respirometer's
   bath, vials and pipettes with a creeping dye drop; Elodea under a lamp on a
   rule; agar cubes cut open to show how far the alkali got.
   The close-ups are drawn to their own scale:
     memDraw     the bag's wall magnified 25 million times: pores 2.4 nm
                 wide, molecules drawn to size, crossing both ways
     acetabView  the cells in the tank, life size × a few, with each cap
                 seen from above
     tem         an electron micrograph of a cell's section — mitochondria,
                 myofibrils, chloroplasts, starch — at the tissue's own
                 measured share of mitochondria
     leafPanel   a variegated leaf through the starch test
     o2Cell      oxygen across a cell, and the core that starves
   It also adds painters to MICRO for the microscope: red onion cells that
   plasmolyse, protoplasts that burst, red blood cells that swell, burst or
   crenate, and Engelmann's filaments, bacteria and spectrum.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = RX.mix, rgba = RX.rgba;
  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k], len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  };
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const mono = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Mono",monospace';
  function halo(ctx, text, x, y, col, o) {
    o = o || {};
    ctx.save(); ctx.font = o.font || mono(10); ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.halo || 'rgba(5,8,15,.85)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(text, x, y); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ============================================================
     3D — TRANSLUCENT BODIES
     A capsule between a and b (a bag, a tube, a vial): its outline is the
     hull of the two end spheres' silhouettes, shaded across its own axis
     as a cylinder is, so it reads the same from any side.
     ============================================================ */
  function silhouette(cam, a, b, r, n) {
    const pts = [];
    for (const c of [a, b]) {
      const w = V3.norm(V3.sub(c, cam.eye));
      let u = V3.cross(w, [0, 0, 1]); if (V3.len(u) < 1e-6) u = V3.cross(w, [0, 1, 0]); u = V3.norm(u);
      const v = V3.cross(w, u);
      for (let i = 0; i < n; i++) { const t = i / n * TAU, q = cam.project(V3.add(c, V3.add(V3.sc(u, Math.cos(t) * r), V3.sc(v, Math.sin(t) * r)))); if (!q.ok) return null; pts.push(q); }
    }
    return MEAS.hull2(pts);
  }
  function capsule(F, a, b, r, fill, o) {
    o = o || {};
    const mid = V3.sc(V3.add(a, b), 0.5), al = o.alpha == null ? 0.8 : o.alpha;
    F.push(mid, () => {
      const cam = F.cam, H = silhouette(cam, a, b, r, 18); if (!H) return;
      const qa = cam.project(a), qb = cam.project(b), ctx = F.ctx;
      let dx = qb.x - qa.x, dy = qb.y - qa.y; const dl = Math.hypot(dx, dy);
      if (dl < 1e-3) { dx = 0; dy = 1; } else { dx /= dl; dy /= dl; }
      const nx = -dy, ny = dx, mx = (qa.x + qb.x) / 2, my = (qa.y + qb.y) / 2;
      let lo = 1e9, hi = -1e9; H.forEach(q => { const s = (q.x - mx) * nx + (q.y - my) * ny; lo = Math.min(lo, s); hi = Math.max(hi, s); });
      ctx.save(); MEAS.path(ctx, H);
      const g = ctx.createLinearGradient(mx + nx * lo, my + ny * lo, mx + nx * hi, my + ny * hi);
      g.addColorStop(0, rgba(mix(fill, '#000000', 0.32), al));
      g.addColorStop(0.3, rgba(mix(fill, '#FFFFFF', 0.16), al * 0.92));
      g.addColorStop(0.62, rgba(fill, al));
      g.addColorStop(1, rgba(mix(fill, '#000000', 0.42), al));
      ctx.fillStyle = g; ctx.fill();
      ctx.clip();
      if (o.after) o.after(ctx, { mx, my, nx, ny, dx, dy, lo, hi, qa, qb, H });
      ctx.strokeStyle = 'rgba(255,255,255,' + (o.sheen == null ? 0.22 : o.sheen) + ')'; ctx.lineWidth = Math.max(1, (hi - lo) * 0.09);
      const sh = lo + (hi - lo) * 0.24;
      ctx.beginPath(); ctx.moveTo(qa.x + nx * sh, qa.y + ny * sh); ctx.lineTo(qb.x + nx * sh, qb.y + ny * sh); ctx.stroke();
      ctx.restore();
      ctx.save(); MEAS.path(ctx, H); ctx.strokeStyle = o.edge || 'rgba(230,236,240,.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }, o.bias || 0);
  }
  const labelAt = (F, at, text, o) => {
    o = o || {};
    F.push(at, () => { const q = F.cam.project(at); if (!q.ok) return; halo(F.ctx, text, q.x + (o.dx || 0), q.y + (o.dy || 0), o.col || (o.sel ? '#FFD66B' : '#DCE6F6'), { align: o.align || 'center', base: o.base || 'bottom', font: mono(o.size || 10, 600) }); }, o.bias == null ? -0.2 : o.bias);
  };

  /* ============================================================
     3D — THE MEMBRANE BENCH
     viskingBag: top = where the thread meets the rod; o.len m; o.r m (from its
     volume); o.fill the contents' colour; o.slack 0 tight … 1 floppy (the
     creases go as it fills); o.liquid {z, tint}: the beaker's water level,
     which veils the part of the bag below it.
     ============================================================ */
  function viskingBag(F, top, o) {
    o = o || {};
    const L = o.len || 0.1, r = o.r || 0.008, drop = o.drop || 0.01;
    const a = [top[0], top[1], top[2] - drop - 0.006], b = [top[0], top[1], top[2] - drop - 0.006 - L];
    R3.cylinder(F, top, [top[0], top[1], a[2] + 0.004], 0.0004, '#E8E2D0', { segments: 5, shadow: false });
    R3.cylinder(F, [a[0], a[1], a[2] + 0.001], [a[0], a[1], a[2] + 0.007], 0.0021, '#D9DBCF', { segments: 8, shadow: false });
    R3.sphere(F, [a[0], a[1], a[2] + 0.0075], 0.0026, '#D0D2C4', { shadow: false });
    R3.cylinder(F, [b[0], b[1], b[2] - 0.001], [b[0], b[1], b[2] - 0.008], 0.0019, '#D9DBCF', { segments: 8, shadow: false });
    const slack = clamp(o.slack == null ? 0.4 : o.slack, 0, 1), liq = o.liquid;
    capsule(F, a, b, r, o.fill || '#EDEEE8', {
      alpha: o.alpha == null ? 0.82 : o.alpha, bias: -0.05, edge: 'rgba(236,240,232,.75)', sheen: 0.18 + 0.2 * (1 - slack),
      after: (ctx, g) => {
        const n = Math.round(6 * slack);
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < n; i++) { const s = g.lo + (g.hi - g.lo) * (0.15 + 0.7 * (i + 0.5) / n), wob = (i % 2 ? 1 : -1) * 2; ctx.beginPath(); ctx.moveTo(g.qa.x + g.nx * s, g.qa.y + g.ny * s); ctx.quadraticCurveTo((g.qa.x + g.qb.x) / 2 + g.nx * (s + wob), (g.qa.y + g.qb.y) / 2 + g.ny * (s + wob), g.qb.x + g.nx * s, g.qb.y + g.ny * s); ctx.stroke(); }
        if (liq) {
          const q = F.cam.project([top[0], top[1], liq.z]); if (!q.ok) return;
          ctx.fillStyle = rgba(liq.tint || '#CFE8F6', liq.alpha == null ? 0.28 : liq.alpha); ctx.fillRect(-1e4, q.y, 2e4, 2e4);
          ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1e4, q.y); ctx.lineTo(1e4, q.y); ctx.stroke();
        }
      }
    });
    return { a, b };
  }
  function glassRod(F, a, b) { R3.cylinder(F, a, b, 0.0025, '#D8EEF4', { segments: 10, shadow: false, ambient: 0.8, bias: -0.06 }); }
  /* a test tube: o.level 0…1 of its height, o.liquid colour, o.cloud 0 clear … 1 opaque, o.label */
  function testTube(F, base, o) {
    o = o || {};
    const r = o.r || 0.008, H = o.h || 0.1, lv = clamp(o.level == null ? 0.6 : o.level, 0, 0.95), cloud = o.cloud == null ? 0 : o.cloud;
    const liq = o.liquid || '#DDEEF6';
    if (lv > 0.01) capsule(F, [base[0], base[1], base[2] + r], [base[0], base[1], base[2] + r + lv * (H - r)], r * 0.9, cloud > 0.5 ? mix(liq, '#6A4040', 0.12 * cloud) : liq, { alpha: 0.4 + 0.56 * cloud, bias: -0.003, sheen: 0.12 + 0.2 * (1 - cloud), edge: 'rgba(255,255,255,.18)' });
    capsule(F, [base[0], base[1], base[2] + r], [base[0], base[1], base[2] + H], r, '#E8F4F8', { alpha: 0.13, edge: 'rgba(235,245,250,.7)', sheen: 0.3, bias: -0.004 });
    if (o.label) labelAt(F, [base[0], base[1], base[2] + H + 0.012], o.label, { sel: o.sel, size: o.size || 10 });
  }
  /* a rack of test tubes, and a printed card behind them: read the print through a clear tube, not a cloudy one */
  let cardImg = null;
  function printCard() {
    if (cardImg) return cardImg;
    const c = canvas(512, 160), x = c.getContext('2d');
    x.fillStyle = '#F4F1E8'; x.fillRect(0, 0, 512, 160);
    x.fillStyle = '#1A1A1A'; x.font = '700 22px Georgia,serif';
    const words = 'The membrane lets water through and keeps the red cell whole until it swells past its limit and bursts open'.split(' ');
    let xx = 14, yy = 30;
    words.forEach(w => { const ww = x.measureText(w + ' ').width; if (xx + ww > 500) { xx = 14; yy += 30; } x.fillText(w, xx, yy); xx += ww; });
    cardImg = c; return c;
  }
  function tubeRack(F, at, tubes, o) {
    o = o || {};
    const n = tubes.length, pitch = o.pitch || 0.026, W = n * pitch + 0.02;
    if (o.card !== false) R3.texPlane(F, [at[0], at[1] + 0.036, at[2] + 0.075], [W / 2, 0, 0], [0, 0, -0.03], printCard(), { grid: 4, bias: 0.05 });
    R3.box(F, [at[0], at[1], at[2] + 0.004], [W, 0.05, 0.008], '#8A5A30', { ambient: 0.45 });
    R3.box(F, [at[0], at[1], at[2] + 0.06], [W, 0.05, 0.008], '#94643A', { shadow: false, ambient: 0.45 });
    [-1, 1].forEach(s => R3.box(F, [at[0] + s * (W / 2 - 0.004), at[1], at[2] + 0.032], [0.008, 0.05, 0.056], '#7E522C', { shadow: false }));
    const out = [];
    tubes.forEach((t, i) => { const bx = [at[0] - W / 2 + 0.01 + pitch * (i + 0.5), at[1], at[2] + 0.008]; testTube(F, bx, Object.assign({ r: 0.0072, h: 0.1 }, t)); out.push(bx); });
    return out;
  }
  /* a small bottle with a label */
  function smallBottle(F, base, name, o) {
    o = o || {};
    const g = o.glass || '#5A3A1A';
    R3.cylinder(F, base, [base[0], base[1], base[2] + 0.05], 0.014, g, { segments: 18, ambient: 0.45 });
    R3.cylinder(F, [base[0], base[1], base[2] + 0.05], [base[0], base[1], base[2] + 0.058], 0.007, g, { segments: 14, shadow: false });
    R3.cylinder(F, [base[0], base[1], base[2] + 0.058], [base[0], base[1], base[2] + 0.072], 0.006, '#20242C', { segments: 14, shadow: false });
    if (name) labelAt(F, [base[0], base[1], base[2] + 0.082], name, { size: 9.5 });
  }

  /* ============================================================
     3D — ACETABULARIA IN A TANK
     base: where the rhizoid holds the bottom; o.stalk m; o.cap {f 0 smooth … 1 crenulate, grow 0…1};
     o.cut: a flat wound at the top; o.graft: height of the graft band; o.nucleus; o.dead.
     ============================================================ */
  const GREEN = '#5FA844', GREEN_D = '#3E7A2C';
  function acetabularia(F, base, o) {
    o = o || {};
    const L = o.stalk || 0.04, dead = !!o.dead, g = dead ? '#9A9464' : GREEN, top = [base[0], base[1], base[2] + L];
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.4; R3.cylinder(F, [base[0], base[1], base[2] + 0.001], [base[0] + Math.cos(a) * 0.0045, base[1] + Math.sin(a) * 0.0045, base[2] - 0.0012], 0.00045, '#D2D2B0', { segments: 5, shadow: false }); }
    R3.sphere(F, [base[0], base[1], base[2] + 0.0012], 0.0015, '#D6D6AE', { shadow: false });
    if (o.nucleus) R3.sphere(F, [base[0], base[1] - 0.0010, base[2] + 0.0014], 0.0007, o.nucleusCol || '#E8B458', { shadow: false, rim: 0.2 });
    if (L > 0.002) R3.cylinder(F, [base[0], base[1], base[2] + 0.002], top, 0.0005, g, { segments: 10, shadow: false, ambient: 0.55 });
    if (o.graft != null) R3.cylinder(F, [base[0], base[1], base[2] + o.graft - 0.0007], [base[0], base[1], base[2] + o.graft + 0.0007], 0.00085, '#35602A', { segments: 10, shadow: false });
    if (o.hairs && !dead) for (let w = 0; w < 3; w++) { const z = top[2] - 0.002 - w * 0.0035; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + w; R3.cylinder(F, [top[0], top[1], z], [top[0] + Math.cos(a) * 0.0032, top[1] + Math.sin(a) * 0.0032, z + 0.0016], 0.00016, '#8CC06C', { segments: 4, shadow: false }); } }
    if (o.cut) { R3.cylinder(F, top, [top[0], top[1], top[2] + 0.0004], 0.0007, '#2E4A20', { segments: 10, shadow: false }); return { top }; }
    if (o.cap && o.cap.grow > 0.02) capOnStalk(F, top, o.cap.f, o.cap.grow, dead ? '#8A8458' : GREEN_D);
    return { top };
  }
  /* the cap on its stalk, as the camera sees it: 48 rays in a shallow cone */
  function capOnStalk(F, top, f, grow, col) {
    const R = 0.0048 * clamp(grow, 0, 1) + 0.0004, n = 48, cam = F.cam, c = [top[0], top[1], top[2] + 0.0004];
    F.push(c, () => {
      const ctx = F.ctx, rays = [];
      for (let i = 0; i < n; i++) {
        const am = (i + 0.5) / n * TAU, half = TAU / n / 2 * (1 - (0.06 + 0.5 * f)), tip = R * (1 + 0.05 * f * Math.cos(i * 1.7)), dip = R * (1 - 0.16 * f);
        const pts = [[0.2 * R, am - half], [dip, am - half], [tip, am], [dip, am + half], [0.2 * R, am + half]].map(([rr, a]) => cam.project([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2] + 0.0009 * rr / R]));
        if (pts.some(v => !v.ok)) return;
        rays.push(pts);
      }
      ctx.save();
      rays.forEach((q, i) => { ctx.beginPath(); q.forEach((v, k) => k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fillStyle = mix(col, '#B4E08A', 0.22 + 0.16 * Math.sin(i * 0.9)); ctx.fill(); ctx.strokeStyle = 'rgba(28,56,18,.5)'; ctx.lineWidth = 0.5; ctx.stroke(); });
      const q0 = cam.project(c); if (q0.ok) { ctx.fillStyle = '#2E5A20'; ctx.beginPath(); ctx.arc(q0.x, q0.y, Math.max(1.2, R * 0.2 * q0.s), 0, TAU); ctx.fill(); }
      ctx.restore();
    }, -0.003);
  }
  /* a glass tank of water: its back drawn before what stands in it, its front after, tinting it */
  function tank(F, c, W, D, H, o) {
    o = o || {};
    const lv = o.level == null ? 0.85 : o.level, x0 = c[0] - W / 2, x1 = c[0] + W / 2, y0 = c[1] - D / 2, y1 = c[1] + D / 2, z0 = c[2], z1 = c[2] + H;
    const water = o.water || '#7FB6C8';
    R3.box(F, [c[0], c[1], z0 + 0.002], [W, D, 0.004], '#E8F2F4', { alpha: 0.5, shadow: false });
    if (o.sand) R3.box(F, [c[0], c[1], z0 + 0.0045], [W - 0.004, D - 0.004, 0.003], o.sand, { shadow: false, ambient: 0.6 });
    // which long side faces the camera: that one is drawn over what stands inside, the other under it
    const yn = F.cam.eye[1] < c[1] ? y0 : y1, yf = yn === y0 ? y1 : y0;
    F.push([c[0], yf, z0 + H / 2], () => {
      const ctx = F.ctx, P = [[x0, yf, z0], [x1, yf, z0], [x1, yf, z0 + H * lv], [x0, yf, z0 + H * lv]].map(p => F.cam.project(p));
      if (P.some(q => !q.ok)) return; ctx.save(); MEAS.path(ctx, P); ctx.fillStyle = rgba(water, 0.24); ctx.fill(); ctx.restore();
    }, 0.3);
    F.push([c[0], yn, z0 + H / 2], () => {
      const ctx = F.ctx, Pw = [[x0, yn, z0], [x1, yn, z0], [x1, yn, z0 + H * lv], [x0, yn, z0 + H * lv]].map(p => F.cam.project(p)), Pg = [[x0, yn, z0], [x1, yn, z0], [x1, yn, z1], [x0, yn, z1]].map(p => F.cam.project(p));
      const Ps = [[x0, y0, z0 + H * lv], [x1, y0, z0 + H * lv], [x1, y1, z0 + H * lv], [x0, y1, z0 + H * lv]].map(p => F.cam.project(p));
      if (Pw.some(q => !q.ok) || Pg.some(q => !q.ok) || Ps.some(q => !q.ok)) return;
      ctx.save(); MEAS.path(ctx, Pw); const g = ctx.createLinearGradient(0, Pw[3].y, 0, Pw[0].y); g.addColorStop(0, rgba(water, 0.14)); g.addColorStop(1, rgba(mix(water, '#0A2A38', 0.4), 0.3)); ctx.fillStyle = g; ctx.fill();
      MEAS.path(ctx, Ps); ctx.fillStyle = rgba(mix(water, '#FFFFFF', 0.3), 0.12); ctx.fill();
      ctx.strokeStyle = 'rgba(220,240,248,.5)'; ctx.lineWidth = 1; MEAS.path(ctx, Pg); ctx.stroke();
      ctx.strokeStyle = 'rgba(235,250,255,.55)'; ctx.beginPath(); ctx.moveTo(Pw[3].x, Pw[3].y); ctx.lineTo(Pw[2].x, Pw[2].y); ctx.stroke();
      ctx.restore();
    }, -0.3);
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => R3.cylinder(F, [x, y, z0], [x, y, z1], 0.0011, '#CFE4EA', { segments: 6, shadow: false, ambient: 0.8 }));
  }
  function scalpel(F, at, a) {
    const d = [Math.cos(a || 0), Math.sin(a || 0), 0];
    R3.cylinder(F, at, V3.add(at, V3.sc(d, 0.09)), 0.003, '#A8B0BA', { segments: 8, ambient: 0.5 });
    R3.cylinder(F, V3.add(at, V3.sc(d, 0.09)), V3.add(at, V3.sc(d, 0.115)), 0.0012, '#DDE4EC', { segments: 6, shadow: false, ambient: 0.7 });
  }

  /* ============================================================
     3D — THE RESPIROMETER
     A clear water bath; three vials lying on its floor, each stoppered with a
     1 mL pipette (0.01 mL divisions) that runs on towards the front of the
     bath; KOH-soaked cotton at the far end of each vial; peas, maggots or
     beads; a drop of dye in each pipette, o.vials[i].read (0…1 mL) in from
     its open tip.
     ============================================================ */
  function respirometer(F, at, o) {
    o = o || {};
    const W = 0.4, D = 0.22, H = 0.09, T = o.T == null ? 22 : o.T;
    tank(F, [at[0], at[1], at[2]], W, D, H, { water: T > 30 ? '#94B8BC' : T < 12 ? '#7AA8CC' : '#80B0C8', level: 0.82 });
    const out = [], rr = rng(11);
    (o.vials || []).forEach((v, i) => {
      const y = at[1] - D / 2 + D * (i + 0.5) / 3, z = at[2] + 0.018, x0 = at[0] - 0.17, x1 = at[0] - 0.04;
      const kind = v.kind || 'peas';
      if (kind === 'maggots') for (let k = 0; k < 14; k++) { const px = x0 + 0.03 + rr() * 0.08, py = y + (rr() - 0.5) * 0.01, pz = z - 0.004 + rr() * 0.006, a = rr() * TAU; R3.cylinder(F, [px, py, pz], [px + Math.cos(a) * 0.009, py + Math.sin(a) * 0.004, pz + 0.001], 0.0022, '#EDE6D2', { segments: 7, shadow: false, ambient: 0.6 }); }
      else { const pc = kind === 'dry' ? '#C9B878' : kind === 'beads' ? '#DDE8EE' : kind === 'boiled' ? '#B8B070' : '#9CC460', pr = kind === 'dry' ? 0.0029 : 0.0039; for (let k = 0; k < 16; k++) R3.sphere(F, [x0 + 0.03 + rr() * 0.085, y + (rr() - 0.5) * 0.01, z - 0.004 + rr() * 0.007], pr * (0.85 + rr() * 0.3), pc, { shadow: false, rim: 0.3 }); }
      if (v.mixBeads) for (let k = 0; k < 6; k++) R3.sphere(F, [x0 + 0.03 + rr() * 0.085, y + (rr() - 0.5) * 0.01, z - 0.004 + rr() * 0.007], 0.0035, '#DDE8EE', { shadow: false, rim: 0.3 });
      R3.cylinder(F, [x0 + 0.004, y, z], [x0 + 0.016, y, z], 0.0085, v.koh === false ? '#E4E0D4' : '#F6F6F4', { segments: 12, shadow: false });
      capsule(F, [x0, y, z], [x1, y, z], 0.0115, '#E6F2F6', { alpha: 0.16, edge: 'rgba(235,245,250,.65)', sheen: 0.28, bias: -0.004 });
      R3.cylinder(F, [x1 - 0.002, y, z], [x1 + 0.012, y, z], 0.008, '#9C5A30', { segments: 12, shadow: false });
      const p0 = [x1 + 0.012, y, z], p1 = [at[0] + W / 2 - 0.012, y, z], L = p1[0] - p0[0];
      R3.cylinder(F, p0, p1, 0.0022, '#E8F4F8', { segments: 8, shadow: false, ambient: 0.85 });
      F.push(V3.sc(V3.add(p0, p1), 0.5), () => {
        const ctx = F.ctx; ctx.save(); ctx.strokeStyle = 'rgba(20,30,40,.7)'; ctx.lineWidth = 0.8;
        for (let m = 0; m <= 10; m++) { const x = p1[0] - 0.01 - (L - 0.02) * m / 10, a = F.cam.project([x, y, z + 0.0022]), b = F.cam.project([x, y, z + 0.0022 + (m % 5 ? 0.0018 : 0.0034)]); if (!a.ok || !b.ok) continue; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        ctx.restore();
      }, -0.006);
      const u = clamp(v.read || 0, 0, 1), dx = p1[0] - 0.01 - (L - 0.02) * u;
      R3.cylinder(F, [dx - 0.0035, y, z], [dx + 0.0035, y, z], 0.0019, v.dye || '#2E5AD8', { segments: 8, shadow: false, ambient: 0.8, bias: -0.008 });
      out.push({ drop: [dx, y, z], vial: [(x0 + x1) / 2, y, z], tip: p1 });
      if (v.label) labelAt(F, [(x0 + x1) / 2, y, z + 0.022], v.label, { size: 10, sel: v.sel });
    });
    const tx = at[0] + W / 2 - 0.03, ty = at[1] + D / 2 - 0.02;
    R3.cylinder(F, [tx, ty, at[2] + 0.01], [tx, ty, at[2] + H + 0.08], 0.003, '#EEF4F6', { segments: 8, shadow: false, ambient: 0.8 });
    R3.cylinder(F, [tx, ty, at[2] + 0.01], [tx, ty, at[2] + 0.012 + clamp(T / 50, 0, 1) * (H + 0.06)], 0.0012, '#D8342C', { segments: 6, shadow: false });
    return out;
  }

  /* ============================================================
     3D — ELODEA UNDER A LAMP
     at: the foot of the boiling tube; o.d m, the lamp's distance along the rule;
     o.rate bubbles a minute; o.t s; o.col the light; o.shield (a beaker of water between).
     ============================================================ */
  function elodeaRig(F, at, o) {
    o = o || {};
    const tubeH = 0.16, r = 0.0125, top = [at[0], at[1], at[2] + tubeH], d = o.d || 0.2;
    R3.box(F, [at[0] + 0.05, at[1], at[2] + 0.005], [0.16, 0.1, 0.01], '#2C3445', { ambient: 0.35 });
    R3.cylinder(F, [at[0] + 0.1, at[1], at[2] + 0.01], [at[0] + 0.1, at[1], at[2] + 0.26], 0.005, '#B8C2D0', { segments: 10, shadow: false });
    R3.cylinder(F, [at[0] + 0.1, at[1], at[2] + 0.13], [at[0] + 0.014, at[1], at[2] + 0.13], 0.003, '#9AA4B2', { segments: 8, shadow: false });
    R3.cylinder(F, [at[0] + 0.014, at[1] - 0.004, at[2] + 0.13], [at[0] + 0.014, at[1] + 0.004, at[2] + 0.13], 0.0045, '#6A7280', { segments: 8, shadow: false });
    const s0 = [at[0], at[1], at[2] + 0.03], s1 = [at[0] + 0.001, at[1], at[2] + 0.125];
    R3.cylinder(F, s0, s1, 0.0012, '#4E9A3A', { segments: 6, shadow: false, ambient: 0.5 });
    for (let k = 0; k < 10; k++) {
      const z = s0[2] + 0.003 + k * 0.0092;
      for (let j = 0; j < 3; j++) { const a = j / 3 * TAU + k * 0.8; R3.cylinder(F, [s0[0], s0[1], z], [s0[0] + Math.cos(a) * 0.0095, s0[1] + Math.sin(a) * 0.0095, z - 0.0035], 0.0021, j % 2 ? '#5CAA40' : '#66B448', { segments: 5, shadow: false, ambient: 0.55 }); }
    }
    const rate = Math.max(0, o.rate || 0), t = o.t || 0, per = rate > 0 ? 60 / rate : 1e9, rise = 0.012;
    if (rate > 0.05) for (let k = 0; k < 10; k++) {
      const age = ((t / per) % 1 + k) * per; if (age > 3) continue;
      const z = s1[2] + 0.002 + age * rise; if (z > at[2] + tubeH - 0.024) continue;
      R3.sphere(F, [s1[0] + 0.0007 * Math.sin(age * 5 + k), s1[1], z], 0.0016, '#FFFFFF', { shadow: false, rim: 1, sub: 0, bias: -0.01 });
    }
    capsule(F, [at[0], at[1], at[2] + r + 0.012], [at[0], at[1], at[2] + tubeH - 0.022], r * 0.93, o.water || '#CFE6EE', { alpha: 0.2, bias: -0.004, sheen: 0.1 });
    capsule(F, [at[0], at[1], at[2] + r + 0.012], [at[0], at[1], top[2]], r, '#E8F4F8', { alpha: 0.12, edge: 'rgba(235,245,250,.75)', bias: -0.006 });
    if (o.shield !== false) MEAS.beaker(F, [at[0] - 0.075, at[1], at[2]], 0.035, 0.09, 0.07, { tint: '#CFE8F6' });
    const lampX = at[0] - d;
    BENCH.rule(F, [at[0] - 0.02, at[1] - 0.06, at[2] + 0.0005], [-1, 0, 0], 0.8, { up: [0, 0, 1] });
    deskLamp(F, [lampX - 0.02, at[1], at[2]], [at[0], at[1], at[2] + 0.09], { on: o.on !== false, col: o.col || '#FFF4D0', power: o.power });
    return { top, lamp: [lampX, at[1], at[2] + 0.09], cut: s1 };
  }
  function deskLamp(F, base, aim, o) {
    o = o || {};
    R3.cylinder(F, base, [base[0], base[1], base[2] + 0.012], 0.045, '#2A2E36', { segments: 24, ambient: 0.4 });
    const head = [base[0] + 0.02, base[1], base[2] + 0.09];
    R3.cylinder(F, [base[0], base[1], base[2] + 0.012], head, 0.004, '#9AA2AE', { segments: 8, shadow: false });
    const dir = V3.norm(V3.sub(aim, head));
    R3.cylinder(F, V3.add(head, V3.sc(dir, -0.012)), V3.add(head, V3.sc(dir, 0.03)), 0.028, '#2E3440', { segments: 20, shadow: false, inner: 0.024, capColour: '#1C2028' });
    if (o.on) {
      const p = o.power == null ? 1 : o.power;
      MICRO.glow(F, V3.add(head, V3.sc(dir, 0.03)), 0.05 + 0.05 * p, o.col || '#FFF4D0', 0.5 + 0.35 * p);
      F.push(V3.add(head, V3.sc(dir, 0.06)), () => {
        const ctx = F.ctx, q0 = F.cam.project(V3.add(head, V3.sc(dir, 0.03))), q1 = F.cam.project(aim); if (!q0.ok || !q1.ok) return;
        const g = ctx.createLinearGradient(q0.x, q0.y, q1.x, q1.y); g.addColorStop(0, rgba(o.col || '#FFF4D0', 0.16 * p)); g.addColorStop(1, rgba(o.col || '#FFF4D0', 0));
        const nx = -(q1.y - q0.y), ny = q1.x - q0.x, nl = Math.hypot(nx, ny) || 1, w0 = 0.022 * q0.s, w1 = 0.05 * q1.s;
        ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q0.x + nx / nl * w0, q0.y + ny / nl * w0); ctx.lineTo(q1.x + nx / nl * w1, q1.y + ny / nl * w1); ctx.lineTo(q1.x - nx / nl * w1, q1.y - ny / nl * w1); ctx.lineTo(q0.x - nx / nl * w0, q0.y - ny / nl * w0); ctx.closePath(); ctx.fill(); ctx.restore();
      }, -0.02);
    }
  }

  /* ============================================================
     3D — AGAR CUBES
     A cube of side L (m) at c, the alkali in to depth x from every face; o.cut:
     sliced through the middle, the back half standing with its cut face turned
     to the front, showing the pink rim and the clear core.
     ============================================================ */
  const PINK = '#D8388E', AGAR = '#EFE6C4';
  function agarCube(F, c, L, x, o) {
    o = o || {};
    const xin = clamp(x, 0, L / 2), inner = L - 2 * xin, outer = xin > 0.00015 ? PINK : AGAR;
    if (!o.cut) { R3.box(F, [c[0], c[1], c[2] + L / 2], [L, L, L], outer, { alpha: 0.9, shadowK: 0.5, ambient: 0.5 }); return; }
    R3.box(F, [c[0], c[1] + L / 4, c[2] + L / 2], [L, L / 2, L], outer, { alpha: 0.92, shadowK: 0.5, ambient: 0.5 });
    F.push([c[0], c[1] - 0.0002, c[2] + L / 2], () => {
      const ctx = F.ctx, y = c[1] - 0.00005, P = [[c[0] - L / 2, y, c[2]], [c[0] + L / 2, y, c[2]], [c[0] + L / 2, y, c[2] + L], [c[0] - L / 2, y, c[2] + L]].map(p => F.cam.project(p));
      if (P.some(q => !q.ok)) return;
      ctx.save(); MEAS.path(ctx, P); ctx.fillStyle = xin > 0.00015 ? mix(PINK, '#FFFFFF', 0.1) : AGAR; ctx.fill();
      if (inner > 0.0001) { const Q = [[c[0] - inner / 2, y, c[2] + xin], [c[0] + inner / 2, y, c[2] + xin], [c[0] + inner / 2, y, c[2] + xin + inner], [c[0] - inner / 2, y, c[2] + xin + inner]].map(p => F.cam.project(p)); if (!Q.some(q => !q.ok)) { MEAS.path(ctx, Q); ctx.fillStyle = AGAR; ctx.fill(); ctx.strokeStyle = 'rgba(170,40,110,.35)'; ctx.lineWidth = 1; ctx.stroke(); } }
      MEAS.path(ctx, P); ctx.strokeStyle = 'rgba(110,26,80,.55)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }, -0.002);
  }
  /* a white tile, drawn with the ground so things standing on it are never hidden under it */
  function tile(F, c, w, d, o) {
    o = o || {};
    const z = c[2] + 0.005, col = o.col || '#F2F2EE';
    F.push(c, () => {
      const ctx = F.ctx, top = [[c[0] - w / 2, c[1] - d / 2, z], [c[0] + w / 2, c[1] - d / 2, z], [c[0] + w / 2, c[1] + d / 2, z], [c[0] - w / 2, c[1] + d / 2, z]].map(p => F.cam.project(p));
      const fr = [[c[0] - w / 2, c[1] - d / 2, c[2]], [c[0] + w / 2, c[1] - d / 2, c[2]], [c[0] + w / 2, c[1] - d / 2, z], [c[0] - w / 2, c[1] - d / 2, z]].map(p => F.cam.project(p));
      if (top.some(q => !q.ok) || fr.some(q => !q.ok)) return;
      ctx.save(); MEAS.path(ctx, fr); ctx.fillStyle = mix(col, '#303640', 0.35); ctx.fill();
      MEAS.path(ctx, top); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }, F.GROUND * 0.5);
  }
  /* a shallow glass dish of liquid (the alkali), drawn with the ground */
  function dish(F, c, w, d, o) {
    o = o || {};
    const z = c[2] + (o.h || 0.012), liq = o.liquid || '#E8EEF2';
    F.push(c, () => {
      const ctx = F.ctx, P = (zz, ins) => [[c[0] - w / 2 + ins, c[1] - d / 2 + ins, zz], [c[0] + w / 2 - ins, c[1] - d / 2 + ins, zz], [c[0] + w / 2 - ins, c[1] + d / 2 - ins, zz], [c[0] - w / 2 + ins, c[1] + d / 2 - ins, zz]].map(p => F.cam.project(p));
      const bot = P(c[2], 0), rim = P(z, 0), lq = P(z * 0.7 + c[2] * 0.3, 0.002);
      if ([...bot, ...rim, ...lq].some(q => !q.ok)) return;
      ctx.save();
      MEAS.path(ctx, bot); ctx.fillStyle = 'rgba(210,228,236,.25)'; ctx.fill();
      MEAS.path(ctx, lq); ctx.fillStyle = rgba(liq, 0.34); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke();
      MEAS.path(ctx, rim); ctx.strokeStyle = 'rgba(225,240,248,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      [0, 1, 2, 3].forEach(i => { ctx.beginPath(); ctx.moveTo(bot[i].x, bot[i].y); ctx.lineTo(rim[i].x, rim[i].y); ctx.stroke(); });
      ctx.restore();
    }, F.GROUND * 0.4);
  }
  /* half a red onion, cut face up */
  function redOnion(F, c, R) {
    R3.sphere(F, [c[0], c[1], c[2] + R * 0.1], R, '#8E2A5A', { rim: 0.5, sub: 0.2 });
    F.push([c[0], c[1], c[2] + R * 0.12], () => {
      const ctx = F.ctx;
      for (let k = 0; k < 6; k++) { const rr = R * (1 - k * 0.15); const P = MEAS.ringPts(F.cam, [c[0], c[1], c[2] + R * 0.9], rr * 0.95, 36); if (!P) return; MEAS.path(ctx, P); ctx.fillStyle = k % 2 ? '#F2E4EE' : '#E4C8DA'; ctx.fill(); ctx.strokeStyle = 'rgba(150,40,100,.8)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    }, -0.01);
  }

  /* ============================================================
     THE MEMBRANE, MAGNIFIED
     A window 12 nm across on the bag's wall: the inside of the bag on the
     left, the beaker on the right, the tubing between them a mesh of
     cellulose with pores 2.4 nm wide through it (the real wall is thousands
     of times thicker; this is the mouth of one stretch of pores). Molecules are
     drawn to size and move — a billion times slower than they do. The lab
     says how many of each should be on each side (their concentrations) and
     how often they cross each way; this makes it so, crossing through a pore
     when it can and wandering in from the wider solution when it must.
     ============================================================ */
  const MW = { half: 6, mem: 1.4, pore: 1.2, pores: [-3.7, 0.1, 3.8] };      // nm
  const MOL = {
    water: { r: 0.14, col: '#8FD4FA', v: 3.2 },
    glucose: { r: 0.44, col: '#F4C44E', v: 1.4 },
    sucrose: { r: 0.56, col: '#F49A48', v: 1.1 },
    salt: { r: 0.21, col: '#C6A2FF', v: 2.2 },
    iodine: { r: 0.3, col: '#B0561E', v: 1.8 },
    starch: { r: 0.66, col: '#DCD2B2', v: 0.18 }
  };
  function memSim(seed) { return { parts: [], chains: [], t: 0, r: rng(seed || 7), crossed: {}, recent: [] }; }
  const sideOf = p => p.x < 0 ? -1 : 1;
  function spawn(sim, k, side, edge) {
    const r = sim.r, m = MOL[k], x = edge ? side * (MW.half - 0.4 - r() * 0.8) : side * (MW.mem + m.r + 0.3 + r() * (MW.half - MW.mem - m.r - 0.6));
    const p = { k, x, y: (r() - 0.5) * 2 * (MW.half - 0.5), vx: 0, vy: 0, a: r() * TAU, w: (r() - 0.5) * 2, fade: edge ? 0 : 1, leave: false, cross: null, n: k === 'salt' ? (r() < 0.5 ? 'Na' : 'Cl') : '' };
    sim.parts.push(p); return p;
  }
  function chain(sim, x, y) {
    const pts = [], r = sim.r; let a = r() * TAU;
    for (let i = 0; i < 18; i++) { pts.push([x, y]); a += (r() - 0.5) * 0.9; x += Math.cos(a) * 1.1; y += Math.sin(a) * 1.1; }
    sim.chains.push({ pts, ph: r() * TAU });
  }
  /* tgt: { counts: {k: [inside, outside]}, rates: {k: [into the bag, out of it] per s}, starch: n } */
  function memStep(sim, tgt, dt) {
    const r = sim.r; sim.t += dt;
    const nCh = tgt.starch || 0;
    while (sim.chains.length < nCh) chain(sim, -MW.half + 0.8 + r() * 2.5, (r() - 0.5) * 8);
    while (sim.chains.length > nCh) sim.chains.pop();
    sim.chains.forEach(ch => {
      ch.pts.forEach(q => { q[0] += (r() - 0.5) * 1.5 * dt; q[1] += (r() - 0.5) * 1.5 * dt; });
      for (let it = 0; it < 2; it++) for (let i = 1; i < ch.pts.length; i++) { const a = ch.pts[i - 1], b = ch.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, e = (d - 1.1) / d * 0.5; a[0] += dx * e; a[1] += dy * e; b[0] -= dx * e; b[1] -= dy * e; }
      ch.pts.forEach(q => { q[0] = clamp(q[0], -MW.half * 1.6, -MW.mem - 0.9); q[1] = clamp(q[1], -MW.half * 1.5, MW.half * 1.5); });
    });
    Object.keys(tgt.rates || {}).forEach(k => {
      const [rin, rout] = tgt.rates[k];
      [[rin, 1, -1], [rout, -1, 1]].forEach(([rate, from, to]) => {
        if (!(rate > 0)) return;
        let n = rate * dt; while (n > 0) { if (r() < Math.min(1, n)) startCross(sim, k, from, to); n -= 1; }
      });
    });
    Object.keys(tgt.counts || {}).forEach(k => {
      [[-1, 0], [1, 1]].forEach(([side, idx]) => {
        const want = Math.round(tgt.counts[k][idx]);
        const here = sim.parts.filter(p => p.k === k && !p.leave && (p.cross ? p.cross.to === side : sideOf(p) === side));
        if (here.length < want) for (let i = here.length; i < want; i++) spawn(sim, k, side, sim.t > 0.2);
        else if (here.length > want) here.filter(p => !p.cross).sort((a, b) => Math.abs(b.x) - Math.abs(a.x)).slice(0, here.length - want).forEach(p => { p.leave = true; });
      });
    });
    sim.parts.forEach(p => {
      const m = MOL[p.k];
      if (p.fade < 1 && !p.leave) p.fade = Math.min(1, p.fade + dt * 2.5);
      if (p.leave) { p.fade -= dt * 1.6; p.x += sideOf(p) * dt * 1.5; }
      if (p.cross) {
        const c = p.cross; c.t += dt;
        const u = clamp(c.t / c.dur, 0, 1), x0 = c.from * (MW.mem + m.r + 0.4), x1 = c.to * (MW.mem + m.r + 0.4);
        if (u < 0.3) { const s = u / 0.3; p.x = c.sx + (x0 - c.sx) * s; p.y = c.sy + (c.y - c.sy) * s; }
        else if (u < 0.8) { const s = (u - 0.3) / 0.5; p.x = x0 + (x1 - x0) * s; p.y = c.y + Math.sin(s * 9) * 0.12; }
        else { const s = (u - 0.8) / 0.2; p.x = x1 + c.to * s * 1.2; }
        if (u >= 1) p.cross = null;
        return;
      }
      p.vx = p.vx * 0.86 + (r() - 0.5) * m.v * 0.9; p.vy = p.vy * 0.86 + (r() - 0.5) * m.v * 0.9;
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.w * dt;
      const s = sideOf(p), lim = MW.mem + m.r;
      if (s < 0 && p.x > -lim) { p.x = -lim; p.vx = -Math.abs(p.vx); }
      if (s > 0 && p.x < lim) { p.x = lim; p.vx = Math.abs(p.vx); }
      if (!p.leave && Math.abs(p.x) > MW.half - m.r) { p.x = s * (MW.half - m.r); p.vx = -p.vx; }
      if (Math.abs(p.y) > MW.half - m.r) { p.y = Math.sign(p.y) * (MW.half - m.r); p.vy = -p.vy; }
      if (s < 0 && p.k !== 'iodine') sim.chains.forEach(ch => ch.pts.forEach(q => { const dx = p.x - q[0], dy = p.y - q[1], d = Math.hypot(dx, dy); if (d < 0.7 + m.r && d > 1e-6) { p.x = q[0] + dx / d * (0.7 + m.r); p.y = q[1] + dy / d * (0.7 + m.r); } }));
    });
    sim.parts = sim.parts.filter(p => !(p.leave && p.fade <= 0));
    sim.recent = sim.recent.filter(e => sim.t - e.t < 60);
  }
  function startCross(sim, k, from, to) {
    const cand = sim.parts.filter(p => p.k === k && !p.cross && !p.leave && sideOf(p) === from);
    if (!cand.length) return;
    let best = null, bd = 1e9, py = 0;
    cand.forEach(p => MW.pores.forEach(y => { const d = Math.hypot(Math.abs(p.x) - MW.mem, p.y - y); if (d < bd) { bd = d; best = p; py = y; } }));
    if (!best || bd > 5) return;
    const m = MOL[k];
    best.cross = { from, to, y: py + (sim.r() - 0.5) * Math.max(0, (MW.pore - m.r) * 1.4), t: 0, dur: 0.5 + 2.2 * m.r / m.v * 3, sx: best.x, sy: best.y };
    const c = sim.crossed[k] || (sim.crossed[k] = [0, 0]); c[to < 0 ? 0 : 1]++;
    sim.recent.push({ k, to, t: sim.t });
  }
  function drawMolecule(ctx, p, X, Y, s) {
    const m = MOL[p.k], x = X(p.x), y = Y(p.y), R = m.r * s;
    ctx.globalAlpha = clamp(p.fade, 0, 1);
    if (p.k === 'water') { ctx.fillStyle = m.col; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x + Math.cos(p.a) * R * 0.85, y + Math.sin(p.a) * R * 0.85, R * 0.45, 0, TAU); ctx.arc(x + Math.cos(p.a + 1.8) * R * 0.85, y + Math.sin(p.a + 1.8) * R * 0.85, R * 0.45, 0, TAU); ctx.fill(); }
    else if (p.k === 'glucose' || p.k === 'sucrose') {
      const ring = (cx, cy, rr, n, a) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const t = a + i / n * TAU; i ? ctx.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr) : ctx.moveTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); } ctx.closePath(); ctx.fillStyle = rgba(m.col, 0.55); ctx.fill(); ctx.strokeStyle = mix(m.col, '#3A2A08', 0.45); ctx.lineWidth = Math.max(1, R * 0.16); ctx.stroke(); };
      if (p.k === 'glucose') ring(x, y, R * 0.82, 6, p.a);
      else { const dx = Math.cos(p.a) * R * 0.5, dy = Math.sin(p.a) * R * 0.5; ring(x - dx, y - dy, R * 0.48, 6, p.a); ring(x + dx, y + dy, R * 0.42, 5, p.a + 0.3); }
    } else if (p.k === 'salt') { const na = p.n === 'Na', rr = na ? R * 0.8 : R * 1.15; ctx.fillStyle = na ? '#B894FF' : '#7ED49A'; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(20,20,30,.8)'; ctx.font = mono(Math.max(7, rr * 1.3), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(na ? '+' : '−', x, y + 0.5); }
    else if (p.k === 'iodine') { for (let i = -1; i <= 1; i++) { ctx.fillStyle = i ? '#9A4818' : '#C0642A'; ctx.beginPath(); ctx.arc(x + Math.cos(p.a) * i * R * 0.95, y + Math.sin(p.a) * i * R * 0.95, R * 0.62, 0, TAU); ctx.fill(); } }
    ctx.globalAlpha = 1;
  }
  function memDraw(ctx, cx, cy, R, sim, o) {
    o = o || {};
    const s = R / (MW.half * 0.96), X = x => cx + x * s, Y = y => cy + y * s;
    ctx.save();
    ctx.fillStyle = '#020306'; ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const gi = ctx.createLinearGradient(cx - R, 0, cx, 0); gi.addColorStop(0, mix(o.inTint || '#1C2A3C', '#000000', 0.25)); gi.addColorStop(1, o.inTint || '#1C2A3C');
    ctx.fillStyle = gi; ctx.fillRect(cx - R, cy - R, R, 2 * R);
    const go = ctx.createLinearGradient(cx, 0, cx + R, 0); go.addColorStop(0, o.outTint || '#1C2A3C'); go.addColorStop(1, mix(o.outTint || '#1C2A3C', '#000000', 0.25));
    ctx.fillStyle = go; ctx.fillRect(cx, cy - R, R, 2 * R);
    const bound = clamp(o.bound || 0, 0, 1);
    sim.chains.forEach(ch => {
      const col = mix('#DCD2B2', '#2A2E6A', bound), P = ch.pts;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(col, 0.22); ctx.lineWidth = 1.3 * s; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, 0.16 * s); ctx.beginPath();
      for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; for (let j = 0; j < 8; j++) { const u = j / 8, ph = (i + u) * TAU / 0.8 * 1.1 + ch.ph, w = Math.sin(ph) * 0.62; const xx = a[0] + dx * u + nx * w, yy = a[1] + dy * u + ny * w; (i || j) ? ctx.lineTo(X(xx), Y(yy)) : ctx.moveTo(X(xx), Y(yy)); } }
      ctx.stroke();
      if (bound > 0.05) { ctx.fillStyle = 'rgba(150,64,24,.95)'; for (let i = 1; i < P.length - 1; i += 2) { if (((i * 7) % 10) / 10 > bound) continue; const a = P[i], b = P[i + 1]; ctx.beginPath(); ctx.ellipse(X((a[0] + b[0]) / 2), Y((a[1] + b[1]) / 2), 0.36 * s, 0.14 * s, Math.atan2(b[1] - a[1], b[0] - a[0]), 0, TAU); ctx.fill(); } }
    });
    const mx0 = X(-MW.mem), mx1 = X(MW.mem);
    ctx.fillStyle = '#6E6A58'; ctx.fillRect(mx0, cy - R, mx1 - mx0, 2 * R);
    const rr = rng(5);
    ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const y = cy - R + rr() * 2 * R, x0 = mx0 + rr() * (mx1 - mx0) * 0.3, x1 = mx1 - rr() * (mx1 - mx0) * 0.3, a = (rr() - 0.5) * 0.9; ctx.strokeStyle = rr() < 0.5 ? 'rgba(206,196,160,.55)' : 'rgba(150,142,112,.6)'; ctx.lineWidth = 0.22 * s; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + a * s * 2, x1, y + a * s); ctx.stroke(); }
    MW.pores.forEach(y => { ctx.fillStyle = o.poreTint || '#22324A'; ctx.fillRect(mx0 - 1, Y(y - MW.pore), mx1 - mx0 + 2, 2 * MW.pore * s); ctx.strokeStyle = 'rgba(206,196,160,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx0, Y(y - MW.pore)); ctx.lineTo(mx1, Y(y - MW.pore)); ctx.moveTo(mx0, Y(y + MW.pore)); ctx.lineTo(mx1, Y(y + MW.pore)); ctx.stroke(); });
    ['water', 'salt', 'iodine', 'glucose', 'sucrose'].forEach(k => sim.parts.forEach(p => { if (p.k === k) drawMolecule(ctx, p, X, Y, s); }));
    const vg = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (o.labels !== false && R > 110) {
      halo(ctx, 'INSIDE THE BAG', cx - R * 0.46, cy - R * 0.56, '#EAF1FF', { align: 'center', font: mono(10.5, 700) });
      halo(ctx, 'THE BEAKER', cx + R * 0.54, cy - R * 0.56, '#EAF1FF', { align: 'center', font: mono(10.5, 700) });
      halo(ctx, 'pore 2.4 nm', mx1 + 5, Y(MW.pores[1]), '#E8DCB0', { align: 'left', font: mono(9.5, 600) });
      halo(ctx, 'tubing wall', (mx0 + mx1) / 2, cy + R * 0.86, '#E8DCB0', { align: 'center', font: mono(9.5, 600) });
      if (sim.chains.length) halo(ctx, 'starch: far wider than a pore', cx - R * 0.48, cy + R * 0.7, bound > 0.3 ? '#AFC4FF' : '#E8DCB0', { align: 'center', font: mono(9.5, 600) });
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, TAU); ctx.stroke();
    const bx = cx - s * 0.5, by = cy + R + 13; ctx.strokeStyle = '#EAF1FF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + s, by); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.moveTo(bx + s, by - 4); ctx.lineTo(bx + s, by + 4); ctx.stroke();
    ctx.fillStyle = '#EAF1FF'; ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('1 nm', cx, by + 6);
    ctx.restore();
    return { s };
  }

  /* ============================================================
     ACETABULARIA, CLOSE UP — the tank at a few times life size
     pieces: [{ L cm, cap {f, grow, old}, caps [...], nuclei [...], graft cm, kind, alive, age, cut, name }]
     Each piece stands in its own column with its newest cap seen from above beneath it.
     ============================================================ */
  const SP_COL = { med: '#E8B458', cren: '#7FC8F0' };
  function acetabView(ctx, x, y, w, h, pieces, o) {
    o = o || {};
    ctx.save(); rrect(ctx, x, y, w, h, 10); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1C4A5A'); g.addColorStop(0.7, '#123644'); g.addColorStop(1, '#0C2630');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 7; i++) { const xx = x + w * (i + 0.5) / 7 + Math.sin(i * 2.1 + (o.t || 0) * 0.4) * 10; const gr = ctx.createLinearGradient(xx, y, xx + 30, y + h * 0.8); gr.addColorStop(0, 'rgba(180,230,240,.07)'); gr.addColorStop(1, 'rgba(180,230,240,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(xx - 8, y); ctx.lineTo(xx + 14, y); ctx.lineTo(xx + 60, y + h * 0.8); ctx.lineTo(xx + 20, y + h * 0.8); ctx.closePath(); ctx.fill(); }
    const faceH = Math.min(96, h * 0.26), floorY = y + h - faceH - 22, n = Math.max(1, pieces.length);
    const k = o.k || Math.min((floorY - y - 40) / 5, w / n / 1.6);
    ctx.fillStyle = '#3A3428'; ctx.fillRect(x, floorY, w, 6); ctx.fillStyle = 'rgba(200,180,140,.25)'; ctx.fillRect(x, floorY, w, 1.5);
    // a centimetre scale on the left
    ctx.strokeStyle = 'rgba(220,232,240,.55)'; ctx.fillStyle = 'rgba(220,232,240,.7)'; ctx.lineWidth = 1; ctx.font = mono(9, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.beginPath(); ctx.moveTo(x + 10, floorY); ctx.lineTo(x + 10, floorY - 5 * k); for (let i = 0; i <= 5; i++) { ctx.moveTo(x + 10, floorY - i * k); ctx.lineTo(x + 16, floorY - i * k); } ctx.stroke();
    for (let i = 1; i <= 5; i++) ctx.fillText(i + ' cm', x + 19, floorY - i * k);
    pieces.forEach((pc, i) => {
      const cx = x + 36 + (w - 36) * (i + 0.5) / n, dead = pc.alive === false;
      ctx.globalAlpha = dead ? 0.5 : 1;
      if (pc.kind === 'cap') {
        const R = 0.5 * k, wilt = clamp((pc.age || 0) / 12, 0, 1);
        ctx.fillStyle = mix('#4E8E36', '#8A7A4A', wilt); ctx.beginPath(); ctx.ellipse(cx, floorY - 3, R, R * 0.22, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(20,40,14,.6)'; ctx.lineWidth = 0.8; ctx.stroke();
      } else {
        const L = pc.L || 0, top = floorY - L * k, sw = Math.max(3.5, 0.06 * k), col = dead ? '#8A845C' : '#5FAE44';
        ctx.strokeStyle = dead ? '#8A8466' : '#CFCFA8'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        if (pc.base !== false) for (let j = 0; j < 6; j++) { const a = (j / 5 - 0.5) * 2.4; ctx.beginPath(); ctx.moveTo(cx, floorY - 4); ctx.quadraticCurveTo(cx + Math.sin(a) * 8, floorY + 2, cx + Math.sin(a) * 16, floorY + 5 + Math.cos(a) * 2); ctx.stroke(); }
        if (pc.base !== false) { ctx.fillStyle = dead ? '#9A9470' : '#D8D6AA'; ctx.beginPath(); ctx.ellipse(cx, floorY - 5, sw * 1.5, sw * 1.2, 0, 0, TAU); ctx.fill(); }
        if (L > 0.05) {
          const y1 = pc.base === false ? floorY - 2 : floorY - 6;
          const gr = ctx.createLinearGradient(cx - sw / 2, 0, cx + sw / 2, 0); gr.addColorStop(0, mix(col, '#000000', 0.35)); gr.addColorStop(0.35, mix(col, '#FFFFFF', 0.25)); gr.addColorStop(1, mix(col, '#000000', 0.4));
          ctx.fillStyle = gr; ctx.fillRect(cx - sw / 2, top, sw, y1 - top);
          if (pc.base === false) { ctx.fillStyle = '#243C1A'; ctx.fillRect(cx - sw / 2 - 1, y1 - 1, sw + 2, 3); }
          if (pc.graft != null) { const gy = floorY - pc.graft * k; ctx.fillStyle = '#2E5222'; ctx.fillRect(cx - sw * 0.8, gy - 2, sw * 1.6, 4); }
          if (!pc.cap && !dead && !pc.cut) for (let wv = 0; wv < 3; wv++) { const yy = top + 6 + wv * 10; ctx.strokeStyle = 'rgba(160,220,120,.7)'; ctx.lineWidth = 0.9; for (let j = -3; j <= 3; j++) { if (!j) continue; ctx.beginPath(); ctx.moveTo(cx, yy); ctx.quadraticCurveTo(cx + j * 3, yy - 4, cx + j * 5.5, yy - 9); ctx.stroke(); } }
          if (pc.cut) { ctx.fillStyle = '#243C1A'; ctx.fillRect(cx - sw / 2 - 1, top - 2, sw + 2, 3); }
          if (pc.cap && pc.cap.grow > 0.02) {
            const f = pc.cap.f, R = (0.52 * pc.cap.grow + 0.04) * k;
            ctx.save(); ctx.translate(cx, top);
            const rays = 26;
            for (let j = 0; j < rays; j++) {
              const a = (j + 0.5) / rays * Math.PI, half = Math.PI / rays * (1 - (0.08 + 0.5 * f)), dip = 1 - 0.14 * f;
              ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - half) * R * dip, -R * 0.2 * Math.sin(a - half) * dip); ctx.lineTo(Math.cos(a) * R * (1 + 0.04 * f), -R * 0.2 * Math.sin(a) - R * 0.03 * f); ctx.lineTo(Math.cos(a + half) * R * dip, -R * 0.2 * Math.sin(a + half) * dip); ctx.closePath();
              ctx.fillStyle = mix(dead ? '#8A8458' : '#4E8E36', '#B4E08A', 0.15 + 0.25 * Math.abs(Math.cos(a))); ctx.fill(); ctx.strokeStyle = 'rgba(20,44,14,.55)'; ctx.lineWidth = 0.6; ctx.stroke();
            }
            ctx.restore();
          }
        }
        (pc.nuclei || []).forEach((sp, j) => { const nx = cx + (j - (pc.nuclei.length - 1) / 2) * 14, ny = floorY - 5; ctx.fillStyle = SP_COL[sp] || '#E8B458'; ctx.beginPath(); ctx.arc(nx, ny, 3.4, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(nx, ny, 6.8, 0, TAU); ctx.stroke(); });
      }
      ctx.globalAlpha = 1;
      const last = pc.caps && pc.caps.length ? pc.caps[pc.caps.length - 1] : null;
      const cap = pc.cap || (last ? { f: last.f, grow: 1 } : null), fy = floorY + 14 + faceH / 2;
      if (cap && cap.grow > 0.05) capFace(ctx, cx, fy, faceH * 0.42, cap.f, cap.grow);
      else { ctx.strokeStyle = 'rgba(200,220,230,.25)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, fy, faceH * 0.3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); halo(ctx, 'no cap', cx, fy, '#8FA3C0', { align: 'center', font: mono(9, 600) }); }
      if (pc.name) halo(ctx, pc.name, cx, y + 14, dead ? '#FF8A80' : '#DCE6F6', { align: 'center', font: mono(10, 600) });
      if (pc.sub) halo(ctx, pc.sub, cx, y + 28, '#AFC0D8', { align: 'center', font: mono(9, 500) });
      if (dead) halo(ctx, 'dead', cx, y + 42, '#FF8A80', { align: 'center', font: mono(9.5, 700) });
    });
    ctx.restore();
    return { k, floorY };
  }
  /* the cap from above: about 70 rays, fused at their edges (A. mediterranea) or standing free with a
     notch at each tip (A. crenulata); a graft's cap lies in between */
  function capFace(ctx, cx, cy, R, f, grow) {
    const n = 70, Rg = R * clamp(grow == null ? 1 : grow, 0.05, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, Rg * 1.02, 0, TAU); ctx.fill();
    for (let i = 0; i < n; i++) {
      const am = (i + 0.5) / n * TAU, gap = 0.04 + 0.52 * f, half = TAU / n / 2 * (1 - gap);
      const tip = Rg * (1 + 0.04 * f * Math.sin(i * 2.3)), dip = Rg * (1 - 0.2 * f);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(am - half) * Rg * 0.2, cy + Math.sin(am - half) * Rg * 0.2);
      ctx.lineTo(cx + Math.cos(am - half) * dip, cy + Math.sin(am - half) * dip);
      if (f > 0.5) { ctx.lineTo(cx + Math.cos(am - half * 0.3) * tip, cy + Math.sin(am - half * 0.3) * tip); ctx.lineTo(cx + Math.cos(am) * tip * 0.94, cy + Math.sin(am) * tip * 0.94); ctx.lineTo(cx + Math.cos(am + half * 0.3) * tip, cy + Math.sin(am + half * 0.3) * tip); }
      else ctx.quadraticCurveTo(cx + Math.cos(am) * tip * 1.05, cy + Math.sin(am) * tip * 1.05, cx + Math.cos(am + half) * dip, cy + Math.sin(am + half) * dip);
      ctx.lineTo(cx + Math.cos(am + half) * dip, cy + Math.sin(am + half) * dip);
      ctx.lineTo(cx + Math.cos(am + half) * Rg * 0.2, cy + Math.sin(am + half) * Rg * 0.2); ctx.closePath();
      const gr = ctx.createRadialGradient(cx, cy, Rg * 0.2, cx, cy, Rg);
      gr.addColorStop(0, '#3E7A2C'); gr.addColorStop(1, mix('#78BE56', '#A8D878', 0.35 * (i % 2)));
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(18,44,14,.55)'; ctx.lineWidth = 0.6; ctx.stroke();
      if (f < 0.5) { ctx.strokeStyle = 'rgba(210,240,180,.22)'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * Rg * 0.3, cy + Math.sin(am) * Rg * 0.3); ctx.lineTo(cx + Math.cos(am) * dip * 0.96, cy + Math.sin(am) * dip * 0.96); ctx.stroke(); }
    }
    ctx.fillStyle = '#2A521C'; ctx.beginPath(); ctx.arc(cx, cy, Rg * 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,236,170,.35)'; ctx.beginPath(); ctx.arc(cx, cy, Rg * 0.2, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ============================================================
     THE ELECTRON MICROSCOPE — a thin section of a cell, 10 µm across
     Drawn in µm, greyscale as the stained section scatters electrons:
     membranes dark, lipid pale, starch white. The share of the section
     that is mitochondria is the tissue's measured volume density.
     ============================================================ */
  const TISSUE_ART = {
    flight: { mito: 0.35, fib: true, fibW: 0.8, dense: 1 },
    heart: { mito: 0.25, fib: true, fibW: 1.0, dense: 0.9 },
    leg: { mito: 0.05, fib: true, fibW: 1.1, dense: 0.7 },
    liver: { mito: 0.2, glyco: true, rer: true, nucleus: true, dense: 0.5 },
    fat: { mito: 0.01, lipid: true },
    rbc: { mito: 0, rbc: true },
    pea: { mito: 0.02, wall: true, starch: true, protein: true, dense: 0.3 },
    root: { mito: 0.06, wall: true, nucleus: true, vacuoles: true, dense: 0.35 },
    leaf: { mito: 0.015, wall: true, chloro: 0.3, vacuole: true, vacR: 2.9, dense: 0.35 }
  };
  const temCache = {};
  function temImage(tissue, seed, N) {
    const key = tissue + '|' + seed + '|' + N;
    if (temCache[key]) return temCache[key];
    const T = TISSUE_ART[tissue] || TISSUE_ART.pea, c = canvas(N, N), x = c.getContext('2d'), r = rng(seed * 131 + 17), k = N / 10;
    const U = v => v * k, occ = [];
    const free = (px, py, rad) => occ.every(o => Math.hypot(o[0] - px, o[1] - py) > o[2] + rad);
    x.fillStyle = '#B9B8AE'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < N * N / 40; i++) { x.fillStyle = 'rgba(40,40,36,' + (0.04 + r() * 0.08).toFixed(3) + ')'; x.fillRect(r() * N, r() * N, 1 + r() * 1.5, 1 + r() * 1.5); }
    const mito = (mx, my, len, wid, a, crist) => {
      x.save(); x.translate(U(mx), U(my)); x.rotate(a);
      x.fillStyle = '#6E6C64'; x.beginPath(); x.ellipse(0, 0, U(len / 2), U(wid / 2), 0, 0, TAU); x.fill();
      x.strokeStyle = '#1E1E1A'; x.lineWidth = Math.max(1, U(0.035)); x.stroke();
      x.strokeStyle = 'rgba(30,30,26,.8)'; x.lineWidth = Math.max(0.6, U(0.02)); x.beginPath(); x.ellipse(0, 0, Math.max(0.5, U(len / 2) - U(0.03)), Math.max(0.5, U(wid / 2) - U(0.03)), 0, 0, TAU); x.stroke();
      x.save(); x.beginPath(); x.ellipse(0, 0, Math.max(0.5, U(len / 2) - U(0.04)), Math.max(0.5, U(wid / 2) - U(0.04)), 0, 0, TAU); x.clip();
      const n = Math.max(2, Math.round(len * crist));
      for (let i = 0; i < n; i++) { const cx = -len / 2 + len * (i + 0.5) / n + (r() - 0.5) * 0.05, hgt = U(wid) * (0.55 + r() * 0.35), y0 = -U(wid / 2) + U(0.06 + r() * 0.08); x.fillStyle = 'rgba(214,212,200,.85)'; x.fillRect(U(cx) - U(0.025), y0, U(0.05), hgt); x.strokeStyle = 'rgba(28,28,24,.85)'; x.lineWidth = Math.max(0.5, U(0.012)); x.strokeRect(U(cx) - U(0.025), y0, U(0.05), hgt); }
      x.restore(); x.restore();
    };
    let mitoArea = 0;
    const want = T.mito * 100;
    const addMito = (mx, my, len, wid, a) => { mito(mx, my, len, wid, a, T.dense ? 6 + 10 * T.dense : 5); mitoArea += Math.PI * len * wid / 4; occ.push([mx, my, len / 2]); };
    if (T.rbc) {
      x.fillStyle = '#D8D6CC'; x.fillRect(0, 0, N, N);
      const g = x.createRadialGradient(U(4.5), U(5), U(1), U(4.5), U(5), U(6)); g.addColorStop(0, '#4A4844'); g.addColorStop(1, '#3A3834');
      x.fillStyle = g; x.beginPath(); x.ellipse(U(4.4), U(5), U(4.6), U(3.4), 0.2, 0, TAU); x.fill(); x.strokeStyle = '#141412'; x.lineWidth = U(0.04); x.stroke();
      x.fillStyle = '#44423E'; x.beginPath(); x.ellipse(U(9.8), U(1.2), U(1.8), U(1.2), 0.5, 0, TAU); x.fill();
    }
    if (T.lipid) {
      x.fillStyle = '#E4E2DA'; x.beginPath(); x.ellipse(U(5.6), U(5.2), U(5.4), U(5.6), 0.1, 0, TAU); x.fill(); x.strokeStyle = '#3A3A34'; x.lineWidth = U(0.03); x.stroke();
      occ.push([5.6, 5.2, 5.6]);
      addMito(0.9, 1.2, 1.1, 0.45, 1.2);
    }
    if (T.wall) {
      x.fillStyle = '#D6D4C8'; x.fillRect(0, 0, N, U(0.45)); x.fillRect(0, 0, U(0.45), N);
      x.strokeStyle = '#2A2A26'; x.lineWidth = U(0.03); x.beginPath(); x.moveTo(0, U(0.22)); x.lineTo(N, U(0.22)); x.moveTo(U(0.22), 0); x.lineTo(U(0.22), N); x.stroke();
      x.strokeStyle = '#1A1A18'; x.lineWidth = U(0.025); x.beginPath(); x.moveTo(U(0.45), N); x.lineTo(U(0.45), U(0.45)); x.lineTo(N, U(0.45)); x.stroke();
      for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(80,80,70,.35)'; x.lineWidth = 1; const t = r() * N; x.beginPath(); x.moveTo(t, U(0.05 + r() * 0.35)); x.lineTo(t + U(0.4), U(0.05 + r() * 0.35)); x.stroke(); }
      occ.push([0, 0, 0.6]);
    }
    if (T.vacuole) { const vr = T.vacR || 4.3; x.fillStyle = '#DAD8CE'; x.beginPath(); x.ellipse(U(6.9), U(6.9), U(vr), U(vr * 1.04), 0.3, 0, TAU); x.fill(); x.strokeStyle = '#2A2A26'; x.lineWidth = U(0.025); x.stroke(); occ.push([6.9, 6.9, vr * 1.04]); }
    if (T.nucleus) {
      const nx = T.wall ? 6.2 : 7.2, ny = T.wall ? 5.6 : 6.8, nr = T.wall ? 3.2 : 2.6;
      x.fillStyle = '#9C9A90'; x.beginPath(); x.arc(U(nx), U(ny), U(nr), 0, TAU); x.fill(); x.strokeStyle = '#242420'; x.lineWidth = U(0.05); x.stroke();
      for (let i = 0; i < 16; i++) { const a = r() * TAU; x.fillStyle = 'rgba(40,40,36,.75)'; x.beginPath(); x.ellipse(U(nx + Math.cos(a) * (nr - 0.25)), U(ny + Math.sin(a) * (nr - 0.25)), U(0.35 + r() * 0.3), U(0.12 + r() * 0.1), a + Math.PI / 2, 0, TAU); x.fill(); }
      x.fillStyle = '#34322E'; x.beginPath(); x.arc(U(nx - nr * 0.3), U(ny + nr * 0.1), U(0.7), 0, TAU); x.fill();
      occ.push([nx, ny, nr + 0.1]);
    }
    if (T.vacuoles) for (let i = 0; i < 5; i++) { const vx = 1 + r() * 4, vy = 1 + r() * 8, vr = 0.4 + r() * 0.6; if (!free(vx, vy, vr)) continue; x.fillStyle = '#D6D4CA'; x.beginPath(); x.arc(U(vx), U(vy), U(vr), 0, TAU); x.fill(); x.strokeStyle = '#2A2A26'; x.lineWidth = U(0.02); x.stroke(); occ.push([vx, vy, vr]); }
    if (T.starch) for (let i = 0; i < 40 && occ.length < 12; i++) { const sx = 1 + r() * 9, sy = 1 + r() * 9, sr = 1.2 + r() * 1.3; if (!free(sx, sy, sr)) continue; x.fillStyle = '#ECEAE2'; x.beginPath(); x.ellipse(U(sx), U(sy), U(sr), U(sr * 0.8), r() * 3, 0, TAU); x.fill(); x.strokeStyle = 'rgba(120,118,108,.5)'; x.lineWidth = 1; for (let q = 1; q <= 3; q++) { x.beginPath(); x.ellipse(U(sx), U(sy), U(sr * q / 4), U(sr * 0.8 * q / 4), 0.3, 0, TAU); x.stroke(); } occ.push([sx, sy, sr]); }
    if (T.protein) for (let i = 0; i < 80; i++) { const px_ = 0.8 + r() * 9, py_ = 0.8 + r() * 9, pr = 0.25 + r() * 0.35; if (!free(px_, py_, pr)) continue; x.fillStyle = '#4E4C46'; x.beginPath(); x.arc(U(px_), U(py_), U(pr), 0, TAU); x.fill(); occ.push([px_, py_, pr]); }
    if (T.chloro) { let nC = 0; const spots = [[3.0, 1.6, 0.05], [7.6, 1.5, -0.05], [1.5, 4.6, 1.5], [1.5, 8.6, 1.62], [4.2, 4.1, 0.6]]; for (let i = 0; i < spots.length; i++) {
      const cx = spots[i][0], cy = spots[i][1], L = 4.0, Wd = 1.7, a = spots[i][2];
      if (!free(cx, cy, L / 2 * 0.8)) continue;
      x.save(); x.translate(U(cx), U(cy)); x.rotate(a);
      x.fillStyle = '#8E8C82'; x.beginPath(); x.ellipse(0, 0, U(L / 2), U(Wd / 2), 0, 0, TAU); x.fill(); x.strokeStyle = '#1E1E1A'; x.lineWidth = U(0.03); x.stroke();
      x.save(); x.clip();
      for (let gi = 0; gi < 7; gi++) { const gx = -L / 2 + 0.45 + gi * 0.55 + (r() - 0.5) * 0.1, gy = (r() - 0.5) * 0.5; for (let l = 0; l < 9; l++) { x.fillStyle = '#2A2A26'; x.fillRect(U(gx - 0.2), U(gy - 0.3 + l * 0.07), U(0.4), Math.max(1, U(0.035))); } }
      x.strokeStyle = 'rgba(40,40,36,.8)'; x.lineWidth = Math.max(0.6, U(0.02)); for (let l = 0; l < 4; l++) { x.beginPath(); x.moveTo(-U(L / 2), U(-0.5 + l * 0.33)); x.bezierCurveTo(-U(1), U(-0.3 + l * 0.3), U(1), U(-0.6 + l * 0.35), U(L / 2), U(-0.4 + l * 0.3)); x.stroke(); }
      x.fillStyle = '#F0EEE6'; x.beginPath(); x.ellipse(U(0.6), U(0.1), U(0.55), U(0.32), 0.2, 0, TAU); x.fill();
      x.fillStyle = '#141412'; for (let q = 0; q < 5; q++) { x.beginPath(); x.arc(U((r() - 0.5) * 3), U((r() - 0.5) * 1.1), U(0.06), 0, TAU); x.fill(); }
      x.restore(); x.restore();
      occ.push([cx, cy, L / 2 * 0.85]); nC++;
    } }
    if (T.fib) {
      // myofibrils in rows, sarcomeres 2.2 µm long; the rows of mitochondria between them as wide as the tissue's share needs
      const fw = T.fibW, gap = Math.max(0.12, T.mito * fw / (1 - T.mito) / 0.8), pitch = fw + gap;
      for (let row = 0, y0 = 0.2; y0 < 10.2; row++, y0 += pitch) {
        const off = (row % 3) * 0.3;
        for (let s = -1; s < 6; s++) {
          const x0 = s * 2.2 + off;
          x.fillStyle = '#A8A69C'; x.fillRect(U(x0), U(y0), U(2.2), U(fw));
          x.fillStyle = '#4E4C46'; x.fillRect(U(x0 + 0.3), U(y0), U(1.6), U(fw));
          x.fillStyle = '#6A6860'; x.fillRect(U(x0 + 0.95), U(y0), U(0.3), U(fw));
          x.fillStyle = '#2A2826'; x.fillRect(U(x0 + 1.08), U(y0), Math.max(1, U(0.04)), U(fw));
          x.fillStyle = '#141412'; x.fillRect(U(x0) - Math.max(1, U(0.04)) / 2, U(y0), Math.max(1.2, U(0.06)), U(fw));
          for (let l = 0; l < 6; l++) { x.fillStyle = 'rgba(20,20,18,.25)'; x.fillRect(U(x0 + 0.3), U(y0 + fw * (l + 0.5) / 6), U(1.6), 1); }
        }
        const gy = y0 + fw + gap / 2;
        if (gap > 0.25) for (let xx = -0.5; xx < 10.5;) { const len = 1.2 + r() * 1.4; if (r() < 0.92) addMito(xx + len / 2, gy, len, Math.min(gap * 0.92, 0.95), (r() - 0.5) * 0.08); xx += len + 0.08; }
        else for (let s = -1; s < 6; s++) if (r() < 0.7) addMito(s * 2.2 + off + 0.15, gy, 0.55, Math.max(0.2, gap * 1.1), 0.05);
      }
    }
    if (T.glyco) for (let i = 0; i < 1400; i++) { const gx = r() * 10, gy = r() * 10; if (!free(gx, gy, 0.02)) continue; x.fillStyle = '#1A1A18'; for (let q = 0; q < 4; q++) { x.beginPath(); x.arc(U(gx + (r() - 0.5) * 0.08), U(gy + (r() - 0.5) * 0.08), Math.max(0.6, U(0.022)), 0, TAU); x.fill(); } }
    if (T.rer) for (let i = 0; i < 6; i++) { const rx = r() * 6, ry = 0.5 + r() * 9, rl = 2 + r() * 2; x.strokeStyle = '#2A2A26'; x.lineWidth = Math.max(0.7, U(0.03)); for (let l = 0; l < 3; l++) { x.beginPath(); x.moveTo(U(rx), U(ry + l * 0.14)); x.quadraticCurveTo(U(rx + rl / 2), U(ry + l * 0.14 - 0.3), U(rx + rl), U(ry + l * 0.14)); x.stroke(); } }
    if (!T.fib && !T.lipid && !T.rbc) for (let i = 0; i < 3000 && mitoArea < want; i++) {
      const len = T.glyco ? 0.9 + r() * 0.6 : 1 + r() * 1.4, wid = T.glyco ? 0.7 + r() * 0.2 : 0.45 + r() * 0.2, mx = 0.8 + r() * 8.6, my = 0.8 + r() * 8.6;
      if (!free(mx, my, len / 2)) continue;
      addMito(mx, my, len, wid, r() * TAU);
    }
    const out = { c, mito: mitoArea / 100 };
    temCache[key] = out;
    return out;
  }
  function tem(ctx, cx, cy, R, tissue, seed) {
    const N = clamp(Math.round(2 * R * 1.2), 200, 720), im = temImage(tissue, seed || 1, N);
    ctx.save();
    ctx.fillStyle = '#020306'; ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.drawImage(im.c, cx - R, cy - R, 2 * R, 2 * R);
    const vg = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, TAU); ctx.stroke();
    const s = 2 * R / 10, bx = cx - s / 2, by = cy + R + 13;
    ctx.strokeStyle = '#EAF1FF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + s, by); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.moveTo(bx + s, by - 4); ctx.lineTo(bx + s, by + 4); ctx.stroke();
    ctx.fillStyle = '#EAF1FF'; ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('1 µm', cx, by + 6);
    ctx.restore();
    return { mito: im.mito, pxPerUm: 2 * R / 10 };
  }

  /* ============================================================
     THE LEAF — a variegated leaf through the starch test
     st: { stage 'fresh' | 'boiled' | 'ethanol' | 'iodine', foil (a strip covered it in the light),
           blue: { lit, foil } 0…1, how blue-black iodine turns the green part lit and covered }
     The white margin never has chloroplasts, so it only ever takes iodine's own brown.
     ============================================================ */
  let leafG = null;
  function leafGeom() {
    if (leafG) return leafG;
    const out = [], green = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, rr = 1 + 0.03 * Math.sin(a * 26) * Math.abs(Math.sin(a)); out.push([Math.sin(a) * 0.62 * rr * (1 - 0.25 * Math.cos(a)), -Math.cos(a) * rr]); }
    for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, rr = 0.7 + 0.08 * Math.sin(a * 5 + 1) + 0.05 * Math.sin(a * 11); green.push([Math.sin(a) * 0.62 * rr * (1 - 0.25 * Math.cos(a)), -Math.cos(a) * rr * 0.96 + 0.03]); }
    leafG = { out, green };
    return leafG;
  }
  const LEAF_COL = {
    fresh: { g: '#4E9A3A', w: '#EDEBD8', v: 'rgba(200,236,170,.4)' }, boiled: { g: '#6E8A3A', w: '#DCD8BC', v: 'rgba(210,220,160,.35)' },
    ethanol: { g: '#E8E0BE', w: '#F2EEDC', v: 'rgba(160,150,110,.3)' }, iodine: { g: '#C8923A', w: '#C8923A', v: 'rgba(110,70,20,.35)' }
  };
  function leafDraw(ctx, cx, cy, S, st, stage) {
    const G = leafGeom(), path = pts => { ctx.beginPath(); pts.forEach(([u, v], i) => i ? ctx.lineTo(cx + u * S, cy + v * S) : ctx.moveTo(cx + u * S, cy + v * S)); ctx.closePath(); };
    const B = st.blue || {}, band = st.foil ? [-0.1, 0.22] : null, col = LEAF_COL[stage];
    const blue = v => mix('#C8923A', '#16183A', clamp(v, 0, 1));
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.translate(3, 4); path(G.out); ctx.fill(); ctx.translate(-3, -4);
    path(G.out); ctx.fillStyle = col.w; ctx.fill();
    ctx.save(); path(G.out); ctx.clip();
    path(G.green); ctx.fillStyle = stage === 'iodine' ? blue(B.lit) : col.g; ctx.fill();
    if (band && stage === 'iodine') { ctx.save(); path(G.green); ctx.clip(); ctx.fillStyle = blue(B.foil); ctx.fillRect(cx - S, cy + band[0] * S, 2 * S, (band[1] - band[0]) * S); ctx.restore(); }
    ctx.strokeStyle = col.v; ctx.lineWidth = Math.max(1, S * 0.02); ctx.beginPath(); ctx.moveTo(cx, cy + S); ctx.lineTo(cx, cy - S * 0.92);
    for (let i = 1; i < 7; i++) { const yy = cy + S * (0.75 - i * 0.24); ctx.moveTo(cx, yy); ctx.quadraticCurveTo(cx - S * 0.2, yy - S * 0.05, cx - S * 0.5, yy - S * 0.22); ctx.moveTo(cx, yy); ctx.quadraticCurveTo(cx + S * 0.2, yy - S * 0.05, cx + S * 0.5, yy - S * 0.22); }
    ctx.stroke();
    if (band && stage === 'fresh') { ctx.fillStyle = 'rgba(214,220,228,.97)'; ctx.fillRect(cx - S, cy + band[0] * S, 2 * S, (band[1] - band[0]) * S); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(cx - S + i * S * 0.25, cy + band[0] * S); ctx.lineTo(cx - S + i * S * 0.25 + S * 0.1, cy + band[1] * S); ctx.stroke(); } }
    else if (band) { ctx.setLineDash([4, 3]); ctx.strokeStyle = stage === 'iodine' ? 'rgba(255,255,255,.6)' : 'rgba(80,80,80,.45)'; ctx.lineWidth = 1; ctx.strokeRect(cx - S * 0.9, cy + band[0] * S, 1.8 * S, (band[1] - band[0]) * S); ctx.setLineDash([]); }
    ctx.restore();
    path(G.out); ctx.strokeStyle = 'rgba(30,40,20,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = stage === 'iodine' ? '#8A6224' : stage === 'ethanol' ? '#D8CCA0' : '#4E7A36'; ctx.lineWidth = Math.max(2, S * 0.05); ctx.beginPath(); ctx.moveTo(cx, cy + S * 0.98); ctx.lineTo(cx + S * 0.05, cy + S * 1.3); ctx.stroke();
    ctx.restore();
  }
  function leafPanel(ctx, x, y, w, h, st) {
    ctx.save(); rrect(ctx, x, y, w, h, 10); ctx.fillStyle = '#EDEFEA'; ctx.fill(); ctx.clip();
    const stages = ['fresh', 'boiled', 'ethanol', 'iodine'], names = ['after the light', 'boiled 1 min', 'hot ethanol', 'iodine'];
    const th = Math.min(96, h * 0.24), tw = w / 4;
    stages.forEach((s, i) => {
      const cx = x + tw * (i + 0.5), cy = y + 16 + th * 0.46, on = s === st.stage;
      if (on) { ctx.fillStyle = 'rgba(112,56,128,.14)'; rrect(ctx, x + tw * i + 4, y + 4, tw - 8, th + 22, 8); ctx.fill(); }
      leafDraw(ctx, cx, cy, th * 0.38, st, s);
      ctx.fillStyle = on ? '#4A2356' : '#50586A'; ctx.font = mono(9.5, on ? 700 : 500); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(names[i], cx, y + th + 10);
      if (i < 3) { ctx.fillStyle = '#8A92A0'; ctx.font = mono(12, 700); ctx.textBaseline = 'middle'; ctx.fillText('→', x + tw * (i + 1), cy); }
    });
    const big = Math.min((h - th - 60) / 2.45, w * 0.3);
    leafDraw(ctx, x + w * 0.5, y + th + 40 + big * 1.08, big, st, st.stage);
    ctx.restore();
  }

  /* ============================================================
     OXYGEN ACROSS A CELL
     st: { shape 'sphere' | 'flat' | 'thread', R µm (sphere radius), a µm (half-thickness of a sheet or
           radius of a thread), len µm (their length across), c(u) → 0…1 oxygen a fraction u of the way from
           the surface (0) to the middle (1), core 0…1 (the starving share of the half-width), span µm }
     ============================================================ */
  const O2PAL = [[0, '#140A26'], [0.02, '#3A0F4A'], [0.2, '#7A1F6A'], [0.45, '#C8425A'], [0.7, '#F08A3A'], [1, '#FCE8A0']];
  function o2col(v) { v = clamp(v, 0, 1); for (let i = 1; i < O2PAL.length; i++) if (v <= O2PAL[i][0]) { const a = O2PAL[i - 1], b = O2PAL[i]; return mix(a[1], b[1], (v - a[0]) / (b[0] - a[0])); } return O2PAL[O2PAL.length - 1][1]; }
  function o2Cell(ctx, cx, cy, R, st) {
    ctx.save();
    ctx.fillStyle = '#020306'; ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const wg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); wg.addColorStop(0, o2col(1)); wg.addColorStop(1, mix(o2col(1), '#C8B070', 0.3));
    ctx.fillStyle = wg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const s = 2 * R * 0.84 / st.span, shape = st.shape, n = 56;
    const half = (shape === 'sphere' ? st.R : st.a) * s, len = (st.len || 0) * s;
    const body = () => { if (shape === 'sphere') { ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.6, half), 0, TAU); } else rrect(ctx, cx - len / 2, cy - half, len, 2 * half, half); };
    ctx.save(); body(); ctx.clip();
    for (let i = 0; i < n; i++) {
      const u = i / n, hh = half * (1 - u); ctx.fillStyle = o2col(st.c(u));
      if (shape === 'sphere') { ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.4, hh), 0, TAU); ctx.fill(); }
      else rrect(ctx, cx - len / 2 + half * u, cy - hh, len - 2 * half * u, 2 * hh, hh), ctx.fill();
    }
    if (st.core > 0.001) {
      const ch = half * st.core;
      ctx.save();
      if (shape === 'sphere') { ctx.beginPath(); ctx.arc(cx, cy, ch, 0, TAU); } else { ctx.beginPath(); rrect(ctx, cx - len / 2 + half - ch, cy - ch, len - 2 * (half - ch), 2 * ch, ch); }
      ctx.clip(); ctx.strokeStyle = 'rgba(255,130,130,.4)'; ctx.lineWidth = 1;
      for (let i = -2 * R; i < 2 * R; i += 7) { ctx.beginPath(); ctx.moveTo(cx + i, cy - R); ctx.lineTo(cx + i + 2 * R, cy + R); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; body(); ctx.stroke();
    if (st.core > 0.001 && half * st.core > 26) halo(ctx, 'no oxygen reaches here', cx, cy, '#FFC0C0', { align: 'center', font: mono(10, 700) });
    const vg = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (st.label) { ctx.font = mono(10, 700); const chord = 2 * R * Math.sqrt(1 - 0.72 * 0.72) - 16, t = ctx.measureText(st.label).width > chord ? (st.label.split(' ').slice(-2).join(' ')) : st.label; halo(ctx, t, cx, cy - R * 0.72, '#2A1238', { align: 'center', font: mono(10, 700), halo: 'rgba(255,248,220,.9)' }); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, TAU); ctx.stroke();
    const steps = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000], want = st.span * 0.25, bar = steps.reduce((u, v) => Math.abs(v - want) < Math.abs(u - want) ? v : u, 1), Lp = bar * s, by = cy + R + 13;
    ctx.strokeStyle = '#EAF1FF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - Lp / 2, by); ctx.lineTo(cx + Lp / 2, by); ctx.moveTo(cx - Lp / 2, by - 4); ctx.lineTo(cx - Lp / 2, by + 4); ctx.moveTo(cx + Lp / 2, by - 4); ctx.lineTo(cx + Lp / 2, by + 4); ctx.stroke();
    ctx.fillStyle = '#EAF1FF'; ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(bar >= 1000 ? bar / 1000 + ' mm' : bar + ' µm', cx, by + 6);
    ctx.restore();
    return { s };
  }

  /* ============================================================
     MICRO PAINTERS — cells under the microscope, drawn as the light they let through
     ============================================================ */
  if (window.MICRO && MICRO.PAINT) {
    const P_ = MICRO.PAINT;
    const eA = (P, b) => clamp(b * (0.3 + 1.0 * P.pc), 0, 0.95);
    /* red onion epidermis. Each cell: v (corners), cx, cy, w, h (µm), vol (the protoplast's volume, 1 = it
       fills its wall), sap 0…1 (how much of the red is still inside), off −1…1 (the side a shrinking protoplast
       keeps to), coag (specks, when boiled); or free: a round protoplast at x, y, r, burst. */
    P_.redOnion = (c, it, P) => {
      const k = P.k;
      it.cells.forEach(cl => {
        if (cl.free) {
          const x = P.X(cl.x), y = P.Y(cl.y), r = cl.r * k;
          if (r < 0.4) return;
          if (cl.burst) { const g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2.2); g.addColorStop(0, 'rgba(200,120,170,.16)'); g.addColorStop(1, 'rgba(200,120,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(140,90,120,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = Math.max(0.5, 0.8 * k); c.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU + (cl.a || 0), rr = r * (0.8 + 0.12 * Math.sin(a * 5 + (cl.a || 0) * 3) + 0.06 * Math.sin(a * 11)); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.stroke(); return; }
          const a = clamp(0.42 * cl.sap / Math.max(0.3, (cl.vol - 0.15) / 0.85), 0.1, 0.82);
          const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
          g.addColorStop(0, 'rgba(214,104,166,' + (a * 0.7).toFixed(3) + ')'); g.addColorStop(1, 'rgba(172,40,118,' + a.toFixed(3) + ')');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(110,30,80,' + eA(P, 0.7).toFixed(3) + ')'; c.lineWidth = Math.max(0.4, 0.5 * k); c.stroke();
          return;
        }
        const v = cl.v;
        c.strokeStyle = 'rgba(92,84,90,' + eA(P, 0.62).toFixed(3) + ')'; c.lineWidth = Math.max(0.5, 1.7 * k); c.lineJoin = 'round';
        c.beginPath(); c.moveTo(P.X(v[0][0]), P.Y(v[0][1])); for (let i = 1; i < v.length; i++) c.lineTo(P.X(v[i][0]), P.Y(v[i][1])); c.closePath(); c.stroke();
        const vol = clamp(cl.vol, 0.12, 1.2), shrink = Math.min(1, vol);
        const sx = Math.pow(shrink, 0.72), sy = Math.pow(shrink, 0.28);
        const W = Math.max(0.5, (cl.w - 3.2) * sx * k), H = Math.max(0.5, (cl.h - 3.2) * sy * k);
        const ox = (cl.off || 0) * (1 - sx) * (cl.w - 3.2) / 2;
        const x = P.X(cl.cx + ox), y = P.Y(cl.cy), rad = Math.min(W, H) / 2 * (shrink < 0.995 ? clamp((1 - shrink) * 6, 0.12, 0.95) : 0.08);
        const a = clamp((0.5 + 0.14 * (cl.tone || 0)) * cl.sap / Math.max(0.3, (vol - 0.15) / 0.85), 0.03, 0.9);
        if (shrink < 0.97 && k > 0.5) {
          c.strokeStyle = 'rgba(130,60,100,' + eA(P, 0.35).toFixed(3) + ')'; c.lineWidth = Math.max(0.3, 0.3 * k); c.beginPath();
          for (let i = 0; i < 4; i++) { const sxn = i < 2 ? -1 : 1, syn = i % 2 ? -1 : 1, px = x + sxn * W / 2 * 0.9, py = y + syn * H / 2 * 0.6, wx = P.X(cl.cx + sxn * (cl.w / 2 - 1.5) * 0.92), wy = P.Y(cl.cy + syn * (cl.h / 2 - 1.5) * 0.7); c.moveTo(px, py); c.lineTo(wx, wy); }
          c.stroke();
        }
        c.beginPath(); if (c.roundRect) c.roundRect(x - W / 2, y - H / 2, W, H, rad); else c.rect(x - W / 2, y - H / 2, W, H);
        c.fillStyle = 'rgba(' + (150 + (cl.tone || 0) * 30).toFixed(0) + ',32,' + (112 + (cl.tone || 0) * 20).toFixed(0) + ',' + a.toFixed(3) + ')'; c.fill();
        if (shrink < 0.995) { c.strokeStyle = 'rgba(110,26,76,' + clamp(a + 0.15, 0, 0.95).toFixed(3) + ')'; c.lineWidth = Math.max(0.35, 0.55 * k); c.stroke(); }
        if (cl.coag) { c.fillStyle = 'rgba(90,86,80,' + eA(P, 0.3).toFixed(3) + ')'; cl.coag.forEach(q => { c.beginPath(); c.arc(P.X(cl.cx + q[0]), P.Y(cl.cy + q[1]), Math.max(0.4, q[2] * k), 0, TAU); c.fill(); }); }
      });
    };
    /* red blood cells in a wet mount, unstained: pale orange-red. b: {x, y, V fL, V0, lysed, a} */
    P_.rbcWet = (c, it, P) => {
      const k = P.k;
      it.cells.forEach(b => {
        const x = P.X(b.x), y = P.Y(b.y);
        if (b.lysed) { const r = 3.45 * k; if (r < 0.5) return; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = 'rgba(236,206,196,.14)'; c.fill(); c.strokeStyle = 'rgba(176,120,110,' + (0.22 + 0.25 * P.pc).toFixed(3) + ')'; c.lineWidth = Math.max(0.4, 0.32 * k); c.stroke(); return; }
        const rel = b.V / b.V0, sph = clamp((rel - 1) / 0.62, 0, 1);
        const D = rel < 1 ? 7.8 * Math.pow(rel, 0.45) : 7.8 - (7.8 - 6.6) * sph, r = D / 2 * k;
        if (r < 0.5) { c.fillStyle = 'rgba(214,130,100,.55)'; c.fillRect(x - 0.5, y - 0.5, 1, 1); return; }
        if (rel < 0.85) {
          const n = 16, sp = clamp((0.85 - rel) / 0.3, 0.3, 1); c.beginPath();
          for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU + (b.a || 0), rr = r * (i % 2 ? 1 + 0.16 * sp : 0.9); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
          c.closePath(); c.fillStyle = 'rgba(200,104,78,.6)'; c.fill(); c.strokeStyle = 'rgba(130,52,40,.7)'; c.lineWidth = Math.max(0.3, 0.3 * k); c.stroke(); return;
        }
        c.fillStyle = 'rgba(' + Math.round(222 - 14 * sph) + ',' + Math.round(128 - 26 * sph) + ',' + Math.round(96 - 16 * sph) + ',' + (0.5 + 0.12 * sph).toFixed(3) + ')';
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        if (sph < 0.9) { c.fillStyle = 'rgba(255,248,236,' + (0.5 * (1 - sph)).toFixed(3) + ')'; c.beginPath(); c.arc(x, y, r * 0.45 * (1 - sph * 0.6), 0, TAU); c.fill(); }
        c.strokeStyle = 'rgba(146,58,42,' + (0.45 + 0.2 * sph).toFixed(3) + ')'; c.lineWidth = Math.max(0.3, 0.35 * k); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      });
    };
    /* Cladophora: a filament of long cells, each with a net-like chloroplast pressed against its wall */
    P_.cladophora = (c, it, P) => {
      const k = P.k, W = it.w;
      it.cells.forEach(cl => {
        const x0 = P.X(cl.x0), x1 = P.X(cl.x1), yT = P.Y(it.y + W / 2), yB = P.Y(it.y - W / 2), y0 = Math.min(yT, yB), h = Math.abs(yB - yT), xl = Math.min(x0, x1), wl = Math.abs(x1 - x0);
        c.fillStyle = 'rgba(210,236,196,.25)'; c.fillRect(xl, y0, wl, h);
        c.strokeStyle = 'rgba(70,96,60,' + eA(P, 0.6).toFixed(3) + ')'; c.lineWidth = Math.max(0.5, 1.4 * k); c.strokeRect(xl, y0, wl, h);
        c.fillStyle = 'rgba(66,146,54,.62)';
        cl.net.forEach(q => { c.beginPath(); c.ellipse(P.X(q[0]), P.Y(q[1]), Math.max(0.4, q[2] * k), Math.max(0.4, q[3] * k), q[4], 0, TAU); c.fill(); });
        c.fillStyle = 'rgba(40,80,30,.7)'; cl.pyr.forEach(q => { c.beginPath(); c.arc(P.X(q[0]), P.Y(q[1]), Math.max(0.4, 1.4 * k), 0, TAU); c.fill(); });
      });
    };
    /* Spirogyra: cylindrical cells with a spiral ribbon of chloroplast; the turns on the far side are out of focus */
    P_.spirogyra = (c, it, P) => {
      const k = P.k, W = it.w, R = W / 2;
      it.cells.forEach(cl => {
        const x0 = P.X(cl.x0), x1 = P.X(cl.x1), yT = P.Y(it.y + R), yB = P.Y(it.y - R), y0 = Math.min(yT, yB), h = Math.abs(yB - yT), xl = Math.min(x0, x1), wl = Math.abs(x1 - x0);
        c.fillStyle = 'rgba(220,240,210,.2)'; c.fillRect(xl, y0, wl, h);
        c.strokeStyle = 'rgba(70,96,60,' + eA(P, 0.6).toFixed(3) + ')'; c.lineWidth = Math.max(0.5, 1.2 * k); c.strokeRect(xl, y0, wl, h);
        const L = cl.x1 - cl.x0, bw = 5.5;
        for (const front of [false, true]) {
          c.strokeStyle = front ? 'rgba(52,140,48,.82)' : 'rgba(80,160,70,.3)'; c.lineWidth = Math.max(0.8, bw * k * (front ? 1 : 1.4)); c.lineCap = 'round';
          c.beginPath(); let pen = false;
          for (let i = 0; i <= 160; i++) {
            const u = i / 160, th = u * cl.turns * TAU + cl.ph, fr = Math.cos(th) > 0;
            const xx = cl.x0 + 3 + u * (L - 6), yy = it.y + Math.sin(th) * (R - 3.5);
            if (fr === front) { pen ? c.lineTo(P.X(xx), P.Y(yy)) : c.moveTo(P.X(xx), P.Y(yy)); pen = true; } else pen = false;
          }
          c.stroke();
        }
        c.fillStyle = 'rgba(30,70,24,.75)'; cl.pyr.forEach(q => { c.beginPath(); c.arc(P.X(q[0]), P.Y(q[1]), Math.max(0.4, 1.6 * k), 0, TAU); c.fill(); });
        c.fillStyle = 'rgba(150,150,130,' + eA(P, 0.35).toFixed(3) + ')'; c.beginPath(); c.ellipse(P.X((cl.x0 + cl.x1) / 2), P.Y(it.y), 5 * k, 4 * k, 0, 0, TAU); c.fill();
      });
    };
    /* aerotactic bacteria: little rods */
    P_.aeroBact = (c, it, P) => {
      const k = P.k; c.fillStyle = 'rgba(30,30,28,.9)';
      it.b.forEach(b => { const x = P.X(b.x), y = P.Y(b.y); if (k < 0.8) { c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8); return; } c.save(); c.translate(x, y); c.rotate(b.a); c.beginPath(); if (c.roundRect) c.roundRect(-1.1 * k, -0.4 * k, 2.2 * k, 0.8 * k, 0.4 * k); else c.rect(-1.1 * k, -0.4 * k, 2.2 * k, 0.8 * k); c.fill(); c.restore(); });
    };
    /* the light falling on the slide: a spectrum spread across the field, one colour, or a small spot.
       It is multiplied into the image like everything else, so it tints what it lights. */
    let spotC = null;
    const spotCanvas = N => { if (!spotC) spotC = canvas(N, N); if (spotC.width !== N) { spotC.width = N; spotC.height = N; } return spotC; };
    P_.lightMask = (c, it, P) => {
      const N = P.N;
      c.globalCompositeOperation = 'multiply';          // it tints whatever shares its layer: the bacteria too
      if (it.mode === 'spectrum') {
        for (let i = 0; i < N; i++) { const xs = P.x0 + (P.inv ? (N - i) : i) / N * (P.x1 - P.x0); c.fillStyle = mix(it.colAt(it.nmAt(xs)), '#FFFFFF', 0.42); c.fillRect(i, 0, 1.5, N); }
      } else if (it.mode === 'green') { c.fillStyle = '#86D486'; c.fillRect(0, 0, N, N); }
      else if (it.mode === 'spot') {
        // a dim slide with one bright spot: built apart, then laid over the image
        const m = spotCanvas(N), x = m.getContext('2d');
        x.globalCompositeOperation = 'source-over'; x.fillStyle = '#6E727C'; x.fillRect(0, 0, N, N);
        const X = P.X(it.sx), Y = P.Y(it.sy), rr = it.sr * P.k, g = x.createRadialGradient(X, Y, 0, X, Y, rr);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.75, '#F6F6F2'); g.addColorStop(1, 'rgba(110,114,124,0)');
        x.fillStyle = g; x.beginPath(); x.arc(X, Y, rr, 0, TAU); x.fill();
        c.drawImage(m, 0, 0);
      }
    };
  }

  window.CELL = {
    capsule, viskingBag, glassRod, testTube, tubeRack, smallBottle, acetabularia, capFace, tank, scalpel, respirometer, elodeaRig, deskLamp,
    agarCube, tile, dish, redOnion, memSim, memStep, memDraw, MOL, MW, acetabView, SP_COL, tem, TISSUE_ART, leafPanel, leafDraw, o2Cell, o2col, halo, rrect
  };
})();
