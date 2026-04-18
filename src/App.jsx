import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import PremiumCursor from './components/ui/PremiumCursor';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Search } from 'lucide-react';
import { pageTransition } from './utils/motion';

import { ProjectProvider, useProject } from './context/ProjectContext';
import Sidebar from './components/Sidebar';
import Logo, { LOGO_CLASS } from './components/ui/Logo';
import NotificationCenter from './components/NotificationCenter';
import ProfileMenu from './components/ProfileMenu';
import AuthView from './components/AuthView';
import useWebSocket from './hooks/useWebSocket';
import CookieConsent from './components/ui/CookieConsent';

const FeatureModal = React.lazy(() => import('./components/FeatureModal'));
const ListView = React.lazy(() => import('./components/ListView'));
const BoardView = React.lazy(() => import('./components/BoardView'));
const TimelineView = React.lazy(() => import('./components/TimelineView'));
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const InsightsView = React.lazy(() => import('./components/InsightsView'));
const ComplianceView = React.lazy(() => import('./components/ComplianceView'));
const CalendarView = React.lazy(() => import('./components/CalendarView'));
const TrustCenterView = React.lazy(() => import('./components/TrustCenterView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const EnterpriseSettings = React.lazy(() => import('./pages/EnterpriseSettings'));
const SpacesPage = React.lazy(() => import('./pages/SpacesPage'));
const FrameworksPage = React.lazy(() => import('./pages/FrameworksPage'));
const FrameworkDetailPage = React.lazy(() => import('./pages/FrameworkDetailPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AuditLogView = React.lazy(() => import('./components/AuditLogView'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const VaultPage = React.lazy(() => import('./pages/VaultPage'));
const OAuthCallback = React.lazy(() => import('./pages/OAuthCallback'));
const SystemHealthPage = React.lazy(() => import('./pages/SystemHealthPage'));
const BillingPage = React.lazy(() => import('./pages/BillingPage'));
const Security = React.lazy(() => import('./pages/Security'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Features = React.lazy(() => import('./pages/Features'));
const About = React.lazy(() => import('./pages/About'));
const DataProcessing = React.lazy(() => import('./pages/DataProcessing'));
const Governance = React.lazy(() => import('./pages/platform/Governance'));
const Prioritization = React.lazy(() => import('./pages/platform/Prioritization'));
const Enterprise = React.lazy(() => import('./pages/solutions/Enterprise'));
const CompanyAbout = React.lazy(() => import('./pages/company/About'));
const Clients = React.lazy(() => import('./pages/dashboard/Clients'));
const Inbox = React.lazy(() => import('./pages/dashboard/Inbox'));
const Subprocessors = React.lazy(() => import('./pages/Subprocessors'));
const DataProcessingAddendum = React.lazy(() => import('./pages/DataProcessingAddendum'));

const DASHBOARD_TITLE = {
  list: 'Initiatives · List',
  board: 'Initiatives · Board',
  timeline: 'Initiatives · Timeline',
  home: 'Home',
  clients: 'Clients',
  inbox: 'Inbox',
  insights: 'Insights',
  compliance: 'Compliance Hub',
  calendar: 'Calendar',
  trustcenter: 'Trust Center',
  settings: 'Settings',
  account: 'Account',
  'enterprise-settings': 'Enterprise Settings',
  spaces: 'Spaces',
  frameworks: 'Frameworks',
  vault: 'Knowledge Vault',
  profile: 'Profile',
  auditlog: 'Audit Log',
  'system-health': 'System Health',
  billing: 'Billing',
};

function getDashboardPageTitle(pathname) {
  if (pathname.includes('/dashboard/frameworks/') && pathname.split('/').length > 3) {
    return 'Framework detail';
  }
  const seg = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);
  const key = seg[0] || 'list';
  return DASHBOARD_TITLE[key] || (key ? key.replace(/-/g, ' ') : 'Home');
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500" aria-busy="true">
      Loading…
    </div>
  );
}

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
      >
        <Outlet />
      </m.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const {
    currentUser,
    searchQuery, setSearchQuery,
    highRiskCount,
    isModalOpen, openNewFeatureModal,
  } = useProject();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  useWebSocket(!!currentUser);
  const isEngineer = currentUser?.role === 'Engineer';
  const pageTitle = getDashboardPageTitle(location.pathname);

  // --- Auth Gate ---
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fdfb] text-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} highRiskCount={highRiskCount} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center border-b border-emerald-100/90 bg-white/95 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:px-6">
          <div className="flex h-full w-full items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
              <Logo compact className={`${LOGO_CLASS.appMobileCompact} lg:hidden`} />
              <Logo iconOnly className={LOGO_CLASS.iconOnlyDesktopChip} />
              <p className="min-w-0 truncate text-sm font-semibold text-[#042f1f] sm:text-base" aria-live="polite">
                {pageTitle}
              </p>
            </div>

            <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
              <div className="relative min-h-[2.25rem] w-[min(100%,10rem)] min-w-0 sm:w-auto sm:max-w-[220px] md:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-800/40"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Search initiatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-full border border-emerald-100 bg-white/90 py-2 pl-9 pr-3 text-xs text-[#042f1f] outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:text-sm"
                />
              </div>
              <NotificationCenter />
              {!isEngineer && (
                <button
                  type="button"
                  onClick={openNewFeatureModal}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-200/50 transition hover:bg-emerald-700 sm:px-4"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">New</span>
                </button>
              )}
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto bg-[#f4fbf7] p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <AnimatedOutlet />
          </div>
        </main>
      </div>

      {isModalOpen && (
        <Suspense fallback={null}>
          <FeatureModal />
        </Suspense>
      )}
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const showPremiumCursor = location.pathname === '/';

  return (
    <>
      {showPremiumCursor && <PremiumCursor />}
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/subprocessors" element={<Subprocessors />} />
          <Route path="/dpa" element={<DataProcessingAddendum />} />
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
      </Suspense>
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
