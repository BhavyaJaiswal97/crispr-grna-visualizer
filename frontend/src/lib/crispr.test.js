import { rc, parseSeq, scan, scoreGuide, findOffTargets } from './crispr';

const G = 'ACGTACGTACGTACGTACGT';

test('reverse complement', () => expect(rc('AACG')).toBe('CGTT'));

test('parseSeq strips FASTA header and junk', () =>
  expect(parseSeq('>x\nac gt\n12N')).toEqual({ seq: 'ACGTN', name: 'x' }));

test('finds forward-strand guide next to NGG', () => {
  const r = scan(G + 'TGG', 'SpCas9 (NGG)', 20);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ strand: '+', start: 0, end: 20, pam: 'TGG', guide: G });
});

test('maps reverse-strand coordinates to forward positions', () => {
  const r = scan(rc(G + 'TGG'), 'SpCas9 (NGG)', 20);
  expect(r[0]).toMatchObject({ strand: '-', start: 3, end: 23, guide: G });
});

test('balanced guide scores 100 with no flags', () =>
  expect(scoreGuide(G)).toMatchObject({ score: 100, flags: [], gc: 50 }));

test('TTTT run is penalised', () =>
  expect(scoreGuide('ACGTTTTTACGTACGTACGT')).toMatchObject({ score: 65, flags: ['TTTT terminator'] }));

test('off-target search excludes the reference and finds a 1-mismatch site', () => {
  const seq = G + 'TGG' + 'CC' + G.slice(0, 19) + 'A' + 'AGG';
  const ref = scan(seq, 'SpCas9 (NGG)', 20).find((x) => x.start === 0 && x.strand === '+');
  const hits = findOffTargets(seq, 'SpCas9 (NGG)', 20, ref, 2);
  expect(hits.some((h) => h.start === 0 && h.strand === '+')).toBe(false);
  expect(hits.some((h) => h.mm.length === 1 && h.mm[0] === 19)).toBe(true);
});

import { pamOk, NUCLEASES, BASE_COLOR } from './crispr';

test('IUPAC codes R and V match the right bases', () => {
  expect(pamOk('A', 'R')).toBe(true);
  expect(pamOk('C', 'R')).toBe(false);
  expect(pamOk('C', 'V')).toBe(true);
  expect(pamOk('T', 'V')).toBe(false);
});

test('nuclease definitions are exact', () => {
  expect(NUCLEASES['SpCas9 (NGG)']).toEqual({ pam: 'NGG', side: 3, len: 20 });
  expect(NUCLEASES['SpCas9-NG (NG)']).toEqual({ pam: 'NG', side: 3, len: 20 });
  expect(NUCLEASES['SaCas9 (NNGRRT)']).toEqual({ pam: 'NNGRRT', side: 3, len: 21 });
  expect(NUCLEASES['Cas12a (TTTV)']).toEqual({ pam: 'TTTV', side: 5, len: 23 });
});

test('base colours are defined for every base', () => {
  expect(BASE_COLOR).toEqual({ A: '#2F855A', C: '#2B6CB0', G: '#B7791F', T: '#C0392B', N: '#8A949B' });
});

test('Cas12a reads its PAM on the 5-prime side', () => {
  const r = scan('TTTA' + 'ACGTACGTACGTACGTACGTACG', 'Cas12a (TTTV)', 23);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ strand: '+', pam: 'TTTA', start: 4, end: 27 });
});

test('off-targets with equal mismatches are ordered by position', () => {
  const O1 = G.slice(0, 19) + 'A';
  const O2 = 'C' + G.slice(1);
  const seq = G + 'TGG' + 'CC' + rc(O1 + 'TGG') + 'CC' + O2 + 'AGG';
  const ref = scan(seq, 'SpCas9 (NGG)', 20).find((x) => x.strand === '+' && x.start === 0);
  const hits = findOffTargets(seq, 'SpCas9 (NGG)', 20, ref, 1);
  expect(hits.map((h) => [h.strand, h.start])).toEqual([['-', 28], ['+', 50]]);
});
