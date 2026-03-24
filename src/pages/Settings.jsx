import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Shield, CreditCard, Camera, Save,
  Key, Eye, EyeOff, ChevronRight, Sparkles
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import SubscriptionCard from '../components/SubscriptionCard';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsHub() {
  const {
    currentUser,
    globalApiKey, setGlobalApiKey,
    pineconeKey, setPineconeKey,
    serpapiKey, setSerpapiKey,
  } = useProject();

  const [activeTab, setActiveTab] = useState('profile');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showPineconeKey, setShowPineconeKey] = useState(false);
  const [showSerpapiKey, setShowSerpapiKey] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.name || '',
    bio: '',
    role: currentUser?.role || 'Product Manager',
    email: 'user@cynapse.io',
    timezone: 'Asia/Kolkata (IST)',
  });

  const handleProfileChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <div className="max-w-5xl mx-auto mesh-gradient min-h-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5 mb-1">
          <Sparkles size={10} className="text-indigo-500" /> Account Settings
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight font-['Manrope',_sans-serif]">
          <span className="gradient-text">Settings Hub</span>
        </h1>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-8 glass-card rounded-xl p-1.5 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #24389c, #6366f1)' } : {}}
            >
              <Icon size={16} />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══════ PROFILE TAB ═══════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <User size={20} className="text-indigo-500" /> Profile Management
              </h3>

              <div className="flex items-start gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 8 }}
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #24389c, #6366f1, #8b5cf6)' }}
                  >
                    {profileData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-200 dark:border-slate-700"
                  >
                    <Camera size={14} className="text-slate-500" />
                  </motion.button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Display Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={profileData.displayName}
                      onChange={handleProfileChange}
                      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Role</label>
                    <select
                      name="role"
                      value={profileData.role}
                      onChange={handleProfileChange}
                      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option>Chief Product Officer (CPO)</option>
                      <option>Product Manager</option>
                      <option>Compliance Officer</option>
                      <option>Engineer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Timezone</label>
                    <input
                      type="text"
                      name="timezone"
                      value={profileData.timezone}
                      onChange={handleProfileChange}
                      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bio</label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      rows={3}
                      placeholder="Tell your team a bit about yourself..."
                      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #24389c, #6366f1)' }}
                >
                  <Save size={16} /> Save Profile
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══════ SECURITY TAB ═══════ */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Key size={20} className="text-indigo-500" /> API Key Management
              </h3>
              <p className="text-sm text-slate-500 mb-6">Manage your API keys securely. Keys are stored locally in your browser and never sent to our servers.</p>

              <div className="space-y-5">
                {/* Gemini Key */}
                <motion.div variants={itemVariants} className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/40" style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Google Gemini API Key</h4>
                        <p className="text-[10px] text-slate-400">Powers AI audit analysis</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${globalApiKey ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {globalApiKey ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={globalApiKey}
                      onChange={(e) => setGlobalApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono pr-10 transition-all"
                    />
                    <button
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* Pinecone Key */}
                <motion.div variants={itemVariants} className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/40" style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pinecone API Key</h4>
                        <p className="text-[10px] text-slate-400">Vector database for RAG</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pineconeKey ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {pineconeKey ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPineconeKey ? 'text' : 'password'}
                      value={pineconeKey}
                      onChange={(e) => setPineconeKey(e.target.value)}
                      placeholder="pcsk_..."
                      className="w-full bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono pr-10 transition-all"
                    />
                    <button
                      onClick={() => setShowPineconeKey(!showPineconeKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPineconeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* SerpAPI Key */}
                <motion.div variants={itemVariants} className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/40" style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Key size={14} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">SerpAPI Key</h4>
                        <p className="text-[10px] text-slate-400">Web intelligence scanning</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${serpapiKey ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {serpapiKey ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSerpapiKey ? 'text' : 'password'}
                      value={serpapiKey}
                      onChange={(e) => setSerpapiKey(e.target.value)}
                      placeholder="Secret Token"
                      className="w-full bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono pr-10 transition-all"
                    />
                    <button
                      onClick={() => setShowSerpapiKey(!showSerpapiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showSerpapiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══════ BILLING TAB ═══════ */}
        {activeTab === 'billing' && (
          <motion.div variants={itemVariants}>
            <SubscriptionCard />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
