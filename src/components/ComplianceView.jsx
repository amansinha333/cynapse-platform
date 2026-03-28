import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Shield, ClipboardCheck, Building2, AlertTriangle, Activity, ScrollText, Globe, FileQuestion,
  Database, Stethoscope, Landmark, BrainCircuit, Users, Rocket
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { staggerContainer, fadeUp, easings, springs } from '../utils/motion';
import GateStatusBar from './GateStatusBar';

function TiltCard({ children, className = '' }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 180, damping: 18 });
  const smoothY = useSpring(rotateY, { stiffness: 180, damping: 18 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 8);
    rotateX.set((0.5 - py) * 8);
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 1200 }}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const TAB_GATE_CONFIGS = {
  product: [
    { id: 'data-residency',   label: 'Data Residency',    icon: Globe,      status: 'pass' },
    { id: 'vendor-clearance',  label: 'Vendor Clearance',  icon: Building2,  status: 'pass' },
    { id: 'encryption',        label: 'Encryption',        icon: Shield,     status: 'pass' },
    { id: 'ai-governance',     label: 'AI Governance',     icon: BrainCircuit, status: 'pending' },
    { id: 'regulatory',        label: 'Regulatory',        icon: ScrollText, status: 'fail' },
    { id: 'final-sign-off',    label: 'Final Sign-Off',    icon: Shield,     status: 'pending' },
  ],
  'use-cases': [
    { id: 'data-transfer',    label: 'Data Transfer',     icon: Globe,      status: 'pass' },
    { id: 'vendor-audit',     label: 'Vendor Audit',      icon: Building2,  status: 'pass' },
    { id: 'soc2-readiness',   label: 'SOC 2 Readiness',   icon: ClipboardCheck, status: 'pending' },
    { id: 'pen-test',         label: 'Pen Testing',       icon: Shield,     status: 'pass' },
  ],
  solutions: [
    { id: 'ciso-review',     label: 'CISO Review',       icon: Users,      status: 'pass' },
    { id: 'shift-left',      label: 'Shift-Left Check',  icon: Rocket,     status: 'pass' },
    { id: 'evidence-collect', label: 'Evidence Collection', icon: Database, status: 'pending' },
  ],
  industry: [
    { id: 'fintech-rbi',     label: 'RBI Compliance',    icon: Landmark,   status: 'pass' },
    { id: 'hipaa',           label: 'HIPAA',             icon: Stethoscope, status: 'pass' },
    { id: 'eu-ai-act',      label: 'EU AI Act',         icon: BrainCircuit, status: 'fail' },
    { id: 'iso-42001',      label: 'ISO 42001',         icon: Shield,     status: 'pending' },
  ],
};

