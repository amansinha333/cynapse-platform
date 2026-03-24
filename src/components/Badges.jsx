import React from 'react';
import { CheckCircle, Clock, ShieldAlert } from 'lucide-react';

export const ComplianceBadge = ({ status }) => {
  const styles = { 
    'Approved': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', 
    'Pending': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', 
    'Blocked': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400', 
    'Approved (Node 1)': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
  };
  const icons = { 
    'Approved': <CheckCircle size={10} />, 
    'Approved (Node 1)': <CheckCircle size={10} />, 
    'Pending': <Clock size={10} />, 
    'Blocked': <ShieldAlert size={10} /> 
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm shadow-black/5 ${styles[status] || styles['Pending']}`}>
      {icons[status] || icons['Pending']} {status}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const colors = { 
    'Discovery': 'bg-indigo-50 dark:bg-indigo-900/30 text-[#24389c] dark:text-indigo-400', 
    'Validation': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', 
    'Ready': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', 
    'Delivery': 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400', 
    'Blocked': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' 
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border-none shadow-sm shadow-black/5 ${colors[status] || 'bg-slate-100 dark:bg-slate-800'}`}>{status}</span>;
};
