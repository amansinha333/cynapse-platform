import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List, Columns3, CalendarRange, LayoutDashboard, TrendingUp,
  ShieldCheck, Globe, ScrollText, Compass, BookOpenCheck,
  Database, Settings, Activity, ChevronsLeft, CreditCard,
  Users, Inbox as InboxIcon,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { springs, easings } from '../utils/motion';
import Logo, { LOGO_CLASS } from './ui/Logo';

const CRM_NAV_ITEMS = [
  { to: '/dashboard/clients', label: 'Clients', icon: Users },
  { to: '/dashboard/inbox', label: 'Inbox', icon: InboxIcon },
];

const TOP_NAV_ITEMS = [
  { to: '/dashboard/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/list', label: 'Initiatives · List', icon: List },
  { to: '/dashboard/board', label: 'Initiatives · Board', icon: Columns3 },
  { to: '/dashboard/timeline', label: 'Initiatives · Timeline', icon: CalendarRange },
  { to: '/dashboard/spaces', label: 'Spaces', icon: Compass },
  { to: '/dashboard/compliance', label: 'Compliance Hub', icon: ShieldCheck, badgeKey: 'compliance' },
  { to: '/dashboard/frameworks', label: 'Frameworks', icon: BookOpenCheck },
  { to: '/dashboard/vault', label: 'Knowledge Vault', icon: Database },
  { to: '/dashboard/trustcenter', label: 'Trust Center', icon: Globe },
  { to: '/dashboard/insights', label: 'Insights', icon: TrendingUp },
];

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard/auditlog', label: 'Audit Log', icon: ScrollText },
  { to: '/dashboard/system-health', label: 'System Health', icon: Activity },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/enterprise-settings', label: 'Enterprise Settings', icon: Settings, adminOnly: true },
];

const navItemVariants = {
  initial: { x: -8, opacity: 0 },
  animate: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }),
  hover: {
    x: 4,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

function NavTooltip({ label, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -6, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -6, scale: 0.95 }}
          transition={{ duration: 0.15, ease: easings.outExpo }}
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[60] shadow-xl pointer-events-none"
        >
          {label}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItem({ item, index, expanded, hoveredItem, setHoveredItem, highRiskCount }) {
  return (
    <motion.div
      custom={index}
      variants={navItemVariants}
      initial="initial"
      animate="animate"
      whileHover={expanded ? 'hover' : undefined}
      onHoverStart={() => setHoveredItem(item.to)}
      onHoverEnd={() => setHoveredItem(null)}
      className="relative"
    >
      <NavLink
        to={item.to}
        end={item.to === '/dashboard/list'}
        className={({ isActive }) =>
          `flex items-center ${expanded ? 'gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
            isActive
              ? 'text-[#24389c] dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#191c1e] dark:hover:text-slate-200'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div
                layoutId="activeNavBg"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            {hoveredItem === item.to && !isActive && (
              <motion.div
                layoutId="hoverNavBg"
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(241, 245, 249, 0.95)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
            <div className="relative shrink-0 z-10">
              <item.icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-[#24389c]' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {!expanded && item.badgeKey === 'compliance' && highRiskCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white z-20"
                />
              )}
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate relative z-10 overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {expanded && item.badgeKey === 'compliance' && highRiskCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto relative z-10 bg-[#24389c] text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-900/30"
              >
                {highRiskCount}
              </motion.span>
            )}
          </>
        )}
      </NavLink>
      {!expanded && <NavTooltip label={item.label} show={hoveredItem === item.to} />}
    </motion.div>
  );
}

export default function Sidebar({ sidebarOpen = true, onToggle, highRiskCount = 0 }) {
  const { currentUser } = useProject();
  const [hoveredItem, setHoveredItem] = useState(null);

  const visibleBottomNav = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 64 }}
      transition={{ duration: 0.3, ease: easings.outExpo }}
      className="glass shrink-0 hidden lg:flex flex-col relative z-30 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        borderRight: '1px solid #e2e8f0',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(148, 163, 184, 0.12) 0%, transparent 55%)',
        }}
      />

      {/* Brand Header — centered when expanded */}
      <div
        className={`${
          sidebarOpen ? 'px-3' : 'px-0'
        } flex w-full justify-center py-8 relative z-10 transition-[padding] duration-300`}
      >
        <motion.div
          className="flex min-h-8 w-full max-w-full items-center justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="full"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: easings.outExpo }}
                className="flex min-h-8 w-full max-w-full items-center justify-center overflow-visible"
              >
                <Logo className={LOGO_CLASS.sidebarExpanded} />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2, ease: easings.outExpo }}
                className="flex shrink-0 items-center justify-center"
              >
                <Logo className={LOGO_CLASS.iconOnlySidebar} iconOnly />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${sidebarOpen ? 'px-4' : 'px-2'} space-y-0.5 overflow-y-auto custom-scrollbar pt-2 relative z-10 flex flex-col transition-[padding] duration-300`}>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-indigo-500/95 uppercase tracking-widest px-4 mb-2"
          >
            CRM hub
          </motion.div>
        )}
        {CRM_NAV_ITEMS.map((item, index) => (
          <NavItem
            key={item.to}
            item={item}
            index={index}
            expanded={sidebarOpen}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
            highRiskCount={highRiskCount}
          />
        ))}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-4 mt-4 mb-3"
          >
            Workspace
          </motion.div>
        )}
        {TOP_NAV_ITEMS.map((item, index) => (
          <NavItem
            key={item.to}
            item={item}
            index={CRM_NAV_ITEMS.length + index}
            expanded={sidebarOpen}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
            highRiskCount={highRiskCount}
          />
        ))}

        <div className="mt-auto pt-4">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-4 mb-2"
              >
                Utility
              </motion.div>
            )}
          </AnimatePresence>
          {visibleBottomNav.map((item, index) => (
            <NavItem
              key={item.to}
              item={item}
              index={CRM_NAV_ITEMS.length + TOP_NAV_ITEMS.length + index}
              expanded={sidebarOpen}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
              highRiskCount={0}
            />
          ))}
        </div>
      </nav>

      {/* Collapse / Expand Toggle */}
      {onToggle && (
        <div className={`${sidebarOpen ? 'px-4' : 'px-2'} py-2 relative z-10 transition-[padding] duration-300`}>
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center ${sidebarOpen ? 'justify-start gap-2 px-4' : 'justify-center'} py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold`}
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={springs.snappy}
            >
              <ChevronsLeft size={16} />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* Footer */}
      <div className={`${sidebarOpen ? 'p-6' : 'p-2 flex justify-center'} relative z-10 transition-[padding] duration-300`}>
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="expanded-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl p-4 glass-card"
            >
              <div className="text-[10px] font-bold gradient-text mb-1">SOVEREIGN ARCHITECT</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                System Instance v3.4.1
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-footer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.gentle}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"
              title="System Instance v3.4.1"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
