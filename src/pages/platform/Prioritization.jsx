import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingUp, Target, Wrench } from "lucide-react";
import Logo, { LOGO_CLASS } from "../../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../../theme/marketing";

const RICE_CELLS = [
  {
    title: "Reach",
    body: "Tie feature requests directly to active user metrics. How many users will this impact this quarter?",
    icon: Users,
  },
  {
    title: "Impact",
    body: "Will this drive massive step-change growth or minor incremental value? Standardize scoring across all departments.",
    icon: TrendingUp,
  },
  {
    title: "Confidence",
    body: "The antidote to over-optimism. Factor in actual data certainty to penalize features based on pure gut feeling.",
    icon: Target,
  },
  {
    title: "Effort",
    body: "Calculate exact engineering months required. The engine automatically sorts your backlog into a mathematically sound roadmap.",
    icon: Wrench,
  },
];

export default function Prioritization() {
  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-[#042f1f] transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-[90px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Platform · RICE Prioritization</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#042f1f] md:text-5xl lg:text-[3.1rem] lg:leading-tight">
              Stop Debating. Start Shipping.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Replace subjective arguments with objective math. Standardize product discovery using our integrated RICE scoring model to
              allocate engineering resources to maximum-impact initiatives.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="mb-10 text-center text-sm font-bold uppercase tracking-[0.2em] text-emerald-700/80">The math</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {RICE_CELLS.map(({ title, body, icon: Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-[#22c55e]">
                <Icon className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-bold text-[#042f1f]">{title}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center">
        <Link to="/platform/governance" className="text-sm font-semibold text-slate-600 hover:text-[#22c55e]">
          ← Hard-Gate Governance
        </Link>
        <span className="mx-3 text-slate-400">·</span>
        <Link to="/solutions/enterprise" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-700">
          Enterprise solutions →
        </Link>
      </footer>
    </div>
  );
}
