import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Globe, Building2, Brain, FileCheck, CheckCircle2,
  AlertTriangle, Clock
} from 'lucide-react';
import { staggerContainer, easings, springs } from '../utils/motion';

const DEFAULT_GATES = [
  { id: 'data-residency',   label: 'Data Residency',    icon: Globe,      status: 'pass' },
  { id: 'vendor-clearance',  label: 'Vendor Clearance',  icon: Building2,  status: 'pass' },
  { id: 'encryption',        label: 'Encryption',        icon: Lock,       status: 'pass' },
  { id: 'ai-governance',     label: 'AI Governance',     icon: Brain,      status: 'pending' },
  { id: 'regulatory',        label: 'Regulatory',        icon: FileCheck,  status: 'fail' },
  { id: 'final-sign-off',    label: 'Final Sign-Off',    icon: Shield,     status: 'pending' },
];

const STATUS_STYLES = {
  pass: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    connector: 'bg-emerald-400',
  },
  fail: {
    dot: 'bg-rose-500',
    border: 'border-rose-200 dark:border-rose-800',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    icon: AlertTriangle,
    iconColor: 'text-rose-500 dark:text-rose-400',
    connector: 'bg-rose-400',
  },
  pending: {
    dot: 'bg-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
    iconColor: 'text-amber-500 dark:text-amber-400',
    connector: 'bg-slate-200 dark:bg-slate-700',
  },
};

const gateVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  show: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: easings.outExpo,
    },
  }),
};

const connectorVariants = {
  hidden: { scaleX: 0 },
  show: (i) => ({
    scaleX: 1,
    transition: {
      delay: i * 0.08 + 0.15,
      duration: 0.35,
      ease: easings.outExpo,
    },
  }),
};

export default function GateStatusBar({ gates = DEFAULT_GATES, compact = false }) {
  const passCount = gates.filter(g => g.status === 'pass').length;
  const allPass = passCount === gates.length;

  return (
    <motion.div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm ${compact ? 'p-3' : 'p-4'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easings.outExpo }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${allPass ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
            <Shield size={14} className={allPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'} />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Compliance Gates</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          allPass
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          {passCount}/{gates.length} Cleared
        </span>
      </div>

      {/* Gate Pipeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {gates.map((gate, i) => {
          const style = STATUS_STYLES[gate.status] || STATUS_STYLES.pending;
          const StatusIcon = style.icon;
          const GateIcon = gate.icon;
          const isLast = i === gates.length - 1;

          return (
            <React.Fragment key={gate.id}>
              <motion.div
                custom={i}
                variants={gateVariants}
                initial="hidden"
                animate="show"
                whileHover={{ y: -3, scale: 1.04 }}
                transition={springs.gentle}
                className={`relative flex flex-col items-center min-w-[80px] ${compact ? 'min-w-[68px]' : ''}`}
              >
                {/* Gate Node */}
                <div className={`w-10 h-10 rounded-xl border-2 ${style.border} ${style.bg} flex items-center justify-center relative`}>
                  <GateIcon size={16} className={style.iconColor} />
                  {/* Status indicator dot */}
                  <motion.span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${style.bg} border ${style.border} flex items-center justify-center`}
                  >
                    <StatusIcon size={10} className={style.iconColor} />
                  </motion.span>
                  {/* Pulsing ring for pass */}
                  {gate.status === 'pass' && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-emerald-400 dark:border-emerald-600"
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.25 }}
                      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  {/* Shake for fail */}
                  {gate.status === 'fail' && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-rose-400 dark:border-rose-600"
                      animate={{ opacity: [0.5, 0.15, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                {/* Label */}
                <span className={`mt-1.5 text-[10px] font-semibold text-center leading-tight ${style.text}`}>
                  {gate.label}
                </span>
              </motion.div>

              {/* Connector line */}
              {!isLast && (
                <motion.div
                  custom={i}
                  variants={connectorVariants}
                  initial="hidden"
                  animate="show"
                  className={`h-0.5 flex-1 min-w-[16px] origin-left ${
                    gate.status === 'pass' ? style.connector : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{ marginTop: '-18px' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}
