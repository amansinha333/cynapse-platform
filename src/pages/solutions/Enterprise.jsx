import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe2, SlidersHorizontal, FileCheck2 } from "lucide-react";
import Logo, { LOGO_CLASS } from "../../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../../theme/marketing";

const SECTIONS = [
  {
    title: "Centralized Discovery for Distributed Teams",
    body:
      "Whether engineering is in Chennai and compliance is in Copenhagen, Cynapse is the single source of truth. Track features from ideation to Hard-Gate audit.",
    icon: Globe2,
    align: "left",
  },
  {
    title: "Custom Regulatory Frameworks",
    body:
      "A feature compliant in one market may violate laws in another. Build custom, market-specific Hard-Gates. Score RICE globally, enforce deployment locally.",
    icon: SlidersHorizontal,
    align: "right",
  },
  {
    title: "Audit-Ready by Default",
    body:
      "Every feature passing the Hard-Gate generates an immutable cryptographic log. Export a complete ledger of data privacy checks for auditors in seconds.",
    icon: FileCheck2,
    align: "left",
  },
];

export default function Enterprise() {
  return (
    <div className={MARKETING_PAGE}>
      <header className={MARKETING_HEADER}>
        <div className={MARKETING_HEADER_INNER}>
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} />
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-[#042f1f] transition-colors hover:border-emerald-400 hover:bg-emerald-50"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-emerald-50 via-white to-slate-50" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-300/15 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center md:pb-28 md:pt-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Solutions · Enterprise</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#042f1f] md:text-5xl md:leading-[1.12]">
              Aligning Global Roadmaps with Local Regulations.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
              When executing step-change strategies across global channel networks, product misalignment costs millions. Cynapse unifies your
              strategic vision while adapting to localized regulatory environments.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="space-y-20 md:space-y-28">
          {SECTIONS.map(({ title, body, icon: Icon, align }) => (
            <motion.section
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
            >
              <div
                className={`flex justify-center ${
                  align === "right" ? "order-1 md:order-2 md:justify-end" : "order-1 md:order-1 md:justify-end"
                }`}
              >
                <div className="relative flex h-48 w-full max-w-md items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.12)_0%,_transparent_70%)]" />
                  <Icon className="relative h-20 w-20 text-[#22c55e]" strokeWidth={1.25} />
                </div>
              </div>
              <div className={align === "right" ? "order-2 md:order-1" : "order-2 md:order-2"}>
                <h2 className="text-2xl font-bold text-[#042f1f] md:text-3xl">{title}</h2>
                <p className="mt-5 text-[17px] leading-relaxed text-slate-600">{body}</p>
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-12 text-center">
        <Link to="/company/about" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-700">
          Read our mission →
        </Link>
      </footer>
    </div>
  );
}
