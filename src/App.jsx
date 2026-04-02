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
  const { isConnected: isLiveConnected, isAuditRunning } = useWebSocket();
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
        {/* Top Nav Bar */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between px-8 h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 lg:hidden transition-colors">
                <Menu size={20} />
              </button>
              <Link to="/dashboard/list" className="flex items-center gap-2.5 text-indigo-700 font-black text-xs tracking-[0.2em] uppercase">
                <Network size={20} />
                <span className="hidden md:inline">Cynapse Enterprise</span>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {planTier}
                </span>
                {subscriptionStatus !== 'canceled' && (
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    subscriptionStatus === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : subscriptionStatus === 'past_due'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {subscriptionStatus.replace('_', ' ')}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
                  isAuditRunning
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isLiveConnected
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAuditRunning ? 'bg-emerald-500 animate-pulse' : isLiveConnected ? 'bg-slate-400' : 'bg-rose-500'}`} />
                  Live
                </span>
              </div>
            </div>

            {/* Center — Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-700 transition-colors" size={16} />
                <input
                  type="text" placeholder="Search initiatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 bg-transparent text-sm text-slate-900 outline-none border-b border-transparent focus:border-indigo-700 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
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
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<Navigate to="list" replace />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppRoutes />
    </ProjectProvider>
  );
}