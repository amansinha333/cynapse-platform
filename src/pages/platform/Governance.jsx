import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lightbulb, BarChart3, Gavel, CheckCircle2 } from "lucide-react";

const WORKFLOW_STEPS = [
  {
    phase: "Phase 1",
    title: "Unrestricted Discovery",
    body:
      "Product teams need room to breathe. In early product mapping, Cynapse disables blockers. PMs freely brainstorm without triggering premature legal reviews.",
    icon: Lightbulb,
  },
  {
    phase: "Phase 2",
    title: "RICE-Scored Planning",
    body:
      "Ideas are objectively ranked using our native engine. Only the highest-yield features move to the active roadmap.",
    icon: BarChart3,
  },
  {
    phase: "Phase 3",
    title: "The Hard-Gate Check",
    body:
      "Before a line of code is deployed, the engine engages. It cross-references the spec against custom regulatory frameworks (GDPR, ISO, internal policies).",
    icon: Gavel,
  },
  {
    phase: "Phase 4",
    title: "Go/No-Go Resolution",
    body:
      "If a feature fails, deployment is locked. The system flags the violation for Risk teams. Zero non-compliant code ships.",
    icon: CheckCircle2,
  },
];

export default function Governance() {
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#115e49]/45 via-[#042417] to-[#042417]" />
        <div className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 md:pb-28 md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/95">Platform · Hard-Gate Governance</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Frictionless Ideation. Ironclad Deployment.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Cynapse shifts compliance to the exact moment it matters. Eliminate regulatory red tape during product discovery, enforcing a
              strict Hard-Gate only when a feature is queued for deployment.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {WORKFLOW_STEPS.map(({ phase, title, body, icon: Icon }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a3f31]/80 to-[#042417] p-8 shadow-[0_0_0_1px_rgba(34,197,94,0.06)] shadow-emerald-950/20 transition-shadow hover:shadow-[0_0_40px_-8px_rgba(34,197,94,0.15)]"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#22c55e]/5 blur-2xl transition-opacity group-hover:bg-[#22c55e]/10" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90">{phase}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#22c55e]/10 text-[#22c55e]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center">
        <Link to="/platform/prioritization" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-300">
          Next: RICE Prioritization →
        </Link>
      </footer>
    </div>
  );
}
