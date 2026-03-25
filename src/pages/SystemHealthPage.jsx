import React from 'react';
import { Activity, Database, Cpu, ShieldCheck } from 'lucide-react';
import { fetchSystemHealth } from '../utils/api';

function StatusPill({ status }) {
  const palette = status === 'up'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${palette}`}>
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}

function HealthCard({ title, subtitle, icon: Icon, status, detail }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-bold">{title}</p>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{subtitle}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon size={18} className="text-slate-600 dark:text-slate-300" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusPill status={status} />
        <span className="text-xs text-slate-500 dark:text-slate-400">{detail}</span>
      </div>
    </div>
  );
}

export default function SystemHealthPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetchSystemHealth();
      setData(result);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">System Health</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live readiness checks for enterprise runtime dependencies.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors">
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-slate-500 dark:text-slate-400">Checking services...</div>}
      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <HealthCard
            title="Database"
            subtitle={String(data.database?.engine || 'unknown').toUpperCase()}
            icon={Database}
            status={data.database?.status}
            detail="Primary transactional store"
          />
          <HealthCard
            title="Vector Store"
            subtitle="Pinecone"
            icon={ShieldCheck}
            status={data.vector_store?.status}
            detail="Retrieval index availability"
          />
          <HealthCard
            title="AI Engine"
            subtitle="Gemini"
            icon={Cpu}
            status={data.ai_engine?.status}
            detail="Inference key readiness"
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-2">
          <Activity size={16} /> Operational Notes
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Status is evaluated from runtime connectivity and key readiness checks. Use this panel to validate deployment integrity before running governance audits.
        </p>
      </div>
    </div>
  );
}
