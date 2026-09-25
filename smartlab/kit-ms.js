/* ============================================================
   KIT-MS — the overlay kit of the Grades 6–8 labs.
   What every middle-school stage and plot shares, so each lab keeps one
   implementation of it: the stage header with its readable band, cards,
   the card that folds into a chip on a phone, text fitted to a width,
   wrapped text, a status LED, the key band above a plot's frame, and time
   axes that never print two ticks with the same label.
   Nothing here draws science; it lays out what the lab computed.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const HDR = 58;                          // the header's height: cards start below it
  const NARROW = 640;                      // below this stage width a lab lays out for a phone

  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 3 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }
  function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
    const words = String(text).split(' '); let line = '', yy = y, n = 0;
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) {
        if (maxLines && n === maxLines - 1) { ctx.fillText(fitText(ctx, line + ' ' + w, maxW), x, yy); return yy; }
        ctx.fillText(line, x, yy); line = w; yy += lh; n++;
      } else line = t;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }
  function card(ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = o.fill || 'rgba(8,12,22,.80)'; ctx.strokeStyle = o.stroke || 'rgba(80,100,140,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function led(ctx, x, y, on, col) {
    ctx.save();
    ctx.fillStyle = on ? col : '#3A4254';
    if (on) { ctx.shadowColor = col; ctx.shadowBlur = 6; }
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  /* the stage header: a headline that says what is happening, two lines of numbers under it,
     on a dark band deep enough to read over the brightest scene */
  function header(g, line, sub1, sub2) {
    const ctx = g.ctx, th = g.theme;
    ctx.save();
    const hb = (sub2 ? 58 : 45) + 14;
    const hg = ctx.createLinearGradient(0, 0, 0, hb);
    hg.addColorStop(0, 'rgba(5,8,15,.86)'); hg.addColorStop((hb - 14) / hb, 'rgba(5,8,15,.70)'); hg.addColorStop(1, 'rgba(5,8,15,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, g.w, hb);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const narrow = g.w < NARROW, mw = g.w - 28;
    ctx.font = '700 ' + (narrow ? 14 : 17) + 'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
    ctx.fillStyle = th.text; ctx.fillText(fitText(ctx, line, mw), 14, 9);
    ctx.font = '500 ' + (narrow ? 9 : 10) + 'px "IBM Plex Mono",monospace'; ctx.fillStyle = th['text-2'];
    if (sub1) ctx.fillText(fitText(ctx, sub1, mw), 14, 31);
    if (sub2) { ctx.fillStyle = th['text-3']; ctx.fillText(fitText(ctx, sub2, mw), 14, 44); }
    ctx.restore();
  }
  /* on a wide stage a card sits where the lab puts it; on a phone it folds into a chip under the
     header, and a tap (the lab calls chipHit from onPointer) opens it full width.
     Returns where the card goes, or null while it is folded. */
  function cardSlot(g, S, title, wideW, wideAt) {
    if (g.w >= NARROW) { S._chip = null; return Object.assign({ x: 10, y: HDR + 4, w: wideW }, wideAt || {}); }
    const ctx = g.ctx, th = g.theme, x = 10, y = HDR + 2;
    ctx.save(); ctx.font = '600 10px "IBM Plex Mono",monospace';
    const label = (S.cardOpen ? '▾ ' : '▸ ') + title, w = Math.min(g.w - 20, ctx.measureText(label).width + 22), h = 24;
    card(ctx, x, y, w, h);
    ctx.fillStyle = th.accent; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, label, w - 20), x + 10, y + 12);
    ctx.restore();
    S._chip = { x0: x, y0: y, x1: x + w, y1: y + h };
    return S.cardOpen ? { x: 10, y: y + h + 4, w: g.w - 20 } : null;
  }
  function chipHit(S, x, y) {
    const C = S._chip;
    if (C && x >= C.x0 && x <= C.x1 && y >= C.y0 && y <= C.y1) { S.cardOpen = !S.cardOpen; return true; }
    return false;
  }

  /* a plot's key, set in rows in a band above its frame so it never sits on the data.
     plotKey lays the entries out for the canvas width first, so the plot can reserve K.t. */
  function plotKey(g, items, note) {
    const ctx = g.ctx;
    ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace';
    const nw = note ? ctx.measureText(note).width + 18 : 0, avail = g.w - 50 - 16;
    const rows = [[]]; let x = 0;
    items.forEach(it => {
      const w = 19 + ctx.measureText(it.label).width + 16;
      const lim = rows.length === 1 ? avail - nw : avail;
      if (x + w > lim && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      rows[rows.length - 1].push({ it, x }); x += w;
    });
    ctx.restore();
    const K = { t: 14 + rows.length * 14 };
    K.draw = function (P) {
      const th = g.theme;
      ctx.save(); ctx.font = '500 10px "IBM Plex Mono",monospace'; ctx.textBaseline = 'middle';
      rows.forEach((row, r) => row.forEach(({ it, x: dx }) => {
        const x0 = P.x0 + dx, y = 9 + r * 14;
        ctx.fillStyle = it.c; ctx.strokeStyle = it.c;
        if (it.box) { ctx.fillRect(x0, y - 4, 14, 8); if (it.edge) { ctx.strokeStyle = it.edge; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y - 3.5, 13, 7); } }
        else if (it.dot) { ctx.beginPath(); ctx.arc(x0 + 7, y, 4, 0, TAU); ctx.fill(); if (it.edge) { ctx.strokeStyle = it.edge; ctx.lineWidth = 1.5; ctx.stroke(); } }
        else { ctx.lineWidth = it.w || 2.5; ctx.setLineDash(it.dash || []); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 14, y); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = th['text-2']; ctx.textAlign = 'left'; ctx.fillText(it.label, x0 + 19, y);
      }));
      if (note) { ctx.fillStyle = th['text-3']; ctx.textAlign = 'right'; ctx.fillText(note, P.x1, 9); }
      ctx.restore();
    };
    return K;
  }
  /* a time axis in days: whole days when there are several, quarter days (as clock times, or
     hours when rel) when there is less than two — never two ticks with the same label */
  function dayAxis(x0, x1, rel) {
    const span = x1 - x0, step = span > 10 ? 2 : span >= 2 ? 1 : span >= 1 ? 0.25 : 0.125;
    const xticks = [];
    for (let v = Math.ceil(x0 / step - 1e-9) * step; v <= x1 + 1e-9; v += step) xticks.push(+v.toFixed(6));
    const xfmt = v => {
      const r = Math.round(v);
      if (Math.abs(v - r) < 1e-6) return String(r);
      const hh = Math.round((v - Math.floor(v)) * 24);
      return rel ? Math.round(v * 24) + ' h' : String(hh).padStart(2, '0') + ':00';
    };
    return { xticks, xfmt };
  }
  /* a time axis in seconds that switches to minutes when the run is long */
  function secAxis(x0, x1) {
    const span = x1 - x0;
    const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
    const step = steps.find(s => span / s <= 7) || 3600;
    const xticks = [];
    for (let v = Math.ceil(x0 / step - 1e-9) * step; v <= x1 + 1e-9; v += step) xticks.push(+v.toFixed(6));
    const mins = span > 240;
    return { xticks, xfmt: v => mins ? (v / 60).toFixed(v % 60 ? 1 : 0) : v.toFixed(0), unit: mins ? 'min' : 's' };
  }
  /* a clock reading for seconds: 1:23.4 or 12.3 s */
  const watch = s => s >= 60 ? Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0') : s.toFixed(1) + ' s';

  window.KITMS = { HDR, NARROW, fitText, wrapText, card, led, header, cardSlot, chipHit, plotKey, dayAxis, secAxis, watch };
})();
