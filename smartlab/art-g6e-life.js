/* ============================================================
   G6L — living things of Grade 6 Unit E, drawn from their anatomy.
   Birds side-on (long-tailed widowbird, male and female; great tit, adult
   and nestling; black-shouldered kite in flight), with the feather tracts
   that make them what they are: primaries, coverts, the keeled tail, the
   eye-ring, the gape. A honeybee from above, its pollen baskets filling.
   Meadow flowers (buttercup, cranesbill) with their anthers and stigma; a
   lily built in 3D for dissection, its tepals, stamens and ovary with its
   ovules; a grass floret with dangling anthers and feathery stigmas; a
   sycamore samara, a dandelion achene with its pappus, an acorn, a cherry;
   a broadleaf tree. Everything is drawn at the size and pose a lab computes;
   nothing here computes science.
   ============================================================ */
(function () {
  'use strict';
  const RX = window.RX, R3 = window.R3;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => RX.mix(a, b, t), rgba = (c, a) => RX.rgba(c, a);

  /* ---------------- birds ----------------
     birdSide(ctx, x, y, s, o): x, y the centre of the body, s the body length in px (bill to rump),
     o.kind 'widowM' | 'widowF' | 'tit' | 'kite'; o.facing ±1; o.pose 'perch' | 'fly' | 'display';
     o.phase (wingbeat); o.tail (tail length as a multiple of body length). */
  const PLUM = {
    widowM: { body: '#141418', belly: '#1C1C22', head: '#141418', wing: '#1A1A20', tail: '#101014', bill: '#AFC3D6', edge: '#2A2A34', epaulet: '#F0441E', bar: '#F2D9A0' },
    widowF: { body: '#9C7A4E', belly: '#D9C29A', head: '#8E6C42', wing: '#7A5A36', tail: '#7A5A36', bill: '#C9A27C', edge: '#C8A878', streak: '#4A3420' },
    tit: { body: '#7F9A4A', belly: '#F2D640', head: '#111214', wing: '#6C8AA6', tail: '#4C5C72', bill: '#1C1C1E', edge: '#A9C0D8', cheek: '#F6F6F2', stripe: '#141416', bar: '#F3F3EE' },
    thrush: { body: '#7A6448', belly: '#F0E2C0', head: '#6E5A40', wing: '#6A5438', tail: '#5E4A32', bill: '#4A3A2A', edge: '#A08A68', spots: '#3A2A1A' },
    jay: { body: '#C8A08C', belly: '#E2C8B8', head: '#D0B0A0', wing: '#2A2A2E', tail: '#16161A', bill: '#2A2A2E', edge: '#5A5A64', blue: '#3A7AD8', moustache: '#16161A' },
    kite: { body: '#D6DCE2', belly: '#F4F6F8', head: '#E8ECF0', wing: '#B9C2CC', tail: '#E8ECF0', bill: '#1C1C1E', edge: '#8A96A4', shoulder: '#16181C', eye: '#C8301E' }
  };
  function birdSide(ctx, x, y, s, o) {
    o = o || {};
    const P = PLUM[o.kind || 'tit'], f = o.facing || 1, pose = o.pose || 'perch', ph = o.phase || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * s / 100, s / 100);
    // local frame: body from x −50 (rump) to +50 (bill tip), y down; the bird faces +x
    const tailL = 100 * (o.tail || (o.kind === 'widowM' ? 2.6 : o.kind === 'kite' ? 0.55 : 0.6));
    const fly = pose !== 'perch', wingUp = fly ? Math.sin(ph) : 0;
    /* the far wing, in flight */
    if (fly) wing(ctx, P, -wingUp, true, o.kind);
    /* the tail: feathers fanned from the rump */
    const nT = o.kind === 'widowM' ? 6 : 5, droop = o.kind === 'widowM' ? (pose === 'display' ? 0.8 : 1.28) : 0.18;
    if (o.kind === 'widowM') {
      // the male's tail: twelve broad black feathers, half a metre long, folded into a deep vertical keel
      // that hangs below him on the perch and billows behind and below him in the display flight
      const fan = pose === 'display' ? 0.09 : 0.035, sway = Math.sin(ph * 0.5) * (fly ? 0.05 : 0.02);
      for (let k = nT - 1; k >= 0; k--) {
        const a = droop + (k - (nT - 1) / 2) * fan + sway, len = tailL * (0.82 + 0.18 * Math.cos((k - (nT - 1) / 2) / nT * 2));
        const x0 = -36, y0 = 4, dx = -Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, w = 17;
        const x1 = x0 + dx * len, y1 = y0 + dy * len, cx = x0 + dx * len * 0.5 + nx * len * 0.06, cy = y0 + dy * len * 0.5 + ny * len * 0.06;
        const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#16161C'); g.addColorStop(0.6, mix('#16161C', '#2A2A36', (k % 2) * 0.6)); g.addColorStop(1, '#0C0C10');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(x0 + nx * w * 0.4, y0 + ny * w * 0.4); ctx.quadraticCurveTo(cx + nx * w, cy + ny * w, x1 + nx * w * 0.5, y1 + ny * w * 0.5);
        ctx.quadraticCurveTo(x1 + dx * 6, y1 + dy * 6, x1 - nx * w * 0.5, y1 - ny * w * 0.5);
        ctx.quadraticCurveTo(cx - nx * w * 0.6, cy - ny * w * 0.6, x0 - nx * w * 0.4, y0 - ny * w * 0.4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(120,125,150,.35)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
      }
    }
    for (let k = nT - 1; k >= 0 && o.kind !== 'widowM'; k--) {
      const spread = (k - (nT - 1) / 2) * (o.kind === 'widowM' ? (pose === 'display' ? 5 : 2.2) : 2.5), len = tailL * (0.86 + 0.14 * (1 - Math.abs(k - (nT - 1) / 2) / nT));
      const x0 = -38, y0 = 2, x1 = x0 - len * Math.cos(droop), y1 = y0 + len * Math.sin(droop) + spread * len / 60;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (o.kind === 'widowM' ? len * 0.12 : 0);
      const w = o.kind === 'widowM' ? 7 : 6;
      ctx.fillStyle = mix(P.tail, '#05080F', 0.12 * (k % 2)); ctx.beginPath();
      ctx.moveTo(x0, y0 - w * 0.5); ctx.quadraticCurveTo(cx, cy - w, x1, y1); ctx.quadraticCurveTo(cx, cy + w * 0.6, x0, y0 + w * 0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = mix(P.tail, '#FFFFFF', 0.18); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy - w * 0.2, x1, y1); ctx.stroke();
    }
    if (o.kind === 'tit') { ctx.fillStyle = '#F2F2EE'; ctx.beginPath(); ctx.moveTo(-40, 5); ctx.lineTo(-40 - tailL, 5 + tailL * 0.18); ctx.lineTo(-40 - tailL, 9 + tailL * 0.18); ctx.closePath(); ctx.fill(); }
    /* legs and feet, perched */
    if (!fly) {
      ctx.strokeStyle = o.kind === 'tit' ? '#5A6C7C' : '#3A3430'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      [[2, 0], [10, 1]].forEach(([lx]) => { ctx.beginPath(); ctx.moveTo(lx, 16); ctx.lineTo(lx - 3, 34); ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx - 3, 34); ctx.lineTo(lx + 6, 36); ctx.moveTo(lx - 3, 34); ctx.lineTo(lx - 10, 36); ctx.stroke(); ctx.lineWidth = 2.4; });
    }
    /* the body: a lit, rounded form, breast forward */
    const bodyPath = c => { c.moveTo(-44, 2); c.bezierCurveTo(-40, -18, 8, -24, 26, -14); c.bezierCurveTo(40, -6, 34, 20, 14, 22); c.bezierCurveTo(-8, 26, -38, 18, -44, 2); c.closePath(); };
    RX.body(ctx, bodyPath, { fill: P.body, r: 30, cx: -2, cy: 0, stipple: 0.3, rim: 0.5, ao: 0.5, contour: 1.1 });
    // the belly: a paler flank and underside
    ctx.save(); ctx.beginPath(); bodyPath(ctx); ctx.clip();
    const bg = ctx.createLinearGradient(0, -4, 0, 24); bg.addColorStop(0, rgba(P.belly, 0)); bg.addColorStop(0.45, rgba(P.belly, 0.95)); bg.addColorStop(1, rgba(mix(P.belly, '#05080F', 0.25), 1));
    ctx.fillStyle = bg; ctx.fillRect(-50, -30, 100, 60);
    if (o.kind === 'tit') { ctx.fillStyle = P.stripe; ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(14, 8, 4, 24); ctx.lineTo(-4, 24); ctx.quadraticCurveTo(8, 8, 16, -6); ctx.closePath(); ctx.fill(); }
    if (P.spots) { ctx.fillStyle = P.spots; for (let k = 0; k < 16; k++) { const sx = -8 + (k % 5) * 6, sy = 2 + Math.floor(k / 5) * 5; ctx.beginPath(); ctx.ellipse(sx + (k % 2) * 2, sy, 1.6, 2.2, 0.3, 0, TAU); ctx.fill(); } }
    if (o.kind === 'widowF') { ctx.strokeStyle = rgba(P.streak, 0.7); ctx.lineWidth = 1.4; for (let k = 0; k < 14; k++) { const sx = -36 + k * 5, sy = -12 + (k % 3) * 4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 4, sy + 3); ctx.stroke(); } }
    ctx.restore();
    /* the near wing */
    if (fly) wing(ctx, P, wingUp, false, o.kind); else foldedWing(ctx, P, o.kind);
    /* the head */
    const hx = 30, hy = -16;
    RX.body(ctx, c => c.arc(hx, hy, 15, 0, TAU), { fill: P.head, r: 15, cx: hx, cy: hy, rim: 0.4, ao: 0.4, contour: 1 });
    if (o.kind === 'tit') {
      ctx.fillStyle = P.cheek; ctx.beginPath(); ctx.ellipse(hx + 1, hy + 4, 8.5, 6.5, -0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F6F4E8'; ctx.beginPath(); ctx.arc(hx - 8, hy - 9, 2.4, 0, TAU); ctx.fill();          // the white nape spot
    }
    if (o.kind === 'kite') { ctx.fillStyle = '#16181C'; ctx.beginPath(); ctx.ellipse(hx + 4, hy - 2, 6, 2.2, -0.1, 0, TAU); ctx.fill(); }
    if (P.moustache) { ctx.fillStyle = P.moustache; ctx.beginPath(); ctx.moveTo(hx + 10, hy + 2); ctx.lineTo(hx - 2, hy + 9); ctx.lineTo(hx + 1, hy + 11); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,30,40,.6)'; ctx.lineWidth = 0.8; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(hx - 6 + k * 3, hy - 13); ctx.lineTo(hx - 5 + k * 3, hy - 10); ctx.stroke(); } }
    // the bill
    ctx.fillStyle = P.bill; ctx.beginPath();
    if (o.kind === 'kite') { ctx.moveTo(hx + 11, hy - 4); ctx.quadraticCurveTo(hx + 22, hy - 4, hx + 21, hy + 5); ctx.lineTo(hx + 17, hy + 2); ctx.lineTo(hx + 11, hy + 3); }
    else if (o.kind === 'tit') { ctx.moveTo(hx + 12, hy - 2.5); ctx.lineTo(hx + 22, hy + 0.5); ctx.lineTo(hx + 12, hy + 3); }
    else { ctx.moveTo(hx + 11, hy - 5); ctx.quadraticCurveTo(hx + 22, hy - 1, hx + 23, hy + 1); ctx.quadraticCurveTo(hx + 18, hy + 5, hx + 11, hy + 5); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#05080F', 0.5); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hx + 12, hy + 0.5); ctx.lineTo(hx + 20, hy + 0.8); ctx.stroke();
    // the eye: a dark iris, a pale ring, a catchlight
    ctx.fillStyle = o.kind === 'kite' ? P.eye : '#1A0F08'; ctx.beginPath(); ctx.arc(hx + 3, hy - 3, 3.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = o.kind === 'widowM' ? '#3A3A44' : 'rgba(240,235,220,.8)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(hx + 4.2, hy - 4.2, 1.1, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function foldedWing(ctx, P, kind) {
    const path = c => { c.moveTo(14, -10); c.bezierCurveTo(-4, -16, -30, -8, -52, 8); c.bezierCurveTo(-30, 10, -6, 12, 12, 6); c.closePath(); };
    RX.body(ctx, path, { fill: P.wing, r: 22, cx: -14, cy: -2, rim: 0.4, ao: 0.4, contour: 0.9 });
    // the primaries' edges, and the coverts
    ctx.strokeStyle = rgba(P.edge, 0.7); ctx.lineWidth = 0.9;
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-14 - k * 4, 0 + k * 0.8); ctx.quadraticCurveTo(-30 - k * 3, 4 + k, -48 + k * 1.5, 8); ctx.stroke(); }
    if (P.epaulet) { ctx.fillStyle = P.epaulet; ctx.beginPath(); ctx.ellipse(6, -7, 8, 4.5, -0.25, 0, TAU); ctx.fill(); ctx.fillStyle = P.bar; ctx.beginPath(); ctx.ellipse(-1, -4, 5, 2.6, -0.25, 0, TAU); ctx.fill(); ctx.fillStyle = P.epaulet; ctx.beginPath(); ctx.ellipse(7, -7.5, 7, 3.4, -0.25, 0, TAU); ctx.fill(); }
    if (P.bar && !P.epaulet) { ctx.strokeStyle = P.bar; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(-8, -6, -16, -2); ctx.stroke(); }
    if (P.shoulder) { ctx.fillStyle = P.shoulder; ctx.beginPath(); ctx.ellipse(2, -6, 10, 4, -0.2, 0, TAU); ctx.fill(); }
    if (P.blue) { for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? P.blue : '#F4F6FA'; ctx.fillRect(-2 - k * 2.4, -9 + k * 0.6, 2.4, 6); } ctx.fillStyle = '#F4F6FA'; ctx.beginPath(); ctx.ellipse(-30, 6, 6, 3, 0.2, 0, TAU); ctx.fill(); }
    void kind;
  }
  function wing(ctx, P, up, far, kind) {
    // a spread wing from the shoulder, raised (up > 0) or lowered, its primaries fingered
    const span = kind === 'kite' ? 95 : 70, ang = -0.25 - up * 0.9, sx = 6, sy = -8;
    const tipX = sx - span * 0.45, tipY = sy + Math.sin(ang) * span;
    ctx.save();
    ctx.globalAlpha = far ? 0.85 : 1;
    const col = far ? mix(P.wing, '#05080F', 0.35) : P.wing;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx + 8, sy + 2); ctx.quadraticCurveTo(sx - 4, tipY * 0.6 + sy * 0.4, tipX, tipY);
    for (let k = 0; k < 6; k++) { const fx = tipX + k * 5, fy = tipY + (k + 1) * (sy - tipY) / 7 + 6; ctx.lineTo(fx - 4, fy + 4); ctx.lineTo(fx + 2, fy); }
    ctx.quadraticCurveTo(sx - 16, sy + 6, sx - 18, sy + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(P.edge, 0.6); ctx.lineWidth = 0.8;
    for (let k = 0; k < 6; k++) { const fx = tipX + k * 5, fy = tipY + (k + 1) * (sy - tipY) / 7 + 6; ctx.beginPath(); ctx.moveTo(sx - 6, sy + 2); ctx.lineTo(fx - 1, fy + 2); ctx.stroke(); }
    if (P.epaulet && !far) { ctx.fillStyle = P.epaulet; ctx.beginPath(); ctx.ellipse(sx - 4, sy + (tipY - sy) * 0.18, 7, 4, ang, 0, TAU); ctx.fill(); }
    if (P.shoulder && !far) { ctx.fillStyle = P.shoulder; ctx.beginPath(); ctx.ellipse(sx - 6, sy + (tipY - sy) * 0.22, 11, 4, ang, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  /* a nestling: downy, pin-feathered, its yellow-rimmed gape wide when it begs. x, y: body centre, s: body length */
  function chick(ctx, x, y, s, o) {
    o = o || {};
    const beg = o.beg || 0, look = o.ang || 0, starve = o.thin || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
    const bw = 18 * (1 - starve * 0.3);
    RX.body(ctx, c => c.ellipse(0, 4, bw, 13, 0, 0, TAU), { fill: '#C9A99A', r: 15, cx: 0, cy: 4, stipple: 0.6, rim: 0.4, ao: 0.5, contour: 0.8 });
    // pin feathers in their sheaths along the wing tract, grey-blue
    ctx.strokeStyle = 'rgba(80,95,120,.75)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-12 + k * 3.5, -2 + Math.abs(k - 3) * 0.6); ctx.lineTo(-13 + k * 3.5, 4 + Math.abs(k - 3) * 0.6); ctx.stroke(); }
    // down tufts
    ctx.strokeStyle = 'rgba(230,225,215,.8)'; ctx.lineWidth = 0.7;
    for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.32; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 10 - 2); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 13 - 4); ctx.stroke(); }
    // the head, raised when begging, and the gape
    ctx.save(); ctx.translate(2, -8); ctx.rotate(-0.6 * beg + look);
    RX.body(ctx, c => c.ellipse(0, -10 - 6 * beg, 8.5, 8, 0, 0, TAU), { fill: '#BFA092', r: 8, cx: 0, cy: -10, rim: 0.3, ao: 0.4, contour: 0.7 });
    ctx.fillStyle = '#2A1C18'; ctx.beginPath(); ctx.ellipse(-3, -13 - 6 * beg, 2.6, 2.2, 0, 0, TAU); ctx.fill();   // eyes still closed in a young chick: a dark bulge
    const gy = -6 - 6 * beg, open = 2 + 7 * beg;
    ctx.fillStyle = '#F6D34A'; ctx.beginPath(); ctx.moveTo(3, gy - 2); ctx.lineTo(13 + beg * 3, gy - open * 0.6); ctx.lineTo(13 + beg * 3, gy + open * 0.6); ctx.lineTo(3, gy + 2); ctx.closePath(); ctx.fill();
    if (beg > 0.2) { ctx.fillStyle = '#F07A2A'; ctx.beginPath(); ctx.moveTo(5, gy); ctx.lineTo(12 + beg * 3, gy - open * 0.45); ctx.lineTo(12 + beg * 3, gy + open * 0.45); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
  /* a green caterpillar (a winter moth larva, the great tit's staple), segmented */
  function caterpillar(ctx, x, y, s, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    for (let k = 0; k < 9; k++) { const cx = -s / 2 + k * s / 9, cy = Math.sin(k * 0.8) * s * 0.03; RX.ball(ctx, cx, cy, s * 0.075, '#7CC444', { shadow: false }); }
    ctx.fillStyle = '#3E6A22'; ctx.beginPath(); ctx.arc(s / 2 - s / 18, 0, s * 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- the nest box, cut open ----------------
     x, y: the floor of the box (centre), w: box width px. Returns the cup's centre and radius. */
  function nestBox(ctx, x, y, w, o) {
    o = o || {};
    const h = w * 1.55, top = y - h;
    ctx.save();
    // the trunk behind it
    const tg = ctx.createLinearGradient(x - w * 0.9, 0, x + w * 0.9, 0); tg.addColorStop(0, '#2C241C'); tg.addColorStop(0.35, '#5A4A3A'); tg.addColorStop(0.7, '#4A3C2E'); tg.addColorStop(1, '#231C15');
    ctx.fillStyle = tg; ctx.fillRect(x - w * 0.9, top - w * 1.2, w * 1.8, h + w * 2.4);
    ctx.strokeStyle = 'rgba(20,14,10,.55)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 14; k++) { const xx = x - w * 0.85 + k * w * 0.13; ctx.beginPath(); ctx.moveTo(xx, top - w * 1.2); for (let yy = top - w * 1.2; yy < y + w * 1.2; yy += 12) ctx.lineTo(xx + Math.sin(yy * 0.07 + k) * 3, yy); ctx.stroke(); }
    // the box: back board, side walls in section, floor, sloping lid; the front cut away
    const wood = (x0, y0, ww, hh, light) => { const g = ctx.createLinearGradient(x0, y0, x0 + ww, y0 + hh); g.addColorStop(0, mix('#B48A5A', '#FFFFFF', light * 0.15)); g.addColorStop(1, mix('#8C643C', '#05080F', 0.1)); ctx.fillStyle = g; ctx.fillRect(x0, y0, ww, hh); ctx.strokeStyle = 'rgba(70,45,25,.35)'; ctx.lineWidth = 0.8; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x0, y0 + hh * k / 6); ctx.lineTo(x0 + ww, y0 + hh * k / 6 + 2); ctx.stroke(); } };
    wood(x - w / 2, top, w, h, 0);
    const ig = ctx.createLinearGradient(0, top, 0, y); ig.addColorStop(0, 'rgba(10,6,4,.75)'); ig.addColorStop(1, 'rgba(30,20,12,.35)');
    ctx.fillStyle = ig; ctx.fillRect(x - w / 2 + w * 0.08, top + w * 0.1, w * 0.84, h - w * 0.16);
    wood(x - w / 2, top, w * 0.08, h, 1); wood(x + w / 2 - w * 0.08, top, w * 0.08, h, 0.5); wood(x - w / 2, y - w * 0.07, w, w * 0.07, 0.8);
    ctx.fillStyle = '#7A5634'; ctx.beginPath(); ctx.moveTo(x - w * 0.62, top - w * 0.02); ctx.lineTo(x + w * 0.62, top - w * 0.14); ctx.lineTo(x + w * 0.62, top - w * 0.02); ctx.lineTo(x - w * 0.62, top + w * 0.1); ctx.closePath(); ctx.fill();
    // the entrance hole, 28 mm, in the cut edge of the front board (drawn as its rim)
    if (o.hole) { ctx.strokeStyle = 'rgba(200,170,120,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(o.hole[0], o.hole[1], w * 0.14, w * 0.14, 0, 0, TAU); ctx.stroke(); }
    // the nest: moss base, a cup lined with hair and feathers
    const cx = x, cy = y - w * 0.07 - w * 0.22, cr = w * 0.36;
    const mg = ctx.createRadialGradient(cx, cy - cr * 0.2, cr * 0.2, cx, cy, cr * 1.3); mg.addColorStop(0, '#6A7A3A'); mg.addColorStop(1, '#3A4A1E');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(cx, cy + cr * 0.2, cr * 1.25, cr * 0.62, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(140,160,80,.6)'; ctx.lineWidth = 1;
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, rr = cr * (1 + 0.2 * Math.sin(k * 2.7)); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rr * 0.9, cy + cr * 0.2 + Math.sin(a) * rr * 0.45); ctx.lineTo(cx + Math.cos(a) * rr * 1.2, cy + cr * 0.2 + Math.sin(a) * rr * 0.58); ctx.stroke(); }
    ctx.fillStyle = '#C8B89A'; ctx.beginPath(); ctx.ellipse(cx, cy, cr * 0.95, cr * 0.32, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5A4A34'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, cr * 0.78, cr * 0.22, 0, 0, TAU); ctx.fill();
    ctx.restore();
    return { cx, cy, cr, top, h };
  }

  /* ---------------- a honeybee, from above ----------------
     x, y: thorax; s: body length px; ang: heading; o.load: pollen in the baskets 0..1, o.colour of that pollen; o.phase: wingbeat */
  function bee(ctx, x, y, s, ang, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0); ctx.scale(s / 30, s / 30);
    // wings: two pairs, clear with veins, blurred by the beat
    const flap = o.phase == null ? 0.5 : 0.5 + 0.5 * Math.sin(o.phase);
    [-1, 1].forEach(sd => {
      ctx.save(); ctx.rotate(sd * (0.55 + 0.35 * flap));
      ctx.fillStyle = 'rgba(220,235,250,.35)'; ctx.strokeStyle = 'rgba(160,175,195,.7)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(-7, sd * 7, 10, 3.6, sd * 0.25, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-8, sd * 4, 6, 2.2, sd * 0.35, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1, sd * 2); ctx.lineTo(-13, sd * 9); ctx.stroke();
      ctx.restore();
    });
    // legs: six, the hind pair carrying the pollen baskets
    ctx.strokeStyle = '#2A2016'; ctx.lineWidth = 0.9;
    [[3, 4], [0, 5], [-3, 5]].forEach(([lx, ly], i) => [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(lx, sd * 2); ctx.lineTo(lx - 2 - i * 2, sd * (ly + 1)); ctx.lineTo(lx - 4 - i * 3, sd * (ly + 3)); ctx.stroke(); }));
    if (o.load > 0.02) [-1, 1].forEach(sd => RX.ball(ctx, -7, sd * 7.2, 1 + 2.2 * clamp(o.load, 0, 1), o.colour || '#F2B830', { shadow: false }));
    // abdomen: amber and dark bands, hairy edges
    const ab = ctx.createLinearGradient(-18, 0, -3, 0); ab.addColorStop(0, '#2A1C10'); ab.addColorStop(1, '#C8862A');
    RX.body(ctx, c => c.ellipse(-10, 0, 9, 5.4, 0, 0, TAU), { fill: '#B07A2C', r: 7, cx: -10, cy: 0, rim: 0.4, ao: 0.3, contour: 0.6 });
    ctx.save(); ctx.beginPath(); ctx.ellipse(-10, 0, 9, 5.4, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(30,20,12,.82)'; [-16, -12.5, -9, -5.5].forEach(bx => ctx.fillRect(bx, -6, 1.7, 12));
    ctx.restore();
    // thorax: fuzzy, tawny
    RX.body(ctx, c => c.ellipse(0, 0, 5, 4.6, 0, 0, TAU), { fill: '#8A6A3A', r: 5, cx: 0, cy: 0, stipple: 1, rim: 0.4, ao: 0.3, contour: 0.5 });
    ctx.strokeStyle = 'rgba(220,190,130,.6)'; ctx.lineWidth = 0.5; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4.4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 5.6, Math.sin(a) * 5.2); ctx.stroke(); }
    // head with compound eyes and antennae
    RX.body(ctx, c => c.ellipse(6.6, 0, 2.8, 3.4, 0, 0, TAU), { fill: '#3A2A18', r: 3, cx: 6.6, cy: 0, rim: 0.3, ao: 0.2, contour: 0.5 });
    ctx.fillStyle = '#16100A'; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(6.4, sd * 2.2, 1.6, 1.1, 0, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = '#1C140C'; ctx.lineWidth = 0.6; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(8.8, sd * 0.8); ctx.lineTo(11.5, sd * 2.5); ctx.lineTo(13.5, sd * 4.2); ctx.stroke(); });
    ctx.restore();
  }

  /* ---------------- meadow flowers, seen from above ----------------
     kind 'butter' (buttercup: five glossy yellow petals, a boss of stamens around the green carpels) or
     'crane' (cranesbill: five notched violet petals with dark veins); o.dusted: pollen on the stigma 0..1;
     o.seeded: fraction of ovules fertilised 0..1 (the centre swells and greens); o.anther: pollen left 0..1 */
  function meadowFlower(ctx, x, y, s, kind, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y);
    const n = 5, rot = o.rot || 0, crane = kind === 'crane';
    for (let k = 0; k < n; k++) {
      const a = rot + k / n * TAU;
      ctx.save(); ctx.rotate(a);
      const pg = ctx.createRadialGradient(s * 0.1, 0, 0, s * 0.3, 0, s * 0.55);
      if (crane) { pg.addColorStop(0, '#E8D8F6'); pg.addColorStop(0.4, '#A97AD8'); pg.addColorStop(1, '#7A4AB0'); }
      else { pg.addColorStop(0, '#FFF7B0'); pg.addColorStop(0.5, '#F7D11E'); pg.addColorStop(1, '#D9A400'); }
      ctx.fillStyle = pg; ctx.beginPath();
      ctx.moveTo(s * 0.06, 0); ctx.bezierCurveTo(s * 0.18, -s * 0.24, s * 0.5, -s * 0.26, s * 0.52, crane ? -s * 0.04 : 0);
      if (crane) ctx.lineTo(s * 0.46, 0);
      ctx.bezierCurveTo(s * 0.5, s * 0.26, s * 0.18, s * 0.24, s * 0.06, 0); ctx.fill();
      if (crane) { ctx.strokeStyle = 'rgba(70,30,110,.55)'; ctx.lineWidth = Math.max(0.5, s * 0.012); for (let v = -2; v <= 2; v++) { ctx.beginPath(); ctx.moveTo(s * 0.08, 0); ctx.quadraticCurveTo(s * 0.28, v * s * 0.05, s * 0.44, v * s * 0.08); ctx.stroke(); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(s * 0.26, -s * 0.06, s * 0.1, s * 0.035, -0.3, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // stamens round the centre: filaments and anthers, pale when emptied
    const ant = o.anther == null ? 1 : o.anther;
    for (let k = 0; k < (crane ? 10 : 20); k++) {
      const a = k / (crane ? 10 : 20) * TAU, rr = s * (crane ? 0.12 : 0.14);
      ctx.strokeStyle = crane ? '#D8C8E8' : '#E8C820'; ctx.lineWidth = Math.max(0.4, s * 0.012);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.05, Math.sin(a) * s * 0.05); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.stroke();
      ctx.fillStyle = mix(crane ? '#5A3A8A' : '#F0A010', '#E8E0D0', 1 - ant); ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, Math.max(0.6, s * 0.025), 0, TAU); ctx.fill();
    }
    // the carpels and stigma, greening and swelling as ovules are fertilised; dusted by arriving pollen
    const sd = o.seeded || 0;
    RX.ball(ctx, 0, 0, s * (0.06 + 0.04 * sd), mix(crane ? '#C8A8E0' : '#C8D84A', '#4C8A2A', sd), { shadow: false });
    if (o.dusted > 0.01) { ctx.fillStyle = rgba(o.dustColour || '#F2B830', clamp(o.dusted, 0, 1)); for (let k = 0; k < 7; k++) { const a = k * 2.4; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.035, Math.sin(a) * s * 0.035, Math.max(0.5, s * 0.014), 0, TAU); ctx.fill(); } }
    ctx.restore();
  }

  /* ---------------- seeds ---------------- */
  function samara(ctx, x, y, s, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const wg = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2); wg.addColorStop(0, '#D8B070'); wg.addColorStop(1, '#A4783A');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.3, -s * 0.28, s * 0.9, -s * 0.22, s, -s * 0.05); ctx.bezierCurveTo(s * 0.8, s * 0.06, s * 0.3, s * 0.1, 0, s * 0.08); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,30,.6)'; ctx.lineWidth = Math.max(0.4, s * 0.02);
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(s * 0.08, -s * 0.02); ctx.quadraticCurveTo(s * 0.4, -s * 0.18 + k * s * 0.03, s * (0.7 + k * 0.04), -s * 0.14 + k * s * 0.035); ctx.stroke(); }
    RX.ball(ctx, 0, 0, s * 0.13, '#8A6236', { shadow: false });
    ctx.restore();
  }
  function dandelionSeed(ctx, x, y, s, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    // achene (the fruit), the long beak, and the pappus: ~100 bristles in a crown
    ctx.fillStyle = '#7A5A30'; ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.04, s * 0.12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#D8D0C0'; ctx.lineWidth = Math.max(0.4, s * 0.012); ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.lineTo(0, -s * 0.12); ctx.stroke();
    ctx.strokeStyle = 'rgba(245,245,240,.85)'; ctx.lineWidth = Math.max(0.3, s * 0.008);
    for (let k = 0; k < 40; k++) { const a = -Math.PI / 2 + (k / 39 - 0.5) * 2.6; ctx.beginPath(); ctx.moveTo(0, -s * 0.12); ctx.quadraticCurveTo(Math.cos(a) * s * 0.2, -s * 0.12 + Math.sin(a) * s * 0.2, Math.cos(a) * s * 0.4, -s * 0.16 + Math.sin(a) * s * 0.32); ctx.stroke(); }
    ctx.restore();
  }
  function acorn(ctx, x, y, s) {
    RX.body(ctx, c => c.ellipse(x, y + s * 0.1, s * 0.28, s * 0.4, 0, 0, TAU), { fill: '#A06A2E', r: s * 0.35, cx: x, cy: y, rim: 0.6, ao: 0.4, contour: 0.8 });
    RX.body(ctx, c => { c.ellipse(x, y - s * 0.18, s * 0.32, s * 0.18, 0, Math.PI, TAU); c.closePath(); }, { fill: '#6E5A3A', r: s * 0.3, cx: x, cy: y - s * 0.2, stipple: 1, rim: 0.3, ao: 0.4, contour: 0.8 });
  }
  function cherry(ctx, x, y, s) {
    RX.ball(ctx, x, y, s * 0.4, '#B01628', { shadow: false });
    ctx.strokeStyle = '#4A6A2A'; ctx.lineWidth = Math.max(0.6, s * 0.06); ctx.beginPath(); ctx.moveTo(x, y - s * 0.35); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.9, x + s * 0.4, y - s * 1.1); ctx.stroke();
  }
  /* a broadleaf tree: a branching trunk and a crown of leaf clusters, lit from the upper left. x, y: base; h: height px */
  function tree(ctx, x, y, h, o) {
    o = o || {};
    const leaf = o.leaf || '#3E7A34', seed = o.seed || 3;
    let st = seed * 9301 + 49297; const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
    ctx.save();
    const tw = h * 0.07;
    const bark = ctx.createLinearGradient(x - tw, 0, x + tw, 0); bark.addColorStop(0, '#5A4632'); bark.addColorStop(0.4, '#7A6248'); bark.addColorStop(1, '#3A2C1E');
    ctx.fillStyle = bark; ctx.beginPath(); ctx.moveTo(x - tw * 1.3, y); ctx.quadraticCurveTo(x - tw * 0.8, y - h * 0.3, x - tw * 0.5, y - h * 0.55); ctx.lineTo(x + tw * 0.5, y - h * 0.55); ctx.quadraticCurveTo(x + tw * 0.8, y - h * 0.3, x + tw * 1.3, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4A3A2A'; ctx.lineCap = 'round';
    const br = [[-0.5, 0.55, -0.32, 0.78], [0.4, 0.5, 0.34, 0.75], [0, 0.55, 0.05, 0.9], [-0.2, 0.62, -0.42, 0.62], [0.2, 0.62, 0.45, 0.6]];
    br.forEach(([a, y0, ex, ey]) => { ctx.lineWidth = tw * 0.5; ctx.beginPath(); ctx.moveTo(x + a * tw, y - h * y0); ctx.quadraticCurveTo(x + ex * h * 0.3, y - h * (y0 + ey) / 2, x + ex * h * 0.55, y - h * ey); ctx.stroke(); });
    // the crown: clusters, darker inside, lit on the upper left
    const cx = x, cy = y - h * 0.68, R = h * 0.36;
    for (let k = 0; k < 26; k++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * R, px = cx + Math.cos(a) * rr * 1.15, py = cy + Math.sin(a) * rr * 0.8, r = R * (0.22 + rnd() * 0.16);
      const lit = clamp(0.5 - (px - cx) / R * 0.25 - (py - cy) / R * 0.35, 0, 1);
      const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.4, r * 0.1, px, py, r);
      g.addColorStop(0, mix(leaf, '#E8F0A0', 0.25 * lit + 0.05)); g.addColorStop(0.7, leaf); g.addColorStop(1, mix(leaf, '#05080F', 0.35));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
    // leaf texture: small lobed leaves on the lit rim
    ctx.fillStyle = mix(leaf, '#D8E890', 0.3);
    for (let k = 0; k < 60; k++) { const a = Math.PI * (0.9 + rnd() * 1.0), rr = R * (0.85 + rnd() * 0.25); const px = cx + Math.cos(a) * rr * 1.15, py = cy + Math.sin(a) * rr * 0.8; ctx.beginPath(); ctx.ellipse(px, py, R * 0.035, R * 0.022, rnd() * 3, 0, TAU); ctx.fill(); }
    ctx.restore();
    return { crown: [cx, cy], R };
  }
  /* savanna grass: tufts with seed heads, drawn along a ground line */
  function grassTufts(ctx, x0, x1, y, h, o) {
    o = o || {};
    let st = (o.seed || 1) * 7919 + 13; const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
    const n = Math.round((x1 - x0) / Math.max(3, h * 0.12));
    for (let k = 0; k < n; k++) {
      const x = x0 + rnd() * (x1 - x0), hh = h * (0.5 + rnd() * 0.6), lean = (rnd() - 0.4) * 0.5;
      ctx.strokeStyle = mix(o.colour || '#B8A050', '#5A6A2A', rnd() * 0.5); ctx.lineWidth = Math.max(0.6, h * 0.015);
      for (let b = 0; b < 4; b++) { const l = lean + (b - 1.5) * 0.18; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l * hh * 0.4, y - hh * 0.6, x + l * hh, y - hh); ctx.stroke(); }
      if (rnd() < 0.35) { ctx.fillStyle = '#D8C080'; ctx.beginPath(); ctx.ellipse(x + lean * hh, y - hh - 4, 1.6, 5, lean, 0, TAU); ctx.fill(); }
    }
  }
  /* a widowbird's nest: a ball of woven grass slung between stems, its entrance at the side */
  function wovenNest(ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    RX.body(ctx, c => c.ellipse(x, y, s * 0.42, s * 0.5, 0.15, 0, TAU), { fill: '#A89A5A', r: s * 0.45, cx: x, cy: y, stipple: 1, rim: 0.4, ao: 0.5, contour: 0.8 });
    ctx.strokeStyle = 'rgba(80,70,30,.6)'; ctx.lineWidth = Math.max(0.5, s * 0.03);
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.5 * (0.2 + k * 0.1), 0.15 + k * 0.3, 0.2, 2.8); ctx.stroke(); }
    ctx.fillStyle = '#2A2414'; ctx.beginPath(); ctx.ellipse(x + s * 0.18 * (o.facing || 1), y - s * 0.12, s * 0.1, s * 0.13, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- the lily in 3D, for dissection ----------------
     at: the receptacle; s: scale (m). o.open (0..1 how far the tepals are pulled away), o.stamens (bool
     still attached), o.cut (show the ovary sliced), o.pollen 0..1 on the stigma, o.colour.
     Six tepals (three petals, three sepals alike), six stamens, one pistil of three fused carpels. */
  function lily3D(F, at, s, o) {
    o = o || {};
    const col = o.colour || '#F2A23A', out = {}, ctx = F.ctx, cam = F.cam;
    const P = (x, y, z) => [at[0] + x * s, at[1] + y * s, at[2] + z * s];
    // the stem and receptacle
    R3.cylinder(F, P(0, 0, -1.6), P(0, 0, 0), 0.06 * s, '#4C8A34', { segments: 12, shadow: false });
    // tepals: each a curved blade, base at the receptacle, recurved at the tip, spotted
    const open = o.open || 0;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU + (k % 2 ? 0.08 : 0), ca = Math.cos(a), sa = Math.sin(a);
      const pull = open * (1.6 + 0.4 * (k % 2)), lay = open;
      const pts = [], N = 9;
      for (let i = 0; i <= N; i++) {
        const t = i / N, r = 0.08 + t * 1.15, z = 0.1 + t * 0.95 - Math.pow(t, 3) * 0.75 * (1 - lay * 0.6);
        pts.push([r, z, (0.12 + Math.sin(t * Math.PI) * 0.26) * (k % 2 ? 0.9 : 1)]);
      }
      const W = (r, z, side) => { const rr = r + pull, zz = z * (1 - lay) + (-1.55 + 0.02 * r) * lay; return P(ca * rr - sa * side, sa * rr + ca * side, zz); };
      for (let i = 0; i < N; i++) {
        const [r0, z0, w0] = pts[i], [r1, z1, w1] = pts[i + 1];
        const q = [W(r0, z0, -w0), W(r1, z1, -w1), W(r1, z1, w1), W(r0, z0, w0)];
        const c = q.reduce((u, p) => [u[0] + p[0] / 4, u[1] + p[1] / 4, u[2] + p[2] / 4], [0, 0, 0]);
        const n = R3.norm(R3.cross(R3.sub(q[1], q[0]), R3.sub(q[3], q[0])));
        const shade = F.shade(mix(col, '#FFF4D8', 0.25 * (1 - i / N)), n[2] < 0 ? R3.scale(n, -1) : n, { ambient: 0.5 });
        F.push(c, () => {
          const Q = q.map(p => cam.project(p)); if (Q.some(v => !v.ok)) return;
          ctx.fillStyle = shade; ctx.beginPath(); Q.forEach((v, j) => j ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rgba(mix(col, '#05080F', 0.4), 0.35); ctx.lineWidth = 0.6; ctx.stroke();
          if (i > 1 && i < 6 && (i + k) % 2 === 0) { const m = cam.project(c); ctx.fillStyle = '#6A1A12'; ctx.beginPath(); ctx.arc(m.x, m.y, Math.max(0.8, 0.02 * s * m.s), 0, TAU); ctx.fill(); }
        });
      }
      if (k === 0) out.tepal = W(1.0, pts[7][1], 0);
    }
    // stamens: a filament rising and bending out, a versatile anther at its tip, rusty with pollen
    if (o.stamens !== false) {
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU + 0.5, ca = Math.cos(a), sa = Math.sin(a), lay = o.layStamens || 0;
        const tip = lay ? P(ca * (2.3 + k * 0.05), sa * (2.3 + k * 0.05), -1.55) : P(ca * 0.55, sa * 0.55, 1.15);
        const mid = lay ? P(ca * 1.7, sa * 1.7, -1.55) : P(ca * 0.25, sa * 0.25, 0.7);
        R3.tube(F, [P(ca * 0.06, sa * 0.06, 0.1), mid, tip], 0.018 * s, '#E8E0B0', { segments: 6, round: false });
        R3.cylinder(F, R3.add(tip, [-sa * 0.09 * s, ca * 0.09 * s, 0]), R3.add(tip, [sa * 0.09 * s, -ca * 0.09 * s, 0]), 0.04 * s, '#9A3A12', { segments: 10, shadow: false });
        if (k === 0) out.anther = tip;
      }
    }
    // the pistil: ovary (three fused carpels), style, three-lobed stigma
    const ovTop = P(0, 0, 0.45);
    if (o.cut) {
      // the ovary sliced across: three chambers, two rows of ovules in each
      R3.cylinder(F, P(0, 0, 0.0), P(0, 0, 0.22), 0.16 * s, '#6AAA44', { segments: 18, shadow: false });
      const cc = P(0, 0, 0.23);
      F.push(cc, () => {
        const q = cam.project(cc), e = cam.project(P(0.16, 0, 0.23)), f2 = cam.project(P(0, 0.16, 0.23)); if (!q.ok || !e.ok || !f2.ok) return;
        const rx = Math.hypot(e.x - q.x, e.y - q.y), ry = Math.max(2, Math.hypot(f2.x - q.x, f2.y - q.y));
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, ry / rx);
        ctx.fillStyle = '#B8E08A'; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU - Math.PI / 2; ctx.fillStyle = '#5A8A34'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rx * 0.5, Math.sin(a) * rx * 0.5, rx * 0.36, rx * 0.24, a, 0, TAU); ctx.fill();
          for (let j = -1; j <= 1; j += 2) { ctx.fillStyle = '#F4F0D8'; ctx.beginPath(); ctx.arc(Math.cos(a) * rx * 0.5 + Math.cos(a + Math.PI / 2) * j * rx * 0.1, Math.sin(a) * rx * 0.5 + Math.sin(a + Math.PI / 2) * j * rx * 0.1, rx * 0.09, 0, TAU); ctx.fill(); } }
        ctx.restore();
      }, -0.002);
      out.ovary = cc;
    } else {
      R3.cylinder(F, P(0, 0, 0.0), ovTop, 0.13 * s, '#6AAA44', { segments: 18, shadow: false });
      R3.tube(F, [ovTop, P(0.05, 0, 1.0), P(0.12, 0, 1.4)], 0.035 * s, '#D8E4A0', { segments: 8 });
      R3.sphere(F, P(0.12, 0, 1.43), 0.08 * s, o.pollen > 0.05 ? mix('#7A9A3A', '#B84A1A', clamp(o.pollen, 0, 1)) : '#7A9A3A', { shadow: false });
      out.stigma = P(0.12, 0, 1.43); out.ovary = P(0, 0, 0.22); out.style = P(0.05, 0, 1.0);
    }
    return out;
  }
  /* a grass floret, wind-pollinated: no petals; glumes; three anthers dangling on long filaments; two feathery stigmas */
  function grass3D(F, at, s, o) {
    o = o || {};
    const P = (x, y, z) => [at[0] + x * s, at[1] + y * s, at[2] + z * s], out = {};
    R3.tube(F, [P(0, 0, -1.6), P(0.02, 0, -0.4), P(0, 0, 0)], 0.035 * s, '#7AA040', { segments: 8 });
    // the glumes and lemma: two green, keeled scales
    [-1, 1].forEach(sd => R3.tube(F, [P(0, 0, 0), P(sd * 0.12, 0, 0.35), P(sd * 0.05, 0, 0.75)], 0.07 * s, '#8EB850', { segments: 10 }));
    // three anthers hanging out on long, limp filaments — shaken by the wind
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + 0.4, sw = Math.sin((o.t || 0) * 3 + k) * 0.12;
      const top = P(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.55), end = P(Math.cos(a) * 0.45 + sw, Math.sin(a) * 0.35, -0.2);
      R3.tube(F, [top, P(Math.cos(a) * 0.3, Math.sin(a) * 0.22, 0.45), end], 0.012 * s, '#F0E8C0', { segments: 5, round: false });
      R3.cylinder(F, R3.add(end, [0, 0, 0.11 * s]), R3.add(end, [0, 0, -0.11 * s]), 0.03 * s, '#E8C860', { segments: 8, shadow: false });
      if (!k) out.anther = end;
    }
    // two stigmas like bottle brushes, out the sides to catch the air
    [-1, 1].forEach(sd => {
      const pts = [P(0, 0, 0.5), P(sd * 0.2, 0.05, 0.85), P(sd * 0.32, 0.08, 1.15)];
      R3.tube(F, pts, 0.012 * s, '#E8E0F0', { segments: 5, round: false });
      const ctx = F.ctx, cam = F.cam;
      F.push(pts[2], () => { ctx.strokeStyle = 'rgba(240,235,250,.85)'; ctx.lineWidth = 0.8; for (let i = 0; i < 18; i++) { const t = 0.3 + i / 26, b = [pts[1][0] + (pts[2][0] - pts[1][0]) * t, pts[1][1] + (pts[2][1] - pts[1][1]) * t, pts[1][2] + (pts[2][2] - pts[1][2]) * t], q = cam.project(b), q2 = cam.project([b[0] + (i % 2 ? 1 : -1) * 0.06 * s, b[1] + 0.02 * s, b[2] + 0.04 * s]); if (!q.ok || !q2.ok) continue; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); } }, -0.01);
      if (sd > 0) out.stigma = pts[2];
    });
    return out;
  }
  /* pollen grains under the microscope: x, y centre, d diameter px. kind 'lily' (large, grooved, sticky),
     'sun' (spiny), 'grass' (smooth sphere, one pore), 'pine' (body with two air sacs), 'rag' (small, short spines) */
  function pollenGrain(ctx, x, y, d, kind) {
    ctx.save();
    if (kind === 'pine') {
      [-1, 1].forEach(sd => { const g = ctx.createRadialGradient(x + sd * d * 0.42, y - d * 0.05, d * 0.05, x + sd * d * 0.42, y, d * 0.38); g.addColorStop(0, 'rgba(250,240,200,.55)'); g.addColorStop(1, 'rgba(200,170,110,.85)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + sd * d * 0.42, y + d * 0.05, d * 0.36, d * 0.3, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(140,110,60,.6)'; ctx.lineWidth = 0.6; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x + sd * d * 0.42 + (k % 3 - 1) * d * 0.1, y + (Math.floor(k / 3) - 1) * d * 0.09, d * 0.03, 0, TAU); ctx.stroke(); } });
      RX.blob(ctx, x, y - d * 0.05, d * 0.32, d * 0.26, { fill: '#D8B060', r: d * 0.3, contour: 0.8 });
    } else {
      const base = kind === 'lily' ? '#E89A3A' : kind === 'sun' ? '#F0C030' : kind === 'rag' ? '#E8D070' : '#E8D8A0';
      const rx = kind === 'lily' ? d * 0.6 : d * 0.5, ry = kind === 'lily' ? d * 0.36 : d * 0.5;
      if (kind === 'sun' || kind === 'rag') { ctx.fillStyle = mix(base, '#7A5A10', 0.3); const n = kind === 'sun' ? 22 : 30; for (let k = 0; k < n; k++) { const a = k / n * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a - 0.08) * rx * 0.92, y + Math.sin(a - 0.08) * ry * 0.92); ctx.lineTo(x + Math.cos(a) * rx * (kind === 'sun' ? 1.32 : 1.15), y + Math.sin(a) * ry * (kind === 'sun' ? 1.32 : 1.15)); ctx.lineTo(x + Math.cos(a + 0.08) * rx * 0.92, y + Math.sin(a + 0.08) * ry * 0.92); ctx.fill(); } }
      RX.blob(ctx, x, y, rx, ry, { fill: base, r: rx, stipple: kind === 'lily' ? 1 : 0.4, contour: 0.8 });
      if (kind === 'lily') { ctx.strokeStyle = 'rgba(120,60,10,.5)'; ctx.lineWidth = 0.7; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(x, y, rx * 0.95, ry * Math.abs(k) / 3.5, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = 'rgba(90,40,10,.45)'; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.7, ry * 0.12, 0, 0, TAU); ctx.fill(); }
      if (kind === 'grass') { ctx.fillStyle = 'rgba(120,100,60,.7)'; ctx.beginPath(); ctx.arc(x + rx * 0.35, y - ry * 0.3, d * 0.06, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(230,220,180,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x + rx * 0.35, y - ry * 0.3, d * 0.1, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  }

  /* ---------------- a rapid-cycling brassica (Wisconsin Fast Plant) ----------------
     x, y: soil surface; hPx: stem height px; o.leaves (number of true leaves), o.leafS (leaf size px),
     o.green (0 pale/yellowed … 1 healthy), o.purple (anthocyanin in the stem 0..1), o.flowers (0..1),
     o.wilt (0..1), o.thin (0..1 spindly), o.seed (shape variety) */
  function brassica(ctx, x, y, hPx, o) {
    o = o || {};
    const nL = Math.max(2, Math.round(o.leaves || 4)), ls = o.leafS || hPx * 0.3, wilt = o.wilt || 0, sd = o.seed || 1;
    const leafCol = mix(mix('#4E8A3C', '#8FB04A', 0.25), '#C8C060', 1 - (o.green == null ? 1 : o.green)), stemCol = mix('#6A9A44', '#7A3A6A', o.purple || 0);
    const sway = Math.sin(sd * 2.3) * 0.06;
    const stemPt = t => [x + Math.sin(t * 2.2 + sd) * hPx * 0.03 + sway * t * hPx, y - t * hPx * (1 - wilt * 0.25 * t)];
    // the cotyledons, heart-shaped, at the base
    [-1, 1].forEach(s => { ctx.fillStyle = mix(leafCol, '#A8C060', 0.2); ctx.beginPath(); ctx.ellipse(x + s * ls * 0.32, y - hPx * 0.06, ls * 0.26, ls * 0.15, s * 0.3, 0, TAU); ctx.fill(); });
    // the stem: lit tube, thinner when the plant is spindly
    const pts = []; for (let i = 0; i <= 12; i++) pts.push(stemPt(i / 12));
    RX.tube(ctx, pts, Math.max(0.8, hPx * 0.022 * (1 - 0.45 * (o.thin || 0))), stemCol, {});
    // true leaves, alternate up the stem, each a lobed blade on a petiole, drooping when wilted
    for (let k = 0; k < nL; k++) {
      const t = 0.12 + k / nL * 0.7, [sx, sy] = stemPt(t), side = k % 2 ? 1 : -1, size = ls * (1 - k / nL * 0.45);
      const ang = side * (0.7 + wilt * 0.8) - (side > 0 ? 0 : Math.PI) + (side > 0 ? -0.5 : 0.5) * (1 - wilt);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(side > 0 ? -0.55 + wilt * 1.1 : Math.PI + 0.55 - wilt * 1.1);
      ctx.strokeStyle = stemCol; ctx.lineWidth = Math.max(0.6, size * 0.04); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 0.35, 0); ctx.stroke();
      const lg = ctx.createLinearGradient(size * 0.3, -size * 0.3, size * 0.9, size * 0.3); lg.addColorStop(0, mix(leafCol, '#E0F0B0', 0.25)); lg.addColorStop(1, mix(leafCol, '#05080F', 0.2));
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(size * 0.32, 0);
      // a lobed margin
      for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI, r = size * (0.36 + 0.04 * Math.sin(i * 2.6)); ctx.lineTo(size * 0.68 + Math.sin(a + Math.PI / 2) * r * 0.95, Math.cos(a + Math.PI / 2) * -r * 0.62); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(mix(leafCol, '#E8F4C8', 0.5), 0.7); ctx.lineWidth = Math.max(0.4, size * 0.02); ctx.beginPath(); ctx.moveTo(size * 0.32, 0); ctx.lineTo(size * 1.0, 0); ctx.stroke();
      for (let v = 1; v <= 3; v++) { ctx.beginPath(); ctx.moveTo(size * (0.35 + v * 0.15), 0); ctx.lineTo(size * (0.45 + v * 0.15), -size * 0.18); ctx.moveTo(size * (0.35 + v * 0.15), 0); ctx.lineTo(size * (0.45 + v * 0.15), size * 0.18); ctx.stroke(); }
      ctx.restore();
      void ang;
    }
    // the raceme: buds, then four-petalled yellow flowers
    const fl = o.flowers || 0;
    if (fl > 0.02) {
      const [tx, ty] = stemPt(1);
      const n = Math.round(3 + fl * 8);
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (k - n / 2) * 0.35, rr = hPx * 0.05 * (1 + k % 3 * 0.3), fx = tx + Math.cos(a) * rr, fy = ty + Math.sin(a) * rr - k * hPx * 0.01;
        ctx.strokeStyle = stemCol; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(fx, fy); ctx.stroke();
        if (k < n * fl) { const ps = Math.max(1.5, hPx * 0.025); for (let q = 0; q < 4; q++) { const b = q / 4 * TAU + k; ctx.fillStyle = '#F6D21E'; ctx.beginPath(); ctx.ellipse(fx + Math.cos(b) * ps * 0.7, fy + Math.sin(b) * ps * 0.7, ps * 0.62, ps * 0.4, b, 0, TAU); ctx.fill(); } ctx.fillStyle = '#C89A10'; ctx.beginPath(); ctx.arc(fx, fy, ps * 0.3, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = '#9AB848'; ctx.beginPath(); ctx.ellipse(fx, fy, hPx * 0.012, hPx * 0.018, 0, 0, TAU); ctx.fill(); }
      }
    }
  }
  /* a pot of soil, side view: x, y the rim centre, w the rim width */
  function pot(ctx, x, y, w, o) {
    o = o || {};
    const h = w * 0.85, bw = w * 0.72;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#5A3A28'); g.addColorStop(0.35, o.colour || '#B8643A'); g.addColorStop(1, '#4A2A1A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + bw / 2, y + h); ctx.lineTo(x - bw / 2, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(o.colour || '#B8643A', '#FFFFFF', 0.12); ctx.fillRect(x - w / 2 - 2, y - 3, w + 4, w * 0.14);
    ctx.fillStyle = o.soil || '#3A2A1E'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.47, w * 0.08, 0, 0, TAU); ctx.fill();
    if (o.label) { ctx.fillStyle = '#F4F0E4'; ctx.fillRect(x + w * 0.18, y - w * 0.32, w * 0.14, w * 0.4); ctx.font = '700 ' + Math.max(7, w * 0.11) + 'px "IBM Plex Mono",monospace'; ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.fillText(o.label, x + w * 0.25, y - w * 0.18); }
  }
  /* a Himalayan rabbit, side view: x, y the body centre, s the body length px; o.points: for each region
     [ears, nose, feet, tail, back, patch] the share of dark (black) fur 0..1; o.shaved patch outline */
  function rabbit(ctx, x, y, s, o) {
    o = o || {};
    const P = o.points || {}, white = '#F2F0EA', dark = '#1C1A1A', pig = k => mix(white, dark, clamp(P[k] || 0, 0, 1));
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    // hind leg and foot
    RX.body(ctx, c => c.ellipse(-26, 16, 22, 18, -0.2, 0, TAU), { fill: pig('back'), r: 20, cx: -26, cy: 16, stipple: 0.6, rim: 0.5, ao: 0.4, contour: 0.8 });
    RX.body(ctx, c => c.ellipse(-24, 34, 22, 6, 0, 0, TAU), { fill: pig('feet'), r: 12, cx: -24, cy: 34, stipple: 0.5, rim: 0.3, ao: 0.3, contour: 0.8 });
    // the body
    RX.body(ctx, c => { c.moveTo(-46, 10); c.bezierCurveTo(-48, -22, -10, -30, 18, -18); c.bezierCurveTo(34, -10, 34, 22, 14, 28); c.bezierCurveTo(-10, 34, -42, 32, -46, 10); c.closePath(); }, { fill: pig('back'), r: 34, cx: -8, cy: 2, stipple: 0.7, rim: 0.5, ao: 0.5, contour: 1 });
    // the shaved patch on the back, where an ice pack was strapped
    if (o.patch) { ctx.fillStyle = pig('patch'); ctx.beginPath(); ctx.ellipse(-12, -14, 13, 8, -0.1, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,120,130,.5)'; ctx.setLineDash([2, 2]); ctx.lineWidth = 0.8; ctx.stroke(); ctx.setLineDash([]); }
    // fur texture
    ctx.strokeStyle = 'rgba(160,155,150,.35)'; ctx.lineWidth = 0.6;
    for (let k = 0; k < 40; k++) { const a = k * 2.39, rr = 6 + (k % 7) * 4; ctx.beginPath(); ctx.moveTo(-8 + Math.cos(a) * rr, Math.sin(a) * rr * 0.6); ctx.lineTo(-10 + Math.cos(a) * rr, Math.sin(a) * rr * 0.6 + 2); ctx.stroke(); }
    // fore leg and paw
    RX.body(ctx, c => c.ellipse(16, 26, 6, 10, 0.1, 0, TAU), { fill: pig('back'), r: 8, cx: 16, cy: 26, rim: 0.3, ao: 0.3, contour: 0.7 });
    RX.body(ctx, c => c.ellipse(19, 35, 9, 4, 0, 0, TAU), { fill: pig('feet'), r: 8, cx: 19, cy: 35, rim: 0.3, ao: 0.3, contour: 0.7 });
    // the tail, a scut
    RX.body(ctx, c => c.arc(-48, -2, 8, 0, TAU), { fill: pig('tail'), r: 8, cx: -48, cy: -2, stipple: 0.8, rim: 0.4, ao: 0.3, contour: 0.7 });
    // the head
    RX.body(ctx, c => c.ellipse(32, -18, 17, 14, 0.25, 0, TAU), { fill: pig('back'), r: 16, cx: 32, cy: -18, stipple: 0.5, rim: 0.5, ao: 0.4, contour: 0.9 });
    RX.body(ctx, c => c.ellipse(46, -12, 7, 6, 0.2, 0, TAU), { fill: pig('nose'), r: 7, cx: 46, cy: -12, rim: 0.3, ao: 0.3, contour: 0.7 });
    // the ears: long, upright, the inner ear pinker
    [[0, 22, -0.25], [1, 28, -0.05]].forEach(([i, ex, rot]) => {
      ctx.save(); ctx.translate(ex, -30); ctx.rotate(rot);
      RX.body(ctx, c => c.ellipse(0, -18, 6.5, 20, 0, 0, TAU), { fill: pig('ears'), r: 14, cx: 0, cy: -18, rim: 0.4, ao: 0.3, contour: 0.8 });
      if (i) { ctx.fillStyle = rgba(mix('#E8A8A8', pig('ears'), 0.6), 0.8); ctx.beginPath(); ctx.ellipse(0.5, -18, 3, 15, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    // the eye: pink-red, the iris unpigmented as in every Himalayan and albino
    ctx.fillStyle = o.eye || '#C83040'; ctx.beginPath(); ctx.arc(36, -22, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(37, -23.2, 1, 0, TAU); ctx.fill();
    // whiskers
    ctx.strokeStyle = 'rgba(230,230,230,.7)'; ctx.lineWidth = 0.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(48, -10); ctx.lineTo(62, -16 + k * 4); ctx.stroke(); }
    ctx.restore();
  }
  /* a hydrangea mophead: x, y the centre of the flower head, r its radius px; o.colour the sepal
     colour; o.leaves; florets of four sepals each */
  function hydrangea(ctx, x, y, r, o) {
    o = o || {};
    const col = o.colour || '#E07AA8';
    let st = (o.seed || 2) * 7919; const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
    // leaves below: broad, serrated, glossy
    for (let k = 0; k < 6; k++) {
      const a = Math.PI * (0.15 + k * 0.14), lx = x + Math.cos(a) * r * 1.0 * (k % 2 ? 1 : -1), ly = y + r * 0.7 + Math.sin(a) * r * 0.3, L_ = r * 0.9;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate((k % 2 ? 1 : -1) * (0.4 + k * 0.08));
      const g = ctx.createLinearGradient(-L_ / 2, 0, L_ / 2, 0); g.addColorStop(0, '#2E6A2A'); g.addColorStop(1, '#4E9A3E');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L_ / 2, 0);
      for (let i = 0; i <= 16; i++) { const t = i / 16, xx = -L_ / 2 + t * L_, w = Math.sin(t * Math.PI) * L_ * 0.32 * (1 + (i % 2) * 0.06); ctx.lineTo(xx, -w); }
      for (let i = 16; i >= 0; i--) { const t = i / 16, xx = -L_ / 2 + t * L_, w = Math.sin(t * Math.PI) * L_ * 0.32 * (1 + (i % 2) * 0.06); ctx.lineTo(xx, w); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,230,180,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-L_ / 2, 0); ctx.lineTo(L_ / 2, 0); ctx.stroke();
      ctx.restore();
    }
    // the head: a dome of florets, darker inside, lit on top
    RX.body(ctx, c => c.arc(x, y, r, 0, TAU), { fill: mix(col, '#05080F', 0.3), r, cx: x, cy: y, rim: 0.2, ao: 0.5, contour: 0 });
    for (let k = 0; k < 70; k++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * r * 0.92, fx = x + Math.cos(a) * rr, fy = y + Math.sin(a) * rr, fs = r * (0.11 + rnd() * 0.04);
      const lit = clamp(0.6 - (fy - y) / r * 0.4 - (fx - x) / r * 0.2, 0, 1), c2 = mix(mix(col, '#FFFFFF', 0.25 * lit), '#05080F', 0.25 * (1 - lit));
      for (let q = 0; q < 4; q++) { const b = q / 4 * TAU + a; ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(fx + Math.cos(b) * fs * 0.55, fy + Math.sin(b) * fs * 0.55, fs * 0.52, fs * 0.42, b, 0, TAU); ctx.fill(); }
      ctx.fillStyle = mix(col, '#F8F0C0', 0.5); ctx.beginPath(); ctx.arc(fx, fy, fs * 0.12, 0, TAU); ctx.fill();
    }
  }
  /* a growth chamber: a white steel cabinet with an LED panel overhead, a glass door, and a shelf.
     c: the centre of its floor; w, d, h its inside size (m); o.light 0..1 how bright; o.tint the LED colour */
  function chamber(F, c, w, d, h, o) {
    o = o || {};
    const ctx = F.ctx, cam = F.cam, steel = '#DDE2E6', t = 0.025;
    // walls: back, sides, floor, roof (the near side is a glass door)
    R3.box(F, [c[0], c[1] + d / 2 + t / 2, c[2] + h / 2], [w + 2 * t, t, h + 2 * t], steel, { shadow: false, ambient: 0.55 });
    R3.box(F, [c[0] - w / 2 - t / 2, c[1], c[2] + h / 2], [t, d, h + 2 * t], steel, { shadow: false, ambient: 0.5 });
    R3.box(F, [c[0] + w / 2 + t / 2, c[1], c[2] + h / 2], [t, d, h + 2 * t], steel, { shadow: false, ambient: 0.5 });
    R3.box(F, [c[0], c[1], c[2] - t / 2], [w + 2 * t, d + 2 * t, t], '#AEB6BE', { shadow: false, ambient: 0.5 });
    R3.box(F, [c[0], c[1], c[2] + h + t / 2], [w + 2 * t, d + 2 * t, t], steel, { shadow: false, ambient: 0.5 });
    // the lit interior: the back wall washed with the LEDs' light
    const L_ = clamp(o.light == null ? 0.6 : o.light, 0, 1), tint = o.tint || '#FFF4E0';
    F.push([c[0], c[1] + d / 2 - 0.002, c[2] + h / 2], () => {
      const q = [[c[0] - w / 2, c[1] + d / 2, c[2]], [c[0] + w / 2, c[1] + d / 2, c[2]], [c[0] + w / 2, c[1] + d / 2, c[2] + h], [c[0] - w / 2, c[1] + d / 2, c[2] + h]].map(p => cam.project(p)); if (q.some(v => !v.ok)) return;
      const g = ctx.createLinearGradient(0, q[3].y, 0, q[0].y); g.addColorStop(0, rgba(mix('#2A3038', tint, L_), 1)); g.addColorStop(1, rgba(mix('#1A1E24', tint, L_ * 0.55), 1));
      ctx.fillStyle = g; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
    });
    // the LED panel: a grid of emitters, glowing as bright as it is set
    F.push([c[0], c[1], c[2] + h - 0.004], () => {
      const q = [[c[0] - w * 0.45, c[1] - d * 0.4, c[2] + h - 0.003], [c[0] + w * 0.45, c[1] - d * 0.4, c[2] + h - 0.003], [c[0] + w * 0.45, c[1] + d * 0.4, c[2] + h - 0.003], [c[0] - w * 0.45, c[1] + d * 0.4, c[2] + h - 0.003]].map(p => cam.project(p)); if (q.some(v => !v.ok)) return;
      ctx.fillStyle = rgba(mix('#303840', tint, L_), 1); ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(mix('#606870', '#FFFFFF', L_), 0.9);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const u = (i + 0.5) / 8, v = (j + 0.5) / 3; const px = q[0].x + (q[1].x - q[0].x) * u + (q[3].x - q[0].x) * v, py = q[0].y + (q[1].y - q[0].y) * u + (q[3].y - q[0].y) * v; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, TAU); ctx.fill(); }
    }, -0.01);
    // the door: a glass pane in a steel frame, with a handle and a control panel beside
    const P0 = [c[0] - w / 2, c[1] - d / 2 - t, c[2]], P1 = [c[0] + w / 2, c[1] - d / 2 - t, c[2]], P3 = [c[0] - w / 2, c[1] - d / 2 - t, c[2] + h];
    window.G6E.glassPane(F, P0, P1, P3, { tint: 'rgba(200,225,235,.06)', gloss: 0.12, edge: 'rgba(200,210,220,.9)', edgeW: 2.5, bias: -0.004 });
    R3.box(F, [c[0] + w / 2 - 0.03, c[1] - d / 2 - t - 0.012, c[2] + h * 0.55], [0.012, 0.012, h * 0.3], '#8A939E', { shadow: false, bias: -0.006 });
    return { top: [c[0], c[1] - d / 2, c[2] + h + t], door: [c[0], c[1] - d / 2 - t, c[2] + h * 0.5] };
  }

  window.G6L = { birdSide, chick, caterpillar, nestBox, bee, meadowFlower, samara, dandelionSeed, acorn, cherry, tree, grassTufts, wovenNest, lily3D, grass3D, pollenGrain, PLUM, brassica, pot, rabbit, hydrangea, chamber };
})();
