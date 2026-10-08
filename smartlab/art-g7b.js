/* ============================================================
   G7B — the figure library of Grade 7 Unit B (chemical reactions and
   conservation of matter). The chemistry bench, drawn as the real things:
     glass of revolution — a conical flask with its printed graduations, test
       and boiling tubes upright or clamped at a slant, a watch glass, a
       crucible, an evaporating dish; the liquid in them a volume with its own
       tint, the cloud of a precipitate, rising gas bubbles, a settled layer;
     the bench — a Bunsen burner whose flame follows its air hole (roaring
       blue cone or lazy yellow), a tripod and gauze, a gas syringe whose
       plunger is pushed out by the gas, rubber delivery tubing and a bung, a
       wooden splint (lit, glowing, out), a bar magnet, a test-tube rack, a
       dropping pipette, reagent bottles with printed labels, a Hofmann
       voltameter on its power supply, the black cross under a flask;
     what is in them — powder heaps, crystals, magnesium ribbon, iron wool,
       marble chips, a burning-magnesium glare;
     the 2D plates — atoms as lit spheres in CPK colours, bonded and charged,
       for the particle cards.
   World metres, Z up, bench top at z = 0. Nothing here computes science.
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
  const sans = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Sans",sans-serif';
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }; }
  function basis(axis) { const a = norm(axis), u = norm(R3.perp(a)), v = cross(a, u); return { a, u, v }; }
  function hull2(P) {
    const pts = P.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    hi.pop(); lo.pop(); return lo.concat(hi);
  }
  const poly = (ctx, P) => { P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); };

  /* ---------------- a body of revolution ----------------
     prof: [[s, r], …] along axis from base (s, r in m). Returns projected rings, or null. */
  function ringsOf(cam, base, axis, prof, n) {
    const B = basis(axis), out = [];
    for (const [s, r] of prof) {
      const c = add(base, scale(B.a, s)), ring = [];
      for (let i = 0; i < n; i++) { const t = i / n * TAU, q = cam.project(add(c, add(scale(B.u, r * Math.cos(t)), scale(B.v, r * Math.sin(t))))); if (!q.ok) return null; ring.push(q); }
      out.push(ring);
    }
    return out;
  }
  /* the union of each pair of neighbouring rings' hulls: a solid of revolution's silhouette, concave shoulders and all */
  function unionPath(ctx, rings) { ctx.beginPath(); for (let i = 0; i + 1 < rings.length; i++) poly(ctx, hull2(rings[i].concat(rings[i + 1]))); }
  /* the two silhouette edges: on each ring the point furthest either side of the projected axis */
  function chains(rings) {
    const c0 = centroid(rings[0]), c1 = centroid(rings[rings.length - 1]);
    let dx = c1.x - c0.x, dy = c1.y - c0.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const nx = -dy, ny = dx, L = [], Rr = [];
    rings.forEach(r => { let lo = r[0], hi = r[0], vl = 1e9, vh = -1e9; r.forEach(q => { const d = q.x * nx + q.y * ny; if (d < vl) { vl = d; lo = q; } if (d > vh) { vh = d; hi = q; } }); L.push(lo); Rr.push(hi); });
    return { L, R: Rr };
  }
  function centroid(r) { let x = 0, y = 0; r.forEach(q => { x += q.x; y += q.y; }); return { x: x / r.length, y: y / r.length }; }
  function interpR(prof, s) {
    for (let i = 0; i + 1 < prof.length; i++) { const [s0, r0] = prof[i], [s1, r1] = prof[i + 1]; if (s >= s0 && s <= s1) return r0 + (r1 - r0) * (s1 > s0 ? (s - s0) / (s1 - s0) : 0); }
    return prof[prof.length - 1][1];
  }
  function clipProf(prof, s1, s0) {
    s0 = s0 || 0;
    const out = [[s0, interpR(prof, s0)]];
    prof.forEach(([s, r]) => { if (s > s0 && s < s1) out.push([s, r]); });
    out.push([s1, interpR(prof, s1)]);
    return out;
  }

  /* glass of revolution, with what is in it.
     o.level (m along the axis, axis vertical): liquid; o.tint, o.alpha; o.cloud 0..1 (a suspended
     precipitate's opacity), o.cloudCol; o.settled (m) a layer on the floor, o.settledCol;
     o.bubbles {n, ph, size}; o.solid {to (m), col, grain} a powder fill from the floor;
     o.ring {s0, s1, col} a deposit on the inside wall; o.drops {s0, s1, n} condensation;
     o.glow {s0, s1, col, k} a red-hot part; o.marks [{s, text}] printed on the glass. */
  function vessel(F, base, axis, prof, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, B = basis(axis), wall = o.wall || 0.0012;
    const inner = prof.map(([s, r]) => [s, Math.max(0.0005, r - wall)]);
    const mid = add(base, scale(B.a, prof[prof.length - 1][0] / 2));
    const N = o.seg || 30;
    // what lies inside: powder fill, glow, deposits
    if (o.solid && o.solid.to > 0.0005) F.push(add(base, scale(B.a, o.solid.to / 2)), () => {
      const sp = clipProf(inner, o.solid.to, 0).map(([s, r]) => [s, r * 0.97]);
      const R = ringsOf(cam, base, axis, sp, 22); if (!R) return;
      const ch = chains(R), c0 = centroid(R[0]), c1 = centroid(R[R.length - 1]);
      ctx.save(); unionPath(ctx, R);
      const g = ctx.createLinearGradient(ch.L[0].x, ch.L[0].y, ch.R[0].x, ch.R[0].y);
      const col = o.solid.col;
      g.addColorStop(0, mix(col, '#05080F', 0.35)); g.addColorStop(0.45, mix(col, '#FFFFFF', 0.12)); g.addColorStop(1, mix(col, '#05080F', 0.5));
      ctx.fillStyle = g; ctx.fill('nonzero'); ctx.clip('nonzero');
      // grain: deterministic speckle in the powder's own two tones
      const r = rng(o.solid.seed || 7), col2 = o.solid.col2 || mix(col, '#000', 0.4);
      const x0 = Math.min(c0.x, c1.x) - 40, y0 = Math.min(c0.y, c1.y) - 40, w = Math.abs(c1.x - c0.x) + 80, h = Math.abs(c1.y - c0.y) + 80;
      for (let i = 0; i < 260; i++) { ctx.fillStyle = r() < 0.5 ? rgba(col2, 0.7) : rgba(mix(col, '#FFFFFF', 0.4), 0.55); ctx.fillRect(x0 + r() * w, y0 + r() * h, 1.6, 1.6); }
      if (o.solid.glow) {                                   // the red glow of a reaction front
        const gl = o.solid.glow, a = cam.project(add(base, scale(B.a, gl.s))), rr = Math.max(8, 0.02 * a.s);
        if (a.ok) { const rg = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, rr); rg.addColorStop(0, 'rgba(255,240,160,' + gl.k + ')'); rg.addColorStop(0.4, 'rgba(255,120,30,' + (0.8 * gl.k) + ')'); rg.addColorStop(1, 'rgba(255,60,0,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg; ctx.fillRect(a.x - rr, a.y - rr, rr * 2, rr * 2); }
      }
      ctx.restore();
    }, 0.004);
    // the liquid
    if (o.level > 0.0005) F.push(add(base, scale(B.a, o.level / 2)), () => {
      const lp = clipProf(inner, o.level, 0);
      const R = ringsOf(cam, base, axis, lp, N); if (!R) return;
      const top = R[R.length - 1], ch = chains(R);
      ctx.save(); unionPath(ctx, R);
      const tint = o.tint || '#CFE8F6', al = o.alpha == null ? 0.34 : o.alpha;
      const gx = ctx.createLinearGradient(ch.L[0].x, 0, ch.R[0].x, 0);
      gx.addColorStop(0, rgba(mix(tint, '#081C34', 0.35), Math.min(1, al + 0.16))); gx.addColorStop(0.4, rgba(mix(tint, '#FFFFFF', 0.18), al)); gx.addColorStop(1, rgba(mix(tint, '#081C34', 0.42), Math.min(1, al + 0.2)));
      ctx.fillStyle = gx; ctx.fill('nonzero'); ctx.clip('nonzero');
      let yMin = 1e9, yMax = -1e9, xMin = 1e9, xMax = -1e9; R.forEach(r => r.forEach(q => { yMin = Math.min(yMin, q.y); yMax = Math.max(yMax, q.y); xMin = Math.min(xMin, q.x); xMax = Math.max(xMax, q.x); }));
      if (o.cloud > 0.003) {                                   // a suspended precipitate: milky, thicker low down
        const cc = o.cloudCol || '#F2F1EA', g2 = ctx.createLinearGradient(0, yMin, 0, yMax);
        g2.addColorStop(0, rgba(cc, 0.55 * o.cloud)); g2.addColorStop(1, rgba(cc, Math.min(0.97, 1.05 * o.cloud)));
        ctx.fillStyle = g2; ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
        const r = rng(13); ctx.fillStyle = rgba(mix(cc, '#000', 0.12), 0.35 * o.cloud);
        for (let i = 0; i < 220; i++) ctx.fillRect(xMin + r() * (xMax - xMin), yMin + r() * (yMax - yMin), 1.4, 1.4);
      }
      if (o.bubbles && o.bubbles.n > 0) {
        const bb = o.bubbles, n = Math.min(90, Math.round(bb.n)), ph = bb.ph || 0, r0 = interpR(inner, 0) * 0.85;
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 0.8;
        for (let k = 0; k < n; k++) {
          const s = (k * 0.618034 + 0.17) % 1, a = s * TAU, rr = r0 * Math.sqrt((k * 0.381966 + 0.31) % 1) * (bb.spread == null ? 1 : bb.spread);
          const u = (ph * (0.55 + 0.6 * ((k * 0.7) % 1)) + s) % 1, z = (bb.from || 0.003) + u * (o.level - 0.004);
          const rw = interpR(inner, z) / Math.max(1e-4, interpR(inner, 0));
          const q = cam.project(add(add(base, scale(B.a, z)), add(scale(B.u, rr * rw * Math.cos(a)), scale(B.v, rr * rw * Math.sin(a)))));
          if (!q.ok) continue;
          const rad = Math.max(0.8, (bb.size || 0.0009) * (0.6 + 1.2 * u) * q.s);
          ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
      // the free surface and its meniscus line
      ctx.save(); ctx.beginPath(); poly(ctx, top);
      ctx.fillStyle = rgba(mix(o.cloud > 0.2 ? (o.cloudCol || '#F2F1EA') : tint, '#FFFFFF', 0.35), o.cloud > 0.2 ? 0.75 : 0.42); ctx.fill();
      ctx.strokeStyle = 'rgba(236,248,255,.85)'; ctx.lineWidth = 1.1; ctx.stroke();
      if (o.foam > 0.02) { const r = rng(5); top.forEach((q, i) => { if (i % 2) return; const c = centroid(top); const f = 0.15 + 0.85 * r(); ctx.fillStyle = 'rgba(250,252,255,' + (0.5 * o.foam).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(c.x + (q.x - c.x) * f, c.y + (q.y - c.y) * f, 1.2 + 2.2 * o.foam * r(), 0, TAU); ctx.fill(); }); }
      ctx.restore();
    }, -0.02);
    // a layer settled on the floor
    if (o.settled > 0.0003) F.push(add(base, scale(B.a, o.settled / 2)), () => {
      const R = ringsOf(cam, base, axis, clipProf(inner, o.settled, 0), 24); if (!R) return;
      ctx.save(); unionPath(ctx, R); ctx.fillStyle = o.settledCol || '#ECEBE4'; ctx.fill('nonzero');
      ctx.beginPath(); poly(ctx, R[R.length - 1]); ctx.fillStyle = mix(o.settledCol || '#ECEBE4', '#FFFFFF', 0.25); ctx.fill(); ctx.restore();
    }, -0.01);
    // the glass
    F.push(mid, () => {
      const R = ringsOf(cam, base, axis, prof, N); if (!R) return;
      const ch = chains(R), top = R[R.length - 1];
      ctx.save(); unionPath(ctx, R);
      ctx.fillStyle = o.glassFill || 'rgba(200,228,245,.13)'; ctx.fill('nonzero'); ctx.clip('nonzero');
      // the bright streaks a cylinder of glass throws near each silhouette
      const xa = Math.min(...ch.L.map(q => q.x)), xb = Math.max(...ch.R.map(q => q.x));
      const gr = ctx.createLinearGradient(xa, 0, xb, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.08, 'rgba(255,255,255,.30)'); gr.addColorStop(0.15, 'rgba(255,255,255,.03)');
      gr.addColorStop(0.82, 'rgba(255,255,255,.02)'); gr.addColorStop(0.9, 'rgba(255,255,255,.17)'); gr.addColorStop(0.97, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(xa - 2, -4000, xb - xa + 4, 9000);
      if (o.ring) {                                               // a deposit on the wall
        const RR = ringsOf(cam, base, axis, clipProf(prof, o.ring.s1, o.ring.s0), 24);
        if (RR) { ctx.beginPath(); for (let i = 0; i + 1 < RR.length; i++) poly(ctx, hull2(RR[i].concat(RR[i + 1]))); ctx.fillStyle = rgba(o.ring.col, o.ring.a == null ? 0.7 : o.ring.a); ctx.fill('nonzero'); }
      }
      if (o.drops && o.drops.n > 0) {                             // condensed droplets
        const r = rng(o.drops.seed || 3); ctx.fillStyle = 'rgba(235,248,255,.55)'; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.6;
        for (let i = 0; i < Math.min(80, o.drops.n); i++) {
          const s = o.drops.s0 + r() * (o.drops.s1 - o.drops.s0), a = (r() - 0.5) * 2.4 + Math.PI, rr = interpR(prof, s);
          const q = cam.project(add(add(base, scale(B.a, s)), add(scale(B.u, rr * Math.cos(a)), scale(B.v, rr * Math.sin(a))))); if (!q.ok) continue;
          ctx.beginPath(); ctx.arc(q.x, q.y, 0.7 + 1.6 * r(), 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(225,242,255,.8)'; ctx.lineWidth = 1.3;
      [ch.L, ch.R].forEach(c => { ctx.beginPath(); c.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); });
      ctx.strokeStyle = 'rgba(240,250,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); poly(ctx, top); ctx.stroke();
      if (o.marks) {                                               // printed graduations on the side toward the camera
        const e = cam.eye, ang = Math.atan2(e[1] - base[1], e[0] - base[0]) + 0.45;
        ctx.font = mono(8, 600); ctx.textBaseline = 'middle';
        o.marks.forEach(m => {
          const rr = interpR(prof, m.s), c = add(base, scale(B.a, m.s));
          const p0 = [c[0] + rr * Math.cos(ang), c[1] + rr * Math.sin(ang), c[2]], p1 = [c[0] + rr * Math.cos(ang + 0.35), c[1] + rr * Math.sin(ang + 0.35), c[2]];
          const a = cam.project(p0), b = cam.project(p1); if (!a.ok || !b.ok) return;
          ctx.strokeStyle = 'rgba(250,252,255,.9)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.fillStyle = 'rgba(250,252,255,.92)'; ctx.textAlign = b.x < a.x ? 'right' : 'left'; ctx.fillText(m.text, b.x + (b.x < a.x ? -3 : 3), b.y);
        });
      }
      ctx.restore();
    }, o.glassBias == null ? -0.04 : o.glassBias);
  }
  /* the inner volume (m³) up to height h of a profile */
  function volumeTo(prof, h, wall) {
    let V = 0; const n = 200;
    for (let i = 0; i < n; i++) { const s = h * (i + 0.5) / n, r = Math.max(0, interpR(prof, s) - (wall || 0.0012)); V += Math.PI * r * r * h / n; }
    return V;
  }
  function levelFor(prof, V, wall) {
    let lo = 0, hi = prof[prof.length - 1][0] - 0.002;
    if (volumeTo(prof, hi, wall) <= V) return hi;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (volumeTo(prof, m, wall) < V) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ---------------- the glassware ---------------- */
  // a 250 mL conical (Erlenmeyer) flask: 85 mm across the foot, 145 mm tall, a 34 mm neck
  const FLASK = [[0, 0.036], [0.003, 0.0418], [0.009, 0.0425], [0.096, 0.0185], [0.103, 0.0168], [0.140, 0.0168], [0.141, 0.0182], [0.145, 0.0182]];
  const flaskLevel = mL => levelFor(FLASK, mL * 1e-6);
  function flask(F, base, mL, o) {
    o = Object.assign({}, o || {});
    o.level = mL > 0 ? flaskLevel(mL) : 0;
    o.marks = [50, 100, 150, 200].map(v => ({ s: flaskLevel(v), text: String(v) }));
    vessel(F, base, [0, 0, 1], FLASK, o);
    return { neck: [base[0], base[1], base[2] + 0.145], level: base[2] + o.level, rIn: 0.0155 };
  }
  // test tube 150 × 18 mm, boiling tube 150 × 25 mm: a round bottom, a rolled lip
  function tubeProf(len, r) {
    const p = [];
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; p.push([r * (1 - Math.cos(a)), Math.max(0.0008, r * Math.sin(a))]); }
    p.push([len - 0.003, r]); p.push([len - 0.0025, r + 0.0012]); p.push([len, r + 0.0012]);
    return p;
  }
  function tube(F, bottom, axis, len, r, o) {
    o = o || {};
    const prof = tubeProf(len, r);
    const oo = Object.assign({}, o);
    if (o.mL != null) oo.level = o.mL > 0 ? levelFor(prof, o.mL * 1e-6, 0.0010) : 0;
    oo.wall = 0.0010; oo.seg = 22;
    vessel(F, bottom, axis, prof, oo);
    const a = norm(axis);
    return { mouth: add(bottom, scale(a, len)), level: oo.level || 0, prof };
  }
  /* a wooden test-tube rack along x: two drilled shelves on two end posts */
  function rack(F, at, n, gap, o) {
    o = o || {};
    const w = gap * n + 0.03, d = 0.05, wood = o.wood || '#B98A55';
    R3.box(F, [at[0], at[1], 0.006], [w, d + 0.01, 0.012], mix(wood, '#000', 0.15), { ambient: 0.45, shadowK: 0.6 });
    [0.075].forEach(z => {
      F.push([at[0], at[1], z], () => {
        const ctx = F.ctx, cam = F.cam, q = [[at[0] - w / 2, at[1] - d / 2, z], [at[0] + w / 2, at[1] - d / 2, z], [at[0] + w / 2, at[1] + d / 2, z], [at[0] - w / 2, at[1] + d / 2, z]].map(p => cam.project(p));
        if (q.some(v => !v.ok)) return;
        ctx.save(); ctx.beginPath(); poly(ctx, q);
        for (let i = 0; i < n; i++) { const c = [at[0] - w / 2 + 0.015 + gap * (i + 0.5), at[1], z], hole = []; for (let k = 0; k < 16; k++) { const t = k / 16 * TAU, p = cam.project([c[0] + 0.0105 * Math.cos(t), c[1] + 0.0105 * Math.sin(t), z]); hole.push(p); } hole.reverse(); poly(ctx, hole); }
        ctx.fillStyle = F.shade(wood, [0, 0, 1], { ambient: 0.5 }); ctx.fill('evenodd');
        ctx.restore();
      }, 0);
      R3.box(F, [at[0], at[1] - d / 2 - 0.004, z - 0.006], [w, 0.008, 0.012], wood, { shadow: false, ambient: 0.45 });
    });
    [-1, 1].forEach(sd => R3.box(F, [at[0] + sd * (w / 2 - 0.006), at[1], 0.045], [0.012, d, 0.078], wood, { shadow: false, ambient: 0.45 }));
  }
  /* a watch glass: a shallow dish of glass, drops of condensed liquid on its underside */
  function watchGlass(F, c, r, o) {
    o = o || {};
    const prof = [[0, 0.002], [0.004, r * 0.7], [0.008, r]];
    vessel(F, c, [0, 0, 1], prof, { seg: 26, drops: o.drops ? { s0: 0.0, s1: 0.006, n: o.drops, seed: 4 } : null, level: o.level || 0, tint: o.tint });
  }
  /* a porcelain evaporating dish holding o.fill (0..1) of liquid, o.crust crystals */
  function dish(F, c, r, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, prof = [[0, r * 0.45], [0.008, r * 0.8], [0.02, r]];
    R3.cylinder(F, c, [c[0], c[1], c[2] + 0.004], r * 0.45, '#E9E6DF', { segments: 24, ambient: 0.55, shadowK: 0.6 });
    F.push([c[0], c[1], c[2] + 0.01], () => {
      const R = ringsOf(cam, c, [0, 0, 1], prof, 26); if (!R) return;
      ctx.save(); unionPath(ctx, R); const top = R[R.length - 1], ch = chains(R);
      const g = ctx.createLinearGradient(ch.L[2].x, 0, ch.R[2].x, 0); g.addColorStop(0, '#CFCAC0'); g.addColorStop(0.4, '#FBF9F4'); g.addColorStop(1, '#A9A499');
      ctx.fillStyle = g; ctx.fill('nonzero');
      ctx.beginPath(); poly(ctx, top); ctx.fillStyle = '#8E897F'; ctx.fill();
      const lv = o.fill > 0.02 ? hull2(ringsOf(cam, [c[0], c[1], c[2] + 0.004 + 0.014 * o.fill], [0, 0, 1], [[0, r * (0.55 + 0.4 * o.fill)]], 22)[0]) : null;
      if (lv) { ctx.beginPath(); poly(ctx, lv); ctx.fillStyle = rgba(o.tint || '#CFE8F6', 0.75); ctx.fill(); }
      if (o.crust > 0.01) { const rr = rng(9), cc = centroid(top); ctx.fillStyle = o.crustCol || '#FFFFFF'; for (let i = 0; i < 160 * o.crust; i++) { const a = rr() * TAU, f = 0.2 + 0.75 * rr(); const x = cc.x + Math.cos(a) * (top[0].x - cc.x + 1e-9 ? Math.abs(top[0].x - cc.x) : 10) * f * 0.85, y = cc.y + Math.sin(a) * Math.abs(top[Math.round(top.length / 4)].y - cc.y) * f * 0.85; ctx.fillRect(x, y, 2, 2); } }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); poly(ctx, top); ctx.stroke();
      ctx.restore();
    }, 0);
  }

  /* ---------------- heat ---------------- */
  /* a Bunsen burner standing at `at`: o.air 0..1 (the collar's air hole), o.gas 0..1, o.on, o.ph (flicker).
     Returns the tip of the inner cone (the hottest place) and the flame's top. */
  function bunsen(F, at, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, steel = '#AEB6C0', H = 0.13;
    R3.cylinder(F, [at[0], at[1], 0], [at[0], at[1], 0.012], 0.042, '#2B3038', { segments: 28, ambient: 0.4, shadowK: 0.8 });
    R3.cylinder(F, [at[0], at[1], 0.012], [at[0], at[1], 0.03], 0.012, '#3A414C', { segments: 18, shadow: false });
    R3.cylinder(F, [at[0], at[1], 0.03], [at[0], at[1], 0.05], 0.0105, '#C0A060', { segments: 18, shadow: false, ambient: 0.5 });   // the brass collar
    F.push([at[0], at[1] - 0.011, 0.04], () => {                // its air hole, open as far as the collar is turned
      const q = cam.project([at[0], at[1] - 0.0106, 0.04]); if (!q.ok) return;
      const w = 0.004 + 0.004 * (o.air || 0), hgt = 0.006 * (0.25 + 0.75 * (o.air || 0));
      ctx.save(); ctx.fillStyle = '#0C0E12'; ctx.beginPath(); ctx.ellipse(q.x, q.y, w * q.s * 0.6, hgt * q.s * 0.6, 0, 0, TAU); ctx.fill(); ctx.restore();
    }, -0.01);
    R3.cylinder(F, [at[0], at[1], 0.05], [at[0], at[1], H], 0.0072, steel, { segments: 18, shadow: false, ambient: 0.5 });
    R3.cylinder(F, [at[0] + 0.012, at[1], 0.02], [at[0] + 0.05, at[1], 0.018], 0.0035, '#C9A04A', { segments: 10, shadow: false });
    R3.tube(F, [[at[0] + 0.05, at[1], 0.018], [at[0] + 0.1, at[1] + 0.02, 0.006], [at[0] + 0.16, at[1] + 0.12, 0.006]], 0.005, '#C24A2A', { segments: 8 });
    const tip = [at[0], at[1], H];
    if (!o.on) return { cone: add(tip, [0, 0, 0.02]), top: add(tip, [0, 0, 0.05]) };
    const air = clamp(o.air == null ? 1 : o.air, 0, 1), gas = clamp(o.gas == null ? 0.7 : o.gas, 0.1, 1);
    const Hf = (0.05 + 0.07 * gas) * (1.35 - 0.45 * air), cone = (0.012 + 0.018 * gas) * air;
    F.push(add(tip, [0, 0, Hf / 2]), () => {
      const b = cam.project(tip), t = cam.project(add(tip, [0, 0, Hf])), c = cam.project(add(tip, [0, 0, Math.max(0.004, cone)]));
      if (!b.ok || !t.ok) return;
      const ph = o.ph || 0, w = 0.0085 * b.s * (1 + 0.15 * gas), fl = Math.sin(ph * 17) * 0.6 + Math.sin(ph * 29 + 1) * 0.4;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lum = 1 - air;                                     // a closed air hole: the luminous, sooty yellow flame
      const outer = (k, col, a) => {
        ctx.beginPath(); ctx.moveTo(b.x - w * k, b.y);
        ctx.bezierCurveTo(b.x - w * k * 1.3, b.y - (b.y - t.y) * 0.45, t.x - w * 0.25 + fl * 2 * lum, t.y + (b.y - t.y) * 0.15, t.x + fl * 3 * lum, t.y);
        ctx.bezierCurveTo(t.x + w * 0.25 + fl * 2 * lum, t.y + (b.y - t.y) * 0.15, b.x + w * k * 1.3, b.y - (b.y - t.y) * 0.45, b.x + w * k, b.y);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, b.y, 0, t.y); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.7, rgba(col, a * 0.7)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.fill();
      };
      outer(1.15, mix('#5A6CFF', '#FFB43A', lum), 0.38 + 0.4 * lum);
      if (lum > 0.25) outer(0.8, '#FFE07A', 0.55 * lum);
      if (air > 0.15 && c.ok) {                                  // the pale-blue inner cone of an aerated flame
        ctx.beginPath(); ctx.moveTo(b.x - w * 0.6, b.y); ctx.quadraticCurveTo(b.x, b.y - (b.y - c.y) * 1.6, b.x + w * 0.6, b.y); ctx.closePath();
        const g = ctx.createLinearGradient(0, b.y, 0, c.y); g.addColorStop(0, 'rgba(120,200,255,.9)'); g.addColorStop(1, 'rgba(70,120,255,.25)'); ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
    }, -0.03);
    return { cone: add(tip, [0, 0, cone * 1.15 + 0.004]), top: add(tip, [0, 0, Hf]), H: Hf };
  }
  /* a tripod with a ceramic-centred gauze at height h */
  function tripod(F, at, h, o) {
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; R3.cylinder(F, [at[0] + 0.07 * Math.cos(a), at[1] + 0.07 * Math.sin(a), 0], [at[0] + 0.052 * Math.cos(a), at[1] + 0.052 * Math.sin(a), h - 0.004], 0.0035, '#3A3F48', { segments: 8, shadow: false, ambient: 0.4 }); }
    R3.cylinder(F, [at[0], at[1], h - 0.006], [at[0], at[1], h - 0.002], 0.058, '#3A3F48', { segments: 30, inner: 0.052, shadow: false });
    F.push([at[0], at[1], h], () => {
      const ctx = F.ctx, cam = F.cam, s = 0.055, q = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => cam.project([at[0] + x, at[1] + y, h])); if (q.some(v => !v.ok)) return;
      ctx.save(); ctx.beginPath(); poly(ctx, q); ctx.fillStyle = 'rgba(70,74,82,.55)'; ctx.fill(); ctx.clip();
      ctx.strokeStyle = 'rgba(150,156,166,.55)'; ctx.lineWidth = 0.6;
      for (let i = -10; i <= 10; i++) { [[[i / 10 * s, -s], [i / 10 * s, s]], [[-s, i / 10 * s], [s, i / 10 * s]]].forEach(([a, b]) => { const A = cam.project([at[0] + a[0], at[1] + a[1], h]), Bq = cam.project([at[0] + b[0], at[1] + b[1], h]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Bq.x, Bq.y); ctx.stroke(); }); }
      const c = []; for (let k = 0; k < 20; k++) { const t = k / 20 * TAU; c.push(cam.project([at[0] + 0.03 * Math.cos(t), at[1] + 0.03 * Math.sin(t), h])); }
      ctx.beginPath(); poly(ctx, c); ctx.fillStyle = o && o.hot ? 'rgba(255,120,60,.6)' : 'rgba(225,222,214,.85)'; ctx.fill();
      ctx.restore();
    }, F.GROUND * 0 + 0.006);
  }
  /* a clamp holding a tube or a syringe at `at`, its arm reaching back to a stand rod at rodAt */
  function clampArm(F, rodAt, at, o) {
    R3.cylinder(F, rodAt, at, 0.0045, '#A7B0BC', { segments: 8, shadow: false, ambient: 0.5 });
    BENCH.bossClamp(F, rodAt, {});
    R3.box(F, at, [0.022, 0.022, 0.03], (o && o.col) || '#C9A04A', { shadow: false, ambient: 0.45 });
  }
  function stand(F, base, h) { return BENCH.clampStand(F, base, h, {}); }

  /* ---------------- gas handling ---------------- */
  /* a 100 mL glass gas syringe lying along dir from its nozzle; vol mL of gas pushes the plunger out */
  function gasSyringe(F, nozzle, dir, vol, o) {
    o = o || {};
    const d = norm(dir), cap = o.cap || 100, Lb = 0.17, rb = 0.0155, ctx = F.ctx, cam = F.cam;
    const b0 = add(nozzle, scale(d, 0.02)), b1 = add(b0, scale(d, Lb));
    R3.cylinder(F, nozzle, b0, 0.003, '#E6EEF5', { segments: 10, shadow: false, ambient: 0.7 });
    const f = clamp(vol / cap, 0, 1.02), pz = add(b0, scale(d, 0.006 + (Lb - 0.012) * f));
    // the gas column (barely tinted), the plunger head and rod
    if (o.gasCol && f > 0.01) R3.cylinder(F, add(b0, scale(d, 0.004)), pz, rb - 0.0015, o.gasCol, { segments: 18, shadow: false, ambient: 0.8, alpha: 0.25 });
    R3.cylinder(F, pz, add(pz, scale(d, 0.008)), rb - 0.0014, '#D9E3EA', { segments: 18, shadow: false, ambient: 0.6 });
    const pe = add(pz, scale(d, Lb + 0.01));
    R3.cylinder(F, add(pz, scale(d, 0.008)), pe, 0.006, '#E3EAF0', { segments: 12, shadow: false, ambient: 0.6 });
    R3.cylinder(F, pe, add(pe, scale(d, 0.006)), 0.019, '#E3EAF0', { segments: 20, shadow: false, ambient: 0.6 });
    // the barrel: clear glass with its scale
    F.push(add(b0, scale(d, Lb / 2)), () => {
      const P = [b0, b1].map(p => p);
      const B = basis(d), q = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16 * TAU; q.push(cam.project(add(b0, add(scale(B.u, rb * Math.cos(t)), scale(B.v, rb * Math.sin(t)))))); q.push(cam.project(add(b1, add(scale(B.u, rb * Math.cos(t)), scale(B.v, rb * Math.sin(t)))))); }
      if (q.some(v => !v.ok) || !P) return;
      const H = hull2(q);
      ctx.save(); ctx.beginPath(); poly(ctx, H); ctx.fillStyle = 'rgba(205,230,246,.10)'; ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
      // the scale, printed along the side toward the camera, every 10 mL
      const e = cam.eye, mid = add(b0, scale(d, Lb / 2)), toE = norm(sub(e, mid)), side = norm(sub(toE, scale(d, R3.dot(toE, d)))), up = norm(cross(d, side));
      const off = add(scale(side, rb * 0.92), scale(up, rb * 0.25));
      ctx.font = mono(7.5, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(245,250,255,.95)'; ctx.strokeStyle = 'rgba(245,250,255,.85)';
      for (let v = 0; v <= cap; v += 5) {
        const p = add(add(b0, scale(d, 0.006 + (Lb - 0.012) * v / cap)), off), a = cam.project(p), b2 = cam.project(add(p, scale(up, v % 10 ? 0.003 : 0.006)));
        if (!a.ok || !b2.ok) continue; ctx.lineWidth = v % 10 ? 0.7 : 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
        if (v % 20 === 0) ctx.fillText(String(v), b2.x, b2.y - 1);
      }
      ctx.restore();
    }, -0.03);
    return { end: b1, plunger: pz };
  }
  /* rubber tubing through points */
  function hose(F, pts, o) { R3.tube(F, pts, (o && o.r) || 0.0032, (o && o.col) || '#7A2E22', { segments: 8 }); }
  /* a red rubber bung in a neck, holes for what passes through it */
  function bung(F, top, rTop, rBot, h) {
    R3.cylinder(F, [top[0], top[1], top[2] - h], top, (rTop + rBot) / 2, '#8E2A22', { segments: 22, shadow: false, ambient: 0.45 });
    R3.cylinder(F, top, add(top, [0, 0, 0.0015]), rTop, '#A63A30', { segments: 22, shadow: false, ambient: 0.5 });
  }
  /* a wooden splint from `tip` along dir: state 'lit' (a flame), 'glow' (an ember), 'out' (smoke) or 'pop' (a flash) */
  function splint(F, tip, dir, state, ph) {
    const d = norm(dir), e = add(tip, scale(d, 0.15));
    R3.box(F, add(tip, scale(d, 0.075)), [0.15, 0.004, 0.002], '#D9B07A', { shadow: false, ambient: 0.5, axes: [d, norm(cross([0, 0, 1], d)), norm(cross(d, norm(cross([0, 0, 1], d))))] });
    R3.box(F, add(tip, scale(d, 0.006)), [0.012, 0.0045, 0.0025], state === 'out' ? '#2A2420' : '#3A2A1E', { shadow: false, axes: [d, norm(cross([0, 0, 1], d)), norm(cross(d, norm(cross([0, 0, 1], d))))] });
    F.push(tip, () => {
      const ctx = F.ctx, q = F.cam.project(tip); if (!q.ok) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (state === 'glow') { const r = 7 + Math.sin((ph || 0) * 9) * 1.2, g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); g.addColorStop(0, 'rgba(255,220,120,.95)'); g.addColorStop(0.4, 'rgba(255,110,30,.7)'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); }
      if (state === 'lit' || state === 'relit') { const s = state === 'relit' ? 1.6 : 1; const hgt = 16 * s + Math.sin((ph || 0) * 13) * 2; const g = ctx.createLinearGradient(0, q.y, 0, q.y - hgt); g.addColorStop(0, 'rgba(255,170,60,.95)'); g.addColorStop(0.5, 'rgba(255,210,90,.7)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q.x - 5 * s, q.y + 2); ctx.quadraticCurveTo(q.x - 6 * s, q.y - hgt * 0.5, q.x, q.y - hgt); ctx.quadraticCurveTo(q.x + 6 * s, q.y - hgt * 0.5, q.x + 5 * s, q.y + 2); ctx.fill(); }
      if (state === 'pop') { const r = 22, g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); g.addColorStop(0, 'rgba(255,255,230,.95)'); g.addColorStop(0.35, 'rgba(255,190,110,.6)'); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); }
      ctx.globalCompositeOperation = 'source-over';
      if (state === 'out') { ctx.strokeStyle = 'rgba(200,205,212,.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const y = q.y - i * 3, x = q.x + Math.sin(i * 0.8 + (ph || 0) * 3) * 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.restore();
    }, -0.05);
    return e;
  }
  /* a dropping pipette: a glass stem with a rubber bulb, tip at `tip` pointing down */
  function pipette(F, tip, o) {
    R3.cylinder(F, tip, add(tip, [0, 0, 0.07]), 0.0028, '#E6F0F6', { segments: 10, shadow: false, ambient: 0.7 });
    R3.cylinder(F, add(tip, [0, 0, 0.07]), add(tip, [0, 0, 0.1]), 0.007, (o && o.col) || '#C9402F', { segments: 14, shadow: false, ambient: 0.45 });
    R3.sphere(F, add(tip, [0, 0, 0.1]), 0.007, (o && o.col) || '#C9402F', { shadow: false });
  }
  /* a reagent bottle with a printed label: name, formula, a hazard line */
  function labelTex(name, formula, hazard, col) {
    const key = 'lb' + name + formula + hazard + col;
    if (cache[key]) return cache[key];
    const c = canvas(220, 150), x = c.getContext('2d');
    x.fillStyle = '#F6F3EA'; x.fillRect(0, 0, 220, 150); x.fillStyle = col || '#2F5FB0'; x.fillRect(0, 0, 220, 22);
    x.fillStyle = '#FFF'; x.font = '700 14px "IBM Plex Sans",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LABORATORY REAGENT', 110, 11);
    x.fillStyle = '#16181C'; x.font = '700 21px "IBM Plex Sans",sans-serif'; x.fillText(name, 110, 52);
    x.font = '600 20px "IBM Plex Mono",monospace'; x.fillText(formula, 110, 84);
    if (hazard) { x.fillStyle = '#B81418'; x.font = '700 15px "IBM Plex Sans",sans-serif'; x.fillText(hazard, 110, 120); }
    return (cache[key] = c);
  }
  function reagent(F, base, name, formula, o) {
    o = o || {};
    const r = o.r || 0.03, H = o.h || 0.11, glass = o.glass || '#6C4320';
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, glass, { segments: 26, ambient: 0.42, shadowK: 0.7 });
    R3.cylinder(F, [base[0], base[1], base[2] + H], [base[0], base[1], base[2] + H + 0.016], r * 0.55, glass, { segments: 18, shadow: false, ambient: 0.42 });
    R3.cylinder(F, [base[0], base[1], base[2] + H + 0.016], [base[0], base[1], base[2] + H + 0.038], r * 0.45, o.cap || '#1E2228', { segments: 16, shadow: false, ambient: 0.45 });
    const e = F.cam.eye, a = Math.atan2(e[1] - base[1], e[0] - base[0]), n = [Math.cos(a), Math.sin(a), 0], t = [-Math.sin(a), Math.cos(a), 0];
    R3.texPlane(F, add(base, add(scale(n, r + 0.0012), [0, 0, H * 0.5])), scale(t, r * 0.8), [0, 0, -H * 0.27], labelTex(name, formula, o.hazard || '', o.band), { bias: -0.01, grid: 3 });
  }

  /* ---------------- solids ---------------- */
  /* a heap of powder: a low cone of radius r and height h, grain speckled */
  function heap(F, c, r, h, col, o) {
    o = o || {};
    if (r <= 0.0005) return;
    F.push([c[0], c[1], c[2] + h / 3], () => {
      const ctx = F.ctx, cam = F.cam, ring = [];
      for (let k = 0; k < 24; k++) { const t = k / 24 * TAU; const q = cam.project([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t), c[2]]); if (!q.ok) return; ring.push(q); }
      const ap = cam.project([c[0], c[1], c[2] + h]); if (!ap.ok) return;
      const H = hull2(ring.concat([ap]));
      ctx.save(); ctx.beginPath(); poly(ctx, H);
      const g = ctx.createLinearGradient(ap.x - r * ap.s, ap.y, ap.x + r * ap.s, ap.y);
      g.addColorStop(0, mix(col, '#FFFFFF', 0.25)); g.addColorStop(0.55, col); g.addColorStop(1, mix(col, '#05080F', 0.45));
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      const rr = rng(o.seed || 21), c2 = o.col2 || mix(col, '#000', 0.35);
      const x0 = Math.min(...H.map(q => q.x)), x1 = Math.max(...H.map(q => q.x)), y0 = Math.min(...H.map(q => q.y)), y1 = Math.max(...H.map(q => q.y));
      for (let i = 0; i < 140; i++) { ctx.fillStyle = rr() < (o.mixFrac == null ? 0.5 : o.mixFrac) ? rgba(c2, 0.8) : rgba(mix(col, '#FFFFFF', 0.45), 0.6); ctx.fillRect(x0 + rr() * (x1 - x0), y0 + rr() * (y1 - y0), 1.5, 1.5); }
      ctx.restore();
    }, o.bias || 0);
  }
  /* crystals: small lit rhombs scattered around c within radius r */
  function crystals(F, c, r, n, col, o) {
    o = o || {};
    const rr = rng(o.seed || 31), sz = o.size || 0.004;
    for (let i = 0; i < n; i++) {
      const a = rr() * TAU, d = r * Math.sqrt(rr()), p = [c[0] + d * Math.cos(a), c[1] + d * Math.sin(a), c[2] + sz * 0.4 + rr() * (o.pile || 0) * (1 - d / r)];
      const t = rr() * TAU, ax = [[Math.cos(t), Math.sin(t), 0.3 * (rr() - 0.5)], [-Math.sin(t), Math.cos(t), 0.2], [0.1, -0.2, 1]].map(norm);
      R3.box(F, p, [sz * (0.8 + 0.6 * rr()), sz * (0.6 + 0.5 * rr()), sz * (0.5 + 0.4 * rr())], mix(col, '#FFFFFF', 0.15 * rr()), { shadow: false, ambient: 0.5, axes: ax });
    }
  }
  /* magnesium ribbon from a to b: a thin bright strip, o.white turns it to the oxide's ash */
  function ribbon(F, a, b, o) {
    o = o || {};
    const d = sub(b, a), L = Math.hypot(...d); if (L < 1e-4) return;
    const dn = norm(d), side = norm(cross(dn, [0, 0, 1]).some(v => Math.abs(v) > 1e-6) ? cross(dn, [0, 0, 1]) : [1, 0, 0]), up = norm(cross(side, dn));
    R3.box(F, add(a, scale(d, 0.5)), [L, 0.003, 0.0004], o.col || '#C7CDD4', { shadow: false, ambient: 0.55, axes: [dn, side, up] });
  }
  /* iron wool: a loose tangle of fine fibres in a ball of radius r */
  function wool(F, c, r, col, o) {
    o = o || {};
    const rr = rng(o.seed || 41);
    for (let k = 0; k < 14; k++) {
      const pts = []; let a = rr() * TAU, b = rr() * Math.PI;
      for (let i = 0; i < 9; i++) { a += (rr() - 0.5) * 1.8; b += (rr() - 0.5) * 1.2; const R = r * (0.55 + 0.45 * rr()); pts.push([c[0] + R * Math.sin(b) * Math.cos(a), c[1] + R * Math.sin(b) * Math.sin(a), c[2] + r * 0.6 + R * 0.6 * Math.cos(b)]); }
      R3.polyline(F, pts, k % 3 ? col : mix(col, '#FFFFFF', 0.3), { width: 1.1, alpha: 0.95 });
    }
  }
  /* marble chips or metal granules: irregular lit lumps */
  function lumps(F, c, r, n, col, o) {
    o = o || {};
    const rr = rng(o.seed || 51), sz = o.size || 0.007;
    for (let i = 0; i < n; i++) {
      const a = rr() * TAU, d = r * Math.sqrt(rr()), s = sz * (0.6 + 0.7 * rr());
      const p = [c[0] + d * Math.cos(a), c[1] + d * Math.sin(a), c[2] + s * 0.42];
      const t = rr() * TAU, u = rr() - 0.5;
      R3.box(F, p, [s, s * (0.7 + 0.3 * rr()), s * 0.75], mix(col, i % 2 ? '#FFFFFF' : '#000000', 0.1 * rr()), { shadow: false, ambient: 0.5, axes: [norm([Math.cos(t), Math.sin(t), u]), norm([-Math.sin(t), Math.cos(t), 0.3 * u]), norm([u * 0.3, -0.2, 1])] });
    }
  }
  /* a bar magnet: red N half, blue-grey S half, letters stamped on top */
  function magnet(F, c, dir, o) {
    o = o || {};
    const d = norm(dir), L = o.len || 0.075, side = norm(cross([0, 0, 1], d)), up = [0, 0, 1];
    R3.box(F, add(c, scale(d, L / 4)), [L / 2, 0.016, 0.01], '#C8352C', { ambient: 0.45, axes: [d, side, up] });
    R3.box(F, add(c, scale(d, -L / 4)), [L / 2, 0.016, 0.01], '#5A6A84', { ambient: 0.45, axes: [d, side, up] });
    [['N', L * 0.32], ['S', -L * 0.32]].forEach(([t, s]) => R3.label(F, add(add(c, scale(d, s)), [0, 0, 0.006]), t, '#FFFFFF', { size: 9, keep: true }));
  }
  /* the black cross on white paper that a precipitate hides */
  function crossCard(F, c, s) {
    F.push([c[0], c[1], 0.0005], () => {
      const ctx = F.ctx, cam = F.cam, q = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => cam.project([c[0] + x, c[1] + y, 0.0005])); if (q.some(v => !v.ok)) return;
      ctx.save(); ctx.beginPath(); poly(ctx, q); ctx.fillStyle = '#F4F2EC'; ctx.fill();
      ctx.strokeStyle = '#111317'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const p = (x, y) => cam.project([c[0] + x, c[1] + y, 0.0006]);
      [[[-0.7, -0.7], [0.7, 0.7]], [[-0.7, 0.7], [0.7, -0.7]]].forEach(([a, b]) => { const A = p(a[0] * s, a[1] * s), B = p(b[0] * s, b[1] * s); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
      ctx.restore();
    }, F.GROUND * 0 + 0.02);
  }
  /* crucible and lid on a pipe-clay triangle */
  function crucible(F, c, o) {
    o = o || {};
    const prof = [[0, 0.012], [0.004, 0.016], [0.032, 0.021]];
    vessel(F, c, [0, 0, 1], prof, { glassFill: o.hot ? 'rgba(255,120,60,.85)' : 'rgba(236,232,224,.96)', seg: 24, solid: o.solid });
    if (o.lid) R3.cylinder(F, [c[0], c[1], c[2] + 0.032 + (o.lift || 0)], [c[0], c[1], c[2] + 0.035 + (o.lift || 0)], 0.023, o.hot ? '#FF8A5A' : '#E9E5DC', { segments: 24, shadow: false, ambient: 0.55 });
  }
  /* burning magnesium: a glare too bright to look at, white smoke rising */
  function glare(F, at, k, ph) {
    if (k <= 0.01) return;
    F.push(at, () => {
      const ctx = F.ctx, q = F.cam.project(at); if (!q.ok) return;
      const r = (40 + 30 * k) * (1 + 0.08 * Math.sin((ph || 0) * 23));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); g.addColorStop(0, 'rgba(255,255,255,' + k + ')'); g.addColorStop(0.15, 'rgba(240,245,255,' + 0.9 * k + ')'); g.addColorStop(0.5, 'rgba(200,215,255,' + 0.25 * k + ')'); g.addColorStop(1, 'rgba(200,215,255,0)');
      ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
      ctx.restore();
      ctx.save(); for (let i = 0; i < 10; i++) { const u = ((ph || 0) * 0.4 + i / 10) % 1, x = q.x + Math.sin(i * 1.7 + (ph || 0)) * 8 * u, y = q.y - 20 - u * 90, rr = 5 + 14 * u; ctx.fillStyle = 'rgba(235,236,240,' + (0.3 * (1 - u) * k).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
      ctx.restore();
    }, -0.2);
  }
  /* a Hofmann voltameter: two graduated limbs and a central reservoir, platinum electrodes, on a stand.
     vH, vO: gas collected (mL) at the top of the cathode and anode limbs; cap 50 mL each. */
  function hofmann(F, at, vH, vO, o) {
    o = o || {};
    const z0 = 0.06, L = 0.3, r = 0.009, cap = 50, gx = 0.05;
    R3.box(F, [at[0], at[1], 0.012], [0.22, 0.12, 0.024], '#2C3445', { ambient: 0.4 });
    R3.cylinder(F, [at[0] - 0.09, at[1] + 0.03, 0.024], [at[0] - 0.09, at[1] + 0.03, 0.46], 0.008, '#B8C2D0', { segments: 12, shadow: false });
    [[-gx, vH, 'H₂ (cathode, −)'], [gx, vO, 'O₂ (anode, +)']].forEach(([dx, v, name], i) => {
      const b = [at[0] + dx, at[1], z0], top = [at[0] + dx, at[1], z0 + L];
      const gasH = clamp(v / cap, 0, 1) * (L - 0.06);
      vessel(F, b, [0, 0, 1], [[0, r * 0.6], [0.01, r], [L - 0.03, r], [L - 0.02, r * 0.45], [L, r * 0.45]], { level: L - 0.03 - gasH, tint: '#D5E9F5', alpha: 0.3, seg: 16, bubbles: { n: o.on ? 10 + 30 * (i ? 0.5 : 1) * (o.rate || 1) : 0, ph: o.ph, from: 0.012, size: 0.0007, spread: 0.6 }, marks: [0, 10, 20, 30, 40, 50].map(m => ({ s: L - 0.03 - m / cap * (L - 0.06), text: String(m) })) });
      R3.cylinder(F, top, add(top, [0, 0, 0.025]), 0.0035, '#C9A04A', { segments: 10, shadow: false });    // the stopcock
      R3.cylinder(F, [b[0], b[1], z0 - 0.02], [b[0], b[1], z0 + 0.03], 0.0025, '#D8DCE2', { segments: 8, shadow: false });   // platinum electrode
      R3.label(F, add(top, [0, 0, 0.045]), name, i ? '#FF9C8A' : '#9CD0FF', { size: 9 });
    });
    vessel(F, [at[0], at[1] + 0.012, z0 + 0.04], [0, 0, 1], [[0, 0.004], [0.24, 0.004], [0.26, 0.016], [0.32, 0.016]], { level: 0.27, tint: '#D5E9F5', alpha: 0.3, seg: 16 });
    R3.cylinder(F, [at[0] - gx, at[1], z0 + 0.03], [at[0] + gx, at[1], z0 + 0.03], 0.005, '#E6EEF5', { segments: 10, shadow: false, ambient: 0.7 });
    return { topH: [at[0] - gx, at[1], z0 + L], topO: [at[0] + gx, at[1], z0 + L] };
  }

  /* ============================================================
     2D — atoms and molecules for the particle cards
     ============================================================ */
  const EL = {
    H: { c: '#F2F4F7', r: 0.55 }, C: { c: '#3E434C', r: 0.82 }, O: { c: '#E0352C', r: 0.78 }, N: { c: '#3A5BE0', r: 0.8 },
    Cl: { c: '#45CF55', r: 1.0 }, Na: { c: '#A562E3', r: 1.02 }, Mg: { c: '#8FC94A', r: 0.95 }, Ca: { c: '#5FC7B0', r: 1.08 },
    Cu: { c: '#CF7B3C', r: 0.92 }, Fe: { c: '#E06A35', r: 0.95 }, S: { c: '#EBCB34', r: 1.0 }, Mn: { c: '#9C7AC7', r: 0.95 },
    Co: { c: '#5C7CE0', r: 0.92 }, K: { c: '#8F40D4', r: 1.1 }, Zn: { c: '#8A90B8', r: 0.92 }
  };
  function atom(ctx, x, y, r, el, q, o) {
    const E = EL[el] || { c: '#9AA', r: 0.8 };
    RX.ball(ctx, x, y, r, E.c, { rim: 0.45, sub: 0.25, shadow: false });
    if (o && o.letters !== false && r >= 6) {
      ctx.save(); ctx.font = mono(Math.max(7, r * 0.85), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = el === 'H' || el === 'S' || el === 'Mg' || el === 'Cl' ? '#1A1E26' : '#FFFFFF'; ctx.fillText(el, x, y + 0.5); ctx.restore();
    }
    if (q) {                                                     // the charge, in a small badge
      ctx.save(); const t = (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−'), bx = x + r * 0.8, by = y - r * 0.8;
      ctx.font = mono(Math.max(7, r * 0.6), 700); const w = ctx.measureText(t).width + 4;
      ctx.fillStyle = q > 0 ? '#FFB547' : '#59B8FF'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - w / 2, by - 6, w, 12, 5); else ctx.rect(bx - w / 2, by - 6, w, 12); ctx.fill();
      ctx.fillStyle = '#081018'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, bx, by + 0.5); ctx.restore();
    }
  }
  function bond(ctx, x0, y0, x1, y1, w, n) {
    ctx.save(); ctx.lineCap = 'round';
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    for (let k = 0; k < (n || 1); k++) { const off = ((n || 1) - 1) * (k / Math.max(1, (n || 1) - 1) - 0.5) * w * 1.5; ctx.strokeStyle = 'rgba(205,214,228,.9)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + nx * off, y0 + ny * off); ctx.lineTo(x1 + nx * off, y1 + ny * off); ctx.stroke(); }
    ctx.restore();
  }


  /* ============================================================
     THE MASS BENCH (7B-2) — a balloon, a bottle, a candle, a beam balance
     ============================================================ */
  /* a party balloon stretched over a neck at `neck`; V mL of gas in it. Empty, it hangs limp to one side. */
  function balloon(F, neck, V, o) {
    o = o || {};
    const col = o.col || '#D2412F';
    R3.cylinder(F, add(neck, [0, 0, -0.012]), add(neck, [0, 0, 0.004]), 0.0185, mix(col, '#000', 0.15), { segments: 20, shadow: false, ambient: 0.45 });
    if (V < 8) {                                                     // limp: a short drooping tube of rubber
      R3.tube(F, [add(neck, [0, 0, 0.004]), add(neck, [0.012, 0, 0.022]), add(neck, [0.03, 0, 0.018]), add(neck, [0.04, 0, 0.0])], 0.009, col, { segments: 10 });
      return add(neck, [0, 0, 0.02]);
    }
    const r = Math.cbrt(3 * V * 1e-6 / (4 * Math.PI)), c = add(neck, [0, 0, 0.012 + r * 0.92]);
    R3.cylinder(F, add(neck, [0, 0, 0.004]), add(neck, [0, 0, 0.014 + r * 0.1]), 0.012 + 0.2 * r, col, { segments: 18, shadow: false, ambient: 0.45 });
    F.push(c, () => {
      const ctx = F.ctx, q = F.cam.project(c); if (!q.ok) return;
      const rp = r * q.s, sx = rp * 0.96, sy = rp * 1.06;
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(sx / rp, sy / rp);
      const g = ctx.createRadialGradient(-rp * 0.35, -rp * 0.4, rp * 0.05, 0, 0, rp);
      g.addColorStop(0, rgba(mix(col, '#FFFFFF', 0.55), 0.95)); g.addColorStop(0.3, rgba(col, 0.9)); g.addColorStop(1, rgba(mix(col, '#200000', 0.55), 0.95));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rp, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-rp * 0.35, -rp * 0.42, rp * 0.16, rp * 0.09, -0.6, 0, TAU); ctx.fill();
      ctx.restore();
    }, 0);
    return add(c, [0, 0, r]);
  }
  /* a 500 mL PET drinks bottle with a screw cap; mL of liquid inside */
  const BOTTLE = [[0, 0.028], [0.004, 0.033], [0.125, 0.033], [0.135, 0.031], [0.168, 0.016], [0.182, 0.0125], [0.196, 0.0125]];
  function petBottle(F, base, mL, o) {
    o = Object.assign({ seg: 30, glassFill: 'rgba(205,232,245,.16)' }, o || {});
    o.level = mL > 0 ? levelFor(BOTTLE, mL * 1e-6, 0.0004) : 0; o.wall = 0.0004;
    vessel(F, base, [0, 0, 1], BOTTLE, o);
    R3.cylinder(F, add(base, [0, 0, 0.192]), add(base, [0, 0, 0.21]), 0.0145, o.cap || '#2F6FD0', { segments: 22, shadow: false, ambient: 0.5 });
    return add(base, [0, 0, 0.21]);
  }
  /* a candle of radius r and height h (what is left), its wick and flame */
  function candle(F, base, r, h, o) {
    o = o || {};
    R3.cylinder(F, base, add(base, [0, 0, h]), r, o.col || '#F3EEDF', { segments: 26, ambient: 0.55, shadowK: 0.6 });
    const top = add(base, [0, 0, h]);
    R3.cylinder(F, top, add(top, [0, 0, 0.008]), 0.0008, '#2A2420', { segments: 6, shadow: false });
    if (!o.lit) return top;
    const at = add(top, [0, 0, 0.02]);
    F.push(at, () => {
      const ctx = F.ctx, b = F.cam.project(add(top, [0, 0, 0.006])), t = F.cam.project(add(top, [0, 0, 0.042])); if (!b.ok || !t.ok) return;
      const w = 0.0055 * b.s, fl = Math.sin((o.ph || 0) * 11) * 1.2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(b.x, (b.y + t.y) / 2, 0, b.x, (b.y + t.y) / 2, (b.y - t.y) * 1.4);
      halo.addColorStop(0, 'rgba(255,200,110,.35)'); halo.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = halo; ctx.fillRect(b.x - 200, t.y - 200, 400, 400);
      ctx.beginPath(); ctx.moveTo(b.x - w, b.y); ctx.bezierCurveTo(b.x - w * 1.3, b.y - (b.y - t.y) * 0.5, t.x - w * 0.3 + fl, t.y + 4, t.x + fl, t.y); ctx.bezierCurveTo(t.x + w * 0.3 + fl, t.y + 4, b.x + w * 1.3, b.y - (b.y - t.y) * 0.5, b.x + w, b.y); ctx.closePath();
      const g = ctx.createLinearGradient(0, b.y, 0, t.y); g.addColorStop(0, 'rgba(90,130,255,.9)'); g.addColorStop(0.18, 'rgba(255,190,90,.95)'); g.addColorStop(0.7, 'rgba(255,230,140,.85)'); g.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }, -0.03);
    return top;
  }
  /* the equal-arm balance: a pillar, a beam tipped by angle (positive: the right pan goes down), two pans on
     their hangers. Returns where each pan's floor is, for what is put on it. */
  function beamBalance(F, at, ang, o) {
    o = o || {};
    const L = o.arm || 0.16, H = o.h || 0.26, brass = '#C9A04A', steel = '#B9C2CE';
    R3.box(F, [at[0], at[1], 0.01], [0.24, 0.1, 0.02], '#2C3445', { ambient: 0.4 });
    R3.cylinder(F, [at[0], at[1], 0.02], [at[0], at[1], H], 0.009, steel, { segments: 16, shadow: false });
    const piv = [at[0], at[1], H + 0.006], c = Math.cos(ang), s = Math.sin(ang);
    const ends = [-1, 1].map(k => [piv[0] + k * L * c, piv[1], piv[2] - k * L * s]);
    R3.box(F, piv, [2 * L + 0.02, 0.008, 0.012], brass, { ambient: 0.5, axes: [[c, 0, -s], [0, 1, 0], [s, 0, c]], shadow: false });
    R3.sphere(F, piv, 0.009, '#7C838F', { shadow: false });
    // the pointer, and a scale it swings over
    R3.cylinder(F, piv, [piv[0] + Math.sin(ang) * 0.14, piv[1] - 0.006, piv[2] - Math.cos(ang) * 0.14], 0.0018, '#D8302A', { segments: 6, shadow: false });
    R3.box(F, [at[0], at[1] - 0.006, H - 0.14], [0.06, 0.004, 0.014], '#ECEEF0', { shadow: false, ambient: 0.7 });
    const pans = ends.map(e => {
      const pz = Math.max(0.05, e[2] - 0.15), pc = [e[0], e[1], pz];
      [0, 1, 2].forEach(k => { const a = k / 3 * TAU + 0.3; R3.polyline(F, [e, [pc[0] + 0.05 * Math.cos(a), pc[1] + 0.05 * Math.sin(a), pz]], '#C7CDD4', { width: 1, alpha: 0.9 }); });
      R3.cylinder(F, [pc[0], pc[1], pz - 0.004], [pc[0], pc[1], pz], 0.058, steel, { segments: 30, shadow: false, ambient: 0.55 });
      return pc;
    });
    return { L: pans[0], R: pans[1] };
  }
  /* a plug of cotton wool in a neck */
  function cottonPlug(F, at) { for (let k = 0; k < 5; k++) R3.sphere(F, add(at, [0.006 * Math.cos(k * 1.3), 0.006 * Math.sin(k * 1.3), 0.004 * (k % 2)]), 0.009, '#F4F4F0', { shadow: false }); }
  /* atom-level events, as in the particle cards: T.at = [[el, xR, yR, qR, xP, yP, qP], …], bonds bR/bP */
  function events(ctx, box, T, xi, ph, o) {
    o = o || {};
    const N = o.n || 4, cols = N > 4 ? 3 : N > 1 ? 2 : 1, rows = Math.ceil(N / cols), cw = box.w / cols, chh = box.h / rows, s = Math.min(cw / 8.2, chh / 6.6) * (o.k || 1);
    const ease = u => u * u * (3 - 2 * u);
    for (let k = 0; k < N; k++) {
      const cx = box.x + (k % cols + 0.5) * cw, cy = box.y + (Math.floor(k / cols) + 0.5) * chh;
      const u = ease(clamp(xi * N - k, 0, 1)), j = (a, b) => Math.sin(ph * (2.1 + 0.37 * ((a * 7 + k * 3) % 5)) + b) * 0.12;
      const pos = T.at.map((a, i) => ({ el: a[0], x: cx + s * (a[1] + (a[4] - a[1]) * u + j(i, 1)), y: cy + s * (a[2] + (a[5] - a[2]) * u + j(i, 2)), q: u < 0.5 ? a[3] : a[6] }));
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * Math.abs(u - 0.5) * 2;
      (u < 0.5 ? T.bR : T.bP).forEach(([a, b]) => bond(ctx, pos[a].x, pos[a].y, pos[b].x, pos[b].y, Math.max(1.5, s * 0.22)));
      ctx.restore();
      pos.slice().sort((a, b) => a.y - b.y).forEach(q => atom(ctx, q.x, q.y, s * EL[q.el].r * 0.92, q.el, q.q, { letters: s * 0.9 >= 6 }));
    }
  }

  window.G7B = { vessel, volumeTo, levelFor, interpR, FLASK, flask, flaskLevel, tube, tubeProf, rack, watchGlass, dish, bunsen, tripod, clampArm, stand,
    gasSyringe, hose, bung, splint, pipette, reagent, heap, crystals, ribbon, wool, lumps, magnet, crossCard, crucible, glare, hofmann,
    balloon, BOTTLE, petBottle, candle, beamBalance, cottonPlug, events,
    EL, atom, bond, hull2, mono, sans, mix, rgba, rng, clamp };
})();
