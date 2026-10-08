/* ============================================================
   G6F — the figure library of Unit 6F (Global Warming and Human Impact).
   Space and the Sun; the globe's clouds, ice and haze as overlays on the
   real Earth (EARTH); beams of sunlight and of heat radiation whose width
   is the flux; a CERES radiometer satellite; a cross-section of the climate
   system whose parts are as wide as their share of the planet; Tyndall's
   tube with its cube, thermopile and galvanometer; jars, lamps and probes;
   a power station, a cement works, paddies and cleared forest on the land;
   the two-layer ocean in section. Nothing here computes science: it draws
   what a lab computed.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => RX.mix(a, b, clamp(t, 0, 1)), rgba = (c, a) => RX.rgba(c, a);
  const mono = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }; }
  const cache = {};
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------------- space, and the Sun ---------------- */
  function space(ctx, x, y, w, h, seed) {
    const key = 'sp' + Math.round(w) + 'x' + Math.round(h) + 's' + (seed || 1);
    if (!cache[key]) {
      const c = canvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), g = c.getContext('2d'), r = rng(seed || 7);
      const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#03050C'); bg.addColorStop(0.6, '#060A18'); bg.addColorStop(1, '#0A0F22');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 3; k++) { const nx = r() * w, ny = r() * h, nr = (0.2 + r() * 0.3) * Math.max(w, h), ng = g.createRadialGradient(nx, ny, 0, nx, ny, nr); ng.addColorStop(0, k % 2 ? 'rgba(70,60,140,.10)' : 'rgba(40,80,150,.10)'); ng.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ng; g.fillRect(0, 0, w, h); }
      const n = Math.round(w * h / 900);
      for (let k = 0; k < n; k++) { const b = Math.pow(r(), 3); g.fillStyle = 'rgba(' + (200 + 55 * r() | 0) + ',' + (210 + 45 * r() | 0) + ',255,' + (0.25 + 0.75 * b).toFixed(2) + ')'; const s = b > 0.7 ? 1.6 : b > 0.3 ? 1.1 : 0.7; g.fillRect(r() * w, r() * h, s, s); }
      cache[key] = c;
    }
    ctx.drawImage(cache[key], x, y, w, h);
  }
  /* the Sun: limb-darkened disc, granulation, sunspots (0..1 of a busy maximum), a corona */
  function sun(ctx, x, y, r, o) {
    o = o || {};
    ctx.save();
    const cg = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * (3.2 + (o.glow || 0)));
    cg.addColorStop(0, 'rgba(255,230,170,.55)'); cg.addColorStop(0.25, 'rgba(255,200,120,.16)'); cg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#FFFDF2'); g.addColorStop(0.55, '#FFF0B8'); g.addColorStop(0.85, '#FFC864'); g.addColorStop(1, '#F08A2C');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.clip();
    if (r > 14) {
      const R = rng(11); ctx.globalAlpha = 0.18;
      for (let k = 0; k < r * 3; k++) { const a = R() * TAU, d = Math.sqrt(R()) * r; ctx.fillStyle = R() < 0.5 ? '#FFFFFF' : '#E8A040'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.03 + R() * r * 0.03, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      const spots = Math.round((o.spots || 0) * 9), S = rng(5);
      for (let k = 0; k < spots; k++) {
        const lat = (S() < 0.5 ? -1 : 1) * (0.12 + 0.25 * S()), lon = (S() - 0.5) * 1.6, sx = x + Math.sin(lon) * r * 0.9, sy = y - lat * r, sr = r * (0.03 + 0.04 * S());
        ctx.fillStyle = 'rgba(120,60,20,.55)'; ctx.beginPath(); ctx.arc(sx, sy, sr * 1.8, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(40,16,6,.85)'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---------------- the globe's own weather: clouds, ice, haze ---------------- */
  let NOISE = null;
  function noise() {
    if (NOISE) return NOISE;
    const W = 180, H = 90, R = rng(23), base = [];
    for (let o = 0; o < 4; o++) { const n = 6 << o, g = []; for (let j = 0; j <= n / 2; j++) { g.push([]); for (let i = 0; i <= n; i++) g[j].push(R()); } base.push({ n, g }); }
    const v = new Float64Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      let s = 0, a = 1, t = 0;
      base.forEach(({ n, g }) => { const fx = i / W * n, fy = j / H * n / 2, x0 = Math.floor(fx), y0 = Math.floor(fy), ux = fx - x0, uy = fy - y0, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
        const x1 = (x0 + 1) % (n + 1), y1 = Math.min(n / 2, y0 + 1);
        s += a * ((g[y0][x0] * (1 - sx) + g[y0][x1] * sx) * (1 - sy) + (g[y1][x0] * (1 - sx) + g[y1][x1] * sx) * sy); t += a; a *= 0.55; });
      // cloud belts: the tropics' towers and the storm tracks at 50–60°, clear subtropics
      const lat = 90 - (j + 0.5) * 2, belt = 0.10 * Math.cos(lat * Math.PI / 180 * 6) + 0.06 * Math.exp(-lat * lat / 60);
      v[j * W + i] = s / t + belt;
    }
    const sorted = Array.from(v).sort((a, b) => a - b);
    NOISE = { W, H, v, sorted };
    return NOISE;
  }
  /* an overlay for EARTH.draw: cloud cover c (0..1), ice beyond iceLat (deg) at both poles, a haze */
  function weather(o) {
    const N = noise(), thr = N.sorted[Math.floor(clamp(1 - (o.cloud == null ? 0.67 : o.cloud), 0, 0.999) * N.sorted.length)];
    const cloudOn = (o.cloud == null ? 0.67 : o.cloud) > 0.005, iceN = o.iceN == null ? 90 : o.iceN, iceS = o.iceS == null ? iceN : o.iceS, haze = o.haze || 0, tint = o.tint || null, shift = o.shift || 0;
    return (lat, lon) => {
      let r = 0, g = 0, b = 0, a = 0;
      if (lat > iceN || lat < -iceS) { const e = lat > 0 ? lat - iceN : -iceS - lat; r = 236; g = 244; b = 250; a = clamp(0.55 + e * 0.12, 0, 0.94); }
      else if (tint) { const t = tint(lat, lon); if (t) { r = t[0]; g = t[1]; b = t[2]; a = t[3]; } }
      const fu = (((lon + 180 + shift) % 360 + 360) % 360) / 2, fv = clamp((90 - lat) / 2 - 0.5, 0, N.H - 1.001), i0 = Math.floor(fu), j0 = Math.floor(fv), au = fu - i0, av = fv - j0, i1 = (i0 + 1) % N.W, ia = i0 % N.W;
      const v = (N.v[j0 * N.W + ia] * (1 - au) + N.v[j0 * N.W + i1] * au) * (1 - av) + (N.v[(j0 + 1) * N.W + ia] * (1 - au) + N.v[(j0 + 1) * N.W + i1] * au) * av;
      if (cloudOn && v > thr) { const k = clamp((v - thr) * 7, 0, 0.9); r = r * (1 - k) + 250 * k; g = g * (1 - k) + 252 * k; b = b * (1 - k) + 255 * k; a = a + (1 - a) * k; }
      if (haze > 0) { r = r * (1 - haze) + 214 * haze; g = g * (1 - haze) + 206 * haze; b = b * (1 - haze) + 190 * haze; a = a + (1 - a) * haze; }
      return a > 0.01 ? [r, g, b, a] : null;
    };
  }
  /* the thin shell of air, drawn as a lit rim over the globe; thicker and warmer-coloured when it traps more */
  function shell(ctx, cx, cy, R, o) {
    o = o || {};
    const th = R * (o.th || 0.05), trap = clamp(o.trap == null ? 0.5 : o.trap, 0, 1);
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, R * 0.985, cx, cy, R + th * 2.4);
    g.addColorStop(0, rgba(mix('#6FB2FF', '#FF9E6A', trap * 0.55), 0.0)); g.addColorStop(0.18, rgba(mix('#7FC0FF', '#FFA878', trap * 0.55), 0.55 + 0.25 * trap));
    g.addColorStop(0.55, rgba(mix('#3E78D8', '#C8603A', trap * 0.45), 0.22 + 0.15 * trap)); g.addColorStop(1, 'rgba(20,40,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R + th * 2.4, 0, TAU); ctx.arc(cx, cy, R * 0.985, 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
  }

  /* ---------------- beams: sunlight straight, heat radiation as a wave ---------------- */
  function arrowHead(ctx, x, y, ang, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, s * 0.75); ctx.lineTo(-s * 0.35, 0); ctx.lineTo(-s * 0.7, -s * 0.75); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /* sunlight: a ribbon from (x0,y0) to (x1,y1), w px wide, lit along its middle */
  function swBeam(ctx, x0, y0, x1, y1, w, col, o) {
    o = o || {};
    if (w < 0.4) return;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), hs = Math.max(5, w * 0.9 + 3);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, rgba(col, 0.25)); g.addColorStop(0.5, rgba(mix(col, '#FFFFFF', 0.45), o.alpha || 0.92)); g.addColorStop(1, rgba(col, 0.25));
    ctx.shadowColor = rgba(col, 0.6); ctx.shadowBlur = 8;
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.lineTo(L - hs * 0.8, -w / 2); ctx.lineTo(L - hs * 0.8, w / 2); ctx.lineTo(0, w / 2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    if (!o.noHead) arrowHead(ctx, x1, y1, ang, hs, mix(col, '#FFFFFF', 0.2));
  }
  /* heat radiation: a wave whose band is w px wide, its wavelength longer than light's */
  function lwBeam(ctx, x0, y0, x1, y1, w, col, o) {
    o = o || {};
    if (w < 0.4) return;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), hs = Math.max(5, w * 0.8 + 3), lam = o.lam || 16, ph = o.phase || 0;
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang);
    const amp = Math.max(1.5, Math.min(7, w * 0.35));
    ctx.lineCap = 'round'; ctx.shadowColor = rgba(col, 0.55); ctx.shadowBlur = 7;
    [[w, rgba(col, 0.28)], [Math.max(1.2, w * 0.45), rgba(mix(col, '#FFFFFF', 0.25), 0.95)]].forEach(([lw, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
      for (let s = 0; s <= L - hs * 0.9; s += 2) { const yy = amp * Math.sin(TAU * (s / lam) - ph); s ? ctx.lineTo(s, yy) : ctx.moveTo(s, yy); }
      ctx.stroke();
    });
    ctx.shadowBlur = 0; ctx.restore();
    if (!o.noHead) arrowHead(ctx, x1, y1, ang, hs, mix(col, '#FFFFFF', 0.15));
  }
  /* a flux label beside a beam */
  function fluxTag(ctx, x, y, text, col, align) {
    ctx.save(); ctx.font = mono(10.5, 700); ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(4,7,14,.88)'; ctx.strokeText(text, x, y); ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore();
  }

  /* ---------------- a radiometer satellite (CERES on Terra/Aqua) ---------------- */
  function satellite(ctx, x, y, s, ang, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    // the solar array: a wing of cells on a boom
    ctx.strokeStyle = '#9AA6B8'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.moveTo(s * 0.35, 0); ctx.lineTo(s * 0.75, 0); ctx.stroke();
    const pw = s * 1.6, ph = s * 0.62, px = s * 0.75;
    const pg = ctx.createLinearGradient(px, -ph / 2, px + pw, ph / 2); pg.addColorStop(0, '#1C2E6A'); pg.addColorStop(0.5, '#2C4AA0'); pg.addColorStop(1, '#152452');
    ctx.fillStyle = pg; ctx.fillRect(px, -ph / 2, pw, ph);
    ctx.strokeStyle = 'rgba(160,190,255,.35)'; ctx.lineWidth = 0.6;
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(px + pw * i / 8, -ph / 2); ctx.lineTo(px + pw * i / 8, ph / 2); ctx.stroke(); }
    for (let j = 1; j < 3; j++) { ctx.beginPath(); ctx.moveTo(px, -ph / 2 + ph * j / 3); ctx.lineTo(px + pw, -ph / 2 + ph * j / 3); ctx.stroke(); }
    ctx.strokeStyle = '#C8D2E2'; ctx.lineWidth = 1; ctx.strokeRect(px, -ph / 2, pw, ph);
    // the bus in gold foil
    const bg = ctx.createLinearGradient(-s * 0.4, -s * 0.4, s * 0.4, s * 0.4); bg.addColorStop(0, '#F6D77A'); bg.addColorStop(0.45, '#C9962E'); bg.addColorStop(0.7, '#E8C060'); bg.addColorStop(1, '#8A6420');
    ctx.fillStyle = bg; ctx.fillRect(-s * 0.4, -s * 0.35, s * 0.75, s * 0.7);
    ctx.strokeStyle = 'rgba(90,60,10,.6)'; ctx.lineWidth = 0.7; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-s * 0.4 + k * s * 0.19, -s * 0.35); ctx.lineTo(-s * 0.3 + k * s * 0.17, s * 0.35); ctx.stroke(); }
    // the scanning radiometers, pointing at the Earth (down the local −y)
    [-0.18, 0.12].forEach((u, k) => {
      ctx.save(); ctx.translate(s * u, s * 0.38); ctx.rotate(o.scan ? Math.sin(o.scan + k) * 0.5 : 0);
      const cg = ctx.createLinearGradient(-s * 0.1, 0, s * 0.1, 0); cg.addColorStop(0, '#5A6474'); cg.addColorStop(0.4, '#D6DCE6'); cg.addColorStop(1, '#3A424E');
      ctx.fillStyle = cg; ctx.fillRect(-s * 0.1, 0, s * 0.2, s * 0.26);
      ctx.fillStyle = '#10151E'; ctx.beginPath(); ctx.ellipse(0, s * 0.27, s * 0.08, s * 0.03, 0, 0, TAU); ctx.fill();
      ctx.restore();
    });
    // antenna dish
    ctx.fillStyle = '#E6EAF0'; ctx.beginPath(); ctx.ellipse(-s * 0.48, -s * 0.12, s * 0.06, s * 0.2, 0.2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- the climate system in section ----------------
     A slice of the planet whose parts are as wide as their share of the surface:
     ice sheet and sea ice, open ocean, forest or farmland, desert; air and
     cloud above (as many clouds as the cloud cover), ocean water and rock below. */
  function section(ctx, x, y, w, h, st) {
    const ys = y + h * 0.66, ice = clamp(st.ice, 0, 1), oc = 0.71 * (1 - ice), ld = 0.29 * (1 - ice);
    const iceSheet = ice * 0.5, seaIce = ice * 0.5, desertShare = st.land === 'desert' ? 1 : st.land === 'forest' ? 0 : st.land === 'crops' ? 0.15 : 0.3;
    const parts = [['sheet', iceSheet], ['seaice', seaIce], ['ocean', oc], ['green', ld * (1 - desertShare)], ['desert', ld * desertShare]];
    const xs = {}; let cx = x;
    parts.forEach(([k, f]) => { xs[k] = [cx, cx + f * w]; cx += f * w; });
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    // the sky: the air's column, deep blue at the top, paler near the ground, warmer-tinted when it traps more
    const trap = clamp(st.trap == null ? 0.5 : st.trap, 0, 1), sky = ctx.createLinearGradient(0, y, 0, ys);
    sky.addColorStop(0, '#050A1C'); sky.addColorStop(0.18, '#0E1E48'); sky.addColorStop(0.55, mix('#2E62B0', '#6A5A8A', trap * 0.35)); sky.addColorStop(1, mix('#8EC0F0', '#D8B49A', trap * 0.3));
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, ys - y);
    // the tropopause and the top of the atmosphere, faint
    ctx.strokeStyle = 'rgba(160,190,240,.22)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
    [[y + h * 0.10, 'top of the atmosphere'], [y + h * 0.24, 'tropopause, 12 km']].forEach(([yy, t]) => { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); ctx.font = mono(9, 500); ctx.fillStyle = 'rgba(170,195,235,.65)'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(t, x + w - 6, yy - 2); });
    ctx.setLineDash([]);
    // land and sea, from left to right
    const groundY = k => k === 'sheet' ? ys - h * 0.07 : k === 'green' ? ys - h * 0.012 : k === 'desert' ? ys - h * 0.018 : ys;
    // the ocean: water to the bottom of the frame, a sunlit layer over a dark deep
    ['seaice', 'ocean'].forEach(k => {
      const [a, b] = xs[k]; if (b - a < 0.5) return;
      const og = ctx.createLinearGradient(0, ys, 0, y + h); og.addColorStop(0, '#2C78B4'); og.addColorStop(0.18, '#18578E'); og.addColorStop(0.45, '#0C3462'); og.addColorStop(1, '#061A36');
      ctx.fillStyle = og; ctx.fillRect(a, ys, b - a, y + h - ys);
      ctx.strokeStyle = 'rgba(140,200,240,.18)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(a, ys + (y + h - ys) * 0.2); ctx.lineTo(b, ys + (y + h - ys) * 0.2); ctx.stroke(); ctx.setLineDash([]);
      // waves on the open water
      ctx.strokeStyle = 'rgba(200,232,255,.55)'; ctx.lineWidth = 1;
      for (let s = a + 4; s < b - 6; s += 11) { const ph = (st.t || 0) * 1.5 + s * 0.3; ctx.beginPath(); ctx.moveTo(s, ys + 1.5 * Math.sin(ph)); ctx.quadraticCurveTo(s + 3, ys - 2 + 1.5 * Math.sin(ph), s + 6, ys + 1.5 * Math.sin(ph + 1)); ctx.stroke(); }
    });
    // rock under the land, in strata
    [['sheet'], ['green'], ['desert']].forEach(([k]) => {
      const [a, b] = xs[k]; if (b - a < 0.5) return;
      const top = groundY(k), rg = ctx.createLinearGradient(0, top, 0, y + h); rg.addColorStop(0, '#6A5038'); rg.addColorStop(0.15, '#5A4A3E'); rg.addColorStop(0.5, '#4A4448'); rg.addColorStop(1, '#2E2C34');
      ctx.fillStyle = rg; ctx.fillRect(a, top, b - a, y + h - top);
      ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
      for (let s = 1; s < 5; s++) { const yy = top + (y + h - top) * s / 5; ctx.beginPath(); ctx.moveTo(a, yy + Math.sin(a + s) * 2); ctx.bezierCurveTo(a + (b - a) * 0.3, yy - 3, a + (b - a) * 0.7, yy + 3, b, yy); ctx.stroke(); }
    });
    // the ice sheet: a dome on rock, with its layers
    if (xs.sheet[1] - xs.sheet[0] > 2) {
      const [a, b] = xs.sheet, top = ys - h * 0.16;
      const ig = ctx.createLinearGradient(0, top, 0, ys); ig.addColorStop(0, '#FFFFFF'); ig.addColorStop(0.6, '#D8ECFA'); ig.addColorStop(1, '#9CC8E8');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(a - 2, groundY('sheet')); ctx.quadraticCurveTo((a + b) / 2, top - h * 0.03, b + 6, ys); ctx.lineTo(b + 6, ys + 2); ctx.lineTo(a - 2, ys + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(110,150,190,.45)'; ctx.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(a, groundY('sheet') - h * 0.01 * k); ctx.quadraticCurveTo((a + b) / 2, top + h * 0.03 * k, b + 4, ys - 1); ctx.stroke(); }
    }
    // sea ice: floes on the water
    if (xs.seaice[1] - xs.seaice[0] > 2) {
      const [a, b] = xs.seaice, R = rng(3);
      for (let s = a; s < b - 2; s += 7 + R() * 6) { const fw = Math.min(b - s, 5 + R() * 10); const fg = ctx.createLinearGradient(0, ys - 3, 0, ys + 3); fg.addColorStop(0, '#FFFFFF'); fg.addColorStop(1, '#B8D8EE'); ctx.fillStyle = fg; ctx.fillRect(s, ys - 2.5, fw, 4.5); }
    }
    // green land: forest (or fields), drawn as trees
    if (xs.green[1] - xs.green[0] > 2) {
      const [a, b] = xs.green, top = groundY('green');
      const gg = ctx.createLinearGradient(0, top - 2, 0, top + 6); gg.addColorStop(0, st.land === 'crops' ? '#A8A046' : '#3E7A34'); gg.addColorStop(1, '#4A3A28');
      ctx.fillStyle = gg; ctx.fillRect(a, top - 1, b - a, 7);
      const R = rng(9), n = Math.floor((b - a) / 9), TR = window.TERRAIN;
      for (let k = 0; k < n; k++) { const tx = a + 5 + k * 9 + R() * 3, th = h * (0.05 + 0.03 * R()); if (st.land === 'crops' && k % 4) { ctx.fillStyle = '#C8B85A'; ctx.fillRect(tx - 3, top - 4, 6, 4); continue; } if (TR) TR.tree(ctx, tx, top + 1, th, { kind: k % 3 ? 'broad' : 'conifer', seed: k }); }
    }
    // desert: dunes
    if (xs.desert[1] - xs.desert[0] > 2) {
      const [a, b] = xs.desert, top = groundY('desert'), dg = ctx.createLinearGradient(0, top - 8, 0, top + 6); dg.addColorStop(0, '#F0D49A'); dg.addColorStop(1, '#B88C50');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(a, top + 6);
      for (let s = a; s <= b; s += 3) ctx.lineTo(s, top - 3 - 4 * Math.abs(Math.sin((s - a) / 14)));
      ctx.lineTo(b, top + 6); ctx.closePath(); ctx.fill();
    }
    // clouds: as many as the cover, each a lit cumulus
    const GE = window.GEO, nC = Math.round(clamp(st.cloud, 0, 1) * 9), R2 = rng(4), cl = [];
    for (let k = 0; k < 9; k++) { const cxk = x + (k + 0.5) / 9 * w + (R2() - 0.5) * w * 0.05, cyk = y + h * (0.36 + 0.08 * R2()); if (k < nC) cl.push([cxk, cyk]); }
    const order = [4, 1, 7, 2, 6, 0, 8, 3, 5]; cl.length = 0;
    order.slice(0, nC).forEach(k => cl.push([x + (k + 0.5) / 9 * w, y + h * (0.34 + 0.07 * ((k * 37) % 5) / 5)]));
    if (GE) cl.forEach(([cxk, cyk], k) => GE.cloud(ctx, cxk, cyk, w / 9 * 1.25, h * 0.11, k + 3, 0.95, [255, 255, 255]));
    ctx.restore();
    // anchors for the beams and the labels
    const mid = k => (xs[k][0] + xs[k][1]) / 2;
    return { xs, ys, ground: groundY, mid, clouds: cl, toa: y + h * 0.10, trop: y + h * 0.24, cloudY: y + h * 0.36 };
  }

  /* ---------------- a liquid-in-glass thermometer, for plates ---------------- */
  function thermometer(ctx, x, y, h, Tc, lo, hi, o) {
    o = o || {};
    const w = Math.max(8, h * 0.07), bulbR = w * 0.95, top = y, bot = y + h - bulbR * 1.6, f = clamp((Tc - lo) / (hi - lo), 0, 1);
    ctx.save();
    const gg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gg.addColorStop(0, 'rgba(210,225,240,.25)'); gg.addColorStop(0.3, 'rgba(255,255,255,.55)'); gg.addColorStop(1, 'rgba(160,180,200,.25)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, top, w, bot - top + bulbR, w / 2) : ctx.rect(x - w / 2, top, w, bot - top + bulbR); ctx.fill();
    ctx.strokeStyle = 'rgba(220,235,250,.7)'; ctx.lineWidth = 1; ctx.stroke();
    const liq = o.col || '#E8343A', ly = bot - (bot - top - 6) * f;
    ctx.fillStyle = liq; ctx.fillRect(x - w * 0.18, ly, w * 0.36, bot - ly + 2);
    RX.ball(ctx, x, bot + bulbR * 0.55, bulbR, liq, { shadow: false });
    ctx.font = mono(8.5, 500); ctx.fillStyle = 'rgba(220,230,245,.85)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.strokeStyle = 'rgba(220,235,250,.7)';
    const step = o.step || (hi - lo) / 5;
    for (let v = lo; v <= hi + 1e-9; v += step) { const yy = bot - (bot - top - 6) * (v - lo) / (hi - lo); ctx.beginPath(); ctx.moveTo(x + w / 2, yy); ctx.lineTo(x + w / 2 + 4, yy); ctx.stroke(); if (!o.noNums) ctx.fillText(step < 1 ? v.toFixed(1) : String(Math.round(v)), x + w / 2 + 6, yy); }
    ctx.restore();
  }

  /* ---------------- a dial: a galvanometer, a pressure gauge ---------------- */
  function dialTex(title, frac, unit, o) {
    o = o || {};
    const c = canvas(220, 220), x = c.getContext('2d'), cx = 110, cy = 128, R = 88;
    const bg = x.createRadialGradient(cx - 30, cy - 50, 10, cx, cy, 120); bg.addColorStop(0, '#FBF6E8'); bg.addColorStop(1, '#D8CDB0');
    x.fillStyle = '#2A2218'; x.fillRect(0, 0, 220, 220); x.fillStyle = bg; x.beginPath(); x.arc(110, 110, 104, 0, TAU); x.fill();
    const a0 = o.centre ? -Math.PI * 0.5 - 0.9 : -Math.PI * 0.5 - 1.05, a1 = o.centre ? -Math.PI * 0.5 + 0.9 : -Math.PI * 0.5 + 1.05;
    x.strokeStyle = '#2A2014'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, R, a0, a1); x.stroke();
    for (let k = 0; k <= 20; k++) { const a = a0 + (a1 - a0) * k / 20, r1 = k % 5 ? R - 8 : R - 14; x.lineWidth = k % 5 ? 1.2 : 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.stroke(); }
    x.fillStyle = '#2A2014'; x.font = '600 15px "IBM Plex Mono",monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    (o.labels || ['0', '', '50', '', '100']).forEach((t, k, arr) => { if (!t) return; const a = a0 + (a1 - a0) * k / (arr.length - 1); x.fillText(t, cx + Math.cos(a) * (R - 28), cy + Math.sin(a) * (R - 28)); });
    x.font = '600 14px "IBM Plex Sans",sans-serif'; x.fillText(title, cx, cy + 22); x.font = '500 12px "IBM Plex Mono",monospace'; x.fillText(unit, cx, cy + 40);
    const a = a0 + (a1 - a0) * clamp(frac, 0, 1);
    x.strokeStyle = '#B01818'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); x.stroke();
    x.fillStyle = '#1A1410'; x.beginPath(); x.arc(cx, cy, 6, 0, TAU); x.fill();
    const gl = x.createLinearGradient(0, 0, 220, 220); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.beginPath(); x.arc(110, 110, 104, 0, TAU); x.fill();
    return c;
  }

  /* ---------------- 3D bench pieces (through R3 and BENCH) ---------------- */
  const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k] };
  /* Leslie's cube: copper, one face lamp-black, on a tripod over a burner; T °C of its water */
  function leslieCube(F, c, s, Tc, o) {
    o = o || {};
    const ir = o.ir;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => R3.cylinder(F, [c[0] + i * s * 0.45, c[1] + j * s * 0.45, 0], [c[0] + i * s * 0.4, c[1] + j * s * 0.4, c[2] - s / 2], s * 0.035, '#30343C', { segments: 8, shadow: false }));
    R3.cylinder(F, [c[0], c[1], c[2] - s / 2 - 0.004], [c[0], c[1], c[2] - s / 2], s * 0.62, '#3A3E46', { segments: 24, shadow: false });
    R3.box(F, c, [s, s, s], ir ? MEAS.iron(clamp((Tc - 15) / 110, 0, 1)) : '#B8703A', { shadowK: 0.6 });
    // the blackened face toward the tube (+x)
    const P = [[c[0] + s / 2 + 0.0015, c[1] - s * 0.46, c[2] - s * 0.46], [c[0] + s / 2 + 0.0015, c[1] + s * 0.46, c[2] - s * 0.46], [c[0] + s / 2 + 0.0015, c[1] + s * 0.46, c[2] + s * 0.46], [c[0] + s / 2 + 0.0015, c[1] - s * 0.46, c[2] + s * 0.46]];
    F.push([c[0] + s / 2 + 0.003, c[1], c[2]], () => {
      const q = P.map(p => F.cam.project(p)); if (q.some(z => !z.ok)) return;
      F.ctx.fillStyle = ir ? MEAS.iron(clamp((Tc - 15) / 110, 0, 1)) : '#141414'; F.ctx.beginPath(); q.forEach((z, k) => k ? F.ctx.lineTo(z.x, z.y) : F.ctx.moveTo(z.x, z.y)); F.ctx.closePath(); F.ctx.fill();
      if (!ir && Tc > 40) { const m = F.cam.project([c[0] + s / 2, c[1], c[2]]); const g = F.ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, s * m.s * 0.7); g.addColorStop(0, 'rgba(255,90,40,' + clamp((Tc - 40) / 400, 0, 0.25) + ')'); g.addColorStop(1, 'rgba(255,60,20,0)'); F.ctx.fillStyle = g; F.ctx.fillRect(m.x - s * m.s, m.y - s * m.s, 2 * s * m.s, 2 * s * m.s); }
    }, -0.01);
    // a steam wisp from the filler cap when it boils
    R3.cylinder(F, [c[0] - s * 0.2, c[1], c[2] + s / 2], [c[0] - s * 0.2, c[1], c[2] + s / 2 + s * 0.12], s * 0.08, '#C08850', { segments: 12, shadow: false });
    if (Tc >= 99 && o.t != null) F.push([c[0] - s * 0.2, c[1], c[2] + s * 0.9], () => {
      const q = F.cam.project([c[0] - s * 0.2, c[1], c[2] + s * 0.62]); if (!q.ok) return;
      for (let k = 0; k < 5; k++) { const u = ((o.t * 0.4 + k / 5) % 1), r = (3 + 10 * u) * q.s * 0.02; F.ctx.fillStyle = 'rgba(235,240,248,' + (0.35 * (1 - u)).toFixed(2) + ')'; F.ctx.beginPath(); F.ctx.arc(q.x + Math.sin(k * 2 + o.t) * 6 * u, q.y - u * s * q.s * 1.2, r, 0, TAU); F.ctx.fill(); }
    }, -0.02);
  }
  /* Tyndall's tube: brass, along +x from a to b, with rock-salt (or glass) windows at each end */
  function tyndallTube(F, a, b, r, o) {
    o = o || {};
    const ir = o.ir, brass = ir ? MEAS.iron(0.18) : '#C9A24A';
    R3.cylinder(F, a, b, r, brass, { segments: 32, shadowK: 0.5 });
    [a, b].forEach((p, k) => {
      const d = k ? -1 : 1, f0 = [p[0] + d * 0.002, p[1], p[2]], f1 = [p[0] + d * 0.02, p[1], p[2]];
      R3.cylinder(F, k ? f1 : f0, k ? f0 : f1, r * 1.45, ir ? MEAS.iron(0.2) : '#A8823A', { segments: 32, shadow: false });
      // the window: a pale translucent disc in the flange
      const w = [p[0] - d * 0.001, p[1], p[2]];
      F.push(w, () => {
        const pts = []; for (let i = 0; i <= 28; i++) { const t = i / 28 * TAU, q = F.cam.project([w[0], w[1] + Math.cos(t) * r * 0.95, w[2] + Math.sin(t) * r * 0.95]); if (!q.ok) return; pts.push(q); }
        F.ctx.fillStyle = o.win === 'glass' ? 'rgba(150,200,190,.55)' : 'rgba(235,240,245,.55)'; F.ctx.beginPath(); pts.forEach((q, i) => i ? F.ctx.lineTo(q.x, q.y) : F.ctx.moveTo(q.x, q.y)); F.ctx.closePath(); F.ctx.fill();
        F.ctx.strokeStyle = 'rgba(255,255,255,.6)'; F.ctx.lineWidth = 1; F.ctx.stroke();
      }, -0.03);
    });
    // supports
    [0.25, 0.75].forEach(u => { const p = [a[0] + (b[0] - a[0]) * u, a[1], a[2]]; R3.box(F, [p[0], p[1], p[2] / 2 - r / 2], [0.02, 0.05, p[2] - r], ir ? MEAS.iron(0.15) : '#3A3F48', { shadowK: 0.5 }); R3.box(F, [p[0], p[1], 0.006], [0.06, 0.09, 0.012], ir ? MEAS.iron(0.15) : '#2C3038', { shadow: false }); });
    // the inlet and outlet stopcocks on top
    [0.12, 0.88].forEach(u => { const p = [a[0] + (b[0] - a[0]) * u, a[1], a[2] + r]; R3.cylinder(F, p, [p[0], p[1], p[2] + 0.035], 0.006, brass, { segments: 10, shadow: false }); R3.box(F, [p[0], p[1], p[2] + 0.03], [0.012, 0.03, 0.008], '#D8B860', { shadow: false }); });
  }
  /* the thermopile: a polished cone gathering the radiation onto a pile of junctions */
  function thermopile(F, at, o) {
    o = o || {};
    R3.cylinder(F, [at[0] - 0.05, at[1], at[2]], [at[0] + 0.03, at[1], at[2]], 0.026, '#D8DCE2', { segments: 28, shadowK: 0.4 });
    R3.cylinder(F, [at[0] - 0.075, at[1], at[2]], [at[0] - 0.05, at[1], at[2]], 0.04, '#C8CED8', { segments: 28, shadow: false });
    R3.cylinder(F, [at[0] + 0.03, at[1], at[2]], [at[0] + 0.05, at[1], at[2]], 0.02, '#30343C', { segments: 18, shadow: false });
    R3.cylinder(F, [at[0], at[1], at[2] - 0.03], [at[0], at[1], 0.01], 0.006, '#3A3F48', { segments: 8, shadow: false });
    R3.box(F, [at[0], at[1], 0.006], [0.06, 0.06, 0.012], '#2C3038', { shadow: false });
  }
  /* a galvanometer in a wooden case, the dial facing −y */
  function galvanometer(F, at, frac, o) {
    o = o || {};
    R3.box(F, [at[0], at[1], at[2] + 0.06], [0.14, 0.08, 0.12], '#6A4024', { shadowK: 0.7 });
    const img = dialTex(o.title || 'galvanometer', frac, o.unit || 'divisions', o);
    const P0 = [at[0] - 0.055, at[1] - 0.0405, at[2] + 0.115], P1 = [at[0] + 0.055, at[1] - 0.0405, at[2] + 0.115], P3 = [at[0] - 0.055, at[1] - 0.0405, at[2] + 0.005];
    F.push([at[0], at[1] - 0.045, at[2] + 0.06], () => BENCH.faceTex(F.ctx, F.cam, img, P0, P1, P3, 1, null), -0.02);
    [-0.04, 0.04].forEach(dx => R3.cylinder(F, [at[0] + dx, at[1], at[2] + 0.12], [at[0] + dx, at[1], at[2] + 0.135], 0.007, '#D8B860', { segments: 10, shadow: false }));
  }
  /* a gas cylinder with its valve and regulator gauge */
  function gasCylinder(F, base, col, o) {
    o = o || {};
    const r = o.r || 0.045, H = o.h || 0.42;
    R3.cylinder(F, base, [base[0], base[1], base[2] + H], r, col, { segments: 28, shadowK: 0.7 });
    R3.sphere(F, [base[0], base[1], base[2] + H], r * 0.98, col, { shadow: false });
    R3.cylinder(F, [base[0], base[1], base[2] + H + r * 0.6], [base[0], base[1], base[2] + H + r * 1.3], r * 0.25, '#C9A24A', { segments: 14, shadow: false });
    R3.box(F, [base[0], base[1], base[2] + H + r * 1.45], [r * 0.9, r * 0.35, r * 0.3], '#B8BEC8', { shadow: false });
    if (o.gauge != null) {
      const img = dialTex('', o.gauge, o.unit || 'atm', { labels: ['0', '', '1', '', '2'] }), z = base[2] + H + r * 1.5, y = base[1] - r * 0.4;
      F.push([base[0], y - 0.02, z + 0.03], () => BENCH.faceTex(F.ctx, F.cam, img, [base[0] - 0.025, y - 0.02, z + 0.055], [base[0] + 0.025, y - 0.02, z + 0.055], [base[0] - 0.025, y - 0.02, z + 0.005], 1, null), -0.02);
    }
    if (o.label) F.push([base[0], base[1] - r, base[2] + H * 0.55], () => {
      const q = F.cam.project([base[0], base[1] - r * 1.02, base[2] + H * 0.55]); if (!q.ok) return;
      F.ctx.save(); F.ctx.font = mono(Math.max(8, Math.min(13, r * q.s * 0.55)), 700); F.ctx.fillStyle = '#F4F6FA'; F.ctx.textAlign = 'center'; F.ctx.textBaseline = 'middle';
      F.ctx.translate(q.x, q.y); F.ctx.rotate(-Math.PI / 2); F.ctx.fillText(o.label, 0, 0); F.ctx.restore();
    }, -0.02);
  }
  /* a hose between two points, sagging */
  function hose(F, a, b, o) {
    const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u - Math.sin(Math.PI * u) * ((o && o.sag) || 0.06)]); }
    R3.tube(F, pts, 0.005, (o && o.col) || '#C84A2C', { shadow: false });
  }
  /* a glass jar on the bench (base centre, radius, height), with or without a lid, a black card inside,
     its gas faintly tinted; the glass is ONE push: back wall, contents, front wall */
  function jar(F, base, r, H, o) {
    o = o || {};
    const cam = F.cam, ctx = F.ctx, ir = o.ir;
    const ring = (z, rr) => MEAS.ringPts(cam, [base[0], base[1], base[2] + z], rr, 40);
    // the black card on the bottom: its own push (it lies on the jar's floor)
    F.push([base[0], base[1], base[2] + 0.002], () => {
      const c = ring(0.003, r * 0.92); if (!c) return;
      ctx.fillStyle = ir ? MEAS.iron(clamp((o.cardT - 15) / 50, 0, 1)) : '#121214'; ctx.beginPath(); c.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill();
    }, 0.02);
    F.push([base[0], base[1], base[2] + H / 2], () => {
      const b = ring(0, r), t = ring(H, r); if (!b || !t) return;
      const Hh = MEAS.hull2(b.concat(t));
      ctx.save();
      // the gas inside: a faint tint, or its temperature on the camera
      const gcol = ir ? MEAS.iron(clamp((o.airT - 15) / 50, 0, 1)) : o.gas === 'co2' ? 'rgba(200,190,140,' : o.gas === 'humid' ? 'rgba(170,200,230,' : 'rgba(190,215,240,';
      ctx.fillStyle = ir ? rgba(gcol, 0.55) : gcol + '0.10)'; MEAS.path(ctx, Hh); ctx.fill();
      // the glass: bright edges, a highlight stripe, a darker rim
      let x0 = Infinity, x1 = -Infinity; Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      const wg = ctx.createLinearGradient(x0, 0, x1, 0);
      const glass = o.wall === 'salt' ? [245, 245, 240] : [200, 230, 225];
      wg.addColorStop(0, 'rgba(' + glass + ',.30)'); wg.addColorStop(0.12, 'rgba(255,255,255,.10)'); wg.addColorStop(0.22, 'rgba(255,255,255,.38)'); wg.addColorStop(0.3, 'rgba(255,255,255,.06)'); wg.addColorStop(0.85, 'rgba(255,255,255,.04)'); wg.addColorStop(1, 'rgba(' + glass + ',.32)');
      ctx.fillStyle = wg; MEAS.path(ctx, Hh); ctx.fill();
      ctx.strokeStyle = 'rgba(225,240,250,.65)'; ctx.lineWidth = 1.2;
      [b, t].forEach(R => { ctx.beginPath(); R.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); });
      MEAS.path(ctx, Hh); ctx.stroke();
      if (o.lid) {
        const l = ring(H + 0.004, r * 1.04); if (l) { ctx.fillStyle = o.wall === 'salt' ? 'rgba(240,240,236,.6)' : 'rgba(170,200,195,.55)'; ctx.beginPath(); l.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(235,245,250,.8)'; ctx.stroke(); }
      }
      ctx.restore();
    });
  }
  /* a reflector lamp on a stand, aimed down at (aim), glowing when on */
  function lamp(F, at, aim, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam;
    R3.cylinder(F, [at[0] + 0.12, at[1], 0], [at[0] + 0.12, at[1], at[2] + 0.05], 0.008, '#A8B2C0', { segments: 10, shadow: false });
    R3.box(F, [at[0] + 0.12, at[1], 0.008], [0.16, 0.12, 0.016], '#2C3445', { shadowK: 0.7 });
    R3.cylinder(F, [at[0] + 0.12, at[1], at[2] + 0.05], [at[0], at[1], at[2] + 0.05], 0.006, '#A8B2C0', { segments: 8, shadow: false });
    // the reflector: a cone opening downward, drawn as a lit shell
    F.push([at[0], at[1], at[2] + 0.02], () => {
      const top = MEAS.ringPts(cam, [at[0], at[1], at[2] + 0.06], 0.025, 30), mouth = MEAS.ringPts(cam, [at[0], at[1], at[2]], 0.075, 30);
      if (!top || !mouth) return;
      const Hh = MEAS.hull2(top.concat(mouth)); let x0 = Infinity, x1 = -Infinity; Hh.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); });
      const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#5A626E'); g.addColorStop(0.35, '#E4E8EE'); g.addColorStop(0.6, '#9AA2AE'); g.addColorStop(1, '#3A404A');
      ctx.fillStyle = g; MEAS.path(ctx, Hh); ctx.fill();
      ctx.fillStyle = o.on ? 'rgba(255,240,200,.95)' : '#2A2E36'; ctx.beginPath(); mouth.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill();
      if (o.on) { const m = cam.project([at[0], at[1], at[2]]); const rg = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, 0.2 * m.s); rg.addColorStop(0, 'rgba(255,236,190,.55)'); rg.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(m.x, m.y, 0.2 * m.s, 0, TAU); ctx.fill(); }
    });
    // the light cone toward the target, faint
    if (o.on && aim) F.push([(at[0] + aim[0]) / 2, (at[1] + aim[1]) / 2, (at[2] + aim[2]) / 2], () => {
      const a = MEAS.ringPts(cam, [at[0], at[1], at[2]], 0.07, 24), b = MEAS.ringPts(cam, aim, (o.spread || 0.12), 24); if (!a || !b) return;
      const Hh = MEAS.hull2(a.concat(b)), m0 = cam.project(at), m1 = cam.project(aim);
      const g = ctx.createLinearGradient(m0.x, m0.y, m1.x, m1.y); g.addColorStop(0, 'rgba(255,236,180,.20)'); g.addColorStop(1, 'rgba(255,236,180,.03)');
      ctx.fillStyle = g; MEAS.path(ctx, Hh); ctx.fill();
    }, -0.04);
  }
  /* a digital thermometer probe: the box on the bench, the wire into the jar */
  function probe(F, box, tip, Tc, o) {
    o = o || {};
    BENCH.meter(F, [box[0], box[1], box[2] + 0.035], [0, -1, 0.35], 0.08, 0.04, { title: o.title || 'T', value: Tc.toFixed(1), unit: '°C', colour: o.colour || '#7CF0B0' });
    hose(F, [box[0], box[1] + 0.02, box[2] + 0.05], tip, { col: '#202428', sag: 0.03 });
    R3.sphere(F, tip, 0.005, '#C8CED8', { shadow: false });
  }

  /* ---------------- the land of the causes: industry, farms, forest ---------------- */
  /* a coal power station: a turbine hall, a banded chimney and two cooling towers, smoke ∝ the burning */
  function powerStation(ctx, q, s, o) {
    o = o || {};
    const x = q.x, y = q.y;
    ctx.save();
    // cooling towers: hyperboloids, lit from the left
    [[-1.1, 0], [-0.45, 0.15]].forEach(([dx, dy]) => {
      const cx = x + dx * s, by = y + dy * s * 0.3, H = s * 1.05, wb = s * 0.42, wt = s * 0.28, wn = s * 0.24;
      const g = ctx.createLinearGradient(cx - wb, 0, cx + wb, 0); g.addColorStop(0, '#E2E2DC'); g.addColorStop(0.45, '#C8C8C0'); g.addColorStop(1, '#7A7C78');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - wb, by); ctx.quadraticCurveTo(cx - wn * 0.9, by - H * 0.65, cx - wt, by - H); ctx.lineTo(cx + wt, by - H); ctx.quadraticCurveTo(cx + wn * 0.9, by - H * 0.65, cx + wb, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4A4C4A'; ctx.beginPath(); ctx.ellipse(cx, by - H, wt, wt * 0.22, 0, 0, TAU); ctx.fill();
      if (o.on) for (let k = 0; k < 6; k++) { const u = ((o.t || 0) * 0.25 + k / 6) % 1, r = wt * (0.8 + 1.6 * u); ctx.fillStyle = 'rgba(245,247,250,' + (0.55 * (1 - u)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(cx + u * s * 0.4, by - H - u * s * 0.9, r, 0, TAU); ctx.fill(); }
    });
    // turbine hall
    const hg = ctx.createLinearGradient(0, y - s * 0.45, 0, y); hg.addColorStop(0, '#8A92A0'); hg.addColorStop(1, '#4A505C');
    ctx.fillStyle = hg; ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.9, s * 0.45);
    ctx.fillStyle = '#2C323C'; for (let k = 0; k < 5; k++) ctx.fillRect(x + k * s * 0.17, y - s * 0.33, s * 0.08, s * 0.12);
    // the chimney, red and white
    const cx = x + s * 0.95, H = s * 1.9, cw = s * 0.09;
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#E6E6E2' : '#B83A30'; ctx.fillRect(cx - cw * (1 - k * 0.04), y - H * (k + 1) / 8, cw * 2 * (1 - k * 0.04), H / 8 + 0.5); }
    if (o.on) for (let k = 0; k < 9; k++) { const u = ((o.t || 0) * 0.2 + k / 9) % 1, r = cw * (1 + 4 * u) * (0.6 + 0.6 * (o.k || 1)); ctx.fillStyle = 'rgba(' + (90 + 60 * u | 0) + ',' + (90 + 60 * u | 0) + ',' + (95 + 60 * u | 0) + ',' + (0.6 * (1 - u) * clamp(o.k || 1, 0.2, 1)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(cx + u * s * 1.4, y - H - u * s * 0.8, r, 0, TAU); ctx.fill(); }
    // coal heap
    ctx.fillStyle = '#16161A'; ctx.beginPath(); ctx.ellipse(x - s * 0.1, y + s * 0.02, s * 0.35, s * 0.1, 0, Math.PI, TAU); ctx.fill();
    ctx.restore();
  }
  /* a cement works: preheater tower, rotary kiln on piers, silos; dust and CO₂ from the kiln's limestone */
  function cementWorks(ctx, q, s, o) {
    o = o || {};
    const x = q.x, y = q.y;
    ctx.save();
    // silos
    [0, 0.32, 0.64].forEach(dx => { const g = ctx.createLinearGradient(x + dx * s - s * 0.13, 0, x + dx * s + s * 0.13, 0); g.addColorStop(0, '#DCD8CE'); g.addColorStop(0.5, '#B8B4A8'); g.addColorStop(1, '#7C786E'); ctx.fillStyle = g; ctx.fillRect(x + dx * s - s * 0.13, y - s * 0.75, s * 0.26, s * 0.75); ctx.fillStyle = '#8A867C'; ctx.beginPath(); ctx.ellipse(x + dx * s, y - s * 0.75, s * 0.13, s * 0.04, 0, 0, TAU); ctx.fill(); });
    // preheater tower (steel frame) and the kiln: a long tilted tube
    const tx = x - s * 0.55; ctx.fillStyle = '#5A6070'; ctx.fillRect(tx - s * 0.12, y - s * 1.3, s * 0.24, s * 1.3);
    ctx.strokeStyle = '#2C3038'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(tx - s * 0.12, y - s * 1.3 * k / 6); ctx.lineTo(tx + s * 0.12, y - s * 1.3 * k / 6); ctx.stroke(); }
    const kg = ctx.createLinearGradient(0, y - s * 0.32, 0, y - s * 0.12); kg.addColorStop(0, '#C8CCD4'); kg.addColorStop(0.5, '#8A909A'); kg.addColorStop(1, '#4A505A');
    ctx.save(); ctx.translate(tx, y - s * 0.28); ctx.rotate(0.06); ctx.fillStyle = kg; ctx.fillRect(-s * 1.15, -s * 0.07, s * 1.15, s * 0.14); ctx.fillStyle = '#2C3038'; [-0.9, -0.5, -0.15].forEach(u => ctx.fillRect(s * u, -s * 0.09, s * 0.04, s * 0.18)); ctx.restore();
    [-1.4, -1.0, -0.7].forEach(u => { ctx.fillStyle = '#6A6E76'; ctx.fillRect(x + u * s, y - s * 0.22, s * 0.06, s * 0.22); });
    if (o.glow) { const g = ctx.createRadialGradient(tx - s * 1.15, y - s * 0.34, 1, tx - s * 1.15, y - s * 0.34, s * 0.15); g.addColorStop(0, 'rgba(255,160,60,.9)'); g.addColorStop(1, 'rgba(255,100,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx - s * 1.15, y - s * 0.34, s * 0.15, 0, TAU); ctx.fill(); }
    if (o.on) for (let k = 0; k < 7; k++) { const u = ((o.t || 0) * 0.22 + k / 7) % 1, r = s * 0.08 * (1 + 3.5 * u); ctx.fillStyle = 'rgba(205,200,188,' + (0.5 * (1 - u)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(tx + u * s * 0.9, y - s * 1.3 - u * s * 0.7, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  /* a herd of cattle seen from afar: bodies on legs, heads down — at landscape scale, dark forms with light patches */
  function cattle(ctx, q, s, n, seed) {
    const R = rng(seed || 3);
    ctx.save();
    for (let k = 0; k < n; k++) {
      const x = q.x + (R() - 0.5) * s * 2.4, y = q.y + (R() - 0.5) * s * 0.5, b = s * (0.16 + 0.04 * R()), dir = R() < 0.5 ? -1 : 1;
      ctx.strokeStyle = '#2A1E16'; ctx.lineWidth = Math.max(0.8, b * 0.12);
      [-0.32, -0.18, 0.2, 0.34].forEach(u => { ctx.beginPath(); ctx.moveTo(x + u * b * 2, y - b * 0.3); ctx.lineTo(x + u * b * 2, y + b * 0.25); ctx.stroke(); });
      const g = ctx.createLinearGradient(0, y - b * 0.8, 0, y); g.addColorStop(0, k % 3 ? '#6A4630' : '#2A2420'); g.addColorStop(1, '#2A1A12');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - b * 0.45, b * 0.85, b * 0.36, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + dir * b * 0.95, y - b * 0.3, b * 0.24, b * 0.18, dir * 0.6, 0, TAU); ctx.fill();
      if (k % 3 === 0) { ctx.fillStyle = 'rgba(240,235,225,.85)'; ctx.beginPath(); ctx.ellipse(x - b * 0.2, y - b * 0.5, b * 0.22, b * 0.15, 0.3, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  /* a volcano's eruption column, umbrella spreading into the stratosphere */
  function eruption(ctx, q, s, k, t) {
    if (k <= 0.01) return;
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const u = i / 26, w = s * (0.15 + 0.5 * u) * (1 + 0.3 * Math.sin(t * 2 + i)), yy = q.y - u * s * 2.6 * k, xx = q.x + Math.sin(i * 1.3 + t) * s * 0.08 * u;
      const g = ctx.createRadialGradient(xx, yy, 1, xx, yy, w); g.addColorStop(0, 'rgba(120,110,104,' + (0.75 * k).toFixed(2) + ')'); g.addColorStop(1, 'rgba(90,86,84,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, w, 0, TAU); ctx.fill();
    }
    const top = q.y - s * 2.6 * k; ctx.fillStyle = 'rgba(200,196,190,' + (0.45 * k).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(q.x + s * 0.5, top, s * 1.6 * k, s * 0.22, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- the two-layer ocean, in section ---------------- */
  const ANOM = [[-2, '#2B5FD9'], [-0.5, '#7FA8F0'], [0, '#C8CED8'], [0.5, '#F5B07A'], [2, '#E0402A'], [5, '#8A1020']];
  function anomCol(v) { for (let i = 1; i < ANOM.length; i++) if (v <= ANOM[i][0]) return mix(ANOM[i - 1][1], ANOM[i][1], (v - ANOM[i - 1][0]) / (ANOM[i][0] - ANOM[i - 1][0])); return ANOM[ANOM.length - 1][1]; }
  function oceanSection(ctx, x, y, w, h, st) {
    const ys = y + h * 0.40, yMix = ys + (y + h - ys) * 0.17, yb = y + h;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, ys); sky.addColorStop(0, '#071230'); sky.addColorStop(0.55, '#2A5A9C'); sky.addColorStop(1, mix('#9CC4EA', anomCol(st.T * 2), clamp(Math.abs(st.T) * 0.8, 0, 0.45)));
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, ys - y);
    // the upper ocean, mixed by the wind, takes the anomaly within years
    const kU = clamp(Math.abs(st.T) * 1.4, 0, 0.75), kD = clamp(Math.abs(st.TD) * 5, 0, 0.75);
    const up = ctx.createLinearGradient(0, ys, 0, yMix); up.addColorStop(0, mix('#2C86C8', anomCol(st.T * 2), kU)); up.addColorStop(1, mix('#1A5E9C', anomCol(st.T * 2), kU * 0.85));
    ctx.fillStyle = up; ctx.fillRect(x, ys, w, yMix - ys);
    // the thermocline, then the deep ocean, which warms only over centuries
    const th = ctx.createLinearGradient(0, yMix, 0, yMix + 14); th.addColorStop(0, 'rgba(10,30,60,0)'); th.addColorStop(1, 'rgba(10,30,60,.5)');
    const dp = ctx.createLinearGradient(0, yMix, 0, yb); dp.addColorStop(0, mix('#124A82', anomCol(st.TD * 4), kD)); dp.addColorStop(1, mix('#04142C', anomCol(st.TD * 4), kD * 0.6));
    ctx.fillStyle = dp; ctx.fillRect(x, yMix, w, yb - yMix); ctx.fillStyle = th; ctx.fillRect(x, yMix, w, 14);
    // light shafts in the sunlit layer
    ctx.globalAlpha = 0.10; for (let k = 0; k < 7; k++) { const sx = x + w * (k + 0.3) / 7 + Math.sin((st.t || 0) * 0.5 + k) * 8, g = ctx.createLinearGradient(0, ys, 0, yMix + 30); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, ys); ctx.lineTo(sx + 16, ys); ctx.lineTo(sx + 40, yMix + 30); ctx.lineTo(sx + 20, yMix + 30); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(200,225,250,.55)'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x, yMix); ctx.lineTo(x + w, yMix); ctx.stroke(); ctx.setLineDash([]);
    // the sea floor, with sediment
    const sf = ctx.createLinearGradient(0, yb - 16, 0, yb); sf.addColorStop(0, '#5A4A38'); sf.addColorStop(1, '#2A2018');
    ctx.fillStyle = sf; ctx.beginPath(); ctx.moveTo(x, yb); for (let s = 0; s <= w; s += 6) ctx.lineTo(x + s, yb - 9 - 5 * Math.sin(s * 0.03) - 2 * Math.sin(s * 0.13)); ctx.lineTo(x + w, yb); ctx.closePath(); ctx.fill();
    // waves
    ctx.strokeStyle = 'rgba(225,242,255,.75)'; ctx.lineWidth = 1.2;
    for (let s = x + 4; s < x + w - 6; s += 12) { const ph = (st.t || 0) * 1.2 + s * 0.25; ctx.beginPath(); ctx.moveTo(s, ys + 1.5 * Math.sin(ph)); ctx.quadraticCurveTo(s + 3, ys - 2.5, s + 6, ys + 1.5 * Math.sin(ph + 1)); ctx.stroke(); }
    // the depth scale on the left: the deep layer is drawn shrunk, 70 m to 3,000 m
    ctx.font = mono(9, 500); ctx.fillStyle = 'rgba(210,228,250,.8)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [[0, ys], [70, yMix], [1000, yMix + (yb - yMix) * 0.33], [2000, yMix + (yb - yMix) * 0.66], [3000, yb - 12]].forEach(([d, yy]) => { ctx.fillRect(x, yy - 0.5, 8, 1); ctx.fillText(d ? d.toLocaleString('en-US') + ' m' : 'sea level', x + 11, yy); });
    // heat moving between the layers: broad arrows, as wide as the flux
    const q = st.flux || 0, n = 5;
    if (Math.abs(q) > 0.003) for (let k = 0; k < n; k++) {
      const ax = x + w * (k + 0.6) / (n + 0.4), len = (yb - yMix) * 0.5, wdt = clamp(Math.abs(q) * 16, 2.5, 14), dn = q > 0;
      const y0 = dn ? yMix - 10 : yMix + len, y1 = dn ? yMix + len : yMix - 10, col = dn ? '#FF9A60' : '#7EB0FF';
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(col, 0.15)); g.addColorStop(1, rgba(col, 0.9));
      ctx.fillStyle = g; ctx.fillRect(ax - wdt / 2, Math.min(y0, y1 + (dn ? -8 : 8)), wdt, Math.abs(y1 - y0) - 8);
      arrowHead(ctx, ax, y1, dn ? Math.PI / 2 : -Math.PI / 2, wdt + 5, col);
    }
    ctx.restore();
    return { ys, yMix, yb };
  }
  /* a volcano, its cone lit from the left, a glow in the crater when it erupts */
  function volcano(ctx, x, y, w, h, glow) {
    ctx.save();
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#8A7260'); g.addColorStop(0.45, '#5E4A3C'); g.addColorStop(1, '#2C221C');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.18, y - h * 0.55, x - w * 0.07, y - h); ctx.lineTo(x + w * 0.07, y - h); ctx.quadraticCurveTo(x + w * 0.18, y - h * 0.55, x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,14,.5)'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * w * 0.02, y - h); ctx.quadraticCurveTo(x + k * w * 0.08, y - h * 0.5, x + k * w * 0.14, y); ctx.stroke(); }
    if (glow > 0.02) { const r = ctx.createRadialGradient(x, y - h, 1, x, y - h, w * 0.18); r.addColorStop(0, 'rgba(255,170,70,' + clamp(glow, 0, 1) + ')'); r.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = r; ctx.beginPath(); ctx.arc(x, y - h, w * 0.18, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  window.G6F = { space, sun, weather, shell, swBeam, lwBeam, fluxTag, arrowHead, satellite, section, thermometer, dialTex,
                 leslieCube, tyndallTube, thermopile, galvanometer, gasCylinder, hose, jar, lamp, probe,
                 powerStation, cementWorks, cattle, eruption, oceanSection, volcano, anomCol, mono, sans };
})();
