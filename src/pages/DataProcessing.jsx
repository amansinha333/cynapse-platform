import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, Lock, Gavel, Server } from "lucide-react";
import Logo, { LOGO_CLASS } from "../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../theme/marketing";

export default function DataProcessing() {
  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hidden text-sm font-semibold text-slate-600 hover:text-[#22c55e] sm:inline">
              Privacy Policy
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
            <h1 className="text-3xl font-bold tracking-tight text-[#042f1f] md:text-4xl">Data processing &amp; handling</h1>
            <p className="mt-4 text-slate-600">
              How Cynapse isolates tenant data, uses Supabase (PostgreSQL) as a system of record, and applies compliance gates to protect
              integrity across the product lifecycle.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-12 px-6 py-14 text-slate-600">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-[#22c55e]" />
            <h2 className="text-xl font-bold text-[#042f1f]">Tenant isolation</h2>
          </div>
          <p className="leading-relaxed">
            Each customer workspace is scoped in the application layer: user accounts, product initiatives, and compliance artifacts are tied
            to a dedicated workspace identifier. This logical separation is designed so operational and analytics flows do not mix tenant
            data—supporting enterprise expectations for segregation and access control reviews.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-[#22c55e]" />
            <h2 className="text-xl font-bold text-[#042f1f]">Supabase &amp; PostgreSQL</h2>
          </div>
          <p className="leading-relaxed">
            Structured application data—such as workspaces, user profiles linked to workspaces, and roadmap entities—is stored in{" "}
            <strong className="text-slate-800">PostgreSQL</strong> via <strong className="text-slate-800">Supabase</strong>, using
            industry-standard connectivity and encryption in transit. Administrative operations that require elevated privileges (for
            example, provisioning or billing-related updates) use server-side credentials only; they are never exposed to the browser.
          </p>
          <p className="leading-relaxed">
            This architecture keeps a durable, queryable record for your governance workflows while allowing you to align retention and
            subprocessors with your enterprise agreements and Data Processing Addendum (DPA).
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-[#22c55e]" />
            <h2 className="text-xl font-bold text-[#042f1f]">Compliance gates &amp; data integrity</h2>
          </div>
          <p className="leading-relaxed">
            Compliance gates are applied at controlled points in the delivery lifecycle—so early discovery stays nimble, while release paths
            enforce policy before deployment. When an initiative is blocked or requires remediation, that state is reflected in the same
            system of record, reducing “shadow” status in email or offline trackers that auditors cannot reconstruct.
          </p>
          <p className="leading-relaxed">
            Together, <strong className="text-slate-800">isolation</strong>,{" "}
            <strong className="text-slate-800">structured storage</strong>, and{" "}
            <strong className="text-slate-800">gated workflows</strong> support data integrity: what your teams see in the product is
            what your risk function can evidence in a review.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-[#22c55e]" />
            <h2 className="text-xl font-bold text-[#042f1f]">Encryption &amp; transport</h2>
          </div>
          <p className="leading-relaxed">
            Traffic between users and the platform should use modern TLS. Sensitive payloads are protected in transit across service
            boundaries; encryption at rest depends on your cloud provider and Supabase configuration. For contractual detail, see our{" "}
            <Link to="/privacy" className="font-semibold text-[#22c55e] hover:text-emerald-700">
              Privacy Policy
            </Link>{" "}
            and security disclosures.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-10">
          <h2 className="text-lg font-bold text-[#042f1f]">Registers &amp; contracts</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Versioned <Link to="/subprocessors" className="font-semibold text-[#22c55e] hover:text-emerald-700">subprocessor list</Link>
            {' '}and the{' '}
            <Link to="/dpa" className="font-semibold text-[#22c55e] hover:text-emerald-700">Data Processing Addendum</Link> support procurement
            and DPA workflows.
          </p>
        </section>

        <p className="border-t border-slate-200 pt-10 text-sm text-slate-500">
          This page summarizes how Cynapse approaches data handling for marketing and diligence conversations. It does not replace signed
          legal agreements or your own regulatory obligations.
        </p>
      </main>
    </div>
  );
}
