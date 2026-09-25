/* Liveness (memory.md §6 rule 13): in a Grades 6–8 lab, every control shown in every set-up must
   move at least one readout, the equation, a plot or — for a control marked `display` — the
   stage, when it is swept across its range.

   Each value is a fresh, seeded run of the same length (setup, then a fixed number of steps with
   the clock at a day a second), so a difference between two values is the control's doing. The
   first value is run twice: a channel that differs between those two runs (a background
   computation paced by the wall clock, say) is not deterministic and cannot testify.

   node live.mjs [labId] [-v]     prints LIVE-CLEAN, or one DEAD line per control that moves nothing */
import { chromium } from 'playwright'; import fs from 'fs';
const args = process.argv.slice(2), verbose = args.includes('-v'), only = args.find(a => !a.startsWith('-')) || null;
const body = fs.readFileSync('index.html', 'utf8');
fs.writeFileSync('_preview.html', '<!doctype html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: 1500, height: 1050 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto('file://' + process.cwd() + '/_preview.html?grade=6');
await page.waitForTimeout(1500);
const ids = await page.evaluate(only => (window.__REG || []).filter(d => d.grade >= 6 && d.grade <= 8 && (!only || d.id === only)).map(d => d.id), only);
if (!ids.length) { console.log('no Grades 6–8 labs' + (only ? ' called ' + only : '')); await b.close(); process.exit(only ? 1 : 0); }

let dead = 0, checked = 0;
for (const id of ids) {
  await page.evaluate(id => { location.hash = id; }, id);
  await page.waitForTimeout(900);
  const res = await page.evaluate(async id => {
    const R = window.__R, def = R.def, S = R.S;
    if (!def || def.id !== id) return { error: 'did not mount ' + id };
    R.playing = false;
    if (window.__FX) window.__FX.pin = 1;       // full quality throughout: the adaptive tier follows the wall clock
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const hash = cv => {
      if (!cv || !cv.width) return 0;
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let h = 0; for (let i = 0; i < d.length; i += 12) h = (Math.imul(h, 31) + d[i]) | 0;
      return h;
    };
    const items = (def.controls || []).flatMap(g => g.items.map(it => ({ it, g })));
    const setupItem = items.find(x => x.it.key === 'setup');
    const setups = setupItem ? setupItem.it.options.map(o => o.value) : [null];
    const base = Object.assign({}, def.params);
    const hasClock = 'clock' in base;
    async function run(p) {
      Object.keys(S.p).forEach(k => delete S.p[k]); Object.assign(S.p, p);
      S.t = 0; S.cam = null; S.camFor = null;          // a fresh view too: a camera that follows the action remembers
      if (def.setup) def.setup(S);
      for (let k = 0; k < 60; k++) { if (def.step) def.step(S, 0.05); S.t += 0.05; }
      await frame(); await pause(90); await frame(); await frame();
      const out = {
        readouts: [...document.querySelectorAll('.readouts')].map(e => e.textContent).join('|'),
        equation: (document.querySelector('.eq') || {}).textContent || '',
        stage: hash(document.querySelector('.stage canvas'))
      };
      document.querySelectorAll('.plot canvas').forEach((cv, i) => { out['plot' + i] = hash(cv); });
      return out;
    }
    const valuesOf = it => it.type === 'select' ? it.options.map(o => o.value)
      : it.type === 'toggle' ? [false, true]
      : [it.min, (it.min + it.max) / 2, it.max];
    const found = [];
    for (const su of setups) {
      const p0 = Object.assign({}, base, su != null ? { setup: su } : {}, hasClock ? { clock: 24 } : {});
      Object.keys(S.p).forEach(k => delete S.p[k]); Object.assign(S.p, p0);
      if (def.setup) def.setup(S);
      const shown = items.filter(({ it, g }) => it.key !== 'setup' && (!g.when || g.when(S)) && (!it.when || it.when(S)));
      for (const { it } of shown) {
        const vals = valuesOf(it);
        const runs = [];
        for (const v of vals) runs.push(await run(Object.assign({}, p0, { [it.key]: v })));
        const again = await run(Object.assign({}, p0, { [it.key]: vals[0] }));
        const chans = Object.keys(runs[0]).filter(ch => again[ch] === runs[0][ch]);
        const allowed = it.display ? chans.filter(ch => ch === 'stage' || ch.startsWith('plot')) : chans;
        const moved = allowed.filter(ch => runs.some(r => r[ch] !== runs[0][ch]));
        found.push({ setup: su, key: it.key, label: (it.label || '').replace(/<[^>]*>/g, ''), display: !!it.display,
                     moved, noisy: Object.keys(runs[0]).filter(ch => !chans.includes(ch)) });
      }
    }
    Object.keys(S.p).forEach(k => delete S.p[k]); Object.assign(S.p, base);
    if (def.setup) def.setup(S);
    return { found };
  }, id);
  if (res.error) { console.log('ERROR    ' + res.error); dead++; continue; }
  for (const f of res.found) {
    checked++;
    const where = id + (f.setup != null ? '/' + f.setup : '') + ' · ' + f.key;
    if (!f.moved.length) { dead++; console.log('DEAD     ' + where + ' — "' + f.label + '" moves nothing' + (f.display ? ' on the stage or a plot' : '') + (f.noisy.length ? ' (not deterministic: ' + f.noisy.join(', ') + ')' : '')); }
    else if (verbose) console.log('live     ' + where + ' → ' + f.moved.join(', '));
  }
}
if (errs.length) { console.log(errs.join('\n')); dead += errs.length; }
console.log(dead ? dead + ' problem(s) in ' + checked + ' control × set-up pairs' : 'LIVE-CLEAN — ' + checked + ' control × set-up pairs in ' + ids.length + ' lab(s), each swept across its range');
await b.close();
process.exit(dead ? 1 : 0);
