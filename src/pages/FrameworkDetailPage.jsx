import React from 'react';
import { useParams, Link } from 'react-router-dom';

const TITLES = {
  'soc-2': 'SOC 2',
  'iso-27001': 'ISO 27001',
  'hipaa': 'HIPAA',
  'gdpr': 'GDPR',
  'fedramp': 'FedRAMP',
  'cmmc': 'CMMC',
  'iso-42001': 'ISO 42001',
  'pci-dss': 'PCI DSS',
  'nist-ai-rmf': 'NIST AI RMF',
  'dora': 'DORA',
};

export default function FrameworkDetailPage() {
  const { frameworkId } = useParams();
  const title = TITLES[frameworkId] || frameworkId;
  const progress = frameworkId === 'soc-2' ? 84 : 72;

  return (
    <div className="max-w-3xl">
      <Link to="/frameworks" className="text-sm text-indigo-600 dark:text-indigo-400">← Back to frameworks</Link>
      <div className="glass-card rounded-2xl p-6 mt-3">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{title} Readiness: {progress}%</p>
        <div className="mt-4 w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <div className="border rounded-xl p-3 border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Controls Completed</p>
            <p className="text-xl font-bold mt-1">126</p>
          </div>
          <div className="border rounded-xl p-3 border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open Gaps</p>
            <p className="text-xl font-bold mt-1">14</p>
          </div>
        </div>
      </div>
    </div>
  );
}
