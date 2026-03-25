import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List, Columns3, CalendarRange, LayoutDashboard, TrendingUp,
  ShieldCheck, Globe, ScrollText, Network, Compass, BookOpenCheck, Database, Settings, Activity
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

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

export default function Sidebar({ sidebarOpen = true, highRiskCount = 0 }) {
  const { currentUser } = useProject();
  const [hoveredItem, setHoveredItem] = useState(null);

  const visibleBottomNav = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass shrink-0 hidden lg:flex flex-col relative z-30 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRight: '1px solid rgba(226, 232, 240, 0.6)',
          }}
        >
          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse at 30% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)
            `
          }} />

          {/* ── Brand Header ── */}
          <div className="px-6 py-8 relative z-10">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                whileHover={{ scale: 1.08, rotateY: 12 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #24389c, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Network size={20} className="text-white" />
              </motion.div>
              <div>
                <div className="text-lg font-black gradient-text tracking-tighter leading-none font-['Manrope',_sans-serif]">CYNAPSE</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Enterprise</div>
              </div>
            </motion.div>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar pt-2 relative z-10 flex flex-col">
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-4 mb-3">Core Work</div>
            {TOP_NAV_ITEMS.map((item, index) => (
              <motion.div
                key={item.to}
                custom={index}
                variants={navItemVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                onHoverStart={() => setHoveredItem(item.to)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <NavLink
                  to={item.to}
                  end={item.to === '/dashboard/list'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                      isActive
                        ? 'text-[#24389c] dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-[#191c1e] dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active background indicator */}
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

                      {/* Hover glow */}
                      {hoveredItem === item.to && !isActive && (
                        <motion.div
                          layoutId="hoverNavBg"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: 'rgba(248, 250, 252, 0.8)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        />
                      )}

                      <item.icon size={18} className={`shrink-0 relative z-10 transition-colors duration-200 ${isActive ? 'text-[#24389c]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="truncate relative z-10">{item.label}</span>
                      {item.badgeKey === 'compliance' && highRiskCount > 0 && (
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
              </motion.div>
            ))}
            <div className="mt-auto pt-4">
              <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-4 mb-2">Utility</div>
              {visibleBottomNav.map((item, index) => (
                <motion.div
                  key={item.to}
                  custom={TOP_NAV_ITEMS.length + index}
                  variants={navItemVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  onHoverStart={() => setHoveredItem(item.to)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                        isActive
                          ? 'text-[#24389c] dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-900/30'
                          : 'text-slate-500 dark:text-slate-400 hover:text-[#191c1e] dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon size={18} className="shrink-0 relative z-10 text-slate-400 group-hover:text-slate-600" />
                    <span className="truncate relative z-10">{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* ── Footer ── */}
          <div className="p-6 relative z-10">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl p-4 glass-card"
            >
              <div className="text-[10px] font-bold gradient-text mb-1">SOVEREIGN ARCHITECT</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                System Instance v3.4.1
              </div>
            </motion.div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
