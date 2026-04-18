import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import Logo, { LOGO_CLASS } from '../components/ui/Logo';
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from '../theme/marketing';
import { LEGAL_EMAIL } from '../config/enterprise';

export default function DataProcessingAddendum() {
  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/subprocessors" className="hidden text-sm font-semibold text-slate-600 hover:text-[#22c55e] sm:inline">
              Subprocessors
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
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Legal</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#042f1f] md:text-4xl">Data Processing Addendum (DPA)</h1>
            <p className="mt-4 text-slate-600">
              Summary terms for GDPR Article 28 and similar frameworks. A countersigned PDF is provided during enterprise onboarding.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-14 text-slate-600">
        <div className="flex items-center gap-3 text-[#042f1f]">
          <FileText className="h-8 w-8 text-[#22c55e]" />
          <h2 className="text-xl font-bold">Roles</h2>
        </div>
        <p className="leading-relaxed">
          For the services described in your order form, <strong className="text-slate-800">Cynapse</strong> acts as a{' '}
          <strong className="text-slate-800">processor</strong> and you act as <strong className="text-slate-800">controller</strong>{' '}
          (or processor-to-processor, as stated in your agreement) for the customer data you submit to the platform.
        </p>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#042f1f]">Processing instructions</h3>
          <p className="leading-relaxed">
            Processing is limited to providing the product: workspace isolation, roadmap and compliance workflows, optional AI-assisted
            analysis when enabled, and operational support. Subprocessors are listed on the{' '}
            <Link to="/subprocessors" className="font-semibold text-[#22c55e] hover:text-emerald-700">
              Subprocessors
            </Link>{' '}
            page and may be updated with notice.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#042f1f]">Security measures</h3>
          <p className="leading-relaxed">
            Technical and organizational measures align with industry practice: access control, encryption in transit, logging, and vendor
            reviews. Details are available in security documentation shared under NDA.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#042f1f]">Data subject requests & deletion</h3>
          <p className="leading-relaxed">
            End users can request export or account deletion from profile settings where the feature is enabled. Enterprise administrators
            should route bulk requests through your designated contact.
          </p>
        </section>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-900">Executable DPA</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Request a countersigned DPA for your entity:{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="font-bold text-[#22c55e] hover:underline">
              {LEGAL_EMAIL}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
