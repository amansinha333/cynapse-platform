import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightbulb, BarChart3, Gavel, CheckCircle2 } from "lucide-react";
import Logo, { LOGO_CLASS } from "../../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../../theme/marketing";

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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/95 via-white to-slate-50" />
        <div className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 md:pb-28 md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Platform · Hard-Gate Governance</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#042f1f] md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Frictionless Ideation. Ironclad Deployment.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
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
              className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50 blur-2xl transition-opacity group-hover:bg-emerald-100/80" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">{phase}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-[#22c55e]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[#042f1f] md:text-2xl">{title}</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center">
        <Link to="/platform/prioritization" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-700">
          Next: RICE Prioritization →
        </Link>
      </footer>
    </div>
  );
}
