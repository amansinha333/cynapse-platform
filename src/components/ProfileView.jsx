import React from 'react';
import { Building2, MapPin, Mail, ShieldCheck, Clock4, FolderKanban } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function ProfileView() {
  const { currentUser } = useProject();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div
          className="h-44 relative"
          style={{
            background:
              'linear-gradient(135deg, #1e3a8a 0%, #4338ca 35%, #7c3aed 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 10%, #ffffff 0%, transparent 45%)' }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-600 text-white text-2xl font-black flex items-center justify-center shadow-xl">
              AS
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentUser?.name || 'Aman Sinha'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Senior Product Manager</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 h-fit">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">About</h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><Building2 size={14} className="text-slate-500" /> Department: Product & Engineering</p>
            <p className="flex items-center gap-2"><Building2 size={14} className="text-slate-500" /> Organization: Cynapse HQ</p>
            <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> Location: India (IST)</p>
            <p className="flex items-center gap-2"><Mail size={14} className="text-slate-500" /> Contact: aman@cynapse.com</p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Work</h3>
            <div className="space-y-3">
              {[
                'My discovery space',
                'SOC 2 Readiness Program',
                'Q2 Vendor Risk Review'
              ].map((item) => (
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
                <ShieldCheck size={13} /> MFA Enabled
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Clock4 size={14} className="text-slate-500" /> Last login: Today from Mac OS
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
