import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck, Lock, CheckCircle, ExternalLink, ArrowRight, Globe } from 'lucide-react';
import Logo, { LOGO_CLASS } from './ui/Logo';
import { API_BASE } from '../utils/api';
import { SECURITY_EMAIL, STATUS_PAGE_URL } from '../config/enterprise';

const CERTIFICATIONS = [
  { id: 'soc2', name: 'SOC 2 Type II', desc: 'Independent assurance over security, availability, and confidentiality controls.', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'iso', name: 'ISO 27001', desc: 'Information security management aligned to international practice.', icon: Globe, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'gdpr', name: 'GDPR-ready posture', desc: 'Processor obligations, DPA, subprocessors register, and data subject workflows.', icon: Lock, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
];

const TARGET_CONTROLS = [
  'Access: Role-based access and authenticated APIs',
  'Encryption: TLS for transport; at-rest per cloud provider',
  'Operations: Incident response runbooks and logging',
  'Vendor: Subprocessor register with versioned updates',
  'Availability: Health endpoints and optional public status page',
];

export default function TrustCenterView() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [assurance, setAssurance] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/public/compliance/assurance`);
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setAssurance(j);
      } catch {
        /* non-fatal */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const soc = assurance?.soc2?.status || 'readiness';
  const secMail = assurance?.security_contact || SECURITY_EMAIL;
  const statusUrl = (assurance?.status_page_url || STATUS_PAGE_URL || '').trim();

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="text-center mb-12 pt-8">
        <div className="relative mb-6 inline-flex items-center justify-center rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20"></div>
          <Logo className={LOGO_CLASS.trust} />
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Enterprise Security Posture
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
              SOC 2: {soc}
            </span>
          </div>
          {statusUrl ? (
            <a
              href={statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Uptime & incidents <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-600 dark:text-slate-400">
          Formal SOC 2 Type II / ISO reports and pen-test summaries are shared under NDA. Request via{' '}
          <a href={`mailto:${secMail}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            {secMail}
          </a>
          .
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <FileCheck size={20} className="text-indigo-600 dark:text-indigo-400" /> Assurance roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CERTIFICATIONS.map(cert => (
            <div key={cert.id} className={`group p-6 bg-white dark:bg-slate-800 border ${cert.border} rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[10rem] relative overflow-hidden`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${cert.bg} rounded-full blur-2xl group-hover:blur-xl transition-all opacity-50`}></div>
              <div>
                <cert.icon size={24} className={`${cert.color} mb-3`} />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{cert.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">{cert.desc}</p>
              </div>
              <a
                href={`mailto:${secMail}?subject=${encodeURIComponent(`Report request: ${cert.name}`)}`}
                className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
              >
                <span>Request evidence</span>
                <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Subprocessor register:{' '}
          <Link to="/subprocessors" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            /subprocessors
          </Link>
          {' · '}
          <Link to="/dpa" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Data Processing Addendum
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Security control themes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mapped to SOC 2 / ISO expectations — detailed evidence under NDA.</p>
              </div>
              <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-600 uppercase tracking-widest">{TARGET_CONTROLS.length} themes</span>
            </div>
            <div className="p-2 gap-1 flex flex-col">
              {TARGET_CONTROLS.map((control, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0" size={18} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{control}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600 rounded-full blur-[60px] opacity-40"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-600 rounded-full blur-[60px] opacity-20"></div>

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <FileCheck className="text-indigo-300" size={28} />
              </div>
              <h2 className="text-xl font-bold mb-3">Enterprise audit pack</h2>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                SOC 2 / ISO reports, pen-test executive summary, and architecture FAQs are released under NDA after vendor review.
              </p>

              {!showRequestForm ? (
                <button
                  type="button"
                  onClick={() => setShowRequestForm(true)}
                  className="w-full relative group overflow-hidden rounded-lg bg-indigo-600 py-3 px-4 font-bold text-sm shadow-md transition-all hover:bg-indigo-500"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Request security pack <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left backdrop-blur-md">
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Business Email</label>
                    <input type="email" placeholder="you@company.com" className="w-full bg-slate-950 border border-slate-800 rounded text-sm px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Intended Use</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded text-sm px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors appearance-none">
                      <option>Vendor Due Diligence</option>
                      <option>Security Review</option>
                      <option>Partnership Integration</option>
                    </select>
                  </div>
                  <a
                    href={`mailto:${secMail}?subject=${encodeURIComponent('Security / trust pack request')}`}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2"
                  >
                    Email {secMail}
                  </a>
                  <button type="button" onClick={() => setShowRequestForm(false)} className="w-full mt-2 py-2 text-[10px] text-slate-400 hover:text-slate-200 font-bold uppercase tracking-wider">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
