import React, { useState } from 'react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState(1);
  const [selectedProject, setSelectedProject] = useState('BRCA1_Target_Design');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { id: 1, label: 'Dashboard', icon: '🏠' },
    { id: 2, label: 'Results', icon: '📊' },
    { id: 3, label: 'Sequence Viewer', icon: '🧬' },
    { id: 4, label: 'Off-Targets', icon: '🎯' },
    { id: 5, label: 'Projects', icon: '📁' },
    { id: 6, label: 'Exports', icon: '📥' },
    { id: 7, label: 'Settings', icon: '⚙️' },
    { id: 8, label: 'About', icon: 'ℹ️' },
  ];

  const resultsData = [
    { id: 1, spacer: 'GCTAGCTAGCTAGCTAGCTA', start: 1250, end: 1269, strand: '+', gc: '55%', mismatches: 1, specificity: '92.1%' },
    { id: 2, spacer: 'CGATCGATCGATCGATCGAT', start: 3321, end: 3349, strand: '-', gc: '60%', mismatches: 2, specificity: '87.4%' },
    { id: 3, spacer: 'TGCATCGATCGATCGATCGA', start: 5120, end: 5139, strand: '+', gc: '60%', mismatches: 1, specificity: '84.6%' },
    { id: 4, spacer: 'AGCTAGCTAGCTAGCTAGCT', start: 789, end: 808, strand: '+', gc: '45%', mismatches: 3, specificity: '76.3%' },
    { id: 5, spacer: 'GGGATGATCGATCGATCGTA', start: 2210, end: 2229, strand: '-', gc: '65%', mismatches: 2, specificity: '73.8%' },
  ];

  const projectsData = [
    { title: 'BRCA1_Target_Design', date: 'May 20, 2025 • 10:42 AM', length: '8,432 bp', cas: 'SpCas9 NGG' },
    { title: 'TP53_gRNA_Set', date: 'May 18, 2025 • 3:15 PM', length: '7,128 bp', cas: 'SpCas9 NGG' },
    { title: 'VEGFA_Promoter', date: 'May 15, 2025 • 11:05 AM', length: '6,210 bp', cas: 'SpCas9 NGG' },
    { title: 'IL2RG_Exon3', date: 'May 12, 2025 • 9:30 AM', length: '5,980 bp', cas: 'SpCas9 NGG' },
    { title: 'MYC_Enhancer', date: 'May 10, 2025 • 4:20 PM', length: '10,203 bp', cas: 'SpCas9 NGG' },
  ];

  const nucleotides = ['A', 'T', 'C', 'G', 'A', 'T', 'G', 'C', 'A', 'T', 'G', 'C', 'A', 'T', 'A', 'T', 'G', 'C', 'A', 'G', 'C', 'T', 'A', 'G'];
  const getColor = (n) => {
    switch(n) {
      case 'A': return 'bg-emerald-500 text-white';
      case 'T': return 'bg-rose-500 text-white';
      case 'C': return 'bg-blue-500 text-white';
      case 'G': return 'bg-amber-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans antialiased overflow-hidden">
      
      {/* Dark Sidebar Navigation */}
      <aside className="w-64 bg-[#111827] text-gray-300 flex flex-col justify-between h-screen p-4 select-none shrink-0">
        <div>
          <div className="flex items-center space-x-2 px-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow">CV</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">CRISPR-Vision</h1>
              <p className="text-[10px] text-gray-400">gRNA Design Suite</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  activeScreen === item.id ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-800 text-gray-400'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="text-[11px] text-gray-500 px-2 flex justify-between items-center border-t border-gray-800 pt-3">
          <span>v1.0.0</span>
          <span>🌙 ⚙️</span>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto relative">
        
        {/* SCREEN 1: Landing & Sequence Input Dashboard */}
        {activeScreen === 1 && (
          <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to CRISPR-Vision</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Design high-specificity gRNAs and visualize genomic targets with confidence.</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex space-x-6 border-b border-gray-100 pb-3 mb-4 text-xs font-semibold text-blue-600">
                <span className="border-b-2 border-blue-600 pb-3 cursor-pointer">Input Sequence</span>
                <span className="text-gray-400 cursor-pointer hover:text-gray-600">Example Sequences</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Paste raw DNA sequence</label>
                  <textarea 
                    className="w-full h-44 p-3 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                    defaultValue="ATCGGATCGGACTCGATCGATCGATCGATCGTCG&#10;CTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG&#10;CSATCGATCGATCGTCGATCGATCGATCGATC&#10;ATCGATCGATCGCTTAGCTAGCTAGCTAGCTA&#10;GATCGATCGATCGATCGATCGATCGATCGATC"
                  />
                </div>
                <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-blue-50 transition">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 font-bold text-lg">📁</div>
                  <p className="text-xs font-semibold text-blue-600">Drag & drop .fasta file here</p>
                  <p className="text-[11px] text-gray-400 mt-1">or click to browse</p>
                  <span className="text-[10px] text-gray-400 mt-3">Supports .fasta, .fa, .txt (max 50MB)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Cas Variant</label>
                  <select className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white text-gray-800 focus:outline-none shadow-sm">
                    <option>SpCas9 NGG</option>
                  </select>
                </div>
                <button 
                  onClick={() => setActiveScreen(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-xs shadow-md transition-colors flex items-center space-x-2"
                >
                  <span>▶ Run Analysis</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: Candidate Results & Scoring Table */}
        {activeScreen === 2 && (
          <div className="p-8 max-w-7xl mx-auto">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Total Candidates</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">23</h3>
                <span className="text-[10px] text-gray-500">Passing filters</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">High Specificity (Score ≥ 70)</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">11</h3>
                <span className="text-[10px] text-gray-500">47.8%</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Average GC Content</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">52.3%</h3>
                <span className="text-[10px] text-gray-500">Optimal (40-60%)</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Best Score</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-1">92.1</h3>
                <span className="text-[10px] text-gray-500">Rank #1</span>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <input type="text" placeholder="Search by sequence..." className="px-3 py-1.5 border rounded-lg text-xs w-64 bg-white" />
                <button onClick={() => setIsDrawerOpen(true)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100">
                  Inspect Row 1 (Drawer Demo)
                </button>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 font-semibold">
                    <th className="p-3">Rank</th>
                    <th className="p-3">gRNA Spacer (20 bp)</th>
                    <th className="p-3">Start</th>
                    <th className="p-3">End</th>
                    <th className="p-3">Strand</th>
                    <th className="p-3">GC %</th>
                    <th className="p-3">Off-Target Mismatches</th>
                    <th className="p-3">Specificity Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultsData.map((row) => (
                    <tr key={row.id} onClick={() => setIsDrawerOpen(true)} className="hover:bg-blue-50/50 cursor-pointer transition">
                      <td className="p-3 font-semibold text-gray-500">{row.id}</td>
                      <td className="p-3 font-mono text-gray-800 font-medium">{row.spacer}</td>
                      <td className="p-3 text-gray-600">{row.start}</td>
                      <td className="p-3 text-gray-600">{row.end}</td>
                      <td className="p-3 text-gray-600 font-bold">{row.strand}</td>
                      <td className="p-3 text-gray-600">{row.gc}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">{row.mismatches}</span></td>
                      <td className="p-3 font-bold text-emerald-600">{row.specificity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCREEN 3: Interactive Genomic Sequence Viewer */}
        {activeScreen === 3 && (
          <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-gray-700">Sequence: Untitled_Sequence_01.fasta</span>
              <span className="text-xs text-gray-500 font-mono">Length: 8,432 bp</span>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6 border-b pb-4 text-xs">
                <button className="border px-3 py-1.5 rounded-lg bg-gray-50 font-medium hover:bg-gray-100">🔍 Zoom: 1.5x</button>
                <button className="border px-3 py-1.5 rounded-lg bg-gray-50 font-medium hover:bg-gray-100">Fit to Screen</button>
              </div>

              {/* Nucleotide Grid Blocks */}
              <div className="font-mono text-xs overflow-x-auto py-2">
                <p className="text-[11px] text-gray-400 mb-2">Forward Strand (5' → 3')</p>
                <div className="flex space-x-1">
                  {nucleotides.map((n, idx) => (
                    <div key={idx} className={`w-8 h-8 flex items-center justify-center font-bold rounded text-xs shadow-sm ${getColor(n)}`}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              {/* Binding Tracks Placeholder */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-3">gRNA Candidates (Top)</p>
                <div className="h-10 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center px-4 space-x-4 text-xs text-emerald-800 font-semibold">
                  <span>#1 Target Region</span>
                  <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded">Chr 1: 1,250 - 1,269 (+)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: Off-Target Details Modal / Drawer */}
        {(activeScreen === 4 || isDrawerOpen) && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex justify-end z-50">
            <div className="w-[450px] bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="font-bold text-gray-900 text-sm">gRNA Candidate #1</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
                </div>
                
                <div className="mt-4 bg-gray-50 p-3 rounded-lg border">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Spacer Sequence (20 bp)</p>
                  <p className="font-mono font-bold text-sm text-blue-600 mt-1">GCTAGCTAGCTAGCTAGCTA</p>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">Off-Target Matches</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 border rounded-lg flex justify-between items-center bg-white shadow-xs">
                      <span className="font-semibold text-gray-800">chr3: 125,438</span>
                      <span className="text-emerald-600 font-bold">Score: 91.3</span>
                    </div>
                    <div className="p-3 border rounded-lg flex justify-between items-center bg-white shadow-xs">
                      <span className="font-semibold text-gray-800">chr7: 88,912</span>
                      <span className="text-emerald-600 font-bold">Score: 78.5</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsDrawerOpen(false)} className="w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-medium hover:bg-black">
                Close Drawer
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: Project History & Saved Sessions */}
        {activeScreen === 5 && (
          <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Projects</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage and revisit your CRISPR design sessions.</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm">
                + New Project
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {projectsData.map((proj, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{proj.title}</h3>
                  <p className="text-[11px] text-gray-400 mb-4">{proj.date}</p>
                  <div className="text-xs text-gray-600 space-y-1 mb-5">
                    <p>Length: <span className="font-mono font-medium">{proj.length}</span></p>
                    <p>Cas: <span className="font-medium">{proj.cas}</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedProject(proj.title)} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-lg text-xs font-semibold">Open</button>
                    <button className="p-1.5 border rounded-lg text-gray-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 6: Export & Summary Report Modal */}
        {(activeScreen === 6 || isExportModalOpen) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Export & Summary Report</h3>
                <button onClick={() => setActiveScreen(1)} className="text-gray-400 hover:text-black font-bold">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Select Export Format</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2"><input type="radio" name="format" defaultChecked /> <span>CSV (Comma Separated Values)</span></label>
                    <label className="flex items-center space-x-2"><input type="radio" name="format" /> <span>FASTA Sequences</span></label>
                    <label className="flex items-center space-x-2"><input type="radio" name="format" /> <span>JSON (All Data)</span></label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block font-semibold text-gray-700 mb-2">Include in Export</label>
                  <div className="space-y-2 text-gray-600">
                    <label className="flex items-center space-x-2"><input type="checkbox" defaultChecked /> <span>Include gRNA candidate table</span></label>
                    <label className="flex items-center space-x-2"><input type="checkbox" defaultChecked /> <span>Include off-target breakdown</span></label>
                    <label className="flex items-center space-x-2"><input type="checkbox" defaultChecked /> <span>Include GC content scores</span></label>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                <button onClick={() => setActiveScreen(1)} className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={() => alert("Report downloaded successfully!")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-medium shadow-sm">Download Report</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
