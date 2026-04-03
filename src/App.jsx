import React from 'react';
import { Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import PremiumCursor from './components/ui/PremiumCursor';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Sun, Moon, Menu, Plus, Search,
  Download, FileText
} from 'lucide-react';
import { pageTransition } from './utils/motion';

import { ProjectProvider, useProject } from './context/ProjectContext';
import Sidebar from './components/Sidebar';
import NotificationCenter from './components/NotificationCenter';
import ProfileMenu from './components/ProfileMenu';
import AuthView from './components/AuthView';
import FeatureModal from './components/FeatureModal';

// View imports
import ListView from './components/ListView';
import BoardView from './components/BoardView';
import TimelineView from './components/TimelineView';
import DashboardView from './components/DashboardView';
import InsightsView from './components/InsightsView';
import ComplianceView from './components/ComplianceView';
import CalendarView from './components/CalendarView';
import TrustCenterView from './components/TrustCenterView';
import SettingsView from './components/SettingsView';
import EnterpriseSettings from './pages/EnterpriseSettings';
import SpacesPage from './pages/SpacesPage';
import FrameworksPage from './pages/FrameworksPage';
import FrameworkDetailPage from './pages/FrameworkDetailPage';
import ProfilePage from './pages/ProfilePage';
import AuditLogView from './components/AuditLogView';
import LandingPage from './pages/LandingPage';
import VaultPage from './pages/VaultPage';
import OAuthCallback from './pages/OAuthCallback';
import useWebSocket from './hooks/useWebSocket';
import SystemHealthPage from './pages/SystemHealthPage';
import BillingPage from './pages/BillingPage';
import CookieConsent from './components/ui/CookieConsent';
import Security from './pages/Security';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Features from './pages/Features';
import About from './pages/About';
import DataProcessing from './pages/DataProcessing';
import Governance from './pages/platform/Governance';
import Prioritization from './pages/platform/Prioritization';
import Enterprise from './pages/solutions/Enterprise';
import CompanyAbout from './pages/company/About';
import Clients from './pages/dashboard/Clients';
import Inbox from './pages/dashboard/Inbox';

const CRM_NAV_ITEMS = [
  { id: 'clients', label: 'Clients', path: '/dashboard/clients' },
  { id: 'inbox', label: 'Inbox', path: '/dashboard/inbox' },
];

