/* ============================================================
   GRADE 6 · UNIT E · REGIONAL CLIMATE, ORGANISMS AND HEREDITY
   6E-5  The Heredity Lab
   (E5.1 Sexual reproduction; E5.2 Why sexual offspring resemble but do
    not match parents; E5.3 Asexual reproduction; E5.4 Why asexual
    offspring are identical; E5.5 Comparing the two strategies;
    E6.1 Genes as inherited information; E6.2 Variation among siblings;
    E6.3 Why sex makes variation; E6.4 Why asexual reproduction keeps
    the information identical; E6.5 Inheritance diagrams; E6.6 A Punnett square)

   The garden pea, Mendel's own organism, with its seven chromosome pairs
   and his seven genes placed on them (four of the seven pairs; after
   Blixt 1975: a and i on one, fa, le and v on another, gp and r on two
   more). Every individual carries real chromosome pairs, each stretch
   coloured by the grandparent it came from. Meiosis is computed at the
   level of the four chromatids: chiasmata fall at random, 2 per Morgan
   of bivalent (no interference), each between a random pair of
   non-sister chromatids; the bivalents orient at random (independent
   assortment); the sister chromatids part at random in meiosis II. In the
   ovule three of the four products die and one becomes the egg.
   Fertilisation pairs a pollen nucleus with the egg. Every cross,
   sibling, seed and Punnett-square count in the lab comes from this.
     asexual  — woodland strawberry runners: clones; the only differences
                are new mutations, ~7 × 10⁻⁹ per letter per generation
                (Ossowski et al. 2010) in 2 × 240 million letters.
     compare  — New Zealand mud snails in a lake (Potamopyrgus
                antipodarum, which has sexual and all-female clonal
                lineages): an individual model with the two-fold cost of
                males, parasites (Microphallus castrates its host) that
                track the commonest host genotypes, or a warming lake with
                a moving optimum.
     genes    — the molecular identity of four of Mendel's genes:
                Le (GA 3-oxidase; Lester et al. 1997), R (starch-branching
                enzyme I; Bhattacharyya et al. 1990), I (stay-green SGR;
                Armstead et al. 2007), A (a bHLH pigment switch;
                Hellens et al. 2010).
     diagrams — generation diagrams with Mendel's F2 counts, and a
                Labrador pedigree whose genotypes are deduced by
                enumerating every assignment the family allows.
     punnett  — mono- and dihybrid squares filled by simulated offspring,
                with Mendel's counts and a chi-square test.
   Registration and every model load without a page (the tests run them in a
   bare VM); only the drawing uses window.G6H, RX and KITMS.
   ============================================================ */
