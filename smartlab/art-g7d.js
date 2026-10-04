/* ============================================================
   G7D — the living things of Grade 7 Unit D (Matter and Energy in
   Ecosystems), drawn from their anatomy, at the scale a lab shows them.

   Lab organisms: duckweed (Lemna minor) fronds budding daughters from
   their pockets, going pale when starved of nitrogen; three Paramecium
   species as Gause cultured them — P. aurelia, P. caudatum with its
   pointed tail, P. bursaria green with its algae — with cilia beating in
   metachronal waves, the oral groove, macro- and micronucleus, star-shaped
   contractile vacuoles and food vacuoles; budding brewer's yeast; rod
   bacteria.
   Field organisms: reindeer (Rangifer tarandus) side-on, both sexes with
   antlers, the pale neck and rump, broad hooves, ribs showing when they
   starve; reindeer lichen (Cladonia) in its branching cushions; the
   island tundra as a landscape plate.
   Everything is drawn at the size and pose a lab computed; nothing here
   computes science.
   ============================================================ */
(function () {
  'use strict';
  const RX = window.RX, R3 = window.R3;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => RX.mix(a, b, clamp(t, 0, 1)), rgba = (c, a) => RX.rgba(c, a);
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';

  /* ---------------- a scale bar ---------------- */
  function scaleBar(ctx, x, y, w, text, col) {
    ctx.save(); ctx.strokeStyle = col || '#E8EEF8'; ctx.fillStyle = col || '#E8EEF8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.moveTo(x + w, y - 4); ctx.lineTo(x + w, y + 4); ctx.stroke();
    ctx.font = mono(10, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.8)';
    ctx.strokeText(text, x + w / 2, y - 5); ctx.fillText(text, x + w / 2, y - 5); ctx.restore();
  }
  /* a leader-line label: from the structure (ax, ay) to the text at (tx, ty) */
  function leader(ctx, ax, ay, tx, ty, text, col, align) {
    ctx.save(); ctx.strokeStyle = 'rgba(214,226,244,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = '#DCE6F6'; ctx.beginPath(); ctx.arc(ax, ay, 1.8, 0, TAU); ctx.fill();
    ctx.font = mono(10, 600); ctx.textBaseline = 'middle'; ctx.textAlign = align || (tx < ax ? 'right' : 'left');
    const dx = ctx.textAlign === 'right' ? -3 : 3;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(text, tx + dx, ty);
    ctx.fillStyle = col || '#DCE6F6'; ctx.fillText(text, tx + dx, ty); ctx.restore();
  }

  /* ============================================================
     DUCKWEED — Lemna minor, from above. A frond is a flattened stem-leaf
     with three faint nerves; daughters grow out of two pockets at its
     base and stay attached until they are full size. x, y: the mother's
     centre; s: her length px; ang: her heading; o.n daughters (0..3),
     o.age 0..1 of the youngest; o.chl 1 green … 0 chlorotic (N-starved)
     ============================================================ */
  function lemna(ctx, x, y, s, ang, o) {
    o = o || {};
    const chl = clamp(o.chl == null ? 1 : o.chl, 0, 1);
    const green = mix('#C8C860', '#3E9A2E', chl), dark = mix('#8A8A3A', '#1F5E1A', chl);
    const frond = (cx, cy, L, a, k) => {
      const W = L * 0.68;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      const path = c => { c.moveTo(L * 0.5, 0); c.bezierCurveTo(L * 0.5, W * 0.55, -L * 0.25, W * 0.62, -L * 0.48, W * 0.12); c.quadraticCurveTo(-L * 0.54, 0, -L * 0.48, -W * 0.12); c.bezierCurveTo(-L * 0.25, -W * 0.62, L * 0.5, -W * 0.5, L * 0.5, 0); c.closePath(); };
      if (L > 7) RX.body(ctx, path, { fill: mix(green, '#F2F0A0', k * 0.15), r: L * 0.5, ao: 0.25, rim: 0.5, stipple: 0.2, grain: dark, contour: 0.8, shadow: o.shadow == null ? 0.25 : o.shadow });
      else { ctx.fillStyle = green; ctx.beginPath(); path(ctx); ctx.fill(); }
      if (L > 9) {
        ctx.strokeStyle = rgba(dark, 0.35); ctx.lineWidth = Math.max(0.5, L * 0.025);
        ctx.beginPath(); ctx.moveTo(-L * 0.38, 0); ctx.quadraticCurveTo(L * 0.05, 0, L * 0.38, 0);
        ctx.moveTo(-L * 0.38, 0); ctx.quadraticCurveTo(0, W * 0.2, L * 0.3, W * 0.12);
        ctx.moveTo(-L * 0.38, 0); ctx.quadraticCurveTo(0, -W * 0.2, L * 0.3, -W * 0.12); ctx.stroke();
        // the node, where the root hangs down and the daughters bud
        ctx.fillStyle = rgba('#F8F4C8', 0.5); ctx.beginPath(); ctx.ellipse(-L * 0.3, 0, L * 0.06, L * 0.05, 0, 0, TAU); ctx.fill();
        // air spaces (aerenchyma) that float it, glinting
        ctx.fillStyle = 'rgba(255,255,240,.18)';
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(L * (0.05 + 0.07 * i) - L * 0.1, (i % 2 ? 1 : -1) * W * 0.18, L * 0.04, L * 0.025, 0, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    };
    const n = o.n == null ? 2 : o.n, age = o.age == null ? 0.6 : o.age;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // daughters from the two pockets, the older one larger
    for (let k = n - 1; k >= 0; k--) {
      const side = k % 2 ? -1 : 1, g = k === n - 1 ? age : Math.min(1, age + 0.5 * (n - 1 - k)), L = s * (0.35 + 0.55 * g);
      const a = ang + Math.PI + side * (0.6 + 0.25 * k);
      const bx = x - ca * s * 0.32, by = y - sa * s * 0.32;
      frond(bx + Math.cos(a) * L * 0.45, by + Math.sin(a) * L * 0.45, L, a, k + 1);
    }
    frond(x, y, s, ang, 0);
  }
  /* one root hanging under a frond, seen side-on, with its root cap */
  function lemnaRoot(ctx, x, y, len, col) {
    ctx.save(); ctx.strokeStyle = col || 'rgba(230,236,220,.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len * 0.05, y + len * 0.5, x - len * 0.02, y + len); ctx.stroke();
    ctx.fillStyle = 'rgba(200,160,120,.8)'; ctx.beginPath(); ctx.ellipse(x - len * 0.02, y + len, 1.4, 2.4, 0, 0, TAU); ctx.fill(); ctx.restore();
  }

  /* ============================================================
     PARAMECIUM — the slipper animalcule. sp: 'aurelia' (≈120 µm, blunt
     behind, two micronuclei), 'caudatum' (≈220 µm, the pointed 'tail'),
     'bursaria' (≈110 µm, broad, green with Chlorella). x, y: centre;
     L: length px; ang: heading; t: time (cilia beat, vacuoles fill).
     ============================================================ */
  const PARA = {
    aurelia: { w: 0.37, tail: 0.0, body: '#CBC2A4', nuc: '#A89C7A', green: 0 },
    caudatum: { w: 0.33, tail: 0.35, body: '#C8BCA0', nuc: '#A08E6E', green: 0 },
    bursaria: { w: 0.5, tail: 0.0, body: '#A8C88A', nuc: '#8C9A6A', green: 1 }
  };
  function paraOutline(sp, L) {
    const P = PARA[sp] || PARA.aurelia, W = L * P.w, pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40 * TAU, cx = Math.cos(u), sy = Math.sin(u);
      // the front is rounded, the back blunt or drawn into a point; the oral groove dents one side
      let x = cx * L * 0.5, y = sy * W * 0.5 * (1 - 0.18 * Math.max(0, -cx));
      if (cx < 0) x *= 1 + P.tail * Math.pow(Math.max(0, -cx), 4) * 0.25;
      if (cx < 0) y *= 1 - P.tail * Math.pow(-cx, 3) * 0.5;
      if (sy > 0 && cx > -0.3 && cx < 0.7) y -= W * 0.09 * Math.sin((cx + 0.3) / 1.0 * Math.PI);
      pts.push([x, y]);
    }
    return pts;
  }
  function paramecium(ctx, x, y, L, ang, sp, t, o) {
    o = o || {};
    const P = PARA[sp] || PARA.aurelia, W = L * P.w, pts = paraOutline(sp, L), seed = o.seed || 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const path = c => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
    if (L < 10) { ctx.fillStyle = P.body; ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore(); return; }
    // cilia: a fringe beating in metachronal waves that travel back along the body
    if (L > 22) {
      ctx.strokeStyle = 'rgba(226,230,214,.55)'; ctx.lineWidth = Math.max(0.5, L * 0.006);
      ctx.beginPath();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], nx = b[1] - a[1], ny = -(b[0] - a[0]), nl = Math.hypot(nx, ny) || 1;
        for (let k = 0; k < 2; k++) {
          const fx = a[0] + (b[0] - a[0]) * k / 2, fy = a[1] + (b[1] - a[1]) * k / 2;
          const ph = Math.sin(t * 18 - (i + k / 2) * 0.9), len = L * 0.035;
          ctx.moveTo(fx, fy); ctx.lineTo(fx + nx / nl * len - ph * len * 0.6 * (b[0] - a[0]) / nl * 1.0, fy + ny / nl * len - ph * len * 0.6 * (b[1] - a[1]) / nl);
        }
      }
      ctx.stroke();
    }
    RX.body(ctx, path, { fill: P.body, r: L * 0.42, squash: P.w, ao: 0.12, rim: 0.6, stipple: 0.3, grain: "#7A7458", contour: 0.9, shadow: 0 });
    // pellicle: rows of the ciliary bases, as faint diagonal striations
    if (L > 40) {
      ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
      ctx.strokeStyle = 'rgba(120,112,86,.18)'; ctx.lineWidth = 0.6;
      for (let k = -14; k <= 14; k++) { ctx.beginPath(); ctx.moveTo(-L * 0.6 + k * L * 0.05, -W); ctx.quadraticCurveTo(k * L * 0.05, 0, L * 0.1 + k * L * 0.05, W); ctx.stroke(); }
      ctx.restore();
    }
    // the green algae in bursaria
    const r = rng(seed * 97 + 3);
    if (P.green) {
      for (let i = 0; i < Math.min(140, Math.round(L * 0.9)); i++) {
        const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 0.8) continue;
        ctx.fillStyle = r() < 0.5 ? '#3E9A36' : '#58B248'; ctx.beginPath(); ctx.arc(u * L * 0.42, v * W * 0.4, Math.max(0.8, L * 0.022), 0, TAU); ctx.fill();
      }
    }
    // oral groove sweeping to the mouth (cytostome), with the gullet
    ctx.strokeStyle = 'rgba(96,84,60,.6)'; ctx.lineWidth = Math.max(0.7, L * 0.012);
    ctx.beginPath(); ctx.moveTo(L * 0.42, W * 0.12); ctx.quadraticCurveTo(L * 0.15, W * 0.36, -L * 0.02, W * 0.14); ctx.stroke();
    ctx.fillStyle = 'rgba(110,96,70,.45)'; ctx.beginPath(); ctx.ellipse(-L * 0.04, W * 0.1, L * 0.05, W * 0.08, 0.5, 0, TAU); ctx.fill();
    // food vacuoles, darker the older (digested bacteria)
    for (let i = 0; i < 7; i++) {
      const fx = (r() - 0.5) * L * 0.6, fy = (r() - 0.5) * W * 0.5, fr = L * (0.025 + 0.02 * r());
      ctx.fillStyle = rgba(P.green ? '#6A7A4A' : '#9A7A58', 0.35 + 0.3 * r()); ctx.beginPath(); ctx.arc(fx, fy, fr, 0, TAU); ctx.fill();
    }
    // macronucleus (bean) and micronucleus(-i)
    ctx.fillStyle = rgba(P.nuc, 0.75); ctx.strokeStyle = rgba('#5A5038', 0.6); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(-L * 0.02, -W * 0.06, L * 0.14, W * 0.17, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba('#5A5038', 0.8);
    ctx.beginPath(); ctx.arc(L * 0.1, -W * 0.18, Math.max(0.8, L * 0.018), 0, TAU); ctx.fill();
    if (sp === 'aurelia') { ctx.beginPath(); ctx.arc(L * 0.12, -W * 0.05, Math.max(0.8, L * 0.016), 0, TAU); ctx.fill(); }
    // two contractile vacuoles, each a star of radiating canals; they fill and empty out of phase
    [[L * 0.28, -W * 0.08, 0], [-L * 0.3, -W * 0.06, Math.PI]].forEach(([vx, vy, ph]) => {
      const f = 0.5 + 0.5 * Math.sin(t * 2.6 + ph), rv = L * (0.02 + 0.04 * f);
      ctx.strokeStyle = 'rgba(236,244,250,.55)'; ctx.lineWidth = Math.max(0.6, L * 0.008);
      ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.moveTo(vx + Math.cos(a) * rv, vy + Math.sin(a) * rv * 0.8); ctx.lineTo(vx + Math.cos(a) * (rv + L * 0.06 * (1 - f * 0.5)), vy + Math.sin(a) * (rv + L * 0.06) * 0.7); } ctx.stroke();
      ctx.fillStyle = 'rgba(236,246,252,.7)'; ctx.beginPath(); ctx.arc(vx, vy, rv, 0, TAU); ctx.fill();
    });
    // trichocysts under the pellicle
    if (L > 60) { ctx.save(); ctx.beginPath(); path(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(150,140,110,.25)'; ctx.lineWidth = 0.6; ctx.beginPath(); pts.forEach(([px, py], i) => { if (i % 2) return; ctx.moveTo(px * 0.93, py * 0.88); ctx.lineTo(px * 0.86, py * 0.76); }); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  /* rod-shaped bacteria (the Paramecia's food) and yeast cells, as specks in the field */
  function bacteria(ctx, x, y, n, R, seed, col) {
    const r = rng(seed || 7); ctx.save(); ctx.strokeStyle = col || 'rgba(120,110,80,.55)'; ctx.lineCap = 'round'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, o = r() * TAU; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(o) * 2.6, py + Math.sin(o) * 2.6); }
    ctx.stroke(); ctx.restore();
  }
  /* brewer's yeast: an ovoid cell with its vacuole, bud scars and (o.bud 0..1) a daughter budding */
  function yeast(ctx, x, y, rr, ang, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    RX.blob(ctx, 0, 0, rr, rr * 0.82, { fill: '#E6D6A8', r: rr, ao: 0.3, rim: 0.6, stipple: 0.2, contour: 0.8, shadow: 0.1 });
    if (rr > 5) {
      ctx.fillStyle = 'rgba(244,240,226,.65)'; ctx.beginPath(); ctx.ellipse(-rr * 0.15, rr * 0.05, rr * 0.38, rr * 0.32, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(150,120,70,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(-rr * 0.55, -rr * 0.35, rr * 0.12, 0, TAU); ctx.stroke();
    }
    if (o.bud) { const br = rr * (0.3 + 0.55 * o.bud); RX.blob(ctx, rr + br * 0.75, 0, br, br * 0.85, { fill: '#EADCB0', r: br, ao: 0.3, rim: 0.6, contour: 0.8 }); }
    ctx.restore();
  }
  /* a round microscope field: dark rim, lit disc, the caller draws inside clip(fn) */
  function field(ctx, cx, cy, R, fn, o) {
    o = o || {};
    ctx.save();
    const g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, R * 0.1, cx, cy, R);
    g.addColorStop(0, o.light || '#F4F0DE'); g.addColorStop(0.75, o.mid || '#E2DCC2'); g.addColorStop(1, o.edge || '#9A9478');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); fn(ctx); ctx.restore();
    const v = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = v; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0A0D14'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,176,200,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  /* a haemocytometer's counting grid (Neubauer): 1 mm squares split into 0.2 mm, the centre into 0.05 mm */
  function haemo(ctx, cx, cy, s, fine) {
    ctx.save(); ctx.strokeStyle = 'rgba(70,80,96,.55)';
    const n = fine ? 5 : 4;
    for (let i = 0; i <= n; i++) { ctx.lineWidth = i % n === 0 ? 1.6 : 0.8; const v = -s / 2 + i * s / n;
      ctx.beginPath(); ctx.moveTo(cx - s / 2, cy + v); ctx.lineTo(cx + s / 2, cy + v); ctx.moveTo(cx + v, cy - s / 2); ctx.lineTo(cx + v, cy + s / 2); ctx.stroke();
      if (i < n) { ctx.lineWidth = 0.4; for (let k = 1; k < 4; k++) { const w = v + k * s / n / 4; ctx.beginPath(); ctx.moveTo(cx - s / 2, cy + w); ctx.lineTo(cx + s / 2, cy + w); ctx.moveTo(cx + w, cy - s / 2); ctx.lineTo(cx + w, cy + s / 2); ctx.stroke(); } } }
    ctx.restore();
  }

  /* ============================================================
     REINDEER — Rangifer tarandus, side-on. x, y: where the hooves stand
     (mid-body); s: body length px (nose to rump ≈ 1.6 s); dir +1 faces
     right; o.sex 'f' | 'm' (bulls carry big antlers, cows smaller ones —
     the only deer whose females grow them); o.cond 1 fat … 0 starving
     (the ribs and hips show); o.phase: stride; o.calf; o.snow: dusting.
     ============================================================ */
  /* a quadruped's lower leg as one shaped piece — forearm or gaskin, the knee or hock, the cannon,
     the fetlock, the pastern and a broad cloven hoof — pivoting at (px, py) by ang; pts in units of
     H measured down from the pivot (x forward) */
  const FORE = { f: [[0.05, -0.04], [0.048, 0.22], [0.055, 0.27], [0.04, 0.32], [0.03, 0.42], [0.042, 0.47], [0.075, 0.53], [0.085, 0.555]], b: [[-0.03, 0.555], [-0.025, 0.52], [-0.038, 0.47], [-0.026, 0.37], [-0.04, 0.3], [-0.045, 0.22], [-0.06, 0.04], [-0.08, -0.04]] };
  const HIND = { f: [[0.07, -0.06], [0.04, 0.06], [0.025, 0.15], [0.022, 0.43], [0.035, 0.49], [0.07, 0.555], [0.08, 0.58]], b: [[-0.03, 0.58], [-0.025, 0.545], [-0.04, 0.49], [-0.03, 0.2], [-0.075, 0.13], [-0.065, 0.06], [-0.095, -0.06]] };
  function shapedLeg(ctx, L, px, py, H, ang, fill, edge, hoof) {
    const c = Math.cos(ang), s = Math.sin(ang), T = q => [px + (q[0] * c - q[1] * s) * H, py + (q[0] * s + q[1] * c) * H];
    const F = L.f.map(T), B = L.b.map(T);
    const g = ctx.createLinearGradient(F[2][0] - H * 0.06, 0, F[2][0] + H * 0.06, 0);
    g.addColorStop(0, mix(fill, '#FFFFFF', 0.12)); g.addColorStop(0.5, fill); g.addColorStop(1, mix(fill, '#05080F', 0.35));
    ctx.fillStyle = g; ctx.strokeStyle = edge; ctx.lineWidth = Math.max(0.7, H * 0.008); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(F[0][0], F[0][1]);
    for (let i = 1; i < F.length; i++) { const a = F[i - 1], b = F[i]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.lineTo(F[F.length - 1][0], F[F.length - 1][1]);
    for (let i = 0; i < B.length; i++) { const b = B[i]; if (i === 0) ctx.lineTo(b[0], b[1]); else { const a = B[i - 1]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } }
    ctx.lineTo(B[B.length - 1][0], B[B.length - 1][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the pale band above the hoof, and the hoof itself (two toes, dark keratin)
    const n = F.length, fl = F[n - 3], bl = B[2];
    ctx.strokeStyle = 'rgba(240,236,226,.75)'; ctx.lineWidth = Math.max(1, H * 0.03); ctx.beginPath(); ctx.moveTo(fl[0], fl[1]); ctx.lineTo(bl[0], bl[1]); ctx.stroke();
    const h0 = F[n - 1], h1 = B[0];
    ctx.fillStyle = hoof; ctx.beginPath(); ctx.moveTo(F[n - 2][0], F[n - 2][1]); ctx.lineTo(h0[0] + H * 0.012, h0[1]); ctx.lineTo(h1[0] - H * 0.01, h1[1]); ctx.lineTo(B[1][0], B[1][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,80,70,.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo((h0[0] + h1[0]) / 2, h0[1]); ctx.lineTo((F[n - 2][0] + B[1][0]) / 2, (F[n - 2][1] + B[1][1]) / 2); ctx.stroke();
  }
  function fur(ctx, path, x0, y0, x1, y1, H, col, n, seed) {
    const r = rng(seed || 3); ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.5, H * 0.006); ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), l = H * (0.02 + 0.02 * r()); ctx.moveTo(x, y); ctx.lineTo(x - l * 0.8, y + l * 0.5); }
    ctx.stroke(); ctx.restore();
  }
  /* REINDEER — x, y where the hooves stand (mid-body), s the shoulder height px, dir +1 facing right.
     Proportions of Rangifer tarandus: trunk ≈ 1.3 × the shoulder height, chest half of it, short stout
     legs, the head carried low and forward. */
  function reindeer(ctx, x, y, s, dir, o) {
    o = o || {};
    const cond = clamp(o.cond == null ? 1 : o.cond, 0, 1), ph = o.phase || 0, calf = !!o.calf;
    const H = s * (calf ? 0.6 : 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(dir < 0 ? -1 : 1, 1);
    const coat = mix('#5E4C3C', o.winter ? '#A4948A' : '#8A7058', 0.3 + 0.7 * cond), pale = '#EEE8DC';
    const legC = mix(coat, '#2A2018', 0.35), edge = rgba(mix(coat, '#05080F', 0.75), 1), hoof = '#1A1612';
    const P = (u, v) => [u * H, v * H];
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(-H * 0.12, 1, H * 0.62, H * 0.06, 0, 0, TAU); ctx.fill();
    const sw = k => Math.sin(ph + k) * 0.16;
    // far legs first, darker
    shapedLeg(ctx, HIND, -H * 0.56, -H * 0.58, H, sw(0.4), mix(legC, '#0E0C0A', 0.35), edge, hoof);
    shapedLeg(ctx, FORE, H * 0.26, -H * 0.55, H, sw(Math.PI + 0.4), mix(legC, '#0E0C0A', 0.35), edge, hoof);
    // the near legs too, their tops hidden under the body's own muscle
    shapedLeg(ctx, HIND, -H * 0.48, -H * 0.58, H, sw(Math.PI + 0.4), legC, edge, hoof);
    shapedLeg(ctx, FORE, H * 0.34, -H * 0.55, H, sw(0.4), legC, edge, hoof);
    const tuck = (1 - cond) * 0.06, sag = (1 - cond) * 0.03;
    const torso = c => {
      const m = (a, b) => c.moveTo(...P(a, b)), q = (a, b, d, e) => c.quadraticCurveTo(...P(a, b), ...P(d, e)), b3 = (a, b, d, e, f, g) => c.bezierCurveTo(...P(a, b), ...P(d, e), ...P(f, g));
      m(0.36, -1.0);
      b3(0.1, -0.98 + sag, -0.3, -0.97 + sag, -0.58, -0.95);           // back and loin to the croup
      q(-0.70, -0.93, -0.75, -0.80);                                     // rump
      b3(-0.79, -0.68, -0.72, -0.58, -0.64, -0.52);                      // the rear of the thigh
      q(-0.50, -0.50 - tuck * 0.3, -0.40, -0.52 + tuck);                 // flank fold
      b3(-0.15, -0.48 + tuck, 0.12, -0.47 + tuck * 0.5, 0.26, -0.50);    // belly
      b3(0.40, -0.52, 0.52, -0.60, 0.55, -0.76);                         // brisket and point of shoulder
      q(0.56, -0.90, 0.36, -1.0); c.closePath();
    };
    RX.body(ctx, torso, { fill: coat, r: H * 0.62, cx: -H * 0.12, cy: -H * 0.75, squash: 0.5, ao: 0.16, rim: 0.4, stipple: 0.25, grain: mix(coat, '#1A1410', 0.6), contour: Math.max(1, H * 0.01), contourColour: edge, shadow: 0 });
    ctx.save(); ctx.beginPath(); torso(ctx); ctx.clip();
    // muscle masses: the shoulder blade and the haunch, as soft shading
    const sh = (cx, cy, rx, ry, a, al) => { const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 1, cx, cy, Math.max(rx, ry)); g.addColorStop(0, rgba('#FFFFFF', al)); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, a, 0, TAU); ctx.fill(); };
    sh(...P(0.34, -0.78), H * 0.18, H * 0.25, -0.4, 0.14); sh(...P(-0.55, -0.76), H * 0.2, H * 0.22, 0.3, 0.12);
    ctx.strokeStyle = rgba(mix(coat, '#05080F', 0.6), 0.45); ctx.lineWidth = Math.max(0.7, H * 0.008);
    ctx.beginPath(); ctx.moveTo(...P(0.45, -0.95)); ctx.quadraticCurveTo(...P(0.24, -0.78), ...P(0.24, -0.56)); ctx.stroke();      // the shoulder's rear edge
    ctx.beginPath(); ctx.moveTo(...P(-0.36, -0.88)); ctx.quadraticCurveTo(...P(-0.40, -0.70), ...P(-0.46, -0.54)); ctx.stroke();   // the stifle line
    ctx.fillStyle = rgba(pale, 0.55); ctx.beginPath(); ctx.ellipse(...P(-0.1, -0.53), H * 0.42, H * 0.045, 0.02, 0, TAU); ctx.fill();          // pale flank band
    ctx.fillStyle = rgba('#F6F2EA', 0.95); ctx.beginPath(); ctx.ellipse(...P(-0.73, -0.82), H * 0.07, H * 0.13, 0.15, 0, TAU); ctx.fill();    // white rump patch
    fur(ctx, torso, -H * 0.8, -H * 1.0, H * 0.6, -H * 0.45, H, rgba(mix(coat, '#05080F', 0.5), 0.3), 160, 5);
    if (cond < 0.6) {
      const a = (0.6 - cond) / 0.6;
      ctx.strokeStyle = rgba('#1E1610', 0.6 * a); ctx.lineWidth = Math.max(0.8, H * 0.012);
      for (let k = 0; k < 7; k++) { const rx = 0.16 - k * 0.07; ctx.beginPath(); ctx.moveTo(...P(rx + 0.02, -0.9)); ctx.quadraticCurveTo(...P(rx - 0.04, -0.74), ...P(rx - 0.01, -0.56)); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(...P(-0.52, -0.86), H * 0.06, 0.4, 2.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...P(0.36, -0.98)); ctx.bezierCurveTo(...P(0.1, -0.95), ...P(-0.3, -0.94), ...P(-0.55, -0.92)); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#F6F2EA'; ctx.beginPath(); ctx.ellipse(...P(-0.73, -0.93), H * 0.04, H * 0.065, 0.6, 0, TAU); ctx.fill();          // tail
    // the neck, thick, with the pale mane hanging from the throat
    const neck = c => { c.moveTo(...P(0.30, -0.99)); c.bezierCurveTo(...P(0.48, -1.06), ...P(0.62, -1.12), ...P(0.76, -1.12)); c.lineTo(...P(0.80, -0.96)); c.bezierCurveTo(...P(0.72, -0.86), ...P(0.62, -0.74), ...P(0.52, -0.64)); c.lineTo(...P(0.40, -0.72)); c.closePath(); };
    RX.body(ctx, neck, { fill: mix(coat, '#D6CEC0', 0.5), r: H * 0.26, cx: H * 0.56, cy: -H * 0.95, ao: 0.12, rim: 0.4, stipple: 0.25, contour: Math.max(1, H * 0.01), contourColour: edge });
    ctx.strokeStyle = rgba('#FAF6EE', 0.9); ctx.lineWidth = Math.max(0.8, H * 0.012);
    for (let k = 0; k < 12; k++) { const u = k / 11, ax = 0.78 - u * 0.26, ay = -0.96 + u * 0.3; ctx.beginPath(); ctx.moveTo(...P(ax, ay)); ctx.quadraticCurveTo(...P(ax - 0.02, ay + 0.07), ...P(ax - 0.04, ay + 0.13)); ctx.stroke(); }
    // the head: long, the forehead flat, a broad hairy muzzle
    const head = c => { c.moveTo(...P(0.74, -1.14)); c.bezierCurveTo(...P(0.82, -1.18), ...P(0.95, -1.12), ...P(1.06, -1.04)); c.quadraticCurveTo(...P(1.12, -1.0), ...P(1.10, -0.95)); c.quadraticCurveTo(...P(1.05, -0.92), ...P(0.98, -0.93)); c.bezierCurveTo(...P(0.9, -0.93), ...P(0.82, -0.94), ...P(0.76, -0.98)); c.closePath(); };
    RX.body(ctx, head, { fill: mix(coat, '#3E3226', 0.3), r: H * 0.2, cx: H * 0.92, cy: -H * 1.04, ao: 0.12, rim: 0.45, stipple: 0.2, contour: Math.max(1, H * 0.01), contourColour: edge });
    ctx.fillStyle = '#E2DACC'; ctx.beginPath(); ctx.ellipse(...P(1.05, -0.97), H * 0.06, H * 0.05, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2A221A'; ctx.beginPath(); ctx.ellipse(...P(1.095, -0.985), H * 0.016, H * 0.01, 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#120E0A'; ctx.beginPath(); ctx.arc(...P(0.86, -1.08), Math.max(1, H * 0.018), 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(...P(0.855, -1.085), Math.max(0.4, H * 0.006), 0, TAU); ctx.fill();
    ctx.fillStyle = mix(coat, '#2A2018', 0.2); ctx.beginPath(); ctx.ellipse(...P(0.74, -1.14), H * 0.035, H * 0.07, -1.0, 0, TAU); ctx.fill();
    // antlers — both sexes; the bull's beam sweeps back, up and forward to a palmate top, the brow tine a shovel over the face
    if (!calf) {
      const big = o.sex === 'm' ? 1 : 0.55, b0 = [0.80, -1.16], col = '#D4C4A4';
      const beam = far => {
        const k = far ? 0.92 : 1, dx = far ? -0.04 : 0, c = far ? mix(col, '#3A3024', 0.35) : col;
        const pts = [b0, [b0[0] - 0.12 * big + dx, b0[1] - 0.22 * big * k], [b0[0] - 0.14 * big + dx, b0[1] - 0.48 * big * k], [b0[0] + 0.0 * big + dx, b0[1] - 0.70 * big * k], [b0[0] + 0.14 * big + dx, b0[1] - 0.78 * big * k]].map(q => P(q[0], q[1]));
        RX.tube(ctx, pts, i => Math.max(0.7, H * 0.022 * Math.sqrt(big) * (1 - i * 0.15)), c, { vivid: false });
        [[1, 0.14, -0.06], [2, 0.16, -0.04], [3, 0.12, -0.12], [4, 0.08, -0.1]].forEach(([i, lx, ly]) => { const a = pts[i]; RX.tube(ctx, [a, [a[0] + H * lx * big, a[1] + H * ly * big]], Math.max(0.6, H * 0.012 * Math.sqrt(big)), c, { vivid: false }); });
        if (!far) {
          const a = P(b0[0], b0[1] - 0.04);
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(a[0] + H * 0.1 * big, a[1] - H * 0.05, a[0] + H * 0.2 * big, a[1] + H * 0.02); ctx.lineTo(a[0] + H * 0.17 * big, a[1] + H * 0.06); ctx.quadraticCurveTo(a[0] + H * 0.08 * big, a[1] + H * 0.01, a[0], a[1] + H * 0.03); ctx.fill();
          ctx.strokeStyle = rgba('#3A3024', 0.6); ctx.lineWidth = 0.8; ctx.stroke();
        }
      };
      beam(true); beam(false);
    }
    if (o.snow) { ctx.fillStyle = 'rgba(248,252,255,.85)'; ctx.beginPath(); ctx.ellipse(...P(-0.12, -0.97), H * 0.42, H * 0.03, 0, Math.PI, TAU); ctx.fill(); }
    ctx.restore();
  }

  /* ============================================================
     REINDEER LICHEN — Cladonia rangiferina: hollow grey-green stalks
     branching in threes into a springy cushion. x, y: base centre; w: width;
     h: height px (its thickness, which grazing removes); o.seed; o.wet
     ============================================================ */
  function lichen(ctx, x, y, w, h, o) {
    o = o || {};
    if (h < 0.8) return;
    const r = rng(o.seed || 11), n = Math.max(3, Math.round(w / Math.max(2, h * 0.5)));
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const bx = x - w / 2 + (i + r()) / n * w, hh = h * (0.7 + 0.3 * r());
      const branch = (px, py, a, len, d) => {
        const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len;
        ctx.strokeStyle = mix('#8E9A84', '#D8E0CC', d / 3 + r() * 0.15); ctx.lineWidth = Math.max(0.5, h * 0.06 * (1 - d * 0.25));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
        if (d < 3 && len > 1.2) { const spread = 0.45; branch(ex, ey, a - spread, len * 0.66, d + 1); branch(ex, ey, a + spread * 0.2, len * 0.62, d + 1); if (d < 1) branch(ex, ey, a + spread, len * 0.6, d + 1); }
      };
      branch(bx, y, -Math.PI / 2 + (r() - 0.5) * 0.5, hh * 0.42, 0);
    }
    ctx.restore();
  }

  /* ============================================================
     THE ISLAND — a tundra plate: sky, the Bering Sea, rolling hills whose
     ground colour follows the lichen left (pale grey-green cushions when
     untouched, brown sedge and bare peat when grazed out), and snow lying
     to o.snow (0..1). rect [x, y, w, h]; o.lichen 0..1; o.seed.
     Returns the ground line y(x) so the herd can stand on it.
     ============================================================ */
  function tundra(ctx, rect, o) {
    o = o || {};
    const [X, Y, W, H] = rect, lich = clamp(o.lichen == null ? 1 : o.lichen, 0, 1), snow = clamp(o.snow || 0, 0, 1), winter = snow > 0.05;
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip();
    const sky = ctx.createLinearGradient(0, Y, 0, Y + H * 0.55);
    sky.addColorStop(0, winter ? '#5A6A84' : '#4A78A8'); sky.addColorStop(1, winter ? '#C8D0DA' : '#B8D2E4');
    ctx.fillStyle = sky; ctx.fillRect(X, Y, W, H);
    // distant cloud bank
    ctx.fillStyle = winter ? 'rgba(230,236,244,.35)' : 'rgba(255,255,255,.35)';
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(X + W * (0.1 + k * 0.17), Y + H * 0.16 + (k % 2) * 8, W * 0.11, H * 0.035, 0, 0, TAU); ctx.fill(); }
    // the sea
    const seaY = Y + H * 0.42;
    const sea = ctx.createLinearGradient(0, seaY, 0, Y + H * 0.55);
    sea.addColorStop(0, winter ? '#6A7A8A' : '#3A6684'); sea.addColorStop(1, winter ? '#8A98A6' : '#5A86A0');
    ctx.fillStyle = sea; ctx.fillRect(X, seaY, W, H * 0.2);
    if (winter) { ctx.fillStyle = 'rgba(236,242,248,.6)'; for (let k = 0; k < 9; k++) { ctx.fillRect(X + W * (k * 0.11 + 0.02), seaY + 4 + (k % 3) * 5, W * 0.07, 2.5); } }
    // far hills (volcanic, steep), then the near rolling tundra
    const r = rng(o.seed || 5);
    const far = []; for (let i = 0; i <= 24; i++) far.push([X + i / 24 * W, seaY - H * (0.05 + 0.12 * Math.pow(Math.sin(i / 24 * Math.PI * 1.3 + 0.4), 2)) - r() * 4]);
    ctx.fillStyle = winter ? mix('#C8D0D8', '#F4F8FC', snow) : '#6A7A6A';
    ctx.beginPath(); ctx.moveTo(X, seaY); far.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(X + W, seaY); ctx.closePath(); ctx.fill();
    if (!winter) { ctx.fillStyle = 'rgba(240,244,248,.5)'; far.forEach((p, i) => { if (i % 5 === 2) { ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] + 6); ctx.lineTo(p[0], p[1]); ctx.lineTo(p[0] + 8, p[1] + 6); ctx.fill(); } }); }
    const gy = x => Y + H * 0.56 + Math.sin((x - X) / W * 5.2 + 0.7) * H * 0.04 + Math.sin((x - X) / W * 13 + 2) * H * 0.012;
    const ground = mix(mix('#5A4630', '#7A7048', 0.4), '#B4BCA4', lich);         // bare peat/sedge → lichen cushions
    const g2 = ctx.createLinearGradient(0, Y + H * 0.5, 0, Y + H);
    g2.addColorStop(0, winter ? mix(ground, '#F2F6FA', snow) : ground); g2.addColorStop(1, winter ? mix(mix(ground, '#2A2418', 0.4), '#DCE4EC', snow) : mix(ground, '#2A2418', 0.45));
    ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(X, Y + H);
    for (let i = 0; i <= 60; i++) { const x = X + i / 60 * W; ctx.lineTo(x, gy(x)); }
    ctx.lineTo(X + W, Y + H); ctx.closePath(); ctx.fill();
    // the ground cover: lichen cushions (as thick as what is left), sedge tussocks, bare patches
    const rr = rng((o.seed || 5) * 31);
    for (let k = 0; k < 140; k++) {
      const x = X + rr() * W, d = rr(), yy = gy(x) + d * (Y + H - gy(x)) * 0.95, sz = 0.5 + d * 1.6;
      if (rr() < lich) lichen(ctx, x, yy, 10 * sz, (2 + 5 * lich) * sz, { seed: k + 3 });
      else { ctx.strokeStyle = winter ? 'rgba(120,110,90,.5)' : 'rgba(150,130,70,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(x, yy); ctx.lineTo(x + j * 1.6 * sz, yy - 4 * sz); } ctx.stroke(); }
    }
    if (winter) {                                      // snow lying over everything, deepest in the hollows
      ctx.fillStyle = rgba('#F4F8FC', 0.35 + 0.55 * snow);
      ctx.beginPath(); ctx.moveTo(X, Y + H); for (let i = 0; i <= 60; i++) { const x = X + i / 60 * W; ctx.lineTo(x, gy(x) - 1); } ctx.lineTo(X + W, Y + H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    return gy;
  }

  /* ============================================================
     3D BENCH PIECES
     ============================================================ */
  /* an LED grow light on a stand: a dark aluminium bar with a lit diffuser underneath, on a post whose
     height sets the light; at: the post's foot; h: the panel's height above the bench (m); I: 0..1 */
  function growLight(F, at, h, len, I) {
    const ctx = F.ctx, cam = F.cam;
    R3.box(F, [at[0], at[1], 0.006], [0.12, 0.09, 0.012], '#2A2E36', { ambient: 0.4 });
    R3.cylinder(F, [at[0], at[1], 0.012], [at[0], at[1], h + 0.03], 0.006, '#AEB6C2', { segments: 10 });
    R3.cylinder(F, [at[0], at[1], h + 0.03], [at[0] + len * 0.5, at[1], h + 0.03], 0.005, '#AEB6C2', { segments: 10 });
    const c = [at[0] + len * 0.5, at[1], h + 0.012];
    R3.box(F, c, [len, 0.07, 0.022], '#3A404C', { ambient: 0.45 });
    F.push([c[0], c[1], c[2] - 0.0115], () => {
      const P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => cam.project([c[0] + u * len * 0.48, c[1] + v * 0.03, c[2] - 0.0112]));
      if (P.some(q => !q.ok)) return;
      ctx.save(); ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath();
      ctx.fillStyle = mix('#5A5048', '#FFF6E4', I); ctx.fill();
      if (I > 0.05) { ctx.shadowColor = 'rgba(255,240,210,' + (0.8 * I).toFixed(2) + ')'; ctx.shadowBlur = 24 * I; ctx.fill(); }
      ctx.restore();
    }, -0.02);
    return c;
  }
  /* a cone of light from the panel down onto a circle on the water (drawn faintly, additive) */
  function lightCone(F, from, len, to, r, I) {
    if (I < 0.03) return;
    const ctx = F.ctx, cam = F.cam;
    F.push([to[0], to[1], (from[2] + to[2]) / 2], () => {
      const a = cam.project([from[0] - len * 0.45, from[1], from[2] - 0.012]), b = cam.project([from[0] + len * 0.45, from[1], from[2] - 0.012]);
      const L = cam.project([to[0] - r, to[1], to[2]]), R = cam.project([to[0] + r, to[1], to[2]]);
      if (!a.ok || !b.ok || !L.ok || !R.ok) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, a.y, 0, L.y); g.addColorStop(0, 'rgba(255,244,214,' + (0.22 * I).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(R.x, R.y); ctx.lineTo(L.x, L.y); ctx.closePath(); ctx.fill(); ctx.restore();
    }, 0.05);
  }
  /* a mat of duckweed floating on a round water surface: centre [x,y,z] of the surface, radius rw (m);
     fronds: [{u, v, a, n, age}] in units of the radius; size: a frond's length (m); chl 0..1.
     The whole mat is one item — the surface and what floats on it sort together. */
  function frondMat(F, c, rw, fronds, size, chl) {
    const ctx = F.ctx, cam = F.cam;
    F.push(c, () => {
      const O = cam.project(c), X = cam.project([c[0] + rw, c[1], c[2]]), Y = cam.project([c[0], c[1] + rw, c[2]]);
      if (!O.ok || !X.ok || !Y.ok) return;
      const ax = X.x - O.x, ay = X.y - O.y, bx = Y.x - O.x, by = Y.y - O.y;
      ctx.save(); ctx.transform(ax, ay, bx, by, O.x, O.y);
      ctx.beginPath(); ctx.arc(0, 0, 0.995, 0, TAU); ctx.clip();
      const sz = size / rw;
      fronds.forEach(f => lemna(ctx, f.u, f.v, sz, f.a, { n: f.n, age: f.age, chl, shadow: 0 }));
      ctx.restore();
    }, -0.04);
  }

  /* a wire test-tube rack: two drilled steel plates on four legs, each tube standing through both,
     plugged with cotton wool. tubes: [{cloud 0..1, liquid, level, sel}]; returns the tube bases */
  function wireRack(F, at, tubes, o) {
    o = o || {};
    const C = window.CELL, n = tubes.length, pitch = o.pitch || 0.04, W = n * pitch + 0.02, D = 0.05, r = o.r || 0.009, Ht = o.h || 0.12;
    const steel = '#B8C2CE';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([u, v]) => R3.cylinder(F, [at[0] + u * W / 2, at[1] + v * D / 2, 0.002], [at[0] + u * W / 2, at[1] + v * D / 2, 0.075], 0.0018, steel, { segments: 8, shadow: false }));
    [0.035, 0.075].forEach(z => R3.box(F, [at[0], at[1], z], [W, D, 0.0025], steel, { ambient: 0.55, shadow: false }));
    R3.box(F, [at[0], at[1], 0.0015], [W, D, 0.003], '#8E98A4', { ambient: 0.5, bias: F.GROUND });
    const out = [];
    tubes.forEach((t, i) => {
      const b = [at[0] - W / 2 + 0.01 + pitch * (i + 0.5), at[1], 0.004];
      C.testTube(F, b, { r, h: Ht, level: t.level == null ? 0.55 : t.level, liquid: t.liquid || '#E8E2C4', cloud: t.cloud || 0 });
      R3.cylinder(F, [b[0], b[1], b[2] + Ht - 0.012], [b[0], b[1], b[2] + Ht + 0.01], r * 0.85, '#F2EEE6', { segments: 14, ambient: 0.7, shadow: false });   // cotton plug
      out.push(b);
    });
    return out;
  }

  window.G7D = { rng, mix, rgba, scaleBar, leader, lemna, lemnaRoot, paramecium, PARA, bacteria, yeast, field, haemo, reindeer, lichen, tundra,
                 growLight, lightCone, frondMat, wireRack };
})();