export default function ComplianceView() {
  const { openNewFeatureModal } = useProject();
  const [activeTab, setActiveTab] = useState('product');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const platformTabs = [
    { id: 'product', label: 'Product' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'industry', label: 'Industry' },
  ];

  const productCards = [
    { title: 'Audit Management', desc: 'Run internal and external AI audits with evidence trails.', icon: ClipboardCheck, action: 'modal' },
    { title: 'Vendor Risk Management', desc: 'Centralized vendor due diligence and periodic reassessment.', icon: Building2 },
    { title: 'Risk Management', desc: 'Identify, classify, and track risk posture changes continuously.', icon: AlertTriangle },
    { title: 'Continuous Monitoring', desc: 'Control telemetry, alerting, and real-time compliance posture.', icon: Activity },
    { title: 'Policy Management', desc: 'Policy lifecycle management with attestations and approvals.', icon: ScrollText },
    { title: 'Trust Center', desc: 'Customer-facing controls and compliance artifact sharing.', icon: Globe },
    { title: 'AI Security Questionnaire', desc: 'Auto-generate security responses with RAG-backed evidence.', icon: FileQuestion, action: 'modal' },
  ];

  const useCaseCards = [
    { title: 'Cross-Border Data Transfer', desc: 'Map data flows and ensure compliance with GDPR Schrems II and EU-US Data Privacy Frameworks.', icon: Globe, cta: 'View Playbook' },
    { title: 'AI Vendor Due Diligence', desc: 'Automate security questionnaires for 3rd-party LLM providers. Verify SOC 2 and NIST AI RMF adherence.', icon: BrainCircuit, cta: 'Run Scan' },
    { title: 'SOC 2 Type I to Type II', desc: 'Transition from point-in-time readiness to continuous 6-month observation with automated evidence collection.', icon: Shield, cta: 'Read Guide' },
  ];

  const solutionCards = [
    { title: 'For CISOs & Security Leaders', desc: 'Executive dashboards for real-time risk posture, board reporting, and compliance drift alerting.', icon: Users },
    { title: 'For Product Teams (Shift-Left)', desc: 'Integrate compliance directly into Jira and GitHub. Catch security flaws during the PRD and PR phases.', icon: Rocket },
    { title: 'Automated Evidence Collection', desc: 'Pre-built API integrations for AWS, Google Cloud, Okta, and GitHub to continuously pull audit evidence.', icon: Database },
  ];

  const industryCards = [
    { title: 'Fintech & Banking', desc: 'Pre-mapped controls for RBI Digital Payments, PCI-DSS, and SOX financial reporting.', icon: Landmark },
    { title: 'Healthcare & MedTech', desc: 'HIPAA and HITECH automated safeguards for ePHI handling and BAAs.', icon: Stethoscope },
    { title: 'AI & Machine Learning', desc: "The industry's first automated governance suite for the EU AI Act and ISO 42001.", icon: BrainCircuit },
  ];

  const showEarlyAccessToast = (featureName) => {
    setToast(`Feature in Early Access. The ${featureName} module is scheduled for general availability in Q3. Contact your account manager for beta access.`);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);
  };

  const activeCards = useMemo(() => {
    switch (activeTab) {
      case 'use-cases': return useCaseCards;
      case 'solutions': return solutionCards;
      case 'industry':  return industryCards;
      case 'product':
      default:          return productCards;
    }
  }, [activeTab]);

  const activeGates = TAB_GATE_CONFIGS[activeTab] || TAB_GATE_CONFIGS.product;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6">
      {/* Sidebar */}
      <motion.aside
        className="rounded-2xl p-4 h-fit bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: easings.outExpo }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">Platform</p>
        <div className="space-y-1.5">
          {platformTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 font-bold'
                  : 'hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="compliance-tab-indicator"
                  className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-600 rounded-r"
                  transition={springs.snappy}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.aside>

      <main>
        {/* Header */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easings.outExpo }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance Suite</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise controls and assurance workflows for {platformTabs.find((t) => t.id === activeTab)?.label}.</p>
        </motion.div>

        {/* Gate Status Pipeline */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easings.outExpo }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + '-gates'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <GateStatusBar gates={activeGates} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Card Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={staggerContainer(0.06, 0.05)}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {activeCards.map((card) => (
              <TiltCard
                key={card.title}
                className="rounded-2xl p-4 text-left bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50"
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3"
                  whileHover={{ rotate: -8, scale: 1.1 }}
                  transition={springs.snappy}
                >
                  <card.icon size={18} />
                </motion.div>
                <p className="font-bold text-slate-900">{card.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                {activeTab === 'product' ? (
                  <button
                    onClick={() => {
                      if (card.action === 'modal') { openNewFeatureModal(); return; }
                      showEarlyAccessToast(card.title);
                    }}
                    className="inline-flex mt-3 text-xs font-bold tracking-[0.12em] uppercase text-indigo-700 hover:underline"
                  >
                    {card.action === 'modal' ? 'Launch workflow' : 'Request beta access'}
                  </button>
                ) : (
                  <button
                    onClick={() => showEarlyAccessToast(card.title)}
                    className="inline-flex mt-3 text-xs font-bold tracking-[0.12em] uppercase text-indigo-700 hover:underline"
                  >
                    {card.cta || 'Explore'}
                  </button>
                )}
              </TiltCard>
            ))}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: easings.outExpo }}
            className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl px-4 py-3"
          >
            <p className="text-xs font-semibold">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
