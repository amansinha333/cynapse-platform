import React, { useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, ShieldCheck, AlertTriangle,
  ArrowRight, Users, Globe, Clock, Zap, BarChart3, Target
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  staggerContainer, fadeUp, springs, easings, useAnimatedCounter, viewportFade,
} from '../utils/motion';

// ── Animated SVG Donut Chart ──────────────────────────────────────
function DonutChart({ segments, size = 120, strokeWidth = 14 }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = total > 0 ? seg.value / total : 0;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const startOffset = segments.slice(0, i).reduce((a, s) => a + s.value, 0);
        const rotation = total > 0 ? (startOffset / total) * 360 : 0;
        return (
          <motion.circle
            key={i}
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDashoffset={circumference / 4}
            transform={`rotate(${rotation} ${size/2} ${size/2})`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={isInView ? { strokeDasharray: `${dash} ${gap}` } : { strokeDasharray: `0 ${circumference}` }}
            transition={{ duration: 0.9, delay: i * 0.15, ease: easings.outExpo }}
          />
        );
      })}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-lg font-bold">{total}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" className="fill-slate-400 text-[9px] font-semibold uppercase">Total</text>
    </svg>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────
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
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={3} fill={color} />;
      })()}
    </svg>
  );
}

// ── Animated Progress Bar ─────────────────────────────────────────
function ProgressBar({ label, value, max, color, subtext, delay = 0 }) {
  const pct = max > 0 ? (value / max * 100) : 0;
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }}></span>
          {label}
        </span>
        <span className="text-[10px] font-bold text-slate-500">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.8, delay, ease: easings.outExpo }}
        />
      </div>
      {subtext && <span className="text-[9px] text-slate-400 mt-0.5 block">{subtext}</span>}
    </div>
  );
}

// ── Animated KPI Card ─────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, trend, sparkData, sparkColor, index }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  const { count, ref } = useAnimatedCounter(isNaN(numericValue) ? 0 : numericValue);
  const displayValue = isPercentage ? `${count}%` : count;

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      whileHover={{ y: -3, transition: springs.gentle }}
      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <motion.div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
          whileHover={{ scale: 1.1, rotate: 3 }}
          transition={springs.snappy}
        >
          <Icon size={18} />
        </motion.div>
        <Sparkline data={sparkData} color={sparkColor} width={60} height={24} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{displayValue}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mt-0.5">{label}</div>
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{trend}</div>
    </motion.div>
  );
}

