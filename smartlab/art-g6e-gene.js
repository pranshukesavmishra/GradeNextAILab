/* ============================================================
   G6H — the organisms and cells of heredity, Grade 6 Unit E.
   The garden pea (Pisum sativum) as Mendel grew it, drawn from its
   anatomy so that each of his seven traits shows: tall or dwarf (long or
   short internodes), purple or white flowers (with the purple ring at the
   leaf axils that goes with them), flowers along the stem or crowded at the
   top, green or yellow pods, inflated or constricted pods, round or wrinkled
   seeds, yellow or green seeds. Each node carries its two large stipules, a
   pair of oval leaflets and branched tendrils; each flower its standard,
   wings, keel and five-toothed calyx.
   A woodland strawberry with trifoliate toothed leaves, white five-petalled
   flowers, fruit with achenes, and the runners that make clones.
   The New Zealand mud snail Potamopyrgus antipodarum, a tall conical shell
   of six whorls with its foot and tentacles out.
   Cells, nuclei and chromosomes — one chromatid or two sisters joined at
   the centromere, coloured by the grandparent each stretch came from — and
   the DNA double helix with its base pairs.
   Everything is drawn at the size, pose and colour a lab computes; nothing
   here computes science.
   ============================================================ */
(function () {
  'use strict';
  const RX = window.RX;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => RX.mix(a, b, t), rgba = (c, a) => RX.rgba(c, a);
  function rnd(seed) { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* ---------------- the garden pea ---------------- */
  const PEA = {
    leaf: '#5E9A48', leafHi: '#9CCB78', leafLo: '#3A6A30', stem: '#7AAA5A',
    purple: { std: '#B07AC8', wing: '#7A2A7A', keel: '#E8D8F0' },
    white: { std: '#F6F4EC', wing: '#ECEAE0', keel: '#F8F8F4' },
    podGreen: '#6AAA44', podYellow: '#E2C84A', seedYellow: '#E6CC50', seedGreen: '#94BC48'
  };
  /* a pea seed: r radius px; o.col 'yellow' | 'green'; o.shape 'round' | 'wrinkled'; o.seed */
  function peaSeed(ctx, x, y, r, o) {
    o = o || {}; r = Math.max(0.6, r);
    const base = o.col === 'green' ? PEA.seedGreen : PEA.seedYellow, wr = o.shape === 'wrinkled', R = rnd((o.seed || 1) * 7 + 3);
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, mix(base, '#FFFFFF', 0.45)); g.addColorStop(0.6, base); g.addColorStop(1, mix(base, '#203010', 0.35));
    ctx.fillStyle = g; ctx.beginPath();
    if (!wr) ctx.arc(0, 0, r, 0, TAU);
    else { const n = 14; for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = r * (0.86 + 0.14 * Math.sin(i * 2.7 + R() * 2) * (i % 2 ? 1 : -0.4)); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
    ctx.fill();
    if (wr) { ctx.strokeStyle = rgba(mix(base, '#203010', 0.5), 0.75); ctx.lineWidth = Math.max(0.6, r * 0.09); for (let k = 0; k < 5; k++) { const a = R() * TAU, l = r * (0.4 + R() * 0.4); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15); ctx.quadraticCurveTo(Math.cos(a + 0.5) * l * 0.7, Math.sin(a + 0.5) * l * 0.7, Math.cos(a) * l, Math.sin(a) * l); ctx.stroke(); } }
    // the hilum, the scar where the seed hung on its stalk
    ctx.fillStyle = rgba('#3A2A18', 0.7); ctx.beginPath(); ctx.ellipse(r * 0.55, r * 0.35, r * 0.18, r * 0.09, 0.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#1A2410', 0.5); ctx.lineWidth = Math.max(0.5, r * 0.06); ctx.beginPath(); if (!wr) ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  /* a pea flower side-on: x, y the base of the calyx, s its length px, ang its tilt; o.colour 'purple' | 'white' */
  function peaFlower(ctx, x, y, s, ang, o) {
    o = o || {}; s = Math.max(1, s);
    const P = o.colour === 'white' ? PEA.white : PEA.purple;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    // the standard: the large upright back petal
    const sg = ctx.createRadialGradient(s * 0.45, -s * 0.45, s * 0.05, s * 0.4, -s * 0.3, s * 0.8); sg.addColorStop(0, mix(P.std, '#FFFFFF', 0.35)); sg.addColorStop(1, mix(P.std, '#302040', 0.15));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.05); ctx.bezierCurveTo(s * 0.05, -s * 0.55, s * 0.4, -s * 1.0, s * 0.62, -s * 0.78); ctx.bezierCurveTo(s * 0.8, -s * 0.55, s * 0.62, -s * 0.15, s * 0.42, 0); ctx.closePath(); ctx.fill();
    if (o.colour !== 'white') { ctx.strokeStyle = rgba('#5A1A60', 0.45); ctx.lineWidth = Math.max(0.5, s * 0.025); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.06); ctx.lineTo(s * (0.3 + k * 0.1), -s * (0.5 + k * 0.05)); ctx.stroke(); } }
    // the wings, wrapped around the keel
    ctx.fillStyle = P.wing; ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.02); ctx.bezierCurveTo(s * 0.55, -s * 0.32, s * 0.95, -s * 0.28, s * 0.98, -s * 0.08); ctx.bezierCurveTo(s * 0.9, s * 0.08, s * 0.55, s * 0.1, s * 0.35, s * 0.04); ctx.closePath(); ctx.fill();
    // the keel, boat-shaped, enclosing the stamens and carpel
    ctx.fillStyle = P.keel; ctx.beginPath(); ctx.moveTo(s * 0.4, s * 0.03); ctx.bezierCurveTo(s * 0.6, s * 0.12, s * 0.92, s * 0.1, s * 1.02, -s * 0.04); ctx.bezierCurveTo(s * 0.88, s * 0.0, s * 0.6, -s * 0.02, s * 0.4, -s * 0.01); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#202020', 0.25); ctx.lineWidth = 0.6; ctx.stroke();
    // the calyx: five green teeth
    ctx.fillStyle = '#5E9A48'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.42, -s * 0.12); for (let k = 0; k < 4; k++) { ctx.lineTo(s * (0.48 + (k % 2) * 0.04), -s * 0.12 + k * s * 0.07); ctx.lineTo(s * 0.4, -s * 0.08 + k * s * 0.07); } ctx.lineTo(s * 0.42, s * 0.12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /* a pea pod: x, y its stalk end, len px, ang; o.col 'green' | 'yellow'; o.form 'inflated' | 'constricted';
     o.open shows the seeds (o.seeds [{col, shape}]) inside */
  function peaPod(ctx, x, y, len, ang, o) {
    o = o || {};
    const base = o.col === 'yellow' ? PEA.podYellow : PEA.podGreen, w = len * 0.2, n = o.seeds ? o.seeds.length : 6, con = o.form === 'constricted';
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    const edge = (sgn) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, bulge = Math.sin(Math.PI * t), pinch = con ? 0.55 + 0.45 * Math.abs(Math.sin(Math.PI * n * t)) : 1; pts.push([t * len, sgn * w * 0.5 * Math.pow(bulge, 0.6) * pinch + (sgn > 0 ? 0 : 0) - t * (1 - t) * len * 0.12]); } return pts; };
    const top = edge(-1), bot = edge(1);
    const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, mix(base, '#FFFFFF', 0.35)); g.addColorStop(0.5, base); g.addColorStop(1, mix(base, '#203010', 0.35));
    ctx.fillStyle = g; ctx.beginPath(); top.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(mix(base, '#102008', 0.6), 0.7); ctx.lineWidth = Math.max(0.6, len * 0.012); ctx.stroke();
    if (o.open && o.seeds) {
      // the pod split along its seam: the seeds in a row
      ctx.fillStyle = rgba(mix(base, '#F4F8E8', 0.6), 0.95); ctx.beginPath(); ctx.ellipse(len / 2, -len * 0.03, len * 0.46, w * 0.36, 0, 0, TAU); ctx.fill();
      o.seeds.forEach((sd, i) => peaSeed(ctx, len * (0.12 + 0.76 * (i + 0.5) / n), -len * 0.03 - Math.sin(Math.PI * (i + 0.5) / n) * len * 0.02, Math.min(w * 0.3, len * 0.38 / n), { col: sd.col, shape: sd.shape, seed: i + 1 }));
    } else if (!con) { ctx.strokeStyle = rgba('#FFFFFF', 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(len * 0.1, -w * 0.2); ctx.quadraticCurveTo(len * 0.5, -w * 0.45 - len * 0.03, len * 0.9, -w * 0.15); ctx.stroke(); }
    // the stalk and the dried style at the tip
    ctx.strokeStyle = '#6A9A4A'; ctx.lineWidth = Math.max(0.8, len * 0.03); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len * 0.08, 0); ctx.stroke();
    ctx.strokeStyle = '#8A7A4A'; ctx.lineWidth = Math.max(0.5, len * 0.012); ctx.beginPath(); ctx.moveTo(len, -len * 0.0); ctx.lineTo(len * 1.07, -len * 0.05); ctx.stroke();
    ctx.restore();
  }
  /* a branched tendril, coiling at its tips */
  function tendril(ctx, x, y, len, ang, lw) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = '#7AAA5A'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.5, 0); ctx.stroke();
    [-0.5, 0, 0.5].forEach(b => { ctx.beginPath(); ctx.moveTo(len * 0.5, 0); const ex = len * 0.5 + Math.cos(b) * len * 0.45, ey = Math.sin(b) * len * 0.45; ctx.quadraticCurveTo(len * 0.7, ey * 0.5, ex, ey); ctx.stroke(); ctx.beginPath(); ctx.arc(ex + len * 0.05, ey, len * 0.05, Math.PI, Math.PI * 2.7); ctx.stroke(); });
    ctx.restore();
  }
  /* a leaflet or stipule, an oval blade with a midrib */
  function blade(ctx, x, y, L, Wd, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -Wd, 0, Wd); g.addColorStop(0, mix(col, '#E8F4C8', 0.3)); g.addColorStop(1, mix(col, '#102008', 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * 0.25, -Wd, L * 0.8, -Wd, L, 0); ctx.bezierCurveTo(L * 0.8, Wd, L * 0.25, Wd, 0, 0); ctx.fill();
    ctx.strokeStyle = rgba('#E8F4C8', 0.45); ctx.lineWidth = Math.max(0.4, Wd * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * 0.92, 0); ctx.stroke();
    ctx.restore();
  }
  /* the whole plant: x, y the soil line, hPx its height; o: flower, axial (true) or terminal, podCol,
     podForm, seedCol, seedShape (seeds in the pods, shown when o.open), stage 'flower' | 'pod' | 'both',
     leafPx the leaflet length, seed for its own sway */
  function peaPlant(ctx, x, y, hPx, o) {
    o = o || {}; hPx = Math.max(4, hPx);
    const R = rnd((o.seed || 1) * 13 + 5), N = 8, lp = Math.max(3, o.leafPx || hPx * 0.13), purple = o.flower !== 'white';
    const lw = Math.max(1, lp * 0.1), node = [];
    let cx = x, cy = y;
    for (let i = 0; i <= N; i++) { node.push([cx, cy]); cx += (i % 2 ? 1 : -1) * lp * 0.12 + (R() - 0.5) * lp * 0.05; cy -= hPx / N; }
    // a short cane the plant climbs, as in a garden
    if (o.cane !== false) { ctx.strokeStyle = '#A88A5A'; ctx.lineWidth = Math.max(1, lp * 0.12); ctx.beginPath(); ctx.moveTo(x + lp * 0.5, y + 2); ctx.lineTo(x + lp * 0.5, y - hPx * 1.02); ctx.stroke(); }
    // the stem
    RX.tube(ctx, node, Math.max(1.2, lp * 0.16), PEA.stem, {});
    const stage = o.stage || 'both';
    for (let i = 1; i <= N; i++) {
      const [nx, ny] = node[i], side = i % 2 ? 1 : -1, sz = lp * (i === N ? 0.7 : 1);
      // two large stipules clasping the node
      blade(ctx, nx, ny, sz * 0.75, sz * 0.32, side > 0 ? -0.4 : Math.PI + 0.4, mix(PEA.leaf, '#7AAA5A', 0.3));
      blade(ctx, nx, ny, sz * 0.6, sz * 0.26, side > 0 ? Math.PI - 0.2 : 0.2, mix(PEA.leaf, '#7AAA5A', 0.3));
      // the purple ring at the axil that comes with the purple-flower allele
      if (purple) { ctx.fillStyle = rgba('#8A2A7A', 0.85); ctx.beginPath(); ctx.ellipse(nx, ny, lp * 0.16, lp * 0.07, 0, 0, TAU); ctx.fill(); }
      // the compound leaf: a petiole, a pair of leaflets, then tendrils
      const pa = side > 0 ? -0.55 : Math.PI + 0.55, px = nx + Math.cos(pa) * sz * 0.5, py = ny + Math.sin(pa) * sz * 0.5;
      ctx.strokeStyle = PEA.stem; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(px, py); ctx.stroke();
      blade(ctx, px, py, sz * 0.62, sz * 0.24, pa - 0.9, PEA.leaf); blade(ctx, px, py, sz * 0.62, sz * 0.24, pa + 0.9, PEA.leaf);
      tendril(ctx, px, py, sz * 0.7, pa, Math.max(0.6, lw * 0.6));
      // flowers and pods: along the stem from the fourth node (axial), or all at the top (terminal)
      const bearing = o.axial === false ? i === N : (i >= 4 && i < N);
      if (bearing) {
        const k = o.axial === false ? 4 : 1;
        for (let j = 0; j < k; j++) {
          const pa2 = (side > 0 ? -0.2 : Math.PI + 0.2) + (j - (k - 1) / 2) * 0.55, qx = nx + Math.cos(pa2) * sz * 0.45, qy = ny + Math.sin(pa2) * sz * 0.45 - sz * 0.15;
          ctx.strokeStyle = PEA.stem; ctx.lineWidth = Math.max(0.6, lw * 0.7); ctx.beginPath(); ctx.moveTo(nx, ny); ctx.quadraticCurveTo(nx + Math.cos(pa2) * sz * 0.2, ny - sz * 0.25, qx, qy); ctx.stroke();
          const pod = stage === 'pod' || (stage === 'both' && (i + j) % 2 === 0);
          if (pod) peaPod(ctx, qx, qy, sz * 1.25, (Math.cos(pa2) > 0 ? 0.9 : Math.PI - 0.9) + (Math.cos(pa2) > 0 ? 0 : 0), { col: o.podCol, form: o.podForm, seeds: o.seeds, open: false });
          else peaFlower(ctx, qx, qy, sz * 0.85, Math.cos(pa2) > 0 ? -0.5 : Math.PI + 0.5, { colour: o.flower });
        }
      }
    }
    return { top: node[N] };
  }

  /* ---------------- the woodland strawberry ---------------- */
  /* a strawberry plant: x, y the crown, s its size px; o.leaves, o.flowers, o.fruit; o.tint shifts its leaf
     colour (a seedling's own genes); o.young for a newly rooted daughter */
  function strawberry(ctx, x, y, s, o) {
    o = o || {}; s = Math.max(2, s);
    const R = rnd((o.seed || 1) * 31 + 7), nL = o.leaves || 5, leafCol = mix('#4E8A3C', o.tint || '#4E8A3C', 0.8);
    for (let k = 0; k < nL; k++) {
      const a = -Math.PI / 2 + (k - (nL - 1) / 2) * (1.9 / Math.max(1, nL - 1)), L = s * (0.55 + 0.2 * R()), ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.9;
      ctx.strokeStyle = '#6A8A3A'; ctx.lineWidth = Math.max(0.8, s * 0.025); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.4, y + Math.sin(a) * L * 0.7, ex, ey); ctx.stroke();
      // three toothed leaflets
      [-0.75, 0, 0.75].forEach(d => {
        const la = a + d, lx = ex, ly = ey, LL = s * 0.26 * (d ? 0.9 : 1), WW = LL * 0.42;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(la);
        const g = ctx.createLinearGradient(0, -WW, 0, WW); g.addColorStop(0, mix(leafCol, '#D8F0B8', 0.25)); g.addColorStop(1, mix(leafCol, '#0A1808', 0.3));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0);
        for (let i = 0; i <= 12; i++) { const t = i / 12, r = Math.sin(Math.PI * Math.pow(t, 0.8)) * WW * (i % 2 ? 1.08 : 0.92); ctx.lineTo(t * LL, -r); }
        for (let i = 12; i >= 0; i--) { const t = i / 12, r = Math.sin(Math.PI * Math.pow(t, 0.8)) * WW * (i % 2 ? 1.08 : 0.92); ctx.lineTo(t * LL, r); }
        ctx.fill();
        ctx.strokeStyle = rgba('#D8F0B8', 0.4); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(LL * 0.9, 0); for (let v = 1; v < 5; v++) { ctx.moveTo(LL * v / 5, 0); ctx.lineTo(LL * (v / 5 + 0.1), -WW * 0.7); ctx.moveTo(LL * v / 5, 0); ctx.lineTo(LL * (v / 5 + 0.1), WW * 0.7); } ctx.stroke();
        ctx.restore();
      });
    }
    for (let k = 0; k < (o.flowers || 0); k++) { const fx = x + (k - 0.5) * s * 0.3, fy = y - s * 0.32 - k * s * 0.05, r = s * 0.075; for (let q = 0; q < 5; q++) { const b = q / 5 * TAU; ctx.fillStyle = '#F8F6EE'; ctx.beginPath(); ctx.arc(fx + Math.cos(b) * r, fy + Math.sin(b) * r, r * 0.8, 0, TAU); ctx.fill(); } ctx.fillStyle = '#E8C030'; ctx.beginPath(); ctx.arc(fx, fy, r * 0.6, 0, TAU); ctx.fill(); }
    for (let k = 0; k < (o.fruit || 0); k++) {
      const fx = x + (k % 2 ? 1 : -1) * s * (0.18 + k * 0.05), fy = y - s * 0.06, r = s * 0.08;
      const g = ctx.createRadialGradient(fx - r * 0.3, fy - r * 0.3, r * 0.1, fx, fy, r * 1.3); if (o.fruitCol === 'yellow') { g.addColorStop(0, '#FFF6C8'); g.addColorStop(1, '#D8C070'); } else { g.addColorStop(0, '#FF6A5A'); g.addColorStop(1, '#A01818'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - r, fy - r * 0.5); ctx.quadraticCurveTo(fx - r, fy + r * 0.9, fx, fy + r * 1.3); ctx.quadraticCurveTo(fx + r, fy + r * 0.9, fx + r, fy - r * 0.5); ctx.quadraticCurveTo(fx, fy - r, fx - r, fy - r * 0.5); ctx.fill();
      ctx.fillStyle = '#F0D060'; for (let a = 0; a < 9; a++) ctx.fillRect(fx - r * 0.6 + (a % 3) * r * 0.55, fy - r * 0.2 + Math.floor(a / 3) * r * 0.45, 1.2, 1.2);
      ctx.fillStyle = '#4E8A3C'; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.ellipse(fx + (q - 2) * r * 0.3, fy - r * 0.6, r * 0.25, r * 0.1, (q - 2) * 0.4, 0, TAU); ctx.fill(); }
    }
    // the crown
    ctx.fillStyle = '#6A5A3A'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.06, s * 0.03, 0, 0, TAU); ctx.fill();
  }
  /* a runner (stolon) arching from one crown to the next */
  function stolon(ctx, x0, y0, x1, y1, h, lw) {
    ctx.strokeStyle = '#8A5A3A'; ctx.lineWidth = lw || 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - (h || 20), x1, y1); ctx.stroke();
    // the roots it puts down where it touches the soil
    ctx.strokeStyle = 'rgba(220,200,160,.7)'; ctx.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + k * 3, y1 + 8 + Math.abs(k) * 2); ctx.stroke(); }
  }

  /* ---------------- the New Zealand mud snail ---------------- */
  /* x, y the foot's centre, s the shell height px; o.col the shell, o.facing ±1, o.male, o.infected (castrated
     by the trematode Microphallus: orange cysts showing through the shell) */
  function snail(ctx, x, y, s, o) {
    o = o || {}; s = Math.max(2, s);
    const f = o.facing || 1, col = o.col || '#5A4632';
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    // the foot, gliding, and the head with its two tentacles and eyes at their bases
    const fg = ctx.createLinearGradient(0, -s * 0.1, 0, s * 0.08); fg.addColorStop(0, '#B8A894'); fg.addColorStop(1, '#6A5A48');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.05); ctx.quadraticCurveTo(-s * 0.32, -s * 0.06, -s * 0.1, -s * 0.08); ctx.lineTo(s * 0.42, -s * 0.07); ctx.quadraticCurveTo(s * 0.62, -s * 0.05, s * 0.58, s * 0.05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8A7A68'; ctx.lineWidth = Math.max(0.7, s * 0.035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.48, -s * 0.07); ctx.lineTo(s * 0.66, -s * 0.2); ctx.moveTo(s * 0.5, -s * 0.06); ctx.lineTo(s * 0.72, -s * 0.12); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#1A1410'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.09, Math.max(0.6, s * 0.022), 0, TAU); ctx.fill();
    if (o.male) { ctx.strokeStyle = '#C8B8A0'; ctx.lineWidth = Math.max(0.6, s * 0.03); ctx.beginPath(); ctx.moveTo(s * 0.36, -s * 0.08); ctx.quadraticCurveTo(s * 0.42, -s * 0.22, s * 0.3, -s * 0.24); ctx.stroke(); }
    // the shell: a tall cone of about six whorls, apex up and back, body whorl over the foot
    ctx.save(); ctx.translate(s * 0.08, -s * 0.1); ctx.rotate(-0.55);
    const H = s * 1.0, W = s * 0.27, outline = c => { c.moveTo(-W, 0); c.quadraticCurveTo(-W * 1.05, -H * 0.35, -W * 0.15, -H); c.lineTo(W * 0.15, -H); c.quadraticCurveTo(W * 1.05, -H * 0.35, W, 0); c.quadraticCurveTo(0, H * 0.28, -W, 0); c.closePath(); };
    const sg = ctx.createLinearGradient(-W, 0, W, 0); sg.addColorStop(0, mix(col, '#000000', 0.45)); sg.addColorStop(0.4, mix(col, '#FFF4E0', 0.16)); sg.addColorStop(1, mix(col, '#000000', 0.5));
    ctx.fillStyle = sg; ctx.beginPath(); outline(ctx); ctx.fill();
    ctx.strokeStyle = rgba('#100C08', 0.55); ctx.lineWidth = Math.max(0.5, s * 0.02);
    for (let k = 1; k <= 5; k++) { const t = 1 - Math.pow(0.68, k), yy = -H * t * 0.97, ww = W * (1 - t) * 1.05 + W * 0.12; ctx.beginPath(); ctx.moveTo(-ww, yy + ww * 0.25); ctx.quadraticCurveTo(0, yy - ww * 0.2, ww, yy + ww * 0.1); ctx.stroke(); }
    ctx.strokeStyle = rgba('#FFF4E0', 0.25); ctx.beginPath(); ctx.moveTo(-W * 0.3, -H * 0.1); ctx.quadraticCurveTo(-W * 0.45, -H * 0.5, -W * 0.08, -H * 0.9); ctx.stroke();
    // the aperture and its operculum
    ctx.fillStyle = '#2A2018'; ctx.beginPath(); ctx.ellipse(W * 0.35, -H * 0.06, W * 0.45, W * 0.3, 0.5, 0, TAU); ctx.fill();
    if (o.infected) { ctx.fillStyle = 'rgba(255,150,40,.9)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-W * 0.2 + (k % 2) * W * 0.4, -H * (0.18 + k * 0.1), Math.max(0.8, s * 0.035), 0, TAU); ctx.fill(); } }
    if (o.mark) { ctx.fillStyle = o.mark; ctx.beginPath(); ctx.arc(0, -H * 0.82, Math.max(1.6, s * 0.08), 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }

  /* ---------------- cells and chromosomes ---------------- */
  /* a cell: x, y centre, rx, ry; o.pinch 0..1 a cleavage furrow across its long axis (o.axis 'v' | 'h');
     o.nucleus { r, alpha } its envelope; o.wall for a plant cell's wall */
  function cell(ctx, x, y, rx, ry, o) {
    o = o || {}; rx = Math.max(1, rx); ry = Math.max(1, ry);
    const pin = clamp(o.pinch || 0, 0, 0.95), vert = o.axis === 'v';
    const shape = c => {
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const across = vert ? ca : sa;            // the furrow runs across the long axis, through the middle
        const squeeze = 1 - pin * Math.exp(-Math.pow((vert ? sa : ca) * 3.2, 2)) * 0.98;
        void across;
        const px = x + ca * rx * (vert ? squeeze : 1), py = y + sa * ry * (vert ? 1 : squeeze);
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
    };
    if (o.wall) { ctx.strokeStyle = rgba('#9ACB6A', 0.7); ctx.lineWidth = Math.max(2, rx * 0.05); ctx.beginPath(); ctx.rect(x - rx * 1.06, y - ry * 1.06, rx * 2.12, ry * 2.12); ctx.stroke(); }
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, Math.min(rx, ry) * 0.1, x, y, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, o.fill || 'rgba(120,170,200,.22)'); g.addColorStop(1, o.edge || 'rgba(60,110,150,.32)');
    ctx.fillStyle = g; ctx.beginPath(); shape(ctx); ctx.fill();
    ctx.strokeStyle = o.line || 'rgba(170,215,240,.8)'; ctx.lineWidth = Math.max(1.2, Math.min(rx, ry) * 0.03); ctx.stroke();
    if (o.nucleus && o.nucleus.alpha > 0.02) { ctx.save(); ctx.globalAlpha = o.nucleus.alpha; ctx.fillStyle = 'rgba(150,120,200,.18)'; ctx.strokeStyle = 'rgba(190,160,240,.8)'; ctx.setLineDash([5, 3]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, o.nucleus.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  }
  /* a chromosome: x, y its centromere, len px (each arm ± len/2 along ang); o.cols: an array of [from, to, colour]
     stretches along its length (0 = one end, 1 = the other) — a crossover shows as a change of colour;
     o.sisters (two chromatids joined at the centromere, gap px); o.loci [{ at, col, label }] gene bands */
  function chromosome(ctx, x, y, len, ang, o) {
    o = o || {};
    const w = o.width || Math.max(3, len * 0.16), cols = o.cols || [[0, 1, o.col || '#7FB7F2']];
    const one = (ox, oy, segs) => {
      ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(ang);
      segs.forEach(([a, b, c]) => {
        const y0 = -len / 2 + a * len, y1 = -len / 2 + b * len;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, mix(c, '#FFFFFF', 0.35)); g.addColorStop(0.5, c); g.addColorStop(1, mix(c, '#000000', 0.35));
        ctx.fillStyle = g; ctx.beginPath();
        const rTop = a <= 0.001 ? w / 2 : 0, rBot = b >= 0.999 ? w / 2 : 0;
        ctx.moveTo(-w / 2, y0 + rTop); if (rTop) ctx.arc(0, y0 + rTop, w / 2, Math.PI, 0); else ctx.lineTo(w / 2, y0);
        ctx.lineTo(w / 2, y1 - rBot); if (rBot) ctx.arc(0, y1 - rBot, w / 2, 0, Math.PI); else ctx.lineTo(-w / 2, y1);
        ctx.closePath(); ctx.fill();
      });
      // the centromere's waist
      ctx.fillStyle = 'rgba(10,14,22,.55)'; ctx.fillRect(-w / 2, -len * 0.02 + (o.cen || 0) * len, w, Math.max(1.2, len * 0.04));
      (o.loci || []).forEach(l => { const yy = -len / 2 + l.at * len; ctx.fillStyle = l.col; ctx.fillRect(-w / 2 - 1, yy - Math.max(1, len * 0.025), w + 2, Math.max(2, len * 0.05)); });
      ctx.restore();
    };
    if (o.sisters) { const gp = o.gap != null ? o.gap : w * 0.55, nx = Math.cos(ang) * gp, ny = Math.sin(ang) * gp; one(-nx, -ny, cols); one(nx, ny, o.cols2 || cols); ctx.fillStyle = 'rgba(30,30,40,.9)'; ctx.beginPath(); ctx.arc(x, y + (o.cen || 0) * len, Math.max(1.5, w * 0.35), 0, TAU); ctx.fill(); }
    else one(0, 0, cols);
    (o.loci || []).forEach(l => { if (!l.label) return; const yy = -len / 2 + l.at * len, px = x - Math.sin(ang) * yy + Math.cos(ang) * (w + (o.sisters ? w : 0) + 3), py = y + Math.cos(ang) * yy + Math.sin(ang) * (w + 3); ctx.font = '700 ' + Math.max(8, Math.min(12, len * 0.14)) + 'px "IBM Plex Mono",monospace'; ctx.fillStyle = l.col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(l.label, px, py); });
  }
  /* the DNA double helix seen from the side: x0, y the left end's axis, len px; o.bases a string of
     A/C/G/T for one strand (its partner drawn by pairing); o.hi the index to highlight; o.turn px a turn */
  const BASE_COL = { A: '#E8605A', T: '#F2C84A', G: '#5AB86A', C: '#5A9AE8' }, PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
  function dna(ctx, x0, y, len, o) {
    o = o || {};
    const bases = o.bases || 'ATGCGTACGT', n = bases.length, amp = o.amp || 22, turn = o.turn || len / Math.max(1, n / 10.5), ph = o.phase || 0;
    const yA = t => y + Math.sin((t / turn) * TAU + ph) * amp, yB = t => y + Math.sin((t / turn) * TAU + ph + Math.PI * 0.8) * amp;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n * len, xa = x0 + t, a = yA(t), b = yB(t), bb = bases[i], pb = PAIR[bb] || 'A', mid = (a + b) / 2;
      ctx.lineWidth = Math.max(2, len / n * 0.38); ctx.strokeStyle = BASE_COL[bb] || '#AAA'; ctx.beginPath(); ctx.moveTo(xa, a); ctx.lineTo(xa, mid); ctx.stroke();
      ctx.strokeStyle = BASE_COL[pb]; ctx.beginPath(); ctx.moveTo(xa, mid); ctx.lineTo(xa, b); ctx.stroke();
      if (o.hi === i) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(xa - len / n * 0.45, Math.min(a, b) - 4, len / n * 0.9, Math.abs(a - b) + 8); }
      if (o.letters) { ctx.font = '700 ' + Math.max(8, Math.min(13, len / n * 0.7)) + 'px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.hi === i ? '#FFFFFF' : BASE_COL[bb]; ctx.fillText(bb, xa, y - amp - 12); ctx.fillStyle = BASE_COL[pb]; ctx.fillText(pb, xa, y + amp + 12); }
    }
    // the two sugar-phosphate backbones, front strand drawn last
    [[yB, '#8AA0C8', 0.6], [yA, '#D8E4F8', 1]].forEach(([fy, c, al]) => { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 160; k++) { const t = k / 160 * len; k ? ctx.lineTo(x0 + t, fy(t)) : ctx.moveTo(x0 + t, fy(t)); } ctx.stroke(); });
  }

  window.G6H = { PEA, peaSeed, peaFlower, peaPod, peaPlant, strawberry, stolon, snail, cell, chromosome, dna, BASE_COL, PAIR };
})();