function isCrmNavActive(pathname, itemPath) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const {
    currentUser, isDarkMode, setIsDarkMode,
    searchQuery, setSearchQuery,
    sortOption, setSortOption,
    highRiskCount,
    isModalOpen, openNewFeatureModal,
    exportFeaturesCSV, exportFeaturesPDF,
  } = useProject();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { isConnected: isLiveConnected, isAuditRunning } = useWebSocket(!!currentUser);
  const isEngineer = currentUser?.role === 'Engineer';
  const planTier = currentUser?.planTier || 'Seed';
  const subscriptionStatus = (currentUser?.subscriptionStatus || 'active').toLowerCase();

  // --- Auth Gate ---
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* ==== Sidebar ==== */}
      <Sidebar sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} highRiskCount={highRiskCount} />

      {/* ==== Main Content ==== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-8 min-h-[3.5rem]">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="shrink-0 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <Link to="/dashboard/list" className="flex min-w-0 shrink-0 items-center gap-2 text-indigo-700">
                  <Network size={20} className="shrink-0" />
                  <span className="hidden truncate font-black text-xs uppercase tracking-[0.2em] sm:inline">Cynapse Enterprise</span>
                </Link>
                <div className="hidden items-center gap-2 sm:flex shrink-0">
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">{planTier}</span>
                  {subscriptionStatus !== 'canceled' && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                        subscriptionStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : subscriptionStatus === 'past_due'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {subscriptionStatus.replace('_', ' ')}
                    </span>
                  )}
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                      isAuditRunning
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isLiveConnected
                          ? 'border-slate-200 bg-slate-100 text-slate-600'
                          : 'border-rose-200 bg-rose-50 text-rose-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isAuditRunning ? 'animate-pulse bg-emerald-500' : isLiveConnected ? 'bg-slate-400' : 'bg-rose-500'}`}
                    />
                    Live
                  </span>
                </div>
                <div className="relative min-h-[2.5rem] min-w-0 w-full flex-1 basis-[200px] sm:max-w-md md:max-w-lg lg:max-w-xl">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="Search initiatives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-full w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {/* Sort */}
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="hidden sm:block text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none cursor-pointer font-bold transition-all">
                <option value="rice">RICE ↓</option>
                <option value="status">Status</option>
              </select>

              {/* Actions */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={exportFeaturesCSV} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-700 transition-all" title="Export CSV">
                  <Download size={16} />
                </button>
                <button onClick={exportFeaturesPDF} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-700 transition-all" title="Export PDF">
                  <FileText size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-700 transition-all" title="Toggle Dark Mode">
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>

              {/* Notifications */}
              <NotificationCenter />

              {/* New Feature Button */}
              {!isEngineer && (
                <button onClick={openNewFeatureModal} className="hidden sm:flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-100">
                  <Plus size={16} /> New
                </button>
              )}

              <ProfileMenu />
              </div>
            </div>

            <div
              className="w-full border-t border-slate-100 bg-slate-50/40 px-2 py-2 sm:px-6"
              data-testid="crm-top-nav"
            >
              <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-start gap-1.5" aria-label="CRM">
                <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
                  {CRM_NAV_ITEMS.map((item) => {
                    const active = isCrmNavActive(location.pathname, item.path);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className="relative min-h-[2.25rem] min-w-[5.5rem] px-4 py-2 text-center text-[11px] font-extrabold sm:text-xs"
                      >
                        <span className={`relative z-10 ${active ? 'text-indigo-900' : 'text-slate-600 hover:text-indigo-800'}`}>{item.label}</span>
                        {active && (
                          <motion.div
                            layoutId="crm-nav-pill"
                            className="absolute inset-0 rounded-xl border border-indigo-100 bg-indigo-50/95 shadow-inner"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <AnimatedOutlet />
          </div>
        </main>
      </div>

      {/* ==== Feature Modal (global overlay) ==== */}
      {isModalOpen && <FeatureModal />}
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const showPremiumCursor = location.pathname === '/';

  return (
    <>
      {showPremiumCursor && <PremiumCursor />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/platform/governance" element={<Governance />} />
        <Route path="/platform/prioritization" element={<Prioritization />} />
        <Route path="/solutions/enterprise" element={<Enterprise />} />
        <Route path="/company/about" element={<CompanyAbout />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/data-processing" element={<DataProcessing />} />
        <Route path="/security" element={<Security />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<Navigate to="list" replace />} />
          <Route path="overview" element={<Navigate to="/dashboard/clients" replace />} />
          <Route path="projects" element={<Navigate to="/dashboard/clients" replace />} />
          <Route path="clients" element={<Clients />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="list" element={<ListView />} />
          <Route path="board" element={<BoardView />} />
          <Route path="timeline" element={<TimelineView />} />
          <Route path="home" element={<DashboardView />} />
          <Route path="insights" element={<InsightsView />} />
          <Route path="compliance" element={<ComplianceView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="trustcenter" element={<TrustCenterView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="account" element={<EnterpriseSettings />} />
          <Route path="enterprise-settings" element={<EnterpriseSettings />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="frameworks" element={<FrameworksPage />} />
          <Route path="frameworks/:frameworkId" element={<FrameworkDetailPage />} />
          <Route path="vault" element={<VaultPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="auditlog" element={<AuditLogView />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="*" element={<Navigate to="/dashboard/list" replace />} />
        </Route>

        <Route path="/board" element={<Navigate to="/dashboard/board" replace />} />
        <Route path="/timeline" element={<Navigate to="/dashboard/timeline" replace />} />
        <Route path="/insights" element={<Navigate to="/dashboard/insights" replace />} />
        <Route path="/compliance" element={<Navigate to="/dashboard/compliance" replace />} />
        <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
        <Route path="/trustcenter" element={<Navigate to="/dashboard/trustcenter" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/account" element={<Navigate to="/dashboard/account" replace />} />
        <Route path="/enterprise-settings" element={<Navigate to="/dashboard/enterprise-settings" replace />} />
        <Route path="/spaces" element={<Navigate to="/dashboard/spaces" replace />} />
        <Route path="/frameworks" element={<Navigate to="/dashboard/frameworks" replace />} />
        <Route path="/vault" element={<Navigate to="/dashboard/vault" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/auditlog" element={<Navigate to="/dashboard/auditlog" replace />} />
        <Route path="/system-health" element={<Navigate to="/dashboard/system-health" replace />} />
        <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <CookieConsent />
      <AppRoutes />
    </ProjectProvider>
  );
}