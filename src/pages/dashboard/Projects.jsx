import React from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Loader2 } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { fetchProjects } from '../../utils/api';

export default function Projects() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const data = await fetchProjects();
        if (!c) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!c) setErr(e?.message || 'Failed to load projects');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.06)} className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Projects</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Epics with initiative counts and aggregate RICE.</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((p, i) => (
            <motion.div
              key={p.id}
              variants={fadeUp}
              custom={i}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-inner"
                  style={{ background: p.color || '#6366f1' }}
                >
                  <FolderKanban className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{p.name}</div>
                  <div className="text-xs font-bold text-slate-500">
                    {p.feature_count} initiatives · Σ RICE {Math.round(p.total_rice || 0)}
                  </div>
                </div>
              </div>
              <div className="w-full md:max-w-xs">
                <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Progress</span>
                  <span>{p.progress_pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.min(100, p.progress_pct || 0)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
