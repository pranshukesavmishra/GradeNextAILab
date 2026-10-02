/* ============================================================
   LIFE — living things at the scale a student sees them.

   art-bio.js and art-zoo.js draw organs, cells and tissue sections.
   This library draws whole organisms as they look in a tank or a jar:
   a neon tetra with its iridescent stripe, an angelfish, a sphere shrimp,
   Cabomba whorls and Vallisneria ribbons. A lab never hand-draws an
   organism (memory §2.4): it poses one of these.

   Animals are posed from 3D: the caller projects the head and tail and
   the animal's own up and side axes, and the figure is laid along them,
   so a fish seen side-on shows its flank, seen from above shows its back,
   and in between is foreshortened correctly. Plants take a projector
   P(x, y, z) → {ok, x, y, s} and draw themselves in the scene.
   ============================================================ */
(function () {
  'use strict';
  const RX = window.RX;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = RX.mix, rgba = RX.rgba;

  /* ---------------- posing an animal ----------------
     pose: { head:{x,y}, tail:{x,y}, up:{x,y}, side:{x,y} }  — screen points and
     screen projections of the animal's up and side unit axes scaled to its
     half-height and half-width, all in pixels. Returns the frame the figure
     is drawn in: origin at mid-body, u along the body (head +), v across. */
  function frameOf(pose) {
    const ax = pose.head.x - pose.tail.x, ay = pose.head.y - pose.tail.y;
    const len = Math.hypot(ax, ay) || 1e-6;
    const ux = ax / len, uy = ay / len, nx = -uy, ny = ux;
    const aUp = pose.up.x * nx + pose.up.y * ny;          // how much of the body's height faces us
    const aSide = pose.side.x * nx + pose.side.y * ny;    // how much of its width does
    const ext = Math.hypot(aUp, aSide) || 1e-6;
    return {
      cx: (pose.head.x + pose.tail.x) / 2, cy: (pose.head.y + pose.tail.y) / 2,
      ux, uy, nx: nx * Math.sign(aUp || 1), ny: ny * Math.sign(aUp || 1),
      len, ext, side: Math.abs(aUp) / ext              // 1 = flank to camera, 0 = back to camera
    };
  }
  function tf(ctx, F, hh) {
    // local (x along the body, −0.5 tail … +0.5 head; y up, in half-heights) → screen
    ctx.transform(F.ux * F.len, F.uy * F.len, F.nx * hh, F.ny * hh, F.cx, F.cy);
  }

  /* ---------------- the neon tetra (Paracheirodon innesi) ----------------
     ~3 cm. An iridescent blue-green line from the eye to the adipose fin,
     a red band on the rear lower half, a silver-white belly, translucent
     fins. o: { phase, beat (0..1), fog, fogColour, light (0..1), stress (0..1),
                dead, tag } */
  function tetra(ctx, pose, o) {
    o = o || {};
    const F = frameOf(pose);
    if (F.len < 3) return;
    const light = o.light == null ? 1 : o.light, fog = o.fog || 0, fc = o.fogColour || '#0A2A33';
    const pale = o.dead ? 0.75 : (o.stress || 0) * 0.45;      // stressed neons fade — a real sign
    const hh = F.ext;                                          // half-height on screen
    const s = F.side;
    const beat = o.dead ? 0 : Math.sin(o.phase || 0) * (0.10 + 0.25 * (o.beat || 0.3));
    const col = (c, k) => mix(mix(mix(c, '#D8DDE0', pale), '#05080F', 1 - light * (k == null ? 1 : k)), fc, fog);
    ctx.save();
    tf(ctx, F, hh);
    // the tail swings in the body's own plane: seen from above it shows, side-on it barely does
    const sway = x => x < 0 ? beat * (1 - s * 0.85) * Math.pow(-x / 0.5, 2) * 0.9 : 0;
    const Y = (x, y) => y + sway(x);
    /* fins first, behind the body: caudal fork, anal, dorsal, adipose, pelvic */
    // fins are nearly clear: a faint tint and the rays that stiffen them
    const finA = 0.12 + 0.16 * s;
    ctx.fillStyle = rgba(col('#B8C8C8', 0.9), finA * (o.dead ? 0.6 : 1));
    ctx.strokeStyle = rgba(col('#DDE8E8', 0.9), 0.30 + 0.2 * s);
    ctx.lineWidth = 0.7 / Math.max(1, hh);
    ctx.beginPath();                                           // caudal fin, forked
    ctx.moveTo(-0.33, Y(-0.33, 0.10)); ctx.quadraticCurveTo(-0.42, Y(-0.42, 0.55), -0.52, Y(-0.52, 0.95));
    ctx.quadraticCurveTo(-0.47, Y(-0.47, 0.35), -0.44, Y(-0.44, 0.02));
    ctx.quadraticCurveTo(-0.47, Y(-0.47, -0.35), -0.52, Y(-0.52, -0.95));
    ctx.quadraticCurveTo(-0.42, Y(-0.42, -0.55), -0.33, Y(-0.33, -0.10)); ctx.closePath();
    ctx.fill();
    ctx.beginPath();                                           // caudal rays
    for (let k = -3; k <= 3; k++) { if (!k) continue; ctx.moveTo(-0.34, Y(-0.34, k * 0.03)); ctx.lineTo(-0.46 - Math.abs(k) * 0.01, Y(-0.46, k * 0.26)); }
    ctx.stroke();
    if (s > 0.25) {
      ctx.beginPath();                                         // anal fin, long and low
      ctx.moveTo(-0.24, Y(-0.24, -0.26)); ctx.lineTo(-0.06, Y(-0.06, -0.52)); ctx.lineTo(0.02, Y(0.02, -0.66));
      ctx.lineTo(0.05, Y(0.05, -0.50)); ctx.closePath(); ctx.fill();
      ctx.beginPath();                                         // dorsal fin
      ctx.moveTo(-0.02, Y(-0.02, 0.62)); ctx.lineTo(0.02, Y(0.02, 1.10)); ctx.lineTo(0.11, Y(0.11, 0.72)); ctx.closePath(); ctx.fill();
      ctx.beginPath();                                         // adipose fin — the tetra family's mark
      ctx.ellipse(-0.22, Y(-0.22, 0.42), 0.035, 0.09, 0, 0, TAU); ctx.fill();
      ctx.beginPath();                                         // pelvic fin
      ctx.moveTo(0.10, Y(0.10, -0.58)); ctx.lineTo(0.03, Y(0.03, -0.85)); ctx.lineTo(0.14, Y(0.14, -0.62)); ctx.closePath(); ctx.fill();
    }
    /* body: fusiform, deepest a little behind the head, a narrow caudal peduncle */
    const top = [[0.50, 0.00], [0.47, 0.22], [0.40, 0.46], [0.28, 0.66], [0.12, 0.74], [-0.05, 0.68],
                 [-0.20, 0.46], [-0.30, 0.22], [-0.34, 0.12]];
    const bot = [[-0.34, -0.12], [-0.30, -0.22], [-0.18, -0.46], [0.00, -0.66], [0.16, -0.72],
                 [0.32, -0.60], [0.44, -0.36], [0.50, -0.06]];
    const body = () => {
      ctx.beginPath();
      top.forEach((q, i) => i ? ctx.lineTo(q[0], Y(q[0], q[1])) : ctx.moveTo(q[0], Y(q[0], q[1])));
      bot.forEach(q => ctx.lineTo(q[0], Y(q[0], q[1])));
      ctx.closePath();
    };
    // flank colours seen side-on, the olive back seen from above; blend by how the fish is turned
    const gr = ctx.createLinearGradient(0, 0.8, 0, -0.8);
    gr.addColorStop(0, col(mix('#4B5540', '#6E7A62', s * 0.5), 0.85));
    gr.addColorStop(0.40, col(mix('#44503A', '#8C9A8A', s), 0.95));
    gr.addColorStop(0.60, col(mix('#44503A', '#C9D2D0', s), 1));
    gr.addColorStop(1, col(mix('#4E5A44', '#E6EAE6', s), 1));
    ctx.fillStyle = gr; body(); ctx.fill();
    ctx.save(); body(); ctx.clip();
    if (s > 0.15) {
      // the red band: lower half, from mid-body to the tail
      const rg = ctx.createLinearGradient(-0.34, 0, 0.12, 0);
      rg.addColorStop(0, rgba(col('#E0302C', 1), 0.95 * s)); rg.addColorStop(0.75, rgba(col('#E0302C', 1), 0.9 * s));
      rg.addColorStop(1, rgba(col('#E0302C', 1), 0));
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.moveTo(-0.36, Y(-0.36, -0.02)); ctx.lineTo(0.12, Y(0.12, -0.04));
      ctx.lineTo(0.12, Y(0.12, -0.80)); ctx.lineTo(-0.36, Y(-0.36, -0.80)); ctx.closePath(); ctx.fill();
    }
    // the neon line itself: iridescent, and it keeps its brilliance a little even in the dark
    const glow = Math.max(light, 0.35) * (1 - pale * 0.7);
    const bl = ctx.createLinearGradient(-0.30, 0, 0.40, 0);
    bl.addColorStop(0, rgba(mix('#2CD4FF', fc, fog), 0));
    bl.addColorStop(0.12, rgba(mix('#35E0FF', fc, fog), 0.95 * glow));
    bl.addColorStop(0.55, rgba(mix('#3AF0E0', fc, fog), 1.0 * glow));
    bl.addColorStop(1, rgba(mix('#2E9CFF', fc, fog), 0.9 * glow));
    ctx.fillStyle = bl;
    const lw = 0.13 + 0.09 * (1 - s);                          // from above, the stripe reads as a wider line
    ctx.beginPath();
    ctx.moveTo(0.38, Y(0.38, 0.12 * s)); ctx.quadraticCurveTo(0.05, Y(0.05, 0.14 * s + lw), -0.27, Y(-0.27, 0.06 * s + lw * 0.6));
    ctx.lineTo(-0.27, Y(-0.27, 0.06 * s - lw * 0.6)); ctx.quadraticCurveTo(0.05, Y(0.05, 0.14 * s - lw), 0.38, Y(0.38, 0.12 * s - lw * 0.7));
    ctx.closePath(); ctx.fill();
    // a specular sheen along the back — what makes a small fish read as solid, not a sticker
    ctx.strokeStyle = rgba('#FFFFFF', 0.20 * light * (1 - pale));
    ctx.lineWidth = 0.10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.36, Y(0.36, 0.40)); ctx.quadraticCurveTo(0.08, Y(0.08, 0.62), -0.16, Y(-0.16, 0.40)); ctx.stroke();
    ctx.restore();
    // outline, and the gill cover's edge
    ctx.strokeStyle = rgba(col('#1C2A24', 0.8), 0.55);
    ctx.lineWidth = 1.0 / Math.max(1, (F.len + hh) / 2);
    body(); ctx.stroke();
    if (s > 0.35 && F.len > 14) {
      ctx.strokeStyle = rgba(col('#6E7C78', 0.9), 0.5 * s);
      ctx.beginPath(); ctx.moveTo(0.30, Y(0.30, 0.44)); ctx.quadraticCurveTo(0.24, Y(0.24, 0.0), 0.31, Y(0.31, -0.44)); ctx.stroke();
    }
    // the eye: large, silver iris, black pupil
    if (s > 0.2) {
      // the eye: large for the head, as in all tetras, but dark — a bronze-silver iris ring
      // around a black pupil, with the blue line running into its upper edge
      const er = 0.058, ey = 0.17, k = F.len / hh;
      ctx.fillStyle = col(o.dead ? '#8A8A86' : '#B8A27A', 1);
      ctx.beginPath(); ctx.ellipse(0.385, Y(0.385, ey), er, er * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = o.dead ? '#5A5A58' : '#07090C';
      ctx.beginPath(); ctx.ellipse(0.388, Y(0.388, ey), er * 0.70, er * 0.70 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(col('#1A2024', 1), 0.8); ctx.lineWidth = 0.012;
      ctx.beginPath(); ctx.ellipse(0.385, Y(0.385, ey), er, er * k, 0, 0, TAU); ctx.stroke();
      if (!o.dead && light > 0.3) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.ellipse(0.378, Y(0.378, ey + 0.05), er * 0.16, er * 0.16 * k, 0, 0, TAU); ctx.fill();
      }
      // the mouth, small and terminal
      ctx.strokeStyle = rgba(col('#2A2A26', 1), 0.6); ctx.lineWidth = 0.012;
      ctx.beginPath(); ctx.moveTo(0.50, Y(0.50, -0.02)); ctx.lineTo(0.46, Y(0.46, -0.08)); ctx.stroke();
    }
    ctx.restore();
    if (o.tag) {                                               // the tagged fish of the shoal experiment
      ctx.save();
      ctx.strokeStyle = rgba('#FFD36B', 0.9); ctx.lineWidth = 1.4; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.arc(F.cx, F.cy, Math.max(F.len, hh * 2) * 0.72, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------------- the angelfish (Pterophyllum scalare) ----------------
     A laterally flattened disc with long dorsal and anal fins, trailing
     pelvic filaments and four dark vertical bars. It eats neons. */
  function angelfish(ctx, pose, o) {
    o = o || {};
    const F = frameOf(pose);
    if (F.len < 4) return;
    const light = o.light == null ? 1 : o.light, fog = o.fog || 0, fc = o.fogColour || '#0A2A33';
    const hh = F.ext, s = F.side;
    const col = c => mix(mix(c, '#05080F', 1 - light), fc, fog);
    const beat = Math.sin(o.phase || 0) * 0.12;
    ctx.save();
    tf(ctx, F, hh);
    const Y = (x, y) => y + (x < 0 ? beat * (1 - s * 0.8) * Math.pow(-x / 0.5, 2) : 0);
    ctx.fillStyle = rgba(col('#D9DEE6'), 0.35 + 0.3 * s);
    // dorsal and anal fins sweep back into long points
    ctx.beginPath(); ctx.moveTo(0.18, Y(0.18, 0.55)); ctx.quadraticCurveTo(-0.05, Y(-0.05, 1.9), -0.42, Y(-0.42, 2.25));
    ctx.quadraticCurveTo(-0.22, Y(-0.22, 1.0), -0.28, Y(-0.28, 0.38)); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.12, Y(0.12, -0.55)); ctx.quadraticCurveTo(-0.08, Y(-0.08, -1.9), -0.44, Y(-0.44, -2.2));
    ctx.quadraticCurveTo(-0.22, Y(-0.22, -1.0), -0.28, Y(-0.28, -0.38)); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.30, Y(-0.30, 0.15)); ctx.lineTo(-0.52, Y(-0.52, 0.42)); ctx.lineTo(-0.50, Y(-0.50, -0.42));
    ctx.lineTo(-0.30, Y(-0.30, -0.15)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(col('#E8ECF2'), 0.55); ctx.lineWidth = 0.02; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.20, Y(0.20, -0.5)); ctx.quadraticCurveTo(0.10, Y(0.10, -1.3), -0.02, Y(-0.02, -2.4)); ctx.stroke();
    const body = () => { ctx.beginPath(); ctx.ellipse(0.02, 0, 0.36, 0.80, 0, 0, TAU); };
    const g = ctx.createLinearGradient(0, 0.8, 0, -0.8);
    g.addColorStop(0, col('#C7CDD6')); g.addColorStop(0.5, col('#E9EDF2')); g.addColorStop(1, col('#B9C0CB'));
    ctx.fillStyle = g; body(); ctx.fill();
    ctx.save(); body(); ctx.clip();
    ctx.fillStyle = rgba(col('#1A1C22'), 0.75 * s + 0.2);
    [[0.20, 0.07], [0.02, 0.09], [-0.18, 0.07], [-0.32, 0.05]].forEach(([x, w]) => ctx.fillRect(x - w / 2, -1, w, 2));
    ctx.restore();
    ctx.strokeStyle = rgba(col('#20242C'), 0.6); ctx.lineWidth = 0.012; body(); ctx.stroke();
    if (s > 0.2) {
      ctx.fillStyle = col('#C83A2A'); ctx.beginPath(); ctx.arc(0.28, Y(0.28, 0.20), 0.06, 0, TAU); ctx.fill();
      ctx.fillStyle = '#05080F'; ctx.beginPath(); ctx.arc(0.285, Y(0.285, 0.20), 0.035, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- a sphere shrimp (Halocaridina rubra) ----------------
     ~1 cm, red. Carapace, six abdominal segments, a fan tail, long antennae. */
  function shrimp(ctx, pose, o) {
    o = o || {};
    const F = frameOf(pose);
    if (F.len < 3) return;
    const light = o.light == null ? 1 : o.light, fog = o.fog || 0, fc = o.fogColour || '#0A2A33';
    const col = c => mix(mix(mix(c, '#E8E0DC', o.dead ? 0.6 : 0), '#05080F', 1 - light), fc, fog);
    const hh = F.ext;
    ctx.save();
    tf(ctx, F, hh);
    const bend = o.dead ? 0.5 : 0.18;
    ctx.strokeStyle = rgba(col('#FF6A5A'), 0.6); ctx.lineWidth = 0.03; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.46, 0.25); ctx.quadraticCurveTo(0.9, 0.9, 1.4, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.44, 0.10); ctx.quadraticCurveTo(0.8, -0.1, 1.2, 0.6); ctx.stroke();
    for (let k = 0; k < 5; k++) {                              // walking legs
      const x = 0.30 - k * 0.07;
      ctx.beginPath(); ctx.moveTo(x, -0.35); ctx.lineTo(x - 0.05, -0.85); ctx.stroke();
    }
    const segs = 7;
    for (let k = segs; k >= 0; k--) {                          // abdomen, curling under
      const t = k / segs, x = 0.1 - t * 0.55, y = -bend * t * t * 2, r = 0.62 - t * 0.28;
      RX.blob(ctx, x, y, 0.09, r, { fill: col(k % 2 ? '#E0443A' : '#C9362E'), r: 0.3, contour: 0.01, rim: 0.3, ao: 0 });
    }
    ctx.fillStyle = rgba(col('#E0503E'), 0.9);
    ctx.beginPath(); ctx.moveTo(-0.45, -bend * 2); ctx.lineTo(-0.66, -bend * 2 + 0.45); ctx.lineTo(-0.66, -bend * 2 - 0.45); ctx.closePath(); ctx.fill();
    RX.blob(ctx, 0.28, 0.02, 0.22, 0.62, { fill: col('#E24C3E'), r: 0.4, contour: 0.012, rim: 0.5, ao: 0 });
    ctx.fillStyle = '#05080F'; ctx.beginPath(); ctx.arc(0.44, 0.22, 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* =====================================================================
     PLANTS — drawn in the scene through a projector.
     P(x, y, z) → { ok, x, y, s }. sh(colour, depthFog) returns the colour as
     seen — the caller owns lighting and water, the plant owns its shape.
     ===================================================================== */

  /* Cabomba: a stem with whorls of finely dissected, fan-shaped leaves.
     base [x, y, z], height (m), o: { phase (sway), sway (m), health 0..1,
     starve (0..1 chlorosis), seed, leafR (m), colour } */
  function cabomba(ctx, P, base, height, o, shade) {
    o = o || {};
    const n = Math.max(3, Math.round(height / 0.011));
    const seed = o.seed || 1, lr = o.leafR || 0.016;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, z = base[2] + height * t;
      const sw = (o.sway || 0) * t * t;
      pts.push([base[0] + sw * Math.cos(o.phase || 0) + 0.006 * Math.sin(seed * 3 + t * 5),
                base[1] + sw * Math.sin(o.phase || 0) * 0.6 + 0.005 * Math.cos(seed * 2 + t * 4), z]);
    }
    const green = mix(mix('#3FA84A', '#B8C45A', o.starve || 0), '#6B5A34', 1 - (o.health == null ? 1 : o.health));
    // the stem
    const sp = pts.map(p => P(p[0], p[1], p[2]));
    if (sp.some(q => !q.ok)) return;
    ctx.strokeStyle = shade(mix(green, '#26401F', 0.35), 0);
    ctx.lineWidth = Math.max(0.8, 0.0022 * sp[0].s); ctx.lineCap = 'round';
    ctx.beginPath(); sp.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
    // whorls, from the bottom up — younger leaves at the tip are brighter and smaller
    for (let i = 1; i <= n; i++) {
      const t = i / n, c = pts[i], q = sp[i];
      const r = lr * (0.55 + 0.45 * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5)) * (i === n ? 0.6 : 1);
      const rot = seed * 1.7 + i * 0.9;
      const leaf = shade(mix(green, '#8FE070', 0.25 * t), 0.02);
      ctx.strokeStyle = leaf;
      ctx.lineWidth = Math.max(0.5, 0.0009 * q.s);
      for (let k = 0; k < 3; k++) {                            // three fan leaves per whorl
        const a = rot + k / 3 * TAU;
        const fx = Math.cos(a), fy = Math.sin(a);
        const tip = P(c[0] + fx * r, c[1] + fy * r, c[2] + r * 0.18);
        if (!tip.ok) continue;
        // each leaf forks into fine segments — the fan
        for (let f = -2; f <= 2; f++) {
          const b = a + f * 0.28;
          const e = P(c[0] + Math.cos(b) * r * (1 - Math.abs(f) * 0.12), c[1] + Math.sin(b) * r * (1 - Math.abs(f) * 0.12),
                      c[2] + r * (0.22 + 0.05 * Math.abs(f)));
          if (!e.ok) continue;
          ctx.beginPath(); ctx.moveTo(q.x, q.y);
          ctx.quadraticCurveTo((q.x + tip.x) / 2, (q.y + tip.y) / 2 - 1, e.x, e.y);
          ctx.stroke();
        }
      }
    }
  }

  /* Vallisneria: long ribbon leaves from a crown, twisting as they rise and
     laying over along the surface. base [x,y,z], len (m), topZ: the surface. */
  function vallisneria(ctx, P, base, len, topZ, o, shade) {
    o = o || {};
    const seed = o.seed || 1, nLeaf = o.leaves || 6, w = 0.0045;
    const green = mix(mix('#4CA23C', '#B6C052', o.starve || 0), '#6E5B33', 1 - (o.health == null ? 1 : o.health));
    for (let L = 0; L < nLeaf; L++) {
      const a0 = seed * 2.3 + L / nLeaf * TAU, lean = 0.10 + 0.08 * Math.sin(seed + L);
      const ll = len * (0.75 + 0.25 * Math.sin(seed * 5 + L * 1.3));
      const n = 18, spine = [];
      let x = base[0], y = base[1], z = base[2], prev = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const sw = (o.sway || 0) * t * t * Math.cos((o.phase || 0) + L * 0.7);
        x = base[0] + Math.cos(a0) * lean * t * ll * 0.4 + sw;
        y = base[1] + Math.sin(a0) * lean * t * ll * 0.4 + sw * 0.4;
        z = base[2] + ll * t;
        if (z > topZ - 0.004) {                              // reaching the surface, it lies over
          const over = z - (topZ - 0.004);
          z = topZ - 0.004; x += Math.cos(a0) * over; y += Math.sin(a0) * over * 0.5;
        }
        const twist = a0 + t * 2.4 + L;
        spine.push({ p: [x, y, z], d: [Math.cos(twist), Math.sin(twist)] });
        void prev;
      }
      const left = [], right = [];
      for (const k of spine) {
        const ww = w * (k === spine[spine.length - 1] ? 0.3 : 1);
        const a = P(k.p[0] + k.d[0] * ww, k.p[1] + k.d[1] * ww, k.p[2]);
        const b = P(k.p[0] - k.d[0] * ww, k.p[1] - k.d[1] * ww, k.p[2]);
        if (!a.ok || !b.ok) return;
        left.push(a); right.push(b);
      }
      // a translucent ribbon: body, then a bright midrib where it catches the lamp
      ctx.fillStyle = shade(green, 0.02, 0.82);
      ctx.beginPath();
      left.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(mix(green, '#DDF5A0', 0.35), 0.02, 0.55);
      ctx.lineWidth = Math.max(0.5, 0.0008 * left[0].s);
      ctx.beginPath();
      left.forEach((q, i) => { const m = { x: (q.x + right[i].x) / 2, y: (q.y + right[i].y) / 2 }; i ? ctx.lineTo(m.x, m.y) : ctx.moveTo(m.x, m.y); });
      ctx.stroke();
    }
  }


  /* =====================================================================
     PLATES — the organism and what is inside it, drawn as a textbook plate:
     the structure dominates, every examinable part carries a leader label,
     and a scale bar says how big it is. Each takes a box (x, y, w, h).
     ===================================================================== */
  function label(ctx, x0, y0, x1, y1, text, col, align) {
    if (window.__LABELS === false) return;
    ctx.save();
    ctx.strokeStyle = rgba(col || '#C9D4EA', 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = rgba(col || '#C9D4EA', 0.95); ctx.beginPath(); ctx.arc(x0, y0, 1.8, 0, TAU); ctx.fill();
    ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = align || (x1 < x0 ? 'right' : 'left');
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.88)';
    const tx = x1 + (ctx.textAlign === 'right' ? -4 : 4);
    ctx.strokeText(text, tx, y1); ctx.fillStyle = col || '#E7EDFB'; ctx.fillText(text, tx, y1);
    ctx.restore();
  }
  /* labels set in rows above and below the specimen, as a textbook plate sets them: each sits over
     (or under) its own part where it can, is pushed sideways when a neighbour is in the way, moves
     to a second tier when a row is full — and never leaves the plate's box.
     items: { ax, ay (the part), text, col, row: 'top' | 'bottom' } */
  function rowLabels(ctx, box, items) {
    if (window.__LABELS === false) return;
    const [bx, by, bw, bh] = box, gap = 12;
    ctx.save();
    ctx.font = '600 10px "IBM Plex Mono",monospace';
    for (const row of ['top', 'bottom']) {
      const R = items.filter(it => (it.row || 'top') === row)
        .map(it => Object.assign({ w: ctx.measureText(it.text).width + 6 }, it)).sort((a, b) => a.ax - b.ax);
      if (!R.length) continue;
      const tiers = R.reduce((a, it) => a + it.w + gap, 0) > bw ? 2 : 1;
      for (let t = 0; t < tiers; t++) {
        const T = R.filter((it, i) => i % tiers === t);
        T.forEach(it => { it.lx = clamp(it.ax, bx + it.w / 2, bx + bw - it.w / 2); });
        for (let pass = 0; pass < 60; pass++) {
          let moved = false;
          for (let i = 1; i < T.length; i++) {
            const a = T[i - 1], b = T[i], need = (a.w + b.w) / 2 + gap - (b.lx - a.lx);
            if (need > 0.5) { a.lx -= need / 2; b.lx += need / 2; moved = true; }
          }
          T.forEach(it => { it.lx = clamp(it.lx, bx + it.w / 2, bx + bw - it.w / 2); });
          if (!moved) break;
        }
        T.forEach(it => { it.ly = row === 'top' ? by + 9 + t * 17 : by + bh - 9 - t * 17; });
      }
      R.forEach(it => {
        const col = it.col || '#C9D4EA', ey = it.ly + (row === 'top' ? 7 : -7);
        ctx.strokeStyle = rgba(col, 0.65); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(it.ax, it.ay); ctx.lineTo(it.lx, ey); ctx.stroke();
        ctx.fillStyle = rgba(col, 0.95); ctx.beginPath(); ctx.arc(it.ax, it.ay, 2, 0, TAU); ctx.fill();
      });
      R.forEach(it => {
        const col = it.col || '#E7EDFB';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(5,8,15,.9)'; ctx.strokeText(it.text, it.lx, it.ly);
        ctx.fillStyle = col; ctx.fillText(it.text, it.lx, it.ly);
      });
    }
    ctx.restore();
  }
  function scaleBar(ctx, x, y, px, text) {
    ctx.save();
    ctx.strokeStyle = '#C9D4EA'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 4); ctx.stroke();
    ctx.font = '500 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle = '#C9D4EA'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(text, x + px / 2, y - 5);
    ctx.restore();
  }

  /* a neon tetra opened on its left side: the organs that move O₂ from water to muscle */
  function fishPlate(ctx, x, y, w, h, o) {
    o = o || {};
    const L = Math.min(w * 0.84, (h - 90) * 2.7), cx = x + w * 0.49, cy = y + h * 0.50, H2 = L * 0.15;
    const X = u => cx + u * L, Y = v => cy - v * L;          // u from −0.5 (tail) to 0.5 (snout), v up
    ctx.save();
    // silhouette with fins, as the living fish, but large
    const top = [[0.50, 0.00], [0.47, 0.04], [0.40, 0.085], [0.28, 0.115], [0.12, 0.125], [-0.05, 0.115], [-0.20, 0.075], [-0.30, 0.04], [-0.34, 0.02]];
    const bot = [[-0.34, -0.02], [-0.30, -0.035], [-0.18, -0.075], [0.00, -0.11], [0.16, -0.115], [0.32, -0.095], [0.44, -0.055], [0.50, -0.01]];
    const body = () => { ctx.beginPath(); top.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))); bot.forEach(q => ctx.lineTo(X(q[0]), Y(q[1]))); ctx.closePath(); };
    ctx.fillStyle = 'rgba(190,205,210,.14)'; ctx.strokeStyle = 'rgba(210,225,230,.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(-0.33), Y(0.02)); ctx.quadraticCurveTo(X(-0.42), Y(0.09), X(-0.52), Y(0.16)); ctx.quadraticCurveTo(X(-0.46), Y(0.0), X(-0.52), Y(-0.16)); ctx.quadraticCurveTo(X(-0.42), Y(-0.09), X(-0.33), Y(-0.02)); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(-0.02), Y(0.11)); ctx.lineTo(X(0.02), Y(0.19)); ctx.lineTo(X(0.11), Y(0.12)); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(-0.24), Y(-0.05)); ctx.lineTo(X(-0.02), Y(-0.16)); ctx.lineTo(X(0.04), Y(-0.10)); ctx.fill(); ctx.stroke();
    // the body wall, cut away: a pale translucent ground so the organs read through it
    const bg = ctx.createLinearGradient(0, Y(0.13), 0, Y(-0.12));
    bg.addColorStop(0, '#3E4A40'); bg.addColorStop(0.5, '#5E6A66'); bg.addColorStop(1, '#8A9294');
    ctx.fillStyle = bg; body(); ctx.fill();
    ctx.save(); body(); ctx.clip();
    // muscle blocks (myomeres) in the tail: the W-shaped segments that burn most of the O₂
    ctx.strokeStyle = 'rgba(210,140,140,.45)'; ctx.lineWidth = 1.1;
    for (let k = 0; k < 14; k++) {
      const u = -0.30 + k * 0.034;
      ctx.beginPath(); ctx.moveTo(X(u + 0.01), Y(0.13)); ctx.lineTo(X(u - 0.012), Y(0.06)); ctx.lineTo(X(u + 0.01), Y(0.0)); ctx.lineTo(X(u - 0.012), Y(-0.06)); ctx.lineTo(X(u + 0.01), Y(-0.13)); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,120,120,.18)'; ctx.fillRect(X(-0.34), Y(0.13), X(0.10) - X(-0.34), Y(-0.13) - Y(0.13));
    // spine and spinal cord
    ctx.strokeStyle = '#D8D2C2'; ctx.lineWidth = Math.max(2, L * 0.006);
    ctx.beginPath(); ctx.moveTo(X(0.30), Y(0.045)); ctx.quadraticCurveTo(X(0.0), Y(0.06), X(-0.32), Y(0.01)); ctx.stroke();
    for (let k = 0; k < 26; k++) { const u = 0.28 - k * 0.023; ctx.beginPath(); ctx.moveTo(X(u), Y(0.035)); ctx.lineTo(X(u), Y(0.065)); ctx.stroke(); }
    // kidney: a dark red strip under the spine
    RX.tube(ctx, [[X(0.26), Y(0.028)], [X(0.10), Y(0.035)], [X(-0.10), Y(0.028)]], L * 0.009, '#7A1E24', { contour: 0.6 });
    // swim bladder: two chambers, as in all characins
    RX.blob(ctx, X(0.14), Y(0.012), L * 0.075, L * 0.032, { fill: '#C8D2D8', r: L * 0.05, rim: 0.8, ao: 0.4, contour: 1 });
    RX.blob(ctx, X(0.00), Y(0.008), L * 0.07, L * 0.028, { fill: '#BCC6CE', r: L * 0.045, rim: 0.8, ao: 0.4, contour: 1 });
    // gut: stomach, then the intestine looping back to the vent
    RX.tube(ctx, [[X(0.24), Y(-0.03)], [X(0.14), Y(-0.05)], [X(0.07), Y(-0.07)], [X(0.12), Y(-0.085)], [X(0.02), Y(-0.08)], [X(-0.10), Y(-0.07)], [X(-0.18), Y(-0.06)]],
            L * 0.013, '#C49A6A', { contour: 0.7 });
    RX.blob(ctx, X(0.21), Y(-0.045), L * 0.04, L * 0.024, { fill: '#B98A5E', r: L * 0.03, rim: 0.6, ao: 0.4, contour: 1 });
    // liver
    RX.blob(ctx, X(0.27), Y(-0.06), L * 0.04, L * 0.028, { fill: '#7A3A28', r: L * 0.035, rim: 0.5, ao: 0.4, contour: 1, rot: -0.3 });
    // heart: atrium, ventricle and the bulbus that sends blood forward to the gills
    RX.blob(ctx, X(0.335), Y(-0.07), L * 0.018, L * 0.014, { fill: '#8E1E2A', r: L * 0.02, rim: 0.6, contour: 1 });
    RX.blob(ctx, X(0.355), Y(-0.08), L * 0.016, L * 0.016, { fill: '#B32434', r: L * 0.02, rim: 0.7, contour: 1 });
    RX.tube(ctx, [[X(0.37), Y(-0.075)], [X(0.39), Y(-0.05)]], L * 0.006, '#C23A48', {});
    // gills: four red arches under the gill cover
    for (let k = 0; k < 4; k++) {
      const u0 = 0.365 + k * 0.018;
      ctx.strokeStyle = '#D23A48'; ctx.lineWidth = Math.max(2, L * 0.007);
      ctx.beginPath(); ctx.moveTo(X(u0), Y(0.06)); ctx.quadraticCurveTo(X(u0 - 0.03), Y(0.0), X(u0), Y(-0.06)); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,120,130,.8)'; ctx.lineWidth = 1;
      for (let j = 0; j < 12; j++) { const t = j / 11, v = 0.06 - t * 0.12, u = u0 - 0.03 * Math.sin(t * Math.PI) * 0.9;
        ctx.beginPath(); ctx.moveTo(X(u), Y(v)); ctx.lineTo(X(u - 0.012), Y(v)); ctx.stroke(); }
    }
    // brain
    RX.blob(ctx, X(0.40), Y(0.055), L * 0.028, L * 0.018, { fill: '#D8C4B8', r: L * 0.025, rim: 0.6, contour: 1 });
    ctx.restore();
    // the gill cover's edge, the eye, the neon line faintly over it all
    ctx.strokeStyle = 'rgba(220,230,235,.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(0.34), Y(0.09)); ctx.quadraticCurveTo(X(0.31), Y(0.0), X(0.35), Y(-0.09)); ctx.stroke();
    ctx.fillStyle = '#B8A27A'; ctx.beginPath(); ctx.arc(X(0.43), Y(0.035), L * 0.022, 0, TAU); ctx.fill();
    ctx.fillStyle = '#07090C'; ctx.beginPath(); ctx.arc(X(0.432), Y(0.035), L * 0.015, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(58,240,224,.55)'; ctx.lineWidth = Math.max(2, L * 0.008);
    ctx.beginPath(); ctx.moveTo(X(0.40), Y(0.045)); ctx.quadraticCurveTo(X(0.05), Y(0.07), X(-0.27), Y(0.035)); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,235,238,.55)'; ctx.lineWidth = 1.2; body(); ctx.stroke();
    // the path of O₂: water in at the mouth, over the gills, into the blood, out to the muscles
    ctx.strokeStyle = 'rgba(159,240,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(X(0.56), Y(-0.01)); ctx.lineTo(X(0.47), Y(-0.01)); ctx.quadraticCurveTo(X(0.40), Y(0.0), X(0.34), Y(-0.11)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,110,120,.9)';
    ctx.beginPath(); ctx.moveTo(X(0.36), Y(0.04)); ctx.quadraticCurveTo(X(0.20), Y(0.075), X(-0.10), Y(0.05)); ctx.quadraticCurveTo(X(-0.22), Y(0.03), X(-0.25), Y(0.0)); ctx.stroke();
    ctx.setLineDash([]);
    // labels
    rowLabels(ctx, [x, y, w, h], [
      { ax: X(-0.20), ay: Y(0.09), text: 'muscle blocks: most of the O₂ is used here', col: '#F2B8B8' },
      { ax: X(-0.02), ay: Y(0.06), text: 'spine' },
      { ax: X(0.07), ay: Y(0.012), text: 'swim bladder' },
      { ax: X(0.18), ay: Y(0.032), text: 'kidney', col: '#E8A0A8' },
      { ax: X(0.40), ay: Y(0.058), text: 'brain' },
      { ax: X(0.375), ay: Y(0.03), text: 'gills: O₂ enters the blood', col: '#FF9AA4', row: 'bottom' },
      { ax: X(0.355), ay: Y(-0.082), text: 'heart', col: '#FF9AA4', row: 'bottom' },
      { ax: X(0.27), ay: Y(-0.065), text: 'liver', row: 'bottom' },
      { ax: X(0.20), ay: Y(-0.05), text: 'stomach', row: 'bottom' },
      { ax: X(0.02), ay: Y(-0.08), text: 'intestine', row: 'bottom' }
    ]);
    scaleBar(ctx, X(-0.50), Y(-0.20), L / 3, '1 cm');
    ctx.restore();
  }

  /* one gill arch, and a filament's lamellae with water and blood running opposite ways.
     o.eff: the exchanger's effectiveness, computed by the caller (countercurrent vs parallel). */
  function gillPlate(ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    const ax = x + w * 0.20, ay = y + h * 0.50, R = Math.min(w, h - 70) * 0.36;
    // the arch: a curved bony bar
    ctx.strokeStyle = '#E8DCC8'; ctx.lineWidth = Math.max(6, R * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ax + R * 1.2, ay, R * 1.2, Math.PI * 0.72, Math.PI * 1.28); ctx.stroke();
    // two rows of filaments, bright with blood
    for (let k = 0; k < 26; k++) {
      const a = Math.PI * 0.74 + k / 25 * Math.PI * 0.52;
      const bx = ax + R * 1.2 + Math.cos(a) * R * 1.2, by = ay + Math.sin(a) * R * 1.2;
      const len = R * (0.55 + 0.25 * Math.sin(k / 25 * Math.PI));
      RX.tube(ctx, [[bx, by], [bx - len * 0.9, by + (by - ay) * 0.05]], Math.max(1.5, R * 0.018), '#D83848', {});
    }
    // the magnified filament: lamellae as thin plates
    const fx = x + w * 0.46, fy = y + 44, fw = w * 0.52, fh = h * 0.46;
    ctx.strokeStyle = 'rgba(201,212,234,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - R * 0.4, ay - R * 0.2); ctx.lineTo(fx, fy + fh * 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(8,12,22,.6)'; ctx.fillRect(fx, fy, fw, fh);
    RX.tube(ctx, [[fx + 8, fy + fh * 0.5], [fx + fw - 8, fy + fh * 0.5]], fh * 0.06, '#C23040', {});
    for (let k = 0; k < 14; k++) {
      const lx = fx + 18 + k * (fw - 36) / 13;
      for (const s2 of [-1, 1]) {
        const g2 = ctx.createLinearGradient(lx, fy + fh * 0.5, lx, fy + fh * (0.5 + s2 * 0.40));
        g2.addColorStop(0, '#E0505E'); g2.addColorStop(1, '#F29098');
        ctx.fillStyle = g2;
        ctx.fillRect(lx - 3, Math.min(fy + fh * 0.5, fy + fh * (0.5 + s2 * 0.40)), 6, fh * 0.40);
      }
    }
    // flows: water left→right across the lamellae, blood right→left inside them
    const arrow = (x0, y0, x1, y1, col) => {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };
    arrow(fx + 12, fy + fh * 0.08, fx + fw - 12, fy + fh * 0.08, '#9FF0FF');
    arrow(fx + fw - 12, fy + fh * 0.93, fx + 12, fy + fh * 0.93, '#FF7A86');
    ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#9FF0FF'; ctx.textAlign = 'left';
    ctx.fillText('water flows this way →', fx + 12, fy + fh * 0.08 - 4);
    ctx.textBaseline = 'top'; ctx.fillStyle = '#FF9AA4'; ctx.textAlign = 'right';
    ctx.fillText('← blood flows the opposite way', fx + fw - 12, fy + fh * 0.93 + 4);
    // the exchanger, computed: O₂ along the lamella for both arrangements
    scaleBar(ctx, fx + fw - 56, fy + fh + 30, 50, '0.1 mm');
    // the exchanger, computed: O₂ in the blood along the lamella, both arrangements
    const gx = fx, gy = fy + fh + 38, gw = fw, gh = y + h - 34 - gy;
    if (gh > 48 && o.eff) {
      ctx.fillStyle = 'rgba(8,12,22,.82)'; ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(80,100,140,.5)'; ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
      ctx.font = '600 9.5px "IBM Plex Mono",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#FF9AA4'; ctx.fillText('opposite flows: blood leaves ' + (100 * o.eff.counter).toFixed(0) + ' % loaded with O₂', gx + 7, gy + 5);
      ctx.fillStyle = 'rgba(255,154,164,.7)'; ctx.fillText('side-by-side flows: only ' + (100 * o.eff.parallel).toFixed(0) + ' %', gx + 7, gy + 18);
      const py0 = gy + 32, ph2 = gh - 38, PX = q => gx + 8 + q * (gw - 60), PY = q => py0 + ph2 - q * ph2;
      const plot = (pts, col, dash) => { ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash(dash || []); ctx.beginPath();
        pts.forEach((q, i) => { i ? ctx.lineTo(PX(q[0]), PY(q[1])) : ctx.moveTo(PX(q[0]), PY(q[1])); }); ctx.stroke(); ctx.setLineDash([]); };
      if (ph2 > 10) {
        plot(o.eff.water, '#9FF0FF'); plot(o.eff.blood, '#FF7A86'); plot(o.eff.parBlood, 'rgba(255,122,134,.55)', [4, 3]);
        // each curve named at its own end
        ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        const tagAt = (pts, col, t) => { const q = pts[pts.length - 1]; ctx.fillStyle = col; ctx.fillText(t, PX(q[0]) + 4, PY(q[1])); };
        tagAt(o.eff.water, '#9FF0FF', 'water'); tagAt(o.eff.blood, '#FF7A86', 'blood'); tagAt(o.eff.parBlood, 'rgba(255,154,164,.8)', 'side by side');
      }
    }
    rowLabels(ctx, [x, y, w, h], [
      { ax: ax - R * 0.35, ay: ay - R * 0.62, text: 'gill filaments', col: '#FF9AA4' },
      { ax: fx + fw * 0.38, ay: fy + fh * 0.26, text: 'lamellae: a wall two cells thick', col: '#F29098' },
      { ax: ax + R * 0.02, ay: ay + R * 0.55, text: 'gill arch (bone)', col: '#E8DCC8', row: 'bottom' }
    ]);
    ctx.restore();
  }

  /* a swimming-muscle cell with the capillary that feeds it */
  function cellPlate(ctx, x, y, w, h, o) {
    ctx.save();
    const cx = x + w * 0.50, cy = y + h * 0.56, fw = w * 0.84, fh = h * 0.32;
    // capillary above, red blood cells passing
    const capY = cy - fh * 0.95;
    RX.tube(ctx, [[cx - fw / 2, capY], [cx + fw / 2, capY]], fh * 0.16, '#6E2A34', { contour: 1 });
    for (let k = 0; k < 7; k++) RX.blob(ctx, cx - fw / 2 + fw * ((k + 0.5) / 7 + ((o && o.t) || 0) * 0.05 % (1 / 7)), capY, fh * 0.10, fh * 0.07, { fill: '#D0303E', r: fh * 0.08, rim: 0.7, contour: 0.8 });
    // the fibre: striated myofibrils, nuclei at the edge, mitochondria packed between
    const fibre = cc => { if (cc.roundRect) cc.roundRect(cx - fw / 2, cy - fh / 2, fw, fh, fh * 0.3); else cc.rect(cx - fw / 2, cy - fh / 2, fw, fh); };
    RX.body(ctx, fibre, { fill: '#B5586A', r: fh * 0.5, cx, cy, rim: 0.6, ao: 0.5, stipple: 0.2, contour: 1.2 });
    ctx.save(); ctx.beginPath(); fibre(ctx); ctx.clip();
    for (let k = 0; k < 64; k++) { const sx = cx - fw / 2 + k * fw / 64; ctx.strokeStyle = k % 2 ? 'rgba(70,20,30,.35)' : 'rgba(240,200,210,.18)'; ctx.lineWidth = fw / 64 * 0.6;
      ctx.beginPath(); ctx.moveTo(sx, cy - fh / 2); ctx.lineTo(sx, cy + fh / 2); ctx.stroke(); }
    for (let r = 0; r < 3; r++) for (let k = 0; k < 11; k++) {
      const mx = cx - fw / 2 + fw * (k + 0.5 + (r % 2) * 0.5) / 11.5, my = cy - fh * 0.28 + r * fh * 0.28;
      RX.blob(ctx, mx, my, fh * 0.07, fh * 0.035, { fill: '#E87E3A', r: fh * 0.05, rim: 0.6, contour: 0.7 });
    }
    for (let k = 0; k < 4; k++) RX.blob(ctx, cx - fw * 0.36 + k * fw * 0.24, cy + fh * 0.44, fh * 0.12, fh * 0.05, { fill: '#5A3A7A', r: fh * 0.06, rim: 0.5, contour: 0.8 });
    ctx.restore();
    // O₂ arrows from the capillary into the fibre, CO₂ back
    ctx.font = '600 10px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
    for (let k = 0; k < 4; k++) {
      const ax = cx - fw * 0.3 + k * fw * 0.2;
      ctx.strokeStyle = '#9FF0FF'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ax, capY + fh * 0.14); ctx.lineTo(ax, cy - fh * 0.55); ctx.stroke();
      ctx.strokeStyle = '#FFB35C'; ctx.beginPath(); ctx.moveTo(ax + 10, cy - fh * 0.55); ctx.lineTo(ax + 10, capY + fh * 0.14); ctx.stroke();
    }
    rowLabels(ctx, [x, y, w, h], [
      { ax: cx - fw * 0.30, ay: capY - fh * 0.08, text: 'capillary: blood from the gills', col: '#FF9AA4' },
      { ax: cx + fw * 0.20, ay: capY + fh * 0.30, text: 'O₂ in', col: '#9FF0FF' },
      { ax: cx + fw * 0.25, ay: capY + fh * 0.30, text: 'CO₂ out', col: '#FFB35C' },
      { ax: cx - fw * 0.36, ay: cy + fh * 0.44, text: 'nucleus', col: '#C9B4F0', row: 'bottom' },
      { ax: cx - fw * 0.07, ay: cy, text: 'mitochondria', col: '#FFB35C', row: 'bottom' },
      { ax: cx + fw * 0.33, ay: cy - fh * 0.1, text: 'myofibrils: the stripes that contract', col: '#F2C6CE', row: 'bottom' }
    ]);
    scaleBar(ctx, cx + fw / 2 - 60, cy - fh / 2 - 8, 60, '10 µm');
    ctx.restore();
  }

  /* a mitochondrion cut open: outer membrane, folded inner membrane (cristae), matrix */
  function mitoPlate(ctx, x, y, w, h, o) {
    ctx.save();
    const cx = x + w * 0.50, cy = y + h * 0.50, rx = w * 0.40, ry = h * 0.28;
    RX.blob(ctx, cx, cy, rx, ry, { fill: '#E07A3A', r: Math.min(rx, ry), rim: 0.6, ao: 0.5, contour: 1.4 });
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.92, ry * 0.86, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#F2B07A'; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);          // the matrix
    // cristae: the inner membrane folded into shelves — where O₂ is finally used
    for (let k = 0; k < 11; k++) {
      const sx = cx - rx * 0.78 + k * rx * 0.156, up = k % 2 === 0;
      const y0 = up ? cy - ry * 0.90 : cy + ry * 0.90, y1 = up ? cy + ry * 0.35 : cy - ry * 0.35;
      ctx.fillStyle = '#C8602A'; ctx.strokeStyle = '#7A3014'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx - rx * 0.035, y0); ctx.lineTo(sx - rx * 0.035, y1); ctx.quadraticCurveTo(sx, y1 + (up ? ry * 0.08 : -ry * 0.08), sx + rx * 0.035, y1); ctx.lineTo(sx + rx * 0.035, y0); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let j = 0; j < 6; j++) {                                 // ATP synthase knobs along the crista
        const yy = y0 + (y1 - y0) * (j + 0.5) / 6;
        ctx.fillStyle = '#FFE0A8'; ctx.beginPath(); ctx.arc(sx + rx * 0.045, yy, Math.max(1.2, rx * 0.009), 0, TAU); ctx.fill();
      }
    }
    for (let k = 0; k < 30; k++) { ctx.fillStyle = 'rgba(90,40,20,.5)'; ctx.beginPath(); ctx.arc(cx + Math.sin(k * 7.3) * rx * 0.7, cy + Math.cos(k * 3.1) * ry * 0.6, 1.4, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#7A3014'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.92, ry * 0.86, 0, 0, TAU); ctx.stroke();
    rowLabels(ctx, [x, y, w, h], [
      { ax: cx - rx * 0.96, ay: cy - ry * 0.1, text: 'outer membrane', col: '#F2C6A8' },
      { ax: cx - rx * 0.30, ay: cy - ry * 0.50, text: 'crista (inner membrane): O₂ + electrons → water', col: '#FFE0A8' },
      { ax: cx + rx * 0.55, ay: cy + ry * 0.25, text: 'matrix: sugar’s carbon leaves as CO₂', col: '#F2C6A8', row: 'bottom' },
      { ax: cx - rx * 0.12, ay: cy + ry * 0.2, text: 'ATP synthase: the energy is packed into ATP', col: '#FFE0A8', row: 'bottom' }
    ]);
    scaleBar(ctx, cx + rx - rx * 0.45, cy - ry - 10, rx * 0.45, '0.5 µm');
    ctx.restore();
  }

  window.LIFE = { frameOf, tetra, angelfish, shrimp, cabomba, vallisneria,
                  plates: { fish: fishPlate, gill: gillPlate, cell: cellPlate, mito: mitoPlate } };
})();