(function (L) {
  'use strict';
  const { clamp, TAU } = L;
  const kit = () => window.KITMS, HH = () => window.G6H;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003 + 0.5) / 1000003.5; }; }
  function poisson(r, lam) { const Lm = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > Lm && k < 60); return k - 1; }

  /* ============================================================
     1. THE PEA GENOME
     ============================================================ */
  const CHR_LEN = [1.8, 1.2, 1.3, 1.6, 1.2, 1.1, 1.4];          // Morgans, roughly the pea's linkage map
  const GKEYS = ['A', 'I', 'Fa', 'Le', 'V', 'Gp', 'R'];
  const GENES = {
    A: { trait: 'flower colour', dom: 'purple', rec: 'white', up: 'A', lo: 'a', chr: 0, at: 0.2 / 1.8, mendel: [705, 224], col: '#C78AE0' },
    I: { trait: 'seed colour', dom: 'yellow', rec: 'green', up: 'I', lo: 'i', chr: 0, at: 1.5 / 1.8, mendel: [6022, 2001], col: '#E6CC50' },
    Fa: { trait: 'flower position', dom: 'along the stem', rec: 'at the top', up: 'Fa', lo: 'fa', chr: 3, at: 0.15 / 1.6, mendel: [651, 207], col: '#F2A0B0' },
    Le: { trait: 'stem length', dom: 'tall', rec: 'dwarf', up: 'Le', lo: 'le', chr: 3, at: 0.95 / 1.6, mendel: [787, 277], col: '#8FD18B' },
    V: { trait: 'pod shape', dom: 'inflated', rec: 'constricted', up: 'V', lo: 'v', chr: 3, at: 1.08 / 1.6, mendel: [882, 299], col: '#7FB7F2' },
    Gp: { trait: 'pod colour', dom: 'green', rec: 'yellow', up: 'Gp', lo: 'gp', chr: 4, at: 0.6 / 1.2, mendel: [428, 152], col: '#6AAA44' },
    R: { trait: 'seed shape', dom: 'round', rec: 'wrinkled', up: 'R', lo: 'r', chr: 6, at: 0.7 / 1.4, mendel: [5474, 1850], col: '#FFC85A' }
  };
  const SRC = { F1: '#3A6AD8', F2: '#8AC8F8', M1: '#D84A4A', M2: '#F4A6B6' };
  /* an individual: h[c] = [homolog from its mother, homolog from its father]; each homolog { segs: [[from, to, source]], al: {gene: 1 dominant | 0} } */
  function makeInd(geno, c1, c2) {
    const h = [];
    for (let c = 0; c < 7; c++) {
      const a = { segs: [[0, 1, c1]], al: {} }, b = { segs: [[0, 1, c2]], al: {} };
      GKEYS.forEach(k => { if (GENES[k].chr !== c) return; const n = geno[k] == null ? 1 : geno[k]; a.al[k] = n >= 1 ? 1 : 0; b.al[k] = n >= 2 ? 1 : 0; });
      h.push([a, b]);
    }
    return { h };
  }
  const copyHom = x => ({ segs: x.segs.map(s => s.slice()), al: Object.assign({}, x.al) });
  function splitSegs(segs, x) { const l = [], r = []; segs.forEach(([a, b, c]) => { if (b <= x) l.push([a, b, c]); else if (a >= x) r.push([a, b, c]); else { l.push([a, x, c]); r.push([x, b, c]); } }); return [l, r]; }
  function mergeSegs(s) { const o = []; s.forEach(q => { const t = o[o.length - 1]; if (t && t[2] === q[2] && Math.abs(t[1] - q[0]) < 1e-9) t[1] = q[1]; else o.push(q.slice()); }); return o; }
  /* a chiasma at x between chromatids p and q: they exchange everything beyond x */
  function chiasma(p, q, x, c) {
    const [pl, pr] = splitSegs(p.segs, x), [ql, qr] = splitSegs(q.segs, x);
    p.segs = mergeSegs(pl.concat(qr)); q.segs = mergeSegs(ql.concat(pr));
    if (p.id && q.id) { const [pa, pb] = splitSegs(p.id, x), [qa, qb] = splitSegs(q.id, x); p.id = mergeSegs(pa.concat(qb)); q.id = mergeSegs(qa.concat(pb)); }
    GKEYS.forEach(k => { const G = GENES[k]; if (G.chr === c && G.at > x) { const t = p.al[k]; p.al[k] = q.al[k]; q.al[k] = t; } });
  }
  /* meiosis of one cell. Chromatids 0, 1 are the sisters of the first homolog, 2, 3 of the second.
     Returns, per chromosome, the four chromatids after crossing over, the chiasmata, and which
     gamete each chromatid ends in (order[g] = chromatid index), and the four gametes. */
  function meiosis(ind, r, cross) {
    const rec = [], gam = [[], [], [], []];
    for (let c = 0; c < 7; c++) {
      const [A, B] = ind.h[c], ch = [copyHom(A), copyHom(A), copyHom(B), copyHom(B)], xo = [];
      if (cross) {
        const k = poisson(r, 2 * CHR_LEN[c]);
        // each chromatid remembers which homolog's sequence it carries along its length; a chiasma joins
        // a strand carrying the first homolog's sequence at x to one carrying the second's (never two sisters)
        ch.forEach((q, k) => { q.id = [[0, 1, k < 2 ? 0 : 1]]; });
        const idAt = (q, x) => { for (const sg of q.id) if (x >= sg[0] && x < sg[1]) return sg[2]; return q.id[q.id.length - 1][2]; };
        const xs = []; for (let j = 0; j < k; j++) xs.push(0.02 + 0.96 * r());
        xs.sort((a, b) => a - b).forEach(x => {
          const a0 = [0, 1, 2, 3].filter(q => idAt(ch[q], x) === 0), a1 = [0, 1, 2, 3].filter(q => idAt(ch[q], x) === 1);
          const e = { x, i: a0[r() < 0.5 ? 0 : 1], j: a1[r() < 0.5 ? 0 : 1] };
          chiasma(ch[e.i], ch[e.j], x, c); xo.push(e);
        });
        ch.forEach(q => { delete q.id; });
      }
      const firstLeft = r() < 0.5;                        // the bivalent's orientation on the plate: independent assortment
      const L2 = firstLeft ? [0, 1] : [2, 3], R2 = firstLeft ? [2, 3] : [0, 1];
      const sL = r() < 0.5, sR = r() < 0.5;               // which sister goes which way in meiosis II
      const order = [sL ? L2[0] : L2[1], sL ? L2[1] : L2[0], sR ? R2[0] : R2[1], sR ? R2[1] : R2[0]];
      order.forEach((ci, gi) => gam[gi].push(ch[ci]));
      rec.push({ ch, xo, order, firstLeft });
    }
    return { rec, gam };
  }
  const fertilise = (egg, pollen) => ({ h: egg.map((x, c) => [x, pollen[c]]) });
  const nDom = (ind, k) => ind.h[GENES[k].chr][0].al[k] + ind.h[GENES[k].chr][1].al[k];
  const shows = (ind, k) => nDom(ind, k) > 0;
  const genoStr = (ind, k) => { const G = GENES[k], n = nDom(ind, k); return n === 2 ? G.up + G.up : n === 1 ? G.up + G.lo : G.lo + G.lo; };
  /* the share of a gamete's DNA (by map length) that came from one grandparent */
  function shareFrom(gam, src) { let a = 0, t = 0; gam.forEach((h, c) => { h.segs.forEach(([x0, x1, s]) => { if (s === src) a += (x1 - x0) * CHR_LEN[c]; }); t += CHR_LEN[c]; }); return a / t; }
  const PARENTS = {
    hybrids: { f: { A: 1, I: 1, Fa: 1, Le: 1, V: 1, Gp: 1, R: 1 }, m: { A: 1, I: 1, Fa: 1, Le: 1, V: 1, Gp: 1, R: 1 }, label: 'two hybrids, each carrying both forms of all seven genes' },
    varieties: { f: { A: 2, I: 2, Fa: 2, Le: 2, V: 2, Gp: 2, R: 2 }, m: { A: 0, I: 0, Fa: 0, Le: 0, V: 0, Gp: 0, R: 0 }, label: 'two pure-breeding varieties: all dominant × all recessive' },
    mixed: { f: { A: 1, I: 2, Fa: 1, Le: 1, V: 2, Gp: 0, R: 1 }, m: { A: 0, I: 1, Fa: 2, Le: 1, V: 1, Gp: 1, R: 1 }, label: 'two garden plants of different make-up' },
    same: { f: { A: 2, I: 2, Fa: 2, Le: 0, V: 2, Gp: 2, R: 2 }, m: { A: 2, I: 2, Fa: 2, Le: 0, V: 2, Gp: 2, R: 2 }, label: 'one pure-breeding variety crossed with itself' }
  };
  /* the chance that a child shows the dominant form, and that two siblings look alike, gene by gene */
  const pRecGamete = n => n === 2 ? 0 : n === 1 ? 0.5 : 1;
  const pDomChild = (nf, nm) => 1 - pRecGamete(nf) * pRecGamete(nm);
  const pSibAlike = (nf, nm) => { const d = pDomChild(nf, nm); return d * d + (1 - d) * (1 - d); };
  const gametesKinds = n => Math.pow(2, n);

  /* ============================================================
     2. CLONES — the woodland strawberry (Fragaria vesca)
     ============================================================ */
  const STRAW_G = 240e6;                                   // letters in one set (Shulaev et al. 2011)
  const MUT = { none: 0, real: 7e-9, high: 3e-7 };
  const clonesAfter = (r, g) => Math.pow(1 + r, g);
  /* the bed: the mother and every runner daughter, generation by generation, each with its new mutations */
  function bedOf(p) {
    const r = rng(p.seed * 613 + 7), plants = [{ gen: 0, parent: -1, mut: 0 }], lam = 2 * STRAW_G * MUT[p.mut];
    for (let g = 1; g <= p.gens; g++) {
      const before = plants.length;
      for (let i = 0; i < before; i++) for (let k = 0; k < p.runners; k++) plants.push({ gen: g, parent: i, mut: plants[i].mut + poisson(r, Math.min(50, lam)) });
    }
    // seedlings from the mother's own seed: she is Yy for fruit colour (yellow-fruited forms are recessive)
    // and Rr for runnering (runnerless forms are recessive); leaf colour varies with many genes
    const seedlings = [];
    for (let k = 0; k < 6; k++) seedlings.push({ fruit: (r() < 0.5 ? 1 : 0) + (r() < 0.5 ? 1 : 0), run: (r() < 0.5 ? 1 : 0) + (r() < 0.5 ? 1 : 0), tint: r(), share: 0.5 });
    return { plants, seedlings, lam };
  }

  /* ============================================================
     3. SEX AGAINST CLONES — mud snails in a lake
     Diploid snails with six two-allele loci. A genotype's resistance type
     is its full genotype (3⁶ = 729 kinds). Parasites track the hosts:
     a host's chance of infection is 1 − e^{−v·30·f}, f its genotype's
     share of the lake two generations before. Infected snails are
     castrated. In a warming lake the trait z (the count of '1' alleles)
     has an optimum θ that rises each generation; survival e^{−(z−θ)²/(2·1.6²)}.
     Every fertile female lays b = 4 young: a sexual female's are half
     sons, a clone's all daughters (the two-fold cost of males). The lake
     holds K; extra young die at random.
     ============================================================ */
  const NL = 6, B_ = 4, OMEGA = 1.6, MU_ = p => p.mu == null ? 0.0005 : p.mu;
  const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const typeOf = s => { let t = 0; for (let l = 0; l < NL; l++) t = t * 3 + ((s.a >> l) & 1) + ((s.b >> l) & 1); return t; };
  function popInit(p, r) {
    const rand = () => { let x = 0; for (let l = 0; l < NL; l++) if (r() < 1 / 3) x |= 1 << l; return x; };
    const clones = []; for (let c = 0; c < 8; c++) clones.push({ a: rand(), b: rand() });
    const mk = (n, asex) => { const out = []; for (let i = 0; i < n; i++) { if (asex) { const c = clones[i % 8]; out.push({ a: c.a, b: c.b, m: 0, c: i % 8 }); } else out.push({ a: rand(), b: rand(), m: r() < 0.5 ? 1 : 0, c: -1 }); } return out; };
    if (p.arr === 'apart') return [mk(20, false), mk(20, true)];
    const nA = Math.round(p.K * p.p0); return [mk(p.K - nA, false).concat(mk(nA, true))];
  }
  function popNext(pop, p, gen, r, freqLag) {
    const theta = p.env === 'warming' ? Math.min(11, 4 + p.warm * gen) : 4;
    const fem = [], males = [];
    let inf = [0, 0], n = [0, 0], wsum = 0;
    pop.forEach(s => {
      const z = pc(s.a) + pc(s.b), w = Math.exp(-(z - theta) * (z - theta) / (2 * OMEGA * OMEGA)), asex = s.c >= 0 ? 1 : 0;
      let infected = false;
      if (p.env === 'parasites' && freqLag) { const f = freqLag[typeOf(s)] || 0; infected = r() < 1 - Math.exp(-p.vir * 30 * f); }
      s.inf = infected; n[asex]++; if (infected) inf[asex]++; wsum += w;
      if (infected) return;
      if (r() > w) return;                                  // did not survive to breed
      if (s.m) males.push(s); else fem.push(s);
    });
    const kids = [];
    fem.forEach(f => {
      for (let k = 0; k < B_; k++) {
        if (f.c >= 0) { const d = { a: f.a, b: f.b, m: 0, c: f.c }; if (r() < MU_(p)) d.a ^= 1 << Math.floor(r() * NL); kids.push(d); continue; }
        if (!males.length) break;
        const m = males[Math.floor(r() * males.length)], gam = s => { let x = 0; for (let l = 0; l < NL; l++) x |= ((r() < 0.5 ? s.a : s.b) >> l & 1) << l; return x; };
        const d = { a: gam(f), b: gam(m), m: r() < 0.5 ? 1 : 0, c: -1 }; if (r() < MU_(p)) d.a ^= 1 << Math.floor(r() * NL); kids.push(d);
      }
    });
    for (let i = kids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = kids[i]; kids[i] = kids[j]; kids[j] = t; }
    return { next: kids.slice(0, p.K), stats: { n, inf, w: wsum / Math.max(1, pop.length), theta } };
  }
  function freqOf(pop) { const f = {}; pop.forEach(s => { const t = typeOf(s); f[t] = (f[t] || 0) + 1 / pop.length; }); return f; }
  function sampleOf(pop, k) { const out = [], step = Math.max(1, pop.length / k); for (let i = 0; i < pop.length && out.length < k; i += step) { const s = pop[Math.floor(i)]; out.push({ m: s.m, c: s.c, inf: !!s.inf, z: pc(s.a) + pc(s.b) }); } return out; }
  /* the whole run: G generations, the history and a sample of snails each generation */
  function popRun(p, G) {
    const r = rng(p.seed * 4241 + 17), lakes = popInit(p, r), hist = [], lag = lakes.map(() => []);
    for (let g = 0; g <= G; g++) {
      const row = { g, lakes: [] };
      lakes.forEach((pop, li) => {
        const fl = lag[li].length >= 2 ? lag[li][lag[li].length - 2] : null;
        lag[li].push(freqOf(pop)); if (lag[li].length > 3) lag[li].shift();
        const { next, stats } = popNext(pop, p, g, r, fl);
        const nSex = pop.filter(s => s.c < 0).length, nAs = pop.length - nSex, males = pop.filter(s => s.m).length;
        const types = [new Set(), new Set()]; pop.forEach(s => types[s.c >= 0 ? 1 : 0].add(typeOf(s)));
        const zs = [0, 0]; pop.forEach(s => { zs[s.c >= 0 ? 1 : 0] += pc(s.a) + pc(s.b); });
        row.lakes.push({ N: pop.length, nSex, nAs, males, infSex: stats.n[0] ? stats.inf[0] / stats.n[0] : 0, infAs: stats.n[1] ? stats.inf[1] / stats.n[1] : 0, w: stats.w, theta: stats.theta, typesSex: types[0].size, typesAs: types[1].size, zSex: nSex ? zs[0] / nSex : NaN, zAs: nAs ? zs[1] / nAs : NaN, clones: new Set(pop.filter(s => s.c >= 0).map(s => s.c)).size, sample: sampleOf(pop, 110) });
        lakes[li] = next;
      });
      hist.push(row);
    }
    return hist;
  }
  /* with no parasites and no change, a clone's odds double each generation */
  const shareAfter = (p0, g) => p0 * Math.pow(2, g) / (p0 * Math.pow(2, g) + 1 - p0);

  /* ============================================================
     4. GENES AS INFORMATION — four of Mendel's genes, molecule by molecule
     ============================================================ */
  const GENEFACT = {
    Le: { protein: 'GA 3-oxidase, the enzyme that makes the growth hormone gibberellin (GA₁)', change: 'one letter changed, G → A: amino acid 229 becomes threonine instead of alanine', effect: 'the enzyme works poorly, little GA₁ is made, the stem’s internodes stay short', refs: 'Lester et al. 1997; Martin et al. 1997', kind: 'swap', at: 13 },
    R: { protein: 'starch-branching enzyme I (SBEI), which builds branched starch in the seed', change: 'an extra piece of about 800 letters (a transposon) has jumped into the gene', effect: 'no working enzyme: less starch, more sugar; the seed swells with water and wrinkles as it dries', refs: 'Bhattacharyya et al. 1990', kind: 'insert', at: 11 },
    I: { protein: 'the stay-green protein SGR, which starts the breakdown of chlorophyll as the seed ripens', change: 'a small change in the gene leaves the protein unable to work', effect: 'the chlorophyll stays: the ripe seed is green, not yellow', refs: 'Armstead et al. 2007; Sato et al. 2007', kind: 'insert-small', at: 9 },
    A: { protein: 'a bHLH transcription factor — a switch that turns on the genes for purple anthocyanin pigment', change: 'one letter changed at the edge of an intron, so the gene’s message is cut wrongly', effect: 'no working switch: no pigment — white flowers and no purple ring at the leaf axils', refs: 'Hellens et al. 2010', kind: 'swap', at: 15 }
  };
  const SEQ = 'ATGGCTCCTTCAGCCGAGCTTGCA';                         // illustrative letters only

  /* ============================================================
     5. PEDIGREES — a Labrador family (B black, b chocolate; every dog EE)
     ============================================================ */
  const FAMILY = { carriers: [1, 1], carrierChoc: [1, 0], blackCarrier: [2, 1] };
  /* the family: I-1 × I-2 → four pups (II-1 … II-4); II-3 × an outside dog II-5 → five pups (III-1 … III-5) */
  function pedigreeOf(p) {
    const r = rng(p.seed * 389 + 11), [g1, g2] = FAMILY[p.family], gam = n => n === 2 ? 1 : n === 0 ? 0 : (r() < 0.5 ? 1 : 0);
    const dogs = [{ id: 'I-1', sex: 'm', g: g1, gen: 0 }, { id: 'I-2', sex: 'f', g: g2, gen: 0 }];
    for (let k = 0; k < 4; k++) dogs.push({ id: 'II-' + (k + 1), sex: k === 2 ? 'f' : (k % 2 ? 'f' : 'm'), g: gam(g1) + gam(g2), gen: 1, pa: [0, 1] });
    dogs.push({ id: 'II-5', sex: 'm', g: p.family === 'blackCarrier' ? 1 : (r() < 0.5 ? 1 : 0), gen: 1, outside: true });
    for (let k = 0; k < 5; k++) dogs.push({ id: 'III-' + (k + 1), sex: k % 2 ? 'f' : 'm', g: gam(dogs[4].g) + gam(dogs[6].g), gen: 2, pa: [6, 4] });
    dogs.forEach(d => { d.choc = d.g === 0; });
    return { dogs, infer: inferPedigree(dogs) };
  }
  /* every genotype assignment consistent with the colours and with Mendel; what each dog can be */
  function inferPedigree(dogs) {
    const opts = dogs.map(d => d.choc ? [0] : [1, 2]), poss = dogs.map(() => new Set()), cur = new Array(dogs.length);
    let count = 0;
    const can = (pa, pb, c) => { const ga = pa === 2 ? [1] : pa === 0 ? [0] : [0, 1], gb = pb === 2 ? [1] : pb === 0 ? [0] : [0, 1]; return ga.some(a => gb.some(b => a + b === c)); };
    (function rec(i) {
      if (i === dogs.length) { count++; cur.forEach((g, k) => poss[k].add(g)); return; }
      for (const g of opts[i]) { cur[i] = g; const d = dogs[i]; if (d.pa && !can(cur[d.pa[0]], cur[d.pa[1]], g)) continue; rec(i + 1); }
    })(0);
    return { poss: poss.map(s => [...s].sort()), count };
  }

  /* ============================================================
     6. CROSSES AND PUNNETT SQUARES
     ============================================================ */
  /* offspring of a cross: for 'mono' gene g with parents' dominant-allele counts; for 'di' R and I */
  function crossOf(p) {
    const r = rng(p.seed * 7717 + 3), n = Math.round(p.nOff), gam = k => k === 2 ? 1 : k === 0 ? 0 : (r() < 0.5 ? 1 : 0), out = [];
    for (let i = 0; i < n; i++) out.push(p.pmode === 'di' ? [gam(p.pf) + gam(p.pm), gam(p.pf2) + gam(p.pm2)] : [gam(p.pf) + gam(p.pm)]);
    return out;
  }
  /* the expected share of each phenotype class: mono [dominant, recessive]; di [AB, Ab, aB, ab] */
  function expected(p) {
    const d1 = pDomChild(p.pf, p.pm);
    if (p.pmode !== 'di') return [d1, 1 - d1];
    const d2 = pDomChild(p.pf2, p.pm2); return [d1 * d2, d1 * (1 - d2), (1 - d1) * d2, (1 - d1) * (1 - d2)];
  }
  function classCounts(off, p, m) { const k = p.pmode === 'di' ? 4 : 2, c = new Array(k).fill(0); for (let i = 0; i < m; i++) { const o = off[i]; if (p.pmode === 'di') c[(o[0] > 0 ? 0 : 2) + (o[1] > 0 ? 0 : 1)]++; else c[o[0] > 0 ? 0 : 1]++; } return c; }
  function genoCounts(off, m, gi) { const c = [0, 0, 0]; for (let i = 0; i < m; i++) c[off[i][gi || 0]]++; return c; }
  /* chi-square and its p from the regularised upper incomplete gamma */
  function lgamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015; for (let j = 0; j < 6; j++) ser += c[j] / ++y; return -tmp + Math.log(2.5066282746310005 * ser / x); }
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 300; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-12) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 300; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-12) break; }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function chiSquare(obs, expShare) {
    const n = obs.reduce((a, b) => a + b, 0); let chi = 0, df = -1;
    obs.forEach((o, i) => { const e = expShare[i] * n; if (e > 0) { chi += (o - e) * (o - e) / e; df++; } });
    return { chi, df: Math.max(1, df), p: df > 0 ? gammaQ(Math.max(1, df) / 2, chi / 2) : 1 };
  }

  /* ============================================================
     7. SET-UPS AND STATE
     ============================================================ */
  const SETUPS = [
    { value: 'sexual', label: 'Meiosis and fertilisation', teaches: ['E5.1', 'E6.3'] },
    { value: 'resemble', label: 'A pod of brothers and sisters', teaches: ['E5.2', 'E6.2'] },
    { value: 'asexual', label: 'Strawberry runners: clones', teaches: ['E5.3', 'E5.4', 'E6.4'] },
    { value: 'compare', label: 'Sex against clones in a lake', teaches: ['E5.5'] },
    { value: 'genes', label: 'From plant to gene to DNA', teaches: ['E6.1'] },
    { value: 'diagrams', label: 'Inheritance diagrams', teaches: ['E6.5'] },
    { value: 'punnett', label: 'Punnett squares', teaches: ['E6.6'] }
  ];
  const is = (...a) => S => a.indexOf(S.p.setup) >= 0;
  const ORDER = [0, 3, 6, 4, 1, 2, 5];                       // the chromosomes with Mendel's genes first
  const BASE = { setup: 'sexual', nShow: 3, cross: true, ppace: 1, seed: 1, parents: 'hybrids', nKids: 8,
    runners: 2, gens: 2, mut: 'real', sow: true,
    env: 'parasites', arr: 'together', p0: 0.1, K: 400, vir: 0.6, warm: 0.05, gpace: 10,
    gene: 'Le', al1: 1, al2: 0,
    dview: 'generations', dgene: 'A', dcross: 'pure', family: 'carriers', reveal: false,
    pmode: 'mono', pgene: 'A', pf: 1, pm: 1, pf2: 1, pm2: 1, nOff: 929, mendel: true };
  const SETUP_DEFAULTS = { sexual: {}, resemble: {}, asexual: {}, compare: {}, genes: {}, diagrams: {}, punnett: {} };
  function preset(o) { return Object.assign({}, BASE, SETUP_DEFAULTS[o.setup || BASE.setup] || {}, o, { pre: 1 }); }
  const POPG = 200;
  function newRound(S) {
    const p = S.p, r = rng(p.seed * 7919 + S.round * 131 + 1);
    S.mf = meiosis(S.fa, r, p.cross); S.mm = meiosis(S.mo, r, p.cross);
    S.pi = Math.floor(r() * 4); S.ei = Math.floor(r() * 4);
    S.zyg = fertilise(S.mm.gam[S.ei], S.mf.gam[S.pi]);
  }
  function setup(S) {
    const p = S.p, first = S._lastSetup === undefined;
    if (!p.pre && (first ? p.setup !== BASE.setup : S._lastSetup !== p.setup)) Object.assign(p, SETUP_DEFAULTS[p.setup] || {});
    p.pre = 0; S._lastSetup = p.setup;
    p.seed = Math.round(p.seed); p.nShow = Math.round(clamp(p.nShow, 1, 7)); p.nKids = Math.round(clamp(p.nKids, 2, 16));
    p.runners = Math.round(clamp(p.runners, 1, 3)); p.gens = Math.round(clamp(p.gens, 0, 3)); p.nOff = Math.round(clamp(p.nOff, 4, 8000)); p.K = Math.round(p.K);
    S.t = 0; S.ph = 0; S.round = 0; S.gen = 0;
    if (p.setup === 'sexual') {
      S.fa = makeInd(PARENTS.hybrids.f, 'F1', 'F2'); S.mo = makeInd(PARENTS.hybrids.m, 'M1', 'M2'); newRound(S);
      // the spread: what share of a gamete comes from the grandfather, over 600 gametes with and without crossing over
      const r = rng(p.seed * 31 + 5); S.spread = [false, true].map(cx => { const v = []; for (let i = 0; i < 300; i++) { const m = meiosis(S.fa, r, cx); v.push(shareFrom(m.gam[0], 'F1')); } return v; });
    }
    if (p.setup === 'resemble') {
      const P = PARENTS[p.parents]; S.fa = makeInd(P.f, 'F1', 'F2'); S.mo = makeInd(P.m, 'M1', 'M2');
      const r = rng(p.seed * 1931 + 3); S.kids = [];
      for (let k = 0; k < p.nKids; k++) S.kids.push(fertilise(meiosis(S.mo, r, true).gam[Math.floor(r() * 4)], meiosis(S.fa, r, true).gam[Math.floor(r() * 4)]));
      S.sib = sibStats(S);
    }
    if (p.setup === 'asexual') S.bed = bedOf(p);
    if (p.setup === 'compare') S.pop = popRun(p, POPG);
    if (p.setup === 'diagrams') { S.ped = pedigreeOf(p); S.dg = diagramOf(p); }
    if (p.setup === 'punnett') { S.off = crossOf(p); S.exp = expected(p); }
  }
  function step(S, dt) {
    const p = S.p;
    S.t += dt;
    if (p.setup === 'sexual') { S.ph += dt * p.ppace; if (S.ph >= 11.5) { S.ph = 0; S.round++; newRound(S); } }
    if (p.setup === 'compare') S.gen = Math.min(POPG, S.gen + dt * p.gpace);
  }
  /* sibling statistics: alike pairs, traits shared with each parent, and the theory */
  function sibStats(S) {
    const P = PARENTS[S.p.parents], kids = S.kids, n = kids.length, ph = ind => GKEYS.map(k => shows(ind, k) ? 1 : 0).join('');
    const phs = kids.map(ph), fa = ph(S.fa), mo = ph(S.mo);
    let pairs = 0, alike = 0; const alikeK = new Array(8).fill(0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { pairs++; if (phs[i] === phs[j]) alike++; for (let k = 1; k <= 7; k++) if (phs[i].slice(0, k) === phs[j].slice(0, k)) alikeK[k]++; }
    const share = (a, b) => { let s = 0; for (let i = 0; i < 7; i++) if (a[i] === b[i]) s++; return s; };
    const theoryK = [1]; GKEYS.forEach((k, i) => theoryK.push(theoryK[i] * pSibAlike(P.f[k], P.m[k])));
    return { phs, distinct: new Set(phs).size, pairs, alike: pairs ? alike / pairs : 0, alikeK: alikeK.map(v => pairs ? v / pairs : 0), theoryK, likeMum: phs.reduce((s, q) => s + share(q, mo), 0) / n, likeDad: phs.reduce((s, q) => s + share(q, fa), 0) / n, matchParent: phs.filter(q => q === fa || q === mo).length, domShare: GKEYS.map((k, i) => phs.filter(q => q[i] === '1').length / n), domTheory: GKEYS.map(k => pDomChild(P.f[k], P.m[k])) };
  }
  /* a generation diagram: rows of genotypes with their shares */
  function diagramOf(p) {
    const G = GENES[p.dgene], gt = n => n === 2 ? G.up + G.up : n === 1 ? G.up + G.lo : G.lo + G.lo;
    const kids = (a, b) => { const o = [0, 0, 0]; [[a, b]].forEach(() => { const ga = a === 2 ? [1, 1] : a === 0 ? [0, 0] : [1, 0], gb = b === 2 ? [1, 1] : b === 0 ? [0, 0] : [1, 0]; ga.forEach(x => gb.forEach(y => { o[x + y] += 0.25; })); }); return o; };
    const pairs = { pure: [2, 0], test: [1, 0], back: [1, 2], f1: [1, 1] }[p.dcross];
    const rows = [{ label: p.dcross === 'pure' ? 'P (parents)' : 'Parents', a: pairs[0], b: pairs[1] }];
    const k1 = kids(pairs[0], pairs[1]);
    const out = { G, gt, rows, k1 };
    if (p.dcross === 'pure') out.k2 = kids(1, 1);
    return out;
  }

  /* ============================================================
     8. THE STAGE
     ============================================================ */
  const mono = (s, w) => (w || 500) + ' ' + s + 'px "IBM Plex Mono",monospace';
  const sans = (s, w) => (w || 600) + ' ' + s + 'px "IBM Plex Sans","Source Sans 3",sans-serif';
  const LIGHT = '#EAF1FF', DIM = '#9FB0CC', GOLD = '#FFD38A';
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), pct = v => Math.round(v * 100) + ' %';
  const big = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' million' : Math.round(n).toLocaleString('en-GB');
  function lay(g) { const W = g.w, narrow = W < 640, cardW = narrow ? W - 20 : Math.min(320, Math.max(260, W * 0.27)); return { W, H: g.h, narrow, cardW, sw: narrow ? W : W - cardW - 24, HD: 58 }; }
  function label(ctx, t, x, y, col, size, align, wgt) { ctx.font = sans(size || 12, wgt || 700); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,15,.85)'; ctx.strokeText(t, x, y); ctx.fillStyle = col || LIGHT; ctx.fillText(t, x, y); }
  function drawStage(S, g) {
    const p = S.p, K = kit();
    if (!K || !HH() || !window.RX) return;
    const Ly = lay(g), ctx = g.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Ly.sw, g.h); ctx.clip();
    const bg = ctx.createLinearGradient(0, 0, 0, g.h); bg.addColorStop(0, '#141B28'); bg.addColorStop(1, '#0B0F17'); ctx.fillStyle = bg; ctx.fillRect(0, 0, Ly.sw, g.h);
    ({ sexual: stageSexual, resemble: stageResemble, asexual: stageAsexual, compare: stageCompare, genes: stageGenes, diagrams: stageDiagrams, punnett: stagePunnett })[p.setup](S, g, Ly);
    ctx.restore();
    notebookCard(S, g, Ly);
    const H = headerOf(S); K.header(g, H[0], H[1], H[2]);
  }

  /* ---------- meiosis, drawn chromatid by chromatid ---------- */
  const T = { dup0: 0.8, dup1: 1.6, pair: 2.6, xo: 3.4, mI: 4.2, aI: 5.0, two: 5.8, aII: 6.8, gam: 7.6, fly: 8.6, fuse: 9.6 };
  const ease = u => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
  const seg = (ph, a, b) => ease((ph - a) / (b - a));
  function hash(i, k) { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }
  /* where chromatid ci of the i-th shown chromosome is at phase ph; gi its gamete */
  function chromatidPos(ph, i, n, ci, gi, cx, cy, R, sp, w) {
    const hom = ci < 2 ? 0 : 1;
    const th = hash(i, hom) * TAU, rr = 0.25 + 0.3 * hash(i, hom + 5);
    const P0 = [cx + Math.cos(th) * R * rr, cy + Math.sin(th) * R * rr * 0.9], a0 = (hash(i, hom + 9) - 0.5) * 2.4;
    const yRow = cy + (i - (n - 1) / 2) * sp;
    const gap = w * 0.62;
    const K = [];
    K.push([0, P0[0], P0[1], a0]);
    K.push([T.dup0, P0[0], P0[1], a0]);
    const sdx = (ci % 2 ? 1 : -1) * gap * Math.cos(a0), sdy = (ci % 2 ? 1 : -1) * gap * Math.sin(a0);
    K.push([T.dup1, P0[0] + sdx, P0[1] + sdy, a0]);
    K.push([T.pair, cx + (gi - 1.5) * w * 1.25, yRow, 0]);
    K.push([T.xo, cx + (gi - 1.5) * w * 1.25, yRow, 0]);
    K.push([T.mI, cx + (gi - 1.5) * w * 1.25 + (gi < 2 ? -1 : 1) * w * 0.9, yRow, 0]);
    const dI = (gi < 2 ? -1 : 1) * R * 0.8;
    K.push([T.aI, cx + dI + (gi % 2 ? 0.62 : -0.62) * w, yRow, 0]);
    K.push([T.two, cx + dI + (gi % 2 ? 0.62 : -0.62) * w, yRow, 0]);
    const gx = cx + [-1.2, -0.4, 0.4, 1.2][gi] * R;
    K.push([T.aII, gx, yRow, 0]);
    // the gamete's nucleus: two columns
    const cols = n > 3 ? 2 : 1, rows = Math.ceil(n / cols), col = i % cols, row = Math.floor(i / cols);
    K.push([T.gam, gx + (col - (cols - 1) / 2) * w * 2.6, cy + (row - (rows - 1) / 2) * sp * 0.95, 0]);
    let k = 0; while (k < K.length - 1 && ph >= K[k + 1][0]) k++;
    if (k >= K.length - 1) return K[K.length - 1].slice(1);
    const a = K[k], b = K[k + 1], u = ease((ph - a[0]) / (b[0] - a[0]));
    return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
  }
  function drawMeiosis(ctx, S, m, ind, box, female, keep, opts) {
    const p = S.p, A = HH(), ph = Math.min(S.ph, T.gam + 0.6), n = p.nShow, R = Math.max(12, Math.min(box.w / 3.4, box.h / 2.05)), cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const sp = Math.min(R * 0.5, 1.7 * R / n), w = Math.max(2.4, Math.min(sp * 0.16, R * 0.06));
    // the cells
    const memb = female ? 'rgba(255,170,190,.85)' : 'rgba(170,215,240,.8)', fill = female ? 'rgba(220,120,150,.16)' : 'rgba(120,170,220,.16)';
    const cellO = { fill, edge: female ? 'rgba(160,60,90,.28)' : 'rgba(60,110,150,.3)', line: memb };
    if (ph < T.aI) { const u = seg(ph, T.mI, T.aI); A.cell(ctx, cx, cy, R * (1 + 0.55 * u), R * (1 - 0.18 * u), Object.assign({ pinch: u * 0.92, nucleus: { r: R * 0.72, alpha: 1 - seg(ph, T.dup1, T.pair) } }, cellO)); }
    else if (ph < T.two) { const u = seg(ph, T.aI, T.two); [-1, 1].forEach(sg => A.cell(ctx, cx + sg * R * (0.78 + 0.02 * u), cy, R * (0.78 - 0.06 * u), R * 0.82, cellO)); }
    else if (ph < T.aII) { const u = seg(ph, T.two, T.aII); [-1, 1].forEach(sg => A.cell(ctx, cx + sg * R * 0.8, cy, R * (0.72 + 0.4 * u), R * (0.82 - 0.1 * u), Object.assign({ pinch: u * 0.92 }, cellO))); }
    else [0, 1, 2, 3].forEach(gi => { const dead = female && gi !== keep && ph > T.aII + 0.3; ctx.globalAlpha = dead ? 0.25 : 1; A.cell(ctx, cx + [-1.2, -0.4, 0.4, 1.2][gi] * R, cy, R * 0.37, R * 0.72, Object.assign({}, cellO, dead ? { line: 'rgba(120,120,130,.6)' } : {})); ctx.globalAlpha = 1; });
    // spindle fibres in each division
    if ((ph > T.xo && ph < T.aI) || (ph > T.two && ph < T.aII)) {
      ctx.strokeStyle = 'rgba(220,230,255,.18)'; ctx.lineWidth = 1;
      const poles = ph < T.aI ? [[cx - R * 1.2, cy], [cx + R * 1.2, cy]] : [[cx - R * 1.45, cy], [cx - R * 0.15, cy], [cx + R * 0.15, cy], [cx + R * 1.45, cy]];
      for (let i = 0; i < n; i++) { const yy = cy + (i - (n - 1) / 2) * sp; poles.forEach(([px, py], k) => { const tx = ph < T.aI ? cx + (k ? 1 : -1) * w * 2 : cx + [-1, -1, 1, 1][k] * R * 0.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, yy); ctx.stroke(); }); }
    }
    // the chromatids
    for (let i = 0; i < n; i++) {
      const c = ORDER[i], rec = m.rec[c], len = sp * 0.86 * CHR_LEN[c] / 1.8;
      for (let gi = 0; gi < 4; gi++) {
        const ci = rec.order[gi], dead = female && gi !== keep && ph > T.aII + 0.3;
        if (ph < T.dup0 && ci % 2) continue;                 // before copying there is one chromatid per homolog
        const [x, y, ang] = chromatidPos(ph, i, n, ci, gi, cx, cy, R, sp, w);
        const segs = ph < T.pair + 0.4 ? ind.h[c][ci < 2 ? 0 : 1].segs : rec.ch[ci].segs;
        const loci = (opts && opts.loci) ? GKEYS.filter(k => GENES[k].chr === c).map(k => ({ at: GENES[k].at, col: (ph < T.pair + 0.4 ? ind.h[c][ci < 2 ? 0 : 1].al[k] : rec.ch[ci].al[k]) ? '#FFFFFF' : '#1A1A1A' })) : null;
        ctx.globalAlpha = dead ? 0.25 : 1;
        A.chromosome(ctx, x, y, len, ang, { width: w, cols: segs.map(s => [s[0], s[1], SRC[s[2]]]), loci });
        ctx.globalAlpha = 1;
      }
      // the chiasmata, flashing as the chromatids exchange
      if (ph > T.pair && ph < T.xo + 0.3 && p.cross) rec.xo.forEach(e => { const gi1 = rec.order.indexOf(e.i), gi2 = rec.order.indexOf(e.j); const yy = cy + (i - (n - 1) / 2) * sp - len / 2 + e.x * len, xx = cx + ((gi1 + gi2) / 2 - 1.5) * w * 1.25; ctx.strokeStyle = 'rgba(255,230,120,' + (0.9 - 0.5 * Math.abs(Math.sin(S.t * 6))) + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(xx, yy, w * 1.4, 0, TAU); ctx.stroke(); });
    }
    return { cx, cy, R, sp, w, gx: gi => cx + [-1.2, -0.4, 0.4, 1.2][gi] * R };
  }
  const PHASE_NAMES = [[0, 'interphase: one copy of each chromosome'], [T.dup0, 'the DNA is copied: each chromosome is now two sister chromatids'], [T.dup1, 'prophase I: matching chromosomes pair up'], [T.pair, 'crossing over: the pairs swap matching pieces'], [T.xo, 'metaphase I: pairs line up, each facing a random side'], [T.mI, 'anaphase I: the pairs separate'], [T.aI, 'two cells, each with ONE of every pair'], [T.two, 'meiosis II: the sister chromatids separate'], [T.aII, 'four cells, each with one set'], [T.gam, 'the gametes: pollen nuclei, and one egg'], [T.fly, 'fertilisation: a pollen nucleus reaches the egg'], [T.fuse, 'the zygote: one set from each parent — a new combination']];
  const phaseName = ph => { let s = PHASE_NAMES[0][1]; PHASE_NAMES.forEach(([t, n]) => { if (ph >= t) s = n; }); return s; };
  function stageSexual(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = HH(), sw = Ly.sw, H = g.h, top = Ly.HD + 34;
    const zW = Ly.narrow ? 0 : Math.min(220, sw * 0.26), mW = sw - zW - 20, bh = (H - top - 20) / 2;
    const boxF = { x: 10 + (Ly.narrow ? 0 : 40), y: top, w: mW - (Ly.narrow ? 0 : 40), h: bh }, boxM = { x: boxF.x, y: top + bh + 10, w: boxF.w, h: bh - 10 };
    // the parents, small, at the left of each row
    if (!Ly.narrow) [[boxF, 'pollen parent', S.fa], [boxM, 'seed parent', S.mo]].forEach(([b, t, ind]) => { A.peaPlant(ctx, 30, b.y + b.h - 8, b.h * 0.7, { flower: shows(ind, 'A') ? 'purple' : 'white', axial: true, stage: 'flower', leafPx: Math.max(5, b.h * 0.07), seed: b.y | 0, cane: false }); label(ctx, t, 30, b.y + 10, DIM, 10, 'center', 600); });
    const fm = drawMeiosis(ctx, S, S.mf, S.fa, boxF, false, -1, { loci: p.nShow <= 3 });
    const mm = drawMeiosis(ctx, S, S.mm, S.mo, boxM, true, S.ei, { loci: p.nShow <= 3 });
    label(ctx, 'in the anther: a pollen mother cell', boxF.x + boxF.w / 2, boxF.y + 8, '#9CC8FF', 11);
    label(ctx, 'in the ovule: a megaspore mother cell (three of its four products die)', boxM.x + boxM.w / 2, boxM.y + 4, '#F4A6B6', 11);
    label(ctx, phaseName(S.ph), sw / 2, top - 14, GOLD, Ly.narrow ? 10 : 12);
    // fertilisation: the chosen pollen nucleus and the egg meet; the zygote
    const zx = Ly.narrow ? sw / 2 : sw - zW / 2 - 6, zy = top + bh, zr = Math.min(zW * 0.42, bh * 0.55) || Math.min(sw * 0.2, 60);
    if (S.ph <= T.gam + 0.2 && zr > 8 && !Ly.narrow) { ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(230,210,255,.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(zx, zy, zr, 0, TAU); ctx.stroke(); ctx.setLineDash([]); label(ctx, 'the zygote', zx, zy - 8, 'rgba(230,210,255,.6)', 12); label(ctx, 'forms here when a pollen', zx, zy + 10, DIM, 10, 'center', 500); label(ctx, 'nucleus meets the egg', zx, zy + 24, DIM, 10, 'center', 500); }
    if (S.ph > T.gam) {
      const u = seg(S.ph, T.gam + 0.2, T.fly), v = seg(S.ph, T.fly, T.fuse);
      const px = fm.gx(S.pi) + (zx - fm.gx(S.pi)) * u, py = fm.cy + (zy - fm.cy) * u, ex = mm.gx(S.ei) + (zx - mm.gx(S.ei)) * u, ey = mm.cy + (zy - mm.cy) * u;
      if (v < 1) { A.cell(ctx, px, py - zr * 0.3 * (1 - v), zr * 0.4, zr * 0.4, { fill: 'rgba(120,170,220,.3)', line: 'rgba(170,215,240,.9)' }); A.cell(ctx, ex, ey + zr * 0.3 * (1 - v), zr * 0.55, zr * 0.55, { fill: 'rgba(220,120,150,.25)', line: 'rgba(255,170,190,.9)' }); }
      if (v > 0) {
        ctx.globalAlpha = v; A.cell(ctx, zx, zy, zr, zr * 1.05, { fill: 'rgba(200,170,230,.2)', line: 'rgba(230,210,255,.9)', nucleus: { r: zr * 0.78, alpha: 1 } });
        const n = p.nShow, spz = Math.min(zr * 1.5 / n, zr * 0.6), wz = Math.max(2.4, spz * 0.14);
        for (let i = 0; i < n; i++) { const c = ORDER[i], len = spz * 0.86 * CHR_LEN[c] / 1.8, yy = zy + (i - (n - 1) / 2) * spz; [0, 1].forEach(k => A.chromosome(ctx, zx + (k ? 1 : -1) * wz * 1.3, yy, len, 0, { width: wz, cols: S.zyg.h[c][k].segs.map(s => [s[0], s[1], SRC[s[2]]]) })); }
        ctx.globalAlpha = 1;
        label(ctx, 'zygote', zx, zy - zr * 1.05 - 10, LIGHT, 12);
        if (!Ly.narrow && S.ph > T.fuse + 0.3) { const pk = zy + zr * 1.15 + 6; A.peaSeed(ctx, zx - zr * 0.5, pk + 14, 9, { col: shows(S.zyg, 'I') ? 'yellow' : 'green', shape: shows(S.zyg, 'R') ? 'round' : 'wrinkled' }); label(ctx, '→ a seed: ' + (shows(S.zyg, 'R') ? 'round' : 'wrinkled') + ', ' + (shows(S.zyg, 'I') ? 'yellow' : 'green'), zx + 8, pk + 14, DIM, 10, 'center', 600); }
      }
    }
    // the key to the colours
    const ky = H - 36; [['F1', 'pollen parent’s father'], ['F2', '… mother'], ['M1', 'seed parent’s father'], ['M2', '… mother']].forEach(([k, t], i) => { const x = 14 + i * (Ly.narrow ? sw / 4 : 150); ctx.fillStyle = SRC[k]; ctx.fillRect(x, ky - 5, 10, 10); ctx.font = mono(Ly.narrow ? 8 : 9.5); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + 14, ky); });
  }

  /* ---------- a pod of siblings ---------- */
  function plantOpts(ind) { return { flower: shows(ind, 'A') ? 'purple' : 'white', axial: shows(ind, 'Fa'), podCol: shows(ind, 'Gp') ? 'green' : 'yellow', podForm: shows(ind, 'V') ? 'inflated' : 'constricted', stage: 'both' }; }
  function karyo(ctx, ind, x, y, h) {
    for (let c = 0; c < 7; c++) [0, 1].forEach(k => { const xx = x + c * 7 + k * 3; ind.h[c][k].segs.forEach(([a, b, s]) => { ctx.fillStyle = SRC[s]; ctx.fillRect(xx, y + a * h * CHR_LEN[c] / 1.8, 2.4, (b - a) * h * CHR_LEN[c] / 1.8); }); });
  }
  function onePlant(ctx, ind, x, soil, hMax, leafPx, seed) {
    const A = HH(), tall = shows(ind, 'Le');
    A.peaPlant(ctx, x, soil, hMax * (tall ? 0.92 : 0.36), Object.assign(plantOpts(ind), { leafPx, seed }));
    A.peaSeed(ctx, x - leafPx * 1.2, soil + 8, Math.max(4, leafPx * 0.38), { col: shows(ind, 'I') ? 'yellow' : 'green', shape: shows(ind, 'R') ? 'round' : 'wrinkled', seed });
  }
  function stageResemble(S, g, Ly) {
    const p = S.p, ctx = g.ctx, sw = Ly.sw, H = g.h, top = Ly.HD + 20;
    // a garden: soil strips
    const soilP = top + (H - top) * 0.36, rows = p.nKids > 8 ? 2 : 1, perRow = Math.ceil(p.nKids / rows);
    const soilK = rows === 2 ? [top + (H - top) * 0.66, H - 58] : [H - 64];
    [soilP].concat(soilK).forEach(y => { ctx.fillStyle = '#3A2A1E'; ctx.fillRect(0, y, sw, 8); ctx.fillStyle = 'rgba(90,70,50,.5)'; ctx.fillRect(0, y + 8, sw, 3); });
    const hP = Math.max(20, soilP - top - 18), lpP = Math.max(5, Math.min(22, hP * 0.12));
    [[sw * 0.3, S.fa, 'father (pollen)'], [sw * 0.7, S.mo, 'mother (seed)']].forEach(([x, ind, t], i) => {
      onePlant(ctx, ind, x, soilP, hP, lpP, 3 + i);
      label(ctx, t, x, top + 2, i ? '#F4A6B6' : '#9CC8FF', 12);
      if (!Ly.narrow) { ctx.font = mono(9.5, 600); ctx.fillStyle = DIM; ctx.textAlign = 'left'; GKEYS.forEach((k, j) => ctx.fillText(genoStr(ind, k), x + 40 + Math.floor(j / 4) * 34, top + 22 + (j % 4) * 13)); }
    });
    // the cross: a line to the children
    ctx.strokeStyle = 'rgba(255,211,138,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sw * 0.3 + 20, soilP - hP * 0.4); ctx.lineTo(sw * 0.7 - 20, soilP - hP * 0.4); ctx.moveTo(sw * 0.5, soilP - hP * 0.4); ctx.lineTo(sw * 0.5, soilP + 18); ctx.stroke(); label(ctx, '×', sw * 0.5, soilP - hP * 0.4 - 10, GOLD, 16);
    const slot = sw / perRow, hK = Math.max(20, (rows === 2 ? (soilK[1] - soilK[0]) : (soilK[0] - soilP)) - 34), lpK = Math.max(4, Math.min(18, slot * 0.16, hK * 0.12));
    S.kids.forEach((kd, i) => {
      const row = Math.floor(i / perRow), col = i % perRow, x = slot * (col + 0.5), soil = soilK[row];
      onePlant(ctx, kd, x, soil, hK, lpK, 11 + i);
      label(ctx, String(i + 1), x + lpK * 1.5, soil + 6, LIGHT, 10, 'left');
      if (slot > 52) karyo(ctx, kd, x - 24, soil + 12, 14);
    });
  }

  /* ---------- strawberry runners ---------- */
  function bedLayout(S, sw, y0, y1) {
    const bed = S.bed, n = bed.plants.length, COLS = n <= 9 ? 5 : n <= 27 ? 9 : 13, ROWS = n <= 9 ? 3 : 5, C0 = Math.floor(COLS / 2), R0 = Math.floor(ROWS / 2), used = {}, pos = [];
    const key = (c, r) => c + ',' + r;
    bed.plants.forEach((pl, i) => {
      let c = C0, r = R0;
      if (pl.parent >= 0) {
        const [pc_, pr_] = pos[pl.parent]; let best = null, bd = 1e9;
        for (let cc = 0; cc < COLS; cc++) for (let rr = 0; rr < ROWS; rr++) { if (used[key(cc, rr)]) continue; const d = Math.hypot(cc - pc_, (rr - pr_) * 1.6) + (cc === pc_ ? 0.3 : 0) + hash(i, cc + rr * 13) * 0.4; if (d < bd) { bd = d; best = [cc, rr]; } }
        [c, r] = best || [0, 0];
      }
      used[key(c, r)] = 1; pos.push([c, r]);
    });
    const cellW = Math.min(sw / (COLS + 1), (y1 - y0) / Math.max(1, ROWS - 1) * 1.6);
    return { cell: cellW, pts: pos.map(([c, r]) => { const sc = 0.66 + 0.34 * r / (ROWS - 1), y = y0 + (y1 - y0) * r / (ROWS - 1), x = sw / 2 + (c - C0) * cellW * (0.84 + 0.16 * r / (ROWS - 1)); return { x, y, sc }; }) };
  }
  function stageAsexual(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = HH(), sw = Ly.sw, H = g.h, bed = S.bed;
    const y0 = Ly.HD + (Ly.narrow ? 60 : 150), y1 = H - (p.sow ? 96 : 36);
    // the bed: soil in perspective, straw between the plants
    const sky = ctx.createLinearGradient(0, 0, 0, y0); sky.addColorStop(0, '#5A86B8'); sky.addColorStop(1, '#C8DCE8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, sw, y0);
    ctx.fillStyle = '#2E5A2A'; ctx.beginPath(); ctx.moveTo(0, y0 - 18); for (let x = 0; x <= sw; x += 14) ctx.lineTo(x, y0 - 40 - 10 * Math.abs(Math.sin(x * 0.05)) - 6 * hash(x, 1)); ctx.lineTo(sw, y0 - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6A8A3A'; ctx.fillRect(0, y0 - 24, sw, 10);
    const sg = ctx.createLinearGradient(0, y0 - 20, 0, H); sg.addColorStop(0, '#5A4430'); sg.addColorStop(1, '#2A1E14'); ctx.fillStyle = sg; ctx.fillRect(0, y0 - 16, sw, H - y0 + 16);
    ctx.strokeStyle = 'rgba(220,200,140,.35)'; ctx.lineWidth = 1; for (let k = 0; k < 140; k++) { const x = hash(k, 1) * sw, y = y0 - 10 + hash(k, 2) * (H - y0); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 * Math.cos(k), y + 3 * Math.sin(k)); ctx.stroke(); }
    const BL = bedLayout(S, sw, y0, y1), pos = BL.pts, cell = BL.cell, grow = clamp((S.t % 6) / 3, 0, 1);
    // runners first, the newest generation growing out
    bed.plants.forEach((pl, i) => { if (pl.parent < 0) return; const a = pos[pl.parent], b = pos[i], u = pl.gen === p.gens ? grow : 1; if (u <= 0) return; A.stolon(ctx, a.x, a.y, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 14 * b.sc, 1.6 * b.sc); });
    // plants, back to front
    const idx = bed.plants.map((_, i) => i).sort((a, b) => pos[a].y - pos[b].y);
    idx.forEach(i => { const pl = bed.plants[i], q = pos[i], young = pl.gen === p.gens && pl.gen > 0, s = cell * 0.95 * q.sc * (young ? 0.45 + 0.55 * grow : 1); if (s < 2) return; A.strawberry(ctx, q.x, q.y, s, { leaves: young ? 3 : 5, flowers: pl.gen === 0 ? 1 : 0, fruit: pl.gen === 0 ? 2 : (pl.gen < p.gens ? 1 : 0), seed: i + 1 });
      if (pl.mut > 0 && cell > 30) label(ctx, '+' + pl.mut, q.x + s * 0.35, q.y - s * 0.45, '#FFB27A', 9, 'left', 700); });
    label(ctx, 'the mother plant', pos[0].x, pos[0].y + 14, GOLD, 11);
    // seedlings from the mother's seed, in a tray at the front
    if (p.sow) {
      const ty = H - 58, tw = Math.min(sw - 20, 420), tx = 10;
      ctx.fillStyle = '#2A2A30'; ctx.fillRect(tx, ty - 8, tw, 56); ctx.strokeStyle = '#4A4A54'; ctx.strokeRect(tx, ty - 8, tw, 56);
      label(ctx, 'seedlings from her seed', tx + tw / 2, ty - 16, '#F4A6B6', 11);
      bed.seedlings.forEach((sd, k) => { const x = tx + tw * (k + 0.5) / 6, tint = sd.tint < 0.33 ? '#7AA83A' : sd.tint > 0.66 ? '#2E6A30' : '#4E8A3C'; A.strawberry(ctx, x, ty + 36, Math.min(40, tw / 7), { leaves: 4, fruit: 1, seed: 40 + k, tint, fruitCol: sd.fruit > 0 ? null : 'yellow' }); if (sd.run === 0) label(ctx, 'no runners', x, ty + 44, DIM, 8.5, 'center', 600); });
    }
    // mitosis inset: one cell becomes two identical cells
    if (!Ly.narrow) {
      const bx = 12, by = Ly.HD + 8, bw = 230, bh = 128, K = kit();
      K.card(ctx, bx, by, bw, bh); label(ctx, 'every runner cell is made by mitosis', bx + bw / 2, by + 12, LIGHT, 11);
      const ph = (S.t % 5) / 5, u = ease((ph - 0.25) / 0.45), cx = bx + bw / 2, cy = by + 74, r = 34;
      if (u < 1) A.cell(ctx, cx, cy, r * (1 + 0.6 * u), r * 0.9, { pinch: u * 0.95 }); else [-1, 1].forEach(sg => A.cell(ctx, cx + sg * r * 0.9, cy, r * 0.75, r * 0.85, {}));
      [0, 3, 6].forEach((c, i) => [0, 1].forEach(k => { const col = k ? '#E8907F' : '#7FB7F2', yy = cy + (i - 1) * 16; if (ph < 0.25) A.chromosome(ctx, cx - 10 + k * 10 + i * 3, yy, 14, 0, { width: 3.4, col, sisters: ph > 0.1, gap: 2 }); else [-1, 1].forEach(sg => A.chromosome(ctx, cx + sg * (2 + u * r * 0.9) + (k ? 4 : -4), yy, 14, 0, { width: 3.4, col })); }));
    }
  }

  /* ---------- the lake ---------- */
  const CLONE_COL = ['#E8803A', '#9AC83A', '#3AB8D8', '#D85AA8', '#E8C83A', '#7A8AF8', '#3AD89A', '#F05A5A'];
  function stageCompare(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = HH(), sw = Ly.sw, H = g.h, row = S.pop[Math.floor(S.gen)];
    const ws = Ly.HD + 36, bot = H - 26;
    const wg = ctx.createLinearGradient(0, ws, 0, bot); wg.addColorStop(0, '#2A6A88'); wg.addColorStop(1, '#0E2E3E'); ctx.fillStyle = wg; ctx.fillRect(0, ws, sw, bot - ws);
    ctx.fillStyle = 'rgba(200,230,255,.25)'; ctx.fillRect(0, ws, sw, 2);
    ctx.fillStyle = '#3A3020'; ctx.beginPath(); ctx.moveTo(0, bot); for (let x = 0; x <= sw; x += 20) ctx.lineTo(x, bot - 6 - 6 * Math.sin(x * 0.03)); ctx.lineTo(sw, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // pondweed
    const NW = 14, weed = (k, u) => { const x = (k + 0.5) / NW * sw + (hash(k, 3) - 0.5) * 30, hgt = (bot - ws) * (0.4 + 0.4 * hash(k, 4)), cx_ = x + 14 * Math.sin(S.t + k), ex = x + 8 * Math.sin(S.t * 0.7 + k); return [(1 - u) * (1 - u) * x + 2 * u * (1 - u) * cx_ + u * u * ex, bot - 4 - u * (hgt - 4), x, hgt]; };
    for (let k = 0; k < NW; k++) { const [, , x, hgt] = weed(k, 0); ctx.strokeStyle = 'rgba(80,140,70,.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, bot - 4); ctx.quadraticCurveTo(x + 14 * Math.sin(S.t + k), bot - hgt / 2, x + 8 * Math.sin(S.t * 0.7 + k), bot - hgt); ctx.stroke(); for (let j = 1; j < 6; j++) { const yy = bot - hgt * j / 6, xx = x + 6 * Math.sin(S.t + k + j); ctx.fillStyle = 'rgba(90,160,80,.7)'; ctx.beginPath(); ctx.ellipse(xx + 6, yy, 7, 2.5, -0.4, 0, TAU); ctx.fill(); } }
    const lakes = row.lakes, nL = lakes.length;
    if (nL === 2) { ctx.fillStyle = '#4A3E2A'; ctx.beginPath(); ctx.moveTo(sw / 2 - 60, bot); ctx.quadraticCurveTo(sw / 2 - 18, ws + 70, sw / 2 - 4, ws + 60); ctx.lineTo(sw / 2 + 4, ws + 60); ctx.quadraticCurveTo(sw / 2 + 18, ws + 70, sw / 2 + 60, bot); ctx.lineTo(sw / 2 + 60, bot); ctx.closePath(); ctx.fill(); }
    lakes.forEach((lk, li) => {
      const x0 = nL === 2 ? li * sw / 2 + (li ? 64 : 6) : 6, x1 = nL === 2 ? (li + 1) * sw / 2 - (li ? 6 : 64) : sw - 6;
      const sc = Math.max(12, Math.min(28, (x1 - x0) / 20)), shown_ = lk.sample.slice(0, Math.min(lk.sample.length, Math.round((x1 - x0) / 9)));
      shown_.forEach((s, j) => {
        let x, y, fc = hash(j, 2) < 0.5 ? -1 : 1;
        const wk = Math.floor(hash(j, li + 5) * NW), wx = weed(wk, 0)[2];
        if (j % 3 === 0 && wx > x0 && wx < x1) { const q = weed(wk, 0.25 + 0.6 * hash(j, li + 9)); x = q[0] + 3; y = q[1]; }
        else { x = x0 + hash(j, li + 7) * (x1 - x0); y = bot - 6 - hash(j, li + 11) * 10; }
        A.snail(ctx, x, y, sc, { col: s.m ? '#6A5A44' : '#3E3022', facing: fc, male: !!s.m, infected: s.inf, mark: s.c >= 0 ? CLONE_COL[s.c] : null });
      });
      if (!lk.N) label(ctx, 'no snails left', (x0 + x1) / 2, (ws + bot) / 2, '#E8907F', 14);
      if (nL === 2) label(ctx, li ? 'clones only: ' + lk.N : 'sexual only: ' + lk.N, (x0 + x1) / 2, ws + 40, li ? '#FFB27A' : '#9CC8FF', 12);
    });
    label(ctx, 'generation ' + Math.floor(S.gen) + (p.env === 'warming' ? ' · best shell trait ' + f1(lakes[0].theta) : p.env === 'parasites' ? ' · parasites follow the commonest genotypes' : ' · a lake that never changes'), sw / 2, ws - 12, LIGHT, 11);
    if (!Ly.narrow) { const kx = 12, ky = ws + 14; [['#5A4632', 'sexual female', false], ['#8A7A62', 'male', true]].forEach(([c, t, m], i) => { A.snail(ctx, kx + 8 + i * 110, ky, 12, { col: c, male: m }); ctx.font = mono(9.5); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.fillText(t, kx + 20 + i * 110, ky); }); A.snail(ctx, kx + 230, ky, 12, { mark: CLONE_COL[0] }); ctx.fillStyle = LIGHT; ctx.fillText('clone (a paint mark per clone)', kx + 242, ky); }
  }

  /* ---------- genes: plant → cell → nucleus → chromosome → DNA → protein ---------- */
  function stageGenes(S, g, Ly) {
    const p = S.p, ctx = g.ctx, A = HH(), sw = Ly.sw, H = g.h, G = GENES[p.gene], F = GENEFACT[p.gene];
    const n2 = p.al1 + p.al2, cols = Ly.narrow ? 2 : 3, rows = Ly.narrow ? 3 : 2, top = Ly.HD + 12, pw = (sw - 16) / cols, ph = (H - top - 10) / rows;
    const active = Math.floor(S.t / 1.6) % 6, K = kit();
    const ind = makeInd({ A: 2, I: 2, Fa: 2, Le: 2, V: 2, Gp: 2, R: 2, [p.gene]: n2 }, 'M1', 'F1');
    const boxes = []; for (let i = 0; i < 6; i++) boxes.push({ x: 8 + (i % cols) * pw, y: top + Math.floor(i / cols) * ph, w: pw - 8, h: ph - 8 });
    const titles = ['1 · the plant', '2 · one of its cells', '3 · the nucleus: 7 pairs of chromosomes', '4 · one pair: the gene’s place', '5 · the gene: a run of DNA letters', '6 · what the gene makes'];
    boxes.forEach((b, i) => { K.card(ctx, b.x, b.y, b.w, b.h); if (i === active) { ctx.strokeStyle = 'rgba(255,211,138,.8)'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); } ctx.font = sans(11, 700); label(ctx, kit().fitText(ctx, titles[i], b.w - 16), b.x + 10, b.y + 12, i === active ? GOLD : LIGHT, 11, 'left'); });
    const cxOf = b => b.x + b.w / 2, cyOf = b => b.y + b.h / 2 + 8;
    // 1 the plant (or, for the seed genes, its seeds)
    { const b = boxes[0]; onePlant(ctx, ind, cxOf(b), b.y + b.h - 12, b.h - 40, Math.max(5, b.h * 0.06), 5); label(ctx, genoStr(ind, p.gene) + ': ' + (n2 ? G.dom : G.rec), b.x + b.w - 10, b.y + 30, n2 ? '#8FD18B' : '#FFB27A', 12, 'right'); }
    // 2 the cell
    { const b = boxes[1], r = Math.min(b.w, b.h) * 0.34; A.cell(ctx, cxOf(b), cyOf(b), r * 1.25, r, { wall: true, fill: 'rgba(120,200,120,.15)', line: 'rgba(160,230,160,.8)', nucleus: { r: r * 0.38, alpha: 1 } }); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, x = cxOf(b) + Math.cos(a) * r * 0.85, y = cyOf(b) + Math.sin(a) * r * 0.7; ctx.fillStyle = '#4E9A3C'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.13, r * 0.07, a, 0, TAU); ctx.fill(); } label(ctx, 'nucleus', cxOf(b), cyOf(b) + r * 0.5, '#C9B8F0', 10); }
    // 3 the nucleus: 14 chromosomes in pairs, the gene's pair ringed
    { const b = boxes[2], r = Math.min(b.w * 0.42, b.h * 0.38); ctx.fillStyle = 'rgba(150,120,200,.14)'; ctx.strokeStyle = 'rgba(190,160,240,.7)'; ctx.beginPath(); ctx.arc(cxOf(b), cyOf(b), r, 0, TAU); ctx.fill(); ctx.stroke();
      for (let c = 0; c < 7; c++) { const x = cxOf(b) + (c - 3) * r * 0.27, len = r * 0.7 * CHR_LEN[c] / 1.8; [0, 1].forEach(k => A.chromosome(ctx, x + (k ? 3.5 : -3.5), cyOf(b), len, 0, { width: Math.max(2.4, r * 0.06), col: k ? SRC.F1 : SRC.M1 })); if (c === G.chr) { ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(x - 9, cyOf(b) - len / 2 - 4, 18, len + 8); } } }
    // 4 the pair, large, with the gene's locus and both alleles
    { const b = boxes[3], len = b.h * 0.62; [0, 1].forEach(k => { const x = cxOf(b) + (k ? 22 : -22), al = ind.h[G.chr][k].al[p.gene]; A.chromosome(ctx, x, cyOf(b), len, 0, { width: 11, col: k ? SRC.F1 : SRC.M1, loci: [{ at: G.at, col: al ? '#FFFFFF' : '#202020' }] }); label(ctx, al ? G.up : G.lo, x + (k ? 26 : -26), cyOf(b) - len / 2 + G.at * len, al ? '#FFFFFF' : '#FFB27A', 13); }); label(ctx, 'mother’s', cxOf(b) - 30, b.y + b.h - 10, SRC.M2, 9.5); label(ctx, 'father’s', cxOf(b) + 30, b.y + b.h - 10, SRC.F2, 9.5); }
    // 5 the DNA of the gene: the working form and the changed form
    { const b = boxes[4], x0 = b.x + 14, L_ = b.w - 28, bases = SEQ.slice(0, 20), mut = F.kind === 'swap' ? bases.slice(0, F.at) + 'A' + bases.slice(F.at + 1) : bases;
      A.dna(ctx, x0, b.y + b.h * 0.36, L_, { bases, amp: Math.min(14, b.h * 0.08), letters: true, phase: S.t * 0.6 });
      A.dna(ctx, x0, b.y + b.h * 0.76, L_, { bases: mut, amp: Math.min(14, b.h * 0.08), letters: true, hi: F.kind === 'swap' ? F.at : -1, phase: S.t * 0.6 });
      if (F.kind !== 'swap') { const xi = x0 + (F.at + 0.5) / 20 * L_; ctx.fillStyle = 'rgba(255,140,90,.85)'; ctx.fillRect(xi - 5, b.y + b.h * 0.76 - 20, 10, 40); label(ctx, F.kind === 'insert' ? '+ ~800 letters' : '+ a few letters', xi, b.y + b.h * 0.76 + 30, '#FFB27A', 10); }
      label(ctx, G.up + ' (working)', b.x + 10, Math.max(b.y + 28, b.y + b.h * 0.2), '#8FD18B', 10, 'left'); label(ctx, G.lo + ' (changed)', b.x + 10, b.y + b.h * 0.6, '#FFB27A', 10, 'left'); label(ctx, 'letters shown are illustrative', b.x + b.w - 10, b.y + b.h - 8, DIM, 8.5, 'right', 500); }
    // 6 the protein and the trait
    { const b = boxes[5]; ctx.font = sans(b.h < 190 ? 9.5 : 10.5, 500); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const wrap = (t, x, y, w, col) => { ctx.fillStyle = col || LIGHT; const words = t.split(' '); let line = '', yy = y; words.forEach(wd => { const tt = line ? line + ' ' + wd : wd; if (ctx.measureText(tt).width > w) { ctx.fillText(line, x, yy); line = wd; yy += b.h < 190 ? 12 : 14; } else line = tt; }); ctx.fillText(line, x, yy); return yy + (b.h < 190 ? 14 : 16); };
      let y = b.y + 26; y = wrap(G.up + ' makes ' + F.protein + '.', b.x + 10, y, b.w - 20, '#C9F0C0'); y = wrap(G.lo + ': ' + F.change + ' — ' + F.effect + '.', b.x + 10, y, b.w - 20, '#FFD0B0'); wrap('One working copy (' + G.up + G.lo + ') makes enough, so ' + G.up + ' is dominant.', b.x + 10, y, b.w - 20, GOLD); }
  }

  /* ---------- diagrams ---------- */
  function traitIcon(ctx, gk, dom, x, y, s) {
    const A = HH();
    if (gk === 'A') A.peaFlower(ctx, x - s * 0.5, y + s * 0.2, s, -0.2, { colour: dom ? 'purple' : 'white' });
    else if (gk === 'I' || gk === 'R') A.peaSeed(ctx, x, y, s * 0.38, { col: gk === 'I' ? (dom ? 'yellow' : 'green') : 'yellow', shape: gk === 'R' ? (dom ? 'round' : 'wrinkled') : 'round' });
    else if (gk === 'V' || gk === 'Gp') A.peaPod(ctx, x - s * 0.55, y, s * 1.1, 0, { col: gk === 'Gp' ? (dom ? 'green' : 'yellow') : 'green', form: gk === 'V' ? (dom ? 'inflated' : 'constricted') : 'inflated', seeds: [1, 2, 3, 4, 5] });
    else A.peaPlant(ctx, x, y + s * 0.6, s * (gk === 'Le' ? (dom ? 1.3 : 0.5) : 1.2), { flower: 'purple', axial: gk === 'Fa' ? dom : true, leafPx: Math.max(4, s * 0.16), stage: 'flower', cane: false });
  }
  function stageDiagrams(S, g, Ly) {
    const p = S.p;
    if (p.dview === 'pedigree') return stagePedigree(S, g, Ly);
    const ctx = g.ctx, sw = Ly.sw, H = g.h, D = S.dg, G = D.G, top = Ly.HD + 30, gt = D.gt;
    const nRows = p.dcross === 'pure' ? 5 : 3, rh = (H - top - 20) / nRows, s = Math.min(34, rh * 0.42);
    const rowY = i => top + rh * (i + 0.5);
    const node = (x, y, n, txt) => { traitIcon(ctx, p.dgene, n > 0, x, y - s * 0.2, s); label(ctx, gt(n), x, y + s * 0.75, LIGHT, 13); if (txt) label(ctx, txt, x, y + s * 0.75 + 15, DIM, 10, 'center', 500); };
    const gam = (x, y, a) => { ctx.fillStyle = 'rgba(255,211,138,.12)'; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke(); label(ctx, a ? G.up : G.lo, x, y, GOLD, 12); };
    const arrow = (x0, y0, x1, y1) => { ctx.strokeStyle = 'rgba(200,210,230,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); ctx.fillStyle = 'rgba(200,210,230,.7)'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 7 * Math.cos(a - 0.4), y1 - 7 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 7 * Math.cos(a + 0.4), y1 - 7 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill(); };
    const r0 = D.rows[0], xa = sw * 0.3, xb = sw * 0.7;
    label(ctx, r0.label, 10, rowY(0) - rh * 0.4, DIM, 11, 'left');
    node(xa, rowY(0), r0.a); node(xb, rowY(0), r0.b); label(ctx, '×', sw / 2, rowY(0), GOLD, 18);
    const gOf = n => n === 2 ? [1] : n === 0 ? [0] : [1, 0];
    const gA = gOf(r0.a), gB = gOf(r0.b);
    label(ctx, 'gametes', 10, rowY(1) - rh * 0.3, DIM, 11, 'left');
    gA.forEach((a, k) => { const x = xa + (k - (gA.length - 1) / 2) * 34; arrow(xa, rowY(0) + s, x, rowY(1) - 16); gam(x, rowY(1), a); });
    gB.forEach((a, k) => { const x = xb + (k - (gB.length - 1) / 2) * 34; arrow(xb, rowY(0) + s, x, rowY(1) - 16); gam(x, rowY(1), a); });
    // the offspring classes and their shares
    const cls = [2, 1, 0].filter(n => D.k1[n] > 0);
    label(ctx, p.dcross === 'pure' ? 'F1 (first generation)' : 'Offspring', 10, rowY(2) - rh * 0.4, DIM, 11, 'left');
    cls.forEach((n, k) => { const x = sw * (0.5 + (k - (cls.length - 1) / 2) * 0.22); arrow(sw / 2, rowY(1) + 16, x, rowY(2) - s); node(x, rowY(2), n, pct(D.k1[n])); });
    if (p.dcross === 'pure') {
      label(ctx, 'F1 × F1 (self-pollinated)', 10, rowY(3) - rh * 0.3, DIM, 11, 'left');
      [-1, 1].forEach(sg => [1, 0].forEach((a, k) => { const x = sw / 2 + sg * sw * 0.12 + (k - 0.5) * 34; arrow(sw / 2, rowY(2) + s + 16, x, rowY(3) - 16); gam(x, rowY(3), a); }));
      label(ctx, 'F2 (second generation)', 10, rowY(4) - rh * 0.4, DIM, 11, 'left');
      [2, 1, 0].forEach((n, k) => { const x = sw * (0.5 + (k - 1) * 0.22); arrow(sw / 2, rowY(3) + 16, x, rowY(4) - s); node(x, rowY(4), n, pct(D.k2[n]) + (n === 1 ? ' (both kinds of gamete)' : '')); });
      const M = G.mendel; if (!Ly.narrow) label(ctx, 'Mendel counted ' + M[0] + ' : ' + M[1] + ' = ' + f2(M[0] / M[1]) + ' : 1', sw - 10, rowY(4) - rh * 0.4, GOLD, 11, 'right');
    }
  }
  function stagePedigree(S, g, Ly) {
    const p = S.p, ctx = g.ctx, sw = Ly.sw, H = g.h, ped = S.ped, d = ped.dogs, top = Ly.HD + 46, s = Math.min(30, sw / 22);
    const genY = [top + 20, top + (H - top) * 0.42, top + (H - top) * 0.76];
    const pos = []; pos[0] = [sw * 0.4, genY[0]]; pos[1] = [sw * 0.6, genY[0]];
    [0.14, 0.3, 0.62, 0.46].forEach((fx, k) => { pos[2 + k] = [sw * fx, genY[1]]; }); pos[6] = [sw * 0.84, genY[1]];
    for (let k = 0; k < 5; k++) pos[7 + k] = [sw * (0.47 + k * 0.1), genY[2]];
    ctx.strokeStyle = 'rgba(200,210,230,.7)'; ctx.lineWidth = 1.5;
    const couple = (a, b, kids) => { const [ax, ay] = pos[a], [bx] = pos[b], mx = (ax + bx) / 2; ctx.beginPath(); ctx.moveTo(ax + s / 2, ay); ctx.lineTo(bx - s / 2, ay); ctx.moveTo(mx, ay); ctx.lineTo(mx, ay + (pos[kids[0]][1] - ay) / 2); const yb = ay + (pos[kids[0]][1] - ay) / 2, xs = kids.map(k => pos[k][0]); ctx.moveTo(Math.min(mx, ...xs), yb); ctx.lineTo(Math.max(mx, ...xs), yb); kids.forEach(k => { ctx.moveTo(pos[k][0], yb); ctx.lineTo(pos[k][0], pos[k][1] - s / 2); }); ctx.stroke(); };
    couple(0, 1, [2, 3, 4, 5]); couple(4, 6, [7, 8, 9, 10, 11]);
    const reorder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    // dogs: index in d → pos index (II-5 is d[6] at pos[6]; II-1..4 are d[2..5])
    reorder.forEach(i => {
      const dog = d[i], [x, y] = pos[i], fill = dog.choc ? '#7A4A2A' : '#16161A';
      ctx.fillStyle = fill; ctx.strokeStyle = '#E8E8F0'; ctx.lineWidth = 1.6; ctx.beginPath(); if (dog.sex === 'm') ctx.rect(x - s / 2, y - s / 2, s, s); else ctx.arc(x, y, s / 2, 0, TAU); ctx.fill(); ctx.stroke();
      label(ctx, dog.id, x, y - s / 2 - 9, DIM, 9.5, 'center', 600);
      const poss = ped.infer.poss[i], txt = poss.length === 1 ? (poss[0] === 2 ? 'BB' : poss[0] === 1 ? 'Bb' : 'bb') : 'BB or Bb';
      label(ctx, txt, x, y + s / 2 + 11, poss.length === 1 ? (poss[0] === 1 ? GOLD : LIGHT) : DIM, 11);
      if (p.reveal) label(ctx, '(' + (dog.g === 2 ? 'BB' : dog.g === 1 ? 'Bb' : 'bb') + ')', x, y + s / 2 + 25, '#8FD18B', 9.5, 'center', 600);
    });
    label(ctx, 'Labradors: B black is dominant to b chocolate (TYRP1); ■ male ● female', sw / 2, Ly.HD + 18, LIGHT, 11);
    label(ctx, 'what each dog must be, from the colours alone (' + ped.infer.count + (ped.infer.count === 1 ? ' way' : ' ways') + ' the family could be)', sw / 2, H - 36, GOLD, 10.5);
  }

  /* ---------- Punnett squares ---------- */
  function stagePunnett(S, g, Ly) {
    const p = S.p, ctx = g.ctx, sw = Ly.sw, H = g.h, di = p.pmode === 'di', top = Ly.HD + 30;
    const shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1);
    const g1 = di ? 'R' : p.pgene, G1 = GENES[g1], G2 = GENES.I;
    const gamsOf = (n1, n2) => { const a = n1 === 2 ? [1] : n1 === 0 ? [0] : [1, 0]; if (!di) return a.map(x => [x]); const b = n2 === 2 ? [1] : n2 === 0 ? [0] : [1, 0]; const o = []; a.forEach(x => b.forEach(y => o.push([x, y]))); return o; };
    const gf = gamsOf(p.pf, p.pf2), gm = gamsOf(p.pm, p.pm2);
    const gName = gm_ => (gm_[0] ? G1.up : G1.lo) + (di ? (gm_[1] ? G2.up : G2.lo) : '');
    const size = Math.max(60, Math.min(sw * (Ly.narrow ? 0.9 : 0.55), H - top - 60)), x0 = 14 + 40, y0 = top + 36, cw = size / Math.max(gf.length, gm.length), chh = cw;
    label(ctx, 'pollen →', x0 + cw * gf.length / 2, top + 6, '#9CC8FF', 11); label(ctx, 'eggs ↓', 12, y0 - 18, '#F4A6B6', 11, 'left');
    gf.forEach((q, i) => label(ctx, gName(q), x0 + (i + 0.5) * cw, y0 - 12, '#9CC8FF', 13));
    gm.forEach((q, j) => label(ctx, gName(q), x0 - 20, y0 + (j + 0.5) * chh, '#F4A6B6', 13));
    // count offspring per cell: an offspring's cell is the pair of gametes that made it (re-drawn from its genotype)
    const cellCount = {}; const r = rng(p.seed * 17 + 1);
    for (let k = 0; k < shown; k++) { const o = S.off[k], fi = Math.floor(hash(k, 3) * gf.length), cands = []; gf.forEach((a, i) => gm.forEach((b, j) => { if (a[0] + b[0] === o[0] && (!di || a[1] + b[1] === o[1])) cands.push(i + ',' + j); })); const c = cands[Math.floor(hash(k, 5) * cands.length)] || (fi + ',0'); cellCount[c] = (cellCount[c] || 0) + 1; }
    void r;
    gf.forEach((a, i) => gm.forEach((b, j) => {
      const x = x0 + i * cw, y = y0 + j * chh, n1 = a[0] + b[0], n2 = di ? a[1] + b[1] : 0, domA = n1 > 0, domB = n2 > 0;
      ctx.fillStyle = 'rgba(30,40,60,.85)'; ctx.fillRect(x, y, cw - 2, chh - 2); ctx.strokeStyle = 'rgba(160,180,210,.5)'; ctx.strokeRect(x, y, cw - 2, chh - 2);
      const gtxt = (n1 === 2 ? G1.up + G1.up : n1 === 1 ? G1.up + G1.lo : G1.lo + G1.lo) + (di ? ' ' + (n2 === 2 ? G2.up + G2.up : n2 === 1 ? G2.up + G2.lo : G2.lo + G2.lo) : '');
      label(ctx, gtxt, x + cw / 2, y + 12, LIGHT, di ? 10 : 13);
      const ic = Math.min(cw, chh) * 0.36;
      if (di) HH().peaSeed(ctx, x + cw / 2, y + chh * 0.55, ic * 0.5, { col: domB ? 'yellow' : 'green', shape: domA ? 'round' : 'wrinkled', seed: i * 4 + j });
      else traitIcon(ctx, g1, domA, x + cw / 2, y + chh * 0.52, ic);
      label(ctx, String(cellCount[i + ',' + j] || 0), x + cw - 8, y + chh - 10, GOLD, di ? 9.5 : 11, 'right');
    }));
    // the harvest, sorted by what the offspring look like
    if (!Ly.narrow) {
      const hx = x0 + cw * gf.length + 40, hw = sw - hx - 10, cls = classCounts(S.off, p, shown), ex = S.exp, names = di ? [G1.dom + ', ' + G2.dom, G1.dom + ', ' + G2.rec, G1.rec + ', ' + G2.dom, G1.rec + ', ' + G2.rec] : [G1.dom, G1.rec];
      label(ctx, 'the harvest: ' + shown + ' offspring', hx + hw / 2, top + 6, LIGHT, 12);
      names.forEach((nm, k) => {
        const y = y0 + k * (di ? 56 : 90), domA = di ? k < 2 : k === 0, domB = di ? k % 2 === 0 : true;
        if (di) HH().peaSeed(ctx, hx + 14, y + 16, 10, { col: domB ? 'yellow' : 'green', shape: domA ? 'round' : 'wrinkled' }); else traitIcon(ctx, g1, domA, hx + 18, y + 20, 28);
        label(ctx, nm, hx + 44, y + 8, LIGHT, 11, 'left'); label(ctx, cls[k] + '  (expected ' + f1(ex[k] * shown) + ')', hx + 44, y + 24, GOLD, 11, 'left', 600);
        const bw_ = Math.max(0, hw - 54) * (shown ? cls[k] / shown : 0); ctx.fillStyle = 'rgba(255,211,138,.5)'; ctx.fillRect(hx + 44, y + 34, bw_, 7); ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(hx + 44 + Math.max(0, hw - 54) * ex[k], y + 31); ctx.lineTo(hx + 44 + Math.max(0, hw - 54) * ex[k], y + 44); ctx.stroke();
      });
    }
  }

  /* ---------- the notebook ---------- */
  function notebookCard(S, g, Ly) {
    const K = kit(), ctx = g.ctx, sl = K.cardSlot(g, S, 'Notebook', Ly.cardW, { x: g.w - Ly.cardW - 12, y: Ly.HD + 6 });
    if (!sl) return;
    const rows = notebook(S), h = 34 + rows.length * 19 + 10; K.card(ctx, sl.x, sl.y, sl.w, h);
    ctx.font = sans(12, 700); ctx.fillStyle = LIGHT; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(notebookTitle(S), sl.x + 10, sl.y + 8);
    rows.forEach((r, i) => { const yy = sl.y + 30 + i * 19; ctx.font = mono(10); ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText(K.fitText(ctx, r[0], sl.w * 0.5), sl.x + 10, yy); ctx.font = mono(10, 700); ctx.fillStyle = r[2] || LIGHT; ctx.textAlign = 'right'; ctx.fillText(K.fitText(ctx, String(r[1]), sl.w * 0.5 - 14), sl.x + sl.w - 10, yy); });
  }
  const notebookTitle = S => ({ sexual: 'Meiosis, counted', resemble: 'The siblings', asexual: 'The clones', compare: 'The lake, this generation', genes: 'Genome facts', diagrams: S.p.dview === 'pedigree' ? 'Reading the pedigree' : 'The diagram', punnett: 'Observed and expected' })[S.p.setup];
  function notebook(S) {
    const p = S.p;
    if (p.setup === 'sexual') { const share = shareFrom(S.mf.gam[S.pi], 'F1'); return [['chromosome pairs (pea)', '7'], ['kinds of gamete, no crossing over', '2⁷ = 128'], ['kinds of zygote from two parents', '128 × 128 = 16,384'], ['chiasmata this round (pollen cell)', String(S.mf.rec.reduce((s, r) => s + r.xo.length, 0))], ['this pollen nucleus from its grandfather', pct(share), SRC.F1], ['… from its grandmother', pct(1 - share), SRC.F2], ['the zygote from each parent', '50 % + 50 %', GOLD], ['humans: 23 pairs → kinds of gamete', '8,388,608']]; }
    if (p.setup === 'resemble') { const s = S.sib; return [['children', String(S.kids.length)], ['different-looking children', String(s.distinct), GOLD], ['looking exactly like a parent', String(s.matchParent)], ['traits shared with the mother', f1(s.likeMum) + ' of 7'], ['traits shared with the father', f1(s.likeDad) + ' of 7'], ['sibling pairs alike, observed', pct(s.alike)], ['sibling pairs alike, expected', pct(s.theoryK[7]), GOLD]]; }
    if (p.setup === 'asexual') { const b = S.bed, cl = b.plants.length - 1, maxm = Math.max(0, ...b.plants.map(q => q.mut)); return [['plants in the bed', String(b.plants.length)], ['runner daughters (clones)', String(cl)], ['genes shared with the mother', 'all of them', '#8FD18B'], ['new mutations per generation', f1(b.lam)], ['most changed letters in one clone', String(maxm)], ['… out of', '480 million'], ['seedlings: genes shared', 'half', '#F4A6B6'], ['seedlings with yellow fruit', b.seedlings.filter(q => q.fruit === 0).length + ' of 6']]; }
    if (p.setup === 'compare') { const row = S.pop[Math.floor(S.gen)], a = row.lakes; if (a.length === 2) return [['sexual lake', a[0].N + ' snails'], ['clone lake', a[1].N + ' snails'], ['sexual: males', String(a[0].males)], ['infected, sexual', pct(a[0].infSex)], ['infected, clones', pct(a[1].infAs)], ['genotypes, sexual', String(a[0].typesSex)], ['genotypes, clones', String(a[1].typesAs)]]; const k = a[0]; return [['snails', String(k.N)], ['sexual', k.nSex + ' (' + k.males + ' males)'], ['clonal', String(k.nAs), '#FFB27A'], ['clonal share', pct(k.N ? k.nAs / k.N : 0), GOLD], ['clones still alive', k.clones + ' of 8'], ['infected, sexual', pct(k.infSex)], ['infected, clonal', pct(k.infAs)], ['genotypes: sexual / clonal', k.typesSex + ' / ' + k.typesAs]]; }
    if (p.setup === 'genes') return [['pea chromosome pairs', '7 (2n = 14)'], ['letters in one set', '~4.45 billion'], ['genes', '~45,000'], ['human pairs', '23'], ['human letters', '~3.1 billion'], ['human protein genes', '~20,000'], ['this gene', p.gene + ': ' + GENES[p.gene].trait, GOLD], ['on chromosome pair', String(GENES[p.gene].chr + 1) + ' (Blixt’s numbering)']];
    if (p.setup === 'diagrams') { if (p.dview === 'pedigree') { const inf = S.ped.infer; const known = inf.poss.filter(q => q.length === 1).length; return [['dogs', '12'], ['chocolate (must be bb)', String(S.ped.dogs.filter(q => q.choc).length)], ['genotype certain', known + ' of 12', GOLD], ['carriers proved (Bb)', String(inf.poss.filter(q => q.length === 1 && q[0] === 1).length)], ['ways the family could be', String(inf.count)]]; } const D = S.dg; return [['trait', D.G.trait], ['cross', D.gt(D.rows[0].a) + ' × ' + D.gt(D.rows[0].b)], ['offspring ' + D.gt(2), pct(D.k1[2])], ['offspring ' + D.gt(1), pct(D.k1[1])], ['offspring ' + D.gt(0), pct(D.k1[0])]].concat(D.k2 ? [['F2 ' + D.G.dom + ' : ' + D.G.rec, '3 : 1', GOLD], ['Mendel’s F2', D.G.mendel[0] + ' : ' + D.G.mendel[1]]] : []); }
    const shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1), cls = classCounts(S.off, p, shown), cs = chiSquare(cls, S.exp);
    const rows = cls.map((c, k) => [['dominant', 'recessive'][k] || ['both dominant', 'first dominant', 'second dominant', 'both recessive'][k], c + ' (exp ' + f1(S.exp[k] * shown) + ')']);
    if (p.pmode === 'di') rows.forEach((r, k) => { r[0] = ['round yellow', 'round green', 'wrinkled yellow', 'wrinkled green'][k]; });
    return rows.concat([['chi-square (' + cs.df + ' df)', f2(cs.chi)], ['p', cs.p < 0.001 ? '< 0.001' : f2(cs.p), cs.p < 0.05 ? '#E8907F' : '#8FD18B']]).concat(p.mendel && p.pf === 1 && p.pm === 1 && (p.pmode !== 'di' || (p.pf2 === 1 && p.pm2 === 1)) ? [['Mendel’s counts', p.pmode === 'di' ? '315 : 108 : 101 : 32' : GENES[p.pgene].mendel.join(' : '), GOLD]] : []);
  }
  function headerOf(S) {
    const p = S.p;
    if (p.setup === 'sexual') return ['Meiosis halves the chromosomes, at random; fertilisation pairs them again', (p.cross ? 'crossing over on' : 'crossing over off') + ' · showing ' + p.nShow + ' of the pea’s 7 chromosome pairs · round ' + (S.round + 1), 'each colour is a grandparent: every gamete carries a new mixture of them'];
    if (p.setup === 'resemble') { const s = S.sib; return [S.kids.length + ' siblings: ' + s.distinct + ' different-looking, ' + s.matchParent + ' identical to a parent', PARENTS[p.parents].label, 'every trait each child shows came from one parent or the other — in a new combination']; }
    if (p.setup === 'asexual') { const b = S.bed; return ['One plant, ' + b.plants.length + ' plants: every runner daughter is a clone', p.runners + ' runners a plant each season · ' + p.gens + ' season' + (p.gens === 1 ? '' : 's') + ' · new mutations about ' + f1(b.lam) + ' letters a generation', 'mitosis copies the chromosomes exactly — the clones share all their genes; seedlings share half'];
    }
    if (p.setup === 'compare') { const row = S.pop[Math.floor(S.gen)], a = row.lakes; if (a.length === 2) return ['Two lakes, generation ' + row.g + ': sexual ' + a[0].N + ' snails, clonal ' + a[1].N, 'each female lays ' + B_ + ' young · half of a sexual female’s are sons, so a clone line grows twice as fast', p.env === 'parasites' ? 'parasites build up on the common genotypes' : p.env === 'warming' ? 'the lake warms: the best shell trait moves' : 'nothing changes in this lake']; const k = a[0]; return [k.N ? 'Generation ' + row.g + ': clones are ' + pct(k.nAs / k.N) + ' of the lake' : 'Generation ' + row.g + ': the lake is empty — the clones won, then could not keep up', p.env === 'parasites' ? 'parasites castrate the snails of common genotypes · strength ' + f2(p.vir) : p.env === 'warming' ? 'warming: the best shell trait rises ' + f2(p.warm) + ' a generation' : 'a stable lake: no parasites, no change', 'clones pay no cost of males — sex pays it, and buys new combinations']; }
    if (p.setup === 'genes') { const G = GENES[p.gene]; return ['A gene is a stretch of DNA: ' + G.up + ' / ' + G.lo + ' decides ' + G.trait, 'genotype ' + (p.al1 + p.al2 === 2 ? G.up + G.up : p.al1 + p.al2 === 1 ? G.up + G.lo : G.lo + G.lo) + ' → ' + (p.al1 + p.al2 ? G.dom : G.rec), GENEFACT[p.gene].refs]; }
    if (p.setup === 'diagrams') { if (p.dview === 'pedigree') return ['A Labrador family tree: chocolate dogs must be bb', 'a black dog with a chocolate parent or pup must carry b', 'genotypes found by trying every way the family could be']; const D = S.dg; return ['Inheritance diagram: ' + D.G.trait + ' (' + D.G.dom + ' / ' + D.G.rec + ')', 'parents ' + D.gt(D.rows[0].a) + ' × ' + D.gt(D.rows[0].b) + ' → gametes → offspring', D.k2 ? 'F2: 1 ' + D.gt(2) + ' : 2 ' + D.gt(1) + ' : 1 ' + D.gt(0) + ' — three ' + D.G.dom + ' to one ' + D.G.rec : 'each parent passes on one of its two copies']; }
    const di = p.pmode === 'di', shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1);
    return [di ? 'A dihybrid square: round/wrinkled and yellow/green, 16 boxes, 9 : 3 : 3 : 1' : 'A Punnett square for ' + GENES[p.pgene].trait, 'pollen along the top, eggs down the side · each box one way to combine them, each equally likely', shown + ' offspring so far, of ' + p.nOff];
  }

  function onPointer(S, x, y, down, type) { if (type === 'pointerdown' && kit() && kit().chipHit(S, x, y)) return true; return false; }

  /* ============================================================
     9. PLOTS, READOUTS, EQUATION
     ============================================================ */
  function keyBand(g, items, note) { const K = kit(); return K ? K.plotKey(g, items, note) : { t: 14, draw() {} }; }
  const plot1 = {
    title: S => ({ sexual: 'Kinds of gamete against chromosome pairs (no crossing over)', resemble: 'Children showing the dominant form, gene by gene', asexual: 'Plants in the bed, season by season', compare: S.p.arr === 'apart' ? 'Snails in each lake' : 'The clones’ share of the lake', genes: 'Dominance: how much working protein each genotype makes', diagrams: 'The offspring of this cross', punnett: 'Observed share against expected, as offspring arrive' })[S.p.setup],
    draw(S, g) {
      const p = S.p;
      if (p.setup === 'sexual') {
        const Kk = keyBand(g, [{ c: '#FFD38A', label: '2ⁿ kinds of gamete' }, { c: '#8FD18B', dot: true, label: 'pea, 7 pairs' }, { c: '#7FB7F2', dot: true, label: 'human, 23 pairs' }]);
        const P = g.Plot({ xmin: 1, xmax: 24, ymin: 0, ymax: 8, xlabel: 'chromosome pairs n', ylabel: 'kinds (log)', yticks: [0, 2, 4, 6, 8], yfmt: v => '10' + ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'][Math.round(v)], pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const pts = []; for (let n = 1; n <= 24; n++) pts.push([n, n * Math.LN2 / Math.LN10]);
        P.clip(() => { P.line(pts, '#FFD38A', 2.4); P.dot(7, Math.log10(128), 5, '#8FD18B', '#FFFFFF'); P.dot(23, Math.log10(8388608), 5, '#7FB7F2', '#FFFFFF'); P.tag(7, Math.log10(128), '128', '#8FD18B', 'left', -10); P.tag(23, Math.log10(8388608), '8.4 million', '#7FB7F2', 'right', -10); P.vline(p.nShow, 'rgba(255,255,255,.35)', [2, 3]); });
        return;
      }
      if (p.setup === 'resemble') {
        const s = S.sib, Kk = keyBand(g, [{ c: '#FFD38A', box: true, label: 'observed' }, { c: '#FFFFFF', label: 'expected' }]);
        const P = g.Plot({ xmin: 0, xmax: 7, ymin: 0, ymax: 1.05, xlabel: 'gene', ylabel: 'dominant form', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5], xfmt: v => GKEYS[Math.floor(v)] || '', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => GKEYS.forEach((k, i) => { P.bar(i + 0.5, s.domShare[i], 0.3, 0, g.alpha(GENES[k].col, 0.7)); P.line([[i + 0.15, s.domTheory[i]], [i + 0.85, s.domTheory[i]]], '#FFFFFF', 2); }));
        return;
      }
      if (p.setup === 'asexual') {
        const Kk = keyBand(g, [{ c: '#8FD18B', label: '(1 + r)ᵍ with your r' }, { c: '#8FA3C0', label: 'r = 1, 3', dash: [4, 3] }, { c: '#FFFFFF', dot: true, label: 'your bed' }]);
        const hi = clonesAfter(3, 3) * 1.05, P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: hi, xlabel: 'seasons', ylabel: 'plants', xticks: [0, 1, 2, 3], pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const curve = r => { const o = []; for (let k = 0; k <= 30; k++) o.push([k / 10, clonesAfter(r, k / 10)]); return o; };
        P.clip(() => { [1, 3].forEach(r => P.line(curve(r), '#8FA3C0', 1.5, [4, 3])); P.line(curve(p.runners), '#8FD18B', 2.6); P.dot(p.gens, S.bed.plants.length, 5.5, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'compare') {
        const H_ = S.pop, gNow = Math.floor(S.gen);
        if (p.arr === 'apart') {
          const Kk = keyBand(g, [{ c: '#9CC8FF', label: 'sexual lake' }, { c: '#FFB27A', label: 'clonal lake' }]);
          const P = g.Plot({ xmin: 0, xmax: POPG, ymin: 0, ymax: p.K * 1.08, xlabel: 'generation', ylabel: 'snails', pad: { t: Kk.t } }).frame(); Kk.draw(P);
          P.clip(() => { P.line(H_.slice(0, gNow + 1).map(r => [r.g, r.lakes[0].N]), '#9CC8FF', 2.2); P.line(H_.slice(0, gNow + 1).map(r => [r.g, r.lakes[1].N]), '#FFB27A', 2.2); P.vline(gNow, 'rgba(255,255,255,.35)', [2, 3]); });
          return;
        }
        const Kk = keyBand(g, [{ c: '#FFB27A', label: 'clones, this run' }, { c: '#8FA3C0', label: 'two-fold advantage alone', dash: [4, 3] }]);
        const P = g.Plot({ xmin: 0, xmax: POPG, ymin: 0, ymax: 1.02, xlabel: 'generation', ylabel: 'clonal share', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        const th = []; for (let k = 0; k <= 40; k++) th.push([k, shareAfter(p.p0, k)]);
        P.clip(() => { P.line(th, '#8FA3C0', 1.5, [4, 3]); P.line(H_.slice(0, gNow + 1).map(r => [r.g, r.lakes[0].N ? r.lakes[0].nAs / r.lakes[0].N : 0]), '#FFB27A', 2.4); P.vline(gNow, 'rgba(255,255,255,.35)', [2, 3]); });
        return;
      }
      if (p.setup === 'genes') {
        const Kk = keyBand(g, [{ c: '#8FD18B', box: true, label: 'working protein made' }, { c: '#FFD38A', label: 'enough for the dominant trait', dash: [4, 3] }]);
        const G = GENES[p.gene], P = g.Plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 110, xlabel: 'genotype', ylabel: '% of a ' + G.up + G.up + ' plant', xticks: [0.5, 1.5, 2.5], xfmt: v => [G.up + G.up, G.up + G.lo, G.lo + G.lo][Math.floor(v)] || '', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { [100, 50, 0].forEach((v, i) => P.bar(i + 0.5, v, 0.3, 0, (2 - i) === p.al1 + p.al2 ? '#8FD18B' : g.alpha('#8FD18B', 0.4))); P.hline(30, '#FFD38A', [4, 3]); });
        return;
      }
      if (p.setup === 'diagrams') {
        if (p.dview === 'pedigree') {
          const inf = S.ped.infer, Kk = keyBand(g, [{ c: '#FFD38A', box: true, label: 'genotype certain' }, { c: '#8FA3C0', box: true, label: 'BB or Bb' }]);
          const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 1.05, xlabel: 'dog', ylabel: 'certain?', xticks: S.ped.dogs.map((_, i) => i + 0.5), xfmt: v => (S.ped.dogs[Math.floor(v)] || {}).id || '', yfmt: v => v > 0.5 ? 'yes' : 'no', pad: { t: Kk.t } }).frame(); Kk.draw(P);
          P.clip(() => inf.poss.forEach((q, i) => P.bar(i + 0.5, q.length === 1 ? 1 : 0.5, 0.3, 0, q.length === 1 ? '#FFD38A' : '#8FA3C0')));
          return;
        }
        const D = S.dg, sets = D.k2 ? [['F1', D.k1], ['F2', D.k2]] : [['offspring', D.k1]];
        const Kk = keyBand(g, [{ c: '#FFD38A', box: true, label: D.gt(2) }, { c: '#C78AE0', box: true, label: D.gt(1) }, { c: '#7FB7F2', box: true, label: D.gt(0) }]);
        const P = g.Plot({ xmin: 0, xmax: sets.length * 3, ymin: 0, ymax: 1.05, xlabel: 'generation and genotype', ylabel: 'share', xticks: sets.map((_, i) => i * 3 + 1.5), xfmt: v => (sets[Math.floor(v / 3)] || [''])[0], yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => sets.forEach(([, k], i) => [2, 1, 0].forEach((n, j) => P.bar(i * 3 + j + 0.5, k[n], 0.35, 0, ['#FFD38A', '#C78AE0', '#7FB7F2'][j]))));
        return;
      }
      // punnett: running share of the first class against its expectation, offspring by offspring
      const ex = S.exp, n = p.nOff, shown = Math.min(n, Math.floor(n * clamp(S.t / 5, 0, 1)) + 1), pts = [], step_ = Math.max(1, Math.floor(n / 200));
      const last = p.pmode === 'di' ? 3 : 1;
      let c = 0; for (let k = 0; k < shown; k++) { const o = S.off[k], isLast = p.pmode === 'di' ? (o[0] === 0 && o[1] === 0) : o[0] === 0; if (isLast) c++; if (k % step_ === 0 || k === shown - 1) pts.push([k + 1, c / (k + 1)]); }
      const Kk = keyBand(g, [{ c: '#FFD38A', label: 'observed share of the recessive class' }, { c: '#FFFFFF', label: 'expected', dash: [4, 3] }]);
      const P = g.Plot({ xmin: 1, xmax: n, ymin: 0, ymax: Math.min(1, ex[last] * 2.5 + 0.05), xlabel: 'offspring counted', ylabel: 'share', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => { P.hline(ex[last], '#FFFFFF', [4, 3]); P.line(pts, '#FFD38A', 2.2); });
    },
    hover(S, x) { return [{ label: 'x', value: x.toFixed(1) }]; }
  };
  const plot2 = {
    title: S => ({ sexual: 'How much of a gamete comes from the grandfather? 300 gametes', resemble: 'Chance two siblings look alike, as more genes are counted', asexual: 'How alike each offspring is to its mother', compare: S.p.env === 'parasites' ? 'Infection: sexual and clonal snails' : S.p.env === 'warming' ? 'The shell trait against the moving best' : 'Genotypes in the lake', genes: 'Where Mendel’s seven genes sit', diagrams: S.p.dview === 'pedigree' ? 'Possible genotypes, dog by dog' : 'Mendel’s F2 ratios, all seven traits', punnett: 'Counts against expectation' })[S.p.setup],
    draw(S, g) {
      const p = S.p;
      if (p.setup === 'sexual') {
        const Kk = keyBand(g, [{ c: '#8FA3C0', box: true, label: 'no crossing over' }, { c: '#FFD38A', box: true, label: 'with crossing over' }]);
        const bins = 20, hist = S.spread.map(v => { const h = new Array(bins).fill(0); v.forEach(x => h[Math.min(bins - 1, Math.floor(x * bins))]++); return h; }), hi = Math.max(...hist.flat()) * 1.1;
        const P = g.Plot({ xmin: 0, xmax: 1, ymin: 0, ymax: hi, xlabel: 'share from the grandfather', ylabel: 'gametes', xfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => hist.forEach((h, j) => h.forEach((c, i) => P.bar((i + 0.25 + j * 0.5) / bins, c, 0.2 / bins, 0, j ? '#FFD38A' : '#8FA3C0'))));
        return;
      }
      if (p.setup === 'resemble') {
        const s = S.sib, Kk = keyBand(g, [{ c: '#FFD38A', label: 'expected (genes sorting independently)' }, { c: '#FFFFFF', dot: true, label: 'your siblings' }]);
        const P = g.Plot({ xmin: 0, xmax: 7, ymin: 0, ymax: 1.05, xlabel: 'genes counted', ylabel: 'pairs alike', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(s.theoryK.map((v, k) => [k, v]), '#FFD38A', 2.4); for (let k = 1; k <= 7; k++) P.dot(k, s.alikeK[k], 4, '#FFFFFF', 'rgba(0,0,0,.5)'); });
        return;
      }
      if (p.setup === 'asexual') {
        const Kk = keyBand(g, [{ c: '#8FD18B', box: true, label: 'runner clones' }, { c: '#F4A6B6', box: true, label: 'seedlings' }]);
        const items = [['clones', 1, '#8FD18B']].concat(p.sow ? S.bed.seedlings.map((s, k) => ['seedling ' + (k + 1), (s.fruit === 1 ? 0.5 : 0.25) + (s.run === 1 ? 0.5 : 0.25), '#F4A6B6']) : []);
        const P = g.Plot({ xmin: 0, xmax: items.length, ymin: 0, ymax: 1.08, xlabel: 'offspring', ylabel: 'genes the same', xticks: items.map((_, i) => i + 0.5), xfmt: v => (items[Math.floor(v)] || [''])[0].replace('seedling ', 's'), yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => items.forEach((it, i) => P.bar(i + 0.5, it[1], 0.3, 0, it[2])));
        return;
      }
      if (p.setup === 'compare') {
        const H_ = S.pop, gNow = Math.floor(S.gen), a = H_.slice(0, gNow + 1), li = p.arr === 'apart' ? 1 : 0;
        if (p.env === 'warming') {
          const Kk = keyBand(g, [{ c: '#FFFFFF', label: 'the best trait', dash: [4, 3] }, { c: '#9CC8FF', label: 'sexual snails' }, { c: '#FFB27A', label: 'clones' }]);
          const P = g.Plot({ xmin: 0, xmax: POPG, ymin: 0, ymax: 12, xlabel: 'generation', ylabel: 'shell trait z', pad: { t: Kk.t } }).frame(); Kk.draw(P);
          P.clip(() => { P.line(H_.map(r => [r.g, r.lakes[0].theta]), '#FFFFFF', 1.5, [4, 3]); P.line(a.filter(r => !isNaN(r.lakes[0].zSex)).map(r => [r.g, r.lakes[0].zSex]), '#9CC8FF', 2.2); P.line(a.filter(r => !isNaN(r.lakes[li].zAs)).map(r => [r.g, r.lakes[li].zAs]), '#FFB27A', 2.2); });
          return;
        }
        if (p.env === 'parasites') {
          const Kk = keyBand(g, [{ c: '#9CC8FF', label: 'sexual infected' }, { c: '#FFB27A', label: 'clonal infected' }]);
          const P = g.Plot({ xmin: 0, xmax: POPG, ymin: 0, ymax: 1, xlabel: 'generation', ylabel: 'infected', yfmt: v => Math.round(v * 100) + '%', pad: { t: Kk.t } }).frame(); Kk.draw(P);
          P.clip(() => { P.line(a.map(r => [r.g, r.lakes[0].infSex]), '#9CC8FF', 2); P.line(a.filter(r => r.lakes[li].nAs > 0).map(r => [r.g, r.lakes[li].infAs]), '#FFB27A', 2); });
          return;
        }
        const Kk = keyBand(g, [{ c: '#9CC8FF', label: 'sexual genotypes' }, { c: '#FFB27A', label: 'clonal genotypes' }]);
        const hi = Math.max(10, ...a.map(r => r.lakes[0].typesSex)) * 1.1, P = g.Plot({ xmin: 0, xmax: POPG, ymin: 0, ymax: hi, xlabel: 'generation', ylabel: 'different genotypes', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.line(a.map(r => [r.g, r.lakes[0].typesSex]), '#9CC8FF', 2); P.line(a.map(r => [r.g, r.lakes[li].typesAs]), '#FFB27A', 2); });
        return;
      }
      if (p.setup === 'genes') {
        const Kk = keyBand(g, GKEYS.map(k => ({ c: GENES[k].col, dot: true, label: k })));
        const P = g.Plot({ xmin: 0, xmax: 7, ymin: 0, ymax: 1.9, xlabel: 'chromosome pair (Blixt’s numbering)', ylabel: 'map position (M)', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5], xfmt: v => String(Math.floor(v) + 1), pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { CHR_LEN.forEach((L_, c) => P.line([[c + 0.5, 0], [c + 0.5, L_]], 'rgba(200,210,230,.6)', 6)); GKEYS.forEach(k => { const G = GENES[k]; P.dot(G.chr + 0.5, G.at * CHR_LEN[G.chr], k === p.gene ? 7 : 5, G.col, '#FFFFFF'); P.tag(G.chr + 0.5, G.at * CHR_LEN[G.chr], k, G.col, 'left', 0); }); });
        return;
      }
      if (p.setup === 'diagrams') {
        if (p.dview === 'pedigree') {
          const Kk = keyBand(g, [{ c: '#16161A', box: true, label: 'black' }, { c: '#7A4A2A', box: true, label: 'chocolate' }]);
          const P = g.Plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 2.6, xlabel: 'dog', ylabel: 'possible', yticks: [0.5, 1.5, 2.5], yfmt: v => ['bb', 'Bb', 'BB'][Math.floor(v)] || '', xticks: S.ped.dogs.map((_, i) => i + 0.5), xfmt: v => (S.ped.dogs[Math.floor(v)] || {}).id || '', pad: { t: Kk.t } }).frame(); Kk.draw(P);
          P.clip(() => S.ped.infer.poss.forEach((q, i) => q.forEach(gg => P.dot(i + 0.5, gg + 0.5, 6, S.ped.dogs[i].choc ? '#7A4A2A' : '#16161A', '#FFFFFF'))));
          return;
        }
        const Kk = keyBand(g, [{ c: '#FFD38A', dot: true, label: 'Mendel’s ratio, dominant : recessive' }, { c: '#FFFFFF', label: '3 : 1', dash: [4, 3] }]);
        const P = g.Plot({ xmin: 0, xmax: 7, ymin: 2, ymax: 3.6, xlabel: 'trait', ylabel: 'ratio : 1', xticks: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5], xfmt: v => GKEYS[Math.floor(v)] || '', pad: { t: Kk.t } }).frame(); Kk.draw(P);
        P.clip(() => { P.hline(3, '#FFFFFF', [4, 3]); GKEYS.forEach((k, i) => { const M = GENES[k].mendel; P.dot(i + 0.5, M[0] / M[1], 5, k === p.dgene ? '#FFD38A' : '#C9D4EA', '#FFFFFF'); }); });
        return;
      }
      const shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1), cls = classCounts(S.off, p, shown), ex = S.exp.map(e => e * shown), n = cls.length;
      const Kk = keyBand(g, [{ c: '#FFD38A', box: true, label: 'observed' }, { c: '#FFFFFF', label: 'expected' }].concat(p.mendel ? [{ c: '#8FD18B', dot: true, label: 'Mendel, scaled' }] : []));
      const M = p.pmode === 'di' ? [315, 108, 101, 32] : GENES[p.pgene].mendel, Mt = M.reduce((a, b) => a + b, 0);
      const hi = Math.max(1, ...cls, ...ex) * 1.15, P = g.Plot({ xmin: 0, xmax: n, ymin: 0, ymax: hi, xlabel: 'class', ylabel: 'offspring', xticks: cls.map((_, i) => i + 0.5), xfmt: v => (p.pmode === 'di' ? ['RY', 'Ry', 'rY', 'ry'] : ['dom', 'rec'])[Math.floor(v)] || '', pad: { t: Kk.t } }).frame(); Kk.draw(P);
      P.clip(() => cls.forEach((c, i) => { P.bar(i + 0.5, c, 0.3, 0, 'rgba(255,211,138,.75)'); P.line([[i + 0.15, ex[i]], [i + 0.85, ex[i]]], '#FFFFFF', 2); if (p.mendel && p.pf === 1 && p.pm === 1 && (p.pmode !== 'di' || (p.pf2 === 1 && p.pm2 === 1))) P.dot(i + 0.5, M[i] / Mt * shown, 4.5, '#8FD18B', '#FFFFFF'); }));
    },
    hover(S, x) { return [{ label: 'x', value: x.toFixed(1) }]; }
  };

  function readouts(S) {
    const p = S.p;
    if (p.setup === 'sexual') { const share = shareFrom(S.mf.gam[S.pi], 'F1'); return [
      { label: 'Stage', value: phaseName(S.ph).split(':')[0], unit: '' },
      { label: 'Chromosome pairs (pea)', value: '7', unit: 'shown ' + p.nShow },
      { label: 'Kinds of gamete (no crossing over)', value: String(gametesKinds(7)), unit: '= 2⁷', flag: 'accent' },
      { label: 'Kinds of zygote from two parents', value: '16,384', unit: '' },
      { label: 'Chiasmata this round', value: String(S.mf.rec.reduce((s, r) => s + r.xo.length, 0)), unit: 'in the pollen cell' },
      { label: 'Pollen nucleus from its grandfather', value: Math.round(share * 100), unit: '%' },
      { label: 'Zygote', value: '7 + 7', unit: 'chromosomes, one set from each parent' },
      { label: 'Zygote seed', value: (shows(S.zyg, 'R') ? 'round' : 'wrinkled') + ', ' + (shows(S.zyg, 'I') ? 'yellow' : 'green'), unit: genoStr(S.zyg, 'R') + ' ' + genoStr(S.zyg, 'I') }]; }
    if (p.setup === 'resemble') { const s = S.sib; return [
      { label: 'Children', value: String(S.kids.length), unit: '' },
      { label: 'Different-looking', value: String(s.distinct), unit: 'of ' + S.kids.length, flag: 'accent' },
      { label: 'Identical to a parent', value: String(s.matchParent), unit: '' },
      { label: 'Traits shared with the mother', value: f1(s.likeMum), unit: 'of 7' },
      { label: 'Traits shared with the father', value: f1(s.likeDad), unit: 'of 7' },
      { label: 'Sibling pairs alike', value: Math.round(s.alike * 100), unit: '% observed' },
      { label: 'Expected', value: (s.theoryK[7] * 100).toFixed(1), unit: '%', flag: 'accent' }]; }
    if (p.setup === 'asexual') { const b = S.bed; return [
      { label: 'Plants', value: String(b.plants.length), unit: '= (1 + ' + p.runners + ')^' + p.gens, flag: 'accent' },
      { label: 'Clones of the mother', value: String(b.plants.length - 1), unit: '' },
      { label: 'Genes shared with her', value: '100', unit: '%' },
      { label: 'New mutations a generation', value: f1(b.lam), unit: 'letters of 480 million' },
      { label: 'Identical letters', value: b.lam > 0 ? (100 - b.lam / 4.8e6).toFixed(7) : '100', unit: '%' },
      { label: 'Seedlings: genes shared', value: '50', unit: '% (half from each parent)' },
      { label: 'Seedlings with yellow fruit', value: String(b.seedlings.filter(q => q.fruit === 0).length), unit: 'of 6' }]; }
    if (p.setup === 'compare') { const row = S.pop[Math.floor(S.gen)], a = row.lakes, k = a[0]; return [
      { label: 'Generation', value: String(row.g), unit: 'of ' + POPG },
      { label: p.arr === 'apart' ? 'Sexual lake' : 'Snails', value: String(k.N), unit: '' },
      { label: p.arr === 'apart' ? 'Clonal lake' : 'Clonal share', value: p.arr === 'apart' ? String(a[1].N) : Math.round((k.N ? k.nAs / k.N : 0) * 100), unit: p.arr === 'apart' ? '' : '%', flag: 'accent' },
      { label: 'Males', value: String(k.males), unit: '' },
      { label: 'Infected, sexual', value: Math.round(k.infSex * 100), unit: '%' },
      { label: 'Infected, clonal', value: Math.round(a[a.length - 1].infAs * 100), unit: '%' },
      { label: 'Genotypes, sexual', value: String(k.typesSex), unit: '' },
      { label: 'Clones alive', value: String(a[a.length - 1].clones), unit: 'of 8' }]; }
    if (p.setup === 'genes') { const G = GENES[p.gene], n2 = p.al1 + p.al2; return [
      { label: 'Gene', value: G.up + ' / ' + G.lo, unit: G.trait },
      { label: 'Genotype', value: n2 === 2 ? G.up + G.up : n2 === 1 ? G.up + G.lo : G.lo + G.lo, unit: '', flag: 'accent' },
      { label: 'Trait', value: n2 ? G.dom : G.rec, unit: '' },
      { label: 'Working copies', value: String(n2), unit: 'of 2' },
      { label: 'Chromosome pair', value: String(G.chr + 1), unit: 'of 7' },
      { label: 'Pea genome', value: '~4.45', unit: 'billion letters' }]; }
    if (p.setup === 'diagrams') { if (p.dview === 'pedigree') { const inf = S.ped.infer; return [
      { label: 'Dogs', value: '12', unit: '' },
      { label: 'Chocolate', value: String(S.ped.dogs.filter(q => q.choc).length), unit: 'must be bb' },
      { label: 'Genotypes certain', value: String(inf.poss.filter(q => q.length === 1).length), unit: 'of 12', flag: 'accent' },
      { label: 'Proved carriers', value: String(inf.poss.filter(q => q.length === 1 && q[0] === 1).length), unit: 'Bb' },
      { label: 'Ways the family could be', value: String(inf.count), unit: '' }]; } const D = S.dg; return [
      { label: 'Trait', value: D.G.trait, unit: D.G.dom + ' / ' + D.G.rec },
      { label: 'Cross', value: D.gt(D.rows[0].a) + ' × ' + D.gt(D.rows[0].b), unit: '' },
      { label: (D.k2 ? 'F1 ' : '') + D.G.dom, value: Math.round((D.k1[2] + D.k1[1]) * 100), unit: '%', flag: 'accent' },
      { label: (D.k2 ? 'F1 ' : '') + D.G.rec, value: Math.round(D.k1[0] * 100), unit: '%' }].concat(D.k2 ? [{ label: 'F2 ' + D.G.dom + ' : ' + D.G.rec, value: '3 : 1', unit: '' }, { label: 'Mendel’s F2', value: f2(D.G.mendel[0] / D.G.mendel[1]), unit: ': 1' }] : []); }
    const shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1), cls = classCounts(S.off, p, shown), cs = chiSquare(cls, S.exp);
    return [
      { label: 'Offspring counted', value: String(shown), unit: 'of ' + p.nOff },
      ...cls.map((c, k) => ({ label: p.pmode === 'di' ? ['Round yellow', 'Round green', 'Wrinkled yellow', 'Wrinkled green'][k] : (k ? GENES[p.pgene].rec : GENES[p.pgene].dom), value: String(c), unit: 'expected ' + f1(S.exp[k] * shown) })),
      { label: 'Chi-square', value: f2(cs.chi), unit: cs.df + ' df' },
      { label: 'p', value: cs.p < 0.001 ? '< 0.001' : f2(cs.p), unit: cs.p < 0.05 ? 'unlikely by chance' : 'fits the expected ratio', flag: cs.p < 0.05 ? 'warn' : 'ok' }];
  }
  const { E } = L;
  function equation(S) {
    const p = S.p;
    if (p.setup === 'sexual') return 'kinds of gamete = 2' + E.sup('n') + ' = 2' + E.sup('7') + ' = <b>128</b> &nbsp; kinds of zygote = 2' + E.sup('n') + ' × 2' + E.sup('n') + ' = 16,384 &nbsp; (humans: 2' + E.sup('23') + ' = 8,388,608 each)';
    if (p.setup === 'resemble') { const s = S.sib; return E.v('P') + '(two siblings alike) = ' + E.frac('∏', 'genes') + ' [' + E.v('p') + E.sup('2') + ' + (1 − ' + E.v('p') + ')' + E.sup('2') + '] = <b>' + (s.theoryK[7] * 100).toFixed(1) + ' %</b> &nbsp; (one gene, two hybrid parents: ' + E.frac('3', '4') + E.sup('2') + ' + ' + E.frac('1', '4') + E.sup('2') + ' = ' + E.frac('5', '8') + ')'; }
    if (p.setup === 'asexual') return 'plants = (1 + ' + E.v('r') + ')' + E.sup('g') + ' = (1 + ' + p.runners + ')' + E.sup(String(p.gens)) + ' = <b>' + S.bed.plants.length + '</b> &nbsp; new mutations = μ × 2' + E.v('G') + ' = ' + MUT[p.mut].toExponential(0) + ' × 4.8×10' + E.sup('8') + ' = ' + f1(S.bed.lam);
    if (p.setup === 'compare') return 'clone share after ' + E.v('g') + ' generations, nothing else acting: ' + E.frac(E.v('p') + E.sub('0') + '·2' + E.sup('g'), E.v('p') + E.sub('0') + '·2' + E.sup('g') + ' + 1 − ' + E.v('p') + E.sub('0')) + ' &nbsp; risk of infection = 1 − e' + E.sup('−30 v f');
    if (p.setup === 'genes') { const G = GENES[p.gene]; return 'DNA → (copied into a message) → protein → trait: &nbsp; ' + G.up + ' → ' + GENEFACT[p.gene].protein.split(',')[0] + ' → <b>' + G.dom + '</b>'; }
    if (p.setup === 'diagrams') return p.dview === 'pedigree' ? 'chocolate ⇒ bb &nbsp; black with a chocolate parent or pup ⇒ Bb &nbsp; otherwise BB or Bb' : E.v('Aa') + ' × ' + E.v('Aa') + ' → ' + E.frac('1', '4') + ' AA + ' + E.frac('1', '2') + ' Aa + ' + E.frac('1', '4') + ' aa → <b>3 : 1</b>';
    const shown = Math.min(p.nOff, Math.floor(p.nOff * clamp(S.t / 5, 0, 1)) + 1), cs = chiSquare(classCounts(S.off, p, shown), S.exp);
    return 'χ' + E.sup('2') + ' = Σ ' + E.frac('(observed − expected)' + E.sup('2'), 'expected') + ' = ' + f2(cs.chi) + ' &nbsp; (' + cs.df + ' df, p = ' + (cs.p < 0.001 ? '< 0.001' : f2(cs.p)) + ')';
  }
  const EQ_NOTE = S => ({
    sexual: '<b>Meiosis makes cells with one of each chromosome pair; which one is chance.</b> With 7 pairs a pea plant can make 128 kinds of gamete without any crossing over; crossing over makes every gamete practically unique. Fertilisation joins two such cells.',
    resemble: '<b>Children resemble their parents because every allele they have came from them.</b> They differ from their parents and from each other because each child got a different random half from each parent.',
    asexual: '<b>A runner is part of the mother.</b> Its cells come from hers by mitosis, which copies every chromosome exactly; the only differences are the rare new mutations — a few letters in hundreds of millions.',
    compare: '<b>Clones pay no cost of males, so where nothing changes they win fast.</b> Where parasites keep adapting to the commonest genotypes, or the climate keeps moving, sex keeps making new combinations and can win in spite of the cost.',
    genes: '<b>A gene is a stretch of DNA that holds the instructions for one protein.</b> Different forms of a gene (alleles) differ by a few letters; one working copy often makes enough protein, which is why one allele can be dominant.',
    diagrams: '<b>An inheritance diagram follows alleles, not traits.</b> Each parent passes one of its two copies; an individual that shows the recessive trait must have two recessive copies; a dominant-looking one may hide a recessive allele.',
    punnett: '<b>A Punnett square lists the gametes of each parent and every way they can meet.</b> Each box is equally likely, so the boxes give the expected ratios; real counts scatter round them, less and less as the numbers grow.'
  })[S.p.setup];

  /* ============================================================
     10. REGISTRATION
     ============================================================ */
  const R_ = true;
  const gOpt = k => ({ value: k, label: k + ': ' + GENES[k].trait });
  const nOpt = [{ value: 2, label: 'both dominant' }, { value: 1, label: 'one of each' }, { value: 0, label: 'both recessive' }];
  L.register({
    id: 'g6e-heredity',
    grade: 6, unit: '6E', topics: ['E5', 'E6'],
    subject: 'biology',
    name: 'The Heredity Lab',
    chapter: 'Regional Climate, Organisms and Heredity',
    exams: ['NGSS MS-LS3-2', 'NGSS MS-LS3-1', 'CAST'],
    weight: 'Heredity',
    is3D: false,
    autoplay: true,
    bloom: 0.05,
    stageHint: 'Every chromosome, seed, sibling and count here is computed: meiosis chromatid by chromatid, fertilisation, mitosis, crosses',
    lede: 'Mendel’s own organism, the <b>garden pea</b>, with its seven chromosome pairs and his seven genes on them. Watch <b>meiosis</b> chromatid by chromatid — crossing over, random orientation, four gametes, one surviving egg — and <b>fertilisation</b>. Raise a pod of <b>siblings</b> and see why they resemble their parents but not each other; grow <b>strawberry runners</b> that are clones; race <b>sexual and clonal snails</b> in a lake with parasites; zoom from a plant to the <b>DNA</b> of a gene; draw <b>inheritance diagrams</b> and a family tree; and fill <b>Punnett squares</b> with real counts.',

    params: preset({}),
    presets: [
      { name: 'Meiosis: three chromosome pairs', params: preset({}) },
      { name: 'All seven pea chromosome pairs', params: preset({ nShow: 7 }) },
      { name: 'Meiosis without crossing over', params: preset({ cross: false }) },
      { name: 'One pair, slowly', params: preset({ nShow: 1, ppace: 0.5 }) },
      { name: 'Siblings of two hybrids', params: preset({ setup: 'resemble' }) },
      { name: 'Two pure varieties: identical children', params: preset({ setup: 'resemble', parents: 'varieties' }) },
      { name: 'A big family', params: preset({ setup: 'resemble', nKids: 16, seed: 2 }) },
      { name: 'Garden plants of different make-up', params: preset({ setup: 'resemble', parents: 'mixed' }) },
      { name: 'Runners: two seasons', params: preset({ setup: 'asexual' }) },
      { name: 'Runners: three seasons, three runners', params: preset({ setup: 'asexual', runners: 3, gens: 3 }) },
      { name: 'Clones with a high mutation rate', params: preset({ setup: 'asexual', mut: 'high', gens: 3 }) },
      { name: 'A stable lake: clones take over', params: preset({ setup: 'compare', env: 'stable' }) },
      { name: 'Parasites: the Red Queen', params: preset({ setup: 'compare', env: 'parasites' }) },
      { name: 'A warming lake', params: preset({ setup: 'compare', env: 'warming', warm: 0.12, gpace: 40 }) },
      { name: 'Two lakes warming: clones fall behind', params: preset({ setup: 'compare', env: 'warming', arr: 'apart', warm: 0.12, gpace: 40 }) },
      { name: 'Two lakes: the cost of males', params: preset({ setup: 'compare', arr: 'apart', env: 'stable' }) },
      { name: 'The dwarf gene, le', params: preset({ setup: 'genes', gene: 'Le', al1: 0, al2: 0 }) },
      { name: 'Wrinkled seeds: an 800-letter insertion', params: preset({ setup: 'genes', gene: 'R', al1: 1, al2: 0 }) },
      { name: 'White flowers: one letter', params: preset({ setup: 'genes', gene: 'A', al1: 0, al2: 0 }) },
      { name: 'P, F1, F2: flower colour', params: preset({ setup: 'diagrams' }) },
      { name: 'A test cross: tall', params: preset({ setup: 'diagrams', dgene: 'Le', dcross: 'test' }) },
      { name: 'A Labrador family tree', params: preset({ setup: 'diagrams', dview: 'pedigree' }) },
      { name: 'A carrier and a chocolate dog', params: preset({ setup: 'diagrams', dview: 'pedigree', family: 'carrierChoc', seed: 3 }) },
      { name: 'Mendel’s 929 plants', params: preset({ setup: 'punnett' }) },
      { name: 'A dihybrid square: 556 seeds', params: preset({ setup: 'punnett', pmode: 'di', nOff: 556 }) },
      { name: 'Only eight offspring', params: preset({ setup: 'punnett', nOff: 8, seed: 4 }) },
      { name: 'A test cross: Aa × aa', params: preset({ setup: 'punnett', pm: 0, nOff: 400 }) }
    ],

    controls: [
      { group: 'Set-up', items: [
        { key: 'setup', type: 'select', label: 'Investigation', restructure: true, rebuild: true, options: SETUPS } ] },
      { group: 'Meiosis', when: is('sexual'), items: [
        { key: 'nShow', label: 'Chromosome pairs shown', min: 1, max: 7, step: 1, unit: 'of 7', restructure: R_ },
        { key: 'cross', type: 'toggle', label: 'Crossing over', restructure: R_ },
        { key: 'ppace', label: 'Speed', min: 0.25, max: 3, step: 0.25, unit: '×', restructure: false } ] },
      { group: 'The family', when: is('resemble'), items: [
        { key: 'parents', type: 'select', label: 'Parents', restructure: R_, options: [{ value: 'hybrids', label: 'two hybrids' }, { value: 'varieties', label: 'two pure varieties' }, { value: 'mixed', label: 'two garden plants' }, { value: 'same', label: 'one pure variety, selfed' }] },
        { key: 'nKids', label: 'Children', min: 2, max: 16, step: 1, unit: '', restructure: R_ } ] },
      { group: 'The strawberry bed', when: is('asexual'), items: [
        { key: 'runners', label: 'Runners per plant', min: 1, max: 3, step: 1, unit: 'a season', restructure: R_ },
        { key: 'gens', label: 'Seasons', min: 0, max: 3, step: 1, unit: '', restructure: R_ },
        { key: 'mut', type: 'select', label: 'Mutation rate', restructure: R_, options: [{ value: 'none', label: 'none' }, { value: 'real', label: 'real (7 × 10⁻⁹ a letter)' }, { value: 'high', label: 'forty times higher' }] },
        { key: 'sow', type: 'toggle', label: 'Also sow her seed', restructure: R_ } ] },
      { group: 'The lake', when: is('compare'), items: [
        { key: 'env', type: 'select', label: 'The lake', restructure: R_, options: [{ value: 'stable', label: 'stable' }, { value: 'parasites', label: 'parasites' }, { value: 'warming', label: 'warming' }] },
        { key: 'arr', type: 'select', label: 'Snails', restructure: R_, options: [{ value: 'together', label: 'together, competing' }, { value: 'apart', label: 'in two lakes' }] },
        { key: 'p0', label: 'Clones at the start', min: 0.02, max: 0.5, step: 0.01, unit: '', restructure: R_, fmt: v => Math.round(v * 100) + ' %', when: S => S.p.arr === 'together' },
        { key: 'K', label: 'Lake holds', min: 100, max: 800, step: 50, unit: 'snails', restructure: R_ },
        { key: 'vir', label: 'Parasite strength', min: 0.1, max: 1.5, step: 0.05, unit: '', restructure: R_, when: S => S.p.env === 'parasites' },
        { key: 'warm', label: 'Warming', min: 0.01, max: 0.15, step: 0.01, unit: 'a generation', restructure: R_, when: S => S.p.env === 'warming' },
        { key: 'gpace', type: 'select', label: 'Generations pass', restructure: false, options: [{ value: 2, label: '2 a second' }, { value: 10, label: '10 a second' }, { value: 40, label: '40 a second' }] } ] },
      { group: 'The gene', when: is('genes'), items: [
        { key: 'gene', type: 'select', label: 'Gene', restructure: R_, options: ['Le', 'R', 'I', 'A'].map(gOpt) },
        { key: 'al1', type: 'select', label: 'Copy from the mother', restructure: R_, options: [{ value: 1, label: 'working (dominant)' }, { value: 0, label: 'changed (recessive)' }] },
        { key: 'al2', type: 'select', label: 'Copy from the father', restructure: R_, options: [{ value: 1, label: 'working (dominant)' }, { value: 0, label: 'changed (recessive)' }] } ] },
      { group: 'The diagram', when: is('diagrams'), items: [
        { key: 'dview', type: 'select', label: 'Diagram', restructure: R_, options: [{ value: 'generations', label: 'generations of peas' }, { value: 'pedigree', label: 'a family tree (Labradors)' }] },
        { key: 'dgene', type: 'select', label: 'Trait', restructure: R_, options: GKEYS.map(gOpt), when: S => S.p.dview === 'generations' },
        { key: 'dcross', type: 'select', label: 'Cross', restructure: R_, options: [{ value: 'pure', label: 'pure × pure, then F1 × F1' }, { value: 'test', label: 'hybrid × recessive (test cross)' }, { value: 'back', label: 'hybrid × pure dominant' }, { value: 'f1', label: 'hybrid × hybrid' }], when: S => S.p.dview === 'generations' },
        { key: 'family', type: 'select', label: 'Grandparents', restructure: R_, options: [{ value: 'carriers', label: 'two black carriers (Bb × Bb)' }, { value: 'carrierChoc', label: 'a carrier and a chocolate (Bb × bb)' }, { value: 'blackCarrier', label: 'BB × Bb' }], when: S => S.p.dview === 'pedigree' },
        { key: 'reveal', type: 'toggle', label: 'Reveal the true genotypes', restructure: R_, when: S => S.p.dview === 'pedigree' } ] },
      { group: 'The cross', when: is('punnett'), items: [
        { key: 'pmode', type: 'select', label: 'Genes', restructure: R_, options: [{ value: 'mono', label: 'one gene' }, { value: 'di', label: 'two genes: seed shape and colour' }] },
        { key: 'pgene', type: 'select', label: 'Gene', restructure: R_, options: GKEYS.map(gOpt), when: S => S.p.pmode === 'mono' },
        { key: 'pf', type: 'select', label: 'Pollen parent', restructure: R_, options: nOpt },
        { key: 'pm', type: 'select', label: 'Seed parent', restructure: R_, options: nOpt },
        { key: 'pf2', type: 'select', label: 'Pollen parent, seed colour', restructure: R_, options: nOpt, when: S => S.p.pmode === 'di' },
        { key: 'pm2', type: 'select', label: 'Seed parent, seed colour', restructure: R_, options: nOpt, when: S => S.p.pmode === 'di' },
        { key: 'nOff', label: 'Offspring', min: 4, max: 8000, step: 1, unit: '', restructure: R_ },
        { key: 'mendel', type: 'toggle', label: 'Show Mendel’s counts', restructure: R_ } ] },
      { group: 'Chance', when: S => is('sexual', 'resemble', 'asexual', 'compare', 'punnett')(S) || (S.p.setup === 'diagrams' && S.p.dview === 'pedigree'), items: [
        { key: 'seed', label: 'Another throw of the dice', min: 1, max: 9, step: 1, restructure: R_ } ] }
    ],

    setup, step, drawStage, onPointer,
    plots: [plot1, plot2],
    readouts,
    equation,
    eqNote: EQ_NOTE,
    problems: [
      { source: 'CAST pattern · independent assortment', params: preset({}),
        q: 'A pea plant has 7 pairs of chromosomes, and each gamete gets one of each pair at random. Without crossing over, how many different kinds of gamete can one plant make?',
        predict: { label: 'Kinds of gamete', unit: '', tol: 0.001 },
        measure: S => gametesKinds(7),
        working: 'Each pair gives two choices: 2 × 2 × 2 × 2 × 2 × 2 × 2 = 2⁷ = <b>128</b>. Two parents make 128 × 128 = 16,384 kinds of offspring — and crossing over multiplies that again. With 23 pairs a human makes 2²³ = 8,388,608 kinds.' },
      { source: 'CAST pattern · a Punnett square', params: preset({ setup: 'punnett', pgene: 'A', nOff: 929 }),
        q: 'Mendel crossed two purple-flowered hybrids (Aa × Aa) and grew 929 plants. How many white-flowered plants does the Punnett square predict?',
        predict: { label: 'White plants expected', unit: '', tol: 0.01 },
        measure: S => S.exp[1] * S.p.nOff,
        working: 'One box in four is aa: 929 ÷ 4 = <b>232</b>. Mendel counted 224 white and 705 purple — 3.15 : 1, well within chance of 3 : 1 (χ² = 0.39).' },
      { source: 'CAST pattern · siblings', params: preset({ setup: 'resemble', parents: 'hybrids' }),
        q: 'Two parents are hybrids (Aa) for a gene. What is the chance that two of their children look alike for that trait?',
        predict: { label: 'Chance alike', unit: '', tol: 0.01 },
        measure: S => pSibAlike(1, 1),
        working: 'Each child shows the dominant form with chance 3/4 and the recessive with 1/4. Both dominant: 9/16; both recessive: 1/16; together 10/16 = <b>0.625</b>. For all seven of Mendel’s genes at once: 0.625⁷ ≈ 3.7 %.' },
      { source: 'CAST pattern · asexual reproduction', params: preset({ setup: 'asexual', runners: 3, gens: 3 }),
        q: 'A strawberry plant sends out 3 runners a season, and every new plant does the same. How many plants are there after 3 seasons?',
        predict: { label: 'Plants', unit: '', tol: 0.001 },
        measure: S => S.bed.plants.length,
        working: 'Each season every plant becomes 1 + 3 = 4: 4 × 4 × 4 = <b>64</b>, every one a clone of the first. From seed, each would carry a new mixture of her genes.' },
      { source: 'CAST pattern · the cost of males', params: preset({ setup: 'compare', env: 'stable', p0: 0.1 }),
        q: 'A clone makes twice as many daughters as a sexual female (half of whose young are sons). It starts as 10 % of the lake. With nothing else acting, what share is it after 3 generations?',
        predict: { label: 'Clonal share', unit: '%', tol: 0.02 },
        measure: S => shareAfter(S.p.p0, 3) * 100,
        working: 'Its odds double each generation: 1 : 9 → 8 : 9, so the share is 8 ÷ 17 = <b>47 %</b>. After 6 generations it is 88 % — unless parasites or a changing world make variety worth the cost.' },
      { source: 'CAST pattern · a dihybrid cross', params: preset({ setup: 'punnett', pmode: 'di', nOff: 556 }),
        q: 'Mendel crossed plants hybrid for seed shape and seed colour (RrIi × RrIi) and got 556 seeds. How many round yellow seeds does the 4 × 4 square predict?',
        predict: { label: 'Round yellow', unit: '', tol: 0.01 },
        measure: S => S.exp[0] * S.p.nOff,
        working: 'Nine boxes of sixteen are round and yellow: 556 × 9/16 = <b>313</b>. Mendel counted 315 round yellow, 108 round green, 101 wrinkled yellow and 32 wrinkled green — 9 : 3 : 3 : 1.' }
    ],

    walkthrough: [
      { title: '1 · Halving the chromosomes', ask: 'A pea cell has 7 pairs. How many chromosomes will each pollen nucleus get — and which ones?', reveal: 'Seven: one of each pair, and which of the two is chance — the pairs line up facing either way. Meiosis halves the number so that fertilisation can restore it.', params: preset({}) },
      { title: '2 · Shuffling within a chromosome', ask: 'Turn crossing over off and on. What changes in the gametes’ colours?', reveal: 'Without it every chromosome is wholly from one grandparent; with it, chromosomes are patchworks. Look at the second plot: the share from the grandfather becomes a smooth spread — nearly every gamete is unique.', params: preset({ cross: false }) },
      { title: '3 · Like but not the same', ask: 'Two hybrid parents have eight children. Will any look exactly like a parent? Like each other?', reveal: 'Few or none: each child gets a different random half from each parent. Every trait they show came from a parent, in a new combination.', params: preset({ setup: 'resemble' }) },
      { title: '4 · Identical children', ask: 'Now cross two pure-breeding varieties. How different are the children?', reveal: 'Not at all: every child gets the same alleles, so all are identical hybrids — and they look like the dominant parent. Variation needs parents that carry variety.', params: preset({ setup: 'resemble', parents: 'varieties' }) },
      { title: '5 · Runners are clones', ask: 'Compare the runner daughters with the seedlings. Which are genetically identical to the mother?', reveal: 'The runners: they grow from her cells by mitosis. The seedlings each got half their genes from her and half from a pollen parent — some even have yellow fruit.', params: preset({ setup: 'asexual' }) },
      { title: '6 · Why have sex?', ask: 'In a stable lake, which wins: clones or sexual snails? Now add parasites.', reveal: 'In a stable lake the clones win within a few generations — they make twice the daughters. With parasites that adapt to the common genotypes, each clone becomes a target, and sex, always making new genotypes, holds on.', params: preset({ setup: 'compare', env: 'stable' }) },
      { title: '7 · Three to one', ask: 'With only eight offspring, will you see exactly 6 purple and 2 white?', reveal: 'Rarely. The square gives the chances; small samples scatter. Raise the number to Mendel’s 929 and the ratio settles near 3 : 1.', params: preset({ setup: 'punnett', nOff: 8, seed: 4 }) }
    ],

    quiz: [
      { q: 'Why do children of the same parents differ from each other?', options: ['Each gets a different random half of each parent’s chromosomes', 'They are born at different times', 'Their parents’ genes change between births', 'Only the environment differs'], answer: 0, why: 'Meiosis sorts each pair at random and crossing over mixes them, so each gamete is different.' },
      { q: 'A strawberry runner daughter is', options: ['genetically identical to the mother, apart from rare mutations', 'half like the mother', 'a cross of two plants', 'a seedling'], answer: 0, why: 'It grows from the mother’s cells by mitosis.' },
      { q: 'Aa × aa gives offspring in the ratio', options: ['1 dominant : 1 recessive', '3 : 1', 'all dominant', '1 : 2 : 1'], answer: 0, why: 'Half the gametes of Aa carry A, all of aa carry a.' },
      { q: 'A gene is', options: ['a stretch of DNA holding the instructions for a protein', 'a whole chromosome', 'a trait such as height', 'a cell'], answer: 0, why: 'The protein it codes for helps make the trait.' },
      { q: 'An advantage of sexual reproduction is that it', options: ['makes new combinations of genes, useful when conditions change', 'is faster', 'needs only one parent', 'copies the parent exactly'], answer: 0, why: 'Clones are faster; sex makes variety.' },
      { q: 'Two black Labradors have a chocolate puppy. The parents must both be', options: ['Bb', 'BB', 'bb', 'one BB, one Bb'], answer: 0, why: 'The puppy is bb and got one b from each parent; black parents with a b are Bb.' }
    ],

    notes: '<p><b>Sexual reproduction.</b> Two parents each make gametes by meiosis, which halves the chromosomes: one of each pair, chosen at random, with crossing over mixing each pair first. Fertilisation joins a gamete from each parent.</p>' +
      '<p><b>Resemblance and variation.</b> Every allele a child has came from a parent, so children resemble their parents; each child gets a different combination, so siblings differ — unless the parents carry no variety at all.</p>' +
      '<p><b>Asexual reproduction.</b> One parent; new individuals grow from its cells by mitosis (runners, tubers, bulbs, budding, splitting). They are clones — genetically identical apart from rare mutations.</p>' +
      '<p><b>Comparing.</b> Asexual: fast, no partner, every offspring can reproduce, keeps a combination that works. Sexual: slower and costly, but makes variety, which helps when the environment or the parasites change.</p>' +
      '<p><b>Genes.</b> A gene is a stretch of DNA on a chromosome, holding the code for a protein. Alleles are its versions. Punnett squares and inheritance diagrams follow the alleles from parents to offspring.</p>' +
      '<div class="pyq"><em>Misconception to catch</em> “Children get a blend of their parents’ traits.” Alleles are passed on whole: a white-flowered plant can appear from two purple parents, because each carried a hidden white allele.</div>'
  });

  L.models = L.models || {};
  L.models['g6e-heredity'] = { GENES, GKEYS, CHR_LEN, makeInd, meiosis, fertilise, nDom, shows, shareFrom, pDomChild, pSibAlike, gametesKinds, clonesAfter, bedOf, popRun, shareAfter, pedigreeOf, inferPedigree, crossOf, expected, classCounts, chiSquare, gammaQ, PARENTS, MUT, STRAW_G };
})(window.InsightLab);
