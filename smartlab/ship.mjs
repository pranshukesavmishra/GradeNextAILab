/* ship.mjs — the fast ship check for one Grades 6–8 lab (docs/FAST_BUILD_PLAN.md §4).

   One command, three passes, one contact sheet to look at:
     1. NUMBERS  every problem: set its params, run, read `measure`, and compare it with the
                 bold answer in its `working` (within predict.tol, default 5 %). A problem whose
                 working has no bold number is listed for a human look.
     2. CONTROLS live.mjs <id> --presets (every control in every set-up and preset moves the
                 model), plus a mount of every set-up and preset with no page error and no
                 NaN / undefined / Infinity on the readouts or the equation.
     3. EYES     sheet-<id>-<k>.png (6 tiles a page): every set-up and every preset at 1500 px, and every set-up at
                 390 px, after each has run — open it and look at every tile as the founder would.

   node ship.mjs <labId> [--no-live]      exits 0 only when passes 1 and 2 are clean */
import { chromium } from 'playwright'; import fs from 'fs'; import { spawnSync } from 'child_process';
const args = process.argv.slice(2), id = args.find(a => !a.startsWith('-')), noLive = args.includes('--no-live');
if (!id) { console.log('usage: node ship.mjs <labId> [--no-live]'); process.exit(2); }
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const body = fs.readFileSync('index.html', 'utf8');
fs.writeFileSync('_preview.html', '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + body + '</body></html>');
let fails = 0; const fail = m => { fails++; console.log('FAIL     ' + m); };
const b = await chromium.launch({ executablePath: EXE });

async function open(width, height) {
  const p = await b.newPage({ viewport: { width, height } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/_preview.html?grade=6#' + id);
  await p.waitForFunction(i => window.__R && window.__R.def && window.__R.def.id === i, id, { timeout: 15000 }).catch(() => {});
  return { p, errs };
}
const { p, errs } = await open(1500, 1050);
const meta = await p.evaluate(i => {
  const def = (window.__REG || []).find(d => d.id === i); if (!def) return null;
  const su = (def.controls || []).flatMap(g => g.items || []).find(it => it.key === 'setup');
  return { name: def.name, setups: su ? su.options.map(o => ({ value: o.value, label: o.label })) : [{ value: null, label: '(single)' }],
           presets: (def.presets || []).map(x => x.name || x.label || ''), problems: (def.problems || []).length };
}, id);
if (!meta) { console.log('no lab called ' + id); await b.close(); process.exit(2); }
console.log(`ship ${id} — ${meta.name}: ${meta.setups.length} set-ups, ${meta.presets.length} presets, ${meta.problems} problems`);

/* ---------- 1. NUMBERS ---------- */
const nums = s => [...s.replace(/(\d),(\d{3})/g, '$1$2').replace(/−/g, '-').matchAll(/-?\d+(?:\.\d+)?(?:\s*[×x]\s*10\^?(-?\d+))?/g)]
  .map(m => { let v = parseFloat(m[0]); if (m[1]) v *= Math.pow(10, +m[1]); return v; });
const scale = s => /billion/i.test(s) ? 1e9 : /million/i.test(s) ? 1e6 : /thousand/i.test(s) ? 1e3 : 1;
for (let k = 0; k < meta.problems; k++) {
  const r = await p.evaluate(async ([i, k]) => {
    const R = window.__R, def = R.def, pr = def.problems[k];
    Object.keys(R.S.p).forEach(x => delete R.S.p[x]); Object.assign(R.S.p, def.params, pr.params || {});
    R.S.t = 0; if (def.setup) def.setup(R.S);
    await new Promise(r => setTimeout(r, 1400));
    let m; try { m = +pr.measure(R.S); } catch (e) { return { err: e.message }; }
    const bold = [...String(pr.working || '').matchAll(/<b>(.*?)<\/b>/g)].map(x => x[1].replace(/<[^>]*>/g, ''));
    return { m, bold, tol: (pr.predict && pr.predict.tol) || 0.05, label: pr.predict ? pr.predict.label + ' (' + (pr.predict.unit || '') + ')' : '?' };
  }, [id, k]);
  if (r.err) { fail(`problem ${k}: measure throws — ${r.err}`); continue; }
  if (!isFinite(r.m)) { fail(`problem ${k}: measure is ${r.m}`); continue; }
  // the answer is the last bold run that holds a number; "a–b" is a range
  const ans = r.bold.map(s => ({ s, v: nums(s).map(v => v * scale(s)) })).filter(x => x.v.length).pop();
  if (!ans) { console.log(`look     problem ${k}: ${r.label} = ${r.m.toPrecision(5)} — no bold number in its working`); continue; }
  const lo = Math.min(...ans.v.slice(0, 2)), hi = Math.max(...ans.v.slice(0, 2)), ok =
    (ans.v.length >= 2 && /[–-]|to/.test(ans.s) ? r.m >= lo * (1 - r.tol) - 1e-12 && r.m <= hi * (1 + r.tol) + 1e-12 : false) ||
    ans.v.some(v => Math.abs(r.m - v) <= Math.abs(v) * r.tol + 1e-12);
  if (ok) console.log(`ok       problem ${k}: ${r.label} = ${r.m.toPrecision(5)} ≈ "${ans.s}"`);
  else fail(`problem ${k}: ${r.label} measures ${r.m.toPrecision(5)} but the working says "${ans.s}" (tol ${r.tol})`);
}

/* ---------- 2. CONTROLS ---------- */
if (!noLive) {
  const lv = spawnSync('node', ['live.mjs', id, '--presets'], { encoding: 'utf8', timeout: 900000 });
  const out = (lv.stdout || '') + (lv.stderr || '');
  out.split('\n').filter(l => /^(DEAD|ERROR|PAGEERROR)/.test(l)).forEach(l => fail('live: ' + l));
  const last = out.trim().split('\n').pop(); console.log((lv.status === 0 ? 'ok       ' : 'FAIL     ') + 'live: ' + last); if (lv.status !== 0 && !/DEAD|ERROR/.test(out)) fails++;
}
const tiles = [];
async function snap(page, label, how) {
  const r = await page.evaluate(async ([i, how]) => {
    const R = window.__R, def = R.def;
    Object.keys(R.S.p).forEach(x => delete R.S.p[x]);
    Object.assign(R.S.p, def.params, how.preset != null ? def.presets[how.preset].params : {}, how.setup != null ? { setup: how.setup } : {});
    R.S.t = 0; R.S.cam = null; if (def.setup) def.setup(R.S);
    await new Promise(r => setTimeout(r, 2200));
    const txt = [...document.querySelectorAll('.readouts, .eq')].map(e => e.textContent).join(' ');
    const bad = (txt.match(/NaN|undefined|Infinity/) || [])[0] || null;
    const el = document.querySelector('.stagepanel') || document.querySelector('.stage');
    el && el.scrollIntoView();
    const rc = el.getBoundingClientRect();
    return { bad, clip: { x: rc.x + scrollX, y: rc.y + scrollY, width: rc.width, height: rc.height }, over: document.documentElement.scrollWidth > innerWidth + 1 };
  }, [id, how]);
  if (r.bad) fail(`${label}: "${r.bad}" on the readouts or the equation`);
  if (r.over) fail(`${label}: page scrolls sideways`);
  const png = await page.screenshot({ clip: r.clip, fullPage: true });
  tiles.push({ label, png: png.toString('base64'), narrow: page.viewportSize().width < 500 });
}
for (const s of meta.setups) await snap(p, 'set-up · ' + s.label, { setup: s.value });
for (let k = 0; k < meta.presets.length; k++) await snap(p, 'preset · ' + meta.presets[k], { preset: k });
const n = await open(390, 844);
for (const s of meta.setups) await snap(n.p, '390 px · ' + s.label, { setup: s.value });
[...errs, ...n.errs].forEach(e => fail('page error: ' + e));

/* ---------- 3. EYES: the contact sheets, six stage tiles (or eight phone tiles) a page ---------- */
const sheet = await b.newPage({ viewport: { width: 1800, height: 1000 } });
const pages = [], wide = tiles.filter(t => !t.narrow), phone = tiles.filter(t => t.narrow);
for (let i = 0; i < wide.length; i += 6) pages.push(wide.slice(i, i + 6));
for (let i = 0; i < phone.length; i += 8) pages.push(phone.slice(i, i + 8));
fs.readdirSync('.').filter(f => f.startsWith('sheet-' + id + '-')).forEach(f => fs.unlinkSync(f));
for (let k = 0; k < pages.length; k++) {
  await sheet.setContent(`<html><body style="margin:0;background:#05080F;color:#E7EDFB;font:15px system-ui;padding:12px">
  <h2 style="margin:4px 0 10px">${meta.name} <span style="color:#98A6C6;font-weight:400">· ${id} · sheet ${k + 1}/${pages.length}</span></h2>
  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start">${pages[k].map(t =>
    `<figure style="margin:0;width:${t.narrow ? 420 : 880}px"><img style="width:100%;border:1px solid #1A2439" src="data:image/png;base64,${t.png}"><figcaption style="color:#98A6C6;margin-top:3px">${t.label}</figcaption></figure>`).join('')}</div></body></html>`);
  await sheet.waitForTimeout(200);
  await sheet.screenshot({ path: `sheet-${id}-${k + 1}.png`, fullPage: true });
}
await b.close();
console.log(`sheets   sheet-${id}-1..${pages.length}.png — ${tiles.length} tiles: look at every one`);
console.log(fails ? `SHIP-FAIL — ${fails} problem(s)` : 'SHIP-CLEAN — numbers, controls and mounts; now look at the sheet');
process.exit(fails ? 1 : 0);
