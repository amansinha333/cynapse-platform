import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus, Loader2, X } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { fetchClients, createClient } from '../../utils/api';

function avatarUrlFor(c) {
  const u = (c.avatar_url || '').trim();
  if (u) return u;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=eef2ff&color=4338ca&size=128`;
}

export default function Clients() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [modal, setModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    company: '',
    role_title: '',
    contact_email: '',
    avatar_url: '',
    budget: '',
    project_count: 0,
  });

  const load = React.useCallback(async () => {
    try {
      setErr(null);
      const data = await fetchClients();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await createClient({
        name: form.name.trim(),
        company: form.company.trim(),
        role_title: form.role_title.trim(),
        contact_email: form.contact_email.trim(),
        avatar_url: form.avatar_url.trim(),
        budget: form.budget.trim(),
        project_count: Number(form.project_count) || 0,
      });
      setRows((prev) => [created, ...prev]);
      setModal(false);
      setForm({
        name: '',
        company: '',
        role_title: '',
        contact_email: '',
        avatar_url: '',
        budget: '',
        project_count: 0,
      });
    } catch (e) {
      setErr(e?.message || 'Could not create client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.06)} className="pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Manage Clients</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Stakeholders linked to your vendor registry.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200/50 transition hover:bg-indigo-700"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add new
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((c, i) => {
            const roleLine = c.role_title || c.company || '—';
            const projects = c.project_count ?? 0;
            const budget = (c.budget || '').trim() || '—';
            return (
              <motion.article
                key={c.id}
                variants={fadeUp}
                custom={i}
                className="flex flex-col bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-shadow hover:shadow-[0_8px_28px_rgb(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrlFor(c)}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-400/90 ring-offset-2 ring-offset-white"
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="mt-5 min-h-0 flex-1">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">{c.name}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{roleLine}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{projects}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{budget}</p>
                  </div>
                </div>

                <div className="mt-4 w-full rounded-xl bg-slate-50 py-2 text-center text-sm font-semibold text-slate-500">
                  {c.contact_email || c.email ? (
                    <a href={`mailto:${c.contact_email || c.email}`} className="text-indigo-700 hover:underline">
                      Message
                    </a>
                  ) : (
                    <span>Message</span>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_40px_rgb(0,0,0,0.08)]"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Add client</h2>
                <button
                  type="button"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                  onClick={() => setModal(false)}
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-500">
                  Name *
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  Company / vertical
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  Role title
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={form.role_title}
                    onChange={(e) => setForm((f) => ({ ...f, role_title: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  Email
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-bold text-slate-500">
                    Budget
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="$12k"
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-500">
                    Projects
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      value={form.project_count}
                      onChange={(e) => setForm((f) => ({ ...f, project_count: e.target.value }))}
                    />
                  </label>
                </div>
                <label className="block text-xs font-bold text-slate-500">
                  Avatar URL (optional)
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={form.avatar_url}
                    onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                    onClick={() => setModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
