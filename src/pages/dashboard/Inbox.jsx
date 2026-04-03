import React from 'react';
import { motion } from 'framer-motion';
import { Inbox as InboxIcon, Loader2, Check } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { fetchInbox, markNotificationRead } from '../../utils/api';

export default function Inbox() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchInbox();
      setItems(Array.isArray(data) ? data : []);
      setErr(null);
    } catch (e) {
      setErr(e?.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.05)} className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Inbox</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Compliance and system signals from your audit trail.</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center text-sm font-semibold text-slate-500">
              You&apos;re all caught up.
            </div>
          )}
          {items.map((n, i) => (
            <motion.div
              key={n.id}
              variants={fadeUp}
              custom={i}
              className={`flex items-start gap-4 rounded-2xl border p-4 ${
                n.is_read ? 'border-slate-100 bg-white' : 'border-indigo-100 bg-indigo-50/40'
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <InboxIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{n.type}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-800">{n.content}</p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-indigo-700 hover:bg-indigo-50"
                >
                  <Check className="h-3.5 w-3.5" /> Read
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
