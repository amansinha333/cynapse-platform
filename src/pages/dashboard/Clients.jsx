import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { fetchClients } from '../../utils/api';

export default function Clients() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      try {
        const data = await fetchClients();
        if (!c) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!c) setErr(e?.message || 'Failed to load clients');
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
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Clients</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Vendor registry (mapped from your compliance vendor model).</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((v, i) => (
            <motion.div
              key={v.id}
              variants={fadeUp}
              custom={i}
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{v.name}</div>
                    <div className="text-xs font-semibold text-slate-500">{v.company || v.type || '—'}</div>
                  </div>
                </div>
                {v.verified ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                  {v.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                  Risk: {v.risk}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
