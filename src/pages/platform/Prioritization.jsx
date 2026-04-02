import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, TrendingUp, Target, Wrench } from "lucide-react";

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
    <div className="min-h-screen bg-[#042417] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#042417]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:opacity-90">
            <Shield className="h-7 w-7 text-[#22c55e]" />
            Cynapse
          </Link>
          <Link
            to="/"
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white/90 transition-colors hover:border-[#22c55e]/50 hover:bg-white/5"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#062d20] via-[#042417] to-[#042417]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-[#22c55e]/5 blur-[90px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/95">Platform · RICE Prioritization</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.1rem] lg:leading-tight">
              Stop Debating. Start Shipping.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Replace subjective arguments with objective math. Standardize product discovery using our integrated RICE scoring model to
              allocate engineering resources to maximum-impact initiatives.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="mb-10 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-500">The math</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {RICE_CELLS.map(({ title, body, icon: Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-[#0a3f31]/35 p-8 backdrop-blur-sm ring-1 ring-white/[0.04] transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 text-[#22c55e]">
                <Icon className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center">
        <Link to="/platform/governance" className="text-sm font-semibold text-slate-400 hover:text-[#22c55e]">
          ← Hard-Gate Governance
        </Link>
        <span className="mx-3 text-slate-600">·</span>
        <Link to="/solutions/enterprise" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-300">
          Enterprise solutions →
        </Link>
      </footer>
    </div>
  );
}
