import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, AlertTriangle, AtSign, Trophy, Zap, Shield } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

// --- Notification Type Config ---
const TYPE_CONFIG = {
  mention:     { icon: AtSign,        bg: 'bg-blue-50 dark:bg-blue-900/40',    iconColor: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-100 dark:border-blue-800/50' },
  audit_fail:  { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/40',     iconColor: 'text-red-600 dark:text-red-400',    border: 'border-red-100 dark:border-red-800/50' },
  audit_pass:  { icon: Shield,        bg: 'bg-emerald-50 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800/50' },
  epic_done:   { icon: Trophy,        bg: 'bg-amber-50 dark:bg-amber-900/40',   iconColor: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-100 dark:border-amber-800/50' },
  auto_assign: { icon: Zap,           bg: 'bg-violet-50 dark:bg-violet-900/40',  iconColor: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800/50' },
  high_pri:    { icon: Zap,           bg: 'bg-orange-50 dark:bg-orange-900/40',  iconColor: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-800/50' },
  system:      { icon: Bell,          bg: 'bg-slate-50 dark:bg-slate-800/50',   iconColor: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-100 dark:border-slate-700/50' },
};

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

export default function NotificationCenter() {
  const { notifications, markNotificationRead: onMarkRead, markAllNotificationsRead: onMarkAllRead, clearAllNotifications: onClearAll } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1 shadow-sm animate-pulse-fast">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell size={14} className="text-indigo-600 dark:text-indigo-400" /> Notifications
              {unreadCount > 0 && <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
            </h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1">
                  <Check size={10} /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={() => { onClearAll(); setIsOpen(false); }} className="text-[10px] font-bold text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1">
                  <Trash2 size={10} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-slate-50 dark:divide-slate-700/50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-400 dark:text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => onMarkRead(notif.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${!notif.read ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.iconColor} border ${config.border}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!notif.read ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">{formatTime(notif.timestamp)}</span>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
