import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Logo, { LOGO_CLASS } from "../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../theme/marketing";

export default function About() {
  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <Link
            to="/"
            className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-[#16a34a]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <Sparkles className="h-6 w-6 text-[#22c55e]" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#042f1f] md:text-5xl">Our mission</h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-600 md:text-2xl">
              Bridge <span className="text-[#22c55e] font-semibold">rapid product discovery</span> with{" "}
              <span className="text-[#22c55e] font-semibold">strict enterprise compliance</span>—so teams can explore boldly and ship with
              confidence.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-16 md:py-20 text-slate-600">
        <p className="text-lg leading-relaxed">
          Most organizations force an impossible choice: move slowly to stay compliant, or move fast and hope audits never look closely.
          Cynapse rejects that trade-off. We believe structured prioritization and governed release checks belong in the same workflow as
          your roadmap—not in a separate spreadsheet or a quarterly review.
        </p>
        <p className="text-lg leading-relaxed">
          Our platform helps product and engineering leaders map initiatives with clarity, surface regulatory risk early, and enforce
          non-negotiable gates before work reaches customers. The outcome is faster <em>legitimate</em> delivery: fewer surprises, fewer
          rollbacks, and a story your risk and compliance partners can stand behind.
        </p>
        <p className="text-lg leading-relaxed text-slate-500">
          Cynapse is built for regulated and high-stakes environments—where “we’ll fix compliance later” is not an option.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 transition-colors hover:bg-[#16a34a]"
          >
            Explore features <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/data-processing"
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-[#042f1f] transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            Data processing
          </Link>
        </div>
      </div>
    </div>
  );
}
