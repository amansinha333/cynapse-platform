import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, ChevronRight, ChevronDown, Mail, Globe, Database,
  CheckCircle2, BarChart3, Lock, Cpu, Terminal, Zap, FileText,
  Activity, Sparkles, Code2, Clock, CheckCircle
} from "lucide-react";
import posthog from "posthog-js";
import SafeScrollReveal from "../components/ui/SafeScrollReveal";
import MagneticButton from "../components/ui/MagneticButton";
import IsolatedHero3D from "../components/3d/IsolatedHero3D";
import BrandedLoader from "../components/ui/BrandedLoader";
import Logo from "../components/ui/Logo";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 9000);
    return () => clearTimeout(t);
  }, []);

  const workflowTabs = [
    {
      id: 0,
      title: "1. Vectorize Legal Manuals",
      description: "Upload massive regulatory PDFs. Our Python backend chunks and embeds them into a Pinecone Vector Database.",
      icon: <FileText className="w-5 h-5" />,
      mockCode: (
        <>
          <span className="text-slate-500">1</span> <span className="text-slate-400">[14:02:01]</span> <span className="text-blue-400 font-bold">INFO</span> Connecting to Pinecone DB cluster...<br />
          <span className="text-slate-500">2</span> <span className="text-slate-400">[14:02:02]</span> <span className="text-blue-400 font-bold">INFO</span> Chunking GDPR_Guidelines_2025.pdf (420 pages)<br />
          <span className="text-slate-500">3</span> <span className="text-slate-400">[14:02:03]</span> <span className="text-blue-400 font-bold">INFO</span> Chunking RBI_Master_Directions.pdf (112 pages)<br />
          <span className="text-slate-500">4</span> <span className="text-emerald-400">[====================] 100%</span><br />
          <span className="text-slate-500">5</span> <span className="text-slate-400">[14:02:08]</span> <span className="text-emerald-400 font-bold">SUCCESS</span> Vectorized 47 documents.<br />
          <span className="text-slate-500">6</span> <span className="text-slate-400">[14:02:08]</span> <span className="text-emerald-400 font-bold">SUCCESS</span> 768-dimension embeddings stored and indexed.
        </>
      )
    },
    {
      id: 1,
      title: "2. Agentic RAG Audit",
      description: "Gemini 2.5 Flash retrieves the top 20 relevant legal chunks and audits your feature description instantly.",
      icon: <Cpu className="w-5 h-5" />,
      mockCode: (
        <>
          <span className="text-slate-500">1</span> <span className="text-slate-400">[14:05:11]</span> <span className="text-blue-400 font-bold">INFO</span> Initiating Node 1: Local Auditor Agent...<br />
          <span className="text-slate-500">2</span> <span className="text-slate-400">[14:05:12]</span> <span className="text-blue-400 font-bold">INFO</span> Analyzing feature: "UPI Payment Gateway"<br />
          <span className="text-slate-500">3</span> <span className="text-slate-400">[14:05:13]</span> <span className="text-purple-400 font-bold">TRACE</span> Semantic match: 0.94 (RBI Docs, Sec 3.1)<br />
          <span className="text-slate-500">4</span> <br />
          <span className="text-slate-500">5</span> <span className="text-slate-300 font-bold">--- NODE 1 OUTPUT ---</span><br />
          <span className="text-slate-500">6</span> STATUS:   <span className="text-red-400 font-bold bg-red-900/30 px-1">BLOCKED</span><br />
          <span className="text-slate-500">7</span> REASON:   Data must be stored locally in India.<br />
          <span className="text-slate-500">8</span> CITATION: RBI_Master_Directions.pdf (Sec 3.1)
        </>
      )
    },
    {
      id: 2,
      title: "3. Hard-Gate Governance",
      description: "Blocked features are visually locked on your Agile boards, physically preventing unauthorized engineering work.",
      icon: <Lock className="w-5 h-5" />,
      mockCode: (
        <>
          <span className="text-slate-500">1</span> <span className="text-slate-400">[14:05:15]</span> <span className="text-blue-400 font-bold">INFO</span> Pushing status to Enterprise Workspace...<br />
          <span className="text-slate-500">2</span> <span className="text-slate-400">[14:05:16]</span> <span className="text-blue-400 font-bold">INFO</span> Updating Jira webhook endpoints...<br />
          <span className="text-slate-500">3</span> <span className="text-slate-400">[14:05:17]</span> <span className="text-yellow-400 font-bold">WARN</span> Feature CYN-101 state transition -&gt; LOCKED<br />
          <span className="text-slate-500">4</span> <br />
          <span className="text-slate-500">5</span> <span className="text-red-400 font-bold border border-red-500/50 bg-red-500/10 px-2 py-0.5">[ALERT] Development restricted by Governance Engine.</span><br />
          <span className="text-slate-500">6</span> Please resolve compliance drift before <br />
          <span className="text-slate-500">7</span> allocating engineering resources.
        </>
      )
    }
  ];

  const faqs = [
    {
      question: "How does the Node 1 Local RAG system actually work?",
      answer: "Organizations upload their proprietary compliance manuals, ISO standards, or regulatory PDFs via our secure interface. Our Python FastAPI backend physically extracts the text, chunks it, and converts it into 768-dimensional mathematical embeddings stored in a Pinecone Vector Database. When your Product Managers write a feature description, Gemini 2.5 Flash retrieves the top 20 most relevant legal clauses and audits the feature instantly, providing exact citations to prevent AI hallucinations."
    },
    {
      question: "What is 'Hard-Gate Governance'?",
      answer: "Traditional prioritization frameworks (like RICE) dangerously blend business value with legal risk, allowing highly profitable but non-compliant features to enter development. Cynapse explicitly separates them. The Insight Engine calculates RICE for business priority, but if the Multi-Node Audit detects a critical violation, it applies an immutable 'Blocked' status, physically locking the feature on your Kanban board to prevent wasted engineering hours."
    },
    {
      question: "Is our proprietary product roadmap data secure?",
      answer: "Absolutely. Cynapse Enterprise is designed for deployment within your own virtual private cloud (VPC). Node 1 operates entirely on your localized Pinecone index. Documents are processed using enterprise-grade encryption, and evidence is stored securely using 15-minute cryptographically presigned URLs directly integrated with AWS S3."
    },
    {
      question: "What industries and frameworks does Cynapse support?",
      answer: "Cynapse is entirely industry-agnostic. Because it relies on a universal Retrieval-Augmented Generation (RAG) architecture, it adapts to your specific vertical simply by uploading new PDFs. We currently support teams mapping FinTech (RBI, PCI-DSS), HealthTech (HIPAA, FDA 21 CFR), General SaaS (SOC 2, ISO 27001), and Hardware manufacturing codes (ASME, CE Marking)."
    },
    {
      question: "How does Node 2 (Global Web Intelligence) complement Node 1?",
      answer: "Internal static databases are not enough in a rapidly changing world. Node 2 utilizes truncated SerpAPI scraping to cross-reference your project against live internet news. It gauges real-time public sentiment and flags recently passed regional laws that may not yet be documented in your local PDF database, ensuring zero blind spots."
    }
  ];

  return (
    <>
      {/* === BRANDED LOADER === */}
      {isLoading && <BrandedLoader onComplete={handleLoaderComplete} />}

      <div
        style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.6s ease-out" }}
        className="min-h-screen bg-white text-[#042f1f] font-sans overflow-x-hidden pb-4"
      >

      {/* --- 1. FLOATING NAVIGATION --- */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-6 h-[72px] flex items-center justify-between max-w-[1300px] mx-auto pointer-events-auto border border-slate-100"
        >
          <div className="flex items-center gap-10">
            <a href="/" className="flex items-center shrink-0" aria-label="Cynapse home">
              <Logo className="h-auto max-h-[5rem] w-auto text-emerald-500 md:max-h-[5.5rem]" />
            </a>

            <div className="hidden md:flex items-center gap-2 lg:gap-4 text-[13px] lg:text-[14px] font-semibold text-[#042f1f]">
              {/* Platform */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-2 py-2 hover:text-[#22c55e] transition-colors"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  Platform
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                <div className="absolute left-0 top-full z-[60] pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="min-w-[240px] rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl">
                    <Link
                      to="/platform/governance"
                      className="block px-4 py-2.5 text-[13px] text-[#042f1f] hover:bg-[#f0fdf4] hover:text-[#22c55e]"
                    >
                      Hard-Gate Governance
                    </Link>
                    <Link
                      to="/platform/prioritization"
                      className="block px-4 py-2.5 text-[13px] text-[#042f1f] hover:bg-[#f0fdf4] hover:text-[#22c55e]"
                    >
                      RICE Prioritization
                    </Link>
                  </div>
                </div>
              </div>
              {/* Solutions */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-2 py-2 hover:text-[#22c55e] transition-colors"
                >
                  Solutions
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                <div className="absolute left-0 top-full z-[60] pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="min-w-[220px] rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl">
                    <Link
                      to="/solutions/enterprise"
                      className="block px-4 py-2.5 text-[13px] text-[#042f1f] hover:bg-[#f0fdf4] hover:text-[#22c55e]"
                    >
                      Enterprise
                    </Link>
                  </div>
                </div>
              </div>
              {/* Company */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-2 py-2 hover:text-[#22c55e] transition-colors"
                >
                  Company
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                <div className="absolute left-0 top-full z-[60] pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="min-w-[200px] rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl">
                    <Link
                      to="/company/about"
                      className="block px-4 py-2.5 text-[13px] text-[#042f1f] hover:bg-[#f0fdf4] hover:text-[#22c55e]"
                    >
                      About us
                    </Link>
                    <Link
                      to="/security"
                      className="block px-4 py-2.5 text-[13px] text-[#042f1f] hover:bg-[#f0fdf4] hover:text-[#22c55e]"
                    >
                      Security Center
                    </Link>
                  </div>
                </div>
              </div>
              <a href="#customers" className="hover:text-[#22c55e] transition-colors px-1">
                Customers
              </a>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="/dashboard" className="hidden md:block text-[15px] font-semibold text-[#042f1f] hover:text-[#22c55e] transition-colors">
              Sign in
            </a>
            <MagneticButton
              href="/dashboard"
              onClick={() => posthog.capture("clicked_demo_button")}
              className="bg-[#22c55e] text-white px-5 py-2.5 rounded-full text-[15px] font-bold hover:bg-[#16a34a] transition-colors flex items-center gap-2 hover:scale-105 duration-300 shadow-sm shadow-green-500/20"
            >
              See a demo <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>
        </motion.div>
      </nav>

      {/* --- 2. LUSH GREEN HERO SECTION --- */}
      <section className="px-4 md:px-6 pt-24 pb-8">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0a3f31] pb-16 max-w-[1500px] mx-auto shadow-2xl border border-white/10">
          {/* Subtle Background Gradients to mimic the illustration */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#115e49] via-[#0a3f31] to-[#042417] opacity-90 z-0"></div>
          <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-[#facc15]/10 to-transparent z-0 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-stretch items-stretch px-6 md:px-10 pt-28 pb-6">
            <SafeScrollReveal className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-4xl lg:max-w-none mx-auto lg:mx-0 w-full">
            {/* New Feature Pill */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-8">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold tracking-wide text-white uppercase">Cynapse 3.0 is Live</span>
            </div>

            <h1 className="text-[3rem] md:text-[5rem] lg:text-[5.5rem] font-bold tracking-tighter text-white leading-[1.05] mb-6 drop-shadow-lg">
              Govern and map your human and AI products
            </h1>

            <p className="text-lg md:text-[1.35rem] text-emerald-50/90 max-w-2xl mx-auto lg:mx-0 mb-12 font-medium leading-snug">
              Make every compliance interaction better, faster, and more consistent with the optimization platform for enterprise governance.
            </p>

            {/* Email Input & Yellow Button */}
            <div className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-full w-full max-w-md mx-auto lg:mx-0 shadow-2xl hover:shadow-[0_8px_30px_rgba(250,204,21,0.2)] transition-shadow duration-500">
              <div className="flex items-center w-full px-4 text-slate-400">
                <Mail className="w-5 h-5 mr-3 shrink-0" />
                <input
                  type="email"
                  placeholder="Work email address"
                  className="flex-1 bg-transparent py-2 outline-none text-[#042f1f] placeholder-slate-400 w-full text-base font-medium"
                />
              </div>
              <MagneticButton
                href="/dashboard"
                onClick={() => posthog.capture("clicked_demo_button")}
                className="w-full sm:w-auto bg-[#facc15] text-[#422006] px-6 py-3 rounded-full text-[15px] font-bold hover:bg-[#eab308] transition-colors flex items-center justify-center gap-2 shrink-0 mt-2 sm:mt-0 hover:scale-105 duration-300"
              >
                See a demo <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
            </SafeScrollReveal>

            <div className="relative w-full min-h-[520px] h-[520px] lg:min-h-[520px] lg:h-full pointer-events-none hidden lg:block">
              <IsolatedHero3D />
            </div>
          </div>

          {/* Social Proof Logos (Infinite "Moving Train" Marquee) */}
          <div className="relative z-10 w-full mt-28 border-t border-white/10 pt-8 overflow-hidden flex flex-col items-center">

            <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-[0.2em] mb-6 text-center w-full">Trusted by innovative engineering teams</p>

            <div className="w-full relative flex">
              {/* Gradient Fades for the edges */}
              <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#0a3f31] to-transparent z-20 pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#0a3f31] to-transparent z-20 pointer-events-none"></div>

              <motion.div
                className="flex items-center gap-16 md:gap-24 w-max opacity-70"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
              >
                {/* Map the array twice to create a seamless infinite loop */}
                {[...Array(2)].map((_, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-2xl font-serif font-bold text-white tracking-tighter flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default"><Database className="w-6 h-6" /> Quantum Data</span>
                    <span className="text-2xl font-sans font-bold text-white tracking-tight flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default"><Shield className="w-6 h-6" /> Apex FinTech</span>
                    <span className="text-xl font-sans font-black text-white tracking-widest border-2 border-white/80 hover:border-white px-2 py-0.5 rounded-lg transition-colors cursor-default">NEXUS AI</span>
                    <span className="text-2xl font-sans font-bold text-white tracking-tight flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default"><Globe className="w-6 h-6" /> Global Health</span>
                    <span className="text-2xl font-serif font-bold text-white tracking-tighter flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default"><Cpu className="w-6 h-6" /> AeroDynamics</span>
                    <span className="text-xl font-sans font-bold text-white tracking-tight flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default"><Lock className="w-6 h-6" /> SecureCorp</span>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2.5 NARRATIVE: THE COMPLIANCE CHASM --- */}
      <section className="py-24 px-4 md:px-8 max-w-[1300px] mx-auto border-b border-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 md:gap-24 items-center"
        >
          <div>
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-8 border border-rose-100">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tighter text-[#042f1f] leading-[1.1] mb-6">
              The gap between agile speed and strict legal safety.
            </h2>
          </div>
          <div>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-6">
              Modern product teams move at unprecedented velocities, prioritizing features using Agile tools and AI summarization. But complex regulatory frameworks—from the EU AI Act to HIPAA and SOC 2—demand slow, rigorous checks. This creates a dangerous disconnect.
            </p>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium text-[#042f1f]">
              Cynapse bridges this <strong className="text-[#22c55e]">"Compliance Chasm"</strong> by embedding legal intelligence directly into the ideation phase. By validating viability before a single line of code is written, teams prevent 3-6 month delays and massive architectural rework costs.
            </p>
          </div>
        </motion.div>
      </section>

      {/* --- 3. THE 3 INSIGHT CARDS --- */}
      <section className="py-24 px-4 md:px-8 max-w-[1300px] mx-auto">
        <SafeScrollReveal className="mb-20">
          <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tighter text-[#042f1f] text-center max-w-4xl mx-auto leading-[1.05]">
            Close the loop from product insight to compliance execution
          </h2>
        </SafeScrollReveal>

        <SafeScrollReveal stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Yellow */}
          <div
            className="bg-[#fef9c3] rounded-[2rem] p-8 flex flex-col overflow-hidden h-[450px] group hover:-translate-y-2 transition-transform duration-300 border border-yellow-200"
          >
            {/* Mock UI */}
            <div className="w-full h-56 bg-white/40 rounded-2xl shadow-sm mb-8 relative p-6 border border-yellow-200/50 flex flex-col justify-center group-hover:bg-white/60 transition-colors duration-300 overflow-hidden">
              {/* Animated Scanning Laser */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-yellow-400/60 shadow-[0_0_12px_rgba(250,204,21,0.8)] z-10 pointer-events-none"
              />

              <div className="space-y-4 opacity-30 relative z-0">
                <div className="h-3 bg-yellow-400 rounded w-full"></div>
                <div className="h-3 bg-yellow-400 rounded w-4/5"></div>
                <div className="h-3 bg-yellow-400 rounded w-[90%]"></div>
                <div className="h-3 bg-yellow-400 rounded w-2/3"></div>
              </div>

              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-between w-[85%] z-20 border border-slate-50"
              >
                <span className="font-bold text-slate-800 text-sm">Auto Risk Score</span>
                <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-bold flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 80
                </div>
              </motion.div>
            </div>
            <h3 className="text-[1.75rem] font-bold text-[#042f1f] leading-tight mt-auto tracking-tight">
              Review 100% of frameworks in seconds.
            </h3>
          </div>

          {/* Card 2: Green */}
          <div
            className="bg-[#dcfce7] rounded-[2rem] p-8 flex flex-col overflow-hidden h-[450px] group hover:-translate-y-2 transition-transform duration-300 border border-green-200"
          >
            {/* Mock UI */}
            <div className="w-full h-56 bg-white rounded-2xl shadow-md mb-8 relative p-6 border border-green-100 flex flex-col group-hover:shadow-lg transition-shadow duration-300">
              <div className="font-bold text-[#042f1f] mb-4 text-sm flex justify-between items-center">
                <span>Compliance Plan</span>
                {/* Simulated circular progress ring */}
                <div className="w-8 h-8 rounded-full border-4 border-emerald-100 border-t-emerald-500 flex items-center justify-center rotate-45"></div>
              </div>
              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                  <Database className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#042f1f]">Node 1 Engine</div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1">Drift <span className="text-red-500 font-bold">↘ 1.25</span> this week</div>
                </div>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="bg-slate-50 p-2 rounded text-[11px] font-medium text-slate-600 flex items-center gap-2"><Globe className="w-3 h-3 text-[#22c55e]" /> Resolving GDPR Mapping...</div>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-medium text-slate-600 flex items-center gap-2"><Lock className="w-3 h-3 text-[#22c55e]" /> SOC 2 Evidence Gap...</div>
              </div>
            </div>
            <h3 className="text-[1.75rem] font-bold text-[#042f1f] leading-tight mt-auto tracking-tight">
              Generate custom maps for every epic.
            </h3>
          </div>

          {/* Card 3: Light Teal/White */}
          <div
            className="bg-[#f0fdf4] rounded-[2rem] p-8 flex flex-col overflow-hidden h-[450px] group hover:-translate-y-2 transition-transform duration-300 border border-green-100"
          >
            {/* Mock UI */}
            <div className="w-full h-56 bg-white/60 rounded-2xl shadow-sm mb-8 relative p-6 border border-emerald-100 flex flex-col justify-end group-hover:bg-white/80 transition-colors duration-300">
              {/* Background Grid Lines for Scale */}
              <div className="absolute inset-0 flex flex-col justify-between px-4 py-8 opacity-20 pointer-events-none">
                <div className="border-b border-emerald-200 w-full border-dashed"></div>
                <div className="border-b border-emerald-200 w-full border-dashed"></div>
                <div className="border-b border-emerald-200 w-full border-dashed"></div>
              </div>

              <div className="absolute top-4 left-5 font-bold text-[#042f1f] text-sm z-10">Control performance</div>
              <div className="absolute top-10 left-5 flex gap-4 z-10">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-sm bg-[#22c55e]"></div> Manual</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-sm bg-[#86efac]"></div> AI Agents</div>
              </div>

              {/* Fake Bar Chart (Animated) */}
              <div className="flex items-end gap-3 h-[85px] mt-auto px-2 z-10">
                <motion.div initial={{ height: 0 }} whileInView={{ height: "95%" }} transition={{ duration: 1, ease: "easeOut" }} className="w-1/4 bg-[#22c55e] rounded-t-md origin-bottom shadow-sm"></motion.div>
                <motion.div initial={{ height: 0 }} whileInView={{ height: "45%" }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }} className="w-1/4 bg-[#86efac] rounded-t-md origin-bottom shadow-sm"></motion.div>
                <motion.div initial={{ height: 0 }} whileInView={{ height: "80%" }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} className="w-1/4 bg-[#22c55e] rounded-t-md origin-bottom shadow-sm"></motion.div>
                <motion.div initial={{ height: 0 }} whileInView={{ height: "65%" }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} className="w-1/4 bg-[#86efac] rounded-t-md origin-bottom shadow-sm"></motion.div>
              </div>
            </div>
            <h3 className="text-[1.75rem] font-bold text-[#042f1f] leading-tight mt-auto tracking-tight">
              Watch framework adherence increase.
            </h3>
          </div>

        </SafeScrollReveal>
      </section>

      {/* --- METRICS BANNER --- */}
      <section className="py-16 bg-[#f8fafc] border-y border-slate-100">
        <div className="max-w-[1300px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="py-4 md:py-0 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-8 h-8 text-[#22c55e]" strokeWidth={3} />
                <h3 className="text-[3.5rem] font-black text-[#0a3f31] tracking-tighter">10x</h3>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Faster Audit Cycles</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="py-4 md:py-0 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2 relative">
                <span className="absolute -left-4 top-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                <h3 className="text-[3.5rem] font-black text-[#0a3f31] tracking-tighter">0</h3>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Compliance Breaches</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="py-4 md:py-0 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[3.5rem] font-black text-[#0a3f31] tracking-tighter">$500k</h3>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Saved in Rework</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- NEW: PLATFORM SNAP - REAL-TIME AUDIT DASHBOARD --- */}
      <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#0a3f31] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-emerald-900/50"
        >
          {/* Background Accents for the Dashboard */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#facc15]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="p-8 md:p-12 relative z-10">
            <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Real-Time Audit Dashboard</h2>
                <p className="text-emerald-50/70 text-lg leading-relaxed">A unified, command-center view of your product's regulatory health, live RICE scoring, and active Hard-Gate compliance nodes.</p>
              </div>
              <button className="hidden md:flex items-center text-[#22c55e] hover:text-[#4ade80] font-semibold transition-colors">
                Explore Dashboard Features <ChevronRight className="ml-1 w-5 h-5" />
              </button>
            </div>

            {/* UI Mockup Window */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Mac-style Window Header */}
              <div className="bg-slate-800/80 border-b border-slate-700 px-4 py-3 flex items-center gap-2 backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-4 text-xs font-mono text-slate-400 flex items-center">
                  <Shield className="w-3 h-3 mr-2 text-[#22c55e]" /> cynapse-workspace / global-audit
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0f172a]">
                {/* Score Card */}
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700/50 flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-xl"></div>
                  <BarChart3 className="w-10 h-10 text-[#22c55e] mb-4" />
                  <div className="text-5xl font-extrabold text-white mb-2 tracking-tight">94<span className="text-2xl text-slate-500">%</span></div>
                  <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Global Compliance Score</div>
                  <div className="mt-4 px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs rounded-full border border-[#22c55e]/20">
                    +2.4% from last sprint
                  </div>
                </div>

                {/* Active Audits */}
                <div className="lg:col-span-2 bg-slate-800/50 p-6 md:p-8 rounded-xl border border-slate-700/50 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-lg flex items-center text-slate-200">
                      <Activity className="w-5 h-5 mr-2 text-[#22c55e]" />
                      Active Node Scans
                    </h4>
                    <span className="text-xs font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded border border-[#22c55e]/20">Live</span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'EPIC-42', name: 'Stripe Billing API Integration', status: 'Scanning Vectors (Node 1)', color: 'text-yellow-400', progress: 'w-2/3', bg: 'bg-yellow-400/20' },
                      { id: 'FEAT-88', name: 'User Authentication Flow OAuth2', status: 'Cleared (Node 2)', color: 'text-[#22c55e]', progress: 'w-full', bg: 'bg-[#22c55e]/20' },
                      { id: 'FEAT-91', name: 'GDPR Data Deletion Webhook', status: 'Hard-Gated: Policy Violation', color: 'text-red-400', progress: 'w-1/3', bg: 'bg-red-400/20' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-[#0f172a] px-2 py-1 rounded text-slate-400 border border-slate-700">{item.id}</span>
                            <span className="text-sm font-semibold text-slate-200">{item.name}</span>
                          </div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${item.color} flex items-center`}>
                            {item.status.includes('Cleared') && <CheckCircle className="w-3 h-3 mr-1" />}
                            {item.status.includes('Hard-Gated') && <Lock className="w-3 h-3 mr-1" />}
                            {item.status.includes('Scanning') && <Clock className="w-3 h-3 mr-1" />}
                            {item.status}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-[#0f172a] rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div className={`${item.bg} h-1.5 rounded-full ${item.progress} shadow-[0_0_10px_currentColor]`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- 4. LIGHT GREEN TESTIMONIAL --- */}
      <section className="py-24 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-[1300px] mx-auto bg-[#bbf7d0] rounded-[2.5rem] p-8 md:p-14 flex flex-col md:flex-row items-center gap-12 md:gap-20 shadow-lg relative overflow-hidden"
        >
          {/* Massive Faded Quote Mark for Editorial Feel */}
          <div className="absolute -top-10 -left-6 text-[16rem] font-serif leading-none text-emerald-500/10 pointer-events-none select-none">"</div>

          {/* Left Graphic */}
          <div className="w-full md:w-[45%] aspect-[4/5] bg-[#0a3f31] rounded-[2rem] overflow-hidden relative shadow-xl flex items-center justify-center group shrink-0 z-10 border border-emerald-800">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#062d20] to-[#10b981] opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10 w-48 h-48 border-4 border-[#22c55e]/30 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 bg-[#22c55e] rounded-full blur-2xl opacity-60"></div>
              <BarChart3 className="w-16 h-16 text-white absolute" strokeWidth={1.5} />
            </div>
          </div>

          {/* Right Content */}
          <div className="w-full md:w-[55%] relative z-10">
            <div className="text-[15px] font-bold text-[#062d20] flex items-center gap-1.5 mb-8">
              <Shield className="w-5 h-5" /> Apex FinTech <ChevronRight className="w-4 h-4 opacity-50" />
            </div>

            <h2 className="text-2xl md:text-[2.25rem] font-bold text-[#062d20] leading-[1.25] mb-12 tracking-tight">
              "We finally have consistent visibility into regulatory adherence across every product pipeline. And we can verify compliance readiness before code goes live, not after."
            </h2>

            <div className="flex items-center justify-between border-t border-[#062d20]/10 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-[#062d20] text-xl shadow-sm border border-emerald-100">
                  S
                </div>
                <div>
                  <div className="font-bold text-[#062d20]">Sarah Jenkins</div>
                  <div className="text-[#062d20]/80 font-medium text-sm">Chief Compliance Officer</div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 font-bold text-[#062d20] hover:opacity-70 cursor-pointer text-sm">
                Case study <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- INTERACTIVE "HOW IT WORKS" WORKFLOW (TERMINAL) --- */}
      <section className="py-24 px-4 md:px-8 max-w-[1300px] mx-auto">
        <SafeScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tighter text-[#042f1f] leading-[1.05] mb-6">
            The Agentic Architecture
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            How Cynapse transforms raw regulatory manuals into an automated, proactive security guardrail for your engineering teams.
          </p>
        </SafeScrollReveal>

        <SafeScrollReveal stagger staggerDelay={0.12} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full max-w-7xl mx-auto">
          {/* Left: Clickable Tabs */}
          <div className="w-full flex flex-col gap-4">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${activeTab === tab.id
                  ? 'border-[#22c55e] bg-[#f0fdf4] shadow-md'
                  : 'border-transparent hover:bg-slate-50'
                  }`}
              >
                <div className={`flex items-center gap-3 font-bold text-xl mb-3 ${activeTab === tab.id ? 'text-[#042f1f]' : 'text-slate-400'}`}>
                  <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-[#22c55e] text-white shadow-sm shadow-green-500/20' : 'bg-slate-200 text-slate-500'}`}>
                    {tab.icon}
                  </div>
                  {tab.title}
                </div>
                <p className={`font-medium ${activeTab === tab.id ? 'text-[#062d20]/80' : 'text-slate-400'}`}>
                  {tab.description}
                </p>
              </button>
            ))}
          </div>

          {/* Right: Interactive Terminal/UI Mockup */}
          <div className="w-full min-w-0">
            <div className="bg-[#0f172a] rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700 h-[420px] flex flex-col relative w-full">
              {/* Fake Mac Window Controls & Tab Bar */}
              <div className="h-12 bg-[#1e293b] border-b border-slate-700 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>

                <div className="ml-4 flex items-center h-full overflow-hidden">
                  <div className="flex items-center gap-2 bg-[#0f172a] border-t-2 border-t-blue-500 px-4 h-full text-xs font-mono text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis">
                    <Code2 className="w-3 h-3 text-blue-400 shrink-0" /> backend_agent.py
                  </div>
                  <div className="flex items-center gap-2 px-4 h-full text-xs font-mono text-slate-500 border-r border-slate-700/50 whitespace-nowrap shrink-0 hidden sm:flex">
                    <Terminal className="w-3 h-3" /> zsh
                  </div>
                </div>
              </div>

              {/* Dynamic Terminal Content with simulated Line Numbers */}
              <div className="flex flex-1 overflow-hidden bg-[#0f172a]">
                {/* Simulated Line Numbers gutter */}
                <div className="w-10 bg-[#1e293b]/30 border-r border-slate-700/50 shrink-0 pt-6 flex flex-col items-center text-[10px] text-slate-600 font-mono hidden sm:flex">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <div key={n} className="leading-[1.6rem]">{n}</div>)}
                </div>

                <div className="p-6 font-mono text-sm sm:text-base leading-[1.6rem] overflow-hidden relative flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-6 whitespace-pre-wrap overflow-y-auto"
                    >
                      <span className="text-[#22c55e] font-bold">admin@cynapse</span><span className="text-white">:</span><span className="text-blue-400 font-bold">~/enterprise-server</span><span className="text-white">$ run_agent --step {activeTab + 1}</span>
                      <br /><br />
                      <div className="text-slate-300">
                        {workflowTabs[activeTab].mockCode}
                      </div>

                      {activeTab === 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 text-yellow-400/90 font-bold border-l-2 border-yellow-400 pl-3">
                          &#9888; Action Required: Architectural rework recommended prior to commit.
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </SafeScrollReveal>
      </section>

      {/* --- NEW: PLATFORM SNAP - VERTICAL HARD-GATE WORKFLOW --- */}
      <section className="py-24 px-4 md:px-8 bg-[#f8fafc] border-y border-slate-100">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tighter text-[#042f1f] leading-[1.05] mb-4">
              The Hard-Gate Audit Workflow
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              How Cynapse automatically processes, scores, and audits your product features before they ever reach the engineering backlog.
            </p>
          </div>

          <div className="relative border-l-2 border-[#bbf7d0] ml-6 md:ml-12 space-y-16 pb-8">
            {[
              {
                step: '01',
                title: 'Feature Proposal & RICE Scoring',
                desc: 'Product managers draft features in the workspace. The system automatically calculates Reach, Impact, Confidence, and Effort to prioritize the backlog.',
                icon: FileText,
                accent: 'bg-emerald-50 text-emerald-600 border-emerald-200'
              },
              {
                step: '02',
                title: 'Node 1: RAG Architecture Scan',
                desc: 'Gemini Text-Embedding models cross-reference the feature proposal against your uploaded PDF regulatory documents (vectorized in Pinecone) to detect potential conflicts.',
                icon: Cpu,
                accent: 'bg-[#dcfce7] text-[#16a34a] border-[#86efac]'
              },
              {
                step: '03',
                title: 'Node 2: Hard-Gate Compliance',
                desc: 'If a regulatory violation is detected, the feature is hard-locked. It cannot be exported or pushed to engineering Jira boards until the PM mitigates the compliance risk.',
                icon: Shield,
                accent: 'bg-yellow-50 text-yellow-600 border-yellow-200'
              },
              {
                step: '04',
                title: 'Approval & Agile Handoff',
                desc: 'Once cleared by Node 2, the feature is automatically packaged, assigned a global compliance score, and seamlessly pushed to your Agile workflow tools.',
                icon: CheckCircle2,
                accent: 'bg-[#0a3f31] text-white border-[#062d20]'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative pl-10 md:pl-16 group"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#f8fafc] shadow-md transition-transform group-hover:scale-110 ${item.accent.split(' ').slice(0, 2).join(' ')}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className={`bg-white p-8 rounded-2xl border ${item.accent.split(' ')[2]} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-sm font-bold text-[#22c55e] mb-2 tracking-wider">PHASE {item.step}</div>
                    <h3 className="text-2xl font-bold text-[#042f1f] mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- 5. ENTERPRISE GRID SECTION --- */}
      <section className="py-24 px-4 md:px-8 max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* Yellow Box (With Subtle Dot Texture) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 bg-[#fefce8] rounded-[2rem] p-10 flex flex-col justify-center border border-yellow-200 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjA0LCAxNzksIDAsIDEpIi8+PC9zdmc+')]"></div>

            <div className="relative z-10 w-20 h-20 bg-[#dcfce7] rounded-[1.25rem] mb-10 flex items-center justify-center shadow-sm border border-emerald-100">
              <Lock className="w-10 h-10 text-[#16a34a]" />
            </div>
            <h3 className="relative z-10 text-3xl font-bold text-[#042f1f] mb-4 tracking-tight">Engineered for enterprises</h3>
            <p className="relative z-10 text-lg text-[#042f1f]/70 font-medium leading-relaxed">
              Enterprise-ready by design, Cynapse maps SOC 2 and ISO 27001 continuously and adheres to strict security protocols to safeguard your data.
            </p>
          </motion.div>

          {/* White Box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-3 bg-white rounded-[2rem] p-10 md:p-12 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-3xl font-bold text-[#042f1f] mb-4 tracking-tight">Made for your CX stack</h3>
            <p className="text-lg text-[#042f1f]/70 font-medium leading-relaxed max-w-lg mb-10">
              Cynapse integrates with your tech stack, connecting quality improvements across your entire developer ecosystem.
            </p>

            {/* Green Pills */}
            <div className="flex flex-wrap gap-3">
              {['Jira', 'GitHub', 'AWS', 'Google Cloud', 'Okta', 'Notion', 'Slack', 'Linear'].map((tool, i) => (
                <motion.span
                  key={tool}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-[#f0fdf4] text-[#042f1f] px-4 py-2 rounded-full font-bold text-[14px] flex items-center gap-2 border border-green-200/50 hover:bg-[#dcfce7] transition-colors cursor-default"
                >
                  <div className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  {tool}
                </motion.span>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- 6. COMPREHENSIVE FAQ --- */}
      <section className="py-24 px-4 md:px-8 max-w-[900px] mx-auto border-t border-slate-100 mt-12">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tighter text-[#042f1f] leading-[1.05] mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            Everything you need to know about the Cynapse Enterprise architecture.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'bg-white shadow-md' : 'bg-slate-50 hover:bg-slate-100'}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-6 py-6 flex justify-between items-center focus:outline-none"
              >
                <span className={`text-lg font-bold ${openFaq === idx ? 'text-[#22c55e]' : 'text-slate-800'}`}>
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 shrink-0 ${openFaq === idx ? 'bg-[#dcfce7] text-[#16a34a] rotate-180' : 'bg-slate-200 text-slate-500'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-2 text-slate-600 text-lg leading-relaxed border-t border-slate-100 mx-6">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* --- 7. BOTTOM GREEN HERO --- */}
      <section className="px-4 md:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-[#0a3f31] py-32 flex flex-col items-center text-center max-w-[1500px] mx-auto shadow-2xl border border-white/10"
        >
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#062d20] to-[#115e49] opacity-90"></div>
          <div className="absolute -top-40 right-20 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl px-6 flex flex-col items-center">
            <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tighter text-white leading-[1.05] mb-10 drop-shadow-md">
              Raise the bar for every compliance interaction
            </h2>
            <MagneticButton
              href="/login"
              onClick={() => posthog.capture("clicked_demo_button")}
              className="bg-[#22c55e] text-white px-8 py-4 rounded-full text-[15px] font-bold hover:bg-[#16a34a] transition-all flex items-center gap-2 shadow-lg shadow-[#22c55e]/30 hover:scale-105 duration-300"
            >
              See a demo <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* --- 8. FOOTER --- */}
      <footer className="bg-[#042417] text-white px-6 md:px-12 py-20 rounded-t-[2.5rem] max-w-[1500px] mx-auto mt-4 relative">
        <div className="max-w-[1300px] mx-auto flex flex-col gap-14 relative z-10">

          <div className="flex flex-col lg:flex-row justify-between gap-16">
            <div className="flex-1">
              <a href="/" className="mb-8 flex w-max shrink-0 items-center hover:opacity-80 transition-opacity" aria-label="Cynapse home">
                <Logo className="h-auto max-h-[5.25rem] w-auto text-emerald-500 md:max-h-[5.75rem]" variant="dark" />
              </a>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full w-max">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">All systems operational</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 xl:gap-20">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Platform</span>
                <Link to="/platform/governance" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Governance
                </Link>
                <Link to="/platform/prioritization" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Prioritization
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Solutions</span>
                <Link to="/solutions/enterprise" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Enterprise
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Company</span>
                <Link to="/company/about" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  About
                </Link>
                <Link to="/security" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Security
                </Link>
                <a href="#customers" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Customers
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Legal</span>
                <Link to="/privacy" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Resources</span>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Link to="/features" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                Features
              </Link>
              <Link to="/data-processing" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                Data Processing
              </Link>
              <a href="mailto:hello@cynapse.com" className="text-white hover:text-[#22c55e] font-semibold text-[14px] transition-colors">
                Contact
              </a>
              <span className="text-slate-500 font-semibold text-[14px] cursor-not-allowed" title="Coming soon">
                Documentation
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1300px] mx-auto mt-24 text-xs font-bold tracking-widest text-white/40 uppercase relative z-10 border-t border-white/10 pt-8">
          © 2026 CYNAPSE INC. ALL RIGHTS RESERVED
        </div>
      </footer>

      </div>
    </>
  );
}