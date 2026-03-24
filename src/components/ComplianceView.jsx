import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Shield, ClipboardCheck, Building2, AlertTriangle, Activity, ScrollText, Globe, FileQuestion,
  Database, Stethoscope, Landmark, BrainCircuit, Users, Rocket
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

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
      whileHover={{ y: -6, scale: 1.01 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
    {
      title: 'Cross-Border Data Transfer',
      desc: 'Map data flows and ensure compliance with GDPR Schrems II and EU-US Data Privacy Frameworks.',
      icon: Globe,
      cta: 'View Playbook',
    },
    {
      title: 'AI Vendor Due Diligence',
      desc: 'Automate security questionnaires for 3rd-party LLM providers. Verify SOC 2 and NIST AI RMF adherence.',
      icon: BrainCircuit,
      cta: 'Run Scan',
    },
    {
      title: 'SOC 2 Type I to Type II',
      desc: 'Transition from point-in-time readiness to continuous 6-month observation with automated evidence collection.',
      icon: Shield,
      cta: 'Read Guide',
    },
  ];

  const solutionCards = [
    {
      title: 'For CISOs & Security Leaders',
      desc: 'Executive dashboards for real-time risk posture, board reporting, and compliance drift alerting.',
      icon: Users,
    },
    {
      title: 'For Product Teams (Shift-Left)',
      desc: 'Integrate compliance directly into Jira and GitHub. Catch security flaws during the PRD and PR phases.',
      icon: Rocket,
    },
    {
      title: 'Automated Evidence Collection',
      desc: 'Pre-built API integrations for AWS, Google Cloud, Okta, and GitHub to continuously pull audit evidence.',
      icon: Database,
    },
  ];

  const industryCards = [
    {
      title: 'Fintech & Banking',
      desc: 'Pre-mapped controls for RBI Digital Payments, PCI-DSS, and SOX financial reporting.',
      icon: Landmark,
    },
    {
      title: 'Healthcare & MedTech',
      desc: 'HIPAA and HITECH automated safeguards for ePHI handling and BAAs.',
      icon: Stethoscope,
    },
    {
      title: 'AI & Machine Learning',
      desc: "The industry's first automated governance suite for the EU AI Act and ISO 42001.",
      icon: BrainCircuit,
    },
  ];

  const showEarlyAccessToast = (featureName) => {
    setToast(`Feature in Early Access. The ${featureName} module is scheduled for general availability in Q3. Contact your account manager for beta access.`);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);
  };

  const activeCards = useMemo(() => {
    switch (activeTab) {
      case 'use-cases':
        return useCaseCards;
      case 'solutions':
        return solutionCards;
      case 'industry':
        return industryCards;
      case 'product':
      default:
        return productCards;
    }
  }, [activeTab]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6">
      <aside className="rounded-2xl p-4 h-fit bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">Platform</p>
        <div className="space-y-1.5">
          {platformTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 font-bold'
                  : 'hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      <main>
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance Suite</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise controls and assurance workflows for {platformTabs.find((t) => t.id === activeTab)?.label}.</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {activeCards.map((card) => (
              <TiltCard
                key={card.title}
                className="rounded-2xl p-4 text-left bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <card.icon size={18} />
                </div>
                <p className="font-bold text-slate-900">{card.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                {activeTab === 'product' ? (
                  <button
                    onClick={() => {
                      if (card.action === 'modal') {
                        openNewFeatureModal();
                        return;
                      }
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl px-4 py-3"
          >
            <p className="text-xs font-semibold">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
