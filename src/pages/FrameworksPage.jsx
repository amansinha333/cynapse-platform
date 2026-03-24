import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CATEGORIES = [
  'All',
  'SaaS & Cloud',
  'AI & Data Privacy',
  'Hardware & Manufacturing',
  'Healthcare & MedTech',
  'Financial & FinTech',
  'ESG & Corporate',
];

const FRAMEWORKS = [
  { id: 'soc-2', name: 'SOC 2', category: 'SaaS & Cloud', region: 'US', progress: 84, statusText: 'Security, Availability, Confidentiality. 12 Controls Failing.' },
  { id: 'iso-27001', name: 'ISO 27001', category: 'SaaS & Cloud', region: 'Global', progress: 92, statusText: 'ISMS fully established. Audit due in 45 days.' },
  { id: 'fedramp', name: 'FedRAMP', category: 'SaaS & Cloud', region: 'US', progress: 45, statusText: 'Moderate baseline package in review with assessor.' },
  { id: 'cis-controls', name: 'CIS Controls', category: 'SaaS & Cloud', region: 'Global', progress: 70, statusText: 'IG2 implementation underway across endpoint fleet.' },
  { id: 'dora', name: 'DORA', category: 'SaaS & Cloud', region: 'EU', progress: 30, statusText: 'ICT risk and resilience testing controls pending.' },

  { id: 'gdpr', name: 'GDPR', category: 'AI & Data Privacy', region: 'EU', progress: 60, statusText: 'Data mapping incomplete for downstream processors.' },
  { id: 'ccpa', name: 'CCPA', category: 'AI & Data Privacy', region: 'US', progress: 75, statusText: 'Consumer request workflow automation in rollout.' },
  { id: 'eu-ai-act', name: 'EU AI Act', category: 'AI & Data Privacy', region: 'EU', progress: 20, statusText: 'High-risk AI classification and controls not finalized.' },
  { id: 'nist-ai-rmf', name: 'NIST AI RMF', category: 'AI & Data Privacy', region: 'US', progress: 50, statusText: 'Govern and Measure functions partially implemented.' },
  { id: 'iso-42001', name: 'ISO 42001', category: 'AI & Data Privacy', region: 'Global', progress: 15, statusText: 'AIMS scope and AI policy baseline under definition.' },

  { id: 'ce-marking', name: 'CE Marking', category: 'Hardware & Manufacturing', region: 'EU', progress: 90, statusText: 'Technical file complete; declaration update pending.' },
  { id: 'fcc-part-15', name: 'FCC Part 15', category: 'Hardware & Manufacturing', region: 'US', progress: 100, statusText: 'EMC test certification approved and published.' },
  { id: 'rohs', name: 'RoHS', category: 'Hardware & Manufacturing', region: 'Global', progress: 80, statusText: 'Supplier material declarations pending final sign-off.' },
  { id: 'iso-9001', name: 'ISO 9001', category: 'Hardware & Manufacturing', region: 'Global', progress: 100, statusText: 'QMS audits passed with no major non-conformities.' },
  { id: 'osha', name: 'OSHA', category: 'Hardware & Manufacturing', region: 'US', progress: 95, statusText: 'Incident response drill evidence queued for closure.' },

  { id: 'hipaa', name: 'HIPAA', category: 'Healthcare & MedTech', region: 'US', progress: 100, statusText: 'ePHI boundaries secured. Fully compliant.' },
  { id: 'hitrust', name: 'HITRUST', category: 'Healthcare & MedTech', region: 'Global', progress: 40, statusText: 'Control inheritance mapping to cloud stack in progress.' },
  { id: 'eu-mdr', name: 'EU MDR', category: 'Healthcare & MedTech', region: 'EU', progress: 10, statusText: 'Clinical evaluation report and PMS plan incomplete.' },
  { id: 'fda-21-cfr-part-11', name: 'FDA Title 21 CFR Part 11', category: 'Healthcare & MedTech', region: 'US', progress: 65, statusText: 'Audit trails validated; e-signature SOP updates required.' },

  { id: 'pci-dss', name: 'PCI-DSS', category: 'Financial & FinTech', region: 'Global', progress: 88, statusText: 'Quarterly ASV scans complete, pen test remediation open.' },
  { id: 'sox', name: 'SOX', category: 'Financial & FinTech', region: 'US', progress: 95, statusText: 'ITGC walkthroughs complete; final control attestation due.' },
  { id: 'psd2', name: 'PSD2', category: 'Financial & FinTech', region: 'EU', progress: 70, statusText: 'SCA exception monitoring dashboard under deployment.' },
  { id: 'rbi-digital-payments', name: 'RBI Digital Payment Guidelines', category: 'Financial & FinTech', region: 'India', progress: 85, statusText: 'Payment settlement audit checks in final UAT.' },

  { id: 'csrd', name: 'CSRD', category: 'ESG & Corporate', region: 'EU', progress: 25, statusText: 'Double materiality assessment and data model pending.' },
  { id: 'tcfd', name: 'TCFD', category: 'ESG & Corporate', region: 'Global', progress: 40, statusText: 'Scenario analysis model and disclosure controls incomplete.' },
  { id: 'iso-14001', name: 'ISO 14001', category: 'ESG & Corporate', region: 'Global', progress: 60, statusText: 'Environmental aspect register updates in progress.' },
];

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');
const barClass = (progress) => {
  if (progress === 100) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-indigo-600';
  return 'bg-amber-500';
};

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

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 1200 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function FrameworksPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = useMemo(() => {
    if (activeCategory === 'All') return FRAMEWORKS;
    return FRAMEWORKS.filter((fw) => fw.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Framework Mapping</h1>
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-[0.08em] uppercase border transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((fw) => (
          <TiltCard key={fw.id} className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50">
            <Link
              to={`/dashboard/frameworks/${slug(fw.name)}`}
              className="block rounded-2xl p-4 transition-colors hover:bg-white/80"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{fw.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {fw.region}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] tracking-[0.12em] uppercase text-slate-500">{fw.category}</p>
                <p className="text-xs font-bold text-slate-700">{fw.progress}%</p>
              </div>
              <div className="mt-1.5 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barClass(fw.progress)}`} style={{ width: `${fw.progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">{fw.statusText}</p>
            </Link>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
