import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, TrendingUp, Users, Bell, Loader2, ArrowRight } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { fetchCRMStats, fetchInbox } from '../../utils/api';

export default function Overview() {
  const [stats, setStats] = React.useState(null);
  const [preview, setPreview] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, inbox] = await Promise.all([fetchCRMStats(), fetchInbox()]);
        if (!cancelled) {
          setStats(s);
          setPreview(Array.isArray(inbox) ? inbox.slice(0, 5) : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load CRM overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-800">
        {err}
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.08)} className="space-y-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">CRM Overview</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Portfolio snapshot from live vendors, epics, and initiatives.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Active epics', value: stats?.active_projects ?? 0, sub: 'Projects', icon: LayoutGrid, tone: 'bg-indigo-50 text-indigo-700' },
              { label: 'Completion', value: `${Math.round(stats?.completion_rate ?? 0)}%`, sub: 'Initiatives in Delivery', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-700' },
              { label: 'Clients', value: stats?.total_clients ?? 0, sub: 'Vendors', icon: Users, tone: 'bg-sky-50 text-sky-700' },
              { label: 'Initiatives', value: stats?.total_initiatives ?? 0, sub: 'Features tracked', icon: Bell, tone: 'bg-violet-50 text-violet-700' },
            ].map((c) => (
              <motion.div
                key={c.label}
                variants={fadeUp}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${c.tone}`}>
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</div>
                <div className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-slate-900">{c.value}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{c.sub}</div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Inbox preview</h2>
              <Link to="/dashboard/inbox" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900">
                Open inbox <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="space-y-3">
              {preview.length === 0 && <li className="text-sm font-semibold text-slate-500">No notifications yet.</li>}
              {preview.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-slate-400">{n.type}</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">{n.content}</div>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
