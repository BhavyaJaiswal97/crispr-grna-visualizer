import React, { useState } from 'react';

function App() {
  const [seq, setSeq] = useState('');
  const [bgSeq, setBgSeq] = useState('');
  const [nuclease, setNuclease] = useState('SpCas9');
  const [results, setResults] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setSelectedCandidate(null);
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: seq,
          nuclease: nuclease,
          off_target_background: bgSeq || null,
          max_mismatches: 3
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to analyze sequence');
      }
      const data = await res.json();
      setResults(data);
      if (data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (err) {
      setError(err.message || 'Error connecting to backend container.');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score) => {
    if (score >= 70) return '#16a34a'; // Green
    if (score >= 50) return '#ca8a04'; // Yellow
    return '#dc2626'; // Red
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>CRISPR Off-Target & gRNA Visualizer Report</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
          Multi-nuclease CRISPR design studio featuring Hsu et al. (MIT) off-target scoring & Doench-Root efficiency profiling.
        </p>
      </header>

      {/* Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Target Genomic DNA Sequence:
          </label>
          <textarea
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            placeholder="Paste raw target DNA sequence (minimum 23 bp, e.g. ATGCGATCGATCGATCGATCGATCGGATCGATCG...)"
            value={seq}
            onChange={(e) => setSeq(e.target.value)}
          />

          <label style={{ display: 'block', fontWeight: 'bold', margin: '1rem 0 0.5rem 0' }}>
            Optional Off-Target Background Genome (or Contig) to Scan:
          </label>
          <textarea
            rows={2}
            style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            placeholder="Paste background sequence to scan for unintended mismatches..."
            value={bgSeq}
            onChange={(e) => setBgSeq(e.target.value)}
          />
        </div>

        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Select CRISPR Nuclease:
          </label>
          <select
            value={nuclease}
            onChange={(e) => setNuclease(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1.25rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value="SpCas9">SpCas9 (PAM: NGG | 3'-oriented)</option>
            <option value="SaCas9">SaCas9 (PAM: NNGRRT | 3'-oriented)</option>
            <option value="Cas12a">Cas12a / Cpf1 (PAM: TTTV | 5'-oriented)</option>
          </select>

          <button
            onClick={handleAnalyze}
            disabled={loading || !seq.trim()}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Running Algorithms...' : 'Analyze & Generate CRISPR Report'}
          </button>

          {error && <div style={{ color: '#dc2626', marginTop: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
        </div>
      </div>

      {/* Visual Sequence Map */}
      {results && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3>Genomic Sequence Browser & Target Alignment Map</h3>
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            padding: '1.25rem',
            borderRadius: '8px',
            overflowX: 'auto',
            lineHeight: '2',
            wordBreak: 'break-all'
          }}>
            {seq.toUpperCase().split('').map((base, idx) => {
              let isGuide = false;
              let isPam = false;
              if (selectedCandidate) {
                const gStart = selectedCandidate.position;
                const gEnd = gStart + selectedCandidate.grna.length;
                const pEnd = gEnd + selectedCandidate.pam.length;
                if (idx >= gStart && idx < gEnd) isGuide = true;
                if (idx >= gEnd && idx < pEnd) isPam = true;
              }
              return (
                <span
                  key={idx}
                  style={{
                    backgroundColor: isGuide ? '#2563eb' : (isPam ? '#dc2626' : 'transparent'),
                    color: (isGuide || isPam) ? '#ffffff' : '#cbd5e1',
                    padding: '2px 3px',
                    borderRadius: '2px',
                    fontWeight: (isGuide || isPam) ? 'bold' : 'normal'
                  }}
                  title={`Position: ${idx} | Base: ${base}`}
                >
                  {base}
                </span>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#2563eb', marginRight: '6px' }}></span>Target gRNA ({selectedCandidate?.grna})</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dc2626', marginRight: '6px' }}></span>PAM Site ({selectedCandidate?.pam})</span>
          </div>
        </div>
      )}

      {/* Candidates Table & Off-Target Analytics */}
      {results && (
        <div>
          <h3>Guide RNA (gRNA) Candidate Report ({results.candidates.length} Found)</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Click any row to inspect its alignment in the Genomic Sequence Map above.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {results.candidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidate(cand)}
                style={{
                  border: selectedCandidate?.id === cand.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: selectedCandidate?.id === cand.id ? '#eff6ff' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>
                    {cand.grna} <span style={{ color: '#dc2626' }}>{cand.pam}</span>
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getEfficiencyColor(cand.efficiency_score)
                    }}>
                      Efficiency: {cand.efficiency_score}/100
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                      <strong>GC:</strong> {cand.gc_content}% | <strong>Pos:</strong> {cand.position}
                    </span>
                  </div>
                </div>

                {/* Biological Warnings */}
                {cand.warnings.length > 0 && (
                  <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <strong>⚠️ Structural Warnings:</strong> {cand.warnings.join(' ')}
                  </div>
                )}

                {/* Off-target breakdown */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.875rem' }}>Off-Target Specificity Matches ({cand.off_target_count}):</strong>
                  {cand.off_targets.length === 0 ? (
                    <span style={{ color: '#16a34a', fontSize: '0.875rem', marginLeft: '0.5rem' }}>✔ No high-risk off-target mismatches found within background sequence.</span>
                  ) : (
                    <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.85rem' }}>
                      {cand.off_targets.map((ot, idx) => (
                        <li key={idx}>
                          <span style={{ fontFamily: 'monospace' }}>{ot.sequence}</span> — Position {ot.position} ({ot.mismatches} mismatches) | Specificity Score: <strong>{ot.specificity_score}</strong> ({ot.risk_level} risk)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
