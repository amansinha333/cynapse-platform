import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Building2,
  Gavel,
  BarChart3,
  Lock,
  Server,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const pillars = [
  {
    icon: Building2,
    title: "Multi-Tenant Data Isolation",
    summary:
      "Every customer workspace is logically isolated with strict access boundaries so tenant data never co-mingles in application workflows.",
  },
  {
    icon: Gavel,
    title: "Hard-Gate Compliance Governance",
    summary:
      "Regulatory checks are enforced at the deployment gate—after ideation and design—so teams move fast early while critical controls remain non-negotiable before release.",
  },
  {
    icon: BarChart3,
    title: "Prioritization Integrity",
    summary:
      "RICE scoring is built into the product map so prioritization stays auditable, consistent, and aligned with enterprise governance standards.",
  },
  {
    icon: Lock,
    title: "Encryption at Rest & In Transit",
    summary:
      "Industry-standard TLS protects data in motion; encrypted storage and key management practices protect data at rest across the stack.",
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-[#042417] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#042417]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:opacity-90">
            <Shield className="h-7 w-7 text-[#22c55e]" />
            Cynapse
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="hidden text-sm font-semibold text-slate-400 hover:text-white sm:inline"
            >
              Privacy
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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#115e49]/40 via-[#042417] to-[#042417]" />
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Enterprise Trust</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Security & compliance built for regulated product teams
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              Cynapse is designed for IT security, compliance, and engineering leaders who need a defensible platform
              posture—without compromising velocity in discovery and prioritization.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-[#16a34a]"
              >
                View the platform <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:security@cynapse.com"
                className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/90 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Contact security
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map(({ icon: Icon, title, summary }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-[#0a3f31]/40 p-8 shadow-xl shadow-black/20"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{summary}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Deep sections */}
      <section className="border-t border-white/10 bg-[#062d20]/50">
        <div className="mx-auto max-w-4xl space-y-16 px-6 py-20 text-slate-300">
          <article className="space-y-4">
            <div className="flex items-center gap-3">
              <Server className="h-7 w-7 text-[#22c55e]" />
              <h2 className="text-2xl font-bold text-white">Multi-Tenant Data Isolation</h2>
            </div>
            <p className="leading-relaxed">
              Cynapse is architected so each workspace operates in a tenant-scoped context. User identity, role
              assignments, and product data are partitioned by organization so that discovery, prioritization, and audit
              artifacts remain within the boundaries of your enterprise. Administrative access follows least-privilege
              principles, and cross-tenant visibility is not exposed through standard application paths—supporting
              enterprise requirements for segregation of duties and data residency discussions.
            </p>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>Workspace-scoped access and governance controls aligned with enterprise IAM.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>Operational practices designed to prevent accidental data bleed between customers.</span>
              </li>
            </ul>
          </article>

          <article className="space-y-4">
            <div className="flex items-center gap-3">
              <Gavel className="h-7 w-7 text-[#22c55e]" />
              <h2 className="text-2xl font-bold text-white">Hard-Gate Compliance Governance</h2>
            </div>
            <p className="leading-relaxed">
              Early ideation should stay fast. Cynapse separates creative exploration from the compliance checkpoint that
              matters most: what ships to production. Our governance engine enforces regulatory and policy checks at the
              pre-deployment gate—so teams can brainstorm, validate, and map work without unnecessary friction, while
              still meeting non-negotiable obligations before release. That means compliance is embedded in the workflow,
              not bolted on as an afterthought.
            </p>
            <p className="leading-relaxed">
              The result is a deliberate balance: speed where it belongs (discovery and prioritization), and rigor where
              risk is highest (deployment readiness).
            </p>
          </article>

          <article className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-[#22c55e]" />
              <h2 className="text-2xl font-bold text-white">Prioritization Integrity</h2>
            </div>
            <p className="leading-relaxed">
              Subjective roadmaps create audit risk. Cynapse natively supports the RICE framework—Reach, Impact,
              Confidence, and Effort—so teams can document an objective, repeatable methodology for prioritization. Scores
              and assumptions surface in the product map, making it easier to explain trade-offs to executives, auditors,
              and regulators without reconstructing spreadsheets after the fact.
            </p>
            <p className="leading-relaxed">
              When governance and security teams need evidence, prioritization is already structured and traceable—not
              buried in ad-hoc notes.
            </p>
          </article>

          <article className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="h-7 w-7 text-[#22c55e]" />
              <h2 className="text-2xl font-bold text-white">Encryption at Rest & In Transit</h2>
            </div>
            <p className="leading-relaxed">
              Data moving between your users and Cynapse is protected with TLS. Sensitive payloads are encrypted in transit
              across service boundaries. At rest, we rely on modern encryption standards and key management practices
              appropriate for cloud-hosted enterprise software, reducing exposure from disk or backup media.
            </p>
            <p className="leading-relaxed">
              Security is an ongoing program—patching, monitoring, and least-privilege operations complement encryption
              controls. For procurement-specific questionnaires or custom review cycles, contact our team at{" "}
              <a href="mailto:security@cynapse.com" className="font-semibold text-[#22c55e] hover:text-emerald-300">
                security@cynapse.com
              </a>
              .
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          © {new Date().getFullYear()} Cynapse Inc. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm font-semibold">
          <Link to="/privacy" className="text-[#22c55e] hover:text-emerald-300">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-[#22c55e] hover:text-emerald-300">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
