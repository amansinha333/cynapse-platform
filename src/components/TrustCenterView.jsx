import React, { useState } from 'react';
import { ShieldCheck, FileCheck, Lock, CheckCircle, ExternalLink, Download, ArrowRight, Activity, Globe } from 'lucide-react';
import Logo from './ui/Logo';

const CERTIFICATIONS = [
  { id: 'soc2', name: 'SOC 2 Type II', desc: 'Secure data management and privacy.', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'iso', name: 'ISO 27001', desc: 'International information security standard.', icon: Globe, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'gdpr', name: 'GDPR Compliant', desc: 'European data protection and privacy compliance.', icon: Lock, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
];

const PASSING_CONTROLS = [
  'IAM: MFA Enforced on all Infrastructure',
  'Data Security: Encryption at Rest (AES-256)',
  'Data Security: Encryption in Transit (TLS 1.3)',
  'HR Security: Employee Background Checks',
  'Operations: Incident Response Plan Tested',
  'Regulatory: RBI Data Localization Enforced',
];

export default function TrustCenterView() {
  const [showRequestForm, setShowRequestForm] = useState(false);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header section */}
      <div className="text-center mb-12 pt-8">
        <div className="relative mb-6 inline-flex items-center justify-center rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20"></div>
          <Logo className="relative z-10 h-auto w-auto text-emerald-500" />
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Enterprise Security Posture
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 rounded-full shadow-sm">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">System Status: Secure & Compliant</span>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <FileCheck size={20} className="text-indigo-600 dark:text-indigo-400" /> Statutory Certifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CERTIFICATIONS.map(cert => (
            <div key={cert.id} className={`group p-6 bg-white dark:bg-slate-800 border ${cert.border} rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${cert.bg} rounded-full blur-2xl group-hover:blur-xl transition-all opacity-50`}></div>
              <div>
                <cert.icon size={24} className={`${cert.color} mb-3`} />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{cert.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">{cert.desc}</p>
              </div>
              <div className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <span>View Certificate</span>
                <ExternalLink size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls & Audit Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Controls List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Verified Security Controls</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time continuous control monitoring data.</p>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-widest">{PASSING_CONTROLS.length} Passing</span>
            </div>
            <div className="p-2 gap-1 flex flex-col">
              {PASSING_CONTROLS.map((control, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0" size={18} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{control}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                    <Lock size={10} /> Verified
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Download Reports Action */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden h-full flex flex-col justify-center">
            {/* Background design elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600 rounded-full blur-[60px] opacity-40"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-600 rounded-full blur-[60px] opacity-20"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <FileCheck className="text-indigo-300" size={28} />
              </div>
              <h2 className="text-xl font-bold mb-3">Enterprise Audit Reports</h2>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Access our complete SOC 2 Type II report, latest penetration testing results, and detailed sub-processor lists.
              </p>

              {!showRequestForm ? (
                <button 
                  onClick={() => setShowRequestForm(true)}
                  className="w-full relative group overflow-hidden rounded-lg bg-indigo-600 py-3 px-4 font-bold text-sm shadow-md transition-all hover:bg-indigo-500"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Request Security Whitepapers <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  <button onClick={() => setShowRequestForm(false)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2">
                    Submit Request
                  </button>
                  <button onClick={() => setShowRequestForm(false)} className="w-full mt-2 py-2 text-[10px] text-slate-400 hover:text-slate-200 font-bold uppercase tracking-wider">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