// ── Animated Funnel Bar ───────────────────────────────────────────
function FunnelBar({ stage, count, maxCount, colorClass, index }) {
  const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div ref={ref} className="flex-1 text-center">
      <div className="relative h-32 flex items-end justify-center">
        <motion.div
          className={`w-full max-w-[60px] mx-auto ${colorClass} rounded-t-lg relative`}
          initial={{ height: '8%' }}
          animate={isInView ? { height: `${Math.max(heightPct, 8)}%` } : { height: '8%' }}
          transition={{ duration: 0.7, delay: index * 0.12, ease: easings.outExpo }}
        >
          <motion.span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg font-bold text-slate-800 dark:text-slate-100"
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.12, ease: easings.outExpo }}
          >
            {count}
          </motion.span>
        </motion.div>
      </div>
      <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase">{stage}</div>
      {index < 3 && <ArrowRight size={10} className="text-slate-300 mx-auto mt-1" />}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardView() {
  const { features, epics, users, currentUser } = useProject();

  const metrics = useMemo(() => {
    const total = features.length;
    const approved = features.filter(f => f.complianceStatus?.includes('Approved')).length;
    const blocked = features.filter(f => f.complianceStatus === 'Blocked').length;
    const pending = features.filter(f => f.complianceStatus === 'Pending').length;
    const avgRice = total > 0 ? (features.reduce((a, f) => a + parseFloat(f.riceScore || 0), 0) / total) : 0;

    const pipeline = {};
    ['Discovery', 'Validation', 'Ready', 'Delivery'].forEach(s => { pipeline[s] = features.filter(f => f.status === s).length; });

    const regions = {};
    features.forEach(f => { regions[f.region] = (regions[f.region] || 0) + 1; });

    const epicProgress = (epics || []).map(epic => {
      const epicFeatures = features.filter(f => f.epicId === epic.id);
      const done = epicFeatures.filter(f => f.status === 'Delivery').length;
      return { ...epic, total: epicFeatures.length, done, avgRice: epicFeatures.length > 0 ? (epicFeatures.reduce((a, f) => a + parseFloat(f.riceScore || 0), 0) / epicFeatures.length).toFixed(0) : 0 };
    });

    const velocity = [2, 3, 1, 4, 3, 5, total > 2 ? 3 : 1, total];
    const complianceRate = total > 0 ? ((approved / total) * 100).toFixed(0) : 0;

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

  const kpis = [
    { label: 'Total Initiatives', value: metrics.total, icon: Target, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', trend: '+2 this month', sparkColor: '#6366f1' },
    { label: 'Avg RICE Score', value: metrics.avgRice.toFixed(0), icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', trend: 'Portfolio health', sparkColor: '#6366f1' },
    { label: 'Compliance Rate', value: `${metrics.complianceRate}%`, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', trend: `${metrics.approved} approved`, sparkColor: '#10b981' },
    { label: 'Blocked', value: metrics.blocked, icon: AlertTriangle, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', trend: 'Active blockers', sparkColor: '#ef4444' },
    { label: 'In Delivery', value: metrics.pipeline['Delivery'] || 0, icon: Zap, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', trend: 'Shipping now', sparkColor: '#6366f1' },
  ];

  const funnelColors = ['bg-slate-300', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'];
  const funnelStages = ['Discovery', 'Validation', 'Ready', 'Delivery'];
  const maxPipelineCount = Math.max(...Object.values(metrics.pipeline), 1);

  return (
    <>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easings.outExpo }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <motion.div
                className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"
                whileHover={{ scale: 1.08, rotate: -5 }}
                transition={springs.snappy}
              >
                <LayoutDashboard size={24} className="text-indigo-600 dark:text-indigo-400" />
              </motion.div>
              Executive Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Portfolio health overview for {currentUser?.name || 'Leadership'}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Last Updated</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </motion.div>

      {/* KPI Strip — staggered entrance */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >
        {kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            index={i}
            sparkData={metrics.velocity}
            sparkColor={kpi.sparkColor}
            {...kpi}
          />
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Pipeline Funnel — animated bars */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
          {...viewportFade}
        >
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-indigo-600 dark:text-indigo-400" /> Pipeline Funnel
          </h3>
          <div className="flex items-end gap-3 justify-around">
            {funnelStages.map((stage, i) => (
              <FunnelBar
                key={stage}
                stage={stage}
                count={metrics.pipeline[stage] || 0}
                maxCount={maxPipelineCount}
                colorClass={funnelColors[i]}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* Compliance Posture — animated donut */}
        <motion.div
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
          {...viewportFade}
        >
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
        </motion.div>
      </div>

      {/* Bottom Row — staggered entrance */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={staggerContainer(0.1, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >

        {/* Epic Progress */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Target size={14} className="text-indigo-600 dark:text-indigo-400" /> Epic Progress
          </h3>
          {metrics.epicProgress.map((epic, i) => (
            <ProgressBar
              key={epic.id}
              label={epic.name}
              value={epic.done}
              max={epic.total}
              color={epic.color}
              subtext={`Avg RICE: ${epic.avgRice}`}
              delay={i * 0.1}
            />
          ))}
          {metrics.epicProgress.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No epics defined</p>}
        </motion.div>

        {/* Regional Breakdown */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Globe size={14} className="text-blue-600 dark:text-blue-400" /> Regional Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.regions).sort((a, b) => b[1] - a[1]).map(([region, count], i) => {
              const pct = metrics.total > 0 ? (count / metrics.total * 100) : 0;
              return (
                <RegionRow key={region} region={region} count={count} pct={pct} total={metrics.total} delay={i * 0.08} />
              );
            })}
          </div>
          {Object.keys(metrics.regions).length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data</p>}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-600 dark:text-amber-400" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {metrics.allHistory.length > 0 ? metrics.allHistory.map((h, i) => (
              <motion.div
                key={i}
                className="flex gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: easings.outExpo }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{h.action}</div>
                  <div className="text-[10px] text-slate-400 truncate">{h.featureTitle} • {formatTime(h.timestamp)}</div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-6">
                <Clock size={20} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">Activity will appear here as you use the platform.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Team Overview */}
        <motion.div
          variants={fadeUp}
          className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Users size={14} className="text-violet-600 dark:text-violet-400" /> Team Workload
          </h3>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {(users || []).map(user => {
              const userFeatures = features.filter(f => f.assignee === user.name || f.assignee === user.role);
              const userBlocked = userFeatures.filter(f => f.complianceStatus === 'Blocked').length;
              return (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  whileHover={{ y: -2, transition: springs.gentle }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                >
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
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ── Region Row (animated bar) ─────────────────────────────────────
function RegionRow({ region, count, pct, total, delay }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400 truncate">{region}</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.7, delay, ease: easings.outExpo }}
        />
      </div>
    </div>
  );
}
