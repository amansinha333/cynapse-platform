import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  ShieldCheck,
  Activity,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import Logo, { LOGO_CLASS } from './ui/Logo';

/* ── 3D Tilt Card component ── */
function TiltCard({ children, className = '', glowColor = 'rgba(99, 102, 241, 0.15)' }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-150, 150], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`perspective-container ${className}`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        boxShadow: `0 20px 60px ${glowColor}, 0 0 80px ${glowColor}`,
      }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

const ComplianceDashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const citations = [
    { title: "EU AI Act", severity: "High", status: "Compliant" },
    { title: "GDPR (Art. 35)", severity: "High", status: "Processing" },
    { title: "ISO/IEC 42001", severity: "Medium", status: "Compliant" },
    { title: "NIST AI RMF", severity: "Low", status: "Processing" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <motion.div
      className="min-h-screen text-[#191c1e] font-['Inter',_sans-serif] p-6 md:p-10 mesh-gradient"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-center mb-12">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
            <Sparkles size={10} className="text-indigo-500" /> Project Monitor
          </p>
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl font-extrabold tracking-tight font-['Manrope',_sans-serif]">
            <Logo className={LOGO_CLASS.marketing} />
            <span className="text-slate-300 font-light">|</span>
            <span className="text-slate-600 dark:text-slate-300">Sovereign Architect</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm font-medium text-[#24389c] hover:bg-white/80 rounded-xl transition-all glass-card"
          >
            Export Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(99, 102, 241, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #24389c, #6366f1, #8b5cf6)' }}
          >
            Run Audit
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Risk Score Summary Card */}
        <motion.section variants={itemVariants}>
          <TiltCard glowColor="rgba(16, 185, 129, 0.12)">
            <div className="glass-card rounded-2xl p-8 flex items-center justify-between relative overflow-hidden group">
              {/* Animated gradient orb */}
              <motion.div
                className="absolute top-0 right-0 w-72 h-72 rounded-full -mr-24 -mt-24"
                style={{
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="text-[#24389c]" size={20} />
                  Overall Risk Score
                </h2>
                <p className="text-slate-500 text-sm max-w-sm">
                  Your platform currently maintains an optimal compliance posture.
                  No high-severity breaches detected in the last 24 hours.
                </p>
              </div>

              <div className="relative z-10 text-right">
                <div className="inline-flex items-baseline gap-1">
                  <motion.span
                    className="text-7xl font-black font-['Manrope',_sans-serif]"
                    style={{ background: 'linear-gradient(135deg, #24389c, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, type: 'spring' }}
                  >
                    18
                  </motion.span>
                  <span className="text-2xl text-slate-300 font-bold">/100</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 uppercase tracking-wider glow-emerald"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    ringColor: 'rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <CheckCircle2 size={12} /> Optimal Status
                </motion.div>
              </div>
            </div>
          </TiltCard>
        </motion.section>

        {/* Node panels */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Node 1 */}
          <TiltCard glowColor="rgba(99, 102, 241, 0.12)">
            <motion.div
              className="glass-card rounded-2xl p-6 h-full"
              onHoverStart={() => setHoveredCard('node1')}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <div className="flex justify-between items-start mb-6">
                <motion.div
                  animate={hoveredCard === 'node1' ? { rotateY: 12, scale: 1.05 } : { rotateY: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08))',
                  }}
                >
                  <Activity size={24} className="text-[#24389c]" />
                </motion.div>
                <span className="text-xs font-bold text-emerald-600 px-2 py-1 rounded-md" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>ACTIVE</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Node 1: Internal Auth</h3>
              <p className="text-slate-500 text-sm mb-6">Cross-tenant authentication and permission validation cycles.</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100/60 dark:border-slate-700/40">
                <span className="text-sm text-slate-400">99.9% Uptime</span>
                <motion.button
                  whileHover={{ x: 4 }}
                  className="text-[#24389c] text-sm font-bold flex items-center gap-1"
                >
                  Details <ChevronRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          </TiltCard>

          {/* Node 2 */}
          <TiltCard glowColor="rgba(245, 158, 11, 0.1)">
            <motion.div
              className="glass-card rounded-2xl p-6 h-full"
              onHoverStart={() => setHoveredCard('node2')}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <div className="flex justify-between items-start mb-6">
                <motion.div
                  animate={hoveredCard === 'node2' ? { rotateY: 12, scale: 1.05 } : { rotateY: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.06))',
                  }}
                >
                  <Globe size={24} className="text-amber-600" />
                </motion.div>
                <span className="text-xs font-bold text-amber-600 px-2 py-1 rounded-md" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>PROCESSING</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Node 2: Global Intel</h3>
              <p className="text-slate-500 text-sm mb-6">External regulatory feed ingestion and risk vector mapping.</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100/60 dark:border-slate-700/40">
                <span className="text-sm text-slate-400">Last Sync: 2m ago</span>
                <motion.button
                  whileHover={{ x: 4 }}
                  className="text-slate-600 text-sm font-bold flex items-center gap-1"
                >
                  Monitor <ArrowUpRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          </TiltCard>
        </motion.div>

        {/* Legal Citations Table */}
        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-2xl p-1 overflow-hidden">
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-[15px] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight">Legal Citations & Severity</h3>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  className="text-xs font-bold text-slate-400 hover:text-[#24389c] transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50/50"
                >
                  VIEW FULL REGISTRY
                </motion.button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                      <th className="px-4 pb-2">Citation Source</th>
                      <th className="px-4 pb-2">Severity Impact</th>
                      <th className="px-4 pb-2">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citations.map((cite, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.4 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className="group cursor-pointer"
                      >
                        <td className="px-4 py-4 font-bold text-sm glass-card rounded-l-xl">
                          {cite.title}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                            cite.severity === 'High' ? 'bg-red-50 text-red-600' :
                            cite.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                            <AlertTriangle size={10} /> {cite.severity}
                          </div>
                        </td>
                        <td className="px-4 py-4 rounded-r-xl">
                          <div className="flex items-center gap-2">
                            {cite.status === 'Compliant' ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <Clock size={16} className="text-amber-500" />
                            )}
                            <span className={`text-sm font-semibold ${cite.status === 'Compliant' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {cite.status}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ComplianceDashboard;
