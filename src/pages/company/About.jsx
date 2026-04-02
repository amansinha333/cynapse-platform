import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Quote } from "lucide-react";

export default function CompanyAbout() {
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#115e49]/25 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 text-center md:pb-16 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Company</p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.15]">
              Bridging Innovation and Regulation.
            </h1>
          </motion.div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-20 md:max-w-4xl md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a3f31]/40 to-transparent p-0 md:p-4"
        >
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]">
              <Quote className="h-7 w-7" strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-10 space-y-8 text-lg leading-[1.85] text-slate-300 md:text-xl md:leading-[1.9]">
            <p className="text-center font-medium text-slate-200 md:text-left">
              The modern enterprise is trapped in a paradox. The market demands that Product Managers move with ruthless velocity, shipping
              innovative features at breakneck speed. Simultaneously, regulators demand that Compliance Officers eliminate all risk,
              effectively slowing the machine down to a halt.
            </p>

            <p className="text-center font-medium text-slate-200 md:text-left">
              Historically, these two functions have operated in silos, treating each other as adversaries. Cynapse was engineered to end
              this war.
            </p>

            <blockquote className="border-l-4 border-[#22c55e]/80 pl-6 pr-2 text-slate-200 md:pl-8">
              <p className="font-sans text-[1.05rem] leading-relaxed text-slate-300 md:text-[1.15rem] md:leading-[1.85]">
                By building a Unified Product Discovery Platform, we give product teams the ultimate sandbox to ideate, map, and prioritize
                using objective RICE metrics. But we protect the enterprise by building an unpassable Hard-Gate right before deployment.
              </p>
            </blockquote>

            <p className="rounded-2xl border border-white/10 bg-[#062d20]/60 px-6 py-8 text-center text-xl font-semibold leading-relaxed text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] md:text-2xl md:leading-snug">
              We aren&apos;t just selling project management software. We are establishing a new operational standard:{" "}
              <span className="text-[#22c55e]">Safe Velocity</span>.
            </p>
          </div>
        </motion.div>

        <div className="mt-16 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-12">
          <Link
            to="/dashboard"
            className="inline-flex rounded-full bg-[#22c55e] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-[#16a34a]"
          >
            Open the platform
          </Link>
          <Link
            to="/security"
            className="inline-flex rounded-full border border-white/15 px-8 py-3 text-sm font-bold text-white/90 transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Security overview
          </Link>
        </div>
      </article>
    </div>
  );
}
