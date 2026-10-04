/* ============================================================
   ART-G7A — the figure library of Grade 7 Unit A, Atoms and the Structure of Matter.
   Molecules painted atom by atom (CPK colours, lit spheres, van der Waals sizes), the
   glassware of a chemistry bench (gas jars, a Hofmann voltameter, a powder tray), the
   instrument faces (a vacuum gauge, a bench power supply) and the magnified views the
   unit's labs look through (a liquid and a gas at the scale of their molecules, a
   microscope field with Perrin's tracks, an electrode, a monolayer).
   Everything is drawn through render.js (RX) / render3d.js (R3) so it is lit and
   volumetric; plate furniture (circle frames, side labels, cards) is G6B's.
   Nothing here computes science: each figure draws what a lab worked out.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => RX.mix(a, b, clamp(t, 0, 1));
  const rgba = (c, a) => RX.rgba(c, a);
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const { add, sub, scale, norm, cross } = R3;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ============================================================
     ATOMS — CPK colours (Corey–Pauling–Koltun, tuned to read on a dark ground) and
     van der Waals radii in pm (Bondi 1964; metals from Alvarez 2013).
     ============================================================ */
  const CPK = { H: '#F2F4F8', C: '#5E6672', N: '#3D6FE0', O: '#E8483C', F: '#7FE07A', Cl: '#3FD15A', Br: '#A8322E', I: '#8A3FB0', S: '#F0D33A', P: '#F28C28',
    Na: '#AB5CF2', K: '#8F40D4', Li: '#CC80FF', Mg: '#8AFF00', Ca: '#3DFF00', Fe: '#E06633', Cu: '#C88033', Zn: '#7D80B0', Mn: '#9C7AC7', Au: '#FFD123', Ag: '#C0C0C0', Si: '#F0C8A0', He: '#D9FFFF', Ne: '#B3E3F5', Ar: '#80D1E3', Al: '#BFA6A6', B: '#FFB5B5', Be: '#C2FF00', Pb: '#575961', Hg: '#B8B8D0' };
  const VDW = { H: 120, C: 170, N: 155, O: 152, F: 147, Cl: 175, Br: 185, I: 198, S: 180, P: 180, Na: 227, K: 275, Li: 182, Mg: 173, Ca: 231, Fe: 194, Cu: 140, Zn: 139, Mn: 197, Au: 166, Ag: 172, Si: 210, He: 140, Ne: 154, Ar: 188, Al: 184, B: 192, Be: 153, Pb: 202, Hg: 155 };
  const col = el => CPK[el] || '#C9A0DC';
  /* one lit atom, r px */
  function atom2(ctx, x, y, r, el, o) {
    o = o || {};
    if (r < 0.6) return;
    RX.ball(ctx, x, y, r, o.colour || col(el), { rim: 0.55, sub: 0.3, shadow: false, vivid: o.vivid });
    if (o.label && r > 6) { ctx.save(); ctx.font = mono(Math.min(12, r * 0.8), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = el === 'H' || el === 'S' || el === 'He' ? '#1A2030' : '#F4F7FF'; ctx.fillText(el, x, y + 0.5); ctx.restore(); }
  }
  /* a small molecule painted as overlapping spheres, back to front. atoms: [[el, dx, dy, dz]] in pm,
     s px per pm, a = rotation in the picture plane, tilt about the screen x-axis */
  function molecule2(ctx, x, y, atoms, s, a, o) {
    o = o || {};
    const ca = Math.cos(a || 0), sa = Math.sin(a || 0), ct = Math.cos(o.tilt || 0), st = Math.sin(o.tilt || 0);
    const P = atoms.map(([el, dx, dy, dz]) => { const yy = dy * ct - (dz || 0) * st, zz = dy * st + (dz || 0) * ct; return { el, x: x + (dx * ca - yy * sa) * s, y: y + (dx * sa + yy * ca) * s, z: zz }; });
    P.sort((u, v) => u.z - v.z);
    const k = o.k || 0.78;
    P.forEach(q => atom2(ctx, q.x, q.y, VDW[q.el] * s * (q.el === 'H' && o.kH ? o.kH : k), q.el, { colour: o.tint ? mix(col(q.el), o.tint, 0.35) : null, label: o.label }));
  }
  /* geometry, pm — bond lengths and angles from the gas-phase structures */
  const MOL = {
    H2O: [['O', 0, 0, 0], ['H', 76, 59, 0], ['H', -76, 59, 0]],                        // 95.8 pm, 104.5°
    H2: [['H', -37, 0, 0], ['H', 37, 0, 0]],
    O2: [['O', -60, 0, 0], ['O', 60, 0, 0]],
    N2: [['N', -55, 0, 0], ['N', 55, 0, 0]],
    Br2: [['Br', -114, 0, 0], ['Br', 114, 0, 0]],
    MnO4: [['Mn', 0, 0, 0], ['O', 0, -158, 0], ['O', 149, 53, 0], ['O', -75, 53, 129], ['O', -75, 53, -129]],
    EtOH: [['C', -77, 0, 0], ['C', 77, 0, 0], ['O', 130, 125, 0], ['H', 210, 120, 0], ['H', -115, -50, 90], ['H', -115, -50, -90], ['H', -115, 100, 0], ['H', 115, -50, 90], ['H', 115, -50, -90]]
  };

  /* ============================================================
     GLASSWARE
     ============================================================ */
  /* a vertical glass cylinder from z0 to z1 with coloured contents: bands [{z0, z1, col, a}] (alpha a);
     o.graduate {z0, perMm, every, label(v)}; o.cap 'tap' | 'plate' | null; o.flange (ground-glass rims) */
  function glassColumn(F, base, r, z0, z1, bands, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, M = window.MEAS, cx = base[0], cy = base[1];
    (bands || []).forEach(b => {
      if (!(b.z1 > b.z0 + 1e-5)) return;
      F.push([cx, cy, (b.z0 + b.z1) / 2], () => {
        const B = M.ringPts(cam, [cx, cy, b.z0], r * 0.93, 36), T = M.ringPts(cam, [cx, cy, b.z1], r * 0.93, 36);
        if (!B || !T) return;
        const Hh = M.hull2(B.concat(T));
        ctx.save(); ctx.fillStyle = rgba(b.col, b.a == null ? 0.5 : b.a); M.path(ctx, Hh); ctx.fill();
        if (b.surface) { ctx.fillStyle = rgba(mix(b.col, '#FFFFFF', 0.4), 0.55); M.path(ctx, T); ctx.fill(); ctx.strokeStyle = 'rgba(240,250,255,.85)'; ctx.lineWidth = 1.2; M.path(ctx, T); ctx.stroke(); }
        ctx.restore();
      }, -0.02 - (b.order || 0) * 0.001);
    });
    F.push([cx, cy, (z0 + z1) / 2], () => {
      const B = M.ringPts(cam, [cx, cy, z0], r, 40), T = M.ringPts(cam, [cx, cy, z1], r, 40);
      if (!B || !T) return;
      const Hh = M.hull2(B.concat(T));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
      Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); });
      ctx.save(); M.path(ctx, Hh); ctx.fillStyle = 'rgba(200,228,245,.07)'; ctx.fill(); ctx.clip();
      const gr = ctx.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.08, 'rgba(255,255,255,.32)'); gr.addColorStop(0.14, 'rgba(255,255,255,.04)');
      gr.addColorStop(0.82, 'rgba(255,255,255,.02)'); gr.addColorStop(0.9, 'rgba(255,255,255,.18)'); gr.addColorStop(0.97, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, 4000);
      ctx.restore();
      ctx.strokeStyle = 'rgba(215,238,255,.55)'; ctx.lineWidth = 1; M.path(ctx, Hh); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); T.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      const G = o.graduate;
      if (G) {
        const e = cam.eye, ang = Math.atan2(e[1] - cy, e[0] - cx) + 0.55, nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny, ty = nx;
        ctx.font = mono(G.size || 8, 600); ctx.textBaseline = 'middle';
        for (let v = G.from || 0; ; v += G.every) {
          const z = G.z0 + v * G.perUnit; if (z > z1 - 0.003 || z < z0 + 0.003 || v > 1e4) break;
          const big = Math.round(v / G.every) % (G.labelEvery || 5) === 0;
          const p0 = [cx + nx * r, cy + ny * r, z], p1 = [p0[0] + tx * r * (big ? 0.6 : 0.35), p0[1] + ty * r * (big ? 0.6 : 0.35), z];
          const a = cam.project(p0), bq = cam.project(p1); if (!a.ok || !bq.ok) continue;
          ctx.strokeStyle = 'rgba(250,252,255,.85)'; ctx.lineWidth = big ? 1.1 : 0.7; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bq.x, bq.y); ctx.stroke();
          if (big) { ctx.fillStyle = 'rgba(250,252,255,.9)'; ctx.textAlign = bq.x < a.x ? 'right' : 'left'; ctx.fillText(G.label ? G.label(v) : String(v), bq.x + (bq.x < a.x ? -2 : 2), bq.y); }
        }
      }
    }, -0.04);
    if (o.flange) [z0, z1].forEach(z => R3.cylinder(F, [cx, cy, z - 0.003], [cx, cy, z + 0.003], r + 0.006, '#D9E8F2', { segments: 30, inner: r - 0.001, shadow: false, ambient: 0.6 }));
  }
  /* the cloud of colour a dissolving crystal sends into still water: a half-sphere on the floor */
  function inkCloud(F, base, rad, dens, colour) {
    const ctx = F.ctx, cam = F.cam;
    if (rad <= 1e-5) return;
    F.push([base[0], base[1], base[2] + rad * 0.4], () => {
      const c = cam.project([base[0], base[1], base[2] + 0.0005]), tp = cam.project([base[0], base[1], base[2] + rad]), sd = cam.project([base[0] + rad * cam.r[0], base[1] + rad * cam.r[1], base[2]]);
      if (!c.ok || !tp.ok || !sd.ok) return;
      const rx = Math.hypot(sd.x - c.x, sd.y - c.y), ry = Math.abs(c.y - tp.y);
      ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, Math.max(ry, rx * 0.3), 0, Math.PI, TAU); ctx.ellipse(c.x, c.y, rx, rx * 0.32, 0, 0, Math.PI); ctx.clip();
      const k = clamp(dens, 0, 1), gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(rx, ry));
      gr.addColorStop(0, rgba(mix(colour, '#1A0020', 0.45), 0.92 * k + 0.05)); gr.addColorStop(0.45, rgba(colour, 0.6 * k + 0.04)); gr.addColorStop(1, rgba(colour, 0));
      ctx.fillStyle = gr; ctx.fillRect(c.x - rx, c.y - ry - 4, 2 * rx, ry + rx * 0.4 + 4);
      // streaks of the denser solution sliding along the floor
      ctx.globalCompositeOperation = 'source-atop'; ctx.strokeStyle = rgba(mix(colour, '#000000', 0.3), 0.18 * k); ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo(c.x + Math.cos(a) * rx * 0.5, c.y + Math.sin(a) * ry * 0.3, c.x + Math.cos(a) * rx * 0.9, c.y + Math.sin(a) * ry * 0.85); ctx.stroke(); }
      ctx.restore();
    }, -0.03);
  }
  /* a dial gauge in screen space: value as a fraction of full scale on a log or linear face */
  function gauge(ctx, x, y, R, frac, o) {
    o = o || {};
    ctx.save();
    const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R * 1.1);
    g.addColorStop(0, '#E8ECF2'); g.addColorStop(0.7, '#8C96A6'); g.addColorStop(1, '#3A4252');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F4F2EA'; ctx.beginPath(); ctx.arc(x, y, R * 0.84, 0, TAU); ctx.fill();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    ctx.strokeStyle = '#2A2E36'; ctx.lineWidth = 1;
    (o.ticks || []).forEach(([f, lab]) => {
      const a = a0 + (a1 - a0) * f; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.78, y + Math.sin(a) * R * 0.78); ctx.lineTo(x + Math.cos(a) * R * 0.66, y + Math.sin(a) * R * 0.66); ctx.stroke();
      if (lab && R > 18) { ctx.fillStyle = '#2A2E36'; ctx.font = mono(Math.max(6.5, R * 0.17), 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, x + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.5); }
    });
    if (o.unit && R > 18) { ctx.fillStyle = '#5A606C'; ctx.font = mono(Math.max(6, R * 0.15), 600); ctx.textAlign = 'center'; ctx.fillText(o.unit, x, y + R * 0.5); }
    const a = a0 + (a1 - a0) * clamp(frac, 0, 1);
    ctx.strokeStyle = '#C8302A'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * R * 0.12, y - Math.sin(a) * R * 0.12); ctx.lineTo(x + Math.cos(a) * R * 0.74, y + Math.sin(a) * R * 0.74); ctx.stroke();
    ctx.fillStyle = '#20242C'; ctx.beginPath(); ctx.arc(x, y, R * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  }
  /* rubber tubing between world points, sagging */
  function tubing(F, pts, o) {
    o = o || {};
    R3.tube(F, pts, o.r || 0.004, o.colour || '#B8452E', { shadow: false });
  }
  /* two gas jars mouth to mouth on a tile: prof = brown fraction in NZ cells from the bottom */
  function gasJars(F, base, prof, o) {
    o = o || {};
    const H = o.H || 0.15, r = o.r || 0.03, n = prof.length, dz = 2 * H / n, colour = o.colour || '#B4501E', bands = [];
    for (let i = 0; i < n; i++) { const c = clamp(prof[i], 0, 1); if (c > 0.003) bands.push({ z0: base[2] + i * dz, z1: base[2] + (i + 1) * dz + 1e-4, col: colour, a: 0.82 * Math.pow(c, 0.8) }); }
    glassColumn(F, base, r, base[2] + 0.002, base[2] + 2 * H, bands, { flange: true });
    R3.box(F, [base[0], base[1], base[2] + 0.002], [2.6 * r, 2.6 * r, 0.004], '#3E4656', { shadow: false });
    R3.cylinder(F, [base[0], base[1], base[2] + 2 * H], [base[0], base[1], base[2] + 2 * H + 0.006], r + 0.008, '#D9E8F2', { segments: 30, shadow: false, ambient: 0.6 });
  }

  /* a Hofmann voltameter: two graduated limbs and a reservoir, platinum electrodes at the foot.
     vL, vR: gas (mL) in the left (cathode) and right (anode) limbs; o.level of the reservoir */
  function hofmann(F, base, vL, vR, o) {
    o = o || {};
    const r = 0.0075, h = 0.30, z0 = base[2] + 0.06, z1 = z0 + h, sep = 0.05, x = base[0], y = base[1];
    const perMl = 1e-6 / (Math.PI * r * r * 0.93 * 0.93);         // m of tube per mL
    const water = o.tint || '#CFE6F4';
    const limb = (cx, v, tag) => {
      const gz = z1 - 0.012 - v * perMl;
      glassColumn(F, [cx, y, 0], r, z0, z1, [{ z0, z1: Math.max(z0, gz), col: water, a: 0.32, surface: true }, { z0: Math.max(z0, gz), z1: z1 - 0.012, col: '#F4F8FF', a: 0.06 }], { graduate: { z0: z1 - 0.012, perUnit: -perMl, every: 1, from: 0, labelEvery: 5, size: 7.5 } });
      // the tap and its key
      R3.cylinder(F, [cx, y, z1], [cx, y, z1 + 0.03], r * 0.7, '#D9E8F2', { segments: 16, shadow: false, ambient: 0.6 });
      R3.cylinder(F, [cx - 0.012, y, z1 + 0.018], [cx + 0.012, y, z1 + 0.018], 0.004, '#E6EEF5', { segments: 12, shadow: false });
      R3.box(F, [cx + 0.014, y, z1 + 0.018], [0.004, 0.012, 0.016], '#C9D6E2', { shadow: false });
      // the electrode: a platinum foil on a wire sealed through the foot
      R3.box(F, [cx, y, z0 + 0.012], [0.008, 0.0012, 0.014], '#D8DCE2', { shadow: false, ambient: 0.65 });
      R3.cylinder(F, [cx, y, z0 - 0.02], [cx, y, z0 + 0.005], 0.0012, '#B8BEC6', { segments: 8, shadow: false });
      void tag;
    };
    limb(x - sep, vL, 'H'); limb(x + sep, vR, 'O');
    // the foot: a cross tube joining the limbs to the centre column
    R3.cylinder(F, [x - sep, y, z0 - 0.01], [x + sep, y, z0 - 0.01], r * 0.9, '#D2E6F2', { segments: 18, shadow: false, ambient: 0.65 });
    R3.cylinder(F, [x - sep, y, z0 - 0.012], [x - sep, y, z0 + 0.002], r * 1.05, '#D2E6F2', { segments: 18, shadow: false, ambient: 0.65 });
    R3.cylinder(F, [x + sep, y, z0 - 0.012], [x + sep, y, z0 + 0.002], r * 1.05, '#D2E6F2', { segments: 18, shadow: false, ambient: 0.65 });
    // the centre column and its reservoir bulb; the water pushed out of the limbs rises in it
    const lv = clamp(o.level == null ? 0.5 : o.level, 0, 1), cz1 = z1 + 0.04;
    glassColumn(F, [x, y, 0], r * 0.75, z0 - 0.01, cz1, [{ z0: z0 - 0.01, z1: z0 - 0.01 + (cz1 - z0) * (0.78 + 0.2 * lv), col: water, a: 0.3, surface: true }]);
    F.push([x, y, cz1 + 0.03], () => { const q = F.cam.project([x, y, cz1 + 0.03]); if (!q.ok) return; const R = 0.03 * q.s, c = F.ctx; c.save(); c.strokeStyle = 'rgba(220,240,255,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(q.x, q.y, R, 0, TAU); c.stroke(); c.fillStyle = rgba(water, 0.25); c.beginPath(); c.arc(q.x, q.y, R * 0.98, Math.PI * (0.1 + 0.4 * (1 - lv)), Math.PI * (0.9 - 0.4 * (1 - lv))); c.closePath(); c.fill(); c.restore(); }, -0.03);
    // a retort stand behind it
    R3.box(F, [x, y + 0.06, base[2] + 0.008], [0.22, 0.12, 0.016], '#2C3445', { shadow: false, ambient: 0.35 });
    R3.cylinder(F, [x, y + 0.09, base[2] + 0.016], [x, y + 0.09, z1 + 0.06], 0.006, '#B8C2D0', { segments: 12, shadow: false });
    R3.box(F, [x, y + 0.05, z1 - 0.04], [2 * sep + 0.04, 0.012, 0.012], '#3A4458', { shadow: false });
    return { top: (cx) => [cx, y, z1 + 0.03], electrode: cx => [cx, y, z0 + 0.012], perMl, z0, z1, sep };
  }
  /* a bench power supply: a case, a two-line LCD (volts, amps) and a knob. Returns the knob and the terminals */
  function supply(F, at, V, I, o) {
    o = o || {};
    const B = window.BENCH, w = 0.16, d = 0.14, h = 0.085;
    R3.box(F, [at[0], at[1], at[2] + h / 2], [w, d, h], '#3A4252', { ambient: 0.45, shadowK: 0.7 });
    const n = [0, -1, 0], fc = [at[0] - 0.02, at[1] - d / 2 - 0.001, at[2] + h * 0.6];
    const img = lcd2(V.toFixed(1) + ' V', (I >= 0.1 ? I.toFixed(3) + ' A' : (I * 1000).toFixed(I < 1e-3 ? 4 : 1) + ' mA'));
    const P0 = add(fc, [-0.045, 0, 0.018]), P1 = add(P0, [0.09, 0, 0]), P3 = add(P0, [0, 0, -0.036]);
    F.push(add(fc, scale(n, 0.002)), () => B.faceTex(F.ctx, F.cam, img, P0, P1, P3, 1, null), -0.02);
    const knob = [at[0] + 0.05, at[1] - d / 2 - 0.008, at[2] + h * 0.55];
    R3.cylinder(F, [knob[0], knob[1] + 0.008, knob[2]], knob, 0.012, '#20242C', { segments: 18, shadow: false });
    const ka = -2.4 + 4.8 * clamp(V / (o.vmax || 20), 0, 1);
    R3.polyline(F, [add(knob, [0, -0.0005, 0]), add(knob, [Math.sin(ka) * 0.01, -0.0005, Math.cos(ka) * 0.01])], '#F2F4F8', { width: 2, bias: -0.03 });
    const tR = [at[0] + 0.02, at[1] - d / 2 - 0.006, at[2] + 0.02], tB = [at[0] + 0.05, at[1] - d / 2 - 0.006, at[2] + 0.02];
    R3.cylinder(F, [tR[0], tR[1] + 0.006, tR[2]], tR, 0.006, '#D23A30', { segments: 12, shadow: false });
    R3.cylinder(F, [tB[0], tB[1] + 0.006, tB[2]], tB, 0.006, '#20242C', { segments: 12, shadow: false });
    return { knob, red: tR, black: tB };
  }
  function lcd2(a, b) {
    const key = 'lcd2' + a + '|' + b;
    if (cache[key]) return cache[key];
    const c = canvas(240, 96), x = c.getContext('2d');
    x.fillStyle = '#0A1410'; x.fillRect(0, 0, 240, 96);
    x.fillStyle = '#7CF0B0'; x.font = '700 34px "IBM Plex Mono",monospace'; x.textAlign = 'right'; x.textBaseline = 'middle';
    x.fillText(a, 228, 26); x.fillStyle = '#FFD66B'; x.fillText(b, 228, 70);
    const ks = Object.keys(cache).filter(k => k.startsWith('lcd2')); if (ks.length > 40) ks.forEach(k => delete cache[k]);
    return (cache[key] = c);
  }
  /* a shallow tray of water dusted with powder; the film clears a patch of radius fr (m), centred, with a ragged edge */
  function oilTray(F, c, w, l, fr, o) {
    o = o || {};
    const key = 'tray' + w + 'x' + l + ':' + Math.round(fr * 2000) + (o.lens ? 'L' : '') + (o.seed || 1);
    if (!cache[key]) {
      Object.keys(cache).filter(k => k.startsWith('tray')).forEach(k => delete cache[k]);
      const W = 512, Hh = Math.round(512 * l / w), cv = canvas(W, Hh), x = cv.getContext('2d'), r = rng(o.seed || 7);
      const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#9FB8C8'); g.addColorStop(1, '#7E98AA'); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      x.fillStyle = 'rgba(236,226,190,.9)';
      for (let i = 0; i < 26000; i++) { const px = r() * W, py = r() * Hh; x.globalAlpha = 0.25 + 0.5 * r(); x.fillRect(px, py, 1.3, 1.3); }
      x.globalAlpha = 1;
      const R = fr / w * W;
      if (R > 0.5) {
        // the cleared patch: water seen through, the powder heaped at its edge
        x.save(); x.beginPath();
        for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, k = 1 + 0.05 * Math.sin(a * 5 + 1.3) + 0.03 * Math.sin(a * 11 + 0.4); i ? x.lineTo(W / 2 + Math.cos(a) * R * k, Hh / 2 + Math.sin(a) * R * k) : x.moveTo(W / 2 + Math.cos(a) * R * k, Hh / 2 + Math.sin(a) * R * k); }
        x.closePath();
        x.strokeStyle = 'rgba(245,236,200,.95)'; x.lineWidth = Math.max(2, R * 0.05); x.stroke();
        x.clip(); const gw = x.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, R); gw.addColorStop(0, o.lens ? '#C9B25A' : '#5E86A4'); gw.addColorStop(1, o.lens ? '#8C7A3A' : '#4C7392');
        x.fillStyle = gw; x.fillRect(0, 0, W, Hh); x.restore();
      }
      cache[key] = cv;
    }
    // the tray: a white enamel dish with a rolled rim
    const h = 0.025;
    R3.box(F, [c[0], c[1], c[2] + h / 2], [w + 0.02, l + 0.02, h], '#E6E8EA', { ambient: 0.55, shadowK: 0.6 });
    R3.texPlane(F, [c[0], c[1], c[2] + h + 0.0006], [w / 2, 0, 0], [0, -l / 2, 0], cache[key], { bias: -0.02, grid: 8 });
  }
  /* a glass dropping pipette held tip-down at `tip`: a teat, a barrel, a drawn-out tip, its liquid */
  function pipette(F, tip, o) {
    o = o || {};
    const L = 0.11, top = add(tip, [0, 0, L]);
    glassColumn(F, tip, 0.0018, tip[2] + 0.002, tip[2] + 0.04, [{ z0: tip[2] + 0.002, z1: tip[2] + 0.04, col: o.liquid || '#E8DC9A', a: 0.5 }]);
    glassColumn(F, tip, 0.0045, tip[2] + 0.04, tip[2] + 0.085, [{ z0: tip[2] + 0.04, z1: tip[2] + 0.042 + 0.035 * (o.fill == null ? 0.6 : o.fill), col: o.liquid || '#E8DC9A', a: 0.6, surface: true }]);
    R3.cylinder(F, add(tip, [0, 0, 0.085]), top, 0.0062, '#C23A28', { segments: 14, shadow: false });
    R3.sphere(F, add(top, [0, 0, 0.004]), 0.0068, '#C23A28', { shadow: false });
    return top;
  }

  /* ============================================================
     MAGNIFIED VIEWS
     ============================================================ */
  /* liquid water with ions in it, as a 2D slice: sys.p [{x, y, a, k}] in panel units (pm), k 'w' | 'ion'.
     view: { cx, cy, s (px per pm), R } */
  function liquidSlice(ctx, sys, V, o) {
    o = o || {};
    const pts = sys.p.slice().sort((u, v) => (u.k === 'ion') - (v.k === 'ion'));
    pts.forEach(q => {
      const x = V.cx + (q.x - sys.cx) * V.s, y = V.cy + (q.y - sys.cy) * V.s;
      if (Math.hypot(x - V.cx, y - V.cy) > V.R + 30) return;
      const m = q.k === 'ion' ? MOL.MnO4 : q.k === 'br' ? MOL.Br2 : q.k === 'n2' ? MOL.N2 : q.k === 'o2' ? MOL.O2 : q.k === 'e' ? MOL.EtOH : MOL.H2O;
      molecule2(ctx, x, y, m, V.s, q.a, { tilt: q.t || 0, k: 0.72, tint: q.k === 'br' ? '#E07A20' : null });
    });
  }
  /* a microscope field, bright-field, with grains as small refractile spheres */
  function field(ctx, cx, cy, R, paint, o) {
    o = o || {};
    window.G6B.circle(ctx, cx, cy, R, () => {
      const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      g.addColorStop(0, o.lamp || '#F3EEDF'); g.addColorStop(1, mix(o.lamp || '#F3EEDF', '#8A8270', 0.35));
      ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      paint();
    }, { vignette: 0.55 });
  }
  function grain(ctx, x, y, r, o) {
    o = o || {};
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4);
    halo.addColorStop(0, 'rgba(40,30,10,.0)'); halo.addColorStop(0.45, 'rgba(60,40,10,.28)'); halo.addColorStop(0.7, 'rgba(255,250,230,.25)'); halo.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    ctx.restore();
    RX.ball(ctx, x, y, r, o.colour || '#E0A21A', { rim: 0.6, sub: 0.5, shadow: false });
  }
  /* a squared eyepiece graticule */
  function graticule(ctx, cx, cy, R, cell, n, colour) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.strokeStyle = colour || 'rgba(30,40,60,.45)'; ctx.lineWidth = 0.8;
    for (let i = -n; i <= n; i++) { ctx.beginPath(); ctx.moveTo(cx + i * cell, cy - n * cell); ctx.lineTo(cx + i * cell, cy + n * cell); ctx.moveTo(cx - n * cell, cy + i * cell); ctx.lineTo(cx + n * cell, cy + i * cell); ctx.stroke(); }
    ctx.restore();
  }
  /* an oleic acid molecule standing on water, painted space-filling: head (COOH) at (x, y), tail up */
  const OLEIC = (() => {
    const a = [['O', -70, 30, 0], ['O', 70, 30, 0], ['C', 0, 0, 0]];
    let x = 0, y = 0;
    for (let i = 1; i < 18; i++) {
      // a zigzag of 126 pm rise, kinked 30° at the cis double bond C9=C10
      const kink = i >= 9 ? 1 : 0, dir = kink ? 0.52 : 0;
      x += (i % 2 ? 63 : -63) + Math.sin(dir) * 126; y -= Math.cos(dir) * 126;
      a.push(['C', x, y, 0]);
      if (i < 17) { a.push(['H', x + (i % 2 ? 60 : -60), y + 10, 70]); a.push(['H', x + (i % 2 ? 60 : -60), y + 10, -70]); }
      else { a.push(['H', x + 60, y - 50, 0]); a.push(['H', x - 40, y - 80, 60]); }
    }
    a.push(['H', -110, 60, 0]);
    return a;
  })();

  window.G7A = { CPK, VDW, MOL, OLEIC, col, atom2, molecule2, glassColumn, inkCloud, gauge, tubing, gasJars, hofmann, supply, oilTray, pipette, liquidSlice, field, grain, graticule, mono, sans, mix, rgba, rng, canvas };
})();
