import React, { useMemo } from 'react';
import {
  LayoutDashboard, TrendingUp, ShieldCheck, AlertTriangle,
  ArrowRight, Users, Globe, Clock, Zap, BarChart3, Target
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

// --- SVG Donut Chart ---
function DonutChart({ segments, size = 120, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = total > 0 ? seg.value / total : 0;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const rotation = (offset / total) * 360;
        offset += seg.value;
        return (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={circumference / 4}
            transform={`rotate(${rotation} ${size/2} ${size/2})`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        );
      })}
      {/* Center text */}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" className="fill-slate-800 text-lg font-bold">{total}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" className="fill-slate-400 text-[9px] font-semibold uppercase">Total</text>
    </svg>
  );
}

// --- Mini Sparkline ---
function Sparkline({ data, color = '#6366f1', width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={3} fill={color} />;
      })()}
    </svg>
  );
}

// --- Progress Bar ---
function ProgressBar({ label, value, max, color, subtext }) {
  const pct = max > 0 ? (value / max * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }}></span>
          {label}
        </span>
        <span className="text-[10px] font-bold text-slate-500">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      {subtext && <span className="text-[9px] text-slate-400 mt-0.5 block">{subtext}</span>}
    </div>
  );
}

export default function DashboardView() {
  const { features, epics, users, currentUser } = useProject();
  // --- Computed metrics ---
  const metrics = useMemo(() => {
    const total = features.length;
    const approved = features.filter(f => f.complianceStatus?.includes('Approved')).length;
    const blocked = features.filter(f => f.complianceStatus === 'Blocked').length;
    const pending = features.filter(f => f.complianceStatus === 'Pending').length;
    const avgRice = total > 0 ? (features.reduce((a, f) => a + parseFloat(f.riceScore || 0), 0) / total) : 0;

    // Pipeline counts
    const pipeline = {};
    ['Discovery', 'Validation', 'Ready', 'Delivery'].forEach(s => { pipeline[s] = features.filter(f => f.status === s).length; });

    // Region distribution
    const regions = {};
    features.forEach(f => { regions[f.region] = (regions[f.region] || 0) + 1; });

    // Epic progress
    const epicProgress = (epics || []).map(epic => {
      const epicFeatures = features.filter(f => f.epicId === epic.id);
      const done = epicFeatures.filter(f => f.status === 'Delivery').length;
      return { ...epic, total: epicFeatures.length, done, avgRice: epicFeatures.length > 0 ? (epicFeatures.reduce((a, f) => a + parseFloat(f.riceScore || 0), 0) / epicFeatures.length).toFixed(0) : 0 };
    });

    // Simulated velocity data (last 8 sprints)
    const velocity = [2, 3, 1, 4, 3, 5, total > 2 ? 3 : 1, total];

    // Compliance rate
    const complianceRate = total > 0 ? ((approved / total) * 100).toFixed(0) : 0;

    // Recent activity from features with history
    const allHistory = features
      .flatMap(f => (f.history || []).map(h => ({ ...h, featureTitle: f.title, featureId: f.id })))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    return { total, approved, blocked, pending, avgRice, pipeline, regions, epicProgress, velocity, complianceRate, allHistory };
  }, [features, epics]);

  const formatTime = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><LayoutDashboard size={24} className="text-indigo-600 dark:text-indigo-400" /></div>
              Executive Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Portfolio health overview for {currentUser?.name || 'Leadership'}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Last Updated</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Initiatives', value: metrics.total, icon: Target, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', trend: '+2 this month' },
          { label: 'Avg RICE Score', value: metrics.avgRice.toFixed(0), icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', trend: 'Portfolio health' },
          { label: 'Compliance Rate', value: `${metrics.complianceRate}%`, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', trend: `${metrics.approved} approved` },
          { label: 'Blocked', value: metrics.blocked, icon: AlertTriangle, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', trend: 'Active blockers' },
          { label: 'In Delivery', value: metrics.pipeline['Delivery'] || 0, icon: Zap, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', trend: 'Shipping now' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={18} /></div>
              <Sparkline data={metrics.velocity} color={i === 3 ? '#ef4444' : '#6366f1'} width={60} height={24} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mt-0.5">{kpi.label}</div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{kpi.trend}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-indigo-600 dark:text-indigo-400" /> Pipeline Funnel
          </h3>
          <div className="flex items-end gap-3 justify-around">
            {['Discovery', 'Validation', 'Ready', 'Delivery'].map((stage, i) => {
              const count = metrics.pipeline[stage] || 0;
              const maxCount = Math.max(...Object.values(metrics.pipeline), 1);
              const heightPct = (count / maxCount) * 100;
              const colors = ['bg-slate-300', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'];
              return (
                <div key={stage} className="flex-1 text-center">
                  <div className="relative h-32 flex items-end justify-center">
                    <div
                      className={`w-full max-w-[60px] mx-auto ${colors[i]} rounded-t-lg transition-all duration-700 relative`}
                      style={{ height: `${Math.max(heightPct, 8)}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg font-bold text-slate-800">{count}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase">{stage}</div>
                  {i < 3 && <ArrowRight size={10} className="text-slate-300 mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Posture */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> Compliance Posture
          </h3>
          <div className="flex justify-center mb-4">
            <DonutChart
              segments={[
                { value: metrics.approved, color: '#10b981' },
                { value: metrics.pending, color: '#f59e0b' },
                { value: metrics.blocked, color: '#ef4444' },
              ]}
              size={130}
              strokeWidth={16}
            />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Approved', count: metrics.approved, color: '#10b981' },
              { label: 'Pending Review', count: metrics.pending, color: '#f59e0b' },
              { label: 'Blocked', count: metrics.blocked, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }}></span>
                  {item.label}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Epic Progress */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Target size={14} className="text-indigo-600 dark:text-indigo-400" /> Epic Progress
          </h3>
          {metrics.epicProgress.map(epic => (
            <ProgressBar
              key={epic.id}
              label={epic.name}
              value={epic.done}
              max={epic.total}
              color={epic.color}
              subtext={`Avg RICE: ${epic.avgRice}`}
            />
          ))}
          {metrics.epicProgress.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No epics defined</p>}
        </div>

        {/* Regional Breakdown */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Globe size={14} className="text-blue-600 dark:text-blue-400" /> Regional Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.regions).sort((a, b) => b[1] - a[1]).map(([region, count]) => {
              const pct = metrics.total > 0 ? (count / metrics.total * 100) : 0;
              return (
                <div key={region}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate">{region}</span>
                    <span className="font-bold text-slate-800">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(metrics.regions).length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data</p>}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-600 dark:text-amber-400" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {metrics.allHistory.length > 0 ? metrics.allHistory.map((h, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-700 truncate">{h.action}</div>
                  <div className="text-[10px] text-slate-400 truncate">{h.featureTitle} • {formatTime(h.timestamp)}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Clock size={20} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">Activity will appear here as you use the platform.</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Overview */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Users size={14} className="text-violet-600 dark:text-violet-400" /> Team Workload
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(users || []).map(user => {
              const userFeatures = features.filter(f => f.assignee === user.name || f.assignee === user.role);
              const userBlocked = userFeatures.filter(f => f.complianceStatus === 'Blocked').length;
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800/50">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-indigo-600">{userFeatures.length} assigned</span>
                      {userBlocked > 0 && <span className="text-[9px] font-bold text-red-600">{userBlocked} blocked</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
