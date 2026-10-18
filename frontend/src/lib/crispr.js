/* ---------- Sequence logic ---------- */
export const COMP = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };
export const rc = (s) => s.split('').reverse().map((c) => COMP[c] || 'N').join('');
export const IUPAC = { A: 'A', C: 'C', G: 'G', T: 'T', N: 'ACGT', R: 'AG', V: 'ACG' };
export const pamOk = (p, m) => p.length === m.length && [...m].every((c, i) => IUPAC[c].includes(p[i]));
export const NUCLEASES = {
  'SpCas9 (NGG)': { pam: 'NGG', side: 3, len: 20 },
  'SpCas9-NG (NG)': { pam: 'NG', side: 3, len: 20 },
  'SaCas9 (NNGRRT)': { pam: 'NNGRRT', side: 3, len: 21 },
  'Cas12a (TTTV)': { pam: 'TTTV', side: 5, len: 23 },
};
export const BASE_COLOR = { A: '#2F855A', C: '#2B6CB0', G: '#B7791F', T: '#C0392B', N: '#8A949B' };

export const parseSeq = (raw) => {
  const lines = raw.split('\n');
  const header = lines.find((l) => l.startsWith('>'));
  const seq = lines.filter((l) => !l.startsWith('>')).join('').toUpperCase().replace(/[^ACGTN]/g, '');
  return { seq, name: header ? header.slice(1).trim().split(/\s+/)[0] : 'Untitled sequence' };
};
export const gcPct = (s) => Math.round(([...s].filter((c) => c === 'G' || c === 'C').length / s.length) * 100);

export function scan(seq, nuc, len) {
  const { pam, side } = NUCLEASES[nuc];
  const pl = pam.length, L = seq.length, out = [];
  [['+', seq], ['-', rc(seq)]].forEach(([strand, s]) => {
    for (let i = 0; i + len + pl <= L; i++) {
      const p = side === 3 ? s.slice(i + len, i + len + pl) : s.slice(i, i + pl);
      if (!pamOk(p, pam)) continue;
      const gs = side === 3 ? i : i + pl;
      const g = s.slice(gs, gs + len);
      if (g.includes('N')) continue;
      const start = strand === '+' ? gs : L - (gs + len);
      out.push({ strand, guide: g, pam: p, start, end: start + len });
    }
  });
  return out;
}

export function scoreGuide(g) {
  const gc = gcPct(g), flags = [];
  let s = 100;
  if (gc < 40) { s -= (40 - gc) * 1.2; flags.push('Low GC'); }
  if (gc > 70) { s -= (gc - 70) * 1.2; flags.push('High GC'); }
  if (/TTTT/.test(g)) { s -= 35; flags.push('TTTT terminator'); }
  else if (/(.)\1{3,}/.test(g)) { s -= 10; flags.push('Homopolymer'); }
  if (gcPct(g.slice(-10)) > 80) { s -= 8; flags.push('GC-rich seed'); }
  return { gc, flags, score: Math.max(0, Math.min(100, Math.round(s))) };
}

export function findOffTargets(seq, nuc, len, ref, maxMM) {
  return scan(seq, nuc, len)
    .map((x) => ({ ...x, mm: [...x.guide].map((c, i) => (c !== ref.guide[i] ? i : -1)).filter((i) => i >= 0) }))
    .filter((x) => x.mm.length <= maxMM && !(x.mm.length === 0 && x.strand === ref.strand && x.start === ref.start))
    .sort((a, b) => a.mm.length - b.mm.length || a.start - b.start);
}

