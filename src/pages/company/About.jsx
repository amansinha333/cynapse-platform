import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Logo, { LOGO_CLASS } from "../../components/ui/Logo";
import { MARKETING_PAGE, MARKETING_HEADER, MARKETING_HEADER_INNER } from "../../theme/marketing";

export default function CompanyAbout() {
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-white to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 text-center md:pb-16 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Company</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#042f1f] md:text-5xl md:leading-[1.15]">
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
          className="relative rounded-3xl border border-emerald-100 bg-white p-0 shadow-sm md:p-4"
        >
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-[#22c55e]">
              <Quote className="h-7 w-7" strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-10 space-y-8 text-lg leading-[1.85] text-slate-600 md:text-xl md:leading-[1.9]">
            <p className="text-center font-medium text-slate-700 md:text-left">
              The modern enterprise is trapped in a paradox. The market demands that Product Managers move with ruthless velocity, shipping
              innovative features at breakneck speed. Simultaneously, regulators demand that Compliance Officers eliminate all risk,
              effectively slowing the machine down to a halt.
            </p>

            <p className="text-center font-medium text-slate-700 md:text-left">
              Historically, these two functions have operated in silos, treating each other as adversaries. Cynapse was engineered to end
              this war.
            </p>

            <blockquote className="border-l-4 border-[#22c55e] pl-6 pr-2 text-slate-700 md:pl-8">
              <p className="font-sans text-[1.05rem] leading-relaxed text-slate-600 md:text-[1.15rem] md:leading-[1.85]">
                By building a Unified Product Discovery Platform, we give product teams the ultimate sandbox to ideate, map, and prioritize
                using objective RICE metrics. But we protect the enterprise by building an unpassable Hard-Gate right before deployment.
              </p>
            </blockquote>

            <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-6 py-8 text-center text-xl font-semibold leading-relaxed text-[#042f1f] md:text-2xl md:leading-snug">
              We aren&apos;t just selling project management software. We are establishing a new operational standard:{" "}
              <span className="text-[#22c55e]">Safe Velocity</span>.
            </p>
          </div>
        </motion.div>

        <div className="mt-16 flex flex-wrap justify-center gap-4 border-t border-slate-200 pt-12">
          <Link
            to="/dashboard"
            className="inline-flex rounded-full bg-[#22c55e] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 transition-colors hover:bg-[#16a34a]"
          >
            Open the platform
          </Link>
          <Link
            to="/security"
            className="inline-flex rounded-full border border-slate-300 px-8 py-3 text-sm font-bold text-[#042f1f] transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            Security overview
          </Link>
        </div>
      </article>
    </div>
  );
}
