import React, { useState } from 'react';
import { Building2, Clock4, FolderKanban, Mail, MapPin, ShieldCheck, Download, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { fetchMyDataExport, deleteMyAccount, setAuthToken, setRefreshToken, AUTH_LOGOUT_EVENT } from '../utils/api';

export default function ProfilePage() {
  const { currentUser } = useProject();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [delPwd, setDelPwd] = useState('');

  const handleExport = async () => {
    setBusy(true);
    setMsg('');
    try {
      const data = await fetchMyDataExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cynapse-export-${currentUser?.id || 'user'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Export downloaded.');
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    setBusy(true);
    setMsg('');
    try {
      await deleteMyAccount(delPwd);
      setAuthToken(null);
      setRefreshToken(null);
      try {
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      } catch {
        /* no-op */
      }
      window.location.href = '/';
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="relative h-48 w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
          <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 15% 20%, #ffffff 0%, transparent 42%)' }} />
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-600 text-white text-2xl font-black flex items-center justify-center shadow-xl">
              {(currentUser?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="pt-16 px-8 pb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{currentUser?.name || 'User'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentUser?.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 h-fit">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">About</h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><Building2 size={14} className="text-slate-500" /> Role: {currentUser?.role || '—'}</p>
            <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> Workspace account</p>
            <p className="flex items-center gap-2"><Mail size={14} className="text-slate-500" /> {currentUser?.email}</p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Work</h3>
            <div className="space-y-3">
              {['My discovery space', 'SOC 2 Readiness Program', 'Q2 Vendor Risk Review'].map((item) => (
                <div key={item} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-slate-800/60">
                  <p className="text-sm font-medium flex items-center gap-2"><FolderKanban size={14} className="text-indigo-500" /> {item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Security Posture</h3>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <ShieldCheck size={13} /> Session active
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Clock4 size={14} className="text-slate-500" /> Use export / delete below for GDPR-style requests.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Data portability &amp; erasure</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Download a JSON export of workspace-visible data. Account deletion anonymizes your profile and removes API keys stored for your user.
              SSO-only accounts can delete without a password; password users must confirm.
            </p>
            {msg && <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">{msg}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Download size={16} /> Export my data
              </button>
            </div>
            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password (if you use password login)</label>
              <input
                type="password"
                value={delPwd}
                onChange={(e) => setDelPwd(e.target.value)}
                className="mb-3 w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="Required for password accounts"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950 disabled:opacity-50"
              >
                <Trash2 size={16} /> Delete account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
