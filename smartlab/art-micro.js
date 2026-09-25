/* ============================================================
   art-micro.js — MICRO: the microscope, its slides, and what it shows
   ------------------------------------------------------------
   The eyepiece view is computed, not painted: every specimen is drawn in
   the slide's own micrometres as the light it lets through (a stained
   nucleus absorbs, an unstained wall only bends light at its edge), each
   depth of it is blurred by the blur the optics give that depth — the
   diffraction of the objective's aperture, and the spread of the
   illuminating cone for anything out of the focal plane — and the layers
   multiply, as transmissions do. The field of view is the eyepiece's
   field stop over the magnification; a compound microscope turns the
   image round, a single lens does not.
     view(ctx, cx, cy, R, V)       the eyepiece field, with its graticule
     slide(kind, seed, o)          a specimen: cork, onion skin, cheek cells,
                                   a root-tip squash, a blood smear, the stage
                                   micrometer, a newspaper letter, a hair …
     organism painters             Paramecium, Euglena, Amoeba, Chlamydomonas,
                                   the volvocine colonies, yeast, bacteria …
     compound / hooke / leeuwen    the three instruments, on the R3 bench
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = RX.mix, rgba = RX.rgba;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const hash2 = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  /* ============================================================
     THE BLUR — a Gaussian, from three box passes (Kovesi's sizes) for
     anything wider than a pixel, a three-tap kernel below that.
     ============================================================ */
  function boxes(sigma) {
    const n = 3, wIdeal = Math.sqrt(12 * sigma * sigma / n + 1);
    let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
    const wu = wl + 2, m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
    const out = []; for (let i = 0; i < n; i++) out.push(((i < m ? wl : wu) - 1) / 2);
    return out;
  }
  function blurRGB(img, w, h, sigma) {
    if (sigma < 0.3) return;
    const d = img.data, len = w * h;
    const ch = [new Float32Array(len), new Float32Array(len), new Float32Array(len)], tmp = new Float32Array(len);
    for (let i = 0; i < len; i++) { ch[0][i] = d[i * 4]; ch[1][i] = d[i * 4 + 1]; ch[2][i] = d[i * 4 + 2]; }
    const pass = (src, dst, r, horiz) => {
      const L = horiz ? w : h, M = horiz ? h : w, sL = horiz ? 1 : w, sM = horiz ? w : 1, inv = 1 / (2 * r + 1);
      for (let j = 0; j < M; j++) {
        const base = j * sM; let acc = 0;
        for (let k = -r; k <= r; k++) acc += src[base + clamp(k, 0, L - 1) * sL];
        for (let i = 0; i < L; i++) {
          dst[base + i * sL] = acc * inv;
          acc += src[base + Math.min(L - 1, i + r + 1) * sL] - src[base + Math.max(0, i - r) * sL];
        }
      }
    };
    const tap = (src, dst, a, horiz) => {                 // [a, 1 − 2a, a]
      const L = horiz ? w : h, M = horiz ? h : w, sL = horiz ? 1 : w, sM = horiz ? w : 1, c = 1 - 2 * a;
      for (let j = 0; j < M; j++) { const base = j * sM; for (let i = 0; i < L; i++) dst[base + i * sL] = c * src[base + i * sL] + a * (src[base + Math.max(0, i - 1) * sL] + src[base + Math.min(L - 1, i + 1) * sL]); }
    };
    for (let c = 0; c < 3; c++) {
      const A = ch[c];
      if (sigma < 1.0) { const a = Math.min(0.5, sigma * sigma / 2); tap(A, tmp, a, true); tap(tmp, A, a, false); }
      else for (const r of boxes(sigma)) { if (r < 1) continue; pass(A, tmp, r, true); pass(tmp, A, r, false); }
    }
    for (let i = 0; i < len; i++) { d[i * 4] = ch[0][i]; d[i * 4 + 1] = ch[1][i]; d[i * 4 + 2] = ch[2][i]; }
  }

  /* ============================================================
     THE VIEW
     V = { slide, dyn, at:[x,y] µm under the centre of the field, fov µm,
           invert, focus µm, sigma(dz) → µm, lamp, bright, haze, pc,
           stain, t, grat:{ div µm, n }, pointer, optKey }
     A layer is every item whose blur falls in one band; each is drawn on
     white, blurred, and multiplied into the image.
     ============================================================ */
  const BANDS = [0.3, 0.8, 1.6, 2.8, 4.5, 7, 11, 17, 26, 40, 1e9];
  const bandOf = s => { for (let i = 0; i < BANDS.length; i++) if (s < BANDS[i]) return i; return BANDS.length - 1; };
  const pool = [];
  function layerCanvas(i, N) {
    let c = pool[i];
    if (!c) { c = pool[i] = canvas(N, N); c._x = c.getContext('2d', { willReadFrequently: true }); }
    if (c.width !== N) { c.width = N; c.height = N; }
    return c;
  }
  let ACC = null;
  function painterFor(it) { return PAINT[it.kind] || null; }
  /* how far an item is from the focal plane: it is sharp anywhere through its own thickness */
  function defocus(it, focus) { const z0 = (it.z || 0) - (it.h || 0) / 2, z1 = (it.z || 0) + (it.h || 0) / 2; return focus < z0 ? z0 - focus : focus > z1 ? focus - z1 : 0; }

  function drawLayers(items, V, N, k, P, blurOn) {
    const groups = new Map();
    items.forEach(it => {
      const s = V.sigma(defocus(it, V.focus)) * k, b = bandOf(s);
      if (!groups.has(b)) groups.set(b, { s: 0, n: 0, items: [] });
      const G = groups.get(b); G.s += s; G.n++; G.items.push(it);
    });
    const out = [];
    [...groups.keys()].sort((a, b) => a - b).forEach((b, gi) => {
      const G = groups.get(b), s = G.s / G.n;
      const c = layerCanvas(out.length + (blurOn ? 0 : 20), N), x = c._x;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, N, N);
      G.items.forEach(it => { const f = painterFor(it); if (f) { x.save(); f(x, it, P); x.restore(); } });
      if (s >= 0.3) { const img = x.getImageData(0, 0, N, N); blurRGB(img, N, N, Math.min(s, N / 5)); x.putImageData(img, 0, 0); }
      out.push({ c, s });
    });
    return out;
  }

  function view(ctx, cx, cy, R, V) {
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const N = clamp(Math.round(2 * R * Math.min(dpr, 1.35)), 160, 620);
    const k = N / V.fov, inv = !!V.invert, ax = V.at[0], ay = V.at[1];
    const sx = inv ? -1 : 1, sy = inv ? 1 : -1;
    const X = x => N / 2 + (x - ax) * k * sx, Y = y => N / 2 + (y - ay) * k * sy;
    const P = {
      k, N, inv, sx, sy, X, Y, t: V.t || 0, pc: V.pc == null ? 0.5 : V.pc, stain: V.stain || 'none', V,
      x0: ax - V.fov / 2, x1: ax + V.fov / 2, y0: ay - V.fov / 2, y1: ay + V.fov / 2,
      /* local frame of an item: micrometres, rotated by a */
      local(c, x, y, a, s) { c.translate(X(x), Y(y)); c.scale(k * sx * (s || 1), k * sy * (s || 1)); if (a) c.rotate(a); },
      /* text reads the right way up on the slide, so it turns with the image */
      glyph(c, x, y, s) { c.translate(X(x), Y(y)); c.scale(k * sx * (s || 1), -k * sy * (s || 1)); }
    };
    if (!ACC) { ACC = canvas(N, N); ACC._x = ACC.getContext('2d'); }
    if (ACC.width !== N) { ACC.width = N; ACC.height = N; }
    const A = ACC._x;
    A.setTransform(1, 0, 0, 1, 0, 0); A.globalCompositeOperation = 'source-over'; A.globalAlpha = 1;
    A.fillStyle = V.mount || '#FFFFFF'; A.fillRect(0, 0, N, N);

    // the slide: drawn once for a given view and kept, since tissue does not move
    const sl = V.slide;
    if (sl && !sl.animated) {
      const key = [N, ax.toFixed(2), ay.toFixed(2), V.fov.toFixed(3), V.focus.toFixed(2), P.pc.toFixed(3), P.stain, inv, V.optKey || '', sl.version || 0].join('|');
      if (!sl._cache || sl._cache.key !== key) {
        const items = sl.query(P.x0 - 30, P.y0 - 30, P.x1 + 30, P.y1 + 30);
        const L = drawLayers(items, V, N, k, P, true);
        const STAT = sl._stat || (sl._stat = []);
        const imgs = L.map((l, i) => { const c = STAT[i] || (STAT[i] = canvas(N, N)); if (c.width !== N) { c.width = N; c.height = N; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'copy'; x.drawImage(l.c, 0, 0); x.globalCompositeOperation = 'source-over'; return c; });
        sl._cache = { key, imgs };
      }
      A.globalCompositeOperation = 'multiply';
      sl._cache.imgs.forEach(c => A.drawImage(c, 0, 0));
      A.globalCompositeOperation = 'source-over';
    }
    // the moving things, every frame
    const dyn = (V.dyn || []).concat(sl && sl.animated ? sl.query(P.x0 - 30, P.y0 - 30, P.x1 + 30, P.y1 + 30) : []);
    if (dyn.length) {
      const pad = 400, vis = dyn.filter(it => it.x > P.x0 - pad && it.x < P.x1 + pad && it.y > P.y0 - pad && it.y < P.y1 + pad);
      const L = drawLayers(vis, V, N, k, P, false);
      A.globalCompositeOperation = 'multiply';
      L.forEach(l => A.drawImage(l.c, 0, 0));
      A.globalCompositeOperation = 'source-over';
    }
    // the lamp: its colour, its brightness at the eye, and a milky veil when the optics scatter
    A.globalCompositeOperation = 'multiply'; A.fillStyle = V.lamp || '#FFF6E6'; A.fillRect(0, 0, N, N);
    A.globalCompositeOperation = 'source-over';
    const b = V.bright == null ? 1 : V.bright;
    if (V.haze > 0) { A.fillStyle = 'rgba(214,214,206,' + clamp(V.haze * 0.55, 0, 0.8).toFixed(3) + ')'; A.fillRect(0, 0, N, N); }
    if (b < 1) { A.fillStyle = 'rgba(0,0,0,' + clamp(1 - b, 0, 0.985).toFixed(3) + ')'; A.fillRect(0, 0, N, N); }
    else if (b > 1) { A.globalCompositeOperation = 'screen'; A.fillStyle = 'rgba(255,255,255,' + clamp((b - 1) * 0.45, 0, 0.9).toFixed(3) + ')'; A.fillRect(0, 0, N, N); A.globalCompositeOperation = 'source-over'; }

    // into the eyepiece: the field stop, a little fall-off at its rim, the eye's surround
    ctx.save();
    ctx.fillStyle = '#020306'; ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(ACC, cx - R, cy - R, 2 * R, 2 * R);
    const vg = ctx.createRadialGradient(cx, cy, R * 0.78, cx, cy, R);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.8, 'rgba(0,0,0,.10)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (V.grat) graticule(ctx, cx, cy, R, V);
    if (V.pointer) { ctx.strokeStyle = 'rgba(8,8,10,.92)'; ctx.lineWidth = Math.max(1.5, R * 0.012); ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R * 0.08, cy); ctx.stroke(); ctx.fillStyle = 'rgba(8,8,10,.92)'; ctx.beginPath(); ctx.moveTo(cx - R * 0.02, cy); ctx.lineTo(cx - R * 0.1, cy - R * 0.02); ctx.lineTo(cx - R * 0.1, cy + R * 0.02); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, TAU); ctx.stroke();
    const rim = ctx.createRadialGradient(cx, cy, R + 2, cx, cy, R + 9);
    rim.addColorStop(0, 'rgba(40,44,52,.9)'); rim.addColorStop(1, 'rgba(12,14,18,0)');
    ctx.strokeStyle = rim; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, TAU); ctx.stroke();
    ctx.restore();
    const toSlide = (px, py) => [ax + (px - cx) / (2 * R) * V.fov * sx, ay + (py - cy) / (2 * R) * V.fov * sy];
    const toScreen = (x, y) => [cx + (x - ax) / V.fov * 2 * R * sx, cy + (y - ay) / V.fov * 2 * R * sy];
    return { toSlide, toScreen, pxPerUm: 2 * R / V.fov };
  }

  /* the eyepiece graticule: it sits in the eyepiece, so it is always sharp, never turns with the image,
     and its divisions are worth 100 µm ÷ the objective — the lab calibrates it on the stage micrometer */
  function graticule(ctx, cx, cy, R, V) {
    const G = V.grat, n = G.n || 100, span = (G.span || 0.556) * 2 * R, x0 = cx - span / 2, y = cy + (G.dy || 0) * R;
    ctx.save();
    ctx.strokeStyle = 'rgba(10,10,12,.88)'; ctx.fillStyle = 'rgba(10,10,12,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + span, y); ctx.stroke();
    for (let i = 0; i <= n; i++) {
      const x = x0 + span * i / n, h = i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    }
    ctx.font = '600 ' + Math.max(8, Math.round(R * 0.035)) + 'px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (let i = 0; i <= n; i += 10) ctx.fillText(String(i / 10), x0 + span * i / n, y - 10);
    ctx.restore();
  }

  /* ============================================================
     SLIDES — static specimens, built once, looked up by a grid
     ============================================================ */
  function spatial(items, cell) {
    const grid = new Map(), key = (i, j) => i * 100003 + j;
    items.forEach((it, idx) => {
      const r = it.r || 20, i0 = Math.floor((it.x - r) / cell), i1 = Math.floor((it.x + r) / cell), j0 = Math.floor((it.y - r) / cell), j1 = Math.floor((it.y + r) / cell);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const kk = key(i, j); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(idx); }
    });
    return (x0, y0, x1, y1) => {
      const seen = new Set(), out = [];
      const i0 = Math.floor(x0 / cell), i1 = Math.floor(x1 / cell), j0 = Math.floor(y0 / cell), j1 = Math.floor(y1 / cell);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 40000) return items.slice();
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = grid.get(key(i, j)); if (L) L.forEach(idx => { if (!seen.has(idx)) { seen.add(idx); out.push(items[idx]); } }); }
      return out;
    };
  }

  const PAINT = {};
  /* ============================================================
     PAINTERS — each draws one thing as the light it lets through,
     on white, in the slide's micrometres. P.X / P.Y map slide µm to
     the layer's pixels; P.local() sets up an item's own frame.
     Unstained parts show only where they bend light: their edges, as
     strong as the condenser's iris lets them be (P.pc).
     ============================================================ */
  function smooth(c, pts) {
    const n = pts.length; c.beginPath();
    c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    c.closePath();
  }
  function ell(c, x, y, rx, ry, a) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), a || 0, 0, TAU); }
  const eA = (P, base) => clamp(base * (0.3 + 1.0 * P.pc), 0, 0.95);
  const px = (P, um, min) => Math.max(min == null ? 0.35 : min, um * P.k);
  function polyPath(c, P, v) { c.moveTo(P.X(v[0][0]), P.Y(v[0][1])); for (let i = 1; i < v.length; i++) c.lineTo(P.X(v[i][0]), P.Y(v[i][1])); c.closePath(); }
  /* Congo red: red above pH 5.2, blue-violet below 3.0 */
  function congo(pH) { const f = clamp((5.2 - pH) / 2.2, 0, 1); return mix('#D2362E', '#3B3FA8', f); }

  /* ---------- the mount itself ---------- */
  PAINT.bubble = (c, it, P) => {
    const x = P.X(it.x), y = P.Y(it.y), r = it.r * P.k;
    if (r < 0.6) return;
    c.strokeStyle = 'rgba(18,20,24,.92)'; c.lineWidth = Math.max(1, r * 0.2);
    c.beginPath(); c.arc(x, y, r * 0.9, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(60,64,70,.35)'; c.lineWidth = Math.max(0.6, r * 0.05);
    c.beginPath(); c.arc(x, y, r * 0.72, 0, TAU); c.stroke();
  };
  PAINT.dust = (c, it, P) => {
    c.fillStyle = 'rgba(60,58,52,' + eA(P, 0.7).toFixed(3) + ')';
    c.beginPath(); c.arc(P.X(it.x), P.Y(it.y), px(P, it.r, 0.5), 0, TAU); c.fill();
  };
  PAINT.coverEdge = (c, it, P) => {       // the edge of the coverslip: a straight dark line with a bright twin
    c.strokeStyle = 'rgba(30,34,40,.8)'; c.lineWidth = px(P, 6, 1.2);
    c.beginPath(); c.moveTo(P.X(it.x0), P.Y(it.y0)); c.lineTo(P.X(it.x1), P.Y(it.y1)); c.stroke();
  };

  /* ---------- Hooke's cork: a honeycomb of empty walls ---------- */
  PAINT.corkTile = (c, it, P) => {
    const k = P.k;
    if (k * 23 < 2.2) {                           // each cell smaller than two pixels: only the section's tone
      c.fillStyle = 'rgba(176,122,62,.42)'; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill();
      return;
    }
    c.fillStyle = 'rgba(222,178,112,.20)'; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill();
    c.fillStyle = 'rgba(150,92,40,.42)'; c.beginPath(); it.cells.forEach(cl => { if (cl.dark) polyPath(c, P, cl.v); }); c.fill();
    c.strokeStyle = 'rgba(112,66,26,.88)'; c.lineWidth = Math.max(0.55, 1.4 * k); c.lineJoin = 'round';
    c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.stroke();
    if (k > 1.2) {                                // the thin bright line of the middle lamella inside each wall
      c.strokeStyle = 'rgba(245,226,190,.55)'; c.lineWidth = Math.max(0.4, 0.35 * k);
      c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.stroke();
    }
  };

  /* ---------- onion skin: long cells in courses, each with its nucleus ---------- */
  const ONION = {
    none: { wall: P => 'rgba(88,98,86,' + eA(P, 0.55).toFixed(3) + ')', cyt: 'rgba(200,205,190,.06)', nuc: P => 'rgba(150,160,146,' + (0.1 + 0.22 * P.pc).toFixed(3) + ')', nucE: P => 'rgba(78,88,76,' + eA(P, 0.5).toFixed(3) + ')', nl: 'rgba(96,104,92,.5)' },
    iodine: { wall: () => 'rgba(176,122,38,.62)', cyt: 'rgba(236,196,112,.16)', nuc: () => 'rgba(184,120,34,.66)', nucE: () => 'rgba(128,78,18,.8)', nl: 'rgba(104,58,14,.85)' },
    mb: { wall: () => 'rgba(92,128,200,.5)', cyt: 'rgba(150,180,235,.10)', nuc: () => 'rgba(44,74,176,.74)', nucE: () => 'rgba(26,44,130,.85)', nl: 'rgba(18,30,100,.9)' }
  };
  PAINT.onionWalls = (c, it, P) => {
    const S = ONION[P.stain] || ONION.none, k = P.k;
    c.fillStyle = S.cyt; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill();
    c.strokeStyle = S.wall(P); c.lineWidth = Math.max(0.5, 1.8 * k); c.lineJoin = 'round';
    c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.stroke();
    if (k > 0.6) {                              // strands of cytoplasm crossing the big vacuole
      c.strokeStyle = P.stain === 'none' ? 'rgba(120,128,116,' + eA(P, 0.16).toFixed(3) + ')' : S.wall(P).replace(/[\d.]+\)$/, '0.18)');
      c.lineWidth = Math.max(0.4, 0.8 * k);
      c.beginPath(); it.cells.forEach(cl => { if (!cl.strand) return; const s = cl.strand; c.moveTo(P.X(s[0]), P.Y(s[1])); c.quadraticCurveTo(P.X(s[2]), P.Y(s[3]), P.X(s[4]), P.Y(s[5])); }); c.stroke();
    }
  };
  PAINT.onionNuclei = (c, it, P) => {
    const S = ONION[P.stain] || ONION.none, k = P.k;
    it.cells.forEach(cl => {
      const n = cl.nuc; if (!n) return;
      const x = P.X(n.x), y = P.Y(n.y), rx = n.rx * k, ry = n.ry * k;
      if (rx < 0.5) return;
      c.fillStyle = S.nuc(P); ell(c, x, y, rx, ry, P.sy < 0 ? -n.a : n.a); c.fill();
      c.strokeStyle = S.nucE(P); c.lineWidth = Math.max(0.5, 0.7 * k); c.stroke();
      if (rx > 3) { c.fillStyle = S.nl; n.nl.forEach(q => { c.beginPath(); c.arc(P.X(n.x + q[0]), P.Y(n.y + q[1]), q[2] * k, 0, TAU); c.fill(); }); }
    });
  };

  /* ---------- cheek cells: flat scales, a small nucleus, bacteria riding on them ---------- */
  PAINT.cheek = (c, it, P) => {
    const mb = P.stain === 'mb';
    P.local(c, it.x, it.y, it.a);
    smooth(c, it.v);
    c.fillStyle = mb ? 'rgba(122,162,232,.30)' : 'rgba(196,202,192,' + (0.06 + 0.08 * P.pc).toFixed(3) + ')'; c.fill();
    c.strokeStyle = mb ? 'rgba(62,98,190,.58)' : 'rgba(86,92,86,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = mb ? 'rgba(62,98,190,.42)' : 'rgba(96,102,96,' + eA(P, 0.34).toFixed(3) + ')'; c.lineWidth = 0.7;
    it.folds.forEach(f => { c.beginPath(); c.moveTo(f[0], f[1]); c.quadraticCurveTo(f[2], f[3], f[4], f[5]); c.stroke(); });
    ell(c, it.nuc[0], it.nuc[1], it.nuc[2], it.nuc[3], it.nuc[4]);
    c.fillStyle = mb ? 'rgba(34,58,160,.80)' : 'rgba(140,146,138,' + (0.14 + 0.2 * P.pc).toFixed(3) + ')'; c.fill();
    c.strokeStyle = mb ? 'rgba(20,34,110,.9)' : 'rgba(80,86,80,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = 0.5; c.stroke();
    c.fillStyle = mb ? 'rgba(28,46,150,.85)' : 'rgba(84,88,84,' + eA(P, 0.45).toFixed(3) + ')';
    it.bact.forEach(b => { c.beginPath(); c.arc(b[0], b[1], 0.55, 0, TAU); c.fill(); });
  };

  /* ---------- the root-tip squash: every cell caught somewhere in its cycle ---------- */
  function chromo(c, x, y, L, a, w) { c.beginPath(); c.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); c.lineTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); c.lineWidth = w; c.stroke(); }
  PAINT.rootTile = (c, it, P) => {
    const k = P.k, orc = P.stain !== 'none';
    c.fillStyle = orc ? 'rgba(236,172,196,.24)' : 'rgba(200,200,196,.06)'; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill();
    c.strokeStyle = orc ? 'rgba(196,120,156,.5)' : 'rgba(96,100,96,' + eA(P, 0.4).toFixed(3) + ')'; c.lineWidth = Math.max(0.45, 0.8 * k); c.lineJoin = 'round';
    c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.stroke();
    const chrom = orc ? 'rgba(112,18,72,.9)' : 'rgba(96,98,96,' + eA(P, 0.45).toFixed(3) + ')';
    const nucF = orc ? 'rgba(176,64,126,.55)' : 'rgba(150,152,148,' + (0.1 + 0.2 * P.pc).toFixed(3) + ')';
    it.cells.forEach(cl => {
      c.save(); P.local(c, cl.cx, cl.cy, cl.a);
      const w = cl.w, h = cl.h, r = cl.seed;
      c.strokeStyle = chrom; c.lineCap = 'round';
      if (cl.phase === 'I') {
        ell(c, 0, 0, 4.6, 4.2, 0); c.fillStyle = nucF; c.fill();
        c.fillStyle = orc ? 'rgba(96,12,58,.85)' : chrom; c.beginPath(); c.arc(0.8, -0.6, 1.1, 0, TAU); c.fill();
      } else if (cl.phase === 'P') {                    // threads condensing inside the nucleus
        ell(c, 0, 0, 5, 4.6, 0); c.fillStyle = orc ? 'rgba(200,110,160,.3)' : nucF; c.fill();
        c.lineWidth = 0.55;
        for (let i = 0; i < 16; i++) { const a0 = hash2(r, i, 1) * TAU, rr = 1 + hash2(r, i, 2) * 3; c.beginPath(); c.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr); c.bezierCurveTo(Math.cos(a0 + 1) * (rr + 1.2), Math.sin(a0 + 1) * (rr + 1.2), Math.cos(a0 + 2) * (rr - 0.6), Math.sin(a0 + 2) * (rr - 0.6), Math.cos(a0 + 2.6) * rr, Math.sin(a0 + 2.6) * rr); c.stroke(); }
      } else if (cl.phase === 'M') {                    // lined up across the middle
        for (let i = 0; i < 16; i++) { const yy = -h * 0.36 + h * 0.72 * i / 15 + (hash2(r, i, 3) - 0.5) * 0.8; chromo(c, (hash2(r, i, 4) - 0.5) * 0.9, yy, 2.6 + hash2(r, i, 5) * 1.4, (hash2(r, i, 6) - 0.5) * 0.7, 0.95); }
      } else if (cl.phase === 'A') {                    // pulled apart towards the two ends
        const sep = w * (0.12 + 0.2 * (cl.f || 0.5));
        [-1, 1].forEach(sd => { for (let i = 0; i < 16; i++) { const yy = -h * 0.3 + h * 0.6 * i / 15; const xx = sd * sep; c.lineWidth = 0.85; c.beginPath(); c.moveTo(xx + sd * 1.6, yy - 0.9); c.lineTo(xx, yy); c.lineTo(xx + sd * 1.6, yy + 0.9); c.stroke(); } });
      } else if (cl.phase === 'T') {                    // two nuclei re-forming, the new wall between them
        [-1, 1].forEach(sd => { ell(c, sd * w * 0.3, 0, 3.4, 3.8, 0); c.fillStyle = orc ? 'rgba(150,40,100,.72)' : nucF; c.fill(); });
        c.strokeStyle = orc ? 'rgba(170,90,130,.7)' : chrom; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -h * 0.42); c.lineTo(0, h * 0.42); c.stroke();
      }
      c.restore();
    });
  };

  /* ---------- Elodea: brick-shaped leaf cells lined with chloroplasts that stream ---------- */
  PAINT.elodeaTile = (c, it, P) => {
    const k = P.k;
    c.fillStyle = 'rgba(190,220,160,.12)'; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill();
    c.strokeStyle = 'rgba(80,110,70,' + eA(P, 0.6).toFixed(3) + ')'; c.lineWidth = Math.max(0.5, 1.2 * k);
    c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.stroke();
    if (k * 5 < 1.2) { c.fillStyle = 'rgba(70,150,60,.35)'; c.beginPath(); it.cells.forEach(cl => polyPath(c, P, cl.v)); c.fill(); return; }
    const t = P.t;
    c.fillStyle = 'rgba(58,142,52,.72)';
    it.cells.forEach(cl => {
      const [x0, y0, x1, y1] = cl.box, per = 2 * ((x1 - x0) + (y1 - y0)) - 8, speed = cl.speed;
      c.beginPath();
      for (let i = 0; i < cl.n; i++) {                  // round the cell wall, the way cyclosis carries them
        let s = ((i / cl.n) * per + t * speed + cl.off) % per; if (s < 0) s += per;
        const W = x1 - x0 - 4, H = y1 - y0 - 4; let x, y;
        if (s < W) { x = x0 + 2 + s; y = y0 + 2; } else if (s < W + H) { x = x1 - 2; y = y0 + 2 + (s - W); } else if (s < 2 * W + H) { x = x1 - 2 - (s - W - H); y = y1 - 2; } else { x = x0 + 2; y = y1 - 2 - (s - 2 * W - H); }
        const X = P.X(x), Y = P.Y(y); c.moveTo(X + 2.6 * k, Y); c.ellipse(X, Y, 2.6 * k, 1.8 * k, 0, 0, TAU);
      }
      c.fill();
      const [bx0, by0, bx1, by1] = cl.box;                // the ones lying on the upper and lower faces, still
      c.beginPath();
      for (let i = 0; i < cl.inner; i++) { const X = P.X(bx0 + 5 + hash2(i, cl.off * 10, 3) * (bx1 - bx0 - 10)), Y = P.Y(by0 + 5 + hash2(cl.off * 10, i, 4) * (by1 - by0 - 10)); c.moveTo(X + 2.5 * k, Y); c.ellipse(X, Y, 2.5 * k, 1.9 * k, hash2(i, 1, 5) * 3, 0, TAU); }
      c.fillStyle = 'rgba(70,150,60,.45)'; c.fill(); c.fillStyle = 'rgba(58,142,52,.72)';
    });
  };

  /* ---------- yeast: budding ovals; methylene blue stays blue only in the dead ---------- */
  PAINT.yeast = (c, it, P) => {
    P.local(c, it.x, it.y, it.a);
    const blue = P.stain === 'mb' && it.dead;
    const body = (x, y, rx, ry) => { ell(c, x, y, rx, ry, 0); c.fillStyle = it.dye ? 'rgba(206,58,52,.78)' : blue ? 'rgba(52,92,196,.72)' : 'rgba(196,194,170,' + (0.2 + 0.16 * P.pc).toFixed(3) + ')'; c.fill(); c.strokeStyle = blue ? 'rgba(30,56,150,.9)' : 'rgba(60,62,52,' + clamp(0.45 + 0.5 * P.pc, 0, 0.92).toFixed(3) + ')'; c.lineWidth = 0.5; c.stroke(); };
    body(0, 0, it.rx, it.ry);
    if (it.bud > 0.02) { const s = Math.sqrt(it.bud), bx = it.rx + s * it.rx * 0.78; body(bx * Math.cos(it.ba), bx * Math.sin(it.ba), it.rx * s * 0.82, it.ry * s * 0.82); }
    if (!blue) { c.strokeStyle = 'rgba(90,94,84,' + eA(P, 0.3).toFixed(3) + ')'; c.lineWidth = 0.22; ell(c, -it.rx * 0.18, 0.1, it.rx * 0.42, it.ry * 0.46, 0); c.stroke(); }
  };
  PAINT.gonidium = (c, it, P) => {                   // a Volvox germ cell: big, green, no flagella
    P.local(c, it.x, it.y, it.a);
    ell(c, 0, 0, it.r, it.r, 0); c.fillStyle = 'rgba(46,128,42,.72)'; c.fill();
    c.strokeStyle = 'rgba(28,80,26,.8)'; c.lineWidth = Math.max(0.3, it.r * 0.05); c.stroke();
    ell(c, -it.r * 0.25, -it.r * 0.2, it.r * 0.3, it.r * 0.26, 0); c.fillStyle = 'rgba(24,70,22,.55)'; c.fill();
  };
  PAINT.co2 = (c, it, P) => {                         // a gas bubble from fermenting yeast
    const r = it.r * P.k, x = P.X(it.x), y = P.Y(it.y); if (r < 0.5) return;
    c.strokeStyle = 'rgba(20,22,26,.85)'; c.lineWidth = Math.max(0.8, r * 0.22); c.beginPath(); c.arc(x, y, r * 0.88, 0, TAU); c.stroke();
  };

  /* ---------- Brown's particles and the grains he tested them against ---------- */
  PAINT.particle = (c, it, P) => {
    const r = it.d / 2;
    if (r * P.k < 0.35) return;
    c.save(); P.local(c, it.x, it.y, it.a || 0);
    ell(c, 0, 0, r * (it.el || 1), r, 0);
    c.fillStyle = 'rgba(120,118,104,' + (0.22 + 0.3 * P.pc).toFixed(3) + ')'; c.fill();
    c.strokeStyle = 'rgba(40,40,36,' + eA(P, 0.7).toFixed(3) + ')'; c.lineWidth = Math.max(0.2, r * 0.25); c.stroke();
    c.restore();
  };
  PAINT.pollen = (c, it, P) => {                      // Clarkia: a three-cornered grain with a swollen pore at each corner
    P.local(c, it.x, it.y, it.a);
    const s = it.s / 2, pts = [];
    for (let i = 0; i < 60; i++) {
      const th = i / 60 * TAU; let r = s * 0.62;
      for (let k = 0; k < 3; k++) { let d = Math.atan2(Math.sin(th - k * TAU / 3), Math.cos(th - k * TAU / 3)); r += s * 0.46 * Math.exp(-(d / 0.3) * (d / 0.3)); }
      pts.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    smooth(c, pts);
    const g = c.createRadialGradient(-s * 0.15, -s * 0.15, s * 0.1, 0, 0, s * 1.1);
    g.addColorStop(0, it.burst ? 'rgba(226,206,150,.32)' : 'rgba(222,190,110,.5)'); g.addColorStop(1, it.burst ? 'rgba(186,150,80,.42)' : 'rgba(172,128,52,.7)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(104,74,26,.9)'; c.lineWidth = 1.8; c.stroke();
    c.save(); smooth(c, pts); c.clip();
    c.fillStyle = 'rgba(120,88,34,.3)';
    for (let i = 0; i < 160; i++) { const a = hash2(it.seed, i, 1) * TAU, rr = Math.sqrt(hash2(it.seed, i, 2)) * s * 0.9; c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.8 + hash2(it.seed, i, 6), 0, TAU); c.fill(); }
    c.restore();
    for (let k = 0; k < 3; k++) {                       // the pores: a thin lid over a swollen rim
      const a = k * TAU / 3, cx = Math.cos(a) * s * 0.98, cy = Math.sin(a) * s * 0.98;
      ell(c, cx, cy, s * 0.16, s * 0.2, a); c.fillStyle = 'rgba(240,226,188,.75)'; c.fill();
      c.strokeStyle = 'rgba(120,88,34,.85)'; c.lineWidth = 1.2; c.stroke();
    }
  };
  PAINT.grain = (c, it, P) => {
    P.local(c, it.x, it.y, it.a);
    c.beginPath(); it.v.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath();
    const sz = it.r;
    if (it.type === 'quartz') {
      c.fillStyle = 'rgba(226,230,228,.12)'; c.fill();
      c.strokeStyle = 'rgba(34,38,40,' + eA(P, 0.85).toFixed(3) + ')'; c.lineWidth = Math.max(0.6, sz * 0.07); c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = 'rgba(90,96,98,' + eA(P, 0.25).toFixed(3) + ')'; c.lineWidth = Math.max(0.3, sz * 0.02);
      c.beginPath(); c.moveTo(-sz * 0.3, -sz * 0.1); c.lineTo(sz * 0.2, sz * 0.25); c.stroke();
    } else if (it.type === 'feldspar') {
      c.fillStyle = 'rgba(206,196,178,.5)'; c.fill();
      c.strokeStyle = 'rgba(70,64,56,' + eA(P, 0.8).toFixed(3) + ')'; c.lineWidth = Math.max(0.6, sz * 0.06); c.stroke();
      c.save(); c.clip(); c.strokeStyle = 'rgba(120,112,100,.35)'; c.lineWidth = Math.max(0.3, sz * 0.02);
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-sz, i * sz * 0.28 - sz * 0.3); c.lineTo(sz, i * sz * 0.28 + sz * 0.3); c.stroke(); } c.restore();
    } else if (it.type === 'mica') {
      c.fillStyle = 'rgba(214,206,170,.22)'; c.fill();
      c.strokeStyle = 'rgba(120,110,80,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = Math.max(0.3, sz * 0.025); c.stroke();
    } else {
      c.fillStyle = 'rgba(150,128,96,.5)'; c.fill();
      c.strokeStyle = 'rgba(80,66,46,.7)'; c.lineWidth = Math.max(0.3, sz * 0.08); c.stroke();
    }
  };

  /* ---------- salt: cubes with hopper steps, and the edge of the drying drop ---------- */
  PAINT.salt = (c, it, P) => {
    const e = it.e; if (e * P.k < 0.6) return;
    P.local(c, it.x, it.y, it.a);
    c.fillStyle = 'rgba(214,220,226,.16)'; c.fillRect(-e / 2, -e / 2, e, e);
    c.strokeStyle = 'rgba(26,30,36,.86)'; c.lineWidth = Math.max(0.5, e * 0.045); c.lineJoin = 'miter'; c.strokeRect(-e / 2, -e / 2, e, e);
    c.strokeStyle = 'rgba(60,66,74,.5)'; c.lineWidth = Math.max(0.3, e * 0.018);
    [0.72, 0.48, 0.26].forEach(f => c.strokeRect(-e * f / 2, -e * f / 2, e * f, e * f));
    c.strokeStyle = 'rgba(60,66,74,.28)';
    c.beginPath(); c.moveTo(-e / 2, -e / 2); c.lineTo(-e * 0.13, -e * 0.13); c.moveTo(e / 2, -e / 2); c.lineTo(e * 0.13, -e * 0.13); c.moveTo(e / 2, e / 2); c.lineTo(e * 0.13, e * 0.13); c.moveTo(-e / 2, e / 2); c.lineTo(-e * 0.13, e * 0.13); c.stroke();
  };
  PAINT.dropEdge = (c, it, P) => {
    if (it.R <= 0) return;
    c.strokeStyle = 'rgba(52,60,70,.62)'; c.lineWidth = px(P, 14, 1.4); c.beginPath(); c.arc(P.X(it.x), P.Y(it.y), it.R * P.k, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(120,130,140,.35)'; c.lineWidth = px(P, 5, 0.8); c.beginPath(); c.arc(P.X(it.x), P.Y(it.y), (it.R - 22) * P.k, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(220,226,232,.10)'; c.beginPath(); c.arc(P.X(it.x), P.Y(it.y), it.R * P.k, 0, TAU); c.fill();
  };
  PAINT.saltCrust = (c, it, P) => {                   // the ring of tiny crystals left where the drop's edge has been
    c.fillStyle = 'rgba(70,76,84,.4)';
    it.pts.forEach(q => { const s = q[2] * P.k; if (s < 0.4) return; c.fillRect(P.X(q[0]) - s / 2, P.Y(q[1]) - s / 2, s, s); });
  };

  /* ---------- Paramecium: the slipper, its cilia, its vacuoles ---------- */
  function slipper(L, W) {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const u = i / 48 * TAU, cx = Math.cos(u), sn = Math.sin(u);
      const x = cx * L / 2;
      let half = W / 2 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(cx), 2.4))) * (1 + 0.16 * (-cx));
      if (sn < 0) half *= 1 - 0.26 * Math.exp(-Math.pow((cx - 0.18) / 0.34, 2));      // the oral groove side
      pts.push([x, Math.sign(sn || 1) * half]);
    }
    return pts;
  }
  PAINT.paramecium = (c, it, P) => {
    P.local(c, it.x, it.y, it.a);
    const L = it.L * (1 - 0.25 * (it.shrink || 0)), W = it.W * (1 - (it.shrink || 0)), key = L.toFixed(1) + ',' + W.toFixed(1), t = P.t;
    if (it._pk !== key) { it._pts = slipper(L, W); it._pk = key; }
    const pts = it._pts;
    smooth(c, pts);
    c.fillStyle = 'rgba(166,186,148,' + (0.36 + 0.12 * P.pc).toFixed(3) + ')'; c.fill();
    c.save(); c.clip();
    c.fillStyle = 'rgba(104,118,92,.3)';
    for (let i = 0; i < 140; i++) { const u = hash2(it.seed, i, 7), v = hash2(it.seed, i, 8); c.beginPath(); c.arc((u - 0.5) * L * 0.9, (v - 0.5) * W * 0.8, 0.9 + hash2(it.seed, i, 9) * 1.3, 0, TAU); c.fill(); }
    // the macronucleus
    ell(c, -L * 0.02, W * 0.04, L * 0.16, W * 0.2, 0.2); c.fillStyle = 'rgba(146,156,132,.32)'; c.fill(); c.strokeStyle = 'rgba(82,92,72,' + eA(P, 0.45).toFixed(3) + ')'; c.lineWidth = 0.8; c.stroke();
    // the oral groove, running back to the gullet
    c.strokeStyle = 'rgba(80,92,70,' + eA(P, 0.55).toFixed(3) + ')'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(L * 0.42, -W * 0.18); c.quadraticCurveTo(L * 0.2, -W * 0.32, L * 0.02, -W * 0.18); c.stroke();
    ell(c, L * 0.02, -W * 0.12, 5, 3.4, 0.4); c.fillStyle = 'rgba(96,108,84,.4)'; c.fill();
    // food vacuoles, carried round the cell
    (it.fv || []).forEach(v => {
      const u = v.u * TAU, x = Math.cos(u) * L * 0.32, y = Math.sin(u) * W * 0.24;
      ell(c, x, y, v.r, v.r, 0);
      c.fillStyle = v.dye ? rgba(congo(v.pH), 0.72) : 'rgba(170,176,150,.45)'; c.fill();
      c.strokeStyle = 'rgba(60,66,50,.6)'; c.lineWidth = 0.5; c.stroke();
    });
    // contractile vacuoles: the canals fill first, then the vacuole, then it empties at once
    (it.cv || [0, 0]).forEach((f, i) => {
      const x = (i ? -1 : 1) * L * 0.29, y = W * 0.2, canal = clamp(1 - f * 1.6, 0, 1);
      if (canal > 0.05) { c.strokeStyle = 'rgba(92,104,84,' + (eA(P, 0.5) * canal).toFixed(3) + ')'; c.lineWidth = 1.1; for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); c.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 12); c.stroke(); } }
      const r = 7.5 * Math.cbrt(clamp(f, 0, 1));
      if (r > 0.6) { ell(c, x, y, r, r, 0); c.fillStyle = 'rgba(236,240,232,.5)'; c.fill(); c.strokeStyle = 'rgba(64,72,58,' + eA(P, 0.7).toFixed(3) + ')'; c.lineWidth = 0.7; c.stroke(); }
    });
    c.restore();
    c.strokeStyle = 'rgba(56,70,50,' + clamp(0.55 + 0.4 * P.pc, 0, 0.95).toFixed(3) + ')'; c.lineWidth = 1.5; smooth(c, pts); c.stroke();
    c.strokeStyle = 'rgba(120,136,108,.35)'; c.lineWidth = 2.5; c.save(); smooth(c, pts); c.clip(); smooth(c, pts); c.stroke(); c.restore();   // the band of trichocysts under the pellicle
    // the cilia: a wave runs down them (drawn slowed); when they stop they stand still
    if (P.k * 0.4 > 0.12) {
      c.strokeStyle = 'rgba(88,100,80,' + eA(P, 0.42).toFixed(3) + ')'; c.lineWidth = 0.35;
      c.beginPath();
      const n = pts.length;
      let sAcc = 0;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n], seg = Math.hypot(q[0] - p[0], q[1] - p[1]);
        const nx = (q[1] - p[1]) / seg, ny = -(q[0] - p[0]) / seg;
        for (let d = 0; d < seg; d += 2.6) {
          const x = p[0] + (q[0] - p[0]) * d / seg, y = p[1] + (q[1] - p[1]) * d / seg, s = sAcc + d;
          const ph = it.stop ? 0.3 : Math.sin(s / 11 - t * 7 * (it.beat || 1)) * 0.6, len = 9;
          const tx = nx * Math.cos(ph) - (-ny) * Math.sin(ph) * 0.8, ty = ny * Math.cos(ph) - nx * Math.sin(ph) * 0.8;
          c.moveTo(x, y); c.lineTo(x + tx * len - 2.6, y + ty * len);
        }
        sAcc += seg;
      }
      c.stroke();
    }
  };

  /* ---------- Euglena: a green spindle with an eyespot, rowing with one flagellum ---------- */
  PAINT.euglena = (c, it, P) => {
    P.local(c, it.x, it.y, it.a);
    const L = it.L, W = it.W * (1 + 0.5 * (it.meta || 0) * Math.sin(P.t * 1.3 + it.seed)), t = P.t, pts = [];
    for (let i = 0; i < 36; i++) { const u = i / 36 * TAU, cx = Math.cos(u); let half = W / 2 * Math.sqrt(Math.max(0, 1 - cx * cx)) * (cx > 0 ? 1 : (1 - 0.55 * (-cx) * (-cx))) * (1 + 0.25 * (it.meta || 0) * Math.sin(u * 2 + t)); pts.push([cx * L / 2, Math.sin(u) >= 0 ? half : -half]); }
    smooth(c, pts); c.fillStyle = 'rgba(166,208,134,.34)'; c.fill();
    c.save(); c.clip();
    c.fillStyle = 'rgba(52,140,50,.62)';
    for (let i = 0; i < 16; i++) { const u = hash2(it.seed, i, 3), v = hash2(it.seed, i, 4); ell(c, (u - 0.55) * L * 0.72, (v - 0.5) * W * 0.62, 3.2, 1.9, u * 3); c.fill(); }
    c.strokeStyle = 'rgba(80,120,70,.22)'; c.lineWidth = 0.5;
    for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(-L / 2 + i * 7, -W); c.lineTo(-L / 2 + i * 7 + 14, W); c.stroke(); }
    ell(c, L * 0.02, 0, 5.5, 4.2, 0); c.fillStyle = 'rgba(200,212,190,.35)'; c.fill();
    c.restore();
    c.strokeStyle = 'rgba(60,96,52,' + eA(P, 0.72).toFixed(3) + ')'; c.lineWidth = 0.7; smooth(c, pts); c.stroke();
    ell(c, L * 0.36, W * 0.16, 1.8, 1.5, 0); c.fillStyle = 'rgba(224,64,28,.9)'; c.fill();       // the eyespot
    ell(c, L * 0.42, 0, 2.6, 2, 0); c.strokeStyle = 'rgba(70,96,60,.5)'; c.lineWidth = 0.4; c.stroke();
    if (P.k * 0.5 > 0.1) {
      c.strokeStyle = 'rgba(70,90,64,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = 0.45; c.beginPath(); c.moveTo(L * 0.44, 0);
      for (let s = 0; s <= L; s += 1.5) c.lineTo(L * 0.44 + s, Math.sin(s / 7 - t * 9) * (2 + s * 0.12));
      c.stroke();
    }
  };

  /* ---------- Amoeba: flowing out into pseudopods ---------- */
  PAINT.amoeba = (c, it, P) => {
    P.local(c, it.x, it.y, 0);
    const R = it.R, pts = [], n = 44;
    for (let i = 0; i < n; i++) {
      const th = i / n * TAU; let r = R * 0.62;
      it.pods.forEach(pd => { let d = Math.atan2(Math.sin(th - pd.a), Math.cos(th - pd.a)); r += pd.len * Math.exp(-(d / pd.w) * (d / pd.w)); });
      r *= 1 + 0.035 * Math.sin(th * 5 + it.seed);
      pts.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    smooth(c, pts); c.fillStyle = 'rgba(206,210,198,.10)'; c.fill();
    c.strokeStyle = 'rgba(70,76,64,' + eA(P, 0.62).toFixed(3) + ')'; c.lineWidth = 1.1; c.stroke();
    const inner = pts.map(q => [q[0] * 0.86, q[1] * 0.86]);
    smooth(c, inner); c.fillStyle = 'rgba(168,172,156,.26)'; c.fill();
    c.save(); smooth(c, inner); c.clip();
    c.fillStyle = 'rgba(96,100,86,.30)';
    c.beginPath();
    for (let i = 0; i < 900; i++) { const a = hash2(it.seed, i, 1) * TAU, rr = Math.sqrt(hash2(it.seed, i, 2)) * R * 1.35, fl = P.t * 0.35 * (1 + hash2(it.seed, i, 5)); const x = Math.cos(a + fl * 0.1) * rr, y = Math.sin(a + fl * 0.1) * rr, q = 0.7 + hash2(it.seed, i, 3) * 1.5; c.moveTo(x + q, y); c.arc(x, y, q, 0, TAU); }
    c.fill();
    c.strokeStyle = 'rgba(60,64,56,.45)'; c.lineWidth = 0.5;
    for (let i = 0; i < 40; i++) { const a = hash2(it.seed, i, 11) * TAU, rr = Math.sqrt(hash2(it.seed, i, 12)) * R * 1.1, x = Math.cos(a) * rr, y = Math.sin(a) * rr; c.strokeRect(x - 1.4, y - 1, 2.8, 2); }
    ell(c, it.nuc[0], it.nuc[1], 22, 17, 0.4); c.fillStyle = 'rgba(150,154,140,.36)'; c.fill(); c.strokeStyle = 'rgba(80,86,74,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = 0.9; c.stroke();
    ell(c, it.cvp[0], it.cvp[1], 9 * Math.cbrt(clamp(it.cv || 0, 0, 1)) + 0.1, 9 * Math.cbrt(clamp(it.cv || 0, 0, 1)) + 0.1, 0); c.fillStyle = 'rgba(238,240,234,.6)'; c.fill(); c.strokeStyle = 'rgba(80,86,74,' + eA(P, 0.55).toFixed(3) + ')'; c.lineWidth = 0.6; c.stroke();
    (it.fv || []).forEach(v => { ell(c, v.x, v.y, v.r, v.r, 0); c.fillStyle = v.dye ? rgba(congo(v.pH), 0.7) : 'rgba(160,166,140,.5)'; c.fill(); });
    c.restore();
  };

  /* ---------- Chlamydomonas and the colonies built of cells like it ---------- */
  function chlamyCell(c, x, y, r, a, t, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.rotate(a);
    ell(c, 0, 0, r, r * 0.84, 0); c.fillStyle = 'rgba(200,222,184,.28)'; c.fill();
    c.beginPath(); c.ellipse(-r * 0.12, 0, r * 0.82, r * 0.7, 0, Math.PI * 0.32, Math.PI * 1.68); c.ellipse(r * 0.05, 0, r * 0.45, r * 0.4, 0, Math.PI * 1.6, Math.PI * 0.4, true); c.closePath();
    c.fillStyle = o.germ ? 'rgba(40,122,40,.82)' : 'rgba(58,146,50,.72)'; c.fill();
    if (r > 2.2) { ell(c, -r * 0.4, 0, r * 0.2, r * 0.2, 0); c.fillStyle = 'rgba(30,86,30,.8)'; c.fill(); }
    if (o.eye !== false && r > 2) { ell(c, r * 0.3, r * 0.62, r * 0.13, r * 0.1, 0); c.fillStyle = 'rgba(222,54,26,.9)'; c.fill(); }
    c.strokeStyle = 'rgba(60,90,54,.7)'; c.lineWidth = Math.max(0.2, r * 0.06); ell(c, 0, 0, r, r * 0.84, 0); c.stroke();
    if (o.flag !== false) {
      c.strokeStyle = 'rgba(70,92,64,.55)'; c.lineWidth = Math.max(0.18, r * 0.04);
      const sw = o.still ? 0.6 : 0.9 * Math.sin(t * 9 + (o.ph || 0));
      [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(r * 0.95, sd * r * 0.12); c.bezierCurveTo(r * 1.6, sd * r * (0.3 + 0.4 * sw), r * 1.9, sd * r * (0.9 + 0.6 * sw), r * (1.5 - 0.4 * sw), sd * r * (1.5 + 0.5 * sw)); c.stroke(); });
    }
    c.restore();
  }
  PAINT.chlamy = (c, it, P) => { P.local(c, it.x, it.y, it.a); chlamyCell(c, 0, 0, it.r || 5, 0, P.t, { still: it.stop, ph: it.seed }); };
  /* points on a sphere, turned with the colony */
  function sphereCells(n, seed) { const out = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), th = ga * i + seed; out.push([Math.cos(th) * r, y, Math.sin(th) * r]); } return out; }
  function spinOf(p, a, b) { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); const y2 = p[1] * Math.cos(b) - z1 * Math.sin(b), z2 = p[1] * Math.sin(b) + z1 * Math.cos(b); return [x1, y2, z2]; }
  PAINT.gonium = (c, it, P) => {
    P.local(c, it.x, it.y, it.a + (it.spin || 0));
    const s = 11;
    c.beginPath(); if (c.roundRect) c.roundRect(-2.4 * s, -2.4 * s, 4.8 * s, 4.8 * s, s); else c.rect(-2.4 * s, -2.4 * s, 4.8 * s, 4.8 * s);
    c.fillStyle = 'rgba(214,226,210,.14)'; c.fill(); c.strokeStyle = 'rgba(110,130,104,' + eA(P, 0.35).toFixed(3) + ')'; c.lineWidth = 0.6; c.stroke();
    const pos = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; pos.push([Math.cos(a) * 1.62, Math.sin(a) * 1.62]); }
    pos.forEach((q, i) => chlamyCell(c, q[0] * s, q[1] * s, 5, i < 4 ? i * 1.3 : Math.atan2(q[1], q[0]), P.t, { flag: i >= 4 && !it.split, still: it.stop, ph: i }));
  };
  function ballColony(c, it, P, n, R, rc, o) {
    P.local(c, it.x, it.y, it.a);
    const pts = it._sph || (it._sph = sphereCells(n, it.seed || 0)), a = (it.spin || 0), b = 0.5;
    ell(c, 0, 0, R * 1.12, R * 1.12, 0); c.fillStyle = 'rgba(214,228,210,.10)'; c.fill(); c.strokeStyle = 'rgba(110,136,104,' + eA(P, 0.4).toFixed(3) + ')'; c.lineWidth = Math.max(0.4, R * 0.012); c.stroke();
    const q = pts.map((p, i) => [spinOf(p, a, b), i]).sort((u, v) => u[0][2] - v[0][2]);
    q.forEach(([p, i]) => {
      const germ = o.germ && o.germ(i, p), r = germ ? rc * o.gk : rc, back = p[2] < 0;
      c.globalAlpha = back ? 0.55 : 1;
      if (o.dots && !germ) { ell(c, p[0] * R, p[1] * R, r, r, 0); c.fillStyle = 'rgba(58,146,50,.78)'; c.fill(); }
      else chlamyCell(c, p[0] * R, p[1] * R, r * (0.75 + 0.25 * Math.abs(p[2])), Math.atan2(p[1], p[0]), P.t, { flag: !back && !o.noFlag && !it.stop, germ, eye: !germ, still: it.stop, ph: i });
    });
    c.globalAlpha = 1;
  }
  PAINT.pandorina = (c, it, P) => ballColony(c, it, P, 16, 17, 8.5, {});
  PAINT.eudorina = (c, it, P) => ballColony(c, it, P, 32, 44, 6.5, {});
  PAINT.pleodorina = (c, it, P) => ballColony(c, it, P, 128, 92, 4.6, { germ: (i, p) => p[1] > -0.05, gk: 1.55 });
  PAINT.volvox = (c, it, P) => {
    P.local(c, it.x, it.y, it.a);
    const R = it.R || 250;
    ell(c, 0, 0, R, R, 0); c.fillStyle = 'rgba(206,226,196,.16)'; c.fill();
    const pts = it._sph || (it._sph = sphereCells(it.n || 1800, it.seed || 0)), a = it.spin || 0;
    if (P.k * R > 30) {
      c.fillStyle = 'rgba(56,140,48,.8)';
      c.beginPath();
      pts.forEach(p => { const q = spinOf(p, a, 0.4); const r = 2.2 * (q[2] < 0 ? 0.8 : 1); c.moveTo(q[0] * R + r, q[1] * R); c.arc(q[0] * R, q[1] * R, r, 0, TAU); });
      c.fill();
    }
    c.strokeStyle = 'rgba(64,120,56,' + eA(P, 0.6).toFixed(3) + ')'; c.lineWidth = Math.max(0.6, R * 0.012); ell(c, 0, 0, R, R, 0); c.stroke();
    (it.daughters || []).forEach(d => {
      const q = spinOf(d.p, a, 0.4), r = d.r;
      ell(c, q[0] * R * 0.62, q[1] * R * 0.62, r, r, 0); c.fillStyle = 'rgba(44,124,40,' + (0.34 + 0.3 * (d.g || 1)).toFixed(3) + ')'; c.fill();
      c.strokeStyle = 'rgba(30,90,30,.7)'; c.lineWidth = Math.max(0.4, r * 0.04); c.stroke();
    });
  };

  /* ---------- a leaf in cross-section, stained: lignin red, cellulose green ---------- */
  PAINT.leafTile = (c, it, P) => {
    const k = P.k;
    it.cells.forEach(cl => {
      c.beginPath(); polyPath(c, P, cl.v);
      c.fillStyle = cl.fill; c.fill();
      c.strokeStyle = cl.wall; c.lineWidth = Math.max(0.45, (cl.lw || 1.2) * k); c.stroke();
      if (cl.chl && k * 3 > 1.4) { c.fillStyle = 'rgba(52,138,46,.75)'; cl.chl.forEach(q => { c.beginPath(); c.arc(P.X(q[0]), P.Y(q[1]), 1.9 * k, 0, TAU); c.fill(); }); }
    });
  };

  /* ---------- bacteria, blood, and a drop too fine to show anything ---------- */
  PAINT.bactTile = (c, it, P) => {
    const k = P.k, col = it.stain === 'none' ? 'rgba(90,92,88,' + eA(P, 0.5).toFixed(3) + ')' : 'rgba(92,40,150,.82)';
    c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
    it.rods.forEach(b => { c.lineWidth = Math.max(0.3, b[4] * k); c.beginPath(); c.moveTo(P.X(b[0]), P.Y(b[1])); c.lineTo(P.X(b[2]), P.Y(b[3])); c.stroke(); });
    it.cocci.forEach(b => { c.beginPath(); c.arc(P.X(b[0]), P.Y(b[1]), Math.max(0.3, b[2] * k), 0, TAU); c.fill(); });
  };
  PAINT.swimmer = (c, it, P) => {                      // a moving bacterium: a rod or a spiral
    c.save(); P.local(c, it.x, it.y, it.a);
    c.strokeStyle = 'rgba(80,82,78,' + eA(P, 0.6).toFixed(3) + ')'; c.lineCap = 'round';
    if (it.spiral) { c.lineWidth = 0.5; c.beginPath(); for (let s = -it.L / 2; s <= it.L / 2; s += 0.3) { const y = Math.sin(s * 1.7 + P.t * 6) * 0.9; s === -it.L / 2 ? c.moveTo(s, y) : c.lineTo(s, y); } c.stroke(); }
    else { c.lineWidth = it.w || 0.8; c.beginPath(); c.moveTo(-it.L / 2, 0); c.lineTo(it.L / 2, 0); c.stroke(); }
    c.restore();
  };
  PAINT.bloodTile = (c, it, P) => {
    const k = P.k;
    it.rbc.forEach(b => {
      const x = P.X(b[0]), y = P.Y(b[1]), r = b[2] * k;
      if (r < 0.5) { c.fillStyle = 'rgba(214,130,140,.6)'; c.fillRect(x - 0.5, y - 0.5, 1, 1); return; }
      c.fillStyle = 'rgba(222,134,146,.55)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(176,80,96,.5)'; c.lineWidth = Math.max(0.3, 0.5 * k); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    });
    it.wbc.forEach(w => {
      c.save(); P.local(c, w.x, w.y, w.a);
      ell(c, 0, 0, w.r, w.r, 0); c.fillStyle = w.type === 'lymph' ? 'rgba(160,180,230,.45)' : 'rgba(226,196,214,.5)'; c.fill();
      c.fillStyle = 'rgba(92,40,132,.85)';
      if (w.type === 'lymph') { ell(c, 0.4, 0, w.r * 0.78, w.r * 0.74, 0); c.fill(); }
      else [[-3, -1.5, 2.4], [0.2, 2.2, 2.2], [3.1, -0.8, 2.3], [0.4, -3.2, 1.8]].forEach(q => { ell(c, q[0], q[1], q[2], q[2] * 0.8, 0.5); c.fill(); });
      c.restore();
    });
    c.fillStyle = 'rgba(110,60,150,.8)'; it.plt.forEach(p => { c.beginPath(); c.arc(P.X(p[0]), P.Y(p[1]), Math.max(0.35, 1.2 * k), 0, TAU); c.fill(); });
  };

  /* ---------- the stage micrometer: 1 mm in hundredths ---------- */
  PAINT.micrometer = (c, it, P) => {
    const k = P.k, x0 = it.x - 500, y = it.y;
    c.strokeStyle = 'rgba(14,16,20,.92)'; c.lineCap = 'butt';
    c.lineWidth = Math.max(0.45, 1.6 * k);
    c.beginPath(); c.moveTo(P.X(x0), P.Y(y)); c.lineTo(P.X(x0 + 1000), P.Y(y)); c.stroke();
    for (let i = 0; i <= 100; i++) {
      const x = x0 + i * 10, h = i % 10 === 0 ? 110 : i % 5 === 0 ? 75 : 50;
      if (x < P.x0 - 20 || x > P.x1 + 20) continue;
      c.beginPath(); c.moveTo(P.X(x), P.Y(y)); c.lineTo(P.X(x), P.Y(y + h)); c.stroke();
    }
    c.fillStyle = 'rgba(14,16,20,.9)';
    if (k * 40 > 6) for (let i = 0; i <= 10; i++) { c.save(); P.glyph(c, x0 + i * 100, y + 150); c.font = '600 40px "IBM Plex Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i), 0, 0); c.restore(); }
    if (k * 30 > 4) { c.save(); P.glyph(c, it.x, y - 90); c.font = '600 34px "IBM Plex Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1 mm = 100 × 0.01 mm', 0, 0); c.restore(); }
    c.lineWidth = Math.max(0.5, 3 * k); c.beginPath(); c.arc(P.X(it.x), P.Y(y + 40), 900 * k, 0, TAU); c.stroke();
  };

  /* ---------- a newspaper letter e: ink sunk into a mat of paper fibres ---------- */
  PAINT.newsprint = (c, it, P) => {
    const k = P.k;
    c.fillStyle = 'rgba(206,192,166,.62)'; c.fillRect(0, 0, P.N, P.N);
    if (k * 20 > 1.2) {
      c.lineCap = 'round';
      it.fibres.forEach(f => { c.strokeStyle = f[5]; c.lineWidth = f[4] * k; c.beginPath(); c.moveTo(P.X(f[0]), P.Y(f[1])); c.lineTo(P.X(f[2]), P.Y(f[3])); c.stroke(); });
    }
    c.save(); P.glyph(c, it.x, it.y);
    c.font = '400 ' + it.size + 'px "Times New Roman",Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(28,26,28,.94)'; c.fillText(it.ch || 'e', 0, 0);
    c.globalAlpha = 0.32; [[14, 9], [-12, 7], [6, -12], [-8, -9]].forEach(q => c.fillText(it.ch || 'e', q[0], q[1]));
    c.restore();
    if (k * 8 > 1.5) {                                  // ink wicked along the fibres at the letter's edge, and specks of it
      c.fillStyle = 'rgba(30,28,30,.7)';
      it.specks.forEach(q => { const X = P.X(q[0]), Y = P.Y(q[1]), r = q[2] * k; if (X < -5 || Y < -5 || X > P.N + 5 || Y > P.N + 5) return; c.beginPath(); c.arc(X, Y, Math.max(0.5, r), 0, TAU); c.fill(); });
    }
  };
  /* ---------- a hair: its scales and its core ---------- */
  PAINT.hair = (c, it, P) => {
    c.save(); P.local(c, it.x, it.y, it.a);
    const W = it.W, L = it.L;
    c.fillStyle = 'rgba(150,104,58,.62)'; c.fillRect(-L / 2, -W / 2, L, W);
    c.strokeStyle = 'rgba(90,60,30,.9)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-L / 2, -W / 2); c.lineTo(L / 2, -W / 2); c.moveTo(-L / 2, W / 2); c.lineTo(L / 2, W / 2); c.stroke();
    c.strokeStyle = 'rgba(70,44,20,.55)'; c.lineWidth = 7;
    c.beginPath(); for (let x = -L / 2; x < L / 2; x += 60) { if (hash2(it.seed, Math.round(x), 1) < 0.25) continue; c.moveTo(x, 0); c.lineTo(x + 40, 0); } c.stroke();
    c.strokeStyle = 'rgba(100,70,40,.4)'; c.lineWidth = 0.9;
    if (P.k * 8 > 2) for (let x = -L / 2; x < L / 2; x += 7.5) { c.beginPath(); c.moveTo(x, -W / 2); c.quadraticCurveTo(x + 5, 0, x + 1, W / 2); c.stroke(); }
    c.restore();
  };

  /* ---------- a diatom: glass boxes, and rows of pores finer than a micrometre ---------- */
  PAINT.diatom = (c, it, P) => {
    c.save(); P.local(c, it.x, it.y, it.a);
    const L = it.L, W = it.W, sig = !!it.sigmoid, path = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40 * 2 - 1, x = u * L / 2, off = sig ? Math.sin(u * Math.PI) * W * 0.9 : 0; path.push([x, off + W / 2 * Math.sqrt(Math.max(0, 1 - u * u))]); }
    for (let i = 40; i >= 0; i--) { const u = i / 40 * 2 - 1, x = u * L / 2, off = sig ? Math.sin(u * Math.PI) * W * 0.9 : 0; path.push([x, off - W / 2 * Math.sqrt(Math.max(0, 1 - u * u))]); }
    c.beginPath(); path.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath();
    c.fillStyle = it.living ? 'rgba(186,160,90,.32)' : 'rgba(210,214,208,.14)'; c.fill();
    c.strokeStyle = 'rgba(50,54,48,' + eA(P, 0.8).toFixed(3) + ')'; c.lineWidth = 0.9; c.stroke();
    c.save(); c.clip();
    const sp = it.striae, spPx = sp * P.k;
    if (spPx >= 2.4) {                              // the pores, in the hexagonal rows that give Pleurosigma its name
      const rh = sp * Math.sqrt(3) / 2, rr = sp * 0.3, ext = Math.max(L, W * 3) / 2 + sp;
      c.fillStyle = 'rgba(40,44,40,.62)'; c.beginPath();
      for (let j = -Math.ceil(ext / rh); j <= Math.ceil(ext / rh); j++) {
        const y = j * rh; if (Math.abs(y) > W * 1.6) continue;
        for (let x = -ext + (j & 1 ? sp / 2 : 0); x <= ext; x += sp) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, TAU); }
      }
      c.fill();
    } else { c.fillStyle = 'rgba(80,84,78,.2)'; c.fillRect(-L, -W * 3, 2 * L, 6 * W); }   // finer than the screen: their average tone
    if (it.living) { c.fillStyle = 'rgba(150,110,40,.5)'; ell(c, -L * 0.2, 0, L * 0.18, W * 0.3, 0); c.fill(); ell(c, L * 0.2, 0, L * 0.18, W * 0.3, 0); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(50,54,48,' + eA(P, 0.5).toFixed(3) + ')'; c.lineWidth = 0.7; c.beginPath();
    for (let i = 0; i <= 30; i++) { const u = i / 30 * 2 - 1, x = u * L * 0.46, y = sig ? Math.sin(u * Math.PI) * W * 0.9 : 0; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.restore();
  };

  /* ---------- Vorticella: a bell on a stalk that snaps into a coil ---------- */
  PAINT.vorticella = (c, it, P) => {
    c.save(); P.local(c, it.x, it.y, it.a);
    const ext = 1 - (it.snap || 0), Ls = 110 * (0.2 + 0.8 * ext);
    c.strokeStyle = 'rgba(80,88,74,' + eA(P, 0.6).toFixed(3) + ')'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 0);
    for (let s = 0; s <= Ls; s += 2) c.lineTo(s, (1 - ext) * 6 * Math.sin(s * 0.9)); c.stroke();
    c.translate(Ls, 0);
    c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(22, -8, 36, -21); c.lineTo(40, -19); c.lineTo(40, 19); c.lineTo(36, 21); c.quadraticCurveTo(22, 8, 0, 5); c.closePath();
    c.fillStyle = 'rgba(184,196,170,.34)'; c.fill(); c.strokeStyle = 'rgba(70,82,64,' + eA(P, 0.66).toFixed(3) + ')'; c.lineWidth = 0.9; c.stroke();
    if (ext > 0.5) { c.strokeStyle = 'rgba(88,100,80,' + eA(P, 0.4).toFixed(3) + ')'; c.lineWidth = 0.35; c.beginPath(); for (let i = 0; i < 14; i++) { const y = -19 + i * 38 / 13, ph = Math.sin(P.t * 8 + i); c.moveTo(40, y); c.lineTo(46 + ph, y + ph * 1.5); } c.stroke(); }
    c.restore();
  };

  /* ============================================================
     SLIDES — each built once from its seed, in micrometres, centred
     on the middle of the coverslip
     ============================================================ */
  function makeSlide(kind, items, o) {
    const q = spatial(items, (o && o.cell) || 140);
    return Object.assign({ kind, items, query: q, version: 0 }, o || {});
  }
  function tiles(cells, size, kind, extra) {
    const m = new Map();
    cells.forEach(cl => { const i = Math.floor(cl.cx / size), j = Math.floor(cl.cy / size), key = i + ',' + j; if (!m.has(key)) m.set(key, Object.assign({ kind, x: (i + 0.5) * size, y: (j + 0.5) * size, r: size * 0.75, cells: [] }, extra || {})); m.get(key).cells.push(cl); });
    return [...m.values()];
  }
  function blobIn(x, y, ax, ay, s) { const th = Math.atan2(y / ay, x / ax), r = Math.hypot(x / ax, y / ay); return r < 1 + 0.1 * Math.sin(3 * th + s) + 0.07 * Math.sin(5 * th + 2 * s) + 0.04 * Math.sin(9 * th + s); }
  function mountBits(r, items, W, H, nb, nd) {
    for (let i = 0; i < nb; i++) items.push({ kind: 'bubble', x: (r() - 0.5) * W, y: (r() - 0.5) * H, r: 18 + r() * r() * 150, z: 0, h: 40 });
    for (let i = 0; i < nd; i++) items.push({ kind: 'dust', x: (r() - 0.5) * W * 1.3, y: (r() - 0.5) * H * 1.3, r: 1 + r() * 4, z: 20 * (r() - 0.5), h: 3 });
  }

  /* Hooke's cork: the lab builds the honeycomb (its cells are what it counts); this lays them out to draw */
  function corkSlide(seed, o) {
    const r = rng(seed), cells = (o && o.cells) || [];
    const items = tiles(cells, 240, 'corkTile', { z: 0, h: 30 });
    mountBits(r, items, 3200, 2000, 3, 14);
    return makeSlide('cork', items, { mount: '#FFFFFF', cells, cellSize: 23.5, W: 2600, H: 1300 });
  }

  /* onion skin: courses of long cells whose walls wave together, a nucleus in each */
  function onionSlide(seed) {
    const r = rng(seed), cells = [], rows = [];
    let y = -1200; while (y < 1200) { rows.push(y); y += 50 + r() * 14; }
    const edge = (j, x) => rows[j] + 3.5 * Math.sin(x / 260 + j * 1.7) + 2 * Math.sin(x / 90 + j);
    for (let j = 0; j < rows.length - 1; j++) {
      let x = -2100 - r() * 300;
      while (x < 2100) {
        const len = 170 + r() * 190, x1 = x + len;
        const cx = (x + x1) / 2, cy = (rows[j] + rows[j + 1]) / 2;
        if (blobIn(cx, cy, 2000, 1150, seed)) {
          const v = [[x, edge(j, x)], [x1, edge(j, x1)], [x1, edge(j + 1, x1)], [x, edge(j + 1, x)]];
          const u = 0.2 + r() * 0.6, nh = rows[j + 1] - rows[j];
          const nuc = { x: x + len * u, y: cy + (r() - 0.5) * nh * 0.4, rx: 8.5 + r() * 3, ry: 6.2 + r() * 1.8, a: (r() - 0.5) * 0.4, nl: [[(r() - 0.5) * 4, (r() - 0.5) * 3, 1.3 + r() * 0.6]].concat(r() < 0.4 ? [[(r() - 0.5) * 5, (r() - 0.5) * 3, 1]] : []) };
          const strand = r() < 0.55 ? [x + len * 0.1, cy + (r() - 0.5) * nh * 0.5, cx, cy + (r() - 0.5) * nh, x1 - len * 0.1, cy + (r() - 0.5) * nh * 0.5] : null;
          cells.push({ cx, cy, v, nuc, strand });
        }
        x = x1;
      }
    }
    const items = tiles(cells, 400, 'onionWalls', { z: 0, h: 44 }).concat(tiles(cells, 400, 'onionNuclei', { z: 9, h: 11 }));
    mountBits(r, items, 3600, 2200, 4, 16);
    return makeSlide('onion', items, { mount: '#FFFFFF', cells, W: 4000, H: 2300 });
  }

  /* cheek cells: flat scales, scattered and clumped as a smear leaves them */
  function cheekSlide(seed) {
    const r = rng(seed), items = [], clumps = [];
    for (let i = 0; i < 7; i++) clumps.push(i ? [(r() - 0.5) * 2200, (r() - 0.5) * 1400] : [0, 0]);   // the first clump under the objective
    for (let i = 0; i < 150; i++) {
      const cl = clumps[i % clumps.length], d = r() < 0.3 ? 700 : 260;
      const x = cl[0] + (r() - 0.5) * d, y = cl[1] + (r() - 0.5) * d, R = 26 + r() * 10, v = [];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + (r() - 0.5) * 0.3; v.push([Math.cos(a) * R * (0.78 + r() * 0.34), Math.sin(a) * R * (0.78 + r() * 0.34)]); }
      const folds = []; const nf = r() < 0.6 ? 1 + Math.floor(r() * 2) : 0;
      for (let k = 0; k < nf; k++) { const a = r() * TAU; folds.push([Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, (r() - 0.5) * R * 0.6, (r() - 0.5) * R * 0.6, Math.cos(a + 2.4) * R * 0.75, Math.sin(a + 2.4) * R * 0.75]); }
      const bact = []; const nb = Math.floor(r() * 18); for (let k = 0; k < nb; k++) { const a = r() * TAU, rr = Math.sqrt(r()) * R * 0.8; bact.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      items.push({ kind: 'cheek', x, y, a: r() * TAU, r: R * 1.2, v, folds, nuc: [(r() - 0.5) * 6, (r() - 0.5) * 6, 4.4 + r() * 0.8, 3.8 + r() * 0.8, r() * 3], bact, z: 0, h: 4 });
    }
    mountBits(r, items, 3000, 2000, 3, 20);
    return makeSlide('cheek', items, { mount: '#FFFFFF', W: 3000, H: 2000, home: clumps[0].slice() });
  }

  /* a squashed onion root tip: the lab deals each cell its phase; this lays them out to draw */
  function rootSlide(seed, o) {
    const r = rng(seed), cells = (o && o.cells) || [];
    const items = tiles(cells, 160, 'rootTile', { z: 0, h: 16 });
    mountBits(r, items, 2000, 1200, 2, 10);
    return makeSlide('root', items, { mount: '#FFFFFF', cells, W: 1800, H: 1000 });
  }

  /* Elodea: a leaf two cells thick, chloroplasts carried round each cell */
  function elodeaSlide(seed) {
    const r = rng(seed), cells = [];
    let y = -600;
    while (y < 600) {
      const h = 22 + r() * 8; let x = -1400 + r() * 30;
      while (x < 1400) {
        const w = 60 + r() * 50;
        if (blobIn(x + w / 2, y + h / 2, 1300, 560, seed)) cells.push({ cx: x + w / 2, cy: y + h / 2, v: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], box: [x, y, x + w, y + h], n: Math.round((w + h) * 2 / 5.2), speed: (r() < 0.5 ? -1 : 1) * (4 + r() * 5), off: r() * 200, inner: Math.round(w * h / 160) });
        x += w;
      }
      y += h;
    }
    const items = tiles(cells, 200, 'elodeaTile', { z: 0, h: 26 });
    return makeSlide('elodea', items, { mount: '#FFFFFF', cells, animated: true });
  }

  /* a blood smear, Wright-stained */
  function bloodSlide(seed) {
    const r = rng(seed), rbc = [], wbc = [], plt = [];
    for (let i = 0; i < 15000; i++) { const x = (r() - 0.5) * 1300, y = (r() - 0.5) * 900; if (!blobIn(x, y, 640, 440, seed)) continue; rbc.push([x, y, 3.6 + r() * 0.5]); }
    for (let i = 0; i < 26; i++) { const x = (r() - 0.5) * 1200, y = (r() - 0.5) * 800; if (blobIn(x, y, 620, 420, seed)) wbc.push({ x, y, a: r() * TAU, r: r() < 0.35 ? 4.6 : 6.2, type: r() < 0.35 ? 'lymph' : 'neut' }); }
    for (let i = 0; i < 900; i++) { const x = (r() - 0.5) * 1300, y = (r() - 0.5) * 900; if (blobIn(x, y, 640, 440, seed)) plt.push([x, y]); }
    const T = new Map(), size = 150;
    const tile = (x, y) => { const i = Math.floor(x / size), j = Math.floor(y / size), k = i + ',' + j; if (!T.has(k)) T.set(k, { kind: 'bloodTile', x: (i + 0.5) * size, y: (j + 0.5) * size, r: size * 0.75, rbc: [], wbc: [], plt: [], z: 0, h: 4 }); return T.get(k); };
    rbc.forEach(b => tile(b[0], b[1]).rbc.push(b)); wbc.forEach(w => tile(w.x, w.y).wbc.push(w)); plt.forEach(p => tile(p[0], p[1]).plt.push(p));
    return makeSlide('blood', [...T.values()], { mount: '#FFFFFF' });
  }

  /* bacteria from yoghurt: rods and chains of beads, crystal violet */
  function bacteriaSlide(seed, stained) {
    const r = rng(seed), T = new Map(), size = 100;
    const tile = (x, y) => { const i = Math.floor(x / size), j = Math.floor(y / size), k = i + ',' + j; if (!T.has(k)) T.set(k, { kind: 'bactTile', x: (i + 0.5) * size, y: (j + 0.5) * size, r: size * 0.8, rods: [], cocci: [], z: 0, h: 3, stain: stained === false ? 'none' : 'cv' }); return T.get(k); };
    for (let i = 0; i < 5200; i++) {
      const x = (r() - 0.5) * 700, y = (r() - 0.5) * 700; if (!blobIn(x, y, 340, 340, seed)) continue;
      if (r() < 0.55) { const L = 2 + r() * 2.4, a = r() * TAU; tile(x, y).rods.push([x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2, x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2, 0.8]); }
      else { const n = 2 + Math.floor(r() * 6); let a = r() * TAU, px2 = x, py = y; for (let k = 0; k < n; k++) { tile(px2, py).cocci.push([px2, py, 0.42]); a += (r() - 0.5) * 0.6; px2 += Math.cos(a) * 0.9; py += Math.sin(a) * 0.9; } }
    }
    return makeSlide('bacteria', [...T.values()], { mount: '#FFFFFF' });
  }

  function micrometerSlide() { return makeSlide('micrometer', [{ kind: 'micrometer', x: 0, y: 0, r: 1000, z: 0, h: 2 }], { mount: '#FFFFFF' }); }

  function letterSlide(seed) {
    const r = rng(seed), fibres = [];
    for (let i = 0; i < 2600; i++) {
      const x = (r() - 0.5) * 7000, y = (r() - 0.5) * 7000, a = r() * Math.PI, L = 600 + r() * 2200, w = 12 + r() * 26, t = r();
      fibres.push([x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2, x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2, w, t < 0.45 ? 'rgba(150,132,104,.30)' : t < 0.8 ? 'rgba(244,238,224,.45)' : 'rgba(120,104,80,.22)']);
    }
    const specks = [];                                  // where the ink bled: specks strewn round the stroke of the e
    for (let i = 0; i < 1400; i++) { const a = r() * TAU, rad = 620 + (r() - 0.5) * 260 + (r() < 0.2 ? 200 : 0); specks.push([Math.cos(a) * rad * 1.02, Math.sin(a) * rad * 0.98 + 80, 4 + r() * 16]); }
    return makeSlide('letter', [{ kind: 'newsprint', x: 0, y: 0, r: 9000, fibres, specks, size: 2900, ch: 'e', z: 0, h: 80 }], { mount: '#FFFFFF' });
  }
  function hairSlide(seed) { return makeSlide('hair', [{ kind: 'hair', x: 0, y: 0, a: 0.35, W: 72, L: 9000, r: 4600, seed, z: 0, h: 72 }, { kind: 'hair', x: 600, y: -300, a: -0.9, W: 58, L: 9000, r: 4600, seed: seed + 1, z: 10, h: 58 }], { mount: '#FFFFFF' }); }

  /* the diatom test plate: four diatoms, their pores from 2 µm apart down to a quarter of a micrometre */
  function diatomSlide() {
    const items = [
      { kind: 'diatom', x: -600, y: 0, a: 0.1, L: 180, W: 44, striae: 2.0, name: 'Surirella', r: 120, z: 0, h: 8 },
      { kind: 'diatom', x: -200, y: 20, a: -0.2, L: 110, W: 26, striae: 1.0, name: 'Navicula', r: 80, z: 0, h: 6 },
      { kind: 'diatom', x: 200, y: 0, a: 0.25, L: 200, W: 26, striae: 0.65, sigmoid: true, name: 'Pleurosigma', r: 140, z: 0, h: 6 },
      { kind: 'diatom', x: 600, y: -10, a: -0.05, L: 110, W: 12, striae: 0.25, name: 'Amphipleura', r: 80, z: 0, h: 4 }
    ];
    return makeSlide('diatoms', items, { mount: '#FFFFFF' });
  }
  function virusSlide(seed) { const r = rng(seed), items = []; mountBits(r, items, 2400, 1600, 2, 26); return makeSlide('virus', items, { mount: '#FFFFFF' }); }
  function wetMount(kind, seed, nb) { const r = rng(seed), items = []; mountBits(r, items, 3000, 2000, nb == null ? 3 : nb, 22); return makeSlide(kind, items, { mount: '#FFFFFF' }); }

  /* a privet leaf in section: cuticle, epidermis, palisade, spongy tissue, a vein, a stoma */
  function leafSlide(seed) {
    const r = rng(seed), cells = [], T = 210, x0 = -1500, x1 = 1500;
    const add = (v, fill, wall, lw, chl) => { const cx = v.reduce((u, q) => u + q[0], 0) / v.length, cy = v.reduce((u, q) => u + q[1], 0) / v.length; cells.push({ cx, cy, v, fill, wall, lw, chl }); };
    const green = 'rgba(80,150,90,.5)', red = 'rgba(176,40,60,.85)';
    for (let x = x0; x < x1;) { const w = 18 + r() * 10; add([[x, T / 2], [x + w, T / 2], [x + w, T / 2 - 18], [x, T / 2 - 18]], 'rgba(236,240,226,.12)', green, 1.1); x += w; }        // upper epidermis
    for (let x = x0; x < x1;) { const w = 11 + r() * 5, h = 62 + r() * 10, top = T / 2 - 19; const chl = []; for (let k = 0; k < 14; k++) chl.push([x + 2 + r() * (w - 4), top - 3 - r() * (h - 6)]); add([[x, top], [x + w, top], [x + w, top - h], [x, top - h]], 'rgba(200,226,180,.18)', green, 0.9, chl); x += w + 0.5; }   // palisade
    for (let i = 0; i < 420; i++) { const x = x0 + r() * (x1 - x0), y = -T / 2 + 20 + r() * 70, R = 7 + r() * 6, v = []; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; v.push([x + Math.cos(a) * R * (0.7 + r() * 0.5), y + Math.sin(a) * R * (0.7 + r() * 0.5)]); } const chl = []; for (let k = 0; k < 5; k++) chl.push([x + (r() - 0.5) * R, y + (r() - 0.5) * R]); add(v, 'rgba(206,228,190,.16)', green, 0.8, chl); }   // spongy, with air between
    for (let x = x0; x < x1;) { const w = 16 + r() * 10; if (Math.abs(x % 260) < 20 && x > x0 + 40) { add([[x, -T / 2 + 14], [x + 9, -T / 2 + 14], [x + 9, -T / 2 + 3], [x, -T / 2 + 3]], 'rgba(90,160,90,.55)', green, 1); add([[x + 13, -T / 2 + 14], [x + 22, -T / 2 + 14], [x + 22, -T / 2 + 3], [x + 13, -T / 2 + 3]], 'rgba(90,160,90,.55)', green, 1); x += 24; continue; } add([[x, -T / 2 + 16], [x + w, -T / 2 + 16], [x + w, -T / 2], [x, -T / 2]], 'rgba(236,240,226,.12)', green, 1.1); x += w; }   // lower epidermis, with stomata
    for (let i = 0; i < 26; i++) { const a = r() * TAU, rr = r() * 26, x = Math.cos(a) * rr, y = -8 + Math.sin(a) * rr * 0.7, R = 4 + r() * 5, v = []; for (let k = 0; k < 8; k++) { const b = k / 8 * TAU; v.push([x + Math.cos(b) * R, y + Math.sin(b) * R]); } add(v, 'rgba(236,210,214,.2)', red, 2.2); }   // xylem in the vein
    for (let i = 0; i < 30; i++) { const a = r() * TAU, rr = 30 + r() * 14, x = Math.cos(a) * rr, y = -8 + Math.sin(a) * rr * 0.7, R = 2.5 + r() * 2, v = []; for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; v.push([x + Math.cos(b) * R, y + Math.sin(b) * R]); } add(v, 'rgba(160,210,170,.3)', green, 0.7); }
    const items = tiles(cells, 200, 'leafTile', { z: 0, h: 30 });
    items.push({ kind: 'coverEdge', x: 0, y: 0, x0: -1600, y0: T / 2 + 2, x1: 1600, y1: T / 2 + 2, r: 1700, z: 0, h: 30 });
    return makeSlide('leaf', items, { mount: '#FFFFFF' });
  }

  const SLIDES = { cork: corkSlide, onion: onionSlide, cheek: cheekSlide, root: rootSlide, elodea: elodeaSlide, blood: bloodSlide, bacteria: bacteriaSlide, micrometer: micrometerSlide, letter: letterSlide, hair: hairSlide, diatoms: diatomSlide, virus: virusSlide, leaf: leafSlide };
  function slide(kind, seed, o) { const f = SLIDES[kind]; return f ? f(seed || 1, o) : wetMount(kind, seed || 1, o && o.bubbles); }

  /* ============================================================
     THE INSTRUMENTS, on the R3 bench (metres; +z up, the front faces −y)
     ============================================================ */
  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    rot: (v, k, th) => { const c = Math.cos(th), s = Math.sin(th), d = V3.dot(k, v), x = V3.cross(k, v); return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]; }
  };
  const ENAMEL = '#E2DED6', BLACK = '#23262C', CHROME = '#C6CCD4', BRASS = '#B8903C', LEATHER = '#4A2A16', GILT = '#D6AE52';
  const OBJ_RING = { 4: '#D2362E', 10: '#E6C12C', 40: '#4AA2DA', 100: '#F2F2EE' };
  const OBJ_WD = { 4: 0.0185, 10: 0.0106, 40: 0.0006, 100: 0.00015 };
  const PARFOCAL = 0.045;
  function glow(F, at, r, col, a, bias) {
    F.push(at, () => {
      const q = F.cam.project(at); if (!q.ok) return; const R = Math.max(2, r * q.s), ctx = F.ctx;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, R); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.4, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.fill();
    }, bias == null ? -0.05 : bias);
  }
  function disc(F, c, r, col, o) {                       // a flat horizontal disc, painted after its surface
    o = o || {};
    F.push(c, () => { const P = MEAS.ringPts(F.cam, c, r, 30); if (!P) return; const ctx = F.ctx; MEAS.path(ctx, P); ctx.fillStyle = col; ctx.fill(); if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1; ctx.stroke(); } }, o.bias == null ? -0.003 : o.bias);
  }

  /* a modern school microscope: at = the middle of its base on the bench.
     o: obj (4|10|40|100), iris 0..1, lamp 0..1, focus (µm, spins the knobs), stage [x, y] µm, slide {tint, kind}, oil
     Returns the points the lab hangs its handles and labels on. */
  function compound(F, at, o) {
    o = o || {};
    const X = at[0], Ya = at[1] - 0.02, Z = at[2], z0 = Z + 0.034;
    const P = (y, z, x) => [X + (x || 0), Ya + y, z];
    // the base
    const bw = 0.085, bd0 = -0.085, bd1 = 0.125, rr = 0.03, base = [];
    const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; base.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } };
    corner(bw - rr, bd1 - rr, 0); corner(-bw + rr, bd1 - rr, Math.PI / 2); corner(-bw + rr, bd0 + rr, Math.PI); corner(bw - rr, bd0 + rr, Math.PI * 1.5);
    MEAS.extrude(F, base, { at: [X, Ya, Z] }, 0.034, ENAMEL, { ambient: 0.5 });
    // the lamp window, lit as the dimmer says
    const lamp = clamp(o.lamp == null ? 0.6 : o.lamp, 0, 1);
    disc(F, P(0, z0 + 0.0004), 0.019, '#1A1C20', { bias: -0.004 });
    disc(F, P(0, z0 + 0.0008), 0.014, lamp > 0.02 ? mix('#8A8474', '#FFF6DA', Math.sqrt(lamp)) : '#5A5A58', { bias: -0.005 });
    if (lamp > 0.02) glow(F, P(0, z0 + 0.004), 0.03, '#FFF1C8', 0.55 * lamp);
    R3.cylinder(F, P(0.05, 0.016, bw), P(0.05, 0.016, bw + 0.006), 0.013, BLACK, { segments: 20, shadow: false, spokes: 14, phase: lamp * 5 });   // the dimmer wheel
    // the arm, one casting from the base to the head
    const zs = Z + 0.125, zQ = zs + 0.00117 + PARFOCAL + 0.035, zh0 = zQ - 0.012, zh1 = zQ + 0.05;
    const arm = [[0.058, z0 - Z], [0.118, z0 - Z], [0.118, 0.15], [0.113, 0.19], [0.1, zh1 - Z - 0.012], [0.082, zh1 - Z], [0.03, zh1 - Z], [0.03, zh0 - Z + 0.006], [0.05, zh0 - Z - 0.012], [0.062, 0.165], [0.066, 0.11], [0.064, 0.07]];
    MEAS.extrude(F, arm, { at: [X - 0.0225, Ya, Z], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] }, 0.045, ENAMEL, { ambient: 0.5 });
    // coarse and fine focus, coaxial, both sides; they turn as the focus moves
    const ph = (o.focus || 0) / 400;
    [-1, 1].forEach(sd => {
      R3.cylinder(F, P(0.09, Z + 0.085, sd * 0.0225), P(0.09, Z + 0.085, sd * 0.036), 0.024, BLACK, { segments: 26, shadow: false, spokes: 18, phase: ph * sd });
      R3.cylinder(F, P(0.09, Z + 0.085, sd * 0.036), P(0.09, Z + 0.085, sd * 0.046), 0.0145, '#34383F', { segments: 22, shadow: false, spokes: 12, phase: ph * 10 * sd });
    });
    // the stage, its clips and slide holder, the x–y knobs underneath
    R3.box(F, P(0.0, zs - 0.006), [0.14, 0.13, 0.012], BLACK, { shadowK: 0.5 });
    R3.box(F, P(0.06, zs - 0.012), [0.05, 0.02, 0.02], BLACK, { shadow: false });
    disc(F, P(0, zs + 0.0003), 0.009, '#050608', { bias: -0.002 });
    const st = o.stage || [0, 0], sx = -st[0] * 1e-6, sy = -st[1] * 1e-6;
    // the slide: glass, a label at one end, the specimen under a coverslip
    const sl = o.slide || {}, sc = [X + sx, Ya + sy, zs + 0.0005];
    R3.box(F, sc, [0.075, 0.025, 0.001], '#DDEBEF', { alpha: 0.55, shadow: false, edges: true });
    R3.box(F, [sc[0] - 0.029, sc[1], sc[2] + 0.00055], [0.017, 0.024, 0.0002], '#F4F2EA', { shadow: false });
    if (sl.tint) disc(F, [sc[0], sc[1], sc[2] + 0.0006], sl.r || 0.005, rgba(sl.tint, sl.a == null ? 0.7 : sl.a), { bias: -0.006 });
    R3.box(F, [sc[0], sc[1], sc[2] + 0.00062], [0.022, 0.022, 0.00017], '#E8F4F8', { alpha: 0.35, shadow: false });
    if (o.oil && o.obj === 100) disc(F, [X, Ya, sc[2] + 0.0008], 0.003, 'rgba(250,236,160,.7)', { bias: -0.008 });
    R3.box(F, [X, Ya + 0.02 + sy, zs + 0.004], [0.07, 0.006, 0.006], '#2E3238', { shadow: false });
    R3.cylinder(F, P(-0.035, zs - 0.03, 0.058), P(-0.035, zs - 0.07, 0.058), 0.009, BLACK, { segments: 18, shadow: false, spokes: 10, phase: st[0] / 800 });
    R3.cylinder(F, P(-0.035, zs - 0.07, 0.058), P(-0.035, zs - 0.09, 0.058), 0.0065, '#34383F', { segments: 16, shadow: false, spokes: 8, phase: st[1] / 800 });
    // the condenser and its iris lever
    const zc1 = zs - 0.012, zc0 = zc1 - 0.034, iris = clamp(o.iris == null ? 0.7 : o.iris, 0, 1);
    R3.cylinder(F, P(0, zc0), P(0, zc1), 0.02, BLACK, { segments: 24, shadow: false });
    const la = -1.9 + 1.3 * iris, lever = [X + Math.cos(la) * 0.034, Ya + Math.sin(la) * 0.034, zc0 + 0.012];
    R3.cylinder(F, [X + Math.cos(la) * 0.019, Ya + Math.sin(la) * 0.019, zc0 + 0.012], lever, 0.0018, CHROME, { segments: 8, shadow: false });
    R3.sphere(F, lever, 0.0035, '#2A2D33', { shadow: false });
    // the head and the eyepiece tube, tilted towards the student
    // the head: a rounded casting over the nosepiece, extruded across the arm
    const hz = z => z - Z, head = [[0.05, hz(zh0)], [-0.012, hz(zh0)], [-0.024, hz(zh0) + 0.008], [-0.03, hz(zh0) + 0.022], [-0.03, hz(zh1) - 0.014], [-0.022, hz(zh1) - 0.003], [-0.008, hz(zh1)], [0.05, hz(zh1)]];
    MEAS.extrude(F, head, { at: [X - 0.029, Ya, Z], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] }, 0.058, ENAMEL, { ambient: 0.5 });
    const tb0 = P(-0.012, zh1 - 0.006), dir = V3.norm([0, -0.72, 0.69]), tb1 = V3.add(tb0, V3.sc(dir, 0.07)), ep1 = V3.add(tb1, V3.sc(dir, 0.034));
    R3.cylinder(F, tb0, tb1, 0.0145, ENAMEL, { segments: 22, shadow: false, ambient: 0.5 });
    R3.cylinder(F, tb1, ep1, 0.0132, '#2B2E34', { segments: 22, shadow: false });
    R3.cylinder(F, ep1, V3.add(ep1, V3.sc(dir, 0.012)), 0.0165, '#141518', { segments: 22, shadow: false, inner: 0.009 });
    // the revolving nosepiece: the objectives' axes meet the turret's axis at one point, so the one
    // turned into place hangs straight down; parfocal, so every front lens sits its working distance
    // above the slide — the 40× all but touches the coverslip
    const Q = P(0, zQ), beta = 0.33, t = V3.norm([0, Math.sin(beta), -Math.cos(beta)]), rho = 0.035;
    const order = [4, 10, 40, 100], act = Math.max(0, order.indexOf(o.obj || 10));
    const tc = V3.add(Q, V3.sc(t, rho * Math.cos(beta) - 0.002));
    R3.cylinder(F, V3.add(tc, V3.sc(t, -0.009)), V3.add(tc, V3.sc(t, 0.004)), rho * Math.sin(beta) + 0.014, CHROME, { segments: 28, shadow: false, ambient: 0.5 });
    R3.cylinder(F, [Q[0], Q[1], zh0 + 0.002], V3.add(tc, V3.sc(t, -0.008)), 0.017, CHROME, { segments: 22, shadow: false, ambient: 0.5 });
    const tips = {};
    order.forEach((m, i) => {
      const d = V3.rot([0, 0, -1], t, (i - act) * Math.PI / 2 + (o.turn || 0));
      const m0 = V3.add(Q, V3.sc(d, rho)), len = PARFOCAL - OBJ_WD[m], r0 = m >= 40 ? 0.0095 : 0.0105;
      const tip = V3.add(m0, V3.sc(d, len));
      R3.cylinder(F, m0, V3.add(m0, V3.sc(d, len * 0.62)), r0, CHROME, { segments: 18, shadow: false, ambient: 0.5 });
      R3.cylinder(F, V3.add(m0, V3.sc(d, len * 0.3)), V3.add(m0, V3.sc(d, len * 0.36)), r0 + 0.0006, OBJ_RING[m], { segments: 18, shadow: false, ambient: 0.55 });
      if (m === 100) R3.cylinder(F, V3.add(m0, V3.sc(d, len * 0.44)), V3.add(m0, V3.sc(d, len * 0.48)), r0 + 0.0004, '#15161A', { segments: 18, shadow: false });
      R3.cylinder(F, V3.add(m0, V3.sc(d, len * 0.62)), tip, r0 * (m >= 40 ? 0.62 : 0.78), CHROME, { segments: 16, shadow: false, ambient: 0.5, capColour: '#1E2A30' });
      tips[m] = tip;
    });
    return { eyepiece: ep1, stage: P(0, zs), objective: tips[o.obj || 10], turret: tc, iris: lever, knob: P(0.09, Z + 0.085, 0.05), lamp: P(0, z0), slide: sc, dimmer: P(0.05, 0.016, bw + 0.006), zs };
  }

  /* Hooke's microscope (Micrographia, 1665): a leather-covered tube of four draws, gilt-tooled, on a
     ball joint from a pillar; an oil lamp whose light a globe of water and a deep lens gather onto the
     specimen. at = the middle of its round foot. */
  function hookeScope(F, at, o) {
    o = o || {};
    const X = at[0], Y = at[1], Z = at[2];
    R3.cylinder(F, [X, Y, Z], [X, Y, Z + 0.022], 0.075, '#6E4222', { segments: 32, ambient: 0.45 });
    R3.cylinder(F, [X, Y, Z + 0.022], [X, Y, Z + 0.03], 0.066, '#7C4C28', { segments: 32, shadow: false, ambient: 0.45 });
    const px0 = [X - 0.045, Y + 0.02, Z + 0.03];
    R3.cylinder(F, px0, [px0[0], px0[1], Z + 0.3], 0.0055, BRASS, { segments: 12, shadow: false, ambient: 0.5 });
    R3.box(F, [px0[0], px0[1], Z + 0.2], [0.02, 0.02, 0.03], BRASS, { shadow: false });
    const joint = [X + 0.005, Y + 0.02, Z + 0.2];
    R3.cylinder(F, [px0[0], px0[1], Z + 0.2], joint, 0.0045, BRASS, { segments: 10, shadow: false });
    R3.sphere(F, joint, 0.011, BRASS, { shadow: false });
    // the tube, tilted: eyepiece up at the back, snout down over the specimen
    const d = V3.norm([0.18, -0.12, -0.97]), top = V3.add(joint, V3.sc(d, -0.1));
    const secs = [[0.03, 0.05], [0.027, 0.045], [0.024, 0.045], [0.02, 0.04]];
    let p = top;
    R3.cylinder(F, V3.add(top, V3.sc(d, -0.03)), top, 0.019, '#CDB690', { segments: 22, shadow: false, ambient: 0.5 });   // the eye-piece cap, turned
    secs.forEach(([r, L], i) => {
      const q = V3.add(p, V3.sc(d, L));
      R3.cylinder(F, p, q, r, LEATHER, { segments: 26, shadow: false, ambient: 0.42 });
      R3.cylinder(F, V3.add(p, V3.sc(d, L * 0.06)), V3.add(p, V3.sc(d, L * 0.12)), r + 0.0012, GILT, { segments: 26, shadow: false, ambient: 0.55 });
      R3.cylinder(F, V3.add(p, V3.sc(d, L * 0.88)), V3.add(p, V3.sc(d, L * 0.94)), r + 0.0012, GILT, { segments: 26, shadow: false, ambient: 0.55 });
      p = q;
    });
    const snout = V3.add(p, V3.sc(d, 0.02));
    R3.cylinder(F, p, snout, 0.009, BRASS, { segments: 16, shadow: false });
    // the specimen on its pin, under the snout
    const spec = V3.add(snout, V3.sc(d, 0.012));
    R3.cylinder(F, [spec[0], spec[1], Z + 0.03], [spec[0], spec[1], spec[2] - 0.004], 0.0025, BRASS, { segments: 8, shadow: false });
    R3.cylinder(F, [spec[0], spec[1], spec[2] - 0.004], [spec[0], spec[1], spec[2] - 0.002], 0.012, '#2A2420', { segments: 20, shadow: false });
    if (o.tint) disc(F, [spec[0], spec[1], spec[2] - 0.0018], 0.006, rgba(o.tint, 0.8), { bias: -0.004 });
    // the lamp, the globe of water, the deep lens, and the light they bring together
    const L0 = [X + 0.2, Y - 0.02, Z];
    R3.cylinder(F, L0, [L0[0], L0[1], L0[2] + 0.012], 0.03, BRASS, { segments: 20, ambient: 0.5 });
    R3.cylinder(F, [L0[0], L0[1], L0[2] + 0.012], [L0[0], L0[1], L0[2] + 0.17], 0.004, BRASS, { segments: 10, shadow: false });
    const lampC = [L0[0], L0[1], L0[2] + 0.19];
    R3.sphere(F, lampC, 0.022, '#A57E30', { shadow: false });
    const flame = [lampC[0] - 0.012, lampC[1], lampC[2] + 0.028];
    R3.cylinder(F, [lampC[0] - 0.012, lampC[1], lampC[2] + 0.012], [flame[0], flame[1], flame[2] - 0.012], 0.0035, '#8A6A28', { segments: 8, shadow: false });
    const lit = o.lamp == null ? 1 : o.lamp;
    if (lit > 0.02) { glow(F, flame, 0.05, '#FFB84A', 0.55 * lit, -0.1); glow(F, flame, 0.012, '#FFF4C0', 0.95 * lit, -0.11); }
    const gC = [X + 0.11, Y - 0.02, Z + 0.15];
    R3.cylinder(F, [gC[0], gC[1], Z], [gC[0], gC[1], gC[2] - 0.045], 0.003, BRASS, { segments: 8, shadow: false });
    R3.cylinder(F, [gC[0], gC[1], Z], [gC[0], gC[1], Z + 0.008], 0.02, BRASS, { segments: 16 });
    F.push(gC, () => {
      const q = F.cam.project(gC); if (!q.ok) return; const r = 0.045 * q.s, ctx = F.ctx;
      const g = ctx.createRadialGradient(q.x - r * 0.3, q.y - r * 0.35, r * 0.1, q.x, q.y, r);
      g.addColorStop(0, 'rgba(250,252,255,.55)'); g.addColorStop(0.5, 'rgba(170,205,225,.22)'); g.addColorStop(1, 'rgba(110,150,180,.45)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(230,240,248,.6)'; ctx.lineWidth = 1; ctx.stroke();
      if (lit > 0.02) { ctx.fillStyle = 'rgba(255,214,120,' + (0.5 * lit).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x + r * 0.25, q.y + r * 0.1, r * 0.22, 0, TAU); ctx.fill(); }
    }, -0.02);
    const lensC = V3.add(spec, [0.045, -0.01, 0.01]);
    R3.cylinder(F, [lensC[0], lensC[1], Z], [lensC[0], lensC[1], lensC[2] - 0.016], 0.0025, BRASS, { segments: 8, shadow: false });
    R3.cylinder(F, V3.add(lensC, [-0.002, 0, 0]), V3.add(lensC, [0.002, 0, 0]), 0.015, '#CFE6EE', { segments: 22, shadow: false, ambient: 0.7 });
    if (lit > 0.02) {
      F.push(lensC, () => {
        const a = F.cam.project(flame), b = F.cam.project(gC), c = F.cam.project(lensC), s = F.cam.project(spec); if (!a.ok || !b.ok || !c.ok || !s.ok) return;
        const ctx = F.ctx; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const beam = (p0, p1, w0, w1, al) => { const dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; ctx.fillStyle = 'rgba(255,200,110,' + al + ')'; ctx.beginPath(); ctx.moveTo(p0.x + nx * w0, p0.y + ny * w0); ctx.lineTo(p1.x + nx * w1, p1.y + ny * w1); ctx.lineTo(p1.x - nx * w1, p1.y - ny * w1); ctx.lineTo(p0.x - nx * w0, p0.y - ny * w0); ctx.closePath(); ctx.fill(); };
        beam(a, b, 2, 0.04 * b.s, (0.1 * lit).toFixed(3)); beam(b, c, 0.03 * b.s, 0.012 * c.s, (0.14 * lit).toFixed(3)); beam(c, s, 0.012 * c.s, 1.5, (0.22 * lit).toFixed(3));
        ctx.restore();
      }, -0.03);
    }
    return { eyepiece: V3.add(top, V3.sc(d, -0.03)), specimen: spec, lamp: flame, globe: gC };
  }

  /* Leeuwenhoek's microscope (1670s): two riveted brass plates, a glass bead of a lens between them,
     the specimen on a pin that two screws bring up to it. at = the foot of its display stand. */
  function leeuwenhoek(F, at, o) {
    o = o || {};
    const X = at[0], Y = at[1], Z = at[2], zb = Z + 0.07;
    R3.cylinder(F, [X, Y, Z], [X, Y, Z + 0.01], 0.03, '#5B3A1E', { segments: 24, ambient: 0.45 });
    R3.cylinder(F, [X, Y, Z + 0.01], [X, Y, zb], 0.0025, '#3A3A3E', { segments: 8, shadow: false });
    const W = 0.024, H = 0.047, pl = [[-W / 2, 0], [W / 2, 0], [W / 2, H * 0.72], [W * 0.36, H], [-W * 0.36, H], [-W / 2, H * 0.72]];
    MEAS.extrude(F, pl, { at: [X, Y, zb], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] }, 0.0012, '#C29A48', { ambient: 0.55 });
    [[-0.008, 0.006], [0.008, 0.006], [-0.008, 0.04], [0.008, 0.04]].forEach(q => R3.sphere(F, [X + q[0], Y - 0.0002, zb + q[1]], 0.0009, '#8E6A28', { shadow: false }));
    const lens = [X, Y - 0.0004, zb + 0.034];
    disc2(F, lens, 0.0022, '#6E5020');
    R3.sphere(F, [lens[0], lens[1] - 0.0003, lens[2]], 0.0008, '#E8F6FF', { shadow: false, rim: 0.2 });
    // behind the plate: the specimen pin on its block, the long screw that raises it, the screw that sets its distance
    const yb = Y + 0.004;
    R3.box(F, [X, yb, zb + 0.012], [0.006, 0.005, 0.01], '#A88438', { shadow: false });
    R3.cylinder(F, [X, yb, zb - 0.012], [X, yb, zb + 0.03], 0.0011, '#9C7A34', { segments: 8, shadow: false });
    R3.cylinder(F, [X, yb, zb - 0.012], [X, yb, zb - 0.016], 0.003, '#9C7A34', { segments: 12, shadow: false });
    const pin = [X, yb - 0.002, zb + 0.034];
    R3.cylinder(F, [X, yb, zb + 0.017], [pin[0], pin[1] + 0.0008, pin[2] - 0.001], 0.0006, '#B0B6BE', { segments: 6, shadow: false });
    if (o.capillary !== false) R3.cylinder(F, [pin[0] - 0.009, pin[1], pin[2]], [pin[0] + 0.009, pin[1], pin[2]], 0.0009, '#CFE8EE', { segments: 10, shadow: false, ambient: 0.8 });
    R3.cylinder(F, [X + 0.006, Y, zb + 0.02], [X + 0.006, Y + 0.012, zb + 0.02], 0.0012, '#9C7A34', { segments: 8, shadow: false });
    R3.cylinder(F, [X + 0.006, Y + 0.012, zb + 0.02], [X + 0.006, Y + 0.015, zb + 0.02], 0.0028, '#9C7A34', { segments: 12, shadow: false });
    return { lens, plateTop: [X, Y, zb + H] };
  }
  function disc2(F, c, r, col) {                         // a flat disc in the vertical plate's plane (facing −y)
    F.push(c, () => {
      const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, q = F.cam.project([c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r]); if (!q.ok) return; pts.push(q); }
      const ctx = F.ctx; MEAS.path(ctx, pts); ctx.fillStyle = col; ctx.fill();
    }, -0.004);
  }

  /* a dropper bottle of stain, its name on a paper label facing the camera */
  const LBL = {};
  function labelTex(name, col) {
    const key = name + col; if (LBL[key]) return LBL[key];
    const c = canvas(160, 96), x = c.getContext('2d');
    x.fillStyle = '#F6F3EA'; x.fillRect(0, 0, 160, 96); x.fillStyle = col; x.fillRect(0, 0, 160, 16); x.fillRect(0, 80, 160, 16);
    x.fillStyle = '#1C1C1C'; x.font = '700 21px "IBM Plex Sans",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const words = name.split(' '); if (words.length > 1 && x.measureText(name).width > 150) { x.fillText(words[0], 80, 36); x.fillText(words.slice(1).join(' '), 80, 60); } else x.fillText(name, 80, 48);
    return (LBL[key] = c);
  }
  function dropper(F, base, name, col, o) {
    o = o || {};
    const r = 0.017, H = 0.05;
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, o.glass || '#5A3614', { segments: 22, ambient: 0.4, shadowK: 0.6 });
    R3.cylinder(F, [base[0], base[1], base[2] + H], [base[0], base[1], base[2] + H + 0.012], 0.009, '#1E1F22', { segments: 14, shadow: false });
    R3.cylinder(F, [base[0], base[1], base[2] + H + 0.012], [base[0], base[1], base[2] + H + 0.03], 0.0055, o.bulb || '#2A2B30', { segments: 12, shadow: false });
    const e = F.cam.eye, a = Math.atan2(e[1] - base[1], e[0] - base[0]), n = [Math.cos(a), Math.sin(a), 0], t = [-Math.sin(a), Math.cos(a), 0];
    R3.texPlane(F, V3.add(base, V3.add(V3.sc(n, r + 0.0012), [0, 0, H * 0.5])), V3.sc(t, r * 0.8), [0, 0, -H * 0.26], labelTex(name, col), { bias: -0.01, grid: 2 });
  }
  /* a wooden slide box, slides standing in its slots */
  function slideBox(F, c, o) {
    R3.box(F, [c[0], c[1], c[2] + 0.012], [0.1, 0.085, 0.024], '#8A5A30', { ambient: 0.45 });
    for (let i = 0; i < 9; i++) R3.box(F, [c[0] - 0.04 + i * 0.01, c[1], c[2] + 0.026], [0.0012, 0.075, 0.012], i % 3 === 1 ? '#EAD9C0' : '#D8E8EC', { shadow: false, alpha: 0.85 });
  }
  /* a watch glass of pond water, green with life */
  function pondDish(F, c, o) {
    R3.cylinder(F, c, [c[0], c[1], c[2] + 0.016], 0.045, '#D8ECEE', { segments: 30, ambient: 0.7, shadowK: 0.4, capColour: '#8DB07A' });
  }

  window.MICRO = { view, blurRGB, rng, hash2, canvas, spatial, defocus, PAINT, slide, compound, hookeScope, leeuwenhoek, dropper, slideBox, pondDish, glow, congo, OBJ_WD, PARFOCAL, V3, sphereCells, spinOf };
})();
