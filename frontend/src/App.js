import React, { useState, useMemo, useEffect } from 'react';
import { NUCLEASES, BASE_COLOR, parseSeq, gcPct, scan, scoreGuide, findOffTargets } from './lib/crispr';

const download = (name, text, type = 'text/plain') => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const EXAMPLE = `>EMX1_exon_fragment
GAGTCCGAGCAGAAGAAGAAGGGCTCCCATCACATCAACCGGTGGCGCATTGCCACGAAGCAGGCCAATGGGGAGGACATCGATGTCACCTCCAATGACAAGACCCTAGACCGTGGAATTCTCGACGTTAACAGTCTTCATTTATTTTGGGACGTAGCTAGCTTGGCCTTCAAGAGGCTACTCGTGGACCCCTAGTTCGAGTAGCAGGCCGAATTGGCACGATAGGGTACCATTCGAGGACATCGTCCTGAGGAGCTGGAAGCCAGTGACGGTGGGTCCCCAGGAGGATCGTAGCCCGAAGTACCGGTTGCAA`;

/* ---------- Small UI parts ---------- */
const Btn = ({ kind = 'ghost', className = '', ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-40 ${
      kind === 'primary' ? 'bg-teal-800 text-white hover:bg-teal-900' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
    } ${className}`}
  />
);
const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);
const inputCls = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20';
const Stat = ({ label, value, sub }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </div>
);
const Empty = ({ title, text, action }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
    <p className="font-medium text-slate-800">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
const ScoreBar = ({ v }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: v >= 75 ? '#0F766E' : v >= 50 ? '#B7791F' : '#C0392B' }} />
    </div>
    <span className="w-7 text-right tabular-nums text-sm">{v}</span>
  </div>
);
const GuideSeq = ({ g, mm = [] }) => (
  <span className="font-mono text-[13px] tracking-wide">
    {[...g].map((c, i) => (
      <span key={i} style={{ color: BASE_COLOR[c] }} className={mm.includes(i) ? 'rounded-sm bg-red-100 font-bold underline' : ''}>{c}</span>
    ))}
  </span>
);

/* ---------- App ---------- */
export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [raw, setRaw] = useState('');
  const [nuc, setNuc] = useState('SpCas9 (NGG)');
  const [len, setLen] = useState(20);
  const [maxMM, setMaxMM] = useState(3);
  const [minScore, setMinScore] = useState(0);
  const [strandF, setStrandF] = useState('both');
  const [sort, setSort] = useState({ k: 'score', d: -1 });
  const [data, setData] = useState(null);
  const [selId, setSelId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(l);
    try { setProjects(JSON.parse(localStorage.getItem('cv_projects') || '[]')); } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t); } }, [toast]);

  const persist = (list) => { setProjects(list); try { localStorage.setItem('cv_projects', JSON.stringify(list)); } catch (e) { /* ignore */ } };

  const analyze = (rawIn = raw, nucIn = nuc, lenIn = len) => {
    const { seq, name } = parseSeq(rawIn);
    const need = lenIn + NUCLEASES[nucIn].pam.length;
    if (seq.length < need) { setError(`Sequence has ${seq.length} valid bases. Add at least ${need} A/C/G/T bases to search.`); return; }
    const guides = scan(seq, nucIn, lenIn)
      .map((x) => ({ ...x, ...scoreGuide(x.guide) }))
      .sort((a, b) => a.start - b.start)
      .map((x, i) => ({ ...x, id: `g${String(i + 1).padStart(3, '0')}` }));
    setError('');
    setData({ seq, name, nuc: nucIn, len: lenIn, guides });
    setSelId(guides.length ? [...guides].sort((a, b) => b.score - a.score)[0].id : null);
    setScreen('results');
  };

  const shown = useMemo(() => {
    if (!data) return [];
    const f = data.guides.filter((g) => g.score >= minScore && (strandF === 'both' || g.strand === strandF));
    return [...f].sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : a[sort.k] < b[sort.k] ? -1 : 0) * sort.d);
  }, [data, minScore, strandF, sort]);
  const sel = data?.guides.find((g) => g.id === selId);
  const off = useMemo(() => (sel ? findOffTargets(data.seq, data.nuc, data.len, sel, maxMM) : []), [sel, data, maxMM]);

  const copy = (t) => { navigator.clipboard?.writeText(t); setToast('Copied to clipboard'); };
  const exportRows = () => shown.map((g) => ({ id: g.id, guide: g.guide, pam: g.pam, strand: g.strand, start: g.start + 1, end: g.end, gc_percent: g.gc, score: g.score, flags: g.flags.join('; ') }));
  const nav = [
    ['dashboard', 'Design'], ['results', 'Guides'], ['viewer', 'Sequence'], ['offtargets', 'Off-targets'],
    ['projects', 'Projects'], ['exports', 'Export'], ['settings', 'Settings'], ['about', 'About'],
  ];
  const needData = (el) => data ? el : (
    <Empty title="No guides yet" text="Paste a sequence on the Design screen and run the search." action={<Btn kind="primary" onClick={() => setScreen('dashboard')}>Go to Design</Btn>} />
  );

  const Th = ({ k, children, className = '' }) => (
    <th className={`px-3 py-2 text-left font-medium ${className}`}>
      <button onClick={() => setSort((s) => ({ k, d: s.k === k ? -s.d : -1 }))} className="hover:text-slate-900">
        {children}{sort.k === k ? (sort.d === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  /* --- screens --- */
  const Dashboard = () => {
    const p = parseSeq(raw);
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Target sequence</h2>
            <div className="flex gap-2">
              <Btn onClick={() => setRaw(EXAMPLE)}>Load example</Btn>
              <Btn onClick={() => setRaw('')} disabled={!raw}>Clear</Btn>
            </div>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            placeholder={'Paste DNA or FASTA, for example:\n>my_gene\nATGGCC...'}
            className="h-64 w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
          <label className="mt-3 inline-block cursor-pointer text-sm text-teal-800 underline-offset-2 hover:underline">
            Upload a FASTA file
            <input type="file" accept=".fa,.fasta,.txt" className="hidden" onChange={(e) => e.target.files[0]?.text().then(setRaw)} />
          </label>
          {error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <Field label="Nuclease" hint={`PAM ${NUCLEASES[nuc].pam}, ${NUCLEASES[nuc].side === 3 ? "3′" : "5′"} of the guide`}>
              <select className={inputCls} value={nuc} onChange={(e) => { setNuc(e.target.value); setLen(NUCLEASES[e.target.value].len); }}>
                {Object.keys(NUCLEASES).map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label={`Guide length: ${len} nt`}>
              <input type="range" min="18" max="25" value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-teal-800" />
            </Field>
            <Btn kind="primary" className="w-full" onClick={() => analyze()} disabled={!p.seq}>Find guides</Btn>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Length" value={p.seq.length.toLocaleString()} sub="bases" />
            <Stat label="GC content" value={p.seq ? `${gcPct(p.seq)}%` : '–'} />
          </div>
        </aside>
      </div>
    );
  };

  const Results = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Guides found" value={data.guides.length} sub={`${data.guides.filter((g) => g.strand === '+').length} forward, ${data.guides.filter((g) => g.strand === '-').length} reverse`} />
        <Stat label="Score 75 or higher" value={data.guides.filter((g) => g.score >= 75).length} />
        <Stat label="With warnings" value={data.guides.filter((g) => g.flags.length).length} />
        <Stat label="Best score" value={Math.max(0, ...data.guides.map((g) => g.score))} sub={data.nuc} />
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <Field label={`Minimum score: ${minScore}`}>
          <input type="range" min="0" max="100" value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-44 accent-teal-800" />
        </Field>
        <Field label="Strand">
          <select className={inputCls} value={strandF} onChange={(e) => setStrandF(e.target.value)}>
            <option value="both">Both</option><option value="+">Forward (+)</option><option value="-">Reverse (−)</option>
          </select>
        </Field>
        <span className="ml-auto text-sm text-slate-500">{shown.length} of {data.guides.length} shown</span>
      </div>
      {shown.length === 0 ? (
        <Empty title="No guides match these filters" text="Lower the minimum score or include both strands." action={<Btn onClick={() => { setMinScore(0); setStrandF('both'); }}>Reset filters</Btn>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr><Th k="id">ID</Th><Th k="guide">Guide (5′→3′)</Th><Th k="pam">PAM</Th><Th k="strand">Strand</Th><Th k="start">Position</Th><Th k="gc">GC</Th><Th k="score">Score</Th><th className="px-3 py-2 text-left font-medium">Warnings</th></tr>
            </thead>
            <tbody>
              {shown.slice(0, 200).map((g) => (
                <tr key={g.id} onClick={() => setSelId(g.id)} className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${g.id === selId ? 'bg-teal-50' : ''}`}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{g.id}</td>
                  <td className="px-3 py-2"><GuideSeq g={g.guide} /></td>
                  <td className="px-3 py-2 font-mono text-[13px]">{g.pam}</td>
                  <td className="px-3 py-2">{g.strand === '+' ? 'Forward' : 'Reverse'}</td>
                  <td className="px-3 py-2 tabular-nums">{g.start + 1}–{g.end}</td>
                  <td className="px-3 py-2 tabular-nums">{g.gc}%</td>
                  <td className="px-3 py-2"><ScoreBar v={g.score} /></td>
                  <td className="px-3 py-2 text-xs text-amber-800">{g.flags.join(', ') || <span className="text-slate-400">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sel && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-teal-800/30 bg-white p-4">
          <div className="text-sm text-slate-600">Selected <span className="font-mono">{sel.id}</span></div>
          <GuideSeq g={sel.guide} /><span className="font-mono text-[13px] text-slate-500">{sel.pam}</span>
          <div className="ml-auto flex gap-2">
            <Btn onClick={() => copy(sel.guide)}>Copy guide</Btn>
            <Btn onClick={() => setScreen('viewer')}>View in sequence</Btn>
            <Btn kind="primary" onClick={() => setScreen('offtargets')}>Check off-targets</Btn>
          </div>
        </div>
      )}
    </div>
  );

  const Viewer = () => {
    const { seq, guides } = data;
    const cov = new Array(seq.length).fill(0);
    guides.forEach((g) => { for (let i = g.start; i < g.end; i++) cov[i]++; });
    const pl = NUCLEASES[data.nuc].pam.length, side = NUCLEASES[data.nuc].side;
    let ps = -1;
    if (sel) ps = (sel.strand === '+') === (side === 3) ? sel.end : sel.start - pl;
    const ROW = 60, rows = [];
    for (let r = 0; r < Math.min(seq.length, 6000); r += ROW) rows.push(r);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
          {Object.entries(BASE_COLOR).slice(0, 4).map(([b, c]) => <span key={b}><b style={{ color: c }} className="font-mono">{b}</b></span>)}
          <span><span className="rounded-sm bg-teal-200 px-1.5">guide</span> selected</span>
          <span><span className="rounded-sm bg-amber-200 px-1.5">PAM</span></span>
          <span><span className="border-b-2 border-slate-400">underline</span> covered by any guide</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 font-mono text-[13px] leading-7">
          {rows.map((r) => (
            <div key={r} className="flex whitespace-nowrap">
              <span className="w-14 shrink-0 pr-3 text-right text-xs leading-7 text-slate-400">{r + 1}</span>
              <span>
                {[...seq.slice(r, r + ROW)].map((c, j) => {
                  const i = r + j;
                  const inG = sel && i >= sel.start && i < sel.end, inP = i >= ps && i < ps + pl;
                  return (
                    <span key={i} style={{ color: BASE_COLOR[c] }}
                      className={`${inG ? 'bg-teal-200' : inP ? 'bg-amber-200' : ''} ${cov[i] ? 'border-b-2 border-slate-300' : ''} ${j % 10 === 9 ? 'mr-3' : ''}`}>{c}</span>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
        {seq.length > 6000 && <p className="text-xs text-slate-500">Showing the first 6,000 bases of {seq.length.toLocaleString()}.</p>}
      </div>
    );
  };

  const Offtargets = () => !sel ? <Empty title="No guide selected" text="Pick a guide on the Guides screen first." action={<Btn onClick={() => setScreen('results')}>Go to Guides</Btn>} /> : (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div><div className="text-xs text-slate-500">Reference guide {sel.id}</div><GuideSeq g={sel.guide} /></div>
        <Field label={`Allow up to ${maxMM} mismatches`}>
          <input type="range" min="0" max="5" value={maxMM} onChange={(e) => setMaxMM(+e.target.value)} className="w-40 accent-teal-800" />
        </Field>
        <div className="ml-auto text-sm text-slate-600"><b className="tabular-nums">{off.length}</b> similar sites</div>
      </div>
      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This search only covers the sequence you pasted. It cannot see the rest of the genome, so confirm candidates with a genome-wide tool such as Cas-OFFinder before ordering.
      </p>
      {off.length === 0 ? <Empty title="No similar sites in this sequence" text={`No other site within ${maxMM} mismatches next to a valid ${NUCLEASES[data.nuc].pam} PAM.`} /> : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
              {['Site', 'Strand', 'Position', 'Mismatches', 'Matches guide at'].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {off.slice(0, 100).map((o, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2"><GuideSeq g={o.guide} mm={o.mm} /> <span className="font-mono text-[13px] text-slate-400">{o.pam}</span></td>
                  <td className="px-3 py-2">{o.strand === '+' ? 'Forward' : 'Reverse'}</td>
                  <td className="px-3 py-2 tabular-nums">{o.start + 1}–{o.end}</td>
                  <td className="px-3 py-2 tabular-nums">{o.mm.length}</td>
                  <td className="px-3 py-2 text-slate-500">{data.len - o.mm.length} of {data.len} positions</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const Projects = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Projects are saved in this browser.</p>
        <Btn kind="primary" disabled={!data} onClick={() => { persist([{ id: Date.now(), name: data.name, raw: `>${data.name}\n${data.seq}`, nuc: data.nuc, len: data.len, count: data.guides.length, date: new Date().toLocaleDateString() }, ...projects]); setToast('Project saved'); }}>Save current analysis</Btn>
      </div>
      {projects.length === 0 ? <Empty title="No saved projects" text="Run an analysis, then save it here to reopen it later." /> : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{p.nuc}, {p.len} nt, {p.count} guides, saved {p.date}</div>
              </div>
              <Btn onClick={() => { setRaw(p.raw); setNuc(p.nuc); setLen(p.len); analyze(p.raw, p.nuc, p.len); }}>Open</Btn>
              <Btn onClick={() => persist(projects.filter((x) => x.id !== p.id))}>Delete</Btn>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const Exports = () => {
    const rows = exportRows();
    const items = [
      ['CSV table', 'Open in Excel or Sheets', () => download('guides.csv', ['id,guide,pam,strand,start,end,gc_percent,score,flags', ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n'), 'text/csv')],
      ['JSON', 'For scripts and pipelines', () => download('guides.json', JSON.stringify({ sequence: data.name, nuclease: data.nuc, guides: rows }, null, 2), 'application/json')],
      ['FASTA', 'Guide sequences only, ready for ordering', () => download('guides.fasta', rows.map((r) => `>${r.id}_${r.strand}_${r.start}-${r.end} score=${r.score}\n${r.guide}`).join('\n'))],
    ];
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Exports include the {rows.length} guides currently shown on the Guides screen, so your filters apply.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(([t, d, fn]) => (
            <div key={t} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
              <div className="font-medium text-slate-900">{t}</div>
              <p className="mb-4 mt-1 flex-1 text-sm text-slate-500">{d}</p>
              <Btn onClick={fn} disabled={!rows.length}>Download {t.split(' ')[0]}</Btn>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Settings = () => (
    <div className="max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <Field label="Default nuclease"><select className={inputCls} value={nuc} onChange={(e) => { setNuc(e.target.value); setLen(NUCLEASES[e.target.value].len); }}>{Object.keys(NUCLEASES).map((n) => <option key={n}>{n}</option>)}</select></Field>
      <Field label={`Guide length: ${len} nt`}><input type="range" min="18" max="25" value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-teal-800" /></Field>
      <Field label={`Off-target mismatch limit: ${maxMM}`} hint="Higher values find more candidate sites but take longer on large sequences."><input type="range" min="0" max="5" value={maxMM} onChange={(e) => setMaxMM(+e.target.value)} className="w-full accent-teal-800" /></Field>
      <Btn onClick={() => { persist([]); setToast('Saved projects cleared'); }}>Clear saved projects</Btn>
    </div>
  );

  const About = () => (
    <div className="max-w-2xl space-y-4 text-[15px] leading-7 text-slate-700">
      <p>CRISPR-Vision scans both strands of a sequence for sites next to your chosen PAM and ranks the resulting guide RNAs. Everything runs in your browser; your sequence is never uploaded.</p>
      <h3 className="pt-2 text-base font-semibold text-slate-900">How the score works</h3>
      <p>The 0–100 score is a transparent heuristic, not a trained model. It starts at 100 and subtracts points for GC content outside 40–70%, a TTTT run (which can stop U6 transcription), other homopolymer runs, and a very GC-rich seed region. Use it to filter out poor candidates, not to predict editing efficiency.</p>
      <h3 className="pt-2 text-base font-semibold text-slate-900">Limits</h3>
      <p>Off-target search is limited to the pasted sequence. Validate shortlisted guides against the full genome with a dedicated tool before ordering.</p>
    </div>
  );

  const titles = { dashboard: 'Design', results: 'Guides', viewer: 'Sequence viewer', offtargets: 'Off-targets', projects: 'Projects', exports: 'Export', settings: 'Settings', about: 'About' };
  const body = {
    dashboard: <Dashboard />, results: needData(data && <Results />), viewer: needData(data && <Viewer />),
    offtargets: needData(data && <Offtargets />), projects: <Projects />, exports: needData(data && <Exports />),
    settings: <Settings />, about: <About />,
  }[screen];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="text-[17px] font-semibold tracking-tight text-slate-900">CRISPR-Vision</div>
          <div className="text-xs text-slate-500">Guide RNA design</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map(([id, label]) => (
            <button key={id} onClick={() => setScreen(id)}
              className={`flex w-full items-center justify-between rounded-md border-l-2 px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 ${screen === id ? 'border-teal-800 bg-teal-50 font-medium text-teal-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              {label}
              {id === 'results' && data && <span className="text-xs tabular-nums text-slate-400">{data.guides.length}</span>}
            </button>
          ))}
        </nav>
        {data && <div className="border-t border-slate-200 p-4 text-xs text-slate-500"><div className="truncate font-medium text-slate-700">{data.name}</div>{data.seq.length.toLocaleString()} bp, {data.nuc}</div>}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titles[screen]}</h1>
            <select className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm md:hidden" value={screen} onChange={(e) => setScreen(e.target.value)}>
              {nav.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </div>
          {body}
        </div>
      </main>
      {toast && <div role="status" className="fixed bottom-5 right-5 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}
