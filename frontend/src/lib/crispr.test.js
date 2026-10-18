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
