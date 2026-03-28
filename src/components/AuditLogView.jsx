import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Filter, Search, Calendar, User, Shield,
  AlertTriangle, Zap, Upload, LogIn, Edit, Trash2, Eye, Download,
  ChevronDown
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { staggerContainer, fadeUp, easings, springs } from '../utils/motion';

const EVENT_ICONS = {
  login:       { icon: LogIn,        color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/40' },
  create:      { icon: Edit,         color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
  update:      { icon: Edit,         color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/40' },
  delete:      { icon: Trash2,       color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/40' },
  override:    { icon: Shield,       color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/40' },
  blocked:     { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/40' },
  upload:      { icon: Upload,       color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-900/40' },
  automation:  { icon: Zap,          color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/40' },
  view:        { icon: Eye,          color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800/50' },
};

const LIVE_EVENT_TYPES = new Set(['blocked', 'automation', 'override']);

const formatDate = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return ''; }
};

const HARDCODED_EVENTS = [
  { id: 'hc-1', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), user: 'Admin Cynapse', role: 'Chief Product Officer (CPO)', type: 'create', message: 'Created feature CYN-101: UPI Payment Gateway Integration' },
  { id: 'hc-2', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), user: 'Compliance Engine', role: 'System', type: 'blocked', message: 'Node 1 Audit BLOCKED CYN-101: RBI Data Localization Violation detected — [RBI_Master_Directions_2018.pdf] Section 3.1' },
  { id: 'hc-3', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'Admin Cynapse', role: 'Chief Product Officer (CPO)', type: 'override', message: 'Manual Compliance Override applied to CYN-102 (GDPR Data Residency Module) with justification: "Engineering review completed"' },
  { id: 'hc-4', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), user: 'Compliance Engine', role: 'System', type: 'automation', message: 'Vendor Hard-Gate triggered: Twilio (Pending Review) blocked CYN-104 per ISO 27001 Control 5.1' },
  { id: 'hc-5', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'Admin Cynapse', role: 'Chief Product Officer (CPO)', type: 'upload', message: 'Uploaded document "System_Architecture_Diagram.png" (2.4 MB) to CYN-103 Document Vault' },
];

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: easings.outExpo },
  }),
};

function AuditRow({ event, index }) {
  const config = EVENT_ICONS[event.type] || EVENT_ICONS.view;
  const Icon = config.icon;
  const isLive = LIVE_EVENT_TYPES.has(event.type);

  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="show"
      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
    >
      <td className="px-4 py-3">
        <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>
          <Icon size={13} />
          {isLive && (
            <motion.span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(event.timestamp)}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[9px] font-bold">
            {event.user ? event.user.charAt(0).toUpperCase() : 'S'}
          </span>
          {event.user || 'System'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{event.type}</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-md">{event.message}</td>
    </motion.tr>
  );
}

export default function AuditLogView() {
  const { auditLog, users } = useProject();
  const [filterUser, setFilterUser] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const mergedLog = useMemo(() => {
    const hcIds = new Set(HARDCODED_EVENTS.map(e => e.id));
    const realWithoutDups = auditLog.filter(e => !hcIds.has(e.id));
    return [...HARDCODED_EVENTS, ...realWithoutDups].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [auditLog]);

  const uniqueUsers = useMemo(() => {
    const names = new Set(mergedLog.map(e => e.user));
    return Array.from(names).sort();
  }, [mergedLog]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(mergedLog.map(e => e.type));
    return Array.from(types).sort();
  }, [mergedLog]);

  const filteredLog = useMemo(() => {
    return mergedLog.filter(event => {
      if (filterUser !== 'all' && event.user !== filterUser) return false;
      if (filterType !== 'all' && event.type !== filterType) return false;
      if (searchQuery && !event.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFrom && new Date(event.timestamp) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1);
        if (new Date(event.timestamp) > to) return false;
      }
      return true;
    });
  }, [mergedLog, filterUser, filterType, searchQuery, dateFrom, dateTo]);

  const hasActiveFilters = filterUser !== 'all' || filterType !== 'all' || searchQuery || dateFrom || dateTo;

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Type', 'Message'];
    const csvRows = [headers.join(',')];
    filteredLog.forEach(e => {
      csvRows.push([
        e.timestamp,
        `"${e.user || 'System'}"`,
        `"${e.role || 'System'}"`,
        e.type,
        `"${String(e.message).replace(/"/g, '""')}"`
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cynapse_audit_log.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easings.outExpo }}
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <motion.div
            className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg"
            whileHover={{ scale: 1.08, rotate: -5 }}
            transition={springs.snappy}
          >
            <ScrollText size={22} className="text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          Global System Audit Log
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Immutable record of all system events — SAP GRC / IBM OpenPages compliant</p>
      </motion.div>

      {/* Collapsible Filters */}
      <motion.div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm mb-4 overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: easings.outExpo }}
      >
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Filter size={14} className="text-indigo-600 dark:text-indigo-400" />
            Filters
            {hasActiveFilters && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-indigo-600"
              />
            )}
          </span>
          <motion.div
            animate={{ rotate: filtersExpanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: easings.standard }}
          >
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: easings.outExpo }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 flex flex-wrap gap-3 items-end border-t border-slate-100 dark:border-slate-700 pt-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Search Events</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400 dark:text-slate-500" size={14} />
                    <input
                      type="text" placeholder="Search messages..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block flex items-center gap-1"><User size={10} /> User</label>
                  <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none">
                    <option value="all">All Users</option>
                    {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block flex items-center gap-1"><Filter size={10} /> Type</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none">
                    <option value="all">All Types</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block flex items-center gap-1"><Calendar size={10} /> From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block flex items-center gap-1"><Calendar size={10} /> To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none" />
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1.5 rounded">{filteredLog.length} / {mergedLog.length} events</span>
                  <button onClick={exportAuditCSV} className="px-3 py-1.5 text-xs font-bold rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-1.5 transition-colors" title="Export Audit Log to CSV">
                    <Download size={14}/> Export CSV
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easings.outExpo }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Event Details</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              <motion.tbody
                key={`${filterUser}-${filterType}-${searchQuery}-${dateFrom}-${dateTo}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="divide-y divide-slate-100 dark:divide-slate-700/50"
              >
                {filteredLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <ScrollText size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">No audit events match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLog.map((event, i) => (
                    <AuditRow key={event.id || i} event={event} index={i} />
                  ))
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </motion.div>
    </>
  );
}
