import React, { useMemo, useState } from 'react';
import { Search, FolderKanban, Sparkles } from 'lucide-react';

const SPACES = [
  { name: 'My discovery space', key: 'MDS', type: 'Discovery', lead: 'Aman Sinha' },
  { name: 'Risk Automation', key: 'RA', type: 'Compliance', lead: 'Nisha Verma' },
  { name: 'Trust Center Revamp', key: 'TCR', type: 'Security', lead: 'Rahul Iyer' },
  { name: 'Vendor Intelligence', key: 'VI', type: 'Ops', lead: 'Priya Kapoor' },
];

export default function SpacesPage() {
  const [q, setQ] = useState('');
  const [activeSpace, setActiveSpace] = useState(SPACES[0].key);
  const filtered = useMemo(
    () => SPACES.filter((s) => `${s.name} ${s.key} ${s.type} ${s.lead}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[240px_1fr_280px] gap-5">
      <aside className="glass-card rounded-2xl p-4 h-fit">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Recent Spaces</p>
        <div className="space-y-2">
          {SPACES.slice(0, 3).map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSpace(s.key)}
              className={`w-full text-left px-3 py-2 rounded-lg ${
                activeSpace === s.key
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="text-xs text-slate-500">{s.key}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="glass-card rounded-2xl p-5">
        <h1 className="text-2xl font-extrabold tracking-tight mb-4">Spaces</h1>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search spaces..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Key</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.key} className="border-t border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.key}</td>
                  <td className="px-3 py-2">{s.type}</td>
                  <td className="px-3 py-2">{s.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <aside className="glass-card rounded-2xl p-4 h-fit">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Templates</p>
        <div className="space-y-3">
          <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-700">
            <button
              onClick={() => alert('Template integration coming in Q3')}
              className="w-full text-left"
            >
              <p className="font-semibold text-sm flex items-center gap-2"><FolderKanban size={14} /> Product ideas</p>
            </button>
            <p className="text-xs text-slate-500 mt-1">Capture customer needs and solution hypotheses.</p>
          </div>
          <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-700">
            <button
              onClick={() => alert('Template integration coming in Q3')}
              className="w-full text-left"
            >
              <p className="font-semibold text-sm flex items-center gap-2"><Sparkles size={14} /> Product roadmap</p>
            </button>
            <p className="text-xs text-slate-500 mt-1">Strategic roadmap with priorities and timelines.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
