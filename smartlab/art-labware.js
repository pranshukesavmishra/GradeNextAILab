/* ============================================================
   LABWARE — the school and hobby bench, built on R3 and BENCH.

   bench3d.js has the physics bench (tables, stands, pulleys, rules,
   meters, photogates). This is the rest of what a middle-school lab
   actually handles: an aquarium and what keeps it alive — glass panes
   with green float-glass edges and a reflection streak, a gravel bed
   with caustics thrown by the rippling surface, an LED hood, a hang-on
   filter, a heater with its pilot light, an air pump, airline and
   airstone, bubbles, a stick-on thermometer and a test-kit card.

   Textures are procedural and cached; everything that moves is drawn
   from simulated time, never the wall clock, so a paused lab is still.
   ============================================================ */
(function () {
  'use strict';
  const R3 = window.R3, RX = window.RX, BENCH = window.BENCH;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const { add, sub, scale } = R3;
  const cache = {};
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  /* ---------------- gravel: a bed of lit pebbles, seen from above ---------------- */
  function gravelTex(seed) {
    const key = 'g' + seed;
    if (cache[key]) return cache[key];
    const W = 640, H = 320, c = canvas(W, H), x = c.getContext('2d'), r = rng(seed || 5);
    x.fillStyle = '#2A2118'; x.fillRect(0, 0, W, H);
    const tones = ['#8A7358', '#6E5B45', '#A38C6C', '#5A4B3B', '#B39B78', '#7C7466', '#4E4439', '#9A8A70'];
    for (let i = 0; i < 2600; i++) {
      const px = r() * W, py = r() * H, rr = 2.2 + r() * 4.6, rot = r() * TAU, sq = 0.6 + r() * 0.35;
      const base = tones[Math.floor(r() * tones.length)];
      const g = x.createRadialGradient(px - rr * 0.35, py - rr * 0.4, rr * 0.1, px, py, rr * 1.05);
      g.addColorStop(0, RX.mix(base, '#FFFFFF', 0.30)); g.addColorStop(0.6, base); g.addColorStop(1, RX.mix(base, '#000000', 0.55));
      x.fillStyle = g;
      x.beginPath(); x.ellipse(px, py, rr, rr * sq, rot, 0, TAU); x.fill();
    }
    return (cache[key] = c);
  }
  /* the same bed in section, against the front glass: bigger stones settle lower */
  function gravelSideTex(seed) {
    const key = 'gs' + seed;
    if (cache[key]) return cache[key];
    const W = 640, H = 90, c = canvas(W, H), x = c.getContext('2d'), r = rng((seed || 5) + 11);
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#3A2E22'); bg.addColorStop(1, '#130F0B');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const tones = ['#8A7358', '#6E5B45', '#A38C6C', '#5A4B3B', '#B39B78', '#7C7466'];
    for (let i = 0; i < 900; i++) {
      const py = Math.pow(r(), 0.8) * H, rr = 2 + r() * 3.5 + py / H * 2.5, px = r() * W;
      const base = RX.mix(tones[Math.floor(r() * tones.length)], '#000000', 0.15 + 0.45 * py / H);
      const g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.4, rr * 0.1, px, py, rr);
      g.addColorStop(0, RX.mix(base, '#FFFFFF', 0.22)); g.addColorStop(1, RX.mix(base, '#000000', 0.5));
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, rr, rr * (0.65 + r() * 0.3), r() * TAU, 0, TAU); x.fill();
    }
    return (cache[key] = c);
  }

  /* ---------------- caustics ----------------
     A rippled surface bends the lamp's light into a moving net of bright
     lines on the bottom. For small waves the focusing is set by the surface
     curvature: intensity ≈ 1 / (1 + d·∇²h), with d the water depth. The wave
     field here is a sum of travelling ripples; t is simulated time, a is
     the agitation (0 still … 1 a pump and a filter return). */
  let CT = null;
  function causticTex(t, a, depth) {
    const W = 192, H = 96;
    if (!CT) { CT = canvas(W, H); CT.x = CT.getContext('2d'); CT.img = CT.x.createImageData(W, H); }
    const px = CT.img.data, d = depth || 0.28;
    const waves = [[31, 17, 1.3, 0.9], [-23, 29, 1.7, 1.2], [41, -13, 2.2, 0.7], [-17, -37, 1.1, 1.0], [53, 41, 2.9, 0.5]];
    const amp = 0.0004 + 0.0022 * a;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const X = i / W * 0.6, Y = j / H * 0.3;
      let lap = 0;
      for (const [kx, ky, w, s] of waves) {
        const ph = kx * X + ky * Y - w * t * (0.6 + a);
        lap += -(kx * kx + ky * ky) * amp * s * Math.sin(ph);
      }
      const I = clamp(1 / (1 + d * lap * 3.2), 0, 3.5);
      const v = clamp((I - 0.92) * 150, 0, 255);
      const k = (j * W + i) * 4;
      px[k] = v * 0.92; px[k + 1] = v; px[k + 2] = v * 0.86; px[k + 3] = 255;
    }
    CT.x.putImageData(CT.img, 0, 0);
    return CT;
  }

  /* ---------------- a glass pane between three corners ----------------
     Nearly clear, with the green of float glass along its edges, a soft
     reflection streak and a bright top edge. P0, P1 along one edge, P3 the
     other; o.tint, o.streak (0..1), o.dark (a painted background film). */
  function pane(ctx, cam, P0, P1, P3, o) {
    o = o || {};
    const P2 = add(P1, sub(P3, P0));
    const q = [P0, P1, P2, P3].map(p => cam.project(p));
    if (q.some(v => !v.ok)) return;
    ctx.save();
    ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath();
    if (o.dark) {
      const g = ctx.createLinearGradient(q[3].x, q[3].y, q[0].x, q[0].y);
      g.addColorStop(0, o.dark[0]); g.addColorStop(1, o.dark[1]);
      ctx.fillStyle = g; ctx.fill();
    } else {
      ctx.fillStyle = o.tint || 'rgba(170,215,205,0.05)'; ctx.fill();
    }
    ctx.clip();
    if (o.streak) {                                         // a reflection of the room: a soft diagonal band
      const gx = ctx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
      gx.addColorStop(0.00, 'rgba(255,255,255,0)');
      gx.addColorStop(0.18, 'rgba(255,255,255,' + (0.10 * o.streak).toFixed(3) + ')');
      gx.addColorStop(0.24, 'rgba(255,255,255,' + (0.03 * o.streak).toFixed(3) + ')');
      gx.addColorStop(0.62, 'rgba(255,255,255,0)');
      gx.addColorStop(0.70, 'rgba(255,255,255,' + (0.06 * o.streak).toFixed(3) + ')');
      gx.addColorStop(0.76, 'rgba(255,255,255,0)');
      ctx.fillStyle = gx; ctx.fillRect(-1e4, -1e4, 2e4, 2e4);
    }
    ctx.restore();
    // edges: float glass is green when you look through its thickness
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.edge || 'rgba(120,200,170,0.55)'; ctx.lineWidth = o.edgeW || 1.4;
    ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,250,255,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(q[3].x, q[3].y); ctx.lineTo(q[2].x, q[2].y); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- the LED hood on the rim ---------------- */
  function hood(F, x0, x1, y0, y1, z, on, o) {
    o = o || {};
    // a slim LED bar resting on the rims: an aluminium body and a diffuser underneath
    const h = 0.016, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    R3.box(F, [cx, cy, z + h / 2], [x1 - x0 + 0.03, y1 - y0, h], '#5E6878', { shadow: false, ambient: 0.45 });
    R3.box(F, [cx, cy, z + 0.0015], [x1 - x0 + 0.02, y1 - y0 - 0.006, 0.003], on ? '#FFF6DC' : '#3A4252', { shadow: false, ambient: on ? 1 : 0.4, vivid: false });
    if (on) {                                               // the underside glows onto the water
      F.push([cx, cy, z - 0.001], () => {
        const cam = F.cam, ctx = F.ctx;
        const q = [[x0 + 0.02, y0 + 0.02], [x1 - 0.02, y0 + 0.02], [x1 - 0.02, y1 - 0.02], [x0 + 0.02, y1 - 0.02]]
          .map(p => cam.project([p[0], p[1], z - 0.001]));
        if (q.some(v => !v.ok)) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,248,225,' + (0.20 * (o.power == null ? 1 : o.power)).toFixed(3) + ')';
        ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
        ctx.restore();
      }, -0.02);
    }
    // the switch's pilot on the front lip
    R3.sphere(F, [x1 - 0.05, y0 - 0.006, z + h * 0.55], 0.0035, on ? '#7CF0B0' : '#40505A', { shadow: false, vivid: true });
  }

  /* ---------------- a hang-on-back filter ----------------
     The box hangs outside the back glass; an intake tube reaches into the
     water; a lip spills the return back in. o.on, o.cut (show the media),
     o.film (0..1, how thick the bacterial film on the media is). */
  function hobFilter(F, at, depthIn, o) {
    o = o || {};
    const [x, y, z] = at, w = 0.13, d = 0.07, h = 0.16;
    const shell = o.on ? '#27303F' : '#2A2D33';
    // cut open, the shell turns to glass so the media show through it
    R3.box(F, [x, y + d / 2, z - h / 2 + 0.03], [w, d, h], shell, o.cut ? { shadow: false, ambient: 0.35, alpha: 0.28 } : { shadow: false, ambient: 0.35 });
    if (o.cut) {                                           // media in section: sponge, then ceramic rings
      const film = clamp(o.film || 0, 0, 1);
      R3.box(F, [x - w * 0.22, y + d / 2, z - h / 2 + 0.02], [w * 0.36, d * 0.9, h * 0.72], '#26344A', { shadow: false, ambient: 0.5 });
      for (let k = 0; k < 6; k++) {
        const rx = x + w * 0.08 + (k % 2) * 0.026, rz = z - h * 0.85 + Math.floor(k / 2) * 0.034 + 0.01;
        R3.cylinder(F, [rx, y + 0.012, rz], [rx, y + d - 0.012, rz], 0.011,
                    RX.mix('#CFC6B6', '#6B4A26', film * 0.8), { segments: 12, inner: 0.005, shadow: false, ambient: 0.5 });
      }
    }
    // the intake tube and its strainer, down into the tank
    R3.cylinder(F, [x - 0.03, y - 0.002, z + 0.02], [x - 0.03, y - 0.03, z + 0.02], 0.006, '#2E3848', { segments: 10, shadow: false });
    R3.cylinder(F, [x - 0.03, y - 0.03, z + 0.02], [x - 0.03, y - 0.03, z - depthIn], 0.0065, '#3A4658', { segments: 12, shadow: false });
    R3.cylinder(F, [x - 0.03, y - 0.03, z - depthIn], [x - 0.03, y - 0.03, z - depthIn - 0.04], 0.009, '#4A5668', { segments: 12, shadow: false });
    // the return lip, over the back glass
    R3.box(F, [x + 0.02, y - 0.018, z + 0.012], [0.07, 0.04, 0.008], '#2E3848', { shadow: false, ambient: 0.45 });
  }

  /* a submersible heater: a glass tube with its element and a pilot light */
  function heater(F, a, b, on, o) {
    o = o || {};
    R3.cylinder(F, a, b, 0.0085, '#6E8690', { segments: 14, shadow: false, ambient: 0.40 });
    const mid = scale(add(a, b), 0.5);
    R3.cylinder(F, add(a, [0, 0, 0.03]), sub(b, [0, 0, 0.02]), 0.0042, on ? '#E8894A' : '#6A5A52', { segments: 10, shadow: false, vivid: true });
    R3.cylinder(F, b, add(b, [0, 0, 0.03]), 0.010, '#1E2430', { segments: 14, shadow: false });
    R3.sphere(F, add(b, [0, -0.011, 0.018]), 0.0032, on ? '#FF6A3A' : '#3A2A26', { shadow: false, vivid: true });
    void mid;
  }
  /* an airstone on the gravel, fed by an airline over the rim */
  function airstone(F, at, o) {
    R3.cylinder(F, at, add(at, [0, 0, 0.018]), 0.011, '#8A94A6', { segments: 14, shadow: false, ambient: 0.55 });
  }
  function airline(F, pts, o) {
    R3.tube(F, pts, 0.0022, (o && o.colour) || '#C9D6D0', { segments: 6, round: false });
  }
  function airPump(F, at, on, phase) {
    const [x, y, z] = at;
    R3.box(F, [x, y, z + 0.022], [0.10, 0.06, 0.044], '#E1E4EA', { shadow: false, ambient: 0.45 });
    R3.box(F, [x, y, z + 0.046], [0.084, 0.046, 0.004], '#B8BEC9', { shadow: false, ambient: 0.5 });
    R3.sphere(F, [x + 0.035, y - 0.031, z + 0.03], 0.003, on ? '#7CF0B0' : '#50585F', { shadow: false, vivid: true });
    void phase;
  }

  /* a bubble: a bright rim and a highlight, almost empty inside */
  function bubble(ctx, x, y, r, light) {
    if (r < 0.6) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(225,245,255,' + (0.35 + 0.4 * light).toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.6, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(200,235,255,0.10)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * light).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.38, Math.max(0.5, r * 0.26), 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- a stick-on liquid-crystal thermometer strip ----------------
     Real strips light one band per degree; the lit band is the reading. */
  function thermoStrip(ctx, cam, at, along, up, Tc, o) {
    o = o || {};
    const n = 11, T0 = o.from == null ? 20 : o.from;
    const len = 0.11, wd = 0.018;
    const P = (u, v) => cam.project(add(add(at, scale(along, u * len)), scale(up, v * wd)));
    const c0 = P(0, 0), c1 = P(1, 0), c2 = P(1, 1), c3 = P(0, 1);
    if (![c0, c1, c2, c3].every(q => q.ok)) return;
    ctx.save();
    ctx.fillStyle = '#10141C';
    ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath(); ctx.fill();
    const lit = Math.round(Tc) - T0;
    for (let k = 0; k < n; k++) {
      const a = P((k + 0.12) / n, 0.18), b = P((k + 0.88) / n, 0.18), c = P((k + 0.88) / n, 0.72), d = P((k + 0.12) / n, 0.72);
      const on = k === lit, near = Math.abs(k - lit) === 1;
      ctx.fillStyle = on ? '#6CF09A' : near ? 'rgba(80,140,200,.55)' : 'rgba(60,70,90,.55)';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
      if (k % 2 === 0) {
        const t = P((k + 0.5) / n, 0.9);
        ctx.fillStyle = '#C9D4EA'; ctx.font = '600 ' + Math.max(6, Math.min(9, t.s * 0.006)) + 'px "IBM Plex Mono",monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(T0 + k), t.x, t.y);
      }
    }
    ctx.restore();
  }

  /* ---------------- a water test-kit card ----------------
     A strip of reference swatches and the test tube's colour beside them.
     The student reads the nearest swatch — the instrument's reading, which
     is coarser than the model's value, and says so. */
  const KITS = {
    ammonia: { title: 'Ammonia NH₃/NH₄⁺', unit: 'ppm', steps: [0, 0.25, 0.5, 1, 2, 4, 8],
               cols: ['#E8E27A', '#D9E07A', '#C3D876', '#A6CC70', '#7DB86A', '#4E9E5E', '#2C7A52'] },
    nitrite: { title: 'Nitrite NO₂⁻', unit: 'ppm', steps: [0, 0.25, 0.5, 1, 2, 5],
               cols: ['#7FC7E6', '#9EAFE0', '#B58FD6', '#C46AC8', '#C24AB0', '#A8328F'] },
    nitrate: { title: 'Nitrate NO₃⁻', unit: 'ppm', steps: [0, 5, 10, 20, 40, 80, 160],
               cols: ['#F2E86A', '#F2C45A', '#EFA14E', '#E77B43', '#D8543A', '#C23A34', '#9C2A30'] },
    ph:      { title: 'pH', unit: '', steps: [6.0, 6.4, 6.6, 6.8, 7.0, 7.2, 7.6, 8.0, 8.2, 8.4, 8.8],
               cols: ['#E8D24A', '#D8D44C', '#BFD24E', '#9FCB56', '#7FC262', '#5FB272', '#4A9E86', '#3F84A0', '#4A6CB0', '#5A58B4', '#6A44B0'] }
  };
  function kitReading(kind, value) {
    const k = KITS[kind];
    let best = 0;
    k.steps.forEach((s, i) => { if (Math.abs(s - value) < Math.abs(k.steps[best] - value)) best = i; });
    return { value: k.steps[best], index: best, colour: k.cols[best] };
  }
  function testCard(ctx, x, y, w, kind, value) {
    const k = KITS[kind], r = kitReading(kind, value), n = k.steps.length;
    const sw = (w - 36) / n, h = 38;
    ctx.save();
    ctx.fillStyle = 'rgba(232,236,240,.94)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h + 16, 4) : ctx.rect(x, y, w, h + 16); ctx.fill();
    ctx.fillStyle = '#1B2230'; ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(k.title, x + 5, y + 3);
    k.steps.forEach((s, i) => {
      const sx = x + 4 + i * sw;
      ctx.fillStyle = k.cols[i]; ctx.fillRect(sx, y + 16, sw - 2, 14);
      if (i === r.index) { ctx.strokeStyle = '#05080F'; ctx.lineWidth = 1.6; ctx.strokeRect(sx - 1, y + 15, sw, 16); }
      ctx.fillStyle = '#2A3242'; ctx.font = '500 7.5px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(String(s), sx + (sw - 2) / 2, y + 33);
    });
    // the sample tube, the colour of the water as tested
    const tx = x + w - 26, ty = y + 5;
    ctx.fillStyle = r.colour; ctx.fillRect(tx + 4, ty + 10, 12, 30);
    ctx.strokeStyle = 'rgba(40,50,60,.7)'; ctx.lineWidth = 1; ctx.strokeRect(tx + 4, ty + 2, 12, 38);
    ctx.restore();
    return r;
  }

  window.LAB = { gravelTex, gravelSideTex, causticTex, pane, hood, hobFilter, heater, airstone, airline,
                 airPump, bubble, thermoStrip, testCard, kitReading, KITS };
})();
