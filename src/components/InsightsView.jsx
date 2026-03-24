import React, { useMemo, useState } from 'react';
import { List, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

// --- Risk Classification Helpers ---
const getRegulatoryRisk = (feature) => {
  if (feature.complianceStatus === 'Blocked') return 5;
  if (feature.complianceStatus?.includes('Approved')) return 1;
  // Heuristic based on industry sensitivity
  const highRiskIndustries = ['FinTech & Banking', 'HealthTech & MedDev', 'Automotive & Aerospace'];
  const medRiskIndustries = ['General SaaS / AI', 'E-Commerce & Retail'];
  if (highRiskIndustries.includes(feature.industry)) return feature.complianceStatus === 'Pending' ? 4 : 3;
  if (medRiskIndustries.includes(feature.industry)) return feature.complianceStatus === 'Pending' ? 3 : 2;
  return 2;
};

const getBusinessImpact = (feature) => {
  const rice = parseFloat(feature.riceScore || 0);
  if (rice >= 300) return 5;
  if (rice >= 200) return 4;
  if (rice >= 100) return 3;
  if (rice >= 50) return 2;
  return 1;
};

const RISK_LABELS = ['', 'Very Low', 'Low', 'Medium', 'High', 'Critical'];
const IMPACT_LABELS = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Transformative'];

const CELL_COLORS = {
  '1-1': 'bg-emerald-50 dark:bg-emerald-900/40', '1-2': 'bg-emerald-50 dark:bg-emerald-900/40', '1-3': 'bg-yellow-50 dark:bg-yellow-900/40', '1-4': 'bg-orange-50 dark:bg-orange-900/40', '1-5': 'bg-red-50 dark:bg-red-900/40',
  '2-1': 'bg-emerald-50 dark:bg-emerald-900/40', '2-2': 'bg-emerald-100 dark:bg-emerald-900/60', '2-3': 'bg-yellow-50 dark:bg-yellow-900/40', '2-4': 'bg-orange-50 dark:bg-orange-900/40', '2-5': 'bg-red-100 dark:bg-red-900/60',
  '3-1': 'bg-yellow-50 dark:bg-yellow-900/40', '3-2': 'bg-yellow-50 dark:bg-yellow-900/40', '3-3': 'bg-yellow-100 dark:bg-yellow-900/60', '3-4': 'bg-orange-100 dark:bg-orange-900/60', '3-5': 'bg-red-100 dark:bg-red-900/60',
  '4-1': 'bg-orange-50 dark:bg-orange-900/40', '4-2': 'bg-orange-50 dark:bg-orange-900/40', '4-3': 'bg-orange-100 dark:bg-orange-900/60', '4-4': 'bg-red-100 dark:bg-red-900/60', '4-5': 'bg-red-200 dark:bg-red-900/80',
  '5-1': 'bg-red-50 dark:bg-red-900/40', '5-2': 'bg-red-100 dark:bg-red-900/60', '5-3': 'bg-red-100 dark:bg-red-900/60', '5-4': 'bg-red-200 dark:bg-red-900/80', '5-5': 'bg-red-300 dark:bg-red-800',
};

export default function InsightsView() {
  const { features, avgRice, epics } = useProject();
  // Classify all features into the 5x5 grid
  const heatmapData = useMemo(() => {
    const grid = {};
    for (let r = 1; r <= 5; r++) {
      for (let b = 1; b <= 5; b++) {
        grid[`${r}-${b}`] = [];
      }
    }
    features.forEach(f => {
      const regRisk = getRegulatoryRisk(f);
      const bizImpact = getBusinessImpact(f);
      const key = `${regRisk}-${bizImpact}`;
      if (grid[key]) grid[key].push(f);
    });
    return grid;
  }, [features]);

  const blockedCount = features.filter(f => f.complianceStatus === 'Blocked').length;
  const approvedCount = features.filter(f => f.complianceStatus?.includes('Approved')).length;
  const pendingCount = features.filter(f => f.complianceStatus === 'Pending').length;

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      // Simulate real file download
      const blob = new Blob(['Mock PDF Content - Enterprise Compliance Report'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cynapse_Compliance_Report_Q3.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Insights Hub</h1>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed shadow-sm border border-indigo-500"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isExporting ? 'Generating PDF...' : 'Export Compliance Report'}
        </button>
      </div>

      {/* KPI Cards (Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400"><List size={20}/></div>
          <div><div className="text-xl font-bold text-slate-900 dark:text-slate-100">{features.length}</div><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Active Initiatives</div></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400"><AlertTriangle size={20}/></div>
          <div><div className="text-xl font-bold text-red-700 dark:text-red-400">{blockedCount}</div><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Critical Risks</div></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400"><CheckCircle size={20}/></div>
          <div><div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{features.length > 0 ? ((approvedCount / features.length) * 100).toFixed(0) : 0}%</div><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Compliance Rate</div></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400"><TrendingUp size={20}/></div>
          <div><div className="text-xl font-bold text-slate-900 dark:text-slate-100">{features.reduce((acc, f) => acc + parseFloat(f.riceScore || 0), 0).toLocaleString()}</div><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total RICE Value</div></div>
        </div>
      </div>

      {/* Risk Heatmap */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-6 min-w-[600px]">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Enterprise Risk Heatmap</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Business Impact vs Regulatory Risk — hover cells for feature details</p>
          </div>
          <div className="flex gap-3 text-[10px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/60"></span>Low Risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/60"></span>Monitor</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/60"></span>Elevated</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/60"></span>Critical</span>
          </div>
        </div>

        <div className="flex">
          {/* Y-axis label */}
          <div className="flex flex-col justify-center mr-3">
            <div className="writing-mode-vertical text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
              ← Regulatory Risk →
            </div>
          </div>

          <div className="flex-1">
            {/* Grid */}
            <div className="grid grid-cols-6 gap-0">
              {/* Empty corner */}
              <div />
              {/* X-axis headers */}
              {[1,2,3,4,5].map(b => (
                <div key={`h-${b}`} className="text-center text-[9px] font-bold text-slate-400 uppercase pb-2">
                  {IMPACT_LABELS[b]}
                </div>
              ))}

              {/* Rows (risk 5 at top → 1 at bottom) */}
              {[5,4,3,2,1].map(r => (
                <React.Fragment key={`row-${r}`}>
                  {/* Row label */}
                  <div className="flex items-center justify-end pr-3 text-[9px] font-bold text-slate-400 uppercase">
                    {RISK_LABELS[r]}
                  </div>
                  {/* Cells */}
                  {[1,2,3,4,5].map(b => {
                    const key = `${r}-${b}`;
                    const items = heatmapData[key] || [];
                    const cellColor = CELL_COLORS[key] || 'bg-slate-50 dark:bg-slate-800';
                    return (
                      <div
                        key={key}
                        className={`relative border border-slate-100 dark:border-slate-700/50 rounded-md p-1.5 min-h-[56px] ${cellColor} transition-all hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500 group`}
                        title={items.map(f => f.title).join(', ') || 'Empty'}
                      >
                        {items.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {items.map(f => {
                              const epic = epics?.find(e => e.id === f.epicId);
                              return (
                                <div
                                  key={f.id}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-sm cursor-default"
                                  style={{ background: epic?.color || '#6366f1' }}
                                  title={`${f.title} (RICE: ${f.riceScore})`}
                                >
                                  {f.id?.split('-')[1]?.slice(-2) || '??'}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Tooltip on hover */}
                        {items.length > 0 && (
                          <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {items.map(f => f.title).join(' • ')}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* X-axis label */}
            <div className="text-center mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              ← Business Impact →
            </div>
          </div>
        </div>
      </div>

      {/* Distribution breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">By Status</h3>
          {['Discovery', 'Validation', 'Ready', 'Delivery'].map(s => {
            const count = features.filter(f => f.status === s).length;
            const pct = features.length > 0 ? (count / features.length * 100) : 0;
            return (
              <div key={s} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-600 dark:text-slate-400">{s}</span><span className="font-bold text-slate-800 dark:text-slate-200">{count}</span></div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">By Compliance</h3>
          {[{ label: 'Approved', color: 'bg-emerald-500', count: approvedCount }, { label: 'Pending', color: 'bg-amber-500', count: pendingCount }, { label: 'Blocked', color: 'bg-red-500', count: blockedCount }].map(({ label, color, count }) => {
            const pct = features.length > 0 ? (count / features.length * 100) : 0;
            return (
              <div key={label} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-600 dark:text-slate-400">{label}</span><span className="font-bold text-slate-800 dark:text-slate-200">{count}</span></div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">By Epic</h3>
          {(epics || []).map(epic => {
            const count = features.filter(f => f.epicId === epic.id).length;
            const pct = features.length > 0 ? (count / features.length * 100) : 0;
            return (
              <div key={epic.id} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-600 dark:text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: epic.color }}></span>{epic.name}</span><span className="font-bold text-slate-800 dark:text-slate-200">{count}</span></div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: epic.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module 5: Hardcoded 5-Row Audit Log */}
      <div className="mt-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
             Global Security Audit Log (Recent)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Action</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">2 Mins Ago</td>
                <td className="px-4 py-3 font-bold text-emerald-600">Feature Create</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">CYN-101 (UPI Payment Gateway) drafted.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">1 Hr Ago</td>
                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Evidence Uploaded</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Architecture_Diagram.png uploaded to Document Vault.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">4 Hrs Ago</td>
                <td className="px-4 py-3 font-bold text-indigo-600">Automated Risk Scoring</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">RICE Matrix recalculated by AI heuristics for Q3.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">12 Hrs Ago</td>
                <td className="px-4 py-3 font-bold text-rose-600">Node 1 Block</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Twilio Vendor Hard-Gate. GDPR Art 44 violation intercepted.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">1 Day Ago</td>
                <td className="px-4 py-3 font-bold text-amber-600">Policy Override</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">CPO enacted manual bypass on GDPR module restrictions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
