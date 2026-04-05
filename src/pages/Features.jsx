import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Gavel, ArrowRight, CheckCircle2 } from "lucide-react";
import Logo from "../components/ui/Logo";

export default function Features() {
  return (
    <div className="min-h-screen bg-[#042417] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#042417]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className="h-8 w-auto text-emerald-500 md:h-9" variant="dark" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hidden text-sm font-semibold text-slate-400 hover:text-white sm:inline">
              About
            </Link>
            <Link
              to="/"
              className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-colors hover:bg-[#16a34a]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#115e49]/40 via-[#042417] to-[#042417]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Platform capabilities</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Built for objective prioritization and defensible compliance</h1>
            <p className="mt-6 text-lg text-slate-300">
              Cynapse unifies discovery, RICE scoring, and regulatory gates so enterprise teams ship faster—without sacrificing auditability.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-6 py-16 md:py-24">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-2 lg:items-center"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0a3f31]/50 p-8 md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
              <BarChart3 className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">RICE prioritization engine</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Move from opinion-based roadmaps to <strong className="text-white">objective product mapping</strong>. Reach, Impact,
              Confidence, and Effort are captured in one system of record so product, engineering, and governance teams align on the same
              numbers—not slide decks that diverge after every meeting.
            </p>
            <ul className="mt-6 space-y-3 text-slate-300">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>Comparable scores across initiatives for fair trade-off conversations.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>History and context stay attached to each initiative for downstream audits.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-400">
            <p>
              RICE in Cynapse is not a spreadsheet export—it is embedded in how work is represented. That means when leadership asks why
              one bet was funded over another, the answer is traceable to documented assumptions and scores, not memory.
            </p>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-2 lg:items-center"
        >
          <div className="order-2 space-y-4 text-sm leading-relaxed text-slate-400 lg:order-1">
            <p>
              Ideation stays fast. The compliance bar rises when risk rises—at the moment you approach production. That separation protects
              velocity in discovery while preserving non-negotiable controls before customers are impacted.
            </p>
          </div>
          <div className="order-1 rounded-2xl border border-white/10 bg-[#0a3f31]/50 p-8 md:p-10 lg:order-2">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
              <Gavel className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">Hard-gate compliance governance</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Regulatory and policy checks are <strong className="text-white">enforced strictly before the deployment phase</strong>—not as
              a late manual review. Features that fail governed criteria remain visibly blocked so engineering capacity is not spent on work
              that cannot ship safely.
            </p>
            <ul className="mt-6 space-y-3 text-slate-300">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>Gates align with your internal policies and uploaded regulatory corpora.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>Early design and validation proceed without unnecessary friction.</span>
              </li>
            </ul>
          </div>
        </motion.article>

        <div className="flex flex-wrap justify-center gap-4 pb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-[#16a34a]"
          >
            Open the app <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/security"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white/90 transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Security overview
          </Link>
        </div>
      </div>
    </div>
  );
}
