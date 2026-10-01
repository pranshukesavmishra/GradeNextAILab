/* ============================================================
   EARTH — the globe every Earth-system lab draws through.

   A ray-traced planet on real data: each pixel in the disc's box is a
   ray from the camera, intersected with the sphere, turned into latitude
   and longitude, and sampled from NASA's Blue Marble (bilinear). Oceans
   are known from the Natural Earth land mask, not guessed from colour,
   so the sun's glint falls on water only. Lighting is a soft terminator,
   a thin scattering rim of air, and limb darkening.

   The texture lives in data-earth.js and is fetched the first time a lab
   asks for it (EARTH.load), so labs without a globe never pay for it.

   Frame: Z is up (the rotation axis), X points to longitude 0 at spin 0.
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const E = { tex: null, loading: false, waiters: [], failed: false };

  /* ---------------- data ---------------- */
  function load(cb) {
    if (E.tex) { if (cb) cb(); return true; }
    if (cb) E.waiters.push(cb);
    if (E.loading) return false;
    E.loading = true;
    const go = () => decode(window.EARTHDATA);
    if (window.EARTHDATA) go();
    else {
      const s = document.createElement('script');
      s.src = 'data-earth.js';
      s.onload = go;
      s.onerror = () => { E.loading = false; E.failed = true; };
      (document.head || document.body).appendChild(s);
    }
    return false;
  }
  function decode(D) {
    if (!D) { E.failed = true; return; }
    const imgs = {};
    let n = 0;
    ['day', 'land'].forEach(k => {
      const im = new Image();
      im.onload = () => { imgs[k] = im; if (++n === 2) finish(D, imgs); };
      im.onerror = () => { E.failed = true; };
      im.src = D[k];
    });
  }
  function finish(D, imgs) {
    const W = D.width, H = D.height;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(imgs.day, 0, 0, W, H);
    const dd = x.getImageData(0, 0, W, H).data;
    x.clearRect(0, 0, W, H);
    x.drawImage(imgs.land, 0, 0, W, H);
    const ld = x.getImageData(0, 0, W, H).data;
    const rgb = new Uint8Array(W * H * 3), land = new Uint8Array(W * H);
    for (let i = 0, j = 0; i < W * H; i++, j += 4) {
      rgb[i * 3] = dd[j]; rgb[i * 3 + 1] = dd[j + 1]; rgb[i * 3 + 2] = dd[j + 2];
      land[i] = ld[j] > 127 ? 1 : 0;
    }
    E.tex = { W, H, rgb, land };
    E.loading = false;
    E.waiters.splice(0).forEach(f => { try { f(); } catch (e) { /* a lab's own callback */ } });
  }

  /* ---------------- lookups on the real map ---------------- */
  function texel(lat, lon) {
    const T = E.tex;
    const i = clamp(Math.floor((lon + 180) / 360 * T.W), 0, T.W - 1);
    const j = clamp(Math.floor((90 - lat) / 180 * T.H), 0, T.H - 1);
    return j * T.W + i;
  }
  function landAt(lat, lon) { return E.tex ? E.tex.land[texel(lat, ((lon + 540) % 360) - 180)] === 1 : null; }
  function colourAt(lat, lon) {
    if (!E.tex) return null;
    const k = texel(lat, ((lon + 540) % 360) - 180) * 3, t = E.tex.rgb;
    return [t[k], t[k + 1], t[k + 2]];
  }
  /* area-weighted land fraction of a latitude band — the mask, measured */
  function landFraction(lat0, lat1) {
    const T = E.tex;
    if (!T) return null;
    let lw = 0, w = 0;
    for (let j = 0; j < T.H; j++) {
      const lat = 90 - (j + 0.5) * 180 / T.H;
      if (lat < Math.min(lat0, lat1) || lat > Math.max(lat0, lat1)) continue;
      const cw = Math.cos(lat * Math.PI / 180);
      let row = 0;
      for (let i = 0; i < T.W; i++) row += T.land[j * T.W + i];
      lw += cw * row; w += cw * T.W;
    }
    return w ? lw / w : 0;
  }

  /* ---------------- the ray-traced globe ----------------
     cam: lab-core Camera (updated, viewport set). C: centre (world). R: radius.
     o.spin      rotation about Z in radians (longitude 0 faces +X at 0)
     o.sun       unit vector toward the Sun, world frame (default: over the
                 viewer's shoulder)
     o.ambient   light on the night side (default 0.05)
     o.overlay   (lat, lon) → [r, g, b, a] painted over the surface, a in 0..1:
                 a data layer (productivity, temperature) drawn ON the planet
     o.budget    pixel budget per frame (default 170k)
     o.cut       a cutaway: { n, e1, e2, face(u, v, out) }. The half of the ball on
                 the side n points to is taken away, and the flat face it leaves is
                 painted by face(): u, v are the face point along e1 and e2 in units
                 of R, and face writes an [r, g, b] into out. The kept half keeps
                 its real surface. n, e1, e2 are unit vectors, e1 and e2 in the cut.
     Returns { canvas, x, y, w, h, cx, cy, rp } in CSS pixels, or null.       */
  let RT = null;
  function trace(cam, C, R, o) {
    o = o || {};
    const T = E.tex;
    if (!T) return null;
    const q = cam.project(C);
    if (!q.ok) return null;
    const W = cam._w, H = cam._h;
    const rp = R * q.s * 1.14 + 3;
    const x0 = Math.max(0, Math.floor(q.x - rp)), x1 = Math.min(W, Math.ceil(q.x + rp));
    const y0 = Math.max(0, Math.floor(q.y - rp)), y1 = Math.min(H, Math.ceil(q.y + rp));
    if (x1 <= x0 || y1 <= y0) return null;
    const bw = x1 - x0, bh = y1 - y0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const res = Math.min(dpr, Math.sqrt((o.budget || 170000) / (bw * bh)));
    const nx = Math.max(1, Math.round(bw * res)), ny = Math.max(1, Math.round(bh * res));
    if (!RT) { RT = document.createElement('canvas'); RT.ctx = RT.getContext('2d'); }
    if (RT.width !== nx || RT.height !== ny) { RT.width = nx; RT.height = ny; RT.img = null; }
    if (!RT.img) RT.img = RT.ctx.createImageData(nx, ny);
    const px = RT.img.data;
    const TW = T.W, TH = T.H, rg = T.rgb, lm = T.land;
    const e = cam.eye, f = cam.f, r = cam.r, u = cam.u, K = cam._k, w2 = W / 2, h2 = H / 2;
    const ox = e[0] - C[0], oy = e[1] - C[1], oz = e[2] - C[2];
    const oo = ox * ox + oy * oy + oz * oz, cc = oo - R * R;
    const spin = o.spin || 0, cs = Math.cos(-spin), sn = Math.sin(-spin);
    let S = o.sun || [-0.45, -0.55, 0.70];
    const sl = Math.hypot(S[0], S[1], S[2]) || 1;
    const Lx = S[0] / sl, Ly = S[1] / sl, Lz = S[2] / sl;
    const amb = o.ambient == null ? 0.05 : o.ambient, ov = o.overlay || null;
    const pixW = 1 / (K * res);
    const cut = o.cut || null, fc = [0, 0, 0];
    let cnx = 0, cny = 0, cnz = 0, on = 0, faceK = 1, e1 = null, e2 = null;
    if (cut) {
      cnx = cut.n[0]; cny = cut.n[1]; cnz = cut.n[2]; e1 = cut.e1; e2 = cut.e2;
      on = ox * cnx + oy * cny + oz * cnz;
      faceK = 0.80 + 0.20 * clamp(cnx * Lx + cny * Ly + cnz * Lz, 0, 1);      // the face is a model's face: evenly lit
    }
    for (let j = 0; j < ny; j++) {
      const vy = (h2 - (y0 + (j + 0.5) / res)) / K;
      for (let i = 0; i < nx; i++) {
        const vx = (x0 + (i + 0.5) / res - w2) / K;
        let dx = f[0] + vx * r[0] + vy * u[0], dy = f[1] + vx * r[1] + vy * u[1], dz = f[2] + vx * r[2] + vy * u[2];
        const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        const b = ox * dx + oy * dy + oz * dz, disc = b * b - cc;
        const k4 = (j * nx + i) * 4;
        // antialiased limb from the ray's closest approach to the centre
        const tca = -b, D = Math.sqrt(Math.max(0, oo - tca * tca));
        const edge = pixW * Math.max(tca, 1e-6) * 1.2;
        let a = clamp((R - D) / edge + 0.5, 0, 1);
        // the air: a thin glow just outside the limb, brightest on the day side
        if (a <= 0) {
          const hgt = (D - R) / R;
          // (a cutaway has air only round the half that is kept)
          if (hgt < 0.045 && tca > 0 && (!cut || (ox + tca * dx) * cnx + (oy + tca * dy) * cny + (oz + tca * dz) * cnz <= 0)) {
            const nxw = (ox + tca * dx) / D, nyw = (oy + tca * dy) / D, nzw = (oz + tca * dz) / D;
            const day = clamp((nxw * Lx + nyw * Ly + nzw * Lz) + 0.25, 0, 1);
            const g = Math.pow(1 - hgt / 0.045, 2.2) * day;
            px[k4] = 90; px[k4 + 1] = 150; px[k4 + 2] = 255; px[k4 + 3] = 255 * g * 0.55;
          } else px[k4 + 3] = 0;
          continue;
        }
        let t = disc > 0 ? -b - Math.sqrt(disc) : tca;
        if (cut) {
          // the kept solid is the ball and the half-space n·p ≤ 0: enter it where the ray enters both
          const t1 = disc > 0 ? -b + Math.sqrt(disc) : tca, dn = dx * cnx + dy * cny + dz * cnz;
          let h0 = -Infinity, h1 = Infinity;
          if (Math.abs(dn) < 1e-12) { if (on > 0) h0 = Infinity; }
          else if (dn > 0) h1 = -on / dn; else h0 = -on / dn;
          const te = Math.max(t, h0), tx = Math.min(t1, h1);
          if (te > tx) { px[k4 + 3] = 0; continue; }                          // only the part taken away: see through
          if (te > t) {                                                        // the flat face
            const qx = ox + te * dx, qy = oy + te * dy, qz = oz + te * dz;
            cut.face((qx * e1[0] + qy * e1[1] + qz * e1[2]) / R, (qx * e2[0] + qy * e2[1] + qz * e2[2]) / R, fc);
            px[k4] = fc[0] * faceK; px[k4 + 1] = fc[1] * faceK; px[k4 + 2] = fc[2] * faceK; px[k4 + 3] = 255 * a;
            continue;
          }
        }
        const nxw = (ox + t * dx) / R, nyw = (oy + t * dy) / R, nzw = (oz + t * dz) / R;
        // body frame: undo the spin
        const bx = nxw * cs - nyw * sn, by = nxw * sn + nyw * cs;
        const lat = Math.asin(clamp(nzw, -1, 1)), lon = Math.atan2(by, bx);
        const fu = (lon + Math.PI) / TAU * TW - 0.5, fv = clamp((0.5 - lat / Math.PI) * TH - 0.5, 0, TH - 1.001);
        const i0 = Math.floor(fu), j0 = Math.floor(fv), au = fu - i0, av = fv - j0;
        const ia = ((i0 % TW) + TW) % TW, ib = (ia + 1) % TW, jb = Math.min(TH - 1, j0 + 1);
        const k00 = (j0 * TW + ia) * 3, k10 = (j0 * TW + ib) * 3, k01 = (jb * TW + ia) * 3, k11 = (jb * TW + ib) * 3;
        const w00 = (1 - au) * (1 - av), w10 = au * (1 - av), w01 = (1 - au) * av, w11 = au * av;
        let Rr = rg[k00] * w00 + rg[k10] * w10 + rg[k01] * w01 + rg[k11] * w11;
        let Gg = rg[k00 + 1] * w00 + rg[k10 + 1] * w10 + rg[k01 + 1] * w01 + rg[k11 + 1] * w11;
        let Bb = rg[k00 + 2] * w00 + rg[k10 + 2] * w10 + rg[k01 + 2] * w01 + rg[k11 + 2] * w11;
        if (ov) {
          const c = ov(lat * 180 / Math.PI, lon * 180 / Math.PI);
          if (c && c[3] > 0) { Rr += (c[0] - Rr) * c[3]; Gg += (c[1] - Gg) * c[3]; Bb += (c[2] - Bb) * c[3]; }
        }
        const ndl = nxw * Lx + nyw * Ly + nzw * Lz;
        // a soft terminator: the air scatters a little light past 90 degrees
        const dif = clamp(ndl * 1.15 + 0.06, 0, 1);
        const k = amb + (1 - amb) * dif;
        Rr *= k; Gg *= k; Bb *= k;
        // sun glint on water only — the mask says where water is
        const tk = Math.round(fv) * TW + ((Math.round(fu) % TW) + TW) % TW;
        if (!lm[tk] && dif > 0) {
          const hx = Lx - dx, hy = Ly - dy, hz = Lz - dz, hl = Math.hypot(hx, hy, hz);
          const sp = Math.pow(Math.max(0, (nxw * hx + nyw * hy + nzw * hz) / hl), 260) * dif;
          Rr += 125 * sp; Gg += 130 * sp; Bb += 120 * sp;
        }
        // the blue rim of air seen through at the limb
        const mu = Math.max(0, -(nxw * dx + nyw * dy + nzw * dz));
        const rim = Math.pow(1 - mu, 3) * (0.25 + 0.75 * Math.max(0, ndl + 0.2));
        Rr += 55 * rim; Gg += 110 * rim; Bb += 240 * rim;
        px[k4] = Rr; px[k4 + 1] = Gg; px[k4 + 2] = Bb; px[k4 + 3] = 255 * a;
      }
    }
    RT.ctx.putImageData(RT.img, 0, 0);
    return { canvas: RT, x: x0, y: y0, w: bw, h: bh, cx: q.x, cy: q.y, rp: R * q.s };
  }
  /* trace and paint in one call */
  function draw(ctx, cam, C, R, o) {
    const g = trace(cam, C, R, o);
    if (g) ctx.drawImage(g.canvas, g.x, g.y, g.w, g.h);
    return g;
  }

  window.EARTH = { load, ready: () => !!E.tex, failed: () => E.failed, trace, draw,
                   landAt, colourAt, landFraction };
})();
