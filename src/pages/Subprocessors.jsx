import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server } from 'lucide-react';
import Logo, { LOGO_CLASS } from '../components/ui/Logo';
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from '../theme/marketing';
import { API_BASE } from '../utils/api';

export default function Subprocessors() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/public/compliance/subprocessors`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hidden text-sm font-semibold text-slate-600 hover:text-[#22c55e] sm:inline">
              Privacy
            </Link>
            <Link
              to="/"
              className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-[#16a34a]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-emerald-50/50">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Transparency</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#042f1f] md:text-4xl">Subprocessors</h1>
            <p className="mt-4 text-slate-600">
              Third parties that process data on behalf of Cynapse. This register is versioned; customers receive notice of material changes
              per the DPA.
            </p>
            {data && (
              <p className="mt-3 text-sm text-emerald-800">
                List version <strong className="text-[#042f1f]">{data.list_version}</strong>
                {' · '}
                effective <strong className="text-[#042f1f]">{data.effective_date}</strong>
              </p>
            )}
            {err && <p className="mt-4 text-sm text-amber-700">Could not load live register ({err}).</p>}
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-14 text-slate-600">
        <div className="flex items-center gap-3 text-[#042f1f]">
          <Server className="h-8 w-8 text-[#22c55e]" />
          <h2 className="text-xl font-bold">Current register</h2>
        </div>
        <div className="space-y-4">
          {(data?.items || []).map((row, i) => (
            <div
              key={i}
              className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <p className="font-bold text-[#042f1f]">{row.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="text-slate-700">Purpose:</span> {row.purpose}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="text-slate-700">Region:</span> {row.region}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="text-slate-700">Typical data categories:</span> {row.data_categories}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          For contractual terms, see the{' '}
          <Link to="/dpa" className="font-semibold text-[#22c55e] hover:text-emerald-700">
            Data Processing Addendum
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
