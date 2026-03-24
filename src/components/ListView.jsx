import React, { useMemo } from 'react';
import {
  FileText, ThumbsUp, AlertTriangle, Flame, Sparkles,
  TrendingUp, ShieldCheck, Layers, ArrowUpRight, Clock
} from 'lucide-react';
import { ComplianceBadge, StatusBadge } from './Badges';
import { useProject } from '../context/ProjectContext';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300 group hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-black/5`}>
          <Icon size={22} />
        </div>
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-4xl font-black text-[#191c1e] dark:text-white tracking-tighter font-['Manrope',_sans-serif]">{value}</div>
      {sub && <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5 uppercase tracking-wide italic">{sub}</div>}
    </div>
  );
}

export default function ListView() {
  const { filteredFeatures: features, openEditModal, handleVote, epics } = useProject();

  const stats = useMemo(() => {
    const total = features.length;
    const blocked = features.filter(f => f.complianceStatus === 'Blocked').length;
    const approved = features.filter(f => f.complianceStatus?.includes('Approved')).length;
    const avgRice = total > 0 ? (features.reduce((s, f) => s + (Number(f.riceScore) || 0), 0) / total).toFixed(0) : 0;
    const inProgress = features.filter(f => f.status === 'In Development' || f.status === 'Validation').length;
    return { total, blocked, approved, avgRice, inProgress };
  }, [features]);

  return (
    <div className="space-y-10 animate-fade-in relative">
      {/* ── Hero Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Layers} label="Active Initiatives" value={stats.total} sub={`${stats.inProgress} progressing`}
          color="bg-indigo-50 dark:bg-indigo-900/50 text-[#24389c] dark:text-indigo-400" />
        <StatCard icon={TrendingUp} label="RICE Benchmark" value={stats.avgRice} sub="Global efficiency"
          color="bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={ShieldCheck} label="Compliance" value={stats.approved} sub={`${stats.blocked} gated`}
          color="bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400" />
        <StatCard icon={Sparkles} label="Critical Alerts" value={stats.blocked} sub="Attention required"
          color="bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" />
      </div>

      {/* ── Feature Table ── */}
      <div className="bg-transparent overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-6 px-8 py-5 bg-[#f2f4f6] dark:bg-slate-900/50 rounded-2xl mb-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          <div className="col-span-4">Initiative Identifier</div>
          <div className="col-span-2">Vertical / Epic</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-center">Architect</div>
          <div className="col-span-1 text-right">RICE</div>
          <div className="col-span-2 text-center">Compliance Map</div>
          <div className="col-span-1 text-right">Votes</div>
        </div>

        {/* Rows */}
        <div className="space-y-4">
          {features.map((feature, i) => {
            const epic = epics?.find(e => e.id === feature.epicId);
            const rice = Number(feature.riceScore) || 0;
            const riceColor = rice >= 500 ? 'text-emerald-600 dark:text-emerald-400'
              : rice >= 100 ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400';

            return (
              <div
                key={feature.id}
                onClick={() => openEditModal(feature)}
                className="grid grid-cols-12 gap-6 px-8 py-4 bg-white dark:bg-slate-900/30 hover:bg-[#f2f4f6] dark:hover:bg-slate-800 transition-all duration-300 rounded-3xl cursor-pointer items-center group relative overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none border border-transparent hover:border-indigo-100 dark:hover:border-slate-800"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Initiative */}
                <div className="col-span-4 flex gap-4 items-center min-w-0">
                  <div className="p-3 rounded-2xl bg-[#f7f9fb] dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-[#24389c] group-hover:text-white transition-all duration-300 shrink-0 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#191c1e] dark:text-slate-100 text-[15px] truncate flex items-center gap-2 group-hover:text-[#24389c] dark:group-hover:text-indigo-400 transition-colors">
                      {feature.priority === 'Critical' && <Flame size={14} className="text-orange-500 animate-pulse shrink-0" />}
                      {feature.title || 'Untitled Initiative'}
                      <ArrowUpRight size={14} className="opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-[#24389c] dark:text-indigo-400 shrink-0" />
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest mt-0.5 flex items-center gap-2">
                      {feature.id}
                      {feature.dependencies?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full font-black uppercase">
                          <AlertTriangle size={10} />{feature.dependencies.length} blockers
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Epic */}
                <div className="col-span-2">
                  {epic ? (
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: epic.color }} />
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 truncate uppercase tracking-tight">{epic.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center"><StatusBadge status={feature.status} /></div>

                {/* Owner */}
                <div className="col-span-1 flex justify-center">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-[#24389c] dark:text-indigo-400 flex items-center justify-center text-[10px] font-black border border-white dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {feature.assignee ? String(feature.assignee).substring(0, 2).toUpperCase() : 'UI'}
                  </div>
                </div>

                {/* RICE */}
                <div className={`col-span-1 text-right font-black text-[16px] tabular-nums tracking-tighter ${riceColor}`}>
                  {rice.toFixed(0)}
                </div>

                {/* Compliance */}
                <div className="col-span-2 flex justify-center">
                  <ComplianceBadge status={feature.complianceStatus} />
                </div>

                {/* Votes */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => handleVote(e, feature.id)}
                    className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 hover:text-[#24389c] dark:hover:text-indigo-400 hover:bg-[#24389c]/5 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-95"
                  >
                    <ThumbsUp size={14} /> {feature.votes}
                  </button>
                </div>
              </div>
            );
          })}
          {features.length === 0 && (
            <div className="p-20 text-center bg-white dark:bg-slate-900/30 rounded-3xl mt-10">
              <Layers size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-6" />
              <div className="text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest">No matching initiatives located</div>
              <div className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 font-bold uppercase tracking-wider">Expand your search perimeter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
