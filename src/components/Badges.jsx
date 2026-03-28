import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, ShieldAlert, Shield } from 'lucide-react';
import { springs } from '../utils/motion';

// ── Compliance Badge (animated) ───────────────────────────────────
// Backwards-compatible: same props API as before ({ status }).
// Now renders with framer-motion for entrance + status-specific effects.

const COMPLIANCE_CONFIG = {
  'Approved': {
    style: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    icon: CheckCircle,
    effect: 'pop',
  },
  'Approved (Node 1)': {
    style: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    icon: CheckCircle,
    effect: 'pop',
  },
  'Pending': {
    style: 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    icon: Clock,
    effect: 'shimmer',
  },
  'Blocked': {
    style: 'bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    icon: ShieldAlert,
    effect: 'pulse',
  },
};

const badgeEntrance = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1, transition: springs.snappy },
  exit:    { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

const iconPop = {
  initial: { scale: 0, rotate: -45 },
  animate: { scale: 1, rotate: 0, transition: { ...springs.bouncy, delay: 0.1 } },
};

export const ComplianceBadge = ({ status }) => {
  const config = COMPLIANCE_CONFIG[status] || COMPLIANCE_CONFIG['Pending'];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        variants={badgeEntrance}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
          text-[10px] font-black uppercase tracking-wider
          shadow-sm shadow-black/5 relative overflow-hidden
          ${config.style}
        `}
      >
        {/* Shimmer overlay for Pending */}
        {config.effect === 'shimmer' && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 33%, rgba(245,158,11,0.12) 50%, transparent 66%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
          />
        )}

        {/* Pulse ring for Blocked */}
        {config.effect === 'pulse' && (
          <motion.span
            className="absolute inset-0 rounded-lg border-2 border-rose-400/40 dark:border-rose-500/30 pointer-events-none"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.span variants={iconPop} initial="initial" animate="animate" className="relative z-10 flex items-center">
          <Icon size={10} />
        </motion.span>
        <span className="relative z-10">{status}</span>
      </motion.span>
    </AnimatePresence>
  );
};

// ── Gate Status Badge (new) ───────────────────────────────────────
// For the Hard-Gate Compliance Governance pipeline.
// Pass `passed` boolean to render pass/fail state.

const GATE_STYLES = {
  pass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  fail: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
};

export const GateBadge = ({ label, passed, pending: isPending }) => {
  const state = isPending ? 'pending' : passed ? 'pass' : 'fail';
  const Icon = state === 'pass' ? CheckCircle : state === 'fail' ? ShieldAlert : Clock;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.snappy}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
        text-[10px] font-bold uppercase tracking-wider
        ${GATE_STYLES[state]}
      `}
    >
      <Icon size={10} />
      {label}
      {state === 'pass' && (
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {state === 'fail' && (
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-rose-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.span>
  );
};

// ── Status Badge (unchanged API, now with subtle entrance) ────────

const STATUS_COLORS = {
  'Discovery':  'bg-indigo-50 dark:bg-indigo-900/30 text-[#24389c] dark:text-indigo-400',
  'Validation': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Ready':      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'Delivery':   'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  'Blocked':    'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

export const StatusBadge = ({ status }) => (
  <motion.span
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    className={`
      px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-[0.1em]
      border-none shadow-sm shadow-black/5
      ${STATUS_COLORS[status] || 'bg-slate-100 dark:bg-slate-800'}
    `}
  >
    {status}
  </motion.span>
);
