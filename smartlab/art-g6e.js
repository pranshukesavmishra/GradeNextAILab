/* ============================================================
   G6E — the figure library of Grade 6 Unit E
   (Regional Climate, Organisms and Heredity).
   The weather station: a Stevenson screen with its louvred walls, double
   roof and door hinged at the foot, the max and min thermometers inside;
   a copper rain gauge sunk in the lawn; snow lying when the model says it
   lies; a sky set by the day's computed weather. The instruments a climate
   is read from: a climograph, a heat raster of years × days, colour scales
   for temperature, rain and the Köppen classes.
   Everything here draws what a lab computed; nothing here computes science.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale, norm, cross } = R3;
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  const css = (c, a) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')';
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';

  /* ---------------- colour scales ---------------- */
  // temperature: the diverging scale of climate atlases, −40 … +40 °C
  const TSTOPS = [[-40, [76, 0, 110]], [-30, [74, 40, 170]], [-20, [40, 90, 210]], [-10, [70, 150, 230]], [0, [180, 225, 250]],
    [5, [230, 245, 220]], [10, [250, 240, 160]], [15, [252, 205, 100]], [20, [248, 160, 60]], [25, [235, 100, 40]], [30, [200, 40, 30]], [40, [110, 0, 20]]];
  function stops(S, v) {
    if (v <= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) if (v <= S[i][0]) { const a = S[i - 1], b = S[i]; return mixc(a[1], b[1], (v - a[0]) / (b[0] - a[0])); }
    return S[S.length - 1][1];
  }
  const tempRGB = t => stops(TSTOPS, t);
  // rain, mm a month: dry tan to deep blue-green
  const PSTOPS = [[0, [196, 160, 110]], [10, [222, 200, 150]], [25, [236, 232, 190]], [50, [190, 225, 170]], [100, [110, 200, 160]], [175, [40, 160, 170]], [250, [30, 100, 170]], [400, [40, 40, 140]]];
  const rainRGB = p => stops(PSTOPS, p);
  // anomaly from normal: blue below, red above (°C)
  const ASTOPS = [[-12, [20, 40, 120]], [-6, [50, 110, 200]], [-2, [150, 195, 235]], [0, [240, 240, 240]], [2, [245, 190, 150]], [6, [215, 80, 60]], [12, [120, 10, 20]]];
  const anomRGB = a => stops(ASTOPS, a);
  // Köppen–Geiger, Peel et al. (2007)
  const KG = { Af: [0, 0, 255], Am: [0, 120, 255], Aw: [70, 170, 250], As: [70, 170, 250], BWh: [255, 0, 0], BWk: [255, 150, 150], BSh: [245, 165, 0], BSk: [255, 220, 100],
    Csa: [255, 255, 0], Csb: [200, 200, 0], Csc: [150, 150, 0], Cwa: [150, 255, 150], Cwb: [100, 200, 100], Cwc: [50, 150, 50], Cfa: [200, 255, 80], Cfb: [100, 255, 80], Cfc: [50, 200, 0],
    Dsa: [255, 0, 255], Dsb: [200, 0, 200], Dsc: [150, 50, 150], Dsd: [150, 100, 150], Dwa: [170, 175, 255], Dwb: [90, 120, 220], Dwc: [75, 80, 180], Dwd: [50, 0, 135],
    Dfa: [0, 255, 255], Dfb: [55, 200, 255], Dfc: [0, 125, 125], Dfd: [0, 70, 95], ET: [178, 178, 178], EF: [102, 102, 102] };
  const kgRGB = c => KG[c] || [128, 128, 128];

  /* ---------------- the lawn: grass, or snow over it ---------------- */
  function grassTex(snow, sand) {
    const key = 'grass' + (snow ? 1 : 0) + (sand ? 's' : '');
    if (cache[key]) return cache[key];
    const c = canvas(512, 512), x = c.getContext('2d'), r = rng(snow ? 29 : 17);
    if (sand && !snow) {        // desert pavement: tan grit, scattered dark pebbles, wind ripples
      x.fillStyle = '#C9A877'; x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 26000; i++) { x.fillStyle = css(mixc([150, 115, 75], [235, 210, 165], r()), 0.5); x.fillRect(r() * 512, r() * 512, 1 + r() * 1.5, 1 + r() * 1.5); }
      for (let i = 0; i < 700; i++) { x.fillStyle = css(mixc([70, 50, 40], [120, 95, 70], r()), 0.9); x.beginPath(); x.ellipse(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2, r() * 3, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(120,90,55,.18)'; x.lineWidth = 2;
      for (let k = 0; k < 30; k++) { const y0 = r() * 512; x.beginPath(); for (let i = 0; i <= 64; i++) { const xx = i * 8, yy = y0 + Math.sin(i * 0.5 + k) * 3; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
      return (cache[key] = c);
    }
    x.fillStyle = snow ? '#E8EEF5' : '#4E7A34'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const px = r() * 512, py = r() * 512, l = 3 + r() * 7, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
      x.strokeStyle = snow ? css(mixc([205, 216, 230], [255, 255, 255], r()), 0.5) : css(mixc([48, 86, 30], [140, 175, 80], r()), 0.85);
      x.lineWidth = 0.8 + r() * 0.8;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    if (!snow) for (let i = 0; i < 60; i++) { x.fillStyle = css(mixc([60, 70, 30], [120, 110, 60], r()), 0.35); x.beginPath(); x.ellipse(r() * 512, r() * 512, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, TAU); x.fill(); }
    return (cache[key] = c);
  }
  function lawn(F, half, snowMM, sand) {
    const snow = snowMM > 2;
    R3.texPlane(F, [0, 0, 0], [half, 0, 0], [0, half, 0], grassTex(snow, sand), { grid: 14, bias: F.GROUND });
    if (snowMM > 0.5 && !snow) R3.texPlane(F, [0, 0, 0.001], [half, 0, 0], [0, half, 0], grassTex(true), { grid: 10, bias: F.GROUND - 1, alpha: clamp(snowMM / 2, 0, 1) * 0.8 });
  }

  /* ---------------- a face with louvres, as ONE item (a face and its marks are one push) ---------------- */
  function louvredFace(F, c, e1, e2, n, colour, slats, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, col = F.shade(colour, n, { ambient: 0.55 }), dark = RX.mix(col, '#1A2230', 0.45), lite = RX.mix(col, '#FFFFFF', 0.35);
    F.push(c, () => {
      const P = [add(add(c, e1), e2), add(sub(c, e1), e2), sub(sub(c, e1), e2), sub(add(c, e1), e2)].map(p => cam.project(p));
      if (P.some(q => !q.ok)) return;
      ctx.save();
      ctx.fillStyle = col; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill();
      ctx.clip();
      // each slat: a lit upper edge and the shadow it throws on the one below
      for (let k = 1; k < slats; k++) {
        const t = 1 - 2 * k / slats;
        const a = cam.project(add(add(c, e1), scale(e2, t))), b = cam.project(add(sub(c, e1), scale(e2, t)));
        const a2 = cam.project(add(add(c, e1), scale(e2, t - 0.9 / slats))), b2 = cam.project(add(sub(c, e1), scale(e2, t - 0.9 / slats)));
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(a2.x, a2.y); ctx.closePath(); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = lite; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = RX.mix(colour, '#05080F', 0.55); ctx.lineWidth = 1; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.stroke();
    }, o.bias);
  }

  /* ---------------- the Stevenson screen ----------------
     at: the foot of the stand. Door on the −y side (it faces north, in the north, so the
     Sun never shines on the thermometers when it is opened); hinged at its foot. The bulbs
     sit 1.25 m above the grass, as the WMO asks. o.tmax, o.tmin: the readings (°C). */
  const SCREEN = { w: 0.78, d: 0.56, h: 0.56, z0: 1.02 };
  function stevenson(F, at, o) {
    o = o || {};
    const W = SCREEN.w, D = SCREEN.d, Hh = SCREEN.h, z0 = at[2] + SCREEN.z0, white = '#F2F4F2', post = '#E6E8E4';
    const cx = at[0], cy = at[1];
    // the stand: four posts and two rails
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => R3.box(F, [cx + sx * (W / 2 - 0.05), cy + sy * (D / 2 - 0.05), at[2] + z0 / 2 - 0.01], [0.06, 0.06, z0 + 0.02], post, { shadowK: 0.6 }));
    [-1, 1].forEach(sy => R3.box(F, [cx, cy + sy * (D / 2 - 0.05), at[2] + 0.35], [W - 0.08, 0.04, 0.05], post, { shadow: false }));
    // the box: louvred on all four sides, a slatted floor
    const c = [cx, cy, z0 + Hh / 2];
    louvredFace(F, add(c, [0, D / 2, 0]), [W / 2, 0, 0], [0, 0, Hh / 2], [0, 1, 0], white, 11);
    louvredFace(F, add(c, [W / 2, 0, 0]), [0, D / 2, 0], [0, 0, Hh / 2], [1, 0, 0], white, 11);
    louvredFace(F, add(c, [-W / 2, 0, 0]), [0, -D / 2, 0], [0, 0, Hh / 2], [-1, 0, 0], white, 11);
    R3.box(F, [cx, cy, z0 + 0.01], [W, D, 0.02], '#D8DCD8', { shadow: false });
    // the open door: the louvred front, folded down on its hinge
    const fy = cy - D / 2, open = o.open == null ? 1 : o.open, ang = open * Math.PI * 0.5;
    const dc = [cx, fy - Math.sin(ang) * Hh / 2, z0 + Math.cos(ang) * Hh / 2];
    const e2 = [0, -Math.sin(ang) * Hh / 2, Math.cos(ang) * Hh / 2];
    // the dark inside, seen through the opening (a back wall and the thermometer frame)
    const ctx = F.ctx, cam = F.cam;
    F.push(add(c, [0, D * 0.25, 0]), () => {
      const P = [[cx - W / 2, cy + D / 2 - 0.02, z0], [cx + W / 2, cy + D / 2 - 0.02, z0], [cx + W / 2, cy + D / 2 - 0.02, z0 + Hh], [cx - W / 2, cy + D / 2 - 0.02, z0 + Hh]].map(p => cam.project(p));
      if (P.some(q => !q.ok)) return;
      const g = ctx.createLinearGradient(P[0].x, P[3].y, P[0].x, P[0].y); g.addColorStop(0, '#9AA3A6'); g.addColorStop(1, '#C7CCCB');
      ctx.fillStyle = g; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill();
      // the light leaking through the louvres
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      for (let k = 1; k < 11; k++) { const yy = P[0].y + (P[3].y - P[0].y) * k / 11; ctx.beginPath(); ctx.moveTo(P[0].x, yy); ctx.lineTo(P[1].x, yy); ctx.stroke(); }
      ctx.restore();
    });
    // the thermometer frame: two uprights and four thermometers
    const tz = at[2] + 1.25, ty = cy + 0.02;
    [-0.22, 0.22].forEach(x => R3.box(F, [cx + x, ty + 0.06, z0 + Hh / 2], [0.025, 0.02, Hh - 0.06], '#B8BDBA', { shadow: false }));
    const thermo = (y0, z, len, bulb, fluid, reading) => {
      const a = [cx - len / 2, ty + y0, z], b = [cx + len / 2, ty + y0, z];
      R3.cylinder(F, a, b, 0.006, '#DDE9F0', { shadow: false, segments: 10 });
      R3.sphere(F, bulb < 0 ? a : b, 0.011, fluid, { shadow: false });
      const k = clamp((reading + 40) / 90, 0, 1), from = bulb < 0 ? a : b, to = [from[0] - bulb * len * k, from[1], from[2]];
      R3.cylinder(F, from, to, 0.0035, fluid, { shadow: false, segments: 6, caps: false });
    };
    thermo(0, tz + 0.10, 0.42, -1, '#B9C2CC', o.tmax == null ? 20 : o.tmax);           // maximum: mercury, constricted
    thermo(0, tz + 0.04, 0.42, -1, '#D8463A', o.tmin == null ? 10 : o.tmin);          // minimum: alcohol, with a glass index
    [-0.08, 0.08].forEach((x, i) => {
      const a = [cx + x, ty, tz - 0.10], b = [cx + x, ty, tz + 0.16];
      R3.cylinder(F, a, b, 0.006, '#DDE9F0', { shadow: false, segments: 10 });
      R3.sphere(F, a, 0.011, i ? '#E8E8E8' : '#B9C2CC', { shadow: false });
    });
    // the door, louvred, its inside face showing
    louvredFace(F, dc, [W / 2, 0, 0], e2, norm(cross([1, 0, 0], e2)).map(v => -v), white, 11);
    // the double roof, sloping to the back, overhanging
    const rz = z0 + Hh + 0.035;
    R3.box(F, [cx, cy, rz], [W + 0.10, D + 0.12, 0.03], '#EEF0EE', { shadow: false });
    const tilt = 0.12, ax = [[1, 0, 0], [0, Math.cos(tilt), -Math.sin(tilt)], [0, Math.sin(tilt), Math.cos(tilt)]];
    R3.box(F, [cx, cy, rz + 0.075], [W + 0.16, D + 0.20, 0.03], '#F6F7F6', { shadow: false, axes: ax });
    return { bulb: [cx, ty, tz], top: [cx, cy, rz + 0.12], door: dc };
  }

  /* ---------------- the rain gauge: a copper can, 127 mm across, its rim 30 cm up ---------------- */
  function rainGauge(F, at, o) {
    o = o || {};
    const r = 0.0635, h = 0.30;
    R3.cylinder(F, [at[0], at[1], at[2] - 0.02], [at[0], at[1], at[2] + h - 0.03], r, '#B8733F', { segments: 24 });
    R3.cylinder(F, [at[0], at[1], at[2] + h - 0.03], [at[0], at[1], at[2] + h], r * 1.02, '#D9A456', { segments: 24, inner: r * 0.94 });
    // the funnel inside the rim, catching what falls
    const ctx = F.ctx, cam = F.cam;
    F.push([at[0], at[1], at[2] + h - 0.005], () => {
      const c = cam.project([at[0], at[1], at[2] + h - 0.02]), e = cam.project([at[0] + r * 0.94, at[1], at[2] + h - 0.005]), f = cam.project([at[0], at[1] + r * 0.94, at[2] + h - 0.005]);
      if (!c.ok || !e.ok || !f.ok) return;
      const rx = Math.hypot(e.x - c.x, e.y - c.y), ry = Math.max(1, Math.abs(f.y - c.y));
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx); g.addColorStop(0, '#2A1E14'); g.addColorStop(0.5, '#6A4A2C'); g.addColorStop(1, '#A87A4A');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y - ry * 0.2, rx, ry, 0, 0, TAU); ctx.fill();
      if (o.wet) { ctx.fillStyle = 'rgba(160,200,230,.55)'; ctx.beginPath(); ctx.ellipse(c.x, c.y - ry * 0.1, rx * 0.25, ry * 0.25, 0, 0, TAU); ctx.fill(); }
    }, -0.02);
    return { top: [at[0], at[1], at[2] + h] };
  }

  /* ---------------- the sky of the day ----------------
     wx: { cloud 0..1, rain mm, snow (bool: what falls is snow), t (sim seconds, for the drops), night } */
  function sky(ctx, w, h, horizonY, wx) {
    const cl = clamp(wx.cloud || 0, 0, 1);
    const top = mixc([46, 104, 186], [92, 100, 112], cl), mid = mixc([120, 170, 225], [150, 156, 164], cl), low = mixc([205, 222, 238], [178, 182, 188], cl);
    const g = ctx.createLinearGradient(0, 0, 0, Math.max(10, horizonY));
    g.addColorStop(0, css(top)); g.addColorStop(0.6, css(mid)); g.addColorStop(1, css(low));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, Math.max(0, horizonY) + 2);
    if (cl < 0.7) {                       // the Sun, behind and to the left of the viewer's shoulder
      const sx = w * 0.16, sy = Math.max(30, horizonY * 0.28);
      const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 90); sg.addColorStop(0, css([255, 252, 235], 1 - cl)); sg.addColorStop(0.12, css([255, 245, 210], 0.8 * (1 - cl))); sg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 90, 0, TAU); ctx.fill();
    }
    // cloud: a few lit cumulus on a fine day, a grey deck as it closes in
    const G = window.GEO, n = Math.round(3 + cl * 9);
    for (let i = 0; i < n; i++) {
      const u = ((i * 0.618 + 0.13) % 1), x = u * w * 1.1 - w * 0.05, y = horizonY * (0.12 + 0.55 * ((i * 0.37) % 1)) ;
      const lit = cl > 0.6 ? [170, 175, 182] : [255, 255, 255];
      if (G) G.cloud(ctx, x, y, w * (0.16 + cl * 0.2), horizonY * (0.10 + cl * 0.10), i + 3, 0.55 + cl * 0.4, lit);
    }
    if (cl > 0.75) { ctx.fillStyle = css([120, 126, 134], (cl - 0.75) * 2.4); ctx.fillRect(0, 0, w, horizonY * 0.5); }
  }
  /* rain or snow falling across the whole stage, from simulated time */
  function precip(ctx, w, h, mm, snow, t) {
    if (!(mm > 0.2)) return;
    const n = Math.round(clamp(mm, 0, 40) * 9 + 40), r = rng(11);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x0 = r() * w, sp = snow ? 40 + r() * 30 : 520 + r() * 240, y = ((r() * h + t * sp) % (h + 40)) - 20;
      if (snow) { const x = x0 + Math.sin(t * 1.3 + i) * 8; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, y, 1.2 + r() * 1.6, 0, TAU); ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(200,215,235,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 - 3, y + 14); ctx.stroke(); }
    }
    ctx.restore();
  }

  /* ---------------- the max and min thermometers, magnified ----------------
     Two horizontal thermometers on their frame. The maximum holds mercury with a constriction
     by the bulb, so the thread stays at the day's highest; the minimum holds alcohol and a
     glass index the meniscus drags down and leaves at the day's lowest. */
  function thermoPair(ctx, x, y, w, h, o) {
    const lo = o.lo == null ? -40 : o.lo, hi = o.hi == null ? 50 : o.hi, F = o.f ? v => v * 9 / 5 + 32 : v => v, u = o.f ? '°F' : '°C';
    const row = (yy, kind, val, now) => {
      const x0 = x + 34, x1 = x + w - 16, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), r = Math.max(4, h * 0.11);
      // the scale
      ctx.font = mono(9); ctx.fillStyle = '#C9D4E6'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let v = lo; v <= hi + 1e-9; v += 5) {
        const xx = X(v); ctx.strokeStyle = 'rgba(200,212,230,.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xx, yy + r + 1); ctx.lineTo(xx, yy + r + (v % 10 ? 4 : 7)); ctx.stroke();
        if (v % ((x1 - x0) / ((hi - lo) / 10) > 34 ? 10 : 20) === 0) ctx.fillText(String(Math.round(F(v))), xx, yy + r + 8);
      }
      // the glass
      const gg = ctx.createLinearGradient(0, yy - r, 0, yy + r); gg.addColorStop(0, 'rgba(235,245,255,.55)'); gg.addColorStop(0.5, 'rgba(150,175,200,.18)'); gg.addColorStop(1, 'rgba(235,245,255,.40)');
      ctx.fillStyle = gg; ctx.strokeStyle = 'rgba(220,235,250,.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 - 6, yy - r * 0.7); ctx.lineTo(x1 + 6, yy - r * 0.7); ctx.arc(x1 + 6, yy, r * 0.7, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x0 - 6, yy + r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      const fl = kind === 'max' ? '#C2CAD4' : '#E2483B';
      RX.ball(ctx, x0 - 14, yy, r * 1.25, fl, { shadow: false });
      // the bore and its liquid: the max keeps its peak, the min's alcohol reads now with the index left at the low
      const level = kind === 'max' ? val : now;
      ctx.strokeStyle = fl; ctx.lineWidth = Math.max(2, r * 0.36); ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(x0 - 6, yy); ctx.lineTo(X(clamp(level, lo, hi)), yy); ctx.stroke();
      if (kind === 'max') { ctx.strokeStyle = '#05080F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 2, yy - r * 0.4); ctx.lineTo(x0 + 2, yy + r * 0.4); ctx.stroke(); }
      else {
        const xi = X(clamp(val, lo, hi));
        ctx.fillStyle = '#1C2A4A'; ctx.fillRect(xi - 1, yy - r * 0.3, 12, r * 0.6);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(xi, yy - r * 0.25, 10, 1.2);
      }
      // the reading
      ctx.font = sans(11, 700); ctx.fillStyle = kind === 'max' ? '#FFB27A' : '#8EC9FF'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText((kind === 'max' ? 'Maximum ' : 'Minimum ') + F(val).toFixed(1) + ' ' + u, x0 - 8, yy - r - 3);
      // a reading mark
      const xr = X(clamp(val, lo, hi)); ctx.strokeStyle = kind === 'max' ? '#FFB27A' : '#8EC9FF'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(xr, yy - r - 2); ctx.lineTo(xr, yy + r + 2); ctx.stroke(); ctx.setLineDash([]);
    };
    row(y + h * 0.30, 'max', o.tmax, o.tnow);
    row(y + h * 0.78, 'min', o.tmin, o.tnow);
  }

  /* ---------------- a climograph: rain as bars, temperature as a line ---------------- */
  function climograph(ctx, x, y, w, h, o) {
    const T = o.T, P = o.P, Tl = o.tmin == null ? -30 : o.tmin, Th = o.tmax == null ? 40 : o.tmax, Pm = o.pmax || 400, f = o.f;
    const x0 = x + 30, x1 = x + w - 30, y0 = y + h - 16, y1 = y + (o.title ? 16 : 4), bw = (x1 - x0) / 12;
    const Y = t => y0 - (t - Tl) / (Th - Tl) * (y0 - y1), YP = p => y0 - Math.min(p, Pm) / Pm * (y0 - y1);
    ctx.save();
    if (o.title) { ctx.font = sans(11, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.title, x + 4, y); }
    ctx.strokeStyle = 'rgba(150,165,190,.25)'; ctx.lineWidth = 1;
    for (let t = Math.ceil(Tl / 10) * 10; t <= Th; t += 10) { ctx.beginPath(); ctx.moveTo(x0, Y(t)); ctx.lineTo(x1, Y(t)); ctx.stroke(); }
    if (Tl < 0 && Th > 0) { ctx.strokeStyle = 'rgba(160,200,255,.45)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, Y(0)); ctx.lineTo(x1, Y(0)); ctx.stroke(); ctx.setLineDash([]); }
    P.forEach((p, m) => {
      const xa = x0 + m * bw + bw * 0.14, ww = bw * 0.72, yy = YP(p);
      const g = ctx.createLinearGradient(xa, 0, xa + ww, 0); g.addColorStop(0, '#5FA8F0'); g.addColorStop(1, '#2A68B8');
      ctx.fillStyle = g; ctx.fillRect(xa, yy, ww, y0 - yy);
      if (o.ghostP) { const gy = YP(o.ghostP[m]); ctx.strokeStyle = 'rgba(200,220,255,.8)'; ctx.lineWidth = 1.2; ctx.strokeRect(xa, gy, ww, y0 - gy); }
    });
    if (o.ghostT) { ctx.strokeStyle = 'rgba(255,190,150,.7)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); o.ghostT.forEach((t, m) => { const xx = x0 + (m + 0.5) * bw; m ? ctx.lineTo(xx, Y(t)) : ctx.moveTo(xx, Y(t)); }); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = '#FF6A3D'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath();
    T.forEach((t, m) => { const xx = x0 + (m + 0.5) * bw; m ? ctx.lineTo(xx, Y(t)) : ctx.moveTo(xx, Y(t)); }); ctx.stroke();
    T.forEach((t, m) => { ctx.fillStyle = '#FFD2B8'; ctx.beginPath(); ctx.arc(x0 + (m + 0.5) * bw, Y(t), 2.4, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = 'rgba(200,212,230,.7)'; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.font = mono(9); ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF9A70'; ctx.textAlign = 'right';
    for (let t = Math.ceil(Tl / 10) * 10; t <= Th; t += 10) ctx.fillText(String(Math.round(f ? t * 9 / 5 + 32 : t)), x0 - 3, Y(t));
    ctx.fillStyle = '#7FB7F2'; ctx.textAlign = 'left';
    const pStep = Pm > 300 ? 100 : Pm > 120 ? 50 : 20;
    for (let p = 0; p <= Pm; p += pStep) ctx.fillText(String(f ? (p / 25.4).toFixed(p ? 0 : 0) : p), x1 + 3, YP(p));
    ctx.fillStyle = '#9FB0CC'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    'JFMAMJJASOND'.split('').forEach((c, m) => ctx.fillText(c, x0 + (m + 0.5) * bw, y0 + 3));
    ctx.font = mono(8); ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#FF9A70'; ctx.textAlign = 'left'; ctx.fillText(f ? '°F' : '°C', x + 2, y1 - 1);
    ctx.fillStyle = '#7FB7F2'; ctx.textAlign = 'right'; ctx.fillText(f ? 'in' : 'mm', x + w - 2, y1 - 1);
    if (o.mark != null) { const xx = x0 + (o.mark + 0.5) * bw; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xx, y1); ctx.lineTo(xx, y0); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    return { x0, x1, y0, y1, Y, YP, bw };
  }

  /* ---------------- an image built cell by cell (years × days, a map) ---------------- */
  function raster(key, nx, ny, fn) {
    if (cache[key]) return cache[key];
    const c = canvas(nx, ny), x = c.getContext('2d'), im = x.createImageData(nx, ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const v = fn(i, j), k = (j * nx + i) * 4; im.data[k] = v[0]; im.data[k + 1] = v[1]; im.data[k + 2] = v[2]; im.data[k + 3] = v[3] == null ? 255 : v[3]; }
    x.putImageData(im, 0, 0);
    const keys = Object.keys(cache).filter(k => k.startsWith('R:'));
    if (keys.length > 24) delete cache[keys[0]];
    return (cache[key] = c);
  }
  /* a horizontal colour bar with its ticks */
  function colourBar(ctx, x, y, w, h, fn, lo, hi, ticks, unit, fmt) {
    for (let i = 0; i < w; i++) { ctx.fillStyle = css(fn(lo + (hi - lo) * i / (w - 1))); ctx.fillRect(x + i, y, 1.5, h); }
    ctx.strokeStyle = 'rgba(200,212,230,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.font = mono(9); ctx.fillStyle = '#C9D4E6'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ticks.forEach(v => { const xx = x + (v - lo) / (hi - lo) * w; ctx.fillRect(xx, y + h, 1, 3); ctx.fillText(fmt ? fmt(v) : String(v), xx, y + h + 4); });
    if (unit) { ctx.textAlign = 'left'; ctx.fillText(unit, x + w + 4, y); }
  }
  /* a station pin on a globe: a stem from the ground point and a coloured head */
  function pin(ctx, gx, gy, col, label, o) {
    o = o || {};
    const hx = gx + (o.dx || 0), hy = gy - (o.len == null ? 18 : o.len);
    ctx.save();
    ctx.strokeStyle = 'rgba(10,14,22,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(gx, gy, 3, 1.4, 0, 0, TAU); ctx.fill();
    RX.ball(ctx, hx, hy, o.r || 6, col, { shadow: false });
    if (label) {
      ctx.font = sans(o.size || 11, 700); ctx.textBaseline = 'middle'; ctx.textAlign = o.left ? 'right' : 'left';
      const tx = hx + (o.left ? -10 : 10);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.9)'; ctx.strokeText(label, tx, hy); ctx.fillStyle = o.text || '#F2F6FF'; ctx.fillText(label, tx, hy);
    }
    ctx.restore();
  }

  /* =====================================================================
     6E-2 — circulation apparatus
     ===================================================================== */
  /* a glass pane: tinted, with an edge of green float glass and a reflection streak */
  function glassPane(F, P0, P1, P3, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, P2 = add(P1, sub(P3, P0)), c = scale(add(P0, P2), 0.5);
    F.push(c, () => {
      const q = [P0, P1, P2, P3].map(p => cam.project(p));
      if (q.some(v => !v.ok)) return;
      ctx.save();
      ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath();
      ctx.fillStyle = o.tint || 'rgba(190,225,235,.06)'; ctx.fill();
      ctx.clip();
      if (o.streak !== false) {
        const g = ctx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
        g.addColorStop(0.18, 'rgba(255,255,255,0)'); g.addColorStop(0.24, 'rgba(255,255,255,' + (o.gloss || 0.10) + ')'); g.addColorStop(0.30, 'rgba(255,255,255,0)');
        g.addColorStop(0.62, 'rgba(255,255,255,0)'); g.addColorStop(0.65, 'rgba(255,255,255,' + (o.gloss || 0.10) * 0.6 + ')'); g.addColorStop(0.68, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = o.edge || 'rgba(150,215,200,.75)'; ctx.lineWidth = o.edgeW || 1.6;
      ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.stroke();
    }, o.bias);
  }
  /* a rectangular glass tank: c = centre of its floor, L along x, D along y, Hg the glass, Hw the water.
     The water shows as a tinted body with a bright meniscus line; contents are drawn by the caller. */
  function glassTank(F, c, L, D, Hg, Hw, o) {
    o = o || {};
    const x0 = c[0] - L / 2, x1 = c[0] + L / 2, y0 = c[1] - D / 2, y1 = c[1] + D / 2, z0 = c[2], zg = z0 + Hg, zw = z0 + Hw;
    const ctx = F.ctx, cam = F.cam, tint = o.water || 'rgba(120,180,210,.16)';
    // the floor (a thick slab of glass) and the far wall
    R3.box(F, [c[0], c[1], z0 - 0.003], [L + 0.008, D + 0.008, 0.006], '#9FC9C2', { shadow: false, ambient: 0.5, alpha: 0.55 });
    glassPane(F, [x0, y1, z0], [x1, y1, z0], [x0, y1, zg], { tint: 'rgba(170,210,225,.10)', streak: false });
    // the water: the far face and the floor, darker, then the surface
    F.push([c[0], y1 - 0.001, (z0 + zw) / 2], () => {
      const q = [[x0, y1, z0], [x1, y1, z0], [x1, y1, zw], [x0, y1, zw]].map(p => cam.project(p)); if (q.some(v => !v.ok)) return;
      ctx.fillStyle = o.waterBack || 'rgba(70,130,170,.28)'; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
    });
    F.push([c[0], c[1], zw], () => {
      const q = [[x0, y0, zw], [x1, y0, zw], [x1, y1, zw], [x0, y1, zw]].map(p => cam.project(p)); if (q.some(v => !v.ok)) return;
      ctx.fillStyle = 'rgba(200,232,245,.16)'; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(235,250,255,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    }, 0.01);
    // the side walls and the near wall, the near one carrying the water's front face
    glassPane(F, [x0, y0, z0], [x0, y1, z0], [x0, y0, zg], { tint: 'rgba(170,210,225,.08)' });
    glassPane(F, [x1, y1, z0], [x1, y0, z0], [x1, y1, zg], { tint: 'rgba(170,210,225,.08)' });
    F.push([c[0], y0, (z0 + zw) / 2], () => {
      const q = [[x0, y0, z0], [x1, y0, z0], [x1, y0, zw], [x0, y0, zw]].map(p => cam.project(p)); if (q.some(v => !v.ok)) return;
      ctx.fillStyle = tint; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(235,250,255,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(q[3].x, q[3].y); ctx.lineTo(q[2].x, q[2].y); ctx.stroke();
    }, -0.004);
    glassPane(F, [x0, y0, z0], [x1, y0, z0], [x0, y0, zg], { tint: 'rgba(190,225,235,.05)', gloss: 0.13, bias: -0.006 });
    return { x0, x1, y0, y1, z0, zw, zg };
  }
  /* an ice cube floating: nine-tenths under, frosted, rounded as it melts */
  function iceCube(F, c, s, o) {
    o = o || {};
    if (s < 0.002) return;
    R3.box(F, c, [s, s, s], '#DDEFFB', { shadow: false, ambient: 0.75, alpha: 0.72, edges: true });
    const ctx = F.ctx, q = F.cam.project([c[0] - s * 0.2, c[1] - s / 2, c[2] + s * 0.25]);
    F.push(add(c, [0, -s / 2 - 0.001, 0]), () => { if (!q.ok) return; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1, s * q.s * 0.12), 0, TAU); ctx.fill(); }, -0.01);
  }
  /* a glass thermometer standing in the water, its bulb at `bottom`, reading v °C */
  function dipThermo(F, bottom, len, v, o) {
    o = o || {};
    const top = add(bottom, [0, 0, len]);
    R3.cylinder(F, bottom, top, 0.0035, '#E3F0F6', { shadow: false, segments: 10, alpha: 0.6 });
    R3.sphere(F, bottom, 0.006, '#D8463A', { shadow: false });
    const k = clamp((v + 10) / 110, 0, 1);
    R3.cylinder(F, bottom, add(bottom, [0, 0, len * 0.08 + len * 0.86 * k]), 0.0016, '#D8463A', { shadow: false, segments: 6, caps: false, bias: -0.003 });
    return top;
  }
  /* the dye: particles, each with its own alpha, drawn as one item at the plane they sit in */
  function dots(F, at, pts, colour, r, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam;
    F.push(at, () => {
      ctx.save();
      for (const p of pts) {
        const q = cam.project(p.w || p); if (!q.ok) continue;
        ctx.globalAlpha = p.a == null ? (o.alpha || 0.6) : p.a;
        ctx.fillStyle = p.c || colour; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.8, (p.r || r) * q.s), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }, o.bias == null ? -0.002 : o.bias);
  }
  /* a turntable: a steel base with its motor, a white disc with a printed polar grid that turns
     by `angle`, and whatever has been drawn on it (pts in the disc's own frame, metres) */
  function turntable(F, c, R, angle, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, zt = c[2] + 0.09;
    // the base and spindle sit under the disc: pushed back so the disc always covers them
    R3.cylinder(F, [c[0], c[1], c[2]], [c[0], c[1], c[2] + 0.05], R * 0.45, '#3A4250', { segments: 32, bias: 0.5 });
    R3.cylinder(F, [c[0], c[1], c[2] + 0.05], [c[0], c[1], zt - 0.012], 0.03, '#8A939E', { segments: 16, shadow: false, bias: 0.5 });
    R3.cylinder(F, [c[0], c[1], zt - 0.012], [c[0], c[1], zt], R, '#E9ECEF', { segments: 64, shadow: false, ambient: 0.6 });
    const toW = (x, y) => { const ca = Math.cos(angle), sa = Math.sin(angle); return [c[0] + x * ca - y * sa, c[1] + x * sa + y * ca, zt + 0.0008]; };
    F.push([c[0], c[1], zt + 0.0005], () => {
      ctx.save();
      // the printed grid: rings every 5 cm, spokes every 30°
      ctx.strokeStyle = 'rgba(70,85,105,.45)'; ctx.lineWidth = 1;
      for (let r = 0.05; r < R - 1e-6; r += 0.05) { ctx.beginPath(); for (let k = 0; k <= 72; k++) { const a = k / 72 * TAU, q = cam.project(toW(r * Math.cos(a), r * Math.sin(a))); if (!q.ok) { ctx.restore(); return; } k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.stroke(); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, q0 = cam.project(toW(0, 0)), q1 = cam.project(toW(R * 0.97 * Math.cos(a), R * 0.97 * Math.sin(a))); ctx.strokeStyle = k === 0 ? 'rgba(220,60,50,.85)' : 'rgba(70,85,105,.35)'; ctx.lineWidth = k === 0 ? 2 : 1; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke(); }
      // the chalk line the puck left on the turning disc
      if (o.trace && o.trace.length > 1) {
        ctx.strokeStyle = o.traceColour || '#2A6FD6'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        o.trace.forEach((p, i) => { const q = cam.project(toW(p[0], p[1])); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke();
      }
      ctx.restore();
    }, -0.002);
    return { zt, toW };
  }
  /* a hydrometer floating in a column of liquid: the deeper it sits, the lighter the liquid.
     at: where the liquid surface meets its stem; sink: how far the stem is under (m) */
  function hydrometer(F, at, sink, o) {
    o = o || {};
    const bulbZ = at[2] - sink - 0.03;
    R3.cylinder(F, [at[0], at[1], bulbZ - 0.03], [at[0], at[1], bulbZ + 0.03], 0.011, '#E6F2F6', { shadow: false, segments: 14, alpha: 0.7 });
    R3.sphere(F, [at[0], at[1], bulbZ - 0.036], 0.008, '#3A3E46', { shadow: false });
    R3.cylinder(F, [at[0], at[1], bulbZ + 0.03], [at[0], at[1], at[2] + 0.06], 0.0035, '#F2F7F2', { shadow: false, segments: 10 });
    const ctx = F.ctx, cam = F.cam;
    F.push([at[0], at[1] - 0.004, at[2] + 0.02], () => {
      ctx.save(); ctx.strokeStyle = 'rgba(30,40,60,.85)'; ctx.lineWidth = 1;
      for (let k = 0; k <= 8; k++) { const z = at[2] - 0.01 + k * 0.008, q0 = cam.project([at[0] - 0.003, at[1] - 0.004, z]), q1 = cam.project([at[0] + (k % 2 ? 0.001 : 0.003), at[1] - 0.004, z]); if (!q0.ok) continue; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke(); }
      ctx.restore();
    }, -0.01);
  }
  /* an arrowhead for 2D figures */
  function arrowHead(ctx, x, y, ang, s, col) {
    ctx.save(); ctx.fillStyle = col; ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, s * 0.6); ctx.lineTo(-s * 0.4, 0); ctx.lineTo(-s * 0.7, -s * 0.6); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  /* the atmosphere cut from pole to pole: the cells as turning loops under the tropopause,
     rising air with its towering cloud and rain, sinking air over the deserts.
     cells: [{a, b, dir}] in degrees (south −90 … north +90); dir +1 rises at a. t animates the flow. */
  function cellSection(ctx, x, y, w, h, cells, o) {
    o = o || {};
    const X = lat => x + (lat + 90) / 180 * w, top = y + 16, bot = y + h - 22, tp = lat => top + 10 + (bot - top) * 0.14 * Math.pow(Math.abs(lat) / 90, 1.2);
    ctx.save();
    // the sky above the tropopause, the troposphere below it
    const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, '#0E1A33'); g.addColorStop(1, '#2A5A8C');
    ctx.fillStyle = g; ctx.fillRect(x, top, w, bot - top);
    ctx.fillStyle = 'rgba(8,12,24,.65)'; ctx.beginPath(); ctx.moveTo(x, top);
    for (let la = -90; la <= 90; la += 3) ctx.lineTo(X(la), tp(la)); ctx.lineTo(x + w, top); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,215,240,.5)'; ctx.setLineDash([4, 3]); ctx.beginPath(); for (let la = -90; la <= 90; la += 3) la === -90 ? ctx.moveTo(X(la), tp(la)) : ctx.lineTo(X(la), tp(la)); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = mono(8.5); ctx.fillStyle = 'rgba(200,215,240,.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('tropopause', x + 4, tp(-80) - 2);
    // the ground: green where air rises and rain falls, sand where it sinks, ice at the poles
    for (let la = -90; la < 90; la += 1) {
      const wet = o.wet ? o.wet(la + 0.5) : 0.5, ice = Math.abs(la) > 66;
      ctx.fillStyle = ice ? '#E6EEF5' : css(mixc([214, 180, 120], [60, 130, 70], clamp(wet, 0, 1)));
      ctx.fillRect(X(la), bot, w / 180 + 0.6, 8);
    }
    // each cell: a loop of moving air
    cells.forEach(cl => {
      const xa = X(cl.a), xb = X(cl.b), xm = (xa + xb) / 2, ya = bot - 6, yb = Math.min(tp(cl.a), tp(cl.b)) + 10, ym = (ya + yb) / 2;
      const rx = (xb - xa) / 2 - 6, ry = (ya - yb) / 2;
      if (rx < 3) return;
      ctx.strokeStyle = cl.dir > 0 ? 'rgba(255,170,120,.9)' : 'rgba(140,190,255,.9)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(xm, ym, rx, ry, 0, 0, TAU); ctx.stroke();
      // arrows round the loop, moving with t; dir +1: up at a, along the top to b, down at b
      for (let k = 0; k < 4; k++) {
        const ph = ((o.t || 0) * 0.15 + k / 4) % 1, ang = cl.dir > 0 ? Math.PI - ph * TAU : ph * TAU;     // screen angle on the ellipse
        const ex = xm + rx * Math.cos(ang), ey = ym + ry * Math.sin(ang);
        const tan = cl.dir > 0 ? Math.atan2(-ry * Math.cos(ang), rx * Math.sin(ang)) : Math.atan2(ry * Math.cos(ang), -rx * Math.sin(ang));
        arrowHead(ctx, ex, ey, tan, 6, cl.dir > 0 ? '#FFC8A0' : '#B8D6FF');
      }
      if (o.names && cl.name && rx > 22) { ctx.font = sans(10, 700); ctx.fillStyle = '#EAF1FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cl.name, xm, ym); }
    });
    // towering cloud where air rises, clear sky where it sinks
    (o.rising || []).forEach(la => {
      // a thunderstorm: a narrow tower that spreads into an anvil under the tropopause
      const xc = X(la), yt = tp(la) + 4, yb = bot - 10;
      const cg = ctx.createLinearGradient(0, yt, 0, yb); cg.addColorStop(0, 'rgba(245,248,255,.92)'); cg.addColorStop(1, 'rgba(170,185,205,.85)');
      ctx.fillStyle = cg; ctx.beginPath();
      ctx.moveTo(xc - 5, yb); ctx.quadraticCurveTo(xc - 7, (yt + yb) / 2, xc - 4, yt + 8); ctx.quadraticCurveTo(xc - 16, yt + 6, xc - 18, yt + 2);
      ctx.quadraticCurveTo(xc, yt - 3, xc + 18, yt + 2); ctx.quadraticCurveTo(xc + 16, yt + 6, xc + 4, yt + 8); ctx.quadraticCurveTo(xc + 7, (yt + yb) / 2, xc + 5, yb); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(150,200,255,.7)'; ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(xc - 8 + k * 4, bot - 10); ctx.lineTo(xc - 10 + k * 4, bot - 2); ctx.stroke(); }
    });
    // the latitude axis
    ctx.font = mono(9); ctx.fillStyle = '#9FB0CC'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [-90, -60, -30, 0, 30, 60, 90].forEach(la => ctx.fillText(la === 0 ? 'Eq' : Math.abs(la) + (la > 0 ? 'N' : 'S'), X(la), bot + 10));
    ctx.restore();
    return { X, bot, top };
  }

  window.G6E = { tempRGB, rainRGB, anomRGB, kgRGB, KG, css, mixc, grassTex, lawn, louvredFace, stevenson, SCREEN, rainGauge, sky, precip,
                 thermoPair, climograph, raster, colourBar, pin, rng, canvas, mono, sans,
                 glassPane, glassTank, iceCube, dipThermo, dots, turntable, hydrometer, arrowHead, cellSection };
})();
