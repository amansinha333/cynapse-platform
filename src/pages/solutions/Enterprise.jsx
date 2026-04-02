import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Globe2, SlidersHorizontal, FileCheck2 } from "lucide-react";

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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#042417] via-[#0a2f24] to-[#115e49]/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center md:pb-28 md:pt-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/95">Solutions · Enterprise</p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
              Aligning Global Roadmaps with Local Regulations.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
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
                <div className="relative flex h-48 w-full max-w-md items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a3f31]/90 to-[#042417] p-8 shadow-[0_0_60px_-12px_rgba(34,197,94,0.12)]">
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.08)_0%,_transparent_70%)]" />
                  <Icon className="relative h-20 w-20 text-[#22c55e]" strokeWidth={1.25} />
                </div>
              </div>
              <div className={align === "right" ? "order-2 md:order-1" : "order-2 md:order-2"}>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{title}</h2>
                <p className="mt-5 text-[17px] leading-relaxed text-slate-300">{body}</p>
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 py-12 text-center">
        <Link to="/company/about" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-300">
          Read our mission →
        </Link>
      </footer>
    </div>
  );
}
