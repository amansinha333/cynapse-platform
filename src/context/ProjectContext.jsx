import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BACKEND_URL, INITIAL_FEATURES, DEFAULT_USERS, INITIAL_EPICS } from '../config/constants';
import { checkHealth, fetchFeatures, fetchEpics, fetchVendors, createFeature as apiCreateFeature, updateFeature as apiUpdateFeature, deleteFeatureApi, setAuthToken, setRefreshToken, fetchCurrentUser } from '../utils/api';

const ProjectContext = createContext(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}

export function ProjectProvider({ children }) {
  // =========================================================================
  // CORE STATE
  // =========================================================================
  const [backendStatus, setBackendStatus] = useState(false);
  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_users')) || DEFAULT_USERS; } catch { return DEFAULT_USERS; }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_currentUser')) || null; } catch { return null; }
  });

  const [features, setFeatures] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_features')) || INITIAL_FEATURES; } catch { return INITIAL_FEATURES; }
  });
  const [epics, setEpics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_epics')) || INITIAL_EPICS; } catch { return INITIAL_EPICS; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('rice');

  // --- Settings State ---
  const [globalApiKey, setGlobalApiKey] = useState(() => localStorage.getItem('cynapse_api_key') || '');
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('cynapse_backend_url') || BACKEND_URL);
  const [pineconeKey, setPineconeKey] = useState(() => localStorage.getItem('cynapse_pinecone_key') || '');
  const [serpapiKey, setSerpapiKey] = useState(() => localStorage.getItem('cynapse_serpapi_key') || '');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('cynapse_ai_model') || 'gemini-2.5-flash');
  const [customDocs, setCustomDocs] = useState(() => localStorage.getItem('cynapse_custom_docs') || '');
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_uploaded_files')) || []; } catch { return []; }
  });

  // --- Vendors State ---
  const [vendors, setVendors] = useState(() => {
    try {
      const saved = localStorage.getItem('cynapse_vendors');
      if (saved) return JSON.parse(saved);
      return [
        { id: 'v1', name: 'AWS (Amazon Web Services)', type: 'Cloud Infrastructure', status: 'Approved', risk: 'Low' },
        { id: 'v2', name: 'Twilio', type: 'SMS/Communications', status: 'Pending Review', risk: 'High' },
        { id: 'v3', name: 'Pinecone', type: 'Vector Database', status: 'Approved', risk: 'Medium' },
        { id: 'v4', name: 'OpenAI', type: 'AI Model Provider', status: 'Approved', risk: 'Medium' }
      ];
    } catch { return []; }
  });

  // --- Notifications State ---
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_notifications')) || []; } catch { return []; }
  });

  // --- Audit Log State ---
  const [auditLog, setAuditLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_audit_log')) || []; } catch { return []; }
  });

  // --- UI Preferences ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cynapse_dark_mode')) || false; } catch { return false; }
  });

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // =========================================================================
  // PERSISTENCE (localStorage)
  // =========================================================================
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cynapse_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem('cynapse_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('cynapse_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('cynapse_api_key', globalApiKey); }, [globalApiKey]);
  useEffect(() => { localStorage.setItem('cynapse_backend_url', backendUrl); }, [backendUrl]);
  useEffect(() => { localStorage.setItem('cynapse_pinecone_key', pineconeKey); }, [pineconeKey]);
  useEffect(() => { localStorage.setItem('cynapse_serpapi_key', serpapiKey); }, [serpapiKey]);
  useEffect(() => { localStorage.setItem('cynapse_ai_model', aiModel); }, [aiModel]);
  useEffect(() => { localStorage.setItem('cynapse_custom_docs', customDocs); }, [customDocs]);
  useEffect(() => { localStorage.setItem('cynapse_uploaded_files', JSON.stringify(uploadedFiles)); }, [uploadedFiles]);
  useEffect(() => { localStorage.setItem('cynapse_epics', JSON.stringify(epics)); }, [epics]);
  useEffect(() => { localStorage.setItem('cynapse_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('cynapse_audit_log', JSON.stringify(auditLog)); }, [auditLog]);
  useEffect(() => { localStorage.setItem('cynapse_vendors', JSON.stringify(vendors)); }, [vendors]);
  useEffect(() => { if (features !== INITIAL_FEATURES) localStorage.setItem('cynapse_features', JSON.stringify(features)); }, [features]);

  // --- Backend Sync on Login ---
  useEffect(() => {
    if (!currentUser) return;

    const syncWithBackend = async () => {
      try {
        await checkHealth();
        setBackendStatus(true);

        // Pull features from DB and merge with local
        try {
          const dbFeatures = await fetchFeatures();
          if (dbFeatures.length > 0) {
            setFeatures(prev => {
              const merged = [...prev];
              dbFeatures.forEach(dbFeat => {
                const idx = merged.findIndex(f => f.id === dbFeat.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...dbFeat };
                else merged.push(dbFeat);
              });
              return merged;
            });
          }
        } catch { /* features endpoint may be empty */ }

        // Pull epics from DB
        try {
          const dbEpics = await fetchEpics();
          if (dbEpics.length > 0) setEpics(dbEpics);
        } catch { /* epics may be empty */ }

        // Pull vendors from DB
        try {
          const dbVendors = await fetchVendors();
          if (dbVendors.length > 0) setVendors(dbVendors);
        } catch { /* vendors may be empty */ }

      } catch {
        console.log('Backend offline. Using Local Mode.');
        setBackendStatus(false);
      }
    };

    syncWithBackend();
  }, [currentUser]);

  useEffect(() => {
    const hydrateUser = async () => {
      try {
        const me = await fetchCurrentUser();
        setCurrentUser({
          id: me.id,
          name: me.full_name,
          email: me.email,
          role: me.role,
          status: me.status,
          avatarUrl: me.avatar_url,
          workspaceId: me.workspace_id,
          planTier: me.plan_tier,
          subscriptionStatus: me.subscription_status || 'active'
        });
      } catch {
        // Stale local user without valid JWT should be logged out explicitly.
        setAuthToken(null);
        setRefreshToken(null);
        setCurrentUser(null);
      }
    };
    hydrateUser();
  }, []);

  // =========================================================================
  // NOTIFICATION HELPERS
  // =========================================================================
  const addNotification = useCallback((type, message) => {
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type, message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev.slice(0, 49)]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // =========================================================================
  // AUDIT ENGINE
  // =========================================================================
  const addAuditEvent = useCallback((type, message) => {
    const event = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      role: currentUser?.role || 'System',
      type, message,
    };
    setAuditLog(prev => [event, ...prev].slice(0, 5000));
  }, [currentUser]);

  // =========================================================================
  // AUTOMATION ENGINE
  // =========================================================================
  const runAutomationRules = useCallback((feature, previousFeature) => {
    if (feature.complianceStatus === 'Blocked' && previousFeature?.complianceStatus !== 'Blocked') {
      setFeatures(prev => prev.map(f =>
        f.id === feature.id ? { ...f, assignee: 'Compliance Officer' } : f
      ));
      addNotification('auto_assign',
        `⚡ Auto-Rule: "${feature.title}" is now BLOCKED. Owner auto-reassigned to Compliance Officer.`
      );
    }

    const rice = parseFloat(feature.riceScore || 0);
    if (rice > 800 && feature.complianceStatus?.includes('Approved') && feature.priority !== 'Critical') {
      setFeatures(prev => prev.map(f =>
        f.id === feature.id ? { ...f, priority: 'Critical' } : f
      ));
      addNotification('high_pri',
        `🔥 Auto-Rule: "${feature.title}" flagged as HIGH PRIORITY (RICE: ${feature.riceScore}, Approved).`
      );
    }

    if (feature.status === 'Delivery' && feature.epicId) {
      setTimeout(() => {
        setFeatures(currentFeatures => {
          const epicFeatures = currentFeatures.filter(f => f.epicId === feature.epicId);
          const allDelivered = epicFeatures.length > 0 && epicFeatures.every(f => f.status === 'Delivery');
          if (allDelivered) {
            const epicName = epics?.find(e => e.id === feature.epicId)?.name || 'Unknown';
            addNotification('epic_done', `🏆 Epic "${epicName}" is 100% complete! All features delivered.`);
          }
          return currentFeatures;
        });
      }, 100);
    }

    const latestComment = (feature.comments || [])[0];
    if (latestComment?.user?.includes('Node') && (!previousFeature?.comments?.length || feature.comments.length > previousFeature.comments.length)) {
      const isBlocked = feature.complianceStatus === 'Blocked';
      addNotification(
        isBlocked ? 'audit_fail' : 'audit_pass',
        `${isBlocked ? '🚨' : '✅'} ${latestComment.user} completed audit on "${feature.title}": ${feature.complianceStatus}`
      );
    }

    if (latestComment && latestComment.text?.includes('@') && (!previousFeature?.comments?.length || feature.comments.length > previousFeature.comments.length)) {
      const mentions = latestComment.text.match(/@\w+/g) || [];
      mentions.forEach(mention => {
        addNotification('mention', `${latestComment.user} mentioned ${mention} in "${feature.title}"`);
      });
    }
  }, [addNotification, epics]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const defaultDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
  }, []);

  const resetForm = useCallback(() => ({
    title: '', description: '', region: 'India (South Asia)', industry: 'FinTech & Banking',
    status: 'Discovery', reach: 500, impact: 1, confidence: 0.8, effort: 10, votes: 0, comments: [],
    assignee: currentUser?.name || 'Unassigned', priority: 'Medium', complianceStatus: 'Pending',
    epicId: '', dependencies: [], history: [],
    startDate: defaultDate(0), endDate: defaultDate(30),
  }), [currentUser]);

  const handleVote = useCallback((e, id) => {
    e.stopPropagation();
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, votes: f.votes + 1 } : f));
  }, []);

  const openNewFeatureModal = useCallback(() => {
    setSelectedFeature(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((feature) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  }, []);

  const handleFeatureSave = useCallback(async (updatedFormData, isEdit) => {
    const previousFeature = isEdit ? features.find(f => f.id === updatedFormData.id) : null;
    if (isEdit) {
      setFeatures(prev => prev.map(f => f.id === updatedFormData.id ? updatedFormData : f));
      addAuditEvent('update', `Updated feature [${updatedFormData.id}] - ${updatedFormData.title}`);
      // Sync to DB
      try { await apiUpdateFeature(updatedFormData.id, updatedFormData); } catch { /* local fallback */ }
    } else {
      setFeatures(prev => [...prev, updatedFormData]);
      addAuditEvent('create', `Created new feature [${updatedFormData.id}] - ${updatedFormData.title}`);
      // Sync to DB
      try { await apiCreateFeature(updatedFormData); } catch { /* local fallback */ }
    }
    runAutomationRules(updatedFormData, previousFeature);
  }, [features, addAuditEvent, runAutomationRules]);

  const deleteFeature = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this feature? This action cannot be undone.")) {
      setFeatures(prev => prev.filter(f => f.id !== id));
      addAuditEvent('delete', `Deleted feature [${id}]`);
      setIsModalOpen(false);
      setSelectedFeature(null);
      // Sync to DB
      try { await deleteFeatureApi(id); } catch { /* local fallback */ }
    }
  }, [addAuditEvent]);

  const resolveRisk = useCallback((id) => {
    if (window.confirm("Override AI evaluation and force approve?")) {
      const previous = features.find(f => f.id === id);
      const updated = { ...previous, complianceStatus: 'Approved' };
      setFeatures(prev => prev.map(f => f.id === id ? updated : f));
      addNotification('system', `🛡️ ${currentUser?.name || 'User'} overrode compliance block on "${previous?.title}"`);
      addAuditEvent('override', `Overrode compliance block and approved feature [${previous?.id}]`);
    }
  }, [features, currentUser, addNotification, addAuditEvent]);

  const moveFeature = useCallback((featureId, newStatus) => {
    const previous = features.find(f => f.id === featureId);
    setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, status: newStatus } : f));
    if (previous) {
      addAuditEvent('update', `Moved feature [${featureId}] from ${previous.status} → ${newStatus}`);
      runAutomationRules({ ...previous, status: newStatus }, previous);
    }
  }, [features, addAuditEvent, runAutomationRules]);

  const handleUpdateDates = useCallback((featureId, startDate, endDate) => {
    setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, startDate, endDate } : f));
  }, []);

  // =========================================================================
  // DERIVED DATA
  // =========================================================================
  const filteredFeatures = features
    .filter(f =>
      f?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f?.assignee || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      f?.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'rice') return parseFloat(b?.riceScore || 0) - parseFloat(a?.riceScore || 0);
      if (sortOption === 'status') return (a?.status || '').localeCompare(b?.status || '');
      return 0;
    });

  const highRiskCount = features.filter(f => f?.complianceStatus === 'Blocked').length;
  const avgRice = features.length > 0 ? (features.reduce((acc, f) => acc + parseFloat(f?.riceScore || 0), 0) / features.length).toFixed(0) : 0;

  // =========================================================================
  // EXPORT FUNCTIONS
  // =========================================================================
  const exportFeaturesCSV = useCallback(() => {
    const headers = ['ID', 'Title', 'Epic', 'Status', 'RICE', 'Compliance', 'Priority', 'Assignee'];
    const csvRows = [headers.join(',')];
    filteredFeatures.forEach(f => {
      const epicName = epics.find(e => e.id === f.epicId)?.name || 'None';
      csvRows.push([
        f.id,
        `"${String(f.title).replace(/"/g, '""')}"`,
        `"${epicName}"`,
        f.status,
        f.riceScore,
        f.complianceStatus,
        f.priority || 'Normal',
        f.assignee || 'Unassigned'
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cynapse_workspace_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addAuditEvent('export', 'Exported workspace features to CSV format.');
  }, [filteredFeatures, epics, addAuditEvent]);

  const exportFeaturesPDF = useCallback(() => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('Cynapse Enterprise — Workspace Backlog Export', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()} by ${currentUser?.name || 'System'}`, 14, 28);

      const tableData = filteredFeatures.map(f => [
        f.id,
        String(f.title).substring(0, 50) + (f.title?.length > 50 ? '...' : ''),
        epics.find(e => e.id === f.epicId)?.name || '-',
        f.status,
        String(f.riceScore),
        f.complianceStatus,
        f.priority || 'Normal'
      ]);

      import('jspdf-autotable').then(() => {
        doc.autoTable({
          startY: 35,
          head: [['ID', 'Title', 'Epic', 'Status', 'RICE', 'Compliance', 'Priority']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8 }
        });
        doc.save('cynapse_workspace_export.pdf');
        addAuditEvent('export', 'Exported workspace features to PDF format.');
      });
    });
  }, [filteredFeatures, epics, currentUser, addAuditEvent]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================
  const value = {
    // Core state
    backendStatus, setBackendStatus,
    users, setUsers,
    currentUser, setCurrentUser,
    features, setFeatures,
    epics, setEpics,
    searchQuery, setSearchQuery,
    sortOption, setSortOption,

    // Settings
    globalApiKey, setGlobalApiKey,
    backendUrl, setBackendUrl,
    pineconeKey, setPineconeKey,
    serpapiKey, setSerpapiKey,
    aiModel, setAiModel,
    customDocs, setCustomDocs,
    uploadedFiles, setUploadedFiles,

    // Vendors
    vendors, setVendors,

    // Notifications
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,

    // Audit
    auditLog,
    addAuditEvent,

    // UI
    isDarkMode, setIsDarkMode,
    isModalOpen, setIsModalOpen,
    selectedFeature, setSelectedFeature,

    // Handlers
    handleLogout,
    resetForm,
    handleVote,
    openNewFeatureModal,
    openEditModal,
    closeModal,
    handleFeatureSave,
    deleteFeature,
    resolveRisk,
    moveFeature,
    handleUpdateDates,
    runAutomationRules,

    // Derived
    filteredFeatures,
    highRiskCount,
    avgRice,

    // Exports
    exportFeaturesCSV,
    exportFeaturesPDF,

    // API keys bundle
    apiKeys: { gemini: globalApiKey, pinecone: pineconeKey, serpapi: serpapiKey },
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
