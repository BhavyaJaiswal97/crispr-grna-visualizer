import React, { withState, useState } from 'react';

function App() {
  const [seq, setSeq] = useState('');
  const [results, setResults] = useState(null);

  const handleAnalyze = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: seq })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      alert("Error contacting API: Make sure Docker containers are running!");
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>CRISPR Off-Target & gRNA Visualizer</h1>
      <textarea 
        rows="4" 
        cols="50" 
        placeholder="Paste DNA Sequence (e.g. ATGCATCGATCGATCGATCGATCGG)" 
        value={seq} 
        onChange={(e) => setSeq(e.target.value)} 
      />
      <br /><br />
      <button onClick=handleAnalyze style={{ padding: '0.5rem 1rem' }}>Analyze Sequence</button>

      {results && (
        <div>
          <h3>Results (Sequence Length: {results.length})</h3>
          84>Found {results.candidates.length} gRNA Candidates:</h4>
          <ul>
            {results.candidates.map((c, idx) => (
              <li key={idx}>
                <strong>gRNA:</strong> {c.grna} | <strong>PAM:</strong> {c.pam} | <strong>Position:</strong> {c.position} | <strong>GC%: </strong> {c.gc}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
